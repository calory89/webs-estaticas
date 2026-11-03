// Feature module t for kolaboro.com (see kbx.js): network. Buyers and partners talk to the record, and every message is signed.
//   GET  /api/x/t/status                   which parts are open (tables applied, signing key present)
//   GET  /api/x/t/reports?project=ID       approved buyer reports, anonymised (never the document hash, key hash or IP)
//   POST /api/x/t/reports                  a buyer report signed with a passkey (WebAuthn). Proof of purchase is the SHA-256 of the
//                                          buyer's contract or receipt, computed in the browser: the file never leaves the device.
//                                          One report per passkey per project. Nothing is public until a moderator approves it.
//   POST /api/x/t/hooks                    partners (API key holders, /api-keys/) register a webhook URL for watched projects
//   GET  /api/x/t/hooks                    the key holder's webhooks and the last 100 deliveries
//   POST /api/x/t/hooks/disable            switch a webhook off
//   POST /api/x/t/hooks/ping               send a signed "ping" event to any https URL now (needs a valid key; no table needed)
//   GET  /api/x/t/hooks/sample             a freshly signed sample event, to test verification code against
//   POST /api/x/t/hooks/run                daily job (GitHub OIDC, workflow kolaboro-webhooks.yml): diff each watched project's public
//                                          record with the last state (same logic as the push alerts, kbx_j.js) and POST signed events
// Webhook signature: the open API scheme. x-kolaboro-signature = base64 Ed25519 over "kolaboro-sig-v1\n" + SHA-256 hex of the exact
// body, key id in x-kolaboro-key-id, keys at /.well-known/kolaboro-keys.json. The body carries timestamp, webhook_id and event id,
// so a receiver rejects stale (over 5 minutes), misdirected (other webhook id) and repeated (seen event id) deliveries.
// Tables and functions: scratchpad m11/t.sql. Until applied, reports and webhook registration answer "opens soon".
import * as KB from './kolaboro.js';
import { stateOf, diffOf } from './kbx_j.js';
const { json, rpc, sha, signBody, openLoad, verifyAssertion } = KB;

export const PATHS = /^\/api\/x\/t\//;
const PID = /^[A-Z]{2,5}-\d{3,4}$/;
const KINDS = ['delay', 'payment', 'good', 'quality', 'other'];
const DOCS = ['contract', 'receipt', 'transfer', 'other'];
const UA = 'Kolaboro-Webhooks/1.0 (+https://kolaboro.com/docs/webhooks/)';
const MAX_DELIVERIES = 60;   // per daily run (subrequest budget); the rest waits for the next run as retries
const te = new TextEncoder(), td = new TextDecoder();
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type, x-api-key', 'access-control-expose-headers': 'x-kolaboro-signature, x-kolaboro-key-id' };
function out(o, s = 200, extra) { return new Response(JSON.stringify(o), { status: s, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, CORS, extra || {}) }); }
const ipOf = req => { const ip = req.headers.get('cf-connecting-ip') || 'x'; return ip.includes(':') ? ip.split(':').slice(0, 4).join(':') + '::/64' : ip; };
async function overLimit(req, ctx, name, max, ttl = 3600, who) {
  const win = ttl >= 86400 ? new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 13);
  const k = new Request('https://kolaboro.com/__kt_rl/' + name + '/' + encodeURIComponent(who || ipOf(req)) + '/' + win);
  const hit = await caches.default.match(k); const n = hit ? (+(await hit.text()) || 0) : 0;
  if (n >= max) return true;
  const p = caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=' + ttl } }));
  if (ctx && ctx.waitUntil) ctx.waitUntil(p); else await p;
  return false;
}
let READY = { t: 0, v: null };
async function ready() {
  if (READY.v && Date.now() - READY.t < 60000) return READY.v;
  let v; try { v = await rpc('kolaboro_t_ready', {}); } catch (e) { v = null; }
  READY = { t: Date.now(), v: v && v.reports ? v : null }; return READY.v;
}

export async function handle(req, u, env, ctx) {
  const p = u.pathname.replace(/\/+$/, '');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  try {
    if (p === '/api/x/t/status' && req.method === 'GET') return await status(env);
    if (p === '/api/x/t/reports' && req.method === 'GET') return await reportsPublic(u);
    if (p === '/api/x/t/reports' && req.method === 'POST') return await reportSubmit(req, env, ctx);
    if (p === '/api/x/t/hooks' && req.method === 'POST') return await hookRegister(req, env, ctx);
    if (p === '/api/x/t/hooks' && req.method === 'GET') return await hookList(req);
    if (p === '/api/x/t/hooks/disable' && req.method === 'POST') return await hookDisable(req);
    if (p === '/api/x/t/hooks/ping' && req.method === 'POST') return await hookPing(req, env, ctx);
    if (p === '/api/x/t/hooks/sample' && req.method === 'GET') return await hookSample(env, ctx, req);
    if (p === '/api/x/t/hooks/run' && req.method === 'POST') return await hookRun(req, env);
  } catch (e) { return out({ error: 'server', detail: String(e && e.message || e).slice(0, 160) }, 500); }
  return out({ error: 'not_found', see: ['/api/x/t/status', '/api/x/t/reports?project=ID', '/api/x/t/hooks/sample', 'https://kolaboro.com/docs/webhooks/'] }, 404);
}

async function status(env) {
  const r = await ready();
  return out({ reports: { open: !!r, approved: r ? r.reports_approved : null, pending: r ? r.reports_pending : null },
    webhooks: { open: !!r, active: r ? r.hooks_active : null, signing: !!(env && env.KB_SIGN_KEY), ping: true },
    note: r ? null : 'Opens soon: the tables are not installed yet. The webhook ping and sample work today.' }, 200, { 'cache-control': 'public, max-age=60' });
}

// ===================================================================================================== signed buyer reports
// The browser builds this exact string, hashes it, and the passkey signs SHA-256("kolaboro-report-v1\n" + that hash).
export function reportCanon(r) {
  return JSON.stringify(['kolaboro-report-v1', r.project, r.kind, r.text, r.delay_months == null ? null : r.delay_months, r.purchased || null, r.doc_sha256, r.doc_kind]);
}
async function reportsPublic(u) {
  const id = String(u.searchParams.get('project') || '').toUpperCase();
  if (id && !PID.test(id)) return out({ error: 'project' }, 400);
  const r = await ready();
  if (!r) return out({ open: false, reports: [], note: 'Buyer reports open soon.' }, 200, { 'cache-control': 'public, max-age=60' });
  let d; try { d = await rpc('kolaboro_t_reports_public', { p_project: id }); } catch (e) { return out({ open: false, reports: [], note: 'Temporarily unavailable.' }, 200, { 'cache-control': 'public, max-age=30' }); }
  return out(Object.assign({ open: true, project: id || null }, d || {}), 200, { 'cache-control': 'public, max-age=60' });
}
async function reportSubmit(req, env, ctx) {
  if (!(await ready())) return out({ error: 'opening_soon', note: 'Buyer reports open soon. Nothing was stored.' }, 503);
  let b; try { b = await req.json(); } catch (e) { return out({ error: 'bad_request' }, 400); }
  if (!b || typeof b !== 'object' || b.website) return out({ error: 'bad_request' }, 400);   // honeypot field
  const r = { project: String(b.project || ''), kind: String(b.kind || ''), text: String(b.text || ''), delay_months: b.delay_months == null || b.delay_months === '' ? null : +b.delay_months,
    purchased: b.purchased ? String(b.purchased) : null, doc_sha256: String(b.doc_sha256 || ''), doc_kind: String(b.doc_kind || '') };
  if (!PID.test(r.project)) return out({ error: 'project' }, 400);
  if (KINDS.indexOf(r.kind) < 0 || DOCS.indexOf(r.doc_kind) < 0) return out({ error: 'input', detail: 'kind or document type' }, 400);
  if (r.text !== r.text.trim() || r.text.length < 30 || r.text.length > 2000) return out({ error: 'input', detail: 'Write 30 to 2000 characters.' }, 400);
  if (r.delay_months != null && !(Number.isInteger(r.delay_months) && r.delay_months >= 0 && r.delay_months <= 240)) return out({ error: 'input', detail: 'delay' }, 400);
  if (r.purchased && !/^20\d{2}-(0[1-9]|1[0-2])$/.test(r.purchased)) return out({ error: 'input', detail: 'purchase month' }, 400);
  if (!/^[0-9a-f]{64}$/.test(r.doc_sha256)) return out({ error: 'input', detail: 'document fingerprint' }, 400);
  const pk = b.passkey || {};
  if (!pk.spki || typeof pk.spki !== 'string' || pk.spki.length > 1200 || [-7, -8, -257].indexOf(pk.alg) < 0) return out({ error: 'passkey', detail: 'no passkey public key' }, 400);
  if (await overLimit(req, ctx, 'rep', 5)) return out({ error: 'rate', detail: 'Five reports an hour per connection. Try later.' }, 429);
  const { d } = await openLoad();
  if (!(d.cases || []).some(c => c.id === r.project)) return out({ error: 'project', detail: 'Not a tracked project.' }, 404);
  const bodySha = await sha(reportCanon(r));
  const v = await verifyAssertion(pk, 'kolaboro-report-v1\n' + bodySha);
  if (!v.ok) return out({ error: 'signature', detail: v.why }, 400);
  const keyHash = await sha('kolaboro-report-key-v1\n' + pk.spki);
  const ipHash = await sha('kolaboro-t-ip-v1\n' + ipOf(req) + '\n' + new Date().toISOString().slice(0, 10) + '\n' + (KB.WKEY || ''));
  let s; try {
    s = await rpc('kolaboro_t_report_submit', { p_wkey: KB.WKEY, p_project: r.project, p_kind: r.kind, p_body: r.text, p_delay: r.delay_months, p_purchased: r.purchased,
      p_doc_sha: r.doc_sha256, p_doc_kind: r.doc_kind, p_key_hash: keyHash, p_alg: pk.alg, p_body_sha: bodySha, p_ip_hash: ipHash });
  } catch (e) { return out({ error: 'db' }, 503); }
  if (!s || !s.ok) {
    const e = (s && s.error) || 'db';
    const msg = { already: 'This passkey has already filed a report for this project. One report per passkey per project.', too_many: 'Too many reports today from this connection or passkey.', busy: 'Too many reports today in total. Try tomorrow.' }[e];
    return out({ error: e, detail: msg || null }, e === 'already' ? 409 : e === 'too_many' || e === 'busy' ? 429 : 400);
  }
  return out({ ok: true, ref: s.ref, body_sha256: bodySha, key_fingerprint: keyHash.slice(0, 16), user_verified: !!v.user_verified, status: 'waiting for moderation',
    email_proof: 'Optional: email the same document to hello@kolaboro.com with subject "Report ' + s.ref + '". The moderator checks it against the fingerprint ' + r.doc_sha256.slice(0, 12) + '... and does not keep it.' });
}

// ===================================================================================================== partner webhooks
const keyOf = req => { const k = req.headers.get('x-api-key') || ''; return /^kb_live_[0-9a-f]{40}$/.test(k) ? k : null; };
function hookUrl(raw) {
  const x = KB.okUrl(String(raw || '').trim());
  if (!x || x.protocol !== 'https:' || x.username || x.password || (x.port && x.port !== '443') || x.href.length > 500) return null;
  return x.href;
}
async function keyValid(key) {
  try { const r = await rpc('kolaboro_k_key_usage', { p_wkey: KB.WKEY, p_hash: await sha(key) }); return r && r.ok && !r.revoked_at ? r : null; } catch (e) { return null; }
}
async function hookRegister(req, env, ctx) {
  if (!(await ready())) return out({ error: 'opening_soon', note: 'Webhook registration opens soon. The ping (POST /api/x/t/hooks/ping) works today.' }, 503);
  const k = keyOf(req); if (!k) return out({ error: 'missing_key', how: 'https://kolaboro.com/api-keys/' }, 401);
  if (await overLimit(req, ctx, 'hreg', 20)) return out({ error: 'rate' }, 429);
  let b; try { b = await req.json(); } catch (e) { return out({ error: 'bad_request' }, 400); }
  const url = hookUrl(b && b.url); if (!url) return out({ error: 'url', detail: 'A public https URL (no IP address, no port, no credentials).' }, 400);
  const want = [...new Set((Array.isArray(b.projects) ? b.projects : []).map(x => String(x).toUpperCase().trim()))];
  if (!want.length || want.length > 200 || want.some(x => !PID.test(x))) return out({ error: 'projects', detail: '1 to 200 project ids like BAL-101.' }, 400);
  const { d } = await openLoad(); const ids = new Set((d.cases || []).map(c => c.id));
  const unknown = want.filter(x => !ids.has(x)); if (unknown.length) return out({ error: 'projects', unknown: unknown.slice(0, 20) }, 404);
  let r; try { r = await rpc('kolaboro_t_hook_upsert', { p_wkey: KB.WKEY, p_key_hash: await sha(k), p_url: url, p_projects: want }); } catch (e) { return out({ error: 'db' }, 503); }
  if (!r || !r.ok) return out({ error: (r && r.error) || 'db', max: r && r.max }, r && /key|revoked/.test(r.error) ? 401 : 400);
  const ping = await deliver(env, { id: r.id, url }, await pingEvent(), 1);
  return out({ ok: true, webhook: { id: r.id, url: r.url, projects: r.projects, created_at: r.created_at }, ping: { status: ping.status, ok: ping.ok, ms: ping.ms, error: ping.error || null } });
}
async function hookList(req) {
  if (!(await ready())) return out({ error: 'opening_soon' }, 503);
  const k = keyOf(req); if (!k) return out({ error: 'missing_key' }, 401);
  let r; try { r = await rpc('kolaboro_t_hook_list', { p_wkey: KB.WKEY, p_key_hash: await sha(k) }); } catch (e) { return out({ error: 'db' }, 503); }
  return out(r && r.ok ? r : { error: (r && r.error) || 'db' }, r && r.ok ? 200 : 401);
}
async function hookDisable(req) {
  if (!(await ready())) return out({ error: 'opening_soon' }, 503);
  const k = keyOf(req); if (!k) return out({ error: 'missing_key' }, 401);
  let b; try { b = await req.json(); } catch (e) { return out({ error: 'bad_request' }, 400); }
  const id = +(b && b.id); if (!(id > 0)) return out({ error: 'id' }, 400);
  const r = await rpc('kolaboro_t_hook_disable', { p_wkey: KB.WKEY, p_key_hash: await sha(k), p_id: id });
  return out(r && r.ok ? { ok: true } : { error: (r && r.error) || 'not_found' }, r && r.ok ? 200 : 404);
}
async function pingEvent() {
  const created = new Date().toISOString();
  return { type: 'ping', id: 'evt_' + (await sha('ping\n' + created + '\n' + Math.random())).slice(0, 24), created, note: 'Test event. If your code verifies this signature, it will verify real events.' };
}
async function hookPing(req, env, ctx) {
  const k = keyOf(req); if (!k) return out({ error: 'missing_key', how: 'https://kolaboro.com/api-keys/' }, 401);
  if (await overLimit(req, ctx, 'hping', 10)) return out({ error: 'rate', detail: 'Ten pings an hour.' }, 429);
  let b; try { b = await req.json(); } catch (e) { return out({ error: 'bad_request' }, 400); }
  const url = hookUrl(b && b.url); if (!url) return out({ error: 'url', detail: 'A public https URL (no IP address, no port, no credentials).' }, 400);
  if (!(await keyValid(k))) return out({ error: 'invalid_key' }, 401);
  if (await overLimit(req, ctx, 'hpingk', 30, 3600, (await sha(k)).slice(0, 24))) return out({ error: 'rate' }, 429);
  const r = await deliver(env, { id: 0, url }, await pingEvent(), 1, true);
  return out({ ok: r.ok, response: { status: r.status, ms: r.ms, error: r.error || null }, sent: r.sent });
}
async function hookSample(env, ctx, req) {
  if (await overLimit(req, ctx, 'hsample', 120)) return out({ error: 'rate' }, 429);
  const { d, sha: dsha } = await openLoad();
  const c = (d.cases || []).find(x => x.id && x.score != null) || {};
  const after = stateOf(c, null), before = JSON.parse(JSON.stringify(after));
  before.score = Math.max(0, (after.score || 0) - 1);
  const evt = await changeEvent(c, before, after, diffOf(before, after), d, dsha);
  evt.sample = true; evt.note = 'Sample only: the "before" state is made up for this example (one check fewer). Real events carry the recorded previous state.';
  const s = await signedRequest(env, 0, evt, 1);
  if (!s) return out({ error: 'signing_unavailable' }, 503);
  return out({ headers: s.headers, body: s.body, verify: { message: 'kolaboro-sig-v1\\n + sha256_hex(body)', keys: 'https://kolaboro.com/.well-known/kolaboro-keys.json' } });
}
async function changeEvent(c, before, after, changes, d, dsha) {
  const id = 'evt_' + (await sha('kolaboro-webhook-v1\n' + c.id + '\n' + JSON.stringify(before) + '\n' + JSON.stringify(after))).slice(0, 24);
  return { type: 'project.changed', id, created: new Date().toISOString(),
    project: { id: c.id, market: c.market || null, country: c.country || null, page: 'https://kolaboro.com/p/' + c.id, api: 'https://kolaboro.com/api/open/projects/' + c.id },
    changes, before, after, dataset: { updated: d.updated || null, sha256: dsha || null } };
}
export async function signedRequest(env, hookId, evt, attempt) {
  const ts = Math.floor(Date.now() / 1000);
  const body = JSON.stringify(Object.assign({}, evt, { webhook_id: hookId, attempt, timestamp: ts }));
  const sig = await signBody(env, body); if (!sig) return null;
  return { body, headers: { 'content-type': 'application/json; charset=utf-8', 'user-agent': UA, 'x-kolaboro-event': evt.type, 'x-kolaboro-event-id': evt.id,
    'x-kolaboro-timestamp': String(ts), 'x-kolaboro-delivery-attempt': String(attempt), 'x-kolaboro-signature': sig, 'x-kolaboro-key-id': (env && env.KB_SIGN_KID) || 'kb' } };
}
// one HTTP attempt: 10 s timeout, no redirects followed, 2xx = delivered
export async function deliver(env, hook, evt, attempt, showSent) {
  const s = await signedRequest(env, hook.id, evt, attempt);
  const base = { hook_id: hook.id, event_id: evt.id, type: evt.type, project_id: evt.project ? evt.project.id : null, attempt };
  if (!s) return Object.assign(base, { ok: false, status: null, ms: 0, error: 'signing key not installed' });
  const ac = new AbortController(), t0 = Date.now(), tm = setTimeout(() => ac.abort(), 10000);
  let st = null, err = null;
  try { const r = await fetch(hook.url, { method: 'POST', headers: s.headers, body: s.body, redirect: 'manual', signal: ac.signal }); st = r.status; try { await r.body?.cancel(); } catch (e) {} }
  catch (e) { err = ac.signal.aborted ? 'timeout after 10 s' : ('network: ' + String(e && e.message || e)).slice(0, 150); }
  clearTimeout(tm);
  const ok = st >= 200 && st < 300;
  return Object.assign(base, { ok, status: st, ms: Date.now() - t0, error: ok ? null : err || ('http ' + st) }, showSent ? { sent: { url: hook.url, headers: s.headers, body: s.body } } : {});
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
// in-run retries: up to 3 attempts (waits 2 s and 6 s); a delivery still failing is retried by the next daily runs, up to 6 attempts
async function deliverWithRetry(env, hook, evt, startAttempt, log, budget) {
  let a = startAttempt, r;
  for (let i = 0; i < 3 && budget.n > 0; i++, a++) {
    budget.n--; r = await deliver(env, hook, evt, a); log.push(Object.assign({}, r, { payload: r.ok ? null : evt }));
    if (r.ok || (r.status >= 400 && r.status < 500 && r.status !== 408 && r.status !== 429)) break;   // a 4xx answer will not change on retry
    if (i < 2) await sleep(i ? 6000 : 2000);
  }
  return r;
}
async function githubOidc(req, workflowFile) {
  const m = (req.headers.get('authorization') || '').match(/^Bearer ([\w-]+)\.([\w-]+)\.([\w-]+)$/); if (!m) return null;
  const dec = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), c => c.charCodeAt(0)); };
  const hd = JSON.parse(td.decode(dec(m[1]))), cl = JSON.parse(td.decode(dec(m[2])));
  if (hd.alg !== 'RS256') return null;
  const j = await (await fetch('https://token.actions.githubusercontent.com/.well-known/jwks', { cf: { cacheTtl: 3600 } })).json();
  const jwk = (j.keys || []).find(k => k.kid === hd.kid); if (!jwk) return null;
  const key = await crypto.subtle.importKey('jwk', { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true }, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, dec(m[3]), te.encode(m[1] + '.' + m[2]));
  const now = Date.now() / 1000;
  if (!ok || cl.iss !== 'https://token.actions.githubusercontent.com' || cl.aud !== 'kolaboro.com' || cl.repository !== 'calory89/webs-estaticas' || !(cl.exp > now) || String(cl.workflow_ref || '').indexOf('/.github/workflows/' + workflowFile + '@') < 0) return null;
  return cl;
}
async function loadJson(p) { try { const r = await fetch('https://kolaboro.com' + p, { cf: { cacheTtl: 300 } }); return r.ok && /json/.test(r.headers.get('content-type') || '') ? await r.json() : null; } catch (e) { return null; } }
async function hookRun(req, env) {
  let cl = null; try { cl = await githubOidc(req, 'kolaboro-webhooks.yml'); } catch (e) {}
  if (!cl) return out({ error: 'unauthorized' }, 401);
  return out(await runJob(env, cl.run_id || null));
}
export async function runJob(env, runId) {
  if (!(env && env.KB_SIGN_KEY)) return { ok: true, skipped: 'signing key not installed' };
  let job; try { job = await rpc('kolaboro_t_hook_job', { p_wkey: KB.WKEY }); } catch (e) { job = null; }
  if (!job || !Array.isArray(job.hooks)) return { ok: true, skipped: 'webhook tables not installed' };
  const [{ d, sha: dsha }, drift] = await Promise.all([openLoad(), loadJson('/data/promise-drift.json')]);
  const by = {}; (d.cases || []).forEach(c => { by[c.id] = c; });
  const prev = job.states || {}, watched = new Set(); job.hooks.forEach(h => (h.projects || []).forEach(p => watched.add(p)));
  const states = {}, events = {};
  for (const id of watched) {
    const c = by[id]; if (!c) continue;
    const now = stateOf(c, drift); states[id] = now;
    if (prev[id]) { const L = diffOf(prev[id], now); if (L.length) events[id] = await changeEvent(c, prev[id], now, L, d, dsha); }   // first sight only records
  }
  const log = [], budget = { n: MAX_DELIVERIES }; let delivered = 0, failed = 0, retried = 0;
  const hooks = {}; job.hooks.forEach(h => { hooks[h.id] = h; });
  for (const x of job.retries || []) {   // failed deliveries from earlier runs, one attempt each
    const h = hooks[x.hook_id]; if (!h || !x.payload || budget.n <= 0) continue;
    budget.n--; retried++; const r = await deliver(env, h, x.payload, (x.attempt || 1) + 1);
    log.push(Object.assign({}, r, { payload: r.ok ? null : x.payload })); if (r.ok) delivered++; else failed++;
  }
  for (const h of job.hooks) for (const p of h.projects || []) {
    if (!events[p]) continue;
    if (budget.n <= 0) { log.push({ hook_id: h.id, event_id: events[p].id, type: events[p].type, project_id: p, attempt: 1, ok: false, status: null, ms: 0, error: 'deferred to the next run (delivery budget)', payload: events[p] }); failed++; continue; }
    const r = await deliverWithRetry(env, h, events[p], 1, log, budget); if (r && r.ok) delivered++; else failed++;
  }
  let saved = null; try { saved = await rpc('kolaboro_t_hook_done', { p_wkey: KB.WKEY, p_states: states, p_log: log }); } catch (e) {}
  return { ok: true, hooks: job.hooks.length, watched: watched.size, changed: Object.keys(events).length, attempts: log.length, delivered, failed, retried_from_earlier: retried, logged: saved && saved.logged, dataset: d.updated || null, run: runId };
}
