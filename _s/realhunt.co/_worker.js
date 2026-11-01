// realhunt-media (Pages project built from pub/_lovable, root _s/realhunt.co).
// Photos and share cards that are not in this folder come from the source repo's public/ folder
// (Pages project realhunt-top), so new homes never show "Photo unavailable" and shared links keep their preview.
const TOP = 'https://realhunt-top.pages.dev';
const IMG = /\.(?:webp|jpe?g|png|gif|avif)$/i;
const isImg = (r) => r.status === 200 && /^image\//i.test(r.headers.get('content-type') || '');
function ok(r) {
  const h = new Headers(r.headers);
  h.set('cache-control', 'public, max-age=86400');
  h.set('access-control-allow-origin', '*');
  return new Response(r.body, { status: 200, headers: h });
}
export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname === '/_worker.js') return new Response('Not found', { status: 404 });
    const r = await env.ASSETS.fetch(req);
    if (!IMG.test(u.pathname) || isImg(r)) return r;
    const t = await fetch(TOP + u.pathname, { cf: { cacheEverything: true, cacheTtl: 86400 } });
    if (isImg(t)) return ok(t);
    if (u.pathname.startsWith('/top/')) {
      const t2 = await fetch(TOP + u.pathname.slice(4), { cf: { cacheEverything: true, cacheTtl: 86400 } });
      if (isImg(t2)) return ok(t2);
    }
    return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain' } });
  }
};
