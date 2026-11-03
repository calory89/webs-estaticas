/* /index/prices/: renders /data/price-index.json and recomputes every chain step from the published changes. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function d(s) { if (!s) return ''; var p = s.split('-'); return +p[2] + ' ' + MON[+p[1] - 1] + (p[0] !== '2026' ? ' ' + p[0] : ''); }
  function n(x) { return (x || 0).toLocaleString('en-US'); }
  function pct(x, dp) { var v = (x - 1) * 100; return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(dp == null ? 2 : dp) + '%'; }
  // recompute one step from its listed changes: geometric mean of (1 + c/100), unchanged pairs count as 1
  function recompute(l) {
    if (l.pairs < 5) return null;
    var s = 0; l.changes_pct.forEach(function (c) { s += Math.log(1 + c / 100); });
    return Math.exp(s / l.pairs);
  }
  var D, cur = '', lastSeries = null, rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (lastSeries) chart(lastSeries); }, 150); });
  function view(m) {
    if (!m) return { name: 'All tracked markets', index: D.all_markets.index, links: D.all_markets.links, gap: D.all_markets.restarted_after_gap_at };
    var x = D.markets.filter(function (y) { return y.market === m; })[0];
    return { name: x.market, index: x.index, links: x.links, gap: x.restarted_after_gap_at };
  }
  function chart(series) {
    var el = $('piCh');
    if (!series.length) { el.innerHTML = '<p class="pi-sub">No step in this market has 5 or more pairs yet, so there is no index.</p>'; return; }
    var W = Math.max(300, Math.round(el.clientWidth || 760)), H = W < 500 ? 220 : 260, L = 46, R = 14, T = 16, B = 34;
    var v = series.map(function (p) { return p.index; });
    var lo = Math.min(99, Math.min.apply(null, v) - 0.2), hi = Math.max(101, Math.max.apply(null, v) + 0.2);
    var x = function (i) { return L + (series.length === 1 ? (W - L - R) / 2 : i * (W - L - R) / (series.length - 1)); };
    var y = function (val) { return T + (hi - val) * (H - T - B) / (hi - lo); };
    var h = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">';
    var step = (hi - lo) > 4 ? 1 : (hi - lo) > 2 ? 0.5 : 0.25;
    for (var g = Math.ceil(lo / step) * step; g <= hi + 1e-9; g += step) {
      h += '<line class="' + (Math.abs(g - 100) < 1e-9 ? 'b' : 'g') + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(g).toFixed(1) + '" y2="' + y(g).toFixed(1) + '"/><text x="' + (L - 8) + '" y="' + (y(g) + 4).toFixed(1) + '" text-anchor="end">' + (+g.toFixed(2)) + '</text>';
    }
    h += '<polyline class="pl" points="' + series.map(function (p, i) { return x(i).toFixed(1) + ',' + y(p.index).toFixed(1); }).join(' ') + '"/>';
    var maxL = Math.max(2, Math.floor((W - L - R) / 62)), every = series.length > maxL ? Math.ceil(series.length / maxL) : 1;
    series.forEach(function (p, i) {
      h += '<circle class="pd" r="4" cx="' + x(i).toFixed(1) + '" cy="' + y(p.index).toFixed(1) + '"><title>' + esc(d(p.date)) + ': ' + p.index.toFixed(3) + (p.pairs ? ' (' + p.pairs + ' pairs)' : ' (base)') + '</title></circle>';
      if (i % every === 0 || i === series.length - 1) h += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 12) + '" text-anchor="middle">' + esc(d(p.date)) + '</text>';
    });
    var last = series[series.length - 1];
    h += '<text class="lab" x="' + Math.min(x(series.length - 1), W - R - 4).toFixed(1) + '" y="' + (y(last.index) - 10).toFixed(1) + '" text-anchor="end">' + last.index.toFixed(2) + '</text>';
    el.innerHTML = h + '</svg>';
    el.setAttribute('aria-label', 'Index from ' + d(series[0].date) + ' (100) to ' + d(last.date) + ' (' + last.index.toFixed(2) + ')');
  }
  function render(m) {
    cur = m || '';
    var V = view(cur);
    $('piChT').textContent = V.name;
    var last = V.index[V.index.length - 1];
    $('piChS').textContent = V.index.length ? 'Base 100 on ' + d(V.index[0].date) + '. Latest ' + last.index.toFixed(2) + ' on ' + d(last.date) + ' (' + pct(last.index / 100) + ' since the base).' + (V.gap ? ' The chain restarts after a thin step ending ' + d(V.gap) + '.' : '') : 'Not indexed: too few same-project pairs.';
    chart(V.index);
    var ok = 0, tot = 0, moves = [];
    $('piLinks').querySelector('tbody').innerHTML = V.links.map(function (l) {
      var rc = recompute(l), chk = '';
      if (l.link != null && V.gap && l.to <= V.gap) chk = '<span class="muted">before the gap, not chained</span>';
      else if (l.link != null) { tot++; if (rc != null && Math.abs(rc - l.link) < 5e-5) { ok++; chk = '<span class="pi-ok">matches</span>'; } else chk = '<span class="pi-no">differs</span>'; }
      else chk = '<span class="muted">too thin, not chained</span>';
      l.changes_pct.forEach(function (c) { moves.push([c, l.to]); });
      return '<tr><td>' + esc(d(l.from)) + '</td><td>' + esc(d(l.to)) + '</td><td class="n">' + n(l.pairs) + '</td><td class="n">' + n(l.unchanged) + '</td><td class="n">' + n(l.up) + '</td><td class="n">' + n(l.down) + '</td><td class="n">' + n(l.excluded_jump + l.excluded_currency) + '</td><td class="n">' + (l.link != null ? pct(l.link, 3) : '–') + '</td><td>' + chk + '</td></tr>';
    }).join('');
    $('piRe').textContent = tot ? 'Your browser recomputed ' + tot + ' chained step' + (tot === 1 ? '' : 's') + ' from the listed changes: ' + ok + ' of ' + tot + ' match the published values (changes are published rounded to 0.001%). "Left out" counts jumps over 25% and currency changes.' : '';
    moves.sort(function (a, b) { return a[0] - b[0]; });
    $('piMoves').innerHTML = moves.length ? moves.map(function (x) { return '<span class="' + (x[0] > 0 ? 'u' : 'd') + '" title="step ending ' + esc(d(x[1])) + '">' + (x[0] > 0 ? '+' : '−') + Math.abs(x[0]).toFixed(2) + '%</span>'; }).join('') : '<span>No price moved in this view.</span>';
    $('piSel').value = cur;
    lastSeries = V.index;
    Array.prototype.forEach.call(document.querySelectorAll('#piMk tbody tr'), function (tr) { tr.classList.toggle('on', tr.getAttribute('data-m') === cur); });
  }
  function boot(j) {
    D = j;
    var idx = D.markets.filter(function (m) { return m.index.length; });
    var thin = D.markets.filter(function (m) { return !m.index.length; });
    $('piK1').textContent = idx.length;
    $('piK2').textContent = n(D.all_markets.pairs_total);
    $('piK3').textContent = n(D.all_markets.links.reduce(function (a, l) { return a + l.up + l.down; }, 0));
    $('piK4').textContent = D.snapshots.length;
    $('piStart').textContent = d(D.history_starts) + ' ' + D.history_starts.slice(0, 4);
    $('piWarn').textContent = 'Our history starts on ' + d(D.history_starts) + ' ' + D.history_starts.slice(0, 4) + ', so this index covers ' + D.snapshots.length + ' snapshots and rests on thin counts. It measures advertised asking prices, not what buyers pay. It is not a forecast and is never extended past the last snapshot (' + d(D.generated) + ').';
    var sel = $('piSel');
    idx.forEach(function (m) { var o = document.createElement('option'); o.value = m.market; o.textContent = m.market; sel.appendChild(o); });
    sel.addEventListener('change', function () { render(sel.value); });
    $('piMk').querySelector('tbody').innerHTML = idx.map(function (m) {
      var last = m.index[m.index.length - 1];
      return '<tr data-m="' + esc(m.market) + '"><td><button type="button">' + esc(m.market) + '</button></td><td>' + esc(d(m.index[0].date)) + '</td><td class="n">' + last.index.toFixed(2) + '</td><td class="n">' + n(m.pairs_total) + '</td><td class="n">' + m.links.reduce(function (a, l) { return a + l.up; }, 0) + ' / ' + m.links.reduce(function (a, l) { return a + l.down; }, 0) + '</td><td class="n">' + n(m.excluded_total) + '</td></tr>';
    }).join('');
    $('piMk').addEventListener('click', function (e) { var tr = e.target.closest('tr[data-m]'); if (tr) { render(tr.getAttribute('data-m')); $('piChT').scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
    $('piThin').textContent = thin.length + ' more markets have some same-project pairs but no step with 5 or more, so they are not indexed: ' + thin.map(function (m) { return m.market + ' (' + m.pairs_total + ')'; }).join(', ') + '.';
    $('piOff').innerHTML = (D.official_reference || []).map(function (o) {
      return '<div class="pi-off"><h3>' + esc(o.market) + ': ' + esc(o.what) + '</h3><p class="pi-fine">' + esc(o.source) + (o.filter ? '. Filter: ' + esc(o.filter) : '') + '. <a href="' + esc(o.url) + '" rel="noopener" target="_blank">Source</a></p>' +
        '<div class="pi-tw"><table class="pi-t"><thead><tr><th>Month</th><th class="n">Registered sales</th><th class="n">Median (' + esc(o.currency) + ')</th></tr></thead><tbody>' +
        o.monthly.map(function (x) { return '<tr><td>' + esc(x.month) + '</td><td class="n">' + n(x.n) + '</td><td class="n">' + n(Math.round(x.median_local)) + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
    }).join('') || '<p>No official monthly series is connected yet.</p>';
    $('piIn').textContent = D.inputs.map(function (i) { return i.file + ' ' + i.sha256.slice(0, 12) + '…'; }).join(', ');
    var q = ''; try { q = new URLSearchParams(location.search).get('market') || ''; } catch (e) {}
    render(idx.some(function (m) { return m.market === q; }) ? q : '');
  }
  fetch('/data/price-index.json?d=' + new Date().toISOString().slice(0, 10), { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(boot).catch(function () { $('piChS').textContent = 'The index file could not be loaded. It is rebuilt every day; please try again later.'; });
})();
