// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_n30a__q, $s = TB.kbx_n30a__s, $t = TB.kbx_n30a__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { S, C } from './kbx_n30a_i18n.js';
import { hkey, hdisp, mkName } from './kbx_hdate.js';
import { TB } from './kbx_strings.js';
export const N30V = 'a7';
const ORIGIN = 'https://kolaboro.com';
const COI_RX = /eco\s*beach\s*city|\bequinox\b/i;
const MIN_N = 5;
const pre = l => l === 'en' ? '' : '/' + l;
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a, "'": '&#39;' }[c]));
const bdi = (lang, s) => lang === 'ar' ? '<bdi>' + esc(s) + $q.b : esc(s);
export const t30 = (lang, k, v) => { let s = (S[lang] && S[lang][k] != null) ? S[lang][k] : S.en[k]; if (typeof s === $q.c && v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b); return s; };
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const nf = (n, lang) => { try { return Number(n).toLocaleString(LOC[lang] || 'en-GB', { maximumFractionDigits: 1 }); } catch (e) { return String(n); } };
const slugM = m => String(m || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const JT = 'application/json; charset=utf-8';
const jr = (o, st, cc) => new Response(JSON.stringify(o), { status: st || 200, headers: { 'content-type': JT, 'cache-control': cc || $q.d, 'access-control-allow-origin': '*', 'x-content-type-options': $q.e } });
const mIdx = k => { const m = /^(\d{4})-(\d{2})$/.exec(String(k || '')); return m ? +m[1] * 12 + +m[2] : null; };
function q7(a, p) { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), h = (s.length - 1) * p, lo = Math.floor(h), hi = Math.ceil(h); return Math.round((s[lo] + (s[hi] - s[lo]) * (h - lo)) * 10) / 10; }
const WS = new WeakMap();
export function slipStats(ix, handoverOf, now) {
const c0 = WS.get(ix), d = now || new Date(), nowI = d.getUTCFullYear() * 12 + d.getUTCMonth() + 1, day = d.toISOString().slice(0, 10);
if (c0 && c0.day === day) return c0;
const per = new Map(), mk = new Map(), all = { late: [], done: 0, notdue: 0, nodate: 0, k: 0 };
for (const x of ix.P) {
if (COI_RX.test(String(x.n || '') + ' ' + String(x.dv || ''))) continue;
const c = ix.caseBy.get(x.id) || {}, st = c.stage || x.st, o = ix.ot && ix.ot[x.id];   // n40 k24: first handover date on record from /data/on-time.json, the same rule as /data/delay-index.json (past_first)
const M = mk.get(x.mk) || { mk: x.mk, co: x.co, late: [], done: 0, notdue: 0, nodate: 0, k: 0 }; mk.set(x.mk, M);
M.k++; all.k++;
if (st === $q.f || (o && /^(done_|completed)/.test(o.s || ''))) { M.done++; all.done++; continue; }
if (!o || !o.first) { M.nodate++; all.nodate++; continue; }
const aq = String(ix.otAsOf || '').split('-').map(Number), fq = o.first.split('-').map(Number), lm = aq.length === 2 ? aq[0] * 12 + aq[1] - (fq[0] * 12 + fq[1]) : 0, fl = lm > 0 ? { m: lm, first: o.first, raw: [$q.g,$q.h,'March','April','May','June','July',$q.i,$q.j,$q.k,$q.l,$q.m][fq[1] - 1] + ' ' + fq[0] } : null;
if (fl) { const m = fl.m; M.late.push(m); all.late.push(m); per.set(x.id, { m, f: { k: fl.first, raw: fl.raw, how: 'read' } }); } else { M.notdue++; all.notdue++; }
}
const row = M => ({ mk: M.mk, co: M.co, n: M.late.length, med: q7(M.late, .5), p25: q7(M.late, .25), p75: q7(M.late, .75), min: M.late.length ? Math.min(...M.late) : null, max: M.late.length ? Math.max(...M.late) : null, notdue: M.notdue, done: M.done, nodate: M.nodate, tracked: M.k });
const rows = [...mk.values()].map(row).sort((a, b) => b.n - a.n || String(a.mk).localeCompare(String(b.mk)));
const out = { day, month: d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0'), all: row(Object.assign({ mk: $q.n, co: '' }, all)), rows, byMk: new Map(rows.map(r => [r.mk, r])), per, min: MIN_N };
WS.set(ix, out); return out;
}
export function slipLine(ix, x, lang, handoverOf, fd) {
try {
const S0 = slipStats(ix, handoverOf), r = S0.byMk.get(x.mk), mkN = mkName(x.mk, lang), me = S0.per.get(x.id);
const href = pre(lang) + $q.o + (r && r.n >= MIN_N ? '#m-' + slugM(x.mk) : '');
let t = r && r.n >= MIN_N ? t30(lang, $q.p, { mk: mkN, n: nf(r.n, lang), m: nf(r.med, lang), a: nf(r.min, lang), b: nf(r.max, lang) })
: t30(lang, $q.q, { mk: mkN, min: MIN_N, m: nf(S0.all.med, lang), n: nf(S0.all.n, lang) });
if (me) t += ' ' + t30(lang, $q.r, { m: nf(me.m, lang), d: hdisp(me.f.raw, lang) || me.f.raw });
return $q.s + esc(t) + $q.t + href + '">' + esc(t30(lang, $q.u)) + $q.v;
} catch (e) { return ''; }
}
export async function slipBlock(env, mkSlug, lang) {
const N = await import('./kbx_named.js'), ix = await N.data(env), S0 = slipStats(ix, N.handoverOf);
const r = S0.rows.find(o => slugM(o.mk) === slugM(mkSlug) || String(o.mk).toLowerCase() === String(mkSlug).toLowerCase()); if (!r) return '';
const mkN = mkName(r.mk, lang), href = pre(lang) + $q.o;
const line = r.n >= MIN_N ? t30(lang, $q.p, { mk: mkN, n: nf(r.n, lang), m: nf(r.med, lang), a: nf(r.min, lang), b: nf(r.max, lang) }) : t30(lang, $q.q, { mk: mkN, min: MIN_N, m: nf(S0.all.med, lang), n: nf(S0.all.n, lang) });
return $t.k0 + esc(t30(lang, $q.w, { mk: mkN })) + $q.x + esc(line) + '</p>' +
(r.n >= MIN_N ? $q.y + esc(t30(lang, 'sl_th')[3]) + ': ' + nf(r.p25, lang) + ' – ' + nf(r.p75, lang) + ' · ' + esc(t30(lang, 'sl_th')[5]) + ': ' + nf(r.notdue, lang) + ' · ' + esc(t30(lang, $q.z, { d: N.fd(S0.day, lang) })) + '</p>' : '') +
$q.A + href + (r.n >= MIN_N ? '#m-' + slugM(r.mk) : '') + '">' + esc(t30(lang, $q.u)) + $q.B + esc(t30(lang, $q.C)) + $q.D + pre(lang) + $q.E + encodeURIComponent(slugM(r.mk)) + $q.F + esc(($t.o_CMP34[lang] || $t.o_CMP34.en).replace('{mk}', mkN)) + $q.G;
}
async function slipApi(env, csv) {
const N = await import('./kbx_named.js'), ix = await N.data(env), S0 = slipStats(ix, N.handoverOf);
const cols = [$q.H, $q.I, $q.J, $q.K, $q.L, $q.M, $q.N, $q.O, $q.P, $q.f, $q.Q, $q.R];
const rr = r => [r.mk, r.co, r.n, r.med, r.p25, r.p75, r.min, r.max, r.notdue, r.done, r.nodate, r.tracked];
if (csv) {
const q = v => v == null ? '' : /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
const body = [cols.join(','), rr(S0.all).map(q).join(',')].concat(S0.rows.map(r => rr(r).map(q).join(','))).join('\n') + '\n';
return new Response(body, { headers: { 'content-type': $q.S, 'cache-control': $q.d, 'access-control-allow-origin': '*', 'content-disposition': $t.k1 + S0.day + '.csv"' } });
}
return jr({ version: $q.T, computed: S0.day, month: S0.month, licence: $t.k2, method: ORIGIN + $q.o, what: $s.k0,
rules: { first_date: $s.k1, period_end: $t.k3, months_past: $t.k4, completed: $t.k5, quantiles: $t.k6, min_sample: MIN_N },
sources: [ORIGIN + $q.U, ORIGIN + $q.V, ORIGIN + $q.W], fields: cols, all: Object.fromEntries(cols.map((c, i) => [c, rr(S0.all)[i]])), markets: S0.rows.map(r => Object.fromEntries(cols.map((c, i) => [c, rr(r)[i]]))) });
}
async function slipPage(u, env, shell, lang) {
const N = await import('./kbx_named.js'), ix = await N.data(env), S0 = slipStats(ix, N.handoverOf), P = pre(lang), th = t30(lang, 'sl_th');
const R = S0.rows.filter(r => r.n >= MIN_N), cell = (v, k) => $q.X + esc(th[k]) + '">' + v + '</td>';
const tr = (r, name, id) => '<tr' + (id ? $q.Y + id + '"' : '') + '>' + cell(name, 0) + cell(nf(r.n, lang), 1) + cell('<b>' + nf(r.med, lang) + '</b>', 2) + cell(nf(r.p25, lang) + ' – ' + nf(r.p75, lang), 3) + cell(nf(r.min, lang) + ' – ' + nf(r.max, lang), 4) + cell(nf(r.notdue, lang), 5) + cell(nf(r.done, lang), 6) + '</tr>';
const mkLink = r => ((ix.mk.get(r.mk) || {}).k >= 5 && lang !== 'en' ? $q.Z + P + '/m/' + encodeURIComponent(String(r.mk).toLowerCase().replace(/\s+/g, '-')) + '/">' : $q.aa + encodeURIComponent(String(r.mk).toLowerCase().replace(/\s+/g, '-')) + '/">') + bdi(lang, mkName(r.mk, lang)) + '</a>';
const table = $q.ab + th.map(h => $q.ac + esc(h) + '</th>').join('') + $q.ad + tr(S0.all, '<b>' + esc(t30(lang, $q.ae)) + '</b>', '') + R.map(r => tr(r, mkLink(r), slugM(r.mk))).join('') + $q.af;
const mx = Math.max(12, S0.all.max || 0), W = 640, Hh = 26;
const strip = r => { const L = []; for (const [id, o] of S0.per) { const x = ix.byId.get(id); if (x && x.mk === r.mk) L.push(o.m); } const X = v => 8 + v / mx * (W - 16);
    return $q.ag + W + ' ' + Hh + $q.ah + esc(mkName(r.mk, lang) + ': ' + th[1] + ' ' + nf(r.n, lang) + ', ' + th[2] + ' ' + nf(r.med, lang) + ', ' + th[3] + ' ' + nf(r.p25, lang) + ' – ' + nf(r.p75, lang) + ', ' + th[4] + ' ' + nf(r.min, lang) + ' – ' + nf(r.max, lang)) + $q.ai + (W - 8) + $q.aj + L.map(v => $q.ak + X(v).toFixed(1) + $q.al).join('') + $q.am + X(r.p25).toFixed(1) + $q.an + Math.max(2, X(r.p75) - X(r.p25)).toFixed(1) + $q.ao + X(r.med).toFixed(1) + $q.ap + X(r.med).toFixed(1) + $q.aq; };
const strips = $q.ar + R.slice(0, 20).map(r => $q.as + bdi(lang, mkName(r.mk, lang)) + $q.at + nf(r.n, lang) + ', ' + esc(th[2]) + ' ' + nf(r.med, lang) + $q.au + strip(r) + $q.av).join('') + $q.aw + nf(mx, lang) + $q.ax;
const ul = a => '<ul>' + a.map(s => '<li>' + esc(String(s).split('{n}').join(String(MIN_N))) + '</li>').join('') + '</ul>';
const body = $t.k7 + P + $q.ay + P + $q.az + esc(t30(lang, 'sl_bc')) + $q.aA + esc(t30(lang, 'sl_h1')) + $q.aB + esc(t30(lang, $q.aC, { d: N.fd(S0.day, lang), k: nf(S0.all.tracked, lang) })) + $q.aD +
$q.aE + esc(t30(lang, $q.aF)) + '</h2>' + table + $q.y + esc(t30(lang, $q.aG, { n: MIN_N })) + $q.aH + esc(t30(lang, $q.C)) + $t.k8 + esc(t30(lang, $q.aI)) + $q.aJ + strips +
$q.aK + esc(t30(lang, $q.aL)) + '</h2>' + ul(t30(lang, 'sl_m')) + $q.aM + esc(t30(lang, $q.aN)) + '</h2>' + ul(t30(lang, $q.aO)) + $q.aP +
$s.k2 +
$s.k3 +
$s.k4;
const canon = ORIGIN + P + $q.o;
const pg = { title: t30(lang, 'sl_t') + $q.aQ, desc: t30(lang, 'sl_d'), canon, body, alt: l => ORIGIN + pre(l) + $q.o, lastmod: S0.day,
ld: { '@context': $q.aR, '@graph': [{ '@type': $q.aS, name: t30(lang, 'sl_h1'), description: t30(lang, 'sl_d'), url: canon, inLanguage: lang, dateModified: S0.day, license: $t.k9, creator: { '@type': $q.aT, name: $q.aU, url: ORIGIN + '/' }, measurementTechnique: t30(lang, 'sl_m')[3], variableMeasured: t30(lang, 'sl_th')[2], isBasedOn: [ORIGIN + $q.U, ORIGIN + $q.V, ORIGIN + $q.W],
distribution: [{ '@type': $q.aV, encodingFormat: $q.aW, contentUrl: ORIGIN + $q.aX }, { '@type': $q.aV, encodingFormat: $q.aY, contentUrl: ORIGIN + $q.aZ }] },
{ '@type': $q.ba, itemListElement: [{ '@type': $q.bb, position: 1, name: $q.aU, item: ORIGIN + P + '/' }, { '@type': $q.bb, position: 2, name: t30(lang, 'sl_h1'), item: canon }] }] } };
return page(pg, lang, shell, N);
}
async function page(pg, lang, shell, N, extraHeaders) {
  const sh = await shell(pre(lang) + $q.bc); if (!sh || sh.status !== 200) return null;
  const html = await N.assemble(pg, lang, sh);
  return new Response(html, { status: 200, headers: Object.assign({ 'content-type': $q.bd, 'cache-control': $q.d }, pg.noindex ? { 'x-robots-tag': $q.be } : {}, extraHeaders || {}) });
}
async function timelinePage(u, env, shell, lang, slug) {
const N = await import('./kbx_named.js'); let ix; try { ix = await N.data(env); } catch (e) { return null; }
const x = ix.bySlug.get(slug); if (!x || COI_RX.test(String(x.n || '') + ' ' + String(x.dv || ''))) return null;
const P = pre(lang), base = P + $q.bf + x.s + '/', fd = d => N.fd(d, lang), c = ix.caseBy.get(x.id) || {};
const [ph, sat] = await Promise.all([(async () => { try { return (await (await import('./kbx_paper.js')).paperData(env)).ph; } catch (e) { return null; } })(), (async () => { try { return await (await import('./kbx_named_sat.js')).satData(env); } catch (e) { return null; } })()]);
const E = [];
const add = (d, k, t, src) => { const i = N.iso(d) || (/^\d{4}-\d{2}$/.test(String(d)) ? d : null); if (i) E.push({ d: i, k, t, src }); };
const ds = [$q.U, $q.U];
add(x.ad, 'rec', t30(lang, $q.bg), [t30(lang, 's_ds'), ds[1]]);
if (x.pn) add(x.ad, 'rec', t30(lang, 'ev_pn', { p: x.pn }), [t30(lang, 's_ds'), base + $q.bh]);
if (x.sealed && x.sha) add(x.sealed, 'rec', t30(lang, $q.bi, { h: String(x.sha).slice(0, 12) }), [t30(lang, $q.bj), $q.bf + x.s + $q.bk + x.sha + '.txt']);
if (x.rvw && x.rvw.d) add(x.rvw.d, 'rec', t30(lang, $q.bl), [t30(lang, 's_rev'), base + $q.bm]);
if (c.checked) add(c.checked, 'rec', t30(lang, $q.bn), [t30(lang, 's_ds'), $q.W]);
const pr = (ix.prom[x.id] || []).find(p => p && p.k === $q.bo);
if (pr) {
const H = (pr.hist || []).filter(e => e && e.seen && e.d).slice().sort((a, b) => a.seen < b.seen ? -1 : a.seen > b.seen ? 1 : 0), lastBy = {};
for (const e of H) {
const src = e.src === 'page' ? [t30(lang, 's_dev'), e.sha ? pre(lang) + $q.bf + x.s + $q.bk : (x.url || base)] : [t30(lang, 's_res'), base + $q.bm];
const l0 = lastBy[e.src || '?'];
if (l0 && hkey(l0.d) && hkey(e.d) && hkey(e.d) !== hkey(l0.d)) add(e.seen, 'date', t30(lang, $q.bp, { a: hdisp(l0.d, lang) || l0.d, b: hdisp(e.d, lang) || e.d }), src);
else if (!l0 || l0.d !== e.d) add(e.seen, 'date', t30(lang, 'ev_ho', { d: hdisp(e.d, lang) || e.d }), src);
lastBy[e.src || '?'] = e;
}
}
const od = N.overdueOf ? N.overdueOf(ix, x) : null;
if (od && od.end) { const [y, m] = od.end.split('-').map(Number), nx = m === 12 ? (y + 1) + '-01' : y + '-' + String(m + 1).padStart(2, '0'); add(nx, 'date', t30(lang, $q.bq, { d: hdisp(od.d, lang) || od.d }), [t30(lang, 's_ds'), base + $q.br]); }
const H2 = ph && ph.projects && ph.projects[x.id];
if (H2 && H2.pts) {
let prev = null; const ia = (ts, url) => $q.bs + ts + '/' + url;
for (const p of H2.pts.slice().sort((a, b) => a.d < b.d ? -1 : 1)) {
const href = p.src === 'copy' ? $q.bf + x.s + $q.bk + p.ref + '.txt' : ia(p.ref, H2.url), src = [t30(lang, p.src === 'copy' ? $q.bj : 's_ia'), href];
const h = p.head && p.head.p ? p.head.p : null;
if (h && (!prev || prev.cur !== p.head.cur || prev.v !== p.head.v)) add(p.d, 'price', prev && prev.cur === p.head.cur ? t30(lang, $q.bt, { a: prev.p, b: h }) : t30(lang, $q.bu, { p: h }), src);
else if (!h && p.src === 'ia') add(p.d, 'price', t30(lang, 'ev_ia'), src);
if (h) prev = p.head;
}
}
const rec = sat && sat.projects && sat.projects[x.id];
if (rec && rec.n && rec.m0) {
const m0 = mIdx(rec.m0), ym = i => { const v = m0 + i - 1; return Math.floor(v / 12) + '-' + String(v % 12 + 1).padStart(2, '0'); }, clr = []; for (let i = 0; i < rec.n; i++) if (rec.c[i] != null) clr.push(i);
const ssrc = [t30(lang, 's_sat'), base + $q.bv];
if (clr.length) { add(rec.dt[clr[0]] || ym(clr[0]), 'sat', t30(lang, $q.bw), ssrc); add(rec.dt[clr[clr.length - 1]] || ym(clr[clr.length - 1]), 'sat', t30(lang, $q.bx), ssrc); }
try { const SM = await import('./kbx_named_sat.js'), I = SM.index(rec); if (I) { const ok = I.y.map((v, i) => v == null ? -1 : i).filter(i => i >= 0); for (let j = 3; j + 1 < ok.length; j++) { const a = I.y[ok[j]], b = I.y[ok[j + 1]]; if (Math.abs(a) >= SM.BAND && Math.abs(b) >= SM.BAND && Math.sign(a) === Math.sign(b)) { add(rec.dt[ok[j]] || ym(ok[j]), 'sat', t30(lang, $q.by, { x: (a > 0 ? '+' : '') + a }), ssrc); break; } } } } catch (e) {}
}
E.sort((a, b) => a.d < b.d ? 1 : a.d > b.d ? -1 : 0);
const kinds = ['date', 'price', 'rec', 'sat'].filter(k => E.some(e => e.k === k)), kl = { date: $q.bz, price: $q.bA, rec: 'k_rec', sat: 'k_sat' };
let lastY = '', items = '';
for (const e of E) {
const y = e.d.slice(0, 4); if (y !== lastY) { items += $q.bB + y + '</li>'; lastY = y; }
const sh = e.src && e.src[1] ? $q.t + esc(e.src[1]) + '"' + (/^https?:/.test(e.src[1]) ? $t.k10 : '') + '>' + esc(e.src[0]) + '</a>' : '';
items += $q.bC + e.k + $q.bD + e.k + $q.bE + e.d + '">' + esc(fd(e.d)) + $q.bF + bdi(lang, e.t) + sh + $q.bG;
}
const name = x.n, a = E.length ? fd(E[E.length - 1].d) : '', b = E.length ? fd(E[0].d) : '';
const chips = kinds.length > 1 ? $t.k11 + esc(t30(lang, 'k_all')) + $q.bH + kinds.map(k => $t.k12 + k + '"> ' + esc(t30(lang, kl[k])) + ' (' + E.filter(e => e.k === k).length + $q.bI).join('') + '</p>' : '';
const body = $t.k13 + P + $q.ay + P + $q.bJ + esc(N.tr(lang, 'h1_i')) + $q.bK + base + '">' + bdi(lang, name) + $q.aA + esc(t30(lang, 'tl_h1', { n: name })) + $q.aB + esc(t30(lang, $q.bL)) + '</p>' +
(E.length ? $q.bM + esc(t30(lang, 'tl_k', { k: nf(E.length, lang), a, b })) + $q.bN : '') + $t.k14 + chips +
(E.length ? $q.bO + items + '</ol>' : '<p>' + esc(t30(lang, $q.bP)) + '</p>') + $q.bQ + base + '">' + esc(t30(lang, $q.bR)) + $q.bS +
$s.k5 +
$s.k6 +
$s.k7 +
$s.k8;
const canon = ORIGIN + base + $q.bT;
const pg = { title: (t30(lang, 'tl_t', { n: name }).length > 60 ? t30(lang, 'tl_h1', { n: name }) : t30(lang, 'tl_t', { n: name })) + $q.aQ, desc: t30(lang, 'tl_d', { n: name }), canon, body, noindex: true, alt: l => ORIGIN + pre(l) + $q.bf + x.s + $q.bU, lastmod: E.length ? E[0].d.slice(0, 10) : '',
ld: { '@context': $q.aR, '@graph': [{ '@type': $q.bV, name: t30(lang, 'tl_h1', { n: name }), url: canon, inLanguage: lang, about: { '@type': $q.bW, name, url: ORIGIN + base }, isPartOf: { '@type': $q.bX, name: $q.aU, url: ORIGIN + '/' } },
{ '@type': $q.ba, itemListElement: [{ '@type': $q.bb, position: 1, name: $q.aU, item: ORIGIN + P + '/' }, { '@type': $q.bb, position: 2, name, item: ORIGIN + base }, { '@type': $q.bb, position: 3, name: t30(lang, 'tl_h1', { n: name }), item: canon }] }] } };
return page(pg, lang, shell, N);
}
const RV = { ok: 3, part: 2, no: 1, nc: 0 };
const RC = ['#155C75', '#FF5B14', '#7A5AF8', '#2E8B57'];
export function radarSvg(lang, cols) {
const L = t30(lang, 'lt'), W = 360, cx = 180, cy = 170, R = 120, n = 6;
const pt = (i, r) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
let g = '';
for (let k = 1; k <= 3; k++) g += $q.bY + Array.from({ length: n }, (_, i) => pt(i, R * k / 3).map(v => v.toFixed(1)).join(',')).join(' ') + '"/>';
for (let i = 0; i < n; i++) { const [x, y] = pt(i, R); g += $q.bZ + cx + $q.ca + cy + $q.ap + x.toFixed(1) + $q.cb + y.toFixed(1) + '"/>'; const [lx, ly] = pt(i, R + 22); g += $q.cc + lx.toFixed(1) + '" y="' + (ly + 4).toFixed(1) + $q.cd + (Math.abs(lx - cx) < 8 ? $q.ce : lx > cx ? 'start' : 'end') + '">' + esc(L[i]) + $q.cf; }
cols.forEach((c, j) => { const P = c.st.map((s, i) => pt(i, Math.max(6, R * (RV[s] || 0) / 3))); g += $q.cg + RC[j] + $q.ch + RC[j] + $q.ci + P.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ') + $q.cj + esc(c.name) + $q.ck + P.map(p => $q.ak + p[0].toFixed(1) + $q.cl + p[1].toFixed(1) + $q.cm + RC[j] + '"/>').join(''); });
const leg = $q.cn + cols.map((c, j) => $q.co + RC[j] + $q.cp + bdi(lang, c.name) + '</li>').join('') + '</ul>';
return $q.cq + esc(t30(lang, $q.cr)) + $t.k15 + esc(t30(lang, $q.cr) + ': ' + cols.map(c => c.name + ' ' + c.st.map((s, i) => L[i] + ' ' + t30(lang, 'st')[s]).join(', ')).join('; ')) + '">' + g + $q.cs + leg + $q.y + esc(t30(lang, $q.ct)) + $q.cu +
$s.k9;
}
const CR_KEYS = ['ho', 'pen', 'esc', 'pay', 'law', 'can'];
async function readerPage(u, env, shell, lang) {
const N = await import('./kbx_named.js'), P = pre(lang), w = k => t30(lang, k);
const M = { v: N30V }; for (const k of [$q.cv, 'cr_rd', $q.cw, $q.cx, $q.cy, $q.cz, 'cr_k', 'cr_k1', $q.cA, $q.cB, $q.cC, $q.cD, $q.cE]) M[k.slice(3)] = w(k);
M.cat = CR_KEYS.map(k => [k, w('cr_' + k), w('cr_' + k + '_q')]);
const body = $t.k16 + P + $q.cF + esc(w('cr_bc')) + $q.aA + esc(w('cr_h1')) + $q.aB + esc(w($q.cG)) + '</p>' +
$q.cH + esc(w($q.cI)) + $t.k17 + esc(JSON.stringify(M)) + '">' +
$t.k18 + esc(w($q.cv)) + $t.k19 + esc(w($q.cJ)) + $s.k10 +
$q.cK + esc(w('cr_or')) + $t.k20 + esc(w('cr_or')) + $s.k11 + esc(w('cr_go')) + $t.k21 + esc(w($q.cL)) + $q.cM +
$t.k22 +
(await (await import('./kbx_n31e.js')).crBlock(lang, env).catch(() => '')) + $q.cN + CR_KEYS.map(k => $q.cO + esc(w('cr_' + k)) + $q.cP + esc(w('cr_' + k + '_q')) + '</li>').join('') + '</ul>' +
$q.y + esc(w($q.cQ)) + $q.cR + esc(w($q.cS)) + $t.k23 + esc(w($q.cT)) + $q.cU + P + $q.cV + esc(w($q.cW)) + $t.k24 + esc(w($q.cX)) + $q.cU + P + $q.cY + esc($t.o_VT35[lang] || $t.o_VT35.en) + $q.cZ +
$s.k12 +
$s.k13 +
$s.k14 +
$s.k15 +
$s.k16 + N30V + $s.k17;
const canon = ORIGIN + P + $q.da;
const pg = { title: w('cr_t') + $q.aQ, desc: w('cr_d'), canon, body, alt: l => ORIGIN + pre(l) + $q.da, lastmod: $q.db,
ld: { '@context': $q.aR, '@graph': [{ '@type': $q.dc, name: w('cr_h1'), description: w('cr_d'), url: canon, inLanguage: lang, applicationCategory: $q.dd, operatingSystem: $q.de, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, isPartOf: { '@type': $q.bX, name: $q.aU, url: ORIGIN + '/' } },
{ '@type': $q.ba, itemListElement: [{ '@type': $q.bb, position: 1, name: $q.aU, item: ORIGIN + P + '/' }, { '@type': $q.bb, position: 2, name: w('cr_bc'), item: ORIGIN + $q.df }, { '@type': $q.bb, position: 3, name: w('cr_h1'), item: canon }] }] } };
return page(pg, lang, shell, N);
}

export const CR_JS = () => '(' + $q.F_crClient.toString() + ')();';   // n40 k46: a function (script text read from k46s.json)

let nlJs = null; export const NL_JS = () => nlJs || (nlJs = '(' + $q.F_nlClient.toString().replace('__C__', JSON.stringify(C)) + ')();');   // n40 k46: a function, kept once built
export const LOADER = "(function(){var p=location.pathname;if(document.querySelector('form[data-check] #hero-url')||(/\\/projects\\/?$/.test(p)&&document.querySelector('[data-kx-lists]'))){var s=document.createElement('script');s.src='/k/n30a.js?v=" + N30V + "';s.async=true;document.head.appendChild(s);}})();";
export const BA_BTN_JS = ";var ba=f.querySelector('[data-n30ba]');if(ba)ba.addEventListener('click',function(){on();var a=[f,d,im,T];if(window.N30&&window.N30.ba){window.N30.ba.apply(null,a);return}window.N30_BA_Q=a;if(!document.querySelector('script[data-n30]')){var s=document.createElement('script');s.src='/k/n30a.js?v=" + N30V + "';s.setAttribute('data-n30','');document.head.appendChild(s)}});";
export const baButton = lang => $t.k25 + esc((C[lang] || C.en).ba) + $q.dg;
export const PATHS = /^\/k\/n30a(?:-cr)?\.js$|^\/api\/v1\/slippage(?:\.csv)?$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:tools\/contract-reader|methods\/handover-slippage|projects\/[a-z0-9-]{1,90}\/timeline)\/?$/;
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname;
if (req.method !== 'GET' && req.method !== 'HEAD') return null;
const js = (body) => new Response(body, { headers: { 'content-type': $q.dh, 'cache-control': u.searchParams.get('v') === N30V ? $q.di : $q.dj, 'x-content-type-options': $q.e } });
if (p === $q.dk) return js(NL_JS());
if (p === $q.dl) return js(CR_JS());
try {
if (p === $q.aX || p === $q.aZ) return await slipApi(env, p.endsWith('.csv'));
} catch (e) { return jr({ error: $q.dm }, 503, $q.dn); }
const m = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(tools\/contract-reader|methods\/handover-slippage|projects\/([a-z0-9-]{1,90})\/timeline)(\/?)$/); if (!m) return null;
if (!m[4]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': $q.do } });
const lang = m[1] || 'en';
try {
if (m[2] === $q.dp) return await readerPage(u, env, shell, lang);
if (m[2] === $q.dq) return await slipPage(u, env, shell, lang);
return await timelinePage(u, env, shell, lang, m[3]);
} catch (e) { return null; }
}
