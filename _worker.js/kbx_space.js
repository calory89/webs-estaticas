// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_space__q, $s = TB.kbx_space__s, $t = TB.kbx_space__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
let MEMO = null;
async function loadOne(env, name) {
let r = null;
try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + $q.a + name)); } catch (e) { r = null; }
if (!r || !r.ok) { try { r = await fetch(ORIGIN + $q.b + name, { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
return r && r.ok ? await r.json().catch(() => null) : null;
}
export async function spaceData(env) {
if (!S.es) { const si = await loadOne(env, $q.c); if (si && si.space) S = si.space; }
if (MEMO && Date.now() - MEMO.t < 600000) return MEMO.v;
const [radar, bld] = await Promise.all([loadOne(env, $q.d), loadOne(env, $q.e)]);
const v = { radar, bld, v: ((radar && radar.updated) || '') + '/' + ((bld && bld.updated) || '') };
MEMO = { t: Date.now(), v }; return v;
}
let S = { en: {} };
const t = (lang, k, v) => { const s = (S[lang] && S[lang][k]) || S.en[k] || ''; return v && typeof s === $q.f ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.g, "'": '&#39;' }[c]));
const mi = s => { const m = String(s).match(/^(\d{4})-(\d{2})/); return m ? +m[1] * 12 + (+m[2] - 1) : null; };
const ym = i => Math.floor(i / 12) + '-' + String(i % 12 + 1).padStart(2, '0');
const sg = v => (v > 0 ? '+' : '') + v;
const relDate = r => String(r || '').replace(/\.\d+$/, '');
function rchart(rec, band, ms, lang, fd, W) {
const m0 = mi(rec.m0), n = rec.n, end = m0 + n;
const ys = rec.y.filter(v => v != null);
const lim = Math.max(3, Math.ceil(Math.max(...ys.map(Math.abs), band || 0) + 1));
const narrow = W < 500, H = narrow ? 220 : 200, L = 34, R = 8, T = 14, B = 26, iw = W - L - R, ih = H - T - B;
const X = i => L + (i - m0) / (end - m0) * iw, Y = v => T + ih / 2 - v / lim * ih / 2;
let g = band ? $q.h + L + '" y="' + Y(band).toFixed(1) + $q.i + iw + $q.j + (Y(-band) - Y(band)).toFixed(1) + '"/>' : '';
const st = lim > 8 ? Math.ceil(lim / 4) : lim > 4 ? 2 : 1;
for (let v = -Math.floor(lim / st) * st; v <= lim; v += st) g += $q.k + (v ? 'gl' : 'ax') + $q.l + L + $q.m + (W - R) + $q.n + Y(v).toFixed(1) + $q.o + Y(v).toFixed(1) + $q.p + (L - 6) + '" y="' + (Y(v) + 4).toFixed(1) + $q.q + sg(v) + $q.r;
for (let y = Math.floor(m0 / 12) + 1; y * 12 < end; y++) { const x = X(y * 12); g += $q.s + x.toFixed(1) + $q.m + x.toFixed(1) + $q.n + T + $q.o + (T + ih) + $q.p + x.toFixed(1) + '" y="' + (H - 8) + $q.t + y + $q.r; }
for (const o of ms || []) if (!o.old && o.a >= m0 && o.a < end) g += $q.u + X(o.a).toFixed(1) + $q.m + X(o.a).toFixed(1) + $q.n + T + $q.o + (T + ih) + $q.v + esc(fd(o.d)) + $q.w;
const pts = []; for (let i = 0; i < n; i++) if (rec.y[i] != null) pts.push([X(m0 + i + 0.5), Y(rec.y[i]), i]);
if (pts.length) g += $q.x + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + '"/>';
for (const [x, y, i] of pts) g += $q.y + x.toFixed(1) + $q.z + y.toFixed(1) + $q.A + esc(fd(ym(m0 + i)) + ': ' + sg(rec.y[i]) + ' dB') + $q.B;
return $q.C + W + ' ' + H + $q.D + esc(t(lang, 'raria', { a: fd(rec.m0), b: fd(ym(end - 1)) })) + '">' + g + $q.E;
}
function radarHtml(rd, id, lang, fd, ms, opt) {
const rec = rd && rd.projects && rd.projects[id];
if (!rec || !rec.n || !rec.m0) return '';
const m0 = mi(rec.m0), n = rec.n, months = Array.from({ length: n }, (_, i) => ym(m0 + i));
const k = rec.months_ok || 0, tr = rec.track || {};
let h = '<h3>' + esc(t(lang, 'rh')) + $q.F + esc(t(lang, 'ri', { c: opt && opt.cloudy != null ? opt.cloudy : '-', n: opt && opt.n || n, o: ($t.o_OD[lang] || $t.o_OD.en)[tr.orbit] || tr.orbit || '-', r: tr.relative_orbit != null ? tr.relative_orbit : '-' })) + $q.G + esc(t(lang, 'rk', { k, n })) + '</li>';
const band = rd.band_db;
if (rec.status === 'ok' && rec.sum && rec.y) {
const s = rec.sum, big = band != null && Math.abs(s.y_last) > band;
h += '<li>' + (band != null ? '<b>' + esc(t(lang, big ? 'rvis' : 'rnov', { band: '±' + band })) + ' </b>' : '') + esc(t(lang, 'rx', { a: fd(s.last[0]), b: fd(s.last[1]), x: sg(s.y_last), base: fd(s.first[0]) + (s.first[1] !== s.first[0] ? ' - ' + fd(s.first[1]) : '') })) + '</li>';
h += '<li>' + esc(t(lang, 'rv', { v1: s.vv_first, v2: s.vv_last, r1: s.rvv_first, r2: s.rvv_last })) + $q.H;
h += $t.k0 + rchart(rec, band, ms, lang, fd, 720) + $q.I + rchart(rec, band, ms, lang, fd, 360) + $t.k1 + esc(t(lang, 'rlx')) + '</li>' + (band != null ? $q.J + esc(t(lang, 'rlb')) + ' (±' + band + $q.K : '') + ((ms || []).some(o => !o.old) ? $q.L + esc(t(lang, 'rlm')) + '</li>' : '') + $q.M;
} else h += '<li>' + esc(t(lang, 'rfew', { k, n })) + $q.H;
h += $q.N + esc(t(lang, 'rlim')) + '</p>';
h += $q.O + esc(rd.source.attribution) + $q.P + esc(rd.source.url) + $s.k0 + esc(rd.source.licence_url) + $t.k2 + esc(t(lang, $q.Q)) + ', ' + esc(t(lang, 'upd', { d: fd(rd.updated) })) + $q.R;
if (k) {
const th = t(lang, 'rth'), f = v => v == null ? '' : String(v);
const rows = months.map((m, i) => $q.S + esc(fd(m)) + $q.T + esc(rec.dt[i] ? fd(rec.dt[i]) : t(lang, 'none')) + $q.T + (rec.ns[i] || '') + $q.T + f(rec.vv[i]) + $q.T + f(rec.rvv[i]) + $q.T + (rec.y && rec.y[i] != null ? sg(rec.y[i]) : '') + $q.U).reverse().join('');
h += $q.V + esc(t(lang, 'rtbl')) + $t.k3 + th.map(x => '<th>' + esc(x) + '</th>').join('') + $q.W + rows + $q.X;
}
return h;
}
function bldHtml(bd, id, lang, fd, num) {
const rec = bd && bd.projects && bd.projects[id];
if (!rec) return '';
const rel = bd.release, rs = bd.registry_start;
let h = '<h3>' + esc(t(lang, 'bh')) + $q.Y;
if (!rec.n) h += '<li>' + esc(t(lang, 'b0', { rel: fd(relDate(rel)) })) + '</li>';
else {
h += $q.Z + esc(t(lang, 'bn', { n: num(rec.n), p: rec.cover_pct })) + $q.aa;
if (rec.first_seen_min) {
h += '<li>' + esc(rec.first_seen_min === rec.first_seen_max ? t(lang, 'bfs', { a: fd(relDate(rec.first_seen_min)) }) : t(lang, 'bf', { a: fd(relDate(rec.first_seen_min)), b: fd(relDate(rec.first_seen_max)) }));
if (rs) { const nw = Object.entries(rec.first_seen || {}).filter(([r]) => r > rs).reduce((a, [, c]) => a + c, 0); h += ' ' + esc(t(lang, 'bnew', { s: fd(relDate(rs)), k: num(nw) })) + ' ' + esc(t(lang, 'breg', { s: fd(relDate(rs)) })); }
h += '</li>';
}
const src = Object.entries(rec.by_source || {}).sort((a, b) => b[1] - a[1]).map(([d, c]) => d + ' ' + num(c)).join(', ');
if (src) h += '<li>' + esc(t(lang, 'bsrc', { l: src })) + '</li>';
if (rec.max_height_m || rec.max_floors) h += '<li>' + esc(t(lang, 'btall', { h: [rec.max_height_m ? t(lang, 'bm', { h: num(rec.max_height_m) }) : '', rec.max_floors ? t(lang, 'bfl', { f: rec.max_floors }) : ''].filter(Boolean).join(', ') })) + '</li>';
}
h += $q.ab + esc(t(lang, 'blim')) + '</p>';
h += $q.O + esc(bd.source.attribution) + $q.P + esc(bd.source.url) + $t.k4 + esc(rel) + $q.ac + esc(bd.source.licence_url) + $t.k5 + esc(bd.source.attribution_url) + $s.k1 + esc(t(lang, $q.Q)) + ', ' + esc(t(lang, 'upd', { d: fd(bd.updated) })) + $q.R;
if (rec.b && rec.b.length) {
const th = t(lang, 'bth');
const rows = rec.b.map(b => $q.S + num(b.d) + $q.ad + num(b.m2) + $q.ae + (b.h ? num(b.h) + ' m' : '') + $q.T + (b.f || '') + $q.T + esc((b.src || []).join(', ')) + $q.T + esc(b.fs ? fd(relDate(b.fs)) : '') + $q.af + esc(b.id) + '">' + esc(String(b.id).slice(0, 8)) + $q.ag).join('');
h += $q.V + esc(t(lang, 'btbl')) + ' (' + num(rec.b.length) + (rec.n > rec.b.length ? ' / ' + num(rec.n) : '') + $t.k6 + th.map(x => '<th>' + esc(x) + '</th>').join('') + $q.W + rows + $q.X;
}
return h;
}
const nmf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'n' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.NumberFormat(L, o)); };
export function spaceHtml(sp, id, lang, fd, ms, opt) {
if (!sp) return '';
const num = v => { try { return nmf(lang === 'en' ? 'en-GB' : lang).format(v); } catch (e) { return String(v); } };
const a = radarHtml(sp.radar, id, lang, fd, ms, opt), b = bldHtml(sp.bld, id, lang, fd, num);
const lk = $t.k7 + encodeURIComponent(id) + (lang !== 'en' ? $q.ah + lang : '') + '">' + esc(t(lang, 'sv')) + $q.R;
return a || b ? $s.CSS + $q.ai + a + b + lk + $q.aj : '';
}
export function radarSeries(sp, id) {
const rd = sp && sp.radar, rec = rd && rd.projects && rd.projects[id];
if (!rec) return null;
return { m0: rec.m0, n: rec.n, y: rec.y || null, yh: rec.yh || null, vv: rec.vv, rvv: rec.rvv, date: rec.dt, status: rec.status, track: rec.track, band_db: rd.band_db, unit: 'dB',
updated: rd.updated, source: { attribution: rd.source.attribution, url: rd.source.url, licence_url: rd.source.licence_url, method: $q.ak } };
}
export const PATHS = /^\/api\/x\/space\//;
const H = { 'content-type': 'application/json; charset=utf-8', 'x-content-type-options': 'nosniff', 'access-control-allow-origin': '*' };
const out = (o, st, cc) => new Response(JSON.stringify(o), { status: st || 200, headers: Object.assign({ 'cache-control': cc || $q.al }, H) });
const decs = v => { const s = String(v); const i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1; };
function pinOf(x) {
const fx = x.fx || {};
if (typeof fx.lat !== $q.am || typeof fx.lng !== $q.am || Math.abs(fx.lat) > 90 || Math.abs(fx.lng) > 180) return null;
const d = Math.min(decs(fx.lat), decs(fx.lng));
return { lat: fx.lat, lng: fx.lng, precision_m: d >= 3 ? 100 : d === 2 ? 1000 : 10000, source: $t.k8 };
}
const R = 6371008.8, rad = x => x * Math.PI / 180;
function dist(a, b) { const dl = rad(b.lat - a.lat), dn = rad(b.lng - a.lng); const h = Math.sin(dl / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dn / 2) ** 2; return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(h)))); }
const fnum = (v, lo, hi) => typeof v === $q.am && isFinite(v) && v >= lo && v <= hi ? v : null;
const hex64 = v => typeof v === $q.f && /^[0-9a-f]{64}$/.test(v) ? v : null;
const isoT = v => { if (typeof v !== $q.f || v.length > 40) return null; const d = new Date(v); return isNaN(d) ? null : d.toISOString(); };
async function sha256hex(s) { const b = await crypto.subtle.digest($q.an, new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function limited(req, ctx, name, max) {
const ip = req.headers.get($q.ao) || 'x', hour = new Date().toISOString().slice(0, 13);
const k = new Request(ORIGIN + $q.ap + name + '/' + encodeURIComponent(ip) + '/' + hour);
const hit = await caches.default.match(k); const n = hit ? (+(await hit.text()) || 0) : 0;
if (n >= max) return true;
const p = caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': $q.aq } }));
if (ctx && ctx.waitUntil) ctx.waitUntil(p.catch(() => {})); else await p.catch(() => {});
return false;
}
async function visit(req, env, ctx) {
const o = req.headers.get($q.ar); if (o && o !== ORIGIN) return out({ error: $q.ar }, 403);
if (+(req.headers.get($q.as) || 0) > 32768) return out({ error: $q.at }, 413);
let b; try { const txt = await req.text(); if (txt.length > 32768) return out({ error: $q.at }, 413); b = JSON.parse(txt); } catch (e) { return out({ error: $q.au }, 400); }
if (await limited(req, ctx, 'visit', 20)) return out({ error: 'rate', note: $t.k9 }, 429);
const { data } = await import('./kbx_named.js');
const ix = await data(env).catch(() => null);
const pid = String(b.project || '').toUpperCase();
const x = ix && ix.byId.get(pid); if (!x) return out({ error: $q.av, note: $t.k10 }, 400);
const pin = pinOf(x); if (!pin) return out({ error: $q.aw }, 400);
const pos = b.position || {};
const lat = fnum(pos.lat, -90, 90), lng = fnum(pos.lng, -180, 180), acc = fnum(pos.accuracy_m, 0, 100000);
const photos = (Array.isArray(b.photos) ? b.photos : []).slice(0, 40).map(p => {
const g = p && p.exif_gps ? { lat: fnum(p.exif_gps.lat, -90, 90), lng: fnum(p.exif_gps.lng, -180, 180) } : null;
return hex64(p && p.sha256) ? { sha256: p.sha256, bytes: fnum(p.bytes, 0, 2e9), type: typeof p.type === $q.f ? p.type.slice(0, 40) : null,
exif_time: typeof p.exif_time === $q.f ? p.exif_time.slice(0, 25) : null, exif_gps: g && g.lat != null && g.lng != null ? g : null, captured_at: isoT(p.captured_at) } : null;
}).filter(Boolean);
if (!photos.length && lat == null) return out({ error: 'empty', note: $t.k11 }, 400);
const now = new Date(), at = now.toISOString().replace(/\.\d+Z$/, 'Z'), dev = isoT(b.device_time);
const checks = { received_at: at, pin, circle_m: 150,
device_clock_minus_server_s: dev ? Math.round((new Date(dev) - now) / 1000) : null,
position_distance_m: lat != null && lng != null ? dist(pin, { lat, lng }) : null,
photos: photos.map(p => ({ sha256: p.sha256, exif_gps_distance_m: p.exif_gps ? dist(pin, p.exif_gps) : null })) };
checks.position_inside_circle = checks.position_distance_m == null ? null : checks.position_distance_m <= 150 + Math.min(acc || 0, 500);
const subject = { type: $q.ax, project: { id: x.id, name: x.n || null, market: x.mk || null, page: ORIGIN + $q.ay + x.s + '/' },
reported_by_browser: { position: lat != null && lng != null ? { lat, lng, accuracy_m: acc } : null, device_time: dev, photos },
checked_by_kolaboro: checks,
note: $s.k2 };
const lines = photos.map(p => $q.az + p.sha256).sort();
const { jcs, issue } = await import('./kbx_acct.js');
lines.push($q.aA + await sha256hex(jcs(Object.assign({}, subject, { photos_hashed: lines.length }))));
const root = await sha256hex(lines.join('\n'));
subject.rootSha256 = root; subject.sealLines = lines;
subject.sealMethod = $s.k3;
let stamp = { status: $q.aB };
try {
const { api } = await import('./kolaboro.js');
const r = await api(new Request(ORIGIN + $q.aC, { method: 'POST', headers: { 'content-type': $q.aD, 'cf-connecting-ip': req.headers.get($q.ao) || 'x' }, body: JSON.stringify({ hash: root, source: 'visit' }) }), new URL(ORIGIN + $q.aC), env, ctx);
const d = await r.json().catch(() => ({}));
stamp = d.stamp ? { status: $q.aE, created_at: d.stamp.created_at || null, calendars: d.stamp.calendars || null, verify: ORIGIN + $q.aF + root } : { status: d.error === 'rate' ? $q.aG : $q.aB };
} catch (e) { stamp = { status: 'error' }; }
subject.timestamp = stamp;
const doc = { '@context': [$q.aH], id: $q.aI + root, type: [$q.aJ, $q.aK], name: $q.aL,
description: $s.k4,
issuer: { id: $q.aM, name: $q.aN }, validFrom: at, credentialSubject: subject };
const vc = await issue(env, doc, at);
if (!vc) return out({ error: $q.aO, unsigned: doc }, 503);
return out({ vc, root, stamp, verify: ORIGIN + $q.aP, stored: false });
}
export async function handle(req, u, env, ctx) {
const p = u.pathname.replace(/\/+$/, '');
if (req.method === $q.aQ) return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': $q.aR, 'access-control-allow-headers': $q.aS, 'access-control-max-age': '86400' } });
try {
if (p === $q.aT) return req.method === 'POST' ? await visit(req, env, ctx) : out({ error: $q.Q, use: 'POST' }, 405);
if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: $q.Q }, 405);
const { data } = await import('./kbx_named.js');
const ix = await data(env).catch(() => null);
if (!ix) return out({ error: $q.aU }, 503);
if (p === $q.aV) {
const q = String(u.searchParams.get('q') || '').trim().toLowerCase().slice(0, 80), id = String(u.searchParams.get('id') || '').toUpperCase();
let L = [];
if (id) { const x = ix.byId.get(id) || ix.bySlug.get(id.toLowerCase()); if (x) L = [x]; }
else if (q.length >= 2) {
const nq = q.normalize('NFKD').replace(/[̀-ͯ]/g, '');
for (const x of ix.P) {
const hay = (x.id + ' ' + (x.n || '') + ' ' + (x.dv || '') + ' ' + (x.mk || '') + ' ' + (x.ar || '') + ' ' + x.s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
if (hay.includes(nq) && pinOf(x)) { L.push(x); if (L.length >= 12) break; }
}
}
return out({ q, results: L.filter(pinOf).map(x => ({ id: x.id, name: x.n || null, developer: x.dv || null, market: x.mk || null, area: x.ar || null, url: $q.ay + x.s + '/', pin: pinOf(x) })) }, 200, $q.aW);
}
const m = p.match(/^\/api\/x\/space\/([A-Za-z0-9-]{3,20})$/);
if (m) {
const id = m[1].toUpperCase(), x = ix.byId.get(id);
if (!x) return out({ id, named: false }, 404, $q.aW);
const sp = await spaceData(env), bd = sp.bld;
const b = bd && bd.projects && bd.projects[id];
return out({ id, named: true, name: x.n || null, url: $q.ay + x.s + '/', pin: pinOf(x), radar: radarSeries(sp, id),
buildings: b ? Object.assign({ release: bd.release, registry_start: bd.registry_start, radius_m: bd.radius_m, updated: bd.updated, source: bd.source }, b) : null }, 200, $q.aX);
}
return out({ error: $q.aY, see: [$q.aZ, $q.ba, $q.bb] }, 404);
} catch (e) { return out({ error: $q.bc }, 500); }
}
