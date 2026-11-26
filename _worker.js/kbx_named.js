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
import { watchBox, searchBox, nf28, feedLinks, W9JS, W9CSS } from './kbx_follow.js';
import { nextStep, NX_CSS, NX_JS, filterBar, KF_CSS, KF_JS, t26 } from './kbx_u26.js';   // n26u: "What next" block with compare, save, alert, ask and share; filters and sorting on /projects/   // batch 9 (b9a): watch button, instant search, feeds (UI parts; endpoints in kbx_follow.js)
import { diffRoute, phSummary } from './kbx_named_diff.js';   // batch 9 (b9b): what-changed viewer
import { ppmSection, ppmLoad, gleifNet, networkHtml, NET_CSS, NET_JS, familyData, famNet, familyHtml } from './kbx_named_plus.js';   // n19e: corporate family (/data/gleif-family.json)
import { satData, satSection, satToc, satHeading, satLine } from './kbx_named_sat.js';
import { fcData, fcProjectHtml, fcDevGroup, rsData, rsDevHtml, rsHeading } from './kbx_fc.js';   // batch 17 (n17c): delivery forecast, developer answer speed
import { webData, webProjectHtml, webDevHealthHtml, webDevLinksHtml, webHeading } from './kbx_web.js';   // batch 18 (n18a): website health, shared website identifiers
import { watchData, watchDevHtml, watchHeading } from './kbx_watch.js';   // batch 19 (n19a): lookalike websites, sanctions screening
import { gazDevHtml, gazHeading } from './kbx_gaz.js';   // batch 21 (n21a): official gazette notices (BORME, BODACC, The Gazette)
import { cohortCard, cohortKey } from './kbx_cohort.js';
import { paperData, pricesHtml, planningHtml, paperHeading, PAPER_CSS } from './kbx_paper.js';   // batch 18 (n18d): prices over time, planning records near the site   // batch 18 (n18e): buyer group card, empty while the feature is off
import { seeData, seeHtml, seeToc, seeHeading } from './kbx_see.js';
import { filingsData, filingsDevHtml, filingsHeading } from './kbx_filings.js';   // batch 21 (n21c): official filings of listed developers
import { moneyData, moneyHtml, moneyToc, moneyHeading } from './kbx_money.js';   // batch 19 (n19b): short lets and recorded sale prices within 1 km   // batch 18 (n18c): street-level photos and 3D view
import { landData, landHtml, histHtml, landToc, landHeading, histToc, histHeading } from './kbx_land.js';
import { pinHtml, priceLink } from './kbx_n30c_named.js';   // batch 30 (n30c): pin check at the top of #land (item 17), link to the place's price history under #prices (item 18)   // batch 19 (n19c): protected land (#land), map history (#maphist)
import { calHtml, CAL_CSS } from './kbx_cal.js';   // batch 21 (n21d): where it should be by now, promised dates as a calendar file
import { aroundData, aroundPin, aroundSum, aroundHtml, climateHtml, aroundToc, aroundHeading, climateToc, climateHeading } from './kbx_around.js';   // batch 21 (n21b): around the site and distance claims (#around), climate at the plot (#climate)
import { trProject } from './kbx_tr.js';   // batch 23 (n23): rank of the project in the transparency rankings of its island or city; n24s: score, ranks and checklist in one read
import { q as qa, qaTitle, qaDesc, words, QA_CSS, months } from './kbx_named_qa.js';   // batch 24 (n24s): quick answer, question headings, search titles
import { facetsData, projFacets, devFacets, facetT } from './kbx_facets.js';   // batch 26 (n26s): what changed, total cost, official register, alternatives, comparisons, domain age, delay index, promised vs actual
import { leadMap, leadify, dlLine, devDash } from './kbx_n27lead.js';   // batch 27 (n27a): dated, sourced lead line per section; record downloads
import { ctaHtml } from './kbx_n31a.js';   // batch 31 (n31a): sticky check button on project pages
import { secZ, lightHtml, checklistHtml, Z_CSS, U27V, t27 } from './kbx_u27.js';   // batch 27 (n27u): two-level project page, six-check light, checklist, one cached client script
import { t27 as tt27 } from './kbx_t27_i18n.js';   // batch 27 (n27t): "did you buy here?", developer reply per buyer report, moderation link
import { guideLink } from './kbx_buy_i18n.js';   // batch 27 (n27c): link to the buying guide of the project's place
import { knownLine, nrNote, askHtml, closest3, cl3Html, devLate, shareText, tyTable, staticMap, satBa, vsHead, CSS31, t31 } from './kbx_n31d.js';   // batch 31 (n31d): project page items 131-155
import { light6 } from './kbx_u27.js';
import { regSale, rsText, rsNoAsk } from './kbx_n31d_rs.js';   // n31d (lead request): DLD registered sale prices are not asking prices
import { p29Project, distLine, satHtml29, ppmMedian, ppmOf, medians, companyRegs, regLi, localName, devAnswer, devFilter, DEV_CSS, DEV_JS, t29 } from './kbx_p29.js';   // batch 29 (n29p): payment plan, unit types, foreign ownership and short lets, distances, place median per m2, satellite line, same-place projects, company registers, local names, developer quick answer and filters
import { slipLine } from './kbx_n30a.js';   // batch 30 (n30a): handover slippage of the market, live
import { trustBlock, kindIco, t31 as tb31, loadS as loadS31 } from './kbx_n31b_page.js';
import { pTitle as pTitle33, pDesc as pDesc33, dTitle as dTitle33, dHead as dHead33, ccData as ccData33, t as t33 } from './kbx_n33c.js';   // batch 33 (n33c): titles and descriptions from the page data (/data/i18n/kbx_n33c.json)
import { load as loadS32, doneLab, isDone } from './kbx_n32s.js';   // batch 32 (n32s, item 199): title words for completed projects (/data/n32s-i18n.json)   // batch 31 (n31b): what is confirmed and how fresh, sources by kind, report an error per line
import { rulesData } from './kbx_rules.js';
import { seoLd } from './kbx_lastmod.js';   // batch 15 (s15b): true dateModified and ImageObject in the JSON-LD   // batch 14 (f14b): construction progress from space   // batch 10 (b10c): price per m2 vs official data, company network graph

import { dldKf, wbLine, wayback as wbData, setLive as aliasLive } from './kbx_n31c.js';   // n31c (batch 31): DLD register tile, Wayback copies line, live alias map
const ORIGIN = 'https://kolaboro.com';
const RESERVED = new Set(['benchmark', 'reply', 'self-check', 'templates', 'index', 'index.html']);
const CACHE_V = 'named-v151';   // v151: facts line class without the shared box style (n40 k8);   // v150: place, handover and permit under the project title (n40 k8);   // v149: a later whole year (2027 to 2028) counts as a moved handover (n40 k8);   // v148: fingerprint shortened with one ellipsis, full hash on hover (n40 k6);   // v147: dated public facts in the developer answer (n40 k8);   // v146: plural of the street photo count (n40 k6);   // v145: robots allow large image previews on named pages (n40 k3);   // v144: satellite, street view and radar strings read from /data/media-i18n.json (n40 k4);   // v142: lang on Latin names in ar, ru, zh (n40 r1c);   // v141: neutral conflict-of-interest line on /projects/ (n40 r1d);   // v140: corrections link prefills the page, developer facts headed 'What public records say' (n40 r1c);   // v138: source links in fact lines as 24 px tap targets (n38 d5); v137: singular '1 statement' link (n38 d2); v136: developer titles without the review word, singular '1 source' on the six-checks card (n38 d2); v135: project H1 is the name alone, no 'reviews' in titles, deduped place names (n38 d4); v134: 75 new projects (56 Dubai DLD register, 19 Malaysia KPKT register), register handover dates on 26 tracked Malaysian projects (r11p); v133: 113 new projects (62 Dubai DLD register, 39 Malaysia KPKT register, 12 Aldar launches), 159 facts on tracked projects (r10p); v132: 1 more Abu Dhabi project and dated Aldar release facts on 13 tracked projects (r9p); v131: 119 new projects (114 Malaysia from the KPKT TEDUH register, Abu Dhabi, Portugal), 108 facts on tracked projects (r9p); v130: 114 new Malaysian projects from the KPKT TEDUH register, register facts on 70 tracked Malaysian projects (r8p); v129: the copies line of "what changed" links the page language too (r7u); v128: the "what changed" links open the change viewer in the page language, previous copy answered on a miss (r7u); v127: 120 new Dubai projects from the DLD register, 548 register facts on tracked Dubai projects (r7p); v126: 1 new Sansiri project in Pattaya, 156 facts on tracked Thai, Bali and Lombok projects (r6p); v125: 69 new projects in Spain (Metrovacesa, Neinor Homes), 152 facts on tracked Spanish projects (r5p); v124: 90 new projects in Australia, 151 facts on tracked Australian and UK projects (r4p); v123: 120 new projects in the Riviera Maya (Mexico) and South Florida, 152 facts on tracked projects (r3p); v122: 116 new projects in Turkey and Northern Cyprus, 80 facts on tracked projects (r2p); v121: 120 new projects (Dubai register, RAK, Abu Dhabi, Portugal) and 350+ facts on tracked projects (r1p); v120: the pre-purchase button opens the request form with the project filled in, in the page language (n36e); v119: header date says "Updated" when it is a data change after the last check (n36e); v118: 156 new projects, Dubai register, Bangkok, Malaysia, Japan, Vietnam, Cambodia, Spain (n36d); v116: status card v2, journey link, flag button size, developer answer without the repeated date (n35b); v115: "all questions" link in Questions to ask (n34b); v114: v113: the Kolaboro ID shown as text, not a link to its own 301 (n33l); v112: "Embed these facts" tile in What next (n33b); v111: project questions always answer payment plan, unit types and units, registered company; developer table compares price from and units (n33p); v110: n33a JSON-LD (containedInPlace, sameAs, image credits, developer entity name in crumbs) and Markdown alternate; v109: titles and descriptions from the page data, Kolaboro ID under the title, court cases on developer pages (n33c); v108: links to the entity graph, website changes and anomaly radar on developer pages (n32x); v107: titles for completed projects, "save" in What next says the same as the star button, plainer website and register words (n32s); v106: payment plans, launch dates, Maldives, court case claims, 13 pins (n32d); v105: DLD registration and start dates in the register tile, 24 developer pins (n31c); v104: trust block under the six-check light, sources by kind, report an error per line (n31b); v103: DLD registered sale prices labelled as registered sales, not as an asking price, and left out of asking-price comparisons (n31d); v102: developer Organization in JSON-LD uses the developer page's name on every project page (n31s); v101: sticky "Check this project" button with price and report time, exit question, save count (n31a); v100: answer opens with what we know and what we do not, six checks inside it, last check date large, notice on unreviewed pages, questions for the developer, three closest projects, developer delays, claims side by side, unit types table, static pin map, share text, one "what changed" section when empty (n31d); v99: DLD register tile (number, status, % built at the last inspection, escrow bank, units), dated Internet Archive copies, developer and project aliases (n31c); v98: 256 Dubai DLD register projects, register refresh, companies, payment plans (n31r); v97: 150 new projects in 20 countries, counts on rankings and place pages (n30p); v96: compare up to 4 with the six-check radar, timeline link, live handover slippage line, contract reader link, before/after satellite slider (n30a); v95: verification certificate link in the record downloads line (n30b); v94: pin check (land, protected areas, flood) at the top of #land, link to the place's price history (n30c);   // v93: Sumba left out of country pages, two duplicate records point to the first (n29q);   // v92: singular forms for one project, one copy, one change; forecast line number-neutral (n28a); v91: link to the place's tax and fee page (n29h2); v90: sources as isBasedOn, satellite captions with the place, ItemList of markets on /projects/ (n29t); v89: payment plan, unit types and floor plans, foreign ownership and short-let rules, place median per m2, distances, satellite line, same-place projects, company registers, Thai register names, developer quick answer and filters (n29p); v88: native place names, market file links in the page language, mentions in JSON-LD (n29i); v87: links to the 8 new country buying guides and a second neighbourhood page (n29h2); v86: share image on hubs without their own card (n28a); v85: quoted price context trimmed to whole words (n28a); v84: localized LEI register date on developer pages (n28a); v83: /projects/ counts in the page locale and a line on the Sumba projects left out (n28b); v82: folded sections not estimated off screen, contents links land where they point (n28b); v81: tap targets on developer feeds and project lists (n28c); v80: folded sections sized right (no scroll jumps), no links inside section toggles, colour key with dots, honest watch box (n28b); v79: honest CTA, site visits by a local agent are on request (n27z); v78: six-check light as two columns on phones, print opens the hero and folded sections (n27u); v77: source type under each claim's source (official register, developer, press, portal) and the review date line (n27r2); v76: latest dated handover on record (phased or moved), n27g; v75: developer's dated promises next to the developer, link to the buying guide of the place (n27c); v74: DLD and RAK RERA register facts and developer-page quotes for the 150 most searched projects in UAE, Middle East, Europe and Africa (n27r1); v73: overdue notice, updated date, titles with the year, shorter repeated notes (n27g); v72: "did you buy here?" in the quick answer, developer reply under each buyer report, moderation link (n27t); v71: two-level project page (sections folded), six-check traffic light, before-you-sign checklist, page scripts in one cached file (n27u); v70: watch box offers the free project report and PDF (n27e); v69: dated, sourced lead line per section, record downloads, developer dashboard link (n27a); v68: what changed, total cost, official register, alternatives, comparisons, domain age, delay index, promised vs actual (n26s); v67: /projects/ carries the least-linked project pages (n26i); v66: My projects link without a direction arrow (RTL) (n26u); v65: "What next" block (compare, save, alert, ask, share), filters and sorting on /projects/, watch box titled "Alert me if the date or price changes" (n26u)
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
// n29q: one project recorded twice under two ids (same name, developer group and address; the n29t audit found their titles shared).
// The later record keeps its page but names the first as canonical and leaves the sitemap. Merge them in the data pipeline (named.py).
const DUP_OF = { 'VNM-008': 'SGN-002', 'KUA-003': 'MYS-017' };
// display name: drop research notes the discovery model left inside parentheses ("not the X in Y", "listing 1097")
function cleanName(n) {
  return String(n).replace(/\s*\(([^)]*)\)/g, (m, inner) => {
    const keep = inner.split(/\s*[;,]\s*/).filter(t => t && !/^not the\b/i.test(t) && !/^listing \d+$/i.test(t));
    return keep.length ? ' (' + keep.join(', ') + ')' : '';
  }).trim();
}
let IDX = null;
const RAWN = new WeakMap();
let STALE = { t: 0, v: false };
async function staleIsolate(env) {   // n31t: is a newer deployment live than the one running this code? (checked at most every 30 s)
  if (Date.now() - STALE.t < 30000) return STALE.v;
  let v = false; const mine = String((env && env.CF_PAGES_COMMIT_SHA) || '');
  if (mine) { try { const r = await fetch(ORIGIN + '/api/open/build?i=' + Date.now(), { headers: { accept: 'application/json' }, cf: { cacheTtl: 0 }, signal: AbortSignal.timeout(3000) }); if (r.ok) { const c = String((await r.json()).commit || ''); v = !!c && c !== mine; } } catch (e) {} }
  STALE = { t: Date.now(), v }; return v;
}
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
  // n29i (item 96): one name per developer page: the spelling most of its projects use ("Samana Developers" 10, "SAMANA Developers" 10:
  // the first one met wins a tie); each project keeps the name as published
  for (const d of devs.values()) { const c = new Map(); for (const id of d.ids) { const v = byId.get(id).dv; if (v) c.set(v, (c.get(v) || 0) + 1); } let b = d.n, bn = 0; for (const [v, k] of c) if (k > bn) { b = v; bn = k; } d.n = b; }
  const dmk = new Map(((delay && delay.markets) || []).map(m => [m.market, m]));
  aliasLive(named.aliases);
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
// n29i: the market file in the page language where it exists (5+ named projects, kbx_n29i.js), else the English one
const mkHref = (ix, x, lang) => (lang !== 'en' && ((ix.mk.get(x.mk) || {}).k || 0) >= 5 ? pre(lang) : '') + '/m/' + slugM(x.mk) + '/';
const decodeSafe = u => { try { return decodeURIComponent(u); } catch (e) { return u; } };
const PLURAL1 = { g_moved: 'k', pr_moved: 'k', g_d: 'k', mk_line: 'k', a_change_k: 'k' };   // n28a: mk_line, a_change_k   // n19f: a key_1 form exists for these in most languages; used when the count is 1
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
const srcLi = (u, many) => { const p = String(u).replace(/^https?:\/\/[^/]+/, '') || '/'; return '<li><a href="' + esc(fixU(u)) + '" rel="nofollow noopener" target="_blank">' + esc(host(u)) + '</a>' + (!many || OPINION_RX.test(decodeSafe(u)) || p === '/' ? '' : ' <small>' + esc(p.length > 80 ? p.slice(0, 80) + '...' : p) + '</small>') + '</li>'; };   // n31b: the path only, and only when the same site is listed more than once (the host is the link text)
// n19f: in Arabic pages a Latin project, developer or place name next to Arabic text and punctuation is isolated with <bdi>,
// so a colon or comma lands on the right side. Only applied to text-only fragments (no attributes carry these names there).
const LNX = lang => /^(ar|ru|zh)$/.test(lang) ? ' lang="en"' : '';   // n40 R01-24: Latin-script names on Arabic, Russian and Chinese pages carry a language
const bidi = (lang, html, names) => {
  if (!LNX(lang)) return html;
  const E = [...new Set(names.filter(n => n && String(n).length > 2 && !/[\u0600-\u06FF]/.test(n)).map(esc))].sort((a, b) => b.length - a.length);
  if (!E.length) return html;
  const rx = new RegExp(E.map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  return html.split(/(<[^>]*>)/).map((t, i) => i % 2 ? t : t.replace(rx, '<bdi lang="en">$&</bdi>')).join('');   // text between tags only
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
// n27g (batch 27): the handover on record is the LATEST dated handover we hold. A promise whose stored date is older than a date in
// its own dated history, its research date (rd) or the developer's current published date (fx) was moved or is phased ("phase 1
// September 2024, last phase September 2027"): the later date is used, and a "kept" status (it described the earlier date or phase)
// becomes "pending" when the later date is ahead and "unknown" when it has passed. Flag ph marks such a promise.
const HO_ADJ = new WeakMap();
const hstart = d => { const P = hparse(d); if (!P) return null; const v = P.a; const m = v.m || (v.q ? v.q * 3 - 2 : v.h ? v.h * 6 - 5 : v.p ? { b: 1, m: 4, l: 9, e: 10 }[v.p] : v.s ? { sp: 3, su: 6, au: 9, wi: 12 }[v.s] : 1); return v.y + '-' + String(m).padStart(2, '0'); };
// n27r2 (item 44): what kind of source each claim comes from: official register, the developer, press or other, listing portal
const SQ_REG = /(^|\.)(gov|gob|gouv|govt|go|gc)\.[a-z]{2}$|\.gov$|(^|\.)(myfloridalicense\.com|set\.or\.th|bursamalaysia\.com|idx\.co\.id|sgx\.com|dubairealestateiq\.com|mun\.rak\.ae|boe\.es|bodacc\.fr|thegazette\.co\.uk|kap\.org\.tr|adxinteract\.com|datoscif\.es|bahrain\.bh|catastro\.(?:meh|minhap)\.es)$/i;
const SQ_PRESS = /(news|times|post|herald|yimby|therealdeal|theedge|vietnamnet|reuters|bloomberg|cnbc|forbes|thestar|bangkokpost|nationthailand|prachachat|eleconomista|elfinanciero|acento|renx|dailyhive|businesstoday|skyscraper)/i;
const SQ_L = { en: ['official register', 'developer', 'press or other', 'listing portal'], es: ['registro oficial', 'promotor', 'prensa u otra', 'portal de anuncios'], fr: ['registre officiel', 'promoteur', 'presse ou autre', 'portail d’annonces'], de: ['amtliches Register', 'Bauträger', 'Presse oder andere', 'Inseratsportal'], ru: ['официальный реестр', 'застройщик', 'пресса или другое', 'портал объявлений'], zh: ['官方登记', '开发商', '媒体或其他', '房源网站'], ar: ['سجل رسمي', 'المطوّر', 'صحافة أو غيرها', 'بوابة إعلانات'], nl: ['officieel register', 'ontwikkelaar', 'pers of overig', 'advertentieportaal'] };
function srcKind(u, x) {
  const h = host(u); if (!h) return -1;
  if (SQ_REG.test(h)) return 0;
  if (isListing(u)) return 3;
  const lab = h.split('.')[0].replace(/-/g, ''), dv = String(x.dvs || '').replace(/-/g, '');
  const own = [x.url, x.du].map(host).filter(d => d && !SQ_PRESS.test(d) && !PORTAL_RX.test('.' + d));
  if (own.some(d => h === d || h.endsWith('.' + d) || d.endsWith('.' + h)) || (lab.length >= 4 && dv.length >= 4 && (dv.includes(lab) || lab.includes(dv)))) return 1;
  return 2;
}
const RVW_L = { en: 'Reviewed on {d}: developer page or official register read, register looked up, handover date checked.', es: 'Revisado el {d}: leída la web del promotor o el registro oficial, consultado el registro y comprobada la fecha de entrega.', fr: 'Examiné le {d} : page du promoteur ou registre officiel lu, registre consulté, date de livraison vérifiée.', de: 'Geprüft am {d}: Seite des Bauträgers oder amtliches Register gelesen, Register abgefragt, Übergabetermin geprüft.', ru: 'Проверено {d}: прочитаны сайт застройщика или официальный реестр, выполнен поиск в реестре, проверена дата сдачи.', zh: '审核于 {d}：已阅读开发商页面或官方登记，已查询登记，已核对交付日期。', ar: 'رُوجع في {d}: قُرئت صفحة المطوّر أو السجل الرسمي، وجرى البحث في السجل، وتم التحقق من موعد التسليم.', nl: 'Beoordeeld op {d}: pagina van de ontwikkelaar of officieel register gelezen, register geraadpleegd, opleverdatum gecontroleerd.' };
const srcKindHtml = (u, x, lang) => { const k = srcKind(u, x); return k < 0 ? '' : '<br>' + kindIco(k, lang); };   // n31b: icon and label (item 68)
function handoverOf(ix, x) {
  const pr = ix.prom[x.id] || [], h = pr.find(p => p.k === 'handover');
  if (h) {
    let A = HO_ADJ.get(h);
    if (A === undefined) {
      A = null; const k0 = hkey(h.d);
      if (k0) {
        let best = null, bk = k0;
        // a later date must start after the stored period ends: "2027-08" and "Q3 2027", or "June 2026" and "2026", are the same date
        // hist entries count only when seen on or after the stored date was first seen; the research date (rd) and the developer's
        // current published date (fx) always count; a gap under 3 months between two sources is read as the same date
        const seen0 = ((h.hist || []).find(e => e && e.d === h.d) || {}).seen || '', mi = k => { const [y, m] = k.split('-').map(Number); return y * 12 + m; };
        for (const d of [...(h.hist || []).filter(e => e && e.seen >= seen0).map(e => e.d), h.rd, (x.fx || {}).handover_promised]) { const k = d && hkey(d), s0 = d && hstart(d); if (k && s0 && (mi(s0) >= mi(k0) + 3 || (/^\d{4}$/.test(String(h.d).trim()) && /^\d{4}$/.test(String(d).trim()) && +d > +h.d)) && k > bk) { bk = k; best = d; } }   // n40 k8: a later whole year (2027 to 2028) is a move too
        if (best) { const now = new Date(), cur = now.getUTCFullYear() + '-' + String(now.getUTCMonth() + 1).padStart(2, '0'); A = Object.assign({}, h, { d: best, st: bk >= cur ? 'pending' : 'unknown', ph: true, d0: h.d, st0: h.st }); }
      }
      HO_ADJ.set(h, A);
    }
    return A ? { d: A.d, p: A } : { d: h.d, p: h };
  }
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
    const cap = tr(lang, 'img_sat', { n: x.n + (x.mk ? ' (' + mkName(x.mk, lang) + ')' : ''), a: ymFmt(r.m0, lang), b: ymFmt(last, lang) }), u = ORIGIN + '/k/sat/proj/' + encodeURIComponent(x.id) + '.jpg?v=' + encodeURIComponent(r.v);
    out.push({ '@id': canon + '#sat', url: u, contentUrl: u, caption: cap, name: cap, creditText: 'Contains modified Copernicus Sentinel data', license: 'https://sentinels.copernicus.eu/documents/247904/690755/Sentinel_Data_Legal_Notice', acquireLicensePage: ORIGIN + '/satellite/',
      // n33a (item 84): who made the image and from which source: Sentinel-2 imagery of the EU Copernicus programme, cut and dated by Kolaboro
      copyrightNotice: 'Contains modified Copernicus Sentinel data ' + r.m0.slice(0, 4) + '-' + last.slice(0, 4), creator: { '@id': ORIGIN + '/#org' }, isBasedOn: 'https://sentinels.copernicus.eu/web/sentinel/missions/sentinel-2', encodingFormat: 'image/jpeg' });
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
export const LL_CSS = '<style>.kll{padding:28px 0;border-top:1px solid var(--line)}.kll h2{font-size:1.25rem;margin:0 0 4px}.kll-s{color:var(--muted);margin:0 0 12px}.kll-l{columns:3 220px;padding-inline-start:18px;margin:0}.kll-l li{margin:0 0 8px;break-inside:avoid}.kll-l small{color:var(--muted)}@media (max-width:600px),(pointer:coarse){.kll-l li{margin:0}.kll-l a{display:inline-block;padding:12px 0;min-height:44px;box-sizing:border-box}}</style>';

// n24s (batch 24): the quick answer, 40 to 60 words, only from fields we hold: what it is, developer, place, handover date as
// published (and its moves), permit published yes or no, transparency score and rank in its place, our review status, last checked.
// Parts are dropped in a fixed order when the English text runs over 60 words, so every language carries the same facts.
// o.rvN: verified buyer reviews (undefined: unknown, the sentence is left out); o.checked: last checked date. Also used by
// /api/seo/urls (summary), llms-full.txt and the answer files.
function qaSentences(ix, x, lang, tp, o) {
  const c = ix.caseBy.get(x.id) || {}, cl = c.claims || { verified: 0, unverified: 0, contradicted: 0 }, cN = (cl.verified || 0) + (cl.unverified || 0) + (cl.contradicted || 0), rvd = reviewed(c);
  const ho = handoverOf(ix, x), hand = ho && ho.p ? ho.p : (ix.prom[x.id] || []).find(p => p.k === 'handover'), name = x.n, checked = (o && o.checked) || lastmod(ix, x), rvN = o ? o.rvN : undefined;
  const place0 = [x.ar, x.mk !== x.ar ? x.mk : null, x.co !== x.mk ? x.co : null].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', '), place2 = [x.mk, x.co !== x.mk ? x.co : null].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', ');
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

// n33c (item 39): FAQPage keeps the questions the page shows (hidden ones out) whose answer comes from the data; the generic notes
// ("buyer reviews are published after moderation", "the register could not be reached") stay on the page but not in the FAQPage
function faq33(FAQ, lang) { const G = new Set(['a_rev', 'a_drev', 'a_dreg_err'].map(k => dot(tr(lang, k)))); return FAQ.filter(f => !f[3] && f[1] && !G.has(f[1])); }
// ------------------------------------------------------------------------------------------------ project page
function projectPage(ix, x, lang, extra) {
  const sec = secZ;   // n27u: every section folded below the quick answer and the six-check light (content stays in the HTML)
  const c = ix.caseBy.get(x.id), ck = c.checks || {}, vf = c.verified || {}, cl = c.claims || { verified: 0, unverified: 0, contradicted: 0 };
  const name = x.n, place = placeName([x.ar, x.mk !== x.ar ? x.mk : null, x.co !== x.mk ? x.co : null].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', '), lang);   // n25t: country localized
  const stage = tr(lang, stageKey(c.stage || x.st)), ho = handoverOf(ix, x), checked = lastmod(ix, x);
  const page = x.url, pr = (ix.prom[x.id] || []).slice(0, 12).map(p => p.k === 'handover' && handoverOf(ix, x) && handoverOf(ix, x).p && handoverOf(ix, x).p.ph ? handoverOf(ix, x).p : p), hand = pr.find(p => p.k === 'handover');   // n27g: latest dated handover
  const ov = overdueOf(ix, x), ovN = ov ? ov.m : 0;   // n27g: months since the handover date on record passed (null: not overdue)
  const cN = cl.verified + cl.unverified + cl.contradicted, rvd = reviewed(c), nrB = tr(lang, 'nr_badge', { d: fd(x.ad || c.checked, lang) });
  const canon = pUrl(lang, x.s), devPage = x.dvs && ix.devs.has(x.dvs) ? dUrl(lang, x.dvs) : null, rec = '/api/open/projects/' + encodeURIComponent(x.id);
  // s15a: the description answers the search ("<project> reviews / opiniones / avis ...") with our data, in the page's language
  const rv = extra.reviews || { approved_total: 0, reports: [] }, rvN = rv.approved_total || 0;
  const dv0 = { n: name, place, stage, by: x.dv ? tr(lang, 'by_dev', { dev: x.dv }) : '', h: ho ? fd(ho.d, lang) : tr(lang, 'v_none'), pn: x.pn ? tr(lang, 'v_pub') : tr(lang, 'v_notpub'), c: cN, v: cl.verified, r: rvN ? num(rvN, lang) : tr(lang, 'r_none'), d: fd(checked, lang) };
  // n24s: the transparency score and the rank in its island or city (kbx_tr.js), used by the quick answer, the checklist and the FAQ
  const tp = extra.trp || null, rk = tp ? (tp.ranks.find(r => r.ranked) || null) : null, tpS = tp ? num(tp.score, lang) : null;
  const place2 = placeName([x.mk, x.co !== x.mk ? x.co : null].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', '), lang), bdq = t => bidi(lang, esc(t), [name]);
  // n24s: search title under 60 characters and description under 155, with the searched word and the most clicked fact
  // n27g: with the year, an overdue handover where it fits, and the description opening with the overdue date, the moves or no permit
  const nfL = v => num(v, lang), yNow = new Date().getUTCFullYear();
  const dn33 = isDone(x, c) ? doneLab(lang) : null;
  // n33c (items 27, 40): the handover date and the permit status in the title itself, facts before the brand
  const title = pTitle33(lang, { n: name, y: yNow, h: ho ? fd(ho.d, lang) : null, hy: ho ? ((/(20\d\d)/.exec(String(ho.d)) || [])[1] || null) : null, pn: !!x.pn, ov: ovN, mm: ovN ? months(lang, ovN, lang === 'ar' ? 'gen' : 'nom', nfL) : '', dn: dn33 && dn33[0] ? dn33 : null }, qa) || qaTitle(lang, { n: name, h: ho ? fd(ho.d, lang) : null, pn: !!x.pn, dv: x.dv, y: yNow, ov: ovN, nf: nfL, dn: dn33 });   // n32s (item 199): completed projects
  // n33c (items 28, 38): warning first, then the completion date, the price as published with the date the page was read, the payment plan
  const fx33 = x.fx || {}, rs33 = regSale(x), pr33 = fx33.price_min > 0 && !rs33 ? (fx33.currency ? fx33.currency + ' ' : '') + num(fx33.price_min, lang) : null;
  const desc = dot(pDesc33(lang, { n: name, by: dv0.by, place, place2, h: ho ? fd(ho.d, lang) : null, pn: !!x.pn, ov: ovN, mmD: ovN ? months(lang, ovN, lang === 'de' ? 'dat' : 'nom', nfL) : '', mv: hand && hand.mv ? hand.mv : 0, nf: nfL,
    price: pr33, readD: fd(x.sealed || x.ad || checked, lang), plan: !!(fx33.payment_plan || fx33.deposit_pct), d: fd(checked, lang) }, qa) || qaDesc(lang, { n: name, by: dv0.by, place, place2, h: ho ? fd(ho.d, lang) : null, pn: !!x.pn, s: tp ? tpS : null, rv: rvd, d: fd(checked, lang), ov: ovN, mv: hand && hand.mv ? hand.mv : 0, nf: nfL }));

  // in short (answer-ready summary)
  const g = [];
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
    kf('k_permit', x.pn ? en(x.pn) : esc(tr(lang, 'v_notpub')), x.pn ? (x.du || page) : null) + dldKf(x, lang) +
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
  const RS = regSale(x);
  if (fx.price_min && !RS) F.push([tr(lang, 'f_price'), cur + num(fx.price_min, lang) + (fx.price_max ? ' - ' + num(fx.price_max, lang) : '')]);
  // n29p: units, sizes, types, payment plan, deposit and ownership terms moved to #floor-plans, #payment-plan and #buy-rules (P29)
  for (const [k, l] of [['service_charge', 'f_service'], ['brand', 'f_brand'], ['permit_authority', 'f_auth']]) if (fx[k]) F.push([tr(lang, l), String(fx[k])]);
  if (fx.construction_start) F.push([tr(lang, 'f_start'), fd(fx.construction_start, lang), esc(fd(fx.construction_start, lang)) + asPub(fx.construction_start, lang)]);
  if (fx.handover_promised) F.push([tr(lang, 'f_hand'), fd(fx.handover_promised, lang), esc(fd(fx.handover_promised, lang)) + asPub(fx.handover_promised, lang)]);
  if (fx.original_handover && fx.original_handover !== fx.handover_promised) F.push([tr(lang, 'f_orig'), fd(fx.original_handover, lang), esc(fd(fx.original_handover, lang)) + asPub(fx.original_handover, lang)]);
  // n24s: "How much does it cost?": prices and payment plan as published, the date of the copy we read, "not published" when missing
  const readD = fd(x.sealed || x.ad || checked, lang);
  const costTop = fact(esc(qa(lang, 'c_read', { d: readD })), page) + (fx.price_min && !RS ? '' : '<li>' + esc(RS ? rsNoAsk(lang) : qa(lang, 'c_price0')) + '</li>' + (RS ? fact(esc(rsText(lang, RS)), RS.src || page) : ''));   // n29p: "payment plan not published" now in #payment-plan
  const P29 = p29Project(ix, x, lang, c, { tr, qa, fd, cleanOk, coName, page, read: readD, rvd }, Object.assign({}, extra.money || {}, { ru: (extra.money && extra.money.ru) || extra.ru29 || null }));
  const clSet = new Set((x.cl || []).filter(r => cleanOk(r[0])).map(r => String(r[0]).trim())), clDup = (x.dl || []).filter(t => cleanOk(t) && clSet.has(String(t).trim())).length;   // n31d
  const promised = '<ul class="fl">' + costTop +   // n27g: the generic intro line was dropped (repeated on every page; each fact carries its source)
    F.filter(f => cleanOk(f[1])).map(f => fact('<b>' + esc(f[0]) + ':</b> ' + (f[2] != null ? f[2] : en(f[1])), page)).join('') +
    (x.dl || []).filter(t => cleanOk(t) && !clSet.has(String(t).trim())).map(t => fact(en(t), x.du || page)).join('') + (clDup ? '<li><a href="#claims">' + esc(t31(lang, clDup === 1 && ['en', 'es', 'fr', 'de', 'nl', 'ru'].includes(lang) ? 'stmt1' : 'stmt', { k: num(clDup, lang), h: tr(lang, 's_claims') })) + '</a></li>' : '') + '</ul>';

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
  const satHtml = extra.sat ? satSection(extra.sat, x.id, ix.prom[x.id] || [], fx, lang, d => fd(d, lang), k => tr(lang, 'pk_' + k), d => tr(lang, 'sat_tile', { n: name + (x.mk ? ' (' + mkName(x.mk, lang) + ')' : ''), d })) : '';

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
  const rvwP = x.rvw && x.rvw.ok && x.rvw.d ? '<p class="ki">' + esc((RVW_L[lang] || RVW_L.en).replace('{d}', fd(x.rvw.d, lang))) + '</p>' : '';   // n27r2: review record from named.json (n27r1/n27r2)
  const claims = rvwP + (CL.length ? '<div class="tw"><table class="k31v"><thead>' + vsHead(lang) + '</thead><tbody>' +   // n31d (item 140): what the source says next to what the records show
    CL.map(r => '<tr class="kfact"><td>' + en(r[0]) + ' ' + srcA(r[3]) + srcKindHtml(r[3], x, lang) + '</td><td><span class="kpill c-' + esc(r[1]) + '">' + esc(tr(lang, 'cs_' + r[1])) + '</span>' + (r[2] && r[2] !== 'none' ? ' ' + (r[2] === 'independent' || r[2] === 'registry' ? esc(tr(lang, 'by_' + r[2])) : en(r[2])) : '') + '</td></tr>').join('') + '</tbody></table></div>' : '<p>' + esc(tr(lang, 'no_hist')) + '</p>');

  // history
  const H = [];
  for (const h of c.history || []) H.push([h.d, fact(esc(fd(h.d, lang)) + ': ' + esc(tr(lang, 'hist_row', { f: tr(lang, HF[h.f] || 'hf_units'), a: hv(h.from, lang), b: hv(h.to, lang) })), page)]);
  const fdx = ix.find[x.id];
  for (const f of ((fdx && fdx.f) || []).slice(0, 8)) { const t = String(f.text || '').replace(/^[A-Z]{2,5}-\d{3,4}\s*·\s*/, ''); if (cleanOk(t)) H.push([iso(f.at), fact(esc(fd(f.at, lang)) + ' · ' + esc(tr(lang, 'hist_hourly')) + ': ' + en(t) + (f.fp ? ' <small>(SHA-256 ' + esc(f.fp) + '...)</small>' : ''), page)]); }
  H.sort((a, b) => String(b[0]).localeCompare(String(a[0])));
  const fpd = x.sha || (c.fp || {}).sha256;
  const ph = extra.ph, chg = pre(lang) + '/projects/' + x.s + '/changes/';   // r7u: the change viewer in the page language
  const phLine = ph && ph.n ? fact(esc(ph.n > 1 ? tr(lang, 'ph_line', { n: ph.n, a: fd(ph.first, lang), b: fd(ph.last, lang), c: ph.changed }) : tr(lang, 'ph_one', { a: fd(ph.first, lang) })) + ' <a class="more" href="' + chg + '">' + esc(tr(lang, ph.n > 1 ? 'ph_link' : 'ph_link1')) + '</a>', chg, tr(lang, 'ph_src')) : '';
  const chMerge = !!(extra.fac && !H.length);   // n31d (item 133): the two "what changed" sections become one when neither has a dated change
  const history = (chMerge ? '%%CHM%%' : '') + '<ul class="fl">' + phLine + (H.map(h => h[1]).join('') || (phLine || chMerge ? '' : '<li>' + esc(tr(lang, 'no_hist')) + '</li>')) +
    (fpd ? fact(tr(lang, 'fp_line', { d: esc(fd(x.sealed || (c.fp || {}).date, lang)), h: '<code title="' + esc(fpd) + '">' + esc(fpd.slice(0, 16)) + '\u2026</code>', link: own('/verify/', tr(lang, 'm_verify')) }), '/verify/', 'kolaboro.com/verify') : '') +
    (c.sat ? fact(esc(tr(lang, 'sat_line', { d: fd(c.sat.date, lang), st: tr(lang, c.sat.status === 'visible change' ? 'sat_visible' : 'sat_none'), pct: c.sat.changed_pct })), '/satellite/', 'kolaboro.com/satellite') : '') + '</ul>';

  // public reports
  const FL = x.fl || [];
  const reports = '<p class="ki">' + esc(tr(lang, 'rep_intro')) + '</p><ul class="fl">' + (FL.map(f => fact(esc(tr(lang, 'rc_' + f[0])), f[1])).join('') || '<li>' + esc(tr(lang, 'no_reports')) + '</li>') + '</ul>';

  // developer
  const DF = [['developer_founded', 'df_founded'], ['developer_hq', 'df_hq'], ['developer_company', 'df_company'], ['developer_projects_delivered', 'df_delivered'], ['developer_units_delivered', 'df_units'], ['listed_or_audited', 'df_listed']];
  const others = devPage ? ix.devs.get(x.dvs).ids.filter(i => i !== x.id).map(i => ix.byId.get(i)).filter(Boolean).sort((a, b) => (b.mk === x.mk) - (a.mk === x.mk)).slice(0, 12) : [];
  const othSame = others.filter(o => o.mk === x.mk), othElse = others.filter(o => o.mk !== x.mk);   // n29p (item 12): the same place first, under its own heading
  const cRegs = extra.fac ? companyRegs(extra.fac.REG, x) : [];   // n29p (item 14): the official company register of the place
  const devN = devPage ? ix.devs.get(x.dvs).ids.length : 0;
  // n27c (item 11): the developer's dated promises on record across its tracked projects, the fact portal listings leave out (same figures as the developer page)
  const devPr = devN > 1 ? ix.devs.get(x.dvs).ids.flatMap(i => ix.prom[i] || []) : [], devRec = devPr.length ? tr(lang, 'g_d_rec', { p: devPr.length, kept: devPr.filter(p => p.st === 'kept').length, broken: devPr.filter(p => p.st === 'broken').length, moved: devPr.filter(p => p.st === 'moved').length, pending: devPr.filter(p => p.st === 'pending').length }) : '';
  const devsec = x.dv ? '<ul class="fl">' + fact(esc(qa(lang, 'who_l', { n: name, dev: x.dv })) + (devN > 1 ? ' ' + esc(qa(lang, 'who_k', { dev: x.dv, k: num(devN, lang) })) : ''), page) + (devRec ? fact(esc(devRec), '/promises/', tr(lang, 'm_promises')) : '') + DF.filter(([k]) => fx[k] != null && cleanOk(String(fx[k]))).map(([k, l]) => fact('<b>' + esc(tr(lang, l)) + ':</b> ' + en(String(fx[k])), page)).join('') +
    (x.ev && x.ev.record && cleanOk(x.ev.record) ? fact(en(x.ev.record), page) : '') + (FX ? FX.active + FX.dom : '') + devLate(lang, ix, x, overdueOf, devPage ? devPage.replace(ORIGIN, '') : '') + cRegs.slice(0, 2).map(r => regLi(lang, r, mkName(r.market === x.mk ? x.mk : x.co, lang) || r.market)).join('') + '</ul>' +
    (othSame.length ? '<h3>' + esc(t29(lang, 'sd_h', { dev: x.dv, mk: mkName(x.mk, lang) })) + '</h3><ul class="lk">' + othSame.map(o => '<li><a href="' + pre(lang) + '/projects/' + o.s + '/">' + esc(o.n) + '</a>' + (o.ar && o.ar !== o.mk ? ' <small>' + esc(o.ar) + '</small>' : '') + '</li>').join('') + '</ul>' : '') +
    (othElse.length ? '<h3>' + esc(tr(lang, 'dev_other', { dev: x.dv })) + '</h3><ul class="lk">' + othElse.map(o => '<li><a href="' + pre(lang) + '/projects/' + o.s + '/">' + esc(o.n) + '</a> <small>' + esc(mkName(o.mk, lang)) + '</small></li>').join('') + '</ul>' : '') +
    (devPage ? '<p><a class="more" href="' + devPage.replace(ORIGIN, '') + '">' + esc(tr(lang, 'dev_link', { dev: x.dv })) + '</a>' + (devN > 1 && extra.fac ? ' <a class="more" href="' + devPage.replace(ORIGIN, '') + '#promised">' + esc(t29(lang, 'drec', { dev: x.dv })) + '</a>' : '') + '</p>' : '') : '<p>' + esc(tr(lang, 'dev_none')) + '</p>';

  // similar
  const SM = (ix.sim[x.id] || []).map(r => ix.byId.get(r[0])).filter(Boolean).slice(0, 5);
  const similar = SM.length ? '<ul class="lk">' + SM.map(o => '<li><a href="' + pre(lang) + '/projects/' + o.s + '/">' + esc(o.n) + '</a> <small>' + esc(mkName(o.mk, lang)) + ' · ' + esc(tr(lang, stageKey((ix.caseBy.get(o.id) || {}).stage))) + '</small></li>').join('') + '</ul>' : '';

  // market
  const ms = ix.mk.get(x.mk), dm = ix.dmk.get(x.mk);
  const market = '<ul class="fl">' + fact(esc(tr(lang, 'mk_line', { k: ms.k, mk: mkName(x.mk, lang), pp: Math.round(ms.pn / ms.k * 100), pe: Math.round(ms.esc / ms.k * 100) })), mkHref(ix, x, lang), 'kolaboro.com' + mkHref(ix, x, lang)) +
    slipLine(ix, x, lang, handoverOf, fd) + (FX ? FX.delay : '') + '</ul>' +   // n30a: live handover slippage of the market (was the frozen 5 Nov delay-index line)
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
  const reply = (drHtml ? '' : '<p class="ki">' + esc(t31(lang, 'rp_none', { d: fd(checked, lang) })) + '</p>') + (drHtml ? '<h3>' + esc(tr(lang, 'dr_h', { k: DR.length })) + '</h3><p class="ki">' + esc(tr(lang, 'dr_intro')) + '</p>' + drHtml : '') + '<p>' + esc(tr(lang, 'reply_txt')) + '</p><p class="bts"><a class="btn btn-line kbtn" href="/developers/reply/?id=' + encodeURIComponent(x.id) + '">' + esc(tr(lang, 'reply_btn')) + '</a> <a class="btn btn-line kbtn" href="/corrections/?id=' + encodeURIComponent(x.id) + '&page=' + encodeURIComponent(canon.replace(ORIGIN, '')) + '#request">' + esc(tr(lang, 'corr_btn')) + '</a> <a class="btn btn-line kbtn" href="/ask-developer/?id=' + encodeURIComponent(x.id) + '">' + esc(tr(lang, 'ask_btn')) + '</a></p>';
  const cta = checklistHtml(lang, { id: x.id, s: x.s, co: coName(x.co, lang) || x.co, regs: FX ? FX.regs : [], cost: !!FX, costLbl: FX ? FX.h.tocCost : '' }) + '<p>' + esc(tr(lang, 'cta_txt')) + '</p><p class="bts"><a class="btn btn-hi kbtn" href="/check/?url=' + encodeURIComponent(page || '') + '" data-ev="seo_check">' + esc(tr(lang, 'cta_free')) + '</a> <a class="btn btn-line kbtn" href="' + (lang === 'en' ? '/book/' : pre(lang) + '/pricing/') + '?p=' + encodeURIComponent(x.s) + '#kreq" data-ev="seo_book">' + esc(tr(lang, 'cta_paid')) + '</a></p>';
  const gLk = guideLink(x.mk, x.ar, lang, x.co), cta2 = gLk ? cta + '<p><a class="more" href="' + gLk.href + '">' + esc(gLk.text) + '</a></p>' : cta;   // n27c

  // n24s: "Where is it?": area as published, how precise the pin is, what is around, the market and its transparency ranking
  const aRow = extra.around && extra.around.ar && extra.around.ar.projects && extra.around.ar.projects[x.id], hasPin = typeof fx.lat === 'number' && typeof fx.lng === 'number';
  const pinLine = hasPin ? (aRow && aRow.acc ? qa(lang, 'wh_pin_a', { a: num(aRow.acc, lang) }) : qa(lang, 'wh_pin')) : qa(lang, 'wh_nopin');
  const whereLinks = [hasPin ? '<a href="https://www.openstreetmap.org/?mlat=' + fx.lat.toFixed(5) + '&amp;mlon=' + fx.lng.toFixed(5) + '#map=16/' + fx.lat.toFixed(5) + '/' + fx.lng.toFixed(5) + '" rel="nofollow noopener" target="_blank">' + esc(qa(lang, 'wh_map')) + '</a>' : '',
    aRow && extra.around ? '<a href="#around">' + esc(qa(lang, 'wh_around')) + '</a>' : '', '<a href="' + mkHref(ix, x, lang) + '">' + esc(qa(lang, 'wh_mk', { mk: mkName(x.mk, lang) })) + '</a>',
    rk ? '<a href="' + pre(lang) + '/rankings/transparency/' + rk.s + '/">' + esc(qa(lang, 'wh_rank', { p: rk.p })) + '</a>' : ''].filter(Boolean);
  const DL = distLine(lang, name, extra.around ? aroundSum(extra.around, x, lang) : []), LN = localName(x);   // n29p: items 3 and 10
  const whereSec = '<ul class="fl">' + fact(esc(qa(lang, 'wh_place', { place })), page) + fact(esc(pinLine), page) + DL.li + (LN ? fact('<b>' + esc(t29(lang, 'ln_th')) + '</b> <bdi lang="th">' + esc(LN[0]) + '</bdi>', LN[1], 'eia.onep.go.th') : '') + '</ul><ul class="lk">' + whereLinks.map(a => '<li>' + a + '</li>').join('') + '</ul>';
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
    [qa(lang, 'h_who', { n: name }), x.dv ? tr(lang, 'a_dev', { dev: x.dv }) + (devN > 1 ? ' ' + qa(lang, 'who_k', { dev: x.dv, k: num(devN, lang) }) : '') + (devRec ? ' ' + devRec : '') : tr(lang, 'a_dev_none')],
    [tr(lang, 'q_permit', { n: name }), vf.permit === 'registry' ? tr(lang, 'a_permit_reg') : x.pn ? tr(lang, 'a_permit_pn', { pn: x.pn }) : tr(lang, 'a_permit_none')],
    [tr(lang, 'q_rev2', { n: name }), rv.approved_total ? tr(lang, 'rev_some', { k: rv.approved_total }) : tr(lang, 'a_rev')]];
  // s15a: more of the questions people search, each answered only from the facts on this page
  FAQ.splice(1, 0, [qa(lang, 'h_where', { n: name }), tr(lang, 'a_where', { n: name, place }) + ' ' + pinLine]);
  FAQ.splice(3, 0, [tr(lang, 'q_delay', { n: name }), ovN ? tr(lang, 'g_over', { m: ovN }) + (ho ? ' ' + tr(lang, 'a_delay_latest', { h: fd(ho.d, lang) }) : '')
    : hand && hand.ph ? qa(lang, 'ph_t', { h: fd(hand.d, lang), a: fd(hand.d0, lang) })   // n27g: a later date or last phase on record
    : hand && hand.mv ? tr(lang, 'g_moved', { k: hand.mv, mm: hand.mm }) + ' ' + tr(lang, 'a_delay_latest', { h: fd(hand.d, lang) })
    : hand && hand.st === 'pending' ? tr(lang, 'a_delay_ahead', { h: fd(hand.d, lang) }) : hand ? tr(lang, 'a_delay_rec', { h: fd(hand.d, lang), st: tr(lang, 'ps_' + hand.st) }) : ho ? tr(lang, 'g_h', { h: fd(ho.d, lang) }) : tr(lang, 'a_deliv_none')]);
  // n24s: the price question is always answered ("not published" when no price), the payment plan when one is published
  FAQ.push([qa(lang, 'h_cost', { n: name }), RS ? rsNoAsk(lang) + ' ' + rsText(lang, RS) + '.' : fx.price_min && cleanOk(String(fx.price_min)) ? tr(lang, 'a_price', { p: cur + num(fx.price_min, lang), to: fx.price_max ? tr(lang, 'a_price_to', { p2: cur + num(fx.price_max, lang) }) : '' }) : qa(lang, 'a_price0')]);
  if (fx.payment_plan && cleanOk(String(fx.payment_plan))) FAQ.push([qa(lang, 'q_plan', { n: name }), qa(lang, 'a_plan', { p: String(fx.payment_plan) }), [String(fx.payment_plan)]]);
  else FAQ.push([qa(lang, 'q_plan', { n: name }), t29(lang, 'pp_none', { d: readD })]);   // n33p (item 45): the payment plan question is always answered
  { const A = [], ut = (fx.unit_types || []).filter(t => cleanOk(String(t)));   // n33p (item 45): unit types, sizes and units, or "not published"
    if (ut.length) A.push(ut.join(', '));
    if (fx.size_min_m2) A.push(num(fx.size_min_m2, lang) + (fx.size_max_m2 && fx.size_max_m2 !== fx.size_min_m2 ? ' - ' + num(fx.size_max_m2, lang) : '') + ' m²');
    if (c && c.units) A.push(tr(lang, 'f_units') + ': ' + num(c.units, lang));
    FAQ.push([t29(lang, 'q_ty', { n: name }), A.length ? t29(lang, 'a_ty', { t: A.join('; ') }) : t29(lang, 'ty_none', { d: readD }), ut.length ? [ut.join(', ')] : null]); }
  if (x.dv && fx.developer_company && cleanOk(String(fx.developer_company))) FAQ.push([tr(lang, 'q_dreg', { dev: x.dv }), tr(lang, 'df_company') + ': ' + String(fx.developer_company) + '. ' + tr(lang, 'dfacts_src', { n: name }) + '.', [String(fx.developer_company)]]);   // n33p (items 43, 46)
  if (tp) FAQ.push([qa(lang, 'q_tr', { n: name }), trLine + ' ' + qa(lang, 'a_tr_x')]);
  for (const f of P29.faq) FAQ.push(f);   // n29p: unit types, foreign ownership (project terms and the law), short lets
  if (DL.faq) FAQ.push(DL.faq);
  const hN = (c.history || []).length;
  FAQ.push([tr(lang, 'q_change', { n: name }), [tr(lang, 'a_change', { d: fd(checked, lang) }), FX ? FX.chSum : '', ph && ph.n > 1 ? tr(lang, 'ph_line', { n: ph.n, a: fd(ph.first, lang), b: fd(ph.last, lang), c: ph.changed }) : '', hN ? tr(lang, 'a_change_k', { k: hN }) : (ph && ph.changed) || (FX && FX.chN) ? '' : tr(lang, 'a_change_none')].filter(Boolean).join(' ')]);
  for (const f of FAQ) f[1] = dot(f[1]);
  // n25t: a source's own wording quoted inside a translated answer (payment plan, ownership terms) is marked lang="en"
  const qmark = (h, Q) => lang === 'en' || !Q ? h : Q.reduce((t, w) => { const e = esc(String(w).replace(/[.\s]+$/, '')); return e.length > 3 ? t.split(e).join('<span lang="en" dir="ltr">' + e + '</span>') : t; }, h);
  const faq = FAQ.filter(f => !f[3]).map(([q, a, Q]) => '<details class="kfaq"><summary>' + esc(q) + '</summary><p>' + qmark(esc(a), Q) + '</p></details>').join('');

  // sources
  const S = [...new Set([page, x.du, ...(x.src || []), ...CL.map(r => r[3]), ...FL.map(f => f[1])].filter(okHttp))];
  const sources = '<p class="ki">' + esc(tr(lang, 'src_intro')) + '</p><ol class="srcs">' + S.map((u, i, A) => srcLi(u, A.filter(v => host(v) === host(u)).length > 1).replace(/<\/li>$/, ' ' + kindIco(srcKind(u, x), lang) + '</li>')).join('') + '</ol>' +
    ((w => w ? '<ul class="fl">' + w + '</ul>' : '')(wbLine(extra.wb, x, lang)) || (okHttp(page) ? '<p><a href="https://web.archive.org/web/*/' + esc(fixU(page)) + '" rel="nofollow noopener" target="_blank">' + esc(tr(lang, 'src_archive')) + '</a></p>' : '')) + dlLine(lang, x.s);

  // s15a: short answer at the top (what people search: legit, delivery date, permit, developer, reviews), built from the facts below
  // n24s (batch 24): the quick answer, 40 to 60 words, only from fields we hold: what it is, developer, place, handover date as
  // published (and its moves), permit published yes or no, transparency score and rank in its place, our review status, last checked.
  // Parts are dropped in a fixed order when the English text runs over 60 words, so every language carries the same facts.
  const aS = qaSentences(ix, x, lang, tp, { rvN, checked });
  const fresh = (ph && ph.n > 1 ? '<span>' + esc(tr(lang, 'upd_ver', { n: ph.n, a: fd(ph.first, lang), c: ph.changed })) + '</span>' : '') + (ph && ph.n ? '<span><a href="' + chg + '">' + esc(tr(lang, 'upd_log')) + '</a></span>' : '') +
    '<span><a class="kbought" href="/buyer-reports/?project=' + encodeURIComponent(x.id) + '" data-ev="seo_bought">' + esc(tt27(lang, 'np_bought')) + '</a></span>';   // n27t: item 22
  // n27g (batch 27): the overdue handover in a dated notice above the short answer, with its source and the place's overdue report;
  // "Updated <date>" under the title (the date of the last real data change, replaced after seoLd, see updLine)
  const ovP = ov ? overdueByMarket(ix).get(x.mk) || 0 : 0, today = new Date().toISOString().slice(0, 10);
  const ovHtml = ov ? '<div class="kovd" id="overdue" role="note"><p><b>' + esc(qa(lang, 'ov_h')) + '</b> ' + bidi(lang, esc(qa(lang, 'ov_t', { h: fd(ov.d, lang), mm: months(lang, ov.m, lang === 'de' ? 'dat' : 'nom', nfL), d: fd(today, lang) })) +
    (stageKey(ov.st) !== 'st_unknown' ? ' ' + esc(qa(lang, 'ov_st', { c: fd(checked, lang), st: tr(lang, stageKey(ov.st)) })) : ''), [name]) + srcA(page) + ' <a class="kovd-l" href="' + pre(lang) + '/handover/overdue/' + (ovP >= OV_MIN ? slugA(x.mk) + '/' : '') + '">' +
    esc(ovP >= OV_MIN ? qa(lang, 'ov_more', { p: mkName(x.mk, lang) }) : qa(lang, 'ov_all')) + '</a></p></div>' : '';
  const id33 = t33(lang, 'id_l') ? ' <span class="kid">' + esc(t33(lang, 'id_l')) + ({ fr: ' : ', zh: '：' }[lang] || ': ') + '<b translate="no">' + esc(x.id) + '</b></span>' : '';   // n33c (item 34): the id people search (vnm-001, lom-012)
  const updHtml = '<p class="kupd"><time datetime="' + esc(checked) + '">' + esc(tr(lang, 'upd_checked', { d: fd(checked, lang) })) + '</time>' + id33 + '</p>';
  // n40 k8 (R01-44): place, handover on record and permit on the first phone screen, above the six checks
  const hoF = handoverOf(ix, x), fsSep = lang === 'ar' ? '، ' : lang === 'zh' ? '，' : ', ', fsC = { fr: ' : ', zh: '：' }[lang] || ': ';
  const fsPl = placeName([x.ar && [...x.ar].length < 40 ? x.ar.split(' (')[0] : null, x.mk, x.co !== x.mk ? x.co : null].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', '), lang), fsHtml = '<p class="kfl8"><span>' + bidi(lang, esc(fsPl).replace(/, /g, fsSep), fsPl.split(', ').filter(n => /^[\u0000-\u024F]+$/.test(n))) + '</span>' +
    (hoF ? '<span>' + esc(tr(lang, 'th_hand')) + fsC + '<b>' + esc(fd(hoF.d, lang)) + '</b>' + (hoF.p && hoF.p.ph ? ' ' + esc(t33(lang, 'fs_mv')) : '') + '</span>' : '') +
    '<span>' + esc(tr(lang, 'th_permit')) + fsC + '<b>' + esc(x.pn ? tr(lang, 'v_pub') : tr(lang, 'v_notpub')) + '</b></span></p><style>.kfl8{display:flex;flex-wrap:wrap;gap:2px 14px;margin:4px 0 10px;font-size:.95rem}</style>';   // n31d (item 146): the date of the last check, large, under the title
  // n31d (items 131, 132, 137, 147): first line "is it safe? what we know and what we do not" from the six checks, then the six checks
  // themselves (on phones they are on the first screen), then the answer in prose; "see before and after" when space shows a change
  const satL = extra.sat ? satLine(extra.sat, x.id, lang, d => fd(d, lang)) : '', baL = satL ? satBa(lang, extra.sat, x.id) : '';
  const answer = ovHtml + (rvd ? '' : nrNote(lang)) + '<div class="kans" id="answer">%%K31Q%%%%K31L%%<p class="kans-t">' + bidi(lang, esc(dot(aS.join(' '))), [name, place, x.dv || '']) + '</p><p class="kans-u">' + fresh + '</p>' + (satL ? satHtml29(lang, satL).replace('</a></span>', '</a>' + baL + '</span>') : '') + '</div>';

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
  const crumbs = [[tr(lang, 'crumb_home'), ORIGIN + pre(lang) + '/'], ...(x.co && x.co !== x.mk ? [[coName(x.co, lang), ORIGIN + '/countries/' + slugA(CO_HUB[x.co] || x.co) + '/']] : []), [mkName(x.mk, lang), ORIGIN + mkHref(ix, x, lang)], ...(devPage ? [[((ix.devs.get(x.dvs) || {}).n) || x.dv, devPage]] : []), [name, canon]];   // n33a (item 83): the developer's entity name, as on its page and in the JSON-LD
  const moneyH = extra.money ? moneyHtml(extra.money, x, lang) : '';   // n19b
  const landH = extra.land ? pinHtml(extra.land, x, lang, d => fd(d, lang)) + landHtml(extra.land, x, lang, d => fd(d, lang)) : '', histH = extra.land ? histHtml(extra.land, x, lang, d => fd(d, lang)) : '';   // n19c
  const aroundH = extra.around ? aroundHtml(extra.around, x, lang, d => fd(d, lang)) : '', climateH = extra.around ? climateHtml(extra.around, x, lang, d => fd(d, lang)) : '';   // n21b
  const priceH = extra.paper ? (s0 => s0 && s0 + priceLink(extra.paper, ix, x, lang))(pricesHtml(extra.paper, x, lang)) : '', planH = extra.paper ? planningHtml(extra.paper, x, lang) : '';   // n18d
  const toc = [['glance', 's_glance'], ...(FX && !chMerge ? [['changed', null, FX.h.tocChanged]] : []), ...(legitSec ? [['legit', null, qa(lang, 'toc_legit')]] : []), ['promise', 's_promise'], ['payment-plan', null, t29(lang, 'pp_toc')], ['floor-plans', null, t29(lang, 'ty_toc')], ...(FX ? [['buycost', null, FX.h.tocCost]] : []), ...(P29.secs.rules ? [['buy-rules', null, t29(lang, 'rl_toc')]] : []), ...(priceH ? [['prices', null, paperHeading(lang, 'ph_toc')]] : []), ...(moneyH ? [['money', null, moneyToc(lang)]] : []), ['ppm', 's_ppm_toc'], ['delivery', 's_delivery'], ...(satHtml ? [['space', null]] : []), ...(seeSec ? [['ground', null, seeToc(lang)]] : []), ...(histH ? [['maphist', null, histToc(lang)]] : []), ['permits', 's_permits'], ...(planH ? [['planning', null, paperHeading(lang, 'pl_toc')]] : []), ...(landH ? [['land', null, landToc(lang)]] : []), ['where', null, qa(lang, 'toc_where')], ...(aroundH ? [['around', null, aroundToc(lang)]] : []), ...(climateH ? [['climate', null, climateToc(lang)]] : []), ...(rvd ? [['checks', 's_checks']] : []), ['claims', 's_claims'], ['history', 's_history'], ['reports', 's_reports'], ['developer', 's_devsec'], ...(webHtml ? [['web', null, webHeading(lang, 'h')]] : []), ...(FX ? [['alternatives', null, FX.h.tocAlt]] : []), ['reviews', 's_reviews'], ['reply', 's_reply'], ['ask', null, t31(lang, 'ask_h', { n: name })], ['next', null, t26(lang, 'nx_h')], ['faq', 's_faq'], ['sources', 's_sources']];
  // n31d (items 135, 149): the three closest pinned projects; the similar list without projects already linked above; unit types table
  const CL3 = closest3(ix, x), seen31 = new Set([...r6set, ...CL3.map(r => r.o.id)]), SM2 = new Set(SM.filter(o => !seen31.has(o.id)).map(o => o.s));
  const simH = cl3Html(lang, x, CL3) + (SM2.size ? similar.replace(/<li><a href="[^"]*\/projects\/([a-z0-9-]+)\/">.*?<\/li>/g, (m, sl) => SM2.has(sl) ? m : '') : '');
  const ppm31 = ppmOf(x), med31 = ppm31 != null ? medians(ix).get(x.mk + '|' + String(fx.currency).toUpperCase()) : null, tyT = tyTable(lang, x, ppm31, med31, mkName(x.mk, lang));
  // n27u: the six-check light under the quick answer (data-u27 carries the price and currency for the currency selector and calculator)
  const L6 = light6({ tp, c, pn: x.pn, ho, ev: x.ev, ids: toc.map(t => t[0]) });
  const light = lightHtml(lang, { tp, c, pn: x.pn, ho, ev: x.ev, ids: toc.map(t => t[0]), meta: { d: fd(checked, lang), n: S.length, q: pre(lang) + '/projects/' + x.s + '/questions/', co: coName(x.co, lang) || x.co, regs: FX ? FX.regs : [] }, data: Object.assign({ id: x.id }, RS ? { c: 'AED' } : fx.price_min > 0 && fx.currency ? { p: +fx.price_min, p2: fx.price_max > fx.price_min ? +fx.price_max : undefined, c: String(fx.currency).toUpperCase() } : {}) });
  const body = CSS31 + '<section class="phero kp"><div class="wrap"><p class="crumb">' + crumbs.slice(0, -1).map(([l, u]) => '<a href="' + esc(u.replace(ORIGIN, '')) + '">' + esc(l) + '</a>').join(' / ') + '</p>' +
    '<h1><bdi' + LNX(lang) + '>' + esc(name) + '</bdi></h1><p class="kh1sub">' + esc(tr(lang, 'h1_ps')) + '</p>' + updHtml + fsHtml + '<p class="lead">' + bidi(lang, esc(tr(lang, 'lead_p', { n: name, place })), [name, place]) + '</p>' + answer.replace('%%K31Q%%', knownLine(lang, L6)).replace('%%K31L%%', light) + trustBlock(x, c, lang, { fd, seq: SEQ, ckName: k => tr(lang, 'c_' + k), kindOf: u => srcKind(u, x), sources: S, checked, sat: extra.sat, name }) + '<details class="kz-kf"><summary>' + esc(t27(lang, 'kf_h')) + '</summary>' + keys + '</details>' + (extra.trb || '') + watchBox(lang, x.id, name, '/projects/' + x.s + '/', { score: c.score || 0, vscore: c.vscore || 0, stage: c.stage || null, overdue: c.overdue || 0, claims: { verified: cl.verified || 0, unverified: cl.unverified || 0, contradicted: cl.contradicted || 0 }, flags: (c.flags || []).length, history: (c.history || []).length }) + (extra.coh || '') + '</div></section>' +
    '<div class="wrap kwrap"><nav class="ktoc" aria-label="' + esc(tr(lang, 's_glance')) + '">' + toc.map(([i, k, lbl]) => '<a href="#' + i + '">' + esc(lbl || (k ? tr(lang, k) : satToc(lang))) + '</a>').join('') + '</nav>' +
    sec('glance', esc(tr(lang, 's_glance')), '<ul class="fl glance">' + bidi(lang, g.join(''), [name, place, x.dv || '']) + '</ul>') + (FX && !chMerge ? sec('changed', esc(FX.h.changed), FX.changed) : '') + (legitSec ? sec('legit', bdq(qa(lang, 'h_legit', { n: name })), legitSec) : '') + sec('promise', bdq(qa(lang, 'h_cost', { n: name })), bidi(lang, promised, [name])) + sec('payment-plan', bdq(t29(lang, 'pp_h', { n: name })), P29.secs.plan) + sec('floor-plans', bdq(t29(lang, 'ty_h', { n: name })), P29.secs.types + tyT) + (FX ? sec('buycost', bdq(FX.h.cost), FX.cost) : '') + (P29.secs.rules ? sec('buy-rules', bdq(t29(lang, 'rl_h', { n: name })), P29.secs.rules) : '') + (priceH ? sec('prices', esc(paperHeading(lang, 'ph_h')), '<style>' + PAPER_CSS + '</style>' + priceH) : '') + (moneyH ? sec('money', esc(moneyHeading(lang)), moneyH) : '') + sec('ppm', esc(tr(lang, 's_ppm')), (h => { const m = tyT ? '' : ppmMedian(ix, x, lang, mkName(x.mk, lang)); return m ? h.replace('</ul>', m + '</ul>') : h; })(ppmSection(x, lang).html)) + sec('delivery', bdq(qa(lang, 'h_when', { n: name })), delivery) + (satHtml ? sec('space', esc(satHeading(lang)), satHtml) : '') + (seeSec ? sec('ground', esc(seeHeading(lang)), seeSec) : '') + (histH ? sec('maphist', esc(histHeading(lang)), histH) : '') +
    sec('permits', esc(tr(lang, 's_permits')), permits) + (planH ? sec('planning', esc(paperHeading(lang, 'pl_h')), (priceH ? '' : '<style>' + PAPER_CSS + '</style>') + planH) : '') + (landH ? sec('land', esc(landHeading(lang)), landH) : '') + sec('where', bdq(qa(lang, 'h_where', { n: name })), bidi(lang, whereSec, [name, place, x.mk]) + (hasPin ? staticMap(lang, fx.lat, fx.lng, name) : '')) + (aroundH ? sec('around', esc(aroundHeading(lang)), aroundH) : '') + (climateH ? sec('climate', esc(climateHeading(lang)), climateH) : '') + (rvd ? sec('checks', esc(tr(lang, 's_checks')), checks) : '') + sec('claims', esc(tr(lang, 's_claims')), claims) + sec('history', esc(tr(lang, 's_history')), chMerge && FX ? history.replace('%%CHM%%', FX.changed) : history.replace('%%CHM%%', '')) +
    sec('reports', esc(tr(lang, 's_reports')), reports) + sec('developer', bdq(qa(lang, 'h_who', { n: name })), bidi(lang, devsec, [name, x.dv || ''])) + (webHtml ? sec('web', esc(webHeading(lang, 'h')), webHtml) : '') + (FX ? sec('alternatives', bdq(FX.h.alt), FX.alt) : '') + (simH ? sec('similar', esc(tr(lang, 's_similar')), simH) : '') +
    sec('market', esc(tr(lang, 's_market', { mk: x.mk })), market) + sec('related', esc(tr(lang, 'rel_h')), related) + sec('reviews', esc(tr(lang, 's_reviews')), reviews) + sec('reply', esc(tr(lang, 's_reply')), reply) + sec('ask', bdq(t31(lang, 'ask_h', { n: name })), askHtml(lang, { L6, n: name, h: ho ? fd(ho.d, lang) : '', escrow: rvd ? ck.escrow : null, price: !!fx.price_min, id: x.id, s: x.s })) +
    sec('cta', esc(tr(lang, 's_cta')), cta2) + nextStep(lang, x, name, (CL3.length ? CL3.map(r => r.o) : SM.length ? SM : ix.P.filter(o => o.mk === x.mk && o !== x)).slice(0, 3).map(o => o.s), shareText(lang, { n: name, place: mkName(x.mk, lang), h: ho ? fd(ho.d, lang) : '', pn: !!x.pn, s: tp ? tpS : null })) + sec('faq', esc(tr(lang, 's_faq')), faq) + sec('sources', esc(tr(lang, 's_sources')), sources) +
    '<p class="ki kfoot">' + tr(lang, 'foot', { d: esc(fd(checked, lang)), link: own('/data-policy/', tr(lang, 'm_data_policy')) }) + '</p></div>';

  const imgs = projImages(x, lang, canon, extra.sat);
  // n24s: name variants for alternateName: the name as published (before research notes were removed), with the market, with the developer
  const alt = [...new Set([RAWN.get(x), /\(/.test(name) ? name.replace(/\s*\([^)]*\)/g, '').trim() : null, name.toLowerCase().includes(String(x.mk).toLowerCase()) ? null : name + ' ' + x.mk, x.dv && !name.toLowerCase().includes(String(x.dv).toLowerCase()) ? name + ' by ' + x.dv : null, (localName(x) || [])[0]].filter(v => v && v !== name))];
  const placeType = /villa|house|home/i.test(name + ' ' + ((fx.unit_types || []).join(' '))) && !/apartment|tower|condo|residences/i.test(name) ? 'Residence' : 'ApartmentComplex';
  const geo = typeof fx.lat === 'number' && typeof fx.lng === 'number' ? { '@type': 'GeoCoordinates', latitude: fx.lat, longitude: fx.lng } : undefined;
  const orgId = (devPage ? dUrl('en', x.dvs) : canon) + '#org';
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': canon + '#page', url: canon, name: title.replace(/ \| Kolaboro$/, ''), description: desc, inLanguage: lang, dateModified: checked, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' },
      publisher: { '@id': ORIGIN + '/#org' }, primaryImageOfPage: { '@id': canon + '#og' }, speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#answer .kans-t'] }, about: [{ '@id': canon + '#place' }].concat(x.dv ? [{ '@id': orgId }] : []), breadcrumb: { '@id': canon + '#bc' },
      mentions: [{ '@type': 'Place', name: mkName(x.mk, lang), url: ORIGIN + mkHref(ix, x, lang) }].concat(x.co && x.co !== x.mk ? [{ '@type': 'Country', name: coName(x.co, lang) }] : [], okHttp(x.du) ? [{ '@type': 'WebPage', url: fixU(x.du), name: host(fixU(x.du)) }] : []),   /* n29i (item 98): the market, the country and the page that shows the permit */ mainEntity: { '@id': canon + '#faq' }, isBasedOn: { '@id': canon + '#data' } },
    { '@type': 'Organization', '@id': ORIGIN + '/#org', name: 'Kolaboro', url: ORIGIN + '/', logo: ORIGIN + '/k/favicon.svg', sameAs: ['https://github.com/calory89/kolaboro-open'] },   // n33a (item 77)
    ...imgs.map(i => Object.assign({ '@type': 'ImageObject' }, i)),
    Object.assign({ '@type': placeType, '@id': canon + '#place', name }, alt.length ? { alternateName: alt } : {}, { image: imgs.map(i => ({ '@id': i['@id'] })), address: { '@type': 'PostalAddress', addressLocality: x.ar || x.mk, addressRegion: x.mk, addressCountry: COUNTRY_ISO[x.co] || CO_ISO2[x.co] || x.co }, containedInPlace: { '@type': 'Place', name: mkName(x.mk, lang), url: ORIGIN + mkHref(ix, x, lang) }, subjectOf: { '@id': canon + '#page' } }, geo ? { geo } : {}),   // n33a (item 78): the market and the page about it
    ...(x.dv ? [Object.assign({ '@type': 'Organization', '@id': orgId, name: ((ix.devs.get(x.dvs) || {}).n) || x.dv }, devPage ? { url: dUrl('en', x.dvs) } : {}, ((ix.devs.get(x.dvs) || {}).n) && ix.devs.get(x.dvs).n !== x.dv ? { alternateName: x.dv } : {})] : []),   // n33a: the name on this project's record as alternateName
    { '@type': 'Dataset', '@id': canon + '#data', name: tr(lang, 'ds_name', { n: name }), description: tr(lang, rvd ? 'ds_rv' : 'ds_nr', { n: name, place, id: x.id }),   // n25t: in the page language
      url: canon, identifier: x.id, license: 'https://creativecommons.org/licenses/by/4.0/', isAccessibleForFree: true, creator: { '@id': ORIGIN + '/#org' }, dateModified: checked, spatialCoverage: { '@id': canon + '#place' },
      ...(S.length ? { isBasedOn: S.slice(0, 8).map(fixU) } : {}), ...(FL.length ? { citation: FL.slice(0, 4).map(f => fixU(f[1])) } : {}),   // n29t (item 51): the sources the record is built from (developer page, registers, claims) and the press reports it cites
      distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + rec }, { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/api/v1/projects/' + x.s }, { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: ORIGIN + '/api/v1/projects/' + x.s + '.csv' }] },
    { '@type': 'BreadcrumbList', '@id': canon + '#bc', itemListElement: crumbs.map(([l, u], i) => ({ '@type': 'ListItem', position: i + 1, name: l, item: u })) },
    ...(FQ33 => FQ33.length ? [{ '@type': 'FAQPage', '@id': canon + '#faq', mainEntity: FQ33.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] : [])(faq33(FAQ, lang))] };   // n33c (item 39): only questions shown on the page with an answer from the data
  const dupOf = DUP_OF[x.id] && ix.byId.get(DUP_OF[x.id]);   // n29q: the same project recorded twice: the later record points search engines to the first
  return { title, desc, canon: dupOf ? pUrl(lang, dupOf.s) : canon, body: leadify(body, leadMap(ix, x, lang, tp, checked, { esc, fd, host, okHttp, fixU, handoverOf, reviewed })), ld, lastmod: checked, alt: l => pUrl(l, dupOf ? dupOf.s : x.s), feed: { path: '/projects/' + x.s + '/', name }, images: imgs, upd: { html: updHtml, lang, k: 'chk', id: id33, d: iso(checked) } };
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
// n32x (batch 32): links from each developer page to the entity graph (this developer selected), its website changes and the anomaly radar
const N32XL = { en: ['Entity graph', 'Website changes', 'Anomaly radar'], es: ['Grafo de entidades', 'Cambios en sus webs', 'Radar de anomalías'], de: ['Entitätsgraph', 'Website-Änderungen', 'Anomalie-Radar'], fr: ['Graphe des entités', 'Changements de ses sites', "Radar d'anomalies"], nl: ['Entiteitengraaf', 'Websitewijzigingen', 'Afwijkingenradar'], ru: ['Граф связей', 'Изменения сайтов', 'Радар аномалий'], zh: ['实体关系图', '网站改动', '异常雷达'], ar: ['مخطط الكيانات', 'تغييرات المواقع', 'رادار الحالات الشاذة'] };
const n32xLinks = (l, s) => { const a = N32XL[l] || N32XL.en, p = pre(l); return '<p class="ksmall">' + [[p + '/graph/entities/?n=d:' + s, a[0]], [p + '/watch/website-changes/?dv=' + s, a[1]], [p + '/anomalies/', a[2]]].map(x => '<a href="' + esc(x[0]) + '">' + esc(x[1]) + '</a>').join(' · ') + '</p>'; };
// n35b (batch 35, item 13): link to the developer comparison, this developer first
const DCL35 = { en: 'Compare with other developers', es: 'Comparar con otras promotoras', fr: 'Comparer avec d\'autres promoteurs', de: 'Mit anderen Bauträgern vergleichen', nl: 'Vergelijken met andere ontwikkelaars', ru: 'Сравнить с другими застройщиками', zh: '与其他开发商比较', ar: 'قارن مع مطوّرين آخرين' };
function devPage(ix, dv, lang, extra) {
  const L = dv.ids.map(i => ix.byId.get(i)).filter(Boolean), name = dv.n, canon = dUrl(lang, dv.s);
  const mks = [...new Set(L.map(x => x.mk))], lm = L.map(x => lastmod(ix, x)).sort(), checked = lm[lm.length - 1];
  const pn = L.filter(x => x.pn).length, P = L.flatMap(x => ix.prom[x.id] || []);
  const cnt = st => P.filter(p => p.st === st).length, moved = P.filter(p => p.mv).length;
  // n25t: developer titles were 70 to 95 characters; the longest form that fits 60 (searched words first, brand last)
  // n27g (batch 27): the searched word and the year first ("<developer> reviews 2026: projects, permits, delivery record")
  const yD = new Date().getUTCFullYear(), tdy = k => qa(lang, k, { dev: name, y: yD });
  const title = dTitle33(lang, { dev: name, y: yD, k: L.length, nf: v => num(v, lang), b: n => qa(lang, 'b_y', { n, y: yD }) }) || [tdy('td_y') + ' | Kolaboro', tdy('td_y'), tdy('td_y2') + ' | Kolaboro', tdy('td_y2'), qa(lang, 'b_y', { n: name, y: yD }) + ' | Kolaboro', tr(lang, 'title_d', { dev: name }), tr(lang, 'title_d2', { dev: name }) + ' | Kolaboro', tr(lang, 'title_d2', { dev: name }), qa(lang, 'b', { n: name }) + ' | Kolaboro', qa(lang, 'b', { n: name })].find(t => [...t].length <= 60) || ((b, a) => a.length <= 60 ? b : a.slice(0, 60).join('').replace(/\s+\S*$/, ''))(qa(lang, 'b', { n: name }), [...qa(lang, 'b', { n: name })]);   // n27g: a 60+ character name is cut at a word
  // n25t: markets in the page language; the description stays within 155 characters (fewer markets named, then whole sentences)
  const dscB = n => dot(tr(lang, 'desc_d2', { dev: name, k: L.length, mks: mks.slice(0, n).map(m => mkName(m, lang)).join(', ') + (mks.length > n ? ' +' + (mks.length - n) : ''), pn, p: P.length, mv: moved, d: fd(checked, lang) }));
  // n33c (item 26): the description opens with the most striking fact on record (court case, handover dates passed, dates moved, permits missing)
  const cc33 = (extra.cc && extra.cc.get(dv.s)) || [], ov33 = L.filter(x => overdueOf(ix, x)).length;
  const hd33 = dHead33(lang, { cc: cc33, ov: ov33, mv: moved, k: L.length, pn, nf: v => num(v, lang), fd });
  const dsc = n => hd33 ? hd33 + (lang === 'zh' ? '' : ' ') + dscB(n) : dscB(n);
  let desc = dsc(mks.length); for (const n of [3, 2, 1]) if ([...desc].length > 155 && mks.length > n) desc = dsc(n);
  if ([...desc].length > 155) { const cut = [...desc].slice(0, 155).join(''), k = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('。')); desc = k > 60 ? cut.slice(0, k + 1) : cut.replace(/\s+\S*$/, '') + '.'; }
  const first = L[0], fx = Object.assign({}, ...L.map(x => x.fx || {}).reverse());
  const FD = extra.fac ? devFacets(extra.fac, ix, dv, lang) : null;   // n26s: promised vs actual, active projects, domain ages
  const g = [fact(esc(tr(lang, 'g_d', { k: L.length, dev: name, mks: mks.map(m => mkName(m, lang)).join(', ') })), first.url), fact(esc(tr(lang, 'g_d_pn', { pn, k: L.length })), first.du || first.url)];
  if (P.length) g.push(fact(esc(tr(lang, 'g_d_rec', { p: P.length, kept: cnt('kept'), broken: cnt('broken'), moved: cnt('moved'), pending: cnt('pending') })), '/promises/', tr(lang, 'm_promises')));
  if (FD) g.push(fact(FD.active, '/data/on-time.json', 'kolaboro.com/data/on-time.json'));
  g.push('<li><a href="' + pre(lang) + '/score-history/?d=' + encodeURIComponent(dv.s) + '" rel="nofollow">' + esc(tb31(lang, 'sh_one', { n: dv.n })) + '</a></li>');   // n31b (item 81)
  // n33p (item 50): with 2 or more projects the table also compares the lowest published price and the number of units, side by side
  const cmp2 = L.length > 1, prFrom = x => { const f = x.fx || {}; return f.price_min && cleanOk(String(f.price_min)) ? (f.currency ? String(f.currency).toUpperCase() + ' ' : '') + num(f.price_min, lang) : '-'; };
  const rows = L.map(x => { const c = ix.caseBy.get(x.id), h = handoverOf(ix, x); return '<tr data-f="m:' + esc(slugA(x.mk)) + ' s:' + esc(stageKey(c.stage)) + '"><td><a href="' + pre(lang) + '/projects/' + x.s + '/">' + esc(x.n) + '</a></td><td>' + esc(mkName(x.mk, lang)) + '</td><td>' + esc(tr(lang, stageKey(c.stage))) + '</td><td>' + esc(h ? fd(h.d, lang) : '-') + ((o => o ? ' <span class="kpill p-broken">+' + o.m + '</span>' : '')(overdueOf(ix, x))) + '</td><td>' + esc(x.pn ? tr(lang, 'v_pub') : tr(lang, 'v_notpub')) + '</td>' + (cmp2 ? '<td>' + esc(prFrom(x)) + '</td><td>' + esc(c.units ? num(c.units, lang) : '-') + '</td>' : '') + '<td>' + (reviewed(c) ? c.score + '/' + c.max : esc(tr(lang, 'nr_short'))) + '</td></tr>'; }).join('');
  const filt = devFilter(lang, L.map(x => { const st = stageKey((ix.caseBy.get(x.id) || {}).stage); return { mk: slugA(x.mk), mkL: mkName(x.mk, lang), st, stL: tr(lang, st) }; }));   // n29p (item 7): filter by place and stage
  const projects = (filt ? DEV_CSS + filt : '') + '<div class="tw"><table><thead><tr><th>' + ['th_project', 'th_market', 'th_stage', 'th_hand', 'th_permit'].concat(cmp2 ? ['f_price', 'f_units'] : [], ['th_checks']).map(k => esc(tr(lang, k))).join('</th><th>') + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' + (filt ? '<script>' + DEV_JS + '</script>' : '');
  const recLi = L.flatMap(x => (ix.prom[x.id] || []).filter(p => p.k === 'handover' || p.st === 'broken' || p.mv).slice(0, 3).map(p => fact('<a href="' + pre(lang) + '/projects/' + x.s + '/#delivery">' + esc(x.n) + '</a>: ' + esc(tr(lang, 'pk_' + p.k)) + ' ' + esc(fd(p.d, lang)) + ' <span class="kpill p-' + esc(p.st) + '">' + esc(tr(lang, 'ps_' + p.st)) + '</span>' + (p.mv ? ' · ' + esc(tr(lang, 'pr_moved', { k: p.mv, mm: p.mm })) : ''), x.url))).slice(0, 30).join('');
  const record = '<p class="ki">' + tr(lang, 'del_intro', { link: own('/promises/', tr(lang, 'm_promises')) }) + '</p><ul class="fl">' + (recLi || '<li>' + esc(tr(lang, 'drec_none')) + '</li>') + '</ul>';
  const DF = [['developer_founded', 'df_founded'], ['developer_hq', 'df_hq'], ['developer_company', 'df_company'], ['developer_projects_delivered', 'df_delivered'], ['developer_units_delivered', 'df_units'], ['listed_or_audited', 'df_listed']];
  const dsrc = k => (L.find(x => (x.fx || {})[k] != null) || first);
  const dfacts = DF.filter(([k]) => fx[k] != null && cleanOk(String(fx[k]))).map(([k, l]) => fact('<b>' + esc(tr(lang, l)) + ':</b> ' + en(String(fx[k])) + ' <small>(' + esc(tr(lang, 'dfacts_src', { n: dsrc(k).n })) + ')</small>', dsrc(k).url)).join('');
  const gl0 = extra.gleif || { ok: false, matches: [] };
  const gl = extra.fm && !gl0.matches.some(m => m.lei === extra.fm.m.lei) ? { ok: true, at: gl0.at, matches: [extra.fm.m].concat(gl0.matches) } : gl0;   // n19e: weekly exact name + country match
  const reg = '<ul class="fl">' + (gl.matches.length ? gl.matches.map(m => fact(esc(tr(lang, 'gleif_found', { legal: m.legal, lei: m.lei, jur: m.jur, st: m.st, ls: m.ls, reg: fd(m.reg, lang) })) + (m.cr ? ' ' + esc(facetT(lang, 'gl_cr', { d: fd(m.cr, lang) })) : ''), 'https://search.gleif.org/#/record/' + m.lei, 'search.gleif.org')).join('')
    : gl.ok ? fact(esc(tr(lang, 'gleif_none', { d: fd(gl.at, lang) })), 'https://search.gleif.org/#/search/simpleSearch=' + encodeURIComponent(name), 'search.gleif.org') : '<li>' + esc(tr(lang, 'gleif_err')) + '</li>') + dfacts + '</ul>' + (FD ? FD.doms : '') + (R14 => R14.length ? '<h3>' + esc(t29(lang, 'dreg_s', { dev: name })) + '</h3><ul class="fl">' + R14.join('') + '</ul>' : '')([...new Map(L.flatMap(x => companyRegs(extra.fac && extra.fac.REG, x).map(r => [r.register, regLi(lang, r, mkName(r.market === x.mk ? x.mk : x.co, lang) || r.market)]))).values()].slice(0, 4)) + '<p><a class="more" href="/registers/">' + esc(tr(lang, 'reg_more')) + '</a></p>';
  const FL = L.flatMap(x => (x.fl || []).map(f => [f[0], f[1], x])), seenF = new Set();
  const FLu = FL.filter(f => { const k = f[0] + f[1]; if (seenF.has(k)) return false; seenF.add(k); return true; });
  const reports = '<p class="ki">' + esc(tr(lang, 'rep_intro')) + '</p><ul class="fl">' + cc33.slice(0, 5).map(c => fact(esc(t33(lang, 'dc_cc', { no: c.no, court: c.court, d: fd(c.date, lang) })), c.src)).join('') + (FLu.map(f => fact(esc(tr(lang, 'rc_' + f[0])) + ' (<a href="' + pre(lang) + '/projects/' + f[2].s + '/#reports">' + esc(f[2].n) + '</a>)', f[1])).join('') || (cc33.length ? '' : '<li>' + esc(tr(lang, 'no_reports')) + '</li>')) + '</ul>';
  const reply = '<p>' + esc(tr(lang, 'reply_txt')) + '</p><p class="bts"><a class="btn btn-line kbtn" href="/developers/reply/?id=' + encodeURIComponent(first.id) + '">' + esc(tr(lang, 'reply_btn')) + '</a> <a class="btn btn-line kbtn" href="/corrections/?page=' + encodeURIComponent(canon.replace(ORIGIN, '')) + '#request">' + esc(tr(lang, 'corr_btn')) + '</a></p>';
  const cta = '<p>' + esc(tr(lang, 'cta_txt')) + '</p><p class="bts"><a class="btn btn-hi kbtn" href="/check/" data-ev="seo_check_dev">' + esc(tr(lang, 'cta_free')) + '</a> <a class="btn btn-line kbtn" href="/book/" data-ev="seo_book_dev">' + esc(tr(lang, 'cta_paid')) + '</a></p>';
  const factsTxt = [tr(lang, 'g_d', { k: L.length, dev: name, mks: mks.map(m => mkName(m, lang)).join(', ') }), tr(lang, 'g_d_pn', { pn, k: L.length }), P.length ? tr(lang, 'g_d_rec', { p: P.length, kept: cnt('kept'), broken: cnt('broken'), moved: cnt('moved'), pending: cnt('pending') }) : '', cc33.length ? t33(lang, cc33.length > 1 ? 'dc_ccn' : 'dc_cc', { no: cc33[0].no, court: cc33[0].court, d: fd(cc33[0].date, lang), k: num(cc33.length, lang) }) : '', FLu.length ? FLu.map(f => tr(lang, 'rc_' + f[0])).join('; ') + '.' : cc33.length ? '' : tr(lang, 'no_reports')].filter(Boolean).join(' ');
  const FAQ = [[tr(lang, 'q_dlegit', { dev: name }), tr(lang, 'a_dlegit', { facts: factsTxt })],
    [tr(lang, 'q_dcompl', { dev: name }), FLu.length ? tr(lang, 'a_dcompl_some', { list: [...new Set(FLu.map(f => tr(lang, 'rc_' + f[0])))].join('; ') }) : cc33.length ? t33(lang, cc33.length > 1 ? 'dc_ccn' : 'dc_cc', { no: cc33[0].no, court: cc33[0].court, d: fd(cc33[0].date, lang), k: num(cc33.length, lang) }) : tr(lang, 'a_dcompl_none')],
    [tr(lang, 'q_dproj', { dev: name }), L.map(x => x.n + ' (' + mkName(x.mk, lang) + ')').join(', ') + '.']];
  // s15a: register, on-time delivery and buyer reviews, answered from the GLEIF lookup and our promise record
  FAQ.splice(1, 0, [tr(lang, 'q_dreg', { dev: name }), gl.matches.length ? gl.matches.slice(0, 2).map(m => tr(lang, 'gleif_found', { legal: m.legal, lei: m.lei, jur: m.jur, st: m.st, ls: m.ls, reg: fd(m.reg, lang) })).join(' ') : gl.ok ? tr(lang, 'a_dreg_none', { d: fd(gl.at, lang) }) : tr(lang, 'a_dreg_err')]);
  if (fx.developer_company && cleanOk(String(fx.developer_company))) FAQ[1][1] += ' ' + tr(lang, 'df_company') + ': ' + String(fx.developer_company) + ' (' + tr(lang, 'dfacts_src', { n: dsrc('developer_company').n }) + ').';   // n33p (item 46): the company line of our record, with its source
  FAQ.splice(2, 0, [tr(lang, 'q_ddeliv', { dev: name }), P.length ? tr(lang, 'g_d_rec', { p: P.length, kept: cnt('kept'), broken: cnt('broken'), moved: cnt('moved'), pending: cnt('pending') }) : tr(lang, 'drec_none')]);
  if (FD) FAQ.splice(3, 0, FD.faq);
  FAQ.push([tr(lang, 'q_drev', { dev: name }), tr(lang, 'a_drev')]);
  // n29p (item 15): the quick answer, 40 to 60 words (English count), parts dropped in a fixed order so every language says the same
  const dqa = lg => { const m3 = mks.slice(0, 3).map(m => mkName(m, lg)).join(lg === 'ar' ? '، ' : lg === 'zh' ? '、' : ', ') + (mks.length > 3 ? ' +' + (mks.length - 3) : ''); return [['k', t29(lg, 'd_k', { dev: name, k: L.length, mks: m3 })], ['pn', tr(lg, 'g_d_pn', { pn, k: L.length })], ['rec', P.length ? tr(lg, 'g_d_rec', { p: P.length, kept: cnt('kept'), broken: cnt('broken'), moved: cnt('moved'), pending: cnt('pending') }) : ''], ['ac', FD ? strip(devFacets(extra.fac, ix, dv, lg).active) : ''], ['iv', t33(lg, 'iv', { dev: name, r: (cc33.length ? t33(lg, cc33.length > 1 ? 'dc_ccn' : 'dc_cc', { no: cc33[0].no, court: cc33[0].court, d: fd(cc33[0].date, lg), k: num(cc33.length, lg) }) + ' ' : '') + (FLu.length ? [...new Set(FLu.map(f => tr(lg, 'rc_' + f[0])))].join('; ') + '.' : cc33.length ? '' : tr(lg, 'no_reports')) }).trim() || (FLu.length ? [...new Set(FLu.map(f => tr(lg, 'rc_' + f[0])))].join('; ') + '.' : tr(lg, 'no_reports'))], ['chk', qa(lg, 'qa_chk', { d: fd(checked, lg) })]].filter(p => p[1]).sort((a, b) => (b[0] === 'iv') - (a[0] === 'iv')); };   // n33c (item 31): what independent sources say comes first
  // n40 k8 (R01-30): dated public facts in the answer (handover as published, the source and the day it was read), as many projects as fit 60 words
  const dtL = L.filter(x => okHttp(x.url) && x.ad && handoverOf(ix, x)), dtP = (lg, n) => n ? t33(lg, 'dt', { list: dtL.slice(0, n).map(x => t33(lg, 'dt_i', { p: x.n, h: fd(handoverOf(ix, x).d, lg), src: (() => { try { return new URL(fixU(x.url)).hostname.replace(/^www\./, ''); } catch (e) { return ''; } })(), d: fd(x.ad, lg) })).join(lg === 'zh' ? '；' : lg === 'ar' ? '؛ ' : '; ') }) : '';
  const dqa0 = dqa, dAnsOf = (lg, n) => { const ad = (A, B) => { const i = A.findIndex(p => p[0] === 'iv'); const P = A.slice(); if (B) P.splice(i + 1, 0, ['dt', B]); return P; }; const E = ad(dqa0('en'), dtP('en', n)), G = lg === 'en' ? E : ad(dqa0(lg), dtP(lg, n)); return [E, G]; };
  const dDrop = n => n ? ['rep', 'ac', 'rec', 'pn'] : ['rep', 'ac', 'rec'];   // the dated facts go before the permit count
  let nDt = Math.min(3, dtL.length); while (nDt > 0 && words(devAnswer('en', dAnsOf('en', nDt)[0].filter(p => p[0] !== 'chk').map(p => [p[0], dot(p[1]), dot(p[1])]), dDrop(nDt))) > 60) nDt--;
  const [dEn, dL] = dAnsOf(lang, nDt), dAns = devAnswer(lang, dL.filter(p => p[0] !== 'chk').map(p => [p[0], dot(p[1]), (dEn.find(e => e[0] === p[0]) || p)[1]]), dDrop(nDt));   // n35b: the date is printed right under the answer, so the sentence is not repeated
  const answer = '<div class="kans" id="answer"><p class="kans-t"><b class="kans-l">' + esc(tr(lang, 'ans_lbl')) + '</b> ' + bidi(lang, esc(dAns), [name]) + '</p><p class="kans-u"><span><time datetime="' + esc(checked) + '">' + esc(tr(lang, 'upd_checked', { d: fd(checked, lang) })) + '</time></span><span><a href="#glance">' + esc(tr(lang, 'ans_more')) + '</a></span></p></div>';
  for (const f of FAQ) f[1] = dot(f[1]);
  const faq = FAQ.map(([q, a]) => '<details class="kfaq"><summary>' + esc(q) + '</summary><p>' + esc(a) + '</p></details>').join('');
  const S = [...new Set(L.flatMap(x => [x.url, x.du]).concat(FLu.map(f => f[1])).filter(okHttp))];
  const sources = '<p class="ki">' + esc(tr(lang, 'src_intro')) + '</p><ol class="srcs">' + S.slice(0, 60).map(srcLi).join('') + '</ol>';
  const crumbs = [[tr(lang, 'crumb_home'), ORIGIN + pre(lang) + '/'], [tr(lang, 'crumb_devs'), ORIGIN + '/developers/'], [name, canon]];
  const body = '<section class="phero kp"><div class="wrap"><p class="crumb">' + crumbs.slice(0, 2).map(([l, u]) => '<a href="' + esc(u.replace(ORIGIN, '')) + '">' + esc(l) + '</a>').join(' / ') + '</p><h1>' + h1x(tr(lang, 'h1_d', { dev: name }), name, lang) + '</h1><p class="lead">' + esc(tr(lang, 'lead_d', { dev: name })) + '</p>' + answer + feedLinks(lang, '/developers/' + dv.s + '/', name) + (dv.ids.length >= 2 ? '<p class="k-small"><a href="' + pre(lang) + '/developers/compare/?d=' + dv.s + '">' + esc(DCL35[lang] || DCL35.en) + '</a></p>' : '') + '</div></section>' +
    '<div class="wrap kwrap">' + sec('glance', bidi(lang, esc(tr(lang, 's_dpub', { dev: name })), [name]), '<ul class="fl glance">' + g.join('') + '</ul>') + sec('projects', esc(tr(lang, 's_dprojects')), projects) + (FD ? sec('promised', bidi(lang, esc(FD.h), [name]), FD.pv) : '') + sec('network', esc(tr(lang, 's_network')), n32xLinks(lang, dv.s) + networkHtml(name, extra.netOk ? gl.matches[0] : extra.fm ? extra.fm.m : null, extra.netOk ? extra.net : extra.fm ? extra.fm.net : null, L, pre(lang), '/developers/' + dv.s + '/', extra.netOk || extra.fm ? null : gl.matches[0], lang) + familyHtml(extra.fam, dv.s, lang, pre(lang)) + NET_CSS + '<script>' + NET_JS + '</script>') + (extra.web && webDevHealthHtml(extra.web, dv.s, lang) ? sec('webhealth', esc(webHeading(lang, 'h')), webDevHealthHtml(extra.web, dv.s, lang)) + sec('weblinks', esc(webHeading(lang, 'l')), webDevLinksHtml(extra.web, dv.s, lang)) : '') + (extra.watch && watchDevHtml(extra.watch, dv.s, lang) ? sec('watch', esc(watchHeading(lang)), watchDevHtml(extra.watch, dv.s, lang)) : '') + (extra.watch && gazDevHtml(extra.watch.gz, dv.s, lang) ? sec('gazette', esc(gazHeading(lang)), gazDevHtml(extra.watch.gz, dv.s, lang)) : '') + sec('record', esc(tr(lang, 's_drecord')), record) +
    sec('registers', esc(tr(lang, 's_dreg')), reg) + (extra.fil && filingsDevHtml(extra.fil, dv.s, lang) ? sec('filings', esc(filingsHeading(lang)), filingsDevHtml(extra.fil, dv.s, lang)) : '') + sec('reports', esc(tr(lang, 's_dreports')), reports) + (extra.rs ? sec('answers', esc(rsHeading(lang)), rsDevHtml(extra.rs, dv, lang, first.id)) : '') + sec('reply', esc(tr(lang, 's_reply')), reply + devDash(lang, dv.s)) + sec('cta', esc(tr(lang, 's_cta')), cta) + sec('faq', esc(tr(lang, 's_faq')), faq) + sec('sources', esc(tr(lang, 's_sources')), sources) +
    '<p class="ki kfoot">' + tr(lang, 'foot', { d: esc(fd(checked, lang)), link: own('/data-policy/', tr(lang, 'm_data_policy')) }) + '</p></div>';
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'ProfilePage', '@id': canon + '#page', url: canon, name: title.replace(/ \| Kolaboro$/, ''), description: desc, inLanguage: lang, dateModified: checked, speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#answer .kans-t'] }, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' }, publisher: { '@id': ORIGIN + '/#org' }, mainEntity: { '@id': dUrl('en', dv.s) + '#org' }, breadcrumb: { '@id': canon + '#bc' } },
    { '@type': 'Organization', '@id': ORIGIN + '/#org', name: 'Kolaboro', url: ORIGIN + '/', logo: ORIGIN + '/k/favicon.svg' },
    Object.assign({ '@type': 'Organization', '@id': dUrl('en', dv.s) + '#org', name, url: dUrl('en', dv.s), identifier: { '@type': 'PropertyValue', propertyID: 'kolaboro-developer-id', value: dv.s } }, (an => an.length ? { alternateName: an } : {})([...new Set(L.map(x => x.dv).filter(v => v && v !== name))].slice(0, 6)), gl.matches[0] ? { leiCode: gl.matches[0].lei, legalName: gl.matches[0].legal } : {}, { subjectOf: L.slice(0, 50).map(x => ({ '@type': 'WebPage', url: pUrl(lang, x.s), name: x.n })) }),
    { '@type': 'BreadcrumbList', '@id': canon + '#bc', itemListElement: crumbs.map(([l, u], i) => ({ '@type': 'ListItem', position: i + 1, name: l, item: u })) },
    ...(FQ33 => FQ33.length ? [{ '@type': 'FAQPage', '@id': canon + '#faq', mainEntity: FQ33.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] : [])(faq33(FAQ, lang))] };   // n33c (item 39): only questions shown on the page with an answer from the data
  return { title, desc, canon, body, ld, lastmod: checked, alt: l => dUrl(l, dv.s), feed: { path: '/developers/' + dv.s + '/', name } };
}

const COI28 = { en: 'Some projects are not listed here because of a {a}conflict of interest{b}. Site totals include them.',
  es: 'Algunos proyectos no figuran aquí por un {a}conflicto de interés{b}. Los totales del sitio los incluyen.',
  fr: 'Certains projets ne sont pas listés ici en raison d’un {a}conflit d’intérêts{b}. Les totaux du site les incluent.',
  de: 'Einige Projekte sind hier wegen eines {a}Interessenkonflikts{b} nicht aufgeführt. Die Gesamtzahlen der Website enthalten sie.',
  nl: 'Sommige projecten staan hier niet vanwege een {a}belangenconflict{b}. De totalen van de site tellen ze mee.',
  ru: 'Некоторые проекты здесь не указаны из-за {a}конфликта интересов{b}. Общие цифры сайта их учитывают.',
  zh: '由于{a}利益冲突{b}，部分项目未在此列出。网站总数包含它们。',
  ar: 'بعض المشاريع غير مدرجة هنا بسبب {a}تضارب مصالح{b}. تشملها أرقام الموقع الإجمالية.' };
function indexPage(ix, lang) {
  const by = new Map(); for (const x of ix.P) { if (!by.has(x.mk)) by.set(x.mk, []); by.get(x.mk).push(x); }
  const mks = [...by.keys()].sort((a, b) => by.get(b).length - by.get(a).length);
  const canon = ORIGIN + pre(lang) + '/projects/', title = tr(lang, 'title_i'), desc = tr(lang, 'lead_i', { k: nf28(lang, ix.P.length), m: nf28(lang, mks.length) });
  // n28b: the site totals (home, search, /api/open/stats) count the Sumba projects too; this list leaves them out by name (conflict of interest), so say so
  const hidN = (ix.named.projects || []).filter(x => ix.caseBy.has(x.id) && COI_MARKETS.has(String(x.mk || '').toLowerCase())).length;
  const body = '<section class="phero kp"><div class="wrap"><p class="crumb"><a href="' + pre(lang) + '/">Kolaboro</a></p><h1>' + esc(tr(lang, 'h1_i')) + '</h1><p class="lead">' + esc(desc) + '</p>' + (hidN ? '<p class="k-small k-muted">' + esc(COI28[lang] || COI28.en).replace('{a}', '<a href="/independence/">').replace('{b}', '</a>') + '</p>' : '') + searchBox(lang, ix.P.length, ix.devs.size) + filterBar(lang) + '</div></section>' + LL_CSS + leastHtml(ix, lang, 24, iso(ix.updated)) + '<div class="wrap kwrap" data-kx-lists>' +
    '<details class="kmkt"><summary>' + esc(tr(lang, 'jump_mk')) + ' (' + mks.length + ')</summary><p>' + mks.map(m => '<a href="#m-' + slugM(m) + '">' + esc(mkName(m, lang)) + ' <small>' + by.get(m).length + '</small></a>').join('') + '</p></details>' +
    mks.map(m => '<section class="ks"><h2 id="m-' + slugM(m) + '">' + esc(mkName(m, lang)) + ' <small>' + by.get(m).length + '</small></h2><ul class="lk cols">' + by.get(m).sort((a, b) => a.n.localeCompare(b.n)).map(x => '<li><a href="' + pre(lang) + '/projects/' + x.s + '/">' + esc(x.n) + '</a>' + (x.dv ? ' <small>' + esc(x.dv) + '</small>' : '') + '</li>').join('') + '</ul></section>').join('') + '</div>';
  // n29t (item 40): the list's structure in the data too: its market sections, biggest first (each links to that market's file)
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', url: canon, name: title.replace(/ \| Kolaboro$/, ''), description: desc, inLanguage: lang, dateModified: iso(ix.updated),
    mainEntity: { '@type': 'ItemList', name: tr(lang, 'jump_mk'), numberOfItems: Math.min(30, mks.length), itemListOrder: 'https://schema.org/ItemListOrderDescending', itemListElement: mks.slice(0, 30).map((m, i) => ({ '@type': 'ListItem', position: i + 1, name: mkName(m, lang), url: ORIGIN + '/m/' + slugM(m) + '/' })) } };
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
  '@media(max-width:760px){.ktoc a{min-height:44px}a.src{border:11px solid transparent;margin-block:-11px;background-clip:padding-box;box-shadow:inset 0 0 0 1px var(--line);padding:2px 9px}.kfeeds a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;min-width:44px;padding:0 4px}dd a.src{margin-block:2px 0}}' +
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
function h1x(h, name, lang) { if (h.indexOf(name) !== 0 || h.length <= name.length) return esc(h); const t = h.slice(name.length), m = t.match(/^\s*[:\uFF1A]\s*/); return '<bdi' + LNX(lang) + '>' + esc(name) + '</bdi>' + (m ? esc(m[0].trim()) + ' ' : '') + '<span class="kh1s">' + esc(m ? t.slice(m[0].length) : t) + '</span>'; }
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
  // n38 d5: in fact lines the 11 px hit border above made each source link overlap the one on the line above (axe target-size); a plain 24 px box instead
  '.fl a.src{display:inline-block;box-sizing:border-box;min-height:24px;line-height:22px;border-top:0;margin-block:2px 0}ol.srcs li>a{display:inline-block;min-height:24px;line-height:24px}' +
  '.kwatch{border:1px solid var(--line);border-inline-start:4px solid var(--k-sea,#155C75);border-radius:16px;padding:20px 22px;margin:20px 0 0}.kwatch>.kfeeds{grid-column:1/-1;max-width:none;margin:6px 0 0;padding-top:12px;border-top:1px solid var(--line);font-size:.86rem;display:flex;flex-wrap:wrap;align-items:center;gap:4px 14px}.kwatch>.kfeeds span{color:var(--muted)}.kw-t b{font-size:1.1rem}' +
  '.klive{border:1px solid var(--line);border-radius:16px;background:var(--card,var(--paper));padding:20px 22px}.knote{border-style:solid;border-width:1px}' +
  '.tw{border:1px solid var(--line);border-radius:14px;background:var(--card,var(--paper))}.tw table{min-width:0}.tw th,.tw td{padding:12px 14px}.tw thead th{text-transform:none;font-size:.82rem;font-weight:600;letter-spacing:0;background:var(--k-sunken,var(--paper));border-bottom:1px solid var(--line)}.tw tbody tr:last-child>*{border-bottom:0}.tw tbody tr:hover{background:color-mix(in srgb,var(--ink) 3%,transparent)}.tw tbody th{font-weight:700}' +
  '.kpill{padding:3px 10px;border:0;font-size:.76rem}' +
  '@media(max-width:640px){.kp .kfs{grid-template-columns:repeat(2,minmax(0,1fr))}.kp .kf{padding:12px}.kp dd{font-size:.95rem}}@media(max-width:700px){.tw.kcards{border:0;background:none;overflow:visible}.tw.kcards table,.tw.kcards tbody,.tw.kcards tr,.tw.kcards td,.tw.kcards tbody th{display:block}.tw.kcards thead{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}' +
  '.tw.kcards tr{border:1px solid var(--line);border-radius:14px;background:var(--card,var(--paper));padding:12px 14px;margin:0 0 10px}.tw.kcards td,.tw.kcards tbody th{border:0;padding:3px 0}.tw.kcards tbody th,.tw.kcards td:first-child{font-size:1rem;padding-bottom:6px}.tw.kcards td[data-l]:not(:first-child)::before{content:attr(data-l);display:inline;margin-inline-end:.5em;font-size:.78rem;font-weight:600;color:var(--muted)}.tw.kcards td:empty{display:none}.tw.kcards tbody tr:hover{background:var(--card,var(--paper))}}' +
  '@media(min-width:1180px){.kwrap:has(>.ktoc){display:grid;grid-template-columns:210px minmax(0,1fr);column-gap:56px;align-items:start}.kwrap>.ktoc{grid-column:1;grid-row:1/span 60;flex-direction:column;gap:2px;overflow:visible;max-height:calc(100vh - 80px);overflow-y:auto;scrollbar-width:thin;overscroll-behavior:contain;background:none;box-shadow:none;padding:44px 0 0;z-index:1}' +
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
const CV = '<script>if(location.hash)document.documentElement.classList.add("kb-h")</script><style id="kcv-css">html:not(.kb-h) .kwrap section.ks{content-visibility:auto;contain-intrinsic-size:auto 700px}html:not(.kb-h) .kwrap section.kz{content-visibility:visible}@media print{html:not(.kb-h) .kwrap section.ks{content-visibility:visible}}</style>';
function head(pg, lang) {
  const alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + pg.alt(l) + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + pg.alt('en') + '">';
  return '<title>' + esc(pg.title) + '</title><meta name="description" content="' + esc(pg.desc) + '"><link rel="canonical" href="' + pg.canon + '">' + alts +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="Kolaboro"><meta property="og:title" content="' + esc(pg.title) + '"><meta property="og:description" content="' + esc(pg.desc) + '"><meta property="og:url" content="' + pg.canon + '"><meta property="og:locale" content="' + (LOCALE[lang] || 'en-GB').replace('-', '_') + '">' +
    (pg.feed ? '<meta property="og:image" content="' + ORIGIN + '/og' + pg.feed.path.replace(/\/$/, '') + '.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="' + esc(tr(lang, 'og_alt', { n: pg.feed.name })) + '"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="' + ORIGIN + '/og' + pg.feed.path.replace(/\/$/, '') + '.png">' : '<meta property="og:image" content="' + ORIGIN + '/k/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="' + ORIGIN + '/k/og.png">') + '<meta name="robots" content="' + (pg.noindex ? 'noindex' : 'index, follow, max-image-preview:large, max-snippet:-1') + '">' +
    (pg.feed ? '<link rel="alternate" type="application/atom+xml" title="' + esc(pg.feed.name) + ' (Atom)" href="' + pg.feed.path + 'feed.atom"><link rel="alternate" type="application/feed+json" title="' + esc(pg.feed.name) + ' (JSON Feed)" href="' + pg.feed.path + 'feed.json">' : '') + (pg.feed ? ((m, d) => m ? '<link rel="alternate" type="text/markdown" title="' + esc(pg.feed.name) + ' (Markdown)" href="/projects/' + m[1] + '.md">' : d ? '<link rel="alternate" type="text/markdown" title="' + esc(pg.feed.name) + ' (Markdown)" href="/answers/developer/' + d[1] + '.md">' : '')(/^\/projects\/([a-z0-9-]{1,90})\/$/.exec(pg.feed.path), /^\/developers\/([a-z0-9-]{1,90})\/$/.exec(pg.feed.path)) : '') +   // n33a (item 81): the Markdown copy of the page for assistants
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
    .on('div.mcta', { element(e) { const m = /^\/projects\/([a-z0-9-]{1,90})\/$/.exec((pg.feed && pg.feed.path) || ''); if (m) e.replace(ctaHtml(lang, m[1]), { html: true }); } })   // n31a (item 21): sticky "Check this project" with price and report time
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
const PREV_V = (n => n > 2 ? ['named-v' + (n - 1), 'named-v' + (n - 2)] : [])(+(CACHE_V.match(/^named-v(\d+)$/) || [0, 0])[1]);   // r7u: the two previous code versions, read on a miss
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
  try { await loadS31(env); } catch (e) {}   // n31b: trust block strings (/data/n31b-i18n.json)
  try { await loadS32(env); } catch (e) {}   // n32s: completed-project title words
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
    let [reviews, replies, ph, sat, fcs, web, coh, paper, see, money, land, around, trp, fac, ru29, wb] = await Promise.all([
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
      timed('ru29', soft(() => rulesData(env), null)),   // n29p: short-let rule of the place (item 5)
      timed('wb', soft(() => wbData(env), null)),   // n31c: Internet Archive copies of the tracked page
      soft(() => ppmLoad(env), null),   // n40 r1d: official price references (/data/ppm-official.json)
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
    const pg = projectPage(ix, x, lang, { reviews, replies, ph, sat, fc, fdg, web, coh, paper, see, money, land, around, trb: trp ? trp.badge : '', trp, fac, ru29, wb }); if (phErr || dbSlow) pg.nocache = true;   // page history not loaded, or the database did not answer in time: do not cache
    pg.tm = Object.keys(tm).map(k => k + ';dur=' + tm[k]).join(', ');
    return pg;
  }
  const dv = ix.devs.get(key); if (!dv) return null;
  const softD = f => (async () => { try { return await f(); } catch (e) { return null; } })();   // n20p: the register lookup and the four data files load together
  const [gn, rs, web, fam, watch, fil, fac, cc] = await Promise.all([
    (async () => { const gl = await gleif(dv.n, ctx), m0 = gl.matches[0], cs = new Set(dv.ids.map(i => ix.byId.get(i)).filter(Boolean).map(x => COUNTRY_ISO[x.co] || x.co));
      const netOk = !!(m0 && cs.has(m0.country)), net = netOk ? await gleifNet(m0.lei, ctx) : null;   // a same-name company in another country is not shown as this developer's group
      return { gl, netOk, net }; })(),
    softD(() => rsData(env)), softD(() => webData(env)), softD(() => familyData(env)), softD(() => watchData(env)), softD(() => filingsData(env)), softD(() => facetsData(env)), softD(() => ccData33(env))]);   // watch: n19a
  const gl = gn.gl, netOk = gn.netOk, net = gn.net;
  return devPage(ix, dv, lang, { gleif: gl, net, netOk, rs, web, fam, fm: netOk ? null : famNet(fam, dv.s), watch, fil, fac, cc });
}

// shell(path) -> Response of the site's static page at that path (header, footer, styles of that language)
export async function handle(req, u, env, ctx, shell) {
  const p = u.pathname;
  if (p === '/api/seo/urls') return urls(env);
  if (p === '/api/seo/scan') return scan(u, env);
  const dm = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?projects\/([a-z0-9-]{1,90})\/changes\/(?:([0-9a-f]{64})\.txt)?$/);   // r6u: the viewer in 8 languages
  if (dm && !(dm[1] && dm[3])) { let ix; try { ix = await data(env); } catch (e) { return null; } const x = ix.bySlug.get(dm[2]); if (!x) return null; return diffRoute(req, u, env, ctx, shell, x, dm[3] || null, dm[1] || 'en'); }
  if (/^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?projects$/.test(p)) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': 'public, max-age=86400' } });   // n20f: /projects without the slash was a 404
  const m = p.match(RX); if (!m) return null;
  const lang = m[1] || 'en', kind = m[2], key = m[3];
  if (!key && kind === 'developers') return null;                       // /developers/ is the static developer hub
  if (key && kind === 'developers' && RESERVED.has(key)) return null;   // /developers/reply/ etc. stay static
  if (!p.endsWith('/')) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
  // n20p (9 Nov 2026): the rendered page is kept at the edge under a key that needs no data to compute (code version + path), so a
  // cached page is answered before any data file is read. Each copy remembers the data version it was built from. A copy older
  // than a minute is still answered at once and checked in the background: same data version, its clock restarts; new data (a
  // publish, an approved developer reply), the page is rendered again for the next reader. Copies live a day at most (6 hours until n32s).
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
    // r7u: right after a code version bump every copy above is gone, so each first reader waited for a full render (2 to 3 s seen
    // on project pages). The copy of one of the two previous versions is answered at once and the page is rendered again in the
    // background under the new key, the same way a stale copy is (the reader after that gets the new version).
    if (ctx && ctx.waitUntil && !REFRESHING.has(p)) for (const v of PREV_V) {
      const old = await caches.default.match(new Request(ORIGIN + '/__named_fast/' + v + cohortKey(env) + p));
      if (!old) continue;
      REFRESHING.add(p);
      ctx.waitUntil(refresh(new Response('', { headers: { 'x-ver': 'previous-code' } }), fk, p, kind, key, lang, env, ctx, shell).catch(() => {}).then(() => { REFRESHING.delete(p); }));
      const hh = { 'content-type': 'text/html; charset=utf-8', 'x-named-cache': 'prev', 'cache-control': 'no-cache', 'server-timing': 'cache;desc=prev;dur=' + (Date.now() - t0) };
      if (old.headers.get('x-lm')) hh['last-modified'] = old.headers.get('x-lm');
      return new Response(old.body, { status: 200, headers: hh });
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
    // n31t (batch 31, item 264): right after a deploy, a request can reach an isolate that still runs the previous deployment, whose data
    // does not have the newest projects yet (seen as a 404 on the first load of new pages). When this isolate's commit differs from the
    // live one, an unknown page answers 503 with Retry-After instead of 404, so browsers and crawlers come back instead of dropping it.
    if (key && await staleIsolate(env)) return new Response(await assemble(nf, lang, sh), { status: 503, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'retry-after': '30', 'x-robots-tag': 'noindex' } });
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
  const chk = pg.upd.k === 'chk' && (!pg.upd.d || pg.upd.d === d);   // n36e: a later data change is "Updated <date>", so it never contradicts the six checks' "Last checked"
  pg.body = pg.body.replace(pg.upd.html, '<p class="kupd"><time datetime="' + d + '">' + esc(chk ? tr(l, 'upd_checked', { d: fd(d, l) }) : qa(l, 'upd_on', { d: fd(d, l) })) + '</time>' + (pg.upd.id || '') + '</p>');
}
// the parsed files the lastmod date of one page is computed from (all already in memory after a render); null if one is missing
async function lmFiles(ix, env) {
  try {
    const [prom, find, prog] = await Promise.all([loadJson(env, 'promises.json'), loadJson(env, 'findings-by-project.json'), satData(env)]);
    if (!prom || !find || !prog) return null;
    return { named: ix.named, cases: ix.cases, caseBy: ix.caseBy, prom, find, prog, raw: x => RAWN.has(x) ? Object.assign({}, x, { n: RAWN.get(x) }) : x };
  } catch (e) { return null; }
}
const FAST_FRESH = 60000, FAST_TTL = 259200, REFRESHING = new Set();   // n33i (item 18): copies live 3 days (n32s: a day; before: 6 hours), so long-tail translated pages crawlers revisit are answered from the edge; a copy is still re-checked in the background after a minute
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
  ix.P.forEach((x, i) => add('project', l => pUrl(l, x.s), { id: x.id, reviewed: reviewed(ix.caseBy.get(x.id)), facts: facts6(ix, x), sm: facts6(ix, x) >= 2 && !(DUP_OF[x.id] && ix.byId.has(DUP_OF[x.id])) }, lastmod(ix, x), { summary: quickAnswer(ix, x, 'en', tps[i]), images: projImages(x, 'en', pUrl('en', x.s), PIN_HOLD[x.id] ? null : sat).map(i => ({ loc: i.contentUrl, title: i.name, caption: i.caption })), added: x.ad || null, listing_page: okHttp(x.url) && isListing(x.url), name: x.n, developer: x.dv || null, developer_url: x.dvs && ix.devs.has(x.dvs) ? dUrl('en', x.dvs) : null, market: x.mk, country: x.co  }));
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
  await ppmLoad(env);
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
