// kolaboro.com batch 27 (agent n27a, 13 Nov 2026): answer engines, open data and what Y Combinator sees. No paid AI anywhere:
// every word is a template, every number comes from our published data files or from counters the site already keeps.
//   GET /answers/place/<slug>.md                one Markdown answer file per place (market), every named project with its quick answer
//   GET /answers/developer/<slug>.md            one Markdown answer file per developer
//   GET /api/v1/projects/<slug>.csv             the per-project record of /api/v1/projects/<slug> flattened to field,value rows
//   GET /corrections.json, /corrections.md      the corrections log of /corrections/ for machines (one source: that page's list)
//   GET /[<lang>/]developers/<slug>/dashboard/  read-only developer dashboard from public data (score, what is missing, how to send it)
//   GET /yc/                                    one-minute summary: problem, data, daily shipping, traction as counted (noindex)
//   GET /api/open/usage                         page views by page type per day (edge counters, lower bounds) and return visits
//   POST /api/open/rv?b=<bucket>                return-visit beacon (no id, no cookie; only "bucket + day -> count")
//   count(req, u, ctx)                          called for every kolaboro.com request: counts a page view by page type
//   metricsHtml()                               the block appended to /metrics/
// Counters: the worker has no durable counter store (no KV or analytics binding), so, like the answer-engine crawler counts of kbx_bots.js,
// they live in the edge cache of each Cloudflare location: a lower bound for the location that answers, kept up to 35 days.
// Rules kept: facts only, each with its source; no verdicts about a named company; Sumba projects never named (not in the named index).
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
const pUrl = (lang, x) => ORIGIN + pre(lang) + '/projects/' + x.s + '/';
const num = (n, lang) => { try { return new Intl.NumberFormat(LOC[lang] || 'en-GB').format(n); } catch (e) { return String(n); } };
const day = o => new Date(Date.now() - (o || 0) * 864e5).toISOString().slice(0, 10);
const median = a => { if (!a.length) return null; const s = a.slice().sort((p, q) => p - q), h = s.length >> 1; return s.length % 2 ? s[h] : Math.round((s[h - 1] + s[h]) / 2); };

// ------------------------------------------------------------------------------------------------ data
const MEMO = {};
async function file(env, name, ttl) {
  const m = MEMO[name]; if (m && Date.now() - m.t < (ttl || 600000)) return m.v;
  let v = null;
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); if (r.ok) v = await r.json(); } catch (e) { v = null; }
  MEMO[name] = { t: Date.now(), v }; return v;
}
const ymIdx = s => { const m = /^(\d{4})-(\d{2})/.exec(s || ''); return m ? +m[1] * 12 + (+m[2] - 1) : null; };
function late(ot, x) {   // months past the first handover date on record (rules of /data/on-time.json, same as kbx_cite.js)
  const p = ot && ot.projects && ot.projects[x.id]; if (!p || !p.first) return null;
  const now = ymIdx((ot.as_of_month || '') + '-01'), f = ymIdx(p.first + '-01'); if (now == null || f == null) return null;
  return { late: now - f, first: p.first, moved: p.moved || 0 };
}
async function trP(env, id, lang) { try { return await (await import('./kbx_tr.js')).trProject(env, id, lang); } catch (e) { return null; } }
export function places(ix) {   // markets of the named index, by size
  const m = new Map(); for (const x of ix.P) { const k = slug(x.mk); if (!k) continue; if (!m.has(k)) m.set(k, { s: k, mk: x.mk, co: x.co, L: [] }); m.get(k).L.push(x); }
  return [...m.values()].sort((a, b) => b.L.length - a.L.length || a.mk.localeCompare(b.mk));
}

// ------------------------------------------------------------------------------------------------ 87: answer files per place and per developer
function projLine(ix, x, tp, ot) {
  let qa = ''; try { qa = N.quickAnswer(ix, x, 'en', tp || null).replace(/\s+/g, ' ').trim(); } catch (e) { qa = ''; }
  const lm = late(ot, x);
  return '- [' + x.n + '](' + pUrl('en', x) + ')' + (qa ? ': ' + qa : '') + (lm && lm.late > 0 ? ' The first handover date on record (' + N.fd(lm.first, 'en') + ') passed ' + lm.late + ' months ago.' : '') + ' Answers: ' + ORIGIN + '/answers/' + x.s + '.md';
}
function figures(ix, L, ot, tps) {
  const cs = L.map(x => ix.caseBy.get(x.id) || {}), rv = L.filter(x => N.reviewed(ix.caseBy.get(x.id)));
  const withDate = L.filter(x => N.handoverOf(ix, x)).length, past = L.filter(x => { const l = late(ot, x); return l && l.late > 0; }).length;
  const permit = L.filter((x, i) => x.pn || (cs[i].checks || {}).permit === 2).length, scores = tps.filter(t => t && typeof t.score === 'number').map(t => t.score);
  return { n: L.length, rv: rv.length, withDate, past, permit, med: median(scores) };
}
async function placeMd(env, ix, pl) {
  const ot = await file(env, 'on-time.json'), L = pl.L.slice().sort((a, b) => a.n.localeCompare(b.n));
  const tps = await Promise.all(L.map(x => trP(env, x.id, 'en')));
  const f = figures(ix, L, ot, tps), today = N.iso(ix.updated) || day();
  const rk = (tps.find(t => t && t.ranks && t.ranks.length) || {}).ranks || [];
  const out = ['# Off-plan projects in ' + pl.mk + (pl.co && pl.co !== pl.mk ? ', ' + pl.co : '') + ': facts on record', '',
    'Canonical page: ' + ORIGIN + '/m/' + encodeURIComponent(String(pl.mk).toLowerCase().replace(/\s+/g, '-')) + '/', 'Data of ' + today + '. Licence: CC BY 4.0, attribute "Kolaboro" and link the page.', TB.kbx_n27a__s.k0, '',
    '## Quick answer {#answer}', '',
    'Kolaboro tracks ' + f.n + ' named off-plan project' + (f.n === 1 ? '' : 's') + ' in ' + pl.mk + ' (' + f.rv + ' reviewed). Handover date on record: ' + f.withDate + ' of ' + f.n + '. Past the first handover date on record: ' + f.past + '. ' +
      'Permit or licence number published: ' + f.permit + ' of ' + f.n + '.' + (f.med != null ? ' Median transparency score (what is published and checkable, 0 to 100): ' + f.med + '.' : ''), ''];
  if (rk.length) { out.push('## Transparency rankings {#rankings}', ''); for (const r of rk) out.push('- ' + r.p + ': ' + ORIGIN + '/rankings/transparency/' + r.s + '/'); out.push(''); }
  out.push('## Projects {#projects}', '');
  L.forEach((x, i) => out.push(projLine(ix, x, tps[i], ot)));
  out.push('', '## Sources {#sources}', '', '- ' + ORIGIN + '/data/named.json', '- ' + ORIGIN + '/data/bali-cases.json', '- ' + ORIGIN + '/data/on-time.json', '- ' + ORIGIN + '/methods/transparency-score/', '',
    '## How to cite {#cite}', '', 'Kolaboro, "Off-plan projects in ' + pl.mk + ': facts on record", ' + ORIGIN + '/answers/place/' + pl.s + '.md, data of ' + today + ', CC BY 4.0.', '');
  return out.join('\n');
}
async function devMd(env, ix, dv) {
  const ot = await file(env, 'on-time.json'), L = dv.ids.map(i => ix.byId.get(i)).filter(Boolean).sort((a, b) => a.n.localeCompare(b.n));
  const tps = await Promise.all(L.map(x => trP(env, x.id, 'en'))), f = figures(ix, L, ot, tps), today = N.iso(ix.updated) || day();
  const P = L.flatMap(x => (ix.prom[x.id] || []).map(q => q.st)), cnt = k => P.filter(s => s === k).length;
  const mks = [...new Set(L.map(x => x.mk))];
  const out = ['# ' + dv.n + ': developer facts on record', '', 'Canonical page: ' + ORIGIN + '/developers/' + dv.s + '/', 'Data of ' + today + '. Licence: CC BY 4.0, attribute "Kolaboro" and link the page.', TB.kbx_n27a__s.k1 + ORIGIN + '/developers/reply/', '',
    '## Quick answer {#answer}', '',
    dv.n + ' has ' + f.n + ' project' + (f.n === 1 ? '' : 's') + ' tracked by Kolaboro in ' + mks.join(', ') + ' (' + f.rv + ' reviewed). Handover date on record: ' + f.withDate + ' of ' + f.n + '. Past the first handover date on record: ' + f.past + '. Permit or licence number published: ' + f.permit + ' of ' + f.n + '.' +
      (P.length ? ' Dated promises on record: ' + P.length + ' (kept ' + cnt('kept') + ', date passed and not done ' + cnt('broken') + ', moved later ' + cnt('moved') + ', pending ' + cnt('pending') + ').' : '') + (f.med != null ? ' Median transparency score of its projects: ' + f.med + ' of 100.' : ''), '',
    '## Projects {#projects}', ''];
  L.forEach((x, i) => out.push(projLine(ix, x, tps[i], ot)));
  out.push('', '## Right of reply {#reply}', '', 'Developers never pay Kolaboro. To add a document or correct a fact: ' + ORIGIN + '/developers/reply/ . Public dashboard of what is missing: ' + ORIGIN + '/developers/' + dv.s + '/dashboard/', '',
    '## How to cite {#cite}', '', 'Kolaboro, "' + dv.n + ': developer facts on record", ' + ORIGIN + '/answers/developer/' + dv.s + '.md, data of ' + today + ', CC BY 4.0.', '');
  return out.join('\n');
}

// ------------------------------------------------------------------------------------------------ 88: per-project CSV
const csvCell = v => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
function flat(o, p, out) {
  if (o === null || o === undefined) { out.push([p, '']); return out; }
  if (Array.isArray(o)) { if (!o.length) out.push([p, '']); o.forEach((v, i) => flat(v, p + '[' + i + ']', out)); return out; }
  if (typeof o === 'object') { const k = Object.keys(o); if (!k.length) out.push([p, '']); for (const key of k) flat(o[key], p ? p + '.' + key : key, out); return out; }
  out.push([p, o]); return out;
}

// ------------------------------------------------------------------------------------------------ 91: corrections for machines (one source: the list on /corrections/)
const MON = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
const unent = s => String(s).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&rarr;/g, '→').replace(/\s+/g, ' ').trim();
async function corrections(env, shellFetch) {
  // n27t: one source for the page and for machines: /data/corrections.json (the page /corrections/ renders from it, kbx_t27.js);
  // the HTML list below is read only if that file cannot be loaded
  try {
    const r = env && env.ASSETS ? await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/corrections.json')) : null;
    let SL = {}; try { const ix = await N.data(env); for (const [id, x] of ix.byId) SL[id] = x.s; } catch (e) { SL = {}; }   // n28a: link the project page, not the /p/?id= redirect
    if (r && r.ok) { const C = await r.json(); return (C.entries || []).map(e => ({ date: e.date || null, project_id: e.id || null, link: e.id ? (SL[e.id] ? ORIGIN + '/projects/' + SL[e.id] + '/' : ORIGIN + '/p/' + encodeURIComponent(e.id) + '/') : null,
      correction: e.kind === 'pin' ? 'Map pin ' + e.after + '. ' + e.why : e.what + ': ' + (e.before ? 'changed from ' + e.before + ' to ' + e.after : 'changed to ' + e.after) + '. ' + e.why })); }
  } catch (e) {}
  let html = '';
  try { const r = await shellFetch('/corrections/'); if (r && r.ok) html = await r.text(); } catch (e) { html = ''; }
  const E = [];
  // every <li> of a list with class "clist" (the corrections log); the date comes first inside <b>, then the project id link
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

// ------------------------------------------------------------------------------------------------ 93, 100: counters at the edge
const TPL = [['home', /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/?)?$/], ['project', /^\/(?:[a-z]{2}\/)?projects\/[a-z0-9-]+\/$/], ['projects_index', /^\/(?:[a-z]{2}\/)?projects\/$/],
  ['developer', /^\/(?:[a-z]{2}\/)?developers\/[a-z0-9-]+\/(?:dashboard\/)?$/], ['ranking', /^\/(?:[a-z]{2}\/)?rankings\//], ['place', /^\/(?:[a-z]{2}\/)?(?:m|countries|handover|areas)\//],
  ['check', /^\/(?:[a-z]{2}\/)?check\/$/], ['compare', /^\/(?:[a-z]{2}\/)?(?:compare|vs)\//], ['guide', /^\/(?:[a-z]{2}\/)?(?:guides|stories|methods|how-we-score)\//], ['tool', /^\/(?:[a-z]{2}\/)?tools\//], ['pricing', /^\/(?:[a-z]{2}\/)?pricing\/$/]];
const TPL_NAMES = TPL.map(t => t[0]).concat(['other', '_search']);
const RV = ['new', 'd0', 'd1_7', 'd8_30', 'd31p'];
const CK = (d, k) => ORIGIN + '/__usage/v1/' + d + '/' + k;
async function inc0(k) {
  try { const c = caches.default, hit = await c.match(k), n = hit ? (+(await hit.text()) || 0) : 0;
    await c.put(k, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=3024000', 'content-type': 'text/plain' } })); } catch (e) {}
}
let CHAIN = Promise.resolve();
const inc = k => (CHAIN = CHAIN.then(() => inc0(k)));
const BOT = /bot|crawl|spider|slurp|lighthouse|headless|preview|fetch|curl|wget|python|httpclient|axios|GPT|Claude|anthropic|Perplexity|Bytespider|facebookexternalhit|meta-extern/i;
// n34c (batch 34, item 21): anonymous API usage per endpoint group and MCP tool, one JSON object per UTC day in the same edge cache
// ("endpoint group -> count", at most 120 groups a day; no IP, no key, no query string, no user agent kept). Our own probes are left out.
async function incJ0(k, f) {
  try { const c = caches.default, hit = await c.match(k); let o = {}; if (hit) { try { o = JSON.parse(await hit.text()) || {}; } catch (e) { o = {}; } }
    if (!(f in o) && Object.keys(o).length >= 120) f = '(other)'; o[f] = (o[f] || 0) + 1;
    await c.put(k, new Response(JSON.stringify(o), { headers: { 'cache-control': 'max-age=3024000', 'content-type': 'application/json' } })); } catch (e) {}
}
const incJ = (k, f) => (CHAIN = CHAIN.then(() => incJ0(k, f)));
export function apiGroup(p) {
  if (p === '/mcp' || p === '/mcp/') return 'POST /mcp';
  const m = /^\/api\/(v1|open)\/([a-z][a-z0-9_.-]{0,40})(?:\/([^/]{1,120}))?(?:\/([a-z][a-z0-9_.-]{0,30}))?/.exec(p); if (!m) return null;
  let g = '/api/' + m[1] + '/' + m[2].replace(/\.(json|csv|svg)$/, '.$1');
  if (m[3]) g += /^(feed\.json|at)$/.test(m[3]) ? '/' + m[3] : (/\.sig$/.test(m[3]) ? '/{id}.sig' : '/{id}');
  if (m[4]) g += '/' + m[4];
  return g;
}
export function countMcpTool(name, ctx) { if (typeof caches !== 'undefined' && ctx && ctx.waitUntil && /^[a-z_]{2,40}$/.test(name)) ctx.waitUntil(incJ(CK(day(), '_mcp'), name)); }
export async function apiUsage(days) {
  const per = [];
  for (let i = 0; i < days; i++) { const d = day(i); let a = {}, m = {};
    try { const r = await caches.default.match(CK(d, '_api')); if (r) a = JSON.parse(await r.text()) || {}; } catch (e) {}
    try { const r = await caches.default.match(CK(d, '_mcp')); if (r) m = JSON.parse(await r.text()) || {}; } catch (e) {}
    per.push({ date: d, a, m }); }
  const by = {}, mt = {}; for (const x of per) { for (const [k, v] of Object.entries(x.a)) by[k] = (by[k] || 0) + v; for (const [k, v] of Object.entries(x.m)) mt[k] = (mt[k] || 0) + v; }
  const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
  return { since: '2026-11-21', days, total: sum(by), mcp_total: sum(mt), by_endpoint: by, mcp_tools: mt, per_day: per.map(x => ({ date: x.date, calls: sum(x.a), mcp: sum(x.m) })),
    note: TB.kbx_n27a__s.k2 };
}
export function count(req, u, ctx) {
  if (typeof caches === 'undefined' || !ctx || !ctx.waitUntil) return;
  if ((req.method === 'GET' || req.method === 'POST') && /^\/(api\/(v1|open)\/|mcp\/?$)/.test(u.pathname) && !/kolaboro-|deploy-guard/i.test(req.headers.get('user-agent') || '')) {
    const g = apiGroup(u.pathname); if (g && (req.method === 'GET' || g === 'POST /mcp')) ctx.waitUntil(incJ(CK(day(), '_api'), g));
  }
  if (req.method !== 'GET') return;
  const h = req.headers;
  if (/^\/api\/v1\/search-index/.test(u.pathname)) { if (!BOT.test(h.get('user-agent') || '')) ctx.waitUntil(inc(CK(day(), '_search'))); return; }   // the search box loads this index when someone starts to type
  if (h.get('sec-fetch-dest') !== 'document' || h.get('sec-purpose') || h.get('purpose') || BOT.test(h.get('user-agent') || '')) return;   // real page loads in a browser; prefetch and prerender left out
  if (/^\/(?:admin|portal|agents\/me|backup-admin|api|__|cdn-cgi|k|data)\b/.test(u.pathname)) return;
  const t = (TPL.find(z => z[1].test(u.pathname)) || ['other'])[0];
  ctx.waitUntil(inc(CK(day(), t)));
}
// n39 t3 (25 Nov 2026): 404 and 5xx answers counted at the edge per UTC day, by kind (page, API, data, asset) and status, bots apart, plus
// the most hit missing page paths (paths only: no query, no IP, no user agent kept; private and token paths left out; at most 120 a day)
const ERRK = p => /^\/(api|mcp)\b/.test(p) ? 'api' : /^\/data\//.test(p) ? 'data' : /\.[a-z0-9]{2,5}$/i.test(p) || /^\/(k|_s|cdn-cgi)\//.test(p) ? 'asset' : 'page';
export function countStatus(req, u, st, ctx) {
  if (typeof caches === 'undefined' || !ctx || !ctx.waitUntil || !(st === 404 || st === 410 || st >= 500) || /kolaboro-|deploy-guard/i.test(req.headers.get('user-agent') || '')) return;
  const bot = BOT.test(req.headers.get('user-agent') || ''), k = ERRK(u.pathname), c = st >= 500 ? '5xx' : String(st);
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
  return { since: '2026-11-25', days, by_kind: by, top_paths: Object.entries(top).sort((x, y) => y[1] - x[1]).slice(0, 25).map(([k, n]) => ({ status: k.slice(0, 3), path: k.slice(4), n })), per_day: per,
    note: TB.kbx_n27a__s.k3 };
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
  const byTpl = {}; for (const k of TPL_NAMES.filter(k => k !== '_search')) { const v = sum(pv, k); if (v) byTpl[k] = v; }
  const R = {}; for (const b of RV) R[b] = sum(rv, 'rv_' + b);
  const sess = RV.reduce((a, b) => a + R[b], 0), back = R.d0 + R.d1_7 + R.d8_30 + R.d31p;
  return { page: ORIGIN + '/metrics/#usage', licence: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)', at: new Date().toISOString(), days,
    note: TB.kbx_n27a__s.k4,
    api_calls: api ? { since: api.since, total: api.total, by_endpoint: api.by_endpoint, mcp_tools: api.mcp_tools, note: api.note, page: ORIGIN + '/engineering/usage/' } : null,
    page_views_by_type: byTpl, page_views_total: Object.values(byTpl).reduce((a, b) => a + b, 0), searches_started: sum(pv, '_search'),
    return_visits: { note: TB.kbx_n27a__s.k5, sessions: sess, buckets: R, returning_share_pct: sess ? Math.round(back / sess * 1000) / 10 : null },
    per_day: pv.map((r, i) => ({ date: r.date, page_views: Object.entries(r.counts).filter(e => e[0] !== '_search').reduce((a, e) => a + e[1], 0), searches_started: r.counts._search || 0, sessions_counted: RV.reduce((a, b) => a + (rv[i].counts['rv_' + b] || 0), 0) })) };
}
export async function metricsHtml() {
  let u; try { u = await usage(28); } catch (e) { return ''; }
  const L = { home: 'Home', project: 'Project pages', projects_index: 'Project list', developer: 'Developer pages', ranking: 'Rankings', place: 'Place and country pages', check: 'Check a project', compare: 'Comparisons', guide: 'Guides and methods', tool: 'Tools', pricing: 'Pricing', other: 'Other pages' };
  const rows = Object.entries(u.page_views_by_type).sort((a, b) => b[1] - a[1]).map(([k, v]) => '<tr><td>' + esc(L[k] || k) + '</td><td style="text-align:end">' + num(v, 'en') + '</td></tr>').join('');
  const r = u.return_visits;
  return TB.kbx_n27a__s.k6 +
    (rows ? TB.kbx_n27a__s.k7 + rows + '</tbody></table></div>' : '<p>No page views counted in this location yet.</p>') +
    TB.kbx_n27a__s.k8 +
    '<p>Searches started (the search index loaded): <b>' + num(u.searches_started, 'en') + '</b>.</p>' +
    '<h3>Return visits</h3><p>' + (r.sessions ? 'Of ' + num(r.sessions, 'en') + ' sessions from visitors who accepted analytics cookies, ' + r.returning_share_pct + '% came back after an earlier visit (' + num(r.buckets.d0, 'en') + ' on the same day, ' + num(r.buckets.d1_7, 'en') + ' within 7 days, ' + num(r.buckets.d8_30, 'en') + ' after 8 to 30 days, ' + num(r.buckets.d31p, 'en') + ' after more than 30 days).' : 'No sessions counted yet in this location.') + TB.kbx_n27a__s.k9;
}

// ------------------------------------------------------------------------------------------------ 96: developer dashboard (8 languages)
const D = TB.kbx_n27a_D /* n40 k5: in /data/i18n/kbx_n27a.json */;
// n31e (batch 31, item 174): what each missing item is worth
const GAIN31 = { en: '+N next to a missing item: points this project’s transparency score would gain once that item is published and checkable.', es: '+N junto a lo que falta: puntos que ganaría la puntuación de transparencia del proyecto cuando eso se publique y se pueda comprobar.', de: '+N neben einem fehlenden Punkt: so viele Punkte gewönne der Transparenzwert des Projekts, sobald er veröffentlicht und prüfbar ist.', fr: '+N à côté d’un élément manquant : points que gagnerait le score de transparence du projet une fois cet élément publié et vérifiable.', nl: '+N bij een ontbrekend punt: zoveel punten zou de transparantiescore van het project winnen zodra het gepubliceerd en controleerbaar is.', ru: '+N рядом с недостающим пунктом: сколько баллов получит оценка прозрачности проекта, когда это будет опубликовано и проверяемо.', zh: '缺少项旁的 +N：该项公布且可核查后，项目透明度评分将增加的分数。', ar: '+N بجانب البند الناقص: النقاط التي ستضاف إلى درجة شفافية المشروع عند نشر هذا البند وإمكان التحقق منه.' };
const dt = (lang, k, v) => { const s = (D[lang] || D.en)[k]; return v ? String(s).replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
const bdi = s => '<bdi>' + esc(s) + '</bdi>';
const fdate = (d, lang) => { try { return new Intl.DateTimeFormat(LOC[lang] || 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z')); } catch (e) { return d; } };
/* CSS: n40 k17, in /data/i18n/k17s.json */
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
    return '<tr><td data-l="' + esc(th[0]) + '"><a href="' + pre(lang) + '/projects/' + x.s + '/">' + bdi(x.n) + '</a><small>' + esc([x.ar && x.ar !== x.mk ? x.ar : null, mkName(x.mk, lang)].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', ')) + (rv ? '' : ' · ' + esc(dt(lang, 'nr'))) + '</small></td>' +
      '<td data-l="' + esc(th[1]) + '"><span class="k27-n">' + (tp && typeof tp.score === 'number' ? tp.score + '/100' : '?') + '</span>' + (rk.length ? '<small>' + esc(rk.join(' · ')) + '</small>' : '') + '</td>' +
      '<td data-l="' + esc(th[2]) + '">' + (have.length ? '<ul class="k27-m">' + have.map(z => '<li>' + esc(z.label) + '</li>').join('') + '</ul>' : '0') + '</td>' +
      '<td data-l="' + esc(th[3]) + '">' + (lack.length ? '<ul class="k27-m">' + lack.map(z => '<li>' + esc(z.label) + (z.gain ? ' <b dir="ltr">+' + z.gain + '</b>' : '') + '</li>').join('') + '</ul>' : esc(dt(lang, 'none'))) + '<a class="k27-b" href="/developers/reply/?id=' + encodeURIComponent(x.id) + '">' + esc(dt(lang, 'send')) + '</a></td></tr>';
  });
  const sc = tps.filter(t => t && typeof t.score === 'number').map(t => t.score), top = [...miss.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(e => e[0]);
  const body = '<p class="k27-sum"><b>' + esc(dt(lang, 'sum', { k: num(L.length, lang), m: sc.length ? median(sc) : '?' })) + '</b>' + (top.length ? ' ' + esc(dt(lang, 'most', { i: top.join(', ') })) : '') + '</p>' +
    '<h2 id="projects">' + esc(dt(lang, 'h_p')) + '</h2><p class="muted">' + esc(GAIN31[lang] || GAIN31.en) + '</p><div class="k27-tw"><table><thead><tr>' + th.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>' +
    '<h2 id="how">' + esc(dt(lang, 'h_how')) + '</h2><ol>' + dt(lang, 'how').map(s => '<li>' + esc(s) + '</li>').join('') + '</ol>' +
    '<p class="k27-lk"><a href="' + pre(lang) + '/developers/' + dv.s + '/">' + esc(dt(lang, 'page')) + '</a><a href="' + pre(lang) + '/methods/transparency-score/">' + esc(dt(lang, 'm')) + '</a><a href="/answers/developer/' + dv.s + '.md">Markdown</a></p><p class="muted">' + esc(dt(lang, 'note', { d: fdate(today, lang) })) + '</p>';
  const name = dv.n || dv.s;
  return { path: '/developers/' + dv.s + '/dashboard/', title: dt(lang, 'title', { d: name }), h1: dt(lang, 'title', { d: name }), h1h: esc(dt(lang, 'title', { d: '\u0001' })).replace('\u0001', bdi(name)), lead: dt(lang, 'lead'), body, updated: today, noindex: true,
    crumbs: [['Kolaboro', '/'], [name, '/developers/' + dv.s + '/'], [dt(lang, 'title', { d: '' }).replace(/^[:：\s]+/, ''), '/developers/' + dv.s + '/dashboard/']] };
}

// n31t (batch 31, items 296 and 298): the weekly main metric (visits and paid checks, zeros shown) and a weekly chart of projects
// tracked, visits, leads and paid checks for the last 8 weeks. Same sources as below: kolaboro_metrics_public (weeks start Monday,
// UTC) and /api/x/progress (projects tracked per day). An SVG with the numbers written on it, and the same numbers as a table.
function ycWeekly(W, days, T) {
  const wk = W.slice(-8); if (!wk.length) return '';
  const endOf = w => { const e = new Date(Date.parse(w + 'T00:00:00Z') + 7 * 864e5).toISOString().slice(0, 10); let v = null; for (const d of days) if (d.d < e) v = d.total; return v; };
  const rows = wk.map(w => ({ w: w.week, p: endOf(w.week), v: w.visits || 0, l: w.leads || 0, c: w.paid_checks || 0, r: w.revenue_eur || 0 }));
  const cur = rows[rows.length - 1], prev = rows[rows.length - 2];
  const sd = d => { try { return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z')); } catch (e) { return d; } };
  const S = [['p', 'Projects tracked (end of week)', '#155C75'], ['v', 'Visits', '#FF5B14'], ['l', 'Leads', '#7A5AF8'], ['c', 'Paid checks', '#0B7A55']];
  const pw = 230, ph = 150, gap = 16, bw = (pw - 20) / rows.length;
  const panel = (k, label, col, i) => {
    const max = Math.max(1, ...rows.map(r => r[k] || 0)), x0 = i * (pw + gap);
    return '<g transform="translate(' + x0 + ',0)"><text x="0" y="14" font-size="13" font-weight="700" fill="currentColor">' + esc(label) + '</text>' +
      rows.map((r, j) => { const v = r[k] || 0, h = v ? Math.max(2, Math.round((ph - 50) * v / max)) : 0, x = 10 + j * bw, y = ph - 18 - h;
        return '<rect x="' + (x + 2) + '" y="' + y + '" width="' + (bw - 4) + '" height="' + h + '" fill="' + col + '" rx="2"/>' + '<text x="' + (x + bw / 2) + '" y="' + (y - 4) + '" font-size="9.5" text-anchor="middle" fill="currentColor">' + (r[k] == null ? '' : num(v, 'en')) + '</text>' +
          (j % 2 === rows.length % 2 ? '' : '<text x="' + (x + bw / 2) + '" y="' + (ph - 4) + '" font-size="9" text-anchor="middle" fill="currentColor" opacity=".7">' + esc(sd(r.w)) + '</text>'); }).join('') +
      '<line x1="10" y1="' + (ph - 18) + '" x2="' + (pw - 10) + '" y2="' + (ph - 18) + '" stroke="currentColor" opacity=".3"/></g>';
  };
  const svg = '<svg viewBox="0 0 ' + (4 * pw + 3 * gap) + ' ' + ph + TB.kbx_n27a__s.k10 + rows.length + ' weeks</title>' + S.map((x, i) => panel(x[0], x[1], x[2], i)).join('') + '</svg>';
  const tbl = TB.kbx_n27a__s.k11 +
    rows.slice().reverse().map(r => '<tr><td>' + esc(fdate(r.w, 'en')) + '</td><td class="k27-n">' + (r.p == null ? 'n/a' : num(r.p, 'en')) + '</td><td class="k27-n">' + num(r.v, 'en') + '</td><td class="k27-n">' + num(r.l, 'en') + '</td><td class="k27-n">' + num(r.c, 'en') + '</td><td class="k27-n">' + num(r.r, 'en') + '</td></tr>').join('') + '</tbody></table></div></details>';
  return '<h2 id="weekly">The number we watch every week</h2><p class="k27-sum"><b>Week from ' + esc(fdate(cur.w, 'en')) + ' (so far): ' + num(cur.v, 'en') + ' visits and ' + num(cur.c, 'en') + ' paid checks (' + num(cur.r, 'en') + ' euros).</b>' +
    (prev ? ' Week before: ' + num(prev.v, 'en') + ' visits, ' + num(prev.c, 'en') + ' paid checks.' : '') + ' Paid checks so far: ' + num(T.paid_checks || 0, 'en') + '. We show the zeros: converting visits into paid checks is the work in front of us.</p>' +
    TB.kbx_n27a__s.k12 + svg + TB.kbx_n27a__s.k13 + tbl;
}

// ------------------------------------------------------------------------------------------------ 98: /yc/ one-minute summary (English, noindex)
async function ycPage(env, inner) {
  const j = async p => { try { const r = await inner(p); return r && r.ok ? await r.json() : null; } catch (e) { return null; } };
  const [st, pg] = await Promise.all([j('/api/open/stats'), j('/api/x/progress')]);
  let mt = null; try { mt = await rpc('kolaboro_metrics_public', {}); } catch (e) { mt = null; }
  const W = (mt && mt.weeks) || [], last = W.slice(-4), sumW = k => last.reduce((a, w) => a + (w[k] || 0), 0), T = (mt && mt.totals) || {};
  const live = (pg && pg.live) || {}, f = n => n == null ? 'n/a' : num(n, 'en');
  const days = ((pg && pg.per_day) || []).filter(d => d.total > 0), first = days[0];
  const b = TB.kbx_n27a__s.k14 + ycWeekly(W, days, T) + TB.kbx_n27a__s.k15 +
    TB.kbx_n27a__s.k16 +
    '<h2 id="data">The data today</h2><ul><li>' + f(st && st.projects) + ' projects in ' + f(st && st.markets) + ' markets and ' + f(st && st.countries) + ' countries' + (first ? ', up from ' + f(first.total) + ' on ' + fdate(first.d, 'en') : '') + '.</li><li>' + f(st && st.claims_total) + ' developer claims tested against registers, courts and press; ' + f(st && st.claims && st.claims.contradicted) + ' contradicted by another source.</li><li>' + f(st && st.sources) + ' sources, ' + f(st && st.data_points) + ' data points, ' + f(live.sitemap_urls) + TB.kbx_n27a__s.k17 +
    '<h2 id="shipping">Shipping daily</h2><p>' + f(live.ships_7d) + ' changes shipped and ' + f(live.deploys_7d) + TB.kbx_n27a__s.k18 +
    TB.kbx_n27a__s.k19 + f(sumW('visits')) + '.</li><li>Leads in the last 4 weeks: ' + f(sumW('leads')) + ' (all time: ' + f(T.leads) + ').</li><li>Desk reviews run in the last 4 weeks: ' + f(sumW('desk_reviews')) + '.</li><li>Paid checks so far: ' + f(T.paid_checks != null ? T.paid_checks : sumW('paid_checks')) + '. Revenue so far: ' + f(T.revenue_eur != null ? T.revenue_eur : 0) + TB.kbx_n27a__s.k20 +
    TB.kbx_n27a__s.k21 +
    TB.kbx_n27a__s.k22 +
    TB.kbx_n27a__s.k23 +
    TB.kbx_n27a__s.k24 +
    TB.kbx_n27a__s.k25;
  return { path: '/yc/', title: 'Kolaboro in one minute', h1: 'Kolaboro in one minute', lead: TB.kbx_n27a__s.k26, body: b, updated: (st && st.updated) || day(), noindex: true, langs: false, crumbs: [['Kolaboro', '/'], ['One-minute summary', '/yc/']] };
}

// ------------------------------------------------------------------------------------------------ n36e: /yc/try/ "Try it in 2 minutes" for reviewers (English, noindex)
async function ycTryPage(inner) {
  let st = null; try { const r = await inner('/api/open/stats'); st = r && r.ok ? await r.json() : null; } catch (e) { st = null; }
  const f = n => n == null ? 'n/a' : num(n, 'en');
  const step = (n, h, how, exp) => '<li style="margin:0 0 18px"><h2 style="font-size:1.15rem;margin:0 0 6px">' + n + '. ' + h + '</h2><p style="margin:0 0 6px">' + how + '</p><p style="margin:0" class="k-muted"><b>You should see:</b> ' + exp + '</p></li>';
  const b = TB.kbx_n27a__s.k27 + f(st && st.projects) + ' projects in ' + f(st && st.markets) + ' markets and ' + f(st && st.countries) + ' countries, each fact with its source. No login, no card. Works on a phone.</p>' +
    '<ol style="list-style:none;padding:0;margin:18px 0">' +
    step(1, 'Find a project and read its six checks', TB.kbx_n27a__s.k28, TB.kbx_n27a__s.k29) +
    step(2, 'Measure any project website', 'Open <a href="/check/?q=' + encodeURIComponent('https://www.emaar.com/en/properties/golf-vale-at-emaar-south') + TB.kbx_n27a__s.k30, TB.kbx_n27a__s.k31) +
    step(3, 'Ask the data a question', TB.kbx_n27a__s.k32, TB.kbx_n27a__s.k33) +
    step(4, 'Compare projects and check a price', TB.kbx_n27a__s.k34, TB.kbx_n27a__s.k35) +
    step(5, 'Use it as a developer', TB.kbx_n27a__s.k36, TB.kbx_n27a__s.k37) +
    TB.kbx_n27a__s.k38 +
    TB.kbx_n27a__s.k39;
  return { path: '/yc/try/', title: 'Try Kolaboro in 2 minutes', h1: 'Try it in 2 minutes', lead: 'Five things to try on the live site, each with a real link and the result you should see.', body: b, updated: (st && st.updated) || day(), noindex: true, langs: false, crumbs: [['Kolaboro', '/'], ['One-minute summary', '/yc/'], ['Try it in 2 minutes', '/yc/try/']] };
}

// ------------------------------------------------------------------------------------------------ page shell (same pattern as kbx_cite.js)
async function shellPage(shell, lang, o) {
  const path = o.path, canon = ORIGIN + pre(lang) + path;
  const alts = o.langs === false ? '' : LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + path + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + path + '">';
  const crumbs = o.crumbs.map(([n, p]) => [n, ORIGIN + pre(lang) + p]);
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebPage', '@id': canon + '#page', url: canon, name: o.h1, description: o.lead, inLanguage: lang, dateModified: o.updated, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] })) }] };
  const tags = '<title>' + esc(o.title) + ' | Kolaboro</title><meta name="description" content="' + esc(o.lead) + '"><link rel="canonical" href="' + canon + '">' + alts +
    '<meta name="robots" content="' + (o.noindex ? 'noindex, follow' : 'index, follow') + TB.kbx_n27a__s.k40 + esc(o.title) + '"><meta property="og:description" content="' + esc(o.lead) + '"><meta property="og:url" content="' + canon + '"><meta property="og:image" content="' + ORIGIN + '/k/og/home.png"><meta name="twitter:card" content="summary_large_image">' +
    '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' + TB.kbx_n27a__s.CSS;
  const main = '<section class="phero"><div class="wrap"><p class="crumb">' + crumbs.map((c, i) => i < crumbs.length - 1 ? '<a href="' + esc(c[1].replace(ORIGIN, '')) + '">' + bdi(c[0]) + '</a>' : bdi(c[0])).join(' / ') + '</p><h1>' + (o.h1h || esc(o.h1)) + '</h1><p class="lead">' + esc(o.lead) + TB.kbx_n27a__s.k41 + o.body + '</div></section>';
  const sh = await shell(pre(lang) + '/how-we-score/');
  const res = new HTMLRewriter()
    .on('title', { element(e) { e.remove(); } })
    .on(TB.kbx_n27a__s.k42, { element(e) { e.remove(); } })
    .on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(main, { html: true }); } })
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + (o.langs === false && l !== lang ? '/' : path)); } })   // n35v: English-only pages (/yc/) linked /es/yc/ etc., which are 404s
    .transform(new Response(sh.body, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
  const h = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=900' }; if (o.noindex) h['x-robots-tag'] = 'noindex, follow';
  return new Response(await res.text(), { status: 200, headers: h });
}

// ------------------------------------------------------------------------------------------------ routes
const txt = (body, type, extra) => new Response(body, { headers: Object.assign({ 'content-type': type, 'cache-control': 'public, max-age=900', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' }, extra || {}) });
const nf = () => new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=300' } });
export async function handle(req, u, env, ctx, shell, inner) {
  const p = u.pathname; let m;
  if (!PATHS.test(p)) return null;
  if (p === '/api/open/rv' || p === '/api/open/rv/') {   // return-visit beacon: one bucket name, nothing else is read or kept
    if (req.method !== 'POST') return new Response('POST only', { status: 405, headers: { allow: 'POST' } });
    const b = u.searchParams.get('b');
    if (RV.includes(b) && typeof caches !== 'undefined' && ctx && ctx.waitUntil && !BOT.test(req.headers.get('user-agent') || '')) ctx.waitUntil(inc(CK(day(), 'rv_' + b)));
    return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  if (p === '/api/open/usage' || p === '/api/open/usage/') { const d = Math.min(35, Math.max(1, +u.searchParams.get('days') || 28)); return txt(JSON.stringify(Object.assign(await usage(d), { errors: await errUsage(Math.min(d, 14)) }), null, 1), 'application/json; charset=utf-8', { 'cache-control': 'public, max-age=300' }); }
  if (p === '/corrections.json' || p === '/corrections.md') {
    const E = await corrections(env, shell);
    const head = { page: ORIGIN + '/corrections/', licence: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)', at: new Date().toISOString().slice(0, 10), rules: TB.kbx_n27a__s.k43 + ORIGIN + '/corrections/ ; developers can reply with documents on any project page.', count: E.length };
    if (p.endsWith('.json')) return txt(JSON.stringify(Object.assign(head, { corrections: E }), null, 1), 'application/json; charset=utf-8');
    const L = ['# Kolaboro: known errors and corrections', '', 'Canonical page: ' + ORIGIN + '/corrections/ . The same log as JSON: ' + ORIGIN + '/corrections.json . Licence: CC BY 4.0.', '', head.rules, '', '## Log (' + E.length + ')', ''];
    for (const e of E) L.push('- ' + (e.date || 'undated') + (e.project_id ? ', ' + e.project_id : '') + ': ' + e.correction + (e.link ? ' (' + e.link + ')' : ''));
    if (!E.length) L.push('No corrections logged yet.');
    return txt(L.join('\n') + '\n', 'text/markdown; charset=utf-8', { link: '<' + ORIGIN + '/corrections/>; rel="canonical"' });
  }
  if ((m = /^\/api\/v1\/projects\/([a-z0-9-]{1,90})\.csv$/.exec(p))) {
    let r; try { r = await inner('/api/v1/projects/' + m[1]); } catch (e) { r = null; }
    if (!r || r.status === 404) return nf();
    if (!r.ok) return new Response('Data unavailable, try again in a minute.', { status: 503, headers: { 'retry-after': '60', 'cache-control': 'no-store' } });
    const d = await r.json(), rows = flat(d, '', []);
    const out = ['# Kolaboro project record ' + (d.id || '') + ' (' + (d.name || m[1]) + '), the same facts as ' + ORIGIN + '/api/v1/projects/' + m[1] + ' . CC BY 4.0, attribute "Kolaboro" and link ' + ORIGIN + '/projects/' + m[1] + '/', 'field,value'].concat(rows.map(rw => csvCell(rw[0]) + ',' + csvCell(rw[1])));
    return txt(out.join('\n') + '\n', 'text/csv; charset=utf-8', { 'content-disposition': 'inline; filename="kolaboro-' + m[1] + '.csv"', link: '<' + ORIGIN + '/projects/' + m[1] + '/>; rel="canonical"', 'x-robots-tag': 'noindex' });
  }
  if (p === '/yc/try' || p === '/yc') return new Response(null, { status: 301, headers: { location: p + '/' } });
  if (p === '/yc/try/' || p === '/yc/') {   // n36e: reviewers land here; the built page is kept 5 minutes at the edge (live figures, cold loads were up to 5 s)
    const ck = new Request(ORIGIN + '/__yc_cache' + p + Math.floor(Date.now() / 300000));
    try { const hit = await caches.default.match(ck); if (hit) return hit; } catch (e) {}
    const r = await shellPage(shell, 'en', p === '/yc/' ? await ycPage(env, inner) : await ycTryPage(inner));
    try { const c = r.clone(), h = new Headers(c.headers); h.set('cache-control', 'public, max-age=300'); if (ctx && ctx.waitUntil) ctx.waitUntil(caches.default.put(ck, new Response(c.body, { status: 200, headers: h }))); } catch (e) {}
    return r;
  }
  let ix; try { ix = await N.data(env); } catch (e) { return new Response('Data unavailable, try again in a minute.', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8', 'retry-after': '60', 'cache-control': 'no-store' } }); }
  if ((m = /^\/answers\/place\/([a-z0-9-]{1,90})\.md$/.exec(p))) {
    const pl = places(ix).find(z => z.s === m[1]); if (!pl) return nf();
    return txt(await placeMd(env, ix, pl), 'text/markdown; charset=utf-8', { link: '<' + ORIGIN + '/m/' + encodeURIComponent(String(pl.mk).toLowerCase().replace(/\s+/g, '-')) + '/>; rel="canonical"' });
  }
  if ((m = /^\/answers\/developer\/([a-z0-9-]{1,90})\.md$/.exec(p))) {
    const dv = ix.devs.get(m[1]); if (!dv) return nf();
    return txt(await devMd(env, ix, dv), 'text/markdown; charset=utf-8', { link: '<' + ORIGIN + '/developers/' + dv.s + '/>; rel="canonical"' });
  }
  if ((m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?developers\/([a-z0-9-]{1,90})\/dashboard(\/?)$/.exec(p))) {
    if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' } });
    const dv = ix.devs.get(m[2]); if (!dv) return null;   // falls through to the usual 404
    return shellPage(shell, m[1] || 'en', await dashboard(env, ix, dv, m[1] || 'en'));
  }
  return null;
}

// ------------------------------------------------------------------------------------------------ 90: MCP tools (called from kbx_e.js)
const cmpRow = (ix, x, tp, ot) => {
  const c = ix.caseBy.get(x.id) || {}, ho = N.handoverOf(ix, x), lm = late(ot, x), pr = (ix.prom[x.id] || []).find(q => q.k === 'handover');
  return { id: x.id, name: x.n, url: pUrl('en', x), developer: x.dv || null, place: [x.ar && x.ar !== x.mk ? x.ar : null, x.mk, x.co].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', '), stage: c.stage || null, reviewed: N.reviewed(c),
    handover_on_record: ho ? ho.d : null, handover_times_moved: pr ? pr.mv || 0 : null, months_past_first_handover_date: lm && lm.late > 0 ? lm.late : 0, permit_number: x.pn || null, permit_published: !!(x.pn || (c.checks || {}).permit === 2),
    deposit_protection_stated: (c.checks || {}).escrow === true, transparency_score: tp && typeof tp.score === 'number' ? tp.score : null, last_checked: N.lastmod(ix, x), answers: ORIGIN + '/answers/' + x.s + '.md' };
};
export async function mcpCompare(env, list) {
  const ix = await N.data(env), ot = await file(env, 'on-time.json'), X = [], miss = [];
  for (const k of list) { const x = ix.bySlug.get(k) || ix.byId.get(String(k).toUpperCase()); if (x && !X.includes(x)) X.push(x); else if (!x) miss.push(k); }
  const tps = await Promise.all(X.map(x => trP(env, x.id, 'en')));
  return { compared: X.map((x, i) => cmpRow(ix, x, tps[i], ot)), not_found: miss, compare_page: X.length >= 2 ? ORIGIN + '/compare/?p=' + X.map(x => x.s).join(',') : null,
    rules: TB.kbx_n27a__s.k44 };
}
export async function mcpByYear(env, a) {
  const ix = await N.data(env), ot = await file(env, 'on-time.json'), lc = s => String(s || '').toLowerCase();
  let L = ix.P.filter(x => { const ho = N.handoverOf(ix, x); return ho && hyear(ho.d) === a.year; });
  if (a.market) L = L.filter(x => lc(x.mk) === lc(a.market)); if (a.country) L = L.filter(x => lc(x.co) === lc(a.country) || lc(coName(x.co, 'en')) === lc(a.country));
  L.sort((p, q) => String(p.mk).localeCompare(String(q.mk)) || p.n.localeCompare(q.n));
  const total = L.length, page = L.slice(a.offset, a.offset + a.limit), tps = await Promise.all(page.map(x => trP(env, x.id, 'en')));
  return { year: a.year, market: a.market || null, country: a.country || null, total, offset: a.offset, limit: a.limit, projects: page.map((x, i) => cmpRow(ix, x, tps[i], ot)),
    note: TB.kbx_n27a__s.k45, data: ORIGIN + '/data/named.json' };
}
