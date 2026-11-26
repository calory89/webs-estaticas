// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_xray_ev__q, $s = TB.kbx_xray_ev__s, $t = TB.kbx_xray_ev__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { data as named } from './kbx_named.js';
import { ppmData, ppmLoad } from './kbx_named_plus.js';
import decodeJpeg from './kbx_xray_jpeg.js';
import { TB } from './kbx_strings.js';
export const PATHS = /^\/api\/xev(?:\/sat\.png)?$/;
export const EV_IDS = ['location', 'satellite', 'images', 'ppm', 'market', 'developer', 'law', 'similar'];
const ORIGIN = 'https://kolaboro.com';
const COI = new Set(['sumba']);
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const sha256 = async b => hex(await crypto.subtle.digest($q.a, typeof b === $q.b ? new TextEncoder().encode(b) : b));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const now = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { return ''; } };
const norm = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
const slugC = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const slugM = m => encodeURIComponent(String(m).toLowerCase().replace(/\s+/g, '-'));
const CALIAS = { 'United Arab Emirates': 'UAE', 'United States': 'USA', 'United States of America': 'USA', 'Puerto Rico (USA)': 'Puerto Rico', 'St Lucia': 'Saint Lucia', 'UK': 'United Kingdom' };
const ctry = c => CALIAS[c] || c;
const fmt = n => Math.round(n).toLocaleString('en-GB');
function km(a, b) { const R = 6371, r = Math.PI / 180, dl = (b.lat - a.lat) * r, dg = (b.lng - a.lng) * r, x = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dg / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); }
function withTimeout(p, ms, what) { let t; return Promise.race([p, new Promise((_, j) => { t = setTimeout(() => j(new Error((what || 'step') + $q.c + ms + ' ms')), ms); })]).finally(() => clearTimeout(t)); }
function publicUrl(u) {
let x; try { x = new URL(u); } catch (e) { return null; }
if (!/^https?:$/.test(x.protocol) || x.username || x.password) return null;
const h = x.hostname.toLowerCase();
if (!h.includes('.') || /^(localhost|.*\.local|.*\.internal|.*\.lan)$/.test(h)) return null;
if (/^\d+\.\d+\.\d+\.\d+$/.test(h) && /^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/.test(h)) return null;
if (h.startsWith('[')) return null;
if (/^[\d.]+$/.test(h) || /(^|\.)(nip|sslip|xip)\.io$/.test(h) || /(^|\.)localhost$/.test(h) || h === $q.d || h.endsWith($q.e) || (x.port && x.port !== '80' && x.port !== '443')) return null;
return x;
}
async function readMax(r, max) {
const cl = +r.headers.get($q.f); if (cl && cl > max) { try { r.body && r.body.cancel(); } catch (e) {} return null; }
if (!r.body) return new Uint8Array(await r.arrayBuffer());
const rd = r.body.getReader(), parts = []; let n = 0;
for (;;) { const { done, value } = await rd.read(); if (done) break; n += value.length; if (n > max) { try { rd.cancel(); } catch (e) {} return null; } parts.push(value); }
const out = new Uint8Array(n); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out;
}
async function inflate(bytes) { const s = new Blob([bytes]).stream().pipeThrough(new DecompressionStream($q.g)); return new Uint8Array(await new Response(s).arrayBuffer()); }
async function deflate(bytes) { const s = new Blob([bytes]).stream().pipeThrough(new CompressionStream($q.g)); return new Uint8Array(await new Response(s).arrayBuffer()); }
const MEMO = {};
async function file(env, path, ttl) {
  const m = MEMO[path]; if (m && Date.now() - m.t < (ttl || 600000)) return m.v;
  let r = null;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + $q.h + path)); } catch (e) { r = null; }
  if (!r || !r.ok) r = await fetch(ORIGIN + path, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!r.ok) throw new Error(path + ' ' + r.status);
  const v = await r.json(); MEMO[path] = { t: Date.now(), v }; return v;
}
const optFile = (env, p) => file(env, p).catch(() => null);
const OWN = p => ({ name: $q.i + p, url: ORIGIN + p, licence: $q.j });
function card(id, n) {
const t0 = Date.now(), contacted = new Set();
const c = { id, n, title: $t.o_TITLES[id], status: $q.k, summary: '', items: [], limits: [], paid: $t.o_PAID[id] || null, sources: [], proof: { ms: 0, bytes: 0, edge: true, contacted: [] }, data: {} };
c._src = (s, bytes) => { c.sources.push(s); if (bytes) c.proof.bytes += bytes; try { if (s.url) contacted.add(new URL(s.url).hostname); } catch (e) {} };
c._host = h => contacted.add(h);
c._done = () => { c.proof.ms = Date.now() - t0; c.proof.contacted = [...contacted]; delete c._src; delete c._host; delete c._done; return c; };
return c;
}
function htmlText(html) {
return String(html || '').replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, ' ')
.replace(/<\/(p|div|li|h[1-6]|tr|section|article|address|dd|dt|td|th)>|<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ')
.replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&#(\d+);/g, (m, d) => String.fromCharCode(+d))
.replace(/[ \t\f\r]+/g, ' ').replace(/ *\n[ \n]*/g, '\n').trim();
}
function jsonLd(html) {
const out = [];
for (const m of String(html || '').matchAll(/<script[^>]+type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) { try { out.push(JSON.parse(m[1].trim())); } catch (e) {} }
return out;
}
function walk(o, f, d = 0) { if (!o || typeof o !== $q.l || d > 8) return; f(o); for (const v of Array.isArray(o) ? o : Object.values(o)) walk(v, f, d + 1); }
const okLL = (lat, lng) => isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01);
const dec = s => (String(s).split('.')[1] || '').length;
function snippet(s, i, len) { const a = Math.max(0, i - 40); return String(s).slice(a, i + (len || 60) + 40).replace(/\s+/g, ' ').trim(); }
export function locateOnPage(html, base) {
const H = String(html || ''), coords = [], addrs = [], embeds = [];
const addC = (lat, lng, how, quote, url) => { lat = +lat; lng = +lng; if (okLL(lat, lng) && dec(lat) >= 3 && dec(lng) >= 3 && !coords.some(c => Math.abs(c.lat - lat) < 1e-5 && Math.abs(c.lng - lng) < 1e-5)) coords.push({ lat, lng, how, quote: String(quote).slice(0, 200), url: url || null }); };
const addA = (text, how, quote) => { text = String(text || '').replace(/\s+/g, ' ').replace(/^[\s,;:-]+|[\s,;:-]+$/g, '').slice(0, 160); if (text.length >= 6 && /[a-z]/i.test(text) && !addrs.some(a => a.text.toLowerCase() === text.toLowerCase())) addrs.push({ text, how, quote: String(quote || text).slice(0, 200) }); };
for (const j of jsonLd(H)) walk(j, o => {
if (o.geo && typeof o.geo === $q.l) addC(o.geo.latitude, o.geo.longitude, $q.m, JSON.stringify(o.geo).slice(0, 160));
if (o.latitude != null && o.longitude != null) addC(o.latitude, o.longitude, $q.m, $q.n + o.latitude + $q.o + o.longitude);
const a = o.address;
if (typeof a === $q.b) addA(a, $q.m);
else if (a && typeof a === $q.l && !Array.isArray(a)) addA([a.streetAddress, a.addressLocality, a.addressRegion, a.postalCode, typeof a.addressCountry === $q.b ? a.addressCountry : a.addressCountry && a.addressCountry.name].filter(Boolean).join(', '), $q.m, JSON.stringify(a).slice(0, 200));
});
let m;
const meta = n => { const r = new RegExp($q.p + n + $q.q + n + '["\']', 'i').exec(H); return r ? (r[1] || r[2]) : null; };
const la = meta($t.k0), lo = meta($t.k1);
if (la && lo) addC(la, lo, 'meta', $q.r + la + $q.s + lo);
const gp = meta($q.t) || meta('ICBM');
if (gp && (m = /(-?\d+\.\d+)\s*[;,]\s*(-?\d+\.\d+)/.exec(gp))) addC(m[1], m[2], 'meta', $q.u + gp);
const gpl = meta($q.v); if (gpl) addA(gpl, 'meta', $q.w + gpl);
for (const mm of H.matchAll(/(?:src|href|data-src)=["']([^"']*(?:google\.[a-z.]+\/maps|maps\.google\.|goo\.gl\/maps|maps\.app\.goo\.gl|openstreetmap\.org|maps\.apple\.com|waze\.com|bing\.com\/maps)[^"']*)["']/gi)) {
const u = mm[1].replace(/&amp;/g, '&'); let q;
embeds.push(u.slice(0, 300));
if ((q = /!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)/.exec(u))) addC(q[2], q[1], $q.x, u.slice(0, 200), u);
else if ((q = /@(-?\d+\.\d+),(-?\d+\.\d+),\d+(?:\.\d+)?[zm]/.exec(u))) addC(q[1], q[2], $q.x, u.slice(0, 200), u);
else if ((q = /[?&](?:q|ll|center|query|destination|daddr|sll|cp)=(-?\d+\.\d+)(?:,|%2C|~)\s*(-?\d+\.\d+)/i.exec(u))) addC(q[1], q[2], $q.x, u.slice(0, 200), u);
else if ((q = /[?&]mlat=(-?\d+\.\d+)&mlon=(-?\d+\.\d+)/.exec(u))) addC(q[1], q[2], $q.x, u.slice(0, 200), u);
else if ((q = /#map=\d+\/(-?\d+\.\d+)\/(-?\d+\.\d+)/.exec(u))) addC(q[1], q[2], $q.x, u.slice(0, 200), u);
else if ((q = /[?&](?:q|query|address|daddr)=([^&]{6,200})/.exec(u))) { let t; try { t = decodeURIComponent(q[1].replace(/\+/g, ' ')); } catch (e) { t = q[1]; } if (!/^-?\d/.test(t)) addA(t, $q.x, u.slice(0, 200)); }
else if ((q = /\/maps\/place\/([^/@?]{4,160})/.exec(u))) { let t; try { t = decodeURIComponent(q[1].replace(/\+/g, ' ')); } catch (e) { t = q[1]; } addA(t, $q.x, u.slice(0, 200)); }
}
for (const mm of H.matchAll(/data-(?:lat|latitude)=["'](-?\d+\.\d+)["'][^>]{0,200}?data-(?:lng|lon|long|longitude)=["'](-?\d+\.\d+)["']/gi)) addC(mm[1], mm[2], $q.y, mm[0].slice(0, 160));
for (const mm of H.matchAll(/\b(?:lat|latitude)["']?\s*[:=]\s*["']?(-?\d{1,2}\.\d{4,})["']?\s*,\s*["']?(?:lng|lon|long|longitude)["']?\s*[:=]\s*["']?(-?\d{1,3}\.\d{4,})/gi)) addC(mm[1], mm[2], $q.z, mm[0].slice(0, 160));
for (const mm of H.matchAll(/(?:LatLng|setView|marker)\(\s*\[?\s*(-?\d{1,2}\.\d{4,})\s*,\s*(-?\d{1,3}\.\d{4,})/g)) addC(mm[1], mm[2], $q.z, mm[0].slice(0, 160));
for (const mm of H.matchAll(/<address\b[^>]*>([\s\S]{6,600}?)<\/address>/gi)) addA(htmlText(mm[1]).replace(/\n/g, ', '), $q.A, htmlText(mm[1]).replace(/\n/g, ' '));
const T = htmlText(H);
for (const mm of T.matchAll(/(?:^|\n|\s)(address|location|located at|alamat|lokasi|direcci[oó]n|ubicaci[oó]n|adresse|standort|morada|localiza[cç][aã]o|endere[cç]o|adres|ligging|адрес|地址|العنوان)\s*[:：]\s*([^\n|•]{6,140})/gi)) addA(mm[2], 'label', mm[0].trim());
for (const mm of T.matchAll(/\b(Jl\.|Jalan|Soi|Calle|Avenida|Av\.|Rua|Carrer|Moo|Thanon|Sokak|Cad\.|Street|St\.|Road|Rd\.)\s+[A-Z0-9][^\n]{3,90}/g)) { const t = mm[0].split(/\s{2,}|[|•]/)[0]; if (/,/.test(t)) addA(t, $q.B, t); }
const rank = { json_ld: 0, meta: 1, map_embed: 1, address_tag: 2, label: 3, street_text: 4, page_data: 2, page_script: 3 };
coords.sort((a, b) => rank[a.how] - rank[b.how]); addrs.sort((a, b) => rank[a.how] - rank[b.how]);
return { coords: coords.slice(0, 5), addrs: addrs.slice(0, 6), embeds: embeds.slice(0, 5) };
}
let NOMI_LAST = 0;
async function nominatim(path, params, env, ctx, c) {
const qs = new URLSearchParams(Object.assign({ format: $q.C, addressdetails: '1', 'accept-language': 'en' }, params)).toString();
const url = $q.D + path + '?' + qs;
const key = new Request(ORIGIN + $q.E + (await sha256(url)).slice(0, 40));
const src = { name: $q.F + path + ')', url, licence: $t.k2, fetched: now() };
try { const hit = await caches.default.match(key); if (hit) { const b = new Uint8Array(await hit.arrayBuffer()); src.cache = 'hit'; src.bytes = b.length; src.sha256 = await sha256(b); c._src(src, 0); return JSON.parse(new TextDecoder().decode(b)); } } catch (e) {}
const wait = NOMI_LAST + 1100 - Date.now(); if (wait > 0) { if (wait > 2500) throw new Error($t.k3); await sleep(wait); }
NOMI_LAST = Date.now();
const r = await withTimeout(fetch(url, { headers: { 'user-agent': $t.UA, referer: ORIGIN + $q.G, accept: $q.H } }), 6000, $q.I);
const b = await readMax(r, 300000); if (!r.ok || !b) throw new Error($q.J + r.status);
src.cache = 'miss'; src.bytes = b.length; src.sha256 = await sha256(b); c._src(src, b.length);
if (ctx) ctx.waitUntil(caches.default.put(key, new Response(b, { headers: { 'content-type': $q.H, 'cache-control': $q.K } })).catch(() => {}));
return JSON.parse(new TextDecoder().decode(b));
}
const cleanAddr = t => String(t).replace(/\b(No\.?|Nomor|Nr\.?|#)\s*\d+[A-Za-z]?\b/gi, '').replace(/\b(Kec|Kab|Kel|Ds|Kota)\.\s*/g, '').replace(/\b\d{5}\b/g, '').replace(/\s*,\s*(,\s*)+/g, ', ').replace(/\s+/g, ' ').replace(/^[\s,]+|[\s,]+$/g, '');
function precisionOf(r) { const bb = (r.boundingbox || []).map(Number); if (bb.length !== 4 || bb.some(x => !isFinite(x))) return null; return Math.max(10, Math.round(km({ lat: bb[0], lng: bb[2] }, { lat: bb[1], lng: bb[3] }) * 500)); }
async function base(env) {
  const [N, sim, delay, ontime, imgs, law, lh, cover] = await Promise.all([named(env), optFile(env, $q.L), optFile(env, $q.M), optFile(env, $q.N),
    optFile(env, $q.O), optFile(env, $q.P), optFile(env, $q.Q), optFile(env, $q.R)]);
  const mp = (sim && sim.market_points && sim.market_points.markets) || {};
  const mToC = new Map(); for (const c of N.caseBy.values()) if (c.market && !mToC.has(c.market)) mToC.set(c.market, ctry(c.country));
  return { N, sim, mp, delay, ontime, imgs, law, lh, cover, mToC };
}
const isCoi = m => COI.has(String(m || '').toLowerCase());
function recognise(B, page, hint) {
if (hint && hint.project_id) { const x = B.N.byId.get(hint.project_id); if (x) return { x, how: 'hint' }; const c = B.N.caseBy.get(hint.project_id); if (c) return { x: null, coi: isCoi(c.market), c, how: 'hint' }; }
const u = page.final_url || page.url, h = hostOf(u); if (!h) return null;
const path = (() => { try { return new URL(u).pathname.replace(/\/+$/, ''); } catch (e) { return ''; } })();
const same = B.N.P.filter(x => x.url && hostOf(x.url) === h);
if (!same.length) return null;
const exact = same.find(x => { try { return new URL(x.url).pathname.replace(/\/+$/, '') === path; } catch (e) { return false; } });
if (exact) return { x: exact, how: 'url' };
return { x: null, dev: same, how: 'host' };
}
async function evLocation(S, env, ctx) {
const c = card($q.S, 11), B = S.B, L = locateOnPage(S.html, S.url);
c.data = { pin: null, candidates: [...L.coords.map(x => ({ text: x.lat + ', ' + x.lng, how: x.how })), ...L.addrs.map(a => ({ text: a.text, how: a.how }))], market: null, country: null, market_point: null, km_to_market: null, map_links: L.embeds.length };
if (S.html) c._src({ name: $q.T, url: S.url, fetched: S.fetched || null, bytes: S.html.length, sha256: S.page_sha || null }, 0);
for (const x of L.coords.slice(0, 3)) c.items.push({ label: $q.U + x.how.replace('_', ' ') + ')', value: x.lat.toFixed(5) + ', ' + x.lng.toFixed(5), quote: x.quote, url: x.url || S.url, kind: 'text' });
for (const a of L.addrs.slice(0, 3)) c.items.push({ label: $q.V + a.how.replace('_', ' ') + ')', value: a.text, quote: a.quote, url: S.url, kind: 'text' });
const R = S.rec && S.rec.x;
let pin = null, geo = null;
try {
if (L.coords.length) {
const x = L.coords[0];
pin = { lat: x.lat, lng: x.lng, how: x.how === $q.x ? $q.x : $q.W, precision_m: null, text: x.quote };
geo = await nominatim($q.X, { lat: x.lat.toFixed(6), lon: x.lng.toFixed(6), zoom: '14' }, env, ctx, c);
} else {
const mine = R && R.ar ? norm(R.ar).split(' ').filter(t => t.length >= 4) : [];
const pageA = L.addrs.slice(0, 3).map(a => ({ q: cleanAddr(a.text), from: 'page', office: mine.length > 0 && !mine.some(t => norm(a.text).includes(t)) }));
const qs = [...pageA.filter(a => !a.office).slice(0, 2)];
if (R && R.ar) qs.push({ q: [R.ar, R.mk !== R.ar ? R.mk : null, R.co].filter(Boolean).join(', '), from: $q.Y });
else if (S.hint.location_text) qs.push({ q: cleanAddr(S.hint.location_text), from: 'page' });
if (!R) qs.push(...pageA.filter(a => a.office));
for (const a of pageA.filter(x => x.office).slice(0, 1)) c.items.push({ label: 'Note', value: $q.Z + a.q + $t.k4 + R.ar + $t.k5, kind: 'text' });
const generic = new Set(['jalan', $q.aa, 'road', $q.ab, $q.ac, $q.ad, $q.ae, $q.af, 'city', 'kota', 'desa', $q.ag, ...norm([R && R.mk, R && R.co, S.hint.market, S.hint.country].filter(Boolean).join(' ')).split(' ')]);
let tries = 0;
for (const Q of qs) {
const q0 = Q.q;
if (tries >= 2) break;
const ctxTail = [R ? R.mk : S.hint.market, R ? R.co : S.hint.country].filter(v => v && !norm(q0).includes(norm(v))).join(', ');
const q = (q0 + (ctxTail ? ', ' + ctxTail : '')).slice(0, 200);
tries++;
const res = await nominatim($q.ah, { q, limit: '1' }, env, ctx, c);
const g = Array.isArray(res) && res[0];
const toks = norm(q0).split(' ').filter(t => t.length >= 4 && !generic.has(t) && !/^\d+$/.test(t)), dn = norm(g && g.display_name);
if (g && (!toks.length || toks.some(t => dn.includes(t)))) { geo = g; pin = { lat: +g.lat, lng: +g.lon, how: $q.ai, precision_m: Q.from === $q.Y ? null : precisionOf(g), text: q, from: Q.from }; break; }
if (g) c.items.push({ label: $q.aj, value: $q.ak + g.display_name + $q.al + q0 + $q.am, kind: 'text' });
const parts = q0.split(',').map(t => t.trim()).filter(Boolean);
if (parts.length > 2 && tries < 2) qs.splice(qs.indexOf(Q) + 1, 0, { q: parts.slice(1).join(', '), from: Q.from });
}
}
} catch (e) { c.items.push({ label: $q.aj, value: String(e.message || e), kind: 'warn' }); }
const ad = (geo && geo.address) || {};
const country = ctry(ad.country || (R && R.co) || S.hint.country || '') || null;
let market = (R && R.mk) || (S.rec && S.rec.c && S.rec.c.market) || S.hint.market || null, mpt = null;
if (!market && pin) {
let best = null;
for (const [name, p] of Object.entries(B.mp)) { const d = km(pin, p); const mc = B.mToC.get(name); if ((!country || !mc || mc === country) && d <= 80 && (!best || d < best.d)) best = { name, p, d }; }
if (best) market = best.name;
}
if (market && B.mp[market]) mpt = B.mp[market];
const coi = isCoi(market);
if (coi) { const nm = it => !/sumba/i.test(String(it.value || it.text || '') + ' ' + String(it.quote || '')); c.items = c.items.filter(nm); c.data.candidates = c.data.candidates.filter(nm); }
S.market = coi ? null : market; S.coi = coi; S.country = country || (market && B.mToC.get(market)) || null; S.pin = pin; S.place = geo && !coi ? geo.display_name : null;
c.data.pin = pin; c.data.country = S.country; c.data.market = coi ? null : market;
if (geo && !coi) c.items.push({ label: pin && pin.how === $q.ai ? (pin.from === $q.Y ? $t.k6 : $q.an) : $t.k7, value: geo.display_name, quote: null, url: $q.ao + (geo.osm_type || 'node') + '/' + geo.osm_id, kind: 'link' });
if (pin) {
c.items.push({ label: 'Pin', value: pin.lat.toFixed(5) + ', ' + pin.lng.toFixed(5) + (pin.precision_m ? $q.ap + fmt(pin.precision_m) + $q.aq + (geo.addresstype || geo.type || 'place') + $q.ar : pin.how === $q.ai ? (pin.from === $q.Y ? $q.as : '') : $q.at), url: $q.au + pin.lat.toFixed(5) + $q.av + pin.lng.toFixed(5) + $q.aw + pin.lat.toFixed(5) + '/' + pin.lng.toFixed(5), kind: 'link' });
if (pin.from === $q.Y) c.items.push({ label: 'Note', value: $t.k8 + R.ar + $q.ax, kind: 'warn' });
}
if (coi) c.items.push({ label: $q.ay, value: $s.k0, url: ORIGIN + $q.az, kind: 'warn' });
else if (market) c.items.push({ label: $q.ay, value: market + (S.country ? ', ' + S.country : ''), url: ORIGIN + '/m/' + slugM(market) + '/', kind: 'link' });
if (pin && mpt && !coi) {
const d = km(pin, mpt); c.data.market_point = mpt; c.data.km_to_market = Math.round(d * 10) / 10;
c.items.push({ label: $t.k9, value: (d < 10 ? d.toFixed(1) : fmt(d)) + $q.aA + (mpt.place || market) + ' (' + mpt.src + ')', url: ORIGIN + '/map/', kind: 'num' });
if (d > 150) c.items.push({ label: 'Check', value: $q.aB + market + $t.k10, kind: 'warn' });
c._src({ name: $t.k11, url: ORIGIN + $q.L, licence: $t.k12 }, 0);
}
c.status = pin ? 'found' : (L.addrs.length || L.coords.length) ? $q.k : $q.aC;
c.summary = pin ? (pin.how === $q.ai ? (pin.from === $q.Y ? (L.addrs.length ? $t.k13 : $t.k14) : $t.k15) : $q.aD + (pin.how === $q.x ? $q.aE : $q.aF) + ').') + (market && !coi ? $q.aG + market + '.' : '')
: L.addrs.length ? $t.k16 : $t.k17;
c.limits = [$s.k1, $t.k18];
return c._done();
}
function toUTM(lat, lng, zone, south) {
const a = 6378137, f = 1 / 298.257223563, k0 = 0.9996, e2 = f * (2 - f), ep2 = e2 / (1 - e2), r = Math.PI / 180;
const phi = lat * r, lam = lng * r, lam0 = ((zone - 1) * 6 - 180 + 3) * r, s = Math.sin(phi), co = Math.cos(phi), t = Math.tan(phi);
const N = a / Math.sqrt(1 - e2 * s * s), T = t * t, C = ep2 * co * co, A = co * (lam - lam0);
const M = a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256) * phi - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * phi) + (15 * e2 * e2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * phi) - (35 * e2 ** 3 / 3072) * Math.sin(6 * phi));
const E = k0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5 / 120) + 500000;
let Y = k0 * (M + N * t * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A ** 4 / 24 + (61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6 / 720));
if (south) Y += 10000000;
return [E, Y];
}
async function getJ(url, opt, ms, what, c) {
const r = await withTimeout(fetch(url, opt), ms, what); const b = await readMax(r, 4000000);
if (!r.ok || !b) throw new Error(what + $q.aH + r.status);
if (c) c._src({ name: what, url: url.split('?')[0], fetched: now(), bytes: b.length, sha256: await sha256(b) }, b.length);
return JSON.parse(new TextDecoder().decode(b));
}
const COG = new Map();
async function cogHead(href, stat) {
if (COG.has(href)) return COG.get(href);
const rr = async (a, b) => { const r = await withTimeout(fetch(href, { headers: { range: $q.aI + a + '-' + b } }), 6000, $q.aJ); const u = new Uint8Array(await r.arrayBuffer()); stat.bytes += u.length; if (r.status !== 206 && r.status !== 200) throw new Error($q.aK + r.status); return u; };
let buf = await rr(0, 32767);
const dv = () => new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
let v = dv(); const le = v.getUint16(0) === 0x4949; if (v.getUint16(2, le) !== 42) throw new Error($q.aL);
const off = v.getUint32(4, le), n = v.getUint16(off, le), tags = {};
const SZ = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8, 16: 8 };
const need = [];
for (let i = 0; i < n; i++) { const e = off + 2 + 12 * i, tag = v.getUint16(e, le), typ = v.getUint16(e + 2, le), cnt = v.getUint32(e + 4, le), sz = (SZ[typ] || 1) * cnt; tags[tag] = { typ, cnt, at: sz <= 4 ? e + 8 : v.getUint32(e + 8, le), sz }; if (tags[tag].at + sz > buf.length) need.push(tags[tag]); }
if (need.length) { const end = Math.max(...need.map(t => t.at + t.sz)); if (end > 2000000) throw new Error($q.aM); buf = await rr(0, end); v = dv(); }
const arr = t => { const o = []; for (let i = 0; i < t.cnt; i++) o.push(t.typ === 3 ? v.getUint16(t.at + 2 * i, le) : t.typ === 4 ? v.getUint32(t.at + 4 * i, le) : t.typ === 16 ? Number(v.getBigUint64(t.at + 8 * i, le)) : v.getUint8(t.at + i)); return o; };
const one = id => tags[id] ? arr(tags[id])[0] : null;
const h = { W: one(256), H: one(257), comp: one(259), spp: one(277) || 1, pred: one(317) || 1, tw: one(322), th: one(323), offs: tags[324] ? arr(tags[324]) : null, cnts: tags[325] ? arr(tags[325]) : null, planar: one(284) || 1 };
if (!h.tw || !h.offs || h.comp !== 8 || h.planar !== 1) throw new Error($t.k19 + h.comp + ')');
if (COG.size > 40) COG.clear(); COG.set(href, h); return h;
}
async function cogWindow(href, x0, y0, w, h, stat) {
const H = await cogHead(href, stat), spp = H.spp, out = new Uint8Array(w * h * spp);
const tx0 = Math.floor(Math.max(0, x0) / H.tw), tx1 = Math.floor(Math.min(H.W - 1, x0 + w - 1) / H.tw), ty0 = Math.floor(Math.max(0, y0) / H.th), ty1 = Math.floor(Math.min(H.H - 1, y0 + h - 1) / H.th);
const across = Math.ceil(H.W / H.tw), jobs = [];
for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) jobs.push([tx, ty]);
if (jobs.length > 4) throw new Error($q.aN);
await Promise.all(jobs.map(async ([tx, ty]) => {
const i = ty * across + tx, o = H.offs[i], n = H.cnts[i]; if (!n) return;
const r = await withTimeout(fetch(href, { headers: { range: $q.aI + o + '-' + (o + n - 1) } }), 8000, $q.aO);
if (r.status !== 206) throw new Error($q.aP + r.status);
const z = new Uint8Array(await r.arrayBuffer()); stat.bytes += z.length; stat.tiles++;
const px = await inflate(z), row = H.tw * spp;
if (H.pred === 2) for (let y = 0; y < H.th; y++) { const b = y * row; for (let k = spp; k < row; k++) px[b + k] = (px[b + k] + px[b + k - spp]) & 255; }
const gx = tx * H.tw, gy = ty * H.th;
for (let y = Math.max(y0, gy); y < Math.min(y0 + h, gy + H.th, H.H); y++) {
const xa = Math.max(x0, gx), xb = Math.min(x0 + w, gx + H.tw, H.W); if (xb <= xa) continue;
out.set(px.subarray(((y - gy) * H.tw + (xa - gx)) * spp, ((y - gy) * H.tw + (xb - gx)) * spp), ((y - y0) * w + (xa - x0)) * spp);
}
}));
return out;
}
function epsgOf(it) { const p = it.properties || {}; const e = p[$q.aQ] || +(String(p[$q.aR] || '').split(':')[1]); return e && /^32[67]\d\d$/.test(String(e)) ? +e : null; }
function pixelOf(asset, it, lat, lng) {
const e = epsgOf(it); if (!e) return null;
const [E, Y] = toUTM(lat, lng, e % 100, Math.floor(e / 100) === 327), t = asset[$q.aS];
if (!t) return null; return [(E - t[2]) / t[0], (Y - t[5]) / t[4]];
}
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
async function encodePng(rgb, w, h, year) {
const raw = new Uint8Array((w * 3 + 1) * h); for (let y = 0; y < h; y++) raw.set(rgb.subarray(y * w * 3, (y + 1) * w * 3), y * (w * 3 + 1) + 1);
const z = await deflate(raw);
const chunk = (type, data) => { const o = new Uint8Array(12 + data.length), v = new DataView(o.buffer); v.setUint32(0, data.length); o.set(new TextEncoder().encode(type), 4); o.set(data, 8); v.setUint32(8 + data.length, crc32(o.subarray(4, 8 + data.length))); return o; };
const ih = new Uint8Array(13), iv = new DataView(ih.buffer); iv.setUint32(0, w); iv.setUint32(4, h); ih[8] = 8; ih[9] = 2;
const txt = new TextEncoder().encode($t.k20 + (year || new Date().getUTCFullYear()) + $q.aT);
const parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('tEXt', txt), chunk('IDAT', z), chunk('IEND', new Uint8Array(0))];
const out = new Uint8Array(parts.reduce((a, p) => a + p.length, 0)); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out;
}
export { cogWindow as satCogWindow, pixelOf as satPixelOf, encodePng as satEncodePng };
const SAT_PX = 256;
async function satPick(lat, lng, stat, c) {
const body = { collections: [$q.aU], intersects: { type: 'Point', coordinates: [lng, lat] }, query: { 'eo:cloud_cover': { lt: 70 } }, sortby: [{ field: $q.aV, direction: 'desc' }], limit: 30,
fields: { include: ['id', $q.aV, $q.aW, $q.aX, $q.aY, $q.aZ, $q.ba, $q.bb, $q.bc, $q.bd, $q.be] } };
const j = await getJ($t.STAC + $q.bf, { method: 'POST', headers: { 'content-type': $q.H, 'user-agent': $t.UA }, body: JSON.stringify(body) }, 7000, $t.k21, c);
const feats = (j.features || []).filter(f => f.assets && f.assets.visual && f.assets.scl);
const tried = [], t0 = Date.now();
const look = async f => {
    const p = pixelOf(f.assets.scl, f, lat, lng); if (!p) return null;
    const w = SAT_PX / 2, s = await cogWindow(f.assets.scl.href, Math.round(p[0] - w / 2), Math.round(p[1] - w / 2), w, w, stat);
    let cloud = 0, nod = 0, cc = 0, cn = 0; const lo = w / 2 - 16, hi = w / 2 + 16;   // centre: 32 x 32 px of 20 m = 640 m around the pin
    for (let i = 0; i < s.length; i++) { const v = s[i], bad = v === 3 || v === 8 || v === 9 || v === 10, x = i % w, y = (i / w) | 0; if (v === 0) nod++; else if (bad) cloud++; if (x >= lo && x < hi && y >= lo && y < hi) { cn++; if (bad || v === 0) cc++; } }
    return { f, id: f.id, date: f.properties.datetime.slice(0, 10), scene_cloud_pct: Math.round(f.properties[$q.bg] * 10) / 10, local_cloud_pct: Math.round(cloud / s.length * 1000) / 10, centre_cloud_pct: Math.round(cc / cn * 1000) / 10, nodata_pct: Math.round(nod / s.length * 1000) / 10 };
  };
for (let i = 0; i < feats.length && i < 24 && Date.now() - t0 < 9000; i += 4) {
const got = (await Promise.all(feats.slice(i, i + 4).map(f => look(f).catch(() => null)))).filter(Boolean);
tried.push(...got);
const ok = got.find(t => t.local_cloud_pct <= 5 && t.centre_cloud_pct <= 1 && t.nodata_pct <= 1);
if (ok) return { f: ok.f, pick: ok, tried: tried.map(({ f, ...t }) => t) };
}
const best = tried.filter(t => t.nodata_pct <= 1 && t.centre_cloud_pct <= 1 && t.local_cloud_pct <= 25).sort((a, b) => a.local_cloud_pct - b.local_cloud_pct)[0];
return { f: best ? best.f : null, pick: best || null, partly: !!best, tried: tried.map(({ f, ...t }) => t) };
}
async function satRender(f, lat, lng, stat) {
const p = pixelOf(f.assets.visual, f, lat, lng); if (!p) throw new Error($q.bh);
const x0 = Math.round(p[0] - SAT_PX / 2), y0 = Math.round(p[1] - SAT_PX / 2);
const rgb = await cogWindow(f.assets.visual.href, x0, y0, SAT_PX, SAT_PX, stat);
const put = (x, y, r, g, b) => { if (x < 0 || y < 0 || x >= SAT_PX || y >= SAT_PX) return; const i = (y * SAT_PX + x) * 3; rgb[i] = r; rgb[i + 1] = g; rgb[i + 2] = b; };
const cx = SAT_PX / 2, cy = SAT_PX / 2;
for (let a = 0; a < 360; a += 2) { const t = a * Math.PI / 180; for (const rr of [7, 8]) put(Math.round(cx + rr * Math.cos(t)), Math.round(cy + rr * Math.sin(t)), 255, 91, 20); }
for (let x = 10; x <= 110; x++) for (let y = SAT_PX - 14; y <= SAT_PX - 11; y++) put(x, y, 255, 255, 255);
for (const x of [10, 110]) for (let y = SAT_PX - 20; y <= SAT_PX - 11; y++) put(x, y, 255, 255, 255);
return encodePng(rgb, SAT_PX, SAT_PX, String((f.properties || {}).datetime || '').slice(0, 4));
}
const satKey = (id, lat, lng) => ORIGIN + $q.bi + encodeURIComponent(id) + '&lat=' + lat.toFixed(5) + '&lng=' + lng.toFixed(5);
const satCredit = y => $t.k22 + y + $s.k2;
async function evSatellite(S, env, ctx) {
const c = card($q.bj, 12), pin = S.pin;
c.limits = [$s.k3, $t.k23, $s.k4];
if (!pin) { c.status = $q.bk; c.summary = $t.k24; return c._done(); }
if (S.coi) { c.status = $q.bk; c.summary = $t.k25; return c._done(); }
const skey = new Request(ORIGIN + $q.bl + pin.lat.toFixed(4) + ',' + pin.lng.toFixed(4));
try { const hit = await caches.default.match(skey); if (hit) { const o = await hit.json(); Object.assign(c, o, { proof: c.proof }); c.sources = (o.sources || []).map(x => Object.assign({}, x, { cache: 'hit' })); c.summary = o.summary; return c._done(); } } catch (e) {}
const stat = { bytes: 0, tiles: 0 }; c._host($t.k26);
const { f, tried, pick, partly } = await satPick(pin.lat, pin.lng, stat, c);
c.data = { lat: pin.lat, lng: pin.lng, tried, scene: null, png: null, px_m: 10, box_km: SAT_PX * 10 / 1000 };
if (!f) { c.status = $q.k; c.summary = $t.k27 + tried.length + $t.k28; c.items = tried.slice(0, 6).map(t => ({ label: $q.bm + t.date, value: t.centre_cloud_pct + $q.bn, kind: 'text' })); c.proof.bytes += stat.bytes; return c._done(); }
const png = await satRender(f, pin.lat, pin.lng, stat);
const key = satKey(f.id, pin.lat, pin.lng), digest = await sha256(png);
if (ctx) ctx.waitUntil(caches.default.put(new Request(key), new Response(png, { headers: { 'content-type': $q.bo, 'cache-control': $q.K, 'x-sha256': digest } })).catch(() => {}));
const p = f.properties, date = p.datetime.slice(0, 10), days = Math.round((Date.now() - Date.parse(p.datetime)) / 86400000);
const sceneUrl = $t.STAC + $q.bp + f.id;
c.data.scene = { id: f.id, date, cloud_pct: Math.round(p[$q.bg] * 10) / 10, local_cloud_pct: pick.local_cloud_pct, centre_cloud_pct: pick.centre_cloud_pct, partly_cloudy: !!partly, mgrs: p[$q.bq] || [p[$q.br], p[$q.bs], p[$q.bt]].filter(Boolean).join(''), stac: sceneUrl, tci: f.assets.visual.href };
c.data.png = key.replace(ORIGIN, ''); c.data.png_sha256 = digest;
c.img = { src: c.data.png, alt: $q.bu + (SAT_PX * 10 / 1000) + $q.bv + date, w: SAT_PX, h: SAT_PX, credit: satCredit(date.slice(0, 4)), scale: $q.bw };
c._src({ name: $s.k5, url: f.assets.visual.href, licence: $s.k6 + date.slice(0, 4) + '"', fetched: now(), bytes: stat.bytes, sha256: digest, note: stat.tiles + $t.k29 }, stat.bytes);
c.status = 'found';
c.summary = (partly ? $q.bx : 'Clear') + $q.by + date + ' (' + (days <= 0 ? 'today' : days === 1 ? $q.bz : days + $q.bA) + '), ' + pick.centre_cloud_pct + $q.bn + (partly ? ', ' + pick.local_cloud_pct + $q.bB : '') + '.';
c.items = [
{ label: $q.bC, value: date + ' (' + (days <= 0 ? 'today' : days === 1 ? $q.bz : days + $q.bA) + $q.bD + c.data.scene.mgrs, url: sceneUrl, kind: 'link' },
{ label: $q.bE, value: pick.centre_cloud_pct + $q.bF + c.data.scene.local_cloud_pct + $t.k30 + c.data.scene.cloud_pct + $q.bG, kind: 'num' },
{ label: $q.bH, value: $s.k7, kind: 'text' },
{ label: $q.bI, value: $s.k8, kind: 'text' },
];
const newer = tried.filter(t => t.date > date || (t.date === date && t.id !== f.id && t.centre_cloud_pct > pick.centre_cloud_pct));
if (newer.length) c.items.push({ label: $q.bJ, value: newer.slice(0, 5).map(t => t.date + ' (' + t.centre_cloud_pct + $q.bK + t.local_cloud_pct + $q.bL).join('; ') + (newer.length > 5 ? '; ...' : ''), kind: 'text' });
if (ctx) { const keep = { status: c.status, summary: c.summary, items: c.items, img: c.img, limits: c.limits, sources: c.sources, data: c.data }; ctx.waitUntil(caches.default.put(skey, new Response(JSON.stringify(keep), { headers: { 'content-type': $q.H, 'cache-control': $q.bM } })).catch(() => {})); }
return c._done();
}
async function satRoute(u, env, ctx) {
const id = u.searchParams.get('s') || '', lat = +u.searchParams.get('lat'), lng = +u.searchParams.get('lng');
if (!/^S2[ABC]_[0-9A-Z]{5}_\d{8}_\d+_L2A$/.test(id) || !okLL(lat, lng)) return new Response($q.bN, { status: 400 });
const key = new Request(satKey(id, lat, lng));
const hit = await caches.default.match(key); if (hit) return new Response(hit.body, { headers: { 'content-type': $q.bo, 'cache-control': $q.bO, 'x-xev-cache': 'hit', 'x-sha256': hit.headers.get($q.bP) || '' } });
const zone = id.slice(4, 6), band = id.slice(6, 7), sq = id.slice(7, 9);
const it = await getJ($t.STAC + $q.bp + id, { headers: { 'user-agent': $t.UA } }, 7000, $q.bQ, null);
if (!it || !it.assets || !it.assets.visual || (zone + band + sq) !== String((it.properties || {})[$q.bq] || zone + band + sq)) return new Response($q.bR, { status: 404 });
const p = pixelOf(it.assets.visual, it, lat, lng); if (!p || p[0] < 0 || p[1] < 0 || p[0] > 10980 || p[1] > 10980) return new Response($q.bS, { status: 404 });
const png = await satRender(it, lat, lng, { bytes: 0, tiles: 0 }), digest = await sha256(png);
const res = new Response(png, { headers: { 'content-type': $q.bo, 'cache-control': $q.K, 'x-sha256': digest } });
ctx.waitUntil(caches.default.put(key, res.clone()).catch(() => {}));
const h = new Headers(res.headers); h.set($q.bT, 'miss'); h.set($q.bU, $q.bO);
return new Response(res.body, { headers: h });
}
const STOCK = [[/(^|\.)unsplash\.com$/, 'Unsplash'], [/(^|\.)pexels\.com$/, 'Pexels'], [/(^|\.)shutterstock\.com$/, 'Shutterstock'], [/(^|\.)istockphoto\.com$/, 'iStock'], [/(^|\.)gettyimages\.[a-z.]+$/, 'Getty Images'],
[/(^|\.)(stock\.adobe\.com|ftcdn\.net)$/, 'Adobe Stock'], [/(^|\.)depositphotos\.com$/, 'Depositphotos'], [/(^|\.)dreamstime\.com$/, 'Dreamstime'], [/(^|\.)123rf\.com$/, '123RF'], [/(^|\.)freepik\.com$/, 'Freepik'],
[/(^|\.)pixabay\.com$/, 'Pixabay'], [/(^|\.)alamy\.com$/, 'Alamy'], [/(^|\.)stocksy\.com$/, 'Stocksy'], [/(^|\.)canva\.com$/, 'Canva'], [/(^|\.)envato(usercontent)?\.com$/, 'Envato'], [/(^|\.)bigstockphoto\.com$/, 'Bigstock']];
const stockOf = u => { const h = hostOf(u); const s = STOCK.find(([re]) => re.test(h)); return s ? s[1] : null; };
const SKIP_IMG = /\.(svg|gif|ico)(\?|$)|(^|[\/_.-])(logo|logos|icon|icons|favicon|sprite|avatar|flag|flags|placeholder|pixel|badge|loader|spinner|payment|whatsapp|facebook|instagram|twitter|linkedin|youtube|tiktok)([\/_.-]|$)|facebook\.com\/tr|google-analytics|doubleclick|gravatar/i;
export function pageImages(html, base) {
const H = String(html || ''), out = [], seen = new Set();
const add = (u, how) => { if (!u) return; u = u.trim().replace(/&amp;/g, '&'); if (/^data:|^blob:/i.test(u)) return; let a; try { a = new URL(u, base).toString(); } catch (e) { return; } if (!/^https?:/.test(a) || SKIP_IMG.test(a) || seen.has(a)) return; seen.add(a); out.push({ url: a, how }); };
const pickSet = s => { let best = null; for (const part of String(s).split(/,\s+(?=\S)/)) { const [u, d] = part.trim().split(/\s+/); const mw = /^(\d+)w$/.exec(d || ''), mx = /^(\d+(?:\.\d+)?)x$/.exec(d || ''), w = mw ? +mw[1] : mx ? +mx[1] * 1000 : 1000; if (!best || (Math.abs(w - 1200) < Math.abs(best.w - 1200))) best = { u, w }; } return best && best.u; };
const og = /<meta[^>]+property=["']og:image(?::url)?["'][^>]*content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i.exec(H); if (og) add(og[1] || og[2], $q.bV);
for (const m of H.matchAll(/<(?:img|source)\b[^>]*>/gi)) {
const t = m[0], at = n => { const r = new RegExp('\\s' + n + $q.bW, 'i').exec(t); return r ? r[1] : null; };
const ww = +(at('width') || 0), hh = +(at($q.bX) || 0); if ((ww && ww < 200) || (hh && hh < 150)) continue;
const set = at($q.bY) || at($q.bZ) || at($q.ca);
add(set ? pickSet(set) : (at($q.cb) || at($q.cc) || at($q.cd) || at('src')), 'img');
}
for (const m of H.matchAll(/background(?:-image)?\s*:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) add(m[1], 'css');
return out;
}
async function decodePng(b) {
const v = new DataView(b.buffer, b.byteOffset, b.byteLength); let o = 8, W = 0, H = 0, bd = 0, ct = 0, il = 0, pal = null, trns = null; const idat = [];
while (o + 8 <= b.length) { const n = v.getUint32(o), t = String.fromCharCode(b[o + 4], b[o + 5], b[o + 6], b[o + 7]), d = b.subarray(o + 8, o + 8 + n);
if (t === 'IHDR') { W = v.getUint32(o + 8); H = v.getUint32(o + 12); bd = b[o + 16]; ct = b[o + 17]; il = b[o + 20]; } else if (t === 'PLTE') pal = d; else if (t === 'tRNS') trns = d; else if (t === 'IDAT') idat.push(d); else if (t === 'IEND') break; o += 12 + n; }
if (bd !== 8 || il !== 0 || ![0, 2, 3, 4, 6].includes(ct)) throw new Error($q.ce + bd + $q.cf + il + ')');
if (W * H > 12e6) throw new Error($q.cg);
const z = new Uint8Array(idat.reduce((a, d) => a + d.length, 0)); let p = 0; for (const d of idat) { z.set(d, p); p += d.length; }
const raw = await inflate(z), bpp = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ct], st = W * bpp, px = new Uint8Array(st * H);
for (let y = 0; y < H; y++) { const f = raw[y * (st + 1)], s = y * (st + 1) + 1, d = y * st;
for (let x = 0; x < st; x++) { const a = x >= bpp ? px[d + x - bpp] : 0, up = y ? px[d - st + x] : 0, c = (x >= bpp && y) ? px[d - st + x - bpp] : 0, r = raw[s + x];
px[d + x] = (f === 0 ? r : f === 1 ? r + a : f === 2 ? r + up : f === 3 ? r + ((a + up) >> 1) : (() => { const pp = a + up - c, pa = Math.abs(pp - a), pb = Math.abs(pp - up), pc = Math.abs(pp - c); return r + (pa <= pb && pa <= pc ? a : pb <= pc ? up : c); })()) & 255; } }
const out = new Uint8Array(W * H * 4);
for (let i = 0, j = 0; i < W * H; i++, j += 4) {
if (ct === 6) { out[j] = px[i * 4]; out[j + 1] = px[i * 4 + 1]; out[j + 2] = px[i * 4 + 2]; out[j + 3] = px[i * 4 + 3]; }
else if (ct === 2) { out[j] = px[i * 3]; out[j + 1] = px[i * 3 + 1]; out[j + 2] = px[i * 3 + 2]; out[j + 3] = 255; }
else if (ct === 0) { out[j] = out[j + 1] = out[j + 2] = px[i]; out[j + 3] = 255; }
else if (ct === 4) { out[j] = out[j + 1] = out[j + 2] = px[i * 2]; out[j + 3] = px[i * 2 + 1]; }
else { const k = px[i]; out[j] = pal ? pal[k * 3] : 0; out[j + 1] = pal ? pal[k * 3 + 1] : 0; out[j + 2] = pal ? pal[k * 3 + 2] : 0; out[j + 3] = trns && k < trns.length ? trns[k] : 255; }
}
return { width: W, height: H, data: out };
}
function kdhGrid(img, x0, x1, y0, y1) {
const W = img.width, d = img.data, xs = [], ys = [], m = [];
for (let i = 0; i <= 9; i++) xs.push(x0 + Math.floor(i * (x1 - x0) / 9)); for (let j = 0; j <= 8; j++) ys.push(y0 + Math.floor(j * (y1 - y0) / 8));
const col = new Int8Array(x1 - x0); for (let c = 0, x = 0; x < x1 - x0; x++) { while (x0 + x >= xs[c + 1]) c++; col[x] = c; }
for (let r = 0; r < 8; r++) { const s = [0, 0, 0, 0, 0, 0, 0, 0, 0];
for (let y = ys[r]; y < ys[r + 1]; y++) { let i = (y * W + x0) * 4; for (let x = 0; x < x1 - x0; x++, i += 4) { const a = d[i + 3]; s[col[x]] += (299 * d[i] + 587 * d[i + 1] + 114 * d[i + 2]) * a + 255000 * (255 - a); } }
const row = []; for (let k = 0; k < 9; k++) { const n = (xs[k + 1] - xs[k]) * (ys[r + 1] - ys[r]); row.push(n ? s[k] / n : 0); } m.push(row); }
return m;
}
function kdhBits(m, mirror) { let s = ''; const b = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const L = mirror ? m[r][8 - c] : m[r][c], R = mirror ? m[r][7 - c] : m[r][c + 1]; b.push(L < R ? 1 : 0); } for (let i = 0; i < 64; i += 4) s += ((b[i] << 3) | (b[i + 1] << 2) | (b[i + 2] << 1) | b[i + 3]).toString(16); return s; }
export function kdh1(img) {
const W = img.width, H = img.height; if (W < 9 || H < 8) return null;
const mh = kdhGrid(img, 0, W, 0, H), cx = Math.floor(W * 15 / 100), cy = Math.floor(H * 15 / 100);
const c = (W - 2 * cx >= 9 && H - 2 * cy >= 8) ? kdhBits(kdhGrid(img, cx, W - cx, cy, H - cy)) : kdhBits(mh);
return { h: kdhBits(mh), c, f: kdhBits(mh, true) };
}
const POP = new Uint8Array(256); for (let i = 0; i < 256; i++) POP[i] = (i & 1) + POP[i >> 1];
const pop32 = x => POP[x & 255] + POP[(x >>> 8) & 255] + POP[(x >>> 16) & 255] + POP[x >>> 24];
const split = h => [parseInt(h.slice(0, 8), 16) | 0, parseInt(h.slice(8), 16) | 0];
const dist = (a, b) => pop32(a[0] ^ b[0]) + pop32(a[1] ^ b[1]);
let IMX = null;
function imgIndex(idx) {
if (IMX && IMX.src === idx) return IMX;
const it = (idx && idx.items) || [], F = new Int32Array(it.length * 2), C = new Int32Array(it.length * 2);
it.forEach((x, i) => { const a = split(x[2]), b = x[3] ? split(x[3]) : a; F[2 * i] = a[0]; F[2 * i + 1] = a[1]; C[2 * i] = b[0]; C[2 * i + 1] = b[1]; });
IMX = { src: idx, F, C, ids: it.map(x => x[0]) }; return IMX;
}
async function fetchImage(u, referer) {
if (!publicUrl(u)) throw new Error($q.ch);
const r = await withTimeout(fetch(u, { headers: { accept: $t.k31, 'user-agent': $t.BUA, referer } }), 5000, 'image');
if (r.url && r.url !== u && !publicUrl(r.url)) { try { r.body && r.body.cancel(); } catch (e) {} throw new Error($q.ch); }
if (!r.ok) { try { r.body && r.body.cancel(); } catch (e) {} throw new Error('HTTP ' + r.status); }
const b = await readMax(r, 3000000); if (!b) throw new Error($q.ci);
return b;
}
async function evImages(S, env, ctx) {
const c = card($q.cj, 13), B = S.B;
const list = pageImages(S.html, S.url);
const stock = list.map((x, i) => ({ img: i + 1, url: x.url, host: hostOf(x.url), source: stockOf(x.url) })).filter(x => x.source);
const rankX = u => /\.(jpe?g|png)(\?|$)/i.test(u) ? 0 : /\.(webp|avif)(\?|$)/i.test(u) ? 2 : 1;
const pick = list.map((x, i) => [x, i]).sort((a, b) => rankX(a[0].url) - rankX(b[0].url) || a[1] - b[1]).slice(0, 12).sort((a, b) => a[1] - b[1]).map(a => a[0]), skipped = [], hashed = [];
c.data = { found: list.length, checked: pick.length, decoded: 0, skipped, reuse: [], stock: stock.map(s => ({ img: s.img, host: s.host, source: s.source })), index_images: (B.imgs && B.imgs.images) || 0, index_generated: B.imgs && B.imgs.generated };
c.limits = [$s.k9, $s.k10];
if (!list.length) { c.status = $q.aC; c.summary = S.html ? $t.k32 : $q.ck; return c._done(); }
const t0 = Date.now(); let bytes = 0;
const bufs = new Array(pick.length).fill(null); let next = 0;
await Promise.all([0, 1, 2].map(async () => { while (next < pick.length && Date.now() - t0 < 9000) { const i = next++, x = pick[i]; try { const b = await fetchImage(x.url, S.url); bytes += b.length; bufs[i] = b; } catch (e) { skipped.push({ url: x.url, why: String(e.message || e) }); } } }));
const idx = B.imgs && imgIndex(B.imgs);
for (let i = 0; i < pick.length; i++) {
const b = bufs[i]; if (!b) continue;
if (Date.now() - t0 > 9000) { skipped.push({ url: pick[i].url, why: $q.cl }); continue; }
let img = null, fmt0 = '';
try {
if (b[0] === 0xff && b[1] === 0xd8) { fmt0 = 'jpeg'; img = decodeJpeg(b, { useTArray: true, formatAsRGBA: true, maxResolutionInMP: 12, maxMemoryUsageInMB: 160 }); }
else if (b[0] === 0x89 && b[1] === 0x50) { fmt0 = 'png'; img = await decodePng(b); }
else { const sig = String.fromCharCode(...b.subarray(8, 12)); skipped.push({ url: pick[i].url, why: sig === 'WEBP' ? $q.cm : /ftypavif/.test(String.fromCharCode(...b.subarray(4, 12))) ? $q.cn : $q.co }); continue; }
} catch (e) { skipped.push({ url: pick[i].url, why: fmt0 + $q.cp + String(e.message || e).slice(0, 80) }); continue; }
if (img.width < 200 || img.height < 200) { skipped.push({ url: pick[i].url, why: $q.cq + img.width + 'x' + img.height + ')' }); continue; }
const k = kdh1(img); img = null; if (!k) continue;
const ones = pop32(split(k.h)[0]) + pop32(split(k.h)[1]);
hashed.push({ i, url: pick[i].url, k, flat: ones < 8 || ones > 56, sha256: await sha256(b) });
}
c.data.decoded = hashed.length;
const reuse = [];
if (idx) for (const h of hashed) {
if (h.flat) continue;
const H = split(h.k.h), Cc = split(h.k.c), Fm = split(h.k.f), best = new Map();
for (let j = 0; j < idx.ids.length; j++) {
const a = [idx.F[2 * j], idx.F[2 * j + 1]], b2 = [idx.C[2 * j], idx.C[2 * j + 1]];
const d = Math.min(dist(H, a), dist(Cc, b2), dist(Fm, a) + 1);
if (d <= 5) { const id = idx.ids[j]; if (!best.has(id) || best.get(id) > d) best.set(id, d); }
}
for (const [id, d] of best) reuse.push({ img: h.i + 1, url: h.url, case_id: id, bits: d });
}
const self = S.rec && (S.rec.x ? S.rec.x.id : S.rec.c ? S.rec.c.id : null);
const other = reuse.filter(r => r.case_id !== self), mine = reuse.filter(r => r.case_id === self);
const label = id => { const x = B.N.byId.get(id); if (x) return { name: x.n, url: ORIGIN + $q.cr + x.s + '/', market: x.mk }; const cs = B.N.caseBy.get(id); return { name: isCoi(cs && cs.market) ? $q.cs : $q.ct + id, url: null, market: cs && !isCoi(cs.market) ? cs.market : null }; };
c.data.reuse = other.map(r => Object.assign({}, r, { project: label(r.case_id) }));
c.data.self_matches = mine.length;
c.data.hashes = hashed.map(h => ({ img: h.i + 1, kdh1: h.k.h, center: h.k.c, sha256: h.sha256 }));
c._src({ name: $q.cu + pick.length + $q.cv, url: S.url, fetched: now(), bytes }, bytes);
c._src({ name: $t.k33 + c.data.index_images + $q.cw, url: ORIGIN + $q.O, licence: $q.j }, 0);
for (const h of new Set(pick.map(x => hostOf(x.url)))) c._host(h);
const byProj = new Map(); for (const r of c.data.reuse) { const k = r.case_id; if (!byProj.has(k)) byProj.set(k, { p: r.project, imgs: new Set(), bits: 99 }); const e = byProj.get(k); e.imgs.add(r.img); e.bits = Math.min(e.bits, r.bits); }
for (const [, e] of [...byProj].slice(0, 6)) c.items.push({ label: $q.cx, value: e.p.name + (e.p.market ? ' (' + e.p.market + ')' : '') + $q.cy + [...e.imgs].join(', ') + ', ' + e.bits + $q.cz, url: e.p.url, kind: 'warn' });
if (mine.length) c.items.push({ label: $q.cA, value: mine.length + $t.k34, kind: 'text' });
for (const s of stock.slice(0, 4)) c.items.push({ label: $q.cB, value: $q.cC + s.img + $q.cD + s.host + ' (' + s.source + ')', url: s.url, kind: 'warn' });
c.items.push({ label: $q.cE, value: hashed.length + ' of ' + pick.length + $q.cF + (list.length > pick.length ? $q.cG + list.length + $q.cH : '') + (skipped.length ? '; ' + skipped.length + $q.cI : ''), kind: 'num' });
if (skipped.length) c.items.push({ label: $q.cJ, value: [...new Set(skipped.map(s => s.why))].slice(0, 4).join('; '), kind: 'text' });
c.status = hashed.length || stock.length ? 'found' : $q.k;
c.summary = !hashed.length ? (stock.length ? stock.length + $t.k35 : $t.k36 + (skipped[0] ? skipped[0].why : $q.cK) + ').')
: (byProj.size ? hashed.length + $q.cL + (hashed.length === 1 ? '' : 's') + $q.cM + byProj.size + $q.cN + (byProj.size === 1 ? ' uses' : 's use') + $q.cO : hashed.length + $q.cL + (hashed.length === 1 ? '' : 's') + $t.k37 + fmt(c.data.index_images) + $q.cP) + (stock.length ? ' ' + stock.length + $q.cQ : '');
return c._done();
}
const CUR = [[/US\$|USD|\$/, 'USD'], [/€|EUR\b|euros?\b/i, 'EUR'], [/AED|Dhs?\b|dirhams?/i, 'AED'], [/£|GBP/, 'GBP'], [/IDR|\bRp\.?/, 'IDR'], [/THB|฿|baht/i, 'THB'], [/MXN|MX\$/, 'MXN'], [/TRY|₺|\bTL\b/, 'TRY'], [/MYR|\bRM\b/, 'MYR'], [/PHP|₱/, 'PHP'], [/VND|₫/, 'VND'], [/AUD|A\$/, 'AUD']];
function numOf(s, mult) { let t = String(s).replace(/\s/g, ''); if (/^\d{1,3}([.,]\d{3})+$/.test(t)) t = t.replace(/[.,]/g, ''); else t = t.replace(/,/g, '.'); const n = parseFloat(t); if (!isFinite(n)) return null; const m = String(mult || '').toLowerCase(); return n * (/^(m|mn|mio|million|juta|jt)$/.test(m) ? 1e6 : /^(k|rb|ribu)$/.test(m) ? 1e3 : /^(b|bn|billion|miliar|milyar|m(i|y)l)$/.test(m) ? 1e9 : 1); }
export function priceSizeOnPage(text) {
const T = String(text || ''), prices = [], sizes = [];
const curRx = $t.k38;
const reA = new RegExp(curRx + $t.k39, 'gi');
const reB = new RegExp($s.k11, 'gi');
const add = (cs, num, mult, i, len) => { const cur = (CUR.find(([re]) => re.test(cs)) || [])[1]; const v = numOf(num, mult); if (!cur || !v) return; const min = { IDR: 5e7, THB: 3e5, VND: 2e8, MXN: 2e5, PHP: 5e5, TRY: 3e5 }[cur] || 2e4; if (v < min || v > 5e10) return; const q = snippet(T, i, len); prices.push({ v, cur, from: /\b(from|starting|start at|desde|ab|à partir|mulai|vanaf|от|起)\b/i.test(T.slice(Math.max(0, i - 30), i)), quote: q }); };
for (const m of T.matchAll(reA)) add(m[1], m[2], m[3], m.index, m[0].length);
for (const m of T.matchAll(reB)) add(m[3], m[1], m[2], m.index, m[0].length);
for (const m of T.matchAll(/(\d{1,5}(?:[.,]\d{1,2})?)\s?(?:-|to|–)?\s?(?:\d{1,5}(?:[.,]\d{1,2})?)?\s?(m2|m²|sqm|sq\.?\s?m\b|square met(?:re|er)s?|sq\.?\s?ft|sqft|square feet)/gi)) {
let v = parseFloat(m[1].replace(',', '.')); if (/ft|feet/i.test(m[2])) v *= 0.092903; if (v >= 15 && v <= 5000) sizes.push({ v: Math.round(v * 10) / 10, quote: snippet(T, m.index, m[0].length), unit: m[2] });
}
const cnt = {}, first = {}; prices.forEach((p, i) => { cnt[p.cur] = (cnt[p.cur] || 0) + 1; if (first[p.cur] == null) first[p.cur] = i; });
const main = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a] || first[a] - first[b])[0];
const P = prices.filter(p => p.cur === main).sort((a, b) => (b.from - a.from) || (a.v - b.v));
const Z = sizes.sort((a, b) => a.v - b.v);
return { price: P[0] || null, size: Z[0] || null, prices: P.slice(0, 5), sizes: Z.slice(0, 5) };
}
let FX = null;
async function ecbRates(c) {
if (FX && Date.now() - FX.t < 43200000) return FX.v;
const url = $t.k40;
const r = await withTimeout(fetch(url, { headers: { 'user-agent': $t.UA }, cf: { cacheTtl: 21600, cacheEverything: true } }), 5000, $q.cR);
const t = await r.text(); const v = { EUR: 1, date: (/time=['"](\d{4}-\d\d-\d\d)/.exec(t) || [])[1] || null };
for (const m of t.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([\d.]+)['"]/g)) v[m[1]] = +m[2];
if (c) c._src({ name: $t.k41 + v.date + ')', url, fetched: now(), bytes: t.length }, t.length);
FX = { t: Date.now(), v }; return v;
}
const toUSD = (fx, v, cur) => cur === 'USD' ? v : (cur === 'AED' ? v / 3.6725 : fx && fx[cur] && fx.USD ? v / fx[cur] * fx.USD : null);
const BANDS = ['Under $100k', '$100k to $200k', '$200k to $400k', '$400k and up'];
const bandOf = usd => usd == null ? null : usd < 1e5 ? BANDS[0] : usd < 2e5 ? BANDS[1] : usd < 4e5 ? BANDS[2] : BANDS[3];
async function evPpm(S, env, ctx) {
await ppmLoad(env);
const c = card('ppm', 14), R = S.rec && S.rec.x;
c.limits = [$s.k12, $s.k13];
let x, from;
const ps = S.ps;
if (R && R.fx && R.fx.price_min && R.fx.size_min_m2) { x = R; from = $q.Y; }
else {
const price = +S.hint.price || (ps.price && ps.price.v) || null, cur = S.hint.currency || (ps.price && ps.price.cur) || null, size = +S.hint.size_m2 || (ps.size && ps.size.v) || null;
x = { n: (R && R.n) || S.hint.name || '', ar: [(R && R.ar), S.place].filter(Boolean).join(', '), mk: S.market || '', co: S.country || '', fx: { price_min: price, size_min_m2: size, currency: cur } }; from = 'page';
}
const d = ppmData(x);
c.data = Object.assign({ from, market: S.market, country: S.country }, d, { own_per_m2: d.own ? Math.round(d.own) : null });
if (from === $q.Y) c.items.push({ label: $q.cS, value: d.cur + ' ' + fmt(d.price) + $q.cT + fmt(d.size) + ' m2', url: R.url || null, kind: 'text' });
else { if (ps.price) c.items.push({ label: $q.cU, value: ps.price.cur + ' ' + fmt(ps.price.v), quote: ps.price.quote, url: S.url, kind: 'text' }); if (ps.size) c.items.push({ label: $q.cV, value: ps.size.v + ' m2', quote: ps.size.quote, url: S.url, kind: 'text' }); }
if (d.own) c.items.push({ label: $q.cW, value: d.cur + ' ' + fmt(d.own) + $q.cX, kind: 'num' });
for (const o of d.official) {
c.items.push({ label: o.name, value: fmt(o.value) + ' ' + o.unit + (o.n ? ', ' + o.n + $q.cY : '') + ', ' + o.period + $q.cZ + (o.diff_pct === 0 ? $q.da : Math.abs(o.diff_pct) + '% ' + (o.diff_pct > 0 ? 'above' : 'below')), url: o.url, kind: 'num' });
c._src({ name: o.name, url: o.url, licence: /dubailand/.test(o.url) ? $q.db : $t.k42 }, 0);
}
const WHY = { no_price_size: $t.k43, no_price: $q.dc, no_size: $q.dd, currency: $t.k44 + (S.country === 'Spain' ? 'EUR' : 'AED') + ').', no_match: $q.de + (S.country || $q.df) + $t.k45, no_dataset: $q.dg + (S.market || S.country || $q.dh) + $t.k46 };
c.status = d.official.length ? 'found' : d.own ? $q.aC : $q.k;
c.summary = d.official.length ? $q.di + d.cur + ' ' + fmt(d.own) + $q.dj + d.official.length + $q.dk + (d.official.length > 1 ? 's' : '') + '.' : (d.own ? d.cur + ' ' + fmt(d.own) + $q.dl + (from === $q.Y ? $q.dm : $q.dn) + '. ' : '') + WHY[d.why || $q.do];
if (!d.official.length) c.items.push({ label: $q.dp, value: WHY[d.why || $q.do], url: ORIGIN + $q.dq, kind: 'text' });
c._src(OWN($q.dr), 0);
return c._done();
}
const MIN_N = 5;
async function evMarket(S, env, ctx) {
const c = card($q.ds, 15), B = S.B;
c.limits = [$t.k47, $s.k14];
if (S.coi) { c.status = $q.bk; c.summary = $s.k15; c.items.push({ label: 'Why', value: $t.k48, url: ORIGIN + $q.az, kind: 'text' }); return c._done(); }
const M = S.market;
if (!M) { c.status = $q.k; c.summary = $t.k49; return c._done(); }
const all = [...B.N.caseBy.values()].filter(x => x.market === M);
const rev = all.filter(x => x.verified && Object.values(x.verified).some(v => v && v !== 'none'));
const dm = ((B.delay && B.delay.markets) || []).find(x => x.market === M);
c.data = { market: M, tracked: all.length, reviewed: rev.length, share_past_first: null, median_months_late: null, permit_share: null, deposit_share: null, delay_with_date: dm ? dm.with_date : null };
if (dm && dm.with_date >= MIN_N) {
c.data.share_past_first = dm.share_past_first; c.data.median_months_late = dm.past_first ? dm.median_late : null;
c.items.push({ label: $q.dt, value: dm.past_first + ' of ' + dm.with_date + $q.du + dm.share_past_first + '%)', url: ORIGIN + $q.M, kind: 'num' });
if (dm.past_first && dm.median_late != null) c.items.push({ label: $q.dv, value: dm.median_late + $q.dw + (dm.past_first < MIN_N ? $q.dx + dm.past_first + $q.dy + (dm.past_first === 1 ? '' : 's') + ')' : ''), url: ORIGIN + $q.M, kind: 'num' });
if (dm.moved) c.items.push({ label: $q.dz, value: dm.moved + ' of ' + dm.tracked + $q.dA, url: ORIGIN + $q.M, kind: 'num' });
} else c.items.push({ label: $q.dB, value: $t.k50 + (dm ? dm.with_date : 0) + $q.dC + MIN_N + $q.dD, kind: 'text' });
if (rev.length >= MIN_N) {
const pn = rev.filter(x => (x.checks || {}).permit === 2).length, dp = rev.filter(x => (x.checks || {}).escrow === true).length;
c.data.permit_share = Math.round(pn / rev.length * 100); c.data.deposit_share = Math.round(dp / rev.length * 100);
c.items.push({ label: $q.dE, value: c.data.permit_share + '% (' + pn + ' of ' + rev.length + $q.dF, url: ORIGIN + $q.dG, kind: 'num' });
c.items.push({ label: $t.k51, value: c.data.deposit_share + '% (' + dp + ' of ' + rev.length + $q.dF, url: ORIGIN + $q.dG, kind: 'num' });
} else c.items.push({ label: $q.dH, value: 'Only ' + rev.length + $t.k52 + MIN_N + $q.dI, kind: 'text' });
c.items.push({ label: $q.dJ + M, value: all.length + $q.dK, url: ORIGIN + '/m/' + slugM(M) + '/', kind: 'link' });
c._src(OWN($q.M), 0); c._src(OWN($q.dG), 0);
c.status = 'found';
c.summary = M + ': ' + all.length + $q.dL + (c.data.share_past_first != null ? ', ' + c.data.share_past_first + $q.dM : '') + (c.data.permit_share != null ? ', ' + c.data.permit_share + $q.dN + c.data.deposit_share + $q.dO : '') + '.';
return c._done();
}
async function evDeveloper(S, env, ctx) {
const c = card($q.dP, 16), B = S.B, N = B.N;
c.limits = [$t.k53, $s.k16];
let dv = null, how = null;
const R = S.rec;
if (R && R.x && R.x.dvs && N.devs.has(R.x.dvs)) { dv = N.devs.get(R.x.dvs); how = $q.dQ; }
if (!dv && R && R.dev) { const s = new Set(R.dev.map(x => x.dvs).filter(Boolean)); if (s.size === 1) { dv = N.devs.get([...s][0]); how = $q.dR; } }
if (!dv && S.hint.developer) { const k = norm(S.hint.developer).replace(/\b(pt|ltd|llc|group|developers?|properties|property|real estate|holdings?|inc|sl|sa|fz|fze)\b/g, '').trim(); if (k.length >= 3) for (const d of N.devs.values()) { const dk = norm(d.n).replace(/\b(pt|ltd|llc|group|developers?|properties|property|real estate|holdings?|inc|sl|sa|fz|fze)\b/g, '').trim(); if (dk === k) { dv = d; how = $q.dS; break; } } }
if (R && R.coi) { c.status = $q.bk; c.summary = $t.k54; return c._done(); }
if (!dv) { c.status = $q.k; c.summary = S.hint.developer ? $q.dT + S.hint.developer + $q.dU + fmt(N.devs.size) + $q.dV : $t.k55; return c._done(); }
const xs = dv.ids.map(id => N.byId.get(id)).filter(Boolean);
const st = { kept: 0, broken: 0, moved: 0, pending: 0, unknown: 0 }; let overdue = 0, movedMonths = 0, done = 0;
const ot = (B.ontime && B.ontime.projects) || {}, ots = { done_on_time: 0, done_late: 0, missed: 0, moved: 0, open: 0 };
for (const x of xs) {
for (const p of N.prom[x.id] || []) if (st[p.st] != null) st[p.st]++;
const cs = N.caseBy.get(x.id) || {}; if (cs.overdue) overdue++; if (cs.delay) movedMonths += +cs.delay || 0; if (cs.stage === $q.dW) done++;
const o = ot[x.id]; if (o && ots[o.s] != null) ots[o.s]++;
}
const url = ORIGIN + $q.dX + dv.s + '/';
c.data = { slug: dv.s, name: dv.n, matched_by: how, projects: xs.length, promises: st, overdue, completed: done, on_time: ots, url };
c.items.push({ label: $q.dY, value: dv.n + $q.dZ + how + ')', url, kind: 'link' });
c.items.push({ label: $q.ea, value: xs.length + ': ' + xs.slice(0, 6).map(x => x.n + ' (' + x.mk + ')').join(', ') + (xs.length > 6 ? ', ...' : ''), url, kind: 'text' });
const tot = st.kept + st.broken + st.moved + st.pending + st.unknown;
if (tot) c.items.push({ label: $q.eb, value: tot + $q.ec + st.kept + $q.ed + st.broken + $q.ee + st.moved + $q.ef + st.pending + $q.eg + st.unknown + $q.eh, url: ORIGIN + $q.ei, kind: 'num' });
if (overdue) c.items.push({ label: $q.ej, value: overdue + ' of ' + xs.length + $q.ek, url, kind: 'warn' });
const closed = ots.done_on_time + ots.done_late + ots.missed;
c.items.push({ label: $t.k56, value: closed ? ots.done_on_time + ' of ' + closed + $t.k57 : $t.k58, url: ORIGIN + $q.N, kind: 'num' });
c._src(OWN($q.el), 0); c._src(OWN($q.N), 0); c._src(OWN($q.em), 0);
c.status = 'found';
c.summary = dv.n + ': ' + xs.length + $q.dy + (xs.length === 1 ? '' : 's') + $q.dK + (tot ? ', ' + st.kept + ' of ' + tot + $q.en + st.broken + $q.ee + st.moved + $q.eo : '') + '.';
return c._done();
}
const COVC = { Spain: 'ES', USA: 'US', UAE: 'AE', Indonesia: 'ID', 'United Kingdom': 'GB' };
async function evLaw(S, env, ctx) {
const c = card('law', 17), B = S.B, C = S.country;
c.limits = [$t.k59, $s.k17];
if (!C) { c.status = $q.k; c.summary = $t.k60; return c._done(); }
const rules = [];
for (const src of [B.law, B.lh]) { if (!src || !src.rules) continue; for (const r of src.rules) if ($t.o_LAWC[r.market] === C) { const s = (src.sources || {})[r.source] || ((B.law && B.law.sources) || {})[r.source]; if (s && s.url && !rules.some(x => x.id === r.id)) rules.push({ id: r.id, title: r.title, cite: r.cite || null, law: s.law, url: s.url, quote: String(r.quote || '').slice(0, 300), topics: r.topics || [] }); } }
const cov = ((B.cover && B.cover.countries) || []).find(x => x.code === (COVC[C] || 'ANY')) || ((B.cover && B.cover.countries) || []).find(x => x.code === 'ANY');
c.data = { country: C, rules, registers: cov ? { code: cov.code, online: cov.online || [], manual: cov.manual || [], needs_key: cov.needs_key || [], site_visit: cov.site_visit || [] } : null, page: rules.length ? ORIGIN + $q.ep + slugC(C) + $q.eq : null };
for (const r of rules.slice(0, 6)) c.items.push({ label: r.title, value: r.law + (r.cite ? ', ' + r.cite : ''), quote: r.quote, url: r.url, kind: 'link' });
if (rules.length > 6) c.items.push({ label: 'More', value: (rules.length - 6) + $q.er, url: c.data.page, kind: 'link' });
if (rules.length) c._src({ name: $t.k61, url: ORIGIN + $q.P, licence: $t.k62 }, 0);
if (cov) {
for (const o of (cov.online || []).slice(0, 4)) c.items.push({ label: $q.es, value: o.what + ' (' + o.source + ')', url: o.url, kind: 'link' });
for (const o of (cov.manual || []).slice(0, 4)) c.items.push({ label: $q.et, value: o.what + ' (' + o.source + ')', url: o.url || null, kind: 'text' });
if ((cov.site_visit || []).length) c.items.push({ label: $q.eu, value: cov.site_visit.join('; '), kind: 'text' });
c._src(OWN($q.R), 0);
}
c.status = rules.length ? 'found' : $q.aC;
c.summary = rules.length ? rules.length + $q.ev + C + $t.k63 + (cov && cov.code !== 'ANY' ? '; ' + ((cov.online || []).length ? (cov.online || []).length + $q.ew : $q.ex) + (cov.manual || []).length + $q.ey : '.')
: $t.k64 + C + $s.k18 + (cov ? $q.ez + (cov.code === 'ANY' ? $q.eA : (cov.online || []).length + $q.eB + (cov.manual || []).length + $q.eC) : '');
return c._done();
}
async function evSimilar(S, env, ctx) {
const c = card($q.eD, 18), B = S.B, N = B.N;
c.limits = [$t.k65];
if (S.coi) { c.status = $q.bk; c.summary = $t.k66; return c._done(); }
const M = S.market; if (!M) { c.status = $q.k; c.summary = $q.eE; return c._done(); }
const self = S.rec && S.rec.x ? S.rec.x.id : null, me = self ? N.caseBy.get(self) : null;
let band = me && me.band && BANDS.includes(me.band) ? me.band : null, stage = (me && me.stage) || S.hint.stage || null;
if (!band && S.ps.price) { try { const fx = await ecbRates(c); band = bandOf(toUSD(fx, S.ps.price.v, S.ps.price.cur)); } catch (e) {} }
if (!band && S.hint.price && S.hint.currency) { try { const fx = await ecbRates(c); band = bandOf(toUSD(fx, +S.hint.price, String(S.hint.currency).toUpperCase())); } catch (e) {} }
const near = (a, b) => a && b ? Math.abs(BANDS.indexOf(a) - BANDS.indexOf(b)) : 9;
let L = N.P.filter(x => x.mk === M && x.id !== self).map(x => ({ x, cs: N.caseBy.get(x.id) || {} }));
const simRow = self && B.sim && B.sim.projects && B.sim.projects[self] ? new Map(B.sim.projects[self].map(r => [r[0], r[1]])) : new Map();
L = L.map(o => { let s = 0; if (stage && o.cs.stage === stage) s += 2; const nb = near(band, o.cs.band); if (nb === 0) s += 2; else if (nb === 1) s += 1; if (simRow.has(o.x.id)) s += 3 * simRow.get(o.x.id); return Object.assign(o, { s, nb }); })
.filter(o => (!stage || o.cs.stage === stage || simRow.has(o.x.id)) && (!band || o.nb <= 1 || simRow.has(o.x.id)))
.sort((a, b) => b.s - a.s || String(a.x.n).localeCompare(String(b.x.n)));
c.data = { market: M, stage, band, items: L.slice(0, 5).map(o => ({ id: o.x.id, slug: o.x.s, name: o.x.n, stage: o.cs.stage || null, band: o.cs.band || null, url: ORIGIN + $q.cr + o.x.s + '/', why: [o.cs.stage === stage ? $q.eF : null, o.nb === 0 ? $q.eG : o.nb === 1 ? $q.eH : null, simRow.has(o.x.id) ? $q.eI : null].filter(Boolean).join(', ') })) };
for (const it of c.data.items) c.items.push({ label: it.name, value: [it.stage, it.band].filter(Boolean).join(', ') + (it.why ? ' (' + it.why + ')' : ''), url: it.url, kind: 'link' });
c._src(OWN($q.dG), 0); if (simRow.size) c._src(OWN($q.L), 0);
c.status = c.data.items.length ? 'found' : $q.k;
c.summary = c.data.items.length ? c.data.items.length + $q.eJ + (c.data.items.length === 1 ? '' : 's') + ' in ' + M + (stage ? ', ' + stage : '') + (band ? ', ' + band : '') + '.' : $q.eK + M + $q.eL;
return c._done();
}
const RUN = { location: evLocation, satellite: evSatellite, images: evImages, ppm: evPpm, market: evMarket, developer: evDeveloper, law: evLaw, similar: evSimilar };
const NUM = { location: 11, satellite: 12, images: 13, ppm: 14, market: 15, developer: 16, law: 17, similar: 18 };
const TMO = { location: 12000, satellite: 20000, images: 16000, ppm: 15000, market: 15000, developer: 6000, law: 15000, similar: 15000 };
async function fetchPage(url) {
const u = publicUrl(url); if (!u) throw new Error($q.eM);
let r, cur = u;
for (let hop = 0; hop < 5; hop++) {
r = await withTimeout(fetch(cur.toString(), { headers: { 'user-agent': $t.BUA, accept: $t.k67, 'accept-language': 'en' }, redirect: $q.eN }), 9000, 'page');
if (r.status < 300 || r.status >= 400 || !r.headers.get($q.S)) break;
let nx = null; try { nx = publicUrl(new URL(r.headers.get($q.S), cur).toString()); } catch (e) {}
if (!nx) throw new Error($q.eO);
try { r.body && r.body.cancel(); } catch (e) {}
cur = nx; if (hop === 4) throw new Error($q.eP);
}
const b = await readMax(r, 3000000); if (!b) throw new Error($q.eQ);
return { url: u.toString(), final_url: cur.toString(), html: new TextDecoder().decode(b), status: r.status, bytes: b.length, sha256: await sha256(b), fetched: now() };
}
export async function evRun(page, hint, env, ctx, onCard, opts) {
hint = hint || {}; page = page || {};
const only = new Set((opts && opts.only && opts.only.length ? opts.only : EV_IDS).filter(id => RUN[id]));
const emit = c => { try { onCard && onCard(c); } catch (e) {} return c; };
const fail = (id, e) => emit({ id, n: NUM[id], title: $t.o_TITLES[id], status: 'error', summary: (/timed out/.test(String((e && e.message) || e)) ? $s.k19 : $q.eR + String((e && e.message) || e).slice(0, 160)), error: String((e && e.message) || e).slice(0, 160), items: [], limits: [], paid: $t.o_PAID[id] || null, sources: [], proof: { ms: 0, bytes: 0, edge: true, contacted: [] }, data: {} });
let B; try { B = await base(env); } catch (e) { return [...only].map(id => fail(id, e)); }
const html = String(page.html || '');
const S = { B, html, url: page.final_url || page.url || '', fetched: page.fetched || null, page_sha: page.sha256 || null, hint, market: null, country: null, coi: false, pin: null, place: null };
S.rec = recognise(B, page, hint);
if (S.rec && S.rec.x) { S.market = S.rec.x.mk; S.country = ctry(S.rec.x.co); }
if (S.rec && S.rec.c && !S.rec.x) { S.coi = isCoi(S.rec.c.market); S.rec.coi = S.coi; S.market = S.coi ? null : S.rec.c.market; S.country = ctry(S.rec.c.country); }
if (!S.market && hint.market) { S.market = isCoi(hint.market) ? null : hint.market; S.coi = isCoi(hint.market); }
if (!S.country && hint.country) S.country = ctry(hint.country);
S.ps = priceSizeOnPage(page.text || htmlText(html));
const scrub = c => { if (!S.coi || !c) return c; const rx = /sumba/i, deep = o => { if (typeof o === $q.b) return rx.test(o) ? $q.eS : o; if (Array.isArray(o)) return o.map(deep); if (o && typeof o === $q.l) { const r = {}; for (const k of Object.keys(o)) r[k] = deep(o[k]); return r; } return o; };
c.items = (c.items || []).filter(it => !rx.test(JSON.stringify(it))); c.data = deep(c.data || {}); c.sources = deep(c.sources || []); c.summary = deep(c.summary); return c; };
let locDone = null;
const run = id => withTimeout(RUN[id](S, env, ctx), TMO[id], $t.o_TITLES[id]).then(async c => { if (id !== $q.S && locDone) await locDone; return emit(scrub(c)); }, e => fail(id, e));
const loc = locDone = only.has($q.S) || only.has($q.bj) || (!S.market && (only.has('ppm') || only.has($q.ds) || only.has('law') || only.has($q.eD))) ? run($q.S) : Promise.resolve(null);
const jobs = {};
for (const id of [$q.cj, $q.dP]) if (only.has(id)) jobs[id] = run(id);
for (const id of [$q.bj, 'ppm', $q.ds, 'law', $q.eD]) if (only.has(id)) jobs[id] = loc.then(() => run(id));
const lc = await loc;
const out = []; for (const id of EV_IDS) { if (id === $q.S) { if (only.has($q.S) && lc) out.push(lc); continue; } if (jobs[id]) out.push(await jobs[id]); }
return out;
}
const J = (o, s, extra) => new Response(JSON.stringify(o, null, 1), { status: s || 200, headers: Object.assign({ 'content-type': $q.eT, 'access-control-allow-origin': '*', 'cache-control': $q.eU }, extra || {}) });
let RL = { t: 0, n: 0 };
export async function handle(req, u, env, ctx) {
if (req.method === $q.eV) return new Response(null, { headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET', 'access-control-max-age': '86400' } });
if (req.method !== 'GET') return J({ error: $q.eW }, 405);
if (u.pathname === $q.eX) { try { return await satRoute(u, env, ctx); } catch (e) { return new Response($q.eY + String(e.message || e).slice(0, 120), { status: 502 }); } }
const target = u.searchParams.get('url');
if (!target) return J({ about: $t.k68 + EV_IDS.join(',') + ']', cards: EV_IDS.map(id => ({ id, n: NUM[id], title: $t.o_TITLES[id] })), contract: $s.k20 });
if (!publicUrl(target)) return J({ error: $q.eZ }, 400);
const only = (u.searchParams.get('only') || '').split(',').filter(x => EV_IDS.includes(x));
const pid = u.searchParams.get($q.fa) || '';
const ck = new Request(ORIGIN + $q.fb + (await sha256([target, only.join(','), pid, (env && env.CF_PAGES_COMMIT_SHA) || ''].join('|'))).slice(0, 40));
const hit = await caches.default.match(ck); if (hit) { const h = new Headers(hit.headers); h.set($q.bT, 'hit'); return new Response(hit.body, { headers: h }); }
if (Date.now() - RL.t > 60000) RL = { t: Date.now(), n: 0 }; if (++RL.n > 20) return J({ error: $q.fc }, 429, { 'retry-after': '60' });
const t0 = Date.now(); let page;
try { page = await fetchPage(target); } catch (e) { page = { url: target, final_url: target, html: '', error: String(e.message || e) }; }
const cards = await evRun(page, { project_id: pid || undefined }, env, ctx, null, { only });
const body = { url: target, final_url: page.final_url, page: { status: page.status || null, bytes: page.bytes || 0, sha256: page.sha256 || null, fetched: page.fetched || null, error: page.error || null }, ms: Date.now() - t0, cards };
const res = J(body, 200, { 'cache-control': $q.fd });
ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(body, null, 1), { headers: { 'content-type': $q.eT, 'access-control-allow-origin': '*', 'cache-control': $q.fe } })).catch(() => {}));
return res;
}
