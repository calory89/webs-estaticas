/* Kolaboro service worker v2 (17 Nov 2026, n30b). v1 (5 Nov 2026) kept pages a visitor saved with "Save offline" (cache kb-saved-v1,
   listed on /saved/). v2 adds, without changing that:
   - kb-my-v1: the projects in My projects and the last comparisons opened, kept up to date by /k/pwa.js (message "kb-sync"),
     plus the home page and the offline page in the visitor's language. Nothing is sent anywhere: the lists live in this browser.
   - kb-shell-v2: the site's own scripts, styles and fonts as they are used, so a kept page opens with its look and its scripts.
   Pages always come from the network when there is one (a fresh page with a fresh CSP nonce); a kept copy is used only when the
   network fails, and an unknown page then gets /offline/ (8 languages), which lists what is kept. /visit/, /agents/ and /alerts/
   keep their own workers (narrower scopes win). Copies carry the header x-kb-saved (when they were stored) for the offline banner.
   v3 (27 Nov 2026): only a 200 answer is ever stored; a page that answers 5xx is asked once more from the network (not the preload),
   then its kept copy is shown if there is one, else the error as it came; on activation kept entries that are not 200 are removed. */
var SW_V = 'v3', SC = 'kb-saved-v1', MY = 'kb-my-v1', SH = 'kb-shell-v3', LANGS = /^\/(es|de|fr|nl|ru|zh|ar)\//;
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(Promise.resolve(self.registration.navigationPreload && self.registration.navigationPreload.enable()).catch(function () {})
    .then(function () { return caches.keys(); }).then(function (k) { return Promise.all(k.filter(function (n) { return /^kb-shell-/.test(n) && n !== SH; }).map(function (n) { return caches.delete(n); })); })
    .then(function () { return Promise.all([SC, MY].map(function (n) { return caches.open(n).then(function (c) { return c.keys().then(function (K) { return Promise.all(K.map(function (k) { return c.match(k).then(function (r) { if (r && r.status !== 200) return c.delete(k); }); })); }); }); })); }).catch(function () {})
    .then(function () { return self.clients.claim(); }));
});
function norm(u) { var x = new URL(u, location.origin); x.hash = ''; x.searchParams.delete('t'); return x.pathname + x.search; }
function match(name, req) { return caches.open(name).then(function (c) { return c.match(norm(req.url || req)).then(function (r) { return r || c.match(req); }); }); }
function kept(req) { return match(SC, req).then(function (r) { return r || match(MY, req); }); }
function stamp(r) {   // a copy with the time it was stored
  var h = new Headers(r.headers); h.set('x-kb-saved', new Date().toISOString());
  return r.blob().then(function (b) { return new Response(b, { status: r.status, statusText: r.statusText, headers: h }); });
}
var ASSET = /^\/(k\/|watchlist\/wl\.js|favicon|icon|apple-touch)/;
function putShell(req, r) {
  if (!r || r.status !== 200 || r.type !== 'basic') return;
  var u = new URL(req.url || req, location.origin);
  return caches.open(SH).then(function (c) {
    return c.keys().then(function (K) {   // one version of each file: drop older ?v= copies of the same path
      return Promise.all(K.filter(function (k) { var x = new URL(k.url); return x.pathname === u.pathname && x.search !== u.search; }).map(function (k) { return c.delete(k); })).then(function () {
        if (K.length > 160) return c.delete(K[0]);
      });
    }).then(function () { return c.put(u.pathname + u.search, r); });
  }).catch(function () {});
}
// the files a kept page needs (its own scripts, styles, icons) go to kb-shell-v2
function shellOf(html, base) {
  var L = [], rx = /<(?:script|link)\b[^>]*?(?:src|href)="(\/[^"]+)"[^>]*>/g, m;
  while ((m = rx.exec(html))) { var p = m[1].replace(/&amp;/g, '&'); if (ASSET.test(p) && !/\.(mp4|pdf|zip)(\?|$)/.test(p)) L.push(p); }
  return L.slice(0, 30);
}
function offlinePage(u) { var m = LANGS.exec(u.pathname); var p = (m ? '/' + m[1] : '') + '/offline/'; return match(MY, p).then(function (r) { return r || match(MY, '/offline/'); }); }
self.addEventListener('fetch', function (e) {
  var r = e.request, u;
  try { u = new URL(r.url); } catch (x) { return; }
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  if (/^\/(visit|agents|alerts|admin|portal|login)\//.test(u.pathname) || /^\/(api\/kb|api\/geo|cdn-cgi|__sb|__k)\b/.test(u.pathname)) return;
  if (r.headers.get('range') || /text\/event-stream/.test(r.headers.get('accept') || '') || /\.(mp4|webm|zip|pdf|gz)$/i.test(u.pathname)) return;
  if (r.mode === 'navigate') {
    e.respondWith(Promise.resolve(e.preloadResponse).then(function (p) { return p || fetch(r); }).then(function (res) {
      if (!res || res.status < 500) return res;   // v3: a 5xx (a busy moment at the edge) is asked once more, then a kept copy, then the error as it came
      return new Promise(function (ok) { setTimeout(ok, 400); }).then(function () { return fetch(r, { cache: 'no-store' }); }).catch(function () { return res; }).then(function (r2) {
        return r2 && r2.status < 500 ? r2 : kept(r).then(function (hit) { return hit && hit.status === 200 ? hit : r2 || res; });
      });
    }).then(function (res) {
      // a kept page seen online again: refresh its copy in the background
      if (res && res.status === 200 && !res.headers.has('x-kb-saved')) e.waitUntil(caches.open(MY).then(function (c) { return c.match(norm(r.url)).then(function (hit) { if (hit) return stamp(res.clone()).then(function (s) { return c.put(norm(r.url), s); }); }); }).catch(function () {}));
      return res;
    }).catch(function () {
      return kept(r).then(function (hit) { return hit || offlinePage(u); }).then(function (x) { return x || caches.open(SC).then(function (c) { return c.match('/saved/'); }); }).then(function (s) { return s || Response.error(); });
    }));
    return;
  }
  if (ASSET.test(u.pathname)) {
    if (u.searchParams.has('v')) {   // versioned files never change: from the shell cache when present
      e.respondWith(match(SH, r).then(function (hit) { return hit || fetch(r).then(function (res) { e.waitUntil(putShell(r, res.clone())); return res; }); }).catch(function () { return kept(r).then(function (h) { return h || Response.error(); }); }));
      return;
    }
    e.respondWith(fetch(r).then(function (res) { e.waitUntil(putShell(r, res.clone())); return res; }).catch(function () { return match(SH, r).then(function (h) { return h || kept(r); }).then(function (h) { return h || Response.error(); }); }));
    return;
  }
  // data and everything else: network first, a kept copy only when the network fails
  e.respondWith(fetch(r).catch(function () { return kept(r).then(function (hit) { return hit || Response.error(); }); }));
});
// /k/pwa.js sends the list of pages to keep: My projects, the last comparisons, the home and offline pages in the visitor's language
self.addEventListener('message', function (e) {
  var d = e.data || {};
  if (d.t !== 'kb-sync' || !Array.isArray(d.urls)) return;
  var want = {}, urls = d.urls.slice(0, 60).map(norm).filter(function (p) { return /^\//.test(p); });
  urls.forEach(function (p) { want[p] = 1; });
  e.waitUntil(caches.open(MY).then(function (c) {
    return c.keys().then(function (K) { return Promise.all(K.filter(function (k) { return !want[norm(k.url)]; }).map(function (k) { return c.delete(k); })); })
      .then(function () {
        var ok = 0, i = 0;
        function next() {
          if (i >= urls.length) return ok;
          var p = urls[i++];
          return fetch(p, { credentials: 'same-origin', cache: 'no-cache' }).then(function (res) {
            if (res.status !== 200 || res.type !== 'basic') return;
            var html = /text\/html/.test(res.headers.get('content-type') || '');
            return (html ? res.clone().text() : Promise.resolve('')).then(function (t) {
              return stamp(res).then(function (s) { ok++; return c.put(p, s); }).then(function () {
                return Promise.all(shellOf(t).map(function (a) { return match(SH, a).then(function (h) { if (!h) return fetch(a).then(function (x) { return putShell(a, x); }); }).catch(function () {}); }));
              });
            });
          }).catch(function () {}).then(next);
        }
        return next();
      }).then(function (ok) { if (e.source && e.source.postMessage) e.source.postMessage({ t: 'kb-synced', kept: ok, of: urls.length }); });
  }).catch(function () {}));
});
