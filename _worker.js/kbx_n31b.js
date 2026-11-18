// kolaboro.com batch 31 (agent n31b, 18 Nov 2026): trust pages. No model calls, nothing stored, nothing estimated: every figure is
// read from a published data file when the page is built, or is a dated fact with its source.
// Routes (8 languages, prefix /es /de /fr /nl /ru /zh /ar; page frame of kbx_trust.js):
//   /case-studies/                     item 14: documented cases (one so far), rule for publishing one
//   /case-studies/aykon-city-3/        item 14: Aykon City 3, Dubai: DLD register record, every inspection, the arithmetic, reply box
//   /conflicts-of-interest/            item 70: who operates Kolaboro, who pays, the founder's project, rules, how to report a conflict
//   /what-we-cannot-know/              item 92: limits of a desk review and how a buyer finds each thing out
//   /data-removal/                     item 87: removal of personal data (private individuals are never published)
//   /report-fraud/                     item 89: who to tell first, how to send a tip through the existing address, what we do with it
//   /transparency-report/2026/         item 93: our own figures, corrections, money, what does not work yet (/transparency-report/ 301s)
//   /registers/captures/               item 66: register records kept as files with SHA-256 (/data/register-captures.json)
//   /score-history/[?d=<developer>]    item 81: developer transparency score by day (/data/score-history.json + today, live)
//   /k/n31b.js                         item 88: "report an error in this line" buttons on project pages (kbx_n31b_page.js)
//   /data/cases/aykon-city-3.json      the facts of case 1, machine-readable
import { t31, n31js, loadS } from './kbx_n31b_page.js';
import { trustRender, head, crumbLd, progData } from './kbx_trust.js';
import { trData } from './kbx_tr.js';
import { METHOD } from './kbx_e29_lines.js';

const ORIGIN = 'https://kolaboro.com';
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(case-studies(?:\/aykon-city-3)?|conflicts-of-interest|what-we-cannot-know|data-removal|report-fraud|transparency-report(?:\/2026)?|registers\/captures|score-history)(\/?)$|^\/k\/n31b\.js$|^\/data\/cases\/aykon-city-3\.json$/;
export const PAGES = ['/case-studies/', '/case-studies/aykon-city-3/', '/conflicts-of-interest/', '/what-we-cannot-know/', '/data-removal/', '/report-fraud/', '/transparency-report/2026/', '/registers/captures/', '/score-history/'];
export const REVIEWED = '2026-11-18';
const MAIL = 'hello@kolaboro.com';
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bdi = s => '<bdi>' + esc(s) + '</bdi>';
const t = (lang, k, v) => t31(lang, k, v);
const tv = (lang, k, v) => esc(t31(lang, k)).replace(/\{(\w+)\}/g, (m, a) => v && v[a] != null ? v[a] : m);   // template escaped, values already HTML
const nf = (lang, n, d) => Number(n).toLocaleString(LOC[lang] || 'en-GB', { maximumFractionDigits: d == null ? 0 : d, minimumFractionDigits: d || 0 });
const fdt = (iso, lang) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); if (!m) return String(iso || ''); try { return new Intl.DateTimeFormat(LOC[lang] || 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))); } catch (e) { return iso.slice(0, 10); } };
const tm = (iso, lang) => '<time datetime="' + esc(String(iso).slice(0, 10)) + '">' + esc(fdt(iso, lang)) + '</time>';
const mailA = (subj) => '<a href="mailto:' + MAIL + (subj ? '?subject=' + encodeURIComponent(subj) : '') + '"><bdi>' + MAIL + '</bdi></a>';
const ext = (u, label) => '<a class="k-src" href="' + esc(u) + '" rel="noopener nofollow" target="_blank"><bdi>' + esc(label || u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')) + '</bdi></a>';
const ul = L => '<ul>' + L.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
const reviewed = lang => '<p class="k-small k-muted">' + tv(lang, 'upd', { d: tm(REVIEWED, lang) }) + '</p>';
const links = (lang, L) => '<h2>' + esc(t(lang, 'rel')) + '</h2><ul class="k31-rel">' + L.map(([h, k]) => '<li><a href="' + (h.startsWith('/') && !/^\/(independence|registers|metrics|buyer-reports|developers\/reply)\b/.test(h) ? pre(lang) + h : h) + '">' + esc(t(lang, k)) + '</a></li>').join('') + '</ul>';
const CSS = '<style id="k31p-css">.k31-tw{overflow-x:auto;border:1px solid var(--k-line);border-radius:var(--k-r-md,10px);background:var(--k-surface);margin:var(--k-4,16px) 0}.k31-tw table{width:100%;border-collapse:collapse}.k31-tw th,.k31-tw td{padding:10px 12px;text-align:start;vertical-align:top;border-bottom:1px solid var(--k-line)}.k31-tw th{font-size:var(--k-fs-xs,13px);font-weight:600}.k31-tw .k-n{text-align:end;font-variant-numeric:tabular-nums;white-space:nowrap}' +
  '.k31-rel{padding-inline-start:18px}.k31-rel a,.k31-btn{display:inline-block;padding:12px 0;min-height:44px;box-sizing:border-box}.k31-h{font-family:ui-monospace,monospace;font-size:12px;overflow-wrap:anywhere}.k31-box{border:1px solid var(--k-line);border-radius:var(--k-r-md,10px);padding:var(--k-3,12px) var(--k-4,16px);margin:var(--k-4,16px) 0;background:var(--k-sunken)}' +
  '@media (max-width:640px){.k31-tw table.k31-st thead{display:none}.k31-tw table.k31-st tr{display:block;border-bottom:1px solid var(--k-line);padding:8px 0}.k31-tw table.k31-st td,.k31-tw table.k31-st th{display:block;border:0;padding:4px 12px;text-align:start}}</style>';

// ------------------------------------------------------------------------------------------------ data
const SHARED = (globalThis.__kbJson = globalThis.__kbJson || {});
async function load(env, name) {   // same shared parse cache as kbx_tr.js / kbx_trust.js / kbx_t27.js
  const m = SHARED[name]; if (m && (m.a || Date.now() - m.t < 600000)) return m.v;
  let r = null, a = false;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); a = !!(r && r.ok); } catch (e) { r = null; }
  if (!r || !r.ok) r = await fetch(ORIGIN + '/data/' + name, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!r.ok) throw new Error(name + ' ' + r.status);
  const v = await r.json(); SHARED[name] = { t: Date.now(), v, a }; return v;
}
const opt = (env, n) => load(env, n).catch(() => null);

// ------------------------------------------------------------------------------------------------ case 1 (item 14)
// Every fact below was read on the date given, at the address given. The register figures are the DLD project register as
// republished by dubairealestateiq.com (the DLD's own enquiry service shows a captcha, see /data/register-checks.json).
const C1 = {
  slug: 'aykon-city-3', id: 'DXB-021', ps: 'damac-aykon-city-3', name: 'Aykon City 3', devs: 'damac-properties', dev: 'DAMAC Properties',
  no: '2200', registered: '2019-12-19', start: '2019-12-10', company: 'Damac Canal One Property Development L.L.C', dldDev: '1119', units: 1300, bank: 'Emirates NBD Bank',
  first: { d: '2022-09-20', record: '2026-11-01' }, now: { read: '2026-11-18', status: 'Active', completion: '2027-12-30', pct: 38.27, inspected: '2026-11-03' }, agency: 'Q4 2027',
  inspections: [['2026-11-03', 38.27], ['2026-04-12', 31.35], ['2025-12-25', 26.35], ['2025-07-28', 23.36], ['2025-03-19', 18.09], ['2024-10-14', 9.7], ['2023-12-14', 6.56], ['2023-09-05', 3.08], ['2023-05-16', 2.7], ['2022-12-30', 1.29], ['2022-09-02', 1.02]],
  sources: [
    ['https://dubairealestateiq.com/project/aykon-city-3', 'DLD project register as republished by dubairealestateiq.com (project 2200, inspections, escrow bank, completion date)', '2026-11-18'],
    ['https://www.binayah.com/dubai-construction-updates/aykon-city-3/', 'binayah.com construction update page ("Target handover Q3 2022", 3.08%)', '2026-11-18'],
    ['https://a1properties.ae/project-details/aykon-city-3-business-bay-dubai', 'A1 Properties agency page (handover Q4 2027, permit 1982041975)', '2026-11-18'],
    ['https://www.tradearabia.com/News/464932/Damac-announces-handover-of-8%2c800-residential-units-across-Dubai/CONS', 'TradeArabia, 9 Jul 2026 (50,000 units delivered since 2002; 8,800 units handed over)', '2026-11-18'],
    ['https://dubailand.gov.ae/en/eservices/real-estate-project-status-landing/', 'DLD Project Status Enquiry (captcha; probed by our checker on 13 Nov 2026)', '2026-11-13'],
    ['https://kolaboro.com/data/construction-progress.json', 'Kolaboro Sentinel-2 construction series', null]]
};
const mon = (a, b) => { const x = Date.parse(a + 'T00:00:00Z'), y = Date.parse(b + 'T00:00:00Z'); return (y - x) / (864e5 * 30.4375); };
const ym = d => { const m = /^(\d{4})-(\d{2})/.exec(d); return m ? +m[1] * 12 + +m[2] : 0; };
function c1Math() {
  const I = C1.inspections, a = I[I.length - 1], b = I[0], c = I[1];
  const mo = Math.round(mon(a[0], b[0])), pts = +(b[1] - a[1]).toFixed(2), mo2 = Math.round(mon(c[0], b[0])), pts2 = +(b[1] - c[1]).toFixed(2);
  const left = mon(b[0], C1.now.completion), rem = +(100 - b[1]).toFixed(2);
  return { a, b, c, mo, pts, avg: pts / mon(a[0], b[0]), mo2, pts2, rem, need: rem / left, moved: ym(C1.now.completion) - ym(C1.first.d) };
}
function casePage(lang, cs) {
  const M = c1Math(), P = pre(lang) + '/projects/' + C1.ps + '/';
  const cr = [[t(lang, 'cs_h1'), pre(lang) + '/case-studies/'], [C1.name, pre(lang) + '/case-studies/' + C1.slug + '/']];
  const en = s => '<span lang="en" dir="ltr">' + esc(s) + '</span>';
  const rows = C1.inspections.map((r, i) => { const prev = C1.inspections[i + 1]; return '<tr><td>' + tm(r[0], lang) + '</td><td class="k-n">' + nf(lang, r[1], 2) + ' %</td><td class="k-n">' + (prev ? '+' + nf(lang, r[1] - prev[1], 2) : '') + '</td></tr>'; }).join('');
  const th = t(lang, 'c1_th');
  const sat = cs && cs.sat && cs.sat.status === 'visible change' ? '<h2 id="space">' + esc(t(lang, 'c1_space_h')) + '</h2><p>' + tv(lang, 'c1_space', { x: nf(lang, cs.sat.changed_pct, 1), d: tm(cs.sat.date, lang) }) + ' <a class="k-src" href="' + P + '#space">kolaboro.com</a></p>' : '';
  const src = '<h2 id="sources">' + esc(t(lang, 'src_h')) + '</h2><ol>' + C1.sources.map(([u, l, d]) => '<li>' + ext(u, u.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]) + ' <span lang="en" dir="ltr">' + esc(l) + '</span>' + (d ? ' <span class="k-muted">(' + tv(lang, 'read', { d: tm(d, lang) }) + ')</span>' : '') + '</li>').join('') + '</ol>';
  const body = '<div class="kpg">' + head(lang, cr, esc(t(lang, 'c1_h1')), esc(t(lang, 'c1_lead')), reviewed(lang)) + '<div class="k-prose">' +
    '<h2 id="project">' + esc(t(lang, 'c1_what_h')) + '</h2><p>' + tv(lang, 'c1_what', { no: bdi(C1.no), reg: tm(C1.registered, lang), st: tm(C1.start, lang), co: en(C1.company), dn: bdi(C1.dldDev), u: nf(lang, C1.units), bank: en(C1.bank) }) + ' ' + ext(C1.sources[0][0], 'dubairealestateiq.com') + '</p>' +
    '<h2 id="first">' + esc(t(lang, 'c1_then_h')) + '</h2><p>' + tv(lang, 'c1_then', { r: tm(C1.first.record, lang), a: tm(C1.first.d, lang), d: tm(C1.now.read, lang) }) + ' ' + ext(C1.sources[1][0], 'binayah.com') + '</p>' +
    '<h2 id="now">' + esc(t(lang, 'c1_now_h')) + '</h2><p>' + tv(lang, 'c1_now', { d: tm(C1.now.read, lang), sta: en(C1.now.status), c: tm(C1.now.completion, lang), pct: nf(lang, C1.now.pct, 2), i: tm(C1.now.inspected, lang), m: nf(lang, M.moved), q: en(C1.agency) }) + ' ' + ext(C1.sources[0][0], 'dubairealestateiq.com') + ' ' + ext(C1.sources[2][0], 'a1properties.ae') + '</p>' +
    '<p class="k-small k-muted">' + esc(t(lang, 'c1_dld')) + ' ' + ext(C1.sources[4][0], 'dubailand.gov.ae') + '</p>' +
    '<h2 id="inspections">' + esc(t(lang, 'c1_insp_h')) + '</h2><div class="k31-tw"><table><thead><tr><th scope="col">' + esc(th[0]) + '</th><th scope="col" class="k-n">' + esc(th[1]) + '</th><th scope="col" class="k-n">' + esc(th[2]) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<h2 id="arithmetic">' + esc(t(lang, 'c1_math_h')) + '</h2><p>' + tv(lang, 'c1_math', { a: tm(M.a[0], lang), b: tm(M.b[0], lang), c: tm(M.c[0], lang), mo: nf(lang, M.mo), pts: nf(lang, M.pts, 2), avg: nf(lang, M.avg, 2), mo2: nf(lang, M.mo2), pts2: nf(lang, M.pts2, 2), due: tm(C1.now.completion, lang), rem: nf(lang, M.rem, 2), need: nf(lang, M.need, 1) }) + '</p>' +
    sat + '<h2 id="developer">' + esc(t(lang, 'c1_dev_h')) + '</h2><p>' + esc(t(lang, 'c1_dev')) + ' ' + ext(C1.sources[3][0], 'tradearabia.com') + ' <a href="' + pre(lang) + '/developers/' + C1.devs + '/">' + bdi(C1.dev) + '</a></p>' +
    '<h2 id="check">' + esc(t(lang, 'c1_buyer_h')) + '</h2>' + ul(t(lang, 'c1_buyer')) +
    '<h2 id="reply">' + esc(t(lang, 'c1_reply_h')) + '</h2><p>' + esc(t(lang, 'c1_reply')) + '</p><p><a class="k-btn k-btn--line" href="/developers/reply/?id=' + C1.id + '">' + esc(t(lang, 'c1_reply_b')) + '</a></p>' +
    '<p><a href="' + P + '">' + esc(t(lang, 'c1_more')) + '</a> · <a href="/data/cases/' + C1.slug + '.json">' + esc(t(lang, 'c1_dl')) + '</a></p>' + src +
    links(lang, [['/case-studies/', 'l_case'], ['/what-we-cannot-know/', 'l_cant'], ['/corrections/', 'l_corr'], ['/conflicts-of-interest/', 'l_coi']]) + '</div></div></section></div>';
  const title = t(lang, 'c1_title'), desc = t(lang, 'c1_desc'), url = ORIGIN + pre(lang) + '/case-studies/' + C1.slug + '/';
  return { path: '/case-studies/' + C1.slug + '/', title, desc, body, ld: [{ '@type': 'Article', '@id': url + '#article', url, headline: title, description: desc, inLanguage: lang, datePublished: REVIEWED, dateModified: C1.now.read, author: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, publisher: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, about: { '@type': 'Place', name: C1.name + ', Business Bay, Dubai' }, isBasedOn: C1.sources.map(s => s[0]) }, crumbLd(lang, cr)] };
}
function caseJson() {
  const M = c1Math();
  return Object.assign({ name: 'Kolaboro case study 1: ' + C1.name, page: ORIGIN + '/case-studies/' + C1.slug + '/', project_page: ORIGIN + '/projects/' + C1.ps + '/', licence: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)', published: REVIEWED, note: 'Facts only, each with its source and the date read. Register figures: DLD project register as republished by dubairealestateiq.com. Arithmetic on the register figures, not a forecast.' }, C1, { months_moved: M.moved, arithmetic: { from: M.a, to: M.b, months: M.mo, points: M.pts, points_per_month: +M.avg.toFixed(3), remaining_points: M.rem, points_per_month_needed: +M.need.toFixed(2) } });
}
function casesHub(lang) {
  const M = c1Math(), cr = [[t(lang, 'cs_h1'), pre(lang) + '/case-studies/']];
  const body = '<div class="kpg">' + head(lang, cr, esc(t(lang, 'cs_h1')), esc(t(lang, 'cs_lead')), reviewed(lang)) + '<div class="k-prose">' +
    '<ol class="k31-rel"><li><a href="' + pre(lang) + '/case-studies/' + C1.slug + '/">' + esc(t(lang, 'cs_one', { n: C1.name, p: 'Dubai', a: fdt(C1.first.d, lang), b: fdt(C1.now.completion, lang) })) + '</a></li></ol>' +
    '<p>' + esc(t(lang, 'cs_rule')) + '</p>' + links(lang, [['/buyer-cases/', 'l_bcase'], ['/what-we-cannot-know/', 'l_cant'], ['/corrections/', 'l_corr']]) + '</div></div></section></div>';
  const title = t(lang, 'cs_title'), desc = t(lang, 'cs_desc'), url = ORIGIN + pre(lang) + '/case-studies/';
  return { path: '/case-studies/', title, desc, body, ld: [{ '@type': 'CollectionPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: REVIEWED, hasPart: [{ '@type': 'Article', url: ORIGIN + pre(lang) + '/case-studies/' + C1.slug + '/', headline: t(lang, 'c1_title') }] }, crumbLd(lang, cr)] };
}

// ------------------------------------------------------------------------------------------------ simple pages
function page(lang, path, kT, kD, kH, kL, inner, rel) {
  const cr = [[t(lang, kH), pre(lang) + path]];
  const body = '<div class="kpg">' + head(lang, cr, esc(t(lang, kH)), esc(t(lang, kL)), reviewed(lang)) + '<div class="k-prose">' + inner + links(lang, rel) + '</div></div></section></div>';
  const title = t(lang, kT), desc = t(lang, kD), url = ORIGIN + pre(lang) + path;
  return { path, title, desc, body, ld: [{ '@type': 'WebPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: REVIEWED, publisher: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' } }, crumbLd(lang, cr)] };
}
function coiPage(lang) {
  const inner = '<h2 id="who">' + esc(t(lang, 'ci_who_h')) + '</h2><p>' + esc(t(lang, 'ci_who')) + ' <a href="' + pre(lang) + '/team/">' + esc(t(lang, 'l_team')) + '</a></p>' +
    '<h2 id="pay">' + esc(t(lang, 'ci_pay_h')) + '</h2>' + ul(t(lang, 'ci_pay')) + '<p><a href="/metrics/">/metrics/</a></p>' +
    '<h2 id="founder">' + esc(t(lang, 'ci_fd_h')) + '</h2><p>' + esc(t(lang, 'ci_fd')) + ' <a href="' + pre(lang) + '/methods/transparency-score/#coi">' + esc(t(lang, 'l_score')) + '</a></p>' +
    '<h2 id="rules">' + esc(t(lang, 'ci_rule_h')) + '</h2>' + ul(t(lang, 'ci_rule')) +
    '<h2 id="report">' + esc(t(lang, 'ci_rep_h')) + '</h2><p>' + tv(lang, 'ci_rep', { m: mailA(t(lang, 'l_coi')) }) + '</p>';
  return page(lang, '/conflicts-of-interest/', 'ci_title', 'ci_desc', 'ci_h1', 'ci_lead', inner, [['/independence/', 'l_ind'], ['/corrections/', 'l_corr'], ['/what-we-cannot-know/', 'l_cant'], ['/transparency-report/2026/', 'l_tr']]);
}
function cantPage(lang) {
  const th = t(lang, 'nk_th'), I = t(lang, 'nk_items');
  const inner = '<div class="k31-tw"><table class="k31-st"><thead><tr>' + th.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + I.map(r => '<tr><th scope="row">' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>').join('') + '</tbody></table></div>' +
    '<p><a href="' + pre(lang) + '/tools/contract-reader/">' + esc(I[2][0]) + ' ›</a></p>';
  return page(lang, '/what-we-cannot-know/', 'nk_title', 'nk_desc', 'nk_h1', 'nk_lead', inner, [['/how-we-score/', 'l_score'], ['/case-studies/', 'l_case'], ['/conflicts-of-interest/', 'l_coi'], ['/corrections/', 'l_corr']]);
}
function rmPage(lang) {
  const inner = '<h2 id="never">' + esc(t(lang, 'rm_never_h')) + '</h2>' + ul(t(lang, 'rm_never')) +
    '<h2 id="stays">' + esc(t(lang, 'rm_stay_h')) + '</h2><p>' + esc(t(lang, 'rm_stay')) + '</p>' +
    '<h2 id="ask">' + esc(t(lang, 'rm_how_h')) + '</h2><p>' + tv(lang, 'rm_how', { m: mailA(t(lang, 'rm_subj')) }) + '</p><p><a class="k-btn k-btn--line" href="mailto:' + MAIL + '?subject=' + encodeURIComponent(t(lang, 'rm_subj')) + '">' + esc(t(lang, 'rm_b')) + '</a></p>' +
    '<h2 id="next">' + esc(t(lang, 'rm_then_h')) + '</h2>' + ul(t(lang, 'rm_then')) +
    '<h2 id="copies">' + esc(t(lang, 'rm_copies_h')) + '</h2><p>' + esc(t(lang, 'rm_copies')) + ' ' + ext('https://search.google.com/search-console/remove-outdated-content', 'Google') + '</p>' +
    '<p class="k-small">' + esc(t(lang, 'rm_law')) + ' ' + ext('https://eur-lex.europa.eu/eli/reg/2016/679/oj', 'EUR-Lex') + '</p>';
  return page(lang, '/data-removal/', 'rm_title', 'rm_desc', 'rm_h1', 'rm_lead', inner, [['/data-policy/', 'l_data'], ['/corrections/', 'l_corr'], ['/moderation/', 'l_mod'], ['/contact/', 'l_contact']]);
}
function fraudPage(lang) {
  const F = t(lang, 'fr_first'), CH = t(lang, 'fr_ch');
  const inner = '<h2 id="first">' + esc(t(lang, 'fr_first_h')) + '</h2><ul><li>' + esc(F[0]) + '</li><li>' + esc(F[1]) + '<ul>' + CH.map(c => '<li>' + esc(c[0]) + ': ' + ext(c[2], c[1]) + '</li>').join('') + '</ul></li></ul>' +
    '<h2 id="tip">' + esc(t(lang, 'fr_us_h')) + '</h2><p>' + tv(lang, 'fr_us', { m: mailA(t(lang, 'fr_subj')) }) + '</p><p><a class="k-btn k-btn--line" href="mailto:' + MAIL + '?subject=' + encodeURIComponent(t(lang, 'fr_subj')) + '">' + esc(t(lang, 'fr_b')) + '</a></p><p>' + esc(t(lang, 'fr_pub')) + ' <a href="/buyer-reports/">/buyer-reports/</a></p>' +
    '<h2 id="what">' + esc(t(lang, 'fr_do_h')) + '</h2>' + ul(t(lang, 'fr_do')) +
    '<h2 id="safe">' + esc(t(lang, 'fr_safe_h')) + '</h2>' + ul(t(lang, 'fr_safe')) +
    '<h2 id="cannot">' + esc(t(lang, 'fr_not_h')) + '</h2><p>' + esc(t(lang, 'fr_not')) + '</p>';
  return page(lang, '/report-fraud/', 'fr_title', 'fr_desc', 'fr_h1', 'fr_lead', inner, [['/moderation/', 'l_mod'], ['/data-removal/', 'l_rm'], ['/contact/', 'l_contact'], ['/what-we-cannot-know/', 'l_cant']]);
}
function reportPage(lang, D) {
  const R = t(lang, 'trp_r'), th = t(lang, 'trp_th');
  const row = (k, v, src) => '<tr><th scope="row">' + esc(R[k]) + '</th><td class="k-n">' + (v == null ? '<span class="k-muted">-</span>' : nf(lang, v)) + '</td><td>' + src + '</td></tr>';
  const sa = p => '<a class="k-src" href="' + p + '">' + esc(p) + '</a>';
  const C = D.corr || {}, E = C.entries || [], A = (C.audits || [])[0], latest = E.reduce((m, e) => e.date > m ? e.date : m, '');
  const kinds = {}; for (const e of E) kinds[e.kind] = (kinds[e.kind] || 0) + 1;
  const rmN = E.filter(e => e.kind === 'removal').length;
  const inner = '<p>' + tv(lang, 'trp_period', { a: tm(D.first, lang), b: tm(D.today, lang) }) + '</p>' +
    '<h2 id="data">' + esc(t(lang, 'trp_data_h')) + '</h2><div class="k31-tw"><table><thead><tr>' + th.map((h, i) => '<th scope="col"' + (i === 1 ? ' class="k-n"' : '') + '>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' +
    row('p', D.projects, sa('/api/open/stats')) + row('mk', D.markets, sa('/api/open/stats')) + row('co', D.countries, sa('/api/open/stats')) + row('src', D.sources, sa('/data/bali-cases.json')) +
    row('rv', D.rv, sa('/data/named.json')) + row('rw', D.rw, sa('/data/named.json')) + row('cap', D.cap, sa('/data/register-captures.json')) + '</tbody></table></div>' +
    '<h2 id="errors">' + esc(t(lang, 'trp_err_h')) + '</h2><p>' + (E.length ? tv(lang, 'trp_err', { n: nf(lang, E.length), d: tm(latest, lang), ad: A ? tm(A.date, lang) : '-', w: A ? nf(lang, A.wrong) : '-', k: A ? nf(lang, A.claims - A.unchecked) : '-', r: A ? nf(lang, A.error_rate_pct, 1) : '-' }) : esc(t(lang, 'trp_err0'))) + ' <a class="k-src" href="' + pre(lang) + '/corrections/">' + esc(t(lang, 'l_corr')) + '</a></p>' +
    (E.length ? '<p class="k-small k-muted">' + esc(t(lang, 'trp_kinds', { list: Object.keys(kinds).sort().map(k => k + ' ' + kinds[k]).join(', ') })) + '</p>' : '') +
    '<h2 id="personal">' + esc(t(lang, 'trp_rm_h')) + '</h2><p>' + esc(t(lang, 'trp_rm', { n: nf(lang, rmN) })) + ' <a class="k-src" href="' + pre(lang) + '/data-removal/">' + esc(t(lang, 'l_rm')) + '</a></p>' +
    '<h2 id="money">' + esc(t(lang, 'trp_money_h')) + '</h2><p>' + esc(t(lang, 'trp_money')) + ' <a class="k-src" href="/metrics/">/metrics/</a> <a class="k-src" href="' + pre(lang) + '/conflicts-of-interest/">' + esc(t(lang, 'l_coi')) + '</a></p>' +
    '<h2 id="not-yet">' + esc(t(lang, 'trp_not_h')) + '</h2>' + ul(t(lang, 'trp_not')) + '<p class="k-small k-muted">' + esc(t(lang, 'trp_next')) + '</p>';
  return page(lang, '/transparency-report/2026/', 'trp_title', 'trp_desc', 'trp_h1', 'trp_lead', inner, [['/corrections/', 'l_corr'], ['/conflicts-of-interest/', 'l_coi'], ['/registers/captures/', 'l_cap'], ['/what-we-cannot-know/', 'l_cant']]);
}
async function reportData(env) {
  const [named, corr, caps] = await Promise.all([load(env, 'named.json'), opt(env, 'corrections.json'), opt(env, 'register-captures.json')]);
  let live = null; try { live = (await progData(env, null)).live; } catch (e) { live = null; }
  let ex = null; try { ex = (await trData(env)).excluded.length; } catch (e) { ex = null; }
  const P = named.projects || [], ads = P.map(x => x.ad).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d || '')).sort();
  return { first: ads[0] || '2026-10-28', today: new Date().toISOString().slice(0, 10), projects: live ? live.projects : P.length, markets: live ? live.markets : new Set(P.map(x => x.mk)).size, countries: live ? live.countries : new Set(P.map(x => x.co)).size, sources: live ? live.sources : null,
    rv: P.filter(x => x.rvw && x.rvw.ok).length, rw: P.filter(x => x.rw).length, ex, cap: caps ? (caps.items || []).filter(i => i.sha256).length : 0, corr, v: (named.updated || '') + '|' + P.length + '|' + ((corr && corr.updated) || '') + '|' + ((corr && corr.entries) || []).length + '|' + (caps ? caps.updated : '') };
}

// ------------------------------------------------------------------------------------------------ register copies (item 66)
function capPage(lang, C) {
  const th = t(lang, 'cp_th'), I = (C && C.items) || [];
  const files = it => (it.files || []).map(f => '<a href="' + esc(f.path) + '">' + esc(t(lang, f.kind === 'full' ? 'cp_full' : f.kind === 'shot' ? 'cp_shot' : f.kind === 'redacted' ? 'cp_red' : 'cp_ext')) + '</a> <span class="k31-h">' + esc(f.sha256.slice(0, 16)) + '…</span>').join('<br>');
  const rows = I.map(it => '<tr id="' + esc(it.id) + '"><td>' + (it.slug ? '<a href="' + pre(lang) + '/projects/' + esc(it.slug) + '/"><bdi>' + esc(it.name || it.id) + '</bdi></a>' : bdi(it.id)) + ' <span class="k-muted k-small" dir="ltr">' + esc(it.id) + '</span></td><td><span lang="en" dir="ltr">' + esc(it.register) + '</span><br>' + ext(it.url, it.url.replace(/^https?:\/\//, '').split('/')[0]) + '</td><td>' + tm(it.fetched_at, lang) + ' <span class="k-muted k-small" dir="ltr">' + esc(String(it.fetched_at).slice(11, 16)) + ' UTC</span></td><td>' + (it.files && it.files.length ? files(it) : esc(t(lang, 'cp_none'))) + '</td><td class="k31-h" dir="ltr">' + esc(it.sha256) + '<br><span class="k-muted">' + nf(lang, it.bytes) + ' B</span></td></tr>').join('');
  const inner = '<p class="k-small k-muted">' + esc(t(lang, 'cp_note')) + '</p><div class="k31-tw"><table class="k31-st"><thead><tr>' + th.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<h2 id="verify">' + esc(t(lang, 'cp_how_h')) + '</h2><p>' + esc(t(lang, 'cp_how')) + '</p><p class="k-small"><a href="/data/register-captures.json">/data/register-captures.json</a>' + (C && C.manifest_sha256 ? ' <span class="k31-h">' + esc(C.manifest_sha256) + '</span>' : '') + '</p>';
  return page(lang, '/registers/captures/', 'cp_title', 'cp_desc', 'cp_h1', 'cp_lead', inner, [['/registers/', 'l_cap'], ['/corrections/', 'l_corr'], ['/transparency-report/2026/', 'l_tr']]);
}

// ------------------------------------------------------------------------------------------------ score history (item 81)
function histPage(lang, H, ix, only) {
  const today = new Date().toISOString().slice(0, 10), days = (H && H.days) || [];
  // today, live, from the same method
  const live = {}; if (ix) for (const r of ix.rows.values()) { if (r.sumba || !r.dvs) continue; const a = live[r.dvs] || (live[r.dvs] = { s: 0, n: 0, name: r.dv }); a.s += r.score; a.n++; }
  const devs = Object.assign({}, (H && H.devs) || {});
  for (const k of Object.keys(live)) if (!devs[k]) devs[k] = { n: live[k].name, s: [] };
  const L = Object.entries(devs).map(([k, d]) => { const ser = (d.s || []).map((v, i) => [days[i], v]).filter(p => p[1] != null); const lv = live[k] ? Math.round(live[k].s / live[k].n * 10) / 10 : null; if (lv != null && (!ser.length || ser[ser.length - 1][0] !== today)) ser.push([today, lv, 1]); const vals = ser.map(p => p[1]); const ch = vals.length > 1 && Math.max(...vals) !== Math.min(...vals); return { k, n: d.n || (live[k] && live[k].name) || k, np: live[k] ? live[k].n : d.np || null, ser, ch }; })
    .filter(r => r.ser.length && (only === 'all' ? true : only ? r.k === only : r.ch)).sort((a, b) => Math.abs(b.ser[b.ser.length - 1][1] - b.ser[0][1]) - Math.abs(a.ser[a.ser.length - 1][1] - a.ser[0][1]) || a.n.localeCompare(b.n));
  const th = t(lang, 'sh_th');
  const spark = ser => ser.map(p => '<time datetime="' + esc(p[0]) + '" title="' + esc(fdt(p[0], lang)) + '">' + esc(p[0].slice(5)) + (p[2] ? '*' : '') + '</time> ' + nf(lang, p[1], 1)).join(' · ');
  const rows = L.slice(0, 400).map(r => { const a = r.ser[0][1], b = r.ser[r.ser.length - 1][1], d = Math.round((b - a) * 10) / 10; return '<tr id="' + esc(r.k) + '"><th scope="row"><a href="' + pre(lang) + '/developers/' + esc(r.k) + '/"><bdi>' + esc(r.n) + '</bdi></a></th><td class="k-n">' + (r.np == null ? '' : nf(lang, r.np)) + '</td><td class="k-n">' + nf(lang, a, 1) + '</td><td class="k-n">' + nf(lang, b, 1) + '</td><td class="k-n">' + (d > 0 ? '+' : '') + nf(lang, d, 1) + '</td><td class="k-small">' + spark(r.ser) + '</td></tr>'; }).join('');
  const nav = '<p>' + (only ? '<a href="' + pre(lang) + '/score-history/">' + esc(t(lang, 'sh_only')) + '</a>' : '<b>' + esc(t(lang, 'sh_only')) + '</b>') + ' · ' + (only === 'all' ? '<b>' + esc(t(lang, 'sh_all')) + '</b>' : '<a href="' + pre(lang) + '/score-history/?d=all" rel="nofollow">' + esc(t(lang, 'sh_all')) + '</a>') + '</p>';
  const one = only && only !== 'all' && !L.length ? '<p class="k31-box">' + esc(t(lang, 'sh_none', { d: fdt(days[0] || today, lang) })) + '</p>' : '';
  const inner = '<p class="k-small k-muted">' + esc(t(lang, 'sh_m', { v: METHOD.v })) + ' * = ' + esc(t(lang, 'sh_today')) + '</p>' + nav + one +
    (rows ? '<div class="k31-tw"><table class="k31-st"><thead><tr>' + th.map((h, i) => '<th scope="col"' + (i && i < 5 ? ' class="k-n"' : '') + '>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' : '') +
    '<p class="k-small"><a href="/data/score-history.json">/data/score-history.json</a></p>';
  const pg = page(lang, '/score-history/', 'sh_title', 'sh_desc', 'sh_h1', 'sh_lead', inner, [['/methods/transparency-score/', 'l_score'], ['/rankings/transparency/', 'l_rank'], ['/corrections/', 'l_corr']]);
  if (only) pg.noindex = true;
  return pg;
}

// ------------------------------------------------------------------------------------------------ routing
const BODY = new Map();
const keep = (k, f) => { let v = BODY.get(k); if (!v) { v = f(); if (BODY.size > 400) BODY.clear(); BODY.set(k, v); } return v; };
export async function handle(req, u, env, ctx, shell) {
  const p = u.pathname;
  if (!(await loadS(env))) return null;   // strings not readable: the static page (if any) or a 404 answers
  if (p === '/k/n31b.js') return new Response(n31js(), { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' } });
  if (p === '/data/cases/aykon-city-3.json') return new Response(JSON.stringify(caseJson(), null, 1), { headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=3600' } });
  const m = RX.exec(p); if (!m || !shell) return null;
  if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
  const lang = m[1] || 'en', kind = m[2];
  if (kind === 'transparency-report') return new Response(null, { status: 301, headers: { location: pre(lang) + '/transparency-report/2026/', 'cache-control': 'public, max-age=86400' } });
  let pg;
  try {
    if (kind === 'case-studies') pg = keep(lang + '|cs', () => casesHub(lang));
    else if (kind === 'case-studies/aykon-city-3') { const cases = await opt(env, 'bali-cases.json'); const cs = cases ? (cases.cases || []).find(c => c.id === C1.id) : null; pg = keep(lang + '|c1|' + (cs && cs.sat ? cs.sat.date : ''), () => casePage(lang, cs)); }
    else if (kind === 'conflicts-of-interest') pg = keep(lang + '|ci', () => coiPage(lang));
    else if (kind === 'what-we-cannot-know') pg = keep(lang + '|nk', () => cantPage(lang));
    else if (kind === 'data-removal') pg = keep(lang + '|rm', () => rmPage(lang));
    else if (kind === 'report-fraud') pg = keep(lang + '|fr', () => fraudPage(lang));
    else if (kind === 'transparency-report/2026') { const D = await reportData(env); pg = keep(lang + '|tr|' + D.v + '|' + D.today, () => reportPage(lang, D)); }
    else if (kind === 'registers/captures') { const C = await opt(env, 'register-captures.json'); pg = keep(lang + '|cp|' + (C ? C.updated + (C.items || []).length : ''), () => capPage(lang, C)); }
    else if (kind === 'score-history') {
      const [H, ix] = await Promise.all([opt(env, 'score-history.json'), trData(env).catch(() => null)]);
      const d = String(u.searchParams.get('d') || '').toLowerCase(), only = d === 'all' ? 'all' : /^[a-z0-9-]{2,90}$/.test(d) ? d : '';
      pg = keep(lang + '|sh|' + only + '|' + (H ? H.updated : '') + '|' + (ix ? ix.v : ''), () => histPage(lang, H, ix, only));
    }
  } catch (e) { return null; }
  if (!pg) return null;
  const res = await trustRender(lang, Object.assign({}, pg, { body: pg.body.replace('<div class="kpg">', CSS + '<div class="kpg">') }), shell);
  if (pg.noindex) { const h = new Headers(res.headers); h.set('x-robots-tag', 'noindex, follow'); return new Response(res.body, { status: res.status, headers: h }); }
  return res;
}
export { casePage, casesHub, coiPage, cantPage, rmPage, fraudPage, reportPage, capPage, histPage, caseJson };   // for the local test
