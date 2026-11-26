// comments: _notes/kolaboro-worker-comments.txt
import { METHOD, ACC } from './kbx_e29_lines.js';
import { CAP } from './kbx_n31b_cap.js';
import { TB } from './kbx_strings.js';
export const N31V = '2';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let S = null, SP = null;
export async function loadS(env) {
if (S) return S; if (SP) return SP;
SP = (async () => { let v = null;
try { if (env && env.ASSETS) { const r = await env.ASSETS.fetch(new Request(TB.kbx_n31b_page__t.k0)); if (r.ok) v = await r.json(); } } catch (e) { v = null; }
if (!v) { try { const r = await fetch(TB.kbx_n31b_page__t.k1, { cf: { cacheTtl: 600, cacheEverything: true } }); if (r.ok) v = await r.json(); } catch (e) { v = null; } }
if (v && v.en) S = v; SP = null; return S; })();
return SP;
}
export const s31ready = () => !!S;
export const t31 = (lang, k, v) => { if (!S) return ''; const s = (S[lang] && S[lang][k] != null) ? S[lang][k] : S.en[k]; return v && typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (m, a) => v[a] != null ? v[a] : m) : s; };
const pre = l => l === 'en' ? '' : '/' + l;
const DAY = 864e5, LIM = 90;
const days = (a, b) => { const x = Date.parse(String(a || '').slice(0, 10) + 'T00:00:00Z'), y = Date.parse(String(b).slice(0, 10) + 'T00:00:00Z'); return isFinite(x) && isFinite(y) ? Math.round((y - x) / DAY) : null; };
const addD = (a, n) => { const x = Date.parse(String(a).slice(0, 10) + 'T00:00:00Z'); return isFinite(x) ? new Date(x + n * DAY).toISOString().slice(0, 10) : null; };
const norm = s => String(s || '').toLowerCase().replace(/[^0-9a-z฀-๿]/g, '');
export const kindIco = (k, lang) => !S || k < 0 || k > 3 ? '' : '<span class="k31k k' + k + '">' + esc(t31(lang, 'k' + k)) + '</span>';
export const K31_CSS = '<style id="k31-css">.k31t{margin:10px 0 0;border:1px solid var(--line);border-radius:10px;padding:0 12px}.k31t>summary{cursor:pointer;padding:10px 0;font-size:.95rem;min-height:44px;box-sizing:border-box}.k31t ul{margin:0 0 10px;padding-inline-start:18px}.k31t li{margin:0 0 6px;font-size:.92rem;overflow-wrap:anywhere}' +
'.k31k{font-size:.8rem;color:var(--muted);white-space:nowrap}.k31k::before{margin-inline-end:4px}.k0::before{content:"\\25C6";content:"\\25C6"/"";color:#1a7f37}.k1::before{content:"\\25CF";content:"\\25CF"/"";color:#9a6700}.k2::before{content:"\\25B2";content:"\\25B2"/"";color:#0969da}.k3::before{content:"\\25A0";content:"\\25A0"/"";color:#6e7781}.k31w{border:0;background:none;color:var(--muted);cursor:pointer;min-width:32px;min-height:32px}@media print{.k31w{display:none}}</style>';
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
const part = (lab, L) => L.length ? '<b>' + esc(t31(lang, lab)) + ':</b> ' + esc(L.join(', ')) : '';
const sum = any ? [part('tb_off', G.registry), part('tb_ind', G.independent), part('tb_dev', G.developer), part('tb_con', G.contradicted), part('tb_none', G.none)].filter(Boolean).join(' · ') : esc(t31(lang, 'tb_nr'));
const L = [];
const K = [0, 0, 0, 0]; for (const u of o.sources || []) { const k = o.kindOf(u); if (k >= 0) K[k]++; }
const n = K[0] + K[1] + K[2] + K[3];
if (n) L.push(esc(t31(lang, n === 1 ? 'tb_src1' : 'tb_src', { n, list: '%L' }) || t31(lang, 'tb_src', { n, list: '%L' })).replace('%L', K.map((v, k) => v ? kindIco(k, lang).replace('">', '">' + v + ' ') : '').filter(Boolean).join(', ')) + ' <a href="#sources">' + esc(t31(lang, 'src_h')) + '</a>');
const pc = permitCmp(x);
if (pc) L.push(esc(t31(lang, pc.k === 'ok' ? 'tb_pm_ok' : pc.k === 'no' ? 'tb_pm_no' : 'tb_pm_reg', { code: pc.rw.code || pc.rw.item, reg: pc.rw.register, d: fd(pc.rw.checked, lang) })) + ' <a href="' + pre(lang) + '/registers/">' + esc(t31(lang, 'tb_off')) + '</a>');
else if (x.pn && x.rvw && x.rvw.reg && x.rvw.reg[0] === 'found') L.push(esc(t31(lang, 'tb_pm_found', { reg: x.rvw.reg[1], d: fd(x.rvw.d, lang) })));
else if (x.pn) L.push(esc(t31(lang, 'tb_pm_none')));
const rv = x.rvw && x.rvw.ok && x.rvw.d ? x.rvw.d : null;
if (rv) {
const age = days(rv, today);
L.push(esc(t31(lang, 'tb_rv', { d: fd(rv, lang), v: METHOD.v })) + ' ' + esc(t31(lang, 'tb_acc', { p: '%P' })).replace('%P', '<a href="' + pre(lang) + '/team/#who"><bdi>' + esc(ACC) + '</bdi></a>'));
L.push(esc(age != null && age > LIM ? t31(lang, 'tb_old', { n: age }) : t31(lang, 'tb_cur', { d: fd(addD(rv, LIM), lang) })));
} else if (o.checked) {
const age = days(o.checked, today);
if (age != null) L.push(esc(t31(lang, age > LIM ? 'tb_age_old' : 'tb_age', { d: fd(o.checked, lang), n: age })));
}
const sl = satLast(o.sat, x.id);
if (sl) { const a = days(sl.d, today); L.push(esc(t31(lang, a != null && a > 62 ? 'tb_sat_old' : 'tb_sat', { d: fd(sl.d, lang), n: a, c: sl.c, t: sl.t }))); }
const cp = CAP[x.id];
if (cp) L.push(esc(t31(lang, 'tb_cap', { d: fd(cp[0], lang), h: cp[1].slice(0, 16) + '…' })) + ' <a href="' + pre(lang) + '/registers/captures/#' + esc(x.id) + '">' + esc(t31(lang, 'tb_cap_l')) + '</a>');
L.push('<a href="' + pre(lang) + '/what-we-cannot-know/">' + esc(t31(lang, 'tb_cant')) + '</a> · <a href="' + pre(lang) + '/conflicts-of-interest/">' + esc(t31(lang, 'tb_coi')) + '</a>');
L.push(esc(t31(lang, 'tb_wrong', { m: '%M' })).replace('%M', TB.kbx_n31b_page__t.k2));
return K31_CSS + TB.kbx_n31b_page__t.k3 + esc(o.name) + '" data-id="' + esc(x.id) + '"><summary>' + sum + '</summary><ul>' + L.map(l => '<li>' + l + '</li>').join('') + TB.kbx_n31b_page__t.k4 + N31V + '" defer></script>';
}
export function n31js() {
const W8 = {}; for (const l of Object.keys(S || { en: 1 })) W8[l] = [t31(l, 'w_btn'), t31(l, 'w_subj'), t31(l, 'w_body')];
return TB.kbx_n31b_page__t.k5 + JSON.stringify(W8).replace(/</g, '\\u003c') + TB.kbx_n31b_page__s.k0 +
TB.kbx_n31b_page__s.k1 +
TB.kbx_n31b_page__s.k2 +
TB.kbx_n31b_page__s.k3 +
TB.kbx_n31b_page__s.k4;
}
