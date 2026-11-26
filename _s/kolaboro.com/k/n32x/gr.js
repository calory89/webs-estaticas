/* kolaboro.com /graph/entities/ (n32x, batch 32): developer, registered company, escrow bank, project and market graph on a canvas.
   Layout is precomputed in /data/entity-graph.json (x, y in 0..1000). Tap or click a node to light up its links; ?n=d:<developer-slug>
   or ?n=p:<project-slug> opens with that node selected. */
(function () {
  'use strict';
  var A = document.getElementById('n32-app'); if (!A) return;
  var M = JSON.parse(document.getElementById('n32-t').textContent), L = M._loc || 'en-GB', l = M._l || 'en', P = l === 'en' ? '' : '/' + l;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var fill = function (s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); };
  var fold = function (s) { return String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, ''); };
  var COL = { p: '#7A8794', d: '#FF5B14', c: '#2F6FDE', b: '#0B7A55', m: '#9A5B00' };
  var css = '<style>.gr-w{position:relative;border:1px solid var(--line,#d5d3cc);border-radius:14px;overflow:hidden;background:var(--card,#fff)}.gr-w canvas{display:block;width:100%;height:min(70vh,640px);touch-action:none;cursor:grab}.gr-top{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 8px}.gr-top input{flex:1 1 260px}.gr-sug{list-style:none;margin:0;padding:0;border:1px solid var(--line,#d5d3cc);border-radius:10px;max-height:260px;overflow:auto}.gr-sug li button{display:block;width:100%;text-align:start;background:none;border:0;border-bottom:1px solid var(--line,#eee);padding:8px 10px;min-height:44px;color:inherit;font:inherit;cursor:pointer}.gr-lg{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:.85rem;margin:8px 0}.gr-lg i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-inline-end:5px;vertical-align:middle}.gr-pn{margin-top:10px;border:1px solid var(--line,#d5d3cc);border-radius:12px;padding:10px 14px}.gr-pn ul{columns:2 240px;padding-inline-start:18px;margin:6px 0}</style>';
  A.innerHTML = css + '<div class="gr-top"><input type="search" id="gr-q" placeholder="' + esc(M.ph) + '" aria-label="' + esc(M.ph) + '" autocomplete="off"><button type="button" class="kbtn" id="gr-reset">' + esc(M.reset) + '</button></div><ul class="gr-sug" id="gr-sug" hidden></ul>' +
    '<div class="gr-lg">' + ['p', 'd', 'c', 'b', 'm'].map(function (k) { return '<span><i style="background:' + COL[k] + '"></i>' + esc(M.types[k]) + '</span>'; }).join('') + '</div>' +
    '<div class="gr-w"><canvas id="gr-c" role="img" aria-label="' + esc(M.hint) + '"></canvas></div><p class="k-xs" id="gr-st">' + esc(M.loading) + '</p><div class="gr-pn" id="gr-pn" hidden aria-live="polite"></div>';
  var $ = function (id) { return document.getElementById(id); }, cv = $('gr-c'), ctx = cv.getContext('2d'), G = null, adj = [], deg = [], sel = -1, nb = new Set();
  var view = { s: 1, x: 0, y: 0 }, W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1), raf = 0, dark = function () { return document.documentElement.getAttribute('data-theme') === 'dark'; };
  function size() { var r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; draw(); }
  function fit() { var m = 20, s = Math.min((W - 2 * m) / 1000, (H - 2 * m) / 1000); view = { s: s, x: (W - 1000 * s) / 2, y: (H - 1000 * s) / 2 }; }
  var sx = function (x) { return x * view.s + view.x; }, sy = function (y) { return y * view.s + view.y; };
  function draw() { if (raf || !G) return; raf = requestAnimationFrame(function () { raf = 0; paint(); }); }
  function paint() {
    var N = G.nodes, E = G.edges; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 0.6; ctx.strokeStyle = dark() ? 'rgba(200,210,220,.10)' : 'rgba(23,33,43,.08)'; ctx.beginPath();
    for (var i = 0; i < E.length; i++) { var a = N[E[i][0]], b = N[E[i][1]]; ctx.moveTo(sx(a[2]), sy(a[3])); ctx.lineTo(sx(b[2]), sy(b[3])); } ctx.stroke();
    if (sel >= 0) { ctx.lineWidth = 1.4; ctx.strokeStyle = '#FF5B14'; ctx.beginPath(); adj[sel].forEach(function (j) { ctx.moveTo(sx(N[sel][2]), sy(N[sel][3])); ctx.lineTo(sx(N[j][2]), sy(N[j][3])); }); ctx.stroke(); }
    for (var k = 0; k < N.length; k++) { var n = N[k], r = Math.max(1.5, Math.min(9, 1.2 + Math.sqrt(deg[k]) * 0.9)) * Math.max(0.7, Math.min(2.2, Math.sqrt(view.s * 1.4)));
      ctx.globalAlpha = sel < 0 || k === sel || nb.has(k) ? 1 : 0.18; ctx.fillStyle = COL[n[0]]; ctx.beginPath(); ctx.arc(sx(n[2]), sy(n[3]), r, 0, 6.2832); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.font = '12px system-ui,sans-serif'; ctx.fillStyle = dark() ? '#E9E7E0' : '#17212B';
    var lab = sel >= 0 ? [sel].concat(Array.from(nb).slice(0, 40)) : N.map(function (n, i) { return i; }).filter(function (i) { return N[i][0] !== 'p' && deg[i] >= (view.s > 1.5 ? 6 : 25); });
    lab.forEach(function (i) { var n = N[i]; ctx.fillText(n[1].length > 34 ? n[1].slice(0, 33) + '…' : n[1], sx(n[2]) + 6, sy(n[3]) - 5); });
  }
  function pick(px, py) { var best = -1, bd = 14 * 14; G.nodes.forEach(function (n, i) { var dx = sx(n[2]) - px, dy = sy(n[3]) - py, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i; } }); return best; }
  function href(n) { return n[0] === 'p' ? P + '/projects/' + n[4] + '/' : n[0] === 'd' ? P + '/developers/' + n[4] + '/' : null; }
  function select(i, center) {
    sel = i; nb = new Set(i >= 0 ? adj[i] : []);
    var pn = $('gr-pn'); if (i < 0) { pn.hidden = true; draw(); return; }
    var n = G.nodes[i], h = href(n), list = adj[i].slice().sort(function (a, b) { return deg[b] - deg[a]; });
    pn.innerHTML = '<p><b>' + esc(n[1]) + '</b> <span class="k-xs">' + esc(M.types[n[0]]) + (n[5] ? ' · ' + esc(n[5]) : '') + ' · ' + esc(fill(M.links, { n: adj[i].length })) + '</span>' + (h ? ' · <a href="' + esc(h) + '">' + esc(M.open) + '</a>' : '') + '</p><p class="k-xs">' + esc(M.nb) + '</p><ul>' +
      list.slice(0, 120).map(function (j) { var m = G.nodes[j]; return '<li><button type="button" class="kbtn" data-j="' + j + '" style="min-height:32px;padding:2px 8px;font-size:.88rem">' + esc(m[1]) + '</button> <span class="k-xs">' + esc(M.types[m[0]]) + '</span></li>'; }).join('') + '</ul>';
    pn.hidden = false;
    if (center) { view.s = Math.max(view.s, 3); view.x = W / 2 - n[2] * view.s; view.y = H / 2 - n[3] * view.s; }
    draw();
  }
  fetch('/data/entity-graph.json').then(function (r) { return r.json(); }).then(function (g) {
    G = g; adj = g.nodes.map(function () { return []; }); g.edges.forEach(function (e) { adj[e[0]].push(e[1]); adj[e[1]].push(e[0]); }); deg = adj.map(function (a) { return a.length; });
    G.f = g.nodes.map(function (n) { return fold(n[1]); });
    size(); fit(); draw(); $('gr-st').textContent = M.hint;
    var q = new URLSearchParams(location.search).get('n'); if (q) { var k = q.split(':'), i = g.nodes.findIndex(function (n) { return n[0] === k[0] && n[4] === k.slice(1).join(':'); }); if (i >= 0) select(i, true); }
  }).catch(function (e) { $('gr-st').textContent = String(e); });
  window.addEventListener('resize', function () { if (G) { size(); } });
  // pointer: drag to pan, tap to select, wheel and pinch to zoom
  var pts = new Map(), moved = false, last = null, pinch = 0;
  cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.offsetX, e.offsetY]); moved = false; last = [e.offsetX, e.offsetY]; if (pts.size === 2) { var a = Array.from(pts.values()); pinch = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); } });
  cv.addEventListener('pointermove', function (e) { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.offsetX, e.offsetY]);
    if (pts.size === 2) { var a = Array.from(pts.values()), d = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); if (pinch) zoom((a[0][0] + a[1][0]) / 2, (a[0][1] + a[1][1]) / 2, d / pinch); pinch = d; moved = true; return; }
    var dx = e.offsetX - last[0], dy = e.offsetY - last[1]; if (Math.abs(dx) + Math.abs(dy) > 3) moved = true; view.x += dx; view.y += dy; last = [e.offsetX, e.offsetY]; draw(); });
  cv.addEventListener('pointerup', function (e) { pts.delete(e.pointerId); if (pts.size < 2) pinch = 0; if (!moved && G) select(pick(e.offsetX, e.offsetY)); });
  cv.addEventListener('pointercancel', function (e) { pts.delete(e.pointerId); });
  function zoom(cx, cy, f) { var s = Math.max(0.2, Math.min(40, view.s * f)); f = s / view.s; view.x = cx - (cx - view.x) * f; view.y = cy - (cy - view.y) * f; view.s = s; draw(); }
  cv.addEventListener('wheel', function (e) { e.preventDefault(); zoom(e.offsetX, e.offsetY, e.deltaY < 0 ? 1.2 : 1 / 1.2); }, { passive: false });
  $('gr-reset').addEventListener('click', function () { fit(); select(-1); });
  $('gr-pn').addEventListener('click', function (e) { var b = e.target.closest('button[data-j]'); if (b) select(+b.getAttribute('data-j'), true); });
  $('gr-q').addEventListener('input', function () {
    var q = fold(this.value.trim()), ul = $('gr-sug'); if (!G || q.length < 2) { ul.hidden = true; return; }
    var r = []; for (var i = 0; i < G.f.length && r.length < 300; i++) if (G.f[i].indexOf(q) >= 0) r.push(i);
    r.sort(function (a, b) { return (G.f[a].indexOf(q) === 0 ? 0 : 1) - (G.f[b].indexOf(q) === 0 ? 0 : 1) || deg[b] - deg[a]; });
    ul.innerHTML = r.length ? r.slice(0, 8).map(function (i) { return '<li><button type="button" data-j="' + i + '">' + esc(G.nodes[i][1]) + ' <span class="k-xs">' + esc(M.types[G.nodes[i][0]]) + '</span></button></li>'; }).join('') : '<li class="k-xs" style="padding:8px">' + esc(M.none) + '</li>';
    ul.hidden = false;
  });
  $('gr-sug').addEventListener('click', function (e) { var b = e.target.closest('button[data-j]'); if (!b) return; this.hidden = true; select(+b.getAttribute('data-j'), true); });
})();
