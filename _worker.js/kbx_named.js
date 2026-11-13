// kolaboro.com named project and developer pages (SEO batch 8, agent seoP; decision by Carlos: "public name, facts only").
//   GET /projects/                         index of every tracked project, by market
//   GET /projects/<slug>/                  one project: what is promised, dated change history, delivery record, permits, register
//                                          results (live lookup), claims tested, public reports, developer, similar projects, market
//                                          context, buyer reviews (verified, moderated), right of reply, FAQ, sources
//   GET /developers/<slug>/                one developer: all its projects, promise and delivery record, GLEIF register, reports
//   GET /<lang>/projects/...  /<lang>/developers/<slug>/   the same in es de fr nl ru zh ar (templates translated, facts in source wording)
//   GET /p/<id>/                           301 to /projects/<slug>/ (called from index.js before the old anonymous page)
//   GET /api/seo/urls                      every named URL in every language with lastmod (+ alternates on the English entry), for sitemaps
//   GET /api/seo/scan?type=p|d&lang=xx&from=0&n=100   legal-safety scan of generated pages (opinion words, facts without a source)
// Data: /data/named.json (names, developer, pages read, sourced facts; built by tools/kolaboro-agent/named.py on every agent run,
// so new projects appear automatically) joined with the public files /data/bali-cases.json, promises.json, findings-by-project.json,
// similar.json and delay-index.json. Rendered HTML is cached at the edge per URL (see handle: answered at once, checked against
// the data version in the background, 6 hours at most); the page shell
// (header, footer, styles) is the site's own static page for that language.
// Legal rules: facts only, each with its source link; no opinion words and no verdicts about a named company in any language;
// no Review or AggregateRating schema (no verified reviews exist yet); private individuals are never named (named.py drops them).
import { T, LANGS, LOCALE } from './kbx_named_i18n.js';
import { hparse, hdisp, hnote, hkey, coName, mkName, placeName, CO_ISO2 } from './kbx_hdate.js';   // n25t: handover dates in words, localized
import { rpc } from './kolaboro.js';
import { watchBox, searchBox, feedLinks, W9JS, W9CSS } from './kbx_follow.js';
import { nextStep, NX_CSS, NX_JS, filterBar, KF_CSS, KF_JS, t26 } from './kbx_u26.js';   // n26u: "What next" block with compare, save, alert, ask and share; filters and sorting on /projects/   // batch 9 (b9a): watch button, instant search, feeds (UI parts; endpoints in kbx_follow.js)
import { diffRoute, phSummary } from './kbx_named_diff.js';   // batch 9 (b9b): what-changed viewer
import { ppmSection, gleifNet, networkHtml, NET_CSS, NET_JS, familyData, famNet, familyHtml } from './kbx_named_plus.js';   // n19e: corporate family (/data/gleif-family.json)
import { satData, satSection, satToc, satHeading } from './kbx_named_sat.js';
import { fcData, fcProjectHtml, fcDevGroup, rsData, rsDevHtml, rsHeading } from './kbx_fc.js';   // batch 17 (n17c): delivery forecast, developer answer speed
import { webData, webProjectHtml, webDevHealthHtml, webDevLinksHtml, webHeading } from './kbx_web.js';   // batch 18 (n18a): website health, shared website identifiers
import { watchData, watchDevHtml, watchHeading } from './kbx_watch.js';   // batch 19 (n19a): lookalike websites, sanctions screening
import { gazDevHtml, gazHeading } from './kbx_gaz.js';   // batch 21 (n21a): official gazette notices (BORME, BODACC, The Gazette)
import { cohortCard, cohortKey } from './kbx_cohort.js';
import { paperData, pricesHtml, planningHtml, paperHeading, PAPER_CSS } from './kbx_paper.js';   // batch 18 (n18d): prices over time, planning records near the site   // batch 18 (n18e): buyer group card, empty while the feature is off
import { seeData, seeHtml, seeToc, seeHeading } from './kbx_see.js';
import { filingsData, filingsDevHtml, filingsHeading } from './kbx_filings.js';   // batch 21 (n21c): official filings of listed developers
import { moneyData, moneyHtml, moneyToc, moneyHeading } from './kbx_money.js';   // batch 19 (n19b): short lets and recorded sale prices within 1 km   // batch 18 (n18c): street-level photos and 3D view
import { landData, landHtml, histHtml, landToc, landHeading, histToc, histHeading } from './kbx_land.js';   // batch 19 (n19c): protected land (#land), map history (#maphist)
import { calHtml, CAL_CSS } from './kbx_cal.js';   // batch 21 (n21d): where it should be by now, promised dates as a calendar file
import { aroundData, aroundPin, aroundHtml, climateHtml, aroundToc, aroundHeading, climateToc, climateHeading } from './kbx_around.js';   // batch 21 (n21b): around the site and distance claims (#around), climate at the plot (#climate)
import { trProject } from './kbx_tr.js';   // batch 23 (n23): rank of the project in the transparency rankings of its island or city; n24s: score, ranks and checklist in one read
import { q as qa, qaTitle, qaDesc, words, QA_CSS, months } from './kbx_named_qa.js';   // batch 24 (n24s): quick answer, question headings, search titles
import { facetsData, projFacets, devFacets, facetT } from './kbx_facets.js';   // batch 26 (n26s): what changed, total cost, official register, alternatives, comparisons, domain age, delay index, promised vs actual
import { leadMap, leadify, dlLine, devDash } from './kbx_n27lead.js';   // batch 27 (n27a): dated, sourced lead line per section; record downloads
import { secZ, lightHtml, checklistHtml, Z_CSS, U27V, t27 } from './kbx_u27.js';   // batch 27 (n27u): two-level project page, six-check light, checklist, one cached client script
import { t27 as tt27 } from './kbx_t27_i18n.js';   // batch 27 (n27t): "did you buy here?", developer reply per buyer report, moderation link
import { seoLd } from './kbx_lastmod.js';   // batch 15 (s15b): true dateModified and ImageObject in the JSON-LD   // batch 14 (f14b): construction progress from space   // batch 10 (b10c): price per m2 vs official data, company network graph

const ORIGIN = 'https://kolaboro.com';
const RESERVED = new Set(['benchmark', 'reply', 'self-check', 'templates', 'index', 'index.html']);
const CACHE_V = 'named-v74';   // v74: DLD and RAK RERA register facts and developer-page quotes for the 150 most searched projects in UAE, Middle East, Europe and Africa (n27r1); v73: overdue notice, updated date, titles with the year, shorter repeated notes (n27g); v72: "did you buy here?" in the quick answer, developer reply under each buyer report, moderation link (n27t); v71: two-level project page (sections folded), six-check traffic light, before-you-sign checklist, page scripts in one cached file (n27u); v70: watch box offers the free project report and PDF (n27e); v69: dated, sourced lead line per section, record downloads, developer dashboard link (n27a); v68: what changed, total cost, official register, alternatives, comparisons, domain age, delay index, promised vs actual (n26s); v67: /projects/ carries the least-linked project pages (n26i); v66: My projects link without a direction arrow (RTL) (n26u); v65: "What next" block (compare, save, alert, ask, share), filters and sorting on /projects/, watch box titled "Alert me if the date or price changes" (n26u)
//   // v64: market source label is the full /m/<market>/ path, not the 404 path kolaboro.com/m (n25e); v63: developer titles and descriptions fit, source wording marked in FAQ (n25t); v62: countries on developer pages, breadcrumbs (n25t, n25e); v61: handover dates in words and country names localized, Dataset JSON-LD translated, long titles fit (n25t); v60: very long project names shortened in the title (n24s)   // was
//   'named-v59';   // v59: quick answer, question headings, checklist, where, related six, search titles (n24s)   // was
//   'named-v58';   // v58: rank in the transparency rankings under the key facts (n23)   // was
//   'named-v57';   // v57: payment email check link without a language prefix on developer pages (n22e)   // was   // v56: gazette section: 5 rows before Show all, paths left to right in Arabic (n21a)   // was   // v55: official gazette notices on developer pages; warning lists shown as a row of sources (n21a)   // was   // v54: around the site, distance claims, climate at the plot (n21b)   // was   // v53: filings data for listed developers, rules table layout (n21c)   // was   // v52: short-let rules next to the short-let figures, filings section on developer pages (n21c)   // was   // v51: regulator warning lists line, gazette notices section on developer pages (n21a)   // was   // v50: accessibility pass (n21e)   // was    // v49: where it should be by now + calendar file (n21d)   // was   // v48: off-screen sections rendered on approach (n20p)   // was   // v47: save-to-my-list star on project pages (n20f)   // was   // v46: lookalike list shows 6, certificate not checked yet wording (n19a)
//     // 'named-v45';   // v45: lookalike websites and sanctions screening on developer pages (n19a)
//     // 'named-v44';   // v44: pin hold for corrected pins, inline card labels on phones (n19f)
//     // 'named-v43';   // v43: bidi isolation of names and tags in #land and #maphist (n19c)
//     // 'named-v42';   // v42: protected land and map history ledger layout (n19c)
//     // 'named-v41';   // v41: #money sales table in 3 columns on phones (n19b)
//     // 'named-v40';   // v40: protected land (#land) and map history (#maphist) (n19c)
//     // 'named-v39';   // v39: corporate family from GLEIF level 2 on developer pages (n19e)
//     // 'named-v38';   // v38: rent and resale near the site #money (n19b)
//     // 'named-v37';   // v37: UX sweep (n19f): price copies merged, singular forms, Arabic name isolation, short-answer meta line
//     // 'named-v36';   // v36: time machine GIF share button (n19d)
//     // v35: 3D view script version (n18c)
//     // v34: street photos two per row on phones, map attribution marker (n18c)
//     // v33: street-level photos and 3D view section #ground (n18c)
//     // v32: small price changes with 2 decimals, planning table labels (n18d)
//   // v31: prices over time, headline only after a word like from or price (n18d)
//   // v30: time machine and construction stage estimate in the from-space section (n18b)
//   // v29: prices over time (#prices) and planning records near the site (#planning) (n18d)
//   // v28: website health (#web, #webhealth) and shared website identifiers (#weblinks) (n18a)
//   // v26: radar and building footprints inside the from-space section (n17b)
//   // v25: delivery forecast in #delivery, answers to buyer questions on developer pages (n17c)
//   // v24: embed link and monthly market story links (s15a for s15c)
//   // v23: country hub slug for 'X (USA)' and 'St X' (s15a)
//   // v22: search-intent titles, short answer, freshness line, more FAQ, related pages, image objects (s15a)
//   // v20: construction progress from space (f14b);   // v19: search empty state links to the free check, claims 'checked against' translated (qa13); v18: RTL-safe honeypot (d12b); v17: changes page (d12b); v16: design-system tokens (d12b); v15: d12b redesign (H1 tail line, key-facts panel, side contents on desktop, tables as cards on phones)
// v13: sticky section chips, folded long lists, 44 px source pills (ux11); v11: og:image share cards, price per m2, company network (b10c); v10: page-history line (b9b)
export const OPINION_RX = /\b(scam\w*|fraud\w*|ponzi|swindl\w*|rip-?off|avoid\w*|beware|dodgy|shady|crook\w*|estafa\w*|fraude\w*|timo|timador\w*|betrug\w*|betrüg\w*|abzocke\w*|arnaque\w*|escroquer\w*|escroc\w*|oplichting|oplichter\w*|bedrog\w*)\b|мошен|обман|афер|骗局|诈骗|欺诈|احتيال|نصب/i;

// ------------------------------------------------------------------------------------------------ data
let MEMO = {};
// n20p: one fetch and one parse per file per isolate. Requests that arrive while a file is loading share that load, and the parsed
// copy of named.json, bali-cases.json and promises.json is shared with kbx_web.js and kbx_fc.js (they used to parse their own).
const SHARED = (globalThis.__kbJson = globalThis.__kbJson || {}), LOADING = {};
function loadJson(env, name, ttl) {
  // a file read from this deployment's own assets cannot change while the isolate lives, so it is kept for good (flag a);
  // only a copy that had to come over the network expires. Re-reading 11 MB of JSON every 10 minutes cost about a second of CPU.
  const m = MEMO[name]; if (m && (m.a || Date.now() - m.t < (ttl || 600000))) return Promise.resolve(m.v);
  if (LOADING[name]) return LOADING[name];
  const p = loadJson0(env, name).then(v => { SHARED[name] = { t: Date.now(), v, a: !!(MEMO[name] && MEMO[name].a) }; return v; });
  LOADING[name] = p; const done = () => { if (LOADING[name] === p) delete LOADING[name]; }; p.then(done, done);
  return p;
}
async function loadJson0(env, name) {
  let r = null, a = false;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); a = !!(r && r.ok); } catch (e) { r = null; }
  if (!r || !r.ok) r = await fetch(ORIGIN + '/data/' + name, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!r.ok) throw new Error(name + ' ' + r.status);
  const v = await r.json(); MEMO[name] = { t: Date.now(), v, a }; return v;
}
const COI_MARKETS = new Set(['sumba']);
// display name: drop research notes the discovery model left inside parentheses ("not the X in Y", "listing 1097")
function cleanName(n) {
  return String(n).replace(/\s*\(([^)]*)\)/g, (m, inner) => {
    const keep = inner.split(/\s*[;,]\s*/).filter(t => t && !/^not the\b/i.test(t) && !/^listing \d+$/i.test(t));
    return keep.length ? ' (' + keep.join(', ') + ')' : '';
  }).trim();
}
let IDX = null;
const RAWN = new WeakMap();
async function data(env) {
  const [named, cases] = await Promise.all([loadJson(env, 'named.json'), loadJson(env, 'bali-cases.json')]);
  if (IDX && IDX.named === named && IDX.cases === cases) return IDX;
  const opt = n => loadJson(env, n).catch(() => ({}));
  const [prom, find, sim, delay] = await Promise.all([opt('promises.json'), opt('findings-by-project.json'), opt('similar.json'), opt('delay-index.json')]);
  const caseBy = new Map((cases.cases || []).map(c => [c.id, c]));
  // Conflict of interest: a Kolaboro founder develops a project in Sumba (Eco Beach City), so projects in that market are never
  // named or scored by name; they stay anonymous (/p/<id>/, market only). Same rule as the published independence policy.
  const P = (named.projects || []).filter(x => caseBy.has(x.id) && !COI_MARKETS.has(String(x.mk || '').toLowerCase()));
  for (const x of P) if (x.n) { const c = cleanName(x.n); if (c !== x.n) { RAWN.set(x, x.n); x.n = c; } }   // RAWN keeps the published name for the lastmod fingerprint (n20p)
  const byId = new Map(P.map(x => [x.id, x])), bySlug = new Map(P.map(x => [x.s, x])), devs = new Map(), mk = new Map(), byAr = new Map();
  for (const x of P) {
    if (x.dvs && !RESERVED.has(x.dvs)) { if (!devs.has(x.dvs)) devs.set(x.dvs, { s: x.dvs, n: x.dv, ids: [] }); devs.get(x.dvs).ids.push(x.id); }
    if (x.ar && x.ar !== x.mk) { const a = x.mk + '|' + x.ar; if (!byAr.has(a)) byAr.set(a, []); byAr.get(a).push(x); }   // s15a: same area, for related links
    const c = caseBy.get(x.id), m = mk.get(x.mk) || { k: 0, pn: 0, esc: 0 };
    m.k++; if (reviewed(c)) m.rv = (m.rv || 0) + 1; if ((c.checks || {}).permit === 2) m.pn++; if ((c.checks || {}).escrow === true) m.esc++; mk.set(x.mk, m);
  }
  const dmk = new Map(((delay && delay.markets) || []).map(m => [m.market, m]));
  IDX = { named, cases, P, byId, bySlug, devs, caseBy, mk, dmk, byAr, sat: null, prom: (prom && prom.projects) || {}, find: (find && find.projects) || {}, sim: (sim && sim.projects) || {}, updated: cases.updated || named.updated };
  return IDX;
}

// ------------------------------------------------------------------------------------------------ helpers
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const strip = h => String(h).replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const pre = lang => lang === 'en' ? '' : '/' + lang;
const pUrl = (lang, s) => ORIGIN + pre(lang) + '/projects/' + s + '/';
const dUrl = (lang, s) => ORIGIN + pre(lang) + '/developers/' + s + '/';
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const fixU = u => typeof u === 'string' ? u.trim().replace(/ /g, '%20') : u;
const okHttp = u => typeof u === 'string' && /^https?:\/\/[^\s"<>]+$/.test(fixU(u));
const slugM = m => encodeURIComponent(String(m).toLowerCase().replace(/\s+/g, '-'));
const decodeSafe = u => { try { return decodeURIComponent(u); } catch (e) { return u; } };
const PLURAL1 = { g_moved: 'k', pr_moved: 'k', g_d: 'k' };   // n19f: a key_1 form exists for these in most languages; used when the count is 1
function tr(lang, k, v) {
  if (v && PLURAL1[k] && +v[PLURAL1[k]] === 1 && T[lang] && T[lang][k + '_1']) k = k + '_1';
  const s = (T[lang] && T[lang][k]) || T.en[k] || k;
  return v ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m).replace(/(?<!\.)\.\.(?=\s|$)/g, '.') : s;   // n25t: "2027 г.." -> "2027 г." 
}
const MON = /^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* (\d{4})$/;
const MI = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
function iso(d) {   // any date we store, to YYYY-MM-DD (or null)
  if (!d) return null; const s = String(d);
  let m = s.match(/^(\d{4}-\d{2}-\d{2})/); if (m) return m[1];
  m = s.match(MON); if (m) return m[3] + '-' + String(MI[m[2]]).padStart(2, '0') + '-' + m[1].padStart(2, '0');
  return null;
}
// n20p: one formatter per locale and options for the life of the isolate (building one per call cost most of the render time)
const dtf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'd' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.DateTimeFormat(L, o)); };
const nmf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'n' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.NumberFormat(L, o)); };
function fd(d, lang) {   // a date or period for display: 2027-Q2, 2028-08, 2027, 2026-11-05, "5 Nov 2026"
  if (d == null || d === '') return '';
  const s = String(d), L = LOCALE[lang] || 'en-GB';
  let m = s.match(/^(\d{4})-(\d{2})$/); if (m) { try { return dtf(L, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+m[1], +m[2] - 1, 1))); } catch (e) { return s; } }
  const i = iso(s); if (i) { try { return dtf(L, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(i + 'T00:00:00Z')); } catch (e) { return i; } }
  // n25t: quarters, halves, months and seasons in words ("Q1 2027", "October 2027", "Mid 2028", "1er semestre 2027"), localized;
  // a trailing note in brackets or after ";" is left for the "as published" quote. Anything else stays as published.
  return hdisp(s, lang);
}
// n25t: the wording as published, quoted once next to the localized date (key facts), when it is not one of our own codes
const asPub = (raw, lang) => hnote(raw) && (lang !== 'en' || (hparse(raw) || {}).note) && fd(raw, lang) !== String(raw).trim() ? ' <small class="k-muted">(' + esc(tr(lang, 'as_pub')) + ': <q' + (lang === 'en' ? '' : ' lang="en"') + '><bdi>' + esc(String(raw).trim()) + '</bdi></q>)</small>' : '';
const num = (n, lang) => { try { return nmf(LOCALE[lang] || 'en-GB').format(n); } catch (e) { return String(n); } };
// a source link: our own pages link plainly, other sites open in a new tab with nofollow
const srcA = (u, label) => typeof u === 'string' && (u.startsWith(ORIGIN + '/') || /^\/[a-z]/.test(u)) ? ' <a class="src" href="' + esc(u.replace(ORIGIN, '')) + '">' + esc(label || 'kolaboro.com') + '</a>'
  : okHttp(u) ? ' <a class="src" href="' + esc(fixU(u)) + '" rel="nofollow noopener" target="_blank">' + esc(label || host(u)) + '</a>' : '';
// a URL whose words could read as a verdict shows its site name only
const srcLi = u => '<li><a href="' + esc(fixU(u)) + '" rel="nofollow noopener" target="_blank">' + esc(host(u)) + '</a>' + (OPINION_RX.test(decodeSafe(u)) ? '' : ' <small>' + esc(u.length > 90 ? u.slice(0, 90) + '...' : u) + '</small>') + '</li>';
// n19f: in Arabic pages a Latin project, developer or place name next to Arabic text and punctuation is isolated with <bdi>,
// so a colon or comma lands on the right side. Only applied to text-only fragments (no attributes carry these names there).
const bidi = (lang, html, names) => {
  if (lang !== 'ar') return html;
  const E = [...new Set(names.filter(n => n && String(n).length > 2 && !/[\u0600-\u06FF]/.test(n)).map(esc))].sort((a, b) => b.length - a.length);
  if (!E.length) return html;
  const rx = new RegExp(E.map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  return html.split(/(<[^>]*>)/).map((t, i) => i % 2 ? t : t.replace(rx, '<bdi>$&</bdi>')).join('');   // text between tags only
};
const own = (path, label) => '<a href="' + esc(path) + '">' + esc(label) + '</a>';
const en = t => '<span lang="en" dir="ltr">' + esc(t) + '</span>';
const fact = (inner, u, label) => '<li class="kfact">' + inner + srcA(u, label) + '</li>';   // a fact always carries its link
const sec = (id, h, inner) => '<section class="ks" id="' + id + '"><h2>' + h + '</h2>' + inner + '</section>';
const stageKey = s => s === 'off-plan' ? 'st_offplan' : s === 'under construction' ? 'st_construction' : s === 'completed' ? 'st_completed' : 'st_unknown';
const cleanOk = t => t && !OPINION_RX.test(t);
const SEQ = ['permit', 'escrow', 'progress', 'plans', 'record', 'returns_ok'];
const HF = { 'permit claimed': 'hf_permit_claimed', 'plans published': 'hf_plans_published', 'price from': 'hf_price_from', completion: 'hf_completion', 'deposit protection stated': 'hf_deposit_protection_stated', 'construction progress %': 'hf_construction_progress', 'guaranteed-return language': 'hf_guaranteed', 'advertised yield %': 'hf_yield', units: 'hf_units', 'permit number published': 'hf_permit_number' };
const hv = (v, lang) => v === true ? tr(lang, 'yes') : v === false ? tr(lang, 'no') : v == null ? '-' : fd(v, lang);
const COUNTRY_ISO = { UAE: 'AE', 'United Arab Emirates': 'AE', Indonesia: 'ID', Spain: 'ES', 'United States': 'US', USA: 'US', 'United Kingdom': 'GB', UK: 'GB', Thailand: 'TH', Mexico: 'MX', Portugal: 'PT', Turkey: 'TR', Türkiye: 'TR', Malaysia: 'MY', Philippines: 'PH', Vietnam: 'VN', Greece: 'GR', Cyprus: 'CY', Oman: 'OM', Egypt: 'EG', Georgia: 'GE', Montenegro: 'ME', Croatia: 'HR', 'Costa Rica': 'CR', Panama: 'PA', 'Sri Lanka': 'LK', Cambodia: 'KH', Mauritius: 'MU', Australia: 'AU', Canada: 'CA', France: 'FR', Italy: 'IT', Bahrain: 'BH', Morocco: 'MA' };

// not yet reviewed: the research agent has no verification evidence (all six levels "none"). Such pages show the sourced facts only:
// no checks table, no score, no claim counts, no label of any kind (rule from the lead, 5 Nov 2026).
const reviewed = c => !!(c && c.verified && Object.values(c.verified).some(v => v && v !== 'none'));
// portals and agents: the page we read there is a listing, not the developer's own site
const PORTAL_RX = /(^|\.)(propertyfinder|bayut|thepreplan|imovirtual|idealista|fotocasa|rumavi|a1properties|dubizzle|lucasfox|kyero|rightmove|zoopla|realtor|zillow|redfin|ddproperty|hipflat|fazwaz|propertyguru|iproperty|lamudi|dotproperty|99acres|magicbricks|sahibinden|hepsiemlak|emlakjet|inmuebles24|vivanuncios|encuentra24|point2homes|jamesedition|sothebysrealty|knightfrank|savills|cbre|jll|engelvoelkers|remax|century21|coldwellbanker|eurovilla|suprimmo|benoit|terra|regent|luxinmo|tranio|prian|realting|ziprealty|propertyfinder|realtyna|thailand-property|homify|offplan|uaepropertychecker|dubairealestateiq|joshsteinrealtor|malaysiaproperty4u|newhomes|properstar|green-acres|immobilienscout24|immowelt|funda|seloger|leboncoin|logic-immo|bienici|casa|immobiliare|tecnocasa|engel)\./i;
const isListing = u => { const h = host(u); return !!h && PORTAL_RX.test('.' + h); };
function handoverOf(ix, x) {
  const pr = ix.prom[x.id] || [], h = pr.find(p => p.k === 'handover');
  if (h) return { d: h.d, p: h };
  const f = (x.fx || {}).handover_promised; if (f) return { d: f, p: null };
  const c = ix.caseBy.get(x.id); if (c && c.done) return { d: String(c.done), p: null };
  return null;
}
// n27g (batch 27): an overdue handover, computed when the page is built. The handover date on record (the one the page shows) ended
// before the current month and the project is not recorded as completed; a promise recorded as kept is left out (the event was shown
// done). Months count from the last month of the period ("Q3 2026" ends in September). The same rule feeds the notice on project
// pages, the quick answer, the titles and descriptions, and the /handover/overdue/ reports (kbx_facets.js).
export function overdueOf(ix, x, now) {
  const ho = handoverOf(ix, x); if (!ho) return null;
  const c = ix.caseBy.get(x.id) || {}, st = c.stage || x.st;
  if (st === 'completed' || (ho.p && ho.p.st === 'kept')) return null;
  const k = hkey(ho.d); if (!k) return null;
  const d = now || new Date(), [y, m] = k.split('-').map(Number), n = d.getUTCFullYear() * 12 + d.getUTCMonth() + 1 - (y * 12 + m);
  return n >= 1 ? { m: n, d: ho.d, end: k, st } : null;
}
// overdue projects per market (for the link to /handover/overdue/<place>/, which exists from 2 projects)
const OVM = new WeakMap();
export function overdueByMarket(ix) { let M = OVM.get(ix); if (!M) { M = new Map(); for (const x of ix.P) if (overdueOf(ix, x)) M.set(x.mk, (M.get(x.mk) || 0) + 1); OVM.set(ix, M); } return M; }
export const OV_MIN = 2;
function lastmod(ix, x) {
  const c = ix.caseBy.get(x.id) || {}, f = ix.find[x.id] || {};
  const ds = [iso(c.checked), iso(f.checked), iso(x.sealed), iso((c.fp || {}).date)].filter(Boolean).sort();
  return ds.length ? ds[ds.length - 1] : (iso(ix.updated) || new Date().toISOString().slice(0, 10));
}

// s15a: hub slugs (same rule as kbx_seo.js slug) and the page's images: the share card and, where we have a series, the monthly satellite strip
const CO_HUB = { 'Puerto Rico (USA)': 'Puerto Rico', 'St Lucia': 'Saint Lucia' };   // country spellings whose hub page uses another name (checked 7 Nov 2026)
const dot = t => String(t).replace(/\.\.(?=\s|$)/g, '.');   // "4 нояб. 2026 г." at the end of a sentence
const slugA = s => String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const ymFmt = (ym, lang) => fd(ym, lang);
function projImages(x, lang, canon, sat) {
  const out = [{ '@id': canon + '#og', url: ORIGIN + '/og/projects/' + x.s + '.png', contentUrl: ORIGIN + '/og/projects/' + x.s + '.png', width: 1200, height: 630, caption: tr(lang, 'og_alt', { n: x.n }), name: tr(lang, 'og_alt', { n: x.n }) }];
  const r = sat && sat.projects && sat.projects[x.id];
  if (r && r.frames && r.v && r.m0 && r.n) {
    const [y, m] = r.m0.split('-').map(Number), e = new Date(Date.UTC(y, m - 1 + r.n - 1, 1)), last = e.getUTCFullYear() + '-' + String(e.getUTCMonth() + 1).padStart(2, '0');
    const cap = tr(lang, 'img_sat', { n: x.n, a: ymFmt(r.m0, lang), b: ymFmt(last, lang) }), u = ORIGIN + '/k/sat/proj/' + encodeURIComponent(x.id) + '.jpg?v=' + encodeURIComponent(r.v);
    out.push({ '@id': canon + '#sat', url: u, contentUrl: u, caption: cap, name: cap, creditText: 'Contains modified Copernicus Sentinel data', license: 'https://sentinels.copernicus.eu/documents/247904/690755/Sentinel_Data_Legal_Notice', acquireLicensePage: ORIGIN + '/satellite/' });
  }
  return out;
}

// n24s: related six (same developer, same market, same handover year), pools built once per data version
const R6P = new WeakMap();
const hy = (ix, o) => { const h = handoverOf(ix, o), m = h && /(20\d\d)/.exec(String(h.d)); return m ? m[1] : null; };
function rel6(ix, x, ho) {
  let P = R6P.get(ix);
  if (!P) { P = { mk: new Map(), y: new Map() }; for (const o of ix.P) { if (!P.mk.has(o.mk)) P.mk.set(o.mk, []); P.mk.get(o.mk).push(o); const y = hy(ix, o); if (y) { if (!P.y.has(y)) P.y.set(y, []); P.y.get(y).push(o); } } R6P.set(ix, P); }
  let hsh = 0; for (const ch of String(x.id)) hsh = (hsh * 31 + ch.charCodeAt(0)) >>> 0;
  const rot = L => { const a = L.filter(o => o.id !== x.id); if (!a.length) return a; const k = hsh % a.length; return a.slice(k).concat(a.slice(0, k)); };
  const y = ho && (/(20\d\d)/.exec(String(ho.d)) || [])[1];
  const pools = [[rot(x.dvs && ix.devs.has(x.dvs) ? ix.devs.get(x.dvs).ids.map(i => ix.byId.get(i)).filter(Boolean) : []), 'dev'], [rot(P.mk.get(x.mk) || []), 'mk'],
    [rot((y && P.y.get(y)) || []).sort((a, b) => (b.co === x.co) - (a.co === x.co)), 'y:' + y]];
  const out = [], seen = new Set([x.id]);
  const take = (L, why, n) => { for (const o of L) { if (out.length >= 6 || n <= 0) break; if (seen.has(o.id)) continue; seen.add(o.id); out.push([o, why]); n--; } };
  for (const [L, why] of pools) take(L, why, 2);
  for (const [L, why] of pools) take(L, why, 6);
  return out;
}

// n26i (batch 26): the project pages the fewest other project pages link to. In-links counted from the links every project page
// carries (the related six and the same-area list); the index, place and developer pages link every project and are left out of the
// count. Ties rotate by day so the home page and hubs spread their links. Used by /projects/ and the home page and hubs (index.js).
const LL6 = new WeakMap();
export function leastLinked(ix, n, seed) {
  let C = LL6.get(ix);
  if (!C) {
    C = new Map(ix.P.map(x => [x.id, 0]));
    for (const x of ix.P) {
      const R = rel6(ix, x, handoverOf(ix, x)), rs = new Set(R.map(r => r[0].id));
      for (const [o] of R) C.set(o.id, (C.get(o.id) || 0) + 1);
      if (x.ar && x.ar !== x.mk) for (const o of (ix.byAr.get(x.mk + '|' + x.ar) || []).filter(o => o.id !== x.id && !rs.has(o.id)).slice(0, 8)) C.set(o.id, (C.get(o.id) || 0) + 1);
    }
    LL6.set(ix, C);
  }
  let h = 0; for (const ch of String(seed || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const key = x => { let k = h; for (const ch of x.id) k = (k * 33 + ch.charCodeAt(0)) >>> 0; return k; };
  return ix.P.slice().sort((a, b) => C.get(a.id) - C.get(b.id) || key(a) - key(b)).slice(0, n).map(x => ({ x, links: C.get(x.id) }));
}
const LLH = { en: ['More projects to look at', 'Pages few other project pages link to yet.'], es: ['Más proyectos para revisar', 'Fichas a las que todavía enlazan pocas otras fichas.'],
  de: ['Weitere Projekte', 'Seiten, auf die bisher nur wenige andere Projektseiten verlinken.'], fr: ['D\'autres projets à consulter', 'Des fiches vers lesquelles peu d\'autres fiches renvoient encore.'],
  nl: ['Meer projecten om te bekijken', 'Pagina\'s waar nog weinig andere projectpagina\'s naar linken.'], ru: ['Ещё проекты', 'Страницы, на которые пока ссылаются немногие другие страницы проектов.'],
  zh: ['更多可查看的项目', '目前很少有其他项目页面链接到这些页面。'], ar: ['مشاريع أخرى للاطلاع', 'صفحات لا تشير إليها حتى الآن إلا صفحات مشاريع قليلة.'] };
export function leastHtml(ix, lang, n, seed) {
  const L = leastLinked(ix, n, seed), T = LLH[lang] || LLH.en, b = s => lang === 'ar' ? '<bdi>' + esc(s) + '</bdi>' : esc(s);
  if (!L.length) return '';
  return '<section class="kll" id="more-projects"' + (lang === 'ar' ? ' dir="rtl"' : '') + '><div class="wrap"><h2>' + esc(T[0]) + '</h2><p class="kll-s">' + esc(T[1]) + '</p><ul class="kll-l">' +
    L.map(({ x }) => '<li><a href="' + pre(lang) + '/projects/' + x.s + '/">' + b(x.n) + '</a> <small>' + b(mkName(x.mk, lang)) + '</small></li>').join('') + '</ul></div></section>';
}
// for the home page and hubs (index.js): the block from memory only, so those pages never wait for the named data; when the data is
// not in memory yet it loads in the background and the next request carries the block
const LLR = new Map();
export function leastReady(env, ctx, lang) {
  if (IDX) { const k = lang + '|' + iso(IDX.updated) + '|' + IDX.P.length; let h = LLR.get(k); if (!h) { h = LL_CSS + leastHtml(IDX, lang, 12, iso(IDX.updated) + lang); if (LLR.size > 40) LLR.clear(); LLR.set(k, h); } return h; }
  try { const p = data(env).catch(() => null); if (ctx && ctx.waitUntil) ctx.waitUntil(p); } catch (e) {}
  return '';
}
export const LL_CSS = '<style>.kll{padding:28px 0;border-top:1px solid var(--line)}.kll h2{font-size:1.25rem;margin:0 0 4px}.kll-s{color:var(--muted);margin:0 0 12px}.kll-l{columns:3 220px;padding-inline-start:18px;margin:0}.kll-l li{margin:0 0 8px;break-inside:avoid}.kll-l small{color:var(--muted)}</style>';

// n24s (batch 24): the quick answer, 40 to 60 words, only from fields we hold: what it is, developer, place, handover date as
// published (and its moves), permit published yes or no, transparency score and rank in its place, our review status, last checked.
// Parts are dropped in a fixed order when the English text runs over 60 words, so every language carries the same facts.
// o.rvN: verified buyer reviews (undefined: unknown, the sentence is left out); o.checked: last checked date. Also used by
// /api/seo/urls (summary), llms-full.txt and the answer files.
function qaSentences(ix, x, lang, tp, o) {
  const c = ix.caseBy.get(x.id) || {}, cl = c.claims || { verified: 0, unverified: 0, contradicted: 0 }, cN = (cl.verified || 0) + (cl.unverified || 0) + (cl.contradicted || 0), rvd = reviewed(c);
  const ho = handoverOf(ix, x), hand = (ix.prom[x.id] || []).find(p => p.k === 'handover'), name = x.n, checked = (o && o.checked) || lastmod(ix, x), rvN = o ? o.rvN : undefined;
  const place0 = [x.ar, x.mk !== x.ar ? x.mk : null, x.co !== x.mk ? x.co : null].filter(Boolean).join(', '), place2 = [x.mk, x.co !== x.mk ? x.co : null].filter(Boolean).join(', ');
  const coL = (lg, p) => placeName(p, lg);   // n25t: country (and a market named like a country) in the page language
  const rk = tp ? (tp.ranks.find(r => r.ranked) || null) : null, ovq = overdueOf(ix, x);   // n27g: overdue computed now, not at build time
  const parts = (lg, pl) => {
    const place = coL(lg, pl || place0), st = c.stage || x.st, stg = tr(lg, stageKey(st)), unk = stageKey(st) === 'st_unknown';
    return [['what', unk ? qa(lg, x.dv ? 'qa_w0d' : 'qa_w0', { n: name, place, dev: x.dv }) : tr(lg, x.dv ? 'g_listed_dev' : 'g_listed', { n: name, stage: stg, place, dev: x.dv })],
      ['h', ho ? tr(lg, 'g_h', { h: fd(ho.d, lg) }) : tr(lg, 'g_h_none')],
      ['mv', ovq ? tr(lg, 'g_over2', { m: ovq.m }) : hand && hand.mv ? tr(lg, 'g_moved', { k: hand.mv, mm: hand.mm }) : ''],
      ['pn', qa(lg, x.pn ? 'qa_pn1' : 'qa_pn0')],
      ['tr', tp ? (rk ? qa(lg, 'qa_tr', { s: num(tp.score, lg), r: num(rk.r, lg), m: num(rk.m, lg), p: rk.p }) : qa(lg, 'qa_tr1', { s: num(tp.score, lg) })) : ''],
      ['rv', rvd ? (cN ? qa(lg, 'qa_cl', { v: num(cl.verified || 0, lg), c: num(cN, lg) }) : '') : tr(lg, 'nr_badge', { d: fd(x.ad || c.checked, lg) }) + (lg === 'zh' ? '。' : '.')],
      ['rev', rvN === undefined ? '' : rvN ? tr(lg, 'ans_rev', { k: num(rvN, lg) }) : tr(lg, 'ans_rev0')],
      ['chk', qa(lg, 'qa_chk', { d: fd(checked, lg) })]].filter(p => p[1]);
  };
  const W = (P, out) => words(P.filter(p => !out.has(p[0])).map(p => p[1]).join(' '));
  const out = new Set(); let pl = place0;
  for (const k of ['chk', 'rev', 'place', rvd ? 'rv' : 'none', 'mv']) { if (W(parts('en', pl), out) <= 60) break; if (k === 'place') pl = place2 || place0; else out.add(k); }
  return parts(lang, pl).filter(p => !out.has(p[0])).map(p => dot(p[1]));
}
export function quickAnswer(ix, x, lang, tp, o) { return qaSentences(ix, x, lang, tp, o).join(' '); }

// ------------------------------------------------------------------------------------------------ project page
function projectPage(ix, x, lang, extra) {
  const sec = secZ;   // n27u: every section folded below the quick answer and the six-check light (content stays in the HTML)
  const c = ix.caseBy.get(x.id), ck = c.checks || {}, vf = c.verified || {}, cl = c.claims || { verified: 0, unverified: 0, contradicted: 0 };
  const name = x.n, place = placeName([x.ar, x.mk !== x.ar ? x.mk : null, x.co !== x.mk ? x.co : null].filter(Boolean).join(', '), lang);   // n25t: country localized
  const stage = tr(lang, stageKey(c.stage || x.st)), ho = handoverOf(ix, x), checked = lastmod(ix, x);
  const page = x.url, pr = (ix.prom[x.id] || []).slice(0, 12), hand = pr.find(p => p.k === 'handover');
  const ov = overdueOf(ix, x), ovN = ov ? ov.m : 0;   // n27g: months since the handover date on record passed (null: not overdue)
  const cN = cl.verified + cl.unverified + cl.contradicted, rvd = reviewed(c), nrB = tr(lang, 'nr_badge', { d: fd(x.ad || c.checked, lang) });
  const canon = pUrl(lang, x.s), devPage = x.dvs && ix.devs.has(x.dvs) ? dUrl(lang, x.dvs) : null, rec = '/api/open/projects/' + encodeURIComponent(x.id);
  // s15a: the description answers the search ("<project> reviews / opiniones / avis ...") with our data, in the page's language
  const rv = extra.reviews || { approved_total: 0, reports: [] }, rvN = rv.approved_total || 0;
  const dv0 = { n: name, place, stage, by: x.dv ? tr(lang, 'by_dev', { dev: x.dv }) : '', h: ho ? fd(ho.d, lang) : tr(lang, 'v_none'), pn: x.pn ? tr(lang, 'v_pub') : tr(lang, 'v_notpub'), c: cN, v: cl.verified, r: rvN ? num(rvN, lang) : tr(lang, 'r_none'), d: fd(checked, lang) };
  // n24s: the transparency score and the rank in its island or city (kbx_tr.js), used by the quick answer, the checklist and the FAQ
  const tp = extra.trp || null, rk = tp ? (tp.ranks.find(r => r.ranked) || null) : null, tpS = tp ? num(tp.score, lang) : null;
  const place2 = placeName([x.mk, x.co !== x.mk ? x.co : null].filter(Boolean).join(', '), lang), bdq = t => bidi(lang, esc(t), [name]);
  // n24s: search title under 60 characters and description under 155, with the searched word and the most clicked fact
  // n27g: with the year, an overdue handover where it fits, and the description opening with the overdue date, the moves or no permit
  const nfL = v => num(v, lang), yNow = new Date().getUTCFullYear();
  const title = qaTitle(lang, { n: name, h: ho ? fd(ho.d, lang) : null, pn: !!x.pn, dv: x.dv, y: yNow, ov: ovN, nf: nfL });
  const desc = dot(qaDesc(lang, { n: name, by: dv0.by, place, place2, h: ho ? fd(ho.d, lang) : null, pn: !!x.pn, s: tp ? tpS : null, rv: rvd, d: fd(checked, lang), ov: ovN, mv: hand && hand.mv ? hand.mv : 0, nf: nfL }));

  // in short (answer-ready summary)
  const g = [];
  if (!rvd) g.push('<li class="knote">' + esc(nrB) + '. ' + esc(tr(lang, 'nr_txt')) + '</li>');
  g.push(fact(esc(x.dv ? tr(lang, 'g_listed_dev', { n: name, stage, place, dev: x.dv }) : tr(lang, 'g_listed', { n: name, stage, place })), page));
  g.push(fact(esc(ho ? tr(lang, 'g_h', { h: fd(ho.d, lang) }) : tr(lang, 'g_h_none')), page));
  if (ovN) g.push(fact(esc(tr(lang, 'g_over2', { m: ovN })), '/promises/', tr(lang, 'm_promises')));   // n19f: next to the date it is about
  else if (hand && hand.mv) g.push(fact(esc(tr(lang, 'g_moved', { k: hand.mv, mm: hand.mm })), '/promises/', tr(lang, 'm_promises')));
  g.push(fact(esc(x.pn ? tr(lang, 'g_pn') : tr(lang, 'g_pn_none')), x.du || page));
  if (cN && rvd) g.push(fact(esc(tr(lang, 'g_claims', { c: cN, v: cl.verified, u: cl.unverified, x: cl.contradicted })), rec, tr(lang, 'k_record')));

  // key facts strip
  const kf = (k, v, src) => '<div class="kf"><dt>' + esc(tr(lang, k)) + '</dt><dd>' + v + (src ? srcA(src) : '') + '</dd></div>';
  const keys = '<dl class="kfs">' +
    kf('k_dev', x.dv ? (devPage ? own(devPage.replace(ORIGIN, ''), x.dv) : esc(x.dv)) : esc(tr(lang, 'v_dev_none')), x.dv ? page : null) +
    kf('k_loc', esc(place), null) + kf('k_stage', esc(stage) + (x.sts ? ' · ' + en(x.sts) : ''), page) +
    kf('k_hand', ho ? esc(fd(ho.d, lang)) : esc(tr(lang, 'v_none')), ho ? page : null) +
    kf('k_permit', x.pn ? en(x.pn) : esc(tr(lang, 'v_notpub')), x.pn ? (x.du || page) : null) +
    (rvd ? '' : '<div class="kf knr"><dt>Kolaboro</dt><dd>' + esc(nrB) + '</dd></div>') +
    kf('k_escrow', !rvd ? esc(tr(lang, 'nr_short')) : ck.escrow === true ? esc(tr(lang, 'v_stated')) : ck.escrow === false ? esc(tr(lang, 'v_notstated')) : esc(tr(lang, 'not_researched')), rvd && ck.escrow != null ? page : null) +
    (okHttp(page) ? kf('k_page', esc(host(page)) + (isListing(page) ? '<br><small>' + esc(tr(lang, 'v_listing')) + '</small>' : ''), page) : '') +
    kf('k_checked', esc(fd(checked, lang)), null) +
    kf('k_record', own(rec, x.id), null) + '</dl>';

  // n26s (batch 26): what changed since the last check, total cost of buying, official register, alternatives and comparisons,
  // website domain age, the developer's projects not yet completed, delay index of the place (kbx_facets.js)
  const FX = extra.fac ? projFacets(extra.fac, ix, x, lang, { ph: extra.ph, paper: extra.paper, checked }) : null;

  // what is promised
  const fx = x.fx || {}, F = [];
  const cur = fx.currency ? fx.currency + ' ' : '';
  if (fx.price_min) F.push([tr(lang, 'f_price'), cur + num(fx.price_min, lang) + (fx.price_max ? ' - ' + num(fx.price_max, lang) : '')]);
  if (c.units) F.push([tr(lang, 'f_units'), num(c.units, lang)]);
  if (fx.size_min_m2) F.push([tr(lang, 'f_sizes'), num(fx.size_min_m2, lang) + (fx.size_max_m2 ? ' - ' + num(fx.size_max_m2, lang) : '') + ' m²']);
  if ((fx.unit_types || []).length) F.push([tr(lang, 'f_types'), fx.unit_types.join(', ')]);
  for (const [k, l] of [['payment_plan', 'f_plan'], ['foreign_ownership', 'f_own'], ['service_charge', 'f_service'], ['brand', 'f_brand'], ['permit_authority', 'f_auth']]) if (fx[k]) F.push([tr(lang, l), String(fx[k])]);
  if (fx.deposit_pct) F.push([tr(lang, 'f_deposit'), fx.deposit_pct + '%']);
  if (fx.construction_start) F.push([tr(lang, 'f_start'), fd(fx.construction_start, lang), esc(fd(fx.construction_start, lang)) + asPub(fx.construction_start, lang)]);
  if (fx.handover_promised) F.push([tr(lang, 'f_hand'), fd(fx.handover_promised, lang), esc(fd(fx.handover_promised, lang)) + asPub(fx.handover_promised, lang)]);
  if (fx.original_handover && fx.original_handover !== fx.handover_promised) F.push([tr(lang, 'f_orig'), fd(fx.original_handover, lang), esc(fd(fx.original_handover, lang)) + asPub(fx.original_handover, lang)]);
  // n24s: "How much does it cost?": prices and payment plan as published, the date of the copy we read, "not published" when missing
  const readD = fd(x.sealed || x.ad || checked, lang);
  const costTop = fact(esc(qa(lang, 'c_read', { d: readD })), page) + (fx.price_min ? '' : '<li>' + esc(qa(lang, 'c_price0')) + '</li>') + (fx.payment_plan ? '' : '<li>' + esc(qa(lang, 'c_plan0')) + '</li>');
  const promised = '<ul class="fl">' + costTop +   // n27g: the generic intro line was dropped (repeated on every page; each fact carries its source)
    F.filter(f => cleanOk(f[1])).map(f => fact('<b>' + esc(f[0]) + ':</b> ' + (f[2] != null ? f[2] : en(f[1])), page)).join('') +
    (x.dl || []).filter(cleanOk).map(t => fact(en(t), x.du || page)).join('') + '</ul>';

  // delivery and delay record
  const prLi = pr.map(p => {
    const st = tr(lang, 'ps_' + p.st), kd = tr(lang, 'pk_' + p.k);
    const src = p.src === 'page' && p.sha ? tr(lang, 'pr_src_page', { d: fd(p.seen, lang), h: p.sha }) : tr(lang, 'pr_src_research', { d: fd(p.seen, lang) });
    const hist = (p.hist || []).filter(h => h.d && h.d !== p.d).map(h => esc(fd(h.d, lang)) + ' (' + esc(fd(h.seen, lang)) + ')');
    return fact('<b>' + esc(kd) + ': ' + esc(fd(p.d, lang)) + '</b> <span class="kpill p-' + esc(p.st) + '">' + esc(st) + '</span>' + (p.mv ? ' · ' + esc(tr(lang, 'pr_moved', { k: p.mv, mm: p.mm })) : '') +
      '<br><small>' + esc(src) + (hist.length ? ' · ' + esc(tr(lang, 'pr_hist')) + ': ' + hist.join(', ') : '') + '</small>', page);
  }).join('');
  // n24s: "When will it be completed?": the handover history in one line (first date on record, latest, moves), then every promise
  const h0 = hand && ((hand.hist || []).find(h => h && h.d) || null);
  const whenTop = ho ? fact(esc(hand && hand.mv ? qa(lang, 'w_sum', { h: fd(ho.d, lang), a: fd(h0 && h0.d !== ho.d ? h0.d : (fx.original_handover || ho.d), lang), k: num(hand.mv, lang) }) : qa(lang, 'w_sum0', { h: fd(ho.d, lang) })), hand ? '/promises/' : page, hand ? tr(lang, 'm_promises') : undefined) : '<li>' + esc(qa(lang, 'w_none')) + '</li>';
  const delivery = '<p class="ki">' + tr(lang, 'del_intro', { link: own('/promises/', tr(lang, 'm_promises')) }) + '</p><ul class="fl">' + whenTop + (prLi || '<li>' + esc(tr(lang, 'no_promises')) + '</li>') +
    (ovN ? fact(esc(tr(lang, 'over_line', { m: ovN })), '/promises/', tr(lang, 'm_promises')) : '') +
    (c.delay ? fact(esc(tr(lang, 'delay_line', { m: c.delay })), page) : '') + '</ul>' + (extra.fc ? fcProjectHtml(extra.fc, x, lang, extra.fdg) : '')
    + (h => h ? '<style id="kcal-css">' + CAL_CSS + '</style>' + h : '')(calHtml(x, ix.prom[x.id], lang, k => tr(lang, 'pk_' + k), d => fd(d, lang)));   // n21d

  // construction progress from space (only projects with a plot-level pin and a Sentinel-2 series)
  const webHtml = extra.web ? webProjectHtml(extra.web, x, lang) : '';   // n18a
  const seeSec = extra.see ? seeHtml(extra.see, x.id, lang, d => fd(d, lang), name) : '';   // n18c
  const satHtml = extra.sat ? satSection(extra.sat, x.id, ix.prom[x.id] || [], fx, lang, d => fd(d, lang), k => tr(lang, 'pk_' + k), d => tr(lang, 'sat_tile', { n: name, d })) : '';

  // permits and licences
  const rw = x.rw, lk = { url: page || '', q: name, country: COUNTRY_ISO[x.co] || '', permit: x.pn && x.pn.length <= 40 ? x.pn : '', company: x.dv || '', ai: '0' };   // ai=0: registers only, no paid desk review from a page view
  const permits = '<ul class="fl">' + (x.pn ? fact(esc(tr(lang, 'permit_pn', { pn: '%%PN%%' })).replace('%%PN%%', en(x.pn)), x.du || page) : '<li>' + esc(tr(lang, 'permit_none')) + '</li>') +
    (x.ev && x.ev.permit && cleanOk(x.ev.permit) ? fact(en(x.ev.permit), x.du || page) : '') +
    (rw ? fact(esc(tr(lang, 'rw_line', { reg: rw.register, item: rw.item, st: rw.status, det: rw.detail ? ', ' + rw.detail : '', d: fd(rw.checked, lang) })), '/registers/', 'kolaboro.com/registers') : '') +
    (c.register && !rw ? fact(esc(tr(lang, 'rw_line', { reg: c.register.register, item: c.register.item, st: c.register.status, det: '', d: fd(c.register.checked, lang) })), '/registers/', 'kolaboro.com/registers') : '') + (FX ? FX.reg : '') + '</ul>' +
    '<div class="klive" data-lk="' + esc(JSON.stringify(lk)) + '"><h3>' + esc(tr(lang, 'live_h')) + '</h3><p class="ki">' + esc(tr(lang, 'live_note')) + '</p><button type="button" class="btn btn-line kbtn" data-live>' + esc(tr(lang, 'live_btn')) + '</button><div class="live-out" aria-live="polite"></div></div>';

  // six checks
  const rows = SEQ.map(k => {
    const researched = (ck.researched || []).includes(k), val = ck[k];
    const pub = k === 'permit' ? val === 2 : k === 'progress' ? val != null : val === true;
    const lvl = vf[k] ? tr(lang, 'l_' + vf[k]) : '';
    const evd = x.ev && x.ev[k] && cleanOk(x.ev[k]) ? en(x.ev[k]) + srcA(x.du || page) : '';
    return '<tr><th scope="row">' + esc(tr(lang, 'c_' + k)) + '</th><td>' + esc(researched ? tr(lang, pub ? 'yes' : 'no') : tr(lang, 'not_researched')) + '</td><td>' + esc(lvl) + '</td><td>' + evd + '</td></tr>';
  }).join('');
  const checks = !rvd ? '<p class="knote">' + esc(nrB) + '. ' + esc(tr(lang, 'nr_txt')) + '</p>' : '<p class="ki">' + tr(lang, 'checks_intro', { link: own('/how-we-score/', tr(lang, 'm_method')) }) + '</p><div class="tw"><table><thead><tr><th>' + esc(tr(lang, 'th_check')) + '</th><th>' + esc(tr(lang, 'th_public')) + '</th><th>' + esc(tr(lang, 'th_level')) + '</th><th>' + esc(tr(lang, 'th_evidence')) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>';

  // claims
  const CL = (x.cl || []).filter(r => cleanOk(r[0]));
  const claims = CL.length ? '<div class="tw"><table><thead><tr><th>' + esc(tr(lang, 'th_claim')) + '</th><th>' + esc(tr(lang, 'th_status')) + '</th><th>' + esc(tr(lang, 'th_by')) + '</th><th>' + esc(tr(lang, 'th_source')) + '</th></tr></thead><tbody>' +
    CL.map(r => '<tr class="kfact"><td>' + en(r[0]) + '</td><td><span class="kpill c-' + esc(r[1]) + '">' + esc(tr(lang, 'cs_' + r[1])) + '</span></td><td>' + (r[2] && r[2] !== 'none' ? (r[2] === 'independent' || r[2] === 'registry' ? esc(tr(lang, 'by_' + r[2])) : en(r[2])) : '') + '</td><td>' + srcA(r[3]) + '</td></tr>').join('') + '</tbody></table></div>' : '<p>' + esc(tr(lang, 'no_hist')) + '</p>';

  // history
  const H = [];
  for (const h of c.history || []) H.push([h.d, fact(esc(fd(h.d, lang)) + ': ' + esc(tr(lang, 'hist_row', { f: tr(lang, HF[h.f] || 'hf_units'), a: hv(h.from, lang), b: hv(h.to, lang) })), page)]);
  const fdx = ix.find[x.id];
  for (const f of ((fdx && fdx.f) || []).slice(0, 8)) { const t = String(f.text || '').replace(/^[A-Z]{2,5}-\d{3,4}\s*·\s*/, ''); if (cleanOk(t)) H.push([iso(f.at), fact(esc(fd(f.at, lang)) + ' · ' + esc(tr(lang, 'hist_hourly')) + ': ' + en(t) + (f.fp ? ' <small>(SHA-256 ' + esc(f.fp) + '...)</small>' : ''), page)]); }
  H.sort((a, b) => String(b[0]).localeCompare(String(a[0])));
  const fpd = x.sha || (c.fp || {}).sha256;
  const ph = extra.ph, chg = '/projects/' + x.s + '/changes/';
  const phLine = ph && ph.n ? fact(esc(ph.n > 1 ? tr(lang, 'ph_line', { n: ph.n, a: fd(ph.first, lang), b: fd(ph.last, lang), c: ph.changed }) : tr(lang, 'ph_one', { a: fd(ph.first, lang) })) + ' <a class="more" href="' + chg + '">' + esc(tr(lang, ph.n > 1 ? 'ph_link' : 'ph_link1')) + '</a>', chg, tr(lang, 'ph_src')) : '';
  const history = '<ul class="fl">' + phLine + (H.map(h => h[1]).join('') || (phLine ? '' : '<li>' + esc(tr(lang, 'no_hist')) + '</li>')) +
    (fpd ? fact(tr(lang, 'fp_line', { d: esc(fd(x.sealed || (c.fp || {}).date, lang)), h: '<code>' + esc(fpd.slice(0, 16)) + '...</code>', link: own('/verify/', tr(lang, 'm_verify')) }), '/verify/', 'kolaboro.com/verify') : '') +
    (c.sat ? fact(esc(tr(lang, 'sat_line', { d: fd(c.sat.date, lang), st: tr(lang, c.sat.status === 'visible change' ? 'sat_visible' : 'sat_none'), pct: c.sat.changed_pct })), '/satellite/', 'kolaboro.com/satellite') : '') + '</ul>';

  // public reports
  const FL = x.fl || [];
  const reports = '<p class="ki">' + esc(tr(lang, 'rep_intro')) + '</p><ul class="fl">' + (FL.map(f => fact(esc(tr(lang, 'rc_' + f[0])), f[1])).join('') || '<li>' + esc(tr(lang, 'no_reports')) + '</li>') + '</ul>';

  // developer
  const DF = [['developer_founded', 'df_founded'], ['developer_hq', 'df_hq'], ['developer_company', 'df_company'], ['developer_projects_delivered', 'df_delivered'], ['developer_units_delivered', 'df_units'], ['listed_or_audited', 'df_listed']];
  const others = devPage ? ix.devs.get(x.dvs).ids.filter(i => i !== x.id).slice(0, 12).map(i => ix.byId.get(i)) : [];
  const devN = devPage ? ix.devs.get(x.dvs).ids.length : 0;
  const devsec = x.dv ? '<ul class="fl">' + fact(esc(qa(lang, 'who_l', { n: name, dev: x.dv })) + (devN > 1 ? ' ' + esc(qa(lang, 'who_k', { dev: x.dv, k: num(devN, lang) })) : ''), page) + DF.filter(([k]) => fx[k] != null && cleanOk(String(fx[k]))).map(([k, l]) => fact('<b>' + esc(tr(lang, l)) + ':</b> ' + en(String(fx[k])), page)).join('') +
    (x.ev && x.ev.record && cleanOk(x.ev.record) ? fact(en(x.ev.record), page) : '') + (FX ? FX.active + FX.dom : '') + '</ul>' +
    (others.length ? '<h3>' + esc(tr(lang, 'dev_other', { dev: x.dv })) + '</h3><ul class="lk">' + others.map(o => '<li><a href="' + pre(lang) + '/projects/' + o.s + '/">' + esc(o.n) + '</a> <small>' + esc(mkName(o.mk, lang)) + '</small></li>').join('') + '</ul>' : '') +
    (devPage ? '<p><a class="more" href="' + devPage.replace(ORIGIN, '') + '">' + esc(tr(lang, 'dev_link', { dev: x.dv })) + '</a></p>' : '') : '<p>' + esc(tr(lang, 'dev_none')) + '</p>';

  // similar
  const SM = (ix.sim[x.id] || []).map(r => ix.byId.get(r[0])).filter(Boolean).slice(0, 5);
  const similar = SM.length ? '<ul class="lk">' + SM.map(o => '<li><a href="' + pre(lang) + '/projects/' + o.s + '/">' + esc(o.n) + '</a> <small>' + esc(mkName(o.mk, lang)) + ' · ' + esc(tr(lang, stageKey((ix.caseBy.get(o.id) || {}).stage))) + '</small></li>').join('') + '</ul>' : '';

  // market
  const ms = ix.mk.get(x.mk), dm = ix.dmk.get(x.mk);
  const market = '<ul class="fl">' + fact(esc(tr(lang, 'mk_line', { k: ms.k, mk: x.mk, pp: Math.round(ms.pn / ms.k * 100), pe: Math.round(ms.esc / ms.k * 100) })), '/m/' + slugM(x.mk) + '/', 'kolaboro.com/m/' + slugM(x.mk) + '/') +
    (dm && dm.past_first && dm.median_late != null ? fact(esc(tr(lang, 'mk_delay', { mk: x.mk, k: dm.past_first, m: dm.median_late })), '/index/delays/', 'kolaboro.com/index/delays') : '') + (FX ? FX.delay : '') + '</ul>' +
    '<p><a class="more" href="/m/' + slugM(x.mk) + '/">' + esc(tr(lang, 'mk_link', { mk: x.mk })) + '</a></p>' +
    ((ms.rv || 0) >= 8 && iso(ix.updated) ? '<p><a class="more" href="' + pre(lang) + '/stories/' + iso(ix.updated).slice(0, 7) + '/' + slugA(x.mk) + '/">' + esc(tr(lang, 'rel_story', { mk: x.mk, mo: fd(iso(ix.updated).slice(0, 7), lang) })) + '</a></p>' : '');

  // reviews (verified, moderated)
  // n27t (batch 27): the developer's right of reply next to each buyer report. A reply answers a report when its text starts with
  // "About buyer report #<ref>" (the developer reply form fills that line in when opened from the report's link); it is shown under
  // that report and not repeated in the general replies below. No new storage: the same approved replies as before.
  const DR0 = (extra.replies || []).filter(r => r && r.reply), repRx = /^\s*About buyer report #(\d+)\b[:.]?\s*/i, byRep = new Map();
  for (const r of DR0) { const mm = repRx.exec(String(r.reply)); if (mm && !byRep.has(mm[1])) byRep.set(mm[1], r); }
  const repReply = r => { const d = r.ref != null ? byRep.get(String(r.ref)) : null;
    return d ? '<div class="kreply kr-rep"><p><b>' + esc(tt27(lang, 'np_dr_h')) + '</b> <small>' + esc(fd(d.approved, lang)) + (d.official && d.domain ? ' &middot; ' + esc(tr(lang, 'dr_badge', { d: d.domain })) : '') + '</small></p><p class="kreply-t" lang="en">' + esc(String(d.reply).replace(repRx, '')) + '</p></div>'
      : '<p class="ki"><small>' + esc(tt27(lang, 'np_dr_none')) + ' <a href="/developers/reply/?id=' + encodeURIComponent(x.id) + (r.ref != null ? '&amp;report=' + encodeURIComponent(r.ref) : '') + '">' + esc(tt27(lang, 'np_dr_b')) + '</a></small></p>'; };
  const modL = '<p class="ki"><a href="' + pre(lang) + '/moderation/">' + esc(tt27(lang, 'np_mod')) + '</a></p>';   // item 35
  const reviews = (rv.approved_total ? '<p>' + esc(tr(lang, 'rev_some', { k: rv.approved_total })) + '</p><div class="ugc" data-ugc>' + (rv.reports || []).slice(0, 10).map(r => '<blockquote lang="en">' + esc(r.body || r.text || '') + '</blockquote>' + repReply(r)).join('') + '</div>' : '<p>' + esc(tr(lang, 'rev_none', { n: name })) + '</p>') +
    '<p class="ki">' + esc(tr(lang, 'rev_pending')) + '</p><p><a class="btn btn-line kbtn" href="/buyer-reports/?project=' + encodeURIComponent(x.id) + '">' + esc(tr(lang, 'rev_btn')) + '</a></p>' + modL;

  const shownRep = new Set((rv.approved_total ? (rv.reports || []).slice(0, 10) : []).map(r => r.ref != null && byRep.get(String(r.ref))).filter(Boolean));
  const DR = DR0.filter(r => !shownRep.has(r));
  const drHtml = DR.length ? '<div class="ugc" data-replies>' + DR.slice(0, 10).map(r => {
    const badge = r.official && r.domain ? '<span class="kpill c-verified kvbadge">' + esc(tr(lang, 'dr_badge', { d: r.domain })) + '</span>' : '<span class="kpill">' + esc(tr(lang, 'dr_badge_plain')) + '</span>';
    const docs = (r.docs || []).length ? '<small>' + esc(tr(lang, 'dr_docs')) + ': ' + r.docs.slice(0, 12).map(k => esc(k.kind) + ' <code>' + esc(String(k.sha256).slice(0, 16)) + '...</code>').join(', ') + '</small><br>' : '';
    return '<blockquote lang="en" class="kreply"><p>' + badge + ' <small>' + esc(tr(lang, 'dr_meta', { t: r.topic || '', a: fd(r.approved, lang), how: r.method === 'meta' ? tr(lang, 'dr_how_meta') : tr(lang, 'dr_how_dns') })) + (r.company ? ' &middot; ' + esc(r.company) : '') + '</small></p><p class="kreply-t">' + esc(r.reply) + '</p>' + docs + (r.note ? '<small><b>Kolaboro:</b> ' + esc(r.note) + '</small>' : '') + '</blockquote>';
  }).join('') + '</div>' : '';
  const reply = (drHtml ? '<h3>' + esc(tr(lang, 'dr_h', { k: DR.length })) + '</h3><p class="ki">' + esc(tr(lang, 'dr_intro')) + '</p>' + drHtml : '') + '<p>' + esc(tr(lang, 'reply_txt')) + '</p><p class="bts"><a class="btn btn-line kbtn" href="/developers/reply/?id=' + encodeURIComponent(x.id) + '">' + esc(tr(lang, 'reply_btn')) + '</a> <a class="btn btn-line kbtn" href="/corrections/?id=' + encodeURIComponent(x.id) + '">' + esc(tr(lang, 'corr_btn')) + '</a> <a class="btn btn-line kbtn" href="/ask-developer/?id=' + encodeURIComponent(x.id) + '">' + esc(tr(lang, 'ask_btn')) + '</a></p>';
  const cta = checklistHtml(lang, { id: x.id, co: coName(x.co, lang) || x.co, regs: FX ? FX.regs : [], cost: !!FX, costLbl: FX ? FX.h.tocCost : '' }) + '<p>' + esc(tr(lang, 'cta_txt')) + '</p><p class="bts"><a class="btn btn-hi kbtn" href="/check/?url=' + encodeURIComponent(page || '') + '" data-ev="seo_check">' + esc(tr(lang, 'cta_free')) + '</a> <a class="btn btn-line kbtn" href="/book/" data-ev="seo_book">' + esc(tr(lang, 'cta_paid')) + '</a></p>';

  // n24s: "Where is it?": area as published, how precise the pin is, what is around, the market and its transparency ranking
  const aRow = extra.around && extra.around.ar && extra.around.ar.projects && extra.around.ar.projects[x.id], hasPin = typeof fx.lat === 'number' && typeof fx.lng === 'number';
  const pinLine = hasPin ? (aRow && aRow.acc ? qa(lang, 'wh_pin_a', { a: num(aRow.acc, lang) }) : qa(lang, 'wh_pin')) : qa(lang, 'wh_nopin');
  const whereLinks = [hasPin ? '<a href="https://www.openstreetmap.org/?mlat=' + fx.lat.toFixed(5) + '&amp;mlon=' + fx.lng.toFixed(5) + '#map=16/' + fx.lat.toFixed(5) + '/' + fx.lng.toFixed(5) + '" rel="nofollow noopener" target="_blank">' + esc(qa(lang, 'wh_map')) + '</a>' : '',
    aRow && extra.around ? '<a href="#around">' + esc(qa(lang, 'wh_around')) + '</a>' : '', '<a href="/m/' + slugM(x.mk) + '/">' + esc(qa(lang, 'wh_mk', { mk: mkName(x.mk, lang) })) + '</a>',
    rk ? '<a href="' + pre(lang) + '/rankings/transparency/' + rk.s + '/">' + esc(qa(lang, 'wh_rank', { p: rk.p })) + '</a>' : ''].filter(Boolean);
  const whereSec = '<ul class="fl">' + fact(esc(qa(lang, 'wh_place', { place })), page) + fact(esc(pinLine), page) + '</ul><ul class="lk">' + whereLinks.map(a => '<li>' + a + '</li>').join('') + '</ul>';
  // n24s: "Is it legit? What we could check": the eleven published / not published items of the transparency score, each with its
  // source (kbx_tr.js ledger), the count, the method; never a verdict. Shown for every project, reviewed or not.
  const legitSec = tp ? '<style>' + QA_CSS + '</style><p class="ki">' + bdq(qa(lang, 'lg_intro', { n: name })) + '</p><p class="kqa-sum">' + esc(qa(lang, 'lg_sum', { a: num(tp.items.filter(i => i.st === 'yes').length, lang), b: num(tp.items.filter(i => i.st !== 'nc').length, lang) })) + '</p>' +
    (rvd ? '' : '<p class="knote">' + esc(qa(lang, 'lg_nr')) + '</p>') + tp.ledger + '<p><a class="more" href="' + tp.method + '">' + esc(qa(lang, 'lg_m')) + '</a></p>' : '';

  // FAQ built from the data above
  const factsTxt = [rvd ? '' : nrB + '.', x.pn ? tr(lang, 'g_pn') : tr(lang, 'g_pn_none'), cN && rvd ? tr(lang, 'g_claims', { c: cN, v: cl.verified, u: cl.unverified, x: cl.contradicted }) : '', ho ? tr(lang, 'g_h', { h: fd(ho.d, lang) }) : tr(lang, 'g_h_none'),
    ovN ? tr(lang, 'g_over2', { m: ovN }) : '', FL.length ? FL.map(f => tr(lang, 'rc_' + f[0])).join('; ') + '.' : tr(lang, 'no_reports')].filter(Boolean).join(' ');
  // n24s: the checklist count and the transparency score join the "is it legit" answer (facts, no verdict)
  const tpYes = tp ? tp.items.filter(i => i.st === 'yes').length : 0, tpAll = tp ? tp.items.filter(i => i.st !== 'nc').length : 0;
  const trLine = tp ? (rk ? qa(lang, 'qa_tr', { s: tpS, r: num(rk.r, lang), m: num(rk.m, lang), p: rk.p }) : qa(lang, 'qa_tr1', { s: tpS })) : '';
  const factsTx2 = factsTxt + (tp ? ' ' + qa(lang, 'lg_sum', { a: num(tpYes, lang), b: num(tpAll, lang) }) + ' ' + trLine : '');
  const FAQ = [[tr(lang, 'q_legit', { n: name }), tr(lang, 'a_legit', { facts: factsTx2 })],
    [qa(lang, 'h_when', { n: name }), ho ? tr(lang, 'a_deliv', { h: fd(ho.d, lang) }) + (hand && hand.mv ? ' ' + tr(lang, 'g_moved', { k: hand.mv, mm: hand.mm }) : '') + (ovN ? ' ' + tr(lang, 'g_over2', { m: ovN }) : '') : tr(lang, 'a_deliv_none')],
    [qa(lang, 'h_who', { n: name }), x.dv ? tr(lang, 'a_dev', { dev: x.dv }) + (devN > 1 ? ' ' + qa(lang, 'who_k', { dev: x.dv, k: num(devN, lang) }) : '') : tr(lang, 'a_dev_none')],
    [tr(lang, 'q_permit', { n: name }), vf.permit === 'registry' ? tr(lang, 'a_permit_reg') : x.pn ? tr(lang, 'a_permit_pn', { pn: x.pn }) : tr(lang, 'a_permit_none')],
    [tr(lang, 'q_rev2', { n: name }), rv.approved_total ? tr(lang, 'rev_some', { k: rv.approved_total }) : tr(lang, 'a_rev')]];
  // s15a: more of the questions people search, each answered only from the facts on this page
  FAQ.splice(1, 0, [qa(lang, 'h_where', { n: name }), tr(lang, 'a_where', { n: name, place }) + ' ' + pinLine]);
  FAQ.splice(3, 0, [tr(lang, 'q_delay', { n: name }), ovN ? tr(lang, 'g_over', { m: ovN }) + (ho ? ' ' + tr(lang, 'a_delay_latest', { h: fd(ho.d, lang) }) : '')
    : hand && hand.mv ? tr(lang, 'g_moved', { k: hand.mv, mm: hand.mm }) + ' ' + tr(lang, 'a_delay_latest', { h: fd(hand.d, lang) })
    : hand && hand.st === 'pending' ? tr(lang, 'a_delay_ahead', { h: fd(hand.d, lang) }) : hand ? tr(lang, 'a_delay_rec', { h: fd(hand.d, lang), st: tr(lang, 'ps_' + hand.st) }) : ho ? tr(lang, 'g_h', { h: fd(ho.d, lang) }) : tr(lang, 'a_deliv_none')]);
  // n24s: the price question is always answered ("not published" when no price), the payment plan when one is published
  FAQ.push([qa(lang, 'h_cost', { n: name }), fx.price_min && cleanOk(String(fx.price_min)) ? tr(lang, 'a_price', { p: cur + num(fx.price_min, lang), to: fx.price_max ? tr(lang, 'a_price_to', { p2: cur + num(fx.price_max, lang) }) : '' }) : qa(lang, 'a_price0')]);
  if (fx.payment_plan && cleanOk(String(fx.payment_plan))) FAQ.push([qa(lang, 'q_plan', { n: name }), qa(lang, 'a_plan', { p: String(fx.payment_plan) }), [String(fx.payment_plan)]]);
  if (tp) FAQ.push([qa(lang, 'q_tr', { n: name }), trLine + ' ' + qa(lang, 'a_tr_x')]);
  if (fx.foreign_ownership && cleanOk(String(fx.foreign_ownership))) FAQ.push([tr(lang, 'q_own', { n: name }), tr(lang, 'a_own', { o: String(fx.foreign_ownership) }), [String(fx.foreign_ownership)]]);
  const hN = (c.history || []).length;
  FAQ.push([tr(lang, 'q_change', { n: name }), [tr(lang, 'a_change', { d: fd(checked, lang) }), FX ? FX.chSum : '', ph && ph.n > 1 ? tr(lang, 'ph_line', { n: ph.n, a: fd(ph.first, lang), b: fd(ph.last, lang), c: ph.changed }) : '', hN ? tr(lang, 'a_change_k', { k: hN }) : (ph && ph.changed) || (FX && FX.chN) ? '' : tr(lang, 'a_change_none')].filter(Boolean).join(' ')]);
  for (const f of FAQ) f[1] = dot(f[1]);
  // n25t: a source's own wording quoted inside a translated answer (payment plan, ownership terms) is marked lang="en"
  const qmark = (h, Q) => lang === 'en' || !Q ? h : Q.reduce((t, w) => { const e = esc(String(w).replace(/[.\s]+$/, '')); return e.length > 3 ? t.split(e).join('<span lang="en" dir="ltr">' + e + '</span>') : t; }, h);
  const faq = FAQ.map(([q, a, Q]) => '<details class="kfaq"><summary>' + esc(q) + '</summary><p>' + qmark(esc(a), Q) + '</p></details>').join('');

  // sources
  const S = [...new Set([page, x.du, ...(x.src || []), ...CL.map(r => r[3]), ...FL.map(f => f[1])].filter(okHttp))];
  const sources = '<p class="ki">' + esc(tr(lang, 'src_intro')) + '</p><ol class="srcs">' + S.map(srcLi).join('') + '</ol>' +
    (okHttp(page) ? '<p><a href="https://web.archive.org/web/*/' + esc(fixU(page)) + '" rel="nofollow noopener" target="_blank">' + esc(tr(lang, 'src_archive')) + '</a></p>' : '') + dlLine(lang, x.s);

  // s15a: short answer at the top (what people search: legit, delivery date, permit, developer, reviews), built from the facts below
  // n24s (batch 24): the quick answer, 40 to 60 words, only from fields we hold: what it is, developer, place, handover date as
  // published (and its moves), permit published yes or no, transparency score and rank in its place, our review status, last checked.
  // Parts are dropped in a fixed order when the English text runs over 60 words, so every language carries the same facts.
  const aS = qaSentences(ix, x, lang, tp, { rvN, checked });
  const fresh = '<span><time datetime="' + esc(checked) + '">' + esc(tr(lang, 'upd_checked', { d: fd(checked, lang) })) + '</time></span>' +
    (ph && ph.n > 1 ? '<span>' + esc(tr(lang, 'upd_ver', { n: ph.n, a: fd(ph.first, lang), c: ph.changed })) + '</span>' : '') + (ph && ph.n ? '<span><a href="' + chg + '">' + esc(tr(lang, 'upd_log')) + '</a></span>' : '') +
    '<span><a href="#glance">' + esc(tr(lang, 'ans_more')) + '</a></span>' +
    '<span><a class="kbought" href="/buyer-reports/?project=' + encodeURIComponent(x.id) + '" data-ev="seo_bought">' + esc(tt27(lang, 'np_bought')) + '</a></span>';   // n27t: item 22
  // n27g (batch 27): the overdue handover in a dated notice above the short answer, with its source and the place's overdue report;
  // "Updated <date>" under the title (the date of the last real data change, replaced after seoLd, see updLine)
  const ovP = ov ? overdueByMarket(ix).get(x.mk) || 0 : 0, today = new Date().toISOString().slice(0, 10);
  const ovHtml = ov ? '<div class="kovd" id="overdue" role="note"><p><b>' + esc(qa(lang, 'ov_h')) + '</b> ' + bidi(lang, esc(qa(lang, 'ov_t', { h: fd(ov.d, lang), mm: months(lang, ov.m, lang === 'de' ? 'dat' : 'nom', nfL), d: fd(today, lang) })) +
    (stageKey(ov.st) !== 'st_unknown' ? ' ' + esc(qa(lang, 'ov_st', { c: fd(checked, lang), st: tr(lang, stageKey(ov.st)) })) : ''), [name]) + srcA(page) + ' <a class="kovd-l" href="' + pre(lang) + '/handover/overdue/' + (ovP >= OV_MIN ? slugA(x.mk) + '/' : '') + '">' +
    esc(ovP >= OV_MIN ? qa(lang, 'ov_more', { p: mkName(x.mk, lang) }) : qa(lang, 'ov_all')) + '</a></p></div>' : '';
  const updHtml = '<p class="kupd"><time datetime="' + esc(checked) + '">' + esc(qa(lang, 'upd_on', { d: fd(checked, lang) })) + '</time></p>';
  const answer = ovHtml + '<div class="kans" id="answer"><p class="kans-t"><b class="kans-l">' + esc(tr(lang, 'ans_lbl')) + '</b> ' + bidi(lang, esc(dot(aS.join(' '))), [name, place, x.dv || '']) + '</p><p class="kans-u">' + fresh + '</p></div>';

  // s15a: related pages (same developer, same area, similar, side-by-side, market and country hubs)
  // n24s: six related projects for every page (thin "not yet reviewed" pages included): same developer, same market, same handover
  // year, two of each where they exist, then filled from the same pools. The starting point rotates by project id, so the links spread.
  const R6 = rel6(ix, x, ho), r6set = new Set(R6.map(r => r[0].id));
  const rel6H = R6.length ? '<h3>' + esc(qa(lang, 'r6_h')) + '</h3><ul class="lk k6">' + R6.map(([o, why]) => '<li><a href="' + pre(lang) + '/projects/' + o.s + '/">' + esc(o.n) + '</a> <small>' + esc(why === 'dev' ? qa(lang, 'r6_dev') : why === 'mk' ? qa(lang, 'r6_mk', { mk: mkName(o.mk, lang) }) : qa(lang, 'r6_y', { y: why.slice(2) })) + '</small></li>').join('') + '</ul>' : '';
  const AR = x.ar && x.ar !== x.mk ? (ix.byAr.get(x.mk + '|' + x.ar) || []).filter(o => o.id !== x.id && !r6set.has(o.id)).slice(0, 8) : [];
  const relL = [];
  if (devPage && others.length) relL.push('<li><a href="' + devPage.replace(ORIGIN, '') + '">' + esc(tr(lang, 'rel_dev', { dev: x.dv })) + '</a> <small>' + (others.length + 1) + '</small></li>');
  if (SM.length) relL.push('<li><a href="/compare/?ids=' + [x.id, ...SM.slice(0, 3).map(o => o.id)].map(encodeURIComponent).join(',') + '" rel="nofollow">' + esc(tr(lang, 'rel_cmp', { n: name })) + '</a></li>');
  relL.push('<li><a href="/vs/#' + slugA(x.mk) + '">' + esc(tr(lang, 'rel_vs', { mk: x.mk })) + '</a></li>');
  // s15c: embeddable fact card, (the market's monthly data story is linked from the market section: 8+ reviewed named projects, same rule as kbx_cite.js)
  relL.push('<li><a href="/embed/p/' + x.s + '/">' + esc(tr(lang, 'rel_embed')) + '</a></li>');
  if (x.co) relL.push('<li><a href="/countries/' + slugA(CO_HUB[x.co] || x.co) + '/">' + esc(tr(lang, 'rel_country', { co: coName(x.co, lang) })) + '</a></li>');
  const related = rel6H + (AR.length ? '<h3>' + esc(tr(lang, 'rel_area', { ar: x.ar })) + '</h3><ul class="lk">' + AR.map(o => '<li><a href="' + pre(lang) + '/projects/' + o.s + '/">' + esc(o.n) + '</a>' + (o.dv ? ' <small>' + esc(o.dv) + '</small>' : '') + '</li>').join('') + '</ul>' : '') +
    '<ul class="lk">' + relL.join('') + '</ul>';

  // n24s: breadcrumbs country > place > developer > project (the country hub and market pages exist for every tracked country and market)
  const crumbs = [[tr(lang, 'crumb_home'), ORIGIN + pre(lang) + '/'], ...(x.co && x.co !== x.mk ? [[coName(x.co, lang), ORIGIN + '/countries/' + slugA(CO_HUB[x.co] || x.co) + '/']] : []), [mkName(x.mk, lang), ORIGIN + '/m/' + slugM(x.mk) + '/'], ...(devPage ? [[x.dv, devPage]] : []), [name, canon]];
  const moneyH = extra.money ? moneyHtml(extra.money, x, lang) : '';   // n19b
  const landH = extra.land ? landHtml(extra.land, x, lang, d => fd(d, lang)) : '', histH = extra.land ? histHtml(extra.land, x, lang, d => fd(d, lang)) : '';   // n19c
  const aroundH = extra.around ? aroundHtml(extra.around, x, lang, d => fd(d, lang)) : '', climateH = extra.around ? climateHtml(extra.around, x, lang, d => fd(d, lang)) : '';   // n21b
  const priceH = extra.paper ? pricesHtml(extra.paper, x, lang) : '', planH = extra.paper ? planningHtml(extra.paper, x, lang) : '';   // n18d
  const toc = [['glance', 's_glance'], ...(FX ? [['changed', null, FX.h.tocChanged]] : []), ...(legitSec ? [['legit', null, qa(lang, 'toc_legit')]] : []), ['promise', 's_promise'], ...(FX ? [['buycost', null, FX.h.tocCost]] : []), ...(priceH ? [['prices', null, paperHeading(lang, 'ph_toc')]] : []), ...(moneyH ? [['money', null, moneyToc(lang)]] : []), ['ppm', 's_ppm_toc'], ['delivery', 's_delivery'], ...(satHtml ? [['space', null]] : []), ...(seeSec ? [['ground', null, seeToc(lang)]] : []), ...(histH ? [['maphist', null, histToc(lang)]] : []), ['permits', 's_permits'], ...(planH ? [['planning', null, paperHeading(lang, 'pl_toc')]] : []), ...(landH ? [['land', null, landToc(lang)]] : []), ['where', null, qa(lang, 'toc_where')], ...(aroundH ? [['around', null, aroundToc(lang)]] : []), ...(climateH ? [['climate', null, climateToc(lang)]] : []), ['checks', 's_checks'], ['claims', 's_claims'], ['history', 's_history'], ['reports', 's_reports'], ['developer', 's_devsec'], ...(webHtml ? [['web', null, webHeading(lang, 'h')]] : []), ...(FX ? [['alternatives', null, FX.h.tocAlt]] : []), ['reviews', 's_reviews'], ['reply', 's_reply'], ['next', null, t26(lang, 'nx_h')], ['faq', 's_faq'], ['sources', 's_sources']];
  // n27u: the six-check light under the quick answer (data-u27 carries the price and currency for the currency selector and calculator)
  const light = lightHtml(lang, { tp, c, pn: x.pn, ho, ev: x.ev, ids: toc.map(t => t[0]), data: Object.assign({ id: x.id }, fx.price_min > 0 && fx.currency ? { p: +fx.price_min, p2: fx.price_max > fx.price_min ? +fx.price_max : undefined, c: String(fx.currency).toUpperCase() } : {}) });
  const body = '<section class="phero kp"><div class="wrap"><p class="crumb">' + crumbs.slice(0, -1).map(([l, u]) => '<a href="' + esc(u.replace(ORIGIN, '')) + '">' + esc(l) + '</a>').join(' / ') + '</p>' +
    '<h1>' + h1x(tr(lang, 'h1_p', { n: name }), name) + '</h1>' + updHtml + '<p class="lead">' + bidi(lang, esc(tr(lang, 'lead_p', { n: name, place })), [name, place]) + '</p>' + answer + light + '<details class="kz-kf"><summary>' + esc(t27(lang, 'kf_h')) + '</summary>' + keys + '</details>' + (extra.trb || '') + watchBox(lang, x.id, name, '/projects/' + x.s + '/', { score: c.score || 0, vscore: c.vscore || 0, stage: c.stage || null, overdue: c.overdue || 0, claims: { verified: cl.verified || 0, unverified: cl.unverified || 0, contradicted: cl.contradicted || 0 }, flags: (c.flags || []).length, history: (c.history || []).length }) + (extra.coh || '') + '</div></section>' +
    '<div class="wrap kwrap"><nav class="ktoc" aria-label="' + esc(tr(lang, 's_glance')) + '">' + toc.map(([i, k, lbl]) => '<a href="#' + i + '">' + esc(lbl || (k ? tr(lang, k) : satToc(lang))) + '</a>').join('') + '</nav>' +
    sec('glance', esc(tr(lang, 's_glance')), '<ul class="fl glance">' + bidi(lang, g.join(''), [name, place, x.dv || '']) + '</ul>') + (FX ? sec('changed', esc(FX.h.changed), FX.changed) : '') + (legitSec ? sec('legit', bdq(qa(lang, 'h_legit', { n: name })), legitSec) : '') + sec('promise', bdq(qa(lang, 'h_cost', { n: name })), bidi(lang, promised, [name])) + (FX ? sec('buycost', bdq(FX.h.cost), FX.cost) : '') + (priceH ? sec('prices', esc(paperHeading(lang, 'ph_h')), '<style>' + PAPER_CSS + '</style>' + priceH) : '') + (moneyH ? sec('money', esc(moneyHeading(lang)), moneyH) : '') + sec('ppm', esc(tr(lang, 's_ppm')), ppmSection(x, lang).html) + sec('delivery', bdq(qa(lang, 'h_when', { n: name })), delivery) + (satHtml ? sec('space', esc(satHeading(lang)), satHtml) : '') + (seeSec ? sec('ground', esc(seeHeading(lang)), seeSec) : '') + (histH ? sec('maphist', esc(histHeading(lang)), histH) : '') +
    sec('permits', esc(tr(lang, 's_permits')), permits) + (planH ? sec('planning', esc(paperHeading(lang, 'pl_h')), (priceH ? '' : '<style>' + PAPER_CSS + '</style>') + planH) : '') + (landH ? sec('land', esc(landHeading(lang)), landH) : '') + sec('where', bdq(qa(lang, 'h_where', { n: name })), bidi(lang, whereSec, [name, place, x.mk])) + (aroundH ? sec('around', esc(aroundHeading(lang)), aroundH) : '') + (climateH ? sec('climate', esc(climateHeading(lang)), climateH) : '') + sec('checks', esc(tr(lang, 's_checks')), checks) + sec('claims', esc(tr(lang, 's_claims')), claims) + sec('history', esc(tr(lang, 's_history')), history) +
    sec('reports', esc(tr(lang, 's_reports')), reports) + sec('developer', bdq(qa(lang, 'h_who', { n: name })), bidi(lang, devsec, [name, x.dv || ''])) + (webHtml ? sec('web', esc(webHeading(lang, 'h')), webHtml) : '') + (FX ? sec('alternatives', bdq(FX.h.alt), FX.alt) : '') + (similar ? sec('similar', esc(tr(lang, 's_similar')), similar) : '') +
    sec('market', esc(tr(lang, 's_market', { mk: x.mk })), market) + sec('related', esc(tr(lang, 'rel_h')), related) + sec('reviews', esc(tr(lang, 's_reviews')), reviews) + sec('reply', esc(tr(lang, 's_reply')), reply) +
    sec('cta', esc(tr(lang, 's_cta')), cta) + nextStep(lang, x, name, (SM.length ? SM : ix.P.filter(o => o.mk === x.mk && o !== x)).slice(0, 2).map(o => o.s)) + sec('faq', esc(tr(lang, 's_faq')), faq) + sec('sources', esc(tr(lang, 's_sources')), sources) +
    '<p class="ki kfoot">' + tr(lang, 'foot', { d: esc(fd(checked, lang)), link: own('/data-policy/', tr(lang, 'm_data_policy')) }) + '</p></div>';

  const imgs = projImages(x, lang, canon, extra.sat);
  // n24s: name variants for alternateName: the name as published (before research notes were removed), with the market, with the developer
  const alt = [...new Set([RAWN.get(x), /\(/.test(name) ? name.replace(/\s*\([^)]*\)/g, '').trim() : null, name.toLowerCase().includes(String(x.mk).toLowerCase()) ? null : name + ' ' + x.mk, x.dv && !name.toLowerCase().includes(String(x.dv).toLowerCase()) ? name + ' by ' + x.dv : null].filter(v => v && v !== name))];
  const placeType = /villa|house|home/i.test(name + ' ' + ((fx.unit_types || []).join(' '))) && !/apartment|tower|condo|residences/i.test(name) ? 'Residence' : 'ApartmentComplex';
  const geo = typeof fx.lat === 'number' && typeof fx.lng === 'number' ? { '@type': 'GeoCoordinates', latitude: fx.lat, longitude: fx.lng } : undefined;
  const orgId = (devPage ? dUrl('en', x.dvs) : canon) + '#org';
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': canon + '#page', url: canon, name: title.replace(/ \| Kolaboro$/, ''), description: desc, inLanguage: lang, dateModified: checked, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' },
      publisher: { '@id': ORIGIN + '/#org' }, primaryImageOfPage: { '@id': canon + '#og' }, speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#answer .kans-t'] }, about: [{ '@id': canon + '#place' }].concat(x.dv ? [{ '@id': orgId }] : []), breadcrumb: { '@id': canon + '#bc' }, mainEntity: { '@id': canon + '#faq' } },
    { '@type': 'Organization', '@id': ORIGIN + '/#org', name: 'Kolaboro', url: ORIGIN + '/', logo: ORIGIN + '/k/favicon.svg' },
    ...imgs.map(i => Object.assign({ '@type': 'ImageObject' }, i)),
    Object.assign({ '@type': placeType, '@id': canon + '#place', name }, alt.length ? { alternateName: alt } : {}, { image: imgs.map(i => ({ '@id': i['@id'] })), address: { '@type': 'PostalAddress', addressLocality: x.ar || x.mk, addressRegion: x.mk, addressCountry: COUNTRY_ISO[x.co] || CO_ISO2[x.co] || x.co } }, geo ? { geo } : {}),
    ...(x.dv ? [Object.assign({ '@type': 'Organization', '@id': orgId, name: x.dv }, devPage ? { url: dUrl('en', x.dvs) } : {})] : []),
    { '@type': 'Dataset', '@id': canon + '#data', name: tr(lang, 'ds_name', { n: name }), description: tr(lang, rvd ? 'ds_rv' : 'ds_nr', { n: name, place, id: x.id }),   // n25t: in the page language
      url: canon, identifier: x.id, license: 'https://creativecommons.org/licenses/by/4.0/', isAccessibleForFree: true, creator: { '@id': ORIGIN + '/#org' }, dateModified: checked, spatialCoverage: { '@id': canon + '#place' },
      distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + rec }, { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/api/v1/projects/' + x.s }, { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: ORIGIN + '/api/v1/projects/' + x.s + '.csv' }] },
    { '@type': 'BreadcrumbList', '@id': canon + '#bc', itemListElement: crumbs.map(([l, u], i) => ({ '@type': 'ListItem', position: i + 1, name: l, item: u })) },
    { '@type': 'FAQPage', '@id': canon + '#faq', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] };
  return { title, desc, canon, body: leadify(body, leadMap(ix, x, lang, tp, checked, { esc, fd, host, okHttp, fixU, handoverOf, reviewed })), ld, lastmod: checked, alt: l => pUrl(l, x.s), feed: { path: '/projects/' + x.s + '/', name }, images: imgs, upd: { html: updHtml, lang } };
}

// ------------------------------------------------------------------------------------------------ developer page
const SUFFIX = new Set('llc l c ltd limited inc incorporated pjsc pjs psc p j s sa slu sl plc bhd berhad sdn co company corp corporation pt tbk jsc gmbh ag bv nv srl spa sas sarl doo as ab oy kft zrt fz fze fzco fzllc soc sole proprietorship pvt pte private public sae sab de cv sapi ooo sociedad anonima'.split(' '));
const normN = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9Ѐ-ӿ؀-ۿ一-鿿]+/g, ' ').trim();
const core = s => normN(s).split(' ').filter(w => w && !SUFFIX.has(w)).join(' ');
async function gleif(name, ctx) {
  const key = new Request(ORIGIN + '/__named_gleif/v2/' + encodeURIComponent(normN(name)));   // v2 (n26s): + legal entity creation date
  try { const hit = await caches.default.match(key); if (hit) return await hit.json(); } catch (e) {}
  let res;
  try {
    const r = await fetch('https://api.gleif.org/api/v1/lei-records?filter%5Bfulltext%5D=' + encodeURIComponent(name) + '&page%5Bsize%5D=20', { headers: { accept: 'application/vnd.api+json', 'user-agent': 'KolaboroRegisterCheck/1.0 (+https://kolaboro.com/registers/)' }, signal: AbortSignal.timeout(5000) });
    if (!r.ok) throw new Error('gleif ' + r.status);
    const d = await r.json(), want = core(name);
    const m = (d.data || []).filter(e => { const ent = ((e.attributes || {}).entity) || {}; return want.length >= 3 && ent.legalName && core(ent.legalName.name) === want; }).slice(0, 3)
      .map(e => { const a = e.attributes, ent = a.entity; return { lei: e.id, legal: ent.legalName.name, jur: ent.jurisdiction, st: ent.status, ls: a.registration.status, reg: (a.registration.initialRegistrationDate || '').slice(0, 10), cr: (ent.creationDate || '').slice(0, 10), country: (ent.legalAddress || {}).country }; });
    res = { ok: true, at: new Date().toISOString().slice(0, 10), matches: m };
  } catch (e) { res = { ok: false, at: new Date().toISOString().slice(0, 10), matches: [] }; }
  try { const p = caches.default.put(key, new Response(JSON.stringify(res), { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=' + (res.ok ? 604800 : 1800) } })); if (ctx && ctx.waitUntil) ctx.waitUntil(p.catch(() => {})); } catch (e) {}
  return res;
}
function devPage(ix, dv, lang, extra) {
  const L = dv.ids.map(i => ix.byId.get(i)).filter(Boolean), name = dv.n, canon = dUrl(lang, dv.s);
  const mks = [...new Set(L.map(x => x.mk))], lm = L.map(x => lastmod(ix, x)).sort(), checked = lm[lm.length - 1];
  const pn = L.filter(x => x.pn).length, P = L.flatMap(x => ix.prom[x.id] || []);
  const cnt = st => P.filter(p => p.st === st).length, moved = P.filter(p => p.mv).length;
  // n25t: developer titles were 70 to 95 characters; the longest form that fits 60 (searched words first, brand last)
  // n27g (batch 27): the searched word and the year first ("<developer> reviews 2026: projects, permits, delivery record")
  const yD = new Date().getUTCFullYear(), tdy = k => qa(lang, k, { dev: name, y: yD });
  const title = [tdy('td_y') + ' | Kolaboro', tdy('td_y'), tdy('td_y2') + ' | Kolaboro', tdy('td_y2'), qa(lang, 'b_y', { n: name, y: yD }) + ' | Kolaboro', tr(lang, 'title_d', { dev: name }), tr(lang, 'title_d2', { dev: name }) + ' | Kolaboro', tr(lang, 'title_d2', { dev: name }), qa(lang, 'b', { n: name }) + ' | Kolaboro', qa(lang, 'b', { n: name })].find(t => [...t].length <= 60) || ((b, a) => a.length <= 60 ? b : a.slice(0, 60).join('').replace(/\s+\S*$/, ''))(qa(lang, 'b', { n: name }), [...qa(lang, 'b', { n: name })]);   // n27g: a 60+ character name is cut at a word
  // n25t: markets in the page language; the description stays within 155 characters (fewer markets named, then whole sentences)
  const dsc = n => dot(tr(lang, 'desc_d2', { dev: name, k: L.length, mks: mks.slice(0, n).map(m => mkName(m, lang)).join(', ') + (mks.length > n ? ' +' + (mks.length - n) : ''), pn, p: P.length, mv: moved, d: fd(checked, lang) }));
  let desc = dsc(mks.length); for (const n of [3, 2, 1]) if ([...desc].length > 155 && mks.length > n) desc = dsc(n);
  if ([...desc].length > 155) { const cut = [...desc].slice(0, 155).join(''), k = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('。')); desc = k > 60 ? cut.slice(0, k + 1) : cut.replace(/\s+\S*$/, '') + '.'; }
  const first = L[0], fx = Object.assign({}, ...L.map(x => x.fx || {}).reverse());
  const FD = extra.fac ? devFacets(extra.fac, ix, dv, lang) : null;   // n26s: promised vs actual, active projects, domain ages
  const g = [fact(esc(tr(lang, 'g_d', { k: L.length, dev: name, mks: mks.map(m => mkName(m, lang)).join(', ') })), first.url), fact(esc(tr(lang, 'g_d_pn', { pn, k: L.length })), first.du || first.url)];
  if (P.length) g.push(fact(esc(tr(lang, 'g_d_rec', { p: P.length, kept: cnt('kept'), broken: cnt('broken'), moved: cnt('moved'), pending: cnt('pending') })), '/promises/', tr(lang, 'm_promises')));
  if (FD) g.push(fact(FD.active, '/data/on-time.json', 'kolaboro.com/data/on-time.json'));
  const rows = L.map(x => { const c = ix.caseBy.get(x.id), h = handoverOf(ix, x); return '<tr><td><a href="' + pre(lang) + '/projects/' + x.s + '/">' + esc(x.n) + '</a></td><td>' + esc(mkName(x.mk, lang)) + '</td><td>' + esc(tr(lang, stageKey(c.stage))) + '</td><td>' + esc(h ? fd(h.d, lang) : '-') + ((o => o ? ' <span class="kpill p-broken">+' + o.m + '</span>' : '')(overdueOf(ix, x))) + '</td><td>' + esc(x.pn ? tr(lang, 'v_pub') : tr(lang, 'v_notpub')) + '</td><td>' + (reviewed(c) ? c.score + '/' + c.max : esc(tr(lang, 'nr_short'))) + '</td></tr>'; }).join('');
  const projects = '<div class="tw"><table><thead><tr><th>' + ['th_project', 'th_market', 'th_stage', 'th_hand', 'th_permit', 'th_checks'].map(k => esc(tr(lang, k))).join('</th><th>') + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  const recLi = L.flatMap(x => (ix.prom[x.id] || []).filter(p => p.k === 'handover' || p.st === 'broken' || p.mv).slice(0, 3).map(p => fact('<a href="' + pre(lang) + '/projects/' + x.s + '/#delivery">' + esc(x.n) + '</a>: ' + esc(tr(lang, 'pk_' + p.k)) + ' ' + esc(fd(p.d, lang)) + ' <span class="kpill p-' + esc(p.st) + '">' + esc(tr(lang, 'ps_' + p.st)) + '</span>' + (p.mv ? ' · ' + esc(tr(lang, 'pr_moved', { k: p.mv, mm: p.mm })) : ''), x.url))).slice(0, 30).join('');
  const record = '<p class="ki">' + tr(lang, 'del_intro', { link: own('/promises/', tr(lang, 'm_promises')) }) + '</p><ul class="fl">' + (recLi || '<li>' + esc(tr(lang, 'drec_none')) + '</li>') + '</ul>';
  const DF = [['developer_founded', 'df_founded'], ['developer_hq', 'df_hq'], ['developer_company', 'df_company'], ['developer_projects_delivered', 'df_delivered'], ['developer_units_delivered', 'df_units'], ['listed_or_audited', 'df_listed']];
  const dsrc = k => (L.find(x => (x.fx || {})[k] != null) || first);
  const dfacts = DF.filter(([k]) => fx[k] != null && cleanOk(String(fx[k]))).map(([k, l]) => fact('<b>' + esc(tr(lang, l)) + ':</b> ' + en(String(fx[k])) + ' <small>(' + esc(tr(lang, 'dfacts_src', { n: dsrc(k).n })) + ')</small>', dsrc(k).url)).join('');
  const gl0 = extra.gleif || { ok: false, matches: [] };
  const gl = extra.fm && !gl0.matches.some(m => m.lei === extra.fm.m.lei) ? { ok: true, at: gl0.at, matches: [extra.fm.m].concat(gl0.matches) } : gl0;   // n19e: weekly exact name + country match
  const reg = '<ul class="fl">' + (gl.matches.length ? gl.matches.map(m => fact(esc(tr(lang, 'gleif_found', { legal: m.legal, lei: m.lei, jur: m.jur, st: m.st, ls: m.ls, reg: fd(m.reg, lang) })) + (m.cr ? ' ' + esc(facetT(lang, 'gl_cr', { d: fd(m.cr, lang) })) : ''), 'https://search.gleif.org/#/record/' + m.lei, 'search.gleif.org')).join('')
    : gl.ok ? fact(esc(tr(lang, 'gleif_none', { d: fd(gl.at, lang) })), 'https://search.gleif.org/#/search/simpleSearch=' + encodeURIComponent(name), 'search.gleif.org') : '<li>' + esc(tr(lang, 'gleif_err')) + '</li>') + dfacts + '</ul>' + (FD ? FD.doms : '') + '<p><a class="more" href="/registers/">' + esc(tr(lang, 'reg_more')) + '</a></p>';
  const FL = L.flatMap(x => (x.fl || []).map(f => [f[0], f[1], x])), seenF = new Set();
  const FLu = FL.filter(f => { const k = f[0] + f[1]; if (seenF.has(k)) return false; seenF.add(k); return true; });
  const reports = '<p class="ki">' + esc(tr(lang, 'rep_intro')) + '</p><ul class="fl">' + (FLu.map(f => fact(esc(tr(lang, 'rc_' + f[0])) + ' (<a href="' + pre(lang) + '/projects/' + f[2].s + '/#reports">' + esc(f[2].n) + '</a>)', f[1])).join('') || '<li>' + esc(tr(lang, 'no_reports')) + '</li>') + '</ul>';
  const reply = '<p>' + esc(tr(lang, 'reply_txt')) + '</p><p class="bts"><a class="btn btn-line kbtn" href="/developers/reply/?id=' + encodeURIComponent(first.id) + '">' + esc(tr(lang, 'reply_btn')) + '</a> <a class="btn btn-line kbtn" href="/corrections/?id=' + encodeURIComponent(first.id) + '">' + esc(tr(lang, 'corr_btn')) + '</a></p>';
  const cta = '<p>' + esc(tr(lang, 'cta_txt')) + '</p><p class="bts"><a class="btn btn-hi kbtn" href="/check/" data-ev="seo_check_dev">' + esc(tr(lang, 'cta_free')) + '</a> <a class="btn btn-line kbtn" href="/book/" data-ev="seo_book_dev">' + esc(tr(lang, 'cta_paid')) + '</a></p>';
  const factsTxt = [tr(lang, 'g_d', { k: L.length, dev: name, mks: mks.map(m => mkName(m, lang)).join(', ') }), tr(lang, 'g_d_pn', { pn, k: L.length }), P.length ? tr(lang, 'g_d_rec', { p: P.length, kept: cnt('kept'), broken: cnt('broken'), moved: cnt('moved'), pending: cnt('pending') }) : '', FLu.length ? FLu.map(f => tr(lang, 'rc_' + f[0])).join('; ') + '.' : tr(lang, 'no_reports')].filter(Boolean).join(' ');
  const FAQ = [[tr(lang, 'q_dlegit', { dev: name }), tr(lang, 'a_dlegit', { facts: factsTxt })],
    [tr(lang, 'q_dcompl', { dev: name }), FLu.length ? tr(lang, 'a_dcompl_some', { list: [...new Set(FLu.map(f => tr(lang, 'rc_' + f[0])))].join('; ') }) : tr(lang, 'a_dcompl_none')],
    [tr(lang, 'q_dproj', { dev: name }), L.map(x => x.n + ' (' + mkName(x.mk, lang) + ')').join(', ') + '.']];
  // s15a: register, on-time delivery and buyer reviews, answered from the GLEIF lookup and our promise record
  FAQ.splice(1, 0, [tr(lang, 'q_dreg', { dev: name }), gl.matches.length ? gl.matches.slice(0, 2).map(m => tr(lang, 'gleif_found', { legal: m.legal, lei: m.lei, jur: m.jur, st: m.st, ls: m.ls, reg: fd(m.reg, lang) })).join(' ') : gl.ok ? tr(lang, 'a_dreg_none', { d: fd(gl.at, lang) }) : tr(lang, 'a_dreg_err')]);
  FAQ.splice(2, 0, [tr(lang, 'q_ddeliv', { dev: name }), P.length ? tr(lang, 'g_d_rec', { p: P.length, kept: cnt('kept'), broken: cnt('broken'), moved: cnt('moved'), pending: cnt('pending') }) : tr(lang, 'drec_none')]);
  if (FD) FAQ.splice(3, 0, FD.faq);
  FAQ.push([tr(lang, 'q_drev', { dev: name }), tr(lang, 'a_drev')]);
  const answer = '<div class="kans" id="answer"><p class="kans-t"><b class="kans-l">' + esc(tr(lang, 'ans_lbl')) + '</b> ' + esc(factsTxt) + '</p><p class="kans-u"><span><time datetime="' + esc(checked) + '">' + esc(tr(lang, 'upd_checked', { d: fd(checked, lang) })) + '</time></span><span><a href="#glance">' + esc(tr(lang, 'ans_more')) + '</a></span></p></div>';
  for (const f of FAQ) f[1] = dot(f[1]);
  const faq = FAQ.map(([q, a]) => '<details class="kfaq"><summary>' + esc(q) + '</summary><p>' + esc(a) + '</p></details>').join('');
  const S = [...new Set(L.flatMap(x => [x.url, x.du]).concat(FLu.map(f => f[1])).filter(okHttp))];
  const sources = '<p class="ki">' + esc(tr(lang, 'src_intro')) + '</p><ol class="srcs">' + S.slice(0, 60).map(srcLi).join('') + '</ol>';
  const crumbs = [[tr(lang, 'crumb_home'), ORIGIN + pre(lang) + '/'], [tr(lang, 'crumb_devs'), ORIGIN + '/developers/'], [name, canon]];
  const body = '<section class="phero kp"><div class="wrap"><p class="crumb">' + crumbs.slice(0, 2).map(([l, u]) => '<a href="' + esc(u.replace(ORIGIN, '')) + '">' + esc(l) + '</a>').join(' / ') + '</p><h1>' + h1x(tr(lang, 'h1_d', { dev: name }), name) + '</h1><p class="lead">' + esc(tr(lang, 'lead_d', { dev: name })) + '</p>' + answer + feedLinks(lang, '/developers/' + dv.s + '/', name) + '</div></section>' +
    '<div class="wrap kwrap">' + sec('glance', esc(tr(lang, 's_glance')), '<ul class="fl glance">' + g.join('') + '</ul>') + sec('projects', esc(tr(lang, 's_dprojects')), projects) + (FD ? sec('promised', bidi(lang, esc(FD.h), [name]), FD.pv) : '') + sec('network', esc(tr(lang, 's_network')), networkHtml(name, extra.netOk ? gl.matches[0] : extra.fm ? extra.fm.m : null, extra.netOk ? extra.net : extra.fm ? extra.fm.net : null, L, pre(lang), '/developers/' + dv.s + '/', extra.netOk || extra.fm ? null : gl.matches[0], lang) + familyHtml(extra.fam, dv.s, lang, pre(lang)) + NET_CSS + '<script>' + NET_JS + '</script>') + (extra.web && webDevHealthHtml(extra.web, dv.s, lang) ? sec('webhealth', esc(webHeading(lang, 'h')), webDevHealthHtml(extra.web, dv.s, lang)) + sec('weblinks', esc(webHeading(lang, 'l')), webDevLinksHtml(extra.web, dv.s, lang)) : '') + (extra.watch && watchDevHtml(extra.watch, dv.s, lang) ? sec('watch', esc(watchHeading(lang)), watchDevHtml(extra.watch, dv.s, lang)) : '') + (extra.watch && gazDevHtml(extra.watch.gz, dv.s, lang) ? sec('gazette', esc(gazHeading(lang)), gazDevHtml(extra.watch.gz, dv.s, lang)) : '') + sec('record', esc(tr(lang, 's_drecord')), record) +
    sec('registers', esc(tr(lang, 's_dreg')), reg) + (extra.fil && filingsDevHtml(extra.fil, dv.s, lang) ? sec('filings', esc(filingsHeading(lang)), filingsDevHtml(extra.fil, dv.s, lang)) : '') + sec('reports', esc(tr(lang, 's_dreports')), reports) + (extra.rs ? sec('answers', esc(rsHeading(lang)), rsDevHtml(extra.rs, dv, lang, first.id)) : '') + sec('reply', esc(tr(lang, 's_reply')), reply + devDash(lang, dv.s)) + sec('cta', esc(tr(lang, 's_cta')), cta) + sec('faq', esc(tr(lang, 's_faq')), faq) + sec('sources', esc(tr(lang, 's_sources')), sources) +
    '<p class="ki kfoot">' + tr(lang, 'foot', { d: esc(fd(checked, lang)), link: own('/data-policy/', tr(lang, 'm_data_policy')) }) + '</p></div>';
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'ProfilePage', '@id': canon + '#page', url: canon, name: title.replace(/ \| Kolaboro$/, ''), description: desc, inLanguage: lang, dateModified: checked, speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#answer .kans-t'] }, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' }, publisher: { '@id': ORIGIN + '/#org' }, mainEntity: { '@id': dUrl('en', dv.s) + '#org' }, breadcrumb: { '@id': canon + '#bc' } },
    { '@type': 'Organization', '@id': ORIGIN + '/#org', name: 'Kolaboro', url: ORIGIN + '/', logo: ORIGIN + '/k/favicon.svg' },
    Object.assign({ '@type': 'Organization', '@id': dUrl('en', dv.s) + '#org', name, url: dUrl('en', dv.s) }, gl.matches[0] ? { leiCode: gl.matches[0].lei, legalName: gl.matches[0].legal } : {}, { subjectOf: L.slice(0, 50).map(x => ({ '@type': 'WebPage', url: pUrl(lang, x.s), name: x.n })) }),
    { '@type': 'BreadcrumbList', '@id': canon + '#bc', itemListElement: crumbs.map(([l, u], i) => ({ '@type': 'ListItem', position: i + 1, name: l, item: u })) },
    { '@type': 'FAQPage', '@id': canon + '#faq', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] };
  return { title, desc, canon, body, ld, lastmod: checked, alt: l => dUrl(l, dv.s), feed: { path: '/developers/' + dv.s + '/', name } };
}

function indexPage(ix, lang) {
  const by = new Map(); for (const x of ix.P) { if (!by.has(x.mk)) by.set(x.mk, []); by.get(x.mk).push(x); }
  const mks = [...by.keys()].sort((a, b) => by.get(b).length - by.get(a).length);
  const canon = ORIGIN + pre(lang) + '/projects/', title = tr(lang, 'title_i'), desc = tr(lang, 'lead_i', { k: ix.P.length, m: mks.length });
  const body = '<section class="phero kp"><div class="wrap"><p class="crumb"><a href="' + pre(lang) + '/">Kolaboro</a></p><h1>' + esc(tr(lang, 'h1_i')) + '</h1><p class="lead">' + esc(desc) + '</p>' + searchBox(lang, ix.P.length, ix.devs.size) + filterBar(lang) + '</div></section>' + LL_CSS + leastHtml(ix, lang, 24, iso(ix.updated)) + '<div class="wrap kwrap" data-kx-lists>' +
    '<details class="kmkt"><summary>' + esc(tr(lang, 'jump_mk')) + ' (' + mks.length + ')</summary><p>' + mks.map(m => '<a href="#m-' + slugM(m) + '">' + esc(mkName(m, lang)) + ' <small>' + by.get(m).length + '</small></a>').join('') + '</p></details>' +
    mks.map(m => '<section class="ks"><h2 id="m-' + slugM(m) + '">' + esc(mkName(m, lang)) + ' <small>' + by.get(m).length + '</small></h2><ul class="lk cols">' + by.get(m).sort((a, b) => a.n.localeCompare(b.n)).map(x => '<li><a href="' + pre(lang) + '/projects/' + x.s + '/">' + esc(x.n) + '</a>' + (x.dv ? ' <small>' + esc(x.dv) + '</small>' : '') + '</li>').join('') + '</ul></section>').join('') + '</div>';
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', url: canon, name: title.replace(/ \| Kolaboro$/, ''), description: desc, inLanguage: lang, dateModified: iso(ix.updated) };
  return { title, desc, canon, body, ld, lastmod: iso(ix.updated), alt: l => ORIGIN + pre(l) + '/projects/' };
}

// ------------------------------------------------------------------------------------------------ HTML assembly
const CSS = '<style id="knamed-css">.kp .kfs{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(210px,100%),1fr));gap:10px;margin:26px 0 0;padding:0}.kp .kf{border:1px solid var(--line);border-radius:14px;padding:10px 14px;background:var(--card,var(--paper));min-height:74px;min-width:0}' +
  '.kp dt{font-size:.78rem;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}.kp dd{margin:4px 0 0;font-weight:600;overflow-wrap:anywhere}.ks{padding:30px 0 6px;border-bottom:1px solid var(--line);scroll-margin-top:96px}.ks h2{font-size:clamp(1.3rem,2.4vw,1.7rem);margin:0 0 12px}.ks h3{font-size:1.1rem;margin:20px 0 8px}' +
  '.ki{color:var(--ink-2);font-size:.95rem;max-width:72ch}.fl{list-style:none;padding:0;margin:8px 0}.fl li{padding:9px 0;border-top:1px dashed var(--line);max-width:80ch;overflow-wrap:anywhere}.fl li:first-child{border-top:0}.glance li{font-size:1.06rem}' +
  'a.src{font-size:.8rem;margin-inline-start:6px;padding:1px 8px;border:1px solid var(--line);border-radius:999px;text-decoration:none;white-space:nowrap;color:var(--ink-2);max-width:100%;overflow:hidden;text-overflow:ellipsis;display:inline-block;vertical-align:bottom}a.src::before{content:"\\2197 "}' +
  '.tw{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:10px 0}.tw table{width:100%;border-collapse:collapse;font-size:.93rem;min-width:560px}.tw th,.tw td{text-align:start;vertical-align:top;padding:8px 10px;border-bottom:1px solid var(--line)}.tw thead th{font-size:.78rem;text-transform:uppercase;color:var(--muted)}' +
  '.kpill{display:inline-block;font-size:.78rem;font-weight:700;padding:1px 9px;border-radius:999px;border:1px solid var(--line);white-space:nowrap}.c-verified,.p-kept{background:var(--ok-bg);color:var(--ok)}.c-contradicted,.p-broken{background:#FDE7E1;color:#9A2A0A}.p-moved{background:#FFF1D6;color:#7A4B00}' +
  '[data-theme=dark] .c-contradicted,[data-theme=dark] .p-broken{background:#4A1C10;color:#FFC9B8}[data-theme=dark] .p-moved{background:#3D2C08;color:#FFDFA0}' +
  '.ktoc{display:flex;gap:8px;overflow-x:auto;padding:10px 0;margin:0;scrollbar-width:none;position:sticky;top:72px;z-index:15;background:var(--concrete);box-shadow:0 1px 0 var(--line)}.ktoc::-webkit-scrollbar{display:none}.ktoc a{flex:none;display:inline-flex;align-items:center;min-height:40px;font-size:.86rem;padding:0 14px;border:1px solid var(--line);border-radius:999px;text-decoration:none;color:var(--ink-2);background:var(--card)}.ktoc a:hover{border-color:var(--ink)}.ktoc a[aria-current]{background:var(--ink);border-color:var(--ink);color:var(--concrete)}.ks{scroll-margin-top:140px!important}' +
  '.kfold:not(.kopen)>:nth-child(n+7){display:none}.kmore{display:inline-flex;align-items:center;min-height:44px;margin:4px 0 8px;padding:0 18px;border:1px solid var(--ink);border-radius:999px;background:transparent;color:var(--ink);font:inherit;font-weight:700;font-size:.92rem;cursor:pointer}.kmore:hover{background:var(--card)}.kmore:focus-visible{outline:3px solid var(--hivis);outline-offset:2px}' +
  '@media(max-width:760px){.ktoc a{min-height:44px}a.src{border:11px solid transparent;margin-block:-11px;background-clip:padding-box;box-shadow:inset 0 0 0 1px var(--line);padding:2px 9px}.kfeeds a{display:inline-flex;align-items:center;min-height:44px;padding:0 4px}dd a.src{margin-block:2px 0}}' +
  '.kmkt{border-bottom:1px solid var(--line);padding:6px 0 12px}.kmkt summary{cursor:pointer;font-weight:700;min-height:44px;align-content:center}.kmkt p{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 4px}.kmkt a{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 12px;border:1px solid var(--line);border-radius:999px;background:var(--card);text-decoration:none;color:var(--ink-2);font-size:.88rem}.kmkt a:hover{border-color:var(--ink)}.kmkt small{color:var(--muted)}@media(max-width:760px){.kmkt a{min-height:44px}}' +
  '.lk{padding-inline-start:18px}.lk li{margin:6px 0}.lk small{color:var(--muted)}.cols{columns:2 260px}.kfaq{border-top:1px solid var(--line);padding:12px 0}.kfaq summary{cursor:pointer;font-weight:700;min-height:44px;display:flex;align-items:center}.kfaq p{max-width:75ch;color:var(--ink-2)}' +
  '.srcs{padding-inline-start:22px;font-size:.92rem}.srcs li{margin:5px 0;overflow-wrap:anywhere}.srcs small{color:var(--muted)}.kbtn{margin-top:6px!important;width:auto!important;box-shadow:none!important}.bts{display:flex;flex-wrap:wrap;gap:10px}.btn-line.kbtn{border-color:var(--ink);color:var(--ink);background:transparent}' +
  '.klive{border:2px solid var(--ink);border-radius:18px;padding:16px 18px;margin:16px 0}.klive h3{margin-top:0}.live-out{margin-top:10px;min-height:1.5em}.live-out li{padding:6px 0}.kfoot{padding:20px 0 40px}.knote{border:2px dashed var(--line);border-radius:14px;padding:12px 14px!important;background:var(--card,var(--paper));max-width:80ch}.knr dd{font-weight:700}.more{font-weight:700}.kreply p{margin:4px 0}.kreply-t{white-space:pre-wrap}.kvbadge{white-space:normal}blockquote{border-inline-start:3px solid var(--line);margin:10px 0;padding:4px 14px}' +
  '@media(max-width:640px){.kp .kfs{grid-template-columns:repeat(2,minmax(0,1fr))}.kp .kf{min-height:84px;padding:9px 11px}.kp dd{font-size:.92rem}}</style>';
const JS = "(function(){var b=document.querySelector('[data-live]');if(!b)return;var w=b.closest('.klive'),o=w.querySelector('.live-out'),L=JSON.parse(w.getAttribute('data-lk')||'{}'),M=JSON.parse(w.getAttribute('data-msg')||'{}');" +
  "b.addEventListener('click',function(){b.disabled=true;o.textContent=M.wait;var q=new URLSearchParams();Object.keys(L).forEach(function(k){if(L[k])q.set(k,L[k]);});" +
  "fetch('/api/kb/lookup?'+q.toString(),{headers:{accept:'application/json'}}).then(function(r){return r.json();}).then(function(d){if(!d||!d.checks){o.textContent=M.err;b.disabled=false;return;}" +
  "var ul=document.createElement('ul');ul.className='fl';d.checks.forEach(function(c){var li=document.createElement('li');var s=c.status==='found'?M.found:c.status==='not_found'||c.status==='not_published'?M.nf:M.un;li.textContent=(c.source||c.id)+': '+s+(c.note?' ('+String(c.note).slice(0,160)+')':'');" +
  "if(c.source_url){var a=document.createElement('a');a.className='src';a.href=c.source_url;a.rel='nofollow noopener';a.target='_blank';try{a.textContent=new URL(c.source_url).hostname;}catch(e){a.textContent='source';}li.appendChild(document.createTextNode(' '));li.appendChild(a);}ul.appendChild(li);});" +
  "o.textContent='';o.appendChild(ul);if(d.seal&&d.seal.result_url){var p=document.createElement('p');var a2=document.createElement('a');a2.href=d.seal.result_url;a2.textContent=M.open+' (SHA-256 '+d.seal.root_sha256.slice(0,12)+'...)';p.appendChild(a2);o.appendChild(p);}b.disabled=false;})" +
  ".catch(function(){o.textContent=M.err;b.disabled=false;});});})();";

// d12b: the page name leads the H1; the ": reviews and facts" tail sits on a smaller second line (same text for search engines)
function h1x(h, name) { if (h.indexOf(name) !== 0 || h.length <= name.length) return esc(h); const t = h.slice(name.length), m = t.match(/^\s*[:\uFF1A]\s*/); return '<bdi>' + esc(name) + '</bdi>' + (m ? esc(m[0].trim()) + ' ' : '') + '<span class="kh1s">' + esc(m ? t.slice(m[0].length) : t) + '</span>'; }
// d12b: every plain .tw table gets its header text on each cell (data-l) so phones can show rows as labelled cards
function cardify(html) {
  return html.replace(/<div class="tw"><table><thead><tr>([\s\S]*?)<\/tr><\/thead><tbody>([\s\S]*?)<\/tbody><\/table><\/div>/g, (m, hr, rows) => {
    const L = (hr.match(/<th[^>]*>([\s\S]*?)<\/th>/g) || []).map(t => t.replace(/<[^>]+>/g, '').replace(/"/g, '&quot;').trim());
    const out = rows.replace(/<tr([^>]*)>([\s\S]*?)<\/tr>/g, (m2, ta, cells) => { let i = 0; return '<tr' + ta + '>' + cells.replace(/<(td|th)(\s[^>]*)?>/g, (m3, tg, at) => { const l = L[i++] || ''; return '<' + tg + (at || '') + (l && tg === 'td' ? ' data-l="' + l + '"' : '') + '>'; }) + '</tr>'; });
    return '<div class="tw kcards"><table><thead><tr>' + hr + '</tr></thead><tbody>' + out + '</tbody></table></div>';
  });
}
const D12CSS = '<style id="kd12b-css">' +
  '.kmore,.ktoc a{border-radius:var(--k-r-md,10px)}.kmore:focus-visible,.ktoc a:focus-visible{outline:3px solid var(--k-sea,#155C75);outline-offset:2px}.kp h1{font-size:clamp(2.1rem,6vw,4.4rem);line-height:1.02;max-width:18ch;overflow-wrap:anywhere;text-wrap:balance}.kh1s{display:block;font-size:.46em;line-height:1.2;margin-top:.3em;color:var(--ink-2);letter-spacing:0;font-weight:inherit}' +
  '.kp .lead{max-width:60ch;text-wrap:pretty}.kp .kfs{gap:0;border:1px solid var(--line);border-radius:var(--k-r-lg,14px);overflow:hidden;background:var(--card,var(--paper));grid-template-columns:repeat(auto-fill,minmax(min(220px,100%),1fr))}' +
  '.kp .kf{border:0;border-radius:0;box-shadow:inset -1px -1px 0 var(--line);padding:14px 16px;min-height:0;background:transparent}.kp dt{text-transform:none;letter-spacing:0;font-size:.82rem;font-weight:600;color:var(--muted)}.kp dd{margin:4px 0 0;font-size:1.02rem;line-height:1.35}.kp dd a.src{display:table;margin:8px 0 0}.kp dd small{font-weight:500;color:var(--muted)}' +
  '.ks{padding:44px 0 14px}.ks h2{font-size:clamp(1.35rem,2.6vw,1.85rem);letter-spacing:-.01em;margin:0 0 10px}.ks>.ki:first-of-type{margin-top:0}.ki{line-height:1.55}' +
  '.fl li{border-top:1px solid var(--line);padding:12px 0;line-height:1.55}.fl li b,.fl li strong{font-weight:700}a.src{border:0;border-bottom:1px dotted var(--k-line-2,#B9B7AF);border-radius:0;padding:0;color:var(--k-muted,#56636F);font-size:var(--k-fs-xs,.8rem);transition:color .15s}a.src:hover{color:var(--k-sea,#155C75);border-bottom-color:currentColor}@media(max-width:760px){a.src{box-shadow:none;border-bottom:1px dotted var(--k-line-2,#B9B7AF);border-top:11px solid transparent;border-inline:0;padding:0;margin-block:-11px 0}}' +
  '.kwatch{border:1px solid var(--line);border-inline-start:4px solid var(--k-sea,#155C75);border-radius:16px;padding:20px 22px;margin:20px 0 0}.kwatch>.kfeeds{grid-column:1/-1;max-width:none;margin:6px 0 0;padding-top:12px;border-top:1px solid var(--line);font-size:.86rem;display:flex;flex-wrap:wrap;align-items:center;gap:4px 14px}.kwatch>.kfeeds span{color:var(--muted)}.kw-t b{font-size:1.1rem}' +
  '.klive{border:1px solid var(--line);border-radius:16px;background:var(--card,var(--paper));padding:20px 22px}.knote{border-style:solid;border-width:1px}' +
  '.tw{border:1px solid var(--line);border-radius:14px;background:var(--card,var(--paper))}.tw table{min-width:0}.tw th,.tw td{padding:12px 14px}.tw thead th{text-transform:none;font-size:.82rem;font-weight:600;letter-spacing:0;background:var(--k-sunken,var(--paper));border-bottom:1px solid var(--line)}.tw tbody tr:last-child>*{border-bottom:0}.tw tbody tr:hover{background:color-mix(in srgb,var(--ink) 3%,transparent)}.tw tbody th{font-weight:700}' +
  '.kpill{padding:3px 10px;border:0;font-size:.76rem}' +
  '@media(max-width:640px){.kp .kfs{grid-template-columns:repeat(2,minmax(0,1fr))}.kp .kf{padding:12px}.kp dd{font-size:.95rem}}@media(max-width:700px){.tw.kcards{border:0;background:none;overflow:visible}.tw.kcards table,.tw.kcards tbody,.tw.kcards tr,.tw.kcards td,.tw.kcards tbody th{display:block}.tw.kcards thead{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}' +
  '.tw.kcards tr{border:1px solid var(--line);border-radius:14px;background:var(--card,var(--paper));padding:12px 14px;margin:0 0 10px}.tw.kcards td,.tw.kcards tbody th{border:0;padding:3px 0}.tw.kcards tbody th,.tw.kcards td:first-child{font-size:1rem;padding-bottom:6px}.tw.kcards td[data-l]:not(:first-child)::before{content:attr(data-l);display:inline;margin-inline-end:.5em;font-size:.78rem;font-weight:600;color:var(--muted)}.tw.kcards td:empty{display:none}.tw.kcards tbody tr:hover{background:var(--card,var(--paper))}}' +
  '@media(min-width:1180px){.kwrap:has(>.ktoc){display:grid;grid-template-columns:210px minmax(0,1fr);column-gap:56px;align-items:start}.kwrap>.ktoc{grid-column:1;grid-row:1/span 60;flex-direction:column;gap:2px;overflow:visible;background:none;box-shadow:none;padding:44px 0 0;z-index:1}' +
  '.kwrap>.ktoc a{min-height:36px;border:0;border-radius:8px;padding:0 12px;background:none;border-inline-start:2px solid var(--line);border-radius:0;white-space:normal;line-height:1.25;padding-block:6px}.kwrap>.ktoc a:hover{color:var(--ink);border-inline-start-color:var(--ink)}.kwrap>.ktoc a[aria-current]{background:none;color:var(--ink);font-weight:700;border-inline-start-color:var(--k-sea,#155C75)}.kwrap:has(>.ktoc)>:not(.ktoc){grid-column:2}}' +
  '.ks h2 small{font-size:.5em;font-weight:500;color:var(--muted);margin-inline-start:8px;font-variant-numeric:tabular-nums;letter-spacing:0}[data-kx-lists] .lk{list-style:none;padding:0;column-gap:40px}[data-kx-lists] .lk li{margin:0;padding:7px 0;break-inside:avoid;border-bottom:1px solid var(--line)}[data-kx-lists] .lk small{display:block;font-size:.84rem;margin-top:1px}[data-kx-lists] .ks{padding-top:36px}' +
  '.kmkt summary{list-style:none;display:flex;align-items:center;gap:8px}.kmkt summary::-webkit-details-marker{display:none}.kmkt summary::after{content:"";width:7px;height:7px;border:solid currentColor;border-width:0 2px 2px 0;transform:rotate(45deg) translateY(-2px)}.kmkt[open] summary::after{transform:rotate(-135deg) translateY(-2px)}.kmkt a{border-radius:var(--k-r-md,10px)}' +
  '.kans-u .kbought{font-weight:700}.kr-rep{margin:-4px 0 14px;padding:8px 12px;border-inline-start:3px solid var(--k-sea,#155C75)}' +
  '.kans{margin:22px 0 0;padding:16px 20px;border:1px solid var(--line);border-inline-start:4px solid var(--k-sea,#155C75);border-radius:var(--k-r-lg,14px);background:var(--card,var(--paper));max-width:80ch}.kans p{margin:0}.kans-t{font-size:1.04rem;line-height:1.55;text-wrap:pretty}.kans-l{display:block;font-size:.82rem;font-weight:700;color:var(--muted);margin-bottom:4px}.kans-u{margin-top:10px!important;font-size:.86rem;color:var(--muted);display:flex;flex-wrap:wrap;gap:4px 18px}.kans-u a{color:var(--ink-2);font-weight:600}' +
  '.kupd{margin:6px 0 0;font-size:.86rem;color:var(--muted)}.kovd{margin:18px 0 0;padding:14px 18px;border:1px solid var(--k-warn,#8A5300);border-inline-start-width:4px;border-radius:var(--k-r-lg,14px);background:var(--k-warn-bg,#FBF0D8);color:var(--ink);max-width:80ch}.kovd p{margin:0;line-height:1.55}.kovd b{display:block;color:var(--k-warn,#8A5300);font-size:.9rem}.kovd-l{font-weight:600;margin-inline-start:8px}' +   // n27g
  '@media(prefers-reduced-motion:reduce){a.src{transition:none}}</style>';

// n20p: sections far from the screen are not laid out or painted until the reader gets near them (a project page has 20 to 25
// sections and is 20,000 px tall on a phone). Not applied when the page opens on an anchor (#land ...), where the browser must know
// every section's real height to land in the right place, nor in print. Everything stays in the page for search and Ctrl+F.
const CV = '<script>if(location.hash)document.documentElement.classList.add("kb-h")</script><style id="kcv-css">html:not(.kb-h) .kwrap section.ks{content-visibility:auto;contain-intrinsic-size:auto 700px}@media print{html:not(.kb-h) .kwrap section.ks{content-visibility:visible}}</style>';
function head(pg, lang) {
  const alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + pg.alt(l) + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + pg.alt('en') + '">';
  return '<title>' + esc(pg.title) + '</title><meta name="description" content="' + esc(pg.desc) + '"><link rel="canonical" href="' + pg.canon + '">' + alts +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="Kolaboro"><meta property="og:title" content="' + esc(pg.title) + '"><meta property="og:description" content="' + esc(pg.desc) + '"><meta property="og:url" content="' + pg.canon + '"><meta property="og:locale" content="' + (LOCALE[lang] || 'en-GB').replace('-', '_') + '">' +
    (pg.feed ? '<meta property="og:image" content="' + ORIGIN + '/og' + pg.feed.path.replace(/\/$/, '') + '.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="' + esc(tr(lang, 'og_alt', { n: pg.feed.name })) + '"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="' + ORIGIN + '/og' + pg.feed.path.replace(/\/$/, '') + '.png">' : '<meta name="twitter:card" content="summary">') + '<meta name="robots" content="' + (pg.noindex ? 'noindex' : 'index, follow, max-snippet:-1') + '">' +
    (pg.feed ? '<link rel="alternate" type="application/atom+xml" title="' + esc(pg.feed.name) + ' (Atom)" href="' + pg.feed.path + 'feed.atom"><link rel="alternate" type="application/feed+json" title="' + esc(pg.feed.name) + ' (JSON Feed)" href="' + pg.feed.path + 'feed.json">' : '') +
    '<script type="application/ld+json">' + JSON.stringify(pg.ld).replace(/</g, '\\u003c') + '</script>' + CSS + W9CSS + D12CSS + CV + (/data-kn=/.test(pg.body) ? NX_CSS : '') + (/data-kf=/.test(pg.body) ? KF_CSS : '') + (/class="ks kz"|data-u27/.test(pg.body) ? Z_CSS : '');
}
async function assemble(pg, lang, shellRes) {
  const msg = { wait: tr(lang, 'live_wait'), err: tr(lang, 'live_err'), found: tr(lang, 'live_found'), nf: tr(lang, 'live_notfound'), un: tr(lang, 'live_unavail'), open: tr(lang, 'live_open') };
  const body = cardify(pg.body).replace('<div class="klive" ', '<div class="klive" data-msg="' + esc(JSON.stringify(msg)) + '" ');
  const tags = head(pg, lang);
  const res = new HTMLRewriter()
    .on('title', { element(e) { e.remove(); } })
    .on('meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
    .on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(body + (/data-live|data-kw|data-kx|data-kn=|data-kf=|data-u27/.test(body) ? '<script src="/k/u27.js?v=' + U27_SRC_V + '" defer></script>' : ''), { html: true }); } })   // n27u: one cached file instead of up to 11 KB of inline script per page
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) e.setAttribute('href', pg.alt(l).replace(ORIGIN, '')); } })
    .transform(new Response(shellRes.body, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
  return await res.text();
}

// ------------------------------------------------------------------------------------------------ routes
const RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(projects|developers)\/(?:([a-z0-9-]{1,90})\/?)?$/;
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:projects|developers)(?:\/|$)|^\/api\/seo\/(?:urls|scan)$/;
function jsonOut(o, s, extra) { return new Response(JSON.stringify(o), { status: s || 200, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=600' }, extra || {}) }); }

// n27u: the scripts these pages used to inline, served once as /k/u27.js (kbx_u27.js) with the batch 27 client script
export const NAMED_CLIENT_JS = [JS, W9JS, NX_JS, KF_JS].join('\n');
export const U27_SRC_V = CACHE_V.replace('named-', '') + '.' + U27V;
export { data, scanHtml, lastmod, handoverOf, reviewed, isListing, fd, tr, iso, okHttp, fixU, host, cleanOk, assemble, esc, pre };
// the project's official domain(s): hosts of the pages we track for it, excluding property portals (used by the verified reply check)
export async function officialDomains(env, id) {
  const ix = await data(env), x = ix.byId.get(String(id || '').toUpperCase());
  if (!x) return { named: false, domains: [] };
  return { named: true, slug: x.s, domains: [...new Set([x.url, x.du].filter(u => okHttp(u) && !isListing(u)).map(host).filter(Boolean))] };
}
let RDY = { t: 0, n: 0 };
async function repliesPublished() {   // approved developer replies, part of the HTML cache key so an approval shows within a minute
  if (Date.now() - RDY.t < 60000) return RDY.n;
  try { const d = await rpc('kolaboro_i_ready', {}); RDY = { t: Date.now(), n: (d && d.replies_published) || 0 }; } catch (e) { RDY = { t: Date.now(), n: RDY.n }; }
  return RDY.n;
}
export async function redirectP(u, env) {   // /p/<id>/ -> /projects/<slug>/ (301), or null to keep the old page
  try {
    const ix = await data(env), id = (decodeURIComponent(u.pathname.split('/')[2] || '') || u.searchParams.get('id') || '').toUpperCase();   // /p/<id>/ or the old /p/?id=<id>
    const x = ix.byId.get(id); if (!x) return null;
    return new Response(null, { status: 301, headers: { location: '/projects/' + x.s + '/', 'cache-control': 'public, max-age=86400' } });
  } catch (e) { return null; }
}

// n19f (9 Nov 2026): pins corrected by hand; the satellite, street, 3D, buildings, stage, short-let, sale-price, land and planning
// sections for these projects were computed from the wrong pin and stay hidden until the next monthly rebuild uses the new one.
// Remove an entry once construction-progress.json, satellite-radar.json, buildings.json, street-photos.json and short-lets.json
// have been rebuilt after the date shown.
const PIN_HOLD = { 'BHX-002': '2026-11-09', 'BHX-003': '2026-11-09' };
function pinOff(x) {
  const la = +(x.fx || {}).lat, lo = +(x.fx || {}).lng;
  return p => {
    if (p == null || !isFinite(la) || !isFinite(lo)) return false;
    const q = Array.isArray(p) ? p.map(Number) : String(p).split(',').map(Number);
    if (q.length < 2 || !isFinite(q[0]) || !isFinite(q[1])) return false;
    const r = Math.PI / 180, a = Math.sin((q[0] - la) * r / 2) ** 2 + Math.cos(la * r) * Math.cos(q[0] * r) * Math.sin((q[1] - lo) * r / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(a)) > 2;
  };
}
export async function render(ix, kind, key, lang, env, ctx) {   // exported for the local test and the scan endpoint
  if (kind === 'i') return indexPage(ix, lang);
  if (kind === 'projects') {
    const x = ix.bySlug.get(key); if (!x) return null;
    // n20p: the thirteen reads below are independent, so they run together (they used to run one after another, which made a page
    // that was not in the edge cache take 1 to 5 s on a fresh isolate). Each still fails on its own without breaking the page.
    const soft = (f, d) => (async () => { try { return await f(); } catch (e) { return d; } })();
    // the two database reads wait 2.5 s at most; a page built without an answer is shown but not kept in the cache
    let phErr = false, dbSlow = false; const tm = {}, t0 = Date.now();
    const timed = (n, pr) => pr.then(v => { tm[n] = Date.now() - t0; return v; });
    const capped = (n, pr, d) => timed(n, Promise.race([pr, new Promise(r => setTimeout(() => { dbSlow = true; r(d); }, 2500))]));
    const dbDone = { rv: false, dr: false };
    let [reviews, replies, ph, sat, fcs, web, coh, paper, see, money, land, around, trp, fac] = await Promise.all([
      capped('rv', soft(async () => { const k = new Request(ORIGIN + '/__named_rev/v1/' + x.id), hit = await caches.default.match(k); if (hit) return await hit.json(); const rv = await rpc('kolaboro_t_reports_public', { p_project: x.id }); const p = caches.default.put(k, new Response(JSON.stringify(rv || {}), { headers: { 'cache-control': 'max-age=1800' } })); if (ctx && ctx.waitUntil) ctx.waitUntil(p.catch(() => {})); return rv; }, null).then(v => { dbDone.rv = true; return v; }), null),
      capped('dr', soft(async () => { const k = new Request(ORIGIN + '/__named_dr/v1/' + x.id + '/' + (await repliesPublished())), hit = await caches.default.match(k); if (hit) return await hit.json(); const rp = (await rpc('kolaboro_devreply_public', { p_id: x.id })) || []; const p = caches.default.put(k, new Response(JSON.stringify(rp), { headers: { 'cache-control': 'max-age=3600' } })); if (ctx && ctx.waitUntil) ctx.waitUntil(p.catch(() => {})); return rp; }, []).then(v => { dbDone.dr = true; return v; }), []),
      timed('ph', (async () => { try { return await phSummary(env, x.id); } catch (e) { phErr = true; return null; } })()),
      timed('sat', soft(() => satData(env), null)),
      timed('fc', (async () => { let fc = null, fdg = null; try { fc = await fcData(env); fdg = x.dvs ? await fcDevGroup(env, x.dvs) : null; } catch (e) { fc = null; } return { fc, fdg }; })()),
      timed('web', soft(() => webData(env), null)),
      timed('coh', soft(() => cohortCard(env, lang, x.id), '')),
      timed('paper', soft(() => paperData(env), null)),   // n18d
      timed('see', soft(() => seeData(env), null)),
      timed('money', soft(() => moneyData(env), null)),   // n19b
      timed('land', soft(() => landData(env), null)),   // n19c
      timed('around', soft(() => aroundData(env), null)),   // n21b
      timed('tr', soft(() => trProject(env, x.id, lang), null)),   // n23: "Ranked #N of M for transparency in <place>"; n24s: with the score and checklist
      timed('fac', soft(() => facetsData(env), null)),   // n26s
    ]);
    dbSlow = dbSlow && !(dbDone.rv && dbDone.dr);
    const fc = fcs.fc, fdg = fcs.fdg;
    // n19f: sections computed from a pin that was later corrected are hidden for that project until the data is rebuilt with the
    // new pin. PIN_HOLD lists hand corrections (date of the fix); data files that store the pin they used are also compared with
    // the current pin and dropped for this page when they are more than 2 km apart.
    const hold = PIN_HOLD[x.id], off = pinOff(x);
    if (hold) { sat = null; see = null; money = null; }
    if (hold || off(land && land.lr && land.lr.projects && land.lr.projects[x.id] && land.lr.projects[x.id].pin)) land = null;
    if (hold || off(aroundPin(around, x.id))) around = null;   // n21b: measured from a pin that has since moved
    if (paper && paper.pl && paper.pl.projects && paper.pl.projects[x.id] && (hold || off(paper.pl.projects[x.id].pin))) paper = Object.assign({}, paper, { pl: Object.assign({}, paper.pl, { projects: Object.assign({}, paper.pl.projects, { [x.id]: undefined }) }) });
    const pg = projectPage(ix, x, lang, { reviews, replies, ph, sat, fc, fdg, web, coh, paper, see, money, land, around, trb: trp ? trp.badge : '', trp, fac }); if (phErr || dbSlow) pg.nocache = true;   // page history not loaded, or the database did not answer in time: do not cache
    pg.tm = Object.keys(tm).map(k => k + ';dur=' + tm[k]).join(', ');
    return pg;
  }
  const dv = ix.devs.get(key); if (!dv) return null;
  const softD = f => (async () => { try { return await f(); } catch (e) { return null; } })();   // n20p: the register lookup and the four data files load together
  const [gn, rs, web, fam, watch, fil, fac] = await Promise.all([
    (async () => { const gl = await gleif(dv.n, ctx), m0 = gl.matches[0], cs = new Set(dv.ids.map(i => ix.byId.get(i)).filter(Boolean).map(x => COUNTRY_ISO[x.co] || x.co));
      const netOk = !!(m0 && cs.has(m0.country)), net = netOk ? await gleifNet(m0.lei, ctx) : null;   // a same-name company in another country is not shown as this developer's group
      return { gl, netOk, net }; })(),
    softD(() => rsData(env)), softD(() => webData(env)), softD(() => familyData(env)), softD(() => watchData(env)), softD(() => filingsData(env)), softD(() => facetsData(env))]);   // watch: n19a
  const gl = gn.gl, netOk = gn.netOk, net = gn.net;
  return devPage(ix, dv, lang, { gleif: gl, net, netOk, rs, web, fam, fm: netOk ? null : famNet(fam, dv.s), watch, fil, fac });
}

// shell(path) -> Response of the site's static page at that path (header, footer, styles of that language)
export async function handle(req, u, env, ctx, shell) {
  const p = u.pathname;
  if (p === '/api/seo/urls') return urls(env);
  if (p === '/api/seo/scan') return scan(u, env);
  const dm = p.match(/^\/projects\/([a-z0-9-]{1,90})\/changes\/(?:([0-9a-f]{64})\.txt)?$/);
  if (dm) { let ix; try { ix = await data(env); } catch (e) { return null; } const x = ix.bySlug.get(dm[1]); if (!x) return null; return diffRoute(req, u, env, ctx, shell, x, dm[2] || null); }
  if (/^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?projects$/.test(p)) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': 'public, max-age=86400' } });   // n20f: /projects without the slash was a 404
  const m = p.match(RX); if (!m) return null;
  const lang = m[1] || 'en', kind = m[2], key = m[3];
  if (!key && kind === 'developers') return null;                       // /developers/ is the static developer hub
  if (key && kind === 'developers' && RESERVED.has(key)) return null;   // /developers/reply/ etc. stay static
  if (!p.endsWith('/')) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
  // n20p (9 Nov 2026): the rendered page is kept at the edge under a key that needs no data to compute (code version + path), so a
  // cached page is answered before any data file is read. Each copy remembers the data version it was built from. A copy older
  // than a minute is still answered at once and checked in the background: same data version, its clock restarts; new data (a
  // publish, an approved developer reply), the page is rendered again for the next reader. Copies live 6 hours at most.
  const fk = new Request(ORIGIN + '/__named_fast/' + CACHE_V + cohortKey(env) + p), t0 = Date.now();
  try {
    const hit = await caches.default.match(fk);
    if (hit) {
      const age = Date.now() - (+hit.headers.get('x-at') || 0), stale = age > FAST_FRESH;
      if (stale && ctx && ctx.waitUntil && !REFRESHING.has(p)) {
        const copy = hit.clone(); REFRESHING.add(p);
        ctx.waitUntil(refresh(copy, fk, p, kind, key, lang, env, ctx, shell).catch(() => {}).then(() => { REFRESHING.delete(p); }));
      }
      const hh = { 'content-type': 'text/html; charset=utf-8', 'x-named-cache': stale ? 'stale' : 'hit', 'cache-control': 'no-cache', 'server-timing': 'cache;desc=' + (stale ? 'stale' : 'hit') + ';dur=' + (Date.now() - t0) };
      if (hit.headers.get('x-lm')) hh['last-modified'] = hit.headers.get('x-lm');
      return new Response(hit.body, { status: 200, headers: hh });
    }
  } catch (e) {}
  let ix; try { ix = await data(env); } catch (e) { return null; }
  const t1 = Date.now(), shP = shell(pre(lang) + '/how-we-score/'); shP.catch(() => {});   // the page shell loads while the page is rendered
  const pg = await render(ix, key ? kind : 'i', key, lang, env, ctx);
  if (pg && key) try { await seoLd(pg, env, kind, key, await lmFiles(ix, env)); } catch (e) {}
  updLine(pg);
  const t2 = Date.now(), sh = await shP;
  if (!pg) {
    const nf = { title: tr(lang, 'nf_h') + ' | Kolaboro', desc: tr(lang, 'nf_p'), canon: ORIGIN + p, noindex: true, body: (await import('./kbx_404.js')).helpBody(lang, tr(lang, 'nf_h'), tr(lang, 'nf_p')), ld: { '@context': 'https://schema.org', '@type': 'WebPage', name: tr(lang, 'nf_h') }, lastmod: '', alt: l => ORIGIN + pre(l) + '/projects/' };
    return new Response(await assemble(nf, lang, sh), { status: 404, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' } });
  }
  const html = await assemble(pg, lang, sh), lm = new Date((pg.lastmod || '2026-11-01') + 'T00:00:00Z').toUTCString(), t3 = Date.now();
  if (!pg.nocache) try { const put = fastPut(fk, html, await dataVer(ix, env, kind, key), lm); if (ctx && ctx.waitUntil) ctx.waitUntil(put.catch(() => {})); } catch (e) {}
  return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'x-named-cache': 'miss', 'cache-control': 'no-cache', 'last-modified': lm, 'server-timing': 'data;dur=' + (t1 - t0) + ', render;dur=' + (t2 - t1) + ', page;dur=' + (t3 - t2) + (pg.tm ? ', ' + pg.tm : '') } });
}
// n27g: "Updated <date>" under the title shows the date of the last real data change (seoLd sets pg.lastmod, the JSON-LD dateModified)
function updLine(pg) {
  if (!pg || !pg.upd || !pg.lastmod || !iso(pg.lastmod)) return;
  const d = iso(pg.lastmod), l = pg.upd.lang;
  pg.body = pg.body.replace(pg.upd.html, '<p class="kupd"><time datetime="' + d + '">' + esc(qa(l, 'upd_on', { d: fd(d, l) })) + '</time></p>');
}
// the parsed files the lastmod date of one page is computed from (all already in memory after a render); null if one is missing
async function lmFiles(ix, env) {
  try {
    const [prom, find, prog] = await Promise.all([loadJson(env, 'promises.json'), loadJson(env, 'findings-by-project.json'), satData(env)]);
    if (!prom || !find || !prog) return null;
    return { named: ix.named, cases: ix.cases, caseBy: ix.caseBy, prom, find, prog, raw: x => RAWN.has(x) ? Object.assign({}, x, { n: RAWN.get(x) }) : x };
  } catch (e) { return null; }
}
const FAST_FRESH = 60000, FAST_TTL = 21600, REFRESHING = new Set();
// the data version a page was built from: any change here means the page must be rendered again
async function dataVer(ix, env, kind, key) {
  const pj = key && kind === 'projects', dv = key && kind === 'developers', nul = () => null;
  const [rp, sd, se, la, fa, ao] = await Promise.all([pj ? repliesPublished() : 0, pj ? satData(env).catch(nul) : null, pj ? seeData(env).catch(nul) : null, pj ? landData(env).catch(nul) : null, dv ? familyData(env).catch(nul) : null, pj ? aroundData(env).catch(nul) : null]);
  return (pj ? new Date().toISOString().slice(0, 10) + '|' : '') + ix.updated + '|' + (ix.named.count || 0) + '|' + ix.P.length + '|' + (ix.named.updated || '') + '|r' + rp + '|s' + (pj ? ((sd || {}).updated || '') + '|' + (((sd || {}).space || {}).v || '') + '|g' + ((se || {}).v || '') + '|l' + ((la || {}).v || '') + '|a' + ((ao || {}).v || '') : '') + (dv ? '|f' + ((fa || {}).updated || '') : '');
}
const fastPut = (fk, html, ver, lm) => caches.default.put(fk, new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'max-age=' + FAST_TTL, 'x-at': String(Date.now()), 'x-ver': encodeURIComponent(ver), 'x-lm': lm || '' } }));
async function refresh(copy, fk, p, kind, key, lang, env, ctx, shell) {
  const ix = await data(env), ver = await dataVer(ix, env, kind, key);
  if (copy.headers.get('x-ver') === encodeURIComponent(ver)) return fastPut(fk, await copy.text(), ver, copy.headers.get('x-lm'));
  const pg = await render(ix, key ? kind : 'i', key, lang, env, ctx);
  if (!pg) return caches.default.delete(fk);   // the project or developer is no longer published
  if (key) try { await seoLd(pg, env, kind, key, await lmFiles(ix, env)); } catch (e) {}
  updLine(pg);
  if (pg.nocache) return;
  const html = await assemble(pg, lang, await shell(pre(lang) + '/how-we-score/'));
  return fastPut(fk, html, ver, new Date((pg.lastmod || '2026-11-01') + 'T00:00:00Z').toUTCString());
}

// n27g (batch 27): sitemap diet. Every page stays live and indexable; the sitemaps list a project page when it holds at least 2 of 6
// basic facts (developer named, handover date, permit or licence number, price, area or pin, the developer's own page rather than a
// listing portal), and a developer page when the developer has 2 or more tracked projects (a one-project developer page repeats the
// project page). sm=false entries stay in this list for every other use.
function facts6(ix, x) {
  const fx = x.fx || {};
  return [!!x.dv, !!handoverOf(ix, x), !!x.pn, !!fx.price_min, !!(x.ar && x.ar !== x.mk) || (typeof fx.lat === 'number' && typeof fx.lng === 'number'), okHttp(x.url) && !isListing(x.url)].filter(Boolean).length;
}
async function urls(env) {
  let ix; try { ix = await data(env); } catch (e) { return jsonOut({ error: 'data' }, 503, { 'cache-control': 'no-store' }); }
  const alt = f => Object.fromEntries(LANGS.map(l => [l, f(l)]).concat([['x-default', f('en')]]));
  const out = [];
  const add = (type, f, base, lm, en_) => { for (const l of LANGS) out.push(Object.assign({ url: f(l), lang: l, type, lastmod: lm }, base, l === 'en' ? Object.assign({ alternates: alt(f) }, en_ || {}) : {})); };
  add('index', l => ORIGIN + pre(l) + '/projects/', {}, iso(ix.updated));
  let sat = null; try { sat = await satData(env); } catch (e) { sat = null; }
  // n24s: the English quick answer of each project (as on the page, without the buyer-review sentence) for llms.txt and answer engines
  const tps = await Promise.all(ix.P.map(x => trProject(env, x.id, 'en').catch(() => null)));
  ix.P.forEach((x, i) => add('project', l => pUrl(l, x.s), { id: x.id, reviewed: reviewed(ix.caseBy.get(x.id)), facts: facts6(ix, x), sm: facts6(ix, x) >= 2 }, lastmod(ix, x), { summary: quickAnswer(ix, x, 'en', tps[i]), images: projImages(x, 'en', pUrl('en', x.s), PIN_HOLD[x.id] ? null : sat).map(i => ({ loc: i.contentUrl, title: i.name, caption: i.caption })), added: x.ad || null, listing_page: okHttp(x.url) && isListing(x.url), name: x.n, developer: x.dv || null, developer_url: x.dvs && ix.devs.has(x.dvs) ? dUrl('en', x.dvs) : null, market: x.mk, country: x.co  }));
  for (const d of ix.devs.values()) { const lm = d.ids.map(i => lastmod(ix, ix.byId.get(i))).sort(); add('developer', l => dUrl(l, d.s), { sm: d.ids.length >= 2 }, lm[lm.length - 1], { name: d.n, projects: d.ids }); }
  return jsonOut({ version: 'seo-urls-1', updated: ix.updated, languages: LANGS, note: 'One entry per URL and language. sm=false: kept live and indexable, left out of the XML sitemaps (fewer than 2 of 6 basic facts, or a developer with one tracked project). English project entries carry images (share card and, where we have one, the monthly satellite strip) with captions for an image sitemap. The English entry carries the hreflang alternates and the names; the others share its path under /<lang>/. reviewed=false: not yet reviewed by Kolaboro, show facts only, no score, checks or label.',
    counts: { projects: ix.P.length, developers: ix.devs.size, languages: LANGS.length, urls: out.length }, redirects: [{ from: '/p/{id}/', to: '/projects/{slug}/', status: 301 }], urls: out });
}

// legal-safety scan: opinion words outside quoted buyer reviews, and fact items without a source link
function scanHtml(html) {
  const main = html.replace(/<div class="ugc"[\s\S]*?<\/div>/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/ href="[^"]*"/g, '');
  const text = strip(main), out = { opinion: [], unsourced: 0 };
  const m = text.match(new RegExp(OPINION_RX.source, 'gi')); if (m) out.opinion = [...new Set(m)].slice(0, 5);
  const items = html.match(/<li class="kfact">[\s\S]*?<\/li>|<tr class="kfact">[\s\S]*?<\/tr>/g) || [];
  out.facts = items.length; out.unsourced = items.filter(li => !/<a class="src" href="(?:https?:\/\/|\/)/.test(li)).length;
  return out;
}
async function scan(u, env) {
  const ix = await data(env), type = u.searchParams.get('type') === 'd' ? 'developers' : 'projects', lang = LANGS.includes(u.searchParams.get('lang')) ? u.searchParams.get('lang') : 'en';
  const keys = type === 'projects' ? ix.P.map(x => x.s) : [...ix.devs.keys()], from = Math.max(0, +u.searchParams.get('from') || 0), n = Math.min(400, Math.max(1, +u.searchParams.get('n') || 100));
  const res = { type, lang, total: keys.length, from, n, pages: 0, facts: 0, unsourced: 0, opinion_pages: [], unsourced_pages: [] };
  for (const k of keys.slice(from, from + n)) {
    const pg = type === 'projects' ? projectPage(ix, ix.bySlug.get(k), lang, {}) : devPage(ix, ix.devs.get(k), lang, { gleif: { ok: true, at: '', matches: [] } });
    const s = scanHtml('<main>' + pg.body + '</main>' + esc(JSON.stringify(pg.ld)) + esc(pg.title) + esc(pg.desc));
    res.pages++; res.facts += s.facts; res.unsourced += s.unsourced;
    if (s.opinion.length) res.opinion_pages.push({ slug: k, words: s.opinion });
    if (s.unsourced) res.unsourced_pages.push({ slug: k, n: s.unsourced });
  }
  return jsonOut(res, 200, { 'cache-control': 'no-store' });
}
