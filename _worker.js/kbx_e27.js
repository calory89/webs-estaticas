// kolaboro.com batch 27 (agent n27e, 13 Nov 2026): email and return visits. No paid AI, no database writes, nothing sent, nothing invented.
//   GET /[<lang>/]projects/<slug>/report/        free project report (8 languages, print ready, noindex): the facts we hold, each with its
//                                                source, the transparency checklist, the dated changes on record. Offered in the watch box
//                                                of every project page (item 77): the email goes through the existing watch path.
//   GET /[<lang>/]projects/<slug>/report.pdf     the same report as a PDF built at the edge by the small writer below (standard PDF fonts,
//                                                so English, Spanish, German, French and Dutch; Russian, Chinese and Arabic get the English PDF
//                                                and their own language on the print-ready page)
//   GET /[<lang>/]weekly/                        what changed this week, place by place (item 78), hub
//   GET /[<lang>/]weekly/<place>/                one island or city (the places of the transparency rankings, Sumba excluded): every dated
//                                                change of the week and of the 7 weeks before, counted by code from the public data files
//   GET /weekly/<place>/feed.atom|feed.json      the same as feeds (English)
//   GET /weekly/sitemap.xml                      hub and places with changes, 8 languages with hreflang alternates
//   GET /api/x/e27/mail/<review|delays>?lang=&id=|place=   preview of the two email templates (items 82, 83). NOTHING IS SENT: no code
//                                                path here sends email; the page says so. Needs a recipients function and the mail key.
//   GET /api/x/e27/signups                       which project pages brought confirmed email watchers (item 85), read through the existing
//                                                counters function (kolaboro_xc 'counts', below 3 not shown) in chunks of 40 projects a day
//   GET /api/x/e27/notices/<ID>                  official notices about the developer company of one project (item 79), the state the push
//                                                alert job compares (kbx_j.js pushRun): gazette insolvency or dissolution notices and the
//                                                insolvency watch, each with date, source and link
// Data: /data/named.json, bali-cases.json, promises.json, findings-by-project.json (through kbx_named.js data()), /data/price-history.json,
// /data/gazette.json, /data/insolvency-watch.json. Places: kbx_tr_places.js. Sumba, Eco Beach City and Equinox never appear here.
import * as N from './kbx_named.js';
import { TB } from './kbx_strings.js';
import { TR_PLACES, inPlace } from './kbx_tr_places.js';
import { E } from './kbx_e27_i18n.js';
import { regSale, rsText } from './kbx_n31d_rs.js';   // n31d: DLD registered sale prices are not asking prices

const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const PDF_LANGS = new Set(['en', 'es', 'de', 'fr', 'nl']);
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const COI = /eco\s*beach|equinox/i;
const pre = l => l === 'en' ? '' : '/' + l;
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const xe = t => esc(t).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
const t = (lang, k, v) => { let s = (E[lang] && E[lang][k] != null) ? E[lang][k] : E.en[k]; if (v && typeof s === 'string') for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b); return s; };
const bd = (lang, s) => lang === 'ar' ? '<bdi>' + s + '</bdi>' : s;
const nf = (n, l) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB').format(n); } catch (e) { return String(n); } };
const PLACES = TR_PLACES.filter(P => !P.coi);
const okName = x => !COI.test(String(x.n || '')) && !COI.test(String(x.dv || ''));

export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:projects\/[a-z0-9-]{1,90}\/report(?:\/|\.pdf)?|weekly(?:\/[a-z0-9-]{2,40})?\/?)$|^\/weekly\/(?:[a-z0-9-]{2,40}\/feed\.(?:atom|json)|sitemap\.xml)$|^\/api\/x\/e27\/(?:mail\/(?:review|delays)|signups|notices\/[A-Za-z0-9-]{3,20})\/?$/;

// ------------------------------------------------------------------------------------------------ extra data
const MEMO = {};
async function file(env, name) {
  const m = MEMO[name]; if (m && (m.a || Date.now() - m.t < 600000)) return m.v;
  let r = null, a = false, v = null;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); a = !!(r && r.ok); } catch (e) { r = null; }
  try { if (!r || !r.ok) r = await fetch(ORIGIN + '/data/' + name, { cf: { cacheTtl: 600, cacheEverything: true } }); if (r.ok) v = await r.json(); } catch (e) { v = null; }
  MEMO[name] = { t: Date.now(), v, a: a && !!v }; return v;
}
async function extra(env) {
  const [ph, gz, iw] = await Promise.all([file(env, 'price-history.json'), file(env, 'gazette.json'), file(env, 'insolvency-watch.json')]);
  return { ph: (ph && ph.projects) || {}, gz: (gz && gz.devs) || {}, gzSrc: Object.fromEntries(((gz && gz.sources) || []).map(s => [s.id, s])), iw: (iw && iw.projects) || {}, iwCov: ((iw && iw.coverage && iw.coverage.covered) || []) };
}

// ------------------------------------------------------------------------------------------------ dated events of one project
// Language neutral: {d (YYYY-MM-DD), k (kind), key, v (values), src (URL)}. The same kinds as the project feed (kbx_follow.js events()),
// minus "date on record" first sightings (a first record is not a change), plus price headlines and official notices.
const LIST_KINDS = new Set(['insolvency', 'dissolution']);
export function noticesOf(ix, X, x) {
  const L = [];
  const g = x.dvs && X.gz[x.dvs];
  for (const r of (g && g.notices_all) || []) if (LIST_KINDS.has(r[3]) && N.okHttp(r[4])) L.push({ d: r[0], t: r[2], s: (X.gzSrc[r[1]] || {}).name || r[1], src: r[4] });
  const w = X.iw[x.id];
  for (const f of (w && w.found) || []) { const cov = X.iwCov.find(c => f.source && f.source.indexOf(c.country === 'United Kingdom' ? 'Gazette' : 'BORME') >= 0); L.push({ d: f.date, t: f.type, s: f.source, src: (cov && cov.url) || ORIGIN + '/data/insolvency-watch.json' }); }
  const seen = new Set();
  return L.filter(n => N.iso(n.d) && !seen.has(n.d + n.t) && seen.add(n.d + n.t)).sort((a, b) => b.d.localeCompare(a.d));
}
function evs(ix, X, x) {
  const c = ix.caseBy.get(x.id) || {}, page = N.okHttp(x.url) ? N.fixU(x.url) : null, base = '/projects/' + x.s + '/', E2 = [];
  const add = (d, k, key, v, src) => { const i = N.iso(d); if (i) E2.push({ d: i, k, key: x.id + '/' + key, v: v || {}, src: src || page }); };
  if (x.ad) add(x.ad, 'added', 'added', {}, ORIGIN + base);
  for (const h of c.history || []) add(h.d, 'field', 'f/' + h.d + '/' + String(h.f).replace(/\W+/g, '-'), { f: h.f }, page);
  for (const q of ix.prom[x.id] || []) {
    const H = (q.hist || []).slice().sort((a, b) => String(a.seen).localeCompare(String(b.seen)));
    H.forEach((h, i) => { if (i && h.d !== H[i - 1].d) add(h.seen, 'moved', 'm/' + q.k + '/' + h.seen + '/' + i, { w: q.k, a: H[i - 1].d, b: h.d }, page); });
  }
  const fdays = new Set(); for (const f of ((ix.find[x.id] || {}).f) || []) { const i = N.iso(f.at); if (i && !fdays.has(i)) { fdays.add(i); add(i, 'page', 'p/' + i, {}, ORIGIN + base + 'changes/'); } }
  const P = X.ph[x.id];
  if (P && P.pts) {
    const H = P.pts.filter(p => p.head && p.head.v && N.iso(p.d)).sort((a, b) => a.d.localeCompare(b.d));
    for (let i = 1; i < H.length; i++) if (H[i].head.cur === H[i - 1].head.cur && H[i].head.v !== H[i - 1].head.v) {
      const src = H[i].src === 'ia' && P.url ? 'https://web.archive.org/web/' + H[i].ref + '/' + P.url : ORIGIN + base + 'changes/';
      add(H[i].d, 'price', 'pr/' + H[i].d, { a: H[i - 1].head.p, b: H[i].head.p }, src);
    }
  }
  if (c.overdue && N.iso(c.checked)) add(c.checked, 'over', 'o/' + N.iso(c.checked), {}, ORIGIN + '/promises/');
  const rw = x.rw || c.register; if (rw && rw.checked) add(rw.checked, 'reg', 'r/' + N.iso(rw.checked), { r: rw.register }, ORIGIN + '/registers/');
  if (c.sat && c.sat.date) add(c.sat.date, 'sat', 's/' + c.sat.date, {}, ORIGIN + '/satellite/');
  for (const n of noticesOf(ix, X, x)) add(n.d, 'list', 'l/' + n.d + '/' + String(n.t).replace(/\W+/g, '-'), { t: n.t, s: n.s }, n.src);
  const seen = new Set(); return E2.filter(e => !seen.has(e.key) && seen.add(e.key));
}
const shortD = (d, lang) => N.fd(d, lang);
function evText(lang, e) {
  const v = e.v;
  if (e.k === 'moved') return t(lang, 'ev_moved', { w: N.tr(lang, 'pk_' + v.w), a: shortD(v.a, lang), b: shortD(v.b, lang) });
  if (e.k === 'field') return t(lang, 'ev_field', { f: v.f });
  if (e.k === 'price') return t(lang, 'ev_price', { a: v.a, b: v.b });
  if (e.k === 'reg') return t(lang, 'ev_reg', { r: v.r || '' });
  if (e.k === 'list') return t(lang, 'ev_list', { t: v.t, s: v.s });
  return t(lang, 'ev_' + e.k);
}

// ------------------------------------------------------------------------------------------------ weeks and places
const DAY = 864e5;
const monday = iso => { const d = new Date(iso + 'T00:00:00Z'); const w = (d.getUTCDay() + 6) % 7; return new Date(d.getTime() - w * DAY).toISOString().slice(0, 10); };
const addD = (iso, n) => new Date(new Date(iso + 'T00:00:00Z').getTime() + n * DAY).toISOString().slice(0, 10);
let WK = null;
async function weekly(env) {
  const ix = await N.data(env), X = await extra(env);
  if (WK && WK.ix === ix && WK.X === X.ph) return WK;
  const today = new Date().toISOString().slice(0, 10), w0 = monday(today), weeks = [...Array(8)].map((_, i) => addD(w0, -7 * i)), from = weeks[7];
  const byPlace = new Map();
  for (const P of PLACES) byPlace.set(P.s, { P, L: [], ev: [] });
  for (const x of ix.P) {
    if (!okName(x)) continue;
    const pl = PLACES.filter(P => inPlace(P, x.mk, x.ar)); if (!pl.length) continue;
    const ev = evs(ix, X, x).filter(e => e.d >= from && e.d <= today);
    for (const P of pl) { const b = byPlace.get(P.s); b.L.push(x); for (const e of ev) b.ev.push(Object.assign({ x }, e)); }
  }
  for (const b of byPlace.values()) b.ev.sort((a, c) => c.d.localeCompare(a.d) || a.x.n.localeCompare(c.x.n));
  WK = { ix, X: X.ph, Xall: X, today, w0, weeks, byPlace }; return WK;
}
const inWeek = (e, w) => e.d >= w && e.d < addD(w, 7);

// ------------------------------------------------------------------------------------------------ page shells
const CSS = '<style id="ke27-css">.ke{padding-bottom:40px}.ke h2{margin:28px 0 8px}.ke-sum{color:var(--muted,#56636F);margin:0 0 10px}.ke-l{list-style:none;padding:0;margin:0 0 18px}.ke-l>li{padding:10px 0;border-bottom:1px solid var(--line,#d5d3cc)}.ke-l>li>a{font-weight:700}' +
  '.ke-l ul{margin:4px 0 0;padding-inline-start:18px}.ke-l small{color:var(--muted,#56636F)}.ke-src{font-size:.85rem}.ke-tw{overflow-x:auto}.ke-t{width:100%;border-collapse:collapse;margin:8px 0 18px}.ke-t th,.ke-t td{text-align:start;padding:9px 8px;border-bottom:1px solid var(--line,#d5d3cc);vertical-align:top}.ke-t td.n{font-variant-numeric:tabular-nums;white-space:nowrap}' +
  '.ke-f{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;margin:14px 0}.ke-note{max-width:760px;color:var(--ink-2,#3a4651)}.ke-acts{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0}.ke-acts a,.ke-acts button{display:inline-flex;align-items:center;min-height:46px;padding:0 16px;border:1.5px solid var(--ink,#17212B);border-radius:12px;background:var(--card,#fff);color:var(--ink,#17212B);font:inherit;font-weight:700;text-decoration:none;cursor:pointer}' +
  '.ke-ok{color:var(--k-ok,#1d7a46)}.ke-mid{color:var(--k-warn,#9a6200)}.ke-no{color:var(--muted,#56636F)}@media print{@page{margin:14mm 12mm}header,footer,nav,.k-ticker,.ktick,.ke-acts,.lsw,.skip,.mcta,.cc,.totop,#shipT{display:none!important}.ke h2{break-after:avoid;margin-top:16px}.ke-l>li,.n34-q>li,.ke-t tr{break-inside:avoid}.ke-ref{border:1px solid #999;padding:6px 8px}.n34-q>li::before{border-color:#999}body{background:#fff!important;color:#000}.ke a{color:#000}.ke a[href^="http"]::after{content:" (" attr(href) ")";font-size:.8em;word-break:break-all}.phero{padding:0!important}}</style>';
async function htmlPage(env, ctx, shell, lang, pg, noindex) {
  let html = await N.assemble(Object.assign({ ld: { '@context': 'https://schema.org', '@type': 'WebPage', name: pg.title, url: pg.canon, inLanguage: lang } }, pg, { body: CSS + pg.body }), lang, await shell(pre(lang) + '/how-we-score/'));
  if (noindex) html = html.replace('</head>', '<meta name="robots" content="noindex, follow"></head>');
  const h = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=900', 'content-language': lang };
  if (noindex) h['x-robots-tag'] = 'noindex, follow';
  return new Response(html, { headers: h });
}
const hero = (lang, h1, lead) => '<section class="phero"' + (lang === 'ar' ? ' dir="rtl"' : '') + '><div class="wrap"><h1>' + h1 + '</h1>' + (lead ? '<p class="lead">' + lead + '</p>' : '') + '</div></section>';
const wrap = (lang, inner) => '<div class="wrap ke"' + (lang === 'ar' ? ' dir="rtl"' : '') + '>' + inner + '</div>';

// ------------------------------------------------------------------------------------------------ the report (item 77)
const STAGE = { 'off-plan': 'st_offplan', 'under construction': 'st_construction', completed: 'st_completed' };
async function reportData(env, x, lang) {
  const ix = await N.data(env), X = await extra(env), c = ix.caseBy.get(x.id) || {}, fx = x.fx || {}, page = N.okHttp(x.url) ? N.fixU(x.url) : null;
  let tp = null; try { const TR = await import('./kbx_tr.js'); tp = await TR.trProject(env, x.id, lang); } catch (e) { tp = null; }
  const ho = N.handoverOf(ix, x), NP = N.tr(lang, 'v_notpub');
  const RS = regSale(x), price = RS ? rsText(lang, RS) : fx.price_min != null ? (fx.currency ? fx.currency + ' ' : '') + nf(fx.price_min, lang) + (fx.price_max != null && fx.price_max !== fx.price_min ? ' - ' + nf(fx.price_max, lang) : '') : null;
  const F = [
    [N.tr(lang, 'k_dev'), x.dv || N.tr(lang, 'v_notstated'), page],
    [N.tr(lang, 'k_loc'), [x.ar, x.mk !== x.ar ? x.mk : null, x.co !== x.mk ? x.co : null].filter(Boolean).join(', '), page],
    [N.tr(lang, 'k_stage'), N.tr(lang, STAGE[c.stage || x.st] || 'st_unknown'), page],
    [N.tr(lang, 'k_hand'), ho ? N.fd(ho.d, lang) + (c.overdue ? '. ' + N.tr(lang, 'g_over', { m: c.overdue }) : '') : NP, page],
    [N.tr(lang, 'k_permit'), x.pn || NP, x.pn ? ((N.okHttp(x.du) ? N.fixU(x.du) : null) || page) : null],
    [N.tr(lang, 'f_price'), price || NP, price ? page : null],
    [N.tr(lang, 'f_plan'), fx.payment_plan && N.cleanOk(String(fx.payment_plan)) ? String(fx.payment_plan) : NP, fx.payment_plan ? page : null],
    [N.tr(lang, 'k_checked'), N.fd(N.lastmod(ix, x), lang), null],
    [N.tr(lang, 'k_page'), page || NP, page]
  ];
  const qa = (() => { try { return N.quickAnswer(ix, x, lang, tp); } catch (e) { return ''; } })();
  const ev = evs(ix, X, x).sort((a, b) => b.d.localeCompare(a.d)).slice(0, 20);
  const srcs = [...new Set([page, N.okHttp(x.du) ? N.fixU(x.du) : null, ...(x.src || []).filter(N.okHttp).map(N.fixU)].filter(Boolean))].slice(0, 20);
  return { ix, x, c, F, qa, tp, ev, srcs, live: ORIGIN + pre(lang) + '/projects/' + x.s + '/', today: new Date().toISOString().slice(0, 10) };
}
const STW = { yes: ['✓', 'ke-ok'], part: ['◐', 'ke-mid'], no: ['○', 'ke-no'], nc: ['?', 'ke-no'] };
const stWord = (lang, st) => st === 'yes' ? N.tr(lang, 'v_pub') : st === 'no' ? N.tr(lang, 'v_notpub') : t(lang, 'st_' + st);
async function reportPage(req, u, env, ctx, shell, lang, x) {
  const R = await reportData(env, x, lang), name = x.n, b = s => bd(lang, s);
  // n34b (batch 34): sections chosen in the due-diligence builder (?s=f&s=c or ?s=f,c; all when absent), questions to ask, report reference
  const SEC = ['f', 'c', 'q', 'h', 's'], want = new Set(u.searchParams.getAll('s').join(',').split(',').map(v => v.trim()).filter(v => SEC.includes(v)));
  const on = k => !want.size || want.has(k);
  let X34 = null; try { X34 = await import('./kbx_n34b.js'); await X34.ready(env); } catch (e) { X34 = null; }
  const tx = (k, v) => X34 ? X34.tx(lang, k, v) : '';
  const a = (u2, l) => u2 ? ' <a class="ke-src" href="' + esc(u2) + '"' + (/^https?:/.test(u2) && !u2.startsWith(ORIGIN) ? ' rel="nofollow noopener" target="_blank"' : '') + '>' + esc(l || t(lang, 'src')) + '</a>' : '';
  let body = hero(lang, esc(t(lang, 'rp_h1', { n: name })), esc(t(lang, 'rp_sub', { d: N.fd(R.today, lang) })));
  let w = '<div class="ke-acts"><a href="' + pre(lang) + '/projects/' + x.s + '/report.pdf" download>' + esc(PDF_LANGS.has(lang) ? t(lang, 'rp_pdf') : t(lang, 'rp_pdf_en')) + '</a><button type="button" onclick="window.print()">' + esc(t(lang, 'rp_print')) + '</button><a href="' + pre(lang) + '/projects/' + x.s + '/">' + esc(t(lang, 'rp_back')) + '</a>' + (X34 ? '<a href="' + pre(lang) + '/tools/due-diligence/?p=' + x.s + '">' + esc(tx('rp_build')) + '</a>' : '') + '</div>';
  if (X34) { let sha = ''; try { const B = await import('./kbx_n30b.js'); sha = String((await B.chain(env)).live.sha256 || ''); } catch (e) { sha = ''; }
    const self = ORIGIN + pre(lang) + '/projects/' + x.s + '/report/' + (want.size ? '?s=' + SEC.filter(k => want.has(k)).join(',') : '');
    w += '<p class="ke-note ke-ref">' + esc(tx('rp_ref', { id: x.id + '-' + R.today.replace(/-/g, ''), d: N.fd(R.today, lang), v: (R.ix.named && R.ix.named.version) || '', u: N.fd((R.ix.named && R.ix.named.updated) || R.ix.updated, lang), h: sha.slice(0, 16) || '-' })) + ' ' + esc(tx('rp_share')) + ' <a href="' + esc(self) + '" dir="ltr">' + esc(self.replace(ORIGIN, 'kolaboro.com')) + '</a>' +
      (want.size ? ' ' + esc(tx('rp_secs', { s: SEC.filter(k => want.has(k)).map(k => tx('sec_' + k)).join(', ') })) : '') + '</p>'; }
  if (R.qa && on('f')) w += '<h2>' + esc(N.tr(lang, 's_glance')) + '</h2><p>' + b(esc(R.qa)) + '</p>';
  if (on('f')) w += '<h2>' + esc(t(lang, 'rp_facts')) + '</h2><div class="ke-tw"><table class="ke-t"><tbody>' + R.F.map(f => '<tr><th scope="row">' + esc(f[0]) + '</th><td>' + b(esc(f[1])) + a(f[2]) + '</td></tr>').join('') + '</tbody></table></div>';
  if (R.tp && on('c')) {
    w += '<h2>' + esc(t(lang, 'rp_tr')) + '</h2><p><b>' + esc(t(lang, 'rp_score', { s: nf(R.tp.score, lang) })) + '</b>' + R.tp.ranks.filter(r => r.ranked).map(r => ' · ' + esc(t(lang, 'rp_rank', { r: nf(r.r, lang), m: nf(r.m, lang), p: r.p }))).join('') + a(R.tp.method, 'kolaboro.com') + '</p>' +
      '<ul class="ke-l">' + R.tp.items.map(i => '<li><span class="' + (STW[i.st] || STW.nc)[1] + '" aria-hidden="true">' + (STW[i.st] || STW.nc)[0] + '</span> <b>' + esc(i.label) + '</b>: ' + b(esc(i.text || stWord(lang, i.st))) + '</li>').join('') + '</ul>';
  }
  if (X34 && on('q')) { try { const Q = await X34.questionsFor(env, x, lang, R.tp); w += X34.QCSS + '<h2>' + esc(tx('rp_q')) + '</h2>' + X34.questionsHtml(lang, Q, { h3: true }) + '<p><a href="' + pre(lang) + '/projects/' + x.s + '/questions/">' + esc(tx('rp_qall')) + '</a></p>'; } catch (e) {} }
  if (on('h')) w += '<h2>' + esc(t(lang, 'rp_ch')) + '</h2>' + (R.ev.length ? '<ul class="ke-l">' + R.ev.map(e => '<li><small>' + esc(N.fd(e.d, lang)) + '</small> ' + b(esc(evText(lang, e))) + a(e.src) + '</li>').join('') + '</ul>' : '<p>' + esc(N.tr(lang, 'no_hist')) + '</p>');
  if (on('s')) w += '<h2>' + esc(N.tr(lang, 's_sources')) + '</h2><ul>' + R.srcs.map(s => '<li><a href="' + esc(s) + '" rel="nofollow noopener" target="_blank">' + esc(s.length > 100 ? s.slice(0, 100) + '...' : s) + '</a></li>').join('') + '</ul>';
  w += '<p class="ke-note">' + esc(t(lang, 'rp_note', { u: '' })) + ' <a href="' + esc(R.live) + '">' + esc(R.live) + '</a></p><p class="ke-note">' + esc(t(lang, 'rp_lic')) + '</p>';
  body += wrap(lang, w);
  const canon = ORIGIN + pre(lang) + '/projects/' + x.s + '/report/';
  return htmlPage(env, ctx, shell, lang, { title: t(lang, 'rp_t', { n: name }) + ' | Kolaboro', desc: t(lang, 'rp_sub', { d: N.fd(R.today, lang) }), canon, body, alt: l => ORIGIN + pre(l) + '/projects/' + x.s + '/report/' }, true);
}

// ---- a small PDF writer: A4, Helvetica and Helvetica-Bold (standard fonts, WinAnsiEncoding), wrapped text, several pages
const HW = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
const WIN = { 0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x96, 0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F };
function winBytes(s) {
  const out = [];
  for (const ch of String(s).replace(/[    ]/g, ' ').replace(/[✓]/g, 'x').replace(/[◐]/g, '~').replace(/[○]/g, 'o').replace(/[→]/g, '>')) {
    const cp = ch.codePointAt(0);
    if (cp >= 32 && cp < 127) out.push(cp); else if (cp >= 0xA0 && cp <= 0xFF) out.push(cp); else if (WIN[cp]) out.push(WIN[cp]);
    else { const d = ch.normalize('NFKD').replace(/[̀-ͯ]/g, ''); const c2 = d.codePointAt(0); out.push(d && c2 >= 32 && c2 < 127 ? c2 : 63); }
  }
  return out;
}
const wOf = (bytes, size, bold) => bytes.reduce((a, c) => a + (c >= 32 && c <= 126 ? HW[c - 32] : 556), 0) * size / 1000 * (bold ? 1.07 : 1);
const pdfStr = bytes => '(' + bytes.map(c => c === 40 || c === 41 || c === 92 ? '\\' + String.fromCharCode(c) : c < 32 || c > 126 ? '\\' + c.toString(8).padStart(3, '0') : String.fromCharCode(c)).join('') + ')';
export function pdfDoc(title, blocks, first) {   // blocks: {t, size, bold, gap, indent, color, rm}; first (n31d): raw drawing operators for page 1 (the certificate QR)
  const W = 595.28, H = 841.89, M = 50, pages = [[]];
  let y = H - M;
  const line = (bytes, size, bold, x, col) => { if (y - size < M) { pages.push([]); y = H - M; } y -= size * 1.3; pages[pages.length - 1].push('BT ' + (col || '0 0 0') + ' rg /' + (bold ? 'F2' : 'F1') + ' ' + size + ' Tf ' + x.toFixed(1) + ' ' + y.toFixed(1) + ' Td ' + pdfStr(bytes) + ' Tj ET'); };
  for (const b of blocks) {
    const size = b.size || 10, x = M + (b.indent || 0), maxW = W - M - x - (b.rm || 0);
    y -= b.gap || 0;
    const words = winBytes(b.t).reduce((acc, c) => { if (c === 32) acc.push([]); else acc[acc.length - 1].push(c); return acc; }, [[]]).filter(w => w.length);
    let cur = [];
    for (let wd of words) {
      while (wOf(wd, size, b.bold) > maxW) { if (cur.length) { line(cur, size, b.bold, x, b.color); cur = []; } let k = wd.length; while (k > 1 && wOf(wd.slice(0, k), size, b.bold) > maxW) k--; line(wd.slice(0, k), size, b.bold, x, b.color); wd = wd.slice(k); }
      const tryL = cur.length ? cur.concat([32], wd) : wd;
      if (wOf(tryL, size, b.bold) > maxW && cur.length) { line(cur, size, b.bold, x, b.color); cur = wd.slice(); } else cur = tryL;
    }
    if (cur.length) line(cur, size, b.bold, x, b.color);
  }
  const objs = [], add = s => { objs.push(s); return objs.length; };
  const cat = add(''), pgs = add(''), f1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'), f2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const kids = [];
  pages.forEach((ops, i) => {
    const foot = 'BT 0.35 0.38 0.42 rg /F1 8 Tf ' + M + ' 28 Td ' + pdfStr(winBytes('kolaboro.com  |  ' + (i + 1) + ' / ' + pages.length)) + ' Tj ET';
    const content = (i === 0 && first ? [first] : []).concat(ops, [foot]).join('\n');
    const cs = add('<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream');
    kids.push(add('<< /Type /Page /Parent ' + pgs + ' 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << /Font << /F1 ' + f1 + ' 0 R /F2 ' + f2 + ' 0 R >> >> /Contents ' + cs + ' 0 R >>'));
  });
  objs[cat - 1] = '<< /Type /Catalog /Pages ' + pgs + ' 0 R >>';
  objs[pgs - 1] = '<< /Type /Pages /Kids [' + kids.map(k => k + ' 0 R').join(' ') + '] /Count ' + kids.length + ' >>';
  const info = add('<< /Title ' + pdfStr(winBytes(title)) + ' /Producer (kolaboro.com) /Creator (kolaboro.com) >>');
  let out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'; const off = [];
  objs.forEach((o, i) => { off.push(out.length); out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
  const xref = out.length;
  out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + off.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') + 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root ' + cat + ' 0 R /Info ' + info + ' 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';
  return Uint8Array.from(out, ch => ch.charCodeAt(0) & 255);   // every character above is a single byte (content is WinAnsi bytes as octal escapes)
}
async function reportPdf(env, lang0, x) {
  const lang = PDF_LANGS.has(lang0) ? lang0 : 'en', R = await reportData(env, x, lang), B = [];
  const GREY = '0.35 0.38 0.42';
  B.push({ t: t(lang, 'rp_h1', { n: x.n }), size: 18, bold: true, rm: 96 });
  B.push({ t: t(lang, 'rp_sub', { d: N.fd(R.today, lang) }), size: 9, color: GREY, gap: 2, rm: 96 });
  if (R.qa) { B.push({ t: N.tr(lang, 's_glance'), size: 12, bold: true, gap: 12, rm: 96 }); B.push({ t: R.qa, size: 10, rm: 96 }); }
  B.push({ t: t(lang, 'rp_facts'), size: 12, bold: true, gap: 12 });
  for (const f of R.F) { B.push({ t: f[0] + ': ' + f[1], size: 10, gap: 2 }); if (f[2] && f[2] !== f[1]) B.push({ t: t(lang, 'src') + ': ' + f[2], size: 8, color: GREY, indent: 12 }); }
  if (R.tp) {
    B.push({ t: t(lang, 'rp_tr'), size: 12, bold: true, gap: 12 });
    B.push({ t: t(lang, 'rp_score', { s: R.tp.score }) + R.tp.ranks.filter(r => r.ranked).map(r => '. ' + t(lang, 'rp_rank', { r: r.r, m: r.m, p: r.p })).join(''), size: 10, bold: true });
    for (const i of R.tp.items) B.push({ t: '[' + (STW[i.st] || STW.nc)[0] + '] ' + i.label + ': ' + (i.text || stWord(lang, i.st)), size: 10, gap: 2 });
    B.push({ t: ORIGIN + R.tp.method, size: 8, color: GREY });
  }
  B.push({ t: t(lang, 'rp_ch'), size: 12, bold: true, gap: 12 });
  if (!R.ev.length) B.push({ t: N.tr(lang, 'no_hist'), size: 10 });
  for (const e of R.ev) { B.push({ t: N.fd(e.d, lang) + ': ' + evText(lang, e), size: 10, gap: 2 }); if (e.src) B.push({ t: e.src, size: 8, color: GREY, indent: 12 }); }
  B.push({ t: N.tr(lang, 's_sources'), size: 12, bold: true, gap: 12 });
  for (const s of R.srcs) B.push({ t: s, size: 8, gap: 1 });
  B.push({ t: t(lang, 'rp_note', { u: R.live }), size: 9, gap: 14, color: GREY });
  B.push({ t: t(lang, 'rp_lic'), size: 9, color: GREY });
  return pdfDoc(t(lang, 'rp_h1', { n: x.n }), B, await certQr(ORIGIN + (lang === 'en' ? '' : '/' + lang) + '/projects/' + x.s + '/certificate/', CERT_L[lang] || CERT_L.en));
}
// n31d (item 154): the QR code of the project's verification certificate page (kbx_n30b.js), drawn as filled squares, 80 pt wide,
// top right of page 1, with a two-word caption under it
const CERT_L = { en: 'Certificate', es: 'Certificado', de: 'Zertifikat', fr: 'Certificat', nl: 'Certificaat' };
async function certQr(url, cap) {
  try {
    const Q = (await import('./kbx_qrgen.js')).default, q = Q(0, 'M'); q.addData(url); q.make();
    const n = q.getModuleCount(), S = 80, c = S / (n + 8), x0 = 595.28 - 50 - S, y0 = 841.89 - 42 - S, R = [];
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) R.push(((x0 + (k + 4) * c).toFixed(2)) + ' ' + ((y0 + S - (r + 5) * c).toFixed(2)) + ' ' + c.toFixed(2) + ' ' + c.toFixed(2) + ' re');
    return '1 1 1 rg ' + x0.toFixed(2) + ' ' + y0.toFixed(2) + ' ' + S + ' ' + S + ' re f 0 0 0 rg ' + R.join(' ') + ' f BT 0.35 0.38 0.42 rg /F1 7 Tf ' + (x0 + 4 * c).toFixed(2) + ' ' + (y0 - 6).toFixed(2) + ' Td ' + pdfStr(winBytes(cap)) + ' Tj ET';
  } catch (e) { return ''; }
}

// ------------------------------------------------------------------------------------------------ weekly pages (item 78)
function weekBlock(lang, wk, b, w, isNow, cap) {
  const a = (u2) => u2 ? ' <a class="ke-src" href="' + esc(u2.replace(ORIGIN, '')) + '"' + (/^https?:/.test(u2) && !u2.startsWith(ORIGIN) ? ' rel="nofollow noopener" target="_blank"' : '') + '>' + esc(t(lang, 'src')) + '</a>' : '';
  const E2 = b.ev.filter(e => inWeek(e, w)), by = new Map();
  for (const e of E2) { if (!by.has(e.x.id)) by.set(e.x.id, []); by.get(e.x.id).push(e); }
  const end = isNow ? wk.today : addD(w, 6);
  let h = '<h2 id="w-' + w + '">' + esc(t(lang, 'wk_week', { a: N.fd(w, lang), b: N.fd(end, lang) })) + (isNow ? ' <small>(' + esc(t(lang, 'wk_now')) + ')</small>' : '') + '</h2>';
  if (!E2.length) return h + '<p class="ke-sum">' + esc(t(lang, 'wk_none')) + '</p>';
  h += '<p class="ke-sum">' + esc(t(lang, 'wk_sum', { e: nf(E2.length, lang), k: nf(by.size, lang) })) + '</p><ul class="ke-l">';
  let i = 0;
  for (const [id, L] of by) {
    if (cap && i++ >= cap) { h += '<li>' + esc(t(lang, 'wk_more', { k: nf(by.size - cap, lang) })) + '</li>'; break; }
    const x = L[0].x;
    h += '<li><a href="' + pre(lang) + '/projects/' + x.s + '/">' + bd(lang, esc(x.n)) + '</a>' + (x.ar && x.ar !== x.mk ? ' <small>' + bd(lang, esc(x.ar)) + '</small>' : '') + '<ul>' +
      L.slice(0, 6).map(e => '<li><small>' + esc(N.fd(e.d, lang)) + '</small> ' + bd(lang, esc(evText(lang, e))) + a(e.src) + '</li>').join('') + (L.length > 6 ? '<li>' + esc(t(lang, 'wk_more', { k: nf(L.length - 6, lang) })) + '</li>' : '') + '</ul></li>';
  }
  return h + '</ul>';
}
async function placePage(req, u, env, ctx, shell, lang, s) {
  const wk = await weekly(env), b = wk.byPlace.get(s); if (!b || !b.L.length) return null;
  const pn = b.P.n, nowE = b.ev.filter(e => inWeek(e, wk.w0)), nowK = new Set(nowE.map(e => e.x.id)).size;
  let w = '<p class="ke-f"><span>' + esc(t(lang, 'wk_feed')) + '</span> <a href="/weekly/' + s + '/feed.atom" type="application/atom+xml">Atom</a> <a href="/weekly/' + s + '/feed.json" type="application/feed+json">JSON Feed</a></p><p class="ke-note">' + esc(t(lang, 'wk_mail')) + '</p>';
  w += weekBlock(lang, wk, b, wk.w0, true, 0);
  w += '<h2>' + esc(t(lang, 'wk_prev')) + '</h2>' + wk.weeks.slice(1).map(x2 => weekBlock(lang, wk, b, x2, false, 25).replace('<h2 ', '<h3 ').replace('</h2>', '</h3>')).join('');
  w += '<p class="ke-f"><a href="' + pre(lang) + '/rankings/transparency/' + s + '/">' + bd(lang, esc(t(lang, 'wk_rank', { p: pn }))) + '</a> <a href="' + pre(lang) + '/weekly/">' + esc(t(lang, 'wk_hub')) + '</a></p>';
  const body = hero(lang, bd(lang, esc(t(lang, 'wk_h1', { p: pn }))), bd(lang, esc(t(lang, 'wk_lead', { k: nf(b.L.length, lang), p: pn })))) + wrap(lang, w);
  const canon = ORIGIN + pre(lang) + '/weekly/' + s + '/', last = b.ev.length ? b.ev[0].d : wk.today;
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebPage', '@id': canon + '#page', url: canon, name: t(lang, 'wk_h1', { p: pn }), inLanguage: lang, dateModified: last, about: { '@type': 'Place', name: pn }, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + pre(lang) + '/' }, { '@type': 'ListItem', position: 2, name: t(lang, 'wk_hub'), item: ORIGIN + pre(lang) + '/weekly/' }, { '@type': 'ListItem', position: 3, name: pn, item: canon }] }] };
  let desc = t(lang, 'wk_desc', { p: pn, e: nf(nowE.length, lang), k: nf(nowK, lang), w: N.fd(wk.w0, lang) }); if ([...desc].length > 155) desc = [...desc].slice(0, 152).join('').replace(/\s+\S*$/, '') + '...';
  let title = t(lang, 'wk_t', { p: pn });
  // n31s (item 185): the ISO week in the title, so each week's log reads as that week's report ("week 47, 2026")
  try { const d = new Date(wk.w0 + 'T00:00:00Z'), th = new Date(d.getTime() + 3 * 864e5), y = th.getUTCFullYear(), w = 1 + Math.round((th - new Date(Date.UTC(y, 0, 4))) / 6048e5 - (3 - ((new Date(Date.UTC(y, 0, 4)).getUTCDay() + 6) % 7)) / 7);
    const WL = { en: 'week {w}, {y}', es: 'semana {w} de {y}', de: 'KW {w}/{y}', fr: 'semaine {w}, {y}', nl: 'week {w}, {y}', ru: '{w}-я неделя {y}', zh: '{y}年第{w}周', ar: 'الأسبوع {w}، {y}' };
    const wl = (WL[lang] || WL.en).replace('{w}', w).replace('{y}', y), t2 = title + (lang === 'zh' ? '（' + wl + '）' : ' (' + wl + ')'); if ([...t2].length <= 60) title = t2; } catch (e) {}
  if ([...title].length + 11 <= 60) title += ' | Kolaboro';
  return htmlPage(env, ctx, shell, lang, { title, desc, canon, body, ld, lastmod: last, alt: l => ORIGIN + pre(l) + '/weekly/' + s + '/', feed: null }, false);
}
async function hubPage(req, u, env, ctx, shell, lang) {
  const wk = await weekly(env), from4 = wk.weeks[3];
  const R = [...wk.byPlace.values()].filter(b => b.L.length).map(b => ({ b, now: b.ev.filter(e => inWeek(e, wk.w0)).length, four: b.ev.filter(e => e.d >= from4).length })).sort((a, c) => c.now - a.now || c.four - a.four || a.b.P.n.localeCompare(c.b.P.n));
  const th = t(lang, 'wk_th');
  const w = '<div class="ke-tw"><table class="ke-t"><thead><tr>' + th.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' +
    R.map(r => '<tr><td><a href="' + pre(lang) + '/weekly/' + r.b.P.s + '/">' + bd(lang, esc(r.b.P.n)) + '</a></td><td class="n">' + nf(r.b.L.length, lang) + '</td><td class="n">' + nf(r.now, lang) + '</td><td class="n">' + nf(r.four, lang) + '</td></tr>').join('') + '</tbody></table></div><p class="ke-note">' + esc(t(lang, 'wk_mail')) + '</p>' + '<p class="ke-f"><a href="' + pre(lang) + '/delays/">' + esc(((TB.kbx_n33a_S || {})[lang] || (TB.kbx_n33a_S || {}).en || {}).dl_t || 'Off-plan delays this week') + '</a></p>';   // n33a (item 85)
  const canon = ORIGIN + pre(lang) + '/weekly/';
  return htmlPage(env, ctx, shell, lang, { title: t(lang, 'wk_hub_t') + ' | Kolaboro', desc: t(lang, 'wk_hub_lead'), canon, body: hero(lang, esc(t(lang, 'wk_hub_t')), esc(t(lang, 'wk_hub_lead'))) + wrap(lang, w), lastmod: wk.today, alt: l => ORIGIN + pre(l) + '/weekly/' }, false);
}
async function placeFeed(req, env, s, fmt) {
  const wk = await weekly(env), b = wk.byPlace.get(s); if (!b || !b.L.length) return new Response('Not found', { status: 404 });
  const E2 = b.ev.slice(0, 80), home = ORIGIN + '/weekly/' + s + '/', self = home + 'feed.' + fmt, title = 'What changed in ' + b.P.n + ' | Kolaboro', upd = (E2[0] ? E2[0].d : wk.today) + 'T00:00:00Z';
  const it = e => ({ id: 'tag:kolaboro.com,2026:weekly/' + s + '/' + e.key, url: ORIGIN + '/projects/' + e.x.s + '/', title: e.x.n + ': ' + evText('en', e), text: e.x.n + ' (' + [e.x.ar, e.x.mk].filter(Boolean).join(', ') + '): ' + evText('en', e) + '.' + (e.src ? ' Source: ' + e.src : ''), d: e.d + 'T00:00:00Z' });
  const h = { 'cache-control': 'public, max-age=1800', 'access-control-allow-origin': '*' };
  if (fmt === 'json') return new Response(JSON.stringify({ version: 'https://jsonfeed.org/version/1.1', title, home_page_url: home, feed_url: self, language: 'en', authors: [{ name: 'Kolaboro', url: ORIGIN + '/' }], items: E2.map(it).map(i => ({ id: i.id, url: i.url, title: i.title, content_text: i.text, date_published: i.d })) }), { headers: Object.assign({ 'content-type': 'application/feed+json; charset=utf-8' }, h) });
  const x = '<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en"><title>' + xe(title) + '</title><id>' + xe(home) + '</id><link rel="self" type="application/atom+xml" href="' + xe(self) + '"/><link rel="alternate" type="text/html" href="' + xe(home) + '"/><updated>' + upd + '</updated><author><name>Kolaboro</name><uri>' + ORIGIN + '/</uri></author><rights>CC BY 4.0</rights>' +
    E2.map(it).map(i => '<entry><title>' + xe(i.title) + '</title><id>' + xe(i.id) + '</id><link rel="alternate" type="text/html" href="' + xe(i.url) + '"/><updated>' + i.d + '</updated><summary type="text">' + xe(i.text) + '</summary></entry>').join('') + '</feed>';
  return new Response(x, { headers: Object.assign({ 'content-type': 'application/atom+xml; charset=utf-8' }, h) });
}
async function sitemap(env) {
  const wk = await weekly(env), alt = p => LANGS.map(l => '<xhtml:link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + p + '"/>').join('') + '<xhtml:link rel="alternate" hreflang="x-default" href="' + ORIGIN + p + '"/>';
  const U = [['/weekly/', wk.today], ['/delays/', wk.today]];   // n33a (item 85): the weekly delays page, same address every week
  for (const b of wk.byPlace.values()) if (b.L.length && b.ev.length) U.push(['/weekly/' + b.P.s + '/', b.ev[0].d]);
  const x = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' + U.flatMap(([p, d]) => LANGS.map(l => '<url><loc>' + ORIGIN + pre(l) + p + '</loc><lastmod>' + d + '</lastmod>' + alt(p) + '</url>')).join('') + '</urlset>';
  return new Response(x, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}

// ------------------------------------------------------------------------------------------------ email templates (items 82, 83): preview only
export function mailReview(lang, x, since, stopUrl) {
  const n = x.n, link = ORIGIN + '/buyer-reports/?project=' + encodeURIComponent(x.id), dir = lang === 'ar' ? ' dir="rtl"' : '';
  return { subject: t(lang, 'm_rev_s', { n }), text: [t(lang, 'm_rev_h', { n, d: N.fd(since, lang) }), '', t(lang, 'm_rev_p'), '', t(lang, 'm_rev_b') + ': ' + link, '', t(lang, 'm_rev_n', { n }), '', t(lang, 'm_foot', { u: stopUrl })].join('\n'),
    html: '<div lang="' + lang + '"' + dir + ' style="font:16px/1.5 Arial,sans-serif;color:#17212B;max-width:560px"><h1 style="font-size:20px">' + esc(t(lang, 'm_rev_h', { n, d: N.fd(since, lang) })) + '</h1><p>' + esc(t(lang, 'm_rev_p')) + '</p><p><a href="' + esc(link) + '" style="display:inline-block;padding:12px 18px;background:#17212B;color:#fff;border-radius:10px;text-decoration:none;font-weight:700">' + esc(t(lang, 'm_rev_b')) + '</a></p><p>' + esc(t(lang, 'm_rev_n', { n })) + '</p><p style="color:#59626B;font-size:13px">' + esc(t(lang, 'm_foot', { u: '' })) + '<a href="' + esc(stopUrl) + '">' + esc(stopUrl) + '</a></p></div>' };
}
export async function mailDelays(env, lang, s, stopUrl) {
  const wk = await weekly(env), b = wk.byPlace.get(s); if (!b) return null;
  const month = wk.today.slice(0, 7), mName = N.fd(month, lang), ix = wk.ix, dir = lang === 'ar' ? ' dir="rtl"' : '';
  const over = b.L.filter(x => (ix.caseBy.get(x.id) || {}).overdue).map(x => ({ x, m: ix.caseBy.get(x.id).overdue })).sort((a, c) => c.m - a.m);
  const mv = new Map(); for (const e of b.ev) if (e.k === 'moved' && e.d.slice(0, 7) === month && e.v.w === 'handover' && String(e.v.b) > String(e.v.a)) mv.set(e.x.id, e);
  const page = ORIGIN + pre(lang) + '/weekly/' + s + '/';
  const li = (x, txt) => '<li><a href="' + ORIGIN + pre(lang) + '/projects/' + x.s + '/">' + esc(x.n) + '</a>: ' + esc(txt) + '</li>';
  const ol = over.slice(0, 10).map(o => li(o.x, N.tr(lang, 'g_over', { m: o.m }))), vl = [...mv.values()].slice(0, 10).map(e => li(e.x, evText(lang, e)));
  return { subject: t(lang, 'm_del_s', { m: mName, p: b.P.n }), text: [t(lang, 'm_del_h', { p: b.P.n, m: mName }), '', t(lang, 'm_del_p', { k: b.L.length, p: b.P.n, o: over.length, v: mv.size }), '', t(lang, 'm_del_b') + ': ' + page, '', t(lang, 'm_foot', { u: stopUrl })].join('\n'),
    html: '<div lang="' + lang + '"' + dir + ' style="font:16px/1.5 Arial,sans-serif;color:#17212B;max-width:600px"><h1 style="font-size:20px">' + esc(t(lang, 'm_del_h', { p: b.P.n, m: mName })) + '</h1><p>' + esc(t(lang, 'm_del_p', { k: nf(b.L.length, lang), p: b.P.n, o: nf(over.length, lang), v: nf(mv.size, lang) })) + '</p>' +
      '<h2 style="font-size:17px">' + esc(t(lang, 'm_del_o')) + '</h2>' + (ol.length ? '<ul>' + ol.join('') + '</ul>' : '<p>' + esc(t(lang, 'm_del_none')) + '</p>') + '<h2 style="font-size:17px">' + esc(t(lang, 'm_del_v')) + '</h2>' + (vl.length ? '<ul>' + vl.join('') + '</ul>' : '<p>' + esc(t(lang, 'm_del_none')) + '</p>') +
      '<p><a href="' + esc(page) + '">' + esc(t(lang, 'm_del_b')) + '</a></p><p style="color:#59626B;font-size:13px">' + esc(t(lang, 'm_foot', { u: '' })) + '<a href="' + esc(stopUrl) + '">' + esc(stopUrl) + '</a></p></div>' };
}
async function mailPreview(u, env, kind) {
  const lang = LANGS.includes(u.searchParams.get('lang')) ? u.searchParams.get('lang') : 'en', stop = ORIGIN + '/search-alerts/#stop';
  let m = null;
  if (kind === 'review') { const ix = await N.data(env), id = String(u.searchParams.get('id') || '').toUpperCase(); const x = ix.byId.get(id) || ix.P.find(okName); if (x && okName(x)) m = mailReview(lang, x, x.ad || ix.updated, stop); }
  else { const s = String(u.searchParams.get('place') || 'bali').toLowerCase(); if (PLACES.some(P => P.s === s)) m = await mailDelays(env, lang, s, stop); }
  if (!m) return new Response('Not found', { status: 404 });
  const page = '<!doctype html><html lang="' + lang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>' + esc(m.subject) + '</title></head><body style="margin:24px;background:#F1EFE9">' +
    '<p style="font:14px Arial,sans-serif;background:#fff3cd;padding:10px 14px;border-radius:8px;max-width:600px">' + esc(t(lang, 'm_prev')) + '</p><p style="font:14px Arial,sans-serif"><b>Subject:</b> ' + esc(m.subject) + '</p><div style="background:#fff;padding:20px;border-radius:12px;max-width:620px">' + m.html + '</div>' +
    '<details style="font:13px monospace;max-width:620px;margin-top:16px"><summary>text/plain</summary><pre style="white-space:pre-wrap">' + esc(m.text) + '</pre></details></body></html>';
  return new Response(page, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600', 'x-robots-tag': 'noindex, nofollow' } });
}

// ------------------------------------------------------------------------------------------------ watch sign-ups by project page (item 85)
const CHUNK = 40;
async function signups(env, ctx) {
  const ix = await N.data(env), ids = ix.P.filter(okName).map(x => x.id).sort(), n = Math.ceil(ids.length / CHUNK), day = new Date().toISOString().slice(0, 10);
  const key = i => new Request(ORIGIN + '/__e27/su/v1/' + day + '/' + i);
  const got = await Promise.all([...Array(n)].map((_, i) => caches.default.match(key(i)).then(r => r ? r.json() : null).catch(() => null)));
  const missing = got.map((g, i) => g ? -1 : i).filter(i => i >= 0);
  if (missing.length) {
    const i = missing[0], part = ids.slice(i * CHUNK, (i + 1) * CHUNK);
    const job = (async () => {
      const { rpcW } = await import('./kolaboro.js'), rows = {};
      for (let k = 0; k < part.length; k += 8) await Promise.all(part.slice(k, k + 8).map(async id => { try { const r = await rpcW('kolaboro_xc', { p_action: 'counts', p_payload: { domain: '', ref: id } }); if (r && r.ok && r.watchers) rows[id] = r.watchers; } catch (e) {} }));
      await caches.default.put(key(i), new Response(JSON.stringify(rows), { headers: { 'cache-control': 'max-age=172800' } }));
    })();
    if (ctx && ctx.waitUntil) ctx.waitUntil(job.catch(() => {}));
  }
  let total = null; try { const { rpc } = await import('./kolaboro.js'); const m = await rpc('kolaboro_metrics_public', {}); total = m && m.totals ? m.totals.followers : null; } catch (e) {}
  const rows = [];
  got.forEach(g => { if (g) for (const [id, w] of Object.entries(g)) { const x = ix.byId.get(id); if (x && w >= 3) rows.push({ id, slug: x.s, name: x.n, market: x.mk, watchers: w, page: ORIGIN + '/projects/' + x.s + '/' }); } });
  rows.sort((a, b) => b.watchers - a.watchers);
  const checked = got.reduce((a, g, i) => a + (g ? ids.slice(i * CHUNK, (i + 1) * CHUNK).length : 0), 0);
  return new Response(JSON.stringify({ version: 'e27-signups-1', day, about: 'Confirmed email watchers (double opt-in) per project page, read through the existing counters function. A project is listed only from 3 watchers (privacy threshold); below that the count is not available to us either. Coverage grows by ' + CHUNK + ' projects each time this is read, and restarts every day (UTC).',
    confirmed_watchers_total: total, total_source: 'kolaboro_metrics_public (totals.followers)', threshold: 3, projects_checked_today: checked, projects_total: ids.length, projects: rows }), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300', 'access-control-allow-origin': '*' } });
}

// ------------------------------------------------------------------------------------------------ official notices (item 79)
// State for the push alert job: {n, last: {d, t, s, src}} per project id. kbx_j.js pushRun adds it to each watched project's state and
// reports a change when the count grows ("Official notice about the developer company: ..."). The state is the job's own JSON blob.
export async function noticeStates(env, ids) {
  const ix = await N.data(env), X = await extra(env), out = {};
  for (const id of ids) { const x = ix.byId.get(id); if (!x) continue; const L = noticesOf(ix, X, x); out[id] = { n: L.length, last: L[0] ? { d: L[0].d, t: L[0].t, s: L[0].s, src: L[0].src } : null }; }
  return out;
}

// ------------------------------------------------------------------------------------------------ routes
export async function handle(req, u, env, ctx, shell) {
  const p = u.pathname;
  if (!PATHS.test(p)) return null;
  if (p === '/weekly/sitemap.xml') return sitemap(env);
  let m = p.match(/^\/weekly\/([a-z0-9-]{2,40})\/feed\.(atom|json)$/); if (m) return placeFeed(req, env, m[1], m[2]);
  m = p.match(/^\/api\/x\/e27\/(mail\/(review|delays)|signups|notices\/([A-Za-z0-9-]{3,20}))\/?$/);
  if (m) {
    if (m[2]) return mailPreview(u, env, m[2]);
    if (m[1] === 'signups') return signups(env, ctx);
    const ix = await N.data(env), x = ix.byId.get(m[3].toUpperCase()); if (!x || !okName(x)) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { 'content-type': 'application/json' } });
    const X = await extra(env);
    return new Response(JSON.stringify({ id: x.id, developer: x.dv || null, kinds: ['insolvency', 'dissolution'], about: 'Official gazette notices of insolvency or dissolution about the developer company (exact legal name), and insolvency notices found by the insolvency watch. A notice is a legal publication, not a finding about the project.', notices: noticesOf(ix, X, x) }), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=3600', 'access-control-allow-origin': '*' } });
  }
  const lm = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(?:projects\/([a-z0-9-]{1,90})\/report(\/|\.pdf)?|weekly(?:\/([a-z0-9-]{2,40}))?(\/?))$/);
  if (!lm) return null;
  const lang = lm[1] || 'en';
  if (lm[2]) {
    const ix = await N.data(env), x = ix.bySlug.get(lm[2]); if (!x || !okName(x)) return null;
    if (!lm[3]) return new Response(null, { status: 301, headers: { location: p + '/' } });
    if (lm[3] === '.pdf') {
      const bytes = await reportPdf(env, lang, x);
      return new Response(req.method === 'HEAD' ? null : bytes, { headers: { 'content-type': 'application/pdf', 'content-disposition': 'inline; filename="kolaboro-' + x.s + '.pdf"', 'cache-control': 'public, max-age=3600', 'x-robots-tag': 'noindex' } });
    }
    return reportPage(req, u, env, ctx, shell, lang, x);
  }
  if (!lm[5]) return new Response(null, { status: 301, headers: { location: p + '/' } });
  if (lm[4]) return placePage(req, u, env, ctx, shell, lang, lm[4]);
  return hubPage(req, u, env, ctx, shell, lang);
}
export { weekly, evs, reportPdf };   // for the local test
