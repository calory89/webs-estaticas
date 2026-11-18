// Feature module e for kolaboro.com (see kbx.js): data platform.
//  GET  /api/x/e/parquet-manifest  the Parquet export's manifest, re-hashed here against the published files and signed
//  POST /mcp                       public read-only MCP server (Streamable HTTP, JSON-RPC 2.0), dual era:
//                                  2026-07-28 (stateless, per-request _meta, server/discover) and 2025-03-26..2025-11-25 (initialize)
// Every tool answer carries the same Ed25519 signature fields as the open API (/api/open/*): 'kolaboro-sig-v1\n' + SHA-256 hex of the body.
import { open, sha, signBody } from './kolaboro.js';

export const PATHS = /^\/(api\/x\/e\/|mcp(\/|$))/;

const MODERN = ['2026-07-28'];
const LEGACY = ['2025-11-25', '2025-06-18', '2025-03-26'];
const SUPPORTED = MODERN.concat(LEGACY);
const SERVER = { name: 'kolaboro', title: 'Kolaboro open data', version: '1.0.0', websiteUrl: 'https://kolaboro.com/docs/mcp/' };
const KEYS_URL = 'https://kolaboro.com/.well-known/kolaboro-keys.json';
const MAX_BODY = 65536;
const RATE_MCP = 60, RATE_FILE = 30;   // requests per minute per IP
const INSTRUCTIONS = 'Kolaboro tracks off-plan property projects worldwide and publishes what each one makes public (permit, deposit protection, ' +
  'construction progress, plans, track record, no guaranteed returns) and how much of it was confirmed by a registry or independent source. ' +
  'Records use ids like BALI-014 and carry no developer or project names: never guess one. Each project also has a public page with its name and sourced facts at https://kolaboro.com/projects/{slug}/, except projects in Sumba (conflict of interest). Scores describe what is public, ' +
  'not whether it is genuine, and nothing here is financial or legal advice. Every tool result contains the exact body that was signed and a signature ' +
  'block (Ed25519 over "kolaboro-sig-v1\\n" + SHA-256 hex of the body; public keys at ' + KEYS_URL + '); verify_signature checks one. ' +
  'For whole-database questions, the same data is a signed Parquet file at https://kolaboro.com/data/kolaboro.parquet (SQL in the browser: https://kolaboro.com/sql/).';

const te = new TextEncoder();
const hexOf = async b => [...new Uint8Array(await crypto.subtle.digest('SHA-256', b))].map(x => x.toString(16).padStart(2, '0')).join('');
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type, accept, mcp-protocol-version, mcp-method, mcp-name, mcp-session-id, last-event-id, authorization',
  'access-control-expose-headers': 'mcp-protocol-version, x-kolaboro-signature, x-kolaboro-key-id, x-kolaboro-dataset-sha256, retry-after, x-ratelimit-limit, x-ratelimit-remaining',
  'access-control-max-age': '86400',
};
function out(body, status, extra) {
  const h = Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, CORS, extra || {});
  return new Response(body === null ? null : typeof body === 'string' ? body : JSON.stringify(body), { status: status || 200, headers: h });
}

// ---------- rate limit: per IP per minute, in this isolate and in the colo cache (not atomic; a ceiling, not an exact count)
const RL = new Map();
async function rateCheck(req, ctx, bucket, max) {
  const ip = req.headers.get('cf-connecting-ip') || 'unknown', min = Math.floor(Date.now() / 60000), k = bucket + '|' + ip + '|' + min;
  const local = (RL.get(k) || 0) + 1; RL.set(k, local);
  if (RL.size > 5000) for (const key of RL.keys()) { if (!key.endsWith('|' + min)) RL.delete(key); }
  let shared = 0; const ck = new Request('https://kolaboro.com/__rl-e/' + bucket + '/' + encodeURIComponent(ip) + '/' + min);
  try { const hit = await caches.default.match(ck); if (hit) shared = +(await hit.text()) || 0; } catch (e) {}
  const n = Math.max(local, shared + 1);
  try { ctx.waitUntil(caches.default.put(ck, new Response(String(n), { headers: { 'cache-control': 'max-age=120' } }))); } catch (e) {}
  return { ok: n <= max, remaining: Math.max(0, max - n), retry: 60 - Math.floor(Date.now() / 1000) % 60 };
}

// ---------- the open API, called in-process: same body, same signature headers as https://kolaboro.com<path>
async function openCall(env, path) {
  const u = new URL('https://kolaboro.com' + path);
  const r = await open(new Request(u, { headers: { accept: 'application/json' } }), u, env);
  const body = await r.text();
  return { status: r.status, body, sig: r.headers.get('x-kolaboro-signature'), kid: r.headers.get('x-kolaboro-key-id'), ds: r.headers.get('x-kolaboro-dataset-sha256'), source: u.href };
}
async function signed(env, body, source, ds) {
  const sig = await signBody(env, body).catch(() => null);
  return { status: 200, body, sig, kid: sig ? ((env && env.KB_SIGN_KID) || 'kb') : null, ds: ds || null, source };
}
async function sigBlock(r) {
  const h = await sha(r.body);
  return { alg: 'Ed25519', key_id: r.kid || null, signature: r.sig || null, body_sha256: h, signed_message: 'kolaboro-sig-v1\n' + h,
    dataset_sha256: r.ds || null, source: r.source, keys: KEYS_URL,
    how_to_verify: 'Ed25519-verify base64 "signature" over the UTF-8 bytes of signed_message, where body_sha256 is SHA-256 hex of the first text block exactly as returned; public key = keys[kid]. Or call verify_signature.' };
}

// ---------- signed manifest of the Parquet export (files published daily by GitHub Actions; this worker re-hashes them before signing)
let MAN = { t: 0, v: null };
async function asset(env, path) {
  try { if (env && env.ASSETS) { const r = await env.ASSETS.fetch(new Request('https://kolaboro.com/_s/kolaboro.com' + path)); if (r.ok) return r; } } catch (e) {}
  return fetch('https://kolaboro.com' + path, { cf: { cacheTtl: 60 } });
}
async function parquetManifest(env) {
  if (MAN.v && Date.now() - MAN.t < 60000) return MAN.v;
  const mr = await asset(env, '/data/kolaboro.parquet.json');
  if (!mr.ok) return { ok: false, error: 'manifest_not_published_yet' };
  const mtxt = await mr.text(), man = JSON.parse(mtxt), files = [];
  for (const f of man.files || []) {
    const r = await asset(env, f.path), b = r.ok ? await r.arrayBuffer() : null, got = b ? await hexOf(b) : null;
    files.push({ path: f.path, table: f.table, rows: f.rows, bytes_expected: f.bytes, bytes_served: b ? b.byteLength : null, sha256_expected: f.sha256, sha256_served: got, match: !!got && got === f.sha256 });
  }
  const v = { ok: files.length > 0 && files.every(f => f.match), checked_at: new Date().toISOString(), manifest_url: 'https://kolaboro.com/data/kolaboro.parquet.json',
    manifest_sha256: await sha(mtxt), generated: man.generated, source: man.source, license: man.license, files,
    statement: 'The Kolaboro site worker fetched the files listed above from this deployment, hashed them, and signs this answer. A file you downloaded is the one described here if its SHA-256 equals sha256_served.',
    signature_format: 'header x-kolaboro-signature = base64 Ed25519 over "kolaboro-sig-v1\\n" + SHA-256 hex of this exact body; key id in x-kolaboro-key-id; keys at ' + KEYS_URL };
  MAN = { t: Date.now(), v }; return v;
}
async function manifestResponse(env) {
  let v; try { v = await parquetManifest(env); } catch (e) { v = { ok: false, error: 'unavailable' }; }
  const body = JSON.stringify(v, null, 1), sig = await signBody(env, body).catch(() => null);
  const h = { 'cache-control': 'public, max-age=60' };
  if (sig) { h['x-kolaboro-signature'] = sig; h['x-kolaboro-key-id'] = (env && env.KB_SIGN_KID) || 'kb'; }
  if (v.source && v.source.sha256) h['x-kolaboro-dataset-sha256'] = v.source.sha256;
  return out(body, v.error ? 503 : 200, h);
}

// ---------- signature check against the published keys
let KEYS = { t: 0, v: null };
async function keys(env) {
  if (KEYS.v && Date.now() - KEYS.t < 600000) return KEYS.v;
  const r = await asset(env, '/.well-known/kolaboro-keys.json'); KEYS = { t: Date.now(), v: await r.json() }; return KEYS.v;
}
async function verifySig(env, body, sigB64, kid) {
  const ks = (await keys(env)).keys || [];
  const cand = kid ? ks.filter(k => k.kid === kid) : ks;
  if (!cand.length) return { valid: false, reason: 'unknown key id', known_key_ids: ks.map(k => k.kid) };
  let sig; try { sig = Uint8Array.from(atob(String(sigB64).trim()), c => c.charCodeAt(0)); } catch (e) { return { valid: false, reason: 'signature is not base64' }; }
  if (sig.length !== 64) return { valid: false, reason: 'an Ed25519 signature is 64 bytes, this one is ' + sig.length };
  const h = await sha(body), msg = te.encode('kolaboro-sig-v1\n' + h);
  for (const k of cand) {
    const raw = Uint8Array.from(atob(k.public_key_raw_b64), c => c.charCodeAt(0));
    let ok = false;
    for (const alg of [{ name: 'Ed25519' }, { name: 'NODE-ED25519', namedCurve: 'NODE-ED25519' }]) {
      try { const key = await crypto.subtle.importKey('raw', raw, alg, false, ['verify']); ok = await crypto.subtle.verify(alg, key, sig, msg); break; } catch (e) {}
    }
    if (ok) return { valid: true, key_id: k.kid, key_status: k.status, key_valid_from: k.valid_from, key_valid_until: k.valid_until, body_sha256: h,
      note: k.status === 'revoked' ? 'The key is revoked: do not trust signatures made after its revocation date.' : 'Kolaboro signed exactly this body.' };
  }
  return { valid: false, reason: 'signature does not match this body with ' + (kid ? 'key ' + kid : 'any published key'), body_sha256: h,
    hint: 'The body must be byte-for-byte the text that was signed (whitespace and key order included).' };
}

// ---------- tools
const ID_RE = /^[A-Za-z0-9-]{3,20}$/, DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const RO = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const TOOLS = [
  { name: 'search_projects', title: 'Search tracked projects',
    description: 'List tracked off-plan projects with filters (market, country, stage, minimum checks public or confirmed, flags). Returns anonymous project records exactly as GET /api/open/projects, with its Ed25519 signature. Use get_project for one project.',
    inputSchema: { type: 'object', additionalProperties: false, properties: {
      market: { type: 'string', maxLength: 60, description: 'Market name, e.g. "Bali", "Dubai", "Phuket" (case-insensitive exact match)' },
      country: { type: 'string', maxLength: 60, description: 'Country, e.g. "Indonesia"' },
      stage: { type: 'string', enum: ['off-plan', 'under construction', 'completed'] },
      min_public: { type: 'integer', minimum: 0, maximum: 6, description: 'At least this many of the six checks are public' },
      min_confirmed: { type: 'integer', minimum: 0, maximum: 6, description: 'At least this many checks confirmed by a registry or independent source' },
      all_six: { type: 'boolean', description: 'Only projects with all six checks public and no flags' },
      has_flags: { type: 'boolean', description: 'true: only projects with public problems flagged; false: only without' },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      offset: { type: 'integer', minimum: 0, maximum: 100000, default: 0 } } },
    annotations: Object.assign({ title: 'Search tracked projects' }, RO) },
  { name: 'get_project', title: 'Get one project',
    description: 'One project by id (e.g. BALI-014): the six checks, verification level per check, developer claims tested, flags, questions to ask before paying. With as_of (YYYY-MM-DD), the project as published that day from a snapshot checked against the public log.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['id'], properties: {
      id: { type: 'string', pattern: '^[A-Za-z0-9-]{3,20}$' }, as_of: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', description: 'Optional date for time travel' } } },
    annotations: Object.assign({ title: 'Get one project' }, RO) },
  { name: 'project_quick_answer', title: 'Quick answer about one named project',
    description: 'The quick answer shown at the top of a named project page (batch 24): what it is, developer, place, handover date as published and its moves, permit number published or not, transparency score and rank in its island or city, review status, last checked. Facts only, no verdict. By page slug (e.g. unsere-flora-berlin) or id (e.g. BER-001); lang one of en es de fr nl ru zh ar. Links to the page, its answer file and the checklist.',
    inputSchema: { type: 'object', additionalProperties: false, properties: {
      slug: { type: 'string', pattern: '^[a-z0-9-]{1,90}$' }, id: { type: 'string', pattern: '^[A-Za-z0-9-]{3,20}$' }, lang: { type: 'string', enum: ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'], default: 'en' } } },
    annotations: Object.assign({ title: 'Quick answer about one named project' }, RO) },
  { name: 'compare_projects', title: 'Compare named projects',
    description: 'Compare 2 to 5 named projects side by side (by page slug like unsere-flora-berlin or id like BER-001): developer, place, stage, handover date on record and how often it moved, months past the first handover date, permit number published, deposit protection stated, transparency score, last checked, links. Facts only, no verdict; the same rows as https://kolaboro.com/compare/.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['projects'], properties: {
      projects: { type: 'array', minItems: 2, maxItems: 5, items: { type: 'string', pattern: '^[A-Za-z0-9-]{1,90}$' }, description: 'Page slugs or ids' } } },
    annotations: Object.assign({ title: 'Compare named projects' }, RO) },
  { name: 'list_by_handover_year', title: 'Named projects by handover year',
    description: 'Named projects whose handover date on record falls in a given year, optionally in one market (e.g. "Dubai") or country, with the same fact rows as compare_projects. Dates are as published or as last seen on the developer page; past-due months are counted from the first date on record.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['year'], properties: {
      year: { type: 'integer', minimum: 2020, maximum: 2040 }, market: { type: 'string', maxLength: 60 }, country: { type: 'string', maxLength: 60 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 25 }, offset: { type: 'integer', minimum: 0, maximum: 10000, default: 0 } } },
    annotations: Object.assign({ title: 'Named projects by handover year' }, RO) },
  { name: 'search_text', title: 'Search named projects by free text',   // n31e (batch 31, item 173)
    description: 'Free-text search over named project pages: a project name, developer or place in any order (e.g. "damac bay", "marina dubai", "flora berlin"). Returns up to 25 projects with developer, place, stage, handover date on record, last checked, page URL and a link to its dated handover history. Facts only, no verdict.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['query'], properties: {
      query: { type: 'string', minLength: 2, maxLength: 120 }, limit: { type: 'integer', minimum: 1, maximum: 25, default: 10 } } },
    annotations: Object.assign({ title: 'Search named projects by free text' }, RO) },
  { name: 'get_certificate', title: 'Verification certificate of a project',   // n31e (batch 31, item 173)
    description: 'The verification certificate of one named project (by page slug, e.g. unsere-flora-berlin): the facts as published today in canonical JSON, their SHA-256 fingerprint, the hash of the daily dataset snapshot they come from, and the signature where a signing key is configured. Same as GET /api/v1/projects/<slug>/certificate.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['slug'], properties: { slug: { type: 'string', pattern: '^[a-z0-9-]{1,90}$' } } },
    annotations: Object.assign({ title: 'Verification certificate of a project' }, RO) },
  { name: 'market_stats', title: 'Market statistics',
    description: 'Per-market statistics: projects tracked, average checks public and confirmed, share with a public permit, share with deposit protection (escrow), projects with all six public, flagged projects, and the transparency index (0-100, markets with 3+ projects). Without filters returns GET /api/open/markets as published.',
    inputSchema: { type: 'object', additionalProperties: false, properties: {
      market: { type: 'string', maxLength: 60 }, country: { type: 'string', maxLength: 60 } } },
    annotations: Object.assign({ title: 'Market statistics' }, RO) },
  { name: 'database_stats', title: 'Database totals',
    description: 'Totals for the whole database: projects, markets, countries, sources, developer claims tested by result, verification levels, stages, overdue and delayed projects. Same as GET /api/open/stats.',
    inputSchema: { type: 'object', additionalProperties: false, properties: {} }, annotations: Object.assign({ title: 'Database totals' }, RO) },
  { name: 'public_log', title: 'Public log checkpoint',
    description: 'The latest signed checkpoint of Kolaboro\'s append-only public log (C2SP signed note: tree size and Merkle root of daily heads) and the most recent daily heads, each hash-chained and timestamped in Bitcoin.',
    inputSchema: { type: 'object', additionalProperties: false, properties: { days: { type: 'integer', minimum: 1, maximum: 30, default: 5 } } },
    annotations: Object.assign({ title: 'Public log checkpoint' }, RO) },
  { name: 'dataset_files', title: 'Signed dataset files',
    description: 'The daily Parquet export of the whole open database (projects and markets tables): URLs, row counts and SHA-256 of each file, re-hashed by the server and signed. Load the files in DuckDB or pandas for SQL over everything.',
    inputSchema: { type: 'object', additionalProperties: false, properties: {} }, annotations: Object.assign({ title: 'Signed dataset files' }, RO) },
  { name: 'verify_signature', title: 'Verify a Kolaboro signature',
    description: 'Check that a body (a tool result text, or any /api/open answer) was signed by Kolaboro: Ed25519 over "kolaboro-sig-v1\\n" + SHA-256 hex of the body, against the keys published at /.well-known/kolaboro-keys.json.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['body', 'signature'], properties: {
      body: { type: 'string', maxLength: 60000, description: 'The exact signed text' }, signature: { type: 'string', maxLength: 200, description: 'base64 signature' },
      key_id: { type: 'string', maxLength: 64 } } },
    annotations: Object.assign({ title: 'Verify a Kolaboro signature' }, RO) },
];
const TOOL_NAMES = TOOLS.map(t => t.name);

function argErr(msg) { const e = new Error(msg); e.arg = true; return e; }
function str(a, k, max) { const v = a[k]; if (v === undefined || v === null || v === '') return null; if (typeof v !== 'string' || v.length > (max || 60)) throw argErr(k + ' must be a string of at most ' + (max || 60) + ' characters'); return v.trim(); }
function int(a, k, lo, hi, def) { const v = a[k]; if (v === undefined || v === null) return def; if (!Number.isInteger(v) || v < lo || v > hi) throw argErr(k + ' must be an integer from ' + lo + ' to ' + hi); return v; }
function bool(a, k) { const v = a[k]; if (v === undefined || v === null) return null; if (typeof v !== 'boolean') throw argErr(k + ' must be true or false'); return v; }

async function runTool(env, name, a) {
  if (a === undefined || a === null) a = {};
  if (typeof a !== 'object' || Array.isArray(a)) throw argErr('arguments must be an object');
  const known = (TOOLS.find(t => t.name === name).inputSchema.properties) || {};
  const extra = Object.keys(a).filter(k => !(k in known)); if (extra.length) throw argErr('unknown argument(s): ' + extra.join(', '));
  if (name === 'search_projects') {
    const q = new URLSearchParams(), stage = str(a, 'stage');
    if (stage && ['off-plan', 'under construction', 'completed'].indexOf(stage) < 0) throw argErr('stage must be off-plan, under construction or completed');
    for (const [k, v] of [['market', str(a, 'market')], ['country', str(a, 'country')], ['stage', stage], ['min_public', int(a, 'min_public', 0, 6, null)], ['min_confirmed', int(a, 'min_confirmed', 0, 6, null)]]) if (v !== null && v !== undefined) q.set(k, String(v));
    if (bool(a, 'all_six')) q.set('all_six', '1');
    const f = bool(a, 'has_flags'); if (f !== null) q.set('flags', f ? '1' : '0');
    q.set('limit', String(int(a, 'limit', 1, 100, 20))); q.set('offset', String(int(a, 'offset', 0, 100000, 0)));
    return [await openCall(env, '/api/open/projects?' + q)];
  }
  if (name === 'get_project') {
    const id = str(a, 'id', 20), day = str(a, 'as_of', 10);
    if (!id || !ID_RE.test(id)) throw argErr('id must look like BALI-014'); if (day && !DAY_RE.test(day)) throw argErr('as_of must be YYYY-MM-DD');
    return [await openCall(env, '/api/open/projects/' + encodeURIComponent(id.toUpperCase()) + (day ? '/at/' + day : ''))];
  }
  if (name === 'project_quick_answer') {
    const slug = str(a, 'slug', 90), id = str(a, 'id', 20), lang = str(a, 'lang', 2) || 'en';
    if (!slug && !id) throw argErr('give slug or id'); if (slug && !/^[a-z0-9-]{1,90}$/.test(slug)) throw argErr('slug must be lowercase letters, digits and hyphens'); if (id && !ID_RE.test(id)) throw argErr('id must look like BER-001');
    if (['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'].indexOf(lang) < 0) throw argErr('lang must be one of en es de fr nl ru zh ar');
    const [N, TR] = await Promise.all([import('./kbx_named.js'), import('./kbx_tr.js')]), ix = await N.data(env), x = slug ? ix.bySlug.get(slug) : ix.byId.get(id.toUpperCase());
    if (!x) return [{ status: 404, local: true, body: JSON.stringify({ error: 'no named project with this ' + (slug ? 'slug' : 'id'), hint: 'Named project pages: https://kolaboro.com/projects/ ; projects in Sumba are never named (conflict of interest, see /independence/).' }, null, 1), source: 'https://kolaboro.com/projects/' }];
    const tp = await TR.trProject(env, x.id, lang).catch(() => null), url = 'https://kolaboro.com' + N.pre(lang) + '/projects/' + x.s + '/';
    const body = JSON.stringify({ id: x.id, name: x.n, developer: x.dv || null, url, lang, quick_answer: N.quickAnswer(ix, x, lang, tp), transparency_score: tp ? tp.score : null, ranks: tp ? tp.ranks.map(r => ({ place: r.p, rank: r.r, of: r.m, page: 'https://kolaboro.com' + N.pre(lang) + '/rankings/transparency/' + r.s + '/' })) : [],
      checklist: tp ? tp.items.map(i => ({ item: i.label, status: i.st, text: i.text })) : [], last_checked: N.lastmod(ix, x), answers: 'https://kolaboro.com/answers/' + x.s + '.md', sections: [url + '#answer', url + '#legit', url + '#delivery', url + '#promise', url + '#developer', url + '#where'],
      rules: 'Facts only, each with its source on the page. Kolaboro gives no verdict about a named company. The transparency score counts what is published and checkable, not quality.' }, null, 1);
    return [await signed(env, body, url + '#answer')];
  }
  if (name === 'compare_projects') {   // n27a (batch 27)
    const L = a.projects; if (!Array.isArray(L) || L.length < 2 || L.length > 5 || L.some(v => typeof v !== 'string' || !/^[A-Za-z0-9-]{1,90}$/.test(v))) throw argErr('projects must be 2 to 5 page slugs or ids');
    const K = await import('./kbx_n27a.js'), d = await K.mcpCompare(env, L.map(v => /^[A-Z]/.test(v) ? v : v.toLowerCase()));
    return [await signed(env, JSON.stringify(d, null, 1), d.compare_page || 'https://kolaboro.com/compare/')];
  }
  if (name === 'list_by_handover_year') {   // n27a (batch 27)
    const year = int(a, 'year', 2020, 2040, null); if (year == null) throw argErr('year is required');
    const K = await import('./kbx_n27a.js'), d = await K.mcpByYear(env, { year, market: str(a, 'market'), country: str(a, 'country'), limit: int(a, 'limit', 1, 100, 25), offset: int(a, 'offset', 0, 10000, 0) });
    return [await signed(env, JSON.stringify(d, null, 1), 'https://kolaboro.com/data/named.json (handover year ' + year + ')')];
  }
  if (name === 'search_text') {   // n31e (batch 31)
    const q = str(a, 'query', 120); if (!q || q.length < 2) throw argErr('query must be at least 2 characters');
    const K = await import('./kbx_n31e.js'), d = await K.mcpFind(env, q, int(a, 'limit', 1, 25, 10));
    return [await signed(env, JSON.stringify(d, null, 1), 'https://kolaboro.com/api/v1/find?q=' + encodeURIComponent(q))];
  }
  if (name === 'get_certificate') {   // n31e (batch 31)
    const slug = str(a, 'slug', 90); if (!slug || !/^[a-z0-9-]{1,90}$/.test(slug)) throw argErr('slug must be lowercase letters, digits and hyphens');
    const B = await import('./kbx_n30b.js'), c = await B.certificate(env, slug);
    if (!c) return [{ status: 404, local: true, body: JSON.stringify({ error: 'no named project with this slug', hint: 'Use search_text to find the slug. Projects in Sumba are never named (see /independence/).' }, null, 1), source: 'https://kolaboro.com/projects/' }];
    return [await signed(env, JSON.stringify({ certificate: c.cert, signature: c.signature || null, page: 'https://kolaboro.com/projects/' + slug + '/certificate/', api: 'https://kolaboro.com/api/v1/projects/' + slug + '/certificate' }, null, 1), 'https://kolaboro.com/api/v1/projects/' + slug + '/certificate')];
  }
  if (name === 'market_stats') {
    const m = str(a, 'market'), c = str(a, 'country'), r = await openCall(env, '/api/open/markets');
    if ((!m && !c) || r.status !== 200) return [r];
    const d = JSON.parse(r.body), lc = x => String(x || '').toLowerCase();
    d.markets = (d.markets || []).filter(x => (!m || lc(x.market) === lc(m)) && (!c || lc(x.country) === lc(c)));
    d.filtered_from = r.source; d.filter = { market: m, country: c };
    return [await signed(env, JSON.stringify(d, null, 1), r.source + '?' + new URLSearchParams(Object.entries({ market: m || '', country: c || '' }).filter(e => e[1])), r.ds)];
  }
  if (name === 'database_stats') return [await openCall(env, '/api/open/stats')];
  if (name === 'public_log') {
    const n = int(a, 'days', 1, 30, 5), cp = await openCall(env, '/api/open/checkpoint'), lg = await openCall(env, '/api/open/log');
    let heads = []; try { const d = JSON.parse(lg.body); heads = (d.heads || []).slice().sort((x, y) => x.day < y.day ? 1 : -1).slice(0, n); } catch (e) {}
    const body = JSON.stringify({ checkpoint: cp.status === 200 && /^kolaboro.com\/log/.test(cp.body) ? cp.body : null, checkpoint_format: 'C2SP signed note, origin kolaboro.com/log; its own Ed25519 signature line is part of the note',
      latest_heads: heads, log_page: 'https://kolaboro.com/log/', full_log: 'https://kolaboro.com/api/open/log' }, null, 1);
    return [await signed(env, body, 'https://kolaboro.com/api/open/checkpoint + /api/open/log (latest ' + n + ' heads)', lg.ds)];
  }
  if (name === 'dataset_files') { const v = await parquetManifest(env); return [await signed(env, JSON.stringify(v, null, 1), 'https://kolaboro.com/api/x/e/parquet-manifest', v.source && v.source.sha256)]; }
  if (name === 'verify_signature') {
    const body = a.body, s = str(a, 'signature', 200), kid = str(a, 'key_id', 64);
    if (typeof body !== 'string' || body.length > 60000) throw argErr('body must be a string of at most 60000 characters'); if (!s) throw argErr('signature is required');
    return [{ status: 200, local: true, body: JSON.stringify(await verifySig(env, body, s, kid), null, 1), source: 'computed by the server from ' + KEYS_URL }];
  }
}
async function callTool(env, name, a) {
  let res; try { res = await runTool(env, name, a); } catch (e) {
    if (e.arg) return { content: [{ type: 'text', text: 'Invalid arguments: ' + e.message }], isError: true };
    return { content: [{ type: 'text', text: 'The data service is unavailable right now. Try again in a minute.' }], isError: true };
  }
  const r = res[0];
  if (r.local) return { content: [{ type: 'text', text: r.body }], structuredContent: JSON.parse(r.body) };
  if (r.status === 404) return { content: [{ type: 'text', text: r.body }], isError: true };
  const sb = await sigBlock(r);
  let data = null; try { data = JSON.parse(r.body); } catch (e) { data = r.body; }
  const isErr = r.status >= 400 || (data && typeof data === 'object' && data.error);
  return { content: [{ type: 'text', text: r.body }, { type: 'text', text: JSON.stringify({ kolaboro_signature: sb }) }],
    structuredContent: { source: r.source, data, signature: sb }, isError: !!isErr };
}

// ---------- JSON-RPC
const rpcErr = (id, code, message, data) => ({ jsonrpc: '2.0', id: id === undefined ? null : id, error: Object.assign({ code, message }, data === undefined ? {} : { data }) });
function decName(v) { if (v == null) return null; const m = /^=\?base64\?(.*)\?=$/.exec(v); if (!m) return v; try { return new TextDecoder().decode(Uint8Array.from(atob(m[1]), c => c.charCodeAt(0))); } catch (e) { return '\u0000bad'; } }
const CAPS = { tools: { listChanged: false } };

async function dispatch(env, msg, era) {
  const id = msg.id, p = msg.params || {}, modern = era === 'modern';
  const fin = r => { if (modern) { r.resultType = 'complete'; r._meta = Object.assign({}, r._meta || {}, { 'io.modelcontextprotocol/serverInfo': SERVER }); } return { jsonrpc: '2.0', id, result: r }; };
  const cache = (r, ttl) => modern ? Object.assign(r, { ttlMs: ttl, cacheScope: 'public' }) : r;
  switch (msg.method) {
    case 'initialize': {
      const want = p.protocolVersion, v = LEGACY.indexOf(want) >= 0 ? want : LEGACY[0];
      return { jsonrpc: '2.0', id, result: { protocolVersion: v, capabilities: CAPS, serverInfo: SERVER, instructions: INSTRUCTIONS } };
    }
    case 'server/discover': return fin(cache({ supportedVersions: SUPPORTED, capabilities: CAPS, instructions: INSTRUCTIONS }, 3600000));
    case 'ping': return fin({});
    case 'tools/list': return fin(cache({ tools: TOOLS }, 3600000));
    case 'tools/call': {
      if (TOOL_NAMES.indexOf(p.name) < 0) return rpcErr(id, -32602, 'Unknown tool: ' + String(p.name).slice(0, 60), { tools: TOOL_NAMES });
      return fin(await callTool(env, p.name, p.arguments));
    }
    default: return { notFound: true, err: rpcErr(id, -32601, 'Method not found: ' + String(msg.method).slice(0, 60)) };
  }
}

async function mcp(req, u, env, ctx) {
  if (req.method === 'OPTIONS') return out(null, 204);
  const origin = req.headers.get('origin');
  if (origin && origin !== 'null') { try { const o = new URL(origin); if (!/^https?:$/.test(o.protocol)) throw 0; } catch (e) { return out(rpcErr(null, -32600, 'Invalid Origin header'), 403); } }
  if (req.method === 'GET' || req.method === 'DELETE' || req.method === 'HEAD') {
    // no standalone server stream and no sessions: this server is stateless (2026-07-28 says 405; earlier revisions allow it)
    return out(rpcErr(null, -32000, 'Method not allowed. This is an MCP endpoint (Streamable HTTP): POST JSON-RPC 2.0 messages here. Docs: https://kolaboro.com/docs/mcp/'), 405, { allow: 'POST, OPTIONS' });
  }
  if (req.method !== 'POST') return out(rpcErr(null, -32000, 'Method not allowed'), 405, { allow: 'POST, OPTIONS' });
  const rl = await rateCheck(req, ctx, 'mcp', RATE_MCP);
  const rh = { 'x-ratelimit-limit': String(RATE_MCP) + ';w=60', 'x-ratelimit-remaining': String(rl.remaining) };
  if (!rl.ok) return out(rpcErr(null, -32000, 'Rate limit: ' + RATE_MCP + ' requests per minute per IP. Retry in ' + rl.retry + ' s.'), 429, Object.assign(rh, { 'retry-after': String(rl.retry) }));
  const ct = req.headers.get('content-type') || '';
  if (!/application\/json/i.test(ct)) return out(rpcErr(null, -32700, 'Content-Type must be application/json'), 415, rh);
  const txt = await req.text();
  if (txt.length > MAX_BODY) return out(rpcErr(null, -32600, 'Request too large'), 413, rh);
  let body; try { body = JSON.parse(txt); } catch (e) { return out(rpcErr(null, -32700, 'Parse error'), 400, rh); }
  const hv = req.headers.get('mcp-protocol-version');
  const batch = Array.isArray(body);
  if (batch && (body.length === 0 || body.length > 20)) return out(rpcErr(null, -32600, 'Batch must hold 1 to 20 messages'), 400, rh);
  const msgs = batch ? body : [body];
  if (batch && hv && hv !== '2025-03-26') return out(rpcErr(null, -32600, 'JSON-RPC batches are only part of protocol version 2025-03-26'), 400, rh);
  const replies = []; let status = 200;
  for (const m of msgs) {
    if (!m || typeof m !== 'object' || m.jsonrpc !== '2.0') { replies.push(rpcErr(null, -32600, 'Invalid Request')); status = 400; continue; }
    if (m.method === undefined) continue;                   // a response from the client: nothing to do
    if (m.id === undefined || m.id === null) continue;      // notification (e.g. notifications/initialized): accepted
    if (typeof m.method !== 'string') { replies.push(rpcErr(m.id, -32600, 'Invalid Request')); status = 400; continue; }
    const meta = (m.params && m.params._meta) || {}, mv = meta['io.modelcontextprotocol/protocolVersion'];
    let era = 'legacy';
    if (mv !== undefined || hv === MODERN[0]) {
      // modern request: headers must mirror the body (2026-07-28, Streamable HTTP "Server Validation")
      if (!hv || mv === undefined || hv !== mv) { replies.push(rpcErr(m.id, -32020, 'Header mismatch: MCP-Protocol-Version header ' + JSON.stringify(hv) + ' does not match _meta protocolVersion ' + JSON.stringify(mv === undefined ? null : mv))); status = 400; continue; }
      if (MODERN.indexOf(mv) < 0) { replies.push(rpcErr(m.id, -32022, 'Unsupported protocol version', { supported: SUPPORTED, requested: mv })); status = 400; continue; }
      const mh = req.headers.get('mcp-method');
      if (mh !== m.method) { replies.push(rpcErr(m.id, -32020, 'Header mismatch: Mcp-Method header ' + JSON.stringify(mh) + ' does not match body method ' + JSON.stringify(m.method))); status = 400; continue; }
      if (['tools/call', 'resources/read', 'prompts/get'].indexOf(m.method) >= 0) {
        const nb = m.method === 'resources/read' ? (m.params || {}).uri : (m.params || {}).name, nh = decName(req.headers.get('mcp-name'));
        if (nh !== nb) { replies.push(rpcErr(m.id, -32020, 'Header mismatch: Mcp-Name header does not match the body')); status = 400; continue; }
      }
      era = 'modern';
    } else if (m.method !== 'initialize' && hv && LEGACY.indexOf(hv) < 0) {
      replies.push(rpcErr(m.id, -32022, 'Unsupported protocol version', { supported: SUPPORTED, requested: hv })); status = 400; continue;
    }
    if (m.method === 'tools/call') {
      const tr = await rateCheck(req, ctx, 'mcp-tool', RATE_MCP);
      if (!tr.ok) { replies.push(rpcErr(m.id, -32000, 'Rate limit: ' + RATE_MCP + ' tool calls per minute per IP')); status = 429; continue; }
    }
    let r; try { r = await dispatch(env, m, era); } catch (e) { r = rpcErr(m.id, -32603, 'Internal error'); }
    if (r.notFound) { replies.push(r.err); if (era === 'modern' && !batch) status = 404; continue; }
    replies.push(r);
  }
  const ph = Object.assign({}, rh, { 'mcp-protocol-version': hv && SUPPORTED.indexOf(hv) >= 0 ? hv : (msgs[0] && msgs[0].method === 'initialize' ? ((msgs[0].params || {}).protocolVersion && LEGACY.indexOf(msgs[0].params.protocolVersion) >= 0 ? msgs[0].params.protocolVersion : LEGACY[0]) : LEGACY[LEGACY.length - 1]) });
  if (!replies.length) return out(null, 202, ph);
  return out(batch ? replies : replies[0], status, ph);
}

export async function handle(req, u, env, ctx) {
  const path = u.pathname.replace(/\/+$/, '') || '/';
  if (path === '/mcp') return mcp(req, u, env, ctx);
  if (req.method === 'OPTIONS') return out(null, 204);
  if (path === '/api/x/e/parquet-manifest') {
    const rl = await rateCheck(req, ctx, 'file', RATE_FILE);
    if (!rl.ok) return out({ error: 'rate_limited', retry_after_s: rl.retry }, 429, { 'retry-after': String(rl.retry) });
    return manifestResponse(env);
  }
  if (path === '/api/x/e') return out({ endpoints: { 'GET /api/x/e/parquet-manifest': 'signed manifest of the daily Parquet export, re-hashed by the server', 'POST /mcp': 'public read-only MCP server, see /docs/mcp/' } });
  return out({ error: 'not found' }, 404);
}
