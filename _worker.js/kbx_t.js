// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_t__q, $s = TB.kbx_t__s, $t = TB.kbx_t__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import * as KB from './kolaboro.js';
import { stateOf, diffOf } from './kbx_j.js';
import { TB } from './kbx_strings.js';
const { json, rpc, sha, signBody, openLoad, verifyAssertion } = KB;
export const PATHS = /^\/api\/x\/t\//;
const PID = /^[A-Z]{2,5}-\d{3,4}$/;
const KINDS = ['delay', 'payment', 'good', 'quality', 'other'];
const DOCS = ['contract', 'receipt', 'transfer', 'other'];
const MAX_DELIVERIES = 60;
const te = new TextEncoder(), td = new TextDecoder();
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type, x-api-key', 'access-control-expose-headers': 'x-kolaboro-signature, x-kolaboro-key-id' };
function out(o, s = 200, extra) { return new Response(JSON.stringify(o), { status: s, headers: Object.assign({ 'content-type': $q.a, 'cache-control': $q.b }, CORS, extra || {}) }); }
const ipOf = req => { const ip = req.headers.get($q.c) || 'x'; return ip.includes(':') ? ip.split(':').slice(0, 4).join(':') + '::/64' : ip; };
async function overLimit(req, ctx, name, max, ttl = 3600, who) {
const win = ttl >= 86400 ? new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 13);
const k = new Request($q.d + name + '/' + encodeURIComponent(who || ipOf(req)) + '/' + win);
const hit = await caches.default.match(k); const n = hit ? (+(await hit.text()) || 0) : 0;
if (n >= max) return true;
const p = caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': $q.e + ttl } }));
if (ctx && ctx.waitUntil) ctx.waitUntil(p); else await p;
return false;
}
let READY = { t: 0, v: null };
async function ready() {
if (READY.v && Date.now() - READY.t < 60000) return READY.v;
let v; try { v = await rpc($q.f, {}); } catch (e) { v = null; }
READY = { t: Date.now(), v: v && v.reports ? v : null }; return READY.v;
}
export async function handle(req, u, env, ctx) {
const p = u.pathname.replace(/\/+$/, '');
if (req.method === $q.g) return new Response(null, { status: 204, headers: CORS });
try {
if (p === $q.h && req.method === 'GET') return await status(env);
if (p === $q.i && req.method === 'GET') return await reportsPublic(u);
if (p === $q.i && req.method === 'POST') return await reportSubmit(req, env, ctx);
if (p === $q.j && req.method === 'POST') return await hookRegister(req, env, ctx);
if (p === $q.j && req.method === 'GET') return await hookList(req);
if (p === $q.k && req.method === 'POST') return await hookDisable(req);
if (p === $q.l && req.method === 'POST') return await hookPing(req, env, ctx);
if (p === $q.m && req.method === 'GET') return await hookSample(env, ctx, req);
if (p === $q.n && req.method === 'POST') return await hookRun(req, env);
} catch (e) { return out({ error: $q.o, detail: String(e && e.message || e).slice(0, 160) }, 500); }
return out({ error: $q.p, see: [$q.h, $q.q, $q.m, $q.r] }, 404);
}
async function status(env) {
  const r = await ready();
  return out({ reports: { open: !!r, approved: r ? r.reports_approved : null, pending: r ? r.reports_pending : null },
    webhooks: { open: !!r, active: r ? r.hooks_active : null, signing: !!(env && env.KB_SIGN_KEY), ping: true },
    note: r ? null : $q.s }, 200, { 'cache-control': $q.t });
}
export function reportCanon(r) {
return JSON.stringify([$q.u, r.project, r.kind, r.text, r.delay_months == null ? null : r.delay_months, r.purchased || null, r.doc_sha256, r.doc_kind]);
}
async function reportsPublic(u) {
const id = String(u.searchParams.get($q.v) || '').toUpperCase();
if (id && !PID.test(id)) return out({ error: $q.v }, 400);
const r = await ready();
if (!r) return out({ open: false, reports: [], note: $q.w }, 200, { 'cache-control': $q.t });
let d; try { d = await rpc($q.x, { p_project: id }); } catch (e) { return out({ open: false, reports: [], note: $q.y }, 200, { 'cache-control': $q.z }); }
return out(Object.assign({ open: true, project: id || null }, d || {}), 200, { 'cache-control': $q.t });
}
async function reportSubmit(req, env, ctx) {
if (!(await ready())) return out({ error: $q.A, note: $t.k0 }, 503);
let b; try { b = await req.json(); } catch (e) { return out({ error: $q.B }, 400); }
if (!b || typeof b !== $q.C || b.website) return out({ error: $q.B }, 400);
const r = { project: String(b.project || ''), kind: String(b.kind || ''), text: String(b.text || ''), delay_months: b.delay_months == null || b.delay_months === '' ? null : +b.delay_months,
purchased: b.purchased ? String(b.purchased) : null, doc_sha256: String(b.doc_sha256 || ''), doc_kind: String(b.doc_kind || '') };
if (!PID.test(r.project)) return out({ error: $q.v }, 400);
if (KINDS.indexOf(r.kind) < 0 || DOCS.indexOf(r.doc_kind) < 0) return out({ error: 'input', detail: $q.D }, 400);
if (r.text !== r.text.trim() || r.text.length < 30 || r.text.length > 2000) return out({ error: 'input', detail: $q.E }, 400);
if (r.delay_months != null && !(Number.isInteger(r.delay_months) && r.delay_months >= 0 && r.delay_months <= 240)) return out({ error: 'input', detail: 'delay' }, 400);
if (r.purchased && !/^20\d{2}-(0[1-9]|1[0-2])$/.test(r.purchased)) return out({ error: 'input', detail: $q.F }, 400);
if (!/^[0-9a-f]{64}$/.test(r.doc_sha256)) return out({ error: 'input', detail: $q.G }, 400);
const pk = b.passkey || {};
if (!pk.spki || typeof pk.spki !== $q.H || pk.spki.length > 1200 || [-7, -8, -257].indexOf(pk.alg) < 0) return out({ error: $q.I, detail: $q.J }, 400);
if (await overLimit(req, ctx, 'rep', 5)) return out({ error: 'rate', detail: $t.k1 }, 429);
const { d } = await openLoad();
if (!(d.cases || []).some(c => c.id === r.project)) return out({ error: $q.v, detail: $q.K }, 404);
const bodySha = await sha(reportCanon(r));
const v = await verifyAssertion(pk, $q.L + bodySha);
if (!v.ok) return out({ error: $q.M, detail: v.why }, 400);
const keyHash = await sha($q.N + pk.spki);
const ipHash = await sha($q.O + ipOf(req) + '\n' + new Date().toISOString().slice(0, 10) + '\n' + (KB.WKEY || ''));
let s; try {
s = await rpc($q.P, { p_wkey: KB.WKEY, p_project: r.project, p_kind: r.kind, p_body: r.text, p_delay: r.delay_months, p_purchased: r.purchased,
p_doc_sha: r.doc_sha256, p_doc_kind: r.doc_kind, p_key_hash: keyHash, p_alg: pk.alg, p_body_sha: bodySha, p_ip_hash: ipHash });
} catch (e) { return out({ error: 'db' }, 503); }
if (!s || !s.ok) {
const e = (s && s.error) || 'db';
const msg = { already: $t.k2, too_many: $t.k3, busy: $t.k4 }[e];
return out({ error: e, detail: msg || null }, e === $q.Q ? 409 : e === $q.R || e === 'busy' ? 429 : 400);
}
return out({ ok: true, ref: s.ref, body_sha256: bodySha, key_fingerprint: keyHash.slice(0, 16), user_verified: !!v.user_verified, status: $q.S,
email_proof: $t.k5 + s.ref + $t.k6 + r.doc_sha256.slice(0, 12) + $q.T });
}
const keyOf = req => { const k = req.headers.get($q.U) || ''; return /^kb_live_[0-9a-f]{40}$/.test(k) ? k : null; };
function hookUrl(raw) {
const x = KB.okUrl(String(raw || '').trim());
if (!x || x.protocol !== $q.V || x.username || x.password || (x.port && x.port !== '443') || x.href.length > 500) return null;
return x.href;
}
async function keyValid(key) {
try { const r = await rpc($q.W, { p_wkey: KB.WKEY, p_hash: await sha(key) }); return r && r.ok && !r.revoked_at ? r : null; } catch (e) { return null; }
}
async function hookRegister(req, env, ctx) {
if (!(await ready())) return out({ error: $q.A, note: $t.k7 }, 503);
const k = keyOf(req); if (!k) return out({ error: $q.X, how: $q.Y }, 401);
if (await overLimit(req, ctx, 'hreg', 20)) return out({ error: 'rate' }, 429);
let b; try { b = await req.json(); } catch (e) { return out({ error: $q.B }, 400); }
const url = hookUrl(b && b.url); if (!url) return out({ error: 'url', detail: $t.k8 }, 400);
const want = [...new Set((Array.isArray(b.projects) ? b.projects : []).map(x => String(x).toUpperCase().trim()))];
if (!want.length || want.length > 200 || want.some(x => !PID.test(x))) return out({ error: $q.Z, detail: $q.aa }, 400);
const { d } = await openLoad(); const ids = new Set((d.cases || []).map(c => c.id));
const unknown = want.filter(x => !ids.has(x)); if (unknown.length) return out({ error: $q.Z, unknown: unknown.slice(0, 20) }, 404);
let r; try { r = await rpc($q.ab, { p_wkey: KB.WKEY, p_key_hash: await sha(k), p_url: url, p_projects: want }); } catch (e) { return out({ error: 'db' }, 503); }
if (!r || !r.ok) return out({ error: (r && r.error) || 'db', max: r && r.max }, r && /key|revoked/.test(r.error) ? 401 : 400);
const ping = await deliver(env, { id: r.id, url }, await pingEvent(), 1);
return out({ ok: true, webhook: { id: r.id, url: r.url, projects: r.projects, created_at: r.created_at }, ping: { status: ping.status, ok: ping.ok, ms: ping.ms, error: ping.error || null } });
}
async function hookList(req) {
if (!(await ready())) return out({ error: $q.A }, 503);
const k = keyOf(req); if (!k) return out({ error: $q.X }, 401);
let r; try { r = await rpc($q.ac, { p_wkey: KB.WKEY, p_key_hash: await sha(k) }); } catch (e) { return out({ error: 'db' }, 503); }
return out(r && r.ok ? r : { error: (r && r.error) || 'db' }, r && r.ok ? 200 : 401);
}
async function hookDisable(req) {
if (!(await ready())) return out({ error: $q.A }, 503);
const k = keyOf(req); if (!k) return out({ error: $q.X }, 401);
let b; try { b = await req.json(); } catch (e) { return out({ error: $q.B }, 400); }
const id = +(b && b.id); if (!(id > 0)) return out({ error: 'id' }, 400);
const r = await rpc($q.ad, { p_wkey: KB.WKEY, p_key_hash: await sha(k), p_id: id });
return out(r && r.ok ? { ok: true } : { error: (r && r.error) || $q.p }, r && r.ok ? 200 : 404);
}
async function pingEvent() {
const created = new Date().toISOString();
return { type: 'ping', id: 'evt_' + (await sha($q.ae + created + '\n' + Math.random())).slice(0, 24), created, note: $t.k9 };
}
async function hookPing(req, env, ctx) {
const k = keyOf(req); if (!k) return out({ error: $q.X, how: $q.Y }, 401);
if (await overLimit(req, ctx, 'hping', 10)) return out({ error: 'rate', detail: $q.af }, 429);
let b; try { b = await req.json(); } catch (e) { return out({ error: $q.B }, 400); }
const url = hookUrl(b && b.url); if (!url) return out({ error: 'url', detail: $t.k10 }, 400);
if (!(await keyValid(k))) return out({ error: $q.ag }, 401);
if (await overLimit(req, ctx, $q.ah, 30, 3600, (await sha(k)).slice(0, 24))) return out({ error: 'rate' }, 429);
const r = await deliver(env, { id: 0, url }, await pingEvent(), 1, true);
return out({ ok: r.ok, response: { status: r.status, ms: r.ms, error: r.error || null }, sent: r.sent });
}
async function hookSample(env, ctx, req) {
if (await overLimit(req, ctx, $q.ai, 120)) return out({ error: 'rate' }, 429);
const { d, sha: dsha } = await openLoad();
const c = (d.cases || []).find(x => x.id && x.score != null) || {};
const after = stateOf(c, null), before = JSON.parse(JSON.stringify(after));
before.score = Math.max(0, (after.score || 0) - 1);
const evt = await changeEvent(c, before, after, diffOf(before, after), d, dsha);
evt.sample = true; evt.note = $s.k0;
const s = await signedRequest(env, 0, evt, 1);
if (!s) return out({ error: $q.aj }, 503);
return out({ headers: s.headers, body: s.body, verify: { message: $q.ak, keys: $t.k11 } });
}
async function changeEvent(c, before, after, changes, d, dsha) {
const id = 'evt_' + (await sha($q.al + c.id + '\n' + JSON.stringify(before) + '\n' + JSON.stringify(after))).slice(0, 24);
return { type: $q.am, id, created: new Date().toISOString(),
project: { id: c.id, market: c.market || null, country: c.country || null, page: $q.an + c.id, api: $t.k12 + c.id },
changes, before, after, dataset: { updated: d.updated || null, sha256: dsha || null } };
}
export async function signedRequest(env, hookId, evt, attempt) {
const ts = Math.floor(Date.now() / 1000);
const body = JSON.stringify(Object.assign({}, evt, { webhook_id: hookId, attempt, timestamp: ts }));
const sig = await signBody(env, body); if (!sig) return null;
return { body, headers: { 'content-type': $q.a, 'user-agent': $t.UA, 'x-kolaboro-event': evt.type, 'x-kolaboro-event-id': evt.id,
'x-kolaboro-timestamp': String(ts), 'x-kolaboro-delivery-attempt': String(attempt), 'x-kolaboro-signature': sig, 'x-kolaboro-key-id': (env && env.KB_SIGN_KID) || 'kb' } };
}
export async function deliver(env, hook, evt, attempt, showSent) {
const s = await signedRequest(env, hook.id, evt, attempt);
const base = { hook_id: hook.id, event_id: evt.id, type: evt.type, project_id: evt.project ? evt.project.id : null, attempt };
if (!s) return Object.assign(base, { ok: false, status: null, ms: 0, error: $q.ao });
const ac = new AbortController(), t0 = Date.now(), tm = setTimeout(() => ac.abort(), 10000);
let st = null, err = null;
try { const r = await fetch(hook.url, { method: 'POST', headers: s.headers, body: s.body, redirect: $q.ap, signal: ac.signal }); st = r.status; try { await r.body?.cancel(); } catch (e) {} }
catch (e) { err = ac.signal.aborted ? $q.aq : ($q.ar + String(e && e.message || e)).slice(0, 150); }
clearTimeout(tm);
const ok = st >= 200 && st < 300;
return Object.assign(base, { ok, status: st, ms: Date.now() - t0, error: ok ? null : err || ('http ' + st) }, showSent ? { sent: { url: hook.url, headers: s.headers, body: s.body } } : {});
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function deliverWithRetry(env, hook, evt, startAttempt, log, budget) {
let a = startAttempt, r;
for (let i = 0; i < 3 && budget.n > 0; i++, a++) {
budget.n--; r = await deliver(env, hook, evt, a); log.push(Object.assign({}, r, { payload: r.ok ? null : evt }));
if (r.ok || (r.status >= 400 && r.status < 500 && r.status !== 408 && r.status !== 429)) break;
if (i < 2) await sleep(i ? 6000 : 2000);
}
return r;
}
async function githubOidc(req, workflowFile) {
const m = (req.headers.get($q.as) || '').match(/^Bearer ([\w-]+)\.([\w-]+)\.([\w-]+)$/); if (!m) return null;
const dec = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), c => c.charCodeAt(0)); };
const hd = JSON.parse(td.decode(dec(m[1]))), cl = JSON.parse(td.decode(dec(m[2])));
if (hd.alg !== 'RS256') return null;
const j = await (await fetch($t.k13, { cf: { cacheTtl: 3600 } })).json();
const jwk = (j.keys || []).find(k => k.kid === hd.kid); if (!jwk) return null;
const key = await crypto.subtle.importKey('jwk', { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true }, { name: $q.at, hash: $q.au }, false, [$q.av]);
const ok = await crypto.subtle.verify($q.at, key, dec(m[3]), te.encode(m[1] + '.' + m[2]));
const now = Date.now() / 1000;
if (!ok || cl.iss !== $t.k14 || cl.aud !== $q.aw || cl.repository !== $q.ax || !(cl.exp > now) || String(cl.workflow_ref || '').indexOf($q.ay + workflowFile + '@') < 0) return null;
return cl;
}
async function loadJson(p) { try { const r = await fetch($q.az + p, { cf: { cacheTtl: 300 } }); return r.ok && /json/.test(r.headers.get($q.aA) || '') ? await r.json() : null; } catch (e) { return null; } }
async function hookRun(req, env) {
let cl = null; try { cl = await githubOidc(req, $q.aB); } catch (e) {}
if (!cl) return out({ error: $q.aC }, 401);
return out(await runJob(env, cl.run_id || null));
}
export async function runJob(env, runId) {
if (!(env && env.KB_SIGN_KEY)) return { ok: true, skipped: $q.ao };
let job; try { job = await rpc($q.aD, { p_wkey: KB.WKEY }); } catch (e) { job = null; }
if (!job || !Array.isArray(job.hooks)) return { ok: true, skipped: $q.aE };
const [{ d, sha: dsha }, drift] = await Promise.all([openLoad(), loadJson($q.aF)]);
const by = {}; (d.cases || []).forEach(c => { by[c.id] = c; });
const prev = job.states || {}, watched = new Set(); job.hooks.forEach(h => (h.projects || []).forEach(p => watched.add(p)));
const states = {}, events = {};
for (const id of watched) {
const c = by[id]; if (!c) continue;
const now = stateOf(c, drift); states[id] = now;
if (prev[id]) { const L = diffOf(prev[id], now); if (L.length) events[id] = await changeEvent(c, prev[id], now, L, d, dsha); }
}
const log = [], budget = { n: MAX_DELIVERIES }; let delivered = 0, failed = 0, retried = 0;
const hooks = {}; job.hooks.forEach(h => { hooks[h.id] = h; });
for (const x of job.retries || []) {
const h = hooks[x.hook_id]; if (!h || !x.payload || budget.n <= 0) continue;
budget.n--; retried++; const r = await deliver(env, h, x.payload, (x.attempt || 1) + 1);
log.push(Object.assign({}, r, { payload: r.ok ? null : x.payload })); if (r.ok) delivered++; else failed++;
}
for (const h of job.hooks) for (const p of h.projects || []) {
if (!events[p]) continue;
if (budget.n <= 0) { log.push({ hook_id: h.id, event_id: events[p].id, type: events[p].type, project_id: p, attempt: 1, ok: false, status: null, ms: 0, error: $t.k15, payload: events[p] }); failed++; continue; }
const r = await deliverWithRetry(env, h, events[p], 1, log, budget); if (r && r.ok) delivered++; else failed++;
}
let saved = null; try { saved = await rpc($q.aG, { p_wkey: KB.WKEY, p_states: states, p_log: log }); } catch (e) {}
return { ok: true, hooks: job.hooks.length, watched: watched.size, changed: Object.keys(events).length, attempts: log.length, delivered, failed, retried_from_earlier: retried, logged: saved && saved.logged, dataset: d.updated || null, run: runId };
}
