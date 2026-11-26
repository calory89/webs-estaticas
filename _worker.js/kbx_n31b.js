// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_n31b__q, $s = TB.kbx_n31b__s, $t = TB.kbx_n31b__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { t31, n31js, loadS } from './kbx_n31b_page.js';
import { trustRender, head, crumbLd, progData } from './kbx_trust.js';
import { trData } from './kbx_tr.js';
import { METHOD } from './kbx_e29_lines.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(case-studies(?:\/aykon-city-3)?|conflicts-of-interest|what-we-cannot-know|data-removal|report-fraud|transparency-report(?:\/2026)?|registers\/captures|score-history)(\/?)$|^\/k\/n31b\.js$|^\/data\/cases\/aykon-city-3\.json$/;
export const PAGES = ['/case-studies/', '/case-studies/aykon-city-3/', '/conflicts-of-interest/', '/what-we-cannot-know/', '/data-removal/', '/report-fraud/', '/transparency-report/2026/', '/registers/captures/', '/score-history/'];
export const REVIEWED = '2026-11-18';
const MAIL = 'hello@kolaboro.com';
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a, "'": '&#39;' }[c]));
const bdi = s => '<bdi>' + esc(s) + $q.b;
const t = (lang, k, v) => t31(lang, k, v);
const tv = (lang, k, v) => esc(t31(lang, k)).replace(/\{(\w+)\}/g, (m, a) => v && v[a] != null ? v[a] : m);
const nf = (lang, n, d) => Number(n).toLocaleString(LOC[lang] || 'en-GB', { maximumFractionDigits: d == null ? 0 : d, minimumFractionDigits: d || 0 });
const fdt = (iso, lang) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); if (!m) return String(iso || ''); try { return new Intl.DateTimeFormat(LOC[lang] || 'en-GB', { day: $q.c, month: 'long', year: $q.c, timeZone: 'UTC' }).format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))); } catch (e) { return iso.slice(0, 10); } };
const tm = (iso, lang) => $q.d + esc(String(iso).slice(0, 10)) + '">' + esc(fdt(iso, lang)) + $q.e;
const mailA = (subj) => $q.f + MAIL + (subj ? $q.g + encodeURIComponent(subj) : '') + $q.h + MAIL + $q.i;
const ext = (u, label) => $q.j + esc(u) + $t.k0 + esc(label || u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')) + $q.i;
const ul = L => '<ul>' + L.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
const reviewed = lang => $q.k + tv(lang, 'upd', { d: tm(REVIEWED, lang) }) + '</p>';
const links = (lang, L) => '<h2>' + esc(t(lang, 'rel')) + $q.l + L.map(([h, k]) => $q.m + (h.startsWith('/') && !/^\/(independence|registers|metrics|buyer-reports|developers\/reply)\b/.test(h) ? pre(lang) + h : h) + '">' + esc(t(lang, k)) + $q.n).join('') + '</ul>';
const SHARED = (globalThis.__kbJson = globalThis.__kbJson || {});
async function load(env, name) {
const m = SHARED[name]; if (m && (m.a || Date.now() - m.t < 600000)) return m.v;
let r = null, a = false;
try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + $q.o + name)); a = !!(r && r.ok); } catch (e) { r = null; }
if (!r || !r.ok) r = await fetch(ORIGIN + $q.p + name, { cf: { cacheTtl: 300, cacheEverything: true } });
if (!r.ok) throw new Error(name + ' ' + r.status);
const v = await r.json(); SHARED[name] = { t: Date.now(), v, a }; return v;
}
const opt = (env, n) => load(env, n).catch(() => null);
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
const mon = (a, b) => { const x = Date.parse(a + $q.q), y = Date.parse(b + $q.q); return (y - x) / (864e5 * 30.4375); };
const ym = d => { const m = /^(\d{4})-(\d{2})/.exec(d); return m ? +m[1] * 12 + +m[2] : 0; };
function c1Math() {
const I = C1.inspections, a = I[I.length - 1], b = I[0], c = I[1];
const mo = Math.round(mon(a[0], b[0])), pts = +(b[1] - a[1]).toFixed(2), mo2 = Math.round(mon(c[0], b[0])), pts2 = +(b[1] - c[1]).toFixed(2);
const left = mon(b[0], C1.now.completion), rem = +(100 - b[1]).toFixed(2);
return { a, b, c, mo, pts, avg: pts / mon(a[0], b[0]), mo2, pts2, rem, need: rem / left, moved: ym(C1.now.completion) - ym(C1.first.d) };
}
function casePage(lang, cs) {
const M = c1Math(), P = pre(lang) + $q.r + C1.ps + '/';
const cr = [[t(lang, 'cs_h1'), pre(lang) + $q.s], [C1.name, pre(lang) + $q.s + C1.slug + '/']];
const en = s => $q.t + esc(s) + $q.u;
const rows = C1.inspections.map((r, i) => { const prev = C1.inspections[i + 1]; return $q.v + tm(r[0], lang) + $q.w + nf(lang, r[1], 2) + $q.x + (prev ? '+' + nf(lang, r[1] - prev[1], 2) : '') + $q.y; }).join('');
const th = t(lang, 'c1_th');
const sat = cs && cs.sat && cs.sat.status === $q.z ? $q.A + esc(t(lang, $q.B)) + $q.C + tv(lang, $q.D, { x: nf(lang, cs.sat.changed_pct, 1), d: tm(cs.sat.date, lang) }) + $q.E + P + $q.F : '';
const src = $q.G + esc(t(lang, 'src_h')) + $q.H + C1.sources.map(([u, l, d]) => '<li>' + ext(u, u.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]) + $q.I + esc(l) + $q.u + (d ? $q.J + tv(lang, 'read', { d: tm(d, lang) }) + $q.K : '') + '</li>').join('') + '</ol>';
const body = $q.L + head(lang, cr, esc(t(lang, 'c1_h1')), esc(t(lang, $q.M)), reviewed(lang)) + $q.N +
$q.O + esc(t(lang, $q.P)) + $q.C + tv(lang, $q.Q, { no: bdi(C1.no), reg: tm(C1.registered, lang), st: tm(C1.start, lang), co: en(C1.company), dn: bdi(C1.dldDev), u: nf(lang, C1.units), bank: en(C1.bank) }) + ' ' + ext(C1.sources[0][0], $q.R) + '</p>' +
$q.S + esc(t(lang, $q.T)) + $q.C + tv(lang, $q.U, { r: tm(C1.first.record, lang), a: tm(C1.first.d, lang), d: tm(C1.now.read, lang) }) + ' ' + ext(C1.sources[1][0], $q.V) + '</p>' +
$q.W + esc(t(lang, $q.X)) + $q.C + tv(lang, $q.Y, { d: tm(C1.now.read, lang), sta: en(C1.now.status), c: tm(C1.now.completion, lang), pct: nf(lang, C1.now.pct, 2), i: tm(C1.now.inspected, lang), m: nf(lang, M.moved), q: en(C1.agency) }) + ' ' + ext(C1.sources[0][0], $q.R) + ' ' + ext(C1.sources[2][0], $q.Z) + '</p>' +
$q.k + esc(t(lang, $q.aa)) + ' ' + ext(C1.sources[4][0], $q.ab) + '</p>' +
$q.ac + esc(t(lang, $q.ad)) + $t.k1 + esc(th[0]) + $q.ae + esc(th[1]) + $q.ae + esc(th[2]) + $q.af + rows + $q.ag +
$q.ah + esc(t(lang, $q.ai)) + $q.C + tv(lang, $q.aj, { a: tm(M.a[0], lang), b: tm(M.b[0], lang), c: tm(M.c[0], lang), mo: nf(lang, M.mo), pts: nf(lang, M.pts, 2), avg: nf(lang, M.avg, 2), mo2: nf(lang, M.mo2), pts2: nf(lang, M.pts2, 2), due: tm(C1.now.completion, lang), rem: nf(lang, M.rem, 2), need: nf(lang, M.need, 1) }) + '</p>' +
sat + $q.ak + esc(t(lang, $q.al)) + $q.C + esc(t(lang, $q.am)) + ' ' + ext(C1.sources[3][0], $q.an) + $q.ao + pre(lang) + $q.ap + C1.devs + '/">' + bdi(C1.dev) + $q.aq +
$q.ar + esc(t(lang, $q.as)) + '</h2>' + ul(t(lang, $q.at)) +
$q.au + esc(t(lang, $q.av)) + $q.C + esc(t(lang, $q.aw)) + $t.k2 + C1.id + '">' + esc(t(lang, $q.ax)) + $q.aq +
$q.ay + P + '">' + esc(t(lang, $q.az)) + $q.aA + C1.slug + $q.aB + esc(t(lang, 'c1_dl')) + $q.aq + src +
links(lang, [[$q.s, $q.aC], [$q.aD, $q.aE], [$q.aF, $q.aG], [$q.aH, 'l_coi']]) + $q.aI;
const title = t(lang, $q.aJ), desc = t(lang, $q.aK), url = ORIGIN + pre(lang) + $q.s + C1.slug + '/';
return { path: $q.s + C1.slug + '/', title, desc, body, ld: [{ '@type': $q.aL, '@id': url + $q.aM, url, headline: title, description: desc, inLanguage: lang, datePublished: REVIEWED, dateModified: C1.now.read, author: { '@type': $q.aN, name: $q.aO, url: ORIGIN + '/' }, publisher: { '@type': $q.aN, name: $q.aO, url: ORIGIN + '/' }, about: { '@type': 'Place', name: C1.name + $q.aP }, isBasedOn: C1.sources.map(s => s[0]) }, crumbLd(lang, cr)] };
}
function caseJson() {
const M = c1Math();
return Object.assign({ name: $q.aQ + C1.name, page: ORIGIN + $q.s + C1.slug + '/', project_page: ORIGIN + $q.r + C1.ps + '/', licence: $t.k3, published: REVIEWED, note: $s.k0 }, C1, { months_moved: M.moved, arithmetic: { from: M.a, to: M.b, months: M.mo, points: M.pts, points_per_month: +M.avg.toFixed(3), remaining_points: M.rem, points_per_month_needed: +M.need.toFixed(2) } });
}
function casesHub(lang) {
const M = c1Math(), cr = [[t(lang, 'cs_h1'), pre(lang) + $q.s]];
const body = $q.L + head(lang, cr, esc(t(lang, 'cs_h1')), esc(t(lang, $q.aR)), reviewed(lang)) + $q.N +
$q.aS + pre(lang) + $q.s + C1.slug + '/">' + esc(t(lang, $q.aT, { n: C1.name, p: 'Dubai', a: fdt(C1.first.d, lang), b: fdt(C1.now.completion, lang) })) + $q.aU +
'<p>' + esc(t(lang, $q.aV)) + '</p>' + links(lang, [[$q.aW, $q.aX], [$q.aD, $q.aE], [$q.aF, $q.aG]]) + $q.aI;
const title = t(lang, $q.aY), desc = t(lang, $q.aZ), url = ORIGIN + pre(lang) + $q.s;
return { path: $q.s, title, desc, body, ld: [{ '@type': $q.ba, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: REVIEWED, hasPart: [{ '@type': $q.aL, url: ORIGIN + pre(lang) + $q.s + C1.slug + '/', headline: t(lang, $q.aJ) }] }, crumbLd(lang, cr)] };
}
function page(lang, path, kT, kD, kH, kL, inner, rel) {
  const cr = [[t(lang, kH), pre(lang) + path]];
  const body = $q.L + head(lang, cr, esc(t(lang, kH)), esc(t(lang, kL)), reviewed(lang)) + $q.N + inner + links(lang, rel) + $q.aI;
  const title = t(lang, kT), desc = t(lang, kD), url = ORIGIN + pre(lang) + path;
  return { path, title, desc, body, ld: [{ '@type': $q.bb, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: REVIEWED, publisher: { '@type': $q.aN, name: $q.aO, url: ORIGIN + '/' } }, crumbLd(lang, cr)] };
}
function coiPage(lang) {
const inner = $q.bc + esc(t(lang, $q.bd)) + $q.C + esc(t(lang, $q.be)) + $q.ao + pre(lang) + $q.bf + esc(t(lang, $q.bg)) + $q.aq +
$q.bh + esc(t(lang, $q.bi)) + '</h2>' + ul(t(lang, $q.bj)) + $t.k4 +
$q.bk + esc(t(lang, $q.bl)) + $q.C + esc(t(lang, 'ci_fd')) + $q.ao + pre(lang) + $q.bm + esc(t(lang, $q.bn)) + $q.aq +
$q.bo + esc(t(lang, $q.bp)) + '</h2>' + ul(t(lang, $q.bq)) +
$q.br + esc(t(lang, $q.bs)) + $q.C + tv(lang, $q.bt, { m: mailA(t(lang, 'l_coi')) }) + '</p>';
return page(lang, $q.aH, $q.bu, $q.bv, 'ci_h1', $q.bw, inner, [[$q.bx, 'l_ind'], [$q.aF, $q.aG], [$q.aD, $q.aE], [$q.by, 'l_tr']]);
}
function cantPage(lang) {
const th = t(lang, 'nk_th'), I = t(lang, $q.bz);
const inner = $t.k5 + th.map(h => $q.bA + esc(h) + '</th>').join('') + $q.bB + I.map(r => $q.bC + esc(r[0]) + $q.bD + esc(r[1]) + $q.bE + esc(r[2]) + $q.y).join('') + $q.ag +
$q.ay + pre(lang) + $q.bF + esc(I[2][0]) + $q.bG;
return page(lang, $q.aD, $q.bH, $q.bI, 'nk_h1', $q.bJ, inner, [[$q.bK, $q.bn], [$q.s, $q.aC], [$q.aH, 'l_coi'], [$q.aF, $q.aG]]);
}
function rmPage(lang) {
const inner = $q.bL + esc(t(lang, $q.bM)) + '</h2>' + ul(t(lang, $q.bN)) +
$q.bO + esc(t(lang, $q.bP)) + $q.C + esc(t(lang, $q.bQ)) + '</p>' +
$q.bR + esc(t(lang, $q.bS)) + $q.C + tv(lang, $q.bT, { m: mailA(t(lang, $q.bU)) }) + $t.k6 + MAIL + $q.g + encodeURIComponent(t(lang, $q.bU)) + '">' + esc(t(lang, 'rm_b')) + $q.aq +
$q.bV + esc(t(lang, $q.bW)) + '</h2>' + ul(t(lang, $q.bX)) +
$q.bY + esc(t(lang, $q.bZ)) + $q.C + esc(t(lang, $q.ca)) + ' ' + ext($t.k7, $q.cb) + '</p>' +
$q.cc + esc(t(lang, $q.cd)) + ' ' + ext($t.k8, $q.ce) + '</p>';
return page(lang, $q.cf, $q.cg, $q.ch, 'rm_h1', $q.ci, inner, [[$q.cj, $q.ck], [$q.aF, $q.aG], [$q.cl, 'l_mod'], [$q.cm, $q.cn]]);
}
function fraudPage(lang) {
const F = t(lang, $q.co), CH = t(lang, 'fr_ch');
const inner = $q.S + esc(t(lang, $q.cp)) + $q.cq + esc(F[0]) + $q.cr + esc(F[1]) + '<ul>' + CH.map(c => '<li>' + esc(c[0]) + ': ' + ext(c[2], c[1]) + '</li>').join('') + $q.cs +
$q.ct + esc(t(lang, $q.cu)) + $q.C + tv(lang, 'fr_us', { m: mailA(t(lang, $q.cv)) }) + $t.k9 + MAIL + $q.g + encodeURIComponent(t(lang, $q.cv)) + '">' + esc(t(lang, 'fr_b')) + $q.cw + esc(t(lang, $q.cx)) + $t.k10 +
$q.cy + esc(t(lang, $q.cz)) + '</h2>' + ul(t(lang, 'fr_do')) +
$q.cA + esc(t(lang, $q.cB)) + '</h2>' + ul(t(lang, $q.cC)) +
$q.cD + esc(t(lang, $q.cE)) + $q.C + esc(t(lang, $q.cF)) + '</p>';
return page(lang, $q.cG, $q.cH, $q.cI, 'fr_h1', $q.cJ, inner, [[$q.cl, 'l_mod'], [$q.cf, 'l_rm'], [$q.cm, $q.cn], [$q.aD, $q.aE]]);
}
function reportPage(lang, D) {
const R = t(lang, 'trp_r'), th = t(lang, $q.cK);
const row = (k, v, src) => $q.bC + esc(R[k]) + $q.cL + (v == null ? $q.cM : nf(lang, v)) + $q.bE + src + $q.y;
const sa = p => $q.j + p + '">' + esc(p) + '</a>';
const C = D.corr || {}, E = C.entries || [], A = (C.audits || [])[0], latest = E.reduce((m, e) => e.date > m ? e.date : m, '');
const kinds = {}; for (const e of E) kinds[e.kind] = (kinds[e.kind] || 0) + 1;
const rmN = E.filter(e => e.kind === $q.cN).length;
const inner = '<p>' + tv(lang, $q.cO, { a: tm(D.first, lang), b: tm(D.today, lang) }) + '</p>' +
$q.cP + esc(t(lang, $q.cQ)) + $t.k11 + th.map((h, i) => $q.cR + (i === 1 ? $q.cS : '') + '>' + esc(h) + '</th>').join('') + $q.bB +
row('p', D.projects, sa($q.cT)) + row('mk', D.markets, sa($q.cT)) + row('co', D.countries, sa($q.cT)) + row('src', D.sources, sa($q.cU)) +
row('rv', D.rv, sa($q.cV)) + row('rw', D.rw, sa($q.cV)) + row('cap', D.cap, sa($q.cW)) + $q.ag +
$q.cX + esc(t(lang, $q.cY)) + $q.C + (E.length ? tv(lang, $q.cZ, { n: nf(lang, E.length), d: tm(latest, lang), ad: A ? tm(A.date, lang) : '-', w: A ? nf(lang, A.wrong) : '-', k: A ? nf(lang, A.claims - A.unchecked) : '-', r: A ? nf(lang, A.error_rate_pct, 1) : '-' }) : esc(t(lang, $q.da))) + $q.E + pre(lang) + $q.db + esc(t(lang, $q.aG)) + $q.aq +
(E.length ? $q.k + esc(t(lang, $q.dc, { list: Object.keys(kinds).sort().map(k => k + ' ' + kinds[k]).join(', ') })) + '</p>' : '') +
$q.dd + esc(t(lang, $q.de)) + $q.C + esc(t(lang, $q.df, { n: nf(lang, rmN) })) + $q.E + pre(lang) + $q.dg + esc(t(lang, 'l_rm')) + $q.aq +
$q.dh + esc(t(lang, $q.di)) + $q.C + esc(t(lang, $q.dj)) + $t.k12 + pre(lang) + $q.dk + esc(t(lang, 'l_coi')) + $q.aq +
$q.dl + esc(t(lang, $q.dm)) + '</h2>' + ul(t(lang, $q.dn)) + $q.k + esc(t(lang, $q.do)) + '</p>';
return page(lang, $q.by, $q.dp, $q.dq, $q.dr, $q.ds, inner, [[$q.aF, $q.aG], [$q.aH, 'l_coi'], [$q.dt, 'l_cap'], [$q.aD, $q.aE]]);
}
async function reportData(env) {
const [named, corr, caps] = await Promise.all([load(env, $q.du), opt(env, $q.dv), opt(env, $q.dw)]);
let live = null; try { live = (await progData(env, null)).live; } catch (e) { live = null; }
let ex = null; try { ex = (await trData(env)).excluded.length; } catch (e) { ex = null; }
const P = named.projects || [], ads = P.map(x => x.ad).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d || '')).sort();
return { first: ads[0] || $q.dx, today: new Date().toISOString().slice(0, 10), projects: live ? live.projects : P.length, markets: live ? live.markets : new Set(P.map(x => x.mk)).size, countries: live ? live.countries : new Set(P.map(x => x.co)).size, sources: live ? live.sources : null,
rv: P.filter(x => x.rvw && x.rvw.ok).length, rw: P.filter(x => x.rw).length, ex, cap: caps ? (caps.items || []).filter(i => i.sha256).length : 0, corr, v: (named.updated || '') + '|' + P.length + '|' + ((corr && corr.updated) || '') + '|' + ((corr && corr.entries) || []).length + '|' + (caps ? caps.updated : '') };
}
function capPage(lang, C) {
const th = t(lang, 'cp_th'), I = (C && C.items) || [];
const files = it => (it.files || []).map(f => $q.dy + esc(f.path) + '">' + esc(t(lang, f.kind === 'full' ? $q.dz : f.kind === 'shot' ? $q.dA : f.kind === $q.dB ? $q.dC : $q.dD)) + $q.dE + esc(f.sha256.slice(0, 16)) + $q.dF).join('<br>');
const rows = I.map(it => $q.dG + esc(it.id) + $q.dH + (it.slug ? $q.dy + pre(lang) + $q.r + esc(it.slug) + $q.dI + esc(it.name || it.id) + $q.i : bdi(it.id)) + $t.k13 + esc(it.id) + $t.k14 + esc(it.register) + $q.dJ + ext(it.url, it.url.replace(/^https?:\/\//, '').split('/')[0]) + $q.bE + tm(it.fetched_at, lang) + $t.k15 + esc(String(it.fetched_at).slice(11, 16)) + $q.dK + (it.files && it.files.length ? files(it) : esc(t(lang, $q.dL))) + $q.dM + esc(it.sha256) + $q.dN + nf(lang, it.bytes) + $q.dO).join('');
const inner = $q.k + esc(t(lang, $q.dP)) + $t.k16 + th.map(h => $q.bA + esc(h) + '</th>').join('') + $q.bB + rows + $q.ag +
$q.dQ + esc(t(lang, $q.dR)) + $q.C + esc(t(lang, $q.dS)) + $t.k17 + (C && C.manifest_sha256 ? $q.dT + esc(C.manifest_sha256) + $q.u : '') + '</p>';
return page(lang, $q.dt, $q.dU, $q.dV, 'cp_h1', $q.dW, inner, [[$q.dX, 'l_cap'], [$q.aF, $q.aG], [$q.by, 'l_tr']]);
}
function histPage(lang, H, ix, only) {
const today = new Date().toISOString().slice(0, 10), days = (H && H.days) || [];
const live = {}; if (ix) for (const r of ix.rows.values()) { if (r.sumba || !r.dvs) continue; const a = live[r.dvs] || (live[r.dvs] = { s: 0, n: 0, name: r.dv }); a.s += r.score; a.n++; }
const devs = Object.assign({}, (H && H.devs) || {});
for (const k of Object.keys(live)) if (!devs[k]) devs[k] = { n: live[k].name, s: [] };
const L = Object.entries(devs).map(([k, d]) => { const ser = (d.s || []).map((v, i) => [days[i], v]).filter(p => p[1] != null); const lv = live[k] ? Math.round(live[k].s / live[k].n * 10) / 10 : null; if (lv != null && (!ser.length || ser[ser.length - 1][0] !== today)) ser.push([today, lv, 1]); const vals = ser.map(p => p[1]); const ch = vals.length > 1 && Math.max(...vals) !== Math.min(...vals); return { k, n: d.n || (live[k] && live[k].name) || k, np: live[k] ? live[k].n : d.np || null, ser, ch }; })
.filter(r => r.ser.length && (only === 'all' ? true : only ? r.k === only : r.ch)).sort((a, b) => Math.abs(b.ser[b.ser.length - 1][1] - b.ser[0][1]) - Math.abs(a.ser[a.ser.length - 1][1] - a.ser[0][1]) || a.n.localeCompare(b.n));
const th = t(lang, 'sh_th');
const spark = ser => ser.map(p => $q.d + esc(p[0]) + $q.dY + esc(fdt(p[0], lang)) + '">' + esc(p[0].slice(5)) + (p[2] ? '*' : '') + $q.dZ + nf(lang, p[1], 1)).join(' · ');
const rows = L.slice(0, 400).map(r => { const a = r.ser[0][1], b = r.ser[r.ser.length - 1][1], d = Math.round((b - a) * 10) / 10; return $q.dG + esc(r.k) + $q.ea + pre(lang) + $q.ap + esc(r.k) + $q.dI + esc(r.n) + $q.eb + (r.np == null ? '' : nf(lang, r.np)) + $q.w + nf(lang, a, 1) + $q.w + nf(lang, b, 1) + $q.w + (d > 0 ? '+' : '') + nf(lang, d, 1) + $q.ec + spark(r.ser) + $q.y; }).join('');
const nav = '<p>' + (only ? $q.dy + pre(lang) + $q.ed + esc(t(lang, $q.ee)) + '</a>' : '<b>' + esc(t(lang, $q.ee)) + '</b>') + ' · ' + (only === 'all' ? '<b>' + esc(t(lang, $q.ef)) + '</b>' : $q.dy + pre(lang) + $t.k18 + esc(t(lang, $q.ef)) + '</a>') + '</p>';
const one = only && only !== 'all' && !L.length ? $q.eg + esc(t(lang, $q.eh, { d: fdt(days[0] || today, lang) })) + '</p>' : '';
const inner = $q.k + esc(t(lang, 'sh_m', { v: METHOD.v })) + ' * = ' + esc(t(lang, $q.ei)) + '</p>' + nav + one +
(rows ? $t.k19 + th.map((h, i) => $q.cR + (i && i < 5 ? $q.cS : '') + '>' + esc(h) + '</th>').join('') + $q.bB + rows + $q.ag : '') +
$t.k20;
const pg = page(lang, $q.ej, $q.ek, $q.el, 'sh_h1', $q.em, inner, [[$q.en, $q.bn], [$q.eo, $q.ep], [$q.aF, $q.aG]]);
if (only) pg.noindex = true;
return pg;
}
const BODY = new Map();
const keep = (k, f) => { let v = BODY.get(k); if (!v) { v = f(); if (BODY.size > 400) BODY.clear(); BODY.set(k, v); } return v; };
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname;
if (!(await loadS(env))) return null;
if (p === $q.eq) return new Response(n31js(), { headers: { 'content-type': $q.er, 'cache-control': $q.es, 'x-content-type-options': $q.et } });
if (p === $q.eu) return new Response(JSON.stringify(caseJson(), null, 1), { headers: { 'content-type': $q.ev, 'access-control-allow-origin': '*', 'cache-control': $q.ew } });
const m = RX.exec(p); if (!m || !shell) return null;
if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': $q.ex } });
const lang = m[1] || 'en', kind = m[2];
if (kind === $q.ey) return new Response(null, { status: 301, headers: { location: pre(lang) + $q.by, 'cache-control': $q.ex } });
let pg;
try {
if (kind === $q.ez) pg = keep(lang + '|cs', () => casesHub(lang));
else if (kind === $q.eA) { const cases = await opt(env, $q.eB); const cs = cases ? (cases.cases || []).find(c => c.id === C1.id) : null; pg = keep(lang + '|c1|' + (cs && cs.sat ? cs.sat.date : ''), () => casePage(lang, cs)); }
else if (kind === $q.eC) pg = keep(lang + '|ci', () => coiPage(lang));
else if (kind === $q.eD) pg = keep(lang + '|nk', () => cantPage(lang));
else if (kind === $q.eE) pg = keep(lang + '|rm', () => rmPage(lang));
else if (kind === $q.eF) pg = keep(lang + '|fr', () => fraudPage(lang));
else if (kind === $q.eG) { const D = await reportData(env); pg = keep(lang + '|tr|' + D.v + '|' + D.today, () => reportPage(lang, D)); }
else if (kind === $q.eH) { const C = await opt(env, $q.dw); pg = keep(lang + '|cp|' + (C ? C.updated + (C.items || []).length : ''), () => capPage(lang, C)); }
else if (kind === $q.eI) {
const [H, ix] = await Promise.all([opt(env, $q.eJ), trData(env).catch(() => null)]);
const d = String(u.searchParams.get('d') || '').toLowerCase(), only = d === 'all' ? 'all' : /^[a-z0-9-]{2,90}$/.test(d) ? d : '';
pg = keep(lang + '|sh|' + only + '|' + (H ? H.updated : '') + '|' + (ix ? ix.v : ''), () => histPage(lang, H, ix, only));
}
} catch (e) { return null; }
if (!pg) return null;
const res = await trustRender(lang, Object.assign({}, pg, { body: pg.body.replace($q.L, $s.CSS + $q.L) }), shell);
if (pg.noindex) { const h = new Headers(res.headers); h.set($q.eK, $q.eL); return new Response(res.body, { status: res.status, headers: h }); }
return res;
}
export { casePage, casesHub, coiPage, cantPage, rmPage, fraudPage, reportPage, capPage, histPage, caseJson };
