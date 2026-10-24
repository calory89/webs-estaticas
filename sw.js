/* Happy Low Cost: avisos push de chollos y copia offline de lo último visto */
const CACHE = 'hlc-v1';
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/offline/', '/hlc/hlc.css?v=21', '/hlc/brand/icon-192.png']).catch(() => {}))); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || r.mode !== 'navigate') return;
  // páginas: red primero; si no hay conexión, la última copia guardada o la página offline
  e.respondWith(fetch(r).then((res) => { if (res.ok && /\/chollos\//.test(new URL(r.url).pathname)) { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(r, cp)); } return res; })
    .catch(() => caches.match(r).then((m) => m || caches.match('/offline/'))));
});
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: 'Happy Low Cost', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Happy Low Cost', { body: d.body || '', icon: '/hlc/brand/icon-192.png', badge: '/hlc/brand/icon-192.png', tag: d.tag || 'hlc', data: { url: d.url || '/chollos/' } }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/chollos/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((l) => { for (const c of l) { if (c.url === url && 'focus' in c) return c.focus(); } return self.clients.openWindow(url); }));
});
