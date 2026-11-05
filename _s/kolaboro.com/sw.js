/* Kolaboro offline reading (5 Nov 2026). Registered only after a visitor taps "Save offline" on a project page or a guide.
   It caches nothing by itself: pages and their files are stored on demand by the page (k/site.js) in the cache "kb-saved-v1",
   listed and removed on /saved/. Pages always come from the network when there is one (a fresh page, with a fresh CSP nonce);
   the saved copy is used only when the network fails. /visit/, /agents/ and /alerts/ keep their own workers (narrower scopes win). */
var SC = 'kb-saved-v1';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(Promise.resolve(self.registration.navigationPreload && self.registration.navigationPreload.enable()).catch(function () {}).then(function () { return self.clients.claim(); }));
});
function norm(u) { var x = new URL(u); x.hash = ''; x.searchParams.delete('t'); return x.pathname + x.search; }
function fromCache(req) {
  return caches.open(SC).then(function (c) {
    return c.match(norm(req.url)).then(function (r) { return r || c.match(req.url); });
  });
}
self.addEventListener('fetch', function (e) {
  var r = e.request, u;
  try { u = new URL(r.url); } catch (x) { return; }
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  if (/^\/(visit|agents|alerts)\//.test(u.pathname) || /^\/(api\/kb|api\/geo|cdn-cgi|__sb)\b/.test(u.pathname)) return;
  if (r.headers.get('range') || /text\/event-stream/.test(r.headers.get('accept') || '') || /\.(mp4|webm|zip|pdf)$/i.test(u.pathname)) return;
  if (r.mode === 'navigate') {
    e.respondWith(Promise.resolve(e.preloadResponse).then(function (p) { return p || fetch(r); }).catch(function () {
      return fromCache(r).then(function (hit) {
        if (hit) return hit;
        // not saved: the /saved/ page explains that the visitor is offline and lists what is saved
        return caches.open(SC).then(function (c) { return c.match('/saved/'); }).then(function (s) { return s || Response.error(); });
      });
    }));
    return;
  }
  // files and data: network first, the saved copy only when the network fails
  e.respondWith(fetch(r).catch(function () { return fromCache(r).then(function (hit) { return hit || Response.error(); }); }));
});
