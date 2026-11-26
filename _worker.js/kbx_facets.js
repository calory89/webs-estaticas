// comments: _notes/kolaboro-worker-comments.txt
import { data as namedData, handoverOf, fd, esc, pre, lastmod, okHttp, host, reviewed, overdueOf, OV_MIN } from './kbx_named.js';
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
const t = (lang, k, v) => { let s = (FS[lang] && FS[lang][k] != null) ? FS[lang][k] : FS.en[k]; if (s == null) return k; if (typeof s !== 'string') return s; if (v) s = s.replace(/\{(\w+)\}/g, (m, a) => v[a] != null ? v[a] : m); return s; };
const te = (lang, k, v) => esc(t(lang, k, v));
const th = (lang, k, v) => { const s = esc(t(lang, k)); return v ? s.replace(/\{(\w+)\}/g, (m, a) => v[a] != null ? v[a] : m) : s; };
const nf = (lang, n, d) => { try { return Number(n).toLocaleString(LOC[lang] || 'en-GB', { maximumFractionDigits: d == null ? 0 : d }); } catch (e) { return String(n); } };
const bdi = s => '<bdi>' + esc(s) + '</bdi>';
const slugA = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const slugM = m => encodeURIComponent(String(m).toLowerCase().replace(/\s+/g, '-'));
const PUB = (lang, path) => ORIGIN + pre(lang) + path;
const money = (lang, cur, v) => '<bdi dir="ltr">' + esc((cur ? cur + ' ' : '') + nf(lang, v)) + '</bdi>';
const src = (u, label) => okHttp(u) ? ' <a class="src" href="' + esc(u.trim()) + '" rel="nofollow noopener" target="_blank">' + esc(label || host(u)) + '</a>' : (typeof u === 'string' && /^\/[a-z#]/.test(u) ? ' <a class="src" href="' + esc(u) + '">' + esc(label || 'kolaboro.com') + '</a>' : '');
const li = (inner, u, label) => '<li class="kfact">' + inner + src(u, label) + '</li>';
const clen = s => [...String(s)].length;
const cutW = (s, n) => { const a = [...s]; if (a.length <= n) return s; const c = a.slice(0, n).join(''); const k = c.lastIndexOf(' '); return (k > n * 0.6 ? c.slice(0, k) : c).replace(/[\s,;:·(]+$/, ''); };
const fitT = (...c) => c.find(x => clen(x) <= 60) || cutW(c[c.length - 1], 60);
const fitD = (...c) => { const f = c.find(x => clen(x) <= 155); if (f) return f; let d = c[c.length - 1]; const S = d.split(/(?<=[.。])\s*/).filter(Boolean); while (S.length > 1 && clen(S.join(' ')) > 155) S.pop(); d = S.join(/[。]/.test(d) ? '' : ' '); return clen(d) <= 155 ? d : cutW(d, 154) + '.'; };
const sn = n => String(n).split(/\s+[-–|:]\s+|\s*\(|,/)[0].trim() || String(n);
const median = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : Math.round((s[s.length / 2 - 1] + s[s.length / 2]) / 2)) : null; };
const SHARED = (globalThis.__kbJson = globalThis.__kbJson || {}), LOADING = {};
async function load(env, name) {
const m = SHARED[name]; if (m && (m.a || Date.now() - m.t < 600000)) return m.v;
if (LOADING[name]) return LOADING[name];
const p = (async () => {
let r = null, a = false;
try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); a = !!(r && r.ok); } catch (e) { r = null; }
if (!r || !r.ok) { try { r = await fetch(ORIGIN + '/data/' + name, { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
if (!r || !r.ok) return null;
const v = await r.json().catch(() => null); if (v) SHARED[name] = { t: Date.now(), v, a }; return v;
})();
LOADING[name] = p; const done = () => { if (LOADING[name] === p) delete LOADING[name]; }; p.then(done, done);
return p;
}
const AREA_SKIP = /^(centro|center|centre|city cent(?:re|er)|downtown area|old town|north|south|east|west|beachfront|seafront|off-plan|phase \w+|tower \w+|block \w+|plot \w+|near .*|also listed as.*)$/i;
const slugAr = v => slugA(String(v || '').replace(/[łŁ]/g, 'l').replace(/ı/g, 'i'));
const AREA_ALIAS = { cherngtalay: 'Choeng Thale' };
const areaKey = a => String(a || '').split(/[,(/;]/)[0].trim().replace(/^the\s+/i, '');
const yearOf = (ix, x) => { const h = handoverOf(ix, x); if (!h) return null; const y = hyear(h.d) || +((/(20\d\d)/.exec(String(h.d)) || [])[1] || 0); return y || null; };
const handP = (ix, x) => (ix.prom[x.id] || []).find(p => p.k === 'handover') || null;
let FIX = null;
export async function facetsData(env) {
const ix = await namedData(env);
const [tri, drift, dage, regs, ot] = await Promise.all([trData(env).catch(() => null), load(env, 'promise-drift.json'), load(env, 'domain-age.json'), load(env, 'register-checks.json'), load(env, 'on-time.json')]);
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
const OT = (ot && ot.projects) || {}, done = x => { const c = ix.caseBy.get(x.id) || {}, o = OT[x.id]; return c.stage === 'completed' || (o && /^(done_|completed_)/.test(o.s)); };
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
if (co === 'UAE' || co === 'United Arab Emirates') return mk === 'Dubai' ? TC.ae : null;
if (co === 'Spain') return mk === 'Canary Islands' ? null : mk === 'Costa del Sol' ? TC.esA : TC.es;
if (co === 'Portugal') return /madeira|azores|açores/i.test(mk + ' ' + (x.ar || '')) ? null : TC.pt;
if (co === 'United Kingdom' || co === 'UK') return /glasgow|edinburgh|scotland|wales|cardiff|aberdeen/i.test(mk + ' ' + (x.ar || '')) ? null : TC.uk;
return { Thailand: TC.th, Indonesia: TC.id, Mexico: TC.mx, Turkey: TC.tr, 'Türkiye': TC.tr }[co] || null;
}
const rt = (r, lang) => typeof r.r === 'function' ? r.r(lang) : r.r;
function useLine(x, lang) {
if (!x.s) return '';
const q = '?project=' + encodeURIComponent(x.s), P = pre(lang) + '/tools/';
return '<p class="ki kup">' + te(lang, 'co_use') + ': ' + [['late-handover', 'tl_lh', '&co=' + encodeURIComponent(x.co || '')], ['delay-compensation', 'tl_dc', ''], ['resale-exit', 'tl_rx', ''], ['deposit-protection', 'tl_dp', '&market=' + encodeURIComponent(x.mk || '')], ['yield-check', 'tl_yc', ''], ['currency-risk', 'tl_cr', ''], ['payment-risk', 'tl_pr', ''], ['payment-plan', 'tl_pp', '']].map(r => '<a href="' + P + r[0] + '/' + q + esc(r[2]) + '" rel="nofollow">' + te(lang, r[1]) + '</a>').join(' · ') + '</p>';
}
function costHtml(F, x, lang) {
const T = tcFor(x), co = coName(x.co, lang) || x.co, fx = x.fx || {};
if (!T) return { html: '<p class="ki">' + te(lang, 'co_none', { c: co }) + ' <a href="' + pre(lang) + '/tools/total-cost/' + (x.s ? '?project=' + encodeURIComponent(x.s) : '') + '">' + te(lang, 'co_tool') + '</a></p>' + useLine(x, lang), faq: null };
const p = fx.price_min > 0 && !regSale(x) && String(fx.currency || '').toUpperCase() === T.cur ? +fx.price_min : null;
let tot = 0; const used = new Set();
const rows = T.rows.map(r => { const a = p ? r.f(p) : null; if (a != null) tot += a; return li('<b>' + te(lang, r.k) + ':</b> <bdi dir="ltr">' + esc(rt(r, lang)) + '</bdi>' + (a != null && !r.fixed ? ' · ' + money(lang, T.cur, Math.round(a)) : ''), used.has(r.s[0]) ? null : (used.add(r.s[0]), TC_SRC[r.s[0]][1]), TC_SRC[r.s[0]][0]);  }).join('');
const L = [rows, T.part ? '<li>' + te(lang, T.part) + '</li>' : '', T.note ? '<li>' + te(lang, T.note) + '</li>' : '', '<li>' + te(lang, 'co_other') + '</li>'].join('');
const ex = p && T.rows.length ? '<p>' + th(lang, 'co_ex', { p: money(lang, T.cur, p), t: money(lang, T.cur, Math.round(tot)), s: money(lang, T.cur, Math.round(p + tot)) }) + '</p>' : (T.rows.length ? '<p class="ki">' + te(lang, fx.price_min > 0 ? 'co_cur' : 'co_noprice') + '</p>' : '');
const cs = TCSLUG[Object.keys(TC).find(k => TC[k] === T)], cIn = cs && (((TCPL_T[cs] || TCPL[cs] || {})[lang]) || (BPL[cs] && (BPL[cs].in[lang] || BPL[cs].in.en)));
const html = '<p class="ki">' + te(lang, 'co_intro', { c: co }) + '</p><ul class="fl">' + L + '</ul>' + ex + '<p><a class="more" href="' + pre(lang) + '/tools/total-cost/?country=' + T.tool + (x.s ? '&amp;project=' + encodeURIComponent(x.s) : '') + '">' + te(lang, 'co_tool') + '</a>' + (cIn ? ' · <a href="' + pre(lang) + '/tools/total-cost/' + cs + '/">' + esc(String(TCS[lang].c_t).replace('{in}', cIn)) + '</a>' : '') + '</p>' + useLine(x, lang);
const faqA = T.rows.length ? T.rows.map(r => t(lang, r.k) + ': ' + rt(r, lang)).join('; ') + '.' + (T.part ? ' ' + t(lang, T.part) : '') : t(lang, T.part || 'co_other');
return { html, faq: [t(lang, 'q_cost', { n: x.n }), faqA] };
}
const CO_REG = { USA: 'United States', 'United States': 'United States', UK: 'United Kingdom', 'United Kingdom': 'United Kingdom', 'Türkiye': 'Turkey' };
function regFor(F, x) {
const byM = F.REG.filter(r => r.market === x.mk && (r.checks || []).includes('permit'));
if (byM.length) return byM;
if (x.co === 'UAE' || x.co === 'United Arab Emirates') return [];
const co = CO_REG[x.co] || x.co;
let L = F.REG.filter(r => r.market === co && (r.checks || []).includes('permit'));
if (co === 'United States') L = L.filter(r => !/florida/i.test(r.register) || FLORIDA.has(x.mk));
if (co === 'Australia') L = L.filter(r => !/planning\.nsw/.test(r.url || '') || x.mk === 'Sydney');
if (co === 'United Kingdom' && /glasgow|edinburgh/i.test(x.mk)) L = [];
return L;
}
function regHtml(F, x, lang) {
const L = regFor(F, x); if (!L.length) return '';
const d = fd(String(F.regDate || '').slice(0, 10), lang), m = mkName(x.mk, lang);
return L.slice(0, 3).map(r => r.url ? li(th(lang, 'rg_line', { m: bdi(m), r: '<bdi>' + esc(r.register) + '</bdi>' }) + ' <small class="k-muted">(' + te(lang, 'rg_how', { a: t(lang, 'au_' + (r.automation === 'automated' ? 'auto' : r.automation === 'browser only' ? 'browser' : 'manual')), d }) + ')</small>', r.url, host(r.url))
: li(th(lang, 'rg_none', { r: '<bdi>' + esc(r.register) + '</bdi>', d }), '/registers/', 'kolaboro.com/registers')).join('');
}
const tt = (lang, v) => (FS[lang] && FS[lang]['tt_' + v]) || FS.en['tt_' + v] || String(v);
const ia = (ref, url) => 'https://web.archive.org/web/' + ref + '/' + url;
function changesList(F, ix, x, lang, ph, paper) {
const out = [];
const h = handP(ix, x);
if (h && (h.hist || []).length) {
let prev = null; const seen = new Set();
for (const e of h.hist) { if (!e || !e.d) continue; if (prev && e.d !== prev.d && (hkey(e.d) || e.d) !== (hkey(prev.d) || prev.d) && !seen.has(prev.d + '>' + e.d) && seen.add(prev.d + '>' + e.d)) out.push([e.seen || '', li(te(lang, 'r_ho', { a: fd(prev.d, lang), b: fd(e.d, lang) }) + ' <small class="k-muted">' + te(lang, 'r_seen', { d: fd(e.seen, lang) }) + '</small>', '/promises/', 'kolaboro.com/promises')]); prev = e; }
}
const rec = paper && paper.ph && paper.ph.projects && paper.ph.projects[x.id], pts = ((rec && rec.pts) || []).filter(p => p.head);
let priceRule = false;
for (let i = 1; i < pts.length; i++) {
const a = pts[i - 1].head, b = pts[i].head; if (a.cur !== b.cur || a.v === b.v || !(a.v > 0)) continue;
const pc = (b.v - a.v) / a.v * 100, q = pts[i], href = q.src === 'copy' ? '/projects/' + x.s + '/changes/' + q.ref + '.txt' : ia(q.ref, (rec && rec.url) || x.url);
out.push([q.d, li(th(lang, 'r_price', { a: '<bdi dir="ltr">' + esc(a.p) + '</bdi>', b: '<bdi dir="ltr">' + esc(b.p) + '</bdi>', p: '<bdi dir="ltr">' + (pc > 0 ? '+' : '') + nf(lang, pc, Math.abs(pc) < 1 ? 2 : 1) + ' %</bdi>' }) + ' <small class="k-muted">' + te(lang, 'r_seen', { d: fd(q.d, lang) }) + '</small>', href, t(lang, q.src === 'ia' ? 'r_ia' : 'r_copy'))]); priceRule = true;
}
const D = F.DR[x.id];
for (const c of (D && D.changes) || []) {
if (c.reverted || c.sha_to === EMPTY || c.sha_from === EMPTY) continue;
const a = c.from, b = c.to, on = v => v === true || v === 'stated' || (typeof v === 'number' && v > 0) || (typeof v === 'string' && v && v !== 'previous price'), off = v => v === false || v == null;
let k = null, v = {};
switch (c.f) {
case 'completion_year': if (a && b) { k = 'r_year'; v = { a, b }; } else if (a && !b) { k = 'r_year_rm'; v = { a }; } else if (b) { k = 'r_year_add'; v = { b }; } break;
case 'price_from': if (priceRule) break; if (typeof c.pct === 'number' && Math.abs(c.pct) <= 50) { k = c.pct > 0 ? 'r_pup' : 'r_pdown'; v = { p: nf(lang, Math.abs(c.pct), 1) }; } else if (a == null && b === 'stated') k = 'r_padd'; else if (a === 'stated' && b == null) k = 'r_prm'; break;
case 'permit_number': k = on(b) && off(a) ? 'r_pn_add' : on(a) && off(b) ? 'r_pn_rm' : null; break;
case 'permit_claim': k = b === true && a === false ? 'r_pc_add' : a === true && b === false ? 'r_pc_rm' : null; break;
case 'escrow_or_guarantee': k = on(b) && off(a) ? 'r_esc_add' : on(a) && off(b) ? 'r_esc_rm' : null; break;
case 'guaranteed_language': k = b === true && a === false ? 'r_g_add' : a === true && b === false ? 'r_g_rm' : null; break;
case 'advertised_yield_pct': if (a > 0 && b > 0) { k = 'r_y'; v = { a: nf(lang, a, 1), b: nf(lang, b, 1) }; } else if (b > 0) { k = 'r_y_add'; v = { b: nf(lang, b, 1) }; } else if (a > 0) { k = 'r_y_rm'; v = { a: nf(lang, a, 1) }; } break;
case 'title_type': if (a && b) { k = 'r_t'; v = { a: tt(lang, a), b: tt(lang, b) }; } break;
case 'lease_years_base': if (a > 0 && b > 0) { k = 'r_l'; v = { a, b }; } break;
}
if (!k) continue;
out.push([c.first_seen || '', li(te(lang, k, v) + ' <small class="k-muted">' + te(lang, 'r_seen', { d: fd(c.first_seen, lang) }) + '</small>', (lang === 'en' ? '' : '/' + lang) + '/projects/' + x.s + '/changes/', t(lang, 'r_copies'))]);
}
return out.sort((p, q) => String(q[0]).localeCompare(String(p[0])));
}
function changedHtml(F, ix, x, lang, ph, paper, checked, nCh) {
const NC = nCh || 4;
const L = changesList(F, ix, x, lang, ph, paper), chg = (lang === 'en' ? '' : '/' + lang) + '/projects/' + x.s + '/changes/';
const top = ph && ph.n > 1 ? te(lang, 'ch_copies', { d: fd(checked, lang), n: nf(lang, ph.n), a: fd(ph.first, lang), b: fd(ph.last, lang), c: nf(lang, ph.changed) }) : ph && ph.n ? te(lang, 'ch_one', { d: fd(checked, lang), a: fd(ph.first, lang) }) : te(lang, 'ch_last', { d: fd(checked, lang) });
const body = L.length ? '<ul class="fl">' + L.slice(0, NC).map(r => r[1]).join('') + '</ul>' + (L.length > NC ? '<p class="k-small">' + te(lang, 'ch_more_n', { k: nf(lang, L.length - NC) }) + ' <a href="#history">' + te(lang, 'ch_hist') + '</a></p>' : '') + '<p class="k-small k-muted">' + te(lang, 'ch_note') + '</p>'
: '<p>' + te(lang, ph && ph.n > 1 ? 'ch_none' : 'ch_none1', { a: fd((ph && ph.first) || checked, lang), b: fd((ph && ph.last) || checked, lang) }) + '</p>';
const sum = L.length ? t(lang, 'ch_sum', { k: nf(lang, L.length), d: fd(L[0][0] || checked, lang) }) : t(lang, ph && ph.n > 1 ? 'ch_none' : 'ch_none1', { a: fd((ph && ph.first) || checked, lang), b: fd((ph && ph.last) || checked, lang) });
return { html: '<p class="ki">' + top + (ph && ph.n ? ' <a href="' + chg + '">' + te(lang, 'ch_diff') + '</a>' : '') + '</p>' + body, n: L.length, sum };
}
function altHtml(F, ix, x, lang, nAlt) {
const fx = x.fx || {}, cur = String(fx.currency || '').toUpperCase(), p0 = regSale(x) ? 0 : +fx.price_min || 0, s0 = F.score(x.id);
let L = [];
if (p0 > 0 && cur && s0 != null) L = F.P.filter(o => o.id !== x.id && o.mk === x.mk && String((o.fx || {}).currency || '').toUpperCase() === cur && +(o.fx || {}).price_min > 0 && Math.abs(+(o.fx || {}).price_min - p0) / p0 <= 0.3 && (F.score(o.id) ?? -1) > s0)
.sort((a, b) => F.score(b.id) - F.score(a.id) || Math.abs(+a.fx.price_min - p0) - Math.abs(+b.fx.price_min - p0)).slice(0, nAlt || 3);
const mk = mkName(x.mk, lang);
const intro = '<p class="ki">' + th(lang, 'al_intro', { mk: bdi(mk), s: nf(lang, s0 == null ? 0 : s0) }) + ' <a href="' + pre(lang) + '/methods/transparency-score/">' + te(lang, 'al_m') + '</a></p>';
const list = L.length ? '<ul class="lk">' + L.map(o => '<li><a href="' + pre(lang) + '/projects/' + o.s + '/">' + bdi(o.n) + '</a> <small>' + th(lang, 'al_row', { s: nf(lang, F.score(o.id)), p: money(lang, cur, +o.fx.price_min) }) + '</small></li>').join('') + '</ul>'
: '<p>' + th(lang, !(p0 > 0) ? 'al_noprice' : 'al_none', { mk: bdi(mk) }) + '</p>';
const links = [];
for (const pr of (F.pOf.get(x.id) || []).slice(0, 2)) { const o = pr.a.id === x.id ? pr.b : pr.a; links.push('<li><a href="' + pre(lang) + '/vs/' + pr.k + '/">' + th(lang, 'vs_o', { b: bdi(o.n) }) + '</a></li>'); }
const yg = F.yOf.get(x.id); if (yg) links.push('<li><a href="' + pre(lang) + '/handover/' + yg.y + '/' + yg.s + '/">' + th(lang, 'yp_l', { k: nf(lang, yg.L.length), y: yg.y, mk: bdi(mk) }) + '</a></li>');
for (const ag of [F.aOf.get(x.id), F.aMore && F.aMore.get(x.id)]) if (ag) links.push('<li><a href="' + pre(lang) + '/areas/' + ag.s + '/">' + th(lang, 'ar_l', { k: nf(lang, ag.L.length), a: bdi(ag.n) }) + '</a></li>');
return intro + list + (links.length ? '<h3>' + te(lang, 'al_more') + '</h3><ul class="lk">' + links.join('') + '</ul>' : '');
}
const regd = h => { const p = h.split('.'); return p.length > 2 && /^(co|com|net|org|ac|gov|or|go|ne)$/.test(p[p.length - 2]) && p[p.length - 1].length === 2 ? p.slice(-3).join('.') : p.slice(-2).join('.'); };
function domLine(F, x, lang) {
const d = F.DA[x.id]; if (!d || d.site !== 'own' || !(d.reg || d.ct)) return '';
const h = host(x.url); if (!h) return '';
const parts = [d.reg ? te(lang, 'dm_reg', { d: fd(d.reg, lang) }) : '', d.ct ? te(lang, 'dm_ct', { d: fd(d.ct, lang) }) : ''].filter(Boolean).join('; ');
return li(th(lang, 'dm_line', { h: '<bdi dir="ltr">' + esc(h) + '</bdi>' }) + ' ' + parts + ' <small class="k-muted">(' + te(lang, 'dm_chk', { d: fd(d.checked || F.daDate, lang) }) + ')</small>', 'https://rdap.org/domain/' + encodeURIComponent(regd(h)), 'RDAP');
}
function activeLine(F, x, lang) {
const d = x.dvs && F.dev.get(x.dvs); if (!d || !x.dv) return '';
return li(th(lang, 'ac_line', { dev: bdi(x.dv), a: nf(lang, d.k - d.done), c: nf(lang, d.done), k: nf(lang, d.k) }), pre(lang) + '/developers/' + x.dvs + '/', 'kolaboro.com');
}
function delayLine(F, x, lang) {
const d = F.dl.get(x.mk); if (!d || d.n < MIN_DELAY) return '';
return li(th(lang, 'dl_line', { mk: bdi(mkName(x.mk, lang)), k: nf(lang, d.k), n: nf(lang, d.n), m: nf(lang, d.avg, 1), mm: nf(lang, d.avgMoved, 1) }), pre(lang) + '/handover/#delay', 'kolaboro.com/handover');
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
h: { changed: t(lang, 'ch_h'), cost: t(lang, 'co_h', { n: x.n }), alt: t(lang, 'al_h', { n: x.n }), tocChanged: t(lang, 'toc_ch'), tocCost: t(lang, 'toc_co'), tocAlt: t(lang, 'toc_al') },
regs: regFor(F, x).filter(r => r.url).slice(0, 3).map(r => ({ n: r.register, u: r.url })) };
}
export function costCalc(x, p, lang) {
const T = tcFor(x); if (!T) return null;
const rows = T.rows.map(r => ({ label: t(lang, r.k), rate: rt(r, lang), amount: p > 0 ? Math.round(r.f(p)) : null, src: TC_SRC[r.s[0]] ? TC_SRC[r.s[0]][1] : null }));
return { cur: T.cur, rows, part: T.part ? t(lang, T.part) : null, note: T.note ? t(lang, T.note) : null, tool: '/tools/total-cost/?country=' + T.tool };
}
const OUT = { open: 'o_open', moved: 'o_moved', missed: 'o_missed', done_on_time: 'o_ontime', done_late: 'o_late', completed_no_date: 'o_done', no_date: 'o_nodate', inconsistent: 'o_reread' };
export function devFacets(F, ix, dv, lang) {
if (!F || COI_RX.test(String(dv.n || ''))) return null;
const L = dv.ids.map(i => ix.byId.get(i)).filter(Boolean), d = F.dev.get(dv.s) || { k: L.length, done: 0 };
const cols = t(lang, 'pv_cols');
const quiet = o => (o.s === 'open' && !o.moved) || o.s === 'no_date';
const nQuiet = L.filter(x => F.OT[x.id] && F.OT[x.id].s === 'open' && !F.OT[x.id].moved).length, nNo = L.filter(x => F.OT[x.id] && F.OT[x.id].s === 'no_date').length;
const PRI = { done_on_time: 0, done_late: 0, completed_no_date: 1, missed: 2, moved: 3, open: 4 }, Lr = L.filter(x => F.OT[x.id] && !quiet(F.OT[x.id])).sort((a, b) => (PRI[F.OT[a.id].s] ?? 5) - (PRI[F.OT[b.id].s] ?? 5) || (F.OT[b.id].moved || 0) - (F.OT[a.id].moved || 0));
const rows = Lr.slice(0, 10).map(x => { const o = F.OT[x.id]; if (!o) return null; const late = o.s === 'missed' ? o.overdue : 0;
const hp = handP(ix, x), h = handoverOf(ix, x), first = (hp && ((hp.hist || []).find(e => e && e.d) || {}).d) || (!o.moved && h ? h.d : o.first), last = (hp && hp.d) || (h && h.d) || o.cur;
return '<tr><td data-label="' + esc(cols[0]) + '"><a href="' + pre(lang) + '/projects/' + x.s + '/#delivery">' + bdi(x.n) + '</a></td><td data-label="' + esc(cols[1]) + '">' + esc(first ? fd(first, lang) : '-') + '</td><td data-label="' + esc(cols[2]) + '">' + esc(last ? fd(last, lang) : '-') + '</td><td class="k-n" data-label="' + esc(cols[3]) + '">' + (o.moved ? nf(lang, o.moved) : '0') + '</td><td data-label="' + esc(cols[4]) + '">' + te(lang, OUT[o.s] || 'o_reread') + (late ? ' <small class="k-muted">(' + te(lang, 'o_late_m', { m: nf(lang, late) }) + ')</small>' : '') + '</td></tr>'; }).filter(Boolean);
const nDone = L.filter(x => F.OT[x.id] && /^(done_|completed_)/.test(F.OT[x.id].s)).length, nOn = L.filter(x => F.OT[x.id] && F.OT[x.id].s === 'done_on_time').length;
const pv = '<p class="ki">' + th(lang, 'pv_intro', { dev: bdi(dv.n) }) + '</p><ul class="fl">' + li(th(lang, 'pv_sum', { k: nf(lang, nDone), o: nf(lang, nOn), a: nf(lang, d.k - d.done), n: nf(lang, d.k) }), '/data/on-time.json', 'kolaboro.com/data/on-time.json') + (nQuiet || nNo ? '<li>' + te(lang, 'pv_quiet', { q: nf(lang, nQuiet), z: nf(lang, nNo) }) + '</li>' : '') + '</ul>' +
(rows.length ? TB.kbx_facets__t.k0 + cols.map(c => '<th scope="col">' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>' + (Lr.length > 10 ? TB.kbx_facets__t.k1 + te(lang, 'ch_more_n', { k: nf(lang, Lr.length - 10) }) + '</a></p>' : '') : '<p>' + te(lang, 'pv_none') + '</p>') +
'<p class="k-small k-muted">' + te(lang, 'pv_rule', { d: fd(F.otDate, lang) }) + '</p>';
const doms = [...new Map(L.map(x => [host(x.url), x])).values()].map(x => domLine(F, x, lang)).filter(Boolean).slice(0, 3).join('');
return { pv, h: t(lang, 'pv_h'), toc: t(lang, 'toc_pv'), active: te(lang, 'ac_dev', { a: nf(lang, d.k - d.done), c: nf(lang, d.done), k: nf(lang, d.k) }), doms: doms ? '<ul class="fl">' + doms + '</ul>' : '',
faq: [t(lang, 'q_pv', { dev: dv.n }), t(lang, 'pv_sum', { k: nf(lang, nDone), o: nf(lang, nOn), a: nf(lang, d.k - d.done), n: nf(lang, d.k) })] };
}
const CSS = '<style id="kfa-css">.kfa h2{margin-top:var(--k-7,48px)}.kfa .k-phead{margin-bottom:var(--k-5,24px)}.kfa-kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));border:1px solid var(--k-line);border-radius:var(--k-r-lg,14px);overflow:hidden;background:var(--k-surface);margin:var(--k-4,16px) 0}.kfa-kv div{padding:12px 16px;border-inline-end:1px solid var(--k-line)}.kfa-kv b{display:block;font-size:var(--k-fs-xl,24px);font-variant-numeric:tabular-nums}.kfa-kv span{font-size:var(--k-fs-xs,13px);color:var(--k-muted)}' +
'.kfa .k-table-wrap{overflow-x:auto;margin:var(--k-3,12px) 0 var(--k-5,24px)}.kfa td{vertical-align:top}.kfa-l{display:flex;flex-wrap:wrap;gap:8px 16px;padding:0;list-style:none;margin:var(--k-3,12px) 0}.kfa-l li{margin:0}.kfa-box{border:1px solid var(--k-line-2);border-radius:var(--k-r-lg,14px);background:var(--k-surface);padding:16px 20px;margin:var(--k-6,32px) 0;max-width:760px}.kfa-vs{table-layout:fixed;width:100%}.kfa-vs th,.kfa-vs td{overflow-wrap:anywhere;word-break:break-word}.kfa-vs th[scope=row]{text-align:start;font-weight:600;width:28%}.kfa-vs td{width:36%}@media (max-width:640px){.kfa-vs th[scope=row]{width:auto}}.kfa code{white-space:normal;overflow-wrap:anywhere}</style>';
const crumbHtml = list => '<p class="k-crumb">' + list.map((c, i) => i < list.length - 1 ? '<a href="' + c[1] + '">' + esc(c[0]) + '</a>' : '<span>' + esc(c[0]) + '</span>').join(' / ') + '</p>';
const crumbLd = list => ({ '@type': 'BreadcrumbList', itemListElement: list.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: ORIGIN + c[1] })) });
const replyBox = lang => '<div class="kfa-box"><p><b>' + te(lang, 'rp_h') + '</b> ' + te(lang, 'rp_t') + TB.kbx_facets__t.k2 + te(lang, 'rp_b') + TB.kbx_facets__t.k3 + te(lang, 'rp_c') + '</a></p></div>';
const kv = items => '<div class="kfa-kv">' + items.map(([v, l]) => '<div><b>' + v + '</b><span>' + esc(l) + '</span></div>').join('') + '</div>';
const faqHtml = (lang, Q) => '<h2 id="faq">' + te(lang, 'faq_h') + '</h2><div class="k-disc">' + Q.map(([q, a]) => '<details><summary>' + esc(q) + '</summary><p>' + esc(a) + '</p></details>').join('') + '</div>';
const faqLd = Q => ({ '@type': 'FAQPage', mainEntity: Q.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
function projTable(F, lang, L, withPlace) {
const ix = F.ix, cols = t(lang, withPlace ? 'pt_cols_a' : 'pt_cols');
const rows = L.map(x => { const h = handoverOf(ix, x), hp = handP(ix, x), sc = F.score(x.id), cells = [
'<a href="' + pre(lang) + '/projects/' + x.s + '/">' + bdi(x.n) + '</a>',
x.dv ? (x.dvs && ix.devs.has(x.dvs) ? '<a href="' + pre(lang) + '/developers/' + x.dvs + '/">' + bdi(x.dv) + '</a>' : bdi(x.dv)) : te(lang, 'np'),
...(withPlace ? [esc(placeName(x.ar || x.mk, lang))] : []),
h ? esc(fd(h.d, lang)) : te(lang, 'np'),
hp && hp.mv ? te(lang, 'mv_k', { k: nf(lang, hp.mv), m: nf(lang, hp.mm || 0) }) : hp ? te(lang, 'mv_0') : '-',
x.pn ? te(lang, 'yes') : te(lang, 'np'),
sc == null ? '-' : '<b>' + nf(lang, sc) + '</b>'];
return '<tr>' + cells.map((c, i) => '<td' + (i === cells.length - 1 ? ' class="k-n"' : '') + ' data-label="' + esc(cols[i]) + '">' + c + '</td>').join('') + '</tr>'; }).join('');
return TB.kbx_facets__t.k4 + cols.map(c => '<th scope="col">' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}
const groupStats = (F, L) => { const ix = F.ix, sc = L.map(x => F.score(x.id)).filter(v => v != null); return { n: L.length, pn: L.filter(x => x.pn).length, mv: L.filter(x => { const h = handP(ix, x); return h && h.mv > 0; }).length, med: median(sc), lm: L.map(x => lastmod(ix, x)).sort().pop() }; };
const dataLine = (F, lang, d) => '<p class="k-small k-muted">' + te(lang, 'data_line', { d: fd(d || F.updated, lang) }) + ' <a href="' + pre(lang) + '/methods/transparency-score/">' + te(lang, 'al_m') + TB.kbx_facets__s.k0;
function yearPage(F, y, s, lang) {
const g = F.years.get(y + '/' + s); if (!g) return null;
const mk = mkName(g.mk, lang), st = groupStats(F, g.L), path = '/handover/' + y + '/' + s + '/';
const title = fitT(t(lang, 'hy_title', { y, p: mk }), t(lang, 'hy_h2', { y, p: mk })), desc = fitD(t(lang, 'hy_desc', { k: nf(lang, st.n), p: mk, y, pn: nf(lang, st.pn), d: fd(st.lm, lang) }));
const cr = [['Kolaboro', pre(lang) + '/'], [t(lang, 'cr_hy'), pre(lang) + '/handover/'], [title, pre(lang) + path]];
const others = [...F.years.values()].filter(o => o.mk === g.mk && o.y !== g.y).sort((a, b) => a.y - b.y), same = [...F.years.values()].filter(o => o.y === g.y && o.mk !== g.mk).sort((a, b) => b.L.length - a.L.length).slice(0, 12);
const ar = [...F.areas.values()].filter(a => a.mk === g.mk), pp = [...F.pairs.values()].filter(p => p.g === g);
const d = F.dl.get(g.mk);
const Q = [[t(lang, 'hy_q1', { y, p: mk }), t(lang, 'hy_a1', { k: nf(lang, st.n), y, p: mk, d: fd(st.lm, lang) })], [t(lang, 'hy_q2', { y, p: mk }), t(lang, 'hy_a2', { pn: nf(lang, st.pn), k: nf(lang, st.n) })], [t(lang, 'hy_q3', { y, p: mk }), t(lang, 'hy_a3', { mv: nf(lang, st.mv), k: nf(lang, st.n) })]];
let body = TB.kbx_facets__t.k5 + crumbHtml(cr) + '<h1>' + th(lang, 'hy_title', { y, p: bdi(mk) }) + '</h1><p class="lead">' + th(lang, 'hy_lead', { y, p: bdi(mk) }) + '</p></div>' +
kv([[nf(lang, st.n), t(lang, 'kv_n')], [nf(lang, st.pn), t(lang, 'kv_pn')], [nf(lang, st.mv), t(lang, 'kv_mv')], [st.med == null ? '-' : nf(lang, st.med), t(lang, 'kv_sc')]]) +
'<h2 id="projects">' + te(lang, 'hy_h2', { y, p: mk }) + '</h2>' + projTable(F, lang, g.L, true) + dataLine(F, lang, st.lm) +
(d && d.n >= MIN_DELAY ? '<p>' + th(lang, 'dl_line', { mk: bdi(mk), k: nf(lang, d.k), n: nf(lang, d.n), m: nf(lang, d.avg, 1), mm: nf(lang, d.avgMoved, 1) }) + ' <a href="' + pre(lang) + '/handover/#delay">' + te(lang, 'dl_all') + '</a></p>' : '') +
(others.length ? '<h2 id="years">' + te(lang, 'hy_other_y', { p: mk }) + '</h2><ul class="kfa-l">' + others.map(o => '<li><a href="' + pre(lang) + '/handover/' + o.y + '/' + o.s + '/">' + o.y + ' (' + nf(lang, o.L.length) + ')</a></li>').join('') + '</ul>' : '') +
(same.length ? '<h2 id="places">' + te(lang, 'hy_other_p', { y }) + '</h2><ul class="kfa-l">' + same.map(o => '<li><a href="' + pre(lang) + '/handover/' + o.y + '/' + o.s + '/">' + bdi(mkName(o.mk, lang)) + ' (' + nf(lang, o.L.length) + ')</a></li>').join('') + '</ul>' : '') +
(ar.length ? '<h2 id="areas">' + te(lang, 'ar_in', { p: mk }) + '</h2><ul class="kfa-l">' + ar.map(a => '<li><a href="' + pre(lang) + '/areas/' + a.s + '/">' + bdi(a.n) + ' (' + nf(lang, a.L.length) + ')</a></li>').join('') + '</ul>' : '') +
(pp.length ? '<h2 id="compare">' + te(lang, 'al_more') + '</h2><ul class="kfa-l">' + pp.map(p => '<li><a href="' + pre(lang) + '/vs/' + p.k + '/">' + th(lang, 'vs_l', { a: bdi(p.a.n), b: bdi(p.b.n) }) + '</a></li>').join('') + '</ul>' : '') +
'<p class="kfa-l"><a href="/m/' + slugM(g.mk) + '/">' + th(lang, 'mk_link', { p: bdi(mk) }) + '</a></p>' +
faqHtml(lang, Q) + replyBox(lang) + '</div></section></div>';
const url = PUB(lang, path);
const ld = [{ '@type': 'CollectionPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: st.lm, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
{ '@type': 'ItemList', name: title, numberOfItems: st.n, itemListElement: g.L.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.n, url: PUB(lang, '/projects/' + x.s + '/') })) }, crumbLd(cr), faqLd(Q)];
return { title, desc, body, ld, path, lm: st.lm };
}
function areaPage(F, s, lang) {
const g = F.areas.get(s); if (!g) return null;
const mk = mkName(g.mk, lang), st = groupStats(F, g.L), path = '/areas/' + s + '/', an = g.n;
const title = fitT(t(lang, 'ar_title', { a: an, p: mk }), t(lang, 'ar_h2', { a: an })), desc = fitD(t(lang, 'ar_desc', { k: nf(lang, st.n), a: an, p: mk, pn: nf(lang, st.pn), d: fd(st.lm, lang) }));
const cr = [['Kolaboro', pre(lang) + '/'], [t(lang, 'cr_ar'), pre(lang) + '/areas/'], [title, pre(lang) + path]];
const yrs = [...new Set(g.L.map(x => F.yr.get(x.id)).filter(Boolean))].sort().map(y => F.years.get(y + '/' + slugA(g.mk))).filter(Boolean);
const ar = [...F.areas.values()].filter(a => a.mk === g.mk && a.s !== s);
const Q = [[t(lang, 'ar_q1', { a: an }), t(lang, 'ar_a1', { k: nf(lang, st.n), a: an, p: mk, d: fd(st.lm, lang) })], [t(lang, 'ar_q2', { a: an }), t(lang, 'hy_a2', { pn: nf(lang, st.pn), k: nf(lang, st.n) })], [t(lang, 'ar_q3', { a: an }), t(lang, 'hy_a3', { mv: nf(lang, st.mv), k: nf(lang, st.n) })]];
const body = TB.kbx_facets__t.k6 + crumbHtml(cr) + '<h1>' + th(lang, 'ar_title', { a: bdi(an), p: bdi(mk) }) + '</h1><p class="lead">' + th(lang, 'ar_lead', { a: bdi(an), p: bdi(mk) }) + '</p></div>' +
kv([[nf(lang, st.n), t(lang, 'kv_n')], [nf(lang, st.pn), t(lang, 'kv_pn')], [nf(lang, st.mv), t(lang, 'kv_mv')], [st.med == null ? '-' : nf(lang, st.med), t(lang, 'kv_sc')]]) +
'<h2 id="projects">' + te(lang, 'ar_h2', { a: an }) + '</h2>' + projTable(F, lang, g.L, false) + '<p class="k-small k-muted">' + te(lang, 'ar_rule', { a: an }) + '</p>' + dataLine(F, lang, st.lm) +
(yrs.length ? '<h2 id="years">' + te(lang, 'hy_other_y', { p: mk }) + '</h2><ul class="kfa-l">' + yrs.map(o => '<li><a href="' + pre(lang) + '/handover/' + o.y + '/' + o.s + '/">' + o.y + ' (' + nf(lang, o.L.length) + ')</a></li>').join('') + '</ul>' : '') +
(ar.length ? '<h2 id="areas">' + te(lang, 'ar_in', { p: mk }) + '</h2><ul class="kfa-l">' + ar.map(a => '<li><a href="' + pre(lang) + '/areas/' + a.s + '/">' + bdi(a.n) + ' (' + nf(lang, a.L.length) + ')</a></li>').join('') + '</ul>' : '') +
'<p class="kfa-l"><a href="/m/' + slugM(g.mk) + '/">' + th(lang, 'mk_link', { p: bdi(mk) }) + '</a> <a href="' + pre(lang) + '/areas/">' + te(lang, 'cr_ar') + '</a></p>' +
faqHtml(lang, Q) + replyBox(lang) + '</div></section></div>';
const url = PUB(lang, path);
const ld = [{ '@type': 'CollectionPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: st.lm, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' }, about: { '@type': 'Place', name: an, containedInPlace: { '@type': 'Place', name: g.mk } } },
{ '@type': 'ItemList', name: title, numberOfItems: st.n, itemListElement: g.L.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.n, url: PUB(lang, '/projects/' + x.s + '/') })) }, crumbLd(cr), faqLd(Q)];
return { title, desc, body, ld, path, lm: st.lm };
}
function vsPage(F, k, lang) {
const pr = F.pairs.get(k); if (!pr) return null;
const ix = F.ix, a = pr.a, b = pr.b, mk = mkName(a.mk, lang), y = pr.g.y, path = '/vs/' + k + '/';
const title = fitT(t(lang, 'vs_title', { a: a.n, b: b.n }), t(lang, 'vs_l', { a: a.n, b: b.n }), t(lang, 'vs_title', { a: sn(a.n), b: sn(b.n) }), t(lang, 'vs_l', { a: sn(a.n), b: sn(b.n) })), lm = [lastmod(ix, a), lastmod(ix, b)].sort().pop();
const desc = fitD(t(lang, 'vs_desc', { a: a.n, b: b.n, p: mk, y }), t(lang, 'vs_desc', { a: sn(a.n), b: sn(b.n), p: mk, y }));
const cr = [['Kolaboro', pre(lang) + '/'], [t(lang, 'cr_vs'), '/vs/'], [t(lang, 'vs_l', { a: a.n, b: b.n }), pre(lang) + path]];
const cell = (x, f) => f(x);
const R = [
['vs_dev', x => x.dv ? (x.dvs && ix.devs.has(x.dvs) ? '<a href="' + pre(lang) + '/developers/' + x.dvs + '/">' + bdi(x.dv) + '</a>' : bdi(x.dv)) : te(lang, 'np')],
['vs_area', x => esc(placeName(x.ar || x.mk, lang))],
['vs_stage', x => te(lang, 'stg_' + String((ix.caseBy.get(x.id) || {}).stage || x.st || 'unknown').replace(/[^a-z]/g, ''))],
['vs_ho', x => { const h = handoverOf(ix, x); return h ? esc(fd(h.d, lang)) : te(lang, 'np'); }],
['vs_mv', x => { const h = handP(ix, x); return h && h.mv ? te(lang, 'mv_k', { k: nf(lang, h.mv), m: nf(lang, h.mm || 0) }) : h ? te(lang, 'mv_0') : '-'; }],
['vs_pn', x => x.pn ? '<bdi dir="ltr">' + esc(x.pn) + '</bdi>' : te(lang, 'np')],
['vs_price', x => { const fx = x.fx || {}, R = regSale(x); if (R) return esc(rsText(lang, R)); return fx.price_min > 0 ? money(lang, fx.currency || '', +fx.price_min) : te(lang, 'np'); }],
['vs_sc', x => { const s = F.score(x.id); return s == null ? '-' : '<b>' + nf(lang, s) + '</b> / 100'; }],
['vs_dom', x => { const d = F.DA[x.id]; return d && d.site === 'own' && d.reg ? esc(fd(d.reg, lang)) : te(lang, 'np'); }],
['vs_chk', x => esc(fd(lastmod(ix, x), lang))]];
const head = '<tr><th scope="col">' + te(lang, 'vs_fact') + '</th>' + [a, b].map(x => '<th scope="col"><a href="' + pre(lang) + '/projects/' + x.s + '/">' + bdi(x.n) + '</a></th>').join('') + '</tr>';
const rows = R.map(([k2, f]) => '<tr><th scope="row">' + te(lang, k2) + '</th>' + [a, b].map(x => '<td>' + cell(x, f) + '</td>').join('') + '</tr>').join('');
const more = (F.pOf.get(a.id) || []).concat(F.pOf.get(b.id) || []).filter(p => p.k !== k);
const yg = F.years.get(y + '/' + pr.g.s);
const body = TB.kbx_facets__t.k7 + crumbHtml(cr) + '<h1>' + th(lang, 'vs_l', { a: bdi(a.n), b: bdi(b.n) }) + '</h1><p class="lead">' + th(lang, 'vs_lead', { p: bdi(mk), y }) + '</p></div>' +
TB.kbx_facets__t.k8 + head + '</thead><tbody>' + rows + '</tbody></table></div>' +
'<p class="k-small k-muted">' + te(lang, 'vs_note') + '</p>' + dataLine(F, lang, lm) +
'<ul class="kfa-l">' + [a, b].map(x => '<li><a href="' + pre(lang) + '/projects/' + x.s + '/">' + th(lang, 'vs_all', { n: bdi(x.n) }) + '</a></li>').join('') + (yg ? '<li><a href="' + pre(lang) + '/handover/' + y + '/' + yg.s + '/">' + th(lang, 'yp_l', { k: nf(lang, yg.L.length), y, mk: bdi(mk) }) + '</a></li>' : '') + more.slice(0, 4).map(p => '<li><a href="' + pre(lang) + '/vs/' + p.k + '/">' + th(lang, 'vs_l', { a: bdi(p.a.n), b: bdi(p.b.n) }) + '</a></li>').join('') + '</ul>' +
replyBox(lang) + '</div></section></div>';
const url = PUB(lang, path);
const ld = [{ '@type': 'WebPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: lm, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' }, about: [a, b].map(x => ({ '@type': 'Place', name: x.n, url: PUB(lang, '/projects/' + x.s + '/') })) },
{ '@type': 'ItemList', name: title, numberOfItems: 2, itemListElement: [a, b].map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.n, url: PUB(lang, '/projects/' + x.s + '/') })) }, crumbLd(cr)];
return { title, desc, body, ld, path, lm };
}
function yearHub(F, lang) {
const path = '/handover/', title = fitT(t(lang, 'hub_title')), desc = fitD(t(lang, 'hub_desc', { k: nf(lang, F.years.size) }));
const cr = [['Kolaboro', pre(lang) + '/'], [t(lang, 'cr_hy'), pre(lang) + path]];
const byY = new Map(); for (const g of F.years.values()) { if (!byY.has(g.y)) byY.set(g.y, []); byY.get(g.y).push(g); }
const ys = [...byY.keys()].sort();
const D = [...F.dl.values()].filter(d => d.n >= MIN_DELAY).sort((a, b) => b.avg - a.avg || b.n - a.n);
const dc = t(lang, 'dl_cols');
const dt = TB.kbx_facets__t.k9 + dc.map(c => '<th scope="col">' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' + D.map(d => '<tr><td data-label="' + esc(dc[0]) + '"><a href="/m/' + slugM(d.mk) + '/">' + bdi(mkName(d.mk, lang)) + '</a></td><td class="k-n" data-label="' + esc(dc[1]) + '">' + nf(lang, d.n) + '</td><td class="k-n" data-label="' + esc(dc[2]) + '">' + nf(lang, d.k) + '</td><td class="k-n" data-label="' + esc(dc[3]) + '"><b>' + nf(lang, d.avg, 1) + '</b></td><td class="k-n" data-label="' + esc(dc[4]) + '">' + (d.k ? nf(lang, d.avgMoved, 1) : '-') + '</td></tr>').join('') + '</tbody></table></div>';
const lm = [...F.years.values()].map(g => groupStats(F, g.L).lm).sort().pop() || F.updated;
const body = TB.kbx_facets__t.k10 + crumbHtml(cr) + '<h1>' + te(lang, 'hub_title') + '</h1><p class="lead">' + te(lang, 'hub_lead') + '</p></div>' +
ys.map(y => '<h2 id="y' + y + '">' + te(lang, 'hub_y', { y }) + '</h2><ul class="kfa-l">' + byY.get(y).sort((a, b) => b.L.length - a.L.length).map(g => '<li><a href="' + pre(lang) + '/handover/' + g.y + '/' + g.s + '/">' + bdi(mkName(g.mk, lang)) + ' (' + nf(lang, g.L.length) + ')</a></li>').join('') + '</ul>').join('') +
'<h2 id="delay">' + te(lang, 'dl_h') + '</h2><p>' + te(lang, 'dl_intro', { n: nf(lang, MIN_DELAY) }) + '</p>' + dt + '<p class="k-small k-muted">' + te(lang, 'dl_rule') + ' <a href="/index/delays/">' + te(lang, 'dl_idx') + '</a></p>' +
'<p class="kfa-l">' + (F.ovL.length ? '<a href="' + pre(lang) + '/handover/overdue/">' + te(lang, 'ovh_t2') + '</a> ' : '') + '<a href="' + pre(lang) + '/areas/">' + te(lang, 'cr_ar') + '</a> <a href="/vs/">' + te(lang, 'cr_vs') + '</a> <a href="' + pre(lang) + '/rankings/transparency/">' + te(lang, 'tr_link') + '</a></p>' + dataLine(F, lang, lm) + replyBox(lang) + '</div></section></div>';
const url = PUB(lang, path);
const ld = [{ '@type': 'CollectionPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: lm, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
{ '@type': 'Dataset', name: t(lang, 'dl_h'), description: t(lang, 'dl_rule'), url: url + '#delay', isAccessibleForFree: true, dateModified: lm, license: TB.kbx_facets__t.k11, creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/data/promises.json' }] }, crumbLd(cr)];
return { title, desc, body, ld, path, lm };
}
function areaHub(F, lang) {
const path = '/areas/', title = fitT(t(lang, 'ah_title')), desc = fitD(t(lang, 'ah_desc', { k: nf(lang, F.areas.size) }));
const cr = [['Kolaboro', pre(lang) + '/'], [t(lang, 'cr_ar'), pre(lang) + path]];
const byM = new Map(); for (const g of F.areas.values()) { if (!byM.has(g.mk)) byM.set(g.mk, []); byM.get(g.mk).push(g); }
const lm = [...F.areas.values()].map(g => groupStats(F, g.L).lm).sort().pop() || F.updated;
const body = TB.kbx_facets__t.k12 + crumbHtml(cr) + '<h1>' + te(lang, 'ah_title') + '</h1><p class="lead">' + te(lang, 'ah_lead', { n: nf(lang, MIN_AREA) }) + '</p></div>' +
[...byM.entries()].sort((a, b) => b[1].length - a[1].length).map(([m, L]) => '<h2 id="' + slugA(m) + '">' + bdi(mkName(m, lang)) + '</h2><ul class="kfa-l">' + L.sort((a, b) => b.L.length - a.L.length).map(g => '<li><a href="' + pre(lang) + '/areas/' + g.s + '/">' + bdi(g.n) + ' (' + nf(lang, g.L.length) + ')</a></li>').join('') + '</ul>').join('') +
'<p class="kfa-l"><a href="' + pre(lang) + '/handover/">' + te(lang, 'cr_hy') + '</a></p>' + dataLine(F, lang, lm) + replyBox(lang) + '</div></section></div>';
const url = PUB(lang, path);
const ld = [{ '@type': 'CollectionPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: lm, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
{ '@type': 'ItemList', name: title, numberOfItems: F.areas.size, itemListElement: [...F.areas.values()].map((g, i) => ({ '@type': 'ListItem', position: i + 1, name: g.n, url: PUB(lang, '/areas/' + g.s + '/') })) }, crumbLd(cr)];
return { title, desc, body, ld, path, lm };
}
const ovStats = g => { const ms = g.L.map(r => r.o.m); return { k: g.L.length, n: g.n, med: median(ms), max: ms.length ? Math.max(...ms) : 0 }; };
const stgT = (lang, st) => te(lang, 'stg_' + String(st || 'unknown').replace(/[\s-]+/g, ''));
const ovPages = F => [...F.ovG.values()].filter(g => g.L.length >= OV_MIN);
function ovPage(F, s, lang) {
const g = F.ovG.get(s); if (!g || g.L.length < OV_MIN) return null;
const ix = F.ix, p = mkName(g.mk, lang), mo = fd(F.ovMonth, lang), path = '/handover/overdue/' + s + '/', st = ovStats(g);
const lm = g.L.map(r => lastmod(ix, r.x)).sort().pop() || F.updated, today = new Date().toISOString().slice(0, 10), dT = fd(today, lang);
const title = fitT(t(lang, 'ov_t', { p, mo }), t(lang, 'ov_t2', { p, mo }), t(lang, 'ov_t3', { p }));
const desc = fitD(t(lang, 'ov_d', { p, d: dT, k: nf(lang, st.k), n: nf(lang, st.n) }));
const cr = [['Kolaboro', pre(lang) + '/'], [t(lang, 'cr_hy'), pre(lang) + '/handover/'], [t(lang, 'ov_back'), pre(lang) + '/handover/overdue/'], [title, pre(lang) + path]];
const cols = t(lang, 'ov_cols');
const rows = g.L.map(({ x, o }) => { const cells = [
'<a href="' + pre(lang) + '/projects/' + x.s + '/#overdue">' + bdi(x.n) + '</a>',
x.dv ? (x.dvs && ix.devs.has(x.dvs) ? '<a href="' + pre(lang) + '/developers/' + x.dvs + '/">' + bdi(x.dv) + '</a>' : bdi(x.dv)) : te(lang, 'np'),
esc(fd(o.d, lang)) + src(x.url), '<b>' + nf(lang, o.m) + '</b>', stgT(lang, o.st), esc(fd(lastmod(ix, x), lang))];
return '<tr>' + cells.map((c, i) => '<td' + (i === 3 ? ' class="k-n"' : '') + ' data-label="' + esc(cols[i]) + '">' + c + '</td>').join('') + '</tr>'; }).join('');
const top = g.L[0], url = PUB(lang, path);
const Q = [[t(lang, 'ov_q1', { p }), t(lang, 'ov_a1', { d: dT, k: nf(lang, st.k), n: nf(lang, st.n) })], [t(lang, 'ov_q2', { p }), t(lang, 'ov_a2', { x: top.x.n, h: fd(top.o.d, lang), m: nf(lang, top.o.m) })], [t(lang, 'ov_q3'), t(lang, 'ov_a3')]];
const yrs = [...F.years.values()].filter(o => o.mk === g.mk).sort((a, b) => a.y - b.y);
const body = TB.kbx_facets__t.k13 + crumbHtml(cr) + '<h1>' + th(lang, 'ov_t', { p: bdi(p), mo: esc(mo) }) + '</h1><p class="lead">' + th(lang, 'ov_lead', { p: bdi(p) }) + TB.kbx_facets__t.k14 + today + '">' + esc(dT) + '</time></p></div>' +
kv([[nf(lang, st.k), t(lang, 'kv_ov')], [nf(lang, st.n), t(lang, 'kv_wd')], [st.med == null ? '-' : nf(lang, st.med), t(lang, 'kv_med')], [nf(lang, st.max), t(lang, 'kv_max')]]) +
'<h2 id="projects">' + te(lang, 'ov_h2') + TB.kbx_facets__t.k15 + cols.map(c => '<th scope="col">' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
'<p class="k-small k-muted">' + te(lang, 'ov_data', { d: fd(lm, lang) }) + TB.kbx_facets__s.k1 +
'<h2 id="method">' + te(lang, 'ov_rule_h') + '</h2><p>' + te(lang, 'ov_rule', { mo }) + '</p>' +
'<h2 id="cite">' + te(lang, 'ov_cite_h') + '</h2><p><code>' + te(lang, 'ov_cite', { t: title, u: url, d: dT }) + '</code></p>' +
'<p class="kfa-l"><a href="' + pre(lang) + '/handover/overdue/">' + te(lang, 'ov_back') + '</a>' + (yrs.length ? '<span>' + th(lang, 'ov_years', { p: bdi(p) }) + ':</span>' + yrs.map(o => '<a href="' + pre(lang) + '/handover/' + o.y + '/' + o.s + '/">' + o.y + '</a>').join('') : '') + '<a href="/m/' + slugM(g.mk) + '/">' + th(lang, 'ov_mk', { p: bdi(p) }) + '</a></p>' +
faqHtml(lang, Q) + replyBox(lang) + '</div></section></div>';
const ld = [{ '@type': 'WebPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: lm, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
{ '@type': 'Dataset', '@id': url + '#data', name: title, description: desc, url, isAccessibleForFree: true, dateModified: lm, temporalCoverage: F.ovMonth, spatialCoverage: { '@type': 'Place', name: g.mk }, license: TB.kbx_facets__t.k16, creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' },
distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/data/promises.json' }, { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/data/named.json' }] },
{ '@type': 'ItemList', name: title, numberOfItems: st.k, itemListElement: g.L.map((r, i) => ({ '@type': 'ListItem', position: i + 1, name: r.x.n, url: PUB(lang, '/projects/' + r.x.s + '/') })) }, crumbLd(cr), faqLd(Q)];
return { title, desc, body, ld, path, lm };
}
function ovHub(F, lang) {
const ix = F.ix, mo = fd(F.ovMonth, lang), path = '/handover/overdue/', today = new Date().toISOString().slice(0, 10), dT = fd(today, lang);
const G = [...F.ovG.values()].sort((a, b) => b.L.length - a.L.length || a.mk.localeCompare(b.mk)), big = G.filter(g => g.L.length >= OV_MIN), one = G.filter(g => g.L.length < OV_MIN);
const title = fitT(t(lang, 'ovh_t', { mo }), t(lang, 'ovh_t2')), desc = fitD(t(lang, 'ovh_d', { d: dT, k: nf(lang, F.ovL.length), c: nf(lang, G.length) }));
const cr = [['Kolaboro', pre(lang) + '/'], [t(lang, 'cr_hy'), pre(lang) + '/handover/'], [title, pre(lang) + path]];
const cols = t(lang, 'ovh_cols');
const rows = big.map(g => { const st = ovStats(g); return '<tr><td data-label="' + esc(cols[0]) + '"><a href="' + pre(lang) + path + g.s + '/">' + bdi(mkName(g.mk, lang)) + '</a></td><td class="k-n" data-label="' + esc(cols[1]) + '"><b>' + nf(lang, st.k) + '</b></td><td class="k-n" data-label="' + esc(cols[2]) + '">' + nf(lang, st.n) + '</td><td class="k-n" data-label="' + esc(cols[3]) + '">' + nf(lang, st.max) + '</td></tr>'; }).join('');
const lm = F.ovL.map(r => lastmod(ix, r.x)).sort().pop() || F.updated, url = PUB(lang, path);
const body = TB.kbx_facets__t.k17 + crumbHtml(cr) + '<h1>' + te(lang, 'ovh_t', { mo }) + '</h1><p class="lead">' + te(lang, 'ovh_lead', { n: nf(lang, OV_MIN) }) + TB.kbx_facets__t.k18 + today + '">' + esc(dT) + '</time></p></div>' +
kv([[nf(lang, F.ovL.length), t(lang, 'kv_ov')], [nf(lang, G.length), cols[0]]]) +
(rows ? TB.kbx_facets__t.k19 + cols.map(c => '<th scope="col">' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' : '') +
(one.length ? '<h2 id="one">' + te(lang, 'ovh_one') + '</h2><ul class="fl">' + one.map(g => { const r = g.L[0]; return '<li>' + bdi(mkName(g.mk, lang)) + ': <a href="' + pre(lang) + '/projects/' + r.x.s + '/#overdue">' + bdi(r.x.n) + '</a> <small class="k-muted">' + esc(fd(r.o.d, lang)) + ' · ' + nf(lang, r.o.m) + '</small></li>'; }).join('') + '</ul>' : '') +
'<h2 id="method">' + te(lang, 'ov_rule_h') + '</h2><p>' + te(lang, 'ov_rule', { mo }) + '</p>' +
'<h2 id="cite">' + te(lang, 'ov_cite_h') + '</h2><p><code>' + te(lang, 'ov_cite', { t: title, u: url, d: dT }) + '</code></p>' +
'<p class="kfa-l"><a href="' + pre(lang) + '/handover/">' + te(lang, 'cr_hy') + '</a> <a href="/index/delays/">' + te(lang, 'dl_idx') + '</a> <a href="' + pre(lang) + '/stalled/">' + esc(stalledLabel(lang)) + '</a> <a href="' + pre(lang) + '/rankings/transparency/">' + te(lang, 'tr_link') + '</a></p>' + replyBox(lang) + '</div></section></div>';
const ld = [{ '@type': 'CollectionPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: lm, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
{ '@type': 'Dataset', name: title, description: desc, url, isAccessibleForFree: true, dateModified: lm, temporalCoverage: F.ovMonth, license: TB.kbx_facets__t.k20, creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/data/promises.json' }] },
{ '@type': 'ItemList', name: title, numberOfItems: big.length, itemListElement: big.map((g, i) => ({ '@type': 'ListItem', position: i + 1, name: g.mk, url: PUB(lang, path + g.s + '/') })) }, crumbLd(cr)];
return { title, desc, body, ld, path, lm };
}
export function allPaths(F, sm) {
const out = [];
if (F.ovL.length) { out.push(['/handover/overdue/', F.ovL.map(r => lastmod(F.ix, r.x)).sort().pop()]); for (const g of ovPages(F)) out.push(['/handover/overdue/' + g.s + '/', g.L.map(r => lastmod(F.ix, r.x)).sort().pop()]); }
const lmH = [...F.years.values()].map(g => groupStats(F, g.L).lm).sort().pop() || F.updated, lmA = [...F.areas.values()].map(g => groupStats(F, g.L).lm).sort().pop() || F.updated;
out.push(['/handover/', lmH]); for (const g of F.years.values()) out.push(['/handover/' + g.y + '/' + g.s + '/', groupStats(F, g.L).lm]);
if (F.areas.size) { out.push(['/areas/', lmA]); for (const g of F.areas.values()) out.push(['/areas/' + g.s + '/', groupStats(F, g.L).lm]); }
if (!sm) for (const pr of F.pairs.values()) out.push(['/vs/' + pr.k + '/', [lastmod(F.ix, pr.a), lastmod(F.ix, pr.b)].sort().pop()]);
return out;
}
export function renderPath(F, path, lang) {
let m;
if (path === '/handover/') return yearHub(F, lang);
if (path === '/handover/overdue/') return F.ovL.length ? ovHub(F, lang) : null;
if ((m = /^\/handover\/overdue\/([a-z0-9-]+)\/$/.exec(path))) return ovPage(F, m[1], lang);
if (path === '/areas/') return F.areas.size ? areaHub(F, lang) : null;
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
  let F; try { F = await facetsData(env); } catch (e) { return new Response('Temporarily unavailable', { status: 503, headers: { 'retry-after': '60', 'cache-control': 'no-store', 'content-type': 'text/plain; charset=utf-8' } }); }
  const key = lang + '|' + path + '|' + F.v;
  let pg = BODY.get(key);
  if (!pg) { pg = renderPath(F, path, lang); if (!pg) return null; if (BODY.size > 400) BODY.clear(); BODY.set(key, pg); }
  if (!m[7]) return new Response(null, { status: 301, headers: { location: pre(lang) + path + u.search, 'cache-control': 'public, max-age=86400' } });
  const sh = await shell(pre(lang) + '/how-we-score/');
  const url = PUB(lang, pg.path), alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + PUB(l, pg.path) + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + pg.path + '">';
  const tags = '<title>' + esc(pg.title) + ([...pg.title].length + 11 <= 60 ? ' | Kolaboro' : '') + '</title><meta name="description" content="' + esc(pg.desc) + '"><link rel="canonical" href="' + url + '">' + alts + '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">' +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="Kolaboro"><meta property="og:title" content="' + esc(pg.title) + '"><meta property="og:description" content="' + esc(pg.desc) + '"><meta property="og:url" content="' + url + '"><meta property="og:image" content="' + ogImg(url) + '"><meta name="twitter:card" content="summary_large_image">' +
    '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@graph': pg.ld }).replace(/</g, '\\u003c') + '</script>' + CSS;
  const res = new HTMLRewriter()
    .on('html', { element(e) { e.setAttribute('lang', lang); if (lang === 'ar') e.setAttribute('dir', 'rtl'); else e.removeAttribute('dir'); } })
    .on('title', { element(e) { e.remove(); } })
    .on('meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
    .on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(pg.body, { html: true }); } })
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + pg.path); } })
    .transform(new Response(sh.body, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
  return new Response(req.method === 'HEAD' ? null : await res.text(), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600', 'last-modified': new Date((pg.lm || F.updated) + 'T00:00:00Z').toUTCString(), 'x-kb-fa': F.v } });
}
async function sitemap(env) {
let F; try { F = await facetsData(env); } catch (e) { return new Response('Not ready', { status: 503 }); }
const xe = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const urls = allPaths(F, true).flatMap(([p, lm]) => LANGS.map(l => '<url><loc>' + xe(PUB(l, p)) + '</loc><lastmod>' + (lm || F.updated) + '</lastmod>' + LANGS.map(a => TB.kbx_facets__t.k21 + a + '" href="' + xe(PUB(a, p)) + '"/>').join('') + TB.kbx_facets__t.k22 + xe(ORIGIN + p) + '"/></url>'));
return new Response(TB.kbx_facets__s.k2 + urls.join('\n') + '\n</urlset>\n', { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
export const FA_KIT = { CSS, crumbHtml, crumbLd, kv, faqLd, replyBox, regFor };
export { tcFor, TC_SRC as TC_SOURCES, TC as TC_SETS };
