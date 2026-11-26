// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_n30c__q, $s = TB.kbx_n30c__s, $t = TB.kbx_n30c__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import * as N from './kbx_named.js';
import { S, t, esc, num, LANGS, slugMk, pinRecord, phMarkets, PH_MIN } from './kbx_n30c_named.js';
import { mkName, coName } from './kbx_hdate.js';
import { TB } from './kbx_strings.js';
const IF = (globalThis.__kbIF = globalThis.__kbIF || {}); function sf(k, f) { if (IF[k]) return IF[k]; const p = f(); IF[k] = p; const d = () => { if (IF[k] === p) delete IF[k]; }; p.then(d, d); return p; }   // n40 d12
const ORIGIN = 'https://kolaboro.com';
const COI_RX = /eco\s*beach\s*city|\bequinox\b/i;
const pre = l => l === 'en' ? '' : '/' + l;
export const PATHS = /^\/k\/n30c-map\.js$|^\/api\/v1\/pin\/[A-Za-z0-9-]{3,20}$|^\/embed\/v2(?:\.js|\/[a-z0-9-]{1,90}\/?)$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:prices\/history(?:\/[a-z0-9-]{2,60})?|watch\/lookalikes\/images|tools\/widget|engineering\/status)\/?$/;
const jr = (o, s, cc) => new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': $q.a, 'access-control-allow-origin': '*', 'cache-control': cc || $q.b } });
const MEMO = {};
const file = (env, name, ttl) => sf('n30c:' + name, () => file0(env, name, ttl));
async function file0(env, name, ttl) {
  const m = MEMO[name]; if (m && Date.now() - m.t < (ttl || 600000)) return m.v;
  let v = null;
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.c + name)); if (r.ok) v = await r.json(); } catch (e) { v = null; }
  MEMO[name] = { t: Date.now(), v }; return v;
}
const quant = (a, q) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), i = (s.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };
const fdt = (d, lang) => N.fd(String(d).slice(0, 10), lang);
const ftime = (d, lang) => { try { return new Date(d).toLocaleString(lang === 'en' ? 'en-GB' : lang, { day: $q.d, month: 'short', year: $q.d, hour: $q.e, minute: $q.e, timeZone: 'UTC', numberingSystem: 'latn' }) + ' UTC'; } catch (e) { return String(d); } };
const kb = n => n == null ? '-' : (n / 1024).toFixed(n < 10240 ? 1 : 0) + ' KB';
async function shellPage(shell, lang, o) {
const sh = await shell(pre(lang) + $q.f); if (!sh || sh.status !== 200) return null;
const crumb = $q.g + pre(lang) + $q.h + (o.crumb || []).map(([h, l]) => $q.i + h + '">' + esc(l) + '</a>').join('') + '</p>';
const body = $t.k0 + crumb + '<h1>' + esc(o.h1) + $q.j + esc(o.lead) + $t.k1 + o.body + $q.k + $s.PCSS;
const pg = { title: o.title + $q.l, desc: o.desc, canon: o.canon, body, noindex: !!o.noindex, alt: o.alt,
ld: { '@context': $q.m, '@graph': [{ '@type': o.type || $q.n, name: o.title, url: o.canon, inLanguage: lang, description: o.desc, dateModified: o.mod || undefined, isPartOf: { '@type': $q.o, name: $q.p, url: ORIGIN + '/' } }].concat(o.ld || []) } };
return new Response(await N.assemble(pg, lang, sh), { status: 200, headers: { 'content-type': $q.q, 'cache-control': $q.b } });
}
function phChart(e, lang) {
const W = 720, Hh = 300, pl = 44, pr = 12, pt = 12, pb = 30, ms = d => Date.parse(d + $q.r);
const t0 = ms(e.a), t1 = Math.max(ms(e.b), t0 + 864e5 * 30);
let lo = 100, hi = 100; e.L.forEach(r => r.pts.forEach(p => { lo = Math.min(lo, p[1]); hi = Math.max(hi, p[1]); }));
lo = Math.max(30, Math.floor((lo - 5) / 10) * 10); hi = Math.min(260, Math.ceil((hi + 5) / 10) * 10);
const X = d => pl + (ms(d) - t0) / (t1 - t0) * (W - pl - pr), Y = v => pt + (hi - Math.min(hi, Math.max(lo, v))) / (hi - lo) * (Hh - pt - pb);
const step = (hi - lo) > 80 ? 20 : 10; let g = '';
for (let v = lo; v <= hi; v += step) g += $q.s + pl + $q.t + (W - pr) + $q.u + Y(v).toFixed(1) + $q.v + Y(v).toFixed(1) + '"' + (v === 100 ? $q.w : '') + $q.x + (pl - 6) + '" y="' + (Y(v) + 4).toFixed(1) + $q.y + v + $q.z;
const y0 = +e.a.slice(0, 4), y1 = +e.b.slice(0, 4);
if (y1 > y0) for (let y = y0 + 1; y <= y1; y++) { const x = X(y + $q.A); g += $q.s + x.toFixed(1) + $q.t + x.toFixed(1) + $q.u + pt + $q.v + (Hh - pb) + $q.B + x.toFixed(1) + '" y="' + (Hh - 10) + $q.C + y + $q.z; }
else { g += $q.D + pl + '" y="' + (Hh - 10) + '">' + esc(fdt(e.a, lang)) + $q.E + (W - pr) + '" y="' + (Hh - 10) + $q.y + esc(fdt(e.b, lang)) + $q.z; }
const lines = e.L.map(r => $q.F + r.pts.map(p => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ') + $q.G + esc(r.p.n) + $q.H).join('');
const days = [...new Set(e.L.flatMap(r => r.pts.map(p => p[0])))].sort(), med = [];
for (const d of days) { const v = []; for (const r of e.L) { if (r.pts[0][0] > d) continue; let last = null; for (const p of r.pts) { if (p[0] <= d) last = p[1]; else break; } v.push(last); } if (v.length >= 3) med.push([d, quant(v, .5)]); }
const ml = med.length > 1 ? $q.I + med.map(p => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ') + '"/>' : '';
const A11 = $t.o_A11Y[lang] || $t.o_A11Y.en, sid = 'kph-s' + (e.mk ? String(e.mk).toLowerCase().replace(/[^a-z0-9]+/g, '') : 'all');
const sum = med.length > 1 ? A11.sum.replace('{n}', num(e.L.length, lang)).replace('{a}', num(med[0][1], lang, 1)).replace('{d1}', fdt(med[0][0], lang)).replace('{b}', num(med[med.length - 1][1], lang, 1)).replace('{d2}', fdt(med[med.length - 1][0], lang)) : '';
const tbl = med.length > 1 ? $q.J + esc(A11.tbl) + $t.k2 + esc(A11.d) + $q.K + esc(A11.m) + $q.L +
(med.length > 80 ? med.filter((p, i) => i % Math.ceil(med.length / 80) === 0 || i === med.length - 1) : med).map(p => $q.M + esc(fdt(p[0], lang)) + $q.N + num(p[1], lang, 1) + $q.O).join('') + $q.P : '';
return $t.k3 + W + ' ' + Hh + $t.k4 + esc(t(lang, $q.Q, { n: e.L.length })) + '"' + (sum ? $q.R + sid + '"' : '') + '>' + g + lines + ml + $q.S + esc(t(lang, $q.Q, { n: num(e.L.length, lang) })) + (sum ? $q.T + sid + '">' + esc(sum) + $q.U : '') + $q.V + tbl +
$s.k0;
}
const pctS = (v, lang) => (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(v), lang, 1) + '%';
async function priceHistory(u, env, shell, lang, mkS) {
const ix = await N.data(env), ph = await file(env, $q.W, 1800000); if (!ph) return null;
const M = phMarkets(ph, ix), P = pre(lang), list = [...M.values()].filter(e => e.L.length >= PH_MIN).sort((a, b) => b.L.length - a.L.length || a.mk.localeCompare(b.mk));
const upd = String(ph.updated || '').slice(0, 10);
const meth = $q.X + esc(t(lang, $q.Y)) + $q.Z + esc(t(lang, 'ph_m1')) + $q.aa + esc(t(lang, 'ph_m2')) + $q.aa + esc(t(lang, 'ph_m3')) + $q.ab + esc(t(lang, $q.ac)) + $q.ad +
$t.k5 + esc(t(lang, $q.ae)) + $q.af + esc(N.fd(upd, lang)) + $q.ag;
if (!mkS) {
const rows = list.map(e => $q.ah + P + $q.ai + e.s + '/">' + esc(mkName(e.mk, lang)) + $q.aj + num(e.L.length, lang) + $q.N + (e.med == null ? '-' : pctS(e.med, lang)) + $q.N + num(e.copies, lang) + $q.O).join('');
const body = '<p>' + esc(t(lang, $q.ak, { k: PH_MIN })) + $t.k6 + esc(t(lang, 'ph_mk')) + $q.K + esc(t(lang, 'ph_np')) + $q.K + esc(t(lang, 'ph_mc')) + $q.K + esc(t(lang, 'ph_th')[4]) + $q.L + rows + $q.al + meth;
return shellPage(shell, lang, { title: t(lang, 'ph_ti'), h1: t(lang, 'ph_ti'), lead: t(lang, 'ph_di'), desc: t(lang, 'ph_di'), canon: ORIGIN + P + $q.ai, alt: l => ORIGIN + pre(l) + $q.ai, body, mod: upd, crumb: [[P + $q.am, t(lang, $q.ac)]], type: $q.an,
ld: [{ '@type': $q.ao, itemListElement: list.slice(0, 50).map((e, i) => ({ '@type': $q.ap, position: i + 1, name: e.mk, url: ORIGIN + P + $q.ai + e.s + '/' })) }] });
}
const e = list.find(e => e.s === mkS); if (!e) return null;
const mn = mkName(e.mk, lang), canon = ORIGIN + P + $q.ai + e.s + '/';
const L = e.L.slice().sort((a, b) => (b.pts[b.pts.length - 1][1] - 100) - (a.pts[a.pts.length - 1][1] - 100) || a.p.n.localeCompare(b.p.n));
const th = t(lang, 'ph_th');
const rows = L.map(r => { const ch = r.pts[r.pts.length - 1][1] - 100;
return $q.ah + P + $q.aq + r.p.s + '/">' + '<bdi>' + esc(r.p.n) + $q.ar + esc(r.first.head.p) + $q.as + esc(fdt(r.first.d, lang)) + ' · ' + esc(r.first.src === 'ia' ? $q.at : $q.p) + $q.au +
$q.av + esc(r.last.head.p) + $q.as + esc(fdt(r.last.d, lang)) + ' · ' + esc(r.last.src === 'ia' ? $q.at : $q.p) + $q.aw + pctS(ch, lang) + $q.ax + P + $q.aq + r.p.s + $q.ay + num(r.n, lang) + $q.az; }).join('');
const body = '<p>' + esc(t(lang, $q.aA)) + $q.aB + num(e.L.length, lang) + $q.aC + esc(t(lang, 'ph_np')) + $q.aD + (e.med == null ? '-' : pctS(e.med, lang)) + $q.aC + esc(t(lang, 'ph_mc')) + $q.aD + num(e.copies, lang) + $q.aC + esc(th[4]) + $q.aE +
'<p>' + esc(t(lang, 'ph_n', { n: num(e.L.length, lang), c: num(e.copies, lang), a: fdt(e.a, lang), b: fdt(e.b, lang) })) + ' ' + esc(t(lang, $q.aF, { p: e.med == null ? '-' : pctS(e.med, lang) })) + ' ' + esc(t(lang, 'ph_up', { u: num(e.up, lang), d: num(e.down, lang), s: num(e.same, lang) })) + '</p>' +
phChart(e, lang) + (e.x ? $q.aG + esc(t(lang, 'ph_x', { n: num(e.x, lang) })) + '</p>' : '') +
$t.k7 + th.map((h, i) => $q.aH + (i >= 3 ? $q.aI : '') + '>' + esc(h) + '</th>').join('') + $q.aJ + rows + $q.al + meth +
$q.aK + P + $q.aL + esc(t(lang, $q.aM)) + $q.aN + encodeURIComponent(String(e.mk).toLowerCase().replace(/\s+/g, '-')) + '/">' + esc(mn) + $q.aO + P + $q.aP + esc(t(lang, $q.aQ)) + $q.aR;
return shellPage(shell, lang, { title: t(lang, 'ph_t', { m: mn }), h1: t(lang, 'ph_t', { m: mn }), lead: t(lang, 'ph_d', { m: mn }), desc: t(lang, 'ph_d', { m: mn }), canon, alt: l => ORIGIN + pre(l) + $q.ai + e.s + '/', body, mod: upd,
crumb: [[P + $q.am, t(lang, $q.ac)], [P + $q.ai, t(lang, 'ph_ti')]],
ld: [{ '@type': $q.aS, name: t(lang, 'ph_t', { m: mn }), description: t(lang, 'ph_d', { m: mn }), url: canon, license: $t.k8, creator: { '@type': $q.aT, name: $q.p, url: ORIGIN + '/' }, dateModified: upd, temporalCoverage: e.a + '/' + e.b, spatialCoverage: { '@type': 'Place', name: e.mk }, isBasedOn: ORIGIN + $q.aU, distribution: { '@type': $q.aV, encodingFormat: $q.aW, contentUrl: ORIGIN + $q.aU } }] });
}
async function imageReuse(u, env, shell, lang) {
const ix = await N.data(env), R = await file(env, $q.aX, 1800000); if (!R) return null;
const P = pre(lang), dom = s => { try { return new URL(s).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const th = t(lang, 'ir_th');
const cell = id => { const x = ix.byId.get(id); if (!x || COI_RX.test(String(x.n) + ' ' + String(x.dv))) return null; return x; };
const table = kind => { const L = (R.pairs || []).filter(p => p.kind === kind).map(p => [p, cell(p.a), cell(p.b)]).filter(r => r[1] && r[2]);
    if (!L.length) return '<p>' + esc(t(lang, $q.aY)) + '</p>';
    return $q.aZ + th.map((h, i) => $q.aH + (i >= 4 ? $q.aI : '') + '>' + esc(h) + '</th>').join('') + $q.aJ +
      L.map(([p, a, b]) => { const best = p.m.reduce((m, q) => !m || q[2] + q[3] < m[2] + m[3] ? q : m, null);
        const pg = x => N.okHttp(x.url) ? $q.ba + esc(N.fixU(x.url)) + $q.bb + esc(dom(x.url)) + $q.bc : '-';
        return $q.ah + P + $q.aq + a.s + $q.bd + esc(a.n) + $q.be + esc(a.dv || '') + $q.bf + pg(a) + $q.bg + P + $q.aq + b.s + $q.bd + esc(b.n) + $q.be + esc(b.dv || '') + $q.bf + pg(b) + '</td>' +
          $q.bh + num(p.m.length, lang) + $q.bi + esc(best[0]) + $q.bj + esc(t(lang, $q.bk, { f: best[2], c: best[3] })) + $q.O; }).join('') + $q.al; };
const c = R.counts || {}, cp = R.compared || {};
const body = '<p>' + esc(t(lang, $q.bl, { n: num(cp.images_used || 0, lang), p: num(cp.pairs_compared || 0, lang) })) + '</p>' +
$q.bm + num((c.by_kind || {}).cross || 0, lang) + $q.aC + esc(t(lang, 'ir_c')) + $q.aD + num((c.by_kind || {}).same_site || 0, lang) + $q.aC + esc(t(lang, 'ir_cs')) + $q.aD + num((c.by_kind || {}).same_dev || 0, lang) + $q.aC + esc(t(lang, 'ir_cd')) + $q.aD + num(cp.images_used || 0, lang) + $q.aC + esc(th[4]) + $q.aE +
$q.aG + esc(t(lang, $q.bn)) + '</p>' +
$q.bo + esc(t(lang, 'ir_c')) + '</h2>' + table('cross') + $q.bp + esc(t(lang, 'ir_cs')) + '</h2>' + table($q.bq) + $q.br + esc(t(lang, 'ir_cd')) + '</h2>' + table($q.bs) +
$q.X + esc(t(lang, $q.bt)) + $q.bu + esc(R.method) + $q.bv + esc(t(lang, $q.bw, { d: fdt((R.input || {}).generated || '', lang), c: fdt(R.generated, lang) })) + ' ' + esc(t(lang, $q.bx, { n: num(cp.images_left_out_low_structure || 0, lang) })) + '</p>' +
$t.k9 + esc(t(lang, $q.by)) + $q.bz + P + $q.bA + esc(t(lang, $q.bB)) + $s.k1;
return shellPage(shell, lang, { title: t(lang, 'ir_t'), h1: t(lang, 'ir_t'), lead: t(lang, 'ir_d'), desc: t(lang, 'ir_d'), canon: ORIGIN + P + $q.bC, alt: l => ORIGIN + pre(l) + $q.bC, body, mod: R.generated,
crumb: [[P + $q.bD, t(lang, $q.bB)]], ld: [{ '@type': $q.aS, name: $q.bE, url: ORIGIN + $q.bF, license: $t.k10, creator: { '@type': $q.aT, name: $q.p, url: ORIGIN + '/' }, dateModified: R.generated, isBasedOn: ORIGIN + $q.bG }] });
}
const WSIZE = { s: { w: 360, h: 200 }, m: { w: 480, h: 320 }, l: { w: 680, h: 440 } };
async function widgetData(env) {
const ix = await N.data(env), ot = await file(env, $q.bH, 1800000);
let tr = null; try { tr = await (await import('./kbx_tr.js')).trData(env); } catch (e) { tr = null; }
return { ix, ot, tr };
}
function lateOf(ot, x) {
const p = ot && ot.projects && ot.projects[x.id]; if (!p || !p.first || /^done|completed/.test(p.s || '')) return null;
const ym = s => { const m = /^(\d{4})-(\d{2})/.exec(s || ''); return m ? +m[1] * 12 + (+m[2] - 1) : null; };
const now = ym(ot.as_of_month), f = ym(p.first); if (now == null || f == null) return null;
return now - f;
}
function widget(D, x, lang, theme, size) {
const c = D.ix.caseBy.get(x.id) || {}, rev = N.reviewed(c), ho = N.handoverOf(D.ix, x), lm = lateOf(D.ot, x), row = D.tr && D.tr.rows && D.tr.rows.get(x.id);
const P = pre(lang), url = ORIGIN + P + $q.aq + x.s + '/', place = [x.ar && x.ar !== x.mk ? x.ar : null, mkName(x.mk, lang), x.co !== x.mk ? coName(x.co, lang) : null].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', ');
const rows = [];
rows.push([t(lang, 'w_ho'), ho ? esc(N.fd(ho.d, lang)) + (lm > 0 ? $q.bI + esc(t(lang, $q.bJ, { m: lm })) + $q.U : '') : esc(t(lang, 'w_np'))]);
rows.push([t(lang, 'w_pm'), x.pn ? $q.bK + esc(x.pn) + $q.bL : (c.checks || {}).permit === 2 ? esc(t(lang, 'w_st')) : esc(t(lang, 'w_np'))]);
if (size !== 's') { rows.push([t(lang, 'w_dv'), x.dv ? '<bdi>' + esc(x.dv) + $q.bM : esc(t(lang, 'w_np'))]); if (rev) rows.push([t(lang, 'w_ck'), esc(t(lang, 'w_cks', { s: c.score || 0 }))]); }
if (size === 'l') { if (row && row.score != null) rows.push([t(lang, 'w_tr'), esc(num(row.score, lang)) + '/100']); const sha = x.sha || (c.fp || {}).sha256, sd = x.sealed || (c.fp || {}).date; if (sha && sd) rows.push([t(lang, $q.bN, { d: N.fd(sd, lang) }), $q.bO + esc(String(sha).slice(0, 16)) + $q.bP]); }
const dark = $t.k11, light = $t.k12;
const css = $q.bQ + (theme === 'dark' ? dark : light + (theme === 'auto' ? $q.bR + dark + '}' : '')) + $t.k13 + (size === 's' ? 14 : 15) + $t.k14 +
$s.k2 + WSIZE[size].w + $t.k15 + (size === 'l' ? 18 : 16) + $s.k3 +
$s.k4 +
$s.k5;
const body = $q.bS + url + $q.bT + esc(x.n) + $q.bU + esc(place) + '</p>' + (rev ? '' : $q.bV + esc(t(lang, 'w_nr')) + '</p>') +
'<dl>' + rows.map(r => '<dt>' + esc(r[0]) + $q.bW + r[1] + '</dd>').join('') + $q.bX + esc(t(lang, 'w_up', { d: N.fd(N.lastmod(D.ix, x), lang) })) + $q.bY + url + $q.bT + esc(t(lang, $q.bZ)) + $q.ca;
return $s.k6 + lang + $q.cb + lang + '"' + (lang === 'ar' ? $q.cc : '') + $s.k7 + url + $q.cd + esc(x.n) + $q.ce + css + $q.cf + body + $q.cg;
}
async function widgetBuilder(u, env, shell, lang) {
const ix = await N.data(env), P = pre(lang);
let p = String(u.searchParams.get('p') || '').toLowerCase(); let x = ix.bySlug.get(p);
if (!x || COI_RX.test(String(x.n) + ' ' + String(x.dv))) { x = ix.bySlug.get($q.ch) || ix.P[0]; p = x.s; }
const opt = (n, L, sel) => $q.ci + n + $q.cj + n + '">' + L.map(([v, l]) => $q.ck + v + '"' + (v === sel ? $q.cl : '') + '>' + esc(l) + $q.cm).join('') + $q.cn;
const th = /^(light|dark|auto)$/.test(u.searchParams.get('th')) ? u.searchParams.get('th') : 'auto', sz = /^[sml]$/.test(u.searchParams.get('sz')) ? u.searchParams.get('sz') : 'm', lg = LANGS.includes(u.searchParams.get('lg')) ? u.searchParams.get('lg') : lang;
const LN = { en: $q.co, es: $q.cp, fr: $q.cq, de: $q.cr, nl: $q.cs, ru: $q.ct, zh: '中文', ar: $q.cu };
const body = $q.cv + esc(JSON.stringify({ p, cp: t(lang, 'w_cp'), ok: t(lang, 'w_ok') })) + $q.cw +
$q.cx + esc(t(lang, 'w_p')) + $t.k16 + esc(x.n) + $q.cy + esc(t(lang, 'w_ph')) + $t.k17 +
$q.cz + esc(t(lang, 'w_th')) + $q.U + opt('th', [['auto', t(lang, $q.cA)], ['light', t(lang, $q.cB)], ['dark', t(lang, $q.cC)]], th) + $q.cD +
$q.cE + esc(t(lang, 'w_sz')) + $q.U + opt('sz', [['s', t(lang, 'w_s') + $q.cF], ['m', t(lang, 'w_m') + $q.cG], ['l', t(lang, 'w_l') + $q.cH]], sz) + $q.cD +
$q.cI + esc(t(lang, 'w_lg')) + $q.U + opt('lg', LANGS.map(l => [l, LN[l]]), lg) + $q.cJ +
'<h2>' + esc(t(lang, 'w_pv')) + $t.k18 + x.s + $q.cK + th + $q.cL + sz + (lg !== 'en' ? $q.cM + lg : '') + $t.k19 + WSIZE[sz].h + $t.k20 + WSIZE[sz].w + $q.cN +
'<h2>' + esc(t(lang, 'w_c1')) + $t.k21 + esc(t(lang, 'w_c1')) + $s.k8 + esc(t(lang, 'w_cp')) + $q.cO +
'<h2>' + esc(t(lang, 'w_c2')) + $t.k22 + esc(t(lang, 'w_c2')) + $s.k9 + esc(t(lang, 'w_cp')) + $q.cO +
$q.aG + esc(t(lang, 'w_lic')) + $t.k23 + esc(t(lang, $q.cP)) + $q.cQ + x.s + $q.cR + x.s + $q.cS +
$s.k10 +
$s.k11 +
$q.cT + $s.BUILDER_JS + $q.cU;
return shellPage(shell, lang, { title: t(lang, 'w_t'), h1: t(lang, 'w_t'), lead: t(lang, $q.cV), desc: t(lang, 'w_d'), canon: ORIGIN + P + $q.cW, alt: l => ORIGIN + pre(l) + $q.cW, body, crumb: [[$q.cX, t(lang, $q.cY)]] });
}
async function measure(ctx) {
const ck = new Request(ORIGIN + $q.cZ);
try { const hit = await caches.default.match(ck); if (hit) return await hit.json(); } catch (e) {}
const H = { 'user-agent': $q.da, accept: $q.db }, js = new Map();
const pages = await Promise.all($t.o_TEMPLATES.map(async ([k, p]) => {
const t0 = Date.now(); let r; try { r = await fetch(ORIGIN + p, { headers: H }); } catch (e) { return { k, p, ok: false }; }
const html = await r.text(), ms = Date.now() - t0;
const S = [...html.matchAll(/<script\b[^>]*\bsrc="(\/[^"]+)"/g)].map(m => m[1]).filter(s => !/^\/\//.test(s));
return { k, p, ok: r.ok, status: r.status, ms, html: new TextEncoder().encode(html).length, scripts: S };
}));
for (const pg of pages) for (const s of pg.scripts || []) if (!js.has(s)) js.set(s, null);
await Promise.all([...js.keys()].slice(0, 30).map(async s => { try { const r = await fetch(ORIGIN + s, { headers: { 'user-agent': $q.da } }); if (r.ok) js.set(s, (await r.arrayBuffer()).byteLength); } catch (e) {} }));
const out = { at: new Date().toISOString(), pages: pages.map(pg => Object.assign({}, pg, { js: (pg.scripts || []).reduce((a, s) => a + (js.get(s) || 0), 0), n: (pg.scripts || []).length, scripts: undefined })) };
try { ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(out), { headers: { 'content-type': $q.aW, 'cache-control': $q.dc } }))); } catch (e) {}
return out;
}
async function engStatus(u, env, ctx, shell, lang) {
const P = pre(lang), K = await import('./kolaboro.js');
const sj = async p => { try { const r = await fetch(ORIGIN + p, { headers: { 'user-agent': $q.da } }); return r.ok ? await r.json() : null; } catch (e) { return null; } };
const [up, sw, dep, bld, wt] = await Promise.all([K.rpc($q.dd, {}).then(d => d && !d.error ? d : null).catch(() => null), sj($q.de), file(env, $q.df, 300000), file(env, $q.dg, 300000), measure(ctx).catch(() => null)]);
const na = $q.aG + esc(t(lang, 'es_na')) + '</p>', ms = v => v == null ? '-' : num(Math.round(v), lang) + ' ms';
let b = $q.dh;
if (up) b += $q.di + num(up.uptime_7d, lang, 3) + $q.dj + esc(t(lang, 'es_up')) + $q.dk;
const swMs = sw && (sw.pages || []).filter(p => p.ms != null).map(p => p.ms);
if (up && up.median_ms_7d != null) b += $q.di + ms(up.median_ms_7d) + $q.dl + esc(t(lang, $q.dm)) + $q.aD + ms(up.p95_ms_7d) + $q.dn + esc(t(lang, $q.do)) + $q.dp;
const D30 = dep && (dep.deploys || []).filter(d => d.at && Date.now() - Date.parse(d.at) < 30 * 864e5), W = D30 ? D30.filter(d => typeof d.wait_s === $q.dq && d.result === 'pass').map(d => d.wait_s) : [];
if (W.length) b += $q.di + num(Math.round(quant(W, .5)), lang) + $q.dr + esc(t(lang, $q.ds)) + $q.dt;
b += $q.k;
b += $q.du + esc(t(lang, 'es_up')) + '</h2>';
if (up) {
const n7 = Object.values(up.by_vantage || {}).reduce((a, v) => a + (v.probes_7d || 0), 0), inc = up.incidents || [];
b += '<p>' + esc(t(lang, $q.dv, { u: num(up.uptime_7d, lang, 3), n: num(n7, lang), u30: num(up.uptime_30d, lang, 3), md: num(Math.round(up.median_ms_7d || 0), lang), p95: num(Math.round(up.p95_ms_7d || 0), lang) })) + '</p>' +
$t.k24 + esc(t(lang, 'es_vt')) + $q.K + esc(t(lang, 'es_pr')) + $q.K + esc(t(lang, 'es_ut')) + $q.K + esc(t(lang, 'es_md')) + $q.L +
Object.entries(up.by_vantage || {}).map(([k, v]) => $q.dw + esc(k === $q.dx ? t(lang, $q.dy) : k === $q.dz ? t(lang, $q.dA) : k) + $q.dB + num(v.probes_7d || 0, lang) + $q.N + num(v.uptime_7d, lang, 3) + $q.dC + ms(v.median_ms_7d) + $q.O).join('') + $q.al +
$q.aG + esc(t(lang, $q.dD, { n: num(inc.length, lang), l: inc[0] ? ftime(inc[0].at, lang) + ' (' + inc[0].target + $q.dE + inc[0].status + ')' : '-' })) + $t.k25;
} else b += na;
b += $q.dF + esc(t(lang, $q.dG)) + '</h2>';
if (sw && sw.pages) {
b += '<p>' + esc(t(lang, $q.dH, { t: ftime(sw.at, lang), c: sw.commit || '-', up: num(sw.up || 0, lang), n: num(sw.n || 0, lang), p50: num(Math.round(quant(swMs, .5) || 0), lang), p95: num(Math.round(quant(swMs, .95) || 0), lang) })) + '</p>' +
$t.k26 + esc(t(lang, 'es_pg')) + $q.K + esc(t(lang, 'es_hs')) + $q.K + esc(t(lang, 'es_ms')) + $q.K + esc(t(lang, 'es_kb')) + $q.L +
sw.pages.map(p => $q.ah + esc(p.p) + $q.dI + esc(p.p) + $q.dJ + esc(p.status) + $q.N + ms(p.ms) + $q.N + kb(p.bytes) + $q.O).join('') + $q.al +
$s.k12 + swMs.length + '</p>';
} else b += na;
b += $q.dK + esc(t(lang, $q.ds)) + '</h2>';
if (dep && dep.deploys) {
const A = dep.deploys, ok = A.filter(d => d.result === 'pass').length, rb = A.filter(d => d.result === $q.dL).length, Wa = A.filter(d => typeof d.wait_s === $q.dq && d.result === 'pass').map(d => d.wait_s), first = A.reduce((m, d) => !m || d.at < m ? d.at : m, null);
b += '<p>' + esc(t(lang, $q.dM, { n: num(A.length, lang), s: fdt(first, lang), ok: num(ok, lang), rb: num(rb, lang), p50: num(Math.round(quant(Wa, .5) || 0), lang), p95: num(Math.round(quant(Wa, .95) || 0), lang) })) + $t.k27;
} else b += na;
if (bld && bld.builds && bld.builds.length) {
const L = bld.builds.slice().sort((a, c) => String(c.built_at).localeCompare(String(a.built_at))), x = L[0];
b += '<p>' + esc(t(lang, $q.dN, { b: (x.bytes / 1048576).toFixed(1) + ' MB', d: fdt(x.built_at, lang), r: t(lang, x.reproduced ? $q.dO : $q.dP), k: num(L.length, lang) })) + $t.k28;
}
b += $q.dQ + esc(t(lang, 'es_w')) + '</h2>';
if (wt && wt.pages) {
b += '<p>' + esc(t(lang, 'es_w1')) + ' ' + esc(t(lang, 'es_at', { t: ftime(wt.at, lang) })) + $t.k29 + esc(t(lang, 'es_tp')) + $q.K + esc(t(lang, $q.dR)) + $q.K + esc(t(lang, 'es_js')) + $q.K + esc(t(lang, 'es_n')) + $q.K + esc(t(lang, $q.dS)) + $q.K + esc(t(lang, 'es_ms')) + $q.L +
wt.pages.map(p => $q.ah + esc(p.p) + '">' + esc(t(lang, p.k)) + $q.aj + kb(p.html) + $q.N + kb(p.js) + $q.N + num(p.n || 0, lang) + $q.N + kb((p.html || 0) + (p.js || 0)) + $q.N + ms(p.ms) + $q.O).join('') + $q.al;
} else b += na;
try { b += await (await import('./kbx_n34c.js')).statusBlock(env, lang); } catch (e) {}
try { b += await (await import('./kbx_n35b.js')).incidentsHtml(env, lang); } catch (e) {}
b += $q.aG + esc(t(lang, $q.dT)) + $s.k13;
const r = await shellPage(shell, lang, { title: t(lang, 'es_t'), h1: t(lang, 'es_t'), lead: t(lang, $q.dU), desc: t(lang, 'es_d'), canon: ORIGIN + P + $q.dV, alt: l => ORIGIN + pre(l) + $q.dV, body: b, crumb: [[$q.dW, t(lang, $q.dX)]] });
if (r) { const h = new Headers(r.headers); h.set($q.dY, $q.dZ); return new Response(r.body, { status: 200, headers: h }); }
return r;
}
export const mapStrings = lang => { const o = {}; ['mh_cl', $q.ea, $q.eb, 'mpk', 'mpa', 'mpo', 'mpe', 'mpr', 'mp0', 'mps'].forEach(k => { o[k] = t(lang, k); }); return o; };
export { t as t30 };
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname;
if (p === $q.ec) return new Response(null, { status: 301, headers: { location: $q.ed, 'cache-control': $q.ee } });
if (p === $q.ef) return new Response($s.LOADER, { headers: { 'content-type': $q.eg, 'cache-control': $q.ee, 'access-control-allow-origin': '*', 'x-content-type-options': $q.eh } });
let m = /^\/api\/v1\/pin\/([A-Za-z0-9-]{3,20})$/.exec(p);
if (m) {
const ix = await N.data(env), x = ix.byId.get(m[1].toUpperCase()) || ix.bySlug.get(m[1].toLowerCase()); if (!x) return jr({ error: $q.ei }, 404);
const L = await import('./kbx_land.js'), ld = await L.landData(env), r = pinRecord(ld, x);
return jr(Object.assign({ about: $s.k14, project: ORIGIN + $q.aq + x.s + '/' }, r || { id: x.id, note: $t.k30 }), 200, $q.ee);
}
m = /^\/embed\/v2\/([a-z0-9-]{1,90})\/?$/.exec(p);
if (m) {
if (!p.endsWith('/')) return Response.redirect(ORIGIN + p + '/' + u.search, 301);
const D = await widgetData(env), x = D.ix.bySlug.get(m[1]);
if (!x || COI_RX.test(String(x.n) + ' ' + String(x.dv))) return new Response($q.ej, { status: 404, headers: { 'content-type': $q.ek } });
const lang = LANGS.includes(u.searchParams.get('lang')) ? u.searchParams.get('lang') : 'en', th = /^(light|dark|auto)$/.test(u.searchParams.get('theme')) ? u.searchParams.get('theme') : 'auto', sz = /^[sml]$/.test(u.searchParams.get('size')) ? u.searchParams.get('size') : 'm';
return new Response(widget(D, x, lang, th, sz), { headers: { 'content-type': $q.el, 'cache-control': $q.em, 'content-security-policy': $t.k31, 'x-content-type-options': $q.eh, 'referrer-policy': $q.en } });
}
m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(prices\/history(?:\/([a-z0-9-]{2,60}))?|watch\/lookalikes\/images|tools\/widget|engineering\/status)\/?$/.exec(p);
if (!m) return null;
if (!p.endsWith('/')) return Response.redirect(ORIGIN + p + '/' + u.search, 301);
const lang = m[1] || 'en', what = m[2];
try {
if (/^prices\/history/.test(what)) return await priceHistory(u, env, shell, lang, m[3] || null);
if (what === $q.eo) return await imageReuse(u, env, shell, lang);
if (what === $q.ep) return await widgetBuilder(u, env, shell, lang);
if (what === $q.eq) return await engStatus(u, env, ctx, shell, lang);
} catch (e) { return null; }
return null;
}
export { slugMk };
