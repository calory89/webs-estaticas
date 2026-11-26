// kolaboro.com named pages, batch 10 (b10c): two sections for kbx_named.js.
// 1) Price per m2 against official data (project pages). Shown only when the project publishes a starting price and a smallest size
//    in the currency of an official open dataset; otherwise an honest "no official comparison available". Official sources used:
//    - UAE, Dubai: Dubai Land Department open data (gateway.dubailand.gov.ae/open-data/transactions, no key): every registered
//      off-plan residential sale in a 90-day window, median AED per m2 (TRANS_VALUE / ACTUAL_AREA) per DLD project and per DLD area.
//    - Spain: Ministerio de Vivienda y Agenda Urbana (MIVAU, formerly Fomento) "valor tasado medio de vivienda libre", EUR per m2,
//      by municipality over 25,000 inhabitants (dwellings up to five years old where published, else all) and by province.
//      That is the official appraised value, not a sale price; the page says so.
//    Snapshot below, refreshed by re-running the generator (scratchpad b10c-gen/dld.py and es.py); dates are shown on the page.
//    Checked and not usable today: Dubai Pulse (needs a key), NYC rolling sales (open, but no tracked NYC project publishes price and
//    size), INE Spain (index only, no EUR per m2), Notariado portal (no open API), INE Portugal (open bank-valuation series last updated 2023).
// 2) Company network (developer pages): GLEIF level-2 relationships (direct parent, ultimate parent, direct children) of the LEI the
//    page already matched, cached at the edge for a week per LEI, plus the developer's other projects we track, drawn as a small graph.
// Every sentence is a template in kbx_named_i18n.js (keys ppm_* and net_*), so the sections read in the page language (fin11).
import { T, LOCALE } from './kbx_named_i18n.js';
import { regSale, rsText } from './kbx_n31d_rs.js';
import { TB } from './kbx_strings.js';   // n31d: DLD registered sale prices are not asking prices
const ORIGIN = 'https://kolaboro.com';
const tl = (lang, k, v) => { const s = (T[lang] && T[lang][k]) || T.en[k] || k; return v ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
let DLD = null, ES = null, PPM_T = 0;   // n40 r1d: official price references live in /data/ppm-official.json (were inline here)
export async function ppmLoad(env) { if (DLD && Date.now() - PPM_T < 3600000) return true; let v = null; try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/ppm-official.json')); if (r.ok) v = await r.json(); } catch (e) { v = null; } if (!v) { try { const r = await fetch(ORIGIN + '/data/ppm-official.json', { cf: { cacheTtl: 3600 } }); if (r.ok) v = await r.json(); } catch (e) { v = null; } } if (v && v.dld) { DLD = v.dld; ES = v.es; PPM_T = Date.now(); DIDX = null; MIDX = null; } return !!DLD; }
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const src = (u, label) => ' <a class="src" href="' + esc(u) + '" rel="nofollow noopener" target="_blank">' + esc(label) + '</a>';
const norm = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
const fmt = n => { try { return Math.round(n).toLocaleString(LOCALE[lang] || 'en-GB'); } catch (e) { return String(Math.round(n)); } };   // n25t: numbers in the page's locale
const pct = (lang, a, b) => { const d = Math.round((a / b - 1) * 100); return d === 0 ? tl(lang, 'ppm_same') : tl(lang, d > 0 ? 'ppm_above' : 'ppm_below', { d: Math.abs(d) }); };

// ---------------------------------------------------------------- price per m2
const DLD_ALIAS = [['downtown dubai', 'BURJ KHALIFA'], ['emaar beachfront', 'DUBAI HARBOUR'], ['mohammed bin rashid city', 'HADAEQ SHEIKH MOHAMMED BIN RASHID'], ['nad al sheba', 'NAD AL SHIBA FIRST'], ['jumeirah lake towers', 'AL THANYAH FIFTH'], ['dubai marina', 'MARSA DUBAI']];
let DIDX = null;
function dldIndex() {
  if (DIDX) return DIDX;
  const P = new Map(Object.keys(DLD.projects).map(k => [norm(k), k])), A = Object.keys(DLD.areas).map(k => [norm(k), k]).sort((a, b) => b[0].length - a[0].length);
  DIDX = { P, A }; return DIDX;
}
function dldMatch(x) {
  const ix = dldIndex(), nm = norm(String(x.n).replace(/\([^)]*\)/g, '')), nm2 = nm.replace(/ by .*$/, '');
  let pk = ix.P.get(nm) || ix.P.get(nm2);
  if (!pk && nm2.length >= 6) { const c = [...ix.P.keys()].filter(k => k.startsWith(nm2 + ' ') || k === nm2); if (c.length === 1) pk = ix.P.get(c[0]); }
  const ar = norm(x.ar || '');
  let ak = null;
  for (const [n, k] of ix.A) if (n.length >= 4 && new RegExp('\\b' + n.replace(/ /g, '\\s+') + '\\b').test(ar)) { ak = k; break; }
  if (!ak) for (const [a, k] of DLD_ALIAS) if (ar.includes(a) && DLD.areas[k]) { ak = k; break; }
  return { pk, ak };
}
const ES_PROV = [[/malaga|costa del sol|marbella|estepona|mijas|benahavis|manilva|casares|torremolinos|benalmadena|fuengirola|ojen|istan/, 'Málaga'], [/alicante|costa blanca|benidorm|torrevieja|finestrat|denia|javea|xabia|calp|villajoyosa|el verger|orihuela/, 'Alicante/Alacant'],
  [/mallorca|ibiza|eivissa|menorca|balear|palma|andratx|capdepera|santa eularia/, 'Balears (Illes)'], [/tenerife|adeje|arona|granadilla|arico|la palma\b/, 'Santa Cruz de Tenerife'], [/gran canaria|mogan|san bartolome de tirajana|lanzarote|fuerteventura/, 'Palmas (Las)'],
  [/murcia|cartagena|costa calida|la manga/, 'Murcia (Región de)'], [/girona|costa brava|platja d aro/, 'Girona'], [/barcelona|esplugues/, 'Barcelona'], [/valencia/, 'Valencia/València'], [/madrid/, 'Madrid (Comunidad de)']];
const ES_ALIAS = { 'santa eularia des riu': 'Santa Eulalia del Río', 'santa eularia': 'Santa Eulalia del Río', 'palma': 'Palma de Mallorca', 'malaga city': 'Málaga', 'velez malaga': 'Vélez Málaga', 'alicante': 'Alicante', 'calpe': 'Calpe', 'javea': 'Jávea' };
let MIDX = null;
function esMatch(x) {
  if (!MIDX) MIDX = Object.keys(ES.muni).map(k => [norm(k), k]).filter(a => a[0].length >= 4).sort((a, b) => b[0].length - a[0].length);
  const ar = norm(String(x.ar || '').replace(/\([^)]*\)/g, ' '));   // text in brackets ("Benahavis (Marbella)") is a nearby place, not the municipality
  let mk = null;
  for (const [a, k] of Object.entries(ES_ALIAS)) if (new RegExp('\\b' + a + '\\b').test(ar) && ES.muni[k]) { mk = k; break; }
  if (!mk) for (const [n, k] of MIDX) if (new RegExp('\\b' + n + '\\b').test(ar)) { mk = k; break; }
  const all = norm((x.ar || '') + ' ' + (x.mk || ''));
  const pv = (ES_PROV.find(([re]) => re.test(all)) || [])[1] || null;
  return { mk, pv };
}
// returns { html, cmp: [...] } for the project page section
export function ppmSection(x, lang = 'en') {
  const t = (k, v) => tl(lang, k, v);
  const fx = x.fx || {}, price = regSale(x) ? 0 : +fx.price_min, size = +fx.size_min_m2, cur = String(fx.currency || '').toUpperCase();   // n31d: not with registered sale prices
  const has = price > 0 && size >= 15 && size <= 5000;
  const own = has ? price / size : null;
  const none = why => '<p>' + esc(t('ppm_none')) + ' ' + esc(why) + '</p>' + note;
  const note = '<p class="ki">' + esc(t('ppm_note')) + ' <a href="/data-policy/">' + esc(t('ppm_how')) + '</a>.</p>';
  if (!has) return { html: none(t(price > 0 ? 'ppm_nb_size' : size > 0 ? 'ppm_nb_price' : 'ppm_nb')), cmp: [] };
  const ownLine = '<li class="kfact"><b>' + esc(t('ppm_own_b')) + '</b> ' + esc(t('ppm_own', { c: cur, v: fmt(own) })) + ' <small>' + esc(t('ppm_own_s', { c: cur, p: fmt(price), s: fmt(size) })) + '</small>' + (x.url ? src(x.url, t('ppm_devpage')) : '') + '</li>';
  const L = [];
  if (x.co === 'UAE' && x.mk === 'Dubai' && cur === 'AED' && DLD) {
    const { pk, ak } = dldMatch(x), per = t('ppm_per', { a: DLD.from, b: DLD.to });
    const dsrc = src('https://dubailand.gov.ae/en/open-data/real-estate-data/', t('ppm_dld_src'));
    if (pk) { const [m, n, a] = DLD.projects[pk]; L.push('<li class="kfact"><b>' + esc(t('ppm_dld_p_b')) + '</b> ' + esc(t('ppm_dld_p', { m: fmt(m), n, k: pk, per })) + ' ' + esc(pct(lang, own, m)) + dsrc + '</li>'); }
    if (ak) { const [m, n] = DLD.areas[ak]; L.push('<li class="kfact"><b>' + esc(t('ppm_dld_a_b')) + '</b> ' + esc(t('ppm_dld_a', { m: fmt(m), n, k: ak, per })) + ' ' + esc(pct(lang, own, m)) + dsrc + '</li>'); }
    if (!L.length) return { html: '<ul class="fl">' + ownLine + '</ul>' + none(t('ppm_dld_nm')), cmp: [] };
    return { html: '<ul class="fl">' + ownLine + L.join('') + '</ul><p class="ki">' + esc(t('ppm_dld_ki', { n: fmt(DLD.rows) })) + '</p>' + note, cmp: L.length };
  }
  if (x.co === 'Spain' && cur === 'EUR' && ES) {
    const { mk, pv } = esMatch(x), msrc = src(ES.src_muni, t('ppm_src_m')), psrc = src(ES.src_prov, t('ppm_src_p'));
    if (mk) { const [nw, tot] = ES.muni[mk], v = nw || tot; L.push('<li class="kfact"><b>' + esc(t('ppm_es_m_b')) + '</b> ' + esc(t('ppm_es_m', { v: fmt(v), m: mk, w: t(nw ? 'ppm_es_new' : 'ppm_es_all'), q: ES.muni_q })) + ' ' + esc(pct(lang, own, v)) + msrc + '</li>'); }
    if (pv && ES.prov[pv]) { const v = ES.prov[pv]; L.push('<li class="kfact"><b>' + esc(t('ppm_es_p_b')) + '</b> ' + esc(t('ppm_es_p', { v: fmt(v), p: pv.replace(/\/.*$/, '').replace(/^(.*) \((.*)\)$/, '$2 $1'), q: ES.prov_q })) + ' ' + esc(pct(lang, own, v)) + psrc + '</li>'); }
    if (!L.length) return { html: '<ul class="fl">' + ownLine + '</ul>' + none(t('ppm_es_nm')), cmp: [] };
    return { html: '<ul class="fl">' + ownLine + L.join('') + '</ul><p class="ki">' + esc(t('ppm_es_ki')) + '</p>' + note, cmp: L.length };
  }
  return { html: '<ul class="fl">' + ownLine + '</ul>' + none(x.co === 'UAE' && x.mk !== 'Dubai' ? t('ppm_uae', { m: x.mk }) : t('ppm_noset', { m: x.mk || x.co })), cmp: [] };
}

// x11b (batch 11): the same comparison as data for the Project X-ray card (kbx_xray_ev.js). x = { n, ar, mk, co, fx: { price_min,
// size_min_m2, currency } }, as on the named pages. Returns { own, cur, price, size, official: [...], why } (why = reason for no row).
export function ppmData(x) {
  const fx = x.fx || {}, price = +fx.price_min, size = +fx.size_min_m2, cur = String(fx.currency || '').toUpperCase();
  const out = { own: null, cur, price: price > 0 ? price : null, size: size > 0 ? size : null, official: [], why: null };
  if (!(price > 0 && size >= 15 && size <= 5000)) { out.why = price > 0 ? 'no_size' : size > 0 ? 'no_price' : 'no_price_size'; return out; }
  const own = out.own = price / size, d = v => Math.round((own / v - 1) * 100);
  if (!DLD) { out.why = 'not_loaded'; return out; }
  if (x.co === 'UAE' && x.mk === 'Dubai') {
    if (cur !== 'AED') { out.why = 'currency'; return out; }
    const { pk, ak } = dldMatch(x), per = DLD.from + ' to ' + DLD.to, u = 'https://dubailand.gov.ae/en/open-data/real-estate-data/';
    if (pk) { const [m, n, a] = DLD.projects[pk]; out.official.push({ name: 'Dubai Land Department, registered off-plan sales of DLD project ' + pk, value: m, unit: 'AED per m2 (median)', n, period: per, url: u, diff_pct: d(m), key: pk, area: a }); }
    if (ak) { const [m, n] = DLD.areas[ak]; out.official.push({ name: 'Dubai Land Department, registered off-plan sales in DLD area ' + ak, value: m, unit: 'AED per m2 (median)', n, period: per, url: u, diff_pct: d(m), key: ak }); }
    if (!out.official.length) out.why = 'no_match';
    return out;
  }
  if (x.co === 'Spain') {
    if (cur !== 'EUR') { out.why = 'currency'; return out; }
    const { mk, pv } = esMatch(x);
    if (mk) { const [nw, tot] = ES.muni[mk], v = nw || tot; out.official.push({ name: 'MIVAU appraised value of free-market housing, ' + mk + (nw ? ' (dwellings up to five years old)' : ' (all dwellings)'), value: v, unit: 'EUR per m2 (appraised, not a sale price)', period: ES.muni_q, url: ES.src_muni, diff_pct: d(v), key: mk }); }
    if (pv && ES.prov[pv]) { const v = ES.prov[pv]; out.official.push({ name: 'MIVAU appraised value of free-market housing, province of ' + pv, value: v, unit: 'EUR per m2 (appraised, not a sale price)', period: ES.prov_q, url: ES.src_prov, diff_pct: d(v), key: pv }); }
    if (!out.official.length) out.why = 'no_match';
    return out;
  }
  out.why = 'no_dataset'; return out;
}

// ---------------------------------------------------------------- company network (GLEIF level 2)
const GH = { accept: 'application/vnd.api+json', 'user-agent': 'KolaboroRegisterCheck/1.0 (+https://kolaboro.com/registers/)' };
async function gj(path) {
  const r = await fetch('https://api.gleif.org/api/v1/lei-records/' + path, { headers: GH, signal: AbortSignal.timeout(5000) });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('gleif ' + r.status);
  return r.json();
}
const ent = e => e && e.attributes && e.attributes.entity ? { lei: e.id, legal: e.attributes.entity.legalName.name, country: (e.attributes.entity.legalAddress || {}).country || '', st: e.attributes.entity.status } : null;
export async function gleifNet(lei, ctx) {
  if (!/^[A-Z0-9]{20}$/.test(String(lei || ''))) return null;
  const key = new Request(ORIGIN + '/__named_gleifnet/v1/' + lei);
  try { const hit = await caches.default.match(key); if (hit) return await hit.json(); } catch (e) {}
  let res;
  try {
    const [dp, up, ch, dx] = await Promise.all([gj(lei + '/direct-parent'), gj(lei + '/ultimate-parent'), gj(lei + '/direct-children?page%5Bsize%5D=10'), gj(lei + '/direct-parent-reporting-exception').catch(() => null)]);
    res = { ok: true, at: new Date().toISOString().slice(0, 10), parent: ent(dp && dp.data), ultimate: ent(up && up.data), children: ((ch && ch.data) || []).map(ent).filter(Boolean), children_total: (ch && ch.meta && ch.meta.pagination && ch.meta.pagination.total) || 0,
      exception: dx && dx.data && dx.data.attributes ? dx.data.attributes.reason : null };
  } catch (e) { res = { ok: false, at: new Date().toISOString().slice(0, 10) }; }
  try { const p = caches.default.put(key, new Response(JSON.stringify(res), { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=' + (res.ok ? 604800 : 1800) } })); if (ctx && ctx.waitUntil) ctx.waitUntil(p.catch(() => {})); } catch (e) {}
  return res;
}
const EXC = { NATURAL_PERSONS: 'it is controlled by natural persons', NON_CONSOLIDATING: 'the parent does not consolidate it', NO_KNOWN_PERSON: 'no known parent', NON_PUBLIC: 'the parent information is not public', BINDING_LEGAL_COMMITMENTS: 'binding legal commitments', LEGAL_OBSTACLES: 'legal obstacles', DISCLOSURE_DETRIMENTAL: 'disclosure would be detrimental', DETRIMENT_NOT_EXCLUDED: 'detriment not excluded', CONSENT_NOT_OBTAINED: 'consent not obtained' };
// m: the GLEIF match shown on the page ({lei, legal, country}); net: gleifNet(); L: our projects [{n, s, mk}]; pre: language prefix
export function networkHtml(name, m, net, L, pre, self, other, lang = 'en') {
  const t = (k, v) => tl(lang, k, v);
  const gl = lei => 'https://search.gleif.org/#/record/' + lei;
  const node = (cls, label, sub, href, ext, rel) => '<a class="kn-n ' + cls + '" href="' + esc(href) + '"' + (ext ? ' rel="nofollow noopener" target="_blank"' : '') + ' data-rel="' + esc(rel) + '"><b>' + esc(label) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</a>';
  const par = [], kids = [];
  if (m && net && net.ok) {
    if (net.ultimate && (!net.parent || net.ultimate.lei !== net.parent.lei)) par.push(node('kn-g', net.ultimate.legal, t('net_up') + ' · ' + net.ultimate.country + ' · LEI ' + net.ultimate.lei, gl(net.ultimate.lei), 1, t('net_r_up', { m: m.legal })));
    if (net.parent) par.push(node('kn-g', net.parent.legal, t('net_dp') + ' · ' + net.parent.country + ' · LEI ' + net.parent.lei, gl(net.parent.lei), 1, t('net_r_dp', { m: m.legal })));
    for (const c of net.children.slice(0, 8)) kids.push(node('kn-g', c.legal, t('net_sub') + ' · ' + c.country + ' · LEI ' + c.lei, gl(c.lei), 1, t('net_r_ch', { m: m.legal })));
  }
  const proj = L.slice(0, 14).map(x => node('kn-p', x.n, x.mk, pre + '/projects/' + x.s + '/', 0, t('net_r_pr', { n: name })));
  const centre = '<div class="kn-row kn-mid">' + node('kn-d', name, m ? m.legal + ' · LEI ' + m.lei : t('net_nolei'), m ? gl(m.lei) : self + '#registers', !!m, m ? t('net_r_rec', { m: m.legal }) : t('net_r_norec')) + '</div>';
  const facts = [];
  if (!m && other) facts.push(t('net_other', { l: other.legal, c: other.country || other.jur || '?' }));
  else if (!m) facts.push(t('net_none'));
  else if (!net || !net.ok) facts.push(t('net_err'));
  else {
    facts.push(net.parent ? t('net_par', { l: net.parent.legal }) : net.exception ? t('net_nopar_r', { r: EXC[net.exception] ? t('net_x_' + net.exception) : net.exception.toLowerCase().replace(/_/g, ' ') }) : t('net_nopar'));
    const k = net.children_total;
    facts.push(!k ? t('net_nokids') : k === 1 ? t('net_kids1') : t(k > 8 ? 'net_kids8' : 'net_kids', { k }));
  }
  facts.push(L.length === 1 ? t('net_track1', { n: name }) : t(L.length > 14 ? 'net_track14' : 'net_track', { k: L.length, n: name }));
  const srcL = m ? src('https://api.gleif.org/api/v1/lei-records/' + m.lei + '/direct-children', 'api.gleif.org') : src('https://search.gleif.org/', 'search.gleif.org');
  return '<p class="ki">' + esc(t('net_intro')) + (net && net.at ? ' ' + esc(t('net_read', { d: (() => { try { return new Intl.DateTimeFormat(LOCALE[lang] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(net.at + 'T00:00:00Z')); } catch (e) { return net.at; } })() })) : '') + '</p>' +
    '<ul class="fl">' + facts.map((f, i) => '<li class="kfact">' + esc(f) + (i === facts.length - 1 ? src(ORIGIN + self + '#projects', 'kolaboro.com') : srcL) + '</li>').join('') + '</ul>' +
    '<div class="knet" data-knet><svg class="kn-e" aria-hidden="true"></svg>' + (par.length ? '<div class="kn-row">' + par.join('') + '</div>' : '') + centre + (kids.length ? '<div class="kn-row">' + kids.join('') + '</div>' : '') + (proj.length ? '<div class="kn-row kn-pr">' + proj.join('') + '</div>' : '') +
    '<p class="kn-cap" aria-live="polite"></p></div>';
}
export const NET_CSS = '<style id="knet-css">.knet{position:relative;margin:16px 0;padding:14px 10px;border:1px solid var(--line);border-radius:18px;background:var(--card,var(--paper))}.kn-e{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}.kn-e path{fill:none;stroke:var(--line);stroke-width:1.5}.kn-e path.on{stroke:var(--hivis,#FF5B14);stroke-width:2.5}' +
  '.kn-row{position:relative;display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin:0 0 34px}.kn-row:last-of-type{margin-bottom:8px}.kn-n{position:relative;z-index:1;display:flex;flex-direction:column;max-width:min(260px,100%);padding:8px 12px;border:1.5px solid var(--ink);border-radius:12px;background:var(--paper);color:var(--ink);text-decoration:none;font-size:.9rem;line-height:1.25;min-height:44px;justify-content:center;overflow-wrap:anywhere}' +
  '.kn-n small{color:var(--muted);font-size:.76rem;margin-top:2px}.kn-d{border-width:2.5px;font-size:1rem}.kn-g{border-style:dashed}.kn-p{border-color:var(--line)}.kn-n:hover,.kn-n:focus-visible,.kn-n.on{border-color:var(--hivis,#FF5B14);outline:none;box-shadow:0 0 0 3px rgba(255,91,20,.18)}.kn-cap{min-height:1.4em;margin:6px 4px 0;font-size:.88rem;color:var(--ink-2);text-align:center}' +
  '@media(max-width:640px){.kn-row{gap:8px;margin-bottom:26px}.kn-n{max-width:100%;font-size:.86rem}.kn-pr .kn-n{max-width:calc(50% - 4px)}}</style>';
export const NET_JS = "(function(){document.querySelectorAll('[data-knet]').forEach(function(w){var s=w.querySelector('.kn-e'),d=w.querySelector('.kn-d'),cap=w.querySelector('.kn-cap'),ns='http://www.w3.org/2000/svg';if(!s||!d)return;var nodes=[].slice.call(w.querySelectorAll('.kn-n')).filter(function(n){return n!==d;});" +
  "function draw(){while(s.firstChild)s.removeChild(s.firstChild);var b=w.getBoundingClientRect(),r=d.getBoundingClientRect(),cx=r.left+r.width/2-b.left;nodes.forEach(function(n){var q=n.getBoundingClientRect(),x=q.left+q.width/2-b.left,above=q.bottom<=r.top,y1=above?q.bottom-b.top:q.top-b.top,y2=above?r.top-b.top:r.bottom-b.top,m=(y1+y2)/2;" +
  "var p=document.createElementNS(ns,'path');p.setAttribute('d','M'+x+' '+y1+' C'+x+' '+m+' '+cx+' '+m+' '+cx+' '+y2);if(n.classList.contains('on'))p.setAttribute('class','on');n._p=p;s.appendChild(p);});}" +
  "function on(n){nodes.concat([d]).forEach(function(k){k.classList.toggle('on',k===n);if(k._p)k._p.setAttribute('class',k===n?'on':'');});cap.textContent=n.getAttribute('data-rel')||'';}" +
  "nodes.concat([d]).forEach(function(n){n.addEventListener('mouseenter',function(){on(n);});n.addEventListener('focus',function(){on(n);});});draw();var t;window.addEventListener('resize',function(){clearTimeout(t);t=setTimeout(draw,120);});if(window.ResizeObserver)new ResizeObserver(function(){clearTimeout(t);t=setTimeout(draw,60);}).observe(w);});})();";

// ---------------------------------------------------------------- corporate family (n19e, batch 19)
// /data/gleif-family.json, rebuilt weekly by .github/workflows/kolaboro-gleif-family.yml on main (tools/kolaboro-w/gleif_family.py):
// every named developer matched to ONE LEI by exact legal name plus country, with its GLEIF level 2 relationships (CC0), and the
// links between developers we track (parent, child, or the same reported parent). Used on developer pages when the live lookup finds
// no exact LEI, and to list the other tracked developers in the same family. Companies only: GLEIF holds no people.
let FAM = { t: 0, v: null };
export async function familyData(env) {
  if (FAM.v !== null && Date.now() - FAM.t < 600000) return FAM.v;
  let r = null;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/gleif-family.json')); } catch (e) { r = null; }
  if (!r || !r.ok) { try { r = await fetch(ORIGIN + '/data/gleif-family.json?w=1', { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
  const v = r && r.ok ? await r.json().catch(() => null) : null;
  FAM = { t: Date.now(), v: v || false }; return v;
}
// the file's entry for one developer, shaped like the live lookup (m) and gleifNet() (net)
export function famNet(fam, s) {
  const o = fam && fam.devs && fam.devs[s]; if (!o) return null;
  const at = String(fam.updated || '').slice(0, 10);
  return { m: { lei: o.lei, legal: o.legal, country: o.country, jur: o.jur || o.country, st: o.st, ls: o.reg, reg: o.since || '' },
    net: { ok: true, at, parent: o.parent, ultimate: o.ultimate, children: o.children || [], children_total: o.children_total || 0, exception: o.parent ? null : o.parent_x } };
}
const FT = TB.kbx_named_plus_FT /* n40 k5: in /data/i18n/kbx_named_plus.json */;
// s: this developer's slug; pre: language prefix. Empty when the developer has no LEI in the file.
export function familyHtml(fam, s, lang, pre) {
  const o = fam && fam.devs && fam.devs[s]; if (!o) return '';
  const t = (k, v) => { const x = (FT[lang] && FT[lang][k]) || FT.en[k]; return v ? x.replace(/\{(\w+)\}/g, (m, y) => v[y] != null ? v[y] : m) : x; };
  const D = fam.devs, d = String(fam.updated || '').slice(0, 10), rec = l => 'https://search.gleif.org/#/record/' + l;
  const dl = x => '<a href="' + pre + '/developers/' + esc(x) + '/">' + esc(D[x].name) + '</a>';
  const co = x => esc(D[x].legal) + ' (' + dl(x) + ')';
  const items = [];
  for (const L of fam.links || []) {
    if (L.a !== s && L.b !== s) continue;
    const other = L.a === s ? L.b : L.a, A = D[s], B = D[other]; if (!A || !B) continue;
    for (const why of L.why) {
      let html = '', lei = D[other].lei;
      if (why === 'parent' || why === 'ultimate' || why === 'child') {
        const pl = (x, k) => (x[k] || {}).lei, kid = (x, y) => (x.children || []).some(c => c.lei === y.lei);
        const r = pl(B, 'parent') === A.lei || kid(A, B) ? ['parent', s, other] : pl(B, 'ultimate') === A.lei ? ['ultimate', s, other]
          : pl(A, 'parent') === B.lei || kid(B, A) ? ['parent', other, s] : ['ultimate', other, s];
        html = t(r[0], { a: co(r[1]), b: co(r[2]) });
      } else {
        const k = why === 'same_parent' ? 'parent' : 'ultimate';
        html = t(why, { a: co(s), b: co(other), p: esc((A[k] || {}).legal || '') }); lei = (A[k] || {}).lei || lei;
      }
      items.push('<li class="kfact">' + html + src(rec(lei), t('src')) + '</li>');
    }
  }
  return '<h3 class="kfam-h">' + esc(t('h')) + '</h3><ul class="fl">' + (items.length ? [...new Set(items)].join('') : '<li class="kfact">' + esc(t('none', { d })) + src(ORIGIN + '/data/gleif-family.json', 'gleif-family.json') + '</li>') + '</ul>' +
    (items.length ? '<p class="ki">' + esc(t('note')) + '</p>' : '');
}
