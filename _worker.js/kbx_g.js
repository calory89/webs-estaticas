// Feature module g for kolaboro.com: satellite on demand (STAC scene finder for /satellite/plot/) and status for /milestones/.
// The browser reads the Sentinel-2 COGs itself (sentinel-cogs on AWS Open Data allows CORS range reads); this worker only
// finds, per quarter, the least cloudy scenes that cover a point, using Element84 Earth Search. No account, no key.
import { openData } from './kolaboro.js';
export const PATHS = /^\/api\/x\/g\//;

const STAC = 'https://earth-search.aws.element84.com/v1/search';
const SRC = 'Copernicus Sentinel-2 L2A (contains modified Copernicus Sentinel data), found with Element84 Earth Search, read from the Sentinel-2 COGs on AWS Open Data';
const hits = new Map();   // best effort per isolate: ip -> [timestamps]

function out(o, s = 200, maxAge = 0) {
  return new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': maxAge ? 'public, max-age=' + maxAge : 'no-store', 'access-control-allow-origin': '*' } });
}
function limited(ip, n, winMs) {
  const now = Date.now(), a = (hits.get(ip) || []).filter(t => now - t < winMs);
  if (a.length >= n) { hits.set(ip, a); return true; }
  a.push(now); hits.set(ip, a);
  if (hits.size > 5000) hits.clear();
  return false;
}
function quarters(years, today) {
  const q = [], cy = today.getUTCFullYear(), cq = Math.floor(today.getUTCMonth() / 3);
  for (let i = years * 4 - 1; i >= 0; i--) {
    let y = cy, k = cq - i; while (k < 0) { k += 4; y--; }
    const from = new Date(Date.UTC(y, k * 3, 1)), to = new Date(Date.UTC(y, k * 3 + 3, 0, 23, 59, 59));
    q.push({ q: y + '-Q' + (k + 1), from: from.toISOString().slice(0, 10), to: (to > today ? today : to).toISOString().slice(0, 10) });
  }
  return q;
}
async function stacQuarter(lat, lng, q) {
  const body = { collections: ['sentinel-2-l2a'], intersects: { type: 'Point', coordinates: [lng, lat] }, datetime: q.from + 'T00:00:00Z/' + q.to + 'T23:59:59Z',
    limit: 8, query: { 'eo:cloud_cover': { lt: 70 } }, sortby: [{ field: 'properties.eo:cloud_cover', direction: 'asc' }] };
  const r = await fetch(STAC, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/geo+json' }, body: JSON.stringify(body), cf: { cacheTtl: 3600 } });
  if (!r.ok) throw new Error('stac ' + r.status);
  const d = await r.json();
  return (d.features || []).map(f => {
    const p = f.properties || {}, a = f.assets || {};
    const epsg = +(p['proj:epsg'] || String(p['proj:code'] || '').split(':').pop());
    if (!a.visual || !a.scl || !epsg) return null;
    return { id: f.id, date: String(p.datetime || '').slice(0, 10), cloud: Math.round((p['eo:cloud_cover'] || 0) * 10) / 10, nodata: Math.round((p['s2:nodata_pixel_percentage'] || 0) * 10) / 10,
      epsg, tci: a.visual.href, scl: a.scl.href, sun_elev: p['view:sun_elevation'] != null ? Math.round(p['view:sun_elevation']) : null };
  }).filter(x => x && /^https:\/\/sentinel-cogs\.s3\.us-west-2\.amazonaws\.com\//.test(x.tci) && /^https:\/\/sentinel-cogs\.s3\.us-west-2\.amazonaws\.com\//.test(x.scl));
}

async function scenes(req, u, ctx) {
  const lat = +u.searchParams.get('lat'), lng = +u.searchParams.get('lng'), years = Math.min(3, Math.max(1, Math.round(+u.searchParams.get('years') || 3)));
  if (!(lat >= -80 && lat <= 84 && lng >= -180 && lng <= 180)) return out({ error: 'need lat (-80..84) and lng (-180..180)' }, 400);
  const rl = Math.round(lat * 1e4) / 1e4, rg = Math.round(lng * 1e4) / 1e4, today = new Date();
  const key = new Request('https://kolaboro.com/api/x/g/scenes-cache?lat=' + rl + '&lng=' + rg + '&years=' + years + '&d=' + today.toISOString().slice(0, 10));
  const cache = caches.default;
  const hit = await cache.match(key);
  if (hit) { const r = new Response(hit.body, hit); r.headers.set('x-cache', 'hit'); return r; }
  const ip = req.headers.get('cf-connecting-ip') || 'x';
  if (limited(ip, 20, 10 * 60e3)) return out({ error: 'rate_limited', note: 'At most 20 new points per 10 minutes from one address. Try again shortly.' }, 429);
  const t0 = Date.now(), qs = quarters(years, today);
  const res = await Promise.all(qs.map(q => stacQuarter(rl, rg, q).then(c => Object.assign({}, q, { candidates: c.slice(0, 6), listed: c.length }), e => Object.assign({}, q, { candidates: [], error: String(e.message || e).slice(0, 60) }))));
  const body = { lat: rl, lng: rg, years, generated: today.toISOString(), stac_ms: Date.now() - t0, source: SRC, stac: 'https://earth-search.aws.element84.com/v1 (collection sentinel-2-l2a)',
    note: 'Candidates per quarter, least cloudy first by whole-scene cloud cover (max 70%). The page then checks the scene classification at your point and keeps the first one that is clear there.',
    quarters: res };
  const failed = res.filter(q => q.error).length;
  const resp = out(body, 200, failed ? 0 : 3600);
  if (!failed) ctx.waitUntil(cache.put(key, new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=86400', 'access-control-allow-origin': '*' } })));
  return resp;
}

export async function handle(req, u, env, ctx) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET', 'access-control-max-age': '86400' } });
  if (req.method !== 'GET') return out({ error: 'GET only' }, 405);
  const p = u.pathname;
  if (p === '/api/x/g/scenes') { try { return await scenes(req, u, ctx); } catch (e) { return out({ error: 'stac_unavailable' }, 502); } }
  if (p === '/api/x/g/project') {
    // One tracked project with the fields the milestone view needs (all already public in /data/bali-cases.json).
    const id = String(u.searchParams.get('id') || '').trim().toUpperCase();
    if (!/^[A-Z]{2,6} ?-\d{1,4}$/.test(id)) return out({ error: 'need id like BALI-014' }, 400);
    let d; try { d = await openData(); } catch (e) { return out({ error: 'data_unavailable' }, 502); }
    const c = (d.cases || []).find(x => x.id === id);
    if (!c) return out({ error: 'not_found', id }, 404, 300);
    const keep = ['id', 'market', 'country', 'region', 'stage', 'done', 'delay', 'overdue', 'checks', 'verified', 'claims', 'flags', 'checked', 'sat', 'register', 'history', 'units'];
    const o = {}; keep.forEach(k => { if (c[k] !== undefined) o[k] = c[k]; });
    return out({ updated: d.updated, project: o, page: 'https://kolaboro.com/p/?id=' + encodeURIComponent(id), api: 'https://kolaboro.com/api/open/projects/' + encodeURIComponent(id),
      sat_method: 'sat: Sentinel-2 composites of a ~400 m box around the project site, the same 120-day window a year apart; change = NDVI or brightness shift on 6%+ of clear pixels. The site coordinates are not published.' }, 200, 300);
  }
  if (p === '/api/x/g/status') {
    // The on-demand viewer needs no account. A Copernicus Data Space client (CDSE_CLIENT_ID / CDSE_CLIENT_SECRET) is only an optional upgrade path.
    return out({ on_demand: 'browser reads Sentinel-2 COGs directly (no account)', stac: 'Element84 Earth Search', cdse_worker_connected: !!(env.CDSE_CLIENT_ID && env.CDSE_CLIENT_SECRET),
      optical_series: '/data/satellite-optical.json', radar_and_composites: '/data/satellite.json' }, 200, 300);
  }
  return out({ error: 'not found', endpoints: ['/api/x/g/scenes?lat=&lng=&years=2|3', '/api/x/g/project?id=BALI-014', '/api/x/g/status'] }, 404);
}
