/* Hourly findings for one project, for the project page. Usage: <div id="kb-findings"></div><script src="/findings/hook.js" defer></script>
   The id comes from data-id on the element, else ?id=, else /p/<ID>/. Reads /data/findings-by-project.json (anonymous: no quotes, no names).
   Also exposes window.kbFindings(id) -> Promise of { checked, fp, f: [findings newest first] } or null, for other scripts. */
(function () {
  var cache = null;
  function load() { if (!cache) cache = fetch('/data/findings-by-project.json?t=' + Math.floor(Date.now() / 6e5)).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); return cache; }
  window.kbFindings = function (id) { return load().then(function (j) { return (j && j.projects && j.projects[String(id || '').toUpperCase()]) || null; }); };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function run() {
    var el = document.getElementById('kb-findings'); if (!el) return;
    var id = el.getAttribute('data-id'), m;
    if (!id) { try { id = new URLSearchParams(location.search).get('id'); } catch (e) {} }
    if (!id && (m = location.pathname.match(/\/p\/([A-Za-z]{2,5}-\d{3,4})\/?$/))) id = m[1];
    if (!id || !/^[A-Za-z]{2,5}-\d{3,4}$/.test(id)) return;
    id = id.toUpperCase();
    window.kbFindings(id).then(function (p) {
      var head = '<h3 style="margin:0 0 6px;font-size:1.05rem">Hourly developer page check</h3>';
      if (!p || !p.checked) { el.innerHTML = head + '<p style="margin:0;font-size:.92rem;color:var(--muted)">Not read by the hourly check yet. Every tracked project comes round in turn; see <a href="/findings/">live findings</a>.</p>'; return; }
      var when = String(p.checked).slice(0, 16).replace('T', ' ') + ' UTC';
      var f = (p.f || []).slice(0, 8);
      el.innerHTML = head + '<p style="margin:0;font-size:.92rem;color:var(--muted)">Developer page last read ' + esc(when) + ' (page fingerprint <code>' + esc(p.fp || '') + '</code>). ' +
        (f.length ? f.length + ' finding' + (f.length > 1 ? 's' : '') + ', each backed by a quote checked word for word in code:' : 'No new or changed facts found so far.') + '</p>' +
        (f.length ? '<ul style="margin:8px 0 0;padding-left:18px;font-size:.95rem">' + f.map(function (x) {
          return '<li><b>' + esc(String(x.at).slice(0, 10)) + '</b> ' + esc(String(x.text || '').replace(/^[A-Z]{2,5}-\d{3,4} · /, '')) + '</li>'; }).join('') + '</ul>' : '') +
        '<p style="margin:8px 0 0;font-size:.85rem"><a href="/findings/">All live findings and how they are checked →</a></p>';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
