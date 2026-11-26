// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_bots__q, $s = TB.kbx_bots__s, $t = TB.kbx_bots__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TB } from './kbx_strings.js';
export const PATH = /^\/api\/open\/ai-crawlers\/?$/;
const BOTS = [
['GPTBot', /GPTBot/i, 'ai'], ['OAI-SearchBot', /OAI-SearchBot/i, 'ai'], ['ChatGPT-User', /ChatGPT-User/i, 'ai'],
['ClaudeBot', /ClaudeBot/i, 'ai'], ['Claude-User', /Claude-User/i, 'ai'], ['Claude-SearchBot', /Claude-SearchBot/i, 'ai'], ['anthropic-ai', /anthropic-ai/i, 'ai'],
['PerplexityBot', /PerplexityBot/i, 'ai'], ['Perplexity-User', /Perplexity-User/i, 'ai'], ['Google-CloudVertexBot', /Google-CloudVertexBot/i, 'ai'],
['Applebot', /Applebot/i, 'ai'], ['Amazonbot', /Amazonbot/i, 'ai'], ['CCBot', /CCBot/i, 'ai'], ['Bytespider', /Bytespider/i, 'ai'],
['meta-externalagent', /meta-external(agent|fetcher)/i, 'ai'], ['DuckAssistBot', /DuckAssistBot/i, 'ai'], ['cohere-ai', /cohere-(ai|training)/i, 'ai'],
['MistralAI-User', /MistralAI-User/i, 'ai'], ['YouBot', /YouBot/i, 'ai'], ['Diffbot', /Diffbot/i, 'ai'], ['PetalBot', /PetalBot/i, 'ai'],
['Googlebot', /Googlebot/i, 'search'], ['bingbot', /bingbot/i, 'search'], ['YandexBot', /YandexBot/i, 'search'], ['DuckDuckBot', /DuckDuckBot/i, 'search']];
const NAMES = BOTS.map(b => b[0]);
const KEY = (d, b) => $q.a + d + '/' + encodeURIComponent(b);
const day = (o) => new Date(Date.now() - (o || 0) * 864e5).toISOString().slice(0, 10);
export function botOf(ua) { if (!ua) return null; for (const [n, rx] of BOTS) if (rx.test(ua)) return n; return null; }
async function inc0(k) {
try { const c = caches.default, hit = await c.match(k), n = hit ? (+(await hit.text()) || 0) : 0;
await c.put(k, new Response(String(n + 1), { headers: { 'cache-control': $q.b, 'content-type': $q.c } })); } catch (e) {}
}
let CHAIN = Promise.resolve();
const inc = k => (CHAIN = CHAIN.then(() => inc0(k)));
export function count(req, u, ctx) {
  if (typeof caches === $q.d || !ctx || !ctx.waitUntil) return;
  const b = botOf(req.headers.get($q.e) || ''); if (!b) return;
  if (/^\/(?:__|cdn-cgi\/)/.test(u.pathname)) return;
  const d = day();
  ctx.waitUntil(inc(KEY(d, b)));
  if (/^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?llms|^\/answers\/|^\/llms\//.test(u.pathname)) ctx.waitUntil(inc(KEY(d, $q.f)));   // llms*.txt and answer files
  if (KIND.get(b) === 'ai') ctx.waitUntil(inc(KEY(d, '_fam_' + famOf(u.pathname))));   // n31s (item 225): Answer-engine crawler requests by page family
}
export const FAMS = [['project', 'Project pages'], ['developer', 'Developer pages'], ['place', 'Place and market pages'], ['ranking', 'Rankings'], ['guide', 'Guides and glossary'], ['report', 'Reports and weekly logs'], ['answer', 'llms.txt and answer files'], ['data', 'API, data and MCP'], ['home', 'Home page'], ['other', 'Other pages']];
const KIND = new Map(BOTS.map(b => [b[0], b[2]]));
export function famOf(p) {
p = String(p || '/').replace(/^\/(?:es|de|fr|nl|ru|zh|ar)(?=\/|$)/, '') || '/';
if (p === '/') return 'home';
if (/^\/(?:llms|answers\/)|\.md$/.test(p)) return $q.g;
if (/^\/(?:api|data|mcp|docs|sdk|feed)/.test(p)) return 'data';
if (/^\/projects\/[^/]+\//.test(p)) return $q.h;
if (/^\/developers\/[^/]+\//.test(p)) return $q.i;
if (/^\/(?:m|countries|areas|handover|price-ranges|prices|permits|ownership|golden-visa|airports|map)(?:\/|$)/.test(p)) return 'place';
if (/^\/rankings(?:\/|$)/.test(p)) return $q.j;
if (/^\/(?:guides|glossary|tools|methods)(?:\/|$)/.test(p)) return 'guide';
if (/^\/(?:reports|weekly|numbers|press)(?:\/|$)/.test(p)) return $q.k;
return 'other';
}
async function read(days) {
const out = [];
for (let i = 0; i < days; i++) {
const d = day(i), fk = FAMS.map(f => '_fam_' + f[0]), all = await Promise.all(NAMES.concat([$q.f], fk).map(async b => { try { const h = await caches.default.match(KEY(d, b)); return h ? (+(await h.text()) || 0) : 0; } catch (e) { return 0; } }));
const vals = all.slice(0, NAMES.length + 1), fv = all.slice(NAMES.length + 1), families = {}; FAMS.forEach((f, j) => { if (fv[j]) families[f[0]] = fv[j]; });
const bots = {}; NAMES.forEach((n, j) => { if (vals[j]) bots[n] = vals[j]; });
out.push({ date: d, bots, ai: NAMES.reduce((a, n, j) => a + (BOTS[j][2] === 'ai' ? vals[j] : 0), 0), search: NAMES.reduce((a, n, j) => a + (BOTS[j][2] === $q.l ? vals[j] : 0), 0), llms_and_answer_files: vals[vals.length - 1], ai_by_page_family: families });
}
return out;
}
let MEMO = { t: 0, v: null, colo: null };
async function data(req) {
const colo = (req.cf && req.cf.colo) || null;
if (MEMO.v && MEMO.colo === colo && Date.now() - MEMO.t < 120000) return MEMO.v;
const v = { as_of: new Date().toISOString(), location: colo, days: await read(14),
method: $s.k0 + (colo || $q.m) + $s.k1,
crawlers: BOTS.map(b => ({ name: b[0], kind: b[2] })), since: $q.n };
MEMO = { t: Date.now(), v, colo }; return v;
}
export async function api(req) {
  return new Response(JSON.stringify(await data(req), null, 1), { headers: { 'content-type': $q.o, 'cache-control': $q.p, 'access-control-allow-origin': '*', 'x-robots-tag': $q.q } });
}
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.r, "'": '&#39;' }[c]));
function famTable(D) {
const nf = n => new Intl.NumberFormat('en-GB').format(n), W = D.days.slice(0, 7), tot = {}; let all = 0;
for (const d of W) for (const [k, v] of Object.entries(d.ai_by_page_family || {})) { tot[k] = (tot[k] || 0) + v; all += v; }
const rows = FAMS.filter(f => tot[f[0]]).map(f => $q.s + esc(f[1]) + $q.t + nf(tot[f[0]]) + $q.t + Math.round(tot[f[0]] / all * 100) + $q.u).join('');
return $t.k0 + (all ? $s.k2 + rows + $q.v : $t.k1) + $s.k3;
}
export async function html(req) {
  const D = await data(req), nf = n => new Intl.NumberFormat('en-GB').format(n);
  const seen = NAMES.filter(n => D.days.some(d => d.bots[n]));
  const rows = D.days.slice(0, 7).map(d => $q.s + d.date + $q.w + nf(d.ai) + $q.w + nf(d.search) + $q.w + nf(d.llms_and_answer_files) + $q.w + (Object.entries(d.bots).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, v]) => esc(n) + ' ' + nf(v)).join(', ') || '-') + $q.x).join('');
  return $q.y + esc(D.since) + $q.z + esc(D.location || $q.m) + $q.A +
    $q.B + rows + $q.v +
    famTable(D) + $q.C + BOTS.map(b => esc(b[0])).join(', ') + '. ' + (seen.length ? $q.D + seen.map(esc).join(', ') + '.' : $q.E) + $q.F;
}
