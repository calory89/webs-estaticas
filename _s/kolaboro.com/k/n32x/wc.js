/* kolaboro.com /watch/website-changes/ (n32x, batch 32): side-by-side view of the changed passages of one project page,
   read from /data/website-changes.json (precomputed word marks: [0, same] [1, changed]). */
(function () {
  'use strict';
  var A = document.getElementById('n32-app'); if (!A) return;
  var M = JSON.parse(document.getElementById('n32-t').textContent), L = M._loc || 'en-GB';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var fill = function (s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); };
  var fd = function (d) { try { return new Intl.DateTimeFormat(L, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(d + 'T12:00:00Z')); } catch (e) { return d; } };
  A.innerHTML = '<style>.wc-d{border:1px solid var(--line,#d5d3cc);border-radius:12px;padding:10px 14px;margin:10px 0}.wc-g{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:8px 0;border-bottom:1px solid var(--line,#eee);padding-bottom:8px}.wc-g>div{font-size:.92rem;line-height:1.5;overflow-wrap:anywhere}.wc-g del{background:#FDE2E1;text-decoration:line-through}.wc-g ins{background:#D6F5E6;text-decoration:none}:root[data-theme=dark] .wc-g del{background:#5A2420}:root[data-theme=dark] .wc-g ins{background:#1E4D3A}.wc-h{font-weight:700;font-size:.85rem}@media (max-width:640px){.wc-g{grid-template-columns:1fr}}</style><div id="wc-v" aria-live="polite"></div>';
  var D = null, v = document.getElementById('wc-v');
  function seg(a, tag) { return a.map(function (x) { return x[0] ? '<' + tag + '>' + esc(x[1]) + '</' + tag + '>' : esc(x[1]); }).join(''); }
  function show(i, row) {
    var x = D.items[i]; if (!x) return;
    var h = '<div class="wc-d" id="wc-open"><p><b>' + esc(x.n) + '</b> <span class="k-xs">' + esc(x.url) + '</span> <button type="button" class="kbtn" data-close="1">' + esc(M.close) + '</button></p>' +
      '<div class="wc-g"><div class="wc-h">' + esc(fill(M.old, { d: fd(x.a.d) })) + '</div><div class="wc-h">' + esc(fill(M.new, { d: fd(x.b.d) })) + '</div></div>' +
      x.ch.map(function (c) { return '<div class="wc-g"><div>' + seg(c.a, 'del') + '</div><div>' + seg(c.b, 'ins') + '</div></div>'; }).join('') + (x.more ? '<p class="k-xs">' + esc(fill(M.more, { n: x.more })) + '</p>' : '') + '</div>';
    var tr = document.createElement('tr'), td = document.createElement('td'); td.colSpan = 5; td.innerHTML = h; tr.className = 'wc-row'; tr.appendChild(td);
    var old = document.querySelector('tr.wc-row'); if (old) old.remove();
    row.parentNode.insertBefore(tr, row.nextSibling); td.querySelector('button').focus();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-i],button[data-close]'); if (!b) return;
    if (b.hasAttribute('data-close')) { var r = b.closest('tr.wc-row'); if (r) r.remove(); return; }
    var i = +b.getAttribute('data-i'), row = b.closest('tr');
    (D ? Promise.resolve(D) : fetch('/data/website-changes.json').then(function (r) { return r.json(); }).then(function (d) { D = d; return d; })).then(function () { show(i, row); });
  });
})();
