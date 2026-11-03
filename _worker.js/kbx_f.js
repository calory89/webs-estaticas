// Feature module f for kolaboro.com (see kbx.js): reliability.
//   POST /api/x/f/vitals   real-user web vitals beacon (LCP, INP, CLS, TTFB), from /k/vitals.js
//   GET  /api/x/f/vitals   p75 per day and page type (state "setup" until the table in m10/f.sql exists)
//   POST /api/x/f/chaos    weekly chaos drill of the desk review, callable only by .github/workflows/kolaboro-chaos.yml (GitHub OIDC)
import * as K from './kolaboro.js';
const { json, rpc, deskReview } = K;

export const PATHS = /^\/api\/x\/f\//;

export async function handle(req, u, env, ctx) {
  const p = u.pathname;
  if (p === '/api/x/f/vitals' && req.method === 'POST') return vitalsPut(req, env, ctx);
  if (p === '/api/x/f/vitals' && req.method === 'GET') return vitalsGet(ctx);
  if (p === '/api/x/f/chaos' && req.method === 'POST') return chaos(req, env, ctx);
  return json({ error: 'not_found' }, 404);
}

// ---------- 16. Real-user web vitals ----------
const PAGES = new Set(['home', 'project', 'database', 'cases', 'check', 'tools', 'verify', 'status', 'docs', 'content', 'other']);
const LIM = { LCP: 60000, INP: 30000, CLS: 10, TTFB: 60000 };
// the worker identifies itself to the database with the same key kolaboro.js uses; until kolaboro.js exports it, beacons are dropped
const wkey = () => K.WKEY || null;
const nothing = () => new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });

async function vitalsPut(req, env, ctx) {
  const ua = req.headers.get('user-agent') || '';
  if (/bot|crawl|spider|headless|lighthouse|pagespeed|playwright|kolaboro-/i.test(ua)) return nothing();   // our own journeys and audits are not real users
  let b; try { b = JSON.parse((await req.text()).slice(0, 2000)); } catch (e) { return nothing(); }
  if (!b || typeof b !== 'object' || !PAGES.has(b.p) || (b.n && b.n !== 'navigate' && b.n !== 'reload')) return nothing();
  const device = b.d === 'm' ? 'mobile' : 'desktop', items = [];
  for (const m of Object.keys(LIM)) { const v = b.v && b.v[m]; if (typeof v === 'number' && isFinite(v) && v >= 0 && v <= LIM[m]) items.push({ page: b.p, device, metric: m, value: m === 'CLS' ? Math.round(v * 1e4) / 1e4 : Math.round(v) }); }
  if (!items.length) return nothing();
  const key = wkey(); if (!key) return nothing();   // accepted and dropped: collection starts after setup
  const ip = req.headers.get('cf-connecting-ip') || 'x', hour = new Date().toISOString().slice(0, 13);
  const rk = new Request('https://kolaboro.com/__vit_rl/' + encodeURIComponent(ip) + '/' + hour), hit = await caches.default.match(rk), n = hit ? (+(await hit.text()) || 0) : 0;
  if (n >= 40) return nothing();
  ctx.waitUntil(caches.default.put(rk, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=3600' } })));
  ctx.waitUntil(rpc('kolaboro_vitals_put', { p_wkey: key, p_items: items }).catch(() => {}));
  return nothing();
}

async function vitalsGet(ctx) {
  const ck = new Request('https://kolaboro.com/__kbxf_vitals_v1');
  const hit = await caches.default.match(ck); if (hit) return new Response(hit.body, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300' } });
  let out;
  try {
    const d = await rpc('kolaboro_vitals_public', {});
    out = Object.assign({ state: wkey() ? 'collecting' : 'setup', note: wkey() ? null : 'The worker is not yet allowed to write samples.' }, d || {});
  } catch (e) { out = { state: 'setup', note: 'Collecting starts after setup: the storage table is not created yet.' }; }
  out.thresholds = { LCP: [2500, 4000], INP: [200, 500], CLS: [0.1, 0.25], TTFB: [800, 1800] };
  out.method = 'Measured in real visitors\' browsers with PerformanceObserver (no third-party library), 75th percentile per day and page type, bots and our own test browsers excluded. No IP, cookie or user id is stored with a sample.';
  const body = JSON.stringify(out);
  ctx.waitUntil(caches.default.put(ck, new Response(body, { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=300' } })));
  return new Response(body, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300' } });
}

// ---------- 17. Chaos drill: force AI failures inside the desk review and check it degrades the way it should ----------
// Proof of origin: a GitHub OIDC token minted for the chaos workflow of calory89/webs-estaticas (no stored secret).
let JWKS = { t: 0, keys: null };
const b64u = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const r = atob(s), a = new Uint8Array(r.length); for (let i = 0; i < r.length; i++) a[i] = r.charCodeAt(i); return a; };
async function oidc(req, workflowFile) {
  const m = (req.headers.get('authorization') || '').match(/^Bearer ([\w-]+)\.([\w-]+)\.([\w-]+)$/); if (!m) return null;
  const hd = JSON.parse(new TextDecoder().decode(b64u(m[1]))), cl = JSON.parse(new TextDecoder().decode(b64u(m[2])));
  if (hd.alg !== 'RS256') return null;
  if (!JWKS.keys || Date.now() - JWKS.t > 3600e3) { const j = await (await fetch('https://token.actions.githubusercontent.com/.well-known/jwks')).json(); JWKS = { t: Date.now(), keys: j.keys || [] }; }
  const jwk = JWKS.keys.find(k => k.kid === hd.kid); if (!jwk) return null;
  const key = await crypto.subtle.importKey('jwk', { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true }, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64u(m[3]), new TextEncoder().encode(m[1] + '.' + m[2]));
  const now = Date.now() / 1000;
  if (!ok || cl.iss !== 'https://token.actions.githubusercontent.com' || cl.aud !== 'kolaboro.com' || cl.repository !== 'calory89/webs-estaticas' || !(cl.exp > now) || !(cl.nbf == null || cl.nbf <= now + 60) || String(cl.workflow_ref || '').indexOf('/.github/workflows/' + workflowFile + '@') < 0) return null;
  return cl;
}

// Fault injection. A fetch wrapper that only ever touches Anthropic requests whose body carries an active drill token
// (a random string planted in the drill's own fixture page). Every other request in the isolate passes straight through.
const FAULTS = new Map();   // token -> { haiku: 'down' | null, sonnet: 'down' | null }
function installFaults() {
  if (globalThis.fetch.__kbxf) return;
  const real = globalThis.fetch;
  const wrapped = async function (input, init) {
    if (FAULTS.size && String(input && input.url || input).startsWith('https://api.anthropic.com/') && init && typeof init.body === 'string') {
      for (const [tok, f] of FAULTS) {
        if (!init.body.includes(tok)) continue;
        const model = (init.body.match(/"model":"([^"]+)"/) || [])[1] || '';
        const mode = /sonnet/.test(model) ? f.sonnet : f.haiku;
        if (mode === 'down') { f.hits = (f.hits || 0) + 1; return new Response(JSON.stringify({ type: 'error', error: { type: 'overloaded_error', message: 'chaos drill: forced failure' } }), { status: 529, headers: { 'content-type': 'application/json' } }); }
      }
    }
    return real(input, init);
  };
  wrapped.__kbxf = true;
  globalThis.fetch = wrapped;
}

const SCEN = {
  primary_model_down: { fixture: 'e1-bali-leasehold', faults: { haiku: 'down' }, expect: 'The second AI reader answers alone: a report comes back, marked single reader (no consensus block), title type still read as leasehold.',
    check: (r) => !!(r && r.report && !r.report.consensus && String(r.report.title_type).toLowerCase() === 'leasehold') },
  primary_model_down_injection: { fixture: 'i2-hidden-div', faults: { haiku: 'down' }, expect: 'With only the second reader, hidden instructions aimed at AI reviewers are still caught: ai_manipulation detected, attention high.',
    check: (r) => !!(r && r.report && r.report.ai_manipulation && r.report.ai_manipulation.detected && r.report.attention === 'high') },
  second_model_down: { fixture: 'e1-bali-leasehold', faults: { sonnet: 'down' }, expect: 'The primary reader answers alone: a report comes back without a consensus block, title type leasehold.',
    check: (r) => !!(r && r.report && !r.report.consensus && String(r.report.title_type).toLowerCase() === 'leasehold') },
  both_models_down: { fixture: 'e1-bali-leasehold', faults: { haiku: 'down', sonnet: 'down' }, expect: 'No report is invented: the desk review raises a clean error, which the public endpoint turns into HTTP 503 {"error":"model"}.',
    check: (r, err) => !r && !!err },
};

async function chaos(req, env, ctx) {
  let cl = null; try { cl = await oidc(req, 'kolaboro-chaos.yml'); } catch (e) {}
  if (!cl) return json({ error: 'unauthorized' }, 401);
  let b; try { b = await req.json(); } catch (e) { return json({ error: 'bad_request' }, 400); }
  const s = SCEN[b && b.scenario]; if (!s) return json({ error: 'unknown_scenario', scenarios: Object.keys(SCEN) }, 400);
  // at most 8 drill calls an hour in this location, whatever happens upstream
  const hk = new Request('https://kolaboro.com/__kbxf_chaos/' + new Date().toISOString().slice(0, 13)), h = await caches.default.match(hk), n = h ? (+(await h.text()) || 0) : 0;
  if (n >= 8) return json({ error: 'rate' }, 429);
  ctx.waitUntil(caches.default.put(hk, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=3600' } })));
  if (!env.ANTHROPIC_API_KEY) return json({ scenario: b.scenario, skipped: 'models not configured' });
  const fx = await env.ASSETS.fetch(new Request('https://kolaboro.com/_s/kolaboro.com/open/evals/fixtures/' + s.fixture + '.html'));
  if (!fx.ok) return json({ error: 'fixture' }, 500);
  const tok = 'kbxf-' + [...crypto.getRandomValues(new Uint8Array(8))].map(x => x.toString(16).padStart(2, '0')).join('');
  const html = (await fx.text()).replace(/<\/body>/i, '<p>Drill reference ' + tok + '.</p></body>');
  installFaults();
  const f = Object.assign({ haiku: null, sonnet: null, hits: 0 }, s.faults); FAULTS.set(tok, f);
  const t0 = Date.now(); let r = null, err = null;
  try { r = await deskReview(env, 'https://fixtures.kolaboro.example/' + s.fixture, html); }
  catch (e) { err = String(e && e.message || e).replace(/sk-[\w-]+/g, '').slice(0, 160); if (e && e.budget) { FAULTS.delete(tok); return json({ scenario: b.scenario, skipped: 'daily AI budget reached' }); } }
  finally { FAULTS.delete(tok); }
  const ms = Date.now() - t0, rep = r && r.report;
  const observed = rep ? { report: true, consensus_block: !!rep.consensus, title_type: rep.title_type || null, attention: rep.attention || null, ai_manipulation: !!(rep.ai_manipulation && rep.ai_manipulation.detected) } : { report: false, error: err };
  return json({ scenario: b.scenario, fixture: s.fixture, forced: Object.keys(s.faults).map(k => k + ' ' + s.faults[k]).join(', '), forced_failures_served: f.hits, expected: s.expect, observed, pass: s.check(r, err), ms, run: cl.run_id });
}
