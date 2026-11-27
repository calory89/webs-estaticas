// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_n35a__q, $s = TB.kbx_n35a__s, $t = TB.kbx_n35a__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const V = 'a2';
let T = null;
async function loadT(env) {
if (T) return T;
try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.b)); if (r.ok) T = await r.json(); } catch (e) {}
if (!T) { try { const r = await fetch(ORIGIN + $q.c, { cf: { cacheTtl: 300 } }); if (r.ok) T = await r.json(); } catch (e) {} }
return T;
}
const MEMO = {};
function file(e, p, t) { return FQ[p] || (FQ[p] = file0(e, p, t).finally(() => { delete FQ[p]; })); }   // n40 k21: one shared read per file
const FQ = {};
async function file0(env, p) {
const m = MEMO[p]; if (m && Date.now() - m.t < 900000) return m.v;
let v = null;
try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.d + p)); if (r.ok) v = await r.json(); } catch (e) { v = null; }
MEMO[p] = { t: Date.now(), v }; return v;
}
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.e, "'": '&#39;' }[c]));
const t = (l, k) => { const a = T && T[l] && T[l][k]; return a != null ? a : T && T.en[k] != null ? T.en[k] : ''; };
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
const nf = (n, l, d) => { if (n == null || n === '') return '-'; try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { maximumFractionDigits: d == null ? 0 : d, numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
const fd = (d, l, short) => { if (!d) return '-'; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', short ? { month: 'short', year: $q.f, timeZone: 'UTC', numberingSystem: 'latn' } : { day: $q.f, month: 'short', year: $q.f, timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(String(d).slice(0, 10).padEnd(10, '-15').replace(/-$/, '') + $q.g)); } catch (e) { return String(d).slice(0, 10); } };
const bdi = (l, h) => l === 'ar' ? '<bdi>' + h + $q.h : h;
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const ext = u => u ? $q.i + esc(u) + $t.k0 + esc(hostOf(u) || u) + '</a>' : '';
const pU = (l, s) => pre(l) + $q.j + s + '/';
const dU = (l, s) => pre(l) + $q.k + s + '/';
const LP = '(?:(es|de|fr|nl|ru|zh|ar)\\/)?';
const F = { pace: 'construction-pace', ask: 'prices\\/asking-vs-registered(?:\\/([a-z0-9-]{2,60}))?', esc: 'registers\\/escrow-banks', sig: 'signals', dsig: 'developers\\/([a-z0-9-]{1,90})\\/signals',
con: 'data\\/contradictions', ali: 'data\\/aliases', dic: 'data\\/dictionary', dif: 'data\\/diff', qa: 'data\\/ask', sat: 'satellite\\/changes' };
const R = {}; for (const k in F) R[k] = new RegExp('^\\/' + LP + F[k] + '\\/?$');
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:construction-pace|prices\/asking-vs-registered(?:\/[a-z0-9-]{2,60})?|registers\/escrow-banks|signals|developers\/[a-z0-9-]{1,90}\/signals|data\/(?:contradictions|aliases|dictionary|diff|ask)|satellite\/changes)\/?$/;
export const INJECT = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:projects\/[a-z0-9-]{1,90}|developers\/[a-z0-9-]{1,90}|m\/dubai|engineering|yc|data|data\/sql|registers|satellite\/construction-index|numbers)\/$/;
const ALL = [['pace', '/construction-pace/'], ['ask', '/prices/asking-vs-registered/'], ['esc', '/registers/escrow-banks/'], ['sig', '/signals/'], ['con', '/data/contradictions/'], ['ali', '/data/aliases/'], ['dic', '/data/dictionary/'], ['dif', '/data/diff/'], ['qa', '/data/ask/'], ['sat', '/satellite/changes/']];
const table = (th, rows, cap) => $q.l + (cap ? $q.m + esc(cap) + '"' : '') + $q.n + (cap ? $q.o + esc(cap) + $q.p : '') + $q.q + th.map(x => $q.r + esc(x) + '</th>').join('') + $q.s + rows.join('') + $q.t;
const kpis = xs => $q.u + xs.map(x => $q.v + x[0] + '</b>' + esc(x[1]) + $q.w).join('') + $q.w;
const sec = (h, b, id) => '<h2' + (id ? ' id="' + id + '"' : '') + '>' + esc(h) + '</h2>' + b;
const paras = (l, k) => [].concat(t(l, k) || []).map(p => '<p>' + esc(p) + '</p>').join('');
const files = (l, fs) => $q.x + esc(t(l, 'files')) + ': ' + fs.map(f => $q.i + f + '"' + (l === 'ar' ? $q.y : '') + '>' + esc(f) + '</a>').join(' · ') + '</p>';
const filt = (l, base, key, cur, opts) => $q.z + esc(t(l, $q.A)) + '">' + [['', t(l, 'all')]].concat(opts).map(o => $q.B + base + (o[0] ? '?' + key + '=' + encodeURIComponent(o[0]) : '') + '"' + ((cur || '') === o[0] ? $q.C : '') + $q.D + esc(o[1]) + $q.E).join('') + '</ul>';
const N = () => import('./kbx_named.js');
const rel = (l, skip) => '<h2>' + esc(t(l, 'more')) + $q.F + ALL.filter(x => x[0] !== skip).map(x => $q.B + pre(l) + x[1] + '">' + esc(t(l, x[0] + '_t')) + $q.E).join('') + $q.B + pre(l) + $q.G + esc(t(l, 'eng')) + $q.H;
async function page(shell, l, o) {
  const n = await N(), canon = ORIGIN + pre(l) + o.path;
  const crumbs = [[t(l, 'home'), pre(l) + '/']].concat(o.crumb || []).concat([[o.h1, null]]);
  const dir = l === 'ar' ? $q.I : '';
  const body = $q.J + dir + $q.K + crumbs.map(c => c[1] ? $q.i + esc(c[1]) + '">' + esc(c[0]) + '</a>' : esc(c[0])).join(' / ') + $q.L + esc(o.h1) + $q.M + esc(o.lead) + '</p>' +
    (o.updated ? $q.x + esc(fill(t(l, 'upd'), { d: fd(o.updated, l) })) + '</p>' : '') + $q.N + dir + '>' + $q.a + o.body + rel(l, o.k) + $q.w;
  const ld = { '@context': $q.O, '@graph': [{ '@type': o.type || $q.P, url: canon, name: o.h1, description: o.lead, inLanguage: l, dateModified: o.updated || $q.Q, isPartOf: { '@type': $q.R, name: $q.S, url: ORIGIN + '/' } },
    { '@type': $q.T, itemListElement: crumbs.map((c, i) => ({ '@type': $q.U, position: i + 1, name: c[0], item: c[1] ? ORIGIN + c[1] : canon })) }].concat(o.ld || []) };
  const desc = o.lead.length > 155 ? o.lead.slice(0, 152).replace(/\s+\S*$/, '') + '…' : o.lead;
  const html = await n.assemble({ title: (o.h1.length > 46 ? o.h1.slice(0, 46).replace(/\s+\S*$/, '') : o.h1) + $q.V, desc, canon, body, ld, alt: x => ORIGIN + pre(x) + o.path }, l, await shell(pre(l) + $q.W));
  const h = { 'content-type': $q.X, 'cache-control': $q.Y, 'content-language': l };
  if (o.noindex) h[$q.Z] = $q.aa;
  return new Response(html, { status: 200, headers: h });
}
const H = (l, k) => ({ h1: t(l, k + '_t'), lead: t(l, k + '_l'), k });
const DS = l => [t(l, 'data'), pre(l) + $q.ab];
const nonceOf = n => n || '';
const KL = (l, k) => t(l, 'pk_' + k);
const gapC = g => g == null ? '' : g < -10 ? $q.ac : $q.ad;
const projTxt = (l, r) => r.proj ? (r.proj[0] === r.proj[1] ? esc(fd(r.proj[0], l, 1)) : bdi(l, esc(fd(r.proj[0], l, 1)) + ' – ' + esc(fd(r.proj[1], l, 1)))) : $q.ae + esc(t(l, r.pct != null && r.pct < 10 ? 'p_low' : $q.af)) + $q.ag;
function histSvg(l, h) {
const mx = Math.max(...h.map(x => x[1])), w = 34, H0 = 120;
const bars = h.map((x, i) => { const bh = Math.round(H0 * x[1] / mx); return $q.ah + (i * (w + 4)) + '" y="' + (H0 - bh) + $q.ai + w + $q.aj + bh + $q.ak + (x[0] < -10 ? $q.al : $q.am) + $q.an + (i * (w + 4) + w / 2) + '" y="' + (H0 + 14) + $t.k1 + (x[0] <= -60 ? '≤-60' : x[0]) + $q.ao + (i * (w + 4) + w / 2) + '" y="' + (H0 - bh - 3) + $t.k2 + x[1] + $q.ap; }).join('');
return $q.aq + (h.length * (w + 4)) + ' ' + (H0 + 20) + $q.ar + esc(t(l, $q.as)) + $t.k3 + bars + $q.at + esc(t(l, $q.as)) + $q.au +
$q.av + esc(t(l, 'table')) + $q.aw + table([t(l, 'p_bin'), t(l, $q.ax)], h.map(x => $q.ay + bdi(l, x[0] + ' … ' + (x[0] + 10)) + $q.az + x[1] + $q.aA)) + $q.aB;
}
async function pacePage(env, shell, l, u) {
const d = await file(env, $q.aC); if (!d) return null;
const s = d.summary, k = [$q.aD, 'on', 'past', 'done', 'na'].includes(u.searchParams.get('k')) ? u.searchParams.get('k') : '', dv = (u.searchParams.get('d') || '').replace(/[^a-z0-9-]/g, '').slice(0, 90);
const pg = Math.max(1, Math.min(20, parseInt(u.searchParams.get('page') || '1', 10) || 1)), PER = 60;
let rows = d.rows.filter(r => (!k || r.k === k) && (!dv || r.dvs === dv));
const tot = rows.length; rows = rows.slice((pg - 1) * PER, pg * PER);
const base = pre(l) + $q.aE;
const b = $q.aF + esc(t(l, $q.aG)) + $q.aH +
kpis([[bdi(l, nf(s.compared, l)), t(l, 'p_k1')], [bdi(l, nf(s.behind_pct, l, 1) + '%'), fill(t(l, 'p_k2'), { a: nf(s.behind_ci[0], l, 1), b: nf(s.behind_ci[1], l, 1) })], [bdi(l, nf(s.median_gap_pts, l, 1)), fill(t(l, 'p_k3'), { a: nf(s.median_gap_ci[0], l, 1), b: nf(s.median_gap_ci[1], l, 1) })], [bdi(l, nf(s.with_projection, l)), t(l, 'p_k4')], [bdi(l, nf(s.proj_after_comp_pct, l, 1) + '%'), fill(t(l, 'p_k5'), { a: nf(s.proj_after_comp_ci[0], l, 1), b: nf(s.proj_after_comp_ci[1], l, 1) })]]) +
histSvg(l, s.hist) +
sec(t(l, $q.aI), filt(l, base, 'k', k, [$q.aD, 'on', 'past', 'done', 'na'].map(x => [x, KL(l, x) + ' (' + nf(s.counts[x] || 0, l) + ')'])) + (dv ? '<p>' + esc(t(l, 'p_dev')) + ': <b>' + esc(dv) + $q.aJ + base + $q.aK + esc(t(l, 'all')) + $q.aL : '') +
table(t(l, 'p_th'), rows.map(r => $q.aM + pU(l, r.s) + '">' + esc(r.n) + $q.aN + (r.dvs ? $q.i + base + '?d=' + r.dvs + $q.aK + esc(r.dv) + '</a>' : esc(r.dv)) + (r.ar ? ' · ' + esc(r.ar) : '') + $q.aO + (r.pct != null ? bdi(l, nf(r.pct, l, 1) + '%') : '-') + $q.aP + esc(fd(r.pd, l)) + $q.aQ + (r.el != null ? bdi(l, nf(Math.min(r.el, 100), l, 0) + '%') : '-') + $q.aR + gapC(r.gap) + '>' + (r.gap != null ? bdi(l, nf(r.gap, l, 1)) : '-') + $q.aS + esc(KL(l, r.k)) + $q.az + esc(fd(r.comp, l)) + $q.aS + projTxt(l, r) + $q.aS + ext(r.src) + $q.aA), fill(t(l, 'p_cap'), { n: nf(tot, l), p: pg })) +
(tot > pg * PER ? $q.aT + base + '?' + (k ? 'k=' + k + '&' : '') + (dv ? 'd=' + dv + '&' : '') + 'page=' + (pg + 1) + '">' + esc(t(l, 'next')) + $q.aL : '')) +
sec(t(l, $q.aU), [$q.aV, 'gap', $q.aW].map(x => '<p>' + esc(t(l, 'pm_' + x)) + '</p>').join('') + $q.aX + esc(t(l, $q.aY)) + '</b> ' + esc(t(l, $q.aZ)) + '</p>' + $q.x + esc(fill(t(l, 'p_src'), { n: nf(s.dld_records, l), m: nf(s.multi_readings, l) })) + '</p>') +
files(l, [$q.aC, $q.ba, $q.bb]);
return page(shell, l, Object.assign(H(l, 'pace'), { path: $q.aE, body: b, updated: d.built, crumb: [[t(l, 'dubai'), pre(l) + $q.bc]], noindex: !!(k || dv || pg > 1) }));
}
function paceLine(l, r) {
if (!r || r.k === 'na') return '';
return $q.bd + esc(t(l, 'pb_h')) + $q.be + esc(fill(t(l, 'pb_1'), { p: nf(r.pct, l, 1), d: fd(r.pd, l), e: nf(Math.min(r.el, 100), l, 0), s: fd(r.start || r.reg, l), c: fd(r.comp, l) })) + (r.gap != null ? ' ' + esc(fill(t(l, 'pb_g'), { g: nf(r.gap, l, 1) })) : '') + '</p>' +
(r.proj ? $q.aX + esc(fill(t(l, 'pb_2'), { a: fd(r.proj[0], l, 1), b: fd(r.proj[1], l, 1) })) + '</b> ' + esc(t(l, $q.bf)) + '</p>' : '') +
$q.bg + pre(l) + $q.bh + esc(t(l, 'pb_m')) + $q.bi + ext(r.src) + $q.bj;
}
function boxSvg(l, a) {
const lo = Math.min(a.ask_q[0], a.reg_q[0], ...(a.rows || []).map(x => x.ppm)) * .95, hi = Math.max(a.ask_q[1], a.reg_q[1], ...(a.rows || []).map(x => x.ppm)) * 1.05, W = 520, X = v => Math.round(10 + (W - 20) * (v - lo) / (hi - lo));
const bar = (y, q, m, c, lab) => $q.bk + X(q[0]) + '" y="' + y + $q.ai + Math.max(2, X(q[1]) - X(q[0])) + $q.bl + c + $q.bm + X(m) + $q.bn + X(m) + $q.bo + (y - 3) + $q.bp + (y + 21) + $q.bq + c + $q.br + (y - 6) + $q.bs + esc(lab) + $q.bt;
const dots = (a.rows || []).map(x => $q.bu + X(x.ppm) + $t.k4).join('');
return $q.bv + W + $q.bw + esc(t(l, 'a_svg')) + $t.k5 + bar(30, a.ask_q, a.ask_med, $q.bx, t(l, 'a_ask')) + dots + bar(75, a.reg_q, a.reg_med, $q.by, t(l, 'a_reg')) + $q.bz;
}
async function askPage(env, shell, l, slug) {
const d = await file(env, $q.bA); if (!d) return null;
const R = d.registered, base = pre(l) + $q.bB;
const gap = a => $q.bC + (a.gap_ci && a.gap_ci[0] > 0 ? ' bad' : '') + '">' + bdi(l, (a.gap_pct > 0 ? '+' : '') + nf(a.gap_pct, l, 1) + '%') + (a.gap_ci ? $q.aP + bdi(l, nf(a.gap_ci[0], l, 1) + '…' + nf(a.gap_ci[1], l, 1) + '%') + $q.ag : '') + '</td>';
const meth = sec(t(l, $q.aU), [$q.bD, $q.bE, $q.bF, 'gap'].map(x => '<p>' + esc(t(l, 'am_' + x)) + '</p>').join('') + $q.aX + esc(t(l, $q.aY)) + '</b> ' + esc(t(l, $q.bG)) + $q.bH + esc(fill(t(l, $q.bI), { s: R.source, p: R.period_text, n: nf(R.n, l) })) + ' ' + ext(R.url) + '</p>') + files(l, [$q.bA, $q.bJ, $q.ba]);
if (slug) {
const a = d.areas.find(x => x.slug === slug && x.page); if (!a) return null;
const b = $q.bK + esc(t(l, $q.bL)) + '</p>' + kpis([[bdi(l, 'AED ' + nf(a.ask_med, l)), fill(t(l, 'a_k1'), { n: nf(a.n_ask, l) })], [bdi(l, 'AED ' + nf(a.reg_med, l)), fill(t(l, 'a_k2'), { n: nf(a.reg_n, l) })], [bdi(l, (a.gap_pct > 0 ? '+' : '') + nf(a.gap_pct, l, 1) + '%'), t(l, 'a_k3') + (a.gap_ci ? ' (' + t(l, 'ci') + ' ' + nf(a.gap_ci[0], l, 1) + '…' + nf(a.gap_ci[1], l, 1) + '%)' : '')]]) +
boxSvg(l, a) + $q.x + esc(fill(t(l, 'a_box'), { a: nf(a.ask_q[0], l), b: nf(a.ask_q[1], l), c: nf(a.reg_q[0], l), d: nf(a.reg_q[1], l) })) + '</p>' +
sec(t(l, 'a_pr'), table(t(l, 'a_pth'), a.rows.map(x => $q.aM + pU(l, x.s) + '">' + esc(x.n) + $q.aN + esc(x.dv) + $q.aO + bdi(l, nf(x.ppm, l)) + $q.az + bdi(l, nf(x.pmin, l)) + $q.az + bdi(l, nf(x.smin, l)) + $q.aA))) + meth;
return page(shell, l, { h1: fill(t(l, $q.bM), { a: a.area }), lead: fill(t(l, $q.bN), { a: a.area, n: a.n_ask, r: nf(a.reg_n, l) }), k: 'ask', path: $q.bB + slug + '/', body: b, updated: d.built, crumb: [[t(l, 'ask_t'), base]] });
}
const b = $q.bK + esc(t(l, $q.bL)) + '</p>' + kpis([[bdi(l, nf(d.summary.projects, l)), t(l, 'a_s1')], [bdi(l, nf(d.summary.areas, l)), t(l, 'a_s2')], [bdi(l, nf(d.summary.area_pages, l)), t(l, 'a_s3')], [bdi(l, nf(R.n, l)), t(l, 'a_s4')]]) +
sec(t(l, $q.bO), table(t(l, 'a_th'), d.areas.map(a => $q.bP + (a.page ? $q.i + base + a.slug + '/">' + esc(a.area) + '</a>' : esc(a.area)) + $q.bQ + nf(a.n_ask, l) + $q.az + bdi(l, nf(a.ask_med, l)) + (a.ask_ci ? $q.aP + bdi(l, nf(a.ask_ci[0], l) + '…' + nf(a.ask_ci[1], l)) + $q.ag : '') + $q.az + bdi(l, nf(a.reg_med, l)) + $q.bR + nf(a.reg_n, l) + $q.bS + gap(a) + '</tr>'), t(l, 'a_cap'))) + meth;
return page(shell, l, Object.assign(H(l, 'ask'), { path: $q.bB, body: b, updated: d.built, crumb: [[t(l, 'dubai'), pre(l) + $q.bc]] }));
}
async function escPage(env, shell, l, u) {
const d = await file(env, $q.bT); if (!d) return null;
const base = pre(l) + $q.bU, bs = (u.searchParams.get('b') || '').replace(/[^a-z0-9-]/g, ''), one = bs && d.banks.find(x => x.slug === bs);
let b = $q.bK + esc(t(l, $q.bV)) + '</p>' + kpis([[bdi(l, nf(d.summary.banks, l)), t(l, 'e_k1')], [bdi(l, nf(d.summary.projects, l)), fill(t(l, 'e_k2'), { n: nf(d.summary.dld_records, l) })]]) +
sec(t(l, $q.bW), table(t(l, 'e_th'), d.banks.map(x => $q.aM + base + '?b=' + x.slug + $q.bX + esc(x.bank) + $q.bY + nf(x.n, l) + $q.az + nf(x.developers, l) + $q.az + nf(x.units, l) + $q.az + bdi(l, nf(x.pct_med, l, 1) + '%') + $q.az + nf(x.finished, l) + $q.az + nf(x.past_comp, l) + $q.az + bdi(l, nf(x.behind, l) + ' / ' + nf(x.compared, l)) + $q.az + nf(x.moved, l) + $q.aA), t(l, 'e_cap')));
if (one) b += sec(one.bank, table(t(l, 'e_pth'), one.rows.map(r => $q.aM + pU(l, r.s) + '">' + esc(r.n) + $q.aN + (r.dvs ? $q.i + dU(l, r.dvs) + '">' + esc(r.dv) + '</a>' : esc(r.dv)) + $q.aO + (r.pct != null ? bdi(l, nf(r.pct, l, 1) + '%') : '-') + $q.aP + esc(fd(r.pd, l)) + $q.aQ + esc(fd(r.comp, l)) + $q.az + nf(r.units, l) + $q.aS + esc(r.k ? KL(l, r.k) : '-') + $q.aS + ext(r.src) + $q.aA)), 'bank');
else b += '<p>' + esc(t(l, $q.bZ)) + '</p>';
b += sec(t(l, $q.aU), ['bank', 'past', 'moved', $q.aD].map(x => '<p>' + esc(t(l, 'em_' + x)) + '</p>').join('') + $q.aX + esc(t(l, $q.aY)) + '</b> ' + esc(t(l, $q.ca)) + '</p>') + files(l, [$q.bT, $q.ba]);
return page(shell, l, Object.assign(H(l, 'esc'), { path: $q.bU, body: b, updated: d.built, crumb: [[t(l, 'regs'), pre(l) + $q.cb]], noindex: !!bs }));
}
const SK = l => t(l, 'sk') || {};
function evRow(l, e, withDev, names) {
const k = SK(l)[e.k] || e.k;
let det = '';
if (e.k === $q.cc) det = $q.cd + esc(e.f) + $q.ce + bdi(l, esc(String(e.a == null ? '-' : e.a)) + $q.cf + esc(String(e.b == null ? '-' : e.b)) + '</b>') + $q.aP + esc(e.t) + $q.ag;
else if (e.k === 'court') det = esc(e.t) + (e.w ? $q.aP + esc(e.w) + $q.ag : '') + (e.r ? $q.aP + esc(e.r) + $q.ag : '');
else if (e.k === $q.cg) det = esc(fill(t(l, $q.ch), { s: e.t }));
else if (e.k === $q.ci) det = esc(e.t) + ': ' + bdi(l, esc(e.a == null ? '-' : String(e.a)) + $q.cf + esc(e.b == null ? '-' : String(e.b)) + '</b>');
else det = esc(e.t || '');
return $q.ay + esc(fd(e.d, l)) + $q.aS + esc(k) + '</td>' + (withDev ? $q.cj + dU(l, e.dv) + $q.ck + esc((names && names[e.dv] && names[e.dv][0]) || e.dv) + $q.cl : '') + '<td>' + (e.s ? $q.i + pU(l, e.s) + '">' + esc(e.s) + '</a>' : '-') + $q.cm + det + $q.aS + ext(e.u) + $q.aA;
}
async function sigPage(env, shell, l, u, dv) {
const ix = await file(env, $q.cn); if (!ix) return null;
const k = ix.kinds.includes(u.searchParams.get('k')) ? u.searchParams.get('k') : '';
const meth = sec(t(l, $q.aU), paras(l, 's_m') + '<ul>' + Object.entries(ix.sources).map(([a, b]) => '<li>' + esc(a.split('|').map(x => SK(l)[x] || x).join(', ')) + $q.co + esc(b) + $q.cp).join('') + '</ul>') + files(l, [$q.cn, $q.cq, $q.ba]);
if (dv) {
const sh = await file(env, $q.cq), x = sh && sh.p && sh.p[dv];
if (!x) return null;
const c = {}; x.e.forEach(e => { c[e.k] = (c[e.k] || 0) + 1; });
const es = x.e.filter(e => !k || e.k === k);
const base = dU(l, dv) + $q.cr;
const b = $q.bK + esc(t(l, $q.cs)) + '</p>' + filt(l, base, 'k', k, ix.kinds.filter(q => c[q]).map(q => [q, (SK(l)[q] || q) + ' (' + nf(c[q], l) + ')'])) +
table(t(l, 's_th'), es.slice(0, 400).map(e => evRow(l, e, false)), fill(t(l, 's_cap'), { n: nf(es.length, l) })) + $q.ct + dU(l, dv) + '">' + esc(fill(t(l, $q.cu), { d: x.n })) + $q.cv + pre(l) + $q.cw + esc(t(l, 'tr')) + $q.aL + meth;
return page(shell, l, { h1: fill(t(l, $q.cx), { d: x.n }), lead: fill(t(l, $q.cy), { d: x.n, n: nf(x.e.length, l) }), k: 'sig', path: $q.k + dv + $q.cz, body: b, updated: ix.built, crumb: [[t(l, 'devs'), pre(l) + $q.k], [x.n, dU(l, dv)]], noindex: !!k || x.e.length < 3 });
}
const base = pre(l) + $q.cz, ev = ix.latest.filter(e => !k || e.k === k);
const top = Object.entries(ix.developers).sort((a, b) => b[1][1] - a[1][1] || a[0].localeCompare(b[0])).slice(0, 40);
const b = $q.bK + esc(t(l, $q.cs)) + '</p>' + kpis(ix.kinds.filter(q => ix.counts[q]).map(q => [bdi(l, nf(ix.counts[q], l)), SK(l)[q] || q])) +
sec(t(l, $q.cA), filt(l, base, 'k', k, ix.kinds.filter(q => ix.counts[q] && q !== 'added' && q !== $q.cB).map(q => [q, SK(l)[q] || q])) + table(t(l, 's_thd'), ev.slice(0, 150).map(e => evRow(l, e, true, ix.developers)))) +
sec(t(l, 's_top'), $q.cC + top.map(([s, v]) => $q.B + dU(l, s) + $q.ck + esc(v[0]) + ' (' + nf(v[1], l) + $q.cD).join('') + $q.cE + esc(fill(t(l, 's_all'), { n: nf(Object.keys(ix.developers).length, l) })) + '</p>') + meth;
return page(shell, l, Object.assign(H(l, 'sig'), { path: $q.cz, body: b, updated: ix.built, noindex: !!k }));
}
async function conPage(env, shell, l, u) {
const d = await file(env, $q.cF); if (!d) return null;
const f = [$q.cG, 'units', 'price'].includes(u.searchParams.get('f')) ? u.searchParams.get('f') : '', ps = (u.searchParams.get('p') || '').replace(/[^a-z0-9-]/g, '');
const xs = d.items.filter(x => (!f || x.f === f) && (!ps || x.s === ps)), base = pre(l) + $q.cH;
const side = x => '<b>' + esc(x.src) + '</b>' + (x.d ? $q.cI + esc(fill(t(l, 'c_rd'), { d: fd(x.d, l) })) + $q.cJ : '') + $q.cK + esc(x.t) + $q.ag + (x.u ? '<br>' + ext(x.u) : '');
const df = x => x.f === $q.cG ? fill(t(l, 'c_mo'), { n: nf(x.g, l) }) : fill(t(l, 'c_pc'), { n: nf(x.g, l) });
const b = $q.bK + esc(t(l, $q.cL)) + '</p>' + kpis([[bdi(l, nf(d.items.length, l)), t(l, 'c_k1')], [bdi(l, nf(d.projects, l)), fill(t(l, 'c_k2'), { n: nf(d.projects_read, l) })]]) +
filt(l, base, 'f', f, [$q.cG, 'units', 'price'].map(q => [q, t(l, 'cf_' + q) + ' (' + nf(d.counts[q] || 0, l) + ')'])) +
table(t(l, 'c_th'), xs.map(x => $q.aM + pU(l, x.s) + '">' + esc(x.n) + $q.aN + (x.dvs ? $q.i + dU(l, x.dvs) + '">' + esc(x.dv) + '</a>' : esc(x.dv)) + ' · ' + esc(x.mk) + $q.cM + esc(t(l, 'cf_' + x.f)) + $q.aS + side(x.a) + $q.aS + side(x.b) + $q.az + esc(df(x)) + $q.aA)) +
sec(t(l, $q.aU), [$q.cN, $q.cG, 'units', 'price', $q.cO].map(x => '<p>' + esc(t(l, 'cm_' + x)) + '</p>').join('') + $q.aX + esc(t(l, $q.aY)) + '</b> ' + esc(t(l, $q.cP)) + $q.cQ + pre(l) + $q.cR + esc(t(l, $q.cS)) + $q.aL) + files(l, [$q.cF, $q.ba]);
return page(shell, l, Object.assign(H(l, 'con'), { path: $q.cH, body: b, updated: d.built, crumb: [DS(l)], noindex: !!(f || ps) }));
}
async function aliPage(env, shell, l, nonce) {
const d = await file(env, $q.cT); if (!d) return null;
const nm = d.rows.filter(r => r[1] !== $q.cU), mk = d.rows.filter(r => r[1] === $q.cU);
const row = r => $q.bP + (r[1] === $q.cV ? $q.i + dU(l, r[2]) + '">' + esc(r[0]) + '</a>' : r[1] === $q.cW ? $q.i + pU(l, r[2]) + '">' + esc(r[0]) + '</a>' : $q.i + pre(l) + '/m/' + esc(r[2]) + '/">' + esc(r[0]) + '</a>') + $q.cX + ({ Arabic: 'ar', Chinese: 'zh', Cyrillic: 'ru', Thai: 'th' }[r[4]] || 'und') + '">' + esc(r[3]) + $q.aS + esc(r[4]) + $q.aS + esc((t(l, 'al_b') || {})[r[5]] || r[5]) + $q.aA;
const b = $q.bK + esc(t(l, $q.cY)) + '</p>' + kpis(Object.entries(d.counts).map(([a, n]) => [bdi(l, nf(n, l)), a])) +
sec(t(l, $q.cZ), $q.da + l + $q.db + esc(t(l, 'al_ph')) + $q.dc + esc(t(l, $q.dd)) + $q.de + esc(t(l, $q.df)) + $q.dg + esc(t(l, $q.dh)) + $t.k6 + esc(t(l, $q.di)) + $t.k7 + esc(t(l, 'al_ph')) + $t.k8 + nonceOf(nonce) + $q.dj + V + $q.dk) +
sec(t(l, $q.dl), '<ol>' + [].concat(t(l, $q.dm) || []).map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>' + (d.key_collisions.length ? $q.x + esc(fill(t(l, $q.dn), { n: d.key_collisions.length })) + ' ' + d.key_collisions.slice(0, 12).map(c => $q.cd + esc(c[0]) + $q.do + c[1].map(s => $q.i + dU(l, s) + '">' + esc(s) + '</a>').join(', ')).join(' · ') + '</p>' : '')) +
sec(t(l, $q.dp), table(t(l, 'al_th'), nm.map(row))) + $q.av + esc(fill(t(l, 'al_mk'), { n: nf(mk.length, l) })) + $q.aw + table(t(l, 'al_th'), mk.map(row)) + $q.aB +
files(l, [$q.cT, $q.dq, $q.ba]);
return page(shell, l, Object.assign(H(l, 'ali'), { path: $q.dr, body: b, updated: d.built, crumb: [DS(l)] }));
}
async function dicPage(env, shell, l) {
const d = await file(env, $q.ds); if (!d) return null;
const DF = t(l, 'df') || {}, ST = t(l, 'st') || {};
const cell = v => $q.dt + (v < 20 ? $q.du : '') + '>' + v + $q.dv;
const b = '<p>' + esc(fill(t(l, $q.dw), { n: nf(d.rows, l), v: d.dataset })) + '</p>' +
table([t(l, 'd_f'), t(l, 'd_ty'), t(l, 'd_def'), t(l, 'd_cov'), t(l, 'd_src')].concat(d.markets.map(m => m)), d.fields.map(f => $q.dx + f.f + $q.dy + esc(f.f) + $q.dz + esc(f.type) + $q.dA + esc(DF[f.f] || f.def) + $q.az + bdi(l, nf(f.cov, l, 1) + '%') + $q.bR + nf(f.n, l) + $q.dB + esc(f.src.split(', ').map(x => ST[x] || x).join(', ')) + '</td>' + d.markets.map(m => cell(f.per[m])).join('') + '</tr>'), fill(t(l, 'd_cap'), { m: d.markets.map(m => m + ' ' + d.market_rows[m]).join(', ') })) +
sec(t(l, $q.dC), '<ul>' + Object.keys(d.source_types).map(k => $q.dD + esc(ST[k] || k) + $q.dE + esc((t(l, 'st_d') || {})[k] || d.source_types[k]) + '</li>').join('') + '</ul>') +
sec(t(l, $q.dF), '<p>' + esc(t(l, $q.dG)) + '</p>') + files(l, [$q.ds, $q.dH, $q.dI, $q.ba]);
return page(shell, l, Object.assign(H(l, 'dic'), { path: $q.dJ, body: b, updated: d.built, crumb: [DS(l)], type: $q.dK }));
}
const strings = (l, ks) => { const o = { _loc: LOC[l] || 'en-GB', _l: l }; ks.forEach(k => { o[k] = t(l, k); }); return JSON.stringify(o).replace(/</g, $q.dL); };
async function difPage(env, shell, l, nonce) {
const ix = await file(env, $q.dM); if (!ix) return null;
const days = [ix.entries[0].from].concat(ix.entries.map(e => e.to));
const b = '<p>' + esc(t(l, $q.dN)) + $q.dO + esc(t(l, $q.dP)) + $q.dQ + days.map((d, i) => $q.dR + d + '"' + (i === days.length - 2 ? $q.dS : '') + '>' + esc(fd(d, l)) + $q.dT).join('') + $q.dU + esc(t(l, 'f_to')) + $q.dV + days.map((d, i) => $q.dR + d + '"' + (i === days.length - 1 ? $q.dS : '') + '>' + esc(fd(d, l)) + $q.dT).join('') + $t.k9 + esc(t(l, 'f_go')) + $s.k0 +
$t.k10 + strings(l, [$q.dW, 'f_res', 'f_add', 'f_rem', 'f_chg', $q.dX, 'f_rec', 'f_th', 'f_fth', $q.dY, 'f_err', $q.dZ, $q.ea, $q.eb, $q.ec]) + $q.ed + nonceOf(nonce) + $q.ee + V + $q.dk +
sec(t(l, $q.aU), paras(l, 'f_m')) + files(l, [$q.dM, $q.ef, $q.eg + days[days.length - 1]]);
return page(shell, l, Object.assign(H(l, 'dif'), { path: $q.eh, body: b, updated: days[days.length - 1], crumb: [DS(l)] }));
}
async function qaPage(env, shell, l, nonce) {
const b = '<p>' + esc(t(l, $q.ei)) + $t.k11 + esc(t(l, 'q_lab')) + $t.k12 + esc((t(l, 'q_ex') || [''])[0]) + $t.k13 + esc(t(l, 'q_go')) + $q.ej +
$q.x + esc(t(l, 'q_try')) + $q.ek + [].concat(t(l, 'q_ex') || []).map(x => $t.k14 + esc(x) + '">' + esc(x) + $q.el).join('') + '</ul>' +
$s.k1 + strings(l, ['q_sql', $q.em, $q.en, $q.eo, 'q_err', $q.ep, $q.eq, $q.er, 'q_run', 'q_c']) + $q.ed + nonceOf(nonce) + $q.es + V + $q.dk +
sec(t(l, $q.aU), paras(l, 'q_m')) + $q.ct + pre(l) + $q.et + esc(t(l, $q.eu)) + $q.cv + pre(l) + $q.ev + esc(t(l, 'dic_t')) + $q.aL + files(l, [$q.ew, $q.ex, $q.dH]);
return page(shell, l, Object.assign(H(l, 'qa'), { path: $q.ey, body: b, crumb: [DS(l)] }));
}
async function satPage(env, shell, l, u) {
const d = await file(env, $q.ez); if (!d) return null;
const ms = d.months.map(m => m[0]), m = ms.includes(u.searchParams.get('m')) ? u.searchParams.get('m') : ms[0];
const xs = d.items.filter(x => x.m_last === m), big = xs.filter(x => Math.abs(x.ch) >= 5);
const b = $q.bK + esc(t(l, $q.eA)) + '</p>' + filt(l, pre(l) + $q.eB, 'm', m === ms[0] ? '' : m, ms.slice(1, 12).map(x => [x, fd(x + '-15', l, 1) + ' (' + d.months.find(y => y[0] === x)[1] + ')'])).replace('>' + esc(t(l, 'all')) + '<', '>' + esc(fd(ms[0] + '-15', l, 1)) + '<') +
kpis([[bdi(l, nf(xs.length, l)), fill(t(l, 'v_k1'), { m: fd(m + '-15', l, 1) })], [bdi(l, nf(big.length, l)), t(l, 'v_k2')], [bdi(l, nf(big.filter(x => x.ch > 0).length, l)), t(l, 'v_k3')]]) +
table(t(l, 'v_th'), xs.slice(0, 120).map(x => $q.aM + pU(l, x.s) + '">' + esc(x.n) + $q.aN + esc(x.mk) + $q.aO + esc(fd(x.m_prev + '-15', l, 1)) + ': ' + bdi(l, nf(x.v_prev, l)) + $q.az + esc(fd(x.m_last + '-15', l, 1)) + ': ' + bdi(l, nf(x.v_last, l)) + $q.eC + (Math.abs(x.ch) >= 5 ? '' : ' k-xs') + '"><b>' + bdi(l, (x.ch > 0 ? '+' : '') + nf(x.ch, l)) + $q.eD + bdi(l, nf(x.raw_prev, l) + ' → ' + nf(x.raw_last, l)) + $q.aS + (x.up ? esc(fd(x.up + '-15', l, 1)) : '-') + $q.aA), fill(t(l, 'v_cap'), { n: nf(xs.length, l) })) +
sec(t(l, $q.aU), '<p>' + esc(t(l, 'v_m')) + $q.eE + esc(t(l, $q.aY)) + '</b> ' + esc(t(l, 'v_lim')) + $q.bH + esc(d.source.attribution || '') + ' · ' + ext(d.source.url) + $q.cQ + pre(l) + $q.eF + esc(t(l, 'v_ci')) + $q.aL) + files(l, [$q.ez, $q.eG, $q.ba]);
return page(shell, l, Object.assign(H(l, 'sat'), { path: $q.eB, body: b, updated: d.built, crumb: [[t(l, 'sats'), pre(l) + $q.eH]], noindex: m !== ms[0] }));
}
const links = (l, ks, h) => $q.eI + (l === 'ar' ? $q.I : '') + '>' + (h ? '<h2>' + esc(h) + '</h2>' : '') + $q.cC + ALL.filter(x => ks.includes(x[0])).map(x => $q.B + pre(l) + x[1] + '">' + esc(t(l, x[0] + '_t')) + $q.E).join('') + $q.eJ;
const shipped = l => $t.k15 + (l === 'ar' ? $q.I : '') + '>' + $q.a + '<h2>' + esc(t(l, $q.eK)) + $q.eL + esc(t(l, $q.eM)) + $q.eN + ALL.map(x => $q.B + pre(l) + x[1] + '">' + esc(t(l, x[0] + '_t')) + $q.eO + esc(t(l, x[0] + '_s')) + '</li>').join('') + $q.eJ;
async function projBlock(env, l, slug) {
const [pc, cd] = await Promise.all([file(env, $q.aC), file(env, $q.cF)]);
let h = '';
const r = pc && pc.rows.find(x => x.s === slug); if (r) h += paceLine(l, r);
const c = cd && cd.items.filter(x => x.s === slug);
if (c && c.length) h += $q.eP + esc(t(l, 'cb_h')) + '</b> ' + c.map(x => esc(t(l, 'cf_' + x.f)) + ': ' + esc(x.a.src) + ' / ' + esc(x.b.src)).join('; ') + $q.eQ + pre(l) + $q.eR + slug + $q.aK + esc(t(l, 'cb_m')) + $q.aL;
return h ? $q.eS + (l === 'ar' ? $q.I : '') + $s.k2 + h + $q.w : '';
}
async function devBlock(env, l, dv) {
const ix = await file(env, $q.cn), x = ix && ix.developers[dv]; if (!x) return '';
return $t.k16 + (l === 'ar' ? $q.I : '') + $q.eT + dU(l, dv) + $q.ck + esc(fill(t(l, 'db'), { n: nf(x[1], l) })) + $q.eU + esc(fill(t(l, 'db_l'), { d: fd(x[2], l) })) + $q.eV;
}
export async function inject(req, u, env, r, nonce) {
try {
if (!/text\/html/.test(r.headers.get($q.eW) || '')) return r;
const m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(.*)$/.exec(u.pathname), l = m[1] || 'en', p = m[2];
if (!(await loadT(env))) return r;
let h = '', sel = 'main', where = $q.eX, mm;
if (p === $q.eY || p === 'yc/') h = shipped(l);
else if ((mm = /^projects\/([a-z0-9-]{1,90})\/$/.exec(p))) { h = await projBlock(env, l, mm[1]); sel = $q.eZ; }
else if ((mm = /^developers\/([a-z0-9-]{1,90})\/$/.exec(p))) { h = await devBlock(env, l, mm[1]); sel = $q.fa; where = $q.fb; }
else if (p === $q.fc) { const pc = await file(env, $q.aC), su = pc && pc.summary; h = links(l, ['pace', 'ask', 'esc'], t(l, 'mk_h')); if (su) h = h.replace($q.cC, '<p>' + esc(fill(t(l, 'mk_p'), { n: nf(su.compared, l), b: nf(su.behind_pct, l, 1), g: nf(su.median_gap_pts, l, 1) })) + $q.fd); }
else if (p === 'data/') h = links(l, ['dic', 'dif', 'qa', 'ali', 'con'], t(l, $q.fe));
else if (p === $q.ff) h = links(l, ['qa', 'dic']);
else if (p === $q.fg) h = links(l, ['esc', 'pace']);
else if (p === $q.fh) h = links(l, ['sat']);
else if (p === $q.fi) h = links(l, ['pace', 'ask', 'sig']);
if (!h) return r;
let done = false;
const out = new HTMLRewriter().on(sel, { element(e) { if (done) return; done = true; if (where === $q.fb) e.before(h, { html: true }); else e.append(h, { html: true }); } });
if (sel !== 'main') out.on('main', { element(e) { e.onEndTag(end => { if (!done) { done = true; end.before(h, { html: true }); } }); } });
return out.transform(r);
} catch (e) { return r; }
}
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname; let m;
if (!PATHS.test(p) || (req.method !== 'GET' && req.method !== 'HEAD')) return null;
if (!(await loadT(env))) return null;
if (!p.endsWith('/')) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } });
const L = x => x || 'en', nonce = '';
if ((m = R.pace.exec(p))) return pacePage(env, shell, L(m[1]), u);
if ((m = R.ask.exec(p))) return askPage(env, shell, L(m[1]), m[2] || null);
if ((m = R.esc.exec(p))) return escPage(env, shell, L(m[1]), u);
if ((m = R.sig.exec(p))) return sigPage(env, shell, L(m[1]), u, null);
if ((m = R.dsig.exec(p))) return sigPage(env, shell, L(m[1]), u, m[2]);
if ((m = R.con.exec(p))) return conPage(env, shell, L(m[1]), u);
if ((m = R.ali.exec(p))) return aliPage(env, shell, L(m[1]), nonce);
if ((m = R.dic.exec(p))) return dicPage(env, shell, L(m[1]));
if ((m = R.dif.exec(p))) return difPage(env, shell, L(m[1]), nonce);
if ((m = R.qa.exec(p))) return qaPage(env, shell, L(m[1]), nonce);
if ((m = R.sat.exec(p))) return satPage(env, shell, L(m[1]), u);
return null;
}
