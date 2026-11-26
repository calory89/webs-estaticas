// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_v__q, $s = TB.kbx_v__s, $t = TB.kbx_v__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TB } from './kbx_strings.js';
export const PATHS = /^\/api\/x\/v(\/|$)/;
const MEMO = {};
async function load(env, path) {
const m = MEMO[path];
if (m && Date.now() - m.t < 120000) return m.v;
let v = null;
try {
let r = null;
if (env && env.ASSETS) {
r = await env.ASSETS.fetch(new Request($q.a + path));
if (!r.ok) r = await env.ASSETS.fetch(new Request($q.b + path));
}
if (!r || !r.ok) r = await fetch($q.b + path, { cf: { cacheTtl: 600, cacheEverything: true } });
if (r.ok && /json/.test(r.headers.get($q.c) || 'json')) v = await r.json();
} catch (e) { v = null; }
MEMO[path] = { t: Date.now(), v };
return v;
}
function out(o, s = 200, maxAge = 300) {
  return new Response(JSON.stringify(o), { status: s, headers: { 'content-type': $q.d, 'cache-control': maxAge ? $q.e + maxAge : $q.f, 'access-control-allow-origin': '*' } });
}
const STARTING = name => ({ status: $q.g, note: $t.k0 + name + $q.h });
export async function handle(req, u, env, ctx) {
if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: $q.i }, 405, 0);
const p = u.pathname.replace(/\/+$/, '');
if (p === $q.j) return out({ endpoints: {
'/api/x/v/on-time?id=BALI-014': $s.k0,
'/api/x/v/delays': $s.k1,
'/api/x/v/delays?market=Bali': $q.k,
'/api/x/v/press': $t.k1 }, licence: $t.LIC });
if (p === $q.l) {
const id = String(u.searchParams.get('id') || '').trim().toUpperCase().slice(0, 20);
if (!/^[A-Z]{1,6} ?-\d{1,4}$/.test(id)) return out({ error: $q.m }, 400, 60);
const d = await load(env, $q.n);
if (!d) return out(STARTING($q.o), 200, 60);
const x = d.projects && d.projects[id];
if (!x) return out({ id, error: $q.p }, 404, 300);
const g = x.g ? d.groups[x.g] : null;
const enough = !!(g && g.level !== 'all');
let answer;
if (x.s !== 'open') answer = (d.rules.status || {})[x.s] || x.s;
else if (enough) answer = g.p + '% of ' + g.n + $q.q + g.name + $q.r + d.rules.window_months + $t.k2 + g.lo + '% to ' + g.hi + '%).';
else answer = $q.s;
return out({ id, market: x.m, as_of_month: d.as_of_month, question: d.question, status: x.s, answer,
estimate: x.s === 'open' ? (enough ? { probability_pct: g.p, low_pct: g.lo, high_pct: g.hi, comparables: g.n, on_time: g.k, level: g.level, group: g.name } : null) : null,
enough_comparables: x.s === 'open' ? enough : null,
pooled_context: x.s === 'open' && !enough && g ? { probability_pct: g.p, low_pct: g.lo, high_pct: g.hi, closed_projects: g.n, on_time: g.k, note: $t.k3 } : null,
first_handover: x.first, advertised_handover: x.cur, recorded_moves_months: x.moved, overdue_months: x.overdue, months_to_first_handover: x.to_first == null ? null : x.to_first,
bias: d.bias, method: $t.k4, data: $q.n, licence: $t.LIC }, 200, 600);
}
if (p === $q.t) {
const d = await load(env, $q.u);
if (!d) return out(STARTING($q.v), 200, 60);
const mk = u.searchParams.get($q.w);
if (mk) {
const m = (d.markets || []).find(x => x.market.toLowerCase() === mk.toLowerCase().slice(0, 60));
if (!m) return out({ error: $q.x, markets: (d.markets || []).map(x => x.market) }, 404, 300);
return out({ generated: d.generated, as_of_month: d.as_of_month, rules: d.rules, market: m, licence: $t.LIC }, 200, 600);
}
return out({ generated: d.generated, as_of_month: d.as_of_month, history_starts: d.history_starts, what: d.what, rules: d.rules, caveats: d.caveats,
all_markets: Object.assign({}, d.all_markets, { late_months: undefined }),
markets: (d.markets || []).map(m => Object.assign({}, m, { late_months: undefined })), history: d.history, data: $q.u, licence: $t.LIC }, 200, 600);
}
if (p === $q.y) {
const d = await load(env, $q.z);
if (!d) return out(STARTING($q.A), 200, 60);
return out(d, 200, 600);
}
return out({ error: $q.B, module: 'v' }, 404, 60);
}
