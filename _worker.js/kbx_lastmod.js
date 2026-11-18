// True lastmod for kolaboro.com named project pages (batch 15, s15b).
// "Last modified" means the date of the last REAL change of the data a page shows, never the date we last checked it or the deploy date.
// For every project we fingerprint five parts of its data, with volatile dates (checked, seen, sealed, invited) and page-copy hashes
// (sha, fp: a re-read developer page whose text hash moved but whose extracted facts did not; copies are shown on /changes/) removed:
//   n = its entry in /data/named.json (names, facts, claims, sources)   c = its case in /data/bali-cases.json (checks, score, stage, history)
//   p = its dated promises in /data/promises.json                       f = its live findings in /data/findings-by-project.json
//   s = its monthly satellite series in /data/construction-progress.json
// /data/lastmod.json pins, per project and part, the fingerprint and the date it was first seen. A part whose fingerprint still matches
// keeps its pinned date; a part that changed since the last pin takes the "updated" date of the data file that now carries the change
// (the build that published it). Page lastmod = the latest of its parts and of the date it was added. The pin file is refreshed by
// tools/kolaboro-seo/lastmod.py (Kolaboro SEO workflow) from GET /api/seo/lastmod, which returns exactly this computation.
// Pure functions plus one loader; no imports, so the same code runs in the worker and in node (the first pins were seeded by replaying the git history of these files).
const ORIGIN = 'https://kolaboro.com';
const VOL = new Set(['checked', 'invited', 'seen', 'sealed']);
export const PARTS = ['n', 'c', 'p', 'f', 's'];

function canon(v, top) {   // stable JSON: sorted keys, volatile date keys dropped; at the top level also the page-copy hashes
  if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
  if (Array.isArray(v)) return '[' + v.map(x => canon(x)).join(',') + ']';
  const ks = Object.keys(v).filter(k => !VOL.has(k) && !(top && (k === 'sha' || k === 'fp')) && v[k] !== undefined).sort();
  return '{' + ks.map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
}
function fnv(s, seed) { let h = seed >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16).padStart(8, '0'); }
export const fingerprint = v => v == null ? '' : (s => fnv(s, 2166136261) + fnv(s, 3735928559))(canon(v, true));
export const isoDay = d => { const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(d || '')); return m ? m[1] : null; };

// files: { named, cases, prom, find, prog } (parsed JSON, any may be null); pin: parsed /data/lastmod.json or null
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
// n20p: the same date for ONE page, from files the caller has already parsed. A named page only needs its own project (a developer
// page: that developer's projects), so it no longer waits for 6.7 MB to be parsed again and 1,100 projects to be fingerprinted on
// a fresh isolate. q = { named, cases, caseBy, prom, find, prog, raw(x) } where raw(x) returns the entry exactly as published
// (kbx_named.js tidies display names in place). Returns null when a file is missing, and the caller falls back to trueLastmod().
const QIX = new WeakMap();
export function quickLastmod(q, pin, kind, key) {
  if (!q || !q.named || !q.cases || !q.caseBy || !q.prom || !q.find || !q.prog || !pin) return null;
  let ix = QIX.get(q.named);
  if (!ix) { ix = { slug: new Map(), dev: new Map() }; for (const x of q.named.projects || []) { if (!x || !x.id) continue; if (x.s) ix.slug.set(x.s, x); if (x.dvs) { if (!ix.dev.has(x.dvs)) ix.dev.set(x.dvs, []); ix.dev.get(x.dvs).push(x); } } QIX.set(q.named, ix); }
  const xs = kind === 'projects' ? [ix.slug.get(key)].filter(Boolean) : kind === 'developers' ? ix.dev.get(key) || [] : [];
  if (!xs.length) return null;
  const P = pin.p || {}, today = new Date().toISOString().slice(0, 10);
  const part = { n: null, c: id => q.caseBy.get(id), p: id => (q.prom.projects || {})[id], f: id => ((q.find.projects || {})[id] || {}).f, s: id => (q.prog.projects || {})[id] };
  const fileDay = { n: isoDay(q.named.updated), c: isoDay(q.cases.updated), p: isoDay(q.prom.updated), f: isoDay(q.find.updated), s: isoDay(q.prog.updated) };
  let best = null;
  for (const x of xs) { const d = one(q.raw ? q.raw(x) : x, P, part, fileDay, today).d; if (d && (!best || d > best)) best = d; }
  return best;
}
let PIN = null;
export async function pinFile(env) { if (PIN) return PIN; const v = await json(env, 'lastmod.json'); if (v) PIN = v; return v; }

// worker loader: reads the published files once per isolate and data version
let MEMO = null;
let NET = false;   // n20p: true when a file had to come over the network; only then does the result expire
async function json(env, name) {
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); if (r.ok) return await r.json(); } catch (e) {}
  NET = true;
  try { const r = await fetch(ORIGIN + '/data/' + name, { cf: { cacheTtl: 300, cacheEverything: true } }); if (r.ok) return await r.json(); } catch (e) {}
  return null;
}
export async function trueLastmod(env) {
  // the six files come from this deployment's own assets and cannot change while the isolate lives; fingerprinting 1,100 projects
  // again every 5 minutes cost several hundred ms of CPU on the first named page after each expiry (n20p)
  if (MEMO && (MEMO.a || Date.now() - MEMO.t < 300000)) return MEMO.v;
  if (BUSY) return BUSY;
  return BUSY = trueLastmod0(env).then(v => { BUSY = null; return v; }, e => { BUSY = null; throw e; });
}
let BUSY = null;
async function trueLastmod0(env) {
  NET = false;
  const [named, cases, prom, find, prog, pin] = await Promise.all(['named.json', 'bali-cases.json', 'promises.json', 'findings-by-project.json', 'construction-progress.json', 'lastmod.json'].map(n => json(env, n)));
  const r = compute({ named, cases, prom, find, prog }, pin);
  const dev = new Map(), slug = new Map();
  for (const x of (named && named.projects) || []) { const d = r.byId.get(x.id); if (x.s && d) slug.set(x.s, d); if (x.dvs && d && (!dev.has(x.dvs) || d > dev.get(x.dvs))) dev.set(x.dvs, d); }
  const v = { project: r.byId, slug, developer: dev, state: r.state, files: r.files, pinned: pin ? (pin.updated || null) : null, pinCount: pin && pin.p ? Object.keys(pin.p).length : 0 };
  MEMO = { t: Date.now(), v, a: !NET }; return v;
}
// GET /api/seo/lastmod: the computed state, in the format of /data/lastmod.json (the pin job publishes it as is)
export async function lastmodRoute(env) {
  const v = await trueLastmod(env);
  const body = { version: 'lastmod-1', updated: new Date().toISOString().slice(0, 16) + 'Z', method: 'Per project, five data parts are fingerprinted without volatile dates (named n, case c, promises p, findings f, satellite s). Each part keeps the date its current fingerprint was first seen; a page lastmod is the latest of its parts and its added date.', files: v.files, previous_pin: v.pinned, p: v.state };
  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
}

// Structured data for a rendered named page (called by kbx_named.js before the page is assembled and cached):
//  - WebPage/ProfilePage and Dataset dateModified = the true lastmod above (the visible "last checked" date is left as it is);
//  - an ImageObject for the page's 1200x630 share card (rendered by kbx_og.js from the same facts), linked as primaryImageOfPage.
export async function seoLd(pg, env, kind, key, q) {
  if (!pg || !pg.ld || !Array.isArray(pg.ld['@graph']) || !pg.feed || !pg.canon) return pg;
  let d = null;
  if (q && !(MEMO && MEMO.a)) { try { d = quickLastmod(q, await pinFile(env), kind, key); } catch (e) { d = null; } }   // n20p: one page's date without the full pass
  if (!d) { const T = await trueLastmod(env).catch(() => null); d = T && (kind === 'projects' ? T.slug.get(key) : kind === 'developers' ? T.developer.get(key) : null); }
  const G = pg.ld['@graph'], img = ORIGIN + '/og' + pg.feed.path.replace(/\/$/, '') + '.png', id = pg.canon + '#og';
  for (const n of G) {
    if (!n || typeof n !== 'object') continue;
    if (d && (n['@type'] === 'WebPage' || n['@type'] === 'ProfilePage' || n['@type'] === 'Dataset') && n.dateModified) n.dateModified = d;
    if ((n['@type'] === 'WebPage' || n['@type'] === 'ProfilePage') && !n.primaryImageOfPage) n.primaryImageOfPage = { '@id': id };
  }
  if (!G.some(n => n && n['@id'] === id)) G.push({ '@type': 'ImageObject', '@id': id, contentUrl: img, url: img, encodingFormat: 'image/png', width: 1200, height: 630, caption: 'Kolaboro facts card: ' + pg.feed.name, creditText: 'Kolaboro', creator: { '@id': ORIGIN + '/#org' }, copyrightNotice: 'Kolaboro, CC BY 4.0', license: 'https://creativecommons.org/licenses/by/4.0/', acquireLicensePage: ORIGIN + '/data-policy/' });
  if (d) pg.lastmod = d;
  return pg;
}
