// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_lastmod__q, $s = TB.kbx_lastmod__s, $t = TB.kbx_lastmod__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const VOL = new Set(['checked', 'invited', 'seen', 'sealed']);
export const PARTS = ['n', 'c', 'p', 'f', 's'];
function canon(v, top) {   // stable JSON: sorted keys, volatile date keys dropped; at the top level also the page-copy hashes
  if (v === null || typeof v !== $q.a) return JSON.stringify(v === undefined ? null : v);
  if (Array.isArray(v)) return '[' + v.map(x => canon(x)).join(',') + ']';
  const ks = Object.keys(v).filter(k => !VOL.has(k) && !(top && (k === 'sha' || k === 'fp')) && v[k] !== undefined).sort();
  return '{' + ks.map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
}
function fnv(s, seed) { let h = seed >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16).padStart(8, '0'); }
export const fingerprint = v => v == null ? '' : (s => fnv(s, 2166136261) + fnv(s, 3735928559))(canon(v, true));
export const isoDay = d => { const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(d || '')); return m ? m[1] : null; };
export function compute(files, pin) {
const F = files || {}, P = (pin && pin.p) || {};
const caseBy = new Map(((F.cases && F.cases.cases) || []).map(c => [c.id, c]));
const part = { n: null, c: id => caseBy.get(id), p: id => ((F.prom && F.prom.projects) || {})[id], f: id => (((F.find && F.find.projects) || {})[id] || {}).f, s: id => ((F.prog && F.prog.projects) || {})[id] };
const fileDay = { n: isoDay(F.named && F.named.updated), c: isoDay(F.cases && F.cases.updated), p: isoDay(F.prom && F.prom.updated), f: isoDay(F.find && F.find.updated), s: isoDay(F.prog && F.prog.updated) };
const today = new Date().toISOString().slice(0, 10), out = new Map(), state = {};
for (const x of (F.named && F.named.projects) || []) {
if (!x || !x.id) continue;
const r = one(x, P, part, fileDay, today);
state[x.id] = r.st; out.set(x.id, r.d);
}
return { byId: out, state, files: fileDay };
}
function one(x, P, part, fileDay, today) {   // one project: its five fingerprints and the date of its last real change
  const old = P[x.id] || {}, st = {}; let best = isoDay(x.ad) || null;
  for (const k of PARTS) {
    const h = fingerprint(k === 'n' ? x : part[k](x.id));
    const o = old[k], d = o && o[0] === h && isoDay(o[1]) ? o[1] : (h || (o && o[0]) ? fileDay[k] || today : null);   // a part that appeared, changed or disappeared
    st[k] = [h, d];
    if (d && (!best || d > best)) best = d;
  }
  return { st, d: best || fileDay.n || today };
}
const QIX = new WeakMap();
export function quickLastmod(q, pin, kind, key) {
if (!q || !q.named || !q.cases || !q.caseBy || !q.prom || !q.find || !q.prog || !pin) return null;
let ix = QIX.get(q.named);
if (!ix) { ix = { slug: new Map(), dev: new Map() }; for (const x of q.named.projects || []) { if (!x || !x.id) continue; if (x.s) ix.slug.set(x.s, x); if (x.dvs) { if (!ix.dev.has(x.dvs)) ix.dev.set(x.dvs, []); ix.dev.get(x.dvs).push(x); } } QIX.set(q.named, ix); }
const xs = kind === $q.b ? [ix.slug.get(key)].filter(Boolean) : kind === $q.c ? ix.dev.get(key) || [] : [];
if (!xs.length) return null;
const P = pin.p || {}, today = new Date().toISOString().slice(0, 10);
const part = { n: null, c: id => q.caseBy.get(id), p: id => (q.prom.projects || {})[id], f: id => ((q.find.projects || {})[id] || {}).f, s: id => (q.prog.projects || {})[id] };
const fileDay = { n: isoDay(q.named.updated), c: isoDay(q.cases.updated), p: isoDay(q.prom.updated), f: isoDay(q.find.updated), s: isoDay(q.prog.updated) };
let best = null;
for (const x of xs) { const d = one(q.raw ? q.raw(x) : x, P, part, fileDay, today).d; if (d && (!best || d > best)) best = d; }
return best;
}
let PIN = null;
export async function pinFile(env) { if (PIN) return PIN; const v = await (PINP || (PINP = json(env, $q.d).finally(() => { PINP = null; }))); if (v) PIN = v; return v; }
let PINP = null;
let MEMO = null;
let NET = false;
async function json(env, name) {
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.e + name)); if (r.ok) return await r.json(); } catch (e) {}
  NET = true;
  try { const r = await fetch(ORIGIN + $q.f + name, { cf: { cacheTtl: 300, cacheEverything: true } }); if (r.ok) return await r.json(); } catch (e) {}
  return null;
}
export async function trueLastmod(env) {
if (MEMO && (MEMO.a || Date.now() - MEMO.t < 300000)) return MEMO.v;
if (BUSY) return BUSY;
return BUSY = trueLastmod0(env).then(v => { BUSY = null; return v; }, e => { BUSY = null; throw e; });
}
let BUSY = null;
async function trueLastmod0(env) {
NET = false;
const [named, cases, prom, find, prog, pin] = await Promise.all([$q.g, $q.h, $q.i, $q.j, $q.k, $q.d].map(n => json(env, n)));
const r = compute({ named, cases, prom, find, prog }, pin);
const dev = new Map(), slug = new Map();
for (const x of (named && named.projects) || []) { const d = r.byId.get(x.id); if (x.s && d) slug.set(x.s, d); if (x.dvs && d && (!dev.has(x.dvs) || d > dev.get(x.dvs))) dev.set(x.dvs, d); }
const v = { project: r.byId, slug, developer: dev, state: r.state, files: r.files, pinned: pin ? (pin.updated || null) : null, pinCount: pin && pin.p ? Object.keys(pin.p).length : 0 };
MEMO = { t: Date.now(), v, a: !NET }; return v;
}
export async function lastmodRoute(env) {
const v = await trueLastmod(env);
const body = { version: $q.l, updated: new Date().toISOString().slice(0, 16) + 'Z', method: $s.k0, files: v.files, previous_pin: v.pinned, p: v.state };
return new Response(JSON.stringify(body), { headers: { 'content-type': $q.m, 'cache-control': $q.n, 'x-robots-tag': $q.o } });
}
export async function seoLd(pg, env, kind, key, q) {
if (!pg || !pg.ld || !Array.isArray(pg.ld[$q.p]) || !pg.feed || !pg.canon) return pg;
let d = null;
if (q && !(MEMO && MEMO.a)) { try { d = quickLastmod(q, await pinFile(env), kind, key); } catch (e) { d = null; } }
if (!d) { const T = await trueLastmod(env).catch(() => null); d = T && (kind === $q.b ? T.slug.get(key) : kind === $q.c ? T.developer.get(key) : null); }
const G = pg.ld[$q.p], img = ORIGIN + '/og' + pg.feed.path.replace(/\/$/, '') + '.png', id = pg.canon + '#og';
for (const n of G) {
if (!n || typeof n !== $q.a) continue;
if (d && (n['@type'] === $q.q || n['@type'] === $q.r || n['@type'] === $q.s) && n.dateModified) n.dateModified = d;
if ((n['@type'] === $q.q || n['@type'] === $q.r) && !n.primaryImageOfPage) n.primaryImageOfPage = { '@id': id };
}
if (!G.some(n => n && n['@id'] === id)) G.push({ '@type': $q.t, '@id': id, contentUrl: img, url: img, encodingFormat: $q.u, width: 1200, height: 630, caption: $q.v + pg.feed.name, creditText: $q.w, creator: { '@id': ORIGIN + '/#org' }, copyrightNotice: $q.x, license: $t.k0, acquireLicensePage: ORIGIN + $q.y });
if (d) pg.lastmod = d;
return pg;
}
