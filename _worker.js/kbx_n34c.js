// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_n34c__q, $s = TB.kbx_n34c__s, $t = TB.kbx_n34c__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { signBody } from './kolaboro.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const V = 'c1';
let T = null;
async function loadT(env) {
if (T) return T;
try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.b)); if (r.ok) T = await r.json(); } catch (e) {}
return T;
}
const MEMO = {};
function file(e, p, t) { return FQ[p] || (FQ[p] = file0(e, p, t).finally(() => { delete FQ[p]; })); }   // n40 k21: one shared read per file
const FQ = {};
async function file0(env, p, ttl) {
const m = MEMO[p]; if (m && Date.now() - m.t < (ttl || 600000)) return m.v;
let v = null;
try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.c + p)); if (r.ok) v = await r.json(); } catch (e) { v = null; }
MEMO[p] = { t: Date.now(), v }; return v;
}
async function rawFile(env, p) { try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.c + p)); return r.ok ? new Uint8Array(await r.arrayBuffer()) : null; } catch (e) { return null; } }
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.d, "'": '&#39;' }[c]));
const t = (l, k) => { const a = T && T[l] && T[l][k]; return a != null ? a : T && T.en[k] != null ? T.en[k] : ''; };
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
const nf = (n, l, d) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { maximumFractionDigits: d == null ? 0 : d, numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
const fd = (d, l) => { if (!d) return ''; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: $q.e, month: 'short', year: $q.e, timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(String(d).slice(0, 10) + $q.f)); } catch (e) { return String(d).slice(0, 10); } };
const ft = (d, l) => { if (!d) return ''; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: $q.e, month: 'short', hour: $q.g, minute: $q.g, timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(d)) + ' UTC'; } catch (e) { return String(d); } };
const bdi = (l, h) => l === 'ar' ? '<bdi>' + h + $q.h : h;
const kb = (n, l) => bdi(l, nf(n / 1024, l, n < 10240 ? 1 : 0) + ' KB');
const te = new TextEncoder();
const hexOf = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const sha = async s => hexOf(await crypto.subtle.digest($q.i, typeof s === $q.j ? te.encode(s) : s));
const canon = v => v === null || typeof v !== $q.k ? JSON.stringify(v === undefined ? null : v) : Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
const today = () => new Date().toISOString().slice(0, 10);
const LP = '(?:(es|de|fr|nl|ru|zh|ar)\\/)?';
const F = { us: 'engineering\\/usage', sd: 'engineering\\/sdk', dl: 'data\\/delta', pf: 'engineering\\/performance', mo: 'engineering\\/monitoring', se: 'engineering\\/security', tl: 'verify\\/transparency-log', mc: 'engineering\\/mcp', ec: 'embed\\/charts', sq: 'engineering\\/search-quality' };
const R = {}; for (const k in F) R[k] = new RegExp('^\\/' + LP + F[k] + '\\/?$');
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:engineering\/(?:usage|sdk|performance|monitoring|security|mcp|search-quality)|data\/delta|verify\/transparency-log|embed\/charts)\/?$|^\/embed\/chart\/[a-z0-9-]{2,60}\/?$|^\/api\/v1\/(?:delta(?:\/\d{4}-\d{2}-\d{2}(?:\.sig)?)?|tlog(?:\/proof|\/consistency)?|charts\/[a-z0-9-]{2,60}|monitoring)$/;
export const ALL = [['us', '/engineering/usage/'], ['sd', '/engineering/sdk/'], ['dl', '/data/delta/'], ['pf', '/engineering/performance/'], ['mo', '/engineering/monitoring/'], ['se', '/engineering/security/'], ['tl', '/verify/transparency-log/'], ['mc', '/engineering/mcp/'], ['ec', '/embed/charts/'], ['sq', '/engineering/search-quality/']];
const table = (th, rows, cap) => $q.l + (cap ? $q.m + esc(cap) + $q.n : '') + $q.o + th.map(x => $q.p + esc(x) + '</th>').join('') + $q.q + rows.join('') + $q.r;
const N = () => import('./kbx_named.js');
const rel = (l, skip) => '<h2>' + esc(t(l, 'more')) + $q.s + ALL.filter(x => x[0] !== skip).map(x => $q.t + pre(l) + x[1] + '">' + esc(t(l, x[0] + '_t')) + $q.u).join('') + $q.v + esc(t(l, 'eng')) + $q.w + pre(l) + $q.x + esc(t(l, $q.y)) + $q.z;
const paras = (l, k) => (t(l, k) || []).map(p => '<p>' + esc(p) + '</p>').join('');
const sec = (h, b, id) => '<h2' + (id ? ' id="' + id + '"' : '') + '>' + esc(h) + '</h2>' + b;
const code = (l, s) => $q.A + esc(s) + $q.B;
const lk = (l, href, txt) => $q.C + esc(href) + '"' + (l === 'ar' && /^\/(api|data|open|sdk|k)\//.test(href) ? $q.D : '') + '>' + esc(txt || href) + '</a>';
const files = (l, fs) => '<ul>' + fs.map(f => '<li>' + lk(l, f[0]) + (f[1] ? $q.E + esc(f[1]) + $q.F : '') + '</li>').join('') + '</ul>';
const kpis = (l, A) => $q.G + A.map(x => $q.H + bdi(l, x[0]) + '</b>' + esc(x[1]) + $q.I).join('') + $q.I;
const okc = (l, ok, txt) => $q.J + (ok ? 'ok' : 'bad') + '">' + esc(txt || t(l, ok ? 'yes' : 'no')) + $q.F;
async function page(shell, l, o) {
  const n = await N(), canon0 = ORIGIN + pre(l) + o.path;
  const crumbs = [[t(l, 'home'), pre(l) + '/']].concat(o.crumb || [[t(l, 'eng'), $q.K]]).concat([[o.h1, null]]);
  const body = $q.L + (l === 'ar' ? $q.M : '') + $q.N + crumbs.map(c => c[1] ? $q.C + esc(c[1]) + '">' + esc(c[0]) + '</a>' : esc(c[0])).join(' / ') + $q.O + esc(o.h1) + $q.P + esc(o.lead) + '</p>' +
    (o.updated ? $q.Q + esc(fill(t(l, 'upd'), { d: fd(o.updated, l) })) + '</p>' : '') + $q.R + (l === 'ar' ? $q.M : '') + '>' + $q.a + o.body + rel(l, o.k) + $q.I;
  const ld = { '@context': $q.S, '@graph': [{ '@type': o.type || $q.T, url: canon0, name: o.h1, description: o.lead, inLanguage: l, dateModified: o.updated || $q.U, isPartOf: { '@type': $q.V, name: $q.W, url: ORIGIN + '/' } },
    { '@type': $q.X, itemListElement: crumbs.map((c, i) => ({ '@type': $q.Y, position: i + 1, name: c[0], item: c[1] ? ORIGIN + c[1] : canon0 })) }].concat(o.ld || []) };
  const desc = o.lead.length > 155 ? o.lead.slice(0, 152).replace(/\s+\S*$/, '') + '…' : o.lead;
  const html = await n.assemble({ title: (o.h1.length > 46 ? o.h1.slice(0, 46).replace(/\s+\S*$/, '') : o.h1) + $q.Z, desc, canon: canon0, body, ld, alt: x => ORIGIN + pre(x) + o.path, noindex: !!o.noindex }, l, await shell(pre(l) + $q.aa));
  return new Response(html, { status: 200, headers: Object.assign({ 'content-type': $q.ab, 'cache-control': $q.ac + (o.maxAge || 600), 'content-language': l }, o.noindex ? { 'x-robots-tag': $q.ad } : {}) });
}
const H = (l, k) => ({ h1: t(l, k + '_t'), lead: t(l, k + '_l'), k });
const CORS = { 'access-control-allow-origin': '*', 'access-control-expose-headers': 'x-kolaboro-signature, x-kolaboro-key-id, etag' };
async function out(req, env, body, o) {
  o = o || {};
  const etag = '"' + (await sha(body)).slice(0, 32) + '"';
  const h = Object.assign({ 'content-type': o.type || $q.ae, etag, 'cache-control': $q.ac + (o.maxAge || 300) + $q.af, 'x-content-type-options': $q.ag }, CORS, o.extra || {});
  if (o.sign !== false) { try { const s = await signBody(env, typeof body === $q.j ? body : new TextDecoder().decode(body)); if (s) { h[$q.ah] = s; h[$q.ai] = (env && env.KB_SIGN_KID) || 'kb'; } } catch (e) {} }
  const inm = req.headers.get($q.aj) || '';
  if (inm && inm.split(',').map(s => s.trim().replace(/^W\//, '')).includes(etag)) return new Response(null, { status: 304, headers: h });
  return new Response(req.method === 'HEAD' ? null : body, { status: o.status || 200, headers: h });
}
const jerr = (o, s) => new Response(JSON.stringify(o), { status: s, headers: Object.assign({ 'content-type': $q.ae, 'cache-control': $q.ak }, CORS) });
const json = o => JSON.stringify(o, null, 1);
const BR_ON = false;
let BRM = null; const BROK = {};
async function brManifest(env) { if (BRM && Date.now() - BRM.t < 600000) return BRM.v; const v = await file(env, $q.al, 600000); BRM = { t: Date.now(), v }; return v; }
export async function brServe(req, u, env) {
if (!BR_ON && req.headers.get($q.am) !== '1') return null;
if (req.method !== 'GET' || req.headers.get('range') || u.search) return null;
if (!/\bbr\b/.test(req.headers.get($q.an) || '')) return null;
if (req.headers.get($q.ao) || /kolaboro-/i.test(req.headers.get($q.ap) || '')) return null;
const f = u.pathname.slice(6), m = await brManifest(env), e = m && m.files && m.files[f];
if (!e) return null;
const src = await env.ASSETS.fetch(new Request(ORIGIN + $q.aq + f));
if (!src.ok) return null;
const tag = (src.headers.get('etag') || '') + '|' + e.source_sha256;
let ok = BROK[f] && BROK[f].tag === tag ? BROK[f].ok : null;
if (ok == null) { ok = (await sha(await src.arrayBuffer())) === e.source_sha256; BROK[f] = { tag, ok }; } else { try { await src.body.cancel(); } catch (x) {} }
if (!ok) return null;
const b = await env.ASSETS.fetch(new Request(ORIGIN + $q.c + e.br));
if (!b.ok) return null;
return new Response(b.body, { status: 200, encodeBody: $q.ar, headers: { 'content-type': $q.ae, 'content-encoding': 'br', vary: $q.an, etag: $q.as + e.source_sha256.slice(0, 24) + '"', 'cache-control': $t.k0, 'x-content-type-options': $q.ag, 'content-security-policy': $t.k1, 'referrer-policy': $q.at, 'access-control-allow-origin': '*', link: $t.k2, 'x-kolaboro-precompressed': $q.au + e.source_sha256 } });
}
export function brStatus() { return BROK; }
async function deltaApi(req, u, env) {
const p = u.pathname;
if (p === $q.av) { const d = await file(env, $q.aw); if (!d) return jerr({ error: $q.ax }, 503); return out(req, env, json(Object.assign({ api: $q.ay, page: ORIGIN + $q.az }, d))); }
const m = /^\/api\/v1\/delta\/(\d{4}-\d{2}-\d{2})(\.sig)?$/.exec(p); if (!m) return null;
const raw = await rawFile(env, $q.az + m[1] + '.json'); if (!raw) return jerr({ error: $q.aA, index: ORIGIN + $q.av }, 404);
if (!m[2]) return out(req, env, raw, { maxAge: 86400 });
const h = await sha(raw); let s = null; try { s = await signBody(env, new TextDecoder().decode(raw)); } catch (e) {}
return out(req, env, json({ type: $q.aB, day: m[1], file: ORIGIN + $q.az + m[1] + '.json', bytes: raw.length, sha256: h, alg: s ? $q.aC : null, kid: (env && env.KB_SIGN_KID) || 'kb', signature: s, message: $q.aD, public_keys: ORIGIN + $q.aE }), { maxAge: 3600 });
}
async function dlPage(env, shell, l, u) {
const d = await file(env, $q.aw); if (!d) return null;
const E = d.entries.slice().reverse(), last = E[0];
const rows = E.map(x => $q.aF + esc(fd(x.from, l)) + ' → ' + esc(fd(x.to, l)) + $q.aG + bdi(l, nf(x.counts.added, l)) + $q.aG + bdi(l, nf(x.counts.changed, l)) + $q.aG + bdi(l, nf(x.counts.removed, l)) + $q.aG + kb(x.bytes, l) + $q.aH + lk(l, x.file, 'JSON') + ' · ' + lk(l, x.api + '.sig', t(l, $q.aI)) + $q.aJ + esc(x.sha256.slice(0, 12)) + $q.aK);
const slug = (u.searchParams.get($q.aL) || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90);
let look = '';
if (slug) { const bp = await file(env, $q.aM, 3600000), hs = bp && bp.projects[slug];
look = hs ? table(t(l, $q.aN), hs.slice().reverse().map(h => $q.aF + esc(fd(h[0], l)) + $q.aH + (typeof h[1] === $q.j ? esc(t(l, 'dl_' + h[1])) : h[1].map(f => $q.aO + esc(f) + $q.aP).join(' ')) + $q.aH + lk(l, $q.az + h[0] + '.json', 'JSON') + $q.aQ)) + $q.aR + pre(l) + $q.aS + esc(slug) + '/">' + esc(t(l, $q.aT)) + $q.aU : $q.aV + esc(t(l, $q.aW)) + '</p>'; }
const b = kpis(l, [[nf(d.entries.length, l), t(l, $q.aX)], [fd(last.to, l), t(l, $q.aY)], [nf(last.counts.projects_after, l), t(l, $q.aZ)]]) +
sec(t(l, $q.ba), table(t(l, 'dl_th'), rows)) +
sec(t(l, $q.bb), $q.bc + pre(l) + $q.bd + esc(t(l, 'slug')) + $t.k3 + esc(slug) + $t.k4 + esc(t(l, 'show')) + $q.be + look) +
sec(t(l, $q.bf), paras(l, 'dl_p') + code(l, $t.k5 + last.to + ' -o ' + last.to + $t.k6 + last.to + $q.bg + last.to + $t.k7 + last.from + $t.k8 + last.to + $q.bh + last.to + $q.bi)) +
files(l, [[$q.aw, 'JSON'], [$q.av, t(l, $q.bj)], [$q.aM, 'JSON'], [$q.bk, $q.bl], [$q.bm, $q.bl], [$q.bn, 'Node']]) + $q.aR + pre(l) + $q.bo + esc(t(l, $q.bp)) + $q.bq + pre(l) + $q.br + esc(t(l, $q.bs)) + $q.aU;
return page(shell, l, Object.assign(H(l, 'dl'), { path: $q.az, body: b, updated: last.to, crumb: [[t(l, 'data'), $q.bt]], noindex: !!slug }));
}
const B16 = h => { const a = new Uint8Array(h.length / 2); for (let i = 0; i < a.length; i++) a[i] = parseInt(h.substr(i * 2, 2), 16); return a; };
const cat = (...a) => { const n = a.reduce((s, x) => s + x.length, 0), o = new Uint8Array(n); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; };
const H0 = async b => new Uint8Array(await crypto.subtle.digest($q.i, b));
const node2 = (a, b) => H0(cat(new Uint8Array([1]), a, b));
const leafOf = s => H0(cat(new Uint8Array([0]), te.encode(s)));
const k2 = n => { let k = 1; while (k * 2 < n) k *= 2; return k; };
async function mth(L) { if (L.length === 1) return L[0]; const k = k2(L.length); return node2(await mth(L.slice(0, k)), await mth(L.slice(k))); }
async function pathOf(m, L) { if (L.length <= 1) return []; const k = k2(L.length); return m < k ? (await pathOf(m, L.slice(0, k))).concat([await mth(L.slice(k))]) : (await pathOf(m - k, L.slice(k))).concat([await mth(L.slice(0, k))]); }
async function subproof(m, L, b) { const n = L.length; if (m === n) return b ? [] : [await mth(L)]; const k = k2(n); return m <= k ? (await subproof(m, L.slice(0, k), b)).concat([await mth(L.slice(k))]) : (await subproof(m - k, L.slice(k), false)).concat([await mth(L.slice(0, k))]); }
const hexA = a => [...a].map(x => x.toString(16).padStart(2, '0')).join('');
let LOGL = null;
async function logLeaves(tl) { if (LOGL && LOGL.root === tl.root) return LOGL.L; const L = []; for (const x of tl.entries) L.push(await leafOf($q.bu + x.day + '|' + x.root + '|' + x.n + '|' + x.snapshot_head)); LOGL = { root: tl.root, L }; return L; }
async function treeHead(env, size) {
const tl = await file(env, $q.bv); if (!tl) return null;
const n = size || tl.size, th = { type: $q.bw, log: ORIGIN + $q.bx, size: n, root: tl.roots_by_size[n - 1], latest_day: tl.entries[n - 1].day, signed_at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z') };
const h = await sha(canon(th)); let s = null; try { s = await signBody(env, canon(th)); } catch (e) {}
return { tl, th, sig: s ? { alg: $q.aC, kid: (env && env.KB_SIGN_KID) || 'kb', value: s, tree_head_sha256: h, message: $t.k9 } : null };
}
const DAYREC = {};
async function snapshotRecord(env, e, slug) {
let P = DAYREC[e.day];
if (!P) {
const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.by + e.day + $q.bz)); if (!r.ok) return null;
const txt = await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).text(), d = JSON.parse(txt);
P = new Map((d.projects || []).map(x => [x.s, x])); for (const k of Object.keys(DAYREC)) delete DAYREC[k]; DAYREC[e.day] = P;
}
return P.get(slug) || null;
}
export async function tlogProof(env, slug, day) {
const T0 = await treeHead(env); if (!T0) return { error: $q.ax };
const { tl, th, sig } = T0, E = tl.entries;
let i = day ? E.findIndex(x => x.day === day) : E.length - 1;
if (i < 0) return { error: $q.bA, days: E.map(x => x.day) };
const lv = await file(env, $q.bB + E[i].day + '.json', 3600000); if (!lv) return { error: $q.ax };
let j = lv.slugs.indexOf(slug);
if (j < 0 && !day) { for (i = E.length - 2; i >= 0; i--) { const l2 = await file(env, $q.bB + E[i].day + '.json', 3600000); if (l2 && (j = l2.slugs.indexOf(slug)) >= 0) { return tlogProof(env, slug, E[i].day); } } }
if (j < 0) return { error: $t.k10 + E[i].day, hint: $t.k11 };
const rec = await snapshotRecord(env, E[i], slug); if (!rec) return { error: $q.bC };
const L = []; for (let x = 0; x < lv.n; x++) L.push(B16(lv.leaves.substr(x * 64, 64)));
const leaf = await leafOf($q.bD + E[i].day + '|' + slug + '|' + canon(rec));
if (hexA(leaf) !== lv.leaves.substr(j * 64, 64)) return { error: $t.k12 };
const LL = await logLeaves(tl);
return { type: $q.bE, project: slug, day: E[i].day, record: rec, leaf: hexA(leaf), leaf_index: j, day_size: lv.n, day_root: lv.root, day_path: (await pathOf(j, L)).map(hexA),
snapshot: { sha256: E[i].snapshot_sha256, head: E[i].snapshot_head, copy: ORIGIN + $q.bF + E[i].day + $q.bz }, day_index: i, log_path: (await pathOf(i, LL)).map(hexA), tree_head: th, signature: sig,
verify: $s.k0 };
}
async function tlogApi(req, u, env) {
const p = u.pathname, q = u.searchParams;
if (p === $q.bG) { const T0 = await treeHead(env); if (!T0) return jerr({ error: $q.ax }, 503); return out(req, env, json({ tree_head: T0.th, signature: T0.sig, entries: T0.tl.entries, roots_by_size: T0.tl.roots_by_size, rules: { record_leaf: T0.tl.record_leaf, day_leaf: T0.tl.day_leaf, node: T0.tl.node, canonical_json: T0.tl.canonical_json } }), { maxAge: 300 }); }
if (p === $q.bH) {
const slug = (q.get($q.aL) || '').toLowerCase(), day = q.get('day') || '';
if (!/^[a-z0-9-]{1,90}$/.test(slug)) return jerr({ error: $t.k13 }, 400);
if (day && !/^\d{4}-\d{2}-\d{2}$/.test(day)) return jerr({ error: $q.bI }, 400);
const r = await tlogProof(env, slug, day); if (r.error) return jerr(r, 404);
return out(req, env, json(r), { maxAge: 300 });
}
if (p === $q.bJ) {
const tl = await file(env, $q.bv); if (!tl) return jerr({ error: $q.ax }, 503);
const a = parseInt(q.get('first') || '1', 10), b = parseInt(q.get($q.bK) || String(tl.size), 10);
if (!(a >= 1 && b >= a && b <= tl.size)) return jerr({ error: $q.bL + tl.size }, 400);
const LL = await logLeaves(tl), T0 = await treeHead(env, b);
return out(req, env, json({ type: $q.bM, first: a, second: b, first_root: tl.roots_by_size[a - 1], second_root: tl.roots_by_size[b - 1], path: (await subproof(a, LL.slice(0, b), true)).map(hexA), tree_head: T0.th, signature: T0.sig,
verify: $t.k14 }), { maxAge: 300 });
}
return null;
}
async function tlPage(env, shell, l, u) {
const T0 = await treeHead(env); if (!T0) return null;
const { tl, th, sig } = T0, E = tl.entries.slice().reverse();
const rows = E.map(x => $q.aF + esc(fd(x.day, l)) + $q.aG + bdi(l, nf(x.n, l)) + $q.aJ + esc(x.root.slice(0, 16)) + $q.bN + esc(x.snapshot_head.slice(0, 12)) + $q.bO + lk(l, x.file, 'JSON') + $q.aQ);
const slug = (u.searchParams.get($q.aL) || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90);
const b = kpis(l, [[nf(tl.size, l), t(l, $q.bP)], [nf(tl.entries[tl.size - 1].n, l), t(l, $q.bQ)], [$q.aO + esc(tl.root.slice(0, 12)) + $q.aP, t(l, $q.bR)], [sig ? okc(l, true, $q.aC) : okc(l, false), t(l, $q.bS)]]) +
sec(t(l, $q.bT), $q.bc + pre(l) + $t.k15 + esc(t(l, 'slug')) + $t.k16 + esc(slug || $q.bU) + $t.k17 + esc(t(l, $q.bV)) + $q.be +
$t.k18 + (slug ? $q.bW : '') + $q.bX + esc(t(l, $q.bY)) + $t.k19 + JSON.stringify(Object.assign({}, T.en.c_tl, (T[l] || {}).c_tl || {})).replace(/</g, $q.bZ) + $t.k20 + V + $q.ca +
$q.cb + lk(l, $q.cc + (slug || $q.bU), t(l, $q.cd)) + $q.ce) +
sec(t(l, $q.cf), code(l, JSON.stringify({ tree_head: th, signature: sig }, null, 1))) +
sec(t(l, $q.cg), table(t(l, 'tl_th'), rows)) +
sec(t(l, $q.ch), paras(l, 'tl_p') + code(l, tl.record_leaf + '\n' + tl.day_leaf + '\n' + tl.node)) +
sec(t(l, $q.ci), code(l, $s.k1 + tl.size + $t.k21)) +
files(l, [[$q.bG, t(l, $q.bj)], [$q.bv, 'JSON'], [$q.bk, $q.bl], [$q.bm, $q.bl], [$q.bn, 'Node']]) +
$q.aR + pre(l) + $q.bo + esc(t(l, $q.bp)) + $q.cj + esc(t(l, $q.ck)) + $t.k22 + esc(t(l, $q.cl)) + $q.aU;
return page(shell, l, Object.assign(H(l, 'tl'), { path: $q.bx, body: b, updated: tl.entries[tl.size - 1].day, crumb: [[t(l, $q.cm), $q.cn]], maxAge: 300, noindex: !!slug }));
}
async function usPage(env, shell, l) {
const K = await import('./kbx_n27a.js'), d = await K.apiUsage(28);
const G = Object.entries(d.by_endpoint).sort((a, b) => b[1] - a[1]), M = Object.entries(d.mcp_tools).sort((a, b) => b[1] - a[1]);
const b = $q.co + esc(t(l, 'us_nv')) + $q.cp + kpis(l, [[nf(d.total, l), t(l, $q.cq)], [nf(G.length, l), t(l, $q.cr)], [nf(d.mcp_total, l), t(l, $q.cs)], [fd(d.since, l), t(l, $q.ct)]]) +
sec(t(l, 'us_by'), G.length ? table(t(l, 'us_th'), G.map(([k, v]) => $q.cu + esc(k) + $q.cv + bdi(l, nf(v, l)) + $q.aQ)) : $q.aV + esc(t(l, $q.cw)) + '</p>') +
sec(t(l, $q.cx), M.length ? table(t(l, $q.cy), M.map(([k, v]) => $q.cu + esc(k) + $q.cv + bdi(l, nf(v, l)) + $q.aQ)) : $q.aV + esc(t(l, $q.cw)) + '</p>') +
sec(t(l, $q.cz), table(t(l, $q.cA), d.per_day.map(x => $q.aF + esc(fd(x.date, l)) + $q.aG + bdi(l, nf(x.calls, l)) + $q.aG + bdi(l, nf(x.mcp, l)) + $q.aQ))) +
sec(t(l, $q.ch), paras(l, 'us_p')) + files(l, [[$q.cB, 'JSON'], [$q.cC, t(l, $q.cD)]]);
return page(shell, l, Object.assign(H(l, 'us'), { path: $q.cE, body: b, updated: today(), maxAge: 300 }));
}
async function monData(env) {
const [m, live] = await Promise.all([file(env, $q.cF, 300000), (async () => { try { const r = await fetch(ORIGIN + $q.cG, { cf: { cacheTtl: 60 } }); return r.ok ? await r.json() : null; } catch (e) { return null; } })()]);
const S = (m && m.samples) || [], P = {};
for (const s of S) for (const x of s.pages) { const o = P[x[0]] = P[x[0]] || { n: 0, up: 0, ms: [], last: null }; o.n++; if (x[1] >= 200 && x[1] < 400) o.up++; if (x[2] != null) o.ms.push(x[2]); o.last = [s.at, x[1], x[2]]; }
const q = (a, p) => { if (!a.length) return null; const b = a.slice().sort((x, y) => x - y), i = (b.length - 1) * p, lo = Math.floor(i); return Math.round(b[lo] + (b[Math.min(lo + 1, b.length - 1)] - b[lo]) * (i - lo)); };
const days = {}; for (const s of S) { const d = s.at.slice(0, 10), o = days[d] = days[d] || { n: 0, up: 0, runs: 0 }; o.runs++; for (const x of s.pages) { o.n++; if (x[1] >= 200 && x[1] < 400) o.up++; } }
return { m, live, S, P: Object.entries(P).map(([p, o]) => ({ p, n: o.n, up: o.up, p50: q(o.ms, 0.5), p95: q(o.ms, 0.95), last: o.last })), days: Object.entries(days).sort().map(([d, o]) => Object.assign({ d }, o)) };
}
async function errSec(l) {
let e = null; try { e = await (await import('./kbx_n27a.js')).errUsage(14); } catch (x) { return ''; }
const S = t(l, $q.cH), g = (o, re) => Object.entries(o).reduce((a, [k, v]) => a + (re.test(k) ? v : 0), 0);
const rows = e.per_day.filter(x => Object.keys(x.counts).length).map(x => $q.aF + esc(fd(x.date, l)) + '</td>' + [/^404 page$/, /^404 (api|data)$/, /^404 asset$/, /^5xx /, /^404 \w+ bot$/].map(re => $q.cI + bdi(l, nf(g(x.counts, re), l)) + '</td>').join('') + '</tr>');
return sec(S[0], $q.Q + esc(S[1]) + '</p>' + (rows.length ? table(S[2], rows) : $q.aV + esc(S[5]) + '</p>') + (e.top_paths.length ? '<h3>' + esc(S[3]) + '</h3>' + table(S[4], e.top_paths.map(x => $q.cu + esc(x.path) + $q.cv + esc(x.status) + $q.aG + bdi(l, nf(x.n, l)) + $q.aQ)) : '') + $s.k2, $q.cJ);
}
function lkSec(l, m) {
const k = m && m.links; if (!k) return ''; const S = t(l, $q.cK);
return sec(S[0], '<p>' + esc(fill(S[1], { d: ft(k.at, l), c: nf(k.checked, l), n: nf(k.links, l), b: nf(k.broken.length, l) })) + '</p>' + (k.broken.length ? table(S[2], k.broken.map(x => $q.cL + esc(x[0]) + $q.cM + esc(x[0]) + $q.cN + esc(x[1]) + $q.cv + esc(String(x[2])) + $q.aQ)) : ''), 'links');
}
async function moPage(env, shell, l) {
const d = await monData(env); if (!d.m) return null;
const all = d.P.reduce((a, x) => [a[0] + x.up, a[1] + x.n], [0, 0]);
const bars = d.days.length ? $q.cO + (d.days.length * 22 + 10) + $q.cP + (d.days.length * 22 + 10) + $q.cQ + esc(t(l, $q.cR)) + '">' + d.days.map((x, i) => { const h = Math.round(x.up / x.n * 50); return $q.cS + (5 + i * 22) + '" y="' + (55 - h) + $q.cT + h + $q.cU + (x.up === x.n ? $q.cV : $q.cW) + $q.cX + esc(x.d + ': ' + x.up + '/' + x.n) + $q.cY; }).join('') + $q.cZ + (d.days.length * 22 + 10) + $t.k23 : '';
const b = kpis(l, [[nf(d.S.length, l), t(l, $q.da)], [all[1] ? nf(all[0] / all[1] * 100, l, 2) + ' %' : '-', t(l, 'mo_up')], [nf(d.days.length, l), t(l, $q.db)], [d.live ? nf(d.live.up, l) + '/' + nf(d.live.n, l) : '-', t(l, $q.dc)]]) +
sec(t(l, $q.dd), bars + table(t(l, $q.de), d.days.slice().reverse().map(x => $q.aF + esc(fd(x.d, l)) + $q.aG + bdi(l, nf(x.runs, l)) + $q.aG + bdi(l, nf(x.up, l) + '/' + nf(x.n, l)) + $q.aQ), t(l, $q.cR))) +
sec(t(l, $q.df), table(t(l, 'mo_th'), d.P.map(x => $q.cL + esc(x.p) + $q.cM + esc(x.p) + $q.dg + bdi(l, nf(x.up, l) + '/' + nf(x.n, l)) + $q.aG + (x.p50 == null ? '-' : bdi(l, nf(x.p50, l) + ' ms')) + $q.aG + (x.p95 == null ? '-' : bdi(l, nf(x.p95, l) + ' ms')) + $q.aG + (x.last ? esc(ft(x.last[0], l)) + ' · ' + x.last[1] : '') + $q.aQ))) +
await errSec(l) + lkSec(l, d.m) +
sec(t(l, $q.dh), table(t(l, $q.di), d.S.slice(-15).reverse().map(s => $q.aF + esc(ft(s.at, l)) + $q.aH + esc(s.vantage) + $q.aJ + esc(s.commit || '') + $q.cv + bdi(l, nf(s.pages.filter(x => x[1] >= 200 && x[1] < 400).length, l) + '/' + nf(s.pages.length, l)) + $q.aQ))) +
sec(t(l, $q.ch), paras(l, 'mo_p')) + files(l, [[$q.dj, 'JSON'], [$q.cF, 'JSON'], [$q.cG, t(l, $q.dc)], [$q.dk, $q.bl], [$q.dl, $q.bl]]);
return page(shell, l, Object.assign(H(l, 'mo'), { path: $q.dm, body: b, updated: d.S.length ? d.S[d.S.length - 1].at : null, maxAge: 300 }));
}
const CV_R = [['script-src nonce + strict-dynamic (enforced)', 'html', p => /script-src 'nonce-/.test(p.h[$q.dn] || '')], ['content-security-policy-report-only', 'html', p => !!p.h[$q.do]], ["default-src 'none' (data answers)", 'data', p => /default-src 'none'/.test(p.h[$q.dn] || '')], ['frame-ancestors', 'html', p => /frame-ancestors/.test(p.h[$q.dn] || '')], ['x-content-type-options: nosniff', 'all', p => /nosniff/i.test(p.h[$q.dp] || '')], ['referrer-policy', 'html', p => !!p.h[$q.dq]], ['permissions-policy', 'html', p => !!p.h[$q.dr]]];
const cvKind = p => /^\/embed\//.test(p.p) ? 'embed' : /^\/(api|mcp)|\.json/.test(p.p) ? 'data' : /\.(css|js)$/.test(p.p) ? 'asset' : 'html';
function sriOf(html) { const o = []; for (const m of html.matchAll(/<(script|link)\b[^>]*>/gi)) { const tg = m[0], src = (/\s(?:src|href)="(https?:\/\/[^"]+)"/i.exec(tg) || [])[1]; if (!src || /^https:\/\/(www\.)?kolaboro\.com\//.test(src)) continue; if (/^<link/i.test(tg) && !/rel="(stylesheet|modulepreload)"/i.test(tg)) continue; o.push([src.split('?')[0], /\sintegrity="sha(256|384|512)-/i.test(tg)]); } return o; }
async function sriJs(env) {
const M = new Map(), td = new TextDecoder();
const BF = await Promise.all($t.o_SRI_JS.map(f => rawFile(env, f)));   // n40 d15: read together, then scanned in list order, so the table order no longer depends on which read ends first
$t.o_SRI_JS.forEach((f, i) => { const b = BF[i]; if (!b) return; const s = td.decode(b);
for (const m of s.matchAll(/https:\/\/(?:cdnjs\.cloudflare\.com|unpkg\.com|cdn\.jsdelivr\.net)\/[^"' )`]+/g)) { const u = m[0].replace(/@'$/, ''), w = s.slice(Math.max(0, m.index - 250), m.index + m[0].length + 400), ok = /sha(256|384|512)-[A-Za-z0-9+/=]{40,}/.test(w); (M.get(u) || M.set(u, { n: new Set(), ok: true, f: {} }).get(u)).f[f] = ((M.get(u).f[f]) || ok); } });
for (const o of M.values()) { for (const f in o.f) { o.n.add(f); o.ok = o.ok && o.f[f]; } }
return M;
}
async function sriSec(env, l, d) {
const S = t(l, $q.ds), M = new Map(); for (const p of d.pages) for (const [f, ok] of p.x || []) { const o = M.get(f) || { n: new Set(), ok: true }; o.n.add(p.p); o.ok = o.ok && ok; M.set(f, o); }
try { for (const [u, o] of await sriJs(env)) { const x = M.get(u) || { n: new Set(), ok: true }; for (const f of o.n) x.n.add(f); x.ok = x.ok && o.ok; M.set(u, x); } } catch (e) {}
return sec(S[0], $q.Q + esc(S[1]) + (l !== 'en' && t(l, $q.dt) ? ' ' + esc(t(l, $q.dt)) : '') + '</p>' + (M.size ? table(S[2], [...M].map(([f, o]) => $q.cu + esc(f) + $q.du + [...o.n].map(esc).join(', ') + $q.dv + okc(l, o.ok) + $q.aQ)) : '<p>' + okc(l, true, S[3]) + '</p>'), 'sri');
}
function cvSec(l, d) {
const S = t(l, $q.dw), ok = d.pages.filter(p => p.status === 200);
return sec(S[0], $q.Q + esc(S[1]) + '</p>' + table(S[2], CV_R.map(([n, k, f]) => { const P = ok.filter(p => k === 'all' || cvKind(p) === k), c = P.filter(f).length; return $q.dx + esc(n) + $q.dy + okc(l, c === P.length, nf(c, l) + '/' + nf(P.length, l)) + $q.aH + esc(k === 'all' ? '*' : k) + $q.aQ; })), $q.dz);
}
let SECM = null;
async function secData() {
if (SECM && Date.now() - SECM.t < 300000) return SECM.v;
const pages = await Promise.all($t.o_SEC_PAGES.map(async p => { try { const r = await fetch(ORIGIN + p, { headers: { 'user-agent': $q.dA }, redirect: $q.ar }); const h = {}; for (const k of $t.o_SEC_H) { const v = r.headers.get(k); if (v != null) h[k] = v; } let x = null; if (r.status === 200 && /text\/html/.test(r.headers.get($q.dB) || '')) { try { x = sriOf(await r.text()); } catch (e) {} } else { try { await r.body.cancel(); } catch (e) {} } return { p, status: r.status, h, x }; } catch (e) { return { p, status: 0, h: {} }; } }));
let csp = null; try { const r = await fetch(ORIGIN + $q.dC, { cf: { cacheTtl: 300 } }); if (r.ok) csp = await r.json(); } catch (e) {}
const v = { at: new Date().toISOString(), pages, csp }; SECM = { t: Date.now(), v }; return v;
}
async function sePage(env, shell, l) {
const [d, txt] = await Promise.all([secData(), file(env, $q.dD, 600000)]);
const short = v => v.length > 90 ? v.slice(0, 88) + '…' : v;
const rows = $t.o_SEC_H.map(k => $q.dE + esc(k) + $q.dF + d.pages.map(p => '<td>' + (p.h[k] != null ? okc(l, true, '✓') : $q.dG) + '</td>').join('') + '</tr>');
const vals = $t.o_SEC_H.map(k => { const p = d.pages.find(x => x.h[k] != null); return p ? $q.dE + esc(k) + $q.dH + esc(short(p.h[k])) + $q.dI + esc(p.p) + $q.dJ : ''; }).filter(Boolean);
const c = d.csp, dir = c && c.by_directive ? c.by_directive.slice(0, 8) : [];
const b = (txt && (txt[l] || txt.en) ? sec(t(l, 'se_in'), (txt[l] || txt.en).map(p => '<p>' + esc(p) + '</p>').join('')) : '') +
sec(t(l, $q.dK), $q.Q + esc(fill(t(l, 'se_at'), { d: ft(d.at, l) })) + '</p>' + table([t(l, 'se_h')].concat(d.pages.map(p => p.p + ' (' + p.status + ')')), rows)) +
cvSec(l, d) + await sriSec(env, l, d) + sec(t(l, $q.dL), table([t(l, 'se_h'), t(l, 'se_v')], vals)) +
sec(t(l, $q.dM), c ? kpis(l, [[nf(c.last_7d || 0, l), t(l, 'se_7d')], [nf(c.total || 0, l), t(l, $q.dN)], [nf(c.pages || 0, l), t(l, $q.dO)]]) + '<p>' + esc(c.mode || '') + '</p>' +
(dir.length ? table([t(l, $q.dP), t(l, 'se_n')], dir.map(x => $q.dQ + esc(x.directive || x.d || '') + $q.cv + bdi(l, nf(x.n, l)) + $q.aQ)) : '') : $q.aV + esc(t(l, 'na')) + '</p>') +
sec(t(l, $q.ch), paras(l, 'se_p')) + files(l, [[$q.dC, 'JSON'], [$q.dR, 'JSON'], [$q.dS, $q.dT]]) + $q.dU + esc(t(l, 'trust')) + $q.aU;
return page(shell, l, Object.assign(H(l, 'se'), { path: $q.dV, body: b, updated: today(), maxAge: 300 }));
}
async function pfPage(env, shell, l) {
const [pb, bm, bud] = await Promise.all([file(env, $q.dW), brManifest(env), file(env, $q.dX)]); if (!pb) return null;
const NM = t(l, 'pf_nm') || {};
const cell = (m, b) => $q.cI + kb(m, l) + (b ? $q.dY + kb(b, l) + $q.F : '') + '</td>';
const rows = pb.templates.map(x => $q.dZ + (x.key === $q.ea ? x.path : pre(l) + x.path) + '">' + esc(NM[x.key] || x.key) + $q.eb + cell(x.measured.html_wire, x.budget.html_wire) + cell(x.measured.js_wire, x.budget.js_wire) + cell(x.measured.css_wire, x.budget.css_wire) + $q.cI + x.measured.requests + (x.budget.requests ? $q.dY + x.budget.requests + $q.F : '') + $q.aH + okc(l, !x.over.length) + $q.aQ);
const st = brStatus(), brows = bm ? Object.entries(bm.files).map(([f, e]) => $q.ec + esc(f) + $q.cM + esc(f) + $q.dg + kb(e.source_bytes, l) + $q.aG + kb(e.br_bytes, l) + $q.aG + bdi(l, nf(100 - e.br_bytes / e.source_bytes * 100, l, 1) + ' %') + $q.aH + (!BR_ON ? $q.ed + esc(t(l, 'no')) + $q.F : st[f] ? okc(l, st[f].ok, t(l, st[f].ok ? $q.ee : $q.ef)) : $q.ed + esc(t(l, $q.eg)) + $q.F) + $q.aQ) : [];
const allA = new Set(), ver = new Set(); for (const x of pb.templates) for (const a of x.assets) { allA.add(a.path); if (/[?&]v=/.test(a.path)) ver.add(a.path); }
const b = kpis(l, [[nf(pb.passed, l) + '/' + nf(pb.total, l), t(l, $q.eh)], [nf(ver.size, l) + '/' + nf(allA.size, l), t(l, $q.ei)], [bm ? nf(Object.keys(bm.files).length, l) : '0', t(l, $q.ej)]]) +
sec(t(l, $q.ek), table(t(l, 'pf_th'), rows) + $q.Q + esc(fill(t(l, $q.el), { d: ft(pb.measured, l) })) + '</p>') +
sec(t(l, 'pf_br'), paras(l, $q.em) + (BR_ON ? '' : $q.co + esc(t(l, $q.en)) + $q.cp) + table(t(l, $q.eo), brows) + code(l, $s.k3)) +
sec(t(l, $q.ep), paras(l, $q.eq)) + sec(t(l, $q.er), paras(l, $q.es) + code(l, $s.k4)) +
files(l, [[$q.dX, bud ? bud.set : 'JSON'], [$q.dW, 'JSON'], [$q.al, 'JSON'], [$q.dl, $q.bl], [$q.et, 'sh']]) + $t.k24 + esc(t(l, 'pf_pw')) + $q.bq + pre(l) + $t.k25;
return page(shell, l, Object.assign(H(l, 'pf'), { path: $q.eu, body: b, updated: pb.measured }));
}
async function sdPage(env, shell, l) {
const [m, ts] = await Promise.all([file(env, $q.ev), file(env, $q.ew)]); if (!m) return null;
const fr = Object.entries(m.files).map(([f, e]) => $q.ex + esc(f) + $q.ey + esc(f) + $q.dg + kb(e.bytes, l) + $q.ez + esc(e.sha256.slice(0, 16)) + $q.eA);
const tr = ts ? ts.runs.map(r => $q.eB + esc(r.client) + $q.aG + bdi(l, nf(r.passed, l) + '/' + nf(r.total, l)) + $q.aG + esc(ft(r.at, l)) + $q.aH + okc(l, r.passed === r.total) + $q.aQ) : [];
const b = kpis(l, [[esc(m.version), t(l, $q.eC)], [nf(m.operations, l), t(l, $q.eD)], [esc(m.spec_version), t(l, $q.eE)]]) +
sec(t(l, $q.eF), table(t(l, 'sd_th'), fr)) + sec(t(l, 'sd_js'), code(l, m.examples.js)) + sec(t(l, 'sd_py'), code(l, m.examples.py)) +
sec(t(l, $q.eG), tr.length ? table(t(l, $q.eH), tr) : $q.aV + esc(t(l, 'na')) + '</p>') +
sec(t(l, $q.ch), paras(l, 'sd_p')) + files(l, [[$q.eI, $q.eJ], [$q.eK, $q.bl], [$q.eL, $q.i]]) + $q.eM + esc(t(l, $q.eN)) + $q.bq + pre(l) + $q.eO + esc(t(l, $q.eP)) + $q.aU;
return page(shell, l, Object.assign(H(l, 'sd'), { path: $q.eQ, body: b, updated: m.built, type: $q.eR }));
}
async function sqPage(env, shell, l) {
const d = await file(env, $q.eS); if (!d || !d.runs) return null;
const R0 = d.runs[0], R1 = d.runs[d.runs.length - 1], LN = t(l, 'langs') || {};
const rows = Object.keys(R1.languages).map(L => { const a = R0.languages[L], z = R1.languages[L]; return $q.eT + esc(LN[L] || L) + $q.eU + bdi(l, nf(a.pass_pct, l, 1) + ' %') + $q.aG + bdi(l, nf(z.pass_pct, l, 1) + ' %') + $q.aG + bdi(l, nf(z.mrr, l, 3)) + $q.aG + Object.entries(z.kinds).map(([k, v]) => esc((t(l, 'sq_k') || {})[k] || k) + ' ' + v.pass + '/' + v.n).join('<br>') + $q.aQ; });
const fails = Object.entries(R1.languages).flatMap(([L, z]) => z.fails.slice(0, 2).map(f => $q.eB + esc(L) + $q.eV + esc(f.q) + $q.dv + (f.first ? $q.C + pre(l) + $q.aS + esc(f.first) + '/">' + esc(f.first) + '</a>' : '-') + $q.aG + (f.expected_rank || '-') + $q.aQ));
const hist = d.runs.slice().reverse().slice(0, 12).map(r => $q.aF + esc(ft(r.at, l)) + $q.aH + esc(r.label || '') + $q.aG + Object.values(r.languages).reduce((a, x) => a + x.pass, 0) + '/' + Object.values(r.languages).reduce((a, x) => a + x.n, 0) + $q.aQ);
const b = kpis(l, [[nf(Object.values(R1.languages).reduce((a, x) => a + x.n, 0), l), t(l, 'sq_q')], [nf(Object.values(R1.languages).reduce((a, x) => a + x.pass, 0) / Object.values(R1.languages).reduce((a, x) => a + x.n, 0) * 100, l, 1) + ' %', t(l, $q.eW)], [nf(Object.values(R0.languages).reduce((a, x) => a + x.pass, 0) / Object.values(R0.languages).reduce((a, x) => a + x.n, 0) * 100, l, 1) + ' %', t(l, $q.eX)]]) +
sec(t(l, 'sq_by'), table(t(l, 'sq_th'), rows)) + sec(t(l, $q.eY), fails.length ? table(t(l, $q.eZ), fails) : $q.fa + esc(t(l, $q.fb)) + '</p>') +
sec(t(l, $q.fc), table(t(l, $q.fd), hist)) + sec(t(l, $q.ch), paras(l, 'sq_p')) +
files(l, [[$q.fe, 'JSON'], [$q.ff, 'Node'], [$q.eS, 'JSON'], [$q.fg, 'JSON'], [$q.fh, 'API']]);
return page(shell, l, Object.assign(H(l, 'sq'), { path: $q.fi, body: b, updated: R1.at }));
}
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
async function marketsData(env) { try { const r = await fetch(ORIGIN + $q.fj, { cf: { cacheTtl: 600 } }); return r.ok ? await r.json() : null; } catch (e) { return null; } }
export async function mcpTool(env, name, a) {
const slugOk = s => typeof s === $q.j && /^[a-z0-9-]{1,90}$/.test(s);
if (name === $q.fk) {
if (!slugOk(a.slug)) return { err: $t.k26 };
const bp = await file(env, $q.aM, 3600000), hs = bp && bp.projects[a.slug];
if (!hs) return { status: 404, body: { error: $q.fl, hint: $t.k27 } };
const rec = hs.slice().reverse(), outD = [];
for (let i = 0; i < rec.length; i++) { const [day, ch] = rec[i], e = { day, change: typeof ch === $q.j ? ch : $q.fm, fields: typeof ch === $q.j ? null : ch, delta_file: ORIGIN + $q.az + day + '.json' };
if (i < 6 && typeof ch !== $q.j) { const d = await file(env, $q.az + day + '.json', 600000); const c = d && d.changed[a.slug]; if (c) { e.new_values = c.set; if (c.unset) e.removed_fields = c.unset; e.from_day = d.from.day; } }
outD.push(e); }
return { body: { project: a.slug, page: ORIGIN + $q.aS + a.slug + '/', snapshot_days: bp.days, changes: outD, note: $s.k5 }, source: ORIGIN + $q.aM };
}
if (name === $q.fn) {
if (!slugOk(a.slug)) return { err: $t.k28 };
const n = await N(), ix = await n.data(env), x = ix.bySlug.get(a.slug);
if (!x) return { status: 404, body: { error: $q.fo } };
const ST = [$q.fp, $q.fq, $q.fr], LV = { registry: $q.fs, independent: $q.ft, developer: $q.fu, none: $q.fv };
return { body: { project: a.slug, name: x.n, developer: x.dv || null, page: ORIGIN + $q.aS + a.slug + '/',
claims: (x.cl || []).map(c => ({ claim: c[0], result: ST.includes(c[1]) ? c[1] : c[1], checked_against: LV[c[2]] || c[2], source: c[3] || null })),
evidence_by_check: x.ev || {}, sources: x.src || [], last_read: x.ad || null, rules: $t.k29 }, source: ORIGIN + $q.aS + a.slug + '/' };
}
if (name === $q.fw) {
const L = a.markets; if (!Array.isArray(L) || L.length < 2 || L.length > 4 || L.some(v => typeof v !== $q.j || v.length > 60)) return { err: $q.fx };
const [mk, di] = await Promise.all([marketsData(env), file(env, $q.fy)]);
const rows = L.map(m => { const a1 = mk && (mk.markets || []).find(x => lc(x.market) === lc(m)), d1 = di && (di.markets || []).find(x => lc(x.market) === lc(m));
return { market: m, found: !!(a1 || d1), transparency: a1 || null, delays: d1 ? { tracked: d1.tracked, with_date: d1.with_date, past_first_handover: d1.past_first, share_past_first_pct: d1.share_past_first, median_months_late: d1.median_late, p90_months_late: d1.p90_late, sample_late: (d1.late_months || []).length } : null }; });
return { body: { markets: rows, delay_index_month: di && di.as_of_month, delay_rules: di && di.rules, sources: [ORIGIN + $q.fj, ORIGIN + $q.fy], note: $t.k30 }, source: ORIGIN + $t.k31 };
}
if (name === $q.fz) {
if (!slugOk(a.slug)) return { err: $t.k32 };
if (a.day != null && !/^\d{4}-\d{2}-\d{2}$/.test(a.day)) return { err: $q.bI };
const r = await tlogProof(env, a.slug, a.day || ''); if (r.error) return { status: 404, body: r };
return { body: r, source: ORIGIN + $q.cc + a.slug + (a.day ? '&day=' + a.day : '') };
}
if (name === $q.fA) {
if (a.day != null && !/^\d{4}-\d{2}-\d{2}$/.test(a.day)) return { err: $q.bI };
const ix = await file(env, $q.aw), e = ix && (a.day ? ix.entries.find(x => x.to === a.day) : ix.entries[ix.entries.length - 1]);
if (!e) return { status: 404, body: { error: $q.aA, days: ix ? ix.entries.map(x => x.to) : [] } };
const d = await file(env, $q.az + e.to + '.json', 600000);
return { body: { from: d.from, to: d.to, counts: d.counts, added: d.added.slice(0, 200).map(x => x.s), changed: Object.keys(d.changed).slice(0, 200), removed: d.removed.slice(0, 200), file: ORIGIN + e.file, file_sha256: e.sha256, signature: ORIGIN + e.api + '.sig', verify: $t.k33 }, source: ORIGIN + e.api };
}
return null;
}
async function mcPage(env, shell, l) {
const E = await import('./kbx_e.js'), TL = E.TOOLS || [], ts = await file(env, $q.fB);
const v2 = new Set(TOOLS2.map(x => x.name));
const rows = TL.map(x => $q.cu + esc(x.name) + $q.aP + (v2.has(x.name) ? $q.fC : '') + $q.aH + esc(x.title) + $q.fD + esc(Object.keys((x.inputSchema || {}).properties || {}).join(', ')) + $q.aQ);
const tr = ts ? ts.results.map(r => $q.cu + esc(r.tool) + $q.dv + okc(l, r.ok) + $q.fE + esc(r.detail || '') + $q.aQ) : [];
const b = kpis(l, [[esc(E.SERVER ? E.SERVER.version : '2'), t(l, $q.fF)], [nf(TL.length, l), t(l, $q.fG)], [nf(v2.size, l), t(l, $q.fH)], [ts ? nf(ts.passed, l) + '/' + nf(ts.total, l) : '-', t(l, $q.fI)]]) +
sec(t(l, $q.fJ), table(t(l, 'mc_th'), rows)) + sec(t(l, $q.fK), code(l, $s.k6)) +
sec(t(l, $q.fL), tr.length ? table(t(l, $q.fM), tr) + $q.Q + esc(fill(t(l, $q.fN), { d: ft(ts.at, l) })) + '</p>' : $q.aV + esc(t(l, 'na')) + '</p>') +
sec(t(l, $q.ch), paras(l, 'mc_p')) + $q.fO + esc(t(l, $q.fP)) + $t.k34;
return page(shell, l, Object.assign(H(l, 'mc'), { path: $q.fQ, body: b, updated: $q.U, type: $q.eR }));
}
const mslug = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
async function chartData(env, ms) {
const [mk, di] = await Promise.all([marketsData(env), file(env, $q.fy)]);
const a = mk && (mk.markets || []).find(x => mslug(x.market) === ms), d = di && (di.markets || []).find(x => mslug(x.market) === ms);
if (!a && !d) return null;
const B = [[0, 3], [4, 6], [7, 12], [13, 24], [25, 999]], lm = (d && d.late_months) || [];
return { market: (a || d).market, country: a ? a.country : null, disclosure: a ? { projects: a.projects, permit_public_pct: a.permit_public_pct, deposit_protection_pct: a.deposit_protection_pct, avg_checks_public: a.avg_checks, avg_checks_confirmed: a.avg_confirmed, transparency_index: a.transparency_index } : null,
delays: d ? { tracked: d.tracked, with_date: d.with_date, past_first: d.past_first, share_past_first_pct: d.share_past_first, median_months_late: d.median_late, p90_months_late: d.p90_late, buckets: B.map(([x, y]) => ({ from: x, to: y === 999 ? null : y, n: lm.filter(v => v >= x && v <= y).length })) } : null,
as_of: { markets: mk && mk.updated, delay_index: di && di.as_of_month }, page: ORIGIN + '/m/' + ms + '/', licence: $t.k35 };
}
export function chartSvg(c, kind, l, dark) {
const fg = dark ? $q.fR : $q.fS, mu = dark ? $q.fT : $q.fU, ac = dark ? $q.fV : $q.cV, bad = dark ? $q.fW : $q.cW, W = 360, rtl = l === 'ar';
const tx = (x, y, s, o) => $q.fX + x + '" y="' + y + $q.cU + ((o && o.c) || fg) + $q.fY + ((o && o.s) || 12) + '"' + (o && o.a ? $q.fZ + o.a + '"' : '') + (o && o.w ? $q.ga : '') + '>' + esc(s) + $q.gb;
let body = '', h = 0, title;
if (kind === $q.gc && c.disclosure) {
const D = c.disclosure, R = [[t(l, $q.gd), D.permit_public_pct], [t(l, $q.ge), D.deposit_protection_pct], [t(l, $q.gf), Math.round(D.avg_checks_public / 6 * 100)], [t(l, 'ch_ti'), D.transparency_index]];
title = fill(t(l, 'ch_dt'), { m: c.market });
R.forEach((r, i) => { const y = 44 + i * 30, w = Math.max(0, Math.min(100, r[1] || 0)) * 1.6; body += tx(rtl ? W - 10 : 10, y + 12, r[0], { s: 11.5, a: rtl ? 'end' : null }) + $q.cS + (rtl ? 10 + 160 - w : 190) + '" y="' + (y + 1) + $q.gg + w + $q.gh + ac + '"/>' + tx(rtl ? 10 + 160 - w - 4 : 194 + w, y + 13, (r[1] == null ? '-' : r[1]) + (i < 2 || i === 2 ? '%' : ''), { s: 11, c: mu, a: rtl ? 'end' : null }); });
h = 44 + R.length * 30 + 4; body += tx(rtl ? W - 10 : 10, h + 10, fill(t(l, 'ch_dn'), { n: D.projects }), { s: 10.5, c: mu, a: rtl ? 'end' : null }); h += 18;
} else if (c.delays) {
const D = c.delays, mx = Math.max(1, ...D.buckets.map(b => b.n)); title = fill(t(l, 'ch_lt'), { m: c.market });
body += tx(rtl ? W - 10 : 10, 44, fill(t(l, 'ch_ls'), { a: D.past_first, b: D.with_date, p: D.share_past_first_pct }), { s: 11.5, a: rtl ? 'end' : null });
D.buckets.forEach((b, i) => { const x = 20 + i * 66, bh = Math.round(b.n / mx * 70); body += $q.cS + x + '" y="' + (132 - bh) + $q.gi + bh + $q.gj + bad + '"/>' + tx(x + 22, 128 - bh, String(b.n), { s: 11, a: $q.gk, w: 1 }) + tx(x + 22, 148, b.to == null ? b.from + '+' : b.from + '-' + b.to, { s: 10.5, c: mu, a: $q.gk }); });
body += tx(W / 2, 163, t(l, $q.gl), { s: 10.5, c: mu, a: $q.gk }) + tx(rtl ? W - 10 : 10, 182, D.median_months_late == null ? t(l, $q.gm) : fill(t(l, $q.gn), { m: D.median_months_late, p: D.p90_months_late, n: D.past_first }), { s: 10.5, c: mu, a: rtl ? 'end' : null });
h = 190;
} else return null;
return $t.k36 + W + ' ' + (h + 26) + $q.gg + W + $q.go + (h + 26) + $q.gp + esc(title) + $t.k37 + (rtl ? $q.gq : '') + '>' +
tx(rtl ? W - 10 : 10, 20, title, { s: 13.5, w: 1, a: rtl ? 'end' : null }) + body + tx(rtl ? W - 10 : 10, h + 16, fill(t(l, $q.gr), { d: kind === $q.gc ? (c.as_of.markets || '') : (c.as_of.delay_index || '') }), { s: 10, c: mu, a: rtl ? 'end' : null }) + $q.gs;
}
async function chartIframe(env, u) {
const ms = /^\/embed\/chart\/([a-z0-9-]{2,60})\/?$/.exec(u.pathname)[1], q = u.searchParams, l = LANGS.includes(q.get('lang')) ? q.get('lang') : 'en';
const kind = q.get('kind') === $q.gc ? $q.gc : $q.gt, dark = q.get('theme') === 'dark';
const c = await chartData(env, ms); if (!c) return new Response($q.gu, { status: 404, headers: { 'content-type': $q.gv } });
const svg = chartSvg(c, kind, l, dark); if (!svg) return new Response($q.gw, { status: 404, headers: { 'content-type': $q.gv } });
const href = ORIGIN + pre(l) + '/m/' + ms + $q.gx;
const tbl = kind === $q.gt && c.delays ? c.delays.buckets.map(b => $q.eB + (b.to == null ? b.from + '+' : b.from + '-' + b.to) + $q.aH + b.n + $q.aQ).join('') : c.disclosure ? Object.entries(c.disclosure).map(([k, v]) => $q.eB + esc(k) + $q.aH + esc(v) + $q.aQ).join('') : '';
const html = $s.k7 + l + $q.gy + l + '"' + (l === 'ar' ? $q.M : '') + $s.k8 + ORIGIN + pre(l) + '/m/' + ms + $q.gz + esc(c.market) + $q.gA +
$q.gB + (dark ? $q.gC : '#fff') + $q.gD + (dark ? $q.fR : $q.fS) + $s.k9 + svg +
$q.gE + esc(c.market) + $q.n + tbl + $t.k38 + esc(href) + $q.gF + esc(fill(t(l, $q.gG), { m: c.market })) + $q.gH;
return new Response(html, { headers: { 'content-type': $q.gI, 'cache-control': $q.gJ, 'content-language': l, 'x-content-type-options': $q.ag, 'x-robots-tag': $q.gK, 'content-security-policy': $s.k10 } });
}
async function chartApi(req, u, env) {
const ms = /^\/api\/v1\/charts\/([a-z0-9-]{2,60})$/.exec(u.pathname)[1], q = u.searchParams, l = LANGS.includes(q.get('lang')) ? q.get('lang') : 'en';
const c = await chartData(env, ms); if (!c) return jerr({ error: $q.gL, list: ORIGIN + $q.fj }, 404);
c.svg = { delays: chartSvg(c, $q.gt, l, q.get('theme') === 'dark'), disclosure: chartSvg(c, $q.gc, l, q.get('theme') === 'dark') };
c.link = { href: ORIGIN + pre(l) + '/m/' + ms + '/', text: fill(t(l, $q.gG), { m: c.market }) };
return out(req, env, json(c), { maxAge: 3600 });
}
async function ecPage(env, shell, l) {
const di = await file(env, $q.fy), mk = await marketsData(env);
const ok = new Set(((di && di.markets) || []).filter(x => x.with_date >= 5).map(x => mslug(x.market)));
const L = ((mk && mk.markets) || []).filter(x => ok.has(mslug(x.market))).sort((a, b) => b.projects - a.projects).slice(0, 40);
const ex = 'dubai', lang = l === 'en' ? '' : $q.gM + l;
const snip1 = $t.k39 + ex + $q.gN + lang + $t.k40;
const snip2 = $t.k41 + V + $q.gO + ex + $q.gP + (l === 'en' ? '' : $q.gQ + l + '"') + $q.gR;
const b = sec(t(l, $q.gS), $t.k42 + ex + $q.gN + lang + $t.k43 + esc(fill(t(l, 'ch_lt'), { m: 'Dubai' })) + $q.gT + ex + $q.gU + lang + $t.k44 + esc(fill(t(l, 'ch_dt'), { m: 'Dubai' })) + $q.gV) +
sec(t(l, $q.gW), $q.gX + V + $q.gY + l + $q.gZ + esc(t(l, $q.ha)) + $q.hb + L.map(x => $q.hc + mslug(x.market) + '"' + (mslug(x.market) === ex ? $q.hd : '') + '>' + esc(x.market) + $q.he).join('') + $q.hf + esc(t(l, $q.hg)) + $t.k45 + esc(t(l, $q.hh)) + $q.hi + esc(t(l, $q.hj)) + $t.k46 + esc(t(l, $q.hk)) + $q.hl +
'<h3>' + esc(t(l, 'ec_if')) + $q.hm + esc(snip1) + $q.hn + esc(t(l, 'ec_wc')) + $q.ho + esc(snip2) + $t.k47 + V + $q.ca) +
sec(t(l, $q.ch), paras(l, 'ec_p')) + files(l, [[$q.hp, 'JSON'], [$q.hq, 'JS'], [$q.fy, 'JSON'], [$q.fj, 'JSON']]) + $q.aR + pre(l) + $q.hr + esc(t(l, $q.hs)) + $q.bq + pre(l) + $q.ht + esc(t(l, $q.hu)) + $q.aU;
return page(shell, l, Object.assign(H(l, 'ec'), { path: $q.hv, body: b, updated: di && di.generated, crumb: [[t(l, 'embed'), $q.hw]] }));
}
export async function statusBlock(env, l) {
if (!(await loadT(env))) return '';
let us = null, mo = null; try { us = await (await import('./kbx_n27a.js')).apiUsage(28); } catch (e) {} try { mo = await monData(env); } catch (e) {}
const G = us ? Object.entries(us.by_endpoint).sort((a, b) => b[1] - a[1]).slice(0, 8) : [];
const all = mo ? mo.P.reduce((a, x) => [a[0] + x.up, a[1] + x.n], [0, 0]) : [0, 0];
return $q.hx + (l === 'ar' ? $q.M : '') + '>' + $q.a + '<h2>' + esc(t(l, 'us_t')) + $q.hy + esc(t(l, 'us_nv')) + '</p>' +
(G.length ? table(t(l, 'us_th'), G.map(([k, v]) => $q.cu + esc(k) + $q.cv + bdi(l, nf(v, l)) + $q.aQ)) : $q.aV + esc(t(l, $q.cw)) + '</p>') +
$q.aR + pre(l) + $q.hz + esc(t(l, 'us_t')) + $q.hA + esc(t(l, 'mo_t')) + '</h2>' +
(mo && mo.S.length ? kpis(l, [[nf(mo.S.length, l), t(l, $q.da)], [all[1] ? nf(all[0] / all[1] * 100, l, 2) + ' %' : '-', t(l, 'mo_up')], [nf(mo.days.length, l), t(l, $q.db)]]) : '') +
$q.aR + pre(l) + $q.hB + esc(t(l, 'mo_t')) + $q.bq + pre(l) + $q.hC + esc(t(l, 'pf_t')) + $q.bq + pre(l) + $q.hD + esc(t(l, 'se_t')) + $q.bq + pre(l) + $q.hE + esc(t(l, 'sq_t')) + $q.hF;
}
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname; let m;
if (!PATHS.test(p) || (req.method !== 'GET' && req.method !== 'HEAD')) return null;
if (!(await loadT(env))) return null;
if (p.startsWith($q.av)) return deltaApi(req, u, env);
if (p.startsWith($q.bG)) return tlogApi(req, u, env);
if (p.startsWith($q.hG)) return chartApi(req, u, env);
if (p === $q.dj) { const d = await monData(env); return out(req, env, json({ about: d.m && d.m.about, per_page: d.P, per_day: d.days, samples: d.S, edge_now: d.live }), { maxAge: 120 }); }
if (p.startsWith($q.hH)) return chartIframe(env, u);
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
export async function ready(env) { return !!(await loadT(env)); }
export function relLinks(l) { if (!T) return ''; return '<h2>' + esc(t(l, 'more')) + $q.hI + ALL.map(x => $q.t + pre(l) + x[1] + '">' + esc(t(l, x[0] + '_t')) + $q.u).join('') + '</ul>'; }
