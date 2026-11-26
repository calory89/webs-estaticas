// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_bulk__q, $s = TB.kbx_bulk__s, $t = TB.kbx_bulk__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TB } from './kbx_strings.js';
export const PATHS = /^\/bulk-check\/?$|^\/api\/kb\/bulk\/?$/;
const MAX_BATCH = 5, MAX_ROWS = 200;
function out(o, s, extra) { return new Response(JSON.stringify(o), { status: s || 200, headers: Object.assign({ 'content-type': $q.d, 'cache-control': $q.e, 'access-control-allow-origin': '*', 'access-control-allow-headers': $q.f, 'access-control-allow-methods': $q.g }, extra || {}) }); }
const TYPE = { es_refcat: 'Spanish cadastral reference', nyc_bis_job: 'NYC DOB job number', nyc_dobnow_job: 'NYC DOB NOW job', miami_dade_permit: 'Miami-Dade permit', uk_company_number: 'UK company number' };
function flat(f, n) {
const o = [];
for (const [k, v] of Object.entries(f || {})) {
if (v == null || v === '' || k === $q.h) continue;
if (Array.isArray(v)) { if (v.length) o.push(k + ': ' + v.length + (typeof v[0] === $q.i ? $q.j : ' (' + v.slice(0, 3).join(', ') + ')')); continue; }
if (typeof v === $q.i) continue;
o.push(k + ': ' + String(v).slice(0, 80));
}
return o.join('; ').slice(0, n || 400);
}
function row(q, d, status) {
  if (!d || !d.checks) return { q, status, error: d && d.error || status };
  const ids = (d.detected && d.detected.identifiers) || [], types = [...new Set(ids.map(x => TYPE[x.type] || x.type))];
  const checks = d.checks.map(c => ({ id: c.id, source: c.source, status: c.status, note: c.note ? String(c.note).slice(0, 200) : null, source_url: c.source_url || null, facts: c.status === 'found' ? flat(c.fields) : '', manual_check: c.manual_check || null }));
  const kind = types.length ? types.join(', ') : checks.some(c => /^us_nyc_address/.test(c.id)) ? $q.k : checks.some(c => /^us_miami/.test(c.id)) ? $q.l : checks.some(c => /gleif/.test(c.id)) ? $q.m : $q.n;
  return { q, status: 'done', kind, countries: (d.detected && d.detected.countries) || [], summary: d.summary, checks, cached: !!d.cached, result_url: d.seal ? d.seal.result_url : null, root_sha256: d.seal ? d.seal.root_sha256 : null, at: d.finished_at || d.started_at || null };
}
async function bulk(req, env, ctx, lookupHandle) {
let b; try { b = await req.json(); } catch (e) { return out({ error: $q.o, need: $q.p }, 400); }
const rows = (b && Array.isArray(b.rows) ? b.rows : []).slice(0, MAX_BATCH + 1);
if (!rows.length) return out({ error: 'empty', need: $t.k0, max_rows_per_call: MAX_BATCH }, 400);
if (rows.length > MAX_BATCH) return out({ error: $q.q, max_rows_per_call: MAX_BATCH, note: $q.r + MAX_ROWS + $q.s + MAX_BATCH + $t.k1 }, 400);
const key = req.headers.get($q.t) || '', ip = req.headers.get($q.u) || 'x';
if (key && !/^kb_pilot_[0-9a-f]{40}$/.test(key)) return out({ error: $q.v, how: $q.w }, 401);
const results = [], t0 = Date.now(); let stop = null;
for (const r of rows) {
const q = String((r && (r.q || r.ref)) || '').replace(/\s+/g, ' ').trim().slice(0, 300), country = String((r && r.country) || '').trim().toUpperCase().slice(0, 2);
if (!q) { results.push({ q, status: $q.x, error: $q.y }); continue; }
if (/https?:\/\/|www\./i.test(q)) { results.push({ q, status: $q.x, error: $t.k2 }); continue; }
if (stop) { results.push({ q, status: stop }); continue; }
const p = new URLSearchParams({ q, ai: '0' }); if (/^[A-Z]{2}$/.test(country)) p.set($q.z, country);
const path = key ? $q.A : $q.B, h = { accept: $q.C, 'cf-connecting-ip': ip, 'user-agent': $q.D }; if (key) h[$q.t] = key;
const sub = new Request($q.E + path + '?' + p, { method: 'GET', headers: h });
let res, d; try { res = await lookupHandle(sub, new URL(sub.url), env, ctx); d = await res.json(); } catch (e) { results.push({ q, status: 'error', error: $q.F }); continue; }
if (res.status === 429) { stop = $q.G; results.push({ q, status: $q.G, error: d && (d.limit || d.error) }); continue; }
if (res.status === 401) { results.push({ q, status: $q.H, error: d && d.error }); stop = $q.H; continue; }
results.push(row(q, d, res.ok ? 'done' : 'error'));
}
return out({ version: $q.I, mode: key ? $q.J : $q.K, limit: key ? $q.L : $t.k3, rows: results, ms: Date.now() - t0,
disclaimer: $s.k0 });
}
async function page(shell) {
  const sh = await shell($q.M);
  const title = $q.N, desc = $q.O;
  const tags = $q.P + title + $q.Q + desc + $q.R + title + $q.S + desc + $q.T + $q.a;
  const html = await new HTMLRewriter()
    .on('title', { element(e) { e.remove(); } })
    .on($q.U, { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent($q.b + $q.V + $q.c + $q.W, { html: true }); } })
    .transform(new Response(sh.body, { headers: { 'content-type': $q.X } })).text();
  return new Response(html, { headers: { 'content-type': $q.X, 'cache-control': $q.Y } });
}
export async function handle(req, u, env, ctx, shell, lookupHandle) {
const p = u.pathname.replace(/\/+$/, '');
if (p === $q.Z) {
if (req.method === $q.aa) return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': $q.f, 'access-control-allow-methods': $q.g, 'access-control-max-age': '86400' } });
if (req.method !== 'POST') return out({ error: $q.ab, use: $q.ac + MAX_BATCH + $q.ad, page: $q.ae }, 405);
return bulk(req, env, ctx, lookupHandle);
}
if (p === $q.af && (req.method === 'GET' || req.method === 'HEAD')) {
if (!u.pathname.endsWith('/')) return new Response(null, { status: 301, headers: { location: $q.ag + u.search } });
return page(shell);
}
return null;
}
