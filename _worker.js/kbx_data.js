// comments: _notes/kolaboro-worker-comments.txt
import * as KB from './kolaboro.js';
import { TB } from './kbx_strings.js';
export const PATHS = /^\/api\/x\/data(\/|$)/;
const CORS = { 'access-control-allow-origin': '*', 'access-control-expose-headers': 'x-kolaboro-signature, x-kolaboro-key-id' };
const MEMO = {};
function out(o, s = 200, maxAge = 300, extra) {
  return new Response(typeof o === 'string' ? o : JSON.stringify(o, null, 1), { status: s, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': maxAge ? 'public, max-age=' + maxAge : 'no-store' }, CORS, extra || {}) });
}
async function asset(env, path) {
try {
if (env && env.ASSETS) {
let r = await env.ASSETS.fetch(new Request('https://kolaboro.com/_s/kolaboro.com' + path));
if (r.ok) return r;
r = await env.ASSETS.fetch(new Request('https://kolaboro.com' + path));
if (r.ok) return r;
}
const r = await fetch('https://kolaboro.com' + path, { cf: { cacheTtl: 300, cacheEverything: true } });
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
if (typeof v !== 'string') return null;
if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return { t: Date.parse(v + 'T00:00:00Z'), dateOnly: true };
const t = Date.parse(v); return isNaN(t) ? null : { t, dateOnly: false };
}
function targetHours(interval, dateOnly) {
if (!interval) return null;
return (interval <= 24 ? 2 * interval : interval + 48) + (dateOnly ? 24 : 0);
}
const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
async function freshness(env) {
const cat = await loadJSON(env, '/data/catalog.json');
if (!cat || !Array.isArray(cat.datasets)) return { status: 'starting', note: TB.kbx_data__t.k0 };
const now = Date.now();
let cases = null, pqm = null;
const needSync = cat.datasets.some(d => d.freshness && d.freshness.source_sha256 !== undefined);
if (needSync) {
try { cases = await KB.openLoad(); } catch (e) { cases = null; }
pqm = await loadJSON(env, '/data/kolaboro.parquet.json', 60000);
}
const rows = await Promise.all(cat.datasets.filter(d => !d.missing).map(async d => {
const fr = d.freshness || {};
let stamp = fr.stamp || null, source = stamp ? 'catalog' : (fr.published_at ? 'last commit' : null);
if (fr.probe && fr.stamp_key) {
const file = fr.probe_file ? '/data/' + fr.probe_file : String(d.url || '').replace('https://kolaboro.com', '');
const txt = await headText(env, file);
const m = txt && txt.match(new RegExp('"' + esc(fr.stamp_key) + '"\\s*:\\s*"([^"]{4,40})"'));
if (m) { stamp = m[1]; source = 'live file'; }
}
const st = parseStamp(stamp), pub = parseStamp(fr.published_at);
const asOf = st ? st.t : pub ? pub.t : null;
const target = targetHours(d.interval_hours, st ? st.dateOnly : false);
const age = asOf == null ? null : Math.round((now - asOf) / 36e3) / 100;
const o = { id: d.id, title: d.title, status: 'no_target', age_hours: age, target_hours: target, data_as_of: asOf == null ? null : new Date(asOf).toISOString(), stamp, stamp_source: source, schedule: d.schedule, url: d.url };
if (fr.source_sha256 !== undefined && cases && pqm && pqm.source) { o.in_sync = pqm.source.sha256 === cases.sha; o.source_note = o.in_sync ? TB.kbx_data__t.k1 : 'built from an older bali-cases.json'; }
if (o.in_sync) o.status = 'ok';
else if (target != null && age != null) o.status = age <= target ? 'ok' : 'late';
return o;
}));
const late = rows.filter(r => r.status === 'late').map(r => r.id);
return {
checked_at: new Date(now).toISOString(), catalog_generated_at: cat.generated_at, catalog: TB.kbx_data__t.k2, page: 'https://kolaboro.com/data/#freshness',
rule: (cat.rules && cat.rules.freshness) || null,
summary: { datasets: rows.length, ok: rows.filter(r => r.status === 'ok').length, late: late.length, no_target: rows.filter(r => r.status === 'no_target').length },
late, datasets: rows, licence: TB.kbx_data__t.LIC
};
}
export async function handle(req, u, env, ctx) {
if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: Object.assign({ 'access-control-allow-methods': 'GET, HEAD, OPTIONS', 'access-control-allow-headers': '*', 'access-control-max-age': '86400' }, CORS) });
if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: 'method not allowed' }, 405, 0);
const p = u.pathname.replace(/\/+$/, '');
try {
if (p === '/api/x/data') return out({
module: 'data', about: TB.kbx_data__s.k0,
endpoints: {
'/api/x/data/freshness': TB.kbx_data__s.k1,
'/api/x/data/freshness?strict=1': TB.kbx_data__t.k3,
'/api/x/data/schema/{id}.json': TB.kbx_data__t.k4,
'/api/x/data/openapi.json': TB.kbx_data__t.k5
},
files: { catalog: '/data/catalog.json', dcat: '/data/catalog.jsonld', contracts: '/data/contracts.json', schemas: TB.kbx_data__t.k6, openapi: '/docs/api/openapi.json', explorer: '/docs/api/explorer/', llms_full: '/llms-full.txt' },
licence: TB.kbx_data__t.LIC }, 200, 3600);
if (p === '/api/x/data/freshness') {
const strict = u.searchParams.get('strict') === '1';
const key = new Request(TB.kbx_data__t.k7);
let body = null;
try { const hit = await caches.default.match(key); if (hit) body = await hit.text(); } catch (e) {}
if (!body) {
const f = await freshness(env);
body = JSON.stringify(f, null, 1);
if (!f.status) { try { ctx.waitUntil(caches.default.put(key, new Response(body, { headers: { 'cache-control': 'max-age=300' } }))); } catch (e) {} }
}
const h = {};
try { const sg = await KB.signBody(env, body); if (sg) { h['x-kolaboro-signature'] = sg; h['x-kolaboro-key-id'] = (env && env.KB_SIGN_KID) || 'kb'; } } catch (e) {}
let late = 0; try { late = (JSON.parse(body).late || []).length; } catch (e) {}
return out(body, strict && late ? 503 : 200, strict ? 0 : 300, h);
}
const sm = p.match(/^\/api\/x\/data\/schema\/([a-z0-9-]{2,60})(\.json)?$/);
if (sm) {
const all = await loadJSON(env, TB.kbx_data__t.k8, 600000);
if (!all || !all.$defs) return out({ status: 'starting', note: TB.kbx_data__t.k9 }, 200, 60);
const id = sm[1], def = all.$defs[id] || all.$defs[id + '-file'];
if (!def) return out({ error: 'unknown dataset', datasets: Object.keys(all.$defs) }, 404, 300);
return out(Object.assign({ $schema: TB.kbx_data__t.k10, $id: TB.kbx_data__t.k11 + id + '.json' }, def), 200, 3600, { 'content-type': TB.kbx_data__t.k12 });
}
if (p === '/api/x/data/openapi.json') {
const r = await asset(env, '/docs/api/openapi.json');
if (!r) return out({ status: 'starting', note: TB.kbx_data__t.k13 }, 200, 60);
return out(await r.text(), 200, 3600);
}
} catch (e) {
return out({ error: 'unavailable' }, 503, 0);
}
return out({ error: 'not found', see: '/api/x/data' }, 404, 300);
}
