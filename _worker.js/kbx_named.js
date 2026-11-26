// comments: _notes/kolaboro-worker-comments.txt
import { T, LANGS, LOCALE } from './kbx_named_i18n.js';
import { hparse, hdisp, hnote, hkey, coName, mkName, placeName, CO_ISO2 } from './kbx_hdate.js';
import { rpc } from './kolaboro.js';
import { watchBox, searchBox, nf28, feedLinks, W9JS, W9CSS } from './kbx_follow.js';
import { nextStep, NX_CSS, NX_JS, filterBar, KF_CSS, KF_JS, t26 } from './kbx_u26.js';
import { diffRoute, phSummary } from './kbx_named_diff.js';
import { ppmSection, ppmLoad, gleifNet, networkHtml, NET_CSS, NET_JS, familyData, famNet, familyHtml } from './kbx_named_plus.js';
import { satData, satSection, satToc, satHeading, satLine } from './kbx_named_sat.js';
import { fcData, fcProjectHtml, fcDevGroup, rsData, rsDevHtml, rsHeading } from './kbx_fc.js';
import { webData, webProjectHtml, webDevHealthHtml, webDevLinksHtml, webHeading } from './kbx_web.js';
import { watchData, watchDevHtml, watchHeading } from './kbx_watch.js';
import { gazDevHtml, gazHeading } from './kbx_gaz.js';
import { cohortCard, cohortKey } from './kbx_cohort.js';
import { paperData, pricesHtml, planningHtml, paperHeading, PAPER_CSS } from './kbx_paper.js';
import { seeData, seeHtml, seeToc, seeHeading } from './kbx_see.js';
import { filingsData, filingsDevHtml, filingsHeading } from './kbx_filings.js';
import { moneyData, moneyHtml, moneyToc, moneyHeading } from './kbx_money.js';
import { landData, landHtml, histHtml, landToc, landHeading, histToc, histHeading } from './kbx_land.js';
import { pinHtml, priceLink } from './kbx_n30c_named.js';
import { calHtml, CAL_CSS } from './kbx_cal.js';
import { aroundData, aroundPin, aroundSum, aroundHtml, climateHtml, aroundToc, aroundHeading, climateToc, climateHeading } from './kbx_around.js';
import { trProject } from './kbx_tr.js';
import { q as qa, qaTitle, qaDesc, words, QA_CSS, months } from './kbx_named_qa.js';
import { facetsData, projFacets, devFacets, facetT } from './kbx_facets.js';
import { leadMap, leadify, dlLine, devDash } from './kbx_n27lead.js';
import { ctaHtml } from './kbx_n31a.js';
import { secZ, lightHtml, checklistHtml, Z_CSS, U27V, t27 } from './kbx_u27.js';
import { t27 as tt27 } from './kbx_t27_i18n.js';
import { guideLink } from './kbx_buy_i18n.js';
import { knownLine, nrNote, askHtml, closest3, cl3Html, devLate, shareText, tyTable, staticMap, satBa, vsHead, CSS31, t31 } from './kbx_n31d.js';
import { light6 } from './kbx_u27.js';
import { regSale, rsText, rsNoAsk } from './kbx_n31d_rs.js';
import { p29Project, distLine, satHtml29, ppmMedian, ppmOf, medians, companyRegs, regLi, localName, devAnswer, devFilter, DEV_CSS, DEV_JS, t29 } from './kbx_p29.js';
import { slipLine } from './kbx_n30a.js';
import { trustBlock, kindIco, t31 as tb31, loadS as loadS31 } from './kbx_n31b_page.js';
import { pTitle as pTitle33, pDesc as pDesc33, dTitle as dTitle33, dHead as dHead33, ccData as ccData33, t as t33 } from './kbx_n33c.js';
import { load as loadS32, doneLab, isDone } from './kbx_n32s.js';
import { rulesData } from './kbx_rules.js';
import { seoLd } from './kbx_lastmod.js';
import { dldKf, wbLine, wayback as wbData, setLive as aliasLive } from './kbx_n31c.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const RESERVED = new Set(['benchmark', 'reply', 'self-check', 'templates', 'index', 'index.html']);
const CACHE_V = 'named-v158';
export const OPINION_RX = /\b(scam\w*|fraud\w*|ponzi|swindl\w*|rip-?off|avoid\w*|beware|dodgy|shady|crook\w*|estafa\w*|fraude\w*|timo|timador\w*|betrug\w*|betrüg\w*|abzocke\w*|arnaque\w*|escroquer\w*|escroc\w*|oplichting|oplichter\w*|bedrog\w*)\b|мошен|обман|афер|骗局|诈骗|欺诈|احتيال|نصب/i;
let MEMO = {};
const SHARED = (globalThis.__kbJson = globalThis.__kbJson || {}), LOADING = {};
function loadJson(env, name, ttl) {
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
const DUP_OF = { 'VNM-008': 'SGN-002', 'KUA-003': 'MYS-017' };
function cleanName(n) {
return String(n).replace(/\s*\(([^)]*)\)/g, (m, inner) => {
const keep = inner.split(/\s*[;,]\s*/).filter(t => t && !/^not the\b/i.test(t) && !/^listing \d+$/i.test(t));
return keep.length ? ' (' + keep.join(', ') + ')' : '';
}).trim();
}
let IDX = null;
const RAWN = new WeakMap();
let STALE = { t: 0, v: false };
async function staleIsolate(env) {
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
const P = (named.projects || []).filter(x => caseBy.has(x.id) && !COI_MARKETS.has(String(x.mk || '').toLowerCase()));
for (const x of P) if (x.n) { const c = cleanName(x.n); if (c !== x.n) { RAWN.set(x, x.n); x.n = c; } }
const byId = new Map(P.map(x => [x.id, x])), bySlug = new Map(P.map(x => [x.s, x])), devs = new Map(), mk = new Map(), byAr = new Map();
for (const x of P) {
if (x.dvs && !RESERVED.has(x.dvs)) { if (!devs.has(x.dvs)) devs.set(x.dvs, { s: x.dvs, n: x.dv, ids: [] }); devs.get(x.dvs).ids.push(x.id); }
if (x.ar && x.ar !== x.mk) { const a = x.mk + '|' + x.ar; if (!byAr.has(a)) byAr.set(a, []); byAr.get(a).push(x); }
const c = caseBy.get(x.id), m = mk.get(x.mk) || { k: 0, pn: 0, esc: 0 };
m.k++; if (reviewed(c)) m.rv = (m.rv || 0) + 1; if ((c.checks || {}).permit === 2) m.pn++; if ((c.checks || {}).escrow === true) m.esc++; mk.set(x.mk, m);
}
for (const d of devs.values()) { const c = new Map(); for (const id of d.ids) { const v = byId.get(id).dv; if (v) c.set(v, (c.get(v) || 0) + 1); } let b = d.n, bn = 0; for (const [v, k] of c) if (k > bn) { b = v; bn = k; } d.n = b; }
const dmk = new Map(((delay && delay.markets) || []).map(m => [m.market, m]));
aliasLive(named.aliases);
IDX = { named, cases, P, byId, bySlug, devs, caseBy, mk, dmk, byAr, sat: null, prom: (prom && prom.projects) || {}, find: (find && find.projects) || {}, sim: (sim && sim.projects) || {}, updated: cases.updated || named.updated };
return IDX;
}
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const strip = h => String(h).replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const pre = lang => lang === 'en' ? '' : '/' + lang;
const pUrl = (lang, s) => ORIGIN + pre(lang) + '/projects/' + s + '/';
const dUrl = (lang, s) => ORIGIN + pre(lang) + '/developers/' + s + '/';
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const fixU = u => typeof u === 'string' ? u.trim().replace(/ /g, '%20') : u;
const okHttp = u => typeof u === 'string' && /^https?:\/\/[^\s"<>]+$/.test(fixU(u));
const slugM = m => encodeURIComponent(String(m).toLowerCase().replace(/\s+/g, '-'));
const mkHref = (ix, x, lang) => (lang !== 'en' && ((ix.mk.get(x.mk) || {}).k || 0) >= 5 ? pre(lang) : '') + '/m/' + slugM(x.mk) + '/';
const decodeSafe = u => { try { return decodeURIComponent(u); } catch (e) { return u; } };
const PLURAL1 = { g_moved: 'k', pr_moved: 'k', g_d: 'k', mk_line: 'k', a_change_k: 'k' };
function tr(lang, k, v) {
if (v && PLURAL1[k] && +v[PLURAL1[k]] === 1 && T[lang] && T[lang][k + '_1']) k = k + '_1';
const s = (T[lang] && T[lang][k]) || T.en[k] || k;
return v ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m).replace(/(?<!\.)\.\.(?=\s|$)/g, '.') : s;
}
const MON = /^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* (\d{4})$/;
const MI = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
function iso(d) {   // any date we store, to YYYY-MM-DD (or null)
  if (!d) return null; const s = String(d);
  let m = s.match(/^(\d{4}-\d{2}-\d{2})/); if (m) return m[1];
  m = s.match(MON); if (m) return m[3] + '-' + String(MI[m[2]]).padStart(2, '0') + '-' + m[1].padStart(2, '0');
  return null;
}
const dtf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'd' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.DateTimeFormat(L, o)); };
const nmf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'n' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.NumberFormat(L, o)); };
function fd(d, lang) {
if (d == null || d === '') return '';
const s = String(d), L = LOCALE[lang] || 'en-GB';
let m = s.match(/^(\d{4})-(\d{2})$/); if (m) { try { return dtf(L, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+m[1], +m[2] - 1, 1))); } catch (e) { return s; } }
const i = iso(s); if (i) { try { return dtf(L, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(i + 'T00:00:00Z')); } catch (e) { return i; } }
return hdisp(s, lang);
}
const asPub = (raw, lang) => hnote(raw) && (lang !== 'en' || (hparse(raw) || {}).note) && fd(raw, lang) !== String(raw).trim() ? ' <small class="k-muted">(' + esc(tr(lang, 'as_pub')) + ': <q' + (lang === 'en' ? '' : ' lang="en"') + '><bdi>' + esc(String(raw).trim()) + '</bdi></q>)</small>' : '';
const num = (n, lang) => { try { return nmf(LOCALE[lang] || 'en-GB').format(n); } catch (e) { return String(n); } };
const srcA = (u, label) => typeof u === 'string' && (u.startsWith(ORIGIN + '/') || /^\/[a-z]/.test(u)) ? ' <a class="src" href="' + esc(u.replace(ORIGIN, '')) + '">' + esc(label || 'kolaboro.com') + '</a>'
: okHttp(u) ? ' <a class="src" href="' + esc(fixU(u)) + TB.kbx_named__t.k0 + esc(label || host(u)) + '</a>' : '';
const srcLi = (u, many) => { const p = String(u).replace(/^https?:\/\/[^/]+/, '') || '/'; return '<li><a href="' + esc(fixU(u)) + TB.kbx_named__t.k1 + esc(host(u)) + '</a>' + (!many || OPINION_RX.test(decodeSafe(u)) || p === '/' ? '' : ' <small>' + esc(p.length > 80 ? p.slice(0, 80) + '...' : p) + '</small>') + '</li>'; };
const LNX = lang => /^(ar|ru|zh)$/.test(lang) ? ' lang="en"' : '';
const bidi = (lang, html, names) => {
if (!LNX(lang)) return html;
const E = [...new Set(names.filter(n => n && String(n).length > 2 && !/[\u0600-\u06FF]/.test(n)).map(esc))].sort((a, b) => b.length - a.length);
if (!E.length) return html;
const rx = new RegExp(E.map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
return html.split(/(<[^>]*>)/).map((t, i) => i % 2 ? t : t.replace(rx, '<bdi lang="en">$&</bdi>')).join('');
};
const own = (path, label) => '<a href="' + esc(path) + '">' + esc(label) + '</a>';
const en = t => '<span lang="en" dir="ltr">' + esc(t) + '</span>';
const fact = (inner, u, label) => '<li class="kfact">' + inner + srcA(u, label) + '</li>';
const sec = (id, h, inner) => '<section class="ks" id="' + id + '"><h2>' + h + '</h2>' + inner + '</section>';
const stageKey = s => s === 'off-plan' ? 'st_offplan' : s === 'under construction' ? 'st_construction' : s === 'completed' ? 'st_completed' : 'st_unknown';
const cleanOk = t => t && !OPINION_RX.test(t);
const SEQ = ['permit', 'escrow', 'progress', 'plans', 'record', 'returns_ok'];
const hv = (v, lang) => v === true ? tr(lang, 'yes') : v === false ? tr(lang, 'no') : v == null ? '-' : fd(v, lang);
const reviewed = c => !!(c && c.verified && Object.values(c.verified).some(v => v && v !== 'none'));
const PORTAL_RX = /(^|\.)(propertyfinder|bayut|thepreplan|imovirtual|idealista|fotocasa|rumavi|a1properties|dubizzle|lucasfox|kyero|rightmove|zoopla|realtor|zillow|redfin|ddproperty|hipflat|fazwaz|propertyguru|iproperty|lamudi|dotproperty|99acres|magicbricks|sahibinden|hepsiemlak|emlakjet|inmuebles24|vivanuncios|encuentra24|point2homes|jamesedition|sothebysrealty|knightfrank|savills|cbre|jll|engelvoelkers|remax|century21|coldwellbanker|eurovilla|suprimmo|benoit|terra|regent|luxinmo|tranio|prian|realting|ziprealty|propertyfinder|realtyna|thailand-property|homify|offplan|uaepropertychecker|dubairealestateiq|joshsteinrealtor|malaysiaproperty4u|newhomes|properstar|green-acres|immobilienscout24|immowelt|funda|seloger|leboncoin|logic-immo|bienici|casa|immobiliare|tecnocasa|engel)\./i;
const isListing = u => { const h = host(u); return !!h && PORTAL_RX.test('.' + h); };
const HO_ADJ = new WeakMap();
const hstart = d => { const P = hparse(d); if (!P) return null; const v = P.a; const m = v.m || (v.q ? v.q * 3 - 2 : v.h ? v.h * 6 - 5 : v.p ? { b: 1, m: 4, l: 9, e: 10 }[v.p] : v.s ? { sp: 3, su: 6, au: 9, wi: 12 }[v.s] : 1); return v.y + '-' + String(m).padStart(2, '0'); };
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
const srcKindHtml = (u, x, lang) => { const k = srcKind(u, x); return k < 0 ? '' : '<br>' + kindIco(k, lang); };
function handoverOf(ix, x) {
const pr = ix.prom[x.id] || [], h = pr.find(p => p.k === 'handover');
if (h) {
let A = HO_ADJ.get(h);
if (A === undefined) {
A = null; const k0 = hkey(h.d);
if (k0) {
let best = null, bk = k0;
const seen0 = ((h.hist || []).find(e => e && e.d === h.d) || {}).seen || '', mi = k => { const [y, m] = k.split('-').map(Number); return y * 12 + m; };
for (const d of [...(h.hist || []).filter(e => e && e.seen >= seen0).map(e => e.d), h.rd, (x.fx || {}).handover_promised]) { const k = d && hkey(d), s0 = d && hstart(d); if (k && s0 && (mi(s0) >= mi(k0) + 3 || (/^\d{4}$/.test(String(h.d).trim()) && /^\d{4}$/.test(String(d).trim()) && +d > +h.d)) && k > bk) { bk = k; best = d; } }
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
export function overdueOf(ix, x, now) {
const ho = handoverOf(ix, x); if (!ho) return null;
const c = ix.caseBy.get(x.id) || {}, st = c.stage || x.st;
if (st === 'completed' || (ho.p && ho.p.st === 'kept')) return null;
const k = hkey(ho.d); if (!k) return null;
const d = now || new Date(), [y, m] = k.split('-').map(Number), n = d.getUTCFullYear() * 12 + d.getUTCMonth() + 1 - (y * 12 + m);
return n >= 1 ? { m: n, d: ho.d, end: k, st } : null;
}
const OVM = new WeakMap();
export function overdueByMarket(ix) { let M = OVM.get(ix); if (!M) { M = new Map(); for (const x of ix.P) if (overdueOf(ix, x)) M.set(x.mk, (M.get(x.mk) || 0) + 1); OVM.set(ix, M); } return M; }
export const OV_MIN = 2;
function lastmod(ix, x) {
const c = ix.caseBy.get(x.id) || {}, f = ix.find[x.id] || {};
const ds = [iso(c.checked), iso(f.checked), iso(x.sealed), iso((c.fp || {}).date)].filter(Boolean).sort();
return ds.length ? ds[ds.length - 1] : (iso(ix.updated) || new Date().toISOString().slice(0, 10));
}
const CO_HUB = { 'Puerto Rico (USA)': 'Puerto Rico', 'St Lucia': 'Saint Lucia' };
const dot = t => String(t).replace(/\.\.(?=\s|$)/g, '.');
const slugA = s => String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const ymFmt = (ym, lang) => fd(ym, lang);
function projImages(x, lang, canon, sat) {
const out = [{ '@id': canon + '#og', url: ORIGIN + '/og/projects/' + x.s + '.png', contentUrl: ORIGIN + '/og/projects/' + x.s + '.png', width: 1200, height: 630, caption: tr(lang, 'og_alt', { n: x.n }), name: tr(lang, 'og_alt', { n: x.n }) }];
const r = sat && sat.projects && sat.projects[x.id];
if (r && r.frames && r.v && r.m0 && r.n) {
const [y, m] = r.m0.split('-').map(Number), e = new Date(Date.UTC(y, m - 1 + r.n - 1, 1)), last = e.getUTCFullYear() + '-' + String(e.getUTCMonth() + 1).padStart(2, '0');
const cap = tr(lang, 'img_sat', { n: x.n + (x.mk ? ' (' + mkName(x.mk, lang) + ')' : ''), a: ymFmt(r.m0, lang), b: ymFmt(last, lang) }), u = ORIGIN + '/k/sat/proj/' + encodeURIComponent(x.id) + '.jpg?v=' + encodeURIComponent(r.v);
out.push({ '@id': canon + '#sat', url: u, contentUrl: u, caption: cap, name: cap, creditText: TB.kbx_named__t.k2, license: TB.kbx_named__t.k3, acquireLicensePage: ORIGIN + '/satellite/',
copyrightNotice: TB.kbx_named__t.k4 + r.m0.slice(0, 4) + '-' + last.slice(0, 4), creator: { '@id': ORIGIN + '/#org' }, isBasedOn: TB.kbx_named__t.k5, encodingFormat: 'image/jpeg' });
}
return out;
}
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
export function leastHtml(ix, lang, n, seed) {
const L = leastLinked(ix, n, seed), T = TB.kbx_named__t.o_LLH[lang] || TB.kbx_named__t.o_LLH.en, b = s => lang === 'ar' ? '<bdi>' + esc(s) + '</bdi>' : esc(s);
if (!L.length) return '';
return TB.kbx_named__t.k6 + (lang === 'ar' ? ' dir="rtl"' : '') + '><div class="wrap"><h2>' + esc(T[0]) + '</h2><p class="kll-s">' + esc(T[1]) + '</p><ul class="kll-l">' +
L.map(({ x }) => '<li><a href="' + pre(lang) + '/projects/' + x.s + '/">' + b(x.n) + '</a> <small>' + b(mkName(x.mk, lang)) + '</small></li>').join('') + '</ul></div></section>';
}
const LLR = new Map();
export function leastReady(env, ctx, lang) {
if (IDX) { const k = lang + '|' + iso(IDX.updated) + '|' + IDX.P.length; let h = LLR.get(k); if (!h) { h = LL_CSS + leastHtml(IDX, lang, 12, iso(IDX.updated) + lang); if (LLR.size > 40) LLR.clear(); LLR.set(k, h); } return h; }
try { const p = data(env).catch(() => null); if (ctx && ctx.waitUntil) ctx.waitUntil(p); } catch (e) {}
return '';
}
export const LL_CSS = '<style>.kll{padding:28px 0;border-top:1px solid var(--line)}.kll h2{font-size:1.25rem;margin:0 0 4px}.kll-s{color:var(--muted);margin:0 0 12px}.kll-l{columns:3 220px;padding-inline-start:18px;margin:0}.kll-l li{margin:0 0 8px;break-inside:avoid}.kll-l small{color:var(--muted)}@media (max-width:600px),(pointer:coarse){.kll-l li{margin:0}.kll-l a{display:inline-block;padding:12px 0;min-height:44px;box-sizing:border-box}}</style>';
function qaSentences(ix, x, lang, tp, o) {
const c = ix.caseBy.get(x.id) || {}, cl = c.claims || { verified: 0, unverified: 0, contradicted: 0 }, cN = (cl.verified || 0) + (cl.unverified || 0) + (cl.contradicted || 0), rvd = reviewed(c);
const ho = handoverOf(ix, x), hand = ho && ho.p ? ho.p : (ix.prom[x.id] || []).find(p => p.k === 'handover'), name = x.n, checked = (o && o.checked) || lastmod(ix, x), rvN = o ? o.rvN : undefined;
const place0 = [x.ar, x.mk !== x.ar ? x.mk : null, x.co !== x.mk ? x.co : null].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', '), place2 = [x.mk, x.co !== x.mk ? x.co : null].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', ');
const coL = (lg, p) => placeName(p, lg);
const rk = tp ? (tp.ranks.find(r => r.ranked) || null) : null, ovq = overdueOf(ix, x);
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
function faq33(FAQ, lang) { const G = new Set(['a_rev', 'a_drev', 'a_dreg_err'].map(k => dot(tr(lang, k)))); return FAQ.filter(f => !f[3] && f[1] && !G.has(f[1])); }
function projectPage(ix, x, lang, extra) {
const sec = secZ;
const c = ix.caseBy.get(x.id), ck = c.checks || {}, vf = c.verified || {}, cl = c.claims || { verified: 0, unverified: 0, contradicted: 0 };
const name = x.n, place = placeName([x.ar, x.mk !== x.ar ? x.mk : null, x.co !== x.mk ? x.co : null].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', '), lang);
const stage = tr(lang, stageKey(c.stage || x.st)), ho = handoverOf(ix, x), checked = lastmod(ix, x);
const page = x.url, pr = (ix.prom[x.id] || []).slice(0, 12).map(p => p.k === 'handover' && handoverOf(ix, x) && handoverOf(ix, x).p && handoverOf(ix, x).p.ph ? handoverOf(ix, x).p : p), hand = pr.find(p => p.k === 'handover');
const ov = overdueOf(ix, x), ovN = ov ? ov.m : 0;
const cN = cl.verified + cl.unverified + cl.contradicted, rvd = reviewed(c), nrB = tr(lang, 'nr_badge', { d: fd(x.ad || c.checked, lang) });
const canon = pUrl(lang, x.s), devPage = x.dvs && ix.devs.has(x.dvs) ? dUrl(lang, x.dvs) : null, rec = '/api/open/projects/' + encodeURIComponent(x.id);
const rv = extra.reviews || { approved_total: 0, reports: [] }, rvN = rv.approved_total || 0;
const dv0 = { n: name, place, stage, by: x.dv ? tr(lang, 'by_dev', { dev: x.dv }) : '', h: ho ? fd(ho.d, lang) : tr(lang, 'v_none'), pn: x.pn ? tr(lang, 'v_pub') : tr(lang, 'v_notpub'), c: cN, v: cl.verified, r: rvN ? num(rvN, lang) : tr(lang, 'r_none'), d: fd(checked, lang) };
const tp = extra.trp || null, rk = tp ? (tp.ranks.find(r => r.ranked) || null) : null, tpS = tp ? num(tp.score, lang) : null;
const place2 = placeName([x.mk, x.co !== x.mk ? x.co : null].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', '), lang), bdq = t => bidi(lang, esc(t), [name]);
const nfL = v => num(v, lang), yNow = new Date().getUTCFullYear();
const dn33 = isDone(x, c) ? doneLab(lang) : null;
const title = pTitle33(lang, { n: name, y: yNow, h: ho ? fd(ho.d, lang) : null, hy: ho ? ((/(20\d\d)/.exec(String(ho.d)) || [])[1] || null) : null, pn: !!x.pn, ov: ovN, mm: ovN ? months(lang, ovN, lang === 'ar' ? 'gen' : 'nom', nfL) : '', dn: dn33 && dn33[0] ? dn33 : null }, qa) || qaTitle(lang, { n: name, h: ho ? fd(ho.d, lang) : null, pn: !!x.pn, dv: x.dv, y: yNow, ov: ovN, nf: nfL, dn: dn33 });
const fx33 = x.fx || {}, rs33 = regSale(x), pr33 = fx33.price_min > 0 && !rs33 ? (fx33.currency ? fx33.currency + ' ' : '') + num(fx33.price_min, lang) : null;
const desc = dot(pDesc33(lang, { n: name, by: dv0.by, place, place2, h: ho ? fd(ho.d, lang) : null, pn: !!x.pn, ov: ovN, mmD: ovN ? months(lang, ovN, lang === 'de' ? 'dat' : 'nom', nfL) : '', mv: hand && hand.mv ? hand.mv : 0, nf: nfL,
price: pr33, readD: fd(x.sealed || x.ad || checked, lang), plan: !!(fx33.payment_plan || fx33.deposit_pct), d: fd(checked, lang) }, qa) || qaDesc(lang, { n: name, by: dv0.by, place, place2, h: ho ? fd(ho.d, lang) : null, pn: !!x.pn, s: tp ? tpS : null, rv: rvd, d: fd(checked, lang), ov: ovN, mv: hand && hand.mv ? hand.mv : 0, nf: nfL }));
const g = [];
g.push(fact(esc(x.dv ? tr(lang, 'g_listed_dev', { n: name, stage, place, dev: x.dv }) : tr(lang, 'g_listed', { n: name, stage, place })), page));
g.push(fact(esc(ho ? tr(lang, 'g_h', { h: fd(ho.d, lang) }) : tr(lang, 'g_h_none')), page));
if (ovN) g.push(fact(esc(tr(lang, 'g_over2', { m: ovN })), '/promises/', tr(lang, 'm_promises')));
else if (hand && hand.mv) g.push(fact(esc(tr(lang, 'g_moved', { k: hand.mv, mm: hand.mm })), '/promises/', tr(lang, 'm_promises')));
g.push(fact(esc(x.pn ? tr(lang, 'g_pn') : tr(lang, 'g_pn_none')), x.du || page));
if (cN && rvd) g.push(fact(esc(tr(lang, 'g_claims', { c: cN, v: cl.verified, u: cl.unverified, x: cl.contradicted })), rec, tr(lang, 'k_record')));
const kf = (k, v, src) => '<div class="kf"><dt>' + esc(tr(lang, k)) + '</dt><dd>' + v + (src ? srcA(src) : '') + '</dd></div>';
const keys = '<dl class="kfs">' +
kf('k_dev', x.dv ? (devPage ? own(devPage.replace(ORIGIN, ''), x.dv) : esc(x.dv)) : esc(tr(lang, 'v_dev_none')), x.dv ? page : null) +
kf('k_loc', esc(place), null) + kf('k_stage', esc(stage) + (x.sts ? ' · ' + en(x.sts) : ''), page) +
kf('k_hand', ho ? esc(fd(ho.d, lang)) : esc(tr(lang, 'v_none')), ho ? page : null) +
kf('k_permit', x.pn ? en(x.pn) : esc(tr(lang, 'v_notpub')), x.pn ? (x.du || page) : null) + dldKf(x, lang) +
(rvd ? '' : TB.kbx_named__t.k7 + esc(nrB) + '</dd></div>') +
kf('k_escrow', !rvd ? esc(tr(lang, 'nr_short')) : ck.escrow === true ? esc(tr(lang, 'v_stated')) : ck.escrow === false ? esc(tr(lang, 'v_notstated')) : esc(tr(lang, 'not_researched')), rvd && ck.escrow != null ? page : null) +
(okHttp(page) ? kf('k_page', esc(host(page)) + (isListing(page) ? '<br><small>' + esc(tr(lang, 'v_listing')) + '</small>' : ''), page) : '') +
kf('k_checked', esc(fd(checked, lang)), null) +
kf('k_record', own(rec, x.id), null) + '</dl>';
const FX = extra.fac ? projFacets(extra.fac, ix, x, lang, { ph: extra.ph, paper: extra.paper, checked }) : null;
const fx = x.fx || {}, F = [];
const cur = fx.currency ? fx.currency + ' ' : '';
const RS = regSale(x);
if (fx.price_min && !RS) F.push([tr(lang, 'f_price'), cur + num(fx.price_min, lang) + (fx.price_max ? ' - ' + num(fx.price_max, lang) : '')]);
for (const [k, l] of [['service_charge', 'f_service'], ['brand', 'f_brand'], ['permit_authority', 'f_auth']]) if (fx[k]) F.push([tr(lang, l), String(fx[k])]);
if (fx.construction_start) F.push([tr(lang, 'f_start'), fd(fx.construction_start, lang), esc(fd(fx.construction_start, lang)) + asPub(fx.construction_start, lang)]);
if (fx.handover_promised) F.push([tr(lang, 'f_hand'), fd(fx.handover_promised, lang), esc(fd(fx.handover_promised, lang)) + asPub(fx.handover_promised, lang)]);
if (fx.original_handover && fx.original_handover !== fx.handover_promised) F.push([tr(lang, 'f_orig'), fd(fx.original_handover, lang), esc(fd(fx.original_handover, lang)) + asPub(fx.original_handover, lang)]);
const readD = fd(x.sealed || x.ad || checked, lang);
const costTop = fact(esc(qa(lang, 'c_read', { d: readD })), page) + (fx.price_min && !RS ? '' : '<li>' + esc(RS ? rsNoAsk(lang) : qa(lang, 'c_price0')) + '</li>' + (RS ? fact(esc(rsText(lang, RS)), RS.src || page) : ''));
const P29 = p29Project(ix, x, lang, c, { tr, qa, fd, cleanOk, coName, page, read: readD, rvd }, Object.assign({}, extra.money || {}, { ru: (extra.money && extra.money.ru) || extra.ru29 || null }));
const clSet = new Set((x.cl || []).filter(r => cleanOk(r[0])).map(r => String(r[0]).trim())), clDup = (x.dl || []).filter(t => cleanOk(t) && clSet.has(String(t).trim())).length;
const promised = '<ul class="fl">' + costTop +
F.filter(f => cleanOk(f[1])).map(f => fact('<b>' + esc(f[0]) + ':</b> ' + (f[2] != null ? f[2] : en(f[1])), page)).join('') +
(x.dl || []).filter(t => cleanOk(t) && !clSet.has(String(t).trim())).map(t => fact(en(t), x.du || page)).join('') + (clDup ? '<li><a href="#claims">' + esc(t31(lang, clDup === 1 && ['en', 'es', 'fr', 'de', 'nl', 'ru'].includes(lang) ? 'stmt1' : 'stmt', { k: num(clDup, lang), h: tr(lang, 's_claims') })) + '</a></li>' : '') + '</ul>';
const prLi = pr.map(p => {
const st = tr(lang, 'ps_' + p.st), kd = tr(lang, 'pk_' + p.k);
const src = p.src === 'page' && p.sha ? tr(lang, 'pr_src_page', { d: fd(p.seen, lang), h: p.sha }) : tr(lang, 'pr_src_research', { d: fd(p.seen, lang) });
const hist = (p.hist || []).filter(h => h.d && h.d !== p.d).map(h => esc(fd(h.d, lang)) + ' (' + esc(fd(h.seen, lang)) + ')');
return fact('<b>' + esc(kd) + ': ' + esc(fd(p.d, lang)) + '</b> <span class="kpill p-' + esc(p.st) + '">' + esc(st) + '</span>' + (p.mv ? ' · ' + esc(tr(lang, 'pr_moved', { k: p.mv, mm: p.mm })) : '') +
'<br><small>' + esc(src) + (hist.length ? ' · ' + esc(tr(lang, 'pr_hist')) + ': ' + hist.join(', ') : '') + '</small>', page);
}).join('');
const h0 = hand && ((hand.hist || []).find(h => h && h.d) || null);
const whenTop = ho ? fact(esc(hand && hand.mv ? qa(lang, 'w_sum', { h: fd(ho.d, lang), a: fd(h0 && h0.d !== ho.d ? h0.d : (fx.original_handover || ho.d), lang), k: num(hand.mv, lang) }) : qa(lang, 'w_sum0', { h: fd(ho.d, lang) })), hand ? '/promises/' : page, hand ? tr(lang, 'm_promises') : undefined) : '<li>' + esc(qa(lang, 'w_none')) + '</li>';
const delivery = '<p class="ki">' + tr(lang, 'del_intro', { link: own('/promises/', tr(lang, 'm_promises')) }) + '</p><ul class="fl">' + whenTop + (prLi || '<li>' + esc(tr(lang, 'no_promises')) + '</li>') +
(ovN ? fact(esc(tr(lang, 'over_line', { m: ovN })), '/promises/', tr(lang, 'm_promises')) : '') +
(c.delay ? fact(esc(tr(lang, 'delay_line', { m: c.delay })), page) : '') + '</ul>' + (extra.fc ? fcProjectHtml(extra.fc, x, lang, extra.fdg) : '')
+ (h => h ? '<style id="kcal-css">' + CAL_CSS + '</style>' + h : '')(calHtml(x, ix.prom[x.id], lang, k => tr(lang, 'pk_' + k), d => fd(d, lang)));
const webHtml = extra.web ? webProjectHtml(extra.web, x, lang) : '';
const seeSec = extra.see ? seeHtml(extra.see, x.id, lang, d => fd(d, lang), name) : '';
const satHtml = extra.sat ? satSection(extra.sat, x.id, ix.prom[x.id] || [], fx, lang, d => fd(d, lang), k => tr(lang, 'pk_' + k), d => tr(lang, 'sat_tile', { n: name + (x.mk ? ' (' + mkName(x.mk, lang) + ')' : ''), d })) : '';
const rw = x.rw, lk = { url: page || '', q: name, country: TB.kbx_named__t.o_COUNTRY_ISO[x.co] || '', permit: x.pn && x.pn.length <= 40 ? x.pn : '', company: x.dv || '', ai: '0' };
const permits = '<ul class="fl">' + (x.pn ? fact(esc(tr(lang, 'permit_pn', { pn: '%%PN%%' })).replace('%%PN%%', en(x.pn)), x.du || page) : '<li>' + esc(tr(lang, 'permit_none')) + '</li>') +
(x.ev && x.ev.permit && cleanOk(x.ev.permit) ? fact(en(x.ev.permit), x.du || page) : '') +
(rw ? fact(esc(tr(lang, 'rw_line', { reg: rw.register, item: rw.item, st: rw.status, det: rw.detail ? ', ' + rw.detail : '', d: fd(rw.checked, lang) })), '/registers/', 'kolaboro.com/registers') : '') +
(c.register && !rw ? fact(esc(tr(lang, 'rw_line', { reg: c.register.register, item: c.register.item, st: c.register.status, det: '', d: fd(c.register.checked, lang) })), '/registers/', 'kolaboro.com/registers') : '') + (FX ? FX.reg : '') + '</ul>' +
'<div class="klive" data-lk="' + esc(JSON.stringify(lk)) + '"><h3>' + esc(tr(lang, 'live_h')) + '</h3><p class="ki">' + esc(tr(lang, 'live_note')) + TB.kbx_named__t.k8 + esc(tr(lang, 'live_btn')) + TB.kbx_named__t.k9;
const rows = SEQ.map(k => {
const researched = (ck.researched || []).includes(k), val = ck[k];
const pub = k === 'permit' ? val === 2 : k === 'progress' ? val != null : val === true;
const lvl = vf[k] ? tr(lang, 'l_' + vf[k]) : '';
const evd = x.ev && x.ev[k] && cleanOk(x.ev[k]) ? en(x.ev[k]) + srcA(x.du || page) : '';
return '<tr><th scope="row">' + esc(tr(lang, 'c_' + k)) + '</th><td>' + esc(researched ? tr(lang, pub ? 'yes' : 'no') : tr(lang, 'not_researched')) + '</td><td>' + esc(lvl) + '</td><td>' + evd + '</td></tr>';
}).join('');
const checks = !rvd ? '<p class="knote">' + esc(nrB) + '. ' + esc(tr(lang, 'nr_txt')) + '</p>' : '<p class="ki">' + tr(lang, 'checks_intro', { link: own('/how-we-score/', tr(lang, 'm_method')) }) + TB.kbx_named__t.k10 + esc(tr(lang, 'th_check')) + '</th><th>' + esc(tr(lang, 'th_public')) + '</th><th>' + esc(tr(lang, 'th_level')) + '</th><th>' + esc(tr(lang, 'th_evidence')) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
const CL = (x.cl || []).filter(r => cleanOk(r[0]));
const rvwP = x.rvw && x.rvw.ok && x.rvw.d ? '<p class="ki">' + esc((TB.kbx_named__t.o_RVW_L[lang] || TB.kbx_named__t.o_RVW_L.en).replace('{d}', fd(x.rvw.d, lang))) + '</p>' : '';
const claims = rvwP + (CL.length ? TB.kbx_named__t.k11 + vsHead(lang) + '</thead><tbody>' +
CL.map(r => '<tr class="kfact"><td>' + en(r[0]) + ' ' + srcA(r[3]) + srcKindHtml(r[3], x, lang) + '</td><td><span class="kpill c-' + esc(r[1]) + '">' + esc(tr(lang, 'cs_' + r[1])) + '</span>' + (r[2] && r[2] !== 'none' ? ' ' + (r[2] === 'independent' || r[2] === 'registry' ? esc(tr(lang, 'by_' + r[2])) : en(r[2])) : '') + '</td></tr>').join('') + '</tbody></table></div>' : '<p>' + esc(tr(lang, 'no_hist')) + '</p>');
const H = [];
for (const h of c.history || []) H.push([h.d, fact(esc(fd(h.d, lang)) + ': ' + esc(tr(lang, 'hist_row', { f: tr(lang, TB.kbx_named__t.o_HF[h.f] || 'hf_units'), a: hv(h.from, lang), b: hv(h.to, lang) })), page)]);
const fdx = ix.find[x.id];
for (const f of ((fdx && fdx.f) || []).slice(0, 8)) { const t = String(f.text || '').replace(/^[A-Z]{2,5}-\d{3,4}\s*·\s*/, ''); if (cleanOk(t)) H.push([iso(f.at), fact(esc(fd(f.at, lang)) + ' · ' + esc(tr(lang, 'hist_hourly')) + ': ' + en(t) + (f.fp ? ' <small>(SHA-256 ' + esc(f.fp) + '...)</small>' : ''), page)]); }
H.sort((a, b) => String(b[0]).localeCompare(String(a[0])));
const fpd = x.sha || (c.fp || {}).sha256;
const ph = extra.ph, chg = pre(lang) + '/projects/' + x.s + '/changes/';
const phLine = ph && ph.n ? fact(esc(ph.n > 1 ? tr(lang, 'ph_line', { n: ph.n, a: fd(ph.first, lang), b: fd(ph.last, lang), c: ph.changed }) : tr(lang, 'ph_one', { a: fd(ph.first, lang) })) + ' <a class="more" href="' + chg + '">' + esc(tr(lang, ph.n > 1 ? 'ph_link' : 'ph_link1')) + '</a>', chg, tr(lang, 'ph_src')) : '';
const chMerge = !!(extra.fac && !H.length);
const history = (chMerge ? '%%CHM%%' : '') + '<ul class="fl">' + phLine + (H.map(h => h[1]).join('') || (phLine || chMerge ? '' : '<li>' + esc(tr(lang, 'no_hist')) + '</li>')) +
(fpd ? fact(tr(lang, 'fp_line', { d: esc(fd(x.sealed || (c.fp || {}).date, lang)), h: '<code title="' + esc(fpd) + '">' + esc(fpd.slice(0, 16)) + '\u2026</code>', link: own('/verify/', tr(lang, 'm_verify')) }), '/verify/', 'kolaboro.com/verify') : '') +
(c.sat ? fact(esc(tr(lang, 'sat_line', { d: fd(c.sat.date, lang), st: tr(lang, c.sat.status === 'visible change' ? 'sat_visible' : 'sat_none'), pct: c.sat.changed_pct })), '/satellite/', 'kolaboro.com/satellite') : '') + '</ul>';
const FL = x.fl || [];
const reports = '<p class="ki">' + esc(tr(lang, 'rep_intro')) + '</p><ul class="fl">' + (FL.map(f => fact(esc(tr(lang, 'rc_' + f[0])), f[1])).join('') || '<li>' + esc(tr(lang, 'no_reports')) + '</li>') + '</ul>';
const DF = [['developer_founded', 'df_founded'], ['developer_hq', 'df_hq'], ['developer_company', 'df_company'], ['developer_projects_delivered', 'df_delivered'], ['developer_units_delivered', 'df_units'], ['listed_or_audited', 'df_listed']];
const others = devPage ? ix.devs.get(x.dvs).ids.filter(i => i !== x.id).map(i => ix.byId.get(i)).filter(Boolean).sort((a, b) => (b.mk === x.mk) - (a.mk === x.mk)).slice(0, 12) : [];
const othSame = others.filter(o => o.mk === x.mk), othElse = others.filter(o => o.mk !== x.mk);
const cRegs = extra.fac ? companyRegs(extra.fac.REG, x) : [];
const devN = devPage ? ix.devs.get(x.dvs).ids.length : 0;
const devPr = devN > 1 ? ix.devs.get(x.dvs).ids.flatMap(i => ix.prom[i] || []) : [], devRec = devPr.length ? tr(lang, 'g_d_rec', { p: devPr.length, kept: devPr.filter(p => p.st === 'kept').length, broken: devPr.filter(p => p.st === 'broken').length, moved: devPr.filter(p => p.st === 'moved').length, pending: devPr.filter(p => p.st === 'pending').length }) : '';
const devsec = x.dv ? '<ul class="fl">' + fact(esc(qa(lang, 'who_l', { n: name, dev: x.dv })) + (devN > 1 ? ' ' + esc(qa(lang, 'who_k', { dev: x.dv, k: num(devN, lang) })) : ''), page) + (devRec ? fact(esc(devRec), '/promises/', tr(lang, 'm_promises')) : '') + DF.filter(([k]) => fx[k] != null && cleanOk(String(fx[k]))).map(([k, l]) => fact('<b>' + esc(tr(lang, l)) + ':</b> ' + en(String(fx[k])), page)).join('') +
(x.ev && x.ev.record && cleanOk(x.ev.record) ? fact(en(x.ev.record), page) : '') + (FX ? FX.active + FX.dom : '') + devLate(lang, ix, x, overdueOf, devPage ? devPage.replace(ORIGIN, '') : '') + cRegs.slice(0, 2).map(r => regLi(lang, r, mkName(r.market === x.mk ? x.mk : x.co, lang) || r.market)).join('') + '</ul>' +
(othSame.length ? '<h3>' + esc(t29(lang, 'sd_h', { dev: x.dv, mk: mkName(x.mk, lang) })) + '</h3><ul class="lk">' + othSame.map(o => '<li><a href="' + pre(lang) + '/projects/' + o.s + '/">' + esc(o.n) + '</a>' + (o.ar && o.ar !== o.mk ? ' <small>' + esc(o.ar) + '</small>' : '') + '</li>').join('') + '</ul>' : '') +
(othElse.length ? '<h3>' + esc(tr(lang, 'dev_other', { dev: x.dv })) + '</h3><ul class="lk">' + othElse.map(o => '<li><a href="' + pre(lang) + '/projects/' + o.s + '/">' + esc(o.n) + '</a> <small>' + esc(mkName(o.mk, lang)) + '</small></li>').join('') + '</ul>' : '') +
(devPage ? '<p><a class="more" href="' + devPage.replace(ORIGIN, '') + '">' + esc(tr(lang, 'dev_link', { dev: x.dv })) + '</a>' + (devN > 1 && extra.fac ? ' <a class="more" href="' + devPage.replace(ORIGIN, '') + '#promised">' + esc(t29(lang, 'drec', { dev: x.dv })) + '</a>' : '') + '</p>' : '') : '<p>' + esc(tr(lang, 'dev_none')) + '</p>';
const SM = (ix.sim[x.id] || []).map(r => ix.byId.get(r[0])).filter(Boolean).slice(0, 5);
const similar = SM.length ? '<ul class="lk">' + SM.map(o => '<li><a href="' + pre(lang) + '/projects/' + o.s + '/">' + esc(o.n) + '</a> <small>' + esc(mkName(o.mk, lang)) + ' · ' + esc(tr(lang, stageKey((ix.caseBy.get(o.id) || {}).stage))) + '</small></li>').join('') + '</ul>' : '';
const ms = ix.mk.get(x.mk), dm = ix.dmk.get(x.mk);
const market = '<ul class="fl">' + fact(esc(tr(lang, 'mk_line', { k: ms.k, mk: mkName(x.mk, lang), pp: Math.round(ms.pn / ms.k * 100), pe: Math.round(ms.esc / ms.k * 100) })), mkHref(ix, x, lang), 'kolaboro.com' + mkHref(ix, x, lang)) +
slipLine(ix, x, lang, handoverOf, fd) + (FX ? FX.delay : '') + '</ul>' +
'<p><a class="more" href="/m/' + slugM(x.mk) + '/">' + esc(tr(lang, 'mk_link', { mk: x.mk })) + '</a></p>' +
((ms.rv || 0) >= 8 && iso(ix.updated) ? '<p><a class="more" href="' + pre(lang) + '/stories/' + iso(ix.updated).slice(0, 7) + '/' + slugA(x.mk) + '/">' + esc(tr(lang, 'rel_story', { mk: x.mk, mo: fd(iso(ix.updated).slice(0, 7), lang) })) + '</a></p>' : '');
const DR0 = (extra.replies || []).filter(r => r && r.reply), repRx = /^\s*About buyer report #(\d+)\b[:.]?\s*/i, byRep = new Map();
for (const r of DR0) { const mm = repRx.exec(String(r.reply)); if (mm && !byRep.has(mm[1])) byRep.set(mm[1], r); }
const repReply = r => { const d = r.ref != null ? byRep.get(String(r.ref)) : null;
return d ? '<div class="kreply kr-rep"><p><b>' + esc(tt27(lang, 'np_dr_h')) + '</b> <small>' + esc(fd(d.approved, lang)) + (d.official && d.domain ? ' &middot; ' + esc(tr(lang, 'dr_badge', { d: d.domain })) : '') + TB.kbx_named__t.k12 + esc(String(d.reply).replace(repRx, '')) + '</p></div>'
: '<p class="ki"><small>' + esc(tt27(lang, 'np_dr_none')) + ' <a href="/developers/reply/?id=' + encodeURIComponent(x.id) + (r.ref != null ? '&amp;report=' + encodeURIComponent(r.ref) : '') + '">' + esc(tt27(lang, 'np_dr_b')) + '</a></small></p>'; };
const modL = '<p class="ki"><a href="' + pre(lang) + '/moderation/">' + esc(tt27(lang, 'np_mod')) + '</a></p>';
const reviews = (rv.approved_total ? '<p>' + esc(tr(lang, 'rev_some', { k: rv.approved_total })) + '</p><div class="ugc" data-ugc>' + (rv.reports || []).slice(0, 10).map(r => '<blockquote lang="en">' + esc(r.body || r.text || '') + '</blockquote>' + repReply(r)).join('') + '</div>' : '<p>' + esc(tr(lang, 'rev_none', { n: name })) + '</p>') +
'<p class="ki">' + esc(tr(lang, 'rev_pending')) + TB.kbx_named__t.k13 + encodeURIComponent(x.id) + '">' + esc(tr(lang, 'rev_btn')) + '</a></p>' + modL;
const shownRep = new Set((rv.approved_total ? (rv.reports || []).slice(0, 10) : []).map(r => r.ref != null && byRep.get(String(r.ref))).filter(Boolean));
const DR = DR0.filter(r => !shownRep.has(r));
const drHtml = DR.length ? '<div class="ugc" data-replies>' + DR.slice(0, 10).map(r => {
const badge = r.official && r.domain ? TB.kbx_named__t.k14 + esc(tr(lang, 'dr_badge', { d: r.domain })) + '</span>' : '<span class="kpill">' + esc(tr(lang, 'dr_badge_plain')) + '</span>';
const docs = (r.docs || []).length ? '<small>' + esc(tr(lang, 'dr_docs')) + ': ' + r.docs.slice(0, 12).map(k => esc(k.kind) + ' <code>' + esc(String(k.sha256).slice(0, 16)) + '...</code>').join(', ') + '</small><br>' : '';
return TB.kbx_named__t.k15 + badge + ' <small>' + esc(tr(lang, 'dr_meta', { t: r.topic || '', a: fd(r.approved, lang), how: r.method === 'meta' ? tr(lang, 'dr_how_meta') : tr(lang, 'dr_how_dns') })) + (r.company ? ' &middot; ' + esc(r.company) : '') + '</small></p><p class="kreply-t">' + esc(r.reply) + '</p>' + docs + (r.note ? '<small><b>Kolaboro:</b> ' + esc(r.note) + '</small>' : '') + '</blockquote>';
}).join('') + '</div>' : '';
const reply = (drHtml ? '' : '<p class="ki">' + esc(t31(lang, 'rp_none', { d: fd(checked, lang) })) + '</p>') + (drHtml ? '<h3>' + esc(tr(lang, 'dr_h', { k: DR.length })) + '</h3><p class="ki">' + esc(tr(lang, 'dr_intro')) + '</p>' + drHtml : '') + '<p>' + esc(tr(lang, 'reply_txt')) + TB.kbx_named__t.k16 + encodeURIComponent(x.id) + '">' + esc(tr(lang, 'reply_btn')) + TB.kbx_named__t.k17 + encodeURIComponent(x.id) + '&page=' + encodeURIComponent(canon.replace(ORIGIN, '')) + '#request">' + esc(tr(lang, 'corr_btn')) + TB.kbx_named__t.k18 + encodeURIComponent(x.id) + '">' + esc(tr(lang, 'ask_btn')) + '</a></p>';
const cta = checklistHtml(lang, { id: x.id, s: x.s, co: coName(x.co, lang) || x.co, regs: FX ? FX.regs : [], cost: !!FX, costLbl: FX ? FX.h.tocCost : '' }) + '<p>' + esc(tr(lang, 'cta_txt')) + TB.kbx_named__t.k19 + encodeURIComponent(page || '') + '" data-ev="seo_check">' + esc(tr(lang, 'cta_free')) + TB.kbx_named__t.k20 + (lang === 'en' ? '/book/' : pre(lang) + '/pricing/') + '?p=' + encodeURIComponent(x.s) + '#kreq" data-ev="seo_book">' + esc(tr(lang, 'cta_paid')) + '</a></p>';
const gLk = guideLink(x.mk, x.ar, lang, x.co), cta2 = gLk ? cta + '<p><a class="more" href="' + gLk.href + '">' + esc(gLk.text) + '</a></p>' : cta;
const aRow = extra.around && extra.around.ar && extra.around.ar.projects && extra.around.ar.projects[x.id], hasPin = typeof fx.lat === 'number' && typeof fx.lng === 'number';
const pinLine = hasPin ? (aRow && aRow.acc ? qa(lang, 'wh_pin_a', { a: num(aRow.acc, lang) }) : qa(lang, 'wh_pin')) : qa(lang, 'wh_nopin');
const whereLinks = [hasPin ? TB.kbx_named__t.k21 + fx.lat.toFixed(5) + '&amp;mlon=' + fx.lng.toFixed(5) + '#map=16/' + fx.lat.toFixed(5) + '/' + fx.lng.toFixed(5) + TB.kbx_named__t.k22 + esc(qa(lang, 'wh_map')) + '</a>' : '',
aRow && extra.around ? '<a href="#around">' + esc(qa(lang, 'wh_around')) + '</a>' : '', '<a href="' + mkHref(ix, x, lang) + '">' + esc(qa(lang, 'wh_mk', { mk: mkName(x.mk, lang) })) + '</a>',
rk ? '<a href="' + pre(lang) + '/rankings/transparency/' + rk.s + '/">' + esc(qa(lang, 'wh_rank', { p: rk.p })) + '</a>' : ''].filter(Boolean);
const DL = distLine(lang, name, extra.around ? aroundSum(extra.around, x, lang) : []), LN = localName(x);
const whereSec = '<ul class="fl">' + fact(esc(qa(lang, 'wh_place', { place })), page) + fact(esc(pinLine), page) + DL.li + (LN ? fact('<b>' + esc(t29(lang, 'ln_th')) + '</b> <bdi lang="th">' + esc(LN[0]) + '</bdi>', LN[1], 'eia.onep.go.th') : '') + '</ul><ul class="lk">' + whereLinks.map(a => '<li>' + a + '</li>').join('') + '</ul>';
const legitSec = tp ? '<style>' + QA_CSS + '</style><p class="ki">' + bdq(qa(lang, 'lg_intro', { n: name })) + '</p><p class="kqa-sum">' + esc(qa(lang, 'lg_sum', { a: num(tp.items.filter(i => i.st === 'yes').length, lang), b: num(tp.items.filter(i => i.st !== 'nc').length, lang) })) + '</p>' +
(rvd ? '' : '<p class="knote">' + esc(qa(lang, 'lg_nr')) + '</p>') + tp.ledger + '<p><a class="more" href="' + tp.method + '">' + esc(qa(lang, 'lg_m')) + '</a></p>' : '';
const factsTxt = [rvd ? '' : nrB + '.', x.pn ? tr(lang, 'g_pn') : tr(lang, 'g_pn_none'), cN && rvd ? tr(lang, 'g_claims', { c: cN, v: cl.verified, u: cl.unverified, x: cl.contradicted }) : '', ho ? tr(lang, 'g_h', { h: fd(ho.d, lang) }) : tr(lang, 'g_h_none'),
ovN ? tr(lang, 'g_over2', { m: ovN }) : '', FL.length ? FL.map(f => tr(lang, 'rc_' + f[0])).join('; ') + '.' : tr(lang, 'no_reports')].filter(Boolean).join(' ');
const tpYes = tp ? tp.items.filter(i => i.st === 'yes').length : 0, tpAll = tp ? tp.items.filter(i => i.st !== 'nc').length : 0;
const trLine = tp ? (rk ? qa(lang, 'qa_tr', { s: tpS, r: num(rk.r, lang), m: num(rk.m, lang), p: rk.p }) : qa(lang, 'qa_tr1', { s: tpS })) : '';
const factsTx2 = factsTxt + (tp ? ' ' + qa(lang, 'lg_sum', { a: num(tpYes, lang), b: num(tpAll, lang) }) + ' ' + trLine : '');
const FAQ = [[tr(lang, 'q_legit', { n: name }), tr(lang, 'a_legit', { facts: factsTx2 })],
[qa(lang, 'h_when', { n: name }), ho ? tr(lang, 'a_deliv', { h: fd(ho.d, lang) }) + (hand && hand.mv ? ' ' + tr(lang, 'g_moved', { k: hand.mv, mm: hand.mm }) : '') + (ovN ? ' ' + tr(lang, 'g_over2', { m: ovN }) : '') : tr(lang, 'a_deliv_none')],
[qa(lang, 'h_who', { n: name }), x.dv ? tr(lang, 'a_dev', { dev: x.dv }) + (devN > 1 ? ' ' + qa(lang, 'who_k', { dev: x.dv, k: num(devN, lang) }) : '') + (devRec ? ' ' + devRec : '') : tr(lang, 'a_dev_none')],
[tr(lang, 'q_permit', { n: name }), vf.permit === 'registry' ? tr(lang, 'a_permit_reg') : x.pn ? tr(lang, 'a_permit_pn', { pn: x.pn }) : tr(lang, 'a_permit_none')],
[tr(lang, 'q_rev2', { n: name }), rv.approved_total ? tr(lang, 'rev_some', { k: rv.approved_total }) : tr(lang, 'a_rev')]];
FAQ.splice(1, 0, [qa(lang, 'h_where', { n: name }), tr(lang, 'a_where', { n: name, place }) + ' ' + pinLine]);
FAQ.splice(3, 0, [tr(lang, 'q_delay', { n: name }), ovN ? tr(lang, 'g_over', { m: ovN }) + (ho ? ' ' + tr(lang, 'a_delay_latest', { h: fd(ho.d, lang) }) : '')
: hand && hand.ph ? qa(lang, 'ph_t', { h: fd(hand.d, lang), a: fd(hand.d0, lang) })
: hand && hand.mv ? tr(lang, 'g_moved', { k: hand.mv, mm: hand.mm }) + ' ' + tr(lang, 'a_delay_latest', { h: fd(hand.d, lang) })
: hand && hand.st === 'pending' ? tr(lang, 'a_delay_ahead', { h: fd(hand.d, lang) }) : hand ? tr(lang, 'a_delay_rec', { h: fd(hand.d, lang), st: tr(lang, 'ps_' + hand.st) }) : ho ? tr(lang, 'g_h', { h: fd(ho.d, lang) }) : tr(lang, 'a_deliv_none')]);
FAQ.push([qa(lang, 'h_cost', { n: name }), RS ? rsNoAsk(lang) + ' ' + rsText(lang, RS) + '.' : fx.price_min && cleanOk(String(fx.price_min)) ? tr(lang, 'a_price', { p: cur + num(fx.price_min, lang), to: fx.price_max ? tr(lang, 'a_price_to', { p2: cur + num(fx.price_max, lang) }) : '' }) : qa(lang, 'a_price0')]);
if (fx.payment_plan && cleanOk(String(fx.payment_plan))) FAQ.push([qa(lang, 'q_plan', { n: name }), qa(lang, 'a_plan', { p: String(fx.payment_plan) }), [String(fx.payment_plan)]]);
else FAQ.push([qa(lang, 'q_plan', { n: name }), t29(lang, 'pp_none', { d: readD })]);
{ const A = [], ut = (fx.unit_types || []).filter(t => cleanOk(String(t)));
if (ut.length) A.push(ut.join(', '));
if (fx.size_min_m2) A.push(num(fx.size_min_m2, lang) + (fx.size_max_m2 && fx.size_max_m2 !== fx.size_min_m2 ? ' - ' + num(fx.size_max_m2, lang) : '') + ' m²');
if (c && c.units) A.push(tr(lang, 'f_units') + ': ' + num(c.units, lang));
FAQ.push([t29(lang, 'q_ty', { n: name }), A.length ? t29(lang, 'a_ty', { t: A.join('; ') }) : t29(lang, 'ty_none', { d: readD }), ut.length ? [ut.join(', ')] : null]); }
if (x.dv && fx.developer_company && cleanOk(String(fx.developer_company))) FAQ.push([tr(lang, 'q_dreg', { dev: x.dv }), tr(lang, 'df_company') + ': ' + String(fx.developer_company) + '. ' + tr(lang, 'dfacts_src', { n: name }) + '.', [String(fx.developer_company)]]);
if (tp) FAQ.push([qa(lang, 'q_tr', { n: name }), trLine + ' ' + qa(lang, 'a_tr_x')]);
for (const f of P29.faq) FAQ.push(f);
if (DL.faq) FAQ.push(DL.faq);
const hN = (c.history || []).length;
FAQ.push([tr(lang, 'q_change', { n: name }), [tr(lang, 'a_change', { d: fd(checked, lang) }), FX ? FX.chSum : '', ph && ph.n > 1 ? tr(lang, 'ph_line', { n: ph.n, a: fd(ph.first, lang), b: fd(ph.last, lang), c: ph.changed }) : '', hN ? tr(lang, 'a_change_k', { k: hN }) : (ph && ph.changed) || (FX && FX.chN) ? '' : tr(lang, 'a_change_none')].filter(Boolean).join(' ')]);
for (const f of FAQ) f[1] = dot(f[1]);
const qmark = (h, Q) => lang === 'en' || !Q ? h : Q.reduce((t, w) => { const e = esc(String(w).replace(/[.\s]+$/, '')); return e.length > 3 ? t.split(e).join('<span lang="en" dir="ltr">' + e + '</span>') : t; }, h);
const faq = FAQ.filter(f => !f[3]).map(([q, a, Q]) => '<details class="kfaq"><summary>' + esc(q) + '</summary><p>' + qmark(esc(a), Q) + '</p></details>').join('');
const S = [...new Set([page, x.du, ...(x.src || []), ...CL.map(r => r[3]), ...FL.map(f => f[1])].filter(okHttp))];
const sources = '<p class="ki">' + esc(tr(lang, 'src_intro')) + '</p><ol class="srcs">' + S.map((u, i, A) => srcLi(u, A.filter(v => host(v) === host(u)).length > 1).replace(/<\/li>$/, ' ' + kindIco(srcKind(u, x), lang) + '</li>')).join('') + '</ol>' +
((w => w ? '<ul class="fl">' + w + '</ul>' : '')(wbLine(extra.wb, x, lang)) || (okHttp(page) ? TB.kbx_named__t.k23 + esc(fixU(page)) + TB.kbx_named__t.k24 + esc(tr(lang, 'src_archive')) + '</a></p>' : '')) + dlLine(lang, x.s);
const aS = qaSentences(ix, x, lang, tp, { rvN, checked });
const fresh = (ph && ph.n > 1 ? '<span>' + esc(tr(lang, 'upd_ver', { n: ph.n, a: fd(ph.first, lang), c: ph.changed })) + '</span>' : '') + (ph && ph.n ? '<span><a href="' + chg + '">' + esc(tr(lang, 'upd_log')) + '</a></span>' : '') +
TB.kbx_named__t.k25 + encodeURIComponent(x.id) + '" data-ev="seo_bought">' + esc(tt27(lang, 'np_bought')) + '</a></span>';
const ovP = ov ? overdueByMarket(ix).get(x.mk) || 0 : 0, today = new Date().toISOString().slice(0, 10);
const ovHtml = ov ? TB.kbx_named__t.k26 + esc(qa(lang, 'ov_h')) + '</b> ' + bidi(lang, esc(qa(lang, 'ov_t', { h: fd(ov.d, lang), mm: months(lang, ov.m, lang === 'de' ? 'dat' : 'nom', nfL), d: fd(today, lang) })) +
(stageKey(ov.st) !== 'st_unknown' ? ' ' + esc(qa(lang, 'ov_st', { c: fd(checked, lang), st: tr(lang, stageKey(ov.st)) })) : ''), [name]) + srcA(page) + ' <a class="kovd-l" href="' + pre(lang) + '/handover/overdue/' + (ovP >= OV_MIN ? slugA(x.mk) + '/' : '') + '">' +
esc(ovP >= OV_MIN ? qa(lang, 'ov_more', { p: mkName(x.mk, lang) }) : qa(lang, 'ov_all')) + '</a></p></div>' : '';
const id33 = t33(lang, 'id_l') ? ' <span class="kid">' + esc(t33(lang, 'id_l')) + ({ fr: ' : ', zh: '：' }[lang] || ': ') + '<b translate="no">' + esc(x.id) + '</b></span>' : '';
const updHtml = '<p class="kupd"><time datetime="' + esc(checked) + '">' + esc(tr(lang, 'upd_checked', { d: fd(checked, lang) })) + '</time>' + id33 + '</p>';
const hoF = handoverOf(ix, x), fsSep = lang === 'ar' ? '، ' : lang === 'zh' ? '，' : ', ', fsC = { fr: ' : ', zh: '：' }[lang] || ': ';
const fsPl = placeName([x.ar && [...x.ar].length < 40 ? x.ar.split(' (')[0] : null, x.mk, x.co !== x.mk ? x.co : null].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', '), lang), fsHtml = '<p class="kfl8"><span>' + bidi(lang, esc(fsPl).replace(/, /g, fsSep), fsPl.split(', ').filter(n => /^[\u0000-\u024F]+$/.test(n))) + '</span>' +
(hoF ? '<span>' + esc(tr(lang, 'th_hand')) + fsC + '<b>' + esc(fd(hoF.d, lang)) + '</b>' + (hoF.p && hoF.p.ph ? ' ' + esc(t33(lang, 'fs_mv')) : '') + '</span>' : '') +
'<span>' + esc(tr(lang, 'th_permit')) + fsC + '<b>' + esc(x.pn ? tr(lang, 'v_pub') : tr(lang, 'v_notpub')) + TB.kbx_named__s.k0;
const satL = extra.sat ? satLine(extra.sat, x.id, lang, d => fd(d, lang)) : '', baL = satL ? satBa(lang, extra.sat, x.id) : '';
const answer = ovHtml + (rvd ? '' : nrNote(lang)) + TB.kbx_named__t.k27 + bidi(lang, esc(dot(aS.join(' '))), [name, place, x.dv || '']) + '</p><p class="kans-u">' + fresh + '</p>' + (satL ? satHtml29(lang, satL).replace('</a></span>', '</a>' + baL + '</span>') : '') + '</div>';
const R6 = rel6(ix, x, ho), r6set = new Set(R6.map(r => r[0].id));
const rel6H = R6.length ? '<h3>' + esc(qa(lang, 'r6_h')) + '</h3><ul class="lk k6">' + R6.map(([o, why]) => '<li><a href="' + pre(lang) + '/projects/' + o.s + '/">' + esc(o.n) + '</a> <small>' + esc(why === 'dev' ? qa(lang, 'r6_dev') : why === 'mk' ? qa(lang, 'r6_mk', { mk: mkName(o.mk, lang) }) : qa(lang, 'r6_y', { y: why.slice(2) })) + '</small></li>').join('') + '</ul>' : '';
const AR = x.ar && x.ar !== x.mk ? (ix.byAr.get(x.mk + '|' + x.ar) || []).filter(o => o.id !== x.id && !r6set.has(o.id)).slice(0, 8) : [];
const relL = [];
if (devPage && others.length) relL.push('<li><a href="' + devPage.replace(ORIGIN, '') + '">' + esc(tr(lang, 'rel_dev', { dev: x.dv })) + '</a> <small>' + (others.length + 1) + '</small></li>');
if (SM.length) relL.push('<li><a href="/compare/?ids=' + [x.id, ...SM.slice(0, 3).map(o => o.id)].map(encodeURIComponent).join(',') + '" rel="nofollow">' + esc(tr(lang, 'rel_cmp', { n: name })) + '</a></li>');
relL.push('<li><a href="/vs/#' + slugA(x.mk) + '">' + esc(tr(lang, 'rel_vs', { mk: x.mk })) + '</a></li>');
relL.push('<li><a href="/embed/p/' + x.s + '/">' + esc(tr(lang, 'rel_embed')) + '</a></li>');
if (x.co) relL.push('<li><a href="/countries/' + slugA(CO_HUB[x.co] || x.co) + '/">' + esc(tr(lang, 'rel_country', { co: coName(x.co, lang) })) + '</a></li>');
const related = rel6H + (AR.length ? '<h3>' + esc(tr(lang, 'rel_area', { ar: x.ar })) + '</h3><ul class="lk">' + AR.map(o => '<li><a href="' + pre(lang) + '/projects/' + o.s + '/">' + esc(o.n) + '</a>' + (o.dv ? ' <small>' + esc(o.dv) + '</small>' : '') + '</li>').join('') + '</ul>' : '') +
'<ul class="lk">' + relL.join('') + '</ul>';
const crumbs = [[tr(lang, 'crumb_home'), ORIGIN + pre(lang) + '/'], ...(x.co && x.co !== x.mk ? [[coName(x.co, lang), ORIGIN + '/countries/' + slugA(CO_HUB[x.co] || x.co) + '/']] : []), [mkName(x.mk, lang), ORIGIN + mkHref(ix, x, lang)], ...(devPage ? [[((ix.devs.get(x.dvs) || {}).n) || x.dv, devPage]] : []), [name, canon]];
const moneyH = extra.money ? moneyHtml(extra.money, x, lang) : '';
const landH = extra.land ? pinHtml(extra.land, x, lang, d => fd(d, lang)) + landHtml(extra.land, x, lang, d => fd(d, lang)) : '', histH = extra.land ? histHtml(extra.land, x, lang, d => fd(d, lang)) : '';
const aroundH = extra.around ? aroundHtml(extra.around, x, lang, d => fd(d, lang)) : '', climateH = extra.around ? climateHtml(extra.around, x, lang, d => fd(d, lang)) : '';
const priceH = extra.paper ? (s0 => s0 && s0 + priceLink(extra.paper, ix, x, lang))(pricesHtml(extra.paper, x, lang)) : '', planH = extra.paper ? planningHtml(extra.paper, x, lang) : '';
const toc = [['glance', 's_glance'], ...(FX && !chMerge ? [['changed', null, FX.h.tocChanged]] : []), ...(legitSec ? [['legit', null, qa(lang, 'toc_legit')]] : []), ['promise', 's_promise'], ['payment-plan', null, t29(lang, 'pp_toc')], ['floor-plans', null, t29(lang, 'ty_toc')], ...(FX ? [['buycost', null, FX.h.tocCost]] : []), ...(P29.secs.rules ? [['buy-rules', null, t29(lang, 'rl_toc')]] : []), ...(priceH ? [['prices', null, paperHeading(lang, 'ph_toc')]] : []), ...(moneyH ? [['money', null, moneyToc(lang)]] : []), ['ppm', 's_ppm_toc'], ['delivery', 's_delivery'], ...(satHtml ? [['space', null]] : []), ...(seeSec ? [['ground', null, seeToc(lang)]] : []), ...(histH ? [['maphist', null, histToc(lang)]] : []), ['permits', 's_permits'], ...(planH ? [['planning', null, paperHeading(lang, 'pl_toc')]] : []), ...(landH ? [['land', null, landToc(lang)]] : []), ['where', null, qa(lang, 'toc_where')], ...(aroundH ? [['around', null, aroundToc(lang)]] : []), ...(climateH ? [['climate', null, climateToc(lang)]] : []), ...(rvd ? [['checks', 's_checks']] : []), ['claims', 's_claims'], ['history', 's_history'], ['reports', 's_reports'], ['developer', 's_devsec'], ...(webHtml ? [['web', null, webHeading(lang, 'h')]] : []), ...(FX ? [['alternatives', null, FX.h.tocAlt]] : []), ['reviews', 's_reviews'], ['reply', 's_reply'], ['ask', null, t31(lang, 'ask_h', { n: name })], ['next', null, t26(lang, 'nx_h')], ['faq', 's_faq'], ['sources', 's_sources']];
const CL3 = closest3(ix, x), seen31 = new Set([...r6set, ...CL3.map(r => r.o.id)]), SM2 = new Set(SM.filter(o => !seen31.has(o.id)).map(o => o.s));
const simH = cl3Html(lang, x, CL3) + (SM2.size ? similar.replace(/<li><a href="[^"]*\/projects\/([a-z0-9-]+)\/">.*?<\/li>/g, (m, sl) => SM2.has(sl) ? m : '') : '');
const ppm31 = ppmOf(x), med31 = ppm31 != null ? medians(ix).get(x.mk + '|' + String(fx.currency).toUpperCase()) : null, tyT = tyTable(lang, x, ppm31, med31, mkName(x.mk, lang));
const mv11 = !!(hoF && hoF.p && hoF.p.ph), L6 = light6({ tp, c, pn: x.pn, ho, ev: x.ev, mv: mv11, ids: toc.map(t => t[0]) });
const light = lightHtml(lang, { tp, c, pn: x.pn, ho, ev: x.ev, mv: mv11, ids: toc.map(t => t[0]), meta: { d: fd(checked, lang), n: S.length, q: pre(lang) + '/projects/' + x.s + '/questions/', co: coName(x.co, lang) || x.co, regs: FX ? FX.regs : [] }, data: Object.assign({ id: x.id }, RS ? { c: 'AED' } : fx.price_min > 0 && fx.currency ? { p: +fx.price_min, p2: fx.price_max > fx.price_min ? +fx.price_max : undefined, c: String(fx.currency).toUpperCase() } : {}) });
const body = CSS31 + TB.kbx_named__t.k28 + crumbs.slice(0, -1).map(([l, u]) => '<a href="' + esc(u.replace(ORIGIN, '')) + '">' + esc(l) + '</a>').join(' / ') + '</p>' +
'<h1><bdi' + LNX(lang) + '>' + esc(name) + '</bdi></h1><p class="kh1sub">' + esc(tr(lang, 'h1_ps')) + '</p>' + updHtml + fsHtml + '<p class="lead">' + bidi(lang, esc(tr(lang, 'lead_p', { n: name, place })), [name, place]) + '</p>' + answer.replace('%%K31Q%%', knownLine(lang, L6)).replace('%%K31L%%', light) + trustBlock(x, c, lang, { fd, seq: SEQ, ckName: k => tr(lang, 'c_' + k), kindOf: u => srcKind(u, x), sources: S, checked, sat: extra.sat, name }) + '<details class="kz-kf"><summary>' + esc(t27(lang, 'kf_h')) + '</summary>' + keys + '</details>' + (extra.trb || '') + watchBox(lang, x.id, name, '/projects/' + x.s + '/', { score: c.score || 0, vscore: c.vscore || 0, stage: c.stage || null, overdue: c.overdue || 0, claims: { verified: cl.verified || 0, unverified: cl.unverified || 0, contradicted: cl.contradicted || 0 }, flags: (c.flags || []).length, history: (c.history || []).length }) + (extra.coh || '') + '</div></section>' +
TB.kbx_named__t.k29 + esc(tr(lang, 's_glance')) + '">' + toc.map(([i, k, lbl]) => '<a href="#' + i + '">' + esc(lbl || (k ? tr(lang, k) : satToc(lang))) + '</a>').join('') + '</nav>' +
sec('glance', esc(tr(lang, 's_glance')), '<ul class="fl glance">' + bidi(lang, g.join(''), [name, place, x.dv || '']) + '</ul>') + (FX && !chMerge ? sec('changed', esc(FX.h.changed), FX.changed) : '') + (legitSec ? sec('legit', bdq(qa(lang, 'h_legit', { n: name })), legitSec) : '') + sec('promise', bdq(qa(lang, 'h_cost', { n: name })), bidi(lang, promised, [name])) + sec('payment-plan', bdq(t29(lang, 'pp_h', { n: name })), P29.secs.plan) + sec('floor-plans', bdq(t29(lang, 'ty_h', { n: name })), P29.secs.types + tyT) + (FX ? sec('buycost', bdq(FX.h.cost), FX.cost) : '') + (P29.secs.rules ? sec('buy-rules', bdq(t29(lang, 'rl_h', { n: name })), P29.secs.rules) : '') + (priceH ? sec('prices', esc(paperHeading(lang, 'ph_h')), '<style>' + PAPER_CSS + '</style>' + priceH) : '') + (moneyH ? sec('money', esc(moneyHeading(lang)), moneyH) : '') + sec('ppm', esc(tr(lang, 's_ppm')), (h => { const m = tyT ? '' : ppmMedian(ix, x, lang, mkName(x.mk, lang)); return m ? h.replace('</ul>', m + '</ul>') : h; })(ppmSection(x, lang).html)) + sec('delivery', bdq(qa(lang, 'h_when', { n: name })), delivery) + (satHtml ? sec('space', esc(satHeading(lang)), satHtml) : '') + (seeSec ? sec('ground', esc(seeHeading(lang)), seeSec) : '') + (histH ? sec('maphist', esc(histHeading(lang)), histH) : '') +
sec('permits', bdq(qa(lang, 'h_permit', { n: name })), permits) + (planH ? sec('planning', esc(paperHeading(lang, 'pl_h')), (priceH ? '' : '<style>' + PAPER_CSS + '</style>') + planH) : '') + (landH ? sec('land', esc(landHeading(lang)), landH) : '') + sec('where', bdq(qa(lang, 'h_where', { n: name })), bidi(lang, whereSec, [name, place, x.mk]) + (hasPin ? staticMap(lang, fx.lat, fx.lng, name) : '')) + (aroundH ? sec('around', esc(aroundHeading(lang)), aroundH) : '') + (climateH ? sec('climate', esc(climateHeading(lang)), climateH) : '') + (rvd ? sec('checks', esc(tr(lang, 's_checks')), checks) : '') + sec('claims', esc(tr(lang, 's_claims')), claims) + sec('history', esc(tr(lang, 's_history')), chMerge && FX ? history.replace('%%CHM%%', FX.changed) : history.replace('%%CHM%%', '')) +
sec('reports', esc(tr(lang, 's_reports')), reports) + sec('developer', bdq(qa(lang, 'h_who', { n: name })), bidi(lang, devsec, [name, x.dv || ''])) + (webHtml ? sec('web', esc(webHeading(lang, 'h')), webHtml) : '') + (FX ? sec('alternatives', bdq(FX.h.alt), FX.alt) : '') + (simH ? sec('similar', esc(tr(lang, 's_similar')), simH) : '') +
sec('market', esc(tr(lang, 's_market', { mk: x.mk })), market) + sec('related', esc(tr(lang, 'rel_h')), related) + sec('reviews', esc(tr(lang, 's_reviews')), reviews) + sec('reply', esc(tr(lang, 's_reply')), reply) + sec('ask', bdq(t31(lang, 'ask_h', { n: name })), askHtml(lang, { L6, n: name, h: ho ? fd(ho.d, lang) : '', escrow: rvd ? ck.escrow : null, price: !!fx.price_min, id: x.id, s: x.s })) +
sec('cta', esc(tr(lang, 's_cta')), cta2) + nextStep(lang, x, name, (CL3.length ? CL3.map(r => r.o) : SM.length ? SM : ix.P.filter(o => o.mk === x.mk && o !== x)).slice(0, 3).map(o => o.s), shareText(lang, { n: name, place: mkName(x.mk, lang), h: ho ? fd(ho.d, lang) : '', pn: !!x.pn, s: tp ? tpS : null })) + sec('faq', esc(tr(lang, 's_faq')), faq) + sec('sources', esc(tr(lang, 's_sources')), sources) +
'<p class="ki kfoot">' + tr(lang, 'foot', { d: esc(fd(checked, lang)), link: own('/data-policy/', tr(lang, 'm_data_policy')) }) + '</p></div>';
const imgs = projImages(x, lang, canon, extra.sat);
const alt = [...new Set([RAWN.get(x), /\(/.test(name) ? name.replace(/\s*\([^)]*\)/g, '').trim() : null, name.toLowerCase().includes(String(x.mk).toLowerCase()) ? null : name + ' ' + x.mk, x.dv && !name.toLowerCase().includes(String(x.dv).toLowerCase()) ? name + ' by ' + x.dv : null, (localName(x) || [])[0]].filter(v => v && v !== name))];
const placeType = /villa|house|home/i.test(name + ' ' + ((fx.unit_types || []).join(' '))) && !/apartment|tower|condo|residences/i.test(name) ? 'Residence' : 'ApartmentComplex';
const geo = typeof fx.lat === 'number' && typeof fx.lng === 'number' ? { '@type': 'GeoCoordinates', latitude: fx.lat, longitude: fx.lng } : undefined;
const orgId = (devPage ? dUrl('en', x.dvs) : canon) + '#org';
const ld = { '@context': 'https://schema.org', '@graph': [
{ '@type': 'WebPage', '@id': canon + '#page', url: canon, name: title.replace(/ \| Kolaboro$/, ''), description: desc, inLanguage: lang, dateModified: checked, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' },
publisher: { '@id': ORIGIN + '/#org' }, primaryImageOfPage: { '@id': canon + '#og' }, speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#answer .kans-t'] }, about: [{ '@id': canon + '#place' }].concat(x.dv ? [{ '@id': orgId }] : []), breadcrumb: { '@id': canon + '#bc' },
mentions: [{ '@type': 'Place', name: mkName(x.mk, lang), url: ORIGIN + mkHref(ix, x, lang) }].concat(x.co && x.co !== x.mk ? [{ '@type': 'Country', name: coName(x.co, lang) }] : [], okHttp(x.du) ? [{ '@type': 'WebPage', url: fixU(x.du), name: host(fixU(x.du)) }] : []),  mainEntity: { '@id': canon + '#faq' }, isBasedOn: { '@id': canon + '#data' } },
{ '@type': 'Organization', '@id': ORIGIN + '/#org', name: 'Kolaboro', url: ORIGIN + '/', logo: ORIGIN + '/k/favicon.svg', sameAs: [TB.kbx_named__t.k30] },
...imgs.map(i => Object.assign({ '@type': 'ImageObject' }, i)),
Object.assign({ '@type': placeType, '@id': canon + '#place', name }, alt.length ? { alternateName: alt } : {}, { image: imgs.map(i => ({ '@id': i['@id'] })), address: { '@type': 'PostalAddress', addressLocality: x.ar || x.mk, addressRegion: x.mk, addressCountry: TB.kbx_named__t.o_COUNTRY_ISO[x.co] || CO_ISO2[x.co] || x.co }, containedInPlace: { '@type': 'Place', name: mkName(x.mk, lang), url: ORIGIN + mkHref(ix, x, lang) }, subjectOf: { '@id': canon + '#page' } }, geo ? { geo } : {}),
...(x.dv ? [Object.assign({ '@type': 'Organization', '@id': orgId, name: ((ix.devs.get(x.dvs) || {}).n) || x.dv }, devPage ? { url: dUrl('en', x.dvs) } : {}, ((ix.devs.get(x.dvs) || {}).n) && ix.devs.get(x.dvs).n !== x.dv ? { alternateName: x.dv } : {})] : []),
{ '@type': 'Dataset', '@id': canon + '#data', name: tr(lang, 'ds_name', { n: name }), description: tr(lang, rvd ? 'ds_rv' : 'ds_nr', { n: name, place, id: x.id }),
url: canon, identifier: x.id, license: TB.kbx_named__t.k31, isAccessibleForFree: true, creator: { '@id': ORIGIN + '/#org' }, dateModified: checked, spatialCoverage: { '@id': canon + '#place' },
...(S.length ? { isBasedOn: S.slice(0, 8).map(fixU) } : {}), ...(FL.length ? { citation: FL.slice(0, 4).map(f => fixU(f[1])) } : {}),
distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + rec }, { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/api/v1/projects/' + x.s }, { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: ORIGIN + '/api/v1/projects/' + x.s + '.csv' }] },
{ '@type': 'BreadcrumbList', '@id': canon + '#bc', itemListElement: crumbs.map(([l, u], i) => ({ '@type': 'ListItem', position: i + 1, name: l, item: u })) },
...(FQ33 => FQ33.length ? [{ '@type': 'FAQPage', '@id': canon + '#faq', mainEntity: FQ33.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] : [])(faq33(FAQ, lang))] };
const dupOf = DUP_OF[x.id] && ix.byId.get(DUP_OF[x.id]);
return { title, desc, canon: dupOf ? pUrl(lang, dupOf.s) : canon, body: leadify(body, leadMap(ix, x, lang, tp, checked, { esc, fd, host, okHttp, fixU, handoverOf, reviewed })), ld, lastmod: checked, alt: l => pUrl(l, dupOf ? dupOf.s : x.s), feed: { path: '/projects/' + x.s + '/', name }, images: imgs, upd: { html: updHtml, lang, k: 'chk', id: id33, d: iso(checked) } };
}
const SUFFIX = new Set('llc l c ltd limited inc incorporated pjsc pjs psc p j s sa slu sl plc bhd berhad sdn co company corp corporation pt tbk jsc gmbh ag bv nv srl spa sas sarl doo as ab oy kft zrt fz fze fzco fzllc soc sole proprietorship pvt pte private public sae sab de cv sapi ooo sociedad anonima'.split(' '));
const normN = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9Ѐ-ӿ؀-ۿ一-鿿]+/g, ' ').trim();
const core = s => normN(s).split(' ').filter(w => w && !SUFFIX.has(w)).join(' ');
async function gleif(name, ctx) {
const key = new Request(ORIGIN + '/__named_gleif/v2/' + encodeURIComponent(normN(name)));
try { const hit = await caches.default.match(key); if (hit) return await hit.json(); } catch (e) {}
let res;
try {
const r = await fetch(TB.kbx_named__t.k32 + encodeURIComponent(name) + '&page%5Bsize%5D=20', { headers: { accept: 'application/vnd.api+json', 'user-agent': TB.kbx_named__t.k33 }, signal: AbortSignal.timeout(5000) });
if (!r.ok) throw new Error('gleif ' + r.status);
const d = await r.json(), want = core(name);
const m = (d.data || []).filter(e => { const ent = ((e.attributes || {}).entity) || {}; return want.length >= 3 && ent.legalName && core(ent.legalName.name) === want; }).slice(0, 3)
.map(e => { const a = e.attributes, ent = a.entity; return { lei: e.id, legal: ent.legalName.name, jur: ent.jurisdiction, st: ent.status, ls: a.registration.status, reg: (a.registration.initialRegistrationDate || '').slice(0, 10), cr: (ent.creationDate || '').slice(0, 10), country: (ent.legalAddress || {}).country }; });
res = { ok: true, at: new Date().toISOString().slice(0, 10), matches: m };
} catch (e) { res = { ok: false, at: new Date().toISOString().slice(0, 10), matches: [] }; }
try { const p = caches.default.put(key, new Response(JSON.stringify(res), { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=' + (res.ok ? 604800 : 1800) } })); if (ctx && ctx.waitUntil) ctx.waitUntil(p.catch(() => {})); } catch (e) {}
return res;
}
const n32xLinks = (l, s) => { const a = TB.kbx_named__t.o_N32XL[l] || TB.kbx_named__t.o_N32XL.en, p = pre(l); return '<p class="ksmall">' + [[p + '/graph/entities/?n=d:' + s, a[0]], [p + '/watch/website-changes/?dv=' + s, a[1]], [p + '/anomalies/', a[2]]].map(x => '<a href="' + esc(x[0]) + '">' + esc(x[1]) + '</a>').join(' · ') + '</p>'; };
function devPage(ix, dv, lang, extra) {
const L = dv.ids.map(i => ix.byId.get(i)).filter(Boolean), name = dv.n, canon = dUrl(lang, dv.s);
const mks = [...new Set(L.map(x => x.mk))], lm = L.map(x => lastmod(ix, x)).sort(), checked = lm[lm.length - 1];
const pn = L.filter(x => x.pn).length, P = L.flatMap(x => ix.prom[x.id] || []);
const cnt = st => P.filter(p => p.st === st).length, moved = P.filter(p => p.mv).length;
const yD = new Date().getUTCFullYear(), tdy = k => qa(lang, k, { dev: name, y: yD });
const title = dTitle33(lang, { dev: name, y: yD, k: L.length, nf: v => num(v, lang), b: n => qa(lang, 'b_y', { n, y: yD }) }) || [tdy('td_y') + ' | Kolaboro', tdy('td_y'), tdy('td_y2') + ' | Kolaboro', tdy('td_y2'), qa(lang, 'b_y', { n: name, y: yD }) + ' | Kolaboro', tr(lang, 'title_d', { dev: name }), tr(lang, 'title_d2', { dev: name }) + ' | Kolaboro', tr(lang, 'title_d2', { dev: name }), qa(lang, 'b', { n: name }) + ' | Kolaboro', qa(lang, 'b', { n: name })].find(t => [...t].length <= 60) || ((b, a) => a.length <= 60 ? b : a.slice(0, 60).join('').replace(/\s+\S*$/, ''))(qa(lang, 'b', { n: name }), [...qa(lang, 'b', { n: name })]);
const dscB = n => dot(tr(lang, 'desc_d2', { dev: name, k: L.length, mks: mks.slice(0, n).map(m => mkName(m, lang)).join(', ') + (mks.length > n ? ' +' + (mks.length - n) : ''), pn, p: P.length, mv: moved, d: fd(checked, lang) }));
const cc33 = (extra.cc && extra.cc.get(dv.s)) || [], ov33 = L.filter(x => overdueOf(ix, x)).length;
const hd33 = dHead33(lang, { cc: cc33, ov: ov33, mv: moved, k: L.length, pn, nf: v => num(v, lang), fd });
const dsc = n => hd33 ? hd33 + (lang === 'zh' ? '' : ' ') + dscB(n) : dscB(n);
let desc = dsc(mks.length); for (const n of [3, 2, 1]) if ([...desc].length > 155 && mks.length > n) desc = dsc(n);
if ([...desc].length > 155) { const cut = [...desc].slice(0, 155).join(''), k = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('。')); desc = k > 60 ? cut.slice(0, k + 1) : cut.replace(/\s+\S*$/, '') + '.'; }
const first = L[0], fx = Object.assign({}, ...L.map(x => x.fx || {}).reverse());
const FD = extra.fac ? devFacets(extra.fac, ix, dv, lang) : null;
const fdD = (h, d) => d && /^\d{4}-\d\d-\d\d/.test(d) ? h.replace(/<\/li>$/, ' <small class="k-xs"><time datetime="' + esc(String(d).slice(0, 10)) + '">' + esc(tr(lang, 'upd_checked', { d: fd(String(d).slice(0, 10), lang) })) + '</time></small></li>') : h;
const g = [fdD(fact(esc(tr(lang, 'g_d', { k: L.length, dev: name, mks: mks.map(m => mkName(m, lang)).join(', ') })), first.url), first.ad || checked), fdD(fact(esc(tr(lang, 'g_d_pn', { pn, k: L.length })), first.du || first.url), first.ad || checked)];
if (P.length) g.push(fdD(fact(esc(tr(lang, 'g_d_rec', { p: P.length, kept: cnt('kept'), broken: cnt('broken'), moved: cnt('moved'), pending: cnt('pending') })), '/promises/', tr(lang, 'm_promises')), checked));
if (FD) g.push(fdD(fact(FD.active, '/data/on-time.json', 'kolaboro.com/data/on-time.json'), checked));
for (const c of cc33.slice(0, 2)) g.push(fdD(fact(esc(t33(lang, 'dc_cc', { no: c.no, court: c.court, d: fd(c.date, lang), k: num(1, lang) })), c.src), c.read || c.date));
g.push('<li><a href="' + pre(lang) + '/score-history/?d=' + encodeURIComponent(dv.s) + '" rel="nofollow">' + esc(tb31(lang, 'sh_one', { n: dv.n })) + '</a></li>');
const cmp2 = L.length > 1, prFrom = x => { const f = x.fx || {}; return f.price_min && cleanOk(String(f.price_min)) ? (f.currency ? String(f.currency).toUpperCase() + ' ' : '') + num(f.price_min, lang) : '-'; };
const rows = L.map(x => { const c = ix.caseBy.get(x.id), h = handoverOf(ix, x); return '<tr data-f="m:' + esc(slugA(x.mk)) + ' s:' + esc(stageKey(c.stage)) + '"><td><a href="' + pre(lang) + '/projects/' + x.s + '/">' + esc(x.n) + '</a></td><td>' + esc(mkName(x.mk, lang)) + '</td><td>' + esc(tr(lang, stageKey(c.stage))) + '</td><td>' + esc(h ? fd(h.d, lang) : '-') + ((o => o ? ' <span class="kpill p-broken">+' + o.m + '</span>' : '')(overdueOf(ix, x))) + '</td><td>' + esc(x.pn ? tr(lang, 'v_pub') : tr(lang, 'v_notpub')) + '</td>' + (cmp2 ? '<td>' + esc(prFrom(x)) + '</td><td>' + esc(c.units ? num(c.units, lang) : '-') + '</td>' : '') + '<td>' + (reviewed(c) ? c.score + '/' + c.max : esc(tr(lang, 'nr_short'))) + '</td></tr>'; }).join('');
const filt = devFilter(lang, L.map(x => { const st = stageKey((ix.caseBy.get(x.id) || {}).stage); return { mk: slugA(x.mk), mkL: mkName(x.mk, lang), st, stL: tr(lang, st) }; }));
const projects = (filt ? DEV_CSS + filt : '') + TB.kbx_named__t.k34 + ['th_project', 'th_market', 'th_stage', 'th_hand', 'th_permit'].concat(cmp2 ? ['f_price', 'f_units'] : [], ['th_checks']).map(k => esc(tr(lang, k))).join('</th><th>') + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' + (filt ? '<script>' + DEV_JS + '</script>' : '');
const recLi = L.flatMap(x => (ix.prom[x.id] || []).filter(p => p.k === 'handover' || p.st === 'broken' || p.mv).slice(0, 3).map(p => fact('<a href="' + pre(lang) + '/projects/' + x.s + '/#delivery">' + esc(x.n) + '</a>: ' + esc(tr(lang, 'pk_' + p.k)) + ' ' + esc(fd(p.d, lang)) + ' <span class="kpill p-' + esc(p.st) + '">' + esc(tr(lang, 'ps_' + p.st)) + '</span>' + (p.mv ? ' · ' + esc(tr(lang, 'pr_moved', { k: p.mv, mm: p.mm })) : ''), x.url))).slice(0, 30).join('');
const record = '<p class="ki">' + tr(lang, 'del_intro', { link: own('/promises/', tr(lang, 'm_promises')) }) + '</p><ul class="fl">' + (recLi || '<li>' + esc(tr(lang, 'drec_none')) + '</li>') + '</ul>';
const DF = [['developer_founded', 'df_founded'], ['developer_hq', 'df_hq'], ['developer_company', 'df_company'], ['developer_projects_delivered', 'df_delivered'], ['developer_units_delivered', 'df_units'], ['listed_or_audited', 'df_listed']];
const dsrc = k => (L.find(x => (x.fx || {})[k] != null) || first);
const dfacts = DF.filter(([k]) => fx[k] != null && cleanOk(String(fx[k]))).map(([k, l]) => fact('<b>' + esc(tr(lang, l)) + ':</b> ' + en(String(fx[k])) + ' <small>(' + esc(tr(lang, 'dfacts_src', { n: dsrc(k).n })) + ')</small>', dsrc(k).url)).join('');
const gl0 = extra.gleif || { ok: false, matches: [] };
const gl = extra.fm && !gl0.matches.some(m => m.lei === extra.fm.m.lei) ? { ok: true, at: gl0.at, matches: [extra.fm.m].concat(gl0.matches) } : gl0;
{ const m0 = gl.matches[0]; if (m0) g.splice(2, 0, fdD(fact(esc(tr(lang, 'gleif_found', { legal: m0.legal, lei: m0.lei, jur: m0.jur, st: m0.st, ls: m0.ls, reg: fd(m0.reg, lang) })), 'https://search.gleif.org/#/record/' + encodeURIComponent(m0.lei), 'search.gleif.org'), gl.at)); else if (gl.ok) g.splice(2, 0, fdD(fact(esc(tr(lang, 'a_dreg_none', { d: fd(gl.at, lang) })), TB.kbx_named__t.k35 + encodeURIComponent(name), 'search.gleif.org'), gl.at)); }
const reg = '<ul class="fl">' + (gl.matches.length ? gl.matches.map(m => fact(esc(tr(lang, 'gleif_found', { legal: m.legal, lei: m.lei, jur: m.jur, st: m.st, ls: m.ls, reg: fd(m.reg, lang) })) + (m.cr ? ' ' + esc(facetT(lang, 'gl_cr', { d: fd(m.cr, lang) })) : ''), 'https://search.gleif.org/#/record/' + m.lei, 'search.gleif.org')).join('')
: gl.ok ? fact(esc(tr(lang, 'gleif_none', { d: fd(gl.at, lang) })), TB.kbx_named__t.k36 + encodeURIComponent(name), 'search.gleif.org') : '<li>' + esc(tr(lang, 'gleif_err')) + '</li>') + dfacts + '</ul>' + (FD ? FD.doms : '') + (R14 => R14.length ? '<h3>' + esc(t29(lang, 'dreg_s', { dev: name })) + '</h3><ul class="fl">' + R14.join('') + '</ul>' : '')([...new Map(L.flatMap(x => companyRegs(extra.fac && extra.fac.REG, x).map(r => [r.register, regLi(lang, r, mkName(r.market === x.mk ? x.mk : x.co, lang) || r.market)]))).values()].slice(0, 4)) + TB.kbx_named__t.k37 + esc(tr(lang, 'reg_more')) + '</a></p>';
const FL = L.flatMap(x => (x.fl || []).map(f => [f[0], f[1], x])), seenF = new Set();
const FLu = FL.filter(f => { const k = f[0] + f[1]; if (seenF.has(k)) return false; seenF.add(k); return true; });
const reports = '<p class="ki">' + esc(tr(lang, 'rep_intro')) + '</p><ul class="fl">' + cc33.slice(0, 5).map(c => fact(esc(t33(lang, 'dc_cc', { no: c.no, court: c.court, d: fd(c.date, lang) })), c.src)).join('') + (FLu.map(f => fact(esc(tr(lang, 'rc_' + f[0])) + ' (<a href="' + pre(lang) + '/projects/' + f[2].s + '/#reports">' + esc(f[2].n) + '</a>)', f[1])).join('') || (cc33.length ? '' : '<li>' + esc(tr(lang, 'no_reports')) + '</li>')) + '</ul>';
const reply = '<p>' + esc(tr(lang, 'reply_txt')) + TB.kbx_named__t.k38 + encodeURIComponent(first.id) + '">' + esc(tr(lang, 'reply_btn')) + TB.kbx_named__t.k39 + encodeURIComponent(canon.replace(ORIGIN, '')) + '#request">' + esc(tr(lang, 'corr_btn')) + '</a></p>';
const cta = '<p>' + esc(tr(lang, 'cta_txt')) + TB.kbx_named__t.k40 + esc(tr(lang, 'cta_free')) + TB.kbx_named__t.k41 + esc(tr(lang, 'cta_paid')) + '</a></p>';
const factsTxt = [tr(lang, 'g_d', { k: L.length, dev: name, mks: mks.map(m => mkName(m, lang)).join(', ') }), tr(lang, 'g_d_pn', { pn, k: L.length }), P.length ? tr(lang, 'g_d_rec', { p: P.length, kept: cnt('kept'), broken: cnt('broken'), moved: cnt('moved'), pending: cnt('pending') }) : '', cc33.length ? t33(lang, cc33.length > 1 ? 'dc_ccn' : 'dc_cc', { no: cc33[0].no, court: cc33[0].court, d: fd(cc33[0].date, lang), k: num(cc33.length, lang) }) : '', FLu.length ? FLu.map(f => tr(lang, 'rc_' + f[0])).join('; ') + '.' : cc33.length ? '' : tr(lang, 'no_reports')].filter(Boolean).join(' ');
const FAQ = [[tr(lang, 'q_dlegit', { dev: name }), tr(lang, 'a_dlegit', { facts: factsTxt })],
[tr(lang, 'q_dcompl', { dev: name }), FLu.length ? tr(lang, 'a_dcompl_some', { list: [...new Set(FLu.map(f => tr(lang, 'rc_' + f[0])))].join('; ') }) : cc33.length ? t33(lang, cc33.length > 1 ? 'dc_ccn' : 'dc_cc', { no: cc33[0].no, court: cc33[0].court, d: fd(cc33[0].date, lang), k: num(cc33.length, lang) }) : tr(lang, 'a_dcompl_none')],
[tr(lang, 'q_dproj', { dev: name }), L.map(x => x.n + ' (' + mkName(x.mk, lang) + ')').join(', ') + '.']];
FAQ.splice(1, 0, [tr(lang, 'q_dreg', { dev: name }), gl.matches.length ? gl.matches.slice(0, 2).map(m => tr(lang, 'gleif_found', { legal: m.legal, lei: m.lei, jur: m.jur, st: m.st, ls: m.ls, reg: fd(m.reg, lang) })).join(' ') : gl.ok ? tr(lang, 'a_dreg_none', { d: fd(gl.at, lang) }) : tr(lang, 'a_dreg_err')]);
if (fx.developer_company && cleanOk(String(fx.developer_company))) FAQ[1][1] += ' ' + tr(lang, 'df_company') + ': ' + String(fx.developer_company) + ' (' + tr(lang, 'dfacts_src', { n: dsrc('developer_company').n }) + ').';
FAQ.splice(2, 0, [tr(lang, 'q_ddeliv', { dev: name }), P.length ? tr(lang, 'g_d_rec', { p: P.length, kept: cnt('kept'), broken: cnt('broken'), moved: cnt('moved'), pending: cnt('pending') }) : tr(lang, 'drec_none')]);
if (FD) FAQ.splice(3, 0, FD.faq);
FAQ.push([tr(lang, 'q_drev', { dev: name }), tr(lang, 'a_drev')]);
const dqa = lg => { const m3 = mks.slice(0, 3).map(m => mkName(m, lg)).join(lg === 'ar' ? '، ' : lg === 'zh' ? '、' : ', ') + (mks.length > 3 ? ' +' + (mks.length - 3) : ''); return [['k', t29(lg, 'd_k', { dev: name, k: L.length, mks: m3 })], ['pn', tr(lg, 'g_d_pn', { pn, k: L.length })], ['rec', P.length ? tr(lg, 'g_d_rec', { p: P.length, kept: cnt('kept'), broken: cnt('broken'), moved: cnt('moved'), pending: cnt('pending') }) : ''], ['ac', FD ? strip(devFacets(extra.fac, ix, dv, lg).active) : ''], ['iv', t33(lg, 'iv', { dev: name, r: (cc33.length ? t33(lg, cc33.length > 1 ? 'dc_ccn' : 'dc_cc', { no: cc33[0].no, court: cc33[0].court, d: fd(cc33[0].date, lg), k: num(cc33.length, lg) }) + ' ' : '') + (FLu.length ? [...new Set(FLu.map(f => tr(lg, 'rc_' + f[0])))].join('; ') + '.' : cc33.length ? '' : tr(lg, 'no_reports')) }).trim() || (FLu.length ? [...new Set(FLu.map(f => tr(lg, 'rc_' + f[0])))].join('; ') + '.' : tr(lg, 'no_reports'))], ['chk', qa(lg, 'qa_chk', { d: fd(checked, lg) })]].filter(p => p[1]).sort((a, b) => (b[0] === 'iv') - (a[0] === 'iv')); };
const dtL = L.filter(x => okHttp(x.url) && x.ad && handoverOf(ix, x)), dtP = (lg, n) => n ? t33(lg, 'dt', { list: dtL.slice(0, n).map(x => t33(lg, 'dt_i', { p: x.n, h: fd(handoverOf(ix, x).d, lg), src: (() => { try { return new URL(fixU(x.url)).hostname.replace(/^www\./, ''); } catch (e) { return ''; } })(), d: fd(x.ad, lg) })).join(lg === 'zh' ? '；' : lg === 'ar' ? '؛ ' : '; ') }) : '';
const dqa0 = dqa, dAnsOf = (lg, n) => { const ad = (A, B) => { const i = A.findIndex(p => p[0] === 'iv'); const P = A.slice(); if (B) P.splice(i + 1, 0, ['dt', B]); return P; }; const E = ad(dqa0('en'), dtP('en', n)), G = lg === 'en' ? E : ad(dqa0(lg), dtP(lg, n)); return [E, G]; };
const dDrop = n => n ? ['rep', 'ac', 'rec', 'pn'] : ['rep', 'ac', 'rec'];
let nDt = Math.min(3, dtL.length); while (nDt > 0 && words(devAnswer('en', dAnsOf('en', nDt)[0].filter(p => p[0] !== 'chk').map(p => [p[0], dot(p[1]), dot(p[1])]), dDrop(nDt))) > 60) nDt--;
const [dEn, dL] = dAnsOf(lang, nDt), dAns = devAnswer(lang, dL.filter(p => p[0] !== 'chk').map(p => [p[0], dot(p[1]), (dEn.find(e => e[0] === p[0]) || p)[1]]), dDrop(nDt));
const answer = TB.kbx_named__t.k42 + esc(tr(lang, 'ans_lbl')) + '</b> ' + bidi(lang, esc(dAns), [name]) + TB.kbx_named__t.k43 + esc(checked) + '">' + esc(tr(lang, 'upd_checked', { d: fd(checked, lang) })) + TB.kbx_named__t.k44 + esc(tr(lang, 'ans_more')) + '</a></span></p></div>';
for (const f of FAQ) f[1] = dot(f[1]);
const faq = FAQ.map(([q, a]) => '<details class="kfaq"><summary>' + esc(q) + '</summary><p>' + esc(a) + '</p></details>').join('');
const S = [...new Set(L.flatMap(x => [x.url, x.du]).concat(FLu.map(f => f[1])).filter(okHttp))];
const sources = '<p class="ki">' + esc(tr(lang, 'src_intro')) + '</p><ol class="srcs">' + S.slice(0, 60).map(srcLi).join('') + '</ol>';
const crumbs = [[tr(lang, 'crumb_home'), ORIGIN + pre(lang) + '/'], [tr(lang, 'crumb_devs'), ORIGIN + '/developers/'], [name, canon]];
const body = TB.kbx_named__t.k45 + crumbs.slice(0, 2).map(([l, u]) => '<a href="' + esc(u.replace(ORIGIN, '')) + '">' + esc(l) + '</a>').join(' / ') + '</p><h1>' + h1x(tr(lang, 'h1_d', { dev: name }), name, lang) + '</h1><p class="lead">' + esc(tr(lang, 'lead_d', { dev: name })) + '</p>' + answer + feedLinks(lang, '/developers/' + dv.s + '/', name) + (dv.ids.length >= 2 ? '<p class="k-small"><a href="' + pre(lang) + '/developers/compare/?d=' + dv.s + '">' + esc(TB.kbx_named__t.o_DCL35[lang] || TB.kbx_named__t.o_DCL35.en) + '</a></p>' : '') + '</div></section>' +
'<div class="wrap kwrap">' + sec('glance', bidi(lang, esc(tr(lang, 's_dpub', { dev: name })), [name]), '<ul class="fl glance">' + g.join('') + '</ul>') + sec('projects', esc(tr(lang, 's_dprojects')), projects) + (FD ? sec('promised', bidi(lang, esc(FD.h), [name]), FD.pv) : '') + sec('network', esc(tr(lang, 's_network')), n32xLinks(lang, dv.s) + networkHtml(name, extra.netOk ? gl.matches[0] : extra.fm ? extra.fm.m : null, extra.netOk ? extra.net : extra.fm ? extra.fm.net : null, L, pre(lang), '/developers/' + dv.s + '/', extra.netOk || extra.fm ? null : gl.matches[0], lang) + familyHtml(extra.fam, dv.s, lang, pre(lang)) + NET_CSS + '<script>' + NET_JS + '</script>') + (extra.web && webDevHealthHtml(extra.web, dv.s, lang) ? sec('webhealth', esc(webHeading(lang, 'h')), webDevHealthHtml(extra.web, dv.s, lang)) + sec('weblinks', esc(webHeading(lang, 'l')), webDevLinksHtml(extra.web, dv.s, lang)) : '') + (extra.watch && watchDevHtml(extra.watch, dv.s, lang) ? sec('watch', esc(watchHeading(lang)), watchDevHtml(extra.watch, dv.s, lang)) : '') + (extra.watch && gazDevHtml(extra.watch.gz, dv.s, lang) ? sec('gazette', esc(gazHeading(lang)), gazDevHtml(extra.watch.gz, dv.s, lang)) : '') + sec('record', esc(tr(lang, 's_drecord')), record) +
sec('registers', esc(tr(lang, 's_dreg')), reg) + (extra.fil && filingsDevHtml(extra.fil, dv.s, lang) ? sec('filings', esc(filingsHeading(lang)), filingsDevHtml(extra.fil, dv.s, lang)) : '') + sec('reports', esc(tr(lang, 's_dreports')), reports) + (extra.rs ? sec('answers', esc(rsHeading(lang)), rsDevHtml(extra.rs, dv, lang, first.id)) : '') + sec('reply', esc(tr(lang, 's_reply')), reply + devDash(lang, dv.s)) + sec('cta', esc(tr(lang, 's_cta')), cta) + sec('faq', esc(tr(lang, 's_faq')), faq) + sec('sources', esc(tr(lang, 's_sources')), sources) +
'<p class="ki kfoot">' + tr(lang, 'foot', { d: esc(fd(checked, lang)), link: own('/data-policy/', tr(lang, 'm_data_policy')) }) + '</p></div>';
const ld = { '@context': 'https://schema.org', '@graph': [
{ '@type': 'ProfilePage', '@id': canon + '#page', url: canon, name: title.replace(/ \| Kolaboro$/, ''), description: desc, inLanguage: lang, dateModified: checked, speakable: { '@type': 'SpeakableSpecification', cssSelector: ['#answer .kans-t'] }, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' }, publisher: { '@id': ORIGIN + '/#org' }, mainEntity: { '@id': dUrl('en', dv.s) + '#org' }, breadcrumb: { '@id': canon + '#bc' } },
{ '@type': 'Organization', '@id': ORIGIN + '/#org', name: 'Kolaboro', url: ORIGIN + '/', logo: ORIGIN + '/k/favicon.svg' },
Object.assign({ '@type': 'Organization', '@id': dUrl('en', dv.s) + '#org', name, url: dUrl('en', dv.s), identifier: { '@type': 'PropertyValue', propertyID: 'kolaboro-developer-id', value: dv.s } }, (an => an.length ? { alternateName: an } : {})([...new Set(L.map(x => x.dv).filter(v => v && v !== name))].slice(0, 6)), gl.matches[0] ? { leiCode: gl.matches[0].lei, legalName: gl.matches[0].legal } : {}, { subjectOf: L.slice(0, 50).map(x => ({ '@type': 'WebPage', url: pUrl(lang, x.s), name: x.n })) }),
{ '@type': 'BreadcrumbList', '@id': canon + '#bc', itemListElement: crumbs.map(([l, u], i) => ({ '@type': 'ListItem', position: i + 1, name: l, item: u })) },
...(FQ33 => FQ33.length ? [{ '@type': 'FAQPage', '@id': canon + '#faq', mainEntity: FQ33.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] : [])(faq33(FAQ, lang))] };
return { title, desc, canon, body, ld, lastmod: checked, alt: l => dUrl(l, dv.s), feed: { path: '/developers/' + dv.s + '/', name } };
}
function indexPage(ix, lang) {
const by = new Map(); for (const x of ix.P) { if (!by.has(x.mk)) by.set(x.mk, []); by.get(x.mk).push(x); }
const mks = [...by.keys()].sort((a, b) => by.get(b).length - by.get(a).length);
const canon = ORIGIN + pre(lang) + '/projects/', title = tr(lang, 'title_i'), desc = tr(lang, 'lead_i', { k: nf28(lang, ix.P.length), m: nf28(lang, mks.length) });
const hidN = (ix.named.projects || []).filter(x => ix.caseBy.has(x.id) && COI_MARKETS.has(String(x.mk || '').toLowerCase())).length;
const body = TB.kbx_named__t.k46 + pre(lang) + '/">Kolaboro</a></p><h1>' + esc(tr(lang, 'h1_i')) + '</h1><p class="lead">' + esc(desc) + '</p>' + (hidN ? '<p class="k-small k-muted">' + esc(TB.kbx_named__t.o_COI28[lang] || TB.kbx_named__t.o_COI28.en).replace('{a}', '<a href="/independence/">').replace('{b}', '</a>') + '</p>' : '') + searchBox(lang, ix.P.length, ix.devs.size) + filterBar(lang) + '</div></section>' + LL_CSS + leastHtml(ix, lang, 24, iso(ix.updated)) + TB.kbx_named__t.k47 +
'<details class="kmkt"><summary>' + esc(tr(lang, 'jump_mk')) + ' (' + mks.length + ')</summary><p>' + mks.map(m => '<a href="#m-' + slugM(m) + '">' + esc(mkName(m, lang)) + ' <small>' + by.get(m).length + '</small></a>').join('') + '</p></details>' +
mks.map(m => '<section class="ks"><h2 id="m-' + slugM(m) + '">' + esc(mkName(m, lang)) + ' <small>' + by.get(m).length + '</small></h2><ul class="lk cols">' + by.get(m).sort((a, b) => a.n.localeCompare(b.n)).map(x => '<li><a href="' + pre(lang) + '/projects/' + x.s + '/">' + esc(x.n) + '</a>' + (x.dv ? ' <small>' + esc(x.dv) + '</small>' : '') + '</li>').join('') + '</ul></section>').join('') + '</div>';
const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', url: canon, name: title.replace(/ \| Kolaboro$/, ''), description: desc, inLanguage: lang, dateModified: iso(ix.updated),
mainEntity: { '@type': 'ItemList', name: tr(lang, 'jump_mk'), numberOfItems: Math.min(30, mks.length), itemListOrder: TB.kbx_named__t.k48, itemListElement: mks.slice(0, 30).map((m, i) => ({ '@type': 'ListItem', position: i + 1, name: mkName(m, lang), url: ORIGIN + '/m/' + slugM(m) + '/' })) } };
return { title, desc, canon, body, ld, lastmod: iso(ix.updated), alt: l => ORIGIN + pre(l) + '/projects/' };
}
const CSS = '';
const JS = "(function(){var b=document.querySelector('[data-live]');if(!b)return;var w=b.closest('.klive'),o=w.querySelector('.live-out'),L=JSON.parse(w.getAttribute('data-lk')||'{}'),M=JSON.parse(w.getAttribute('data-msg')||'{}');" +
"b.addEventListener('click',function(){b.disabled=true;o.textContent=M.wait;var q=new URLSearchParams();Object.keys(L).forEach(function(k){if(L[k])q.set(k,L[k]);});" +
"fetch('/api/kb/lookup?'+q.toString(),{headers:{accept:'application/json'}}).then(function(r){return r.json();}).then(function(d){if(!d||!d.checks){o.textContent=M.err;b.disabled=false;return;}" +
"var ul=document.createElement('ul');ul.className='fl';d.checks.forEach(function(c){var li=document.createElement('li');var s=c.status==='found'?M.found:c.status==='not_found'||c.status==='not_published'?M.nf:M.un;li.textContent=(c.source||c.id)+': '+s+(c.note?' ('+String(c.note).slice(0,160)+')':'');" +
"if(c.source_url){var a=document.createElement('a');a.className='src';a.href=c.source_url;a.rel='nofollow noopener';a.target='_blank';try{a.textContent=new URL(c.source_url).hostname;}catch(e){a.textContent='source';}li.appendChild(document.createTextNode(' '));li.appendChild(a);}ul.appendChild(li);});" +
"o.textContent='';o.appendChild(ul);if(d.seal&&d.seal.result_url){var p=document.createElement('p');var a2=document.createElement('a');a2.href=d.seal.result_url;a2.textContent=M.open+' (SHA-256 '+d.seal.root_sha256.slice(0,12)+'...)';p.appendChild(a2);o.appendChild(p);}b.disabled=false;})" +
".catch(function(){o.textContent=M.err;b.disabled=false;});});})();";
function h1x(h, name, lang) { if (h.indexOf(name) !== 0 || h.length <= name.length) return esc(h); const t = h.slice(name.length), m = t.match(/^\s*[:\uFF1A]\s*/); return '<bdi' + LNX(lang) + '>' + esc(name) + '</bdi>' + (m ? esc(m[0].trim()) + ' ' : '') + '<span class="kh1s">' + esc(m ? t.slice(m[0].length) : t) + '</span>'; }
function cardify(html) {
return html.replace(/<div class="tw"><table><thead><tr>([\s\S]*?)<\/tr><\/thead><tbody>([\s\S]*?)<\/tbody><\/table><\/div>/g, (m, hr, rows) => {
const L = (hr.match(/<th[^>]*>([\s\S]*?)<\/th>/g) || []).map(t => t.replace(/<[^>]+>/g, '').replace(/"/g, '&quot;').trim());
const out = rows.replace(/<tr([^>]*)>([\s\S]*?)<\/tr>/g, (m2, ta, cells) => { let i = 0; return '<tr' + ta + '>' + cells.replace(/<(td|th)(\s[^>]*)?>/g, (m3, tg, at) => { const l = L[i++] || ''; return '<' + tg + (at || '') + (l && tg === 'td' ? ' data-l="' + l + '"' : '') + '>'; }) + '</tr>'; });
return TB.kbx_named__t.k49 + hr + '</tr></thead><tbody>' + out + '</tbody></table></div>';
});
}
const D12CSS = '';
const KP_CSS = '<link rel="stylesheet" href="/k/kp.css?v=5127b23b2b">';
const CV = '<script>if(location.hash)document.documentElement.classList.add("kb-h")</script><style id="kcv-css">html:not(.kb-h) .kwrap section.ks{content-visibility:auto;contain-intrinsic-size:auto 700px}html:not(.kb-h) .kwrap section.kz{content-visibility:visible}@media print{html:not(.kb-h) .kwrap section.ks{content-visibility:visible}}</style>';
function head(pg, lang) {
  const alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + pg.alt(l) + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + pg.alt('en') + '">';
  return '<title>' + esc(pg.title) + '</title><meta name="description" content="' + esc(pg.desc) + '"><link rel="canonical" href="' + pg.canon + '">' + alts +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="Kolaboro"><meta property="og:title" content="' + esc(pg.title) + '"><meta property="og:description" content="' + esc(pg.desc) + '"><meta property="og:url" content="' + pg.canon + '"><meta property="og:locale" content="' + (LOCALE[lang] || 'en-GB').replace('-', '_') + '">' +
    (pg.feed ? '<meta property="og:image" content="' + ORIGIN + '/og' + pg.feed.path.replace(/\/$/, '') + '.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="' + esc(tr(lang, 'og_alt', { n: pg.feed.name })) + '"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="' + ORIGIN + '/og' + pg.feed.path.replace(/\/$/, '') + '.png">' : '<meta property="og:image" content="' + ORIGIN + '/k/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="' + ORIGIN + '/k/og.png">') + '<meta name="robots" content="' + (pg.noindex ? 'noindex' : 'index, follow, max-image-preview:large, max-snippet:-1') + '">' +
    (pg.feed ? '<link rel="alternate" type="application/atom+xml" title="' + esc(pg.feed.name) + ' (Atom)" href="' + pg.feed.path + 'feed.atom"><link rel="alternate" type="application/feed+json" title="' + esc(pg.feed.name) + ' (JSON Feed)" href="' + pg.feed.path + 'feed.json">' : '') + (pg.feed ? ((m, d) => m ? '<link rel="alternate" type="text/markdown" title="' + esc(pg.feed.name) + ' (Markdown)" href="/projects/' + m[1] + '.md">' : d ? '<link rel="alternate" type="text/markdown" title="' + esc(pg.feed.name) + ' (Markdown)" href="/answers/developer/' + d[1] + '.md">' : '')(/^\/projects\/([a-z0-9-]{1,90})\/$/.exec(pg.feed.path), /^\/developers\/([a-z0-9-]{1,90})\/$/.exec(pg.feed.path)) : '') +   // n33a (item 81): the Markdown copy of the page for assistants
    '<script type="application/ld+json">' + JSON.stringify(pg.ld).replace(/</g, '\\u003c') + '</script>' + KP_CSS + CV;
}
async function assemble(pg, lang, shellRes) {
const msg = { wait: tr(lang, 'live_wait'), err: tr(lang, 'live_err'), found: tr(lang, 'live_found'), nf: tr(lang, 'live_notfound'), un: tr(lang, 'live_unavail'), open: tr(lang, 'live_open') };
const body = cardify(pg.body).replace('<div class="klive" ', '<div class="klive" data-msg="' + esc(JSON.stringify(msg)) + '" ');
const tags = head(pg, lang);
const res = new HTMLRewriter()
.on('title', { element(e) { e.remove(); } })
.on(TB.kbx_named__s.k1, { element(e) { e.remove(); } })
.on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
.on('head', { element(e) { e.append(tags, { html: true }); } })
.on('main', { element(e) { e.setInnerContent(body + (/data-live|data-kw|data-kx|data-kn=|data-kf=|data-u27/.test(body) ? '<script src="/k/u27.js?v=' + U27_SRC_V + '" defer></script>' : ''), { html: true }); } })
.on('div.mcta', { element(e) { const m = /^\/projects\/([a-z0-9-]{1,90})\/$/.exec((pg.feed && pg.feed.path) || ''); if (m) e.replace(ctaHtml(lang, m[1]), { html: true }); } })
.on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) e.setAttribute('href', pg.alt(l).replace(ORIGIN, '')); } })
.transform(new Response(shellRes.body, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
return await res.text();
}
const RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(projects|developers)\/(?:([a-z0-9-]{1,90})\/?)?$/;
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:projects|developers)(?:\/|$)|^\/api\/seo\/(?:urls|scan)$/;
function jsonOut(o, s, extra) { return new Response(JSON.stringify(o), { status: s || 200, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=600' }, extra || {}) }); }
export const NAMED_CLIENT_JS = [JS, W9JS, NX_JS, KF_JS].join('\n');
export const U27_SRC_V = CACHE_V.replace('named-', '') + '.' + U27V;
const PREV_V = (n => n > 2 ? ['named-v' + (n - 1), 'named-v' + (n - 2)] : [])(+(CACHE_V.match(/^named-v(\d+)$/) || [0, 0])[1]);
export { data, scanHtml, lastmod, handoverOf, reviewed, isListing, fd, tr, iso, okHttp, fixU, host, cleanOk, assemble, esc, pre };
export async function officialDomains(env, id) {
const ix = await data(env), x = ix.byId.get(String(id || '').toUpperCase());
if (!x) return { named: false, domains: [] };
return { named: true, slug: x.s, domains: [...new Set([x.url, x.du].filter(u => okHttp(u) && !isListing(u)).map(host).filter(Boolean))] };
}
let RDY = { t: 0, n: 0 };
async function repliesPublished() {
if (Date.now() - RDY.t < 60000) return RDY.n;
try { const d = await rpc('kolaboro_i_ready', {}); RDY = { t: Date.now(), n: (d && d.replies_published) || 0 }; } catch (e) { RDY = { t: Date.now(), n: RDY.n }; }
return RDY.n;
}
export async function redirectP(u, env) {
try {
const ix = await data(env), id = (decodeURIComponent(u.pathname.split('/')[2] || '') || u.searchParams.get('id') || '').toUpperCase();
const x = ix.byId.get(id); if (!x) return null;
return new Response(null, { status: 301, headers: { location: '/projects/' + x.s + '/', 'cache-control': 'public, max-age=86400' } });
} catch (e) { return null; }
}
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
export async function render(ix, kind, key, lang, env, ctx) {
try { await loadS31(env); } catch (e) {}
try { await loadS32(env); } catch (e) {}
if (kind === 'i') return indexPage(ix, lang);
if (kind === 'projects') {
const x = ix.bySlug.get(key); if (!x) return null;
const soft = (f, d) => (async () => { try { return await f(); } catch (e) { return d; } })();
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
timed('paper', soft(() => paperData(env), null)),
timed('see', soft(() => seeData(env), null)),
timed('money', soft(() => moneyData(env), null)),
timed('land', soft(() => landData(env), null)),
timed('around', soft(() => aroundData(env), null)),
timed('tr', soft(() => trProject(env, x.id, lang), null)),
timed('fac', soft(() => facetsData(env), null)),
timed('ru29', soft(() => rulesData(env), null)),
timed('wb', soft(() => wbData(env), null)),
soft(() => ppmLoad(env), null),
]);
dbSlow = dbSlow && !(dbDone.rv && dbDone.dr);
const fc = fcs.fc, fdg = fcs.fdg;
const hold = PIN_HOLD[x.id], off = pinOff(x);
if (hold) { sat = null; see = null; money = null; }
if (hold || off(land && land.lr && land.lr.projects && land.lr.projects[x.id] && land.lr.projects[x.id].pin)) land = null;
if (hold || off(aroundPin(around, x.id))) around = null;
if (paper && paper.pl && paper.pl.projects && paper.pl.projects[x.id] && (hold || off(paper.pl.projects[x.id].pin))) paper = Object.assign({}, paper, { pl: Object.assign({}, paper.pl, { projects: Object.assign({}, paper.pl.projects, { [x.id]: undefined }) }) });
const pg = projectPage(ix, x, lang, { reviews, replies, ph, sat, fc, fdg, web, coh, paper, see, money, land, around, trb: trp ? trp.badge : '', trp, fac, ru29, wb }); if (phErr || dbSlow) pg.nocache = true;
pg.tm = Object.keys(tm).map(k => k + ';dur=' + tm[k]).join(', ');
return pg;
}
const dv = ix.devs.get(key); if (!dv) return null;
const softD = f => (async () => { try { return await f(); } catch (e) { return null; } })();
const [gn, rs, web, fam, watch, fil, fac, cc] = await Promise.all([
(async () => { const gl = await gleif(dv.n, ctx), m0 = gl.matches[0], cs = new Set(dv.ids.map(i => ix.byId.get(i)).filter(Boolean).map(x => TB.kbx_named__t.o_COUNTRY_ISO[x.co] || x.co));
const netOk = !!(m0 && cs.has(m0.country)), net = netOk ? await gleifNet(m0.lei, ctx) : null;
return { gl, netOk, net }; })(),
softD(() => rsData(env)), softD(() => webData(env)), softD(() => familyData(env)), softD(() => watchData(env)), softD(() => filingsData(env)), softD(() => facetsData(env)), softD(() => ccData33(env))]);
const gl = gn.gl, netOk = gn.netOk, net = gn.net;
return devPage(ix, dv, lang, { gleif: gl, net, netOk, rs, web, fam, fm: netOk ? null : famNet(fam, dv.s), watch, fil, fac, cc });
}
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname;
if (p === '/api/seo/urls') return urls(env);
if (p === '/api/seo/scan') return scan(u, env);
const dm = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?projects\/([a-z0-9-]{1,90})\/changes\/(?:([0-9a-f]{64})\.txt)?$/);
if (dm && !(dm[1] && dm[3])) { let ix; try { ix = await data(env); } catch (e) { return null; } const x = ix.bySlug.get(dm[2]); if (!x) return null; return diffRoute(req, u, env, ctx, shell, x, dm[3] || null, dm[1] || 'en'); }
if (/^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?projects$/.test(p)) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
const m = p.match(RX); if (!m) return null;
const lang = m[1] || 'en', kind = m[2], key = m[3];
if (!key && kind === 'developers') return null;
if (key && kind === 'developers' && RESERVED.has(key)) return null;
if (!p.endsWith('/')) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
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
const t1 = Date.now(), shP = shell(pre(lang) + '/how-we-score/'); shP.catch(() => {});
const pg = await render(ix, key ? kind : 'i', key, lang, env, ctx);
if (pg && key) try { await seoLd(pg, env, kind, key, await lmFiles(ix, env)); } catch (e) {}
updLine(pg);
const t2 = Date.now(), sh = await shP;
if (!pg) {
const nf = { title: tr(lang, 'nf_h') + ' | Kolaboro', desc: tr(lang, 'nf_p'), canon: ORIGIN + p, noindex: true, body: (await import('./kbx_404.js')).helpBody(lang, tr(lang, 'nf_h'), tr(lang, 'nf_p')), ld: { '@context': 'https://schema.org', '@type': 'WebPage', name: tr(lang, 'nf_h') }, lastmod: '', alt: l => ORIGIN + pre(l) + '/projects/' };
if (key && await staleIsolate(env)) return new Response(await assemble(nf, lang, sh), { status: 503, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'retry-after': '30', 'x-robots-tag': 'noindex' } });
return new Response(await assemble(nf, lang, sh), { status: 404, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' } });
}
const html = await assemble(pg, lang, sh), lm = new Date((pg.lastmod || '2026-11-01') + 'T00:00:00Z').toUTCString(), t3 = Date.now();
if (!pg.nocache) try { const put = fastPut(fk, html, await dataVer(ix, env, kind, key), lm); if (ctx && ctx.waitUntil) ctx.waitUntil(put.catch(() => {})); } catch (e) {}
return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'x-named-cache': 'miss', 'cache-control': 'no-cache', 'last-modified': lm, 'server-timing': 'data;dur=' + (t1 - t0) + ', render;dur=' + (t2 - t1) + ', page;dur=' + (t3 - t2) + (pg.tm ? ', ' + pg.tm : '') } });
}
function updLine(pg) {
if (!pg || !pg.upd || !pg.lastmod || !iso(pg.lastmod)) return;
const d = iso(pg.lastmod), l = pg.upd.lang;
const chk = pg.upd.k === 'chk' && (!pg.upd.d || pg.upd.d === d);
pg.body = pg.body.replace(pg.upd.html, '<p class="kupd"><time datetime="' + d + '">' + esc(chk ? tr(l, 'upd_checked', { d: fd(d, l) }) : qa(l, 'upd_on', { d: fd(d, l) })) + '</time>' + (pg.upd.id || '') + '</p>');
}
async function lmFiles(ix, env) {
try {
const [prom, find, prog] = await Promise.all([loadJson(env, 'promises.json'), loadJson(env, 'findings-by-project.json'), satData(env)]);
if (!prom || !find || !prog) return null;
return { named: ix.named, cases: ix.cases, caseBy: ix.caseBy, prom, find, prog, raw: x => RAWN.has(x) ? Object.assign({}, x, { n: RAWN.get(x) }) : x };
} catch (e) { return null; }
}
const FAST_FRESH = 60000, FAST_TTL = 259200, REFRESHING = new Set();
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
if (!pg) return caches.default.delete(fk);
if (key) try { await seoLd(pg, env, kind, key, await lmFiles(ix, env)); } catch (e) {}
updLine(pg);
if (pg.nocache) return;
const html = await assemble(pg, lang, await shell(pre(lang) + '/how-we-score/'));
return fastPut(fk, html, ver, new Date((pg.lastmod || '2026-11-01') + 'T00:00:00Z').toUTCString());
}
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
const tps = await Promise.all(ix.P.map(x => trProject(env, x.id, 'en').catch(() => null)));
ix.P.forEach((x, i) => add('project', l => pUrl(l, x.s), { id: x.id, reviewed: reviewed(ix.caseBy.get(x.id)), facts: facts6(ix, x), sm: facts6(ix, x) >= 2 && !(DUP_OF[x.id] && ix.byId.has(DUP_OF[x.id])) }, lastmod(ix, x), { summary: quickAnswer(ix, x, 'en', tps[i]), images: projImages(x, 'en', pUrl('en', x.s), PIN_HOLD[x.id] ? null : sat).map(i => ({ loc: i.contentUrl, title: i.name, caption: i.caption })), added: x.ad || null, listing_page: okHttp(x.url) && isListing(x.url), name: x.n, developer: x.dv || null, developer_url: x.dvs && ix.devs.has(x.dvs) ? dUrl('en', x.dvs) : null, market: x.mk, country: x.co  }));
for (const d of ix.devs.values()) { const lm = d.ids.map(i => lastmod(ix, ix.byId.get(i))).sort(); add('developer', l => dUrl(l, d.s), { sm: d.ids.length >= 2 }, lm[lm.length - 1], { name: d.n, projects: d.ids }); }
return jsonOut({ version: 'seo-urls-1', updated: ix.updated, languages: LANGS, note: TB.kbx_named__s.k2,
counts: { projects: ix.P.length, developers: ix.devs.size, languages: LANGS.length, urls: out.length }, redirects: [{ from: '/p/{id}/', to: '/projects/{slug}/', status: 301 }], urls: out });
}
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
