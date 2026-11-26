// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_live__q, $s = TB.kbx_live__s, $t = TB.kbx_live__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { rpc } from './kolaboro.js';
import { TB } from './kbx_strings.js';
export const PATHS = /^\/api\/x\/live(\/|$)/;
const HDR = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' };
const out = (b, s, age) => new Response(JSON.stringify(b, null, 1), { status: s || 200, headers: Object.assign({ 'cache-control': $q.a + (age || 60) }, HDR) });
async function probe(path, opt, ms) {
const t0 = Date.now(), ac = new AbortController(), tm = setTimeout(() => ac.abort(), ms || 8000);
try {
const r = await fetch($q.b + path, Object.assign({ redirect: $q.c, signal: ac.signal, headers: { 'user-agent': $t.k0, 'x-kb-status': '1' } }, opt || {}));
const ct = r.headers.get($q.d) || '';
let body = null;
if (/json/.test(ct)) { try { body = await r.json(); } catch (e) {} } else { try { body = (await r.text()).length; } catch (e) {} }
return { status: r.status, ms: Date.now() - t0, ct, body };
} catch (e) { return { status: 0, ms: Date.now() - t0, error: e && e.name === $q.e ? $q.f : $q.g }; }
finally { clearTimeout(tm); }
}
async function asset(env, p) { try { const r = await env.ASSETS.fetch(new Request($q.h + p)); return r.ok ? await r.json() : null; } catch (e) { return null; } }
const ageH = t => { const x = Date.parse(t); return isFinite(x) ? Math.round((Date.now() - x) / 36e5 * 10) / 10 : null; };
const st = ok => ok === true ? 'up' : ok === false ? 'down' : $q.i;
function incidents(dep) {
const list = ((dep && dep.deploys) || []).slice().sort((a, b) => a.at < b.at ? -1 : 1), inc = [];
let cur = null;
for (const d of list) {
if (d.result === 'pass') { if (cur) { cur.resolved_at = d.at; cur.resolved_by = (d.commit || '').slice(0, 12); cur.minutes = Math.round((Date.parse(d.at) - Date.parse(cur.started_at)) / 6e4); inc.push(cur); cur = null; } continue; }
const kind = d.result === $q.j ? $q.j : d.result === $q.k ? $q.l : d.result || $q.m;
if (!cur) cur = { started_at: d.at, kind, attempts: 0, failed: [], commits: [], runs: [] };
if (kind === $q.j) cur.kind = $q.j;
cur.attempts++; cur.commits.push((d.commit || '').slice(0, 12)); if (d.run) cur.runs.push(d.run);
for (const f of d.failed || []) if (cur.failed.indexOf(f) < 0 && cur.failed.length < 6) cur.failed.push(f);
}
if (cur) { cur.resolved_at = null; inc.push(cur); }
return inc.reverse().slice(0, 20).map(x => Object.assign(x, {
summary: x.kind === $q.j ? $t.k1
: $s.k0,
runs: x.runs.slice(-3)
}));
}
async function status(env) {
  const [home, check, named, health, lcov, lstats, pp, spend, fresh, dep, claims] = await Promise.all([
    probe('/'), probe($q.n), probe($q.o), probe($q.p), probe($q.q), probe($q.r),
    probe($q.s, { method: 'POST', body: '{}', headers: { 'content-type': $q.t, 'user-agent': $q.u, 'x-kb-status': '1' } }),
    probe($q.v), probe($q.w), asset(env, $q.x), asset(env, $q.y)
  ]);
  const page = (name, p, path) => ({ group: 'Pages', name, state: st(p.status === 200 ? (p.ms < 4000 ? true : null) : false), http: p.status, ms: p.ms, detail: p.status === 200 ? $q.z + Math.round((p.body || 0) / 1024) + ' KB)' : (p.error || 'HTTP ' + p.status), url: path });
  const h = health.body || {}, today = ((spend.body && spend.body.days) || [])[0] || null, cap = spend.body && spend.body.cap_usd_per_day;
  const f = fresh.body || {}, claimsAge = claims ? ageH(claims.updated) : null, guardAge = dep ? ageH(dep.updated) : null;
  const live = (env && env.CF_PAGES_COMMIT_SHA) || null, lastGood = dep && dep.last_good;
  const checks = [
    page($q.A, home, '/'), page($q.B, check, $q.n), page($q.C, named, $q.o),
    { group: 'API', name: $q.D, state: st(health.status === 200 ? (h.database === 'up' ? true : false) : false), http: health.status, ms: health.ms, detail: health.status === 200 ? $q.E + (h.database || '?') + (h.db_ms != null ? ' (' + h.db_ms + ' ms)' : '') : (health.error || 'HTTP ' + health.status), url: $q.p },
    { group: 'API', name: $q.F, state: st(lcov.status === 200 && lstats.status === 200 ? true : (lcov.status === 200 || lstats.status === 200 ? null : false)), http: lstats.status, ms: Math.max(lcov.ms, lstats.ms), detail: lstats.status === 200 && lstats.body ? $q.G + (lstats.body.lookups_7d != null ? lstats.body.lookups_7d + $q.H : $q.I) + (lstats.body.p50_ms_7d ? $q.J + (lstats.body.p50_ms_7d / 1000).toFixed(1) + ' s' : '') + $q.K : (lstats.error || 'HTTP ' + lstats.status), url: $q.r },
    { group: 'API', name: $q.L, state: st(health.status === 200 ? (h.models_configured ? (today && cap && today.usd_estimated >= cap ? null : true) : false) : false), http: health.status, ms: null, detail: health.status === 200 ? (h.models_configured ? $q.M : $q.N) + (today && cap ? $q.O + today.calls + $q.P + today.usd_estimated + $q.Q + cap + $q.R : '') : $q.S, url: $q.v },
    { group: $q.T, name: $q.U, state: st(pp.status === 400 ? (env && env.KB_PP_WEBHOOK_ID ? true : null) : false), http: pp.status, ms: pp.ms, detail: pp.status === 400 ? $q.V + (env && env.KB_PP_WEBHOOK_ID ? $q.W : $q.X) : (pp.error || $q.Y + pp.status), url: $q.s },
    { group: 'Data', name: $q.Z, state: st(fresh.status === 200 ? (f.meets_objective ? true : null) : false), http: fresh.status, ms: fresh.ms, detail: fresh.status === 200 ? (f.pct_7d != null ? f.pct_7d + '% of ' + f.projects + $q.aa : $q.ab) : (fresh.error || 'HTTP ' + fresh.status), url: $q.w },
    { group: 'Data', name: $q.ac, state: st(claimsAge == null ? false : claimsAge < 24 * 9 ? true : null), http: null, ms: null, detail: claimsAge == null ? $q.ad : $q.ae + (claimsAge < 48 ? claimsAge + ' h' : Math.round(claimsAge / 24) + ' days') + $q.af, url: $q.y },
    { group: $q.ag, name: $q.ah, state: st(guardAge == null ? false : guardAge < 30 ? true : null)   /* n20f: since 9 Nov 2026 the guard runs once a day (Actions budget rule), not after each push; 3 h marked it degraded most of every day */, http: null, ms: null, detail: guardAge == null ? $q.ai : $q.aj + guardAge + $q.ak + (live ? live.slice(0, 12) : $q.al) + (lastGood ? (live && (lastGood.indexOf(live.slice(0, 12)) === 0 || String(dep.last_checked || '').indexOf(live.slice(0, 12)) === 0) ? $q.am : $q.an + lastGood.slice(0, 12)) : ''), url: $q.x }
  ];
  const worst = checks.some(c => c.state === 'down') ? 'down' : checks.some(c => c.state === $q.i) ? $q.i : 'up';
  const inc = incidents(dep), d30 = Date.now() - 30 * 864e5;
  return { overall: worst, checked_at: new Date().toISOString(), from: $q.ao, live_commit: live, checks,
    deploys_30d: ((dep && dep.deploys) || []).filter(x => Date.parse(x.at) > d30).reduce((a, x) => (a[x.result] = (a[x.result] || 0) + 1, a), {}),
    incidents: inc, incidents_source: $q.ap };
}
export async function handle(req, u, env, ctx) {
const p = u.pathname.replace(/\/+$/, '');
if (req.method === $q.aq) return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': $q.ar } });
if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: $q.as }, 405);
if (p === $q.at) {
const key = new Request($q.au), hit = await caches.default.match(key);
if (hit) return hit;
const r = out(await status(env), 200, 60);
ctx.waitUntil(caches.default.put(key, r.clone()));
return r;
}
if (p === $q.av) {
let d = null; try { d = await rpc($q.aw, {}); } catch (e) {}
if (!d) return out({ available: false, mode: $q.ax, endpoint: $q.ay, note: $t.k2 }, 200, 300);
return out(Object.assign({ available: true, mode: $s.k1, endpoint: $q.ay }, d), 200, 300);
}
return out({ error: $q.az }, 404);
}
