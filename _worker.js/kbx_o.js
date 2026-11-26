// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_o__q, $s = TB.kbx_o__s, $t = TB.kbx_o__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import * as K from './kolaboro.js';
import { TB } from './kbx_strings.js';
const { json, rpc, sha, deskReview, pageParts, qnorm, quoteFound, signBody, logHeads, PUB_RAW_B64 } = K;
export const PATHS = /^\/api\/x\/o\//;
const te = new TextEncoder();
export async function handle(req, u, env, ctx) {
const p = u.pathname;
try {
if (p === $q.a && req.method === 'POST') return await witnessPost(req, env, ctx);
if (p === $q.b && req.method === 'GET') return await witnessList(ctx);
if (p === $q.c && req.method === 'GET') return await cosignedCheckpoint(env);
if (p === $q.d && req.method === 'POST') return await benchCase(req, env, ctx);
if (p === $q.e && req.method === 'GET') return await slo(ctx);
} catch (e) { return json({ error: $q.f, detail: String(e && e.message || e).replace(/sk-[\w-]+/g, '').slice(0, 160) }, 500); }
return json({ error: $q.g }, 404);
}
const b64e = u8 => { let s = ''; for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s); };
const b64d = s => { const r = atob(s), a = new Uint8Array(r.length); for (let i = 0; i < r.length; i++) a[i] = r.charCodeAt(i); return a; };
const h256 = async b => new Uint8Array(await crypto.subtle.digest($q.h, b));
const cat = (...xs) => { const o = new Uint8Array(xs.reduce((a, x) => a + x.length, 0)); let i = 0; for (const x of xs) { o.set(x, i); i += x.length; } return o; };
const eqb = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const pub = (o, s) => new Response(JSON.stringify(o, null, 1), { status: s || 200, headers: { 'content-type': $q.i, 'cache-control': $q.j, 'access-control-allow-origin': '*' } });
async function edVerify(pubRaw, sig, msg) {
for (const alg of [{ name: $q.k }, { name: $q.l, namedCurve: $q.l }]) {
try { const k = await crypto.subtle.importKey('raw', pubRaw, alg, false, [$q.m]); return await crypto.subtle.verify(alg, k, sig, msg); } catch (e) {}
}
return false;
}
async function limited(key, max) {
const k = new Request($q.n + key + '/' + new Date().toISOString().slice(0, 13)), h = await caches.default.match(k), n = h ? (+(await h.text()) || 0) : 0;
if (n >= max) return true;
await caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': $q.o } }));
return false;
}
async function treeRoot(lines) {
const leaves = []; for (const l of lines) leaves.push(await h256(cat(new Uint8Array([0]), te.encode(l))));
const mth = async L => { if (!L.length) return h256(new Uint8Array(0)); if (L.length === 1) return L[0]; let k = 1; while (k * 2 < L.length) k *= 2; return h256(cat(new Uint8Array([1]), await mth(L.slice(0, k)), await mth(L.slice(k)))); };
return mth(leaves);
}
let JWKS = { t: 0, keys: null };
const b64u = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return b64d(s); };
async function oidc(req, workflowFile) {
const m = (req.headers.get($q.p) || '').match(/^Bearer ([\w-]+)\.([\w-]+)\.([\w-]+)$/); if (!m) return null;
const hd = JSON.parse(new TextDecoder().decode(b64u(m[1]))), cl = JSON.parse(new TextDecoder().decode(b64u(m[2])));
if (hd.alg !== 'RS256') return null;
if (!JWKS.keys || Date.now() - JWKS.t > 3600e3) { const j = await (await fetch($t.k0)).json(); JWKS = { t: Date.now(), keys: j.keys || [] }; }
const jwk = JWKS.keys.find(k => k.kid === hd.kid); if (!jwk) return null;
const key = await crypto.subtle.importKey('jwk', { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true }, { name: $q.q, hash: $q.h }, false, [$q.m]);
const ok = await crypto.subtle.verify($q.q, key, b64u(m[3]), te.encode(m[1] + '.' + m[2]));
const now = Date.now() / 1000;
if (!ok || cl.iss !== $t.k1 || cl.aud !== $q.r || cl.repository !== $q.s || !(cl.exp > now) || !(cl.nbf == null || cl.nbf <= now + 60) || String(cl.workflow_ref || '').indexOf($q.t + workflowFile + '@') < 0) return null;
return cl;
}
async function witnessPost(req, env, ctx) {
const ip = req.headers.get($q.u) || 'x';
if (await limited('w/' + encodeURIComponent(ip), 20)) return json({ accepted: false, error: 'rate', note: $t.k2 }, 429);
let b; try { const t = await req.text(); if (t.length > 6000) throw 0; b = JSON.parse(t); } catch (e) { return json({ accepted: false, error: $q.v, need: $t.k3 }, 400); }
const body = String(b.checkpoint || ''), line = String(b.cosignature || ''), pk = String(b.public_key || ''), contact = b.contact ? String(b.contact).slice(0, 200) : null;
const cm = body.match(/^kolaboro\.com\/log\n(\d{1,9})\n([A-Za-z0-9+/]{43}=)\n((?:[^\n\u0000-\u001f]{1,200}\n){0,4})$/);
if (!cm) return json({ accepted: false, error: $q.w, why: $s.k0 }, 400);
const lm = line.match(/^— ([!-~]{3,120}) ([A-Za-z0-9+/]{102}==)$/);
if (!lm || lm[1].includes('+')) return json({ accepted: false, error: $q.x, why: $s.k1 }, 400);
if (contact && !/^https:\/\/[^\s<>"']{4,190}$/.test(contact)) return json({ accepted: false, error: $q.y, why: $t.k4 }, 400);
let pubRaw, blob; try { pubRaw = b64d(pk); blob = b64d(lm[2]); } catch (e) { return json({ accepted: false, error: $q.z }, 400); }
if (pubRaw.length !== 32 || blob.length !== 76) return json({ accepted: false, error: $q.A, why: $t.k5 }, 400);
const name = lm[1], size = +cm[1], rootB64 = cm[2];
const checks = {};
checks.key_hash = eqb(blob.slice(0, 4), (await h256(cat(te.encode(name + '\n'), new Uint8Array([4]), pubRaw))).slice(0, 4));
let ts = 0; for (let i = 4; i < 12; i++) ts = ts * 256 + blob[i];
const now = Math.floor(Date.now() / 1000);
checks.timestamp = ts >= now - 48 * 3600 && ts <= now + 600;
checks.signature = await edVerify(pubRaw, blob.slice(12), te.encode($q.B + ts + '\n' + body));
let heads = null; try { heads = await logHeads(); } catch (e) {}
if (!heads) return json({ accepted: false, error: $q.C }, 503);
checks.tree_size_known = size >= 1 && size <= heads.length;
checks.root_matches_our_tree = checks.tree_size_known && b64e(await treeRoot(heads.slice(0, size).map(h => h.day + ' ' + h.head))) === rootB64;
const failed = Object.keys(checks).filter(k => !checks[k]);
if (failed.length) return json({ accepted: false, error: $q.D, failed, checks, note: checks.timestamp ? undefined : $t.k6 }, 422);
let ours = false;
if (name.startsWith($q.E)) {
let cl = null; try { cl = await oidc(req, $q.F); } catch (e) {}
if (!cl) return json({ accepted: false, error: $q.G, why: $s.k2 }, 403);
ours = true;
}
let r;
try { r = await rpc($q.H, { p_wkey: K.WKEY, p_name: name, p_pub: pk, p_contact: contact, p_ours: ours, p_time: ts, p_size: size, p_root: rootB64, p_line: line }); }
catch (e) { return json({ accepted: false, state: $q.I, verified: true, checks, message: $s.OPENS_SOON }, 503); }
if (!r || r.ok !== true) return json({ accepted: false, verified: true, checks, error: (r && r.error) || $q.J, why: r && r.why }, 409);
return json({ accepted: true, verified: true, checks, witness: name, tree_size: size, cosignatures: r.cosignatures });
}
async function witnessData() {
try { const d = await rpc($q.K, {}); if (d && Array.isArray(d.witnesses)) return Object.assign({ state: 'open' }, d); } catch (e) {}
return { state: 'setup', witnesses: [], note: $s.k3 };
}
async function witnessList(ctx) {
const d = await witnessData();
d.external = d.witnesses.filter(w => !w.ours).length; d.ours = d.witnesses.filter(w => w.ours).length;
return pub(d);
}
async function cosignedCheckpoint(env) {
const r = await fetch($t.k7, { cf: { cacheTtl: 60 } });
if (!r.ok) return pub({ error: $q.L }, 503);
let note = await r.text();
const i = note.indexOf('\n\n'), lines = note.slice(0, i + 1).split('\n'), size = +lines[1], root = lines[2];
const d = await witnessData();
const add = d.witnesses.filter(w => w.last_size === size && w.last_root === root && /^— /.test(w.last_line || '')).map(w => w.last_line);
if (add.length) note = note.replace(/\n*$/, '\n') + add.join('\n') + '\n';
return new Response(note, { headers: { 'content-type': $q.M, 'cache-control': $q.j, 'access-control-allow-origin': '*', 'x-kolaboro-cosignatures': String(add.length) } });
}
const BENCH = new Map();
const MODEL_ID = { haiku: 'claude-haiku-5-5', sonnet: 'claude-sonnet-5-5' };
function installBench() {
if (globalThis.fetch.__kbxo) return;
const real = globalThis.fetch;
const wrapped = async function (input, init) {
if (BENCH.size && init && typeof init.body === $q.N && String(input && input.url || input).startsWith($q.O)) {
for (const [tok, run] of BENCH) {
if (!init.body.includes(tok)) continue;
const model = (init.body.match(/"model":"([^"]+)"/) || [])[1] || '';
if (model !== run.allow) { run.refused++; return new Response(JSON.stringify({ type: 'error', error: { type: $q.P, message: $q.Q + run.allow + $q.R } }), { status: 529, headers: { 'content-type': $q.S } }); }
const r = await real(input, init);
try { const d = await r.clone().json(); run.answered.push(d.model || model); run.usage.in += (d.usage && d.usage.input_tokens) || 0; run.usage.out += (d.usage && d.usage.output_tokens) || 0; } catch (e) {}
return r;
}
}
return real(input, init);
};
wrapped.__kbxo = true;
globalThis.fetch = wrapped;
}
function evGet(o, path) { return String(path || '').split('.').reduce((a, k) => (a == null ? a : a[k]), o); }
function evCheck(o, c) {
const v = evGet(o, c.field), str = v == null ? '' : typeof v === $q.N ? v : JSON.stringify(v);
let ok;
if (c.op === 'eq') ok = v === c.value || (typeof v === $q.N && typeof c.value === $q.N && v.toLowerCase() === c.value.toLowerCase());
else if (c.op === 'in') ok = c.value.includes(v);
else if (c.op === $q.T) ok = str.toLowerCase().includes(String(c.value).toLowerCase());
else if (c.op === $q.U) ok = new RegExp(c.value, 'i').test(str);
else if (c.op === $q.V) ok = !new RegExp(c.value, 'i').test(str);
else if (c.op === 'falsy') ok = !v || (Array.isArray(v) && !v.length);
else if (c.op === $q.W) ok = !!v;
else if (c.op === 'gte') ok = typeof v === $q.X && v >= c.value;
else if (c.op === $q.Y) {
const src = qnorm(o.__page || ''), q = []; const ci = o.citations || {};
(ci.promises || []).forEach(x => q.push(x.quote)); (ci.summary || []).forEach(x => q.push(x)); Object.values(ci.fields || {}).forEach(x => q.push(x));
const bad = q.filter(x => !quoteFound(src, x, 4));
ok = q.length >= (c.value || 0) && !bad.length;
return { field: $q.Z, op: c.op, expected: $q.aa + (c.value || 0) + $q.ab, got: { quotes: q.length, not_found: bad.slice(0, 3) }, ok };
}
else ok = false;
return { field: c.field, op: c.op, expected: c.value === undefined ? null : c.value, got: v === undefined ? null : (typeof v === $q.N ? v.slice(0, 300) : v), ok };
}
async function asset(env, p) { const r = await env.ASSETS.fetch(new Request($q.ac + p)); if (!r.ok) throw new Error($q.ad + p + ' ' + r.status); return r.text(); }
async function benchCase(req, env, ctx) {
let cl = null; try { cl = await oidc(req, $q.ae); } catch (e) {}
if (!cl) return json({ error: $q.af, why: $t.k8 }, 401);
let b; try { b = await req.json(); } catch (e) { return json({ error: $q.v }, 400); }
const allow = MODEL_ID[b && b.model]; if (!allow) return json({ error: 'model', models: Object.keys(MODEL_ID) }, 400);
if (await limited('bench', 60)) return json({ error: 'rate' }, 429);
if (!env.ANTHROPIC_API_KEY) return json({ error: $q.ag }, 503);
const specTxt = await asset(env, $q.ah), spec = JSON.parse(specTxt);
const c = spec.cases.find(x => x.id === b.case); if (!c) return json({ error: 'case', cases: spec.cases.map(x => x.id) }, 400);
const html = await asset(env, $q.ai + c.id + '.html');
const tok = 'kbxo-' + [...crypto.getRandomValues(new Uint8Array(8))].map(x => x.toString(16).padStart(2, '0')).join('');
installBench();
const run = { allow, answered: [], usage: { in: 0, out: 0 }, refused: 0 }; BENCH.set(tok, run);
const t0 = Date.now(); let o = {}, err = null;
try {
const dr = await deskReview(env, $q.aj + c.id + '#' + tok, html);
if (dr && dr.error) err = $q.ak + dr.error;
o = Object.assign({}, (dr && dr.report) || {}, { not_property: !!(dr && dr.not_property), __page: pageParts(html).visible.slice(0, 14000) });
} catch (e) { err = String(e && e.message || e).replace(/sk-[\w-]+/g, '').slice(0, 160); }
finally { BENCH.delete(tok); }
const checks = c.checks.map(k => { try { return evCheck(o, k); } catch (e) { return { field: k.field || null, op: k.op, expected: k.value === undefined ? null : k.value, got: $q.al, ok: false }; } });
const usd = run.usage.in * (/sonnet/.test(allow) ? 3 : 1) / 1e6 + run.usage.out * (/sonnet/.test(allow) ? 15 : 5) / 1e6;
const out = { benchmark: $q.am, case: c.id, kind: c.kind, model_requested: allow, models_answered: [...new Set(run.answered)], calls_answered: run.answered.length, other_model_calls_refused: run.refused,
pass: !err && run.answered.length > 0 && checks.every(k => k.ok), error: err, checks, checks_passed: checks.filter(k => k.ok).length, checks_total: checks.length,
quote_check: o.quote_check ? { checked: o.quote_check.checked, removed: o.quote_check.removed } : null, single_reader: !o.consensus,
tokens: run.usage, usd_estimated: Math.round(usd * 1e5) / 1e5, ms: Date.now() - t0,
cases_sha256: await sha(specTxt), fixture_sha256: await sha(html), code_commit: (env && env.CF_PAGES_COMMIT_SHA) || null, run_at: new Date().toISOString(), github_run: String(cl.run_id || '') };
const text = JSON.stringify(out);
return json({ body: text, signature: await signBody(env, text), key_id: (env && env.KB_SIGN_KID) || null });
}
const PROBES_PER_DAY = 312;
async function slo(ctx) {
const ck = new Request($q.an), hit = await caches.default.match(ck);
if (hit) return new Response(hit.body, { headers: { 'content-type': $q.i, 'cache-control': $q.j, 'access-control-allow-origin': '*', 'x-cache': 'hit' } });
const [up, vit, desk] = await Promise.all([rpc($q.ao, {}).catch(() => null), rpc($q.ap, {}).catch(() => null), rpc($q.aq, {}).catch(() => null)]);
const now = new Date(), month = now.toISOString().slice(0, 7), dim = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
const elapsed = (now - Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)) / 864e5;
const res = { computed_at: now.toISOString(), window: { month, days_in_month: dim, days_elapsed: Math.round(elapsed * 100) / 100 }, slos: [] };
const A = { id: $q.ar, objective: $s.k4, target: 0.999, source: $q.as };
const days = up && Array.isArray(up.daily) ? up.daily.filter(d => String(d.day).slice(0, 7) === month) : null;
if (!days) Object.assign(A, { state: $q.at, note: $t.k9 });
else {
const probes = days.reduce((a, d) => a + (+d.probes || 0), 0), ok = days.reduce((a, d) => a + (+d.up || 0), 0), failed = probes - ok;
const budget = PROBES_PER_DAY * dim * (1 - A.target);
Object.assign(A, { state: probes ? $q.au : $q.av, probes, failed, measured: probes ? ok / probes : null, first_day: days.length ? days.map(d => d.day).sort()[0] : null,
budget_failed_probes_month: Math.round(budget * 100) / 100, budget_minutes_month: Math.round(dim * 1440 * (1 - A.target) * 10) / 10,
budget_spent_pct: Math.round(failed / budget * 1000) / 10, budget_remaining_pct: Math.round((1 - failed / budget) * 1000) / 10,
met: probes ? ok / probes >= A.target : null,
note: $s.k5 + (up.since ? String(up.since).slice(0, 10) : $q.aw) + $q.ax });
}
res.slos.push(A);
const D = { id: $q.ay, objective: $t.k10, target: 0.95, source: $t.k11 };
const dd = desk && Array.isArray(desk.days) && !(desk.note && !desk.days.length) ? desk.days.filter(d => String(d.day).slice(0, 7) === month) : null;
if (!dd) Object.assign(D, { state: 'setup', note: $s.k6 });
else {
const total = dd.reduce((a, d) => a + (+d.total || 0), 0), ok = dd.reduce((a, d) => a + (+d.ok || 0), 0), failed = total - ok, budget = total * (1 - D.target);
Object.assign(D, { state: total ? $q.au : $q.av, requests: total, failed, measured: total ? ok / total : null, budget_failed_requests: Math.round(budget * 100) / 100,
budget_spent_pct: budget ? Math.round(failed / budget * 1000) / 10 : null, budget_remaining_pct: budget ? Math.round((1 - failed / budget) * 1000) / 10 : null, met: total ? ok / total >= D.target : null,
note: $s.k7 + (total < 100 ? $t.k12 : '') });
}
res.slos.push(D);
const L = { id: $q.az, objective: $s.k8, target_ms: 2500, min_samples: 50, source: $q.aA };
const all = vit && Array.isArray(vit.overall_28d) ? vit.overall_28d.find(x => x.metric === 'LCP' && (x.page === 'all' || x.page == null)) : null;
if (!vit) Object.assign(L, { state: $q.at, note: $t.k13 });
else if (!all || (+all.n || 0) < L.min_samples) Object.assign(L, { state: $q.av, samples: all ? +all.n : 0, note: $t.k14 });
else Object.assign(L, { state: $q.au, samples: +all.n, p75_ms: Math.round(+all.p75), met: +all.p75 <= 2500, headroom_ms: Math.round(2500 - all.p75) });
res.slos.push(L);
const r = pub(res);
await caches.default.put(ck, new Response(JSON.stringify(res, null, 1), { headers: { 'cache-control': $q.aB } }));
return r;
}
