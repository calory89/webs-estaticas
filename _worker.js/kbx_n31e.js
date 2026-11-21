// kolaboro.com batch 31 (agent n31e, 18 Nov 2026): buyer tools, items 156 to 180 of the 300 list. No model calls, nothing stored about
// visitors, no database writes. Facts only, each with its source and the date it was read. Pages in 8 languages (Arabic RTL).
//   GET /k/n31e.js?v=<V>                        client script of the pages below (loaded only on them)
//   GET /[<lang>/]tools/find-listing/           156: paste a portal or developer link: the project in our records (hashed in the browser,
//                                               same 4-character k-anonymity range query as the X-ray extension, /api/x/j/xr)
//   GET /[<lang>/]tools/handover-history/       172: every handover date on record for one project, with the day each was read
//   GET /api/v1/find?q=<name>                   project name search (named projects only), up to 8 results
//   GET /api/v1/handover-history/<slug>         the dated handover record of one project (JSON, CC BY 4.0)
//   GET /[<lang>/]tools/visa-by-investment/     162: residence or citizenship through a property purchase, official rules, tracked projects
//                                               whose published entry price reaches the threshold (ECB reference rates of the day)
//   GET /[<lang>/]tools/compare-countries/      163: buying rules side by side (?c=AE,ES,PT,TH), each cell linked to its official source
//   GET /[<lang>/]tools/on-time/                164: will my building be on time? the market's handover record (historical statistic)
//   GET /[<lang>/]tools/request-documents/      169: email to the developer asking for the documents, in 8 languages (the buyer sends it)
//   GET /[<lang>/]tools/inheritance/            180: inheritance and estate tax for foreign owners, official sources only
//   GET /[<lang>/]tools/foreign-mortgages/      176: what banks publish about mortgages for foreign buyers, by country, sourced
//   GET /[<lang>/]tools/area-report/            175: printable market report for agents, with their own name and logo (logo stays on device)
//   GET /[<lang>/]tools/translate/              177: translate a developer document in the browser (Chrome built-in translator, on device)
//   GET /[<lang>/]tools/receipt-check/          160: check a payment receipt or transfer: IBAN, beneficiary, Dubai escrow rule
//   GET /[<lang>/]tools/payment-vs-progress/    171: payment plan against construction progress, with the market's delay record
//   GET /[<lang>/]satellite/monthly/            178: construction sites from space, monthly Sentinel-2 images in a loop, on a map
//   GET /[<lang>/]watch/new-websites/           168: developer websites registered recently (RDAP), against the founding year claimed
//   GET /api/v1/new-websites[.json]             the same list as JSON Feed 1.1 (follow it in any feed reader: the alert)
//   GET /[<lang>/]app/                          166: install Kolaboro on a phone or computer
// Parts used by other modules: crBlock() (contract reader country list, kbx_n30a.js), mcpFind() and mcpCert() (MCP tools, kbx_e.js).
// Sumba projects never appear (kbx_named.js data() leaves them out), nor Eco Beach City or Equinox.
// Strings and sourced facts in 8 languages live in /data/n31e-i18n.json (static asset, read once per isolate) to keep the worker under the Pages size limit.
let S = { en: {} }, VISA = [], INH = [], MORT = [], CRC = { countries: [] }, LD31 = null;
async function L31(env) {
  if (LD31) return LD31;
  LD31 = (async () => {
    let d = null;
    try { if (env && env.ASSETS) { const r = await env.ASSETS.fetch(new Request('https://kolaboro.com/_s/kolaboro.com/data/n31e-i18n.json')); if (r.ok) d = await r.json(); } } catch (e) {}
    if (!d) { try { const r = await fetch('https://kolaboro.com/data/n31e-i18n.json', { cf: { cacheTtl: 300 } }); if (r.ok) d = await r.json(); } catch (e) {} }
    if (!d || !d.S) { LD31 = null; throw new Error('n31e strings unavailable'); }
    ({ S, VISA, INH, MORT, CRC } = d); return d;
  })();
  return LD31;
}

export const N31V = 'e1';
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const COI_RX = /eco\s*beach\s*city|\bequinox\b/i;
const pre = l => l === 'en' ? '' : '/' + l;
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bdi = s => '<bdi>' + esc(s) + '</bdi>';
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const t31 = (lang, k, v) => { let s = (S[lang] && S[lang][k] != null) ? S[lang][k] : S.en[k]; if (s == null) s = k; if (typeof s === 'string' && v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b); return s; };
const nf = (n, lang, o) => { try { return Number(n).toLocaleString(LOC[lang] || 'en-GB', o || { maximumFractionDigits: 1 }); } catch (e) { return String(n); } };
const fdate = (d, lang) => { try { return new Intl.DateTimeFormat(LOC[lang] || 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(String(d).slice(0, 10) + 'T12:00:00Z')); } catch (e) { return String(d); } };
const country = (cc, lang) => { try { return new Intl.DisplayNames([LOC[lang] || 'en'], { type: 'region' }).of(cc); } catch (e) { return cc; } };
const CC = { UAE: 'AE', Indonesia: 'ID', Thailand: 'TH', Spain: 'ES', USA: 'US', Mexico: 'MX', Malaysia: 'MY', France: 'FR', Turkey: 'TR', Portugal: 'PT', Australia: 'AU', Vietnam: 'VN', Philippines: 'PH', Japan: 'JP', 'United Kingdom': 'GB', Poland: 'PL', Brazil: 'BR', Egypt: 'EG', 'Sri Lanka': 'LK', Greece: 'GR', Cyprus: 'CY', Oman: 'OM', Georgia: 'GE', Cambodia: 'KH', Canada: 'CA', 'Dominican Republic': 'DO', Tanzania: 'TZ', Morocco: 'MA', Mauritius: 'MU', Kenya: 'KE', 'Costa Rica': 'CR', Colombia: 'CO', Montenegro: 'ME', 'Saudi Arabia': 'SA', Panama: 'PA', India: 'IN', Malta: 'MT', Germany: 'DE', Croatia: 'HR', Bahrain: 'BH', Qatar: 'QA', Italy: 'IT', Albania: 'AL', Bulgaria: 'BG' };
const JT = 'application/json; charset=utf-8';
const jr = (o, st, cc) => new Response(JSON.stringify(o, null, st === 200 || !st ? 1 : 0), { status: st || 200, headers: { 'content-type': JT, 'cache-control': cc || 'public, max-age=600', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' } });
const srcA = s => s ? '<a class="n31src" href="' + esc(s.u) + '" rel="noopener" target="_blank">' + esc(s.n) + '</a>' : '';
const readOn = (lang, d) => d ? ' <small class="n31m">' + esc(t31(lang, 'read_on', { d: fdate(d, lang) })) + '</small>' : '';
const nameOf = x => String(x.n || x.id);
const clean = x => !COI_RX.test(String(x.n || '') + ' ' + String(x.dv || ''));
const ym = (k, lang) => { try { return new Intl.DateTimeFormat(LOC[lang] || 'en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(k + '-15T12:00:00Z')); } catch (e) { return k; } };
const kindOf = st => st === 'completed' ? 'done' : st === 'under construction' ? 'uc' : 'op';

// ------------------------------------------------------------------------------------------------ ECB reference rates (per USD)
let ECBR = null;
async function perUsd() {
  if (ECBR && Date.now() - ECBR.t < 43200000) return ECBR.v;
  try {
    const r = await fetch('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml', { cf: { cacheTtl: 21600, cacheEverything: true }, headers: { 'user-agent': 'kolaboro.com tools (+https://kolaboro.com/tools/)' } });
    const t = await r.text(), eu = { EUR: 1 }; for (const m of t.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([\d.]+)['"]/g)) eu[m[1]] = +m[2];
    if (!eu.USD) throw 0;
    const v = { d: (/time=['"](\d{4}-\d\d-\d\d)/.exec(t) || [])[1] || null, r: {} };
    for (const [c, x] of Object.entries(eu)) v.r[c] = x / eu.USD;
    v.r.USD = 1; v.r.AED = 3.6725;   // fixed peg, Central Bank of the UAE
    ECBR = { t: Date.now(), v }; return v;
  } catch (e) { ECBR = { t: Date.now() - 43200000 + 600000, v: null }; return null; }
}
const toUsd = (fx, amt, cur) => fx && fx.r[cur] ? amt / fx.r[cur] : null;

// ------------------------------------------------------------------------------------------------ page frame
const CSS = '<style id="n31-css">.n31w{max-width:980px}.n31w h2{margin-top:28px}.n31p{max-width:72ch}.n31m{color:var(--muted,#59626B);font-size:.88rem}.n31src{overflow-wrap:anywhere}' +
  '.n31f{display:grid;gap:10px;margin:16px 0;max-width:720px}.n31f label{font-weight:600}.n31f input,.n31f select,.n31f textarea{width:100%;box-sizing:border-box;min-height:48px;border:1.5px solid var(--line,#d5d3cc);border-radius:12px;padding:10px 12px;font:inherit;background:var(--paper,#fff);color:inherit}.n31f textarea{min-height:120px}' +
  '.n31row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.n31row .k-btn{min-height:48px}.n31b{min-height:44px;padding:8px 14px;border:1.5px solid var(--ink,#17212B);border-radius:999px;background:var(--card,#fff);color:inherit;font:inherit;font-weight:600;cursor:pointer}.n31b[aria-pressed=true]{background:var(--ink,#17212B);color:var(--paper,#fff)}' +
  '.n31c{border:1px solid var(--line,#d5d3cc);border-radius:14px;background:var(--card,#fff);padding:14px 16px;margin:12px 0}.n31c h3{margin:0 0 6px;font-size:1.08rem}.n31c p{margin:6px 0}.n31c.is-no{border-inline-start:4px solid var(--hivis,#FF5B14)}.n31c.is-ok{border-inline-start:4px solid var(--k-sea,#155C75)}.n31c.is-mid{border-inline-start:4px solid #C9A227}' +
  '.n31q{margin:8px 0;padding:6px 12px;border-inline-start:3px solid var(--line,#d5d3cc);font-size:.94rem;overflow-wrap:anywhere}.n31s{font-weight:600;min-height:1.4em}' +
  '.n31t{overflow-x:auto;border:1px solid var(--line,#d5d3cc);border-radius:14px;background:var(--card,#fff);margin:12px 0}.n31t table{width:100%;border-collapse:collapse}.n31t th,.n31t td{padding:10px 12px;text-align:start;vertical-align:top;border-bottom:1px solid var(--line,#d5d3cc);font-variant-numeric:tabular-nums}.n31t th{font-size:.86rem;color:var(--muted,#59626B)}.n31t td small{display:block;color:var(--muted,#59626B)}' +
  '@media(max-width:640px){.n31t.n31stack{border:0;background:none}.n31stack thead{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}.n31stack tr,.n31stack td,.n31stack th[scope=row]{display:block}.n31stack tr{border:1px solid var(--line,#d5d3cc);border-radius:12px;margin:0 0 8px;padding:8px 12px;background:var(--card,#fff)}.n31stack td,.n31stack th[scope=row]{border:0;padding:3px 0}.n31stack td[data-l]::before{content:attr(data-l) ": ";color:var(--muted,#59626B);font-size:.84rem}}' +
  '.n31rel{display:flex;flex-wrap:wrap;gap:8px 18px;padding:0;list-style:none}.n31rel a{display:inline-flex;min-height:44px;align-items:center}.k-vh{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}</style>';
const REL = ['find-listing', 'handover-history', 'on-time', 'request-documents', 'receipt-check', 'payment-vs-progress', 'visa-by-investment', 'compare-countries', 'inheritance', 'foreign-mortgages', 'area-report', 'translate'];
const relList = (lang, me) => '<h2>' + esc(t31(lang, 'rel_h')) + '</h2><ul class="n31rel">' + REL.filter(k => k !== me).map(k => '<li><a href="' + pre(lang) + '/tools/' + k + '/">' + esc(t31(lang, k + '_h1')) + '</a></li>').join('') +
  '<li><a href="' + pre(lang) + '/tools/contract-reader/">' + esc(t31(lang, 'cr_link')) + '</a></li><li><a href="' + pre(lang) + '/satellite/monthly/">' + esc(t31(lang, 'sm_h1')) + '</a></li><li><a href="' + pre(lang) + '/watch/new-websites/">' + esc(t31(lang, 'nw_h1')) + '</a></li><li><a href="/tools/">' + esc(t31(lang, 'all_tools')) + '</a></li></ul>';
const script = '<script src="/k/n31e.js?v=' + N31V + '" defer></script>';
function frame(lang, path, key, inner, o) {
  o = o || {};
  const P = pre(lang), crumb = '<p class="crumb"><a href="' + P + '/">Kolaboro</a> / ' + (o.crumb || '<a href="/tools/">' + esc(t31(lang, 'bc_tools')) + '</a>') + '</p>';
  return '<section class="phero kp"><div class="wrap">' + crumb + '<h1>' + esc(t31(lang, key + '_h1')) + '</h1><p class="lead n31p">' + esc(t31(lang, key + '_lead')) + '</p>' + (o.priv ? '<p class="n31p"><b>' + esc(o.priv) + '</b></p>' : '') + '</div></section>' +
    '<div class="wrap kwrap n31w" id="n31" data-k="' + key + '" data-m="' + esc(JSON.stringify(o.m || {})) + '">' + inner + (o.norel ? '' : relList(lang, o.me)) + '</div>' + CSS + (o.noscript ? '' : script);
}
async function page(lang, shell, key, path, body, o) {
  o = o || {};
  const N = await import('./kbx_named.js');
  const canon = ORIGIN + pre(lang) + path, name = t31(lang, key + '_h1');
  const ld = { '@context': 'https://schema.org', '@graph': [Object.assign({ '@type': o.type || 'WebApplication', name, description: t31(lang, key + '_d'), url: canon, inLanguage: lang, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
    (o.type || 'WebApplication') === 'WebApplication' ? { applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (runs in the browser)', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } } : {}, o.ldx || {}),
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + pre(lang) + '/' }, { '@type': 'ListItem', position: 2, name: o.bcName || t31(lang, 'bc_tools'), item: ORIGIN + (o.bcPath || '/tools/') }, { '@type': 'ListItem', position: 3, name, item: canon }] }] };
  const pg = { title: t31(lang, key + '_t') + ' | Kolaboro', desc: t31(lang, key + '_d'), canon, body, alt: l => ORIGIN + pre(l) + path, lastmod: o.lastmod || '2026-11-18', ld, noindex: !!o.noindex };
  const sh = await shell(pre(lang) + '/how-we-score/'); if (!sh || sh.status !== 200) return null;
  const html = await N.assemble(pg, lang, sh);
  return new Response(html, { status: 200, headers: Object.assign({ 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600' }, o.noindex ? { 'x-robots-tag': 'noindex, follow' } : {}) });
}

// ------------------------------------------------------------------------------------------------ data helpers
const norm = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9Ѐ-ӿ؀-ۿ一-鿿]+/g, ' ').trim();
let FIX = null;
async function findIndex(ix) {
  if (FIX && FIX.ix === ix) return FIX;
  const L = ix.P.filter(clean).map(x => ({ x, n: norm(x.n), d: norm(x.dv), a: norm([x.ar, x.mk, x.co].filter(Boolean).join(' ')) }));
  FIX = { ix, L }; return FIX;
}
// n34c (batch 34, item 30): multilingual queries. Place names in 8 languages map to the market name we store, words without search
// meaning in each language are dropped ("proyectos de X en Dubái" = "X Dubai"), and the exact-name bonus ignores those words too.
// Fixed test set and scores: /open/search-tests.json, /engineering/search-quality/ (run by /open/search-quality.mjs before each push).
let SAL = null;
async function aliases(env) {
  if (SAL) return SAL;
  let d = null; try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/search-aliases.json')); if (r.ok) d = await r.json(); } catch (e) {}
  const al = [], stop = new Set();
  if (d) { for (const [m, L] of Object.entries(d.markets || {})) for (const v of Object.values(L)) { const a = norm(v); if (a && a !== norm(m)) al.push([' ' + a + ' ', ' ' + norm(m) + ' ']); }
    for (const L of Object.values(d.stop || {})) for (const w of L) stop.add(norm(w)); }
  al.sort((a, b) => b[0].length - a[0].length); SAL = { al, stop, zh: [...stop].filter(w => /[一-鿿]/.test(w)) }; return SAL;
}
export async function findProjects(env, q, lim) {
  const N = await import('./kbx_named.js'), [ix, A] = await Promise.all([N.data(env), aliases(env)]), F = await findIndex(ix);
  let s = ' ' + norm(q) + ' '; for (const [a, m] of A.al) if (s.includes(a)) s = s.split(a).join(m);
  for (const z of A.zh) s = s.split(z).join(' ');
  const w = s.split(' ').filter(t => t.length >= 2 || /[一-鿿]/.test(t)).filter(t => !A.stop.has(t)).slice(0, 8);
  if (!w.length) return { ix, N, hits: [] };
  const hits = [], key = w.join(' '), nk = r => r.nk || (r.nk = r.n.split(' ').filter(t => !A.stop.has(t)).join(' '));
  for (const r of F.L) {
    let sc = 0, all = true, inName = 0;
    for (const t of w) { if (r.n.includes(t)) { sc += (r.n.split(' ').includes(t) ? 3 : 2); inName++; } else if (r.d.includes(t)) sc += 1; else if (r.a.includes(t)) sc += 0.5; else { all = false; break; } }
    if (!all) continue;
    const k = nk(r), nameWords = w.filter(t => r.n.includes(t)).join(' ');
    if (r.n === key || k === key) sc += 10; else if (k && nameWords === k) sc += 8; else if (r.n.startsWith(key) || (k && k.startsWith(key))) sc += 4;
    hits.push([sc, r.x]);
  }
  hits.sort((a, b) => b[0] - a[0] || nameOf(a[1]).localeCompare(nameOf(b[1])));
  return { ix, N, hits: hits.slice(0, lim || 8).map(h => h[1]) };
}
function brief(ix, N, x, lang) {
  const c = ix.caseBy.get(x.id) || {}, h = N.handoverOf(ix, x);
  return { id: x.id, slug: x.s, name: nameOf(x), developer: x.dv || null, market: x.mk || null, area: x.ar && x.ar !== x.mk ? x.ar : null, country: x.co || null, stage: c.stage || x.st || null,
    handover: h ? String(h.d) : null, last_checked: N.lastmod(ix, x) || null, url: ORIGIN + pre(lang || 'en') + '/projects/' + x.s + '/' };
}
export function handoverRecord(ix, N, x, H) {
  H = H || { hkey: d => String(d) };
  const fx = x.fx || {}, pr = (ix.prom[x.id] || []).find(p => p && p.k === 'handover'), ev = [];
  if (fx.original_handover) ev.push({ date: String(fx.original_handover).replace(/\s*\(.*$/, ''), kind: 'original', note: String(fx.original_handover), source: 'research', seen: null });
  for (const e of ((pr && pr.hist) || [])) if (e && e.d) ev.push({ date: String(e.d), kind: e.src === 'page' ? 'developer_page' : (e.src || 'record'), seen: e.seen || null, last_seen: e.last || null, source: e.src || null });
  const hk = d => { try { return H.hkey(d) || String(d); } catch (e) { return String(d); } };
  if (fx.handover_promised && !ev.some(e => hk(e.date) === hk(fx.handover_promised))) ev.push({ date: String(fx.handover_promised), kind: 'record', seen: null, source: 'research' });
  ev.sort((a, b) => String(a.seen || '0000').localeCompare(String(b.seen || '0000')) || String(a.date).localeCompare(String(b.date)));
  const h = N.handoverOf(ix, x), distinct = [...new Set(ev.map(e => hk(e.date)))];
  const c = ix.caseBy.get(x.id) || {};
  return { id: x.id, slug: x.s, name: nameOf(x), developer: x.dv || null, market: x.mk || null, stage: c.stage || x.st || null, current: h ? String(h.d) : null, moves: pr ? (pr.mv || 0) : 0,
    delay_months: fx.delay_months != null ? fx.delay_months : null, distinct_dates: distinct.length, events: ev, developer_page: N.okHttp(x.url) ? x.url : null,
    page: ORIGIN + '/projects/' + x.s + '/', timeline: ORIGIN + '/projects/' + x.s + '/timeline/', licence: 'CC BY 4.0, credit Kolaboro (kolaboro.com)',
    note: 'Dates as published by the developer or read by our research on the day shown (seen). A date that was never read again keeps its first day. No forecast.' };
}

// ------------------------------------------------------------------------------------------------ 156 / 172: find a listing, handover history
function findPage(lang, key) {
  const w = (k, v) => t31(lang, k, v);
  const M = { k: key, ph: w('fl_ph'), go: w('fl_go'), wait: w('fl_wait'), none: w('fl_none'), err: w('fl_err'), how: { u: w('how_u'), d: w('how_d'), n: w('how_n'), nn: w('how_nn'), g: w('how_g'), v: w('how_v'), q: w('how_q') },
    th: w('hh_th'), kinds: w('hh_kinds'), cur: w('hh_cur'), moves: w('hh_moves'), open: w('fl_open'), tl: w('fl_tl'), hist: w('fl_hist'), dev: w('fl_dev'), st: w('stage'), ho: w('fl_ho'), ck: w('fl_ck'), more: w('fl_more'), first: w('hh_first') };
  const inner = '<form class="n31f" id="n31-fl" role="search"><label for="n31-q">' + esc(w(key === 'find-listing' ? 'fl_lab' : 'hh_lab')) + '</label><input id="n31-q" name="q" type="text" inputmode="url" autocomplete="off" spellcheck="false" placeholder="' + esc(w('fl_ph')) + '" maxlength="600">' +
    '<div class="n31row"><button class="k-btn" type="submit">' + esc(w('fl_go')) + '</button></div></form><p id="n31-s" class="n31s" role="status" aria-live="polite"></p><div id="n31-o"></div>' +
    '<h2>' + esc(w('fl_how_h')) + '</h2><ul class="n31p">' + w('fl_how').map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>' +
    '<p class="n31m">' + esc(w('fl_api')) + ' <a href="/api/v1/find?q=marina">/api/v1/find?q=</a> · <a href="/api/v1/handover-history/unsere-flora-berlin">/api/v1/handover-history/&lt;slug&gt;</a> · <a href="' + '/extension/">' + esc(w('fl_ext')) + '</a></p>';
  return frame(lang, '/tools/' + key + '/', key, inner, { m: M, me: key, priv: w(key === 'find-listing' ? 'fl_priv' : 'hh_priv') });
}

// ------------------------------------------------------------------------------------------------ 162: visa by investment
async function visaData(env) {
  const N = await import('./kbx_named.js'), ix = await N.data(env), fx = await perUsd();
  const rows = VISA.map(v => {
    const o = { k: v.k, cc: v.cc, st: v.st, min: v.min || null, cur: v.cur || null, off: v.off == null ? null : v.off, src: v.src, q: v.q, projects: [], tracked: 0, priced: 0 };
    const L = ix.P.filter(x => clean(x) && CC[x.co] === v.cc); o.tracked = L.length;
    if (v.st === 'open' && v.min && fx) {
      const minUsd = toUsd(fx, v.min, v.cur);
      for (const x of L) { const f = x.fx || {}, p = +f.price_min, u = p > 0 && f.currency ? toUsd(fx, p, f.currency) : null; if (u == null) continue; o.priced++; if (u >= minUsd * 0.999) o.projects.push({ s: x.s, n: nameOf(x), mk: x.mk, p, cur: f.currency, stage: (ix.caseBy.get(x.id) || {}).stage || x.st }); }
      o.projects.sort((a, b) => a.n.localeCompare(b.n)); o.min_usd = Math.round(minUsd);
    }
    return o;
  });
  return { rows, fx: fx ? fx.d : null, N, ix };
}
async function visaPage(env, lang) {
  const { rows, fx } = await visaData(env), w = (k, v) => t31(lang, k, v), P = pre(lang);
  const card = r => {
    const cls = r.st === 'open' ? 'is-ok' : r.st === 'closed' ? 'is-no' : 'is-mid';
    let h = '<section class="n31c ' + cls + '" id="v-' + r.k + '" data-min-usd="' + (r.min_usd || '') + '"><h3>' + esc(country(r.cc, lang)) + ': ' + esc(w('vs_' + r.st)) + '</h3><p>' + esc((VISA.find(v => v.k === r.k).t[lang]) || VISA.find(v => v.k === r.k).t.en) + '</p>' +
      '<p class="n31q" lang="' + (r.src.ql || 'en') + '" dir="ltr">“' + esc(r.q) + '”</p><p>' + esc(w('source')) + ': ' + srcA(r.src) + readOn(lang, r.src.d) + '</p>';
    if (r.st === 'open') {
      h += '<p><b>' + esc(w('v_proj', { k: nf(r.projects.length, lang), n: nf(r.priced, lang), t: nf(r.tracked, lang) })) + '</b></p>';
      if (r.projects.length) h += '<details><summary>' + esc(w('v_list')) + '</summary><ul class="n31vl">' + r.projects.map(p => '<li data-usd><a href="' + P + '/projects/' + p.s + '/">' + bdi(p.n) + '</a> <small class="n31m">' + esc(w('from')) + ' ' + esc(nf(p.p, lang, { maximumFractionDigits: 0 })) + ' ' + esc(p.cur) + '</small></li>').join('') + '</ul></details>';
    }
    return h + '</section>';
  };
  const inner = '<form class="n31f" id="n31-vb"><label for="n31-b">' + esc(w('v_budget')) + '</label><div class="n31row"><input id="n31-b" type="number" min="0" step="1000" inputmode="numeric" style="max-width:220px"><select id="n31-bc" aria-label="' + esc(w('currency')) + '" style="max-width:120px">' + ['USD', 'EUR', 'GBP', 'AED', 'TRY'].map(c => '<option>' + c + '</option>').join('') + '</select><button class="k-btn" type="submit">' + esc(w('v_go')) + '</button></div></form><p id="n31-s" class="n31s" role="status" aria-live="polite"></p>' +
    rows.map(card).join('') + '<p class="n31m">' + esc(w('v_note', { d: fx ? fdate(fx, lang) : '?' })) + '</p><p class="n31m">' + esc(w('not_advice')) + '</p>';
  const M = { fx: (await perUsd()) ? (await perUsd()).r : null, msg: { ok: w('v_ok'), no: w('v_no') } };
  return frame(lang, '/tools/visa-by-investment/', 'visa-by-investment', inner, { m: M, me: 'visa-by-investment' });
}

// ------------------------------------------------------------------------------------------------ 163: compare countries
const GUIDE = { ID: 'bali', AE: 'dubai', TH: 'phuket', ES: 'costa-del-sol', PT: 'lisbon', CY: 'cyprus', US: 'miami', MX: 'tulum', FR: 'france', MY: 'malaysia', TR: 'turkey', AU: 'australia', JP: 'japan', GB: 'united-kingdom', PL: 'poland', CA: 'canada' };
const TCP = { AE: 'dubai', ES: 'costa-del-sol', PT: 'portugal', TH: 'thailand', ID: 'indonesia', GB: 'england', TR: 'turkey' };
async function compareData(env) {
  const N = await import('./kbx_named.js'), ix = await N.data(env), A = await import('./kbx_n30a.js'), S0 = A.slipStats(ix, N.handoverOf);
  const B = await import('./kbx_buy.js');
  let rd = null; try { rd = await (await import('./kbx_rules.js')).rulesData(env); } catch (e) {}
  const per = {};
  for (const cc of Object.keys(GUIDE)) per[cc] = { k: 0, pn: 0, esc: 0, late: [], past: 0, due: 0 };
  for (const x of ix.P) {
    const cc = CC[x.co]; if (!per[cc] || !clean(x)) continue; const c = ix.caseBy.get(x.id) || {}, o = per[cc];
    o.k++; if ((c.checks || {}).permit === 2) o.pn++; if ((c.checks || {}).escrow === true) o.esc++;
    const s = S0.per.get(x.id); if (s) { o.late.push(s.m); }
  }
  const med = a => { if (!a.length) return null; const s = a.slice().sort((p, q) => p - q), h = (s.length - 1) / 2; return Math.round((s[Math.floor(h)] + s[Math.ceil(h)]) / 2 * 10) / 10; };
  for (const o of Object.values(per)) { o.med = o.late.length >= 5 ? med(o.late) : null; o.nlate = o.late.length; delete o.late; }
  const rulesN = {}; if (rd && rd.rules) for (const r of Object.values(rd.rules)) { const cc = r.co; rulesN[cc] = (rulesN[cc] || 0) + 1; }
  let P29 = null; try { P29 = await import('./kbx_p29.js'); } catch (e) {}
  return { P29, per, PLAN: B.PLAN, SRC: B.SRC, NT: (await import('./kbx_buy_notes.js')).NT, rulesN, day: S0.day };
}
const firstSentence = s => { const m = String(s || '').match(/^(.{20,420}?[.。!?؟])(\s|$)/); return m ? m[1] : String(s || ''); };
async function comparePage(env, lang, u) {
  const D = await compareData(env), w = (k, v) => t31(lang, k, v), P = pre(lang);
  const all = Object.keys(GUIDE).filter(cc => D.per[cc].k > 0);
  const raw = u.searchParams.getAll('cc').length ? u.searchParams.getAll('cc') : String(u.searchParams.get('c') || '').split(',');
  let pick = raw.map(c => String(c).toUpperCase().trim()).filter(c => all.includes(c));
  pick = [...new Set(pick)].slice(0, 4); if (pick.length < 2) pick = ['AE', 'ES', 'PT', 'TH'];
  const OWN = { ID: 'n_id_pakai', TH: 'n_th_quota', MX: 'n_mx_trust', AU: 'n_au_firb', CA: 'n_ca_ban', TR: 'n_tr_30' };
  const byKey = (cc, nk) => { const pl = D.PLAN[GUIDE[cc]] || {}; for (const st of Object.values(pl)) for (const [k, srcs] of st) if (k === nk) return srcs; return null; };
  const mk = (nk, srcs) => { const tx = D.NT[nk] && (D.NT[nk][lang] || D.NT[nk].en); return tx ? { tx: firstSentence(tx), s: D.SRC[srcs[0]] } : null; };
  const note = (cc, step) => { if (step === 'land' && cc === 'AE' && D.P29) return { tx: D.P29.AE_L7[lang] || D.P29.AE_L7.en, s: Object.assign({}, D.P29.LAW.ae_l7, { d: D.P29.LAW.ae_l7.d }) }; if (step === 'land' && OWN[cc]) { const sr = byKey(cc, OWN[cc]); if (sr) return mk(OWN[cc], sr); } const pl = D.PLAN[GUIDE[cc]], st = pl && pl[step]; if (!st || !st.length) return null; return mk(st[0][0], st[0][1]); };
  const cell = (cc, html) => '<td data-l="' + esc(country(cc, lang)) + '">' + html + '</td>';
  const lnk = (s) => s ? ' <small><a href="' + esc(/^\//.test(s.u) ? P + s.u : s.u) + '"' + (/^\//.test(s.u) ? '' : ' rel="noopener" target="_blank"') + '>' + esc(s.n) + '</a>' + (s.d ? ' · ' + esc(t31(lang, 'read_on', { d: fdate(s.d, lang) })) : '') + '</small>' : '';
  const R = [];
  R.push([w('cc_r_k'), cc => '<b>' + nf(D.per[cc].k, lang) + '</b><small><a href="' + P + '/countries/' + ({ AE: 'uae', US: 'usa' }[cc] || String(country(cc, 'en')).toLowerCase().replace(/[^a-z]+/g, '-')) + '/">' + esc(w('cc_open')) + '</a></small>']);
  R.push([w('cc_r_own'), cc => { const n = note(cc, 'land'); return n ? esc(n.tx) + lnk(n.s) : '<span class="n31m">' + esc(w('cc_none')) + '</span>'; }]);
  R.push([w('cc_r_money'), cc => { const n = note(cc, 'money'); return n ? esc(n.tx) + lnk(n.s) : '<span class="n31m">' + esc(w('cc_none')) + '</span>'; }]);
  R.push([w('cc_r_pn'), cc => { const o = D.per[cc]; return '<b>' + nf(Math.round(o.pn / o.k * 100), lang) + ' %</b><small>' + esc(w('cc_of', { a: nf(o.pn, lang), b: nf(o.k, lang) })) + '</small>'; }]);
  R.push([w('cc_r_esc'), cc => { const o = D.per[cc]; return '<b>' + nf(Math.round(o.esc / o.k * 100), lang) + ' %</b><small>' + esc(w('cc_of', { a: nf(o.esc, lang), b: nf(o.k, lang) })) + '</small>'; }]);
  R.push([w('cc_r_late'), cc => { const o = D.per[cc]; return o.med != null ? '<b>' + esc(w('cc_med', { m: nf(o.med, lang) })) + '</b><small>' + esc(w('cc_n', { n: nf(o.nlate, lang) })) + ' · <a href="' + P + '/methods/handover-slippage/">' + esc(w('method')) + '</a></small>' : '<span class="n31m">' + esc(w('cc_few', { n: nf(o.nlate, lang) })) + '</span>'; }]);
  R.push([w('cc_r_visa'), cc => { const v = VISA.find(z => z.cc === cc); if (!v) return '<span class="n31m">' + esc(w('cc_nov')) + '</span>'; return '<b>' + esc(w('vs_' + v.st)) + '</b>' + (v.st === 'open' ? ' ' + esc(nf(v.min, lang, { maximumFractionDigits: 0 }) + ' ' + v.cur) : '') + '<small><a href="' + P + '/tools/visa-by-investment/#v-' + v.k + '">' + esc(w('visa-by-investment_h1')) + '</a></small>'; }]);
  R.push([w('cc_r_inh'), cc => { const v = INH.find(z => z.cc === cc); if (!v) return '<span class="n31m">' + esc(w('cc_noi')) + '</span>'; return esc(v.t[lang] || v.t.en) + '<small><a href="' + P + '/tools/inheritance/#i-' + v.k + '">' + esc(w('inheritance_h1')) + '</a></small>'; }]);
  R.push([w('cc_r_let'), cc => D.rulesN[cc] ? '<a href="' + P + '/guides/short-let-rules/">' + esc(w('cc_rules', { n: nf(D.rulesN[cc], lang) })) + '</a>' : '<span class="n31m">' + esc(w('cc_nol')) + '</span>']);
  R.push([w('cc_r_cost'), cc => TCP[cc] ? '<a href="/tools/total-cost/' + TCP[cc] + '/">' + esc(w('cc_cost')) + '</a>' : '<a href="/tools/total-cost/">' + esc(w('cc_cost0')) + '</a>']);
  R.push([w('cc_r_guide'), cc => '<a href="' + P + '/guides/buying-off-plan/' + GUIDE[cc] + '/">' + esc(w('cc_guide')) + '</a>']);
  const table = '<div class="n31t n31stack"><table><thead><tr><th scope="col">' + esc(w('cc_row')) + '</th>' + pick.map(cc => '<th scope="col">' + esc(country(cc, lang)) + '</th>').join('') + '</tr></thead><tbody>' +
    R.map(([h, f]) => '<tr><th scope="row">' + esc(h) + '</th>' + pick.map(cc => cell(cc, f(cc))).join('') + '</tr>').join('') + '</tbody></table></div>';
  const form = '<form class="n31f" method="get" action="' + P + '/tools/compare-countries/" id="n31-cc"><fieldset style="border:0;padding:0;margin:0"><legend><b>' + esc(w('cc_pick')) + '</b></legend><div class="n31row">' +
    all.map(cc => '<label class="n31b" style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" name="cc" value="' + cc + '"' + (pick.includes(cc) ? ' checked' : '') + ' style="width:auto;min-height:0">' + esc(country(cc, lang)) + '</label>').join('') +
    '</div></fieldset><input type="hidden" name="c" value="' + pick.join(',') + '"><div class="n31row"><button class="k-btn" type="submit">' + esc(w('cc_go')) + '</button></div></form>';
  const inner = form + table + '<p class="n31m">' + esc(w('cc_note', { d: fdate(D.day, lang) })) + '</p><p class="n31m">' + esc(w('not_advice')) + '</p>';
  return frame(lang, '/tools/compare-countries/', 'compare-countries', inner, { me: 'compare-countries' });
}

// ------------------------------------------------------------------------------------------------ 164: on time?
async function onTimePage(env, lang, u) {
  const N = await import('./kbx_named.js'), ix = await N.data(env), A = await import('./kbx_n30a.js'), S0 = A.slipStats(ix, N.handoverOf), w = (k, v) => t31(lang, k, v), P = pre(lang), H = await import('./kbx_hdate.js');
  const R = S0.rows.filter(r => r.tracked >= 5).sort((a, b) => String(H.mkName(a.mk, lang)).localeCompare(String(H.mkName(b.mk, lang))));
  // per market: of the projects whose first date passed, how many were completed (counted) and how many still not (measured)
  const opts = R.map(r => '<option value="' + esc(r.mk) + '">' + esc(H.mkName(r.mk, lang)) + ' (' + nf(r.tracked, lang) + ')</option>').join('');
  const M = { rows: Object.fromEntries(R.map(r => [r.mk, { n: r.n, med: r.med, p25: r.p25, p75: r.p75, min: r.min, max: r.max, done: r.done, notdue: r.notdue, k: r.tracked }])), all: { n: S0.all.n, med: S0.all.med, p25: S0.all.p25, p75: S0.all.p75 },
    msg: { res: w('ot_res'), few: w('ot_few'), est: w('ot_est'), bad: w('ot_bad'), none: w('ot_none'), pick: w('ot_pick') }, LOC: LOC[lang], day: S0.day };
  const inner = '<form class="n31f" id="n31-ot"><label for="n31-mk">' + esc(w('ot_mk')) + '</label><select id="n31-mk"><option value="">' + esc(w('ot_all')) + '</option>' + opts + '</select>' +
    '<label for="n31-d">' + esc(w('ot_date')) + '</label><input id="n31-d" type="month" min="2024-01" max="2035-12">' +
    '<div class="n31row"><button class="k-btn" type="submit">' + esc(w('ot_go')) + '</button></div></form><p id="n31-s" class="n31s" role="status" aria-live="polite"></p><div id="n31-o"></div>' +
    '<h2>' + esc(w('ot_m_h')) + '</h2><ul class="n31p">' + w('ot_m').map(s => '<li>' + esc(s) + '</li>').join('') + '</ul><p><a href="' + P + '/methods/handover-slippage/">' + esc(w('ot_full')) + '</a></p>';
  return frame(lang, '/tools/on-time/', 'on-time', inner, { m: M, me: 'on-time' });
}

// ------------------------------------------------------------------------------------------------ 169: request documents
async function reqDocPage(env, lang, u) {
  const w = (k, v) => t31(lang, k, v);
  let pj = null; const sl = String(u.searchParams.get('p') || '').toLowerCase();
  if (/^[a-z0-9-]{1,90}$/.test(sl)) { try { const N = await import('./kbx_named.js'), ix = await N.data(env), x = ix.bySlug.get(sl); if (x && clean(x)) pj = { n: nameOf(x), dv: x.dv || '', s: x.s }; } catch (e) {} }
  const docs = ['permit', 'land', 'company', 'escrow', 'plan', 'photos', 'contract', 'insurance'];
  const tpl = {}; for (const l of LANGS) tpl[l] = { sub: t31(l, 'rd_sub'), hi: t31(l, 'rd_hi'), intro: t31(l, 'rd_intro'), docs: Object.fromEntries(docs.map(d => [d, t31(l, 'rd_doc_' + d)])), close: t31(l, 'rd_close'), sig: t31(l, 'rd_sig'), unit: t31(l, 'rd_unit') };
  const M = { tpl, pj, copied: w('copied'), name: { en: 'English', es: 'Español', de: 'Deutsch', fr: 'Français', nl: 'Nederlands', ru: 'Русский', zh: '中文', ar: 'العربية' } };
  const inner = '<form class="n31f" id="n31-rd"><label for="n31-p">' + esc(w('rd_p')) + '</label><input id="n31-p" type="text" maxlength="160" value="' + esc(pj ? pj.n : '') + '">' +
    '<label for="n31-dv">' + esc(w('rd_dv')) + '</label><input id="n31-dv" type="text" maxlength="160" value="' + esc(pj ? pj.dv : '') + '">' +
    '<label for="n31-un">' + esc(w('rd_un')) + '</label><input id="n31-un" type="text" maxlength="80">' +
    '<label for="n31-me">' + esc(w('rd_me')) + '</label><input id="n31-me" type="text" maxlength="80" autocomplete="name">' +
    '<label for="n31-l">' + esc(w('rd_l')) + '</label><select id="n31-l">' + LANGS.map(l => '<option value="' + l + '"' + (l === lang ? ' selected' : '') + '>' + esc(M.name[l]) + '</option>').join('') + '</select>' +
    '<fieldset style="border:0;padding:0;margin:0"><legend><b>' + esc(w('rd_docs')) + '</b></legend>' + docs.map(d => '<label style="display:flex;gap:10px;align-items:flex-start;font-weight:400;min-height:44px"><input type="checkbox" value="' + d + '" checked style="width:auto;min-height:0;margin-top:4px"> <span>' + esc(w('rd_doc_' + d)) + '</span></label>').join('') + '</fieldset></form>' +
    '<h2>' + esc(w('rd_out')) + '</h2><div class="n31f"><label for="n31-su">' + esc(w('rd_subj')) + '</label><input id="n31-su" type="text" readonly><label for="n31-bo">' + esc(w('rd_body')) + '</label><textarea id="n31-bo" rows="16" readonly dir="auto"></textarea>' +
    '<div class="n31row"><button class="k-btn" type="button" id="n31-cp">' + esc(w('rd_copy')) + '</button><a class="k-btn k-btn--ghost" id="n31-mt" href="mailto:">' + esc(w('rd_mail')) + '</a></div><p id="n31-s" class="n31s" role="status" aria-live="polite"></p></div>' +
    '<p class="n31p">' + esc(w('rd_why')) + '</p><p class="n31m">' + esc(w('rd_priv')) + '</p>';
  return frame(lang, '/tools/request-documents/', 'request-documents', inner, { m: M, me: 'request-documents' });
}

// ------------------------------------------------------------------------------------------------ 180: inheritance; 176: mortgages
function factPage(lang, key, list, idp) {
  const w = (k, v) => t31(lang, k, v);
  const inner = list.map(v => '<section class="n31c" id="' + idp + v.k + '"><h3>' + esc(v.cc === 'EU' ? w('eu') : country(v.cc, lang)) + (v.h ? ': ' + esc(v.h[lang] || v.h.en) : '') + '</h3><p>' + esc(v.t[lang] || v.t.en) + '</p>' +
    (v.q ? '<p class="n31q" lang="' + (v.src.ql || 'en') + '" dir="ltr">“' + esc(v.q) + '”</p>' : '') + '<p>' + esc(w(v.src.kind === 'press' ? 'source_press' : v.src.kind === 'bank' ? 'source_bank' : 'source')) + ': ' + srcA(v.src) + readOn(lang, v.src.d) + (v.src.pd ? ' <small class="n31m">' + esc(w('page_date', { d: fdate(v.src.pd, lang) })) + '</small>' : '') + '</p></section>').join('') +
    '<h2>' + esc(w(key + '_lim_h')) + '</h2><ul class="n31p">' + w(key + '_lim').map(s => '<li>' + esc(s) + '</li>').join('') + '</ul><p class="n31m">' + esc(w('not_advice')) + '</p>';
  return frame(lang, '/tools/' + key + '/', key, inner, { me: key, noscript: true });
}

// ------------------------------------------------------------------------------------------------ 175: area report
async function areaPage(env, lang, u) {
  const N = await import('./kbx_named.js'), ix = await N.data(env), H = await import('./kbx_hdate.js'), w = (k, v) => t31(lang, k, v), P = pre(lang);
  const mks = [...ix.mk.entries()].filter(([m, o]) => o.k >= 5 && !COI_RX.test(m)).sort((a, b) => b[1].k - a[1].k);
  const sel = String(u.searchParams.get('m') || '');
  const m = mks.find(([k]) => k.toLowerCase() === sel.toLowerCase()) ? mks.find(([k]) => k.toLowerCase() === sel.toLowerCase())[0] : null;
  let rep = '';
  if (m) {
    const A = await import('./kbx_n30a.js'), S0 = A.slipStats(ix, N.handoverOf), sr = S0.rows.find(r => r.mk === m);
    let tr = null; try { tr = await (await import('./kbx_tr.js')).trData(env); } catch (e) {}
    const L = ix.P.filter(x => x.mk === m && clean(x)), st = { op: 0, uc: 0, done: 0 };
    let pn = 0, esc2 = 0, ov = 0, pin = 0;
    for (const x of L) { const c = ix.caseBy.get(x.id) || {}; st[kindOf(c.stage || x.st)]++; if ((c.checks || {}).permit === 2) pn++; if ((c.checks || {}).escrow === true) esc2++; if (N.overdueOf && N.overdueOf(ix, x)) ov++; if ((x.fx || {}).lat) pin++; }
    const top = tr ? L.map(x => tr.rows.get(x.id)).filter(Boolean).sort((a, b) => b.score - a.score || a.n.localeCompare(b.n)).slice(0, 10) : [];
    const li = (a, b) => '<tr><th scope="row">' + esc(a) + '</th><td>' + b + '</td></tr>';
    rep = '<article class="n31rep" id="n31-rep"><header class="n31rh"><div><p class="n31m" id="n31-ag"></p><h2 style="margin:0">' + esc(w('ar_rt', { m: H.mkName(m, lang) })) + '</h2><p class="n31m">' + esc(w('ar_asof', { d: fdate(ix.updated || S0.day, lang) })) + '</p></div><img id="n31-lg" alt="" hidden></header>' +
      '<div class="n31t"><table><tbody>' + li(w('ar_k'), '<b>' + nf(L.length, lang) + '</b>') + li(w('ar_st'), esc(w('ar_stv', { a: nf(st.op, lang), b: nf(st.uc, lang), c: nf(st.done, lang) }))) +
      li(w('cc_r_pn'), nf(pn, lang) + ' (' + nf(Math.round(pn / Math.max(1, L.length) * 100), lang) + ' %)') + li(w('cc_r_esc'), nf(esc2, lang) + ' (' + nf(Math.round(esc2 / Math.max(1, L.length) * 100), lang) + ' %)') + li(w('ar_pin'), nf(pin, lang)) + li(w('ar_ov'), nf(ov, lang)) +
      li(w('cc_r_late'), sr && sr.n >= 5 ? esc(w('cc_med', { m: nf(sr.med, lang) })) + ' <small>' + esc(w('cc_n', { n: nf(sr.n, lang) })) + '</small>' : esc(w('cc_few', { n: nf(sr ? sr.n : 0, lang) }))) + '</tbody></table></div>' +
      (top.length ? '<h3>' + esc(w('ar_top')) + '</h3><ol>' + top.map(r => '<li><a href="' + ORIGIN + P + '/projects/' + r.s + '/">' + bdi(r.n) + '</a> <small class="n31m">' + nf(r.score, lang) + '/100' + (r.dv ? ' · ' + esc(r.dv) : '') + '</small></li>').join('') + '</ol>' : '') +
      '<p class="n31m">' + esc(w('ar_src')) + ' ' + ORIGIN + P + '/m/' + encodeURIComponent(m.toLowerCase().replace(/\s+/g, '-')) + '/ · ' + ORIGIN + '/data/named.json · CC BY 4.0</p><p class="n31m">' + esc(w('ar_rules')) + '</p></article>';
  }
  const inner = '<form class="n31f n31np" method="get" id="n31-ar"><label for="n31-m">' + esc(w('ar_m')) + '</label><select id="n31-m" name="m">' + mks.map(([k, o]) => '<option value="' + esc(k) + '"' + (k === m ? ' selected' : '') + '>' + esc(H.mkName(k, lang)) + ' (' + nf(o.k, lang) + ')</option>').join('') + '</select>' +
    '<div class="n31row"><button class="k-btn" type="submit">' + esc(w('ar_go')) + '</button></div>' +
    '<label for="n31-an">' + esc(w('ar_an')) + '</label><input id="n31-an" type="text" maxlength="80"><label for="n31-al">' + esc(w('ar_al')) + '</label><input id="n31-al" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml">' +
    '<p class="n31m">' + esc(w('ar_priv')) + '</p>' + (m ? '<div class="n31row"><button class="k-btn" type="button" id="n31-pr">' + esc(w('ar_print')) + '</button></div>' : '') + '</form>' + rep +
    '<style>.n31rh{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin:16px 0}.n31rh img{max-height:64px;max-width:180px;object-fit:contain}.n31rep{border:1px solid var(--line,#d5d3cc);border-radius:14px;padding:16px;background:var(--card,#fff)}' +
    '@media print{header,footer,nav,.phero,.n31np,.n31rel,.n31w>h2,.k-ticker,.kticker,[class*=ticker],#n31>h2{display:none!important}.n31rep{border:0;padding:0}.n31rep a{color:inherit;text-decoration:none}body{background:#fff!important}}</style>';
  return frame(lang, '/tools/area-report/', 'area-report', inner, { me: 'area-report', m: {} });
}

// ------------------------------------------------------------------------------------------------ 177 translate, 160 receipt check, 171 payment vs progress, 166 app
function translatePage(lang) {
  const w = (k, v) => t31(lang, k, v);
  const M = { msg: { no: w('tr_no'), dl: w('tr_dl'), rd: w('tr_rd'), done: w('tr_done'), err: w('tr_err'), det: w('tr_det'), scan: w('tr_scan'), big: w('tr_big') }, to: lang };
  const names = { en: 'English', es: 'Español', de: 'Deutsch', fr: 'Français', nl: 'Nederlands', ru: 'Русский', zh: '中文', ar: 'العربية', id: 'Bahasa Indonesia', th: 'ไทย', tr: 'Türkçe', pt: 'Português', it: 'Italiano', vi: 'Tiếng Việt', ja: '日本語', pl: 'Polski' };
  const inner = '<form class="n31f" id="n31-tr"><label for="n31-tf">' + esc(w('tr_file')) + '</label><input id="n31-tf" type="file" accept="application/pdf,.pdf,text/plain,.txt">' +
    '<label for="n31-tt">' + esc(w('tr_or')) + '</label><textarea id="n31-tt" rows="8" dir="auto" spellcheck="false"></textarea>' +
    '<label for="n31-tl">' + esc(w('tr_to')) + '</label><select id="n31-tl">' + LANGS.map(l => '<option value="' + l + '"' + (l === lang ? ' selected' : '') + '>' + esc(names[l]) + '</option>').join('') + '</select>' +
    '<label for="n31-ts">' + esc(w('tr_from')) + '</label><select id="n31-ts"><option value="">' + esc(w('tr_auto')) + '</option>' + Object.keys(names).map(l => '<option value="' + l + '">' + esc(names[l]) + '</option>').join('') + '</select>' +
    '<div class="n31row"><button class="k-btn" type="submit">' + esc(w('tr_go')) + '</button></div></form><p id="n31-s" class="n31s" role="status" aria-live="polite"></p><div id="n31-o" dir="auto"></div>' +
    '<h2>' + esc(w('tr_how_h')) + '</h2><ul class="n31p">' + w('tr_how').map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>';
  return frame(lang, '/tools/translate/', 'translate', inner, { m: M, me: 'translate', priv: w('tr_priv') });
}
function receiptPage(lang) {
  const w = (k, v) => t31(lang, k, v);
  const M = { msg: { none: w('rc_none'), ok: w('rc_ok'), bad: w('rc_bad'), ae: w('rc_ae'), esc: w('rc_esc'), noesc: w('rc_noesc'), ben: w('rc_ben'), noben: w('rc_noben'), pers: w('rc_pers'), ref: w('rc_ref'), noref: w('rc_noref'), sw: w('rc_sw'), cc: w('rc_cc'), call: w('rc_call'), iban: w('rc_iban'), scan: w('tr_scan'), rd: w('tr_rd') } };
  const inner = '<form class="n31f" id="n31-rc"><label for="n31-rf">' + esc(w('rc_file')) + '</label><input id="n31-rf" type="file" accept="application/pdf,.pdf,text/plain,.txt"><label for="n31-rt">' + esc(w('rc_or')) + '</label><textarea id="n31-rt" rows="8" dir="auto" spellcheck="false"></textarea>' +
    '<label for="n31-rp">' + esc(w('rc_proj')) + '</label><input id="n31-rp" type="text" maxlength="160"><label style="display:flex;gap:10px;align-items:center;font-weight:400;min-height:44px"><input id="n31-rd" type="checkbox" style="width:auto;min-height:0"> ' + esc(w('rc_dubai')) + '</label>' +
    '<div class="n31row"><button class="k-btn" type="submit">' + esc(w('rc_go')) + '</button></div></form><p id="n31-s" class="n31s" role="status" aria-live="polite"></p><div id="n31-o"></div>' +
    '<h2>' + esc(w('rc_law_h')) + '</h2><p class="n31p">' + esc(w('rc_law')) + '</p><p class="n31q" dir="ltr" lang="en">“' + esc(CRC.ae_l8_q) + '”</p><p>' + esc(w('source')) + ': ' + srcA(CRC.ae_l8) + readOn(lang, CRC.ae_l8.d) + '</p>' +
    '<p class="n31m">' + esc(w('rc_more')) + ' <a href="/tools/account-check/">/tools/account-check/</a> · <a href="/tools/payment-email-check/">/tools/payment-email-check/</a> · <a href="/tools/agent-check/">/tools/agent-check/</a></p>';
  return frame(lang, '/tools/receipt-check/', 'receipt-check', inner, { m: M, me: 'receipt-check', priv: w('rc_priv') });
}
async function pvpPage(env, lang, u) {
  const w = (k, v) => t31(lang, k, v);
  let pj = null; const sl = String(u.searchParams.get('p') || '').toLowerCase();
  const N = await import('./kbx_named.js'), ix = await N.data(env), A = await import('./kbx_n30a.js'), S0 = A.slipStats(ix, N.handoverOf);
  if (/^[a-z0-9-]{1,90}$/.test(sl)) { const x = ix.bySlug.get(sl); if (x && clean(x)) { const fx = x.fx || {}, h = N.handoverOf(ix, x), r = S0.rows.find(z => z.mk === x.mk); pj = { n: nameOf(x), s: x.s, plan: fx.payment_plan || null, dep: fx.deposit_pct || null, start: fx.construction_start || null, ho: h ? String(h.d) : (fx.handover_promised || null), med: r && r.n >= 5 ? r.med : null, mn: r ? r.n : 0, mk: x.mk }; } }
  const M = { pj, all: S0.all.med, msg: { paid: w('pv_paid'), built: w('pv_built'), gap: w('pv_gap'), gap0: w('pv_gap0'), bad: w('pv_bad'), plan: w('pv_planfrom'), med: w('pv_med'), sum: w('pv_sum'), month: w('pv_month'), aria: w('pv_aria') }, LOC: LOC[lang] };
  const row = (i, p, t, v) => '<div class="n31row n31pr"><input aria-label="' + esc(w('pv_pct')) + ' ' + i + '" type="number" min="0" max="100" step="0.5" value="' + p + '" style="max-width:110px"><select aria-label="' + esc(w('pv_when')) + ' ' + i + '" style="max-width:220px"><option value="s"' + (t === 's' ? ' selected' : '') + '>' + esc(w('pv_t_s')) + '</option><option value="b"' + (t === 'b' ? ' selected' : '') + '>' + esc(w('pv_t_b')) + '</option><option value="m"' + (t === 'm' ? ' selected' : '') + '>' + esc(w('pv_t_m')) + '</option><option value="h"' + (t === 'h' ? ' selected' : '') + '>' + esc(w('pv_t_h')) + '</option></select><input aria-label="' + esc(w('pv_v')) + ' ' + i + '" type="number" min="0" max="120" step="1" value="' + v + '" style="max-width:110px"></div>';
  const inner = (pj ? '<p class="n31c"><b>' + bdi(pj.n) + '</b>' + (pj.plan ? '<br>' + esc(w('pv_planfrom')) + ' <span dir="auto">“' + esc(pj.plan) + '”</span>' : '') + '</p>' : '') +
    '<form class="n31f" id="n31-pv"><div class="n31row"><label for="n31-ps" style="min-width:12em">' + esc(w('pv_start')) + '</label><input id="n31-ps" type="month" style="max-width:200px"></div><div class="n31row"><label for="n31-ph" style="min-width:12em">' + esc(w('pv_ho')) + '</label><input id="n31-ph" type="month" style="max-width:200px"></div>' +
    '<div class="n31row"><label for="n31-pd" style="min-width:12em">' + esc(w('pv_delay')) + '</label><input id="n31-pd" type="number" min="0" max="120" step="1" value="0" style="max-width:110px"></div><p class="n31m" id="n31-pdm"></p>' +
    '<fieldset style="border:0;padding:0;margin:0"><legend><b>' + esc(w('pv_rows')) + '</b></legend><p class="n31m">' + esc(w('pv_rows_h')) + '</p><div id="n31-rows">' + row(1, 20, 's', 0) + row(2, 30, 'b', 50) + row(3, 20, 'b', 80) + row(4, 30, 'h', 0) + '</div>' +
    '<div class="n31row"><button class="n31b" type="button" id="n31-add">' + esc(w('pv_add')) + '</button></div></fieldset><div class="n31row"><button class="k-btn" type="submit">' + esc(w('pv_go')) + '</button></div></form>' +
    '<p id="n31-s" class="n31s" role="status" aria-live="polite"></p><div id="n31-o" dir="ltr"></div><h2>' + esc(w('pv_m_h')) + '</h2><ul class="n31p">' + w('pv_m').map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>' +
    '<p class="n31m"><a href="/tools/payment-risk/">/tools/payment-risk/</a> · <a href="/tools/payment-plan/">/tools/payment-plan/</a></p>';
  return frame(lang, '/tools/payment-vs-progress/', 'payment-vs-progress', inner, { m: M, me: 'payment-vs-progress' });
}
function appPage(lang) {
  const w = (k, v) => t31(lang, k, v);
  const inner = '<div class="n31row"><button class="k-btn" type="button" id="n31-in" hidden>' + esc(w('app_btn')) + '</button></div><p id="n31-s" class="n31s" role="status" aria-live="polite"></p>' +
    ['and', 'ios', 'desk'].map(k => '<section class="n31c"><h3>' + esc(w('app_' + k + '_h')) + '</h3><ol>' + w('app_' + k).map(s => '<li>' + esc(s) + '</li>').join('') + '</ol></section>').join('') +
    '<h2>' + esc(w('app_what_h')) + '</h2><ul class="n31p">' + w('app_what').map(s => '<li>' + esc(s) + '</li>').join('') + '</ul><p class="n31m">' + esc(w('app_note')) + '</p>';
  return frame(lang, '/app/', 'app', inner, { me: 'app', m: { done: w('app_done') }, crumb: esc(w('app_h1')) });
}

// ------------------------------------------------------------------------------------------------ 178: satellite monthly loop
async function satPage(env, lang) {
  const N = await import('./kbx_named.js'), ix = await N.data(env), SAT = await import('./kbx_named_sat.js'), sd = await SAT.satData(env), H = await import('./kbx_hdate.js'), w = (k, v) => t31(lang, k, v), P = pre(lang);
  const recs = sd && sd.projects ? sd.projects : {}, L = [];
  for (const [id, r] of Object.entries(recs)) { const x = ix.byId.get(id); if (!x || !clean(x) || !r.frames || !r.v || r.frames < 6) continue; const fx = x.fx || {}; if (fx.lat == null || fx.lng == null) continue; const ch = r.sum && r.sum.b_last != null && r.sum.b_first != null ? Math.round(r.sum.b_last - r.sum.b_first) : null; L.push({ x, r, ch, lat: +fx.lat, lng: +fx.lng }); }
  L.sort((a, b) => (b.ch == null ? -999 : b.ch) - (a.ch == null ? -999 : a.ch) || nameOf(a.x).localeCompare(nameOf(b.x)));
  // equirectangular dot map (server SVG), each dot links to its card
  const W = 960, Hh = 480, X = g => ((g + 180) / 360 * W).toFixed(1), Y = a => ((90 - a) / 180 * Hh).toFixed(1);
  const map = '<figure class="n31map" dir="ltr"><svg viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="' + esc(w('sm_map', { n: nf(L.length, lang) })) + '"><rect width="' + W + '" height="' + Hh + '" rx="12" class="sea"/>' +
    [-60, -30, 0, 30, 60].map(a => '<line x1="0" x2="' + W + '" y1="' + Y(a) + '" y2="' + Y(a) + '"/>').join('') + [-120, -60, 0, 60, 120].map(g => '<line y1="0" y2="' + Hh + '" x1="' + X(g) + '" x2="' + X(g) + '"/>').join('') +
    L.map((o, i) => '<a href="#s-' + o.x.id + '"><circle cx="' + X(o.lng) + '" cy="' + Y(o.lat) + '" r="6"><title>' + esc(nameOf(o.x)) + '</title></circle></a>').join('') + '</svg><figcaption class="n31m">' + esc(w('sm_map_c')) + '</figcaption></figure>';
  const months = r => { const [y, m] = r.m0.split('-').map(Number); return r.f.map((f, i) => { const k = y * 12 + (m - 1) + i; return f >= 0 ? [f, Math.floor(k / 12) + '-' + String(k % 12 + 1).padStart(2, '0')] : null; }).filter(Boolean).slice(-48); };   // the last 48 clear months
  // runs of consecutive frames: tile.month(YYYYMM).length, so 48 months usually fit in one short attribute
  const runs = fr => { const o = []; let c = null; for (const [t, m] of fr) { const mi2 = +m.slice(0, 4) * 12 + +m.slice(5) - 1; if (c && t === c.t + c.n && mi2 === c.mi + c.n) c.n++; else { c = { t, mi: mi2, m: m.replace('-', ''), n: 1 }; o.push(c); } } return o.map(r => r.t + '.' + r.m + '.' + r.n).join(' '); };
  const cards = L.map(o => { const fr = months(o.r), first = fr[0][1], last = fr[fr.length - 1][1];
    return '<li class="n31sc" id="s-' + o.x.id + '"><div class="n31tile" dir="ltr" data-src="/k/sat/proj/' + encodeURIComponent(o.x.id) + '.jpg?v=' + encodeURIComponent(o.r.v) + '" data-r="' + runs(fr) + '" data-n="' + o.r.frames + '" role="img" aria-label="' + esc(w('sm_aria', { p: nameOf(o.x), a: ym(first, lang), b: ym(last, lang) })) + '"><span class="n31mo" aria-hidden="true"></span></div>' +
      '<p><a href="' + P + '/projects/' + o.x.s + '/#space">' + bdi(nameOf(o.x)) + '</a><br><small class="n31m">' + esc(H.mkName(o.x.mk, lang)) + ' · ' + esc(w('sm_n', { n: nf(fr.length, lang), a: ym(first, lang), b: ym(last, lang) })) + (o.ch != null ? ' · ' + esc(w('sm_ch', { c: (o.ch > 0 ? '+' : '') + nf(o.ch, lang) })) : '') + '</small></p></li>'; }).join('');
  const inner = '<div class="n31row"><button class="n31b" type="button" id="n31-pp" aria-pressed="false">' + esc(w('sm_pause')) + '</button><label class="n31m" for="n31-sp">' + esc(w('sm_speed')) + '</label><input id="n31-sp" type="range" min="2" max="12" value="6" style="max-width:180px"></div>' + map +
    '<ul class="n31sg">' + cards + '</ul><h2>' + esc(w('sm_m_h')) + '</h2><ul class="n31p">' + w('sm_m').map(s => '<li>' + esc(s) + '</li>').join('') + '</ul><p class="n31m">' + esc((sd && sd.source && sd.source.attribution) || 'Contains modified Copernicus Sentinel data') + '. <a href="' + esc((sd && sd.source && sd.source.url) || 'https://registry.opendata.aws/sentinel-2-l2a-cogs/') + '" rel="noopener" target="_blank">Sentinel-2 L2A</a> · ' + esc(w('updated', { d: fdate((sd && sd.updated) || '2026-11-08', lang) })) + '</p>' +
    '<style>.n31map svg{width:100%;height:auto;display:block}.n31map .sea{fill:color-mix(in srgb,var(--k-sea,#155C75) 10%,var(--card,#fff))}.n31map line{stroke:var(--line,#d5d3cc);stroke-width:1}.n31map circle{fill:var(--hivis,#FF5B14);stroke:#fff;stroke-width:1.5}.n31map a:focus circle{stroke:var(--ink,#17212B);stroke-width:3}' +
    '.n31sg{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}.n31sc p{margin:6px 0 0;font-size:.92rem;overflow-wrap:anywhere}.n31tile{position:relative;width:100%;aspect-ratio:1;border-radius:10px;background:#1b2530 no-repeat;background-size:cover;image-rendering:auto}.n31mo{position:absolute;inset-inline-start:6px;bottom:6px;background:rgba(0,0,0,.65);color:#fff;font-size:.75rem;padding:1px 6px;border-radius:6px;font-variant-numeric:tabular-nums}.n31sc:target .n31tile{outline:3px solid var(--hivis,#FF5B14)}</style>';
  return frame(lang, '/satellite/monthly/', 'sm', inner, { me: 'sm', m: { play: w('sm_play') }, crumb: '<a href="/satellite/">' + esc(w('bc_sat')) + '</a>' });
}

// ------------------------------------------------------------------------------------------------ 168: new developer websites
async function newSites(env) {
  const N = await import('./kbx_named.js'), ix = await N.data(env);
  const load = async n => { try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + n)); return r.ok ? await r.json() : null; } catch (e) { return null; } };
  const [wf, da] = await Promise.all([load('web-forensics.json'), load('domain-age.json')]);
  const { regDomain } = await import('./kbx_xray.js');
  const host = u => { try { return new URL(u).hostname.toLowerCase().replace(/^www\./, ''); } catch (e) { return ''; } };
  const D = (wf && wf.d) || {}, now = new Date(), cut = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 24, 1)).toISOString().slice(0, 10);
  const by = new Map();
  for (const x of ix.P) {
    if (!clean(x)) continue;
    for (const u of [x.url, x.du]) { if (!N.okHttp(u) || N.isListing(u)) continue; const h = host(u); if (!h) continue; const d = regDomain(h), r = D[d]; if (!r || !r.rg) continue;
      const o = by.get(d) || { d, rg: r.rg, rr: r.rr, rgr: r.rgr || null, iss: r.iss || null, cb: r.cb || null, ps: new Map(), devs: new Set(), fc: null }; by.set(d, o); o.ps.set(x.s, nameOf(x)); if (x.dv) o.devs.add(x.dv);
      const dg = da && da.projects && da.projects[x.id]; if (dg && dg.founded_claim && (!o.fc || dg.founded_claim < o.fc)) o.fc = dg.founded_claim; }
  }
  const L = [...by.values()].filter(o => o.rg >= cut).sort((a, b) => b.rg.localeCompare(a.rg));
  return { L, updated: (wf && wf.updated) || null, total: by.size, cut, src: (wf && wf.source) || ['https://rdap.org/'] };
}
async function newSitesPage(env, lang) {
  const { L, updated, total, cut } = await newSites(env), w = (k, v) => t31(lang, k, v), P = pre(lang);
  const rows = L.map(o => { const y = +o.rg.slice(0, 4), gap = o.fc && y - o.fc >= 2 ? '<small>' + esc(w('nw_gap', { f: o.fc, y })) + '</small>' : '';
    return '<tr><td data-l="' + esc(w('nw_th')[0]) + '"><b dir="ltr">' + esc(o.d) + '</b>' + (o.rgr ? '<small>' + esc(o.rgr) + '</small>' : '') + '</td><td data-l="' + esc(w('nw_th')[1]) + '"><b>' + esc(fdate(o.rg, lang)) + '</b>' + gap + '</td><td data-l="' + esc(w('nw_th')[2]) + '">' + [...o.ps].slice(0, 4).map(([s, n]) => '<a href="' + P + '/projects/' + s + '/">' + bdi(n) + '</a>').join(', ') + (o.ps.size > 4 ? ' +' + (o.ps.size - 4) : '') + (o.devs.size ? '<small>' + esc([...o.devs].slice(0, 2).join(', ')) + '</small>' : '') + '</td></tr>'; }).join('');
  const inner = '<p class="n31p"><b>' + esc(w('nw_sum', { k: nf(L.length, lang), n: nf(total, lang), c: fdate(cut, lang) })) + '</b></p>' +
    '<p class="n31row"><a class="k-btn k-btn--ghost" href="/api/v1/new-websites.json">' + esc(w('nw_feed')) + '</a><a class="n31b" style="display:inline-flex;align-items:center;text-decoration:none" href="/api/v1/new-websites">JSON</a></p>' +
    '<div class="n31t n31stack"><table><thead><tr>' + w('nw_th').map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<h2>' + esc(w('nw_m_h')) + '</h2><ul class="n31p">' + w('nw_m').map(s => '<li>' + esc(s) + '</li>').join('') + '</ul><p class="n31m">' + esc(w('updated', { d: fdate(updated || '2026-11-17', lang) })) + ' · <a href="https://rdap.org/" rel="noopener" target="_blank">RDAP</a> · <a href="/data/web-forensics.json">web-forensics.json</a></p>';
  return frame(lang, '/watch/new-websites/', 'nw', inner, { me: 'nw', noscript: true, crumb: '<a href="/watch/lookalikes/">' + esc(w('bc_watch')) + '</a>' });
}
async function newSitesApi(env, feed) {
  const { L, updated, cut } = await newSites(env);
  if (!feed) return jr({ updated, registered_since: cut, count: L.length, method: 'Developer and project websites of tracked projects whose registrable domain was registered in the last 24 months (registry RDAP, read once per domain and kept). Facts only: a young domain is not a judgement about a company.', licence: 'CC BY 4.0, credit Kolaboro (kolaboro.com)', page: ORIGIN + '/watch/new-websites/',
    items: L.map(o => ({ domain: o.d, registered: o.rg, rdap_read: o.rr, registrar: o.rgr, founded_claim: o.fc, projects: [...o.ps].map(([s, n]) => ({ slug: s, name: n, url: ORIGIN + '/projects/' + s + '/' })), developers: [...o.devs] })) });
  return new Response(JSON.stringify({ version: 'https://jsonfeed.org/version/1.1', title: 'Kolaboro: recently registered developer websites', home_page_url: ORIGIN + '/watch/new-websites/', feed_url: ORIGIN + '/api/v1/new-websites.json', language: 'en',
    description: 'Websites of tracked off-plan projects or developers whose domain was registered in the last 24 months, from registry RDAP data. Facts only.',
    items: L.slice(0, 100).map(o => ({ id: 'kolaboro-new-site-' + o.d + '-' + o.rg, url: ORIGIN + '/watch/new-websites/', title: o.d + ' registered on ' + o.rg, date_published: o.rg + 'T00:00:00Z',
      content_text: o.d + ' (registrar: ' + (o.rgr || 'not published') + ') was registered on ' + o.rg + ' according to the registry RDAP record read on ' + o.rr + '. Linked to: ' + [...o.ps].map(([s, n]) => n).slice(0, 6).join(', ') + '.' + (o.fc ? ' Founding year claimed on the developer page: ' + o.fc + '.' : '') })) }, null, 1),
    { headers: { 'content-type': 'application/feed+json; charset=utf-8', 'cache-control': 'public, max-age=3600', 'access-control-allow-origin': '*' } });
}

// ------------------------------------------------------------------------------------------------ 159: contract reader, what is missing by country
export async function crBlock(lang, env) {
  await L31(env);
  const w = (k, v) => t31(lang, k, v), C = CRC.countries;
  let NT = {}; try { const [a, b] = await Promise.all([import('./kbx_buy_notes.js'), import('./kbx_buy_c29.js')]); NT = Object.assign({}, a.NT, b.NT29); } catch (e) {}
  const M = Object.fromEntries(Object.entries(C).map(([cc, L]) => [cc, L.map(i => ({ k: i.k, l: (i.l[lang] || i.l.en), n: NT[i.k] ? (NT[i.k][lang] || NT[i.k].en) : null, rx: i.rx, s: i.s.map(sk => CRC.src[sk]).filter(Boolean) }))]));
  return '<section class="n31crc" id="n31crc" data-m="' + esc(JSON.stringify({ C: M, msg: { found: w('crc_found'), miss: w('crc_miss'), wait: w('crc_wait'), src: w('source'), pick: w('crc_pick') } })) + '"><h2>' + esc(w('crc_h')) + '</h2><p class="n31p">' + esc(w('crc_lead')) + '</p>' +
    '<label for="n31crc-c"><b>' + esc(w('crc_c')) + '</b></label> <select id="n31crc-c" style="min-height:48px;border-radius:12px;padding:8px"><option value="">' + esc(w('crc_pick')) + '</option>' + Object.keys(C).map(cc => '<option value="' + cc + '">' + esc(country(cc, lang)) + '</option>').join('') + '</select>' +
    '<div id="n31crc-o" aria-live="polite"></div><p class="n31m">' + esc(w('crc_note')) + '</p></section>' + CSS + script;
}

// ------------------------------------------------------------------------------------------------ MCP helpers (kbx_e.js)
export async function mcpFind(env, q, lim) {
  await L31(env);
  const { ix, N, hits } = await findProjects(env, q, lim || 10);
  return { query: q, count: hits.length, results: hits.map(x => Object.assign(brief(ix, N, x, 'en'), { handover_history: ORIGIN + '/api/v1/handover-history/' + x.s })), search_page: ORIGIN + '/tools/handover-history/', rules: 'Named projects only (Sumba projects are never named). Matches on the project name first, then developer and place. Facts only, no verdict.' };
}
export async function mcpCert(env, slug, inner) {
  const r = await inner('/api/v1/projects/' + slug + '/certificate');
  return r;
}

// ------------------------------------------------------------------------------------------------ routes
export const PATHS = /^\/k\/n31e\.js$|^\/api\/v1\/(?:find|new-websites(?:\.json)?|handover-history\/[a-z0-9-]{1,90})$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:tools\/(?:find-listing|handover-history|visa-by-investment|compare-countries|on-time|request-documents|inheritance|foreign-mortgages|area-report|translate|receipt-check|payment-vs-progress)|satellite\/monthly|watch\/new-websites|app)\/?$/;
export async function handle(req, u, env, ctx, shell) {
  const p = u.pathname;
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  if (p !== '/k/n31e.js') await L31(env);
  if (p === '/k/n31e.js') { const C = await import('./kbx_n31e_client.js'); return new Response(C.JS, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': u.searchParams.get('v') === N31V ? 'public, max-age=31536000, immutable' : 'public, max-age=300', 'x-content-type-options': 'nosniff' } }); }
  try {
    if (p === '/api/v1/find') { const q = String(u.searchParams.get('q') || '').slice(0, 120); if (norm(q).length < 2) return jr({ error: 'q', note: 'q = at least 2 letters of a project, developer or place name' }, 400);
      const { ix, N, hits } = await findProjects(env, q, 8), lang = LANGS.includes(u.searchParams.get('lang')) ? u.searchParams.get('lang') : 'en'; return jr({ query: q, count: hits.length, results: hits.map(x => brief(ix, N, x, lang)) }, 200, 'public, max-age=900'); }
    const hh = /^\/api\/v1\/handover-history\/([a-z0-9-]{1,90})$/.exec(p);
    if (hh) { const N = await import('./kbx_named.js'), ix = await N.data(env), x = ix.bySlug.get(hh[1]); if (!x || !clean(x)) return jr({ error: 'not_found', hint: 'Named project slugs: ' + ORIGIN + '/projects/' }, 404); return jr(handoverRecord(ix, N, x, await import('./kbx_hdate.js')), 200, 'public, max-age=900'); }
    if (p === '/api/v1/new-websites' || p === '/api/v1/new-websites.json') return await newSitesApi(env, p.endsWith('.json'));
  } catch (e) { return jr({ error: 'unavailable' }, 503, 'no-store'); }
  const m = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(tools\/[a-z-]+|satellite\/monthly|watch\/new-websites|app)(\/?)$/); if (!m) return null;
  if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
  const lang = m[1] || 'en', k = m[2].replace(/^tools\//, '');
  try {
    if (k === 'find-listing' || k === 'handover-history') return await page(lang, shell, k, '/tools/' + k + '/', findPage(lang, k));
    if (k === 'visa-by-investment') return await page(lang, shell, k, '/tools/' + k + '/', await visaPage(env, lang), { type: 'WebPage' });
    if (k === 'compare-countries') return await page(lang, shell, k, '/tools/' + k + '/', await comparePage(env, lang, u), { type: 'WebPage', noindex: u.searchParams.has('c') || u.searchParams.has('cc') });
    if (k === 'on-time') return await page(lang, shell, k, '/tools/' + k + '/', await onTimePage(env, lang, u));
    if (k === 'request-documents') return await page(lang, shell, k, '/tools/' + k + '/', await reqDocPage(env, lang, u), { noindex: u.searchParams.has('p') });
    if (k === 'inheritance') return await page(lang, shell, k, '/tools/' + k + '/', factPage(lang, k, INH, 'i-'), { type: 'WebPage' });
    if (k === 'foreign-mortgages') return await page(lang, shell, k, '/tools/' + k + '/', factPage(lang, k, MORT, 'b-'), { type: 'WebPage' });
    if (k === 'area-report') return await page(lang, shell, k, '/tools/' + k + '/', await areaPage(env, lang, u), { noindex: u.searchParams.has('m') });
    if (k === 'translate') return await page(lang, shell, k, '/tools/' + k + '/', translatePage(lang));
    if (k === 'receipt-check') return await page(lang, shell, k, '/tools/' + k + '/', receiptPage(lang));
    if (k === 'payment-vs-progress') return await page(lang, shell, k, '/tools/' + k + '/', await pvpPage(env, lang, u), { noindex: u.searchParams.has('p') });
    if (k === 'satellite/monthly') return await page(lang, shell, 'sm', '/satellite/monthly/', await satPage(env, lang), { type: 'WebPage', bcName: t31(lang, 'bc_sat'), bcPath: '/satellite/' });
    if (k === 'watch/new-websites') return await page(lang, shell, 'nw', '/watch/new-websites/', await newSitesPage(env, lang), { type: 'WebPage', bcName: t31(lang, 'bc_watch'), bcPath: '/watch/lookalikes/' });
    if (k === 'app') return await page(lang, shell, 'app', '/app/', appPage(lang), { type: 'WebPage', bcName: t31(lang, 'app_h1'), bcPath: '/app/' });
  } catch (e) { return null; }
  return null;
}
// for the local test only
export const __t = { findPage, visaPage, comparePage, onTimePage, reqDocPage, factPage, areaPage, translatePage, receiptPage, pvpPage, appPage, satPage, newSitesPage, newSitesApi, handoverRecord };
