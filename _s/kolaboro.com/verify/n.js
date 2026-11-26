// Verify page: "Check that a page is the page we published" (#page) and the worker build record (#builds). Uses /k/pagecheck.js and /k/verify-badge.js.
(function () {
  var $ = function (i) { return document.getElementById(i); };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function load(u) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = u; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  function pc() { return window.KBPageCheck ? Promise.resolve(window.KBPageCheck) : load('/k/pagecheck.js?v=26bf93e7ae').then(function () { return window.KBPageCheck; }); }
  function vb() { return window.KBVerify ? Promise.resolve(window.KBVerify) : load('/k/verify-badge.js?v=6b61413c9f').then(function () { return window.KBVerify; }); }
  var f = $('pg-f'), u = $('pg-u'), o = $('pg-o');
  function go() {
    var v = (u.value || '/').trim(), x;
    try { x = new URL(v, location.origin); } catch (e) { o.innerHTML = '<p>Type a page address on kolaboro.com, for example /database.</p>'; return; }
    if (x.origin !== location.origin) { o.innerHTML = '<p>Only pages on kolaboro.com can be checked against our manifest.</p>'; return; }
    pc().then(function (P) { P.css(); P.run(x.pathname, o, { search: x.search }); }, function () { o.innerHTML = '<p>The checker did not load. Try again.</p>'; });
  }
  if (f) {
    f.addEventListener('submit', function (e) { e.preventDefault(); go(); });
    var q = new URLSearchParams(location.search).get('page');
    if (q && /^\/[^\s]*$/.test(q)) { u.value = q; go(); }
  }
  var b = $('bd-o'); if (!b) return;
  var st = document.createElement('style'); st.textContent = '.bd-t{width:100%;border-collapse:collapse;font-size:.82rem}.bd-t th,.bd-t td{text-align:left;vertical-align:top;padding:6px 8px;border-bottom:1px solid rgba(23,33,43,.1)}.bd-t code{font:500 .74rem/1.4 ui-monospace,Menlo,monospace;overflow-wrap:anywhere}.bd-t small{color:#4A5661}@media (max-width:520px){.bd-t th:nth-child(2),.bd-t td:nth-child(2){display:none}}'; document.head.appendChild(st);
  vb().then(function (V) { return V.fetchSigned('/api/x/n/builds', { credentials: 'omit' }).then(function (r) { return { V: V, r: r }; }); }).then(function (a) {
    var r = a.r, d = r.json;
    if (!r.ok || !d || !d.builds) { b.innerHTML = '<p>The build record is not published yet (' + esc(r.status) + '). The job writes it after the next deploy; nothing is shown in its place.</p>'; return; }
    var L = d.builds.slice(0, 8);
    b.innerHTML = '<p><span id="bd-sig"></span> esbuild ' + esc(d.how.esbuild) + ', command <code style="overflow-wrap:anywhere">' + esc(d.how.command) + '</code>. ' + esc(d.how.lookup) + '</p>' +
      '<div style="overflow-x:auto"><table class="bd-t"><thead><tr><th>Worker source tree</th><th>First live commit</th><th>Bundle SHA-256</th><th>Two builds identical</th></tr></thead><tbody>' +
      L.map(function (e) { return '<tr><td><code>' + esc(e.worker_tree.slice(0, 12)) + '</code></td><td><code>' + esc(e.first_commit.slice(0, 12)) + '</code><br><small>' + esc(String(e.commit_time).slice(0, 16).replace('T', ' ')) + '</small></td><td><code style="overflow-wrap:anywhere">' + esc(e.sha256) + '</code><br><small>' + esc((e.bytes / 1048576).toFixed(1)) + ' MB, built ' + esc(String(e.built_at).slice(0, 16).replace('T', ' ')) + ' UTC</small></td><td>' + (e.reproduced ? 'Yes' : '<b>No</b>') + '</td></tr>'; }).join('') +
      '</tbody></table></div><p style="font-size:.85rem;color:#4A5661">' + d.builds.length + ' worker version' + (d.builds.length === 1 ? '' : 's') + ' recorded since ' + esc(String(d.builds[d.builds.length - 1].built_at).slice(0, 10)) + '.</p>';
    a.V.badge($('bd-sig'), r.check, { what: 'the build record' });
  }).catch(function () { b.innerHTML = '<p>The build record could not be loaded just now.</p>'; });
})();
