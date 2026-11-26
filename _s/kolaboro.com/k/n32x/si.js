/* kolaboro.com /satellite/construction-index/ (n32x, batch 32): chart of one project's built-up change index over time (SVG, no library),
   from /data/construction-index.json: monthly index (dots), smoothed line, construction start and handover on record. */
(function () {
  'use strict';
  var A = document.getElementById('n32-app'); if (!A) return;
  var M = JSON.parse(document.getElementById('n32-t').textContent), L = M._loc || 'en-GB';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var fill = function (s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); };
  A.innerHTML = '<style>.si-c{border:1px solid var(--line,#d5d3cc);border-radius:12px;padding:10px;margin:8px 0;overflow-x:auto}.si-c svg{display:block;width:100%;min-width:560px;height:auto}.si-c text{font:11px system-ui,sans-serif;fill:currentColor}.si-lg{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:.85rem}</style>';
  var D = null;
  function mi(s) { if (!s) return null; var m = /^(\d{4})(?:-(\d{2}))?(?:-Q([1-4]))?/.exec(String(s)); if (!m) return null; return +m[1] * 12 + (m[2] ? +m[2] : m[3] ? +m[3] * 3 : 12); }
  function chart(x) {
    var n = x.i.length, m0 = mi(x.m0), W = 900, H = 260, l = 44, r = 12, t = 14, b = 30, lo = -40, hi = 80;
    x.i.forEach(function (v) { if (v != null) { lo = Math.min(lo, v); hi = Math.max(hi, v); } });
    var X = function (i) { return l + i / (n - 1) * (W - l - r); }, Y = function (v) { return t + (hi - v) / (hi - lo) * (H - t - b); };
    var g = '';
    for (var v = Math.ceil(lo / 20) * 20; v <= hi; v += 20) g += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="currentColor" stroke-opacity="' + (v === 0 ? .45 : .12) + '"/><text x="' + (l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + v + '</text>';
    for (var i = 0; i < n; i++) { var mm = m0 + i - 1; if (mm % 12 === 0) g += '<text x="' + X(i) + '" y="' + (H - 10) + '" text-anchor="middle">' + Math.floor(mm / 12) + '</text>'; }
    g += '<rect x="' + l + '" y="' + Y(15) + '" width="' + (W - l - r) + '" height="' + (Y(-15) - Y(15)) + '" fill="currentColor" fill-opacity=".05"/>';
    var mark = function (s, lab, col) { var k = mi(s); if (k == null) return ''; var i = k - m0; if (i < 0 || i >= n) return ''; return '<line x1="' + X(i) + '" x2="' + X(i) + '" y1="' + t + '" y2="' + (H - b) + '" stroke="' + col + '" stroke-dasharray="4 3"/><text x="' + (X(i) + 4) + '" y="' + (t + 10) + '" fill="' + col + '" style="fill:' + col + '">' + esc(lab) + '</text>'; };
    g += mark(x.cs, M.cs, '#2F6FDE') + mark(x.ho, M.ho, '#9A5B00');
    x.i.forEach(function (v, i) { if (v != null) g += '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="2" fill="currentColor" fill-opacity=".35"/>'; });
    var p = '', go = 0; x.sm.forEach(function (v, i) { if (v == null) return; p += (go ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); go = 1; });
    g += '<path d="' + p + '" fill="none" stroke="#FF5B14" stroke-width="2"/>';
    return '<div class="si-c" id="si-open"><p><b>' + esc(x.n) + '</b> <span class="k-xs">' + esc(x.mk) + ' · ' + esc(fill(M.clear, { n: x.clear })) + '</span> <button type="button" class="kbtn" data-close="1">' + esc(M.close) + '</button></p><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(M.idx + ': ' + x.n) + '" dir="ltr">' + g + '</svg><div class="si-lg"><span>● ' + esc(M.raw) + '</span><span style="color:#FF5B14">━ ' + esc(M.sm) + '</span><span>' + esc(M.idx) + '</span></div></div>';
  }
  document.addEventListener('click', function (e) {
    var bt = e.target.closest('button[data-i],button[data-close]'); if (!bt) return;
    if (bt.hasAttribute('data-close')) { var rr = bt.closest('tr.si-row'); if (rr) rr.remove(); return; }
    var i = +bt.getAttribute('data-i'), row = bt.closest('tr');
    (D ? Promise.resolve(D) : fetch('/data/construction-index.json').then(function (r) { return r.json(); }).then(function (d) { D = d; return d; })).then(function () {
      var tr = document.createElement('tr'), td = document.createElement('td'); td.colSpan = 6; td.innerHTML = chart(D.projects[i]); tr.className = 'si-row'; tr.appendChild(td);
      var old = document.querySelector('tr.si-row'); if (old) old.remove(); row.parentNode.insertBefore(tr, row.nextSibling); td.querySelector('button').focus();
    });
  });
  var q = new URLSearchParams(location.search).get('p');
  if (q) { var b = document.querySelector('tr[data-s="' + q.replace(/[^a-z0-9-]/g, '') + '"] button[data-i]'); if (b) { b.scrollIntoView({ block: 'center' }); b.click(); } }
})();
