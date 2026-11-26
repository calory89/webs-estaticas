// comments: _notes/kolaboro-worker-comments.txt
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
try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + p)); if (r.ok) v = await r.json(); } catch (e) { v = null; }
if (!v) { try { const r = await fetch(ORIGIN + p, { cf: { cacheTtl: 600 } }); if (r.ok) v = await r.json(); } catch (e) { v = null; } }
MEMO[p] = { t: Date.now(), v }; return v;
}
let T = null, D = null, IX = null, TL = null;
async function load(env) {
if (!T) { T = await file(env, '/data/n37u-i18n.json'); }
const d = await file(env, '/data/n37u.json');
if (d && d !== D) { D = d; MS = null; IX = { bySlug: new Map(d.p.map(r => [r[1], r])), byDev: new Map(), byAr: new Map(), byMk: new Map(), src: 0, regs: 0 }; for (const r of d.p) { (IX.byMk.get(r[3]) || IX.byMk.set(r[3], []).get(r[3])).push(r); for (const c of r[8]) if (c && c[1]) IX.src++; if (r[5]) (IX.byDev.get(r[5]) || IX.byDev.set(r[5], []).get(r[5])).push(r); const a = r[3] + '|' + r[4]; (IX.byAr.get(a) || IX.byAr.set(a, []).get(a)).push(r); } }
if (!TL) TL = await file(env, '/data/n37u-tl.json');
await loadKP(env);
if (D && !IX.regs) { const g = new Set(); for (const k in D.rg) for (const x of D.rg[k]) g.add(x[0] + '|' + x[1]); IX.regs = g.size; }
return !!(T && D);
}
let MS = null;
const slugM = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const mBySlug = s => { if (!MS) { MS = new Map(); for (const k in D.mk) MS.set(slugM(k), k); } return MS.get(s); };
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const t = (l, k) => { const a = T && T[l] && T[l][k]; return a != null ? a : (T && T.en && T.en[k]) || ''; };
const tf = (l, k, v) => (v && (v.n === '1' || v.a === '1') && T && T[l] && T[l][k + '_1'] ? t(l, k + '_1') : t(l, k)).replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m).replace(/(\d\s?г)\.\.(?=\s|$)/g, '$1.');
const nf = (n, l) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { maximumFractionDigits: 1, numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
const fd = (d, l) => { if (!d) return ''; if (!/^\d{4}-\d{2}-\d{2}/.test(d)) return d; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(d.slice(0, 10) + 'T12:00:00Z')); } catch (e) { return d.slice(0, 10); } };
const dir = l => l === 'ar' ? ' dir="rtl"' : '';
const bdi = s => '<bdi>' + esc(s) + '</bdi>';
const host = u => { try { return new URL(u, ORIGIN).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const recU = (l, s) => pre(l) + '/projects/' + s + '/record/';
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
  const body = '<section class="phero"' + dir(l) + '><div class="wrap"><p class="crumb">' + crumbs.map(c => c[1] ? '<a href="' + esc(c[1]) + '">' + esc(c[0]) + '</a>' : esc(c[0])).join(' / ') + '</p><h1>' + esc(o.h1) + '</h1><p class="lead">' + esc(o.lead) + '</p>' +
    '<p class="k-xs">' + esc(tf(l, 'upd', { d: fd(D.built, l) })) + '</p></div></section><div class="wrap n37"' + dir(l) + '>' + CSS + o.body +
    '<p class="k-xs">' + esc(t(l, 'meth')) + ' <a href="' + pre(l) + '/data/how-we-verify/">' + esc(t(l, 'vf_l')) + '</a><span class="n37-dot" aria-hidden="true"> · </span><a href="/data/n37u.json">' + esc(t(l, 'dl')) + '</a><span class="n37-dot" aria-hidden="true"> · </span><a href="/open/n37u-build.py">' + esc(t(l, 'code')) + '</a><span class="n37-dot" aria-hidden="true"> · </span><a href="' + pre(l) + '/registers/">/registers/</a></p></div>';
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebPage', url: canon, name: o.h1, description: o.lead, inLanguage: l, dateModified: D.built || '2026-11-23', isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] ? ORIGIN + c[1] : canon })) }] };
  const desc = o.lead.length > 155 ? o.lead.slice(0, 152).replace(/\s+\S*$/, '') + '…' : o.lead;
  let html = await N.assemble({ title: (o.h1.length > 56 ? o.h1.slice(0, 56).replace(/\s+\S*$/, '') : o.h1) + ' | Kolaboro', desc, canon, body, ld, alt: x => ORIGIN + pre(x) + o.path }, l, await shell(pre(l) + '/how-we-score/'));
  const h = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=900', 'content-language': l };
  if (o.head) html = html.replace('</head>', o.head + '</head>');   // r6u
  if (o.noindex) { html = html.replace('</head>', '<meta name="robots" content="noindex, follow"></head>'); h['x-robots-tag'] = 'noindex, follow'; }
  return new Response(html, { status: 200, headers: h });
}
const DEF = { ho: '/data/dictionary/#f-handover_on_record', pn: '/data/dictionary/#f-permit_number', un: '/data/dictionary/#f-dld_units', pr: '/data/dictionary/#f-price_min', co: '/data/dictionary/#f-registered_company', es: '/data/dictionary/#f-escrow_bank', cp: '/data/dictionary/#f-dld_percent_built', sat: '/satellite/construction-index/', reg: '/registers/', ct: '/courts/' };
const fname = (l, f) => '<a href="' + (f === 'ct' ? '' : pre(l)) + DEF[f] + '" title="' + esc(t(l, 'def_t')) + '">' + esc(t(l, 'f_' + f)) + '</a>';
const ageOf = d => (/^\d{4}-\d{2}-\d{2}/.test(d || '') ? Math.max(0, Math.floor((Date.now() - Date.parse(d.slice(0, 10) + 'T00:00:00Z')) / 86400000)) : null);
const OLD = 180;
const median = a => { const b = a.slice().sort((x, y) => x - y), n = b.length; return n ? (n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2) : 0; };
const badge = (l, k) => '<span class="n37-b ' + k + '">' + esc(t(l, 'k_' + k)) + '</span>';
const regsFor = r => (D.rg[r[3]] || D.rg[(D.co[r[0]] === 'USA' ? 'United States' : D.co[r[0]])] || []);
const relTable = (l, rows) => TB.kbx_n37u__t.k0 + esc(t(l, 'tw_l')) + '"><table><thead><tr><th scope="col">' + esc(t(l, 'th_p')) + '</th><th scope="col">' + esc(t(l, 'th_k')) + '</th></tr></thead><tbody>' +
rows.map(r => '<tr><th scope="row"><a href="' + recU(l, r[1]) + '">' + bdi(r[2]) + '</a></th><td class="n">' + nf(cnt(r), l) + ' / 10</td></tr>').join('') + '</tbody></table></div>';
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
let b = '<h2 id="timeline">' + esc(t(l, 'tl_h')) + '</h2><p>' + esc(tf(l, 'tl_p', { a, b: z })) + '</p>';
if (!ev) b += '<p>' + esc(tf(l, 'tl_none', { b: z })) + '</p>';
else {
b += TB.kbx_n37u__t.k1 + esc(t(l, 'tw_l')) + '"><table><thead><tr><th scope="col">' + esc(t(l, 'th_f')) + '</th><th scope="col">' + esc(t(l, 'tl_d')) + '</th><th scope="col">' + esc(t(l, 'tl_th')) + '</th><th scope="col">' + esc(t(l, 'th_v')) + '</th></tr></thead><tbody>' +
ev.map(x => '<tr><th scope="row">' + fname(l, x.f) + '</th><td class="n">' + esc(fd(x.d, l)) + '</td><td>' + esc(t(l, x.e)) + '</td><td class="n37-v">' + (x.v == null ? '' : bdi(tv(x.v, l))) + '</td></tr>').join('') + '</tbody></table></div>';
const ch = [...new Set(ev.filter(x => x.e === 'tl_e2' || x.e === 'tl_e3').map(x => x.f))].map(f => t(l, 'f_' + f));
b += '<p>' + esc(ch.length ? tf(l, ch.length === 1 ? 'tl_c1' : 'tl_cn', { n: nf(ch.length, l), f: ch.join(', ') }) : t(l, 'tl_c0')) + '</p>';
}
return b + '<p class="k-xs">' + esc(t(l, 'tl_note')) + TB.kbx_n37u__t.k2 + esc(t(l, 'tl_snap')) + TB.kbx_n37u__t.k3 + esc(t(l, 'dl')) + TB.kbx_n37u__t.k4 + esc(t(l, 'code')) + '</a></p>';
}
const TLP = ['ho', 'pr', 'cp', 'un', 'es', 'pn', 'co', 'reg'];
function latestChange(r) {
const ev = tlEvents(r); if (!ev) return null;
const rc = ev.filter(realChange).sort((x, y) => (y.d > x.d ? 1 : y.d < x.d ? -1 : 0) || TLP.indexOf(x.f) - TLP.indexOf(y.f));
return rc.length ? { x: rc[0], n: rc.length } : null;
}
async function recPage(env, shell, l, r) {
const F = D.f, P = pre(l), k = cnt(r), m = D.mk[r[3]];
let b = '<p><a href="' + P + '/projects/' + r[1] + '/">' + esc(t(l, 'back')) + '</a> · <b>' + esc(tf(l, 'held', { k: nf(k, l) })) + '</b> · <a href="/projects/' + r[1] + TB.kbx_n37u__t.k5 + esc(t(l, 'js_l')) + TB.kbx_n37u__t.k6 + P + '/projects/' + r[1] + '/brief/">' + esc(t(l, 'a_br')) + '</a></p>';
b += '<h2 id="fields">' + esc(t(l, 'r_tbl')) + TB.kbx_n37u__t.k7 + esc(t(l, 'tw_l')) + '"><table><thead><tr><th scope="col">' + esc(t(l, 'th_f')) + '</th><th scope="col">' + esc(t(l, 'th_v')) + '</th><th scope="col">' + esc(t(l, 'th_s')) + '</th><th scope="col">' + esc(t(l, 'th_d')) + '</th><th scope="col">' + esc(t(l, 'th_age')) + '</th></tr></thead><tbody>' +
F.map((f, i) => { const c = r[8][i]; if (!c) return '<tr><th scope="row">' + fname(l, f) + '</th><td>' + esc(t(l, 'none')) + '</td><td><span class="n37-b no">' + esc(t(l, 'none')) + '</span></td><td></td><td></td></tr>';
const ag = f === 'ct' ? null : ageOf(c[3]);
const v = f === 'ct' ? nf(c[0], l) : String(c[0]), u = c[1], src = u ? '<a href="' + esc(u) + '"' + (/^https?:/.test(u) ? ' rel="nofollow noopener"' : '') + '>' + esc(/^https?:/.test(u) ? host(u) : u) + '</a>' : '<a href="' + P + '/projects/' + r[1] + '/#sources">' + esc(t(l, 'rec_n')) + '</a>';
return '<tr><th scope="row">' + fname(l, f) + '</th><td class="n37-v">' + bdi(v) + '</td><td>' + badge(l, c[2]) + ' ' + src + '</td><td class="n">' + esc(fd(c[3], l)) + '</td><td class="n n37-age">' + (ag == null ? '' : nf(ag, l) + (ag > OLD ? '<span class="n37-b old">' + esc(t(l, 'age_old')) + '</span>' : '')) + '</td></tr>'; }).join('') + '</tbody></table></div>';
const aged = F.map((f, i) => [f, r[8][i]]).filter(x => x[1] && x[0] !== 'ct' && ageOf(x[1][3]) != null).sort((a, c) => ageOf(c[1][3]) - ageOf(a[1][3]));
if (aged.length) b += '<p id="age">' + esc(ageOf(aged[0][1][3]) > OLD ? tf(l, 'age_sum', { f: t(l, 'f_' + aged[0][0]), d: fd(aged[0][1][3], l) }) : t(l, 'age_ok')) + ' <span class="k-xs">' + esc(t(l, 'age_note')) + '</span></p>';
b += kpBlock(l, r[1], 'kpkt', 'h2');
b += tlSection(l, r);
const miss = F.map((f, i) => [f, i]).filter(x => !r[8][x[1]]), RG = regsFor(r);
b += '<h2 id="unknown">' + esc(tf(l, 'g_h', { k: nf(miss.length, l) })) + '</h2>';
if (!miss.length) b += '<p>' + esc(t(l, 'g_all')) + '</p>';
else b += '<p>' + esc(t(l, 'g_p')) + '</p><ol class="n37-g">' + miss.map(([f]) => { const rr = RG.filter(g => g[2].includes(f));
return '<li><b>' + fname(l, f) + '.</b> ' + esc(t(l, 'ask_' + f)) + (rr.length ? '<ul>' + rr.map(g => '<li>' + esc(t(l, 'g_reg')) + ': ' + (g[1] ? '<a href="' + esc(g[1]) + '" rel="nofollow noopener">' + bdi(g[0]) + '</a>' : bdi(g[0])) + (g[4] ? ' <span class="k-xs">(' + esc(tf(l, 'g_probe', { d: fd(g[4], l) })) + ')</span>' : '') + '</li>').join('') + '</ul>' : (['pn', 'co', 'es', 'reg'].includes(f) ? ' <span class="k-xs">' + esc(tf(l, 'g_noreg', { m: r[3] })) + '</span>' : '')) + '</li>'; }).join('') + '</ol><p><a href="' + P + '/projects/' + r[1] + '/#ask">' + esc(t(l, 'q_link')) + '</a></p>';
if (m) {
const more = D.p.filter(x => x[3] === r[3] && cnt(x) > k).length;
b += '<h2 id="market">' + esc(tf(l, 'm_h', { m: r[3] })) + '</h2><p>' + esc(tf(l, 'm_p', { k: nf(k, l), m: r[3], md: nf(m.med, l), n: nf(m.n, l) }) + ' ' + tf(l, more === 0 ? 'm_r0' : more === 1 ? 'm_r1' : 'm_rn', { r: nf(more, l) })) + TB.kbx_n37u__t.k8 + esc(t(l, 'tw_l')) + '"><table><thead><tr><th scope="col">' + esc(t(l, 'th_f')) + '</th><th scope="col">' + esc(t(l, 'm_th2')) + '</th><th scope="col">' + esc(tf(l, 'm_th3', { m: r[3] })) + '</th></tr></thead><tbody>' +
F.map((f, i) => '<tr><th scope="row">' + fname(l, f) + '</th><td>' + esc(t(l, r[7][i] === '1' ? 'yes' : 'no')) + '</td><td class="n">' + bdi(nf(m.cov[i], l) + '%') + '</td></tr>').join('') + '</tbody></table></div>';
}
const sd = (IX.byDev.get(r[5]) || []).filter(x => x !== r).sort((a, c) => cnt(c) - cnt(a)).slice(0, 12);
if (r[5] && sd.length) b += '<h2 id="developer">' + esc(tf(l, 'd_h', { d: r[6] })) + '</h2>' + relTable(l, sd);
{ const k = r[5] && devTrack(r[5]); if (k) b += '<p><a href="' + pre(l) + '/developers/' + r[5] + '/#n37-track">' + esc(tf(l, 'tr_rec', { d: r[6] || r[5], p: nf(k.p, l), t: nf(k.th.length, l) })) + '</a></p>'; }
const sa = (IX.byAr.get(r[3] + '|' + r[4]) || []).filter(x => x !== r && !sd.includes(x)).sort((a, c) => cnt(c) - cnt(a)).slice(0, 12);
if (r[4] && sa.length) b += '<h2 id="area">' + esc(tf(l, 'a_h', { a: r[4] })) + '</h2>' + relTable(l, sa);
b += await fpBlock(l, r) + n39Links(l);
b += '<p><a href="' + P + '/data/gaps/">' + esc(t(l, 'gp_link')) + TB.kbx_n37u__t.k9 + P + '/data/changes/">' + esc(t(l, 'ch_h1')) + '</a></p>' + devLine(l, r) + buyRow(l, r, 'record');
return page(shell, l, { path: '/projects/' + r[1] + '/record/', h1: tf(l, 'r_h1', { n: r[2] }), lead: t(l, 'r_lead'), body: b, noindex: true, crumb: [[t(l, 'projects'), pre(l) + '/projects/'], [r[2], pre(l) + '/projects/' + r[1] + '/']] });
}
async function gapPage(env, shell, l) {
const F = D.f, P = pre(l), M = Object.entries(D.mk).filter(([, v]) => v.n >= 10).sort((a, b) => b[1].n - a[1].n);
let b = '<h2>' + esc(t(l, 'gp_fields')) + TB.kbx_n37u__t.k10 + esc(t(l, 'tw_l')) + '"><table><thead><tr><th scope="col">' + esc(t(l, 'gp_m')) + '</th><th scope="col">' + esc(t(l, 'gp_n')) + '</th><th scope="col">' + esc(t(l, 'gp_md')) + '</th>' + F.map(f => '<th scope="col">' + fname(l, f) + '</th>').join('') + '</tr></thead><tbody>' +
'<tr><th scope="row">' + esc(tf(l, 'gp_all', { n: nf(D.n, l) })) + '</th><td class="n">' + nf(D.n, l) + '</td><td></td>' + D.known.map(k => '<td class="n">' + bdi(nf(Math.round(100 * k / D.n), l) + '%') + '</td>').join('') + '</tr>' +
M.map(([m, v]) => '<tr><th scope="row">' + bdi(m) + '</th><td class="n">' + nf(v.n, l) + '</td><td class="n">' + nf(v.med, l) + '</td>' + v.cov.map(c => '<td class="n">' + bdi(nf(c, l) + '%') + '</td>').join('') + '</tr>').join('') + TB.kbx_n37u__t.k11 + esc(t(l, 'csv_l')) + TB.kbx_n37u__t.k12 + P + '/data/markets/">' + esc(t(l, 'mc_h1')) + '</a></p>';
const H = Array(11).fill(0); for (const x of D.p) H[cnt(x)]++;
const mx = Math.max.apply(null, H) || 1, five = H.slice(5).reduce((a, c) => a + c, 0), md = median(D.p.map(cnt));
const svg = TB.kbx_n37u__t.k13 + H.map((c, i) => { const h = Math.round(120 * c / mx), x = 8 + i * 39; return '<rect x="' + x + '" y="' + (140 - h) + '" width="30" height="' + h + TB.kbx_n37u__t.k14 + (x + 15) + '" y="' + (134 - h) + '" text-anchor="middle">' + nf(c, l) + '</text><text x="' + (x + 15) + '" y="158" text-anchor="middle">' + i + '</text>'; }).join('') + '</svg>';
b += '<h2 id="dist">' + esc(t(l, 'ds_h')) + '</h2><p id="ds-s">' + esc(tf(l, 'ds_sum', { a: nf(five, l), n: nf(D.n, l), p: nf(Math.round(100 * five / D.n), l), md: nf(md, l), z: nf(H[0], l) })) + '</p>' + svg + '<p class="k-xs">' + esc(t(l, 'ds_p')) + '</p>' +
TB.kbx_n37u__t.k15 + esc(t(l, 'tw_l')) + '"><table><thead><tr><th scope="col">' + esc(t(l, 'ds_th1')) + '</th>' + H.map((c, i) => '<th scope="col" class="n">' + i + '</th>').join('') + TB.kbx_n37u__t.k16 + esc(t(l, 'ds_th2')) + '</th>' + H.map(c => '<td class="n">' + nf(c, l) + '</td>').join('') + '</tr></tbody></table></div>';
b += '<h2>' + esc(t(l, 'gp_reg_h')) + '</h2><p>' + esc(t(l, 'gp_reg_p')) + TB.kbx_n37u__t.k17 + esc(t(l, 'tw_l')) + '"><table><thead><tr><th scope="col">' + esc(t(l, 'gp_m')) + '</th><th scope="col">' + esc(t(l, 'g_reg')) + '</th><th scope="col">' + esc(t(l, 'th_f')) + '</th></tr></thead><tbody>' +
Object.entries(D.rg).map(([m, rs]) => rs.filter(g => g[2].length).map(g => '<tr><th scope="row">' + bdi(m) + '</th><td>' + (g[1] ? '<a href="' + esc(g[1]) + '" rel="nofollow noopener">' + bdi(g[0]) + '</a>' : bdi(g[0])) + '</td><td>' + g[2].map(f => esc(t(l, 'f_' + f))).join(', ') + '</td></tr>').join('')).join('') + '</tbody></table></div>';
b += '<h2>' + esc(t(l, 'gp_thin_h')) + '</h2><p>' + esc(t(l, 'gp_thin_p')) + '</p>' + M.slice(0, 8).map(([m]) => '<h3>' + bdi(m) + '</h3><ul class="n37-rel">' + D.p.filter(x => x[3] === m).sort((a, c) => cnt(a) - cnt(c) || a[0].localeCompare(c[0])).slice(0, 5).map(x => '<li><a href="' + recU(l, x[1]) + '">' + bdi(x[2]) + '</a>&nbsp;<span class="k-xs">' + nf(cnt(x), l) + '/10</span></li>').join('') + '</ul>').join('');
return page(shell, l, { path: '/data/gaps/', h1: t(l, 'gp_h1'), lead: t(l, 'gp_lead'), body: b, crumb: [[t(l, 'data'), pre(l) + '/data/']] });
}
function gapsCsv() {
const F = D.f, q = v => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const L = [TB.kbx_n37u__t.k18 + (D.built || '') + TB.kbx_n37u__t.k19,
['market', 'country', 'projects', 'median_fields_held'].concat(F.map(f => 'pct_' + f)).join(',')];
L.push(['ALL', '', D.n, median(D.p.map(cnt))].concat(D.known.map(k => Math.round(100 * k / D.n))).map(q).join(','));
for (const [m, v] of Object.entries(D.mk).sort((a, b) => b[1].n - a[1].n)) L.push([m, v.co || '', v.n, v.med].concat(v.cov).map(q).join(','));
return new Response(L.join('\n') + '\n', { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'inline; filename="kolaboro-gaps.csv"', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=900' } });
}
function recJson(r) {
return new Response(JSON.stringify(recObj(r), null, 1), { headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=900', 'x-robots-tag': 'noindex' } });
}
const KINDS = ['reg', 'dev', 'portal', 'web', 'sat', 'rec'], DRX = '^\\d{4}-\\d{2}-\\d{2}$', URX = '^https?://';
const nul = s => ({ type: ['string', 'null'], ...s });
function schemas() {
if (IX.sch) return IX.sch;
const F = D.f, reg = { type: 'object', required: ['name', 'url', 'reached_by_our_checker'], additionalProperties: false, properties: { name: { type: 'string', minLength: 1 }, url: nul({ pattern: URX }), reached_by_our_checker: nul({}) } };
const rec = { $schema: TB.kbx_n37u__t.k20, $id: ORIGIN + '/data/record.schema.json', title: TB.kbx_n37u__t.k21, description: TB.kbx_n37u__s.k0, type: 'object',
required: ['id', 'slug', 'name', 'market', 'area', 'developer', 'page', 'record', 'built', 'licence', 'fields_held', 'fields_total', 'kinds', 'facts', 'unknown'], additionalProperties: false,
properties: { id: { type: 'string', minLength: 3 }, slug: { type: 'string', pattern: '^[a-z0-9-]{1,90}$' }, name: { type: 'string', minLength: 1 }, market: { type: 'string', minLength: 2 }, area: nul({}), developer: nul({}), page: { type: 'string', pattern: URX }, record: { type: 'string', pattern: URX }, built: nul({ pattern: DRX }), licence: { type: 'string' },
fields_held: { type: 'integer', minimum: 0, maximum: F.length }, fields_total: { const: F.length }, kinds: { type: 'object', required: KINDS, additionalProperties: false, properties: Object.fromEntries(KINDS.map(k => [k, { type: 'string' }])) },
facts: { type: 'array', maxItems: F.length, items: { type: 'object', required: ['field', 'label', 'value', 'source', 'kind', 'date', 'date_is', 'definition'], additionalProperties: false, properties: { field: { enum: F }, label: { type: 'string', minLength: 1 }, value: { type: ['string', 'number'] }, source: { type: 'string', pattern: URX }, kind: { enum: KINDS }, date: nul({ pattern: DRX }), date_is: { enum: ['read', 'latest case', 'register inspection', 'satellite scene'] }, definition: { type: 'string', pattern: URX } } } },
unknown: { type: 'array', maxItems: F.length, items: { type: 'object', required: ['field', 'label', 'how_to_find', 'registers'], additionalProperties: false, properties: { field: { enum: F }, label: { type: 'string' }, how_to_find: { type: 'string' }, registers: { type: 'array', items: reg } } } },
sha256_facts: { type: 'string', pattern: '^[0-9a-f]{64}$', description: TB.kbx_n37u__t.k22 } } };
const ch = { $schema: TB.kbx_n37u__t.k23, $id: ORIGIN + '/data/changes.schema.json', title: TB.kbx_n37u__t.k24, type: 'object', required: ['built', 'licence', 'rule', 'filters', 'total', 'offset', 'limit', 'changes'],
properties: { built: { type: 'string', pattern: DRX }, licence: { type: 'string' }, rule: { type: 'string' }, copies_from: nul({ pattern: DRX }), total: { type: 'integer', minimum: 0 }, offset: { type: 'integer', minimum: 0 }, limit: { type: 'integer', minimum: 1, maximum: 1000 }, filters: { type: 'object' },
changes: { type: 'array', items: { type: 'object', required: ['date', 'slug', 'project', 'market', 'field', 'from', 'to', 'record'], properties: { date: { type: 'string', pattern: DRX }, slug: { type: 'string', pattern: '^[a-z0-9-]{1,90}$' }, project: { type: 'string' }, market: { type: 'string' }, developer: nul({}), field: { enum: F }, label: { type: 'string' }, from: {}, to: {}, months_moved: { type: ['integer', 'null'] }, record: { type: 'string', pattern: URX }, source_of_current_value: nul({ pattern: URX }) } } } } };
return (IX.sch = { record: rec, changes: ch });
}
const tyOf = v => v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v;
function jsv(s, v, p, out) {
if (out.length > 20) return out;
if (s.type) { const ts = [].concat(s.type), y = tyOf(v); if (!ts.some(x => x === y || (x === 'number' && y === 'integer'))) { out.push(p + ': type ' + y + ', expected ' + ts.join('|')); return out; } }
if ('const' in s && v !== s.const) out.push(p + ': not ' + s.const);
if (s.enum && !s.enum.includes(v)) out.push(p + ': ' + String(v).slice(0, 40) + ' not allowed');
if (typeof v === 'string') { if (s.pattern && !new RegExp(s.pattern).test(v)) out.push(p + ': ' + v.slice(0, 50) + ' does not match ' + s.pattern); if (s.minLength && v.length < s.minLength) out.push(p + ': empty'); }
if (typeof v === 'number') { if (s.minimum != null && v < s.minimum) out.push(p + ': below ' + s.minimum); if (s.maximum != null && v > s.maximum) out.push(p + ': above ' + s.maximum); }
if (Array.isArray(v)) { if (s.maxItems != null && v.length > s.maxItems) out.push(p + ': too many items'); if (s.items) v.forEach((x, i) => jsv(s.items, x, p + '/' + i, out)); }
else if (v && typeof v === 'object') { for (const k of s.required || []) if (!(k in v)) out.push(p + ': ' + k + ' missing'); for (const k in v) { if (s.properties && s.properties[k]) jsv(s.properties[k], v[k], p + '/' + k, out); else if (s.additionalProperties === false) out.push(p + ': ' + k + ' not in schema'); } }
return out;
}
const RULES = ['v_r1', 'v_r2', 'v_r3', 'v_r4', 'v_r5', 'v_r6'];
function validateAll() {
if (IX.val) return IX.val;
const S = schemas().record, bad = [], seenS = new Set(), seenI = new Set(), ho = D.f.indexOf('ho'), cp = D.f.indexOf('cp'), rc = Array(RULES.length).fill(0); let ok = 0;
for (const r of D.p) {
const e = jsv(S, recObj(r), '', []), fx = [];
r[8].forEach((c, i) => { if (!c) return; if (c[3] && /^\d{4}-\d{2}-\d{2}$/.test(c[3]) && (isNaN(Date.parse(c[3] + 'T00:00:00Z')) || (D.f[i] !== 'ct' && c[3] > D.built))) fx.push([0, D.f[i]]); if (c[2] === 'reg' && !c[1]) fx.push([1, D.f[i]]); });
if (r[8][ho] && !/^\d{4}-\d{2}-\d{2}$/.test(String(r[8][ho][0])) && mIdx(String(r[8][ho][0])) == null) fx.push([2, 'ho']);
if (r[8][cp]) { const n = parseFloat(String(r[8][cp][0]).replace(',', '.')); if (!isNaN(n) && (n < 0 || n > 100)) fx.push([3, 'cp']); }
if (seenS.has(r[1]) || seenI.has(r[0])) fx.push([4, '']); seenS.add(r[1]); seenI.add(r[0]);
if (cnt(r) !== r[8].filter(Boolean).length) fx.push([5, '']);
for (const x of fx) rc[x[0]]++;
if (!e.length && !fx.length) ok++; else bad.push([r, e, fx]);
}
return (IX.val = { n: D.p.length, ok, bad, rc });
}
function canon(v) { return Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : v && typeof v === 'object' ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}' : JSON.stringify(v); }
async function sha(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function recJson2(r) { const o = recObj(r); o.sha256_facts = await sha(canon(o.facts)); return new Response(JSON.stringify(o, null, 1), { headers: { ...JH, 'x-robots-tag': 'noindex', link: '<' + ORIGIN + TB.kbx_n37u__t.k25 } }); }
async function fpBlock(l, r) {
const h = await sha(canon(recObj(r).facts));
return '<h2 id="fp">' + esc(t(l, 'fp_h')) + '</h2><p>' + esc(t(l, 'fp_p')) + TB.kbx_n37u__t.k26 + h + TB.kbx_n37u__t.k27 + h + '" data-u="/projects/' + r[1] + '/record.json" data-ok="' + esc(t(l, 'fp_ok')) + '" data-no="' + esc(t(l, 'fp_no')) + TB.kbx_n37u__s.k1 + esc(t(l, 'fp_b')) + TB.kbx_n37u__t.k28 +
'<p class="k-xs">' + esc(t(l, 'fp_n')) + TB.kbx_n37u__t.k29 +
TB.kbx_n37u__s.k2;
}
async function cond(req, r) {   // ETag from the body, 304 when the client already holds it
  const body = await r.text(), et = '"' + (await sha(body)).slice(0, 32) + '"', h = new Headers(r.headers); h.set('etag', et);
  const inm = req.headers.get('if-none-match') || '';
  if (inm.split(',').map(s => s.trim().replace(/^W\//, '')).includes(et)) { h.delete('content-type'); return new Response(null, { status: 304, headers: h }); }
  return new Response(req.method === 'HEAD' ? null : body, { status: r.status, headers: h });
}
const tw39 = (l, th, rows) => TB.kbx_n37u__t.k30 + esc(t(l, 'tw_l')) + '"><table><thead><tr>' + th.map(k => '<th scope="col">' + esc(t(l, k)) + '</th>').join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
const kp39 = (l, a) => '<div class="n39-k">' + a.map(([v, k]) => '<div><b>' + bdi(v) + '</b><span>' + esc(k) + '</span></div>').join('') + '</div>';
const dLnk = (l, f) => '<a href="' + recU(l, f[1]) + '">' + bdi(f[2]) + '</a>';
const csvQ = v => { const s = String(v == null ? '' : v); return /[",\n\r]/.test(s) || /^[=+\-@]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const CSVH = n => ({ 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'inline; filename="' + n + '"', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=900' });
async function validatePage(env, shell, l) {
const v = validateAll(), P = pre(l);
let b = kp39(l, [[nf(v.ok, l) + ' / ' + nf(v.n, l), t(l, 'v_k1')], [nf(v.bad.filter(x => x[1].length).length, l), t(l, 'v_k2')], [nf(v.bad.filter(x => x[2].length).length, l), t(l, 'v_k3')]]);
b += TB.kbx_n37u__t.k31 + esc(tf(l, 'v_badge', { ok: nf(v.ok, l), n: nf(v.n, l) })) + TB.kbx_n37u__t.k32 + esc(t(l, 'v_emb')) + TB.kbx_n37u__t.k33 + ORIGIN + TB.kbx_n37u__t.k34;
b += '<h2>' + esc(t(l, 'v_h2')) + '</h2><p>' + esc(t(l, 'v_p2')) + TB.kbx_n37u__s.k3;
b += '<h2>' + esc(t(l, 'v_h3')) + '</h2>' + tw39(l, ['v_th_r', 'v_th_n'], RULES.map((k, i) => '<tr><td>' + esc(t(l, k)) + '</td><td class="n">' + nf(v.rc[i], l) + '</td></tr>'));
b += '<h2 id="fail">' + esc(tf(l, 'v_h4', { n: nf(v.bad.length, l) })) + '</h2>' + (v.bad.length ? tw39(l, ['th_p', 'v_th_e'], v.bad.slice(0, 200).map(([r, e, fx]) => '<tr><th scope="row">' + dLnk(l, r) + '</th><td>' + e.slice(0, 5).map(x => '<code>' + esc(x) + '</code>').join('<br>') + (e.length && fx.length ? '<br>' : '') + fx.map(x => esc(t(l, RULES[x[0]])) + (x[1] ? ' (' + esc(t(l, 'f_' + x[1])) + ')' : '')).join('<br>') + '</td></tr>')) : '<p>' + esc(t(l, 'v_none')) + '</p>');
b += '<p class="n39-l"><a href="' + P + '/data/query/">' + esc(t(l, 'q_h1')) + '</a>' + TB.kbx_n37u__t.DOT + '<a href="' + P + '/data/duplicates/">' + esc(t(l, 'du_h1')) + '</a>' + TB.kbx_n37u__t.DOT + '<a href="' + P + '/data/sources/">' + esc(t(l, 'so_h1')) + '</a></p>';
return page(shell, l, { path: '/data/validate/', h1: t(l, 'v_h1'), lead: tf(l, 'v_lead', { n: nf(v.n, l) }), body: TB.kbx_n37u__s.N39C + b, crumb: [[t(l, 'data'), P + '/data/']] });
}
function badgeSvg() {
const v = validateAll(), a = 'records valid', bt = v.ok.toLocaleString('en-GB') + ' / ' + v.n.toLocaleString('en-GB'), w1 = 92, w2 = 104, c = v.ok === v.n ? '#1F6B3A' : v.ok / v.n >= 0.99 ? '#6A4C00' : '#9A3412';
const s = TB.kbx_n37u__t.k35 + (w1 + w2) + '" height="20" role="img" aria-label="' + a + ': ' + bt + '"><title>' + a + ': ' + bt + ' (' + D.built + ')</title><rect width="' + w1 + TB.kbx_n37u__t.k36 + w1 + '" width="' + w2 + '" height="20" fill="' + c + TB.kbx_n37u__s.k4 + w1 / 2 + '" y="14">' + a + '</text><text x="' + (w1 + w2 / 2) + '" y="14">' + bt + '</text></g></svg>';
return new Response(s, { headers: { 'content-type': 'image/svg+xml; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=900' } });
}
function qRun(u) {
const g = k => String(u.searchParams.get(k) || '').slice(0, 120).trim(), F = D.f, fl = k => g(k).split(',').map(s => s.trim()).filter(Boolean);
const q = { m: g('m'), dev: g('dev'), has: fl('has'), miss: fl('miss'), kind: g('kind'), min: Math.max(0, Math.min(10, parseInt(g('min'), 10) || 0)), q: g('q').toLowerCase(), sort: g('sort') || 'facts', limit: Math.min(500, Math.max(1, parseInt(g('limit'), 10) || 100)), offset: Math.min(100000, Math.max(0, parseInt(g('offset'), 10) || 0)) };
for (const f of q.has.concat(q.miss)) if (!F.includes(f)) return { err: 'has and miss take fields from: ' + F.join(', ') };
if (q.kind && !KINDS.includes(q.kind)) return { err: 'kind must be one of ' + KINDS.join(', ') };
if (!['facts', 'name', 'reg', 'market'].includes(q.sort)) return { err: TB.kbx_n37u__t.k37 };
const mk = q.m.toLowerCase(), rg = r => r[8].filter(c => c && c[2] === 'reg').length;
let rows = D.p.filter(r => (!mk || r[3].toLowerCase() === mk) && (!q.dev || r[5] === q.dev) && cnt(r) >= q.min && (!q.q || r[2].toLowerCase().includes(q.q)) && q.has.every(f => r[8][F.indexOf(f)]) && q.miss.every(f => !r[8][F.indexOf(f)]) && (!q.kind || r[8].some(c => c && c[2] === q.kind)));
rows.sort(q.sort === 'name' ? (a, b) => a[2].localeCompare(b[2]) : q.sort === 'market' ? (a, b) => a[3].localeCompare(b[3]) || a[2].localeCompare(b[2]) : q.sort === 'reg' ? (a, b) => rg(b) - rg(a) || cnt(b) - cnt(a) || a[2].localeCompare(b[2]) : (a, b) => cnt(b) - cnt(a) || a[2].localeCompare(b[2]));
return { q, rows, rg };
}
const qObj = r => { const o = { id: r[0], slug: r[1], name: r[2], market: r[3], area: r[4] || null, developer: r[6] || null, developer_slug: r[5] || null, fields_held: cnt(r), record: ORIGIN + '/projects/' + r[1] + '/record.json', facts: {} }; D.f.forEach((f, i) => { const c = r[8][i]; if (c) o.facts[f] = { value: c[0], kind: c[2], date: c[3] || null, source: c[1] ? (/^https?:/.test(c[1]) ? c[1] : ORIGIN + c[1]) : null }; }); return o; };
async function queryRoute(env, shell, l, u) {
const x = qRun(u), fmt = u.searchParams.get('format');
if (x.err) return fmt === 'json' || fmt === 'csv' ? new Response(JSON.stringify({ error: x.err }), { status: 400, headers: JH }) : null;
const { q, rows } = x, part = rows.slice(q.offset, q.offset + q.limit), F = D.f;
if (fmt === 'json') return new Response(JSON.stringify({ built: D.built, licence: 'CC BY 4.0, cite Kolaboro', query: q, total: rows.length, offset: q.offset, limit: q.limit, records: part.map(qObj), schema_of_one_record: ORIGIN + '/data/record.schema.json' }, null, 1), { headers: JH });
if (fmt === 'csv') return new Response([TB.kbx_n37u__t.k38 + F.map(f => f + ',' + f + '_kind,' + f + '_date').join(',')].concat(part.map(r => [r[0], r[1], r[2], r[3], r[4], r[6], cnt(r)].concat(...F.map((f, i) => { const c = r[8][i]; return c ? [c[0], c[2], c[3]] : ['', '', '']; })).map(csvQ).join(','))).join('\n') + '\n', { headers: CSVH('kolaboro-query.csv') });
const P = pre(l), sel = (n, v, opts) => '<select name="' + n + '"><option value="">' + esc(t(l, 'q_any')) + '</option>' + opts.map(([a, b]) => '<option value="' + esc(a) + '"' + (a === v ? ' selected' : '') + '>' + esc(b) + '</option>').join('') + '</select>';
const fo = F.map(f => [f, t(l, 'f_' + f)]), qs = u.search.replace(/[?&]format=[^&]*/g, '').replace(/^&/, '?'), api = ORIGIN + '/data/query/' + (qs ? (qs[0] === '?' ? qs : '?' + qs) : '');
let b = TB.kbx_n37u__t.k39 + P + '/data/query/" role="search"><label>' + esc(t(l, 'q_m')) + sel('m', q.m, Object.keys(D.mk).sort().map(m => [m, m])) + '</label><label>' + esc(t(l, 'q_has')) + sel('has', q.has[0] || '', fo) + '</label><label>' + esc(t(l, 'q_miss')) + sel('miss', q.miss[0] || '', fo) + '</label><label>' + esc(t(l, 'q_kind')) + sel('kind', q.kind, KINDS.map(k => [k, t(l, 'k_' + k)])) + '</label><label>' + esc(t(l, 'q_min')) + TB.kbx_n37u__t.k40 + q.min + '" inputmode="numeric"></label><label>' + esc(t(l, 'q_q')) + '<input type="search" name="q" value="' + esc(q.q) + '"></label><label>' + esc(t(l, 'q_sort')) + sel('sort', q.sort, [['facts', t(l, 'q_s_f')], ['reg', t(l, 'q_s_r')], ['name', t(l, 'q_s_n')], ['market', t(l, 'q_m')]]) + '</label><button type="submit">' + esc(t(l, 'q_go')) + '</button></form>';
b += '<p>' + esc(tf(l, 'q_res', { n: nf(rows.length, l), a: nf(Math.min(rows.length, q.offset + 1), l), b: nf(Math.min(rows.length, q.offset + q.limit), l) })) + '</p><p class="n39-u">' + esc(t(l, 'q_api')) + ' <a href="' + esc(api + (api.includes('?') ? '&' : '?') + 'format=json') + '" rel="nofollow">JSON</a> · <a href="' + esc(api + (api.includes('?') ? '&' : '?') + 'format=csv') + '" rel="nofollow">CSV</a><br><code>' + esc(api + (api.includes('?') ? '&' : '?') + 'format=json') + '</code></p>';
b += tw39(l, ['th_p', 'q_m', 'th_k', 'q_s_r'], part.map(r => '<tr><th scope="row">' + dLnk(l, r) + '</th><td>' + bdi(r[3]) + '</td><td class="n">' + nf(cnt(r), l) + ' / 10</td><td class="n">' + nf(x.rg(r), l) + '</td></tr>'));
if (rows.length > q.offset + q.limit) { const nu = new URL(u); nu.searchParams.set('offset', q.offset + q.limit); b += '<p class="n39-l"><a href="' + esc(P + '/data/query/' + nu.search) + '" rel="nofollow">' + esc(t(l, 'q_next')) + '</a></p>'; }
b += '<h2>' + esc(t(l, 'q_doc')) + '</h2><p>' + esc(t(l, 'q_docp')) + TB.kbx_n37u__s.k5 + P + TB.kbx_n37u__s.k6;
const plain = !u.search;
return page(shell, l, { path: '/data/query/', h1: t(l, 'q_h1'), lead: tf(l, 'q_lead', { n: nf(D.n, l) }), body: TB.kbx_n37u__s.N39C + b, noindex: !plain, crumb: [[t(l, 'data'), P + '/data/']] });
}
function ndjson(u) {
const m = String(u.searchParams.get('m') || '').slice(0, 80).trim().toLowerCase(), M = IX.nd || (IX.nd = new Map());
if (!M.has(m)) { if (M.size > 40) M.clear(); M.set(m, (m ? D.p.filter(r => r[3].toLowerCase() === m) : D.p).map(r => JSON.stringify(qObj(r))).join('\n') + '\n'); }
return new Response(M.get(m), { headers: { 'content-type': 'application/x-ndjson; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=900', link: '<' + ORIGIN + '/data/query/>; rel="alternate"' } });
}
function changesCsv(u) {
const g = k => u.searchParams.get(k), q = chFilter({ m: (g('m') || '').slice(0, 80), field: g('field') || '', since: g('since') || '' });
if (q.err) return new Response(q.err + '\n', { status: 400, headers: { 'content-type': 'text/plain; charset=utf-8' } });
const K = ['date', 'slug', 'project', 'market', 'developer', 'field', 'label', 'from', 'to', 'months_moved', 'record', 'source_of_current_value'];
return new Response([TB.kbx_n37u__t.k41 + D.built + TB.kbx_n37u__t.k42 + TB.kbx_n37u__s.CH_RULE, K.join(',')].concat(q.rows.map(x => { const o = chRow(x); return K.map(k => csvQ(o[k])).join(','); })).join('\n') + '\n', { headers: CSVH('kolaboro-changes.csv') });
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
if (u && u.searchParams.get('format') === 'json') return new Response(JSON.stringify({ built: D.built, licence: 'CC BY 4.0, cite Kolaboro', rules: { pn: TB.kbx_n37u__t.k43, nm: TB.kbx_n37u__s.k7, src: TB.kbx_n37u__t.k44 }, note: TB.kbx_n37u__s.k8, total: a.length, pairs: a.map(p => ({ a: p.a[1], b: p.b[1], market: p.a[3], why: p.w.map(w => ({ rule: w[0], value: w[1] })) })) }, null, 1), { headers: JH });
const byR = k => a.filter(p => p.w.some(w => w[0] === k)).length;
let b = kp39(l, [[nf(a.length, l), t(l, 'du_k1')], [nf(byR('pn'), l), t(l, 'du_pn')], [nf(byR('nm'), l), t(l, 'du_nm')], [nf(byR('src'), l), t(l, 'du_src')]]) + '<p>' + esc(t(l, 'du_note')) + '</p>';
b += a.length ? tw39(l, ['du_a', 'du_b', 'q_m', 'du_why'], a.map(p => '<tr><th scope="row">' + dLnk(l, p.a) + '<br><span class="k-xs">' + bdi(p.a[6] || '') + '</span></th><td>' + dLnk(l, p.b) + '<br><span class="k-xs">' + bdi(p.b[6] || '') + '</span></td><td>' + bdi(p.a[3]) + '</td><td>' + p.w.map(w => esc(t(l, 'du_' + w[0])) + TB.kbx_n37u__t.k45 + esc(String(w[1]).slice(0, 120)) + '</bdi>').join('<br>') + '</td></tr>')) : '<p>' + esc(t(l, 'v_none')) + '</p>';
b += TB.kbx_n37u__t.k46 + TB.kbx_n37u__t.DOT + '<a href="' + P + '/data/validate/">' + esc(t(l, 'v_h1')) + '</a>' + TB.kbx_n37u__t.DOT + '<a href="' + P + '/data/query/">' + esc(t(l, 'q_h1')) + '</a></p>';
return page(shell, l, { path: '/data/duplicates/', h1: t(l, 'du_h1'), lead: tf(l, 'du_lead', { n: nf(D.n, l) }), body: TB.kbx_n37u__s.N39C + b, noindex: !!(u && u.search), crumb: [[t(l, 'data'), P + '/data/']] });
}
async function srcSites(env) {
const H = await file(env, '/data/source-health.json'); if (!H || !H.u) return null;
if (IX.src39 && IX.src39.v === H.generated_at) return IX.src39;
const RH = new Set(), hn = x => host(x);
for (const k in D.rg) for (const g of D.rg[k]) if (g[1]) RH.add(hn(g[1]));
for (const r of D.p) for (const c of r[8]) if (c && c[2] === 'reg' && /^https?:/.test(c[1] || '')) RH.add(hn(c[1]));
const S = new Map();
for (const x of H.u) { const h = hn(x[0]); if (!h) continue; const s = S.get(h) || S.set(h, { h, n: 0, ok: 0, c4: 0, c5: 0, e: 0, r: 0, nr: 0, ch: 0, last: '', cites: 0, reg: RH.has(h) }).get(h); s.n++; const st = x[1];
if (typeof st === 'number' && st >= 200 && st < 400) s.ok++; else if (typeof st === 'number' && st >= 400 && st < 500) s.c4++; else if (typeof st === 'number' && st >= 500) s.c5++; else if (st === 'r') s.r++; else if (st === 'n') s.nr++; else s.e++;
if (x[4]) s.ch++; if (x[2] && x[2] > s.last) s.last = x[2]; s.cites += (H.cites[x[0]] || []).length; }
const all = [...S.values()].sort((a, b) => b.n - a.n || a.h.localeCompare(b.h));
return (IX.src39 = { v: H.generated_at, upd: H.updated, n: H.n, all, reg: all.filter(s => s.reg) });
}
async function srcPage(env, shell, l, u) {
const P = pre(l), x = await srcSites(env); if (!x) return null;
if (u && u.searchParams.get('format') === 'json') return new Response(JSON.stringify({ updated: x.upd, licence: 'CC BY 4.0, cite Kolaboro', method: 'Grouped by site from ' + ORIGIN + TB.kbx_n37u__s.k9, sites: x.all.map(s => ({ site: s.h, official_register: s.reg, urls: s.n, live: s.ok, http_4xx: s.c4, http_5xx: s.c5, no_answer: s.e, robots: s.r, not_read: s.nr, text_changed: s.ch, last_read: s.last || null, citations: s.cites })) }, null, 1), { headers: JH });
const row = s => '<tr><th scope="row" style="overflow-wrap:anywhere">' + bdi(s.h) + '</th><td class="n">' + nf(s.n, l) + '</td><td class="n">' + bdi(nf(share(s.ok, s.n - s.r - s.nr || 1), l) + '%') + '</td><td class="n">' + nf(s.c4 + s.c5, l) + '</td><td class="n">' + nf(s.e, l) + '</td><td class="n">' + nf(s.r, l) + '</td><td class="n">' + esc(fd(s.last, l)) + '</td></tr>', TH = ['so_site', 'so_urls', 'so_live', 'so_err', 'so_e', 'so_r', 'so_last'];
const live = x.all.reduce((a, s) => a + s.ok, 0);
let b = kp39(l, [[nf(x.all.length, l), t(l, 'so_k1')], [nf(x.reg.length, l), t(l, 'so_k2')], [nf(x.n, l), t(l, 'so_k3')], [nf(share(live, x.n), l) + '%', t(l, 'so_k4')]]);
b += '<h2 id="registers">' + esc(t(l, 'so_h2')) + '</h2><p>' + esc(t(l, 'so_p2')) + '</p>' + tw39(l, TH, x.reg.map(row));
b += '<h2 id="sites">' + esc(tf(l, 'so_h3', { n: nf(Math.min(80, x.all.length), l) })) + '</h2>' + tw39(l, TH, x.all.slice(0, 80).map(row));
b += '<p class="k-xs">' + esc(t(l, 'so_note')) + TB.kbx_n37u__t.k47 + TB.kbx_n37u__t.DOT + TB.kbx_n37u__t.k48 + TB.kbx_n37u__t.DOT + '<a href="' + P + '/registers/">/registers/</a></p>';
return page(shell, l, { path: '/data/sources/', h1: t(l, 'so_h1'), lead: tf(l, 'so_lead', { d: fd(x.upd, l) }), body: TB.kbx_n37u__s.N39C + b, noindex: !!(u && u.search), crumb: [[t(l, 'data'), P + '/data/']] });
}
const n39Links = l => { const P = pre(l); return TB.kbx_n37u__s.N39C + '<p class="n37-in n39-l"' + dir(l) + '>' + [['validate/', 'v_h1'], ['query/', 'q_h1'], ['duplicates/', 'du_h1'], ['sources/', 'so_h1']].map(([p, k]) => '<a href="' + P + '/data/' + p + '">' + esc(t(l, k)) + '</a>').join(TB.kbx_n37u__t.DOT) + TB.kbx_n37u__t.DOT + TB.kbx_n37u__t.k49 + TB.kbx_n37u__t.DOT + TB.kbx_n37u__t.k50 + TB.kbx_n37u__t.DOT + TB.kbx_n37u__t.k51; };
const CSSL = '<style>' + TAP + '.n37-tw{overflow-x:auto;border:1px solid var(--k-line,#D5DCDB);border-radius:12px;margin:10px 0 18px}.n37 table{width:100%;border-collapse:collapse;font-size:.93rem}.n37 th,.n37 td{padding:8px 12px;border-bottom:1px solid var(--k-line,#D5DCDB);text-align:start;vertical-align:top}.n37 td.n{font-variant-numeric:tabular-nums;white-space:nowrap}.n37 tbody th a{color:inherit;text-decoration-style:dotted}.n37-rel{display:flex;flex-wrap:wrap;gap:4px 18px;list-style:none;padding:0}.n37-rel a{display:inline-flex;align-items:center;min-height:44px}.n37 .k-xs{font-size:.9rem}</style>';
const KIND = { reg: 'r', dev: 'd', portal: 'w', web: 'w', sat: 'o', rec: 'o' };
const share = (a, n) => n ? Math.round(100 * a / n) : 0;
function factCounts(rows) {
const F = D.f, h = F.map(() => 0), g = F.map(() => 0), k = { r: 0, d: 0, w: 0, o: 0 }; let all = 0;
for (const r of rows) r[8].forEach((c, i) => { if (!c) return; h[i]++; all++; if (c[2] === 'reg') g[i]++; k[KIND[c[2]] || 'o']++; });
return { h, g, k, all };
}
const recList = (l, rows) => '<ul class="n37-rel">' + rows.map(x => '<li><a href="' + recU(l, x[1]) + '">' + bdi(x[2]) + '</a>&nbsp;<span class="k-xs">' + nf(cnt(x), l) + '/10</span></li>').join('') + '</ul>';
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
const tile = (h, v, sub, w) => '<div class="d40-t' + (w ? ' d9-w' : '') + '"><p class="d40-l">' + esc(h) + '</p><p class="d40-v">' + v + '</p><p class="d40-s">' + sub + '</p></div>';
return TB.kbx_n37u__s.k10 + dir(l) + TB.kbx_n37u__t.k52 + esc(tf(l, 'd40_h', { m: mkName(m, l) })) + '</h2>' + (kk && l !== 'en' && kk.med != null ? '<p class="d9-sc"><b>' + bdi(nf(kk.med, l)) + '</b><span>/100</span> ' + esc(kk.ml) + '</p>' : '') + '<div class="d40-g">' +
(kk ? tile(t(l, 'd40_pl'), pc(pn, n), esc(tf(l, 'd40_ps', { a: nf(pn, l), n: nf(n, l) })) + '<br>' + esc(tf(l, 'd9_rg', { p: share(rg, n) + '%' }))) +
tile(t(l, 'd9_mvl'), bdi(nf(kk.mv, l)), esc(tf(l, 'd9_mvs', { h: nf(kk.h, l) })), 1) + tile(t(l, 'd9_ovl'), bdi(nf(kk.ov, l)), esc(t(l, 'd9_ovs')) + (kk.od ? ' <a href="' + pre(l) + kk.od + '">' + esc(t(l, 'd9_ovk')) + '</a>' : ''), 1) :
tile(t(l, 'd40_dl'), pc(past, dated), esc(tf(l, 'd40_ds', { a: nf(past, l), n: nf(dated, l) }))) +
tile(t(l, 'd40_pl'), pc(pn, n), esc(tf(l, 'd40_ps', { a: nf(pn, l), n: nf(n, l) }))) +
tile(t(l, 'd40_rl'), pc(rg, n), esc(tf(l, 'd40_rs', { a: nf(rg, l), n: nf(n, l) })))) +
'<div class="d40-t"><p class="d40-l">' + esc(t(l, 'd40_hl')) + '</p><p class="d40-v">' + bdi(nf(fut, l)) + '</p><ul class="d40-b">' + keys.map(x => { const v = yr.get(x) || 0; return '<li><span>' + esc(x === 'l' ? t(l, 'd40_later') : x) + '</span><i style="width:' + Math.max(v ? 3 : 0, Math.round(100 * v / mx)) + '%" aria-hidden="true"></i><span>' + nf(v, l) + '</span></li>'; }).join('') + '</ul><p class="d40-s">' + esc(tf(l, 'd40_hs', { n: nf(fut, l) })) + '</p></div>' +
'</div><p class="d40-f">' + esc(tf(l, 'd40_ft', { n: nf(n, l), d: fd(D.built, l) })) + TB.kbx_n37u__t.k53 + pre(l) + '/data/dictionary/">' + esc(t(l, 'd40_dic')) + '</a></p></section>';
}
function mkSection(l, m) {
const k = l + '|' + m; if (!IX.mkm) IX.mkm = new Map(); if (!IX.mkm.has(k)) IX.mkm.set(k, mkSection0(l, m)); return IX.mkm.get(k);
}
function mkSection0(l, m) {
const rows = IX.byMk.get(m) || []; if (rows.length < 3) return '';
const F = D.f, c = factCounts(rows), byK = rows.slice().sort((a, b) => cnt(b) - cnt(a) || a[2].localeCompare(b[2]));
let b = TB.kbx_n37u__t.k54 + dir(l) + '>' + (l === 'en' ? '' : CSSL) + '<h2>' + esc(tf(l, 'mk_h', { m: mkName(m, l) })) + '</h2><p>' + esc(tf(l, 'mk_p', { n: nf(rows.length, l), m: mkName(m, l) })) + '</p>' +
TB.kbx_n37u__t.k55 + esc(t(l, 'tw_l')) + '"><table><thead><tr><th scope="col">' + esc(t(l, 'th_f')) + '</th><th scope="col">' + esc(t(l, 'th_hold')) + '</th><th scope="col">' + esc(t(l, 'th_here')) + '</th><th scope="col">' + esc(t(l, 'th_all')) + '</th></tr></thead><tbody>' +
F.map((f, i) => '<tr><th scope="row">' + fname(l, f).replace(/ title="[^"]*"/, '') + '</th><td class="n">' + nf(c.h[i], l) + ' / ' + nf(rows.length, l) + '</td><td class="n">' + bdi(nf(share(c.h[i], rows.length), l) + '%') + '</td><td class="n">' + bdi(nf(share(D.known[i], D.n), l) + '%') + '</td></tr>').join('') + '</tbody></table></div>' +
'<p>' + esc(tf(l, 'mk_src', { k: nf(c.all, l), r: nf(c.k.r, l), d: nf(c.k.d, l), w: nf(c.k.w, l), o: nf(c.k.o, l) })) + '</p>' +
'<h3>' + esc(t(l, 'mk_best')) + '</h3>' + recList(l, byK.slice(0, 5)) + '<h3>' + esc(t(l, 'mk_thin')) + '</h3>' + recList(l, byK.slice(-5).reverse()) +
'<p><a href="' + pre(l) + '/data/gaps/">' + esc(t(l, 'gp_link')) + TB.kbx_n37u__t.k56 + pre(l) + '/data/changes/week/#mk-' + slugM(m) + '">' + esc(t(l, 'wk_h1')) + '</a>' + TB.kbx_n37u__t.DOT + '<a href="' + n38u(l, 'markets/' + slugM(m) + '/') + '">' + esc(t(l, 'ms_l')) + '</a>' + (pipe(m).d >= 10 ? TB.kbx_n37u__t.DOT + '<a href="' + n38u(l, 'pipeline/') + '?m=' + encodeURIComponent(m) + '#m" rel="nofollow">' + esc(t(l, 'pl_h1')) + '</a>' : '') + TB.kbx_n37u__t.DOT + '<a href="' + n38u(l, 'delays/') + '#mk-' + slugM(m) + '">' + esc(t(l, 'dl_h1')) + '</a></p></section>';
return b;
}
function devSection(l, slug) {
const rows = IX.byDev.get(slug) || []; if (!rows.length) return '';
const F = D.f, c = factCounts(rows), name = rows[0][6] || slug, thin = rows.slice().sort((a, b) => cnt(a) - cnt(b) || a[2].localeCompare(b[2])).slice(0, 8);
return '<div class="n37" id="n37-dev"' + dir(l) + '>' + CSSL + trackSection(l, slug) + '<h3>' + esc(t(l, 'dv_h')) + '</h3><p>' + esc(tf(l, 'dv_p', { n: nf(rows.length, l), d: name })) + '</p>' +
TB.kbx_n37u__t.k57 + esc(t(l, 'tw_l')) + '"><table><thead><tr><th scope="col">' + esc(t(l, 'th_f')) + '</th><th scope="col">' + esc(t(l, 'th_hold')) + '</th><th scope="col">' + esc(t(l, 'th_regs')) + '</th></tr></thead><tbody>' +
F.map((f, i) => '<tr><th scope="row">' + fname(l, f) + '</th><td class="n">' + nf(c.h[i], l) + ' / ' + nf(rows.length, l) + '</td><td class="n">' + nf(c.g[i], l) + '</td></tr>').join('') + '</tbody></table></div>' +
'<h3>' + esc(t(l, 'dv_list')) + '</h3>' + recList(l, thin) + devReg(l, slug) + '</div>';
}
function peers(l, slug) {
const rows = IX.byDev.get(slug) || []; if (!rows.length) return ''; const c = new Map(); for (const r of rows) c.set(r[3], (c.get(r[3]) || 0) + 1);
const mk = [...c.entries()].sort((a, b) => b[1] - a[1])[0][0], n = new Map(), co = D.co[rows[0][0]], add = R => { for (const r of R || []) if (r[5] && r[5] !== slug) { const o = n.get(r[5]) || { s: r[5], d: r[6] || r[5], k: 0 }; o.k++; n.set(r[5], o); } }; add(IX.byMk.get(mk)); let lab = mkName(mk, l), hk = 'pe_h';
if (!n.size && co) { for (const [m, R] of IX.byMk) if (D.co[R[0][0]] === co) add(R); lab = coName(co, l); hk = 'pe_hc'; }   // n40 k38: only developer in its market: the country's
const A = [...n.values()].sort((a, b) => b.k - a.k || a.d.localeCompare(b.d)), L = A.slice(0, 6), S = A.concat({ s: slug, d: rows[0][6] || slug }).sort((a, b) => a.d.localeCompare(b.d) || a.s.localeCompare(b.s)), i = S.findIndex(o => o.s === slug); if (!A.length) return '';
for (const o of [S[(i + S.length - 1) % S.length], S[(i + 1) % S.length]].concat(A.slice(6))) if (L.length < 8 && o.s !== slug && !L.includes(o)) L.push(o);   // n40 k38: plus the two alphabetical neighbours
return '<div class="n37" id="n40-peers"' + dir(l) + '><h3>' + esc(tf(l, hk, { m: lab })) + '</h3>' + peUl(l, L) + '</div>';
}
const peUl = (l, L) => '<ul class="n40-pe">' + L.map(o => '<li><a href="' + pre(l) + '/developers/' + o.s + '/">' + bdi(o.d) + '</a> <small>' + esc(tf(l, 'pe_n', { n: nf(o.k, l) })) + '</small></li>').join('') + '</ul>';
function devBlock(l, m) {   // n40 k38: market pages list the developers active there, most projects first
const n = new Map(); for (const r of IX.byMk.get(m) || []) if (r[5]) { const o = n.get(r[5]) || { s: r[5], d: r[6] || r[5], k: 0 }; o.k++; n.set(r[5], o); }
const L = [...n.values()].sort((a, b) => b.k - a.k || a.d.localeCompare(b.d)).slice(0, 16); return L.length ? '<section id="n40-devs"' + dir(l) + '><h2>' + esc(tf(l, 'k38_dh', { m: mkName(m, l) })) + '</h2>' + peUl(l, L) + '</section>' : '';
}
let CGM = null;
function cgBox(l, p) {
const mm = T && T.cg26 && /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?m\/([a-z0-9-]{2,80})\/$/.exec(p);
if (mm && !CGM) { CGM = new Map(); for (const k in T.cg26) for (const x of T.cg26[k].m) if (!CGM.has(x[0])) CGM.set(x[0], k); }
const m = mm ? (CGM.get(mm[1]) ? [p, CGM.get(mm[1]), ''] : null) : /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?countries\/([a-z0-9-]{2,60})\/(?:(how-to-check|is-it-safe|buyer-protection-law)\/)?$/.exec(p); if (!m || !T.cg26) return '';
const c = T.cg26[m[1]]; if (!c || (mm && l === 'en' && c.m.length < 2)) return ''; const cur = mm ? -1 : ['', 'how-to-check', 'is-it-safe', 'buyer-protection-law'].indexOf(m[2] || ''), bl = c.p[l] || 0, be = c.p.en || 0, en = ' <small>' + esc(t(l, 'cg_en')) + '</small>';
if (cur >= 0 && !(bl & (1 << cur))) return '';
const A = [];
['', 'how-to-check/', 'is-it-safe/', 'buyer-protection-law/'].forEach((s, i) => { if (i === cur) return; const lab = esc(t(l, 'cg_' + i));
if (bl & (1 << i)) A.push('<a href="' + pre(l) + '/countries/' + m[1] + '/' + s + '">' + lab + '</a>'); else if (l !== 'en' && (be & (1 << i))) A.push('<a href="/countries/' + m[1] + '/' + s + '" hreflang="en">' + lab + '</a>' + en); });
for (const [s, n, loc] of c.m) if (!mm || s !== mm[1]) A.push(l === 'en' || loc ? '<a href="' + pre(l) + '/m/' + s + '/">' + esc(tf(l, 'cg_m', { m: mkName(n, l) })) + '</a>' : '<a href="/m/' + s + '/" hreflang="en">' + esc(tf(l, 'cg_m', { m: mkName(n, l) })) + '</a>' + en);
if (A.length < 2) return '';
return TB.kbx_n37u__t.k58 + dir(l) + TB.kbx_n37u__s.k11 + esc(t(l, 'cg_h')) + TB.kbx_n37u__t.k59 + A.map(a => '<li>' + a + '</li>').join('') + '</ul></div></nav>';
}
function lateBox(l, nc) {
const S = {}; for (const k of TB.kbx_n37u__t.o_LT41) S[k] = t(l, 'lt_' + k + '41'); S.pre = pre(l); S.loc = LOC[l] || 'en-GB';
return TB.kbx_n37u__t.k60 + dir(l) + TB.kbx_n37u__t.k61 + esc(S.h) + '</h2><p>' + esc(S.p) + TB.kbx_n37u__t.k62 + esc(S.l) + TB.kbx_n37u__s.k12 + esc(S.b) + TB.kbx_n37u__t.k63 +
TB.kbx_n37u__t.k64 + JSON.stringify(S).replace(/</g, '\\u003c') + TB.kbx_n37u__t.k65 + (nc ? ' nonce="' + nc + '"' : '') + '></script>' +
TB.kbx_n37u__s.k13;
}
function chBox(l) {
const L = (T && T.ch20) || [], cg = (T && T.cg26) || {}, cn = c => { try { return coName(c, l) || c; } catch (e) { return c; } };
const A = L.map(([s, n]) => { const ok = l === 'en' || ((cg[s] && cg[s].p && cg[s].p[l]) || 0) & 1; return '<li><a href="' + (ok ? pre(l) : '') + '/countries/' + s + '/"' + (ok ? '' : ' hreflang="en"') + '>' + esc(cn(n)) + '</a></li>'; });
if (A.length < 5) return '';
return TB.kbx_n37u__t.k66 + dir(l) + TB.kbx_n37u__s.k14 + esc(t(l, 'ch_h')) + '</h2><p>' + esc(t(l, 'ch_p')) + '</p><ul>' + A.join('') + '</ul><p><a href="' + pre(l) + '/countries/">' + esc(t(l, 'ch_a')) + '</a></p></section>';
}
export async function foot(u, env, r) {
const l = (/^\/(es|de|fr|nl|ru|zh|ar)\//.exec(u.pathname) || [])[1] || 'en'; if (!T) T = await file(env, '/data/n37u-i18n.json'); if (!T) return r;
const zh = l === 'zh' ? TB.kbx_n37u__s.k15 : '';
const nc = ((r.headers.get('content-security-policy') || '').match(/'nonce-([^']+)'/) || [])[1], fl = '<script src="/k/fl.js?v=n40k2b" defer' + (nc ? ' nonce="' + nc + '"' : '') + '></script>';
const lt = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:check\/)?$/.test(u.pathname) ? lateBox(l, nc) : '', ltSel = /check\/$/.test(u.pathname) ? '#analyze' : '#hp-band';
return new HTMLRewriter().on('head', { element(e) { if (zh) e.append(zh, { html: true }); } }).on('body', { element(e) { e.append(fl, { html: true }); } }).on(ltSel, { element(e) { if (lt) e.after(lt, { html: true }); } })
.on('#n40-meth', { element(e) { e.remove(); } })
.on('main', { element(e) { const cg = cgBox(l, u.pathname); if (cg) e.append(cg, { html: true }); if (/^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?$/.test(u.pathname)) { const ch = chBox(l); if (ch) e.append(ch, { html: true }); } if (/^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?rankings\//.test(u.pathname)) e.append('<section class="wrap" id="n40-meth"' + dir(l) + TB.kbx_n37u__s.k16 + esc(t(l, 'mt_h')) + '</h2><p style="margin:0">' + esc(t(l, 'mt_p')) + ' <a href="' + pre(l) + '/how-we-score/">' + esc(t(l, 'mt_a')) + '</a></p></div></section>', { html: true }); } }).transform(r);
}
let STATS = null;
async function stats(env) {
  if (STATS && Date.now() - STATS.t < 600000) return STATS.v;
  let v = null;
  try { const kb = await import('./kolaboro.js'); const u = new URL(ORIGIN + '/api/open/stats'); const r = await kb.open(new Request(u), u, env); if (r && r.ok) { const j = await r.json(); if (j && j.projects) v = j; } } catch (e) { v = null; }
  STATS = { t: Date.now(), v }; return v;
}
async function liveLine(l, env) {
const s = await stats(env); if (!s) return '';
const tx = tf(l, 'live_p', { p: '\u0001projects\u0002' + nf(s.projects, l) + '\u0003', s: '\u0001sources\u0002' + nf(s.sources, l) + '\u0003', g: nf(IX.regs, l), f: nf(IX.src, l) });
return TB.kbx_n37u__s.k17 + dir(l) + '>' +
esc(tx).replace(/\u0001(\w+)\u0002([^\u0003]*)\u0003/g, (m, k, v) => '<b data-db="' + k + '">' + v + '</b>') + ' <a href="' + pre(l) + '/data/gaps/">' + esc(t(l, 'live_l')) + '</a></p>';
}
async function homeBits(l, env) {
const s = await stats(env); if (!s) return null;
const g = progStats(), P = pre(l), b = v => '<b>' + v + '</b>';
const proof = '<p class="hp-proof" id="n37-live"' + dir(l) + '><i aria-hidden="true"></i><span>' + esc(tf(l, 'hp_proof', { p: nf(s.projects, l), m: nf(s.markets, l), g: nf(IX.regs, l), d: fd(g.built, l) })) + '</span></p>';
const tile = (h, n, lab) => '<li><a class="hp-t" href="' + h + '">' + b(n) + '<span>' + esc(lab) + '</span></a></li>';
const band = '<h2 class="hp-h"' + dir(l) + '>' + esc(t(l, 'hp_h')) + '</h2><ul class="hp-stats"' + dir(l) + '>' +
tile(P + '/projects/', nf(s.projects, l), tf(l, 'hp_t1', { m: nf(s.markets, l), c: nf(s.countries, l) })) +
tile('/registers/', nf(IX.regs, l), t(l, 'hp_t2')) +
tile(P + '/data/how-we-verify/', pct1(g.conf, g.tot, l), tf(l, 'hp_t3', { n: nf(g.tot, l) })) +
tile(P + '/data/changes/week/', nf(g.w, l), t(l, 'hp_t4')) + '</ul>' +
'<p class="hp-foot"' + dir(l) + '>' + esc(tf(l, 'hp_foot', { s: nf(s.sources, l), f: nf(IX.src, l) })) + ' <a href="' + P + '/data/gaps/">' + esc(t(l, 'live_l')) + '</a>' + TB.kbx_n37u__t.DOT + '<a href="' + P + '/data/how-we-verify/">' + esc(t(l, 'vf_l')) + '</a></p>';
return [proof, band];
}
const sz = (b, l) => b >= 1048576 ? nf(Math.round(b / 104857.6) / 10, l) + ' MB' : nf(Math.max(1, Math.round(b / 1024)), l) + ' KB';
async function dataHub(env, shell, l) {
const C = await file(env, '/data/catalog.json'), by = new Map(((C && C.datasets) || []).map(x => [x.id, x]));
let b = '<h2>' + esc(t(l, 'dh_main')) + TB.kbx_n37u__t.k67 + esc(t(l, 'tw_l')) + '"><table><thead><tr><th scope="col">' + esc(t(l, 'dh_main')) + '</th><th scope="col">' + esc(t(l, 'dh_fmt')) + '</th><th scope="col">' + esc(t(l, 'dh_rows')) + '</th><th scope="col">' + esc(t(l, 'dh_size')) + '</th><th scope="col">' + esc(t(l, 'dh_upd')) + TB.kbx_n37u__t.k68;
for (const [k, id, url, fmt] of TB.kbx_n37u__t.o_DS) {
const x = id ? by.get(id) : null; if (id && !x) continue;
const href = x ? x.url.replace(ORIGIN, '') : url, f = x ? String(x.format || '').toUpperCase() : fmt;
b += '<tr><th scope="row"><a href="' + esc(href) + '" download>' + esc(t(l, k + '_t')) + '</a><br><span class="k-xs">' + esc(t(l, k + '_d')) + '</span></th><td>' + bdi(f) + '</td><td class="n">' + (x && typeof x.rows === 'number' ? nf(x.rows, l) : url === '/data/n37u.json' ? nf(D.n, l) : '') + '</td><td class="n">' + (x && x.bytes ? sz(x.bytes, l) : '') + '</td><td class="n">' +
(x ? fd(String(x.last_updated || (x.freshness || {}).stamp || ''), l) : esc(t(l, 'dh_live'))) + '</td><td class="n">' + (x && x.sha256 ? '<code title="' + esc(x.sha256) + '">' + esc(x.sha256.slice(0, 12)) + '…</code>' : '') + '</td></tr>';
}
b += '</tbody></table></div>';
if (C) b += '<p class="k-xs">' + esc(tf(l, 'dh_asof', { d: fd(String((C.refreshed && C.refreshed.at) || C.generated_at || ''), l) })) + '</p><p><a href="/data/">' + esc(tf(l, 'dh_cat', { n: nf((C.summary || {}).datasets || by.size, l), f: nf((C.summary || {}).files || by.size, l) })) + '</a></p>';
b += '<h2>' + esc(t(l, 'dh_q')) + '</h2><ul class="n37-g"><li><a href="' + pre(l) + '/data/dictionary/">' + esc(t(l, 'dh_q1')) + '</a></li><li><a href="' + pre(l) + '/data/gaps/">' + esc(t(l, 'gp_link')) + '</a></li><li><a href="' + pre(l) + '/registers/">' + esc(t(l, 'dh_q2')) + '</a></li><li><a href="/docs/api/">' + esc(t(l, 'dh_q3')) + '</a></li></ul><p>' + esc(t(l, 'dh_lic')) + '</p>';
return page(shell, l, { path: '/data/', h1: t(l, 'dh_h1'), lead: t(l, 'dh_lead'), body: b });
}
const EG = [['eg_status', '/engineering/status/'], ['eg_rel', '/engineering/reliability/'], ['eg_pw', '/engineering/page-weight/'], ['eg_speed', '/engineering/speed/'], ['eg_seo', '/engineering/seo/'], ['eg_vt', '/engineering/visual-tests/'], ['eg_tl', '/engineering/transparency-log/'], ['eg_sp', '/engineering/signed-photos/']];
async function hubPage(env, shell, l, k) {
let b = '', o;
if (k === 'engineering') {
b = shipped(l).replaceAll('<section class="wrap"', '<section') + '<h2>' + esc(t(l, 'eg_pages')) + '</h2><ul class="n37-g">' + EG.map(x => '<li><a href="' + x[1] + '" hreflang="en">' + esc(t(l, x[0])) + '</a></li>').join('') + TB.kbx_n37u__t.k69 + esc(t(l, 'eg_full')) + '</a></p>';
o = { h1: t(l, 'eg_h1'), lead: t(l, 'eg_lead') };
} else if (k === 'yc') {
const s = await stats(env) || {};
b = '<h2>' + esc(t(l, 'yc_pb_h')) + '</h2><p>' + esc(t(l, 'yc_pb')) + '</p><h2>' + esc(t(l, 'yc_do_h')) + '</h2><p>' + esc(t(l, 'yc_do')) + '</p>';
if (s.projects) b += '<h2>' + esc(t(l, 'yc_dt_h')) + '</h2><p>' + esc(tf(l, 'yc_dt', { p: nf(s.projects, l), m: nf(s.markets, l), c: nf(s.countries, l), s: nf(s.sources, l), cl: nf(s.claims_total || 0, l), x: nf((s.claims || {}).contradicted || 0, l), g: nf(IX.regs, l), f: nf(IX.src, l) })) + '</p>';
b += '<p>' + esc(t(l, 'yc_tr')) + '</p>' + shipped(l).replaceAll('<section class="wrap"', '<section') + '<p><a href="/yc/" hreflang="en">' + esc(t(l, 'yc_full')) + TB.kbx_n37u__t.k70 + pre(l) + '/engineering/">' + esc(t(l, 'eg_h1')) + TB.kbx_n37u__t.k71 + pre(l) + '/data/">' + esc(t(l, 'dh_h1')) + '</a></p>';
o = { h1: t(l, 'yc_h1'), lead: t(l, 'yc_lead') };
} else {
b = TB.kbx_n37u__t.k72 + esc(t(l, 'dp_req')) + '</b></a></p><p>' + esc(t(l, 'dp_rep')) + TB.kbx_n37u__t.k73 +
'<h2>' + esc(t(l, 'dp_how')) + '</h2><ol class="n37-g">' + ['dp_s1', 'dp_s2', 'dp_s3', 'dp_s4', 'dp_s5'].map(x => '<li>' + esc(t(l, x)) + '</li>').join('') + '</ol>' +
'<h2>' + esc(t(l, 'dp_cost_h')) + '</h2><p>' + esc(t(l, 'dp_cost')) + '</p><h2>' + esc(t(l, 'dp_bd_h')) + '</h2><p>' + esc(t(l, 'dp_bd')) + '</p>' +
'<p>' + esc(tf(l, 'dp_n', { d: nf(IX.byDev.size, l) })) + ' <a href="' + pre(l) + TB.kbx_n37u__t.k74 + esc(t(l, 's13_t')) + TB.kbx_n37u__t.k75 + esc(t(l, 'dp_req')) + '</a></p>';
o = { h1: t(l, 'dp_h1'), lead: t(l, 'dp_lead') };
}
return page(shell, l, Object.assign(o, { path: '/' + k + '/', body: b }));
}
async function slugsJson(env, ms) {
const ix = await N.data(env), o = {};
const nm = {}; for (const [id, x] of ix.byId) if (x.s && x.mk && encodeURIComponent(String(x.mk).toLowerCase().replace(/\s+/g, '-')) === ms) { o[id] = x.s; if (x.n) nm[id] = [x.n, x.dv || '']; } o._n = nm;   // n40 d9: names and developers for the market list rows
return new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=600', 'access-control-allow-origin': '*' } });
}
export async function errPage(u) {
const m = /^\/(es|de|fr|nl|ru|zh|ar)\//.exec(u.pathname), l = m ? m[1] : 'en';
const g = k => (T && T[l] && T[l][k]) || ({ err_h: 'This page did not load', err_p: 'Our server could not build it just now. It usually works again within seconds.', err_a: 'Try again', home: 'Home' })[k];
const html = '<!doctype html><html lang="' + l + '"' + dir(l) + '><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>' + esc(g('err_h')) + ' | Kolaboro</title>' +
'<style>body{margin:0;font:16px/1.6 system-ui,sans-serif;background:#F6F4EF;color:#17212B}main{max-width:560px;margin:12vh auto;padding:0 16px}a{color:#155C75;font-weight:700}@media (prefers-color-scheme:dark){body{background:#11181F;color:#E8ECEF}a{color:#7CC7E0}}</style></head>' +
'<body><main><h1>' + esc(g('err_h')) + '</h1><p>' + esc(g('err_p')) + '</p><p><a href="' + esc(u.pathname) + '">' + esc(g('err_a')) + '</a><span class="n37-dot" aria-hidden="true"> · </span><a href="' + pre(l) + '/">' + esc(g('home')) + '</a><span class="n37-dot" aria-hidden="true"> · </span><a href="/engineering/status/">/engineering/status/</a></p></main></body></html>';
return new Response(html, { status: 503, headers: { 'content-type': 'text/html; charset=utf-8', 'retry-after': '5', 'cache-control': 'no-store', 'x-kb-fallback': '1' } });
}
const VG = { reg: 'r', sat: 'r', dev: 'c', portal: 'c', web: 'c', rec: 'c' };
function vsGroups(r) { const g = { r: [], c: [], u: [] }; D.f.forEach((f, i) => { const c = r[8][i]; g[c ? (VG[c[2]] || 'c') : 'u'].push(f); }); return g; }
const VSC = '<style>' + TAP + '.n37-vs{margin:14px 0 0;padding:12px 16px;border:1px solid var(--k-line,var(--line,#D5DCDB));border-radius:14px;line-height:1.5}.n37-vs ul{list-style:none;padding:0;margin:6px 0 0}.n37-vs li{margin:6px 0;padding:2px 0;padding-inline-start:12px;border-inline-start:4px solid #56636F}.n37-vs li.n37-vr{border-color:#1F6B3A}.n37-vs li.n37-vc{border-color:#B7791F}.n37-vs li.n37-vu{border-color:#9A3412}.n37-vs li>b{font-variant-numeric:tabular-nums}.n37-vs li{padding-block:4px}.n37-vt{margin:0;display:flex;flex-wrap:wrap;align-items:baseline;gap:0 8px}.n37-vn{font-size:.85rem;font-variant-numeric:tabular-nums;color:var(--k-muted,#56636F)}.n37-vd{margin:0}.n37-vs ul.n37-tg{display:flex;flex-wrap:wrap;gap:4px 6px;margin:4px 0 2px}.n37-vs .n37-tg li{margin:0;padding:1px 8px;border:1px solid var(--k-line,#D5DCDB);border-radius:999px;font-size:.85rem;line-height:1.5}.n37-vb{display:flex;gap:3px;margin:8px 0 2px;max-width:320px}.n37-vb i{flex:1;height:8px;border-radius:2px;background:#9A3412}.n37-vb i.n37-br{background:#1F6B3A}.n37-vb i.n37-bc{background:#B7791F}@media print{.n37-vb i{print-color-adjust:exact;-webkit-print-color-adjust:exact}}.n37-act{margin:8px 0 0}.n37-act ul{display:flex;flex-wrap:wrap;gap:0 18px;list-style:none;padding:0;margin:0}.n37-act li{margin:0;padding:0;border:0}.n37-act a{display:inline-flex;align-items:center;min-height:44px;font-weight:600}.n37-vs a:focus-visible,.n37-act a:focus-visible,.n37 a:focus-visible,.n37-tw:focus-visible{outline:3px solid #155C75;outline-offset:2px;border-radius:4px}:root[data-theme=dark] .n37-vs a:focus-visible,:root[data-theme=dark] .n37-act a:focus-visible{outline-color:#7CC7E0}.n37-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}.n37-se{display:inline-block}' +
'.n37-po{display:none}@media print{.n37-po{display:block!important;font-size:16pt;margin:0 0 6px}.n37 a[href]::after{content:none!important}.n37>p.k-xs:last-child{display:none!important}.n37-np,.k-cta,.crumb,#shipped-2026-11-23,#shipped-2026-11-25{display:none!important}.n37 h2{font-size:12pt;margin:10px 0 4px}.n37 table{font-size:9pt}.n37 th,.n37 td{padding:3px 6px}.n37-tw{overflow:visible;border:0;margin:4px 0 8px}.phero h1{font-size:17pt;margin:0}.phero .lead{font-size:10pt}.n37 p,.n37 li{font-size:10pt;line-height:1.35}.n37-vs{padding:6px 10px}@page{size:A4;margin:12mm}}</style>';
function vsBlock(l, r, acts) {
const g = vsGroups(r), D3 = { r: 'vs_rd', c: 'vs_cd' }, T3 = { r: 'vs_r1', c: 'vs_c1', u: 'vs_u' };
const bar = '<p class="n37-vb" aria-hidden="true">' + ['r', 'c', 'u'].map(k => g[k].map(() => '<i class="n37-b' + k + '"></i>').join('')).join('') + '</p>';
return TB.kbx_n37u__t.k77 + dir(l) + TB.kbx_n37u__t.k78 + esc(t(l, 'vs_h')) + '</b> <span class="k-xs">' + esc(t(l, 'vs_n')) + ' <a href="' + pre(l) + '/data/how-we-verify/">' + esc(t(l, 'vf_l')) + '</a></span></p>' + bar + '<ul role="list">' +
['r', 'c', 'u'].map(k => '<li class="n37-v' + k + '"><p class="n37-vt"><b>' + esc(t(l, T3[k])) + '</b> <span class="n37-vn">' + esc(tf(l, 'vs_of', { n: nf(g[k].length, l) })) + '</span></p>' +
(D3[k] ? '<p class="k-xs n37-vd">' + esc(t(l, D3[k])) + '</p>' : '') + (g[k].length ? '<ul class="n37-tg" role="list">' + g[k].map(f => '<li>' + esc(t(l, 'f_' + f)) + '</li>').join('') + '</ul>' : '') +
(k === 'u' && g.u.length ? '<p class="k-xs n37-vd"><a href="' + recU(l, r[1]) + '#unknown">' + esc(t(l, 'vs_ud')) + '</a></p>' : '') + '</li>').join('') + '</ul>' + (acts || '') + '</section>';
}
function actRow(l, r) {
const P = pre(l), s = r[1];
return '<nav class="n37-act" aria-label="' + esc(tf(l, 'act_l', { n: r[2] })) + '"><ul role="list">' + [[recU(l, s), 'a_rec'], [recU(l, s) + '#timeline', 'tl_l'], [P + '/projects/' + s + '/journey/', 'a_jr'], [P + '/projects/' + s + '/changes/', 'a_chg'], [P + '/projects/' + s + '/brief/', 'a_br'], [P + '/projects/' + s + '/report/', 'a_pdf'], ['/projects/' + s + '/record.json', 'js_l']]
.map(a => '<li><a href="' + a[0] + '"' + (a[1] === 'js_l' ? ' type="application/json"' : '') + '>' + esc(t(l, a[1])) + '</a></li>').join('') + '</ul></nav>';
}
async function briefPage(env, shell, l, r) {
const P = pre(l), F = D.f, lc = latestChange(r), RG = regsFor(r), miss = F.filter((f, i) => !r[8][i]);
let b = VSC + '<p class="n37-po"><b>' + esc(tf(l, 'br_h1', { n: r[2] })) + TB.kbx_n37u__t.k79 + esc(t(l, 'br_print')) + '</button> <a href="' + P + '/projects/' + r[1] + '/">' + esc(t(l, 'br_full')) + TB.kbx_n37u__t.k80 + recU(l, r[1]) + '">' + esc(t(l, 'a_rec')) + '</a></p>';
b += '<p>' + [['br_dev', r[6]], ['br_loc', [r[4], r[3]].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', ')], ['br_id', r[0]]].filter(x => x[1]).map(x => '<b>' + esc(t(l, x[0])) + ':</b> ' + bdi(x[1])).join(' · ') + '</p>' + vsBlock(l, r, '');
b += '<h2>' + esc(t(l, 'r_tbl')) + TB.kbx_n37u__t.k81 + esc(t(l, 'th_f')) + '</th><th scope="col">' + esc(t(l, 'th_v')) + '</th><th scope="col">' + esc(t(l, 'th_s')) + '</th><th scope="col">' + esc(t(l, 'th_d')) + '</th></tr></thead><tbody>' +
F.map((f, i) => { const c = r[8][i]; if (!c) return ''; const u = c[1];
return '<tr><th scope="row">' + esc(t(l, 'f_' + f)) + '</th><td class="n37-v">' + bdi(tv(f === 'ct' ? nf(c[0], l) : String(c[0]), l, 160)) + '</td><td>' + esc(t(l, 'k_' + c[2])) + (u && /^https?:/.test(u) ? TB.kbx_n37u__t.k82 + esc(u) + '" rel="nofollow noopener">' + esc(host(u)) + '</a>' : '') + '</td><td class="n">' + esc(fd(c[3], l)) + '</td></tr>'; }).join('') + '</tbody></table></div>';
b += '<h2>' + esc(t(l, 'br_lc')) + '</h2><p>' + esc(lc ? tf(l, 'tl_pj', { f: t(l, 'f_' + lc.x.f), a: tv(lc.x.p, l, 90), b: tv(lc.x.v, l, 90), d: fd(lc.x.d, l) }) : tf(l, 'br_lc0', { a: fd(TL && TL.days && TL.days.length ? TL.days[0][0] : D.built, l) })) + '</p>';
if (miss.length) b += '<h2>' + esc(t(l, 'br_unk')) + '</h2><ul>' + miss.map(f => { const rr = RG.filter(g => g[2].includes(f)).slice(0, 2);
return '<li><b>' + esc(t(l, 'f_' + f)) + '.</b> ' + esc(t(l, 'ask_' + f)) + (rr.length ? ' ' + esc(t(l, 'g_reg')) + ': ' + rr.map(g => bdi(g[0]) + (g[1] ? ' (' + esc(host(g[1])) + ')' : '')).join('; ') : '') + '</li>'; }).join('') + '</ul>';
b += buyRow(l, r, 'brief');
b += '<p class="k-xs">' + esc(tf(l, 'br_from', { u: 'kolaboro.com' + P + '/projects/' + r[1] + '/', d: fd(D.built, l) })) + '</p>';
return page(shell, l, { path: '/projects/' + r[1] + '/brief/', h1: tf(l, 'br_h1', { n: r[2] }), lead: t(l, 'br_lead'), body: b, noindex: true, crumb: [[t(l, 'projects'), P + '/projects/'], [r[2], P + '/projects/' + r[1] + '/']] });
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
let b = '<form method="get" action="' + P + TB.kbx_n37u__t.k83 + esc(t(l, 'ch_mk')) + ' <select name="m">' + '<option value="">' + esc(t(l, 'ch_all')) + ' (' + nf(all.length, l) + ')</option>' +
mks.map(m => '<option value="' + esc(m) + '"' + (m === mk ? ' selected' : '') + '>' + esc(m) + ' (' + nf(all.filter(x => x[0][3] === m).length, l) + ')</option>').join('') + TB.kbx_n37u__t.k84;
b += '<p><b>' + esc(tf(l, 'ch_n', { n: nf(rows.length, l), p: nf(new Set(rows.map(x => x[0])).size, l), a, b: z })) + '</b></p>';
b += TB.kbx_n37u__t.k85 + esc(t(l, 'tw_l')) + '"><table><thead><tr><th scope="col">' + esc(t(l, 'tl_d')) + '</th><th scope="col">' + esc(t(l, 'th_p')) + '</th><th scope="col">' + esc(t(l, 'ch_mk')) + '</th><th scope="col">' + esc(t(l, 'th_f')) + '</th><th scope="col">' + esc(t(l, 'ch_from')) + '</th><th scope="col">' + esc(t(l, 'ch_to')) + '</th></tr></thead><tbody>' +
rows.map(([r, x]) => '<tr><td class="n">' + esc(fd(x.d, l)) + '</td><th scope="row"><a href="' + recU(l, r[1]) + '#timeline">' + bdi(r[2]) + '</a></th><td>' + bdi(r[3]) + '</td><td>' + fname(l, x.f) + '</td><td class="n37-v">' + bdi(tv(x.p, l, 90)) + '</td><td class="n37-v">' + bdi(tv(x.v, l, 90)) + '</td></tr>').join('') + '</tbody></table></div>';
b += '<p class="k-xs">' + esc(t(l, 'tl_note')) + TB.kbx_n37u__t.k86 + esc(t(l, 'tl_snap')) + TB.kbx_n37u__t.k87 + esc(t(l, 'dl')) + TB.kbx_n37u__t.k88 + P + '/data/gaps/">' + esc(t(l, 'gp_link')) + '</a></p>';
b = '<p class="n37-np"><a href="' + P + '/data/changes/week/">' + esc(t(l, 'wk_h1')) + TB.kbx_n37u__t.k89 + (mk ? '?m=' + encodeURIComponent(mk) : '') + '" type="application/atom+xml">' + esc(t(l, 'fd_l')) + TB.kbx_n37u__t.k90 + (mk ? '?m=' + encodeURIComponent(mk) : '') + TB.kbx_n37u__s.k21 + b;
const res = await page(shell, l, { path: '/data/changes/', h1: t(l, 'ch_h1'), lead: t(l, 'ch_lead'), body: b, noindex: !!mk, head: TB.kbx_n37u__s.FEEDL, crumb: [[t(l, 'data'), P + '/data/']] });
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
const col = (y, n) => '<li' + (y ? '' : ' class="kdc-nd"') + ' style="--h:' + Math.max(6, Math.round(100 * n / mx)) + '"><b>' + nf(n, l) + '</b><i aria-hidden="true"></i><span>' + (y ? y : esc(t(l, 'n40d8_nd'))) + '</span></li>';
return '<section class="kdc"' + dir(l) + ' aria-label="' + esc(t(l, 'n40d8_lbl')) + '"><dl class="kdc-g">' + c(nf(rows.length, l), 'n40d8_k') + c(nf(share(g.g, g.h), l) + '%', 'n40d8_reg', tf(l, 'n40d8_of', { a: nf(g.g, l), b: nf(g.h, l) })) +
c(nf(lp, l), 'n40d8_late', k ? tf(l, 'n40d8_since', { d: fd(TL.days[0][0], l) }) : '') + c(nf(od, l), 'n40d8_od') + '</dl>' + (ys.length > 1 ? '<p class="kdc-h">' + esc(t(l, 'n40d8_tl')) + ' <a href="#by-year">' + esc(t(l, 'n40d8_tla')) + '</a></p><ol class="kdc-t">' + ys.map(y => col(y, Y.get(y))).join('') + (Y.get(null) ? col(null, Y.get(null)) : '') + '</ol>' : '') + '</section>';
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
const bars = M.map((m, i) => { const y = 8 + i * 24, w = Math.max(2, Math.abs(m.dm) * sc), x = m.dm > 0 ? cx : cx - w, nm = String(m.r[2] || ''); return '<text x="' + (L - 8) + '" y="' + (y + 13) + TB.kbx_n37u__t.k91 + esc(nm.length > 32 ? nm.slice(0, 31) + '…' : nm) + '</text><rect x="' + x.toFixed(1) + '" y="' + y + '" width="' + w.toFixed(1) + '" height="16" rx="3" fill="' + (m.dm > 0 ? '#B42318' : '#0F7B3E') + '"><title>' + esc(nm + ': ' + byM(l, m.dm)) + '</title></rect><text x="' + (m.dm > 0 ? x + w + 4 : x - 4).toFixed(1) + '" y="' + (y + 13) + '" text-anchor="' + (m.dm > 0 ? 'start' : 'end') + '" font-size="11" fill="currentColor">' + (m.dm > 0 ? '+' : '') + nf(m.dm, l) + '</text>'; }).join('');
return TB.kbx_n37u__t.k92 + (rtl ? ' dir="ltr"' : '') + '><svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + TB.kbx_n37u__t.k93 + esc(tf(l, 'mc_l', { d: name, n: nf(M.length, l) })) + '"><line x1="' + cx + '" x2="' + cx + '" y1="0" y2="' + (H - 22) + TB.kbx_n37u__t.k94 + bars + '<text x="' + cx + '" y="' + (H - 6) + TB.kbx_n37u__t.k95 + esc(t(l, 'mc_ax')) + '</text></svg><figcaption class="k-xs"' + dir(l) + '>' + esc(t(l, 'mc_c')) + '</figcaption></figure>';
}
function trackSection(l, slug) {
const k = devTrack(slug); if (!k) return '';
const days = TL.days, name = k.rows[0][6] || slug;
let b = '<h3 id="n37-track">' + esc(t(l, 'tr_h')) + '</h3><p>' + esc(tf(l, 'tr_p', { a: fd(days[0][0], l), b: fd(D.built, l), d: name, t: nf(k.th.length, l), p: nf(k.p, l), m: nf(k.mv.length, l) })) + '</p>';
if (!k.mv.length) return b + '<p>' + esc(t(l, 'tr_0')) + '</p>';
b += '<ul><li>' + esc(k.late.length ? tf(l, 'tr_late', { n: nf(k.late.length, l), m: nf(k.md, l) }) : tf(l, 'tr_late0', { n: nf(0, l) })) + '</li><li>' + esc(tf(l, 'tr_early', { n: nf(k.early.length, l) })) + '</li>' + (k.nc ? '<li>' + esc(tf(l, 'tr_nc', { n: nf(k.nc, l) })) + '</li>' : '') + '</ul>';
b += moveChart(l, k.mv, name);
b += TB.kbx_n37u__t.k96 + esc(t(l, 'tr_h')) + '"><table><thead><tr><th scope="col">' + esc(t(l, 'th_p')) + '</th><th scope="col">' + esc(t(l, 'ch_from')) + '</th><th scope="col">' + esc(t(l, 'ch_to')) + '</th><th scope="col">' + esc(t(l, 'tr_by')) + '</th><th scope="col">' + esc(t(l, 'tr_seen')) + '</th><th scope="col">' + esc(t(l, 'th_s')) + '</th></tr></thead><tbody>' +
k.mv.map(m => { const c = m.r[8][0], u = c && c[1];
return '<tr><th scope="row"><a href="' + recU(l, m.r[1]) + '#timeline">' + bdi(m.r[2]) + '</a></th><td class="n">' + bdi(tv(m.x.p, l, 40)) + '</td><td class="n">' + bdi(tv(m.x.v, l, 40)) + '</td><td class="n">' + esc(byM(l, m.dm)) + '</td><td class="n">' + esc(fd(m.x.d, l)) + '</td><td>' + (c ? esc(t(l, 'k_' + c[2])) : '') + (u && /^https?:/.test(u) ? TB.kbx_n37u__t.k97 + esc(u) + '" rel="nofollow noopener">' + esc(host(u)) + '</a>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div>';
return b + '<p class="k-xs">' + esc(t(l, 'tr_note')) + '</p><p><a href="' + pre(l) + '/data/changes/week/">' + esc(t(l, 'wk_h1')) + '</a></p>';
}
const DAY = 86400000, isoD = ms => new Date(ms).toISOString().slice(0, 10);
async function weekPage(env, shell, l) {
const P = pre(l), all = allChanges(), z = Date.parse(D.built + 'T00:00:00Z'), a = isoD(z - 6 * DAY), a0 = isoD(z - 13 * DAY);
const wk = all.filter(x => x[1].d >= a), prev = all.filter(x => x[1].d >= a0 && x[1].d < a).length, G = new Map();
for (const x of wk) (G.get(x[0][3]) || G.set(x[0][3], []).get(x[0][3])).push(x);
const mks = [...G.keys()].sort((m, n) => G.get(n).length - G.get(m).length || m.localeCompare(n));
let b = '<p><b>' + esc(tf(l, 'wk_n', { n: nf(wk.length, l), p: nf(new Set(wk.map(x => x[0])).size, l), k: nf(mks.length, l), a: fd(a, l), b: fd(D.built, l), q: nf(prev, l) })) + '</b></p>';
if (!wk.length) b += '<p>' + esc(t(l, 'wk_0')) + '</p>';
else b += '<nav aria-label="' + esc(t(l, 'ch_mk')) + '"><ul class="n37-rel" role="list">' + mks.map(m => '<li><a href="#mk-' + slugM(m) + '">' + bdi(m) + '</a>&nbsp;<span class="k-xs">' + nf(G.get(m).length, l) + '</span></li>').join('') + '</ul></nav>';
for (const m of mks) {
const rows = G.get(m), ho = rows.filter(x => x[1].f === 'ho');
b += '<h2 id="mk-' + slugM(m) + '">' + esc(tf(l, 'wk_mh', { m })) + '</h2><p>' + esc(tf(l, 'wk_mp', { n: nf(rows.length, l), p: nf(new Set(rows.map(x => x[0])).size, l), h: nf(ho.length, l) })) + '</p>' +
TB.kbx_n37u__t.k98 + esc(tf(l, 'wk_mh', { m })) + '"><table><thead><tr><th scope="col">' + esc(t(l, 'tl_d')) + '</th><th scope="col">' + esc(t(l, 'th_p')) + '</th><th scope="col">' + esc(t(l, 'th_f')) + '</th><th scope="col">' + esc(t(l, 'ch_from')) + '</th><th scope="col">' + esc(t(l, 'ch_to')) + '</th></tr></thead><tbody>' +
rows.map(([r, x]) => '<tr><td class="n">' + esc(fd(x.d, l)) + '</td><th scope="row"><a href="' + recU(l, r[1]) + '#timeline">' + bdi(r[2]) + '</a></th><td>' + fname(l, x.f) + (x.f === 'ho' ? ' <span class="k-xs">(' + esc(byM(l, (mIdx(x.v) != null && mIdx(x.p) != null) ? mIdx(x.v) - mIdx(x.p) : null)) + ')</span>' : '') + '</td><td class="n37-v">' + bdi(tv(x.p, l, 90)) + '</td><td class="n37-v">' + bdi(tv(x.v, l, 90)) + '</td></tr>').join('') + '</tbody></table></div>' +
'<p><a href="' + P + '/data/changes/?m=' + encodeURIComponent(m) + '">' + esc(tf(l, 'wk_all', { m })) + TB.kbx_n37u__t.k99 + encodeURIComponent(m) + '" type="application/atom+xml">' + esc(t(l, 'fd_l')) + '</a></p>';
}
b += '<p class="k-xs">' + esc(t(l, 'tl_note')) + ' <a href="' + P + '/data/changes/">' + esc(t(l, 'ch_h1')) + TB.kbx_n37u__s.k22 + esc(t(l, 'fd_l')) + TB.kbx_n37u__s.k23 + esc(t(l, 'dl')) + '</a></p>';
return page(shell, l, { path: '/data/changes/week/', h1: t(l, 'wk_h1'), lead: t(l, 'wk_lead'), body: b, head: TB.kbx_n37u__s.FEEDL, crumb: [[t(l, 'data'), P + '/data/'], [t(l, 'ch_h1'), P + '/data/changes/']] });
}
const xe = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function feedAtom(mq) {
const all = allChanges(), mk = mq, rows = (mk ? all.filter(x => x[0][3] === mk) : all).slice(0, 100);
const self = ORIGIN + '/data/changes/feed.atom' + (mk ? '?m=' + encodeURIComponent(mk) : ''), upd = (rows.length ? rows[0][1].d : D.built) + 'T00:00:00Z';
const x = TB.kbx_n37u__t.k100 + xe('Kolaboro: project fact changes' + (mk ? ' in ' + mk : '')) + '</title><id>' + xe(self) + '</id><updated>' + upd + '</updated><link rel="self" href="' + xe(self) + TB.kbx_n37u__t.k101 + ORIGIN + '/data/changes/' + (mk ? '?m=' + encodeURIComponent(mk) : '') + TB.kbx_n37u__t.k102 +
rows.map(([r, c]) => { const f = t('en', 'f_' + c.f), cur = r[8][D.f.indexOf(c.f)], src = cur && cur[1] && /^https?:/.test(cur[1]) ? cur[1] : '';
return '<entry><title>' + xe(r[2] + ': ' + f + ' changed') + TB.kbx_n37u__t.k103 + r[1] + '/' + c.f + '/' + c.d + '</id><updated>' + c.d + 'T00:00:00Z</updated><link href="' + ORIGIN + '/projects/' + r[1] + '/record/#timeline"/><category term="' + xe(r[3]) + '"/><summary>' + xe(f + ': from ' + c.p + ' to ' + c.v + ' (' + r[3] + (c.f === 'ho' ? ', ' + byM('en', mIdx(c.v) != null && mIdx(c.p) != null ? mIdx(c.v) - mIdx(c.p) : null) : '') + '). Seen in our daily copy of ' + c.d + '.' + (src ? ' Source of the current value: ' + src : '')) + '</summary></entry>'; }).join('') + '</feed>\n';
return new Response(x, { headers: { 'content-type': 'application/atom+xml; charset=utf-8', 'cache-control': 'public, max-age=900', 'access-control-allow-origin': '*' } });
}
function seInfo(l, x) {
const lc = latestChange(x);
return ' <span class="k-xs n37-se">' + esc(tf(l, 'se_k', { k: nf(cnt(x), l) }) + (lc ? ' · ' + tf(l, 'se_c', { f: t(l, 'f_' + lc.x.f), d: fd(lc.x.d, l) }) : '') + (IX.rgc && IX.rgc.get(x[1]) ? ' · ' + tf(l, 'rg_b', { n: nf(IX.rgc.get(x[1]), l) }) : '')) + '</span>';
}
function seJson() {
if (!IX.se) { const o = {}; for (const x of D.p) { const lc = latestChange(x); o[x[1]] = lc ? [cnt(x), lc.x.f, lc.x.d] : [cnt(x)]; } const g = {}; for (const x of D.p) { let n = 0; for (const c of x[8]) if (c && c[2] === 'reg') n++; if (n) g[x[1]] = n; } IX.se = JSON.stringify({ built: D.built, p: o, g }); }
return new Response(IX.se, { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=900', 'access-control-allow-origin': '*' } });
}
function seTpl(l) { const f = {}; for (const k of D.f) f[k] = t(l, 'f_' + k); return JSON.stringify({ k: t(l, 'se_k'), c: t(l, 'se_c'), b: t(l, 'rg_b'), f }); }
const ITEMS = [['s1', '/projects/emaar-golf-vale/record/#fields'], ['s2', '/projects/emaar-golf-vale/record/#unknown'], ['s3', '/projects/emaar-golf-vale/record/#market'], ['s4', '/projects/emaar-golf-vale/record/#developer'], ['s5', '/data/gaps/'], ['s6', '/projects/emaar-golf-vale/record/#age'], ['s7', '/data/dictionary/'], ['s8', '/data/gaps/#dist'], ['s9', '/data/gaps.csv'], ['s10', '/projects/emaar-golf-vale/record.json'], ['s11', '/data/'], ['s12', '/m/dubai/#n37-facts'], ['s13', '/developers/emaar-properties/#n37-dev'], ['s14', '/#n37-live'], ['s15', '/engineering/status/'], ['s16', '/projects/meriva-collection-ellington/record/#timeline'], ['s17', '/projects/meriva-collection-ellington/'], ['s18', '/developers/'], ['s19', '/m/dubai/'], ['s20', '/data/catalog.json'], ['s21', '/projects/emaar-golf-vale/#n37-vs'], ['s22', '/projects/emaar-golf-vale/brief/'], ['s23', '/data/changes/'], ['s24', '/search/?q=emaar'], ['s25', '/m/dubai/'], ['s26', '/projects/emaar-golf-vale/changes/'], ['s27', '/data/changes/week/'], ['s28', '/developers/emaar-properties/#n37-track'], ['s29', '/data/changes/feed.atom'], ['s30', '/projects/emaar-golf-vale/#n37-vs'], ['s31', '/projects/emaar-golf-vale/'], ['s32', '/docs/api/#key-facts'], ['s33', '/docs/mcp/#key-facts'], ['s34', '/data/how-we-verify/'], ['s35', '/engineering/status/'], ['s36', '/#n37-prog'], ['s37', '/projects/one-seputeh-residences-kl/#n37-kp'], ['s38', '/registers/malaysia/'], ['s39', '/developers/mah-sing-group/#n37-dreg'], ['s40', '/data/markets/'], ['s41', '/ar/projects/one-seputeh-residences-kl/record/'], ['s42', '/search/?rg=1&so=reg'], ['s43', '/rankings/transparency/dubai/#ranking'], ['s44', '/data/#api-answers'], ['s45', '/projects/emaar-golf-vale/#n37-vs'], ['s46', '/projects/bangsar-hill-park/#n37-kp-stage'], ['s47', '/data/pipeline/'], ['s48', '/data/delays/'], ['s49', '/data/developers/'], ['s50', '/data/markets/dubai/'], ['s51', '/search/?q=emaar#saved'], ['s52', '/projects/emaar-golf-vale/#n38-sup']];
const li37 = l => x => '<li><a href="' + (x[2] || /\.(csv|json|atom)$|^\/docs\/|^\/data\/#|^\/(es|fr|de|ru|zh|ar|nl)\//.test(x[1]) ? '' : pre(l)) + x[1] + '">' + esc(t(l, x[0] + '_t')) + '</a>: ' + esc(t(l, x[0] + '_s')) + '</li>';
const shipX = (d, l) => { const I = (T && T['items' + d]) || []; return I.length ? TB.kbx_n37u__t.k104 + d + '"' + dir(l) + '><h2>' + esc(t(l, 'sh' + d + '_h')) + '</h2><ul>' + I.map(li37(l)).join('') + '</ul></section>' : ''; };
const shipped = l => shipX(26, l) + shipX(25, l) + TB.kbx_n37u__t.k105 + dir(l) + '><h2>' + esc(t(l, 'sh_h')) + '</h2><p>' + esc(t(l, 'sh_p')) + '</p><ul>' + ITEMS.map(x => '<li><a href="' + (/\.(csv|json|atom)$|^\/docs\/|^\/data\/#|^\/(es|fr|de|ru|zh|ar|nl)\//.test(x[1]) ? '' : pre(l)) + x[1] + '">' + esc(t(l, x[0] + '_t')) + '</a>: ' + esc(t(l, x[0] + '_s')) + '</li>').join('') + '</ul></section>';
const JH = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=900' };
const srcAbs = (r, f) => { const c = r[8][D.f.indexOf(f)]; return c && c[1] ? (/^https?:/.test(c[1]) ? c[1] : ORIGIN + c[1]) : null; };
function chRow([r, x]) {
const o = { date: x.d, slug: r[1], project: r[2], market: r[3], developer: r[6] || null, field: x.f, label: t('en', 'f_' + x.f), from: x.p, to: x.v, months_moved: null, record: ORIGIN + '/projects/' + r[1] + '/record/#timeline', source_of_current_value: srcAbs(r, x.f) };
if (x.f === 'ho') { const a = mIdx(x.p), b = mIdx(x.v); if (a != null && b != null) o.months_moved = b - a; }
return o;
}
function chFilter(q) {
let rows = allChanges();
if (q.m) { const k = String(q.m).trim().toLowerCase(); rows = rows.filter(x => x[0][3].toLowerCase() === k); }
if (q.field) { if (!D.f.includes(q.field)) return { err: 'field must be one of ' + D.f.join(', ') }; rows = rows.filter(x => x[1].f === q.field); }
let since = q.since || null;
if (since && !/^\d{4}-\d{2}-\d{2}$/.test(since)) return { err: 'since must be YYYY-MM-DD' };
if (q.days != null) since = isoD(Date.parse(D.built + 'T00:00:00Z') - (q.days - 1) * DAY);
if (since) rows = rows.filter(x => x[1].d >= since);
return { rows, since };
}
function changesJson(u) {
const g = k => u.searchParams.get(k), lim = Math.min(1000, Math.max(1, parseInt(g('limit') || '200', 10) || 200)), off = Math.min(100000, Math.max(0, parseInt(g('offset') || '0', 10) || 0));
const q = chFilter({ m: (g('m') || '').slice(0, 80), field: g('field') || '', since: g('since') || '' });
if (q.err) return new Response(JSON.stringify({ error: q.err }), { status: 400, headers: JH });
const o = { built: D.built, licence: 'CC BY 4.0, cite Kolaboro', rule: TB.kbx_n37u__s.CH_RULE, copies_from: TL && TL.days && TL.days.length ? TL.days[0][0] : null, filters: { m: g('m') || null, field: g('field') || null, since: q.since }, total: q.rows.length, offset: off, limit: lim,
changes: q.rows.slice(off, off + lim).map(chRow), page: ORIGIN + '/data/changes/', feed: ORIGIN + '/data/changes/feed.atom', week: ORIGIN + '/data/changes/week.json' };
return new Response(JSON.stringify(o, null, 1), { headers: { ...JH, link: '<' + ORIGIN + TB.kbx_n37u__t.k106 } });
}
function weekObj() {
const all = allChanges(), z = Date.parse(D.built + 'T00:00:00Z'), a = isoD(z - 6 * DAY), a0 = isoD(z - 13 * DAY), wk = all.filter(x => x[1].d >= a), G = new Map();
for (const x of wk) (G.get(x[0][3]) || G.set(x[0][3], []).get(x[0][3])).push(x);
return { built: D.built, licence: 'CC BY 4.0, cite Kolaboro', rule: TB.kbx_n37u__s.CH_RULE, from: a, to: D.built, changes_count: wk.length, projects: new Set(wk.map(x => x[0])).size,
previous_week: { from: a0, to: isoD(z - 7 * DAY), changes_count: all.filter(x => x[1].d >= a0 && x[1].d < a).length },
markets: [...G.entries()].sort((m, n) => n[1].length - m[1].length || m[0].localeCompare(n[0])).map(([m, rows]) => ({ market: m, changes: rows.length, projects: new Set(rows.map(x => x[0])).size, handover_moves: rows.filter(x => x[1].f === 'ho').length, page: ORIGIN + '/data/changes/week/#mk-' + slugM(m), feed: ORIGIN + '/data/changes/feed.atom?m=' + encodeURIComponent(m) })),
changes: wk.map(chRow), page: ORIGIN + '/data/changes/week/' };
}
function recObj(r) {
const F = D.f, RG = regsFor(r);
return { id: r[0], slug: r[1], name: r[2], market: r[3], area: r[4] || null, developer: r[6] || null, page: ORIGIN + '/projects/' + r[1] + '/', record: ORIGIN + '/projects/' + r[1] + '/record/', built: D.built || null,
licence: 'CC BY 4.0, cite Kolaboro', fields_held: cnt(r), fields_total: F.length, kinds: { reg: TB.kbx_n37u__t.k107, dev: "the developer's own site", portal: 'a listing portal', web: 'another web page we read', sat: 'our Sentinel-2 reading', rec: TB.kbx_n37u__t.k108 },
facts: F.map((f, i) => { const c = r[8][i]; return c ? { field: f, label: t('en', 'f_' + f), value: c[0], source: c[1] ? (/^https?:/.test(c[1]) ? c[1] : ORIGIN + c[1]) : ORIGIN + '/projects/' + r[1] + '/#sources', kind: c[2], date: c[3] || null, date_is: f === 'ct' ? 'latest case' : f === 'cp' ? 'register inspection' : f === 'sat' ? 'satellite scene' : 'read', definition: ORIGIN + DEF[f] } : null; }).filter(Boolean),
unknown: F.filter((f, i) => !r[8][i]).map(f => ({ field: f, label: t('en', 'f_' + f), how_to_find: t('en', 'ask_' + f), registers: RG.filter(g => g[2].includes(f)).map(g => ({ name: g[0], url: g[1] || null, reached_by_our_checker: g[4] || null })) })) };
}
export async function mcpTool3(env, name, a) {
if (!(await load(env))) return { err: 'temporarily unavailable, please retry' };
if (name === 'get_project_record') {
if (typeof a.slug !== 'string' || !/^[a-z0-9-]{1,90}$/.test(a.slug)) return { err: TB.kbx_n37u__t.k109 };
const r = IX.bySlug.get(a.slug); if (!r) return { status: 404, body: { error: 'no project record with this slug', hint: TB.kbx_n37u__t.k110 } };
return { body: recObj(r), source: ORIGIN + '/projects/' + a.slug + '/record.json' };
}
if (name === 'list_fact_changes') {
if (a.days != null && (!Number.isInteger(a.days) || a.days < 1 || a.days > 120)) return { err: 'days must be an integer from 1 to 120' };
if (a.limit != null && (!Number.isInteger(a.limit) || a.limit < 1 || a.limit > 200)) return { err: TB.kbx_n37u__t.k111 };
if (a.market != null && (typeof a.market !== 'string' || a.market.length > 80)) return { err: TB.kbx_n37u__t.k112 };
const q = chFilter({ m: a.market || '', field: a.field || '', since: a.since || '', days: a.days });
if (q.err) return { err: q.err };
const lim = a.limit || 50;
return { body: { built: D.built, rule: TB.kbx_n37u__s.CH_RULE, filters: { market: a.market || null, field: a.field || null, since: q.since }, total: q.rows.length, changes: q.rows.slice(0, lim).map(chRow), more: q.rows.length > lim ? ORIGIN + '/data/changes.json' : null }, source: ORIGIN + '/data/changes.json' };
}
return null;
}
const AGEB = [[0, 30], [31, 90], [91, 180], [181, 1e9]];
function verifyStats() {
if (IX.vf) return IX.vf;
const K = ['reg', 'sat', 'dev', 'portal', 'web', 'rec'], kc = Object.fromEntries(K.map(k => [k, 0])), ab = [0, 0, 0, 0], abK = Object.fromEntries(K.map(k => [k, [0, 0, 0, 0]])), z = Date.parse(D.built + 'T00:00:00Z');
let tot = 0, und = 0, sat = 0, satA = null, satZ = null, withReg = 0;
for (const r of D.p) { let hasReg = false; r[8].forEach((c, i) => { if (!c) return; tot++; kc[c[2]] = (kc[c[2]] || 0) + 1; if (c[2] === 'reg') hasReg = true;
if (D.f[i] === 'sat') { sat++; const d = String(c[3] || '').slice(0, 10); if (/^\d{4}-\d{2}-\d{2}$/.test(d)) { if (!satA || d < satA) satA = d; if (!satZ || d > satZ) satZ = d; } }
if (D.f[i] === 'ct') return; const d = String(c[3] || '').slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) { und++; return; }
const ag = Math.max(0, Math.floor((z - Date.parse(d + 'T00:00:00Z')) / DAY)), b = AGEB.findIndex(x => ag >= x[0] && ag <= x[1]); ab[b]++; if (abK[c[2]]) abK[c[2]][b]++; });
if (hasReg) withReg++; }
const regs = []; for (const m in D.rg) for (const g of D.rg[m]) regs.push([m, g]);
return (IX.vf = { K, kc, tot, ab, abK, und, sat, satA, satZ, withReg, regs, mk: Object.keys(D.rg).length });
}
async function verifyPage(env, shell, l) {
const P = pre(l), s = verifyStats(), pc = n => nf(s.tot ? Math.round(1000 * n / s.tot) / 10 : 0, l) + '%', conf = s.kc.reg + s.kc.sat;
let b = '<p><b>' + esc(tf(l, 'vf_sum', { n: nf(s.tot, l), p: nf(D.n, l), c: nf(conf, l), cp: pc(conf), r: nf(s.withReg, l) })) + '</b></p>';
b += '<h2 id="steps">' + esc(t(l, 'vf_st_h')) + '</h2><ol class="n37-g">' + [1, 2, 3, 4, 5, 6].map(i => '<li>' + esc(t(l, 'vf_st' + i)) + '</li>').join('') + '</ol>';
b += '<h2 id="kinds">' + esc(t(l, 'vf_k_h')) + '</h2><p>' + esc(t(l, 'vf_k_p')) + TB.kbx_n37u__t.k113 + esc(t(l, 'vf_k_h')) + '"><table><thead><tr><th scope="col">' + esc(t(l, 'th_s')) + '</th><th scope="col">' + esc(t(l, 'vf_th_g')) + '</th><th scope="col" class="n">' + esc(t(l, 'vf_th_n')) + '</th><th scope="col" class="n">' + esc(t(l, 'vf_th_p')) + '</th></tr></thead><tbody>' +
s.K.map(k => '<tr><th scope="row">' + badge(l, k) + '</th><td>' + esc(t(l, VG[k] === 'r' ? 'vf_g_r' : 'vf_g_c')) + '</td><td class="n">' + nf(s.kc[k] || 0, l) + '</td><td class="n">' + bdi(pc(s.kc[k] || 0)) + '</td></tr>').join('') +
'<tr><th scope="row">' + esc(tf(l, 'gp_all', { n: nf(D.n, l) })) + '</th><td></td><td class="n"><b>' + nf(s.tot, l) + TB.kbx_n37u__t.k114;
b += '<h2 id="registers">' + esc(t(l, 'vf_r_h')) + '</h2><p>' + esc(tf(l, 'vf_r_p', { n: nf(s.regs.length, l), m: nf(s.mk, l), k: nf(s.kc.reg, l), r: nf(s.withReg, l) })) + TB.kbx_n37u__t.k115 + esc(t(l, 'vf_r_h')) + '"><table><thead><tr><th scope="col">' + esc(t(l, 'gp_m')) + '</th><th scope="col">' + esc(t(l, 'g_reg')) + '</th><th scope="col">' + esc(t(l, 'th_f')) + '</th><th scope="col">' + esc(t(l, 'vf_th_ck')) + '</th></tr></thead><tbody>' +
s.regs.map(([m, g]) => '<tr><th scope="row">' + bdi(m) + '</th><td>' + (g[1] ? '<a href="' + esc(g[1]) + '" rel="nofollow noopener">' + bdi(g[0]) + '</a>' : bdi(g[0])) + '</td><td>' + (g[2].length ? g[2].map(f => esc(t(l, 'f_' + f))).join(', ') : '') + '</td><td class="n">' + esc(g[4] ? fd(g[4], l) : '') + '</td></tr>').join('') + '</tbody></table></div><p><a href="' + P + '/registers/">' + esc(t(l, 'vf_r_l')) + '</a></p>';
b += '<h2 id="satellite">' + esc(t(l, 'vf_s_h')) + '</h2><p>' + esc(tf(l, 'vf_s_p', { n: nf(s.sat, l), a: fd(s.satA, l), b: fd(s.satZ, l) })) + TB.kbx_n37u__t.k116 + esc(t(l, 'vf_s_l')) + '</a></p>';
b += '<h2 id="age">' + esc(t(l, 'vf_a_h')) + '</h2><p>' + esc(tf(l, 'vf_a_p', { o: nf(s.ab[3], l), u: nf(s.und, l) })) + TB.kbx_n37u__t.k117 + esc(t(l, 'vf_a_h')) + '"><table><thead><tr><th scope="col">' + esc(t(l, 'th_s')) + '</th>' + ['vf_a0', 'vf_a1', 'vf_a2', 'vf_a3'].map(k => '<th scope="col" class="n">' + esc(t(l, k)) + '</th>').join('') + '</tr></thead><tbody>' +
s.K.filter(k => s.abK[k].some(Boolean)).map(k => '<tr><th scope="row">' + badge(l, k) + '</th>' + s.abK[k].map(n => '<td class="n">' + nf(n, l) + '</td>').join('') + '</tr>').join('') +
'<tr><th scope="row">' + esc(t(l, 'vf_all')) + '</th>' + s.ab.map(n => '<td class="n"><b>' + nf(n, l) + '</b></td>').join('') + TB.kbx_n37u__t.k118 + esc(t(l, 'age_note')) + '</p>';
b += '<h2 id="changes">' + esc(t(l, 'vf_c_h')) + '</h2><p>' + esc(tf(l, 'vf_c_p', { n: nf(allChanges().length, l), a: fd(TL && TL.days && TL.days.length ? TL.days[0][0] : D.built, l) })) + ' <a href="' + P + '/data/changes/">' + esc(t(l, 'ch_h1')) + '</a></p>';
b += '<h2 id="check">' + esc(t(l, 'vf_x_h')) + '</h2><ul class="n37-rel">' + [[recU(l, 'emaar-golf-vale'), 'vf_x1'], ['/projects/emaar-golf-vale/record.json', 'vf_x2'], [P + '/data/gaps/', 'gp_link'], ['/data/dictionary/', 'vf_x3'], ['/corrections/', 'vf_x4'], ['/docs/api/#key-facts', 'vf_x5']]
.map(x => '<li><a href="' + x[0] + '">' + esc(t(l, x[1])) + '</a></li>').join('') + '</ul>';
return page(shell, l, { path: '/data/how-we-verify/', h1: t(l, 'vf_h1'), lead: t(l, 'vf_lead'), body: b, crumb: [[t(l, 'data'), P + '/data/']] });
}
function progStats() {
if (IX.pg) return IX.pg;
const s = verifyStats(), all = allChanges(), z = Date.parse(D.built + 'T00:00:00Z'), a = isoD(z - 6 * DAY), wk = all.filter(x => x[1].d >= a);
let five = 0; for (const r of D.p) if (cnt(r) >= 5) five++;
return (IX.pg = { tot: s.tot, conf: s.kc.reg + s.kc.sat, regs: s.regs.length, mk: s.mk, w: wk.length, wp: new Set(wk.map(x => x[0])).size, from: a, n: D.p.length, five, built: D.built });
}
const pct1 = (a, b, l) => nf(b ? Math.round(1000 * a / b) / 10 : 0, l) + '%';
function progLine(l) {
const g = progStats();
return '<p class="n37-live" id="n37-prog"' + dir(l) + '>' + esc(tf(l, 'pg_line', { c: nf(g.conf, l), n: nf(g.tot, l), cp: pct1(g.conf, g.tot, l) })) + ' <a href="' + pre(l) + '/data/how-we-verify/">' + esc(t(l, 'vf_l')) + '</a> · ' +
'<a href="' + pre(l) + '/data/changes/week/">' + esc(tf(l, g.w === 1 ? 'pg_w1' : 'pg_wn', { w: nf(g.w, l), p: nf(g.wp, l) })) + '</a></p>';
}
async function progBlock(l, env) {
const g = progStats(), s = await stats(env), P = pre(l), li = (h, x) => '<li><a href="' + h + '">' + esc(x) + '</a></li>';
return TB.kbx_n37u__s.k24 + dir(l) + TB.kbx_n37u__t.k119 + esc(tf(l, 'pg_h', { d: fd(g.built, l) })) + TB.kbx_n37u__t.k120 +
(s ? li(P + '/projects/', tf(l, 'pg_p', { p: nf(s.projects, l), m: nf(s.markets, l), c: nf(s.countries, l) })) : '') +
li(P + '/data/how-we-verify/', tf(l, 'pg_line', { c: nf(g.conf, l), n: nf(g.tot, l), cp: pct1(g.conf, g.tot, l) })) +
li('/registers/', tf(l, 'pg_r', { r: nf(g.regs, l), m: nf(g.mk, l) })) +
li(P + '/data/gaps/#dist', tf(l, 'pg_5', { a: nf(g.five, l), n: nf(g.n, l), p: pct1(g.five, g.n, l) })) +
li(P + '/data/changes/week/', tf(l, g.w === 1 ? 'pg_w1' : 'pg_wn', { w: nf(g.w, l), p: nf(g.wp, l) })) +
TB.kbx_n37u__t.k121 + esc(t(l, 'pg_n')) + '</p></section>' + await todayBlock(l, env);
}
async function todayBlock(l, env) {
const g = progStats(), G = await regMap(env), P = pre(l), k = KP ? kpSum(kpRows(null)) : null, li = (h, x) => '<li><a href="' + h + '">' + esc(x) + '</a></li>';
return TB.kbx_n37u__s.k25 + dir(l) + TB.kbx_n37u__t.k122 + esc(tf(l, 'yt_h', { d: fd(g.built, l) })) + TB.kbx_n37u__t.k123 +
li(P + '/projects/emaar-golf-vale/record/', tf(l, 'yt_rec', { n: nf(g.n, l) })) +
(G ? li(P + '/search/?rg=1&amp;so=reg', tf(l, 'yt_rg', { g: nf(G.size, l) })) : '') +
(k ? li(P + '/registers/malaysia/', tf(l, 'yt_kp', { e: nf(k.n, l), p: nf(k.pr, l), k: nf(k.late3, l) })) : '') +
li(P + '/data/markets/?s=reg', tf(l, 'yt_mc', { m: nf(Object.keys(D.mk).length, l) })) +
li(P + TB.kbx_n37u__t.k124, t(l, 'yt_dv')) +
li(P + '/data/changes/', tf(l, 'yt_ch', { w: nf(g.w, l) })) +
TB.kbx_n37u__t.k125 + P + '/engineering/#shipped-2026-11-23">' + esc(tf(l, 'yt_all', { n: nf(ITEMS.length, l) })) + '</a></p></section>';
}
let KP = null;
async function loadKP() { KP = D && D.kp && D.kp.p ? D.kp : null; return KP; }
const KST = { 'Lancar': 'ok', 'Belum Mula': 'ns', 'Lewat': 'late', 'Sakit': 'sick', 'Terbengkalai': 'ab', 'Siap Dengan CCC': 'done' };
const kst = p => KST[p.st] || 'x';
const dd = (a, b) => Math.round((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / DAY);
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
const stB = (l, p) => '<span class="n37-st ' + kst(p) + '">' + esc(t(l, 'kst_' + kst(p))) + TB.kbx_n37u__t.k126 + esc(p.st || '') + ')</span>';
const rm = (v, l) => 'RM ' + nf(v, l);
const pcf = (a, l) => a.map(v => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { maximumFractionDigits: 2, numberingSystem: 'latn' }).format(v); } catch (e) { return String(v); } } ).map(x => x + '%').join(' / ');
function kpPhase(l, p) {
const o = kpInfo(p), row = (k, v) => v ? '<dt>' + esc(t(l, k)) + '</dt><dd>' + v + '</dd>' : '';
let pn = '';
if (p.pn) { pn = bdi(p.pn); if (p.vf && p.vt) pn += ' <span class="k-xs">' + esc(tf(l, 'kp_valid', { a: fd(p.vf, l), b: fd(p.vt, l) })) + '</span>';
if (o.pexp != null && o.pexp < 0) pn += ' <span class="n37-fl">' + esc(tf(l, 'kp_pexp0', { d: fd(p.vt, l) })) + '</span>'; else if (o.pexp != null && o.pexp <= 180) pn += ' <span class="n37-fl">' + esc(tf(l, o.pexp === 1 ? 'kp_pexp1' : 'kp_pexpn', { n: nf(o.pexp, l) })) + '</span>'; }
let vp = '';
if (p.vp) vp = esc(fd(p.vp, l)) + (p.spa ? ' <span class="k-xs">' + esc(tf(l, 'kp_spa', { d: fd(p.spa, l), m: nf(p.per || 0, l) })) + '</span>' : '');
let ex = '';
if (p.ext) ex = esc(tf(l, p.ext === 1 ? 'kp_ext1' : 'kp_extn', { n: nf(p.ext, l), d: fd(p.vp2, l) })); else if (p.vp) ex = esc(t(l, 'kp_ext0'));
if (o.past) ex += (ex ? ' ' : '') + '<span class="n37-fl">' + esc(tf(l, 'kp_past', { d: fd(o.due, l) })) + '</span>';
return '<dl class="n37-kd">' + row('kp_st', stB(l, p)) + row('kp_pc', p.pc && p.pc.length ? bdi(pcf(p.pc, l)) : '') + row('kp_pn', pn) + row('kp_vp', vp) + row('kp_ex', ex) +
row('kp_un', p.un ? esc(nf(p.un, l)) + (p.pmin ? ' · ' + bdi(rm(p.pmin, l) + ' - ' + rm(p.pmax || p.pmin, l)) : '') : '') + row('kp_lic', p.lic ? bdi(p.lic) + (p.lt ? ' <span class="k-xs">' + esc(tf(l, 'kp_to', { d: fd(p.lt, l) })) + '</span>' : '') : '') +
row('kp_src', p.u ? '<a href="' + esc(p.u) + '" rel="nofollow noopener">' + esc(host(p.u)) + '</a> <span class="k-xs">' + esc(tf(l, 'kp_read', { d: fd(p.d, l) })) + '</span>' : '') + '</dl>';
}
const osStage = (l, st) => st === 'under construction' ? t(l, 'os_uc') : st === 'off-plan' ? t(l, 'os_op') : st;
function osNote(l, slug, L, id) {
const o = KP && KP.os && KP.os[slug], p = o && L.find(x => kst(x) === 'done'); if (!p) return '';
const src = o[2] ? '<a href="' + esc(o[2]) + '" rel="nofollow noopener">' + esc(host(o[2])) + '</a>' : '';
const our = '<b>' + esc(osStage(l, o[0])) + '</b> <span class="k-xs">' + (o[3] ? esc(tf(l, 'os_from', { h: '\u0001', d: fd(o[1], l) })).replace('\u0001', src) : esc(tf(l, 'os_since', { d: fd(o[1], l), h: '\u0001' })).replace('\u0001', src)) + '</span>';
const reg = stB(l, p) + (p.u ? ' <span class="k-xs"><a href="' + esc(p.u) + '" rel="nofollow noopener">' + esc(host(p.u)) + '</a> ' + esc(tf(l, 'kp_read', { d: fd(p.d || KP.built, l) })) + '</span>' : '');
return '<div class="n37-os" id="' + id + TB.kbx_n37u__t.k127 + esc(t(l, 'os_h')) + '</b></p><dl class="n37-kd"><dt>' + esc(t(l, 'os_reg')) + '</dt><dd>' + reg + '</dd><dt>' + esc(t(l, 'os_our')) + '</dt><dd>' + our + TB.kbx_n37u__t.k128 + esc(t(l, 'os_n')) + '</p></div>';
}
function kpBlock(l, slug, id, h) {
const L = KP && KP.p[slug]; if (!L) return '';
const r = IX.bySlug.get(slug), H = h || 'h2';
return KPC + '<section class="n37-kp" id="' + id + '" aria-labelledby="' + id + '-h"' + dir(l) + '><' + H + ' id="' + id + '-h">' + esc(t(l, 'kp_h')) + '</' + H + '><p class="k-xs" style="margin:0">' + esc(t(l, 'kp_n')) + '</p>' +
osNote(l, slug, L, id) + L.map(p => (L.length > 1 ? '<h3>' + esc(tf(l, 'kp_code', { c: p.c })) + '</h3>' : '') + kpPhase(l, p)).join('') +
'<p style="margin:6px 0 0"><a href="' + pre(l) + '/registers/malaysia/">' + esc(t(l, 'kp_all')) + '</a>' + (r && r[5] ? TB.kbx_n37u__t.k129 + pre(l) + '/developers/' + r[5] + '/#n37-dreg">' + esc(tf(l, 'dr_link', { d: r[6] || r[5] })) + '</a>' : '') + '</p></section>';
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
return KPC + TB.kbx_n37u__t.k130 + dir(l) + '><h2 id="n37-kpm-h">' + esc(tf(l, 'km_h', { m })) + '</h2><p>' + esc(tf(l, 'km_p', { n: nf(c.n, l), p: nf(c.pr, l), d: fd(KP.built || D.built, l) })) + '</p><ul>' +
'<li>' + esc(tf(l, 'km_st', { ok: nf(c.ok, l), ns: nf(c.ns, l), late: nf(c.late3, l), done: nf(c.done, l) })) + '</li>' +
'<li>' + esc(tf(l, 'km_ext', { e: nf(c.ext.length, l), s: nf(c.withSpa, l), md: nf(c.med, l), mx: nf(c.ext.length ? Math.max.apply(null, c.ext) : 0, l) })) + '</li>' +
'<li>' + esc(tf(l, 'km_past', { n: nf(c.past, l) })) + '</li><li>' + esc(tf(l, 'km_pexp', { n: nf(c.pexp, l) })) + '</li></ul>' +
'<p><a href="' + pre(l) + '/registers/malaysia/#' + slugM(m) + '">' + esc(t(l, 'kp_all')) + TB.kbx_n37u__t.k131 + pre(l) + '/data/markets/">' + esc(t(l, 'mc_h1')) + '</a></p></section>';
}
const kpTh = (l, ks) => '<thead><tr>' + ks.map(k => '<th scope="col">' + esc(t(l, k)) + '</th>').join('') + '</tr></thead>';
const kpTw = (l, inner) => TB.kbx_n37u__t.k132 + esc(t(l, 'tw_l')) + '"><table>' + inner + '</table></div>';
const kpP = (l, x) => '<th scope="row"><a href="' + pre(l) + '/projects/' + x[0] + '/">' + bdi(x[2][2]) + '</a>' + (KP.p[x[0]].length > 1 ? ' <span class="k-xs">' + esc(x[1].c) + '</span>' : '') + '</th>';
async function kpPage(env, shell, l) {
const P = pre(l), all = kpRows(null), MK = [...new Set(all.map(x => x[2][3]))].sort((a, b) => kpRows(b).length - kpRows(a).length);
let b = KPC + '<p>' + esc(tf(l, 'kr_p', { n: nf(all.length, l), p: nf(new Set(all.map(x => x[0])).size, l), d: fd(KP.built || D.built, l) })) + TB.kbx_n37u__t.k133;
b += '<h2 id="sum">' + esc(t(l, 'kr_sum')) + '</h2>' + kpTw(l, kpTh(l, ['gp_m', 'kr_n', 'kst_ok', 'kst_ns', 'kst_late', 'kst_done', 'kr_ext', 'kr_med', 'kr_past', 'kr_pexp']) + '<tbody>' + MK.map(m => { const c = kpSum(kpRows(m));
return '<tr id="' + slugM(m) + '"><th scope="row"><a href="/m/' + slugM(m) + '/#n37-kpm">' + bdi(m) + '</a></th>' + [c.n, c.ok, c.ns, c.late3, c.done, c.ext.length, c.med, c.past, c.pexp].map(v => '<td class="n">' + nf(v, l) + '</td>').join('') + '</tr>'; }).join('') + '</tbody>');
b += '<p class="k-xs">' + esc(t(l, 'kr_def')) + '</p>';
const osL = KP.os ? Object.keys(KP.os).filter(s => KP.p[s] && IX.bySlug.get(s)) : [];
if (osL.length) b += '<h2 id="stage">' + esc(tf(l, 'os_lh', { n: nf(osL.length, l) })) + '</h2><p class="k-xs">' + esc(t(l, 'os_n')) + '</p><ul>' + osL.map(s => { const r = IX.bySlug.get(s), o = KP.os[s]; return '<li><a href="' + P + '/projects/' + s + '/#n37-kp-stage">' + bdi(r[2]) + '</a>: ' + esc(t(l, 'os_reg')) + ' ' + esc(t(l, 'kst_done')) + ' · ' + esc(t(l, 'os_our')) + ' ' + esc(osStage(l, o[0])) + ' <span class="k-xs">(' + esc(fd(o[1], l)) + ')</span></li>'; }).join('') + '</ul>';
const late = all.filter(x => kpInfo(x[1]).late);
b += '<h2 id="late">' + esc(tf(l, 'kr_late', { n: nf(late.length, l) })) + '</h2>' + (late.length ? kpTw(l, kpTh(l, ['th_p', 'kp_st', 'kp_pc', 'kp_vp', 'kp_ex']) + '<tbody>' + late.map(x => '<tr>' + kpP(l, x) + '<td>' + stB(l, x[1]) + '</td><td class="n">' + (x[1].pc ? bdi(pcf(x[1].pc, l)) : '') + '</td><td class="n">' + esc(fd(x[1].vp, l)) + '</td><td class="n">' + (x[1].ext ? esc(tf(l, 'kr_extv', { n: nf(x[1].ext, l), d: fd(x[1].vp2, l) })) : '') + '</td></tr>').join('') + '</tbody>') : '<p>' + esc(t(l, 'none')) + '</p>');
const ext = all.filter(x => x[1].ext).sort((a, c) => c[1].ext - a[1].ext || a[2][2].localeCompare(c[2][2])).slice(0, 25);
b += '<h2 id="ext">' + esc(t(l, 'kr_exth')) + '</h2><p>' + esc(t(l, 'kr_extp')) + '</p>' + kpTw(l, kpTh(l, ['th_p', 'kr_ext', 'kp_vp', 'kr_new', 'kp_st', 'kp_pc']) + '<tbody>' + ext.map(x => '<tr>' + kpP(l, x) + '<td class="n">' + nf(x[1].ext, l) + '</td><td class="n">' + esc(fd(x[1].vp, l)) + '</td><td class="n">' + esc(fd(x[1].vp2, l)) + '</td><td>' + stB(l, x[1]) + '</td><td class="n">' + (x[1].pc ? bdi(pcf(x[1].pc, l)) : '') + '</td></tr>').join('') + '</tbody>');
const past = all.filter(x => kpInfo(x[1]).past).sort((a, c) => (kpInfo(a[1]).due < kpInfo(c[1]).due ? -1 : 1));
b += '<h2 id="past">' + esc(tf(l, 'kr_pasth', { n: nf(past.length, l) })) + '</h2><p>' + esc(t(l, 'kr_pastp')) + '</p>' + (past.length ? kpTw(l, kpTh(l, ['th_p', 'kr_due', 'kp_st', 'kp_pc']) + '<tbody>' + past.map(x => '<tr>' + kpP(l, x) + '<td class="n">' + esc(fd(kpInfo(x[1]).due, l)) + '</td><td>' + stB(l, x[1]) + '</td><td class="n">' + (x[1].pc ? bdi(pcf(x[1].pc, l)) : '') + '</td></tr>').join('') + '</tbody>') : '');
const pe = all.filter(x => { const o = kpInfo(x[1]); return o.pexp != null && o.pexp >= 0 && o.pexp <= 180; }).sort((a, c) => (a[1].vt < c[1].vt ? -1 : 1));
b += '<h2 id="permits">' + esc(tf(l, 'kr_peh', { n: nf(pe.length, l) })) + '</h2><p>' + esc(t(l, 'kr_pep')) + '</p>' + (pe.length ? kpTw(l, kpTh(l, ['th_p', 'kp_pn', 'kr_vt', 'kp_st']) + '<tbody>' + pe.map(x => '<tr>' + kpP(l, x) + '<td>' + bdi(x[1].pn) + '</td><td class="n">' + esc(fd(x[1].vt, l)) + '</td><td>' + stB(l, x[1]) + '</td></tr>').join('') + '</tbody>') : '');
b += TB.kbx_n37u__t.k134 + esc(t(l, 'kr_json')) + TB.kbx_n37u__t.k135 + esc(t(l, 'code')) + TB.kbx_n37u__t.k136 + P + '/data/markets/">' + esc(t(l, 'mc_h1')) + TB.kbx_n37u__t.k137 + n38u(l, 'delays/') + '">' + esc(t(l, 'dl_h1')) + TB.kbx_n37u__t.k138 + P + TB.kbx_n37u__t.k139 + P + '/m/malaysia/">Malaysia</a></p>';
b += '<p><a href="' + pre(l) + '/registers/lookup/">' + esc(t(l, 'k_h1')) + '</a></p>';
return page(shell, l, { path: '/registers/malaysia/', h1: t(l, 'kr_h1'), lead: t(l, 'kr_lead'), body: b, crumb: [[t(l, 'kr_regs'), '/registers/']] });
}
function regShare(rows) { let h = 0, g = 0, any = 0; for (const r of rows) { let a = 0; for (const c of r[8]) if (c) { h++; if (c[2] === 'reg') { g++; a = 1; } } any += a; } return { h, g, any, n: rows.length }; }
function devReg(l, slug) {
const rows = IX.byDev.get(slug) || []; if (!rows.length) return '';
const s = regShare(rows), byM = new Map(); for (const r of rows) (byM.get(r[3]) || byM.set(r[3], []).get(r[3])).push(r);
const kp = KP ? rows.filter(r => KP.p[r[1]]) : [];
let b = '<h3 id="n37-dreg">' + esc(t(l, 'dr_h')) + '</h3><p>' + esc(tf(l, 'dr_p', { g: nf(s.g, l), h: nf(s.h, l), p: nf(share(s.g, s.h), l), a: nf(s.any, l), n: nf(s.n, l) })) + '</p>';
if (byM.size > 1) b += '<ul class="n37-rel">' + [...byM].sort((a, c) => c[1].length - a[1].length).map(([m, rs]) => { const x = regShare(rs); return '<li><a href="/m/' + slugM(m) + '/">' + bdi(m) + '</a>&nbsp;<span class="k-xs">' + esc(tf(l, 'dr_m', { g: nf(x.g, l), h: nf(x.h, l), n: nf(rs.length, l) })) + '</span></li>'; }).join('') + '</ul>';
if (kp.length) b += '<h3>' + esc(t(l, 'dr_kp')) + '</h3>' + kpTw(l, kpTh(l, ['th_p', 'kp_pn', 'kr_vt', 'kp_st', 'kp_vp']) + '<tbody>' + kp.flatMap(r => KP.p[r[1]].map(p => [r[1], p, r])).map(x => '<tr>' + kpP(l, x) + '<td>' + (x[1].pn ? bdi(x[1].pn) : '') + '</td><td class="n">' + esc(fd(x[1].vt, l)) + '</td><td>' + stB(l, x[1]) + '</td><td class="n">' + esc(fd(x[1].vp2 || x[1].vp, l)) + '</td></tr>').join('') + '</tbody>') + '<p><a href="' + pre(l) + '/registers/malaysia/">' + esc(t(l, 'kp_all')) + '</a></p>';
return b + dvRank(l, slug) + '<p><a href="' + pre(l) + '/data/markets/">' + esc(t(l, 'mc_h1')) + '</a>' + TB.kbx_n37u__t.DOT + '<a href="' + n38u(l, 'developers/') + '">' + esc(t(l, 'dv_h1')) + '</a></p>';
}
const MCS = { n: 'mc_n', med: 'gp_md', five: 'mc_five', reg: 'mc_reg', any: 'mc_any', rg: 'mc_rg' };
function mcRows() {
if (IX.mc) return IX.mc;
return (IX.mc = Object.entries(D.mk).map(([m, v]) => { const rows = IX.byMk.get(m) || [], s = regShare(rows), F = D.f, lo = v.cov.indexOf(Math.min.apply(null, v.cov));
return { m, n: rows.length, med: v.med, five: share(rows.filter(r => cnt(r) >= 5).length, rows.length), reg: share(s.g, s.h), any: share(s.any, rows.length), rg: (D.rg[m] || D.rg[v.co === 'USA' ? 'United States' : v.co] || []).length, lo: F[lo], loc: v.cov[lo], kp: KP ? kpRows(m).length : 0 }; }));
}
async function mcPage(env, shell, l, u) {
const P = pre(l), so = MCS[String(u && u.searchParams.get('s') || '')] ? u.searchParams.get('s') : 'n';
const R = mcRows().slice().sort((a, c) => c[so] - a[so] || c.n - a.n || a.m.localeCompare(c.m));
const top = mcRows().filter(x => x.n >= 20).sort((a, c) => c.reg - a.reg)[0];
let b = '<p>' + esc(tf(l, 'mc_p', { m: nf(R.length, l) })) + (top ? ' ' + esc(tf(l, 'mc_top', { m: top.m, r: nf(top.reg, l) })) : '') + TB.kbx_n37u__t.k140 + esc(t(l, 'mc_sort')) + '">' + esc(t(l, 'mc_sort')) + ': ' +
Object.keys(MCS).map(k => k === so ? '<b>' + esc(t(l, MCS[k])) + '</b>' : '<a href="' + P + '/data/markets/' + (k === 'n' ? '' : '?s=' + k) + '" rel="nofollow">' + esc(t(l, MCS[k])) + '</a>').join(' · ') + '</p>';
b += kpTw(l, '<thead><tr><th scope="col">' + esc(t(l, 'gp_m')) + '</th>' + Object.keys(MCS).map(k => '<th scope="col"' + (k === so ? ' aria-sort="descending"' : '') + '>' + esc(t(l, MCS[k])) + '</th>').join('') + '<th scope="col">' + esc(t(l, 'mc_lo')) + '</th></tr></thead><tbody>' +
R.map(x => '<tr><th scope="row"><a href="/m/' + slugM(x.m) + '/#n37-facts">' + bdi(x.m) + '</a> <a class="k-xs" href="' + P + '/data/markets/' + slugM(x.m) + '/">' + esc(t(l, 'ms_s')) + '</a>' + (x.kp ? ' <a class="k-xs" href="' + P + '/registers/malaysia/#' + slugM(x.m) + '">KPKT</a>' : '') + '</th><td class="n">' + nf(x.n, l) + '</td><td class="n">' + nf(x.med, l) + ' / 10</td><td class="n">' + bdi(nf(x.five, l) + '%') + '</td><td class="n">' + bdi(nf(x.reg, l) + '%') + '</td><td class="n">' + bdi(nf(x.any, l) + '%') + '</td><td class="n">' + nf(x.rg, l) + '</td><td>' + esc(t(l, 'f_' + x.lo)) + ' <span class="k-xs">' + bdi(nf(x.loc, l) + '%') + '</span></td></tr>').join('') + '</tbody>');
b += '<p class="k-xs">' + esc(t(l, 'mc_def')) + '</p><p><a href="' + n38u(l, 'pipeline/') + '">' + esc(t(l, 'pl_h1')) + '</a>' + TB.kbx_n37u__t.DOT + '<a href="' + n38u(l, 'delays/') + '">' + esc(t(l, 'dl_h1')) + '</a>' + TB.kbx_n37u__t.DOT + '<a href="' + n38u(l, 'heat/') + '">' + esc(t(l, 'e_h1')) + '</a>' + TB.kbx_n37u__t.DOT + '<a href="' + n38u(l, 'developers/') + '">' + esc(t(l, 'dv_h1')) + '</a>' + TB.kbx_n37u__t.DOT + '<a href="' + P + '/search/#saved">' + esc(t(l, 'ss_h')) + '</a></p><p><a href="' + P + '/data/gaps/">' + esc(t(l, 'gp_link')) + TB.kbx_n37u__t.k141 + P + '/data/how-we-verify/">' + esc(t(l, 'vf_l')) + TB.kbx_n37u__t.k142 + P + '/registers/malaysia/">' + esc(t(l, 'kr_h1')) + TB.kbx_n37u__t.k143 + esc(t(l, 'csv_l')) + '</a></p>';
return page(shell, l, { path: '/data/markets/', h1: t(l, 'mc_h1'), lead: t(l, 'mc_lead'), body: b, crumb: [[t(l, 'data'), pre(l) + '/data/']] });
}
export async function regMap(env) { if (!(await load(env))) return null; if (!IX.rgc) { const m = new Map(); for (const x of D.p) { let g = 0; for (const c of x[8]) if (c && c[2] === 'reg') g++; if (g) m.set(x[1], g); } IX.rgc = m; } return IX.rgc; }
export function rgT(l, k, v) { return v ? tf(l, k, v) : t(l, k); }
const yOf = v => { const m = /(20\d\d)/.exec(String(v == null ? '' : v)); return m ? +m[1] : null; };
const cpN = v => { const m = /^([\d.]+)\s*%/.exec(String(v == null ? '' : v)); return m ? +m[1] : null; };
const YLO = 2025, YHI = 2031, YRS = [YLO, 2026, 2027, 2028, 2029, 2030, YHI];
const yB = y => y <= YLO ? YLO : y >= YHI ? YHI : y;
const yL = (l, y) => y === YLO ? tf(l, 'pl_ylo', { y }) : y === YHI ? tf(l, 'pl_yhi', { y }) : String(y);
const n38u = (l, p) => pre(l) + '/data/' + p;
function pipe(m) {
if (!IX.pp) IX.pp = new Map();
if (IX.pp.has(m)) return IX.pp.get(m);
const rows = IX.byMk.get(m) || [], Y = {}; let d = 0;
for (const y of YRS) Y[y] = [0, 0, 0, 0];
for (const r of rows) { const h = r[8][0], y = h && yOf(h[0]); if (!y) continue; d++; const z = Y[yB(y)]; z[0]++; const u = r[8][2]; if (u && typeof u[0] === 'number') { z[1] += u[0]; z[2]++; } if (h[2] === 'reg') z[3]++; }
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
return kpTw(l, kpTh(l, ['pl_y', 'pl_p', 'pl_u', 'pl_g']) + '<tbody>' + YRS.map(y => { const z = o.Y[y]; return '<tr><th scope="row">' + esc(yL(l, y)) + '</th><td class="n">' + nf(z[0], l) + '</td><td class="n">' + (z[2] ? nf(z[1], l) + ' <span class="k-xs">' + esc(tf(l, 'pl_uof', { a: nf(z[2], l), b: nf(z[0], l) })) + '</span>' : '') + '</td><td class="n">' + bdi(nf(share(z[3], z[0]), l) + '%') + '</td></tr>'; }).join('') + '</tbody>');
}
async function pipePage(env, shell, l, u) {
const P = pre(l), MK = pipeMk(), q = String(u && u.searchParams.get('m') || ''), m = MK.includes(q) ? q : (MK.includes('Dubai') ? 'Dubai' : MK[0]), o = pipe(m);
let b = '<p>' + esc(tf(l, 'pl_p1', { n: nf(MK.length, l), d: fd(D.built, l) })) + TB.kbx_n37u__t.k144 + P + '/data/pipeline/"><label>' + esc(t(l, 'pl_pick')) + ' <select name="m">' + MK.map(x => '<option value="' + esc(x) + '"' + (x === m ? ' selected' : '') + '>' + esc(x) + ' (' + nf(pipe(x).d, l) + ')</option>').join('') + TB.kbx_n37u__t.k145;
b += '<h2 id="m">' + esc(tf(l, 'pl_mh', { m })) + '</h2><p>' + esc(tf(l, 'pl_mp', { d: nf(o.d, l), n: nf(o.n, l), m })) + '</p>' + bars(l, m, o) + pipeTable(l, m, o);
b += '<p>' + '<a href="/m/' + slugM(m) + '/">' + bdi(m) + '</a>' + TB.kbx_n37u__t.DOT + '<a href="' + n38u(l, 'markets/' + slugM(m) + '/') + '">' + esc(t(l, 'ms_l')) + '</a>' + TB.kbx_n37u__t.DOT + '<a href="' + n38u(l, 'delays/') + '#mk-' + slugM(m) + '">' + esc(t(l, 'dl_h1')) + '</a></p>';
b += '<h2 id="all">' + esc(t(l, 'pl_ah')) + '</h2>' + kpTw(l, '<thead><tr><th scope="col">' + esc(t(l, 'gp_m')) + '</th><th scope="col">' + esc(t(l, 'pl_d')) + '</th>' + YRS.map(y => '<th scope="col">' + esc(y === YLO ? '≤' + y : y === YHI ? y + '+' : String(y)) + '</th>').join('') + '</tr></thead><tbody>' +
MK.map(x => { const z = pipe(x); return '<tr id="mk-' + slugM(x) + '"' + (x === m ? ' class="n38-hi"' : '') + '><th scope="row"><a href="' + P + '/data/pipeline/?m=' + encodeURIComponent(x) + '#m" rel="nofollow">' + bdi(x) + '</a></th><td class="n">' + nf(z.d, l) + ' / ' + nf(z.n, l) + '</td>' + YRS.map(y => '<td class="n">' + nf(z.Y[y][0], l) + '</td>').join('') + '</tr>'; }).join('') + '</tbody>');
b += '<p class="k-xs">' + esc(t(l, 'pl_def')) + '</p>';
return page(shell, l, { path: '/data/pipeline/', h1: t(l, 'pl_h1'), lead: t(l, 'pl_lead'), body: TB.kbx_n37u__s.N38C + b, noindex: !!q, crumb: [[t(l, 'data'), P + '/data/']] });
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
let b = '<div class="n38-t"><div><b>' + nf(lp, l) + '</b><span>' + esc(tf(l, 'dl_t1', { a: fd(a, l) })) + '</span></div><div><b>' + nf(median(A.late.map(x => x.dm)), l) + '</b><span>' + esc(t(l, 'dl_t2')) + '</span></div><div><b>' + nf(A.od.length, l) + '</b><span>' + esc(t(l, 'dl_t3')) + '</span></div>' +
(KP ? '<div><b>' + nf(kpSum(kpRows(null)).late3, l) + '</b><span>' + esc(t(l, 'dl_t4')) + '</span></div>' : '') + '</div>';
b += '<h2 id="how">' + esc(t(l, 'dl_hh')) + '</h2><ol><li>' + esc(tf(l, 'dl_h1x', { a: fd(a, l), b: fd(days.length ? days[days.length - 1][0] : D.built, l), n: nf(days.length, l) })) + '</li><li>' + esc(t(l, 'dl_h2x')) + '</li><li>' + esc(t(l, 'dl_h3x')) + '</li></ol><p class="k-xs">' + esc(t(l, 'dl_not')) + '</p>';
b += '<h2 id="markets">' + esc(t(l, 'dl_mh')) + '</h2>' + kpTw(l, kpTh(l, ['gp_m', 'pl_d', 'dl_tr', 'dl_lt', 'dl_md', 'dl_er', 'dl_od', 'dl_kp']) + '<tbody>' + A.ms.map(z => '<tr id="mk-' + slugM(z.m) + '"><th scope="row"><a href="/m/' + slugM(z.m) + '/">' + bdi(z.m) + '</a></th><td class="n">' + nf(z.d, l) + '</td><td class="n">' + nf(z.tr, l) + '</td><td class="n">' + nf(new Set(z.late.map(x => x.r[1])).size, l) + '</td><td class="n">' + (z.late.length ? nf(median(z.late.map(x => x.dm)), l) : '') + '</td><td class="n">' + nf(z.early, l) + '</td><td class="n">' + nf(z.od, l) + '</td><td class="n">' + (z.kp ? '<a href="' + P + '/registers/malaysia/#' + slugM(z.m) + '">' + nf(z.kp.late3, l) + ' / ' + nf(z.kp.n, l) + '</a>' : '') + '</td></tr>').join('') + '</tbody>');
const L = A.late.slice().sort((x, y) => y.dm - x.dm || (x.x.d < y.x.d ? 1 : -1)).slice(0, 40);
b += '<h2 id="later">' + esc(tf(l, 'dl_lh', { n: nf(L.length, l), t: nf(A.late.length, l) })) + '</h2>' + kpTw(l, kpTh(l, ['th_p', 'ch_mk', 'ch_from', 'ch_to', 'tr_by', 'tr_seen']) + '<tbody>' + L.map(x => '<tr><th scope="row"><a href="' + recU(l, x.r[1]) + '#timeline">' + bdi(x.r[2]) + '</a></th><td>' + bdi(x.r[3]) + '</td><td class="n">' + bdi(tv(x.x.p, l, 40)) + '</td><td class="n">' + bdi(tv(x.x.v, l, 40)) + '</td><td class="n">' + esc(byM(l, x.dm)) + '</td><td class="n">' + esc(fd(x.x.d, l)) + '</td></tr>').join('') + '</tbody>');
b += '<h2 id="passed">' + esc(tf(l, 'dl_oh', { n: nf(A.od.length, l) })) + '</h2><p>' + esc(t(l, 'dl_op')) + '</p>' + (A.od.length ? kpTw(l, kpTh(l, ['th_p', 'ch_mk', 'f_ho', 'f_cp', 'th_s']) + '<tbody>' + A.od.map(([r, p]) => { const c = r[8][6], u = c[1]; return '<tr><th scope="row"><a href="' + pre(l) + '/projects/' + r[1] + '/">' + bdi(r[2]) + '</a></th><td>' + bdi(r[3]) + '</td><td class="n">' + bdi(tv(r[8][0][0], l, 30)) + '</td><td class="n">' + bdi(nf(p, l) + '%') + '</td><td>' + (u && /^https?:/.test(u) ? '<a href="' + esc(u) + '" rel="nofollow noopener">' + esc(host(u)) + '</a> ' : '') + '<span class="k-xs">' + esc(fd(c[3], l)) + '</span></td></tr>'; }).join('') + '</tbody>') : '<p>' + esc(t(l, 'none')) + '</p>');
b += '<p>' + '<a href="' + P + '/data/changes/week/">' + esc(t(l, 'wk_h1')) + '</a>' + TB.kbx_n37u__t.DOT + '<a href="' + P + '/registers/malaysia/#late">' + esc(t(l, 'kr_h1')) + '</a>' + TB.kbx_n37u__t.DOT + '<a href="' + n38u(l, 'pipeline/') + '">' + esc(t(l, 'pl_h1')) + '</a>' + TB.kbx_n37u__t.DOT + '<a href="' + n38u(l, 'heat/') + '">' + esc(t(l, 'e_h1')) + '</a>' + TB.kbx_n37u__t.DOT + '<a href="/data/n37u-tl.json">' + esc(t(l, 'dl')) + '</a></p>';
return page(shell, l, { path: '/data/delays/', h1: t(l, 'dl_h1'), lead: t(l, 'dl_lead'), body: TB.kbx_n37u__s.N38C + b, crumb: [[t(l, 'data'), P + '/data/']] });
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
let b = '<p>' + esc(tf(l, 'dv_p1', { n: nf(all.length, l), t: nf(top, l), z: nf(z, l) })) + TB.kbx_n37u__t.k146 + esc(t(l, 'mc_sort')) + '">' + esc(t(l, 'mc_sort')) + ': ' + Object.keys(DLS).map(k => k === so ? '<b>' + esc(t(l, DLS[k])) + '</b>' : '<a href="' + P + '/data/developers/' + (k === 'g' ? '' : '?s=' + k) + '" rel="nofollow">' + esc(t(l, DLS[k])) + '</a>').join(' · ') + '</p>';
b += kpTw(l, TB.kbx_n37u__t.k147 + esc(t(l, 'dv_d')) + '</th>' + Object.keys(DLS).map(k => '<th scope="col"' + (k === so ? ' aria-sort="descending"' : '') + '>' + esc(t(l, DLS[k])) + '</th>').join('') + '<th scope="col">' + esc(t(l, 'gp_m')) + '</th></tr></thead><tbody>' +
R.map(x => '<tr id="d-' + x.s + '"><td class="n">' + nf(x.rk, l) + '</td><th scope="row"><a href="' + P + '/developers/' + x.s + '/#n37-dreg">' + bdi(x.d) + '</a></th><td class="n">' + bdi(nf(x.g, l) + '%') + ' <span class="k-xs">' + nf(x.gg, l) + '/' + nf(x.h, l) + '</span></td><td class="n">' + nf(x.n, l) + '</td><td class="n">' + bdi(nf(x.any, l) + '%') + '</td><td class="n">' + nf(x.med, l) + ' / 10</td><td class="n">' + nf(x.mk, l) + '</td><td>' + x.ms.map(bdi).join(', ') + (x.mk > 3 ? '…' : '') + '</td></tr>').join('') + '</tbody>');
b += '<p class="k-xs">' + esc(t(l, 'dv_def')) + '</p><p><a href="' + P + '/developers/compare/">' + esc(t(l, 'dv_cmp')) + '</a>' + TB.kbx_n37u__t.DOT + '<a href="' + P + '/data/markets/">' + esc(t(l, 'mc_h1')) + '</a>' + TB.kbx_n37u__t.DOT + '<a href="' + P + '/data/how-we-verify/">' + esc(t(l, 'vf_l')) + '</a></p>';
return page(shell, l, { path: '/data/developers/', h1: t(l, 'dv_h1'), lead: t(l, 'dv_lead'), body: TB.kbx_n37u__s.N38C + b, noindex: !!q, crumb: [[t(l, 'data'), P + '/data/'], [t(l, 'mc_h1'), P + '/data/markets/']] });
}
function dvRank(l, slug) { const x = dvRows().find(y => y.s === slug); return x ? '<p id="n38-dvr"><a href="' + n38u(l, 'developers/') + '#d-' + slug + '">' + esc(tf(l, 'dv_rk', { r: nf(x.rk, l), n: nf(dvRows().length, l), g: nf(x.g, l) })) + '</a></p>' : ''; }
async function sheetPage(env, shell, l, m) {
const P = pre(l), rows = IX.byMk.get(m) || [], v = D.mk[m], F = D.f, c = factCounts(rows), s = regShare(rows), o = pipe(m), A = dlAll(), dz = A.ms.find(z => z.m === m), byK = rows.slice().sort((a, b) => cnt(b) - cnt(a) || a[2].localeCompare(b[2])), sl = slugM(m);
let b = TB.kbx_n37u__t.k148 + esc(t(l, 'ms_pr')) + '</button> <span class="k-xs">' + esc(t(l, 'ms_prn')) + '</span></p>' +
'<div class="n38-t"><div><b>' + nf(rows.length, l) + '</b><span>' + esc(t(l, 'ms_r')) + '</span></div><div><b>' + nf(v.med, l) + ' / 10</b><span>' + esc(t(l, 'gp_md')) + '</span></div><div><b>' + bdi(nf(share(s.g, s.h), l) + '%') + '</b><span>' + esc(t(l, 'mc_reg')) + '</span></div><div><b>' + bdi(nf(share(rows.filter(r => cnt(r) >= 5).length, rows.length), l) + '%') + '</b><span>' + esc(t(l, 'mc_five')) + '</span></div></div>';
b += '<h2>' + esc(t(l, 'ms_cov')) + '</h2>' + kpTw(l, kpTh(l, ['th_f', 'th_hold', 'th_here', 'th_regs']) + '<tbody>' + F.map((f, i) => '<tr><th scope="row">' + esc(t(l, 'f_' + f)) + '</th><td class="n">' + nf(c.h[i], l) + ' / ' + nf(rows.length, l) + '</td><td class="n">' + bdi(nf(share(c.h[i], rows.length), l) + '%') + '</td><td class="n">' + nf(c.g[i], l) + '</td></tr>').join('') + '</tbody>');
if (o.d) b += '<h2>' + esc(tf(l, 'pl_mh', { m })) + '</h2><p>' + esc(tf(l, 'pl_mp', { d: nf(o.d, l), n: nf(o.n, l), m })) + '</p>' + pipeTable(l, m, o);
if (dz) b += '<h2>' + esc(t(l, 'dl_h1')) + '</h2><ul><li>' + esc(tf(l, 'ms_d1', { n: nf(new Set(dz.late.map(x => x.r[1])).size, l), t: nf(dz.tr, l), md: nf(dz.late.length ? median(dz.late.map(x => x.dm)) : 0, l) })) + '</li><li>' + esc(tf(l, 'ms_d2', { n: nf(dz.od, l) })) + '</li>' + (dz.kp ? '<li>' + esc(tf(l, 'ms_d3', { n: nf(dz.kp.late3, l), t: nf(dz.kp.n, l) })) + '</li>' : '') + '</ul>';
const rg = regsFor(rows[0] || [0, 0, 0, m]);
if (rg.length) b += '<h2>' + esc(t(l, 'ms_rg')) + '</h2><ul>' + rg.map(x => '<li><a href="' + esc(x[1]) + '" rel="nofollow noopener">' + bdi(x[0]) + '</a> <span class="k-xs">(' + esc(host(x[1])) + ')</span>: ' + esc(x[2].map(f => t(l, 'f_' + f)).join(', ')) + ' <span class="k-xs">' + esc(tf(l, 'ms_chk', { d: fd(x[4], l) })) + '</span></li>').join('') + '</ul>';
b += areaBlock(l, m) + nextBlock(l, m);
b += '<h2>' + esc(t(l, 'mk_best')) + '</h2>' + recList(l, byK.slice(0, 5)) + '<h2>' + esc(t(l, 'mk_thin')) + '</h2>' + recList(l, byK.slice(-5).reverse());
b += '<p class="k-xs">' + esc(tf(l, 'ms_foot', { u: ORIGIN + P + '/data/markets/' + sl + '/', d: fd(D.built, l) })) + '</p><p class="n38-np"><a href="/m/' + sl + '/">' + bdi(m) + '</a>' + TB.kbx_n37u__t.DOT + '<a href="' + n38u(l, 'pipeline/') + '?m=' + encodeURIComponent(m) + '#m" rel="nofollow">' + esc(t(l, 'pl_h1')) + '</a>' + TB.kbx_n37u__t.DOT + '<a href="' + n38u(l, 'delays/') + '#mk-' + sl + '">' + esc(t(l, 'dl_h1')) + '</a></p>' +
TB.kbx_n37u__s.k26;
return page(shell, l, { path: '/data/markets/' + sl + '/', h1: tf(l, 'ms_h1', { m }), lead: tf(l, 'ms_lead', { m, n: nf(rows.length, l) }), body: TB.kbx_n37u__s.N38C + b, noindex: true, crumb: [[t(l, 'data'), P + '/data/'], [t(l, 'mc_h1'), P + '/data/markets/']] });
}
function supplyLine(l, x) {
const h = x[8][0], y = h && yOf(h[0]); if (!y || y < 2026) return '';
const z = pipe(x[3]).Y[yB(y)]; if (!z || z[0] < 3) return '';
return '<p class="n37-in" id="n38-sup"' + dir(l) + '>' + esc(tf(l, z[2] ? 'sp_u' : 'sp_p', { y: yL(l, yB(y)), m: x[3], p: nf(z[0] - 1, l), u: nf(z[1], l), k: nf(z[2], l) })) + ' <a href="' + n38u(l, 'pipeline/') + '?m=' + encodeURIComponent(x[3]) + '#m" rel="nofollow">' + esc(t(l, 'pl_h1')) + '</a></p>';
}
function savedBox(l, nonce) {
const L = { save: t(l, 'ss_save'), saved: t(l, 'ss_done'), rm: t(l, 'ss_rm'), noq: t(l, 'ss_noq'), full: t(l, 'ss_full'), loc: LOC[l] || 'en-GB' };
return '<section class="wrap n37" id="saved"' + dir(l) + ' data-t="' + esc(JSON.stringify(L)) + TB.kbx_n37u__s.k27 +
'<h2>' + esc(t(l, 'ss_h')) + TB.kbx_n37u__t.k149 + esc(t(l, 'ss_p')) + TB.kbx_n37u__t.k150 + esc(L.save) + TB.kbx_n37u__s.k28 + esc(t(l, 'ss_e')) + '</p></section>' +
'<script' + (nonce ? ' nonce="' + esc(nonce) + '"' : '') + TB.kbx_n37u__s.k29 +
TB.kbx_n37u__s.k30 +
TB.kbx_n37u__s.k31 +
TB.kbx_n37u__s.k32 +
TB.kbx_n37u__s.k33;
}
const P39 = l => pre(l);
const t39u = (l, s) => P39(l) + '/projects/' + s + '/';
const lnk = (h, s, x) => '<a href="' + esc(h) + '"' + (x || '') + '>' + esc(s) + '</a>';
const ext = (u, s) => u && /^https?:/.test(u) ? '<a href="' + esc(u) + '" rel="nofollow noopener">' + esc(s || host(u)) + '</a>' : '';
const cellOf = (r, f) => r[8][D.f.indexOf(f)] || null;
let ECB39 = null;
async function ecb39() {
if (ECB39 && Date.now() - ECB39.t < 43200000) return ECB39.v;
try {
const r = await fetch(TB.kbx_n37u__t.k151, { cf: { cacheTtl: 21600, cacheEverything: true } });
const x = await r.text(), eu = { EUR: 1 }; for (const m of x.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([\d.]+)['"]/g)) eu[m[1]] = +m[2];
if (!eu.USD) throw 0;
const v = { d: (/time=['"](\d{4}-\d\d-\d\d)/.exec(x) || [])[1] || null, r: {} }; for (const [c, y] of Object.entries(eu)) v.r[c] = y / eu.USD; v.r.USD = 1; v.r.AED = 3.6725;
ECB39 = { t: Date.now(), v }; return v;
} catch (e) { ECB39 = { t: Date.now() - 43200000 + 600000, v: null }; return null; }
}
const CUR39 = ['USD', 'EUR', 'GBP', 'AED', 'MYR', 'THB', 'IDR', 'TRY', 'AUD', 'CNY', 'CHF'];
const priceOf = v => { const m = /\b([A-Z]{3})\s*([\d][\d,.]*)\s*(k|m|million)?/i.exec(String(v || '')); if (!m) return null; let n = +m[2].replace(/,/g, ''); if (!isFinite(n) || !n) return null; const s = (m[3] || '').toLowerCase(); if (s === 'k') n *= 1e3; else if (s) n *= 1e6; return { c: m[1].toUpperCase(), n }; };
const conv = (n, a, b, fx) => (a === b ? n : fx && fx.r[a] && fx.r[b] ? n / fx.r[a] * fx.r[b] : null);
const money = (n, c, l) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { style: 'currency', currency: c, maximumFractionDigits: 0, numberingSystem: 'latn' }).format(n); } catch (e) { return c + ' ' + nf(Math.round(n), l); } };
const monL = (i, l) => { const y = Math.floor((i - 1) / 12), m = i - y * 12; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(Date.UTC(y, m - 1, 15))); } catch (e) { return y + '-' + String(m).padStart(2, '0'); } };
const kpOf = s => (D.kp && D.kp.p && D.kp.p[s]) || null;
const DOCS39 = ['pn', 'co', 'es', 'ho', 'pr', 'un', 'cp', 'reg', 'ct'];
async function docPage(env, shell, l, r) {
const rg = regsFor(r), k = kpOf(r[1]);
let b = TB.kbx_n37u__t.k152 + esc(t(l, 'ms_pr')) + '</button> <span class="k-xs">' + esc(t(l, 'ms_prn')) + '</span></p>';
b += '<p>' + esc(tf(l, 'b_q_dp', { n: r[2], d: r[6] || r[5] || '', m: r[3] })) + '</p><ul class="n39-ck">';
for (const f of DOCS39.concat(['land'])) {
const c = f === 'land' ? null : cellOf(r, f), regs = rg.filter(x => x[2].includes(f === 'land' ? 'pn' : f));
b += TB.kbx_n37u__t.k153 + esc(t(l, 'b_q_d_' + f)) + '</b>' +
(f === 'land' ? '<span class="k-xs">' + esc(t(l, 'b_q_land')) + '</span>' : c ? '<span class="ok">' + esc(tf(l, 'b_q_have', { v: tv(String(c[0]), l, 90), k: t(l, 'k_' + c[2]), d: fd(c[3], l) })) + '</span> ' + ext(c[1]) + '<br><span class="k-xs">' + esc(t(l, 'b_q_match')) + '</span>' : '<span class="ask">' + esc(t(l, 'b_q_ask')) + '</span>') +
(regs.length ? '<br><span class="k-xs">' + esc(t(l, 'b_q_where')) + ' ' + regs.map(x => ext(x[1], x[0])).join(', ') + '</span>' : '') + '</div></li>';
}
b += '</ul>';
if (k && k.length) b += '<p>' + esc(tf(l, 'b_q_kp', { c: k.map(p => p.c).join(', ') })) + ' ' + ext(k[0].u, 'teduh.kpkt.gov.my') + '</p>';
b += '<p class="k-xs">' + esc(t(l, 'b_q_not')) + '</p>' + buyRow(l, r, 'documents') + cmpBlock(l, r) +
TB.kbx_n37u__s.k34;
return page(shell, l, { path: '/projects/' + r[1] + '/documents/', h1: tf(l, 'b_q_h1', { n: r[2] }), lead: t(l, 'b_q_lead'), body: TB.kbx_n37u__s.N38C + TB.kbx_n37u__s.N39T2C + b, noindex: true, crumb: [[t(l, 'projects'), P39(l) + '/projects/'], [r[2], t39u(l, r[1])]] });
}
function mkMoves(m) { const A = dlAll(), z = A.ms.find(x => x.m === m), all = A.late.map(x => x.dm).filter(x => x > 0).sort((a, b) => a - b); const mine = z ? z.late.map(x => x.dm).filter(x => x > 0).sort((a, b) => a - b) : []; const use = mine.length >= 3 ? mine : all; return { own: mine.length >= 3, n: use.length, med: median(use), hi: use.length ? use[Math.min(use.length - 1, Math.floor(use.length * 0.9))] : 0, max: use.length ? use[use.length - 1] : 0 }; }
async function stressPage(env, shell, l, r, u) {
const q = k => String(u.searchParams.get(k) || '').slice(0, 20), h = cellOf(r, 'ho'), pc = priceOf(cellOf(r, 'pr') && cellOf(r, 'pr')[0]), fx = await ecb39();
let cur = CUR39.includes(q('c').toUpperCase()) ? q('c').toUpperCase() : pc ? pc.c : 'USD';
const pr0 = +q('p').replace(/[^\d.]/g, ''), price = pr0 > 0 ? pr0 : pc ? (conv(pc.n, pc.c, cur, fx) || (cur = pc.c, pc.n)) : 0;
const bp = Math.min(100, Math.max(0, +(q('b') || 60) || 0)), rate = Math.min(30, Math.max(0, +(q('r') || 0) || 0)), now = BI(), hi = h ? mIdx(h[0]) : null, mv = mkMoves(r[3]);
let b = TB.kbx_n37u__t.k154 + t39u(l, r[1]) + 'stress/"><label>' + esc(t(l, 'b_w_p')) + TB.kbx_n37u__t.k155 + esc(price ? Math.round(price) : '') + '"></label><label>' + esc(t(l, 'b_w_c')) + '<select name="c">' + CUR39.concat(pc && !CUR39.includes(pc.c) ? [pc.c] : []).map(c => '<option' + (c === cur ? ' selected' : '') + '>' + c + '</option>').join('') + '</select></label><label>' + esc(t(l, 'b_w_b')) + TB.kbx_n37u__t.k156 + bp + '"></label><label>' + esc(t(l, 'b_w_r')) + TB.kbx_n37u__t.k157 + rate + '"></label><button type="submit">' + esc(t(l, 'b_w_go')) + '</button></form>';
b += '<p class="k-xs">' + esc(pc ? tf(l, 'b_w_src', { v: cellOf(r, 'pr')[0], d: fd(cellOf(r, 'pr')[3], l) }) : t(l, 'b_w_nop')) + (fx && fx.d ? ' ' + esc(tf(l, 'b_w_fx', { d: fd(fx.d, l) })) + ' ' + ext(TB.kbx_n37u__t.k158, 'ecb.europa.eu') : '') + '</p>';
if (hi == null) b += '<p>' + esc(t(l, 'b_w_noh')) + '</p>';
else {
const paid = price * bp / 100, sc = [['b_w_s0', 0], ['b_w_s1', Math.round(mv.med)], ['b_w_s2', mv.hi], ['b_w_s3', mv.max]];
b += '<p>' + esc(tf(l, 'b_w_ho', { h: tv(h[0], l), k: t(l, 'k_' + h[2]), d: fd(h[3], l) })) + ' ' + esc(tf(l, mv.own ? 'b_w_mv' : 'b_w_mva', { m: r[3], n: nf(mv.n, l) })) + '</p>';
b += kpTw(l, '<thead><tr><th scope="col">' + esc(t(l, 'b_w_sc')) + '</th><th scope="col">' + esc(t(l, 'b_w_hh')) + '</th><th scope="col">' + esc(t(l, 'b_w_wait')) + '</th><th scope="col">' + esc(t(l, 'b_w_paid')) + '</th><th scope="col">' + esc(t(l, 'b_w_cost')) + '</th></tr></thead><tbody>' +
sc.map(([k, d]) => { const w = Math.max(0, hi + d - now); return '<tr><th scope="row">' + esc(tf(l, k, { n: nf(d, l) })) + '</th><td class="n">' + esc(monL(hi + d, l)) + '</td><td class="n">' + nf(w, l) + '</td><td class="n">' + (price ? bdi(money(paid, cur, l)) : '') + '</td><td class="n">' + (price && rate ? bdi(money(paid * rate / 100 * d / 12, cur, l)) : '') + '</td></tr>'; }).join('') + '</tbody>');
if (hi < now) b += '<p>' + esc(t(l, 'b_w_past')) + '</p>';
}
b += '<p class="k-xs">' + esc(t(l, 'b_w_not')) + '</p><p>' + lnk(n38u(l, 'delays/') + '#mk-' + slugM(r[3]), t(l, 'dl_h1')) + TB.kbx_n37u__t.DOT + lnk(P39(l) + '/tools/', t(l, 'b_w_tools')) + '</p>' + buyRow(l, r, 'stress');
return page(shell, l, { path: '/projects/' + r[1] + '/stress/', h1: tf(l, 'b_w_h1', { n: r[2] }), lead: t(l, 'b_w_lead'), body: TB.kbx_n37u__s.N38C + TB.kbx_n37u__s.N39T2C + b, noindex: true, crumb: [[t(l, 'projects'), P39(l) + '/projects/'], [r[2], t39u(l, r[1])]] });
}
async function devTlPage(env, shell, l, slug, u) {
const rows = IX.byDev.get(slug) || []; if (rows.length < 1) return null;
const fx = await ecb39(), c0 = String(u.searchParams.get('c') || '').toUpperCase(), cur = CUR39.includes(c0) ? c0 : '';
const name = rows[0][6] || slug, now = BI(), dated = rows.map(r => ({ r, i: cellOf(r, 'ho') ? mIdx(cellOf(r, 'ho')[0]) : null })), G = new Map();
for (const x of dated) { const y = x.i == null ? 0 : Math.floor((x.i - 1) / 12); (G.get(y) || G.set(y, []).get(y)).push(x); }
const ys = [...G.keys()].sort((a, b) => (a || 9999) - (b || 9999)), mv = hoMoves(rows), byS = new Map(); for (const m of mv) (byS.get(m.r[1]) || byS.set(m.r[1], []).get(m.r[1])).push(m);
let b = '<p>' + esc(tf(l, 'b_v_p', { d: name, n: nf(rows.length, l), h: nf(dated.filter(x => x.i != null).length, l), p: nf(dated.filter(x => x.i != null && x.i < now).length, l), m: nf(byS.size, l) })) + '</p>';
b += TB.kbx_n37u__t.k159 + esc(t(l, 'b_w_c')) + '">' + esc(t(l, 'b_w_c')) + ': ' + [''].concat(['USD', 'EUR', 'GBP', 'AED']).map(c => c === cur ? '<b>' + esc(c || t(l, 'b_v_orig')) + '</b>' : '<a href="?' + (c ? 'c=' + c : '') + '" rel="nofollow">' + esc(c || t(l, 'b_v_orig')) + '</a>').join(' · ') + (cur && fx && fx.d ? ' <span>' + esc(tf(l, 'b_w_fx', { d: fd(fx.d, l) })) + '</span>' : '') + '</p>';
for (const y of ys) {
const L = G.get(y).sort((a, c) => (a.i || 0) - (c.i || 0) || a.r[2].localeCompare(c.r[2]));
b += '<h2 id="y' + (y || 'none') + '">' + esc(y ? String(y) + (y * 12 + 12 < now ? ' ' + t(l, 'b_v_past') : '') : t(l, 'b_v_nod')) + ' <span class="k-xs">(' + nf(L.length, l) + ')</span></h2>' + kpTw(l, kpTh(l, ['th_p', 'ch_mk', 'f_ho', 'f_cp', 'f_pr', 'b_v_moves']) + '<tbody>' + L.map(({ r }) => {
const h = cellOf(r, 'ho'), c = cellOf(r, 'cp'), p = cellOf(r, 'pr'), pp = p && priceOf(p[0]), cv = cur && pp ? conv(pp.n, pp.c, cur, fx) : null, ms = byS.get(r[1]) || [];
return '<tr><th scope="row"><a href="' + t39u(l, r[1]) + '">' + bdi(r[2]) + '</a></th><td>' + bdi(r[3]) + '</td><td class="n">' + (h ? bdi(tv(h[0], l, 30)) + ' <span class="k-xs">' + esc(t(l, 'k_' + h[2])) + '</span>' : '') + '</td><td class="n">' + (c ? bdi(tv(String(c[0]), l, 20)) : '') + '</td><td class="n">' + (cv ? bdi(money(cv, cur, l)) : p ? bdi(tv(String(p[0]), l, 28)) : '') + '</td><td>' + ms.map(m => esc(tv(m.x.p, l, 20) + ' > ' + tv(m.x.v, l, 20) + ' (' + fd(m.x.d, l) + ')')).join('<br>') + '</td></tr>';
}).join('') + '</tbody>');
}
b += '<p class="k-xs">' + esc(t(l, 'b_v_not')) + '</p><p>' + lnk(P39(l) + '/developers/' + slug + '/', name) + TB.kbx_n37u__t.DOT + lnk(n38u(l, 'developers/') + '#d-' + slug, t(l, 'dv_h1')) + TB.kbx_n37u__t.DOT + lnk(P39(l) + '/developers/compare/', t(l, 'dv_cmp')) + '</p>';
return page(shell, l, { path: '/developers/' + slug + '/timeline/', h1: tf(l, 'b_v_h1', { d: name }), lead: t(l, 'b_v_lead'), body: TB.kbx_n37u__s.N38C + TB.kbx_n37u__s.N39T2C + b, noindex: !!cur, crumb: [[t(l, 'b_v_devs'), P39(l) + '/developers/'], [name, P39(l) + '/developers/' + slug + '/']] });
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
const H = heatRows(), C = [['reg', 'mc_reg', 20, 60, 1, '%'], ['pn', 'b_e_pn', 20, 60, 1, '%'], ['med', 'gp_md', 3, 6, 1, ' / 10'], ['late', 'b_e_late', 10, 25, 0, '%'], ['lm', 'b_e_lm', 3, 9, 0, ''], ['od', 'dl_od', 0, 5, 0, ''], ['kp', 'b_e_kp', 5, 15, 0, '%']];
let b = '<p>' + esc(tf(l, 'b_e_p', { n: nf(H.length, l) })) + '</p><ul class="n39-key" aria-label="' + esc(t(l, 'b_e_key')) + '"><li><i class="h0"></i>' + esc(t(l, 'b_e_b0')) + '</li><li><i class="h1"></i>' + esc(t(l, 'b_e_b1')) + '</li><li><i class="h2"></i>' + esc(t(l, 'b_e_b2')) + '</li></ul>';
b += '<div class="n39-h">' + kpTw(l, '<thead><tr><th scope="col">' + esc(t(l, 'gp_m')) + '</th><th scope="col">' + esc(t(l, 'ms_r')) + '</th>' + C.map(c => '<th scope="col">' + esc(t(l, c[1])) + '</th>').join('') + '</tr></thead><tbody>' +
H.map(x => '<tr id="mk-' + slugM(x.m) + '"><th scope="row"><a href="/m/' + slugM(x.m) + '/#n39-area">' + bdi(x.m) + '</a></th><td class="n">' + nf(x.n, l) + '</td>' + C.map(c => { const v = x[c[0]], k = band(v, c[2], c[3], c[4]); return '<td class="hb ' + k + '">' + (v == null ? '<span class="k-xs">' + esc(t(l, 'b_e_na')) + '</span>' : bdi(nf(v, l) + c[5]) + '<small>' + esc(t(l, 'b_e_' + (k === 'h0' ? 'b0' : k === 'h1' ? 'b1' : 'b2'))) + '</small>') + '</td>'; }).join('') + '</tr>').join('') + '</tbody>') + '</div>';
b += '<p class="k-xs">' + esc(t(l, 'b_e_def')) + '</p><p>' + lnk(n38u(l, 'markets/'), t(l, 'mc_h1')) + TB.kbx_n37u__t.DOT + lnk(n38u(l, 'delays/'), t(l, 'dl_h1')) + TB.kbx_n37u__t.DOT + lnk(n38u(l, 'pipeline/'), t(l, 'pl_h1')) + '</p>';
return page(shell, l, { path: '/data/heat/', h1: t(l, 'b_e_h1'), lead: t(l, 'b_e_lead'), body: TB.kbx_n37u__s.N38C + TB.kbx_n37u__s.N39T2C + b, crumb: [[t(l, 'data'), P39(l) + '/data/'], [t(l, 'mc_h1'), n38u(l, 'markets/')]] });
}
const nrm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
async function lookupPage(env, shell, l, u) {
const q0 = String(u.searchParams.get('n') || '').slice(0, 60).trim(), q = nrm(q0), hits = [];
if (q.length >= 3) for (const r of D.p) { const c = cellOf(r, 'pn'), k = kpOf(r[1]); let w = null; if (c && nrm(c[0]).includes(q)) w = ['pn', c[0], c[1], c[3]]; else if (k && k.some(p => nrm(p.c).includes(q))) { const p = k.find(z => nrm(z.c).includes(q)); w = ['kp', p.c + ' (' + p.st + ')', p.u, D.kp.built]; } else if (nrm(r[0]) === q) w = ['id', r[0], '', D.built]; if (w) { hits.push([r, w]); if (hits.length >= 50) break; } }
let b = TB.kbx_n37u__t.k160 + P39(l) + TB.kbx_n37u__t.k161 + esc(t(l, 'b_k_l')) + '<input name="n" value="' + esc(q0) + TB.kbx_n37u__t.k162 + esc(t(l, 'b_k_go')) + '</button></form><p class="k-xs">' + esc(tf(l, 'b_k_hint', { n: nf(D.known[1], l) })) + '</p>';
if (q0) b += '<h2 id="res">' + esc(tf(l, hits.length === 1 ? 'b_k_r1' : 'b_k_rn', { n: nf(hits.length, l), q: q0 })) + '</h2>' + (hits.length ? kpTw(l, kpTh(l, ['th_p', 'ch_mk', 'b_k_num', 'th_s', 'f_ho']) + '<tbody>' + hits.map(([r, w]) => { const h = cellOf(r, 'ho'); return '<tr><th scope="row"><a href="' + t39u(l, r[1]) + 'documents/">' + bdi(r[2]) + '</a></th><td>' + bdi(r[3]) + '</td><td class="n">' + bdi(tv(String(w[1]), l, 60)) + '</td><td>' + ext(w[2]) + ' <span class="k-xs">' + esc(fd(w[3], l)) + '</span></td><td class="n">' + (h ? bdi(tv(h[0], l, 30)) : '') + '</td></tr>'; }).join('') + '</tbody>') : '<p>' + esc(t(l, 'b_k_none')) + '</p>');
b += '<p class="k-xs">' + esc(t(l, 'b_k_not')) + '</p><p>' + lnk(P39(l) + '/registers/', t(l, 'kr_regs')) + TB.kbx_n37u__t.DOT + lnk(P39(l) + '/registers/malaysia/', t(l, 'kr_h1')) + '</p>';
return page(shell, l, { path: '/registers/lookup/', h1: t(l, 'b_k_h1'), lead: t(l, 'b_k_lead'), body: TB.kbx_n37u__s.N38C + TB.kbx_n37u__s.N39T2C + b, noindex: !!q0, crumb: [[t(l, 'kr_regs'), P39(l) + '/registers/']] });
}
function devLine(l, r) {
if (!r[5]) return ''; const rows = IX.byDev.get(r[5]) || []; if (rows.length < 2) return '';
const k = devTrack(r[5]), od = dlAll().od.filter(([x]) => x[5] === r[5]).length, lp = k ? new Set(k.late.map(m => m.r[1])).size : 0;
return '<p class="n37-in" id="n39-dtr"' + dir(l) + '>' + esc(tf(l, 'b_d_line', { d: r[6] || r[5], n: nf(rows.length, l), t: nf(k ? k.th.length : 0, l), m: nf(lp, l), o: nf(od, l) })) + ' <a href="' + P39(l) + '/developers/' + r[5] + '/timeline/">' + esc(t(l, 'b_v_link')) + '</a></p>';
}
function areaBlock(l, m) {
const rows = IX.byMk.get(m) || [], G = new Map(); for (const r of rows) if (r[4]) (G.get(r[4]) || G.set(r[4], []).get(r[4])).push(r);
const A = [...G.entries()].filter(([, a]) => a.length >= 3).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])).slice(0, 20);
if (A.length < 2) return '';
return '<section id="n39-area"' + dir(l) + '><h2>' + esc(tf(l, 'b_ar_h', { m: mkName(m, l) })) + '</h2><p class="k-xs">' + esc(t(l, 'b_a_p')) + '</p>' + kpTw(l, kpTh(l, ['b_a_ar', 'ms_r', 'b_e_pn', 'mc_reg', 'gp_md']) + '<tbody>' + A.map(([a, rs]) => { const s = regShare(rs); return '<tr><th scope="row">' + bdi(a) + '</th><td class="n">' + nf(rs.length, l) + '</td><td class="n">' + bdi(nf(share(rs.filter(r => cellOf(r, 'pn')).length, rs.length), l) + '%') + '</td><td class="n">' + bdi(nf(share(s.g, s.h), l) + '%') + '</td><td class="n">' + nf(median(rs.map(cnt)), l) + ' / 10</td></tr>'; }).join('') + '</tbody>') + '<p>' + lnk(n38u(l, 'heat/') + '#mk-' + slugM(m), t(l, 'b_e_h1')) + '</p></section>';
}
function nextBlock(l, m) {
const now = BI(), rows = (IX.byMk.get(m) || []).map(r => [r, cellOf(r, 'ho')]).map(([r, h]) => [r, h, h ? mIdx(h[0]) : null]).filter(x => x[2] != null && x[2] >= now && x[2] <= now + 12).sort((a, b) => a[2] - b[2] || a[0][2].localeCompare(b[0][2]));
if (!rows.length) return '';
return '<section id="n39-next"' + dir(l) + '><h2>' + esc(tf(l, 'b_x_h', { m: mkName(m, l), n: nf(rows.length, l) })) + '</h2><p class="k-xs">' + esc(t(l, 'b_x_p')) + '</p>' + kpTw(l, kpTh(l, ['th_p', 'f_ho', 'th_s', 'f_cp']) + '<tbody>' + rows.slice(0, 25).map(([r, h]) => { const c = cellOf(r, 'cp'); return '<tr><th scope="row"><a href="' + t39u(l, r[1]) + '">' + bdi(r[2]) + '</a></th><td class="n">' + bdi(tv(h[0], l, 30)) + '</td><td>' + esc(t(l, 'k_' + h[2])) + ' <span class="k-xs">' + esc(fd(h[3], l)) + '</span></td><td class="n">' + (c ? bdi(tv(String(c[0]), l, 20)) + ' <span class="k-xs">' + esc(t(l, 'k_' + c[2])) + '</span>' : '') + '</td></tr>'; }).join('') + '</tbody>') + (rows.length > 25 ? '<p class="k-xs">' + esc(tf(l, 'b_x_more', { n: nf(rows.length - 25, l) })) + ' ' + lnk(n38u(l, 'pipeline/') + '?m=' + encodeURIComponent(m) + '#m', t(l, 'pl_h1'), ' rel="nofollow"') + '</p>' : '') + '</section>';
}
function cmpPick(r) {
const h = cellOf(r, 'ho'), i = h ? mIdx(h[0]) : null;
return (IX.byMk.get(r[3]) || []).filter(x => x !== r).map(x => { const c = cellOf(x, 'ho'), j = c ? mIdx(c[0]) : null; return [x, (i != null && j != null ? Math.abs(i - j) : 999) - (x[4] && x[4] === r[4] ? 6 : 0) - cnt(x) * 0.1]; }).sort((a, b) => a[1] - b[1] || a[0][2].localeCompare(b[0][2])).slice(0, 3).map(a => a[0]);
}
function cmpBlock(l, r) {
const L = cmpPick(r); if (L.length < 2) return '';
const all = [r].concat(L), rg = x => x[8].filter(c => c && c[2] === 'reg').length;
return '<section id="n39-cmp"' + dir(l) + '><h3>' + esc(t(l, 'b_c_h')) + '</h3><p class="k-xs">' + esc(t(l, 'b_c_p')) + '</p>' + kpTw(l, kpTh(l, ['th_p', 'b_a_ar', 'f_ho', 'th_k', 'b_c_reg']) + '<tbody>' + all.map(x => { const h = cellOf(x, 'ho'); return '<tr><th scope="row">' + (x === r ? bdi(x[2]) : '<a href="' + t39u(l, x[1]) + '">' + bdi(x[2]) + '</a>') + '</th><td>' + bdi(x[4] || '') + '</td><td class="n">' + (h ? bdi(tv(h[0], l, 30)) : '') + '</td><td class="n">' + nf(cnt(x), l) + ' / 10</td><td class="n">' + nf(rg(x), l) + '</td></tr>'; }).join('') + '</tbody>') +
'<p><a href="' + P39(l) + '/compare/?ids=' + all.map(x => encodeURIComponent(x[0])).join(',') + '" rel="nofollow">' + esc(t(l, 'b_c_open')) + '</a></p></section>';
}
function buyRow(l, r, cur) {
return '<p class="n39-np" id="n39-buy"' + dir(l) + '>' + [['documents', 'b_q_l'], ['stress', 'b_w_l']].filter(x => x[0] !== cur).map(x => lnk(t39u(l, r[1]) + x[0] + '/', t(l, x[1]))).join(TB.kbx_n37u__t.DOT) + (r[5] ? TB.kbx_n37u__t.DOT + lnk(P39(l) + '/developers/' + r[5] + '/timeline/', t(l, 'b_v_link')) : '') + TB.kbx_n37u__t.DOT + lnk(P39(l) + '/registers/lookup/', t(l, 'b_k_h1')) + (cur ? TB.kbx_n37u__t.DOT + lnk(t39u(l, r[1]), r[2]) : '') + '</p>';
}
export async function inject(req, u, env, r) {
try {
if (!/text\/html/.test(r.headers.get('content-type') || '')) return r;
const m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(.*)$/.exec(u.pathname), l = m[1] || 'en', p = m[2];
if (!(await load(env))) return r;
const add = []; let mm;
if ((p === 'engineering/' || p === 'yc/') && l === 'en') { add.push(['main', 'append', shipped(l)]); if (p === 'yc/') add.push(['section.k27 .k-prose > p', 'after', TB.kbx_n37u__s.k35 + esc(tf(l, 'yt_top', { d: fd(D.built, l), n: nf(ITEMS.length, l) })) + ' <a href="/yc/try/#n37-shipped">' + esc(t(l, 'yt_open')) + TB.kbx_n37u__t.k163 + esc(t(l, 'yt_list')) + '</a></p>']); }
else if (p === 'search/') { await regMap(env);
return new HTMLRewriter().on('#n34-out', { element(e) { e.setAttribute('data-n37', seTpl(l)); } }).on('ol.n34-res > li > a', { element(e) { const mm2 = /\/projects\/([a-z0-9-]{1,90})\/$/.exec(e.getAttribute('href') || ''), x = mm2 && IX.bySlug.get(mm2[1]); if (x) e.after(seInfo(l, x), { html: true }); } })
.on('head', { element(e) { e.append(VSC, { html: true }); } }).on('main', { element(e) { e.onEndTag(end => { end.before(savedBox(l, ((r.headers.get('content-security-policy') || '').match(/'nonce-([^']+)'/) || [])[1]), { html: true }); }); } }).transform(r);
}
else if (p === '') { const h = await homeBits(l, env); if (h) { add.push(['p.hero-sub', 'after', h[0]]); add.push(['#hp-band > .wrap', 'prepend', h[1]]); } }
else if (p === 'yc/try/') add.push(['section.k27 .k-prose > ol', 'before', await progBlock(l, env)]);
else if ((mm = /^m\/([^/.]{2,60})\/$/.exec(p))) { const mk = mBySlug(mm[1]); let kk = null; if (mk) try { kk = await (await import('./kbx_n29i.js')).mkKey(env, mm[1], l); } catch (e) {} const dh = mk ? mkDash(l, mk, kk) : ''; if (dh) add.push(l === 'en' ? ['#in-short', 'before', dh] : ['.k29-kv', 'before', dh]); const m2 = mk || [...IX.byMk.keys()].find(k => slugM(k) === mm[1]), h = mk ? mkSection(l, mk) + kpMarket(l, mk) + '<div class="n37">' + areaBlock(l, mk) + devBlock(l, mk) + nextBlock(l, mk) + '</div>' : m2 ? '<div class="n37">' + devBlock(l, m2) + '</div>' : ''; if (!h) return r; add.push(['#slippage', 'before', h]); }
else if ((mm = /^developers\/([a-z0-9-]{2,90})\/$/.exec(p))) { const h = devSection(l, mm[1]); if (!h) return r; const dc = devCard(l, mm[1]); if (dc) add.push(['.phero .lead', 'after', dc]); add.push(['#projects', 'append', h + peers(l, mm[1]) + '<p class="n37-in"' + dir(l) + '><a href="' + pre(l) + '/developers/' + mm[1] + '/timeline/">' + esc(t(l, 'b_v_link')) + '</a></p>']); }
else if ((mm = /^projects\/([a-z0-9-]{1,90})\/$/.exec(p))) {
const x = IX.bySlug.get(mm[1]); if (!x) return r;
const k = cnt(x);
const lc = latestChange(x), lch = lc ? '<p class="n37-in"' + dir(l) + '><a href="' + recU(l, x[1]) + '#timeline">' + esc(tf(l, 'tl_pj', { f: t(l, 'f_' + lc.x.f), a: tv(lc.x.p, l, 70), b: tv(lc.x.v, l, 70), d: fd(lc.x.d, l) })) + '</a>' + (lc.n > 1 ? ' <span class="k-xs">' + esc(tf(l, 'tl_more', { n: nf(lc.n - 1, l) })) + '</span>' : '') + '</p>' : '';
add.push(['#answer', 'append', VSC + vsBlock(l, x, actRow(l, x)) + kpBlock(l, x[1], 'n37-kp', 'h3')]);
add.push(['#glance', 'append', TB.kbx_n37u__s.STY + '<p class="n37-in"' + dir(l) + '><a href="' + recU(l, x[1]) + '">' + esc(tf(l, 'inj_p', { k: nf(k, l), g: nf(10 - k, l) })) + TB.kbx_n37u__t.k164 + pre(l) + '/projects/' + x[1] + '/brief/">' + esc(t(l, 'a_br')) + '</a></p>' + lch + devLine(l, x) + buyRow(l, x, '')]);
if (D.mk[x[3]]) add.push(['#market', 'append', '<p class="n37-in"' + dir(l) + '><a href="' + recU(l, x[1]) + '#market">' + esc(tf(l, 'inj_m', { m: x[3] })) + '</a></p>' + supplyLine(l, x) + cmpBlock(l, x)]);
} else if (p === 'data/' || p === 'data/dictionary/' || p === 'registers/') add.push(['main', 'append', '<section class="wrap"' + dir(l) + '>' + TB.kbx_n37u__s.STY + '<p class="n37-in">' + (l === 'en' || p === 'data/' ? '' : '<a href="' + pre(l) + '/data/">' + esc(t(l, 'dh_link')) + '</a> · ') + '<a href="' + pre(l) + '/data/gaps/">' + esc(t(l, 'gp_link')) + '</a> · ' + esc(t(l, 's5_s')) + TB.kbx_n37u__t.k165 + pre(l) + '/data/gaps/#dist">' + esc(t(l, 's8_t')) + TB.kbx_n37u__t.k166 + pre(l) + '/data/changes/">' + esc(t(l, 'ch_h1')) + TB.kbx_n37u__t.k167 + pre(l) + '/data/markets/">' + esc(t(l, 'mc_h1')) + TB.kbx_n37u__t.k168 + pre(l) + '/registers/malaysia/">' + esc(t(l, 'kr_h1')) + TB.kbx_n37u__t.k169 + esc(t(l, 'csv_l')) + '</a>' + TB.kbx_n37u__t.DOT + '<a href="' + n38u(l, 'pipeline/') + '">' + esc(t(l, 'pl_h1')) + '</a>' + TB.kbx_n37u__t.DOT + '<a href="' + n38u(l, 'delays/') + '">' + esc(t(l, 'dl_h1')) + '</a>' + TB.kbx_n37u__t.DOT + '<a href="' + n38u(l, 'developers/') + '">' + esc(t(l, 'dv_h1')) + '</a>' + TB.kbx_n37u__t.DOT + '<a href="' + n38u(l, 'markets/dubai/') + '">' + esc(tf(l, 'ms_h1', { m: 'Dubai' })) + '</a>' + TB.kbx_n37u__t.DOT + '<a href="' + pre(l) + '/search/#saved">' + esc(t(l, 'ss_h')) + '</a></p></section>']);
if (p === 'data/' || p === 'data/dictionary/' || p === 'registers/' || p === 'engineering/') { const h = '<section class="wrap"' + dir(l) + '>' + TB.kbx_n37u__s.STY + n39Links(l) + '</section>', mi = add.find(a => a[0] === 'main'); if (mi) mi[2] += h; else add.push(['main', 'append', h]); }
if (!add.length) return r;
let out = new HTMLRewriter();
const tail = [];
for (const [sel, , h] of add) {
const st = { done: false };
if (sel === 'main') tail.push([st, h]);
else { const how = add.find(a => a[0] === sel)[1]; out = out.on(sel, { element(e) { if (!st.done) { st.done = true; e[how](h, { html: true }); } } }); if (how === 'before') tail.push([st, h]); }
}
if (tail.length) out = out.on('main', { element(e) { e.onEndTag(end => { for (const [st, h] of tail) if (!st.done) { st.done = true; end.before(h, { html: true }); } }); } });
return out.transform(r);
} catch (e) { return r; }
}
export async function handle(req, u, env, ctx, shell) {
const r = await handle0(req, u, env, ctx, shell);
return r && r.status === 200 && !/text\/html/.test(r.headers.get('content-type') || '') ? cond(req, r) : r;
}
async function handle0(req, u, env, ctx, shell) {
if (req.method !== 'GET' && req.method !== 'HEAD') return null;
const p = u.pathname; let m;
if (!PATHS.test(p) && !P39T1.test(p)) return null;
if (!(await load(env))) { for (const k in MEMO) delete MEMO[k]; T = null; if (!(await load(env))) return new Response(TB.kbx_n37u__t.k170, { status: 503, headers: { 'retry-after': '5', 'cache-control': 'no-store', 'content-type': 'text/plain; charset=utf-8' } }); }
if ((m = p.match(RX_JS))) { const r = IX.bySlug.get(m[1]); return r ? recJson2(r) : null; }
if ((m = p.match(/^\/data\/(record|changes)\.schema\.json$/))) return new Response(JSON.stringify(schemas()[m[1]], null, 1), { headers: { ...JH, 'content-type': TB.kbx_n37u__t.k171 } });
if (p === '/data/validate.svg') return badgeSvg();
if (p === '/data/records.ndjson') return ndjson(u);
if (p === '/data/changes.csv') return changesCsv(u);
if (p === '/data/gaps.csv') return gapsCsv();
if (p === '/data/n37u-se.json') return seJson();
if (p === '/data/changes/feed.atom') return feedAtom(String(u.searchParams.get('m') || '').slice(0, 80));
if (p === '/data/changes.json') return changesJson(u);
if (p === '/data/changes/week.json') return new Response(JSON.stringify(weekObj(), null, 1), { headers: JH });
if ((m = p.match(/^\/m\/([^/]{2,120})\/slugs\.json$/))) return slugsJson(env, m[1]);
try { return await route(env, shell, p, u); } catch (e) {
let e2 = null, diag = '';
for (let k = 0; k < 2; k++) {
try { const S = await import('./kbx_strings.js'); if (!S.isReady()) await S.ready(env); } catch (e3) {}
try { return await route(env, shell, p, u); } catch (e4) { e2 = e4; try { const S = await import('./kbx_strings.js'); diag = ' [ready ' + S.isReady() + ', loaded ' + S.stat.loaded + '/' + S.stat.files + ', errors ' + S.stat.errors + ']'; } catch (e5) {} await new Promise(z => setTimeout(z, 150)); }
}
{ return new Response(TB.kbx_n37u__t.k172, { status: 503, headers: { 'retry-after': '5', 'cache-control': 'no-store', 'content-type': 'text/plain; charset=utf-8', 'x-kb-err': (String(e2 && e2.message || e2).slice(0, 90) + diag).slice(0, 120).replace(/[^\x20-\x7e]/g, '') } }); }
}
}
async function route(env, shell, p, u) {
let m;
if ((m = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?data\/(validate|query|duplicates|sources)(\/?)$/))) { if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' + (u && u.search || '') } }); const l = m[1] || 'en'; return m[2] === 'validate' ? validatePage(env, shell, l) : m[2] === 'query' ? queryRoute(env, shell, l, u) : m[2] === 'duplicates' ? dupPage(env, shell, l, u) : srcPage(env, shell, l, u); }
if ((m = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?projects\/([a-z0-9-]{1,90})\/brief(\/?)$/))) {
if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' } });
const r = IX.bySlug.get(m[2]); return r ? briefPage(env, shell, m[1] || 'en', r) : null;
}
if ((m = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?data\/changes\/week(\/?)$/))) { if (!m[2]) return new Response(null, { status: 301, headers: { location: p + '/' } }); return weekPage(env, shell, m[1] || 'en'); }
if ((m = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?data\/changes(\/?)$/))) { if (!m[2]) return new Response(null, { status: 301, headers: { location: p + '/' } }); return changesPage(env, shell, m[1] || 'en', String((u && u.searchParams.get('m')) || '').slice(0, 80)); }
if ((m = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?data\/how-we-verify(\/?)$/))) { if (!m[2]) return new Response(null, { status: 301, headers: { location: p + '/' } }); return verifyPage(env, shell, m[1] || 'en'); }
if ((m = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(registers\/malaysia|data\/markets)(\/?)$/))) { if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' } }); return m[2] === 'data/markets' ? mcPage(env, shell, m[1] || 'en', u) : (KP ? kpPage(env, shell, m[1] || 'en') : null); }
if ((m = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?data\/(pipeline|delays|developers|markets\/([a-z0-9-]{2,60}))(\/?)$/))) {
if (!m[4]) return new Response(null, { status: 301, headers: { location: p + '/' } });
const l = m[1] || 'en';
if (m[3]) { const mk = mBySlug(m[3]); return mk && (IX.byMk.get(mk) || []).length >= 3 ? sheetPage(env, shell, l, mk) : null; }
return m[2] === 'pipeline' ? pipePage(env, shell, l, u) : m[2] === 'delays' ? delayPage(env, shell, l) : dvPage(env, shell, l, u);
}
if ((m = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(?:projects\/([a-z0-9-]{1,90})\/(documents|stress)|developers\/([a-z0-9-]{2,90})\/timeline|data\/(heat)|registers\/(lookup))(\/?)$/))) {
if (!m[7]) return new Response(null, { status: 301, headers: { location: p + '/' } });
const l = m[1] || 'en';
if (m[2]) { const r = IX.bySlug.get(m[2]); return r ? (m[3] === 'documents' ? docPage(env, shell, l, r) : stressPage(env, shell, l, r, u)) : null; }
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
const G = GH.v, P = pre(l), en = l === 'en' ? '' : ' hreflang="en"', cn = c => { try { return coName(c, l) || c; } catch (e) { return c; } };
const li = (h, x, a) => '<li><a href="' + h + '"' + (a || '') + '>' + esc(x) + '</a></li>';
const topic = '<ul class="n37-rel">' + li(P + '/guides/buying-off-plan/', t(l, 'gh_buy')) + ['dubai', 'bali', 'phuket', 'cyprus'].map(k => li(P + '/guides/buying-off-plan/' + k + '/', tf(l, 'gh_buy_in', { p: t(l, 'gh_p_' + k) }))).join('') + '</ul><h3>' + esc(t(l, 'gh_from')) + '</h3><ul class="n37-rel">' + ['russia', 'china', 'gulf'].map(k => li(P + '/guides/buyers-from/' + k + '/', t(l, 'gh_p_' + k))).join('') + '</ul><ul class="n37-rel">' + li(P + '/countries/foreign-buyers/', t(l, 'gh_foreign')) + li(P + '/buyer-protection-law/', t(l, 'gh_lawc')) + li(P + '/guides/short-let-rules/', t(l, 'gh_short')) + '</ul>';
let k = 9;
const rows = G.map(x => { k += 1 + (x.safe ? 1 : 0) + (x.law ? 1 : 0); const b = '/countries/' + x.s + '/'; return '<tr><th scope="row"><a href="' + P + b + '">' + bdi(cn(x.c)) + '</a></th><td class="n">' + nf(x.n, l) + '</td><td><a href="' + b + 'how-to-check/"' + en + '>' + esc(t(l, 'gh_check')) + '</a></td><td>' + (x.safe ? '<a href="' + b + 'is-it-safe/"' + en + '>' + esc(t(l, 'gh_safe')) + '</a>' : '<span class="k-xs">' + esc(t(l, 'gh_no')) + '</span>') + '</td><td>' + (x.law ? '<a href="' + b + 'buyer-protection-law/"' + en + '>' + esc(t(l, 'gh_law')) + '</a>' : '<span class="k-xs">' + esc(t(l, 'gh_no')) + '</span>') + '</td></tr>'; }).join('');
const body = '<h2 id="topics">' + esc(t(l, 'gh_topic')) + '</h2>' + topic + '<h2 id="countries">' + esc(t(l, 'gh_country')) + '</h2><p class="k-xs">' + esc(tf(l, 'gh_cnt', { n: nf(k, l), c: nf(G.length, l) })) + ' ' + (l === 'en' ? '' : esc(t(l, 'gh_en'))) + '</p>' + CSSL + TB.kbx_n37u__t.k173 + esc(t(l, 'gh_country')) + TB.kbx_n37u__t.k174 + esc(t(l, 'gh_c')) + '</th><th scope="col">' + esc(t(l, 'gh_n')) + '</th><th scope="col">' + esc(t(l, 'gh_check')) + '</th><th scope="col">' + esc(t(l, 'gh_safe')) + '</th><th scope="col">' + esc(t(l, 'gh_law')) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
const canon = ORIGIN + P + '/guides/', h1 = t(l, 'gh_h1'), lead = t(l, 'gh_lead');
const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': 'CollectionPage', url: canon, name: h1, description: lead, inLanguage: l, dateModified: D.built, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } }, { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: t(l, 'home'), item: ORIGIN + P + '/' }, { '@type': 'ListItem', position: 2, name: h1, item: canon }] }] };
const html0 = '<section class="phero"' + dir(l) + TB.kbx_n37u__t.k175 + P + '/">' + esc(t(l, 'home')) + '</a> / ' + esc(h1) + '</p><h1>' + esc(h1) + '</h1><p class="lead">' + esc(lead) + TB.kbx_n37u__t.k176 + dir(l) + '>' + CSS + body + '</div>';
const desc = lead.length > 155 ? lead.slice(0, 152).replace(/\s+\S*$/, '') + '…' : lead;
const html = await N.assemble({ title: h1 + ' | Kolaboro', desc, canon, body: html0, ld, alt: x => ORIGIN + pre(x) + '/guides/' }, l, await shell(P + '/how-we-score/'));
return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=900', 'content-language': l } });
}
export const _r8u = { progLine, progBlock, mkSection, load, kpBlock, kpMarket, devSection, kpPage, mcPage, recPage, supplyLine, savedBox, IX: () => IX };
