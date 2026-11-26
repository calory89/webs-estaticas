// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_n34b__q, $s = TB.kbx_n34b__s, $t = TB.kbx_n34b__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import * as N from './kbx_named.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const V = 'b8';
const COI = /eco\s*beach|\bequinox\b|\bsumba\b/i;
let T = null;
async function loadT(env) {
if (T) return T;
try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.b)); if (r.ok) T = await r.json(); } catch (e) {}
if (!T) { try { const r = await fetch(ORIGIN + $q.c, { cf: { cacheTtl: 300 } }); if (r.ok) T = await r.json(); } catch (e) {} }
return T;
}
export async function ready(env) { return loadT(env); }
export const tx = (l, k, v) => fill(t(l, k), v || {});
export const QCSS = '<style>.n34-q{list-style:none;padding:0;margin:0 0 16px;counter-reset:q}.n34-q>li{counter-increment:q;padding:10px 0 10px 2.2em;border-bottom:1px solid var(--line,#d5d3cc);position:relative}.n34-q>li::before{content:counter(q);position:absolute;inset-inline-start:0;top:10px;width:1.7em;height:1.7em;border-radius:50%;border:1px solid var(--line,#d5d3cc);display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700}[dir=rtl] .n34-q>li{padding:10px 2.2em 10px 0}.n34-q b{display:block;font-weight:600}.n34-q small{display:block;color:var(--muted,#59626B);margin-top:4px}</style>';
const MEMO = {};
function file(e, p, t) { return FQ[p] || (FQ[p] = file0(e, p, t).finally(() => { delete FQ[p]; })); }   // n40 k21: one shared read per file
const FQ = {};
async function file0(env, p, ttl) {
const m = MEMO[p]; if (m && m.v && Date.now() - m.t < (ttl || 600000)) return m.v;
let v = null;
try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.d + p)); if (r.ok) v = await r.json(); } catch (e) { v = null; }
if (!v) { try { const r = await fetch(ORIGIN + p, { cf: { cacheTtl: 600 } }); if (r.ok) v = await r.json(); } catch (e) { v = null; } }
MEMO[p] = { t: Date.now(), v }; return v;
}
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.e, "'": '&#39;' }[c]));
const t = (l, k) => { const a = T && T[l] && T[l][k]; return a != null ? a : T && T.en && T.en[k] != null ? T.en[k] : ''; };
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
const tf = (l, k, v) => fill(t(l, k), v || {});
const nf = (n, l, d) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { maximumFractionDigits: d == null ? 0 : d, numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
const fd = (d, l) => { if (!d) return ''; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: $q.f, month: 'short', year: $q.f, timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(String(d).slice(0, 10) + $q.g)); } catch (e) { return String(d).slice(0, 10); } };
const bdi = (l, h) => l === 'ar' ? '<bdi>' + h + $q.h : h;
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const okName = x => x && !COI.test([x.n, x.dv, x.mk, x.ar].join(' '));
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const dirA = l => l === 'ar' ? $q.i : '';
const LP = '(?:(es|de|fr|nl|ru|zh|ar)\\/)?';
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:tools\/due-diligence|markets\/compare|search|projects\/[a-z0-9-]{1,90}\/questions)\/?$|^\/api\/v1\/projects\/[a-z0-9-]{1,90}\/questions$/;
const RX = { q: new RegExp('^\\/' + LP + 'projects\\/([a-z0-9-]{1,90})\\/questions(\\/?)$'), dd: new RegExp('^\\/' + LP + 'tools\\/due-diligence(\\/?)$'), mc: new RegExp('^\\/' + LP + 'markets\\/compare(\\/?)$'), se: new RegExp('^\\/' + LP + 'search(\\/?)$'), api: /^\/api\/v1\/projects\/([a-z0-9-]{1,90})\/questions$/ };
const ALL = [['se', '/search/'], ['dd', '/tools/due-diligence/'], ['mc', '/markets/compare/'], ['wl', '/watchlist/']];
const table = (th, rows, cap) => $q.j + (cap ? $q.k + esc(cap) + '"' : '') + $q.l + (cap ? $q.m + esc(cap) + $q.n : '') + $q.o + th.map(x => $q.p + esc(x) + '</th>').join('') + $q.q + rows.join('') + $q.r;
const rel = (l, skip) => '<h2>' + esc(t(l, 'more')) + $q.s + ALL.filter(x => x[0] !== skip).map(x => $q.t + (x[0] === 'wl' ? '' : pre(l)) + x[1] + '">' + esc(t(l, x[0] + '_t')) + $q.u).join('') + $q.t + pre(l) + $q.v + esc(t(l, 'tools')) + $q.w + esc(t(l, 'eng')) + $q.x;
const clientT = (l, k, keys) => $t.k0 + JSON.stringify(Object.assign({}, T.en['c_' + k] || {}, (T[l] && T[l]['c_' + k]) || {}, Object.fromEntries((keys || []).map(x => [x, t(l, x)])), { _l: l, _loc: LOC[l], _p: pre(l) })).replace(/</g, $q.y) + $q.z + k + $q.A + V + $q.B;
async function page(shell, l, o) {
  const canon = ORIGIN + pre(l) + o.path;
  const crumbs = [[t(l, 'home'), pre(l) + '/']].concat(o.crumb || []).concat([[o.h1, null]]);
  const body = $q.C + dirA(l) + $q.D + crumbs.map(c => c[1] ? $q.E + esc(c[1]) + '">' + esc(c[0]) + '</a>' : esc(c[0])).join(' / ') + $q.F + esc(o.h1) + $q.G + esc(o.lead) + '</p>' +
    (o.updated ? $q.H + esc(tf(l, 'upd', { d: fd(o.updated, l) })) + '</p>' : '') + $q.I + dirA(l) + '>' + $q.a + o.body + rel(l, o.k) + $q.J;
  const ld = { '@context': $q.K, '@graph': [{ '@type': o.type || $q.L, url: canon, name: o.h1, description: o.lead, inLanguage: l, dateModified: o.updated || $q.M, isPartOf: { '@type': $q.N, name: $q.O, url: ORIGIN + '/' } },
    { '@type': $q.P, itemListElement: crumbs.map((c, i) => ({ '@type': $q.Q, position: i + 1, name: c[0], item: c[1] ? ORIGIN + c[1] : canon })) }] };
  const desc = o.lead.length > 155 ? o.lead.slice(0, 152).replace(/\s+\S*$/, '') + '…' : o.lead;
  const title = (o.title || o.h1);
  let html = await N.assemble({ title: (title.length > 56 ? title.slice(0, 56).replace(/\s+\S*$/, '') : title) + $q.R, desc, canon, body, ld, alt: x => ORIGIN + pre(x) + o.path }, l, await shell(pre(l) + $q.S));
  if (o.noindex) html = html.replace($q.T, $q.U);
  const h = { 'content-type': $q.V, 'cache-control': $q.W + (o.maxAge || 900), 'content-language': l };
  if (o.noindex) h[$q.X] = $q.Y;
  return new Response(html, { status: 200, headers: h });
}
const RET = /guarantee|guaranteed|garant|\byield|\breturns?\b|\broi\b|rental (income|pool|return)|per annum|p\.a\./i;
export async function questionsFor(env, x, lang, tp0) {
await loadT(env);
const ix = await N.data(env), c = (ix.caseBy && ix.caseBy.get(x.id)) || {}, fx = x.fx || {};
let tp = tp0; if (tp === undefined) { try { const TR = await import('./kbx_tr.js'); tp = await TR.trProject(env, x.id, lang); } catch (e) { tp = null; } }
const st = {}; for (const i of (tp && tp.items) || []) st[i.k] = i;
const page = N.okHttp(x.url) ? N.fixU(x.url) : null, Q = [];
const add = (g, k, v, why, src) => Q.push({ g, k, q: tf(lang, 'q_' + k, Object.assign({ n: x.n, dv: x.dv || '' }, v || {})), why: why || '', src: src || null });
const no = k => st[k] && (st[k].st === 'no' || st[k].st === 'part');
const stage = c.stage || x.st;
if (no($q.Z) || (!st.deposit && !(c.checks && c.checks.escrow))) add('money', $q.Z, null, st.deposit ? st.deposit.text : t(lang, $q.aa), page);
if (!fx.payment_plan) add('money', 'plan', null, t(lang, $q.ab), page);
if (no('price')) add('money', 'price', null, st.price ? st.price.text : t(lang, $q.ac), page);
if (no($q.ad) || (!st.permit && !x.pn)) add('legal', $q.ad, null, st.permit ? st.permit.text : t(lang, $q.ae), page);
else if (x.pn && no($q.af)) add('legal', $q.af, { v: x.pn }, st.permitreg ? st.permitreg.text : '', N.okHttp(x.du) ? N.fixU(x.du) : page);
if (no('legal')) add('legal', 'legal', null, st.legal.text, page);
else if (no($q.ag) && x.dv) add('legal', $q.ag, null, st.register.text, $q.ah);
if (no($q.ai)) add('legal', $q.ai, null, st.location.text, page);
if (c.title === $q.aj) add('legal', 'lease', null, t(lang, $q.ak), page);
const ho = (() => { try { return N.handoverOf(ix, x); } catch (e) { return null; } })();
if (c.overdue > 0) add('date', 'past', { m: nf(c.overdue, lang) }, tf(lang, $q.al, { m: nf(c.overdue, lang) }), $q.am);
else { const pr = ((ix.prom && ix.prom[x.id]) || []).find(k => k && k.k === $q.an && k.mm > 0); if (pr) add('date', 'moved', { m: nf(pr.mm, lang) }, tf(lang, $q.ao, { m: nf(pr.mm, lang) }), $q.am); }
if (no('date') || (!st.date && !ho)) add('date', 'date', null, st.date ? st.date.text : t(lang, $q.ap), page);
else if (!(c.overdue > 0) && stage !== $q.aq) add('date', $q.ar, { d: ho && ho.d ? N.fd(ho.d, lang) : '' }, t(lang, $q.as), page);
if (c.plans === false || (c.checks && c.checks.plans === false)) add('unit', 'plans', null, t(lang, $q.at), page);
if (stage !== $q.aq && !(c.verified && c.verified.progress && c.verified.progress !== 'none' && c.verified.progress !== $q.au)) add('unit', $q.av, null, t(lang, $q.aw), page);
const cl = (x.cl || []).filter(k => Array.isArray(k) && k[0]);
for (const k of cl.filter(k => k[1] === $q.ax).slice(0, 4)) add($q.ay, $q.az, { c: String(k[0]).slice(0, 140), h: hostOf(k[3]) || t(lang, $q.aA) }, t(lang, $q.aB), N.okHttp(k[3]) ? k[3] : null);
for (const k of cl.filter(k => k[1] !== $q.aC && k[1] !== $q.ax && RET.test(String(k[0]))).slice(0, 2)) add($q.ay, $q.aD, { c: String(k[0]).slice(0, 140) }, t(lang, $q.aE), N.okHttp(k[3]) ? k[3] : null);
if (st.web && (st.web.st === 'no' || st.web.st === 'part')) add($q.ay, 'web', null, st.web.text, $q.aF + x.s + '/#web');
const order = ['money', 'legal', 'date', 'unit', $q.ay];
Q.sort((a, b) => order.indexOf(a.g) - order.indexOf(b.g));
return { id: x.id, slug: x.s, name: x.n, developer: x.dv || null, lang, built: ix.updated || null, questions: Q, gaps_read: Object.keys(st).length, groups: order };
}
const qText = (l, R) => tf(l, $q.aG, { n: R.name }) + '\n\n' + R.questions.map((q, i) => (i + 1) + '. ' + q.q).join('\n') + '\n\n' + tf(l, $q.aH, { u: ORIGIN + pre(l) + $q.aF + R.slug + '/' });
export function questionsHtml(l, R, o) {
o = o || {};
if (!R.questions.length) return '<p>' + esc(t(l, $q.aI)) + '</p>';
const by = {}; for (const q of R.questions) (by[q.g] = by[q.g] || []).push(q);
let i = 0;
return R.groups.filter(g => by[g]).map(g => (o.h3 ? '<h3>' : '<h2>') + esc(t(l, 'g_' + g)) + (o.h3 ? '</h3>' : '</h2>') + $q.aJ + (i + 1) + '">' + by[g].map(q => { i++; return $q.aK + bdi(l, esc(q.q)) + $q.aL + esc(t(l, 'why')) + ': ' + bdi(l, esc(q.why)) + (q.src ? $q.aM + esc(q.src) + '"' + (/^https?:/.test(q.src) ? $t.k1 : '') + '>' + esc(/^https?:/.test(q.src) ? hostOf(q.src) : $q.aN) + '</a>' : '') + $q.aO; }).join('') + '</ol>').join('');
}
async function qPage(env, shell, l, x) {
const R = await questionsFor(env, x, l), P = pre(l), txt = qText(l, R);
const mail = $q.aP + encodeURIComponent(tf(l, $q.aQ, { n: x.n })) + $q.aR + encodeURIComponent(txt.slice(0, 1800));
const b = $q.H + esc(tf(l, $q.aS, { k: nf(R.questions.length, l), n: x.n })) + $t.k2 + esc(t(l, 'copy')) + $q.aT + esc(mail) + '">' + esc(t(l, 'mail')) + $t.k3 + esc(t(l, 'print')) + $t.k4 +
questionsHtml(l, R) + $t.k5 + esc(txt) + $q.aU +
$q.aV + P + $q.aF + x.s + '/">' + esc(tf(l, 'back', { n: x.n })) + $q.aW + P + $q.aF + x.s + $q.aX + esc(t(l, $q.aY)) + $q.aZ + esc(x.id) + $q.ba + esc(t(l, $q.bb)) + $q.bc + x.s + $q.bd + l + $q.be +
'<h2>' + esc(t(l, $q.bf)) + '</h2>' + (t(l, $q.bg) || []).map(p => '<p>' + esc(p) + '</p>').join('') +
$s.k0 + JSON.stringify(t(l, $q.bh)) + $s.k1 + JSON.stringify(t(l, $q.bh)) + $t.k6;
return page(shell, l, { k: 'q', path: $q.aF + x.s + $q.bi, h1: tf(l, 'q_h1', { n: x.n }), title: tf(l, $q.bj, { n: x.n }), lead: tf(l, $q.bk, { n: x.n }), body: b, updated: R.built, noindex: true, crumb: [[t(l, $q.bl), P + $q.aF], [x.n, P + $q.aF + x.s + '/']] });
}
let SX = null;
async function sIndex(env) {
const d = await file(env, $q.bm, 1800000); if (!d) return null;
if (SX && SX.d === d) return SX;
const rows = d.p.filter(r => !COI.test(r[1] + ' ' + r[3] + ' ' + r[5] + ' ' + r[7])).map(r => ({ s: r[0], n: r[1], id: r[2], dv: r[3], dvs: r[4], mk: r[5], co: r[6], ar: r[7], st: r[8], pm: r[9], hy: r[10], ov: r[11], mv: r[12], h: norm([r[1], r[2], r[3], r[5], r[6], r[7]].join(' ')), hn: norm(r[1]) }));
SX = { d, rows, bySlug: new Map(rows.map(r => [r.s, r])), byId: new Map(rows.map(r => [r.id, r])) };
return SX;
}
function match(rows, q) {
const qs = norm(q).split(' ').filter(Boolean); if (!qs.length) return rows.slice();
const out = [];
for (const r of rows) { let s = 0, ok = true; for (const w of qs) { const i = r.h.indexOf(w); if (i < 0) { ok = false; break; } s += (r.hn.indexOf(w) === 0 ? 6 : r.hn.indexOf(w) >= 0 ? 4 : 1) + (i === 0 || r.h[i - 1] === ' ' ? 1 : 0); } if (ok) out.push([s, r]); }
out.sort((a, b) => b[0] - a[0] || a[1].n.localeCompare(b[1].n)); return out.map(x => x[1]);
}
const SECS = ['f', 'c', 'q', 'h', 's'];
async function ddPage(env, shell, l, u) {
const X = await sIndex(env); if (!X) return null;
const P = pre(l), q = String(u.searchParams.get('p') || '').slice(0, 120).trim();
let pick = null, cands = [];
const idm = /\b([A-Za-z]{2,5}-\d{3,4})\b/.exec(q);
if (q) { pick = X.bySlug.get(q.toLowerCase()) || X.byId.get(q.toUpperCase()) || (idm && X.byId.get(idm[1].toUpperCase())) || null; if (!pick) { cands = match(X.rows, q).slice(0, 8); if (cands.length === 1) pick = cands[0]; } }
const opt = (v, lab, on) => $q.bn + v + '"' + (on ? $q.bo : '') + '> ' + esc(lab) + $q.bp;
let b = '<h2>' + esc(t(l, 'dd_s1')) + $q.bq + P + $t.k7 + esc(t(l, $q.br)) + $q.bs + esc(q) + $t.k8 + esc(t(l, 'dd_ph')) + $t.k9 + esc(t(l, $q.bt)) + $q.bu;
if (q && !pick) b += cands.length ? '<p>' + esc(t(l, $q.bv)) + $q.bw + cands.map(r => $q.t + P + $q.bx + esc(r.s) + '">' + bdi(l, esc(r.n)) + $q.by + bdi(l, esc([r.dv, r.mk, r.co].filter(Boolean).join(' · '))) + ' · ' + esc(r.id) + $q.bz).join('') + '</ul>' : $q.bA + esc(tf(l, $q.bB, { q })) + $q.aM + P + $q.bC + encodeURIComponent(q) + '">' + esc(t(l, 'se_t')) + $q.bD;
if (pick) {
const act = P + $q.aF + pick.s + $q.bE;
b += '<h2>' + esc(t(l, 'dd_s2')) + $q.bF + bdi(l, esc(pick.n)) + $q.bG + bdi(l, esc([pick.dv, pick.mk, pick.co].filter(Boolean).join(' · '))) + ' · ' + esc(pick.id) + $q.bH +
$q.bI + act + $t.k10 + esc(t(l, $q.bJ)) + $q.bK + SECS.map(s => opt(s, t(l, 'sec_' + s), true)).join('') + $q.bL +
$t.k11 + esc(t(l, 'dd_go')) + $q.aT + act + '">' + esc(t(l, $q.bM)) + $q.bN + P + $q.aF + pick.s + $t.k12 + P + $q.aF + pick.s + $q.bO + esc(t(l, $q.bP)) + $q.bQ +
$q.H + esc(t(l, $q.bR)) + $q.bS + esc(ORIGIN + act) + $q.bT;
}
b += '<h2>' + esc(t(l, $q.bU)) + $q.bV + SECS.map(s => $q.aK + esc(t(l, 'sec_' + s)) + $q.bW + esc(t(l, 'secd_' + s)) + '</li>').join('') + '</ul>' + (t(l, 'dd_p') || []).map(p => '<p>' + esc(p) + '</p>').join('') +
$q.H + esc(tf(l, $q.bX, { n: nf(X.rows.length, l), d: fd(X.d.built, l), h: String(X.d.source.sha256).slice(0, 16) })) + '</p>' + clientT(l, 'dd');
return page(shell, l, { k: 'dd', path: $q.bY, h1: t(l, 'dd_t'), lead: t(l, 'dd_l'), body: b, updated: X.d.built, noindex: !!q, crumb: [[t(l, 'tools'), P + $q.bZ]], type: $q.ca });
}
const PER = 25;
export function facetFilter(rows, f, skip) {
return rows.filter(r => (skip === 'co' || !f.co || r.co === f.co) && (skip === 'st' || !f.st || r.st === f.st) && (skip === 'pm' || f.pm == null || r.pm === f.pm) && (skip === 'hy' || !f.hy || (f.hy === 'none' ? !r.hy : f.hy === 'past' ? r.ov > 0 : String(r.hy) === f.hy)));
}
const cnt = (rows, key) => { const m = new Map(); for (const r of rows) { const k = key(r); m.set(k, (m.get(k) || 0) + 1); } return m; };
async function sePage(env, shell, l, u) {
const X = await sIndex(env); if (!X) return null;
const P = pre(l), sp = u.searchParams, q = String(sp.get('q') || '').slice(0, 120);
const f = { co: sp.get('co') || '', st: ['o', 'u', 'c'].includes(sp.get('st')) ? sp.get('st') : '', pm: sp.get('pm') === '1' ? 1 : sp.get('pm') === '0' ? 0 : null, hy: /^(20\d\d|none|past)$/.test(sp.get('hy') || '') ? sp.get('hy') : '' };
let G = null, RT = (k, v) => k; try { const R = await import('./kbx_n37u.js'); G = await R.regMap(env); RT = (k, v) => R.rgT(l, k, v); } catch (e) { G = null; }
const rg = G && /^[13]$/.test(sp.get('rg') || '') ? sp.get('rg') : '', so = G && sp.get('so') === 'reg' ? 'reg' : '', gOf = r => (G && G.get(r.s)) || 0;
const base0 = match(X.rows, q), base = rg ? base0.filter(r => gOf(r) >= +rg) : base0, res0 = facetFilter(base, f), res = so ? res0.map((r, i) => [gOf(r), i, r]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).map(x => x[2]) : res0, rgAll = G ? facetFilter(base0, f) : [], pg = Math.max(1, Math.min(200, parseInt(sp.get('pg') || '1', 10) || 1));
const co = cnt(facetFilter(base, f, 'co'), r => r.co), stc = cnt(facetFilter(base, f, 'st'), r => r.st), pmc = cnt(facetFilter(base, f, 'pm'), r => r.pm), hyc = cnt(facetFilter(base, f, 'hy'), r => r.hy || 'none'), pastN = facetFilter(base, f, 'hy').filter(r => r.ov > 0).length;
const sel = (name, lab, opts, cur) => $q.cb + esc(lab) + $q.cc + name + $q.cd + name + $q.ce + esc(t(l, 'all')) + $q.cf + opts.map(o => $q.cg + esc(o[0]) + '"' + (String(cur) === String(o[0]) ? $q.ch : '') + '>' + esc(o[1]) + ' (' + nf(o[2], l) + $q.ci).join('') + $q.cj;
const coOpts = [...co.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k, v]) => [k, k, v]);
if (f.co && !co.has(f.co)) coOpts.unshift([f.co, f.co, 0]);
const stName = { o: t(l, 'st_o'), u: t(l, 'st_u'), c: t(l, 'st_c') };
const yrs = [...hyc.keys()].filter(k => k !== 'none').sort();
const form = $q.bI + P + $t.k13 + esc(t(l, 'se_q')) + $q.ck + esc(q) + $q.cl + esc(t(l, 'se_ph')) + $t.k14 + esc(t(l, 'se_go')) + $q.cm +
$q.cn + sel('co', t(l, 'f_co'), coOpts, f.co) + sel('st', t(l, 'f_st'), ['o', 'u', 'c'].map(k => [k, stName[k], stc.get(k) || 0]), f.st) + sel('pm', t(l, 'f_pm'), [[1, t(l, 'pm_1'), pmc.get(1) || 0], [0, t(l, 'pm_0'), pmc.get(0) || 0]], f.pm == null ? '' : f.pm) +
sel('hy', t(l, 'f_hy'), yrs.map(y => [y, y, hyc.get(+y) || hyc.get(y) || 0]).concat([['past', t(l, $q.co), pastN], ['none', t(l, $q.cp), hyc.get('none') || 0]]), f.hy) +
(G ? sel('rg', RT('rg_f'), [['1', RT('rg_1'), rgAll.filter(r => gOf(r) >= 1).length], ['3', RT('rg_3'), rgAll.filter(r => gOf(r) >= 3).length]], rg) + $q.cb + esc(RT('so_l')) + $t.k15 + esc(RT('so_0')) + $q.cq + (so ? $q.ch : '') + '>' + esc(RT($q.cr)) + $q.cs : '') + $q.ct;
const pages = Math.max(1, Math.ceil(res.length / PER)), cur = Math.min(pg, pages), slice = res.slice((cur - 1) * PER, cur * PER);
const qs = o => { const p = new URLSearchParams(); const v = Object.assign({ q, co: f.co, st: f.st, pm: f.pm == null ? '' : String(f.pm), hy: f.hy, rg, so }, o); for (const k of ['q', 'co', 'st', 'pm', 'hy', 'rg', 'so', 'pg']) if (v[k] && !(k === 'pg' && v[k] === 1)) p.set(k, v[k]); const s = p.toString(); return P + $q.cu + (s ? '?' + s : ''); };
const item = r => $q.t + P + $q.aF + esc(r.s) + '/">' + bdi(l, esc(r.n)) + $q.by + bdi(l, esc([r.dv, r.ar && r.ar !== r.mk ? r.ar : '', r.mk, r.co].filter(Boolean).join(' · '))) + $q.cv + [stName[r.st] || '', r.hy ? tf(l, 'r_hy', { y: r.hy }) : t(l, $q.cp), r.ov > 0 ? tf(l, 'r_ov', { m: nf(r.ov, l) }) : '', r.pm ? t(l, 'pm_1') : t(l, 'pm_0')].filter(Boolean).map(esc).join(' · ') + $q.bz;
const out = $t.k16 + esc(tf(l, 'se_n', { k: nf(res.length, l), t: nf(X.rows.length, l) })) + '</p>' + (slice.length ? $q.cw + ((cur - 1) * PER + 1) + '">' + slice.map(item).join('') + '</ol>' : $q.bA + esc(t(l, $q.cx)) + $q.aM + P + $q.cy + encodeURIComponent(q) + '">' + esc(t(l, $q.cz)) + $q.bD) +
(pages > 1 ? $q.cA + esc(t(l, 'pages')) + '">' + (cur > 1 ? $q.E + esc(qs({ pg: cur - 1 })) + $q.cB : '') + $q.cC + nf(cur, l) + ' / ' + nf(pages, l) + $q.cD + (cur < pages ? $q.E + esc(qs({ pg: cur + 1 })) + $q.cE : '') + $q.cF : '') + $q.J;
const b = form + out + $q.H + esc(tf(l, $q.bX, { n: nf(X.rows.length, l), d: fd(X.d.built, l), h: String(X.d.source.sha256).slice(0, 16) })) + $s.k2 +
$q.H + esc(t(l, $q.cG)) + '</p>' + clientT(l, 'se', ['se_n', $q.cx, $q.cz, 'st_o', 'st_u', 'st_c', 'pm_1', 'pm_0', 'r_hy', 'r_ov', $q.cp, $q.co, 'all', 'pages']);
const any = q || f.co || f.st || f.pm != null || f.hy || rg || so || cur > 1;
return page(shell, l, { k: 'se', path: $q.cu, h1: t(l, 'se_t'), lead: t(l, 'se_l'), body: b, updated: X.d.built, noindex: !!any, maxAge: 600, type: $q.cH });
}
const DEF = ['dubai', 'bali', 'phuket'];
const ci = (l, v, d) => v ? bdi(l, '[' + nf(v[0], l, d) + ' – ' + nf(v[1], l, d) + ']') : '';
async function mcPage(env, shell, l, u) {
const D = await file(env, $q.cI, 1800000); if (!D) return null;
const P = pre(l), all = D.markets.filter(m => !COI.test(m.market)), by = new Map(all.map(m => [m.slug, m]));
let want = String(u.searchParams.get('m') || '').toLowerCase().split(/[,\s]+/).concat(['m1', 'm2', 'm3', 'm4'].map(k => String(u.searchParams.get(k) || '').toLowerCase())).filter(s => by.has(s));
want = [...new Set(want)].slice(0, 4); const custom = want.length > 0; if (want.length < 2) want = [...new Set(want.concat(DEF))].slice(0, Math.max(3, want.length));
const M = want.map(s => by.get(s)).filter(Boolean);
const opts = cur => all.slice().sort((a, b) => a.market.localeCompare(b.market)).map(m => $q.cg + esc(m.slug) + '"' + (m.slug === cur ? $q.ch : '') + '>' + esc(m.market) + ' (' + nf(m.projects, l) + $q.ci).join('');
const form = $q.bI + P + $q.cJ + [0, 1, 2, 3].map(i => $q.cb + esc(tf(l, 'mc_m', { i: i + 1 })) + $q.cK + (i + 1) + $q.ce + esc(t(l, i < 2 ? $q.cL : $q.cM)) + $q.cf + opts(M[i] && M[i].slug) + $q.cj).join('') + $t.k17 + esc(t(l, 'mc_go')) + $q.cN;
const pct = (a, b) => b ? nf(Math.round(a * 100 / b), l) + '%' : '–';
const med = (o, unit) => o && o.n ? bdi(l, nf(o.median, l, 1) + ' ' + unit) + ' ' + ci(l, o.ci95, 0) + $q.cO + esc(tf(l, 'n_is', { n: nf(o.n, l) })) + (o.n < 5 ? ', ' + esc(t(l, 'few')) : '') + $q.cD : $q.cP + esc(t(l, $q.cQ)) + $q.cD;
const R = [
[t(l, $q.cR), m => $q.E + P + '/m/' + encodeURIComponent(m.slug) + '/">' + bdi(l, nf(m.projects, l)) + '</a>'],
[t(l, $q.cS), m => esc([t(l, 'st_o') + ' ' + nf(m.stage.o, l), t(l, 'st_u') + ' ' + nf(m.stage.u, l), t(l, 'st_c') + ' ' + nf(m.stage.c, l)].join(' · '))],
[t(l, $q.cT), m => bdi(l, pct(m.with_date, m.projects)) + $q.cO + bdi(l, nf(m.with_date, l) + ' / ' + nf(m.projects, l)) + $q.cD],
[t(l, $q.cU), m => med(m.past_date, t(l, $q.cV))],
[t(l, $q.cW), m => med(m.moved, t(l, $q.cV))],
[t(l, $q.cX), m => bdi(l, pct(m.permit_published, m.projects)) + $q.cO + bdi(l, nf(m.permit_published, l) + ' / ' + nf(m.projects, l)) + $q.cD],
[t(l, 'mc_ti'), m => m.disclosure ? bdi(l, nf(m.disclosure.transparency_index, l)) + $q.cY : $q.cZ],
[t(l, $q.da), m => m.disclosure && m.disclosure.deposit_protection_pct != null ? bdi(l, nf(m.disclosure.deposit_protection_pct, l) + '%') : $q.cZ],
[t(l, $q.db), m => m.ppm ? bdi(l, esc(m.ppm.currency) + ' ' + nf(m.ppm.median, l)) + ' ' + ci(l, m.ppm.ci95, 0) + $q.cO + esc(tf(l, 'n_is', { n: nf(m.ppm.n, l) })) + (m.ppm.n < 5 ? ', ' + esc(t(l, 'few')) : '') + $q.cD + (m.ppm.n >= 5 ? $q.dc + pre(l) + $q.dd + m.slug + '">' + esc($t.o_PM35[l] || $t.o_PM35.en) + '</a>' : '') : $q.cP + esc(t(l, $q.cQ)) + $q.cD],
[t(l, $q.de), m => m.registers.length ? $t.k18 + m.registers.map(r => $q.t + esc(r.url) + $t.k19 + esc(r.name) + $q.by + esc(t(l, 'auto_' + String(r.automation || '').replace(/[^a-z]+/g, '_')) || r.automation || '') + $q.bz).join('') + '</ul>' : $q.cP + esc(t(l, $q.df)) + $q.cD]
];
const tbl = table([t(l, $q.dg)].concat(M.map(m => m.market)), R.map(r => $q.dh + esc(r[0]) + '</th>' + M.map(m => '<td>' + r[1](m) + '</td>').join('') + '</tr>'), t(l, $q.di));
const bars = (key, val, max, lab) => {
    const W = 640, rowH = 34, H = 16 + M.length * rowH, L0 = 150, R0 = 70, vals = M.map(val);
    const rows = M.map((m, i) => { const v = vals[i], w = v == null ? 0 : Math.max(1, (W - L0 - R0) * v / max); return $q.dj + (L0 - 8) + '" y="' + (16 + i * rowH + 17) + $q.dk + esc(m.market.length > 18 ? m.market.slice(0, 17) + '…' : m.market) + $q.dl + (key === 'past' ? $q.dm : '') + ' x="' + L0 + '" y="' + (16 + i * rowH + 4) + $q.dn + w.toFixed(1) + $q.do + (L0 + w + 6).toFixed(1) + '" y="' + (16 + i * rowH + 19) + '">' + (v == null ? '–' : nf(v, l)) + (key === 'ti' ? '' : '%') + $q.dp; }).join('');
    const top = M.map((m, i) => [m.market, vals[i]]).filter(x => x[1] != null).sort((a, b) => b[1] - a[1]);
    const sum = top.length ? tf(l, $q.dq + key, { a: top[0][0], av: nf(top[0][1], l), b: top[top.length - 1][0], bv: nf(top[top.length - 1][1], l) }) : '';
    const id = 'n34c-' + key;
    return $q.dr + id + $q.ds + esc(lab) + $q.dt + W + ' ' + H + $q.du + id + '-t ' + id + $q.dv + esc(lab) + $q.dw + L0 + $q.dx + L0 + $q.dy + (H - 4) + $q.dz + rows + $q.dA + id + '-s">' + esc(sum) + ' ' + esc(t(l, $q.dB)) + $q.dC;
  };
const charts = bars('ti', m => m.disclosure ? m.disclosure.transparency_index : null, 100, t(l, 'mc_ti')) + bars($q.ad, m => m.projects ? Math.round(m.permit_published * 100 / m.projects) : null, 100, t(l, $q.cX)) + bars('past', m => m.with_date ? Math.round(m.past_date.n * 100 / m.with_date) : null, Math.max(10, ...M.map(m => m.with_date ? Math.round(m.past_date.n * 100 / m.with_date) : 0)), t(l, $q.dD));
const b = form + $q.H + esc(t(l, $q.dE)) + '</p>' + tbl + charts + '<h2>' + esc(t(l, $q.bf)) + '</h2>' + (t(l, 'mc_p') || []).map(p => '<p>' + esc(p) + '</p>').join('') +
$q.H + esc(tf(l, $q.dF, { d: fd(D.built, l), e: D.disclosure_source.edition, h: String(D.source.sha256).slice(0, 16) })) + $s.k3 + P + $q.dG + esc(t(l, $q.dH)) + $q.aW + P + $q.dI + esc(t(l, $q.dJ)) + $q.dK + esc(t(l, $q.dL)) + $q.bD;
const names = M.map(m => m.market).join(', ');
return page(shell, l, { k: 'mc', path: $q.dM, h1: custom ? tf(l, $q.dN, { m: names }) : t(l, 'mc_t'), title: custom ? tf(l, $q.dN, { m: names }) : t(l, 'mc_t'), lead: t(l, 'mc_l'), body: b, updated: D.built, noindex: custom, crumb: [[t(l, $q.dO), P + '/m/']], type: $q.L });
}
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname; if (!PATHS.test(p)) return null;
if (req.method !== 'GET' && req.method !== 'HEAD') return null;
if (!(await loadT(env))) return null;
let m = p.match(RX.api);
if (m) {
const ix = await N.data(env), x = ix.bySlug.get(m[1]) || ix.byId.get(m[1].toUpperCase());
if (!x || !okName(x)) return new Response(JSON.stringify({ error: $q.dP }), { status: 404, headers: { 'content-type': $q.dQ, 'access-control-allow-origin': '*' } });
const l = LANGS.includes(u.searchParams.get('lang')) ? u.searchParams.get('lang') : 'en';
const R = await questionsFor(env, x, l);
const body = Object.assign({ api: $q.dR, licence: $t.k20, rules: $s.k4, page: ORIGIN + pre(l) + $q.aF + x.s + $q.bi }, R);
return new Response(JSON.stringify(body), { headers: { 'content-type': $q.dQ, 'cache-control': $q.dS, 'access-control-allow-origin': '*' } });
}
if ((m = p.match(RX.q))) {
const l = m[1] || 'en'; if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' } });
const ix = await N.data(env), x = ix.bySlug.get(m[2]); if (!x || !okName(x)) return null;
return qPage(env, shell, l, x);
}
for (const [k, fn] of [['dd', ddPage], ['mc', mcPage], ['se', sePage]]) {
if ((m = p.match(RX[k]))) { if (!m[2]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } }); return fn(env, shell, m[1] || 'en', u); }
}
return null;
}
