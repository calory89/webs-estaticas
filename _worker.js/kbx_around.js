// comments: _notes/kolaboro-worker-comments.txt
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
export const PATHS = /^\/api\/x\/around(\/|$)/;
let MEMO = {};
async function loadOne(env, name) {
const m = MEMO[name]; if (m && Date.now() - m.t < 600000) return m.v;
let r = null;
try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); } catch (e) { r = null; }
if (!r || !r.ok) { try { r = await fetch(ORIGIN + '/data/' + name + '?w=1', { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
const v = r && r.ok ? await r.json().catch(() => null) : null;
MEMO[name] = { t: Date.now(), v }; return v;
}
export async function aroundData(env) {
const [ar, cl, dc] = await Promise.all([loadOne(env, 'around.json'), loadOne(env, 'climate.json'), loadOne(env, 'distance-claims.json')]);
return { ar, cl, dc, v: ((ar && ar.updated) || '') + '/' + ((cl && cl.updated) || '') + '/' + ((dc && dc.updated) || '') };
}
export const aroundPin = (ad, id) => { const r = ad && ad.ar && ad.ar.projects && ad.ar.projects[id]; return r ? r.pin : null; };
const S = TB.kbx_around_S ;
const t = (lang, k, v) => { const s = (S[lang] && S[lang][k]) || S.en[k]; return v && typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
const tm = (lang, k, key) => ((S[lang] && S[lang][k]) || {})[key] || (S.en[k] || {})[key] || null;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cm = lang => lang === 'ar' ? '، ' : lang === 'zh' ? '，' : ', ';
const okU = u => typeof u === 'string' && /^https:\/\/[^\s"<>]+$/.test(u);
export const aroundToc = lang => t(lang, 'toc');
export const aroundHeading = lang => t(lang, 'h');
export const climateToc = lang => t(lang, 'ctoc');
export const climateHeading = lang => t(lang, 'ch');
const nmf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'n' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.NumberFormat(L, o)); };
const num = (v, lang, o) => { try { return nmf(lang === 'en' ? 'en-GB' : lang, o).format(v); } catch (e) { return String(v); } };
const src = (href, label) => okU(href) ? '<a class="k-src" href="' + esc(href) + '" rel="noopener" target="_blank">' + esc(label) + '</a>' : '';
const UNIT = { m: { ru: 'м', zh: '米', ar: 'م' }, km: { ru: 'км', zh: '公里', ar: 'كم' } };
const un = (lang, u) => (UNIT[u] || {})[lang] || u;
const dist = (m, lang) => m < 100 ? t(lang, 'u100') : m < 1000 ? num(Math.round(m / 10) * 10, lang) + ' ' + un(lang, 'm') : num(Math.round(m / 100) / 10, lang, { maximumFractionDigits: m < 20000 ? 1 : 0 }) + ' ' + un(lang, 'km');
const dist2 = (m, lang) => m < 1000 ? num(Math.round(m / 10) * 10, lang) + ' ' + un(lang, 'm') : num(Math.round(m / 100) / 10, lang, { maximumFractionDigits: m < 20000 ? 1 : 0 }) + ' ' + un(lang, 'km');
const mapU = ll => Array.isArray(ll) && isFinite(ll[0]) && isFinite(ll[1]) ? 'https://www.openstreetmap.org/?mlat=' + (+ll[0]).toFixed(5) + '&mlon=' + (+ll[1]).toFixed(5) + '#map=16/' + (+ll[0]).toFixed(5) + '/' + (+ll[1]).toFixed(5) : '';
const bd = s => '<bdi>' + esc(s) + '</bdi>';
const buildDate = (b, fd) => /^\d{8}$/.test(String(b || '')) ? fd(String(b).slice(0, 4) + '-' + String(b).slice(4, 6) + '-' + String(b).slice(6, 8)) : String(b || '');
function place(o, lang, withKind) {   // "Name (kind), 480 m map"
  const nm = o.n ? bd(o.n) + (o.iata ? ' (' + esc(o.iata) + ')' : '') : '<span class="k-muted">' + esc(t(lang, 'noname')) + '</span>';
  const k = withKind && o.k && tm(lang, 'sk', o.k) ? ' (' + esc(tm(lang, 'sk', o.k)) + ')' : '';
  return nm + k + cm(lang) + esc(dist(o.d, lang)) + ' ' + src(mapU(o.ll), t(lang, 'map'));
}
function claimsHtml(ad, x, lang, fd) {
const dc = ad && ad.dc, r = dc && dc.projects && dc.projects[x.id];
let h = '<h3 id="distance-claims">' + esc(t(lang, 'c_h')) + '</h3>';
if (!r) return h + '<p class="k-muted">' + esc(t(lang, 'c_nocopy')) + '</p>';
const copy = /^[0-9a-f]{64}$/.test(r.sha || '') ? '/projects/' + encodeURIComponent(x.s) + '/changes/' + r.sha + '.txt' : '';
if (r.index) return h + '<p class="k-muted">' + esc(t(lang, 'c_index')) + '</p>';
const cl = (r.c || []).filter(c => c && c.q && (c.t || c.none != null));
const cp = copy ? ' <a class="k-src" href="' + esc(copy) + '">' + esc(t(lang, 'c_copy')) + '</a>' : '';
if (!cl.length) h += '<p>' + esc(t(lang, 'c_zero', { d: fd(r.d) })) + cp + '</p>';
else {
h += '<p class="ki">' + esc(t(lang, 'c_intro', { d: fd(r.d) })) + cp + TB.kbx_around__t.k0 + esc(t(lang, 'c_th1')) + '</th><th>' + esc(t(lang, 'c_th2')) + '</th></tr></thead><tbody>' +
cl.map(c => {
let m;
if (!c.t) m = esc(tm(lang, 'cn', c.cat) || c.cat) + ': ' + esc(t(lang, 'c_none', { km: num(c.none, lang) }));
else {
const T = c.t, who = c.matched && T.n ? bd(T.n) + (T.iata ? ' (' + esc(T.iata) + ')' : '') : esc(tm(lang, 'cn', c.cat) || c.cat) + (T.n ? ': ' + bd(T.n) + (T.iata ? ' (' + esc(T.iata) + ')' : '') : '');
const li = [T.in ? esc(t(lang, 'c_in')) : esc(t(lang, 'c_sl', { d: dist(T.d, lang) })) + ' ' + src(mapU(T.ll), t(lang, 'map'))];
if (Array.isArray(c.car)) li.push(esc(t(lang, 'c_car', { d: dist2(c.car[0], lang), m: num(Math.max(1, Math.round(c.car[1] / 60)), lang) })));
if (Array.isArray(c.foot)) li.push(esc(t(lang, 'c_foot', { d: dist2(c.foot[0], lang), m: num(Math.max(1, Math.round(c.foot[1] / 60)), lang) })));
m = who + '<ul>' + li.map(s => '<li>' + s + '</li>').join('') + '</ul>';
}
return '<tr><td data-label="' + esc(t(lang, 'c_th1')) + '"><q><bdi>' + esc(c.q) + '</bdi></q></td><td data-label="' + esc(t(lang, 'c_th2')) + '">' + m + '</td></tr>';
}).join('') + '</tbody></table></div>';
}
if (r.o > 0 && (r.ox || []).length) h += '<p class="k-muted">' + esc(t(lang, 'c_other', { q: '\u0001' })).replace('\u0001', bd(r.ox[0])) + '</p>';
return h + '<p class="lim">' + esc(t(lang, 'c_lim')) + ' ' + src('https://routing.openstreetmap.de/', t(lang, 'c_src')) + '</p>';
}
export function aroundHtml(ad, x, lang, fd) {
const ar = ad && ad.ar, r = ar && ar.projects && ar.projects[x.id];
if (!r) return '';
const rows = [], none = o => '<span class="k-muted">' + esc(t(lang, 'none', { km: num(o.none, lang) })) + '</span>';
const simple = k => { const o = r[k]; if (!o) return; rows.push([t(lang, k), o.d != null ? (o.in ? esc(t(lang, 'sea_in')) : esc(dist(o.d, lang)) + ' ' + src(mapU(o.ll), t(lang, 'map'))) : none(o)]); };
simple('coast'); simple('beach');
if (r.airport) rows.push([t(lang, 'airport'), r.airport.d != null ? place(r.airport, lang) + (r.airport2 && r.airport2.d != null && r.airport2.d <= 75000 ? '<br>' + place(r.airport2, lang) : '') : none(r.airport)]);
if (r.runway) {
const o = r.runway;
if (o.d == null) rows.push([t(lang, 'runway'), none(o)]);
else {
const w = o.u5 ? [o.ref ? esc(t(lang, 'rw_ref', { r: o.ref })) : '', o.n ? bd(o.n) + (o.iata ? ' (' + esc(o.iata) + ')' : '') : ''].filter(Boolean).join(cm(lang)) : '';
rows.push([t(lang, 'runway'), esc(t(lang, o.u5 ? 'rw_u5' : 'rw_far', { d: dist(o.d, lang), w: '\u0001' })).replace('\u0001', w ? ' (' + w + ')' : '') + (o.u5 && !o.n ? ' ' + esc(t(lang, 'rw_anon')) : '') + ' ' + src(mapU(o.ll), t(lang, 'map'))]);
}
}
for (const k of ['hospital', 'school', 'supermarket', 'stop', 'rail']) {
const o = r[k]; if (!o || o.same) continue;
rows.push([t(lang, k), o.d != null ? place(o, lang, k === 'stop' || k === 'rail') : none(o)]);
}
const A = ar.air || {}, q = r.aq;
if (q && (q.pm25 != null || q.no2 != null)) {
const f1 = v => v == null ? '?' : num(v, lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
rows.push([t(lang, 'air', { y: q.y || A.year || '' }), esc(t(lang, 'air_v', { p: f1(q.pm25), n: f1(q.no2) })) + ' ' + esc(t(lang, 'air_who')) + ' ' + src((A.who || {}).url, t(lang, 'who')) +
'<br><span class="k-muted k-small">' + esc(t(lang, 'air_lim')) + '</span> ' + src(A.via_url, t(lang, 'air_src'))]);
}
if (!rows.length) return '';
const p = String(r.pin || '').split(','), hq = p.length === 2 && isFinite(+p[0]) && isFinite(+p[1]) ? '?lat=' + (+p[0]).toFixed(4) + '&lng=' + (+p[1]).toFixed(4) : '';
return TB.kbx_around__s.CSS + '<div class="karo"><p class="ki">' + esc(t(lang, 'intro', { b: buildDate(ar.osm_build, fd), a: num(r.acc || 100, lang) })) + '</p>' +
'<dl class="kl-led">' + rows.map(([a, b]) => '<dt>' + esc(a) + '</dt><dd>' + b + '</dd>').join('') + '</dl>' +
'<p class="lim">' + esc(t(lang, 'lim')) + ' ' + src(TB.kbx_around__t.k1, t(lang, 'osm')) + '</p>' + claimsHtml(ad, x, lang, fd) +
'<p class="srcl"><a href="/hazards/' + esc(hq) + '">' + esc(t(lang, 'hz')) + '</a><a href="/api/x/around/' + encodeURIComponent(x.id) + '">' + esc(t(lang, 'method')) + cm(lang) + esc(t(lang, 'upd', { d: fd(ar.updated) })) + '</a></p></div>';
}
export function climateHtml(ad, x, lang, fd) {
const cl = ad && ad.cl, r = cl && cl.projects && cl.projects[x.id];
if (!r) return '';
const cols = [['h', 'col_h'], ['m', 'col_m'], ['x', 'col_x']], rowsK = ['hd35', 'tr', 'pr', 'r20mm'].filter(k => r[k] && cols.every(([c]) => Array.isArray(r[k][c])));
if (!rowsK.length) return '';
const f = (v, k) => num(v, lang, { maximumFractionDigits: k !== 'pr' && Math.abs(v) < 10 ? 1 : 0 });
const cell = (a, k) => '<span><b>' + esc(f(a[0], k)) + '</b> <small>(' + esc(t(lang, 'rg', { a: f(a[1], k), b: f(a[2], k) })) + ')</small></span>';
const s = cl.source || {}, p = String(r.pin || '').split(','), hq = p.length === 2 && isFinite(+p[0]) && isFinite(+p[1]) ? '?lat=' + (+p[0]).toFixed(4) + '&lng=' + (+p[1]).toFixed(4) : '';
return (ad.ar && ad.ar.projects && ad.ar.projects[x.id] ? '' : TB.kbx_around__s.CSS) + '<div class="karo"><p class="ki">' + esc(t(lang, 'cintro')) + TB.kbx_around__t.k2 + esc(t(lang, 'col0')) + '</th>' +
cols.map(([, l]) => '<th class="k-n">' + esc(t(lang, l)) + '</th>').join('') + '</tr></thead><tbody>' +
rowsK.map(k => '<tr><th scope="row" data-label="">' + esc(t(lang, k)) + '</th>' + cols.map(([c, l]) => '<td class="k-n" data-label="' + esc(t(lang, l)) + '">' + cell(r[k][c], k) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>' +
'<p class="lim">' + esc(t(lang, 'scen')) + ' ' + esc(t(lang, 'clim')) + '</p>' +
'<p class="srcl">' + src(s.catalog || s.url, t(lang, 'csrc')) + src('https://doi.org/10.7917/OFSG3345', t(lang, 'csrc2')) + '<a href="/hazards/' + esc(hq) + '">' + esc(t(lang, 'cflood')) + '</a><a href="/api/x/around/' + encodeURIComponent(x.id) + '">' + esc(t(lang, 'method')) + cm(lang) + esc(t(lang, 'upd', { d: fd(cl.updated) })) + '</a></p></div>';
}
const J = (o, status, age) => new Response(JSON.stringify(o), { status: status || 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': age ? 'public, max-age=' + age : 'no-store', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' } });
export async function handle(req, u, env) {
if (req.method !== 'GET' && req.method !== 'HEAD') return J({ error: 'GET only' }, 405);
const id = decodeURIComponent(u.pathname.replace(/^\/api\/x\/around\/?/, '').replace(/\/$/, ''));
const ad = await aroundData(env).catch(() => null);
if (!ad || (!ad.ar && !ad.cl && !ad.dc)) return J({ error: 'data not published yet' }, 503);
const pick = f => f ? Object.fromEntries(Object.entries(f).filter(([k]) => k !== 'projects')) : null;
if (!id || id === 'about') return J({ about: TB.kbx_around__s.k0,
around: pick(ad.ar), climate: pick(ad.cl), distance_claims: pick(ad.dc), projects: Object.keys((ad.ar && ad.ar.projects) || {}).length, files: ['/data/around.json', '/data/climate.json', '/data/distance-claims.json'], example: '/api/x/around/CDS-001' }, 200, 3600);
if (!/^[A-Z0-9-]{3,20}$/.test(id)) return J({ error: 'bad id' }, 400);
const a = ad.ar && ad.ar.projects && ad.ar.projects[id], b = ad.cl && ad.cl.projects && ad.cl.projects[id], c = ad.dc && ad.dc.projects && ad.dc.projects[id];
if (!a && !b && !c) return J({ error: 'not found', note: TB.kbx_around__t.k3 }, 404, 600);
return J({ id, around: a || null, climate: b || null, distance_claims: c || null,
sources: { around: ad.ar ? { updated: ad.ar.updated, osm_build: ad.ar.osm_build, source: ad.ar.source, air: ad.ar.air, method: ad.ar.method, limits: ad.ar.limits } : null,
climate: ad.cl ? { updated: ad.cl.updated, source: ad.cl.source, periods: ad.cl.periods, scenarios: ad.cl.scenarios, indicators: ad.cl.indicators, values: ad.cl.values, method: ad.cl.method, limits: ad.cl.limits } : null,
distance_claims: ad.dc ? { updated: ad.dc.updated, source: ad.dc.source, method: ad.dc.method, limits: ad.dc.limits, fields: ad.dc.fields } : null } }, 200, 3600);
}
export function aroundSum(ad, x, lang) {
const r = ad && ad.ar && ad.ar.projects && ad.ar.projects[x.id]; if (!r) return [];
const out = [];
for (const k of ['beach', 'airport', 'hospital']) {
const o = r[k]; if (!o || o.same) continue;
if (o.d == null) { if (o.none != null) out.push([t(lang, k), t(lang, 'none', { km: num(o.none, lang) }).replace(/\.$/, '').replace(/^\p{Lu}(?=\p{Ll})/u, c => c.toLowerCase())]); continue; }
out.push([t(lang, k), (k === 'airport' && o.n ? o.n + (o.iata ? ' (' + o.iata + ')' : '') + ' ' : '') + dist(o.d, lang)]);
}
return out;
}
