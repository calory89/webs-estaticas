// Investor dossier: renders /api/x/l/dossier. Numbers come only from that answer; nothing is computed here except formatting.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (t) { var x = document.createElement('i'); x.textContent = t == null ? '' : String(t); return x.innerHTML; };
  var b = $('ds-print'); if (b) b.addEventListener('click', function () { window.print(); });
  function num(v, unit) {
    if (unit === 'USD') return '$' + (v < 1 ? v.toFixed(4).replace(/0+$/, '').replace(/\.$/, '') : v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    return (+v).toLocaleString('en-US') + (unit === '%' ? '%' : '');
  }
  function when(t) {
    if (!t) return 'no timestamp';
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return new Date(t + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    var d = new Date(t); return isNaN(d) ? String(t) : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
  }
  function src(s) {
    if (!s) return 'no public source';
    return s.split(' + ').map(function (p) { return '<a href="' + esc(p) + '">' + esc(p) + '</a>'; }).join(' + ');
  }
  var tip = document.createElement('div'); tip.className = 'ds-tip'; tip.setAttribute('role', 'status'); document.body.appendChild(tip);
  function chart(s) {
    var pts = s.points.filter(function (p) { return p.v != null; }), W = 520, Hh = 150, pad = 22, n = pts.length;
    if (!n) return '<p class="ds-src">No data points yet.</p>';
    var max = Math.max.apply(null, pts.map(function (p) { return p.v; })) || 1, bw = Math.min(56, (W - 8) / n - 6), gap = ((W - 8) - bw * n) / Math.max(n, 1);
    var bars = pts.map(function (p, i) {
      var x = 4 + gap / 2 + i * (bw + gap), h = Math.max(2, (p.v / max) * (Hh - pad - 14)), y = Hh - pad - h, lab = p.d.slice(5).replace('-', '/');
      var t = when(p.d) + ': ' + (s.id.indexOf('spend') >= 0 ? '$' + p.v : p.v) + (p.n != null ? ' (' + p.n + (s.id === 'uptime_daily' ? ' probes' : ' calls') + ')' : '') + (p.pass != null ? ', ' + p.pass + ' passed every case' : '');
      return '<g><rect class="h" x="' + (x - gap / 2) + '" y="0" width="' + (bw + gap) + '" height="' + (Hh - pad) + '" data-t="' + esc(t) + '"></rect>' +
        '<rect class="b" tabindex="0" x="' + x + '" y="' + y + '" width="' + bw + '" height="' + h + '" rx="3" data-t="' + esc(t) + '" aria-label="' + esc(t) + '"></rect>' +
        (n <= 12 || i % Math.ceil(n / 8) === 0 ? '<text x="' + (x + bw / 2) + '" y="' + (Hh - 6) + '" text-anchor="middle">' + esc(lab) + '</text>' : '') + '</g>';
    }).join('');
    var top = '<text x="4" y="10">max ' + esc(s.id.indexOf('spend') >= 0 ? '$' + max : max) + '</text><line x1="0" x2="' + W + '" y1="' + (Hh - pad) + '" y2="' + (Hh - pad) + '" stroke="rgba(23,33,43,.25)"/>';
    return '<svg viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="' + esc(s.label) + ', ' + n + ' points">' + top + bars + '</svg>';
  }
  document.addEventListener('mouseover', function (e) { var t = e.target.getAttribute && e.target.getAttribute('data-t'); if (!t) { tip.style.display = 'none'; return; } tip.textContent = t; tip.style.display = 'block'; });
  document.addEventListener('mousemove', function (e) { if (tip.style.display === 'block') { tip.style.left = Math.min(e.clientX + 12, window.innerWidth - tip.offsetWidth - 8) + 'px'; tip.style.top = (e.clientY + 14) + 'px'; } });
  document.addEventListener('focusin', function (e) { var t = e.target.getAttribute && e.target.getAttribute('data-t'); if (!t) return; var r = e.target.getBoundingClientRect(); tip.textContent = t; tip.style.display = 'block'; tip.style.left = Math.max(8, Math.min(r.left, window.innerWidth - tip.offsetWidth - 8)) + 'px'; tip.style.top = (r.bottom + 6) + 'px'; });
  document.addEventListener('focusout', function () { tip.style.display = 'none'; });

  fetch('/api/x/l/dossier').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
    $('ds-meta').innerHTML = 'Computed ' + esc(when(d.generated_at)) + '. ' + esc(d.rules) + ' Signed raw answer: <a href="/api/x/l/dossier">/api/x/l/dossier</a>';
    $('ds-gen2').textContent = ', generated ' + when(d.generated_at);
    $('ds-grid').innerHTML = (d.metrics || []).map(function (m) {
      var has = m.value != null;
      var unit = has && m.unit && m.unit !== '%' && m.unit !== 'USD' ? '<small>' + esc(m.unit) + '</small>' : '';
      return '<div class="ds-m' + (has ? '' : ' ds-none') + '"><b>' + (has ? esc(num(m.value, m.unit)) + unit : 'Not measured yet') + '</b><h3>' + esc(m.label) + '</h3>' +
        (m.note ? '<p>' + esc(m.note) + '</p>' : '') + '<p class="ds-src">Source: ' + src(m.source) + (m.as_of ? ', as of ' + esc(when(m.as_of)) : '') + '</p></div>';
    }).join('');
    $('ds-series').innerHTML = (d.series || []).map(function (s) {
      var rows = s.points.map(function (p) { return '<tr><td>' + esc(p.d) + '</td><td>' + esc(p.v) + '</td>' + (p.n != null ? '<td>' + esc(p.n) + '</td>' : '') + (p.pass != null ? '<td>' + esc(p.pass) + ' passed</td>' : '') + '</tr>'; }).join('');
      return '<div class="ds-s"><h3>' + esc(s.label) + '</h3><p class="ds-src">Source: ' + src(s.source) + ', ' + s.points.length + ' day' + (s.points.length === 1 ? '' : 's') + ' of history</p>' + chart(s) +
        '<details><summary>Table</summary><table><tbody>' + rows + '</tbody></table></details></div>';
    }).join('');
  }).catch(function () {
    $('ds-meta').textContent = 'The live data did not answer just now, so no numbers are shown (we never show cached or typed-in figures instead). Try again in a minute, or open /api/x/l/dossier directly.';
  });
})();
