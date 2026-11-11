// Feature module 'live' for kolaboro.com (see kbx.js). Batch 9 (6 Nov 2026, b9c).
//   GET /api/x/live/status   server-side checks of the key endpoints, run from the edge (cached 60 s), plus incident history
//                            built from the deploy guard record (/data/deploys.json). No AI is called: the desk review row only
//                            reads configuration and the public AI spend figures.
//   GET /api/x/live/csp      counts of Content-Security-Policy (report-only) violations reported to /api/kb/csp, aggregates only,
//                            read through the public function kolaboro_csp_public (answers available:false until it exists).
import { rpc } from './kolaboro.js';
export const PATHS = /^\/api\/x\/live(\/|$)/;

const HDR = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' };
const out = (b, s, age) => new Response(JSON.stringify(b, null, 1), { status: s || 200, headers: Object.assign({ 'cache-control': 'public, max-age=' + (age || 60) }, HDR) });

async function probe(path, opt, ms) {
  const t0 = Date.now(), ac = new AbortController(), tm = setTimeout(() => ac.abort(), ms || 8000);
  try {
    const r = await fetch('https://kolaboro.com' + path, Object.assign({ redirect: 'manual', signal: ac.signal, headers: { 'user-agent': 'kolaboro-status/1 (+https://kolaboro.com/status/)', 'x-kb-status': '1' } }, opt || {}));
    const ct = r.headers.get('content-type') || '';
    let body = null;
    if (/json/.test(ct)) { try { body = await r.json(); } catch (e) {} } else { try { body = (await r.text()).length; } catch (e) {} }
    return { status: r.status, ms: Date.now() - t0, ct, body };
  } catch (e) { return { status: 0, ms: Date.now() - t0, error: e && e.name === 'AbortError' ? 'timeout' : 'unreachable' }; }
  finally { clearTimeout(tm); }
}
async function asset(env, p) { try { const r = await env.ASSETS.fetch(new Request('https://kolaboro.com/_s/kolaboro.com' + p)); return r.ok ? await r.json() : null; } catch (e) { return null; } }
const ageH = t => { const x = Date.parse(t); return isFinite(x) ? Math.round((Date.now() - x) / 36e5 * 10) / 10 : null; };
const st = ok => ok === true ? 'up' : ok === false ? 'down' : 'degraded';

function incidents(dep) {
  const list = ((dep && dep.deploys) || []).slice().sort((a, b) => a.at < b.at ? -1 : 1), inc = [];
  let cur = null;
  for (const d of list) {
    if (d.result === 'pass') { if (cur) { cur.resolved_at = d.at; cur.resolved_by = (d.commit || '').slice(0, 12); cur.minutes = Math.round((Date.parse(d.at) - Date.parse(cur.started_at)) / 6e4); inc.push(cur); cur = null; } continue; }
    const kind = d.result === 'rolled_back' ? 'rolled_back' : d.result === 'not_deployed' ? 'deploy_delayed' : d.result || 'failed';
    if (!cur) cur = { started_at: d.at, kind, attempts: 0, failed: [], commits: [], runs: [] };
    if (kind === 'rolled_back') cur.kind = 'rolled_back';
    cur.attempts++; cur.commits.push((d.commit || '').slice(0, 12)); if (d.run) cur.runs.push(d.run);
    for (const f of d.failed || []) if (cur.failed.indexOf(f) < 0 && cur.failed.length < 6) cur.failed.push(f);
  }
  if (cur) { cur.resolved_at = null; inc.push(cur); }
  return inc.reverse().slice(0, 20).map(x => Object.assign(x, {
    summary: x.kind === 'rolled_back' ? 'Smoke checks failed after a deploy; the guard restored the last passing files automatically.'
      : 'New code was pushed but not live within 12 minutes (Cloudflare Pages build queue or limit); the previous version kept serving visitors.',
    runs: x.runs.slice(-3)
  }));
}

async function status(env) {
  const [home, check, named, health, lcov, lstats, pp, spend, fresh, dep, claims] = await Promise.all([
    probe('/'), probe('/check/'), probe('/projects/'), probe('/api/kb/health'), probe('/api/kb/lookup/coverage'), probe('/api/kb/lookup/stats'),
    probe('/api/kb/paypal-webhook', { method: 'POST', body: '{}', headers: { 'content-type': 'application/json', 'user-agent': 'kolaboro-status/1', 'x-kb-status': '1' } }),
    probe('/api/open/ai-spend'), probe('/api/open/freshness'), asset(env, '/data/deploys.json'), asset(env, '/data/world-claims.json')
  ]);
  const page = (name, p, path) => ({ group: 'Pages', name, state: st(p.status === 200 ? (p.ms < 4000 ? true : null) : false), http: p.status, ms: p.ms, detail: p.status === 200 ? 'HTML served (' + Math.round((p.body || 0) / 1024) + ' KB)' : (p.error || 'HTTP ' + p.status), url: path });
  const h = health.body || {}, today = ((spend.body && spend.body.days) || [])[0] || null, cap = spend.body && spend.body.cap_usd_per_day;
  const f = fresh.body || {}, claimsAge = claims ? ageH(claims.updated) : null, guardAge = dep ? ageH(dep.updated) : null;
  const live = (env && env.CF_PAGES_COMMIT_SHA) || null, lastGood = dep && dep.last_good;
  const checks = [
    page('Home page', home, '/'), page('Check a project', check, '/check/'), page('Named project pages', named, '/projects/'),
    { group: 'API', name: 'Edge API and database', state: st(health.status === 200 ? (h.database === 'up' ? true : false) : false), http: health.status, ms: health.ms, detail: health.status === 200 ? 'database ' + (h.database || '?') + (h.db_ms != null ? ' (' + h.db_ms + ' ms)' : '') : (health.error || 'HTTP ' + health.status), url: '/api/kb/health' },
    { group: 'API', name: 'Official register lookup', state: st(lcov.status === 200 && lstats.status === 200 ? true : (lcov.status === 200 || lstats.status === 200 ? null : false)), http: lstats.status, ms: Math.max(lcov.ms, lstats.ms), detail: lstats.status === 200 && lstats.body ? 'coverage table served; ' + (lstats.body.lookups_7d != null ? lstats.body.lookups_7d + ' lookups in 7 days' : 'counter served') + (lstats.body.p50_ms_7d ? ', median ' + (lstats.body.p50_ms_7d / 1000).toFixed(1) + ' s' : '') + ' (no live lookup is run by this check)' : (lstats.error || 'HTTP ' + lstats.status), url: '/api/kb/lookup/stats' },
    { group: 'API', name: 'Desk review (readiness, no AI call)', state: st(health.status === 200 ? (h.models_configured ? (today && cap && today.usd_estimated >= cap ? null : true) : false) : false), http: health.status, ms: null, detail: health.status === 200 ? (h.models_configured ? 'model access configured' : 'model access not configured') + (today && cap ? '; today ' + today.calls + ' calls, about $' + today.usd_estimated + ' of the $' + cap + ' daily cap' : '') : 'health endpoint not answering', url: '/api/open/ai-spend' },
    { group: 'Payments', name: 'PayPal webhook endpoint', state: st(pp.status === 400 ? (env && env.KB_PP_WEBHOOK_ID ? true : null) : false), http: pp.status, ms: pp.ms, detail: pp.status === 400 ? 'reachable; rejects an unsigned test call as it should' + (env && env.KB_PP_WEBHOOK_ID ? '; signature check configured' : '; signature check NOT configured') : (pp.error || 'unexpected HTTP ' + pp.status), url: '/api/kb/paypal-webhook' },
    { group: 'Data', name: 'Project re-reads (7 days)', state: st(fresh.status === 200 ? (f.meets_objective ? true : null) : false), http: fresh.status, ms: fresh.ms, detail: fresh.status === 200 ? (f.pct_7d != null ? f.pct_7d + '% of ' + f.projects + ' projects re-read from source in 7 days (objective 90%)' : 'served') : (fresh.error || 'HTTP ' + fresh.status), url: '/api/open/freshness' },
    { group: 'Data', name: 'Research crawler dataset', state: st(claimsAge == null ? false : claimsAge < 24 * 9 ? true : null), http: null, ms: null, detail: claimsAge == null ? 'file not readable' : 'updated ' + (claimsAge < 48 ? claimsAge + ' h' : Math.round(claimsAge / 24) + ' days') + ' ago (weekly run)', url: '/data/world-claims.json' },
    { group: 'Deploys', name: 'Deploy guard', state: st(guardAge == null ? false : guardAge < 30 ? true : null)   /* n20f: since 9 Nov 2026 the guard runs once a day (Actions budget rule), not after each push; 3 h marked it degraded most of every day */, http: null, ms: null, detail: guardAge == null ? 'record not readable' : 'record updated ' + guardAge + ' h ago; live commit ' + (live ? live.slice(0, 12) : 'unknown') + (lastGood ? (live && (lastGood.indexOf(live.slice(0, 12)) === 0 || String(dep.last_checked || '').indexOf(live.slice(0, 12)) === 0) ? ' (checked by the guard)' : '; last passing ' + lastGood.slice(0, 12)) : ''), url: '/data/deploys.json' }
  ];
  const worst = checks.some(c => c.state === 'down') ? 'down' : checks.some(c => c.state === 'degraded') ? 'degraded' : 'up';
  const inc = incidents(dep), d30 = Date.now() - 30 * 864e5;
  return { overall: worst, checked_at: new Date().toISOString(), from: 'Cloudflare edge (the data centre serving this request); cached 60 seconds', live_commit: live, checks,
    deploys_30d: ((dep && dep.deploys) || []).filter(x => Date.parse(x.at) > d30).reduce((a, x) => (a[x.result] = (a[x.result] || 0) + 1, a), {}),
    incidents: inc, incidents_source: '/data/deploys.json (deploy guard record, /open/deploy-guard.py)' };
}

export async function handle(req, u, env, ctx) {
  const p = u.pathname.replace(/\/+$/, '');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, OPTIONS' } });
  if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: 'method' }, 405);
  if (p === '/api/x/live/status') {
    const key = new Request('https://kolaboro.com/__live_status/v1'), hit = await caches.default.match(key);
    if (hit) return hit;
    const r = out(await status(env), 200, 60);
    ctx.waitUntil(caches.default.put(key, r.clone()));
    return r;
  }
  if (p === '/api/x/live/csp') {
    let d = null; try { d = await rpc('kolaboro_csp_public', {}); } catch (e) {}
    if (!d) return out({ available: false, mode: 'report-only', endpoint: '/api/kb/csp', note: 'Reports are collected since 3 Nov 2026. The public read of the counts is not enabled yet.' }, 200, 300);
    return out(Object.assign({ available: true, mode: 'script rules enforced on every page since 2026-11-11 (a blocked script is reported twice: once by the enforced rule, once by the wider report-only policy); other rules report-only', endpoint: '/api/kb/csp' }, d), 200, 300);
  }
  return out({ error: 'not_found' }, 404);
}
