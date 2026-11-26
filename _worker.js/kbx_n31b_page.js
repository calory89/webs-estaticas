// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_n31b_page__q, $s = TB.kbx_n31b_page__s, $t = TB.kbx_n31b_page__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { METHOD, ACC } from './kbx_e29_lines.js';
import { CAP } from './kbx_n31b_cap.js';
import { TB } from './kbx_strings.js';
export const N31V = '2';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a, "'": '&#39;' }[c]));
let S = null, SP = null;
export async function loadS(env) {
if (S) return S; if (SP) return SP;
SP = (async () => { let v = null;
try { if (env && env.ASSETS) { const r = await env.ASSETS.fetch(new Request($t.k0)); if (r.ok) v = await r.json(); } } catch (e) { v = null; }
if (!v) { try { const r = await fetch($t.k1, { cf: { cacheTtl: 600, cacheEverything: true } }); if (r.ok) v = await r.json(); } catch (e) { v = null; } }
if (v && v.en) S = v; SP = null; return S; })();
return SP;
}
export const t31 = (lang, k, v) => { if (!S) return ''; const s = (S[lang] && S[lang][k] != null) ? S[lang][k] : S.en[k]; return v && typeof s === $q.b ? s.replace(/\{(\w+)\}/g, (m, a) => v[a] != null ? v[a] : m) : s; };
const pre = l => l === 'en' ? '' : '/' + l;
const DAY = 864e5, LIM = 90;
const days = (a, b) => { const x = Date.parse(String(a || '').slice(0, 10) + $q.c), y = Date.parse(String(b).slice(0, 10) + $q.c); return isFinite(x) && isFinite(y) ? Math.round((y - x) / DAY) : null; };
const addD = (a, n) => { const x = Date.parse(String(a).slice(0, 10) + $q.c); return isFinite(x) ? new Date(x + n * DAY).toISOString().slice(0, 10) : null; };
const norm = s => String(s || '').toLowerCase().replace(/[^0-9a-z฀-๿]/g, '');
export const kindIco = (k, lang) => !S || k < 0 || k > 3 ? '' : $q.d + k + '">' + esc(t31(lang, 'k' + k)) + $q.e;
function satLast(sat, id) {
const r = sat && sat.projects && sat.projects[id]; if (!r || !Array.isArray(r.dt)) return null;
for (let i = r.dt.length - 1; i >= 0; i--) if (r.dt[i] && r.c && r.c[i] != null) return { d: r.dt[i], c: r.c[i], t: r.t || '' };
return null;
}
function permitCmp(x) {
const rw = x.rw; if (!rw) return null;
const ids = [rw.code, ...(String(rw.detail || '').match(/[A-Z]{0,3}\d[\d./-]{3,}\d/g) || [])].map(norm).filter(s => s.length >= 4);
if (!x.pn) return { k: 'reg', rw };
const p = norm(x.pn);
return { k: ids.some(i => p.includes(i)) ? 'ok' : 'no', rw };
}
export function trustBlock(x, c, lang, o) {
if (!S) return '';
const fd = o.fd, today = o.today || new Date().toISOString().slice(0, 10), vf = (c && c.verified) || {};
const G = { registry: [], independent: [], developer: [], none: [], contradicted: [] };
for (const k of o.seq) { const v = vf[k] || 'none'; (G[v] || G.none).push(o.ckName(k)); }
const any = G.registry.length + G.independent.length + G.developer.length + G.contradicted.length;
const part = (lab, L) => L.length ? '<b>' + esc(t31(lang, lab)) + $q.f + esc(L.join(', ')) : '';
const sum = any ? [part($q.g, G.registry), part($q.h, G.independent), part($q.i, G.developer), part($q.j, G.contradicted), part($q.k, G.none)].filter(Boolean).join(' · ') : esc(t31(lang, 'tb_nr'));
const L = [];
const K = [0, 0, 0, 0]; for (const u of o.sources || []) { const k = o.kindOf(u); if (k >= 0) K[k]++; }
const n = K[0] + K[1] + K[2] + K[3];
if (n) L.push(esc(t31(lang, n === 1 ? $q.l : $q.m, { n, list: '%L' }) || t31(lang, $q.m, { n, list: '%L' })).replace('%L', K.map((v, k) => v ? kindIco(k, lang).replace('">', '">' + v + ' ') : '').filter(Boolean).join(', ')) + $q.n + esc(t31(lang, 'src_h')) + '</a>');
const pc = permitCmp(x);
if (pc) L.push(esc(t31(lang, pc.k === 'ok' ? $q.o : pc.k === 'no' ? $q.p : $q.q, { code: pc.rw.code || pc.rw.item, reg: pc.rw.register, d: fd(pc.rw.checked, lang) })) + $q.r + pre(lang) + $q.s + esc(t31(lang, $q.g)) + '</a>');
else if (x.pn && x.rvw && x.rvw.reg && x.rvw.reg[0] === 'found') L.push(esc(t31(lang, $q.t, { reg: x.rvw.reg[1], d: fd(x.rvw.d, lang) })));
else if (x.pn) L.push(esc(t31(lang, $q.u)));
const rv = x.rvw && x.rvw.ok && x.rvw.d ? x.rvw.d : null;
if (rv) {
const age = days(rv, today);
L.push(esc(t31(lang, 'tb_rv', { d: fd(rv, lang), v: METHOD.v })) + ' ' + esc(t31(lang, $q.v, { p: '%P' })).replace('%P', $q.w + pre(lang) + $q.x + esc(ACC) + $q.y));
L.push(esc(age != null && age > LIM ? t31(lang, $q.z, { n: age }) : t31(lang, $q.A, { d: fd(addD(rv, LIM), lang) })));
} else if (o.checked) {
const age = days(o.checked, today);
if (age != null) L.push(esc(t31(lang, age > LIM ? $q.B : $q.C, { d: fd(o.checked, lang), n: age })));
}
const sl = satLast(o.sat, x.id);
if (sl) { const a = days(sl.d, today); L.push(esc(t31(lang, a != null && a > 62 ? $q.D : $q.E, { d: fd(sl.d, lang), n: a, c: sl.c, t: sl.t }))); }
const cp = CAP[x.id];
if (cp) L.push(esc(t31(lang, $q.F, { d: fd(cp[0], lang), h: cp[1].slice(0, 16) + '…' })) + $q.r + pre(lang) + $q.G + esc(x.id) + '">' + esc(t31(lang, $q.H)) + '</a>');
L.push($q.w + pre(lang) + $q.I + esc(t31(lang, $q.J)) + $q.K + pre(lang) + $q.L + esc(t31(lang, $q.M)) + '</a>');
L.push(esc(t31(lang, $q.N, { m: '%M' })).replace('%M', $t.k2));
return $q.X_K31_CSS + $t.k3 + esc(o.name) + $q.O + esc(x.id) + $q.P + sum + $q.Q + L.map(l => '<li>' + l + '</li>').join('') + $t.k4 + N31V + $q.R;
}
export function n31js() {
const W8 = {}; for (const l of Object.keys(S || { en: 1 })) W8[l] = [t31(l, 'w_btn'), t31(l, $q.S), t31(l, $q.T)];
return $t.k5 + JSON.stringify(W8).replace(/</g, $q.U) + $s.k0 +
$s.k1 +
$s.k2 +
$s.k3 +
$s.k4;
}
