// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_n27a__q, $s = TB.kbx_n27a__s, $t = TB.kbx_n27a__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import * as N from './kbx_named.js';
import { rpc } from './kolaboro.js';
import { hyear, mkName, coName } from './kbx_hdate.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const PATHS = /^\/answers\/(?:place|developer)\/[a-z0-9-]{1,90}\.md$|^\/api\/v1\/projects\/[a-z0-9-]{1,90}\.csv$|^\/corrections\.(?:json|md)$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?developers\/[a-z0-9-]{1,90}\/dashboard\/?$|^\/yc(?:\/try)?\/?$|^\/api\/open\/(?:usage|rv)\/?$/;
export const slug = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const esc = N.esc, pre = N.pre;
const pUrl = (lang, x) => ORIGIN + pre(lang) + $q.a + x.s + '/';
const num = (n, lang) => { try { return new Intl.NumberFormat(LOC[lang] || 'en-GB').format(n); } catch (e) { return String(n); } };
const day = o => new Date(Date.now() - (o || 0) * 864e5).toISOString().slice(0, 10);
const median = a => { if (!a.length) return null; const s = a.slice().sort((p, q) => p - q), h = s.length >> 1; return s.length % 2 ? s[h] : Math.round((s[h - 1] + s[h]) / 2); };
const MEMO = {};
async function file(env, name, ttl) {
  const m = MEMO[name]; if (m && Date.now() - m.t < (ttl || 600000)) return m.v;
  let v = null;
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.b + name)); if (r.ok) v = await r.json(); } catch (e) { v = null; }
  MEMO[name] = { t: Date.now(), v }; return v;
}
const ymIdx = s => { const m = /^(\d{4})-(\d{2})/.exec(s || ''); return m ? +m[1] * 12 + (+m[2] - 1) : null; };
function late(ot, x) {
const p = ot && ot.projects && ot.projects[x.id]; if (!p || !p.first || /^(done_|completed)/.test(p.s || '')) return null;
const now = ymIdx((ot.as_of_month || '') + '-01'), f = ymIdx(p.first + '-01'); if (now == null || f == null) return null;
return { late: now - f, first: p.first, moved: p.moved || 0 };
}
async function trP(env, id, lang) { try { return await (await import('./kbx_tr.js')).trProject(env, id, lang); } catch (e) { return null; } }
export function places(ix) {   // markets of the named index, by size
  const m = new Map(); for (const x of ix.P) { const k = slug(x.mk); if (!k) continue; if (!m.has(k)) m.set(k, { s: k, mk: x.mk, co: x.co, L: [] }); m.get(k).L.push(x); }
  return [...m.values()].sort((a, b) => b.L.length - a.L.length || a.mk.localeCompare(b.mk));
}
function projLine(ix, x, tp, ot) {
let qa = ''; try { qa = N.quickAnswer(ix, x, 'en', tp || null).replace(/\s+/g, ' ').trim(); } catch (e) { qa = ''; }
const lm = late(ot, x);
return '- [' + x.n + '](' + pUrl('en', x) + ')' + (qa ? ': ' + qa : '') + (lm && lm.late > 0 ? $q.c + N.fd(lm.first, 'en') + $q.d + lm.late + $q.e : '') + $q.f + ORIGIN + $q.g + x.s + '.md';
}
function figures(ix, L, ot, tps) {
const cs = L.map(x => ix.caseBy.get(x.id) || {}), rv = L.filter(x => N.reviewed(ix.caseBy.get(x.id)));
const withDate = L.filter(x => N.handoverOf(ix, x)).length, past = L.filter(x => { const l = late(ot, x); return l && l.late > 0; }).length;
const permit = L.filter((x, i) => x.pn || (cs[i].checks || {}).permit === 2).length, scores = tps.filter(t => t && typeof t.score === $q.h).map(t => t.score);
return { n: L.length, rv: rv.length, withDate, past, permit, med: median(scores) };
}
async function placeMd(env, ix, pl) {
const ot = await file(env, $q.i), L = pl.L.slice().sort((a, b) => a.n.localeCompare(b.n));
const tps = await Promise.all(L.map(x => trP(env, x.id, 'en')));
const f = figures(ix, L, ot, tps), today = N.iso(ix.updated) || day();
const rk = (tps.find(t => t && t.ranks && t.ranks.length) || {}).ranks || [];
const out = [$q.j + pl.mk + (pl.co && pl.co !== pl.mk ? ', ' + pl.co : '') + $q.k, '',
$q.l + ORIGIN + '/m/' + encodeURIComponent(String(pl.mk).toLowerCase().replace(/\s+/g, '-')) + '/', $q.m + today + $t.k0, $s.k0, '',
$q.n, '',
$q.o + f.n + $q.p + (f.n === 1 ? '' : 's') + ' in ' + pl.mk + ' (' + f.rv + $q.q + f.withDate + ' of ' + f.n + $t.k1 + f.past + '. ' +
$q.r + f.permit + ' of ' + f.n + '.' + (f.med != null ? $t.k2 + f.med + '.' : ''), ''];
if (rk.length) { out.push($q.s, ''); for (const r of rk) out.push('- ' + r.p + ': ' + ORIGIN + $q.t + r.s + '/'); out.push(''); }
out.push($q.u, '');
L.forEach((x, i) => out.push(projLine(ix, x, tps[i], ot)));
out.push('', $q.v, '', '- ' + ORIGIN + $q.w, '- ' + ORIGIN + $q.x, '- ' + ORIGIN + $q.y, '- ' + ORIGIN + $q.z, '',
$q.A, '', $q.B + pl.mk + $q.C + ORIGIN + $q.D + pl.s + $q.E + today + $q.F, '');
return out.join('\n');
}
async function devMd(env, ix, dv) {
const ot = await file(env, $q.i), L = dv.ids.map(i => ix.byId.get(i)).filter(Boolean).sort((a, b) => a.n.localeCompare(b.n));
const tps = await Promise.all(L.map(x => trP(env, x.id, 'en'))), f = figures(ix, L, ot, tps), today = N.iso(ix.updated) || day();
const P = L.flatMap(x => (ix.prom[x.id] || []).map(q => q.st)), cnt = k => P.filter(s => s === k).length;
const mks = [...new Set(L.map(x => x.mk))];
const out = ['# ' + dv.n + $q.G, '', $q.l + ORIGIN + $q.H + dv.s + '/', $q.m + today + $t.k3, $s.k1 + ORIGIN + $q.I, '',
$q.n, '',
dv.n + ' has ' + f.n + $q.J + (f.n === 1 ? '' : 's') + $q.K + mks.join(', ') + ' (' + f.rv + $q.q + f.withDate + ' of ' + f.n + $t.k4 + f.past + $t.k5 + f.permit + ' of ' + f.n + '.' +
(P.length ? $q.L + P.length + $q.M + cnt('kept') + $q.N + cnt($q.O) + $q.P + cnt('moved') + $q.Q + cnt($q.R) + ').' : '') + (f.med != null ? $t.k6 + f.med + $q.S : ''), '',
$q.u, ''];
L.forEach((x, i) => out.push(projLine(ix, x, tps[i], ot)));
out.push('', $q.T, '', $t.k7 + ORIGIN + $t.k8 + ORIGIN + $q.H + dv.s + $q.U, '',
$q.A, '', $q.V + dv.n + $q.W + ORIGIN + $q.X + dv.s + $q.E + today + $q.F, '');
return out.join('\n');
}
const csvCell = v => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
function flat(o, p, out) {
if (o === null || o === undefined) { out.push([p, '']); return out; }
if (Array.isArray(o)) { if (!o.length) out.push([p, '']); o.forEach((v, i) => flat(v, p + '[' + i + ']', out)); return out; }
if (typeof o === $q.Y) { const k = Object.keys(o); if (!k.length) out.push([p, '']); for (const key of k) flat(o[key], p ? p + '.' + key : key, out); return out; }
out.push([p, o]); return out;
}
const MON = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
const unent = s => String(s).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&rarr;/g, '→').replace(/\s+/g, ' ').trim();
async function corrections(env, shellFetch) {
try {
const r = env && env.ASSETS ? await env.ASSETS.fetch(new Request(ORIGIN + $t.k9)) : null;
let SL = {}; try { const ix = await N.data(env); for (const [id, x] of ix.byId) SL[id] = x.s; } catch (e) { SL = {}; }
if (r && r.ok) { const C = await r.json(); return (C.entries || []).map(e => ({ date: e.date || null, project_id: e.id || null, link: e.id ? (SL[e.id] ? ORIGIN + $q.a + SL[e.id] + '/' : ORIGIN + '/p/' + encodeURIComponent(e.id) + '/') : null,
correction: e.kind === 'pin' ? $q.Z + e.after + '. ' + e.why : e.what + ': ' + (e.before ? $q.aa + e.before + ' to ' + e.after : $q.ab + e.after) + '. ' + e.why })); }
} catch (e) {}
let html = '';
try { const r = await shellFetch($q.ac); if (r && r.ok) html = await r.text(); } catch (e) { html = ''; }
const E = [];
for (const ol of html.match(/<(?:ol|ul)[^>]*class="[^"]*\bclist\b[^"]*"[^>]*>[\s\S]*?<\/(?:ol|ul)>/g) || []) {
for (const li of ol.match(/<li[\s>][\s\S]*?<\/li>/g) || []) {
const b = /<b>([\s\S]*?)<\/b>/.exec(li), head = b ? unent(b[1]) : '', dm = /(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/.exec(head) || /(\d{4})-(\d{2})-(\d{2})/.exec(head);
const date = dm ? (dm[1].length === 4 ? dm[1] + '-' + dm[2] + '-' + dm[3] : dm[3] + '-' + (MON[dm[2].toLowerCase()] || '01') + '-' + dm[1].padStart(2, '0')) : null;
const idm = /\b([A-Z]{2,6}-\d{3,4})\b/.exec(head), href = (/<a[^>]+href="([^"]+)"/.exec(li) || [])[1] || null;
const text = unent(b ? li.slice(li.indexOf('</b>') + 4) : li).replace(/^[:\s]+/, '');
if (!text) continue;
E.push({ date, project_id: idm ? idm[1] : null, link: href ? (href.startsWith('/') ? ORIGIN + href : href) : null, correction: text });
}
}
return E;
}
const TPL = [['home', /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/?)?$/], ['project', /^\/(?:[a-z]{2}\/)?projects\/[a-z0-9-]+\/$/], ['projects_index', /^\/(?:[a-z]{2}\/)?projects\/$/],
['developer', /^\/(?:[a-z]{2}\/)?developers\/[a-z0-9-]+\/(?:dashboard\/)?$/], ['ranking', /^\/(?:[a-z]{2}\/)?rankings\//], ['place', /^\/(?:[a-z]{2}\/)?(?:m|countries|handover|areas)\//],
['check', /^\/(?:[a-z]{2}\/)?check\/$/], ['compare', /^\/(?:[a-z]{2}\/)?(?:compare|vs)\//], ['guide', /^\/(?:[a-z]{2}\/)?(?:guides|stories|methods|how-we-score)\//], ['tool', /^\/(?:[a-z]{2}\/)?tools\//], ['pricing', /^\/(?:[a-z]{2}\/)?pricing\/$/]];
const TPL_NAMES = TPL.map(t => t[0]).concat(['other', '_search']);
const RV = ['new', 'd0', 'd1_7', 'd8_30', 'd31p'];
const CK = (d, k) => ORIGIN + $q.ad + d + '/' + k;
async function inc0(k) {
try { const c = caches.default, hit = await c.match(k), n = hit ? (+(await hit.text()) || 0) : 0;
await c.put(k, new Response(String(n + 1), { headers: { 'cache-control': $q.ae, 'content-type': $q.af } })); } catch (e) {}
}
let CHAIN = Promise.resolve();
const inc = k => (CHAIN = CHAIN.then(() => inc0(k)));
const BOT = /bot|crawl|spider|slurp|lighthouse|headless|preview|fetch|curl|wget|python|httpclient|axios|GPT|Claude|anthropic|Perplexity|Bytespider|facebookexternalhit|meta-extern/i;
async function incJ0(k, f) {
try { const c = caches.default, hit = await c.match(k); let o = {}; if (hit) { try { o = JSON.parse(await hit.text()) || {}; } catch (e) { o = {}; } }
if (!(f in o) && Object.keys(o).length >= 120) f = $q.ag; o[f] = (o[f] || 0) + 1;
await c.put(k, new Response(JSON.stringify(o), { headers: { 'cache-control': $q.ae, 'content-type': $q.ah } })); } catch (e) {}
}
const incJ = (k, f) => (CHAIN = CHAIN.then(() => incJ0(k, f)));
export function apiGroup(p) {
if (p === '/mcp' || p === '/mcp/') return $q.ai;
const m = /^\/api\/(v1|open)\/([a-z][a-z0-9_.-]{0,40})(?:\/([^/]{1,120}))?(?:\/([a-z][a-z0-9_.-]{0,30}))?/.exec(p); if (!m) return null;
let g = '/api/' + m[1] + '/' + m[2].replace(/\.(json|csv|svg)$/, '.$1');
if (m[3]) g += /^(feed\.json|at)$/.test(m[3]) ? '/' + m[3] : (/\.sig$/.test(m[3]) ? $q.aj : '/{id}');
if (m[4]) g += '/' + m[4];
return g;
}
export function countMcpTool(name, ctx) { if (typeof caches !== $q.ak && ctx && ctx.waitUntil && /^[a-z_]{2,40}$/.test(name)) ctx.waitUntil(incJ(CK(day(), '_mcp'), name)); }
export async function apiUsage(days) {
const per = [];
for (let i = 0; i < days; i++) { const d = day(i); let a = {}, m = {};
try { const r = await caches.default.match(CK(d, '_api')); if (r) a = JSON.parse(await r.text()) || {}; } catch (e) {}
try { const r = await caches.default.match(CK(d, '_mcp')); if (r) m = JSON.parse(await r.text()) || {}; } catch (e) {}
per.push({ date: d, a, m }); }
const by = {}, mt = {}; for (const x of per) { for (const [k, v] of Object.entries(x.a)) by[k] = (by[k] || 0) + v; for (const [k, v] of Object.entries(x.m)) mt[k] = (mt[k] || 0) + v; }
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
return { since: $q.al, days, total: sum(by), mcp_total: sum(mt), by_endpoint: by, mcp_tools: mt, per_day: per.map(x => ({ date: x.date, calls: sum(x.a), mcp: sum(x.m) })),
note: $s.k2 };
}
export function count(req, u, ctx) {
  if (typeof caches === $q.ak || !ctx || !ctx.waitUntil) return;
  if ((req.method === 'GET' || req.method === 'POST') && /^\/(api\/(v1|open)\/|mcp\/?$)/.test(u.pathname) && !/kolaboro-|deploy-guard/i.test(req.headers.get($q.am) || '')) {
    const g = apiGroup(u.pathname); if (g && (req.method === 'GET' || g === $q.ai)) ctx.waitUntil(incJ(CK(day(), '_api'), g));
  }
  if (req.method !== 'GET') return;
  const h = req.headers;
  if (/^\/api\/v1\/search-index/.test(u.pathname)) { if (!BOT.test(h.get($q.am) || '')) ctx.waitUntil(inc(CK(day(), $q.an))); return; }   // the search box loads this index when someone starts to type
  if (h.get($q.ao) !== $q.ap || h.get($q.aq) || h.get($q.ar) || BOT.test(h.get($q.am) || '')) return;   // real page loads in a browser; prefetch and prerender left out
  if (/^\/(?:admin|portal|agents\/me|backup-admin|api|__|cdn-cgi|k|data)\b/.test(u.pathname)) return;
  const t = (TPL.find(z => z[1].test(u.pathname)) || ['other'])[0];
  ctx.waitUntil(inc(CK(day(), t)));
}
const ERRK = p => /^\/(api|mcp)\b/.test(p) ? 'api' : /^\/data\//.test(p) ? 'data' : /\.[a-z0-9]{2,5}$/i.test(p) || /^\/(k|_s|cdn-cgi)\//.test(p) ? 'asset' : 'page';
export function countStatus(req, u, st, ctx) {
if (typeof caches === $q.ak || !ctx || !ctx.waitUntil || !(st === 404 || st === 410 || st >= 500) || /kolaboro-|deploy-guard/i.test(req.headers.get($q.am) || '')) return;
const bot = BOT.test(req.headers.get($q.am) || ''), k = ERRK(u.pathname), c = st >= 500 ? '5xx' : String(st);
ctx.waitUntil(incJ(CK(day(), '_err'), c + ' ' + k + (bot ? ' bot' : '')));
if (k === 'page' && !bot && u.pathname.length <= 100 && /^\/[a-z0-9\/._-]*$/i.test(u.pathname) && !/^\/(admin|portal|login|reset|agents\/me|shared|backup-admin|verify\/[a-f0-9]{16,})/.test(u.pathname)) ctx.waitUntil(incJ(CK(day(), '_e' + c), u.pathname));
}
export async function errUsage(days) {
const per = [], top = {}, by = {};
for (let i = 0; i < days; i++) { const d = day(i); let a = {};
try { const r = await caches.default.match(CK(d, '_err')); if (r) a = JSON.parse(await r.text()) || {}; } catch (e) {}
for (const c of ['404', '5xx']) { try { const r = await caches.default.match(CK(d, '_e' + c)); if (r) for (const [k, v] of Object.entries(JSON.parse(await r.text()) || {})) top[c + ' ' + k] = (top[c + ' ' + k] || 0) + v; } catch (e) {} }
for (const [k, v] of Object.entries(a)) by[k] = (by[k] || 0) + v;
per.push({ date: d, counts: a }); }
return { since: $q.as, days, by_kind: by, top_paths: Object.entries(top).sort((x, y) => y[1] - x[1]).slice(0, 25).map(([k, n]) => ({ status: k.slice(0, 3), path: k.slice(4), n })), per_day: per,
note: $s.k3 };
}
async function readDays(keys, days) {
const out = [];
for (let i = 0; i < days; i++) {
const d = day(i), vals = await Promise.all(keys.map(async k => { try { const r = await caches.default.match(CK(d, k)); return r ? (+(await r.text()) || 0) : 0; } catch (e) { return 0; } }));
const o = {}; keys.forEach((k, j) => { if (vals[j]) o[k] = vals[j]; }); out.push({ date: d, counts: o });
}
return out;
}
async function usage(days) {
let api = null; try { api = await apiUsage(days); } catch (e) {}
const pv = await readDays(TPL_NAMES, days), rv = await readDays(RV.map(b => 'rv_' + b), days);
const sum = (A, k) => A.reduce((a, r) => a + (r.counts[k] || 0), 0);
const byTpl = {}; for (const k of TPL_NAMES.filter(k => k !== $q.an)) { const v = sum(pv, k); if (v) byTpl[k] = v; }
const R = {}; for (const b of RV) R[b] = sum(rv, 'rv_' + b);
const sess = RV.reduce((a, b) => a + R[b], 0), back = R.d0 + R.d1_7 + R.d8_30 + R.d31p;
return { page: ORIGIN + $q.at, licence: $t.k10, at: new Date().toISOString(), days,
note: $s.k4,
api_calls: api ? { since: api.since, total: api.total, by_endpoint: api.by_endpoint, mcp_tools: api.mcp_tools, note: api.note, page: ORIGIN + $q.au } : null,
page_views_by_type: byTpl, page_views_total: Object.values(byTpl).reduce((a, b) => a + b, 0), searches_started: sum(pv, $q.an),
return_visits: { note: $s.k5, sessions: sess, buckets: R, returning_share_pct: sess ? Math.round(back / sess * 1000) / 10 : null },
per_day: pv.map((r, i) => ({ date: r.date, page_views: Object.entries(r.counts).filter(e => e[0] !== $q.an).reduce((a, e) => a + e[1], 0), searches_started: r.counts._search || 0, sessions_counted: RV.reduce((a, b) => a + (rv[i].counts['rv_' + b] || 0), 0) })) };
}
export async function metricsHtml() {
let u; try { u = await usage(28); } catch (e) { return ''; }
const L = { home: 'Home', project: $q.av, projects_index: $q.aw, developer: $q.ax, ranking: $q.ay, place: $q.az, check: $q.aA, compare: $q.aB, guide: $q.aC, tool: 'Tools', pricing: $q.aD, other: $q.aE };
const rows = Object.entries(u.page_views_by_type).sort((a, b) => b[1] - a[1]).map(([k, v]) => $q.aF + esc(L[k] || k) + $q.aG + num(v, 'en') + $q.aH).join('');
const r = u.return_visits;
return $s.k6 +
(rows ? $s.k7 + rows + $q.aI : $t.k11) +
$s.k8 +
$t.k12 + num(u.searches_started, 'en') + $q.aJ +
$q.aK + (r.sessions ? 'Of ' + num(r.sessions, 'en') + $t.k13 + r.returning_share_pct + $q.aL + num(r.buckets.d0, 'en') + $q.aM + num(r.buckets.d1_7, 'en') + $q.aN + num(r.buckets.d8_30, 'en') + $q.aO + num(r.buckets.d31p, 'en') + $q.aP : $t.k14) + $s.k9;
}
const D = TB.kbx_n27a_D ;
const dt = (lang, k, v) => { const s = (D[lang] || D.en)[k]; return v ? String(s).replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
const bdi = s => '<bdi>' + esc(s) + $q.aQ;
const fdate = (d, lang) => { try { return new Intl.DateTimeFormat(LOC[lang] || 'en-GB', { day: $q.aR, month: 'long', year: $q.aR, timeZone: 'UTC' }).format(new Date(d + $q.aS)); } catch (e) { return d; } };
async function dashboard(env, ix, dv, lang) {
const L = dv.ids.map(i => ix.byId.get(i)).filter(Boolean).sort((a, b) => a.n.localeCompare(b.n));
const tps = await Promise.all(L.map(x => trP(env, x.id, lang))), today = N.iso(ix.updated) || day();
const miss = new Map();
const th = dt(lang, 'th');
const rows = L.map((x, i) => {
const tp = tps[i], rv = N.reviewed(ix.caseBy.get(x.id)), items = tp ? tp.items : [];
const have = items.filter(z => z.st === 'yes'), lack = items.filter(z => z.st === 'no' || z.st === 'nc');
for (const z of lack) miss.set(z.label, (miss.get(z.label) || 0) + 1);
const rk = tp && tp.ranks ? tp.ranks.filter(r => r.ranked && r.r).map(r => dt(lang, 'rank', { r: r.r, m: r.m, p: r.p })) : [];
return $q.aT + esc(th[0]) + $q.aU + pre(lang) + $q.a + x.s + '/">' + bdi(x.n) + $q.aV + esc([x.ar && x.ar !== x.mk ? x.ar : null, mkName(x.mk, lang)].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', ')) + (rv ? '' : ' · ' + esc(dt(lang, 'nr'))) + $q.aW +
$q.aX + esc(th[1]) + $q.aY + (tp && typeof tp.score === $q.h ? tp.score + '/100' : '?') + $q.aZ + (rk.length ? $q.ba + esc(rk.join(' · ')) + $q.bb : '') + '</td>' +
$q.aX + esc(th[2]) + '">' + (have.length ? $q.bc + have.map(z => '<li>' + esc(z.label) + '</li>').join('') + '</ul>' : '0') + '</td>' +
$q.aX + esc(th[3]) + '">' + (lack.length ? $q.bc + lack.map(z => '<li>' + esc(z.label) + (z.gain ? $q.bd + z.gain + '</b>' : '') + '</li>').join('') + '</ul>' : esc(dt(lang, 'none'))) + $t.k15 + encodeURIComponent(x.id) + '">' + esc(dt(lang, 'send')) + $q.be;
});
const sc = tps.filter(t => t && typeof t.score === $q.h).map(t => t.score), top = [...miss.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(e => e[0]);
const body = $q.bf + esc(dt(lang, 'sum', { k: num(L.length, lang), m: sc.length ? median(sc) : '?' })) + '</b>' + (top.length ? ' ' + esc(dt(lang, 'most', { i: top.join(', ') })) : '') + '</p>' +
$q.bg + esc(dt(lang, 'h_p')) + $q.bh + esc($t.o_GAIN31[lang] || $t.o_GAIN31.en) + $t.k16 + th.map(h => $q.bi + esc(h) + '</th>').join('') + $q.bj + rows.join('') + $q.aI +
$q.bk + esc(dt(lang, 'h_how')) + $q.bl + dt(lang, 'how').map(s => '<li>' + esc(s) + '</li>').join('') + '</ol>' +
$q.bm + pre(lang) + $q.H + dv.s + '/">' + esc(dt(lang, 'page')) + $q.bn + pre(lang) + $q.bo + esc(dt(lang, 'm')) + $q.bp + dv.s + $t.k17 + esc(dt(lang, 'note', { d: fdate(today, lang) })) + '</p>';
const name = dv.n || dv.s;
return { path: $q.H + dv.s + $q.U, title: dt(lang, 'title', { d: name }), h1: dt(lang, 'title', { d: name }), h1h: esc(dt(lang, 'title', { d: $q.bq })).replace($q.bq, bdi(name)), lead: dt(lang, 'lead'), body, updated: today, noindex: true,
crumbs: [[$q.br, '/'], [name, $q.H + dv.s + '/'], [dt(lang, 'title', { d: '' }).replace(/^[:：\s]+/, ''), $q.H + dv.s + $q.U]] };
}
function ycWeekly(W, days, T) {
const wk = W.slice(-8); if (!wk.length) return '';
const endOf = w => { const e = new Date(Date.parse(w + $q.bs) + 7 * 864e5).toISOString().slice(0, 10); let v = null; for (const d of days) if (d.d < e) v = d.total; return v; };
const rows = wk.map(w => ({ w: w.week, p: endOf(w.week), v: w.visits || 0, l: w.leads || 0, c: w.paid_checks || 0, r: w.revenue_eur || 0 }));
const cur = rows[rows.length - 1], prev = rows[rows.length - 2];
const sd = d => { try { return new Intl.DateTimeFormat('en-GB', { day: $q.aR, month: 'short', timeZone: 'UTC' }).format(new Date(d + $q.aS)); } catch (e) { return d; } };
const S = [['p', $q.bt, $q.bu], ['v', $q.bv, $q.bw], ['l', 'Leads', $q.bx], ['c', $q.by, $q.bz]];
const pw = 230, ph = 150, gap = 16, bw = (pw - 20) / rows.length;
const panel = (k, label, col, i) => {
const max = Math.max(1, ...rows.map(r => r[k] || 0)), x0 = i * (pw + gap);
return $q.bA + x0 + $t.k18 + esc(label) + $q.bB +
rows.map((r, j) => { const v = r[k] || 0, h = v ? Math.max(2, Math.round((ph - 50) * v / max)) : 0, x = 10 + j * bw, y = ph - 18 - h;
return $q.bC + (x + 2) + '" y="' + y + $q.bD + (bw - 4) + $q.bE + h + $q.bF + col + $q.bG + $q.bH + (x + bw / 2) + '" y="' + (y - 4) + $t.k19 + (r[k] == null ? '' : num(v, 'en')) + $q.bB +
(j % 2 === rows.length % 2 ? '' : $q.bH + (x + bw / 2) + '" y="' + (ph - 4) + $t.k20 + esc(sd(r.w)) + $q.bB); }).join('') +
$q.bI + (ph - 18) + $q.bJ + (pw - 10) + $q.bK + (ph - 18) + $t.k21;
};
const svg = $q.bL + (4 * pw + 3 * gap) + ' ' + ph + $s.k10 + rows.length + $q.bM + S.map((x, i) => panel(x[0], x[1], x[2], i)).join('') + $q.bN;
const tbl = $s.k11 +
rows.slice().reverse().map(r => $q.aF + esc(fdate(r.w, 'en')) + $q.bO + (r.p == null ? 'n/a' : num(r.p, 'en')) + $q.bO + num(r.v, 'en') + $q.bO + num(r.l, 'en') + $q.bO + num(r.c, 'en') + $q.bO + num(r.r, 'en') + $q.aH).join('') + $q.bP;
return $t.k22 + esc(fdate(cur.w, 'en')) + $q.bQ + num(cur.v, 'en') + $q.bR + num(cur.c, 'en') + $q.bS + num(cur.r, 'en') + $q.bT +
(prev ? $q.bU + num(prev.v, 'en') + $q.bV + num(prev.c, 'en') + $q.bW : '') + $q.bX + num(T.paid_checks || 0, 'en') + $t.k23 +
$s.k12 + svg + $s.k13 + tbl;
}
async function ycPage(env, inner) {
const j = async p => { try { const r = await inner(p); return r && r.ok ? await r.json() : null; } catch (e) { return null; } };
const [st, pg] = await Promise.all([j($q.bY), j($q.bZ)]);
let mt = null; try { mt = await rpc($q.ca, {}); } catch (e) { mt = null; }
const W = (mt && mt.weeks) || [], last = W.slice(-4), sumW = k => last.reduce((a, w) => a + (w[k] || 0), 0), T = (mt && mt.totals) || {};
const live = (pg && pg.live) || {}, f = n => n == null ? 'n/a' : num(n, 'en');
const days = ((pg && pg.per_day) || []).filter(d => d.total > 0), first = days[0];
const b = $s.k14 + ycWeekly(W, days, T) + $s.k15 +
$s.k16 +
$t.k24 + f(st && st.projects) + $q.cb + f(st && st.markets) + $q.cc + f(st && st.countries) + $q.cd + (first ? $q.ce + f(first.total) + ' on ' + fdate(first.d, 'en') : '') + $q.cf + f(st && st.claims_total) + $t.k25 + f(st && st.claims && st.claims.contradicted) + $t.k26 + f(st && st.sources) + $q.cg + f(st && st.data_points) + $q.ch + f(live.sitemap_urls) + $s.k17 +
$t.k27 + f(live.ships_7d) + $q.ci + f(live.deploys_7d) + $s.k18 +
$s.k19 + f(sumW($q.cj)) + $q.ck + f(sumW('leads')) + $q.cl + f(T.leads) + $t.k28 + f(sumW($q.cm)) + $q.cn + f(T.paid_checks != null ? T.paid_checks : sumW($q.co)) + $q.cp + f(T.revenue_eur != null ? T.revenue_eur : 0) + $s.k20 +
$s.k21 +
$s.k22 +
$s.k23 +
$s.k24 +
$s.k25;
return { path: '/yc/', title: $q.cq, h1: $q.cq, lead: $s.k26, body: b, updated: (st && st.updated) || day(), noindex: true, langs: false, crumbs: [[$q.br, '/'], [$q.cr, '/yc/']] };
}
async function ycTryPage(inner) {
let st = null; try { const r = await inner($q.bY); st = r && r.ok ? await r.json() : null; } catch (e) { st = null; }
const f = n => n == null ? 'n/a' : num(n, 'en');
const step = (n, h, how, exp) => $q.cs + n + '. ' + h + $q.ct + how + $q.cu + exp + $q.cv;
const b = $s.k27 + f(st && st.projects) + $q.cb + f(st && st.markets) + $q.cc + f(st && st.countries) + $t.k29 +
$t.k30 +
step(1, $t.k31, $s.k28, $s.k29) +
step(2, $q.cw, $q.cx + encodeURIComponent($t.k32) + $s.k30, $s.k31) +
step(3, $q.cy, $s.k32, $s.k33) +
step(4, $q.cz, $s.k34, $s.k35) +
step(5, $q.cA, $s.k36, $s.k37) +
$s.k38 +
$s.k39;
return { path: $q.cB, title: $q.cC, h1: $q.cD, lead: $t.k33, body: b, updated: (st && st.updated) || day(), noindex: true, langs: false, crumbs: [[$q.br, '/'], [$q.cr, '/yc/'], [$q.cD, $q.cB]] };
}
async function shellPage(shell, lang, o) {
const path = o.path, canon = ORIGIN + pre(lang) + path;
const alts = o.langs === false ? '' : LANGS.map(l => $q.cE + l + $q.cF + ORIGIN + pre(l) + path + '">').join('') + $t.k34 + ORIGIN + path + '">';
const crumbs = o.crumbs.map(([n, p]) => [n, ORIGIN + pre(lang) + p]);
const ld = { '@context': $q.cG, '@graph': [{ '@type': $q.cH, '@id': canon + '#page', url: canon, name: o.h1, description: o.lead, inLanguage: lang, dateModified: o.updated, isPartOf: { '@type': $q.cI, name: $q.br, url: ORIGIN + '/' } },
{ '@type': $q.cJ, itemListElement: crumbs.map((c, i) => ({ '@type': $q.cK, position: i + 1, name: c[0], item: c[1] })) }] };
const tags = $q.cL + esc(o.title) + $t.k35 + esc(o.lead) + $q.cM + canon + '">' + alts +
$q.cN + (o.noindex ? $q.cO : $q.cP) + $s.k40 + esc(o.title) + $t.k36 + esc(o.lead) + $q.cQ + canon + $q.cR + ORIGIN + $t.k37 +
$q.cS + JSON.stringify(ld).replace(/</g, $q.cT) + $q.cU + $s.CSS;
const main = $t.k38 + crumbs.map((c, i) => i < crumbs.length - 1 ? $q.cV + esc(c[1].replace(ORIGIN, '')) + '">' + bdi(c[0]) + '</a>' : bdi(c[0])).join(' / ') + $q.cW + (o.h1h || esc(o.h1)) + $q.cX + esc(o.lead) + $s.k41 + o.body + $q.cY;
const sh = await shell(pre(lang) + $q.cZ);
const res = new HTMLRewriter()
.on('title', { element(e) { e.remove(); } })
.on($s.k42, { element(e) { e.remove(); } })
.on($q.da, { element(e) { e.remove(); } })
.on('head', { element(e) { e.append(tags, { html: true }); } })
.on('main', { element(e) { e.setInnerContent(main, { html: true }); } })
.on($q.db, { element(e) { const l = e.getAttribute($q.dc); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + (o.langs === false && l !== lang ? '/' : path)); } })
.transform(new Response(sh.body, { headers: { 'content-type': $q.dd } }));
const h = { 'content-type': $q.dd, 'cache-control': $q.de }; if (o.noindex) h[$q.df] = $q.cO;
return new Response(await res.text(), { status: 200, headers: h });
}
const txt = (body, type, extra) => new Response(body, { headers: Object.assign({ 'content-type': type, 'cache-control': $q.de, 'access-control-allow-origin': '*', 'x-content-type-options': $q.dg }, extra || {}) });
const nf = () => new Response($q.dh, { status: 404, headers: { 'content-type': $q.di, 'cache-control': $q.dj } });
export async function handle(req, u, env, ctx, shell, inner) {
const p = u.pathname; let m;
if (!PATHS.test(p)) return null;
if (p === $q.dk || p === $q.dl) {
if (req.method !== 'POST') return new Response($q.dm, { status: 405, headers: { allow: 'POST' } });
const b = u.searchParams.get('b');
if (RV.includes(b) && typeof caches !== $q.ak && ctx && ctx.waitUntil && !BOT.test(req.headers.get($q.am) || '')) ctx.waitUntil(inc(CK(day(), 'rv_' + b)));
return new Response(null, { status: 204, headers: { 'cache-control': $q.dn } });
}
if (req.method !== 'GET' && req.method !== 'HEAD') return null;
if (p === $q.do || p === $q.dp) { const d = Math.min(35, Math.max(1, +u.searchParams.get('days') || 28)); return txt(JSON.stringify(Object.assign(await usage(d), { errors: await errUsage(Math.min(d, 14)) }), null, 1), $q.dq, { 'cache-control': $q.dj }); }
if (p === $q.dr || p === $q.ds) {
const E = await corrections(env, shell);
const head = { page: ORIGIN + $q.ac, licence: $t.k39, at: new Date().toISOString().slice(0, 10), rules: $s.k43 + ORIGIN + $t.k40, count: E.length };
if (p.endsWith('.json')) return txt(JSON.stringify(Object.assign(head, { corrections: E }), null, 1), $q.dq);
const L = [$t.k41, '', $q.l + ORIGIN + $t.k42 + ORIGIN + $t.k43, '', head.rules, '', $q.dt + E.length + ')', ''];
for (const e of E) L.push('- ' + (e.date || $q.du) + (e.project_id ? ', ' + e.project_id : '') + ': ' + e.correction + (e.link ? ' (' + e.link + ')' : ''));
if (!E.length) L.push($q.dv);
return txt(L.join('\n') + '\n', $q.dw, { link: '<' + ORIGIN + $q.dx });
}
if ((m = /^\/api\/v1\/projects\/([a-z0-9-]{1,90})\.csv$/.exec(p))) {
let r; try { r = await inner($q.dy + m[1]); } catch (e) { r = null; }
if (!r || r.status === 404) return nf();
if (!r.ok) return new Response($t.k44, { status: 503, headers: { 'retry-after': '60', 'cache-control': $q.dn } });
const d = await r.json(), rows = flat(d, '', []);
const out = [$q.dz + (d.id || '') + ' (' + (d.name || m[1]) + $q.dA + ORIGIN + $q.dy + m[1] + $t.k45 + ORIGIN + $q.a + m[1] + '/', $q.dB].concat(rows.map(rw => csvCell(rw[0]) + ',' + csvCell(rw[1])));
return txt(out.join('\n') + '\n', $q.dC, { 'content-disposition': $q.dD + m[1] + '.csv"', link: '<' + ORIGIN + $q.a + m[1] + $q.dE, 'x-robots-tag': $q.dF });
}
if (p === $q.dG || p === '/yc') return new Response(null, { status: 301, headers: { location: p + '/' } });
if (p === $q.cB || p === '/yc/') {
const ck = new Request(ORIGIN + $q.dH + p + Math.floor(Date.now() / 300000));
try { const hit = await caches.default.match(ck); if (hit) return hit; } catch (e) {}
const r = await shellPage(shell, 'en', p === '/yc/' ? await ycPage(env, inner) : await ycTryPage(inner));
try { const c = r.clone(), h = new Headers(c.headers); h.set($q.dI, $q.dj); if (ctx && ctx.waitUntil) ctx.waitUntil(caches.default.put(ck, new Response(c.body, { status: 200, headers: h }))); } catch (e) {}
return r;
}
let ix; try { ix = await N.data(env); } catch (e) { return new Response($t.k46, { status: 503, headers: { 'content-type': $q.di, 'retry-after': '60', 'cache-control': $q.dn } }); }
if ((m = /^\/answers\/place\/([a-z0-9-]{1,90})\.md$/.exec(p))) {
const pl = places(ix).find(z => z.s === m[1]); if (!pl) return nf();
return txt(await placeMd(env, ix, pl), $q.dw, { link: '<' + ORIGIN + '/m/' + encodeURIComponent(String(pl.mk).toLowerCase().replace(/\s+/g, '-')) + $q.dE });
}
if ((m = /^\/answers\/developer\/([a-z0-9-]{1,90})\.md$/.exec(p))) {
const dv = ix.devs.get(m[1]); if (!dv) return nf();
return txt(await devMd(env, ix, dv), $q.dw, { link: '<' + ORIGIN + $q.H + dv.s + $q.dE });
}
if ((m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?developers\/([a-z0-9-]{1,90})\/dashboard(\/?)$/.exec(p))) {
if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' } });
const dv = ix.devs.get(m[2]); if (!dv) return null;
return shellPage(shell, m[1] || 'en', await dashboard(env, ix, dv, m[1] || 'en'));
}
return null;
}
const cmpRow = (ix, x, tp, ot) => {
const c = ix.caseBy.get(x.id) || {}, ho = N.handoverOf(ix, x), lm = late(ot, x), pr = (ix.prom[x.id] || []).find(q => q.k === $q.dJ);
return { id: x.id, name: x.n, url: pUrl('en', x), developer: x.dv || null, place: [x.ar && x.ar !== x.mk ? x.ar : null, x.mk, x.co].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', '), stage: c.stage || null, reviewed: N.reviewed(c),
handover_on_record: ho ? ho.d : null, handover_times_moved: pr ? pr.mv || 0 : null, months_past_first_handover_date: lm && lm.late > 0 ? lm.late : 0, permit_number: x.pn || null, permit_published: !!(x.pn || (c.checks || {}).permit === 2),
deposit_protection_stated: (c.checks || {}).escrow === true, transparency_score: tp && typeof tp.score === $q.h ? tp.score : null, last_checked: N.lastmod(ix, x), answers: ORIGIN + $q.g + x.s + '.md' };
};
export async function mcpCompare(env, list) {
const ix = await N.data(env), ot = await file(env, $q.i), X = [], miss = [];
for (const k of list) { const x = ix.bySlug.get(k) || ix.byId.get(String(k).toUpperCase()); if (x && !X.includes(x)) X.push(x); else if (!x) miss.push(k); }
const tps = await Promise.all(X.map(x => trP(env, x.id, 'en')));
return { compared: X.map((x, i) => cmpRow(ix, x, tps[i], ot)), not_found: miss, compare_page: X.length >= 2 ? ORIGIN + $q.dK + X.map(x => x.s).join(',') : null,
rules: $s.k44 };
}
export async function mcpByYear(env, a) {
const ix = await N.data(env), ot = await file(env, $q.i), lc = s => String(s || '').toLowerCase();
let L = ix.P.filter(x => { const ho = N.handoverOf(ix, x); return ho && hyear(ho.d) === a.year; });
if (a.market) L = L.filter(x => lc(x.mk) === lc(a.market)); if (a.country) L = L.filter(x => lc(x.co) === lc(a.country) || lc(coName(x.co, 'en')) === lc(a.country));
L.sort((p, q) => String(p.mk).localeCompare(String(q.mk)) || p.n.localeCompare(q.n));
const total = L.length, page = L.slice(a.offset, a.offset + a.limit), tps = await Promise.all(page.map(x => trP(env, x.id, 'en')));
return { year: a.year, market: a.market || null, country: a.country || null, total, offset: a.offset, limit: a.limit, projects: page.map((x, i) => cmpRow(ix, x, tps[i], ot)),
note: $s.k45, data: ORIGIN + $q.w };
}
