// kolaboro.com (n26i, batch 26): visits of AI crawlers and answer-engine fetchers per day, from the requests this site serves.
// The worker kept no user-agent log before this batch and has no durable counter store (no KV or analytics binding, no table for
// it), so the counts live in the edge cache of each Cloudflare location: a lower bound for that one location, kept up to 30 days,
// and lost if the location evicts them. The page says so. Nothing about the visitor is stored: only "bot name + day -> count".
//   count(req, u, ctx)            called for every kolaboro.com request; does nothing unless the user agent is a known crawler
//   GET /api/open/ai-crawlers     the last 14 days for the location that answers, as JSON
//   html(req, lang)               the block shown on /engineering/
export const PATH = /^\/api\/open\/ai-crawlers\/?$/;
const BOTS = [   // [name, test, kind] kind: ai = AI training, AI search or AI assistant fetcher; search = classic search engine
  ['GPTBot', /GPTBot/i, 'ai'], ['OAI-SearchBot', /OAI-SearchBot/i, 'ai'], ['ChatGPT-User', /ChatGPT-User/i, 'ai'],
  ['ClaudeBot', /ClaudeBot/i, 'ai'], ['Claude-User', /Claude-User/i, 'ai'], ['Claude-SearchBot', /Claude-SearchBot/i, 'ai'], ['anthropic-ai', /anthropic-ai/i, 'ai'],
  ['PerplexityBot', /PerplexityBot/i, 'ai'], ['Perplexity-User', /Perplexity-User/i, 'ai'], ['Google-CloudVertexBot', /Google-CloudVertexBot/i, 'ai'],
  ['Applebot', /Applebot/i, 'ai'], ['Amazonbot', /Amazonbot/i, 'ai'], ['CCBot', /CCBot/i, 'ai'], ['Bytespider', /Bytespider/i, 'ai'],
  ['meta-externalagent', /meta-external(agent|fetcher)/i, 'ai'], ['DuckAssistBot', /DuckAssistBot/i, 'ai'], ['cohere-ai', /cohere-(ai|training)/i, 'ai'],
  ['MistralAI-User', /MistralAI-User/i, 'ai'], ['YouBot', /YouBot/i, 'ai'], ['Diffbot', /Diffbot/i, 'ai'], ['PetalBot', /PetalBot/i, 'ai'],
  ['Googlebot', /Googlebot/i, 'search'], ['bingbot', /bingbot/i, 'search'], ['YandexBot', /YandexBot/i, 'search'], ['DuckDuckBot', /DuckDuckBot/i, 'search']];
const NAMES = BOTS.map(b => b[0]);
const KEY = (d, b) => 'https://kolaboro.com/__aibot/v1/' + d + '/' + encodeURIComponent(b);
const day = (o) => new Date(Date.now() - (o || 0) * 864e5).toISOString().slice(0, 10);
export function botOf(ua) { if (!ua) return null; for (const [n, rx] of BOTS) if (rx.test(ua)) return n; return null; }
async function inc0(k) {
  try { const c = caches.default, hit = await c.match(k), n = hit ? (+(await hit.text()) || 0) : 0;
    await c.put(k, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=2592000', 'content-type': 'text/plain' } })); } catch (e) {}
}
let CHAIN = Promise.resolve();   // one increment at a time per isolate, so two requests in the same isolate never overwrite each other
const inc = k => (CHAIN = CHAIN.then(() => inc0(k)));
export function count(req, u, ctx) {
  if (typeof caches === 'undefined' || !ctx || !ctx.waitUntil) return;
  const b = botOf(req.headers.get('user-agent') || ''); if (!b) return;
  if (/^\/(?:__|cdn-cgi\/)/.test(u.pathname)) return;
  const d = day();
  ctx.waitUntil(inc(KEY(d, b)));
  if (/^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?llms|^\/answers\/|^\/llms\//.test(u.pathname)) ctx.waitUntil(inc(KEY(d, '_files')));   // llms*.txt and answer files
}
async function read(days) {
  const out = [];
  for (let i = 0; i < days; i++) {
    const d = day(i), vals = await Promise.all(NAMES.concat(['_files']).map(async b => { try { const h = await caches.default.match(KEY(d, b)); return h ? (+(await h.text()) || 0) : 0; } catch (e) { return 0; } }));
    const bots = {}; NAMES.forEach((n, j) => { if (vals[j]) bots[n] = vals[j]; });
    out.push({ date: d, bots, ai: NAMES.reduce((a, n, j) => a + (BOTS[j][2] === 'ai' ? vals[j] : 0), 0), search: NAMES.reduce((a, n, j) => a + (BOTS[j][2] === 'search' ? vals[j] : 0), 0), llms_and_answer_files: vals[vals.length - 1] });
  }
  return out;
}
let MEMO = { t: 0, v: null, colo: null };
async function data(req) {
  const colo = (req.cf && req.cf.colo) || null;
  if (MEMO.v && MEMO.colo === colo && Date.now() - MEMO.t < 120000) return MEMO.v;
  const v = { as_of: new Date().toISOString(), location: colo, days: await read(14),
    method: 'Requests to kolaboro.com whose user agent names a known crawler, counted per day by the worker that serves the site. Counts are kept in the edge cache of the Cloudflare location that served them (' + (colo || 'unknown') + ' for this answer): a lower bound for that one location, not a global total, and a location can drop them early. A user agent can be faked; we do not verify crawler IP ranges. Nothing about the visitor is stored.',
    crawlers: BOTS.map(b => ({ name: b[0], kind: b[2] })), since: '2026-11-12 (UTC)' };
  MEMO = { t: Date.now(), v, colo }; return v;
}
export async function api(req) {
  return new Response(JSON.stringify(await data(req), null, 1), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'access-control-allow-origin': '*', 'x-robots-tag': 'noindex' } });
}
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export async function html(req) {
  const D = await data(req), nf = n => new Intl.NumberFormat('en-GB').format(n);
  const seen = NAMES.filter(n => D.days.some(d => d.bots[n]));
  const rows = D.days.slice(0, 7).map(d => '<tr><td>' + d.date + '</td><td>' + nf(d.ai) + '</td><td>' + nf(d.search) + '</td><td>' + nf(d.llms_and_answer_files) + '</td><td>' + (Object.entries(d.bots).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, v]) => esc(n) + ' ' + nf(v)).join(', ') || '-') + '</td></tr>').join('');
  return '<section class="sec" id="ai-crawlers"><div class="wrap"><h2>AI crawler visits per day</h2><p>Requests from AI crawlers and answer-engine fetchers (and, for comparison, classic search crawlers), counted by user agent as the site serves them. Counted since the counter started (' + esc(D.since) + ') at the Cloudflare location that served this page (' + esc(D.location || 'unknown') + '): a lower bound for that location, not a global total. Raw data: <a href="/api/open/ai-crawlers">/api/open/ai-crawlers</a>. The files written for answer engines: <a href="/llms.txt">/llms.txt</a>, one per language and per country, and one answer file per project.</p>' +
    '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th scope="col" style="text-align:start">Day (UTC)</th><th scope="col" style="text-align:start">AI crawlers</th><th scope="col" style="text-align:start">Search crawlers</th><th scope="col" style="text-align:start">llms and answer files</th><th scope="col" style="text-align:start">Top crawlers</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<p class="muted" style="font-size:.9rem">Crawlers we recognise: ' + BOTS.map(b => esc(b[0])).join(', ') + '. ' + (seen.length ? 'Seen at this location in the last 14 days: ' + seen.map(esc).join(', ') + '.' : 'None seen at this location yet.') + ' A user agent can be faked; IP ranges are not verified.</p></div></section>';
}
