// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_cal__q, $t = TB.kbx_cal__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { hcode } from './kbx_hdate.js';
import { TB } from './kbx_strings.js';
export const PATHS = /^\/projects\/[a-z0-9-]{1,90}\/calendar\.ics$/;
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a, "'": '&#39;' }[c]));
const T = TB.kbx_cal_T ;
const t = (lang, k, v) => { const s = (T[lang] && T[lang][k]) || T.en[k] || k; return v ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
const p2 = n => String(n).padStart(2, '0');
const lastDay = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();
export function span(d) {
const s = String(d == null ? '' : d).trim(); let m;
const mk = (y, m1, d1, m2, d2, norm) => (y >= 2000 && y <= 2060 ? { a: y + '-' + p2(m1) + '-' + p2(d1), b: y + '-' + p2(m2) + '-' + p2(d2), norm } : null);
if ((m = s.match(/^(\d{4})$/))) return mk(+m[1], 1, 1, 12, 31, m[1]);
if ((m = s.match(/^(\d{4})-Q([1-4])$/i)) || (m = s.match(/^Q([1-4]) (\d{4})$/i)) && (m = [0, m[2], m[1]])) { const y = +m[1], q = +m[2]; return mk(y, q * 3 - 2, 1, q * 3, lastDay(y, q * 3), y + '-Q' + q); }
if ((m = s.match(/^(\d{4})-H([12])$/i))) { const y = +m[1], h = +m[2]; return mk(y, h * 6 - 5, 1, h * 6, lastDay(y, h * 6), y + '-H' + h); }
if ((m = s.match(/^(\d{4})-(\d{2})$/)) && +m[2] >= 1 && +m[2] <= 12) return mk(+m[1], +m[2], 1, +m[2], lastDay(+m[1], +m[2]), s);
if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)) && +m[2] >= 1 && +m[2] <= 12 && +m[3] >= 1 && +m[3] <= lastDay(+m[1], +m[2])) return mk(+m[1], +m[2], +m[3], +m[2], +m[3], s);
if ((m = s.match(/^([A-Za-z]+) (\d{4})$/)) && MONTHS[m[1].toLowerCase()]) { const mo = MONTHS[m[1].toLowerCase()]; return mk(+m[2], mo, 1, mo, lastDay(+m[2], mo), m[2] + '-' + p2(mo)); }
const hc = hcode(s); if (hc && hc !== s) return span(hc);
return null;
}
export function calItems(x, prom) {
const out = [], seen = new Set();
for (const p of prom || []) {
const sp = span(p.d); if (!sp || seen.has(p.k + sp.norm)) continue; seen.add(p.k + sp.norm);
out.push({ k: p.k, d: sp.norm, a: sp.a, b: sp.b, st: p.st || null, mv: p.mv || 0, mm: p.mm || 0, seen: p.seen || null, sha: p.src === 'page' && p.sha ? p.sha : null,
hist: (p.hist || []).filter(h => h.d && h.d !== p.d).map(h => ({ d: h.d, seen: h.seen || null })) });
}
const fx = x.fx || {};
for (const [k, f] of [[$q.b, $q.c], [$q.d, $q.d]]) {
if (out.some(o => o.k === k)) continue;
const sp = span(fx[f]); if (sp) out.push({ k, d: sp.norm, a: sp.a, b: sp.b, st: null, mv: 0, mm: 0, seen: x.ad || null, sha: null, hist: [] });
}
return out.sort((p, q) => (p.b < q.b ? -1 : p.b > q.b ? 1 : p.a < q.a ? -1 : p.a > q.a ? 1 : 0));
}
const mIdx = s => +s.slice(0, 4) * 12 + (+s.slice(5, 7) - 1);
function rel(lang, months) {
try {
const f = new Intl.RelativeTimeFormat(LOC[lang] || 'en-GB', { numeric: 'auto' });
return Math.abs(months) >= 24 ? f.format(Math.trunc(months / 12), 'year') : f.format(months, 'month');
} catch (e) { return ''; }
}
export function calStatus(items, today) {
const past = items.filter(i => i.b < today), now = items.filter(i => i.a <= today && i.b >= today), next = items.filter(i => i.a > today);
const due = past.filter(i => i.k === $q.b).pop() || past[past.length - 1] || null;
return { due, now: now[0] || null, next: next[0] || null };
}
export function calHtml(x, prom, lang, kn, fdl, today) {
const items = calItems(x, prom); if (!items.length) return '';
today = today || new Date().toISOString().slice(0, 10);
const S = calStatus(items, today), L = [], tm = mIdx(today);
const strong = (k, p) => ({ k: '<b>' + esc(kn(k)) + '</b>', p: esc(fdl(p)) });
if (S.due) {
const st = S.due.st === 'kept' || S.due.st === $q.e || S.due.st === $q.f ? S.due.st : S.due.st ? 'open' : '';
L.push('<li' + (st === 'kept' ? $q.g : st === $q.e || st === 'open' ? $q.h : '') + '>' + t(lang, 'past', Object.assign(strong(S.due.k, S.due.d), { ago: esc(rel(lang, Math.min(0, mIdx(S.due.b) - tm))) })) + (st ? ' ' + esc(t(lang, 'st_' + st)) : '') + '</li>');
} else L.push('<li>' + esc(t(lang, 'nodue')) + '</li>');
if (S.now) L.push('<li>' + t(lang, 'now', strong(S.now.k, S.now.d)) + '</li>');
if (S.next) L.push('<li>' + t(lang, 'next', Object.assign(strong(S.next.k, S.next.d), { in: esc(rel(lang, Math.max(1, mIdx(S.next.a) - tm))) })) + '</li>');
const ics = $q.i + x.s + $q.j + (lang === 'en' ? '' : $q.k + lang);
return $q.l + esc(t(lang, 'h')) + $q.m + esc(t(lang, 'by', { d: fdl(today) })) + $q.n + L.join('') + '</ul>' +
$t.k0 + esc(ics) + $q.o + esc(x.s) + $q.p + esc(t(lang, 'btn')) + $q.q +
$t.k1 + esc(ics) + $q.r + esc(t(lang, 'sub')) + $q.s + esc(t(lang, 'note', { n: items.length })) + $q.t;
}
export const CAL_CSS = '.kcal{margin:22px 0 0;padding:16px 0 0;border-top:1px solid var(--k-line,var(--line))}.kcal h3{margin:0 0 6px}.kcal .kcal-l{margin:6px 0 12px}.kcal .kcal-l li{padding-inline-start:14px;border-inline-start:3px solid var(--k-line-2,var(--line))}.kcal .kcal-l li.kcal-due{border-inline-start-color:var(--k-warn,#8a5a00)}.kcal .kcal-l li.kcal-ok{border-inline-start-color:var(--k-ok,#1c6b46)}.kcal .bts{align-items:center}';
const icsEsc = s => String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const te = new TextEncoder();
function fold(line) {
const out = []; let cur = '', n = 0;
for (const ch of line) { const b = te.encode(ch).length; if (n + b > (out.length ? 74 : 75)) { out.push(cur); cur = ''; n = 0; } cur += ch; n += b; }
out.push(cur); return out.join('\r\n ');
}
const dnum = s => s.replace(/-/g, '');
const nextDay = s => new Date(Date.parse(s + $q.u) + 864e5).toISOString().slice(0, 10);
export function icsFor(x, items, lang, H) {
const page = ORIGIN + (lang === 'en' ? '' : '/' + lang) + $q.i + x.s + $q.v, src = x.url || x.du || page;
const L = [$q.w, $q.x, $t.k2, $q.y, $q.z,
$q.A + icsEsc(t(lang, 'cal', { n: x.n })), $q.B + icsEsc(t(lang, $q.C) + ' ' + page), $q.D, $q.E];
const n = {};
for (const i of items) {
n[i.k] = (n[i.k] || 0) + 1;
const p = H.fdl(i.d), desc = [t(lang, 'd_pub', { p })];
if (i.st) desc.push(t(lang, 'd_st', { st: H.ps(i.st) }));
if (i.mv) { const mv = H.moved(i.mv, i.mm); desc.push(mv.charAt(0).toUpperCase() + mv.slice(1) + '.'); }
if (i.hist.length) desc.push(H.histLabel + ': ' + i.hist.map(h => H.fdl(h.d) + (h.seen ? ' (' + H.fdl(h.seen) + ')' : '')).join(', ') + '.');
desc.push(t(lang, 'd_src', { u: src, d: H.fdl(i.seen || x.ad || H.stamp) }) + (i.sha ? $q.F + i.sha + '.' : ''));
desc.push(t(lang, 'd_rec', { u: page })); desc.push(t(lang, $q.C));
L.push($q.G, 'UID:' + x.id + '-' + i.k + '-' + n[i.k] + $q.H, $q.I + dnum(H.stamp) + $q.J, $q.K + dnum(i.b), $q.L + dnum(nextDay(i.b)),
$q.M + icsEsc(t(lang, 'ev', { n: x.n, k: H.kn(i.k), p })), $q.N + icsEsc(desc.join('\n')), 'URL:' + page, $q.O, $q.P);
}
L.push($q.Q);
return L.map(fold).join('\r\n') + '\r\n';
}
let NM = null;
export async function handle(req, u, env, ctx) {
const m = u.pathname.match(/^\/projects\/([a-z0-9-]{1,90})\/calendar\.ics$/); if (!m) return null;
if (req.method !== 'GET' && req.method !== 'HEAD') return new Response($q.R, { status: 405 });
const q = u.searchParams.get('lang'), lang = LANGS.includes(q) ? q : 'en';
const ck = new Request(ORIGIN + $q.S + m[1] + '/' + lang);
const hit = await caches.default.match(ck); if (hit) return hit;
let ix; try { if (!NM) NM = await import('./kbx_named.js'); ix = await NM.data(env); } catch (e) { return new Response($q.T, { status: 503, headers: { 'retry-after': '60' } }); }
const x = ix.bySlug.get(m[1]) || (/^[a-z]{2,5}-\d{3,4}$/.test(m[1]) && ix.byId.get(m[1].toUpperCase())), items = x ? calItems(x, ix.prom[x.id]) : [];
if (!x || !items.length) return new Response(x ? $t.k3 : $q.U, { status: 404, headers: { 'content-type': $q.V, 'cache-control': $q.W, 'x-robots-tag': $q.X } });
const stamp = NM.iso(ix.updated) || new Date().toISOString().slice(0, 10);
const body = icsFor(x, items, lang, { kn: k => NM.tr(lang, 'pk_' + k), fdl: d => NM.fd(d, lang), ps: s => NM.tr(lang, 'ps_' + s), moved: (k, mm) => NM.tr(lang, 'pr_moved', { k, mm }), histLabel: NM.tr(lang, $q.Y), stamp });
const r = new Response(body, { status: 200, headers: { 'content-type': $q.Z, 'content-disposition': $q.aa + m[1] + '.ics"', 'cache-control': $q.ab, 'x-robots-tag': $q.X, 'access-control-allow-origin': '*', 'x-content-type-options': $q.ac } });
if (ctx && ctx.waitUntil) ctx.waitUntil(caches.default.put(ck, r.clone()).catch(() => {}));
return r;
}
