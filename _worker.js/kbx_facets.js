// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_facets__q, $s = TB.kbx_facets__s, $t = TB.kbx_facets__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { data as namedData, handoverOf, fd, esc, pre, lastmod, okHttp, host, reviewed, overdueOf, OV_MIN } from './kbx_named.js';
import { jget } from './kbx_jget.js';
import { stalledLabel } from './kbx_n31c.js';
import { trData } from './kbx_tr.js';
import { mkName, placeName, coName, hyear, hkey } from './kbx_hdate.js';
import { FS } from './kbx_facets_i18n.js';
import { ogImg } from './kbx_ogt.js';
import { TCS, TCPL, TCPL_T } from './kbx_buy_c29.js';
import { PL as BPL } from './kbx_buy_i18n.js';
import { regSale, rsText } from './kbx_n31d_rs.js';
import { TB } from './kbx_strings.js';
const TCSLUG = { ae: 'dubai', esA: 'costa-del-sol', pt: 'portugal', th: 'thailand', id: 'indonesia', uk: 'england' };
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const PAGE_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(?:handover\/overdue(?:\/[a-z0-9-]{2,60})?|handover(?:\/(20\d\d)\/([a-z0-9-]{2,60}))?|areas(?:\/([a-z0-9-]{2,60})\/([a-z0-9-]{2,80}))?|vs\/([a-z0-9-]{3,200}-vs-[a-z0-9-]{2,200}))(\/?)$/;
export const SITEMAP = '/handover/sitemap.xml';
const COI_RX = /eco\s*beach\s*city|\bequinox\b/i;
const MIN_YEAR = 3, MIN_AREA = 5, MAX_PAIRS = 500, MIN_DELAY = 5, EMPTY = 'e3b0c44298fc1c14';
const t = (lang, k, v) => { let s = (FS[lang] && FS[lang][k] != null) ? FS[lang][k] : FS.en[k]; if (s == null) return k; if (typeof s !== $q.a) return s; if (v) s = s.replace(/\{(\w+)\}/g, (m, a) => v[a] != null ? v[a] : m); return s; };
const te = (lang, k, v) => esc(t(lang, k, v));
const th = (lang, k, v) => { const s = esc(t(lang, k)); return v ? s.replace(/\{(\w+)\}/g, (m, a) => v[a] != null ? v[a] : m) : s; };
const nf = (lang, n, d) => { try { return Number(n).toLocaleString(LOC[lang] || 'en-GB', { maximumFractionDigits: d == null ? 0 : d }); } catch (e) { return String(n); } };
const bdi = s => '<bdi>' + esc(s) + $q.b;
const slugA = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const slugM = m => encodeURIComponent(String(m).toLowerCase().replace(/\s+/g, '-'));
const PUB = (lang, path) => ORIGIN + pre(lang) + path;
const money = (lang, cur, v) => $q.c + esc((cur ? cur + ' ' : '') + nf(lang, v)) + $q.b;
const src = (u, label) => okHttp(u) ? $q.d + esc(u.trim()) + $q.e + esc(label || host(u)) + '</a>' : (typeof u === $q.a && /^\/[a-z#]/.test(u) ? $q.d + esc(u) + '">' + esc(label || $q.f) + '</a>' : '');
const li = (inner, u, label) => $q.g + inner + src(u, label) + '</li>';
const clen = s => [...String(s)].length;
const cutW = (s, n) => { const a = [...s]; if (a.length <= n) return s; const c = a.slice(0, n).join(''); const k = c.lastIndexOf(' '); return (k > n * 0.6 ? c.slice(0, k) : c).replace(/[\s,;:·(]+$/, ''); };
const fitT = (...c) => c.find(x => clen(x) <= 60) || cutW(c[c.length - 1], 60);
const fitD = (...c) => { const f = c.find(x => clen(x) <= 155); if (f) return f; let d = c[c.length - 1]; const S = d.split(/(?<=[.。])\s*/).filter(Boolean); while (S.length > 1 && clen(S.join(' ')) > 155) S.pop(); d = S.join(/[。]/.test(d) ? '' : ' '); return clen(d) <= 155 ? d : cutW(d, 154) + '.'; };
const sn = n => String(n).split(/\s+[-–|:]\s+|\s*\(|,/)[0].trim() || String(n);
const median = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : Math.round((s[s.length / 2 - 1] + s[s.length / 2]) / 2)) : null; };
const SHARED = (globalThis.__kbJson = globalThis.__kbJson || {});
async function load(env, name) {
const m = SHARED[name]; if (m && (m.a || Date.now() - m.t < 600000)) return m.v;
return jget(env, name, ORIGIN + $q.h + name, ORIGIN + $q.i + name).then(o => o.v || null, () => null);
}
const AREA_SKIP = /^(centro|center|centre|city cent(?:re|er)|downtown area|old town|north|south|east|west|beachfront|seafront|off-plan|phase \w+|tower \w+|block \w+|plot \w+|near .*|also listed as.*)$/i;
const slugAr = v => slugA(String(v || '').replace(/[łŁ]/g, 'l').replace(/ı/g, 'i'));
const AREA_ALIAS = { cherngtalay: 'Choeng Thale' };
const areaKey = a => String(a || '').split(/[,(/;]/)[0].trim().replace(/^the\s+/i, '');
const yearOf = (ix, x) => { const h = handoverOf(ix, x); if (!h) return null; const y = hyear(h.d) || +((/(20\d\d)/.exec(String(h.d)) || [])[1] || 0); return y || null; };
const handP = (ix, x) => (ix.prom[x.id] || []).find(p => p.k === $q.j) || null;
let FIX = null, FLY = null;   // n40 k57: one build at a time
export function facetsData(env) { return FLY || (FLY = facetsData0(env).finally(() => { FLY = null; })); }
async function facetsData0(env) {
const ix = await namedData(env);
const [tri, drift, dage, regs, ot] = await Promise.all([trData(env).catch(() => null), load(env, $q.k), load(env, $q.l), load(env, $q.m), load(env, $q.n)]);
const key = [ix, tri, drift, dage, regs, ot];
if (FIX && FIX.key.every((v, i) => v === key[i]) && FIX.ovMonth === new Date().toISOString().slice(0, 7)) return FIX;
const P = ix.P.filter(x => !COI_RX.test(String(x.n || '')) && !COI_RX.test(String(x.dv || '')));
const score = id => { const r = tri && tri.rows.get(id); return r ? r.score : null; };
const yr = new Map(), yg = new Map(), ag = new Map();
for (const x of P) {
const y = yearOf(ix, x); yr.set(x.id, y);
if (y) { const k = y + '|' + x.mk; if (!yg.has(k)) yg.set(k, { y, mk: x.mk, s: slugA(x.mk), L: [] }); yg.get(k).L.push(x); }
const ak = x.ar && x.ar !== x.mk ? areaKey(x.ar) : '';
const parts = [...new Set([ak].concat(String(x.ar || '').split(/[,(/;)]/).slice(1).map(v => v.trim().replace(/^the\s+/i, ''))))];
for (const a0 of parts) {
const an = AREA_ALIAS[slugAr(a0)] || a0;
if (!an || an.length < 3 || slugAr(an) === slugAr(x.mk) || slugAr(an) === slugAr(x.co) || AREA_SKIP.test(an) || /\d{3,}/.test(an)) continue;
const k = x.mk + '|' + slugAr(an); if (!ag.has(k)) ag.set(k, { mk: x.mk, s: slugA(x.mk) + '/' + slugAr(an), names: new Map(), L: [], first: 0 }); const g = ag.get(k);
if (!g.L.includes(x)) { g.L.push(x); if (a0 === ak) g.first++; } g.names.set(an, (g.names.get(an) || 0) + 1);
}
}
const byScore = (a, b) => (score(b.id) ?? -1) - (score(a.id) ?? -1) || String(a.n).localeCompare(String(b.n));
const years = new Map(), yOf = new Map();
for (const g of yg.values()) { g.L.sort(byScore); if (g.L.length >= MIN_YEAR) { years.set(g.y + '/' + g.s, g); for (const x of g.L) yOf.set(x.id, g); } }
const areas = new Map(), aOf = new Map(), aMore = new Map();
const cand = [...ag.values()].filter(g => g.L.length >= MIN_AREA).sort((a, b) => (b.first > 0) - (a.first > 0) || b.L.length - a.L.length || a.s.localeCompare(b.s));
const kept = [];
for (const g of cand) { const S = new Set(g.L.map(x => x.id)); if (kept.some(k => { const i = k.L.filter(x => S.has(x.id)).length; return i / (S.size + k.L.length - i) >= 0.8; })) continue; kept.push(g); }
for (const g of kept) { g.n = [...g.names.entries()].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0][0]; g.L.sort(byScore); areas.set(g.s, g); }
const bySize = [...areas.values()].sort((a, b) => a.L.length - b.L.length);
for (const x of P) {
const ak = x.ar && x.ar !== x.mk ? areaKey(x.ar) : '', g0 = ak ? areas.get(slugA(x.mk) + '/' + slugAr(AREA_ALIAS[slugAr(ak)] || ak)) : null;
const hold = bySize.filter(g => g.L.includes(x)); const main = g0 && g0.L.includes(x) ? g0 : hold[0];
if (main) { aOf.set(x.id, main); const more = hold.find(g => g !== main); if (more) aMore.set(x.id, more); }
}
const groups = [...yg.values()].filter(g => g.L.length >= 2).sort((a, b) => b.L.length - a.L.length || a.mk.localeCompare(b.mk) || a.y - b.y);
const pairs = new Map(), pOf = new Map();
const add = (a, b, g) => { if (pairs.size >= MAX_PAIRS) return; const [p, q] = a.s < b.s ? [a, b] : [b, a], k = p.s + '-vs-' + q.s; if (pairs.has(k)) return; const pr = { k, a: p, b: q, g }; pairs.set(k, pr); for (const x of [p, q]) { if (!pOf.has(x.id)) pOf.set(x.id, []); pOf.get(x.id).push(pr); } };
for (const off of [0, 1]) for (const g of groups) for (let i = off; i + 1 < g.L.length; i += 2) add(g.L[i], g.L[i + 1], g);
const dl = new Map();
for (const x of P) { const h = handP(ix, x); if (!h) continue; const d = dl.get(x.mk) || { mk: x.mk, n: 0, k: 0, mm: 0 }; d.n++; if (h.mv > 0) { d.k++; d.mm += +h.mm || 0; } dl.set(x.mk, d); }
for (const d of dl.values()) { d.avg = d.n ? d.mm / d.n : 0; d.avgMoved = d.k ? d.mm / d.k : 0; }
const OT = (ot && ot.projects) || {}, done = x => { const c = ix.caseBy.get(x.id) || {}, o = OT[x.id]; return c.stage === $q.o || (o && /^(done_|completed_)/.test(o.s)); };
const dev = new Map();
for (const x of P) { if (!x.dvs) continue; const d = dev.get(x.dvs) || { k: 0, done: 0 }; d.k++; if (done(x)) d.done++; dev.set(x.dvs, d); }
const REG = (regs && regs.registers) || [];
const DA = (dage && dage.projects) || {};
const DR = (drift && drift.projects) || {};
const ovL = [], ovG = new Map(), withD = new Map();
for (const x of P) { if (handoverOf(ix, x)) withD.set(x.mk, (withD.get(x.mk) || 0) + 1); const o = overdueOf(ix, x); if (!o) continue; ovL.push({ x, o }); const k = slugA(x.mk); if (!ovG.has(k)) ovG.set(k, { mk: x.mk, s: k, L: [] }); ovG.get(k).L.push({ x, o }); }
for (const g of ovG.values()) { g.L.sort((a, b) => b.o.m - a.o.m || String(a.x.n).localeCompare(String(b.x.n))); g.n = withD.get(g.mk) || g.L.length; }
const ovMonth = new Date().toISOString().slice(0, 7);
const updated = String(ix.updated || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
FIX = { key, ix, P, ovL, ovG, ovMonth, score, yr, years, yOf, areas, aOf, aMore, pairs, pOf, dl, dev, done, OT, REG, regDate: regs && regs.updated, DA, daDate: dage && dage.updated, DR, drDate: drift && drift.updated, otDate: ot && ot.generated, updated,
v: updated + '|' + ovMonth + '|' + ovL.length + '|' + P.length + '|' + years.size + '|' + areas.size + '|' + pairs.size + '|' + (tri ? tri.v : '') };
return FIX;
}
const TC_SRC = {
dubaiHH: ['hausandhaus.com', 'https://www.hausandhaus.com/resources/latest-news-and-insights/dubai-property-registration-fees/'],
dubaiPF: ['propertyfinder.ae', 'https://help.propertyfinder.ae/hc/en-us/articles/37816732289042-How-much-does-it-actually-cost-to-buy-property-in-Dubai'],
esAnd: ['interforoabogados.com', 'https://interforoabogados.com/contenido-legal/impuestos-compra-vivienda-andalucia-2026/'],
ptIMT: ['portaldasfinancas.gov.pt (IMT)', 'https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cimt/Pages/cimt17.aspx'],
ptIS: ['portaldasfinancas.gov.pt (IS)', 'https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/selo/Pages/ccod-selo-tabgiselo.aspx'],
th: ['thailand.go.th', 'https://www.thailand.go.th/event-detail/010_009'],
id: ['hukumonline.com', 'https://www.hukumonline.com/klinik/a/cara-menghitung-bphtb-dalam-jual-beli-tanah-lt60109bb92a261/'],
mx: ['bbva.mx', 'https://www.bbva.mx/educacion-financiera/creditos/credito-hipotecario-impuesto-adquisicion-inmuebles.html'],
uk: ['gov.uk', 'https://www.gov.uk/stamp-duty-land-tax/residential-property-rates'],
tr: ['adalet.gov.tr', 'https://iidb.adalet.gov.tr/Resimler/SayfaDokuman/' + encodeURIComponent('10012024135523Satış İşlemlerinde Tapu Harcının Alınması.pdf')]
};
function imtPT(v) { if (v <= 0) return 0; if (v > 1150853) return v * 0.075; if (v > 633931) return v * 0.06; const B = [[106346, 0.01], [145470, 0.02], [198347, 0.05], [330539, 0.07], [633931, 0.08]]; let s = 0, lo = 0; for (const [hi, r] of B) { if (v > lo) s += (Math.min(v, hi) - lo) * r; lo = hi; } return s; }
function sdltUK(v) { const B = [[125000, 0], [250000, 0.02], [925000, 0.05], [1500000, 0.10], [Infinity, 0.12]]; let s = 0, lo = 0; for (const [hi, r] of B) { if (v > lo) s += (Math.min(v, hi) - lo) * r; lo = hi; } return s; }
const TC = {
ae: { cur: 'AED', tool: 'ae', rows: [{ k: 'tc_dld', r: '4 %', f: p => p * 0.04, s: ['dubaiHH', 'dubaiPF'] }, { k: 'tc_trustee', r: l => 'AED ' + nf(l, 2100) + ' / ' + nf(l, 4200), f: p => p >= 500000 ? 4200 : 2100, s: ['dubaiPF'] }, { k: 'tc_deed', r: l => 'AED ' + nf(l, 270), f: () => 270, fixed: true, s: ['dubaiHH'] }] },
esA: { cur: 'EUR', tool: 'es', rows: [{ k: 'tc_iva', r: '10 %', f: p => p * 0.10, s: ['esAnd'] }, { k: 'tc_ajd', r: l => nf(l, 1.2, 1) + ' %', f: p => p * 0.012, s: ['esAnd'] }] },
es: { cur: 'EUR', tool: 'es', part: 'tc_ajd_x', rows: [{ k: 'tc_iva', r: '10 %', f: p => p * 0.10, s: ['esAnd'] }] },
pt: { cur: 'EUR', tool: 'pt', rows: [{ k: 'tc_imt', r: '1 % - 8 %', f: p => imtPT(p), s: ['ptIMT'] }, { k: 'tc_is', r: l => nf(l, 0.8, 1) + ' %', f: p => p * 0.008, s: ['ptIS'] }] },
th: { cur: 'THB', tool: 'th', rows: [{ k: 'tc_th', r: '2 %', f: p => p * 0.02, s: ['th'] }] },
id: { cur: 'IDR', tool: 'id', rows: [{ k: 'tc_bphtb', r: '≤ 5 %', f: p => Math.max(0, p - 80000000) * 0.05, s: ['id'] }] },
mx: { cur: 'MXN', tool: 'mx', part: 'tc_isai_x', rows: [] },
uk: { cur: 'GBP', tool: 'uk', note: 'tc_sdlt_x', rows: [{ k: 'tc_sdlt', r: '0 % - 12 %', f: p => sdltUK(p), s: ['uk'] }] },
tr: { cur: 'TRY', tool: 'tr', rows: [{ k: 'tc_tapu', r: '4 %', f: p => p * 0.04, s: ['tr'] }] }
};
const FLORIDA = new Set(['Miami', 'Palm Beach County', 'Orlando', 'Fort Lauderdale', 'Tampa', 'Naples', 'Jacksonville']);
function tcFor(x) {
const co = x.co, mk = x.mk;
if (co === 'UAE' || co === $q.p) return mk === 'Dubai' ? TC.ae : null;
if (co === 'Spain') return mk === $q.q ? null : mk === $q.r ? TC.esA : TC.es;
if (co === $q.s) return /madeira|azores|açores/i.test(mk + ' ' + (x.ar || '')) ? null : TC.pt;
if (co === $q.t || co === 'UK') return /glasgow|edinburgh|scotland|wales|cardiff|aberdeen/i.test(mk + ' ' + (x.ar || '')) ? null : TC.uk;
return { Thailand: TC.th, Indonesia: TC.id, Mexico: TC.mx, Turkey: TC.tr, 'Türkiye': TC.tr }[co] || null;
}
const rt = (r, lang) => typeof r.r === $q.u ? r.r(lang) : r.r;
function useLine(x, lang) {
if (!x.s) return '';
const q = $q.v + encodeURIComponent(x.s), P = pre(lang) + $q.w;
return $q.x + te(lang, $q.y) + ': ' + [[$q.z, 'tl_lh', '&co=' + encodeURIComponent(x.co || '')], [$q.A, 'tl_dc', ''], [$q.B, 'tl_rx', ''], [$q.C, 'tl_dp', $q.D + encodeURIComponent(x.mk || '')], [$q.E, 'tl_yc', ''], [$q.F, 'tl_cr', ''], [$q.G, 'tl_pr', ''], [$q.H, 'tl_pp', ''], [$q.I, 'tl_bc', ''], [$q.J, 'tl_ot', ''], [$q.K, 'tl_vi', ''], [$q.L, 'tl_ih', ''], [$q.M, 'tl_fm', ''], [$q.N, 'tl_rt', '']].map(r => $q.O + P + r[0] + '/' + q + esc(r[2]) + $q.P + te(lang, r[1]) + '</a>').join(' · ') + '</p>';
}
function costHtml(F, x, lang) {
const T = tcFor(x), co = coName(x.co, lang) || x.co, fx = x.fx || {};
if (!T) return { html: $q.Q + te(lang, $q.R, { c: co }) + $q.S + pre(lang) + $q.T + (x.s ? $q.v + encodeURIComponent(x.s) : '') + '">' + te(lang, $q.U) + $q.V + useLine(x, lang), faq: null };
const p = fx.price_min > 0 && !regSale(x) && String(fx.currency || '').toUpperCase() === T.cur ? +fx.price_min : null;
let tot = 0; const used = new Set();
const rows = T.rows.map(r => { const a = p ? r.f(p) : null; if (a != null) tot += a; return li('<b>' + te(lang, r.k) + $q.W + esc(rt(r, lang)) + $q.b + (a != null && !r.fixed ? ' · ' + money(lang, T.cur, Math.round(a)) : ''), used.has(r.s[0]) ? null : (used.add(r.s[0]), TC_SRC[r.s[0]][1]), TC_SRC[r.s[0]][0]);  }).join('');
const L = [rows, T.part ? '<li>' + te(lang, T.part) + '</li>' : '', T.note ? '<li>' + te(lang, T.note) + '</li>' : '', '<li>' + te(lang, $q.X) + '</li>'].join('');
const ex = p && T.rows.length ? '<p>' + th(lang, 'co_ex', { p: money(lang, T.cur, p), t: money(lang, T.cur, Math.round(tot)), s: money(lang, T.cur, Math.round(p + tot)) }) + '</p>' : (T.rows.length ? $q.Q + te(lang, fx.price_min > 0 ? $q.Y : $q.Z) + '</p>' : '');
const cs = TCSLUG[Object.keys(TC).find(k => TC[k] === T)], cIn = cs && (((TCPL_T[cs] || TCPL[cs] || {})[lang]) || (BPL[cs] && (BPL[cs].in[lang] || BPL[cs].in.en)));
const html = $q.Q + te(lang, $q.aa, { c: co }) + $q.ab + L + '</ul>' + ex + $q.ac + pre(lang) + $q.ad + T.tool + (x.s ? $q.ae + encodeURIComponent(x.s) : '') + '">' + te(lang, $q.U) + '</a>' + (cIn ? $q.af + pre(lang) + $q.T + cs + '/">' + esc(String(TCS[lang].c_t).replace('{in}', cIn)) + '</a>' : '') + '</p>' + useLine(x, lang);
const faqA = T.rows.length ? T.rows.map(r => t(lang, r.k) + ': ' + rt(r, lang)).join('; ') + '.' + (T.part ? ' ' + t(lang, T.part) : '') : t(lang, T.part || $q.X);
return { html, faq: [t(lang, $q.ag, { n: x.n }), faqA] };
}
const CO_REG = { USA: 'United States', 'United States': 'United States', UK: 'United Kingdom', 'United Kingdom': 'United Kingdom', 'Türkiye': 'Turkey' };
function regFor(F, x) {
const byM = F.REG.filter(r => r.market === x.mk && (r.checks || []).includes($q.ah));
if (byM.length) return byM;
if (x.co === 'UAE' || x.co === $q.p) return [];
const co = CO_REG[x.co] || x.co;
let L = F.REG.filter(r => r.market === co && (r.checks || []).includes($q.ah));
if (co === $q.ai) L = L.filter(r => !/florida/i.test(r.register) || FLORIDA.has(x.mk));
if (co === $q.aj) L = L.filter(r => !/planning\.nsw/.test(r.url || '') || x.mk === $q.ak);
if (co === $q.t && /glasgow|edinburgh/i.test(x.mk)) L = [];
return L;
}
function regHtml(F, x, lang) {
const L = regFor(F, x); if (!L.length) return '';
const d = fd(String(F.regDate || '').slice(0, 10), lang), m = mkName(x.mk, lang);
return L.slice(0, 3).map(r => r.url ? li(th(lang, $q.al, { m: bdi(m), r: '<bdi>' + esc(r.register) + $q.b }) + $q.am + te(lang, $q.an, { a: t(lang, 'au_' + (r.automation === $q.ao ? 'auto' : r.automation === $q.ap ? $q.aq : $q.ar)), d }) + $q.as, r.url, host(r.url))
: li(th(lang, $q.at, { r: '<bdi>' + esc(r.register) + $q.b, d }), $q.au, $q.av)).join('');
}
const tt = (lang, v) => (FS[lang] && FS[lang]['tt_' + v]) || FS.en['tt_' + v] || String(v);
const ia = (ref, url) => $q.aw + ref + '/' + url;
function changesList(F, ix, x, lang, ph, paper) {
const out = [];
const h = handP(ix, x);
if (h && (h.hist || []).length) {
let prev = null; const seen = new Set();
for (const e of h.hist) { if (!e || !e.d) continue; if (prev && e.d !== prev.d && (hkey(e.d) || e.d) !== (hkey(prev.d) || prev.d) && !seen.has(prev.d + '>' + e.d) && seen.add(prev.d + '>' + e.d)) out.push([e.seen || '', li(te(lang, 'r_ho', { a: fd(prev.d, lang), b: fd(e.d, lang) }) + $q.ax + te(lang, $q.ay, { d: fd(e.seen, lang) }) + $q.az, $q.aA, $q.aB)]); prev = e; }
}
const rec = paper && paper.ph && paper.ph.projects && paper.ph.projects[x.id], pts = ((rec && rec.pts) || []).filter(p => p.head);
let priceRule = false;
for (let i = 1; i < pts.length; i++) {
const a = pts[i - 1].head, b = pts[i].head; if (a.cur !== b.cur || a.v === b.v || !(a.v > 0)) continue;
const pc = (b.v - a.v) / a.v * 100, q = pts[i], href = q.src === 'copy' ? $q.aC + x.s + $q.aD + q.ref + '.txt' : ia(q.ref, (rec && rec.url) || x.url);
out.push([q.d, li(th(lang, $q.aE, { a: $q.c + esc(a.p) + $q.b, b: $q.c + esc(b.p) + $q.b, p: $q.c + (pc > 0 ? '+' : '') + nf(lang, pc, Math.abs(pc) < 1 ? 2 : 1) + $q.aF }) + $q.ax + te(lang, $q.ay, { d: fd(q.d, lang) }) + $q.az, href, t(lang, q.src === 'ia' ? 'r_ia' : $q.aG))]); priceRule = true;
}
const D = F.DR[x.id];
for (const c of (D && D.changes) || []) {
if (c.reverted || c.sha_to === EMPTY || c.sha_from === EMPTY) continue;
const a = c.from, b = c.to, on = v => v === true || v === $q.aH || (typeof v === $q.aI && v > 0) || (typeof v === $q.a && v && v !== $q.aJ), off = v => v === false || v == null;
let k = null, v = {};
switch (c.f) {
case $q.aK: if (a && b) { k = $q.aL; v = { a, b }; } else if (a && !b) { k = $q.aM; v = { a }; } else if (b) { k = $q.aN; v = { b }; } break;
case $q.aO: if (priceRule) break; if (typeof c.pct === $q.aI && Math.abs(c.pct) <= 50) { k = c.pct > 0 ? 'r_pup' : $q.aP; v = { p: nf(lang, Math.abs(c.pct), 1) }; } else if (a == null && b === $q.aH) k = $q.aQ; else if (a === $q.aH && b == null) k = 'r_prm'; break;
case $q.aR: k = on(b) && off(a) ? $q.aS : on(a) && off(b) ? $q.aT : null; break;
case $q.aU: k = b === true && a === false ? $q.aV : a === true && b === false ? $q.aW : null; break;
case $q.aX: k = on(b) && off(a) ? $q.aY : on(a) && off(b) ? $q.aZ : null; break;
case $q.ba: k = b === true && a === false ? $q.bb : a === true && b === false ? $q.bc : null; break;
case $q.bd: if (a > 0 && b > 0) { k = 'r_y'; v = { a: nf(lang, a, 1), b: nf(lang, b, 1) }; } else if (b > 0) { k = $q.be; v = { b: nf(lang, b, 1) }; } else if (a > 0) { k = $q.bf; v = { a: nf(lang, a, 1) }; } break;
case $q.bg: if (a && b) { k = 'r_t'; v = { a: tt(lang, a), b: tt(lang, b) }; } break;
case $q.bh: if (a > 0 && b > 0) { k = 'r_l'; v = { a, b }; } break;
}
if (!k) continue;
out.push([c.first_seen || '', li(te(lang, k, v) + $q.ax + te(lang, $q.ay, { d: fd(c.first_seen, lang) }) + $q.az, (lang === 'en' ? '' : '/' + lang) + $q.aC + x.s + $q.aD, t(lang, $q.bi))]);
}
return out.sort((p, q) => String(q[0]).localeCompare(String(p[0])));
}
function changedHtml(F, ix, x, lang, ph, paper, checked, nCh) {
const NC = nCh || 4;
const L = changesList(F, ix, x, lang, ph, paper), chg = (lang === 'en' ? '' : '/' + lang) + $q.aC + x.s + $q.aD;
const top = ph && ph.n > 1 ? te(lang, $q.bj, { d: fd(checked, lang), n: nf(lang, ph.n), a: fd(ph.first, lang), b: fd(ph.last, lang), c: nf(lang, ph.changed) }) : ph && ph.n ? te(lang, $q.bk, { d: fd(checked, lang), a: fd(ph.first, lang) }) : te(lang, $q.bl, { d: fd(checked, lang) });
const body = L.length ? $q.bm + L.slice(0, NC).map(r => r[1]).join('') + '</ul>' + (L.length > NC ? $q.bn + te(lang, $q.bo, { k: nf(lang, L.length - NC) }) + $q.bp + te(lang, $q.bq) + $q.V : '') + $q.br + te(lang, $q.bs) + '</p>'
: '<p>' + te(lang, ph && ph.n > 1 ? $q.bt : $q.bu, { a: fd((ph && ph.first) || checked, lang), b: fd((ph && ph.last) || checked, lang) }) + '</p>';
const sum = L.length ? t(lang, $q.bv, { k: nf(lang, L.length), d: fd(L[0][0] || checked, lang) }) : t(lang, ph && ph.n > 1 ? $q.bt : $q.bu, { a: fd((ph && ph.first) || checked, lang), b: fd((ph && ph.last) || checked, lang) });
return { html: $q.Q + top + (ph && ph.n ? $q.S + chg + '">' + te(lang, $q.bw) + '</a>' : '') + '</p>' + body, n: L.length, sum };
}
function altHtml(F, ix, x, lang, nAlt) {
const fx = x.fx || {}, cur = String(fx.currency || '').toUpperCase(), p0 = regSale(x) ? 0 : +fx.price_min || 0, s0 = F.score(x.id);
let L = [];
if (p0 > 0 && cur && s0 != null) L = F.P.filter(o => o.id !== x.id && o.mk === x.mk && String((o.fx || {}).currency || '').toUpperCase() === cur && +(o.fx || {}).price_min > 0 && Math.abs(+(o.fx || {}).price_min - p0) / p0 <= 0.3 && (F.score(o.id) ?? -1) > s0)
.sort((a, b) => F.score(b.id) - F.score(a.id) || Math.abs(+a.fx.price_min - p0) - Math.abs(+b.fx.price_min - p0)).slice(0, nAlt || 3);
const mk = mkName(x.mk, lang);
const intro = $q.Q + th(lang, $q.bx, { mk: bdi(mk), s: nf(lang, s0 == null ? 0 : s0) }) + $q.S + pre(lang) + $q.by + te(lang, 'al_m') + $q.V;
const list = L.length ? $q.bz + L.map(o => $q.bA + pre(lang) + $q.aC + o.s + '/">' + bdi(o.n) + $q.bB + th(lang, $q.bC, { s: nf(lang, F.score(o.id)), p: money(lang, cur, +o.fx.price_min) }) + $q.bD).join('') + '</ul>'
: '<p>' + th(lang, !(p0 > 0) ? $q.bE : $q.bF, { mk: bdi(mk) }) + '</p>';
const links = [];
for (const pr of (F.pOf.get(x.id) || []).slice(0, 2)) { const o = pr.a.id === x.id ? pr.b : pr.a; links.push($q.bA + pre(lang) + '/vs/' + pr.k + '/">' + th(lang, 'vs_o', { b: bdi(o.n) }) + $q.bG); }
const yg = F.yOf.get(x.id); if (yg) links.push($q.bA + pre(lang) + $q.bH + yg.y + '/' + yg.s + '/">' + th(lang, 'yp_l', { k: nf(lang, yg.L.length), y: yg.y, mk: bdi(mk) }) + $q.bG);
for (const ag of [F.aOf.get(x.id), F.aMore && F.aMore.get(x.id)]) if (ag) links.push($q.bA + pre(lang) + $q.bI + ag.s + '/">' + th(lang, 'ar_l', { k: nf(lang, ag.L.length), a: bdi(ag.n) }) + $q.bG);
return intro + list + (links.length ? '<h3>' + te(lang, $q.bJ) + $q.bK + links.join('') + '</ul>' : '');
}
const regd = h => { const p = h.split('.'); return p.length > 2 && /^(co|com|net|org|ac|gov|or|go|ne)$/.test(p[p.length - 2]) && p[p.length - 1].length === 2 ? p.slice(-3).join('.') : p.slice(-2).join('.'); };
function domLine(F, x, lang) {
const d = F.DA[x.id]; if (!d || d.site !== 'own' || !(d.reg || d.ct)) return '';
const h = host(x.url); if (!h) return '';
const parts = [d.reg ? te(lang, $q.bL, { d: fd(d.reg, lang) }) : '', d.ct ? te(lang, 'dm_ct', { d: fd(d.ct, lang) }) : ''].filter(Boolean).join('; ');
return li(th(lang, $q.bM, { h: $q.c + esc(h) + $q.b }) + ' ' + parts + $q.am + te(lang, $q.bN, { d: fd(d.checked || F.daDate, lang) }) + $q.as, $q.bO + encodeURIComponent(regd(h)), 'RDAP');
}
function activeLine(F, x, lang) {
const d = x.dvs && F.dev.get(x.dvs); if (!d || !x.dv) return '';
return li(th(lang, $q.bP, { dev: bdi(x.dv), a: nf(lang, d.k - d.done), c: nf(lang, d.done), k: nf(lang, d.k) }), pre(lang) + $q.bQ + x.dvs + '/', $q.f);
}
function delayLine(F, x, lang) {
const d = F.dl.get(x.mk); if (!d || d.n < MIN_DELAY) return '';
return li(th(lang, $q.bR, { mk: bdi(mkName(x.mk, lang)), k: nf(lang, d.k), n: nf(lang, d.n), m: nf(lang, d.avg, 1), mm: nf(lang, d.avgMoved, 1) }), pre(lang) + $q.bS, $q.bT);
}
export const facetT = (lang, k, v) => t(lang, k, v);
const ENC = new TextEncoder(), BYTES = s => ENC.encode(s).length;
export function projFacets(F, ix, x, lang, o) {
if (!F || COI_RX.test(String(x.n || '')) || COI_RX.test(String(x.dv || ''))) return null;
let ch = changedHtml(F, ix, x, lang, o.ph, o.paper, o.checked), alt = altHtml(F, ix, x, lang);
const cost = costHtml(F, x, lang), reg = regHtml(F, x, lang), dom = domLine(F, x, lang), active = activeLine(F, x, lang), delay = delayLine(F, x, lang);
const bytes = () => BYTES(ch.html + alt + cost.html + reg + dom + active + delay + ch.sum);
if (bytes() > 4000) alt = altHtml(F, ix, x, lang, 2);
if (bytes() > 4100) ch = changedHtml(F, ix, x, lang, o.ph, o.paper, o.checked, 3);
if (bytes() > 4200) ch = changedHtml(F, ix, x, lang, o.ph, o.paper, o.checked, 2);
if (bytes() > 4400) alt = altHtml(F, ix, x, lang, 1);
const act = bytes() > 4500 ? '' : active;
return { changed: ch.html, chN: ch.n, chSum: ch.sum, cost: cost.html, costFaq: cost.faq, reg, alt, dom, active: act, delay,
h: { changed: t(lang, 'ch_h'), cost: t(lang, 'co_h', { n: x.n }), alt: t(lang, 'al_h', { n: x.n }), tocChanged: t(lang, $q.bU), tocCost: t(lang, $q.bV), tocAlt: t(lang, $q.bW) },
regs: regFor(F, x).filter(r => r.url).slice(0, 3).map(r => ({ n: r.register, u: r.url })) };
}
export function costCalc(x, p, lang) {
const T = tcFor(x); if (!T) return null;
const rows = T.rows.map(r => ({ label: t(lang, r.k), rate: rt(r, lang), amount: p > 0 ? Math.round(r.f(p)) : null, src: TC_SRC[r.s[0]] ? TC_SRC[r.s[0]][1] : null }));
return { cur: T.cur, rows, part: T.part ? t(lang, T.part) : null, note: T.note ? t(lang, T.note) : null, tool: $q.ad + T.tool };
}
const OUT = { open: 'o_open', moved: 'o_moved', missed: 'o_missed', done_on_time: 'o_ontime', done_late: 'o_late', completed_no_date: 'o_done', no_date: 'o_nodate', inconsistent: 'o_reread' };
export function devFacets(F, ix, dv, lang) {
if (!F || COI_RX.test(String(dv.n || ''))) return null;
const L = dv.ids.map(i => ix.byId.get(i)).filter(Boolean), d = F.dev.get(dv.s) || { k: L.length, done: 0 };
const cols = t(lang, $q.bX);
const quiet = o => (o.s === 'open' && !o.moved) || o.s === $q.bY;
const nQuiet = L.filter(x => F.OT[x.id] && F.OT[x.id].s === 'open' && !F.OT[x.id].moved).length, nNo = L.filter(x => F.OT[x.id] && F.OT[x.id].s === $q.bY).length;
const PRI = { done_on_time: 0, done_late: 0, completed_no_date: 1, missed: 2, moved: 3, open: 4 }, Lr = L.filter(x => F.OT[x.id] && !quiet(F.OT[x.id])).sort((a, b) => (PRI[F.OT[a.id].s] ?? 5) - (PRI[F.OT[b.id].s] ?? 5) || (F.OT[b.id].moved || 0) - (F.OT[a.id].moved || 0));
const rows = Lr.slice(0, 10).map(x => { const o = F.OT[x.id]; if (!o) return null; const late = o.s === $q.bZ ? o.overdue : 0;
const hp = handP(ix, x), h = handoverOf(ix, x), first = (hp && ((hp.hist || []).find(e => e && e.d) || {}).d) || (!o.moved && h ? h.d : o.first), last = (hp && hp.d) || (h && h.d) || o.cur;
return $q.ca + esc(cols[0]) + $q.cb + pre(lang) + $q.aC + x.s + $q.cc + bdi(x.n) + $q.cd + esc(cols[1]) + '">' + esc(first ? fd(first, lang) : '-') + $q.ce + esc(cols[2]) + '">' + esc(last ? fd(last, lang) : '-') + $q.cf + esc(cols[3]) + '">' + (o.moved ? nf(lang, o.moved) : '0') + $q.ce + esc(cols[4]) + '">' + te(lang, OUT[o.s] || $q.cg) + (late ? $q.am + te(lang, $q.ch, { m: nf(lang, late) }) + $q.as : '') + $q.ci; }).filter(Boolean);
const nDone = L.filter(x => F.OT[x.id] && /^(done_|completed_)/.test(F.OT[x.id].s)).length, nOn = L.filter(x => F.OT[x.id] && F.OT[x.id].s === $q.cj).length;
const pv = $q.Q + th(lang, $q.ck, { dev: bdi(dv.n) }) + $q.ab + li(th(lang, $q.cl, { k: nf(lang, nDone), o: nf(lang, nOn), a: nf(lang, d.k - d.done), n: nf(lang, d.k) }), $q.cm, $q.cn) + (nQuiet || nNo ? '<li>' + te(lang, $q.co, { q: nf(lang, nQuiet), z: nf(lang, nNo) }) + '</li>' : '') + '</ul>' +
(rows.length ? $t.k0 + cols.map(c => $q.cp + esc(c) + '</th>').join('') + $q.cq + rows.join('') + $q.cr + (Lr.length > 10 ? $t.k1 + te(lang, $q.bo, { k: nf(lang, Lr.length - 10) }) + $q.V : '') : '<p>' + te(lang, $q.cs) + '</p>') +
$q.br + te(lang, $q.ct, { d: fd(F.otDate, lang) }) + '</p>';
const doms = [...new Map(L.map(x => [host(x.url), x])).values()].map(x => domLine(F, x, lang)).filter(Boolean).slice(0, 3).join('');
return { pv, h: t(lang, 'pv_h'), toc: t(lang, $q.cu), active: te(lang, $q.cv, { a: nf(lang, d.k - d.done), c: nf(lang, d.done), k: nf(lang, d.k) }), doms: doms ? $q.bm + doms + '</ul>' : '',
faq: [t(lang, 'q_pv', { dev: dv.n }), t(lang, $q.cl, { k: nf(lang, nDone), o: nf(lang, nOn), a: nf(lang, d.k - d.done), n: nf(lang, d.k) })] };
}
const CSS = '<style id="kfa-css">.kfa h2{margin-top:var(--k-7,48px)}.kfa .k-phead{margin-bottom:var(--k-5,24px)}.kfa-kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));border:1px solid var(--k-line);border-radius:var(--k-r-lg,14px);overflow:hidden;background:var(--k-surface);margin:var(--k-4,16px) 0}.kfa-kv div{padding:12px 16px;border-inline-end:1px solid var(--k-line)}.kfa-kv b{display:block;font-size:var(--k-fs-xl,24px);font-variant-numeric:tabular-nums}.kfa-kv span{font-size:var(--k-fs-xs,13px);color:var(--k-muted)}' +
'.kfa .k-table-wrap{overflow-x:auto;margin:var(--k-3,12px) 0 var(--k-5,24px)}.kfa td{vertical-align:top}.kfa-l{display:flex;flex-wrap:wrap;gap:8px 16px;padding:0;list-style:none;margin:var(--k-3,12px) 0}.kfa-l li{margin:0}.kfa-box{border:1px solid var(--k-line-2);border-radius:var(--k-r-lg,14px);background:var(--k-surface);padding:16px 20px;margin:var(--k-6,32px) 0;max-width:760px}.kfa-vs{table-layout:fixed;width:100%}.kfa-vs th,.kfa-vs td{overflow-wrap:anywhere;word-break:break-word}.kfa-vs th[scope=row]{text-align:start;font-weight:600;width:28%}.kfa-vs td{width:36%}@media (max-width:640px){.kfa-vs th[scope=row]{width:auto}}.kfa code{white-space:normal;overflow-wrap:anywhere}</style>';
const crumbHtml = list => $q.cw + list.map((c, i) => i < list.length - 1 ? $q.O + c[1] + '">' + esc(c[0]) + '</a>' : $q.cx + esc(c[0]) + $q.cy).join(' / ') + '</p>';
const crumbLd = list => ({ '@type': $q.cz, itemListElement: list.map((c, i) => ({ '@type': $q.cA, position: i + 1, name: c[0], item: ORIGIN + c[1] })) });
const replyBox = lang => $q.cB + te(lang, 'rp_h') + '</b> ' + te(lang, 'rp_t') + $t.k2 + te(lang, 'rp_b') + $t.k3 + te(lang, 'rp_c') + $q.cC;
const kv = items => $q.cD + items.map(([v, l]) => $q.cE + v + $q.cF + esc(l) + $q.cG).join('') + $q.cH;
const faqHtml = (lang, Q) => $q.cI + te(lang, 'faq_h') + $q.cJ + Q.map(([q, a]) => $q.cK + esc(q) + $q.cL + esc(a) + $q.cM).join('') + $q.cH;
const faqLd = Q => ({ '@type': $q.cN, mainEntity: Q.map(([q, a]) => ({ '@type': $q.cO, name: q, acceptedAnswer: { '@type': $q.cP, text: a } })) });
function projTable(F, lang, L, withPlace) {
const ix = F.ix, cols = t(lang, withPlace ? $q.cQ : $q.cR);
const rows = L.map(x => { const h = handoverOf(ix, x), hp = handP(ix, x), sc = F.score(x.id), cells = [
$q.O + pre(lang) + $q.aC + x.s + '/">' + bdi(x.n) + '</a>',
x.dv ? (x.dvs && ix.devs.has(x.dvs) ? $q.O + pre(lang) + $q.bQ + x.dvs + '/">' + bdi(x.dv) + '</a>' : bdi(x.dv)) : te(lang, 'np'),
...(withPlace ? [esc(placeName(x.ar || x.mk, lang))] : []),
h ? esc(fd(h.d, lang)) : te(lang, 'np'),
hp && hp.mv ? te(lang, 'mv_k', { k: nf(lang, hp.mv), m: nf(lang, hp.mm || 0) }) : hp ? te(lang, 'mv_0') : '-',
x.pn ? te(lang, 'yes') : te(lang, 'np'),
sc == null ? '-' : '<b>' + nf(lang, sc) + '</b>'];
return '<tr>' + cells.map((c, i) => '<td' + (i === cells.length - 1 ? $q.cS : '') + $q.cT + esc(cols[i]) + '">' + c + '</td>').join('') + '</tr>'; }).join('');
return $t.k4 + cols.map(c => $q.cp + esc(c) + '</th>').join('') + $q.cq + rows + $q.cr;
}
const groupStats = (F, L) => { const ix = F.ix, sc = L.map(x => F.score(x.id)).filter(v => v != null); return { n: L.length, pn: L.filter(x => x.pn).length, mv: L.filter(x => { const h = handP(ix, x); return h && h.mv > 0; }).length, med: median(sc), lm: L.map(x => lastmod(ix, x)).sort().pop() }; };
const dataLine = (F, lang, d) => $q.br + te(lang, $q.cU, { d: fd(d || F.updated, lang) }) + $q.S + pre(lang) + $q.by + te(lang, 'al_m') + $s.k0;
function yearPage(F, y, s, lang) {
const g = F.years.get(y + '/' + s); if (!g) return null;
const mk = mkName(g.mk, lang), st = groupStats(F, g.L), path = $q.bH + y + '/' + s + '/';
const title = fitT(t(lang, $q.cV, { y, p: mk }), t(lang, 'hy_h2', { y, p: mk })), desc = fitD(t(lang, $q.cW, { k: nf(lang, st.n), p: mk, y, pn: nf(lang, st.pn), d: fd(st.lm, lang) }));
const cr = [[$q.cX, pre(lang) + '/'], [t(lang, 'cr_hy'), pre(lang) + $q.bH], [title, pre(lang) + path]];
const others = [...F.years.values()].filter(o => o.mk === g.mk && o.y !== g.y).sort((a, b) => a.y - b.y), same = [...F.years.values()].filter(o => o.y === g.y && o.mk !== g.mk).sort((a, b) => b.L.length - a.L.length).slice(0, 12);
const ar = [...F.areas.values()].filter(a => a.mk === g.mk), pp = [...F.pairs.values()].filter(p => p.g === g);
const d = F.dl.get(g.mk);
const Q = [[t(lang, 'hy_q1', { y, p: mk }), t(lang, 'hy_a1', { k: nf(lang, st.n), y, p: mk, d: fd(st.lm, lang) })], [t(lang, 'hy_q2', { y, p: mk }), t(lang, 'hy_a2', { pn: nf(lang, st.pn), k: nf(lang, st.n) })], [t(lang, 'hy_q3', { y, p: mk }), t(lang, 'hy_a3', { mv: nf(lang, st.mv), k: nf(lang, st.n) })]];
let body = $t.k5 + crumbHtml(cr) + '<h1>' + th(lang, $q.cV, { y, p: bdi(mk) }) + $q.cY + th(lang, $q.cZ, { y, p: bdi(mk) }) + $q.da +
kv([[nf(lang, st.n), t(lang, 'kv_n')], [nf(lang, st.pn), t(lang, 'kv_pn')], [nf(lang, st.mv), t(lang, 'kv_mv')], [st.med == null ? '-' : nf(lang, st.med), t(lang, 'kv_sc')]]) +
$q.db + te(lang, 'hy_h2', { y, p: mk }) + '</h2>' + projTable(F, lang, g.L, true) + dataLine(F, lang, st.lm) +
(d && d.n >= MIN_DELAY ? '<p>' + th(lang, $q.bR, { mk: bdi(mk), k: nf(lang, d.k), n: nf(lang, d.n), m: nf(lang, d.avg, 1), mm: nf(lang, d.avgMoved, 1) }) + $q.S + pre(lang) + $q.dc + te(lang, $q.dd) + $q.V : '') +
(others.length ? $q.de + te(lang, $q.df, { p: mk }) + $q.dg + others.map(o => $q.bA + pre(lang) + $q.bH + o.y + '/' + o.s + '/">' + o.y + ' (' + nf(lang, o.L.length) + $q.dh).join('') + '</ul>' : '') +
(same.length ? $q.di + te(lang, $q.dj, { y }) + $q.dg + same.map(o => $q.bA + pre(lang) + $q.bH + o.y + '/' + o.s + '/">' + bdi(mkName(o.mk, lang)) + ' (' + nf(lang, o.L.length) + $q.dh).join('') + '</ul>' : '') +
(ar.length ? $q.dk + te(lang, 'ar_in', { p: mk }) + $q.dg + ar.map(a => $q.bA + pre(lang) + $q.bI + a.s + '/">' + bdi(a.n) + ' (' + nf(lang, a.L.length) + $q.dh).join('') + '</ul>' : '') +
(pp.length ? $q.dl + te(lang, $q.bJ) + $q.dg + pp.map(p => $q.bA + pre(lang) + '/vs/' + p.k + '/">' + th(lang, 'vs_l', { a: bdi(p.a.n), b: bdi(p.b.n) }) + $q.bG).join('') + '</ul>' : '') +
$q.dm + slugM(g.mk) + '/">' + th(lang, $q.dn, { p: bdi(mk) }) + $q.V +
faqHtml(lang, Q) + replyBox(lang) + $q.do;
const url = PUB(lang, path);
const ld = [{ '@type': $q.dp, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: st.lm, isPartOf: { '@type': $q.dq, name: $q.cX, url: ORIGIN + '/' } },
{ '@type': $q.dr, name: title, numberOfItems: st.n, itemListElement: g.L.map((x, i) => ({ '@type': $q.cA, position: i + 1, name: x.n, url: PUB(lang, $q.aC + x.s + '/') })) }, crumbLd(cr), faqLd(Q)];
return { title, desc, body, ld, path, lm: st.lm };
}
function areaPage(F, s, lang) {
const g = F.areas.get(s); if (!g) return null;
const mk = mkName(g.mk, lang), st = groupStats(F, g.L), path = $q.bI + s + '/', an = g.n;
const title = fitT(t(lang, $q.ds, { a: an, p: mk }), t(lang, 'ar_h2', { a: an })), desc = fitD(t(lang, $q.dt, { k: nf(lang, st.n), a: an, p: mk, pn: nf(lang, st.pn), d: fd(st.lm, lang) }));
const cr = [[$q.cX, pre(lang) + '/'], [t(lang, 'cr_ar'), pre(lang) + $q.bI], [title, pre(lang) + path]];
const yrs = [...new Set(g.L.map(x => F.yr.get(x.id)).filter(Boolean))].sort().map(y => F.years.get(y + '/' + slugA(g.mk))).filter(Boolean);
const ar = [...F.areas.values()].filter(a => a.mk === g.mk && a.s !== s);
const Q = [[t(lang, 'ar_q1', { a: an }), t(lang, 'ar_a1', { k: nf(lang, st.n), a: an, p: mk, d: fd(st.lm, lang) })], [t(lang, 'ar_q2', { a: an }), t(lang, 'hy_a2', { pn: nf(lang, st.pn), k: nf(lang, st.n) })], [t(lang, 'ar_q3', { a: an }), t(lang, 'hy_a3', { mv: nf(lang, st.mv), k: nf(lang, st.n) })]];
const body = $t.k6 + crumbHtml(cr) + '<h1>' + th(lang, $q.ds, { a: bdi(an), p: bdi(mk) }) + $q.cY + th(lang, $q.du, { a: bdi(an), p: bdi(mk) }) + $q.da +
kv([[nf(lang, st.n), t(lang, 'kv_n')], [nf(lang, st.pn), t(lang, 'kv_pn')], [nf(lang, st.mv), t(lang, 'kv_mv')], [st.med == null ? '-' : nf(lang, st.med), t(lang, 'kv_sc')]]) +
$q.db + te(lang, 'ar_h2', { a: an }) + '</h2>' + projTable(F, lang, g.L, false) + $q.br + te(lang, $q.dv, { a: an }) + '</p>' + dataLine(F, lang, st.lm) +
(yrs.length ? $q.de + te(lang, $q.df, { p: mk }) + $q.dg + yrs.map(o => $q.bA + pre(lang) + $q.bH + o.y + '/' + o.s + '/">' + o.y + ' (' + nf(lang, o.L.length) + $q.dh).join('') + '</ul>' : '') +
(ar.length ? $q.dk + te(lang, 'ar_in', { p: mk }) + $q.dg + ar.map(a => $q.bA + pre(lang) + $q.bI + a.s + '/">' + bdi(a.n) + ' (' + nf(lang, a.L.length) + $q.dh).join('') + '</ul>' : '') +
$q.dm + slugM(g.mk) + '/">' + th(lang, $q.dn, { p: bdi(mk) }) + $q.dw + pre(lang) + $q.dx + te(lang, 'cr_ar') + $q.V +
faqHtml(lang, Q) + replyBox(lang) + $q.do;
const url = PUB(lang, path);
const ld = [{ '@type': $q.dp, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: st.lm, isPartOf: { '@type': $q.dq, name: $q.cX, url: ORIGIN + '/' }, about: { '@type': 'Place', name: an, containedInPlace: { '@type': 'Place', name: g.mk } } },
{ '@type': $q.dr, name: title, numberOfItems: st.n, itemListElement: g.L.map((x, i) => ({ '@type': $q.cA, position: i + 1, name: x.n, url: PUB(lang, $q.aC + x.s + '/') })) }, crumbLd(cr), faqLd(Q)];
return { title, desc, body, ld, path, lm: st.lm };
}
function vsPage(F, k, lang) {
const pr = F.pairs.get(k); if (!pr) return null;
const ix = F.ix, a = pr.a, b = pr.b, mk = mkName(a.mk, lang), y = pr.g.y, path = '/vs/' + k + '/';
const title = fitT(t(lang, $q.dy, { a: a.n, b: b.n }), t(lang, 'vs_l', { a: a.n, b: b.n }), t(lang, $q.dy, { a: sn(a.n), b: sn(b.n) }), t(lang, 'vs_l', { a: sn(a.n), b: sn(b.n) })), lm = [lastmod(ix, a), lastmod(ix, b)].sort().pop();
const desc = fitD(t(lang, $q.dz, { a: a.n, b: b.n, p: mk, y }), t(lang, $q.dz, { a: sn(a.n), b: sn(b.n), p: mk, y }));
const cr = [[$q.cX, pre(lang) + '/'], [t(lang, 'cr_vs'), '/vs/'], [t(lang, 'vs_l', { a: a.n, b: b.n }), pre(lang) + path]];
const cell = (x, f) => f(x);
const R = [
[$q.dA, x => x.dv ? (x.dvs && ix.devs.has(x.dvs) ? $q.O + pre(lang) + $q.bQ + x.dvs + '/">' + bdi(x.dv) + '</a>' : bdi(x.dv)) : te(lang, 'np')],
[$q.dB, x => esc(placeName(x.ar || x.mk, lang))],
[$q.dC, x => te(lang, 'stg_' + String((ix.caseBy.get(x.id) || {}).stage || x.st || $q.dD).replace(/[^a-z]/g, ''))],
['vs_ho', x => { const h = handoverOf(ix, x); return h ? esc(fd(h.d, lang)) : te(lang, 'np'); }],
['vs_mv', x => { const h = handP(ix, x); return h && h.mv ? te(lang, 'mv_k', { k: nf(lang, h.mv), m: nf(lang, h.mm || 0) }) : h ? te(lang, 'mv_0') : '-'; }],
['vs_pn', x => x.pn ? $q.c + esc(x.pn) + $q.b : te(lang, 'np')],
[$q.dE, x => { const fx = x.fx || {}, R = regSale(x); if (R) return esc(rsText(lang, R)); return fx.price_min > 0 ? money(lang, fx.currency || '', +fx.price_min) : te(lang, 'np'); }],
['vs_sc', x => { const s = F.score(x.id); return s == null ? '-' : '<b>' + nf(lang, s) + $q.dF; }],
[$q.dG, x => { const d = F.DA[x.id]; return d && d.site === 'own' && d.reg ? esc(fd(d.reg, lang)) : te(lang, 'np'); }],
[$q.dH, x => esc(fd(lastmod(ix, x), lang))]];
const head = $q.dI + te(lang, $q.dJ) + '</th>' + [a, b].map(x => $q.dK + pre(lang) + $q.aC + x.s + '/">' + bdi(x.n) + $q.dL).join('') + '</tr>';
const rows = R.map(([k2, f]) => $q.dM + te(lang, k2) + '</th>' + [a, b].map(x => '<td>' + cell(x, f) + '</td>').join('') + '</tr>').join('');
const more = (F.pOf.get(a.id) || []).concat(F.pOf.get(b.id) || []).filter(p => p.k !== k);
const yg = F.years.get(y + '/' + pr.g.s);
const body = $t.k7 + crumbHtml(cr) + '<h1>' + th(lang, 'vs_l', { a: bdi(a.n), b: bdi(b.n) }) + $q.cY + th(lang, $q.dN, { p: bdi(mk), y }) + $q.da +
$t.k8 + head + $q.dO + rows + $q.cr +
$q.br + te(lang, $q.dP) + '</p>' + dataLine(F, lang, lm) +
$q.dQ + [a, b].map(x => $q.bA + pre(lang) + $q.aC + x.s + '/">' + th(lang, $q.dR, { n: bdi(x.n) }) + $q.bG).join('') + (yg ? $q.bA + pre(lang) + $q.bH + y + '/' + yg.s + '/">' + th(lang, 'yp_l', { k: nf(lang, yg.L.length), y, mk: bdi(mk) }) + $q.bG : '') + more.slice(0, 4).map(p => $q.bA + pre(lang) + '/vs/' + p.k + '/">' + th(lang, 'vs_l', { a: bdi(p.a.n), b: bdi(p.b.n) }) + $q.bG).join('') + '</ul>' +
replyBox(lang) + $q.do;
const url = PUB(lang, path);
const ld = [{ '@type': $q.dS, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: lm, isPartOf: { '@type': $q.dq, name: $q.cX, url: ORIGIN + '/' }, about: [a, b].map(x => ({ '@type': 'Place', name: x.n, url: PUB(lang, $q.aC + x.s + '/') })) },
{ '@type': $q.dr, name: title, numberOfItems: 2, itemListElement: [a, b].map((x, i) => ({ '@type': $q.cA, position: i + 1, name: x.n, url: PUB(lang, $q.aC + x.s + '/') })) }, crumbLd(cr)];
return { title, desc, body, ld, path, lm };
}
function yearHub(F, lang) {
const path = $q.bH, title = fitT(t(lang, $q.dT)), desc = fitD(t(lang, $q.dU, { k: nf(lang, F.years.size) }));
const cr = [[$q.cX, pre(lang) + '/'], [t(lang, 'cr_hy'), pre(lang) + path]];
const byY = new Map(); for (const g of F.years.values()) { if (!byY.has(g.y)) byY.set(g.y, []); byY.get(g.y).push(g); }
const ys = [...byY.keys()].sort();
const D = [...F.dl.values()].filter(d => d.n >= MIN_DELAY).sort((a, b) => b.avg - a.avg || b.n - a.n);
const dc = t(lang, $q.dV);
const dt = $t.k9 + dc.map(c => $q.cp + esc(c) + '</th>').join('') + $q.cq + D.map(d => $q.ca + esc(dc[0]) + $q.dW + slugM(d.mk) + '/">' + bdi(mkName(d.mk, lang)) + $q.dX + esc(dc[1]) + '">' + nf(lang, d.n) + $q.cf + esc(dc[2]) + '">' + nf(lang, d.k) + $q.cf + esc(dc[3]) + '"><b>' + nf(lang, d.avg, 1) + $q.dY + esc(dc[4]) + '">' + (d.k ? nf(lang, d.avgMoved, 1) : '-') + $q.ci).join('') + $q.cr;
const lm = [...F.years.values()].map(g => groupStats(F, g.L).lm).sort().pop() || F.updated;
const body = $t.k10 + crumbHtml(cr) + '<h1>' + te(lang, $q.dT) + $q.cY + te(lang, $q.dZ) + $q.da +
ys.map(y => $q.ea + y + '">' + te(lang, 'hub_y', { y }) + $q.dg + byY.get(y).sort((a, b) => b.L.length - a.L.length).map(g => $q.bA + pre(lang) + $q.bH + g.y + '/' + g.s + '/">' + bdi(mkName(g.mk, lang)) + ' (' + nf(lang, g.L.length) + $q.dh).join('') + '</ul>').join('') +
$q.eb + te(lang, 'dl_h') + $q.ec + te(lang, $q.ed, { n: nf(lang, MIN_DELAY) }) + '</p>' + dt + $q.br + te(lang, $q.ee) + $q.ef + te(lang, $q.eg) + $q.V +
$q.eh + (F.ovL.length ? $q.O + pre(lang) + $q.ei + te(lang, $q.ej) + '</a> ' : '') + $q.O + pre(lang) + $q.dx + te(lang, 'cr_ar') + $q.ek + te(lang, 'cr_vs') + $q.dw + pre(lang) + $q.el + te(lang, $q.em) + $q.V + dataLine(F, lang, lm) + replyBox(lang) + $q.do;
const url = PUB(lang, path);
const ld = [{ '@type': $q.dp, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: lm, isPartOf: { '@type': $q.dq, name: $q.cX, url: ORIGIN + '/' } },
{ '@type': $q.en, name: t(lang, 'dl_h'), description: t(lang, $q.ee), url: url + $q.eo, isAccessibleForFree: true, dateModified: lm, license: $t.k11, creator: { '@type': $q.ep, name: $q.cX, url: ORIGIN + '/' }, distribution: [{ '@type': $q.eq, encodingFormat: $q.er, contentUrl: ORIGIN + $q.es }] }, crumbLd(cr)];
return { title, desc, body, ld, path, lm };
}
function areaHub(F, lang) {
const path = $q.bI, title = fitT(t(lang, $q.et)), desc = fitD(t(lang, $q.eu, { k: nf(lang, F.areas.size) }));
const cr = [[$q.cX, pre(lang) + '/'], [t(lang, 'cr_ar'), pre(lang) + path]];
const byM = new Map(); for (const g of F.areas.values()) { if (!byM.has(g.mk)) byM.set(g.mk, []); byM.get(g.mk).push(g); }
const lm = [...F.areas.values()].map(g => groupStats(F, g.L).lm).sort().pop() || F.updated;
const body = $t.k12 + crumbHtml(cr) + '<h1>' + te(lang, $q.et) + $q.cY + te(lang, $q.ev, { n: nf(lang, MIN_AREA) }) + $q.da +
[...byM.entries()].sort((a, b) => b[1].length - a[1].length).map(([m, L]) => $q.ew + slugA(m) + '">' + bdi(mkName(m, lang)) + $q.dg + L.sort((a, b) => b.L.length - a.L.length).map(g => $q.bA + pre(lang) + $q.bI + g.s + '/">' + bdi(g.n) + ' (' + nf(lang, g.L.length) + $q.dh).join('') + '</ul>').join('') +
$q.ex + pre(lang) + $q.ey + te(lang, 'cr_hy') + $q.V + dataLine(F, lang, lm) + replyBox(lang) + $q.do;
const url = PUB(lang, path);
const ld = [{ '@type': $q.dp, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: lm, isPartOf: { '@type': $q.dq, name: $q.cX, url: ORIGIN + '/' } },
{ '@type': $q.dr, name: title, numberOfItems: F.areas.size, itemListElement: [...F.areas.values()].map((g, i) => ({ '@type': $q.cA, position: i + 1, name: g.n, url: PUB(lang, $q.bI + g.s + '/') })) }, crumbLd(cr)];
return { title, desc, body, ld, path, lm };
}
const ovStats = g => { const ms = g.L.map(r => r.o.m); return { k: g.L.length, n: g.n, med: median(ms), max: ms.length ? Math.max(...ms) : 0 }; };
const stgT = (lang, st) => te(lang, 'stg_' + String(st || $q.dD).replace(/[\s-]+/g, ''));
const ovPages = F => [...F.ovG.values()].filter(g => g.L.length >= OV_MIN);
function ovPage(F, s, lang) {
const g = F.ovG.get(s); if (!g || g.L.length < OV_MIN) return null;
const ix = F.ix, p = mkName(g.mk, lang), mo = fd(F.ovMonth, lang), path = $q.ez + s + '/', st = ovStats(g);
const lm = g.L.map(r => lastmod(ix, r.x)).sort().pop() || F.updated, today = new Date().toISOString().slice(0, 10), dT = fd(today, lang);
const title = fitT(t(lang, 'ov_t', { p, mo }), t(lang, 'ov_t2', { p, mo }), t(lang, 'ov_t3', { p }));
const desc = fitD(t(lang, 'ov_d', { p, d: dT, k: nf(lang, st.k), n: nf(lang, st.n) }));
const cr = [[$q.cX, pre(lang) + '/'], [t(lang, 'cr_hy'), pre(lang) + $q.bH], [t(lang, $q.eA), pre(lang) + $q.ez], [title, pre(lang) + path]];
const cols = t(lang, $q.eB);
const rows = g.L.map(({ x, o }) => { const cells = [
$q.O + pre(lang) + $q.aC + x.s + $q.eC + bdi(x.n) + '</a>',
x.dv ? (x.dvs && ix.devs.has(x.dvs) ? $q.O + pre(lang) + $q.bQ + x.dvs + '/">' + bdi(x.dv) + '</a>' : bdi(x.dv)) : te(lang, 'np'),
esc(fd(o.d, lang)) + src(x.url), '<b>' + nf(lang, o.m) + '</b>', stgT(lang, o.st), esc(fd(lastmod(ix, x), lang))];
return '<tr>' + cells.map((c, i) => '<td' + (i === 3 ? $q.cS : '') + $q.cT + esc(cols[i]) + '">' + c + '</td>').join('') + '</tr>'; }).join('');
const top = g.L[0], url = PUB(lang, path);
const Q = [[t(lang, 'ov_q1', { p }), t(lang, 'ov_a1', { d: dT, k: nf(lang, st.k), n: nf(lang, st.n) })], [t(lang, 'ov_q2', { p }), t(lang, 'ov_a2', { x: top.x.n, h: fd(top.o.d, lang), m: nf(lang, top.o.m) })], [t(lang, 'ov_q3'), t(lang, 'ov_a3')]];
const yrs = [...F.years.values()].filter(o => o.mk === g.mk).sort((a, b) => a.y - b.y);
const body = $t.k13 + crumbHtml(cr) + '<h1>' + th(lang, 'ov_t', { p: bdi(p), mo: esc(mo) }) + $q.cY + th(lang, $q.eD, { p: bdi(p) }) + $t.k14 + today + '">' + esc(dT) + $q.eE +
kv([[nf(lang, st.k), t(lang, 'kv_ov')], [nf(lang, st.n), t(lang, 'kv_wd')], [st.med == null ? '-' : nf(lang, st.med), t(lang, $q.eF)], [nf(lang, st.max), t(lang, $q.eG)]]) +
$q.db + te(lang, 'ov_h2') + $t.k15 + cols.map(c => $q.cp + esc(c) + '</th>').join('') + $q.cq + rows + $q.cr +
$q.br + te(lang, $q.eH, { d: fd(lm, lang) }) + $s.k1 +
$q.eI + te(lang, $q.eJ) + $q.ec + te(lang, $q.eK, { mo }) + '</p>' +
$q.eL + te(lang, $q.eM) + $q.eN + te(lang, $q.eO, { t: title, u: url, d: dT }) + $q.eP +
$q.ex + pre(lang) + $q.ei + te(lang, $q.eA) + '</a>' + (yrs.length ? $q.cx + th(lang, $q.eQ, { p: bdi(p) }) + $q.eR + yrs.map(o => $q.O + pre(lang) + $q.bH + o.y + '/' + o.s + '/">' + o.y + '</a>').join('') : '') + $q.eS + slugM(g.mk) + '/">' + th(lang, 'ov_mk', { p: bdi(p) }) + $q.V +
faqHtml(lang, Q) + replyBox(lang) + $q.do;
const ld = [{ '@type': $q.dS, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: lm, isPartOf: { '@type': $q.dq, name: $q.cX, url: ORIGIN + '/' } },
{ '@type': $q.en, '@id': url + '#data', name: title, description: desc, url, isAccessibleForFree: true, dateModified: lm, temporalCoverage: F.ovMonth, spatialCoverage: { '@type': 'Place', name: g.mk }, license: $t.k16, creator: { '@type': $q.ep, name: $q.cX, url: ORIGIN + '/' },
distribution: [{ '@type': $q.eq, encodingFormat: $q.er, contentUrl: ORIGIN + $q.es }, { '@type': $q.eq, encodingFormat: $q.er, contentUrl: ORIGIN + $q.eT }] },
{ '@type': $q.dr, name: title, numberOfItems: st.k, itemListElement: g.L.map((r, i) => ({ '@type': $q.cA, position: i + 1, name: r.x.n, url: PUB(lang, $q.aC + r.x.s + '/') })) }, crumbLd(cr), faqLd(Q)];
return { title, desc, body, ld, path, lm };
}
function ovHub(F, lang) {
const ix = F.ix, mo = fd(F.ovMonth, lang), path = $q.ez, today = new Date().toISOString().slice(0, 10), dT = fd(today, lang);
const G = [...F.ovG.values()].sort((a, b) => b.L.length - a.L.length || a.mk.localeCompare(b.mk)), big = G.filter(g => g.L.length >= OV_MIN), one = G.filter(g => g.L.length < OV_MIN);
const title = fitT(t(lang, 'ovh_t', { mo }), t(lang, $q.ej)), desc = fitD(t(lang, 'ovh_d', { d: dT, k: nf(lang, F.ovL.length), c: nf(lang, G.length) }));
const cr = [[$q.cX, pre(lang) + '/'], [t(lang, 'cr_hy'), pre(lang) + $q.bH], [title, pre(lang) + path]];
const cols = t(lang, $q.eU);
const rows = big.map(g => { const st = ovStats(g); return $q.ca + esc(cols[0]) + $q.cb + pre(lang) + path + g.s + '/">' + bdi(mkName(g.mk, lang)) + $q.dX + esc(cols[1]) + '"><b>' + nf(lang, st.k) + $q.dY + esc(cols[2]) + '">' + nf(lang, st.n) + $q.cf + esc(cols[3]) + '">' + nf(lang, st.max) + $q.ci; }).join('');
const lm = F.ovL.map(r => lastmod(ix, r.x)).sort().pop() || F.updated, url = PUB(lang, path);
const body = $t.k17 + crumbHtml(cr) + '<h1>' + te(lang, 'ovh_t', { mo }) + $q.cY + te(lang, $q.eV, { n: nf(lang, OV_MIN) }) + $t.k18 + today + '">' + esc(dT) + $q.eE +
kv([[nf(lang, F.ovL.length), t(lang, 'kv_ov')], [nf(lang, G.length), cols[0]]]) +
(rows ? $t.k19 + cols.map(c => $q.cp + esc(c) + '</th>').join('') + $q.cq + rows + $q.cr : '') +
(one.length ? $q.eW + te(lang, $q.eX) + $q.eY + one.map(g => { const r = g.L[0]; return '<li>' + bdi(mkName(g.mk, lang)) + $q.eZ + pre(lang) + $q.aC + r.x.s + $q.eC + bdi(r.x.n) + $q.fa + esc(fd(r.o.d, lang)) + ' · ' + nf(lang, r.o.m) + $q.bD; }).join('') + '</ul>' : '') +
$q.eI + te(lang, $q.eJ) + $q.ec + te(lang, $q.eK, { mo }) + '</p>' +
$q.eL + te(lang, $q.eM) + $q.eN + te(lang, $q.eO, { t: title, u: url, d: dT }) + $q.eP +
$q.ex + pre(lang) + $q.ey + te(lang, 'cr_hy') + $q.fb + te(lang, $q.eg) + $q.dw + pre(lang) + $q.fc + esc(stalledLabel(lang)) + $q.dw + pre(lang) + $q.el + te(lang, $q.em) + $q.V + replyBox(lang) + $q.do;
const ld = [{ '@type': $q.dp, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: lm, isPartOf: { '@type': $q.dq, name: $q.cX, url: ORIGIN + '/' } },
{ '@type': $q.en, name: title, description: desc, url, isAccessibleForFree: true, dateModified: lm, temporalCoverage: F.ovMonth, license: $t.k20, creator: { '@type': $q.ep, name: $q.cX, url: ORIGIN + '/' }, distribution: [{ '@type': $q.eq, encodingFormat: $q.er, contentUrl: ORIGIN + $q.es }] },
{ '@type': $q.dr, name: title, numberOfItems: big.length, itemListElement: big.map((g, i) => ({ '@type': $q.cA, position: i + 1, name: g.mk, url: PUB(lang, path + g.s + '/') })) }, crumbLd(cr)];
return { title, desc, body, ld, path, lm };
}
export function allPaths(F, sm) {
const out = [];
if (F.ovL.length) { out.push([$q.ez, F.ovL.map(r => lastmod(F.ix, r.x)).sort().pop()]); for (const g of ovPages(F)) out.push([$q.ez + g.s + '/', g.L.map(r => lastmod(F.ix, r.x)).sort().pop()]); }
const lmH = [...F.years.values()].map(g => groupStats(F, g.L).lm).sort().pop() || F.updated, lmA = [...F.areas.values()].map(g => groupStats(F, g.L).lm).sort().pop() || F.updated;
out.push([$q.bH, lmH]); for (const g of F.years.values()) out.push([$q.bH + g.y + '/' + g.s + '/', groupStats(F, g.L).lm]);
if (F.areas.size) { out.push([$q.bI, lmA]); for (const g of F.areas.values()) out.push([$q.bI + g.s + '/', groupStats(F, g.L).lm]); }
if (!sm) for (const pr of F.pairs.values()) out.push(['/vs/' + pr.k + '/', [lastmod(F.ix, pr.a), lastmod(F.ix, pr.b)].sort().pop()]);
return out;
}
export function renderPath(F, path, lang) {
let m;
if (path === $q.bH) return yearHub(F, lang);
if (path === $q.ez) return F.ovL.length ? ovHub(F, lang) : null;
if ((m = /^\/handover\/overdue\/([a-z0-9-]+)\/$/.exec(path))) return ovPage(F, m[1], lang);
if (path === $q.bI) return F.areas.size ? areaHub(F, lang) : null;
if ((m = /^\/handover\/(20\d\d)\/([a-z0-9-]+)\/$/.exec(path))) return yearPage(F, m[1], m[2], lang);
if ((m = /^\/areas\/([a-z0-9-]+\/[a-z0-9-]+)\/$/.exec(path))) return areaPage(F, m[1], lang);
if ((m = /^\/vs\/([a-z0-9-]+-vs-[a-z0-9-]+)\/$/.exec(path))) return vsPage(F, m[1], lang);
return null;
}
const BODY = new Map();
export async function page(req, u, env, ctx, shell) {
  if (u.pathname === SITEMAP) return sitemap(env);
  const m = u.pathname.match(PAGE_RX); if (!m || !shell) return null;
  const lang = m[1] || 'en';
  const path = '/' + u.pathname.replace(/^\/(es|de|fr|nl|ru|zh|ar)\//, '/').replace(/^\/+|\/+$/g, '') + '/';
  // a data file that failed to load must not answer 404 for a page listed in the sitemap: 503 with a retry hint instead
  let F; try { F = await facetsData(env); } catch (e) { return new Response($q.fd, { status: 503, headers: { 'retry-after': '60', 'cache-control': $q.fe, 'content-type': $q.ff } }); }
  const key = lang + '|' + path + '|' + F.v;
  let pg = BODY.get(key);
  if (!pg) { pg = renderPath(F, path, lang); if (!pg) return null; if (BODY.size >= 40) BODY.delete(BODY.keys().next().value); BODY.set(key, pg); }
  if (!m[7]) return new Response(null, { status: 301, headers: { location: pre(lang) + path + u.search, 'cache-control': $q.fg } });
  const sh = await shell(pre(lang) + $q.fh);
  const url = PUB(lang, pg.path), alts = LANGS.map(l => $q.fi + l + $q.fj + PUB(l, pg.path) + '">').join('') + $q.fk + ORIGIN + pg.path + '">';
  const tags = $q.fl + esc(pg.title) + ([...pg.title].length + 11 <= 60 ? $q.fm : '') + $q.fn + esc(pg.desc) + $q.fo + url + '">' + alts + $q.fp +
    $q.fq + esc(pg.title) + $q.fr + esc(pg.desc) + $q.fs + url + $q.ft + ogImg(url) + $q.fu +
    $q.fv + JSON.stringify({ '@context': $q.fw, '@graph': pg.ld }).replace(/</g, $q.fx) + $q.fy + CSS;
  const res = new HTMLRewriter()
    .on('html', { element(e) { e.setAttribute('lang', lang); if (lang === 'ar') e.setAttribute('dir', 'rtl'); else e.removeAttribute('dir'); } })
    .on('title', { element(e) { e.remove(); } })
    .on($q.fz, { element(e) { e.remove(); } })
    .on($q.fA, { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(pg.body, { html: true }); } })
    .on($q.fB, { element(e) { const l = e.getAttribute($q.fC); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + pg.path); } })
    .transform(new Response(sh.body, { headers: { 'content-type': $q.fD } }));
  return new Response(req.method === 'HEAD' ? null : await res.text(), { status: 200, headers: { 'content-type': $q.fD, 'cache-control': $q.fE, 'last-modified': new Date((pg.lm || F.updated) + $q.fF).toUTCString(), 'x-kb-fa': F.v } });
}
async function sitemap(env) {
let F; try { F = await facetsData(env); } catch (e) { return new Response($q.fG, { status: 503 }); }
const xe = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const urls = allPaths(F, true).flatMap(([p, lm]) => LANGS.map(l => $q.fH + xe(PUB(l, p)) + $q.fI + (lm || F.updated) + $q.fJ + LANGS.map(a => $t.k21 + a + $q.fj + xe(PUB(a, p)) + '"/>').join('') + $t.k22 + xe(ORIGIN + p) + $q.fK));
return new Response($s.k2 + urls.join('\n') + $q.fL, { headers: { 'content-type': $q.fM, 'cache-control': $q.fN } });
}
export const FA_KIT = { CSS, crumbHtml, crumbLd, kv, faqLd, replyBox, regFor };
export { tcFor, TC_SRC as TC_SOURCES, TC as TC_SETS };
