// kolaboro.com n33a (batch 33, 20 Nov 2026): structured data, AI and freshness
//   GET /[<lang>/]delays/   item 85: "Off-plan delays, week N": handover dates moved later this week, projects past the handover
//                           date on record, dates on record ending this month, and an archive of the earlier weeks on the same page.
//                           Same address every week. Counted from the dated promise history (ix.prom[].hist), no new data.
// Also exports byline(lang) (item 89: who made a report and how) and FEED_HUB (item 86), used by index.js kbHeaders.
// Strings: /_s/kolaboro.com/data/i18n/kbx_n33a.json, filled into TB.kbx_n33a_S by kbx_strings.js before every request.
import { TB } from './kbx_strings.js';

const ORIGIN = 'https://kolaboro.com';
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?delays\/?$/;
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const S = () => TB.kbx_n33a_S || {};
const t = (l, k, v) => { const T = S(); let s = (T[l] && T[l][k] != null) ? T[l][k] : (T.en || {})[k]; if (v && typeof s === 'string') for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b); return s == null ? '' : s; };
const nf = (n, l) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB').format(n); } catch (e) { return String(n); } };
const COI = /eco\s*beach|equinox|sumba/i;
const DAY = 864e5;
const monday = iso => { const d = new Date(iso + 'T00:00:00Z'); return new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY).toISOString().slice(0, 10); };
const addD = (iso, n) => new Date(new Date(iso + 'T00:00:00Z').getTime() + n * DAY).toISOString().slice(0, 10);
function isoWeek(iso) { const d = new Date(iso + 'T00:00:00Z'), th = new Date(d.getTime() + (3 - (d.getUTCDay() + 6) % 7) * DAY), y = th.getUTCFullYear(), j4 = new Date(Date.UTC(y, 0, 4)); return { y, n: 1 + Math.round(((th - j4) / DAY - 3 + (j4.getUTCDay() + 6) % 7) / 7) }; }
const WL = { en: 'week {w}, {y}', es: 'semana {w} de {y}', de: 'KW {w}/{y}', fr: 'semaine {w}, {y}', nl: 'week {w}, {y}', ru: '{w}-я неделя {y}', zh: '{y}年第{w}周', ar: 'الأسبوع {w}، {y}' };
const wkLabel = (l, w) => { const k = isoWeek(w); return (WL[l] || WL.en).replace('{w}', k.n).replace('{y}', k.y); };
// a handover period as months since year 0: [first month, last month]; "2027" = Jan..Dec, "2027-Q3" = Jul..Sep, "2027-H2" = Jul..Dec
function span(d) {
  const s = String(d || '').trim(); let m;
  if ((m = /^(20\d\d)-(\d\d)(?:-\d\d)?$/.exec(s))) { const v = +m[1] * 12 + +m[2]; return [v, v]; }
  if ((m = /^(20\d\d)-Q([1-4])$/i.exec(s))) return [+m[1] * 12 + 3 * m[2] - 2, +m[1] * 12 + 3 * m[2]];
  if ((m = /^(20\d\d)-H([12])$/i.exec(s))) return [+m[1] * 12 + 6 * m[2] - 5, +m[1] * 12 + 6 * m[2]];
  if ((m = /^(20\d\d)$/.exec(s))) return [+m[1] * 12 + 1, +m[1] * 12 + 12];
  return null;
}
// moves of the handover date: later when the new period starts after the old one ends, earlier when it ends before the old one starts
let MV = null;
function moves(ix) {
  if (MV && MV.ix === ix) return MV.L;
  const L = [];
  for (const x of ix.P) {
    if (COI.test(String(x.n) + ' ' + String(x.dv) + ' ' + String(x.mk) + ' ' + String(x.co))) continue;
    for (const q of ix.prom[x.id] || []) {
      if (q.k !== 'handover') continue;
      const H = (q.hist || []).filter(h => h && h.d && h.seen).slice().sort((a, b) => String(a.seen).localeCompare(String(b.seen)));
      // one entry per project and day: the date before that day against the last date seen that day (a same-day back and forth is no move)
      const byDay = new Map(); H.forEach((h, i) => { const day = String(h.seen).slice(0, 10); if (!byDay.has(day)) byDay.set(day, { a: i ? H[i - 1].d : null, b: h.d }); else byDay.get(day).b = h.d; });
      for (const [day, v] of byDay) {
        const A = span(v.a), B = span(v.b); if (!A || !B) continue;
        const dir = B[0] > A[1] ? 1 : B[1] < A[0] ? -1 : 0; if (dir) L.push({ x, d: day, a: v.a, b: v.b, dir, m: B[1] - A[1] });
      }
    }
  }
  L.sort((p, q) => q.d.localeCompare(p.d) || q.m - p.m);
  MV = { ix, L }; return L;
}
/* CSS: n40 k17, in /data/i18n/k17s.json */

function mvList(l, L, N, cap) {
  if (!L.length) return '<p>' + esc(t(l, 'dl_mv_none')) + '</p>';
  const a = x => N.okHttp(x.url) ? ' <a class="k-xs" href="' + esc(N.fixU(x.url)) + '" rel="nofollow noopener" target="_blank">' + esc(t(l, 'src')) + '</a>' : '';
  return '<ul class="n33-l">' + L.slice(0, cap).map(e => '<li><a href="' + pre(l) + '/projects/' + e.x.s + '/">' + (l === 'ar' ? '<bdi>' + esc(e.x.n) + '</bdi>' : esc(e.x.n)) + '</a> <small>' + esc(e.x.mk) + '</small>: ' + esc(t(l, 'dl_mv_li', { a: N.fd(e.a, l), b: N.fd(e.b, l), d: N.fd(e.d, l) })) + a(e.x) + '</li>').join('') +
    (L.length > cap ? '<li>' + esc(t(l, 'dl_more', { k: nf(L.length - cap, l) })) + '</li>' : '') + '</ul>';
}

async function delaysPage(env, shell, l) {
  const N = await import('./kbx_named.js'), ix = await N.data(env);
  const today = new Date().toISOString().slice(0, 10), w0 = monday(today), M = moves(ix);
  const inW = (e, w) => e.d >= w && e.d < addD(w, 7);
  const now = M.filter(e => inW(e, w0)), later = now.filter(e => e.dir > 0), earlier = now.filter(e => e.dir < 0);
  // past the date on record (same rule as project pages and /handover/overdue/), by place
  const OV = [], byMk = new Map();
  for (const x of ix.P) { if (COI.test(String(x.n) + ' ' + String(x.dv) + ' ' + String(x.mk) + ' ' + String(x.co))) continue; const o = N.overdueOf ? N.overdueOf(ix, x) : null; if (!o) continue; OV.push([x, o]); const b = byMk.get(x.mk) || { k: 0, mx: 0 }; b.k++; b.mx = Math.max(b.mx, o.m); byMk.set(x.mk, b); }
  const rows = [...byMk.entries()].sort((a, b) => b[1].k - a[1].k || a[0].localeCompare(b[0])).slice(0, 12);
  // dates on record that end this month, not completed
  const ym = today.slice(0, 7), cur = span(ym)[0], due = [];
  for (const x of ix.P) { if (COI.test(String(x.n) + ' ' + String(x.dv) + ' ' + String(x.mk) + ' ' + String(x.co))) continue; const h = N.handoverOf(ix, x), c = ix.caseBy.get(x.id) || {}; if (!h || (c.stage || x.st) === 'completed' || (h.p && h.p.st === 'kept')) continue; const s = span(h.d); if (s && s[1] === cur) due.push(x); }
  due.sort((a, b) => a.n.localeCompare(b.n));
  const first = M.length ? monday(M[M.length - 1].d) : w0, weeks = []; for (let w = addD(w0, -7); w >= first && weeks.length < 12; w = addD(w, -7)) weeks.push(w);
  const W = wkLabel(l, w0);
  let b = '<h2 id="this-week">' + esc(t(l, 'dl_now')) + ': ' + esc(t(l, 'dl_week', { n: isoWeek(w0).n, y: isoWeek(w0).y, a: N.fd(w0, l), b: N.fd(today, l) })) + '</h2>' +
    '<h3>' + esc(t(l, 'dl_mv_h')) + ' (' + nf(later.length, l) + ')</h3>' + mvList(l, later, N, 60) + (earlier.length ? '<p class="k-xs">' + esc(t(l, 'dl_er', { k: nf(earlier.length, l) })) + '</p>' : '');
  b += '<h2 id="past-date">' + esc(t(l, 'dl_ov_h')) + '</h2><p>' + esc(t(l, 'dl_ov_p', { k: nf(OV.length, l), d: N.fd(today, l) })) + '</p><div class="n33-tw"><table><thead><tr>' + t(l, 'dl_th').map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' +
    rows.map(([mk, v]) => '<tr><td>' + esc(mk) + '</td><td class="n">' + nf(v.k, l) + '</td><td class="n">' + nf(v.mx, l) + '</td></tr>').join('') + '</tbody></table></div>';
  if (due.length) b += '<h2 id="due">' + esc(t(l, 'dl_due_h')) + '</h2><p>' + esc(t(l, 'dl_due_p', { k: nf(due.length, l), m: N.fd(ym, l) })) + '</p><ul class="n33-l" style="columns:2 260px">' + due.slice(0, 40).map(x => '<li><a href="' + pre(l) + '/projects/' + x.s + '/">' + esc(x.n) + '</a> <small>' + esc(x.mk) + '</small></li>').join('') + (due.length > 40 ? '<li>' + esc(t(l, 'dl_more', { k: nf(due.length - 40, l) })) + '</li>' : '') + '</ul>';
  b += '<h2 id="archive">' + esc(t(l, 'dl_arch_h')) + '</h2>';
  for (const w of weeks) { const L = M.filter(e => e.dir > 0 && inW(e, w)), k = isoWeek(w); b += '<h3 id="w-' + k.y + '-' + String(k.n).padStart(2, '0') + '">' + esc(t(l, 'dl_week', { n: k.n, y: k.y, a: N.fd(w, l), b: N.fd(addD(w, 6), l) })) + '</h3><p class="k-xs">' + esc(t(l, 'dl_arch_sum', { k: nf(L.length, l) })) + '</p>' + (L.length ? mvList(l, L, N, 25) : ''); }
  b += '<h2 id="method">' + esc(t(l, 'dl_how_h')) + '</h2><ul class="n33-l">' + t(l, 'dl_how').map(p => '<li>' + esc(p) + '</li>').join('') + '</ul><p class="k-xs">' + esc(t(l, 'dl_data')) + '</p>';
  const R = t(l, 'dl_rel'), rl = [['/rankings/most-delayed/', 0, false], ['/handover/overdue/', 1, true], ['/weekly/', 2, true], ['/methods/handover-slippage/', 3, true]];
  b += '<ul class="n33-l">' + rl.map(([p, i, tr]) => '<li><a href="' + (tr ? pre(l) : '') + p + '">' + esc(R[i]) + '</a></li>').join('') + '</ul>' + byline(l);
  const h1 = t(l, 'dl_h1', { w: W }), canon = ORIGIN + pre(l) + '/delays/', lead = t(l, 'dl_lead');
  let desc = t(l, 'dl_desc', { m: nf(later.length, l), w: W, k: nf(OV.length, l) }); if ([...desc].length > 160) desc = [...desc].slice(0, 157).join('').replace(/\s+\S*$/, '') + '...';
  let title = h1; if ([...title].length + 11 <= 60) title += ' | Kolaboro';
  const crumbs = [['Kolaboro', ORIGIN + pre(l) + '/'], [t(l, 'dl_t'), canon]];
  const body = '<section class="phero"' + (l === 'ar' ? ' dir="rtl"' : '') + '><div class="wrap"><p class="crumb"><a href="' + pre(l) + '/">Kolaboro</a></p><h1>' + esc(h1) + '</h1><p class="lead">' + esc(lead) + '</p><p class="k-xs"><time datetime="' + today + '">' + esc(N.fd(today, l)) + '</time></p></div></section><div class="wrap n33"' + (l === 'ar' ? ' dir="rtl"' : '') + '>' + TB.kbx_n33a__s.CSS + b + '</div>';
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': canon + '#page', url: canon, name: h1, description: desc, inLanguage: l, dateModified: today, isPartOf: { '@id': ORIGIN + '/#website' }, publisher: { '@id': ORIGIN + '/#org' }, author: { '@id': ORIGIN + '/#org' }, publishingPrinciples: ORIGIN + '/editorial-policy/', breadcrumb: { '@id': canon + '#bc' }, mainEntity: { '@id': canon + '#data' } },
    { '@type': 'Dataset', '@id': canon + '#data', name: h1, description: lead, url: canon, license: 'https://creativecommons.org/licenses/by/4.0/', isAccessibleForFree: true, creator: { '@id': ORIGIN + '/#org' }, dateModified: today, temporalCoverage: first + '/' + today, distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/data/promises.json' }] },
    { '@type': 'Organization', '@id': ORIGIN + '/#org', name: 'Kolaboro', url: ORIGIN + '/' },
    { '@type': 'BreadcrumbList', '@id': canon + '#bc', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] })) }] };
  const html = await N.assemble({ title, desc, canon, body, ld, alt: x => ORIGIN + pre(x) + '/delays/' }, l, await shell(pre(l) + '/how-we-score/'));
  return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=900', 'content-language': l } });
}

// item 89: one visible line on every report: who made it, from what, the method and where to send a correction (8 languages)
const BY_METHOD = [[/^\/(?:press\/delivery-index|delays|weekly|handover|rankings\/most-delayed)(?:\/|$)/, '/methods/handover-slippage/'], [/^\/rankings\/transparency(?:\/|$)/, '/methods/transparency-score/'], [/./, '/how-we-work/']];
export function byline(l, path) {
  if (!S().en) return '';
  const p = String(path || '/delays/').replace(/^\/(?:es|de|fr|nl|ru|zh|ar)(?=\/)/, ''), m = BY_METHOD.find(r => r[0].test(p))[1];
  const a = (h, k) => '<a href="' + pre(l) + h + '">' + esc(t(l, k)) + '</a>';
  return '<p class="k-xs n33-by" style="margin:22px 0 8px">' + esc(t(l, 'by')).replace('{team}', a('/team/', 'by_team')).replace('{data}', '<a href="/data/">' + esc(t(l, 'by_data')) + '</a>').replace('{method}', a(m, 'by_method')).replace('{corr}', a('/corrections/', 'by_corr')) + '</p>';
}
// report pages that get the line (the page body is appended to <main> by index.js kbHeaders)
export const REPORTS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:reports(?:\/[a-z0-9-]{2,40})?|press\/delivery-index(?:\/\d{4}-\d{2})?|weekly(?:\/[a-z0-9-]{2,40})?|projects\/[a-z0-9-]{1,90}\/report|numbers|rankings\/(?:most-delayed|changed-promises)|handover\/overdue(?:\/[a-z0-9-]{2,40})?|stories\/[a-z0-9-]{2,90})\/$/;
// item 86: hubs that get a JSON Feed and an Atom feed of the data changes in <head> when the page carries none of its own
export const FEED_HUB = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:(?:projects|developers|developers\/benchmark|countries(?:\/[a-z0-9-]{2,60})?|m(?:\/[^/.]{2,60})?|rankings(?:\/[a-z0-9-]{2,40}){0,2}|handover(?:\/[a-z0-9-]{2,40}){0,2}|new|weekly(?:\/[a-z0-9-]{2,40})?|delays|reports(?:\/[a-z0-9-]{2,40})?|vs|tools|guides(?:\/[a-z0-9-]{2,40}){0,2}|data|changes|promises|map|registers|glossary|numbers|press\/delivery-index|compare|cases|courts|regulators|satellite|anomalies|destinations|research)\/)?$/;
export function feedLinks(path, hasJson, hasAtom) {
  const lang = (/^\/(es|de|fr|nl|ru|zh|ar)\//.exec(path) || [0, 'en'])[1], p = path.replace(/^\/(?:es|de|fr|nl|ru|zh|ar)(?=\/)/, '');
  const wk = /^\/weekly\/([a-z0-9-]{2,40})\/$/.exec(p), T = t(lang, 'fd_data') || 'Kolaboro: changes in the data';
  const J = wk ? '/weekly/' + wk[1] + '/feed.json' : '/api/v1/changes/feed.json', A = wk ? '/weekly/' + wk[1] + '/feed.atom' : '/changes/feed.atom';
  return (hasJson ? '' : '<link rel="alternate" type="application/feed+json" title="' + esc(T) + ' (JSON Feed)" href="' + J + '">') + (hasAtom ? '' : '<link rel="alternate" type="application/atom+xml" title="' + esc(T) + ' (Atom)" href="' + A + '">');
}

// item 79: /data/ (static page) gets one Dataset node for the versioned open dataset (the /data/sql/ files), read from its data card
// once per isolate, so version, build date and file list follow each rebuild without editing the page
let CARD = null, CARD_AT = 0;
export async function prep(env, u) {
  if (u.pathname !== '/data/' || (CARD && Date.now() - CARD_AT < 6e5)) return;
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/sql/datacard.json')); if (r.ok) { CARD = await r.json(); CARD_AT = Date.now(); } } catch (e) {}
}
export function dataLd(path) {
  if (path !== '/data/' || !CARD || !CARD.version) return '';
  const F = (CARD.files || []).flatMap(f => [['parquet', 'application/vnd.apache.parquet'], ['csv', 'text/csv']].filter(([k]) => f[k] && f[k].path).map(([k, ty]) => ({ '@type': 'DataDownload', name: f.table + '.' + k, encodingFormat: ty, contentUrl: ORIGIN + f[k].path, contentSize: String(f[k].bytes) })));
  const d = { '@context': 'https://schema.org', '@type': 'Dataset', '@id': ORIGIN + '/data/#open-dataset', name: CARD.name || 'Kolaboro open dataset', description: String(CARD.what_it_is || '').slice(0, 4900), url: ORIGIN + '/data/sql/', version: String(CARD.version),
    dateModified: CARD.built, license: 'https://creativecommons.org/licenses/by/4.0/', isAccessibleForFree: true, creator: { '@id': ORIGIN + '/#org' }, publisher: { '@id': ORIGIN + '/#org' }, includedInDataCatalog: { '@id': ORIGIN + '/data/' },
    isBasedOn: ORIGIN + ((CARD.source || {}).file || '/data/named.json'), distribution: F.concat([{ '@type': 'DataDownload', name: 'datacard.json', encodingFormat: 'application/json', contentUrl: ORIGIN + '/data/sql/datacard.json' }]),
    keywords: ['off-plan', 'property', 'developers', 'handover dates', 'permits', 'open data'] };
  return '<script type="application/ld+json">' + JSON.stringify(d).replace(/</g, '\\u003c') + '</script>';
}

// item 87: /m/ built its whole list in the browser ("Loading the latest data" without JavaScript). The same list (markets by country,
// counts from /data/bali-cases.json) is now in the HTML; /m/m.js still redraws it after load. Sumba is left out (transparency ranking only).
let CS = null, CS_AT = 0;
const slugM = m => encodeURIComponent(String(m).toLowerCase().replace(/\s+/g, '-'));
export async function mIndex(env, r) {
  try {
    if (!CS || Date.now() - CS_AT > 6e5) { const q = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/bali-cases.json')); if (q.ok) { CS = (await q.json()).cases || []; CS_AT = Date.now(); } }
    if (!CS || !CS.length) return r;
    const G = {}; let n = 0;
    for (const c of CS) { if (!c.market || !c.country || COI.test(c.market + ' ' + (c.name || ''))) continue; n++; const g = G[c.country] = G[c.country] || {}; g[c.market] = (g[c.market] || 0) + 1; }
    const cs = Object.keys(G).sort(), nm = cs.reduce((a, c) => a + Object.keys(G[c]).length, 0);
    const root = TB.kbx_n33a__s.k0 + nf(n, 'en') + ' projects in ' + nm + ' markets and ' + cs.length + ' countries. Pick a market for its disclosure numbers, transparency index and project list.</p>';
    const body = '<section class="mk-sec"><div class="wrap"><h2>Markets by country</h2><div class="mk-grp">' + cs.map(c => { const ms = Object.keys(G[c]).sort(), tot = ms.reduce((s, m) => s + G[c][m], 0);
      return '<section><h3>' + esc(c) + ' <small style="color:var(--muted);font-weight:600">' + tot + '</small></h3><ul class="mk-mk">' + ms.map(m => '<li><a href="/m/' + slugM(m) + '/">' + esc(m) + ' <small>' + G[c][m] + '</small></a></li>').join('') + '</ul></section>'; }).join('') + '</div></div></section>';
    return new HTMLRewriter().on('#mk-root', { element(e) { e.setInnerContent(root, { html: true }); } }).on('#mk-body', { element(e) { e.setInnerContent(body, { html: true }); } }).transform(r);
  } catch (e) { return r; }
}

export async function handle(req, u, env, ctx, shell) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  const m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?delays(\/?)$/.exec(u.pathname); if (!m) return null;
  if (!m[2]) return new Response(null, { status: 301, headers: { location: (m[1] ? '/' + m[1] : '') + '/delays/' } });
  if (!S().en) return null;
  return delaysPage(env, shell, m[1] || 'en');
}
export { moves, span };   // for the local test
