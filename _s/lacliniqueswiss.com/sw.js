// La Clinique Swiss service worker — network-first for pages, cache-first for fonts and images.
const VERSION = "lcs-v3";
const STATIC = /\/(fonts|img|kj)\/|\.(woff2|webp|png|svg|ico)$/;
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (STATIC.test(url.pathname)) {
    e.respondWith(caches.open(VERSION).then(async (c) => {
      const hit = await c.match(req); if (hit) return hit;
      const res = await fetch(req); if (res.ok) c.put(req, res.clone()); return res;
    }));
    return;
  }
  if (req.mode === "navigate" || url.pathname.startsWith("/assets/")) {
    e.respondWith(fetch(req).then((res) => { if (res.ok && url.pathname.startsWith("/assets/")) caches.open(VERSION).then((c) => c.put(req, res.clone())); return res; })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("/"))));
  }
});
