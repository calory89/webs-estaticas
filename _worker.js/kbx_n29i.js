// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_n29i__q, $s = TB.kbx_n29i__s, $t = TB.kbx_n29i__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TB } from './kbx_strings.js';
import { data as namedData, handoverOf, overdueOf, movedOf, OV_MIN, lastmod, esc, pre, fd } from './kbx_named.js';
import { trData } from './kbx_tr.js';
import { TR_PLACES, inPlace } from './kbx_tr_places.js';
import { BUY_PLACES } from './kbx_buy_i18n.js';
import { mkName, placeName, coName, hdisp, hyear, hkey } from './kbx_hdate.js';
import { ready as pluReady, fix as pluFix } from './kbx_plural.js';   // n40 k27: count words follow the number in market titles, descriptions and answers
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const MIN_MK = 5;
const CO_AL = { 'Puerto Rico (USA)': 'Puerto Rico', 'St Lucia': 'Saint Lucia', 'United States': 'USA', 'United Arab Emirates': 'UAE' };
export const PAGE_RX = /^\/(es|de|fr|nl|ru|zh|ar)\/m\/([^/.]{2,60})(\/?)$/;
export const PATHS = /^\/(?:es|de|fr|nl|ru|zh|ar)\/(?:countries|rankings)(?:\/[a-z0-9-]{2,60})?\/?$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?guides\/buyers-from(?:\/(?:russia|china|gulf))?\/?$|^\/(?:es|de|fr|nl|ru|zh|ar)\/m\/[^/.]{2,60}\/?$|^\/m\/sitemap\.xml$|^\/answers\/questions\.(?:md|json)$/;
const slugM = m => encodeURIComponent(String(m).toLowerCase().replace(/\s+/g, '-'));
const slugA = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const bdi = s => '<bdi>' + esc(s) + $q.a;
const ENW = /\b(the|near|of|and|side|shore|highway|next|area|phase|west|east|north|south|labels|page|parcel|urban|listing|road|street|lake|beach|airport|behind|opposite|between|along|axis)\b/i;
const arCell = (a, lang) => lang === 'en' ? bdi(a) : '<bdi>' + String(a).split(', ').map(k => { const h = TB.kbx_n29i_AR[k] && TB.kbx_n29i_AR[k][lang]; if (h) return esc(h); const m = mkName(k, lang); return m === k && ENW.test(k) ? $q.b + esc(k) + $q.c : esc(m); }).join(', ') + $q.a;
const nf = (lang, n) => Number(n).toLocaleString(LOC[lang] || 'en-GB');
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const med = a => { const s = a.filter(v => v != null).sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : Math.round((s[s.length / 2 - 1] + s[s.length / 2]) / 2)) : null; };
const T = TB.kbx_n29i_T ;
const frIn = p => { const k = String(p).replace(/<[^>]+>/g, ''), q = String((TB.kbx_n29i_CTR.frp || {})[k] || 'à').split('|'); return q[0] + ' ' + (q[1] ? String(p).replace(k, q[1]) : p); };   // n40 k24: en Pologne, au Portugal, aux Philippines, à Dubaï
const t = (lang, k, v) => { let s = (T[lang] && T[lang][k] != null) ? T[lang][k] : T.en[k]; if (Array.isArray(s)) return s; if (v && lang === 'fr' && v.p != null) s = String(s).replace(/à \{p\}/g, () => frIn(v.p)); if (v) s = String(s).replace(/\{(\w+)\}/g, (m, a) => v[a] != null ? v[a] : m); return s.replace(/\.\.(?=\s|$)/g, '.'); };
const th = (lang, k, v) => { const e = {}; for (const a in (v || {})) e[a] = v[a] && v[a].__html ? v[a].__html : esc(v[a]); return t(lang, k, e); };
const H = s => ({ __html: s });
let MD = null;
async function mdata(env) {
const [ix, tri] = await Promise.all([namedData(env), trData(env).catch(() => null), pluReady(env).catch(() => null)]);
if (MD && MD.ix === ix && MD.tri === tri && MD.day === new Date().toISOString().slice(0, 10)) return MD;
const g = new Map();
for (const x of ix.P) { if (!g.has(x.mk)) g.set(x.mk, []); g.get(x.mk).push(x); }
const score = id => { const r = tri && tri.rows.get(id); return r ? r.score : null; };
const stats = L => {
    const n = L.length, devs = new Map(); for (const x of L) if (x.dv) { const k = x.dvs || x.dv; const d = devs.get(k) || { n: x.dv, s: x.dvs, k: 0 }; d.k++; devs.set(k, d); }
    const permit = x => !!x.pn || ((ix.caseBy.get(x.id) || {}).checks || {}).permit === 2;
    const H = L.map(x => [x, handoverOf(ix, x)]).filter(e => e[1]), ys = new Map();
    for (const [, h] of H) { const y = hyear(h.d); if (y) ys.set(y, (ys.get(y) || 0) + 1); }
    const yTop = [...ys.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0] || null;
    const mv = L.filter(x => movedOf(ix, x)).length;
    const OV = L.map(x => [x, overdueOf(ix, x)]).filter(e => e[1]);
    const lm = L.map(x => lastmod(ix, x)).sort().pop() || String(ix.updated || '').slice(0, 10);
    return { n, devs, dv: devs.size, pn: L.filter(permit).length, permit, h: H.length, ys, yTop, mv, OV, ov: OV.length, med: med(L.map(x => score(x.id))), lm };
  };
const M = new Map(); for (const [mk, L] of g) if (L.length >= MIN_MK) M.set(slugM(mk), { mk, L, st: stats(L) });
const CG = new Map(); for (const x of ix.P) if (x.co) { const c = CO_AL[x.co] || x.co; if (!CG.has(c)) CG.set(c, []); CG.get(c).push(x); }
const C = new Map(); for (const [co, L] of CG) if (L.length >= MIN_MK) C.set(slugA(co), { kind: 'c', co, s: slugA(co), mk: co, L, st: stats(L) });
MD = { ix, tri, g, M, C, score, stats, all: stats(ix.P), day: new Date().toISOString().slice(0, 10), body: new Map(), d: String(ix.updated || '').slice(0, 10) };
return MD;
}
const findMk = (D, key) => { const k = String(key || '').toLowerCase(); let m = D.M.get(k); if (m) return m; try { m = D.M.get(slugM(decodeURIComponent(k))); } catch (e) { m = null; } return m || null; };
export const CSS = '<style id="k29i-css">.k29-kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));border:1px solid var(--k-line,#d5d3cc);border-radius:var(--k-r-lg,14px);overflow:hidden;background:var(--k-surface,#fff);margin:16px 0}' +
'.k29-kv div{padding:12px 16px;border-inline-end:1px solid var(--k-line,#d5d3cc);border-bottom:1px solid var(--k-line,#d5d3cc)}.k29-kv b{display:block;font-size:var(--k-fs-xl,24px);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.k29-kv span{font-size:var(--k-fs-xs,13px);color:var(--k-muted,#5f5c55)}' +
'.k29 .k-table-wrap{overflow-x:auto;margin:12px 0 24px}.k29 td{vertical-align:top}.k29-l{display:flex;flex-wrap:wrap;gap:8px 16px;padding:0;list-style:none;margin:12px 0}.k29-l a{display:inline-flex;align-items:center;min-height:44px}.k29-q{padding:28px 0;border-top:1px solid var(--k-line,#d5d3cc)}.k29-q h2{font-size:1.25rem;margin:0 0 12px}.k29-k h2{font-size:1rem;margin:16px 0 0}</style>';
const kvHtml = items => $q.d + items.map(([v, l]) => $q.e + v + $q.f + esc(l) + $q.g).join('') + $q.h;
const faqHtml = (title, Q) => $q.i + esc(title) + $q.j + Q.map(([q, a]) => $q.k + esc(q) + $q.l + esc(a) + $q.m).join('') + $q.h;
const faqLd = Q => ({ '@type': $q.n, mainEntity: Q.map(([q, a]) => ({ '@type': $q.o, name: q, acceptedAnswer: { '@type': $q.p, text: a } })) });
const list = (lang, items) => { try { return new Intl.ListFormat(LOC[lang] || 'en-GB', { style: 'long', type: $q.q }).format(items); } catch (e) { return items.join(', '); } };
function marketPage(D, m, lang) {
const { mk, L, st } = m, ix = D.ix, isC = m.kind === 'c', p = isC ? coName(m.co, lang) : mkName(mk, lang), co = L[0].co, d = fd(D.d, lang), path = isC ? $q.r + m.s + '/' : '/m/' + slugM(mk) + '/';
const v = { p, n: nf(lang, st.n), dv: nf(lang, st.dv), d };
const CT = { en: $t.k0, es: $t.k1, fr: $t.k2, de: $t.k3, nl: $t.k4, ru: $t.k5, zh: $q.s, ar: $t.k6 };
let title = isC && (D.M.has(slugM(mk)) || [...D.M.values()].some(o => mkName(o.mk, lang) === p)) ? (CT[lang] || CT.en).replace('{p}', p) : t(lang, 'm_t', v), desc = t(lang, $q.t, v);
const C40 = TB.kbx_n29i_CTR; if (!isC && C40.s && C40.s.includes(slugA(mk))) {
const w = Object.assign({}, v, { pn: nf(lang, st.pn), pp: nf(lang, pct(st.pn, st.n)), ov: nf(lang, st.ov), y: st.yTop ? st.yTop[0] : '' }), fl = x => String(x).replace(/à \{p\}/g, q => lang === 'fr' ? frIn(w.p) : q).replace(/\{(\w+)\}/g, (q, a) => w[a] != null ? w[a] : q);
const G = k => C40[k][lang] || C40[k].en, tt = (pct(st.pn, st.n) >= 50 ? G('t') : st.yTop ? G('ty') : []).concat(G('tn')).map(fl).find(x => x.length <= (lang === 'ru' ? 58 : 60));  if (tt) title = tt; desc = fl((C40.d[lang] || C40.d.en)[st.yTop ? 0 : 1]).replace(/\.\.(?=\s|$)/g, '.'); if (desc.length > 160) { const D2 = (C40.d[lang] || C40.d.en).map(x => fl(x).replace(/\.\.(?=\s|$)/g, '.')); desc = D2.find(x => x.length <= 160) || D2[D2.length - 1]; let i; while (desc.length > 160 && (i = desc.lastIndexOf('. ', desc.length - 2)) > 0) desc = desc.slice(0, i + 1); } }   // n40 k24: descriptions capped at 160 characters (the variant without the main handover year first, then whole sentences only)
title = pluFix(lang, title); desc = pluFix(lang, desc);   // n40 k27: "de 1 promoteur", "von 1 Bauträger" (Intl.PluralRules)
const TRP = TR_PLACES.filter(P => !P.coi && (isC ? (CO_AL[P.co] || P.co) === m.co : P.m.includes(mk)) && D.tri && D.tri.places.get(P.s) && D.tri.places.get(P.s).n);
const BUY = BUY_PLACES.filter(P => isC ? (CO_AL[P.c] || P.c) === m.co : (TRP.some(q => q.s === P.s) || slugA(mk) === P.s));
const rows = L.slice().sort((a, b) => (D.score(b.id) ?? -1) - (D.score(a.id) ?? -1) || a.n.localeCompare(b.n)).map(x => {
const h = handoverOf(ix, x), s = D.score(x.id);
return $q.u + pre(lang) + $q.v + x.s + '/">' + bdi(x.n) + $q.w +
(x.dv ? (x.dvs && ix.devs.has(x.dvs) ? $q.x + pre(lang) + $q.y + x.dvs + '/">' + bdi(x.dv) + '</a>' : bdi(x.dv)) : esc(t(lang, 'np'))) + $q.z + (x.ar && x.ar !== x.mk ? arCell(x.ar, lang) : '') +
$q.A + (h ? $q.B + esc(hkey(h.d) || '') + '">' + bdi(hdisp(h.d, lang)) : '>' + esc(t(lang, 'np'))) + $q.C + (st.permit(x) ? 1 : 0) + $q.D + (st.permit(x) ? 'y">' + esc(t(lang, 'yes')) : 'n">' + esc(t(lang, 'no'))) + $q.E + (s == null ? '>-' : $q.B + s + $q.F + nf(lang, s) + '</b>') + $q.G;   // n40 d9: sort keys (data-v, /k/tsort.js), permit as a badge
}).join('');
const Q = [[t(lang, 'q1', v), t(lang, 'a1', v)], [t(lang, 'q2', v), t(lang, 'a2', Object.assign({}, v, { pn: nf(lang, st.pn), pp: nf(lang, pct(st.pn, st.n)) }))],
[t(lang, 'q3', v), st.h && st.yTop ? t(lang, 'a3', Object.assign({}, v, { h: nf(lang, st.h), y: st.yTop[0], k: nf(lang, st.yTop[1]) })) : t(lang, 'a3n', v)],
[t(lang, 'q4', v), t(lang, st.ov === 1 ? 'a4_1' : 'a4', Object.assign({}, v, { ov: nf(lang, st.ov), mv: nf(lang, st.mv) }))]];
{ const D3 = [...st.devs.values()].sort((a, b) => b.k - a.k || String(a.n).localeCompare(String(b.n))).slice(0, 3); if (T.en.q5 && D3.length > 1) Q.push([t(lang, 'q5', v), t(lang, 'a5', Object.assign({}, v, { l: list(lang, D3.map(x => x.n + ' (' + nf(lang, x.k) + ')')) }))]); if (T.en.dof) for (const q of Q) if (q[1].indexOf(d) < 0) q[1] += ' ' + t(lang, 'dof', v); } for (const q of Q) { q[0] = pluFix(lang, q[0]); q[1] = pluFix(lang, q[1]); }   // n40 k26: fifth question (developers with the most projects) and the data date on every answer
const links = [];
for (const P of TRP) links.push($q.x + pre(lang) + $q.H + P.s + '/">' + th(lang, 'l_tr', { p: mkName(P.n, lang) }) + '</a>');
if (isC) for (const g of [...new Set(L.map(x => x.mk))].map(k => D.M.get(slugM(k))).filter(Boolean).sort((a, b) => b.L.length - a.L.length)) links.push($q.x + pre(lang) + '/m/' + slugM(g.mk) + '/">' + bdi(mkName(g.mk, lang)) + ' (' + nf(lang, g.L.length) + ')</a>');
for (const P of BUY) links.push($q.x + pre(lang) + $q.I + P.s + '/">' + th(lang, 'l_buy', { p: isC ? (P.m ? mkName(P.m[0], lang) : coName(P.c, lang)) : mkName(mk, lang) }) + '</a>');
if (!isC && st.ov >= OV_MIN) links.push($q.x + pre(lang) + $q.J + slugA(mk) + '/">' + th(lang, 'l_ov', { p }) + '</a>');
if (!isC) for (const [y, k] of [...st.ys.entries()].filter(e => e[1] >= 3).sort((a, b) => a[0] - b[0]).slice(0, 4)) links.push($q.x + pre(lang) + $q.K + y + '/' + slugA(mk) + '/">' + th(lang, 'l_hy', { y }) + '</a>');
links.push($q.x + path + $q.L + esc(t(lang, isC ? 'l_enc' : 'l_en')) + '</a>', $q.x + pre(lang) + $q.M + esc(t(lang, 'l_mt')) + '</a>');
const coS = co ? slugA(co) : null, coU = coS ? (D.C.has(coS) ? pre(lang) : '') + $q.r + coS + '/' : null;
const cr = isC ? [[$q.N, pre(lang) + '/'], [t(lang, $q.O), pre(lang) + $q.r], [p, pre(lang) + path]] : [[$q.N, pre(lang) + '/'], [t(lang, $q.O), pre(lang) + $q.r]].concat(coU && co !== mk ? [[coName(co, lang), coU]] : []).concat([[p, pre(lang) + path]]);
const body = $s.k0 + cr.map((c, i) => i < cr.length - 1 ? $q.x + c[1] + '">' + esc(c[0]) + '</a>' : $q.P + bdi(c[0]) + $q.c).join(' / ') + '</p>' +
'<h1>' + th(lang, 'm_h1', { p: H(bdi(p)) }) + $q.Q + th(lang, $q.R, { p: H(bdi(p)), d }) + $q.S +
kvHtml([[nf(lang, st.n), t(lang, 'k_n')], [nf(lang, st.dv), t(lang, 'k_dv')], [nf(lang, st.pn) + ' (' + nf(lang, pct(st.pn, st.n)) + '%)', t(lang, 'k_pn')], [nf(lang, st.h) + ' (' + nf(lang, pct(st.h, st.n)) + '%)', t(lang, 'k_h')],
[nf(lang, st.mv), t(lang, 'k_mv')], [nf(lang, st.ov), t(lang, 'k_ov')], [st.med == null ? '-' : nf(lang, st.med), t(lang, 'k_med')], [esc(d), t(lang, 'k_d')]]) +
$q.T + esc(t(lang, 'tb')) + $q.U + ['c_p', 'c_dv', 'c_ar', 'c_h', 'c_pn', 'c_s'].map((k, i) => $q.V + (i + 1) + $q.W + String(t(lang, k)).replace(/[\\"<>]/g, '') + '"}').join('') + $s.k1 + ['c_p', 'c_dv', 'c_ar', 'c_h', 'c_pn', 'c_s'].map(k => $q.X + (k === 'c_s' ? $q.Y : k === 'c_pn' ? $q.Z : '') + '>' + esc(t(lang, k)) + '</th>').join('') + $q.aa + rows + $q.ab +
(isC && TR_PLACES.some(P => P.coi && (CO_AL[P.co] || P.co) === m.co) ? $q.ac + esc(t(lang, 'coi_n')) + $t.k7 + esc(t(lang, 'coi_l')) + $q.ad : '') +
faqHtml(t(lang, 'faq', { p }), Q) + ($t.o_BPL.some(P => P.mk === mk) ? buyerLinks(lang, mk).replace($t.k8, '').replace($q.ae, '') : '') + $q.af + th(lang, 'more', { p: H(bdi(p)) }) + $q.ag + links.map(a => '<li>' + a + '</li>').join('') + $q.ah + esc(t(lang, 'src')) + $s.k2 + $q.ai;
const url = ORIGIN + pre(lang) + path;
const ld = [{ '@type': $q.aj, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: st.lm, isPartOf: { '@type': $q.ak, name: $q.N, url: ORIGIN + '/' },
about: isC ? { '@type': $q.al, name: p, alternateName: p !== m.co ? m.co : undefined } : { '@id': url + $q.am }, mainEntity: { '@type': $q.an, numberOfItems: L.length, itemListElement: L.slice(0, 50).map((x, i) => ({ '@type': $q.ao, position: i + 1, url: ORIGIN + pre(lang) + $q.v + x.s + '/', name: x.n })) } },
{ '@type': $q.ap, itemListElement: cr.map((c, i) => ({ '@type': $q.ao, position: i + 1, name: c[0], item: ORIGIN + c[1] })) }, faqLd(Q)];
if (!isC) ld.splice(1, 0, { '@type': 'Place', '@id': url + $q.am, name: p, alternateName: p !== mk ? mk : undefined, containedInPlace: co ? { '@type': $q.al, name: coName(co, lang), url: coU ? ORIGIN + coU : undefined } : undefined });
return { path, title, desc, body, ld, lm: st.lm };
}
export async function mAlternates(env, key) {
let D; try { D = await mdata(env); } catch (e) { return ''; } const m = findMk(D, key); if (!m) return /^[a-z0-9-]{2,80}$/.test(key || '') ? $t.k9 + ORIGIN + '/m/' + key + '/">' : '';
const p = '/m/' + slugM(m.mk) + '/'; return LANGS.map(l => $q.aq + l + $q.ar + ORIGIN + pre(l) + p + '">').join('') + $t.k10 + ORIGIN + p + '">';
}
function mSitemap(D) {
const xe = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const urls = [...D.M.values()].filter(m => slugM(m.mk) !== $q.as).flatMap(m => { const p = '/m/' + slugM(m.mk) + '/'; return LANGS.map(l => $q.at + xe(ORIGIN + pre(l) + p) + $q.au + m.st.lm + $q.av + LANGS.map(a => $t.k11 + a + $q.ar + xe(ORIGIN + pre(a) + p) + '"/>').join('') + $t.k12 + xe(ORIGIN + p) + $q.aw); });
for (const p of [$q.r, $q.ax].concat([...D.C.values()].map(c => $q.r + c.s + '/'))) { const c = D.C.get(p.split('/')[2]), lm = c ? c.st.lm : D.d; for (const l of LANGS) urls.push($q.at + ORIGIN + pre(l) + p + $q.au + lm + $q.av + LANGS.map(a => $t.k13 + a + $q.ar + ORIGIN + pre(a) + p + '"/>').join('') + $t.k14 + ORIGIN + p + $q.aw); }
for (const g of GROUPS) { const p = $q.ay + g + '/', lm = $t.o_BPL.map(P => (D.M.get(slugM(P.mk)) || { st: { lm: '' } }).st.lm).concat([$q.az]).sort().pop(); for (const l of LANGS) urls.push($q.at + ORIGIN + pre(l) + p + $q.au + lm + $q.av + LANGS.map(a => $t.k15 + a + $q.ar + ORIGIN + pre(a) + p + '"/>').join('') + $t.k16 + ORIGIN + p + $q.aw); }
return $s.k3 + urls.join('\n') + $q.aA;
}
const HUB_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(projects|rankings\/transparency|handover|handover\/overdue)\/$/;
function hubParts(D, kind, lang) {
const A = D.all, ix = D.ix, d = fd(D.d, lang), N = n => nf(lang, n);
if (kind === $q.aB) {
const cos = new Set(ix.P.map(x => CO_AL[x.co] || x.co).filter(Boolean)), top = [...D.g.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 5);
const k = [[N(A.n), t(lang, 'k_n')], [N(D.g.size), t(lang, 'k_mk')], [N(cos.size), t(lang, 'k_co')], [N(A.dv), t(lang, 'k_dv')], [N(A.pn) + ' (' + N(pct(A.pn, A.n)) + '%)', t(lang, 'k_pn')], [N(A.h) + ' (' + N(pct(A.h, A.n)) + '%)', t(lang, 'k_h')], [N(A.mv), t(lang, 'k_mv')], [N(A.ov), t(lang, 'k_ov')], [A.med == null ? '-' : N(A.med), t(lang, 'k_med')], [esc(d), t(lang, 'k_d')]];
const Q = [[t(lang, 'hp_q1'), t(lang, 'hp_a1', { n: N(A.n), m: N(D.g.size), c: N(cos.size), dv: N(A.dv), d })], [t(lang, 'hp_q2'), t(lang, 'hp_a2', { l: list(lang, top.map(([m, L]) => mkName(m, lang) + ' (' + N(L.length) + ')')) })],
[t(lang, 'hp_q3'), t(lang, 'hp_a3', { pn: N(A.pn), n: N(A.n), pp: N(pct(A.pn, A.n)) })], [t(lang, 'hp_q4'), t(lang, 'hp_a4', { ov: N(A.ov), op: N(pct(A.ov, A.h)) })]];
return { k, Q };
}
if (kind === $q.aC) {
if (!D.tri) return null;
const R = [...D.tri.places.values()].filter(pl => pl.ranked && pl.med != null)
.sort((a, b) => b.med - a.med || b.n - a.n);
if (!R.length) return null; const hi = R[0], lo = R[R.length - 1], scored = new Set(); for (const pl of R) for (const r of pl.L) scored.add(r.id);
const k = [[N(R.length), t(lang, 'k_pl')], [N(scored.size), t(lang, 'k_sc')], [esc(mkName(hi.P.n, lang)) + ' · ' + N(hi.med), t(lang, 'k_top')], [esc(d), t(lang, 'k_d')]];
const Q = [[t(lang, 'ht_q1'), t(lang, 'ht_a1', { p: mkName(hi.P.n, lang), s: N(hi.med), n: N(hi.n), d })], [t(lang, 'ht_q2'), t(lang, 'ht_a2', { p: mkName(lo.P.n, lang), s: N(lo.med), n: N(lo.n) })], [t(lang, 'ht_q3'), t(lang, 'ht_a3')]];
return { k, Q };
}
if (kind === $q.aD) {
const y0 = new Date().getUTCFullYear(), Y = [y0, y0 + 1, y0 + 2], cnt = y => A.ys.get(y) || 0, later = [...A.ys.entries()].filter(e => e[0] >= y0 + 3).reduce((a, e) => a + e[1], 0), yq = y0 + 1;
const byMk = [...D.g.entries()].map(([m, L]) => [m, L.filter(x => { const h = handoverOf(ix, x); return h && hyear(h.d) === yq; }).length]).filter(e => e[1]).sort((a, b) => b[1] - a[1]).slice(0, 5);
const k = [[N(A.h), t(lang, 'k_h')], ...Y.map(y => [N(cnt(y)), t(lang, 'k_y', { y })]), [N(later), t(lang, 'k_y2', { y: y0 + 3 })], [N(A.ov), t(lang, 'k_ov')], [esc(d), t(lang, 'k_d')]];
const Q = [[t(lang, 'hh_q1', { y: yq }), t(lang, 'hh_a1', { k: N(cnt(yq)), y: yq })], ...(byMk.length ? [[t(lang, 'hh_q2', { y: yq }), t(lang, 'hh_a2', { l: list(lang, byMk.map(([m, n]) => mkName(m, lang) + ' (' + N(n) + ')')) })]] : []),
[t(lang, 'hh_q3'), t(lang, 'hh_a3', { ov: N(A.ov), mv: N(A.mv) })]];
return { k, Q };
}
if (kind === $q.aE) {
if (!A.ov) return null;
const ms = A.OV.map(e => e[1].m), mx = A.OV.slice().sort((a, b) => b[1].m - a[1].m)[0], byMk = new Map(); for (const [x] of A.OV) byMk.set(x.mk, (byMk.get(x.mk) || 0) + 1);
const top = [...byMk.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
const k = [[N(A.ov), t(lang, 'k_ov')], [N([...byMk.values()].filter(v => v >= OV_MIN).length), t(lang, 'k_ovp')], [N(med(ms)), t(lang, 'k_ovm')], [N(mx[1].m), t(lang, 'k_ovx')], [esc(d), t(lang, 'k_d')]];
const HON = { en: $s.k4,
es: $s.k5,
fr: $s.k6,
de: $s.k7,
nl: $s.k8,
ru: $s.k9,
zh: $t.k17,
ar: $s.k10 };
const note = esc(HON[lang] || HON.en).replace('{a}', $q.x + pre(lang) + $q.aF).replace('{b}', '</a>');
const Q = [[t(lang, 'ho_q1'), t(lang, 'ho_a1', { ov: N(A.ov), m: N(med(ms)), d })], [t(lang, 'ho_q2'), t(lang, 'ho_a2', { l: list(lang, top.map(([m, n]) => mkName(m, lang) + ' (' + N(n) + ')')) })], [t(lang, 'ho_q3'), t(lang, 'ho_a3')]];
return { k, Q, note };
}
if (kind === $q.aG) {
const DV = [...ix.devs.values()].sort((a, b) => b.ids.length - a.ids.length || a.n.localeCompare(b.n)), d5 = DV.filter(v => v.ids.length >= 5).length;
const k = [[N(ix.devs.size), t(lang, 'k_dv')], [N(d5), t(lang, 'k_d5')], [N(A.n), t(lang, 'k_n')], [esc(d), t(lang, 'k_d')]];
const Q = [[t(lang, 'hd_q1'), t(lang, 'hd_a1', { dv: N(ix.devs.size), n: N(A.n), d })], [t(lang, 'hd_q2'), t(lang, 'hd_a2', { l: list(lang, DV.slice(0, 5).map(v => v.n + ' (' + N(v.ids.length) + ')')) })], [t(lang, 'hd_q3'), t(lang, 'hd_a3')]];
return { k, Q };
}
if (kind === $q.aH) {
const C = new Map(); for (const x of ix.P) if (x.co) C.set(x.co, (C.get(x.co) || 0) + 1);
const top = [...C.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
const k = [[N(C.size), t(lang, 'k_co')], [N(A.n), t(lang, 'k_n')], [N([...C.values()].filter(v => v >= 10).length), t(lang, 'k_co') + $q.aI], [esc(d), t(lang, 'k_d')]];
const Q = [[t(lang, 'hc_q1'), t(lang, 'hc_a1', { c: N(C.size), n: N(A.n), d })], [t(lang, 'hc_q2'), t(lang, 'hc_a2', { l: list(lang, top.map(([c, n]) => coName(c, lang) + ' (' + N(n) + ')')) })]];
return { k, Q };
}
return null;
}
export async function hubInject(req, u, env, r, fix) {
const m = HUB_RX.exec(u.pathname); if (!m || req.method !== 'GET' || !r || r.status !== 200 || !/text\/html/.test(r.headers.get($q.aJ) || '')) return r;
const lang = m[1] || 'en', kind = m[2];
let D; try { D = await mdata(env); } catch (e) { return r; }
const key = lang + '|' + kind; let pt = D.body.get(key);
if (pt === undefined) { try { pt = hubParts(D, kind, lang); } catch (e) { pt = null; } D.body.set(key, pt); }
if (!pt) return r;
const fx = lang === 'ru' && fix ? fix : (h => h);
const top = CSS + $q.aK + esc(t(lang, 'hub_k')) + '</h2>' + kvHtml(pt.k) + (pt.note ? $q.ac + pt.note + '</p>' : '') + $q.h, top2 = fx(top);
const qa = $t.k18 + faqHtml(t(lang, 'hub_q'), pt.Q).replace($q.i, '<h2>') + $t.k19 + JSON.stringify({ '@context': $q.aL, '@graph': [faqLd(pt.Q)] }).replace(/</g, $q.aM) + $q.aN;
let done = false;
return new HTMLRewriter()
.on($q.aO, { element(e) { if (!done) { done = true; e.after(top2, { html: true }); } } })
.on('main', { element(e) { e.onEndTag(tg => { tg.before(fx((done ? '' : top) + qa), { html: true }); }); } })
.transform(r);
}
let QC = null;
function questions(D) {
if (QC && QC.D === D) return QC.q;
const ix = D.ix, d = D.d, Q = [], add = (q, a, url, scope) => Q.push({ q, a, url, scope, date: d });
const pl = n => n === 1 ? '' : 's';
const lstP = (L, f) => L.slice(0, 10).map(f).join('; ') + (L.length > 10 ? $q.aP + (L.length - 10) + ' more' : '');
for (const { mk, L, st } of [...D.M.values()].sort((a, b) => b.L.length - a.L.length)) {
const url = ORIGIN + '/m/' + slugM(mk) + '/', where = mk + (L[0].co && L[0].co !== mk ? ', ' + L[0].co : '');
add($q.aQ + mk + $q.aR, st.n + $q.aS + where + $q.aT + st.dv + $q.aU + pl(st.dv) + '.', url, mk);
const P = L.filter(st.permit);
add($q.aV + mk + $q.aW, P.length ? P.length + ' of ' + st.n + ': ' + lstP(P, x => x.n + (x.pn ? ' (' + x.pn + ')' : '')) + '.' : $q.aX + st.n + $t.k20, url, mk);
if (st.h) add($q.aY + mk + $q.aZ, st.h + ' of ' + st.n + $q.ba + [...st.ys.entries()].sort((a, b) => a[0] - b[0]).map(([y, k]) => y + ': ' + k).join(', ') + '.', url, mk);
add($q.aV + mk + $q.bb, st.ov ? st.ov + $q.bc + pl(st.ov) + $t.k21 + lstP(st.OV.slice().sort((a, b) => b[1].m - a[1].m), ([x, o]) => x.n + ' (' + o.m + $q.bd + hdisp(o.d, 'en') + ')') + '.' : $t.k22, url, mk);
const dv = [...st.devs.values()].sort((a, b) => b.k - a.k || a.n.localeCompare(b.n)).slice(0, 5);
if (dv.length) add($t.k23 + mk + '?', dv.map(v => v.n + ' (' + v.k + ')').join(', ') + '.', url, mk);
const sc = L.map(x => [x, D.score(x.id)]).filter(e => e[1] != null).sort((a, b) => b[1] - a[1]).slice(0, 3);
if (sc.length) add($q.aV + mk + $q.be, $t.k24 + sc.map(([x, s]) => x.n + ' ' + s).join(', ') + $q.bf + mk + ': ' + st.med + '.', url, mk);
}
const C = new Map(); for (const x of ix.P) if (x.co) { if (!C.has(x.co)) C.set(x.co, []); C.get(x.co).push(x); }
const cslug = c => slugA(c);
for (const [co, L] of [...C.entries()].filter(e => e[1].length >= MIN_MK).sort((a, b) => b[1].length - a[1].length)) {
const st = D.stats(L), url = ORIGIN + $q.r + cslug(co) + '/', mks = [...new Set(L.map(x => x.mk))];
add($q.aQ + co + $q.aR, st.n + $q.bg + mks.length + $q.bh + pl(mks.length) + ' (' + mks.slice(0, 8).join(', ') + (mks.length > 8 ? ', ...' : '') + $q.bi + st.dv + $q.aU + pl(st.dv) + '.', url, co);
add($q.bj + co + $q.aW, st.pn + ' of ' + st.n + ' (' + pct(st.pn, st.n) + $q.bk, url, co);
add($q.aQ + co + $q.bb, st.ov + $q.bl + st.h + $t.k25 + st.mv + '.', url, co);
}
for (const v of [...ix.devs.values()].filter(v => v.ids.length >= MIN_MK).sort((a, b) => b.ids.length - a.ids.length)) {
const L = v.ids.map(id => ix.byId.get(id)).filter(Boolean), st = D.stats(L), url = ORIGIN + $q.y + v.s + '/';
add($q.bm + v.n + $q.bn, L.length + $q.bo + lstP(L, x => { const h = handoverOf(ix, x); return x.n + ' (' + x.mk + (h ? $q.bp + hdisp(h.d, 'en') : '') + ')'; }) + '.', url, v.n);
add('Does ' + v.n + $q.bq, 'Of ' + st.h + $t.k26 + st.ov + $t.k27 + st.mv + $s.k11, url, v.n);
}
QC = { D, q: Q }; return Q;
}
function questionsMd(D) {
const Q = questions(D), L = [$t.k28, '', '> ' + Q.length + $t.k29 + MIN_MK + $s.k12 + D.d + $t.k30 + ORIGIN + $q.br, ''];
let scope = null; for (const q of Q) { if (q.scope !== scope) { scope = q.scope; L.push('## ' + scope, ''); } L.push('### ' + q.q, '', q.a + $q.bs + q.url + $q.bt + q.date + ')', ''); }
return L.join('\n');
}
export const BUYER_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?guides\/buyers-from(?:\/(russia|china|gulf))?(\/?)$/;
const GROUPS = ['russia', 'china', 'gulf'];
const BT = TB.kbx_n29i_BT ;
const bt = (lang, k, v) => { let s = (BT[lang] && BT[lang][k] != null) ? BT[lang][k] : BT.en[k]; if (v) s = String(s).replace(/\{(\w+)\}/g, (m, a) => v[a] != null ? v[a] : m); return s.replace(/\.\.(?=\s|$)/g, '.'); };
function buyerPage(D, g, lang) {
const G = bt(lang, 'g_' + g), d = fd(D.d, lang), path = $q.ay + g + '/', R = $t.o_BRULE[g], N = n => nf(lang, n);
const srcP = k => { const S = $t.o_BSRC[k]; return $q.ac + esc(bt(lang, 'src', { s: S.n, d: fd(S.d, lang) })).replace(esc(S.n), $q.x + esc(S.u) + $q.bu + esc(S.n) + '</a>') + '</p>'; };
let body = $s.k13 + pre(lang) + $q.bv + pre(lang) + $q.bw + esc(bt(lang, 'hub')) + $q.bx + esc(G) + $q.by +
'<h1>' + esc(bt(lang, 'h1', { g: G })) + $q.Q + esc(bt(lang, 'lead', { g: G })) + $q.S;
if (R.home) body += $q.bz + esc(bt(lang, 'home')) + $q.bA + esc(bt(lang, R.home[0])) + '</p>' + srcP(R.home[1]);
body += $q.bB + esc(bt(lang, 'rules')) + '</h2>';
const rows = [];
for (const P of $t.o_BPL) {
const m = D.M.get(slugM(P.mk)), pn = mkName(P.mk, lang), r = R[P.s];
body += $q.bC + P.s + '">' + bdi(pn) + '</h3>' + (r ? '<p>' + esc(bt(lang, r[0])) + '</p>' + srcP(r[1]) : '<p>' + esc(bt(lang, 'same')) + '</p>') +
$q.bD + pre(lang) + $q.I + P.g + '/">' + esc(bt(lang, 'guide', { p: pn })) + $q.bE + (m ? $q.bF + pre(lang) + '/m/' + slugM(P.mk) + '/">' + esc(bt(lang, 'mk', { p: pn })) + $q.bE : '') + '</ul>';
if (m) rows.push($q.bG + esc(bt(lang, 'c_pl')) + $q.bH + pre(lang) + '/m/' + slugM(P.mk) + '/">' + bdi(pn) + $q.bI + esc(bt(lang, 'c_n')) + '">' + N(m.st.n) + $q.bJ + esc(bt(lang, 'c_pn')) + '">' + N(m.st.pn) + ' (' + N(pct(m.st.pn, m.st.n)) + $q.bK + esc(bt(lang, 'c_ov')) + '">' + N(m.st.ov) + $q.bJ + esc(bt(lang, 'c_m')) + '">' + (m.st.med == null ? '-' : N(m.st.med)) + $q.G);
}
body += $q.bL + esc(bt(lang, 'data')) + $q.bM + esc(t(lang, 'k_d')) + ': ' + esc(d) + $t.k31 + ['c_pl', 'c_n', 'c_pn', 'c_ov', 'c_m'].map(k => $q.bN + esc(bt(lang, k)) + '</th>').join('') + $q.aa + rows.join('') + $q.ab +
$q.bO + esc(bt(lang, 'other')) + $q.ag + GROUPS.filter(x => x !== g).map(x => $q.bF + pre(lang) + $q.ay + x + '/">' + esc(bt(lang, 'h1', { g: bt(lang, 'g_' + x) })) + $q.bE).join('') + $q.ah + esc(bt(lang, $q.bP, { d: fd($q.az, lang) })) + $q.bQ;
const title = bt(lang, 't', { g: G }), desc = bt(lang, 'desc', { g: G, d }), url = ORIGIN + pre(lang) + path;
const lm = $t.o_BPL.map(P => (D.M.get(slugM(P.mk)) || { st: { lm: '' } }).st.lm).concat([$q.az]).sort().pop();
const ld = [{ '@type': $q.bR, '@id': url + '#page', url, headline: title, description: desc, inLanguage: lang, dateModified: lm, datePublished: $q.az, author: { '@type': $q.bS, name: $q.N, url: ORIGIN + '/' }, publisher: { '@type': $q.bS, name: $q.N, url: ORIGIN + '/' },
about: $t.o_BPL.map(P => ({ '@type': 'Place', name: mkName(P.mk, lang) })), citation: Object.values($t.o_BSRC).filter((S, i, a) => JSON.stringify(R).includes(Object.keys($t.o_BSRC)[i])).map(S => ({ '@type': $q.bT, name: S.n, url: S.u })) }];
return { path, title, desc, body, ld, lm };
}
export function buyerLinks(lang, mkOrGuide) {
const P = $t.o_BPL.find(q => q.s === mkOrGuide || q.mk === mkOrGuide); if (!P) return '';
return $t.k32 + esc(bt(lang, 'hub')) + $q.bA + esc(bt(lang, 'hubl')) + $q.bU + GROUPS.map(x => $q.bF + pre(lang) + $q.ay + x + '/#' + P.s + '">' + esc(bt(lang, 'h1', { g: bt(lang, 'g_' + x) })) + $q.bE).join('') + $q.bV;
}
export const CR_RX = /^\/(es|de|fr|nl|ru|zh|ar)\/(countries|rankings)(?:\/([a-z0-9-]{2,60}))?(\/?)$/;
function countriesHub(D, lang) {
const C = [...D.C.values()].sort((a, b) => b.L.length - a.L.length || a.co.localeCompare(b.co)), d = fd(D.d, lang), N = n => nf(lang, n), path = $q.r;
const n = C.reduce((a, c) => a + c.L.length, 0), title = t(lang, 'ch_t', { c: N(C.length), n: N(n) }), desc = t(lang, $q.bW, { k: MIN_MK, d });
const rows = C.map(c => $q.bG + esc(t(lang, 'c_co')) + $q.bH + pre(lang) + $q.r + c.s + '/">' + bdi(coName(c.co, lang)) + $q.bI + esc(t(lang, 'k_n')) + '">' + N(c.st.n) + $q.bJ + esc(t(lang, 'k_pn')) + '">' + N(c.st.pn) + ' (' + N(pct(c.st.pn, c.st.n)) + $q.bK + esc(t(lang, 'k_ov')) + '">' + N(c.st.ov) + $q.bJ + esc(t(lang, 'k_med')) + '">' + (c.st.med == null ? '-' : N(c.st.med)) + $q.G).join('');
const cr = [[$q.N, pre(lang) + '/'], [t(lang, $q.O), pre(lang) + path]];
const body = $s.k14 + pre(lang) + $q.bX + esc(t(lang, $q.O)) + $q.bY + esc(t(lang, 'ch_h')) + $q.Q + esc(desc) + $q.S +
kvHtml([[N(C.length), t(lang, 'k_co')], [N(n), t(lang, 'k_n')], [esc(d), t(lang, 'k_d')]]) +
$t.k33 + ['c_co', 'k_n', 'k_pn', 'k_ov', 'k_med'].map(k => $q.bN + esc(t(lang, k)) + '</th>').join('') + $q.aa + rows + $q.ab +
$t.k34 + esc(t(lang, 'l_enc')) + $q.bZ + pre(lang) + $q.ca + esc(t(lang, 'rk_t')) + $t.k35 + esc(t(lang, 'src')) + $q.bQ;
const url = ORIGIN + pre(lang) + path, lm = C.map(c => c.st.lm).sort().pop();
return { path, title, desc, body, lm, ld: [{ '@type': $q.aj, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: lm, mainEntity: { '@type': $q.an, numberOfItems: C.length, itemListElement: C.map((c, i) => ({ '@type': $q.ao, position: i + 1, name: coName(c.co, lang), url: ORIGIN + pre(lang) + $q.r + c.s + '/' })) } }, { '@type': $q.ap, itemListElement: cr.map((c, i) => ({ '@type': $q.ao, position: i + 1, name: c[0], item: ORIGIN + c[1] })) }] };
}
function rankingsHub(D, lang) {
const path = $q.ax, title = t(lang, 'rk_t'), desc = t(lang, $q.cb), L = t(lang, 'rk'), d = fd(D.d, lang);
const body = $s.k15 + pre(lang) + $q.bX + esc(title) + $q.bY + esc(title) + $q.Q + esc(desc) + $q.S +
$q.cc + $t.o_RK.map((r, i) => $q.bF + pre(lang) + r + '">' + esc(L[i]) + $q.bE).join('') + '</ul>' +
$q.bD + pre(lang) + $q.cd + esc(t(lang, 'ch_h')) + $t.k36 + esc(t(lang, 'k_d')) + ': ' + esc(d) + $q.bQ;
const url = ORIGIN + pre(lang) + path;
return { path, title, desc, body, lm: D.d, ld: [{ '@type': $q.aj, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: D.d, mainEntity: { '@type': $q.an, numberOfItems: $t.o_RK.length, itemListElement: $t.o_RK.map((r, i) => ({ '@type': $q.ao, position: i + 1, name: L[i], url: ORIGIN + pre(lang) + r })) } }] };
}
export async function crAlternates(env, path) {
let ok = path === $q.ax || path === $q.r;
if (!ok) { const m = /^\/countries\/([a-z0-9-]{2,60})\/$/.exec(path); if (m) { let D; try { D = await mdata(env); } catch (e) { return ''; } ok = D.C.has(m[1]); } }
return ok ? LANGS.map(l => $q.aq + l + $q.ar + ORIGIN + pre(l) + path + '">').join('') + $t.k37 + ORIGIN + path + '">' : '';
}
const txt = (b, ct, h) => new Response(b, { headers: Object.assign({ 'content-type': ct, 'cache-control': $q.ce, 'access-control-allow-origin': '*' }, h || {}) });
export async function page(req, u, env, ctx, shell) {
  const p = u.pathname;
  let D; try { D = await mdata(env); } catch (e) { return new Response($q.cf, { status: 503, headers: { 'retry-after': '60', 'cache-control': $q.cg } }); }
  if (p === $q.ch) return txt(mSitemap(D), $q.ci);
  if (p === $q.cj) return txt(questionsMd(D), $q.ck, { 'x-robots-tag': $q.cl });
  if (p === $q.br) return txt(JSON.stringify({ about: $q.cm, licence: $q.cn, updated: D.d, count: questions(D).length, questions: questions(D) }), $q.co);
  const cm = CR_RX.exec(p);
  if (cm) {
    const lang = cm[1], kind = cm[2], slug = cm[3];
    if (kind === $q.cp && slug) return null;
    const cc = slug ? D.C.get(slug) : null; if (slug && !cc) return null;   // other pages under /<lang>/countries/ belong to other modules
    if (!cm[4]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': $q.cq } });
    const key = 'c|' + lang + '|' + kind + '|' + (slug || ''); let pg = D.body.get(key);
    if (!pg) { pg = kind === $q.cp ? rankingsHub(D, lang) : cc ? marketPage(D, cc, lang) : countriesHub(D, lang); D.body.set(key, pg); }
    return render(req, lang, pg, await shell(pre(lang) + $q.cr));
  }
  const bm = BUYER_RX.exec(p);
  if (bm) {
    const lang = bm[1] || 'en', g = bm[2]; if (!g) return new Response(null, { status: 301, headers: { location: pre(lang) + $q.cs, 'cache-control': $q.ce } });
    if (!bm[3]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': $q.cq } });
    const key = 'b|' + lang + '|' + g; let pg = D.body.get(key); if (!pg) { pg = buyerPage(D, g, lang); D.body.set(key, pg); }
    return render(req, lang, pg, await shell(pre(lang) + $q.cr));
  }
  const m = PAGE_RX.exec(p); if (!m || !shell) return null;
  const lang = m[1], mm = findMk(D, m[2]); if (!mm) { if (!D.eS) D.eS = new Set([...D.g.keys()].map(slugM)); let k = ''; try { k = slugM(decodeURIComponent(m[2])); } catch (e) {} return D.eS.has(k) || D.eS.has(String(m[2]).toLowerCase()) ? new Response(null, { status: 301, headers: { location: '/m/' + m[2] + '/' + u.search, 'cache-control': $q.cq } }) : null; }   // smaller markets (under 5 named projects) have no translated file: n40 k41 answers the 301 to the English file here (was about 3 s through the 404 path)
  if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': $q.cq } });
  const key = 'm|' + lang + '|' + mm.mk; let pg = D.body.get(key); if (!pg) { pg = marketPage(D, mm, lang); D.body.set(key, pg); }
  return render(req, lang, pg, await shell(pre(lang) + $q.cr));
}
async function render(req, lang, pg, sh) {
const url = ORIGIN + pre(lang) + pg.path, alts = LANGS.map(l => $q.aq + l + $q.ar + ORIGIN + pre(l) + pg.path + '">').join('') + $t.k38 + ORIGIN + pg.path + '">';
const tags = $q.ct + esc(pg.title) + ([...pg.title].length + 11 <= 60 ? $q.cu : '') + $t.k39 + esc(pg.desc) + $q.cv + url + '">' + alts + $t.k40 +
$s.k16 + esc(pg.title) + $t.k41 + esc(pg.desc) + $q.cw + url + $q.cx + ORIGIN + $t.k42 +
$q.cy + JSON.stringify({ '@context': $q.aL, '@graph': pg.ld }).replace(/</g, $q.aM) + $q.aN + CSS;
const res = new HTMLRewriter()
.on('html', { element(e) { e.setAttribute('lang', lang); if (lang === 'ar') e.setAttribute('dir', 'rtl'); else e.removeAttribute('dir'); } })
.on('title', { element(e) { e.remove(); } })
.on($s.k17, { element(e) { e.remove(); } })
.on($q.cz, { element(e) { e.remove(); } })
.on('head', { element(e) { e.append(tags, { html: true }); } })
.on('main', { element(e) { e.setInnerContent(pg.body, { html: true }); } })
.on($q.cA, { element(e) { const l = e.getAttribute($q.cB); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + pg.path); } })
.transform(new Response(sh.body, { headers: { 'content-type': $q.cC } }));
return new Response(req.method === 'HEAD' ? null : await res.text(), { status: 200, headers: { 'content-type': $q.cC, 'cache-control': $q.cD, 'last-modified': new Date(pg.lm + $q.cE).toUTCString() } });
}
export { marketPage, mdata, questions, hubParts, buyerPage };
export async function mkKey(env, key, lang) { try { const D = await mdata(env), m = findMk(D, key); if (!m) return null; const s = m.st; return { n: s.n, h: s.h, mv: s.mv, ov: s.ov, med: s.med, ml: String(t(lang, 'k_med')).replace(/\s*\(0-100\)/, ''), od: s.ov >= OV_MIN ? $q.J + slugA(m.mk) + '/' : '' }; } catch (e) { return null; } }   // n40 d9: the two named delay counts for the market key figures (kbx_n37u mkDash)
export async function mFaq(env, key) { let D; try { D = await mdata(env); } catch (e) { return null; } const m = findMk(D, key); if (!m) return null; const r = marketPage(D, m, 'en'), i = r.body.indexOf($q.i), j = i < 0 ? -1 : r.body.indexOf($q.h, i); if (j < 0) return null; return { html: $q.cF + r.body.slice(i, j + 6) + $q.cG, fq: r.ld.find(x => x['@type'] === $q.n) }; }   // n40 k26: the market questions on the English /m/<market>/ page
