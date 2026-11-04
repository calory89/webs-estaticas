// Feature module z for kolaboro.com (see kbx.js): evidence and partners: court-ready case file, Internet Archive copies, risk feed for banks and insurers.
// Owned by block Z (batch 4, 4 Nov 2026). Endpoints live under /api/x/z/.
//   GET /api/x/z/feed                        index of the partner risk feed (no key)
//   GET /api/x/z/feed/projects               risk fields per anonymous project id, cursor-paginated, signed (x-api-key)
//   GET /api/x/z/feed/changes?since=         every recorded change to a project field, oldest first, cursor-paginated, signed (x-api-key)
//   GET /api/x/z/feed/schema.json            JSON Schema (2020-12) of both answers (no key)
//   GET /api/x/z/feed/status                 keys open, sources present, limits (no key)
//   GET /api/x/z/bundle/{sha256}             is this evidence bundle PDF registered (case PDF registry) or timestamped (OpenTimestamps)?
// Everything comes from the open dataset (/data/bali-cases.json) and /data/hazards.json; /data/on-time.json is used only if it exists.
// Signatures: the open API scheme (signBody in kolaboro.js): x-kolaboro-signature = base64 Ed25519 over "kolaboro-sig-v1\n" + SHA-256 hex of the body.
import * as KB from './kolaboro.js';
const { json, rpc, sha, signBody, openLoad } = KB;
export const PATHS = /^\/api\/x\/z(\/|$)/;

const VERSION = '1.1.0';
const SANDBOX_KEY = 'kb_sandbox_public';          // documented, public, not a secret: real data, small pages, per-IP limit
const SANDBOX_PER_HOUR = 120, SANDBOX_PAGE = 10;
const LIVE_PER_MINUTE = 60, PAGE_DEFAULT = 100, PAGE_MAX = 500;
const CHECKS = [['permit', 'permit_public'], ['escrow', 'deposit_protection'], ['progress', 'progress'], ['plans', 'plans'], ['record', 'track_record'], ['returns_ok', 'no_guaranteed_returns']];
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-allow-headers': 'x-api-key, content-type, if-none-match',
  'access-control-expose-headers': 'x-kolaboro-signature, x-kolaboro-key-id, x-kolaboro-dataset-sha256, x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-burst-limit, x-ratelimit-burst-remaining, x-kolaboro-feed-version' };
const ipOf = req => { const ip = req.headers.get('cf-connecting-ip') || 'x'; return ip.includes(':') ? ip.split(':').slice(0, 4).join(':') + '::/64' : ip; };
function plain(o, s = 200, extra) { return new Response(JSON.stringify(o, null, 1), { status: s, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, CORS, extra || {}) }); }

export async function handle(req, u, env, ctx) {
  const p = u.pathname.replace(/\/+$/, '');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'GET' && req.method !== 'HEAD') return plain({ error: 'method' }, 405);
  try {
    if (p === '/api/x/z' || p === '/api/x/z/feed') return plain(index());
    if (p === '/api/x/z/feed/schema.json' || p === '/api/x/z/feed/schema') return plain(SCHEMA, 200, { 'content-type': 'application/schema+json; charset=utf-8', 'cache-control': 'public, max-age=3600' });
    if (p === '/api/x/z/feed/status') return plain(await status(env));
    if (p === '/api/x/z/feed/projects' || p === '/api/x/z/feed/changes') return await feed(req, u, p, env, ctx);
    const bm = p.match(/^\/api\/x\/z\/bundle\/([0-9a-fA-F]{64})$/);
    if (bm) return await bundle(bm[1].toLowerCase(), env);
  } catch (e) { return plain({ error: 'server', detail: String(e && e.message || e).slice(0, 120) }, 500); }
  return plain({ error: 'not_found', docs: 'https://kolaboro.com/docs/partners/' }, 404);
}

function index() {
  return { feed: 'kolaboro-risk-feed', version: VERSION, docs: 'https://kolaboro.com/docs/partners/', schema: 'https://kolaboro.com/api/x/z/feed/schema.json',
    auth: 'header x-api-key: a free key from https://kolaboro.com/api-keys/ (kb_live_...), or the public sandbox key ' + SANDBOX_KEY,
    endpoints: { 'GET /api/x/z/feed/projects': 'risk fields per anonymous project id; limit (1-' + PAGE_MAX + '), cursor, ids (comma separated, up to 100), market',
      'GET /api/x/z/feed/changes': 'recorded changes to project fields, oldest first; since (YYYY-MM-DD, inclusive), limit, cursor',
      'GET /api/x/z/feed/status': 'which sources are present and which limits apply', 'GET /api/x/z/feed/schema.json': 'JSON Schema of both answers' },
    signature: 'x-kolaboro-signature = base64 Ed25519 over "kolaboro-sig-v1\\n" + SHA-256 hex of the exact body; key id in x-kolaboro-key-id; public keys at https://kolaboro.com/.well-known/kolaboro-keys.json' };
}

// ---------------------------------------------------------------- data
let SRC = { t: 0, v: null };
async function asset(env, path) {
  try { if (env && env.ASSETS) { const r = await env.ASSETS.fetch(new Request('https://kolaboro.com' + path)); if (r.ok && /json/.test(r.headers.get('content-type') || '')) return await r.json(); } } catch (e) {}
  try { const r = await fetch('https://kolaboro.com' + path, { cf: { cacheTtl: 600, cacheEverything: true } }); if (r.ok && /json/.test(r.headers.get('content-type') || '')) return await r.json(); } catch (e) {}
  return null;
}
async function sources(env) {
  if (SRC.v && Date.now() - SRC.t < 300000) return SRC.v;
  const L = await openLoad();
  const [hz, ot] = await Promise.all([asset(env, '/data/hazards.json'), asset(env, '/data/on-time.json')]);
  const v = { L, hz: hz && hz.projects ? hz : null, ot: ot && (ot.projects || ot.rows || ot.items) ? ot : null };
  SRC = { t: Date.now(), v }; return v;
}
function onTimeOf(ot, id) {
  if (!ot) return undefined;
  const P = ot.projects || ot.rows || ot.items;
  let r;
  if (Array.isArray(P)) r = P.find(x => x && (x.id === id || x.project === id)) || null; else r = P && P[id] !== undefined ? P[id] : null;
  if (!r || typeof r !== 'object' || ot.version !== 'on-time-1') return r;
  const g = r.g && ot.groups ? ot.groups[r.g] : null;
  return { status: r.s ?? null, first_handover: r.first ?? null, current_handover: r.cur ?? null, months_moved: r.moved ?? null, months_overdue: r.overdue ?? null, months_to_first_handover: r.to_first ?? null,
    estimate: g ? { on_time_pct: g.p ?? null, ci95_low_pct: g.lo ?? null, ci95_high_pct: g.hi ?? null, comparables: g.n ?? null, comparables_on_time: g.k ?? null, basis: g.name || null, level: g.level || null } : null };
}
const MON = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
function isoDay(s) { const m = String(s || '').match(/^(\d{1,2}) (\w{3}) (\d{4})$/); return m && MON[m[2]] ? m[3] + '-' + String(MON[m[2]]).padStart(2, '0') + '-' + m[1].padStart(2, '0') : null; }
function hazards(h) {
  if (!h) return null;
  const q = h.quakes || {}, t = h.tsunami || {}, v = h.volcano || null;
  return { elevation_m: h.elev_m ?? null, flood_river_100y_m: h.flood_river_m ?? null, flood_coast_100y_m: h.flood_coast_m ?? null,
    quakes_m5_within_100km_since_1900: q.m5 ?? null, quakes_m6_within_100km_since_1900: q.m6 ?? null, quakes_m7_within_100km_since_1900: q.m7 ?? null,
    strongest_quake: q.max ? { magnitude: q.max.mag ?? null, year: q.max.year ?? null, distance_km: q.max.dist_km ?? null } : null,
    tsunami_runups_within_50km: t.runups ?? null, tsunami_max_runup_m: t.max_m ?? null, tsunami_latest_year: t.latest ?? null,
    holocene_volcano_within_100km_km: v && v.dist_km != null ? v.dist_km : null, coast_distance: h.coast ?? null };
}
function risk(c, S) {
  const ck = c.checks || {}, vf = c.verified || {}, disc = {}, ver = {};
  disc.permit_public = ck.permit === 2; disc.permit_claimed = ck.permit >= 1; disc.deposit_protection = ck.escrow === undefined ? null : ck.escrow;
  disc.progress = ck.progress === undefined ? null : ck.progress; disc.plans = !!ck.plans; disc.track_record = !!ck.record; disc.no_guaranteed_returns = !!ck.returns_ok;
  CHECKS.forEach(([k, n]) => { ver[n] = vf[k] || 'none'; });
  const o = { id: c.id, market: c.market, country: c.country, region: c.region || null, stage: c.stage || null, units: c.units ?? null, tenure: c.title || null, lease_years: c.lease ?? null,
    promised_completion: c.done ?? null,
    disclosure_score: c.score ?? 0, disclosure_max: c.max || 6, disclosure: disc,
    confirmed_score: c.vscore ?? 0, verification_level: ver, tier: c.tier || null,
    claims: c.claims ? { verified: c.claims.verified || 0, unverified: c.claims.unverified || 0, contradicted: c.claims.contradicted || 0 } : null,
    public_problems: (c.flags || []).length,
    overdue_months: c.overdue ?? null, delay_months: c.delay ?? null,
    satellite: c.sat ? { status: c.sat.status || null, changed_pct: c.sat.changed_pct ?? null, date: c.sat.date || null } : null,
    register: c.register ? { register: c.register.register, item: c.register.item, status: c.register.status, checked: c.register.checked } : null,
    hazards: S.hz ? hazards(S.hz.projects[c.id]) : null,
    last_checked: isoDay(c.checked), page_fingerprint: c.fp && c.fp.sha256 ? { sha256: c.fp.sha256, date: c.fp.date || null } : null,
    url: 'https://kolaboro.com/p/?id=' + encodeURIComponent(c.id) };
  if (S.ot) o.on_time = onTimeOf(S.ot, c.id);
  return o;
}
function notes(S) {
  const n = { meaning: 'Scores describe what is public about a project and how much of it an official register or independent source confirms. They are not a judgement of the developer, a valuation or a credit rating.',
    hazards: S.hz ? 'From /data/hazards.json (updated ' + S.hz.updated + ', ' + Object.keys(S.hz.projects).length + ' projects with coordinates). Figures are rounded so they cannot pinpoint a plot. null means the project has no coordinates there. Sources and method: https://kolaboro.com/hazards/' : 'Hazard file unavailable at the moment: hazards are null for every project.' };
  n.on_time = S.ot ? 'on_time comes from /data/on-time.json (generated ' + (S.ot.generated || S.ot.updated || 'date not stated') + '). ' + (S.ot.question ? 'Question: ' + S.ot.question + ' ' : '') + 'estimate is the share of closed comparable projects that handed over on time, with a 95% interval. ' + (S.ot.bias || '') + ' Method: https://kolaboro.com/data/on-time.json' : 'on_time is omitted: /data/on-time.json is not published yet. When it is, the field appears with no change to the rest of the answer.';
  return n;
}
const b64u = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => { try { return decodeURIComponent(escape(atob(String(s).replace(/-/g, '+').replace(/_/g, '/')))); } catch (e) { return null; } };

// ---------------------------------------------------------------- keys and limits
async function counter(name, max, ttl) {
  const k = new Request('https://kolaboro.com/__kz_rl/' + name);
  const hit = await caches.default.match(k); const n = hit ? (+(await hit.text()) || 0) : 0;
  return { n, over: n >= max, put: () => caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=' + ttl } })) };
}
async function auth(req, ctx, endpoint) {
  const key = (req.headers.get('x-api-key') || '').trim();
  if (key === SANDBOX_KEY) {
    const c = await counter('sb/' + encodeURIComponent(ipOf(req)) + '/' + new Date().toISOString().slice(0, 13), SANDBOX_PER_HOUR, 3600);
    if (c.over) return { error: plain({ error: 'rate', limit: SANDBOX_PER_HOUR + ' sandbox calls per hour per IP address', retry: 'next hour' }, 429) };
    ctx.waitUntil(c.put());
    return { sandbox: true, page: SANDBOX_PAGE, headers: { 'x-ratelimit-limit': String(SANDBOX_PER_HOUR), 'x-ratelimit-remaining': String(SANDBOX_PER_HOUR - c.n - 1) } };
  }
  if (!/^kb_live_[0-9a-f]{40}$/.test(key)) return { error: plain({ error: 'missing_key', how: 'Send header x-api-key. Free key: https://kolaboro.com/api-keys/ . Sandbox key: ' + SANDBOX_KEY, docs: 'https://kolaboro.com/docs/partners/' }, 401) };
  const h = await sha(key);
  const b = await counter('k/' + h.slice(0, 24) + '/' + new Date().toISOString().slice(0, 16), LIVE_PER_MINUTE, 120);
  if (b.over) return { error: plain({ error: 'rate', limit: LIVE_PER_MINUTE + ' calls per minute per key', retry: 'next minute' }, 429, { 'retry-after': '60' }) };
  let a; try { a = await rpc('kolaboro_k_key_use', { p_wkey: KB.WKEY, p_hash: h, p_endpoint: endpoint }); } catch (e) { return { error: plain({ error: 'keys_unavailable', note: 'The key service did not answer. The sandbox key keeps working.' }, 503) }; }
  if (!a || a.error) return { error: plain({ error: (a && a.error) || 'db', daily_quota: a && a.daily_quota }, a && a.error === 'quota' ? 429 : 401) };
  ctx.waitUntil(b.put());
  return { sandbox: false, page: PAGE_MAX, prefix: key.slice(0, 12), headers: { 'x-ratelimit-limit': String(a.daily_quota), 'x-ratelimit-remaining': String(a.remaining), 'x-ratelimit-burst-limit': String(LIVE_PER_MINUTE), 'x-ratelimit-burst-remaining': String(LIVE_PER_MINUTE - b.n - 1) } };
}

// ---------------------------------------------------------------- feed
async function feed(req, u, p, env, ctx) {
  const kind = p.endsWith('/projects') ? 'projects' : 'changes';
  const A = await auth(req, ctx, '/api/x/z/feed/' + kind);
  if (A.error) return A.error;
  const S = await sources(env), cases = (S.L.d.cases || []).slice().sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const q = u.searchParams, lim = Math.max(1, Math.min(A.page, +q.get('limit') || Math.min(PAGE_DEFAULT, A.page)));
  const now = new Date(), base = { feed: 'kolaboro-risk-feed', version: VERSION, kind, generated_at: now.toISOString(), timestamp: Math.floor(now.getTime() / 1000),
    dataset_sha256: S.L.sha, data_updated: S.L.d.updated, license: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)', sandbox: A.sandbox };
  let body;
  if (kind === 'projects') {
    let pool = cases;
    const ids = (q.get('ids') || '').split(',').map(s => s.trim().toUpperCase()).filter(s => /^[A-Z0-9 -]{3,20}$/.test(s)).slice(0, 100);
    if (ids.length) { const set = new Set(ids); pool = pool.filter(c => set.has(c.id.toUpperCase())); }
    const mk = (q.get('market') || '').toLowerCase(); if (mk) pool = pool.filter(c => (c.market || '').toLowerCase() === mk || (c.country || '').toLowerCase() === mk);
    const total = pool.length;
    if (q.get('cursor')) { const after = unb64u(q.get('cursor')); if (!after || !/^p:/.test(after)) return plain({ error: 'bad_cursor' }, 400); pool = pool.filter(c => c.id > after.slice(2)); }
    const page = pool.slice(0, lim), more = pool.length > lim;
    body = Object.assign(base, { total, count: page.length, next_cursor: more ? b64u('p:' + page[page.length - 1].id) : null, notes: notes(S), projects: page.map(c => risk(c, S)) });
  } else {
    const sinceQ = q.get('since') || '';
    if (sinceQ && !/^\d{4}-\d{2}-\d{2}$/.test(sinceQ)) return plain({ error: 'bad_since', expected: 'YYYY-MM-DD' }, 400);
    const since = sinceQ || '2000-01-01', ev = [];
    for (const c of cases) (c.history || []).forEach((x, i) => { if (x && x.d && x.d >= since) ev.push({ d: x.d, c, i, x }); });
    ev.sort((a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : a.c.id < b.c.id ? -1 : a.c.id > b.c.id ? 1 : a.i - b.i);
    const total = ev.length; let start = 0;
    if (q.get('cursor')) {
      const after = unb64u(q.get('cursor')); const m = after && after.match(/^c:(\d{4}-\d{2}-\d{2})\|([A-Za-z0-9 -]{3,20})\|(\d{1,4})$/);
      if (!m) return plain({ error: 'bad_cursor' }, 400);
      const key = [m[1], m[2], +m[3]]; start = ev.findIndex(e => e.d > key[0] || (e.d === key[0] && (e.c.id > key[1] || (e.c.id === key[1] && e.i > key[2])))); if (start < 0) start = ev.length;
    }
    const page = ev.slice(start, start + lim), more = start + lim < ev.length;
    const out = [];
    for (const e of page) out.push({ id: 'chg_' + (await sha(e.c.id + '|' + e.d + '|' + e.i + '|' + e.x.f)).slice(0, 20), date: e.d, project: e.c.id, market: e.c.market, field: e.x.f,
      from: e.x.from === undefined ? null : e.x.from, to: e.x.to === undefined ? null : e.x.to, url: 'https://kolaboro.com/p/?id=' + encodeURIComponent(e.c.id) });
    const last = page[page.length - 1];
    body = Object.assign(base, { since, total, count: out.length, next_cursor: more && last ? b64u('c:' + last.d + '|' + last.c.id + '|' + last.i) : null,
      notes: { granularity: 'Changes are recorded by the daily data run with a date, not a time. Keep the last next_cursor, or re-read since=<last date you saw> and drop ids you already have: ids are stable.' }, changes: out });
  }
  const text = JSON.stringify(body, null, 1);
  const h = Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-kolaboro-dataset-sha256': S.L.sha, 'x-kolaboro-feed-version': VERSION }, CORS, A.headers);
  try { const sg = await signBody(env, text); if (sg) { h['x-kolaboro-signature'] = sg; h['x-kolaboro-key-id'] = (env && env.KB_SIGN_KID) || 'kb'; } else h['x-kolaboro-signature-status'] = 'signing key not installed'; } catch (e) { h['x-kolaboro-signature-status'] = 'signing failed'; }
  return new Response(text, { status: 200, headers: h });
}

async function status(env) {
  const S = await sources(env); let keys = null;
  try { const r = await fetch('https://kolaboro.com/api/x/k/keys/status'); keys = r.ok ? await r.json() : null; } catch (e) {}
  return { feed: 'kolaboro-risk-feed', version: VERSION, checked_at: new Date().toISOString(), data_updated: S.L.d.updated, dataset_sha256: S.L.sha, projects: (S.L.d.cases || []).length,
    sources: { dataset: '/data/bali-cases.json', hazards: S.hz ? { file: '/data/hazards.json', updated: S.hz.updated, projects: Object.keys(S.hz.projects).length } : null, on_time: S.ot ? { file: '/data/on-time.json', generated: S.ot.generated || S.ot.updated || null, version: S.ot.version || null } : null },
    signing: !!(env && env.KB_SIGN_KEY), live_keys_open: keys ? !!keys.open : null,
    limits: { sandbox: { key: SANDBOX_KEY, per_ip_per_hour: SANDBOX_PER_HOUR, page_max: SANDBOX_PAGE }, live: { per_key_per_minute: LIVE_PER_MINUTE, per_key_per_day: keys && keys.plans ? (keys.plans[0] || {}).daily_quota : null, page_max: PAGE_MAX, note: 'The daily quota is shared with the metered open API (/api/x/k/m/*) for the same key.' } } };
}

async function bundle(h, env) {
  let pdf = null, st = null;
  try { pdf = await rpc('kolaboro_pdf_lookup', { p_sha256: h }); } catch (e) {}
  try { st = await rpc('kolaboro_stamp_get', { p_hash: h }); } catch (e) {}
  return plain({ sha256: h, case_pdf: pdf && pdf.registered ? { registered: true, case: pdf.case || null, created_at: pdf.created_at || null, chain_head: pdf.chain_head || null } : { registered: false },
    timestamp: st ? { created_at: st.created_at, bitcoin_block: st.bitcoin_block || null, calendars: st.calendars || [], source: st.source || null, proof: 'https://kolaboro.com/api/kb/stamp?hash=' + h } : null,
    genuine: !!((pdf && pdf.registered) || st),
    note: 'Case-file bundles are registered against the case (the same registry as /verify#pdf). Bundles for public projects are timestamped with OpenTimestamps when they are made. Any edit, even one byte, changes the SHA-256.' }, 200, { 'cache-control': 'public, max-age=60' });
}

// ---------------------------------------------------------------- JSON Schema
const nul = t => ({ type: [t, 'null'] });
const SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema', $id: 'https://kolaboro.com/api/x/z/feed/schema.json', title: 'Kolaboro risk feed ' + VERSION,
  $defs: {
    envelope: { type: 'object', required: ['feed', 'version', 'kind', 'generated_at', 'timestamp', 'dataset_sha256', 'data_updated', 'sandbox', 'total', 'count', 'next_cursor'],
      properties: { feed: { const: 'kolaboro-risk-feed' }, version: { type: 'string' }, kind: { enum: ['projects', 'changes'] }, generated_at: { type: 'string', format: 'date-time' },
        timestamp: { type: 'integer', description: 'Unix seconds; inside the signed body, so a stale answer can be rejected' }, dataset_sha256: { type: 'string', pattern: '^[0-9a-f]{64}$', description: 'SHA-256 of /data/bali-cases.json the answer was computed from; recorded daily in the public log' },
        data_updated: { type: 'string' }, license: { type: 'string' }, sandbox: { type: 'boolean' }, total: { type: 'integer' }, count: { type: 'integer' }, next_cursor: nul('string'), notes: { type: 'object' } } },
    level: { enum: ['registry', 'independent', 'developer', 'contradicted', 'none'], description: 'registry: an official register confirms it; independent: an independent source confirms it; developer: only the developer says so; contradicted: a source contradicts it; none: nothing public' },
    project: { type: 'object', required: ['id', 'market', 'country', 'disclosure_score', 'disclosure_max', 'disclosure', 'confirmed_score', 'verification_level', 'overdue_months', 'hazards', 'url'],
      properties: { id: { type: 'string', pattern: '^[A-Za-z0-9 -]{3,20}$' }, market: { type: 'string' }, country: { type: 'string' }, region: nul('string'), stage: { enum: ['off-plan', 'under construction', 'completed', null] },
        units: nul('number'), tenure: nul('string'), lease_years: nul('number'), promised_completion: { type: ['integer', 'string', 'null'] },
        disclosure_score: { type: 'integer', minimum: 0, maximum: 6 }, disclosure_max: { type: 'integer' },
        disclosure: { type: 'object', properties: { permit_public: { type: 'boolean' }, permit_claimed: { type: 'boolean' }, deposit_protection: nul('boolean'), progress: { type: ['string', 'number', 'boolean', 'null'], description: 'a number is the percent built as published by the source; "updates" means progress updates are published without a percentage; null means nothing public' }, plans: { type: 'boolean' }, track_record: { type: 'boolean' }, no_guaranteed_returns: { type: 'boolean' } } },
        confirmed_score: { type: 'integer', minimum: 0, maximum: 6 },
        verification_level: { type: 'object', properties: Object.fromEntries(CHECKS.map(([, n]) => [n, { $ref: '#/$defs/level' }])) },
        tier: { enum: ['clear', 'mixed', 'caution', null] }, claims: { type: ['object', 'null'], properties: { verified: { type: 'integer' }, unverified: { type: 'integer' }, contradicted: { type: 'integer' } } },
        public_problems: { type: 'integer' }, overdue_months: { type: ['number', 'null'], description: 'months past the promised handover; null when not overdue or no date is public' }, delay_months: nul('number'),
        satellite: { type: ['object', 'null'] }, register: { type: ['object', 'null'] },
        hazards: { type: ['object', 'null'], description: 'null when the project has no coordinates in /data/hazards.json' },
        on_time: { type: ['object', 'null'], description: 'present only when /data/on-time.json is published: status, handover dates and months moved for this project, and estimate (share of closed comparable projects that handed over within 6 months of their first date, 95% Wilson interval). null when the file has no row for the project' },
        last_checked: { type: ['string', 'null'], format: 'date' }, page_fingerprint: { type: ['object', 'null'] }, url: { type: 'string', format: 'uri' } } },
    change: { type: 'object', required: ['id', 'date', 'project', 'field', 'from', 'to'],
      properties: { id: { type: 'string', pattern: '^chg_[0-9a-f]{20}$' }, date: { type: 'string', format: 'date' }, project: { type: 'string' }, market: { type: 'string' }, field: { type: 'string' }, from: {}, to: {}, url: { type: 'string' } } }
  },
  oneOf: [
    { allOf: [{ $ref: '#/$defs/envelope' }, { properties: { kind: { const: 'projects' }, projects: { type: 'array', items: { $ref: '#/$defs/project' } } }, required: ['projects'] }] },
    { allOf: [{ $ref: '#/$defs/envelope' }, { properties: { kind: { const: 'changes' }, since: { type: 'string' }, changes: { type: 'array', items: { $ref: '#/$defs/change' } } }, required: ['changes', 'since'] }] }
  ]
};
