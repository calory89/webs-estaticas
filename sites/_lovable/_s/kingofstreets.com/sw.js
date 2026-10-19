/* King of Streets — service worker: juego instalable y jugable sin conexión.
   Código del juego: red primero (las actualizaciones llegan al momento), caché si no hay red.
   Coches 3D, datos de ciudades, fuentes y librerías: caché primero (no cambian). */
const V = 'ks-v7';
const STATIC = 'ks-static-v7';
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(V).then((c) => c.addAll(['/game/index.html', '/manifest.webmanifest', '/favicon.svg']).catch(() => {})));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V && k !== STATIC).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});
function cacheFirst(req) {
  return caches.open(STATIC).then((c) =>
    c.match(req).then((hit) => hit || fetch(req).then((r) => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; })),
  );
}
function networkFirst(req, fallback) {
  return fetch(req)
    .then((r) => { if (r && r.ok) { const cp = r.clone(); caches.open(V).then((c) => c.put(req, cp)); } return r; })
    .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || (fallback ? caches.match(fallback) : undefined)).then((hit) => hit || Response.error()));
}
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return;
  if (/supabase\.co$|overpass|nominatim|open-meteo|googleapis\.com\/maps|tile\./.test(u.hostname)) return;
  const same = u.origin === self.location.origin;
  if (same && req.mode === 'navigate') { e.respondWith(networkFirst(req, /^\/game\//.test(u.pathname) ? '/game/index.html' : '/')); return; }
  if (same && (/^\/game\/(cars|data)\//.test(u.pathname) || /\.(glb|png|jpg|webp|woff2?)$/.test(u.pathname) || /^\/assets\//.test(u.pathname))) { e.respondWith(cacheFirst(req)); return; }
  if (same && /^\/game\//.test(u.pathname)) { e.respondWith(networkFirst(req)); return; }
  if (/cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.(gstatic|googleapis)\.com/.test(u.hostname)) { e.respondWith(cacheFirst(req)); return; }
});

// Avisos push ("te han quitado tu calle"). Listo para cuando haya claves VAPID: el servidor manda {title, body, url}.
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'King of Streets', { body: d.body || '¡Te han quitado una calle!', icon: '/icon-192.png', badge: '/icon-192.png', data: { url: d.url || '/' }, tag: d.tag || 'ks' }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((ws) => { for (const w of ws) { if ('focus' in w) { w.navigate(url); return w.focus(); } } return self.clients.openWindow(url); }));
});
