// Páginas inglesas con slug en inglés: las URLs antiguas (slug en español) redirigen 301 a la nueva.
// Los mapas los generan _hlc/gen_en.py y _hlc/gen_routes.py en cada publicación.
let MAP = null;
export async function onRequest(ctx) {
  const url = new URL(ctx.request.url);
  let p = url.pathname;
  if (!p.endsWith('/') && !/\.[a-z0-9]+$/i.test(p)) p += '/';
  if (/^\/en\/(deals|destinations|flights)\/[^/]+\/$/.test(p)) {
    if (!MAP) {
      const m = {};
      for (const f of ['/en/_map-deals.json', '/en/_map-flights.json']) {
        try { const r = await ctx.env.ASSETS.fetch(new URL(f, url.origin)); if (r.ok) Object.assign(m, await r.json()); } catch (e) {}
      }
      MAP = m;
    }
    let key = p;
    try { key = decodeURI(p); } catch (e) {}
    const to = MAP[p] || MAP[key];
    if (to) return Response.redirect(new URL(to + url.search, url.origin).toString(), 301);
  }
  return ctx.next();
}
