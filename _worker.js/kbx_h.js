// Feature module h for kolaboro.com (see kbx.js): market truth.
//   GET /api/x/h/                        index of endpoints
//   GET /api/x/h/prices[?market=Dubai]   advertised prices versus officially registered sales (from /data/price-reality.json)
//   GET /api/x/h/project/{ID}            one project's price position, risk-pattern explanation and register result
//   GET /api/x/h/risk                    model card and summary of the risk-pattern model (from /data/risk.json)
//   GET /api/x/h/registers               which official registers can be checked automatically (from /data/register-checks.json)
//   GET /api/x/h/lookup?register=uk-companies-house|au-abn&q=NUMBER
//                                        live lookup on a public register over plain HTTP; the exact response bytes get a
//                                        SHA-256 and a timestamp, and the record is kept so anyone can fetch it again:
//   GET /api/x/h/archive/{sha256}[?raw=1]
// The static files are written by batch jobs; this module only reads them, so the site keeps working if a job is late.
import { rpc, WKEY } from './kolaboro.js';
export const PATHS = /^\/api\/x\/h(\/|$)/;

const UA = 'KolaboroRegisterCheck/1.0 (+https://kolaboro.com/registers/)';
const MEMO = {};
async function load(env, name) {
  const m = MEMO[name];
  if (m && Date.now() - m.t < 120000) return m.v;
  let v = null;
  try {
    let r = null;
    if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request('https://kolaboro.com/data/' + name));
    if (!r || !r.ok) r = await fetch('https://kolaboro.com/data/' + name, { cf: { cacheTtl: 600, cacheEverything: true } });
    if (r.ok) v = await r.json();
  } catch (e) { v = null; }
  MEMO[name] = { t: Date.now(), v };
  return v;
}
function out(o, s = 200, maxAge = 300) {
  return new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': maxAge ? 'public, max-age=' + maxAge : 'no-store', 'access-control-allow-origin': '*' } });
}
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const clean = t => String(t || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const STARTING = name => ({ status: 'starting', note: 'The batch job has not published ' + name + ' yet.' });

// ---- live register lookups: only registers where a lookup by number works over plain HTTP and robots.txt allows it
const REG = {
  'uk-companies-house': {
    name: 'Companies House (United Kingdom)', by: 'company number',
    norm: q => { const s = String(q || '').toUpperCase().replace(/\s+/g, ''); return /^([A-Z]{2}\d{6}|\d{8}|\d{6,7})$/.test(s) ? s.padStart(8, '0') : null; },
    url: n => 'https://find-and-update.company-information.service.gov.uk/company/' + n,
    parse(html, status) {
      if (status === 404) return { found: false };
      const t = html.match(/<title[^>]*>\s*([^<]*?)\s+overview\s+-/i);
      const dd = id => { const m = html.match(new RegExp('id="' + id + '"[^>]*>([\\s\\S]*?)</(dd|p|span|h1|div)>', 'i')); return m ? clean(m[1]) : null; };
      const sic = []; for (let i = 0; i < 4; i++) { const v = dd('sic' + i); if (v) sic.push(v); }
      return { found: !!t, name: t ? clean(t[1]) : null, status: dd('company-status'), type: dd('company-type'), incorporated: dd('company-creation-date'), sic };
    }
  },
  'au-abn': {
    name: 'Australian Business Register, ABN Lookup', by: 'ABN',
    norm: q => { const s = String(q || '').replace(/\D/g, ''); if (!/^\d{11}$/.test(s)) return null;
      const w = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19], d = s.split('').map(Number); d[0] -= 1; return d.reduce((a, x, i) => a + x * w[i], 0) % 89 === 0 ? s : null; },
    url: n => 'https://abr.business.gov.au/ABN/View?abn=' + n,
    parse(html) {
      const row = l => { const m = html.match(new RegExp('<th>\\s*' + l + ':?\\s*</th>\\s*<td>([\\s\\S]*?)</td>', 'i')); return m ? clean(m[1]) : null; };
      const type = row('Entity type'), name = row('Entity name');
      const person = /individual|sole trader/i.test(type || '');
      return { found: !!name, name: person ? 'individual (name not shown)' : name, abn_status: row('ABN status'), type, gst: row('Goods &amp; Services Tax \\(GST\\)') || row('Goods & Services Tax \\(GST\\)') };
    }
  }
};
async function rateOk(req, ctx, limit) {
  const ip = req.headers.get('cf-connecting-ip') || 'x', hour = new Date().toISOString().slice(0, 13);
  const k = new Request('https://kolaboro.com/__h_rl/' + encodeURIComponent(ip) + '/' + hour);
  const h = await caches.default.match(k), n = h ? (+(await h.text()) || 0) : 0;
  if (n >= limit) return false;
  ctx.waitUntil(caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=3600' } })));
  return true;
}
const AKEY = s => new Request('https://kolaboro.com/__h_archive/' + s);
const RKEY = s => new Request('https://kolaboro.com/__h_archive_raw/' + s);
async function lookup(req, u, env, ctx) {
  const id = u.searchParams.get('register') || '', R = REG[id];
  if (!R) return out({ error: 'unknown register', registers: Object.keys(REG).map(k => ({ id: k, name: REG[k].name, by: REG[k].by })) }, 400, 60);
  const n = R.norm(u.searchParams.get('q'));
  if (!n) return out({ error: 'invalid ' + R.by, register: id }, 400, 0);
  if (!(await rateOk(req, ctx, 20))) return out({ error: 'rate limit: 20 lookups an hour' }, 429, 0);
  const url = R.url(n), at = new Date().toISOString();
  let r, buf;
  try { r = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(15000) }); buf = await r.arrayBuffer(); }
  catch (e) { return out({ register: id, query: n, url, fetched_at: at, error: 'register did not answer', detail: String(e && e.message || e).slice(0, 120) }, 502, 0); }
  if (buf.byteLength > 2_000_000) buf = buf.slice(0, 2_000_000);
  const s = hex(await crypto.subtle.digest('SHA-256', buf)), html = new TextDecoder().decode(buf);
  let parsed = {}; try { parsed = r.status >= 500 ? { found: null, register_error: 'the register answered HTTP ' + r.status + '; try again later' } : R.parse(html, r.status); } catch (e) { parsed = { found: null, parse_error: true }; }
  const blocked = /just a moment|captcha|access denied/i.test(html.slice(0, 4000)) && !parsed.found;
  const rec = { kind: 'kolaboro-register-lookup-v1', register: id, register_name: R.name, query: n, url, fetched_at: at, http_status: r.status, content_type: (r.headers.get('content-type') || '').split(';')[0],
    bytes: buf.byteLength, sha256: s, result: blocked ? { found: null, blocked: true } : parsed,
    note: 'sha256 is the SHA-256 of the exact bytes the register returned. Fetch them again with /api/x/h/archive/' + s + '?raw=1 and hash them yourself.' };
  let durable = false;
  try { const d = await rpc('kolaboro_register_lookup_put', { p_wkey: WKEY, p_sha256: s, p_register: id, p_query: n, p_url: url, p_fetched_at: at, p_http: r.status, p_bytes: buf.byteLength, p_result: rec.result }); durable = !!d; } catch (e) { durable = false; }
  rec.archive = { url: 'https://kolaboro.com/api/x/h/archive/' + s, edge_cache_days: 30, durable,
    durable_note: durable ? 'Stored in the Kolaboro database.' : 'Kept in the edge cache for up to 30 days. The permanent archive table is waiting for approval; until then, save this record if you need it.' };
  const ttl = { headers: { 'cache-control': 'public, max-age=2592000', 'content-type': 'application/json' } };
  ctx.waitUntil(Promise.all([caches.default.put(AKEY(s), new Response(JSON.stringify(rec), ttl)),
    caches.default.put(RKEY(s), new Response(buf, { headers: { 'cache-control': 'public, max-age=2592000', 'content-type': 'application/octet-stream' } }))]));
  return out(rec, 200, 0);
}
async function archive(u, s) {
  if (u.searchParams.get('raw') === '1') {
    const r = await caches.default.match(RKEY(s));
    if (!r) return out({ error: 'not in the edge archive (records are kept 30 days, per data centre)' }, 404, 0);
    return new Response(r.body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'", 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=86400' } });
  }
  const r = await caches.default.match(AKEY(s));
  if (r) return out(await r.json(), 200, 300);
  try { const d = await rpc('kolaboro_register_lookup_get', { p_sha256: s }); if (d) return out(d, 200, 300); } catch (e) {}
  return out({ error: 'not found', note: 'Records live in the edge cache of the data centre that made the lookup for 30 days, until the permanent archive is approved.' }, 404, 0);
}

export async function handle(req, u, env, ctx) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET', 'access-control-max-age': '86400' } });
  if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: 'method not allowed' }, 405, 0);
  const p = u.pathname.replace(/\/+$/, '');
  if (p === '/api/x/h') return out({ module: 'market truth', endpoints: ['/api/x/h/prices', '/api/x/h/prices?market=Dubai', '/api/x/h/project/{ID}', '/api/x/h/risk', '/api/x/h/registers', '/api/x/h/lookup?register=uk-companies-house&q={company number}', '/api/x/h/lookup?register=au-abn&q={ABN}', '/api/x/h/archive/{sha256}'], pages: ['/prices/', '/risk/', '/registers/'] }, 200, 3600);
  if (p === '/api/x/h/lookup') return lookup(req, u, env, ctx);
  const am = p.match(/^\/api\/x\/h\/archive\/([0-9a-f]{64})$/);
  if (am) return archive(u, am[1]);
  if (p === '/api/x/h/prices') {
    const d = await load(env, 'price-reality.json'); if (!d) return out(STARTING('price-reality.json'), 200, 60);
    const mk = (u.searchParams.get('market') || '').toLowerCase();
    if (!mk) return out({ ...d, markets: d.markets.map(m => ({ ...m, projects: undefined, project_count: m.projects.length })) });
    const m = d.markets.find(x => x.market.toLowerCase() === mk);
    if (!m) { const nc = d.not_covered.find(x => x.market.toLowerCase() === mk); return out(nc ? { market: nc.market, covered: false, note: nc.note } : { error: 'unknown market' }, nc ? 200 : 404); }
    return out({ updated: d.updated, version: d.version, fx: d.fx, method: d.method, ...m });
  }
  if (p === '/api/x/h/risk') {
    const d = await load(env, 'risk.json'); if (!d) return out(STARTING('risk.json'), 200, 60);
    return out({ version: d.version, updated: d.updated, model_card: d.model_card, summary: d.summary, markets: d.markets, top: d.top.map(id => ({ id, ...d.projects[id] })) });
  }
  if (p === '/api/x/h/registers') {
    const d = await load(env, 'register-checks.json'); if (!d) return out(STARTING('register-checks.json'), 200, 60);
    return out({ ...d, live_lookups: Object.keys(REG).map(k => ({ id: k, name: REG[k].name, by: REG[k].by })) });
  }
  const pm = p.match(/^\/api\/x\/h\/project\/([A-Za-z]{2,5}-\d{3,4})$/);
  if (pm) {
    const id = pm[1].toUpperCase();
    const [pr, rk, rg] = await Promise.all([load(env, 'price-reality.json'), load(env, 'risk.json'), load(env, 'register-checks.json')]);
    const res = { id };
    if (pr) { let hit = null; for (const m of pr.markets) { const x = m.projects.find(y => y.id === id); if (x) { hit = { ...x, market: m.market, official: { source: m.official.source, period: m.official.period, n: m.official.n, median_usd: m.official.median_usd }, comparison: m.comparison }; break; } }
      res.price = hit || { covered: false, note: 'No official open sales data is connected for this project\'s market.' }; res.price_meta = { updated: pr.updated, version: pr.version };
    } else res.price = STARTING('price-reality.json');
    if (rk) { const x = rk.projects[id]; res.risk = x ? { ...x, labels: Object.fromEntries(rk.model_card.features.map(f => [f.feature, f.label])) } : null; res.risk_meta = { version: rk.version, data_sha256: rk.model_card.data.sha256, thresholds: rk.model_card.thresholds, not_a_prediction: rk.model_card.not_for }; }
    else res.risk = STARTING('risk.json');
    res.register = rg ? (rg.projects[id] || null) : STARTING('register-checks.json');
    return out(res);
  }
  return out({ error: 'not found', see: '/api/x/h/' }, 404, 60);
}
