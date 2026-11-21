// kolaboro.com batch 34 (agent n34c, 21 Nov 2026): platform, performance, API and trust technology (features 21 to 30).
// The worker renders page shells and small endpoints; data are static files under /data/ built by /open/n34c-daily.py (deltas, transparency
// log), /open/n34c-build.py (performance budget, Brotli copies, synthetic monitoring), /open/search-quality.mjs and /open/sdk-gen.py.
//   GET /[l/]engineering/usage/            21 anonymous API usage per endpoint (edge counters, no personal data)
//   GET /[l/]engineering/sdk/              22 typed JS and Python clients generated from the v1 OpenAPI spec
//   GET /[l/]data/delta/                   23 signed daily delta files; GET /api/v1/delta, /api/v1/delta/<day>, /api/v1/delta/<day>.sig
//   GET /[l/]engineering/performance/      24 per-template budgets, Brotli quality 11 copies, immutable assets; /data/*.json served from /data/br/
//   GET /[l/]engineering/monitoring/       25 synthetic monitoring of the 20 key pages, 30 days; GET /api/v1/monitoring
//   GET /[l/]engineering/security/         26 live security headers of key pages and the CSP report-only results
//   GET /[l/]verify/transparency-log/      27 Merkle transparency log; GET /api/v1/tlog, /api/v1/tlog/proof, /api/v1/tlog/consistency
//   GET /[l/]engineering/mcp/              28 MCP server v2 tools (the tools live in kbx_e.js, extra ones answered by mcpTool below)
//   GET /[l/]embed/charts/                 29 chart embeds; GET /embed/chart/<market>/ (iframe), /api/v1/charts/<market>, /k/n34c/chart.js
//   GET /[l/]engineering/search-quality/   30 multilingual search ranking regression test
// Strings in 8 languages: /data/n34c-i18n.json (static asset, read once per isolate).
import { signBody } from './kolaboro.js';
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const V = 'c1';
let T = null;
async function loadT(env) {
  if (T) return T;
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/n34c-i18n.json')); if (r.ok) T = await r.json(); } catch (e) {}
  return T;
}
const MEMO = {};
async function file(env, p, ttl) {
  const m = MEMO[p]; if (m && Date.now() - m.t < (ttl || 600000)) return m.v;
  let v = null;
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + p)); if (r.ok) v = await r.json(); } catch (e) { v = null; }
  MEMO[p] = { t: Date.now(), v }; return v;
}
async function rawFile(env, p) { try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + p)); return r.ok ? new Uint8Array(await r.arrayBuffer()) : null; } catch (e) { return null; } }
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const t = (l, k) => { const a = T && T[l] && T[l][k]; return a != null ? a : T && T.en[k] != null ? T.en[k] : ''; };
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
const nf = (n, l, d) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { maximumFractionDigits: d == null ? 0 : d, numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
const fd = (d, l) => { if (!d) return ''; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(String(d).slice(0, 10) + 'T12:00:00Z')); } catch (e) { return String(d).slice(0, 10); } };
const ft = (d, l) => { if (!d) return ''; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(d)) + ' UTC'; } catch (e) { return String(d); } };
const bdi = (l, h) => l === 'ar' ? '<bdi>' + h + '</bdi>' : h;
const kb = (n, l) => bdi(l, nf(n / 1024, l, n < 10240 ? 1 : 0) + ' KB');
const te = new TextEncoder();
const hexOf = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const sha = async s => hexOf(await crypto.subtle.digest('SHA-256', typeof s === 'string' ? te.encode(s) : s));
const canon = v => v === null || typeof v !== 'object' ? JSON.stringify(v === undefined ? null : v) : Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
const today = () => new Date().toISOString().slice(0, 10);
const LP = '(?:(es|de|fr|nl|ru|zh|ar)\\/)?';
const F = { us: 'engineering\\/usage', sd: 'engineering\\/sdk', dl: 'data\\/delta', pf: 'engineering\\/performance', mo: 'engineering\\/monitoring', se: 'engineering\\/security', tl: 'verify\\/transparency-log', mc: 'engineering\\/mcp', ec: 'embed\\/charts', sq: 'engineering\\/search-quality' };
const R = {}; for (const k in F) R[k] = new RegExp('^\\/' + LP + F[k] + '\\/?$');
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:engineering\/(?:usage|sdk|performance|monitoring|security|mcp|search-quality)|data\/delta|verify\/transparency-log|embed\/charts)\/?$|^\/embed\/chart\/[a-z0-9-]{2,60}\/?$|^\/api\/v1\/(?:delta(?:\/\d{4}-\d{2}-\d{2}(?:\.sig)?)?|tlog(?:\/proof|\/consistency)?|charts\/[a-z0-9-]{2,60}|monitoring)$/;
export const ALL = [['us', '/engineering/usage/'], ['sd', '/engineering/sdk/'], ['dl', '/data/delta/'], ['pf', '/engineering/performance/'], ['mo', '/engineering/monitoring/'], ['se', '/engineering/security/'], ['tl', '/verify/transparency-log/'], ['mc', '/engineering/mcp/'], ['ec', '/embed/charts/'], ['sq', '/engineering/search-quality/']];

const CSS = '<style>.n34{max-width:1100px}.n34 h2{margin:28px 0 8px;font-size:1.3rem}.n34 p,.n34 li{max-width:78ch;line-height:1.6}.n34-tw{overflow-x:auto;border:1px solid var(--line,#d5d3cc);border-radius:12px;margin:10px 0 22px;-webkit-overflow-scrolling:touch}' +
  '.n34 table{width:100%;border-collapse:collapse;font-size:.93rem}.n34 th,.n34 td{padding:8px 10px;border-bottom:1px solid var(--line,#d5d3cc);text-align:start;vertical-align:top}.n34 th{font-size:.82rem;background:var(--card,#fff)}.n34 td.n{font-variant-numeric:tabular-nums;white-space:nowrap}' +
  '.n34 code,.n34 pre{font-size:.88em;overflow-wrap:anywhere}.n34 pre{white-space:pre-wrap;background:var(--card,#f6f5f1);border:1px solid var(--line,#d5d3cc);border-radius:10px;padding:10px 12px;overflow-x:auto}.n34 .k-xs{font-size:.9rem;color:var(--muted,#59626B)}' +
  '.n34-rel{display:flex;flex-wrap:wrap;gap:4px 16px;padding:0;list-style:none}.n34-rel a{display:inline-flex;min-height:44px;align-items:center}.n34-k{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0}.n34-k div{border:1px solid var(--line,#d5d3cc);border-radius:12px;padding:8px 12px;min-width:120px}.n34-k b{display:block;font-size:1.25rem}' +
  '.n34 .ok{color:#0B7A55;font-weight:700}.n34 .bad{color:#B42318;font-weight:700}.n34 .mut{color:var(--muted,#59626B)}:root[data-theme=dark] .n34 .ok{color:#4BE3A4}:root[data-theme=dark] .n34 .bad{color:#FF8A80}' +
  '.n34 input[type=text],.n34 select{font:inherit;min-height:44px;padding:8px 10px;border:1px solid var(--line,#c9c6bd);border-radius:10px;background:var(--card,#fff);color:inherit;max-width:100%}.n34 button{min-height:44px}.n34 form{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0 16px}' +
  '.n34 svg{max-width:100%;height:auto}.n34 iframe{max-width:100%;border:0}@media print{.n34-tw{overflow:visible;border:0}}</style>';
const table = (th, rows, cap) => '<div class="n34-tw" tabindex="0"><table>' + (cap ? '<caption class="k-xs" style="text-align:start;padding:8px 10px">' + esc(cap) + '</caption>' : '') + '<thead><tr>' + th.map(x => '<th scope="col">' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
const N = () => import('./kbx_named.js');
const rel = (l, skip) => '<h2>' + esc(t(l, 'more')) + '</h2><ul class="n34-rel">' + ALL.filter(x => x[0] !== skip).map(x => '<li><a href="' + pre(l) + x[1] + '">' + esc(t(l, x[0] + '_t')) + '</a></li>').join('') + '<li><a href="/engineering/">' + esc(t(l, 'eng')) + '</a></li><li><a href="' + pre(l) + '/engineering/status/">' + esc(t(l, 'status')) + '</a></li></ul>';
const paras = (l, k) => (t(l, k) || []).map(p => '<p>' + esc(p) + '</p>').join('');
const sec = (h, b, id) => '<h2' + (id ? ' id="' + id + '"' : '') + '>' + esc(h) + '</h2>' + b;
const code = (l, s) => '<pre dir="ltr"><code>' + esc(s) + '</code></pre>';
const lk = (l, href, txt) => '<a href="' + esc(href) + '"' + (l === 'ar' && /^\/(api|data|open|sdk|k)\//.test(href) ? ' dir="ltr"' : '') + '>' + esc(txt || href) + '</a>';
const files = (l, fs) => '<ul>' + fs.map(f => '<li>' + lk(l, f[0]) + (f[1] ? ' <span class="k-xs">' + esc(f[1]) + '</span>' : '') + '</li>').join('') + '</ul>';
const kpis = (l, A) => '<div class="n34-k">' + A.map(x => '<div><b>' + bdi(l, x[0]) + '</b>' + esc(x[1]) + '</div>').join('') + '</div>';
const okc = (l, ok, txt) => '<span class="' + (ok ? 'ok' : 'bad') + '">' + esc(txt || t(l, ok ? 'yes' : 'no')) + '</span>';

async function page(shell, l, o) {
  const n = await N(), canon0 = ORIGIN + pre(l) + o.path;
  const crumbs = [[t(l, 'home'), pre(l) + '/']].concat(o.crumb || [[t(l, 'eng'), '/engineering/']]).concat([[o.h1, null]]);
  const body = '<section class="phero"' + (l === 'ar' ? ' dir="rtl"' : '') + '><div class="wrap"><p class="crumb">' + crumbs.map(c => c[1] ? '<a href="' + esc(c[1]) + '">' + esc(c[0]) + '</a>' : esc(c[0])).join(' / ') + '</p><h1>' + esc(o.h1) + '</h1><p class="lead">' + esc(o.lead) + '</p>' +
    (o.updated ? '<p class="k-xs">' + esc(fill(t(l, 'upd'), { d: fd(o.updated, l) })) + '</p>' : '') + '</div></section><div class="wrap n34"' + (l === 'ar' ? ' dir="rtl"' : '') + '>' + CSS + o.body + rel(l, o.k) + '</div>';
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': o.type || 'WebPage', url: canon0, name: o.h1, description: o.lead, inLanguage: l, dateModified: o.updated || '2026-11-21', isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] ? ORIGIN + c[1] : canon0 })) }].concat(o.ld || []) };
  const desc = o.lead.length > 155 ? o.lead.slice(0, 152).replace(/\s+\S*$/, '') + '…' : o.lead;
  const html = await n.assemble({ title: (o.h1.length > 46 ? o.h1.slice(0, 46).replace(/\s+\S*$/, '') : o.h1) + ' | Kolaboro', desc, canon: canon0, body, ld, alt: x => ORIGIN + pre(x) + o.path, noindex: !!o.noindex }, l, await shell(pre(l) + '/how-we-score/'));
  return new Response(html, { status: 200, headers: Object.assign({ 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=' + (o.maxAge || 600), 'content-language': l }, o.noindex ? { 'x-robots-tag': 'noindex, follow' } : {}) });
}
const H = (l, k) => ({ h1: t(l, k + '_t'), lead: t(l, k + '_l'), k });
const CORS = { 'access-control-allow-origin': '*', 'access-control-expose-headers': 'x-kolaboro-signature, x-kolaboro-key-id, etag' };
async function out(req, env, body, o) {
  o = o || {};
  const etag = '"' + (await sha(body)).slice(0, 32) + '"';
  const h = Object.assign({ 'content-type': o.type || 'application/json; charset=utf-8', etag, 'cache-control': 'public, max-age=' + (o.maxAge || 300) + ', stale-while-revalidate=600', 'x-content-type-options': 'nosniff' }, CORS, o.extra || {});
  if (o.sign !== false) { try { const s = await signBody(env, typeof body === 'string' ? body : new TextDecoder().decode(body)); if (s) { h['x-kolaboro-signature'] = s; h['x-kolaboro-key-id'] = (env && env.KB_SIGN_KID) || 'kb'; } } catch (e) {} }
  const inm = req.headers.get('if-none-match') || '';
  if (inm && inm.split(',').map(s => s.trim().replace(/^W\//, '')).includes(etag)) return new Response(null, { status: 304, headers: h });
  return new Response(req.method === 'HEAD' ? null : body, { status: o.status || 200, headers: h });
}
const jerr = (o, s) => new Response(JSON.stringify(o), { status: s, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, CORS) });
const json = o => JSON.stringify(o, null, 1);

// ------------------------------------------------------------------------------------------------ 24: Brotli copies of /data/*.json
let BRM = null; const BROK = {};
async function brManifest(env) { if (BRM && Date.now() - BRM.t < 600000) return BRM.v; const v = await file(env, '/data/br/manifest.json', 600000); BRM = { t: Date.now(), v }; return v; }
export async function brServe(req, u, env) {
  if (req.method !== 'GET' || req.headers.get('range') || u.search) return null;
  if (!/\bbr\b/.test(req.headers.get('accept-encoding') || '')) return null;
  const f = u.pathname.slice(6), m = await brManifest(env), e = m && m.files && m.files[f];
  if (!e) return null;
  const src = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + f));
  if (!src.ok) return null;
  const tag = (src.headers.get('etag') || '') + '|' + e.source_sha256;
  let ok = BROK[f] && BROK[f].tag === tag ? BROK[f].ok : null;
  if (ok == null) { ok = (await sha(await src.arrayBuffer())) === e.source_sha256; BROK[f] = { tag, ok }; } else { try { await src.body.cancel(); } catch (x) {} }
  if (!ok) return null;
  const b = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + e.br));
  if (!b.ok) return null;
  return new Response(b.body, { status: 200, encodeBody: 'manual', headers: { 'content-type': 'application/json; charset=utf-8', 'content-encoding': 'br', vary: 'accept-encoding', etag: 'W/"br-' + e.source_sha256.slice(0, 24) + '"', 'cache-control': 'public, max-age=60, stale-while-revalidate=300', 'x-content-type-options': 'nosniff', 'access-control-allow-origin': '*', link: '<https://creativecommons.org/licenses/by/4.0/>; rel="license"', 'x-kolaboro-precompressed': 'brotli q11; source sha256 ' + e.source_sha256 } });
}
export function brStatus() { return BROK; }

// ------------------------------------------------------------------------------------------------ 23: signed deltas
async function deltaApi(req, u, env) {
  const p = u.pathname;
  if (p === '/api/v1/delta') { const d = await file(env, '/data/delta/index.json'); if (!d) return jerr({ error: 'unavailable' }, 503); return out(req, env, json(Object.assign({ api: 'kolaboro-delta-v1', page: ORIGIN + '/data/delta/' }, d))); }
  const m = /^\/api\/v1\/delta\/(\d{4}-\d{2}-\d{2})(\.sig)?$/.exec(p); if (!m) return null;
  const raw = await rawFile(env, '/data/delta/' + m[1] + '.json'); if (!raw) return jerr({ error: 'no delta for this day', index: ORIGIN + '/api/v1/delta' }, 404);
  if (!m[2]) return out(req, env, raw, { maxAge: 86400 });
  const h = await sha(raw); let s = null; try { s = await signBody(env, new TextDecoder().decode(raw)); } catch (e) {}
  return out(req, env, json({ type: 'kolaboro-delta-signature-v1', day: m[1], file: ORIGIN + '/data/delta/' + m[1] + '.json', bytes: raw.length, sha256: h, alg: s ? 'Ed25519' : null, kid: (env && env.KB_SIGN_KID) || 'kb', signature: s, message: '"kolaboro-sig-v1\\n" + sha256 (hex)', public_keys: ORIGIN + '/.well-known/kolaboro-keys.json' }), { maxAge: 3600 });
}
async function dlPage(env, shell, l, u) {
  const d = await file(env, '/data/delta/index.json'); if (!d) return null;
  const E = d.entries.slice().reverse(), last = E[0];
  const rows = E.map(x => '<tr><td class="n">' + esc(fd(x.from, l)) + ' → ' + esc(fd(x.to, l)) + '</td><td class="n">' + bdi(l, nf(x.counts.added, l)) + '</td><td class="n">' + bdi(l, nf(x.counts.changed, l)) + '</td><td class="n">' + bdi(l, nf(x.counts.removed, l)) + '</td><td class="n">' + kb(x.bytes, l) + '</td><td>' + lk(l, x.file, 'JSON') + ' · ' + lk(l, x.api + '.sig', t(l, 'dl_sig')) + '</td><td><code>' + esc(x.sha256.slice(0, 12)) + '</code></td></tr>');
  const slug = (u.searchParams.get('project') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90);
  let look = '';
  if (slug) { const bp = await file(env, '/data/delta/by-project.json', 3600000), hs = bp && bp.projects[slug];
    look = hs ? table(t(l, 'dl_lth'), hs.slice().reverse().map(h => '<tr><td class="n">' + esc(fd(h[0], l)) + '</td><td>' + (typeof h[1] === 'string' ? esc(t(l, 'dl_' + h[1])) : h[1].map(f => '<code>' + esc(f) + '</code>').join(' ')) + '</td><td>' + lk(l, '/data/delta/' + h[0] + '.json', 'JSON') + '</td></tr>')) + '<p><a href="' + pre(l) + '/projects/' + esc(slug) + '/">' + esc(t(l, 'open_project')) + '</a></p>' : '<p class="mut">' + esc(t(l, 'dl_none')) + '</p>'; }
  const b = kpis(l, [[nf(d.entries.length, l), t(l, 'dl_files')], [fd(last.to, l), t(l, 'dl_last')], [nf(last.counts.projects_after, l), t(l, 'dl_after')]]) +
    sec(t(l, 'dl_list'), table(t(l, 'dl_th'), rows)) +
    sec(t(l, 'dl_look'), '<form method="get" action="' + pre(l) + '/data/delta/"><label for="dlp">' + esc(t(l, 'slug')) + '</label> <input type="text" id="dlp" name="project" value="' + esc(slug) + '" placeholder="amani-melasti" dir="ltr"> <button type="submit" class="btn">' + esc(t(l, 'show')) + '</button></form>' + look) +
    sec(t(l, 'dl_how'), paras(l, 'dl_p') + code(l, 'curl -s https://kolaboro.com/api/v1/delta/' + last.to + ' -o ' + last.to + '.json\ncurl -s https://kolaboro.com/api/v1/delta/' + last.to + '.sig -o ' + last.to + '.sig.json\ncurl -s https://kolaboro.com/data/snapshots/' + last.from + '/named.json.gz -o base.json.gz\npython3 kolaboro_offline_verify.py delta ' + last.to + '.json ' + last.to + '.sig.json base.json.gz')) +
    files(l, [['/data/delta/index.json', 'JSON'], ['/api/v1/delta', t(l, 'signed')], ['/data/delta/by-project.json', 'JSON'], ['/open/n34c-daily.py', 'Python'], ['/open/kolaboro_offline_verify.py', 'Python'], ['/open/kolaboro-offline-verify.mjs', 'Node']]) + '<p><a href="' + pre(l) + '/data/snapshots/">' + esc(t(l, 'snapshots')) + '</a> · <a href="' + pre(l) + '/verify/offline/">' + esc(t(l, 'offline')) + '</a></p>';
  return page(shell, l, Object.assign(H(l, 'dl'), { path: '/data/delta/', body: b, updated: last.to, crumb: [[t(l, 'data'), '/data/']], noindex: !!slug }));
}

// ------------------------------------------------------------------------------------------------ 27: transparency log (RFC 6962 trees)
const B16 = h => { const a = new Uint8Array(h.length / 2); for (let i = 0; i < a.length; i++) a[i] = parseInt(h.substr(i * 2, 2), 16); return a; };
const cat = (...a) => { const n = a.reduce((s, x) => s + x.length, 0), o = new Uint8Array(n); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; };
const H0 = async b => new Uint8Array(await crypto.subtle.digest('SHA-256', b));
const node2 = (a, b) => H0(cat(new Uint8Array([1]), a, b));
const leafOf = s => H0(cat(new Uint8Array([0]), te.encode(s)));
const k2 = n => { let k = 1; while (k * 2 < n) k *= 2; return k; };
async function mth(L) { if (L.length === 1) return L[0]; const k = k2(L.length); return node2(await mth(L.slice(0, k)), await mth(L.slice(k))); }
async function pathOf(m, L) { if (L.length <= 1) return []; const k = k2(L.length); return m < k ? (await pathOf(m, L.slice(0, k))).concat([await mth(L.slice(k))]) : (await pathOf(m - k, L.slice(k))).concat([await mth(L.slice(0, k))]); }
async function subproof(m, L, b) { const n = L.length; if (m === n) return b ? [] : [await mth(L)]; const k = k2(n); return m <= k ? (await subproof(m, L.slice(0, k), b)).concat([await mth(L.slice(k))]) : (await subproof(m - k, L.slice(k), false)).concat([await mth(L.slice(0, k))]); }
const hexA = a => [...a].map(x => x.toString(16).padStart(2, '0')).join('');
let LOGL = null;
async function logLeaves(tl) { if (LOGL && LOGL.root === tl.root) return LOGL.L; const L = []; for (const x of tl.entries) L.push(await leafOf('kolaboro-tlog-day-v1|' + x.day + '|' + x.root + '|' + x.n + '|' + x.snapshot_head)); LOGL = { root: tl.root, L }; return L; }
async function treeHead(env, size) {
  const tl = await file(env, '/data/tlog/index.json'); if (!tl) return null;
  const n = size || tl.size, th = { type: 'kolaboro-tlog-tree-head-v1', log: ORIGIN + '/verify/transparency-log/', size: n, root: tl.roots_by_size[n - 1], latest_day: tl.entries[n - 1].day, signed_at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z') };
  const h = await sha(canon(th)); let s = null; try { s = await signBody(env, canon(th)); } catch (e) {}
  return { tl, th, sig: s ? { alg: 'Ed25519', kid: (env && env.KB_SIGN_KID) || 'kb', value: s, tree_head_sha256: h, message: '"kolaboro-sig-v1\\n" + SHA-256 hex of the canonical JSON of tree_head' } : null };
}
const DAYREC = {};
async function snapshotRecord(env, e, slug) {
  let P = DAYREC[e.day];
  if (!P) {
    const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/snapshots/' + e.day + '/named.json.gz')); if (!r.ok) return null;
    const txt = await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).text(), d = JSON.parse(txt);
    P = new Map((d.projects || []).map(x => [x.s, x])); for (const k of Object.keys(DAYREC)) delete DAYREC[k]; DAYREC[e.day] = P;
  }
  return P.get(slug) || null;
}
export async function tlogProof(env, slug, day) {
  const T0 = await treeHead(env); if (!T0) return { error: 'unavailable' };
  const { tl, th, sig } = T0, E = tl.entries;
  let i = day ? E.findIndex(x => x.day === day) : E.length - 1;
  if (i < 0) return { error: 'no log entry for this day', days: E.map(x => x.day) };
  const lv = await file(env, '/data/tlog/' + E[i].day + '.json', 3600000); if (!lv) return { error: 'unavailable' };
  let j = lv.slugs.indexOf(slug);
  if (j < 0 && !day) { for (i = E.length - 2; i >= 0; i--) { const l2 = await file(env, '/data/tlog/' + E[i].day + '.json', 3600000); if (l2 && (j = l2.slugs.indexOf(slug)) >= 0) { return tlogProof(env, slug, E[i].day); } } }
  if (j < 0) return { error: 'this project is not in the snapshot of ' + E[i].day, hint: 'Projects in Sumba are never named (conflict of interest).' };
  const rec = await snapshotRecord(env, E[i], slug); if (!rec) return { error: 'snapshot copy unavailable' };
  const L = []; for (let x = 0; x < lv.n; x++) L.push(B16(lv.leaves.substr(x * 64, 64)));
  const leaf = await leafOf('kolaboro-tlog-v1|' + E[i].day + '|' + slug + '|' + canon(rec));
  if (hexA(leaf) !== lv.leaves.substr(j * 64, 64)) return { error: 'record does not match the published leaf' };
  const LL = await logLeaves(tl);
  return { type: 'kolaboro-tlog-proof-v1', project: slug, day: E[i].day, record: rec, leaf: hexA(leaf), leaf_index: j, day_size: lv.n, day_root: lv.root, day_path: (await pathOf(j, L)).map(hexA),
    snapshot: { sha256: E[i].snapshot_sha256, head: E[i].snapshot_head, copy: ORIGIN + '/data/snapshots/' + E[i].day + '/named.json.gz' }, day_index: i, log_path: (await pathOf(i, LL)).map(hexA), tree_head: th, signature: sig,
    verify: 'python3 kolaboro_offline_verify.py tlog proof.json [named.json.gz]  (https://kolaboro.com/verify/offline/)' };
}
async function tlogApi(req, u, env) {
  const p = u.pathname, q = u.searchParams;
  if (p === '/api/v1/tlog') { const T0 = await treeHead(env); if (!T0) return jerr({ error: 'unavailable' }, 503); return out(req, env, json({ tree_head: T0.th, signature: T0.sig, entries: T0.tl.entries, roots_by_size: T0.tl.roots_by_size, rules: { record_leaf: T0.tl.record_leaf, day_leaf: T0.tl.day_leaf, node: T0.tl.node, canonical_json: T0.tl.canonical_json } }), { maxAge: 300 }); }
  if (p === '/api/v1/tlog/proof') {
    const slug = (q.get('project') || '').toLowerCase(), day = q.get('day') || '';
    if (!/^[a-z0-9-]{1,90}$/.test(slug)) return jerr({ error: 'project must be a page slug, e.g. amani-melasti' }, 400);
    if (day && !/^\d{4}-\d{2}-\d{2}$/.test(day)) return jerr({ error: 'day must be YYYY-MM-DD' }, 400);
    const r = await tlogProof(env, slug, day); if (r.error) return jerr(r, 404);
    return out(req, env, json(r), { maxAge: 300 });
  }
  if (p === '/api/v1/tlog/consistency') {
    const tl = await file(env, '/data/tlog/index.json'); if (!tl) return jerr({ error: 'unavailable' }, 503);
    const a = parseInt(q.get('first') || '1', 10), b = parseInt(q.get('second') || String(tl.size), 10);
    if (!(a >= 1 && b >= a && b <= tl.size)) return jerr({ error: 'need 1 <= first <= second <= ' + tl.size }, 400);
    const LL = await logLeaves(tl), T0 = await treeHead(env, b);
    return out(req, env, json({ type: 'kolaboro-tlog-consistency-v1', first: a, second: b, first_root: tl.roots_by_size[a - 1], second_root: tl.roots_by_size[b - 1], path: (await subproof(a, LL.slice(0, b), true)).map(hexA), tree_head: T0.th, signature: T0.sig,
      verify: 'python3 kolaboro_offline_verify.py tlog-consistency cons.json' }), { maxAge: 300 });
  }
  return null;
}
async function tlPage(env, shell, l, u) {
  const T0 = await treeHead(env); if (!T0) return null;
  const { tl, th, sig } = T0, E = tl.entries.slice().reverse();
  const rows = E.map(x => '<tr><td class="n">' + esc(fd(x.day, l)) + '</td><td class="n">' + bdi(l, nf(x.n, l)) + '</td><td><code>' + esc(x.root.slice(0, 16)) + '…</code></td><td><code>' + esc(x.snapshot_head.slice(0, 12)) + '…</code></td><td>' + lk(l, x.file, 'JSON') + '</td></tr>');
  const slug = (u.searchParams.get('project') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90);
  const b = kpis(l, [[nf(tl.size, l), t(l, 'tl_days')], [nf(tl.entries[tl.size - 1].n, l), t(l, 'tl_recs')], ['<code>' + esc(tl.root.slice(0, 12)) + '</code>', t(l, 'tl_root')], [sig ? okc(l, true, 'Ed25519') : okc(l, false), t(l, 'tl_signed')]]) +
    sec(t(l, 'tl_check'), '<form method="get" action="' + pre(l) + '/verify/transparency-log/" id="tl-f"><label for="tlp">' + esc(t(l, 'slug')) + '</label> <input type="text" id="tlp" name="project" value="' + esc(slug || 'amani-melasti') + '" dir="ltr"> <button type="submit" class="btn">' + esc(t(l, 'tl_verify')) + '</button></form>' +
      '<div id="tl-out" role="status" aria-live="polite"' + (slug ? ' data-auto="1"' : '') + '><p class="k-xs">' + esc(t(l, 'tl_hint')) + '</p></div><script type="application/json" id="tl-t">' + JSON.stringify(Object.assign({}, T.en.c_tl, (T[l] || {}).c_tl || {})).replace(/</g, '\\u003c') + '</script><script src="/k/n34c/tlog.js?v=' + V + '" defer></script>' +
      '<noscript><p>' + lk(l, '/api/v1/tlog/proof?project=' + (slug || 'amani-melasti'), t(l, 'tl_json')) + '</p></noscript>') +
    sec(t(l, 'tl_head'), code(l, JSON.stringify({ tree_head: th, signature: sig }, null, 1))) +
    sec(t(l, 'tl_entries'), table(t(l, 'tl_th'), rows)) +
    sec(t(l, 'method'), paras(l, 'tl_p') + code(l, tl.record_leaf + '\n' + tl.day_leaf + '\n' + tl.node)) +
    sec(t(l, 'tl_off'), code(l, 'curl -s "https://kolaboro.com/api/v1/tlog/proof?project=amani-melasti" -o proof.json\npython3 kolaboro_offline_verify.py tlog proof.json\ncurl -s "https://kolaboro.com/api/v1/tlog/consistency?first=1&second=' + tl.size + '" -o cons.json\nnode kolaboro-offline-verify.mjs tlog-consistency cons.json')) +
    files(l, [['/api/v1/tlog', t(l, 'signed')], ['/data/tlog/index.json', 'JSON'], ['/open/n34c-daily.py', 'Python'], ['/open/kolaboro_offline_verify.py', 'Python'], ['/open/kolaboro-offline-verify.mjs', 'Node']]) +
    '<p><a href="' + pre(l) + '/data/snapshots/">' + esc(t(l, 'snapshots')) + '</a> · <a href="/log/">' + esc(t(l, 'publog')) + '</a> · <a href="/engineering/transparency-log/">' + esc(t(l, 'tl_old')) + '</a></p>';
  return page(shell, l, Object.assign(H(l, 'tl'), { path: '/verify/transparency-log/', body: b, updated: tl.entries[tl.size - 1].day, crumb: [[t(l, 'verify'), '/verify/']], maxAge: 300, noindex: !!slug }));
}

// ------------------------------------------------------------------------------------------------ 21: usage
async function usPage(env, shell, l) {
  const K = await import('./kbx_n27a.js'), d = await K.apiUsage(28);
  const G = Object.entries(d.by_endpoint).sort((a, b) => b[1] - a[1]), M = Object.entries(d.mcp_tools).sort((a, b) => b[1] - a[1]);
  const b = '<p><b>' + esc(t(l, 'us_nv')) + '</b></p>' + kpis(l, [[nf(d.total, l), t(l, 'us_calls')], [nf(G.length, l), t(l, 'us_eps')], [nf(d.mcp_total, l), t(l, 'us_mcp')], [fd(d.since, l), t(l, 'us_since')]]) +
    sec(t(l, 'us_by'), G.length ? table(t(l, 'us_th'), G.map(([k, v]) => '<tr><td><code dir="ltr">' + esc(k) + '</code></td><td class="n">' + bdi(l, nf(v, l)) + '</td></tr>')) : '<p class="mut">' + esc(t(l, 'us_zero')) + '</p>') +
    sec(t(l, 'us_tools'), M.length ? table(t(l, 'us_th2'), M.map(([k, v]) => '<tr><td><code dir="ltr">' + esc(k) + '</code></td><td class="n">' + bdi(l, nf(v, l)) + '</td></tr>')) : '<p class="mut">' + esc(t(l, 'us_zero')) + '</p>') +
    sec(t(l, 'us_day'), table(t(l, 'us_th3'), d.per_day.map(x => '<tr><td class="n">' + esc(fd(x.date, l)) + '</td><td class="n">' + bdi(l, nf(x.calls, l)) + '</td><td class="n">' + bdi(l, nf(x.mcp, l)) + '</td></tr>'))) +
    sec(t(l, 'method'), paras(l, 'us_p')) + files(l, [['/api/open/usage', 'JSON'], ['/metrics/#usage', t(l, 'us_pages')]]);
  return page(shell, l, Object.assign(H(l, 'us'), { path: '/engineering/usage/', body: b, updated: today(), maxAge: 300 }));
}

// ------------------------------------------------------------------------------------------------ 25: monitoring
async function monData(env) {
  const [m, live] = await Promise.all([file(env, '/data/monitoring.json', 300000), (async () => { try { const r = await fetch(ORIGIN + '/api/x/status/pages', { cf: { cacheTtl: 60 } }); return r.ok ? await r.json() : null; } catch (e) { return null; } })()]);
  const S = (m && m.samples) || [], P = {};
  for (const s of S) for (const x of s.pages) { const o = P[x[0]] = P[x[0]] || { n: 0, up: 0, ms: [], last: null }; o.n++; if (x[1] >= 200 && x[1] < 400) o.up++; if (x[2] != null) o.ms.push(x[2]); o.last = [s.at, x[1], x[2]]; }
  const q = (a, p) => { if (!a.length) return null; const b = a.slice().sort((x, y) => x - y), i = (b.length - 1) * p, lo = Math.floor(i); return Math.round(b[lo] + (b[Math.min(lo + 1, b.length - 1)] - b[lo]) * (i - lo)); };
  const days = {}; for (const s of S) { const d = s.at.slice(0, 10), o = days[d] = days[d] || { n: 0, up: 0, runs: 0 }; o.runs++; for (const x of s.pages) { o.n++; if (x[1] >= 200 && x[1] < 400) o.up++; } }
  return { m, live, S, P: Object.entries(P).map(([p, o]) => ({ p, n: o.n, up: o.up, p50: q(o.ms, 0.5), p95: q(o.ms, 0.95), last: o.last })), days: Object.entries(days).sort().map(([d, o]) => Object.assign({ d }, o)) };
}
async function moPage(env, shell, l) {
  const d = await monData(env); if (!d.m) return null;
  const all = d.P.reduce((a, x) => [a[0] + x.up, a[1] + x.n], [0, 0]);
  const bars = d.days.length ? '<svg viewBox="0 0 ' + (d.days.length * 22 + 10) + ' 70" width="' + (d.days.length * 22 + 10) + '" height="70" role="img" aria-label="' + esc(t(l, 'mo_chart')) + '">' + d.days.map((x, i) => { const h = Math.round(x.up / x.n * 50); return '<rect x="' + (5 + i * 22) + '" y="' + (55 - h) + '" width="16" height="' + h + '" fill="' + (x.up === x.n ? '#0B7A55' : '#B42318') + '"><title>' + esc(x.d + ': ' + x.up + '/' + x.n) + '</title></rect>'; }).join('') + '<line x1="0" y1="55.5" x2="' + (d.days.length * 22 + 10) + '" y2="55.5" stroke="currentColor" stroke-opacity=".3"/></svg>' : '';
  const b = kpis(l, [[nf(d.S.length, l), t(l, 'mo_runs')], [all[1] ? nf(all[0] / all[1] * 100, l, 2) + ' %' : '-', t(l, 'mo_up')], [nf(d.days.length, l), t(l, 'mo_days')], [d.live ? nf(d.live.up, l) + '/' + nf(d.live.n, l) : '-', t(l, 'mo_edge')]]) +
    sec(t(l, 'mo_daily'), bars + table(t(l, 'mo_dth'), d.days.slice().reverse().map(x => '<tr><td class="n">' + esc(fd(x.d, l)) + '</td><td class="n">' + bdi(l, nf(x.runs, l)) + '</td><td class="n">' + bdi(l, nf(x.up, l) + '/' + nf(x.n, l)) + '</td></tr>'), t(l, 'mo_chart'))) +
    sec(t(l, 'mo_pages'), table(t(l, 'mo_th'), d.P.map(x => '<tr><td><a href="' + esc(x.p) + '" dir="ltr"><code>' + esc(x.p) + '</code></a></td><td class="n">' + bdi(l, nf(x.up, l) + '/' + nf(x.n, l)) + '</td><td class="n">' + (x.p50 == null ? '-' : bdi(l, nf(x.p50, l) + ' ms')) + '</td><td class="n">' + (x.p95 == null ? '-' : bdi(l, nf(x.p95, l) + ' ms')) + '</td><td class="n">' + (x.last ? esc(ft(x.last[0], l)) + ' · ' + x.last[1] : '') + '</td></tr>'))) +
    sec(t(l, 'mo_runs_h'), table(t(l, 'mo_rth'), d.S.slice(-15).reverse().map(s => '<tr><td class="n">' + esc(ft(s.at, l)) + '</td><td>' + esc(s.vantage) + '</td><td><code>' + esc(s.commit || '') + '</code></td><td class="n">' + bdi(l, nf(s.pages.filter(x => x[1] >= 200 && x[1] < 400).length, l) + '/' + nf(s.pages.length, l)) + '</td></tr>'))) +
    sec(t(l, 'method'), paras(l, 'mo_p')) + files(l, [['/api/v1/monitoring', 'JSON'], ['/data/monitoring.json', 'JSON'], ['/api/x/status/pages', t(l, 'mo_edge')], ['/open/deploy-guard.py', 'Python'], ['/open/n34c-build.py', 'Python']]);
  return page(shell, l, Object.assign(H(l, 'mo'), { path: '/engineering/monitoring/', body: b, updated: d.S.length ? d.S[d.S.length - 1].at : null, maxAge: 300 }));
}

// ------------------------------------------------------------------------------------------------ 26: security headers, live
const SEC_PAGES = ['/', '/projects/amani-melasti/', '/ar/m/dubai/', '/login/', '/embed/chart/dubai/', '/api/v1/projects?limit=1', '/data/delta/index.json', '/mcp'];
const SEC_H = ['strict-transport-security', 'content-security-policy', 'content-security-policy-report-only', 'x-content-type-options', 'referrer-policy', 'permissions-policy', 'x-frame-options', 'cross-origin-opener-policy', 'access-control-allow-origin', 'reporting-endpoints'];
let SECM = null;
async function secData() {
  if (SECM && Date.now() - SECM.t < 300000) return SECM.v;
  const pages = await Promise.all(SEC_PAGES.map(async p => { try { const r = await fetch(ORIGIN + p, { headers: { 'user-agent': 'kolaboro-security-page/1.0' }, redirect: 'manual' }); const h = {}; for (const k of SEC_H) { const v = r.headers.get(k); if (v != null) h[k] = v; } try { await r.body.cancel(); } catch (e) {} return { p, status: r.status, h }; } catch (e) { return { p, status: 0, h: {} }; } }));
  let csp = null; try { const r = await fetch(ORIGIN + '/api/x/live/csp', { cf: { cacheTtl: 300 } }); if (r.ok) csp = await r.json(); } catch (e) {}
  const v = { at: new Date().toISOString(), pages, csp }; SECM = { t: Date.now(), v }; return v;
}
async function sePage(env, shell, l) {
  const [d, txt] = await Promise.all([secData(), file(env, '/data/security-text.json', 600000)]);
  const short = v => v.length > 90 ? v.slice(0, 88) + '…' : v;
  const rows = SEC_H.map(k => '<tr><th scope="row"><code>' + esc(k) + '</code></th>' + d.pages.map(p => '<td>' + (p.h[k] != null ? okc(l, true, '✓') : '<span class="mut">-</span>') + '</td>').join('') + '</tr>');
  const vals = SEC_H.map(k => { const p = d.pages.find(x => x.h[k] != null); return p ? '<tr><th scope="row"><code>' + esc(k) + '</code></th><td><code dir="ltr">' + esc(short(p.h[k])) + '</code><br><span class="k-xs">' + esc(p.p) + '</span></td></tr>' : ''; }).filter(Boolean);
  const c = d.csp, dir = c && c.by_directive ? c.by_directive.slice(0, 8) : [];
  const b = (txt && (txt[l] || txt.en) ? sec(t(l, 'se_in'), (txt[l] || txt.en).map(p => '<p>' + esc(p) + '</p>').join('')) : '') +
    sec(t(l, 'se_live'), '<p class="k-xs">' + esc(fill(t(l, 'se_at'), { d: ft(d.at, l) })) + '</p>' + table([t(l, 'se_h')].concat(d.pages.map(p => p.p + ' (' + p.status + ')')), rows)) +
    sec(t(l, 'se_vals'), table([t(l, 'se_h'), t(l, 'se_v')], vals)) +
    sec(t(l, 'se_csp'), c ? kpis(l, [[nf(c.last_7d || 0, l), t(l, 'se_7d')], [nf(c.total || 0, l), t(l, 'se_tot')], [nf(c.pages || 0, l), t(l, 'se_pages')]]) + '<p>' + esc(c.mode || '') + '</p>' +
      (dir.length ? table([t(l, 'se_dir'), t(l, 'se_n')], dir.map(x => '<tr><td><code>' + esc(x.directive || x.d || '') + '</code></td><td class="n">' + bdi(l, nf(x.n, l)) + '</td></tr>')) : '') : '<p class="mut">' + esc(t(l, 'na')) + '</p>') +
    sec(t(l, 'method'), paras(l, 'se_p')) + files(l, [['/api/x/live/csp', 'JSON'], ['/api/open/security', 'JSON'], ['/.well-known/security.txt', 'security.txt']]) + '<p><a href="/trust/">' + esc(t(l, 'trust')) + '</a></p>';
  return page(shell, l, Object.assign(H(l, 'se'), { path: '/engineering/security/', body: b, updated: today(), maxAge: 300 }));
}

// ------------------------------------------------------------------------------------------------ 24: performance page
async function pfPage(env, shell, l) {
  const [pb, bm, bud] = await Promise.all([file(env, '/data/perf-budget.json'), brManifest(env), file(env, '/open/perf-budget.json')]); if (!pb) return null;
  const NM = t(l, 'pf_nm') || {};
  const cell = (m, b) => '<td class="n">' + kb(m, l) + (b ? ' <span class="k-xs">/ ' + kb(b, l) + '</span>' : '') + '</td>';
  const rows = pb.templates.map(x => '<tr><th scope="row"><a href="' + (x.key === 'project_ar' ? x.path : pre(l) + x.path) + '">' + esc(NM[x.key] || x.key) + '</a></th>' + cell(x.measured.html_wire, x.budget.html_wire) + cell(x.measured.js_wire, x.budget.js_wire) + cell(x.measured.css_wire, x.budget.css_wire) + '<td class="n">' + x.measured.requests + (x.budget.requests ? ' <span class="k-xs">/ ' + x.budget.requests + '</span>' : '') + '</td><td>' + okc(l, !x.over.length) + '</td></tr>');
  const st = brStatus(), brows = bm ? Object.entries(bm.files).map(([f, e]) => '<tr><td><a href="/data/' + esc(f) + '" dir="ltr"><code>' + esc(f) + '</code></a></td><td class="n">' + kb(e.source_bytes, l) + '</td><td class="n">' + kb(e.br_bytes, l) + '</td><td class="n">' + bdi(l, nf(100 - e.br_bytes / e.source_bytes * 100, l, 1) + ' %') + '</td><td>' + (st[f] ? okc(l, st[f].ok, t(l, st[f].ok ? 'pf_serving' : 'pf_stale')) : '<span class="mut">' + esc(t(l, 'pf_notyet')) + '</span>') + '</td></tr>') : [];
  const allA = new Set(), ver = new Set(); for (const x of pb.templates) for (const a of x.assets) { allA.add(a.path); if (/[?&]v=/.test(a.path)) ver.add(a.path); }
  const b = kpis(l, [[nf(pb.passed, l) + '/' + nf(pb.total, l), t(l, 'pf_pass')], [nf(ver.size, l) + '/' + nf(allA.size, l), t(l, 'pf_imm')], [bm ? nf(Object.keys(bm.files).length, l) : '0', t(l, 'pf_brn')]]) +
    sec(t(l, 'pf_tpl'), table(t(l, 'pf_th'), rows) + '<p class="k-xs">' + esc(fill(t(l, 'pf_how'), { d: ft(pb.measured, l) })) + '</p>') +
    sec(t(l, 'pf_br'), paras(l, 'pf_brp') + table(t(l, 'pf_bth'), brows) + code(l, 'curl -sI -H "accept-encoding: br" https://kolaboro.com/data/named.json | grep -i "content-encoding\\|x-kolaboro-precompressed"')) +
    sec(t(l, 'pf_immh'), paras(l, 'pf_immp')) + sec(t(l, 'pf_push'), paras(l, 'pf_pushp') + code(l, 'python3 _s/kolaboro.com/open/n34c-build.py budget HEAD\npython3 _s/kolaboro.com/open/n34c-build.py perf')) +
    files(l, [['/open/perf-budget.json', bud ? bud.set : 'JSON'], ['/data/perf-budget.json', 'JSON'], ['/data/br/manifest.json', 'JSON'], ['/open/n34c-build.py', 'Python'], ['/open/pre-push.sh', 'sh']]) + '<p><a href="/engineering/page-weight/">' + esc(t(l, 'pf_pw')) + '</a> · <a href="' + pre(l) + '/engineering/early-hints/">Early Hints</a></p>';
  return page(shell, l, Object.assign(H(l, 'pf'), { path: '/engineering/performance/', body: b, updated: pb.measured }));
}

// ------------------------------------------------------------------------------------------------ 22: SDK page
async function sdPage(env, shell, l) {
  const [m, ts] = await Promise.all([file(env, '/sdk/v1/manifest.json'), file(env, '/sdk/v1/tests.json')]); if (!m) return null;
  const fr = Object.entries(m.files).map(([f, e]) => '<tr><td><a href="/sdk/v1/' + esc(f) + '" dir="ltr" download><code>' + esc(f) + '</code></a></td><td class="n">' + kb(e.bytes, l) + '</td><td><code title="SHA-256">' + esc(e.sha256.slice(0, 16)) + '…</code></td></tr>');
  const tr = ts ? ts.runs.map(r => '<tr><td>' + esc(r.client) + '</td><td class="n">' + bdi(l, nf(r.passed, l) + '/' + nf(r.total, l)) + '</td><td class="n">' + esc(ft(r.at, l)) + '</td><td>' + okc(l, r.passed === r.total) + '</td></tr>') : [];
  const b = kpis(l, [[esc(m.version), t(l, 'sd_ver')], [nf(m.operations, l), t(l, 'sd_ops')], [esc(m.spec_version), t(l, 'sd_spec')]]) +
    sec(t(l, 'sd_files'), table(t(l, 'sd_th'), fr)) + sec(t(l, 'sd_js'), code(l, m.examples.js)) + sec(t(l, 'sd_py'), code(l, m.examples.py)) +
    sec(t(l, 'sd_tests'), tr.length ? table(t(l, 'sd_tth'), tr) : '<p class="mut">' + esc(t(l, 'na')) + '</p>') +
    sec(t(l, 'method'), paras(l, 'sd_p')) + files(l, [['/api/v1/openapi.json', 'OpenAPI 3.1'], ['/open/sdk-gen.py', 'Python'], ['/sdk/v1/SHA256SUMS', 'SHA-256']]) + '<p><a href="/docs/sdk/">' + esc(t(l, 'sd_old')) + '</a> · <a href="' + pre(l) + '/api/docs/">' + esc(t(l, 'apidocs')) + '</a></p>';
  return page(shell, l, Object.assign(H(l, 'sd'), { path: '/engineering/sdk/', body: b, updated: m.built, type: 'TechArticle' }));
}

// ------------------------------------------------------------------------------------------------ 30: search quality page
async function sqPage(env, shell, l) {
  const d = await file(env, '/data/search-quality.json'); if (!d || !d.runs) return null;
  const R0 = d.runs[0], R1 = d.runs[d.runs.length - 1], LN = t(l, 'langs') || {};
  const rows = Object.keys(R1.languages).map(L => { const a = R0.languages[L], z = R1.languages[L]; return '<tr><th scope="row">' + esc(LN[L] || L) + '</th><td class="n">' + bdi(l, nf(a.pass_pct, l, 1) + ' %') + '</td><td class="n">' + bdi(l, nf(z.pass_pct, l, 1) + ' %') + '</td><td class="n">' + bdi(l, nf(z.mrr, l, 3)) + '</td><td class="n">' + Object.entries(z.kinds).map(([k, v]) => esc((t(l, 'sq_k') || {})[k] || k) + ' ' + v.pass + '/' + v.n).join('<br>') + '</td></tr>'; });
  const fails = Object.entries(R1.languages).flatMap(([L, z]) => z.fails.slice(0, 2).map(f => '<tr><td>' + esc(L) + '</td><td dir="auto"><code>' + esc(f.q) + '</code></td><td>' + (f.first ? '<a href="' + pre(l) + '/projects/' + esc(f.first) + '/">' + esc(f.first) + '</a>' : '-') + '</td><td class="n">' + (f.expected_rank || '-') + '</td></tr>'));
  const hist = d.runs.slice().reverse().slice(0, 12).map(r => '<tr><td class="n">' + esc(ft(r.at, l)) + '</td><td>' + esc(r.label || '') + '</td><td class="n">' + Object.values(r.languages).reduce((a, x) => a + x.pass, 0) + '/' + Object.values(r.languages).reduce((a, x) => a + x.n, 0) + '</td></tr>');
  const b = kpis(l, [[nf(Object.values(R1.languages).reduce((a, x) => a + x.n, 0), l), t(l, 'sq_q')], [nf(Object.values(R1.languages).reduce((a, x) => a + x.pass, 0) / Object.values(R1.languages).reduce((a, x) => a + x.n, 0) * 100, l, 1) + ' %', t(l, 'sq_now')], [nf(Object.values(R0.languages).reduce((a, x) => a + x.pass, 0) / Object.values(R0.languages).reduce((a, x) => a + x.n, 0) * 100, l, 1) + ' %', t(l, 'sq_before')]]) +
    sec(t(l, 'sq_by'), table(t(l, 'sq_th'), rows)) + sec(t(l, 'sq_fail'), fails.length ? table(t(l, 'sq_fth'), fails) : '<p class="ok">' + esc(t(l, 'sq_nofail')) + '</p>') +
    sec(t(l, 'sq_hist'), table(t(l, 'sq_hth'), hist)) + sec(t(l, 'method'), paras(l, 'sq_p')) +
    files(l, [['/open/search-tests.json', 'JSON'], ['/open/search-quality.mjs', 'Node'], ['/data/search-quality.json', 'JSON'], ['/data/search-aliases.json', 'JSON'], ['/api/v1/find?q=dubai', 'API']]);
  return page(shell, l, Object.assign(H(l, 'sq'), { path: '/engineering/search-quality/', body: b, updated: R1.at }));
}

// ------------------------------------------------------------------------------------------------ 28: MCP v2 page and tools
export const TOOLS2 = [
  { name: 'project_history', title: 'Dated history of a project record',
    description: 'Every day on which the published record of one named project changed, from the daily signed snapshots: added, removed, or which fields changed, with the new values for the most recent changes (up to 6 days). By page slug (e.g. amani-melasti). Facts as published, no verdict.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['slug'], properties: { slug: { type: 'string', pattern: '^[a-z0-9-]{1,90}$' } } } },
  { name: 'project_evidence', title: 'Claims and their sources for a project',
    description: 'The tested claims of one named project, each with its result (verified, unverified, contradicted), what it was checked against (official register, independent source, developer, not checked) and the source URL, plus the evidence note per check and every source we read. By page slug.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['slug'], properties: { slug: { type: 'string', pattern: '^[a-z0-9-]{1,90}$' } } } },
  { name: 'compare_markets', title: 'Compare 2 to 4 markets',
    description: 'Side by side for 2 to 4 markets (e.g. ["Dubai","Bali","Phuket"]): projects tracked, share with a public permit, share with deposit protection, average checks public and confirmed, transparency index, and the delay index (share past the first handover date, median and 90th percentile months late, sample sizes). Historical statistics, not a promise about any project.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['markets'], properties: { markets: { type: 'array', minItems: 2, maxItems: 4, items: { type: 'string', maxLength: 60 } } } } },
  { name: 'transparency_proof', title: 'Merkle inclusion proof of a project record',
    description: 'Proof that one named project record is in the append-only transparency log: the record, its leaf, the path to that day\'s root, the path to the log root and the signed tree head. Verifiable offline with kolaboro_offline_verify.py tlog. By page slug, optional day (YYYY-MM-DD, default the latest snapshot).',
    inputSchema: { type: 'object', additionalProperties: false, required: ['slug'], properties: { slug: { type: 'string', pattern: '^[a-z0-9-]{1,90}$' }, day: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' } } } },
  { name: 'dataset_delta', title: 'What changed in the dataset on a day',
    description: 'The signed daily delta of the named-project dataset: counts of projects added, changed and removed between two snapshot days, the slugs (up to 200 each) and the links to the full delta file and its Ed25519 signature. Optional day (YYYY-MM-DD, default the latest).',
    inputSchema: { type: 'object', additionalProperties: false, properties: { day: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' } } } },
].map(x => Object.assign(x, { annotations: { title: x.title, readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }));
const lc = s => String(s || '').trim().toLowerCase();
async function marketsData(env) { try { const r = await fetch(ORIGIN + '/api/open/markets', { cf: { cacheTtl: 600 } }); return r.ok ? await r.json() : null; } catch (e) { return null; } }
export async function mcpTool(env, name, a) {
  const slugOk = s => typeof s === 'string' && /^[a-z0-9-]{1,90}$/.test(s);
  if (name === 'project_history') {
    if (!slugOk(a.slug)) return { err: 'slug must be lowercase letters, digits and hyphens' };
    const bp = await file(env, '/data/delta/by-project.json', 3600000), hs = bp && bp.projects[a.slug];
    if (!hs) return { status: 404, body: { error: 'no history for this slug', hint: 'Use search_text to find the slug. Projects in Sumba are never named.' } };
    const rec = hs.slice().reverse(), outD = [];
    for (let i = 0; i < rec.length; i++) { const [day, ch] = rec[i], e = { day, change: typeof ch === 'string' ? ch : 'changed', fields: typeof ch === 'string' ? null : ch, delta_file: ORIGIN + '/data/delta/' + day + '.json' };
      if (i < 6 && typeof ch !== 'string') { const d = await file(env, '/data/delta/' + day + '.json', 600000); const c = d && d.changed[a.slug]; if (c) { e.new_values = c.set; if (c.unset) e.removed_fields = c.unset; e.from_day = d.from.day; } }
      outD.push(e); }
    return { body: { project: a.slug, page: ORIGIN + '/projects/' + a.slug + '/', snapshot_days: bp.days, changes: outD, note: 'Days are snapshot days of /data/named.json; a day lists changes since the previous snapshot day. Source: the signed daily deltas at https://kolaboro.com/data/delta/.' }, source: ORIGIN + '/data/delta/by-project.json' };
  }
  if (name === 'project_evidence') {
    if (!slugOk(a.slug)) return { err: 'slug must be lowercase letters, digits and hyphens' };
    const n = await N(), ix = await n.data(env), x = ix.bySlug.get(a.slug);
    if (!x) return { status: 404, body: { error: 'no named project with this slug' } };
    const ST = ['verified', 'unverified', 'contradicted'], LV = { registry: 'official register', independent: 'independent source', developer: 'developer', none: 'not checked' };
    return { body: { project: a.slug, name: x.n, developer: x.dv || null, page: ORIGIN + '/projects/' + a.slug + '/',
      claims: (x.cl || []).map(c => ({ claim: c[0], result: ST.includes(c[1]) ? c[1] : c[1], checked_against: LV[c[2]] || c[2], source: c[3] || null })),
      evidence_by_check: x.ev || {}, sources: x.src || [], last_read: x.ad || null, rules: 'Facts as published, each with its source. Kolaboro gives no verdict about a named company.' }, source: ORIGIN + '/projects/' + a.slug + '/' };
  }
  if (name === 'compare_markets') {
    const L = a.markets; if (!Array.isArray(L) || L.length < 2 || L.length > 4 || L.some(v => typeof v !== 'string' || v.length > 60)) return { err: 'markets must be 2 to 4 market names' };
    const [mk, di] = await Promise.all([marketsData(env), file(env, '/data/delay-index.json')]);
    const rows = L.map(m => { const a1 = mk && (mk.markets || []).find(x => lc(x.market) === lc(m)), d1 = di && (di.markets || []).find(x => lc(x.market) === lc(m));
      return { market: m, found: !!(a1 || d1), transparency: a1 || null, delays: d1 ? { tracked: d1.tracked, with_date: d1.with_date, past_first_handover: d1.past_first, share_past_first_pct: d1.share_past_first, median_months_late: d1.median_late, p90_months_late: d1.p90_late, sample_late: (d1.late_months || []).length } : null }; });
    return { body: { markets: rows, delay_index_month: di && di.as_of_month, delay_rules: di && di.rules, sources: [ORIGIN + '/api/open/markets', ORIGIN + '/data/delay-index.json'], note: 'Historical statistics of the projects we track, with sample sizes; not a promise or a verdict.' }, source: ORIGIN + '/api/open/markets + /data/delay-index.json' };
  }
  if (name === 'transparency_proof') {
    if (!slugOk(a.slug)) return { err: 'slug must be lowercase letters, digits and hyphens' };
    if (a.day != null && !/^\d{4}-\d{2}-\d{2}$/.test(a.day)) return { err: 'day must be YYYY-MM-DD' };
    const r = await tlogProof(env, a.slug, a.day || ''); if (r.error) return { status: 404, body: r };
    return { body: r, source: ORIGIN + '/api/v1/tlog/proof?project=' + a.slug + (a.day ? '&day=' + a.day : '') };
  }
  if (name === 'dataset_delta') {
    if (a.day != null && !/^\d{4}-\d{2}-\d{2}$/.test(a.day)) return { err: 'day must be YYYY-MM-DD' };
    const ix = await file(env, '/data/delta/index.json'), e = ix && (a.day ? ix.entries.find(x => x.to === a.day) : ix.entries[ix.entries.length - 1]);
    if (!e) return { status: 404, body: { error: 'no delta for this day', days: ix ? ix.entries.map(x => x.to) : [] } };
    const d = await file(env, '/data/delta/' + e.to + '.json', 600000);
    return { body: { from: d.from, to: d.to, counts: d.counts, added: d.added.slice(0, 200).map(x => x.s), changed: Object.keys(d.changed).slice(0, 200), removed: d.removed.slice(0, 200), file: ORIGIN + e.file, file_sha256: e.sha256, signature: ORIGIN + e.api + '.sig', verify: 'python3 kolaboro_offline_verify.py delta <day>.json <day>.sig.json [from-day named.json.gz]' }, source: ORIGIN + e.api };
  }
  return null;
}
async function mcPage(env, shell, l) {
  const E = await import('./kbx_e.js'), TL = E.TOOLS || [], ts = await file(env, '/data/mcp-tests.json');
  const v2 = new Set(TOOLS2.map(x => x.name));
  const rows = TL.map(x => '<tr><td><code dir="ltr">' + esc(x.name) + '</code>' + (v2.has(x.name) ? ' <b class="ok">v2</b>' : '') + '</td><td>' + esc(x.title) + '</td><td dir="ltr" class="k-xs">' + esc(Object.keys((x.inputSchema || {}).properties || {}).join(', ')) + '</td></tr>');
  const tr = ts ? ts.results.map(r => '<tr><td><code dir="ltr">' + esc(r.tool) + '</code></td><td>' + okc(l, r.ok) + '</td><td class="k-xs">' + esc(r.detail || '') + '</td></tr>') : [];
  const b = kpis(l, [[esc(E.SERVER ? E.SERVER.version : '2'), t(l, 'mc_ver')], [nf(TL.length, l), t(l, 'mc_tools')], [nf(v2.size, l), t(l, 'mc_new')], [ts ? nf(ts.passed, l) + '/' + nf(ts.total, l) : '-', t(l, 'mc_tests')]]) +
    sec(t(l, 'mc_list'), table(t(l, 'mc_th'), rows)) + sec(t(l, 'mc_try'), code(l, 'curl -s https://kolaboro.com/mcp -H "content-type: application/json" -H "accept: application/json, text/event-stream" \\\n  -d \'{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"compare_markets","arguments":{"markets":["Dubai","Bali"]}}}\'')) +
    sec(t(l, 'mc_tests_h'), tr.length ? table(t(l, 'mc_tth'), tr) + '<p class="k-xs">' + esc(fill(t(l, 'mc_tat'), { d: ft(ts.at, l) })) + '</p>' : '<p class="mut">' + esc(t(l, 'na')) + '</p>') +
    sec(t(l, 'method'), paras(l, 'mc_p')) + '<p><a href="/docs/mcp/">' + esc(t(l, 'mc_docs')) + '</a> · <a href="/data/mcp-tests.json" dir="ltr">mcp-tests.json</a></p>';
  return page(shell, l, Object.assign(H(l, 'mc'), { path: '/engineering/mcp/', body: b, updated: '2026-11-21', type: 'TechArticle' }));
}

// ------------------------------------------------------------------------------------------------ 29: chart embeds
const mslug = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
async function chartData(env, ms) {
  const [mk, di] = await Promise.all([marketsData(env), file(env, '/data/delay-index.json')]);
  const a = mk && (mk.markets || []).find(x => mslug(x.market) === ms), d = di && (di.markets || []).find(x => mslug(x.market) === ms);
  if (!a && !d) return null;
  const B = [[0, 3], [4, 6], [7, 12], [13, 24], [25, 999]], lm = (d && d.late_months) || [];
  return { market: (a || d).market, country: a ? a.country : null, disclosure: a ? { projects: a.projects, permit_public_pct: a.permit_public_pct, deposit_protection_pct: a.deposit_protection_pct, avg_checks_public: a.avg_checks, avg_checks_confirmed: a.avg_confirmed, transparency_index: a.transparency_index } : null,
    delays: d ? { tracked: d.tracked, with_date: d.with_date, past_first: d.past_first, share_past_first_pct: d.share_past_first, median_months_late: d.median_late, p90_months_late: d.p90_late, buckets: B.map(([x, y]) => ({ from: x, to: y === 999 ? null : y, n: lm.filter(v => v >= x && v <= y).length })) } : null,
    as_of: { markets: mk && mk.updated, delay_index: di && di.as_of_month }, page: ORIGIN + '/m/' + ms + '/', licence: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)' };
}
export function chartSvg(c, kind, l, dark) {
  const fg = dark ? '#E8ECEF' : '#17212B', mu = dark ? '#9AA6B2' : '#59626B', ac = dark ? '#4BE3A4' : '#0B7A55', bad = dark ? '#FF8A80' : '#B42318', W = 360, rtl = l === 'ar';
  const tx = (x, y, s, o) => '<text x="' + x + '" y="' + y + '" fill="' + ((o && o.c) || fg) + '" font-size="' + ((o && o.s) || 12) + '"' + (o && o.a ? ' text-anchor="' + o.a + '"' : '') + (o && o.w ? ' font-weight="700"' : '') + '>' + esc(s) + '</text>';
  let body = '', h = 0, title;
  if (kind === 'disclosure' && c.disclosure) {
    const D = c.disclosure, R = [[t(l, 'ch_permit'), D.permit_public_pct], [t(l, 'ch_escrow'), D.deposit_protection_pct], [t(l, 'ch_checks'), Math.round(D.avg_checks_public / 6 * 100)], [t(l, 'ch_ti'), D.transparency_index]];
    title = fill(t(l, 'ch_dt'), { m: c.market });
    R.forEach((r, i) => { const y = 44 + i * 30, w = Math.max(0, Math.min(100, r[1] || 0)) * 1.6; body += tx(rtl ? W - 10 : 10, y + 12, r[0], { s: 11.5, a: rtl ? 'end' : null }) + '<rect x="' + (rtl ? 10 + 160 - w : 190) + '" y="' + (y + 1) + '" width="' + w + '" height="14" rx="3" fill="' + ac + '"/>' + tx(rtl ? 10 + 160 - w - 4 : 194 + w, y + 13, (r[1] == null ? '-' : r[1]) + (i < 2 || i === 2 ? '%' : ''), { s: 11, c: mu, a: rtl ? 'end' : null }); });
    h = 44 + R.length * 30 + 4; body += tx(rtl ? W - 10 : 10, h + 10, fill(t(l, 'ch_dn'), { n: D.projects }), { s: 10.5, c: mu, a: rtl ? 'end' : null }); h += 18;
  } else if (c.delays) {
    const D = c.delays, mx = Math.max(1, ...D.buckets.map(b => b.n)); title = fill(t(l, 'ch_lt'), { m: c.market });
    body += tx(rtl ? W - 10 : 10, 44, fill(t(l, 'ch_ls'), { a: D.past_first, b: D.with_date, p: D.share_past_first_pct }), { s: 11.5, a: rtl ? 'end' : null });
    D.buckets.forEach((b, i) => { const x = 20 + i * 66, bh = Math.round(b.n / mx * 70); body += '<rect x="' + x + '" y="' + (132 - bh) + '" width="44" height="' + bh + '" rx="3" fill="' + bad + '"/>' + tx(x + 22, 128 - bh, String(b.n), { s: 11, a: 'middle', w: 1 }) + tx(x + 22, 148, b.to == null ? b.from + '+' : b.from + '-' + b.to, { s: 10.5, c: mu, a: 'middle' }); });
    body += tx(W / 2, 163, t(l, 'ch_months'), { s: 10.5, c: mu, a: 'middle' }) + tx(rtl ? W - 10 : 10, 182, D.median_months_late == null ? t(l, 'ch_small') : fill(t(l, 'ch_med'), { m: D.median_months_late, p: D.p90_months_late, n: D.past_first }), { s: 10.5, c: mu, a: rtl ? 'end' : null });
    h = 190;
  } else return null;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + (h + 26) + '" width="' + W + '" height="' + (h + 26) + '" role="img" aria-label="' + esc(title) + '" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif"' + (rtl ? ' direction="rtl"' : '') + '>' +
    tx(rtl ? W - 10 : 10, 20, title, { s: 13.5, w: 1, a: rtl ? 'end' : null }) + body + tx(rtl ? W - 10 : 10, h + 16, fill(t(l, 'ch_src'), { d: kind === 'disclosure' ? (c.as_of.markets || '') : (c.as_of.delay_index || '') }), { s: 10, c: mu, a: rtl ? 'end' : null }) + '</svg>';
}
async function chartIframe(env, u) {
  const ms = /^\/embed\/chart\/([a-z0-9-]{2,60})\/?$/.exec(u.pathname)[1], q = u.searchParams, l = LANGS.includes(q.get('lang')) ? q.get('lang') : 'en';
  const kind = q.get('kind') === 'disclosure' ? 'disclosure' : 'delays', dark = q.get('theme') === 'dark';
  const c = await chartData(env, ms); if (!c) return new Response('not found', { status: 404, headers: { 'content-type': 'text/plain' } });
  const svg = chartSvg(c, kind, l, dark); if (!svg) return new Response('no data', { status: 404, headers: { 'content-type': 'text/plain' } });
  const href = ORIGIN + pre(l) + '/m/' + ms + '/?utm_source=embed&utm_medium=chart';
  const tbl = kind === 'delays' && c.delays ? c.delays.buckets.map(b => '<tr><td>' + (b.to == null ? b.from + '+' : b.from + '-' + b.to) + '</td><td>' + b.n + '</td></tr>').join('') : c.disclosure ? Object.entries(c.disclosure).map(([k, v]) => '<tr><td>' + esc(k) + '</td><td>' + esc(v) + '</td></tr>').join('') : '';
  const html = '<!doctype html><html lang="' + l + '"' + (l === 'ar' ? ' dir="rtl"' : '') + '><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><link rel="canonical" href="' + ORIGIN + pre(l) + '/m/' + ms + '/"><title>' + esc(c.market) + ' | Kolaboro</title>' +
    '<style>html,body{margin:0;background:' + (dark ? '#0F161D' : '#fff') + ';color:' + (dark ? '#E8ECEF' : '#17212B') + ';font:13px system-ui,sans-serif}main{padding:6px}svg{max-width:100%;height:auto;display:block}a{color:inherit}.s{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}</style></head><body><main>' + svg +
    '<table class="s"><caption>' + esc(c.market) + '</caption>' + tbl + '</table><p style="margin:2px 0 0;font-size:11px"><a href="' + esc(href) + '" target="_blank">' + esc(fill(t(l, 'ch_more'), { m: c.market })) + '</a></p></main></body></html>';
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=3600', 'content-language': l } });
}
async function chartApi(req, u, env) {
  const ms = /^\/api\/v1\/charts\/([a-z0-9-]{2,60})$/.exec(u.pathname)[1], q = u.searchParams, l = LANGS.includes(q.get('lang')) ? q.get('lang') : 'en';
  const c = await chartData(env, ms); if (!c) return jerr({ error: 'unknown market', list: ORIGIN + '/api/open/markets' }, 404);
  c.svg = { delays: chartSvg(c, 'delays', l, q.get('theme') === 'dark'), disclosure: chartSvg(c, 'disclosure', l, q.get('theme') === 'dark') };
  c.link = { href: ORIGIN + pre(l) + '/m/' + ms + '/', text: fill(t(l, 'ch_more'), { m: c.market }) };
  return out(req, env, json(c), { maxAge: 3600 });
}
async function ecPage(env, shell, l) {
  const di = await file(env, '/data/delay-index.json'), mk = await marketsData(env);
  const ok = new Set(((di && di.markets) || []).filter(x => x.with_date >= 5).map(x => mslug(x.market)));
  const L = ((mk && mk.markets) || []).filter(x => ok.has(mslug(x.market))).sort((a, b) => b.projects - a.projects).slice(0, 40);
  const ex = 'dubai', lang = l === 'en' ? '' : '&lang=' + l;
  const snip1 = '<iframe src="https://kolaboro.com/embed/chart/' + ex + '/?kind=delays' + lang + '" width="380" height="250" loading="lazy" title="Kolaboro: Dubai" style="border:0"></iframe>';
  const snip2 = '<script type="module" src="https://kolaboro.com/k/n34c/chart.js?v=' + V + '"></script>\n<kolaboro-chart market="' + ex + '" kind="disclosure"' + (l === 'en' ? '' : ' lang="' + l + '"') + '></kolaboro-chart>';
  const b = sec(t(l, 'ec_live'), '<div style="display:flex;flex-wrap:wrap;gap:16px"><iframe src="/embed/chart/' + ex + '/?kind=delays' + lang + '" width="380" height="250" loading="lazy" title="' + esc(fill(t(l, 'ch_lt'), { m: 'Dubai' })) + '"></iframe><iframe src="/embed/chart/' + ex + '/?kind=disclosure' + lang + '" width="380" height="230" loading="lazy" title="' + esc(fill(t(l, 'ch_dt'), { m: 'Dubai' })) + '"></iframe></div>') +
    sec(t(l, 'ec_build'), '<form id="ec-f" data-v="' + V + '" data-l="' + l + '"><label for="ec-m">' + esc(t(l, 'ec_market')) + '</label> <select id="ec-m">' + L.map(x => '<option value="' + mslug(x.market) + '"' + (mslug(x.market) === ex ? ' selected' : '') + '>' + esc(x.market) + '</option>').join('') + '</select> <label for="ec-k">' + esc(t(l, 'ec_kind')) + '</label> <select id="ec-k"><option value="delays">' + esc(t(l, 'ec_delays')) + '</option><option value="disclosure">' + esc(t(l, 'ec_disc')) + '</option></select> <label><input type="checkbox" id="ec-d"> ' + esc(t(l, 'ec_dark')) + '</label></form>' +
      '<h3>' + esc(t(l, 'ec_if')) + '</h3><pre dir="ltr"><code id="ec-s1">' + esc(snip1) + '</code></pre><h3>' + esc(t(l, 'ec_wc')) + '</h3><pre dir="ltr"><code id="ec-s2">' + esc(snip2) + '</code></pre><div id="ec-prev"></div><script src="/k/n34c/embed.js?v=' + V + '" defer></script>') +
    sec(t(l, 'method'), paras(l, 'ec_p')) + files(l, [['/api/v1/charts/dubai', 'JSON'], ['/k/n34c/chart.js', 'JS'], ['/data/delay-index.json', 'JSON'], ['/api/open/markets', 'JSON']]) + '<p><a href="' + pre(l) + '/embed/">' + esc(t(l, 'ec_old')) + '</a> · <a href="' + pre(l) + '/tools/widget/">' + esc(t(l, 'ec_widget')) + '</a></p>';
  return page(shell, l, Object.assign(H(l, 'ec'), { path: '/embed/charts/', body: b, updated: di && di.generated, crumb: [[t(l, 'embed'), '/embed/']] }));
}

// ------------------------------------------------------------------------------------------------ block for /engineering/status/
export async function statusBlock(env, l) {
  if (!(await loadT(env))) return '';
  let us = null, mo = null; try { us = await (await import('./kbx_n27a.js')).apiUsage(28); } catch (e) {} try { mo = await monData(env); } catch (e) {}
  const G = us ? Object.entries(us.by_endpoint).sort((a, b) => b[1] - a[1]).slice(0, 8) : [];
  const all = mo ? mo.P.reduce((a, x) => [a[0] + x.up, a[1] + x.n], [0, 0]) : [0, 0];
  return '<section class="n34" id="usage"' + (l === 'ar' ? ' dir="rtl"' : '') + '>' + CSS + '<h2>' + esc(t(l, 'us_t')) + '</h2><p class="k-xs">' + esc(t(l, 'us_nv')) + '</p>' +
    (G.length ? table(t(l, 'us_th'), G.map(([k, v]) => '<tr><td><code dir="ltr">' + esc(k) + '</code></td><td class="n">' + bdi(l, nf(v, l)) + '</td></tr>')) : '<p class="mut">' + esc(t(l, 'us_zero')) + '</p>') +
    '<p><a href="' + pre(l) + '/engineering/usage/">' + esc(t(l, 'us_t')) + '</a></p><h2 id="monitoring">' + esc(t(l, 'mo_t')) + '</h2>' +
    (mo && mo.S.length ? kpis(l, [[nf(mo.S.length, l), t(l, 'mo_runs')], [all[1] ? nf(all[0] / all[1] * 100, l, 2) + ' %' : '-', t(l, 'mo_up')], [nf(mo.days.length, l), t(l, 'mo_days')]]) : '') +
    '<p><a href="' + pre(l) + '/engineering/monitoring/">' + esc(t(l, 'mo_t')) + '</a> · <a href="' + pre(l) + '/engineering/performance/">' + esc(t(l, 'pf_t')) + '</a> · <a href="' + pre(l) + '/engineering/security/">' + esc(t(l, 'se_t')) + '</a> · <a href="' + pre(l) + '/engineering/search-quality/">' + esc(t(l, 'sq_t')) + '</a></p></section>';
}

export async function handle(req, u, env, ctx, shell) {
  const p = u.pathname; let m;
  if (!PATHS.test(p) || (req.method !== 'GET' && req.method !== 'HEAD')) return null;
  if (!(await loadT(env))) return null;
  if (p.startsWith('/api/v1/delta')) return deltaApi(req, u, env);
  if (p.startsWith('/api/v1/tlog')) return tlogApi(req, u, env);
  if (p.startsWith('/api/v1/charts/')) return chartApi(req, u, env);
  if (p === '/api/v1/monitoring') { const d = await monData(env); return out(req, env, json({ about: d.m && d.m.about, per_page: d.P, per_day: d.days, samples: d.S, edge_now: d.live }), { maxAge: 120 }); }
  if (p.startsWith('/embed/chart/')) return chartIframe(env, u);
  if (!p.endsWith('/')) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } });
  const L = x => x || 'en';
  if ((m = R.us.exec(p))) return usPage(env, shell, L(m[1]));
  if ((m = R.sd.exec(p))) return sdPage(env, shell, L(m[1]));
  if ((m = R.dl.exec(p))) return dlPage(env, shell, L(m[1]), u);
  if ((m = R.pf.exec(p))) return pfPage(env, shell, L(m[1]));
  if ((m = R.mo.exec(p))) return moPage(env, shell, L(m[1]));
  if ((m = R.se.exec(p))) return sePage(env, shell, L(m[1]));
  if ((m = R.tl.exec(p))) return tlPage(env, shell, L(m[1]), u);
  if ((m = R.mc.exec(p))) return mcPage(env, shell, L(m[1]));
  if ((m = R.ec.exec(p))) return ecPage(env, shell, L(m[1]));
  if ((m = R.sq.exec(p))) return sqPage(env, shell, L(m[1]));
  return null;
}
// links to the ten batch-34 pages for other modules' "more engineering" lists (call ready(env) first; empty when strings are not loaded)
export async function ready(env) { return !!(await loadT(env)); }
export function relLinks(l) { if (!T) return ''; return '<h2>' + esc(t(l, 'more')) + '</h2><ul class="n32-rel">' + ALL.map(x => '<li><a href="' + pre(l) + x[1] + '">' + esc(t(l, x[0] + '_t')) + '</a></li>').join('') + '</ul>'; }
