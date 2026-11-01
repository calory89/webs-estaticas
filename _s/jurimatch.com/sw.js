/*
 * JuriMatch service worker (item 479). No dependencies, about 150 lines.
 *
 * What it caches, and why it cannot serve an old version of the site after a publish:
 * - Page loads (navigations) always go to the network first. The cache is only used when the
 *   network fails: then a tool page the visitor already opened is served from the last app shell,
 *   and anything else gets the offline page (/offline).
 * - Files under /assets/ have a content hash in their name, so a cached copy is always correct:
 *   cache first, network on a miss.
 * - Nothing else is touched (API calls through /__sb, images, fonts, sitemap...).
 * - VERSION is replaced at build time by scripts/build-sw.mjs with a hash of the build. A new build
 *   is a new sw.js: it installs, takes over at once and deletes every cache of older versions
 *   (only "jm-data", the list of visited tool pages, is kept).
 *
 * Emergency off switch: publish a sw.js that only calls self.registration.unregister().
 */
const VERSION = "a2ca4333a5bd";
const ASSETS = `jm-assets-${VERSION}`;
const SHELL = `jm-shell-${VERSION}`;
// Not code: the list of visited tools survives new versions.
const DATA = "jm-data";
const OFFLINE_URL = "/offline"; // Pages serves offline.html at /offline (the .html URL 308-redirects)
const SHELL_KEY = "/__jm/shell";
const VISITED_KEY = "/__jm/visited.json";
const MAX_ASSETS = 150;
const MAX_VISITED = 12;
const TOOL_PATH = /^\/(tools|es\/herramientas|de\/werkzeuge|fr\/outils|it\/strumenti|pl\/narzedzia|pt-br\/ferramentas)(\/|$)/;

/** A response the browser accepts for a navigation (not marked as redirected). */
async function clean(res) {
  const body = await res.blob();
  return new Response(body, { status: 200, headers: { "content-type": res.headers.get("content-type") || "text/html; charset=utf-8" } });
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    try {
      const res = await fetch(OFFLINE_URL, { cache: "reload" });
      if (res.ok) await (await caches.open(SHELL)).put(OFFLINE_URL, await clean(res));
    } catch { /* offline page is a nice-to-have: never block the update */ }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keep = new Set([ASSETS, SHELL, DATA]);
    for (const name of await caches.keys()) {
      if (name.startsWith("jm-") && !keep.has(name)) await caches.delete(name);
    }
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch { /* not supported */ }
    }
    await self.clients.claim();
  })());
});

async function readVisited() {
  try {
    const res = await (await caches.open(DATA)).match(VISITED_KEY);
    const list = res ? await res.json() : [];
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

async function rememberVisit(path, title) {
  if (typeof path !== "string" || !TOOL_PATH.test(path) || path.length > 200) return;
  const list = (await readVisited()).filter((v) => v.path !== path);
  list.unshift({ path, title: String(title || path).slice(0, 120) });
  const res = new Response(JSON.stringify(list.slice(0, MAX_VISITED)), { headers: { "content-type": "application/json" } });
  await (await caches.open(DATA)).put(VISITED_KEY, res);
}

self.addEventListener("message", (event) => {
  const d = event.data || {};
  if (d.type === "jm-visited") event.waitUntil(rememberVisit(d.path, d.title));
});

/** Keeps the newest app shell, and the scripts and styles it needs, for offline use of visited tools. */
async function keepShell(res) {
  const html = await res.text();
  const cache = await caches.open(SHELL);
  await cache.put(SHELL_KEY, new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } }));
  const urls = [...new Set([...html.matchAll(/\/assets\/[A-Za-z0-9_.-]+\.(?:js|css)/g)].map((m) => m[0]))];
  const assets = await caches.open(ASSETS);
  await Promise.all(urls.map(async (u) => {
    if (await assets.match(u, { ignoreVary: true })) return;
    try { const r = await fetch(u); if (r.ok) await assets.put(u, r); } catch { /* offline again */ }
  }));
}

async function trimAssets() {
  const cache = await caches.open(ASSETS);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_ASSETS; i++) await cache.delete(keys[i]);
}

async function navigate(event) {
  const url = new URL(event.request.url);
  try {
    const preload = await event.preloadResponse;
    const res = preload || (await fetch(event.request));
    const type = res.headers.get("content-type") || "";
    if (res.ok && res.type === "basic" && !res.redirected && type.includes("text/html")) {
      event.waitUntil(keepShell(res.clone()).catch(() => {}));
    }
    return res;
  } catch {
    const cache = await caches.open(SHELL);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if (TOOL_PATH.test(path) && (await readVisited()).some((v) => v.path === path)) {
      const shell = await cache.match(SHELL_KEY);
      if (shell) return shell;
    }
    const offline = await cache.match(OFFLINE_URL);
    return offline || new Response("You are offline.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
}

async function asset(event) {
  const cache = await caches.open(ASSETS);
  // Hashed files never change; a Vary: Origin from the server must not cause a miss.
  const hit = await cache.match(event.request, { ignoreVary: true });
  if (hit) return hit;
  const res = await fetch(event.request);
  if (res.ok && res.type === "basic") {
    event.waitUntil(cache.put(event.request, res.clone()).then(trimAssets).catch(() => {}));
  }
  return res;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === VISITED_KEY) {
    event.respondWith(readVisited().then((list) => new Response(JSON.stringify(list), { headers: { "content-type": "application/json", "cache-control": "no-store" } })));
    return;
  }
  if (req.mode === "navigate") {
    event.respondWith(navigate(event));
    return;
  }
  if (url.pathname.startsWith("/assets/")) event.respondWith(asset(event));
});
