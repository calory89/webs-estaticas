// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_data__q, $s = TB.kbx_data__s, $t = TB.kbx_data__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import * as KB from './kolaboro.js';
import { TB } from './kbx_strings.js';
export const PATHS = /^\/api\/x\/data(\/|$)/;
const CORS = { 'access-control-allow-origin': '*', 'access-control-expose-headers': 'x-kolaboro-signature, x-kolaboro-key-id' };
const MEMO = {};
function out(o, s = 200, maxAge = 300, extra) {
  return new Response(typeof o === $q.a ? o : JSON.stringify(o, null, 1), { status: s, headers: Object.assign({ 'content-type': $q.b, 'cache-control': maxAge ? $q.c + maxAge : $q.d }, CORS, extra || {}) });
}
async function asset(env, path) {
try {
if (env && env.ASSETS) {
let r = await env.ASSETS.fetch(new Request($q.e + path));
if (r.ok) return r;
r = await env.ASSETS.fetch(new Request($q.f + path));
if (r.ok) return r;
}
const r = await fetch($q.f + path, { cf: { cacheTtl: 300, cacheEverything: true } });
return r.ok ? r : null;
} catch (e) { return null; }
}
async function loadJSON(env, path, ttl = 120000) {
const m = MEMO[path]; if (m && Date.now() - m.t < ttl) return m.v;
let v = null; try { const r = await asset(env, path); if (r) v = await r.json(); } catch (e) { v = null; }
MEMO[path] = { t: Date.now(), v }; return v;
}
async function headText(env, path, n = 65536) {
const r = await asset(env, path); if (!r || !r.body) return null;
const rd = r.body.getReader(), parts = []; let got = 0;
try { while (got < n) { const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; } } catch (e) {}
try { await rd.cancel(); } catch (e) {}
const all = new Uint8Array(Math.min(got, n)); let o = 0;
for (const p of parts) { const k = Math.min(p.length, all.length - o); all.set(p.subarray(0, k), o); o += k; if (o >= all.length) break; }
return new TextDecoder('utf-8', { fatal: false }).decode(all);
}
function parseStamp(v) {
if (typeof v !== $q.a) return null;
if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return { t: Date.parse(v + $q.g), dateOnly: true };
const t = Date.parse(v); return isNaN(t) ? null : { t, dateOnly: false };
}
function targetHours(interval, dateOnly) {
if (!interval) return null;
return (interval <= 24 ? 2 * interval : interval + 48) + (dateOnly ? 24 : 0);
}
const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
async function freshness(env) {
const cat = await loadJSON(env, $q.h);
if (!cat || !Array.isArray(cat.datasets)) return { status: $q.i, note: $t.k0 };
const now = Date.now();
let cases = null, pqm = null;
const needSync = cat.datasets.some(d => d.freshness && d.freshness.source_sha256 !== undefined);
if (needSync) {
try { cases = await KB.openLoad(); } catch (e) { cases = null; }
pqm = await loadJSON(env, $q.j, 60000);
}
const rows = await Promise.all(cat.datasets.filter(d => !d.missing).map(async d => {
const fr = d.freshness || {};
let stamp = fr.stamp || null, source = stamp ? $q.k : (fr.published_at ? $q.l : null);
if (fr.probe && fr.stamp_key) {
const file = fr.probe_file ? $q.m + fr.probe_file : String(d.url || '').replace($q.f, '');
const txt = await headText(env, file);
const m = txt && txt.match(new RegExp('"' + esc(fr.stamp_key) + $q.n));
if (m) { stamp = m[1]; source = $q.o; }
}
const st = parseStamp(stamp), pub = parseStamp(fr.published_at);
const asOf = st ? st.t : pub ? pub.t : null;
const target = targetHours(d.interval_hours, st ? st.dateOnly : false);
const age = asOf == null ? null : Math.round((now - asOf) / 36e3) / 100;
const o = { id: d.id, title: d.title, status: $q.p, age_hours: age, target_hours: target, data_as_of: asOf == null ? null : new Date(asOf).toISOString(), stamp, stamp_source: source, schedule: d.schedule, url: d.url };
if (fr.source_sha256 !== undefined && cases && pqm && pqm.source) { o.in_sync = pqm.source.sha256 === cases.sha; o.source_note = o.in_sync ? $t.k1 : $q.q; }
if (o.in_sync) o.status = 'ok';
else if (target != null && age != null) o.status = age <= target ? 'ok' : 'late';
return o;
}));
const late = rows.filter(r => r.status === 'late').map(r => r.id);
return {
checked_at: new Date(now).toISOString(), catalog_generated_at: cat.generated_at, catalog: $t.k2, page: $q.r,
rule: (cat.rules && cat.rules.freshness) || null,
summary: { datasets: rows.length, ok: rows.filter(r => r.status === 'ok').length, late: late.length, no_target: rows.filter(r => r.status === $q.p).length },
late, datasets: rows, licence: $t.LIC
};
}
export async function handle(req, u, env, ctx) {
if (req.method === $q.s) return new Response(null, { status: 204, headers: Object.assign({ 'access-control-allow-methods': $q.t, 'access-control-allow-headers': '*', 'access-control-max-age': '86400' }, CORS) });
if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: $q.u }, 405, 0);
const p = u.pathname.replace(/\/+$/, '');
try {
if (p === $q.v) return out({
module: 'data', about: $s.k0,
endpoints: {
'/api/x/data/freshness': $s.k1,
'/api/x/data/freshness?strict=1': $t.k3,
'/api/x/data/schema/{id}.json': $t.k4,
'/api/x/data/openapi.json': $t.k5
},
files: { catalog: $q.h, dcat: $q.w, contracts: $q.x, schemas: $t.k6, openapi: $q.y, explorer: $q.z, llms_full: $q.A },
licence: $t.LIC }, 200, 3600);
if (p === $q.B) {
const strict = u.searchParams.get($q.C) === '1';
const key = new Request($t.k7);
let body = null;
try { const hit = await caches.default.match(key); if (hit) body = await hit.text(); } catch (e) {}
if (!body) {
const f = await freshness(env);
body = JSON.stringify(f, null, 1);
if (!f.status) { try { ctx.waitUntil(caches.default.put(key, new Response(body, { headers: { 'cache-control': $q.D } }))); } catch (e) {} }
}
const h = {};
try { const sg = await KB.signBody(env, body); if (sg) { h[$q.E] = sg; h[$q.F] = (env && env.KB_SIGN_KID) || 'kb'; } } catch (e) {}
let late = 0; try { late = (JSON.parse(body).late || []).length; } catch (e) {}
return out(body, strict && late ? 503 : 200, strict ? 0 : 300, h);
}
const sm = p.match(/^\/api\/x\/data\/schema\/([a-z0-9-]{2,60})(\.json)?$/);
if (sm) {
const all = await loadJSON(env, $t.k8, 600000);
if (!all || !all.$defs) return out({ status: $q.i, note: $t.k9 }, 200, 60);
const id = sm[1], def = all.$defs[id] || all.$defs[id + '-file'];
if (!def) return out({ error: $q.G, datasets: Object.keys(all.$defs) }, 404, 300);
return out(Object.assign({ $schema: $t.k10, $id: $t.k11 + id + '.json' }, def), 200, 3600, { 'content-type': $t.k12 });
}
if (p === $q.H) {
const r = await asset(env, $q.y);
if (!r) return out({ status: $q.i, note: $t.k13 }, 200, 60);
return out(await r.text(), 200, 3600);
}
} catch (e) {
return out({ error: $q.I }, 503, 0);
}
return out({ error: $q.J, see: $q.v }, 404, 300);
}
