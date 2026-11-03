/* Kolaboro site visit service worker. Scope /visit/ only (the agents' app at /agents/ has its own). The app shell is cached on install,
   so the page opens and works with no signal. It never uploads anything: all visit data is in the page's IndexedDB. */
var V = 'kb-visit-9b97c5f1d1', SHELL = ['/visit/', '/visit/app.js?v=9b97c5f1d1', '/visit/checklist.json?v=131e7cbf4f', '/visit/manifest.webmanifest', '/k/favicon.svg', '/k/fonts/archivo-latin.woff2', '/agents/icon-192.png'];
self.addEventListener('install', function(e){ e.waitUntil(caches.open(V).then(function(c){ return Promise.all(SHELL.map(function(u){ return c.add(new Request(u, { cache: 'reload' })).catch(function(){}); })); }).then(function(){ return self.skipWaiting(); })); });
self.addEventListener('activate', function(e){ e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k.indexOf('kb-visit-') === 0 && k !== V; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
self.addEventListener('fetch', function(e){
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  if (r.mode === 'navigate') {   // network first (fresh page when online), cached shell when offline
    if (u.pathname !== '/visit/' && u.pathname !== '/visit/index.html') return;
    e.respondWith(fetch(r).then(function(res){ if (res.ok) { var c = res.clone(); caches.open(V).then(function(x){ x.put('/visit/', c); }); } return res; }).catch(function(){ return caches.match('/visit/'); }));
    return;
  }
  if (SHELL.indexOf(u.pathname + u.search) >= 0) e.respondWith(caches.match(r).then(function(h){ return h || fetch(r).then(function(res){ if (res.ok) { var c = res.clone(); caches.open(V).then(function(x){ x.put(r, c); }); } return res; }); }));
});
