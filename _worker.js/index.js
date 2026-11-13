
const SITES = new Set(["52startupsin52weeks.com", "bestsalesclosers.com", "biohackingisland.com", "collectivecolab.com", "createats.com", "equinoxinvestmentgroup.com", "felicityisland.com", "founderspassport.com", "gayrail.com", "jobersity.com", "jurimatch.com", "kindaoclub.com", "kingofstreets.com", "klipstay.com", "kolaboro.com", "landbanky.com", "landstockmarket.com", "leadpoolclub.com", "luxurybeachresidence.com", "monkeyranking.com", "nomadsseasons.com", "persohna.com", "publicscores.com", "reelrole.com", "sevenfounders.com", "sovereign195.com", "thecoreisland.com", "transparently.us", "usersland.com", "voyanoble.com", "yogaecocity.com", "realhunt.co", "lacliniqueswiss.com", "thecigaretteindex.com", "theglampings.com", "sportpassportclub.com", "surfranking.com", "longevityisland.org", "walkwar.com", "voxera.app", "grownomads.com", "aibeachcity.com", "beyondsoma.com", "blacknomadcard.com", "bootcamp.jobersity.com", "fitnessbeachcity.com", "go.realhunt.co", "onlybeachfronthomes.com", "spain.happylowcost.com", "thenomaduniversity.com", "thestartupisland.com", "happysocialclub.com", "levelshotels.com", "thesumbatimes.com"]);

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
let kb = null, kbx = null, ksat = null, klk = null;
const KXR_V = 'n22e1'; let kxr = null; const KXR = /^\/api\/kb\/xray(?:\/stats)?\/?$|^\/api\/v1\/xray(?:\/openapi\.json)?\/?$|^\/x\/[0-9a-f]{64}(?:\/|\.json|\/vc)?$/;   // b11 x11a: Project X-ray (keep equal to PATHS in kbx_xray.js)
let kfw = null; const KFW = /^\/api\/v1\/(?:projects|developers)(?:\/[a-z0-9-]{1,90})?\/?$|^\/api\/v1\/(?:search-index|watch)$|^\/(?:projects|developers)\/[a-z0-9-]{1,90}\/feed\.(?:atom|json)$/;   // b9a: public named API, feeds, watch (keep equal to PATHS9 in kbx_follow.js)
let kog = null, kbk = null; const KB10 = /^\/og\/(?:projects|developers)\/[a-z0-9-]{1,90}\.png$|^\/bulk-check\/?$|^\/api\/kb\/bulk\/?$/;   // b10c: keep equal to PATHS in kbx_og.js + kbx_bulk.js
let kxev = null; const KXEV = /^\/api\/xev(?:\/sat\.png)?$/;   // x11b (batch 11): X-ray evidence cards + Sentinel-2 crop, keep equal to PATHS in kbx_xray_ev.js
let kpp = null; const KPP = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?tools\/permit-photo\/?$/;   // n17d: permit photo reader (keep equal to PATHS in kbx_pp.js)
let kca = null; const KCA = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?tools\/contract-addendum\/?$/;   // n18d: contract addendum builder (keep equal to TOOL_RX in kbx_paper.js)
let knet = null; const KNET = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:graph\/developers|live\/xrays)\/?$|^\/api\/x\/net\/(?:graph|live)$/;   // b14 f14c: developer network graph + live X-ray globe (keep equal to PATHS in kbx_net.js)
let kplot = null; const KPLOT = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?satellite\/plot\/?$/;   // n19d (batch 19): any plot from space, 8 languages (see kbx_plot.js)
let kwat = null; const KWAT = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?watch\/lookalikes\/?$|^\/__k\/kwatch-admin\.js$/;   // n19a (batch 19): lookalike websites feed, admin Screening tab (see kbx_watch.js)
let ke27 = null; const KE27 = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:projects\/[a-z0-9-]{1,90}\/report(?:\/|\.pdf)?|weekly(?:\/[a-z0-9-]{2,40})?\/?)$|^\/weekly\/(?:[a-z0-9-]{2,40}\/feed\.(?:atom|json)|sitemap\.xml)$|^\/api\/x\/e27\/(?:mail\/(?:review|delays)|signups|notices\/[A-Za-z0-9-]{3,20})\/?$/;   // n27e (batch 27): project report + PDF, weekly changes per place, mail previews, sign-ups, notices (keep equal to PATHS in kbx_e27.js)
let ku26 = null; const KU26 = /^\/api\/v1\/(?:facets|followers)$|^\/api\/x\/status\/pages\/?$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?compare\/?$/;   // n26u (batch 26): named compare ?p=, facets for /projects/ filters, follower counts, key-page sweep (keep equal to PATHS in kbx_u26.js)
let ktr = null; const KTR = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:rankings\/transparency(?:\/[a-z0-9-]{2,40})?|methods\/transparency-score)\/?$|^\/rankings\/transparency\/sitemap\.xml$/;   // n23 (batch 23): transparency rankings, 30 islands and 30 cities, 8 languages (keep equal to PAGE_RX + SITEMAP in kbx_tr.js)
let krul = null; const KRUL = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?guides\/short-let-rules\/?$/;   // n21c (batch 21): short-let rules by city (see kbx_rules.js)
let kstg = null; const KSTG = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?methods\/construction-stage\/?$/;   // n18b (batch 18): construction stage method page (see kbx_stage.js)
let kfc = null; const KFC = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:open|methods\/delivery-forecast)\/?$/;   // n17c (batch 17): /open live figures, delivery-forecast method page (see kbx_fc.js)
let k27a = null; const K27A = /^\/answers\/(?:place|developer)\/[a-z0-9-]{1,90}\.md$|^\/api\/v1\/projects\/[a-z0-9-]{1,90}\.csv$|^\/corrections\.(?:json|md)$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?developers\/[a-z0-9-]{1,90}\/dashboard\/?$|^\/yc\/?$|^\/api\/open\/(?:usage|rv)\/?$/;   // n27a: keep equal to PATHS in kbx_n27a.js
let knum = null; const KNUM = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?numbers\/?$/;   // n26i: keep equal to PAGE in kbx_numbers.js
const LLP = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(?:rankings\/transparency\/|countries\/|rankings\/)?$/;   // n26i: pages that carry the least-linked project block
let kfa = null; const KFA = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:handover(?:\/20\d\d\/[a-z0-9-]{2,60})?|areas(?:\/[a-z0-9-]{2,60}\/[a-z0-9-]{2,80})?|vs\/[a-z0-9-]{3,200}-vs-[a-z0-9-]{2,200})\/?$|^\/handover\/sitemap\.xml$/;   // n26s (batch 26): handover year and place, neighbourhoods, same-year comparisons (see kbx_facets.js)
let knm = null; const KNM = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:projects|developers)(?:\/|$)|^\/api\/seo\/(?:urls|scan)$/;   // seoP named pages, keep equal to PATHS in kbx_named.js
let kbix = null; const KBIX = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?tools\/bulk-check\/?$/;   // n21d (batch 21): bulk check against the public index, in the browser, 8 languages (keep equal to PAGE in kbx_bulkix.js)
let kcal = null; const KCAL = /^\/projects\/[a-z0-9-]{1,90}\/calendar\.ics$/;   // n21d (batch 21): promised dates of a named project as an iCalendar file (keep equal to PATHS in kbx_cal.js)
let kxc = null; const KXC = /^\/k\/xray-cta\.js$|^\/api\/x\/xc(\/|$)|^\/embed\/xray(\.js|\/)?$|^\/__k\/kxc-admin\.js$/;   // x11c (batch 11): X-ray conversion block, partner embed, admin tab (keep equal to PATHS in kbx_xc.js)
let kcite = null; const KCITE = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:stories|changes)(?:\/.*)?$|^\/embed\/(?:card|tracker|badge|p)\/.*$|^\/answers\/[a-z0-9-]{1,90}\.md$|^\/llms-projects\.txt$|^\/(?:es|de|fr|nl|ru|zh|ar)\/llms\.txt$|^\/llms\/[a-z0-9-]{2,60}\.txt$/;   // s15c: keep equal to PATHS in kbx_cite.js
let ktru = null; const KTRU = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:progress(?:\/improvements)?|moderation|team|press\/places(?:\/[a-z0-9-]{2,40})?)\/?$|^\/progress\/sitemap\.xml$|^\/api\/x\/progress(?:\/today)?\/?$/;   // n26y (batch 26): progress, 300 improvements, press figures per place, moderation policy, team and method (see kbx_trust.js)
let k404 = null;   // n25e: 301 map, 410 and the translated 404 page (kbx_404.js)
let kseo = null; const KSEO = /^\/(sitemap_index\.xml|api\/seo\/lastmod|sitemaps\/[a-z0-9-]+\.xml|llms(-full)?\.txt|countries(\/.*)?|rankings(\/.*)?|new\/?|vs(\/.*)?|embed\/(delay|project|widgets)(\/.*)?|engineering\/seo\/?|press\/delivery-index(\/.*)?|7f3c9a1e5b2d4c8fa06e91d3b7c4f259\.txt)$/;   // keep equal to PATHS in kbx_seo.js
// rh-kcheck-v2: realhunt.co runtime layer (Kolaboro deal box, sponsored Kolaboro feed card, Eco Beach City at 36,500) at /__k/kcheck.js; kolaboro.com "from RealHunt" banner at /__k/kbrh.js
const KCHECK = "/* realhunt.co runtime layer v6 (30-oct-2026), served by the web-lovable worker at /__k/kcheck.js.\n   1) Kolaboro box on deal pages: visitor in another country than the home and price >= EUR 80,000 (?kb=1 forces it).\n   2) Sponsored Kolaboro card in the home feed (\"check any home\").\n   Events go to realhunt.kb_events and to GA (gtag). */\n(function () {\n  if (window.__rhplus) return; window.__rhplus = 1;\n  var TH = 80000, AK = 'sb_publishable_WWMM9pbZfP4hJosLJlTobg_lWFGoJ3X';\n  var rows = {}, geo, geoAsked = false, key = '', seen = {};\n  function L() { return (document.documentElement.lang || 'en').slice(0, 2) === 'es' ? 'es' : 'en'; }\n  function sid() { try { return localStorage.getItem('rh_sid') || ''; } catch (e) { return ''; } }\n  function log(kind, extra) {\n    var b = { kind: kind, placement: (extra && extra.placement) || null, slug: (extra && extra.slug) || null, viewer: geo || null, lang: L(), sid: sid().slice(0, 60) };\n    if (extra && extra.url) { b.url = String(extra.url).slice(0, 500); b.domain = String(extra.domain || '').slice(0, 120) || null; }\n    try { if (window.gtag) gtag('event', 'kolaboro_' + kind, { slug: b.slug || '', viewer: b.viewer || '' }); } catch (e) {}\n    try { fetch('/__sb/realhunt/rest/v1/kb_events', { method: 'POST', keepalive: true, headers: { apikey: AK, Authorization: 'Bearer ' + AK, 'content-type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(b) }); } catch (e) {}\n  }\n  function askGeo() { if (geoAsked) return; geoAsked = true; fetch('/api/geo').then(function (r) { return r.json(); }).then(function (g) { geo = (g && g.country) || null; }).catch(function () { geo = null; }); }\n  function kurl(u, medium, slug) {\n    return 'https://kolaboro.com/check' + (u ? '?url=' + encodeURIComponent(u) + '&' : '?') + 'utm_source=realhunt&utm_medium=' + medium + '&utm_campaign=' + encodeURIComponent(slug || 'sponsored') + (slug && medium === 'deal_page' ? '&rh=' + encodeURIComponent(slug) : '');\n  }\n  function el(tag, css, txt) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; }\n\n  /* ---------- 1) deal page box ---------- */\n  var TD = {\n    en: { h: 'Buying from abroad? Check it before you pay a deposit', p: 'Free AI check of this listing in about a minute: who is selling, title and permits, red flags. If you want more, a local agent can verify it on site for \u20ac490.', b: 'Check this home with Kolaboro \u2192', s: 'Sponsored. Kolaboro is the buyer-verification service from the team behind RealHunt.' },\n    es: { h: '\u00bfCompras desde fuera? Compru\u00e9bala antes de pagar la reserva', p: 'Revisi\u00f3n gratis con IA de este anuncio en un minuto: qui\u00e9n vende, escrituras y permisos, se\u00f1ales de alarma. Si quieres m\u00e1s, un agente local la verifica en persona por 490 \u20ac.', b: 'Comprobar esta casa con Kolaboro \u2192', s: 'Patrocinado. Kolaboro es el servicio de verificaci\u00f3n de compradores del equipo de RealHunt.' }\n  };\n  function name(cc) { try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(cc); } catch (e) { return cc; } }\n  function same(a, b) { a = String(a || '').toLowerCase(); b = String(b || '').toLowerCase(); return a === b || (a.indexOf('united states') === 0 && b.indexOf('united states') === 0); }\n  function loadDeal(slug) {\n    if (rows[slug] !== undefined) return; rows[slug] = null;\n    fetch('/__sb/realhunt/rest/v1/community_deals?status=eq.approved&select=price_eur,country,source_url&slug=eq.' + encodeURIComponent(slug), { headers: { apikey: AK, Authorization: 'Bearer ' + AK } })\n      .then(function (r) { return r.json(); }).then(function (d) { rows[slug] = (d && d[0]) || false; }).catch(function () { rows[slug] = false; });\n  }\n  function anchor() {\n    var c = ['.hv-aside-cta', '.hunt-detail-actions', '.hv-amenities', '.hv-detail-where'];\n    for (var i = 0; i < c.length; i++) { var e = document.querySelector(c[i]); if (e && e.offsetParent !== null) return e; }\n    return null;\n  }\n  function dealBox(row, slug, lg) {\n    var t = TD[lg], a = el('div', 'margin:14px 0;padding:14px 16px;border-radius:14px;border:1px solid rgba(15,118,110,.35);background:rgba(15,118,110,.07);color:inherit;font-size:14px;line-height:1.45;text-align:left');\n    a.id = 'rh-kb'; a.setAttribute('data-k', slug + '|' + lg);\n    a.appendChild(el('div', 'font-weight:700;font-size:15px;margin-bottom:4px', t.h));\n    a.appendChild(el('div', 'opacity:.85;margin-bottom:10px', t.p));\n    var b = el('a', 'display:inline-block;background:#0f766e;color:#fff;font-weight:600;padding:10px 14px;border-radius:10px;text-decoration:none', t.b);\n    b.href = kurl(row.source_url, 'deal_page', slug); b.target = '_blank'; b.rel = 'noopener';\n    b.addEventListener('click', function () { log('deal_click', { slug: slug, placement: 'deal' }); });\n    a.appendChild(b);\n    a.appendChild(el('div', 'opacity:.6;font-size:12px;margin-top:8px', t.s));\n    return a;\n  }\n  function dealTick() {\n    var m = location.pathname.match(/^\\/deal\\/([^/?#]+)/), old = document.getElementById('rh-kb');\n    if (!m) { if (old) old.remove(); key = ''; return; }\n    var slug = decodeURIComponent(m[1]), lg = L();\n    if (old && old.getAttribute('data-k') === slug + '|' + lg) return;\n    if (old && old.getAttribute('data-k').split('|')[0] !== slug) { old.remove(); old = null; }\n    askGeo(); loadDeal(slug);\n    if (rows[slug] === null || rows[slug] === undefined || geo === undefined) return;\n    var row = rows[slug], force = /[?&]kb=1/.test(location.search);\n    var ok = row && row.source_url && (force || (row.price_eur >= TH && geo && !same(name(geo), row.country)));\n    if (!ok) { if (old) old.remove(); return; }\n    var an = anchor(); if (!an) return;\n    if (old) old.remove();\n    an.parentNode.insertBefore(dealBox(row, slug, lg), an.nextSibling);\n    if (key !== slug) { key = slug; log('deal_view', { slug: slug, placement: 'deal' }); }\n  }\n\n  /* ---------- 2) sponsored Kolaboro card in the feed (v4: clear promise, 3 steps, example report) ---------- */\n  var TF = {\n    en: { lab: 'Sponsored \u00b7 Kolaboro', badge: 'Free \u00b7 1 minute \u00b7 any country',\n          h: 'Is this home legit? Check it before you pay a deposit.',\n          sub: 'Paste the link of any listing you found abroad. Kolaboro tells you who is really selling and what to ask before you send money.',\n          st: [['Paste the link', 'Idealista, Rightmove, Zillow, any agency'], ['AI checks it in 1 min', 'Seller, title, permits, price vs. area'], ['Want certainty?', 'A local agent visits it for \u20ac490']],\n          ph: 'Paste a listing link or website\u2026', b: 'Check it free \u2192', bad: 'Paste a link or a website, e.g. idealista.com/inmueble/123', note: 'No sign-up. Free report.',\n          ex: 'Example report', home: 'Sea-view villa \u00b7 Algarve \u00b7 \u20ac320,000', src: 'idealista.pt',\n          sc: 'Trust score', scv: 'Fair, ask 2 questions',\n          r: [['ok', 'Seller found: registered agency'], ['ok', 'Price in line with the area'], ['warn', 'Habitation licence not shown'], ['warn', 'Owner name differs from seller']] },\n    es: { lab: 'Patrocinado \u00b7 Kolaboro', badge: 'Gratis \u00b7 1 minuto \u00b7 cualquier pa\u00eds',\n          h: '\u00bfEsta casa es de fiar? Compru\u00e9bala antes de pagar la reserva.',\n          sub: 'Pega el enlace de cualquier anuncio que hayas visto fuera. Kolaboro te dice qui\u00e9n vende de verdad y qu\u00e9 preguntar antes de mandar dinero.',\n          st: [['Pega el enlace', 'Idealista, Rightmove, Zillow, cualquier agencia'], ['La IA lo revisa en 1 min', 'Vendedor, escrituras, permisos, precio de zona'], ['\u00bfQuieres certeza?', 'Un agente local la visita por 490 \u20ac']],\n          ph: 'Pega el enlace de un anuncio o una web\u2026', b: 'Comprobar gratis \u2192', bad: 'Pega un enlace o una web, por ejemplo idealista.com/inmueble/123', note: 'Sin registro. Informe gratis.',\n          ex: 'Informe de ejemplo', home: 'Villa con vistas al mar \u00b7 Algarve \u00b7 320.000 \u20ac', src: 'idealista.pt',\n          sc: 'Nota de confianza', scv: 'Correcta, 2 preguntas',\n          r: [['ok', 'Vendedor: agencia registrada'], ['ok', 'Precio acorde a la zona'], ['warn', 'No muestra licencia de habitabilidad'], ['warn', 'El titular no coincide con quien vende']] }\n  };\n  var CSS = '.rkb{grid-column:1/-1;border-radius:20px;overflow:hidden;background:linear-gradient(135deg,#062b27 0%,#0b4f48 55%,#0f766e 100%);color:#fff;box-shadow:0 10px 30px rgba(6,43,39,.18);position:relative}' +\n    '.rkb *{box-sizing:border-box}.rkb-in{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:28px;padding:28px;align-items:center}' +\n    '.rkb-top{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px}' +\n    '.rkb-lab{font-size:11px;letter-spacing:.06em;text-transform:uppercase;opacity:.7}' +\n    '.rkb-badge{font-size:12px;font-weight:700;background:#fbbf24;color:#3b2a00;border-radius:999px;padding:4px 10px}' +\n    '.rkb h2{font-size:clamp(22px,2.6vw,30px);line-height:1.15;margin:0 0 10px;font-weight:800;color:#fff;letter-spacing:-.01em}' +\n    '.rkb-sub{font-size:15px;line-height:1.5;opacity:.88;margin:0 0 18px}' +\n    '.rkb-steps{list-style:none;margin:0 0 18px;padding:0;display:grid;gap:10px}' +\n    '.rkb-steps li{display:flex;gap:12px;align-items:flex-start;font-size:14px;line-height:1.35}' +\n    '.rkb-n{flex:0 0 26px;height:26px;border-radius:50%;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px}' +\n    '.rkb-steps b{display:block;font-weight:700}.rkb-steps span{opacity:.75;font-size:13px}' +\n    '.rkb-f{display:flex;gap:8px;flex-wrap:wrap;background:#fff;border-radius:14px;padding:6px}' +\n    '.rkb-f input{flex:1 1 180px;min-width:0;border:0;outline:0;background:transparent;color:#0f172a;font:inherit;font-size:15px;padding:10px 10px}' +\n    '.rkb-f button{flex:0 0 auto;border:0;cursor:pointer;border-radius:10px;padding:11px 16px;font-weight:700;font-size:15px;background:#ea580c;color:#fff}' +\n    '.rkb-f button:hover{background:#c2410c}.rkb-note{font-size:12px;opacity:.7;margin-top:8px}' +\n    '.rkb-rep{display:block;background:#fff;color:#0f172a;border-radius:16px;padding:16px;box-shadow:0 18px 40px rgba(0,0,0,.3);text-decoration:none;max-width:420px;width:100%;justify-self:center;transform:rotate(-1deg)}' +\n    '.rkb-rep:hover{transform:rotate(0)}.rkb-rh{display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#0f766e;font-weight:800;margin-bottom:10px}' +\n    '.rkb-url{font-size:12px;color:#475569;background:#f1f5f9;border-radius:8px;padding:6px 8px;margin-bottom:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +\n    '.rkb-sc{display:flex;gap:14px;align-items:center;margin-bottom:12px}' +\n    '.rkb-ring{flex:0 0 64px;height:64px;border-radius:50%;background:conic-gradient(#f59e0b 0 72%,#e2e8f0 72% 100%);display:flex;align-items:center;justify-content:center}' +\n    '.rkb-ring div{width:50px;height:50px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800}' +\n    '.rkb-sc b{display:block;font-size:15px}.rkb-sc span{font-size:12px;color:#64748b}' +\n    '.rkb-row{display:flex;gap:8px;align-items:center;font-size:13px;padding:5px 0;border-top:1px solid #f1f5f9}' +\n    '.rkb-i{flex:0 0 18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff}' +\n    '.rkb a.rkb-rep,.rkb a.rkb-rep b,.rkb .rkb-ring div,.rkb .rkb-row span+span{color:#0f172a!important}.rkb a.rkb-rep .rkb-sc span{color:#64748b!important}.rkb a.rkb-rep .rkb-rh span:first-child{color:#0f766e!important}' +\n    '.rkb .rkb-f input{background:#fff!important;color:#0f172a!important;border:0!important;box-shadow:none!important}.rkb .rkb-f input::placeholder{color:#64748b}' +\n    '@media (max-width:560px){.rkb-in{padding:20px;gap:18px}.rkb-sub{display:none}.rkb-rep{transform:none}.rkb-f button{flex:1 1 100%}.rkb-row:nth-of-type(n+7){display:none}}';\n  /* accepts \"idealista.com/inmueble/123\", \"www.x.com\", \"https://...\" or text with a link inside; null for plain words */\n  function normUrl(v) {\n    v = String(v || '').trim(); if (!v) return null;\n    var m = v.match(/https?:\\/\\/[^\\s\"'<>]+/i) || v.match(/(?:www\\.)?[a-z0-9-]+(?:\\.[a-z0-9-]+)*\\.[a-z]{2,}(?:[\\/?#][^\\s\"'<>]*)?/i);\n    if (!m) return null;\n    var u = m[0].replace(/[),.;]+$/, ''); if (!/^https?:\\/\\//i.test(u)) u = 'https://' + u;\n    try { var x = new URL(u); if (!/\\./.test(x.hostname)) return null; return { url: x.href, domain: x.hostname.replace(/^www\\./, '').toLowerCase() }; } catch (e) { return null; }\n  }\n  function feedCard(lg) {\n    var t = TF[lg];\n    if (!document.getElementById('rkb-css')) { var st = el('style'); st.id = 'rkb-css'; st.textContent = CSS; document.head.appendChild(st); }\n    var span = el('div'); span.className = 'hx-span'; span.setAttribute('data-rhkb', lg);\n    var art = el('article'); art.className = 'rkb'; art.setAttribute('aria-label', t.lab); span.appendChild(art);\n    var inr = el('div'); inr.className = 'rkb-in'; art.appendChild(inr);\n    var L1 = el('div'); inr.appendChild(L1);\n    var top = el('div'); top.className = 'rkb-top';\n    var bd = el('span', null, t.badge); bd.className = 'rkb-badge'; top.appendChild(bd);\n    var lb = el('span', null, t.lab); lb.className = 'rkb-lab'; top.appendChild(lb); L1.appendChild(top);\n    L1.appendChild(el('h2', null, t.h));\n    var sb = el('p', null, t.sub); sb.className = 'rkb-sub'; L1.appendChild(sb);\n    var ol = el('ol'); ol.className = 'rkb-steps';\n    t.st.forEach(function (s, i) { var li = el('li'); var n = el('span', null, String(i + 1)); n.className = 'rkb-n'; li.appendChild(n); var tx = el('div'); tx.appendChild(el('b', null, s[0])); tx.appendChild(el('span', null, s[1])); li.appendChild(tx); ol.appendChild(li); });\n    L1.appendChild(ol);\n    var f = el('form'); f.className = 'rkb-f';\n    var inp = el('input'); inp.type = 'text'; f.noValidate = true; inp.spellcheck = false; inp.setAttribute('autocapitalize', 'off'); inp.placeholder = t.ph; inp.setAttribute('aria-label', t.ph); inp.autocomplete = 'off'; inp.inputMode = 'url';\n    var btn = el('button', null, t.b); btn.type = 'submit';\n    f.appendChild(inp); f.appendChild(btn); L1.appendChild(f);\n    var nt = el('div', null, t.note); nt.className = 'rkb-note'; L1.appendChild(nt);\n    var hint = el('div', 'display:none;font-size:13px;margin-top:8px;color:#fde68a'); L1.appendChild(hint);\n    inp.addEventListener('input', function () { hint.style.display = 'none'; });\n    f.addEventListener('submit', function (e) {\n      e.preventDefault();\n      var n = normUrl(inp.value);\n      if (inp.value.trim() && !n) { hint.textContent = t.bad; hint.style.display = 'block'; inp.focus(); return; }\n      if (n) inp.value = n.url;\n      log(n ? 'feed_paste' : 'feed_click', { placement: 'feed_form', url: n && n.url, domain: n && n.domain });\n      window.open(kurl(n ? n.url : '', 'feed_card', 'sponsored_check'), '_blank', 'noopener');\n    });\n    var rep = el('a'); rep.className = 'rkb-rep'; rep.href = kurl('', 'feed_card', 'sponsored_check'); rep.target = '_blank'; rep.rel = 'noopener';\n    rep.addEventListener('click', function () { log('feed_click', { placement: 'feed_visual' }); });\n    var rh = el('div'); rh.className = 'rkb-rh'; rh.appendChild(el('span', null, t.ex)); rh.appendChild(el('span', 'color:#94a3b8', 'Kolaboro')); rep.appendChild(rh);\n    var ur = el('div', null, '\ud83d\udd17 ' + t.src + ' \u00b7 ' + t.home); ur.className = 'rkb-url'; rep.appendChild(ur);\n    var sc = el('div'); sc.className = 'rkb-sc'; var ring = el('div'); ring.className = 'rkb-ring'; ring.appendChild(el('div', null, '72')); sc.appendChild(ring);\n    var sct = el('div'); sct.appendChild(el('b', null, t.scv)); sct.appendChild(el('span', null, t.sc + ' 72/100')); sc.appendChild(sct); rep.appendChild(sc);\n    t.r.forEach(function (r) { var row = el('div'); row.className = 'rkb-row'; var ic = el('span', 'background:' + (r[0] === 'ok' ? '#0f766e' : '#d97706'), r[0] === 'ok' ? '\u2713' : '!'); ic.className = 'rkb-i'; row.appendChild(ic); row.appendChild(el('span', null, r[1])); rep.appendChild(row); });\n    inr.appendChild(rep);\n    try { new IntersectionObserver(function (es, o) { es.forEach(function (x) { if (x.isIntersecting && !seen.feed) { seen.feed = 1; log('feed_view', { placement: 'feed' }); o.disconnect(); } }); }, { threshold: 0.5 }).observe(span); } catch (e) {}\n    return span;\n  }\n  function feedTick() {\n    var g = document.querySelector('.hx-grid'); if (!g) return;\n    var lg = L(), cur = g.querySelector(':scope > [data-rhkb]');\n    /* v6: after a filter change React rebuilds the grid and the card ended up first; keep it around position 18 */\n    if (cur && cur.getAttribute('data-rhkb') === lg) { var idx = Array.prototype.indexOf.call(g.children, cur); if (idx >= 12) return; }\n    if (cur) cur.remove();\n    var k = g.children; if (k.length < 12) return;\n    var i = Math.min(18, k.length - 1);\n    while (i < k.length - 1 && (/hx-span/.test(k[i].className) || /hx-span/.test(k[i - 1].className))) i++;\n    g.insertBefore(feedCard(lg), k[i]);\n  }\n\n  function tick() { try { dealTick(); } catch (e) {} try { feedTick(); } catch (e) {} }\n  var pend = false;\n  try { new MutationObserver(function () { if (pend) return; pend = true; requestAnimationFrame(function () { pend = false; tick(); }); }).observe(document.documentElement, { childList: true, subtree: true, characterData: true }); } catch (e) {}\n  setInterval(tick, 800); tick();\n})();\n";
const KBRH = "/* kolaboro.com/check: \"you came from RealHunt\" banner (v1, 30-oct-2026), served by the web-lovable worker at /__k/kbrh.js.\n   Shown when the URL has utm_source=realhunt and rh=<RealHunt slug>. */\n(function () {\n  var q = new URLSearchParams(location.search), slug = q.get('rh');\n  if (q.get('utm_source') !== 'realhunt' || !slug || !/^[\\w-]{3,120}$/.test(slug)) return;\n  var AK = 'sb_publishable_WWMM9pbZfP4hJosLJlTobg_lWFGoJ3X';\n  function el(tag, css, txt) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; }\n  function money(n) { try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n); } catch (e) { return '\u20ac' + n; } }\n  fetch('https://realhunt.co/__sb/realhunt/rest/v1/community_deals?status=eq.approved&select=title,price_eur,location_name,country,image_urls,source_domain&slug=eq.' + encodeURIComponent(slug), { headers: { apikey: AK, Authorization: 'Bearer ' + AK } })\n    .then(function (r) { return r.json(); }).then(function (d) {\n      var h = d && d[0]; if (!h) return;\n      var az = document.getElementById('az'); if (!az || document.getElementById('kb-from-rh')) return;\n      var box = el('div', 'display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin:0 0 18px;padding:12px;border:1px solid rgba(15,23,42,.12);border-radius:14px;background:rgba(255,255,255,.7);text-align:left');\n      box.id = 'kb-from-rh';\n      var img = (h.image_urls || [])[0];\n      if (img) { var im = el('img', 'width:96px;height:72px;object-fit:cover;border-radius:10px;flex:0 0 auto'); im.src = /^https?:/.test(img) ? img : 'https://realhunt.co' + img; im.alt = ''; im.loading = 'lazy'; box.appendChild(im); }\n      var t = el('div', 'min-width:0;flex:1 1 auto;font-size:14px;line-height:1.4');\n      t.appendChild(el('div', 'font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.7;font-weight:700', 'From RealHunt'));\n      t.appendChild(el('div', 'font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis', h.title || ''));\n      t.appendChild(el('div', 'opacity:.8', [money(h.price_eur), h.location_name, h.country].filter(Boolean).join(' \u00b7 ')));\n      t.appendChild(el('div', 'opacity:.8;margin-top:2px', 'We are reading the listing' + (h.source_domain ? ' on ' + h.source_domain : '') + ' now. Your free desk review appears below.'));\n      box.appendChild(t);\n      var back = el('a', 'flex:0 0 auto;font-size:13px;white-space:nowrap', '\u2190 Back to the home'); back.href = 'https://realhunt.co/deal/' + encodeURIComponent(slug); box.appendChild(back);\n      az.parentNode.insertBefore(box, az);\n      try { if (window.kbEvent) kbEvent('rh_ref', { slug: slug }); } catch (e) {}\n    }).catch(function () {});\n})();\n";
// rh-ktraffic-v1: kolaboro.com/admin "Traffic" tab at /__k/ktraffic.js (sources of visits + RealHunt placements; RPC kolaboro_traffic)
const KTRAF = "/* kolaboro.com/admin: \"Traffic\" tab (v1, 30-oct-2026), served by the web-lovable worker at /__k/ktraffic.js.\n   Where kolaboro.com visitors come from (first-touch source per visit) and what the RealHunt placements send:\n   card views, clicks, links pasted (which sites people check) and which homes send clicks. Data: RPC kolaboro_traffic. */\n(function () {\n  if (window.__ktraf) return; window.__ktraf = 1;\n  var days = 30, busy = false;\n  function $(i) { return document.getElementById(i); }\n  function okHref(u) { u = String(u == null ? '' : u).trim(); return u.charAt(0) === '/' || u.toLowerCase().indexOf('https://') === 0 || u.toLowerCase().indexOf('http://') === 0 ? u : '#'; }\n  function esc(x) { return String(x == null ? '' : x).replace(/[&<>\"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', \"'\": '&#39;' }[c]; }); }\n  function when(t) { var d = new Date(t), s = (Date.now() - d) / 1000; if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min ago'; if (s < 86400) return Math.round(s / 3600) + ' h ago'; return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ' ' + d.toTimeString().slice(0, 5); }\n  function table(head, rows) { if (!rows.length) return '<p class=\"muted\" style=\"margin:6px 0\">Nothing yet in this period.</p>'; return '<div class=\"tw\"><table><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr>' + rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>'; }\n  function bars(list, key, key2) {\n    if (!list.length) return '<p class=\"muted\">Nothing yet.</p>';\n    var mx = Math.max.apply(null, list.map(function (x) { return x[key] || 0; }).concat([1]));\n    return '<div style=\"display:flex;align-items:flex-end;gap:3px;height:120px;padding-top:8px\">' + list.map(function (x) {\n      var h = Math.round(100 * (x[key] || 0) / mx), h2 = key2 ? Math.round(100 * (x[key2] || 0) / mx) : 0;\n      return '<div title=\"' + esc(x.d) + ': ' + (x[key] || 0) + (key2 ? ' (' + (x[key2] || 0) + ' from RealHunt)' : '') + '\" style=\"flex:1;min-width:6px;height:' + Math.max(h, 2) + '%;background:#FFE6D9;border-radius:4px 4px 0 0;position:relative\">' + (h2 ? '<div style=\"position:absolute;bottom:0;left:0;right:0;height:' + Math.round(100 * h2 / Math.max(h, 1)) + '%;background:#0f766e;border-radius:4px 4px 0 0\"></div>' : '') + '</div>';\n    }).join('') + '</div>';\n  }\n  function kpi(a, b, c) { return '<div class=\"kpi\"><span>' + a + '</span><b>' + b + '</b><small>' + c + '</small></div>'; }\n  function render(d) {\n    var rh = d.rh || {}, k = rh.kinds || {}, td = rh.today || {}, rv = (d.sources || []).filter(function (s) { return s.src === 'realhunt'; }).reduce(function (a, s) { return a + s.n; }, 0);\n    var leadRh = (d.lead_sources || []).filter(function (s) { return s.src === 'realhunt'; })[0] || { n: 0, desk: 0 };\n    var clicks = (k.feed_click || 0) + (k.deal_click || 0) + (k.feed_paste || 0);\n    var html = '<div class=\"kpis\">' +\n      kpi('Kolaboro visits', d.visits || 0, 'last ' + days + ' days, 1 per session') +\n      kpi('Visits from RealHunt', rv, (d.visits ? Math.round(100 * rv / d.visits) : 0) + '% of all visits') +\n      kpi('Leads from RealHunt', leadRh.n, leadRh.desk + ' desk reviews') +\n      kpi('RealHunt card views', (k.feed_view || 0) + (k.deal_view || 0), 'today ' + ((td.feed_view || 0) + (td.deal_view || 0))) +\n      kpi('Links checked from RealHunt', k.feed_paste || 0, 'today ' + (td.feed_paste || 0)) +\n      kpi('Clicks to Kolaboro', clicks, ((k.feed_view || 0) + (k.deal_view || 0) ? (100 * clicks / ((k.feed_view || 0) + (k.deal_view || 0))).toFixed(1) : '0') + '% of views') +\n      '</div>';\n    html += '<div class=\"card\"><h2>Where Kolaboro visitors come from</h2><p class=\"muted\" style=\"margin:0 0 8px;font-size:.85rem\">First source of each visitor (utm_source, ad click id or referring site). One row per session.</p>' +\n      table(['Source', 'Medium', 'Visits', 'Last'], (d.sources || []).map(function (s) { return [esc(s.src), esc(s.medium || '-'), '<b>' + s.n + '</b>', when(s.last)]; })) + '</div>';\n    html += '<div class=\"card\"><h2>Visits per day</h2><p class=\"muted\" style=\"margin:0;font-size:.85rem\">Green part = from RealHunt.</p>' + bars(d.daily || [], 'n', 'rh') + '</div>';\n    html += '<div class=\"card\"><h2>Leads by source</h2>' + table(['Source', 'Leads', 'Desk reviews', 'Check requests'], (d.lead_sources || []).map(function (s) { return [esc(s.src), '<b>' + s.n + '</b>', s.desk, s.checks]; })) +\n      '<h2 style=\"margin-top:16px\">Campaigns</h2>' + table(['Source', 'Campaign', 'Visits'], (d.campaigns || []).map(function (s) { return [esc(s.src), esc(s.campaign), s.n]; })) +\n      '<h2 style=\"margin-top:16px\">Landing pages</h2>' + table(['Page', 'Visits'], (d.landing || []).map(function (s) { return ['<a href=\"' + esc(okHref(s.page)) + '\" target=\"_blank\" rel=\"noopener\">' + esc(s.page) + '</a>', s.n]; })) + '</div>';\n    html += '<div class=\"card\"><h2>RealHunt \u2192 Kolaboro</h2><p class=\"muted\" style=\"margin:0 0 8px;font-size:.85rem\">Sponsored card in the realhunt.co feed and the box on home pages (shown to foreign visitors on homes of \u20ac80k or more).</p>' +\n      bars((rh.daily || []).map(function (x) { return { d: x.d, v: x.views, c: x.clicks + x.pastes }; }), 'v', 'c') +\n      '<p class=\"muted\" style=\"font-size:.85rem;margin:4px 0 12px\">Bars = views, green = clicks and links pasted.</p>' +\n      '<h2>Which sites people check</h2>' + table(['Site', 'Links pasted', 'Last'], (rh.domains || []).map(function (s) { return ['<b>' + esc(s.domain) + '</b>', s.n, when(s.last)]; })) +\n      '<h2 style=\"margin-top:16px\">Latest links pasted</h2>' + table(['When', 'Link', 'Visitor country', 'Lang'], (rh.pastes || []).map(function (s) { return [when(s.ts), '<a href=\"' + esc(okHref(s.url)) + '\" target=\"_blank\" rel=\"noopener noreferrer\">' + esc(String(s.url || '').slice(0, 90)) + '</a>', esc(s.viewer || '?'), esc(s.lang || '')]; })) +\n      '<h2 style=\"margin-top:16px\">Homes that show the box</h2>' + table(['Home', 'Box views', 'Clicks'], (rh.homes || []).map(function (s) { return ['<a href=\"https://realhunt.co/deal/' + encodeURIComponent(s.slug) + '\" target=\"_blank\" rel=\"noopener\">' + esc(s.slug) + '</a>', s.views, '<b>' + s.clicks + '</b>']; })) +\n      '<h2 style=\"margin-top:16px\">Visitor countries on RealHunt</h2>' + table(['Country', 'Views and clicks', 'Clicks and pastes'], (rh.countries || []).map(function (s) { return [esc(s.viewer), s.n, s.acts]; })) + '</div>';\n    $('t-traffic-body').innerHTML = html;\n  }\n  function load() {\n    if (busy || !window.KBADM) return; busy = true; $('t-traffic-body').innerHTML = '<p class=\"muted\">Loading\u2026</p>';\n    window.KBADM.rpc('kolaboro_traffic', { p_key: window.KBADM.pw(), p_days: days }).then(function (d) {\n      busy = false; if (!d || d.error) { $('t-traffic-body').innerHTML = '<p class=\"muted\">Could not load (' + esc(d && (d.error || d.message)) + ').</p>'; return; } render(d);\n    }).catch(function (e) { busy = false; $('t-traffic-body').innerHTML = '<p class=\"muted\">Could not load.</p>'; });\n  }\n  function setup() {\n    var nav = document.querySelector('nav.tabs'), main = document.querySelector('main'); if (!nav || !main || !window.KBADM) return false;\n    if ($('t-traffic')) return true;\n    var b = document.createElement('button'); b.setAttribute('data-t', 'traffic'); b.textContent = 'Traffic';\n    var growth = nav.querySelector('[data-t=\"growth\"]'); nav.insertBefore(b, growth || null);\n    var sec = document.createElement('section'); sec.id = 't-traffic'; sec.className = 'hide';\n    sec.innerHTML = '<div style=\"display:flex;gap:8px;align-items:center;margin:0 0 12px;flex-wrap:wrap\"><b>Period</b>' + [7, 30, 90].map(function (n) { return '<button data-days=\"' + n + '\" class=\"' + (n === days ? 'on' : '') + '\" style=\"padding:6px 12px;border-radius:999px;border:1px solid #ddd;background:' + (n === days ? '#111;color:#fff' : '#fff') + ';cursor:pointer\">' + n + ' days</button>'; }).join('') + '</div><div id=\"t-traffic-body\"></div>';\n    main.appendChild(sec);\n    sec.querySelectorAll('[data-days]').forEach(function (x) { x.onclick = function () { days = +x.getAttribute('data-days'); sec.querySelectorAll('[data-days]').forEach(function (y) { var on = y === x; y.style.background = on ? '#111' : '#fff'; y.style.color = on ? '#fff' : ''; }); load(); }; });\n    b.onclick = function () {\n      nav.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });\n      main.querySelectorAll(':scope > section').forEach(function (s) { s.classList.toggle('hide', s !== sec); });\n      load();\n    };\n    nav.querySelectorAll('button').forEach(function (x) { if (x !== b) x.addEventListener('click', function () { b.classList.remove('on'); sec.classList.add('hide'); }); });\n    if (location.hash === '#traffic') b.click();\n    return true;\n  }\n  var n = 0, iv = setInterval(function () { if (setup() || ++n > 120) clearInterval(iv); }, 500);\n})();\n";
const NOSPA = new Set(["thesumbatimes.com", "equinoxinvestmentgroup.com", "grownomads.com", "kolaboro.com", "aibeachcity.com", "beyondsoma.com", "blacknomadcard.com", "bootcamp.jobersity.com", "fitnessbeachcity.com", "go.realhunt.co", "onlybeachfronthomes.com", "spain.happylowcost.com", "thenomaduniversity.com", "thestartupisland.com", "happysocialclub.com", "levelshotels.com"]);
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
  if (!/text\/html/.test(ct)) {
    // static files: versioned (?v=) files never change, so browsers keep them a year; fonts and images a month
    if (r.status === 200 && /\.(css|js|woff2|svg|png|webp|jpg|jpeg|gif|ico|mp4|pdf)$/i.test(u.pathname)) {
      const h = new Headers(r.headers);
      h.set('cache-control', /[?&]v=/.test(u.search) ? 'public, max-age=31536000, immutable' : (/\.(woff2|png|webp|jpg|jpeg|gif|ico|svg|mp4)$/i.test(u.pathname) ? 'public, max-age=2592000' : 'public, max-age=3600'));
      h.set('x-content-type-options', 'nosniff');
      return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
    }
    // published data (GitHub Actions rewrite these files): short cache so a new publish shows within a minute, versioned copies stay immutable
    if (r.status === 200 && /^\/data\/.+\.json$/i.test(u.pathname)) {
      const h = new Headers(r.headers);
      h.set('cache-control', /[?&]v=/.test(u.search) ? 'public, max-age=31536000, immutable' : 'public, max-age=60, stale-while-revalidate=300');
      h.set('x-content-type-options', 'nosniff');
      return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
    }
    return r;
  }
  const h = new Headers(r.headers);
  // crawl hygiene (batch 15, s15b): a page reached with a functional query (?q=, ?sort=, ?lang=, ?page= ...) is a duplicate or a thin
  // result list: noindex, follow. Tracking-only queries (utm_*, gclid, fbclid, msclkid, ref) keep the canonical as the only signal.
  if (u.search && r.status === 200 && !h.has('x-robots-tag') && [...u.searchParams.keys()].some(k => !/^(utm_[a-z_]+|gclid|fbclid|msclkid|mc_[a-z]+|ref|v)$/i.test(k))) h.set('x-robots-tag', 'noindex, follow');
  const priv = /^\/(admin|portal|login|agents\/me|agents\/apply)(\/|$)/.test(u.pathname);
  const embed = /^\/(embed|press\/data\/embed)(\/|$)/.test(u.pathname);   // widgets made to be embedded by other sites
  if (embed) h.delete('x-frame-options'); else h.set('x-frame-options', priv ? 'DENY' : 'SAMEORIGIN');
  // n20s (9 Nov 2026): script-src-attr 'none' is enforced (no inline on*= handlers are left on the site), so markup injected into a page cannot carry a handler
  h.set('content-security-policy', "frame-ancestors " + (priv ? "'none'" : embed ? "*" : "'self'") + "; base-uri 'self'; object-src 'none'; script-src-attr 'none'; form-action 'self' https://www.paypal.com https://oykcsmextclpdnugixqz.supabase.co; upgrade-insecure-requests");
  if (!h.has('referrer-policy')) h.set('referrer-policy', 'strict-origin-when-cross-origin');
  if (!h.has('x-content-type-options')) h.set('x-content-type-options', 'nosniff');
  h.set('permissions-policy', 'camera=(self), microphone=(self), geolocation=(self), payment=(), usb=(), interest-cohort=()');
  // Strict CSP trial (report-only): a fresh nonce per response is stamped on every <script> of our own static HTML, with
  // 'strict-dynamic' so trusted scripts can load GTM, Clarity, leaflet, d3 or DuckDB. 'unsafe-inline' and https: are only
  // fallbacks for pre-CSP3 browsers (ignored when a nonce is present). Reports go to /api/kb/csp. Plan: scratchpad csp-strict.txt.
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  h.set('content-security-policy-report-only', KB_CSP.replace(/\{N\}/g, nonce).replace('{FA}', priv ? "'none'" : embed ? '*' : "'self'"));
  h.set('reporting-endpoints', 'csp="/api/kb/csp"');
  // n20s: opt-in trial of the strict policy as ENFORCED on one page view (add ?csp=strict), to see what would break before it becomes the default
  // The log-in and password-reset pages (where credentials are typed) already run with the strict policy enforced: tested 9 Nov 2026 with
  // signup, log-in, wrong password, reset and analytics, no blocked script.
  if (u.searchParams.get('csp') === 'strict' || /^\/(login|reset)(\/|$)/.test(u.pathname)) h.set('content-security-policy', h.get('content-security-policy-report-only') + '; upgrade-insecure-requests');
  // n21e (11 Nov 2026): the strict SCRIPT rules are now enforced on every page: a script runs only with this response's nonce, or when a
  // script that has it loads it ('strict-dynamic'); no inline handlers, no eval (WebAssembly allowed), workers from our origin or blob: only.
  // Tested with ?csp=strict on 271 URLs and every interactive tool, the portal and the admin before the switch (scratchpad n21/n21e-issues.md).
  // The rest of the policy (connect, img, style, frame sources) stays report-only. Rollback in one line: KB_CSP_SCRIPTS = false below
  // (or Pages variable KB_CSP_STRICT=0, read at the top of fetch). Counts: /api/x/live/csp.
  else if (KB_CSP_SCRIPTS) {
    h.set('content-security-policy', h.get('content-security-policy') + "; script-src 'nonce-" + nonce + "' 'strict-dynamic' 'wasm-unsafe-eval' 'unsafe-inline' https:; worker-src 'self' blob:; report-uri /api/kb/csp; report-to csp");
    // the script rules are enforced above, so the report-only copy stops judging scripts: a blocked script is reported once, and the
    // one false report per page view (Cloudflare gives its Zaraz loader a nonce in an enforced header only) is gone from the counts
    h.set('content-security-policy-report-only', h.get('content-security-policy-report-only').replace(/script-src [^;]+; script-src-attr 'none'; /, "script-src * 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: data:; "));
  }
  h.set('cross-origin-opener-policy', 'same-origin-allow-popups');
  if (priv) { h.set('cache-control', 'no-store'); h.set('x-robots-tag', 'noindex, nofollow'); }
  h.delete('access-control-allow-origin');
  h.set('cache-control', priv ? 'no-store' : 'no-cache'); // a nonce must never be reused from a cache
  // n21e: Russian pages get the right noun form after a number ("2 проекта", "1 проект"; the templates only carry "проектов")
  const ru = r.status === 200 && r.body && /^\/ru(\/|$)/.test(u.pathname);
  if (ru) h.delete('content-length');
  const out = new Response(ru ? new ReadableStream({ async start(c) { try { c.enqueue(new TextEncoder().encode(kbRu(await r.text()))); c.close(); } catch (e) { c.error(e); } } }) : r.body, { status: r.status, statusText: r.statusText, headers: h });
  // design system (d12a, 7 Nov 2026): /k/ds.css goes right after site.css or app.css, or at the end of <head> when a page has neither
  let ds = false; const styleIds = new Set(); const DSL = '<link rel="stylesheet" href="/k/ds.css?v=' + KB_DS_V + '">';
  // n20p: pages that load site.css get /k/ds-site.css, the same rules without the :has() page test (see that file's first lines)
  const DSLS = KB_DSS_V === KB_DS_V ? '<link rel="stylesheet" href="/k/ds-site.css?v=' + KB_DS_V + '">' : DSL;
  // n20s (9 Nov 2026): the account-wide "analytics-all" worker adds Google Analytics to any page whose <head> does not carry it, without a
  // nonce and without waiting (that was every strict-CSP report: about 35 page types). Pages without the tag now get the same tag from
  // here, with the nonce and held until the first interaction like on every other page; analytics-all then sees it and adds nothing.
  let ga = false, gaTail = '';
  return new HTMLRewriter().on('script', { element(e) { e.setAttribute('nonce', nonce); if ((e.getAttribute('src') || '').startsWith('/k/prov.js')) e.setAttribute('src', '/k/prov.js?v=' + KB_PROV_V); } })
    .on('head script', { element(e) { gaTail = ''; if ((e.getAttribute('src') || '').includes(KB_GA)) ga = true; }, text(t) { if (ga) return; const x = gaTail + t.text; if (x.includes(KB_GA)) ga = true; gaTail = t.lastInTextNode ? '' : x.slice(-12); } })
    .on('style[id]', { element(e) { const id = e.getAttribute('id'); if (styleIds.has(id)) e.remove(); else styleIds.add(id); } })   // n19f: a style block repeated with the same id (36 static pages, sections that each carry their CSS) is kept once
    .on('link[rel="stylesheet"]', { element(e) { const hf = e.getAttribute('href') || ''; if (/^\/k\/site\.css/.test(hf)) e.setAttribute('href', '/k/site.css?v=' + KB_SITE_CSS_V);   // n21e: one version for the 235 pages that hard-code an older ?v=
      if (!ds && /^\/k\/(site|app)\.css/.test(hf)) { e.after(/^\/k\/site\.css/.test(hf) ? DSLS : DSL, { html: true }); ds = true; } } })
    .on('head', { element(e) { e.prepend('<script nonce="' + nonce + '">' + KB_LATE + '</script>', { html: true }); e.onEndTag(t => { if (!ds) { t.before(DSL, { html: true }); ds = true; } if (!ga) { t.before('<script nonce="' + nonce + '">' + KB_GA_JS + '</script>', { html: true }); ga = true; } }); } }).transform(out);
}
// n21e (11 Nov 2026): Russian number agreement. Templates in about 20 modules say "{k} проектов"; after 2, 3, 4 (22, 33...) Russian
// wants the genitive singular ("2 проекта") and after 1 (21, 31...) the nominative singular ("1 проект"). Left alone: 5 to 20, numbers
// after a word that asks for the genitive itself ("из 3 проектов", "меньше 3 объявлений", "последних 3 проверок") and decimals.
const KB_RU_N = { 'проектов': ['проекта', 'проект'], 'застройщиков': ['застройщика', 'застройщик'], 'месяцев': ['месяца', 'месяц'], 'кварталов': ['квартала', 'квартал'], 'контуров': ['контура', 'контур'],
  'вопросов': ['вопроса', 'вопрос'], 'изменений': ['изменения', 'изменение'], 'объявлений': ['объявления', 'объявление'], 'зданий': ['здания', 'здание'], 'обещаний': ['обещания', 'обещание'],
  'сайтов': ['сайта', 'сайт'], 'оповещений': ['оповещения', 'оповещение'], 'снимков': ['снимка', 'снимок'], 'дней': ['дня', 'день'], 'лет': ['года', 'год'], 'этажей': ['этажа', 'этаж'],
  'документов': ['документа', 'документ'], 'источников': ['источника', 'источник'], 'рынков': ['рынка', 'рынок'], 'языков': ['языка', 'язык'], 'сдач': ['сдачи', 'сдача'], 'продаж': ['продажи', 'продажа'],
  'проверок': ['проверки', 'проверка'], 'сделок': ['сделки', 'сделка'], 'ночей': ['ночи', 'ночь'], 'комнат': ['комнаты', 'комната'], 'копий': ['копии', 'копия'], 'карточек': ['карточки', 'карточка'],
  'страниц': ['страницы', 'страница'], 'стран': ['страны', 'страна'], 'записей': ['записи', 'запись'], 'раз': ['раза', 'раз'], 'ссылок': ['ссылки', 'ссылка'], 'файлов': ['файла', 'файл'],
  'часов': ['часа', 'час'], 'минут': ['минуты', 'минута'], 'недель': ['недели', 'неделя'], 'квартир': ['квартиры', 'квартира'], 'платежей': ['платежа', 'платёж'], 'отзывов': ['отзыва', 'отзыв'],
  'ответов': ['ответа', 'ответ'], 'жалоб': ['жалобы', 'жалоба'], 'городов': ['города', 'город'], 'уведомлений': ['уведомления', 'уведомление'], 'пунктов': ['пункта', 'пункт'], 'фотографий': ['фотографии', 'фотография'] };
const KB_RU_RE = new RegExp('(\\d+)((?:</(?:b|strong|span)>)?[ \u00a0])((?:[а-яё]+(?:ых|их) )?)(' + Object.keys(KB_RU_N).join('|') + ')(?![а-яёА-ЯЁ])', 'g');
const KB_RU_STOP = /(?:^|[^а-яё])(?:из|от|до|меньше|больше|более|менее|около|для|без|у|цена|цены|цене|среди|после|основе|свыше|порядка|нет|всех|минимум|максимум|[а-яё]+(?:ых|их))$/;
function kbRu(html) {
  return html.replace(KB_RU_RE, (m, num, gap, adj, noun, off, all) => {
    const n = +num.slice(-2), d = n % 10, teen = n > 10 && n < 20;
    if (teen || d === 0 || d > 4) return m;
    const before = all.slice(Math.max(0, off - 48), off);
    if (/[\d.,\u00a0$\\{}%]$/.test(before) || (/\d[ ]$/.test(before) && num.length === 3)) return m;           // part of a decimal or a grouped number, or a "$1" in a script
    const prev = before.replace(/<[^>]*>?/g, '').replace(/[\s:(«"]+$/, '').toLowerCase();
    if (KB_RU_STOP.test(prev)) return m;
    if (d === 1) return adj ? m : num + gap + KB_RU_N[noun][1];
    return num + gap + adj + KB_RU_N[noun][0];
  });
}
const KB_SITE_CSS_V = '1c6b335e3f', KB_PROV_V = '369ff51a4c';   // n21e: bump when /k/site.css or /k/prov.js change (sha1 of the file, 10 chars); pages keep their old ?v= in the HTML
let KB_CSP_SCRIPTS = true;   // n21e: strict script policy enforced site-wide; false = report-only again (as before 11 Nov 2026)
const KB_GA = 'G-FJKJE77K4V';
const KB_GA_JS = '(window.kbLate||function(f){addEventListener("load",function(){setTimeout(f,1500)})})(function(){var s=document.createElement("script");s.async=1;s.src="https://www.googletagmanager.com/gtag/js?id=' + KB_GA + '";document.head.appendChild(s)});' +
  "window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){dataLayer.push(arguments);};gtag('js',new Date());gtag('config','" + KB_GA + "');";
const KB_DS_V = '2a099a898b';   // bump with ds.css (scratchpad d12a/dsv.sh does it)
const KB_DSS_V = '2a099a898b';   // the ds.css version /k/ds-site.css was generated from; when it differs from KB_DS_V every page gets plain ds.css
// kolaboro.com mobile speed (b9c, 6 Nov 2026): third-party tags wait for the first interaction (tap, key, scroll, mouse move)
// or 8 s after load, whichever comes first. window.kbLate(fn) queues work for that moment (the static pages load gtag through it);
// Cloudflare Zaraz (Clarity) is held the same way by deferring its zaraz.init call. Events queued before that are kept.
const KB_LATE = "(function(w,d){var q=[],done=0,ev=['pointerdown','keydown','touchstart','scroll','wheel','mousemove'],o={passive:true,capture:true};" +
  "function go(){if(done)return;done=1;ev.forEach(function(e){w.removeEventListener(e,go,o)});var f;while((f=q.shift()))try{f()}catch(x){}}" +
  "ev.forEach(function(e){w.addEventListener(e,go,o)});function arm(){setTimeout(go,8000)}d.readyState==='complete'?arm():w.addEventListener('load',arm);" +
  "w.kbLate=function(f){done?setTimeout(f,0):q.push(f)};" +
  // n20s: the last inline handlers became data attributes, so the enforced policy can forbid inline handlers (script-src-attr 'none')
  "d.addEventListener('click',function(e){var t=e.target&&e.target.closest&&e.target.closest('[data-kb-reload]');if(t)location.reload()});" +
  "d.addEventListener('submit',function(e){var f=e.target;if(f&&f.hasAttribute&&f.hasAttribute('data-kb-nosubmit'))e.preventDefault()},true);" +
  "var z,held;try{Object.defineProperty(w,'zaraz',{configurable:true,enumerable:true,get:function(){return z},set:function(v){z=v;if(done||held||!v||typeof v!=='object')return;held=v;var real;" +
  "try{Object.defineProperty(v,'init',{configurable:true,enumerable:true,get:function(){return done?real:function(){var a=arguments;w.kbLate(function(){real&&real.apply(v,a)})}},set:function(fn){real=fn}})}catch(x){}}})}catch(x){}" +
  "})(window,document);";
// kolaboro.com (seoT, batch 8): every public static page gets a BreadcrumbList (and a WebPage node when it has no JSON-LD at all).
// Parent crumbs are only linked when that folder has a page; the check is cached per isolate.
const KB_PARENT = new Map(), KB_LN = { es: 'Español', de: 'Deutsch', fr: 'Français', ru: 'Русский', nl: 'Nederlands', ar: 'العربية', zh: '中文' };
async function kbParent(env, p) { if (KB_PARENT.has(p)) return KB_PARENT.get(p); let ok = false; try { const r = await env.ASSETS.fetch(new Request('https://kolaboro.com/_s/kolaboro.com' + p + 'index.html')); ok = r.status === 200; } catch (e) {} KB_PARENT.set(p, ok); return ok; }
async function kbLd(r, u, env) {
  if (r.status !== 200 || !/text\/html/.test(r.headers.get('content-type') || '') || u.pathname === '/' || /^\/(admin|portal|login|agents\/me|shared|saved|watchlist|reset|confirm-email|thanks)(\/|$)/.test(u.pathname)) return r;
  const segs = u.pathname.split('/').filter(Boolean), canon = 'https://kolaboro.com/' + segs.join('/') + (segs.length ? '/' : ''), crumbs = [['Kolaboro', 'https://kolaboro.com/']];
  for (let i = 1; i < segs.length; i++) { const p = '/' + segs.slice(0, i).join('/') + '/'; if (await kbParent(env, p)) crumbs.push([KB_LN[segs[i - 1]] || segs[i - 1].replace(/-/g, ' ').replace(/^./, c => c.toUpperCase()), 'https://kolaboro.com' + p]); }
  let title = '', ld = '', nonce = kbNonce(r);
  return new HTMLRewriter()
    .on('head title', { text(t) { title += t.text; } })
    .on('head script[type="application/ld+json"]', { text(t) { ld += t.text || ' '; } })
    .on('head', { element(e) { e.onEndTag(end => {
      if (/BreadcrumbList/.test(ld)) return;
      const name = title.replace(/\s*\|\s*Kolaboro.*$/, '').replace(/&amp;/g, '&').trim() || segs[segs.length - 1];
      const g = [{ '@type': 'BreadcrumbList', itemListElement: crumbs.concat([[name, canon]]).map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x[0], item: x[1] })) }];
      if (!ld.trim()) g.unshift({ '@type': 'WebPage', '@id': canon + '#page', url: canon, name, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: 'https://kolaboro.com/' } });
      end.before('<script' + nonce + ' type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@graph': g }).replace(/</g, '\\u003c') + '</script>', { html: true });
    }); } })
    .transform(r);
}
// scripts added after kbHeaders (HTMLRewriter append) carry the same nonce as the response's CSP header
const kbNonce = r => { const m = ((r.headers.get('content-security-policy-report-only') || '') + ' ' + (r.headers.get('content-security-policy') || '')).match(/'nonce-([A-Za-z0-9+/=]+)'/); return m ? ' nonce="' + m[1] + '"' : ''; };
const KB_CSP = "default-src 'self'; script-src 'nonce-{N}' 'strict-dynamic' 'wasm-unsafe-eval' 'unsafe-inline' https:; script-src-attr 'none'; " +
  "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://unpkg.com; " +
  "img-src 'self' data: blob: https://oykcsmextclpdnugixqz.supabase.co https://server.arcgisonline.com https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://*.google-analytics.com https://*.googletagmanager.com https://*.clarity.ms https://c.bing.com; " +
  "font-src 'self'; connect-src 'self' https://tile.openstreetmap.org https://cdnjs.cloudflare.com https://api.frankfurter.dev https://api.frankfurter.app https://oykcsmextclpdnugixqz.supabase.co wss://oykcsmextclpdnugixqz.supabase.co https://huggingface.co https://*.hf.co https://raw.githubusercontent.com https://mempool.space https://nominatim.openstreetmap.org https://cdn.jsdelivr.net https://earth-search.aws.element84.com https://extensions.duckdb.org https://*.amazonaws.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.clarity.ms https://c.bing.com https://cloudflareinsights.com; " +
  "frame-src 'self' https://www.paypal.com https://www.sandbox.paypal.com; worker-src 'self' blob:; manifest-src 'self'; media-src 'self' blob:; object-src 'none'; base-uri 'self'; " +
  "form-action 'self' https://www.paypal.com https://oykcsmextclpdnugixqz.supabase.co; frame-ancestors {FA}; report-uri /api/kb/csp; report-to csp";
// equinoxinvestmentgroup.com: browser security headers (no framing, no plugins, admin never indexed or cached) and long cache for fonts
function eqHeaders(r, u, req) {
  const h = new Headers(r.headers);
  const ct = h.get('content-type') || '';
  if (/^\/fonts\/.+\.woff2$/.test(u.pathname) && r.status === 200) h.set('cache-control', 'public, max-age=31536000, immutable');
  else if (/^\/(fonts\/fonts\.css|og\.png|favicon\.(svg|ico)|apple-touch-icon\.png)$/.test(u.pathname) && r.status === 200) h.set('cache-control', 'public, max-age=86400');
  if (/text\/html/.test(ct)) {
    const adm = /^\/admin(\/|$)/.test(u.pathname);
    h.set('x-frame-options', 'DENY');
    // analytics (Zaraz: GA4 + Clarity) may load only after the visitor accepts cookies (eq_consent=all set by the site's banner)
    const ok = /(?:^|;\s*)eq_consent=all(?:;|$)/.test(req.headers.get('cookie') || '');
    const o = 'https://' + u.host;
    const scripts = ok ? '' : "script-src 'unsafe-inline' " + o + '/assets/ ' + o + '/cdn-cgi/scripts/ ' + o + '/cdn-cgi/challenge-platform/ https://static.cloudflareinsights.com; ';
    h.set('content-security-policy', scripts + "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self' mailto:; upgrade-insecure-requests");
    h.append('vary', 'Cookie');
    h.set('permissions-policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()');
    h.set('cross-origin-opener-policy', 'same-origin');
    h.set('strict-transport-security', 'max-age=31536000');
    if (adm) { h.set('cache-control', 'no-store'); h.set('x-robots-tag', 'noindex, nofollow'); }
  }
  if (u.pathname === '/llms.txt' || u.pathname === '/.well-known/security.txt') h.set('content-type', 'text/plain; charset=utf-8');
  return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
}
// rh-media-v1 (3-nov-2026): realhunt.co pages and data are served from the Pages project realhunt-media
// (built from this branch with root _s/realhunt.co), so web-lovable no longer has to deploy them (Pages
// 20,000-file limit). /assets/* still comes from web-lovable. Same rules as the web-lovable path below:
// ?p= lookups, no trailing slash, folder pages served directly, unknown pages load the app with noindex.
const RHM = 'https://realhunt-media.pages.dev';
function rhGet(req, path) {
  const h = new Headers(req.headers); h.delete('cookie');
  return fetch(new Request(RHM + path, { method: req.method === 'HEAD' ? 'HEAD' : 'GET', headers: h, redirect: 'manual' }));
}
async function rhMedia(req, u) {
  if (u.search) { for (const k of ['p', 'page_id', 'paged', 'cat', 'tag']) { const v = u.searchParams.get(k); if (v && /^[\w-]+$/.test(v)) { const q = await rhGet(req, '/__q/' + k + '=' + v + '/'); if (q.status === 200) return q; } } }
  if (u.pathname.length > 1 && u.pathname.endsWith('/')) return new Response(null, { status: 301, headers: { location: '/' + u.pathname.replace(/\/+$/, '').replace(/^[\/\\]+/, '') + u.search } });
  let r = await rhGet(req, u.pathname + u.search);
  if (r.status >= 300 && r.status < 400) {
    const l = new URL(r.headers.get('location') || '', RHM + u.pathname);
    if (l.pathname === u.pathname + '/') { const d = await rhGet(req, u.pathname + '/' + u.search); if (d.status === 200) r = d; }
  }
  if (r.status >= 300 && r.status < 400) { const l = new URL(r.headers.get('location') || '/', RHM + u.pathname); const h = new Headers(r.headers); h.set('location', (l.origin === RHM ? '' : l.origin) + l.pathname + l.search); return new Response(null, { status: r.status, headers: h }); }
  if (r.status === 404 && !/\.[a-z0-9]{2,5}$/i.test(u.pathname)) {
    const s = await rhGet(req, '/');
    const h = new Headers(s.headers); h.set('x-robots-tag', 'noindex');
    return new HTMLRewriter()
      .on('link[rel="canonical"]', { element(e) { e.remove(); } })
      .on('meta[name="robots"]', { element(e) { e.setAttribute('content', 'noindex, follow'); } })
      .on('meta[property="og:url"]', { element(e) { e.setAttribute('content', 'https://realhunt.co' + u.pathname); } })
      .transform(new Response(s.body, { status: 200, headers: h }));
  }
  if (r.status === 404) return new Response(null, { status: 404 });
  return r;
}
// n26i (batch 26): home page and hubs carry links to the project pages the fewest other project pages link to (kbx_named.js)
async function llInject(req, u, env, ctx, r) {
  if (req.method !== 'GET' || !r || r.status !== 200 || u.search || !LLP.test(u.pathname) || !/text\/html/.test(r.headers.get('content-type') || '')) return r;
  try { if (!knm) knm = await import('./kbx_named.js'); const lb = knm.leastReady(env, ctx, LLP.exec(u.pathname)[1] || 'en'); if (lb) return new HTMLRewriter().on('main', { element(e) { e.append(lb, { html: true }); } }).transform(r); } catch (e) {}
  return r;
}
let kTick = null, kbots = null;
export default {
  async fetch(req, env, ctx) {
    if (env && env.KB_CSP_STRICT === '0') KB_CSP_SCRIPTS = false;   // n21e: rollback switch for the strict script policy on kolaboro.com
    if (req.method === 'GET' && /^(www\.)?kolaboro\.com$/.test(new URL(req.url).hostname) && /bot|crawl|spider|GPT|Claude|anthropic|Perplexity|Bytespider|meta-extern|cohere|Mistral|Diffbot/i.test(req.headers.get('user-agent') || '')) { try { if (!kbots) kbots = await import('./kbx_bots.js'); kbots.count(req, new URL(req.url), ctx); } catch (e) {} }   // n26i: AI crawler visits per day (kbx_bots.js)
    if (req.method === 'GET' && /^(www\.)?kolaboro\.com$/.test(new URL(req.url).hostname)) { try { if (!k27a) k27a = await import('./kbx_n27a.js'); k27a.count(req, new URL(req.url), ctx); } catch (e) {} }   // n27a: page views by page type and searches started (edge counters, kbx_n27a.js)
    const r = await this.fetch0(req, env, ctx);
    if (/^(www\.)?kolaboro\.com$/.test(new URL(req.url).hostname)) { try { if (!kTick) kTick = await import('./kbx_ticker.js'); return await kTick.kbTick(req, r, env); } catch (e) { return r; } }
    return r;
  },
  async fetch0(req, env, ctx) {
    const u = new URL(req.url);
    let host = u.hostname.replace(/^www\./, '');
    if (host.endsWith('.pages.dev')) {
      const q = u.searchParams.get('__site');
      if (q) return /^[a-z0-9.-]{3,80}$/.test(q) ? new Response(null, { status: 302, headers: { location: '/', 'set-cookie': '__site=' + q + '; Path=/; SameSite=Lax; Secure; HttpOnly' } }) : new Response('Not found', { status: 404 });   // n20s: host names only (no cookie attribute injection)
      const m = (req.headers.get('cookie') || '').match(/(?:^|;\s*)__site=([a-z0-9.-]{3,80})(?:;|$)/);
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
    // kolaboro.com (seoT, batch 8): HEAD answers exactly like GET (status and headers, no body) for every page, incl. worker-rendered ones
    if (host === 'kolaboro.com' && env && env.KB_WKEY) { if (!kb) kb = await import('./kolaboro.js'); kb.useEnv(env); }   // sec13: worker key from the Cloudflare secret when Carlos sets it
    if (host === 'kolaboro.com' && req.method === 'HEAD' && !/^\/(api|mcp)(\/|$)/.test(u.pathname)) { const g = await this.fetch(new Request(req.url, { method: 'GET', headers: req.headers }), env, ctx); return new Response(null, { status: g.status, statusText: g.statusText, headers: g.headers }); }
    if (host === 'kolaboro.com' && req.method === 'GET' && /^\/m\/[^/.]{2,60}$/.test(u.pathname)) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search } });
    // n19e (batch 19): tools merged into one page (the payment account check was a subset of the account check)
    if (host === 'kolaboro.com' && req.method === 'GET' && /^\/tools\/iban-check\/?(?:index\.html)?$/.test(u.pathname)) return new Response(null, { status: 301, headers: { location: '/tools/account-check/' + u.search, 'cache-control': 'public, max-age=3600' } });
    // kolaboro.com: sitemap index, llms.txt, country hubs and guides, rankings, comparisons, embeds, SEO dashboard (see kbx_seo.js)
    // kolaboro.com (b9a, batch 9): public named-facts API /api/v1/projects/<slug>, search index, Atom/JSON feeds, email watch (see kbx_follow.js)
    // kolaboro.com (b10b, batch 10): DID document for did:web:kolaboro.com, the issuer of Kolaboro's W3C verifiable credentials (see kbx_acct.js)
    if (host === 'kolaboro.com' && u.pathname === '/.well-known/did.json' && (req.method === 'GET' || req.method === 'HEAD')) { const ka = await import('./kbx_acct.js'); return ka.did(env); }
    // kolaboro.com (n27a, batch 27): answer files per place and developer, per-project CSV, /corrections.json, developer dashboards, /yc/, usage counters (see kbx_n27a.js)
    if (host === 'kolaboro.com' && K27A.test(u.pathname)) {
      if (!k27a) k27a = await import('./kbx_n27a.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const inner = p => this.fetch(new Request(new URL(p, u), { headers: { accept: 'application/json' } }), env, ctx);
      try { const r = await k27a.handle(req, u, env, ctx, shell, inner); if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r; } catch (e) {}
    }
    // kolaboro.com (b11 x11a, batch 11): Project X-ray stream /api/kb/xray, API /api/v1/xray, sealed X-rays /x/<root>/ (see kbx_xray.js)
    if (host === 'kolaboro.com' && KXR.test(u.pathname)) { if (!kxr) kxr = await import('./kbx_xray.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kxr.handle(req, u, env, ctx, shell); if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r; }
    if (host === 'kolaboro.com' && KCAL.test(u.pathname)) { if (!kcal) kcal = await import('./kbx_cal.js'); const r = await kcal.handle(req, u, env, ctx); if (r) return r; }
    if (host === 'kolaboro.com' && KFW.test(u.pathname)) { if (!kfw) kfw = await import('./kbx_follow.js'); const r = await kfw.handle(req, u, env, ctx); if (r) return r; }
    // kolaboro.com (x11c, batch 11): Project X-ray conversion block API, "X-ray this project" partner button, admin X-rays tab (see kbx_xc.js)
    if (host === 'kolaboro.com' && KXC.test(u.pathname)) { if (!kxc) kxc = await import('./kbx_xc.js'); return kxc.handle(req, u, env, ctx); }
    // kolaboro.com (x11b, batch 11): Project X-ray evidence cards 11-18 (/api/xev) and the Sentinel-2 crop (/api/xev/sat.png), see kbx_xray_ev.js
    if (host === 'kolaboro.com' && KXEV.test(u.pathname)) { if (!kxev) kxev = await import('./kbx_xray_ev.js'); return kxev.handle(req, u, env, ctx); }
    // kolaboro.com (b10c, batch 10): bulk register check page + API (kbx_bulk.js), 1200x630 share images per named project/developer (kbx_og.js)
    if (host === 'kolaboro.com' && KB10.test(u.pathname)) {
      if (u.pathname.startsWith('/og/')) { if (!kog) kog = await import('./kbx_og.js'); const r = await kog.handle(req, u, env, ctx); if (r) return r; }
      else { if (!kbk) kbk = await import('./kbx_bulk.js'); if (!klk) klk = await import('./kbx_lookup.js');
        const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
        const r = await kbk.handle(req, u, env, ctx, shell, klk.handle); if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r; }
    }
    // kolaboro.com (f14c, batch 14): developer network graph /graph/developers/, live X-ray globe /live/xrays/, /api/x/net/* (see kbx_net.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KNET.test(u.pathname)) {
      if (!knet) knet = await import('./kbx_net.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await knet.handle(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n18d, batch 18): contract addendum builder, clauses with the law they rely on, PDF/.docx in the browser (see kbx_paper.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KCA.test(u.pathname)) {
      if (!kca) kca = await import('./kbx_paper.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kca.handleTool(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n17d, batch 17): permit photo reader, OCR in the browser, one-tap register lookup (see kbx_pp.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KPP.test(u.pathname)) {
      if (!kpp) kpp = await import('./kbx_pp.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kpp.handle(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n18e, batch 18): /cohort/ buyer groups page in 8 languages (feature behind KB_COHORT + migration; see kbx_cohort.js)
    if (host === 'kolaboro.com' && req.method === 'GET' && /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?cohort\/?$/.test(u.pathname)) {
      const kco = await import('./kbx_cohort.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kco.page(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n18e, batch 18): /data/dev-response.json is computed live from public aggregate functions (the static file is the fallback)
    if (host === 'kolaboro.com' && req.method === 'GET' && u.pathname === '/data/dev-response.json') { if (!kfc) kfc = await import('./kbx_fc.js'); return kfc.devResponseJson(env); }
    // kolaboro.com (n19d, batch 19): /satellite/plot/ in 8 languages: Sentinel-2 per quarter since 2017 made on demand, time-lapse GIF (see kbx_plot.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KPLOT.test(u.pathname)) {
      if (!kplot) kplot = await import('./kbx_plot.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kplot.handle(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n21d, batch 21): /tools/bulk-check/ in 8 languages: a list of names or links matched in the browser against the public index (see kbx_bulkix.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KBIX.test(u.pathname)) {
      if (!kbix) kbix = await import('./kbx_bulkix.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kbix.page(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n19a, batch 19): /watch/lookalikes/ in 8 languages, admin Screening tab script (see kbx_watch.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KWAT.test(u.pathname)) {
      if (!kwat) kwat = await import('./kbx_watch.js');
      if (u.pathname === '/__k/kwatch-admin.js') return new Response(kwat.ADMIN_JS, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'no-store' } });
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kwat.page(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n27e, batch 27): /projects/<slug>/report/ and report.pdf, /weekly/[<place>/] (+ feeds, sitemap), /api/x/e27/* (see kbx_e27.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KE27.test(u.pathname)) {
      if (!ke27) ke27 = await import('./kbx_e27.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await ke27.handle(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n26u, batch 26): /compare/?p=<slugs> (named, 8 languages, noindex), /api/v1/facets, /api/v1/followers, /api/x/status/pages (see kbx_u26.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KU26.test(u.pathname)) {
      if (!ku26) ku26 = await import('./kbx_u26.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await ku26.handle(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // n26u: the database server's 5-minute uptime probe of /api/kb/health also refreshes the key-page sweep shown on /status/
    if (host === 'kolaboro.com' && u.pathname === '/api/kb/health' && req.method === 'GET') { try { if (!ku26) ku26 = await import('./kbx_u26.js'); ku26.warm(env, ctx); } catch (e) {} }
    // kolaboro.com (n26y, batch 26): /progress/, /progress/improvements/, /press/places/[<place>/], /moderation/, /team/ in 8 languages, their sitemap and /api/x/progress (see kbx_trust.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KTRU.test(u.pathname)) {
      if (!ktru) ktru = await import('./kbx_trust.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const inner = p => this.fetch(new Request(new URL(p, u), { headers: { accept: 'application/xml' } }), env, ctx);
      const r = await ktru.page(req, u, env, ctx, shell, inner);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n23, batch 23): /rankings/transparency/[<place>/] and /methods/transparency-score/ in 8 languages (see kbx_tr.js); before the /rankings/ hubs of kbx_seo.js
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KTR.test(u.pathname)) {
      if (!ktr) ktr = await import('./kbx_tr.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await llInject(req, u, env, ctx, await ktr.page(req, u, env, ctx, shell));
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n26s, batch 26): /handover/[<year>/<place>/], /areas/[<place>/<area>/], /vs/<slug>-vs-<slug>/ in 8 languages (see kbx_facets.js);
    // a /vs/ path that is not one of these pairs falls through to the older id pairs of kbx_seo.js
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KFA.test(u.pathname)) {
      if (!kfa) kfa = await import('./kbx_facets.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kfa.page(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n21c, batch 21): /guides/short-let-rules/ in 8 languages (see kbx_rules.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KRUL.test(u.pathname)) {
      if (!krul) krul = await import('./kbx_rules.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await krul.page(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n18b, batch 18): /methods/construction-stage/ in 8 languages (see kbx_stage.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KSTG.test(u.pathname)) {
      if (!kstg) kstg = await import('./kbx_stage.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kstg.method(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n17c, batch 17): /open live figures and /methods/delivery-forecast/ in 8 languages (see kbx_fc.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KFC.test(u.pathname)) {
      if (!kfc) kfc = await import('./kbx_fc.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kfc.handle(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (seoP, batch 8): named project and developer pages in 8 languages, /p/<id>/ 301 to them, /api/seo/urls (see kbx_named.js)
    if (host === 'kolaboro.com' && req.method === 'GET' && KNM.test(u.pathname)) {
      if (!knm) knm = await import('./kbx_named.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await knm.handle(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    if (host === 'kolaboro.com' && req.method === 'GET' && (/^\/p\/[A-Za-z0-9-]{3,20}\/?$/.test(u.pathname) || (/^\/p\/?$/.test(u.pathname) && u.searchParams.has('id')))) { if (!knm) knm = await import('./kbx_named.js'); const rd = await knm.redirectP(u, env); if (rd) return rd; }
    // kolaboro.com (s15c, batch 15): embeddable fact cards and delivery trackers, verified-reply badge, monthly market data stories
    // with CSV, public change log + Atom, answer files and llms-projects.txt (see kbx_cite.js)
    if (host === 'kolaboro.com' && req.method === 'GET' && KCITE.test(u.pathname)) {
      if (!kcite) kcite = await import('./kbx_cite.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kcite.handle(req, u, env, ctx, shell);
      if (r) {
        if (/^\/embed\//.test(u.pathname)) { const h = new Headers(r.headers); h.delete('x-frame-options'); h.set('content-security-policy', "frame-ancestors *; default-src 'none'; style-src 'unsafe-inline'; img-src https://kolaboro.com; frame-src https://kolaboro.com; base-uri 'none'; form-action 'none'"); h.set('referrer-policy', 'no-referrer'); return new Response(r.body, { status: r.status, headers: h }); }
        return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
      }
    }
    // kolaboro.com (n26i, batch 26): AI crawler visits per day, counted at the edge (see kbx_bots.js)
    if (host === 'kolaboro.com' && req.method === 'GET' && /^\/api\/open\/ai-crawlers\/?$/.test(u.pathname)) { if (!kbots) kbots = await import('./kbx_bots.js'); return kbots.api(req); }
    // kolaboro.com (n26i, batch 26): /numbers/ in 8 languages, citable figures with source and date (see kbx_numbers.js)
    if (host === 'kolaboro.com' && req.method === 'GET' && KNUM.test(u.pathname)) {
      if (!knum) knum = await import('./kbx_numbers.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const inner = p => this.fetch(new Request(new URL(p, u), { headers: { accept: 'application/json' } }), env, ctx);
      try { const r = await knum.handle(req, u, env, ctx, shell, inner); if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r; } catch (e) {}
    }
    if (host === 'kolaboro.com' && req.method === 'GET' && KSEO.test(u.pathname)) {
      if (!kseo) kseo = await import('./kbx_seo.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { headers: req.headers }), env, ctx, su, host); };
      const inner = p => this.fetch(new Request(new URL(p, u), { headers: { accept: 'application/json' } }), env, ctx);
      const r = await llInject(req, u, env, ctx, await kseo.handle(req, u, env, ctx, shell, inner));
      return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    if (host === 'equinoxinvestmentgroup.com') return eqHeaders(await this.site(req, env, ctx, u, host), u, req);
    if (host === 'kolaboro.com' && req.method === 'GET' && (/^\/p\/[A-Za-z0-9-]{3,20}\/?$/.test(u.pathname) || /^\/m\/[^/.]{2,60}\/?$/.test(u.pathname) || u.pathname === '/sitemap-data.xml')) {
      if (!kb) kb = await import('./kolaboro.js');
      if (u.pathname === '/sitemap-data.xml') return kb.dataSitemap();
      const isP = u.pathname.startsWith('/p/'), shell = new URL(isP ? '/p/' : '/m/', u);
      const base = kbHeaders(await this.site(new Request(shell, req), env, ctx, shell, host), shell);
      const sr = await kb.ssr(base, u, isP ? 'p' : 'm', env);
      if (isP || sr.status !== 200) return sr;
      // n17c (batch 17): delivery forecast section on market pages (see kbx_fc.js fcMarketHtml), appended to <main>
      try { if (!kfc) kfc = await import('./kbx_fc.js'); const fh = await kfc.fcMarketHtml(env, decodeURIComponent(u.pathname.split('/')[2] || '')); if (fh) return new HTMLRewriter().on('main', { element(e) { e.append(fh, { html: true }); } }).transform(sr); } catch (e) {}
      return sr;
    }
    if (host === 'kolaboro.com') { let kr = kbHeaders(await this.site(req, env, ctx, u, host), u);
      // n25e: a missing page answers a 301 to its one clear replacement, a 410 for junk, or a useful translated 404 (see kbx_404.js)
      if (kr.status === 404 && (req.method === 'GET' || req.method === 'HEAD') && !/^\/api\//.test(u.pathname)) { if (!k404) k404 = await import('./kbx_404.js'); const fx = await k404.fix(u, env); if (fx instanceof Response) return fx; if (/text\/html/.test(kr.headers.get('content-type') || '')) return await k404.page(kr, u, fx === 'gone' ? 410 : 404, env); }
      if (req.method === 'GET' && kr.status === 200 && u.pathname === '/metrics/' && /text\/html/.test(kr.headers.get('content-type') || '')) { try { if (!k27a) k27a = await import('./kbx_n27a.js'); const mh = await k27a.metricsHtml(); if (mh) kr = new HTMLRewriter().on('main', { element(e) { e.append(mh, { html: true }); } }).transform(kr); } catch (e) {} }   // n27a: usage by page type and return visits on /metrics/
      if (req.method === 'GET' && kr.status === 200 && u.pathname === '/engineering/' && /text\/html/.test(kr.headers.get('content-type') || '')) { try { if (!kbots) kbots = await import('./kbx_bots.js'); const bh = await kbots.html(req); kr = new HTMLRewriter().on('main', { element(e) { e.append(bh, { html: true }); } }).transform(kr); } catch (e) {} }   // n26i: AI crawler visits on /engineering/
      // n26i (batch 26): the home page and the hubs link the project pages the fewest other project pages link to (kbx_named.js)
      kr = await llInject(req, u, env, ctx, kr);
      const kn = kbNonce(kr); if (req.method === 'GET' && /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?check\/?$/.test(u.pathname) && kr.status === 200 && /text\/html/.test(kr.headers.get('content-type') || '')) kr = new HTMLRewriter().on('body', { element(e) { e.append('<script' + kn + ' src="/k/xray.js?v=' + KXR_V + '" defer></script><script' + kn + ' src="/k/xray-cta.js?v=n22e1" defer></script>', { html: true }); } }).transform(kr); if (req.method === 'GET' && /^\/admin\/?$/.test(u.pathname) && /text\/html/.test(kr.headers.get('content-type') || '')) return new HTMLRewriter().on('body', { element(e) { e.append('<script' + kn + ' src="/__k/ktraffic.js?v=1" defer></script><script' + kn + ' src="/__k/kxc-admin.js?v=1" defer></script><script' + kn + ' src="/__k/kwatch-admin.js?v=1" defer></script>', { html: true }); } }).transform(kr); if (req.method === 'GET' && /^\/check\/?$/.test(u.pathname) && u.searchParams.get('utm_source') === 'realhunt' && /text\/html/.test(kr.headers.get('content-type') || '')) return new HTMLRewriter().on('body', { element(e) { e.append('<script' + kn + ' src="/__k/kbrh.js?v=1" defer></script>', { html: true }); } }).transform(kr); return kbLd(kr, u, env); }
    return this.site(req, env, ctx, u, host);
  },
  async site(req, env, ctx, u, host) {
    // kolaboro.com: desk-review API (see kolaboro.js).
    if (host === 'kolaboro.com' && (u.pathname === '/api/open' || u.pathname.startsWith('/api/open/') || u.pathname === '/feed.json' || u.pathname === '/feed.xml' || u.pathname === '/feed/alerts.xml')) { if (!kb) kb = await import('./kolaboro.js'); return kb.open(req, u, env); }
    if (host === 'kolaboro.com' && (u.pathname.startsWith('/api/x/') || u.pathname === '/mcp' || u.pathname.startsWith('/mcp/'))) { if (!kbx) kbx = await import('./kbx.js'); return kbx.route(req, u, env, ctx); }
    if (host === 'kolaboro.com' && /^\/backup-admin(\/|$)/.test(u.pathname)) { if (!kb) kb = await import('./kolaboro.js'); return kb.honeyPath(req, u, ctx); }
    // kolaboro.com: live official-register lookup (batch 7, see kbx_lookup.js)
    if (host === 'kolaboro.com' && /^\/api\/(kb|v1)\/lookup(\/|$)/.test(u.pathname)) { if (!klk) klk = await import('./kbx_lookup.js'); return klk.handle(req, u, env, ctx); }
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
    if (host === 'jurimatch.com' && req.method === 'GET' && /^\/(sitemap\.xml|login|signin|sign-in|firm-listing|fees|guides|founding|for-lawyers\/founding)\/?$/.test(u.pathname)) { if (!jm) jm = await import('./jurimatch.js'); const sm = await jm.route(req, u, env, ctx); if (sm) return sm; }
    const r = await this.siteRaw(req, env, ctx, u, host);
    if (host === 'realhunt.co' && req.method === 'GET' && /text\/html/.test(r.headers.get('content-type') || '')) { const rr = new HTMLRewriter().on('head', { element(e) { e.prepend("<script>/*rh-img-fb*/(function(){var M='https://realhunt-media.pages.dev/';document.addEventListener('error',function(e){var t=e.target;if(!t||t.tagName!=='IMG'||t.__rhfb)return;var s=t.currentSrc||t.getAttribute('src')||'';if(s.indexOf(M)!==0)return;t.__rhfb=1;e.stopImmediatePropagation();if(t.srcset)t.removeAttribute('srcset');t.src='https://realhunt.co/'+s.slice(M.length);},true);})();</script>", { html: true }); } }).on('body', { element(e) { e.append('<script src="/__k/kcheck.js?v=6" defer></script>', { html: true }); } }).transform(r); /* rh-sec-1 (9 Nov 2026): realhunt.co pages cannot be framed by other sites (clickjacking), no plugins, no <base> hijack */ const hh = new Headers(rr.headers); hh.set('x-frame-options', 'SAMEORIGIN'); hh.set('content-security-policy', "frame-ancestors 'self'; base-uri 'self'; object-src 'none'"); hh.set('permissions-policy', 'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), interest-cohort=()'); return new Response(rr.body, { status: rr.status, statusText: rr.statusText, headers: hh }); }
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
    if (u.pathname.endsWith('/index.html')) { const ip = '/' + u.pathname.slice(0, -10).replace(/^[\/\\]+/, ''); return new Response(null, { status: 301, headers: { location: ip + u.search } }); }
    if (u.pathname.startsWith('/_s/')) return new Response('Not found', { status: 404 });
    if (u.pathname === '/api/geo') { const c = req.cf || {}; return Response.json({ country: c.country || null, city: c.city || null, lat: c.latitude ? +c.latitude : null, lon: c.longitude ? +c.longitude : null }); }
    if (host === 'kolaboro.com' && u.pathname === '/__k/ktraffic.js') return new Response(KTRAF, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'no-store' } });
    if (host === 'kolaboro.com' && u.pathname === '/__k/kbrh.js') return new Response(KBRH, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=600' } });
    if (host === 'realhunt.co' && u.pathname === '/__k/kcheck.js') return new Response(KCHECK, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=600' } });
    // rh-static-v1: home data comes from the source repo (Pages project realhunt-top, refreshed by the daily data job); falls back to the published copy.
    if (host === 'realhunt.co' && req.method === 'GET' && u.pathname === '/data/rh-static.json') { try { const t = await fetch('https://realhunt-top.pages.dev/data/rh-static.json', { cf: { cacheEverything: true, cacheTtl: 60 } }); if (t.status === 200 && /json/i.test(t.headers.get('content-type') || '')) { const h = new Headers(t.headers); h.set('cache-control', 'public, max-age=60'); h.delete('age'); return new Response(t.body, { status: 200, headers: h }); } } catch (e) {} }
    if (req.method !== 'GET' && req.method !== 'HEAD') return new Response(null, { status: 204 });
    if (host === 'realhunt.co' && /^\/(?:(?:finds|top|og|images)\/.+|og-[\w-]+|icon-[\w-]+)\.(?:webp|jpe?g|png)$/i.test(u.pathname)) { const m = await fetch('https://realhunt-media.pages.dev' + u.pathname, { cf: { cacheEverything: true, cacheTtl: 86400 } }); const img = (r) => r.status === 200 && /^image\//i.test(r.headers.get('content-type') || ''); const ok = (r) => { const h = new Headers(r.headers); h.set('cache-control', 'public, max-age=86400'); return new Response(r.body, { status: 200, headers: h }); }; if (img(m)) return ok(m); /* v2-src-media: images missing from realhunt-media come from the source repo's public/ folder (Pages project realhunt-top) */ const t = await fetch('https://realhunt-top.pages.dev' + u.pathname, { cf: { cacheEverything: true, cacheTtl: 86400 } }); if (img(t)) return ok(t); if (u.pathname.startsWith('/top/')) { const t2 = await fetch('https://realhunt-top.pages.dev' + u.pathname.slice(4), { cf: { cacheEverything: true, cacheTtl: 86400 } }); if (img(t2)) return ok(t2); } }
    if (host === 'realhunt.co') return rhMedia(req, u); // rh-media-v1 (rollback: delete this line)
    if (u.search) { for (const k of ['p', 'page_id', 'paged', 'cat', 'tag']) { const v = u.searchParams.get(k); if (v && /^[\w-]+$/.test(v)) { const q = await env.ASSETS.fetch(new Request(new URL(pre + '/__q/' + k + '=' + v + '/', u), req)); if (q.status === 200) return q; } } }
    // realhunt.co: one URL per page, without the trailing slash, matching the canonical tags. "/about/" sends a 301 to
    // "/about", and "/about" is served from the about/index.html file directly instead of redirecting to the folder.
    if (host === 'realhunt.co' && u.pathname.length > 1 && u.pathname.endsWith('/')) {
      return new Response(null, { status: 301, headers: { location: '/' + u.pathname.replace(/\/+$/, '').replace(/^[\/\\]+/, '') + u.search } });
    }
    let r = await env.ASSETS.fetch(new Request(new URL(pre + u.pathname + u.search, u), req));
    // kb-sat-pack-v1: kolaboro.com satellite images missing as single files are served from their pack (see kbsat.js; rollback: delete this line)
    if (host === 'kolaboro.com' && u.pathname.startsWith('/k/sat/') && (r.status === 404 || u.searchParams.get('__pack') === '1')) { try { if (!ksat) ksat = await import('./kbsat.js'); const p = await ksat.serve(req, u, env, ctx); if (p) r = p; } catch (e) {} }
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
