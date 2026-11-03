// Feature module q for kolaboro.com (see kbx.js): people behind projects.
//   GET /api/x/q/                       index of endpoints
//   GET /api/x/q/graph                  company and director graph: coverage, method, per-project summaries (from /data/company-graph.json)
//   GET /api/x/q/graph/{ID}             one project's anonymised graph (nodes, edges, summary)
//   GET /api/x/q/court/sources          public court-decision databases and whether each one works from our servers right now
//   GET /api/x/q/court?name=X[&source=uk|us]
//                                       exact-name search for a company (legal form required, e.g. "Example Homes Limited") in the
//                                       UK National Archives' Find Case Law; only cases with that exact name in the case title are
//                                       listed. One search per request, started by a person (no bulk searching).
//   GET /api/x/q/mystery-shopper        questionnaire, measurement and status of the mystery shopper programme
// The graph file is written by a weekly batch job from the private research records; this module only reads it.
export const PATHS = /^\/api\/x\/q(\/|$)/;

const UA = 'KolaboroCourtCheck/1.0 (+https://kolaboro.com/graph/)';
const FCL = 'https://caselaw.nationalarchives.gov.uk';
const MEMO = {};
async function load(env, name) {
  const m = MEMO[name];
  if (m && Date.now() - m.t < 120000) return m.v;
  let v = null;
  try {
    let r = null;
    if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request('https://kolaboro.com/data/' + name));
    if (!r || !r.ok) r = await fetch('https://kolaboro.com/data/' + name, { cf: { cacheTtl: 600, cacheEverything: true } });
    if (r.ok) v = await r.json();
  } catch (e) { v = null; }
  MEMO[name] = { t: Date.now(), v };
  return v;
}
function out(o, s = 200, maxAge = 300) {
  return new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': maxAge ? 'public, max-age=' + maxAge : 'no-store', 'access-control-allow-origin': '*' } });
}
const STARTING = name => ({ status: 'starting', note: 'The batch job has not published ' + name + ' yet.' });
const unxml = s => String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');

async function rateOk(req, ctx, limit) {
  const ip = req.headers.get('cf-connecting-ip') || 'x', hour = new Date().toISOString().slice(0, 13);
  const k = new Request('https://kolaboro.com/__q_rl/' + encodeURIComponent(ip) + '/' + hour);
  const h = await caches.default.match(k), n = h ? (+(await h.text()) || 0) : 0;
  if (n >= limit) return false;
  ctx.waitUntil(caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=3600' } })));
  return true;
}

// ---- court records
// A company's legal form must be part of the name, so the search can never be run on a private person's name.
const FORM = /(\b(limited|ltd\.?|plc|llp|llc|l\.l\.c\.|inc\.?|corp\.?|corporation|gmbh|s\.?a\.?|s\.?l\.?|b\.?v\.?|pty\.? ltd\.?|sdn\.? bhd\.?|co\.?,? ltd\.?|company limited|public company limited|pcl|fze|fzco|fz-llc|dmcc)\s*$)|^pt\.?\s+\S/i;
export function normName(s) {
  return ' ' + String(s || '').toUpperCase().replace(/&/g, ' AND ').replace(/\bLTD\b\.?/g, 'LIMITED').replace(/\bCO\b\.?/g, 'COMPANY')
    .replace(/[^A-Z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
}
export function validName(raw) {
  const s = String(raw || '').replace(/\s+/g, ' ').trim();
  if (s.length < 6 || s.length > 120) return null;
  if (!FORM.test(s)) return null;
  if (normName(s).trim().split(' ').length < 2) return null;
  return s;
}
export function parseAtom(xml, name) {
  const want = normName(name), entries = [];
  for (const m of String(xml).matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const e = m[1];
    const title = unxml((e.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1] || '').trim();
    const link = (e.match(/<link href="([^"]+)" rel="alternate"\/>/) || [])[1] || '';
    const court = unxml((e.match(/<author><name>([\s\S]*?)<\/name>/) || [])[1] || '');
    const date = ((e.match(/<published>([^<]+)<\/published>/) || [])[1] || '').slice(0, 10);
    const cite = unxml((e.match(/<tna:identifier[^>]*type="ukncn"[^>]*>([\s\S]*?)<\/tna:identifier>/) || [])[1] || '');
    entries.push({ title, url: /^https:\/\/caselaw\.nationalarchives\.gov\.uk\//.test(link) ? link : null, court, date, citation: cite || null, in_title: normName(title).includes(want) });
  }
  const more = /rel="next"/.test(xml);
  return { entries, more };
}
async function courtUK(name) {
  const q = '"' + name.replace(/"/g, '') + '"';
  const url = FCL + '/atom.xml?query=' + encodeURIComponent(q) + '&per_page=50';
  const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/atom+xml' }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error('Find Case Law answered HTTP ' + r.status);
  const { entries, more } = parseAtom(await r.text(), name);
  const hits = entries.filter(e => e.in_title);
  return {
    source: 'uk', source_name: 'Find Case Law, The National Archives (England and Wales, UK)',
    query: name, searched_for: q, fetched_at: new Date().toISOString(),
    title_matches: hits.map(({ in_title, ...e }) => e),
    text_mentions_only: entries.length - hits.length, more_results: more,
    search_page: FCL + '/search?query=' + encodeURIComponent(q),
    label: 'A case naming a company with this exact name. Check it is the same company: names can be reused after a company is dissolved, and a party in a case is not necessarily at fault.',
    rules: ['Only judgments whose case title contains the exact name (after normalising punctuation and Ltd/Limited) are listed.',
      'Judgments that only mention the name in the text are counted, not listed. Open the search page to read them yourself.',
      'Coverage: Find Case Law holds judgments from 2001 onward for most higher courts in England and Wales and some tribunals, not every court decision.'],
    licence: 'Contains public sector information licensed under the Open Justice Licence v1.0.'
  };
}
async function courtUS(name, env) {
  if (!env.COURTLISTENER_TOKEN) return { source: 'us', status: 'not connected yet', note: 'CourtListener (Free Law Project) needs a free API token. The owner can add it as COURTLISTENER_TOKEN.' };
  const q = 'caseName:("' + name.replace(/"/g, '') + '")';
  const r = await fetch('https://www.courtlistener.com/api/rest/v4/search/?type=o&q=' + encodeURIComponent(q), { headers: { authorization: 'Token ' + env.COURTLISTENER_TOKEN, 'user-agent': UA }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error('CourtListener answered HTTP ' + r.status);
  const d = await r.json(), want = normName(name);
  const rows = (d.results || []).map(x => ({ title: x.caseName || '', url: x.absolute_url ? 'https://www.courtlistener.com' + x.absolute_url : null, court: x.court || '', date: (x.dateFiled || '').slice(0, 10), citation: (x.citation || [])[0] || null }));
  const hits = rows.filter(x => normName(x.title).includes(want));
  return { source: 'us', source_name: 'CourtListener, Free Law Project (US courts)', query: name, fetched_at: new Date().toISOString(), title_matches: hits, text_mentions_only: rows.length - hits.length, more_results: !!d.next,
    search_page: 'https://www.courtlistener.com/?q=' + encodeURIComponent(q),
    label: 'A case naming a company with this exact name. Check it is the same company: names can be reused, and a party in a case is not necessarily at fault.' };
}
async function court(req, u, env, ctx) {
  const name = validName(u.searchParams.get('name'));
  const src = (u.searchParams.get('source') || 'uk').toLowerCase();
  if (!name) return out({ error: 'enter the full legal name of a company, including its legal form (for example Limited, Ltd, PLC, LLP, LLC, Inc, PT). Names of people are not searched.' }, 400, 0);
  if (src !== 'uk' && src !== 'us') return out({ error: 'unknown source', sources: ['uk', 'us'] }, 400, 0);
  const ck = new Request('https://kolaboro.com/__q_court/' + src + '/' + encodeURIComponent(normName(name).trim()));
  const hit = await caches.default.match(ck);
  if (hit) { const d = await hit.json(); d.cached = true; return out(d, 200, 0); }
  if (!(await rateOk(req, ctx, 20))) return out({ error: 'rate limit: 20 court searches an hour' }, 429, 0);
  let d;
  try { d = src === 'uk' ? await courtUK(name) : await courtUS(name, env); }
  catch (e) { return out({ source: src, query: name, error: 'the court database did not answer', detail: String(e && e.message || e).slice(0, 120) }, 502, 0); }
  if (d.title_matches) ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(d), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=86400' } })));
  return out(d, 200, 0);
}

const SOURCES = [
  { id: 'uk', market: 'United Kingdom', name: 'Find Case Law (The National Archives)', url: FCL, probe: FCL + '/atom.xml?query=%22Kolaboro%20probe%20Limited%22&per_page=1',
    terms: 'Open Justice Licence: searching and linking is free. Programmatic bulk searching across the records needs a separate, free computational-analysis licence, which we have not been granted yet. So searches here run one at a time when a person asks, and no project is checked automatically.' },
  { id: 'id', market: 'Indonesia', name: 'Direktori Putusan, Mahkamah Agung RI', url: 'https://putusan3.mahkamahagung.go.id/', probe: 'https://putusan3.mahkamahagung.go.id/',
    terms: 'robots.txt allows general crawlers (Content-Signal search=yes, ai-train=no). In our tests it answered "Access Denied" (HTTP 403) to requests from cloud servers; the live status from our servers is shown here. A person can search it in a browser.' },
  { id: 'us', market: 'United States', name: 'CourtListener (Free Law Project)', url: 'https://www.courtlistener.com/', probe: null, env: 'COURTLISTENER_TOKEN',
    terms: 'Open API, but every request needs a free account token (unauthenticated requests get HTTP 401).' },
  { id: 'th', market: 'Thailand', name: 'Supreme Court judgments (deka.supremecourt.or.th)', url: 'https://deka.supremecourt.or.th/', probe: null,
    terms: 'Search form that needs a browser session. Not automated.' },
  { id: 'es', market: 'Spain', name: 'CENDOJ (Consejo General del Poder Judicial)', url: 'https://www.poderjudicial.es/search/', probe: null,
    terms: 'Search form that needs a browser session, and published judgments are anonymised. Not automated.' },
  { id: 'ae', market: 'United Arab Emirates', name: 'Dubai Courts', url: 'https://www.dc.gov.ae/', probe: null,
    terms: 'We found no public judgment search that works without an account. Not automated.' }
];
async function sources(env, ctx) {
  const ck = new Request('https://kolaboro.com/__q_court_sources/v1');
  const c = await caches.default.match(ck);
  if (c) return out(await c.json(), 200, 600);
  const res = await Promise.all(SOURCES.map(async s => {
    const o = { id: s.id, market: s.market, name: s.name, url: s.url, terms: s.terms };
    if (s.env) { o.status = env[s.env] ? 'connected' : 'not connected yet'; o.env = s.env; return o; }
    if (!s.probe) { o.status = 'not automated'; return o; }
    try {
      const r = await fetch(s.probe, { headers: { 'user-agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(10000) });
      const t = (await r.text()).slice(0, 3000);
      o.http = r.status;
      o.status = r.ok && !/access denied|just a moment|captcha/i.test(t) ? 'reachable' : 'blocked from our servers';
    } catch (e) { o.status = 'did not answer'; }
    o.probed_at = new Date().toISOString();
    return o;
  }));
  const d = { sources: res, automated_project_checks: 0,
    why_no_automatic_checks: 'Developers of tracked projects are anonymous on Kolaboro, and Find Case Law needs a licence for programmatic bulk searching. Until that licence is granted, no project is searched automatically and no per-project court counts are published.',
    exact_name_rule: 'We only ever search an exact legal company name and only list cases with that exact name in the title, labelled as needing a same-company check. We never search people.' };
  ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(d), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=21600' } })));
  return out(d, 200, 600);
}

export async function handle(req, u, env, ctx) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET', 'access-control-max-age': '86400' } });
  if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: 'method not allowed' }, 405, 0);
  const p = u.pathname.replace(/\/+$/, '');
  try {
    if (p === '/api/x/q') return out({ module: 'people behind projects', endpoints: ['/api/x/q/graph', '/api/x/q/graph/{ID}', '/api/x/q/court/sources', '/api/x/q/court?name={exact company name}&source=uk', '/api/x/q/mystery-shopper'], pages: ['/graph/', '/mystery-shopper/'] }, 200, 3600);
    if (p === '/api/x/q/graph') {
      const d = await load(env, 'company-graph.json'); if (!d) return out(STARTING('company-graph.json'), 200, 60);
      const projects = Object.fromEntries(Object.entries(d.projects || {}).map(([k, v]) => [k, { market: v.market, summary: v.summary, network: v.network || null, directors: v.directors || 0 }]));
      return out({ ...d, projects });
    }
    const gm = p.match(/^\/api\/x\/q\/graph\/([A-Za-z]{2,5}-\d{3,4})$/);
    if (gm) {
      const id = gm[1].toUpperCase();
      const d = await load(env, 'company-graph.json'); if (!d) return out(STARTING('company-graph.json'), 200, 60);
      const x = (d.projects || {})[id];
      if (!x) return out({ id, covered: false, note: 'The company graph covers UK-tracked projects only: Companies House is the only register we found with free, open officer data.' }, 404, 300);
      return out({ id, updated: d.updated, register: d.register.name, method: d.method, ...x });
    }
    if (p === '/api/x/q/court/sources') return sources(env, ctx);
    if (p === '/api/x/q/court') return court(req, u, env, ctx);
    if (p === '/api/x/q/mystery-shopper') {
      const d = await load(env, 'mystery-shopper.json'); if (!d) return out(STARTING('mystery-shopper.json'), 200, 60);
      return out(d, 200, 600);
    }
  } catch (e) { return out({ error: 'internal error' }, 500, 0); }
  return out({ error: 'not found', see: '/api/x/q/' }, 404, 60);
}
