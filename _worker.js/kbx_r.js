// comments: _notes/kolaboro-worker-comments.txt
import { TB } from './kbx_strings.js';
export const PATHS = /^\/api\/x\/r(\/|$)/;
const MEMO = {};
async function load(env, name) {
const m = MEMO[name];
if (m && Date.now() - m.t < 120000) return m.v;
let v = null;
try {
let r = null;
if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request('https://kolaboro.com/data/' + name));
if (!r || !r.ok) r = await fetch('https://kolaboro.com/data/' + name, { cf: { cacheTtl: 600, cacheEverything: true } });
if (r.ok) v = await r.json();
} catch (e) { v = null; }
MEMO[name] = { t: Date.now(), v };
return v;
}
function out(o, s = 200, maxAge = 300) {
  return new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': maxAge ? 'public, max-age=' + maxAge : 'no-store', 'access-control-allow-origin': '*' } });
}
const STARTING = name => ({ status: 'starting', note: 'The batch job has not published ' + name + ' yet.' });
export async function handle(req, u, env, ctx) {
if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: 'method not allowed' }, 405, 0);
const p = u.pathname.replace(/\/+$/, '');
if (p === '/api/x/r') return out({ endpoints: {
'/api/x/r/visual': TB.kbx_r__s.k0,
'/api/x/r/visual/{ID}': TB.kbx_r__t.k0,
'/api/x/r/price-index': TB.kbx_r__t.k1,
'/api/x/r/price-index?market=Bali': TB.kbx_r__t.k2 } });
if (p === '/api/x/r/visual') {
const d = await load(env, 'visual-diff.json');
if (!d) return out(STARTING('visual-diff.json'), 200, 60);
const recent = (d.projects || []).filter(x => x.changes && x.changes.length).slice(0, 50).map(x => ({ id: x.id, market: x.market, last: x.changes[x.changes.length - 1] }));
return out({ generated: d.generated, what: d.what, trigger: d.trigger, method: d.method, limits: d.limits, caveats: d.caveats, run: d.run, totals: d.totals, recent, data: '/data/visual-diff.json' });
}
let m = p.match(/^\/api\/x\/r\/visual\/([A-Za-z0-9-]{3,20})$/);
if (m) {
const d = await load(env, 'visual-diff.json');
if (!d) return out(STARTING('visual-diff.json'), 200, 60);
const id = m[1].toUpperCase(), x = (d.projects || []).find(y => y.id === id);
if (!x) return out({ id, status: 'no capture yet', note: TB.kbx_r__s.k1, generated: d.generated }, 404);
return out(Object.assign({ generated: d.generated, images: TB.kbx_r__s.k2 }, x));
}
if (p === '/api/x/r/price-index') {
const d = await load(env, 'price-index.json');
if (!d) return out(STARTING('price-index.json'), 200, 60);
const mk = (u.searchParams.get('market') || '').slice(0, 60);
const base = { generated: d.generated, history_starts: d.history_starts, what: d.what, rules: d.rules, caveats: d.caveats, data: '/data/price-index.json' };
if (mk) {
const x = (d.markets || []).find(y => y.market.toLowerCase() === mk.toLowerCase());
if (!x) return out(Object.assign(base, { error: 'market not found', markets: (d.markets || []).map(y => y.market) }), 404);
return out(Object.assign(base, { market: x }));
}
return out(Object.assign(base, { all_markets: { index: d.all_markets.index, pairs_total: d.all_markets.pairs_total },
markets: (d.markets || []).filter(x => x.index.length).map(x => ({ market: x.market, base: x.index[0].date, latest: x.index[x.index.length - 1], pairs_total: x.pairs_total, changes_total: x.changes_total, excluded_total: x.excluded_total })),
thin_markets: (d.markets || []).filter(x => !x.index.length).length, official_reference: d.official_reference }));
}
return out({ error: 'not found', see: '/api/x/r/' }, 404);
}
