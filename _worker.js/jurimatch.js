// jurimatch.com: per-URL HTML at the edge.
// The site is a single-page app, so every URL is served the same index.html. Here we put each
// page's own title, description, canonical URL, robots rule, Open Graph tags, JSON-LD, hreflang,
// language and a short crawlable summary (with real firms from the database) into that HTML
// before it leaves Cloudflare. Source of the static values: _s/jurimatch.com/seo-manifest.json,
// written by the build in calory89/case-clarity-path (scripts/build-seo-manifest.mjs).
// Crawlers and link previews that do not run JavaScript then see the right page; the app
// replaces the summary inside #root as soon as it loads.

const ORIGIN = 'https://jurimatch.com';
const SB = 'https://oykcsmextclpdnugixqz.supabase.co/rest/v1/';
// Public anon key (already shipped in the site's JavaScript). Row-level security applies.
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw';
const CURATED = 'curated_2026_10';
const OG_IMAGE = ORIGIN + '/og-image.png';
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

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ld = (o) => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>';
const slugify = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const clean = (s) => String(s || '').replace(/\s+—\s+/g, ': ').replace(/—/g, ', ');
const titleCaseLabel = (s) => clean(s).replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
// Same canonical fee labels as src/lib/labels.ts in the app.
const FEE_RULES = [
  [/no[\s-]*win[\s,-]*no[\s-]*fee|pay only if you win|only pay if you win|no recovery,?\s*no fee|no cure,?\s*no pay|no success,?\s*no fee|no collection,?\s*no (fee|cost|commission)/i, 'No win, no fee'],
  [/conditional fee/i, 'Conditional fee agreement (CFA)'],
  [/damages[\s-]*based/i, 'Damages-based agreement (DBA)'],
  [/cuota\s*litis/i, 'Cuota litis (success fee)'],
  [/quota\s*litis/i, 'Quota litis (success fee)'],
  [/erfolgshonorar/i, 'Erfolgshonorar (success fee)'],
  [/contingen/i, 'Contingency fee'],
  [/hybrid/i, 'Hybrid (fixed fee plus success fee)'],
  [/success[\s_-]*fee|honorarios?\s+de\s+[ée]xito|result[\s-]*based|results[\s-]*only/i, 'Success fee'],
  [/third[\s_-]*party|litigation[\s_-]*fund|non[\s-]*recourse|claim purchase|buys?\/?funds? claims/i, 'Litigation funding'],
  [/commission/i, 'Commission on recovery'],
];
const feeLabel = (raw) => { const s = titleCaseLabel(raw); if (!s) return ''; for (const [re, l] of FEE_RULES) if (re.test(s)) return l; return s.length <= 40 ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ''; };
const INDEXED_NOTE = "Indexed from public research. Our team has not confirmed this firm's fee terms; check them with the firm.";

export function normPath(p) {
  let x = p || '/';
  try { x = decodeURIComponent(x); } catch (e) { /* keep raw */ }
  if (x.length > 1) x = x.replace(/\/+$/, '');
  return x || '/';
}

// Database reads, cached at the edge for an hour (the app always loads fresh data itself).
async function sb(path, ctx) {
  const url = SB + path;
  const cache = caches.default;
  const key = new Request('https://jurimatch-edge-cache.internal/' + encodeURIComponent(url));
  const hit = await cache.match(key);
  if (hit) return hit.json();
  const r = await fetch(url, { headers: { apikey: ANON, authorization: 'Bearer ' + ANON, 'accept-profile': 'jurimatch' } });
  if (!r.ok) return null;
  const data = await r.json();
  ctx.waitUntil(cache.put(key, new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=3600' } })));
  return data;
}

const FIRM_COLS = 'id,firm_name,description,category,typical_model,countries_served,case_types,source,website,last_verified_at,verification_source_url';
// Hand-verified = fee terms confirmed by our team on the firm's own site, less than 12 months ago.
const isHand = (f) => f.source === CURATED && !!f.last_verified_at && Date.now() - Date.parse(f.last_verified_at) < 365 * 864e5;
const pgArr = (vals) => '{' + vals.map((v) => '"' + String(v).replace(/(["\\])/g, '\\$1') + '"').join(',') + '}';

// Row count for a PostgREST filter (HEAD + Prefer: count=exact), cached at the edge for an hour.
async function sbCount(path, ctx) {
  const url = SB + path;
  const cache = caches.default;
  const key = new Request('https://jurimatch-edge-cache.internal/count/' + encodeURIComponent(url));
  const hit = await cache.match(key);
  if (hit) return Number(await hit.text());
  const r = await fetch(url, { method: 'HEAD', headers: { apikey: ANON, authorization: 'Bearer ' + ANON, 'accept-profile': 'jurimatch', prefer: 'count=exact' } });
  const m = (r.headers.get('content-range') || '').match(/\/(\d+)$/);
  if (!m) return null;
  ctx.waitUntil(cache.put(key, new Response(m[1], { headers: { 'cache-control': 'public, max-age=3600' } })));
  return Number(m[1]);
}

async function listFirms(list, ctx) {
  const base = 'lawyers?select=' + FIRM_COLS + '&status=eq.active&quarantine_reason=is.null&domain_resolves=is.true&is_winwin=is.true&accepting_cases=not.is.false&listing_tier=in.(partner,verified_listing)'
    + (list.types ? '&case_types=ov.' + encodeURIComponent(pgArr(list.types)) : '')
    + (list.country ? '&countries_norm=cs.' + encodeURIComponent(pgArr([list.country])) : '');
  const countBase = base.replace('select=' + FIRM_COLS, 'select=id');
  const [v, ix, nv, ni] = await Promise.all([
    sb(base + '&source=eq.' + CURATED + '&order=firm_name&limit=20', ctx),
    sb(base + '&or=(source.is.null,source.neq.' + CURATED + ')&limit=10', ctx),
    sbCount(countBase + '&source=eq.' + CURATED + '&limit=1', ctx).catch(() => null),
    sbCount(countBase + '&or=(source.is.null,source.neq.' + CURATED + ')&limit=1', ctx).catch(() => null),
  ]);
  return { verified: v || [], indexed: ix || [], nVerified: nv, nIndexed: ni };
}

function firmItem(f, verified, es) {
  const where = (f.countries_served || []).slice(0, 3).join(', ');
  const model = f.typical_model ? feeLabel(f.typical_model) : '';
  return '<li>' + (verified ? '<a href="/firms/' + esc(slugify(f.firm_name)) + '">' + esc(f.firm_name) + '</a> (' + (es ? 'verificado a mano' : 'hand-verified') + ')' : esc(f.firm_name) + (es ? ' (indexado, sin verificar)' : ' (indexed, not verified)'))
    + (f.category === 'collection_agency' ? (es ? ', agencia de recobro (no es un despacho)' : ', debt collection agency (not a law firm)') : '')
    + (where ? ', ' + esc(where) : '') + (model ? ', ' + esc(model) : '') + '</li>';
}

function breadcrumbLd(crumbs) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: ORIGIN + path })) };
}

async function dynamicPage(path, m, ctx) {
  let mm;
  if ((mm = path.match(/^\/firms\/([a-z0-9-]+)$/))) {
    const slug = mm[1];
    const words = slug.split('-').filter(Boolean);
    const look = (re) => sb('lawyers?select=' + FIRM_COLS + '&status=eq.active&verified=is.true&firm_name=ilike.' + encodeURIComponent('*' + words.map((w) => w.replace(re, '_')).join('*') + '*') + '&limit=200', ctx);
    let rows = await look(/[aeiou]/g);
    if (rows && !rows.some((r) => slugify(r.firm_name) === slug)) rows = await look(/[aeiouync]/g);
    // Polish, Czech, Turkish... letters with accents on consonants (ś, ź, ż, ł, ř, ş, ğ).
    if (rows && !rows.some((r) => slugify(r.firm_name) === slug)) rows = await look(/[aeiouyncszlrtdgk]/g);
    if (!rows) return null; // database unreachable: serve the page unchanged
    const f = rows.find((r) => slugify(r.firm_name) === slug);
    if (!f) return { t: 'Firm not found | JuriMatch', d: 'This firm profile is not available.', noindex: true, status: 404 };
    const hand = isHand(f);
    // Item 056: per-firm link preview image, only where the build made one.
    const ogImg = hand && Array.isArray(m && m.ogFirms) && m.ogFirms.includes(slug) ? ORIGIN + '/og/firms/' + slug + '.png' : null;
    const where = (f.countries_served || []).slice(0, 3).join(', ');
    // Only descriptions our team checked are shown; indexed firms get a factual note.
    const d = hand ? (clean(f.description) || (f.firm_name + (where ? ', ' + where : '') + '.')) : (f.firm_name + (where ? ' (' + where + ')' : '') + '. ' + INDEXED_NOTE);
    return {
      t: (() => { const t = f.firm_name + ': No-Win-No-Fee Firm Profile'; return (t + ' | JuriMatch').length <= 62 ? t + ' | JuriMatch' : t.length <= 62 ? t : f.firm_name + ' | JuriMatch'; })(),
      d: d.length > 300 ? d.slice(0, 297) + '...' : d,
      h1: f.firm_name,
      lead: d,
      ...(ogImg ? { image: ogImg } : {}),
      facts: [
        ['Status', hand ? 'Hand-verified by JuriMatch' + (f.last_verified_at ? ' on ' + String(f.last_verified_at).slice(0, 10) : '') : 'Indexed from public research, not verified by our team'],
        ['Fee terms read on', hand && f.verification_source_url ? f.verification_source_url : ''],
        ['Countries', where],
        ['Fee model', hand && f.typical_model ? feeLabel(f.typical_model) : ''],
        ['Case types', (f.case_types || []).slice(0, 6).map((x) => { const t = titleCaseLabel(x).toLowerCase(); return t.charAt(0).toUpperCase() + t.slice(1); }).join(', ').replace(/\bchf\b/gi, 'CHF')],
      ].filter((x) => x[1]),
      crumbs: [['Home', '/'], ['Firms', '/firms'], [f.firm_name, path]],
      extraLd: [{ '@context': 'https://schema.org', '@type': 'LegalService', name: f.firm_name, url: ORIGIN + path, ...(f.website ? { sameAs: [f.website] } : {}), ...(where ? { areaServed: (f.countries_served || []).slice(0, 5) } : {}), description: d.slice(0, 300) }],
    };
  }
  if ((mm = path.match(/^\/blog\/([a-z0-9-]+)$/))) {
    const rows = await sb('blog_posts?select=slug,title,excerpt,published_at,created_at,image_url,status&slug=eq.' + encodeURIComponent(mm[1]) + '&limit=1', ctx);
    if (!rows) return null; // database unreachable: serve the page unchanged
    const p = rows[0];
    if (!p) return { t: 'Article not found | JuriMatch', d: 'This article is not available.', noindex: true, status: 404 };
    return {
      noindex: (m.blogNoindex || []).includes(p.slug),
      t: clean(p.title) + ' | JuriMatch', d: clean(p.excerpt || p.title), h1: clean(p.title), lead: clean(p.excerpt), article: true,
      image: p.image_url || null, published: p.published_at || p.created_at,
      crumbs: [['Home', '/'], ['Blog', '/blog'], [clean(p.title), path]],
    };
  }
  return null;
}

// /sitemap.xml built from the manifest (indexable pages only) plus hand-verified firm profiles
// and blog posts from the database. Cached 1 h at the edge.
// One URL per screen: old or duplicate paths answer with a permanent redirect.
const REDIRECTS = { '/login': '/auth', '/signin': '/auth', '/sign-in': '/auth', '/firm-listing': '/for-lawyers', '/fees': '/how-it-works' };

export async function route(req, u, env, ctx) {
  const to = REDIRECTS[normPath(u.pathname)];
  if (to) return Response.redirect(ORIGIN + to + u.search, 301);
  if (u.pathname !== '/sitemap.xml') return null;
  const m = await loadManifest(env, u);
  if (!m) return null;
  const day = (m.generatedAt || new Date().toISOString()).slice(0, 10);
  const urls = Object.entries(m.pages).filter(([, p]) => !p.noindex).map(([path]) => [ORIGIN + path, day]);
  const [firms, posts] = await Promise.all([
    sb('lawyers?select=firm_name,last_verified_at&status=eq.active&verified=is.true&source=eq.' + CURATED + '&quarantine_reason=is.null&domain_resolves=is.true&listing_tier=in.(partner,verified_listing)&order=firm_name&limit=1000', ctx),
    sb('blog_posts?select=slug,published_at,created_at&order=published_at.desc&limit=2000', ctx),
  ]);
  const seen = new Set();
  for (const f of firms || []) { const s = slugify(f.firm_name); if (s && !seen.has(s)) { seen.add(s); urls.push([ORIGIN + '/firms/' + s, String(f.last_verified_at || day).slice(0, 10)]); } }
  const dupes = m.blogRedirects || {}; const offTopic = new Set(m.blogNoindex || []);
  for (const p of posts || []) if (p.slug && !dupes[p.slug] && !offTopic.has(p.slug)) urls.push([ORIGIN + '/blog/' + p.slug, String(p.published_at || p.created_at || day).slice(0, 10)]);
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + urls.map(([loc, mod]) => '  <url><loc>' + esc(loc) + '</loc><lastmod>' + mod + '</lastmod></url>').join('\n') + '\n</urlset>\n';
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}

// /lawyers/<alias>[/<alias>] and /claims/<alias> -> canonical URL (same alias tables as the app).
function aliasTarget(path, m) {
  const A = m.aliases || {};
  const norm = (x) => String(x || '').trim().toLowerCase().replace(/_/g, '-');
  let mm;
  if ((mm = path.match(/^\/lawyers\/([^/]+)(?:\/([^/]+))?$/i))) {
    const t0 = norm(mm[1]); const c0 = mm[2] ? norm(mm[2]) : null;
    const t = m.pages['/lawyers/' + t0] ? t0 : (A.type || {})[t0];
    const c = c0 === null ? null : (m.pages['/lawyers/' + (t || t0) + '/' + c0] ? c0 : (A.country || {})[c0]);
    if (!t || (c0 !== null && !c)) return null;
    const to = '/lawyers/' + t + (c ? '/' + c : '');
    return to !== path && m.pages[to] ? to : null;
  }
  if ((mm = path.match(/^\/claims\/([^/]+)$/i))) {
    const g0 = norm(mm[1]); const g = m.pages['/claims/' + g0] ? g0 : (A.claim || {})[g0];
    const to = g ? '/claims/' + g : null;
    return to && to !== path && m.pages[to] ? to : null;
  }
  if ((mm = path.match(/^\/guides\/([^/]+)$/i))) {
    const c0 = norm(mm[1]); const c = m.pages['/guides/' + c0] ? c0 : (A.country || {})[c0];
    const to = c ? '/guides/' + c : null;
    return to && to !== path && m.pages[to] ? to : null;
  }
  return null;
}

// Chrome of the crawlable summary and the Open Graph locale, per page language (manifest "lang").
const OG_LOCALE = { en: 'en_US', es: 'es_ES', de: 'de_DE', 'pt-BR': 'pt_BR', fr: 'fr_FR', it: 'it_IT', pl: 'pl_PL' };
const CHROME = {
  en: { faq: 'Frequently asked questions', lawyers: 'Lawyers', pricing: 'Pricing', about: 'About' },
  es: { faq: 'Preguntas frecuentes', lawyers: 'Abogados', pricing: 'Precios', about: 'Quiénes somos' },
  de: { faq: 'Häufige Fragen', lawyers: 'Anwälte', pricing: 'Preise', about: 'Über uns' },
  'pt-BR': { faq: 'Perguntas frequentes', lawyers: 'Advogados', pricing: 'Preços', about: 'Quem somos' },
};

// Item 290: what the site loads. Supabase goes through the same-origin /__sb proxy; GA4, Clarity and
// Cloudflare Web Analytics/Zaraz are the only third-party scripts; fonts are self-hosted (fontsource);
// flags come from flagcdn.com (images: any https). Stripe Checkout is a full-page redirect.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://*.clarity.ms https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' wss://jurimatch.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://*.clarity.ms https://cloudflareinsights.com",
  "frame-src 'self' https://checkout.stripe.com https://js.stripe.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "media-src 'self' blob: https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
].join('; ');

export async function render(req, res, u, env, ctx) {
  // One URL per page: "/pricing/" redirects to "/pricing" (canonical tags have no trailing slash).
  if (u.pathname.length > 1 && u.pathname.endsWith('/')) return Response.redirect(ORIGIN + u.pathname.replace(/\/+$/, '') + u.search, 301);
  const ct = res.headers.get('content-type') || '';
  if (res.status !== 200 || !ct.includes('text/html')) return res;
  const m = await loadManifest(env, u);
  if (!m) return res;
  const path = normPath(u.pathname);
  let page = m.pages[path];
  let status = 200;
  if (!page && path.startsWith('/community')) page = { ...m.pages['/community'] };
  if (!page) {
    const alias = aliasTarget(path, m);
    if (alias) return Response.redirect(ORIGIN + alias + u.search, 301);
    // Near-duplicate blog articles point to the kept article on the same subject.
    const bm = path.match(/^\/blog\/([a-z0-9-]+)$/);
    const keep = bm && (m.blogRedirects || {})[bm[1]];
    if (keep) return Response.redirect(ORIGIN + '/blog/' + keep, 301);
  }
  if (!page) {
    try { page = await dynamicPage(path, m, ctx); } catch (e) { page = null; }
    if (page && page.status) status = page.status;
  }
  if (!page && (m.appPatterns || []).some((p) => new RegExp(p).test(path))) {
    // A real screen of the app (a case, a shared score...): served as is, never indexed.
    page = { t: 'JuriMatch', d: 'JuriMatch account area.', noindex: true };
  }
  if (!page) {
    // Not a page of the site: the app shows its "not found" screen, and the status says so.
    page = { t: 'Page not found | JuriMatch', d: "This page doesn't exist on JuriMatch.", noindex: true, h1: 'Page not found', links: [{ href: '/', text: 'Home' }, { href: '/lawyers', text: 'Lawyers by case type and country' }] };
    status = 404;
  }

  const url = ORIGIN + path;
  const lang = page.lang || 'en';
  const robots = page.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large';
  const ogType = page.article ? 'article' : 'website';
  const image = page.image || OG_IMAGE;

  // ---- JSON-LD ----
  const lds = [];
  if (page.home) {
    lds.push({ '@context': 'https://schema.org', '@type': 'Organization', name: 'JuriMatch', url: ORIGIN, logo: ORIGIN + '/icon-512.png', parentOrganization: { '@type': 'Organization', name: 'Equinox Investment Group LLC' } });
    lds.push({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'JuriMatch', url: ORIGIN, potentialAction: { '@type': 'SearchAction', target: ORIGIN + '/firms?q={search_term_string}', 'query-input': 'required name=search_term_string' } });
  }
  if (page.crumbs) lds.push(breadcrumbLd(page.crumbs));
  if (page.faq && page.faq.length) lds.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: page.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  if (page.article) lds.push({ '@context': 'https://schema.org', '@type': 'Article', headline: page.h1 || page.t, description: page.d, mainEntityOfPage: url, ...(page.published ? { datePublished: page.published } : {}), ...(page.modified ? { dateModified: page.modified } : {}), publisher: { '@type': 'Organization', name: 'JuriMatch', url: ORIGIN } });
  for (const x of page.extraLd || []) lds.push(x);

  // ---- Crawlable summary inside #root (replaced by the app on load) ----
  let body = '<main id="seo-summary" style="max-width:860px;margin:0 auto;padding:96px 20px 40px;font-family:system-ui,sans-serif">';
  if (page.crumbs) body += '<nav aria-label="Breadcrumb"><ol style="list-style:none;padding:0;display:flex;gap:8px;flex-wrap:wrap;font-size:14px">' + page.crumbs.map(([n, p]) => '<li><a href="' + esc(p) + '">' + esc(n) + '</a></li>').join('') + '</ol></nav>';
  body += '<h1>' + esc(page.h1 || page.t) + '</h1>';
  if (page.lead) body += '<p>' + esc(page.lead) + '</p>';
  if (page.facts) body += '<dl>' + page.facts.map(([k, v]) => '<dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd>').join('') + '</dl>';
  if (page.list) {
    try {
      const { verified, indexed, nVerified, nIndexed } = await listFirms(page.list, ctx);
      const es = lang === 'es';
      if (nVerified !== null && nIndexed !== null) body += es
        ? '<p><strong>Hoy en JuriMatch:</strong> ' + nVerified + ' despacho' + (nVerified === 1 ? '' : 's') + ' verificado' + (nVerified === 1 ? '' : 's') + ' a mano y ' + nIndexed + ' más de nuestro índice (sin verificar) llevan este tipo de caso aquí.</p>'
        : '<p><strong>On JuriMatch today:</strong> ' + nVerified + ' hand-verified firm' + (nVerified === 1 ? '' : 's') + ' and ' + nIndexed + ' more from our index (not verified) list this kind of case' + (page.list.country ? ' here' : '') + '.</p>';
      if (verified.length) body += '<h2>' + (es ? 'Despachos verificados a mano' : 'Hand-verified firms') + '</h2><ul>' + verified.map((f) => firmItem(f, isHand(f), es)).join('') + '</ul>';
      if (indexed.length) body += '<h2>' + (es ? 'Más despachos de nuestro índice' : 'More firms from our index') + '</h2><ul>' + indexed.map((f) => firmItem(f, false, es)).join('') + '</ul>';
      if (verified.length) lds.push({ '@context': 'https://schema.org', '@type': 'ItemList', name: page.h1, itemListElement: verified.map((f, i) => ({ '@type': 'ListItem', position: i + 1, url: ORIGIN + '/firms/' + slugify(f.firm_name), name: f.firm_name })) });
    } catch (e) { /* summary without the list */ }
  }
  const chrome = CHROME[lang] || CHROME.en;
  if (page.faq && page.faq.length) body += '<h2>' + chrome.faq + '</h2>' + page.faq.map((f) => '<h3>' + esc(f.q) + '</h3><p>' + esc(f.a) + '</p>').join('');
  if (page.links && page.links.length) body += '<ul>' + page.links.map((l) => '<li><a href="' + esc(l.href) + '">' + esc(l.text) + '</a></li>').join('') + '</ul>';
  body += '<p><a href="/">JuriMatch</a> | <a href="' + (lang === 'es' ? '/es/abogados-a-exito' : '/lawyers') + '">' + chrome.lawyers + '</a> | <a href="/pricing">' + chrome.pricing + '</a> | <a href="/about">' + chrome.about + '</a></p></main>';

  const headExtra = lds.map(ld).join('')
    + (page.alt || []).map((a) => '<link rel="alternate" hreflang="' + esc(a.hreflang) + '" href="' + esc(a.href) + '" />').join('')
    + (page.article && page.published ? '<meta property="article:published_time" content="' + esc(page.published) + '" />' : '');

  const html = await res.text();
  const h = new Headers(res.headers);
  h.delete('content-length'); h.delete('etag');
  // Item 154: preload the entry bundle and stylesheet already referenced in the HTML (lets the browser, and
  // Cloudflare Early Hints when enabled, start fetching them before the HTML is parsed). Hashed files only.
  const pre = [];
  const jsM = html.match(/src="(\/assets\/index-[A-Za-z0-9_-]+\.js)"/);
  const cssM = html.match(/href="(\/assets\/index-[A-Za-z0-9_-]+\.css)"/);
  if (jsM) pre.push('<' + jsM[1] + '>; rel=modulepreload; crossorigin');
  if (cssM) pre.push('<' + cssM[1] + '>; rel=preload; as=style; crossorigin');
  if (pre.length && !h.has('link')) h.set('link', pre.join(', '));
  if (page.noindex) h.set('x-robots-tag', 'noindex'); else h.delete('x-robots-tag');
  h.set('content-language', lang);
  // Security headers for every HTML page (no camera/mic/location use on the site; no framing by other sites).
  h.set('strict-transport-security', 'max-age=31536000');
  // /embed/* is the search widget other sites embed in an iframe (item 141): framing allowed there only.
  if (u.pathname.startsWith('/embed/')) h.delete('x-frame-options'); else h.set('x-frame-options', 'SAMEORIGIN');
  h.set('permissions-policy', 'camera=(), microphone=(), geolocation=(), usb=(), payment=(self "https://checkout.stripe.com")');
  h.set('cross-origin-opener-policy', 'same-origin-allow-popups');
  // Items 289/290 (1-nov): referrer and MIME sniffing set here too (not only by the zone), and a
  // Content-Security-Policy in report-only mode (browsers log violations in the console, nothing is blocked).
  h.set('referrer-policy', 'strict-origin-when-cross-origin');
  h.set('x-content-type-options', 'nosniff');
  h.set('content-security-policy-report-only', CSP_REPORT_ONLY);
  const set =(attr, value) => ({ element(e) { e.setAttribute(attr, value); } });

  return new HTMLRewriter()
    .on('html', set('lang', lang))
    .on('title', { element(e) { e.setInnerContent(page.t); } })
    .on('meta[name="description"]', set('content', page.d))
    .on('meta[name="robots"]', set('content', robots))
    .on('link[rel="canonical"]', set('href', url))
    .on('meta[property="og:title"]', set('content', page.t))
    .on('meta[property="og:description"]', set('content', page.d))
    .on('meta[property="og:url"]', set('content', url))
    .on('meta[property="og:type"]', set('content', ogType))
    .on('meta[property="og:image"]', set('content', image))
    .on('meta[property="og:image:alt"]', set('content', page.t))
    .on('meta[property="og:locale"]', set('content', OG_LOCALE[lang] || 'en_US'))
    .on('meta[name="twitter:title"]', set('content', page.t))
    .on('meta[name="twitter:description"]', set('content', page.d))
    .on('meta[name="twitter:image"]', set('content', image))
    .on('meta[name="twitter:image:alt"]', set('content', page.t))
    .on('head', { element(e) { e.append(headExtra, { html: true }); } })
    .on('div#root', { element(e) { e.setInnerContent(body, { html: true }); } })
    .on('noscript', { element(e) { e.remove(); } })
    .transform(new Response(html, { status, headers: h }));
}
