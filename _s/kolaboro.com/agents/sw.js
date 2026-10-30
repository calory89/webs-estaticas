/* Kolaboro field tool service worker: the app opens without signal; uploads wait in the page's queue */
var V = 'kb-field-67a490650be20ac20f', SHELL = ['/agents/me/', '/k/app.css?v=c20f3234be', '/k/field.js?v=67a490650b', '/k/live.js?v=27', '/k/favicon.svg', '/agents/icon-192.png'];
self.addEventListener('install', function(e){ e.waitUntil(caches.open(V).then(function(c){ return c.addAll(SHELL).catch(function(){}); }).then(function(){ return self.skipWaiting(); })); });
self.addEventListener('activate', function(e){ e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k.indexOf('kb-field-') === 0 && k !== V; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
self.addEventListener('fetch', function(e){
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (e.request.mode === 'navigate' && u.pathname.indexOf('/agents/me') === 0) {
    e.respondWith(fetch(e.request).then(function(r){ var c = r.clone(); caches.open(V).then(function(x){ x.put('/agents/me/', c); }); return r; }).catch(function(){ return caches.match('/agents/me/'); }));
    return;
  }
  if (u.pathname.indexOf('/k/') === 0 || u.pathname.indexOf('/agents/icon') === 0) e.respondWith(caches.match(e.request).then(function(h){ return h || fetch(e.request).then(function(r){ var c = r.clone(); caches.open(V).then(function(x){ x.put(e.request, c); }); return r; }); }));
});
