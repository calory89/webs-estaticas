// realhunt-media worker v2 (4-nov-2026). Pages project realhunt-media, built from webs-estaticas pub/_lovable,
// root _s/realhunt.co. Two modes:
//  - full: requests for realhunt.co, www.realhunt.co and go.realhunt.co (custom domains of this project), or any
//    request with header "x-rh-full: 1" / cookie "rhfull=1" (testing on realhunt-media.pages.dev). This is the
//    realhunt.co logic that used to live in the web-lovable worker (_worker.js/index.js): Supabase proxy /__sb/,
//    /__k/kcheck.js, /data/rh-static.json from realhunt-top, photo fallbacks, ?p= lookups, no trailing slash,
//    folder pages served directly, unknown pages load the app with noindex, rh-img-fb + kcheck injected in HTML.
//    /assets/* are copied here by the build (_rhbuild/assets.py); a missing one comes from web-lovable.pages.dev.
//  - raw (realhunt-media.pages.dev without the test flag): files as they are, images missing here come from the
//    source repo's public/ folder (Pages project realhunt-top). The web-lovable worker reads pages this way.
const TOP = 'https://realhunt-top.pages.dev';
const WL = 'https://web-lovable.pages.dev';
const IMG = /\.(?:webp|jpe?g|png|gif|avif)$/i;
const isImg = (r) => r.status === 200 && /^image\//i.test(r.headers.get('content-type') || '');
function img200(r) {
  const h = new Headers(r.headers);
  h.set('cache-control', 'public, max-age=86400');
  h.set('access-control-allow-origin', '*');
  return new Response(r.body, { status: 200, headers: h });
}
async function topImage(u) {
  const t = await fetch(TOP + u.pathname, { cf: { cacheEverything: true, cacheTtl: 86400 } });
  if (isImg(t)) return img200(t);
  if (u.pathname.startsWith('/top/')) {
    const t2 = await fetch(TOP + u.pathname.slice(4), { cf: { cacheEverything: true, cacheTtl: 86400 } });
    if (isImg(t2)) return img200(t2);
  }
  return null;
}
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
const KCHECK = "/* realhunt.co runtime layer v6 (30-oct-2026), served by the web-lovable worker at /__k/kcheck.js.\n   1) Kolaboro box on deal pages: visitor in another country than the home and price >= EUR 80,000 (?kb=1 forces it).\n   2) Sponsored Kolaboro card in the home feed (\"check any home\").\n   Events go to realhunt.kb_events and to GA (gtag). */\n(function () {\n  if (window.__rhplus) return; window.__rhplus = 1;\n  var TH = 80000, AK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw';\n  var rows = {}, geo, geoAsked = false, key = '', seen = {};\n  function L() { return (document.documentElement.lang || 'en').slice(0, 2) === 'es' ? 'es' : 'en'; }\n  function sid() { try { return localStorage.getItem('rh_sid') || ''; } catch (e) { return ''; } }\n  function log(kind, extra) {\n    var b = { kind: kind, placement: (extra && extra.placement) || null, slug: (extra && extra.slug) || null, viewer: geo || null, lang: L(), sid: sid().slice(0, 60) };\n    if (extra && extra.url) { b.url = String(extra.url).slice(0, 500); b.domain = String(extra.domain || '').slice(0, 120) || null; }\n    try { if (window.gtag) gtag('event', 'kolaboro_' + kind, { slug: b.slug || '', viewer: b.viewer || '' }); } catch (e) {}\n    try { fetch('/__sb/realhunt/rest/v1/kb_events', { method: 'POST', keepalive: true, headers: { apikey: AK, Authorization: 'Bearer ' + AK, 'content-type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(b) }); } catch (e) {}\n  }\n  function askGeo() { if (geoAsked) return; geoAsked = true; fetch('/api/geo').then(function (r) { return r.json(); }).then(function (g) { geo = (g && g.country) || null; }).catch(function () { geo = null; }); }\n  function kurl(u, medium, slug) {\n    return 'https://kolaboro.com/check' + (u ? '?url=' + encodeURIComponent(u) + '&' : '?') + 'utm_source=realhunt&utm_medium=' + medium + '&utm_campaign=' + encodeURIComponent(slug || 'sponsored') + (slug && medium === 'deal_page' ? '&rh=' + encodeURIComponent(slug) : '');\n  }\n  function el(tag, css, txt) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; }\n\n  /* ---------- 1) deal page box ---------- */\n  var TD = {\n    en: { h: 'Buying from abroad? Check it before you pay a deposit', p: 'Free AI check of this listing in about a minute: who is selling, title and permits, red flags. If you want more, a local agent can verify it on site for \u20ac490.', b: 'Check this home with Kolaboro \u2192', s: 'Sponsored. Kolaboro is the buyer-verification service from the team behind RealHunt.' },\n    es: { h: '\u00bfCompras desde fuera? Compru\u00e9bala antes de pagar la reserva', p: 'Revisi\u00f3n gratis con IA de este anuncio en un minuto: qui\u00e9n vende, escrituras y permisos, se\u00f1ales de alarma. Si quieres m\u00e1s, un agente local la verifica en persona por 490 \u20ac.', b: 'Comprobar esta casa con Kolaboro \u2192', s: 'Patrocinado. Kolaboro es el servicio de verificaci\u00f3n de compradores del equipo de RealHunt.' }\n  };\n  function name(cc) { try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(cc); } catch (e) { return cc; } }\n  function same(a, b) { a = String(a || '').toLowerCase(); b = String(b || '').toLowerCase(); return a === b || (a.indexOf('united states') === 0 && b.indexOf('united states') === 0); }\n  function loadDeal(slug) {\n    if (rows[slug] !== undefined) return; rows[slug] = null;\n    fetch('/__sb/realhunt/rest/v1/community_deals?status=eq.approved&select=price_eur,country,source_url&slug=eq.' + encodeURIComponent(slug), { headers: { apikey: AK, Authorization: 'Bearer ' + AK } })\n      .then(function (r) { return r.json(); }).then(function (d) { rows[slug] = (d && d[0]) || false; }).catch(function () { rows[slug] = false; });\n  }\n  function anchor() {\n    var c = ['.hv-aside-cta', '.hunt-detail-actions', '.hv-amenities', '.hv-detail-where'];\n    for (var i = 0; i < c.length; i++) { var e = document.querySelector(c[i]); if (e && e.offsetParent !== null) return e; }\n    return null;\n  }\n  function dealBox(row, slug, lg) {\n    var t = TD[lg], a = el('div', 'margin:14px 0;padding:14px 16px;border-radius:14px;border:1px solid rgba(15,118,110,.35);background:rgba(15,118,110,.07);color:inherit;font-size:14px;line-height:1.45;text-align:left');\n    a.id = 'rh-kb'; a.setAttribute('data-k', slug + '|' + lg);\n    a.appendChild(el('div', 'font-weight:700;font-size:15px;margin-bottom:4px', t.h));\n    a.appendChild(el('div', 'opacity:.85;margin-bottom:10px', t.p));\n    var b = el('a', 'display:inline-block;background:#0f766e;color:#fff;font-weight:600;padding:10px 14px;border-radius:10px;text-decoration:none', t.b);\n    b.href = kurl(row.source_url, 'deal_page', slug); b.target = '_blank'; b.rel = 'noopener';\n    b.addEventListener('click', function () { log('deal_click', { slug: slug, placement: 'deal' }); });\n    a.appendChild(b);\n    a.appendChild(el('div', 'opacity:.6;font-size:12px;margin-top:8px', t.s));\n    return a;\n  }\n  function dealTick() {\n    var m = location.pathname.match(/^\\/deal\\/([^/?#]+)/), old = document.getElementById('rh-kb');\n    if (!m) { if (old) old.remove(); key = ''; return; }\n    var slug = decodeURIComponent(m[1]), lg = L();\n    if (old && old.getAttribute('data-k') === slug + '|' + lg) return;\n    if (old && old.getAttribute('data-k').split('|')[0] !== slug) { old.remove(); old = null; }\n    askGeo(); loadDeal(slug);\n    if (rows[slug] === null || rows[slug] === undefined || geo === undefined) return;\n    var row = rows[slug], force = /[?&]kb=1/.test(location.search);\n    var ok = row && row.source_url && (force || (row.price_eur >= TH && geo && !same(name(geo), row.country)));\n    if (!ok) { if (old) old.remove(); return; }\n    var an = anchor(); if (!an) return;\n    if (old) old.remove();\n    an.parentNode.insertBefore(dealBox(row, slug, lg), an.nextSibling);\n    if (key !== slug) { key = slug; log('deal_view', { slug: slug, placement: 'deal' }); }\n  }\n\n  /* ---------- 2) sponsored Kolaboro card in the feed (v4: clear promise, 3 steps, example report) ---------- */\n  var TF = {\n    en: { lab: 'Sponsored \u00b7 Kolaboro', badge: 'Free \u00b7 1 minute \u00b7 any country',\n          h: 'Is this home legit? Check it before you pay a deposit.',\n          sub: 'Paste the link of any listing you found abroad. Kolaboro tells you who is really selling and what to ask before you send money.',\n          st: [['Paste the link', 'Idealista, Rightmove, Zillow, any agency'], ['AI checks it in 1 min', 'Seller, title, permits, price vs. area'], ['Want certainty?', 'A local agent visits it for \u20ac490']],\n          ph: 'Paste a listing link or website\u2026', b: 'Check it free \u2192', bad: 'Paste a link or a website, e.g. idealista.com/inmueble/123', note: 'No sign-up. Free report.',\n          ex: 'Example report', home: 'Sea-view villa \u00b7 Algarve \u00b7 \u20ac320,000', src: 'idealista.pt',\n          sc: 'Trust score', scv: 'Fair, ask 2 questions',\n          r: [['ok', 'Seller found: registered agency'], ['ok', 'Price in line with the area'], ['warn', 'Habitation licence not shown'], ['warn', 'Owner name differs from seller']] },\n    es: { lab: 'Patrocinado \u00b7 Kolaboro', badge: 'Gratis \u00b7 1 minuto \u00b7 cualquier pa\u00eds',\n          h: '\u00bfEsta casa es de fiar? Compru\u00e9bala antes de pagar la reserva.',\n          sub: 'Pega el enlace de cualquier anuncio que hayas visto fuera. Kolaboro te dice qui\u00e9n vende de verdad y qu\u00e9 preguntar antes de mandar dinero.',\n          st: [['Pega el enlace', 'Idealista, Rightmove, Zillow, cualquier agencia'], ['La IA lo revisa en 1 min', 'Vendedor, escrituras, permisos, precio de zona'], ['\u00bfQuieres certeza?', 'Un agente local la visita por 490 \u20ac']],\n          ph: 'Pega el enlace de un anuncio o una web\u2026', b: 'Comprobar gratis \u2192', bad: 'Pega un enlace o una web, por ejemplo idealista.com/inmueble/123', note: 'Sin registro. Informe gratis.',\n          ex: 'Informe de ejemplo', home: 'Villa con vistas al mar \u00b7 Algarve \u00b7 320.000 \u20ac', src: 'idealista.pt',\n          sc: 'Nota de confianza', scv: 'Correcta, 2 preguntas',\n          r: [['ok', 'Vendedor: agencia registrada'], ['ok', 'Precio acorde a la zona'], ['warn', 'No muestra licencia de habitabilidad'], ['warn', 'El titular no coincide con quien vende']] }\n  };\n  var CSS = '.rkb{grid-column:1/-1;border-radius:20px;overflow:hidden;background:linear-gradient(135deg,#062b27 0%,#0b4f48 55%,#0f766e 100%);color:#fff;box-shadow:0 10px 30px rgba(6,43,39,.18);position:relative}' +\n    '.rkb *{box-sizing:border-box}.rkb-in{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:28px;padding:28px;align-items:center}' +\n    '.rkb-top{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px}' +\n    '.rkb-lab{font-size:12px;letter-spacing:.06em;text-transform:uppercase;opacity:.7}' +\n    '.rkb-badge{font-size:12px;font-weight:700;background:#fbbf24;color:#3b2a00;border-radius:999px;padding:4px 10px}' +\n    '.rkb h2{font-size:clamp(22px,2.6vw,30px);line-height:1.15;margin:0 0 10px;font-weight:800;color:#fff;letter-spacing:-.01em}' +\n    '.rkb-sub{font-size:15px;line-height:1.5;opacity:.88;margin:0 0 18px}' +\n    '.rkb-steps{list-style:none;margin:0 0 18px;padding:0;display:grid;gap:10px}' +\n    '.rkb-steps li{display:flex;gap:12px;align-items:flex-start;font-size:14px;line-height:1.35}' +\n    '.rkb-n{flex:0 0 26px;height:26px;border-radius:50%;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px}' +\n    '.rkb-steps b{display:block;font-weight:700}.rkb-steps span{opacity:.75;font-size:13px}' +\n    '.rkb-f{display:flex;gap:8px;flex-wrap:wrap;background:#fff;border-radius:14px;padding:6px}' +\n    '.rkb-f input{flex:1 1 180px;min-width:0;border:0;outline:0;background:transparent;color:#0f172a;font:inherit;font-size:15px;padding:10px 10px}' +\n    '.rkb-f button{flex:0 0 auto;border:0;cursor:pointer;border-radius:10px;padding:11px 16px;font-weight:700;font-size:15px;background:#c2410c;color:#fff}' +\n    '.rkb-f button:hover{background:#9a3412}.rkb-note{font-size:12px;opacity:.7;margin-top:8px}' +\n    '.rkb-rep{display:block;background:#fff;color:#0f172a;border-radius:16px;padding:16px;box-shadow:0 18px 40px rgba(0,0,0,.3);text-decoration:none;max-width:420px;width:100%;justify-self:center;transform:rotate(-1deg)}' +\n    '.rkb-rep:hover{transform:rotate(0)}.rkb-rh{display:flex;justify-content:space-between;align-items:center;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#0f766e;font-weight:800;margin-bottom:10px}' +\n    '.rkb-url{font-size:12px;color:#475569;background:#f1f5f9;border-radius:8px;padding:6px 8px;margin-bottom:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +\n    '.rkb-sc{display:flex;gap:14px;align-items:center;margin-bottom:12px}' +\n    '.rkb-ring{flex:0 0 64px;height:64px;border-radius:50%;background:conic-gradient(#f59e0b 0 72%,#e2e8f0 72% 100%);display:flex;align-items:center;justify-content:center}' +\n    '.rkb-ring div{width:50px;height:50px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800}' +\n    '.rkb-sc b{display:block;font-size:15px}.rkb-sc span{font-size:12px;color:#64748b}' +\n    '.rkb-row{display:flex;gap:8px;align-items:center;font-size:13px;padding:5px 0;border-top:1px solid #f1f5f9}' +\n    '.rkb-i{flex:0 0 18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff}' +\n    '.rkb a.rkb-rep,.rkb a.rkb-rep b,.rkb .rkb-ring div,.rkb .rkb-row span+span{color:#0f172a!important}.rkb a.rkb-rep .rkb-sc span{color:#64748b!important}.rkb a.rkb-rep .rkb-rh span:first-child{color:#0f766e!important}' +\n    '.rkb .rkb-f input{background:#fff!important;color:#0f172a!important;border:0!important;box-shadow:none!important}.rkb .rkb-f input::placeholder{color:#64748b}' +\n    '@media (max-width:560px){.rkb-in{padding:20px;gap:18px}.rkb-sub{display:none}.rkb-rep{transform:none}.rkb-f button{flex:1 1 100%}.rkb-row:nth-of-type(n+7){display:none}}';\n  /* accepts \"idealista.com/inmueble/123\", \"www.x.com\", \"https://...\" or text with a link inside; null for plain words */\n  function normUrl(v) {\n    v = String(v || '').trim(); if (!v) return null;\n    var m = v.match(/https?:\\/\\/[^\\s\"'<>]+/i) || v.match(/(?:www\\.)?[a-z0-9-]+(?:\\.[a-z0-9-]+)*\\.[a-z]{2,}(?:[\\/?#][^\\s\"'<>]*)?/i);\n    if (!m) return null;\n    var u = m[0].replace(/[),.;]+$/, ''); if (!/^https?:\\/\\//i.test(u)) u = 'https://' + u;\n    try { var x = new URL(u); if (!/\\./.test(x.hostname)) return null; return { url: x.href, domain: x.hostname.replace(/^www\\./, '').toLowerCase() }; } catch (e) { return null; }\n  }\n  function feedCard(lg) {\n    var t = TF[lg];\n    if (!document.getElementById('rkb-css')) { var st = el('style'); st.id = 'rkb-css'; st.textContent = CSS; document.head.appendChild(st); }\n    var span = el('div'); span.className = 'hx-span'; span.setAttribute('data-rhkb', lg);\n    var art = el('article'); art.className = 'rkb'; art.setAttribute('aria-label', t.lab); span.appendChild(art);\n    var inr = el('div'); inr.className = 'rkb-in'; art.appendChild(inr);\n    var L1 = el('div'); inr.appendChild(L1);\n    var top = el('div'); top.className = 'rkb-top';\n    var bd = el('span', null, t.badge); bd.className = 'rkb-badge'; top.appendChild(bd);\n    var lb = el('span', null, t.lab); lb.className = 'rkb-lab'; top.appendChild(lb); L1.appendChild(top);\n    L1.appendChild(el('h2', null, t.h));\n    var sb = el('p', null, t.sub); sb.className = 'rkb-sub'; L1.appendChild(sb);\n    var ol = el('ol'); ol.className = 'rkb-steps';\n    t.st.forEach(function (s, i) { var li = el('li'); var n = el('span', null, String(i + 1)); n.className = 'rkb-n'; li.appendChild(n); var tx = el('div'); tx.appendChild(el('b', null, s[0])); tx.appendChild(el('span', null, s[1])); li.appendChild(tx); ol.appendChild(li); });\n    L1.appendChild(ol);\n    var f = el('form'); f.className = 'rkb-f';\n    var inp = el('input'); inp.type = 'text'; f.noValidate = true; inp.spellcheck = false; inp.setAttribute('autocapitalize', 'off'); inp.placeholder = t.ph; inp.setAttribute('aria-label', t.ph); inp.autocomplete = 'off'; inp.inputMode = 'url';\n    var btn = el('button', null, t.b); btn.type = 'submit';\n    f.appendChild(inp); f.appendChild(btn); L1.appendChild(f);\n    var nt = el('div', null, t.note); nt.className = 'rkb-note'; L1.appendChild(nt);\n    var hint = el('div', 'display:none;font-size:13px;margin-top:8px;color:#fde68a'); L1.appendChild(hint);\n    inp.addEventListener('input', function () { hint.style.display = 'none'; });\n    f.addEventListener('submit', function (e) {\n      e.preventDefault();\n      var n = normUrl(inp.value);\n      if (inp.value.trim() && !n) { hint.textContent = t.bad; hint.style.display = 'block'; inp.focus(); return; }\n      if (n) inp.value = n.url;\n      log(n ? 'feed_paste' : 'feed_click', { placement: 'feed_form', url: n && n.url, domain: n && n.domain });\n      window.open(kurl(n ? n.url : '', 'feed_card', 'sponsored_check'), '_blank', 'noopener');\n    });\n    var rep = el('a'); rep.className = 'rkb-rep'; rep.href = kurl('', 'feed_card', 'sponsored_check'); rep.target = '_blank'; rep.rel = 'noopener';\n    rep.addEventListener('click', function () { log('feed_click', { placement: 'feed_visual' }); });\n    var rh = el('div'); rh.className = 'rkb-rh'; rh.appendChild(el('span', null, t.ex)); rh.appendChild(el('span', 'color:#64748b', 'Kolaboro')); rep.appendChild(rh);\n    var ur = el('div', null, '\ud83d\udd17 ' + t.src + ' \u00b7 ' + t.home); ur.className = 'rkb-url'; rep.appendChild(ur);\n    var sc = el('div'); sc.className = 'rkb-sc'; var ring = el('div'); ring.className = 'rkb-ring'; ring.appendChild(el('div', null, '72')); sc.appendChild(ring);\n    var sct = el('div'); sct.appendChild(el('b', null, t.scv)); sct.appendChild(el('span', null, t.sc + ' 72/100')); sc.appendChild(sct); rep.appendChild(sc);\n    t.r.forEach(function (r) { var row = el('div'); row.className = 'rkb-row'; var ic = el('span', 'background:' + (r[0] === 'ok' ? '#0f766e' : '#d97706'), r[0] === 'ok' ? '\u2713' : '!'); ic.className = 'rkb-i'; row.appendChild(ic); row.appendChild(el('span', null, r[1])); rep.appendChild(row); });\n    inr.appendChild(rep);\n    try { new IntersectionObserver(function (es, o) { es.forEach(function (x) { if (x.isIntersecting && !seen.feed) { seen.feed = 1; log('feed_view', { placement: 'feed' }); o.disconnect(); } }); }, { threshold: 0.5 }).observe(span); } catch (e) {}\n    return span;\n  }\n  function feedTick() {\n    var g = document.querySelector('.hx-grid'); if (!g) return;\n    var lg = L(), cur = g.querySelector(':scope > [data-rhkb]');\n    /* v6: after a filter change React rebuilds the grid and the card ended up first; keep it around position 18 */\n    if (cur && cur.getAttribute('data-rhkb') === lg) { var idx = Array.prototype.indexOf.call(g.children, cur); if (idx >= 12) return; }\n    if (cur) cur.remove();\n    var k = g.children; if (k.length < 12) return;\n    var i = Math.min(18, k.length - 1);\n    while (i < k.length - 1 && (/hx-span/.test(k[i].className) || /hx-span/.test(k[i - 1].className))) i++;\n    g.insertBefore(feedCard(lg), k[i]);\n  }\n\n  function tick() { try { dealTick(); } catch (e) {} try { feedTick(); } catch (e) {} }\n  var pend = false;\n  try { new MutationObserver(function () { if (pend) return; pend = true; requestAnimationFrame(function () { pend = false; tick(); }); }).observe(document.documentElement, { childList: true, subtree: true, characterData: true }); } catch (e) {}\n  setInterval(tick, 800); tick();\n})();\n";
const RH_KNOWN = new Set(["__k", "es", "__sb", "about", "account", "admin", "agents", "alerts", "analysis", "app", "apply", "assets", "auth", "b", "badge", "best", "best-deals", "blog", "browse", "buying-costs", "c", "can-i-buy", "cheap-houses", "claim", "compare", "compare-homes", "compare-new-builds", "contact", "costs", "countries", "country", "dashboard", "data", "deal", "deals", "dev", "developers", "discover", "ecobeachcity", "extension", "find", "find-my-home", "finds", "fit", "for-agents", "from", "game", "guide", "heatmap", "help-buying", "homes", "homes-compare", "homescoring", "hunt", "hunter", "i18n", "images", "inbox", "insider", "invite", "lake-como", "leaderboard", "leads", "legal", "live-search", "map", "market", "me", "method", "network", "new", "new-builds", "og", "portfolio", "price-drops", "pricing", "privacy", "profile", "projects", "quiz", "r", "ranking", "rankings", "research", "reset-password", "s", "saved", "score", "search", "sell", "settings", "sitemap", "sources", "submit", "swipe", "t", "terms", "tickets", "top", "videos", "vs", "weather", "what-100k-buys", "winners"]);
function asset(env, req, path) {
  return env.ASSETS.fetch(new Request(new URL(path, req.url), { method: req.method === 'HEAD' ? 'HEAD' : 'GET', headers: req.headers, redirect: 'manual' }));
}
/* rh-pack-1 (20 Nov 2026): home pages (/deal/<slug>, /es/deal/<slug>) come from the bundles /_pk/v1/<n>.json written by
   the site build (score-insight-rank seo/pack.ts, same FNV-1a hash of the path), so the deploy does not need one file per page.
   Up to 24 bundles stay in memory for 2 minutes. A page that is not in its bundle falls back to its own file.
   /__pk/<path> serves a page only from the bundles (noindex), to compare them with the files. */
/* rh-pack-2 (20 Nov 2026): on for every home page, after all 1,366 pages compared equal with their files */
/* rh-pack-3 (26 Nov 2026): the pages of /de /fr /nl /pl /ru come from /_pk/l1/<n>.json (512 bundles, keyed by the decoded path,
   seo/langs/pack.ts of score-insight-rank), the same way as the home pages */
const RH_PK_SERVE = true, RH_PK = new Map(), RH_PK_RE = /^\/(?:es\/)?deal\/[\w.~-]+$/, RH_PKL_RE = /^\/(?:de|fr|nl|pl|ru)(?:\/[^/]+)*$/;
function packShard(k, s) { let h = 0x811c9dc5; for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h % (s || 256); }
async function packPage(env, req, path) {
  const home = RH_PK_RE.test(path);
  if (!home) { if (!RH_PKL_RE.test(path) || /\.(xml|txt|json|md)$/.test(path)) return null; try { path = decodeURIComponent(path); } catch (e) { return null; } }
  const n = home ? 'v1/' + packShard(path) : 'l1/' + packShard(path, 512); let c = RH_PK.get(n);
  if (!c || Date.now() - c.at > 120000) {
    try {
      const r = await env.ASSETS.fetch(new Request(new URL('/_pk/' + n + '.json', req.url)));
      if (r.status === 200) c = { at: Date.now(), m: await r.json() };
      else if (r.status === 404) c = { at: Date.now(), m: {} };
    } catch (e) { /* keep the old copy, if any */ }
    if (!c) return null;
    RH_PK.delete(n); RH_PK.set(n, c);
    while (RH_PK.size > 24) RH_PK.delete(RH_PK.keys().next().value);
  }
  const html = Object.prototype.hasOwnProperty.call(c.m, path) ? c.m[path] : null;
  if (typeof html !== 'string') return null;
  /* rh-seo-1 (20 Nov 2026): /deal/<slug>.md is the clean-text twin of the page, for AI assistants: not indexed, canonical is the page */
  if (path.endsWith('.md')) return new Response(req.method === 'HEAD' ? null : html, { status: 200, headers: { 'content-type': 'text/markdown; charset=utf-8', 'cache-control': 'public, max-age=0, must-revalidate', 'x-robots-tag': 'noindex', 'link': '<https://realhunt.co' + path.slice(0, -3) + '>; rel="canonical"' } });
  return new Response(req.method === 'HEAD' ? null : html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, must-revalidate' } });
}
/* rh-redir-1 (14 Nov 2026): old addresses answer 301 (or 410) from /redirects.json, a flat { "/old": "/new" } map written by the site build; read once per 5 minutes */
let RH_REDIR = null, RH_REDIR_AT = 0;
async function redirMap(env, req) {
  if (RH_REDIR && Date.now() - RH_REDIR_AT < 300000) return RH_REDIR;
  try {
    const r = await env.ASSETS.fetch(new Request(new URL('/redirects.json', req.url)));
    if (r.status === 200) { const j = await r.json(); if (j && typeof j === 'object') { RH_REDIR = j; RH_REDIR_AT = Date.now(); } }
    else if (!RH_REDIR) { RH_REDIR = {}; RH_REDIR_AT = Date.now(); }
  } catch (e) { if (!RH_REDIR) { RH_REDIR = {}; RH_REDIR_AT = Date.now(); } }
  return RH_REDIR || {};
}
/* rh-badge-1: { slug: svg } map of the score badges, read once per 5 minutes */
let RH_BADGE = null, RH_BADGE_AT = 0;
async function badgeMap(env, req) {
  if (RH_BADGE && Date.now() - RH_BADGE_AT < 300000) return RH_BADGE;
  try { const r = await env.ASSETS.fetch(new Request(new URL('/badge/score.json', req.url))); if (r.status === 200) { RH_BADGE = await r.json(); RH_BADGE_AT = Date.now(); } } catch (e) { /* keep the old copy */ }
  return RH_BADGE || {};
}
async function pages(req, env, u) {
  if (u.pathname.startsWith('/_pk/')) return new Response(null, { status: 404 });
  /* rh-badge-1 (26 Nov 2026): the score badges /badge/score/<slug>.svg come from one file, /badge/score.json ({ slug: svg }),
     written by the site build (seo/assetsTrust.ts), so the deploy does not need one file per home (Pages 20,000-file limit). */
  { const bm = u.pathname.match(/^\/badge\/score\/([A-Za-z0-9_-]+)\.svg$/); if (bm && (req.method === 'GET' || req.method === 'HEAD')) { const svg = (await badgeMap(env, req))[bm[1]]; if (typeof svg === 'string') return new Response(req.method === 'HEAD' ? null : svg, { status: 200, headers: { 'content-type': 'image/svg+xml; charset=utf-8', 'cache-control': 'public, max-age=3600', 'access-control-allow-origin': '*' } }); const f = await asset(env, req, u.pathname); if (f.status === 200) return f; return new Response(null, { status: 404 }); } }
  if (u.pathname.startsWith('/__pk/')) { const t = await packPage(env, req, u.pathname.slice(5)); if (!t) return new Response('not in the bundles', { status: 404, headers: { 'x-robots-tag': 'noindex' } }); t.headers.set('x-robots-tag', 'noindex'); return t; }
  if ((req.method === 'GET' || req.method === 'HEAD') && !/\.[a-z0-9]{2,5}$/i.test(u.pathname)) {
    const m = await redirMap(env, req);
    const k = u.pathname.length > 1 ? u.pathname.replace(/\/+$/, '') : '/';
    const to = Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null;
    if (to === '410') return new Response('Gone', { status: 410, headers: { 'content-type': 'text/plain; charset=utf-8', 'x-robots-tag': 'noindex' } });
    if (typeof to === 'string' && to.startsWith('/') && to !== k) return new Response(null, { status: 301, headers: { location: to + u.search, 'cache-control': 'public, max-age=3600' } });
  }
  if (u.search) { for (const k of ['p', 'page_id', 'paged', 'cat', 'tag']) { const v = u.searchParams.get(k); if (v && /^[\w-]+$/.test(v)) { const q = await asset(env, req, '/__q/' + k + '=' + v + '/'); if (q.status === 200) return q; } } }
  if (u.pathname === '/finds' || u.pathname === '/finds/') return new Response(null, { status: 301, headers: { location: '/' + u.search } });
  if (u.pathname.length > 1 && u.pathname.endsWith('/')) return new Response(null, { status: 301, headers: { location: '/' + u.pathname.replace(/\/+$/, '').replace(/^[\/\\]+/, '') + u.search } });
  /* rh-seo-1: one spelling for home pages (/DEAL/x, /Es/Deal/x answer 301 to the lower-case prefix) */
  { const m = u.pathname.match(/^\/((?:es\/)?deal)\/(.+)$/i); if (m && m[1] !== m[1].toLowerCase()) return new Response(null, { status: 301, headers: { location: '/' + m[1].toLowerCase() + '/' + m[2] + u.search } }); }
  if (RH_PK_SERVE && (req.method === 'GET' || req.method === 'HEAD')) { const pk = await packPage(env, req, u.pathname); if (pk) return pk; }
  let r = await asset(env, req, u.pathname + u.search);
  if (r.status >= 300 && r.status < 400) {
    const l = new URL(r.headers.get('location') || '', u);
    if (l.pathname === u.pathname + '/') { const d = await asset(env, req, u.pathname + '/' + u.search); if (d.status === 200) r = d; }
  }
  if (r.status >= 300 && r.status < 400) { const l = new URL(r.headers.get('location') || '/', u); const h = new Headers(r.headers); h.set('location', (l.origin === u.origin ? '' : l.origin) + l.pathname + l.search); return new Response(null, { status: r.status, headers: h }); }
  if (r.status === 404 && !/\.[a-z0-9]{2,5}$/i.test(u.pathname)) {
    /* rh-es-1 (10 Nov 2026): Spanish app pages without their own file (/es/saved, /es/alerts...) get the Spanish shell, are judged known or not by the path after /es, and no shell carries the front page's hreflang */
    const isEs = u.pathname === '/es' || u.pathname.startsWith('/es/');
    let s = isEs ? await asset(env, req, '/es/') : null;
    if (!s || s.status !== 200) s = await asset(env, req, '/');
    const h = new Headers(s.headers); h.set('x-robots-tag', 'noindex');
    /* rh-404-1 (10 Nov 2026): a path whose first part is no page of the app answers 404 (still with the app, which shows its own not-found page); before, every unknown address answered 200 */
    const parts = u.pathname.split('/');
    const known = isEs ? (parts.length < 3 || !parts[2] || RH_KNOWN.has(parts[2])) : RH_KNOWN.has(parts[1] || '');
    return new HTMLRewriter()
      .on('link[rel="canonical"]', { element(e) { e.remove(); } })
      .on('link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
      .on('meta[name="robots"]', { element(e) { e.setAttribute('content', 'noindex, follow'); } })
      .on('meta[property="og:url"]', { element(e) { e.setAttribute('content', 'https://realhunt.co' + u.pathname); } })
      .on('#rh-home-static', { element(e) { e.remove(); } })
      .transform(new Response(s.body, { status: known ? 200 : 404, headers: h }));
  }
  if (r.status === 404) return new Response(null, { status: 404 });
  return r;
}
async function full(req, env, u, host) {
  if (host === 'go.realhunt.co') { const p = u.pathname.replace(/\.html$/, '').replace(/\/index$/, '/'); return Response.redirect('https://realhunt.co' + (p || '/') + u.search, 301); }
  if (u.pathname.startsWith('/__sb/')) return sbProxy(req, u);
  if (u.pathname.endsWith('/index.html')) { const ip = '/' + u.pathname.slice(0, -10).replace(/^[\/\\]+/, ''); return new Response(null, { status: 301, headers: { location: ip + u.search } }); }
  if (u.pathname.startsWith('/_s/') || u.pathname === '/_worker.js' || u.pathname.startsWith('/_rhbuild')) return new Response('Not found', { status: 404 });
  if (u.pathname === '/api/geo') { const c = req.cf || {}; return Response.json({ country: c.country || null, city: c.city || null, lat: c.latitude ? +c.latitude : null, lon: c.longitude ? +c.longitude : null }); }
  if (u.pathname === '/__k/kcheck.js') return new Response(KCHECK, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=600' } });
  if (req.method === 'GET' && (u.pathname === '/data/rh-static.json' || u.pathname === '/data/rh-static-es.json')) { /* rh-lite-1 (9 Nov 2026): the snapshot without Spanish texts (about a quarter lighter) and the Spanish texts on their own, both from the fresh data project; falls back to the full snapshot, then to the published copy */ for (const f of (u.pathname === '/data/rh-static.json' ? ['/data/rh-static-lite.json', '/data/rh-static.json'] : ['/data/rh-static-es.json'])) { try { const t = await fetch(TOP + f, { cf: { cacheEverything: true, cacheTtl: 60 } }); if (t.status === 200 && /json/i.test(t.headers.get('content-type') || '')) { const h = new Headers(t.headers); h.set('cache-control', 'public, max-age=60'); h.delete('age'); return new Response(t.body, { status: 200, headers: h }); } } catch (e) {} } }
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response(null, { status: 204 });
  if (u.pathname.startsWith('/assets/')) {
    const a = await asset(env, req, u.pathname);
    if (a.status === 200 || a.status === 304) return a;
    const w = await fetch(WL + u.pathname, { cf: { cacheEverything: true, cacheTtl: 86400 } });
    if (w.status === 200) { const h = new Headers(w.headers); h.set('cache-control', 'public, max-age=31536000, immutable'); return new Response(w.body, { status: 200, headers: h }); }
    return new Response(null, { status: 404 });
  }
  if (/^\/(?:(?:finds|top|og|images)\/.+|og-[\w-]+|icon-[\w-]+)\.(?:webp|jpe?g|png)$/i.test(u.pathname)) {
    const m = await asset(env, req, u.pathname);
    if (isImg(m)) { const h = new Headers(m.headers); h.set('cache-control', u.pathname.startsWith('/finds/') ? 'public, max-age=2592000' : 'public, max-age=86400'); return new Response(m.body, { status: 200, headers: h }); }
    const t = await topImage(u); if (t) return t;
  }
  return pages(req, env, u);
}
const INJECT_HEAD = "<script>/*rh-img-fb*/(function(){var M='https://realhunt-media.pages.dev/';document.addEventListener('error',function(e){var t=e.target;if(!t||t.tagName!=='IMG'||t.__rhfb)return;var s=t.currentSrc||t.getAttribute('src')||'';if(s.indexOf(M)!==0)return;t.__rhfb=1;e.stopImmediatePropagation();if(t.srcset)t.removeAttribute('srcset');t.src='https://realhunt.co/'+s.slice(M.length);},true);})();</script>";
export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    const host = u.hostname.replace(/^www\./, '');
    const isFull = host === 'realhunt.co' || host === 'go.realhunt.co' || req.headers.get('x-rh-full') === '1' || /(?:^|;\s*)rhfull=1/.test(req.headers.get('cookie') || '');
    if (isFull) {
      const r = await full(req, env, u, host);
      if (req.method === 'GET' && /text\/html/.test(r.headers.get('content-type') || '')) { const rr = new HTMLRewriter().on('head', { element(e) { e.prepend(INJECT_HEAD, { html: true }); } }).on('body', { element(e) { e.append('<script src="/__k/kcheck.js?v=6" defer></script>', { html: true }); } }).transform(r); /* rh-sec-1 (9 Nov 2026): pages cannot be framed by other sites (clickjacking), no plugins, no <base> hijack */ const hh = new Headers(rr.headers); /* rh-embed-1 (14 Nov 2026): the embeddable home widgets (/embed/homes/<country>, /embed/casas/<pais>) are made to be framed by other sites; every other page still cannot be */ /* rh-embed-2 (15 Nov 2026): also the calculators under /embed/calculator/ */ if (/^\/embed\/(homes|casas|calculator)\//.test(new URL(req.url).pathname)) { hh.delete('x-frame-options'); hh.set('content-security-policy', "frame-ancestors *; base-uri 'self'; object-src 'none'"); } else { hh.set('x-frame-options', 'SAMEORIGIN'); hh.set('content-security-policy', "frame-ancestors 'self'; base-uri 'self'; object-src 'none'"); } hh.set('permissions-policy', 'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), interest-cohort=()'); /* rh-seo-1 (20 Nov 2026): early connection to the photo host (Cloudflare also sends it as an Early Hint) */ hh.append('link', '<https://realhunt-media.pages.dev>; rel=preconnect'); /* rh-seo-4 (20 Nov 2026): the ETag/304 step of rh-seo-1..3 was removed: Cloudflare Pages drops the ETag header from this worker's answers (strong or weak), so it only delayed the page */  return new Response(rr.body, { status: rr.status, statusText: rr.statusText, headers: hh }); }
      return r;
    }
    if (u.pathname === '/_worker.js' || u.pathname.startsWith('/_rhbuild')) return new Response('Not found', { status: 404 });
    const r = await env.ASSETS.fetch(req);
    if (r.status === 404 && RH_PK_RE.test(u.pathname)) { const pk = await packPage(env, req, u.pathname); if (pk) return pk; }
    /* rh-img-304 (21 Nov 2026): a 304 for a photo the browser already has is the answer, not a miss (it fell through to realhunt-top and became a 404) */
    if (!IMG.test(u.pathname) || isImg(r) || r.status === 304) return r;
    const t = await topImage(u); if (t) return t;
    return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain' } });
  }
};
