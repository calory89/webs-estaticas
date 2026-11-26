// comments: _notes/kolaboro-worker-comments.txt
import { TB } from './kbx_strings.js';
const UA = { 'user-agent': 'KolaboroHazards/1.0 (+https://kolaboro.com/hazards/)' };
const R = d => d * Math.PI / 180;
export function km(a, b, c, d) {
const x = Math.sin(R(c - a) / 2) ** 2 + Math.cos(R(a)) * Math.cos(R(c)) * Math.sin(R(d - b) / 2) ** 2;
return 12742 * Math.asin(Math.min(1, Math.sqrt(x)));
}
const r1 = x => Math.round(x * 10) / 10;
async function get(url, opt = {}, ms = 15000) {
const ac = typeof AbortController !== 'undefined' ? new AbortController() : null;
const t = ac ? setTimeout(() => ac.abort(), ms) : null;
try {
const r = await fetch(url, Object.assign({ headers: Object.assign({}, UA, opt.headers || {}), signal: ac && ac.signal }, opt.cf ? { cf: opt.cf } : {}, opt.method ? { method: opt.method, body: opt.body } : {}));
return r;
} finally { if (t) clearTimeout(t); }
}
async function range(url, a, n, cf) {
const r = await get(url, { headers: { range: 'bytes=' + a + '-' + (a + n - 1) }, cf });
if (r.status === 404 || r.status === 403) { const e = new Error('missing'); e.code = r.status; throw e; }
if (r.status !== 206 && r.status !== 200) throw new Error('http ' + r.status);
const b = new Uint8Array(await r.arrayBuffer());
return r.status === 200 ? b.subarray(a, a + n) : b;
}
const TS = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 11: 4, 12: 8, 16: 8 };
async function ifd(url, cf) {
let head = await range(url, 0, 65536, cf);
const le = head[0] === 0x49, dv0 = new DataView(head.buffer, head.byteOffset, head.byteLength);
if (dv0.getUint16(2, le) !== 42) throw new Error('not a classic TIFF');
const off = dv0.getUint32(4, le);
let buf = head, base = 0;
if (off + 4096 > head.length) { buf = await range(url, off, 4096, cf); base = off; }
const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
const n = dv.getUint16(off - base, le), tags = {};
const far = [];
for (let i = 0; i < n; i++) {
const p = off - base + 2 + i * 12, tag = dv.getUint16(p, le), typ = dv.getUint16(p + 2, le), cnt = dv.getUint32(p + 4, le), sz = (TS[typ] || 1) * cnt;
if (sz <= 4) { tags[tag] = cnt === 1 ? (typ === 3 ? dv.getUint16(p + 8, le) : dv.getUint32(p + 8, le)) : null; if (cnt > 1 && typ === 3) tags[tag] = [dv.getUint16(p + 8, le), dv.getUint16(p + 10, le)]; }
else tags[tag] = { off: dv.getUint32(p + 8, le), typ, cnt };
if (sz > 4) far.push(tag);
}
const val = async (tag, maxN) => {
const t = tags[tag]; if (!t || typeof t !== 'object') return t;
const sz = TS[t.typ] * Math.min(t.cnt, maxN || t.cnt);
const b = t.off + sz <= head.length ? head.subarray(t.off, t.off + sz) : await range(url, t.off, sz, cf);
const d = new DataView(b.buffer, b.byteOffset, b.byteLength), out = [];
for (let i = 0; i < sz / TS[t.typ]; i++) out.push(t.typ === 12 ? d.getFloat64(i * 8, le) : t.typ === 4 ? d.getUint32(i * 4, le) : t.typ === 3 ? d.getUint16(i * 2, le) : d.getUint8(i));
return out;
};
const scale = await val(33550), tie = await val(33922);
const nodataT = tags[42113]; let nodata = null;
if (nodataT) { const s = await val(42113); nodata = parseFloat(String.fromCharCode(...(Array.isArray(s) ? s : [])).replace(/\0/g, '')); }
return { url, le, head, cf, W: tags[256], H: tags[257], bits: tags[258], comp: tags[259], pred: tags[317] || 1, fmt: tags[339] || 1,
tw: tags[322], th: tags[323], rps: tags[278], offT: tags[324] || tags[273], cntT: tags[325] || tags[279],
sx: scale[0], sy: scale[1], x0: tie[3], y0: tie[4], nodata };
}
async function arrAt(m, t, i) {
if (typeof t === 'number') return t;
const p = t.off + i * 4;
const b = p + 4 <= m.head.length ? m.head.subarray(p, p + 4) : await range(m.url, p, 4, m.cf);
return new DataView(b.buffer, b.byteOffset, 4).getUint32(0, m.le);
}
async function inflate(u8) {
const s = new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate'));
return new Uint8Array(await new Response(s).arrayBuffer());
}
function lzw(src, need) {
const out = new Uint8Array(need), pre = new Int32Array(4096), suf = new Uint8Array(4096), len = new Uint16Array(4096), first = new Uint8Array(4096);
for (let i = 0; i < 256; i++) { pre[i] = -1; suf[i] = i; len[i] = 1; first[i] = i; }
let o = 0, bp = 0, nb = 9, next = 258, prev = -1; const nbits = src.length * 8;
while (o < need && bp + nb <= nbits) {
let c = 0; for (let i = 0; i < nb; i++, bp++) c = (c << 1) | ((src[bp >> 3] >> (7 - (bp & 7))) & 1);
if (c === 257) break;
if (c === 256) { next = 258; nb = 9; prev = -1; continue; }
let code = c;
if (prev >= 0) {
if (c >= next) { if (next < 4096) { pre[next] = prev; suf[next] = first[prev]; len[next] = len[prev] + 1; first[next] = first[prev]; next++; } }
else if (next < 4096) { pre[next] = prev; suf[next] = first[c]; len[next] = len[prev] + 1; first[next] = first[prev]; next++; }
} else if (c > 255) break;
const L = len[code]; let k = code;
for (let i = L - 1; i >= 0; i--) { if (o + i < need) out[o + i] = suf[k]; k = pre[k]; }
o += L; prev = code;
nb = next + 1 >= 2048 ? 12 : next + 1 >= 1024 ? 11 : next + 1 >= 512 ? 10 : 9;
}
return out;
}
export async function pixel(m, lat, lng) {
const col = Math.floor((lng - m.x0) / m.sx), row = Math.floor((m.y0 - lat) / m.sy);
if (col < 0 || row < 0 || col >= m.W || row >= m.H) return { value: null, outside: true };
const bps = m.bits / 8, tiled = !!m.tw;
const bw = tiled ? m.tw : m.W, rr = tiled ? row % m.th : row % (m.rps || 1), cc = tiled ? col % m.tw : col;
const idx = tiled ? Math.floor(row / m.th) * Math.ceil(m.W / m.tw) + Math.floor(col / m.tw) : Math.floor(row / (m.rps || 1));
const [o, n] = await Promise.all([arrAt(m, m.offT, idx), arrAt(m, m.cntT, idx)]);
if (!n) return { value: null, empty: true };
const raw = await range(m.url, o, n, m.cf);
const rowBytes = bw * bps, need = (rr + 1) * rowBytes;
let dec = m.comp === 1 ? raw : m.comp === 5 ? lzw(raw, need) : (m.comp === 8 || m.comp === 32946) ? await inflate(raw) : null;
if (!dec) throw new Error('compression ' + m.comp);
const line = dec.subarray(rr * rowBytes, (rr + 1) * rowBytes);
let bytes;
if (m.pred === 3) {
const c = Uint8Array.from(line); for (let i = 1; i < c.length; i++) c[i] = (c[i] + c[i - 1]) & 255;
bytes = new Uint8Array(bps); for (let b = 0; b < bps; b++) bytes[b] = c[(bps - b - 1) * bw + cc];
return finish(m, new DataView(bytes.buffer), true);
}
if (m.pred === 2) {
const d = new DataView(line.buffer, line.byteOffset, line.byteLength); let acc = 0;
for (let i = 0; i <= cc; i++) acc = (acc + (bps === 2 ? d.getInt16(i * 2, m.le) : d.getUint8(i))) | 0;
return { value: acc };
}
bytes = line.subarray(cc * bps, cc * bps + bps);
return finish(m, new DataView(bytes.buffer, bytes.byteOffset, bps), m.le);
}
function finish(m, d, le) {
const v = m.fmt === 3 ? (m.bits === 32 ? d.getFloat32(0, le) : d.getFloat64(0, le)) : m.bits === 16 ? (m.fmt === 2 ? d.getInt16(0, le) : d.getUint16(0, le)) : d.getUint8(0);
if (!isFinite(v) || (m.nodata != null && v === m.nodata) || v < -1e30) return { value: null, nodata: true };
return { value: v };
}
const META = new Map();
async function meta(url, cf) {
  if (META.has(url)) return META.get(url);
  const p = ifd(url, cf); META.set(url, p); p.catch(() => META.delete(url));
  if (META.size > 64) META.delete(META.keys().next().value);
  return p;
}
function demTile(lat, lng) {
const a = Math.floor(lat), b = Math.floor(lng);
const ns = (a < 0 ? 'S' : 'N') + String(Math.abs(a)).padStart(2, '0'), ew = (b < 0 ? 'W' : 'E') + String(Math.abs(b)).padStart(3, '0');
const n = 'Copernicus_DSM_COG_10_' + ns + '_00_' + ew + '_00_DEM';
return TB.kbx_p_hz__t.k0 + n + '/' + n + '.tif';
}
export async function elevation(lat, lng) {
const url = demTile(lat, lng);
const src = { name: TB.kbx_p_hz__t.k1, url: TB.kbx_p_hz__t.k2, license: TB.kbx_p_hz__s.k0 };
const limits = TB.kbx_p_hz__s.k1;
try {
const m = await meta(url, { cacheTtl: 86400 * 30, cacheEverything: true });
const p = await pixel(m, lat, lng);
if (p.value == null) return { ok: false, why: 'no DEM value at this point', source: src, query: url, limits };
return { ok: true, metres: r1(p.value), cell_m: 30, source: src, query: url, limits };
} catch (e) {
if (e.code === 404 || e.code === 403) return { ok: true, metres: null, ocean: true, note: TB.kbx_p_hz__t.k3, source: src, query: url, limits };
return { ok: false, why: String(e.message || e).slice(0, 80), source: src, query: url, limits };
}
}
const AQ = 'https://aqueduct.wridata.org/AqueductFloods20/';
const AQF = { river: 'inunriver_historical_000000000WATCH_1980_rp00100.tif', coast: 'inuncoast_historical_nosub_hist_rp0100_0.tif' };
export async function flood(lat, lng) {
const src = { name: TB.kbx_p_hz__t.k4, url: TB.kbx_p_hz__t.k5, license: 'CC BY 4.0' };
const limits = TB.kbx_p_hz__s.k2;
const one = async k => {
    const url = AQ + AQF[k];
    const m = await meta(url, { cacheTtl: 86400 * 30, cacheEverything: true });
    const p = await pixel(m, lat, lng);
    return p.value == null ? null : Math.max(0, Math.round(p.value * 100) / 100);
  };
try {
const [river, coast] = await Promise.all([one('river'), one('coast')]);
return { ok: true, return_period_years: 100, river_depth_m: river, coast_depth_m: coast, cell_m: 1000, note: TB.kbx_p_hz__s.k3, source: src, query: [AQ + AQF.river, AQ + AQF.coast], limits };
} catch (e) { return { ok: false, why: String(e.message || e).slice(0, 80), source: src, query: [AQ + AQF.river, AQ + AQF.coast], limits }; }
}
export async function quakes(lat, lng, radiusKm = 100) {
const q = TB.kbx_p_hz__s.k4 + lat.toFixed(3) + '&longitude=' + lng.toFixed(3) + '&maxradiuskm=' + radiusKm;
const src = { name: TB.kbx_p_hz__t.k6, url: TB.kbx_p_hz__t.k7, license: 'US Government work, public domain' };
const limits = TB.kbx_p_hz__s.k5;
try {
const r = await get(q, { cf: { cacheTtl: 86400, cacheEverything: true } }, 20000);
if (!r.ok) return { ok: false, why: 'USGS answered ' + r.status, source: src, query: q, limits };
const d = await r.json(), f = (d.features || []).filter(x => x && x.properties && x.geometry);
const ev = f.map(x => ({ mag: x.properties.mag, year: new Date(x.properties.time).getUTCFullYear(), date: new Date(x.properties.time).toISOString().slice(0, 10), place: String(x.properties.place || '').slice(0, 80),
depth_km: Math.round(x.geometry.coordinates[2]), dist_km: Math.round(km(lat, lng, x.geometry.coordinates[1], x.geometry.coordinates[0])), url: x.properties.url }));
const since = y => ev.filter(e => e.year >= y).length;
return { ok: true, radius_km: radiusKm, since: 1900, m5: ev.length, m6: ev.filter(e => e.mag >= 6).length, m7: ev.filter(e => e.mag >= 7).length, m5_since_1973: since(1973),
largest: ev.slice(0, 5), nearest_m6: ev.filter(e => e.mag >= 6).sort((a, b) => a.dist_km - b.dist_km)[0] || null, source: src, query: q, limits };
} catch (e) { return { ok: false, why: String(e.message || e).slice(0, 80), source: src, query: q, limits }; }
}
export async function tsunami(lat, lng, radiusKm = 50) {
const dy = radiusKm / 111, dx = radiusKm / (111 * Math.max(0.2, Math.cos(R(lat))));
const q = TB.kbx_p_hz__t.k8 + (lat - dy).toFixed(2) + '&maxLatitude=' + (lat + dy).toFixed(2) + '&minLongitude=' + (lng - dx).toFixed(2) + '&maxLongitude=' + (lng + dx).toFixed(2);
const src = { name: TB.kbx_p_hz__t.k9, url: TB.kbx_p_hz__t.k10, license: TB.kbx_p_hz__t.k11 };
const limits = TB.kbx_p_hz__s.k6;
try {
const r = await get(q, { cf: { cacheTtl: 86400 * 7, cacheEverything: true } }, 20000);
if (!r.ok) return { ok: false, why: 'NOAA answered ' + r.status, source: src, query: q, limits };
const d = await r.json();
const ev = (d.items || []).filter(x => x.latitude != null && x.longitude != null && x.doubtful !== 'y').map(x => ({ year: x.year, height_m: x.runupHt != null ? x.runupHt : null, place: String(x.locationName || '').slice(0, 60),
dist_km: Math.round(km(lat, lng, x.latitude, x.longitude) * 10) / 10, deaths: x.deaths != null ? x.deaths : null, event: x.tsunamiEventId })).filter(x => x.dist_km <= radiusKm);
ev.sort((a, b) => (b.height_m || 0) - (a.height_m || 0));
const events = new Set(ev.map(x => x.event)).size;
return { ok: true, radius_km: radiusKm, runups: ev.length, events, max_height_m: ev.length && ev[0].height_m != null ? ev[0].height_m : null,
latest_year: ev.reduce((m, x) => Math.max(m, x.year || 0), 0) || null, top: ev.slice(0, 5), source: src, query: q, limits };
} catch (e) { return { ok: false, why: String(e.message || e).slice(0, 80), source: src, query: q, limits }; }
}
export async function volcano(lat, lng, radiusKm = 100) {
const dy = radiusKm / 111, dx = radiusKm / (111 * Math.max(0.2, Math.cos(R(lat))));
const q = TB.kbx_p_hz__s.k7 +
[(lng - dx).toFixed(2), (lat - dy).toFixed(2), (lng + dx).toFixed(2), (lat + dy).toFixed(2)].join(',');
const src = { name: TB.kbx_p_hz__t.k12, url: 'https://volcano.si.edu/', license: TB.kbx_p_hz__t.k13 };
const limits = TB.kbx_p_hz__s.k8;
try {
const r = await get(q, { cf: { cacheTtl: 86400 * 7, cacheEverything: true } }, 20000);
if (!r.ok) return { ok: false, why: 'GVP answered ' + r.status, source: src, query: q, limits };
const d = await r.json();
const v = (d.features || []).map(f => ({ name: f.properties.Volcano_Name, number: f.properties.Volcano_Number, last_eruption_year: f.properties.Last_Eruption_Year != null ? f.properties.Last_Eruption_Year : null,
type: f.properties.Primary_Volcano_Type || null, dist_km: Math.round(km(lat, lng, f.geometry.coordinates[1], f.geometry.coordinates[0]) * 10) / 10,
url: TB.kbx_p_hz__t.k14 + f.properties.Volcano_Number })).filter(x => x.dist_km <= radiusKm).sort((a, b) => a.dist_km - b.dist_km);
return { ok: true, radius_km: radiusKm, count: v.length, nearest: v.slice(0, 4), source: src, query: q, limits };
} catch (e) { return { ok: false, why: String(e.message || e).slice(0, 80), source: src, query: q, limits }; }
}
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
function segKm(lat, lng, a, b) {
const kx = 111.32 * Math.cos(R(lat)), ky = 110.57;
const ax = (a.lon - lng) * kx, ay = (a.lat - lat) * ky, bx = (b.lon - lng) * kx, by = (b.lat - lat) * ky;
const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
let t = L ? -(ax * dx + ay * dy) / L : 0; t = Math.max(0, Math.min(1, t));
return Math.hypot(ax + t * dx, ay + t * dy);
}
export async function coast(lat, lng, radiusKm = 10, opt = {}) {
const ql = '[out:json][timeout:18];way(around:' + radiusKm * 1000 + ',' + lat.toFixed(5) + ',' + lng.toFixed(5) + ')[natural=coastline];out geom;';
const src = { name: TB.kbx_p_hz__t.k15, url: TB.kbx_p_hz__t.k16, license: 'ODbL, (c) OpenStreetMap contributors' };
const limits = TB.kbx_p_hz__s.k9;
const query = 'https://overpass-turbo.eu/?Q=' + encodeURIComponent(ql) + '&R';
const one = async ep => {   // both public servers are asked at once; the first valid answer wins (one is often slow)
    const r = await get(ep, { method: 'POST', body: 'data=' + encodeURIComponent(ql), headers: { 'content-type': 'application/x-www-form-urlencoded' } }, opt.overpassMs || 9000);
    if (!r.ok) throw new Error('Overpass answered ' + r.status);
    const d = await r.json();
    if (d.remark && /error|timed out/i.test(d.remark)) throw new Error('Overpass: ' + String(d.remark).slice(0, 60));
    let best = Infinity;
    for (const w of d.elements || []) { const g = w.geometry || []; for (let i = 1; i < g.length; i++) best = Math.min(best, segKm(lat, lng, g[i - 1], g[i])); }
    return { best, ep };
  };
let lastErr = '';
const ne = neCoast(lat, lng, radiusKm, opt).catch(e => ({ ok: false, why: String(e.message || e).slice(0, 60) }));
try {
const { best, ep } = await Promise.any(OVERPASS.map(one));
if (best === Infinity) return { ok: true, within_km: radiusKm, distance_m: null, beyond: true, source: src, query, limits };
return { ok: true, within_km: radiusKm, distance_m: best < 1 ? Math.round(best * 1000 / 10) * 10 : Math.round(best * 1000 / 50) * 50, source: src, query, limits, endpoint: ep.replace(/\/api\/interpreter$/, '') };
} catch (e) { lastErr = e && e.errors ? e.errors.map(x => String(x.message || x).slice(0, 50)).join('; ') : String(e.message || e).slice(0, 80); }
const f = await ne;
if (f.ok) { f.osm_failed = lastErr || 'no Overpass server answered'; return f; }
return { ok: false, why: (lastErr || 'no Overpass server answered') + '; fallback: ' + f.why, source: src, limits };
}
const NE_SRC = { name: 'Natural Earth 1:10m land outline (fallback, used because no OpenStreetMap server answered)', url: 'https://www.naturalearthdata.com/about/terms-of-use/', license: 'Public domain (Natural Earth), redistributed by world-atlas 2.0.2' };
async function neCoast(lat, lng, radiusKm, opt) {
const tx = Math.floor((lng + 180) / 10) * 10 - 180, ty = Math.floor((lat + 90) / 10) * 10 - 90;
const path = '/data/coast/' + tx + '.json';
const query = 'https://kolaboro.com' + path;
const r = opt.asset ? await opt.asset(path) : await get(query, { cf: { cacheTtl: 86400 * 30, cacheEverything: true } }, 8000);
if (!r.ok) throw new Error('outline tile ' + r.status);
const c = await r.json(), [sx, sy] = c.s, [ox, oy] = c.t, d = { l: (c.tiles || {})[String(ty)] };
if (!d.l) throw new Error('outline tile missing ' + tx + ' ' + ty);
let best = Infinity;
for (const e of d.l) {
let x = e[0], y = e[1], prev = { lon: ox + x * sx, lat: oy + y * sy };
for (let i = 2; i < e.length; i += 2) { x += e[i]; y += e[i + 1]; const cur = { lon: ox + x * sx, lat: oy + y * sy }; best = Math.min(best, segKm(lat, lng, prev, cur)); prev = cur; }
}
if (!(best <= radiusKm)) return { ok: true, approx: true, within_km: radiusKm, distance_m: null, beyond: true, source: NE_SRC, query, limits: TB.kbx_p_hz__s.NE_LIMITS };
return best < 1 ? { ok: true, approx: true, within_km: radiusKm, distance_m: null, under_m: 1000, source: NE_SRC, query, limits: TB.kbx_p_hz__s.NE_LIMITS }
: { ok: true, approx: true, within_km: radiusKm, distance_m: Math.round(best * 2) * 500, source: NE_SRC, query, limits: TB.kbx_p_hz__s.NE_LIMITS };
}
export const SOURCES = ['elevation', 'flood', 'quakes', 'tsunami', 'volcano', 'coast'];
export async function all(lat, lng, opt = {}) {
const t0 = Date.now();
const [e, f, q, t, v, c] = await Promise.all([elevation(lat, lng), flood(lat, lng), quakes(lat, lng), tsunami(lat, lng), volcano(lat, lng), coast(lat, lng, 10, opt)]);
return { lat, lng, generated: new Date().toISOString(), ms: Date.now() - t0, elevation: e, flood: f, quakes: q, tsunami: t, volcano: v, coast: c };
}
