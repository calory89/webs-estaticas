
const SITES = new Set(["52startupsin52weeks.com", "bestsalesclosers.com", "biohackingisland.com", "collectivecolab.com", "createats.com", "equinoxinvestmentgroup.com", "felicityisland.com", "founderspassport.com", "gayrail.com", "jobersity.com", "jurimatch.com", "kindaoclub.com", "kingofstreets.com", "klipstay.com", "kolaboro.com", "landbanky.com", "landstockmarket.com", "leadpoolclub.com", "luxurybeachresidence.com", "monkeyranking.com", "nomadsseasons.com", "persohna.com", "publicscores.com", "reelrole.com", "sevenfounders.com", "sovereign195.com", "thecoreisland.com", "transparently.us", "usersland.com", "voyanoble.com", "yogaecocity.com", "realhunt.co", "lacliniqueswiss.com", "thecigaretteindex.com", "theglampings.com", "sportpassportclub.com", "surfranking.com", "longevityisland.org", "walkwar.com", "voxera.app", "grownomads.com", "aibeachcity.com", "beyondsoma.com", "blacknomadcard.com", "bootcamp.jobersity.com", "fitnessbeachcity.com", "go.realhunt.co", "onlybeachfronthomes.com", "spain.happylowcost.com", "thenomaduniversity.com", "thestartupisland.com", "happysocialclub.com", "levelshotels.com"]);

const SB = 'https://oykcsmextclpdnugixqz.supabase.co';
const SB_HOST = 'oykcsmextclpdnugixqz.supabase.co';
function sbBucket(schema, b) { return b.startsWith(schema + '-') ? b : schema + '-' + b; }
async function sbProxy(req, u) {
  const m = u.pathname.match(/^\/__sb\/([a-z0-9_]+)(\/.*)$/);
  if (!m) return new Response('bad', { status: 400 });
  const schema = m[1]; let path = m[2];
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': req.headers.get('origin') || '*', 'access-control-allow-headers': req.headers.get('access-control-request-headers') || '*', 'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS', 'access-control-max-age': '86400' } });
  const h = new Headers(req.headers); h.delete('host');
  // Visitor IP for per-visitor limits in edge functions (Supabase otherwise sees this Worker's IP).
  h.set('x-jm-client-ip', req.headers.get('cf-connecting-ip') || '');
  let body = (req.method === 'GET' || req.method === 'HEAD') ? null : await req.arrayBuffer();
  if (path.startsWith('/rest/v1/')) { h.set('accept-profile', schema); h.set('content-profile', schema); }
  else if (path.startsWith('/functions/v1/')) { path = path.replace(/^\/functions\/v1\/([^/?]+)/, (_, f) => '/functions/v1/' + (f.startsWith(schema + '-') ? f : schema + '-' + f)); }
  else if (path.startsWith('/storage/v1/')) {
    path = path.replace(/^\/storage\/v1\/(object|render\/image)\/((?:public|sign|authenticated|list|info|upload\/sign)\/)?([^/?]+)/, (all, kind, sub, b) => (['move','copy','sign'].includes(b) && !sub) ? all : '/storage/v1/' + kind + '/' + (sub || '') + sbBucket(schema, b));
    path = path.replace(/^\/storage\/v1\/bucket\/([^/?]+)/, (_, b) => '/storage/v1/bucket/' + sbBucket(schema, b));
    if (body && /\/storage\/v1\/object\/(move|copy)$|\/storage\/v1\/object\/sign\/?$/.test(path)) { try { const j = JSON.parse(new TextDecoder().decode(body)); if (j.bucketId) j.bucketId = sbBucket(schema, j.bucketId); if (j.destinationBucket) j.destinationBucket = sbBucket(schema, j.destinationBucket); body = JSON.stringify(j); } catch (e) {} }
  }
  else if (path.startsWith('/auth/v1/signup') || path.startsWith('/auth/v1/otp')) {
    if (body) { try { const j = JSON.parse(new TextDecoder().decode(body)); j.data = Object.assign({}, j.data || {}, { site: schema }); body = JSON.stringify(j); } catch (e) {} }
  }
  const target = SB + path + u.search;
  if (req.headers.get('upgrade') === 'websocket') return fetch(target, req);
  const r = await fetch(target, { method: req.method, headers: h, body, redirect: 'manual' });
  const rh = new Headers(r.headers);
  const loc = rh.get('location'); if (loc && loc.startsWith(SB)) rh.set('location', 'https://' + u.host + '/__sb/' + schema + loc.slice(SB.length));
  return new Response(r.body, { status: r.status, headers: rh });
}
let top3 = null;
let jm = null;
let jb = null;
let rr = null;
let kb = null;
// rh-kcheck-v1: Kolaboro box on realhunt.co deal pages (served at /__k/kcheck.js, injected into HTML)
const KCHECK = "/* RealHunt x Kolaboro: \"check this home\" box on deal pages (v1, 30-oct-2026).\n   Shown only when the visitor is in another country than the home and the price is at least EUR 80,000.\n   Add ?kb=1 to a deal URL to force it (testing). */\n(function () {\n  var TH = 80000, rows = {}, geo, loading = false, key = '';\n  var T = {\n    en: { h: 'Buying from abroad? Check it before you pay a deposit',\n          p: 'Free AI check of this listing in about a minute: who is selling, title and permits, red flags. If you want more, a local agent can verify it on site for \u20ac490.',\n          b: 'Check this home with Kolaboro \u2192', s: 'Kolaboro is the buyer-verification service from the team behind RealHunt.' },\n    es: { h: '\u00bfCompras desde fuera? Compru\u00e9bala antes de pagar la reserva',\n          p: 'Revisi\u00f3n gratis con IA de este anuncio en un minuto: qui\u00e9n vende, escrituras y permisos, se\u00f1ales de alarma. Si quieres m\u00e1s, un agente local la verifica en persona por 490 \u20ac.',\n          b: 'Comprobar esta casa con Kolaboro \u2192', s: 'Kolaboro es el servicio de verificaci\u00f3n de compradores del equipo de RealHunt.' }\n  };\n  function ev(n, p) { try { if (window.gtag) gtag('event', n, p); } catch (e) {} }\n  function lang() { return (document.documentElement.lang || 'en').slice(0, 2) === 'es' ? 'es' : 'en'; }\n  function name(cc) { try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(cc); } catch (e) { return cc; } }\n  function same(a, b) { a = String(a || '').toLowerCase(); b = String(b || '').toLowerCase(); return a === b || (a.indexOf('united states') === 0 && b.indexOf('united states') === 0); }\n  var AK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw';\n  function load(slug) {\n    if (!loading) { loading = true; fetch('/api/geo').then(function (r) { return r.json(); }).then(function (g) { geo = (g && g.country) || null; }).catch(function () { geo = null; }); }\n    if (rows[slug] !== undefined) return; rows[slug] = null;\n    fetch('/__sb/realhunt/rest/v1/community_deals?status=eq.approved&select=price_eur,country,source_url&slug=eq.' + encodeURIComponent(slug), { headers: { apikey: AK, Authorization: 'Bearer ' + AK } })\n      .then(function (r) { return r.json(); }).then(function (d) { rows[slug] = (d && d[0]) || false; }).catch(function () { rows[slug] = false; });\n  }\n  function anchor() {\n    var c = ['.hv-aside-cta', '.hunt-detail-actions', '.hv-amenities', '.hv-detail-where'];\n    for (var i = 0; i < c.length; i++) { var e = document.querySelector(c[i]); if (e && e.offsetParent !== null) return e; }\n    return null;\n  }\n  function box(row, slug, L) {\n    var t = T[L], a = document.createElement('div');\n    a.id = 'rh-kb'; a.setAttribute('data-k', slug + '|' + L);\n    a.style.cssText = 'margin:14px 0;padding:14px 16px;border-radius:14px;border:1px solid rgba(15,118,110,.35);background:rgba(15,118,110,.07);color:inherit;font-size:14px;line-height:1.45;text-align:left';\n    var href = 'https://kolaboro.com/check?url=' + encodeURIComponent(row.source_url) + '&utm_source=realhunt&utm_medium=deal_page&utm_campaign=' + encodeURIComponent(slug);\n    a.innerHTML = '<div style=\"font-weight:700;font-size:15px;margin-bottom:4px\"></div><div style=\"opacity:.85;margin-bottom:10px\"></div>' +\n      '<a target=\"_blank\" rel=\"noopener\" style=\"display:inline-block;background:#0f766e;color:#fff;font-weight:600;padding:10px 14px;border-radius:10px;text-decoration:none\"></a>' +\n      '<div style=\"opacity:.6;font-size:12px;margin-top:8px\"></div>';\n    var d = a.children; d[0].textContent = t.h; d[1].textContent = t.p; d[2].textContent = t.b; d[2].href = href; d[3].textContent = t.s;\n    d[2].addEventListener('click', function () { ev('kolaboro_click', { slug: slug, country: row.country, viewer: geo || '' }); });\n    return a;\n  }\n  function tick() {\n    var m = location.pathname.match(/^\\/deal\\/([^/?#]+)/), old = document.getElementById('rh-kb');\n    if (!m) { if (old) old.remove(); key = ''; return; }\n    var slug = decodeURIComponent(m[1]), L = lang();\n    if (old && old.getAttribute('data-k') === slug + '|' + L && document.body.contains(old)) return;\n    if (old && old.getAttribute('data-k').split('|')[0] !== slug) { old.remove(); old = null; }\n    load(slug); if (!rows[slug] && rows[slug] !== false || geo === undefined) return;\n    var row = rows[slug], force = /[?&]kb=1/.test(location.search);\n    var ok = row && row.source_url && (force || (row.price_eur >= TH && geo && !same(name(geo), row.country)));\n    if (!ok) { if (old) old.remove(); return; }\n    var an = anchor(); if (!an) return;\n    if (old) old.remove();\n    an.parentNode.insertBefore(box(row, slug, L), an.nextSibling);\n    if (key !== slug) { key = slug; ev('kolaboro_view', { slug: slug, country: row.country, viewer: geo || '' }); }\n  }\n  setInterval(tick, 700);\n})();\n";
const NOSPA = new Set(["grownomads.com", "kolaboro.com", "aibeachcity.com", "beyondsoma.com", "blacknomadcard.com", "bootcamp.jobersity.com", "fitnessbeachcity.com", "go.realhunt.co", "onlybeachfronthomes.com", "spain.happylowcost.com", "thenomaduniversity.com", "thestartupisland.com", "happysocialclub.com", "levelshotels.com"]);
async function viaTop3(req, env, ctx) {
  const u = new URL(req.url);
  const cacheable = req.method === 'GET' && !u.pathname.startsWith('/api/geo') && !u.pathname.startsWith('/api/alerts');
  const cache = caches.default;
  const ck = new Request(u.origin + u.pathname + u.search + (u.search ? '&' : '?') + '__v=' + ((env && env.CF_PAGES_COMMIT_SHA) || 'x'), { method: 'GET', headers: req.headers });
  if (cacheable) { const hit = await cache.match(ck); if (hit) { const hh = new Headers(hit.headers); hh.set('cache-control', 'public, max-age=0, must-revalidate'); return new Response(hit.body, { status: hit.status, headers: hh }); } }
  if (!top3) top3 = (await import('./top3/index.js')).default;
  const r = await top3.fetch(req, env, ctx);
  if (cacheable && r.status === 200) { const c = r.clone(); const h = new Headers(c.headers); h.set('cache-control', 'public, max-age=1800'); ctx.waitUntil(cache.put(ck, new Response(c.body, { status: 200, headers: h }))); }
  return r;
}
// kolaboro.com: browser security headers (no framing of private pages, camera and location only for our own pages)
function kbHeaders(r, u) {
  const ct = r.headers.get('content-type') || '';
  if (!/text\/html/.test(ct)) return r;
  const h = new Headers(r.headers);
  const priv = /^\/(admin|portal|login|agents\/me|agents\/apply)(\/|$)/.test(u.pathname);
  h.set('x-frame-options', priv ? 'DENY' : 'SAMEORIGIN');
  h.set('content-security-policy', "frame-ancestors " + (priv ? "'none'" : "'self'") + "; base-uri 'self'; object-src 'none'; form-action 'self' https://www.paypal.com");
  h.set('permissions-policy', 'camera=(self), microphone=(self), geolocation=(self), payment=(), usb=(), interest-cohort=()');
  h.set('cross-origin-opener-policy', 'same-origin-allow-popups');
  if (priv) { h.set('cache-control', 'no-store'); h.set('x-robots-tag', 'noindex, nofollow'); }
  h.delete('access-control-allow-origin');
  return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
}
export default {
  async fetch(req, env, ctx) {
    const u = new URL(req.url);
    let host = u.hostname.replace(/^www\./, '');
    if (host.endsWith('.pages.dev')) {
      const q = u.searchParams.get('__site');
      if (q) return new Response(null, { status: 302, headers: { location: '/', 'set-cookie': '__site=' + q + '; Path=/; SameSite=Lax' } });
      const m = (req.headers.get('cookie') || '').match(/(?:^|;\s*)__site=([^;]+)/);
      if (m) host = m[1];
      // preview: route shared assets here too and point the bundles' /__sb/ calls at this preview host
      const isAsset = u.pathname.startsWith('/assets/') || u.pathname.startsWith('/__l5e/assets-v1/');
      if (!u.pathname.startsWith('/__sb/')) {
        const r0 = isAsset ? await env.ASSETS.fetch(req) : await this.site(req, env, ctx, u, host);
        const ct = r0.headers.get('content-type') || '';
        if (r0.status === 200 && /javascript|text\/html/.test(ct)) {
          const t = (await r0.text()).replace(/https:\/\/(?:www\.)?[a-z0-9.-]+\/__sb\//g, 'https://' + u.host + '/__sb/');
          const h = new Headers(r0.headers); h.delete('content-length'); h.delete('etag');
          return new Response(t, { status: 200, headers: h });
        }
        return r0;
      }
    }
    if (u.pathname.startsWith('/__sb/')) return sbProxy(req, u);
    if (host === 'kolaboro.com') return kbHeaders(await this.site(req, env, ctx, u, host), u);
    return this.site(req, env, ctx, u, host);
  },
  async site(req, env, ctx, u, host) {
    // kolaboro.com: desk-review API (see kolaboro.js).
    if (host === 'kolaboro.com' && (u.pathname.startsWith('/api/kb/') || u.pathname === '/api/v1' || u.pathname.startsWith('/api/v1/'))) { if (!kb) kb = await import('./kolaboro.js'); return kb.api(req, u, env, ctx); }
    // jobersity.com: 301, HTML propio en /oferta/<id> y /empresa|company/<slug>, sitemap de empresas, 404 reales y cabeceras (see jobersity.js).
    if (host === 'jobersity.com' && req.method === 'GET') {
      if (!jb) jb = await import('./jobersity.js');
      const rd = await jb.redirect(u, env);
      if (rd) return rd;
      const sm = await jb.companiesSitemap(u, ctx);
      if (sm) return sm;
      if (u.pathname.startsWith('/oferta/')) return jb.secure(u, await jb.render(req, await this.siteRaw(req, env, ctx, u, host), u, env, ctx));
      if (/^\/(empresa|company)\//.test(u.pathname)) return jb.secure(u, await jb.company(req, await this.siteRaw(req, env, ctx, u, host), u, env, ctx));
      return jb.secure(u, await jb.status(u, await this.siteRaw(req, env, ctx, u, host)));
    }
    // reelrole.com: candidate videos from the Cloudflare edge cache (see reelrole.js media()).
    if (host === 'reelrole.com' && (req.method === 'GET' || req.method === 'HEAD') && u.pathname.startsWith('/stream/')) { if (!rr) rr = await import('./reelrole.js'); return rr.media(req, u, ctx); }
    if (host === 'jurimatch.com' && req.method === 'GET' && /^\/(sitemap\.xml|login|signin|sign-in|firm-listing|fees)\/?$/.test(u.pathname)) { if (!jm) jm = await import('./jurimatch.js'); const sm = await jm.route(req, u, env, ctx); if (sm) return sm; }
    const r = await this.siteRaw(req, env, ctx, u, host);
    if (host === 'realhunt.co' && req.method === 'GET' && /text\/html/.test(r.headers.get('content-type') || '')) return new HTMLRewriter().on('body', { element(e) { e.append('<script src="/__k/kcheck.js?v=1" defer></script>', { html: true }); } }).transform(r);
    // jurimatch.com: per-URL title, description and canonical in the HTML (see jurimatch.js).
    if (host === 'jurimatch.com' && req.method === 'GET') { if (!jm) jm = await import('./jurimatch.js'); return jm.render(req, r, u, env, ctx); }
    // reelrole.com: per-URL meta, candidate pages and real 404s (see reelrole.js).
    if (host === 'reelrole.com' && req.method === 'GET') { try { if (!rr) rr = await import('./reelrole.js'); return await rr.render(req, r, u, env, ctx); } catch (e) { return r; } }
    return r;
  },
  async siteRaw(req, env, ctx, u, host) {
    if (host === 'go.realhunt.co') { const p = u.pathname.replace(/\.html$/, '').replace(/\/index$/, '/'); return Response.redirect('https://realhunt.co' + (p || '/') + u.search, 301); }
    if (host === 'top3hotels.com') return viaTop3(req, env, ctx);
    if (!SITES.has(host)) return new Response('Not found', { status: 404 });
    const pre = '/_s/' + host;
    if (u.pathname.endsWith('/index.html')) return Response.redirect(new URL(u.pathname.slice(0, -10) + u.search, u).toString(), 301);
    if (u.pathname.startsWith('/_s/')) return new Response('Not found', { status: 404 });
    if (u.pathname === '/api/geo') { const c = req.cf || {}; return Response.json({ country: c.country || null, city: c.city || null, lat: c.latitude ? +c.latitude : null, lon: c.longitude ? +c.longitude : null }); }
    if (host === 'realhunt.co' && u.pathname === '/__k/kcheck.js') return new Response(KCHECK, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=600' } });
    // rh-static-v1: home data comes from the source repo (Pages project realhunt-top, refreshed by the daily data job); falls back to the published copy.
    if (host === 'realhunt.co' && req.method === 'GET' && u.pathname === '/data/rh-static.json') { try { const t = await fetch('https://realhunt-top.pages.dev/data/rh-static.json', { cf: { cacheEverything: true, cacheTtl: 300 } }); if (t.status === 200 && /json/i.test(t.headers.get('content-type') || '')) { const h = new Headers(t.headers); h.set('cache-control', 'public, max-age=300'); return new Response(t.body, { status: 200, headers: h }); } } catch (e) {} }
    if (req.method !== 'GET' && req.method !== 'HEAD') return new Response(null, { status: 204 });
    if (host === 'realhunt.co' && /^\/(?:(?:finds|top|og|images)\/.+|og-[\w-]+|icon-[\w-]+)\.(?:webp|jpe?g|png)$/i.test(u.pathname)) { const m = await fetch('https://realhunt-media.pages.dev' + u.pathname, { cf: { cacheEverything: true, cacheTtl: 86400 } }); const img = (r) => r.status === 200 && /^image\//i.test(r.headers.get('content-type') || ''); const ok = (r) => { const h = new Headers(r.headers); h.set('cache-control', 'public, max-age=86400'); return new Response(r.body, { status: 200, headers: h }); }; if (img(m)) return ok(m); /* v2-src-media: images missing from realhunt-media come from the source repo's public/ folder (Pages project realhunt-top) */ const t = await fetch('https://realhunt-top.pages.dev' + u.pathname, { cf: { cacheEverything: true, cacheTtl: 86400 } }); if (img(t)) return ok(t); if (u.pathname.startsWith('/top/')) { const t2 = await fetch('https://realhunt-top.pages.dev' + u.pathname.slice(4), { cf: { cacheEverything: true, cacheTtl: 86400 } }); if (img(t2)) return ok(t2); } }
    if (u.search) { for (const k of ['p', 'page_id', 'paged', 'cat', 'tag']) { const v = u.searchParams.get(k); if (v && /^[\w-]+$/.test(v)) { const q = await env.ASSETS.fetch(new Request(new URL(pre + '/__q/' + k + '=' + v + '/', u), req)); if (q.status === 200) return q; } } }
    // realhunt.co: one URL per page, without the trailing slash, matching the canonical tags. "/about/" sends a 301 to
    // "/about", and "/about" is served from the about/index.html file directly instead of redirecting to the folder.
    if (host === 'realhunt.co' && u.pathname.length > 1 && u.pathname.endsWith('/')) {
      return Response.redirect(new URL(u.pathname.replace(/\/+$/, '') + u.search, u).toString(), 301);
    }
    let r = await env.ASSETS.fetch(new Request(new URL(pre + u.pathname + u.search, u), req));
    if (host === 'realhunt.co' && r.status >= 300 && r.status < 400) {
      const l = new URL(r.headers.get('location') || '', u);
      if (l.pathname === pre + u.pathname + '/') {
        const d = await env.ASSETS.fetch(new Request(new URL(pre + u.pathname + '/' + u.search, u), req));
        if (d.status === 200) r = d;
      }
    }
    if (r.status >= 300 && r.status < 400) {
      const loc = r.headers.get('location') || '';
      const l = new URL(loc, u);
      if (l.pathname.startsWith(pre)) { const h = new Headers(r.headers); h.set('location', l.pathname.slice(pre.length) + l.search); return new Response(null, { status: r.status, headers: h }); }
      return r;
    }
    if (r.status === 404 && NOSPA.has(host)) { const nf = await env.ASSETS.fetch(new Request(new URL(pre + '/404', u), req)); return new Response(nf.status === 200 ? nf.body : 'Not found', { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } }); }
    if (r.status === 404 && !/\.[a-z0-9]{2,5}$/i.test(u.pathname)) {
      const s = await env.ASSETS.fetch(new Request(new URL(pre + '/', u), req));
      // realhunt.co: a path with no prerendered page (an account screen, a home added after the last build, a typo)
      // still loads the app, but must not tell search engines it is the home page.
      if (host === 'realhunt.co') {
        const h = new Headers(s.headers); h.set('x-robots-tag', 'noindex');
        const out = new HTMLRewriter()
          .on('link[rel="canonical"]', { element(e) { e.remove(); } })
          .on('meta[name="robots"]', { element(e) { e.setAttribute('content', 'noindex, follow'); } })
          .on('meta[property="og:url"]', { element(e) { e.setAttribute('content', 'https://realhunt.co' + u.pathname); } })
          .transform(new Response(s.body, { status: 200, headers: h }));
        return out;
      }
      return new Response(s.body, { status: 200, headers: s.headers });
    }
    return r;
  }
};
