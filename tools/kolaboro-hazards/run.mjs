// Batch: natural hazards for every tracked project with coordinates and every public satellite-watch area.
// Usage: node run.mjs <core kbx_p_hz.js> <private ids.json> <public bali-cases.json> <satellite.json> <out hazards.json>
// The hazard code is the same file the live worker runs (fetched from pub/_lovable), so the page and the batch agree.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const [core, idsF, casesF, satF, outF] = process.argv.slice(2);
const HZ = await import(pathToFileURL(core).href);

// polite pacing per host (NOAA asks crawlers for a delay; Overpass and USGS ask for moderate use)
const GAP = { 'www.ngdc.noaa.gov': 5000, 'overpass-api.de': 2500, 'maps.mail.ru': 2500, 'earthquake.usgs.gov': 1000, 'webservices.volcano.si.edu': 1500 };
const last = {}, _fetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  const h = new URL(String(url)).host, g = GAP[h] || 0;
  if (g) { const now = Date.now(), at = Math.max(now, (last[h] || 0) + g); last[h] = at; if (at > now) await new Promise(r => setTimeout(r, at - now)); }
  // the core starts its timeout before this queue; give each request its own clock from the moment it is sent
  return _fetch(url, Object.assign({}, init, { signal: AbortSignal.timeout(30000) }));
};

const ids = JSON.parse(fs.readFileSync(idsF, 'utf8'));
const pub = new Map(JSON.parse(fs.readFileSync(casesF, 'utf8')).cases.map(c => [c.id, c.market]));
const sites = JSON.parse(fs.readFileSync(satF, 'utf8')).sites || [];
const band = m => m == null ? null : m < 200 ? 'under 200 m' : m < 500 ? '200 to 500 m' : m < 1000 ? '500 m to 1 km' : m < 2000 ? '1 to 2 km' : m < 5000 ? '2 to 5 km' : '5 to 10 km';
const fail = {}; const note = (k, r) => { if (!r || !r.ok) fail[k] = (fail[k] || 0) + 1; };

function compact(r, coarse) {   // coarse = a tracked project: rounded so the figures cannot pinpoint the plot
  const o = {}, e = r.elevation, f = r.flood, q = r.quakes, t = r.tsunami, v = r.volcano, c = r.coast;
  if (e && e.ok) o.elev_m = e.metres == null ? null : coarse ? (e.metres < 30 ? Math.round(e.metres) : Math.round(e.metres / 10) * 10) : e.metres;
  if (f && f.ok) { o.flood_river_m = f.river_depth_m; o.flood_coast_m = f.coast_depth_m; }
  if (q && q.ok) { o.quakes = { m5: q.m5, m6: q.m6, m7: q.m7 }; if (q.largest && q.largest[0]) o.quakes.max = { mag: q.largest[0].mag, year: q.largest[0].year, dist_km: coarse ? Math.round(q.largest[0].dist_km / 10) * 10 : q.largest[0].dist_km }; }
  if (t && t.ok) o.tsunami = { runups: t.runups, events: t.events, max_m: t.max_height_m, latest: t.latest_year };
  if (v && v.ok) o.volcano = v.nearest[0] ? { name: v.nearest[0].name, number: v.nearest[0].number, dist_km: coarse ? Math.round(v.nearest[0].dist_km / 5) * 5 : v.nearest[0].dist_km, last: v.nearest[0].last_eruption_year } : { none_within_km: v.radius_km };
  if (c && c.ok) o.coast = coarse ? (c.beyond ? 'over 10 km' : band(c.distance_m)) : (c.beyond ? null : c.distance_m);
  const miss = HZ.SOURCES.filter(k => !r[k] || !r[k].ok); if (miss.length) o.unavailable = miss;
  return o;
}

const t0 = Date.now(), areas = [], projects = {};
async function pool(items, n, fn) {   // a few points at a time; the per-host pacing above still applies to every request
  let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; await fn(items[k]); } }));
}
await pool(sites, 4, async s => {
  const r = await HZ.all(s.lat, s.lng); HZ.SOURCES.forEach(k => note(k, r[k]));
  areas.push(Object.assign({ id: s.id, label: s.label, lat: s.lat, lng: s.lng }, compact(r, false)));
  console.log('area', s.id, Math.round((Date.now() - t0) / 1000) + 's');
});
areas.sort((a, b) => sites.findIndex(x => x.id === a.id) - sites.findIndex(x => x.id === b.id));
let skipped = 0;
await pool(ids, 4, async p => {
  if (pub.get(p.id) !== p.market) { skipped++; return; }   // id rule drifted: never attach figures to the wrong project
  const r = await HZ.all(p.lat, p.lng); HZ.SOURCES.forEach(k => note(k, r[k]));
  projects[p.id] = compact(r, true);
  console.log('project', p.id, Math.round((Date.now() - t0) / 1000) + 's');
});
const out = {
  updated: new Date().toISOString().slice(0, 10), seconds: Math.round((Date.now() - t0) / 1000),
  method: 'For each point, the same code as the live page (/hazards/) reads: Copernicus DEM GLO-30 height (one 30 m cell), WRI Aqueduct Floods v2 100-year riverine and coastal flood depth (1 km cell), USGS ComCat earthquakes M5+ within 100 km since 1900, NOAA NCEI tsunami run-ups within 50 km, Smithsonian GVP Holocene volcanoes within 100 km, and the OpenStreetMap coastline within 10 km. Tracked projects: coordinates come from public sources and are about 100 m accurate; they are not published, and figures are rounded (height to 1 m under 30 m and 10 m above, coast distance in bands, distances to 5 or 10 km) so they cannot pinpoint a plot.',
  sources: {
    elevation: 'https://registry.opendata.aws/copernicus-dem/', flood: 'https://www.wri.org/data/aqueduct-floods-hazard-maps', quakes: 'https://earthquake.usgs.gov/fdsnws/event/1/',
    tsunami: 'https://www.ngdc.noaa.gov/hazard/tsu_db.shtml', volcano: 'https://volcano.si.edu/', coast: 'https://www.openstreetmap.org/copyright' },
  not_included: {
    'JRC global river flood hazard maps': 'Published as downloadable tiles without a point query service; Aqueduct (same family of global models, CC BY 4.0) is read instead.',
    'official zoning': 'No official Indonesian spatial plan service answered a machine point query; see /hazards/#zoning.' },
  counts: { areas: areas.length, projects: Object.keys(projects).length, skipped_id_mismatch: skipped, source_failures: fail },
  areas, projects };
fs.writeFileSync(outF, JSON.stringify(out));
console.log('done', out.counts);
