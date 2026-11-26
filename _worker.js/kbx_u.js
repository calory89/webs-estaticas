// comments: _notes/kolaboro-worker-comments.txt
import * as HZ from './kbx_p_hz.js';
import { TB } from './kbx_strings.js';
export const PATHS = /^\/api\/x\/u(\/|$)/;
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, OPTIONS' };
function out(o, s = 200, maxAge = 0) {
  return new Response(JSON.stringify(o), { status: s, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': maxAge ? 'public, max-age=' + maxAge : 'no-store', 'x-content-type-options': 'nosniff' }, CORS) });
}
const UA = { 'user-agent': 'KolaboroClimate/1.0 (+https://kolaboro.com/hazards/)' };
const ipOf = req => { const a = req.headers.get('cf-connecting-ip') || 'x'; return a.includes(':') ? a.split(':').slice(0, 4).join(':') + '::/64' : a; };
const hits = new Map();
async function allow(ctx, key, limit, ttl) {
const now = Date.now(), a = (hits.get(key) || []).filter(t => now - t < ttl * 1000);
if (a.length >= limit) return false;
a.push(now); hits.set(key, a); if (hits.size > 5000) hits.clear();
const k = new Request('https://kolaboro.com/__rlu/' + encodeURIComponent(key + '/' + Math.floor(now / (ttl * 1000))));
const hit = await caches.default.match(k); const n = hit ? (+(await hit.text()) || 0) : 0;
if (n >= limit) return false;
const p = caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=' + ttl } }));
if (ctx && ctx.waitUntil) ctx.waitUntil(p.catch(() => {})); else await p.catch(() => {});
return true;
}
async function get(url, opt = {}, ms = 15000) {
const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms);
try {
return await fetch(url, Object.assign({ headers: Object.assign({}, UA, opt.headers || {}), signal: ac.signal }, opt.cf ? { cf: opt.cf } : {}, opt.method ? { method: opt.method, body: opt.body } : {}));
} finally { clearTimeout(t); }
}
function pinOf(u) {
const a = u.searchParams.get('lat'), b = u.searchParams.get('lng'), lat = +a, lng = +b;
if (!a || !b || !(lat >= -60 && lat <= 75 && lng >= -180 && lng <= 180)) return null;
return [Math.round(lat * 1e4) / 1e4, Math.round(lng * 1e4) / 1e4];
}
async function cached(key, ctx, make, okFor) {
const k = new Request('https://kolaboro.com/__u/' + key);
const hit = await caches.default.match(k);
if (hit) { const r = new Response(hit.body, hit); r.headers.set('x-cache', 'hit'); return r; }
const body = await make();
const ttl = okFor(body);
if (ttl) ctx.waitUntil(caches.default.put(k, new Response(JSON.stringify(body), { headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=' + ttl }, CORS) })).catch(() => {}));
return out(body, 200, ttl ? Math.min(ttl, 86400) : 300);
}
const GCM = ['0000GFDL-ESM2M', '0000HadGEM2-ES', '00IPSL-CM5A-LR', 'MIROC-ESM-CHEM', '00000NorESM1-M'];
const SCEN = { rcp4p5: 'RCP4.5 (emissions peak around 2040, then fall)', rcp8p5: 'RCP8.5 (high emissions, no new climate policy)' };
const YEARS = [2030, 2050];
const F = {
river_base: 'inunriver_historical_000000000WATCH_1980_rp00100.tif',
coast_base: 'inuncoast_historical_nosub_hist_rp0100_0.tif',
river: (s, y, g) => 'inunriver_' + s + '_' + g + '_' + y + '_rp00100.tif',
coast50: (s, y) => 'inuncoast_' + s + '_nosub_' + y + '_rp0100_0_perc_50.tif',
coast95: (s, y) => 'inuncoast_' + s + '_nosub_' + y + '_rp0100_0.tif',
};
const TS = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 11: 4, 12: 8, 16: 8 };
const TAIL = 180000;
const TIFS = new Map();
async function rangeBytes(url, hdr) {
const r = await get(url, { headers: { range: hdr } }, 20000);
if (r.status !== 206) throw new Error('http ' + r.status);
const total = +(String(r.headers.get('content-range') || '').split('/')[1] || 0);
return { b: new Uint8Array(await r.arrayBuffer()), total };
}
async function tifMeta(url) {
if (TIFS.has(url)) return TIFS.get(url);
const p = (async () => {
const [h, t] = await Promise.all([rangeBytes(url, 'bytes=0-65535'), rangeBytes(url, 'bytes=-' + TAIL)]);
const head = h.b, tail = t.b, tail0 = t.total - tail.length;
const at = (off, n) => off + n <= head.length ? head.subarray(off, off + n) : off >= tail0 && off + n <= t.total ? tail.subarray(off - tail0, off - tail0 + n) : null;
const le = head[0] === 0x49, dv0 = new DataView(head.buffer, head.byteOffset, head.byteLength);
if (dv0.getUint16(2, le) !== 42) throw new Error('not a classic TIFF');
const ifdOff = dv0.getUint32(4, le);
const c = at(ifdOff, 2); if (!c) throw new Error('IFD outside the bytes read');
const n = new DataView(c.buffer, c.byteOffset, 2).getUint16(0, le);
const e = at(ifdOff + 2, n * 12); if (!e) throw new Error('IFD outside the bytes read');
const dv = new DataView(e.buffer, e.byteOffset, e.byteLength), tags = {};
for (let i = 0; i < n; i++) {
const p = i * 12, tag = dv.getUint16(p, le), typ = dv.getUint16(p + 2, le), cnt = dv.getUint32(p + 4, le), sz = (TS[typ] || 1) * cnt;
if (sz <= 4) tags[tag] = typ === 3 ? dv.getUint16(p + 8, le) : dv.getUint32(p + 8, le);
else tags[tag] = { off: dv.getUint32(p + 8, le), typ, cnt };
}
const arr = (tag, kind) => {
const x = tags[tag]; if (!x || typeof x !== 'object') return null;
const b = at(x.off, TS[x.typ] * x.cnt); if (!b) throw new Error('tag ' + tag + ' outside the bytes read');
const d = new DataView(b.buffer, b.byteOffset, b.byteLength), o = [];
for (let i = 0; i < x.cnt; i++) o.push(x.typ === 12 ? d.getFloat64(i * 8, le) : x.typ === 4 ? d.getUint32(i * 4, le) : x.typ === 3 ? d.getUint16(i * 2, le) : d.getUint8(i));
return kind === 'u32' ? Uint32Array.from(o) : o;
};
if (tags[322]) throw new Error('tiled TIFF, expected strips');
if ((tags[278] || 1) !== 1) throw new Error('expected one row per strip');
const scale = arr(33550), tie = arr(33922), nd = arr(42113);
const nodata = nd ? parseFloat(String.fromCharCode(...nd).replace(/\0/g, '')) : null;
return { url, le, head: new Uint8Array(0), W: tags[256], H: tags[257], bits: tags[258], comp: tags[259], pred: tags[317] || 1, fmt: tags[339] || 1,
rps: 1, offs: arr(273, 'u32'), cnts: arr(279, 'u32'), sx: scale[0], sy: scale[1], x0: tie[3], y0: tie[4], nodata };
})();
TIFS.set(url, p); p.catch(() => TIFS.delete(url));
if (TIFS.size > 48) TIFS.delete(TIFS.keys().next().value);
return p;
}
async function depthAt(file, lat, lng) {
const m = await tifMeta(TB.kbx_u__t.AQ + file);
const row = Math.floor((m.y0 - lat) / m.sy);
if (row < 0 || row >= m.H) return null;
const one = Object.assign({}, m, { offT: m.offs[row], cntT: m.cnts[row] });
const p = await HZ.pixel(one, lat, lng);
return p.value == null ? null : Math.max(0, Math.round(p.value * 100) / 100);
}
const med = a => { const v = a.slice().sort((x, y) => x - y), n = v.length; return n ? (n % 2 ? v[(n - 1) / 2] : Math.round((v[n / 2 - 1] + v[n / 2]) / 2 * 100) / 100) : null; };
async function climate(lat, lng) {
const t0 = Date.now(), files = [];
const job = (f) => { const p = depthAt(f, lat, lng).then(v => ({ f, ok: true, v }), e => ({ f, ok: false, why: String(e.message || e).slice(0, 80) })); files.push(p); return p; };
const rb = job(F.river_base), cb = job(F.coast_base);
const sc = [];
for (const s of Object.keys(SCEN)) for (const y of YEARS) sc.push({ s, y, river: GCM.map(g => job(F.river(s, y, g))), c50: job(F.coast50(s, y)), c95: job(F.coast95(s, y)) });
const all = await Promise.all(files);
const failed = all.filter(x => !x.ok);
const val = x => x.ok ? x.v : undefined;
const [rbv, cbv] = [await rb, await cb];
const scenarios = [];
for (const x of sc) {
const rv = await Promise.all(x.river), okv = rv.filter(r => r.ok), num = okv.filter(r => r.v != null).map(r => r.v);
const c50 = await x.c50, c95 = await x.c95;
scenarios.push({ scenario: x.s, scenario_name: SCEN[x.s], year: x.y,
river: { models_answered: okv.length, models_total: GCM.length, models_with_value: num.length,
median_m: num.length ? med(num) : null, min_m: num.length ? Math.min(...num) : null, max_m: num.length ? Math.max(...num) : null,
by_model: Object.fromEntries(GCM.map((g, i) => [g.replace(/^0+/, ''), rv[i].ok ? rv[i].v : 'unavailable'])) },
coast: { sea_level_50th_m: val(c50) === undefined ? 'unavailable' : val(c50), sea_level_95th_m: val(c95) === undefined ? 'unavailable' : val(c95) } });
}
return {
lat, lng, generated: new Date().toISOString(), ms: Date.now() - t0, return_period_years: 100, cell_m: 1000,
baseline: { river_m: rbv.ok ? rbv.v : 'unavailable', river_period: '1960 to 1999 climate (WATCH)', coast_m: cbv.ok ? cbv.v : 'unavailable', coast_period: '2010 sea level' },
scenarios,
files_read: all.length, files_failed: failed.length, failures: failed.slice(0, 6).map(x => ({ file: x.f, why: x.why })),
reading: TB.kbx_u__s.k0,
source: { name: TB.kbx_u__t.k0, url: TB.kbx_u__t.k1, license: 'CC BY 4.0' },
query: TB.kbx_u__t.AQ + TB.kbx_u__t.k2 + TB.kbx_u__t.AQ + F.river('rcp8p5', 2050, GCM[0]) + ')',
limits: TB.kbx_u__s.k1,
};
}
const R = d => d * Math.PI / 180;
function segKm(lat, lng, a, b) {
const kx = 111.32 * Math.cos(R(lat)), ky = 110.57;
const ax = (a.lon - lng) * kx, ay = (a.lat - lat) * ky, bx = (b.lon - lng) * kx, by = (b.lat - lat) * ky;
const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
let t = L ? -(ax * dx + ay * dy) / L : 0; t = Math.max(0, Math.min(1, t));
return Math.hypot(ax + t * dx, ay + t * dy);
}
export function mvt(b, want) {
let p = 0; const td = new TextDecoder(), layers = {};
const vint = () => { let x = 0, s = 0, c; do { c = b[p++]; x += (c & 0x7f) * 2 ** s; s += 7; } while (c & 0x80); return x; };
const sub = (end, fn) => { while (p < end) { const k = vint(); fn(k >> 3, k & 7); } };
const skip = w => { if (w === 0) vint(); else if (w === 1) p += 8; else if (w === 2) { const l = vint(); p += l; } else if (w === 5) p += 4; else throw new Error('bad tile'); };
const str = () => { const l = vint(), s = td.decode(b.subarray(p, p + l)); p += l; return s; };
const packed = () => { const l = vint(), e = p + l, o = []; while (p < e) o.push(vint()); return o; };
sub(b.length, (f, w) => {
if (f !== 3 || w !== 2) return skip(w);
const end = vint() + p; let name = '', extent = 4096; const keys = [], vals = [], feats = [];
sub(end, (f, w) => {
if (f === 1) name = str();
else if (f === 3) keys.push(str());
else if (f === 4) { const e = vint() + p; let v = null; sub(e, (f, w) => { if (f === 1) v = str(); else if (f === 4 || f === 5) v = vint(); else skip(w); }); vals.push(v); }
else if (f === 2) { const e = vint() + p; const ft = { tags: [], geom: [], type: 0 }; sub(e, (f, w) => { if (f === 2) ft.tags = packed(); else if (f === 3) ft.type = vint(); else if (f === 4) ft.geom = packed(); else skip(w); }); feats.push(ft); }
else if (f === 5) extent = vint();
else skip(w);
});
if (!want.includes(name)) return;
layers[name] = { extent, features: feats.filter(ft => ft.type === 3).map(ft => {
const props = {}; for (let i = 0; i < ft.tags.length; i += 2) props[keys[ft.tags[i]]] = vals[ft.tags[i + 1]];
const rings = []; let x = 0, y = 0, ring = null, i = 0;
while (i < ft.geom.length) {
const c = ft.geom[i++], id = c & 7, n = c >> 3;
if (id === 7) { if (ring && ring.length) ring.push(ring[0]); continue; }
for (let k = 0; k < n; k++) { const dx = ft.geom[i++], dy = ft.geom[i++]; x += (dx >>> 1) ^ -(dx & 1); y += (dy >>> 1) ^ -(dy & 1); if (id === 1) { ring = [[x, y]]; rings.push(ring); } else ring.push([x, y]); }
}
return { props, rings };
}) };
});
return layers;
}
const OFM_KIND = (layer, pr) => layer === 'landcover' ? (pr.subclass === 'mangrove' ? 'mangrove' : null)
: pr.class === 'national_park' ? 'national park' : pr.class === 'nature_reserve' ? 'nature reserve' : pr.class === 'protected_area' ? 'protected area' : pr.class ? String(pr.class).replace(/_/g, ' ').slice(0, 40) : 'protected area';
let OFM = null;
async function ofmTiles() {
if (OFM && Date.now() - OFM.t < 6 * 3600e3) return OFM.url;
const r = await get('https://tiles.openfreemap.org/planet', { cf: { cacheTtl: 3600, cacheEverything: true } }, 8000);
if (!r.ok) throw new Error('OpenFreeMap TileJSON ' + r.status);
const j = await r.json(), url = j && j.tiles && j.tiles[0];
if (!url || !/^https:\/\/tiles\.openfreemap\.org\//.test(url)) throw new Error('unexpected TileJSON');
OFM = { url, t: Date.now() }; return url;
}
async function osmProtected(lat, lng) {
const src = { name: TB.kbx_u__s.k2, url: 'https://openfreemap.org/', license: TB.kbx_u__t.k3 };
const limits = TB.kbx_u__s.k3;
const Z = 14, n = 2 ** Z, rad = 1, dy = rad / 110.57, dx = rad / (111.32 * Math.max(0.2, Math.cos(R(lat))));
const tx = lo => Math.floor((lo + 180) / 360 * n), ty = la => Math.floor((1 - Math.log(Math.tan(R(la)) + 1 / Math.cos(R(la))) / Math.PI) / 2 * n);
const x0 = tx(lng - dx), x1 = tx(lng + dx), y0 = ty(lat + dy), y1 = ty(lat - dy), px = tx(lng), py = ty(lat);
let tmpl;
try { tmpl = await ofmTiles(); } catch (e) { return { ok: false, why: String(e.message || e).slice(0, 80), source: src, limits }; }
const urls = [];
for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) urls.push({ x, y, url: tmpl.replace('{z}', Z).replace('{x}', x).replace('{y}', y) });
let tiles;
try {
tiles = await Promise.all(urls.map(async t => {
const r = await get(t.url, { cf: { cacheTtl: 86400 * 7, cacheEverything: true } }, 10000);
if (r.status === 204 || r.status === 404) return Object.assign(t, { layers: {} });
if (!r.ok) throw new Error('tile answered ' + r.status);
return Object.assign(t, { layers: mvt(new Uint8Array(await r.arrayBuffer()), ['park', 'landcover']) });
}));
} catch (e) { return { ok: false, why: String(e.message || e).slice(0, 80), source: src, query: urls.map(t => t.url), limits }; }
const found = new Map();
for (const t of tiles) {
for (const ly of ['park', 'landcover']) {
const L = t.layers[ly]; if (!L) continue;
const E = L.extent, toLL = (qx, qy) => ({ lon: (t.x + qx / E) / n * 360 - 180, lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * (t.y + qy / E) / n))) * 180 / Math.PI });
const pinX = ((lng + 180) / 360 * n - t.x) * E, pinY = ((1 - Math.log(Math.tan(R(lat)) + 1 / Math.cos(R(lat))) / Math.PI) / 2 * n - t.y) * E;
for (const f of L.features) {
const kind = OFM_KIND(ly, f.props); if (!kind) continue;
const name = String(f.props['name:en'] || f.props.name_en || f.props.name || '').slice(0, 90) || null;
const key = kind + '|' + (name || ('#' + t.x + '/' + t.y + '/' + L.features.indexOf(f)));
let inside = false, best = Infinity;
if (t.x === px && t.y === py) {
for (const r of f.rings) for (let i = 1, j = 0; i < r.length; j = i++) {
const [xi, yi] = r[i], [xj, yj] = r[j];
if ((yi > pinY) !== (yj > pinY) && pinX < (xj - xi) * (pinY - yi) / (yj - yi) + xi) inside = !inside;
}
}
for (const r of f.rings) for (let i = 1; i < r.length; i++) {
const a = r[i - 1], b = r[i];
if ((a[0] <= 0 && b[0] <= 0) || (a[0] >= E && b[0] >= E) || (a[1] <= 0 && b[1] <= 0) || (a[1] >= E && b[1] >= E)) continue;
best = Math.min(best, segKm(lat, lng, toLL(a[0], a[1]), toLL(b[0], b[1])));
}
const o = found.get(key) || { kind, name, inside: false, edge_km: Infinity };
o.inside = o.inside || inside; o.edge_km = Math.min(o.edge_km, best); found.set(key, o);
}
}
}
const list = [...found.values()].filter(o => o.inside || o.edge_km <= rad).map(o => ({ kind: o.kind, name: o.name, inside: o.inside,
boundary_m: o.edge_km === Infinity || o.edge_km > rad ? null : o.edge_km < 1 ? Math.round(o.edge_km * 100) * 10 : 1000 }));
list.sort((a, b) => (b.inside - a.inside) || ((a.boundary_m == null ? 1e9 : a.boundary_m) - (b.boundary_m == null ? 1e9 : b.boundary_m)));
const inside = list.filter(x => x.inside), near = list.filter(x => !x.inside);
return { ok: true, radius_m: 1000, zoom: Z, tiles_read: tiles.length, inside, near: near.slice(0, 12), near_total: near.length, source: src, query: urls.map(t => t.url), limits,
note: inside.length ? TB.kbx_u__t.k4 : near.length ? TB.kbx_u__t.k5 : TB.kbx_u__s.k4 };
}
const GMW = new Map();
async function gmwBlock(env, lonB, latB) {
const key = lonB + '_' + latB;
if (GMW.has(key)) return GMW.get(key);
const p = (async () => {
const path = '/data/mangroves/' + key + '.bin';
let r = env && env.ASSETS ? await env.ASSETS.fetch(new Request('https://kolaboro.com/_s/kolaboro.com' + path)).catch(() => null) : null;
if (!r || r.status === 404 || !r.ok) r = await get('https://kolaboro.com' + path, { cf: { cacheTtl: 86400 * 30, cacheEverything: true } }, 10000);
if (r.status === 404) return null;
if (!r.ok) throw new Error('mangrove index ' + r.status);
const b = new Uint8Array(await r.arrayBuffer()), dv = new DataView(b.buffer);
if (String.fromCharCode(b[0], b[1], b[2], b[3]) !== 'GMW1') { if (b[0] === 0x3c) return null; throw new Error('bad mangrove index'); }
const N = dv.getUint16(4, true), n = dv.getUint16(6, true), body = 8 + n * 16, tiles = new Map();
for (let i = 0; i < n; i++) { const o = 8 + i * 16; tiles.set(dv.getInt16(o, true) + '_' + dv.getInt16(o + 2, true), { cnt: dv.getUint32(o + 4, true), off: body + dv.getUint32(o + 8, true), len: dv.getUint32(o + 12, true), set: null }); }
return { N, b, tiles };
})();
GMW.set(key, p); p.catch(() => GMW.delete(key));
if (GMW.size > 20) GMW.delete(GMW.keys().next().value);
return p;
}
function tileSet(blk, t) {
if (t.set) return t.set;
const s = new Set(); let i = t.off, v = -1;
while (i < t.off + t.len) { let x = 0, sh = 0, c; do { c = blk.b[i++]; x |= (c & 0x7f) << sh; sh += 7; } while (c & 0x80); v += x + 1; s.add(v); }
t.set = s; return s;
}
async function mangroveGrid(lat, lng, env, radiusKm = 1) {
const src = { name: TB.kbx_u__s.k5, url: 'https://zenodo.org/records/6894273', license: 'CC BY 4.0' };
const limits = TB.kbx_u__s.k6;
const step = 1 / 500, dy = radiusKm / 110.57, dx = radiusKm / (111.32 * Math.max(0.2, Math.cos(R(lat))));
let best = Infinity, cells = 0;
try {
const kx = 111.32 * Math.cos(R(lat)), ky = 110.57;
for (let la = Math.floor((lat - dy) / step); la <= Math.floor((lat + dy) / step); la++) {
for (let lo = Math.floor((lng - dx) / step); lo <= Math.floor((lng + dx) / step); lo++) {
const cLat = la * step, cLng = lo * step;
const latTop = Math.floor(cLat + step / 2) + 1, lon0 = Math.floor(cLng + step / 2);
const lonB = Math.floor(lon0 / 45) * 45, latB = Math.floor((latTop - 1) / 45) * 45;
const blk = await gmwBlock(env, lonB, latB);
if (!blk) continue;
const t = blk.tiles.get(latTop + '_' + lon0); if (!t) continue;
const row = Math.floor((latTop - (cLat + step / 2)) * 500), col = Math.floor((cLng + step / 2 - lon0) * 500);
if (!tileSet(blk, t).has(row * 500 + col)) continue;
const ex = Math.max(0, cLng - lng, lng - (cLng + step)) * kx, ey = Math.max(0, cLat - lat, lat - (cLat + step)) * ky, d = Math.hypot(ex, ey);
if (d <= radiusKm) { cells++; best = Math.min(best, d); }
}
}
} catch (e) { return { ok: false, why: String(e.message || e).slice(0, 80), source: src, limits }; }
return { ok: true, radius_m: radiusKm * 1000, grid_m: 220, in_cell: best === 0, cells_within: cells, nearest_m: best === Infinity ? null : Math.round(best * 1000 / 10) * 10,
query: TB.kbx_u__s.k7, source: src, limits };
}
async function protectedAt(lat, lng, env) {
const t0 = Date.now();
const [osm, gmw] = await Promise.all([osmProtected(lat, lng), mangroveGrid(lat, lng, env)]);
return { lat, lng, generated: new Date().toISOString(), ms: Date.now() - t0, osm, mangroves: gmw,
not_used: { name: TB.kbx_u__t.k6, url: TB.kbx_u__t.k7,
why: TB.kbx_u__s.k8 } };
}
export async function handle(req, u, env, ctx) {
if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
if (req.method !== 'GET') return out({ error: 'GET only' }, 405);
const p = u.pathname.replace(/^\/api\/x\/u\/?/, '');
try {
if (p === 'climate' || p === 'protected') {
const pin = pinOf(u);
if (!pin) return out({ error: TB.kbx_u__t.k8 }, 400);
const [lat, lng] = pin;
const key = (p === 'climate' ? 'cl1/' : 'pa1/') + lat + ',' + lng;
const k = new Request('https://kolaboro.com/__u/' + key);
const hit = await caches.default.match(k);
if (hit) { const r = new Response(hit.body, hit); r.headers.set('x-cache', 'hit'); return r; }
if (!(await allow(ctx, 'u' + p + '/' + ipOf(req), 12, 600))) return out({ error: 'rate_limited', note: TB.kbx_u__s.k9 }, 429);
if (p === 'climate') return await cached(key, ctx, () => climate(lat, lng), b => b.files_failed ? 0 : 86400 * 30);
return await cached(key, ctx, () => protectedAt(lat, lng, env), b => (b.osm.ok && b.mangroves.ok) ? 86400 * 7 : 0);
}
if (p === '' || p === 'about') return out({ module: 'u', endpoints: {
'/api/x/u/climate?lat=&lng=': TB.kbx_u__s.k10,
'/api/x/u/protected?lat=&lng=': TB.kbx_u__s.k11 },
data: { '/data/night-lights.json': TB.kbx_u__t.k9, '/data/stalled-sites.json': TB.kbx_u__t.k10 },
pages: ['https://kolaboro.com/hazards/', 'https://kolaboro.com/satellite/night/'] }, 200, 3600);
} catch (e) { return out({ error: 'failed', detail: String(e.message || e).slice(0, 100) }, 502); }
return out({ error: 'not found' }, 404);
}
