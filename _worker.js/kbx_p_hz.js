// Natural hazards at a point, read straight from open sources. No account, no key, no imports: the same file runs in the
// worker (kbx_p.js, live pins) and in the GitHub Actions batch (tools/kolaboro-hazards, tracked projects).
// Every function returns { ok, ...figures, source, query, limits } or { ok: false, why }. Nothing is estimated or filled in.

const UA = { 'user-agent': 'KolaboroHazards/1.0 (+https://kolaboro.com/hazards/)' };
const R = d => d * Math.PI / 180;
export function km(a, b, c, d) {   // haversine, km
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

// ---------- minimal GeoTIFF reader: first IFD, tiles or strips, deflate or LZW, predictor 1/2/3, float32 or int16 ----------
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
  const val = async (tag, maxN) => {   // read a small array tag (geo tags); big offset arrays are read on demand
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
async function arrAt(m, t, i) {   // entry i of a LONG array tag
  if (typeof t === 'number') return t;
  const p = t.off + i * 4;
  const b = p + 4 <= m.head.length ? m.head.subarray(p, p + 4) : await range(m.url, p, 4, m.cf);
  return new DataView(b.buffer, b.byteOffset, 4).getUint32(0, m.le);
}
async function inflate(u8) {
  const s = new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(s).arrayBuffer());
}
function lzw(src, need) {   // TIFF LZW (MSB first, early change), table-based; stops once `need` bytes are out
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
  if (m.pred === 3) {   // floating point predictor: undo byte differencing, then un-shuffle the byte planes
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

// ---------- 1. Elevation: Copernicus DEM GLO-30 (AWS Open Data) ----------
function demTile(lat, lng) {
  const a = Math.floor(lat), b = Math.floor(lng);
  const ns = (a < 0 ? 'S' : 'N') + String(Math.abs(a)).padStart(2, '0'), ew = (b < 0 ? 'W' : 'E') + String(Math.abs(b)).padStart(3, '0');
  const n = 'Copernicus_DSM_COG_10_' + ns + '_00_' + ew + '_00_DEM';
  return 'https://copernicus-dem-30m.s3.amazonaws.com/' + n + '/' + n + '.tif';
}
export async function elevation(lat, lng) {
  const url = demTile(lat, lng);
  const src = { name: 'Copernicus DEM GLO-30 (ESA / European Union), AWS Open Data', url: 'https://registry.opendata.aws/copernicus-dem/', license: 'Copernicus DEM licence: free use with attribution. Produced using Copernicus WorldDEM-30 (c) DLR e.V. 2010-2014 and (c) Airbus Defence and Space GmbH 2014-2018, provided under COPERNICUS by the European Union and ESA.' };
  const limits = 'A surface model, not bare ground: on a built or wooded spot it measures the top of roofs and trees. One cell is about 30 m. Data acquired 2011 to 2015. Absolute vertical accuracy is specified as better than 4 m (90%). Heights are above the EGM2008 geoid, roughly mean sea level, not above the local tide datum.';
  try {
    const m = await meta(url, { cacheTtl: 86400 * 30, cacheEverything: true });
    const p = await pixel(m, lat, lng);
    if (p.value == null) return { ok: false, why: 'no DEM value at this point', source: src, query: url, limits };
    return { ok: true, metres: r1(p.value), cell_m: 30, source: src, query: url, limits };
  } catch (e) {
    if (e.code === 404 || e.code === 403) return { ok: true, metres: null, ocean: true, note: 'No Copernicus DEM tile covers this square degree: the DEM leaves out tiles that are all sea.', source: src, query: url, limits };
    return { ok: false, why: String(e.message || e).slice(0, 80), source: src, query: url, limits };
  }
}

// ---------- 2. Flood depth: WRI Aqueduct Floods v2 (riverine and coastal, 100-year return period, baseline) ----------
const AQ = 'https://aqueduct.wridata.org/AqueductFloods20/';
const AQF = { river: 'inunriver_historical_000000000WATCH_1980_rp00100.tif', coast: 'inuncoast_historical_nosub_hist_rp0100_0.tif' };
export async function flood(lat, lng) {
  const src = { name: 'WRI Aqueduct Floods Hazard Maps v2 (World Resources Institute)', url: 'https://www.wri.org/data/aqueduct-floods-hazard-maps', license: 'CC BY 4.0' };
  const limits = 'A global model on a grid of about 1 km (30 arc-seconds): one value covers a whole neighbourhood, so a plot on a hill inside a flooded cell can be dry, and a drained plot in a dry cell can still flood. Flood defences are not modelled. Riverine baseline uses 1960 to 1999 climate (WATCH), coastal baseline is 2010 sea level without subsidence. Flash floods from heavy rain on small streams and drainage failures are not in this model.';
  const one = async k => {
    const url = AQ + AQF[k];
    const m = await meta(url, { cacheTtl: 86400 * 30, cacheEverything: true });
    const p = await pixel(m, lat, lng);
    return p.value == null ? null : Math.max(0, Math.round(p.value * 100) / 100);
  };
  try {
    const [river, coast] = await Promise.all([one('river'), one('coast')]);
    return { ok: true, return_period_years: 100, river_depth_m: river, coast_depth_m: coast, cell_m: 1000, note: 'null means the model has no value in this cell (for rivers: no modelled river network there; for the coast: outside the coastal model). 0 means modelled and not flooded.', source: src, query: [AQ + AQF.river, AQ + AQF.coast], limits };
  } catch (e) { return { ok: false, why: String(e.message || e).slice(0, 80), source: src, query: [AQ + AQF.river, AQ + AQF.coast], limits }; }
}

// ---------- 3. Earthquakes: USGS ComCat (FDSN event service) ----------
export async function quakes(lat, lng, radiusKm = 100) {
  const q = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=1900-01-01&minmagnitude=5&orderby=magnitude&limit=2000&latitude=' + lat.toFixed(3) + '&longitude=' + lng.toFixed(3) + '&maxradiuskm=' + radiusKm;
  const src = { name: 'USGS ANSS Comprehensive Earthquake Catalog (ComCat), FDSN event web service', url: 'https://earthquake.usgs.gov/fdsnws/event/1/', license: 'US Government work, public domain' };
  const limits = 'Counts recorded events, not shaking at your plot or the chance of a future one. The catalogue is incomplete for older and smaller events: before the 1960s many M5 to M6 events in remote regions are missing. Depth matters: a deep M6 is often felt less than a shallow M5. For design ground shaking, ask for the national seismic code value for the site.';
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

// ---------- 4. Tsunami run-ups: NOAA NCEI Global Historical Tsunami Database ----------
export async function tsunami(lat, lng, radiusKm = 50) {
  const dy = radiusKm / 111, dx = radiusKm / (111 * Math.max(0.2, Math.cos(R(lat))));
  const q = 'https://www.ngdc.noaa.gov/hazel/hazard-service/api/v1/tsunamis/runups?minLatitude=' + (lat - dy).toFixed(2) + '&maxLatitude=' + (lat + dy).toFixed(2) + '&minLongitude=' + (lng - dx).toFixed(2) + '&maxLongitude=' + (lng + dx).toFixed(2);
  const src = { name: 'NOAA NCEI / WDS Global Historical Tsunami Database', url: 'https://www.ngdc.noaa.gov/hazard/tsu_db.shtml', license: 'US Government work, public domain. doi:10.7289/V5PN93H7' };
  const limits = 'Observed run-ups: places where a tsunami reached and someone measured or reported the height. No record nearby does not mean no risk; it can mean nobody measured. Heights are local and can vary a lot along one bay.';
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

// ---------- 5. Volcanoes: Smithsonian Global Volcanism Program, Volcanoes of the World ----------
export async function volcano(lat, lng, radiusKm = 100) {
  const dy = radiusKm / 111, dx = radiusKm / (111 * Math.max(0.2, Math.cos(R(lat))));
  const q = 'https://webservices.volcano.si.edu/geoserver/GVP-VOTW/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GVP-VOTW:Smithsonian_VOTW_Holocene_Volcanoes&outputFormat=application/json&bbox=' +
    [(lng - dx).toFixed(2), (lat - dy).toFixed(2), (lng + dx).toFixed(2), (lat + dy).toFixed(2)].join(',');
  const src = { name: 'Smithsonian Institution Global Volcanism Program, Volcanoes of the World (Holocene volcanoes)', url: 'https://volcano.si.edu/', license: 'Cite as: Global Volcanism Program, Smithsonian Institution, Volcanoes of the World database' };
  const limits = 'Distance to the summit point of each volcano active in the last 11,700 years. Ash fall, lahars (mud flows down river valleys) and exclusion zones depend on wind, terrain and the eruption, not on distance alone. For an official hazard zone, check the national volcano agency map (in Indonesia: PVMBG, magma.esdm.go.id).';
  try {
    const r = await get(q, { cf: { cacheTtl: 86400 * 7, cacheEverything: true } }, 20000);
    if (!r.ok) return { ok: false, why: 'GVP answered ' + r.status, source: src, query: q, limits };
    const d = await r.json();
    const v = (d.features || []).map(f => ({ name: f.properties.Volcano_Name, number: f.properties.Volcano_Number, last_eruption_year: f.properties.Last_Eruption_Year != null ? f.properties.Last_Eruption_Year : null,
      type: f.properties.Primary_Volcano_Type || null, dist_km: Math.round(km(lat, lng, f.geometry.coordinates[1], f.geometry.coordinates[0]) * 10) / 10,
      url: 'https://volcano.si.edu/volcano.cfm?vn=' + f.properties.Volcano_Number })).filter(x => x.dist_km <= radiusKm).sort((a, b) => a.dist_km - b.dist_km);
    return { ok: true, radius_km: radiusKm, count: v.length, nearest: v.slice(0, 4), source: src, query: q, limits };
  } catch (e) { return { ok: false, why: String(e.message || e).slice(0, 80), source: src, query: q, limits }; }
}

// ---------- 6. Distance to the coastline: OpenStreetMap natural=coastline via the Overpass API ----------
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
function segKm(lat, lng, a, b) {   // point to segment on a local flat projection (fine at these distances)
  const kx = 111.32 * Math.cos(R(lat)), ky = 110.57;
  const ax = (a.lon - lng) * kx, ay = (a.lat - lat) * ky, bx = (b.lon - lng) * kx, by = (b.lat - lat) * ky;
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
  let t = L ? -(ax * dx + ay * dy) / L : 0; t = Math.max(0, Math.min(1, t));
  return Math.hypot(ax + t * dx, ay + t * dy);
}
export async function coast(lat, lng, radiusKm = 10) {
  const ql = '[out:json][timeout:18];way(around:' + radiusKm * 1000 + ',' + lat.toFixed(5) + ',' + lng.toFixed(5) + ')[natural=coastline];out geom;';
  const src = { name: 'OpenStreetMap coastline (natural=coastline), queried with the Overpass API', url: 'https://www.openstreetmap.org/copyright', license: 'ODbL, (c) OpenStreetMap contributors' };
  const limits = 'Straight-line distance to the mapped high-water line, as drawn by OpenStreetMap volunteers. Accuracy is usually tens of metres on popular coasts and can be worse elsewhere. Rivers, lagoons and estuaries are not coastline here.';
  const query = 'https://overpass-turbo.eu/?Q=' + encodeURIComponent(ql) + '&R';
  const one = async ep => {   // both public servers are asked at once; the first valid answer wins (one is often slow)
    const r = await get(ep, { method: 'POST', body: 'data=' + encodeURIComponent(ql), headers: { 'content-type': 'application/x-www-form-urlencoded' } }, 20000);
    if (!r.ok) throw new Error('Overpass answered ' + r.status);
    const d = await r.json();
    if (d.remark && /error|timed out/i.test(d.remark)) throw new Error('Overpass: ' + String(d.remark).slice(0, 60));
    let best = Infinity;
    for (const w of d.elements || []) { const g = w.geometry || []; for (let i = 1; i < g.length; i++) best = Math.min(best, segKm(lat, lng, g[i - 1], g[i])); }
    return { best, ep };
  };
  let lastErr = '';
  try {
    const { best, ep } = await Promise.any(OVERPASS.map(one));
    if (best === Infinity) return { ok: true, within_km: radiusKm, distance_m: null, beyond: true, source: src, query, limits };
    return { ok: true, within_km: radiusKm, distance_m: best < 1 ? Math.round(best * 1000 / 10) * 10 : Math.round(best * 1000 / 50) * 50, source: src, query, limits, endpoint: ep.replace(/\/api\/interpreter$/, '') };
  } catch (e) { lastErr = e && e.errors ? e.errors.map(x => String(x.message || x).slice(0, 50)).join('; ') : String(e.message || e).slice(0, 80); }
  return { ok: false, why: lastErr || 'no Overpass server answered', source: src, limits };
}

export const SOURCES = ['elevation', 'flood', 'quakes', 'tsunami', 'volcano', 'coast'];
export async function all(lat, lng) {
  const t0 = Date.now();
  const [e, f, q, t, v, c] = await Promise.all([elevation(lat, lng), flood(lat, lng), quakes(lat, lng), tsunami(lat, lng), volcano(lat, lng), coast(lat, lng)]);
  return { lat, lng, generated: new Date().toISOString(), ms: Date.now() - t0, elevation: e, flood: f, quakes: q, tsunami: t, volcano: v, coast: c };
}
