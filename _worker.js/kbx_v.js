// Feature module v for kolaboro.com (see kbx.js): market statistics: delay index, on-time odds, monthly press release.
// Owned by block V (batch 4, 4 Nov 2026). Endpoints live under /api/x/v/.
//   GET /api/x/v/                    index of endpoints
//   GET /api/x/v/on-time?id=BALI-014 one project's on-time status and odds (or "not enough comparable projects")
//   GET /api/x/v/delays[?market=Bali] the delivery-delay index, all markets or one
//   GET /api/x/v/press               the latest monthly press release (JSON)
// The files are written by the "Kolaboro delay index" GitHub Actions job; this module only reads them and degrades to a "starting" state.
export const PATHS = /^\/api\/x\/v(\/|$)/;

const MEMO = {};
async function load(env, path) {
  const m = MEMO[path];
  if (m && Date.now() - m.t < 120000) return m.v;
  let v = null;
  try {
    let r = null;
    if (env && env.ASSETS) {
      r = await env.ASSETS.fetch(new Request('https://kolaboro.com/_s/kolaboro.com' + path));
      if (!r.ok) r = await env.ASSETS.fetch(new Request('https://kolaboro.com' + path));
    }
    if (!r || !r.ok) r = await fetch('https://kolaboro.com' + path, { cf: { cacheTtl: 600, cacheEverything: true } });
    if (r.ok && /json/.test(r.headers.get('content-type') || 'json')) v = await r.json();
  } catch (e) { v = null; }
  MEMO[path] = { t: Date.now(), v };
  return v;
}
function out(o, s = 200, maxAge = 300) {
  return new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': maxAge ? 'public, max-age=' + maxAge : 'no-store', 'access-control-allow-origin': '*' } });
}
const STARTING = name => ({ status: 'starting', note: 'The delay-index job has not published ' + name + ' yet. Try again in a few minutes.' });
const LIC = 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)';

export async function handle(req, u, env, ctx) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: 'method not allowed' }, 405, 0);
  const p = u.pathname.replace(/\/+$/, '');
  if (p === '/api/x/v') return out({ endpoints: {
    '/api/x/v/on-time?id=BALI-014': 'One project: status against its first promised handover and, where 10 or more comparable closed projects exist, the share that handed over within 6 months (Wilson 95% interval). Page: /index/delays/#odds',
    '/api/x/v/delays': 'Delivery-delay index: per market, share past the first promised handover, median and 90th percentile months late, sample sizes. Page: /index/delays/',
    '/api/x/v/delays?market=Bali': 'One market',
    '/api/x/v/press': 'The latest monthly press release as JSON. Page: /press/monthly/' }, licence: LIC });

  if (p === '/api/x/v/on-time') {
    const id = String(u.searchParams.get('id') || '').trim().toUpperCase().slice(0, 20);
    if (!/^[A-Z]{1,6} ?-\d{1,4}$/.test(id)) return out({ error: 'give ?id= like BALI-014' }, 400, 60);
    const d = await load(env, '/data/on-time.json');
    if (!d) return out(STARTING('on-time.json'), 200, 60);
    const x = d.projects && d.projects[id];
    if (!x) return out({ id, error: 'no tracked project has this id' }, 404, 300);
    const g = x.g ? d.groups[x.g] : null;
    const enough = !!(g && g.level !== 'all');
    let answer;
    if (x.s !== 'open') answer = (d.rules.status || {})[x.s] || x.s;
    else if (enough) answer = g.p + '% of ' + g.n + ' closed projects in ' + g.name + ' handed over within ' + d.rules.window_months + ' months of their first date (95% interval ' + g.lo + '% to ' + g.hi + '%).';
    else answer = 'Not enough comparable projects.';
    return out({ id, market: x.m, as_of_month: d.as_of_month, question: d.question, status: x.s, answer,
      estimate: x.s === 'open' ? (enough ? { probability_pct: g.p, low_pct: g.lo, high_pct: g.hi, comparables: g.n, on_time: g.k, level: g.level, group: g.name } : null) : null,
      enough_comparables: x.s === 'open' ? enough : null,
      pooled_context: x.s === 'open' && !enough && g ? { probability_pct: g.p, low_pct: g.lo, high_pct: g.hi, closed_projects: g.n, on_time: g.k, note: 'All markets pooled: context only, not an estimate for this project.' } : null,
      first_handover: x.first, advertised_handover: x.cur, recorded_moves_months: x.moved, overdue_months: x.overdue, months_to_first_handover: x.to_first == null ? null : x.to_first,
      bias: d.bias, method: 'https://kolaboro.com/index/delays/#odds', data: '/data/on-time.json', licence: LIC }, 200, 600);
  }

  if (p === '/api/x/v/delays') {
    const d = await load(env, '/data/delay-index.json');
    if (!d) return out(STARTING('delay-index.json'), 200, 60);
    const mk = u.searchParams.get('market');
    if (mk) {
      const m = (d.markets || []).find(x => x.market.toLowerCase() === mk.toLowerCase().slice(0, 60));
      if (!m) return out({ error: 'market not tracked', markets: (d.markets || []).map(x => x.market) }, 404, 300);
      return out({ generated: d.generated, as_of_month: d.as_of_month, rules: d.rules, market: m, licence: LIC }, 200, 600);
    }
    return out({ generated: d.generated, as_of_month: d.as_of_month, history_starts: d.history_starts, what: d.what, rules: d.rules, caveats: d.caveats,
      all_markets: Object.assign({}, d.all_markets, { late_months: undefined }),
      markets: (d.markets || []).map(m => Object.assign({}, m, { late_months: undefined })), history: d.history, data: '/data/delay-index.json', licence: LIC }, 200, 600);
  }

  if (p === '/api/x/v/press') {
    const d = await load(env, '/press/monthly/release.json');
    if (!d) return out(STARTING('press/monthly/release.json'), 200, 60);
    return out(d, 200, 600);
  }
  return out({ error: 'not found', module: 'v' }, 404, 60);
}
