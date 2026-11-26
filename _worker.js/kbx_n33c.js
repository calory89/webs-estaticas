// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_n33c__q, $t = TB.kbx_n33c__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const len = s => [...String(s)].length;
const ok = () => !!(TB.kbx_n33c_S && TB.kbx_n33c_S.en);
export function t(lang, k, v) {
  const T = TB.kbx_n33c_S || {}, s = (T[lang] && T[lang][k] != null) ? T[lang][k] : (T.en || {})[k];
  if (s == null) return '';
  return v && typeof s === $q.a ? s.replace(/\{(\w+)\}/g, (m, a) => v[a] != null ? v[a] : m) : s;
}
const PR = {};
export function pj(lang, k, nf) {
const F = t(lang, 'pj') || {}; let c = 'other';
try { c = (PR[lang] = PR[lang] || new Intl.PluralRules(lang)).select(k); } catch (e) {}
return String(F[c] || F.other || '{n}').replace('{n}', nf ? nf(k) : String(k));
}
export function pTitle(lang, f, q) {
if (!ok() || !f.y || f.dn) return null;
const by = q(lang, 'b_y', { n: f.n, y: f.y }), s1 = q(lang, 's1'), s2 = q(lang, 's2');
const pnT = f.pn ? q(lang, 't_pn') : t(lang, 't_pn0');
const first = f.ov ? q(lang, 't_ov', { mm: f.mm }) : f.h ? q(lang, 't_h', { h: f.h }) : null;
const hy = !f.ov && f.h && f.hy && f.hy !== f.h ? q(lang, 't_h', { h: f.hy }) : null;
const C = first ? [[first, pnT]].concat(hy ? [[hy, pnT]] : [], [[first]], hy ? [[hy]] : [], [[pnT]]) : [[pnT]];
const out = []; for (const parts of C) { const s = by + s1 + parts.join(s2); out.push(s + $q.b, s); }
return out.find(s => len(s) <= 60) || null;
}
export function pDesc(lang, f, q) {
if (!ok()) return null;
const head = f.ov && f.h ? q(lang, 'd_ov', { h: f.h, mm: f.mmD }) : f.mv ? q(lang, f.mv === 1 ? 'd_mv1' : 'd_mv', { k: f.nf ? f.nf(f.mv) : f.mv }) : !f.pn ? q(lang, 'd_pn0') : null;
const lead = (pl, by) => q(lang, $q.c, { n: f.n, by: by && f.by ? f.by : '', place: pl });
const base = [f.ov ? null : f.h ? t(lang, 'pd_h', { h: f.h }) : q(lang, 'd_h0'), '@pr', t(lang, f.plan ? $q.d : $q.e),
head && !f.ov && !f.mv ? null : q(lang, f.pn ? 'd_pn1' : 'd_pn0'), q(lang, 'd_chk', { d: f.d })].filter(Boolean);
const prs = f.price ? [t(lang, 'pd_pr', { p: f.price, d: f.readD }), t(lang, $q.f, { p: f.price })] : [t(lang, $q.g)];
const tails = prs.map(p => base.map(x => x === '@pr' ? p : x));
const sp = lang === 'zh' ? '' : ' ', H = head ? [head] : [];
const leads = [lead(f.place, true), lead(f.place, false), lead(f.place2, true), lead(f.place2, false)];
for (const L of [leads, [q(lang, 'b', { n: f.n }) + (lang === 'zh' ? '。' : '.')]])
for (let k = base.length; k >= (L === leads ? 2 : 1); k--) for (const ld of L) for (const tl of tails) { const s = H.concat([ld], tl.slice(0, k)).join(sp); if (len(s) <= 155) return s; }
return null;
}
export function dTitle(lang, f) {
if (!ok()) return null;
const k = pj(lang, f.k, f.nf), out = [];
for (const key of ['td_k1', 'td_k2', 'td_k3', 'td_k4']) { const s = t(lang, key, { dev: f.dev, y: f.y, k }); out.push(s + $q.b, s); }
const hit = out.find(s => len(s) <= 60); if (hit) return hit;
const W = String(f.dev).split(/,\s|\s\(/)[0].split(/\s+/), STOP = /^(and|y|de|del|la|el|&|of|the|und|et|en|-|–)$/i;
for (let n = W.length; n >= 2; n--) { if (STOP.test(W[n - 1])) continue; const dv = W.slice(0, n).join(' ');
for (const key of ['td_k2', 'td_k4']) { const s = t(lang, key, { dev: dv, y: f.y, k }); if (len(s) <= 60) return s; }
if (f.b) { const s = f.b(dv); if (len(s) <= 60) return s; } }
return null;
}
export function dHead(lang, f) {
if (!ok()) return null;
const nf = f.nf || String;
if (f.cc && f.cc.length) { const c = f.cc[0], v = { no: c.no, court: c.court, d: f.fd(c.date, lang), k: nf(f.cc.length) }; return t(lang, f.cc.length > 1 ? $q.h : 'dc_cc', v); }
if (f.ov) return t(lang, 'dc_ov', { a: nf(f.ov), k: nf(f.k) });
if (f.mv) return t(lang, 'dc_mv', { m: nf(f.mv) });
if (f.k - f.pn > 0) return t(lang, $q.i, { a: nf(f.k - f.pn), k: nf(f.k) });
return null;
}
let CC = null, CCP = null;
export async function ccData(env) {
if (CC) return CC; if (CCP) return CCP;
CCP = (async () => {
let j = null;
try { if (env && env.ASSETS) { const r = await env.ASSETS.fetch(new Request(ORIGIN + $t.k0)); if (r.ok) j = await r.json(); } } catch (e) { j = null; }
const m = new Map();
for (const c of (j && j.cases) || []) { if (!c || !c.dev || !c.no || !c.court || !/^https?:\/\//.test(c.src || '')) continue; if (!m.has(c.dev)) m.set(c.dev, []); m.get(c.dev).push(c); }
for (const a of m.values()) a.sort((x, y) => String(y.date || '').localeCompare(String(x.date || '')));
if (j) CC = m; CCP = null; return m;
})();
return CCP;
}
