// Feature module p for kolaboro.com: land. Natural hazards at a pin (/hazards/) and the zoning check status.
// Hazard figures come only from open sources read live (see kbx_p_hz.js); nothing is estimated. The pin is rounded to
// about 10 m, the answer is cached at the edge for 30 days, and the coordinates are not stored or logged anywhere else.
import * as HZ from './kbx_p_hz.js';
export const PATHS = /^\/api\/x\/p\//;

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, OPTIONS' };
function out(o, s = 200, maxAge = 0) {
  return new Response(JSON.stringify(o), { status: s, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': maxAge ? 'public, max-age=' + maxAge : 'no-store', 'x-content-type-options': 'nosniff' }, CORS) });
}
const ipOf = req => { const a = req.headers.get('cf-connecting-ip') || 'x'; return a.includes(':') ? a.split(':').slice(0, 4).join(':') + '::/64' : a; };
const hits = new Map();
async function allow(ctx, key, limit, ttl) {   // per-isolate window plus a fixed-window counter in the edge cache (soft, per data centre)
  const now = Date.now(), a = (hits.get(key) || []).filter(t => now - t < ttl * 1000);
  if (a.length >= limit) return false;
  a.push(now); hits.set(key, a); if (hits.size > 5000) hits.clear();
  const k = new Request('https://kolaboro.com/__rlp/' + encodeURIComponent(key + '/' + Math.floor(now / (ttl * 1000))));
  const hit = await caches.default.match(k); const n = hit ? (+(await hit.text()) || 0) : 0;
  if (n >= limit) return false;
  const p = caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=' + ttl } }));
  if (ctx && ctx.waitUntil) ctx.waitUntil(p.catch(() => {})); else await p.catch(() => {});
  return true;
}

const VERSION = 'hz3';
async function hazards(req, u, ctx) {
  const lat = +u.searchParams.get('lat'), lng = +u.searchParams.get('lng');
  if (!(lat >= -60 && lat <= 75 && lng >= -180 && lng <= 180) || !u.searchParams.get('lat') || !u.searchParams.get('lng')) return out({ error: 'need lat (-60..75) and lng (-180..180)' }, 400);
  const rl = Math.round(lat * 1e4) / 1e4, rg = Math.round(lng * 1e4) / 1e4;
  const key = new Request('https://kolaboro.com/__hzp/' + VERSION + '/' + rl + ',' + rg);
  const cache = caches.default;
  const hit = await cache.match(key);
  if (hit) { const r = new Response(hit.body, hit); r.headers.set('x-cache', 'hit'); return r; }
  if (!(await allow(ctx, 'hz/' + ipOf(req), 12, 600))) return out({ error: 'rate_limited', note: 'At most 12 new pins per 10 minutes from one address, so the free public sources behind this page are not overloaded. Pins already looked up by anyone stay instant.' }, 429);
  const body = await HZ.all(rl, rg);
  body.note = 'Each figure is read live from the public source named next to it. A source that did not answer is shown as unavailable, never estimated.';
  body.rounded_to = '4 decimals (about 10 m)';
  const failed = HZ.SOURCES.filter(k => !body[k] || !body[k].ok).length;
  const res = out(body, 200, failed ? 300 : 86400);
  if (failed < 2) {   // keep a good answer for 30 days at the edge; a partly failed one only briefly
    const c = new Response(JSON.stringify(body), { headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=' + (failed ? 3600 : 86400 * 30) }, CORS) });
    ctx.waitUntil(cache.put(key, c).catch(() => {}));
  }
  return res;
}

// Can the official Indonesian spatial plans be queried at a point? Checked live from this worker, cached for an hour.
const ZPROBE = [
  { id: 'gistaru', name: 'GISTARU (Kementerian ATR/BPN), national spatial plan viewer', url: 'https://gistaru.atrbpn.go.id/' },
  { id: 'gistaru_rest', name: 'GISTARU ArcGIS REST services directory', url: 'https://gistaru.atrbpn.go.id/arcgis/rest/services?f=json' },
  { id: 'gistaru_robots', name: 'GISTARU robots.txt', url: 'https://gistaru.atrbpn.go.id/robots.txt' },
  { id: 'bhumi', name: 'BHUMI (Kementerian ATR/BPN), land and spatial plan map', url: 'https://bhumi.atrbpn.go.id/' },
  { id: 'bhumi_robots', name: 'BHUMI robots.txt', url: 'https://bhumi.atrbpn.go.id/robots.txt' },
  { id: 'bhumi_wms', name: 'BHUMI GeoServer WMS capabilities', url: 'https://bhumi.atrbpn.go.id/geoserver/ows?service=WMS&request=GetCapabilities' },
  { id: 'geosvc_wms', name: 'ATR/BPN GeoServer (geosvc) WMS capabilities', url: 'https://geosvc.atrbpn.go.id/geoserver/ows?service=WMS&request=GetCapabilities' },
];
async function probe(p) {
  const t0 = Date.now();
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), 8000);
  try {
    const r = await fetch(p.url, { headers: { 'user-agent': 'KolaboroHazards/1.0 (+https://kolaboro.com/hazards/)' }, redirect: 'manual', signal: ac.signal });
    const txt = (await r.text()).slice(0, 4000);
    return { id: p.id, name: p.name, url: p.url, status: r.status, ms: Date.now() - t0, type: (r.headers.get('content-type') || '').slice(0, 40),
      services: p.id === 'gistaru_rest' && /"services"/.test(txt) ? (txt.match(/"name":"[^"]+"/g) || []).length : undefined,
      robots: /robots/.test(p.id) && r.status === 200 ? txt.split('\n').map(l => l.trim()).filter(l => /^(user-agent|disallow|allow|crawl-delay)/i.test(l)).slice(0, 12) : undefined,
      wms_capabilities: /_wms$/.test(p.id) && r.status === 200 ? /WMS_Capabilities|WMT_MS_Capabilities/.test(txt) : undefined };
  } catch (e) { return { id: p.id, name: p.name, url: p.url, status: null, error: String(e.name === 'AbortError' ? 'timeout after 8 s' : e.message || e).slice(0, 80), ms: Date.now() - t0 }; }
  finally { clearTimeout(t); }
}
async function zoning(req, u, ctx) {
  const key = new Request('https://kolaboro.com/__hzz/' + VERSION);
  const hit = await caches.default.match(key);
  if (hit) { const r = new Response(hit.body, hit); r.headers.set('x-cache', 'hit'); return r; }
  if (!(await allow(ctx, 'hzz/' + ipOf(req), 10, 600))) return out({ error: 'rate_limited' }, 429);
  const res = await Promise.all(ZPROBE.map(probe));
  const body = { checked: new Date().toISOString(), from: 'Cloudflare worker (kolaboro.com)', automated_lookup: false,
    reason: 'Kolaboro does not show a zone class: no official Indonesian spatial plan service answered a machine point query from our servers (results below), and we will not show a zone from an unofficial copy or a guess.',
    probes: res };
  const c = out(body, 200, 3600);
  ctx.waitUntil(caches.default.put(key, c.clone()).catch(() => {}));
  return c;
}

export async function handle(req, u, env, ctx) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'GET') return out({ error: 'GET only' }, 405);
  const p = u.pathname.replace(/^\/api\/x\/p\//, '');
  try {
    if (p === 'hazards') return await hazards(req, u, ctx);
    if (p === 'zoning') return await zoning(req, u, ctx);
    if (p === '' || p === 'about') return out({ endpoints: { '/api/x/p/hazards?lat=&lng=': 'natural hazards at a point from open sources', '/api/x/p/zoning': 'live check of the official Indonesian spatial plan services' }, page: 'https://kolaboro.com/hazards/' }, 200, 3600);
  } catch (e) { return out({ error: 'failed', detail: String(e.message || e).slice(0, 100) }, 502); }
  return out({ error: 'not found' }, 404);
}
