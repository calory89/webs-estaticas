// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_n30b__q, $s = TB.kbx_n30b__s, $t = TB.kbx_n30b__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { T } from './kbx_n30b_i18n.js';
import { dqExtra, dqJson, loadT as n31cT } from './kbx_n31c.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const LP = '(?:(es|de|fr|nl|ru|zh|ar)\\/)?';
const RX = {
snap: new RegExp('^\\/' + LP + 'data\\/snapshots\\/?$'), docs: new RegExp('^\\/' + LP + 'api\\/docs\\/?$'),
certP: new RegExp('^\\/' + LP + 'projects\\/([a-z0-9-]{1,90})\\/certificate\\/?$'), dq: new RegExp('^\\/' + LP + 'engineering\\/data-quality\\/?$'),
off: new RegExp('^\\/' + LP + 'offline\\/?$')
};
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:data\/snapshots|api\/docs|engineering\/data-quality|offline|projects\/[a-z0-9-]{1,90}\/certificate)\/?$|^\/api\/v1\/(?:snapshots|openapi\.json|data-quality|changes(?:\/feed\.json)?|projects\/[a-z0-9-]{1,90}\/certificate|developers\/[a-z0-9-]{1,90}\/website)$|^\/manifest\.webmanifest$/;
const pre = l => l === 'en' ? '' : '/' + l;
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a, "'": '&#39;' }[c]));
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
const nf = (n, l, d) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { maximumFractionDigits: d || 0, numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
const fdt = (d, l) => { if (!d) return ''; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: $q.b, month: 'short', year: $q.b, timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(String(d).slice(0, 10) + $q.c)); } catch (e) { return d; } };
const te = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
async function sha(x) { return hex(await crypto.subtle.digest($q.d, typeof x === $q.e ? te.encode(x) : x)); }
function canon(v) {
  if (v === null || typeof v !== $q.f) return JSON.stringify(v === undefined ? null : v);
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  return '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
}
const ar = (l, h) => l === 'ar' ? '<bdi>' + h + $q.g : h;
const today = () => new Date().toISOString().slice(0, 10);
const RAW = {};
async function rawFile(env, p) {
const m = RAW[p]; if (m && Date.now() - m.t < 600000) return m;
let r = null;
try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + $q.h + p)); } catch (e) { r = null; }
if (!r || !r.ok) r = await fetch(ORIGIN + p, { cf: { cacheTtl: 120 } });
if (!r.ok) throw new Error(p + ' ' + r.status);
const b = await r.arrayBuffer(), o = { t: Date.now(), bytes: b.byteLength, sha256: await sha(b), buf: b };
RAW[p] = o; return o;
}
async function jsonFile(env, p) { const f = await rawFile(env, p); return JSON.parse(new TextDecoder().decode(f.buf)); }
const N = () => import('./kbx_named.js');
const RL = new Map();
async function rate(req, ctx, bucket, max) {   // per IP per minute: in-isolate count plus a shared count in the colo cache (as kbx_follow.js)
  const ip = req.headers.get($q.i) || $q.j, min = Math.floor(Date.now() / 60000), k = bucket + '|' + ip + '|' + min;
  const local = (RL.get(k) || 0) + 1; RL.set(k, local);
  if (RL.size > 5000) for (const key of RL.keys()) if (!key.endsWith('|' + min)) RL.delete(key);
  let shared = 0; const ck = new Request(ORIGIN + $q.k + bucket + '/' + encodeURIComponent(ip) + '/' + min);
  try { const hit = await caches.default.match(ck); if (hit) shared = +(await hit.text()) || 0; } catch (e) {}
  const n = Math.max(local, shared + 1);
  try { const p = caches.default.put(ck, new Response(String(n), { headers: { 'cache-control': $q.l } })); if (ctx && ctx.waitUntil) ctx.waitUntil(p.catch(() => {})); } catch (e) {}
  return { ok: n <= max, remaining: Math.max(0, max - n), reset: 60 - Math.floor(Date.now() / 1000) % 60 };
}
const LIMIT = 120;
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, HEAD, OPTIONS', 'access-control-allow-headers': 'if-none-match, if-modified-since, accept', 'access-control-expose-headers': 'etag, last-modified, ratelimit, ratelimit-policy, x-ratelimit-limit, x-ratelimit-remaining, retry-after, x-kolaboro-signature, x-kolaboro-key-id, x-edge-cache', 'access-control-max-age': '86400' };
export const rlHeaders = rl => ({ 'ratelimit-policy': $q.m + LIMIT + ';w=60', ratelimit: $q.n + rl.remaining + ';t=' + rl.reset, 'x-ratelimit-limit': LIMIT + ';w=60', 'x-ratelimit-remaining': String(rl.remaining) });
async function out(req, body, o) {
  o = o || {};
  const etag = '"' + (await sha(body)).slice(0, 32) + '"';
  const h = Object.assign({ 'content-type': o.type || $q.o, etag, 'cache-control': $q.p + (o.maxAge || 300) + $q.q + (o.maxAge || 300) + $q.r, vary: $q.s, 'x-content-type-options': $q.t }, CORS, o.extra || {});
  if (o.lastMod) h[$q.u] = new Date(o.lastMod).toUTCString();
  const inm = req.headers.get($q.v) || '', ims = req.headers.get($q.w);
  if ((inm && inm.split(',').map(s => s.trim().replace(/^W\//, '')).includes(etag)) || (!inm && ims && o.lastMod && Date.parse(ims) >= Math.floor(Date.parse(o.lastMod) / 1000) * 1000)) return new Response(null, { status: 304, headers: h });
  return new Response(req.method === 'HEAD' ? null : body, { status: o.status || 200, headers: h });
}
const jerr = (o, s, extra) => new Response(JSON.stringify(o), { status: s, headers: Object.assign({ 'content-type': $q.o, 'cache-control': $q.x }, CORS, extra || {}) });
async function signed(env, body) {
try { const K = await import('./kolaboro.js'); const s = await K.signBody(env, body); return s ? { 'x-kolaboro-signature': s, 'x-kolaboro-key-id': (env && env.KB_SIGN_KID) || 'kb' } : null; } catch (e) { return null; }
}
const page = (html, lang, extra) => new Response(html, { headers: Object.assign({ 'content-type': $q.y, 'cache-control': $q.z, 'content-language': lang }, extra || {}) });
async function chain(env) {
const idx = await jsonFile(env, $q.A), live = await rawFile(env, $q.B);
const E = idx.entries || [], last = E[E.length - 1] || null, match = E.filter(e => e.sha256 === live.sha256).map(e => e.day).pop() || null;
let tip = null;
if (!last || last.sha256 !== live.sha256) {
const day = today(), prev = last ? last.head : $q.C;
tip = { day, provisional: true, bytes: live.bytes, sha256: live.sha256, prev, head: await sha($q.D + day + $q.E + live.sha256 + '|' + live.bytes + '|' + prev), copy: $q.B, note: $s.k0 };
}
return Object.assign({}, idx, { api: $q.F, live: { file: $q.B, bytes: live.bytes, sha256: live.sha256, matches_entry: match }, provisional_tip: tip, chain_tip: tip ? tip.head : (last ? last.head : null),
verify: { page: ORIGIN + $q.G, public_keys: ORIGIN + $q.H, signature: $t.k0 } });
}
const short = s => String(s || '').slice(0, 12) + '…';
async function snapPage(req, u, env, ctx, shell, lang) {
let X34 = ''; try { const m = await import('./kbx_n34c.js'); if (await m.ready(env)) X34 = m.relLinks(lang); } catch (e) {}
const L = T[lang], P = pre(lang), c = await chain(env), path = P + $q.G, canonU = ORIGIN + path;
const rows = (c.entries || []).slice().reverse().map(e => $q.I + esc(fdt(e.day, lang)) + $q.J + ar(lang, nf(e.projects || 0, lang)) + $q.J + ar(lang, nf(e.bytes / 1e6, lang, 2)) + $q.K + e.sha256 + '">' + short(e.sha256) + $q.L + e.head + '">' + short(e.head) + $q.M + esc(e.copy) + $q.N + ar(lang, nf(e.copy_bytes / 1e6, lang, 2)) + $q.O).join('');
const tipRow = c.provisional_tip ? $q.P + esc(fdt(c.provisional_tip.day, lang)) + $q.Q + esc(L.sn_tip) + $q.R + ar(lang, nf(c.provisional_tip.bytes / 1e6, lang, 2)) + $q.K + c.provisional_tip.sha256 + '">' + short(c.provisional_tip.sha256) + $q.L + c.provisional_tip.head + '">' + short(c.provisional_tip.head) + $t.k1 : '';
const msg = { wait: L.sn_verify_wait, ok_chain: L.sn_ok_chain, bad_chain: L.sn_bad_chain, ok_live: L.sn_ok_live, live_new: L.sn_live_new, sig_ok: L.sn_sig_ok, sig_no: L.sn_sig_no, sig_bad: L.sn_sig_bad, match: L.sn_match, nomatch: L.sn_nomatch, loc: LOC[lang] };
const body = $q.S + (lang === 'ar' ? $q.T : '') + $t.k2 + P + '/">' + esc(L.home) + $q.U + esc(L.data) + $q.V + esc(L.sn_h1) + $q.W + esc(L.sn_h1) + $q.X + esc(L.sn_lead) + $q.Y +
$q.Z + (lang === 'ar' ? $q.aa : '') + $q.ab + esc(JSON.stringify(msg)) + '">' + $s.CSS +
'<h2>' + esc(L.sn_verify_h) + $t.k3 + esc(L.sn_verify_btn) + $t.k4 +
$q.ac + esc(L.sn_file_lbl) + $s.k1 + esc(L.sn_nothing) + $t.k5 +
$t.k6 + L.sn_th.map(x => $q.ad + esc(x) + '</th>').join('') + $q.ae + tipRow + rows + $q.af +
$q.ag + esc(L.sn_note) + '</p>' +
'<h2>' + esc(L.sn_cli_h) + $q.ah + esc(L.sn_cli) + $q.ai + esc(L.sn_rule_h) + $q.aj + esc(c.head_rule) + $q.ak + esc(((c.entries || []).slice(-1)[0] || {}).copy || $q.B) + $s.k2 +
'<p>' + fill(esc(L.sn_more), { log: $q.al, api: $t.k7 }) + $q.am + P + $q.an + P + $q.ao + esc(T[lang].dq_h1) + $q.ap + X34 + $q.aq +
$q.ar + $s.SNAP_JS + $q.as;
const ld = { '@context': $q.at, '@graph': [{ '@type': $q.au, name: L.sn_h1, description: L.sn_lead, url: canonU, license: $t.k8, isAccessibleForFree: true, dateModified: c.updated, creator: { '@id': ORIGIN + '/#org' },
distribution: (c.entries || []).map(e => ({ '@type': $q.av, encodingFormat: $q.aw, contentUrl: ORIGIN + e.copy, sha256: e.sha256, uploadDate: e.day })) },
{ '@type': $q.ax, itemListElement: [{ '@type': $q.ay, position: 1, name: $q.az, item: ORIGIN + P + '/' }, { '@type': $q.ay, position: 2, name: L.data, item: ORIGIN + $q.aA }, { '@type': $q.ay, position: 3, name: L.sn_h1, item: canonU }] }] };
return assemble({ title: L.sn_title + $q.aB, desc: L.sn_lead.slice(0, 155), canon: canonU, body, ld, lastmod: c.updated, alt: l => ORIGIN + pre(l) + $q.G }, lang, shell, $q.aA);
}
let CH = null;
async function allChanges(env) {
const n = await N(), ix = await n.data(env);
if (CH && CH.ix === ix) return CH;
const F = await import('./kbx_follow.js'), E = [], seen = new Set();
const fnv = t => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16).padStart(8, '0'); };
for (const x of ix.P) {
let ev = []; try { ev = F.events(n, ix, x); } catch (e) { ev = []; }
for (const e of ev) { let id = e.key; if (seen.has(id)) id += '~' + fnv(String(e.text || e.title)); seen.add(id); E.push({ id, at: e.d, kind: String(e.key).split('/')[1] || $q.aC, project: { id: x.id, slug: x.s, name: x.n, market: x.mk, country: x.co }, title: e.title, text: e.text, source: e.src || null, url: e.url }); }
}
E.sort((a, b) => a.at < b.at ? -1 : a.at > b.at ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
CH = { ix, E, last: E.length ? E[E.length - 1].at : null }; return CH;
}
const b64u = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => { try { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return decodeURIComponent(escape(atob(s))); } catch (e) { return null; } };
function normSince(s) {
if (!s) return null; s = String(s).trim();
if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s + $q.aD;
const d = new Date(s); return isNaN(d) ? undefined : d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}
async function changes(req, u, env, rh) {
const C = await allChanges(env), q = u.searchParams;
const since = normSince(q.get('since')); if (since === undefined) return jerr({ error: $q.aE, expected: $q.aF }, 400, rh);
let cur = null; if (q.get($q.aG)) { const c = unb64u(q.get($q.aG)); const m = c && c.split('\n'); if (!m || m.length !== 2) return jerr({ error: $q.aH }, 400, rh); cur = { at: m[0], id: m[1] }; }
const limit = Math.max(1, Math.min(1000, +(q.get('limit') || 500) || 500)), proj = q.get($q.aI), mk = (q.get($q.aJ) || '').toLowerCase();
let L = C.E;
if (proj) L = L.filter(e => e.project.slug === proj || e.project.id === proj.toUpperCase());
if (mk) L = L.filter(e => String(e.project.market).toLowerCase() === mk || String(e.project.country).toLowerCase() === mk);
if (cur) L = L.filter(e => e.at > cur.at || (e.at === cur.at && e.id > cur.id)); else if (since) L = L.filter(e => e.at > since);
const page = L.slice(0, limit), more = L.length > limit, lastE = page[page.length - 1];
const nextCur = more && lastE ? b64u(lastE.at + '\n' + lastE.id) : null;
const keep = new URLSearchParams(); if (proj) keep.set($q.aI, proj); if (mk) keep.set($q.aJ, q.get($q.aJ)); if (q.get('limit')) keep.set('limit', String(limit));
const o = { api: $q.aK, licence: $t.k9,
sync: $s.k3,
since: cur ? null : since, count: page.length, total_after_filter: L.length, has_more: more, next_cursor: nextCur, next: nextCur ? ORIGIN + $q.aL + (keep.toString() ? keep.toString() + '&' : '') + $q.aM + nextCur : null,
last_change_at: C.last, resume: lastE ? ORIGIN + $q.aN + encodeURIComponent(lastE.at) : null, feed: ORIGIN + $q.aO, changes: page };
return out(req, JSON.stringify(o), { extra: rh, maxAge: 300, lastMod: C.last });
}
async function changesFeed(req, env, rh) {
const C = await allChanges(env), L = C.E.slice(-100).reverse();
const f = { version: $q.aP, title: $t.k10, home_page_url: ORIGIN + $q.aQ, feed_url: ORIGIN + $q.aO, description: $s.k4 + ORIGIN + $q.aR, language: 'en', authors: [{ name: $q.az, url: ORIGIN + '/' }],
items: L.map(e => ({ id: e.id, url: e.url, external_url: e.source || undefined, title: e.project.name + ': ' + e.title, content_text: e.text, date_published: e.at, tags: [e.project.market, e.kind].filter(Boolean) })) };
return out(req, JSON.stringify(f), { type: $q.aS, extra: rh, maxAge: 600, lastMod: C.last });
}
let DQ = null;
const median = a => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
async function quality(env) {
const n = await N(), ix = await n.data(env);
if (DQ && DQ.ix === ix) return DQ.v;
const nf2 = await rawFile(env, $q.B), now = Date.parse(today() + $q.aD);
const has = v => v != null && v !== '' && !(Array.isArray(v) && !v.length);
const FX = (x, k) => has((x.fx || {})[k]);
const FIELDS = {
dv: x => has(x.dv), ar: x => has(x.ar) && x.ar !== x.mk, url: x => n.okHttp(x.url) && !n.isListing(x.url), ho: x => !!n.handoverOf(ix, x) || FX(x, $q.aT), price: x => FX(x, 'price_min'), size: x => FX(x, 'size_min_m2'), types: x => FX(x, $q.aU),
pay: x => FX(x, $q.aV), pn: x => has(x.pn), auth: x => FX(x, $q.aW), cs: x => FX(x, $q.aX), pin: x => FX(x, 'lat') && FX(x, 'lng'), co: x => FX(x, 'developer_company'),
rw: x => !!(x.rw || (ix.caseBy.get(x.id) || {}).register), sha: x => has(x.sha) || !!((ix.caseBy.get(x.id) || {}).fp || {}).sha256, src2: x => srcN(x) >= 2 };
function srcN(x) { return new Set([x.url, x.du, ...(x.src || [])].filter(v => n.okHttp(v))).size; }
const P = ix.P, tot = P.length, cnt = {}, fr = { d7: 0, d30: 0, d90: 0, old: 0 }, ages = [], srcs = [], byMk = new Map();
for (const k of Object.keys(FIELDS)) cnt[k] = 0;
for (const x of P) {
const r = {}; for (const [k, f] of Object.entries(FIELDS)) { let v = false; try { v = !!f(x); } catch (e) {} r[k] = v; if (v) cnt[k]++; }
const lm = n.lastmod(ix, x), age = Math.max(0, Math.round((now - Date.parse(lm + $q.aD)) / 864e5)); ages.push(age); srcs.push(srcN(x));
fr[age <= 7 ? 'd7' : age <= 30 ? 'd30' : age <= 90 ? 'd90' : 'old']++;
const m = byMk.get(x.mk) || { market: x.mk, country: x.co, projects: 0, ho: 0, price: 0, pn: 0, pin: 0, url: 0, ages: [] };
m.projects++; for (const k of ['ho', 'price', 'pn', 'pin', 'url']) if (r[k]) m[k]++; m.ages.push(age); byMk.set(x.mk, m);
}
const pct = (a, b) => b ? Math.round(1000 * a / b) / 10 : 0;
const markets = [...byMk.values()].filter(m => m.projects >= 10).sort((a, b) => b.projects - a.projects).map(m => ({ market: m.market, country: m.country, projects: m.projects, handover_pct: pct(m.ho, m.projects), price_pct: pct(m.price, m.projects), permit_number_pct: pct(m.pn, m.projects), pin_pct: pct(m.pin, m.projects), official_page_pct: pct(m.url, m.projects), median_days_since_check: median(m.ages) }));
const v = { api: $q.aY, computed_at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'), data_updated: ix.updated, dataset: { file: $q.B, sha256: nf2.sha256, bytes: nf2.bytes }, build: (env && env.CF_PAGES_COMMIT_SHA) ? String(env.CF_PAGES_COMMIT_SHA).slice(0, 12) : null,
method: $s.k5,
projects: tot, fields: Object.fromEntries(Object.keys(FIELDS).map(k => [k, { projects: cnt[k], pct: pct(cnt[k], tot) }])), freshness: Object.fromEntries(Object.entries(fr).map(([k, c]) => [k, { projects: c, pct: pct(c, tot) }])),
median_days_since_check: median(ages), median_sources_per_project: median(srcs), markets };
try { Object.assign(v, dqJson(ix)); } catch (e) {}
DQ = { ix, v }; return v;
}
async function dqPage(req, u, env, ctx, shell, lang) {
const L = T[lang], P = pre(lang), q = await quality(env), path = P + $q.aZ, canonU = ORIGIN + path;
const bar = p => $q.ba + Math.min(100, p) + $q.bb;
const pc = p => ar(lang, nf(p, lang, 1) + '%');
const frows = Object.entries(q.fields).sort((a, b) => b[1].pct - a[1].pct).map(([k, f]) => $q.bc + esc(L.dq_fields[k] || k) + $q.bd + ar(lang, nf(f.projects, lang)) + $q.J + bar(f.pct) + ' ' + pc(f.pct) + $q.be).join('');
const fr = $q.bf + Object.entries(q.freshness).map(([k, f]) => $q.bg + pc(f.pct) + '</b> ' + esc(L.dq_fr[k]) + $q.Q + ar(lang, nf(f.projects, lang)) + $q.bh).join('') + '</ul>';
const mrows = q.markets.map(m => $q.bi + esc(m.market) + $q.bj + ar(lang, nf(m.projects, lang)) + $q.J + pc(m.handover_pct) + $q.J + pc(m.price_pct) + $q.J + pc(m.permit_number_pct) + $q.J + pc(m.pin_pct) + $q.J + pc(m.official_page_pct) + $q.J + ar(lang, nf(m.median_days_since_check, lang)) + $q.be).join('');
const body = $q.S + (lang === 'ar' ? $q.T : '') + $t.k11 + P + '/">' + esc(L.home) + $q.bk + esc(L.eng) + $q.V + esc(L.dq_h1) + $q.W + esc(L.dq_h1) + $q.X + esc(L.dq_lead) + $q.Y +
$q.bl + (lang === 'ar' ? $q.T : '') + '>' + $s.CSS +
$q.ag + fill(esc(L.dq_src), { f: $t.k12, s: $q.bm + short(q.dataset.sha256) + $q.bn, d: esc(fdt(q.data_updated, lang)), t: esc(fdt(q.computed_at, lang)) + (q.build ? $q.bo + esc(q.build) + $q.bp : '') }) + ' ' + esc(fill(L.dq_med_src, { n: nf(q.median_sources_per_project, lang, 1) })) + $q.bq + esc(L.dq_api) + $q.ap +
'<h2>' + esc(L.dq_f_h) + $q.Q + ar(lang, nf(q.projects, lang)) + $t.k13 + L.dq_th_f.map(x => $q.ad + esc(x) + '</th>').join('') + $q.ae + frows + $q.af +
'<h2>' + esc(L.dq_fr_h) + '</h2>' + fr +
'<h2>' + esc(L.dq_m_h) + $t.k14 + L.dq_th_m.map(x => $q.ad + esc(x) + '</th>').join('') + $q.ae + mrows + $q.af +
(await (async () => { try { await n31cT(env); return dqExtra(await (await N()).data(env), lang); } catch (e) { return ''; } })()) +
$q.br + esc(q.method) + $q.bs + P + $q.bt + esc(L.sn_h1) + $q.bu + P + $t.k15 + esc(L.eng) + $q.bv;
const ld = { '@context': $q.at, '@graph': [{ '@type': $q.bw, url: canonU, name: L.dq_h1, description: L.dq_lead, inLanguage: lang, dateModified: q.data_updated, isPartOf: { '@type': $q.bx, name: $q.az, url: ORIGIN + '/' } },
{ '@type': $q.ax, itemListElement: [{ '@type': $q.ay, position: 1, name: $q.az, item: ORIGIN + P + '/' }, { '@type': $q.ay, position: 2, name: L.eng, item: ORIGIN + $q.by }, { '@type': $q.ay, position: 3, name: L.dq_h1, item: canonU }] }] };
return assemble({ title: L.dq_title + $q.aB, desc: L.dq_lead.slice(0, 155), canon: canonU, body, ld, lastmod: q.data_updated, alt: l => ORIGIN + pre(l) + $q.aZ }, lang, shell, $q.by);
}
async function certificate(env, slug) {
const n = await N(), ix = await n.data(env), x = ix.bySlug.get(slug); if (!x) return null;
const c = ix.caseBy.get(x.id) || {}, rvd = n.reviewed(c), ho = n.handoverOf(ix, x), page = n.okHttp(x.url) ? n.fixU(x.url) : null, rw = x.rw || c.register || null;
const [named, cases] = await Promise.all([rawFile(env, $q.B), rawFile(env, $q.bz)]);
let snap = null; try { snap = await chain(env); } catch (e) {}
const facts = { id: x.id, slug: x.s, name: x.n, developer: x.dv || null, area: x.ar && x.ar !== x.mk ? x.ar : null, market: x.mk, country: x.co, stage: c.stage || x.st || null,
handover_on_record: ho ? ho.d : ((x.fx || {}).handover_promised || null), permit_number: x.pn || null, permit_source: x.pn ? ((n.okHttp(x.du) ? n.fixU(x.du) : null) || page) : null,
register: rw ? { register: rw.register || null, item: rw.item || null, status: rw.status || null, checked: rw.checked || null } : null,
reviewed: !!rvd, buyer_checks_public: rvd && c.score != null ? c.score : null, buyer_checks_of: rvd && c.max ? c.max : null, last_checked: n.lastmod(ix, x),
developer_page: page, sources: [...new Set([page, n.okHttp(x.du) ? n.fixU(x.du) : null, ...(x.src || []).filter(n.okHttp).map(n.fixU)].filter(Boolean))].slice(0, 8) };
const factsSha = await sha(canon(facts));
const cert = { type: $q.bA, issued: today(), issuer: { name: $q.az, url: ORIGIN + '/', public_keys: ORIGIN + $q.H },
subject: { id: x.id, slug: x.s, name: x.n, page: ORIGIN + $q.bB + x.s + '/' }, facts, facts_sha256: factsSha,
dataset: { named_json_sha256: named.sha256, bali_cases_json_sha256: cases.sha256, snapshot_chain_tip: snap ? snap.chain_tip : null, snapshots: ORIGIN + $q.G },
live_check: ORIGIN + $q.bB + x.s + $q.bC + factsSha.slice(0, 16),
meaning: $s.k6 };
const body = canon(cert), digest = await sha(body);
let signature = { alg: 'none', note: $t.k16, certificate_sha256: digest };
try { const K = await import('./kolaboro.js'); const s = await K.signBody(env, body); if (s) signature = { alg: $q.bD, kid: (env && env.KB_SIGN_KID) || 'kb', value: s, message: $s.k7, certificate_sha256: digest }; } catch (e) {}
return { x, cert, signature };
}
async function certPage(req, u, env, ctx, shell, lang, slug) {
const L = T[lang], P = pre(lang), r = await certificate(env, slug); if (!r) return null;
const { x, cert, signature } = r, F = cert.facts, K = L.ce_k, h = (u.searchParams.get('h') || '').toLowerCase().replace(/[^0-9a-f]/g, '').slice(0, 64);
const yn = v => v ? L.ce_yes : L.ce_no, stage = F.stage ? (lang === 'en' ? F.stage : (($t.o_STAGE[F.stage] || {})[lang] || F.stage)) : '';
const row = (k, v) => v ? $q.bc + esc(K[k]) + $q.bd + v + $q.be : '';
const a = (href, t) => $q.bE + esc(href) + $q.bF + esc(t) + $q.bG;
const host = s => { try { return new URL(s).hostname.replace(/^www\./, ''); } catch (e) { return s; } };
const facts = row($q.bH, F.developer ? '<bdi>' + esc(F.developer) + $q.g : '') + row('place', '<bdi>' + esc([F.area, F.market, F.country].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', ')) + $q.g) + row('stage', esc(stage)) +
row($q.bI, esc(F.handover_on_record || L.ce_none)) + row($q.bJ, F.permit_number ? '<bdi>' + esc(F.permit_number) + $q.g + (F.permit_source ? ' ' + a(F.permit_source, host(F.permit_source)) : '') : esc(L.ce_none)) +
row($q.bK, F.register ? '<bdi>' + esc([F.register.register, F.register.status, F.register.checked ? fdt(F.register.checked, lang) : ''].filter(Boolean).join(' · ')) + $q.g : '') +
row($q.bL, esc(yn(F.reviewed))) + row($q.bM, F.buyer_checks_public != null ? ar(lang, nf(F.buyer_checks_public, lang) + ' / ' + nf(F.buyer_checks_of || 6, lang)) : '') + row($q.bN, esc(fdt(F.last_checked, lang))) +
row($q.bO, F.sources.map(s => a(s, host(s))).join(', '));
const hrow = (k, v) => $q.bc + esc(k) + $q.bP + esc(v || '') + $q.bQ;
const scan = h.length >= 8 ? $q.bR + (cert.facts_sha256.startsWith(h) ? 'ok' : 'chg') + $q.bS + esc(fill(cert.facts_sha256.startsWith(h) ? L.ce_same : L.ce_diff, { h: h.slice(0, 16) })) + '</p>' : '';
const msg = { wait: L.ce_chk_wait, ok: L.ce_chk_ok, hash: L.ce_chk_hash, bad: L.ce_chk_bad, nosig: L.ce_chk_nosig, qr: L.ce_qr };
const self = ORIGIN + P + $q.bB + x.s + $q.bC + cert.facts_sha256.slice(0, 16);
const body = $q.S + (lang === 'ar' ? $q.T : '') + $t.k17 + P + '/">' + esc(L.home) + $q.bT + P + $q.bB + x.s + $q.bU + esc(x.n) + $q.bV + esc(L.ce_h1) + $q.W + esc(L.ce_h1) + $q.bW + esc(x.n) + $q.bX + esc(fill(L.ce_lead, { n: x.n, d: fdt(cert.issued, lang) })) + $q.Y +
$q.bY + (lang === 'ar' ? $q.T : '') + $q.bZ + esc(x.s) + $q.ca + esc(self) + $q.cb + esc(JSON.stringify(msg)) + '">' + $s.CSS + scan +
$q.cc + esc(L.ce_facts) + $t.k18 + facts + $t.k19 + esc(L.ce_qr) + $t.k20 + esc(x.id) + $q.cd + esc(fdt(cert.issued, lang)) + $q.ce +
'<h2>' + esc(L.ce_hash) + $t.k21 + hrow(L.ce_issued, cert.issued) + hrow(L.ce_facts_sha, cert.facts_sha256) + hrow(L.ce_named_sha, cert.dataset.named_json_sha256) + hrow(L.ce_cases_sha, cert.dataset.bali_cases_json_sha256) + hrow(L.ce_chain, cert.dataset.snapshot_chain_tip) + $q.af +
'<h2>' + esc(L.ce_sig) + $q.ah + esc(signature.alg === $q.bD ? fill(L.ce_signed, { k: signature.kid }) : L.ce_hashonly) + '</p>' + (signature.value ? $q.cf + esc(signature.value) + $q.cg : '') +
$t.k22 + esc(L.ce_chk) + $t.k23 + x.s + $q.ch + esc(L.ce_json) + $q.ci + P + $q.bB + x.s + '/">' + esc(L.ce_live) + $t.k24 + esc(L.ce_print) + $t.k25 +
$q.ag + esc(L.ce_note) + $q.am + P + $q.bt + esc(L.sn_h1) + $t.k26 + $s.CERT_JS + $q.as;
const canonU = ORIGIN + P + $q.bB + x.s + $q.cj;
const ld = { '@context': $q.at, '@graph': [{ '@type': $q.bw, url: canonU, name: fill(L.ce_title, { n: x.n }), inLanguage: lang, dateModified: cert.issued, about: { '@type': 'Place', name: x.n, url: ORIGIN + P + $q.bB + x.s + '/' } }] };
const html = await assemble({ title: fill(L.ce_title, { n: x.n }) + $q.aB, desc: fill(L.ce_lead, { n: x.n, d: fdt(cert.issued, lang) }).slice(0, 155), canon: canonU, body, ld, lastmod: cert.issued, alt: l => ORIGIN + pre(l) + $q.bB + x.s + $q.cj }, lang, shell, $q.ck);
return page(html, lang, { 'x-robots-tag': $q.cl });
}
async function devWebsite(req, env, slug, rh) {
const n = await N(), ix = await n.data(env), dv = ix.devs.get(slug); if (!dv) return jerr({ error: $q.cm }, 404, rh);
const W = await import('./kbx_web.js'), wd = await W.webData(env), H = (wd && wd.health && wd.health.d) || {}, FZ = (wd && wd.forensics && wd.forensics.d) || {};
const doms = ((wd && wd.devDoms && wd.devDoms.get(slug)) || []).slice().sort();
const o = { api: $q.cn, developer: { slug, name: dv.n, page: ORIGIN + $q.co + slug + '/' }, updated: wd && wd.health ? wd.health.updated : null,
legend: { health: (wd && wd.health && wd.health.legend) || null, registered: $t.k27, tls_issuer: $t.k28 },
domains: doms.map(d => ({ domain: d, health: H[d] || null, forensics: FZ[d] || null, rdap: $t.k29 + encodeURIComponent(d), ct: $q.cp + encodeURIComponent(d) })) };
return out(req, JSON.stringify(o), { extra: rh, maxAge: 900 });
}
let OA = null;
async function openapiV1(env) {
if (OA && Date.now() - OA.t < 600000) return OA.v;
const full = await jsonFile(env, $q.cq);
const paths = Object.fromEntries(Object.entries(full.paths || {}).filter(([p]) => p.startsWith($q.cr) && !/xray|watch/.test(p)));
let v1x = null; try { v1x = await jsonFile(env, $q.cs); } catch (e) {}
if (v1x && v1x.paths) Object.assign(paths, v1x.paths);
const v = { openapi: '3.1.0', info: { title: $q.ct, version: $q.cu, summary: $t.k30, description: $s.k8, license: full.info && full.info.license, contact: full.info && full.info.contact },
servers: [{ url: ORIGIN }], paths, components: Object.assign({}, full.components || {}, { schemas: Object.assign({}, (full.components || {}).schemas || {}, (v1x && v1x.schemas) || {}) }) };
OA = { t: Date.now(), v }; return v;
}
async function docsPage(req, u, env, ctx, shell, lang) {
let X34 = ''; try { const m = await import('./kbx_n34c.js'); if (await m.ready(env)) X34 = m.relLinks(lang); } catch (e) {}
const L = T[lang], P = pre(lang), canonU = ORIGIN + P + $q.cv;
const rows = $t.o_EPS.map(([k, p, ex]) => { const v = ex ? p.replace(/\{[a-z]+\}/, ex) : p; return $t.k31 + esc(p) + $q.cw + esc(L.ad_d[k]) + $t.k32 + esc(v) + '">' + esc(L.ad_try) + $q.cx; }).join('');
const msg = { st: L.ad_status, tm: L.ad_time, hd: L.ad_hdr, bd: L.ad_body, again: L.ad_again };
const body = $q.S + (lang === 'ar' ? $q.T : '') + $t.k33 + P + '/">' + esc(L.home) + $t.k34 + esc(L.ad_h1) + $q.X + esc(L.ad_lead) + $q.Y +
$q.cy + (lang === 'ar' ? $q.T : '') + $q.cz + esc(JSON.stringify(msg)) + '">' + $s.CSS +
'<h2>' + esc(L.ad_ep) + $q.cA + rows + '</ul>' +
$s.k9 + esc(L.ad_try) + $t.k35 + esc(L.ad_again) + $q.cB +
$t.k36 + esc(L.ad_hdr) + $t.k37 + esc(L.ad_body) + $s.k10 +
'<h2>' + esc(L.ad_lim_h) + $q.ah + esc(L.ad_lim) + $t.k38 + esc(L.ad_spec) + $t.k39 + esc(L.ad_full) + $q.cC + P + $q.bt + esc(L.sn_h1) + $q.cC + P + $q.ao + esc(L.dq_h1) + $q.cD + X34 + $q.cE + $s.DOCS_JS + $q.as;
const ld = { '@context': $q.at, '@graph': [{ '@type': $q.cF, name: $q.ct, url: canonU, documentation: ORIGIN + $q.cG, provider: { '@id': ORIGIN + '/#org' }, termsOfService: ORIGIN + $q.cH }] };
return assemble({ title: L.ad_title + $q.aB, desc: L.ad_lead.slice(0, 155), canon: canonU, body, ld, lastmod: $q.cu, alt: l => ORIGIN + pre(l) + $q.cv }, lang, shell, $q.cI);
}
async function offPage(req, u, env, ctx, shell, lang) {
const L = T[lang], P = pre(lang), canonU = ORIGIN + P + $q.cJ;
const body = $q.S + (lang === 'ar' ? $q.T : '') + $q.cK + esc(L.of_h1) + $q.X + esc(L.of_lead) + $t.k40 + esc(L.of_retry) + $q.cL +
$q.cM + (lang === 'ar' ? $q.T : '') + $q.cN + esc(L.of_none) + '">' + $s.CSS + '<h2>' + esc(L.of_list) + $t.k41 +
$s.k11 +
$s.k12;
const html = await assemble({ title: L.of_title + $q.aB, desc: L.of_lead, canon: canonU, body, ld: { '@context': $q.at, '@type': $q.bw, name: L.of_title, url: canonU }, lastmod: $q.cu, alt: l => ORIGIN + pre(l) + $q.cJ }, lang, shell, $q.cO);
return page(html, lang, { 'x-robots-tag': $q.cl });
}
async function assemble(pg, lang, shell, shellPath) {
const n = await N();
let sr = await shell(pre(lang) + shellPath);
if (lang !== 'en' && (!sr || sr.status !== 200)) sr = await shell(pre(lang) + $q.cP);
return n.assemble(pg, lang, sr);
}
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname;
if (!PATHS.test(p)) return null;
if (req.method === $q.cQ) return new Response(null, { status: 204, headers: CORS });
if (req.method !== 'GET' && req.method !== 'HEAD') return null;
if (p === $q.cR) return new Response(JSON.stringify($t.o_MANIFEST), { headers: { 'content-type': $t.k42, 'cache-control': $q.cS, 'access-control-allow-origin': '*' } });
if (p.startsWith($q.cr)) {
const rl = await rate(req, ctx, 'n30', LIMIT), rh = rlHeaders(rl);
if (!rl.ok) return jerr({ error: $q.cT, limit_per_minute: LIMIT, retry_after_s: rl.reset }, 429, Object.assign(rh, { 'retry-after': String(rl.reset) }));
try {
if (p === $q.cU) { const body = JSON.stringify(await chain(env), null, 1); return out(req, body, { extra: Object.assign({}, rh, (await signed(env, body)) || {}), maxAge: 120 }); }
if (p === $q.cG) return out(req, JSON.stringify(await openapiV1(env), null, 1), { extra: rh, maxAge: 3600 });
if (p === $q.cV) return out(req, JSON.stringify(await quality(env), null, 1), { extra: rh, maxAge: 900 });
if (p === $q.aR) return changes(req, u, env, rh);
if (p === $q.aO) return changesFeed(req, env, rh);
let m = /^\/api\/v1\/projects\/([a-z0-9-]{1,90})\/certificate$/.exec(p);
if (m) { const r = await certificate(env, m[1]); if (!r) return jerr({ error: $q.cm, note: $q.cW + ORIGIN + $q.cX }, 404, rh); return out(req, JSON.stringify({ certificate: r.cert, signature: r.signature }, null, 1), { extra: rh, maxAge: 600 }); }
m = /^\/api\/v1\/developers\/([a-z0-9-]{1,90})\/website$/.exec(p);
if (m) return devWebsite(req, env, m[1], rh);
} catch (e) { return jerr({ error: $q.cY, detail: String(e && e.message || e).slice(0, 120) }, 503, rh); }
return null;
}
let m;
if (!p.endsWith('/')) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } });
if ((m = RX.snap.exec(p))) return page(await snapPage(req, u, env, ctx, shell, m[1] || 'en'), m[1] || 'en');
if ((m = RX.docs.exec(p))) return page(await docsPage(req, u, env, ctx, shell, m[1] || 'en'), m[1] || 'en');
if ((m = RX.dq.exec(p))) return page(await dqPage(req, u, env, ctx, shell, m[1] || 'en'), m[1] || 'en');
if ((m = RX.off.exec(p))) return offPage(req, u, env, ctx, shell, m[1] || 'en');
if ((m = RX.certP.exec(p))) return certPage(req, u, env, ctx, shell, m[1] || 'en', m[2]);
return null;
}
export { canon, chain, quality, allChanges, certificate };
