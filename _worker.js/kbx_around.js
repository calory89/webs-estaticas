// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_around__q, $s = TB.kbx_around__s, $t = TB.kbx_around__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TB } from './kbx_strings.js';
import { sf } from './kbx_jget.js';
const ORIGIN = 'https://kolaboro.com';
export const PATHS = /^\/api\/x\/around(\/|$)/;
let MEMO = {};
const loadOne = (env, name) => sf('around:' + name, () => loadOne0(env, name));   // n40 d14: concurrent requests share one load
async function loadOne0(env, name) {
const m = MEMO[name]; if (m && Date.now() - m.t < 600000) return m.v;
let r = null;
try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + $q.a + name)); } catch (e) { r = null; }
if (!r || !r.ok) { try { r = await fetch(ORIGIN + $q.b + name + '?w=1', { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
const v = r && r.ok ? await r.json().catch(() => null) : null;
MEMO[name] = { t: Date.now(), v }; return v;
}
export async function aroundData(env) {
const [ar, cl, dc] = await Promise.all([loadOne(env, $q.c), loadOne(env, $q.d), loadOne(env, $q.e)]);
return { ar, cl, dc, v: ((ar && ar.updated) || '') + '/' + ((cl && cl.updated) || '') + '/' + ((dc && dc.updated) || '') };
}
export const aroundPin = (ad, id) => { const r = ad && ad.ar && ad.ar.projects && ad.ar.projects[id]; return r ? r.pin : null; };
const S = TB.kbx_around_S ;
const t = (lang, k, v) => { const s = (S[lang] && S[lang][k]) || S.en[k]; return v && typeof s === $q.f ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
const tm = (lang, k, key) => ((S[lang] && S[lang][k]) || {})[key] || (S.en[k] || {})[key] || null;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.g, "'": '&#39;' }[c]));
const cm = lang => lang === 'ar' ? '، ' : lang === 'zh' ? '，' : ', ';
const okU = u => typeof u === $q.f && /^https:\/\/[^\s"<>]+$/.test(u);
export const aroundToc = lang => t(lang, 'toc');
export const aroundHeading = lang => t(lang, 'h');
export const climateToc = lang => t(lang, 'ctoc');
export const climateHeading = lang => t(lang, 'ch');
const nmf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'n' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.NumberFormat(L, o)); };
const num = (v, lang, o) => { try { return nmf(lang === 'en' ? 'en-GB' : lang, o).format(v); } catch (e) { return String(v); } };
const src = (href, label) => okU(href) ? $q.h + esc(href) + $q.i + esc(label) + '</a>' : '';
const UNIT = { m: { ru: 'м', zh: '米', ar: 'م' }, km: { ru: 'км', zh: '公里', ar: 'كم' } };
const un = (lang, u) => (UNIT[u] || {})[lang] || u;
const dist = (m, lang) => m < 100 ? t(lang, 'u100') : m < 1000 ? num(Math.round(m / 10) * 10, lang) + ' ' + un(lang, 'm') : num(Math.round(m / 100) / 10, lang, { maximumFractionDigits: m < 20000 ? 1 : 0 }) + ' ' + un(lang, 'km');
const dist2 = (m, lang) => m < 1000 ? num(Math.round(m / 10) * 10, lang) + ' ' + un(lang, 'm') : num(Math.round(m / 100) / 10, lang, { maximumFractionDigits: m < 20000 ? 1 : 0 }) + ' ' + un(lang, 'km');
const mapU = ll => Array.isArray(ll) && isFinite(ll[0]) && isFinite(ll[1]) ? $q.j + (+ll[0]).toFixed(5) + $q.k + (+ll[1]).toFixed(5) + $q.l + (+ll[0]).toFixed(5) + '/' + (+ll[1]).toFixed(5) : '';
const bd = s => '<bdi>' + esc(s) + $q.m;
const buildDate = (b, fd) => /^\d{8}$/.test(String(b || '')) ? fd(String(b).slice(0, 4) + '-' + String(b).slice(4, 6) + '-' + String(b).slice(6, 8)) : String(b || '');
function place(o, lang, withKind) {   // "Name (kind), 480 m map"
  const nm = o.n ? bd(o.n) + (o.iata ? ' (' + esc(o.iata) + ')' : '') : $q.n + esc(t(lang, $q.o)) + $q.p;
  const k = withKind && o.k && tm(lang, 'sk', o.k) ? ' (' + esc(tm(lang, 'sk', o.k)) + ')' : '';
  return nm + k + cm(lang) + esc(dist(o.d, lang)) + ' ' + src(mapU(o.ll), t(lang, 'map'));
}
function claimsHtml(ad, x, lang, fd) {
const dc = ad && ad.dc, r = dc && dc.projects && dc.projects[x.id];
let h = $q.q + esc(t(lang, 'c_h')) + '</h3>';
if (!r) return h + $q.r + esc(t(lang, $q.s)) + '</p>';
const copy = /^[0-9a-f]{64}$/.test(r.sha || '') ? $q.t + encodeURIComponent(x.s) + $q.u + r.sha + '.txt' : '';
if (r.index) return h + $q.r + esc(t(lang, $q.v)) + '</p>';
const cl = (r.c || []).filter(c => c && c.q && (c.t || c.none != null));
const cp = copy ? $q.w + esc(copy) + '">' + esc(t(lang, $q.x)) + '</a>' : '';
if (!cl.length) h += '<p>' + esc(t(lang, $q.y, { d: fd(r.d) })) + cp + '</p>';
else {
h += $q.z + esc(t(lang, $q.A, { d: fd(r.d) })) + cp + $t.k0 + esc(t(lang, 'c_th1')) + $q.B + esc(t(lang, 'c_th2')) + $q.C +
cl.map(c => {
let m;
if (!c.t) m = esc(tm(lang, 'cn', c.cat) || c.cat) + ': ' + esc(t(lang, $q.D, { km: num(c.none, lang) }));
else {
const T = c.t, who = c.matched && T.n ? bd(T.n) + (T.iata ? ' (' + esc(T.iata) + ')' : '') : esc(tm(lang, 'cn', c.cat) || c.cat) + (T.n ? ': ' + bd(T.n) + (T.iata ? ' (' + esc(T.iata) + ')' : '') : '');
const li = [T.in ? esc(t(lang, 'c_in')) : esc(t(lang, 'c_sl', { d: dist(T.d, lang) })) + ' ' + src(mapU(T.ll), t(lang, 'map'))];
if (Array.isArray(c.car)) li.push(esc(t(lang, 'c_car', { d: dist2(c.car[0], lang), m: num(Math.max(1, Math.round(c.car[1] / 60)), lang) })));
if (Array.isArray(c.foot)) li.push(esc(t(lang, $q.E, { d: dist2(c.foot[0], lang), m: num(Math.max(1, Math.round(c.foot[1] / 60)), lang) })));
m = who + '<ul>' + li.map(s => '<li>' + s + '</li>').join('') + '</ul>';
}
return $q.F + esc(t(lang, 'c_th1')) + $q.G + esc(c.q) + $q.H + esc(t(lang, 'c_th2')) + '">' + m + $q.I;
}).join('') + $q.J;
}
if (r.o > 0 && (r.ox || []).length) h += $q.r + esc(t(lang, $q.K, { q: $q.L })).replace($q.L, bd(r.ox[0])) + '</p>';
return h + $q.M + esc(t(lang, 'c_lim')) + ' ' + src($q.N, t(lang, 'c_src')) + '</p>';
}
export function aroundHtml(ad, x, lang, fd) {
const ar = ad && ad.ar, r = ar && ar.projects && ar.projects[x.id];
if (!r) return '';
const rows = [], none = o => $q.n + esc(t(lang, 'none', { km: num(o.none, lang) })) + $q.p;
const simple = k => { const o = r[k]; if (!o) return; rows.push([t(lang, k), o.d != null ? (o.in ? esc(t(lang, $q.O)) : esc(dist(o.d, lang)) + ' ' + src(mapU(o.ll), t(lang, 'map'))) : none(o)]); };
simple('coast'); simple('beach');
if (r.airport) rows.push([t(lang, $q.P), r.airport.d != null ? place(r.airport, lang) + (r.airport2 && r.airport2.d != null && r.airport2.d <= 75000 ? '<br>' + place(r.airport2, lang) : '') : none(r.airport)]);
if (r.runway) {
const o = r.runway;
if (o.d == null) rows.push([t(lang, $q.Q), none(o)]);
else {
const w = o.u5 ? [o.ref ? esc(t(lang, $q.R, { r: o.ref })) : '', o.n ? bd(o.n) + (o.iata ? ' (' + esc(o.iata) + ')' : '') : ''].filter(Boolean).join(cm(lang)) : '';
rows.push([t(lang, $q.Q), esc(t(lang, o.u5 ? 'rw_u5' : $q.S, { d: dist(o.d, lang), w: $q.L })).replace($q.L, w ? ' (' + w + ')' : '') + (o.u5 && !o.n ? ' ' + esc(t(lang, $q.T)) : '') + ' ' + src(mapU(o.ll), t(lang, 'map'))]);
}
}
for (const k of [$q.U, $q.V, $q.W, 'stop', 'rail']) {
const o = r[k]; if (!o || o.same) continue;
rows.push([t(lang, k), o.d != null ? place(o, lang, k === 'stop' || k === 'rail') : none(o)]);
}
const A = ar.air || {}, q = r.aq;
if (q && (q.pm25 != null || q.no2 != null)) {
const f1 = v => v == null ? '?' : num(v, lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
rows.push([t(lang, 'air', { y: q.y || A.year || '' }), esc(t(lang, 'air_v', { p: f1(q.pm25), n: f1(q.no2) })) + ' ' + esc(t(lang, $q.X)) + ' ' + src((A.who || {}).url, t(lang, 'who')) +
$q.Y + esc(t(lang, $q.Z)) + $q.aa + src(A.via_url, t(lang, $q.ab))]);
}
if (!rows.length) return '';
const p = String(r.pin || '').split(','), hq = p.length === 2 && isFinite(+p[0]) && isFinite(+p[1]) ? '?lat=' + (+p[0]).toFixed(4) + '&lng=' + (+p[1]).toFixed(4) : '';
return $s.CSS + $q.ac + esc(t(lang, 'intro', { b: buildDate(ar.osm_build, fd), a: num(r.acc || 100, lang) })) + '</p>' +
$q.ad + rows.map(([a, b]) => '<dt>' + esc(a) + $q.ae + b + '</dd>').join('') + '</dl>' +
$q.M + esc(t(lang, 'lim')) + ' ' + src($t.k1, t(lang, 'osm')) + '</p>' + claimsHtml(ad, x, lang, fd) +
$q.af + esc(hq) + '">' + esc(t(lang, 'hz')) + $q.ag + encodeURIComponent(x.id) + '">' + esc(t(lang, $q.ah)) + cm(lang) + esc(t(lang, 'upd', { d: fd(ar.updated) })) + $q.ai;
}
export function climateHtml(ad, x, lang, fd) {
const cl = ad && ad.cl, r = cl && cl.projects && cl.projects[x.id];
if (!r) return '';
const cols = [['h', 'col_h'], ['m', 'col_m'], ['x', 'col_x']], rowsK = ['hd35', 'tr', 'pr', 'r20mm'].filter(k => r[k] && cols.every(([c]) => Array.isArray(r[k][c])));
if (!rowsK.length) return '';
const f = (v, k) => num(v, lang, { maximumFractionDigits: k !== 'pr' && Math.abs(v) < 10 ? 1 : 0 });
const cell = (a, k) => $q.aj + esc(f(a[0], k)) + $q.ak + esc(t(lang, 'rg', { a: f(a[1], k), b: f(a[2], k) })) + $q.al;
const s = cl.source || {}, p = String(r.pin || '').split(','), hq = p.length === 2 && isFinite(+p[0]) && isFinite(+p[1]) ? '?lat=' + (+p[0]).toFixed(4) + '&lng=' + (+p[1]).toFixed(4) : '';
return (ad.ar && ad.ar.projects && ad.ar.projects[x.id] ? '' : $s.CSS) + $q.ac + esc(t(lang, $q.am)) + $t.k2 + esc(t(lang, 'col0')) + '</th>' +
cols.map(([, l]) => $q.an + esc(t(lang, l)) + '</th>').join('') + $q.ao +
rowsK.map(k => $q.ap + esc(t(lang, k)) + '</th>' + cols.map(([c, l]) => $q.aq + esc(t(lang, l)) + '">' + cell(r[k][c], k) + '</td>').join('') + '</tr>').join('') + $q.J +
$q.M + esc(t(lang, 'scen')) + ' ' + esc(t(lang, 'clim')) + '</p>' +
$q.ar + src(s.catalog || s.url, t(lang, 'csrc')) + src($q.as, t(lang, 'csrc2')) + $q.at + esc(hq) + '">' + esc(t(lang, $q.au)) + $q.ag + encodeURIComponent(x.id) + '">' + esc(t(lang, $q.ah)) + cm(lang) + esc(t(lang, 'upd', { d: fd(cl.updated) })) + $q.ai;
}
const J = (o, status, age) => new Response(JSON.stringify(o), { status: status || 200, headers: { 'content-type': $q.av, 'cache-control': age ? $q.aw + age : $q.ax, 'access-control-allow-origin': '*', 'x-content-type-options': $q.ay } });
export async function handle(req, u, env) {
if (req.method !== 'GET' && req.method !== 'HEAD') return J({ error: $q.az }, 405);
const id = decodeURIComponent(u.pathname.replace(/^\/api\/x\/around\/?/, '').replace(/\/$/, ''));
const ad = await aroundData(env).catch(() => null);
if (!ad || (!ad.ar && !ad.cl && !ad.dc)) return J({ error: $q.aA }, 503);
const pick = f => f ? Object.fromEntries(Object.entries(f).filter(([k]) => k !== $q.aB)) : null;
if (!id || id === 'about') return J({ about: $s.k0,
around: pick(ad.ar), climate: pick(ad.cl), distance_claims: pick(ad.dc), projects: Object.keys((ad.ar && ad.ar.projects) || {}).length, files: [$q.aC, $q.aD, $q.aE], example: $q.aF }, 200, 3600);
if (!/^[A-Z0-9-]{3,20}$/.test(id)) return J({ error: $q.aG }, 400);
const a = ad.ar && ad.ar.projects && ad.ar.projects[id], b = ad.cl && ad.cl.projects && ad.cl.projects[id], c = ad.dc && ad.dc.projects && ad.dc.projects[id];
if (!a && !b && !c) return J({ error: $q.aH, note: $t.k3 }, 404, 600);
return J({ id, around: a || null, climate: b || null, distance_claims: c || null,
sources: { around: ad.ar ? { updated: ad.ar.updated, osm_build: ad.ar.osm_build, source: ad.ar.source, air: ad.ar.air, method: ad.ar.method, limits: ad.ar.limits } : null,
climate: ad.cl ? { updated: ad.cl.updated, source: ad.cl.source, periods: ad.cl.periods, scenarios: ad.cl.scenarios, indicators: ad.cl.indicators, values: ad.cl.values, method: ad.cl.method, limits: ad.cl.limits } : null,
distance_claims: ad.dc ? { updated: ad.dc.updated, source: ad.dc.source, method: ad.dc.method, limits: ad.dc.limits, fields: ad.dc.fields } : null } }, 200, 3600);
}
export function aroundSum(ad, x, lang) {
const r = ad && ad.ar && ad.ar.projects && ad.ar.projects[x.id]; if (!r) return [];
const out = [];
for (const k of ['beach', $q.P, $q.U]) {
const o = r[k]; if (!o || o.same) continue;
if (o.d == null) { if (o.none != null) out.push([t(lang, k), t(lang, 'none', { km: num(o.none, lang) }).replace(/\.$/, '').replace(/^\p{Lu}(?=\p{Ll})/u, c => c.toLowerCase())]); continue; }
out.push([t(lang, k), (k === $q.P && o.n ? o.n + (o.iata ? ' (' + o.iata + ')' : '') + ' ' : '') + dist(o.d, lang)]);
}
return out;
}
