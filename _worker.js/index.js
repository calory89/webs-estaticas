
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
// rh-kcheck-v2: realhunt.co runtime layer (Kolaboro deal box, sponsored Kolaboro feed card, Eco Beach City at 36,500) at /__k/kcheck.js; kolaboro.com "from RealHunt" banner at /__k/kbrh.js
const KCHECK = "/* realhunt.co runtime layer v3 (30-oct-2026), served by the web-lovable worker at /__k/kcheck.js.\n   1) Kolaboro box on deal pages: visitor in another country than the home and price >= EUR 80,000 (?kb=1 forces it).\n   2) Sponsored Kolaboro card in the home feed (\"check any home\").\n   Events go to realhunt.kb_events and to GA (gtag). */\n(function () {\n  if (window.__rhplus) return; window.__rhplus = 1;\n  var TH = 80000, AK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw';\n  var rows = {}, geo, geoAsked = false, key = '', seen = {};\n  function L() { return (document.documentElement.lang || 'en').slice(0, 2) === 'es' ? 'es' : 'en'; }\n  function sid() { try { return localStorage.getItem('rh_sid') || ''; } catch (e) { return ''; } }\n  function log(kind, extra) {\n    var b = { kind: kind, placement: (extra && extra.placement) || null, slug: (extra && extra.slug) || null, viewer: geo || null, lang: L(), sid: sid().slice(0, 60) };\n    try { if (window.gtag) gtag('event', 'kolaboro_' + kind, { slug: b.slug || '', viewer: b.viewer || '' }); } catch (e) {}\n    try { fetch('/__sb/realhunt/rest/v1/kb_events', { method: 'POST', keepalive: true, headers: { apikey: AK, Authorization: 'Bearer ' + AK, 'content-type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(b) }); } catch (e) {}\n  }\n  function askGeo() { if (geoAsked) return; geoAsked = true; fetch('/api/geo').then(function (r) { return r.json(); }).then(function (g) { geo = (g && g.country) || null; }).catch(function () { geo = null; }); }\n  function kurl(u, medium, slug) {\n    return 'https://kolaboro.com/check' + (u ? '?url=' + encodeURIComponent(u) + '&' : '?') + 'utm_source=realhunt&utm_medium=' + medium + '&utm_campaign=' + encodeURIComponent(slug || 'sponsored') + (slug && medium === 'deal_page' ? '&rh=' + encodeURIComponent(slug) : '');\n  }\n  function el(tag, css, txt) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; }\n\n  /* ---------- 1) deal page box ---------- */\n  var TD = {\n    en: { h: 'Buying from abroad? Check it before you pay a deposit', p: 'Free AI check of this listing in about a minute: who is selling, title and permits, red flags. If you want more, a local agent can verify it on site for \u20ac490.', b: 'Check this home with Kolaboro \u2192', s: 'Sponsored. Kolaboro is the buyer-verification service from the team behind RealHunt.' },\n    es: { h: '\u00bfCompras desde fuera? Compru\u00e9bala antes de pagar la reserva', p: 'Revisi\u00f3n gratis con IA de este anuncio en un minuto: qui\u00e9n vende, escrituras y permisos, se\u00f1ales de alarma. Si quieres m\u00e1s, un agente local la verifica en persona por 490 \u20ac.', b: 'Comprobar esta casa con Kolaboro \u2192', s: 'Patrocinado. Kolaboro es el servicio de verificaci\u00f3n de compradores del equipo de RealHunt.' }\n  };\n  function name(cc) { try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(cc); } catch (e) { return cc; } }\n  function same(a, b) { a = String(a || '').toLowerCase(); b = String(b || '').toLowerCase(); return a === b || (a.indexOf('united states') === 0 && b.indexOf('united states') === 0); }\n  function loadDeal(slug) {\n    if (rows[slug] !== undefined) return; rows[slug] = null;\n    fetch('/__sb/realhunt/rest/v1/community_deals?status=eq.approved&select=price_eur,country,source_url&slug=eq.' + encodeURIComponent(slug), { headers: { apikey: AK, Authorization: 'Bearer ' + AK } })\n      .then(function (r) { return r.json(); }).then(function (d) { rows[slug] = (d && d[0]) || false; }).catch(function () { rows[slug] = false; });\n  }\n  function anchor() {\n    var c = ['.hv-aside-cta', '.hunt-detail-actions', '.hv-amenities', '.hv-detail-where'];\n    for (var i = 0; i < c.length; i++) { var e = document.querySelector(c[i]); if (e && e.offsetParent !== null) return e; }\n    return null;\n  }\n  function dealBox(row, slug, lg) {\n    var t = TD[lg], a = el('div', 'margin:14px 0;padding:14px 16px;border-radius:14px;border:1px solid rgba(15,118,110,.35);background:rgba(15,118,110,.07);color:inherit;font-size:14px;line-height:1.45;text-align:left');\n    a.id = 'rh-kb'; a.setAttribute('data-k', slug + '|' + lg);\n    a.appendChild(el('div', 'font-weight:700;font-size:15px;margin-bottom:4px', t.h));\n    a.appendChild(el('div', 'opacity:.85;margin-bottom:10px', t.p));\n    var b = el('a', 'display:inline-block;background:#0f766e;color:#fff;font-weight:600;padding:10px 14px;border-radius:10px;text-decoration:none', t.b);\n    b.href = kurl(row.source_url, 'deal_page', slug); b.target = '_blank'; b.rel = 'noopener';\n    b.addEventListener('click', function () { log('deal_click', { slug: slug, placement: 'deal' }); });\n    a.appendChild(b);\n    a.appendChild(el('div', 'opacity:.6;font-size:12px;margin-top:8px', t.s));\n    return a;\n  }\n  function dealTick() {\n    var m = location.pathname.match(/^\\/deal\\/([^/?#]+)/), old = document.getElementById('rh-kb');\n    if (!m) { if (old) old.remove(); key = ''; return; }\n    var slug = decodeURIComponent(m[1]), lg = L();\n    if (old && old.getAttribute('data-k') === slug + '|' + lg) return;\n    if (old && old.getAttribute('data-k').split('|')[0] !== slug) { old.remove(); old = null; }\n    askGeo(); loadDeal(slug);\n    if (rows[slug] === null || rows[slug] === undefined || geo === undefined) return;\n    var row = rows[slug], force = /[?&]kb=1/.test(location.search);\n    var ok = row && row.source_url && (force || (row.price_eur >= TH && geo && !same(name(geo), row.country)));\n    if (!ok) { if (old) old.remove(); return; }\n    var an = anchor(); if (!an) return;\n    if (old) old.remove();\n    an.parentNode.insertBefore(dealBox(row, slug, lg), an.nextSibling);\n    if (key !== slug) { key = slug; log('deal_view', { slug: slug, placement: 'deal' }); }\n  }\n\n  /* ---------- 2) sponsored Kolaboro card in the feed ---------- */\n  var TF = {\n    en: { lab: 'Sponsored \u00b7 Kolaboro', loc: 'Any country', sub: '\u00b7 Free check', price: 'Free', h: 'Found a home abroad? Check it before you pay', met: 'Kolaboro \u00b7 AI check plus local agents', p: 'Paste the listing link. In about a minute you see who is selling, what the title and permits say, and the red flags to ask about. A local agent can then visit it for \u20ac490.', ph: 'Paste a listing link (any portal or agency)', b: 'Check it free', ex: 'Example report', r: ['Seller and company found', 'Title and permits to request', 'Price vs. the area', '2 red flags to ask about'], sc: 'Trust score' },\n    es: { lab: 'Patrocinado \u00b7 Kolaboro', loc: 'Cualquier pa\u00eds', sub: '\u00b7 Revisi\u00f3n gratis', price: 'Gratis', h: '\u00bfHas visto una casa fuera? Compru\u00e9bala antes de pagar', met: 'Kolaboro \u00b7 revisi\u00f3n con IA y agentes locales', p: 'Pega el enlace del anuncio. En un minuto ves qui\u00e9n vende, qu\u00e9 dicen escrituras y permisos y las se\u00f1ales de alarma que preguntar. Despu\u00e9s, un agente local la visita por 490 \u20ac.', ph: 'Pega el enlace de un anuncio (cualquier portal o agencia)', b: 'Comprobar gratis', ex: 'Informe de ejemplo', r: ['Vendedor y empresa identificados', 'Escrituras y permisos que pedir', 'Precio frente a la zona', '2 se\u00f1ales de alarma que preguntar'], sc: 'Nota de confianza' }\n  };\n  function feedCard(lg) {\n    var t = TF[lg];\n    var span = el('div'); span.className = 'hx-span'; span.setAttribute('data-rhkb', lg);\n    var art = el('article'); art.className = 'hunt-card hunt-sponsored'; art.setAttribute('aria-label', t.lab); span.appendChild(art);\n    var ph = el('div', 'aspect-ratio:auto;height:auto;max-height:none'); ph.className = 'hunt-card-photo'; art.appendChild(ph);\n    var vis = el('a', 'display:flex;align-items:center;justify-content:center;gap:22px;flex-wrap:wrap;min-height:300px;aspect-ratio:auto;height:auto;padding:56px 20px 28px;background:linear-gradient(135deg,#0b3b36 0%,#0f766e 60%,#14532d 100%);color:#fff;text-decoration:none;box-sizing:border-box;width:100%');\n    vis.className = 'hunt-media'; vis.href = kurl('', 'feed_card', 'sponsored_check'); vis.target = '_blank'; vis.rel = 'noopener';\n    vis.addEventListener('click', function () { log('feed_click', { placement: 'feed_visual' }); });\n    var rep = el('div', 'background:rgba(255,255,255,.96);color:#0f172a;border-radius:14px;padding:14px 16px;min-width:230px;max-width:300px;box-shadow:0 10px 30px rgba(0,0,0,.25);font-size:13px;line-height:1.5;text-align:left');\n    rep.appendChild(el('div', 'font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#0f766e;font-weight:700;margin-bottom:6px', t.ex));\n    t.r.forEach(function (s, i) { var r = el('div', 'display:flex;gap:8px;align-items:center;padding:2px 0'); r.appendChild(el('span', 'display:inline-flex;width:18px;height:18px;border-radius:50%;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;background:' + (i === 3 ? '#d97706' : '#0f766e'), i === 3 ? '!' : '\u2713')); r.appendChild(el('span', '', s)); rep.appendChild(r); });\n    var ring = el('div', 'display:flex;flex-direction:column;align-items:center;gap:6px');\n    var c = el('div', 'width:96px;height:96px;border-radius:50%;background:conic-gradient(#fbbf24 0 72%,rgba(255,255,255,.25) 72% 100%);display:flex;align-items:center;justify-content:center');\n    c.appendChild(el('div', 'width:76px;height:76px;border-radius:50%;background:#0b3b36;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800', '72'));\n    ring.appendChild(c); ring.appendChild(el('div', 'font-size:12px;opacity:.9', t.sc));\n    vis.appendChild(rep); vis.appendChild(ring); ph.appendChild(vis);\n    var lab = el('span', null, t.lab); lab.className = 'hunt-sponsored-label'; ph.appendChild(lab);\n    var body = el('div'); body.className = 'hunt-card-body'; art.appendChild(body);\n    var loc = el('div', null, t.loc + ' '); loc.className = 'hunt-card-location'; loc.appendChild(el('span', null, t.sub)); body.appendChild(loc);\n    var pr = el('div', null, t.price); pr.className = 'hunt-price'; body.appendChild(pr);\n    body.appendChild(el('h2', null, t.h));\n    var met = el('p', null, t.met); met.className = 'hunt-metrics'; body.appendChild(met);\n    body.appendChild(el('p', null, t.p));\n    var f = el('form', 'display:flex;gap:8px;flex-wrap:wrap;margin-top:6px');\n    var inp = el('input', 'flex:1 1 240px;min-width:0;padding:12px 14px;border-radius:12px;border:1px solid rgba(127,127,127,.4);background:transparent;color:inherit;font:inherit');\n    inp.type = 'url'; inp.placeholder = t.ph; inp.setAttribute('aria-label', t.ph); inp.autocomplete = 'off';\n    var btn = el('button', 'flex:0 0 auto;border:0;cursor:pointer;justify-content:center', t.b); btn.type = 'submit'; btn.className = 'hunt-primary';\n    f.appendChild(inp); f.appendChild(btn); body.appendChild(f);\n    f.addEventListener('submit', function (e) {\n      e.preventDefault(); var v = (inp.value || '').trim();\n      if (v && !/^https?:\\/\\//i.test(v)) v = 'https://' + v;\n      log(v ? 'feed_paste' : 'feed_click', { placement: 'feed_form' });\n      window.open(kurl(v, 'feed_card', 'sponsored_check'), '_blank', 'noopener');\n    });\n    try { new IntersectionObserver(function (es, o) { es.forEach(function (x) { if (x.isIntersecting && !seen.feed) { seen.feed = 1; log('feed_view', { placement: 'feed' }); o.disconnect(); } }); }, { threshold: 0.5 }).observe(span); } catch (e) {}\n    return span;\n  }\n  function feedTick() {\n    var g = document.querySelector('.hx-grid'); if (!g) return;\n    var lg = L(), cur = g.querySelector(':scope > [data-rhkb]');\n    if (cur && cur.getAttribute('data-rhkb') === lg) return;\n    if (cur) cur.remove();\n    var k = g.children; if (k.length < 12) return;\n    var i = Math.min(18, k.length - 1);\n    while (i < k.length - 1 && (/hx-span/.test(k[i].className) || /hx-span/.test(k[i - 1].className))) i++;\n    g.insertBefore(feedCard(lg), k[i]);\n  }\n\n  function tick() { try { dealTick(); } catch (e) {} try { feedTick(); } catch (e) {} }\n  var pend = false;\n  try { new MutationObserver(function () { if (pend) return; pend = true; requestAnimationFrame(function () { pend = false; tick(); }); }).observe(document.documentElement, { childList: true, subtree: true, characterData: true }); } catch (e) {}\n  setInterval(tick, 800); tick();\n})();\n";
const KBRH = "/* kolaboro.com/check: \"you came from RealHunt\" banner (v1, 30-oct-2026), served by the web-lovable worker at /__k/kbrh.js.\n   Shown when the URL has utm_source=realhunt and rh=<RealHunt slug>. */\n(function () {\n  var q = new URLSearchParams(location.search), slug = q.get('rh');\n  if (q.get('utm_source') !== 'realhunt' || !slug || !/^[\\w-]{3,120}$/.test(slug)) return;\n  var AK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw';\n  function el(tag, css, txt) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; }\n  function money(n) { try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n); } catch (e) { return '\u20ac' + n; } }\n  fetch('https://realhunt.co/__sb/realhunt/rest/v1/community_deals?status=eq.approved&select=title,price_eur,location_name,country,image_urls,source_domain&slug=eq.' + encodeURIComponent(slug), { headers: { apikey: AK, Authorization: 'Bearer ' + AK } })\n    .then(function (r) { return r.json(); }).then(function (d) {\n      var h = d && d[0]; if (!h) return;\n      var az = document.getElementById('az'); if (!az || document.getElementById('kb-from-rh')) return;\n      var box = el('div', 'display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin:0 0 18px;padding:12px;border:1px solid rgba(15,23,42,.12);border-radius:14px;background:rgba(255,255,255,.7);text-align:left');\n      box.id = 'kb-from-rh';\n      var img = (h.image_urls || [])[0];\n      if (img) { var im = el('img', 'width:96px;height:72px;object-fit:cover;border-radius:10px;flex:0 0 auto'); im.src = /^https?:/.test(img) ? img : 'https://realhunt.co' + img; im.alt = ''; im.loading = 'lazy'; box.appendChild(im); }\n      var t = el('div', 'min-width:0;flex:1 1 auto;font-size:14px;line-height:1.4');\n      t.appendChild(el('div', 'font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.7;font-weight:700', 'From RealHunt'));\n      t.appendChild(el('div', 'font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis', h.title || ''));\n      t.appendChild(el('div', 'opacity:.8', [money(h.price_eur), h.location_name, h.country].filter(Boolean).join(' \u00b7 ')));\n      t.appendChild(el('div', 'opacity:.8;margin-top:2px', 'We are reading the listing' + (h.source_domain ? ' on ' + h.source_domain : '') + ' now. Your free desk review appears below.'));\n      box.appendChild(t);\n      var back = el('a', 'flex:0 0 auto;font-size:13px;white-space:nowrap', '\u2190 Back to the home'); back.href = 'https://realhunt.co/deal/' + encodeURIComponent(slug); box.appendChild(back);\n      az.parentNode.insertBefore(box, az);\n      try { if (window.kbEvent) kbEvent('rh_ref', { slug: slug }); } catch (e) {}\n    }).catch(function () {});\n})();\n";
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
    if (host === 'kolaboro.com') { const kr = kbHeaders(await this.site(req, env, ctx, u, host), u); if (req.method === 'GET' && /^\/check\/?$/.test(u.pathname) && u.searchParams.get('utm_source') === 'realhunt' && /text\/html/.test(kr.headers.get('content-type') || '')) return new HTMLRewriter().on('body', { element(e) { e.append('<script src="/__k/kbrh.js?v=1" defer></script>', { html: true }); } }).transform(kr); return kr; }
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
    if (host === 'realhunt.co' && req.method === 'GET' && /text\/html/.test(r.headers.get('content-type') || '')) return new HTMLRewriter().on('head', { element(e) { e.prepend("<script>/*rh-img-fb*/(function(){var M='https://realhunt-media.pages.dev/';document.addEventListener('error',function(e){var t=e.target;if(!t||t.tagName!=='IMG'||t.__rhfb)return;var s=t.currentSrc||t.getAttribute('src')||'';if(s.indexOf(M)!==0)return;t.__rhfb=1;e.stopImmediatePropagation();if(t.srcset)t.removeAttribute('srcset');t.src='https://realhunt.co/'+s.slice(M.length);},true);})();</script>", { html: true }); } }).on('body', { element(e) { e.append('<script src="/__k/kcheck.js?v=3" defer></script>', { html: true }); } }).transform(r);
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
    if (host === 'kolaboro.com' && u.pathname === '/__k/kbrh.js') return new Response(KBRH, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=600' } });
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
