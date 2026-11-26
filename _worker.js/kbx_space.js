// comments: _notes/kolaboro-worker-comments.txt
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
let MEMO = null;
async function loadOne(env, name) {
let r = null;
try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); } catch (e) { r = null; }
if (!r || !r.ok) { try { r = await fetch(ORIGIN + '/data/' + name, { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
return r && r.ok ? await r.json().catch(() => null) : null;
}
export async function spaceData(env) {
if (!S.es) { const si = await loadOne(env, 'media-i18n.json'); if (si && si.space) S = si.space; }
if (MEMO && Date.now() - MEMO.t < 600000) return MEMO.v;
const [radar, bld] = await Promise.all([loadOne(env, 'satellite-radar.json'), loadOne(env, 'buildings.json')]);
const v = { radar, bld, v: ((radar && radar.updated) || '') + '/' + ((bld && bld.updated) || '') };
MEMO = { t: Date.now(), v }; return v;
}
let S = { en: {} };
const t = (lang, k, v) => { const s = (S[lang] && S[lang][k]) || S.en[k] || ''; return v && typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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
let g = band ? '<rect class="band" x="' + L + '" y="' + Y(band).toFixed(1) + '" width="' + iw + '" height="' + (Y(-band) - Y(band)).toFixed(1) + '"/>' : '';
const st = lim > 8 ? Math.ceil(lim / 4) : lim > 4 ? 2 : 1;
for (let v = -Math.floor(lim / st) * st; v <= lim; v += st) g += '<line class="' + (v ? 'gl' : 'ax') + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text x="' + (L - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end">' + sg(v) + '</text>';
for (let y = Math.floor(m0 / 12) + 1; y * 12 < end; y++) { const x = X(y * 12); g += '<line class="gl" x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + T + '" y2="' + (T + ih) + '"/><text x="' + x.toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + y + '</text>'; }
for (const o of ms || []) if (!o.old && o.a >= m0 && o.a < end) g += '<line class="ml" x1="' + X(o.a).toFixed(1) + '" x2="' + X(o.a).toFixed(1) + '" y1="' + T + '" y2="' + (T + ih) + '"><title>' + esc(fd(o.d)) + '</title></line>';
const pts = []; for (let i = 0; i < n; i++) if (rec.y[i] != null) pts.push([X(m0 + i + 0.5), Y(rec.y[i]), i]);
if (pts.length) g += '<path class="rl" d="M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + '"/>';
for (const [x, y, i] of pts) g += '<circle class="rp" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.4"><title>' + esc(fd(ym(m0 + i)) + ': ' + sg(rec.y[i]) + ' dB') + '</title></circle>';
return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t(lang, 'raria', { a: fd(rec.m0), b: fd(ym(end - 1)) })) + '">' + g + '</svg>';
}
function radarHtml(rd, id, lang, fd, ms, opt) {
const rec = rd && rd.projects && rd.projects[id];
if (!rec || !rec.n || !rec.m0) return '';
const m0 = mi(rec.m0), n = rec.n, months = Array.from({ length: n }, (_, i) => ym(m0 + i));
const k = rec.months_ok || 0, tr = rec.track || {};
let h = '<h3>' + esc(t(lang, 'rh')) + '</h3><p class="ki">' + esc(t(lang, 'ri', { c: opt && opt.cloudy != null ? opt.cloudy : '-', n: opt && opt.n || n, o: (TB.kbx_space__t.o_OD[lang] || TB.kbx_space__t.o_OD.en)[tr.orbit] || tr.orbit || '-', r: tr.relative_orbit != null ? tr.relative_orbit : '-' })) + '</p><ul class="ksat-sum"><li>' + esc(t(lang, 'rk', { k, n })) + '</li>';
const band = rd.band_db;
if (rec.status === 'ok' && rec.sum && rec.y) {
const s = rec.sum, big = band != null && Math.abs(s.y_last) > band;
h += '<li>' + (band != null ? '<b>' + esc(t(lang, big ? 'rvis' : 'rnov', { band: '±' + band })) + ' </b>' : '') + esc(t(lang, 'rx', { a: fd(s.last[0]), b: fd(s.last[1]), x: sg(s.y_last), base: fd(s.first[0]) + (s.first[1] !== s.first[0] ? ' - ' + fd(s.first[1]) : '') })) + '</li>';
h += '<li>' + esc(t(lang, 'rv', { v1: s.vv_first, v2: s.vv_last, r1: s.rvv_first, r2: s.rvv_last })) + '</li></ul>';
h += TB.kbx_space__t.k0 + rchart(rec, band, ms, lang, fd, 720) + '</div><div dir="ltr" class="ksat-n">' + rchart(rec, band, ms, lang, fd, 360) + TB.kbx_space__t.k1 + esc(t(lang, 'rlx')) + '</li>' + (band != null ? '<li><i class="b"></i>' + esc(t(lang, 'rlb')) + ' (±' + band + ' dB)</li>' : '') + ((ms || []).some(o => !o.old) ? '<li><i class="m"></i>' + esc(t(lang, 'rlm')) + '</li>' : '') + '</ul></figure>';
} else h += '<li>' + esc(t(lang, 'rfew', { k, n })) + '</li></ul>';
h += '<p class="ksat-lim">' + esc(t(lang, 'rlim')) + '</p>';
h += '<p class="ksat-src">' + esc(rd.source.attribution) + '. <a class="src" href="' + esc(rd.source.url) + TB.kbx_space__s.k0 + esc(rd.source.licence_url) + TB.kbx_space__t.k2 + esc(t(lang, 'method')) + ', ' + esc(t(lang, 'upd', { d: fd(rd.updated) })) + '</a></p>';
if (k) {
const th = t(lang, 'rth'), f = v => v == null ? '' : String(v);
const rows = months.map((m, i) => '<tr><td>' + esc(fd(m)) + '</td><td>' + esc(rec.dt[i] ? fd(rec.dt[i]) : t(lang, 'none')) + '</td><td>' + (rec.ns[i] || '') + '</td><td>' + f(rec.vv[i]) + '</td><td>' + f(rec.rvv[i]) + '</td><td>' + (rec.y && rec.y[i] != null ? sg(rec.y[i]) : '') + '</td></tr>').reverse().join('');
h += '<details><summary>' + esc(t(lang, 'rtbl')) + TB.kbx_space__t.k3 + th.map(x => '<th>' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div></details>';
}
return h;
}
function bldHtml(bd, id, lang, fd, num) {
const rec = bd && bd.projects && bd.projects[id];
if (!rec) return '';
const rel = bd.release, rs = bd.registry_start;
let h = '<h3>' + esc(t(lang, 'bh')) + '</h3><ul class="ksat-sum">';
if (!rec.n) h += '<li>' + esc(t(lang, 'b0', { rel: fd(relDate(rel)) })) + '</li>';
else {
h += '<li><b>' + esc(t(lang, 'bn', { n: num(rec.n), p: rec.cover_pct })) + '</b></li>';
if (rec.first_seen_min) {
h += '<li>' + esc(rec.first_seen_min === rec.first_seen_max ? t(lang, 'bfs', { a: fd(relDate(rec.first_seen_min)) }) : t(lang, 'bf', { a: fd(relDate(rec.first_seen_min)), b: fd(relDate(rec.first_seen_max)) }));
if (rs) { const nw = Object.entries(rec.first_seen || {}).filter(([r]) => r > rs).reduce((a, [, c]) => a + c, 0); h += ' ' + esc(t(lang, 'bnew', { s: fd(relDate(rs)), k: num(nw) })) + ' ' + esc(t(lang, 'breg', { s: fd(relDate(rs)) })); }
h += '</li>';
}
const src = Object.entries(rec.by_source || {}).sort((a, b) => b[1] - a[1]).map(([d, c]) => d + ' ' + num(c)).join(', ');
if (src) h += '<li>' + esc(t(lang, 'bsrc', { l: src })) + '</li>';
if (rec.max_height_m || rec.max_floors) h += '<li>' + esc(t(lang, 'btall', { h: [rec.max_height_m ? t(lang, 'bm', { h: num(rec.max_height_m) }) : '', rec.max_floors ? t(lang, 'bfl', { f: rec.max_floors }) : ''].filter(Boolean).join(', ') })) + '</li>';
}
h += '</ul><p class="ksat-lim">' + esc(t(lang, 'blim')) + '</p>';
h += '<p class="ksat-src">' + esc(bd.source.attribution) + '. <a class="src" href="' + esc(bd.source.url) + TB.kbx_space__t.k4 + esc(rel) + '</a> <a class="src" href="' + esc(bd.source.licence_url) + TB.kbx_space__t.k5 + esc(bd.source.attribution_url) + TB.kbx_space__s.k1 + esc(t(lang, 'method')) + ', ' + esc(t(lang, 'upd', { d: fd(bd.updated) })) + '</a></p>';
if (rec.b && rec.b.length) {
const th = t(lang, 'bth');
const rows = rec.b.map(b => '<tr><td>' + num(b.d) + ' m</td><td>' + num(b.m2) + ' m²</td><td>' + (b.h ? num(b.h) + ' m' : '') + '</td><td>' + (b.f || '') + '</td><td>' + esc((b.src || []).join(', ')) + '</td><td>' + esc(b.fs ? fd(relDate(b.fs)) : '') + '</td><td><code title="' + esc(b.id) + '">' + esc(String(b.id).slice(0, 8)) + '</code></td></tr>').join('');
h += '<details><summary>' + esc(t(lang, 'btbl')) + ' (' + num(rec.b.length) + (rec.n > rec.b.length ? ' / ' + num(rec.n) : '') + TB.kbx_space__t.k6 + th.map(x => '<th>' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div></details>';
}
return h;
}
const dtf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'd' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.DateTimeFormat(L, o)); };
const nmf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'n' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.NumberFormat(L, o)); };
export function spaceHtml(sp, id, lang, fd, ms, opt) {
if (!sp) return '';
const num = v => { try { return nmf(lang === 'en' ? 'en-GB' : lang).format(v); } catch (e) { return String(v); } };
const a = radarHtml(sp.radar, id, lang, fd, ms, opt), b = bldHtml(sp.bld, id, lang, fd, num);
const lk = TB.kbx_space__t.k7 + encodeURIComponent(id) + (lang !== 'en' ? '&amp;lang=' + lang : '') + '">' + esc(t(lang, 'sv')) + '</a></p>';
return a || b ? TB.kbx_space__s.CSS + '<div class="kspace">' + a + b + lk + '</div>' : '';
}
export function radarSeries(sp, id) {
const rd = sp && sp.radar, rec = rd && rd.projects && rd.projects[id];
if (!rec) return null;
return { m0: rec.m0, n: rec.n, y: rec.y || null, yh: rec.yh || null, vv: rec.vv, rvv: rec.rvv, date: rec.dt, status: rec.status, track: rec.track, band_db: rd.band_db, unit: 'dB',
updated: rd.updated, source: { attribution: rd.source.attribution, url: rd.source.url, licence_url: rd.source.licence_url, method: '/data/satellite-radar.json' } };
}
export const PATHS = /^\/api\/x\/space\//;
const H = { 'content-type': 'application/json; charset=utf-8', 'x-content-type-options': 'nosniff', 'access-control-allow-origin': '*' };
const out = (o, st, cc) => new Response(JSON.stringify(o), { status: st || 200, headers: Object.assign({ 'cache-control': cc || 'no-store' }, H) });
const decs = v => { const s = String(v); const i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1; };
function pinOf(x) {
const fx = x.fx || {};
if (typeof fx.lat !== 'number' || typeof fx.lng !== 'number' || Math.abs(fx.lat) > 90 || Math.abs(fx.lng) > 180) return null;
const d = Math.min(decs(fx.lat), decs(fx.lng));
return { lat: fx.lat, lng: fx.lng, precision_m: d >= 3 ? 100 : d === 2 ? 1000 : 10000, source: TB.kbx_space__t.k8 };
}
const R = 6371008.8, rad = x => x * Math.PI / 180;
function dist(a, b) { const dl = rad(b.lat - a.lat), dn = rad(b.lng - a.lng); const h = Math.sin(dl / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dn / 2) ** 2; return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(h)))); }
const fnum = (v, lo, hi) => typeof v === 'number' && isFinite(v) && v >= lo && v <= hi ? v : null;
const hex64 = v => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v) ? v : null;
const isoT = v => { if (typeof v !== 'string' || v.length > 40) return null; const d = new Date(v); return isNaN(d) ? null : d.toISOString(); };
async function sha256hex(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function limited(req, ctx, name, max) {
const ip = req.headers.get('cf-connecting-ip') || 'x', hour = new Date().toISOString().slice(0, 13);
const k = new Request(ORIGIN + '/__ksp_rl/' + name + '/' + encodeURIComponent(ip) + '/' + hour);
const hit = await caches.default.match(k); const n = hit ? (+(await hit.text()) || 0) : 0;
if (n >= max) return true;
const p = caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=3600' } }));
if (ctx && ctx.waitUntil) ctx.waitUntil(p.catch(() => {})); else await p.catch(() => {});
return false;
}
async function visit(req, env, ctx) {
const o = req.headers.get('origin'); if (o && o !== ORIGIN) return out({ error: 'origin' }, 403);
if (+(req.headers.get('content-length') || 0) > 32768) return out({ error: 'too_large' }, 413);
let b; try { const txt = await req.text(); if (txt.length > 32768) return out({ error: 'too_large' }, 413); b = JSON.parse(txt); } catch (e) { return out({ error: 'bad_request' }, 400); }
if (await limited(req, ctx, 'visit', 20)) return out({ error: 'rate', note: TB.kbx_space__t.k9 }, 429);
const { data } = await import('./kbx_named.js');
const ix = await data(env).catch(() => null);
const pid = String(b.project || '').toUpperCase();
const x = ix && ix.byId.get(pid); if (!x) return out({ error: 'project', note: TB.kbx_space__t.k10 }, 400);
const pin = pinOf(x); if (!pin) return out({ error: 'no_pin' }, 400);
const pos = b.position || {};
const lat = fnum(pos.lat, -90, 90), lng = fnum(pos.lng, -180, 180), acc = fnum(pos.accuracy_m, 0, 100000);
const photos = (Array.isArray(b.photos) ? b.photos : []).slice(0, 40).map(p => {
const g = p && p.exif_gps ? { lat: fnum(p.exif_gps.lat, -90, 90), lng: fnum(p.exif_gps.lng, -180, 180) } : null;
return hex64(p && p.sha256) ? { sha256: p.sha256, bytes: fnum(p.bytes, 0, 2e9), type: typeof p.type === 'string' ? p.type.slice(0, 40) : null,
exif_time: typeof p.exif_time === 'string' ? p.exif_time.slice(0, 25) : null, exif_gps: g && g.lat != null && g.lng != null ? g : null, captured_at: isoT(p.captured_at) } : null;
}).filter(Boolean);
if (!photos.length && lat == null) return out({ error: 'empty', note: TB.kbx_space__t.k11 }, 400);
const now = new Date(), at = now.toISOString().replace(/\.\d+Z$/, 'Z'), dev = isoT(b.device_time);
const checks = { received_at: at, pin, circle_m: 150,
device_clock_minus_server_s: dev ? Math.round((new Date(dev) - now) / 1000) : null,
position_distance_m: lat != null && lng != null ? dist(pin, { lat, lng }) : null,
photos: photos.map(p => ({ sha256: p.sha256, exif_gps_distance_m: p.exif_gps ? dist(pin, p.exif_gps) : null })) };
checks.position_inside_circle = checks.position_distance_m == null ? null : checks.position_distance_m <= 150 + Math.min(acc || 0, 500);
const subject = { type: 'SiteVisitRecord', project: { id: x.id, name: x.n || null, market: x.mk || null, page: ORIGIN + '/projects/' + x.s + '/' },
reported_by_browser: { position: lat != null && lng != null ? { lat, lng, accuracy_m: acc } : null, device_time: dev, photos },
checked_by_kolaboro: checks,
note: TB.kbx_space__s.k2 };
const lines = photos.map(p => 'photo ' + p.sha256).sort();
const { jcs, issue } = await import('./kbx_acct.js');
lines.push('subject ' + await sha256hex(jcs(Object.assign({}, subject, { photos_hashed: lines.length }))));
const root = await sha256hex(lines.join('\n'));
subject.rootSha256 = root; subject.sealLines = lines;
subject.sealMethod = TB.kbx_space__s.k3;
let stamp = { status: 'not_stamped' };
try {
const { api } = await import('./kolaboro.js');
const r = await api(new Request(ORIGIN + '/api/kb/stamp', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': req.headers.get('cf-connecting-ip') || 'x' }, body: JSON.stringify({ hash: root, source: 'visit' }) }), new URL(ORIGIN + '/api/kb/stamp'), env, ctx);
const d = await r.json().catch(() => ({}));
stamp = d.stamp ? { status: 'submitted', created_at: d.stamp.created_at || null, calendars: d.stamp.calendars || null, verify: ORIGIN + '/api/kb/stamp?hash=' + root } : { status: d.error === 'rate' ? 'rate_limited' : 'not_stamped' };
} catch (e) { stamp = { status: 'error' }; }
subject.timestamp = stamp;
const doc = { '@context': ['https://www.w3.org/ns/credentials/v2'], id: 'urn:sha256:' + root, type: ['VerifiableCredential', 'KolaboroSiteVisitRecord'], name: 'Kolaboro site-visit record',
description: TB.kbx_space__s.k4,
issuer: { id: 'did:web:kolaboro.com', name: 'Kolaboro' }, validFrom: at, credentialSubject: subject };
const vc = await issue(env, doc, at);
if (!vc) return out({ error: 'signing_unavailable', unsigned: doc }, 503);
return out({ vc, root, stamp, verify: ORIGIN + '/verify/#vc', stored: false });
}
export async function handle(req, u, env, ctx) {
const p = u.pathname.replace(/\/+$/, '');
if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400' } });
try {
if (p === '/api/x/space/visit') return req.method === 'POST' ? await visit(req, env, ctx) : out({ error: 'method', use: 'POST' }, 405);
if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: 'method' }, 405);
const { data } = await import('./kbx_named.js');
const ix = await data(env).catch(() => null);
if (!ix) return out({ error: 'unavailable' }, 503);
if (p === '/api/x/space/pins') {
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
return out({ q, results: L.filter(pinOf).map(x => ({ id: x.id, name: x.n || null, developer: x.dv || null, market: x.mk || null, area: x.ar || null, url: '/projects/' + x.s + '/', pin: pinOf(x) })) }, 200, 'public, max-age=300');
}
const m = p.match(/^\/api\/x\/space\/([A-Za-z0-9-]{3,20})$/);
if (m) {
const id = m[1].toUpperCase(), x = ix.byId.get(id);
if (!x) return out({ id, named: false }, 404, 'public, max-age=300');
const sp = await spaceData(env), bd = sp.bld;
const b = bd && bd.projects && bd.projects[id];
return out({ id, named: true, name: x.n || null, url: '/projects/' + x.s + '/', pin: pinOf(x), radar: radarSeries(sp, id),
buildings: b ? Object.assign({ release: bd.release, registry_start: bd.registry_start, radius_m: bd.radius_m, updated: bd.updated, source: bd.source }, b) : null }, 200, 'public, max-age=600');
}
return out({ error: 'not_found', see: ['/api/x/space/<ID>', '/api/x/space/pins?q=', 'POST /api/x/space/visit'] }, 404);
} catch (e) { return out({ error: 'server' }, 500); }
}
