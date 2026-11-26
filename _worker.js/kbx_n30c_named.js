// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_n30c_named__q, $s = TB.kbx_n30c_named__s, $t = TB.kbx_n30c_named__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { S } from './kbx_n30c_i18n.js';
import { mkName } from './kbx_hdate.js';
import { TB } from './kbx_strings.js';
export { S };
export const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a, "'": '&#39;' }[c]));
export const t = (lang, k, v) => { const s = (S[lang] && S[lang][k]) || S.en[k] || k; return v && typeof s === $q.b ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
const nmf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'n' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.NumberFormat(L, o)); };
export const num = (v, lang, d) => { try { return nmf(lang === 'en' ? 'en-GB' : lang === 'zh' ? 'zh-CN' : lang, { maximumFractionDigits: d || 0, numberingSystem: 'latn' }).format(v); } catch (e) { return String(v); } };
export const slugMk = m => String(m || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const src = (href, label) => /^https:\/\/[^\s"<>]+$/.test(String(href || '')) ? $q.c + esc(href) + $q.d + esc(label) + '</a>' : esc(label);
const BAND = { 'under 200 m': 'cb_u200', '200 to 500 m': 'cb_200', '500 m to 1 km': 'cb_500', '1 to 2 km': 'cb_1', '2 to 5 km': 'cb_2', '5 to 10 km': 'cb_5', 'over 10 km': 'cb_10',
'under 1 km (coarse outline)': 'cb_u1c', '1 to 5 km (coarse outline)': 'cb_15c', '5 to 10 km (coarse outline)': 'cb_510c' };
export function pinRecord(ld, x) {
const hz = ld && ld.hz, h = hz && hz.projects && hz.projects[x.id], lr = ld && ld.lr, r = lr && lr.projects && lr.projects[x.id];
if (!h && !r) return null;
const out = { id: x.id, accuracy_m: (r && r.acc) || 100, land: null, protected: null, flood: null };
if (h && typeof h.elev_m === $q.e) out.land = { elev_m: h.elev_m, on_land_model: h.elev_m > 0, coast: h.coast == null ? null : String(h.coast), source: $t.k0, url: (hz.sources || {}).elevation || null, read: hz.updated || null };
if (r && r.es && r.es.ok && r.es.sea_m === 0) out.land = Object.assign(out.land || { source: $q.f, read: r.checked || lr.updated }, { osm_sea_at_pin: true });
if (r) {
const inside = [], near = [], km = [];
if (r.n2k && r.n2k.ok) { (r.n2k.in || []).forEach(o => inside.push((o.name || o.code) + $q.g + o.code + ')')); (r.n2k.near || []).forEach(o => near.push({ n: (o.name || o.code) + $q.h, d: o.d })); km.push(((lr.radius_m || {}).n2k || 2000) / 1000); }
if (r.osm && r.osm.ok) { (r.osm.in || []).forEach(o => inside.push((o.name || o.kind) + $q.i)); (r.osm.near || []).forEach(o => near.push({ n: (o.name || o.kind) + $q.i, d: o.d })); km.push(((lr.radius_m || {}).osm || 1000) / 1000); }
if (r.eng && r.eng.ok) { (r.eng.hits || []).forEach(o => (o.in ? inside.push((o.name || o.ds) + $q.j) : near.push({ n: (o.name || o.ds) + $q.j, d: o.d }))); km.push(((lr.radius_m || {}).eng || 500) / 1000); }
if (km.length) out.protected = { inside, near: near.sort((a, b) => (a.d || 0) - (b.d || 0)).slice(0, 3), radius_km: Math.min(...km), source: $t.k1 + (r.eng ? $q.k : ''), read: r.checked || lr.updated };
}
if (h) out.flood = { river_m: h.flood_river_m == null ? null : h.flood_river_m, coast_m: h.flood_coast_m == null ? null : h.flood_coast_m, return_period_years: 100, cell_km: 1, source: $q.l, url: (hz.sources || {}).flood || null, read: hz.updated || null };
return out;
}
export function pinHtml(ld, x, lang, fd) {
let R; try { R = pinRecord(ld, x); } catch (e) { R = null; }
if (!R || (!R.land && !R.protected && !R.flood)) return '';
const rows = [], srcs = [], dates = [];
if (R.land) {
const L = R.land; let dd = '';
if (typeof L.elev_m === $q.e) dd = esc(t(lang, L.elev_m > 0 ? 'pc_up' : $q.m, { m: num(L.elev_m, lang) }));
if (L.osm_sea_at_pin) dd += (dd ? ' ' : '') + esc(t(lang, $q.n));
if (L.coast && BAND[L.coast]) dd += ' ' + esc(t(lang, $q.o, { c: t(lang, BAND[L.coast]) }));
rows.push([t(lang, $q.p), dd]); srcs.push(src(L.url, $q.q)); dates.push(L.read);
}
if (R.protected) {
const P = R.protected, r = num(P.radius_km, lang, 1);
rows.push([t(lang, $q.r), '<bdi>' + (P.inside.length ? esc(t(lang, $q.s, { n: P.inside.join('; ') })) : P.near.length ? esc(t(lang, $q.t, { r, n: P.near.map(o => o.n + ' (' + num(o.d, lang) + ' m)').join('; ') })) : esc(t(lang, $q.u, { r }))) + $q.v]);
srcs.push($q.w); dates.push(P.read);
}
if (R.flood) {
const F = R.flood, v = m => m == null ? t(lang, 'pc_nd') : t(lang, 'pc_m', { m: num(m, lang, 2) });
rows.push([t(lang, $q.x), esc(F.river_m == null && F.coast_m == null ? t(lang, $q.y) : t(lang, 'pc_f', { r: v(F.river_m), c: v(F.coast_m) }))]); srcs.push(src(F.url, $q.z)); dates.push(F.read);
}
const d = dates.filter(Boolean).sort()[0];
return $s.PIN_CSS + $q.A + esc(t(lang, 'pc_h')) + $q.B + rows.map(([a, b]) => '<dt>' + esc(a) + $q.C + b + '</dd>').join('') + $q.D +
esc(t(lang, 'pc_i', { a: num(R.accuracy_m, lang) })) + ' ' + srcs.join(', ') + (d ? ', ' + esc(t(lang, $q.E, { d: fd(d) })) : '') + $q.F + encodeURIComponent(x.id) + '">' + esc(t(lang, $q.G)) + $q.H;
}
export const PH_MIN = 3;
const PHM = new WeakMap();
export function phProject(p) {
const H = (p && p.pts || []).filter(q => q.head && q.head.v > 0 && /^\d{4}-\d{2}-\d{2}/.test(q.d || '')).sort((a, b) => a.d.localeCompare(b.d));
if (H.length < 2) return null;
const cur = H[0].head.cur;
if (H.some(q => q.head.cur !== cur)) return { x: 'cur' };
const vs = H.map(q => q.head.v), mx = Math.max(...vs), mn = Math.min(...vs);
if (mx / mn > 2.5) return { x: 'jump' };
const byDay = new Map(); for (const q of H) byDay.set(q.d.slice(0, 10), q);
const L = [...byDay.values()];
if (L.length < 2) return null;
const v0 = L[0].head.v;
return { cur, first: L[0], last: L[L.length - 1], n: L.length, pts: L.map(q => [q.d.slice(0, 10), Math.round(q.head.v / v0 * 1000) / 10]) };
}
export function phMarkets(ph, ix) {
if (!ph || !ph.projects || !ix) return new Map();
let M = PHM.get(ph); if (M && M.ix === ix) return M.m;
const m = new Map();
for (const [id, p] of Object.entries(ph.projects)) {
const x = ix.byId.get(id); if (!x || !x.mk || /sumba/i.test(x.mk) || /eco\s*beach\s*city|\bequinox\b/i.test(String(x.n || '') + ' ' + String(x.dv || ''))) continue;
const r = phProject(p); if (!r) continue;
if (!m.has(x.mk)) m.set(x.mk, { mk: x.mk, s: slugMk(x.mk), L: [], x: 0 });
const e = m.get(x.mk); if (r.x) e.x++; else e.L.push(Object.assign({ p: x }, r));
}
for (const e of m.values()) {
const ch = e.L.map(r => r.pts[r.pts.length - 1][1] - 100).sort((a, b) => a - b);
e.med = ch.length ? (ch.length % 2 ? ch[(ch.length - 1) / 2] : (ch[ch.length / 2 - 1] + ch[ch.length / 2]) / 2) : null;
e.up = ch.filter(v => v > 0.05).length; e.down = ch.filter(v => v < -0.05).length; e.same = ch.length - e.up - e.down;
e.copies = e.L.reduce((a, r) => a + r.n, 0);
e.a = e.L.reduce((a, r) => !a || r.pts[0][0] < a ? r.pts[0][0] : a, null); e.b = e.L.reduce((a, r) => !a || r.pts[r.pts.length - 1][0] > a ? r.pts[r.pts.length - 1][0] : a, null);
}
PHM.set(ph, { ix, m });
return m;
}
export function priceLink(pd, ix, x, lang) {
try {
const e = phMarkets(pd && pd.ph, ix).get(x.mk); if (!e || e.L.length < PH_MIN) return '';
return $q.I + (lang === 'en' ? '' : '/' + lang) + $q.J + e.s + '/">' + esc(t(lang, $q.K, { m: mkName(x.mk, lang), n: num(e.L.length, lang) })) + $q.L;
} catch (e) { return ''; }
}
