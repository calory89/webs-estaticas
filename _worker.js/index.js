
import { ruPlaces } from './kbx_hdate.js';   // n29i: Russian place names in the right case after "в" (see kbx_hdate.js)
const SITES = new Set(["52startupsin52weeks.com", "bestsalesclosers.com", "biohackingisland.com", "collectivecolab.com", "createats.com", "equinoxinvestmentgroup.com", "felicityisland.com", "founderspassport.com", "gayrail.com", "jobersity.com", "jurimatch.com", "kindaoclub.com", "kingofstreets.com", "klipstay.com", "kolaboro.com", "landbanky.com", "landstockmarket.com", "leadpoolclub.com", "luxurybeachresidence.com", "monkeyranking.com", "nomadsseasons.com", "persohna.com", "publicscores.com", "reelrole.com", "sevenfounders.com", "sovereign195.com", "thecoreisland.com", "transparently.us", "usersland.com", "voyanoble.com", "yogaecocity.com", "realhunt.co", "lacliniqueswiss.com", "thecigaretteindex.com", "theglampings.com", "sportpassportclub.com", "surfranking.com", "longevityisland.org", "walkwar.com", "voxera.app", "grownomads.com", "aibeachcity.com", "beyondsoma.com", "blacknomadcard.com", "bootcamp.jobersity.com", "fitnessbeachcity.com", "go.realhunt.co", "onlybeachfronthomes.com", "spain.happylowcost.com", "thenomaduniversity.com", "thestartupisland.com", "happysocialclub.com", "levelshotels.com", "thesumbatimes.com"]);

const SB = 'https://oykcsmextclpdnugixqz.supabase.co';
const SB_HOST = 'oykcsmextclpdnugixqz.supabase.co';
function sbBucket(schema, b) { return b.startsWith(schema + '-') ? b : schema + '-' + b; }
async function sbProxy(req, u) {
  const m = u.pathname.match(/^\/__sb\/([a-z0-9_]+)(\/.*)$/);
  if (!m) return new Response('bad', { status: 400 });
  const schema = m[1]; let path = m[2];
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': req.headers.get('origin') || '*', 'access-control-allow-headers': req.headers.get('access-control-request-headers') || '*', 'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS', 'access-control-max-age': '86400' } });
  const h = new Headers(req.headers); h.delete('host');
  // Visitor IP for per-visitor limits in edge functions (Supabase otherwise sees this Worker's IP).
  h.set('x-jm-client-ip', req.headers.get('cf-connecting-ip') || '');
  let body = (req.method === 'GET' || req.method === 'HEAD') ? null : await req.arrayBuffer();
  if (path.startsWith('/rest/v1/')) { h.set('accept-profile', schema); h.set('content-profile', schema); }
  else if (path.startsWith('/functions/v1/')) { path = path.replace(/^\/functions\/v1\/([^/?]+)/, (_, f) => '/functions/v1/' + (f.startsWith(schema + '-') ? f : schema + '-' + f)); }
  else if (path.startsWith('/storage/v1/')) {
    path = path.replace(/^\/storage\/v1\/(object|render\/image)\/((?:public|sign|authenticated|list|info|upload\/sign)\/)?([^/?]+)/, (all, kind, sub, b) => (['move','copy','sign'].includes(b) && !sub) ? all : '/storage/v1/' + kind + '/' + (sub || '') + sbBucket(schema, b));
    path = path.replace(/^\/storage\/v1\/bucket\/([^/?]+)/, (_, b) => '/storage/v1/bucket/' + sbBucket(schema, b));
    if (body && /\/storage\/v1\/object\/(move|copy)$|\/storage\/v1\/object\/sign\/?$/.test(path)) { try { const j = JSON.parse(new TextDecoder().decode(body)); if (j.bucketId) j.bucketId = sbBucket(schema, j.bucketId); if (j.destinationBucket) j.destinationBucket = sbBucket(schema, j.destinationBucket); body = JSON.stringify(j); } catch (e) {} }
  }
  else if (path.startsWith('/auth/v1/signup') || path.startsWith('/auth/v1/otp')) {
    if (body) { try { const j = JSON.parse(new TextDecoder().decode(body)); j.data = Object.assign({}, j.data || {}, { site: schema }); body = JSON.stringify(j); } catch (e) {} }
  }
  const target = SB + path + u.search;
  if (req.headers.get('upgrade') === 'websocket') return fetch(target, req);
  const r = await fetch(target, { method: req.method, headers: h, body, redirect: 'manual' });
  const rh = new Headers(r.headers);
  const loc = rh.get('location'); if (loc && loc.startsWith(SB)) rh.set('location', 'https://' + u.host + '/__sb/' + schema + loc.slice(SB.length));
  return new Response(r.body, { status: r.status, headers: rh });
}
let top3 = null;
let jm = null;
let jb = null;
let rr = null;
let kb = null, kbx = null, ksat = null, klk = null;
// n32w (19 Nov 2026): kolaboro.com string tables live in /_s/kolaboro.com/data/i18n/*.json (worker size limit); every kolaboro.com
// request waits for them once per isolate (kbx_strings.js) before any module that reads them runs
let kStr = null;
async function kbStrings(env) { try { if (!kStr) kStr = await import('./kbx_strings.js'); if (!kStr.isReady()) await kStr.ready(env); if (!kStr.isReady()) await kStr.ready(env); } catch (e) {} try { if (!kn33a) kn33a = await import('./kbx_n33a.js'); } catch (e) {} }   // n33a: byline and hub feeds read by kbHeaders (sync)
const KXR_V = 'n22e1'; let kxr = null; const KXR = /^\/api\/kb\/xray(?:\/stats)?\/?$|^\/api\/v1\/xray(?:\/openapi\.json)?\/?$|^\/x\/[0-9a-f]{64}(?:\/|\.json|\/vc)?$/;   // b11 x11a: Project X-ray (keep equal to PATHS in kbx_xray.js)
let kfw = null; const KFW = /^\/api\/v1\/(?:projects|developers)(?:\/[a-z0-9-]{1,90})?\/?$|^\/api\/v1\/(?:search-index|watch)$|^\/(?:projects|developers)\/[a-z0-9-]{1,90}\/feed\.(?:atom|json)$/;   // b9a: public named API, feeds, watch (keep equal to PATHS9 in kbx_follow.js)
let kog = null, kbk = null; const KB10 = /^\/og\/(?:projects|developers|type)\/[a-z0-9-]{1,90}\.png$|^\/bulk-check\/?$|^\/api\/kb\/bulk\/?$/;   // b10c: keep equal to PATHS in kbx_og.js + kbx_bulk.js
let kxev = null; const KXEV = /^\/api\/xev(?:\/sat\.png)?$/;   // x11b (batch 11): X-ray evidence cards + Sentinel-2 crop, keep equal to PATHS in kbx_xray_ev.js
let kpp = null; const KPP = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?tools\/permit-photo\/?$/;   // n17d: permit photo reader (keep equal to PATHS in kbx_pp.js)
let kca = null; const KCA = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?tools\/contract-addendum\/?$/;   // n18d: contract addendum builder (keep equal to TOOL_RX in kbx_paper.js)
let knet = null; const KNET = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:graph\/developers|live\/xrays)\/?$|^\/api\/x\/net\/(?:graph|live)$/;   // b14 f14c: developer network graph + live X-ray globe (keep equal to PATHS in kbx_net.js)
let kplot = null; const KPLOT = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?satellite\/plot\/?$/;   // n19d (batch 19): any plot from space, 8 languages (see kbx_plot.js)
let kwat = null; const KWAT = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?watch\/lookalikes\/?$|^\/__k\/kwatch-admin\.js$/;   // n19a (batch 19): lookalike websites feed, admin Screening tab (see kbx_watch.js)
let ke27 = null; const KE27 = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:projects\/[a-z0-9-]{1,90}\/report(?:\/|\.pdf)?|weekly(?:\/[a-z0-9-]{2,40})?\/?)$|^\/weekly\/(?:[a-z0-9-]{2,40}\/feed\.(?:atom|json)|sitemap\.xml)$|^\/api\/x\/e27\/(?:mail\/(?:review|delays)|signups|notices\/[A-Za-z0-9-]{3,20})\/?$/;   // n27e (batch 27): project report + PDF, weekly changes per place, mail previews, sign-ups, notices (keep equal to PATHS in kbx_e27.js)
let ku27 = null; const KU27 = /^\/k\/(?:u27|n31d)\.js$|^\/api\/v1\/(?:cost|map)$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:map|updates)\/?$/;   // n27u (batch 27): client script of named pages, cost rows, map of all projects, full ticker lines (keep equal to PATHS in kbx_u27.js)
let k30c = null; const K30C = /^\/k\/n30c-map\.js$|^\/api\/v1\/pin\/[A-Za-z0-9-]{3,20}$|^\/embed\/v2(?:\.js|\/[a-z0-9-]{1,90}\/?)$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:prices\/history(?:\/[a-z0-9-]{2,60})?|watch\/lookalikes\/images|tools\/widget|engineering\/status)\/?$/;   // n30c (batch 30): map client, pin check, widget v2, price history by place, image reuse, engineering status (keep equal to PATHS in kbx_n30c.js)
let kn31e = null; const KN31E = /^\/k\/n31e\.js$|^\/api\/v1\/(?:find|new-websites(?:\.json)?|handover-history\/[a-z0-9-]{1,90})$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:tools\/(?:find-listing|handover-history|visa-by-investment|compare-countries|on-time|request-documents|inheritance|foreign-mortgages|area-report|translate|receipt-check|payment-vs-progress)|satellite\/monthly|watch\/new-websites|app)\/?$/;   // n31e (batch 31): buyer tools (keep equal to PATHS in kbx_n31e.js)
let kn30 = null; const KN30 = /^\/k\/n30a(?:-cr)?\.js$|^\/api\/v1\/slippage(?:\.csv)?$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:tools\/contract-reader|methods\/handover-slippage|projects\/[a-z0-9-]{1,90}\/timeline)\/?$/;   // n30a (batch 30): NL search and slider script, contract reader, handover slippage, project timeline (keep equal to PATHS in kbx_n30a.js)
let ku26 = null; const KU26 = /^\/api\/v1\/(?:facets|followers)$|^\/api\/x\/status\/pages\/?$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?compare\/?$/;   // n26u (batch 26): named compare ?p=, facets for /projects/ filters, follower counts, key-page sweep (keep equal to PATHS in kbx_u26.js)
let ktr = null; const KTR = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:rankings\/transparency(?:\/[a-z0-9-]{2,40})?|methods\/transparency-score)\/?$|^\/rankings\/transparency\/sitemap\.xml$/;   // n23 (batch 23): transparency rankings, 30 islands and 30 cities, 8 languages (keep equal to PAGE_RX + SITEMAP in kbx_tr.js)
let k29i = null; const K29I = /^\/(?:es|de|fr|nl|ru|zh|ar)\/(?:countries|rankings)(?:\/[a-z0-9-]{2,60})?\/?$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?guides\/buyers-from(?:\/(?:russia|china|gulf))?\/?$|^\/(?:es|de|fr|nl|ru|zh|ar)\/m\/[^/.]{2,60}\/?$|^\/m\/sitemap\.xml$|^\/answers\/questions\.(?:md|json)$/;   // n29i (batch 29): translated market files, their sitemap, questions answered from data (keep equal to PATHS in kbx_n29i.js)
let kbuy = null; const KBUY = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?guides\/buying-off-plan(?:\/[a-z-]{2,30})?\/?$|^\/guides\/buying-off-plan\/sitemap\.xml$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?glossary\/(?:escrow|leasehold|payment-plan)\/?$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?tools\/total-cost\/(?:dubai|costa-del-sol|portugal|thailand|indonesia|england|turkey)\/?$/;   // n27c (batch 27): buying off-plan guides by place (see kbx_buy.js)
let krul = null; const KRUL = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?guides\/short-let-rules\/?$/;   // n21c (batch 21): short-let rules by city (see kbx_rules.js)
let kstg = null; const KSTG = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?methods\/construction-stage\/?$/;   // n18b (batch 18): construction stage method page (see kbx_stage.js)
let kfc = null; const KFC = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:open|methods\/delivery-forecast)\/?$/;   // n17c (batch 17): /open live figures, delivery-forecast method page (see kbx_fc.js)
let k27a = null; const K27A = /^\/answers\/(?:place|developer)\/[a-z0-9-]{1,90}\.md$|^\/api\/v1\/projects\/[a-z0-9-]{1,90}\.csv$|^\/corrections\.(?:json|md)$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?developers\/[a-z0-9-]{1,90}\/dashboard\/?$|^\/yc(?:\/try)?\/?$|^\/api\/open\/(?:usage|rv)\/?$/;   // n27a: keep equal to PATHS in kbx_n27a.js
let kn31c = null; const KN31C = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?stalled\/?$|^\/api\/v1\/stalled$/;   // n31c (batch 31): keep equal to PATHS in kbx_n31c.js
const KN31A = /^\/(?:(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:projects|developers)\/|api\/v1\/(?:projects|developers)\/|answers\/developer\/)[a-z0-9-]{1,90}(?:\/|\.md|\.csv|$)/;   // n31c: pages that can be an alias (kbx_n31c.js aliasRedirect)
let kn31x = null; const KN31X = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:funnel|request-project|business|money|already-signed|report\/sample\/[a-z0-9-]{1,90})\/?$|^\/api\/open\/(?:fn|funnel|sv)$/;   // n31a (batch 31): keep equal to PATHS in kbx_n31a.js
let kn31b = null; const KN31B = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:case-studies(?:\/aykon-city-3)?|conflicts-of-interest|what-we-cannot-know|data-removal|report-fraud|transparency-report(?:\/2026)?|registers\/captures|score-history)\/?$|^\/k\/n31b\.js$|^\/data\/cases\/aykon-city-3\.json$/;   // n31b (batch 31): trust pages, report-an-error script, case data (kbx_n31b.js)
let kn37u = null; const KN37U = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:projects\/[a-z0-9-]{1,90}\/(?:record|brief)|data\/(?:gaps|changes|changes\/week|how-we-verify|markets)|registers\/malaysia)\/?$|^\/data\/n37u-se\.json$|^\/data\/changes\/feed\.atom$|^\/data\/changes(?:\/week)?\.json$|^\/(?:es|de|fr|nl|ru|zh|ar)\/(?:data|developers|engineering|yc)\/?$|^\/m\/[^/]{2,120}\/slugs\.json$|^\/projects\/[a-z0-9-]{1,90}\/record\.json$|^\/data\/gaps\.csv$/; const KN37U_INJ = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:(?:projects\/[a-z0-9-]{1,90}|engineering|yc|yc\/try|data|data\/dictionary|registers|search|m\/[^/.]{2,60}|developers\/[a-z0-9-]{2,90})\/)?$/;   // r1u (batch 37): keep equal to PATHS and INJ in kbx_n37u.js
let kn35b = null; const KN35B = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:developers\/compare|tools\/(?:vault|price-per-m2)|projects\/[a-z0-9-]{1,90}\/journey)\/?$/;   // n35b (batch 35): keep equal to PATHS in kbx_n35b.js
let kn34b = null; const KN34B = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:tools\/due-diligence|markets\/compare|search|projects\/[a-z0-9-]{1,90}\/questions)\/?$|^\/api\/v1\/projects\/[a-z0-9-]{1,90}\/questions$/;   // n34b (batch 34): keep equal to PATHS in kbx_n34b.js
let kn33a = null; const KN33A = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?delays\/?$/;   // n33a (batch 33): keep equal to PATHS in kbx_n33a.js
let kn34c = null; const KN34C = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:engineering\/(?:usage|sdk|performance|monitoring|security|mcp|search-quality)|data\/delta|verify\/transparency-log|embed\/charts)\/?$|^\/embed\/chart\/[a-z0-9-]{2,60}\/?$|^\/api\/v1\/(?:delta(?:\/\d{4}-\d{2}-\d{2}(?:\.sig)?)?|tlog(?:\/proof|\/consistency)?|charts\/[a-z0-9-]{2,60}|monitoring)$/;   // n34c (batch 34): keep equal to PATHS in kbx_n34c.js
let kn35a = null; const KN35A = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:construction-pace|prices\/asking-vs-registered(?:\/[a-z0-9-]{2,60})?|registers\/escrow-banks|signals|developers\/[a-z0-9-]{1,90}\/signals|data\/(?:contradictions|aliases|dictionary|diff|ask)|satellite\/changes)\/?$/;   // n35a (batch 35): keep equal to PATHS in kbx_n35a.js
const KN35A_INJ = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:projects\/[a-z0-9-]{1,90}|developers\/[a-z0-9-]{1,90}|m\/dubai|engineering|yc|data|data\/sql|registers|satellite\/construction-index|numbers)\/$/;   // n35a: keep equal to INJECT
let kn34a = null; const KN34A = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:track-record|sources\/health|claims\/evidence|registers\/changes|watch\/duplicates|numbers\/intervals|engineering\/reproducible|data\/history|engineering\/data-quality\/pins|data\/formats)\/?$|^\/api\/v1\/projects\/[A-Za-z0-9-]{1,90}\/(?:history|evidence)$|^\/api\/v1\/developers\/[a-z0-9-]{1,90}\/track-record$/;   // n34a (batch 34): keep equal to PATHS in kbx_n34a.js
const KN34A_INJ = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:numbers|delays|m\/[^/.]{2,60}|developers\/[a-z0-9-]{1,90}|projects\/[a-z0-9-]{1,90}|engineering|yc|data|engineering\/data-quality|registers)\/$/;   // n34a: pages that get a block (keep equal to INJECT)
let kn32x = null; const KN32X = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:data\/sql|claims\/search|anomalies|graph\/entities|verify\/offline|engineering\/(?:provenance|early-hints)|changes\/live|watch\/website-changes|satellite\/construction-index)\/?$|^\/api\/v1\/(?:stream|provenance)$|^\/sql\/?$/;   // n32x (batch 32): keep equal to PATHS in kbx_n32x.js
let kn31t = null; const KN31T = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:engineering\/(?:architecture|modules|rollback|licenses|checks|maintenance)|shortcuts|security\/disclosure|press\/cases|press\/data-journalism)\/?$|^\/(?:es|de|fr|nl|ru|zh|ar)\/press(?:\/monthly)?\/?$|^\/api\/v1\/alerts$|^\/security\.txt$/;   // n31t (batch 31): keep equal to PATHS in kbx_n31t.js
let kn30b = null; const KN30B = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:data\/snapshots|api\/docs|engineering\/data-quality|offline|projects\/[a-z0-9-]{1,90}\/certificate)\/?$|^\/api\/v1\/(?:snapshots|openapi\.json|data-quality|changes(?:\/feed\.json)?|projects\/[a-z0-9-]{1,90}\/certificate|developers\/[a-z0-9-]{1,90}\/website)$|^\/manifest\.webmanifest$/;   // n30b (batch 30): keep equal to PATHS in kbx_n30b.js
let knum = null; const KNUM = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?numbers\/?$/;   // n26i: keep equal to PAGE in kbx_numbers.js
const LLP = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(?:rankings\/transparency\/|countries\/|rankings\/)?$/;   // n26i: pages that carry the least-linked project block
let kfa = null; const KFA = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:handover\/overdue(?:\/[a-z0-9-]{2,60})?|handover(?:\/20\d\d\/[a-z0-9-]{2,60})?|areas(?:\/[a-z0-9-]{2,60}\/[a-z0-9-]{2,80})?|vs\/[a-z0-9-]{3,200}-vs-[a-z0-9-]{2,200})\/?$|^\/handover\/sitemap\.xml$/;   // n26s (batch 26): handover year and place, neighbourhoods, same-year comparisons (see kbx_facets.js)
let kh29 = null; const KH29 = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:rankings\/developers(?:\/[a-z0-9-]{2,60})?|permits(?:\/[a-z0-9-]{2,60})?|price-ranges(?:\/[a-z0-9-]{2,60})?|ownership(?:\/[a-z-]{2,30})?|golden-visa(?:\/[a-z-]{2,30})?|airports(?:\/[a-z]{3})?|reports(?:\/[a-z0-9-]{2,60})?|developers\/[a-z0-9-]{2,100}-vs-[a-z0-9-]{2,100})\/?$|^\/reports\/sitemap\.xml$/;   // n29h1 (batch 29): place data pages, developer comparisons (keep equal to PATHS in kbx_h29.js)
let knm = null; const KNM = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:projects|developers)(?:\/|$)|^\/api\/seo\/(?:urls|scan)$/;   // seoP named pages, keep equal to PATHS in kbx_named.js
let kbix = null; const KBIX = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?tools\/bulk-check\/?$/;   // n21d (batch 21): bulk check against the public index, in the browser, 8 languages (keep equal to PAGE in kbx_bulkix.js)
let kcal = null; const KCAL = /^\/projects\/[a-z0-9-]{1,90}\/calendar\.ics$/;   // n21d (batch 21): promised dates of a named project as an iCalendar file (keep equal to PATHS in kbx_cal.js)
let kxc = null; const KXC = /^\/k\/xray-cta\.js$|^\/api\/x\/xc(\/|$)|^\/embed\/xray(\.js|\/)?$|^\/__k\/kxc-admin\.js$/;   // x11c (batch 11): X-ray conversion block, partner embed, admin tab (keep equal to PATHS in kbx_xc.js)
let kcite = null; const KCITE = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:stories|changes)(?:\/.*)?$|^\/embed\/(?:card|tracker|badge|p)\/.*$|^\/answers\/[a-z0-9-]{1,90}\.md$|^\/llms-projects\.txt$|^\/(?:es|de|fr|nl|ru|zh|ar)\/llms\.txt$|^\/llms\/[a-z0-9-]{2,60}\.txt$|^\/llms-full\/[a-z0-9-]{2,60}\.txt$/;   // s15c: keep equal to PATHS in kbx_cite.js
let ke29 = null, ke29l = null; const KE29 = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:editorial-policy|how-we-work|sources|buyer-protection-law|countries\/foreign-buyers)\/?$/;   // n29e (batch 29): trust pages (kbx_e29.js)
let kn33b = null; const KN33B = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:reports\/transparency(?:\/20\d\d-[01]\d)?|transparency-badge\/developers)\/?$|^\/reports\/transparency(?:\/20\d\d-[01]\d)?\.csv$|^\/embed\/transparency\/developer\/[a-z0-9-]{1,90}\.svg$/;   // n33b (batch 33): monthly transparency report by market, developer badge (keep equal to PATHS in kbx_n33b.js)
const KN33C = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:press\/monthly|press\/data|research(?:\/[a-z0-9-]{1,80})?|index\/(?:delays|prices)|transparency-index|rankings(?:\/[a-z0-9-]{1,60}){0,2}|handover(?:\/[a-z0-9-]{1,60}){0,2}|numbers|data|reports)\/$/;   // n33b: report pages that get a citation block (keep equal to CITE_RX)
let kt27 = null; const KT27 = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:corrections|buyer-cases|cite|contact|transparency-badge)\/?$|^\/embed\/transparency\/[a-z0-9-]{1,90}\.svg$|^\/rankings\/transparency(?:\/[a-z0-9-]{2,40})?\.csv$/;   // n27t (batch 27): corrections log, buyer cases, how to cite, contact, transparency badge, ranking CSV (kbx_t27.js)
let ktru = null; const KTRU = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:progress(?:\/improvements)?|moderation|team|press\/places(?:\/[a-z0-9-]{2,40})?)\/?$|^\/progress\/sitemap\.xml$|^\/api\/x\/progress(?:\/today)?\/?$/;   // n26y (batch 26): progress, 300 improvements, press figures per place, moderation policy, team and method (see kbx_trust.js)
let kn33i = null;   // n33i (batch 33): old query URLs, API noindex, parameter links, crawler 304s (kbx_n33i.js)
let k404 = null;   // n25e: 301 map, 410 and the translated 404 page (kbx_404.js)
let kn32t = null; const KN32T = /^\/(?:es|de|fr|nl|ru|zh|ar)\/(?:tools\/[a-z-]{3,30}|new|vs|m|registers)\/?$/;   // n32t (batch 32): tool pages, registers guide, new, vs and markets hubs in 7 more languages (keep equal to PATHS in kbx_n32t.js)
let kn31s = null; const KN31S = /^\/(?:es|de|fr|nl|ru|zh|ar)\/(?:tools|glossary)\/?$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:docs|reports\/month)\/?$|^\/engineering\/notes(?:\/[a-z0-9-]{3,60})?\/?$|^\/projects\/[a-z0-9-]{1,90}\.md$/;   // n31s (batch 31): translated tools hub and glossary, figures of the month, developer docs hub, engineering notes, project markdown (keep equal to PATHS in kbx_n31s.js)
let kseo = null; const KSEO = /^\/(sitemap_index\.xml|api\/seo\/lastmod|sitemaps\/[a-z0-9-]+\.xml|llms(-full)?\.txt|countries(\/.*)?|rankings(\/.*)?|new\/?|vs(\/.*)?|embed\/(delay|project|widgets)(\/.*)?|engineering\/seo\/?|press\/delivery-index(\/.*)?|7f3c9a1e5b2d4c8fa06e91d3b7c4f259\.txt)$/;   // keep equal to PATHS in kbx_seo.js
// rh-kcheck-v2: realhunt.co runtime layer (Kolaboro deal box, sponsored Kolaboro feed card, Eco Beach City at 36,500) at /__k/kcheck.js; kolaboro.com "from RealHunt" banner at /__k/kbrh.js
const KCHECK = "/* realhunt.co runtime layer v6 (30-oct-2026), served by the web-lovable worker at /__k/kcheck.js.\n   1) Kolaboro box on deal pages: visitor in another country than the home and price >= EUR 80,000 (?kb=1 forces it).\n   2) Sponsored Kolaboro card in the home feed (\"check any home\").\n   Events go to realhunt.kb_events and to GA (gtag). */\n(function () {\n  if (window.__rhplus) return; window.__rhplus = 1;\n  var TH = 80000, AK = 'sb_publishable_WWMM9pbZfP4hJosLJlTobg_lWFGoJ3X';\n  var rows = {}, geo, geoAsked = false, key = '', seen = {};\n  function L() { return (document.documentElement.lang || 'en').slice(0, 2) === 'es' ? 'es' : 'en'; }\n  function sid() { try { return localStorage.getItem('rh_sid') || ''; } catch (e) { return ''; } }\n  function log(kind, extra) {\n    var b = { kind: kind, placement: (extra && extra.placement) || null, slug: (extra && extra.slug) || null, viewer: geo || null, lang: L(), sid: sid().slice(0, 60) };\n    if (extra && extra.url) { b.url = String(extra.url).slice(0, 500); b.domain = String(extra.domain || '').slice(0, 120) || null; }\n    try { if (window.gtag) gtag('event', 'kolaboro_' + kind, { slug: b.slug || '', viewer: b.viewer || '' }); } catch (e) {}\n    try { fetch('/__sb/realhunt/rest/v1/kb_events', { method: 'POST', keepalive: true, headers: { apikey: AK, Authorization: 'Bearer ' + AK, 'content-type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(b) }); } catch (e) {}\n  }\n  function askGeo() { if (geoAsked) return; geoAsked = true; fetch('/api/geo').then(function (r) { return r.json(); }).then(function (g) { geo = (g && g.country) || null; }).catch(function () { geo = null; }); }\n  function kurl(u, medium, slug) {\n    return 'https://kolaboro.com/check' + (u ? '?url=' + encodeURIComponent(u) + '&' : '?') + 'utm_source=realhunt&utm_medium=' + medium + '&utm_campaign=' + encodeURIComponent(slug || 'sponsored') + (slug && medium === 'deal_page' ? '&rh=' + encodeURIComponent(slug) : '');\n  }\n  function el(tag, css, txt) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; }\n\n  /* ---------- 1) deal page box ---------- */\n  var TD = {\n    en: { h: 'Buying from abroad? Check it before you pay a deposit', p: 'Free AI check of this listing in about a minute: who is selling, title and permits, red flags. If you want more, a local agent can verify it on site for \u20ac490.', b: 'Check this home with Kolaboro \u2192', s: 'Sponsored. Kolaboro is the buyer-verification service from the team behind RealHunt.' },\n    es: { h: '\u00bfCompras desde fuera? Compru\u00e9bala antes de pagar la reserva', p: 'Revisi\u00f3n gratis con IA de este anuncio en un minuto: qui\u00e9n vende, escrituras y permisos, se\u00f1ales de alarma. Si quieres m\u00e1s, un agente local la verifica en persona por 490 \u20ac.', b: 'Comprobar esta casa con Kolaboro \u2192', s: 'Patrocinado. Kolaboro es el servicio de verificaci\u00f3n de compradores del equipo de RealHunt.' }\n  };\n  function name(cc) { try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(cc); } catch (e) { return cc; } }\n  function same(a, b) { a = String(a || '').toLowerCase(); b = String(b || '').toLowerCase(); return a === b || (a.indexOf('united states') === 0 && b.indexOf('united states') === 0); }\n  function loadDeal(slug) {\n    if (rows[slug] !== undefined) return; rows[slug] = null;\n    fetch('/__sb/realhunt/rest/v1/community_deals?status=eq.approved&select=price_eur,country,source_url&slug=eq.' + encodeURIComponent(slug), { headers: { apikey: AK, Authorization: 'Bearer ' + AK } })\n      .then(function (r) { return r.json(); }).then(function (d) { rows[slug] = (d && d[0]) || false; }).catch(function () { rows[slug] = false; });\n  }\n  function anchor() {\n    var c = ['.hv-aside-cta', '.hunt-detail-actions', '.hv-amenities', '.hv-detail-where'];\n    for (var i = 0; i < c.length; i++) { var e = document.querySelector(c[i]); if (e && e.offsetParent !== null) return e; }\n    return null;\n  }\n  function dealBox(row, slug, lg) {\n    var t = TD[lg], a = el('div', 'margin:14px 0;padding:14px 16px;border-radius:14px;border:1px solid rgba(15,118,110,.35);background:rgba(15,118,110,.07);color:inherit;font-size:14px;line-height:1.45;text-align:left');\n    a.id = 'rh-kb'; a.setAttribute('data-k', slug + '|' + lg);\n    a.appendChild(el('div', 'font-weight:700;font-size:15px;margin-bottom:4px', t.h));\n    a.appendChild(el('div', 'opacity:.85;margin-bottom:10px', t.p));\n    var b = el('a', 'display:inline-block;background:#0f766e;color:#fff;font-weight:600;padding:10px 14px;border-radius:10px;text-decoration:none', t.b);\n    b.href = kurl(row.source_url, 'deal_page', slug); b.target = '_blank'; b.rel = 'noopener';\n    b.addEventListener('click', function () { log('deal_click', { slug: slug, placement: 'deal' }); });\n    a.appendChild(b);\n    a.appendChild(el('div', 'opacity:.6;font-size:12px;margin-top:8px', t.s));\n    return a;\n  }\n  function dealTick() {\n    var m = location.pathname.match(/^\\/deal\\/([^/?#]+)/), old = document.getElementById('rh-kb');\n    if (!m) { if (old) old.remove(); key = ''; return; }\n    var slug = decodeURIComponent(m[1]), lg = L();\n    if (old && old.getAttribute('data-k') === slug + '|' + lg) return;\n    if (old && old.getAttribute('data-k').split('|')[0] !== slug) { old.remove(); old = null; }\n    askGeo(); loadDeal(slug);\n    if (rows[slug] === null || rows[slug] === undefined || geo === undefined) return;\n    var row = rows[slug], force = /[?&]kb=1/.test(location.search);\n    var ok = row && row.source_url && (force || (row.price_eur >= TH && geo && !same(name(geo), row.country)));\n    if (!ok) { if (old) old.remove(); return; }\n    var an = anchor(); if (!an) return;\n    if (old) old.remove();\n    an.parentNode.insertBefore(dealBox(row, slug, lg), an.nextSibling);\n    if (key !== slug) { key = slug; log('deal_view', { slug: slug, placement: 'deal' }); }\n  }\n\n  /* ---------- 2) sponsored Kolaboro card in the feed (v4: clear promise, 3 steps, example report) ---------- */\n  var TF = {\n    en: { lab: 'Sponsored \u00b7 Kolaboro', badge: 'Free \u00b7 1 minute \u00b7 any country',\n          h: 'Is this home legit? Check it before you pay a deposit.',\n          sub: 'Paste the link of any listing you found abroad. Kolaboro tells you who is really selling and what to ask before you send money.',\n          st: [['Paste the link', 'Idealista, Rightmove, Zillow, any agency'], ['AI checks it in 1 min', 'Seller, title, permits, price vs. area'], ['Want certainty?', 'Full check from \u20ac490; site visits by a local agent are being set up']],\n          ph: 'Paste a listing link or website\u2026', b: 'Check it free \u2192', bad: 'Paste a link or a website, e.g. idealista.com/inmueble/123', note: 'No sign-up. Free report.',\n          ex: 'Example report', home: 'Sea-view villa \u00b7 Algarve \u00b7 \u20ac320,000', src: 'idealista.pt',\n          sc: 'Trust score', scv: 'Fair, ask 2 questions',\n          r: [['ok', 'Seller found: registered agency'], ['ok', 'Price in line with the area'], ['warn', 'Habitation licence not shown'], ['warn', 'Owner name differs from seller']] },\n    es: { lab: 'Patrocinado \u00b7 Kolaboro', badge: 'Gratis \u00b7 1 minuto \u00b7 cualquier pa\u00eds',\n          h: '\u00bfEsta casa es de fiar? Compru\u00e9bala antes de pagar la reserva.',\n          sub: 'Pega el enlace de cualquier anuncio que hayas visto fuera. Kolaboro te dice qui\u00e9n vende de verdad y qu\u00e9 preguntar antes de mandar dinero.',\n          st: [['Pega el enlace', 'Idealista, Rightmove, Zillow, cualquier agencia'], ['La IA lo revisa en 1 min', 'Vendedor, escrituras, permisos, precio de zona'], ['\u00bfQuieres certeza?', 'Comprobaci\u00f3n completa desde 490 \u20ac; las visitas de un agente local est\u00e1n en preparaci\u00f3n']],\n          ph: 'Pega el enlace de un anuncio o una web\u2026', b: 'Comprobar gratis \u2192', bad: 'Pega un enlace o una web, por ejemplo idealista.com/inmueble/123', note: 'Sin registro. Informe gratis.',\n          ex: 'Informe de ejemplo', home: 'Villa con vistas al mar \u00b7 Algarve \u00b7 320.000 \u20ac', src: 'idealista.pt',\n          sc: 'Nota de confianza', scv: 'Correcta, 2 preguntas',\n          r: [['ok', 'Vendedor: agencia registrada'], ['ok', 'Precio acorde a la zona'], ['warn', 'No muestra licencia de habitabilidad'], ['warn', 'El titular no coincide con quien vende']] }\n  };\n  var CSS = '.rkb{grid-column:1/-1;border-radius:20px;overflow:hidden;background:linear-gradient(135deg,#062b27 0%,#0b4f48 55%,#0f766e 100%);color:#fff;box-shadow:0 10px 30px rgba(6,43,39,.18);position:relative}' +\n    '.rkb *{box-sizing:border-box}.rkb-in{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:28px;padding:28px;align-items:center}' +\n    '.rkb-top{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px}' +\n    '.rkb-lab{font-size:11px;letter-spacing:.06em;text-transform:uppercase;opacity:.7}' +\n    '.rkb-badge{font-size:12px;font-weight:700;background:#fbbf24;color:#3b2a00;border-radius:999px;padding:4px 10px}' +\n    '.rkb h2{font-size:clamp(22px,2.6vw,30px);line-height:1.15;margin:0 0 10px;font-weight:800;color:#fff;letter-spacing:-.01em}' +\n    '.rkb-sub{font-size:15px;line-height:1.5;opacity:.88;margin:0 0 18px}' +\n    '.rkb-steps{list-style:none;margin:0 0 18px;padding:0;display:grid;gap:10px}' +\n    '.rkb-steps li{display:flex;gap:12px;align-items:flex-start;font-size:14px;line-height:1.35}' +\n    '.rkb-n{flex:0 0 26px;height:26px;border-radius:50%;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px}' +\n    '.rkb-steps b{display:block;font-weight:700}.rkb-steps span{opacity:.75;font-size:13px}' +\n    '.rkb-f{display:flex;gap:8px;flex-wrap:wrap;background:#fff;border-radius:14px;padding:6px}' +\n    '.rkb-f input{flex:1 1 180px;min-width:0;border:0;outline:0;background:transparent;color:#0f172a;font:inherit;font-size:15px;padding:10px 10px}' +\n    '.rkb-f button{flex:0 0 auto;border:0;cursor:pointer;border-radius:10px;padding:11px 16px;font-weight:700;font-size:15px;background:#ea580c;color:#fff}' +\n    '.rkb-f button:hover{background:#c2410c}.rkb-note{font-size:12px;opacity:.7;margin-top:8px}' +\n    '.rkb-rep{display:block;background:#fff;color:#0f172a;border-radius:16px;padding:16px;box-shadow:0 18px 40px rgba(0,0,0,.3);text-decoration:none;max-width:420px;width:100%;justify-self:center;transform:rotate(-1deg)}' +\n    '.rkb-rep:hover{transform:rotate(0)}.rkb-rh{display:flex;justify-content:space-between;align-items:center;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#0f766e;font-weight:800;margin-bottom:10px}' +\n    '.rkb-url{font-size:12px;color:#475569;background:#f1f5f9;border-radius:8px;padding:6px 8px;margin-bottom:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +\n    '.rkb-sc{display:flex;gap:14px;align-items:center;margin-bottom:12px}' +\n    '.rkb-ring{flex:0 0 64px;height:64px;border-radius:50%;background:conic-gradient(#f59e0b 0 72%,#e2e8f0 72% 100%);display:flex;align-items:center;justify-content:center}' +\n    '.rkb-ring div{width:50px;height:50px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800}' +\n    '.rkb-sc b{display:block;font-size:15px}.rkb-sc span{font-size:12px;color:#64748b}' +\n    '.rkb-row{display:flex;gap:8px;align-items:center;font-size:13px;padding:5px 0;border-top:1px solid #f1f5f9}' +\n    '.rkb-i{flex:0 0 18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff}' +\n    '.rkb a.rkb-rep,.rkb a.rkb-rep b,.rkb .rkb-ring div,.rkb .rkb-row span+span{color:#0f172a!important}.rkb a.rkb-rep .rkb-sc span{color:#64748b!important}.rkb a.rkb-rep .rkb-rh span:first-child{color:#0f766e!important}' +\n    '.rkb .rkb-f input{background:#fff!important;color:#0f172a!important;border:0!important;box-shadow:none!important}.rkb .rkb-f input::placeholder{color:#64748b}' +\n    '@media (max-width:560px){.rkb-in{padding:20px;gap:18px}.rkb-sub{display:none}.rkb-rep{transform:none}.rkb-f button{flex:1 1 100%}.rkb-row:nth-of-type(n+7){display:none}}';\n  /* accepts \"idealista.com/inmueble/123\", \"www.x.com\", \"https://...\" or text with a link inside; null for plain words */\n  function normUrl(v) {\n    v = String(v || '').trim(); if (!v) return null;\n    var m = v.match(/https?:\\/\\/[^\\s\"'<>]+/i) || v.match(/(?:www\\.)?[a-z0-9-]+(?:\\.[a-z0-9-]+)*\\.[a-z]{2,}(?:[\\/?#][^\\s\"'<>]*)?/i);\n    if (!m) return null;\n    var u = m[0].replace(/[),.;]+$/, ''); if (!/^https?:\\/\\//i.test(u)) u = 'https://' + u;\n    try { var x = new URL(u); if (!/\\./.test(x.hostname)) return null; return { url: x.href, domain: x.hostname.replace(/^www\\./, '').toLowerCase() }; } catch (e) { return null; }\n  }\n  function feedCard(lg) {\n    var t = TF[lg];\n    if (!document.getElementById('rkb-css')) { var st = el('style'); st.id = 'rkb-css'; st.textContent = CSS; document.head.appendChild(st); }\n    var span = el('div'); span.className = 'hx-span'; span.setAttribute('data-rhkb', lg);\n    var art = el('article'); art.className = 'rkb'; art.setAttribute('aria-label', t.lab); span.appendChild(art);\n    var inr = el('div'); inr.className = 'rkb-in'; art.appendChild(inr);\n    var L1 = el('div'); inr.appendChild(L1);\n    var top = el('div'); top.className = 'rkb-top';\n    var bd = el('span', null, t.badge); bd.className = 'rkb-badge'; top.appendChild(bd);\n    var lb = el('span', null, t.lab); lb.className = 'rkb-lab'; top.appendChild(lb); L1.appendChild(top);\n    L1.appendChild(el('h2', null, t.h));\n    var sb = el('p', null, t.sub); sb.className = 'rkb-sub'; L1.appendChild(sb);\n    var ol = el('ol'); ol.className = 'rkb-steps';\n    t.st.forEach(function (s, i) { var li = el('li'); var n = el('span', null, String(i + 1)); n.className = 'rkb-n'; li.appendChild(n); var tx = el('div'); tx.appendChild(el('b', null, s[0])); tx.appendChild(el('span', null, s[1])); li.appendChild(tx); ol.appendChild(li); });\n    L1.appendChild(ol);\n    var f = el('form'); f.className = 'rkb-f';\n    var inp = el('input'); inp.type = 'text'; f.noValidate = true; inp.spellcheck = false; inp.setAttribute('autocapitalize', 'off'); inp.placeholder = t.ph; inp.setAttribute('aria-label', t.ph); inp.autocomplete = 'off'; inp.inputMode = 'url';\n    var btn = el('button', null, t.b); btn.type = 'submit';\n    f.appendChild(inp); f.appendChild(btn); L1.appendChild(f);\n    var nt = el('div', null, t.note); nt.className = 'rkb-note'; L1.appendChild(nt);\n    var hint = el('div', 'display:none;font-size:13px;margin-top:8px;color:#fde68a'); L1.appendChild(hint);\n    inp.addEventListener('input', function () { hint.style.display = 'none'; });\n    f.addEventListener('submit', function (e) {\n      e.preventDefault();\n      var n = normUrl(inp.value);\n      if (inp.value.trim() && !n) { hint.textContent = t.bad; hint.style.display = 'block'; inp.focus(); return; }\n      if (n) inp.value = n.url;\n      log(n ? 'feed_paste' : 'feed_click', { placement: 'feed_form', url: n && n.url, domain: n && n.domain });\n      window.open(kurl(n ? n.url : '', 'feed_card', 'sponsored_check'), '_blank', 'noopener');\n    });\n    var rep = el('a'); rep.className = 'rkb-rep'; rep.href = kurl('', 'feed_card', 'sponsored_check'); rep.target = '_blank'; rep.rel = 'noopener';\n    rep.addEventListener('click', function () { log('feed_click', { placement: 'feed_visual' }); });\n    var rh = el('div'); rh.className = 'rkb-rh'; rh.appendChild(el('span', null, t.ex)); rh.appendChild(el('span', 'color:#94a3b8', 'Kolaboro')); rep.appendChild(rh);\n    var ur = el('div', null, '\ud83d\udd17 ' + t.src + ' \u00b7 ' + t.home); ur.className = 'rkb-url'; rep.appendChild(ur);\n    var sc = el('div'); sc.className = 'rkb-sc'; var ring = el('div'); ring.className = 'rkb-ring'; ring.appendChild(el('div', null, '72')); sc.appendChild(ring);\n    var sct = el('div'); sct.appendChild(el('b', null, t.scv)); sct.appendChild(el('span', null, t.sc + ' 72/100')); sc.appendChild(sct); rep.appendChild(sc);\n    t.r.forEach(function (r) { var row = el('div'); row.className = 'rkb-row'; var ic = el('span', 'background:' + (r[0] === 'ok' ? '#0f766e' : '#d97706'), r[0] === 'ok' ? '\u2713' : '!'); ic.className = 'rkb-i'; row.appendChild(ic); row.appendChild(el('span', null, r[1])); rep.appendChild(row); });\n    inr.appendChild(rep);\n    try { new IntersectionObserver(function (es, o) { es.forEach(function (x) { if (x.isIntersecting && !seen.feed) { seen.feed = 1; log('feed_view', { placement: 'feed' }); o.disconnect(); } }); }, { threshold: 0.5 }).observe(span); } catch (e) {}\n    return span;\n  }\n  function feedTick() {\n    var g = document.querySelector('.hx-grid'); if (!g) return;\n    var lg = L(), cur = g.querySelector(':scope > [data-rhkb]');\n    /* v6: after a filter change React rebuilds the grid and the card ended up first; keep it around position 18 */\n    if (cur && cur.getAttribute('data-rhkb') === lg) { var idx = Array.prototype.indexOf.call(g.children, cur); if (idx >= 12) return; }\n    if (cur) cur.remove();\n    var k = g.children; if (k.length < 12) return;\n    var i = Math.min(18, k.length - 1);\n    while (i < k.length - 1 && (/hx-span/.test(k[i].className) || /hx-span/.test(k[i - 1].className))) i++;\n    g.insertBefore(feedCard(lg), k[i]);\n  }\n\n  function tick() { try { dealTick(); } catch (e) {} try { feedTick(); } catch (e) {} }\n  var pend = false;\n  try { new MutationObserver(function () { if (pend) return; pend = true; requestAnimationFrame(function () { pend = false; tick(); }); }).observe(document.documentElement, { childList: true, subtree: true, characterData: true }); } catch (e) {}\n  setInterval(tick, 800); tick();\n})();\n";
const KBRH = "/* kolaboro.com/check: \"you came from RealHunt\" banner (v1, 30-oct-2026), served by the web-lovable worker at /__k/kbrh.js.\n   Shown when the URL has utm_source=realhunt and rh=<RealHunt slug>. */\n(function () {\n  var q = new URLSearchParams(location.search), slug = q.get('rh');\n  if (q.get('utm_source') !== 'realhunt' || !slug || !/^[\\w-]{3,120}$/.test(slug)) return;\n  var AK = 'sb_publishable_WWMM9pbZfP4hJosLJlTobg_lWFGoJ3X';\n  function el(tag, css, txt) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; }\n  function money(n) { try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n); } catch (e) { return '\u20ac' + n; } }\n  fetch('https://realhunt.co/__sb/realhunt/rest/v1/community_deals?status=eq.approved&select=title,price_eur,location_name,country,image_urls,source_domain&slug=eq.' + encodeURIComponent(slug), { headers: { apikey: AK, Authorization: 'Bearer ' + AK } })\n    .then(function (r) { return r.json(); }).then(function (d) {\n      var h = d && d[0]; if (!h) return;\n      var az = document.getElementById('az'); if (!az || document.getElementById('kb-from-rh')) return;\n      var box = el('div', 'display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin:0 0 18px;padding:12px;border:1px solid rgba(15,23,42,.12);border-radius:14px;background:rgba(255,255,255,.7);text-align:left');\n      box.id = 'kb-from-rh';\n      var img = (h.image_urls || [])[0];\n      if (img) { var im = el('img', 'width:96px;height:72px;object-fit:cover;border-radius:10px;flex:0 0 auto'); im.src = /^https?:/.test(img) ? img : 'https://realhunt.co' + img; im.alt = ''; im.loading = 'lazy'; box.appendChild(im); }\n      var t = el('div', 'min-width:0;flex:1 1 auto;font-size:14px;line-height:1.4');\n      t.appendChild(el('div', 'font-size:11px;letter-spacing:.08em;text-transform:uppercase;opacity:.7;font-weight:700', 'From RealHunt'));\n      t.appendChild(el('div', 'font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis', h.title || ''));\n      t.appendChild(el('div', 'opacity:.8', [money(h.price_eur), h.location_name, h.country].filter(Boolean).join(' \u00b7 ')));\n      t.appendChild(el('div', 'opacity:.8;margin-top:2px', 'We are reading the listing' + (h.source_domain ? ' on ' + h.source_domain : '') + ' now. Your free desk review appears below.'));\n      box.appendChild(t);\n      var back = el('a', 'flex:0 0 auto;font-size:13px;white-space:nowrap', '\u2190 Back to the home'); back.href = 'https://realhunt.co/deal/' + encodeURIComponent(slug); box.appendChild(back);\n      az.parentNode.insertBefore(box, az);\n      try { if (window.kbEvent) kbEvent('rh_ref', { slug: slug }); } catch (e) {}\n    }).catch(function () {});\n})();\n";
// rh-ktraffic-v1: kolaboro.com/admin "Traffic" tab at /__k/ktraffic.js (sources of visits + RealHunt placements; RPC kolaboro_traffic)
const KTRAF = "/* kolaboro.com/admin: \"Traffic\" tab (v1, 30-oct-2026), served by the web-lovable worker at /__k/ktraffic.js.\n   Where kolaboro.com visitors come from (first-touch source per visit) and what the RealHunt placements send:\n   card views, clicks, links pasted (which sites people check) and which homes send clicks. Data: RPC kolaboro_traffic. */\n(function () {\n  if (window.__ktraf) return; window.__ktraf = 1;\n  var days = 30, busy = false;\n  function $(i) { return document.getElementById(i); }\n  function okHref(u) { u = String(u == null ? '' : u).trim(); return u.charAt(0) === '/' || u.toLowerCase().indexOf('https://') === 0 || u.toLowerCase().indexOf('http://') === 0 ? u : '#'; }\n  function esc(x) { return String(x == null ? '' : x).replace(/[&<>\"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', \"'\": '&#39;' }[c]; }); }\n  function when(t) { var d = new Date(t), s = (Date.now() - d) / 1000; if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min ago'; if (s < 86400) return Math.round(s / 3600) + ' h ago'; return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ' ' + d.toTimeString().slice(0, 5); }\n  function table(head, rows) { if (!rows.length) return '<p class=\"muted\" style=\"margin:6px 0\">Nothing yet in this period.</p>'; return '<div class=\"tw\"><table><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr>' + rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>'; }\n  function bars(list, key, key2) {\n    if (!list.length) return '<p class=\"muted\">Nothing yet.</p>';\n    var mx = Math.max.apply(null, list.map(function (x) { return x[key] || 0; }).concat([1]));\n    return '<div style=\"display:flex;align-items:flex-end;gap:3px;height:120px;padding-top:8px\">' + list.map(function (x) {\n      var h = Math.round(100 * (x[key] || 0) / mx), h2 = key2 ? Math.round(100 * (x[key2] || 0) / mx) : 0;\n      return '<div title=\"' + esc(x.d) + ': ' + (x[key] || 0) + (key2 ? ' (' + (x[key2] || 0) + ' from RealHunt)' : '') + '\" style=\"flex:1;min-width:6px;height:' + Math.max(h, 2) + '%;background:#FFE6D9;border-radius:4px 4px 0 0;position:relative\">' + (h2 ? '<div style=\"position:absolute;bottom:0;left:0;right:0;height:' + Math.round(100 * h2 / Math.max(h, 1)) + '%;background:#0f766e;border-radius:4px 4px 0 0\"></div>' : '') + '</div>';\n    }).join('') + '</div>';\n  }\n  function kpi(a, b, c) { return '<div class=\"kpi\"><span>' + a + '</span><b>' + b + '</b><small>' + c + '</small></div>'; }\n  function render(d) {\n    var rh = d.rh || {}, k = rh.kinds || {}, td = rh.today || {}, rv = (d.sources || []).filter(function (s) { return s.src === 'realhunt'; }).reduce(function (a, s) { return a + s.n; }, 0);\n    var leadRh = (d.lead_sources || []).filter(function (s) { return s.src === 'realhunt'; })[0] || { n: 0, desk: 0 };\n    var clicks = (k.feed_click || 0) + (k.deal_click || 0) + (k.feed_paste || 0);\n    var html = '<div class=\"kpis\">' +\n      kpi('Kolaboro visits', d.visits || 0, 'last ' + days + ' days, 1 per session') +\n      kpi('Visits from RealHunt', rv, (d.visits ? Math.round(100 * rv / d.visits) : 0) + '% of all visits') +\n      kpi('Leads from RealHunt', leadRh.n, leadRh.desk + ' desk reviews') +\n      kpi('RealHunt card views', (k.feed_view || 0) + (k.deal_view || 0), 'today ' + ((td.feed_view || 0) + (td.deal_view || 0))) +\n      kpi('Links checked from RealHunt', k.feed_paste || 0, 'today ' + (td.feed_paste || 0)) +\n      kpi('Clicks to Kolaboro', clicks, ((k.feed_view || 0) + (k.deal_view || 0) ? (100 * clicks / ((k.feed_view || 0) + (k.deal_view || 0))).toFixed(1) : '0') + '% of views') +\n      '</div>';\n    html += '<div class=\"card\"><h2>Where Kolaboro visitors come from</h2><p class=\"muted\" style=\"margin:0 0 8px;font-size:.85rem\">First source of each visitor (utm_source, ad click id or referring site). One row per session.</p>' +\n      table(['Source', 'Medium', 'Visits', 'Last'], (d.sources || []).map(function (s) { return [esc(s.src), esc(s.medium || '-'), '<b>' + s.n + '</b>', when(s.last)]; })) + '</div>';\n    html += '<div class=\"card\"><h2>Visits per day</h2><p class=\"muted\" style=\"margin:0;font-size:.85rem\">Green part = from RealHunt.</p>' + bars(d.daily || [], 'n', 'rh') + '</div>';\n    html += '<div class=\"card\"><h2>Leads by source</h2>' + table(['Source', 'Leads', 'Desk reviews', 'Check requests'], (d.lead_sources || []).map(function (s) { return [esc(s.src), '<b>' + s.n + '</b>', s.desk, s.checks]; })) +\n      '<h2 style=\"margin-top:16px\">Campaigns</h2>' + table(['Source', 'Campaign', 'Visits'], (d.campaigns || []).map(function (s) { return [esc(s.src), esc(s.campaign), s.n]; })) +\n      '<h2 style=\"margin-top:16px\">Landing pages</h2>' + table(['Page', 'Visits'], (d.landing || []).map(function (s) { return ['<a href=\"' + esc(okHref(s.page)) + '\" target=\"_blank\" rel=\"noopener\">' + esc(s.page) + '</a>', s.n]; })) + '</div>';\n    html += '<div class=\"card\"><h2>RealHunt \u2192 Kolaboro</h2><p class=\"muted\" style=\"margin:0 0 8px;font-size:.85rem\">Sponsored card in the realhunt.co feed and the box on home pages (shown to foreign visitors on homes of \u20ac80k or more).</p>' +\n      bars((rh.daily || []).map(function (x) { return { d: x.d, v: x.views, c: x.clicks + x.pastes }; }), 'v', 'c') +\n      '<p class=\"muted\" style=\"font-size:.85rem;margin:4px 0 12px\">Bars = views, green = clicks and links pasted.</p>' +\n      '<h2>Which sites people check</h2>' + table(['Site', 'Links pasted', 'Last'], (rh.domains || []).map(function (s) { return ['<b>' + esc(s.domain) + '</b>', s.n, when(s.last)]; })) +\n      '<h2 style=\"margin-top:16px\">Latest links pasted</h2>' + table(['When', 'Link', 'Visitor country', 'Lang'], (rh.pastes || []).map(function (s) { return [when(s.ts), '<a href=\"' + esc(okHref(s.url)) + '\" target=\"_blank\" rel=\"noopener noreferrer\">' + esc(String(s.url || '').slice(0, 90)) + '</a>', esc(s.viewer || '?'), esc(s.lang || '')]; })) +\n      '<h2 style=\"margin-top:16px\">Homes that show the box</h2>' + table(['Home', 'Box views', 'Clicks'], (rh.homes || []).map(function (s) { return ['<a href=\"https://realhunt.co/deal/' + encodeURIComponent(s.slug) + '\" target=\"_blank\" rel=\"noopener\">' + esc(s.slug) + '</a>', s.views, '<b>' + s.clicks + '</b>']; })) +\n      '<h2 style=\"margin-top:16px\">Visitor countries on RealHunt</h2>' + table(['Country', 'Views and clicks', 'Clicks and pastes'], (rh.countries || []).map(function (s) { return [esc(s.viewer), s.n, s.acts]; })) + '</div>';\n    $('t-traffic-body').innerHTML = html;\n  }\n  function load() {\n    if (busy || !window.KBADM) return; busy = true; $('t-traffic-body').innerHTML = '<p class=\"muted\">Loading\u2026</p>';\n    window.KBADM.rpc('kolaboro_traffic', { p_key: window.KBADM.pw(), p_days: days }).then(function (d) {\n      busy = false; if (!d || d.error) { $('t-traffic-body').innerHTML = '<p class=\"muted\">Could not load (' + esc(d && (d.error || d.message)) + ').</p>'; return; } render(d);\n    }).catch(function (e) { busy = false; $('t-traffic-body').innerHTML = '<p class=\"muted\">Could not load.</p>'; });\n  }\n  function setup() {\n    var nav = document.querySelector('nav.tabs'), main = document.querySelector('main'); if (!nav || !main || !window.KBADM) return false;\n    if ($('t-traffic')) return true;\n    var b = document.createElement('button'); b.setAttribute('data-t', 'traffic'); b.textContent = 'Traffic';\n    var growth = nav.querySelector('[data-t=\"growth\"]'); nav.insertBefore(b, growth || null);\n    var sec = document.createElement('section'); sec.id = 't-traffic'; sec.className = 'hide';\n    sec.innerHTML = '<div style=\"display:flex;gap:8px;align-items:center;margin:0 0 12px;flex-wrap:wrap\"><b>Period</b>' + [7, 30, 90].map(function (n) { return '<button data-days=\"' + n + '\" class=\"' + (n === days ? 'on' : '') + '\" style=\"padding:6px 12px;border-radius:999px;border:1px solid #ddd;background:' + (n === days ? '#111;color:#fff' : '#fff') + ';cursor:pointer\">' + n + ' days</button>'; }).join('') + '</div><div id=\"t-traffic-body\"></div>';\n    main.appendChild(sec);\n    sec.querySelectorAll('[data-days]').forEach(function (x) { x.onclick = function () { days = +x.getAttribute('data-days'); sec.querySelectorAll('[data-days]').forEach(function (y) { var on = y === x; y.style.background = on ? '#111' : '#fff'; y.style.color = on ? '#fff' : ''; }); load(); }; });\n    b.onclick = function () {\n      nav.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });\n      main.querySelectorAll(':scope > section').forEach(function (s) { s.classList.toggle('hide', s !== sec); });\n      load();\n    };\n    nav.querySelectorAll('button').forEach(function (x) { if (x !== b) x.addEventListener('click', function () { b.classList.remove('on'); sec.classList.add('hide'); }); });\n    if (location.hash === '#traffic') b.click();\n    return true;\n  }\n  var n = 0, iv = setInterval(function () { if (setup() || ++n > 120) clearInterval(iv); }, 500);\n})();\n";
const NOSPA = new Set(["thesumbatimes.com", "equinoxinvestmentgroup.com", "grownomads.com", "kolaboro.com", "aibeachcity.com", "beyondsoma.com", "blacknomadcard.com", "bootcamp.jobersity.com", "fitnessbeachcity.com", "go.realhunt.co", "onlybeachfronthomes.com", "spain.happylowcost.com", "thenomaduniversity.com", "thestartupisland.com", "happysocialclub.com", "levelshotels.com"]);
async function viaTop3(req, env, ctx) {
  const u = new URL(req.url);
  const cacheable = req.method === 'GET' && !u.pathname.startsWith('/api/geo') && !u.pathname.startsWith('/api/alerts');
  const cache = caches.default;
  const ck = new Request(u.origin + u.pathname + u.search + (u.search ? '&' : '?') + '__v=' + ((env && env.CF_PAGES_COMMIT_SHA) || 'x'), { method: 'GET', headers: req.headers });
  if (cacheable) { const hit = await cache.match(ck); if (hit) { const hh = new Headers(hit.headers); hh.set('cache-control', 'public, max-age=0, must-revalidate'); return new Response(hit.body, { status: hit.status, headers: hh }); } }
  if (!top3) top3 = (await import('./top3/index.js')).default;
  const r = await top3.fetch(req, env, ctx);
  if (cacheable && r.status === 200) { const c = r.clone(); const h = new Headers(c.headers); h.set('cache-control', 'public, max-age=1800'); ctx.waitUntil(cache.put(ck, new Response(c.body, { status: 200, headers: h }))); }
  return r;
}
// kolaboro.com: browser security headers (no framing of private pages, camera and location only for our own pages)
const KB_CITE29 = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:numbers|press\/delivery-index\/\d{4}-\d{2}|reports(?:\/[a-z0-9-]{2,40})?|rankings(?:\/[a-z0-9-]{2,40}){0,2}|handover(?:\/[a-z0-9-]{2,40}){0,2}|m\/[^/.]{2,60}|projects|vs|countries(?:\/[a-z0-9-]{2,60})?)\/$/;   // n32s (item 227): also reports, rankings, handover, market, country hubs and /projects/, /vs/   // n29e (batch 29): pages whose figures get a "Cite" button (/k/cite29.js)
function kbHeaders(r, u) {
  const ct = r.headers.get('content-type') || '';
  if (!/text\/html/.test(ct)) {
    // static files: versioned (?v=) files never change, so browsers keep them a year; fonts and images a month
    if (r.status === 200 && /\.(css|js|woff2|svg|png|webp|jpg|jpeg|gif|ico|mp4|pdf)$/i.test(u.pathname)) {
      const h = new Headers(r.headers);
      h.set('cache-control', /[?&]v=/.test(u.search) ? 'public, max-age=31536000, immutable' : (/\.(woff2|png|webp|jpg|jpeg|gif|ico|svg|mp4)$/i.test(u.pathname) ? 'public, max-age=2592000' : 'public, max-age=3600'));
      h.set('x-content-type-options', 'nosniff');
      return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
    }
    // published data (GitHub Actions rewrite these files): short cache so a new publish shows within a minute, versioned copies stay immutable
    if (r.status === 200 && /^\/data\/.+\.json$/i.test(u.pathname)) {
      const h = new Headers(r.headers);
      h.set('cache-control', /[?&]v=/.test(u.search) ? 'public, max-age=31536000, immutable' : 'public, max-age=60, stale-while-revalidate=300');
      h.set('x-content-type-options', 'nosniff');
      return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
    }
    return r;
  }
  const h = new Headers(r.headers);
  // crawl hygiene (batch 15, s15b): a page reached with a functional query (?q=, ?sort=, ?lang=, ?page= ...) is a duplicate or a thin
  // result list: noindex, follow. Tracking-only queries (utm_*, gclid, fbclid, msclkid, ref) keep the canonical as the only signal.
  if (u.search && r.status === 200 && !h.has('x-robots-tag') && [...u.searchParams.keys()].some(k => !/^(utm_[a-z_]+|gclid|fbclid|msclkid|mc_[a-z]+|ref|v)$/i.test(k))) h.set('x-robots-tag', 'noindex, follow');
  const priv = /^\/(admin|portal|login|agents\/me|agents\/apply)(\/|$)/.test(u.pathname);
  const embed = /^\/(embed|press\/data\/embed)(\/|$)/.test(u.pathname);   // widgets made to be embedded by other sites
  if (embed) h.delete('x-frame-options'); else h.set('x-frame-options', priv ? 'DENY' : 'SAMEORIGIN');
  // n20s (9 Nov 2026): script-src-attr 'none' is enforced (no inline on*= handlers are left on the site), so markup injected into a page cannot carry a handler
  h.set('content-security-policy', "frame-ancestors " + (priv ? "'none'" : embed ? "*" : "'self'") + "; base-uri 'self'; object-src 'none'; script-src-attr 'none'; form-action 'self' https://www.paypal.com https://oykcsmextclpdnugixqz.supabase.co; upgrade-insecure-requests");
  if (!h.has('referrer-policy')) h.set('referrer-policy', 'strict-origin-when-cross-origin');
  if (!h.has('content-language')) h.set('content-language', /^\/agents\/id(\/|$)/.test(u.pathname) ? 'id' : (/^\/(es|de|fr|nl|ru|zh|ar)(\/|$)/.exec(u.pathname) || [0, 'en'])[1]);   // n28a: only 2 page types sent it; Bing reads it for the page language
  if (!h.has('x-content-type-options')) h.set('x-content-type-options', 'nosniff');
  h.set('permissions-policy', 'camera=(self), microphone=(self), geolocation=(self), payment=(), usb=(), serial=(), hid=(), bluetooth=(), display-capture=(), interest-cohort=(), browsing-topics=()');   // n34s: + serial, hid, bluetooth, display-capture, browsing-topics off
  // Strict CSP trial (report-only): a fresh nonce per response is stamped on every <script> of our own static HTML, with
  // 'strict-dynamic' so trusted scripts can load GTM, Clarity, leaflet, d3 or DuckDB. 'unsafe-inline' and https: are only
  // fallbacks for pre-CSP3 browsers (ignored when a nonce is present). Reports go to /api/kb/csp. Plan: scratchpad csp-strict.txt.
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  h.set('content-security-policy-report-only', KB_CSP.replace(/\{N\}/g, nonce).replace('{FA}', priv ? "'none'" : embed ? '*' : "'self'"));
  h.set('reporting-endpoints', 'csp="/api/kb/csp"');
  // n20s: opt-in trial of the strict policy as ENFORCED on one page view (add ?csp=strict), to see what would break before it becomes the default
  // The log-in and password-reset pages (where credentials are typed) already run with the strict policy enforced: tested 9 Nov 2026 with
  // signup, log-in, wrong password, reset and analytics, no blocked script.
  if (u.searchParams.get('csp') === 'strict' || /^\/(login|reset)(\/|$)/.test(u.pathname)) h.set('content-security-policy', h.get('content-security-policy-report-only') + '; upgrade-insecure-requests');
  // n21e (11 Nov 2026): the strict SCRIPT rules are now enforced on every page: a script runs only with this response's nonce, or when a
  // script that has it loads it ('strict-dynamic'); no inline handlers, no eval (WebAssembly allowed), workers from our origin or blob: only.
  // Tested with ?csp=strict on 271 URLs and every interactive tool, the portal and the admin before the switch (scratchpad n21/n21e-issues.md).
  // The rest of the policy (connect, img, style, frame sources) stays report-only. Rollback in one line: KB_CSP_SCRIPTS = false below
  // (or Pages variable KB_CSP_STRICT=0, read at the top of fetch). Counts: /api/x/live/csp.
  else if (KB_CSP_SCRIPTS) {
    // n34s (21 Nov 2026): frame-src enforced too (0 frame reports in 30 days of report-only): only our own pages, the PayPal checkout and
    // the portal's own PDF previews (data:/blob:) can be framed inside a page, so injected markup cannot frame another site
    h.set('content-security-policy', h.get('content-security-policy') + "; script-src 'nonce-" + nonce + "' 'strict-dynamic' 'wasm-unsafe-eval' 'unsafe-inline' https:; worker-src 'self' blob:; frame-src 'self' data: blob: https://www.paypal.com https://www.sandbox.paypal.com; manifest-src 'self'; report-uri /api/kb/csp; report-to csp");
    // the script rules are enforced above, so the report-only copy stops judging scripts: a blocked script is reported once, and the
    // one false report per page view (Cloudflare gives its Zaraz loader a nonce in an enforced header only) is gone from the counts
    h.set('content-security-policy-report-only', h.get('content-security-policy-report-only').replace(/script-src [^;]+; script-src-attr 'none'; /, "script-src * 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: data:; "));
  }
  h.set('cross-origin-opener-policy', 'same-origin-allow-popups');
  // n32x (batch 32, Early Hints): the stylesheets and main font every public page loads, as Link preload headers; Cloudflare answers the
  // next requests with 103 Early Hints from them, so the browser fetches the CSS while the worker still builds the page (/engineering/early-hints/)
  if (r.status === 200 && !priv && !embed && !/^\/(?:(?:es\/)?apply|agents|shared|thanks|visit)(?:\/|$)/.test(u.pathname)) h.append('link', '</k/site.css?v=' + KB_SITE_CSS_V + '>; rel=preload; as=style, </k/' + (KB_DSS_V === KB_DS_V ? 'ds-site' : 'ds') + '.css?v=' + KB_DS_V + '>; rel=preload; as=style, </k/fonts/archivo-latin.woff2>; rel=preload; as=font; type="font/woff2"; crossorigin');
  if (priv) { h.set('cache-control', 'no-store'); h.set('x-robots-tag', 'noindex, nofollow'); }
  h.delete('access-control-allow-origin');
  h.set('cache-control', priv ? 'no-store' : 'no-cache'); // a nonce must never be reused from a cache
  // n21e: Russian pages get the right noun form after a number ("2 проекта", "1 проект"; the templates only carry "проектов")
  const ru = r.status === 200 && r.body && /^\/ru(\/|$)/.test(u.pathname);
  // n28a: "1 months", "1 meses", "1 Monate", "1 maanden" (templates written for plural numbers) become singular in en, es, de and nl
  const u1 = !ru && r.status === 200 && r.body ? KB_U1[(/^\/(es|de|nl|fr|zh|ar)(\/|$)/.exec(u.pathname) || [0, 'en'])[1]] : null;
  if (ru || u1) h.delete('content-length');
  const out = new Response(ru || u1 ? new ReadableStream({ async start(c) { try { const t = await r.text(); c.enqueue(new TextEncoder().encode(ru ? ruPlaces(kbRu(t)) : kbOne(t, u1))); c.close(); } catch (e) { c.error(e); } } }) : r.body, { status: r.status, statusText: r.statusText, headers: h });
  // design system (d12a, 7 Nov 2026): /k/ds.css goes right after site.css or app.css, or at the end of <head> when a page has neither
  let ds = false; const styleIds = new Set(); const DSL = '<link rel="stylesheet" href="/k/ds.css?v=' + KB_DS_V + '">';
  // n20p: pages that load site.css get /k/ds-site.css, the same rules without the :has() page test (see that file's first lines)
  const DSLS = KB_DSS_V === KB_DS_V ? '<link rel="stylesheet" href="/k/ds-site.css?v=' + KB_DS_V + '">' : DSL;
  // n20s (9 Nov 2026): the account-wide "analytics-all" worker adds Google Analytics to any page whose <head> does not carry it, without a
  // nonce and without waiting (that was every strict-CSP report: about 35 page types). Pages without the tag now get the same tag from
  // here, with the nonce and held until the first interaction like on every other page; analytics-all then sees it and adds nothing.
  let ga = false, gaTail = '';
  // n28a: 146 static pages have Open Graph tags but no og:locale (shared links were read as English); it is added from the path language
  let ogT = false, ogL = false; const OGL = { es: 'es_ES', de: 'de_DE', fr: 'fr_FR', nl: 'nl_NL', ru: 'ru_RU', zh: 'zh_CN', ar: 'ar_AR' }[(/^\/(es|de|fr|nl|ru|zh|ar)(\/|$)/.exec(u.pathname) || [])[1]] || (/^\/agents\/id(\/|$)/.test(u.pathname) ? 'id_ID' : 'en_GB');
  // n33c (item 40, 20 Nov 2026): a title over 60 characters drops " | Kolaboro" (234 of the 536 main-sitemap pages were cut in results)
  let tB = '';
  // n33a (batch 33): items 86 (a JSON Feed and an Atom feed of the data changes in the <head> of every hub that carries none) and 89
  // (who made a report, from what, the method and where to send corrections, under every report)
  let fJ = false, fA = false; const n33 = kn33a && r.status === 200 && !priv && !embed ? kn33a : null, n33F = n33 && n33.FEED_HUB.test(u.pathname), n33B = n33 && n33.REPORTS.test(u.pathname);
  return new HTMLRewriter().on('head > title', { text(t) { tB += t.text; if (!t.lastInTextNode) { t.remove(); return; } const n = [...tB.replace(/&(?:amp|lt|gt|quot|#39);/g, 'x').trim()].length; t.replace(n > 60 ? tB.replace(/\s*\|\s*Kolaboro\s*$/, '') : tB, { html: true }); tB = ''; } })
    .on('head link[rel="alternate"]', { element(e) { const ty = e.getAttribute('type') || ''; if (/feed\+json/.test(ty)) fJ = true; if (/atom\+xml/.test(ty)) fA = true; } })
    .on('main', { element(e) { if (n33B) { const lg = (/^\/(es|de|fr|nl|ru|zh|ar)\//.exec(u.pathname) || [0, 'en'])[1]; const b = n33.byline(lg, u.pathname); if (b) e.append('<div class="wrap">' + b + '</div>', { html: true }); } } })
    .on('meta[property="og:title"]', { element() { ogT = true; } }).on('meta[property="og:locale"]', { element() { ogL = true; } }).on('script', { element(e) { e.setAttribute('nonce', nonce); if ((e.getAttribute('src') || '').startsWith('/k/prov.js')) e.setAttribute('src', '/k/prov.js?v=' + KB_PROV_V); } })
    .on('head script', { element(e) { gaTail = ''; if ((e.getAttribute('src') || '').includes(KB_GA)) ga = true; }, text(t) { if (ga) return; const x = gaTail + t.text; if (x.includes(KB_GA)) ga = true; gaTail = t.lastInTextNode ? '' : x.slice(-12); } })
    .on('style[id]', { element(e) { const id = e.getAttribute('id'); if (styleIds.has(id)) e.remove(); else styleIds.add(id); } })   // n19f: a style block repeated with the same id (36 static pages, sections that each carry their CSS) is kept once
    .on('link[rel="stylesheet"]', { element(e) { const hf = e.getAttribute('href') || ''; if (/^\/k\/site\.css/.test(hf)) e.setAttribute('href', '/k/site.css?v=' + KB_SITE_CSS_V);   // n21e: one version for the 235 pages that hard-code an older ?v=
      if (!ds && /^\/k\/(site|app)\.css/.test(hf)) { e.after(/^\/k\/site\.css/.test(hf) ? DSLS : DSL, { html: true }); ds = true; } } })
    .on('body', { element(e) { if (KB_CITE29.test(u.pathname)) e.append('<script nonce="' + nonce + '" src="/k/cite29.js?v=2" defer></script>', { html: true }); } })   // n29e: "Cite" buttons on report figures (item 74)
    .on('head', { element(e) { e.prepend('<script nonce="' + nonce + '">' + KB_LATE + '</script>', { html: true }); e.onEndTag(t => { if (ogT && !ogL) { t.before('<meta property="og:locale" content="' + OGL + '">', { html: true }); ogL = true; } if (!ds) { t.before(DSL, { html: true }); ds = true; } if (!ga) { t.before('<script nonce="' + nonce + '">' + KB_GA_JS + '</script>', { html: true }); ga = true; } if (KB_SPEC_OK(u.pathname)) t.before(KB_SPEC.replace('{N}', nonce), { html: true }); if (n33F && !(fJ && fA)) t.before(n33.feedLinks(u.pathname, fJ, fA), { html: true }); if (n33) { const dl = n33.dataLd(u.pathname); if (dl) t.before(dl, { html: true }); } }); } }).transform(out);
}
// n21e (11 Nov 2026): Russian number agreement. Templates in about 20 modules say "{k} проектов"; after 2, 3, 4 (22, 33...) Russian
// wants the genitive singular ("2 проекта") and after 1 (21, 31...) the nominative singular ("1 проект"). Left alone: 5 to 20, numbers
// after a word that asks for the genitive itself ("из 3 проектов", "меньше 3 объявлений", "последних 3 проверок") and decimals.
const KB_RU_N = { 'проектов': ['проекта', 'проект'], 'застройщиков': ['застройщика', 'застройщик'], 'месяцев': ['месяца', 'месяц'], 'кварталов': ['квартала', 'квартал'], 'контуров': ['контура', 'контур'],
  'вопросов': ['вопроса', 'вопрос'], 'изменений': ['изменения', 'изменение'], 'объявлений': ['объявления', 'объявление'], 'зданий': ['здания', 'здание'], 'обещаний': ['обещания', 'обещание'],
  'сайтов': ['сайта', 'сайт'], 'оповещений': ['оповещения', 'оповещение'], 'снимков': ['снимка', 'снимок'], 'дней': ['дня', 'день'], 'лет': ['года', 'год'], 'этажей': ['этажа', 'этаж'],
  'документов': ['документа', 'документ'], 'источников': ['источника', 'источник'], 'рынков': ['рынка', 'рынок'], 'языков': ['языка', 'язык'], 'сдач': ['сдачи', 'сдача'], 'продаж': ['продажи', 'продажа'],
  'проверок': ['проверки', 'проверка'], 'сделок': ['сделки', 'сделка'], 'ночей': ['ночи', 'ночь'], 'комнат': ['комнаты', 'комната'], 'копий': ['копии', 'копия'], 'карточек': ['карточки', 'карточка'],
  'страниц': ['страницы', 'страница'], 'стран': ['страны', 'страна'], 'записей': ['записи', 'запись'], 'раз': ['раза', 'раз'], 'ссылок': ['ссылки', 'ссылка'], 'файлов': ['файла', 'файл'],
  'часов': ['часа', 'час'], 'минут': ['минуты', 'минута'], 'недель': ['недели', 'неделя'], 'квартир': ['квартиры', 'квартира'], 'платежей': ['платежа', 'платёж'], 'отзывов': ['отзыва', 'отзыв'],
  'ответов': ['ответа', 'ответ'], 'жалоб': ['жалобы', 'жалоба'], 'городов': ['города', 'город'], 'уведомлений': ['уведомления', 'уведомление'], 'пунктов': ['пункта', 'пункт'], 'фотографий': ['фотографии', 'фотография'] };
const KB_RU_RE = new RegExp('(\\d+)((?:</(?:b|strong|span)>)?[ \u00a0])((?:[а-яё]+(?:ых|их) )?)(' + Object.keys(KB_RU_N).join('|') + ')(?![а-яёА-ЯЁ])', 'g');
const KB_RU_STOP = /(?:^|[^а-яё])(?:из|от|до|меньше|больше|более|менее|около|для|без|у|цена|цены|цене|среди|после|основе|свыше|порядка|нет|всех|минимум|максимум|[а-яё]+(?:ых|их))$/;
function kbRu(html) {
  return html.replace(KB_RU_RE, (m, num, gap, adj, noun, off, all) => {
    const n = +num.slice(-2), d = n % 10, teen = n > 10 && n < 20;
    if (teen || d === 0 || d > 4) return m;
    const before = all.slice(Math.max(0, off - 48), off);
    if (/[\d.,\u00a0$\\{}%]$/.test(before) || (/\d[ ]$/.test(before) && num.length === 3)) return m;           // part of a decimal or a grouped number, or a "$1" in a script
    const prev = before.replace(/<[^>]*>?/g, '').replace(/[\s:(«"]+$/, '').toLowerCase();
    if (KB_RU_STOP.test(prev)) return m;
    if (d === 1) return adj ? m : num + gap + KB_RU_N[noun][1];
    return num + gap + adj + KB_RU_N[noun][0];
  });
}
const KB_U1 = { en: { months: 'month', days: 'day', weeks: 'week', years: 'year', projects: 'project' }, es: { meses: 'mes', 'días': 'día', semanas: 'semana', 'años': 'año' },   // n33a: + projects ("1 projects tracked" on developer answers)
 
  de: { Monaten: 'Monat', Monate: 'Monat', Tagen: 'Tag', Tage: 'Tag', Wochen: 'Woche', Jahren: 'Jahr', Jahre: 'Jahr' }, nl: { maanden: 'maand', dagen: 'dag', weken: 'week', jaren: 'jaar' } };
const KB_U1_RE = {}; for (const [l, m] of Object.entries(KB_U1)) KB_U1_RE[l] = new RegExp('(^|[\\s(>:;\u00a0])1([ \u00a0])(' + Object.keys(m).join('|') + ')(?![\\p{L}])', 'gu');
function kbOne(html, m) { const re = KB_U1_RE[Object.keys(KB_U1).find(l => KB_U1[l] === m)]; return html.replace(re, (x, a, g, n) => a + '1' + g + m[n]); }
const KB_SITE_CSS_V = '97a221f853', KB_PROV_V = '369ff51a4c';   // n21e: bump when /k/site.css or /k/prov.js change (sha1 of the file, 10 chars); pages keep their old ?v= in the HTML
let KB_CSP_SCRIPTS = true;   // n21e: strict script policy enforced site-wide; false = report-only again (as before 11 Nov 2026)
const KB_GA = 'G-FJKJE77K4V';
const KB_GA_JS = '(window.kbLate||function(f){addEventListener("load",function(){setTimeout(f,1500)})})(function(){var s=document.createElement("script");s.async=1;s.src="https://www.googletagmanager.com/gtag/js?id=' + KB_GA + '";document.head.appendChild(s)});' +
  "window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){dataLayer.push(arguments);};gtag('js',new Date());gtag('config','" + KB_GA + "');";
const KB_DS_V = 'dd003cfe8e';   // bump with ds.css (scratchpad d12a/dsv.sh does it)
const KB_DSS_V = 'dd003cfe8e';   // the ds.css version /k/ds-site.css was generated from; when it differs from KB_DS_V every page gets plain ds.css
// kolaboro.com mobile speed (b9c, 6 Nov 2026): third-party tags wait for the first interaction (tap, key, scroll, mouse move)
// or 8 s after load, whichever comes first. window.kbLate(fn) queues work for that moment (the static pages load gtag through it);
// Cloudflare Zaraz (Clarity) is held the same way by deferring its zaraz.init call. Events queued before that are kept.
// n30a (batch 30, item 5): instant navigation. Speculation Rules: same-site pages are prefetched when the pointer rests on a link
// (moderate eagerness: about 200 ms of hover, or touch start on phones), project pages are prerendered the same way; links with a query,
// a fragment, a file extension, a download, a new tab, nofollow, and every action or account path (/check, /api, /x, /portal, /pay,
// /book, login and confirm links) are never fetched ahead. Prefetch and prerender requests carry Sec-Purpose, so the usage counters
// leave them out (kbx_n27a.js). View Transitions: a short cross-fade between same-site pages (none with reduced motion).
const KB_SPEC_NO = "a[href*='?'],a[href*='#'],a[download],a[target=_blank],a[rel~=nofollow],a[href*='/api/'],a[href*='/check'],a[href*='/x/'],a[href*='/portal'],a[href*='/account'],a[href*='/acct'],a[href*='/admin'],a[href*='/login'],a[href*='/logout'],a[href*='/confirm'],a[href*='/unsubscribe'],a[href*='/pay'],a[href*='/book'],a[href*='/data/'],a[href*='/k/'],a[href*='/__'],a[href$='.pdf'],a[href$='.json'],a[href$='.csv'],a[href$='.ics'],a[href$='.xml'],a[href$='.txt'],a[href$='.atom'],a[href$='.md'],a[href$='.png'],a[href$='.jpg'],a[href$='.zip'],a[href$='.gif']";
const KB_SPEC_PR = ['', '/es', '/de', '/fr', '/nl', '/ru', '/zh', '/ar'].map(l => "a[href^='" + l + "/projects/']").join(',');
const KB_SPEC = '<script type="speculationrules" nonce="{N}">' + JSON.stringify({
  prerender: [{ source: 'document', where: { and: [{ selector_matches: KB_SPEC_PR }, { not: { selector_matches: KB_SPEC_NO + ",a[href*='.'],a[href*='/changes/'],a[href*='/report'],a[href*='/timeline']" } }] }, eagerness: 'moderate' }],
  prefetch: [{ source: 'document', where: { and: [{ href_matches: '/*' }, { not: { selector_matches: KB_SPEC_NO } }] }, eagerness: 'moderate' }] }) +
  '</script><style id="kb-vt">@view-transition{navigation:auto}::view-transition-old(root),::view-transition-new(root){animation-duration:.18s}@media (prefers-reduced-motion:reduce){@view-transition{navigation:none}}</style>';
const KB_SPEC_OK = p => !/^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:check|portal|admin|account|acct|pay|book|login|confirm|x)(?:\/|$)/.test(p);
const KB_LATE = "(function(w,d){var q=[],done=0,ev=['pointerdown','keydown','touchstart','scroll','wheel','mousemove'],o={passive:true,capture:true};" +
  "function go(){if(done)return;done=1;ev.forEach(function(e){w.removeEventListener(e,go,o)});var f;while((f=q.shift()))try{f()}catch(x){}}" +
  "ev.forEach(function(e){w.addEventListener(e,go,o)});function arm(){setTimeout(go,8000)}d.readyState==='complete'?arm():w.addEventListener('load',arm);" +
  "w.kbLate=function(f){done?setTimeout(f,0):q.push(f)};" +
  // n20s: the last inline handlers became data attributes, so the enforced policy can forbid inline handlers (script-src-attr 'none')
  "d.addEventListener('click',function(e){var t=e.target&&e.target.closest&&e.target.closest('[data-kb-reload]');if(t)location.reload()});" +
  "d.addEventListener('submit',function(e){var f=e.target;if(f&&f.hasAttribute&&f.hasAttribute('data-kb-nosubmit'))e.preventDefault()},true);" +
  "var z,held;try{Object.defineProperty(w,'zaraz',{configurable:true,enumerable:true,get:function(){return z},set:function(v){z=v;if(done||held||!v||typeof v!=='object')return;held=v;var real;" +
  "try{Object.defineProperty(v,'init',{configurable:true,enumerable:true,get:function(){return done?real:function(){var a=arguments;w.kbLate(function(){real&&real.apply(v,a)})}},set:function(fn){real=fn}})}catch(x){}}})}catch(x){}" +
  // n28a: a table wider than its box scrolls sideways, so keyboard users must be able to focus it (axe scrollable-region-focusable); read after load, off the critical path
  "w.addEventListener('load',function(){setTimeout(function(){d.querySelectorAll('pre,[class*=\"tw\"],[class*=\"scroll\"],[class*=\"table\"],[class*=\"code\"]').forEach(function(t){if(t.hasAttribute('tabindex')||t.scrollWidth<=t.clientWidth+1)return;var o=getComputedStyle(t).overflowX;if(o==='auto'||o==='scroll')t.tabIndex=0})},600)});" +
  "})(window,document);";
// kolaboro.com (seoT, batch 8): every public static page gets a BreadcrumbList (and a WebPage node when it has no JSON-LD at all).
// Parent crumbs are only linked when that folder has a page; the check is cached per isolate.
const KB_PARENT = new Map(), KB_LN = { es: 'Español', de: 'Deutsch', fr: 'Français', ru: 'Русский', nl: 'Nederlands', ar: 'العربية', zh: '中文' };
// kpack (23 Nov 2026): the dated changelog pages /changelog/<YYYY-MM-DD>/ live in one file, data/changelog-days.json (date -> the page's HTML),
// to stay under the Pages file limit. Served with the same bytes, status and headers a static page gets (rollback: restore the files, delete this and its call).
let KB_CLDAYS = null;
async function kbChangeDay(env, u, pre) {
  const m = /^\/changelog\/(\d{4}-\d{2}-\d{2})(\/?)$/.exec(u.pathname); if (!m) return null;
  if (!KB_CLDAYS) { const j = await env.ASSETS.fetch(new Request('https://kolaboro.com' + pre + '/data/changelog-days.json')); if (j.status !== 200) return null; KB_CLDAYS = await j.json(); }
  const html = KB_CLDAYS[m[1]]; if (typeof html !== 'string') return null;
  if (!m[2]) return new Response(null, { status: 308, headers: { location: '/changelog/' + m[1] + '/' + u.search } });
  return new Response(new TextEncoder().encode(html), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=0, must-revalidate', 'access-control-allow-origin': '*', 'referrer-policy': 'strict-origin-when-cross-origin', 'x-content-type-options': 'nosniff' } });
}
async function kbParent(env, p) { if (KB_PARENT.has(p)) return KB_PARENT.get(p); let ok = false; try { const r = await env.ASSETS.fetch(new Request('https://kolaboro.com/_s/kolaboro.com' + p + 'index.html')); ok = r.status === 200; } catch (e) {} KB_PARENT.set(p, ok); return ok; }
async function kbLd(r, u, env) {
  if (r.status !== 200 || !/text\/html/.test(r.headers.get('content-type') || '') || u.pathname === '/' || /^\/(admin|portal|login|agents\/me|shared|saved|watchlist|reset|confirm-email|thanks)(\/|$)/.test(u.pathname)) return r;
  const segs = u.pathname.split('/').filter(Boolean), canon = 'https://kolaboro.com/' + segs.join('/') + (segs.length ? '/' : ''), crumbs = [['Kolaboro', 'https://kolaboro.com/']];
  for (let i = 1; i < segs.length; i++) { const p = '/' + segs.slice(0, i).join('/') + '/'; if (await kbParent(env, p)) crumbs.push([KB_LN[segs[i - 1]] || segs[i - 1].replace(/-/g, ' ').replace(/^./, c => c.toUpperCase()), 'https://kolaboro.com' + p]); }
  let title = '', ld = '', nonce = kbNonce(r), need = false, name = '', vis = [], cur = null, crumbDone = false;
  const tag = g => '<script' + nonce + ' type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@graph': g }).replace(/</g, '\\u003c') + '</script>';
  const bc = list => ({ '@type': 'BreadcrumbList', itemListElement: list.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x[0], item: x[1] })) });
  const ent = t => String(t).replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  // n29t (item 53): the BreadcrumbList follows the breadcrumb the page shows (its first p.crumb: the linked steps, then the page itself),
  // so the data and the visible path are the same; pages without a visible breadcrumb keep the path-based list. Written at the end of
  // <body> once the visible breadcrumb has been read (JSON-LD is valid anywhere in the document).
  return new HTMLRewriter()
    .on('head title', { text(t) { title += t.text; } })
    .on('head script[type="application/ld+json"]', { text(t) { ld += t.text || ' '; } })
    .on('head', { element(e) { e.onEndTag(end => {
      if (/BreadcrumbList/.test(ld)) return;
      need = true; name = ent(title.replace(/\s*\|\s*Kolaboro.*$/, '')) || segs[segs.length - 1];
      if (!ld.trim()) end.before(tag([{ '@type': 'WebPage', '@id': canon + '#page', url: canon, name, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: 'https://kolaboro.com/' } }]), { html: true });
    }); } })
    .on('p.crumb', { element(e) { if (crumbDone || !need) return; e.onEndTag(() => { crumbDone = true; }); } })
    .on('p.crumb a', { element(e) { if (crumbDone || !need) return; const h = e.getAttribute('href') || ''; if (/^\/[^/]/.test(h) || h === '/') { cur = [ '', 'https://kolaboro.com' + h.split('#')[0] ]; vis.push(cur); } else cur = null; }, text(t) { if (cur && !crumbDone) cur[0] += t.text; } })
    .on('body', { element(e) { e.onEndTag(end => {
      if (!need) return;
      const v = vis.map(x => [ent(x[0]), x[1]]).filter(x => x[0] && x[1] !== canon);
      end.before(tag([bc((v.length ? v : crumbs).concat([[name, canon]]))]), { html: true });
    }); } })
    .transform(r);
}
// n29t (item 49): lowercase, single-slash form of a page URL typed with capitals or "//", or null when the URL is already right or
// belongs to a section whose URLs keep capitals or are files (ids such as /p/DXB-009/, /embed/project/<ID>/, /api/, /k/, /data/ ...)
const KB_CASE_KEEP = new Set(['p', 'k', 'data', 'embed', 'api', 'mcp', 'og', 'assets', '__l5e', '__k', '__sb', 'fonts', 'brand', 'social', 'sdk', 'r', 'x', '.well-known', 'answers', 'cdn-cgi', 'sat']);
function kbCaseFix(u) {
  const p = u.pathname; if (!/[A-Z]|\/\//.test(p.replace(/%[0-9A-Fa-f]{2}/g, ''))) return null;
  let q = p.replace(/\/{2,}/g, '/');
  const s = q.split('/'), i = /^(es|de|fr|nl|ru|zh|ar)$/i.test(s[1] || '') ? 2 : 1, last = s[s.length - 1] || '';
  if (KB_CASE_KEEP.has(String(s[i] || '').toLowerCase()) || /\.[A-Za-z0-9]{1,5}$/.test(last)) q = i === 2 && /[A-Z]/.test(s[1]) ? '/' + s[1].toLowerCase() + p.slice(s[1].length + 1) : p;
  else q = q.replace(/%[0-9A-Fa-f]{2}|[^%]+/g, m => m[0] === '%' ? m : m.toLowerCase());
  return q !== p ? q + u.search : null;
}
// n29t (item 44): conditional requests for search and answer engine crawlers. The HTML carries a fresh script nonce per response, so
// the ETag is a hash of the page with the nonces taken out: same page content, same tag. A crawler that sends it back in If-None-Match
// gets a 304 without a body, so it can spend its crawl on pages that changed. The 304 carries no CSP header: a cache keeps the stored
// policy, whose nonce matches the stored body. Browsers are left alone (their pages keep streaming; Lighthouse is not affected).
const KB_BOT_UA = /Googlebot|bingbot|Applebot|DuckDuckBot|YandexBot|Baiduspider|GPTBot|OAI-SearchBot|ClaudeBot|Claude-SearchBot|PerplexityBot|CCBot|Amazonbot|SeznamBot|Yeti|NaverBot|PetalBot|Qwantbot|MojeekBot|KolaboroSEOAudit/i;
async function kbCond(req, r) {
  if (r.status !== 200 || !/text\/html/.test(r.headers.get('content-type') || '') || /no-store/.test(r.headers.get('cache-control') || '')) return r;
  const c = r.clone(); let t; try { t = await c.text(); } catch (e) { return r; }   // n29t: a body that fails to read is passed on untouched (a read error must never become a 500)
  const norm = t.replace(/ nonce="[A-Za-z0-9+/=]*"/g, '').replace(/'nonce-[A-Za-z0-9+/=]*'/g, '');
  const d = new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(norm))), tag = 'W/"' + [...d.slice(0, 10)].map(x => x.toString(16).padStart(2, '0')).join('') + '"';
  const h = new Headers(r.headers); h.set('etag', tag); h.delete('content-length');
  // n33i (item 17): Cloudflare drops this ETag on HTML, so crawlers revalidate with If-Modified-Since: see lmBot in kbx_n33i.js
  let ims304 = false; try { if (!kn33i) kn33i = await import('./kbx_n33i.js'); const u1 = new URL(req.url), lb = await kn33i.lmBot(req, u1.pathname + u1.search, tag, h.get('last-modified')); if (lb && lb.lm) h.set('last-modified', lb.lm); ims304 = !!(lb && lb.not); } catch (e) {}
  const inm = req.headers.get('if-none-match');
  if (ims304 && !inm) { const h3 = new Headers(); for (const k of ['etag', 'last-modified', 'cache-control', 'vary', 'date', 'x-robots-tag']) if (h.get(k)) h3.set(k, h.get(k)); return new Response(null, { status: 304, headers: h3 }); }
  if (inm && inm.split(',').some(x => { x = x.trim(); return x === '*' || x.replace(/^W\//, '') === tag.replace(/^W\//, ''); })) {
    const h3 = new Headers(); for (const k of ['etag', 'last-modified', 'cache-control', 'vary', 'date', 'x-robots-tag']) if (h.get(k)) h3.set(k, h.get(k));
    return new Response(null, { status: 304, headers: h3 });
  }
  return new Response(t, { status: 200, statusText: r.statusText, headers: h });
}
// scripts added after kbHeaders (HTMLRewriter append) carry the same nonce as the response's CSP header
const kbNonce = r => { const m = ((r.headers.get('content-security-policy-report-only') || '') + ' ' + (r.headers.get('content-security-policy') || '')).match(/'nonce-([A-Za-z0-9+/=]+)'/); return m ? ' nonce="' + m[1] + '"' : ''; };
const KB_CSP = "default-src 'self'; script-src 'nonce-{N}' 'strict-dynamic' 'wasm-unsafe-eval' 'unsafe-inline' https:; script-src-attr 'none'; " +
  "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://unpkg.com; " +
  "img-src 'self' data: blob: https://oykcsmextclpdnugixqz.supabase.co https://server.arcgisonline.com https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://*.google-analytics.com https://*.googletagmanager.com https://*.clarity.ms https://c.bing.com; " +
  "font-src 'self'; connect-src 'self' https://tile.openstreetmap.org https://cdnjs.cloudflare.com https://api.frankfurter.dev https://api.frankfurter.app https://oykcsmextclpdnugixqz.supabase.co wss://oykcsmextclpdnugixqz.supabase.co https://huggingface.co https://*.hf.co https://raw.githubusercontent.com https://mempool.space https://nominatim.openstreetmap.org https://cdn.jsdelivr.net https://earth-search.aws.element84.com https://extensions.duckdb.org https://*.amazonaws.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.clarity.ms https://c.bing.com https://cloudflareinsights.com; " +
  "frame-src 'self' https://www.paypal.com https://www.sandbox.paypal.com; worker-src 'self' blob:; manifest-src 'self'; media-src 'self' blob:; object-src 'none'; base-uri 'self'; " +
  "form-action 'self' https://www.paypal.com https://oykcsmextclpdnugixqz.supabase.co; frame-ancestors {FA}; report-uri /api/kb/csp; report-to csp";
// equinoxinvestmentgroup.com: browser security headers (no framing, no plugins, admin never indexed or cached) and long cache for fonts
function eqHeaders(r, u, req) {
  const h = new Headers(r.headers);
  const ct = h.get('content-type') || '';
  if (/^\/fonts\/.+\.woff2$/.test(u.pathname) && r.status === 200) h.set('cache-control', 'public, max-age=31536000, immutable');
  else if (/^\/(fonts\/fonts\.css|og\.png|favicon\.(svg|ico)|apple-touch-icon\.png)$/.test(u.pathname) && r.status === 200) h.set('cache-control', 'public, max-age=86400');
  if (/text\/html/.test(ct)) {
    const adm = /^\/admin(\/|$)/.test(u.pathname);
    h.set('x-frame-options', 'DENY');
    // analytics (Zaraz: GA4 + Clarity) may load only after the visitor accepts cookies (eq_consent=all set by the site's banner)
    const ok = /(?:^|;\s*)eq_consent=all(?:;|$)/.test(req.headers.get('cookie') || '');
    const o = 'https://' + u.host;
    const scripts = ok ? '' : "script-src 'unsafe-inline' " + o + '/assets/ ' + o + '/cdn-cgi/scripts/ ' + o + '/cdn-cgi/challenge-platform/ https://static.cloudflareinsights.com; ';
    h.set('content-security-policy', scripts + "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self' mailto:; upgrade-insecure-requests");
    h.append('vary', 'Cookie');
    h.set('permissions-policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()');
    h.set('cross-origin-opener-policy', 'same-origin');
    h.set('strict-transport-security', 'max-age=31536000');
    if (adm) { h.set('cache-control', 'no-store'); h.set('x-robots-tag', 'noindex, nofollow'); }
  }
  if (u.pathname === '/llms.txt' || u.pathname === '/.well-known/security.txt') h.set('content-type', 'text/plain; charset=utf-8');
  return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
}
// rh-media-v1 (3-nov-2026): realhunt.co pages and data are served from the Pages project realhunt-media
// (built from this branch with root _s/realhunt.co), so web-lovable no longer has to deploy them (Pages
// 20,000-file limit). /assets/* still comes from web-lovable. Same rules as the web-lovable path below:
// ?p= lookups, no trailing slash, folder pages served directly, unknown pages load the app with noindex.
const RHM = 'https://realhunt-media.pages.dev';
function rhGet(req, path) {
  const h = new Headers(req.headers); h.delete('cookie');
  return fetch(new Request(RHM + path, { method: req.method === 'HEAD' ? 'HEAD' : 'GET', headers: h, redirect: 'manual' }));
}
async function rhMedia(req, u) {
  if (u.search) { for (const k of ['p', 'page_id', 'paged', 'cat', 'tag']) { const v = u.searchParams.get(k); if (v && /^[\w-]+$/.test(v)) { const q = await rhGet(req, '/__q/' + k + '=' + v + '/'); if (q.status === 200) return q; } } }
  if (u.pathname.length > 1 && u.pathname.endsWith('/')) return new Response(null, { status: 301, headers: { location: '/' + u.pathname.replace(/\/+$/, '').replace(/^[\/\\]+/, '') + u.search } });
  let r = await rhGet(req, u.pathname + u.search);
  if (r.status >= 300 && r.status < 400) {
    const l = new URL(r.headers.get('location') || '', RHM + u.pathname);
    if (l.pathname === u.pathname + '/') { const d = await rhGet(req, u.pathname + '/' + u.search); if (d.status === 200) r = d; }
  }
  if (r.status >= 300 && r.status < 400) { const l = new URL(r.headers.get('location') || '/', RHM + u.pathname); const h = new Headers(r.headers); h.set('location', (l.origin === RHM ? '' : l.origin) + l.pathname + l.search); return new Response(null, { status: r.status, headers: h }); }
  if (r.status === 404 && !/\.[a-z0-9]{2,5}$/i.test(u.pathname)) {
    const s = await rhGet(req, '/');
    const h = new Headers(s.headers); h.set('x-robots-tag', 'noindex');
    return new HTMLRewriter()
      .on('link[rel="canonical"]', { element(e) { e.remove(); } })
      .on('meta[name="robots"]', { element(e) { e.setAttribute('content', 'noindex, follow'); } })
      .on('meta[property="og:url"]', { element(e) { e.setAttribute('content', 'https://realhunt.co' + u.pathname); } })
      .transform(new Response(s.body, { status: 200, headers: h }));
  }
  if (r.status === 404) return new Response(null, { status: 404 });
  return r;
}
// n26i (batch 26): home page and hubs carry links to the project pages the fewest other project pages link to (kbx_named.js)
async function llInject(req, u, env, ctx, r) {
  if (req.method !== 'GET' || !r || r.status !== 200 || u.search || !LLP.test(u.pathname) || !/text\/html/.test(r.headers.get('content-type') || '')) return r;
  try { if (!knm) knm = await import('./kbx_named.js'); const lg = LLP.exec(u.pathname)[1] || 'en'; let lb = knm.leastReady(env, ctx, lg);
    try { if (!kg27) kg27 = await import('./kbx_g27.js'); lb = kg27.topReady(env, ctx, lg, u.pathname) + lb; } catch (e) {}   // n27g (batch 27): links to the 300 most searched projects
    if (lb) return new HTMLRewriter().on('main', { element(e) { e.append(lb, { html: true }); } }).transform(r); } catch (e) {}
  return r;
}
// n29h1 (batch 29): links from existing pages (market files, handover, transparency, guides, developer pages, /new/, /rankings/) to the
// place data pages of kbx_h29.js, appended to <main>; never blocks the page
const H29L = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:m\/[^/.]{2,60}|handover(?:\/20\d\d\/[a-z0-9-]{2,60})?|rankings(?:\/transparency(?:\/[a-z0-9-]{2,40})?)?|new|guides\/buying-off-plan(?:\/[a-z-]{2,30})?|developers\/[a-z0-9-]{1,90})\/?$/;
let kn32s = null, kn33l = null;
async function h29Inject(req, u, env, r) {
  try { if (r && req.method === 'GET' && r.status === 200) { if (!kn32s) kn32s = await import('./kbx_n32s.js'); r = await kn32s.answer(req, u, env, r); } } catch (e) {}   // n32s (item 217): dated, sourced answer line under the h1 of the data hubs
  if (req.method !== 'GET' || !r || r.status !== 200 || !H29L.test(u.pathname) || !/text\/html/.test(r.headers.get('content-type') || '')) return r;
  try { if (!kh29) kh29 = await import('./kbx_h29.js'); const h = await kh29.linksFor(env, u.pathname); if (h) r = new HTMLRewriter().on('main', { element(e) { e.append(h, { html: true }); } }).transform(r); } catch (e) {}
  try { if (!kn31s) kn31s = await import('./kbx_n31s.js'); r = await kn31s.inject(req, u, env, r); } catch (e) {}   // n31s (batch 31): most searched projects of the place, feed links
  try { if (/\/developers\/[a-z0-9-]{1,90}\/$/.test(u.pathname)) { if (!kn33l) kn33l = await import('./kbx_n33l.js'); r = await kn33l.devMarkets(req, u, env, r); } } catch (e) {}   // n33l (item 66): the developer's market pages
  return r;
}
// n32s (batch 32, items 258 and 259): whole-page edge copies for pages that were slow to build: the market files (/m/<market>/ in 8
// languages, about 1 s to the last byte) and /engineering/status/ (it measures other pages live: 17 s on a cold build). Like /countries/
// (n29q), a copy is served at once and rebuilt in the background when it is older than 15 minutes or was built by another deployment.
// The copy is taken after kbHeaders, so on every answer its script nonce is replaced in the body and in the CSP headers by a fresh one.
const KB_EDGE = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:m\/[^/.]{2,60}|engineering\/status)\/$/, KB_EDGE_BUSY = new Set();
async function kbEdge(req, u, env, ctx, make) {
  if (req.method !== 'GET' || u.search || typeof caches === 'undefined' || !KB_EDGE.test(u.pathname)) return make();
  const ck = new Request('https://kolaboro.com/__edge/v1' + u.pathname), sha = String((env && env.CF_PAGES_COMMIT_SHA) || '');
  const keep = async r0 => {
    if (!r0 || r0.status !== 200 || !/text\/html/.test(r0.headers.get('content-type') || '')) return r0;
    const t = await r0.text(), h = new Headers(r0.headers); h.delete('content-length');
    const hc = new Headers(h); hc.set('x-built', String(Date.now())); hc.set('x-sha', sha); hc.set('x-cc', h.get('cache-control') || 'no-cache'); hc.set('cache-control', 'public, max-age=86400');
    const put = caches.default.put(ck, new Response(t, { headers: hc })).catch(() => {}); if (ctx && ctx.waitUntil) ctx.waitUntil(put); else await put;
    return new Response(t, { status: 200, headers: h });
  };
  try {
    const hit = await caches.default.match(ck);
    if (hit) {
      const age = Date.now() - (+hit.headers.get('x-built') || 0), stale = age > 900e3 || (!!sha && hit.headers.get('x-sha') !== sha);
      if (stale && ctx && ctx.waitUntil && !KB_EDGE_BUSY.has(u.pathname)) { KB_EDGE_BUSY.add(u.pathname); ctx.waitUntil(Promise.resolve().then(make).then(keep).catch(() => {}).then(() => { KB_EDGE_BUSY.delete(u.pathname); })); }
      const h = new Headers(hit.headers), old = ((h.get('content-security-policy') || '') + ' ' + (h.get('content-security-policy-report-only') || '')).match(/'nonce-([A-Za-z0-9+/=]{8,})'/);
      let t = await hit.text();
      if (old) { const nw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16)))); t = t.split(old[1]).join(nw); for (const k of ['content-security-policy', 'content-security-policy-report-only']) if (h.has(k)) h.set(k, h.get(k).split(old[1]).join(nw)); }
      h.set('cache-control', h.get('x-cc') || 'no-cache'); ['x-built', 'x-sha', 'x-cc'].forEach(k => h.delete(k)); h.set('x-edge-cache', stale ? 'stale' : 'hit');
      return new Response(t, { status: 200, headers: h });
    }
  } catch (e) {}
  return keep(await make());
}
let kTick = null, kbots = null, kg27 = null;
export default {
  async fetch(req, env, ctx) {
    const t0 = Date.now();   // n31t (batch 31, item 258): worker time to response headers, sent as Server-Timing on kolaboro.com HTML
    // n31t (batch 31, item 273): maintenance mode. Off unless the environment setting KB_MAINT is "1": then every kolaboro.com page
    // answers with a short notice in its language (503, Retry-After); data files, APIs, scripts and /status/ keep working.
    if (env && env.KB_MAINT === '1' && (req.method === 'GET' || req.method === 'HEAD') && /^(www\.)?kolaboro\.com$/.test(new URL(req.url).hostname)) {
      try { if (!kn31t) kn31t = await import('./kbx_n31t.js'); const u0 = new URL(req.url); if (!kn31t.MAINT_SKIP.test(u0.pathname)) return await kn31t.maintPage(u0, env); } catch (e) {}
    }
    if (/^(www\.)?kolaboro\.com$/.test(new URL(req.url).hostname)) await kbStrings(env);   // n32w: string tables first (see kbStrings)
    if (kn33a && /^(www\.)?kolaboro\.com$/.test(new URL(req.url).hostname)) { try { await kn33a.prep(env, new URL(req.url)); } catch (e) {} }   // n33a (item 79): data card for the /data/ Dataset node
    if (env && env.KB_CSP_STRICT === '0') KB_CSP_SCRIPTS = false;   // n21e: rollback switch for the strict script policy on kolaboro.com
    if (req.method === 'GET' && /^(www\.)?kolaboro\.com$/.test(new URL(req.url).hostname) && /bot|crawl|spider|GPT|Claude|anthropic|Perplexity|Bytespider|meta-extern|cohere|Mistral|Diffbot/i.test(req.headers.get('user-agent') || '')) { try { if (!kbots) kbots = await import('./kbx_bots.js'); kbots.count(req, new URL(req.url), ctx); } catch (e) {} }   // n26i: AI crawler visits per day (kbx_bots.js)
    if ((req.method === 'GET' || (req.method === 'POST' && /^\/mcp\/?$/.test(new URL(req.url).pathname))) && /^(www\.)?kolaboro\.com$/.test(new URL(req.url).hostname)) { try { if (!k27a) k27a = await import('./kbx_n27a.js'); k27a.count(req, new URL(req.url), ctx); } catch (e) {} }   // n27a: page views by page type and searches started (edge counters, kbx_n27a.js)
    let r;   // r3u (batch 37): a kolaboro.com page that throws is tried once more, then answers a short retry notice in its language (503) instead of the platform error page
    try { r = await this.fetch0(req, env, ctx); } catch (e0) {
      if (!/^(www\.)?kolaboro\.com$/.test(new URL(req.url).hostname) || (req.method !== 'GET' && req.method !== 'HEAD')) throw e0;
      try { r = await this.fetch0(req, env, ctx); } catch (e1) { try { if (!kn37u) kn37u = await import('./kbx_n37u.js'); const er = await kn37u.errPage(new URL(req.url)); er.headers.set('x-kb-err', String(e1 && e1.message || e1).slice(0, 120).replace(/[^\x20-\x7e]/g, '')); return er; } catch (e2) { throw e1; } }
    }
    if (req.method === 'GET' && r && r.status === 200 && /^(www\.)?kolaboro\.com$/.test(new URL(req.url).hostname) && KN37U_INJ.test(new URL(req.url).pathname)) { try { if (!kn37u) kn37u = await import('./kbx_n37u.js'); r = await kn37u.inject(req, new URL(req.url), env, r); } catch (e) {} }   // r1u (batch 37): record links on project pages, gaps link on /data/, /data/dictionary/, /registers/, shipped list on /engineering/ and /yc/
    if (req.method === 'GET' && r && r.status === 200 && /^(www\.)?kolaboro\.com$/.test(new URL(req.url).hostname) && KN35A_INJ.test(new URL(req.url).pathname)) { try { if (!kn35a) kn35a = await import('./kbx_n35a.js'); r = await kn35a.inject(req, new URL(req.url), env, r, kbNonce(r)); } catch (e) {} }   // n35a (batch 35): construction pace + contradictions on project pages, signals on developer pages, links on /m/dubai/, /data/, /registers/, /numbers/, shipped list on /engineering/ and /yc/
    if (req.method === 'GET' && r && r.status === 200 && /^(www\.)?kolaboro\.com$/.test(new URL(req.url).hostname) && KN34A_INJ.test(new URL(req.url).pathname)) { try { if (!kn34a) kn34a = await import('./kbx_n34a.js'); r = await kn34a.inject(req, new URL(req.url), env, r, kbNonce(r)); } catch (e) {} }   // n34a (batch 34): track record on developer pages, evidence button on project pages, intervals on /numbers/, /delays/, /m/<market>/, links on /engineering/, /yc/, /data/
    if (req.method === 'GET' && r && r.status === 200 && /^(www\.)?kolaboro\.com$/.test(new URL(req.url).hostname)) { const u0 = new URL(req.url); if (!u0.search && /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:projects|rankings\/transparency|handover|handover\/overdue)\/$/.test(u0.pathname)) { try { if (!k29i) k29i = await import('./kbx_n29i.js'); r = await k29i.hubInject(req, u0, env, r, h => ruPlaces(kbRu(h))); } catch (e) {} } }   // n29i: key figures and Q&A on the hubs (items 93, 95)
    // n31t (batch 31, item 274): every /api/v1 JSON answer up to 512 KB is signed like /api/open/*: header x-kolaboro-signature = Ed25519
    // over "kolaboro-sig-v1\n" + SHA-256 hex of the exact body, key id in x-kolaboro-key-id, keys at /.well-known/kolaboro-keys.json
    if (req.method === 'GET' && r && r.status === 200 && !r.headers.has('x-kolaboro-signature') && /^(www\.)?kolaboro\.com$/.test(new URL(req.url).hostname) && /^\/api\/v1\//.test(new URL(req.url).pathname) && /json/.test(r.headers.get('content-type') || '') && +(r.headers.get('content-length') || 0) <= 524288) {
      try { const body = await r.text(); const h = new Headers(r.headers);
        if (body.length <= 524288) { if (!kb) kb = await import('./kolaboro.js'); const sg = await kb.signBody(env, body); if (sg) { h.set('x-kolaboro-signature', sg); h.set('x-kolaboro-key-id', (env && env.KB_SIGN_KID) || 'kb'); h.set('access-control-expose-headers', [h.get('access-control-expose-headers'), 'x-kolaboro-signature, x-kolaboro-key-id'].filter(Boolean).join(', ')); } }
        r = new Response(body, { status: r.status, statusText: r.statusText, headers: h }); } catch (e) {}
    }
    // n29e (batch 29): every CSV and JSON data download says its licence (Link rel=license), as /editorial-policy/ states
    if (r && r.status === 200 && /^(www\.)?kolaboro\.com$/.test(new URL(req.url).hostname)) { const ct = r.headers.get('content-type') || '', pth = new URL(req.url).pathname;
      if ((/text\/csv/.test(ct) || (/json/.test(ct) && /^\/(data|api\/open|api\/v1|api\/x\/transparency|rankings|stories|press)\//.test(pth))) && !/rel="?license/.test(r.headers.get('link') || '')) {
        try { const h = new Headers(r.headers), lk = h.get('link'); h.set('link', (lk ? lk + ', ' : '') + '<https://creativecommons.org/licenses/by/4.0/>; rel="license"'); r = new Response(r.body, { status: r.status, statusText: r.statusText, headers: h }); } catch (e) {} } }
    // n34s (21 Nov 2026): API answers (JSON, JSON Feed, GeoJSON) and plain text get a deny-all policy: opened directly in a browser tab
    // they can never run script, load anything or be framed, even if an echoed query value looked like markup (nosniff stays on)
    if (r && r.status >= 200 && r.status < 500 && r.status !== 204 && r.status !== 304 && !r.webSocket && /^(www\.)?kolaboro\.com$/.test(new URL(req.url).hostname) && /^(application\/[a-z.+-]*json|text\/plain)/i.test(r.headers.get('content-type') || '') && !r.headers.has('content-security-policy')) {
      try { const h = new Headers(r.headers); h.set('content-security-policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; sandbox"); h.set('x-content-type-options', 'nosniff'); if (!h.has('referrer-policy')) h.set('referrer-policy', 'strict-origin-when-cross-origin'); r = new Response(r.body, { status: r.status, statusText: r.statusText, headers: h }); } catch (e) {} }
    // n33i (batch 33, items 1, 6, 13): X-Robots-Tag noindex on every /api/ answer, 410 for unknown /api/kb/ GETs, nofollow or clean paths on parameter links
    if (r && /^(www\.)?kolaboro\.com$/.test(new URL(req.url).hostname)) { const u0 = new URL(req.url); if (/^\/api\//.test(u0.pathname) || (req.method === 'GET' && r.status === 200 && /text\/html/.test(r.headers.get('content-type') || ''))) { try { if (!kn33i) kn33i = await import('./kbx_n33i.js'); r = await kn33i.post(req, u0, r, env); } catch (e) {} } }
    // n33b (batch 33, item 93): "How to cite this page" (text with link, BibTeX, licence) on report pages that carry none (see kbx_n33b.js cite)
    if (req.method === 'GET' && r && r.status === 200 && /^(www\.)?kolaboro\.com$/.test(new URL(req.url).hostname) && KN33C.test(new URL(req.url).pathname) && /text\/html/.test(r.headers.get('content-type') || '')) {
      try { if (!kn33b) kn33b = await import('./kbx_n33b.js'); r = await kn33b.cite(req, r, env, new URL(req.url)); } catch (e) {}
    }
    if (/^(www\.)?kolaboro\.com$/.test(new URL(req.url).hostname)) { let r2 = r; try { if (!kTick) kTick = await import('./kbx_ticker.js'); r2 = await kTick.kbTick(req, r, env); } catch (e) { r2 = r; }
      // n29t (item 44): crawlers get an ETag on every HTML page and a 304 when the page did not change since their last visit (see kbCond)
      if (req.method === 'GET' && KB_BOT_UA.test(req.headers.get('user-agent') || '')) { try { return await kbCond(req, r2); } catch (e) { return r2; } }
      try { if (r2 && /text\/html/.test(r2.headers.get('content-type') || '')) { const h = new Headers(r2.headers), st = h.get('server-timing'); h.set('server-timing', (st ? st + ', ' : '') + 'edge;dur=' + (Date.now() - t0) + ';desc="worker to headers"'); r2 = new Response(r2.body, { status: r2.status, statusText: r2.statusText, headers: h }); } } catch (e) {}
      return r2; }
    return r;
  },
  async fetch0(req, env, ctx) {
    const u = new URL(req.url);
    let host = u.hostname.replace(/^www\./, '');
    if (host.endsWith('.pages.dev')) {
      const q = u.searchParams.get('__site');
      if (q) return /^[a-z0-9.-]{3,80}$/.test(q) ? new Response(null, { status: 302, headers: { location: '/', 'set-cookie': '__site=' + q + '; Path=/; SameSite=Lax; Secure; HttpOnly' } }) : new Response('Not found', { status: 404 });   // n20s: host names only (no cookie attribute injection)
      const m = (req.headers.get('cookie') || '').match(/(?:^|;\s*)__site=([a-z0-9.-]{3,80})(?:;|$)/);
      if (m) host = m[1];
      if (host === 'kolaboro.com') await kbStrings(env);   // n32w: previews of kolaboro.com too
      // preview: route shared assets here too and point the bundles' /__sb/ calls at this preview host
      const isAsset = u.pathname.startsWith('/assets/') || u.pathname.startsWith('/__l5e/assets-v1/');
      if (!u.pathname.startsWith('/__sb/')) {
        const r0 = isAsset ? await env.ASSETS.fetch(req) : await this.site(req, env, ctx, u, host);
        const ct = r0.headers.get('content-type') || '';
        if (r0.status === 200 && /javascript|text\/html/.test(ct)) {
          const t = (await r0.text()).replace(/https:\/\/(?:www\.)?[a-z0-9.-]+\/__sb\//g, 'https://' + u.host + '/__sb/');
          const h = new Headers(r0.headers); h.delete('content-length'); h.delete('etag');
          return new Response(t, { status: 200, headers: h });
        }
        return r0;
      }
    }
    if (u.pathname.startsWith('/__sb/')) return sbProxy(req, u);
    // n29t (item 49): one URL per page. A page path typed with capitals (/Projects/x/, /ES/...) or with a doubled slash answered 404
    // (or 503 on /countries/UAE/); it now gets a 301 to the lowercase, single-slash form. Only page sections whose URLs are all
    // lowercase; ids that keep capitals (/p/DXB-009/, /embed/, /api/, files) and percent escapes are left as they are.
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD')) { const kc = kbCaseFix(u); if (kc) return new Response(null, { status: 301, headers: { location: kc, 'cache-control': 'public, max-age=3600' } }); }
    // n29q: Sumba (conflict of interest) is shown only in the transparency ranking: its market file and anonymous project pages point there
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:m\/sumba|p\/sum-\d{1,4})\/?$/i.test(u.pathname)) { const lg = (/^\/(es|de|fr|nl|ru|zh|ar)\//.exec(u.pathname) || [])[1]; return new Response(null, { status: 301, headers: { location: (lg ? '/' + lg : '') + '/rankings/transparency/sumba/', 'cache-control': 'public, max-age=3600' } }); }
    // n33i (batch 33, items 3, 4, 5, 15): /p/?id=, /m/?market=, /<lang>/ask-developer/?id= and unknown ids on /explain/, /timeline/, /ask-developer/
    if (host === 'kolaboro.com' && req.method === 'GET' && u.search && /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:p|m|ask-developer|explain|timeline)\/?$/.test(u.pathname)) {
      try { if (!kn33i) kn33i = await import('./kbx_n33i.js'); const x = await kn33i.pre(req, u, env); if (x instanceof Response) return x;
        if (x === 'nf') { const nu = new URL('/__kb_missing__/', u); const nf = kbHeaders(await this.site(new Request(nu, req), env, ctx, nu, host), nu); if (nf.status === 404 && /text\/html/.test(nf.headers.get('content-type') || '')) { if (!k404) k404 = await import('./kbx_404.js'); const pg = await k404.page(nf, u, 404, env); return /^\/(es|de|fr|nl|ru|zh|ar)\//.test(u.pathname) ? kbHeaders(pg, u) : pg; } }
      } catch (e) {}
    }
    // kolaboro.com (seoT, batch 8): HEAD answers exactly like GET (status and headers, no body) for every page, incl. worker-rendered ones
    if (host === 'kolaboro.com' && env && env.KB_WKEY) { if (!kb) kb = await import('./kolaboro.js'); kb.useEnv(env); }   // sec13: worker key from the Cloudflare secret when Carlos sets it
    if (host === 'kolaboro.com' && req.method === 'HEAD' && !/^\/(api|mcp)(\/|$)/.test(u.pathname)) { const g = await this.fetch(new Request(req.url, { method: 'GET', headers: req.headers }), env, ctx); return new Response(null, { status: g.status, statusText: g.statusText, headers: g.headers }); }
    if (host === 'kolaboro.com' && req.method === 'GET' && /^\/m\/[^/.]{2,60}$/.test(u.pathname)) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search } });
    // n19e (batch 19): tools merged into one page (the payment account check was a subset of the account check)
    if (host === 'kolaboro.com' && req.method === 'GET' && /^\/tools\/iban-check\/?(?:index\.html)?$/.test(u.pathname)) return new Response(null, { status: 301, headers: { location: '/tools/account-check/' + u.search, 'cache-control': 'public, max-age=3600' } });
    // kolaboro.com (n33l, batch 33, item 76): HTML site map /[<lang>/]sitemap/ by country and market (see kbx_n33l.js)
    if (host === 'kolaboro.com' && req.method === 'GET' && /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?sitemap\/?$/.test(u.pathname)) {
      try { if (!kn33l) kn33l = await import('./kbx_n33l.js');
        const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
        const r = await kn33l.sitemapPage(req, u, env, shell); if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r; } catch (e) {}
    }
    // kolaboro.com (n31s, batch 31): /<lang>/tools/, /<lang>/glossary/, /[lang/]reports/month/, /[lang/]docs/, /engineering/notes/[<post>/], /projects/<slug>.md (see kbx_n31s.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KN31S.test(u.pathname)) {
      if (!kn31s) kn31s = await import('./kbx_n31s.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kn31s.handle(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com: sitemap index, llms.txt, country hubs and guides, rankings, comparisons, embeds, SEO dashboard (see kbx_seo.js)
    // kolaboro.com (b9a, batch 9): public named-facts API /api/v1/projects/<slug>, search index, Atom/JSON feeds, email watch (see kbx_follow.js)
    // kolaboro.com (b10b, batch 10): DID document for did:web:kolaboro.com, the issuer of Kolaboro's W3C verifiable credentials (see kbx_acct.js)
    if (host === 'kolaboro.com' && u.pathname === '/.well-known/did.json' && (req.method === 'GET' || req.method === 'HEAD')) { const ka = await import('./kbx_acct.js'); return ka.did(env); }
    // kolaboro.com (n31a, batch 31): /funnel/, /request-project/, /business/, /money/, /already-signed/, /report/sample/<slug>/, /api/open/{fn,funnel,sv} (see kbx_n31a.js);
    // /pricing/ goes through it only when the owner turns on a flagged offer (env KB_N31_OFFERS), otherwise it is untouched
    if (host === 'kolaboro.com' && (KN31X.test(u.pathname) || (env && env.KB_N31_OFFERS && req.method === 'GET' && /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?pricing\/$/.test(u.pathname)))) {
      if (!kn31x) kn31x = await import('./kbx_n31a.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      try {
        if (!KN31X.test(u.pathname)) { const lg = (/^\/(es|de|fr|nl|ru|zh|ar)\//.exec(u.pathname) || [])[1] || 'en'; const r0 = await this.site(req, env, ctx, u, host); if (r0 && r0.status === 200) return kbHeaders(await kn31x.pricingOffers(r0, lg, env), u); }
        else { const r = await kn31x.handle(req, u, env, ctx, shell); if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r; }
      } catch (e) {}
    }
    // kolaboro.com (n31b, batch 31): /case-studies/, /conflicts-of-interest/, /what-we-cannot-know/, /data-removal/, /report-fraud/, /transparency-report/2026/,
    // /registers/captures/, /score-history/ in 8 languages, /k/n31b.js, /data/cases/aykon-city-3.json (see kbx_n31b.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KN31B.test(u.pathname)) {
      if (!kn31b) kn31b = await import('./kbx_n31b.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      try { const r = await kn31b.handle(req, u, env, ctx, shell); if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r; } catch (e) {}
    }
    // kolaboro.com (r1u, batch 37): /[lang/]projects/<slug>/record/, /[lang/]data/gaps/ (see kbx_n37u.js)
    if (host === 'kolaboro.com' && KN37U.test(u.pathname)) {
      if (!kn37u) kn37u = await import('./kbx_n37u.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      try { const r = await kn37u.handle(req, u, env, ctx, shell); if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r; } catch (e) {}
    }
    // kolaboro.com (n35b, batch 35): /[lang/]developers/compare/, /[lang/]projects/<slug>/journey/, /[lang/]tools/vault/, /[lang/]tools/price-per-m2/ (see kbx_n35b.js)
    if (host === 'kolaboro.com' && KN35B.test(u.pathname)) {
      if (!kn35b) kn35b = await import('./kbx_n35b.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      try { const r = await kn35b.handle(req, u, env, ctx, shell); if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r; } catch (e) {}
    }
    // kolaboro.com (n34b, batch 34): /[lang/]tools/due-diligence/, /[lang/]markets/compare/, /[lang/]search/, /[lang/]projects/<slug>/questions/,
    // /api/v1/projects/<slug>/questions (see kbx_n34b.js); before n32t, whose /<lang>/tools/<x>/ pattern would take /<lang>/tools/due-diligence/
    if (host === 'kolaboro.com' && KN34B.test(u.pathname)) {
      if (!kn34b) kn34b = await import('./kbx_n34b.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      try { const r = await kn34b.handle(req, u, env, ctx, shell); if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r; } catch (e) {}
    }
    // kolaboro.com (n35a, batch 35): intelligence from our own data: /construction-pace/, /prices/asking-vs-registered/, /registers/escrow-banks/,
    // /signals/, /developers/<slug>/signals/, /data/{contradictions,aliases,dictionary,diff,ask}/, /satellite/changes/ (see kbx_n35a.js)
    if (host === 'kolaboro.com' && KN35A.test(u.pathname)) {
      if (!kn35a) kn35a = await import('./kbx_n35a.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      try { const r = await kn35a.handle(req, u, env, ctx, shell); if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r; } catch (e) {}
    }
    // kolaboro.com (n34a, batch 34): data and verification engine: /track-record/, /sources/health/, /claims/evidence/, /registers/changes/,
    // /watch/duplicates/, /numbers/intervals/, /engineering/reproducible/, /data/history/, /engineering/data-quality/pins/, /data/formats/,
    // /api/v1/projects/<id|slug>/{history,evidence}, /api/v1/developers/<slug>/track-record (see kbx_n34a.js)
    if (host === 'kolaboro.com' && KN34A.test(u.pathname)) {
      if (!kn34a) kn34a = await import('./kbx_n34a.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      try { const r = await kn34a.handle(req, u, env, ctx, shell); if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r; } catch (e) {}
    }
    // kolaboro.com (n33a, batch 33): /[lang/]delays/, off-plan delays of the week, same address every week (see kbx_n33a.js)
    if (host === 'kolaboro.com' && KN33A.test(u.pathname)) {
      if (!kn33a) kn33a = await import('./kbx_n33a.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      try { const r = await kn33a.handle(req, u, env, ctx, shell); if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r; } catch (e) {}
    }
    // kolaboro.com (n34c, batch 34): /engineering/{usage,sdk,performance,monitoring,security,mcp,search-quality}/, /data/delta/, /verify/transparency-log/,
    // /embed/charts/, /embed/chart/<market>/, /api/v1/{delta,tlog,charts,monitoring}; and /data/*.json from Brotli quality 11 copies (see kbx_n34c.js)
    if (host === 'kolaboro.com' && req.method === 'GET' && /^\/data\/[a-z0-9/_-]+\.json$/.test(u.pathname)) {
      try { if (!kn34c) kn34c = await import('./kbx_n34c.js'); const r = await kn34c.brServe(req, u, env); if (r) return r; } catch (e) {}
    }
    if (host === 'kolaboro.com' && KN34C.test(u.pathname)) {
      if (!kn34c) kn34c = await import('./kbx_n34c.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      try { const r = await kn34c.handle(req, u, env, ctx, shell); if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r; } catch (e) {}
    }
    // kolaboro.com (n32x, batch 32): /data/sql/, /claims/search/, /anomalies/, /graph/entities/, /verify/offline/, /engineering/{provenance,early-hints}/,
    // /changes/live/, /watch/website-changes/, /satellite/construction-index/, /api/v1/{stream,provenance}; /sql/ 301 (see kbx_n32x.js)
    if (host === 'kolaboro.com' && KN32X.test(u.pathname)) {
      if (!kn32x) kn32x = await import('./kbx_n32x.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      try { const r = await kn32x.handle(req, u, env, ctx, shell); if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r; } catch (e) {}
    }
    // kolaboro.com (n31t, batch 31): engineering pages (architecture, modules, rollback, licences, checks, maintenance preview), /shortcuts/,
    // /security/disclosure/, press pages in 8 languages, /api/v1/alerts (see kbx_n31t.js)
    if (host === 'kolaboro.com' && KN31T.test(u.pathname)) {
      if (!kn31t) kn31t = await import('./kbx_n31t.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      try { const r = await kn31t.handle(req, u, env, ctx, shell); if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r; } catch (e) {}
    }
    // kolaboro.com (n30b, batch 30): /data/snapshots/, /api/docs/, /engineering/data-quality/, /projects/<slug>/certificate/, /offline/, /manifest.webmanifest,
    // /api/v1/{snapshots,openapi.json,data-quality,changes,changes/feed.json,projects/<slug>/certificate,developers/<slug>/website} (see kbx_n30b.js)
    // kolaboro.com (n31c, batch 31): a developer or project recorded twice answers with a 301 to its one stable page; /stalled/ list (see kbx_n31c.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && (KN31A.test(u.pathname) || KN31C.test(u.pathname))) {
      if (!kn31c) kn31c = await import('./kbx_n31c.js');
      const ar = KN31A.test(u.pathname) ? kn31c.aliasRedirect(u) : null; if (ar) return ar;
      if (KN31C.test(u.pathname)) {
        const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
        try { const r = await kn31c.handle(req, u, env, ctx, shell); if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r; } catch (e) {}
      }
    }
    if (host === 'kolaboro.com' && KN30B.test(u.pathname)) {
      if (!kn30b) kn30b = await import('./kbx_n30b.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      try { const r = await kn30b.handle(req, u, env, ctx, shell); if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r; } catch (e) {}
    }
    // kolaboro.com (n27a, batch 27): answer files per place and developer, per-project CSV, /corrections.json, developer dashboards, /yc/, usage counters (see kbx_n27a.js)
    if (host === 'kolaboro.com' && K27A.test(u.pathname)) {
      if (!k27a) k27a = await import('./kbx_n27a.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const inner = p => this.fetch(new Request(new URL(p, u), { headers: { accept: 'application/json' } }), env, ctx);
      try { const r = await k27a.handle(req, u, env, ctx, shell, inner); if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r; } catch (e) {}
    }
    // kolaboro.com (b11 x11a, batch 11): Project X-ray stream /api/kb/xray, API /api/v1/xray, sealed X-rays /x/<root>/ (see kbx_xray.js)
    if (host === 'kolaboro.com' && KXR.test(u.pathname)) { if (!kxr) kxr = await import('./kbx_xray.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kxr.handle(req, u, env, ctx, shell); if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r; }
    if (host === 'kolaboro.com' && KCAL.test(u.pathname)) { if (!kcal) kcal = await import('./kbx_cal.js'); const r = await kcal.handle(req, u, env, ctx); if (r) return r; }
    if (host === 'kolaboro.com' && KFW.test(u.pathname)) { if (!kfw) kfw = await import('./kbx_follow.js'); const r = await kfw.handle(req, u, env, ctx); if (r) return r; }
    // kolaboro.com (x11c, batch 11): Project X-ray conversion block API, "X-ray this project" partner button, admin X-rays tab (see kbx_xc.js)
    if (host === 'kolaboro.com' && KXC.test(u.pathname)) { if (!kxc) kxc = await import('./kbx_xc.js'); return kxc.handle(req, u, env, ctx); }
    // kolaboro.com (x11b, batch 11): Project X-ray evidence cards 11-18 (/api/xev) and the Sentinel-2 crop (/api/xev/sat.png), see kbx_xray_ev.js
    if (host === 'kolaboro.com' && KXEV.test(u.pathname)) { if (!kxev) kxev = await import('./kbx_xray_ev.js'); return kxev.handle(req, u, env, ctx); }
    // kolaboro.com (b10c, batch 10): bulk register check page + API (kbx_bulk.js), 1200x630 share images per named project/developer (kbx_og.js)
    if (host === 'kolaboro.com' && KB10.test(u.pathname)) {
      if (u.pathname.startsWith('/og/')) { if (!kog) kog = await import('./kbx_og.js'); const r = await kog.handle(req, u, env, ctx); if (r) return r; }
      else { if (!kbk) kbk = await import('./kbx_bulk.js'); if (!klk) klk = await import('./kbx_lookup.js');
        const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
        const r = await kbk.handle(req, u, env, ctx, shell, klk.handle); if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r; }
    }
    // kolaboro.com (f14c, batch 14): developer network graph /graph/developers/, live X-ray globe /live/xrays/, /api/x/net/* (see kbx_net.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KNET.test(u.pathname)) {
      if (!knet) knet = await import('./kbx_net.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await knet.handle(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n18d, batch 18): contract addendum builder, clauses with the law they rely on, PDF/.docx in the browser (see kbx_paper.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KCA.test(u.pathname)) {
      if (!kca) kca = await import('./kbx_paper.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kca.handleTool(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n17d, batch 17): permit photo reader, OCR in the browser, one-tap register lookup (see kbx_pp.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KPP.test(u.pathname)) {
      if (!kpp) kpp = await import('./kbx_pp.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kpp.handle(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n18e, batch 18): /cohort/ buyer groups page in 8 languages (feature behind KB_COHORT + migration; see kbx_cohort.js)
    if (host === 'kolaboro.com' && req.method === 'GET' && /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?cohort\/?$/.test(u.pathname)) {
      const kco = await import('./kbx_cohort.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kco.page(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n18e, batch 18): /data/dev-response.json is computed live from public aggregate functions (the static file is the fallback)
    if (host === 'kolaboro.com' && req.method === 'GET' && u.pathname === '/data/dev-response.json') { if (!kfc) kfc = await import('./kbx_fc.js'); return kfc.devResponseJson(env); }
    // kolaboro.com (n19d, batch 19): /satellite/plot/ in 8 languages: Sentinel-2 per quarter since 2017 made on demand, time-lapse GIF (see kbx_plot.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KPLOT.test(u.pathname)) {
      if (!kplot) kplot = await import('./kbx_plot.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kplot.handle(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n21d, batch 21): /tools/bulk-check/ in 8 languages: a list of names or links matched in the browser against the public index (see kbx_bulkix.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KBIX.test(u.pathname)) {
      if (!kbix) kbix = await import('./kbx_bulkix.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kbix.page(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n19a, batch 19): /watch/lookalikes/ in 8 languages, admin Screening tab script (see kbx_watch.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KWAT.test(u.pathname)) {
      if (!kwat) kwat = await import('./kbx_watch.js');
      if (u.pathname === '/__k/kwatch-admin.js') return new Response(kwat.ADMIN_JS, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'no-store' } });
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kwat.page(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n27e, batch 27): /projects/<slug>/report/ and report.pdf, /weekly/[<place>/] (+ feeds, sitemap), /api/x/e27/* (see kbx_e27.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KE27.test(u.pathname)) {
      if (!ke27) ke27 = await import('./kbx_e27.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await ke27.handle(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n31e, batch 31): buyer tools, satellite loop, new developer websites, install page (see kbx_n31e.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KN31E.test(u.pathname)) {
      if (!kn31e) kn31e = await import('./kbx_n31e.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      try { const r = await kn31e.handle(req, u, env, ctx, shell); if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r; } catch (e) {}
    }
    // kolaboro.com (n30c, batch 30): /k/n30c-map.js, /api/v1/pin/<ID>, /embed/v2/<slug>/, /embed/v2.js, /[lang/]prices/history/[<place>/], /[lang/]watch/lookalikes/images/, /[lang/]tools/widget/, /[lang/]engineering/status/ (see kbx_n30c.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && K30C.test(u.pathname)) {
      if (!k30c) k30c = await import('./kbx_n30c.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kbEdge(req, u, env, ctx, async () => { const r0 = await k30c.handle(req, u, env, ctx, shell); return r0 && /text\/html/.test(r0.headers.get('content-type') || '') ? kbHeaders(r0, u) : r0; });   // n32s: edge copy of /engineering/status/
      if (r) return r;
    }
    // kolaboro.com (n30a, batch 30): /k/n30a.js, /k/n30a-cr.js, /api/v1/slippage[.csv], /[lang/]tools/contract-reader/, /[lang/]methods/handover-slippage/, /[lang/]projects/<slug>/timeline/ (see kbx_n30a.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KN30.test(u.pathname)) {
      if (!kn30) kn30 = await import('./kbx_n30a.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kn30.handle(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n26u, batch 26): /compare/?p=<slugs> (named, 8 languages, noindex), /api/v1/facets, /api/v1/followers, /api/x/status/pages (see kbx_u26.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KU26.test(u.pathname)) {
      if (!ku26) ku26 = await import('./kbx_u26.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await ku26.handle(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n27u, batch 27): /k/u27.js, /api/v1/cost, /api/v1/map, /[lang/]map/, /[lang/]updates/ (see kbx_u27.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KU27.test(u.pathname)) {
      if (!ku27) ku27 = await import('./kbx_u27.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await ku27.handle(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // n26u: the database server's 5-minute uptime probe of /api/kb/health also refreshes the key-page sweep shown on /status/
    if (host === 'kolaboro.com' && u.pathname === '/api/kb/health' && req.method === 'GET') { try { if (!ku26) ku26 = await import('./kbx_u26.js'); ku26.warm(env, ctx); } catch (e) {} }
    // kolaboro.com (n29e, batch 29): /editorial-policy/, /how-we-work/, /sources/, /buyer-protection-law/, /countries/foreign-buyers/ in 8 languages (kbx_e29.js); before kbx_seo.js's /countries/<c>/
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KE29.test(u.pathname)) {
      if (!ke29) ke29 = await import('./kbx_e29.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await ke29.handle(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n33b, batch 33): /reports/transparency/[<YYYY-MM>/] + CSV, /transparency-badge/developers/ and its SVG, 8 languages (see kbx_n33b.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KN33B.test(u.pathname)) {
      if (!kn33b) kn33b = await import('./kbx_n33b.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kn33b.handle(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n27t, batch 27): /corrections/, /buyer-cases/, /cite/, /contact/, /transparency-badge/ in 8 languages, the badge SVG and the ranking CSV (see kbx_t27.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KT27.test(u.pathname)) {
      if (!kt27) kt27 = await import('./kbx_t27.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kt27.handle(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n26y, batch 26): /progress/, /progress/improvements/, /press/places/[<place>/], /moderation/, /team/ in 8 languages, their sitemap and /api/x/progress (see kbx_trust.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KTRU.test(u.pathname)) {
      if (!ktru) ktru = await import('./kbx_trust.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const inner = p => this.fetch(new Request(new URL(p, u), { headers: { accept: 'application/xml' } }), env, ctx);
      const r = await ktru.page(req, u, env, ctx, shell, inner);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n23, batch 23): /rankings/transparency/[<place>/] and /methods/transparency-score/ in 8 languages (see kbx_tr.js); before the /rankings/ hubs of kbx_seo.js
    // kolaboro.com (n29h1, batch 29): /reports/, /rankings/developers/, /permits/, /price-ranges/, /ownership/, /golden-visa/, /airports/
    // [<place>/] and /developers/<a>-vs-<b>/ in 8 languages (see kbx_h29.js); a path that is not one of these pages falls through
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KH29.test(u.pathname)) {
      if (!kh29) kh29 = await import('./kbx_h29.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kh29.page(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KTR.test(u.pathname)) {
      if (!ktr) ktr = await import('./kbx_tr.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await h29Inject(req, u, env, await llInject(req, u, env, ctx, await ktr.page(req, u, env, ctx, shell)));
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n26s, batch 26): /handover/[<year>/<place>/], /areas/[<place>/<area>/], /vs/<slug>-vs-<slug>/ in 8 languages (see kbx_facets.js);
    // a /vs/ path that is not one of these pairs falls through to the older id pairs of kbx_seo.js
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KFA.test(u.pathname)) {
      if (!kfa) kfa = await import('./kbx_facets.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await h29Inject(req, u, env, await kfa.page(req, u, env, ctx, shell));
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n29i, batch 29): /<lang>/m/<market>/ (5+ named projects), /m/sitemap.xml, /answers/questions.md|json (see kbx_n29i.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && K29I.test(u.pathname)) {
      if (!k29i) k29i = await import('./kbx_n29i.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      // n32s (item 258): translated market files are kept at the edge as whole pages (kbEdge), with the handover slippage block
      const mm32 = /^\/(es|de|fr|nl|ru|zh|ar)\/m\/([^/.]{2,60})\/$/.exec(u.pathname);
      if (mm32 && req.method === 'GET') { const r = await kbEdge(req, u, env, ctx, async () => { let r0 = await k29i.page(req, u, env, ctx, shell);
        if (r0 && r0.status === 200) { try { if (!kn30) kn30 = await import('./kbx_n30a.js'); const sb = await kn30.slipBlock(env, decodeURIComponent(mm32[2]), mm32[1]); if (sb) r0 = new HTMLRewriter().on('main', { element(e) { e.append(sb, { html: true }); } }).transform(r0); } catch (e) {} }
        return r0 && /text\/html/.test(r0.headers.get('content-type') || '') ? kbHeaders(r0, u) : r0; }); if (r) return r; }
      // n31s (item 193): translated country pages are kept in the edge cache like the English ones (served at once, rebuilt in the background after 15 minutes)
      const kc31 = !u.search && req.method === 'GET' && typeof caches !== 'undefined' && /^\/(?:es|de|fr|nl|ru|zh|ar)\/countries\/[a-z0-9-]{2,60}\/$/.test(u.pathname) ? new Request('https://kolaboro.com/__seoc/n31' + u.pathname) : null;
      if (kc31) { try { const hit = await caches.default.match(kc31); if (hit) { const age = Date.now() - (+hit.headers.get('x-built') || 0);
        if (age > 900e3 && ctx && ctx.waitUntil) ctx.waitUntil(k29i.page(req, u, env, ctx, shell).then(async r0 => { if (r0 && r0.status === 200 && /text\/html/.test(r0.headers.get('content-type') || '')) { const h0 = new Headers(r0.headers); h0.delete('content-length'); h0.set('x-built', String(Date.now())); h0.set('cache-control', 'public, max-age=86400'); await caches.default.put(kc31, new Response(await r0.text(), { headers: h0 })); } }).catch(() => {}));
        const h = new Headers(hit.headers); h.delete('x-built'); h.set('cache-control', 'public, max-age=600'); h.set('x-seo-cache', age > 900e3 ? 'stale' : 'hit'); return kbHeaders(new Response(hit.body, { status: 200, headers: h }), u); } } catch (e) {} }
      let r = await k29i.page(req, u, env, ctx, shell);
      if (kc31 && r && r.status === 200 && /text\/html/.test(r.headers.get('content-type') || '')) { try { const t0 = await r.text(), h0 = new Headers(r.headers); h0.delete('content-length'); const hc = new Headers(h0); hc.set('x-built', String(Date.now())); hc.set('cache-control', 'public, max-age=86400'); ctx && ctx.waitUntil && ctx.waitUntil(caches.default.put(kc31, new Response(t0, { headers: hc })).catch(() => {})); r = new Response(t0, { status: 200, headers: h0 }); } catch (e) {} }
      const mm30 = /^\/(es|de|fr|nl|ru|zh|ar)\/m\/([^/.]{2,60})\/?$/.exec(u.pathname);   // n30a: handover slippage of the market, in the page language
      if (r && mm30 && r.status === 200 && req.method === 'GET') { try { if (!kn30) kn30 = await import('./kbx_n30a.js'); const sb = await kn30.slipBlock(env, decodeURIComponent(mm30[2]), mm30[1]); if (sb) r = new HTMLRewriter().on('main', { element(e) { e.append(sb, { html: true }); } }).transform(r); } catch (e) {} }
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n27c, batch 27): /guides/buying-off-plan/[<place>/] in 8 languages and its sitemap (see kbx_buy.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KBUY.test(u.pathname)) {
      if (!kbuy) kbuy = await import('./kbx_buy.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await h29Inject(req, u, env, await kbuy.page(req, u, env, ctx, shell));
      try { const bm = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?guides\/buying-off-plan\/(dubai|bali|phuket|cyprus)\/$/.exec(u.pathname); if (bm && r && r.status === 200 && req.method === 'GET') { if (!k29i) k29i = await import('./kbx_n29i.js'); const bl = k29i.buyerLinks(bm[1] || 'en', bm[2]); if (bl) { const r2 = new HTMLRewriter().on('main', { element(e) { e.append(bl, { html: true }); } }).transform(r); return /text\/html/.test(r2.headers.get('content-type') || '') ? kbHeaders(r2, u) : r2; } } } catch (e) {}   // n29i: buyers by nationality
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n21c, batch 21): /guides/short-let-rules/ in 8 languages (see kbx_rules.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KRUL.test(u.pathname)) {
      if (!krul) krul = await import('./kbx_rules.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await krul.page(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n18b, batch 18): /methods/construction-stage/ in 8 languages (see kbx_stage.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KSTG.test(u.pathname)) {
      if (!kstg) kstg = await import('./kbx_stage.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kstg.method(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (n17c, batch 17): /open live figures and /methods/delivery-forecast/ in 8 languages (see kbx_fc.js)
    if (host === 'kolaboro.com' && (req.method === 'GET' || req.method === 'HEAD') && KFC.test(u.pathname)) {
      if (!kfc) kfc = await import('./kbx_fc.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kfc.handle(req, u, env, ctx, shell);
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    // kolaboro.com (seoP, batch 8): named project and developer pages in 8 languages, /p/<id>/ 301 to them, /api/seo/urls (see kbx_named.js)
    if (host === 'kolaboro.com' && req.method === 'GET' && KNM.test(u.pathname)) {
      if (!knm) knm = await import('./kbx_named.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await h29Inject(req, u, env, await knm.handle(req, u, env, ctx, shell));
      if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    if (host === 'kolaboro.com' && req.method === 'GET' && (/^\/(?:p|id)\/[A-Za-z0-9-]{3,20}\/?$/.test(u.pathname) || (/^\/p\/?$/.test(u.pathname) && u.searchParams.has('id')))) { if (!knm) knm = await import('./kbx_named.js'); const rd = await knm.redirectP(u, env); if (rd) return rd; }
    // kolaboro.com (s15c, batch 15): embeddable fact cards and delivery trackers, verified-reply badge, monthly market data stories
    // with CSV, public change log + Atom, answer files and llms-projects.txt (see kbx_cite.js)
    if (host === 'kolaboro.com' && req.method === 'GET' && KCITE.test(u.pathname)) {
      if (!kcite) kcite = await import('./kbx_cite.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const r = await kcite.handle(req, u, env, ctx, shell);
      if (r) {
        if (/^\/embed\//.test(u.pathname)) { const h = new Headers(r.headers); h.delete('x-frame-options'); h.set('content-security-policy', "frame-ancestors *; default-src 'none'; style-src 'unsafe-inline'; img-src https://kolaboro.com; frame-src https://kolaboro.com; base-uri 'none'; form-action 'none'"); h.set('referrer-policy', 'no-referrer'); return new Response(r.body, { status: r.status, headers: h }); }
        return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
      }
    }
    // kolaboro.com (n26i, batch 26): AI crawler visits per day, counted at the edge (see kbx_bots.js)
    if (host === 'kolaboro.com' && req.method === 'GET' && /^\/api\/open\/ai-crawlers\/?$/.test(u.pathname)) { if (!kbots) kbots = await import('./kbx_bots.js'); return kbots.api(req); }
    // kolaboro.com (n32t, batch 32): /<lang>/tools/<tool>/, /<lang>/registers/, /<lang>/new/, /<lang>/vs/, /<lang>/m/ translated from the English page (see kbx_n32t.js)
    if (host === 'kolaboro.com' && req.method === 'GET' && KN32T.test(u.pathname)) {
      if (!kn32t) kn32t = await import('./kbx_n32t.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const inner = p => this.fetch(new Request(new URL(p, u), { headers: { accept: 'text/html' } }), env, ctx);
      try { const r = await kn32t.handle(req, u, env, ctx, shell, inner); if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r; } catch (e) {}
    }
    // kolaboro.com (n26i, batch 26): /numbers/ in 8 languages, citable figures with source and date (see kbx_numbers.js)
    if (host === 'kolaboro.com' && req.method === 'GET' && KNUM.test(u.pathname)) {
      if (!knum) knum = await import('./kbx_numbers.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { method: 'GET', headers: { accept: 'text/html' } }), env, ctx, su, host); };
      const inner = p => this.fetch(new Request(new URL(p, u), { headers: { accept: 'application/json' } }), env, ctx);
      try { const r = await knum.handle(req, u, env, ctx, shell, inner); if (r) return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r; } catch (e) {}
    }
    if (host === 'kolaboro.com' && req.method === 'GET' && KSEO.test(u.pathname)) {
      if (!kseo) kseo = await import('./kbx_seo.js');
      const shell = p => { const su = new URL(p, u); return this.site(new Request(su, { headers: req.headers }), env, ctx, su, host); };
      const inner = p => this.fetch(new Request(new URL(p, u), { headers: { accept: 'application/json' } }), env, ctx);
      // n29q: the English country pages took about 7 s on a cold build (and one 524 on /countries/uae/, 14 Nov 2026). They are now kept
      // at the edge for a day and served at once; after 15 minutes the next view rebuilds them in the background, like /numbers/.
      // The copy is taken before kbHeaders, so every response still gets its own CSP nonce.
      const make = async () => {
        let r = await h29Inject(req, u, env, await llInject(req, u, env, ctx, await kseo.handle(req, u, env, ctx, shell, inner)));
        if (r && r.status === 200 && (u.pathname === '/new/' || u.pathname === '/vs/')) { try { if (!kn32t) kn32t = await import('./kbx_n32t.js'); r = await kn32t.enAlt(u, r, env); } catch (e) {} }   // n32t: hreflang to the translated hubs
        if (r && r.status === 200 && req.method === 'GET' && /^\/(?:countries|rankings)\/(?:[a-z0-9-]{2,60}\/)?$/.test(u.pathname) && /text\/html/.test(r.headers.get('content-type') || '')) { try { if (!k29i) k29i = await import('./kbx_n29i.js'); const al = await k29i.crAlternates(env, u.pathname); if (al) r = new HTMLRewriter().on('link[rel="alternate"][hreflang]', { element(e) { e.remove(); } }).on('head', { element(e) { e.append(al, { html: true }); } }).transform(r); } catch (e) {} }   // n29i: hreflang to the language versions
        return r;
      };
      const kck = !u.search && typeof caches !== 'undefined' && /^\/countries\/(?:[a-z0-9-]{2,60}\/(?:[a-z-]{3,30}\/)?)?$/.test(u.pathname) ? new Request('https://kolaboro.com/__seoc/v1' + u.pathname) : null;
      const keep = async (r0) => { if (!r0 || r0.status !== 200 || !/text\/html/.test(r0.headers.get('content-type') || '')) return r0; const t = await r0.text(), h = new Headers(r0.headers); h.delete('content-length'); h.set('x-built', String(Date.now())); h.set('cache-control', 'public, max-age=86400'); try { await caches.default.put(kck, new Response(t, { headers: h })); } catch (e) {} const h2 = new Headers(r0.headers); h2.delete('content-length'); return new Response(t, { status: 200, headers: h2 }); };
      let r = null;
      if (kck) { try { const hit = await caches.default.match(kck); if (hit) { const age = Date.now() - (+hit.headers.get('x-built') || 0); if (age > 900e3 && ctx && ctx.waitUntil) ctx.waitUntil(make().then(keep).catch(() => {})); const h = new Headers(hit.headers); h.delete('x-built'); h.set('x-seo-cache', age > 900e3 ? 'stale' : 'hit'); r = new Response(hit.body, { status: 200, headers: h }); } } catch (e) { r = null; } }
      if (!r) r = kck ? await keep(await make()) : await make();
      return /text\/html/.test(r.headers.get('content-type') || '') ? kbHeaders(r, u) : r;
    }
    if (host === 'equinoxinvestmentgroup.com') return eqHeaders(await this.site(req, env, ctx, u, host), u, req);
    if (host === 'kolaboro.com' && req.method === 'GET' && (/^\/p\/[A-Za-z0-9-]{3,20}\/?$/.test(u.pathname) || /^\/m\/[^/.]{2,60}\/?$/.test(u.pathname) || u.pathname === '/sitemap-data.xml')) {
      if (!kb) kb = await import('./kolaboro.js');
      if (u.pathname === '/sitemap-data.xml') return kb.dataSitemap();
      return kbEdge(req, u, env, ctx, async () => {   // n32s (item 258): whole-page edge copy of /m/<market>/
      const isP = u.pathname.startsWith('/p/'), shell = new URL(isP ? '/p/' : '/m/', u);
      const base = kbHeaders(await this.site(new Request(shell, req), env, ctx, shell, host), shell);
      const sr = await kb.ssr(base, u, isP ? 'p' : 'm', env);
      // n28a: an unknown /m/<market>/ or /p/<id>/ answered 404 with the hub page inside (its title, h1 and canonical to /m/ or /p/); it now gets the 404 page
      if (sr.status === 404) { try { const nu = new URL('/__kb_missing__/', u); const nf = kbHeaders(await this.site(new Request(nu, req), env, ctx, nu, host), nu); if (nf.status === 404 && /text\/html/.test(nf.headers.get('content-type') || '')) { if (!k404) k404 = await import('./kbx_404.js'); return await k404.page(nf, u, 404, env); } } catch (e) {} return sr; }
      if (isP || sr.status !== 200) return sr;
      // n17c (batch 17): delivery forecast section on market pages (see kbx_fc.js fcMarketHtml), appended to <main>
      // n27g (batch 27): dated figures for the 50 biggest markets and links to the market's most searched projects (kbx_g27.js), above the market file
      let sr1 = sr; try { if (!k29i) k29i = await import('./kbx_n29i.js'); const al = await k29i.mAlternates(env, decodeURIComponent(u.pathname.split('/')[2] || '')); if (al) sr1 = new HTMLRewriter().on('link[rel="alternate"][hreflang]', { element(e) { e.remove(); } }).on('head', { element(e) { e.append(al, { html: true }); } }).transform(sr); } catch (e) {}   // n29i: hreflang to the translated market files
      let sr2 = sr1; try { if (!kg27) kg27 = await import('./kbx_g27.js'); const gh = await kg27.marketBlock(env, decodeURIComponent(u.pathname.split('/')[2] || '')); if (gh) sr2 = new HTMLRewriter().on('#mk-body', { element(e) { e.before(gh, { html: true }); } }).transform(sr1); } catch (e) {}
      try { const mk0 = decodeURIComponent(u.pathname.split('/')[2] || '').toLowerCase(); if (['dubai', 'bali', 'phuket', 'cyprus'].includes(mk0)) { if (!k29i) k29i = await import('./kbx_n29i.js'); const bl = k29i.buyerLinks('en', mk0); if (bl) sr2 = new HTMLRewriter().on('main', { element(e) { e.append(bl, { html: true }); } }).transform(sr2); } } catch (e) {}   // n29i: buyers by nationality
      try { if (!kn30) kn30 = await import('./kbx_n30a.js'); const sb = await kn30.slipBlock(env, decodeURIComponent(u.pathname.split('/')[2] || ''), 'en'); if (sb) sr2 = new HTMLRewriter().on('main', { element(e) { e.append(sb, { html: true }); } }).transform(sr2); } catch (e) {}   // n30a: handover slippage of the market
      try { if (!kfc) kfc = await import('./kbx_fc.js'); const fh = await kfc.fcMarketHtml(env, decodeURIComponent(u.pathname.split('/')[2] || '')); if (fh) return h29Inject(req, u, env, new HTMLRewriter().on('main', { element(e) { e.append(fh, { html: true }); } }).transform(sr2)); } catch (e) {}
      return h29Inject(req, u, env, sr2);
      });
    }
    if (host === 'kolaboro.com') { let kr = kbHeaders(await this.site(req, env, ctx, u, host), u);
      // n25e: a missing page answers a 301 to its one clear replacement, a 410 for junk, or a useful translated 404 (see kbx_404.js)
      if (kr.status === 404 && (req.method === 'GET' || req.method === 'HEAD') && !/^\/api\//.test(u.pathname)) { if (!k404) k404 = await import('./kbx_404.js'); const fx = await k404.fix(u, env); if (fx instanceof Response) return fx; if (/text\/html/.test(kr.headers.get('content-type') || '')) { const pg = await k404.page(kr, u, fx === 'gone' ? 410 : 404, env); return /^\/(es|de|fr|nl|ru|zh|ar)(\/|$)/.test(u.pathname) ? kbHeaders(pg, u) : pg; } }   // n28a: the translated 404 shell is a raw file: it needs this response's script nonce, ds.css and style dedupe
      if (req.method === 'GET' && kr.status === 200 && /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?about\/$/.test(u.pathname) && /text\/html/.test(kr.headers.get('content-type') || '')) { try { if (!ke29l) ke29l = await import('./kbx_e29_lines.js'); const lg = (/^\/(es|de|fr|nl|ru|zh|ar)\//.exec(u.pathname) || [])[1] || 'en', ab = ke29l.ABOUT_CSS + ke29l.aboutBox(lg); kr = new HTMLRewriter().on('main', { element(e) { e.append(ab, { html: true }); } }).transform(kr); } catch (e) {} }   // n29e: entity facts on /about/ (item 62)
      if (req.method === 'GET' && kr.status === 200 && u.pathname === '/metrics/' && /text\/html/.test(kr.headers.get('content-type') || '')) { try { if (!k27a) k27a = await import('./kbx_n27a.js'); const mh = await k27a.metricsHtml(); if (mh) kr = new HTMLRewriter().on('main', { element(e) { e.append(mh, { html: true }); } }).transform(kr); } catch (e) {} }   // n27a: usage by page type and return visits on /metrics/
      if (req.method === 'GET' && kr.status === 200 && u.pathname === '/engineering/' && /text\/html/.test(kr.headers.get('content-type') || '')) { try { if (!kbots) kbots = await import('./kbx_bots.js'); const bh = await kbots.html(req); kr = new HTMLRewriter().on('main', { element(e) { e.append(bh, { html: true }); } }).transform(kr); } catch (e) {} }   // n26i: AI crawler visits on /engineering/
      if (req.method === 'GET' && kr.status === 200 && u.pathname === '/m/' && !u.search && /text\/html/.test(kr.headers.get('content-type') || '')) { try { if (!kn33a) kn33a = await import('./kbx_n33a.js'); kr = await kn33a.mIndex(env, kr); } catch (e) {} }   // n33a (item 87): the market list in the HTML, not only after JavaScript
      if (req.method === 'GET' && kr.status === 200 && /^\/(?:tools\/[a-z-]{3,30}|m|registers)\/$/.test(u.pathname) && /text\/html/.test(kr.headers.get('content-type') || '')) { try { if (!kn32t) kn32t = await import('./kbx_n32t.js'); kr = await kn32t.enAlt(u, kr, env); } catch (e) {} }   // n32t: hreflang to the translated pages
      if (req.method === 'GET' && kr.status === 200 && (u.pathname === '/tools/' || u.pathname === '/glossary/')) { try { if (!kn31s) kn31s = await import('./kbx_n31s.js'); kr = await kn31s.enStatic(u, kr, env); } catch (e) {} }   // n31s: hreflang to the translated hubs, project examples in the glossary
      // n26i (batch 26): the home page and the hubs link the project pages the fewest other project pages link to (kbx_named.js)
      kr = await llInject(req, u, env, ctx, kr);
      const kn = kbNonce(kr); if (req.method === 'GET' && /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?check\/?$/.test(u.pathname) && kr.status === 200 && /text\/html/.test(kr.headers.get('content-type') || '')) kr = new HTMLRewriter().on('body', { element(e) { e.append('<script' + kn + ' src="/k/xray.js?v=' + KXR_V + '" defer></script><script' + kn + ' src="/k/xray-cta.js?v=n36e1" defer></script>', { html: true }); } }).transform(kr); if (req.method === 'GET' && /^\/admin\/?$/.test(u.pathname) && /text\/html/.test(kr.headers.get('content-type') || '')) return new HTMLRewriter().on('body', { element(e) { e.append('<script' + kn + ' src="/__k/ktraffic.js?v=1" defer></script><script' + kn + ' src="/__k/kxc-admin.js?v=1" defer></script><script' + kn + ' src="/__k/kwatch-admin.js?v=1" defer></script>', { html: true }); } }).transform(kr); if (req.method === 'GET' && /^\/check\/?$/.test(u.pathname) && u.searchParams.get('utm_source') === 'realhunt' && /text\/html/.test(kr.headers.get('content-type') || '')) return new HTMLRewriter().on('body', { element(e) { e.append('<script' + kn + ' src="/__k/kbrh.js?v=1" defer></script>', { html: true }); } }).transform(kr); return kbLd(kr, u, env); }
    return this.site(req, env, ctx, u, host);
  },
  async site(req, env, ctx, u, host) {
    // kolaboro.com: desk-review API (see kolaboro.js).
    if (host === 'kolaboro.com' && (u.pathname === '/api/open' || u.pathname.startsWith('/api/open/') || u.pathname === '/feed.json' || u.pathname === '/feed.xml' || u.pathname === '/feed/alerts.xml')) { if (!kb) kb = await import('./kolaboro.js'); return kb.open(req, u, env); }
    if (host === 'kolaboro.com' && (u.pathname.startsWith('/api/x/') || u.pathname === '/mcp' || u.pathname.startsWith('/mcp/'))) { if (!kbx) kbx = await import('./kbx.js'); return kbx.route(req, u, env, ctx); }
    if (host === 'kolaboro.com' && /^\/backup-admin(\/|$)/.test(u.pathname)) { if (!kb) kb = await import('./kolaboro.js'); return kb.honeyPath(req, u, ctx); }
    // kolaboro.com: live official-register lookup (batch 7, see kbx_lookup.js)
    if (host === 'kolaboro.com' && /^\/api\/(kb|v1)\/lookup(\/|$)/.test(u.pathname)) { if (!klk) klk = await import('./kbx_lookup.js'); return klk.handle(req, u, env, ctx); }
    if (host === 'kolaboro.com' && (u.pathname.startsWith('/api/kb/') || u.pathname === '/api/v1' || u.pathname.startsWith('/api/v1/'))) { if (!kb) kb = await import('./kolaboro.js'); return kb.api(req, u, env, ctx); }
    // jobersity.com: 301, HTML propio en /oferta/<id> y /empresa|company/<slug>, sitemap de empresas, 404 reales y cabeceras (see jobersity.js).
    if (host === 'jobersity.com' && req.method === 'GET') {
      if (!jb) jb = await import('./jobersity.js');
      const rd = await jb.redirect(u, env);
      if (rd) return rd;
      const sm = await jb.companiesSitemap(u, ctx);
      if (sm) return sm;
      if (u.pathname.startsWith('/oferta/')) return jb.secure(u, await jb.render(req, await this.siteRaw(req, env, ctx, u, host), u, env, ctx));
      if (/^\/(empresa|company)\//.test(u.pathname)) return jb.secure(u, await jb.company(req, await this.siteRaw(req, env, ctx, u, host), u, env, ctx));
      return jb.secure(u, await jb.status(u, await this.siteRaw(req, env, ctx, u, host)));
    }
    // reelrole.com: candidate videos from the Cloudflare edge cache (see reelrole.js media()).
    if (host === 'reelrole.com' && (req.method === 'GET' || req.method === 'HEAD') && u.pathname.startsWith('/stream/')) { if (!rr) rr = await import('./reelrole.js'); return rr.media(req, u, ctx); }
    if (host === 'jurimatch.com' && req.method === 'GET' && /^\/(sitemap\.xml|login|signin|sign-in|firm-listing|fees|guides|founding|for-lawyers\/founding)\/?$/.test(u.pathname)) { if (!jm) jm = await import('./jurimatch.js'); const sm = await jm.route(req, u, env, ctx); if (sm) return sm; }
    const r = await this.siteRaw(req, env, ctx, u, host);
    if (host === 'realhunt.co' && req.method === 'GET' && /text\/html/.test(r.headers.get('content-type') || '')) { const rr = new HTMLRewriter().on('head', { element(e) { e.prepend("<script>/*rh-img-fb*/(function(){var M='https://realhunt-media.pages.dev/';document.addEventListener('error',function(e){var t=e.target;if(!t||t.tagName!=='IMG'||t.__rhfb)return;var s=t.currentSrc||t.getAttribute('src')||'';if(s.indexOf(M)!==0)return;t.__rhfb=1;e.stopImmediatePropagation();if(t.srcset)t.removeAttribute('srcset');t.src='https://realhunt.co/'+s.slice(M.length);},true);})();</script>", { html: true }); } }).on('body', { element(e) { e.append('<script src="/__k/kcheck.js?v=6" defer></script>', { html: true }); } }).transform(r); /* rh-sec-1 (9 Nov 2026): realhunt.co pages cannot be framed by other sites (clickjacking), no plugins, no <base> hijack */ const hh = new Headers(rr.headers); hh.set('x-frame-options', 'SAMEORIGIN'); hh.set('content-security-policy', "frame-ancestors 'self'; base-uri 'self'; object-src 'none'"); hh.set('permissions-policy', 'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), interest-cohort=()'); return new Response(rr.body, { status: rr.status, statusText: rr.statusText, headers: hh }); }
    // jurimatch.com: per-URL title, description and canonical in the HTML (see jurimatch.js).
    if (host === 'jurimatch.com' && req.method === 'GET') { if (!jm) jm = await import('./jurimatch.js'); return jm.render(req, r, u, env, ctx); }
    // reelrole.com: per-URL meta, candidate pages and real 404s (see reelrole.js).
    if (host === 'reelrole.com' && req.method === 'GET') { try { if (!rr) rr = await import('./reelrole.js'); return await rr.render(req, r, u, env, ctx); } catch (e) { return r; } }
    return r;
  },
  async siteRaw(req, env, ctx, u, host) {
    if (host === 'go.realhunt.co') { const p = u.pathname.replace(/\.html$/, '').replace(/\/index$/, '/'); return Response.redirect('https://realhunt.co' + (p || '/') + u.search, 301); }
    if (host === 'top3hotels.com') return viaTop3(req, env, ctx);
    if (!SITES.has(host)) return new Response('Not found', { status: 404 });
    const pre = '/_s/' + host;
    if (u.pathname.endsWith('/index.html')) { const ip = '/' + u.pathname.slice(0, -10).replace(/^[\/\\]+/, ''); return new Response(null, { status: 301, headers: { location: ip + u.search } }); }
    if (u.pathname.startsWith('/_s/')) return new Response('Not found', { status: 404 });
    if (u.pathname === '/api/geo') { const c = req.cf || {}; return Response.json({ country: c.country || null, city: c.city || null, lat: c.latitude ? +c.latitude : null, lon: c.longitude ? +c.longitude : null }); }
    if (host === 'kolaboro.com' && u.pathname === '/__k/ktraffic.js') return new Response(KTRAF, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'no-store' } });
    if (host === 'kolaboro.com' && u.pathname === '/__k/kbrh.js') return new Response(KBRH, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=600' } });
    if (host === 'realhunt.co' && u.pathname === '/__k/kcheck.js') return new Response(KCHECK, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=600' } });
    // rh-static-v1: home data comes from the source repo (Pages project realhunt-top, refreshed by the daily data job); falls back to the published copy.
    if (host === 'realhunt.co' && req.method === 'GET' && u.pathname === '/data/rh-static.json') { try { const t = await fetch('https://realhunt-top.pages.dev/data/rh-static.json', { cf: { cacheEverything: true, cacheTtl: 60 } }); if (t.status === 200 && /json/i.test(t.headers.get('content-type') || '')) { const h = new Headers(t.headers); h.set('cache-control', 'public, max-age=60'); h.delete('age'); return new Response(t.body, { status: 200, headers: h }); } } catch (e) {} }
    if (req.method !== 'GET' && req.method !== 'HEAD') return new Response(null, { status: 204 });
    if (host === 'realhunt.co' && /^\/(?:(?:finds|top|og|images)\/.+|og-[\w-]+|icon-[\w-]+)\.(?:webp|jpe?g|png)$/i.test(u.pathname)) { const m = await fetch('https://realhunt-media.pages.dev' + u.pathname, { cf: { cacheEverything: true, cacheTtl: 86400 } }); const img = (r) => r.status === 200 && /^image\//i.test(r.headers.get('content-type') || ''); const ok = (r) => { const h = new Headers(r.headers); h.set('cache-control', 'public, max-age=86400'); return new Response(r.body, { status: 200, headers: h }); }; if (img(m)) return ok(m); /* v2-src-media: images missing from realhunt-media come from the source repo's public/ folder (Pages project realhunt-top) */ const t = await fetch('https://realhunt-top.pages.dev' + u.pathname, { cf: { cacheEverything: true, cacheTtl: 86400 } }); if (img(t)) return ok(t); if (u.pathname.startsWith('/top/')) { const t2 = await fetch('https://realhunt-top.pages.dev' + u.pathname.slice(4), { cf: { cacheEverything: true, cacheTtl: 86400 } }); if (img(t2)) return ok(t2); } }
    if (host === 'realhunt.co') return rhMedia(req, u); // rh-media-v1 (rollback: delete this line)
    if (u.search) { for (const k of ['p', 'page_id', 'paged', 'cat', 'tag']) { const v = u.searchParams.get(k); if (v && /^[\w-]+$/.test(v)) { const q = await env.ASSETS.fetch(new Request(new URL(pre + '/__q/' + k + '=' + v + '/', u), req)); if (q.status === 200) return q; } } }
    // realhunt.co: one URL per page, without the trailing slash, matching the canonical tags. "/about/" sends a 301 to
    // "/about", and "/about" is served from the about/index.html file directly instead of redirecting to the folder.
    if (host === 'realhunt.co' && u.pathname.length > 1 && u.pathname.endsWith('/')) {
      return new Response(null, { status: 301, headers: { location: '/' + u.pathname.replace(/\/+$/, '').replace(/^[\/\\]+/, '') + u.search } });
    }
    let r = await env.ASSETS.fetch(new Request(new URL(pre + u.pathname + u.search, u), req));
    if (host === 'kolaboro.com' && r.status === 404 && u.pathname.startsWith('/changelog/2')) { try { const p = await kbChangeDay(env, u, pre); if (p) r = p; } catch (e) {} }   // kpack: dated changelog pages from one file
    // kb-sat-pack-v1: kolaboro.com satellite images missing as single files are served from their pack (see kbsat.js; rollback: delete this line)
    if (host === 'kolaboro.com' && u.pathname.startsWith('/k/sat/') && (r.status === 404 || u.searchParams.get('__pack') === '1')) { try { if (!ksat) ksat = await import('./kbsat.js'); const p = await ksat.serve(req, u, env, ctx); if (p) r = p; } catch (e) {} }
    if (host === 'realhunt.co' && r.status >= 300 && r.status < 400) {
      const l = new URL(r.headers.get('location') || '', u);
      if (l.pathname === pre + u.pathname + '/') {
        const d = await env.ASSETS.fetch(new Request(new URL(pre + u.pathname + '/' + u.search, u), req));
        if (d.status === 200) r = d;
      }
    }
    if (r.status >= 300 && r.status < 400) {
      const loc = r.headers.get('location') || '';
      const l = new URL(loc, u);
      if (l.pathname.startsWith(pre)) { const h = new Headers(r.headers); h.set('location', l.pathname.slice(pre.length) + l.search); return new Response(null, { status: r.status, headers: h }); }
      return r;
    }
    if (r.status === 404 && NOSPA.has(host)) { const nf = await env.ASSETS.fetch(new Request(new URL(pre + '/404', u), req)); return new Response(nf.status === 200 ? nf.body : 'Not found', { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } }); }
    if (r.status === 404 && !/\.[a-z0-9]{2,5}$/i.test(u.pathname)) {
      const s = await env.ASSETS.fetch(new Request(new URL(pre + '/', u), req));
      // realhunt.co: a path with no prerendered page (an account screen, a home added after the last build, a typo)
      // still loads the app, but must not tell search engines it is the home page.
      if (host === 'realhunt.co') {
        const h = new Headers(s.headers); h.set('x-robots-tag', 'noindex');
        const out = new HTMLRewriter()
          .on('link[rel="canonical"]', { element(e) { e.remove(); } })
          .on('meta[name="robots"]', { element(e) { e.setAttribute('content', 'noindex, follow'); } })
          .on('meta[property="og:url"]', { element(e) { e.setAttribute('content', 'https://realhunt.co' + u.pathname); } })
          .transform(new Response(s.body, { status: 200, headers: h }));
        return out;
      }
      return new Response(s.body, { status: 200, headers: s.headers });
    }
    return r;
  }
};
