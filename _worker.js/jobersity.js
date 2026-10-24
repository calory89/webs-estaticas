// jobersity.com: lo que el prerender no puede hacer, en el borde.
// 1) Redirecciones 301 de URLs antiguas (_s/jobersity.com/redirects.json, lo escribe el build).
// 2) Fichas /oferta/<id>: hay decenas de miles, no se prerenderizan. Aquí se lee la oferta de la base
//    y se pone en el HTML su título, descripción, canonical, Open Graph, JSON-LD JobPosting y un
//    resumen legible, para que Google for Jobs, WhatsApp o LinkedIn vean la oferta sin ejecutar JS.
//    Si la oferta ya no existe se responde 410 con noindex.
// Código fuente de la web: calory89/jobersity-university-ownership.

const ORIGIN = 'https://jobersity.com';
const SB = 'https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/';
// Clave pública anon (ya va en el JavaScript de la web). Solo puede llamar a las funciones jb_* públicas.
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw';
const DAY = 86400000;

let redirects = null;
let redirectsAt = 0;
async function loadRedirects(env, u) {
  if (redirects && Date.now() - redirectsAt < 10 * 60 * 1000) return redirects;
  try {
    const r = await env.ASSETS.fetch(new Request(new URL('/_s/jobersity.com/redirects.json', u)));
    redirects = r.status === 200 ? await r.json() : {};
  } catch (e) { redirects = redirects || {}; }
  redirectsAt = Date.now();
  return redirects;
}

export async function redirect(u, env) {
  const map = await loadRedirects(env, u);
  const p = u.pathname.replace(/\/+$/, '');
  const to = map[p];
  return to ? Response.redirect(ORIGIN + to + u.search, 301) : null;
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// misma limpieza que src/lib/clean.ts
function cleanTitle(t) {
  let s = String(t || '').replace(/\s+/g, ' ').trim();
  s = s.replace(/\s*[([]\s*(m|f|w|h|d|x|v)\s*(\/\s*(m|f|w|h|d|x|v)\s*)+[)\]]\s*/gi, ' ').trim();
  const letters = s.replace(/[^A-Za-zÀ-ÿ]/g, '');
  if (letters.length > 6 && letters.replace(/[^A-ZÀ-Þ]/g, '').length / letters.length > 0.7) s = s.toLowerCase().replace(/(^|[\s(-])([a-zà-ÿ])/g, (_m, a, b) => a + b.toUpperCase());
  return s.replace(/\s+/g, ' ').trim();
}
function cleanCompany(c) {
  return String(c || '').replace(/\s+/g, ' ').trim().replace(/^\d{2,}\s+(?=[A-Za-zÀ-ÿ])/, '').replace(/\s+(company|compañía|empresa)$/i, '').replace(/[,\s]+$/g, '');
}
function decodeEntities(s) {
  return String(s || '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(+n));
}
function snippet(desc, max) {
  const lines = String(desc || '').replace(/<[^>]+>/g, ' ').split(/\n+/).map((l) => l.trim())
    .filter((l) => l.length > 40 && l.replace(/[^A-Za-zÀ-ÿ]/g, '') !== l.replace(/[^A-Za-zÀ-ÿ]/g, '').toUpperCase());
  const s = (lines[0] || '').replace(/\s+/g, ' ');
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 20)).replace(/[,;:\s]+$/, '') + '…';
}
function salary(raw) {
  const s = String(raw || '').replace(/\./g, '').replace(/,(\d{3})/g, '$1');
  const nums = (s.match(/\d{4,7}/g) || []).map(Number).filter((n) => n >= 800 && n <= 900000);
  const cur = (s.match(/\b(EUR|USD|GBP|MXN|ARS|COP|CHF|DKK|SEK|PLN|CAD|AUD)\b/i)?.[1] || (s.includes('€') ? 'EUR' : s.includes('$') ? 'USD' : s.includes('£') ? 'GBP' : '')).toUpperCase();
  if (!nums.length || !cur) return null;
  const lo = Math.min(...nums), hi = Math.max(...nums);
  if (hi / lo > 3.5) return null;
  const per = /mes|month/i.test(s) ? 'MONTH' : 'YEAR';
  if (per === 'YEAR' && hi < 8000) return null;
  return { cur, lo, hi, per };
}

async function job(id, ctx) {
  const cache = caches.default;
  const key = new Request('https://jobersity-edge-cache.internal/job/' + id);
  const hit = await cache.match(key);
  if (hit) return hit.json();
  let data = null;
  try {
    const r = await fetch(SB + 'jb_job_public', { method: 'POST', headers: { apikey: ANON, authorization: 'Bearer ' + ANON, 'content-type': 'application/json', 'accept-profile': 'jobersity', 'content-profile': 'jobersity' }, body: JSON.stringify({ p_id: id }) });
    if (!r.ok) return undefined; // fallo de red o de base: no se decide nada
    data = await r.json();
  } catch (e) { return undefined; }
  const val = data && data.id ? data : null;
  ctx.waitUntil(cache.put(key, new Response(JSON.stringify(val), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=3600' } })));
  return val;
}

function langOf(req) {
  const c = (req.headers.get('cookie') || '').match(/(?:^|;\s*)jb_lang=(es|en)/);
  if (c) return c[1];
  const ref = req.headers.get('referer') || '';
  if (/jobersity\.com\/(es|empleo|empleos)(\/|$|\?)/.test(ref)) return 'es';
  if (/jobersity\.com\/(en|jobs)(\/|$|\?)/.test(ref)) return 'en';
  return /^es\b|,\s*es\b/i.test(req.headers.get('accept-language') || '') ? 'es' : (req.headers.get('accept-language') ? 'en' : 'es');
}

export async function render(req, r, u, env, ctx) {
  const m = u.pathname.match(/^\/oferta\/(\d{1,12})\/?$/);
  if (!m || r.status !== 200) return r;
  const j = await job(+m[1], ctx);
  if (j === undefined) return r;
  const lang = langOf(req);
  const es = lang === 'es';
  const url = ORIGIN + '/oferta/' + m[1];

  if (j === null) {
    const h = new Headers(r.headers); h.set('x-robots-tag', 'noindex'); h.set('cache-control', 'public, max-age=600');
    return new HTMLRewriter()
      .on('title', { element(e) { e.setInnerContent(es ? 'Oferta no disponible · Jobersity' : 'Job no longer available · Jobersity'); } })
      .on('meta[name="robots"]', { element(e) { e.setAttribute('content', 'noindex, follow'); } })
      .on('link[rel="canonical"]', { element(e) { e.remove(); } })
      .transform(new Response(r.body, { status: 410, headers: h }));
  }

  const title = cleanTitle(j.title);
  const company = cleanCompany(j.company) || (es ? 'Empresa confidencial' : 'Confidential company');
  const desc = decodeEntities(j.description || '').trim();
  const posted = j.posted_at ? new Date(j.posted_at) : null;
  const old = posted && Date.now() - posted.getTime() > 60 * DAY;
  // fichas casi vacías (sin descripción útil) no se indexan: contenido escaso
  const thin = desc.replace(/\s+/g, ' ').length < 200;
  const fullTitle = `${title} · ${company}${j.location ? ' · ' + j.location : ''} | Jobersity`;
  const metaDesc = [`${title} ${es ? 'en' : 'at'} ${company}${j.location ? ` (${j.location})` : ''}.`, snippet(desc, 110)].filter(Boolean).join(' ').slice(0, 300);

  const ldo = {
    '@context': 'https://schema.org', '@type': 'JobPosting', title,
    description: desc ? desc.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>') : title,
    datePosted: (posted || new Date()).toISOString(),
    validThrough: new Date((posted || new Date()).getTime() + 60 * DAY).toISOString(),
    hiringOrganization: { '@type': 'Organization', name: company },
    directApply: false,
    identifier: { '@type': 'PropertyValue', name: 'Jobersity', value: String(j.id) },
    url,
  };
  if (j.job_type) ldo.employmentType = /part/i.test(j.job_type) ? 'PART_TIME' : /contract|temp/i.test(j.job_type) ? 'CONTRACTOR' : /intern/i.test(j.job_type) ? 'INTERN' : 'FULL_TIME';
  const sal = salary(j.salary);
  if (sal) ldo.baseSalary = { '@type': 'MonetaryAmount', currency: sal.cur, value: { '@type': 'QuantitativeValue', minValue: sal.lo, maxValue: sal.hi, unitText: sal.per } };
  if (j.remote) { ldo.jobLocationType = 'TELECOMMUTE'; ldo.applicantLocationRequirements = { '@type': 'Country', name: j.location || 'Worldwide' }; }
  else ldo.jobLocation = { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: j.location || '' } };

  const paras = desc.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).slice(0, 12).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
  const body = `<div class="jb-pre" style="max-width:960px;margin:0 auto;padding:32px 16px;font-family:Inter,system-ui,sans-serif;color:#111827;line-height:1.5">`
    + `<p><a href="${es ? '/empleos' : '/jobs'}">${es ? 'Ofertas' : 'Jobs'}</a> › ${esc(company)}</p>`
    + `<h1>${esc(title)}</h1><p><b>${esc(company)}</b>${j.location ? ' · ' + esc(j.location) : ''}${j.remote ? (es ? ' · Remoto' : ' · Remote') : ''}${j.salary ? ' · ' + esc(j.salary) : ''}</p>`
    + paras
    + `<p><a href="${es ? '/es' : '/en'}#empezar">${es ? 'Que mi agente aplique' : 'Let my agent apply'}</a></p></div>`;

  const h = new Headers(r.headers);
  h.set('cache-control', 'public, max-age=600');
  h.delete('content-length');
  const set = (sel, attr, val) => [sel, { element(e) { e.setAttribute(attr, val); } }];
  const rw = new HTMLRewriter()
    .on('html', { element(e) { e.setAttribute('lang', lang); } })
    .on('title', { element(e) { e.setInnerContent(fullTitle); } })
    .on(...set('meta[name="description"]', 'content', metaDesc))
    .on(...set('meta[name="robots"]', 'content', old || thin ? 'noindex, follow' : 'index, follow, max-image-preview:large'))
    .on(...set('meta[property="og:title"]', 'content', fullTitle))
    .on(...set('meta[property="og:description"]', 'content', metaDesc))
    .on(...set('meta[property="og:url"]', 'content', url))
    .on(...set('meta[property="og:type"]', 'content', 'article'))
    .on(...set('meta[property="og:locale"]', 'content', es ? 'es_ES' : 'en_GB'))
    .on(...set('meta[name="twitter:title"]', 'content', fullTitle))
    .on(...set('meta[name="twitter:description"]', 'content', metaDesc))
    .on('link[rel="canonical"]', { element(e) { e.remove(); } })
    .on('link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
    .on('script#jb-ld', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(`<link rel="canonical" href="${url}" />` + (old ? '' : `<script type="application/ld+json" id="jb-ld">${JSON.stringify(ldo).replace(/</g, '\\u003c')}</script>`), { html: true }); } })
    .on('div#root', { element(e) { e.setInnerContent(body, { html: true }); } });
  return rw.transform(new Response(r.body, { status: 200, headers: h }));
}

// Cabeceras de seguridad y de indexación (el _headers de _s/jobersity.com no se aplica detrás del Worker)
const SEC = {
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), geolocation=(), microphone=(self)',
  'x-frame-options': 'SAMEORIGIN',
};
export function secure(u, r) {
  if (r.status === 101 || r.webSocket) return r;
  const h = new Headers(r.headers);
  for (const [k, v] of Object.entries(SEC)) if (!h.has(k)) h.set(k, v);
  if (/^\/(panel|cv)\//.test(u.pathname)) { h.set('x-robots-tag', 'noindex, nofollow'); h.set('x-frame-options', 'DENY'); h.set('cache-control', 'no-store'); }
  else if (/^\/(admin|acceso|login)(\/|$)/.test(u.pathname)) h.set('x-robots-tag', 'noindex, nofollow');
  else if (/\.(js|css|woff2?)$/.test(u.pathname) && /^\/(assets|fonts)\//.test(u.pathname)) h.set('cache-control', 'public, max-age=31536000, immutable');
  else if (/^\/(sitemap[\w-]*\.xml|salarios\.json|sueldos\.csv|fx\.json)$/.test(u.pathname)) { h.set('cache-control', 'public, max-age=3600'); if (!h.has('last-modified')) h.set('last-modified', new Date(Math.floor(Date.now() / 3600000) * 3600000).toUTCString()); }
  return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
}

// Rutas que existen aunque no tengan HTML propio (las pinta la app en el navegador)
const APP_ROUTES = /^\/(?:$|es$|en$|panel\/[^/]+$|cv\/[^/]+$|admin\/?$|acceso$|login$|guardadas$|saved$|empresas-que-contratan$|companies-hiring$|empresa\/[a-z0-9-]+$|company\/[a-z0-9-]+$|oferta\/\d+$|empleo\/[a-z0-9-]+$|jobs\/[a-z0-9-]+$|bootcamp(?:\/.*)?$)/;

// La app responde a cualquier URL con su HTML. Aquí: 404 de verdad para lo que no existe y noindex
// para búsquedas libres sin página propia (/empleo/<algo> que no está en el catálogo).
export async function status(u, r) {
  if (r.status !== 200 || !/text\/html/.test(r.headers.get('content-type') || '')) return r;
  const html = await r.text();
  const own = /<link rel="canonical"/.test(html);
  const h = new Headers(r.headers);
  h.delete('content-length');
  if (own) return new Response(html, { status: 200, headers: h });
  const p = u.pathname.replace(/\/+$/, '') || '/';
  if (!APP_ROUTES.test(p)) {
    h.set('x-robots-tag', 'noindex'); h.set('cache-control', 'public, max-age=300');
    return new Response(html, { status: 404, headers: h });
  }
  if (/^\/(empleo|jobs)\//.test(p)) h.set('x-robots-tag', 'noindex, follow');
  return new Response(html, { status: 200, headers: h });
}

// ---- Empresas: /empresa/<slug> (es) y /company/<slug> (en), y /sitemap-companies.xml ----
async function rpcCached(fn, body, ctx, ttl = 3600) {
  const cache = caches.default;
  const key = new Request('https://jobersity-edge-cache.internal/' + fn + '/' + encodeURIComponent(JSON.stringify(body)));
  const hit = await cache.match(key);
  if (hit) return hit.json();
  let data;
  try {
    const r = await fetch(SB + fn, { method: 'POST', headers: { apikey: ANON, authorization: 'Bearer ' + ANON, 'content-type': 'application/json', 'accept-profile': 'jobersity', 'content-profile': 'jobersity' }, body: JSON.stringify(body) });
    if (!r.ok) return undefined;
    data = await r.json();
  } catch (e) { return undefined; }
  ctx.waitUntil(cache.put(key, new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=' + ttl } })));
  return data;
}

const NOT_CITY = /^(h[ií]brido|hybrid|flexible.*|remote.*|remoto.*|worldwide|anywhere|espa[nñ]a|spain|united states|usa|uk|united kingdom|schweiz|deutschland|germany|france|europe|emea)$/i;

export async function company(req, r, u, env, ctx) {
  const m = u.pathname.match(/^\/(empresa|company)\/([a-z0-9-]{1,120})\/?$/);
  if (!m || r.status !== 200) return r;
  const es = m[1] === 'empresa';
  const c = await rpcCached('jb_company_jobs', { p_slug: m[2], p_limit: 30 }, ctx);
  if (c === undefined) return r;
  const h = new Headers(r.headers); h.delete('content-length'); h.set('cache-control', 'public, max-age=600');
  if (!c || !c.slug) {
    h.set('x-robots-tag', 'noindex');
    return new HTMLRewriter()
      .on('title', { element(e) { e.setInnerContent(es ? 'Empresa no encontrada · Jobersity' : 'Company not found · Jobersity'); } })
      .on('link[rel="canonical"]', { element(e) { e.remove(); } })
      .on('meta[name="robots"]', { element(e) { e.setAttribute('content', 'noindex, follow'); } })
      .transform(new Response(r.body, { status: 404, headers: h }));
  }
  const year = new Date().getUTCFullYear();
  const cities = (c.cities || []).filter((x) => x && !NOT_CITY.test(x.trim())).slice(0, 4);
  const path = (es ? '/empresa/' : '/company/') + c.slug;
  const url = ORIGIN + path;
  const title = es ? `Empleo en ${c.name}: ${c.jobs} ofertas (${year}) | Jobersity` : `${c.name} jobs: ${c.jobs} open roles (${year}) | Jobersity`;
  const desc = es
    ? `${c.jobs} ofertas de ${c.name} de las últimas semanas${cities.length ? ` en ${cities.join(', ')}` : ''}${c.remote_pct ? `, el ${c.remote_pct} % en remoto` : ''}. Sube tu CV y tu agente aplica por ti.`
    : `${c.jobs} ${c.name} jobs from recent weeks${cities.length ? ` in ${cities.join(', ')}` : ''}${c.remote_pct ? `, ${c.remote_pct}% remote` : ''}. Upload your CV and your agent applies for you.`;
  const list = (c.list || []).map((j) => `<li>${j.source !== 'adzuna' ? `<a href="/oferta/${j.id}">${esc(cleanTitle(j.title))}</a>` : esc(cleanTitle(j.title))}${j.location ? ' · ' + esc(j.location) : ''}${j.remote ? (es ? ' · Remoto' : ' · Remote') : ''}</li>`).join('');
  const body = `<div class="jb-pre" style="max-width:960px;margin:0 auto;padding:32px 16px;font-family:Inter,system-ui,sans-serif;color:#111827;line-height:1.5">`
    + `<p><a href="${es ? '/empresas-que-contratan' : '/companies-hiring'}">${es ? 'Empresas que contratan' : 'Companies hiring'}</a> › ${esc(c.name)}</p>`
    + `<h1>${esc(es ? `Empleo en ${c.name}` : `${c.name} jobs`)}</h1><p>${esc(desc)}</p><ul>${list}</ul></div>`;
  const ldo = { '@context': 'https://schema.org', '@type': 'Organization', name: c.name, url };
  const set = (sel, attr, val) => [sel, { element(e) { e.setAttribute(attr, val); } }];
  return new HTMLRewriter()
    .on('html', { element(e) { e.setAttribute('lang', es ? 'es' : 'en'); } })
    .on('title', { element(e) { e.setInnerContent(title); } })
    .on(...set('meta[name="description"]', 'content', desc))
    .on(...set('meta[name="robots"]', 'content', c.jobs >= 5 ? 'index, follow, max-image-preview:large' : 'noindex, follow'))
    .on(...set('meta[property="og:title"]', 'content', title))
    .on(...set('meta[property="og:description"]', 'content', desc))
    .on(...set('meta[property="og:url"]', 'content', url))
    .on(...set('meta[property="og:locale"]', 'content', es ? 'es_ES' : 'en_GB'))
    .on(...set('meta[name="twitter:title"]', 'content', title))
    .on(...set('meta[name="twitter:description"]', 'content', desc))
    .on('link[rel="canonical"]', { element(e) { e.remove(); } })
    .on('link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
    .on('script#jb-ld', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(`<link rel="canonical" href="${url}" /><link rel="alternate" hreflang="es" href="${ORIGIN}/empresa/${c.slug}" /><link rel="alternate" hreflang="en" href="${ORIGIN}/company/${c.slug}" /><link rel="alternate" hreflang="x-default" href="${ORIGIN}/empresa/${c.slug}" /><script type="application/ld+json" id="jb-ld">${JSON.stringify(ldo).replace(/</g, '\\u003c')}</script>`, { html: true }); } })
    .on('div#root', { element(e) { e.setInnerContent(body, { html: true }); } })
    .transform(new Response(r.body, { status: 200, headers: h }));
}

export async function companiesSitemap(u, ctx) {
  if (u.pathname !== '/sitemap-companies.xml') return null;
  const rows = await rpcCached('jb_companies_top', { p_limit: 5000 }, ctx);
  if (!Array.isArray(rows)) return new Response('unavailable', { status: 503, headers: { 'retry-after': '600' } });
  const day = new Date().toISOString().slice(0, 10);
  const urls = rows.filter((x) => x.jobs >= 5).map((x) => {
    const lm = (x.last_posted || day).slice(0, 10);
    const alt = `<xhtml:link rel="alternate" hreflang="es" href="${ORIGIN}/empresa/${x.slug}"/><xhtml:link rel="alternate" hreflang="en" href="${ORIGIN}/company/${x.slug}"/>`;
    return `  <url><loc>${ORIGIN}/empresa/${x.slug}</loc><lastmod>${lm}</lastmod>${alt}</url>\n  <url><loc>${ORIGIN}/company/${x.slug}</loc><lastmod>${lm}</lastmod>${alt}</url>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
