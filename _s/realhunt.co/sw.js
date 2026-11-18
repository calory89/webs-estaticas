/* RealHunt service worker (v3, 15-nov-2026). It only keeps files that are safe to keep:
   - /assets/*: every name carries the hash of its content, so a cached copy can never be an old version. Cache first.
   - photos and icons: shown from the cache at once and refreshed in the background, so a replaced photo is seen on
     the next visit instead of never.
   Pages, data and this file are never cached here: every visit gets the current HTML, which names the current
   scripts. A tab left open across a deploy asks for scripts that are gone; a missing file is never stored, and the
   app reloads itself once (src/App.tsx). A new version of this file takes over at once and deletes older caches. */
const C = "rh-v3", MAX = 400;
self.addEventListener("install", () => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== C).map((x) => caches.delete(x)))).then(() => self.clients.claim()).then(trim));
});
function trim() { return caches.open(C).then((c) => c.keys().then((k) => Promise.all(k.slice(0, Math.max(0, k.length - MAX)).map((r) => c.delete(r))))).catch(() => {}); }
const keep = (r) => r && r.ok && r.status === 200 && r.type === "basic";
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || e.request.headers.has("range")) return;
  const hashed = /^\/assets\//.test(u.pathname);
  const image = /^\/(finds|images|t|og)\//.test(u.pathname) || /\.(png|svg|webp|jpe?g|woff2?)$/.test(u.pathname);
  if (!hashed && !image) return;
  e.respondWith(caches.open(C).then(async (c) => {
    const hit = await c.match(e.request);
    const net = () => fetch(e.request).then((r) => { if (keep(r)) c.put(e.request, r.clone()).catch(() => {}); return r; });
    if (hit && hashed) return hit;
    if (hit) { e.waitUntil(net().catch(() => {})); return hit; }
    return net();
  }).catch(() => fetch(e.request)));
});
