/* Off-plan Transparency Index page logic */
(function () {
  var $ = function (i) { return document.getElementById(i); };
  var K = window.KTI; if (!K) return;
  var SITE = 'https://kolaboro.com', PAGE = SITE + '/transparency-index/';
  var R = null, rows = [], key = 'rank', dir = 1, country = '';
  var esc = K.esc, pct = K.pct;

  function bar(r) {
    return '<span class="ti-bar" aria-hidden="true"><i class="bd" style="width:' + r.pD.toFixed(2) + '%"></i><i class="bv" style="width:' + r.pV.toFixed(2) + '%"></i><i class="bf" style="width:' + r.pF.toFixed(2) + '%"></i></span>';
  }
  function comp(r) { return '<span class="cd">' + r.pD.toFixed(1) + '</span> + <span class="cv">' + r.pV.toFixed(1) + '</span> + <span class="cf">' + r.pF.toFixed(1) + '</span>'; }
  function compT(r) { return 'Disclosure ' + r.pD.toFixed(1) + ' + confirmed ' + r.pV.toFixed(1) + ' + no flags ' + r.pF.toFixed(1); }
  function card(r) {
    return '<li><span class="r">#' + r.rank + '</span><span class="m">' + esc(r.market) + '<small>' + esc(r.country) + ', ' + r.projects + ' projects</small></span><span class="x" aria-label="Index ' + r.index.toFixed(1) + ' of 100">' + r.index.toFixed(1) + '</span>' + bar(r) + '</li>';
  }
  function median(a) { if (!a.length) return 0; var s = a.slice().sort(function (x, y) { return x - y; }), h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; }

  function draw() {
    var list = rows.filter(function (r) { return !country || r.country === country; });
    list.sort(function (a, b) {
      var x = a[key], y = b[key], c = typeof x === 'string' ? x.localeCompare(y) : x - y;
      return (c || a.rank - b.rank) * dir;
    });
    $('tit').querySelector('tbody').innerHTML = list.length ? list.map(function (r) {
      return '<tr><td class="rk">' + r.rank + '</td><td class="l mk"><a href="/m/?market=' + encodeURIComponent(r.market) + '">' + esc(r.market) + '</a>' + (r.projects < 10 ? ' <small class="ti-ss" title="Fewer than 10 projects: treat this rank as indicative">small sample</small>' : '') + '</td>' +
        '<td class="l ix" title="' + compT(r) + '"><span class="ixw"><b>' + r.index.toFixed(1) + '</b>' + bar(r) + '<small>' + comp(r) + '</small><span class="ti-sr">' + compT(r) + '</span></span></td>' +
        '<td class="l">' + esc(r.country) + '</td><td>' + r.projects + '</td>' +
        '<td>' + r.avgChecks.toFixed(1) + '</td><td>' + pct(r.permitP) + '</td><td>' + pct(r.escrowP) + '</td><td>' + pct(r.conf4P) + '</td><td class="' + (r.flagged ? '' : 'fl0') + '">' + r.flagged + '</td></tr>';
    }).join('') : '<tr><td colspan="10" class="l">No ranked markets in this country yet.</td></tr>';
    $('t-count').textContent = country ? list.length + ' of ' + rows.length + ' markets in ' + country : rows.length + ' markets';
    [].forEach.call($('tit').querySelectorAll('th'), function (th) {
      if (th.dataset.k === key) th.setAttribute('aria-sort', dir > 0 ? 'ascending' : 'descending'); else th.removeAttribute('aria-sort');
    });
  }

  function csv() {
    if (!R) return;
    var head = ['rank', 'market', 'country', 'projects', 'index', 'disclosure_points', 'confirmed_points', 'no_flags_points', 'avg_disclosure_0_1', 'avg_confirmed_0_1', 'share_without_flags', 'avg_checks_of_6', 'pct_permit_public', 'pct_deposit_protection', 'pct_confirmed_4plus', 'projects_with_flags', 'data_updated'];
    var q = function (v) { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var lines = [head.join(',')].concat(R.rows.map(function (r) {
      return [r.rank, r.market, r.country, r.projects, r.index.toFixed(1), r.pD.toFixed(2), r.pV.toFixed(2), r.pF.toFixed(2), r.disclosure.toFixed(4), r.confirmed.toFixed(4), r.noflags.toFixed(4), r.avgChecks.toFixed(2),
        Math.round(r.permitP * 100), Math.round(r.escrowP * 100), Math.round(r.conf4P * 100), r.flagged, R.updated].map(q).join(',');
    }));
    var blob = new Blob(['﻿' + lines.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'kolaboro-transparency-index-' + (R.updated || 'latest') + '.csv';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function copy(text, msgEl, ok) {
    var done = function () { msgEl.textContent = ok; setTimeout(function () { msgEl.textContent = ''; }, 3000); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    function fallback() {
      var t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { msgEl.textContent = 'Select the text and copy it.'; } t.remove();
    }
  }

  function embedCode(m) { return '<iframe src="' + SITE + '/embed/?m=' + encodeURIComponent(m) + '" title="Off-plan Transparency Index: ' + esc(m) + '" width="100%" height="320" style="border:0;max-width:640px" loading="lazy"></iframe>'; }
  function setEmbed(m) {
    $('e-code').value = embedCode(m);
    var local = '/embed/?m=' + encodeURIComponent(m);
    $('e-open').href = local;
    $('e-frame').src = local;
    $('e-frame').title = 'Transparency Index widget preview: ' + m;
  }

  function init(d) {
    R = K.compute(d); rows = R.rows;
    var upd = K.fmtDate(R.updated);
    $('n-markets').textContent = rows.length;
    $('n-projects').textContent = R.covered.toLocaleString('en');
    $('n-median').textContent = median(rows.map(function (r) { return r.index; })).toFixed(1);
    $('n-updated').textContent = upd || 'n/a';
    $('top5').innerHTML = rows.slice(0, 5).map(card).join('');
    $('bot5').innerHTML = rows.slice(-5).reverse().map(card).join('');
    var cs = {}; rows.forEach(function (r) { cs[r.country] = (cs[r.country] || 0) + 1; });
    $('f-country').innerHTML = '<option value="">All countries (' + rows.length + ')</option>' + Object.keys(cs).sort().map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + ' (' + cs[c] + ')</option>'; }).join('');
    $('cite-text').textContent = 'Kolaboro (' + (R.updated || '').slice(0, 4) + '). Off-plan Transparency Index. Data updated ' + upd + '. ' + rows.length + ' markets, ' + R.covered + ' projects. ' + PAGE;
    var byName = rows.slice().sort(function (a, b) { return a.market.localeCompare(b.market); });
    var em = $('e-market'), pre = 'Bali';
    try { var h = /[?&]m=([^&]+)/.exec(location.search); if (h) pre = decodeURIComponent(h[1].replace(/\+/g, ' ')); } catch (e) {}
    if (!rows.some(function (r) { return r.market === pre; })) pre = rows[0] ? rows[0].market : '';
    em.innerHTML = byName.map(function (r) { return '<option value="' + esc(r.market) + '"' + (r.market === pre ? ' selected' : '') + '>' + esc(r.market) + ' (' + esc(r.country) + ')</option>'; }).join('');
    if (pre) setEmbed(pre);
    draw();
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('tit').querySelector('thead').addEventListener('click', function (e) {
      var th = e.target.closest('th'); if (!th) return; var k = th.dataset.k;
      if (key === k) dir = -dir; else { key = k; dir = (k === 'rank' || k === 'market' || k === 'country') ? 1 : -1; }
      draw();
    });
    $('f-country').addEventListener('change', function () { country = this.value; draw(); });
    $('dl-csv').addEventListener('click', csv);
    $('dl-csv2').addEventListener('click', csv);
    $('cite-copy').addEventListener('click', function () { copy($('cite-text').textContent, $('cite-msg'), 'Citation copied.'); });
    $('e-copy').addEventListener('click', function () { copy($('e-code').value, $('e-msg'), 'Embed code copied.'); });
    $('e-market').addEventListener('change', function () { setEmbed(this.value); });
    $('e-code').addEventListener('focus', function () { this.select(); });
    $('top5').innerHTML = $('bot5').innerHTML = '<li class="sk"></li><li class="sk"></li><li class="sk"></li><li class="sk"></li><li class="sk"></li>';
    fetch(K.dataUrl()).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(init).catch(function () {
      $('tit').querySelector('tbody').innerHTML = '<tr><td colspan="10" class="l">The data could not load. Try again in a moment, or open the <a href="/data/bali-cases.json">raw JSON</a>.</td></tr>';
      $('top5').innerHTML = $('bot5').innerHTML = '';
    });
  });
})();
