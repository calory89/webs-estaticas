// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_n31e__q, $s = TB.kbx_n31e__s, $t = TB.kbx_n31e__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TB } from './kbx_strings.js';
let S = { en: {} }, VISA = [], INH = [], MORT = [], CRC = { countries: [] }, LD31 = null;
async function L31(env) {
if (LD31) return LD31;
LD31 = (async () => {
let d = null;
try { if (env && env.ASSETS) { const r = await env.ASSETS.fetch(new Request($t.k0)); if (r.ok) d = await r.json(); } } catch (e) {}
if (!d) { try { const r = await fetch($t.k1, { cf: { cacheTtl: 300 } }); if (r.ok) d = await r.json(); } catch (e) {} }
if (!d || !d.S) { LD31 = null; throw new Error($q.a); }
({ S, VISA, INH, MORT, CRC } = d); return d;
})();
return LD31;
}
export const N31V = 'e2';
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const COI_RX = /eco\s*beach\s*city|\bequinox\b/i;
const pre = l => l === 'en' ? '' : '/' + l;
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.b, "'": '&#39;' }[c]));
const bdi = s => '<bdi>' + esc(s) + $q.c;
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const t31 = (lang, k, v) => { let s = (S[lang] && S[lang][k] != null) ? S[lang][k] : S.en[k]; if (s == null) s = k; if (typeof s === $q.d && v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b); return s; };
const nf = (n, lang, o) => { try { return Number(n).toLocaleString(LOC[lang] || 'en-GB', o || { maximumFractionDigits: 1 }); } catch (e) { return String(n); } };
const fdate = (d, lang) => { try { return new Intl.DateTimeFormat(LOC[lang] || 'en-GB', { day: $q.e, month: 'long', year: $q.e, timeZone: 'UTC' }).format(new Date(String(d).slice(0, 10) + $q.f)); } catch (e) { return String(d); } };
const country = (cc, lang) => { try { return new Intl.DisplayNames([LOC[lang] || 'en'], { type: $q.g }).of(cc); } catch (e) { return cc; } };
const CC = { UAE: 'AE', Indonesia: 'ID', Thailand: 'TH', Spain: 'ES', USA: 'US', Mexico: 'MX', Malaysia: 'MY', France: 'FR', Turkey: 'TR', Portugal: 'PT', Australia: 'AU', Vietnam: 'VN', Philippines: 'PH', Japan: 'JP', 'United Kingdom': 'GB', Poland: 'PL', Brazil: 'BR', Egypt: 'EG', 'Sri Lanka': 'LK', Greece: 'GR', Cyprus: 'CY', Oman: 'OM', Georgia: 'GE', Cambodia: 'KH', Canada: 'CA', 'Dominican Republic': 'DO', Tanzania: 'TZ', Morocco: 'MA', Mauritius: 'MU', Kenya: 'KE', 'Costa Rica': 'CR', Colombia: 'CO', Montenegro: 'ME', 'Saudi Arabia': 'SA', Panama: 'PA', India: 'IN', Malta: 'MT', Germany: 'DE', Croatia: 'HR', Bahrain: 'BH', Qatar: 'QA', Italy: 'IT', Albania: 'AL', Bulgaria: 'BG' };
const JT = 'application/json; charset=utf-8';
const jr = (o, st, cc) => new Response(JSON.stringify(o, null, st === 200 || !st ? 1 : 0), { status: st || 200, headers: { 'content-type': JT, 'cache-control': cc || $q.h, 'access-control-allow-origin': '*', 'x-content-type-options': $q.i } });
const srcA = s => s ? $q.j + esc(s.u) + $q.k + esc(s.n) + '</a>' : '';
const readOn = (lang, d) => d ? $q.l + esc(t31(lang, $q.m, { d: fdate(d, lang) })) + $q.n : '';
const nameOf = x => String(x.n || x.id);
const clean = x => !COI_RX.test(String(x.n || '') + ' ' + String(x.dv || ''));
// n40 k25: ?project=<slug> on worker tools (visa, on time, area report, inheritance, mortgages): fills from the record, a note says what was filled, the address keeps the inputs
async function upPrj(env, u) { const s = String((u && u.searchParams.get($q.o)) || '').toLowerCase(); if (!/^[a-z0-9-]{1,120}$/.test(s)) return null; try { const N = await import('./kbx_named.js'), ix = await N.data(env), x = ix.bySlug.get(s); const H = await import('./kbx_hdate.js'); return x && clean(x) ? { x, ix, N, s, H } : { s, miss: true }; } catch (e) { return null; } }
function upNote(lang, U, bits, extra) { if (!U) return ''; const st = $q.p; if (U.miss) return $q.q + st + $q.r + esc(t31(lang, 'up_nf')) + '</p>'; const x = U.x, a = $q.s + pre(lang) + $q.t + esc(x.s) + '/">' + bdi(nameOf(x)) + '</a>';
return $q.q + st + $q.u + esc(t31(lang, $q.v)).replace('{p}', a).replace('{m}', esc(U.H.mkName(x.mk || '', lang))) + (bits && bits.length ? ': ' + bits.join(lang === 'ar' ? '؛ ' : lang === 'zh' ? '；' : '; ') : '') + '.' + (extra ? ' ' + extra : '') + ' ' + esc(t31(lang, $q.w)) + '</p>'; }
const upHid = U => U && U.s ? $q.x + esc(U.s) + '">' : '';
const upV = (k, lang, v) => esc(t31(lang, k)).replace('{v}', $q.y + esc(v) + $q.c);
const ym = (k, lang) => { try { return new Intl.DateTimeFormat(LOC[lang] || 'en-GB', { month: 'short', year: $q.e, timeZone: 'UTC' }).format(new Date(k + $q.z)); } catch (e) { return k; } };
const kindOf = st => st === $q.A ? 'done' : st === $q.B ? 'uc' : 'op';
let ECBR = null;
async function perUsd() {
if (ECBR && Date.now() - ECBR.t < 43200000) return ECBR.v;
try {
const r = await fetch($t.k2, { cf: { cacheTtl: 21600, cacheEverything: true }, headers: { 'user-agent': $t.k3 } });
const t = await r.text(), eu = { EUR: 1 }; for (const m of t.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([\d.]+)['"]/g)) eu[m[1]] = +m[2];
if (!eu.USD) throw 0;
const v = { d: (/time=['"](\d{4}-\d\d-\d\d)/.exec(t) || [])[1] || null, r: {} };
for (const [c, x] of Object.entries(eu)) v.r[c] = x / eu.USD;
v.r.USD = 1; v.r.AED = 3.6725;
ECBR = { t: Date.now(), v }; return v;
} catch (e) { ECBR = { t: Date.now() - 43200000 + 600000, v: null }; return null; }
}
const toUsd = (fx, amt, cur) => fx && fx.r[cur] ? amt / fx.r[cur] : null;
const relList = (lang, me) => '<h2>' + esc(t31(lang, 'rel_h')) + $q.C + $t.o_REL.filter(k => k !== me).map(k => $q.D + pre(lang) + $q.E + k + '/">' + esc(t31(lang, k + '_h1')) + $q.F).join('') +
$q.D + pre(lang) + $q.G + esc(t31(lang, $q.H)) + $q.I + pre(lang) + $q.J + esc(t31(lang, 'sm_h1')) + $q.I + pre(lang) + $q.K + esc(t31(lang, 'nw_h1')) + $q.L + esc(t31(lang, $q.M)) + $q.N;
const script = '<script src="/k/n31e.js?v=' + N31V + '" defer></script>';
function frame(lang, path, key, inner, o) {
o = o || {};
const P = pre(lang), crumb = $q.O + P + $q.P + (o.crumb || $q.Q + esc(t31(lang, $q.R)) + '</a>') + '</p>';
return $t.k4 + crumb + '<h1>' + esc(t31(lang, key + '_h1')) + $q.S + esc(t31(lang, key + '_lead')) + '</p>' + (o.priv ? $q.T + esc(o.priv) + $q.U : '') + $q.V +
$t.k5 + key + $q.W + esc(JSON.stringify(o.m || {})) + '">' + inner + (o.norel ? '' : relList(lang, o.me)) + $q.X + $s.CSS + (o.noscript ? '' : script);
}
async function page(lang, shell, key, path, body, o) {
  o = o || {};
  const N = await import('./kbx_named.js');
  const canon = ORIGIN + pre(lang) + path, name = t31(lang, key + '_h1');
  const ld = { '@context': $q.Y, '@graph': [Object.assign({ '@type': o.type || $q.Z, name, description: t31(lang, key + '_d'), url: canon, inLanguage: lang, isPartOf: { '@type': $q.aa, name: $q.ab, url: ORIGIN + '/' } },
    (o.type || $q.Z) === $q.Z ? { applicationCategory: $q.ac, operatingSystem: $q.ad, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } } : {}, o.ldx || {}),
    { '@type': $q.ae, itemListElement: [{ '@type': $q.af, position: 1, name: $q.ab, item: ORIGIN + pre(lang) + '/' }, { '@type': $q.af, position: 2, name: o.bcName || t31(lang, $q.R), item: ORIGIN + (o.bcPath || $q.E) }, { '@type': $q.af, position: 3, name, item: canon }] }] };
  const pg = { title: t31(lang, key + '_t') + $q.ag, desc: t31(lang, key + '_d'), canon, body, alt: l => ORIGIN + pre(l) + path, lastmod: o.lastmod || $q.ah, ld, noindex: !!o.noindex };
  const sh = await shell(pre(lang) + $q.ai); if (!sh || sh.status !== 200) return null;
  const html = await N.assemble(pg, lang, sh);
  return new Response(html, { status: 200, headers: Object.assign({ 'content-type': $q.aj, 'cache-control': $q.h }, o.noindex ? { 'x-robots-tag': $q.ak } : {}) });
}
const norm = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9Ѐ-ӿ؀-ۿ一-鿿]+/g, ' ').trim();
let FIX = null;
async function findIndex(ix) {
if (FIX && FIX.ix === ix) return FIX;
const L = ix.P.filter(clean).map(x => ({ x, n: norm(x.n), d: norm(x.dv), a: norm([x.ar, x.mk, x.co].filter(Boolean).join(' ')) }));
FIX = { ix, L }; return FIX;
}
let SAL = null;
async function aliases(env) {
if (SAL) return SAL;
let d = null; try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $t.k6)); if (r.ok) d = await r.json(); } catch (e) {}
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
handover: h ? String(h.d) : null, last_checked: N.lastmod(ix, x) || null, url: ORIGIN + pre(lang || 'en') + $q.t + x.s + '/' };
}
export function handoverRecord(ix, N, x, H) {
H = H || { hkey: d => String(d) };
const fx = x.fx || {}, pr = (ix.prom[x.id] || []).find(p => p && p.k === $q.al), ev = [];
if (fx.original_handover) ev.push({ date: String(fx.original_handover).replace(/\s*\(.*$/, ''), kind: $q.am, note: String(fx.original_handover), source: $q.an, seen: null });
for (const e of ((pr && pr.hist) || [])) if (e && e.d) ev.push({ date: String(e.d), kind: e.src === 'page' ? $q.ao : (e.src || $q.ap), seen: e.seen || null, last_seen: e.last || null, source: e.src || null });
const hk = d => { try { return H.hkey(d) || String(d); } catch (e) { return String(d); } };
if (fx.handover_promised && !ev.some(e => hk(e.date) === hk(fx.handover_promised))) ev.push({ date: String(fx.handover_promised), kind: $q.ap, seen: null, source: $q.an });
ev.sort((a, b) => String(a.seen || '0000').localeCompare(String(b.seen || '0000')) || String(a.date).localeCompare(String(b.date)));
const h = N.handoverOf(ix, x), distinct = [...new Set(ev.map(e => hk(e.date)))];
const c = ix.caseBy.get(x.id) || {};
return { id: x.id, slug: x.s, name: nameOf(x), developer: x.dv || null, market: x.mk || null, stage: c.stage || x.st || null, current: h ? String(h.d) : null, moves: pr ? (pr.mv || 0) : 0,
delay_months: fx.delay_months != null ? fx.delay_months : null, distinct_dates: distinct.length, events: ev, developer_page: N.okHttp(x.url) ? x.url : null,
page: ORIGIN + $q.t + x.s + '/', timeline: ORIGIN + $q.t + x.s + $q.aq, licence: $t.k7,
note: $s.k0 };
}
function findPage(lang, key) {
const w = (k, v) => t31(lang, k, v);
const M = { k: key, ph: w('fl_ph'), go: w('fl_go'), wait: w($q.ar), none: w($q.as), err: w($q.at), how: { u: w('how_u'), d: w('how_d'), n: w('how_n'), nn: w($q.au), g: w('how_g'), v: w('how_v'), q: w('how_q') },
th: w('hh_th'), kinds: w($q.av), cur: w($q.aw), moves: w($q.ax), open: w($q.ay), tl: w('fl_tl'), hist: w($q.az), dev: w($q.aA), st: w('stage'), ho: w('fl_ho'), ck: w('fl_ck'), more: w($q.aB), first: w($q.aC) };
const inner = $t.k8 + esc(w(key === $q.aD ? $q.aE : $q.aF)) + $s.k1 + esc(w('fl_ph')) + $q.aG +
$t.k9 + esc(w('fl_go')) + $s.k2 +
'<h2>' + esc(w($q.aH)) + $q.aI + w($q.aJ).map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>' +
$q.aK + esc(w($q.aL)) + $s.k3 + $q.aM + esc(w($q.aN)) + $q.aO;
return frame(lang, $q.E + key + '/', key, inner, { m: M, me: key, priv: w(key === $q.aD ? $q.aP : $q.aQ) });
}
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
async function visaPage(env, lang, u) {
const { rows, fx } = await visaData(env), w = (k, v) => t31(lang, k, v), P = pre(lang), U = await upPrj(env, u), F = (U && U.x && U.x.fx) || {};
const CU = ['USD', 'EUR', 'GBP', 'AED', 'TRY'], q = u ? u.searchParams : new URLSearchParams(); let bv = +String(q.get('b') || '').replace(/[^\d.]/g, '') || 0, bc = String(q.get('c') || '').toUpperCase(), bits = [];
if (!bv && F.price_min > 0) { bv = Math.round(F.price_min); bc = String(F.currency || 'USD').toUpperCase(); bits.push(upV('up_pr', lang, bc + ' ' + nf(bv, 'en', { maximumFractionDigits: 0 }))); }
if (bc && !CU.includes(bc) && fx && fx.r[bc]) CU.push(bc); if (!CU.includes(bc)) bc = '';
const ucc = U && U.x ? CC[U.x.co] : null;
const card = r => {
const cls = r.st === 'open' ? 'is-ok' : r.st === $q.aR ? 'is-no' : $q.aS;
let h = $q.aT + cls + $q.aU + r.k + $q.aV + (r.min_usd || '') + '"' + (ucc && r.cc === ucc ? $q.aW : '') + '><h3>' + esc(country(r.cc, lang)) + ': ' + esc(w('vs_' + r.st)) + $q.aX + esc((VISA.find(v => v.k === r.k).t[lang]) || VISA.find(v => v.k === r.k).t.en) + '</p>' +
$q.aY + (r.src.ql || 'en') + $q.aZ + esc(r.q) + $q.ba + esc(w($q.bb)) + ': ' + srcA(r.src) + readOn(lang, r.src.d) + '</p>';
if (r.st === 'open') {
h += $q.bc + esc(w($q.bd, { k: nf(r.projects.length, lang), n: nf(r.priced, lang), t: nf(r.tracked, lang) })) + $q.U;
if (r.projects.length) h += $q.be + esc(w($q.bf)) + $q.bg + r.projects.map(p => $q.bh + P + $q.t + p.s + '/">' + bdi(p.n) + $q.bi + esc(w('from')) + ' ' + esc(nf(p.p, lang, { maximumFractionDigits: 0 })) + ' ' + esc(p.cur) + $q.bj).join('') + $q.bk;
}
return h + $q.bl;
};
const inner = upNote(lang, U, bits) + ($t.k10 + esc(w($q.bm)) + $s.k4).replace($q.bn, $q.bo + (bv > 0 ? $q.bp + bv + '"' : '')).replace($q.bq, $q.br) + esc(w($q.bs)) + $q.bt + CU.map(c => $q.bu + (c === bc ? $q.bv : '') + '>' + c + $q.bw).join('') + $t.k11 + esc(w('v_go')) + $t.k12 +
rows.map(card).join('') + $q.aK + esc(w($q.bx, { d: fx ? fdate(fx, lang) : '?' })) + $q.by + esc(w($q.bz)) + '</p>';
const M = { fx: (await perUsd()) ? (await perUsd()).r : null, msg: { ok: w('v_ok'), no: w('v_no') } };
return frame(lang, $q.bA, $q.bB, inner, { m: M, me: $q.bB });
}
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
const OWN = { ID: $q.bC, TH: $q.bD, MX: $q.bE, AU: $q.bF, CA: $q.bG, TR: $q.bH };
const byKey = (cc, nk) => { const pl = D.PLAN[GUIDE[cc]] || {}; for (const st of Object.values(pl)) for (const [k, srcs] of st) if (k === nk) return srcs; return null; };
const mk = (nk, srcs) => { const tx = D.NT[nk] && (D.NT[nk][lang] || D.NT[nk].en); return tx ? { tx: firstSentence(tx), s: D.SRC[srcs[0]] } : null; };
const note = (cc, step) => { if (step === 'land' && cc === 'AE' && D.P29) return { tx: D.P29.AE_L7[lang] || D.P29.AE_L7.en, s: Object.assign({}, D.P29.LAW.ae_l7, { d: D.P29.LAW.ae_l7.d }) }; if (step === 'land' && OWN[cc]) { const sr = byKey(cc, OWN[cc]); if (sr) return mk(OWN[cc], sr); } const pl = D.PLAN[GUIDE[cc]], st = pl && pl[step]; if (!st || !st.length) return null; return mk(st[0][0], st[0][1]); };
const cell = (cc, html) => $q.bI + esc(country(cc, lang)) + '">' + html + '</td>';
const lnk = (s) => s ? $q.bJ + esc(/^\//.test(s.u) ? P + s.u : s.u) + '"' + (/^\//.test(s.u) ? '' : $q.bK) + '>' + esc(s.n) + '</a>' + (s.d ? ' · ' + esc(t31(lang, $q.m, { d: fdate(s.d, lang) })) : '') + $q.n : '';
const R = [];
R.push([w($q.bL), cc => '<b>' + nf(D.per[cc].k, lang) + $q.bM + P + $q.bN + ({ AE: 'uae', US: 'usa' }[cc] || String(country(cc, 'en')).toLowerCase().replace(/[^a-z]+/g, '-')) + '/">' + esc(w($q.bO)) + $q.bP]);
R.push([w($q.bQ), cc => { const n = note(cc, 'land'); return n ? esc(n.tx) + lnk(n.s) : $q.bR + esc(w($q.bS)) + $q.bT; }]);
R.push([w($q.bU), cc => { const n = note(cc, 'money'); return n ? esc(n.tx) + lnk(n.s) : $q.bR + esc(w($q.bS)) + $q.bT; }]);
R.push([w($q.bV), cc => { const o = D.per[cc]; return '<b>' + nf(Math.round(o.pn / o.k * 100), lang) + $q.bW + esc(w('cc_of', { a: nf(o.pn, lang), b: nf(o.k, lang) })) + $q.n; }]);
R.push([w($q.bX), cc => { const o = D.per[cc]; return '<b>' + nf(Math.round(o.esc / o.k * 100), lang) + $q.bW + esc(w('cc_of', { a: nf(o.esc, lang), b: nf(o.k, lang) })) + $q.n; }]);
R.push([w($q.bY), cc => { const o = D.per[cc]; return o.med != null ? '<b>' + esc(w($q.bZ, { m: nf(o.med, lang) })) + $q.ca + esc(w('cc_n', { n: nf(o.nlate, lang) })) + $q.cb + P + $q.cc + esc(w($q.cd)) + $q.bP : $q.bR + esc(w($q.ce, { n: nf(o.nlate, lang) })) + $q.bT; }]);
R.push([w($q.cf), cc => { const v = VISA.find(z => z.cc === cc); if (!v) return $q.bR + esc(w($q.cg)) + $q.bT; return '<b>' + esc(w('vs_' + v.st)) + '</b>' + (v.st === 'open' ? ' ' + esc(nf(v.min, lang, { maximumFractionDigits: 0 }) + ' ' + v.cur) : '') + $q.ch + P + $q.ci + v.k + '">' + esc(w($q.cj)) + $q.bP; }]);
R.push([w($q.ck), cc => { const v = INH.find(z => z.cc === cc); if (!v) return $q.bR + esc(w($q.cl)) + $q.bT; return esc(v.t[lang] || v.t.en) + $q.ch + P + $q.cm + v.k + '">' + esc(w($q.cn)) + $q.bP; }]);
R.push([w($q.co), cc => D.rulesN[cc] ? $q.s + P + $q.cp + esc(w($q.cq, { n: nf(D.rulesN[cc], lang) })) + '</a>' : $q.bR + esc(w($q.cr)) + $q.bT]);
R.push([w($q.cs), cc => TCP[cc] ? $q.ct + TCP[cc] + '/">' + esc(w($q.cu)) + '</a>' : $q.cv + esc(w($q.cw)) + '</a>']);
R.push([w($q.cx), cc => $q.s + P + $q.cy + GUIDE[cc] + '/">' + esc(w($q.cz)) + '</a>']);
const table = $t.k13 + esc(w($q.cA)) + '</th>' + pick.map(cc => $q.cB + esc(country(cc, lang)) + '</th>').join('') + $q.cC +
R.map(([h, f]) => $q.cD + esc(h) + '</th>' + pick.map(cc => cell(cc, f(cc))).join('') + '</tr>').join('') + $q.cE;
const form = $t.k14 + P + $t.k15 + esc(w($q.cF)) + $q.cG +
all.map(cc => $s.k5 + cc + '"' + (pick.includes(cc) ? $q.cH : '') + $q.cI + esc(country(cc, lang)) + $q.cJ).join('') +
$t.k16 + pick.join(',') + $t.k17 + esc(w('cc_go')) + $q.cK;
const inner = form + table + $q.aK + esc(w($q.cL, { d: fdate(D.day, lang) })) + $q.by + esc(w($q.bz)) + '</p>';
return frame(lang, $q.cM, $q.cN, inner, { me: $q.cN });
}
async function onTimePage(env, lang, u) {
const N = await import('./kbx_named.js'), ix = await N.data(env), A = await import('./kbx_n30a.js'), S0 = A.slipStats(ix, N.handoverOf), w = (k, v) => t31(lang, k, v), P = pre(lang), H = await import('./kbx_hdate.js');
const R = S0.rows.filter(r => r.tracked >= 5).sort((a, b) => String(H.mkName(a.mk, lang)).localeCompare(String(H.mkName(b.mk, lang))));
const U = await upPrj(env, u), q = u ? u.searchParams : new URLSearchParams(), bits = []; let omk = String(q.get('mk') || ''), od = /^20\d\d-\d\d$/.test(q.get('d') || '') ? q.get('d') : '';
if (U && U.x) { if (!q.has('mk') && R.some(r => r.mk === U.x.mk)) { omk = U.x.mk; bits.push(upV('up_mk', lang, H.mkName(omk, lang))); } const ho = N.handoverOf(ix, U.x); if (!od && ho) { const k = H.hkey ? H.hkey(ho.d) : null; if (k && k >= $q.cO && k <= $q.cP) { od = k; bits.push(upV('up_ho', lang, String(ho.d))); } } }
if (!R.some(r => r.mk === omk)) omk = '';
const opts = R.map(r => $q.cQ + esc(r.mk) + '"' + (r.mk === omk ? $q.bv : '') + '>' + esc(H.mkName(r.mk, lang)) + ' (' + nf(r.tracked, lang) + $q.cR).join('');
const M = { rows: Object.fromEntries(R.map(r => [r.mk, { n: r.n, med: r.med, p25: r.p25, p75: r.p75, min: r.min, max: r.max, done: r.done, notdue: r.notdue, k: r.tracked }])), all: { n: S0.all.n, med: S0.all.med, p25: S0.all.p25, p75: S0.all.p75 },
msg: { res: w($q.cS), few: w($q.cT), est: w($q.cU), bad: w($q.cV), none: w($q.cW), pick: w($q.cX) }, LOC: LOC[lang], day: S0.day };
const inner = upNote(lang, U, bits) + $t.k18 + esc(w('ot_mk')) + $t.k19 + esc(w($q.cY)) + $q.bw + opts + $q.cZ +
$q.da + esc(w($q.db)) + $t.k20.replace($q.dc, $q.dc + (od ? $q.bp + od + '"' : '')) +
$t.k21 + esc(w('ot_go')) + $s.k6 +
'<h2>' + esc(w($q.dd)) + $q.aI + w('ot_m').map(s => '<li>' + esc(s) + '</li>').join('') + $q.de + P + $q.cc + esc(w($q.df)) + $q.aO;
return frame(lang, $q.dg, $q.dh, inner, { m: M, me: $q.dh });
}
async function reqDocPage(env, lang, u) {
const w = (k, v) => t31(lang, k, v);
let pj = null; const sl = String(u.searchParams.get('p') || '').toLowerCase();
if (/^[a-z0-9-]{1,90}$/.test(sl)) { try { const N = await import('./kbx_named.js'), ix = await N.data(env), x = ix.bySlug.get(sl); if (x && clean(x)) pj = { n: nameOf(x), dv: x.dv || '', s: x.s }; } catch (e) {} }
const docs = [$q.di, 'land', $q.dj, $q.dk, 'plan', $q.dl, $q.dm, $q.dn];
const tpl = {}; for (const l of LANGS) tpl[l] = { sub: t31(l, $q.do), hi: t31(l, 'rd_hi'), intro: t31(l, $q.dp), docs: Object.fromEntries(docs.map(d => [d, t31(l, $q.dq + d)])), close: t31(l, $q.dr), sig: t31(l, $q.ds), unit: t31(l, $q.dt) };
const M = { tpl, pj, copied: w($q.du), name: { en: $q.dv, es: $q.dw, de: $q.dx, fr: $q.dy, nl: $q.dz, ru: $q.dA, zh: '中文', ar: $q.dB } };
const inner = $t.k22 + esc(w('rd_p')) + $t.k23 + esc(pj ? pj.n : '') + '">' +
$q.dC + esc(w('rd_dv')) + $t.k24 + esc(pj ? pj.dv : '') + '">' +
$q.dD + esc(w('rd_un')) + $t.k25 +
$q.dE + esc(w('rd_me')) + $t.k26 +
$q.dF + esc(w('rd_l')) + $q.dG + LANGS.map(l => $q.cQ + l + '"' + (l === lang ? $q.bv : '') + '>' + esc(M.name[l]) + $q.bw).join('') + $q.cZ +
$t.k27 + esc(w($q.dH)) + $q.dI + docs.map(d => $s.k7 + d + $t.k28 + esc(w($q.dq + d)) + $q.dJ).join('') + $q.dK +
'<h2>' + esc(w($q.dL)) + $t.k29 + esc(w($q.dM)) + $t.k30 + esc(w($q.dN)) + $t.k31 +
$t.k32 + esc(w($q.dO)) + $t.k33 + esc(w($q.dP)) + $t.k34 +
$q.dQ + esc(w($q.dR)) + $q.by + esc(w($q.dS)) + '</p>';
return frame(lang, $q.dT, $q.dU, inner, { m: M, me: $q.dU });
}
function factPage(lang, key, list, idp, U) {
const w = (k, v) => t31(lang, k, v), ucc = U && U.x ? CC[U.x.co] : null, hit = ucc ? list.filter(v => v.cc === ucc) : [];
const un = U ? upNote(lang, U, [], U.x ? (hit.length ? esc(w($q.dV)).replace('{c}', esc(country(ucc, lang))).replace('{a}', hit.map(v => $q.dW + idp + v.k + '">' + esc(v.h ? (v.h[lang] || v.h.en) : country(v.cc, lang)) + '</a>').join(', ')) : esc(w($q.dX)).replace('{c}', esc(ucc ? country(ucc, lang) : U.x.co || ''))) : '') : '';
const inner = un + list.map(v => $q.dY + idp + v.k + '"' + (ucc && v.cc === ucc ? $q.aW : '') + '><h3>' + esc(v.cc === 'EU' ? w('eu') : country(v.cc, lang)) + (v.h ? ': ' + esc(v.h[lang] || v.h.en) : '') + $q.aX + esc(v.t[lang] || v.t.en) + '</p>' +
(v.q ? $q.aY + (v.src.ql || 'en') + $q.aZ + esc(v.q) + '”</p>' : '') + '<p>' + esc(w(v.src.kind === 'press' ? $q.dZ : v.src.kind === 'bank' ? $q.ea : $q.bb)) + ': ' + srcA(v.src) + readOn(lang, v.src.d) + (v.src.pd ? $q.l + esc(w($q.eb, { d: fdate(v.src.pd, lang) })) + $q.n : '') + $q.ec).join('') +
'<h2>' + esc(w(key + $q.ed)) + $q.aI + w(key + '_lim').map(s => '<li>' + esc(s) + '</li>').join('') + $q.ee + esc(w($q.bz)) + '</p>';
return frame(lang, $q.E + key + '/', key, inner, { me: key, noscript: true });
}
async function areaPage(env, lang, u) {
const N = await import('./kbx_named.js'), ix = await N.data(env), H = await import('./kbx_hdate.js'), w = (k, v) => t31(lang, k, v), P = pre(lang);
const mks = [...ix.mk.entries()].filter(([m, o]) => o.k >= 5 && !COI_RX.test(m)).sort((a, b) => b[1].k - a[1].k);
const U = await upPrj(env, u); let sel = String(u.searchParams.get('m') || ''); const fromP = !sel && U && U.x && U.x.mk; if (fromP) sel = U.x.mk;
const m = mks.find(([k]) => k.toLowerCase() === sel.toLowerCase()) ? mks.find(([k]) => k.toLowerCase() === sel.toLowerCase())[0] : null;
let rep = '';
if (m) {
const A = await import('./kbx_n30a.js'), S0 = A.slipStats(ix, N.handoverOf), sr = S0.rows.find(r => r.mk === m);
let tr = null; try { tr = await (await import('./kbx_tr.js')).trData(env); } catch (e) {}
const L = ix.P.filter(x => x.mk === m && clean(x)), st = { op: 0, uc: 0, done: 0 };
let pn = 0, esc2 = 0, ov = 0, pin = 0;
for (const x of L) { const c = ix.caseBy.get(x.id) || {}; st[kindOf(c.stage || x.st)]++; if ((c.checks || {}).permit === 2) pn++; if ((c.checks || {}).escrow === true) esc2++; if (N.overdueOf && N.overdueOf(ix, x)) ov++; if ((x.fx || {}).lat) pin++; }
const top = tr ? L.map(x => tr.rows.get(x.id)).filter(Boolean).sort((a, b) => b.score - a.score || a.n.localeCompare(b.n)).slice(0, 10) : [];
const li = (a, b) => $q.cD + esc(a) + $q.ef + b + $q.eg;
rep = $s.k8 + esc(w('ar_rt', { m: H.mkName(m, lang) })) + $q.eh + esc(w($q.ei, { d: fdate(ix.updated || S0.day, lang) })) + $t.k35 +
$q.ej + li(w('ar_k'), '<b>' + nf(L.length, lang) + '</b>') + li(w('ar_st'), esc(w($q.ek, { a: nf(st.op, lang), b: nf(st.uc, lang), c: nf(st.done, lang) }))) +
li(w($q.bV), nf(pn, lang) + ' (' + nf(Math.round(pn / Math.max(1, L.length) * 100), lang) + ' %)') + li(w($q.bX), nf(esc2, lang) + ' (' + nf(Math.round(esc2 / Math.max(1, L.length) * 100), lang) + ' %)') + li(w($q.el), nf(pin, lang)) + li(w('ar_ov'), nf(ov, lang)) +
li(w($q.bY), sr && sr.n >= 5 ? esc(w($q.bZ, { m: nf(sr.med, lang) })) + $q.em + esc(w('cc_n', { n: nf(sr.n, lang) })) + $q.n : esc(w($q.ce, { n: nf(sr ? sr.n : 0, lang) }))) + $q.cE +
(top.length ? '<h3>' + esc(w($q.en)) + $q.eo + top.map(r => $q.D + ORIGIN + P + $q.t + r.s + '/">' + bdi(r.n) + $q.bi + nf(r.score, lang) + '/100' + (r.dv ? ' · ' + esc(r.dv) : '') + $q.bj).join('') + '</ol>' : '') +
$q.aK + esc(w($q.ep)) + ' ' + ORIGIN + P + '/m/' + encodeURIComponent(m.toLowerCase().replace(/\s+/g, '-')) + '/ · ' + ORIGIN + $t.k36 + esc(w($q.eq)) + $q.er;
}
const inner = upNote(lang, U, fromP && m ? [upV('up_mk', lang, H.mkName(m, lang))] : (U && U.x && !m ? [esc(w($q.es))] : [])) + $t.k37 + esc(w('ar_m')) + $q.et + mks.map(([k, o]) => $q.cQ + esc(k) + '"' + (k === m ? $q.bv : '') + '>' + esc(H.mkName(k, lang)) + ' (' + nf(o.k, lang) + $q.cR).join('') + $q.cZ +
$t.k38 + esc(w('ar_go')) + $q.eu +
$q.ev + esc(w('ar_an')) + $t.k39 + esc(w('ar_al')) + $t.k40 +
upHid(U) + $q.aK + esc(w($q.ew)) + '</p>' + (m ? $t.k41 + esc(w($q.ex)) + $q.eu : '') + $q.ey + rep +
$s.k9 +
$s.k10;
return frame(lang, $q.ez, $q.eA, inner, { me: $q.eA, m: {} });
}
function translatePage(lang) {
const w = (k, v) => t31(lang, k, v);
const M = { msg: { no: w('tr_no'), dl: w('tr_dl'), rd: w('tr_rd'), done: w($q.eB), err: w($q.eC), det: w($q.eD), scan: w($q.eE), big: w($q.eF) }, to: lang };
const names = { en: $q.dv, es: $q.dw, de: $q.dx, fr: $q.dy, nl: $q.dz, ru: $q.dA, zh: '中文', ar: $q.dB, id: $q.eG, th: 'ไทย', tr: $q.eH, pt: $q.eI, it: $q.eJ, vi: $q.eK, ja: '日本語', pl: $q.eL };
const inner = $t.k42 + esc(w($q.eM)) + $t.k43 +
$q.eN + esc(w('tr_or')) + $t.k44 +
$q.eO + esc(w('tr_to')) + $q.eP + LANGS.map(l => $q.cQ + l + '"' + (l === lang ? $q.bv : '') + '>' + esc(names[l]) + $q.bw).join('') + $q.cZ +
$q.eQ + esc(w($q.eR)) + $t.k45 + esc(w($q.eS)) + $q.bw + Object.keys(names).map(l => $q.cQ + l + '">' + esc(names[l]) + $q.bw).join('') + $q.cZ +
$t.k46 + esc(w('tr_go')) + $s.k11 +
'<h2>' + esc(w($q.eT)) + $q.aI + w($q.eU).map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>';
return frame(lang, $q.eV, $q.eW, inner, { m: M, me: $q.eW, priv: w($q.eX) });
}
function receiptPage(lang) {
const w = (k, v) => t31(lang, k, v);
const M = { msg: { none: w($q.eY), ok: w('rc_ok'), bad: w($q.eZ), ae: w('rc_ae'), esc: w($q.fa), noesc: w($q.fb), ben: w($q.fc), noben: w($q.fd), pers: w($q.fe), ref: w($q.ff), noref: w($q.fg), sw: w('rc_sw'), cc: w('rc_cc'), call: w($q.fh), iban: w($q.fi), scan: w($q.eE), rd: w('tr_rd') } };
const inner = $t.k47 + esc(w($q.fj)) + $s.k12 + esc(w('rc_or')) + $t.k48 +
$q.fk + esc(w($q.fl)) + $s.k13 + esc(w($q.fm)) + $q.cJ +
$t.k49 + esc(w('rc_go')) + $s.k14 +
'<h2>' + esc(w($q.fn)) + $q.fo + esc(w($q.fp)) + $t.k50 + esc(CRC.ae_l8_q) + $q.ba + esc(w($q.bb)) + ': ' + srcA(CRC.ae_l8) + readOn(lang, CRC.ae_l8.d) + '</p>' +
$q.aK + esc(w($q.fq)) + $s.k15;
return frame(lang, $q.fr, $q.fs, inner, { m: M, me: $q.fs, priv: w($q.ft) });
}
async function pvpPage(env, lang, u) {
const w = (k, v) => t31(lang, k, v);
let pj = null; const sl = String(u.searchParams.get('p') || '').toLowerCase();
const N = await import('./kbx_named.js'), ix = await N.data(env), A = await import('./kbx_n30a.js'), S0 = A.slipStats(ix, N.handoverOf);
if (/^[a-z0-9-]{1,90}$/.test(sl)) { const x = ix.bySlug.get(sl); if (x && clean(x)) { const fx = x.fx || {}, h = N.handoverOf(ix, x), r = S0.rows.find(z => z.mk === x.mk); pj = { n: nameOf(x), s: x.s, plan: fx.payment_plan || null, dep: fx.deposit_pct || null, start: fx.construction_start || null, ho: h ? String(h.d) : (fx.handover_promised || null), med: r && r.n >= 5 ? r.med : null, mn: r ? r.n : 0, mk: x.mk }; } }
const M = { pj, all: S0.all.med, msg: { paid: w($q.fu), built: w($q.fv), gap: w($q.fw), gap0: w($q.fx), bad: w($q.fy), plan: w($q.fz), med: w($q.fA), sum: w($q.fB), month: w($q.fC), aria: w($q.fD) }, LOC: LOC[lang] };
const row = (i, p, t, v) => $q.fE + esc(w($q.fF)) + ' ' + i + $q.fG + p + $q.fH + esc(w($q.fI)) + ' ' + i + $q.fJ + (t === 's' ? $q.bv : '') + '>' + esc(w($q.fK)) + $q.fL + (t === 'b' ? $q.bv : '') + '>' + esc(w($q.fM)) + $q.fN + (t === 'm' ? $q.bv : '') + '>' + esc(w($q.fO)) + $q.fP + (t === 'h' ? $q.bv : '') + '>' + esc(w($q.fQ)) + $q.fR + esc(w('pv_v')) + ' ' + i + $q.fS + v + $q.fT;
const inner = (pj ? $q.fU + bdi(pj.n) + '</b>' + (pj.plan ? '<br>' + esc(w($q.fz)) + $q.fV + esc(pj.plan) + $q.fW : '') + '</p>' : '') +
$t.k51 + esc(w($q.fX)) + $s.k16 + esc(w('pv_ho')) + $t.k52 +
$t.k53 + esc(w($q.fY)) + $s.k17 +
$t.k54 + esc(w($q.fZ)) + $q.ga + esc(w($q.gb)) + $q.gc + row(1, 20, 's', 0) + row(2, 30, 'b', 50) + row(3, 20, 'b', 80) + row(4, 30, 'h', 0) + $q.X +
$t.k55 + esc(w($q.gd)) + $t.k56 + esc(w('pv_go')) + $q.cK +
$s.k18 + esc(w($q.ge)) + $q.aI + w('pv_m').map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>' +
$s.k19;
return frame(lang, $q.gf, $q.gg, inner, { m: M, me: $q.gg });
}
function appPage(lang) {
const w = (k, v) => t31(lang, k, v);
const inner = $t.k57 + esc(w($q.gh)) + $t.k58 +
['and', 'ios', 'desk'].map(k => $q.gi + esc(w('app_' + k + '_h')) + $q.eo + w('app_' + k).map(s => '<li>' + esc(s) + '</li>').join('') + $q.gj).join('') +
'<h2>' + esc(w($q.gk)) + $q.aI + w($q.gl).map(s => '<li>' + esc(s) + '</li>').join('') + $q.ee + esc(w($q.gm)) + '</p>';
return frame(lang, '/app/', 'app', inner, { me: 'app', m: { done: w($q.gn) }, crumb: esc(w($q.go)) });
}
async function satPage(env, lang) {
const N = await import('./kbx_named.js'), ix = await N.data(env), SAT = await import('./kbx_named_sat.js'), sd = await SAT.satData(env), H = await import('./kbx_hdate.js'), w = (k, v) => t31(lang, k, v), P = pre(lang);
const recs = sd && sd.projects ? sd.projects : {}, L = [];
for (const [id, r] of Object.entries(recs)) { const x = ix.byId.get(id); if (!x || !clean(x) || !r.frames || !r.v || r.frames < 6) continue; const fx = x.fx || {}; if (fx.lat == null || fx.lng == null) continue; const ch = r.sum && r.sum.b_last != null && r.sum.b_first != null ? Math.round(r.sum.b_last - r.sum.b_first) : null; L.push({ x, r, ch, lat: +fx.lat, lng: +fx.lng }); }
L.sort((a, b) => (b.ch == null ? -999 : b.ch) - (a.ch == null ? -999 : a.ch) || nameOf(a.x).localeCompare(nameOf(b.x)));
const W = 960, Hh = 480, X = g => ((g + 180) / 360 * W).toFixed(1), Y = a => ((90 - a) / 180 * Hh).toFixed(1);
const map = $t.k59 + W + ' ' + Hh + $q.gp + esc(w($q.gq, { n: nf(L.length, lang) })) + $q.gr + W + $q.gs + Hh + $q.gt +
[-60, -30, 0, 30, 60].map(a => $q.gu + W + $q.gv + Y(a) + $q.gw + Y(a) + '"/>').join('') + [-120, -60, 0, 60, 120].map(g => $q.gx + Hh + $q.gy + X(g) + $q.gz + X(g) + '"/>').join('') +
L.map((o, i) => $q.gA + o.x.id + $q.gB + X(o.lng) + $q.gC + Y(o.lat) + $q.gD + esc(nameOf(o.x)) + $q.gE).join('') + $q.gF + esc(w($q.gG)) + $q.gH;
const months = r => { const [y, m] = r.m0.split('-').map(Number); return r.f.map((f, i) => { const k = y * 12 + (m - 1) + i; return f >= 0 ? [f, Math.floor(k / 12) + '-' + String(k % 12 + 1).padStart(2, '0')] : null; }).filter(Boolean).slice(-48); };
const runs = fr => { const o = []; let c = null; for (const [t, m] of fr) { const mi2 = +m.slice(0, 4) * 12 + +m.slice(5) - 1; if (c && t === c.t + c.n && mi2 === c.mi + c.n) c.n++; else { c = { t, mi: mi2, m: m.replace('-', ''), n: 1 }; o.push(c); } } return o.map(r => r.t + '.' + r.m + '.' + r.n).join(' '); };
const cards = L.map(o => { const fr = months(o.r), first = fr[0][1], last = fr[fr.length - 1][1];
return $q.gI + o.x.id + $t.k60 + encodeURIComponent(o.x.id) + $q.gJ + encodeURIComponent(o.r.v) + $q.gK + runs(fr) + $q.gL + o.r.frames + $q.gM + esc(w($q.gN, { p: nameOf(o.x), a: ym(first, lang), b: ym(last, lang) })) + $t.k61 +
$q.gO + P + $q.t + o.x.s + $q.gP + bdi(nameOf(o.x)) + $q.gQ + esc(H.mkName(o.x.mk, lang)) + ' · ' + esc(w('sm_n', { n: nf(fr.length, lang), a: ym(first, lang), b: ym(last, lang) })) + (o.ch != null ? ' · ' + esc(w('sm_ch', { c: (o.ch > 0 ? '+' : '') + nf(o.ch, lang) })) : '') + $q.gR; }).join('');
const inner = $t.k62 + esc(w($q.gS)) + $t.k63 + esc(w($q.gT)) + $t.k64 + map +
$q.gU + cards + $q.gV + esc(w($q.gW)) + $q.aI + w('sm_m').map(s => '<li>' + esc(s) + '</li>').join('') + $q.ee + esc((sd && sd.source && sd.source.attribution) || $t.k65) + $q.gX + esc((sd && sd.source && sd.source.url) || $t.k66) + $t.k67 + esc(w($q.gY, { d: fdate((sd && sd.updated) || $q.gZ, lang) })) + '</p>' +
$s.k20 +
$s.k21;
return frame(lang, $q.ha, 'sm', inner, { me: 'sm', m: { play: w($q.hb) }, crumb: $q.hc + esc(w($q.hd)) + '</a>' });
}
async function newSites(env) {
const N = await import('./kbx_named.js'), ix = await N.data(env);
const load = async n => { try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.he + n)); return r.ok ? await r.json() : null; } catch (e) { return null; } };
const [wf, da] = await Promise.all([load($q.hf), load($q.hg)]);
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
return { L, updated: (wf && wf.updated) || null, total: by.size, cut, src: (wf && wf.source) || [$q.hh] };
}
async function newSitesPage(env, lang) {
const { L, updated, total, cut } = await newSites(env), w = (k, v) => t31(lang, k, v), P = pre(lang);
const rows = L.map(o => { const y = +o.rg.slice(0, 4), gap = o.fc && y - o.fc >= 2 ? $q.hi + esc(w($q.hj, { f: o.fc, y })) + $q.n : '';
return $q.hk + esc(w('nw_th')[0]) + $q.hl + esc(o.d) + '</b>' + (o.rgr ? $q.hi + esc(o.rgr) + $q.n : '') + $q.hm + esc(w('nw_th')[1]) + '"><b>' + esc(fdate(o.rg, lang)) + '</b>' + gap + $q.hm + esc(w('nw_th')[2]) + '">' + [...o.ps].slice(0, 4).map(([s, n]) => $q.s + P + $q.t + s + '/">' + bdi(n) + '</a>').join(', ') + (o.ps.size > 4 ? ' +' + (o.ps.size - 4) : '') + (o.devs.size ? $q.hi + esc([...o.devs].slice(0, 2).join(', ')) + $q.n : '') + $q.eg; }).join('');
const inner = $q.T + esc(w($q.hn, { k: nf(L.length, lang), n: nf(total, lang), c: fdate(cut, lang) })) + $q.U +
$t.k68 + esc(w($q.ho)) + $s.k22 +
$t.k69 + w('nw_th').map(h => $q.cB + esc(h) + '</th>').join('') + $q.cC + rows + $q.cE +
'<h2>' + esc(w($q.hp)) + $q.aI + w('nw_m').map(s => '<li>' + esc(s) + '</li>').join('') + $q.ee + esc(w($q.gY, { d: fdate(updated || $q.hq, lang) })) + $s.k23;
return frame(lang, $q.hr, 'nw', inner, { me: 'nw', noscript: true, crumb: $q.hs + esc(w($q.ht)) + '</a>' });
}
async function newSitesApi(env, feed) {
const { L, updated, cut } = await newSites(env);
if (!feed) return jr({ updated, registered_since: cut, count: L.length, method: $s.k24, licence: $t.k70, page: ORIGIN + $q.hr,
items: L.map(o => ({ domain: o.d, registered: o.rg, rdap_read: o.rr, registrar: o.rgr, founded_claim: o.fc, projects: [...o.ps].map(([s, n]) => ({ slug: s, name: n, url: ORIGIN + $q.t + s + '/' })), developers: [...o.devs] })) });
return new Response(JSON.stringify({ version: $q.hu, title: $t.k71, home_page_url: ORIGIN + $q.hr, feed_url: ORIGIN + $q.hv, language: 'en',
description: $s.k25,
items: L.slice(0, 100).map(o => ({ id: $q.hw + o.d + '-' + o.rg, url: ORIGIN + $q.hr, title: o.d + $q.hx + o.rg, date_published: o.rg + $q.hy,
content_text: o.d + $q.hz + (o.rgr || $q.hA) + $q.hB + o.rg + $t.k72 + o.rr + $q.hC + [...o.ps].map(([s, n]) => n).slice(0, 6).join(', ') + '.' + (o.fc ? $t.k73 + o.fc + '.' : '') })) }, null, 1),
{ headers: { 'content-type': $q.hD, 'cache-control': $q.hE, 'access-control-allow-origin': '*' } });
}
export async function crBlock(lang, env) {
await L31(env);
const w = (k, v) => t31(lang, k, v), C = CRC.countries;
let NT = {}; try { const [a, b] = await Promise.all([import('./kbx_buy_notes.js'), import('./kbx_buy_c29.js')]); NT = Object.assign({}, a.NT, b.NT29); } catch (e) {}
const M = Object.fromEntries(Object.entries(C).map(([cc, L]) => [cc, L.map(i => ({ k: i.k, l: (i.l[lang] || i.l.en), n: NT[i.k] ? (NT[i.k][lang] || NT[i.k].en) : null, rx: i.rx, s: i.s.map(sk => CRC.src[sk]).filter(Boolean) }))]));
return $t.k74 + esc(JSON.stringify({ C: M, msg: { found: w($q.hF), miss: w($q.hG), wait: w($q.hH), src: w($q.bb), pick: w($q.hI) } })) + $q.hJ + esc(w('crc_h')) + $q.fo + esc(w($q.hK)) + '</p>' +
$q.hL + esc(w('crc_c')) + $s.k26 + esc(w($q.hI)) + $q.bw + Object.keys(C).map(cc => $q.cQ + cc + '">' + esc(country(cc, lang)) + $q.bw).join('') + $q.cZ +
$t.k75 + esc(w($q.hM)) + $q.ec + $s.CSS + script;
}
export async function mcpFind(env, q, lim) {
await L31(env);
const { ix, N, hits } = await findProjects(env, q, lim || 10);
return { query: q, count: hits.length, results: hits.map(x => Object.assign(brief(ix, N, x, 'en'), { handover_history: ORIGIN + $q.hN + x.s })), search_page: ORIGIN + $q.hO, rules: $s.k27 };
}
export const PATHS = /^\/k\/n31e\.js$|^\/api\/v1\/(?:find|new-websites(?:\.json)?|handover-history\/[a-z0-9-]{1,90})$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:tools\/(?:find-listing|handover-history|visa-by-investment|compare-countries|on-time|request-documents|inheritance|foreign-mortgages|area-report|translate|receipt-check|payment-vs-progress)|satellite\/monthly|watch\/new-websites|app)\/?$/;
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname;
if (req.method !== 'GET' && req.method !== 'HEAD') return null;
if (p !== $q.hP) await L31(env);
if (p === $q.hP) { const C = await import('./kbx_n31e_client.js'); return new Response(C.JS(), { headers: { 'content-type': $q.hQ, 'cache-control': u.searchParams.get('v') === N31V ? $q.hR : $q.hS, 'x-content-type-options': $q.i } }); }
try {
if (p === $q.hT) { const q = String(u.searchParams.get('q') || '').slice(0, 120); if (norm(q).length < 2) return jr({ error: 'q', note: $t.k76 }, 400);
const { ix, N, hits } = await findProjects(env, q, 8), lang = LANGS.includes(u.searchParams.get('lang')) ? u.searchParams.get('lang') : 'en'; return jr({ query: q, count: hits.length, results: hits.map(x => brief(ix, N, x, lang)) }, 200, $q.hU); }
const hh = /^\/api\/v1\/handover-history\/([a-z0-9-]{1,90})$/.exec(p);
if (hh) { const N = await import('./kbx_named.js'), ix = await N.data(env), x = ix.bySlug.get(hh[1]); if (!x || !clean(x)) return jr({ error: $q.hV, hint: $q.hW + ORIGIN + $q.t }, 404); return jr(handoverRecord(ix, N, x, await import('./kbx_hdate.js')), 200, $q.hU); }
if (p === $q.hX || p === $q.hv) return await newSitesApi(env, p.endsWith('.json'));
} catch (e) { return jr({ error: $q.hY }, 503, $q.hZ); }
const m = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(tools\/[a-z-]+|satellite\/monthly|watch\/new-websites|app)(\/?)$/); if (!m) return null;
if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': $q.ia } });
const lang = m[1] || 'en', k = m[2].replace(/^tools\//, '');
const ck = !u.search && req.method === 'GET' && STATIC31.has(k) && typeof caches !== $q.ib ? new Request(ORIGIN + $q.ic + N31V + '.' + String((env && env.CF_PAGES_COMMIT_SHA) || '').slice(0, 10) + p) : null;
if (ck) { try { const hit = await caches.default.match(ck); if (hit) return new Response(hit.body, { status: 200, headers: { 'content-type': $q.aj, 'cache-control': $q.h, 'x-n31e-cache': 'hit' } }); } catch (e) {}
const r = await build31(req, u, env, ctx, shell, lang, k);
if (r && r.status === 200 && ctx && ctx.waitUntil) { const c = r.clone(); ctx.waitUntil(caches.default.put(ck, new Response(c.body, { headers: { 'content-type': $q.aj, 'cache-control': $q.hU } })).catch(() => {})); }
return r; }
return build31(req, u, env, ctx, shell, lang, k);
}
const STATIC31 = new Set(['find-listing', 'handover-history', 'visa-by-investment', 'inheritance', 'foreign-mortgages', 'translate', 'receipt-check', 'satellite/monthly', 'watch/new-websites', 'app']);
async function build31(req, u, env, ctx, shell, lang, k) {
try {
if (k === $q.aD || k === $q.id) return await page(lang, shell, k, $q.E + k + '/', findPage(lang, k));
if (k === $q.bB) return await page(lang, shell, k, $q.E + k + '/', await visaPage(env, lang, u), { type: $q.ie, noindex: u.searchParams.has($q.o) || u.searchParams.has('b') });
if (k === $q.cN) return await page(lang, shell, k, $q.E + k + '/', await comparePage(env, lang, u), { type: $q.ie, noindex: u.searchParams.has('c') || u.searchParams.has('cc') });
if (k === $q.dh) return await page(lang, shell, k, $q.E + k + '/', await onTimePage(env, lang, u), { noindex: u.searchParams.has($q.o) || u.searchParams.has('mk') || u.searchParams.has('d') });
if (k === $q.dU) return await page(lang, shell, k, $q.E + k + '/', await reqDocPage(env, lang, u), { noindex: u.searchParams.has('p') });
if (k === $q.if) return await page(lang, shell, k, $q.E + k + '/', factPage(lang, k, INH, 'i-', await upPrj(env, u)), { type: $q.ie, noindex: u.searchParams.has($q.o) });
if (k === $q.ig) return await page(lang, shell, k, $q.E + k + '/', factPage(lang, k, MORT, 'b-', await upPrj(env, u)), { type: $q.ie, noindex: u.searchParams.has($q.o) });
if (k === $q.eA) return await page(lang, shell, k, $q.E + k + '/', await areaPage(env, lang, u), { noindex: u.searchParams.has('m') || u.searchParams.has($q.o) });
if (k === $q.eW) return await page(lang, shell, k, $q.E + k + '/', translatePage(lang));
if (k === $q.fs) return await page(lang, shell, k, $q.E + k + '/', receiptPage(lang));
if (k === $q.gg) return await page(lang, shell, k, $q.E + k + '/', await pvpPage(env, lang, u), { noindex: u.searchParams.has('p') });
if (k === $q.ih) return await page(lang, shell, 'sm', $q.ha, await satPage(env, lang), { type: $q.ie, bcName: t31(lang, $q.hd), bcPath: $q.ii });
if (k === $q.ij) return await page(lang, shell, 'nw', $q.hr, await newSitesPage(env, lang), { type: $q.ie, bcName: t31(lang, $q.ht), bcPath: $q.ik });
if (k === 'app') return await page(lang, shell, 'app', '/app/', appPage(lang), { type: $q.ie, bcName: t31(lang, $q.go), bcPath: '/app/' });
} catch (e) { return null; }
return null;
}
export const __t = { findPage, visaPage, comparePage, onTimePage, reqDocPage, factPage, areaPage, translatePage, receiptPage, pvpPage, appPage, satPage, newSitesPage, newSitesApi, handoverRecord };
