// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_n31d__q, $t = TB.kbx_n31d__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { S, C } from './kbx_n31d_i18n.js';
import { t27 } from './kbx_u27.js';
import { index as satIndex, BAND as SAT_BAND } from './kbx_named_sat.js';
import { TB } from './kbx_strings.js';
export const N31V = 'd1';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const pre = l => l === 'en' ? '' : '/' + l;
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a, "'": '&#39;' }[c]));
const bdi = (lang, s) => lang === 'ar' ? '<bdi>' + esc(s) + $q.b : esc(s);
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const nf = (n, lang, d) => { try { return Number(n).toLocaleString(LOC[lang] || 'en-GB', { maximumFractionDigits: d == null ? 0 : d }); } catch (e) { return String(n); } };
export const t31 = (lang, k, v) => { let s = (S[lang] && S[lang][k] != null) ? S[lang][k] : S.en[k]; if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b); return s; };
const SEP = { zh: '、', ar: '، ' };
const low = (lang, s) => /^(en|es|fr|nl|ru)$/.test(lang) ? s.charAt(0).toLocaleLowerCase(LOC[lang]) + s.slice(1) : s;
export function knownLine(lang, L6) {
const k = [], u = [];
for (const [key, , s] of L6) (s[0] === 'ok' || s[0] === 'part' || s[1] === $q.c ? k : u).push(low(lang, t27(lang, 'lt_' + key)));
const j = a => a.join(SEP[lang] || ', ');
return $q.d + esc(t31(lang, 'q_lbl')) + '</b> ' + esc(t31(lang, 'known', { a: k.length ? j(k) : t31(lang, $q.e) })) + (u.length ? ' ' + esc(t31(lang, $q.f, { b: j(u) })) : '') + '</p>';
}
export const nrNote = lang => $q.g + esc(t31(lang, 'nr_h')) + '</b> ' + esc(t31(lang, 'nr_t')) + $q.h + pre(lang) + $q.i + esc(t31(lang, 'nr_l')) + $q.j;
export function askHtml(lang, o) {
const Q = [], st = {}; for (const [key, , s] of o.L6) st[key] = s;
const n = o.n, h = o.h;
if (st.permit && st.permit[0] !== 'ok') Q.push(t31(lang, $q.k, { n }));
if (st.company && st.company[0] !== 'ok') Q.push(t31(lang, 'a_co'));
const d = st.date || [];
Q.push(d[1] === $q.c ? t31(lang, $q.l, { h }) : d[0] === 'part' ? t31(lang, $q.m) : h && d[0] === 'ok' ? t31(lang, $q.n, { h }) : t31(lang, $q.o));
if (o.escrow !== true) Q.push(t31(lang, $q.p));
if (st.build && (st.build[0] === 'nc' || st.build[0] === 'part')) Q.push(t31(lang, $q.q));
if (!o.price) Q.push(t31(lang, $q.r));
Q.push(t31(lang, $q.s));
return '<ol>' + Q.slice(0, 5).map(q => '<li>' + esc(q) + '</li>').join('') + $t.k0 + encodeURIComponent(o.id) + $q.t + esc(t31(lang, 'ask_b')) + '</a>' +
(o.s ? $q.u + (lang === 'en' ? '' : '/' + lang) + $q.v + o.s + $q.w + esc($t.o_ASK34[lang] || $t.o_ASK34.en) + '</a>' : '') + '</p>';
}
const R = 6371, rad = d => d * Math.PI / 180;
const km = (a, b, c, d) => 2 * R * Math.asin(Math.sqrt(Math.sin(rad(c - a) / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(rad(d - b) / 2) ** 2));
export function closest3(ix, x) {
const f = x.fx || {}; if (typeof f.lat !== $q.x || typeof f.lng !== $q.x) return [];
return ix.P.filter(o => o !== x && o.mk === x.mk && o.fx && typeof o.fx.lat === $q.x && typeof o.fx.lng === $q.x && !(o.fx.lat === f.lat && o.fx.lng === f.lng))
.map(o => ({ o, k: km(f.lat, f.lng, o.fx.lat, o.fx.lng) })).filter(r => r.k <= 25).sort((a, b) => a.k - b.k).slice(0, 3);
}
export function cl3Html(lang, x, L) {
if (!L.length) return '';
const list = L.map(r => $q.y + pre(lang) + $q.v + r.o.s + '/">' + bdi(lang, r.o.n) + $q.z + esc(t31(lang, 'km', { k: nf(r.k, lang, r.k < 10 ? 1 : 0) })) + ')').join(SEP[lang] || ', ');
return '<p>' + esc(t31(lang, 'cl3', { list: $q.A })).replace($q.A, list) + $q.h + pre(lang) + $q.B + [x.s].concat(L.map(r => r.o.s)).join(',') + $q.C + esc(t31(lang, 'cl3_c')) + $q.j;
}
export function devLate(lang, ix, x, overdueOf, devRel) {
if (!devRel || !x.dvs || !ix.devs.has(x.dvs)) return '';
const ids = ix.devs.get(x.dvs).ids, t = ids.length; if (t < 2) return '';
const k = ids.map(i => ix.byId.get(i)).filter(o => o && overdueOf(ix, o)).length, dev = x.dv;
const txt = k === 0 ? t31(lang, $q.D, { t: nf(t, lang), dev }) : k === 1 ? t31(lang, $q.E, { t: nf(t, lang), dev }) : t31(lang, $q.F, { k: nf(k, lang), t: nf(t, lang), dev });
return '<li>' + bdi(lang, txt).replace(/^<bdi>|<\/bdi>$/g, '') + (k ? $q.h + devRel + $q.G + esc(t31(lang, 'dl_l', { dev })) + '</a>' : '') + '</li>';
}
export function shareText(lang, o) {
const P = [o.h ? t31(lang, 'sh_h', { h: o.h }) : t31(lang, 'sh_h0'), o.pn ? t31(lang, 'sh_p') : t31(lang, 'sh_p0')];
if (o.s != null) P.push(t31(lang, 'sh_s', { s: o.s }));
return o.n + (o.place ? ' (' + o.place + ')' : '') + ': ' + P.join(SEP[lang] || ', ') + '. ' + t31(lang, $q.H);
}
export function tyTable(lang, x, ppm, med, mkL) {
const f = x.fx || {}; if (ppm == null || !f.currency) return '';
const cur = String(f.currency).toUpperCase(), sz = nf(f.size_min_m2, lang) + (f.size_max_m2 && f.size_max_m2 !== f.size_min_m2 ? ' - ' + nf(f.size_max_m2, lang) : '') + ' m²';
const th = k => $q.I + esc(k) + '</th>';
return $q.J + th(t31(lang, $q.K)) + th(t31(lang, $q.L)) + th(t31(lang, $q.M)) + th(t31(lang, $q.N)) + (med ? th(t31(lang, $q.O, { mk: mkL })) : '') + $t.k1 + esc((f.unit_types || []).join(', ') || '-') + $q.P + esc(sz) + $q.Q + esc(cur + ' ' + nf(f.price_min, lang)) + $q.R + esc(cur + ' ' + nf(Math.round(ppm), lang)) + $q.S +
(med ? $q.T + esc(cur + ' ' + nf(Math.round(med.m), lang)) + $q.S : '') + $t.k2 + esc(t31(lang, $q.U, { k: med ? nf(med.n, lang) : '0', mk: mkL })) + '</p>';
}
export function staticMap(lang, lat, lng, name) {
if (typeof lat !== $q.x || typeof lng !== $q.x || Math.abs(lat) > 85) return '';
const z = 15, n = 2 ** z, fx = (lng + 180) / 360 * n, fy = (1 - Math.log(Math.tan(rad(lat)) + 1 / Math.cos(rad(lat))) / Math.PI) / 2 * n;
const tx = Math.floor(fx - 0.5), ty = Math.floor(fy - 0.5), px = (fx - tx) / 2 * 100, py = (fy - ty) / 2 * 100;
const img = (x, y) => $q.V + z + '/' + ((x % n) + n) % n + '/' + y + $q.W;
return $t.k3 + esc(t31(lang, $q.X, { n: name })) + '">' + img(tx, ty) + img(tx + 1, ty) + img(tx, ty + 1) + img(tx + 1, ty + 1) +
$q.Y + px.toFixed(1) + $q.Z + py.toFixed(1) + $q.aa + esc(t31(lang, 'map_c')) + '</p>';
}
export function satBa(lang, meta, id) {
const rec = meta && meta.projects && meta.projects[id]; if (!rec || !rec.n || !rec.m0) return '';
let I = null; try { I = satIndex(rec); } catch (e) { I = null; }
return I && Math.abs(I.now) >= SAT_BAND ? $q.ab + esc(t31(lang, 'ba')) + '</a>' : '';
}
export const vsHead = lang => $q.ac + esc(t31(lang, 'vs_a')) + $q.ad + esc(t31(lang, 'vs_b')) + $q.ae;
export const CSS31 = '<style id="k31-css">.kp .kupd{font-size:1.1rem;font-weight:700;color:var(--ink)}.k31q{margin:0;font-weight:600}.k31q b{display:block}#answer .klt{margin:10px 0 12px}.k31nr{margin:14px 0 0;padding:8px 12px;font-size:.9rem;border:1px dashed var(--line);border-radius:12px;max-width:80ch}' +
'.k31m{position:relative;display:grid;grid-template-columns:1fr 1fr;width:min(100%,384px);overflow:hidden;border-radius:12px;direction:ltr}.k31m img{width:100%;height:auto}.k31m i{position:absolute;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:#B3261E;border:3px solid #fff}@media(max-width:640px){.kp .lead{display:none}}</style>';
export const LOADER = "(function(){if(!document.getElementById('checks6')||!document.getElementById('sources')||!/\\/projects\\/[a-z0-9-]+\\/$/.test(location.pathname))return;var go=function(){var s=document.createElement('script');s.src='/k/n31d.js?l='+(document.documentElement.lang||'en').slice(0,2)+'&v=" + N31V + "';s.async=true;document.head.appendChild(s);};var idle=function(){if(window.requestIdleCallback)requestIdleCallback(go,{timeout:2500});else setTimeout(go,600);};if(document.readyState==='complete')idle();else addEventListener('load',idle);})();";

export async function handle(req, u) {
if (u.pathname !== $q.af) return null;
const l = LANGS.includes(u.searchParams.get('l')) ? u.searchParams.get('l') : 'en';
const M = Object.assign({}, C.en, C[l] || {});
const body = '(' + $q.F_CLIENT.toString() + ')(' + JSON.stringify(M) + ',' + JSON.stringify(l) + ');';
return new Response(body, { headers: { 'content-type': $q.ag, 'cache-control': u.searchParams.get('v') === N31V ? $q.ah : $q.ai, 'x-content-type-options': $q.aj } });
}
