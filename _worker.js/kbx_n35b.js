// comments: _notes/kolaboro-worker-comments.txt
import * as N from './kbx_named.js';
import { light6, t27 } from './kbx_u27.js';
import { coName, mkName } from './kbx_hdate.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const V = 'b1';
const COI = /eco\s*beach|\bequinox\b|\bsumba\b/i;
const MEMO = {};
function file(e, p, t) { return FQ[p] || (FQ[p] = file0(e, p, t).finally(() => { delete FQ[p]; })); }   // n40 k21: one shared read per file
const FQ = {};
async function file0(env, p, ttl) {
const m = MEMO[p]; if (m && m.v && Date.now() - m.t < (ttl || 600000)) return m.v;
let v = null;
try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + p)); if (r.ok) v = await r.json(); } catch (e) { v = null; }
if (!v) { try { const r = await fetch(ORIGIN + p, { cf: { cacheTtl: 600 } }); if (r.ok) v = await r.json(); } catch (e) { v = null; } }
MEMO[p] = { t: Date.now(), v }; return v;
}
let T = null;
const loadT = async env => T || (T = await file(env, '/data/n35b-i18n.json', 864e5));
export const ready = loadT;
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const t = (l, k) => { const a = T && T[l] && T[l][k]; return a != null ? a : T && T.en && T.en[k] != null ? T.en[k] : ''; };
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
const tf = (l, k, v) => fill(t(l, k), v || {});
export const tx = tf;
const nf = (n, l, d) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { maximumFractionDigits: d == null ? 0 : d, numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
const fdt = (d, l) => { if (!d) return ''; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(String(d).slice(0, 10) + 'T12:00:00Z')); } catch (e) { return String(d).slice(0, 10); } };
const dirA = l => l === 'ar' ? ' dir="rtl"' : '';
const okX = x => x && !COI.test([x.n, x.dv, x.mk, x.ar].join(' '));
const LP = '(?:(es|de|fr|nl|ru|zh|ar)\\/)?';
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:developers\/compare|tools\/(?:vault|price-per-m2)|projects\/[a-z0-9-]{1,90}\/journey)\/?$/;
const RX = { dc: new RegExp('^\\/' + LP + 'developers\\/compare(\\/?)$'), vt: new RegExp('^\\/' + LP + 'tools\\/vault(\\/?)$'), pm: new RegExp('^\\/' + LP + 'tools\\/price-per-m2(\\/?)$'), bj: new RegExp('^\\/' + LP + 'projects\\/([a-z0-9-]{1,90})\\/journey(\\/?)$') };
const ALL = [['dc_t', '/developers/compare/'], ['pm_t', '/tools/price-per-m2/'], ['vt_t', '/tools/vault/'], ['l_cr', '/tools/contract-reader/'], ['l_my', '/tools/my-checklist/', 1]];
const CSS = '<style id="n35-css">.n35{max-width:1100px}.n35 h2{margin:28px 0 8px;font-size:1.3rem}.n35 p,.n35 li{line-height:1.6}.n35 .k-xs{font-size:.9rem;color:var(--k-muted,#56636F)}' +
'.n35-tw{overflow-x:auto;border:1px solid var(--k-line,#D5DCDB);border-radius:12px;margin:10px 0 22px;background:var(--k-surface,#fff)}.n35-tw:focus-visible{outline:3px solid var(--k-sea,#155C75)}.n35 table{width:100%;border-collapse:collapse;font-size:.93rem}.n35 th,.n35 td{padding:9px 12px;border-bottom:1px solid var(--k-line,#D5DCDB);text-align:start;vertical-align:top}.n35 thead th{font-size:.82rem}.n35 td.n{font-variant-numeric:tabular-nums}.n35 tbody th{font-weight:600;min-width:150px}' +
'.n35 select,.n35 input[type=text],.n35 input[type=number],.n35 input[type=password]{font:inherit;min-height:44px;padding:8px 10px;border:1.5px solid var(--k-line-2,#BCC5C5);border-radius:10px;background:var(--k-surface,#fff);color:inherit;max-width:100%;width:100%}' +
'.n35-f{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:12px;align-items:end;margin:16px 0 8px}.n35-f label{display:flex;flex-direction:column;gap:4px;font-size:.86rem;font-weight:600}' +
'.n35-b{min-height:44px;padding:0 18px;border:0;border-radius:10px;background:var(--k-ink,#13222E);color:var(--k-paper,#F2F4F3);font:inherit;font-weight:700;cursor:pointer}.n35-b2{min-height:44px;padding:0 14px;border:1.5px solid var(--k-line-2,#BCC5C5);border-radius:10px;background:none;color:inherit;font:inherit;font-weight:600;cursor:pointer}' +
'.n35 :is(button,a,select,input,summary):focus-visible{outline:3px solid var(--k-sea,#155C75);outline-offset:2px}.n35-rel{margin:32px 0 8px;padding-top:16px;border-top:1px solid var(--k-line,#D5DCDB)}.n35-rel ul{display:flex;flex-wrap:wrap;gap:8px 18px;list-style:none;padding:0}.n35-rel a{display:inline-flex;align-items:center;min-height:44px}' +
'.n35-card{border:1px solid var(--k-line,#D5DCDB);border-radius:14px;padding:16px 18px;background:var(--k-surface,#fff);margin:12px 0}.n35-big{font-size:1.6rem;font-weight:800;margin:0}.n35-note{font-size:.9rem;color:var(--k-ink-2,#2F3E4B)}.n35-dot{fill:#C9440E;stroke:var(--k-surface,#fff)}:root[data-theme=dark] .n35-dot{fill:#FF6A2B}' +
'@media print{.n35-f,.n35-rel,.n35-np,header,footer,.ship{display:none!important}.n35-card{break-inside:avoid}body{background:#fff!important;color:#000!important}}</style>';
function rel(l, k) {
const L = ALL.filter(a => a[0] !== k);
return '<nav class="n35-rel" aria-label="' + esc(t(l, 'also')) + '"><h2>' + esc(t(l, 'also')) + '</h2><ul>' + L.map(a => '<li><a href="' + (a[2] ? '' : pre(l)) + a[1] + '">' + esc(t(l, a[0])) + '</a></li>').join('') + '</ul></nav>';
}
async function page(shell, l, o) {
  const canon = ORIGIN + pre(l) + o.path;
  const crumbs = [[t(l, 'home'), pre(l) + '/']].concat(o.crumb || []).concat([[o.h1, null]]);
  const body = '<section class="phero"' + dirA(l) + '><div class="wrap"><p class="crumb">' + crumbs.map(c => c[1] ? '<a href="' + esc(c[1]) + '">' + esc(c[0]) + '</a>' : esc(c[0])).join(' / ') + '</p><h1>' + esc(o.h1) + '</h1><p class="lead">' + esc(o.lead) + '</p>' +
    (o.updated ? '<p class="k-xs">' + esc(tf(l, 'upd', { d: fdt(o.updated, l) })) + '</p>' : '') + '</div></section><div class="wrap n35"' + dirA(l) + '>' + CSS + o.body + (o.k ? rel(l, o.k) : '') + '</div>';
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': o.type || 'WebPage', url: canon, name: o.h1, description: o.lead, inLanguage: l, dateModified: o.updated || '2026-11-22', isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] ? ORIGIN + c[1] : canon })) }] };
  const desc = o.lead.length > 155 ? o.lead.slice(0, 152).replace(/\s+\S*$/, '') + '…' : o.lead, title = o.title || o.h1;
  let html = await N.assemble({ title: (title.length > 56 ? title.slice(0, 56).replace(/\s+\S*$/, '') : title) + ' | Kolaboro', desc, canon, body, ld, alt: x => ORIGIN + pre(x) + o.path }, l, await shell(pre(l) + '/how-we-score/'));
  if (o.noindex) html = html.replace('</head>', '<meta name="robots" content="noindex, follow"></head>');
  const h = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=' + (o.maxAge || 900), 'content-language': l };
  if (o.noindex) h['x-robots-tag'] = 'noindex, follow';
  return new Response(html, { status: 200, headers: h });
}
const median = v => { if (!v.length) return null; const s = [...v].sort((a, b) => a - b), n = s.length; return n % 2 ? s[n >> 1] : (s[n / 2 - 1] + s[n / 2]) / 2; };
let CC = null;
async function courts(env) { if (CC) return CC; const j = await file(env, '/data/court-cases.json', 864e5); CC = (j && j.cases) || []; return CC; }
function devFacts(ix, dv, cc) {
const L = dv.ids.map(i => ix.byId.get(i)).filter(okX), n = L.length;
const st = { o: 0, u: 0, c: 0 }, mk = new Map(); let wd = 0, past = 0, pm = 0; const mv = [], ov = [];
for (const x of L) {
const c = ix.caseBy.get(x.id) || {}, s = String(c.stage || x.st || '');
if (/completed/.test(s)) st.c++; else if (/construction/.test(s)) st.u++; else if (/off/.test(s)) st.o++;
mk.set(x.mk, (mk.get(x.mk) || 0) + 1);
if (N.handoverOf(ix, x)) wd++;
if (+c.overdue > 0) { past++; ov.push(+c.overdue); }
if (x.pn) pm++;
const h = (ix.prom[x.id] || []).find(p => p.k === 'handover'); if (h && (h.mv || 0) > 0) mv.push(+h.mm || 0);
}
const sl = new Set(L.map(x => x.s)), cases = cc.filter(c => c.dev === dv.s || (c.project && sl.has(c.project)));
return { dv, n, st, mk: [...mk.entries()].sort((a, b) => b[1] - a[1]), wd, past, ov, pm, mv, cases };
}
async function dcPage(env, shell, l, u) {
const ix = await N.data(env), cc = await courts(env), P = pre(l);
const opts = [...ix.devs.values()].filter(d => d.ids.length >= 2 && okX({ n: d.n, dv: d.n })).sort((a, b) => b.ids.length - a.ids.length || a.n.localeCompare(b.n));
const byName = new Map(opts.map(d => [d.n.toLowerCase(), d.s]));
let want = (u.searchParams.get('d') || '').split(',').concat(['d1', 'd2', 'd3', 'd4'].map(k => u.searchParams.get(k) || '')).map(s => s.trim().toLowerCase()).map(s => byName.get(s.replace(/\s*\(\d+\)$/, '')) || s).filter(s => /^[a-z0-9-]{1,90}$/.test(s));
want = [...new Set(want)].filter(s => ix.devs.has(s) && okX({ n: ix.devs.get(s).n })).slice(0, 4);
const custom = want.length >= 1; if (want.length < 2) want = want.concat(opts.map(d => d.s).filter(x => !want.includes(x))).slice(0, 3);
const F = want.map(s => devFacts(ix, ix.devs.get(s), cc));
const sel = i => '<label for="n35d' + i + '">' + esc(tf(l, 'dc_pick', { i: i + 1 })) + '<input type="text" id="n35d' + i + '" name="d' + (i + 1) + TB.kbx_n35b__t.k0 + (want[i] ? esc(ix.devs.get(want[i]).n) : '') + '"></label>';
const dl = '<datalist id="n35dl">' + opts.map(d => '<option value="' + esc(d.n) + '">').join('') + '</datalist>';
const of = (a, b) => esc(tf(l, 'dc_of', { a: nf(a, l), b: nf(b, l) }));
const rows = [
['dc_proj', f => nf(f.n, l)],
['dc_mk', f => f.mk.slice(0, 6).map(([m, k]) => '<a href="/m/' + encodeURIComponent(m.toLowerCase().replace(/\s+/g, '-')) + '/">' + esc(mkName(m, l)) + '</a> (' + k + ')').join(', ') + (f.mk.length > 6 ? ' +' + (f.mk.length - 6) : '')],
['dc_stage', f => nf(f.st.o, l) + ' / ' + nf(f.st.u, l) + ' / ' + nf(f.st.c, l)],
['dc_date', f => of(f.wd, f.n)],
['dc_moved', f => of(f.mv.length, f.n) + (f.mv.length ? '<br><small>' + esc(tf(l, 'dc_mvm', { m: nf(median(f.mv), l, 1) })) + '</small>' : '')],
['dc_past', f => of(f.past, f.wd) + (f.ov.length ? '<br><small>' + esc(tf(l, 'dc_mvm', { m: nf(median(f.ov), l, 1) })) + '</small>' : '')],
['dc_pm', f => of(f.pm, f.n)],
['dc_cc', f => nf(f.cases.length, l) + (f.cases.length ? '<br><small>' + f.cases.slice(0, 4).map(c => '<a href="' + esc(c.src) + TB.kbx_n35b__t.k1 + esc(c.no) + '</a>').join(', ') + '</small>' : '')]];
const tbl = TB.kbx_n35b__t.k2 + esc(t(l, 'dc_t')) + '"><table><thead><tr><th scope="col">' + esc(t(l, 'dc_th')) + '</th>' + F.map(f => '<th scope="col"><a href="' + P + '/developers/' + f.dv.s + '/">' + esc(f.dv.n) + '</a></th>').join('') + '</tr></thead><tbody>' +
rows.map(([k, fn]) => '<tr><th scope="row">' + esc(t(l, k)) + '</th>' + F.map(f => '<td class="n">' + fn(f) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
const upd = String(ix.updated || '').slice(0, 10);
const b = TB.kbx_n35b__t.k3 + P + '/developers/compare/">' + [0, 1, 2, 3].map(sel).join('') + dl + '<button class="n35-b" type="submit">' + esc(t(l, 'dc_go')) + '</button></form><p class="k-xs">' + esc(t(l, 'dc_tip')) + '</p>' +
tbl + '<p class="n35-note">' + esc(tf(l, 'dc_meth', { d: fdt(upd, l) })) + '</p><p class="n35-note"><b>' + esc(t(l, 'hist')) + TB.kbx_n35b__s.k0;
const names = F.map(f => f.dv.n).join(', ');
return page(shell, l, { k: 'dc_t', path: '/developers/compare/', h1: custom ? tf(l, 'dc_h1x', { a: names }) : t(l, 'dc_t'), title: custom ? tf(l, 'dc_h1x', { a: names }) : t(l, 'dc_t'), lead: t(l, 'dc_l'), body: b, updated: upd, noindex: custom, crumb: [[t(l, 'developers'), P + '/developers/']], type: 'WebPage' });
}
async function bjPage(env, shell, l, x) {
const ix = await N.data(env), P = pre(l), c = ix.caseBy.get(x.id) || {}, ho = N.handoverOf(ix, x);
const [M, TR] = await Promise.all([file(env, '/data/n34b-markets.json'), import('./kbx_tr.js').then(m => m.trProject(env, x.id, l)).catch(() => null)]);
const mk = ((M && M.markets) || []).find(m => m.market === x.mk) || null, regs = mk ? mk.registers || [] : [];
const L6 = light6({ tp: TR, c, pn: x.pn, ho, ev: x.ev, ids: [] }), it = {}; for (const i of ((TR && TR.items) || [])) it[i.k] = i.st;
const say = a => a.filter(Boolean).length ? '<p class="n35-say"><b>' + esc(t(l, 'bj_say')) + ':</b> ' + a.filter(Boolean).join(' ') + '</p>' : '';
const lk = (k, h) => '<a href="' + esc(h) + '">' + esc(t(l, k)) + '</a>';
const regL = (f) => { const R = regs.filter(f); return R.length ? esc(tf(l, 'r_reg', { m: mkName(x.mk, l) })) + ' ' + R.map(r => '<a href="' + esc(r.url) + TB.kbx_n35b__t.k4 + esc(r.name) + '</bdi></a>').join(', ') + '.' : ''; };
const st = k => L6.find(p => p[0] === k)[2];
const pm = mk && mk.past_date && mk.past_date.n >= 3 ? esc(tf(l, 'r_mk', { m: mkName(x.mk, l), n: nf(mk.past_date.n, l), k: nf(mk.past_date.median, l, 1) })) : '';
const hm = (ix.prom[x.id] || []).find(p => p.k === 'handover');
const S = [
['s1', [x.pn ? esc(tf(l, 'r_pn', { v: '\u0000' })).replace('\u0000', '<bdi>' + esc(x.pn) + '</bdi>') : esc(t(l, 'r_pn0')), esc(tf(l, 'r_co', { s: t27(l, st('company')[1], st('company')[2]) })), regL(r => (r.checks || []).some(k => /permit|licen|company/.test(k)))], [lk('l_q', P + '/projects/' + x.s + '/questions/')]],
['s2', [it.deposit === 'yes' ? esc(t(l, 'r_dep')) : it.deposit ? esc(t(l, 'r_dep0')) : '', regL(r => (r.checks || []).some(k => /escrow|deposit/.test(k)))], []],
['s3', [], [lk('l_cr', P + '/tools/contract-reader/'), lk('l_vault', P + '/tools/vault/')]],
['s4', [regL(r => (r.checks || []).some(k => /title|sale/.test(k)))], []],
['s5', [], [lk('l_pvp', '/tools/payment-vs-progress/')]],
['s6', [esc(tf(l, 'r_build', { s: t27(l, st('build')[1], st('build')[2]) }))], [lk('l_watch', P + '/projects/' + x.s + '/#watch'), lk('l_sat', P + '/projects/' + x.s + '/#space')]],
['s7', [ho ? esc(tf(l, 'r_ho', { d: N.fd(ho.d, l) })) : esc(t(l, 'r_ho0')), +c.overdue > 0 ? esc(tf(l, 'r_ov', { m: nf(+c.overdue, l) })) : '', hm && hm.mv > 0 && hm.mm > 0 ? esc(tf(l, 'r_mv', { m: nf(hm.mm, l) })) : '', pm], []],
['s8', [], [lk('l_site', '/tools/site-visit/')]],
['s9', [], []]];
const b = TB.kbx_n35b__t.k5 + esc(x.id) + TB.kbx_n35b__t.k6 + esc(t(l, 'bj_n')) + TB.kbx_n35b__t.k7 + esc(t(l, 'bj_print')) + TB.kbx_n35b__t.k8 + esc(t(l, 'bj_reset')) + '</button></p><ol class="n35-bjl">' +
S.map(([k, rec, links], i) => TB.kbx_n35b__t.k9 + (i + 1) + '"> <b>' + esc(t(l, k)) + '</b></label><p>' + esc(t(l, k + 'd')) + '</p>' + say(rec) + (links.length ? '<p class="k-xs n35-np">' + links.join(' · ') + '</p>' : '') + '</li>').join('') + '</ol></div>' +
'<p class="n35-note">' + lk('l_proj', P + '/projects/' + x.s + '/') + ' · ' + lk('l_my', '/tools/my-checklist/') + ' · ' + esc(t(l, 'hist')) + '</p>' +
TB.kbx_n35b__s.k1 +
TB.kbx_n35b__s.k2 +
TB.kbx_n35b__s.k3 +
TB.kbx_n35b__s.k4 +
TB.kbx_n35b__t.k10;
return page(shell, l, { path: '/projects/' + x.s + '/journey/', h1: tf(l, 'bj_t', { n: x.n }), lead: tf(l, 'bj_l', { n: x.n }), body: b, updated: N.lastmod(ix, x), noindex: true, crumb: [[t(l, 'projects'), P + '/projects/'], [x.n, P + '/projects/' + x.s + '/']] });
}
const VK = ['c_new', 'c_open', 'c_pp', 'c_pp2', 'c_ppw', 'c_bad', 'c_mis', 'c_short', 'c_add', 'c_drop', 'c_empty', 'c_name', 'c_size', 'c_added', 'c_view', 'c_dl', 'c_cr', 'c_del', 'c_delq', 'c_lock', 'c_exp', 'c_imp', 'c_impok', 'c_impbad', 'c_wipe', 'c_wipeq', 'c_busy', 'c_n', 'c_nosup', 'c_locked', 'c_big', 'c_act'];
async function vtPage(env, shell, l) {
const S = Object.fromEntries(VK.map(k => [k, t(l, k)])); S._loc = LOC[l]; S._p = pre(l);
const b = TB.kbx_n35b__s.k5 + esc(t(l, 'vt_how')) + '</b></summary><p>' + esc(t(l, 'vt_howd')) + '</p></details>' +
TB.kbx_n35b__t.k11 + JSON.stringify(S).replace(/</g, '\\u003c') + TB.kbx_n35b__t.k12 + V + '" defer></script>';
return page(shell, l, { k: 'vt_t', path: '/tools/vault/', h1: t(l, 'vt_t'), lead: t(l, 'vt_l'), body: b, updated: '2026-11-22', crumb: [[t(l, 'tools'), pre(l) + '/tools/']], type: 'WebApplication' });
}
const wilson = (k, n) => { const z = 1.96, p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d; return [Math.max(0, c - h), Math.min(1, c + h)]; };
async function pmPage(env, shell, l, u) {
const D = ((await file(env, '/data/n35b.json')) || {}).ppm, P = pre(l), M = (D && D.markets) || [];
const ms = (u.searchParams.get('m') || '').toLowerCase(), m = M.find(x => x.slug === ms) || null;
const pr = parseFloat(String(u.searchParams.get('p') || '').replace(/[^\d.]/g, '')), sz = parseFloat(String(u.searchParams.get('s') || '').replace(/[^\d.]/g, ''));
const asked = !!(ms || u.searchParams.has('p'));
let res = '';
if (asked && m && pr > 0 && sz > 0) {
const v = pr / sz, n = m.n, lo = m.v.filter(a => a < v).length, eq = m.v.filter(a => a === v).length, k = lo + eq / 2, ci = wilson(k, n), pct = Math.round(k / n * 100);
const W = 640, H = 92, a = Math.min(m.v[0], v), z = Math.max(m.v[n - 1], v), sc = x => 16 + (Math.log(x) - Math.log(a)) / ((Math.log(z) - Math.log(a)) || 1) * (W - 32);
const svg = '<svg viewBox="0 0 ' + W + ' ' + H + TB.kbx_n35b__t.k13 + esc(tf(l, 'pm_pos', { p: pct, n: nf(n, l), m: mkName(m.market, l), a: Math.round(ci[0] * 100), b: Math.round(ci[1] * 100) })) + '" style="max-width:' + W + 'px;display:block">' +
'<rect x="' + sc(m.q1).toFixed(1) + '" y="22" width="' + Math.max(2, sc(m.q3) - sc(m.q1)).toFixed(1) + TB.kbx_n35b__t.k14 +
m.v.map(x => '<line x1="' + sc(x).toFixed(1) + '" x2="' + sc(x).toFixed(1) + TB.kbx_n35b__t.k15).join('') +
'<line x1="' + sc(m.median).toFixed(1) + '" x2="' + sc(m.median).toFixed(1) + TB.kbx_n35b__t.k16 +
'<circle cx="' + sc(v).toFixed(1) + TB.kbx_n35b__t.k17 +
TB.kbx_n35b__t.k18 + esc(nf(m.v[0], l)) + '</text><text x="' + (W - 16) + TB.kbx_n35b__t.k19 + esc(nf(m.v[n - 1], l)) + ' ' + esc(m.currency) + '</text></svg>';
res = TB.kbx_n35b__t.k20 + esc(tf(l, 'pm_res', { v: nf(v, l), c: m.currency })) + '</p><p><b>' + esc(tf(l, 'pm_pos', { p: pct, n: nf(n, l), m: mkName(m.market, l), a: Math.round(ci[0] * 100), b: Math.round(ci[1] * 100) })) + '</b></p>' + svg +
'<p class="k-xs">' + esc(t(l, 'pm_dist')) + '</p><p>' + esc(tf(l, 'pm_med', { v: nf(m.median, l), c: m.currency, a: nf(m.ci95[0], l), b: nf(m.ci95[1], l), q1: nf(m.q1, l), q3: nf(m.q3, l) })) + '</p></div>';
} else if (asked) res = '<p class="n35-card" role="alert">' + esc(t(l, 'pm_bad')) + '</p>';
const opt = M.map(x => '<option value="' + x.slug + '"' + (m && m.slug === x.slug ? ' selected' : '') + '>' + esc(mkName(x.market, l)) + ' (' + x.currency + ', ' + x.n + ')</option>').join('');
const b = TB.kbx_n35b__t.k21 + P + TB.kbx_n35b__t.k22 + esc(t(l, 'pm_mk')) + '<select id="n35pm" name="m" required>' + opt + '</select></label>' +
'<label for="n35pp">' + esc(t(l, 'pm_p')) + (m ? ' (' + esc(m.currency) + ')' : '') + TB.kbx_n35b__t.k23 + (pr > 0 ? esc(pr) : '') + '"></label>' +
'<label for="n35ps">' + esc(t(l, 'pm_s')) + TB.kbx_n35b__t.k24 + (sz > 0 ? esc(sz) : '') + TB.kbx_n35b__t.k25 + esc(t(l, 'pm_go')) + '</button></form>' + res +
'<p class="n35-note">' + esc(tf(l, 'pm_note', { d: fdt(D && D.built, l) })) + ' ' + esc(t(l, 'pm_meth')) + TB.kbx_n35b__t.k26 +
'<h2>' + esc(t(l, 'pm_tbl')) + TB.kbx_n35b__t.k27 + esc(t(l, 'pm_tbl')) + '"><table><thead><tr><th scope="col">' + esc(t(l, 'pm_mk')) + '</th><th scope="col">' + esc(t(l, 'pm_th_n')) + '</th><th scope="col">' + esc(t(l, 'pm_th_med')) + '</th><th scope="col">' + esc(t(l, 'pm_th_ci')) + '</th></tr></thead><tbody>' +
M.map(x => '<tr><td><a href="' + P + '/tools/price-per-m2/?m=' + x.slug + '">' + esc(mkName(x.market, l)) + '</a></td><td class="n">' + nf(x.n, l) + '</td><td class="n">' + nf(x.median, l) + ' ' + esc(x.currency) + '</td><td class="n">' + nf(x.ci95[0], l) + ' – ' + nf(x.ci95[1], l) + '</td></tr>').join('') + '</tbody></table></div>' +
TB.kbx_n35b__s.k6 + M.map(x => '"' + x.slug + '":"' + x.currency + '"').join(',') + TB.kbx_n35b__s.k7;
return page(shell, l, { k: 'pm_t', path: '/tools/price-per-m2/', h1: t(l, 'pm_t'), lead: t(l, 'pm_l'), body: b, updated: D && D.built, noindex: asked, crumb: [[t(l, 'tools'), P + '/tools/']], type: 'WebApplication', maxAge: 600 });
}
export async function incidentsHtml(env, l) {
await loadT(env); const D = ((await file(env, '/data/n35b.json')) || {}).incidents; if (!D || !T) return '';
const fdh = s => { if (!s) return ''; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(s.replace(/Z$/, ':00Z'))); } catch (e) { return s; } };
const dur = x => { if (!x.end) return '…'; const m = Math.round((Date.parse(x.end.replace(/Z$/, ':00Z')) - Date.parse(x.start.replace(/Z$/, ':00Z'))) / 60000); return m < 1 ? '<1 min' : m < 120 ? m + ' min' : Math.round(m / 60) + ' h'; };
const S = D.summary || {};
return '<section id="incidents"' + dirA(l) + '><h2>' + esc(t(l, 'in_h')) + '</h2><p>' + esc(t(l, 'in_l')) + ' ' + esc(tf(l, 'in_sum', { k: nf(S.last_30_days || 0, l), r: nf(S.rollbacks_30d || 0, l) })) + ' <span class="k-xs">' + esc(t(l, 'in_lang')) + '</span></p>' +
TB.kbx_n35b__t.k28 + esc(t(l, 'in_h')) + '"><table><thead><tr><th scope="col">' + esc(t(l, 'in_when')) + '</th><th scope="col">' + esc(t(l, 'in_what')) + '</th><th scope="col">' + esc(t(l, 'in_imp')) + '</th><th scope="col">' + esc(t(l, 'in_dur')) + '</th><th scope="col">' + esc(t(l, 'in_fix')) + '</th></tr></thead><tbody>' +
(D.incidents || []).map(x => '<tr id="i-' + esc(x.id) + '"><td><time datetime="' + esc(x.start.replace(/Z$/, ':00Z')) + '">' + esc(fdh(x.start)) + '</time><br><small>' + esc(x.kind) + '</small></td><td lang="en">' + esc(x.what) + '</td><td lang="en">' + esc(x.impact) + '</td><td class="k-n">' + dur(x) + '</td><td lang="en">' + esc(x.fix) +
((x.commits || []).filter(Boolean).length ? ' <small>' + x.commits.filter(Boolean).map(c => '<code>' + esc(c) + '</code>').join(' ') + '</small>' : '') + '</td></tr>').join('') +
TB.kbx_n35b__t.k29 + esc(t(l, 'in_json')) + TB.kbx_n35b__s.k8;
}
export async function handle(req, u, env, ctx, shell) {
if (req.method !== 'GET' && req.method !== 'HEAD') return null;
await loadT(env); if (!T) return null;
const p = u.pathname; let m;
if ((m = p.match(RX.bj))) {
if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } });
const ix = await N.data(env), x = ix.bySlug.get(m[2]); if (!x || !okX(x)) return null;
return bjPage(env, shell, m[1] || 'en', x);
}
for (const [k, fn] of [['dc', dcPage], ['vt', vtPage], ['pm', pmPage]]) {
if ((m = p.match(RX[k]))) { if (!m[2]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } }); return fn(env, shell, m[1] || 'en', u); }
}
return null;
}
