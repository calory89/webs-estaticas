// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_n37u__q, $s = TB.kbx_n37u__s, $t = TB.kbx_n37u__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import * as N from './kbx_named.js';
import { coName, mkName } from './kbx_hdate.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const MEMO = {};
function file(e, p, t) { return FQ[p] || (FQ[p] = file0(e, p, t).finally(() => { delete FQ[p]; })); }   // n40 k21: one shared read per file
const FQ = {};
async function file0(env, p) {
const m = MEMO[p]; if (m && m.v && Date.now() - m.t < 600000) return m.v;
let v = null;
try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.a + p)); if (r.ok) v = await r.json(); } catch (e) { v = null; }
if (!v) { try { const r = await fetch(ORIGIN + p, { cf: { cacheTtl: 600 } }); if (r.ok) v = await r.json(); } catch (e) { v = null; } }
MEMO[p] = { t: Date.now(), v }; return v;
}
let T = null, D = null, IX = null, TL = null;
async function load(env) {
if (!T) { T = await file(env, $q.b); }
const d = await file(env, $q.c);
if (d && d !== D) { D = d; MS = null; IX = { bySlug: new Map(d.p.map(r => [r[1], r])), byDev: new Map(), byAr: new Map(), byMk: new Map(), src: 0, regs: 0 }; for (const r of d.p) { (IX.byMk.get(r[3]) || IX.byMk.set(r[3], []).get(r[3])).push(r); for (const c of r[8]) if (c && c[1]) IX.src++; if (r[5]) (IX.byDev.get(r[5]) || IX.byDev.set(r[5], []).get(r[5])).push(r); const a = r[3] + '|' + r[4]; (IX.byAr.get(a) || IX.byAr.set(a, []).get(a)).push(r); } }
if (!TL) TL = await file(env, $q.d);
await loadKP(env);
if (D && !IX.regs) { const g = new Set(); for (const k in D.rg) for (const x of D.rg[k]) g.add(x[0] + '|' + x[1]); IX.regs = g.size; }
return !!(T && D);
}
let MS = null;
const slugM = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const mBySlug = s => { if (!MS) { MS = new Map(); for (const k in D.mk) MS.set(slugM(k), k); } return MS.get(s); };
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.e, "'": '&#39;' }[c]));
const t = (l, k) => { const a = T && T[l] && T[l][k]; return a != null ? a : (T && T.en && T.en[k]) || ''; };
const tf = (l, k, v) => (v && (v.n === '1' || v.a === '1') && T && T[l] && T[l][k + '_1'] ? t(l, k + '_1') : t(l, k)).replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m).replace(/(\d\s?г)\.\.(?=\s|$)/g, '$1.');
const nf = (n, l) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { maximumFractionDigits: 1, numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
const fd = (d, l) => { if (!d) return ''; if (!/^\d{4}-\d{2}-\d{2}/.test(d)) return d; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: $q.f, month: 'short', year: $q.f, timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(d.slice(0, 10) + $q.g)); } catch (e) { return d.slice(0, 10); } };
const dir = l => l === 'ar' ? $q.h : '';
const bdi = s => '<bdi>' + esc(s) + $q.i;
const host = u => { try { return new URL(u, ORIGIN).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const recU = (l, s) => pre(l) + $q.j + s + $q.k;
const cnt = r => r[7].split('1').length - 1;
const LP = '(?:(es|de|fr|nl|ru|zh|ar)\\/)?';
const RX_REC = new RegExp('^\\/' + LP + 'projects\\/([a-z0-9-]{1,90})\\/record(\\/?)$'), RX_GAP = new RegExp('^\\/' + LP + 'data\\/gaps(\\/?)$'), RX_JS = /^\/projects\/([a-z0-9-]{1,90})\/record\.json$/;
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:projects\/[a-z0-9-]{1,90}\/(?:record|brief|documents|stress)|developers\/[a-z0-9-]{2,90}\/timeline|data\/(?:gaps|changes|changes\/week|how-we-verify|markets|pipeline|delays|developers|heat|markets\/[a-z0-9-]{2,60})|registers\/(?:malaysia|lookup))\/?$|^\/data\/n37u-se\.json$|^\/data\/changes\/feed\.atom$|^\/data\/changes(?:\/week)?\.json$|^\/(?:es|de|fr|nl|ru|zh|ar)\/(?:data|developers|engineering|yc)\/?$|^\/m\/[^/]{2,120}\/slugs\.json$|^\/projects\/[a-z0-9-]{1,90}\/record\.json$|^\/data\/gaps\.csv$/;
export const P39T1 = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?data\/(?:validate|query|duplicates|sources)\/?$|^\/data\/(?:record|changes)\.schema\.json$|^\/data\/(?:validate\.svg|records\.ndjson|changes\.csv)$/;
export const INJ = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:(?:projects\/[a-z0-9-]{1,90}|engineering|yc|yc\/try|data|data\/dictionary|registers|search|m\/[^/.]{2,60}|developers\/[a-z0-9-]{2,90})\/)?$/;
const TAP = '@media (max-width:640px){.n37-dot{display:inline-block;width:16px;font-size:0}.n37>p>a,.n37>p>b+a,.n37 section>p>a,.n37-kp>p a,.n37-vs>p .k-xs a,#n37-facts>p>a,#n37-kpm>p>a{display:inline-flex;align-items:center;min-height:44px}}';
const CSS = '<style id="n37u-css">' + TAP + '.n37{max-width:1100px}.n37 h2{margin:28px 0 8px;font-size:1.3rem}.n37 p,.n37 li{line-height:1.6}.n37 .k-xs{font-size:.9rem;color:var(--k-muted,#56636F)}' +
'.n37-tw{overflow-x:auto;border:1px solid var(--k-line,#D5DCDB);border-radius:12px;margin:10px 0 22px;background:var(--k-surface,#fff)}.n37 table{width:100%;border-collapse:collapse;font-size:.93rem}.n37 th,.n37 td{padding:9px 12px;border-bottom:1px solid var(--k-line,#D5DCDB);text-align:start;vertical-align:top}.n37 thead th{font-size:.82rem}.n37 td.n{font-variant-numeric:tabular-nums;white-space:nowrap}.n37 tbody th{font-weight:600;min-width:140px}' +
'.n37-b{display:inline-block;padding:2px 8px;border-radius:999px;font-size:.78rem;font-weight:700;border:1px solid currentColor;white-space:nowrap}.n37-b.reg{color:#1F6B3A}.n37-b.dev,.n37-b.web,.n37-b.portal{color:#6A4C00}.n37-b.sat{color:#155C75}.n37-b.rec{color:var(--k-muted,#56636F)}.n37-b.no{color:#9A3412}' +
':root[data-theme=dark] .n37-b.reg{color:#7FD49A}:root[data-theme=dark] .n37-b.dev,:root[data-theme=dark] .n37-b.web,:root[data-theme=dark] .n37-b.portal{color:#F2C46B}:root[data-theme=dark] .n37-b.sat{color:#7CC7E0}:root[data-theme=dark] .n37-b.no{color:#FFA07A}' +
'@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .n37-b.reg{color:#7FD49A}:root:not([data-theme=light]) .n37-b.dev,:root:not([data-theme=light]) .n37-b.web,:root:not([data-theme=light]) .n37-b.portal{color:#F2C46B}:root:not([data-theme=light]) .n37-b.sat{color:#7CC7E0}:root:not([data-theme=light]) .n37-b.no{color:#FFA07A}}' +
'.n37 tbody th a{color:inherit;text-decoration-style:dotted;text-underline-offset:3px}.n37-age{white-space:nowrap}.n37-b.old{color:#9A3412;margin-inline-start:6px}.n37-ds{display:block;width:100%;max-width:560px;height:auto;margin:8px 0 4px;color:#155C75}.n37-ds text{fill:var(--k-ink,#17212B);font-size:11px}' +
':root[data-theme=dark] .n37-ds{color:#7CC7E0}:root[data-theme=dark] .n37-b.old{color:#FFA07A}@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .n37-ds{color:#7CC7E0}:root:not([data-theme=light]) .n37-b.old{color:#FFA07A}}' +
'.n37 a{overflow-wrap:break-word}.n37-g li{margin:0 0 12px}.n37-g ul{margin:4px 0 0;padding-inline-start:18px}.n37 .n37-v{overflow-wrap:break-word;max-width:46ch;min-width:10ch}.n37-rel{display:flex;flex-wrap:wrap;gap:8px 18px;list-style:none;padding:0}.n37-rel a{display:inline-flex;align-items:center;min-height:44px}</style>';
async function page(shell, l, o) {
  const canon = ORIGIN + pre(l) + o.path;
  const crumbs = [[t(l, 'home'), pre(l) + '/']].concat(o.crumb || []).concat([[o.h1, null]]);
  const body = $q.l + dir(l) + $q.m + crumbs.map(c => c[1] ? $q.n + esc(c[1]) + '">' + esc(c[0]) + '</a>' : esc(c[0])).join(' / ') + $q.o + esc(o.h1) + $q.p + esc(o.lead) + '</p>' +
    $q.q + esc(tf(l, 'upd', { d: fd(D.built, l) })) + $q.r + dir(l) + '>' + CSS + o.body +
    $q.q + esc(t(l, 'meth')) + $q.s + pre(l) + $q.t + esc(t(l, 'vf_l')) + $q.u + esc(t(l, 'dl')) + $q.v + esc(t(l, 'code')) + $q.w + pre(l) + $q.x;
  const ld = { '@context': $q.y, '@graph': [{ '@type': $q.z, url: canon, name: o.h1, description: o.lead, inLanguage: l, dateModified: D.built || $q.A, isPartOf: { '@type': $q.B, name: $q.C, url: ORIGIN + '/' } },
    { '@type': $q.D, itemListElement: crumbs.map((c, i) => ({ '@type': $q.E, position: i + 1, name: c[0], item: c[1] ? ORIGIN + c[1] : canon })) }] };
  const desc = o.lead.length > 155 ? o.lead.slice(0, 152).replace(/\s+\S*$/, '') + '…' : o.lead;
  let html = await N.assemble({ title: (o.h1.length > 56 ? o.h1.slice(0, 56).replace(/\s+\S*$/, '') : o.h1) + $q.F, desc, canon, body, ld, alt: x => ORIGIN + pre(x) + o.path }, l, await shell(pre(l) + $q.G));
  const h = { 'content-type': $q.H, 'cache-control': $q.I, 'content-language': l };
  if (o.head) html = html.replace($q.J, o.head + $q.J);   // r6u
  if (o.noindex) { html = html.replace($q.J, $q.K); h[$q.L] = $q.M; }
  return new Response(html, { status: 200, headers: h });
}
const DEF = { ho: '/data/dictionary/#f-handover_on_record', pn: '/data/dictionary/#f-permit_number', un: '/data/dictionary/#f-dld_units', pr: '/data/dictionary/#f-price_min', co: '/data/dictionary/#f-registered_company', es: '/data/dictionary/#f-escrow_bank', cp: '/data/dictionary/#f-dld_percent_built', sat: '/satellite/construction-index/', reg: '/registers/', ct: '/courts/' };
const fname = (l, f) => $q.n + (f === 'ct' ? '' : pre(l)) + DEF[f] + $q.N + esc(t(l, 'def_t')) + '">' + esc(t(l, 'f_' + f)) + '</a>';
const ageOf = d => (/^\d{4}-\d{2}-\d{2}/.test(d || '') ? Math.max(0, Math.floor((Date.now() - Date.parse(d.slice(0, 10) + $q.O)) / 86400000)) : null);
const OLD = 180;
const median = a => { const b = a.slice().sort((x, y) => x - y), n = b.length; return n ? (n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2) : 0; };
const badge = (l, k) => $q.P + k + '">' + esc(t(l, 'k_' + k)) + $q.Q;
const regsFor = r => (D.rg[r[3]] || D.rg[(D.co[r[0]] === 'USA' ? $q.R : D.co[r[0]])] || []);
const relTable = (l, rows) => $t.k0 + esc(t(l, 'tw_l')) + $q.S + esc(t(l, 'th_p')) + $q.T + esc(t(l, 'th_k')) + $q.U +
rows.map(r => $q.V + recU(l, r[1]) + '">' + bdi(r[2]) + $q.W + nf(cnt(r), l) + $q.X).join('') + $q.Y;
const TLF = ['ho', 'pn', 'un', 'pr', 'co', 'es', 'cp', 'reg'];
function tlEvents(r) {
const h = TL && TL.p && TL.p[r[1]], days = (TL && TL.days) || [], out = [];
if (!h) return null;
for (const f of TLF) {
const c = r[8][D.f.indexOf(f)], cur = c ? String(c[0]).trim() : null, tt = h[f] || [];
tt.forEach(([di, v], j) => out.push({ f, d: days[di][0], v, p: j ? tt[j - 1][1] : null, e: v == null ? 'tl_e3' : j === 0 ? (di === 0 ? 'tl_e0' : 'tl_e1') : 'tl_e2' }));
const last = tt.length ? tt[tt.length - 1][1] : null;
if (cur !== last) out.push({ f, d: D.built, v: cur, p: last, e: cur == null ? 'tl_e3' : last == null ? 'tl_e1' : 'tl_e2', now: 1 });
}
return out;
}
const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const qtr = v => { v = String(v || '').trim(); let m = /^(\d{4})-Q([1-4])$/.exec(v) || /^Q([1-4])\s+(\d{4})$/i.exec(v) && [0, RegExp.$2, RegExp.$1]; if (m) return [+m[1], +m[2]];
m = /^(\d{4})-(\d{2})/.exec(v); if (m) return [+m[1], Math.floor((+m[2] - 1) / 3) + 1, +m[2]];
m = /^(?:\d{1,2}\s+)?([a-z]{3})[a-z]*\.?,?\s+(\d{4})$/i.exec(v); if (m && MON[m[1].toLowerCase()]) { const mo = MON[m[1].toLowerCase()]; return [+m[2], Math.floor((mo - 1) / 3) + 1, mo]; }
m = /^(\d{4})$/.exec(v); return m ? [+m[1], 0] : null; };
function realChange(x) {
if (x.e !== 'tl_e2' || x.p == null || x.v == null) return false;
const a = x.p.toLowerCase(), b = x.v.toLowerCase(); if (a.includes(b) || b.includes(a)) return false;
if (x.f === 'ho') { const qa = qtr(x.p), qb = qtr(x.v); if (qa && qb && qa[0] === qb[0] && (!qa[1] || !qb[1] || (qa[1] === qb[1] && (!qa[2] || !qb[2] || qa[2] === qb[2])))) return false; }
return true;
}
const tv = (v, l, n) => { if (v == null) return ''; const s = /^\d{4}-\d{2}-\d{2}$/.test(v) ? fd(v, l) : v; return n && s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };
function tlSection(l, r) {
if (!TL || !TL.days || !TL.days.length) return '';
const days = TL.days, a = fd(days[0][0], l), z = fd(days[days.length - 1][0], l), ev = tlEvents(r);
let b = $q.Z + esc(t(l, 'tl_h')) + $q.aa + esc(tf(l, 'tl_p', { a, b: z })) + '</p>';
if (!ev) b += '<p>' + esc(tf(l, $q.ab, { b: z })) + '</p>';
else {
b += $t.k1 + esc(t(l, 'tw_l')) + $q.S + esc(t(l, 'th_f')) + $q.T + esc(t(l, 'tl_d')) + $q.T + esc(t(l, 'tl_th')) + $q.T + esc(t(l, 'th_v')) + $q.U +
ev.map(x => $q.ac + fname(l, x.f) + $q.ad + esc(fd(x.d, l)) + $q.ae + esc(t(l, x.e)) + $q.af + (x.v == null ? '' : bdi(tv(x.v, l))) + $q.ag).join('') + $q.Y;
const ch = [...new Set(ev.filter(x => x.e === 'tl_e2' || x.e === 'tl_e3').map(x => x.f))].map(f => t(l, 'f_' + f));
b += '<p>' + esc(ch.length ? tf(l, ch.length === 1 ? 'tl_c1' : 'tl_cn', { n: nf(ch.length, l), f: ch.join(', ') }) : t(l, 'tl_c0')) + '</p>';
}
return b + $q.q + esc(t(l, $q.ah)) + $t.k2 + esc(t(l, $q.ai)) + $t.k3 + esc(t(l, 'dl')) + $t.k4 + esc(t(l, 'code')) + $q.aj;
}
const TLP = ['ho', 'pr', 'cp', 'un', 'es', 'pn', 'co', 'reg'];
function latestChange(r) {
const ev = tlEvents(r); if (!ev) return null;
const rc = ev.filter(realChange).sort((x, y) => (y.d > x.d ? 1 : y.d < x.d ? -1 : 0) || TLP.indexOf(x.f) - TLP.indexOf(y.f));
return rc.length ? { x: rc[0], n: rc.length } : null;
}
async function recPage(env, shell, l, r) {
const F = D.f, P = pre(l), k = cnt(r), m = D.mk[r[3]];
let b = $q.ak + P + $q.j + r[1] + '/">' + esc(t(l, 'back')) + $q.al + esc(tf(l, 'held', { k: nf(k, l) })) + $q.am + r[1] + $t.k5 + esc(t(l, 'js_l')) + $t.k6 + P + $q.j + r[1] + $q.an + esc(t(l, 'a_br')) + $q.aj;
b += $q.ao + esc(t(l, 'r_tbl')) + $t.k7 + esc(t(l, 'tw_l')) + $q.S + esc(t(l, 'th_f')) + $q.T + esc(t(l, 'th_v')) + $q.T + esc(t(l, 'th_s')) + $q.T + esc(t(l, 'th_d')) + $q.T + esc(t(l, $q.ap)) + $q.U +
F.map((f, i) => { const c = r[8][i]; if (!c) return $q.ac + fname(l, f) + $q.aq + esc(t(l, 'none')) + $q.ar + esc(t(l, 'none')) + $q.as;
const ag = f === 'ct' ? null : ageOf(c[3]);
const v = f === 'ct' ? nf(c[0], l) : String(c[0]), u = c[1], src = u ? $q.n + esc(u) + '"' + (/^https?:/.test(u) ? $q.at : '') + '>' + esc(/^https?:/.test(u) ? host(u) : u) + '</a>' : $q.n + P + $q.j + r[1] + $q.au + esc(t(l, 'rec_n')) + '</a>';
return $q.ac + fname(l, f) + $q.av + bdi(v) + $q.ae + badge(l, c[2]) + ' ' + src + $q.aw + esc(fd(c[3], l)) + $q.ax + (ag == null ? '' : nf(ag, l) + (ag > OLD ? $q.ay + esc(t(l, $q.az)) + $q.Q : '')) + $q.ag; }).join('') + $q.Y;
const aged = F.map((f, i) => [f, r[8][i]]).filter(x => x[1] && x[0] !== 'ct' && ageOf(x[1][3]) != null).sort((a, c) => ageOf(c[1][3]) - ageOf(a[1][3]));
if (aged.length) b += $q.aA + esc(ageOf(aged[0][1][3]) > OLD ? tf(l, $q.aB, { f: t(l, 'f_' + aged[0][0]), d: fd(aged[0][1][3], l) }) : t(l, $q.aC)) + $q.aD + esc(t(l, $q.aE)) + $q.aF;
b += kpBlock(l, r[1], 'kpkt', 'h2');
b += tlSection(l, r);
const miss = F.map((f, i) => [f, i]).filter(x => !r[8][x[1]]), RG = regsFor(r);
b += $q.aG + esc(tf(l, 'g_h', { k: nf(miss.length, l) })) + '</h2>';
if (!miss.length) b += '<p>' + esc(t(l, 'g_all')) + '</p>';
else b += '<p>' + esc(t(l, 'g_p')) + $q.aH + miss.map(([f]) => { const rr = RG.filter(g => g[2].includes(f));
return $q.aI + fname(l, f) + $q.aJ + esc(t(l, 'ask_' + f)) + (rr.length ? '<ul>' + rr.map(g => '<li>' + esc(t(l, 'g_reg')) + ': ' + (g[1] ? $q.n + esc(g[1]) + $q.aK + bdi(g[0]) + '</a>' : bdi(g[0])) + (g[4] ? $q.aL + esc(tf(l, $q.aM, { d: fd(g[4], l) })) + $q.aN : '') + '</li>').join('') + '</ul>' : (['pn', 'co', 'es', 'reg'].includes(f) ? $q.aD + esc(tf(l, $q.aO, { m: r[3] })) + $q.Q : '')) + '</li>'; }).join('') + $q.aP + P + $q.j + r[1] + $q.aQ + esc(t(l, $q.aR)) + $q.aj;
if (m) {
const more = D.p.filter(x => x[3] === r[3] && cnt(x) > k).length;
b += $q.aS + esc(tf(l, 'm_h', { m: r[3] })) + $q.aa + esc(tf(l, 'm_p', { k: nf(k, l), m: r[3], md: nf(m.med, l), n: nf(m.n, l) }) + ' ' + tf(l, more === 0 ? 'm_r0' : more === 1 ? 'm_r1' : 'm_rn', { r: nf(more, l) })) + $t.k8 + esc(t(l, 'tw_l')) + $q.S + esc(t(l, 'th_f')) + $q.T + esc(t(l, 'm_th2')) + $q.T + esc(tf(l, 'm_th3', { m: r[3] })) + $q.U +
F.map((f, i) => $q.ac + fname(l, f) + $q.aq + esc(t(l, r[7][i] === '1' ? 'yes' : 'no')) + $q.aw + bdi(nf(m.cov[i], l) + '%') + $q.ag).join('') + $q.Y;
}
const sd = (IX.byDev.get(r[5]) || []).filter(x => x !== r).sort((a, c) => cnt(c) - cnt(a)).slice(0, 12);
if (r[5] && sd.length) b += $q.aT + esc(tf(l, 'd_h', { d: r[6] })) + '</h2>' + relTable(l, sd);
{ const k = r[5] && devTrack(r[5]); if (k) b += $q.ak + pre(l) + $q.aU + r[5] + $q.aV + esc(tf(l, $q.aW, { d: r[6] || r[5], p: nf(k.p, l), t: nf(k.th.length, l) })) + $q.aj; }
const sa = (IX.byAr.get(r[3] + '|' + r[4]) || []).filter(x => x !== r && !sd.includes(x)).sort((a, c) => cnt(c) - cnt(a)).slice(0, 12);
if (r[4] && sa.length) b += $q.aX + esc(tf(l, 'a_h', { a: r[4] })) + '</h2>' + relTable(l, sa);
b += await fpBlock(l, r) + n39Links(l);
b += $q.ak + P + $q.aY + esc(t(l, $q.aZ)) + $t.k9 + P + $q.ba + esc(t(l, 'ch_h1')) + $q.aj + devLine(l, r) + buyRow(l, r, $q.bb);
return page(shell, l, { path: $q.j + r[1] + $q.k, h1: tf(l, 'r_h1', { n: r[2] }), lead: t(l, $q.bc), body: b, noindex: true, crumb: [[t(l, $q.bd), pre(l) + $q.j], [r[2], pre(l) + $q.j + r[1] + '/']] });
}
async function gapPage(env, shell, l) {
const F = D.f, P = pre(l), M = Object.entries(D.mk).filter(([, v]) => v.n >= 10).sort((a, b) => b[1].n - a[1].n);
let b = '<h2>' + esc(t(l, $q.be)) + $t.k10 + esc(t(l, 'tw_l')) + $q.S + esc(t(l, 'gp_m')) + $q.T + esc(t(l, 'gp_n')) + $q.T + esc(t(l, 'gp_md')) + '</th>' + F.map(f => $q.bf + fname(l, f) + '</th>').join('') + $q.bg +
$q.ac + esc(tf(l, $q.bh, { n: nf(D.n, l) })) + $q.ad + nf(D.n, l) + $q.bi + D.known.map(k => $q.bj + bdi(nf(Math.round(100 * k / D.n), l) + '%') + '</td>').join('') + '</tr>' +
M.map(([m, v]) => $q.ac + bdi(m) + $q.ad + nf(v.n, l) + $q.aw + nf(v.med, l) + '</td>' + v.cov.map(c => $q.bj + bdi(nf(c, l) + '%') + '</td>').join('') + '</tr>').join('') + $t.k11 + esc(t(l, 'csv_l')) + $t.k12 + P + $q.bk + esc(t(l, 'mc_h1')) + $q.aj;
const H = Array(11).fill(0); for (const x of D.p) H[cnt(x)]++;
const mx = Math.max.apply(null, H) || 1, five = H.slice(5).reduce((a, c) => a + c, 0), md = median(D.p.map(cnt));
const svg = $t.k13 + H.map((c, i) => { const h = Math.round(120 * c / mx), x = 8 + i * 39; return $q.bl + x + '" y="' + (140 - h) + $q.bm + h + $t.k14 + (x + 15) + '" y="' + (134 - h) + $q.bn + nf(c, l) + $q.bo + (x + 15) + $q.bp + i + $q.bq; }).join('') + $q.br;
b += $q.bs + esc(t(l, 'ds_h')) + $q.bt + esc(tf(l, $q.bu, { a: nf(five, l), n: nf(D.n, l), p: nf(Math.round(100 * five / D.n), l), md: nf(md, l), z: nf(H[0], l) })) + '</p>' + svg + $q.q + esc(t(l, 'ds_p')) + '</p>' +
$t.k15 + esc(t(l, 'tw_l')) + $q.S + esc(t(l, $q.bv)) + '</th>' + H.map((c, i) => $q.bw + i + '</th>').join('') + $t.k16 + esc(t(l, $q.bx)) + '</th>' + H.map(c => $q.bj + nf(c, l) + '</td>').join('') + $q.by;
b += '<h2>' + esc(t(l, $q.bz)) + $q.aa + esc(t(l, $q.bA)) + $t.k17 + esc(t(l, 'tw_l')) + $q.S + esc(t(l, 'gp_m')) + $q.T + esc(t(l, 'g_reg')) + $q.T + esc(t(l, 'th_f')) + $q.U +
Object.entries(D.rg).map(([m, rs]) => rs.filter(g => g[2].length).map(g => $q.ac + bdi(m) + $q.aq + (g[1] ? $q.n + esc(g[1]) + $q.aK + bdi(g[0]) + '</a>' : bdi(g[0])) + $q.ae + g[2].map(f => esc(t(l, 'f_' + f))).join(', ') + $q.ag).join('')).join('') + $q.Y;
b += '<h2>' + esc(t(l, $q.bB)) + $q.aa + esc(t(l, $q.bC)) + '</p>' + M.slice(0, 8).map(([m]) => '<h3>' + bdi(m) + $q.bD + D.p.filter(x => x[3] === m).sort((a, c) => cnt(a) - cnt(c) || a[0].localeCompare(c[0])).slice(0, 5).map(x => $q.bE + recU(l, x[1]) + '">' + bdi(x[2]) + $q.bF + nf(cnt(x), l) + $q.bG).join('') + '</ul>').join('');
return page(shell, l, { path: $q.bH, h1: t(l, 'gp_h1'), lead: t(l, $q.bI), body: b, crumb: [[t(l, 'data'), pre(l) + $q.bJ]] });
}
function gapsCsv() {
const F = D.f, q = v => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const L = [$t.k18 + (D.built || '') + $t.k19,
[$q.bK, $q.bL, $q.bd, $q.bM].concat(F.map(f => 'pct_' + f)).join(',')];
L.push(['ALL', '', D.n, median(D.p.map(cnt))].concat(D.known.map(k => Math.round(100 * k / D.n))).map(q).join(','));
for (const [m, v] of Object.entries(D.mk).sort((a, b) => b[1].n - a[1].n)) L.push([m, v.co || '', v.n, v.med].concat(v.cov).map(q).join(','));
return new Response(L.join('\n') + '\n', { headers: { 'content-type': $q.bN, 'content-disposition': $q.bO, 'access-control-allow-origin': '*', 'cache-control': $q.I } });
}
const KINDS = ['reg', 'dev', 'portal', 'web', 'sat', 'rec'], DRX = '^\\d{4}-\\d{2}-\\d{2}$', URX = '^https?://';
const nul = s => ({ type: [$q.bP, 'null'], ...s });
function schemas() {
if (IX.sch) return IX.sch;
const F = D.f, reg = { type: $q.bQ, required: ['name', 'url', $q.bR], additionalProperties: false, properties: { name: { type: $q.bP, minLength: 1 }, url: nul({ pattern: URX }), reached_by_our_checker: nul({}) } };
const rec = { $schema: $t.k20, $id: ORIGIN + $q.bS, title: $t.k21, description: $s.k0, type: $q.bQ,
required: ['id', 'slug', 'name', $q.bK, 'area', $q.bT, 'page', $q.bb, 'built', $q.bU, $q.bV, $q.bW, 'kinds', 'facts', $q.bX], additionalProperties: false,
properties: { id: { type: $q.bP, minLength: 3 }, slug: { type: $q.bP, pattern: $q.bY }, name: { type: $q.bP, minLength: 1 }, market: { type: $q.bP, minLength: 2 }, area: nul({}), developer: nul({}), page: { type: $q.bP, pattern: URX }, record: { type: $q.bP, pattern: URX }, built: nul({ pattern: DRX }), licence: { type: $q.bP },
fields_held: { type: $q.bZ, minimum: 0, maximum: F.length }, fields_total: { const: F.length }, kinds: { type: $q.bQ, required: KINDS, additionalProperties: false, properties: Object.fromEntries(KINDS.map(k => [k, { type: $q.bP }])) },
facts: { type: 'array', maxItems: F.length, items: { type: $q.bQ, required: ['field', 'label', 'value', $q.ca, 'kind', 'date', $q.cb, $q.cc], additionalProperties: false, properties: { field: { enum: F }, label: { type: $q.bP, minLength: 1 }, value: { type: [$q.bP, $q.cd] }, source: { type: $q.bP, pattern: URX }, kind: { enum: KINDS }, date: nul({ pattern: DRX }), date_is: { enum: ['read', $q.ce, $q.cf, $q.cg] }, definition: { type: $q.bP, pattern: URX } } } },
unknown: { type: 'array', maxItems: F.length, items: { type: $q.bQ, required: ['field', 'label', $q.ch, $q.ci], additionalProperties: false, properties: { field: { enum: F }, label: { type: $q.bP }, how_to_find: { type: $q.bP }, registers: { type: 'array', items: reg } } } },
sha256_facts: { type: $q.bP, pattern: $q.cj, description: $t.k22 } } };
const ch = { $schema: $t.k23, $id: ORIGIN + $q.ck, title: $t.k24, type: $q.bQ, required: ['built', $q.bU, 'rule', $q.cl, 'total', $q.cm, 'limit', $q.cn],
properties: { built: { type: $q.bP, pattern: DRX }, licence: { type: $q.bP }, rule: { type: $q.bP }, copies_from: nul({ pattern: DRX }), total: { type: $q.bZ, minimum: 0 }, offset: { type: $q.bZ, minimum: 0 }, limit: { type: $q.bZ, minimum: 1, maximum: 1000 }, filters: { type: $q.bQ },
changes: { type: 'array', items: { type: $q.bQ, required: ['date', 'slug', $q.co, $q.bK, 'field', 'from', 'to', $q.bb], properties: { date: { type: $q.bP, pattern: DRX }, slug: { type: $q.bP, pattern: $q.bY }, project: { type: $q.bP }, market: { type: $q.bP }, developer: nul({}), field: { enum: F }, label: { type: $q.bP }, from: {}, to: {}, months_moved: { type: [$q.bZ, 'null'] }, record: { type: $q.bP, pattern: URX }, source_of_current_value: nul({ pattern: URX }) } } } } };
return (IX.sch = { record: rec, changes: ch });
}
const tyOf = v => v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? $q.bZ : typeof v;
function jsv(s, v, p, out) {
if (out.length > 20) return out;
if (s.type) { const ts = [].concat(s.type), y = tyOf(v); if (!ts.some(x => x === y || (x === $q.cd && y === $q.bZ))) { out.push(p + $q.cp + y + $q.cq + ts.join('|')); return out; } }
if ('const' in s && v !== s.const) out.push(p + $q.cr + s.const);
if (s.enum && !s.enum.includes(v)) out.push(p + ': ' + String(v).slice(0, 40) + $q.cs);
if (typeof v === $q.bP) { if (s.pattern && !new RegExp(s.pattern).test(v)) out.push(p + ': ' + v.slice(0, 50) + $q.ct + s.pattern); if (s.minLength && v.length < s.minLength) out.push(p + $q.cu); }
if (typeof v === $q.cd) { if (s.minimum != null && v < s.minimum) out.push(p + $q.cv + s.minimum); if (s.maximum != null && v > s.maximum) out.push(p + $q.cw + s.maximum); }
if (Array.isArray(v)) { if (s.maxItems != null && v.length > s.maxItems) out.push(p + $q.cx); if (s.items) v.forEach((x, i) => jsv(s.items, x, p + '/' + i, out)); }
else if (v && typeof v === $q.bQ) { for (const k of s.required || []) if (!(k in v)) out.push(p + ': ' + k + $q.cy); for (const k in v) { if (s.properties && s.properties[k]) jsv(s.properties[k], v[k], p + '/' + k, out); else if (s.additionalProperties === false) out.push(p + ': ' + k + $q.cz); } }
return out;
}
const RULES = ['v_r1', 'v_r2', 'v_r3', 'v_r4', 'v_r5', 'v_r6'];
function validateAll() {
if (IX.val) return IX.val;
const S = schemas().record, bad = [], seenS = new Set(), seenI = new Set(), ho = D.f.indexOf('ho'), cp = D.f.indexOf('cp'), rc = Array(RULES.length).fill(0); let ok = 0;
for (const r of D.p) {
const e = jsv(S, recObj(r), '', []), fx = [];
r[8].forEach((c, i) => { if (!c) return; if (c[3] && /^\d{4}-\d{2}-\d{2}$/.test(c[3]) && (isNaN(Date.parse(c[3] + $q.O)) || (D.f[i] !== 'ct' && c[3] > D.built))) fx.push([0, D.f[i]]); if (c[2] === 'reg' && !c[1]) fx.push([1, D.f[i]]); });
if (r[8][ho] && !/^\d{4}-\d{2}-\d{2}$/.test(String(r[8][ho][0])) && mIdx(String(r[8][ho][0])) == null) fx.push([2, 'ho']);
if (r[8][cp]) { const n = parseFloat(String(r[8][cp][0]).replace(',', '.')); if (!isNaN(n) && (n < 0 || n > 100)) fx.push([3, 'cp']); }
if (seenS.has(r[1]) || seenI.has(r[0])) fx.push([4, '']); seenS.add(r[1]); seenI.add(r[0]);
if (cnt(r) !== r[8].filter(Boolean).length) fx.push([5, '']);
for (const x of fx) rc[x[0]]++;
if (!e.length && !fx.length) ok++; else bad.push([r, e, fx]);
}
return (IX.val = { n: D.p.length, ok, bad, rc });
}
function canon(v) { return Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : v && typeof v === $q.bQ ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}' : JSON.stringify(v); }
async function sha(s) { const b = await crypto.subtle.digest($q.cA, new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function recJson2(r) { const o = recObj(r); o.sha256_facts = await sha(canon(o.facts)); return new Response(JSON.stringify(o, null, 1), { headers: { ...JH, 'x-robots-tag': $q.cB, link: '<' + ORIGIN + $t.k25 } }); }
async function fpBlock(l, r) {
const h = await sha(canon(recObj(r).facts));
return $q.cC + esc(t(l, 'fp_h')) + $q.aa + esc(t(l, 'fp_p')) + $t.k26 + h + $t.k27 + h + $q.cD + r[1] + $q.cE + esc(t(l, 'fp_ok')) + $q.cF + esc(t(l, 'fp_no')) + $s.k1 + esc(t(l, 'fp_b')) + $t.k28 +
$q.q + esc(t(l, 'fp_n')) + $t.k29 +
$s.k2;
}
async function cond(req, r) {   // ETag from the body, 304 when the client already holds it
  const body = await r.text(), et = '"' + (await sha(body)).slice(0, 32) + '"', h = new Headers(r.headers); h.set('etag', et);
  const inm = req.headers.get($q.cG) || '';
  if (inm.split(',').map(s => s.trim().replace(/^W\//, '')).includes(et)) { h.delete($q.cH); return new Response(null, { status: 304, headers: h }); }
  return new Response(req.method === 'HEAD' ? null : body, { status: r.status, headers: h });
}
const tw39 = (l, th, rows) => $t.k30 + esc(t(l, 'tw_l')) + $q.cI + th.map(k => $q.bf + esc(t(l, k)) + '</th>').join('') + $q.bg + rows.join('') + $q.Y;
const kp39 = (l, a) => $q.cJ + a.map(([v, k]) => $q.cK + bdi(v) + $q.cL + esc(k) + $q.cM).join('') + $q.cN;
const dLnk = (l, f) => $q.n + recU(l, f[1]) + '">' + bdi(f[2]) + '</a>';
const csvQ = v => { const s = String(v == null ? '' : v); return /[",\n\r]/.test(s) || /^[=+\-@]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const CSVH = n => ({ 'content-type': $q.bN, 'content-disposition': $q.cO + n + '"', 'access-control-allow-origin': '*', 'cache-control': $q.I });
async function validatePage(env, shell, l) {
const v = validateAll(), P = pre(l);
let b = kp39(l, [[nf(v.ok, l) + ' / ' + nf(v.n, l), t(l, 'v_k1')], [nf(v.bad.filter(x => x[1].length).length, l), t(l, 'v_k2')], [nf(v.bad.filter(x => x[2].length).length, l), t(l, 'v_k3')]]);
b += $t.k31 + esc(tf(l, $q.cP, { ok: nf(v.ok, l), n: nf(v.n, l) })) + $t.k32 + esc(t(l, 'v_emb')) + $t.k33 + ORIGIN + $t.k34;
b += '<h2>' + esc(t(l, 'v_h2')) + $q.aa + esc(t(l, 'v_p2')) + $s.k3;
b += '<h2>' + esc(t(l, 'v_h3')) + '</h2>' + tw39(l, [$q.cQ, $q.cR], RULES.map((k, i) => $q.cS + esc(t(l, k)) + $q.aw + nf(v.rc[i], l) + $q.ag));
b += $q.cT + esc(tf(l, 'v_h4', { n: nf(v.bad.length, l) })) + '</h2>' + (v.bad.length ? tw39(l, ['th_p', $q.cU], v.bad.slice(0, 200).map(([r, e, fx]) => $q.ac + dLnk(l, r) + $q.aq + e.slice(0, 5).map(x => $q.cV + esc(x) + $q.cW).join('<br>') + (e.length && fx.length ? '<br>' : '') + fx.map(x => esc(t(l, RULES[x[0]])) + (x[1] ? ' (' + esc(t(l, 'f_' + x[1])) + ')' : '')).join('<br>') + $q.ag)) : '<p>' + esc(t(l, $q.cX)) + '</p>');
b += $q.cY + P + $q.cZ + esc(t(l, 'q_h1')) + '</a>' + $t.DOT + $q.n + P + $q.da + esc(t(l, 'du_h1')) + '</a>' + $t.DOT + $q.n + P + $q.db + esc(t(l, 'so_h1')) + $q.aj;
return page(shell, l, { path: $q.dc, h1: t(l, 'v_h1'), lead: tf(l, $q.dd, { n: nf(v.n, l) }), body: $s.N39C + b, crumb: [[t(l, 'data'), P + $q.bJ]] });
}
function badgeSvg() {
const v = validateAll(), a = $q.de, bt = v.ok.toLocaleString('en-GB') + ' / ' + v.n.toLocaleString('en-GB'), w1 = 92, w2 = 104, c = v.ok === v.n ? $q.df : v.ok / v.n >= 0.99 ? $q.dg : $q.dh;
const s = $t.k35 + (w1 + w2) + $q.di + a + ': ' + bt + $q.dj + a + ': ' + bt + ' (' + D.built + $q.dk + w1 + $t.k36 + w1 + $q.dl + w2 + $q.dm + c + $s.k4 + w1 / 2 + $q.dn + a + $q.bo + (w1 + w2 / 2) + $q.dn + bt + $q.do;
return new Response(s, { headers: { 'content-type': $q.dp, 'access-control-allow-origin': '*', 'cache-control': $q.I } });
}
function qRun(u) {
const g = k => String(u.searchParams.get(k) || '').slice(0, 120).trim(), F = D.f, fl = k => g(k).split(',').map(s => s.trim()).filter(Boolean);
const q = { m: g('m'), dev: g('dev'), has: fl('has'), miss: fl('miss'), kind: g('kind'), min: Math.max(0, Math.min(10, parseInt(g('min'), 10) || 0)), q: g('q').toLowerCase(), sort: g('sort') || 'facts', limit: Math.min(500, Math.max(1, parseInt(g('limit'), 10) || 100)), offset: Math.min(100000, Math.max(0, parseInt(g($q.cm), 10) || 0)) };
for (const f of q.has.concat(q.miss)) if (!F.includes(f)) return { err: $q.dq + F.join(', ') };
if (q.kind && !KINDS.includes(q.kind)) return { err: $q.dr + KINDS.join(', ') };
if (!['facts', 'name', 'reg', $q.bK].includes(q.sort)) return { err: $t.k37 };
const mk = q.m.toLowerCase(), rg = r => r[8].filter(c => c && c[2] === 'reg').length;
let rows = D.p.filter(r => (!mk || r[3].toLowerCase() === mk) && (!q.dev || r[5] === q.dev) && cnt(r) >= q.min && (!q.q || r[2].toLowerCase().includes(q.q)) && q.has.every(f => r[8][F.indexOf(f)]) && q.miss.every(f => !r[8][F.indexOf(f)]) && (!q.kind || r[8].some(c => c && c[2] === q.kind)));
rows.sort(q.sort === 'name' ? (a, b) => a[2].localeCompare(b[2]) : q.sort === $q.bK ? (a, b) => a[3].localeCompare(b[3]) || a[2].localeCompare(b[2]) : q.sort === 'reg' ? (a, b) => rg(b) - rg(a) || cnt(b) - cnt(a) || a[2].localeCompare(b[2]) : (a, b) => cnt(b) - cnt(a) || a[2].localeCompare(b[2]));
return { q, rows, rg };
}
const qObj = r => { const o = { id: r[0], slug: r[1], name: r[2], market: r[3], area: r[4] || null, developer: r[6] || null, developer_slug: r[5] || null, fields_held: cnt(r), record: ORIGIN + $q.j + r[1] + $q.ds, facts: {} }; D.f.forEach((f, i) => { const c = r[8][i]; if (c) o.facts[f] = { value: c[0], kind: c[2], date: c[3] || null, source: c[1] ? (/^https?:/.test(c[1]) ? c[1] : ORIGIN + c[1]) : null }; }); return o; };
async function queryRoute(env, shell, l, u) {
const x = qRun(u), fmt = u.searchParams.get($q.dt);
if (x.err) return fmt === 'json' || fmt === 'csv' ? new Response(JSON.stringify({ error: x.err }), { status: 400, headers: JH }) : null;
const { q, rows } = x, part = rows.slice(q.offset, q.offset + q.limit), F = D.f;
if (fmt === 'json') return new Response(JSON.stringify({ built: D.built, licence: $q.du, query: q, total: rows.length, offset: q.offset, limit: q.limit, records: part.map(qObj), schema_of_one_record: ORIGIN + $q.bS }, null, 1), { headers: JH });
if (fmt === 'csv') return new Response([$t.k38 + F.map(f => f + ',' + f + $q.dv + f + '_date').join(',')].concat(part.map(r => [r[0], r[1], r[2], r[3], r[4], r[6], cnt(r)].concat(...F.map((f, i) => { const c = r[8][i]; return c ? [c[0], c[2], c[3]] : ['', '', '']; })).map(csvQ).join(','))).join('\n') + '\n', { headers: CSVH($q.dw) });
const P = pre(l), sel = (n, v, opts) => $q.dx + n + $q.dy + esc(t(l, 'q_any')) + $q.dz + opts.map(([a, b]) => $q.dA + esc(a) + '"' + (a === v ? $q.dB : '') + '>' + esc(b) + $q.dz).join('') + $q.dC;
const fo = F.map(f => [f, t(l, 'f_' + f)]), qs = u.search.replace(/[?&]format=[^&]*/g, '').replace(/^&/, '?'), api = ORIGIN + $q.dD + (qs ? (qs[0] === '?' ? qs : '?' + qs) : '');
let b = $t.k39 + P + $q.dE + esc(t(l, 'q_m')) + sel('m', q.m, Object.keys(D.mk).sort().map(m => [m, m])) + $q.dF + esc(t(l, 'q_has')) + sel('has', q.has[0] || '', fo) + $q.dF + esc(t(l, $q.dG)) + sel('miss', q.miss[0] || '', fo) + $q.dF + esc(t(l, $q.dH)) + sel('kind', q.kind, KINDS.map(k => [k, t(l, 'k_' + k)])) + $q.dF + esc(t(l, 'q_min')) + $t.k40 + q.min + $q.dI + esc(t(l, 'q_q')) + $q.dJ + esc(q.q) + $q.dK + esc(t(l, $q.dL)) + sel('sort', q.sort, [['facts', t(l, 'q_s_f')], ['reg', t(l, 'q_s_r')], ['name', t(l, 'q_s_n')], [$q.bK, t(l, 'q_m')]]) + $q.dM + esc(t(l, 'q_go')) + $q.dN;
b += '<p>' + esc(tf(l, 'q_res', { n: nf(rows.length, l), a: nf(Math.min(rows.length, q.offset + 1), l), b: nf(Math.min(rows.length, q.offset + q.limit), l) })) + $q.dO + esc(t(l, 'q_api')) + $q.s + esc(api + (api.includes('?') ? '&' : '?') + $q.dP) + $q.dQ + esc(api + (api.includes('?') ? '&' : '?') + $q.dR) + $q.dS + esc(api + (api.includes('?') ? '&' : '?') + $q.dP) + $q.dT;
b += tw39(l, ['th_p', 'q_m', 'th_k', 'q_s_r'], part.map(r => $q.ac + dLnk(l, r) + $q.aq + bdi(r[3]) + $q.aw + nf(cnt(r), l) + $q.dU + nf(x.rg(r), l) + $q.ag));
if (rows.length > q.offset + q.limit) { const nu = new URL(u); nu.searchParams.set($q.cm, q.offset + q.limit); b += $q.cY + esc(P + $q.dD + nu.search) + $q.dV + esc(t(l, $q.dW)) + $q.aj; }
b += '<h2>' + esc(t(l, 'q_doc')) + $q.aa + esc(t(l, $q.dX)) + $s.k5 + P + $s.k6;
const plain = !u.search;
return page(shell, l, { path: $q.dD, h1: t(l, 'q_h1'), lead: tf(l, $q.dY, { n: nf(D.n, l) }), body: $s.N39C + b, noindex: !plain, crumb: [[t(l, 'data'), P + $q.bJ]] });
}
function ndjson(u) {
const m = String(u.searchParams.get('m') || '').slice(0, 80).trim().toLowerCase(), M = IX.nd || (IX.nd = new Map());
if (!M.has(m)) { if (M.size > 40) M.clear(); M.set(m, (m ? D.p.filter(r => r[3].toLowerCase() === m) : D.p).map(r => JSON.stringify(qObj(r))).join('\n') + '\n'); }
return new Response(M.get(m), { headers: { 'content-type': $q.dZ, 'access-control-allow-origin': '*', 'cache-control': $q.I, link: '<' + ORIGIN + $q.ea } });
}
function changesCsv(u) {
const g = k => u.searchParams.get(k), q = chFilter({ m: (g('m') || '').slice(0, 80), field: g('field') || '', since: g('since') || '' });
if (q.err) return new Response(q.err + '\n', { status: 400, headers: { 'content-type': $q.eb } });
const K = ['date', 'slug', $q.co, $q.bK, $q.bT, 'field', 'label', 'from', 'to', $q.ec, $q.bb, $q.ed];
return new Response([$t.k41 + D.built + $t.k42 + $s.CH_RULE, K.join(',')].concat(q.rows.map(x => { const o = chRow(x); return K.map(k => csvQ(o[k])).join(','); })).join('\n') + '\n', { headers: CSVH($q.ee) });
}
const nName = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\b(the|by|at|residences?|residence|project)\b/g, ' ').replace(/[^a-z0-9Ѐ-ӿ一-鿿]+/g, '');
const nPn = s => { const v = String(s).toUpperCase().replace(/\s+/g, ' ').trim(), m = /REGISTRATION (\d{3,6})\b/.exec(v); return m ? 'DLD ' + m[1] : v; };
function dupPairs() {
if (IX.dup) return IX.dup;
const out = [], seen = new Set(), pi = D.f.indexOf('pn'), grp = (key, rule, val, mx) => { const G = new Map(); for (const r of D.p) { const k = key(r); if (k) (G.get(k) || G.set(k, []).get(k)).push(r); } for (const [k, a] of G) if (a.length > 1 && a.length <= mx) for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) { const id = [a[i][1], a[j][1]].sort().join('|'); if (!seen.has(id + rule)) { seen.add(id + rule); out.push({ rule, a: a[i], b: a[j], v: val(a[i], k) }); } } };
grp(r => r[8][pi] && String(r[8][pi][0]).length > 3 ? r[3] + '|' + nPn(r[8][pi][0]) : null, 'pn', r => String(r[8][pi][0]), 3);
grp(r => { const n = nName(r[2]); return n.length > 3 ? r[3] + '|' + n : null; }, 'nm', r => r[2], 3);
grp(r => { const c = r[8].find(c => c && c[2] === 'reg' && /^https?:\/\/[^/]+\/.{8,}/.test(c[1] || '')); return c ? r[3] + '|' + c[1].replace(/[?#].*$/, '').replace(/\/$/, '') : null; }, 'src', (r, k) => k.slice(k.indexOf('|') + 1), 2);
const pairs = new Map(); for (const x of out) { const id = [x.a[1], x.b[1]].sort().join('|'); (pairs.get(id) || pairs.set(id, { a: x.a, b: x.b, w: [] }).get(id)).w.push([x.rule, x.v]); }
return (IX.dup = [...pairs.values()].sort((p, q) => q.w.length - p.w.length || p.a[3].localeCompare(q.a[3]) || p.a[2].localeCompare(q.a[2])));
}
async function dupPage(env, shell, l, u) {
const P = pre(l), a = dupPairs();
if (u && u.searchParams.get($q.dt) === 'json') return new Response(JSON.stringify({ built: D.built, licence: $q.du, rules: { pn: $t.k43, nm: $s.k7, src: $t.k44 }, note: $s.k8, total: a.length, pairs: a.map(p => ({ a: p.a[1], b: p.b[1], market: p.a[3], why: p.w.map(w => ({ rule: w[0], value: w[1] })) })) }, null, 1), { headers: JH });
const byR = k => a.filter(p => p.w.some(w => w[0] === k)).length;
let b = kp39(l, [[nf(a.length, l), t(l, 'du_k1')], [nf(byR('pn'), l), t(l, 'du_pn')], [nf(byR('nm'), l), t(l, 'du_nm')], [nf(byR('src'), l), t(l, $q.ef)]]) + '<p>' + esc(t(l, $q.eg)) + '</p>';
b += a.length ? tw39(l, ['du_a', 'du_b', 'q_m', $q.eh], a.map(p => $q.ac + dLnk(l, p.a) + $q.ei + bdi(p.a[6] || '') + $q.ej + dLnk(l, p.b) + $q.ei + bdi(p.b[6] || '') + $q.ek + bdi(p.a[3]) + $q.ae + p.w.map(w => esc(t(l, 'du_' + w[0])) + $t.k45 + esc(String(w[1]).slice(0, 120)) + $q.i).join('<br>') + $q.ag)) : '<p>' + esc(t(l, $q.cX)) + '</p>';
b += $t.k46 + $t.DOT + $q.n + P + $q.el + esc(t(l, 'v_h1')) + '</a>' + $t.DOT + $q.n + P + $q.cZ + esc(t(l, 'q_h1')) + $q.aj;
return page(shell, l, { path: $q.em, h1: t(l, 'du_h1'), lead: tf(l, $q.en, { n: nf(D.n, l) }), body: $s.N39C + b, noindex: !!(u && u.search), crumb: [[t(l, 'data'), P + $q.bJ]] });
}
async function srcSites(env) {
const H = await file(env, $q.eo); if (!H || !H.u) return null;
if (IX.src39 && IX.src39.v === H.generated_at) return IX.src39;
const RH = new Set(), hn = x => host(x);
for (const k in D.rg) for (const g of D.rg[k]) if (g[1]) RH.add(hn(g[1]));
for (const r of D.p) for (const c of r[8]) if (c && c[2] === 'reg' && /^https?:/.test(c[1] || '')) RH.add(hn(c[1]));
const S = new Map();
for (const x of H.u) { const h = hn(x[0]); if (!h) continue; const s = S.get(h) || S.set(h, { h, n: 0, ok: 0, c4: 0, c5: 0, e: 0, r: 0, nr: 0, ch: 0, last: '', cites: 0, reg: RH.has(h) }).get(h); s.n++; const st = x[1];
if (typeof st === $q.cd && st >= 200 && st < 400) s.ok++; else if (typeof st === $q.cd && st >= 400 && st < 500) s.c4++; else if (typeof st === $q.cd && st >= 500) s.c5++; else if (st === 'r') s.r++; else if (st === 'n') s.nr++; else s.e++;
if (x[4]) s.ch++; if (x[2] && x[2] > s.last) s.last = x[2]; s.cites += (H.cites[x[0]] || []).length; }
const all = [...S.values()].sort((a, b) => b.n - a.n || a.h.localeCompare(b.h));
return (IX.src39 = { v: H.generated_at, upd: H.updated, n: H.n, all, reg: all.filter(s => s.reg) });
}
async function srcPage(env, shell, l, u) {
const P = pre(l), x = await srcSites(env); if (!x) return null;
if (u && u.searchParams.get($q.dt) === 'json') return new Response(JSON.stringify({ updated: x.upd, licence: $q.du, method: $q.ep + ORIGIN + $s.k9, sites: x.all.map(s => ({ site: s.h, official_register: s.reg, urls: s.n, live: s.ok, http_4xx: s.c4, http_5xx: s.c5, no_answer: s.e, robots: s.r, not_read: s.nr, text_changed: s.ch, last_read: s.last || null, citations: s.cites })) }, null, 1), { headers: JH });
const row = s => $q.eq + bdi(s.h) + $q.ad + nf(s.n, l) + $q.aw + bdi(nf(share(s.ok, s.n - s.r - s.nr || 1), l) + '%') + $q.aw + nf(s.c4 + s.c5, l) + $q.aw + nf(s.e, l) + $q.aw + nf(s.r, l) + $q.aw + esc(fd(s.last, l)) + $q.ag, TH = [$q.er, $q.es, $q.et, $q.eu, 'so_e', 'so_r', $q.ev];
const live = x.all.reduce((a, s) => a + s.ok, 0);
let b = kp39(l, [[nf(x.all.length, l), t(l, 'so_k1')], [nf(x.reg.length, l), t(l, 'so_k2')], [nf(x.n, l), t(l, 'so_k3')], [nf(share(live, x.n), l) + '%', t(l, 'so_k4')]]);
b += $q.ew + esc(t(l, 'so_h2')) + $q.aa + esc(t(l, 'so_p2')) + '</p>' + tw39(l, TH, x.reg.map(row));
b += $q.ex + esc(tf(l, 'so_h3', { n: nf(Math.min(80, x.all.length), l) })) + '</h2>' + tw39(l, TH, x.all.slice(0, 80).map(row));
b += $q.q + esc(t(l, $q.ey)) + $t.k47 + $t.DOT + $t.k48 + $t.DOT + $q.n + P + $q.ez;
return page(shell, l, { path: $q.eA, h1: t(l, 'so_h1'), lead: tf(l, $q.eB, { d: fd(x.upd, l) }), body: $s.N39C + b, noindex: !!(u && u.search), crumb: [[t(l, 'data'), P + $q.bJ]] });
}
const n39Links = l => { const P = pre(l); return $s.N39C + $q.eC + dir(l) + '>' + [[$q.eD, 'v_h1'], [$q.eE, 'q_h1'], [$q.eF, 'du_h1'], [$q.eG, 'so_h1']].map(([p, k]) => $q.n + P + $q.bJ + p + '">' + esc(t(l, k)) + '</a>').join($t.DOT) + $t.DOT + $t.k49 + $t.DOT + $t.k50 + $t.DOT + $t.k51; };
const CSSL = '<style>' + TAP + '.n37-tw{overflow-x:auto;border:1px solid var(--k-line,#D5DCDB);border-radius:12px;margin:10px 0 18px}.n37 table{width:100%;border-collapse:collapse;font-size:.93rem}.n37 th,.n37 td{padding:8px 12px;border-bottom:1px solid var(--k-line,#D5DCDB);text-align:start;vertical-align:top}.n37 td.n{font-variant-numeric:tabular-nums;white-space:nowrap}.n37 tbody th a{color:inherit;text-decoration-style:dotted}.n37-rel{display:flex;flex-wrap:wrap;gap:4px 18px;list-style:none;padding:0}.n37-rel a{display:inline-flex;align-items:center;min-height:44px}.n37 .k-xs{font-size:.9rem}</style>';
const KIND = { reg: 'r', dev: 'd', portal: 'w', web: 'w', sat: 'o', rec: 'o' };
const share = (a, n) => n ? Math.round(100 * a / n) : 0;
function factCounts(rows) {
const F = D.f, h = F.map(() => 0), g = F.map(() => 0), k = { r: 0, d: 0, w: 0, o: 0 }; let all = 0;
for (const r of rows) r[8].forEach((c, i) => { if (!c) return; h[i]++; all++; if (c[2] === 'reg') g[i]++; k[KIND[c[2]] || 'o']++; });
return { h, g, k, all };
}
const recList = (l, rows) => $q.eH + rows.map(x => $q.bE + recU(l, x[1]) + '">' + bdi(x[2]) + $q.bF + nf(cnt(x), l) + $q.bG).join('') + '</ul>';
const MO40 = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
function hoEnd(v) {
const s = String(v || ''), y = /(20\d\d)/.exec(s); if (!y) return null; const Y = +y[1]; let m;
if ((m = /20\d\d-(\d\d)/.exec(s))) return Y * 12 + Math.min(12, +m[1]);
if ((m = /Q([1-4])/i.exec(s))) return Y * 12 + 3 * m[1];
if ((m = /H([12])/i.exec(s))) return Y * 12 + 6 * m[1];
if ((m = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+20\d\d/i.exec(s))) return Y * 12 + MO40[m[1].toLowerCase()];
if (/early/i.test(s)) return Y * 12 + 4; if (/mid|summer/i.test(s)) return Y * 12 + 9;
return Y * 12 + 12;
}
function mkDash(l, m, kk) { const k = 'd|' + l + '|' + m + '|' + (kk ? kk.mv + '.' + kk.ov + '.' + kk.med : ''); if (!IX.mkm) IX.mkm = new Map(); if (!IX.mkm.has(k)) IX.mkm.set(k, mkDash0(l, m, kk)); return IX.mkm.get(k); }
function mkDash0(l, m, kk) {
const rows = IX.byMk.get(m) || [], n = rows.length; if (n < 5) return '';
const b = /^(\d{4})-(\d{2})/.exec(D.built || ''), now = b ? +b[1] * 12 + +b[2] : 0, Y0 = b ? +b[1] : 2026;
let dated = 0, past = 0, pn = 0, rg = 0; const yr = new Map();
for (const r of rows) { const c = r[8]; if (c[1]) pn++; if (c[8]) rg++; const e = c[0] ? hoEnd(c[0][0]) : null; if (e == null) continue; dated++; if (e < now) past++; else { const y = Math.floor((e - 1) / 12); const key = y > Y0 + 2 ? 'l' : String(y); yr.set(key, (yr.get(key) || 0) + 1); } }
const fut = [...yr.values()].reduce((a, x) => a + x, 0), keys = [String(Y0), String(Y0 + 1), String(Y0 + 2), 'l'], mx = Math.max(1, ...keys.map(x => yr.get(x) || 0));
const pc = (a, z) => z ? bdi(nf(share(a, z), l) + '%') : '-';
const tile = (h, v, sub, w) => $q.eI + (w ? ' d9-w' : '') + $q.eJ + esc(h) + $q.eK + v + $q.eL + sub + $q.eM;
return $s.k10 + dir(l) + $t.k52 + esc(tf(l, 'd40_h', { m: mkName(m, l) })) + '</h2>' + (kk && l !== 'en' && kk.med != null ? $q.eN + bdi(nf(kk.med, l)) + $q.eO + esc(kk.ml) + '</p>' : '') + $q.eP +
(kk ? tile(t(l, $q.eQ), pc(pn, n), esc(tf(l, $q.eR, { a: nf(pn, l), n: nf(n, l) })) + '<br>' + esc(tf(l, 'd9_rg', { p: share(rg, n) + '%' }))) +
tile(t(l, $q.eS), bdi(nf(kk.mv, l)), esc(tf(l, $q.eT, { h: nf(kk.h, l) })), 1) + tile(t(l, $q.eU), bdi(nf(kk.ov, l)), esc(t(l, $q.eV)) + (kk.od ? $q.s + pre(l) + kk.od + '">' + esc(t(l, $q.eW)) + '</a>' : ''), 1) :
tile(t(l, $q.eX), pc(past, dated), esc(tf(l, $q.eY, { a: nf(past, l), n: nf(dated, l) }))) +
tile(t(l, $q.eQ), pc(pn, n), esc(tf(l, $q.eR, { a: nf(pn, l), n: nf(n, l) }))) +
tile(t(l, $q.eZ), pc(rg, n), esc(tf(l, $q.fa, { a: nf(rg, l), n: nf(n, l) })))) +
$q.fb + esc(t(l, $q.fc)) + $q.eK + bdi(nf(fut, l)) + $q.fd + keys.map(x => { const v = yr.get(x) || 0; return $q.fe + esc(x === 'l' ? t(l, $q.ff) : x) + $q.fg + Math.max(v ? 3 : 0, Math.round(100 * v / mx)) + $q.fh + nf(v, l) + $q.fi; }).join('') + $q.fj + esc(tf(l, $q.fk, { n: nf(fut, l) })) + $q.eM +
$q.fl + esc(tf(l, $q.fm, { n: nf(n, l), d: fd(D.built, l) })) + $t.k53 + pre(l) + $q.fn + esc(t(l, $q.fo)) + $q.fp;
}
function mkSection(l, m) {
const k = l + '|' + m; if (!IX.mkm) IX.mkm = new Map(); if (!IX.mkm.has(k)) IX.mkm.set(k, mkSection0(l, m)); return IX.mkm.get(k);
}
function mkSection0(l, m) {
const rows = IX.byMk.get(m) || []; if (rows.length < 3) return '';
const F = D.f, c = factCounts(rows), byK = rows.slice().sort((a, b) => cnt(b) - cnt(a) || a[2].localeCompare(b[2]));
let b = $t.k54 + dir(l) + '>' + (l === 'en' ? '' : CSSL) + '<h2>' + esc(tf(l, 'mk_h', { m: mkName(m, l) })) + $q.aa + esc(tf(l, 'mk_p', { n: nf(rows.length, l), m: mkName(m, l) })) + '</p>' +
$t.k55 + esc(t(l, 'tw_l')) + $q.S + esc(t(l, 'th_f')) + $q.T + esc(t(l, $q.fq)) + $q.T + esc(t(l, $q.fr)) + $q.T + esc(t(l, $q.fs)) + $q.U +
F.map((f, i) => $q.ac + fname(l, f).replace(/ title="[^"]*"/, '') + $q.ad + nf(c.h[i], l) + ' / ' + nf(rows.length, l) + $q.aw + bdi(nf(share(c.h[i], rows.length), l) + '%') + $q.aw + bdi(nf(share(D.known[i], D.n), l) + '%') + $q.ag).join('') + $q.Y +
'<p>' + esc(tf(l, $q.ft, { k: nf(c.all, l), r: nf(c.k.r, l), d: nf(c.k.d, l), w: nf(c.k.w, l), o: nf(c.k.o, l) })) + '</p>' +
'<h3>' + esc(t(l, $q.fu)) + '</h3>' + recList(l, byK.slice(0, 5)) + '<h3>' + esc(t(l, $q.fv)) + '</h3>' + recList(l, byK.slice(-5).reverse()) +
$q.ak + pre(l) + $q.aY + esc(t(l, $q.aZ)) + $t.k56 + pre(l) + $q.fw + slugM(m) + '">' + esc(t(l, 'wk_h1')) + '</a>' + $t.DOT + $q.n + n38u(l, $q.fx + slugM(m) + '/') + '">' + esc(t(l, 'ms_l')) + '</a>' + (pipe(m).d >= 10 ? $t.DOT + $q.n + n38u(l, $q.fy) + '?m=' + encodeURIComponent(m) + $q.fz + esc(t(l, 'pl_h1')) + '</a>' : '') + $t.DOT + $q.n + n38u(l, $q.fA) + '#mk-' + slugM(m) + '">' + esc(t(l, 'dl_h1')) + $q.fp;
return b;
}
function devSection(l, slug) {
const rows = IX.byDev.get(slug) || []; if (!rows.length) return '';
const F = D.f, c = factCounts(rows), name = rows[0][6] || slug, thin = rows.slice().sort((a, b) => cnt(a) - cnt(b) || a[2].localeCompare(b[2])).slice(0, 8);
return $q.fB + dir(l) + '>' + CSSL + trackSection(l, slug) + '<h3>' + esc(t(l, 'dv_h')) + $q.fC + esc(tf(l, 'dv_p', { n: nf(rows.length, l), d: name })) + '</p>' +
$t.k57 + esc(t(l, 'tw_l')) + $q.S + esc(t(l, 'th_f')) + $q.T + esc(t(l, $q.fq)) + $q.T + esc(t(l, $q.fD)) + $q.U +
F.map((f, i) => $q.ac + fname(l, f) + $q.ad + nf(c.h[i], l) + ' / ' + nf(rows.length, l) + $q.aw + nf(c.g[i], l) + $q.ag).join('') + $q.Y +
'<h3>' + esc(t(l, $q.fE)) + '</h3>' + recList(l, thin) + devReg(l, slug) + $q.cN;
}
function peers(l, slug) {
const rows = IX.byDev.get(slug) || []; if (!rows.length) return ''; const c = new Map(); for (const r of rows) c.set(r[3], (c.get(r[3]) || 0) + 1);
const mk = [...c.entries()].sort((a, b) => b[1] - a[1])[0][0], n = new Map(), co = D.co[rows[0][0]], add = R => { for (const r of R || []) if (r[5] && r[5] !== slug) { const o = n.get(r[5]) || { s: r[5], d: r[6] || r[5], k: 0 }; o.k++; n.set(r[5], o); } }; add(IX.byMk.get(mk)); let lab = mkName(mk, l), hk = 'pe_h';
if (!n.size && co) { for (const [m, R] of IX.byMk) if (D.co[R[0][0]] === co) add(R); lab = coName(co, l); hk = 'pe_hc'; }   // n40 k38: only developer in its market: the country's
const A = [...n.values()].sort((a, b) => b.k - a.k || a.d.localeCompare(b.d)), L = A.slice(0, 6), S = A.concat({ s: slug, d: rows[0][6] || slug }).sort((a, b) => a.d.localeCompare(b.d) || a.s.localeCompare(b.s)), i = S.findIndex(o => o.s === slug); if (!A.length) return '';
for (const o of [S[(i + S.length - 1) % S.length], S[(i + 1) % S.length]].concat(A.slice(6))) if (L.length < 8 && o.s !== slug && !L.includes(o)) L.push(o);   // n40 k38: plus the two alphabetical neighbours
return $q.fF + dir(l) + '><h3>' + esc(tf(l, hk, { m: lab })) + '</h3>' + peUl(l, L) + $q.cN;
}
const peUl = (l, L) => $q.fG + L.map(o => $q.bE + pre(l) + $q.aU + o.s + '/">' + bdi(o.d) + $q.fH + esc(tf(l, 'pe_n', { n: nf(o.k, l) })) + $q.fI).join('') + '</ul>';
function devBlock(l, m) {   // n40 k38: market pages list the developers active there, most projects first
const n = new Map(); for (const r of IX.byMk.get(m) || []) if (r[5]) { const o = n.get(r[5]) || { s: r[5], d: r[6] || r[5], k: 0 }; o.k++; n.set(r[5], o); }
const L = [...n.values()].sort((a, b) => b.k - a.k || a.d.localeCompare(b.d)).slice(0, 16); return L.length ? $q.fJ + dir(l) + '><h2>' + esc(tf(l, $q.fK, { m: mkName(m, l) })) + '</h2>' + peUl(l, L) + $q.fL : '';
}
let CGM = null;
function cgBox(l, p) {
const mm = T && T.cg26 && /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?m\/([a-z0-9-]{2,80})\/$/.exec(p);
if (mm && !CGM) { CGM = new Map(); for (const k in T.cg26) for (const x of T.cg26[k].m) if (!CGM.has(x[0])) CGM.set(x[0], k); }
const m = mm ? (CGM.get(mm[1]) ? [p, CGM.get(mm[1]), ''] : null) : /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?countries\/([a-z0-9-]{2,60})\/(?:(how-to-check|is-it-safe|buyer-protection-law)\/)?$/.exec(p); if (!m || !T.cg26) return '';
const c = T.cg26[m[1]]; if (!c || (mm && l === 'en' && c.m.length < 2)) return ''; const cur = mm ? -1 : ['', $q.fM, $q.fN, $q.fO].indexOf(m[2] || ''), bl = c.p[l] || 0, be = c.p.en || 0, en = $q.fP + esc(t(l, 'cg_en')) + $q.fQ;
if (cur >= 0 && !(bl & (1 << cur))) return '';
const A = [];
['', $q.fR, $q.fS, $q.fT].forEach((s, i) => { if (i === cur) return; const lab = esc(t(l, 'cg_' + i));
if (bl & (1 << i)) A.push($q.n + pre(l) + $q.fU + m[1] + '/' + s + '">' + lab + '</a>'); else if (l !== 'en' && (be & (1 << i))) A.push($q.fV + m[1] + '/' + s + $q.fW + lab + '</a>' + en); });
for (const [s, n, loc] of c.m) if (!mm || s !== mm[1]) A.push(l === 'en' || loc ? $q.n + pre(l) + '/m/' + s + '/">' + esc(tf(l, 'cg_m', { m: mkName(n, l) })) + '</a>' : $q.fX + s + $q.fY + esc(tf(l, 'cg_m', { m: mkName(n, l) })) + '</a>' + en);
if (A.length < 2) return '';
return $t.k58 + dir(l) + $s.k11 + esc(t(l, 'cg_h')) + $t.k59 + A.map(a => '<li>' + a + '</li>').join('') + $q.fZ;
}
function lateBox(l, nc) {
const S = {}; for (const k of $t.o_LT41) S[k] = t(l, 'lt_' + k + '41'); S.pre = pre(l); S.loc = LOC[l] || 'en-GB';
return $t.k60 + dir(l) + $t.k61 + esc(S.h) + $q.aa + esc(S.p) + $t.k62 + esc(S.l) + $s.k12 + esc(S.b) + $t.k63 +
$t.k64 + JSON.stringify(S).replace(/</g, $q.ga) + $t.k65 + (nc ? $q.gb + nc + '"' : '') + $q.gc +
$s.k13;
}
function chBox(l) {
const L = (T && T.ch20) || [], cg = (T && T.cg26) || {}, cn = c => { try { return coName(c, l) || c; } catch (e) { return c; } };
const A = L.map(([s, n]) => { const ok = l === 'en' || ((cg[s] && cg[s].p && cg[s].p[l]) || 0) & 1; return $q.bE + (ok ? pre(l) : '') + $q.fU + s + '/"' + (ok ? '' : $q.gd) + '>' + esc(cn(n)) + $q.ge; });
if (A.length < 5) return '';
return $t.k66 + dir(l) + $s.k14 + esc(t(l, 'ch_h')) + $q.aa + esc(t(l, 'ch_p')) + $q.gf + A.join('') + $q.gg + pre(l) + $q.gh + esc(t(l, 'ch_a')) + $q.fp;
}
export async function foot(u, env, r) {
const l = (/^\/(es|de|fr|nl|ru|zh|ar)\//.exec(u.pathname) || [])[1] || 'en'; if (!T) T = await file(env, $q.b); if (!T) return r;
const zh = l === 'zh' ? $s.k15 : '';
const nc = ((r.headers.get($q.gi) || '').match(/'nonce-([^']+)'/) || [])[1], fl = $q.gj + (nc ? $q.gb + nc + '"' : '') + $q.gc;
const lt = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:check\/)?$/.test(u.pathname) ? lateBox(l, nc) : '', ltSel = /check\/$/.test(u.pathname) ? $q.gk : $q.gl;
return new HTMLRewriter().on('head', { element(e) { if (zh) e.append(zh, { html: true }); } }).on('body', { element(e) { e.append(fl, { html: true }); } }).on(ltSel, { element(e) { if (lt) e.after(lt, { html: true }); } })
.on($q.gm, { element(e) { e.remove(); } })
.on('main', { element(e) { const cg = cgBox(l, u.pathname); if (cg) e.append(cg, { html: true }); if (/^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?$/.test(u.pathname)) { const ch = chBox(l); if (ch) e.append(ch, { html: true }); } if (/^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?rankings\//.test(u.pathname)) e.append($q.gn + dir(l) + $s.k16 + esc(t(l, 'mt_h')) + $q.go + esc(t(l, 'mt_p')) + $q.s + pre(l) + $q.gp + esc(t(l, 'mt_a')) + $q.gq, { html: true }); } }).transform(r);
}
let STATS = null;
async function stats(env) {
  if (STATS && Date.now() - STATS.t < 600000) return STATS.v;
  let v = null;
  try { const kb = await import('./kolaboro.js'); const u = new URL(ORIGIN + $q.gr); const r = await kb.open(new Request(u), u, env); if (r && r.ok) { const j = await r.json(); if (j && j.projects) v = j; } } catch (e) { v = null; }
  STATS = { t: Date.now(), v }; return v;
}
async function homeBits(l, env) {
const s = await stats(env); if (!s) return null;
const g = progStats(), P = pre(l), b = v => '<b>' + v + '</b>';
const proof = $q.gs + dir(l) + $q.gt + esc(tf(l, $q.gu, { p: nf(s.projects, l), m: nf(s.markets, l), g: nf(IX.regs, l), d: fd(g.built, l) })) + $q.aF;
const tile = (h, n, lab) => $q.gv + h + '">' + b(n) + $q.gw + esc(lab) + $q.gx;
const band = $q.gy + dir(l) + '>' + esc(t(l, 'hp_h')) + $q.gz + dir(l) + '>' +
tile(P + $q.j, nf(s.projects, l), tf(l, 'hp_t1', { m: nf(s.markets, l), c: nf(s.countries, l) })) +
tile($q.gA, nf(IX.regs, l), t(l, 'hp_t2')) +
tile(P + $q.gB, pct1(g.conf, g.tot, l), tf(l, 'hp_t3', { n: nf(g.tot, l) })) +
tile(P + $q.gC, nf(g.w, l), t(l, 'hp_t4')) + '</ul>' +
$q.gD + dir(l) + '>' + esc(tf(l, $q.gE, { s: nf(s.sources, l), f: nf(IX.src, l) })) + $q.s + P + $q.aY + esc(t(l, $q.gF)) + '</a>' + $t.DOT + $q.n + P + $q.t + esc(t(l, 'vf_l')) + $q.aj;
return [proof, band];
}
const sz = (b, l) => b >= 1048576 ? nf(Math.round(b / 104857.6) / 10, l) + ' MB' : nf(Math.max(1, Math.round(b / 1024)), l) + ' KB';
async function dataHub(env, shell, l) {
const C = await file(env, $q.gG), by = new Map(((C && C.datasets) || []).map(x => [x.id, x]));
let b = '<h2>' + esc(t(l, $q.gH)) + $t.k67 + esc(t(l, 'tw_l')) + $q.S + esc(t(l, $q.gH)) + $q.T + esc(t(l, $q.gI)) + $q.T + esc(t(l, $q.gJ)) + $q.T + esc(t(l, $q.gK)) + $q.T + esc(t(l, $q.gL)) + $t.k68;
for (const [k, id, url, fmt] of $t.o_DS) {
const x = id ? by.get(id) : null; if (id && !x) continue;
const href = x ? x.url.replace(ORIGIN, '') : url, f = x ? String(x.format || '').toUpperCase() : fmt;
b += $q.V + esc(href) + $q.gM + esc(t(l, k + '_t')) + $q.gN + esc(t(l, k + '_d')) + $q.ej + bdi(f) + $q.aw + (x && typeof x.rows === $q.cd ? nf(x.rows, l) : url === $q.c ? nf(D.n, l) : '') + $q.aw + (x && x.bytes ? sz(x.bytes, l) : '') + $q.aw +
(x ? fd(String(x.last_updated || (x.freshness || {}).stamp || ''), l) : esc(t(l, $q.gO))) + $q.aw + (x && x.sha256 ? $q.gP + esc(x.sha256) + '">' + esc(x.sha256.slice(0, 12)) + $q.gQ : '') + $q.ag;
}
b += $q.Y;
if (C) b += $q.q + esc(tf(l, $q.gR, { d: fd(String((C.refreshed && C.refreshed.at) || C.generated_at || ''), l) })) + $q.gS + esc(tf(l, $q.gT, { n: nf((C.summary || {}).datasets || by.size, l), f: nf((C.summary || {}).files || by.size, l) })) + $q.aj;
b += '<h2>' + esc(t(l, 'dh_q')) + $q.gU + pre(l) + $q.fn + esc(t(l, 'dh_q1')) + $q.gV + pre(l) + $q.aY + esc(t(l, $q.aZ)) + $q.gV + pre(l) + $q.gW + esc(t(l, 'dh_q2')) + $q.gX + esc(t(l, 'dh_q3')) + $q.gY + esc(t(l, $q.gZ)) + '</p>';
return page(shell, l, { path: $q.bJ, h1: t(l, 'dh_h1'), lead: t(l, $q.ha), body: b });
}
const EG = [['eg_status', '/engineering/status/'], ['eg_rel', '/engineering/reliability/'], ['eg_pw', '/engineering/page-weight/'], ['eg_speed', '/engineering/speed/'], ['eg_seo', '/engineering/seo/'], ['eg_vt', '/engineering/visual-tests/'], ['eg_tl', '/engineering/transparency-log/'], ['eg_sp', '/engineering/signed-photos/']];
async function hubPage(env, shell, l, k) {
let b = '', o;
if (k === $q.hb) {
b = shipped(l).replaceAll($q.hc, $q.hd) + '<h2>' + esc(t(l, $q.he)) + $q.hf + EG.map(x => $q.bE + x[1] + $q.fW + esc(t(l, x[0])) + $q.ge).join('') + $t.k69 + esc(t(l, $q.hg)) + $q.aj;
o = { h1: t(l, 'eg_h1'), lead: t(l, $q.hh) };
} else if (k === 'yc') {
const s = await stats(env) || {};
b = '<h2>' + esc(t(l, $q.hi)) + $q.aa + esc(t(l, 'yc_pb')) + $q.hj + esc(t(l, $q.hk)) + $q.aa + esc(t(l, 'yc_do')) + '</p>';
if (s.projects) b += '<h2>' + esc(t(l, $q.hl)) + $q.aa + esc(tf(l, 'yc_dt', { p: nf(s.projects, l), m: nf(s.markets, l), c: nf(s.countries, l), s: nf(s.sources, l), cl: nf(s.claims_total || 0, l), x: nf((s.claims || {}).contradicted || 0, l), g: nf(IX.regs, l), f: nf(IX.src, l) })) + '</p>';
b += '<p>' + esc(t(l, 'yc_tr')) + '</p>' + shipped(l).replaceAll($q.hc, $q.hd) + $q.hm + esc(t(l, $q.hn)) + $t.k70 + pre(l) + $q.ho + esc(t(l, 'eg_h1')) + $t.k71 + pre(l) + $q.hp + esc(t(l, 'dh_h1')) + $q.aj;
o = { h1: t(l, 'yc_h1'), lead: t(l, $q.hq) };
} else {
b = $t.k72 + esc(t(l, $q.hr)) + $q.hs + esc(t(l, $q.ht)) + $t.k73 +
'<h2>' + esc(t(l, $q.hu)) + $q.hv + ['dp_s1', 'dp_s2', 'dp_s3', 'dp_s4', 'dp_s5'].map(x => '<li>' + esc(t(l, x)) + '</li>').join('') + '</ol>' +
'<h2>' + esc(t(l, $q.hw)) + $q.aa + esc(t(l, $q.hx)) + $q.hj + esc(t(l, $q.hy)) + $q.aa + esc(t(l, 'dp_bd')) + '</p>' +
'<p>' + esc(tf(l, 'dp_n', { d: nf(IX.byDev.size, l) })) + $q.s + pre(l) + $t.k74 + esc(t(l, 's13_t')) + $t.k75 + esc(t(l, $q.hr)) + $q.aj;
o = { h1: t(l, 'dp_h1'), lead: t(l, $q.hz) };
}
return page(shell, l, Object.assign(o, { path: '/' + k + '/', body: b }));
}
async function slugsJson(env, ms) {
const ix = await N.data(env), o = {};
const nm = {}; for (const [id, x] of ix.byId) if (x.s && x.mk && encodeURIComponent(String(x.mk).toLowerCase().replace(/\s+/g, '-')) === ms) { o[id] = x.s; if (x.n) nm[id] = [x.n, x.dv || '']; } o._n = nm;   // n40 d9: names and developers for the market list rows
return new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': $q.hA, 'cache-control': $q.hB, 'access-control-allow-origin': '*' } });
}
export async function errPage(u) {
const m = /^\/(es|de|fr|nl|ru|zh|ar)\//.exec(u.pathname), l = m ? m[1] : 'en';
const g = k => (T && T[l] && T[l][k]) || ({ err_h: $q.hC, err_p: $q.hD, err_a: $q.hE, home: 'Home' })[k];
const html = $q.hF + l + '"' + dir(l) + $q.hG + esc(g('err_h')) + $q.hH +
$q.hI +
$q.hJ + esc(g('err_h')) + $q.hK + esc(g('err_p')) + $q.hL + esc(u.pathname) + '">' + esc(g('err_a')) + $q.w + pre(l) + '/">' + esc(g('home')) + $q.hM;
return new Response(html, { status: 503, headers: { 'content-type': $q.H, 'retry-after': '5', 'cache-control': $q.hN, 'x-kb-fallback': '1' } });
}
const VG = { reg: 'r', sat: 'r', dev: 'c', portal: 'c', web: 'c', rec: 'c' };
function vsGroups(r) { const g = { r: [], c: [], u: [] }; D.f.forEach((f, i) => { const c = r[8][i]; g[c ? (VG[c[2]] || 'c') : 'u'].push(f); }); return g; }
const VSC = '<style>' + TAP + '.n37-vs{margin:14px 0 0;padding:12px 16px;border:1px solid var(--k-line,var(--line,#D5DCDB));border-radius:14px;line-height:1.5}.n37-vs ul{list-style:none;padding:0;margin:6px 0 0}.n37-vs li{margin:6px 0;padding:2px 0;padding-inline-start:12px;border-inline-start:4px solid #56636F}.n37-vs li.n37-vr{border-color:#1F6B3A}.n37-vs li.n37-vc{border-color:#B7791F}.n37-vs li.n37-vu{border-color:#9A3412}.n37-vs li>b{font-variant-numeric:tabular-nums}.n37-vs li{padding-block:4px}.n37-vt{margin:0;display:flex;flex-wrap:wrap;align-items:baseline;gap:0 8px}.n37-vn{font-size:.85rem;font-variant-numeric:tabular-nums;color:var(--k-muted,#56636F)}.n37-vd{margin:0}.n37-vs ul.n37-tg{display:flex;flex-wrap:wrap;gap:4px 6px;margin:4px 0 2px}.n37-vs .n37-tg li{margin:0;padding:1px 8px;border:1px solid var(--k-line,#D5DCDB);border-radius:999px;font-size:.85rem;line-height:1.5}.n37-vb{display:flex;gap:3px;margin:8px 0 2px;max-width:320px}.n37-vb i{flex:1;height:8px;border-radius:2px;background:#9A3412}.n37-vb i.n37-br{background:#1F6B3A}.n37-vb i.n37-bc{background:#B7791F}@media print{.n37-vb i{print-color-adjust:exact;-webkit-print-color-adjust:exact}}.n37-act{margin:8px 0 0}.n37-act ul{display:flex;flex-wrap:wrap;gap:0 18px;list-style:none;padding:0;margin:0}.n37-act li{margin:0;padding:0;border:0}.n37-act a{display:inline-flex;align-items:center;min-height:44px;font-weight:600}.n37-vs a:focus-visible,.n37-act a:focus-visible,.n37 a:focus-visible,.n37-tw:focus-visible{outline:3px solid #155C75;outline-offset:2px;border-radius:4px}:root[data-theme=dark] .n37-vs a:focus-visible,:root[data-theme=dark] .n37-act a:focus-visible{outline-color:#7CC7E0}.n37-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}.n37-se{display:inline-block}' +
'.n37-po{display:none}@media print{.n37-po{display:block!important;font-size:16pt;margin:0 0 6px}.n37 a[href]::after{content:none!important}.n37>p.k-xs:last-child{display:none!important}.n37-np,.k-cta,.crumb,#shipped-2026-11-23,#shipped-2026-11-25{display:none!important}.n37 h2{font-size:12pt;margin:10px 0 4px}.n37 table{font-size:9pt}.n37 th,.n37 td{padding:3px 6px}.n37-tw{overflow:visible;border:0;margin:4px 0 8px}.phero h1{font-size:17pt;margin:0}.phero .lead{font-size:10pt}.n37 p,.n37 li{font-size:10pt;line-height:1.35}.n37-vs{padding:6px 10px}@page{size:A4;margin:12mm}}</style>';
function vsBlock(l, r, acts) {
const g = vsGroups(r), D3 = { r: 'vs_rd', c: 'vs_cd' }, T3 = { r: 'vs_r1', c: 'vs_c1', u: 'vs_u' };
const bar = $q.hO + ['r', 'c', 'u'].map(k => g[k].map(() => $q.hP + k + $q.hQ).join('')).join('') + '</p>';
return $t.k77 + dir(l) + $t.k78 + esc(t(l, 'vs_h')) + $q.hR + esc(t(l, 'vs_n')) + $q.s + pre(l) + $q.t + esc(t(l, 'vf_l')) + $q.hS + bar + $q.hT +
['r', 'c', 'u'].map(k => $q.hU + k + $q.hV + esc(t(l, T3[k])) + $q.hW + esc(tf(l, 'vs_of', { n: nf(g[k].length, l) })) + $q.aF +
(D3[k] ? $q.hX + esc(t(l, D3[k])) + '</p>' : '') + (g[k].length ? $q.hY + g[k].map(f => '<li>' + esc(t(l, 'f_' + f)) + '</li>').join('') + '</ul>' : '') +
(k === 'u' && g.u.length ? $q.hZ + recU(l, r[1]) + $q.ia + esc(t(l, 'vs_ud')) + $q.aj : '') + '</li>').join('') + '</ul>' + (acts || '') + $q.fL;
}
function actRow(l, r) {
const P = pre(l), s = r[1];
return $q.ib + esc(tf(l, 'act_l', { n: r[2] })) + $q.ic + [[recU(l, s), 'a_rec'], [recU(l, s) + $q.id, 'tl_l'], [P + $q.j + s + $q.ie, 'a_jr'], [P + $q.j + s + $q.if, 'a_chg'], [P + $q.j + s + $q.ig, 'a_br'], [P + $q.j + s + $q.ih, 'a_pdf'], [$q.j + s + $q.ds, 'js_l']]
.map(a => $q.bE + a[0] + '"' + (a[1] === 'js_l' ? $q.ii : '') + '>' + esc(t(l, a[1])) + $q.ge).join('') + $q.ij;
}
async function briefPage(env, shell, l, r) {
const P = pre(l), F = D.f, lc = latestChange(r), RG = regsFor(r), miss = F.filter((f, i) => !r[8][i]);
let b = VSC + $q.ik + esc(tf(l, 'br_h1', { n: r[2] })) + $t.k79 + esc(t(l, $q.il)) + $q.im + P + $q.j + r[1] + '/">' + esc(t(l, $q.in)) + $t.k80 + recU(l, r[1]) + '">' + esc(t(l, 'a_rec')) + $q.aj;
b += '<p>' + [[$q.io, r[6]], [$q.ip, [r[4], r[3]].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', ')], ['br_id', r[0]]].filter(x => x[1]).map(x => '<b>' + esc(t(l, x[0])) + $q.iq + bdi(x[1])).join(' · ') + '</p>' + vsBlock(l, r, '');
b += '<h2>' + esc(t(l, 'r_tbl')) + $t.k81 + esc(t(l, 'th_f')) + $q.T + esc(t(l, 'th_v')) + $q.T + esc(t(l, 'th_s')) + $q.T + esc(t(l, 'th_d')) + $q.U +
F.map((f, i) => { const c = r[8][i]; if (!c) return ''; const u = c[1];
return $q.ac + esc(t(l, 'f_' + f)) + $q.av + bdi(tv(f === 'ct' ? nf(c[0], l) : String(c[0]), l, 160)) + $q.ae + esc(t(l, 'k_' + c[2])) + (u && /^https?:/.test(u) ? $t.k82 + esc(u) + $q.aK + esc(host(u)) + '</a>' : '') + $q.aw + esc(fd(c[3], l)) + $q.ag; }).join('') + $q.Y;
b += '<h2>' + esc(t(l, 'br_lc')) + $q.aa + esc(lc ? tf(l, 'tl_pj', { f: t(l, 'f_' + lc.x.f), a: tv(lc.x.p, l, 90), b: tv(lc.x.v, l, 90), d: fd(lc.x.d, l) }) : tf(l, $q.ir, { a: fd(TL && TL.days && TL.days.length ? TL.days[0][0] : D.built, l) })) + '</p>';
if (miss.length) b += '<h2>' + esc(t(l, $q.is)) + $q.it + miss.map(f => { const rr = RG.filter(g => g[2].includes(f)).slice(0, 2);
return $q.aI + esc(t(l, 'f_' + f)) + $q.aJ + esc(t(l, 'ask_' + f)) + (rr.length ? ' ' + esc(t(l, 'g_reg')) + ': ' + rr.map(g => bdi(g[0]) + (g[1] ? ' (' + esc(host(g[1])) + ')' : '')).join('; ') : '') + '</li>'; }).join('') + '</ul>';
b += buyRow(l, r, 'brief');
b += $q.q + esc(tf(l, $q.iu, { u: $q.iv + P + $q.j + r[1] + '/', d: fd(D.built, l) })) + '</p>';
return page(shell, l, { path: $q.j + r[1] + $q.ig, h1: tf(l, 'br_h1', { n: r[2] }), lead: t(l, $q.iw), body: b, noindex: true, crumb: [[t(l, $q.bd), P + $q.j], [r[2], P + $q.j + r[1] + '/']] });
}
function allChanges() {
if (IX.ch) return IX.ch;
const out = [];
for (const r of D.p) { const ev = tlEvents(r); if (ev) for (const x of ev) if (realChange(x)) out.push([r, x]); }
out.sort((a, c) => (a[1].d < c[1].d ? 1 : a[1].d > c[1].d ? -1 : 0) || a[0][2].localeCompare(c[0][2]));
return (IX.ch = out);
}
async function changesPage(env, shell, l, mq) {
const P = pre(l), all = allChanges(), mks = [...new Set(all.map(x => x[0][3]))].sort(), mk = mks.includes(mq) ? mq : '', rows = mk ? all.filter(x => x[0][3] === mk) : all;
const days = (TL && TL.days) || [], a = days.length ? fd(days[0][0], l) : '', z = fd(D.built, l);
let b = $q.ix + P + $t.k83 + esc(t(l, 'ch_mk')) + $q.iy + $q.iz + esc(t(l, $q.iA)) + ' (' + nf(all.length, l) + $q.iB +
mks.map(m => $q.dA + esc(m) + '"' + (m === mk ? $q.dB : '') + '>' + esc(m) + ' (' + nf(all.filter(x => x[0][3] === m).length, l) + $q.iB).join('') + $t.k84;
b += $q.iC + esc(tf(l, 'ch_n', { n: nf(rows.length, l), p: nf(new Set(rows.map(x => x[0])).size, l), a, b: z })) + $q.iD;
b += $t.k85 + esc(t(l, 'tw_l')) + $q.S + esc(t(l, 'tl_d')) + $q.T + esc(t(l, 'th_p')) + $q.T + esc(t(l, 'ch_mk')) + $q.T + esc(t(l, 'th_f')) + $q.T + esc(t(l, $q.iE)) + $q.T + esc(t(l, 'ch_to')) + $q.U +
rows.map(([r, x]) => $q.iF + esc(fd(x.d, l)) + $q.iG + recU(l, r[1]) + $q.iH + bdi(r[2]) + $q.iI + bdi(r[3]) + $q.ae + fname(l, x.f) + $q.af + bdi(tv(x.p, l, 90)) + $q.af + bdi(tv(x.v, l, 90)) + $q.ag).join('') + $q.Y;
b += $q.q + esc(t(l, $q.ah)) + $t.k86 + esc(t(l, $q.ai)) + $t.k87 + esc(t(l, 'dl')) + $t.k88 + P + $q.aY + esc(t(l, $q.aZ)) + $q.aj;
b = $q.iJ + P + $q.iK + esc(t(l, 'wk_h1')) + $t.k89 + (mk ? '?m=' + encodeURIComponent(mk) : '') + $q.iL + esc(t(l, 'fd_l')) + $t.k90 + (mk ? '?m=' + encodeURIComponent(mk) : '') + $s.k21 + b;
const res = await page(shell, l, { path: $q.iM, h1: t(l, 'ch_h1'), lead: t(l, $q.iN), body: b, noindex: !!mk, head: $s.FEEDL, crumb: [[t(l, 'data'), P + $q.bJ]] });
return res;
}
const mIdx = v => { const q = qtr(v); return q ? q[0] * 12 + (q[2] || (q[1] ? q[1] * 3 : 12)) : null; };
function hoMoves(rows) {
const out = [];
for (const r of rows) { const ev = tlEvents(r); if (ev) for (const x of ev) if (x.f === 'ho' && realChange(x)) { const a = mIdx(x.p), b = mIdx(x.v); out.push({ r, x, dm: a != null && b != null ? b - a : null }); } }
return out.sort((a, c) => (a.x.d < c.x.d ? 1 : a.x.d > c.x.d ? -1 : 0) || a.r[2].localeCompare(c.r[2]));
}
const byM = (l, dm) => dm == null ? t(l, 'tr_nm') : dm === 0 ? t(l, 'tr_m0') : tf(l, dm > 0 ? 'tr_ml' : 'tr_me', { n: nf(Math.abs(dm), l) });
// n40 d8: developer summary card under the lead: projects, register-confirmed facts, later handover dates, past due, and the handover years as a strip
function devCard(l, slug) {
const rows = IX.byDev.get(slug) || []; if (rows.length < 2) return '';
const g = regShare(rows), k = devTrack(slug), lp = k ? new Set(k.late.map(m => m.r[1])).size : 0, od = dlAll().od.filter(([x]) => x[5] === slug).length, Y = new Map();
for (const r of rows) { const y = r[8][0] ? yOf(r[8][0][0]) : null; Y.set(y, (Y.get(y) || 0) + 1); }
const ys = [...Y.keys()].filter(Boolean).sort(), mx = Math.max(...Y.values()), c = (n, a, b) => '<div class="kdc-s"><dt>' + esc(t(l, a)) + '</dt><dd><b>' + bdi(n) + '</b>' + (b ? ' <span>' + esc(b) + '</span>' : '') + '</dd></div>';
const col = (y, n) => '<li' + (y ? '' : $q.iO) + $q.iP + Math.max(6, Math.round(100 * n / mx)) + '"><b>' + nf(n, l) + $q.iQ + (y ? y : esc(t(l, $q.iR))) + $q.fi;
return $q.iS + dir(l) + $q.iT + esc(t(l, $q.iU)) + $q.iV + c(nf(rows.length, l), $q.iW) + c(nf(share(g.g, g.h), l) + '%', $q.iX, tf(l, $q.iY, { a: nf(g.g, l), b: nf(g.h, l) })) +
c(nf(lp, l), $q.iZ, k ? tf(l, $q.ja, { d: fd(TL.days[0][0], l) }) : '') + c(nf(od, l), $q.jb) + '</dl>' + (ys.length > 1 ? $q.jc + esc(t(l, $q.jd)) + $q.je + esc(t(l, $q.jf)) + $q.jg + ys.map(y => col(y, Y.get(y))).join('') + (Y.get(null) ? col(null, Y.get(null)) : '') + '</ol>' : '') + $q.fL;
}
function devTrack(slug) {
const rows = IX.byDev.get(slug) || [], th = rows.filter(r => TL && TL.p && TL.p[r[1]] && TL.p[r[1]].ho);
if (!th.length) return null;
const mv = hoMoves(rows), late = mv.filter(m => m.dm > 0), early = mv.filter(m => m.dm < 0);
return { rows, th, mv, late, early, nc: mv.filter(m => m.dm == null || m.dm === 0).length, p: new Set(mv.map(m => m.r)).size, md: median(late.map(m => m.dm)) };
}
function moveChart(l, mv, name) {
const M = mv.filter(m => m.dm != null && m.dm !== 0).slice(0, 16); if (!M.length) return '';
const mx = Math.max(6, ...M.map(m => Math.abs(m.dm))), W = 640, L = 230, R = 50, cx = L + (W - L - R) / 2, sc = (W - L - R) / 2 / mx, H = 24 * M.length + 30, rtl = l === 'ar';
const bars = M.map((m, i) => { const y = 8 + i * 24, w = Math.max(2, Math.abs(m.dm) * sc), x = m.dm > 0 ? cx : cx - w, nm = String(m.r[2] || ''); return $q.jh + (L - 8) + '" y="' + (y + 13) + $t.k91 + esc(nm.length > 32 ? nm.slice(0, 31) + '…' : nm) + $q.ji + x.toFixed(1) + '" y="' + y + $q.dl + w.toFixed(1) + $q.jj + (m.dm > 0 ? $q.jk : $q.jl) + $q.dj + esc(nm + ': ' + byM(l, m.dm)) + $q.jm + (m.dm > 0 ? x + w + 4 : x - 4).toFixed(1) + '" y="' + (y + 13) + $q.jn + (m.dm > 0 ? 'start' : 'end') + $q.jo + (m.dm > 0 ? '+' : '') + nf(m.dm, l) + $q.bq; }).join('');
return $t.k92 + (rtl ? $q.jp : '') + $q.jq + W + ' ' + H + $q.jr + W + $t.k93 + esc(tf(l, 'mc_l', { d: name, n: nf(M.length, l) })) + $q.js + cx + $q.jt + cx + $q.ju + (H - 22) + $t.k94 + bars + $q.jh + cx + '" y="' + (H - 6) + $t.k95 + esc(t(l, 'mc_ax')) + $q.jv + dir(l) + '>' + esc(t(l, 'mc_c')) + $q.jw;
}
function trackSection(l, slug) {
const k = devTrack(slug); if (!k) return '';
const days = TL.days, name = k.rows[0][6] || slug;
let b = $q.jx + esc(t(l, 'tr_h')) + $q.fC + esc(tf(l, 'tr_p', { a: fd(days[0][0], l), b: fd(D.built, l), d: name, t: nf(k.th.length, l), p: nf(k.p, l), m: nf(k.mv.length, l) })) + '</p>';
if (!k.mv.length) return b + '<p>' + esc(t(l, 'tr_0')) + '</p>';
b += $q.jy + esc(k.late.length ? tf(l, $q.jz, { n: nf(k.late.length, l), m: nf(k.md, l) }) : tf(l, $q.jA, { n: nf(0, l) })) + $q.jB + esc(tf(l, $q.jC, { n: nf(k.early.length, l) })) + '</li>' + (k.nc ? '<li>' + esc(tf(l, 'tr_nc', { n: nf(k.nc, l) })) + '</li>' : '') + '</ul>';
b += moveChart(l, k.mv, name);
b += $t.k96 + esc(t(l, 'tr_h')) + $q.S + esc(t(l, 'th_p')) + $q.T + esc(t(l, $q.iE)) + $q.T + esc(t(l, 'ch_to')) + $q.T + esc(t(l, 'tr_by')) + $q.T + esc(t(l, $q.jD)) + $q.T + esc(t(l, 'th_s')) + $q.U +
k.mv.map(m => { const c = m.r[8][0], u = c && c[1];
return $q.V + recU(l, m.r[1]) + $q.iH + bdi(m.r[2]) + $q.W + bdi(tv(m.x.p, l, 40)) + $q.aw + bdi(tv(m.x.v, l, 40)) + $q.aw + esc(byM(l, m.dm)) + $q.aw + esc(fd(m.x.d, l)) + $q.ae + (c ? esc(t(l, 'k_' + c[2])) : '') + (u && /^https?:/.test(u) ? $t.k97 + esc(u) + $q.aK + esc(host(u)) + '</a>' : '') + $q.ag; }).join('') + $q.Y;
return b + $q.q + esc(t(l, $q.jE)) + $q.hL + pre(l) + $q.iK + esc(t(l, 'wk_h1')) + $q.aj;
}
const DAY = 86400000, isoD = ms => new Date(ms).toISOString().slice(0, 10);
async function weekPage(env, shell, l) {
const P = pre(l), all = allChanges(), z = Date.parse(D.built + $q.O), a = isoD(z - 6 * DAY), a0 = isoD(z - 13 * DAY);
const wk = all.filter(x => x[1].d >= a), prev = all.filter(x => x[1].d >= a0 && x[1].d < a).length, G = new Map();
for (const x of wk) (G.get(x[0][3]) || G.set(x[0][3], []).get(x[0][3])).push(x);
const mks = [...G.keys()].sort((m, n) => G.get(n).length - G.get(m).length || m.localeCompare(n));
let b = $q.iC + esc(tf(l, 'wk_n', { n: nf(wk.length, l), p: nf(new Set(wk.map(x => x[0])).size, l), k: nf(mks.length, l), a: fd(a, l), b: fd(D.built, l), q: nf(prev, l) })) + $q.iD;
if (!wk.length) b += '<p>' + esc(t(l, 'wk_0')) + '</p>';
else b += $q.jF + esc(t(l, 'ch_mk')) + $q.jG + mks.map(m => $q.jH + slugM(m) + '">' + bdi(m) + $q.bF + nf(G.get(m).length, l) + $q.fi).join('') + $q.ij;
for (const m of mks) {
const rows = G.get(m), ho = rows.filter(x => x[1].f === 'ho');
b += $q.jI + slugM(m) + '">' + esc(tf(l, 'wk_mh', { m })) + $q.aa + esc(tf(l, 'wk_mp', { n: nf(rows.length, l), p: nf(new Set(rows.map(x => x[0])).size, l), h: nf(ho.length, l) })) + '</p>' +
$t.k98 + esc(tf(l, 'wk_mh', { m })) + $q.S + esc(t(l, 'tl_d')) + $q.T + esc(t(l, 'th_p')) + $q.T + esc(t(l, 'th_f')) + $q.T + esc(t(l, $q.iE)) + $q.T + esc(t(l, 'ch_to')) + $q.U +
rows.map(([r, x]) => $q.iF + esc(fd(x.d, l)) + $q.iG + recU(l, r[1]) + $q.iH + bdi(r[2]) + $q.iI + fname(l, x.f) + (x.f === 'ho' ? $q.aL + esc(byM(l, (mIdx(x.v) != null && mIdx(x.p) != null) ? mIdx(x.v) - mIdx(x.p) : null)) + $q.aN : '') + $q.af + bdi(tv(x.p, l, 90)) + $q.af + bdi(tv(x.v, l, 90)) + $q.ag).join('') + $q.Y +
$q.ak + P + $q.jJ + encodeURIComponent(m) + '">' + esc(tf(l, $q.jK, { m })) + $t.k99 + encodeURIComponent(m) + $q.iL + esc(t(l, 'fd_l')) + $q.aj;
}
b += $q.q + esc(t(l, $q.ah)) + $q.s + P + $q.ba + esc(t(l, 'ch_h1')) + $s.k22 + esc(t(l, 'fd_l')) + $s.k23 + esc(t(l, 'dl')) + $q.aj;
return page(shell, l, { path: $q.gC, h1: t(l, 'wk_h1'), lead: t(l, $q.jL), body: b, head: $s.FEEDL, crumb: [[t(l, 'data'), P + $q.bJ], [t(l, 'ch_h1'), P + $q.iM]] });
}
const xe = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.e }[c]));
function feedAtom(mq) {
const all = allChanges(), mk = mq, rows = (mk ? all.filter(x => x[0][3] === mk) : all).slice(0, 100);
const self = ORIGIN + $q.jM + (mk ? '?m=' + encodeURIComponent(mk) : ''), upd = (rows.length ? rows[0][1].d : D.built) + $q.O;
const x = $t.k100 + xe($q.jN + (mk ? ' in ' + mk : '')) + $q.jO + xe(self) + $q.jP + upd + $q.jQ + xe(self) + $t.k101 + ORIGIN + $q.iM + (mk ? '?m=' + encodeURIComponent(mk) : '') + $t.k102 +
rows.map(([r, c]) => { const f = t('en', 'f_' + c.f), cur = r[8][D.f.indexOf(c.f)], src = cur && cur[1] && /^https?:/.test(cur[1]) ? cur[1] : '';
return $q.jR + xe(r[2] + ': ' + f + $q.jS) + $t.k103 + r[1] + '/' + c.f + '/' + c.d + $q.jP + c.d + $q.jT + ORIGIN + $q.j + r[1] + $q.jU + xe(r[3]) + $q.jV + xe(f + $q.jW + c.p + ' to ' + c.v + ' (' + r[3] + (c.f === 'ho' ? ', ' + byM('en', mIdx(c.v) != null && mIdx(c.p) != null ? mIdx(c.v) - mIdx(c.p) : null) : '') + $q.jX + c.d + '.' + (src ? $q.jY + src : '')) + $q.jZ; }).join('') + $q.ka;
return new Response(x, { headers: { 'content-type': $q.kb, 'cache-control': $q.I, 'access-control-allow-origin': '*' } });
}
function seInfo(l, x) {
const lc = latestChange(x);
return $q.kc + esc(tf(l, 'se_k', { k: nf(cnt(x), l) }) + (lc ? ' · ' + tf(l, 'se_c', { f: t(l, 'f_' + lc.x.f), d: fd(lc.x.d, l) }) : '') + (IX.rgc && IX.rgc.get(x[1]) ? ' · ' + tf(l, 'rg_b', { n: nf(IX.rgc.get(x[1]), l) }) : '')) + $q.Q;
}
function seJson() {
if (!IX.se) { const o = {}; for (const x of D.p) { const lc = latestChange(x); o[x[1]] = lc ? [cnt(x), lc.x.f, lc.x.d] : [cnt(x)]; } const g = {}; for (const x of D.p) { let n = 0; for (const c of x[8]) if (c && c[2] === 'reg') n++; if (n) g[x[1]] = n; } IX.se = JSON.stringify({ built: D.built, p: o, g }); }
return new Response(IX.se, { headers: { 'content-type': $q.hA, 'cache-control': $q.I, 'access-control-allow-origin': '*' } });
}
function seTpl(l) { const f = {}; for (const k of D.f) f[k] = t(l, 'f_' + k); return JSON.stringify({ k: t(l, 'se_k'), c: t(l, 'se_c'), b: t(l, 'rg_b'), f }); }
const ITEMS = [['s1', '/projects/emaar-golf-vale/record/#fields'], ['s2', '/projects/emaar-golf-vale/record/#unknown'], ['s3', '/projects/emaar-golf-vale/record/#market'], ['s4', '/projects/emaar-golf-vale/record/#developer'], ['s5', '/data/gaps/'], ['s6', '/projects/emaar-golf-vale/record/#age'], ['s7', '/data/dictionary/'], ['s8', '/data/gaps/#dist'], ['s9', '/data/gaps.csv'], ['s10', '/projects/emaar-golf-vale/record.json'], ['s11', '/data/'], ['s12', '/m/dubai/#n37-facts'], ['s13', '/developers/emaar-properties/#n37-dev'], ['s14', '/#n37-live'], ['s15', '/engineering/status/'], ['s16', '/projects/meriva-collection-ellington/record/#timeline'], ['s17', '/projects/meriva-collection-ellington/'], ['s18', '/developers/'], ['s19', '/m/dubai/'], ['s20', '/data/catalog.json'], ['s21', '/projects/emaar-golf-vale/#n37-vs'], ['s22', '/projects/emaar-golf-vale/brief/'], ['s23', '/data/changes/'], ['s24', '/search/?q=emaar'], ['s25', '/m/dubai/'], ['s26', '/projects/emaar-golf-vale/changes/'], ['s27', '/data/changes/week/'], ['s28', '/developers/emaar-properties/#n37-track'], ['s29', '/data/changes/feed.atom'], ['s30', '/projects/emaar-golf-vale/#n37-vs'], ['s31', '/projects/emaar-golf-vale/'], ['s32', '/docs/api/#key-facts'], ['s33', '/docs/mcp/#key-facts'], ['s34', '/data/how-we-verify/'], ['s35', '/engineering/status/'], ['s36', '/#n37-prog'], ['s37', '/projects/one-seputeh-residences-kl/#n37-kp'], ['s38', '/registers/malaysia/'], ['s39', '/developers/mah-sing-group/#n37-dreg'], ['s40', '/data/markets/'], ['s41', '/ar/projects/one-seputeh-residences-kl/record/'], ['s42', '/search/?rg=1&so=reg'], ['s43', '/rankings/transparency/dubai/#ranking'], ['s44', '/data/#api-answers'], ['s45', '/projects/emaar-golf-vale/#n37-vs'], ['s46', '/projects/bangsar-hill-park/#n37-kp-stage'], ['s47', '/data/pipeline/'], ['s48', '/data/delays/'], ['s49', '/data/developers/'], ['s50', '/data/markets/dubai/'], ['s51', '/search/?q=emaar#saved'], ['s52', '/projects/emaar-golf-vale/#n38-sup']];
const li37 = l => x => $q.bE + (x[2] || /\.(csv|n?djson|json|atom|svg)$|^\/docs\/|^\/data\/#|^\/(es|fr|de|ru|zh|ar|nl)\/|^\/(accessibility|changelog|check\/red-team|digest|engineering\/[a-z-]+|findings|independence|press\/data|research|verify)\//.test(x[1]) ? '' : pre(l)) + x[1] + '">' + esc(t(l, x[0] + '_t')) + $q.kd + esc(t(l, x[0] + '_s')) + '</li>';
const shipX = (d, l) => { const I = (T && T['items' + d]) || []; return I.length ? $t.k104 + d + '"' + dir(l) + '><h2>' + esc(t(l, 'sh' + d + '_h')) + $q.it + I.map(li37(l)).join('') + $q.ke : ''; };
const shipped = l => shipX(26, l) + shipX(25, l) + $t.k105 + dir(l) + '><h2>' + esc(t(l, 'sh_h')) + $q.aa + esc(t(l, 'sh_p')) + $q.gf + ITEMS.map(x => $q.bE + (/\.(csv|json|atom)$|^\/docs\/|^\/data\/#|^\/(es|fr|de|ru|zh|ar|nl)\//.test(x[1]) ? '' : pre(l)) + x[1] + '">' + esc(t(l, x[0] + '_t')) + $q.kd + esc(t(l, x[0] + '_s')) + '</li>').join('') + $q.ke;
const JH = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=900' };
const srcAbs = (r, f) => { const c = r[8][D.f.indexOf(f)]; return c && c[1] ? (/^https?:/.test(c[1]) ? c[1] : ORIGIN + c[1]) : null; };
function chRow([r, x]) {
const o = { date: x.d, slug: r[1], project: r[2], market: r[3], developer: r[6] || null, field: x.f, label: t('en', 'f_' + x.f), from: x.p, to: x.v, months_moved: null, record: ORIGIN + $q.j + r[1] + $q.kf, source_of_current_value: srcAbs(r, x.f) };
if (x.f === 'ho') { const a = mIdx(x.p), b = mIdx(x.v); if (a != null && b != null) o.months_moved = b - a; }
return o;
}
function chFilter(q) {
let rows = allChanges();
if (q.m) { const k = String(q.m).trim().toLowerCase(); rows = rows.filter(x => x[0][3].toLowerCase() === k); }
if (q.field) { if (!D.f.includes(q.field)) return { err: $q.kg + D.f.join(', ') }; rows = rows.filter(x => x[1].f === q.field); }
let since = q.since || null;
if (since && !/^\d{4}-\d{2}-\d{2}$/.test(since)) return { err: $q.kh };
if (q.days != null) since = isoD(Date.parse(D.built + $q.O) - (q.days - 1) * DAY);
if (since) rows = rows.filter(x => x[1].d >= since);
return { rows, since };
}
function changesJson(u) {
const g = k => u.searchParams.get(k), lim = Math.min(1000, Math.max(1, parseInt(g('limit') || '200', 10) || 200)), off = Math.min(100000, Math.max(0, parseInt(g($q.cm) || '0', 10) || 0));
const q = chFilter({ m: (g('m') || '').slice(0, 80), field: g('field') || '', since: g('since') || '' });
if (q.err) return new Response(JSON.stringify({ error: q.err }), { status: 400, headers: JH });
const o = { built: D.built, licence: $q.du, rule: $s.CH_RULE, copies_from: TL && TL.days && TL.days.length ? TL.days[0][0] : null, filters: { m: g('m') || null, field: g('field') || null, since: q.since }, total: q.rows.length, offset: off, limit: lim,
changes: q.rows.slice(off, off + lim).map(chRow), page: ORIGIN + $q.iM, feed: ORIGIN + $q.jM, week: ORIGIN + $q.ki };
return new Response(JSON.stringify(o, null, 1), { headers: { ...JH, link: '<' + ORIGIN + $t.k106 } });
}
function weekObj() {
const all = allChanges(), z = Date.parse(D.built + $q.O), a = isoD(z - 6 * DAY), a0 = isoD(z - 13 * DAY), wk = all.filter(x => x[1].d >= a), G = new Map();
for (const x of wk) (G.get(x[0][3]) || G.set(x[0][3], []).get(x[0][3])).push(x);
return { built: D.built, licence: $q.du, rule: $s.CH_RULE, from: a, to: D.built, changes_count: wk.length, projects: new Set(wk.map(x => x[0])).size,
previous_week: { from: a0, to: isoD(z - 7 * DAY), changes_count: all.filter(x => x[1].d >= a0 && x[1].d < a).length },
markets: [...G.entries()].sort((m, n) => n[1].length - m[1].length || m[0].localeCompare(n[0])).map(([m, rows]) => ({ market: m, changes: rows.length, projects: new Set(rows.map(x => x[0])).size, handover_moves: rows.filter(x => x[1].f === 'ho').length, page: ORIGIN + $q.fw + slugM(m), feed: ORIGIN + $q.kj + encodeURIComponent(m) })),
changes: wk.map(chRow), page: ORIGIN + $q.gC };
}
function recObj(r) {
const F = D.f, RG = regsFor(r);
return { id: r[0], slug: r[1], name: r[2], market: r[3], area: r[4] || null, developer: r[6] || null, page: ORIGIN + $q.j + r[1] + '/', record: ORIGIN + $q.j + r[1] + $q.k, built: D.built || null,
licence: $q.du, fields_held: cnt(r), fields_total: F.length, kinds: { reg: $t.k107, dev: $q.kk, portal: $q.kl, web: $q.km, sat: $q.kn, rec: $t.k108 },
facts: F.map((f, i) => { const c = r[8][i]; return c ? { field: f, label: t('en', 'f_' + f), value: c[0], source: c[1] ? (/^https?:/.test(c[1]) ? c[1] : ORIGIN + c[1]) : ORIGIN + $q.j + r[1] + $q.ko, kind: c[2], date: c[3] || null, date_is: f === 'ct' ? $q.ce : f === 'cp' ? $q.cf : f === 'sat' ? $q.cg : 'read', definition: ORIGIN + DEF[f] } : null; }).filter(Boolean),
unknown: F.filter((f, i) => !r[8][i]).map(f => ({ field: f, label: t('en', 'f_' + f), how_to_find: t('en', 'ask_' + f), registers: RG.filter(g => g[2].includes(f)).map(g => ({ name: g[0], url: g[1] || null, reached_by_our_checker: g[4] || null })) })) };
}
export async function mcpTool3(env, name, a) {
if (!(await load(env))) return { err: $q.kp };
if (name === $q.kq) {
if (typeof a.slug !== $q.bP || !/^[a-z0-9-]{1,90}$/.test(a.slug)) return { err: $t.k109 };
const r = IX.bySlug.get(a.slug); if (!r) return { status: 404, body: { error: $q.kr, hint: $t.k110 } };
return { body: recObj(r), source: ORIGIN + $q.j + a.slug + $q.ds };
}
if (name === $q.ks) {
if (a.days != null && (!Number.isInteger(a.days) || a.days < 1 || a.days > 120)) return { err: $q.kt };
if (a.limit != null && (!Number.isInteger(a.limit) || a.limit < 1 || a.limit > 200)) return { err: $t.k111 };
if (a.market != null && (typeof a.market !== $q.bP || a.market.length > 80)) return { err: $t.k112 };
const q = chFilter({ m: a.market || '', field: a.field || '', since: a.since || '', days: a.days });
if (q.err) return { err: q.err };
const lim = a.limit || 50;
return { body: { built: D.built, rule: $s.CH_RULE, filters: { market: a.market || null, field: a.field || null, since: q.since }, total: q.rows.length, changes: q.rows.slice(0, lim).map(chRow), more: q.rows.length > lim ? ORIGIN + $q.ku : null }, source: ORIGIN + $q.ku };
}
return null;
}
const AGEB = [[0, 30], [31, 90], [91, 180], [181, 1e9]];
function verifyStats() {
if (IX.vf) return IX.vf;
const K = ['reg', 'sat', 'dev', $q.kv, 'web', 'rec'], kc = Object.fromEntries(K.map(k => [k, 0])), ab = [0, 0, 0, 0], abK = Object.fromEntries(K.map(k => [k, [0, 0, 0, 0]])), z = Date.parse(D.built + $q.O);
let tot = 0, und = 0, sat = 0, satA = null, satZ = null, withReg = 0;
for (const r of D.p) { let hasReg = false; r[8].forEach((c, i) => { if (!c) return; tot++; kc[c[2]] = (kc[c[2]] || 0) + 1; if (c[2] === 'reg') hasReg = true;
if (D.f[i] === 'sat') { sat++; const d = String(c[3] || '').slice(0, 10); if (/^\d{4}-\d{2}-\d{2}$/.test(d)) { if (!satA || d < satA) satA = d; if (!satZ || d > satZ) satZ = d; } }
if (D.f[i] === 'ct') return; const d = String(c[3] || '').slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) { und++; return; }
const ag = Math.max(0, Math.floor((z - Date.parse(d + $q.O)) / DAY)), b = AGEB.findIndex(x => ag >= x[0] && ag <= x[1]); ab[b]++; if (abK[c[2]]) abK[c[2]][b]++; });
if (hasReg) withReg++; }
const regs = []; for (const m in D.rg) for (const g of D.rg[m]) regs.push([m, g]);
return (IX.vf = { K, kc, tot, ab, abK, und, sat, satA, satZ, withReg, regs, mk: Object.keys(D.rg).length });
}
async function verifyPage(env, shell, l) {
const P = pre(l), s = verifyStats(), pc = n => nf(s.tot ? Math.round(1000 * n / s.tot) / 10 : 0, l) + '%', conf = s.kc.reg + s.kc.sat;
let b = $q.iC + esc(tf(l, $q.kw, { n: nf(s.tot, l), p: nf(D.n, l), c: nf(conf, l), cp: pc(conf), r: nf(s.withReg, l) })) + $q.iD;
b += $q.kx + esc(t(l, $q.ky)) + $q.hv + [1, 2, 3, 4, 5, 6].map(i => '<li>' + esc(t(l, 'vf_st' + i)) + '</li>').join('') + '</ol>';
b += $q.kz + esc(t(l, $q.kA)) + $q.aa + esc(t(l, $q.kB)) + $t.k113 + esc(t(l, $q.kA)) + $q.S + esc(t(l, 'th_s')) + $q.T + esc(t(l, $q.kC)) + $q.kD + esc(t(l, $q.kE)) + $q.kD + esc(t(l, $q.kF)) + $q.U +
s.K.map(k => $q.ac + badge(l, k) + $q.aq + esc(t(l, VG[k] === 'r' ? $q.kG : $q.kH)) + $q.aw + nf(s.kc[k] || 0, l) + $q.aw + bdi(pc(s.kc[k] || 0)) + $q.ag).join('') +
$q.ac + esc(tf(l, $q.bh, { n: nf(D.n, l) })) + $q.kI + nf(s.tot, l) + $t.k114;
b += $q.ew + esc(t(l, $q.kJ)) + $q.aa + esc(tf(l, $q.kK, { n: nf(s.regs.length, l), m: nf(s.mk, l), k: nf(s.kc.reg, l), r: nf(s.withReg, l) })) + $t.k115 + esc(t(l, $q.kJ)) + $q.S + esc(t(l, 'gp_m')) + $q.T + esc(t(l, 'g_reg')) + $q.T + esc(t(l, 'th_f')) + $q.T + esc(t(l, $q.kL)) + $q.U +
s.regs.map(([m, g]) => $q.ac + bdi(m) + $q.aq + (g[1] ? $q.n + esc(g[1]) + $q.aK + bdi(g[0]) + '</a>' : bdi(g[0])) + $q.ae + (g[2].length ? g[2].map(f => esc(t(l, 'f_' + f))).join(', ') : '') + $q.aw + esc(g[4] ? fd(g[4], l) : '') + $q.ag).join('') + $q.kM + P + $q.gW + esc(t(l, $q.kN)) + $q.aj;
b += $q.kO + esc(t(l, $q.kP)) + $q.aa + esc(tf(l, $q.kQ, { n: nf(s.sat, l), a: fd(s.satA, l), b: fd(s.satZ, l) })) + $t.k116 + esc(t(l, $q.kR)) + $q.aj;
b += $q.kS + esc(t(l, $q.kT)) + $q.aa + esc(tf(l, $q.kU, { o: nf(s.ab[3], l), u: nf(s.und, l) })) + $t.k117 + esc(t(l, $q.kT)) + $q.S + esc(t(l, 'th_s')) + '</th>' + ['vf_a0', 'vf_a1', 'vf_a2', 'vf_a3'].map(k => $q.bw + esc(t(l, k)) + '</th>').join('') + $q.bg +
s.K.filter(k => s.abK[k].some(Boolean)).map(k => $q.ac + badge(l, k) + '</th>' + s.abK[k].map(n => $q.bj + nf(n, l) + '</td>').join('') + '</tr>').join('') +
$q.ac + esc(t(l, $q.kV)) + '</th>' + s.ab.map(n => $q.kW + nf(n, l) + $q.kX).join('') + $t.k118 + esc(t(l, $q.aE)) + '</p>';
b += $q.kY + esc(t(l, $q.kZ)) + $q.aa + esc(tf(l, $q.la, { n: nf(allChanges().length, l), a: fd(TL && TL.days && TL.days.length ? TL.days[0][0] : D.built, l) })) + $q.s + P + $q.ba + esc(t(l, 'ch_h1')) + $q.aj;
b += $q.lb + esc(t(l, $q.lc)) + $q.ld + [[recU(l, $q.le), 'vf_x1'], [$q.lf, 'vf_x2'], [P + $q.bH, $q.aZ], [$q.lg, 'vf_x3'], [$q.lh, 'vf_x4'], [$q.li, 'vf_x5']]
.map(x => $q.bE + x[0] + '">' + esc(t(l, x[1])) + $q.ge).join('') + '</ul>';
return page(shell, l, { path: $q.gB, h1: t(l, 'vf_h1'), lead: t(l, $q.lj), body: b, crumb: [[t(l, 'data'), P + $q.bJ]] });
}
function progStats() {
if (IX.pg) return IX.pg;
const s = verifyStats(), all = allChanges(), z = Date.parse(D.built + $q.O), a = isoD(z - 6 * DAY), wk = all.filter(x => x[1].d >= a);
let five = 0; for (const r of D.p) if (cnt(r) >= 5) five++;
return (IX.pg = { tot: s.tot, conf: s.kc.reg + s.kc.sat, regs: s.regs.length, mk: s.mk, w: wk.length, wp: new Set(wk.map(x => x[0])).size, from: a, n: D.p.length, five, built: D.built });
}
const pct1 = (a, b, l) => nf(b ? Math.round(1000 * a / b) / 10 : 0, l) + '%';
function progLine(l) {
const g = progStats();
return $q.lk + dir(l) + '>' + esc(tf(l, $q.ll, { c: nf(g.conf, l), n: nf(g.tot, l), cp: pct1(g.conf, g.tot, l) })) + $q.s + pre(l) + $q.t + esc(t(l, 'vf_l')) + $q.lm +
$q.n + pre(l) + $q.iK + esc(tf(l, g.w === 1 ? 'pg_w1' : 'pg_wn', { w: nf(g.w, l), p: nf(g.wp, l) })) + $q.aj;
}
async function progBlock(l, env) {
const g = progStats(), s = await stats(env), P = pre(l), li = (h, x) => $q.bE + h + '">' + esc(x) + $q.ge;
return $s.k24 + dir(l) + $t.k119 + esc(tf(l, 'pg_h', { d: fd(g.built, l) })) + $t.k120 +
(s ? li(P + $q.j, tf(l, 'pg_p', { p: nf(s.projects, l), m: nf(s.markets, l), c: nf(s.countries, l) })) : '') +
li(P + $q.gB, tf(l, $q.ll, { c: nf(g.conf, l), n: nf(g.tot, l), cp: pct1(g.conf, g.tot, l) })) +
li($q.gA, tf(l, 'pg_r', { r: nf(g.regs, l), m: nf(g.mk, l) })) +
li(P + $q.ln, tf(l, 'pg_5', { a: nf(g.five, l), n: nf(g.n, l), p: pct1(g.five, g.n, l) })) +
li(P + $q.gC, tf(l, g.w === 1 ? 'pg_w1' : 'pg_wn', { w: nf(g.w, l), p: nf(g.wp, l) })) +
$t.k121 + esc(t(l, 'pg_n')) + $q.lo + await todayBlock(l, env);
}
async function todayBlock(l, env) {
const g = progStats(), G = await regMap(env), P = pre(l), k = KP ? kpSum(kpRows(null)) : null, li = (h, x) => $q.bE + h + '">' + esc(x) + $q.ge;
return $s.k25 + dir(l) + $t.k122 + esc(tf(l, 'yt_h', { d: fd(g.built, l) })) + $t.k123 +
li(P + $q.lp, tf(l, $q.lq, { n: nf(g.n, l) })) +
(G ? li(P + $q.lr, tf(l, 'yt_rg', { g: nf(G.size, l) })) : '') +
(k ? li(P + $q.ls, tf(l, 'yt_kp', { e: nf(k.n, l), p: nf(k.pr, l), k: nf(k.late3, l) })) : '') +
li(P + $q.lt, tf(l, 'yt_mc', { m: nf(Object.keys(D.mk).length, l) })) +
li(P + $t.k124, t(l, 'yt_dv')) +
li(P + $q.iM, tf(l, 'yt_ch', { w: nf(g.w, l) })) +
$t.k125 + P + $q.lu + esc(tf(l, $q.lv, { n: nf(ITEMS.length, l) })) + $q.fp;
}
let KP = null;
async function loadKP() { KP = D && D.kp && D.kp.p ? D.kp : null; return KP; }
const KST = { 'Lancar': 'ok', 'Belum Mula': 'ns', 'Lewat': 'late', 'Sakit': 'sick', 'Terbengkalai': 'ab', 'Siap Dengan CCC': 'done' };
const kst = p => KST[p.st] || 'x';
const dd = (a, b) => Math.round((Date.parse(a + $q.O) - Date.parse(b + $q.O)) / DAY);
function kpInfo(p) {
const z = D.built, s = kst(p), due = p.vp2 || p.vp || '';
return { s, due, past: !!(due && due < z && s !== 'done'), pexp: p.vt ? dd(p.vt, z) : null, late: s === 'late' || s === 'sick' || s === 'ab' };
}
const KPC = '<style>' + TAP + '.n37-kp{margin:14px 0 0;padding:12px 16px;border:1px solid var(--k-line,var(--line,#D5DCDB));border-radius:14px;line-height:1.5}.n37-kp h2{font-size:1.1rem;margin:0 0 4px}.n37-kp h3{font-size:1rem;margin:12px 0 4px}' +
'.n37-kd{display:grid;grid-template-columns:minmax(150px,34%) 1fr;gap:6px 14px;margin:8px 0}.n37-kd dt{font-weight:600}.n37-kd dd{margin:0;overflow-wrap:anywhere}.n37-kd bdi{overflow-wrap:anywhere}' +
'.n37-os{margin:8px 0;padding:8px 12px;border:1px solid #B7791F;border-inline-start-width:4px;border-radius:10px}' + '@media (max-width:560px){.n37-kd{grid-template-columns:1fr;gap:2px 0}.n37-kd dd{margin:0 0 8px}}.n37-kp a{display:inline-flex;align-items:center;min-height:44px}.n37-kp dd a{min-height:0;display:inline}' +
'.n37-st{display:inline-block;padding:2px 8px;border-radius:999px;font-size:.8rem;font-weight:700;border:1px solid currentColor;white-space:nowrap}.n37-st.ok,.n37-st.done{color:#1F6B3A}.n37-st.ns{color:#56636F}.n37-st.late,.n37-st.sick,.n37-st.ab{color:#9A3412}.n37-fl{color:#9A3412;font-weight:600}' +
':root[data-theme=dark] .n37-st.ok,:root[data-theme=dark] .n37-st.done{color:#7FD49A}:root[data-theme=dark] .n37-st.ns{color:#A9B4BE}:root[data-theme=dark] .n37-st.late,:root[data-theme=dark] .n37-st.sick,:root[data-theme=dark] .n37-st.ab,:root[data-theme=dark] .n37-fl{color:#FFA07A}' +
'@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .n37-st.ok,:root:not([data-theme=light]) .n37-st.done{color:#7FD49A}:root:not([data-theme=light]) .n37-st.ns{color:#A9B4BE}:root:not([data-theme=light]) .n37-st.late,:root:not([data-theme=light]) .n37-st.sick,:root:not([data-theme=light]) .n37-st.ab,:root:not([data-theme=light]) .n37-fl{color:#FFA07A}}</style>';
const stB = (l, p) => $q.lw + kst(p) + '">' + esc(t(l, 'kst_' + kst(p))) + $t.k126 + esc(p.st || '') + $q.aN;
const rm = (v, l) => 'RM ' + nf(v, l);
const pcf = (a, l) => a.map(v => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { maximumFractionDigits: 2, numberingSystem: 'latn' }).format(v); } catch (e) { return String(v); } } ).map(x => x + '%').join(' / ');
function kpPhase(l, p) {
const o = kpInfo(p), row = (k, v) => v ? '<dt>' + esc(t(l, k)) + $q.lx + v + '</dd>' : '';
let pn = '';
if (p.pn) { pn = bdi(p.pn); if (p.vf && p.vt) pn += $q.aD + esc(tf(l, $q.ly, { a: fd(p.vf, l), b: fd(p.vt, l) })) + $q.Q;
if (o.pexp != null && o.pexp < 0) pn += $q.lz + esc(tf(l, $q.lA, { d: fd(p.vt, l) })) + $q.Q; else if (o.pexp != null && o.pexp <= 180) pn += $q.lz + esc(tf(l, o.pexp === 1 ? $q.lB : $q.lC, { n: nf(o.pexp, l) })) + $q.Q; }
let vp = '';
if (p.vp) vp = esc(fd(p.vp, l)) + (p.spa ? $q.aD + esc(tf(l, $q.lD, { d: fd(p.spa, l), m: nf(p.per || 0, l) })) + $q.Q : '');
let ex = '';
if (p.ext) ex = esc(tf(l, p.ext === 1 ? $q.lE : $q.lF, { n: nf(p.ext, l), d: fd(p.vp2, l) })); else if (p.vp) ex = esc(t(l, $q.lG));
if (o.past) ex += (ex ? ' ' : '') + $q.lH + esc(tf(l, $q.lI, { d: fd(o.due, l) })) + $q.Q;
return $q.lJ + row('kp_st', stB(l, p)) + row('kp_pc', p.pc && p.pc.length ? bdi(pcf(p.pc, l)) : '') + row('kp_pn', pn) + row('kp_vp', vp) + row('kp_ex', ex) +
row('kp_un', p.un ? esc(nf(p.un, l)) + (p.pmin ? ' · ' + bdi(rm(p.pmin, l) + ' - ' + rm(p.pmax || p.pmin, l)) : '') : '') + row($q.lK, p.lic ? bdi(p.lic) + (p.lt ? $q.aD + esc(tf(l, 'kp_to', { d: fd(p.lt, l) })) + $q.Q : '') : '') +
row($q.lL, p.u ? $q.n + esc(p.u) + $q.aK + esc(host(p.u)) + $q.lM + esc(tf(l, $q.lN, { d: fd(p.d, l) })) + $q.Q : '') + '</dl>';
}
const osStage = (l, st) => st === $q.lO ? t(l, 'os_uc') : st === $q.lP ? t(l, 'os_op') : st;
function osNote(l, slug, L, id) {
const o = KP && KP.os && KP.os[slug], p = o && L.find(x => kst(x) === 'done'); if (!p) return '';
const src = o[2] ? $q.n + esc(o[2]) + $q.aK + esc(host(o[2])) + '</a>' : '';
const our = '<b>' + esc(osStage(l, o[0])) + $q.hR + (o[3] ? esc(tf(l, $q.lQ, { h: $q.lR, d: fd(o[1], l) })).replace($q.lR, src) : esc(tf(l, $q.lS, { d: fd(o[1], l), h: $q.lR })).replace($q.lR, src)) + $q.Q;
const reg = stB(l, p) + (p.u ? $q.lT + esc(p.u) + $q.aK + esc(host(p.u)) + '</a> ' + esc(tf(l, $q.lN, { d: fd(p.d || KP.built, l) })) + $q.Q : '');
return $q.lU + id + $t.k127 + esc(t(l, 'os_h')) + $q.lV + esc(t(l, $q.lW)) + $q.lx + reg + $q.lX + esc(t(l, $q.lY)) + $q.lx + our + $t.k128 + esc(t(l, 'os_n')) + $q.eM;
}
function kpBlock(l, slug, id, h) {
const L = KP && KP.p[slug]; if (!L) return '';
const r = IX.bySlug.get(slug), H = h || 'h2';
return KPC + $q.lZ + id + $q.ma + id + '-h"' + dir(l) + '><' + H + ' id="' + id + '-h">' + esc(t(l, 'kp_h')) + '</' + H + $q.mb + esc(t(l, 'kp_n')) + '</p>' +
osNote(l, slug, L, id) + L.map(p => (L.length > 1 ? '<h3>' + esc(tf(l, $q.mc, { c: p.c })) + '</h3>' : '') + kpPhase(l, p)).join('') +
$q.md + pre(l) + $q.me + esc(t(l, $q.mf)) + '</a>' + (r && r[5] ? $t.k129 + pre(l) + $q.aU + r[5] + $q.mg + esc(tf(l, $q.mh, { d: r[6] || r[5] })) + '</a>' : '') + $q.lo;
}
function kpRows(m) {
const out = [];
for (const s in KP.p) { const r = IX.bySlug.get(s); if (!r || (m && r[3] !== m)) continue; for (const p of KP.p[s]) out.push([s, p, r]); }
return out;
}
function kpSum(rows) {
const c = { n: rows.length, pr: new Set(rows.map(x => x[0])).size, ok: 0, ns: 0, late: 0, sick: 0, ab: 0, done: 0, x: 0, ext: [], past: 0, pexp: 0 };
for (const [, p] of rows) { const o = kpInfo(p); c[o.s]++; if (p.ext) c.ext.push(p.ext); if (o.past) c.past++; if (o.pexp != null && o.pexp >= 0 && o.pexp <= 180) c.pexp++; }
c.late3 = c.late + c.sick + c.ab; c.med = median(c.ext); c.withSpa = rows.filter(x => x[1].vp).length; return c;
}
function kpMarket(l, m) {
if (!KP) return '';
const rows = kpRows(m); if (rows.length < 5) return '';
const c = kpSum(rows);
return KPC + $t.k130 + dir(l) + $q.mi + esc(tf(l, 'km_h', { m })) + $q.aa + esc(tf(l, 'km_p', { n: nf(c.n, l), p: nf(c.pr, l), d: fd(KP.built || D.built, l) })) + $q.gf +
'<li>' + esc(tf(l, 'km_st', { ok: nf(c.ok, l), ns: nf(c.ns, l), late: nf(c.late3, l), done: nf(c.done, l) })) + '</li>' +
'<li>' + esc(tf(l, $q.mj, { e: nf(c.ext.length, l), s: nf(c.withSpa, l), md: nf(c.med, l), mx: nf(c.ext.length ? Math.max.apply(null, c.ext) : 0, l) })) + '</li>' +
'<li>' + esc(tf(l, $q.mk, { n: nf(c.past, l) })) + $q.jB + esc(tf(l, $q.ml, { n: nf(c.pexp, l) })) + $q.mm +
$q.ak + pre(l) + $q.mn + slugM(m) + '">' + esc(t(l, $q.mf)) + $t.k131 + pre(l) + $q.bk + esc(t(l, 'mc_h1')) + $q.fp;
}
const kpTh = (l, ks) => $q.mo + ks.map(k => $q.bf + esc(t(l, k)) + '</th>').join('') + $q.mp;
const kpTw = (l, inner) => $t.k132 + esc(t(l, 'tw_l')) + $q.mq + inner + $q.mr;
const kpP = (l, x) => $q.ms + pre(l) + $q.j + x[0] + '/">' + bdi(x[2][2]) + '</a>' + (KP.p[x[0]].length > 1 ? $q.aD + esc(x[1].c) + $q.Q : '') + '</th>';
async function kpPage(env, shell, l) {
const P = pre(l), all = kpRows(null), MK = [...new Set(all.map(x => x[2][3]))].sort((a, b) => kpRows(b).length - kpRows(a).length);
let b = KPC + '<p>' + esc(tf(l, 'kr_p', { n: nf(all.length, l), p: nf(new Set(all.map(x => x[0])).size, l), d: fd(KP.built || D.built, l) })) + $t.k133;
b += $q.mt + esc(t(l, $q.mu)) + '</h2>' + kpTw(l, kpTh(l, ['gp_m', 'kr_n', $q.mv, $q.mw, $q.mx, $q.my, $q.mz, $q.mA, $q.mB, $q.mC]) + $q.mD + MK.map(m => { const c = kpSum(kpRows(m));
return $q.mE + slugM(m) + $q.mF + slugM(m) + $q.mG + bdi(m) + $q.mH + [c.n, c.ok, c.ns, c.late3, c.done, c.ext.length, c.med, c.past, c.pexp].map(v => $q.bj + nf(v, l) + '</td>').join('') + '</tr>'; }).join('') + $q.mI);
b += $q.q + esc(t(l, $q.mJ)) + '</p>';
const osL = KP.os ? Object.keys(KP.os).filter(s => KP.p[s] && IX.bySlug.get(s)) : [];
if (osL.length) b += $q.mK + esc(tf(l, 'os_lh', { n: nf(osL.length, l) })) + $q.mL + esc(t(l, 'os_n')) + $q.gf + osL.map(s => { const r = IX.bySlug.get(s), o = KP.os[s]; return $q.bE + P + $q.j + s + $q.mM + bdi(r[2]) + $q.kd + esc(t(l, $q.lW)) + ' ' + esc(t(l, $q.my)) + ' · ' + esc(t(l, $q.lY)) + ' ' + esc(osStage(l, o[0])) + $q.aL + esc(fd(o[1], l)) + $q.mN; }).join('') + '</ul>';
const late = all.filter(x => kpInfo(x[1]).late);
b += $q.mO + esc(tf(l, $q.mP, { n: nf(late.length, l) })) + '</h2>' + (late.length ? kpTw(l, kpTh(l, ['th_p', 'kp_st', 'kp_pc', 'kp_vp', 'kp_ex']) + $q.mD + late.map(x => '<tr>' + kpP(l, x) + '<td>' + stB(l, x[1]) + $q.aw + (x[1].pc ? bdi(pcf(x[1].pc, l)) : '') + $q.aw + esc(fd(x[1].vp, l)) + $q.aw + (x[1].ext ? esc(tf(l, $q.mQ, { n: nf(x[1].ext, l), d: fd(x[1].vp2, l) })) : '') + $q.ag).join('') + $q.mI) : '<p>' + esc(t(l, 'none')) + '</p>');
const ext = all.filter(x => x[1].ext).sort((a, c) => c[1].ext - a[1].ext || a[2][2].localeCompare(c[2][2])).slice(0, 25);
b += $q.mR + esc(t(l, $q.mS)) + $q.aa + esc(t(l, $q.mT)) + '</p>' + kpTw(l, kpTh(l, ['th_p', $q.mz, 'kp_vp', $q.mU, 'kp_st', 'kp_pc']) + $q.mD + ext.map(x => '<tr>' + kpP(l, x) + $q.bj + nf(x[1].ext, l) + $q.aw + esc(fd(x[1].vp, l)) + $q.aw + esc(fd(x[1].vp2, l)) + $q.ae + stB(l, x[1]) + $q.aw + (x[1].pc ? bdi(pcf(x[1].pc, l)) : '') + $q.ag).join('') + $q.mI);
const past = all.filter(x => kpInfo(x[1]).past).sort((a, c) => (kpInfo(a[1]).due < kpInfo(c[1]).due ? -1 : 1));
b += $q.mV + esc(tf(l, $q.mW, { n: nf(past.length, l) })) + $q.aa + esc(t(l, $q.mX)) + '</p>' + (past.length ? kpTw(l, kpTh(l, ['th_p', $q.mY, 'kp_st', 'kp_pc']) + $q.mD + past.map(x => '<tr>' + kpP(l, x) + $q.bj + esc(fd(kpInfo(x[1]).due, l)) + $q.ae + stB(l, x[1]) + $q.aw + (x[1].pc ? bdi(pcf(x[1].pc, l)) : '') + $q.ag).join('') + $q.mI) : '');
const pe = all.filter(x => { const o = kpInfo(x[1]); return o.pexp != null && o.pexp >= 0 && o.pexp <= 180; }).sort((a, c) => (a[1].vt < c[1].vt ? -1 : 1));
b += $q.mZ + esc(tf(l, $q.na, { n: nf(pe.length, l) })) + $q.aa + esc(t(l, $q.nb)) + '</p>' + (pe.length ? kpTw(l, kpTh(l, ['th_p', 'kp_pn', 'kr_vt', 'kp_st']) + $q.mD + pe.map(x => '<tr>' + kpP(l, x) + '<td>' + bdi(x[1].pn) + $q.aw + esc(fd(x[1].vt, l)) + $q.ae + stB(l, x[1]) + $q.ag).join('') + $q.mI) : '');
b += $t.k134 + esc(t(l, $q.nc)) + $t.k135 + esc(t(l, 'code')) + $t.k136 + P + $q.bk + esc(t(l, 'mc_h1')) + $t.k137 + n38u(l, $q.fA) + '">' + esc(t(l, 'dl_h1')) + $t.k138 + P + $t.k139 + P + $q.nd;
b += $q.ak + pre(l) + $q.ne + esc(t(l, 'k_h1')) + $q.aj;
return page(shell, l, { path: $q.ls, h1: t(l, 'kr_h1'), lead: t(l, $q.nf), body: b, crumb: [[t(l, $q.ng), $q.gA]] });
}
function regShare(rows) { let h = 0, g = 0, any = 0; for (const r of rows) { let a = 0; for (const c of r[8]) if (c) { h++; if (c[2] === 'reg') { g++; a = 1; } } any += a; } return { h, g, any, n: rows.length }; }
function devReg(l, slug) {
const rows = IX.byDev.get(slug) || []; if (!rows.length) return '';
const s = regShare(rows), byM = new Map(); for (const r of rows) (byM.get(r[3]) || byM.set(r[3], []).get(r[3])).push(r);
const kp = KP ? rows.filter(r => KP.p[r[1]]) : [];
let b = $q.nh + esc(t(l, 'dr_h')) + $q.fC + esc(tf(l, 'dr_p', { g: nf(s.g, l), h: nf(s.h, l), p: nf(share(s.g, s.h), l), a: nf(s.any, l), n: nf(s.n, l) })) + '</p>';
if (byM.size > 1) b += $q.eH + [...byM].sort((a, c) => c[1].length - a[1].length).map(([m, rs]) => { const x = regShare(rs); return $q.ni + slugM(m) + '/">' + bdi(m) + $q.bF + esc(tf(l, 'dr_m', { g: nf(x.g, l), h: nf(x.h, l), n: nf(rs.length, l) })) + $q.fi; }).join('') + '</ul>';
if (kp.length) b += '<h3>' + esc(t(l, 'dr_kp')) + '</h3>' + kpTw(l, kpTh(l, ['th_p', 'kp_pn', 'kr_vt', 'kp_st', 'kp_vp']) + $q.mD + kp.flatMap(r => KP.p[r[1]].map(p => [r[1], p, r])).map(x => '<tr>' + kpP(l, x) + '<td>' + (x[1].pn ? bdi(x[1].pn) : '') + $q.aw + esc(fd(x[1].vt, l)) + $q.ae + stB(l, x[1]) + $q.aw + esc(fd(x[1].vp2 || x[1].vp, l)) + $q.ag).join('') + $q.mI) + $q.ak + pre(l) + $q.me + esc(t(l, $q.mf)) + $q.aj;
return b + dvRank(l, slug) + $q.ak + pre(l) + $q.bk + esc(t(l, 'mc_h1')) + '</a>' + $t.DOT + $q.n + n38u(l, $q.nj) + '">' + esc(t(l, 'dv_h1')) + $q.aj;
}
const MCS = { n: 'mc_n', med: 'gp_md', five: 'mc_five', reg: 'mc_reg', any: 'mc_any', rg: 'mc_rg' };
function mcRows() {
if (IX.mc) return IX.mc;
return (IX.mc = Object.entries(D.mk).map(([m, v]) => { const rows = IX.byMk.get(m) || [], s = regShare(rows), F = D.f, lo = v.cov.indexOf(Math.min.apply(null, v.cov));
return { m, n: rows.length, med: v.med, five: share(rows.filter(r => cnt(r) >= 5).length, rows.length), reg: share(s.g, s.h), any: share(s.any, rows.length), rg: (D.rg[m] || D.rg[v.co === 'USA' ? $q.R : v.co] || []).length, lo: F[lo], loc: v.cov[lo], kp: KP ? kpRows(m).length : 0 }; }));
}
async function mcPage(env, shell, l, u) {
const P = pre(l), so = MCS[String(u && u.searchParams.get('s') || '')] ? u.searchParams.get('s') : 'n';
const R = mcRows().slice().sort((a, c) => c[so] - a[so] || c.n - a.n || a.m.localeCompare(c.m));
const top = mcRows().filter(x => x.n >= 20).sort((a, c) => c.reg - a.reg)[0];
let b = '<p>' + esc(tf(l, 'mc_p', { m: nf(R.length, l) })) + (top ? ' ' + esc(tf(l, $q.nk, { m: top.m, r: nf(top.reg, l) })) : '') + $t.k140 + esc(t(l, $q.nl)) + '">' + esc(t(l, $q.nl)) + ': ' +
Object.keys(MCS).map(k => k === so ? '<b>' + esc(t(l, MCS[k])) + '</b>' : $q.n + P + $q.nm + (k === 'n' ? '' : '?s=' + k) + $q.dV + esc(t(l, MCS[k])) + '</a>').join(' · ') + '</p>';
b += kpTw(l, $q.nn + esc(t(l, 'gp_m')) + '</th>' + Object.keys(MCS).map(k => $q.no + (k === so ? $q.np : '') + '>' + esc(t(l, MCS[k])) + '</th>').join('') + $q.bf + esc(t(l, 'mc_lo')) + $q.U +
R.map(x => $q.nq + slugM(x.m) + $q.nr + bdi(x.m) + $q.ns + P + $q.nm + slugM(x.m) + '/">' + esc(t(l, 'ms_s')) + '</a>' + (x.kp ? $q.nt + P + $q.mn + slugM(x.m) + $q.nu : '') + $q.ad + nf(x.n, l) + $q.aw + nf(x.med, l) + $q.dU + bdi(nf(x.five, l) + '%') + $q.aw + bdi(nf(x.reg, l) + '%') + $q.aw + bdi(nf(x.any, l) + '%') + $q.aw + nf(x.rg, l) + $q.ae + esc(t(l, 'f_' + x.lo)) + $q.aD + bdi(nf(x.loc, l) + '%') + $q.nv).join('') + $q.mI);
b += $q.q + esc(t(l, $q.nw)) + $q.hL + n38u(l, $q.fy) + '">' + esc(t(l, 'pl_h1')) + '</a>' + $t.DOT + $q.n + n38u(l, $q.fA) + '">' + esc(t(l, 'dl_h1')) + '</a>' + $t.DOT + $q.n + n38u(l, 'heat/') + '">' + esc(t(l, 'e_h1')) + '</a>' + $t.DOT + $q.n + n38u(l, $q.nj) + '">' + esc(t(l, 'dv_h1')) + '</a>' + $t.DOT + $q.n + P + $q.nx + esc(t(l, 'ss_h')) + $q.ny + P + $q.aY + esc(t(l, $q.aZ)) + $t.k141 + P + $q.t + esc(t(l, 'vf_l')) + $t.k142 + P + $q.me + esc(t(l, 'kr_h1')) + $t.k143 + esc(t(l, 'csv_l')) + $q.aj;
return page(shell, l, { path: $q.nm, h1: t(l, 'mc_h1'), lead: t(l, $q.nz), body: b, crumb: [[t(l, 'data'), pre(l) + $q.bJ]] });
}
export async function regMap(env) { if (!(await load(env))) return null; if (!IX.rgc) { const m = new Map(); for (const x of D.p) { let g = 0; for (const c of x[8]) if (c && c[2] === 'reg') g++; if (g) m.set(x[1], g); } IX.rgc = m; } return IX.rgc; }
export function rgT(l, k, v) { return v ? tf(l, k, v) : t(l, k); }
const yOf = v => { const m = /(20\d\d)/.exec(String(v == null ? '' : v)); return m ? +m[1] : null; };
const cpN = v => { const m = /^([\d.]+)\s*%/.exec(String(v == null ? '' : v)); return m ? +m[1] : null; };
const YLO = 2025, YHI = 2031, YRS = [YLO, 2026, 2027, 2028, 2029, 2030, YHI];
const yB = y => y <= YLO ? YLO : y >= YHI ? YHI : y;
const yL = (l, y) => y === YLO ? tf(l, $q.nA, { y }) : y === YHI ? tf(l, $q.nB, { y }) : String(y);
const n38u = (l, p) => pre(l) + $q.bJ + p;
function pipe(m) {
if (!IX.pp) IX.pp = new Map();
if (IX.pp.has(m)) return IX.pp.get(m);
const rows = IX.byMk.get(m) || [], Y = {}; let d = 0;
for (const y of YRS) Y[y] = [0, 0, 0, 0];
for (const r of rows) { const h = r[8][0], y = h && yOf(h[0]); if (!y) continue; d++; const z = Y[yB(y)]; z[0]++; const u = r[8][2]; if (u && typeof u[0] === $q.cd) { z[1] += u[0]; z[2]++; } if (h[2] === 'reg') z[3]++; }
const o = { n: rows.length, d, Y }; IX.pp.set(m, o); return o;
}
const pipeMk = () => Object.keys(D.mk).filter(m => pipe(m).d >= 10).sort((a, b) => pipe(b).d - pipe(a).d || a.localeCompare(b));
function bars(l, m, o) {   // one accessible bar chart: units where the register gives them, else projects
  const U = YRS.some(y => o.Y[y][1] > 0), v = YRS.map(y => o.Y[y][U ? 1 : 0]), mx = Math.max.apply(null, v) || 1, W = 560, H = 190, bw = 56, gap = (W - 20 - bw * YRS.length) / (YRS.length - 1);
  const lab = tf(l, U ? 'pl_cu' : 'pl_cp', { m }) + ': ' + YRS.map((y, i) => yL(l, y) + ' ' + nf(v[i], l)).join(', ');
  return '<figure class="n38-fig"><svg class="n37-ds" viewBox="0 0 ' + W + ' ' + (H + 34) + '" role="img" aria-label="' + esc(lab) + '">' + YRS.map((y, i) => { const h = Math.round((H - 22) * v[i] / mx), x = 10 + i * (bw + gap);
    return '<rect x="' + x.toFixed(1) + '" y="' + (H - h) + '" width="' + bw + '" height="' + Math.max(h, 1) + '" rx="4" fill="currentColor"' + (y === YLO ? ' opacity=".55"' : '') + '></rect><text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - h - 6) + '" text-anchor="middle">' + esc(nf(v[i], l)) + '</text><text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H + 18) + '" text-anchor="middle">' + esc(y === YLO ? '≤' + y : y === YHI ? y + '+' : String(y)) + '</text>'; }).join('') +
    '</svg><figcaption class="k-xs">' + esc(tf(l, U ? 'pl_cu' : 'pl_cp', { m })) + '</figcaption></figure>';
}
function pipeTable(l, m, o) {
return kpTw(l, kpTh(l, ['pl_y', 'pl_p', 'pl_u', 'pl_g']) + $q.mD + YRS.map(y => { const z = o.Y[y]; return $q.ac + esc(yL(l, y)) + $q.ad + nf(z[0], l) + $q.aw + (z[2] ? nf(z[1], l) + $q.aD + esc(tf(l, $q.nC, { a: nf(z[2], l), b: nf(z[0], l) })) + $q.Q : '') + $q.aw + bdi(nf(share(z[3], z[0]), l) + '%') + $q.ag; }).join('') + $q.mI);
}
async function pipePage(env, shell, l, u) {
const P = pre(l), MK = pipeMk(), q = String(u && u.searchParams.get('m') || ''), m = MK.includes(q) ? q : (MK.includes('Dubai') ? 'Dubai' : MK[0]), o = pipe(m);
let b = '<p>' + esc(tf(l, 'pl_p1', { n: nf(MK.length, l), d: fd(D.built, l) })) + $t.k144 + P + $q.nD + esc(t(l, $q.nE)) + $q.iy + MK.map(x => $q.dA + esc(x) + '"' + (x === m ? $q.dB : '') + '>' + esc(x) + ' (' + nf(pipe(x).d, l) + $q.iB).join('') + $t.k145;
b += $q.nF + esc(tf(l, 'pl_mh', { m })) + $q.aa + esc(tf(l, 'pl_mp', { d: nf(o.d, l), n: nf(o.n, l), m })) + '</p>' + bars(l, m, o) + pipeTable(l, m, o);
b += $q.nG + slugM(m) + '/">' + bdi(m) + '</a>' + $t.DOT + $q.n + n38u(l, $q.fx + slugM(m) + '/') + '">' + esc(t(l, 'ms_l')) + '</a>' + $t.DOT + $q.n + n38u(l, $q.fA) + '#mk-' + slugM(m) + '">' + esc(t(l, 'dl_h1')) + $q.aj;
b += $q.nH + esc(t(l, 'pl_ah')) + '</h2>' + kpTw(l, $q.nn + esc(t(l, 'gp_m')) + $q.T + esc(t(l, 'pl_d')) + '</th>' + YRS.map(y => $q.bf + esc(y === YLO ? '≤' + y : y === YHI ? y + '+' : String(y)) + '</th>').join('') + $q.bg +
MK.map(x => { const z = pipe(x); return $q.nI + slugM(x) + '"' + (x === m ? $q.nJ : '') + $q.nK + P + $q.nL + encodeURIComponent(x) + $q.fz + bdi(x) + $q.W + nf(z.d, l) + ' / ' + nf(z.n, l) + '</td>' + YRS.map(y => $q.bj + nf(z.Y[y][0], l) + '</td>').join('') + '</tr>'; }).join('') + $q.mI);
b += $q.q + esc(t(l, $q.nM)) + '</p>';
return page(shell, l, { path: $q.nN, h1: t(l, 'pl_h1'), lead: t(l, $q.nO), body: $s.N38C + b, noindex: !!q, crumb: [[t(l, 'data'), P + $q.bJ]] });
}
const BI = () => { const y = +D.built.slice(0, 4), mo = +D.built.slice(5, 7); return y * 12 + mo; };
function passed(v) { const s = String(v || ''); if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s < D.built; const i = mIdx(s); return i != null && i < BI(); }
function dlAll() {
if (IX.dl) return IX.dl;
const mv = hoMoves(D.p), od = [];
for (const r of D.p) { const h = r[8][0], c = r[8][6]; if (!h || !c || c[2] !== 'reg') continue; const p = cpN(c[0]); if (p != null && p < 100 && passed(h[0])) od.push([r, p]); }
od.sort((a, b) => a[1] - b[1] || a[0][2].localeCompare(b[0][2]));
const by = new Map(), g = m => by.get(m) || by.set(m, { m, d: 0, tr: 0, late: [], early: 0, od: 0, kp: null }).get(m);
for (const r of D.p) { const h = r[8][0]; if (h && yOf(h[0])) g(r[3]).d++; if (TL && TL.p && TL.p[r[1]] && TL.p[r[1]].ho) g(r[3]).tr++; }
for (const x of mv) { const z = g(x.r[3]); if (x.dm > 0) z.late.push(x); else if (x.dm < 0) z.early++; }
for (const [r] of od) g(r[3]).od++;
if (KP) for (const z of by.values()) { const k = kpRows(z.m); if (k.length >= 5) z.kp = kpSum(k); }
const ms = [...by.values()].filter(z => z.d >= 5).sort((a, b) => b.d - a.d || a.m.localeCompare(b.m));
return (IX.dl = { mv, od, ms, late: mv.filter(x => x.dm > 0) });
}
async function delayPage(env, shell, l) {
const P = pre(l), A = dlAll(), days = (TL && TL.days) || [], a = days.length ? days[0][0] : D.built, lp = new Set(A.late.map(x => x.r[1])).size;
let b = $q.nP + nf(lp, l) + $q.cL + esc(tf(l, 'dl_t1', { a: fd(a, l) })) + $q.nQ + nf(median(A.late.map(x => x.dm)), l) + $q.cL + esc(t(l, 'dl_t2')) + $q.nQ + nf(A.od.length, l) + $q.cL + esc(t(l, 'dl_t3')) + $q.cM +
(KP ? $q.cK + nf(kpSum(kpRows(null)).late3, l) + $q.cL + esc(t(l, 'dl_t4')) + $q.cM : '') + $q.cN;
b += $q.nR + esc(t(l, 'dl_hh')) + $q.nS + esc(tf(l, $q.nT, { a: fd(a, l), b: fd(days.length ? days[days.length - 1][0] : D.built, l), n: nf(days.length, l) })) + $q.jB + esc(t(l, $q.nU)) + $q.jB + esc(t(l, $q.nV)) + $q.nW + esc(t(l, $q.nX)) + '</p>';
b += $q.nY + esc(t(l, 'dl_mh')) + '</h2>' + kpTw(l, kpTh(l, ['gp_m', 'pl_d', 'dl_tr', 'dl_lt', 'dl_md', 'dl_er', 'dl_od', 'dl_kp']) + $q.mD + A.ms.map(z => $q.nI + slugM(z.m) + $q.mF + slugM(z.m) + '/">' + bdi(z.m) + $q.W + nf(z.d, l) + $q.aw + nf(z.tr, l) + $q.aw + nf(new Set(z.late.map(x => x.r[1])).size, l) + $q.aw + (z.late.length ? nf(median(z.late.map(x => x.dm)), l) : '') + $q.aw + nf(z.early, l) + $q.aw + nf(z.od, l) + $q.aw + (z.kp ? $q.n + P + $q.mn + slugM(z.m) + '">' + nf(z.kp.late3, l) + ' / ' + nf(z.kp.n, l) + '</a>' : '') + $q.ag).join('') + $q.mI);
const L = A.late.slice().sort((x, y) => y.dm - x.dm || (x.x.d < y.x.d ? 1 : -1)).slice(0, 40);
b += $q.nZ + esc(tf(l, 'dl_lh', { n: nf(L.length, l), t: nf(A.late.length, l) })) + '</h2>' + kpTw(l, kpTh(l, ['th_p', 'ch_mk', $q.iE, 'ch_to', 'tr_by', $q.jD]) + $q.mD + L.map(x => $q.V + recU(l, x.r[1]) + $q.iH + bdi(x.r[2]) + $q.iI + bdi(x.r[3]) + $q.aw + bdi(tv(x.x.p, l, 40)) + $q.aw + bdi(tv(x.x.v, l, 40)) + $q.aw + esc(byM(l, x.dm)) + $q.aw + esc(fd(x.x.d, l)) + $q.ag).join('') + $q.mI);
b += $q.oa + esc(tf(l, 'dl_oh', { n: nf(A.od.length, l) })) + $q.aa + esc(t(l, 'dl_op')) + '</p>' + (A.od.length ? kpTw(l, kpTh(l, ['th_p', 'ch_mk', 'f_ho', 'f_cp', 'th_s']) + $q.mD + A.od.map(([r, p]) => { const c = r[8][6], u = c[1]; return $q.V + pre(l) + $q.j + r[1] + '/">' + bdi(r[2]) + $q.iI + bdi(r[3]) + $q.aw + bdi(tv(r[8][0][0], l, 30)) + $q.aw + bdi(nf(p, l) + '%') + $q.ae + (u && /^https?:/.test(u) ? $q.n + esc(u) + $q.aK + esc(host(u)) + '</a> ' : '') + $q.ob + esc(fd(c[3], l)) + $q.nv; }).join('') + $q.mI) : '<p>' + esc(t(l, 'none')) + '</p>');
b += $q.ak + P + $q.iK + esc(t(l, 'wk_h1')) + '</a>' + $t.DOT + $q.n + P + $q.oc + esc(t(l, 'kr_h1')) + '</a>' + $t.DOT + $q.n + n38u(l, $q.fy) + '">' + esc(t(l, 'pl_h1')) + '</a>' + $t.DOT + $q.n + n38u(l, 'heat/') + '">' + esc(t(l, 'e_h1')) + '</a>' + $t.DOT + $q.od + esc(t(l, 'dl')) + $q.aj;
return page(shell, l, { path: $q.oe, h1: t(l, 'dl_h1'), lead: t(l, $q.of), body: $s.N38C + b, crumb: [[t(l, 'data'), P + $q.bJ]] });
}
const DLS = { g: 'dv_g', n: 'dv_n', any: 'dv_any', med: 'gp_md', mk: 'dv_mk' };
function dvRows() {
if (IX.dv) return IX.dv;
const out = [];
for (const [s, rows] of IX.byDev) { if (rows.length < 3) continue; const x = regShare(rows); out.push({ s, d: rows[0][6] || s, n: rows.length, h: x.h, gg: x.g, g: share(x.g, x.h), any: share(x.any, rows.length), med: median(rows.map(cnt)), mk: new Set(rows.map(r => r[3])).size, ms: [...new Set(rows.map(r => r[3]))].slice(0, 3) }); }
out.sort((a, b) => b.g - a.g || b.n - a.n || a.d.localeCompare(b.d)); out.forEach((x, i) => { x.rk = i + 1; });
return (IX.dv = out);
}
async function dvPage(env, shell, l, u) {
const P = pre(l), q = String(u && u.searchParams.get('s') || ''), so = DLS[q] ? q : 'g', R = dvRows().slice().sort((a, c) => c[so] - a[so] || c.n - a.n || a.d.localeCompare(c.d));
const all = dvRows(), z = all.filter(x => x.gg === 0).length, top = all.filter(x => x.g >= 50).length;
let b = '<p>' + esc(tf(l, 'dv_p1', { n: nf(all.length, l), t: nf(top, l), z: nf(z, l) })) + $t.k146 + esc(t(l, $q.nl)) + '">' + esc(t(l, $q.nl)) + ': ' + Object.keys(DLS).map(k => k === so ? '<b>' + esc(t(l, DLS[k])) + '</b>' : $q.n + P + $q.og + (k === 'g' ? '' : '?s=' + k) + $q.dV + esc(t(l, DLS[k])) + '</a>').join(' · ') + '</p>';
b += kpTw(l, $t.k147 + esc(t(l, 'dv_d')) + '</th>' + Object.keys(DLS).map(k => $q.no + (k === so ? $q.np : '') + '>' + esc(t(l, DLS[k])) + '</th>').join('') + $q.bf + esc(t(l, 'gp_m')) + $q.U +
R.map(x => $q.oh + x.s + $q.oi + nf(x.rk, l) + $q.iG + P + $q.aU + x.s + $q.mg + bdi(x.d) + $q.W + bdi(nf(x.g, l) + '%') + $q.aD + nf(x.gg, l) + '/' + nf(x.h, l) + $q.oj + nf(x.n, l) + $q.aw + bdi(nf(x.any, l) + '%') + $q.aw + nf(x.med, l) + $q.dU + nf(x.mk, l) + $q.ae + x.ms.map(bdi).join(', ') + (x.mk > 3 ? '…' : '') + $q.ag).join('') + $q.mI);
b += $q.q + esc(t(l, $q.ok)) + $q.hL + P + $q.ol + esc(t(l, $q.om)) + '</a>' + $t.DOT + $q.n + P + $q.bk + esc(t(l, 'mc_h1')) + '</a>' + $t.DOT + $q.n + P + $q.t + esc(t(l, 'vf_l')) + $q.aj;
return page(shell, l, { path: $q.og, h1: t(l, 'dv_h1'), lead: t(l, $q.on), body: $s.N38C + b, noindex: !!q, crumb: [[t(l, 'data'), P + $q.bJ], [t(l, 'mc_h1'), P + $q.nm]] });
}
function dvRank(l, slug) { const x = dvRows().find(y => y.s === slug); return x ? $q.oo + n38u(l, $q.nj) + '#d-' + slug + '">' + esc(tf(l, 'dv_rk', { r: nf(x.rk, l), n: nf(dvRows().length, l), g: nf(x.g, l) })) + $q.aj : ''; }
async function sheetPage(env, shell, l, m) {
const P = pre(l), rows = IX.byMk.get(m) || [], v = D.mk[m], F = D.f, c = factCounts(rows), s = regShare(rows), o = pipe(m), A = dlAll(), dz = A.ms.find(z => z.m === m), byK = rows.slice().sort((a, b) => cnt(b) - cnt(a) || a[2].localeCompare(b[2])), sl = slugM(m);
let b = $t.k148 + esc(t(l, 'ms_pr')) + $q.op + esc(t(l, $q.oq)) + $q.aF +
$q.nP + nf(rows.length, l) + $q.cL + esc(t(l, 'ms_r')) + $q.nQ + nf(v.med, l) + $q.or + esc(t(l, 'gp_md')) + $q.nQ + bdi(nf(share(s.g, s.h), l) + '%') + $q.cL + esc(t(l, $q.os)) + $q.nQ + bdi(nf(share(rows.filter(r => cnt(r) >= 5).length, rows.length), l) + '%') + $q.cL + esc(t(l, $q.ot)) + $q.ou;
b += '<h2>' + esc(t(l, $q.ov)) + '</h2>' + kpTw(l, kpTh(l, ['th_f', $q.fq, $q.fr, $q.fD]) + $q.mD + F.map((f, i) => $q.ac + esc(t(l, 'f_' + f)) + $q.ad + nf(c.h[i], l) + ' / ' + nf(rows.length, l) + $q.aw + bdi(nf(share(c.h[i], rows.length), l) + '%') + $q.aw + nf(c.g[i], l) + $q.ag).join('') + $q.mI);
if (o.d) b += '<h2>' + esc(tf(l, 'pl_mh', { m })) + $q.aa + esc(tf(l, 'pl_mp', { d: nf(o.d, l), n: nf(o.n, l), m })) + '</p>' + pipeTable(l, m, o);
if (dz) b += '<h2>' + esc(t(l, 'dl_h1')) + $q.ow + esc(tf(l, 'ms_d1', { n: nf(new Set(dz.late.map(x => x.r[1])).size, l), t: nf(dz.tr, l), md: nf(dz.late.length ? median(dz.late.map(x => x.dm)) : 0, l) })) + $q.jB + esc(tf(l, 'ms_d2', { n: nf(dz.od, l) })) + '</li>' + (dz.kp ? '<li>' + esc(tf(l, 'ms_d3', { n: nf(dz.kp.late3, l), t: nf(dz.kp.n, l) })) + '</li>' : '') + '</ul>';
const rg = regsFor(rows[0] || [0, 0, 0, m]);
if (rg.length) b += '<h2>' + esc(t(l, 'ms_rg')) + $q.it + rg.map(x => $q.bE + esc(x[1]) + $q.aK + bdi(x[0]) + $q.ox + esc(host(x[1])) + $q.oy + esc(x[2].map(f => t(l, 'f_' + f)).join(', ')) + $q.aD + esc(tf(l, $q.oz, { d: fd(x[4], l) })) + $q.fi).join('') + '</ul>';
b += areaBlock(l, m) + nextBlock(l, m);
b += '<h2>' + esc(t(l, $q.fu)) + '</h2>' + recList(l, byK.slice(0, 5)) + '<h2>' + esc(t(l, $q.fv)) + '</h2>' + recList(l, byK.slice(-5).reverse());
b += $q.q + esc(tf(l, $q.oA, { u: ORIGIN + P + $q.nm + sl + '/', d: fd(D.built, l) })) + $q.oB + sl + '/">' + bdi(m) + '</a>' + $t.DOT + $q.n + n38u(l, $q.fy) + '?m=' + encodeURIComponent(m) + $q.fz + esc(t(l, 'pl_h1')) + '</a>' + $t.DOT + $q.n + n38u(l, $q.fA) + '#mk-' + sl + '">' + esc(t(l, 'dl_h1')) + $q.aj +
$s.k26;
return page(shell, l, { path: $q.nm + sl + '/', h1: tf(l, 'ms_h1', { m }), lead: tf(l, $q.oC, { m, n: nf(rows.length, l) }), body: $s.N38C + b, noindex: true, crumb: [[t(l, 'data'), P + $q.bJ], [t(l, 'mc_h1'), P + $q.nm]] });
}
function supplyLine(l, x) {
const h = x[8][0], y = h && yOf(h[0]); if (!y || y < 2026) return '';
const z = pipe(x[3]).Y[yB(y)]; if (!z || z[0] < 3) return '';
return $q.oD + dir(l) + '>' + esc(tf(l, z[2] ? 'sp_u' : 'sp_p', { y: yL(l, yB(y)), m: x[3], p: nf(z[0] - 1, l), u: nf(z[1], l), k: nf(z[2], l) })) + $q.s + n38u(l, $q.fy) + '?m=' + encodeURIComponent(x[3]) + $q.fz + esc(t(l, 'pl_h1')) + $q.aj;
}
function savedBox(l, nonce) {
const L = { save: t(l, $q.oE), saved: t(l, $q.oF), rm: t(l, 'ss_rm'), noq: t(l, $q.oG), full: t(l, $q.oH), loc: LOC[l] || 'en-GB' };
return $q.oI + dir(l) + $q.oJ + esc(JSON.stringify(L)) + $s.k27 +
'<h2>' + esc(t(l, 'ss_h')) + $t.k149 + esc(t(l, 'ss_p')) + $t.k150 + esc(L.save) + $s.k28 + esc(t(l, 'ss_e')) + $q.lo +
$q.oK + (nonce ? $q.gb + esc(nonce) + '"' : '') + $s.k29 +
$s.k30 +
$s.k31 +
$s.k32 +
$s.k33;
}
const P39 = l => pre(l);
const t39u = (l, s) => P39(l) + $q.j + s + '/';
const lnk = (h, s, x) => $q.n + esc(h) + '"' + (x || '') + '>' + esc(s) + '</a>';
const ext = (u, s) => u && /^https?:/.test(u) ? $q.n + esc(u) + $q.aK + esc(s || host(u)) + '</a>' : '';
const cellOf = (r, f) => r[8][D.f.indexOf(f)] || null;
let ECB39 = null;
async function ecb39() {
if (ECB39 && Date.now() - ECB39.t < 43200000) return ECB39.v;
try {
const r = await fetch($t.k151, { cf: { cacheTtl: 21600, cacheEverything: true } });
const x = await r.text(), eu = { EUR: 1 }; for (const m of x.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([\d.]+)['"]/g)) eu[m[1]] = +m[2];
if (!eu.USD) throw 0;
const v = { d: (/time=['"](\d{4}-\d\d-\d\d)/.exec(x) || [])[1] || null, r: {} }; for (const [c, y] of Object.entries(eu)) v.r[c] = y / eu.USD; v.r.USD = 1; v.r.AED = 3.6725;
ECB39 = { t: Date.now(), v }; return v;
} catch (e) { ECB39 = { t: Date.now() - 43200000 + 600000, v: null }; return null; }
}
const CUR39 = ['USD', 'EUR', 'GBP', 'AED', 'MYR', 'THB', 'IDR', 'TRY', 'AUD', 'CNY', 'CHF'];
const priceOf = v => { const m = /\b([A-Z]{3})\s*([\d][\d,.]*)\s*(k|m|million)?/i.exec(String(v || '')); if (!m) return null; let n = +m[2].replace(/,/g, ''); if (!isFinite(n) || !n) return null; const s = (m[3] || '').toLowerCase(); if (s === 'k') n *= 1e3; else if (s) n *= 1e6; return { c: m[1].toUpperCase(), n }; };
const conv = (n, a, b, fx) => (a === b ? n : fx && fx.r[a] && fx.r[b] ? n / fx.r[a] * fx.r[b] : null);
const money = (n, c, l) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { style: $q.oL, currency: c, maximumFractionDigits: 0, numberingSystem: 'latn' }).format(n); } catch (e) { return c + ' ' + nf(Math.round(n), l); } };
const monL = (i, l) => { const y = Math.floor((i - 1) / 12), m = i - y * 12; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { month: 'short', year: $q.f, timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(Date.UTC(y, m - 1, 15))); } catch (e) { return y + '-' + String(m).padStart(2, '0'); } };
const kpOf = s => (D.kp && D.kp.p && D.kp.p[s]) || null;
const DOCS39 = ['pn', 'co', 'es', 'ho', 'pr', 'un', 'cp', 'reg', 'ct'];
async function docPage(env, shell, l, r) {
const rg = regsFor(r), k = kpOf(r[1]);
let b = $t.k152 + esc(t(l, 'ms_pr')) + $q.op + esc(t(l, $q.oq)) + $q.aF;
b += '<p>' + esc(tf(l, $q.oM, { n: r[2], d: r[6] || r[5] || '', m: r[3] })) + $q.oN;
for (const f of DOCS39.concat(['land'])) {
const c = f === 'land' ? null : cellOf(r, f), regs = rg.filter(x => x[2].includes(f === 'land' ? 'pn' : f));
b += $t.k153 + esc(t(l, $q.oO + f)) + '</b>' +
(f === 'land' ? $q.ob + esc(t(l, $q.oP)) + $q.Q : c ? $q.oQ + esc(tf(l, $q.oR, { v: tv(String(c[0]), l, 90), k: t(l, 'k_' + c[2]), d: fd(c[3], l) })) + $q.oS + ext(c[1]) + $q.ei + esc(t(l, $q.oT)) + $q.Q : $q.oU + esc(t(l, $q.oV)) + $q.Q) +
(regs.length ? $q.ei + esc(t(l, $q.oW)) + ' ' + regs.map(x => ext(x[1], x[0])).join(', ') + $q.Q : '') + $q.oX;
}
b += '</ul>';
if (k && k.length) b += '<p>' + esc(tf(l, $q.oY, { c: k.map(p => p.c).join(', ') })) + ' ' + ext(k[0].u, $q.oZ) + '</p>';
b += $q.q + esc(t(l, $q.pa)) + '</p>' + buyRow(l, r, $q.pb) + cmpBlock(l, r) +
$s.k34;
return page(shell, l, { path: $q.j + r[1] + $q.pc, h1: tf(l, $q.pd, { n: r[2] }), lead: t(l, $q.pe), body: $s.N38C + $s.N39T2C + b, noindex: true, crumb: [[t(l, $q.bd), P39(l) + $q.j], [r[2], t39u(l, r[1])]] });
}
function mkMoves(m) { const A = dlAll(), z = A.ms.find(x => x.m === m), all = A.late.map(x => x.dm).filter(x => x > 0).sort((a, b) => a - b); const mine = z ? z.late.map(x => x.dm).filter(x => x > 0).sort((a, b) => a - b) : []; const use = mine.length >= 3 ? mine : all; return { own: mine.length >= 3, n: use.length, med: median(use), hi: use.length ? use[Math.min(use.length - 1, Math.floor(use.length * 0.9))] : 0, max: use.length ? use[use.length - 1] : 0 }; }
async function stressPage(env, shell, l, r, u) {
const q = k => String(u.searchParams.get(k) || '').slice(0, 20), h = cellOf(r, 'ho'), pc = priceOf(cellOf(r, 'pr') && cellOf(r, 'pr')[0]), fx = await ecb39();
let cur = CUR39.includes(q('c').toUpperCase()) ? q('c').toUpperCase() : pc ? pc.c : 'USD';
const pr0 = +q('p').replace(/[^\d.]/g, ''), price = pr0 > 0 ? pr0 : pc ? (conv(pc.n, pc.c, cur, fx) || (cur = pc.c, pc.n)) : 0;
const bp = Math.min(100, Math.max(0, +(q('b') || 60) || 0)), rate = Math.min(30, Math.max(0, +(q('r') || 0) || 0)), now = BI(), hi = h ? mIdx(h[0]) : null, mv = mkMoves(r[3]);
let b = $t.k154 + t39u(l, r[1]) + $q.pf + esc(t(l, 'b_w_p')) + $t.k155 + esc(price ? Math.round(price) : '') + $q.dK + esc(t(l, 'b_w_c')) + $q.pg + CUR39.concat(pc && !CUR39.includes(pc.c) ? [pc.c] : []).map(c => $q.ph + (c === cur ? $q.dB : '') + '>' + c + $q.dz).join('') + $q.pi + esc(t(l, 'b_w_b')) + $t.k156 + bp + $q.dK + esc(t(l, 'b_w_r')) + $t.k157 + rate + $q.pj + esc(t(l, $q.pk)) + $q.dN;
b += $q.q + esc(pc ? tf(l, $q.pl, { v: cellOf(r, 'pr')[0], d: fd(cellOf(r, 'pr')[3], l) }) : t(l, $q.pm)) + (fx && fx.d ? ' ' + esc(tf(l, $q.pn, { d: fd(fx.d, l) })) + ' ' + ext($t.k158, $q.po) : '') + '</p>';
if (hi == null) b += '<p>' + esc(t(l, $q.pp)) + '</p>';
else {
const paid = price * bp / 100, sc = [[$q.pq, 0], [$q.pr, Math.round(mv.med)], [$q.ps, mv.hi], [$q.pt, mv.max]];
b += '<p>' + esc(tf(l, $q.pu, { h: tv(h[0], l), k: t(l, 'k_' + h[2]), d: fd(h[3], l) })) + ' ' + esc(tf(l, mv.own ? $q.pv : $q.pw, { m: r[3], n: nf(mv.n, l) })) + '</p>';
b += kpTw(l, $q.nn + esc(t(l, $q.px)) + $q.T + esc(t(l, $q.py)) + $q.T + esc(t(l, $q.pz)) + $q.T + esc(t(l, $q.pA)) + $q.T + esc(t(l, $q.pB)) + $q.U +
sc.map(([k, d]) => { const w = Math.max(0, hi + d - now); return $q.ac + esc(tf(l, k, { n: nf(d, l) })) + $q.ad + esc(monL(hi + d, l)) + $q.aw + nf(w, l) + $q.aw + (price ? bdi(money(paid, cur, l)) : '') + $q.aw + (price && rate ? bdi(money(paid * rate / 100 * d / 12, cur, l)) : '') + $q.ag; }).join('') + $q.mI);
if (hi < now) b += '<p>' + esc(t(l, $q.pC)) + '</p>';
}
b += $q.q + esc(t(l, $q.pD)) + $q.pE + lnk(n38u(l, $q.fA) + '#mk-' + slugM(r[3]), t(l, 'dl_h1')) + $t.DOT + lnk(P39(l) + $q.pF, t(l, $q.pG)) + '</p>' + buyRow(l, r, $q.pH);
return page(shell, l, { path: $q.j + r[1] + $q.pI, h1: tf(l, $q.pJ, { n: r[2] }), lead: t(l, $q.pK), body: $s.N38C + $s.N39T2C + b, noindex: true, crumb: [[t(l, $q.bd), P39(l) + $q.j], [r[2], t39u(l, r[1])]] });
}
async function devTlPage(env, shell, l, slug, u) {
const rows = IX.byDev.get(slug) || []; if (rows.length < 1) return null;
const fx = await ecb39(), c0 = String(u.searchParams.get('c') || '').toUpperCase(), cur = CUR39.includes(c0) ? c0 : '';
const name = rows[0][6] || slug, now = BI(), dated = rows.map(r => ({ r, i: cellOf(r, 'ho') ? mIdx(cellOf(r, 'ho')[0]) : null })), G = new Map();
for (const x of dated) { const y = x.i == null ? 0 : Math.floor((x.i - 1) / 12); (G.get(y) || G.set(y, []).get(y)).push(x); }
const ys = [...G.keys()].sort((a, b) => (a || 9999) - (b || 9999)), mv = hoMoves(rows), byS = new Map(); for (const m of mv) (byS.get(m.r[1]) || byS.set(m.r[1], []).get(m.r[1])).push(m);
let b = '<p>' + esc(tf(l, 'b_v_p', { d: name, n: nf(rows.length, l), h: nf(dated.filter(x => x.i != null).length, l), p: nf(dated.filter(x => x.i != null && x.i < now).length, l), m: nf(byS.size, l) })) + '</p>';
b += $t.k159 + esc(t(l, 'b_w_c')) + '">' + esc(t(l, 'b_w_c')) + ': ' + [''].concat(['USD', 'EUR', 'GBP', 'AED']).map(c => c === cur ? '<b>' + esc(c || t(l, $q.pL)) + '</b>' : $q.pM + (c ? 'c=' + c : '') + $q.dV + esc(c || t(l, $q.pL)) + '</a>').join(' · ') + (cur && fx && fx.d ? $q.pN + esc(tf(l, $q.pn, { d: fd(fx.d, l) })) + $q.Q : '') + '</p>';
for (const y of ys) {
const L = G.get(y).sort((a, c) => (a.i || 0) - (c.i || 0) || a.r[2].localeCompare(c.r[2]));
b += $q.pO + (y || 'none') + '">' + esc(y ? String(y) + (y * 12 + 12 < now ? ' ' + t(l, $q.pP) : '') : t(l, $q.pQ)) + $q.aL + nf(L.length, l) + $q.pR + kpTw(l, kpTh(l, ['th_p', 'ch_mk', 'f_ho', 'f_cp', 'f_pr', $q.pS]) + $q.mD + L.map(({ r }) => {
const h = cellOf(r, 'ho'), c = cellOf(r, 'cp'), p = cellOf(r, 'pr'), pp = p && priceOf(p[0]), cv = cur && pp ? conv(pp.n, pp.c, cur, fx) : null, ms = byS.get(r[1]) || [];
return $q.V + t39u(l, r[1]) + '">' + bdi(r[2]) + $q.iI + bdi(r[3]) + $q.aw + (h ? bdi(tv(h[0], l, 30)) + $q.aD + esc(t(l, 'k_' + h[2])) + $q.Q : '') + $q.aw + (c ? bdi(tv(String(c[0]), l, 20)) : '') + $q.aw + (cv ? bdi(money(cv, cur, l)) : p ? bdi(tv(String(p[0]), l, 28)) : '') + $q.ae + ms.map(m => esc(tv(m.x.p, l, 20) + ' > ' + tv(m.x.v, l, 20) + ' (' + fd(m.x.d, l) + ')')).join('<br>') + $q.ag;
}).join('') + $q.mI);
}
b += $q.q + esc(t(l, $q.pT)) + $q.pE + lnk(P39(l) + $q.aU + slug + '/', name) + $t.DOT + lnk(n38u(l, $q.nj) + '#d-' + slug, t(l, 'dv_h1')) + $t.DOT + lnk(P39(l) + $q.pU, t(l, $q.om)) + '</p>';
return page(shell, l, { path: $q.aU + slug + $q.pV, h1: tf(l, $q.pW, { d: name }), lead: t(l, $q.pX), body: $s.N38C + $s.N39T2C + b, noindex: !!cur, crumb: [[t(l, $q.pY), P39(l) + $q.aU], [name, P39(l) + $q.aU + slug + '/']] });
}
const band = (v, a, c, up) => v == null ? '' : up ? (v >= c ? 'h0' : v >= a ? 'h1' : 'h2') : (v <= a ? 'h0' : v <= c ? 'h1' : 'h2');
function heatRows() {
if (IX.ht) return IX.ht;
const A = dlAll(), out = [];
for (const [m, rows] of IX.byMk) {
if (rows.length < 10) continue;
const s = regShare(rows), z = A.ms.find(x => x.m === m), lp = z ? new Set(z.late.map(x => x.r[1])).size : 0, pn = rows.filter(r => cellOf(r, 'pn')).length;
out.push({ m, n: rows.length, reg: share(s.g, s.h), pn: share(pn, rows.length), med: D.mk[m] ? D.mk[m].med : median(rows.map(cnt)), tr: z ? z.tr : 0, late: z && z.tr ? share(lp, z.tr) : null, lm: z && z.late.length ? median(z.late.map(x => x.dm)) : null, od: z ? z.od : 0, kp: z && z.kp ? share(z.kp.late3, z.kp.n) : null });
}
out.sort((a, b) => b.n - a.n || a.m.localeCompare(b.m));
return (IX.ht = out);
}
async function heatPage(env, shell, l) {
const H = heatRows(), C = [['reg', $q.os, 20, 60, 1, '%'], ['pn', $q.pZ, 20, 60, 1, '%'], ['med', 'gp_md', 3, 6, 1, ' / 10'], ['late', $q.qa, 10, 25, 0, '%'], ['lm', $q.qb, 3, 9, 0, ''], ['od', 'dl_od', 0, 5, 0, ''], ['kp', $q.qc, 5, 15, 0, '%']];
let b = '<p>' + esc(tf(l, 'b_e_p', { n: nf(H.length, l) })) + $q.qd + esc(t(l, $q.qe)) + $q.qf + esc(t(l, $q.qg)) + $q.qh + esc(t(l, $q.qi)) + $q.qj + esc(t(l, $q.qk)) + $q.mm;
b += $q.ql + kpTw(l, $q.nn + esc(t(l, 'gp_m')) + $q.T + esc(t(l, 'ms_r')) + '</th>' + C.map(c => $q.bf + esc(t(l, c[1])) + '</th>').join('') + $q.bg +
H.map(x => $q.nI + slugM(x.m) + $q.mF + slugM(x.m) + $q.qm + bdi(x.m) + $q.W + nf(x.n, l) + '</td>' + C.map(c => { const v = x[c[0]], k = band(v, c[2], c[3], c[4]); return $q.qn + k + '">' + (v == null ? $q.ob + esc(t(l, $q.qo)) + $q.Q : bdi(nf(v, l) + c[5]) + $q.qp + esc(t(l, 'b_e_' + (k === 'h0' ? 'b0' : k === 'h1' ? 'b1' : 'b2'))) + $q.fQ) + '</td>'; }).join('') + '</tr>').join('') + $q.mI) + $q.cN;
b += $q.q + esc(t(l, $q.qq)) + $q.pE + lnk(n38u(l, $q.fx), t(l, 'mc_h1')) + $t.DOT + lnk(n38u(l, $q.fA), t(l, 'dl_h1')) + $t.DOT + lnk(n38u(l, $q.fy), t(l, 'pl_h1')) + '</p>';
return page(shell, l, { path: $q.qr, h1: t(l, $q.qs), lead: t(l, $q.qt), body: $s.N38C + $s.N39T2C + b, crumb: [[t(l, 'data'), P39(l) + $q.bJ], [t(l, 'mc_h1'), n38u(l, $q.fx)]] });
}
const nrm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
async function lookupPage(env, shell, l, u) {
const q0 = String(u.searchParams.get('n') || '').slice(0, 60).trim(), q = nrm(q0), hits = [];
if (q.length >= 3) for (const r of D.p) { const c = cellOf(r, 'pn'), k = kpOf(r[1]); let w = null; if (c && nrm(c[0]).includes(q)) w = ['pn', c[0], c[1], c[3]]; else if (k && k.some(p => nrm(p.c).includes(q))) { const p = k.find(z => nrm(z.c).includes(q)); w = ['kp', p.c + ' (' + p.st + ')', p.u, D.kp.built]; } else if (nrm(r[0]) === q) w = ['id', r[0], '', D.built]; if (w) { hits.push([r, w]); if (hits.length >= 50) break; } }
let b = $t.k160 + P39(l) + $t.k161 + esc(t(l, 'b_k_l')) + $q.qu + esc(q0) + $t.k162 + esc(t(l, $q.qv)) + $q.qw + esc(tf(l, $q.qx, { n: nf(D.known[1], l) })) + '</p>';
if (q0) b += $q.qy + esc(tf(l, hits.length === 1 ? $q.qz : $q.qA, { n: nf(hits.length, l), q: q0 })) + '</h2>' + (hits.length ? kpTw(l, kpTh(l, ['th_p', 'ch_mk', $q.qB, 'th_s', 'f_ho']) + $q.mD + hits.map(([r, w]) => { const h = cellOf(r, 'ho'); return $q.V + t39u(l, r[1]) + $q.qC + bdi(r[2]) + $q.iI + bdi(r[3]) + $q.aw + bdi(tv(String(w[1]), l, 60)) + $q.ae + ext(w[2]) + $q.aD + esc(fd(w[3], l)) + $q.oj + (h ? bdi(tv(h[0], l, 30)) : '') + $q.ag; }).join('') + $q.mI) : '<p>' + esc(t(l, $q.qD)) + '</p>');
b += $q.q + esc(t(l, $q.qE)) + $q.pE + lnk(P39(l) + $q.gA, t(l, $q.ng)) + $t.DOT + lnk(P39(l) + $q.ls, t(l, 'kr_h1')) + '</p>';
return page(shell, l, { path: $q.qF, h1: t(l, $q.qG), lead: t(l, $q.qH), body: $s.N38C + $s.N39T2C + b, noindex: !!q0, crumb: [[t(l, $q.ng), P39(l) + $q.gA]] });
}
function devLine(l, r) {
if (!r[5]) return ''; const rows = IX.byDev.get(r[5]) || []; if (rows.length < 2) return '';
const k = devTrack(r[5]), od = dlAll().od.filter(([x]) => x[5] === r[5]).length, lp = k ? new Set(k.late.map(m => m.r[1])).size : 0;
return $q.qI + dir(l) + '>' + esc(tf(l, $q.qJ, { d: r[6] || r[5], n: nf(rows.length, l), t: nf(k ? k.th.length : 0, l), m: nf(lp, l), o: nf(od, l) })) + $q.s + P39(l) + $q.aU + r[5] + $q.qK + esc(t(l, $q.qL)) + $q.aj;
}
function areaBlock(l, m) {
const rows = IX.byMk.get(m) || [], G = new Map(); for (const r of rows) if (r[4]) (G.get(r[4]) || G.set(r[4], []).get(r[4])).push(r);
const A = [...G.entries()].filter(([, a]) => a.length >= 3).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])).slice(0, 20);
if (A.length < 2) return '';
return $q.qM + dir(l) + '><h2>' + esc(tf(l, $q.qN, { m: mkName(m, l) })) + $q.mL + esc(t(l, 'b_a_p')) + '</p>' + kpTw(l, kpTh(l, [$q.qO, 'ms_r', $q.pZ, $q.os, 'gp_md']) + $q.mD + A.map(([a, rs]) => { const s = regShare(rs); return $q.ac + bdi(a) + $q.ad + nf(rs.length, l) + $q.aw + bdi(nf(share(rs.filter(r => cellOf(r, 'pn')).length, rs.length), l) + '%') + $q.aw + bdi(nf(share(s.g, s.h), l) + '%') + $q.aw + nf(median(rs.map(cnt)), l) + $q.X; }).join('') + $q.mI) + '<p>' + lnk(n38u(l, 'heat/') + '#mk-' + slugM(m), t(l, $q.qs)) + $q.lo;
}
function nextBlock(l, m) {
const now = BI(), rows = (IX.byMk.get(m) || []).map(r => [r, cellOf(r, 'ho')]).map(([r, h]) => [r, h, h ? mIdx(h[0]) : null]).filter(x => x[2] != null && x[2] >= now && x[2] <= now + 12).sort((a, b) => a[2] - b[2] || a[0][2].localeCompare(b[0][2]));
if (!rows.length) return '';
return $q.qP + dir(l) + '><h2>' + esc(tf(l, 'b_x_h', { m: mkName(m, l), n: nf(rows.length, l) })) + $q.mL + esc(t(l, 'b_x_p')) + '</p>' + kpTw(l, kpTh(l, ['th_p', 'f_ho', 'th_s', 'f_cp']) + $q.mD + rows.slice(0, 25).map(([r, h]) => { const c = cellOf(r, 'cp'); return $q.V + t39u(l, r[1]) + '">' + bdi(r[2]) + $q.W + bdi(tv(h[0], l, 30)) + $q.ae + esc(t(l, 'k_' + h[2])) + $q.aD + esc(fd(h[3], l)) + $q.oj + (c ? bdi(tv(String(c[0]), l, 20)) + $q.aD + esc(t(l, 'k_' + c[2])) + $q.Q : '') + $q.ag; }).join('') + $q.mI) + (rows.length > 25 ? $q.q + esc(tf(l, $q.qQ, { n: nf(rows.length - 25, l) })) + ' ' + lnk(n38u(l, $q.fy) + '?m=' + encodeURIComponent(m) + '#m', t(l, 'pl_h1'), $q.qR) + '</p>' : '') + $q.fL;
}
function olBlock(l, m, O) {   // n40 k42: yearly handover outlook from /data/n40-outlook.json (built from bali-cases.json, same fields as /api/open/projects)
const o = O && O.m && O.m[slugM(m)]; if (!o) return '';
const c = (a, n) => nf(a, l) + ' <span class="k-xs">(' + bdi(nf(share(a, n), l) + '%') + ')</span>';
return $q.qS + dir(l) + '><h2>' + esc(tf(l, $q.qT, { m: mkName(m, l) })) + $q.mL + esc(tf(l, $q.qU, { m: mkName(m, l), d: fd(O.d, l) })) + '</p>' + kpTw(l, kpTh(l, [$q.qV, $q.qW, $q.qX, $q.qY]) + $q.mD + Object.entries(o.y).map(([y, a]) => $q.ac + bdi(y) + $q.ad + nf(a[0], l) + $q.aw + c(a[1], a[0]) + $q.aw + c(a[2], a[0]) + $q.ag).join('') + $q.mI) + $q.q + lnk($q.qZ + encodeURIComponent(o.m), t(l, $q.ra), $q.qR) + $q.lo;
}
function cmpPick(r) {
const h = cellOf(r, 'ho'), i = h ? mIdx(h[0]) : null;
return (IX.byMk.get(r[3]) || []).filter(x => x !== r).map(x => { const c = cellOf(x, 'ho'), j = c ? mIdx(c[0]) : null; return [x, (i != null && j != null ? Math.abs(i - j) : 999) - (x[4] && x[4] === r[4] ? 6 : 0) - cnt(x) * 0.1]; }).sort((a, b) => a[1] - b[1] || a[0][2].localeCompare(b[0][2])).slice(0, 3).map(a => a[0]);
}
function cmpBlock(l, r) {
const L = cmpPick(r); if (L.length < 2) return '';
const all = [r].concat(L), rg = x => x[8].filter(c => c && c[2] === 'reg').length;
return $q.rb + dir(l) + '><h3>' + esc(t(l, 'b_c_h')) + $q.rc + esc(t(l, 'b_c_p')) + '</p>' + kpTw(l, kpTh(l, ['th_p', $q.qO, 'f_ho', 'th_k', $q.rd]) + $q.mD + all.map(x => { const h = cellOf(x, 'ho'); return $q.ac + (x === r ? bdi(x[2]) : $q.n + t39u(l, x[1]) + '">' + bdi(x[2]) + '</a>') + $q.aq + bdi(x[4] || '') + $q.aw + (h ? bdi(tv(h[0], l, 30)) : '') + $q.aw + nf(cnt(x), l) + $q.dU + nf(rg(x), l) + $q.ag; }).join('') + $q.mI) +
$q.ak + P39(l) + $q.re + all.map(x => encodeURIComponent(x[0])).join(',') + $q.dV + esc(t(l, $q.rf)) + $q.fp;
}
function buyRow(l, r, cur) {
return $q.rg + dir(l) + '>' + [[$q.pb, 'b_q_l'], [$q.pH, 'b_w_l']].filter(x => x[0] !== cur).map(x => lnk(t39u(l, r[1]) + x[0] + '/', t(l, x[1]))).join($t.DOT) + (r[5] ? $t.DOT + lnk(P39(l) + $q.aU + r[5] + $q.pV, t(l, $q.qL)) : '') + $t.DOT + lnk(P39(l) + $q.qF, t(l, $q.qG)) + (cur ? $t.DOT + lnk(t39u(l, r[1]), r[2]) : '') + '</p>';
}
export async function inject(req, u, env, r) {
try {
if (!/text\/html/.test(r.headers.get($q.cH) || '')) return r;
const m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(.*)$/.exec(u.pathname), l = m[1] || 'en', p = m[2];
if (!(await load(env))) return r;
const add = []; let mm;
if ((p === $q.rh || p === 'yc/') && l === 'en') { add.push(['main', $q.ri, shipped(l)]); if (p === 'yc/') add.push([$q.rj, 'after', $s.k35 + esc(tf(l, $q.rk, { d: fd(D.built, l), n: nf(ITEMS.length, l) })) + $q.rl + esc(t(l, $q.rm)) + $t.k163 + esc(t(l, $q.rn)) + $q.aj]); }
else if (p === $q.ro) { await regMap(env);
return new HTMLRewriter().on($q.rp, { element(e) { e.setAttribute($q.rq, seTpl(l)); } }).on($q.rr, { element(e) { const mm2 = /\/projects\/([a-z0-9-]{1,90})\/$/.exec(e.getAttribute('href') || ''), x = mm2 && IX.bySlug.get(mm2[1]); if (x) e.after(seInfo(l, x), { html: true }); } })
.on('head', { element(e) { e.append(VSC, { html: true }); } }).on('main', { element(e) { e.onEndTag(end => { end.before(savedBox(l, ((r.headers.get($q.gi) || '').match(/'nonce-([^']+)'/) || [])[1]), { html: true }); }); } }).transform(r);
}
else if (p === '') { const h = await homeBits(l, env); if (h) { add.push([$q.rs, 'after', h[0]]); add.push([$q.rt, $q.ru, h[1]]); } }
else if (p === $q.rv) add.push([$q.rw, $q.rx, await progBlock(l, env)]);
else if ((mm = /^m\/([^/.]{2,60})\/$/.exec(p))) { const mk = mBySlug(mm[1]); let kk = null; if (mk) try { kk = await (await import('./kbx_n29i.js')).mkKey(env, mm[1], l); } catch (e) {} const dh = mk ? mkDash(l, mk, kk) : ''; if (dh) add.push(l === 'en' ? [$q.ry, $q.rx, dh] : [$q.rz, $q.rx, dh]); const m2 = mk || [...IX.byMk.keys()].find(k => slugM(k) === mm[1]), h = mk ? mkSection(l, mk) + kpMarket(l, mk) + $q.rA + areaBlock(l, mk) + devBlock(l, mk) + nextBlock(l, mk) + olBlock(l, mk, await file(env, $q.rB)) + $q.cN : m2 ? $q.rA + devBlock(l, m2) + $q.cN : ''; if (!h) return r; add.push([$q.rC, $q.rx, h]); }
else if ((mm = /^developers\/([a-z0-9-]{2,90})\/$/.exec(p))) { const h = devSection(l, mm[1]); if (!h) return r; const dc = devCard(l, mm[1]); if (dc) add.push([$q.rD, 'after', dc]); add.push([$q.rE, $q.ri, h + peers(l, mm[1]) + $q.rF + dir(l) + $q.rG + pre(l) + $q.aU + mm[1] + $q.qK + esc(t(l, $q.qL)) + $q.aj]); }
else if ((mm = /^projects\/([a-z0-9-]{1,90})\/$/.exec(p))) {
const x = IX.bySlug.get(mm[1]); if (!x) return r;
const k = cnt(x);
const lc = latestChange(x), lch = lc ? $q.rF + dir(l) + $q.rG + recU(l, x[1]) + $q.iH + esc(tf(l, 'tl_pj', { f: t(l, 'f_' + lc.x.f), a: tv(lc.x.p, l, 70), b: tv(lc.x.v, l, 70), d: fd(lc.x.d, l) })) + '</a>' + (lc.n > 1 ? $q.aD + esc(tf(l, $q.rH, { n: nf(lc.n - 1, l) })) + $q.Q : '') + '</p>' : '';
add.push([$q.rI, $q.ri, VSC + vsBlock(l, x, actRow(l, x)) + kpBlock(l, x[1], $q.rJ, 'h3')]);
add.push([$q.rK, $q.ri, $s.STY + $q.rF + dir(l) + $q.rG + recU(l, x[1]) + '">' + esc(tf(l, 'inj_p', { k: nf(k, l), g: nf(10 - k, l) })) + $t.k164 + pre(l) + $q.j + x[1] + $q.an + esc(t(l, 'a_br')) + $q.aj + lch + devLine(l, x) + buyRow(l, x, '')]);
if (D.mk[x[3]]) add.push([$q.rL, $q.ri, $q.rF + dir(l) + $q.rG + recU(l, x[1]) + $q.rM + esc(tf(l, 'inj_m', { m: x[3] })) + $q.aj + supplyLine(l, x) + cmpBlock(l, x)]);
} else if (p === 'data/' || p === $q.rN || p === $q.rO) add.push(['main', $q.ri, $q.hc + dir(l) + '>' + $s.STY + $q.rP + (l === 'en' || p === 'data/' ? '' : $q.n + pre(l) + $q.hp + esc(t(l, $q.rQ)) + $q.lm) + $q.n + pre(l) + $q.aY + esc(t(l, $q.aZ)) + $q.lm + esc(t(l, 's5_s')) + $t.k165 + pre(l) + $q.rR + esc(t(l, 's8_t')) + $t.k166 + pre(l) + $q.ba + esc(t(l, 'ch_h1')) + $t.k167 + pre(l) + $q.bk + esc(t(l, 'mc_h1')) + $t.k168 + pre(l) + $q.me + esc(t(l, 'kr_h1')) + $t.k169 + esc(t(l, 'csv_l')) + '</a>' + $t.DOT + $q.n + n38u(l, $q.fy) + '">' + esc(t(l, 'pl_h1')) + '</a>' + $t.DOT + $q.n + n38u(l, $q.fA) + '">' + esc(t(l, 'dl_h1')) + '</a>' + $t.DOT + $q.n + n38u(l, $q.nj) + '">' + esc(t(l, 'dv_h1')) + '</a>' + $t.DOT + $q.n + n38u(l, $q.rS) + '">' + esc(tf(l, 'ms_h1', { m: 'Dubai' })) + '</a>' + $t.DOT + $q.n + pre(l) + $q.nx + esc(t(l, 'ss_h')) + $q.fp]);
if (p === 'data/' || p === $q.rN || p === $q.rO || p === $q.rh) { const h = $q.hc + dir(l) + '>' + $s.STY + n39Links(l) + $q.fL, mi = add.find(a => a[0] === 'main'); if (mi) mi[2] += h; else add.push(['main', $q.ri, h]); }
if (!add.length) return r;
let out = new HTMLRewriter();
const tail = [];
for (const [sel, , h] of add) {
const st = { done: false };
if (sel === 'main') tail.push([st, h]);
else { const how = add.find(a => a[0] === sel)[1]; out = out.on(sel, { element(e) { if (!st.done) { st.done = true; e[how](h, { html: true }); } } }); if (how === $q.rx) tail.push([st, h]); }
}
if (tail.length) out = out.on('main', { element(e) { e.onEndTag(end => { for (const [st, h] of tail) if (!st.done) { st.done = true; end.before(h, { html: true }); } }); } });
return out.transform(r);
} catch (e) { return r; }
}
export async function handle(req, u, env, ctx, shell) {
const r = await handle0(req, u, env, ctx, shell);
return r && r.status === 200 && !/text\/html/.test(r.headers.get($q.cH) || '') ? cond(req, r) : r;
}
async function handle0(req, u, env, ctx, shell) {
if (req.method !== 'GET' && req.method !== 'HEAD') return null;
const p = u.pathname; let m;
if (!PATHS.test(p) && !P39T1.test(p)) return null;
if (!(await load(env))) { for (const k in MEMO) delete MEMO[k]; T = null; if (!(await load(env))) return new Response($t.k170, { status: 503, headers: { 'retry-after': '5', 'cache-control': $q.hN, 'content-type': $q.eb } }); }
if ((m = p.match(RX_JS))) { const r = IX.bySlug.get(m[1]); return r ? recJson2(r) : null; }
if ((m = p.match(/^\/data\/(record|changes)\.schema\.json$/))) return new Response(JSON.stringify(schemas()[m[1]], null, 1), { headers: { ...JH, 'content-type': $t.k171 } });
if (p === $q.rT) return badgeSvg();
if (p === $q.rU) return ndjson(u);
if (p === $q.rV) return changesCsv(u);
if (p === $q.rW) return gapsCsv();
if (p === $q.rX) return seJson();
if (p === $q.jM) return feedAtom(String(u.searchParams.get('m') || '').slice(0, 80));
if (p === $q.ku) return changesJson(u);
if (p === $q.ki) return new Response(JSON.stringify(weekObj(), null, 1), { headers: JH });
if ((m = p.match(/^\/m\/([^/]{2,120})\/slugs\.json$/))) return slugsJson(env, m[1]);
try { return await route(env, shell, p, u); } catch (e) {
let e2 = null, diag = '';
for (let k = 0; k < 2; k++) {
try { const S = await import('./kbx_strings.js'); if (!S.isReady()) await S.ready(env); } catch (e3) {}
try { return await route(env, shell, p, u); } catch (e4) { e2 = e4; try { const S = await import('./kbx_strings.js'); diag = $q.rY + S.isReady() + $q.rZ + S.stat.loaded + '/' + S.stat.files + $q.sa + S.stat.errors + ']'; } catch (e5) {} await new Promise(z => setTimeout(z, 150)); }
}
{ return new Response($t.k172, { status: 503, headers: { 'retry-after': '5', 'cache-control': $q.hN, 'content-type': $q.eb, 'x-kb-err': (String(e2 && e2.message || e2).slice(0, 90) + diag).slice(0, 120).replace(/[^\x20-\x7e]/g, '') } }); }
}
}
async function route(env, shell, p, u) {
let m;
if ((m = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?data\/(validate|query|duplicates|sources)(\/?)$/))) { if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' + (u && u.search || '') } }); const l = m[1] || 'en'; return m[2] === $q.sb ? validatePage(env, shell, l) : m[2] === 'query' ? queryRoute(env, shell, l, u) : m[2] === $q.sc ? dupPage(env, shell, l, u) : srcPage(env, shell, l, u); }
if ((m = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?projects\/([a-z0-9-]{1,90})\/brief(\/?)$/))) {
if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' } });
const r = IX.bySlug.get(m[2]); return r ? briefPage(env, shell, m[1] || 'en', r) : null;
}
if ((m = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?data\/changes\/week(\/?)$/))) { if (!m[2]) return new Response(null, { status: 301, headers: { location: p + '/' } }); return weekPage(env, shell, m[1] || 'en'); }
if ((m = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?data\/changes(\/?)$/))) { if (!m[2]) return new Response(null, { status: 301, headers: { location: p + '/' } }); return changesPage(env, shell, m[1] || 'en', String((u && u.searchParams.get('m')) || '').slice(0, 80)); }
if ((m = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?data\/how-we-verify(\/?)$/))) { if (!m[2]) return new Response(null, { status: 301, headers: { location: p + '/' } }); return verifyPage(env, shell, m[1] || 'en'); }
if ((m = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(registers\/malaysia|data\/markets)(\/?)$/))) { if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' } }); return m[2] === $q.sd ? mcPage(env, shell, m[1] || 'en', u) : (KP ? kpPage(env, shell, m[1] || 'en') : null); }
if ((m = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?data\/(pipeline|delays|developers|markets\/([a-z0-9-]{2,60}))(\/?)$/))) {
if (!m[4]) return new Response(null, { status: 301, headers: { location: p + '/' } });
const l = m[1] || 'en';
if (m[3]) { const mk = mBySlug(m[3]); return mk && (IX.byMk.get(mk) || []).length >= 3 ? sheetPage(env, shell, l, mk) : null; }
return m[2] === $q.se ? pipePage(env, shell, l, u) : m[2] === $q.sf ? delayPage(env, shell, l) : dvPage(env, shell, l, u);
}
if ((m = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(?:projects\/([a-z0-9-]{1,90})\/(documents|stress)|developers\/([a-z0-9-]{2,90})\/timeline|data\/(heat)|registers\/(lookup))(\/?)$/))) {
if (!m[7]) return new Response(null, { status: 301, headers: { location: p + '/' } });
const l = m[1] || 'en';
if (m[2]) { const r = IX.bySlug.get(m[2]); return r ? (m[3] === $q.pb ? docPage(env, shell, l, r) : stressPage(env, shell, l, r, u)) : null; }
if (m[4]) return devTlPage(env, shell, l, m[4], u);
return m[5] ? heatPage(env, shell, l) : lookupPage(env, shell, l, u);
}
if ((m = p.match(RX_REC))) {
if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' } });
const r = IX.bySlug.get(m[2]); if (!r) return null;
return recPage(env, shell, m[1] || 'en', r);
}
if ((m = p.match(/^\/(es|de|fr|nl|ru|zh|ar)\/(developers|engineering|yc)(\/?)$/))) { if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' } }); return hubPage(env, shell, m[1], m[2]); }
if ((m = p.match(/^\/(es|de|fr|nl|ru|zh|ar)\/data(\/?)$/))) { if (!m[2]) return new Response(null, { status: 301, headers: { location: p + '/' } }); return dataHub(env, shell, m[1]); }
if ((m = p.match(RX_GAP))) { if (!m[2]) return new Response(null, { status: 301, headers: { location: p + '/' } }); return gapPage(env, shell, m[1] || 'en'); }
return null;
}
export const RX_GH = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?guides\/?$/;
let GH = null;
export async function guidesHub(req, u, env, shell, list) {
const m = u.pathname.match(RX_GH); if (!m) return null;
const l = m[1] || 'en';
if (!u.pathname.endsWith('/')) return Response.redirect(ORIGIN + u.pathname + '/', 301);
if (!(await load(env))) return null;
if (!GH || Date.now() - GH.t > 3600000) { const v = await list(); if (v && v.length) GH = { t: Date.now(), v }; }
if (!GH) return null;
const G = GH.v, P = pre(l), en = l === 'en' ? '' : $q.gd, cn = c => { try { return coName(c, l) || c; } catch (e) { return c; } };
const li = (h, x, a) => $q.bE + h + '"' + (a || '') + '>' + esc(x) + $q.ge;
const topic = $q.eH + li(P + $q.sg, t(l, $q.sh)) + ['dubai', 'bali', $q.si, $q.sj].map(k => li(P + $q.sg + k + '/', tf(l, $q.sk, { p: t(l, 'gh_p_' + k) }))).join('') + $q.sl + esc(t(l, $q.sm)) + $q.bD + [$q.sn, 'china', 'gulf'].map(k => li(P + $q.so + k + '/', t(l, 'gh_p_' + k))).join('') + $q.sp + li(P + $q.sq, t(l, $q.sr)) + li(P + $q.ss, t(l, $q.st)) + li(P + $q.su, t(l, $q.sv)) + '</ul>';
let k = 9;
const rows = G.map(x => { k += 1 + (x.safe ? 1 : 0) + (x.law ? 1 : 0); const b = $q.fU + x.s + '/'; return $q.V + P + b + '">' + bdi(cn(x.c)) + $q.W + nf(x.n, l) + $q.sw + b + $q.sx + en + '>' + esc(t(l, $q.sy)) + $q.sz + (x.safe ? $q.n + b + $q.sA + en + '>' + esc(t(l, $q.sB)) + '</a>' : $q.ob + esc(t(l, 'gh_no')) + $q.Q) + $q.ae + (x.law ? $q.n + b + $q.sC + en + '>' + esc(t(l, $q.sD)) + '</a>' : $q.ob + esc(t(l, 'gh_no')) + $q.Q) + $q.ag; }).join('');
const body = $q.sE + esc(t(l, $q.sF)) + '</h2>' + topic + $q.sG + esc(t(l, $q.sH)) + $q.mL + esc(tf(l, $q.sI, { n: nf(k, l), c: nf(G.length, l) })) + ' ' + (l === 'en' ? '' : esc(t(l, 'gh_en'))) + '</p>' + CSSL + $t.k173 + esc(t(l, $q.sH)) + $t.k174 + esc(t(l, 'gh_c')) + $q.T + esc(t(l, 'gh_n')) + $q.T + esc(t(l, $q.sy)) + $q.T + esc(t(l, $q.sB)) + $q.T + esc(t(l, $q.sD)) + $q.U + rows + $q.Y;
const canon = ORIGIN + P + $q.sJ, h1 = t(l, 'gh_h1'), lead = t(l, $q.sK);
const ld = { '@context': $q.y, '@graph': [{ '@type': $q.sL, url: canon, name: h1, description: lead, inLanguage: l, dateModified: D.built, isPartOf: { '@type': $q.B, name: $q.C, url: ORIGIN + '/' } }, { '@type': $q.D, itemListElement: [{ '@type': $q.E, position: 1, name: t(l, 'home'), item: ORIGIN + P + '/' }, { '@type': $q.E, position: 2, name: h1, item: canon }] }] };
const html0 = $q.l + dir(l) + $t.k175 + P + '/">' + esc(t(l, 'home')) + $q.sM + esc(h1) + $q.o + esc(h1) + $q.p + esc(lead) + $t.k176 + dir(l) + '>' + CSS + body + $q.cN;
const desc = lead.length > 155 ? lead.slice(0, 152).replace(/\s+\S*$/, '') + '…' : lead;
const html = await N.assemble({ title: h1 + $q.F, desc, canon, body: html0, ld, alt: x => ORIGIN + pre(x) + $q.sJ }, l, await shell(P + $q.G));
return new Response(html, { status: 200, headers: { 'content-type': $q.H, 'cache-control': $q.I, 'content-language': l } });
}
export const _r8u = { progLine, progBlock, mkSection, load, kpBlock, kpMarket, devSection, kpPage, mcPage, recPage, supplyLine, savedBox, IX: () => IX, t, allChanges, chRow, built: () => D && D.built, from: () => TL && TL.days && TL.days[0] && TL.days[0][0] };
