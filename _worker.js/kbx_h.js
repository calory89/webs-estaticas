// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_h__q, $s = TB.kbx_h__s, $t = TB.kbx_h__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { rpc, WKEY } from './kolaboro.js';
import { TB } from './kbx_strings.js';
export const PATHS = /^\/api\/x\/h(\/|$)/;
const MEMO = {};
async function load(env, name) {
const m = MEMO[name];
if (m && Date.now() - m.t < 120000) return m.v;
let v = null;
try {
let r = null;
if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request($q.a + name));
if (!r || !r.ok) r = await fetch($q.a + name, { cf: { cacheTtl: 600, cacheEverything: true } });
if (r.ok) v = await r.json();
} catch (e) { v = null; }
MEMO[name] = { t: Date.now(), v };
return v;
}
function out(o, s = 200, maxAge = 300) {
  return new Response(JSON.stringify(o), { status: s, headers: { 'content-type': $q.b, 'cache-control': maxAge ? $q.c + maxAge : $q.d, 'access-control-allow-origin': '*' } });
}
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const clean = t => String(t || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const STARTING = name => ({ status: $q.e, note: $q.f + name + ' yet.' });
const REG = {
'uk-companies-house': {
name: 'Companies House (United Kingdom)', by: 'company number',
norm: q => { const s = String(q || '').toUpperCase().replace(/\s+/g, ''); return /^([A-Z]{2}\d{6}|\d{8}|\d{6,7})$/.test(s) ? s.padStart(8, '0') : null; },
url: n => 'https://find-and-update.company-information.service.gov.uk/company/' + n,
parse(html, status) {
if (status === 404) return { found: false };
const t = html.match(/<title[^>]*>\s*([^<]*?)\s+overview\s+-/i);
const dd = id => { const m = html.match(new RegExp('id="' + id + $q.g, 'i')); return m ? clean(m[1]) : null; };
const sic = []; for (let i = 0; i < 4; i++) { const v = dd('sic' + i); if (v) sic.push(v); }
return { found: !!t, name: t ? clean(t[1]) : null, status: dd($q.h), type: dd($q.i), incorporated: dd($q.j), sic };
}
},
'au-abn': {
name: 'Australian Business Register, ABN Lookup', by: 'ABN',
norm: q => { const s = String(q || '').replace(/\D/g, ''); if (!/^\d{11}$/.test(s)) return null;
const w = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19], d = s.split('').map(Number); d[0] -= 1; return d.reduce((a, x, i) => a + x * w[i], 0) % 89 === 0 ? s : null; },
url: n => 'https://abr.business.gov.au/ABN/View?abn=' + n,
parse(html) {
const row = l => { const m = html.match(new RegExp($q.k + l + $q.l, 'i')); return m ? clean(m[1]) : null; };
const type = row($q.m), name = row($q.n);
const person = /individual|sole trader/i.test(type || '');
return { found: !!name, name: person ? $q.o : name, abn_status: row($q.p), type, gst: row($q.q) || row($q.r) };
}
}
};
async function rateOk(req, ctx, limit) {
const ip = req.headers.get($q.s) || 'x', hour = new Date().toISOString().slice(0, 13);
const k = new Request($q.t + encodeURIComponent(ip) + '/' + hour);
const h = await caches.default.match(k), n = h ? (+(await h.text()) || 0) : 0;
if (n >= limit) return false;
ctx.waitUntil(caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': $q.u } })));
return true;
}
const AKEY = s => new Request($q.v + s);
const RKEY = s => new Request($q.w + s);
async function lookup(req, u, env, ctx) {
const id = u.searchParams.get($q.x) || '', R = REG[id];
if (!R) return out({ error: $q.y, registers: Object.keys(REG).map(k => ({ id: k, name: REG[k].name, by: REG[k].by })) }, 400, 60);
const n = R.norm(u.searchParams.get('q'));
if (!n) return out({ error: $q.z + R.by, register: id }, 400, 0);
if (!(await rateOk(req, ctx, 20))) return out({ error: $q.A }, 429, 0);
const url = R.url(n), at = new Date().toISOString();
let r, buf;
try { r = await fetch(url, { headers: { 'user-agent': $t.UA, accept: $q.B }, redirect: $q.C, signal: AbortSignal.timeout(15000) }); buf = await r.arrayBuffer(); }
catch (e) { return out({ register: id, query: n, url, fetched_at: at, error: $q.D, detail: String(e && e.message || e).slice(0, 120) }, 502, 0); }
if (buf.byteLength > 2_000_000) buf = buf.slice(0, 2_000_000);
const s = hex(await crypto.subtle.digest($q.E, buf)), html = new TextDecoder().decode(buf);
let parsed = {}; try { parsed = r.status >= 500 ? { found: null, register_error: $q.F + r.status + $q.G } : R.parse(html, r.status); } catch (e) { parsed = { found: null, parse_error: true }; }
const blocked = /just a moment|captcha|access denied/i.test(html.slice(0, 4000)) && !parsed.found;
const rec = { kind: $q.H, register: id, register_name: R.name, query: n, url, fetched_at: at, http_status: r.status, content_type: (r.headers.get($q.I) || '').split(';')[0],
bytes: buf.byteLength, sha256: s, result: blocked ? { found: null, blocked: true } : parsed,
note: $s.k0 + s + $q.J };
let durable = false;
try { const d = await rpc($q.K, { p_wkey: WKEY, p_sha256: s, p_register: id, p_query: n, p_url: url, p_fetched_at: at, p_http: r.status, p_bytes: buf.byteLength, p_result: rec.result }); durable = !!d; } catch (e) { durable = false; }
rec.archive = { url: $q.L + s, edge_cache_days: 30, durable,
durable_note: durable ? $q.M : $s.k1 };
const ttl = { headers: { 'cache-control': $q.N, 'content-type': $q.O } };
ctx.waitUntil(Promise.all([caches.default.put(AKEY(s), new Response(JSON.stringify(rec), ttl)),
caches.default.put(RKEY(s), new Response(buf, { headers: { 'cache-control': $q.N, 'content-type': $q.P } }))]));
return out(rec, 200, 0);
}
async function archive(u, s) {
if (u.searchParams.get('raw') === '1') {
const r = await caches.default.match(RKEY(s));
if (!r) return out({ error: $t.k0 }, 404, 0);
return new Response(r.body, { headers: { 'content-type': $q.Q, 'x-content-type-options': $q.R, 'content-security-policy': $q.S, 'access-control-allow-origin': '*', 'cache-control': $q.T } });
}
const r = await caches.default.match(AKEY(s));
if (r) return out(await r.json(), 200, 300);
try { const d = await rpc($q.U, { p_sha256: s }); if (d) return out(d, 200, 300); } catch (e) {}
return out({ error: $q.V, note: $s.k2 }, 404, 0);
}
export async function handle(req, u, env, ctx) {
if (req.method === $q.W) return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET', 'access-control-max-age': '86400' } });
if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: $q.X }, 405, 0);
const p = u.pathname.replace(/\/+$/, '');
if (p === $q.Y) return out({ module: $q.Z, endpoints: [$q.aa, $q.ab, $q.ac, $q.ad, $q.ae, $t.k1, $t.k2, $q.af], pages: [$q.ag, $q.ah, $q.ai] }, 200, 3600);
if (p === $q.aj) return lookup(req, u, env, ctx);
const am = p.match(/^\/api\/x\/h\/archive\/([0-9a-f]{64})$/);
if (am) return archive(u, am[1]);
if (p === $q.aa) {
const d = await load(env, $q.ak); if (!d) return out(STARTING($q.ak), 200, 60);
const mk = (u.searchParams.get($q.al) || '').toLowerCase();
if (!mk) return out({ ...d, markets: d.markets.map(m => ({ ...m, projects: undefined, project_count: m.projects.length })) });
const m = d.markets.find(x => x.market.toLowerCase() === mk);
if (!m) { const nc = d.not_covered.find(x => x.market.toLowerCase() === mk); return out(nc ? { market: nc.market, covered: false, note: nc.note } : { error: $q.am }, nc ? 200 : 404); }
return out({ updated: d.updated, version: d.version, fx: d.fx, method: d.method, ...m });
}
if (p === $q.ad) {
const d = await load(env, $q.an); if (!d) return out(STARTING($q.an), 200, 60);
return out({ version: d.version, updated: d.updated, model_card: d.model_card, summary: d.summary, markets: d.markets, top: d.top.map(id => ({ id, ...d.projects[id] })) });
}
if (p === $q.ae) {
const d = await load(env, $q.ao); if (!d) return out(STARTING($q.ao), 200, 60);
return out({ ...d, live_lookups: Object.keys(REG).map(k => ({ id: k, name: REG[k].name, by: REG[k].by })) });
}
const pm = p.match(/^\/api\/x\/h\/project\/([A-Za-z]{2,5}-\d{3,4})$/);
if (pm) {
const id = pm[1].toUpperCase();
const [pr, rk, rg] = await Promise.all([load(env, $q.ak), load(env, $q.an), load(env, $q.ao)]);
const res = { id };
if (pr) { let hit = null; for (const m of pr.markets) { const x = m.projects.find(y => y.id === id); if (x) { hit = { ...x, market: m.market, official: { source: m.official.source, period: m.official.period, n: m.official.n, median_usd: m.official.median_usd }, comparison: m.comparison }; break; } }
res.price = hit || { covered: false, note: $t.k3 }; res.price_meta = { updated: pr.updated, version: pr.version };
} else res.price = STARTING($q.ak);
if (rk) { const x = rk.projects[id]; res.risk = x ? { ...x, labels: Object.fromEntries(rk.model_card.features.map(f => [f.feature, f.label])) } : null; res.risk_meta = { version: rk.version, data_sha256: rk.model_card.data.sha256, thresholds: rk.model_card.thresholds, not_a_prediction: rk.model_card.not_for }; }
else res.risk = STARTING($q.an);
res.register = rg ? (rg.projects[id] || null) : STARTING($q.ao);
return out(res);
}
return out({ error: $q.V, see: $q.ap }, 404, 60);
}
