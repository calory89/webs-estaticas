// Feature module g for kolaboro.com: satellite on demand (STAC scene finder for /satellite/plot/) and status for /milestones/.
// The browser reads the Sentinel-2 COGs itself (sentinel-cogs on AWS Open Data allows CORS range reads); this worker only
// finds, per quarter, the least cloudy scenes that cover a point, using Element84 Earth Search. No account, no key.
import { openData } from './kolaboro.js';
import { TB } from './kbx_strings.js';
export const PATHS = /^\/api\/x\/g\//;

const STAC = 'https://earth-search.aws.element84.com/v1/search';
/* SRC: n40 k17, in /data/i18n/k17s.json */
const ORIGIN_G = 'https://kolaboro.com';
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
  const body = { lat: rl, lng: rg, years, generated: today.toISOString(), stac_ms: Date.now() - t0, source: TB.kbx_g__s.SRC, stac: 'https://earth-search.aws.element84.com/v1 (collection sentinel-2-l2a)',
    note: TB.kbx_g__s.k0,
    quarters: res };
  const failed = res.filter(q => q.error).length;
  const resp = out(body, 200, failed ? 0 : 3600);
  if (!failed) ctx.waitUntil(cache.put(key, new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=86400', 'access-control-allow-origin': '*' } })));
  return resp;
}

// ------------------------------------------------------------------------------------------------ n19d (batch 19): any plot from space
// GET /api/x/g/frame?lat=&lng=&q=2019-Q3   one quarter at a point, computed on demand at the edge with the same method as the X-ray
// satellite card (kbx_xray_ev.js: STAC on Earth Search, scene classification read at the pin, true colour read from the TCI COG with
// HTTP range requests): the least cloudy scenes of the quarter are tried in order until one is clear within 150 m of the pin, and a
// 128 x 128 px (1.28 km) true-colour thumbnail is returned as a PNG data URL with the brightness and greenness of the 50 m square at
// the pin. Quarters from 2017-Q1 (start of the L2A archive on Earth Search) to now. Cached at the edge per point (rounded to about
// 10 m) and quarter: 30 days for past quarters, 6 hours for the current one. Rate limit: 240 uncached quarters per 10 minutes per
// address (about six points since 2017). Nothing about the person is stored; the pin is used only as the cache key.
const FR_V = 'f1', FR_PX = 128, FR_HALF = 64, FR_MAX_TRY = 5, FR_START = 2017;
const CLEAR_SCL = { 4: 1, 5: 1, 6: 1, 7: 1 };   // vegetation, not vegetated, water, unclassified
function qBounds(q, today) {
  const m = /^(\d{4})-Q([1-4])$/.exec(q || ''); if (!m) return null;
  const y = +m[1], k = +m[2] - 1, from = new Date(Date.UTC(y, k * 3, 1)), to = new Date(Date.UTC(y, k * 3 + 3, 0, 23, 59, 59));
  if (y < FR_START || from > today) return null;
  return { q, from: from.toISOString().slice(0, 10), to: (to > today ? today : to).toISOString().slice(0, 10), current: to > today };
}
async function frStac(lat, lng, b) {
  const body = { collections: ['sentinel-2-l2a'], intersects: { type: 'Point', coordinates: [lng, lat] }, datetime: b.from + 'T00:00:00Z/' + b.to + 'T23:59:59Z',
    limit: 24, query: { 'eo:cloud_cover': { lt: 70 } }, sortby: [{ field: 'properties.eo:cloud_cover', direction: 'asc' }],
    fields: { include: ['id', 'properties.datetime', 'properties.eo:cloud_cover', 'properties.proj:epsg', 'properties.proj:code', 'assets.visual', 'assets.scl'] } };
  const r = await fetch(STAC, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/geo+json', 'user-agent': 'KolaboroPlot/1.0 (+https://kolaboro.com/satellite/plot/)' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('stac ' + r.status);
  const d = await r.json(), seen = new Set();
  // the archive lists many 2017 to 2021 acquisitions twice (_0_L2A: open COGs; _1_L2A: reprocessing in a requester-pays bucket): keep the COG copy
  return (d.features || []).filter(f => {
    const a = f.assets || {};
    if (!a.visual || !a.scl || !/^https:\/\/sentinel-cogs\.s3\.us-west-2\.amazonaws\.com\//.test(a.visual.href) || !/^https:\/\/sentinel-cogs\.s3\.us-west-2\.amazonaws\.com\//.test(a.scl.href)) return false;
    const base = String(f.id).replace(/_\d+_L2A$/, ''); if (seen.has(base)) return false; seen.add(base); return true;
  });
}
const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
async function frameRun(lat, lng, b) {
  const ev = await import('./kbx_xray_ev.js'), stat = { bytes: 0, tiles: 0 }, t0 = Date.now();
  const feats = await frStac(lat, lng, b), tried = [];
  for (const f of feats.slice(0, FR_MAX_TRY)) {
    if (Date.now() - t0 > 20000) break;
    const p = f.properties || {}, date = String(p.datetime || '').slice(0, 10), cloud = Math.round((p['eo:cloud_cover'] || 0) * 10) / 10;
    try {
      const ps = ev.satPixelOf(f.assets.scl, f, lat, lng); if (!ps) { tried.push({ date, cloud, error: 'projection' }); continue; }
      const h = 8, s = await ev.satCogWindow(f.assets.scl.href, Math.floor(ps[0]) - h, Math.floor(ps[1]) - h, 2 * h, 2 * h, stat);
      let n = 0, ok = 0, nd = 0; const rr = (150 / 20) * (150 / 20);
      for (let j = 0; j < 2 * h; j++) for (let i = 0; i < 2 * h; i++) { const dx = i - h + .5, dy = j - h + .5; if (dx * dx + dy * dy > rr) continue; const v = s[j * 2 * h + i]; n++; if (v === 0) nd++; else if (CLEAR_SCL[v]) ok++; }
      const clear = n ? Math.round(ok / n * 100) : 0, nodata = n ? nd / n : 1;
      tried.push({ date, cloud, clear_at_pin: clear });
      if (nodata > 0.05 || clear < 90) continue;
      const pt = ev.satPixelOf(f.assets.visual, f, lat, lng); if (!pt) continue;
      const rgb = await ev.satCogWindow(f.assets.visual.href, Math.floor(pt[0]) - FR_HALF, Math.floor(pt[1]) - FR_HALF, FR_PX, FR_PX, stat);
      let zero = 0; const N = FR_PX * FR_PX;
      for (let k = 0; k < N; k++) if (!rgb[3 * k] && !rgb[3 * k + 1] && !rgb[3 * k + 2]) zero++;
      if (zero / N > 0.05) { tried[tried.length - 1].error = 'edge of scene'; continue; }
      let lum = 0, exg = 0, m = 0;
      for (let j = FR_HALF - 2; j <= FR_HALF + 2; j++) for (let i = FR_HALF - 2; i <= FR_HALF + 2; i++) {
        const q = j * FR_PX + i, R = rgb[3 * q], G = rgb[3 * q + 1], B = rgb[3 * q + 2]; if (!R && !G && !B) continue;
        lum += 0.299 * R + 0.587 * G + 0.114 * B; exg += 2 * G - R - B; m++;
      }
      const disp = new Uint8Array(rgb.length); for (let k = 0; k < rgb.length; k++) disp[k] = Math.min(255, Math.round(rgb[k] * 1.12));
      const png = await ev.satEncodePng(disp, FR_PX, FR_PX, date.slice(0, 4));
      return { status: 'ok', scene: { id: f.id, date, cloud, stac: STAC.replace(/\/search$/, '') + '/collections/sentinel-2-l2a/items/' + f.id, tci: f.assets.visual.href }, clear_at_pin: clear,
        brightness: m ? Math.round(lum / m * 10) / 10 : null, greenness: m ? Math.round(exg / m * 10) / 10 : null, size: FR_PX, px_m: 10, png: 'data:image/png;base64,' + b64(png),
        credit: 'Contains modified Copernicus Sentinel data ' + date.slice(0, 4), tried, listed: feats.length, read_kb: Math.round(stat.bytes / 1024), ms: Date.now() - t0 };
    } catch (e) { tried.push({ date, cloud, error: String(e && e.message || e).slice(0, 60) }); }
  }
  return { status: feats.length ? 'no clear image' : 'no image', tried, listed: feats.length, read_kb: Math.round(stat.bytes / 1024), ms: Date.now() - t0 };
}
async function frame(req, u, ctx) {
  const lat = +u.searchParams.get('lat'), lng = +u.searchParams.get('lng'), today = new Date();
  if (!(lat >= -80 && lat <= 84 && lng >= -180 && lng <= 180)) return out({ error: 'need lat (-80..84) and lng (-180..180)' }, 400);
  const b = qBounds(String(u.searchParams.get('q') || ''), today);
  if (!b) return out({ error: 'need q=YYYY-Qn between ' + FR_START + '-Q1 and the current quarter' }, 400);
  const rl = Math.round(lat * 1e4) / 1e4, rg = Math.round(lng * 1e4) / 1e4;
  const key = new Request(ORIGIN_G + '/__g/frame/' + FR_V + '/' + rl + ',' + rg + '/' + b.q + (b.current ? '/' + today.toISOString().slice(0, 10) : ''));
  const hit = await caches.default.match(key);
  if (hit) { const r = new Response(hit.body, hit); r.headers.set('x-cache', 'hit'); return r; }
  const ip = req.headers.get('cf-connecting-ip') || 'x';
  if (limited('f:' + ip, 240, 10 * 60e3)) return out({ error: 'rate_limited', note: TB.kbx_g__s.k1 }, 429);
  let res;
  try { res = await frameRun(rl, rg, b); } catch (e) { return out({ q: b.q, from: b.from, to: b.to, status: 'search failed', error: String(e && e.message || e).slice(0, 80) }, 502); }
  const body = Object.assign({ v: FR_V, lat: rl, lng: rg, q: b.q, from: b.from, to: b.to, generated: today.toISOString(), source: TB.kbx_g__s.SRC, method: 'https://kolaboro.com/satellite/plot/#h-how' }, res);
  const age = b.current ? 21600 : 2592000;
  const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=' + age, 'access-control-allow-origin': '*' };
  if (res.status === 'ok' || res.status === 'no image' || (res.status === 'no clear image' && !res.tried.some(t => t.error))) ctx.waitUntil(caches.default.put(key, new Response(JSON.stringify(body), { headers })));
  return new Response(JSON.stringify(body), { status: 200, headers: Object.assign({}, headers, { 'x-cache': 'miss' }) });
}

export async function handle(req, u, env, ctx) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET', 'access-control-max-age': '86400' } });
  if (req.method !== 'GET') return out({ error: 'GET only' }, 405);
  const p = u.pathname;
  if (p === '/api/x/g/frame') { try { return await frame(req, u, ctx); } catch (e) { return out({ error: 'frame_unavailable' }, 502); } }
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
      sat_method: TB.kbx_g__s.k2 }, 200, 300);
  }
  if (p === '/api/x/g/status') {
    // The on-demand viewer needs no account. A Copernicus Data Space client (CDSE_CLIENT_ID / CDSE_CLIENT_SECRET) is only an optional upgrade path.
    return out({ on_demand: 'browser reads Sentinel-2 COGs directly (no account)', stac: 'Element84 Earth Search', cdse_worker_connected: !!(env.CDSE_CLIENT_ID && env.CDSE_CLIENT_SECRET),
      optical_series: '/data/satellite-optical.json', radar_and_composites: '/data/satellite.json' }, 200, 300);
  }
  return out({ error: 'not found', endpoints: ['/api/x/g/frame?lat=&lng=&q=2019-Q3', '/api/x/g/scenes?lat=&lng=&years=2|3', '/api/x/g/project?id=BALI-014', '/api/x/g/status'] }, 404);
}
