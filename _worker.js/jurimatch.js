// jurimatch.com: per-URL HTML at the edge.
// The site is a single-page app, so every URL is served the same index.html. Here we put each
// page's own title, description, canonical URL and robots rule into that HTML before it leaves
// Cloudflare, using _s/jurimatch.com/seo-manifest.json (written by the build in
// calory89/case-clarity-path, scripts/build-seo-manifest.mjs). Crawlers and link previews that
// do not run JavaScript then see the right page. The app replaces everything once it loads.

const ORIGIN = 'https://jurimatch.com';
const MANIFEST_TTL = 10 * 60 * 1000;
let manifest = null;
let manifestAt = 0;

async function loadManifest(env, u) {
  if (manifest && Date.now() - manifestAt < MANIFEST_TTL) return manifest;
  try {
    const r = await env.ASSETS.fetch(new Request(new URL('/_s/jurimatch.com/seo-manifest.json', u)));
    if (r.status === 200) { manifest = await r.json(); manifestAt = Date.now(); }
  } catch (e) { /* keep the previous copy */ }
  return manifest;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function normPath(p) {
  let x = decodeURIComponent(p || '/');
  if (x.length > 1) x = x.replace(/\/+$/, '');
  return x || '/';
}

export async function render(req, res, u, env, ctx) {
  const ct = res.headers.get('content-type') || '';
  if (res.status !== 200 || !ct.includes('text/html')) return res;
  const m = await loadManifest(env, u);
  if (!m) return res;
  const path = normPath(u.pathname);
  const page = m.pages[path];
  if (!page) return res;

  const url = ORIGIN + path;
  const robots = page.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large';
  const h = new Headers(res.headers);
  h.delete('content-length'); h.delete('etag');
  if (page.noindex) h.set('x-robots-tag', 'noindex');
  const set = (attr, value) => ({ element(e) { e.setAttribute(attr, value); } });

  return new HTMLRewriter()
    .on('title', { element(e) { e.setInnerContent(page.t); } })
    .on('meta[name="description"]', set('content', page.d))
    .on('meta[name="robots"]', set('content', robots))
    .on('link[rel="canonical"]', set('href', url))
    .transform(new Response(res.body, { status: 200, headers: h }));
}
