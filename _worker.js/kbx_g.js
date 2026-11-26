// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_g__q, $s = TB.kbx_g__s, $t = TB.kbx_g__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { openData } from './kolaboro.js';
import { TB } from './kbx_strings.js';
export const PATHS = /^\/api\/x\/g\//;
const ORIGIN_G = 'https://kolaboro.com';
const hits = new Map();
function out(o, s = 200, maxAge = 0) {
  return new Response(JSON.stringify(o), { status: s, headers: { 'content-type': $q.a, 'cache-control': maxAge ? $q.b + maxAge : $q.c, 'access-control-allow-origin': '*' } });
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
const body = { collections: [$q.d], intersects: { type: 'Point', coordinates: [lng, lat] }, datetime: q.from + $q.e + q.to + $q.f,
limit: 8, query: { 'eo:cloud_cover': { lt: 70 } }, sortby: [{ field: $q.g, direction: 'asc' }] };
const r = await fetch($t.STAC, { method: 'POST', headers: { 'content-type': $q.h, accept: $q.i }, body: JSON.stringify(body), cf: { cacheTtl: 3600 } });
if (!r.ok) throw new Error('stac ' + r.status);
const d = await r.json();
return (d.features || []).map(f => {
const p = f.properties || {}, a = f.assets || {};
const epsg = +(p[$q.j] || String(p[$q.k] || '').split(':').pop());
if (!a.visual || !a.scl || !epsg) return null;
return { id: f.id, date: String(p.datetime || '').slice(0, 10), cloud: Math.round((p[$q.l] || 0) * 10) / 10, nodata: Math.round((p[$q.m] || 0) * 10) / 10,
epsg, tci: a.visual.href, scl: a.scl.href, sun_elev: p[$q.n] != null ? Math.round(p[$q.n]) : null };
}).filter(x => x && /^https:\/\/sentinel-cogs\.s3\.us-west-2\.amazonaws\.com\//.test(x.tci) && /^https:\/\/sentinel-cogs\.s3\.us-west-2\.amazonaws\.com\//.test(x.scl));
}
async function scenes(req, u, ctx) {
const lat = +u.searchParams.get('lat'), lng = +u.searchParams.get('lng'), years = Math.min(3, Math.max(1, Math.round(+u.searchParams.get('years') || 3)));
if (!(lat >= -80 && lat <= 84 && lng >= -180 && lng <= 180)) return out({ error: $t.k0 }, 400);
const rl = Math.round(lat * 1e4) / 1e4, rg = Math.round(lng * 1e4) / 1e4, today = new Date();
const key = new Request($t.k1 + rl + '&lng=' + rg + $q.o + years + '&d=' + today.toISOString().slice(0, 10));
const cache = caches.default;
const hit = await cache.match(key);
if (hit) { const r = new Response(hit.body, hit); r.headers.set($q.p, 'hit'); return r; }
const ip = req.headers.get($q.q) || 'x';
if (limited(ip, 20, 10 * 60e3)) return out({ error: $q.r, note: $t.k2 }, 429);
const t0 = Date.now(), qs = quarters(years, today);
const res = await Promise.all(qs.map(q => stacQuarter(rl, rg, q).then(c => Object.assign({}, q, { candidates: c.slice(0, 6), listed: c.length }), e => Object.assign({}, q, { candidates: [], error: String(e.message || e).slice(0, 60) }))));
const body = { lat: rl, lng: rg, years, generated: today.toISOString(), stac_ms: Date.now() - t0, source: $s.SRC, stac: $t.k3,
note: $s.k0,
quarters: res };
const failed = res.filter(q => q.error).length;
const resp = out(body, 200, failed ? 0 : 3600);
if (!failed) ctx.waitUntil(cache.put(key, new Response(JSON.stringify(body), { headers: { 'content-type': $q.a, 'cache-control': $q.s, 'access-control-allow-origin': '*' } })));
return resp;
}
const FR_V = 'f1', FR_PX = 128, FR_HALF = 64, FR_MAX_TRY = 5, FR_START = 2017;
const CLEAR_SCL = { 4: 1, 5: 1, 6: 1, 7: 1 };
function qBounds(q, today) {
const m = /^(\d{4})-Q([1-4])$/.exec(q || ''); if (!m) return null;
const y = +m[1], k = +m[2] - 1, from = new Date(Date.UTC(y, k * 3, 1)), to = new Date(Date.UTC(y, k * 3 + 3, 0, 23, 59, 59));
if (y < FR_START || from > today) return null;
return { q, from: from.toISOString().slice(0, 10), to: (to > today ? today : to).toISOString().slice(0, 10), current: to > today };
}
async function frStac(lat, lng, b) {
const body = { collections: [$q.d], intersects: { type: 'Point', coordinates: [lng, lat] }, datetime: b.from + $q.e + b.to + $q.f,
limit: 24, query: { 'eo:cloud_cover': { lt: 70 } }, sortby: [{ field: $q.g, direction: 'asc' }],
fields: { include: ['id', $q.t, $q.g, $q.u, $q.v, $q.w, $q.x] } };
const r = await fetch($t.STAC, { method: 'POST', headers: { 'content-type': $q.h, accept: $q.i, 'user-agent': $t.k4 }, body: JSON.stringify(body) });
if (!r.ok) throw new Error('stac ' + r.status);
const d = await r.json(), seen = new Set();
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
const p = f.properties || {}, date = String(p.datetime || '').slice(0, 10), cloud = Math.round((p[$q.l] || 0) * 10) / 10;
try {
const ps = ev.satPixelOf(f.assets.scl, f, lat, lng); if (!ps) { tried.push({ date, cloud, error: $q.y }); continue; }
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
if (zero / N > 0.05) { tried[tried.length - 1].error = $q.z; continue; }
let lum = 0, exg = 0, m = 0;
for (let j = FR_HALF - 2; j <= FR_HALF + 2; j++) for (let i = FR_HALF - 2; i <= FR_HALF + 2; i++) {
const q = j * FR_PX + i, R = rgb[3 * q], G = rgb[3 * q + 1], B = rgb[3 * q + 2]; if (!R && !G && !B) continue;
lum += 0.299 * R + 0.587 * G + 0.114 * B; exg += 2 * G - R - B; m++;
}
const disp = new Uint8Array(rgb.length); for (let k = 0; k < rgb.length; k++) disp[k] = Math.min(255, Math.round(rgb[k] * 1.12));
const png = await ev.satEncodePng(disp, FR_PX, FR_PX, date.slice(0, 4));
return { status: 'ok', scene: { id: f.id, date, cloud, stac: $t.STAC.replace(/\/search$/, '') + $q.A + f.id, tci: f.assets.visual.href }, clear_at_pin: clear,
brightness: m ? Math.round(lum / m * 10) / 10 : null, greenness: m ? Math.round(exg / m * 10) / 10 : null, size: FR_PX, px_m: 10, png: $q.B + b64(png),
credit: $t.k5 + date.slice(0, 4), tried, listed: feats.length, read_kb: Math.round(stat.bytes / 1024), ms: Date.now() - t0 };
} catch (e) { tried.push({ date, cloud, error: String(e && e.message || e).slice(0, 60) }); }
}
return { status: feats.length ? $q.C : $q.D, tried, listed: feats.length, read_kb: Math.round(stat.bytes / 1024), ms: Date.now() - t0 };
}
async function frame(req, u, ctx) {
const lat = +u.searchParams.get('lat'), lng = +u.searchParams.get('lng'), today = new Date();
if (!(lat >= -80 && lat <= 84 && lng >= -180 && lng <= 180)) return out({ error: $t.k6 }, 400);
const b = qBounds(String(u.searchParams.get('q') || ''), today);
if (!b) return out({ error: $q.E + FR_START + $q.F }, 400);
const rl = Math.round(lat * 1e4) / 1e4, rg = Math.round(lng * 1e4) / 1e4;
const key = new Request(ORIGIN_G + $q.G + FR_V + '/' + rl + ',' + rg + '/' + b.q + (b.current ? '/' + today.toISOString().slice(0, 10) : ''));
const hit = await caches.default.match(key);
if (hit) { const r = new Response(hit.body, hit); r.headers.set($q.p, 'hit'); return r; }
const ip = req.headers.get($q.q) || 'x';
if (limited('f:' + ip, 240, 10 * 60e3)) return out({ error: $q.r, note: $s.k1 }, 429);
let res;
try { res = await frameRun(rl, rg, b); } catch (e) { return out({ q: b.q, from: b.from, to: b.to, status: $q.H, error: String(e && e.message || e).slice(0, 80) }, 502); }
const body = Object.assign({ v: FR_V, lat: rl, lng: rg, q: b.q, from: b.from, to: b.to, generated: today.toISOString(), source: $s.SRC, method: $t.k7 }, res);
const age = b.current ? 21600 : 2592000;
const headers = { 'content-type': $q.a, 'cache-control': $q.b + age, 'access-control-allow-origin': '*' };
if (res.status === 'ok' || res.status === $q.D || (res.status === $q.C && !res.tried.some(t => t.error))) ctx.waitUntil(caches.default.put(key, new Response(JSON.stringify(body), { headers })));
return new Response(JSON.stringify(body), { status: 200, headers: Object.assign({}, headers, { 'x-cache': 'miss' }) });
}
export async function handle(req, u, env, ctx) {
if (req.method === $q.I) return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET', 'access-control-max-age': '86400' } });
if (req.method !== 'GET') return out({ error: $q.J }, 405);
const p = u.pathname;
if (p === $q.K) { try { return await frame(req, u, ctx); } catch (e) { return out({ error: $q.L }, 502); } }
if (p === $q.M) { try { return await scenes(req, u, ctx); } catch (e) { return out({ error: $q.N }, 502); } }
if (p === $q.O) {
const id = String(u.searchParams.get('id') || '').trim().toUpperCase();
if (!/^[A-Z]{2,6} ?-\d{1,4}$/.test(id)) return out({ error: $q.P }, 400);
let d; try { d = await openData(); } catch (e) { return out({ error: $q.Q }, 502); }
const c = (d.cases || []).find(x => x.id === id);
if (!c) return out({ error: $q.R, id }, 404, 300);
const keep = ['id', $q.S, $q.T, $q.U, 'stage', 'done', 'delay', $q.V, $q.W, $q.X, $q.Y, 'flags', $q.Z, 'sat', $q.aa, $q.ab, 'units'];
const o = {}; keep.forEach(k => { if (c[k] !== undefined) o[k] = c[k]; });
return out({ updated: d.updated, project: o, page: $q.ac + encodeURIComponent(id), api: $t.k8 + encodeURIComponent(id),
sat_method: $s.k2 }, 200, 300);
}
if (p === $q.ad) {
return out({ on_demand: $t.k9, stac: $q.ae, cdse_worker_connected: !!(env.CDSE_CLIENT_ID && env.CDSE_CLIENT_SECRET),
optical_series: $q.af, radar_and_composites: $q.ag }, 200, 300);
}
return out({ error: $q.ah, endpoints: [$q.ai, $q.aj, $q.ak, $q.ad] }, 404);
}
