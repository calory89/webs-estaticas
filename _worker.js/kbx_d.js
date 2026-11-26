const $q = TB.kbx_d__q, $t = TB.kbx_d__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TB } from './kbx_strings.js';
// comments: _notes/kolaboro-worker-comments.txt
export const PATHS = /^\/api\/x\/d\//;
const MEMO = {};
async function load(name) {
const m = MEMO[name];
if (m && Date.now() - m.t < 120000) return m.v;
let v = null;
try {
const r = await fetch($q.a + name, { cf: { cacheTtl: 600, cacheEverything: true } });
if (r.ok && /json/.test(r.headers.get($q.b) || 'json')) v = await r.json();
} catch (e) { v = null; }
MEMO[name] = { t: Date.now(), v };
return v;
}
function out(o, s = 200, maxAge = 300) {
  return new Response(JSON.stringify(o), { status: s, headers: { 'content-type': $q.c, 'cache-control': $q.d + maxAge, 'access-control-allow-origin': '*' } });
}
export async function handle(req, u, env, ctx) {
if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: $q.e }, 405, 0);
const m = u.pathname.match(/^\/api\/x\/d\/project\/([A-Za-z]{2,5}-\d{3,4})\/?$/);
if (!m) return out({ error: $q.f, endpoints: [$q.g] }, 404, 60);
const id = m[1].toUpperCase();
const [age, drift] = await Promise.all([load($q.h), load($q.i)]);
const res = { id };
if (age && age.projects) {
res.website = age.projects[id] || null;
res.website_meta = { updated: age.updated, source: age.source, method: age.method, counts: age.counts };
} else res.website = { status: $q.j, note: $t.k0 };
if (drift && drift.projects) {
res.drift = drift.projects[id] || null;
res.drift_meta = { updated: drift.updated, days: drift.days, first_day: drift.first_day, fields: drift.fields, not_tracked_daily: drift.not_tracked_daily, method: drift.method, counts: drift.counts };
} else res.drift = { status: $q.j, note: $t.k1 };
return out(res);
}
