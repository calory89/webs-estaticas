// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_n35b__q, $s = TB.kbx_n35b__s, $t = TB.kbx_n35b__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import * as N from './kbx_named.js';
import { light6, t27 } from './kbx_u27.js';
import { coName, mkName } from './kbx_hdate.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const V = 'b1';
const COI = /eco\s*beach|\bequinox\b|\bsumba\b/i;
const MEMO = {};
function file(e, p, t) { return FQ[p] || (FQ[p] = file0(e, p, t).finally(() => { delete FQ[p]; })); }   // n40 k21: one shared read per file
const FQ = {};
async function file0(env, p, ttl) {
const m = MEMO[p]; if (m && m.v && Date.now() - m.t < (ttl || 600000)) return m.v;
let v = null;
try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.b + p)); if (r.ok) v = await r.json(); } catch (e) { v = null; }
if (!v) { try { const r = await fetch(ORIGIN + p, { cf: { cacheTtl: 600 } }); if (r.ok) v = await r.json(); } catch (e) { v = null; } }
MEMO[p] = { t: Date.now(), v }; return v;
}
let T = null;
const loadT = async env => T || (T = await file(env, $q.c, 864e5));
export const ready = loadT;
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.d, "'": '&#39;' }[c]));
const t = (l, k) => { const a = T && T[l] && T[l][k]; return a != null ? a : T && T.en && T.en[k] != null ? T.en[k] : ''; };
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
const tf = (l, k, v) => fill(t(l, k), v || {});
export const tx = tf;
const nf = (n, l, d) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { maximumFractionDigits: d == null ? 0 : d, numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
const fdt = (d, l) => { if (!d) return ''; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: $q.e, month: 'short', year: $q.e, timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(String(d).slice(0, 10) + $q.f)); } catch (e) { return String(d).slice(0, 10); } };
const dirA = l => l === 'ar' ? $q.g : '';
const okX = x => x && !COI.test([x.n, x.dv, x.mk, x.ar].join(' '));
const LP = '(?:(es|de|fr|nl|ru|zh|ar)\\/)?';
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:developers\/compare|tools\/(?:vault|price-per-m2)|projects\/[a-z0-9-]{1,90}\/journey)\/?$/;
const RX = { dc: new RegExp('^\\/' + LP + 'developers\\/compare(\\/?)$'), vt: new RegExp('^\\/' + LP + 'tools\\/vault(\\/?)$'), pm: new RegExp('^\\/' + LP + 'tools\\/price-per-m2(\\/?)$'), bj: new RegExp('^\\/' + LP + 'projects\\/([a-z0-9-]{1,90})\\/journey(\\/?)$') };
const ALL = [['dc_t', '/developers/compare/'], ['pm_t', '/tools/price-per-m2/'], ['vt_t', '/tools/vault/'], ['l_cr', '/tools/contract-reader/'], ['l_my', '/tools/my-checklist/', 1]];
function rel(l, k) {
const L = ALL.filter(a => a[0] !== k);
return $q.h + esc(t(l, 'also')) + $q.i + esc(t(l, 'also')) + $q.j + L.map(a => $q.k + (a[2] ? '' : pre(l)) + a[1] + '">' + esc(t(l, a[0])) + $q.l).join('') + $q.m;
}
async function page(shell, l, o) {
  const canon = ORIGIN + pre(l) + o.path;
  const crumbs = [[t(l, 'home'), pre(l) + '/']].concat(o.crumb || []).concat([[o.h1, null]]);
  const body = $q.n + dirA(l) + $q.o + crumbs.map(c => c[1] ? $q.p + esc(c[1]) + '">' + esc(c[0]) + '</a>' : esc(c[0])).join(' / ') + $q.q + esc(o.h1) + $q.r + esc(o.lead) + '</p>' +
    (o.updated ? $q.s + esc(tf(l, 'upd', { d: fdt(o.updated, l) })) + '</p>' : '') + $q.t + dirA(l) + '>' + $q.a + o.body + (o.k ? rel(l, o.k) : '') + $q.u;
  const ld = { '@context': $q.v, '@graph': [{ '@type': o.type || $q.w, url: canon, name: o.h1, description: o.lead, inLanguage: l, dateModified: o.updated || $q.x, isPartOf: { '@type': $q.y, name: $q.z, url: ORIGIN + '/' } },
    { '@type': $q.A, itemListElement: crumbs.map((c, i) => ({ '@type': $q.B, position: i + 1, name: c[0], item: c[1] ? ORIGIN + c[1] : canon })) }] };
  const desc = o.lead.length > 155 ? o.lead.slice(0, 152).replace(/\s+\S*$/, '') + '…' : o.lead, title = o.title || o.h1;
  let html = await N.assemble({ title: (title.length > 56 ? title.slice(0, 56).replace(/\s+\S*$/, '') : title) + $q.C, desc, canon, body, ld, alt: x => ORIGIN + pre(x) + o.path }, l, await shell(pre(l) + $q.D));
  if (o.noindex) html = html.replace($q.E, $q.F);
  const h = { 'content-type': $q.G, 'cache-control': $q.H + (o.maxAge || 900), 'content-language': l };
  if (o.noindex) h[$q.I] = $q.J;
  return new Response(html, { status: 200, headers: h });
}
const median = v => { if (!v.length) return null; const s = [...v].sort((a, b) => a - b), n = s.length; return n % 2 ? s[n >> 1] : (s[n / 2 - 1] + s[n / 2]) / 2; };
let CC = null;
async function courts(env) { if (CC) return CC; const j = await file(env, $q.K, 864e5); CC = (j && j.cases) || []; return CC; }
function devFacts(ix, dv, cc) {
const L = dv.ids.map(i => ix.byId.get(i)).filter(okX), n = L.length;
const st = { o: 0, u: 0, c: 0 }, mk = new Map(); let wd = 0, past = 0, pm = 0; const mv = [], ov = [];
for (const x of L) {
const c = ix.caseBy.get(x.id) || {}, s = String(c.stage || x.st || '');
if (/completed/.test(s)) st.c++; else if (/construction/.test(s)) st.u++; else if (/off/.test(s)) st.o++;
mk.set(x.mk, (mk.get(x.mk) || 0) + 1);
if (N.handoverOf(ix, x)) wd++;
if (+c.overdue > 0) { past++; ov.push(+c.overdue); }
if (x.pn) pm++;
const h = (ix.prom[x.id] || []).find(p => p.k === $q.L); if (h && (h.mv || 0) > 0) mv.push(+h.mm || 0);
}
const sl = new Set(L.map(x => x.s)), cases = cc.filter(c => c.dev === dv.s || (c.project && sl.has(c.project)));
return { dv, n, st, mk: [...mk.entries()].sort((a, b) => b[1] - a[1]), wd, past, ov, pm, mv, cases };
}
async function dcPage(env, shell, l, u) {
const ix = await N.data(env), cc = await courts(env), P = pre(l);
const opts = [...ix.devs.values()].filter(d => d.ids.length >= 2 && okX({ n: d.n, dv: d.n })).sort((a, b) => b.ids.length - a.ids.length || a.n.localeCompare(b.n));
const byName = new Map(opts.map(d => [d.n.toLowerCase(), d.s]));
let want = (u.searchParams.get('d') || '').split(',').concat(['d1', 'd2', 'd3', 'd4'].map(k => u.searchParams.get(k) || '')).map(s => s.trim().toLowerCase()).map(s => byName.get(s.replace(/\s*\(\d+\)$/, '')) || s).filter(s => /^[a-z0-9-]{1,90}$/.test(s));
want = [...new Set(want)].filter(s => ix.devs.has(s) && okX({ n: ix.devs.get(s).n })).slice(0, 4);
const custom = want.length >= 1; if (want.length < 2) want = want.concat(opts.map(d => d.s).filter(x => !want.includes(x))).slice(0, 3);
const F = want.map(s => devFacts(ix, ix.devs.get(s), cc));
const sel = i => $q.M + i + '">' + esc(tf(l, $q.N, { i: i + 1 })) + $q.O + i + $q.P + (i + 1) + $t.k0 + (want[i] ? esc(ix.devs.get(want[i]).n) : '') + $q.Q;
const dl = $q.R + opts.map(d => $q.S + esc(d.n) + '">').join('') + $q.T;
const of = (a, b) => esc(tf(l, 'dc_of', { a: nf(a, l), b: nf(b, l) }));
const rows = [
[$q.U, f => nf(f.n, l)],
['dc_mk', f => f.mk.slice(0, 6).map(([m, k]) => $q.V + encodeURIComponent(m.toLowerCase().replace(/\s+/g, '-')) + '/">' + esc(mkName(m, l)) + $q.W + k + ')').join(', ') + (f.mk.length > 6 ? ' +' + (f.mk.length - 6) : '')],
[$q.X, f => nf(f.st.o, l) + ' / ' + nf(f.st.u, l) + ' / ' + nf(f.st.c, l)],
[$q.Y, f => of(f.wd, f.n)],
[$q.Z, f => of(f.mv.length, f.n) + (f.mv.length ? $q.aa + esc(tf(l, $q.ab, { m: nf(median(f.mv), l, 1) })) + $q.ac : '')],
[$q.ad, f => of(f.past, f.wd) + (f.ov.length ? $q.aa + esc(tf(l, $q.ab, { m: nf(median(f.ov), l, 1) })) + $q.ac : '')],
['dc_pm', f => of(f.pm, f.n)],
['dc_cc', f => nf(f.cases.length, l) + (f.cases.length ? $q.aa + f.cases.slice(0, 4).map(c => $q.p + esc(c.src) + $t.k1 + esc(c.no) + '</a>').join(', ') + $q.ac : '')]];
const tbl = $t.k2 + esc(t(l, 'dc_t')) + $q.ae + esc(t(l, 'dc_th')) + '</th>' + F.map(f => $q.af + P + $q.ag + f.dv.s + '/">' + esc(f.dv.n) + $q.ah).join('') + $q.ai +
rows.map(([k, fn]) => $q.aj + esc(t(l, k)) + '</th>' + F.map(f => $q.ak + fn(f) + '</td>').join('') + '</tr>').join('') + $q.al;
const upd = String(ix.updated || '').slice(0, 10);
const b = $t.k3 + P + $q.am + [0, 1, 2, 3].map(sel).join('') + dl + $q.an + esc(t(l, 'dc_go')) + $q.ao + esc(t(l, $q.ap)) + '</p>' +
tbl + $q.aq + esc(tf(l, $q.ar, { d: fdt(upd, l) })) + $q.as + esc(t(l, 'hist')) + $s.k0;
const names = F.map(f => f.dv.n).join(', ');
return page(shell, l, { k: 'dc_t', path: $q.at, h1: custom ? tf(l, $q.au, { a: names }) : t(l, 'dc_t'), title: custom ? tf(l, $q.au, { a: names }) : t(l, 'dc_t'), lead: t(l, 'dc_l'), body: b, updated: upd, noindex: custom, crumb: [[t(l, $q.av), P + $q.ag]], type: $q.w });
}
async function bjPage(env, shell, l, x) {
const ix = await N.data(env), P = pre(l), c = ix.caseBy.get(x.id) || {}, ho = N.handoverOf(ix, x);
const [M, TR] = await Promise.all([file(env, $q.aw), import('./kbx_tr.js').then(m => m.trProject(env, x.id, l)).catch(() => null)]);
const mk = ((M && M.markets) || []).find(m => m.market === x.mk) || null, regs = mk ? mk.registers || [] : [];
const L6 = light6({ tp: TR, c, pn: x.pn, ho, ev: x.ev, ids: [] }), it = {}; for (const i of ((TR && TR.items) || [])) it[i.k] = i.st;
const say = a => a.filter(Boolean).length ? $q.ax + esc(t(l, $q.ay)) + $q.az + a.filter(Boolean).join(' ') + '</p>' : '';
const lk = (k, h) => $q.p + esc(h) + '">' + esc(t(l, k)) + '</a>';
const regL = (f) => { const R = regs.filter(f); return R.length ? esc(tf(l, 'r_reg', { m: mkName(x.mk, l) })) + ' ' + R.map(r => $q.p + esc(r.url) + $t.k4 + esc(r.name) + $q.aA).join(', ') + '.' : ''; };
const st = k => L6.find(p => p[0] === k)[2];
const pm = mk && mk.past_date && mk.past_date.n >= 3 ? esc(tf(l, 'r_mk', { m: mkName(x.mk, l), n: nf(mk.past_date.n, l), k: nf(mk.past_date.median, l, 1) })) : '';
const hm = (ix.prom[x.id] || []).find(p => p.k === $q.L);
const S = [
['s1', [x.pn ? esc(tf(l, 'r_pn', { v: $q.aB })).replace($q.aB, '<bdi>' + esc(x.pn) + $q.aC) : esc(t(l, 'r_pn0')), esc(tf(l, 'r_co', { s: t27(l, st($q.aD)[1], st($q.aD)[2]) })), regL(r => (r.checks || []).some(k => /permit|licen|company/.test(k)))], [lk('l_q', P + $q.aE + x.s + $q.aF)]],
['s2', [it.deposit === 'yes' ? esc(t(l, 'r_dep')) : it.deposit ? esc(t(l, $q.aG)) : '', regL(r => (r.checks || []).some(k => /escrow|deposit/.test(k)))], []],
['s3', [], [lk('l_cr', P + $q.aH), lk($q.aI, P + $q.aJ)]],
['s4', [regL(r => (r.checks || []).some(k => /title|sale/.test(k)))], []],
['s5', [], [lk('l_pvp', $q.aK)]],
['s6', [esc(tf(l, $q.aL, { s: t27(l, st('build')[1], st('build')[2]) }))], [lk($q.aM, P + $q.aE + x.s + $q.aN), lk('l_sat', P + $q.aE + x.s + $q.aO)]],
['s7', [ho ? esc(tf(l, 'r_ho', { d: N.fd(ho.d, l) })) : esc(t(l, 'r_ho0')), +c.overdue > 0 ? esc(tf(l, 'r_ov', { m: nf(+c.overdue, l) })) : '', hm && hm.mv > 0 && hm.mm > 0 ? esc(tf(l, 'r_mv', { m: nf(hm.mm, l) })) : '', pm], []],
['s8', [], [lk($q.aP, $q.aQ)]],
['s9', [], []]];
const b = $t.k5 + esc(x.id) + $t.k6 + esc(t(l, 'bj_n')) + $t.k7 + esc(t(l, $q.aR)) + $t.k8 + esc(t(l, $q.aS)) + $q.aT +
S.map(([k, rec, links], i) => $t.k9 + (i + 1) + $q.aU + esc(t(l, k)) + $q.aV + esc(t(l, k + 'd')) + '</p>' + say(rec) + (links.length ? $q.aW + links.join(' · ') + '</p>' : '') + '</li>').join('') + $q.aX +
$q.aq + lk($q.aY, P + $q.aE + x.s + '/') + ' · ' + lk('l_my', $q.aZ) + ' · ' + esc(t(l, 'hist')) + '</p>' +
$s.k1 +
$s.k2 +
$s.k3 +
$s.k4 +
$t.k10;
return page(shell, l, { path: $q.aE + x.s + $q.ba, h1: tf(l, 'bj_t', { n: x.n }), lead: tf(l, 'bj_l', { n: x.n }), body: b, updated: N.lastmod(ix, x), noindex: true, crumb: [[t(l, $q.bb), P + $q.aE], [x.n, P + $q.aE + x.s + '/']] });
}
const VK = ['c_new', 'c_open', 'c_pp', 'c_pp2', 'c_ppw', 'c_bad', 'c_mis', 'c_short', 'c_add', 'c_drop', 'c_empty', 'c_name', 'c_size', 'c_added', 'c_view', 'c_dl', 'c_cr', 'c_del', 'c_delq', 'c_lock', 'c_exp', 'c_imp', 'c_impok', 'c_impbad', 'c_wipe', 'c_wipeq', 'c_busy', 'c_n', 'c_nosup', 'c_locked', 'c_big', 'c_act'];
async function vtPage(env, shell, l) {
const S = Object.fromEntries(VK.map(k => [k, t(l, k)])); S._loc = LOC[l]; S._p = pre(l);
const b = $s.k5 + esc(t(l, $q.bc)) + $q.bd + esc(t(l, $q.be)) + $q.bf +
$t.k11 + JSON.stringify(S).replace(/</g, $q.bg) + $t.k12 + V + $q.bh;
return page(shell, l, { k: 'vt_t', path: $q.aJ, h1: t(l, 'vt_t'), lead: t(l, 'vt_l'), body: b, updated: $q.x, crumb: [[t(l, 'tools'), pre(l) + $q.bi]], type: $q.bj });
}
const wilson = (k, n) => { const z = 1.96, p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d; return [Math.max(0, c - h), Math.min(1, c + h)]; };
async function pmPage(env, shell, l, u) {
const D = ((await file(env, $q.bk)) || {}).ppm, P = pre(l), M = (D && D.markets) || [];
const ms = (u.searchParams.get('m') || '').toLowerCase(), m = M.find(x => x.slug === ms) || null;
const pr = parseFloat(String(u.searchParams.get('p') || '').replace(/[^\d.]/g, '')), sz = parseFloat(String(u.searchParams.get('s') || '').replace(/[^\d.]/g, ''));
const asked = !!(ms || u.searchParams.has('p'));
let res = '';
if (asked && m && pr > 0 && sz > 0) {
const v = pr / sz, n = m.n, lo = m.v.filter(a => a < v).length, eq = m.v.filter(a => a === v).length, k = lo + eq / 2, ci = wilson(k, n), pct = Math.round(k / n * 100);
const W = 640, H = 92, a = Math.min(m.v[0], v), z = Math.max(m.v[n - 1], v), sc = x => 16 + (Math.log(x) - Math.log(a)) / ((Math.log(z) - Math.log(a)) || 1) * (W - 32);
const svg = $q.bl + W + ' ' + H + $t.k13 + esc(tf(l, $q.bm, { p: pct, n: nf(n, l), m: mkName(m.market, l), a: Math.round(ci[0] * 100), b: Math.round(ci[1] * 100) })) + $q.bn + W + $q.bo +
$q.bp + sc(m.q1).toFixed(1) + $q.bq + Math.max(2, sc(m.q3) - sc(m.q1)).toFixed(1) + $t.k14 +
m.v.map(x => $q.br + sc(x).toFixed(1) + $q.bs + sc(x).toFixed(1) + $t.k15).join('') +
$q.br + sc(m.median).toFixed(1) + $q.bs + sc(m.median).toFixed(1) + $t.k16 +
$q.bt + sc(v).toFixed(1) + $t.k17 +
$t.k18 + esc(nf(m.v[0], l)) + $q.bu + (W - 16) + $t.k19 + esc(nf(m.v[n - 1], l)) + ' ' + esc(m.currency) + $q.bv;
res = $t.k20 + esc(tf(l, $q.bw, { v: nf(v, l), c: m.currency })) + $q.bx + esc(tf(l, $q.bm, { p: pct, n: nf(n, l), m: mkName(m.market, l), a: Math.round(ci[0] * 100), b: Math.round(ci[1] * 100) })) + $q.by + svg +
$q.s + esc(t(l, $q.bz)) + $q.bA + esc(tf(l, $q.bB, { v: nf(m.median, l), c: m.currency, a: nf(m.ci95[0], l), b: nf(m.ci95[1], l), q1: nf(m.q1, l), q3: nf(m.q3, l) })) + $q.bC;
} else if (asked) res = $q.bD + esc(t(l, $q.bE)) + '</p>';
const opt = M.map(x => $q.S + x.slug + '"' + (m && m.slug === x.slug ? $q.bF : '') + '>' + esc(mkName(x.market, l)) + ' (' + x.currency + ', ' + x.n + $q.bG).join('');
const b = $t.k21 + P + $t.k22 + esc(t(l, 'pm_mk')) + $q.bH + opt + $q.bI +
$q.bJ + esc(t(l, 'pm_p')) + (m ? ' (' + esc(m.currency) + ')' : '') + $t.k23 + (pr > 0 ? esc(pr) : '') + $q.Q +
$q.bK + esc(t(l, 'pm_s')) + $t.k24 + (sz > 0 ? esc(sz) : '') + $t.k25 + esc(t(l, 'pm_go')) + $q.bL + res +
$q.aq + esc(tf(l, $q.bM, { d: fdt(D && D.built, l) })) + ' ' + esc(t(l, $q.bN)) + $t.k26 +
'<h2>' + esc(t(l, $q.bO)) + $t.k27 + esc(t(l, $q.bO)) + $q.ae + esc(t(l, 'pm_mk')) + $q.bP + esc(t(l, $q.bQ)) + $q.bP + esc(t(l, $q.bR)) + $q.bP + esc(t(l, $q.bS)) + $q.bT +
M.map(x => $q.bU + P + $q.bV + x.slug + '">' + esc(mkName(x.market, l)) + $q.bW + nf(x.n, l) + $q.bX + nf(x.median, l) + ' ' + esc(x.currency) + $q.bX + nf(x.ci95[0], l) + ' – ' + nf(x.ci95[1], l) + $q.bY).join('') + $q.al +
$s.k6 + M.map(x => '"' + x.slug + '":"' + x.currency + '"').join(',') + $s.k7;
return page(shell, l, { k: 'pm_t', path: $q.bZ, h1: t(l, 'pm_t'), lead: t(l, 'pm_l'), body: b, updated: D && D.built, noindex: asked, crumb: [[t(l, 'tools'), P + $q.bi]], type: $q.bj, maxAge: 600 });
}
export async function incidentsHtml(env, l) {
await loadT(env); const D = ((await file(env, $q.bk)) || {}).incidents; if (!D || !T) return '';
const fdh = s => { if (!s) return ''; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: $q.e, month: 'short', hour: $q.ca, minute: $q.ca, hour12: false, timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(s.replace(/Z$/, ':00Z'))); } catch (e) { return s; } };
const dur = x => { if (!x.end) return '…'; const m = Math.round((Date.parse(x.end.replace(/Z$/, ':00Z')) - Date.parse(x.start.replace(/Z$/, ':00Z'))) / 60000); return m < 1 ? $q.cb : m < 120 ? m + ' min' : Math.round(m / 60) + ' h'; };
const S = D.summary || {};
return $q.cc + dirA(l) + '><h2>' + esc(t(l, 'in_h')) + $q.cd + esc(t(l, 'in_l')) + ' ' + esc(tf(l, $q.ce, { k: nf(S.last_30_days || 0, l), r: nf(S.rollbacks_30d || 0, l) })) + $q.cf + esc(t(l, $q.cg)) + $q.ch +
$t.k28 + esc(t(l, 'in_h')) + $q.ae + esc(t(l, $q.ci)) + $q.bP + esc(t(l, $q.cj)) + $q.bP + esc(t(l, $q.ck)) + $q.bP + esc(t(l, $q.cl)) + $q.bP + esc(t(l, $q.cm)) + $q.bT +
(D.incidents || []).map(x => $q.cn + esc(x.id) + $q.co + esc(x.start.replace(/Z$/, ':00Z')) + '">' + esc(fdh(x.start)) + $q.cp + esc(x.kind) + $q.cq + esc(x.what) + $q.cr + esc(x.impact) + $q.cs + dur(x) + $q.cr + esc(x.fix) +
((x.commits || []).filter(Boolean).length ? $q.ct + x.commits.filter(Boolean).map(c => $q.cu + esc(c) + $q.cv).join(' ') + $q.ac : '') + $q.bY).join('') +
$t.k29 + esc(t(l, $q.cw)) + $s.k8;
}
export async function handle(req, u, env, ctx, shell) {
if (req.method !== 'GET' && req.method !== 'HEAD') return null;
await loadT(env); if (!T) return null;
const p = u.pathname; let m;
if ((m = p.match(RX.bj))) {
if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } });
const ix = await N.data(env), x = ix.bySlug.get(m[2]); if (!x || !okX(x)) return null;
return bjPage(env, shell, m[1] || 'en', x);
}
for (const [k, fn] of [['dc', dcPage], ['vt', vtPage], ['pm', pmPage]]) {
if ((m = p.match(RX[k]))) { if (!m[2]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } }); return fn(env, shell, m[1] || 'en', u); }
}
return null;
}
