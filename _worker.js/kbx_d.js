// Feature module d for kolaboro.com (see kbx.js): developer intelligence per anonymous project.
//   GET /api/x/d/project/{ID}  website age (RDAP + Certificate Transparency, month precision) and promise drift
//                              (day-by-day changes on the developer page) for one project, from the static files that the
//                              "Kolaboro developer intelligence" GitHub Action publishes to /data/domain-age.json and
//                              /data/promise-drift.json. No domain, URL or developer name is ever in these files.
// The page /p/ can also read the static files directly; this endpoint just returns the one-project slice (a few hundred bytes
// instead of ~200 KB) and states plainly when the batch job has not published yet.
export const PATHS = /^\/api\/x\/d\//;

const MEMO = {};
async function load(name) {
  const m = MEMO[name];
  if (m && Date.now() - m.t < 120000) return m.v;
  let v = null;
  try {
    const r = await fetch('https://kolaboro.com/data/' + name, { cf: { cacheTtl: 600, cacheEverything: true } });
    if (r.ok && /json/.test(r.headers.get('content-type') || 'json')) v = await r.json();
  } catch (e) { v = null; }
  MEMO[name] = { t: Date.now(), v };
  return v;
}

function out(o, s = 200, maxAge = 300) {
  return new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=' + maxAge, 'access-control-allow-origin': '*' } });
}

export async function handle(req, u, env, ctx) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: 'method not allowed' }, 405, 0);
  const m = u.pathname.match(/^\/api\/x\/d\/project\/([A-Za-z]{2,5}-\d{3,4})\/?$/);
  if (!m) return out({ error: 'not found', endpoints: ['/api/x/d/project/{ID}'] }, 404, 60);
  const id = m[1].toUpperCase();
  const [age, drift] = await Promise.all([load('domain-age.json'), load('promise-drift.json')]);
  const res = { id };
  if (age && age.projects) {
    res.website = age.projects[id] || null;
    res.website_meta = { updated: age.updated, source: age.source, method: age.method, counts: age.counts };
  } else res.website = { status: 'starting', note: 'The website-age job has not published yet.' };
  if (drift && drift.projects) {
    res.drift = drift.projects[id] || null;
    res.drift_meta = { updated: drift.updated, days: drift.days, first_day: drift.first_day, fields: drift.fields, not_tracked_daily: drift.not_tracked_daily, method: drift.method, counts: drift.counts };
  } else res.drift = { status: 'starting', note: 'The promise-drift job has not published yet.' };
  return out(res);
}
