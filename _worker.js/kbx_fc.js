// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_fc__q, $s = TB.kbx_fc__s, $t = TB.kbx_fc__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { FT } from './kbx_fc_i18n.js';
import { jget } from './kbx_jget.js';
import { LOCALE } from './kbx_named_i18n.js';
import { placeName } from './kbx_hdate.js';
import { rpc } from './kolaboro.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:open|methods\/delivery-forecast)\/?$|^\/api\/x\/fc(?:\/|$)/;
const MIN_N = 20, MIN_K = 5, MIN_ND = 10, MIN_R = 10, RS_MIN = 5, Z = 1.959963984540054, KS = [0, 6, 12, 18, 24];
const COI = /^sumba$/i;
const VERSION = 'fc-km-1';
const FT2 = TB.kbx_fc_FT2 ;
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a, "'": '&#39;' }[c]));
const pre = l => l === 'en' ? '' : '/' + l;
function t(lang, k, v) { const s = (FT2[lang] && FT2[lang][k]) || (FT[lang] && FT[lang][k]) || FT2.en[k] || FT.en[k] || k; return v ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; }
const dtf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'd' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.DateTimeFormat(L, o)); };
const nmf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'n' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.NumberFormat(L, o)); };
const nf = (n, lang) => { try { return nmf(LOCALE[lang] || 'en-GB').format(n); } catch (e) { return String(n); } };
const pct = (x, lang) => x == null ? '' : nf(Math.round(x * 100), lang) + '%';
const ym = i => { const y = Math.floor((i - 1) / 12), m = (i - 1) % 12 + 1; return y + '-' + String(m).padStart(2, '0'); };
function monthName(i, lang) { const s = ym(i); try { return dtf(LOCALE[lang] || 'en-GB', { month: 'long', year: $q.b, timeZone: 'UTC' }).format(new Date(Date.UTC(+s.slice(0, 4), +s.slice(5) - 1, 1))); } catch (e) { return s; } }
function dayName(d, lang) { if (!d) return ''; try { return dtf(LOCALE[lang] || 'en-GB', { day: $q.b, month: 'short', year: $q.b, timeZone: 'UTC' }).format(new Date(String(d).slice(0, 10) + $q.c)); } catch (e) { return String(d).slice(0, 10); } }
function mi(s) {   // a promised date to a month index (year*12+month); quarters, halves and years read as their last month
  s = String(s || ''); let m;
  if ((m = s.match(/^(\d{4})-Q([1-4])$/i))) return +m[1] * 12 + +m[2] * 3;
  if ((m = s.match(/^(\d{4})-H([12])$/i))) return +m[1] * 12 + +m[2] * 6;
  if ((m = s.match(/^(\d{4})-(\d{2})/))) return +m[1] * 12 + +m[2];
  if ((m = s.match(/^(\d{4})$/))) return +m[1] * 12 + 12;
  return null;
}
const nowMi = () => { const d = new Date(); return d.getUTCFullYear() * 12 + d.getUTCMonth() + 1; };
function out(o, s, cc) { return new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': $q.d, 'access-control-allow-origin': '*', 'cache-control': cc || $q.e } }); }
let MEMO = {};
async function file(env, name, ttl) {
  const m = MEMO[name]; if (m && (m.a || Date.now() - m.t < (ttl || 300000))) return m.v;   // n20p: a copy read from this deployment's assets (a) does not expire
  const sh = (globalThis.__kbJson || {})[name]; if (sh && sh.v && (sh.a || Date.now() - sh.t < (ttl || 300000))) { MEMO[name] = { t: sh.t, v: sh.v, a: sh.a }; return sh.v; }   // n20p: reuse the copy kbx_named.js already parsed
  const o = await jget(env, name, ORIGIN + $q.f + name, ORIGIN + $q.g + name, 120); MEMO[name] = { t: Date.now(), v: o.v, a: o.a }; return o.v;   // n40 d14: shared parse
}
function km(R) {
const ts = [...new Set(R.filter(r => r.e).map(r => r.t))].sort((a, b) => a - b), steps = [];
let S = 1, v = 0;
for (const tt of ts) {
const n = R.filter(r => r.t >= tt).length, d = R.filter(r => r.t === tt && r.e).length;
S *= 1 - d / n; if (n > d) v += d / (n * (n - d));
steps.push({ t: tt, n, d, S: +S.toFixed(6), v: +v.toFixed(8) });
}
return steps;
}
function at(steps, x) { let S = 1, v = 0; for (const s of steps) { if (s.t <= x) { S = s.S; v = s.v; } else break; } return { S, v }; }
const risk = (R, x) => R.filter(r => r.t >= x).length;
function est(R, steps, t0, k) {
if (risk(R, Math.max(k, 0)) < MIN_R) return null;
const a = t0 < 0 ? { S: 1, v: 0 } : at(steps, t0), b = at(steps, k);
if (!a.S) return null;
const Sc = b.S / a.S, se = Math.sqrt(Math.max(0, b.v - a.v));
const lo = Math.max(0, Sc * Math.exp(-Z * se)), hi = Math.min(1, Sc * Math.exp(Z * se));
return { k, p: +(1 - Sc).toFixed(4), lo: +(1 - hi).toFixed(4), hi: +(1 - lo).toFixed(4), at_risk: risk(R, Math.max(k, 0)) };
}
function group(level, name, R) {
const k = R.filter(r => r.e).length, need = level === $q.h ? MIN_ND : MIN_N, steps = km(R);
const enough = R.length >= need && k >= MIN_K;
return { level, name, n: R.length, k, enough, need_n: need, need_k: MIN_K, steps, R,
by: KS.map(x => est(R, steps, -1, x)) };
}
const pub = g => g && { level: g.level, name: g.name, projects_past_first_date: g.n, handovers: g.k, enough: g.enough, needs: { projects: g.need_n, handovers: g.need_k },
  chance_by_months_after_first_date: g.enough || g.level === 'all' ? g.by.filter(Boolean).map(b => ({ months: b.k, chance: b.p, low: b.lo, high: b.hi, at_risk: b.at_risk })) : null,
  steps: g.enough || g.level === 'all' ? g.steps.map(s => ({ month: s.t, at_risk: s.n, handovers: s.d, still_waiting: s.S })) : null };
let FC = null;
export async function fcData(env) {
const [P, B] = await Promise.all([file(env, $q.i), file(env, $q.j)]);
const NOW = nowMi();
if (FC && FC.P === P && FC.B === B && FC.now === NOW) return FC;
const prom = P.projects || {}, rows = [], proj = {}, cnt = { no_promise: 0, ahead: 0, excluded: 0, events: 0, censored: 0 };
for (const c of B.cases || []) {
if (COI.test(String(c.market || ''))) continue;
const h = (prom[c.id] || []).find(p => p.k === $q.k), comp = c.stage === $q.l;
let first = null, cur = null, row = null, st;
if (h) {
const ds = [h.d, ...(h.hist || []).map(x => x.d)].map(mi).filter(x => x != null);
first = ds.length ? Math.min(...ds) : null; cur = mi(h.d);
}
if (first == null) {
if (comp && typeof c.done === $q.m) { const d = Math.max(0, Math.round(+c.delay || 0)); row = { t: d, e: 1 }; first = c.done * 12 + 12 - d; cur = c.done * 12 + 12; st = 'done'; }
else { cnt.no_promise++; proj[c.id] = { m: c.market, st: 'none' }; continue; }
} else if (comp || (h.ev && h.ev.what === 'done')) {
row = { t: h.st === 'kept' ? 0 : Math.max(0, cur - first), e: 1 }; st = 'done';
} else if (h.st === $q.n) { cnt.excluded++; st = $q.o; }
else if (NOW - first < 0) { cnt.ahead++; st = 'open'; }
else { row = { t: NOW - first, e: 0 }; st = 'open'; }
if (row) { row.id = c.id; row.m = c.market; rows.push(row); row.e ? cnt.events++ : cnt.censored++; }
proj[c.id] = { m: c.market, st, first, cur, t0: first != null ? NOW - first : null };
}
const byM = new Map(); for (const r of rows) { if (!byM.has(r.m)) byM.set(r.m, []); byM.get(r.m).push(r); }
const markets = new Map([...byM.entries()].map(([m, R]) => [m, group($q.p, m, R)]));
for (const id in proj) if (!markets.has(proj[id].m)) markets.set(proj[id].m, group($q.p, proj[id].m, []));
FC = { P, B, now: NOW, rows, proj, cnt, all: group('all', $q.q, rows), markets, devs: null, updated: P.updated || B.updated };
return FC;
}
async function devGroups(env, fc) {
if (fc.devs) return fc.devs;
const nm = await import('./kbx_named.js'), ix = await nm.data(env), byId = new Map(fc.rows.map(r => [r.id, r])), devs = new Map();
for (const dv of ix.devs.values()) devs.set(dv.s, group($q.h, dv.n, dv.ids.map(i => byId.get(i)).filter(Boolean)));
fc.devs = devs; return devs;
}
export function projectFc(fc, id, devGroup) {
const p = fc.proj[id]; if (!p) return null;
const mk = fc.markets.get(p.m) || group($q.p, p.m, []);
const g = devGroup && devGroup.enough ? devGroup : mk.enough ? mk : null;
const o = { id, status: p.st, first: p.first != null ? ym(p.first) : null, current: p.cur != null ? ym(p.cur) : null, months_since_first: p.t0, market: mk, group: g, pooled: fc.all, rows: [], pooled_rows: [], beyond: null };
if (p.st !== 'open' || p.first == null) return o;
const ks = p.t0 < 0 ? KS : [1, 2, 3, 4].map(i => (Math.floor(p.t0 / 6) + i) * 6);
const mk2 = G => ks.map(k => { const e = est(G.R, G.steps, p.t0 < 0 ? -1 : p.t0, k); return e && { ...e, date: ym(p.first + k) }; }).filter(Boolean);
if (g) o.rows = mk2(g); o.pooled_rows = mk2(fc.all);
const G = g || fc.all, cut = ks.find(k => risk(G.R, k) < MIN_R); if (cut != null) o.beyond = Math.max(0, cut - 6);
return o;
}
function rowsTable(rows, lang, rel, prj, kt) {
if (!rows.length) return '';
const lbl = r => rel ? (r.k === 0 ? t(lang, 'k0') : t(lang, 'kn', { m: r.k })) : esc(monthName(prj.first + r.k, lang)) + $q.r + esc(r.k === 0 ? t(lang, 'k0') : t(lang, 'kn', { m: r.k })) + $q.s;
return (kt ? $t.k0 : $t.k1) + esc(t(lang, 'th_by')) + $q.t + esc(t(lang, 'th_p')) + $q.t + esc(t(lang, 'th_ci')) + $q.u +
rows.map(r => $q.v + (rel ? esc(lbl(r)) : lbl(r)) + $q.w + pct(r.p, lang) + $t.k2 + Math.round(r.p * 100) + $q.x + pct(r.lo, lang) + ' - ' + pct(r.hi, lang) + $q.y).join('') + $q.z;
}
function gLine(g, lang) { return t(lang, g.level === $q.h ? 'g_dev' : g.level === 'all' ? 'g_all' : 'g_mk', { n: nf(g.n, lang), k: nf(g.k, lang), g: g.name }); }
const srcMark = (fc, lang) => $t.k3 + esc(t(lang, 'src')) + ', ' + esc(dayName(fc.updated, lang)) + '</a>';
export function fcProjectHtml(fc, x, lang, devGroup) {
try {
const o = projectFc(fc, x.id, devGroup); if (!o) return '';
let b = $q.A + esc(t(lang, 'fc_h')) + $q.B + esc(t(lang, $q.C)) + '</p>';
if (o.status === 'none') return b + $q.D + esc(t(lang, 'none')) + $q.E + $s.FC_CSS;
if (o.status === 'done') return b + $q.D + esc(t(lang, 'done')) + $q.E + $s.FC_CSS;
b += '<p>' + esc(t(lang, $q.F, { d: monthName(mi(o.first), lang) })) + (o.current && o.current !== o.first ? ' ' + esc(t(lang, $q.G, { d: monthName(mi(o.current), lang) })) : '') + ' ' + srcMark(fc, lang) + '</p>';
if (o.status === $q.o) return b + $q.D + esc(t(lang, 'excl1')) + '</p>' + methodLink(lang) + $q.H + $s.FC_CSS;
const cond = o.months_since_first >= 0 ? '<p>' + esc(t(lang, 'cond', { m: nf(o.months_since_first, lang) })) + '</p>' : '';
if (o.group) b += '<p>' + esc(gLine(o.group, lang)) + '</p>' + cond + (rowsTable(o.rows, lang, false, { first: mi(o.first) }) || '');
else {
const m = o.market;
b += $t.k4 + esc(t(lang, 'nd', { g: placeName(m.name, lang), n: nf(m.n, lang), k: nf(m.k, lang), N: MIN_N, K: MIN_K })) + $q.I;
return b + methodLink(lang) + $q.H + $s.FC_CSS;
}
if (o.beyond != null && o.rows.length) b += $q.J + esc(t(lang, $q.K, { m: o.beyond })) + '</p>';
else if (!o.rows.length) b += $q.J + esc(t(lang, $q.K, { m: Math.max(0, o.months_since_first) })) + '</p>';
return b + $q.J + esc(t(lang, 'bias')) + '</p>' + methodLink(lang) + $q.H + $s.FC_CSS;
} catch (e) { return ''; }
}
const methodLink = lang => $t.k5 + pre(lang) + $q.L + esc(t(lang, $q.M)) + $q.N + esc(t(lang, 'm_api')) + $q.O;
function curveSvg(g, lang) {
const W = 640, H = 250, L = 46, Rr = 14, T = 14, Bt = 40, maxK = 24;
const top = Math.max(.2, Math.ceil(Math.max(0, ...g.steps.filter(s => s.t <= maxK).map(s => 1 - s.S * Math.exp(-Z * Math.sqrt(s.v)))) * 10 + .5) / 10), yT = [0, .25, .5, .75, 1].map(f => f * Math.min(1, top));
const X = m => L + (W - L - Rr) * m / maxK, Y = p => T + (H - T - Bt) * (1 - p / Math.min(1, top));
const lim = KS.slice().reverse().find(k => risk(g.R, k) >= MIN_R); const end = lim == null ? 0 : Math.min(maxK, Math.max(lim, ...g.steps.filter(s => s.t <= maxK && s.n >= MIN_R).map(s => s.t)));
const pts = [{ t: 0, S: 1, v: 0 }, ...g.steps.filter(s => s.t <= end)];
let line = '', up = [], dn = [];
pts.forEach((s, i) => {
const nx = i + 1 < pts.length ? pts[i + 1].t : end, F = 1 - s.S, se = Math.sqrt(s.v);
const lo = 1 - Math.min(1, s.S * Math.exp(Z * se)), hi = 1 - Math.max(0, s.S * Math.exp(-Z * se));
line += (i ? 'L' : 'M') + X(s.t).toFixed(1) + ' ' + Y(F).toFixed(1) + 'L' + X(nx).toFixed(1) + ' ' + Y(F).toFixed(1);
up.push(X(s.t).toFixed(1) + ' ' + Y(hi).toFixed(1), X(nx).toFixed(1) + ' ' + Y(hi).toFixed(1)); dn.unshift(X(nx).toFixed(1) + ' ' + Y(lo).toFixed(1), X(s.t).toFixed(1) + ' ' + Y(lo).toFixed(1));
});
const gy = yT.map(p => $q.P + L + $q.Q + (W - Rr) + $q.R + Y(p).toFixed(1) + $q.S + Y(p).toFixed(1) + $q.T + (L - 6) + '" y="' + (Y(p) + 4).toFixed(1) + $q.U + Math.round(p * 100) + $q.V).join('');
const gx = KS.map(k => $q.W + X(k).toFixed(1) + '" y="' + (H - Bt + 18) + $q.X + k + $q.Y).join('');
return $t.k6 + W + ' ' + H + $q.Z + esc(t(lang, $q.aa)) + '">' + gy + gx +
$q.ab + up.concat(dn).join(' ') + $q.ac + line + '"/>' +
$q.W + ((L + W - Rr) / 2) + '" y="' + (H - 4) + $q.X + esc(t(lang, $q.ad)) + $q.ae + esc(t(lang, $q.aa)) + $q.af;
}
export async function fcMarketHtml(env, marketKey) {
try {
const fc = await fcData(env), lang = 'en';
const key = String(marketKey || '').toLowerCase().replace(/-/g, ' ');
const g = [...fc.markets.values()].find(m => String(m.name).toLowerCase() === key || encodeURIComponent(String(m.name).toLowerCase().replace(/\s+/g, '-')) === String(marketKey).toLowerCase());
if (!g || COI.test(g.name)) return '';
let b = $t.k7 + esc(t(lang, 'fc_h')) + ': ' + esc(g.name) + $q.ag + esc(t(lang, $q.C)) + '</p>';
if (g.enough) b += '<p>' + esc(gLine(g, lang)) + ' ' + srcMark(fc, lang) + '</p>' + rowsTable(g.by.filter(Boolean), lang, true, null, 1) + curveSvg(g, lang);
else b += $t.k8 + esc(t(lang, 'nd', { g: g.name, n: g.n, k: g.k, N: MIN_N, K: MIN_K })) + $t.k9 + fc.all.n + $t.k10 + fc.all.k + $t.k11 + esc(g.name) + '. ' + srcMark(fc, lang) + '</p>' + rowsTable(fc.all.by.filter(Boolean), lang, true, null, 1);
return b + $q.J + esc(t(lang, 'bias')) + '</p>' + methodLink(lang) + $q.ah + $s.FC_CSS;
} catch (e) { return ''; }
}
let RS_LIVE = null;
export async function rsData(env) {
if (RS_LIVE && Date.now() - RS_LIVE.t < 600000) return RS_LIVE.v;
try {
const [ya, dr] = await Promise.all([rpc($q.ai, {}), rpc($q.aj, { p_id: '' })]);
if (!ya || typeof ya !== $q.ak || !Array.isArray(dr)) throw new Error('shape');
const projects = {}, replies = {};
for (const g of ya.groups || []) if (g.grp === $q.al) projects[g.key] = { reported: g.n || 0, answered: g.answered || 0, median_days: g.median_days == null ? null : +g.median_days };
for (const r of dr) { if (!r || !r.project_id) continue; const o = replies[r.project_id] || (replies[r.project_id] = { approved: 0 }); o.approved++; }
const v = { version: $q.am, generated: new Date().toISOString(), live: true,
job: $s.k0,
sources: { asks: $s.k1 + (ya.min_sample || 5) + $q.an, replies: $t.k12 },
note: $s.k2,
licence: $t.k13, min_reported_per_project: ya.min_sample || 5,
totals: { asks_opened: ya.opened || 0, asks_reported: ya.reported || 0, projects_below_min: ya.projects_below_min || 0, replies_approved: dr.length }, projects, replies };
RS_LIVE = { t: Date.now(), v }; return v;
} catch (e) {
try { const v = await file(env, $q.ao, 600000); RS_LIVE = { t: Date.now() - 480000, v }; return v; } catch (e2) { return null; }
}
}
export async function devResponseJson(env) {
const v = await rsData(env);
if (!v) return out({ error: $q.ap }, 503, $q.aq);
return new Response(JSON.stringify(v, null, 1), { status: 200, headers: { 'content-type': $q.d, 'access-control-allow-origin': '*', 'cache-control': $q.e, 'x-kb-live': '1' } });
}
function rsAgg(rs, ids) {
const o = { opened: 0, reported: 0, answered: 0, days: [], replies: 0 };
o.meds = [];
for (const id of ids) { const a = (rs.projects || {})[id]; if (a) { o.opened += a.opened || 0; o.reported += a.reported || 0; o.answered += a.answered || 0; o.days.push(...(a.days || [])); if (a.median_days != null && !a.days) o.meds.push({ id, m: a.median_days, n: a.reported }); } const r = (rs.replies || {})[id]; if (r) o.replies += r.approved || 0; }
o.days.sort((a, b) => a - b);
if (o.meds.length === 1) o.median_days = o.meds[0].m;
else if (!o.meds.length) o.median_days = o.days.length >= RS_MIN ? (o.days.length % 2 ? o.days[(o.days.length - 1) / 2] : (o.days[o.days.length / 2 - 1] + o.days[o.days.length / 2]) / 2) : null;
else o.median_days = null;
return o;
}
export function rsDevHtml(rs, dv, lang, firstId) {
try {
if (!rs) return '';
const a = rsAgg(rs, dv.ids), name = dv.n;
const src = $t.k14 + esc(t(lang, rs.live ? $q.ar : 'rs_at', { d: dayName(rs.generated, lang) })) + '</a>';
let b = $q.as + esc(t(lang, $q.at)) + '</p>';
if (!a.reported && !a.replies) b += $q.au + esc(t(lang, rs.live && rs.totals && rs.totals.projects_below_min ? $q.av : $q.aw, { dev: name, k: rs.min_reported_per_project || RS_MIN })) + $q.ax + src + $t.k15 + encodeURIComponent(firstId) + '">' + esc(t(lang, $q.ay, { dev: name })) + $q.az;
else b += $q.aA + esc(t(lang, 'rs_q')) + $q.aB + nf(a.reported, lang) + ' ' + src + $q.aC + esc(t(lang, 'rs_a')) + $q.aB + nf(a.answered, lang) + $q.aC + esc(t(lang, $q.aD)) + $q.aB + (a.median_days != null ? nf(a.median_days, lang) : a.meds && a.meds.length > 1 ? a.meds.map(x => nf(x.m, lang) + $q.aE + esc(x.id) + $q.s).join(', ') : $q.aF + esc(t(lang, $q.aG, { k: RS_MIN })) + $q.aH) + $q.aC + esc(t(lang, 'rs_rr')) + $q.aB + nf(a.replies, lang) + $q.aI +
$t.k16 + encodeURIComponent(firstId) + '">' + esc(t(lang, $q.ay, { dev: name })) + $q.O;
return b + $t.k17 + esc(t(lang, $q.aJ)) + $q.aK + esc(t(lang, $q.aL, { k: RS_MIN })) + $q.aM;
} catch (e) { return ''; }
}
export const rsHeading = lang => t(lang, 'rs_h');
export async function fcDevGroup(env, slug) { try { const fc = await fcData(env), d = await devGroups(env, fc); return d.get(slug) || null; } catch (e) { return null; } }
let ON = null, ON_BUSY = null;
const ON_KEY = ORIGIN + '/__fc_open/v1', ON_FRESH = 60000, ON_STALE = 600000;
async function openNumbers(env, ctx) {
const age = v => Date.now() - Date.parse(v.generated);
const load = () => ON_BUSY || (ON_BUSY = openNumbers0(env).then(v => {
ON = v; ON_BUSY = null;
try { const p = caches.default.put(new Request(ON_KEY), new Response(JSON.stringify(v), { headers: { 'content-type': $q.aN, 'cache-control': $q.aO + ON_STALE / 1000 } })); if (ctx && ctx.waitUntil) ctx.waitUntil(p.catch(() => {})); } catch (e) {}
return v;
}, e => { ON_BUSY = null; throw e; }));
if (!ON || age(ON) > ON_FRESH) { try { const hit = await caches.default.match(new Request(ON_KEY)); if (hit) { const v = await hit.json(); if (v && v.generated && (!ON || Date.parse(v.generated) > Date.parse(ON.generated))) ON = v; } } catch (e) {} }
if (ON && age(ON) <= ON_FRESH) return ON;
if (ON && age(ON) <= ON_STALE && ctx && ctx.waitUntil) { ctx.waitUntil(load().catch(() => {})); return ON; }
return load();
}
async function openNumbers0(env) {
const S = p => p.then(v => ({ ok: true, v }), () => ({ ok: false, v: null }));
const [xl, met, push, al, log, tr, dep, ship, nmod, xl7] = await Promise.all([S(rpc($q.aP, { p_hours: 24 })), S(rpc($q.aQ, {})), S(rpc($q.aR, {})),
S(rpc($q.aS, {})), S(rpc($q.aT, {})), S(file(env, $q.aU, 120000)), S(file(env, $q.aV, 120000)), S(file(env, $q.aW, 120000)), S(import('./kbx_named.js')), S(rpc($q.aP, { p_hours: 168 }))]);
let named = null; if (nmod.ok) try { const ix = await nmod.v.data(env); named = { projects: ix.P.length, developers: ix.devs.size, languages: LANGS.length }; } catch (e) { named = null; }
let seal = null; try { const cs = await file(env, $q.j); seal = cs.seal ? { date: cs.seal.date, count: cs.seal.count } : null; } catch (e) {}
const m = met.ok && met.v ? met.v : null;
const weeksSt = m && Array.isArray(m.weeks) ? new Map(m.weeks.map(w => [w.week, w.stamps])) : new Map();
const T = tr.ok ? tr.v : null, X = xl.ok && xl.v ? xl.v.totals || null : null;
const wk = new Date(); wk.setUTCHours(0, 0, 0, 0); wk.setUTCDate(wk.getUTCDate() - ((wk.getUTCDay() + 6) % 7)); const thisWeek = wk.toISOString().slice(0, 10);
const ser = k => new Map(((T && T.series && T.series[k]) || []).map(([w, n]) => [w, n]));
const xs = ser($q.aX), xr = ser($q.aY), stH = ser($q.aZ);
const DAY = 864e5, wkT = w => Date.parse(w + $q.c), wkS = d => new Date(d).toISOString().slice(0, 10), tW = wkT(thisWeek);
const upto = k => { const c = T && T.complete_until && T.complete_until[k]; return (c ? wkT(c) : T ? Date.parse(T.generated) : 0) || 0; };
const full = (k, w) => wkT(w) + 7 * DAY <= upto(k);
const xsF = new Map([...xs].filter(([w]) => full($q.aX, w)));
const R7 = xl7 && xl7.ok && xl7.v && Array.isArray(xl7.v.recent) ? xl7.v.recent : null;
const thisN = R7 && (R7.length < 120 || R7.some(r => Date.parse(r.t) < tW)) ? R7.filter(r => Date.parse(r.t) >= tW).length : null;
const lastFull = [...xsF.keys()].sort().pop(), gap = [];
if (lastFull) for (let d = wkT(lastFull) + 7 * DAY; d < tW; d += 7 * DAY) gap.push(wkS(d));
const all = X && typeof X.all === $q.m ? X.all : null, sumF = [...xsF.values()].reduce((a, n) => a + n, 0), derived = new Map();
if (all != null && lastFull) {
if (!gap.length) derived.set(thisWeek, Math.max(0, all - sumF));
else if (gap.length === 1 && thisN != null) { derived.set(gap[0], Math.max(0, all - sumF - thisN)); derived.set(thisWeek, thisN); }
else if (thisN != null) derived.set(thisWeek, thisN);
}
const D = dep.ok ? (dep.v.deploys || []) : [];
const depW = new Map(); for (const d of D) { if (!d.at || d.result === $q.ba) continue; const x = new Date(d.at.slice(0, 10) + $q.c); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); const k = x.toISOString().slice(0, 10); depW.set(k, (depW.get(k) || 0) + 1); }
let weeks = [...new Set([...xs.keys(), ...weeksSt.keys(), ...gap, thisWeek])].filter(w => w <= thisWeek).sort().slice(-12);
const sealedOf = w => xsF.has(w) ? xsF.get(w) : derived.has(w) ? derived.get(w) : null;
const busy = w => (sealedOf(w) || 0) + (weeksSt.get(w) || 0) + (depW.get(w) || 0) + (xr.get(w) || 0) > 0;
const f0 = weeks.findIndex(busy); weeks = weeks.slice(f0 < 0 ? weeks.length - 1 : f0).slice(-8);
const runsTo = T ? String(T.generated).slice(0, 10) : null;
const rows = weeks.map(w => ({ week: w, current: w === thisWeek,
xrays_sealed: sealedOf(w), xrays_sealed_from: xsF.has(w) ? $q.bb : derived.has(w) ? $q.bc : undefined,
xray_runs: xr.has(w) ? xr.get(w) : null, xray_runs_partial_until: xr.has(w) && !full($q.aY, w) ? runsTo : undefined,
bitcoin_stamps: weeksSt.has(w) ? weeksSt.get(w) : full($q.aZ, w) && stH.has(w) ? stH.get(w) : null, deploys_checked_live: depW.get(w) || 0 }));
const unknown = gap.filter(w => !derived.has(w)), cu = unknown.length ? unknown[0] : thisWeek;
const freeze = { complete_until: { xrays_sealed: cu, bitcoin_stamps: thisWeek }, xrays_sealed: [...derived].filter(([w]) => w < cu), bitcoin_stamps: [...weeksSt].filter(([w]) => w < thisWeek) };
const sh = ship.ok ? ship.v : null, ctl = sh && sh.metrics && sh.metrics.commit_to_live;
const d7 = Date.now() - 7 * 864e5, dep7 = D.filter(d => d.at && Date.parse(d.at) >= d7 && d.result !== $q.ba);
const heads = log.ok && log.v && Array.isArray(log.v.heads) ? log.v.heads : [];
return {
generated: new Date().toISOString(), version: $q.bd, note: $t.k18,
xrays: { sealed_total: X ? X.all : null, last_24h: X ? X.h24 : null, markets_24h: X ? X.markets : null, source: $t.k19 },
pages: Object.assign({ source: $q.be }, named || { projects: null, developers: null, languages: LANGS.length }),
watching: { email: m && m.totals ? m.totals.followers : null, push_devices: push.ok && push.v ? push.v.devices : null, saved_alerts: al.ok && al.v ? al.v.live : null, source: $s.k3 },
sealed: { log_days: heads.length || (T && T.totals ? T.totals.log_days : null), log_first: heads.length ? heads.map(h => h.day).sort()[0] : (T && T.totals ? T.totals.log_first : null),
projects_in_todays_root: seal ? seal.count : null, root_date: seal ? seal.date : null, bitcoin_stamps: m && m.totals ? m.totals.stamps : null, stamps_confirmed: m && m.totals ? m.totals.stamps_confirmed : null, source: $q.bf },
shipping: { ships_last_7_days: sh && sh.totals ? sh.totals.ships_last_7_days : null, streak_days: sh && sh.streak ? sh.streak.current : null, as_of: sh ? sh.generated_at : null,
deploys_last_7_days: dep7.length, rollbacks_last_7_days: dep7.filter(d => d.result === $q.bg).length,
commit_to_live_median_s: ctl ? ctl.median_s : null, commit_to_live_p90_s: ctl ? ctl.p90_s : null, commit_to_live_samples: ctl ? ctl.samples : null, source: $t.k20 },
customers: { paid_checks: m && m.totals && typeof m.totals.paid_checks === $q.m ? m.totals.paid_checks : null, source: $s.k4, note: $t.k21 },
weeks: rows, weekly_history: T ? { generated: T.generated, complete_until: T.complete_until || null, file: $q.bh } : null, history_update: freeze,
caveats: [$t.k22, $s.k5]
};
}
const dur = (s, lang) => s == null ? t(lang, $q.bi) : s >= 90 ? nf(Math.round(s / 6) / 10, lang) + ' ' + t(lang, 'min') : nf(s, lang) + ' ' + t(lang, 's');
const N = (v, lang) => v == null ? $q.aF + esc(t(lang, $q.bi)) + $q.aH : nf(v, lang);
function openBody(d, lang) {
const src = (h, l) => '<a class="k-src" href="' + esc(h) + '">' + esc(l) + '</a>';
const stat = (v, label, sub, s) => $q.bj + (v == null ? '-' : nf(v, lang)) + $q.bk + esc(label) + $q.aH + (sub ? $q.bl + esc(sub) + $q.bm : '') + s + $q.H;
const w = d.watching, p = d.pages, sh = d.shipping, se = d.sealed;
const watchN = [w.email, w.push_devices, w.saved_alerts].every(x => x == null) ? null : (w.email || 0) + (w.push_devices || 0) + (w.saved_alerts || 0);
const ctlTxt = sh.commit_to_live_median_s == null ? null : dur(sh.commit_to_live_median_s, lang);
const stats = $q.bn +
stat(d.xrays.sealed_total, t(lang, 'c_xr'), d.xrays.last_24h != null ? t(lang, $q.bo, { n: nf(d.xrays.last_24h, lang) }) : '', src(pre(lang) + $q.bp, $q.bq)) +
stat(p.projects != null ? p.projects * p.languages : null, t(lang, $q.br), p.projects != null ? t(lang, $q.bs, { p: nf(p.projects, lang), d: nf(p.developers, lang), l: p.languages }) : '', src(pre(lang) + $q.bt, $q.bu)) +
stat(watchN, t(lang, $q.bv), t(lang, $q.bw, { e: nf(w.email || 0, lang), p: nf(w.push_devices || 0, lang), a: nf(w.saved_alerts || 0, lang) }), src($q.bx, $q.by)) +
$q.bj + (ctlTxt ? esc(ctlTxt) : '-') + $q.bk + esc(t(lang, 'c_ctl')) + $q.bz + esc(t(lang, $q.bA, { p: dur(sh.commit_to_live_p90_s, lang), n: nf(sh.commit_to_live_samples || 0, lang) })) + $q.bm + src($q.bB, $q.bC) + $q.bD;
const maxX = Math.max(1, ...d.weeks.map(r => r.xrays_sealed || 0));
const wkRows = d.weeks.slice().reverse().map(r => '<tr' + (r.current ? $q.bE : '') + $q.bF + esc(t(lang, $q.bG)) + '">' + esc(dayName(r.week, lang)) + (r.current ? $q.aE + esc(t(lang, $q.bH)) + $q.s : '') + '</td>' +
$q.bI + esc(t(lang, 'th_xr')) + '">' + N(r.xrays_sealed, lang) + (r.xrays_sealed ? $t.k23 + Math.round(64 * r.xrays_sealed / maxX) + $q.bJ : '') + '</td>' +
$q.bI + esc(t(lang, $q.bK)) + '">' + N(r.xray_runs, lang) + (r.xray_runs != null && r.xray_runs_partial_until ? $q.bL + esc(t(lang, $q.bM, { d: dayName(r.xray_runs_partial_until, lang) })) + $q.bm : '') + $q.bN + esc(t(lang, 'th_st')) + '">' + N(r.bitcoin_stamps, lang) + $q.bN + esc(t(lang, $q.bO)) + '">' + N(r.deploys_checked_live, lang) + $q.y).join('');
const week = $t.k24 + esc(t(lang, $q.bG)) + $q.bP + esc(t(lang, 'th_xr')) + $q.bP + esc(t(lang, $q.bK)) + $q.bP + esc(t(lang, 'th_st')) + $q.bP + esc(t(lang, $q.bO)) + $q.u + wkRows + $q.z +
$q.J + esc(t(lang, $q.bQ)) + ' ' + esc(t(lang, $q.bR)) + ' ' + src($q.bh, $q.bh) + ' ' + src($q.bS, $q.bS) + '</p>';
const kv = (key, vals, h, l, extra) => { const full = t(lang, key, vals), k = full.search(/[:：]/); return '<dt>' + esc(k < 0 ? full : full.slice(0, k).trim()) + $q.aB + esc(k < 0 ? '' : full.slice(k + 1).trim()) + (extra || '') + ' ' + src(h, l) + '</dd>'; };
const nn = v => v == null ? t(lang, $q.bi) : nf(v, lang);
const sealed = $q.bT + kv('s_log', { n: nn(se.log_days), d: dayName(se.log_first, lang) }, '/log/', $q.bU) +
kv($q.bV, { n: nn(se.projects_in_todays_root) }, $q.bW, $q.bX, se.root_date ? $q.bL + esc(dayName(se.root_date, lang)) + $q.bm : '') +
kv('s_st', { n: nn(se.bitcoin_stamps), c: nn(se.stamps_confirmed) }, '/log/', $q.bU) + '</dl>';
const ship = $q.bT + kv('sh_7', { n: nn(sh.ships_last_7_days) }, $q.bB, $q.bC) + kv($q.bY, { n: nn(sh.streak_days) }, $q.bB, $q.bC) +
kv($q.bZ, { n: nf(sh.deploys_last_7_days, lang), f: nf(sh.rollbacks_last_7_days, lang) }, $q.bS, $q.bS) + '</dl>' + (sh.as_of ? $q.J + esc(t(lang, 'rs_at', { d: dayName(sh.as_of, lang) })) + '</p>' : '');
const cu = d.customers || {};
const slot = $t.k25 + esc(t(lang, $q.ca)) + $t.k26 +
stat(cu.paid_checks, t(lang, $q.cb), t(lang, $q.cc), src($q.bx, $q.by)) + $q.cd + esc(t(lang, $q.ce)) + $q.cf;
const upd = t(lang, 'o_upd', { t: d.generated.slice(11, 16), d: d.weekly_history ? dayName(d.weekly_history.generated, lang) : t(lang, $q.bi) });
return $s.k6 + pre(lang) + $q.cg + esc(t(lang, 'o_h1')) + $q.ch + esc(t(lang, $q.ci)) + $t.k27 + esc(d.generated) + '">' + esc(upd) + $q.cj +
'<h2>' + esc(t(lang, $q.ck)) + '</h2>' + stats + $q.cl +
$t.k28 + esc(t(lang, $q.cm)) + '</h2>' + week + $q.cl +
$t.k29 + esc(t(lang, $q.cn)) + '</h2>' + sealed + $q.cl +
$t.k30 + esc(t(lang, $q.co)) + '</h2>' + ship + $q.cl + slot +
$t.k31 + esc(t(lang, $q.cp)) + $q.ag + esc(t(lang, $q.cq)) + $s.k7;
}
function methodBody(fc, lang) {
const rows = [fc.all, ...[...fc.markets.values()].filter(g => g.n > 0).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name))];
const tbl = rows => $q.cr + esc(t(lang, $q.cs)) + $q.bP + esc(t(lang, $q.ct)) + $q.bP + esc(t(lang, $q.cu)) + $q.cv + esc(t(lang, $q.cw)) + $q.u +
    rows.map(g => $q.cx + esc(t(lang, $q.cs)) + '">' + (g.level === 'all' ? '<b>' + esc(t(lang, 'm_all')) + '</b>' : $q.cy + encodeURIComponent(String(g.name).toLowerCase().replace(/\s+/g, '-')) + $q.cz + esc(g.name) + $q.cA) + $q.bN + esc(t(lang, $q.ct)) + '">' + nf(g.n, lang) + $q.bN + esc(t(lang, $q.cu)) + '">' + nf(g.k, lang) + $q.cB + esc(t(lang, $q.cw)) + '">' +
      (g.level === 'all' ? $q.cC + esc(t(lang, 'm_all')) + $q.aH : g.enough ? $q.cD + esc(t(lang, 'm_ok')) + $q.aH : $q.cE + esc(t(lang, 'm_nd')) + $q.aH) + $q.y).join('') + $q.z;
const tb = tbl(rows.slice(0, 13)) + (rows.length > 13 ? $t.k32 + nf(rows.length - 13, lang) + $q.cF + tbl(rows.slice(13)) + $q.cG : '');
const P = (h, p) => '<h2>' + esc(t(lang, h)) + $q.ag + esc(p) + '</p>';
return $s.k8 + pre(lang) + $t.k33 + esc(t(lang, $q.cH)) + $q.cI + esc(t(lang, $q.cJ)) + $q.ch + esc(t(lang, $q.cK)) + $q.E +
$q.cL + curveSvg(fc.all, lang) + '<p>' + esc(gLine(fc.all, lang)) + ' ' + srcMark(fc, lang) + '</p>' + rowsTable(fc.all.by.filter(Boolean), lang, true, null, 1) + $q.J + esc(t(lang, 'bias')) + $q.cM +
$t.k34 + P($q.cN, t(lang, $q.cO)) + P($q.cP, t(lang, $q.cQ)) + $q.J + esc(t(lang, $q.cR, { n: nf(fc.cnt.excluded, lang) })) + '</p>' + P($q.cS, t(lang, 'm_est')) +
P($q.cT, t(lang, $q.cU, { N: MIN_N, K: MIN_K, ND: MIN_ND, R: MIN_R })) + '<h2>' + esc(t(lang, $q.cV)) + $q.cW + esc(t(lang, 'bias')) + $q.cX + esc(t(lang, $q.cY)) + $q.cX + esc(t(lang, $q.cZ)) + $q.da +
$t.k35 + esc(t(lang, $q.db)) + '</h2>' + tb + $t.k36 + esc(t(lang, 'm_api')) + $s.k9;
}
async function assemble(shellRes, o) {
const alts = LANGS.map(l => $q.dc + l + $q.dd + ORIGIN + pre(l) + o.path + '">').join('') + $t.k37 + ORIGIN + o.path + '">';
const tags = $q.de + esc(o.title) + $t.k38 + esc(o.desc) + $q.df + ORIGIN + pre(o.lang) + o.path + '">' + alts +
$s.k10 + esc(o.title) + $t.k39 + esc(o.desc) + $q.dg + ORIGIN + pre(o.lang) + o.path + $t.k40 +
$q.dh + JSON.stringify(o.ld).replace(/</g, $q.di) + $q.dj + $s.PG_CSS + $s.FC_CSS;
const res = new HTMLRewriter()
.on('title', { element(e) { e.remove(); } })
.on($s.k11, { element(e) { e.remove(); } })
.on($q.dk, { element(e) { e.remove(); } })
.on('head', { element(e) { e.append(tags, { html: true }); } })
.on('main', { element(e) { e.setInnerContent(o.body, { html: true }); } })
.on($q.dl, { element(e) { const l = e.getAttribute($q.dm); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + o.path); } })
.transform(new Response(shellRes.body, { headers: { 'content-type': $q.dn } }));
return await res.text();
}
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname;
if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: $q.do }, 405, $q.aq);
if (p.startsWith($q.dp)) {
const q = p.replace(/\/+$/, '');
try {
if (q === $q.dp) return out({ module: $q.dq, endpoints: { '/api/x/fc/curves': $t.k41, '/api/x/fc/project?id=BALI-014': $q.dr, '/api/x/fc/speed?dev=<slug>': $q.ds, '/api/x/fc/open': $q.dt }, method: ORIGIN + $q.du, licence: $t.k42 });
if (q === $q.dv) {
const fc = await fcData(env), devs = await devGroups(env, fc).catch(() => new Map());
return out({ version: VERSION, generated: new Date().toISOString(), data_updated: fc.updated, as_of_month: ym(fc.now), method: ORIGIN + $q.du, thresholds: { market_projects: MIN_N, developer_projects: MIN_ND, handovers: MIN_K, at_risk_per_point: MIN_R },
counts: fc.cnt, caveat: FT.en.bias, all: pub(fc.all), markets: [...fc.markets.values()].filter(g => g.n > 0).sort((a, b) => b.n - a.n).map(pub),
developers: [...devs.entries()].filter(([, g]) => g.n >= MIN_ND).map(([s, g]) => Object.assign(pub(g), { slug: s })), developers_below_threshold: [...devs.values()].filter(g => g.n < MIN_ND).length,
sources: [$q.dw, $q.dx], licence: $t.k43 }, 200, $q.dy);
}
if (q === $q.dz) {
const id = String(u.searchParams.get('id') || '').trim().toUpperCase().slice(0, 20);
if (!/^[A-Z]{1,6}-\d{1,4}$/.test(id)) return out({ error: $q.dA }, 400, $q.dB);
const fc = await fcData(env); if (!fc.proj[id]) return out({ id, error: $t.k44 }, 404);
const nm = await import('./kbx_named.js'), ix = await nm.data(env), x = ix.byId.get(id), devs = await devGroups(env, fc);
const o = projectFc(fc, id, x && x.dvs ? devs.get(x.dvs) : null), G = g => g && { level: g.level, name: g.name, projects_past_first_date: g.n, handovers: g.k, enough: g.enough };
return out({ id, status: o.status, first_promised: o.first, current_promised: o.current, months_since_first: o.months_since_first, group: G(o.group), market: G(o.market), pooled_context: o.group ? null : G(o.pooled),
chance: (o.group ? o.rows : []).map(r => ({ by: r.date, months_after_first: r.k, chance: r.p, low: r.lo, high: r.hi, at_risk: r.at_risk })),
pooled_chance_context_only: o.group ? null : o.pooled_rows.map(r => ({ by: r.date, months_after_first: r.k, chance: r.p, low: r.lo, high: r.hi, at_risk: r.at_risk })),
not_enough_beyond_months: o.beyond, caveat: FT.en.bias, method: ORIGIN + $q.du, licence: $t.k45 }, 200, $q.dy);
}
if (q === $q.dC) {
const slug = String(u.searchParams.get('dev') || '').toLowerCase().slice(0, 90);
const rs = await rsData(env); if (!rs) return out({ error: $q.dD }, 503, $q.aq);
const nm = await import('./kbx_named.js'), ix = await nm.data(env), dv = ix.devs.get(slug);
if (!dv) return out({ error: $t.k46, totals: rs.totals, generated: rs.generated }, 404);
const a = rsAgg(rs, dv.ids);
return out({ developer: dv.n, slug, projects: dv.ids.length, questions_reported: a.reported, questions_opened: a.opened, answered: a.answered, median_days_to_answer: a.median_days, medians_by_project: a.meds && a.meds.length > 1 ? a.meds : undefined, median_shown_from: RS_MIN, live: !!rs.live, replies_approved: a.replies, counted: rs.generated, source: $q.dE, method: rs.sources, licence: rs.licence });
}
if (q === $q.bx) return out(await openNumbers(env, ctx), 200, $q.dB);
} catch (e) { return out({ error: $q.ap, detail: String(e && e.message || e).slice(0, 120) }, 503, $q.aq); }
return out({ error: $q.dF, module: 'fc' }, 404, $q.dB);
}
const m = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(open|methods\/delivery-forecast)(\/?)$/); if (!m || !shell) return null;
if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': $q.dG } });
const lang = m[1] || 'en', kind = m[2];
const sh = await shell(pre(lang) + $q.dH);
let o;
if (kind === 'open') {
const d = await openNumbers(env, ctx);
o = { lang, path: $q.dI, title: t(lang, $q.dJ), desc: t(lang, $q.dK), body: openBody(d, lang),
ld: { '@context': $q.dL, '@graph': [{ '@type': $q.dM, '@id': ORIGIN + pre(lang) + $q.dN, url: ORIGIN + pre(lang) + $q.dI, name: t(lang, $q.dJ), description: t(lang, $q.dK), inLanguage: lang, dateModified: d.generated, isPartOf: { '@type': $q.dO, name: $q.dP, url: ORIGIN + '/' } },
{ '@type': $q.dQ, name: $q.dR, description: FT.en.o_desc, url: ORIGIN + $q.dI, license: $t.k47, isAccessibleForFree: true, creator: { '@type': $q.dS, name: $q.dP, url: ORIGIN + '/' }, distribution: [{ '@type': $q.dT, encodingFormat: $q.aN, contentUrl: ORIGIN + $q.bx }, { '@type': $q.dT, encodingFormat: $q.aN, contentUrl: ORIGIN + $q.bh }] },
{ '@type': $q.dU, itemListElement: [{ '@type': $q.dV, position: 1, name: $q.dP, item: ORIGIN + pre(lang) + '/' }, { '@type': $q.dV, position: 2, name: t(lang, 'o_h1'), item: ORIGIN + pre(lang) + $q.dI }] }] } };
return new Response(await assemble(sh, o), { status: 200, headers: { 'content-type': $q.dn, 'cache-control': $q.dB } });
}
const fc = await fcData(env);
o = { lang, path: $q.du, title: t(lang, $q.cJ), desc: t(lang, $q.dW), body: methodBody(fc, lang),
ld: { '@context': $q.dL, '@graph': [{ '@type': $q.dX, '@id': ORIGIN + pre(lang) + $q.dY, headline: t(lang, $q.cJ), description: t(lang, $q.dW), url: ORIGIN + pre(lang) + $q.du, inLanguage: lang, dateModified: fc.updated, author: { '@type': $q.dS, name: $q.dP, url: ORIGIN + '/' }, publisher: { '@type': $q.dS, name: $q.dP, url: ORIGIN + '/' } },
{ '@type': $q.dQ, name: $q.dZ, description: FT.en.m_desc, url: ORIGIN + $q.du, license: $t.k48, isAccessibleForFree: true, creator: { '@type': $q.dS, name: $q.dP, url: ORIGIN + '/' }, distribution: [{ '@type': $q.dT, encodingFormat: $q.aN, contentUrl: ORIGIN + $q.dv }] },
{ '@type': $q.dU, itemListElement: [{ '@type': $q.dV, position: 1, name: $q.dP, item: ORIGIN + pre(lang) + '/' }, { '@type': $q.dV, position: 2, name: FT.en.m_crumb, item: ORIGIN + $q.ea }, { '@type': $q.dV, position: 3, name: t(lang, $q.cJ), item: ORIGIN + pre(lang) + $q.du }] }] } };
return new Response(await assemble(sh, o), { status: 200, headers: { 'content-type': $q.dn, 'cache-control': $q.dy } });
}
