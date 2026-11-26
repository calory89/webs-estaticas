// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_p__q, $s = TB.kbx_p__s, $t = TB.kbx_p__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import * as HZ from './kbx_p_hz.js';
import { TB } from './kbx_strings.js';
export const PATHS = /^\/api\/x\/p\//;
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, OPTIONS' };
function out(o, s = 200, maxAge = 0) {
  return new Response(JSON.stringify(o), { status: s, headers: Object.assign({ 'content-type': $q.a, 'cache-control': maxAge ? $q.b + maxAge : $q.c, 'x-content-type-options': $q.d }, CORS) });
}
const ipOf = req => { const a = req.headers.get($q.e) || 'x'; return a.includes(':') ? a.split(':').slice(0, 4).join(':') + '::/64' : a; };
const hits = new Map();
async function allow(ctx, key, limit, ttl) {
const now = Date.now(), a = (hits.get(key) || []).filter(t => now - t < ttl * 1000);
if (a.length >= limit) return false;
a.push(now); hits.set(key, a); if (hits.size > 5000) hits.clear();
const k = new Request($q.f + encodeURIComponent(key + '/' + Math.floor(now / (ttl * 1000))));
const hit = await caches.default.match(k); const n = hit ? (+(await hit.text()) || 0) : 0;
if (n >= limit) return false;
const p = caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': $q.g + ttl } }));
if (ctx && ctx.waitUntil) ctx.waitUntil(p.catch(() => {})); else await p.catch(() => {});
return true;
}
const VERSION = 'hz4';
async function hazards(req, u, ctx, env) {
const lat = +u.searchParams.get('lat'), lng = +u.searchParams.get('lng');
if (!(lat >= -60 && lat <= 75 && lng >= -180 && lng <= 180) || !u.searchParams.get('lat') || !u.searchParams.get('lng')) return out({ error: $t.k0 }, 400);
const rl = Math.round(lat * 1e4) / 1e4, rg = Math.round(lng * 1e4) / 1e4;
const key = new Request($q.h + VERSION + '/' + rl + ',' + rg);
const cache = caches.default;
const hit = await cache.match(key);
if (hit) { const r = new Response(hit.body, hit); r.headers.set($q.i, 'hit'); return r; }
if (!(await allow(ctx, 'hz/' + ipOf(req), 12, 600))) return out({ error: $q.j, note: $s.k0 }, 429);
const body = await HZ.all(rl, rg, env && env.ASSETS ? { asset: p => env.ASSETS.fetch(new Request($q.k + p)) } : {});
body.note = $s.k1;
body.rounded_to = $q.l;
const failed = HZ.SOURCES.filter(k => !body[k] || !body[k].ok).length;
const res = out(body, 200, failed ? 300 : 86400);
if (failed < 2) {
const c = new Response(JSON.stringify(body), { headers: Object.assign({ 'content-type': $q.a, 'cache-control': $q.b + (failed ? 3600 : 86400 * 30) }, CORS) });
ctx.waitUntil(cache.put(key, c).catch(() => {}));
}
return res;
}
async function probe(p) {
const t0 = Date.now();
const ac = new AbortController(), t = setTimeout(() => ac.abort(), 8000);
try {
const r = await fetch(p.url, { headers: { 'user-agent': $t.k1 }, redirect: $q.m, signal: ac.signal });
const txt = (await r.text()).slice(0, 4000);
return { id: p.id, name: p.name, url: p.url, status: r.status, ms: Date.now() - t0, type: (r.headers.get($q.n) || '').slice(0, 40),
services: p.id === $q.o && /"services"/.test(txt) ? (txt.match(/"name":"[^"]+"/g) || []).length : undefined,
robots: /robots/.test(p.id) && r.status === 200 ? txt.split('\n').map(l => l.trim()).filter(l => /^(user-agent|disallow|allow|crawl-delay)/i.test(l)).slice(0, 12) : undefined,
wms_capabilities: /_wms$/.test(p.id) && r.status === 200 ? /WMS_Capabilities|WMT_MS_Capabilities/.test(txt) : undefined };
} catch (e) { return { id: p.id, name: p.name, url: p.url, status: null, error: String(e.name === $q.p ? $q.q : e.message || e).slice(0, 80), ms: Date.now() - t0 }; }
finally { clearTimeout(t); }
}
async function zoning(req, u, ctx) {
const key = new Request($q.r + VERSION);
const hit = await caches.default.match(key);
if (hit) { const r = new Response(hit.body, hit); r.headers.set($q.i, 'hit'); return r; }
if (!(await allow(ctx, 'hzz/' + ipOf(req), 10, 600))) return out({ error: $q.j }, 429);
const res = await Promise.all($t.o_ZPROBE.map(probe));
const body = { checked: new Date().toISOString(), from: $q.s, automated_lookup: false,
reason: $s.k2,
probes: res };
const c = out(body, 200, 3600);
ctx.waitUntil(caches.default.put(key, c.clone()).catch(() => {}));
return c;
}
export async function handle(req, u, env, ctx) {
if (req.method === $q.t) return new Response(null, { status: 204, headers: CORS });
if (req.method !== 'GET') return out({ error: $q.u }, 405);
const p = u.pathname.replace(/^\/api\/x\/p\//, '');
try {
if (p === $q.v) return await hazards(req, u, ctx, env);
if (p === $q.w) return await zoning(req, u, ctx);
if (p === '' || p === 'about') return out({ endpoints: { '/api/x/p/hazards?lat=&lng=': $t.k2, '/api/x/p/zoning': $t.k3 }, page: $q.x }, 200, 3600);
} catch (e) { return out({ error: $q.y, detail: String(e.message || e).slice(0, 100) }, 502); }
return out({ error: $q.z }, 404);
}
