// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_f__q, $s = TB.kbx_f__s, $t = TB.kbx_f__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import * as K from './kolaboro.js';
import { TB } from './kbx_strings.js';
const { json, rpc, deskReview } = K;
export const PATHS = /^\/api\/x\/f\//;
export async function handle(req, u, env, ctx) {
const p = u.pathname;
if (p === $q.a && req.method === 'POST') return vitalsPut(req, env, ctx);
if (p === $q.a && req.method === 'GET') return vitalsGet(ctx);
if (p === $q.b && req.method === 'POST') return chaos(req, env, ctx);
return json({ error: $q.c }, 404);
}
const PAGES = new Set(['home', 'project', 'database', 'cases', 'check', 'tools', 'verify', 'status', 'docs', 'content', 'other']);
const LIM = { LCP: 60000, INP: 30000, CLS: 10, TTFB: 60000 };
const wkey = () => K.WKEY || null;
const nothing = () => new Response(null, { status: 204, headers: { 'cache-control': $q.d } });
async function vitalsPut(req, env, ctx) {
const ua = req.headers.get($q.e) || '';
if (/bot|crawl|spider|headless|lighthouse|pagespeed|playwright|kolaboro-/i.test(ua)) return nothing();
let b; try { b = JSON.parse((await req.text()).slice(0, 2000)); } catch (e) { return nothing(); }
if (!b || typeof b !== $q.f || !PAGES.has(b.p) || (b.n && b.n !== $q.g && b.n !== $q.h)) return nothing();
const device = b.d === 'm' ? $q.i : $q.j, items = [];
for (const m of Object.keys(LIM)) { const v = b.v && b.v[m]; if (typeof v === $q.k && isFinite(v) && v >= 0 && v <= LIM[m]) items.push({ page: b.p, device, metric: m, value: m === 'CLS' ? Math.round(v * 1e4) / 1e4 : Math.round(v) }); }
if (!items.length) return nothing();
const key = wkey(); if (!key) return nothing();
const ip = req.headers.get($q.l) || 'x', hour = new Date().toISOString().slice(0, 13);
const rk = new Request($q.m + encodeURIComponent(ip) + '/' + hour), hit = await caches.default.match(rk), n = hit ? (+(await hit.text()) || 0) : 0;
if (n >= 40) return nothing();
ctx.waitUntil(caches.default.put(rk, new Response(String(n + 1), { headers: { 'cache-control': $q.n } })));
ctx.waitUntil(rpc($q.o, { p_wkey: key, p_items: items }).catch(() => {}));
return nothing();
}
async function vitalsGet(ctx) {
const ck = new Request($q.p);
const hit = await caches.default.match(ck); if (hit) return new Response(hit.body, { headers: { 'content-type': $q.q, 'cache-control': $q.r } });
let out;
try {
const d = await rpc($q.s, {});
out = Object.assign({ state: wkey() ? $q.t : 'setup', note: wkey() ? null : $t.k0 }, d || {});
} catch (e) { out = { state: 'setup', note: $t.k1 }; }
out.thresholds = { LCP: [2500, 4000], INP: [200, 500], CLS: [0.1, 0.25], TTFB: [800, 1800] };
out.method = $s.k0;
const body = JSON.stringify(out);
ctx.waitUntil(caches.default.put(ck, new Response(body, { headers: { 'content-type': $q.u, 'cache-control': $q.v } })));
return new Response(body, { headers: { 'content-type': $q.q, 'cache-control': $q.r } });
}
let JWKS = { t: 0, keys: null };
const b64u = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const r = atob(s), a = new Uint8Array(r.length); for (let i = 0; i < r.length; i++) a[i] = r.charCodeAt(i); return a; };
async function oidc(req, workflowFile) {
const m = (req.headers.get($q.w) || '').match(/^Bearer ([\w-]+)\.([\w-]+)\.([\w-]+)$/); if (!m) return null;
const hd = JSON.parse(new TextDecoder().decode(b64u(m[1]))), cl = JSON.parse(new TextDecoder().decode(b64u(m[2])));
if (hd.alg !== 'RS256') return null;
if (!JWKS.keys || Date.now() - JWKS.t > 3600e3) { const j = await (await fetch($t.k2)).json(); JWKS = { t: Date.now(), keys: j.keys || [] }; }
const jwk = JWKS.keys.find(k => k.kid === hd.kid); if (!jwk) return null;
const key = await crypto.subtle.importKey('jwk', { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true }, { name: $q.x, hash: $q.y }, false, [$q.z]);
const ok = await crypto.subtle.verify($q.x, key, b64u(m[3]), new TextEncoder().encode(m[1] + '.' + m[2]));
const now = Date.now() / 1000;
if (!ok || cl.iss !== $t.k3 || cl.aud !== $q.A || cl.repository !== $q.B || !(cl.exp > now) || !(cl.nbf == null || cl.nbf <= now + 60) || String(cl.workflow_ref || '').indexOf($q.C + workflowFile + '@') < 0) return null;
return cl;
}
const FAULTS = new Map();
function installFaults() {
if (globalThis.fetch.__kbxf) return;
const real = globalThis.fetch;
const wrapped = async function (input, init) {
if (FAULTS.size && String(input && input.url || input).startsWith($q.D) && init && typeof init.body === $q.E) {
for (const [tok, f] of FAULTS) {
if (!init.body.includes(tok)) continue;
const model = (init.body.match(/"model":"([^"]+)"/) || [])[1] || '';
const mode = /sonnet/.test(model) ? f.sonnet : f.haiku;
if (mode === 'slow') { f.hits = (f.hits || 0) + 1; const sig = init.signal; return new Promise((_, rej) => { const t = setTimeout(() => rej(new Error($t.k4)), 150000); if (sig) sig.addEventListener('abort', () => { clearTimeout(t); rej(sig.reason || new DOMException($q.F, $q.G)); }, { once: true }); }); }
if (mode === 'down') { f.hits = (f.hits || 0) + 1; return new Response(JSON.stringify({ type: 'error', error: { type: $q.H, message: $q.I } }), { status: 529, headers: { 'content-type': $q.u } }); }
}
}
return real(input, init);
};
wrapped.__kbxf = true;
globalThis.fetch = wrapped;
}
const SCEN = {
primary_model_down: { fixture: 'e1-bali-leasehold', faults: { haiku: 'down' }, expect: 'The second reader answers alone: a report comes back, marked single reader (no consensus block), title type still read as leasehold.',
check: (r) => !!(r && r.report && !r.report.consensus && String(r.report.title_type).toLowerCase() === $q.J) },
primary_model_down_injection: { fixture: 'i2-hidden-div', faults: { haiku: 'down' }, expect: 'With only the second reader, hidden instructions aimed at automated reviewers are still caught: ai_manipulation detected, attention high.',
check: (r) => !!(r && r.report && r.report.ai_manipulation && r.report.ai_manipulation.detected && r.report.attention === 'high') },
second_model_down: { fixture: 'e1-bali-leasehold', faults: { sonnet: 'down' }, expect: 'The primary reader answers alone: a report comes back without a consensus block, title type leasehold.',
check: (r) => !!(r && r.report && !r.report.consensus && String(r.report.title_type).toLowerCase() === $q.J) },
primary_model_slow: { fixture: 'e1-bali-leasehold', faults: { haiku: 'slow' }, expect: 'The primary reader never answers: its call is cut at the 60 s deadline and the second reader answers alone, single reader (no consensus block), title type leasehold.',
check: (r) => !!(r && r.report && !r.report.consensus && String(r.report.title_type).toLowerCase() === $q.J) },
both_models_down: { fixture: 'e1-bali-leasehold', faults: { haiku: 'down', sonnet: 'down' }, expect: 'No report is invented: the desk review raises a clean error, which the public endpoint turns into HTTP 503 {"error":"model"}.',
check: (r, err) => !r && !!err },
};
async function chaos(req, env, ctx) {
let cl = null; try { cl = await oidc(req, $q.K); } catch (e) {}
if (!cl) return json({ error: $q.L }, 401);
let b; try { b = await req.json(); } catch (e) { return json({ error: $q.M }, 400); }
const s = SCEN[b && b.scenario]; if (!s) return json({ error: $q.N, scenarios: Object.keys(SCEN) }, 400);
const hk = new Request($q.O + new Date().toISOString().slice(0, 13)), h = await caches.default.match(hk), n = h ? (+(await h.text()) || 0) : 0;
if (n >= 8) return json({ error: 'rate' }, 429);
ctx.waitUntil(caches.default.put(hk, new Response(String(n + 1), { headers: { 'cache-control': $q.n } })));
if (!env.ANTHROPIC_API_KEY) return json({ scenario: b.scenario, skipped: $q.P });
const fx = await env.ASSETS.fetch(new Request($t.k5 + s.fixture + '.html'));
if (!fx.ok) return json({ error: $q.Q }, 500);
const tok = 'kbxf-' + [...crypto.getRandomValues(new Uint8Array(8))].map(x => x.toString(16).padStart(2, '0')).join('');
const html = (await fx.text()).replace(/<\/body>/i, $q.R + tok + $q.S);
installFaults();
const f = Object.assign({ haiku: null, sonnet: null, hits: 0 }, s.faults); FAULTS.set(tok, f);
const t0 = Date.now(); let r = null, err = null;
try { r = await deskReview(env, $q.T + s.fixture, html); }
catch (e) { err = String(e && e.message || e).replace(/sk-[\w-]+/g, '').slice(0, 160); if (e && e.budget) { FAULTS.delete(tok); return json({ scenario: b.scenario, skipped: $q.U }); } }
finally { FAULTS.delete(tok); }
const ms = Date.now() - t0, rep = r && r.report;
const observed = rep ? { report: true, consensus_block: !!rep.consensus, title_type: rep.title_type || null, attention: rep.attention || null, ai_manipulation: !!(rep.ai_manipulation && rep.ai_manipulation.detected) } : { report: false, error: err };
return json({ scenario: b.scenario, fixture: s.fixture, forced: Object.keys(s.faults).map(k => k + ' ' + s.faults[k]).join(', '), forced_failures_served: f.hits, expected: s.expect, observed, pass: s.check(r, err), ms, run: cl.run_id });
}
