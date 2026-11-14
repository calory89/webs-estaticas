// kolaboro.com batch 29 (agent n29h1, 14 Nov 2026): place pages with data no other page on the site shows (items 16 to 25 of the
// n29 list). No model calls, nothing estimated, nothing stored. Every figure is computed from the published data files at the edge
// (named.json through kbx_named.js and kbx_facets.js, the transparency index of kbx_tr.js, around.json for airport points).
// Anti-thin rule: a page exists only where at least 5 projects carry the data it lists; otherwise the URL answers 404 and is in no
// sitemap. Routes (8 languages, prefix /es /de /fr /nl /ru /zh /ar):
//   GET /rankings/developers/[<place>/]      item 16: developers ranked by the median transparency score of their projects in a place
//                                            (places with 5+ developers and 10+ projects); the hub also lists the comparisons
//   GET /permits/[<place>/]                  item 17: projects that publish a permit or licence number (5+ per place)
//   GET /price-ranges/[<place>/]             item 18: projects by published entry price range, one currency per place, never converted
//                                            (10+ priced projects, ranges with 5+ listed)
//   GET /ownership/[<country>/]              item 19: freehold or leasehold for foreigners, the law restated with its official link
//                                            (notes and sources of kbx_buy.js, read 3 and 13 Nov 2026; Dubai Law 7 of 2006 read 14 Nov 2026)
//   GET /golden-visa/[<programme>/]          item 20: projects at a residence-by-investment threshold set on an official page (UAE AED 2
//                                            million: DLD and ADDED pages; Cyprus EUR 300,000 plus VAT: CRMD page; all read 14 Nov 2026)
//   GET /airports/[<iata>/]                  item 21: projects within 25 km in a straight line of an international airport point
//                                            (OpenStreetMap, from around.json), pins with 3+ decimals not shared with another project
//   GET /reports/[<place>/]                  items 23 and 24: monthly off-plan market report of the current month (15+ projects),
//                                            with the projects added this month (named.json "ad", the day we added the record)
//   GET /developers/<a>-vs-<b>/              item 25: two developers with 5+ projects each in the same place, side by side
//   GET /reports/sitemap.xml                 every URL above with hreflang alternates and real lastmod (listed by kbx_seo.js)
// Item 22 (projects under 1 km from the beach) is not built: around.json measures the beach for 125 pins and no place has 5 of them
// within 1 km (13 Nov data), so a page would break the anti-thin rule.
// Conflict of interest: facetsData drops Eco Beach City and Equinox; kbx_named.js drops Sumba projects.
import { facetsData, FA_KIT } from './kbx_facets.js';
import { trData } from './kbx_tr.js';
import { TR_PLACES } from './kbx_tr_places.js';
import { handoverOf, overdueOf, fd, esc, pre, lastmod, okHttp, host } from './kbx_named.js';
import { mkName, placeName, coName } from './kbx_hdate.js';
import { NT } from './kbx_buy_notes.js';
import { H } from './kbx_h29_i18n.js';

const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:rankings\/developers(?:\/[a-z0-9-]{2,60})?|permits(?:\/[a-z0-9-]{2,60})?|price-ranges(?:\/[a-z0-9-]{2,60})?|ownership(?:\/[a-z-]{2,30})?|golden-visa(?:\/[a-z-]{2,30})?|airports(?:\/[a-z]{3})?|reports(?:\/[a-z0-9-]{2,60})?|developers\/[a-z0-9-]{2,100}-vs-[a-z0-9-]{2,100})\/?$|^\/reports\/sitemap\.xml$/;
export const SITEMAP = '/reports/sitemap.xml';
const MIN = 5, DR_DEV = 5, DR_PROJ = 10, PR_PRICED = 10, RP_PROJ = 15, AP_KM = 25;
const { CSS, crumbHtml, crumbLd, kv, faqLd, replyBox, regFor } = FA_KIT;

// ------------------------------------------------------------------------------------------------ helpers
const t = (lang, k, v) => { let s = (H[lang] && H[lang][k] != null) ? H[lang][k] : H.en[k]; if (s == null) return k; if (typeof s !== 'string') return s; if (v) s = s.replace(/\{(\w+)\}/g, (m, a) => v[a] != null ? v[a] : m); return s; };
const te = (lang, k, v) => esc(t(lang, k, v));
const th = (lang, k, v) => { const s = esc(t(lang, k)); return v ? s.replace(/\{(\w+)\}/g, (m, a) => v[a] != null ? v[a] : m) : s; };   // values are HTML already
const nf = (lang, n, d) => { try { return Number(n).toLocaleString(LOC[lang] || 'en-GB', { maximumFractionDigits: d == null ? 0 : d }); } catch (e) { return String(n); } };
const bdi = s => '<bdi>' + esc(s) + '</bdi>';
const slugA = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const slugM = m => encodeURIComponent(String(m).toLowerCase().replace(/\s+/g, '-'));   // /m/<market>/ (kolaboro.js)
const PUB = (lang, path) => ORIGIN + pre(lang) + path;
const moneyT = (lang, cur, v) => (cur ? cur + ' ' : '') + nf(lang, v);
const money = (lang, cur, v) => '<bdi dir="ltr">' + esc(moneyT(lang, cur, v)) + '</bdi>';
const clen = s => [...String(s)].length;
const cutW = (s, n) => { const a = [...s]; if (a.length <= n) return s; const c = a.slice(0, n).join(''); const k = c.lastIndexOf(' '); return (k > n * 0.6 ? c.slice(0, k) : c).replace(/[\s,;:·(]+$/, ''); };
const fitT = (...c) => c.find(x => clen(x) <= 60) || cutW(c[c.length - 1], 60);
const fitD = (...c) => { const f = c.find(x => clen(x) <= 155); if (f) return f; let d = c[c.length - 1]; const S = d.split(/(?<=[.。])\s*/).filter(Boolean); while (S.length > 1 && clen(S.join(' ')) > 155) S.pop(); d = S.join(/[。]/.test(d) ? '' : ' '); return clen(d) <= 155 ? d : cutW(d, 154) + '.'; };
const median = a => { const s = a.filter(v => v != null && isFinite(v)).sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null; };
const quant = (a, q) => { const s = a.slice().sort((x, y) => x - y); if (!s.length) return null; const p = (s.length - 1) * q, lo = Math.floor(p), hi = Math.ceil(p); return s[lo] + (s[hi] - s[lo]) * (p - lo); };
const maxS = a => a.filter(Boolean).sort().pop() || null;
const today = () => new Date().toISOString().slice(0, 10);
const faqHtml = (lang, Q) => '<h2 id="faq">' + te(lang, 'faq_h') + '</h2><div class="k-disc">' + Q.map(([q, a]) => '<details><summary>' + esc(q) + '</summary><p>' + esc(a) + '</p></details>').join('') + '</div>';
const table = (cols, rows, numCols) => '<div class="k-table-wrap"><table class="k-table k-table--dense k-table--stack"><thead><tr>' + cols.map(c => '<th scope="col">' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' +
  rows.map(cells => '<tr>' + cells.map((c, i) => '<td' + (numCols && numCols.includes(i) ? ' class="k-n"' : '') + ' data-label="' + esc(cols[i]) + '">' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
const srcA = (u, label) => okHttp(u) ? ' <a class="src" href="' + esc(u.trim()) + '" rel="nofollow noopener" target="_blank">' + esc(label || host(u)) + '</a>' : '';

// ------------------------------------------------------------------------------------------------ data
const SHARED = (globalThis.__kbJson = globalThis.__kbJson || {}), LOADING = {};
async function load(env, name) {
  const m = SHARED[name]; if (m && (m.a || Date.now() - m.t < 600000)) return m.v;
  if (LOADING[name]) return LOADING[name];
  const p = (async () => {
    let r = null, a = false;
    try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); a = !!(r && r.ok); } catch (e) { r = null; }
    if (!r || !r.ok) { try { r = await fetch(ORIGIN + '/data/' + name, { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
    if (!r || !r.ok) return null;
    const v = await r.json().catch(() => null); if (v) SHARED[name] = { t: Date.now(), v, a }; return v;
  })();
  LOADING[name] = p; const done = () => { if (LOADING[name] === p) delete LOADING[name]; }; p.then(done, done);
  return p;
}

// price ranges per currency: round numbers near USD 250k, 500k and 1M (AED: 1M, 2M, 4M, so the UAE golden visa threshold is a bound)
const BANDS = { USD: [250e3, 5e5, 1e6], EUR: [250e3, 5e5, 1e6], GBP: [250e3, 5e5, 1e6], AED: [1e6, 2e6, 4e6], SAR: [1e6, 2e6, 4e6], QAR: [1e6, 2e6, 4e6], THB: [5e6, 1e7, 2e7], IDR: [4e9, 8e9, 16e9], MYR: [1e6, 2e6, 4e6], PHP: [1e7, 25e6, 5e7], EGP: [1e7, 25e6, 5e7], MXN: [5e6, 1e7, 2e7], AUD: [5e5, 1e6, 2e6], CAD: [5e5, 1e6, 2e6], BRL: [1e6, 2e6, 4e6], OMR: [1e5, 2e5, 4e5], BHD: [1e5, 2e5, 4e5], JPY: [5e7, 1e8, 2e8], PLN: [5e5, 1e6, 2e6], LKR: [5e7, 1e8, 2e8], INR: [1e7, 2e7, 4e7] };
const curOf = x => String((x.fx && x.fx.currency) || '').toUpperCase().trim();
const pmin = x => (x.fx && +x.fx.price_min > 0) ? +x.fx.price_min : null;
const pmax = x => (x.fx && +x.fx.price_max > 0) ? +x.fx.price_max : null;

// official sources (n: name, u: URL, d: date read). Law notes of kbx_buy_notes.js keep the sources and dates of kbx_buy.js.
const SRC = {
  id_uupa: { n: 'Law No. 5 of 1960 (UUPA), Articles 21(1) and 26(2)', u: 'https://peraturan.go.id/files/UU0051960.pdf', d: '2026-11-03' },
  id_uupa_sewa: { n: 'Law No. 5 of 1960 (UUPA), Articles 44(1) and 45', u: 'https://peraturan.go.id/files/UU0051960.pdf', d: '2026-11-03' },
  id_pp18: { n: 'Government Regulation No. 18 of 2021, Articles 52, 71 and 72', u: 'https://www.peraturan.go.id/files3/pp-no-18-tahun-2021_asli.pdf', d: '2026-11-03' },
  th_dol: { n: 'Department of Lands', u: 'https://www.dol.go.th/', d: '2026-11-13' },
  th_condo: { n: 'Condominium Act B.E. 2522, sections 19 bis and 19 ter', u: 'https://www.dol.go.th/media/716929789247754240/migration/2025/10/6Wp3Tk7hgK5HdDRuvYXGcNsi.pdf', d: '2026-11-03' },
  mx_lie: { n: 'Ley de Inversión Extranjera, Articles 2 (VI), 11 and 13', u: 'https://www.ordenjuridico.gob.mx/Documentos/Federal/html/wo14.html', d: '2026-11-13' },
  ae_l7: { n: 'Dubai Law No. 7 of 2006 Concerning Real Property Registration, Article 4', u: 'https://dlp.dubai.gov.ae/Legislation%20Reference/2006/Law%20No.%20(7)%20of%202006.html', d: '2026-11-14' },
  ae_dld_gv: { n: 'Dubai Land Department: Request for Golden Visa (Investor)', u: 'https://dubailand.gov.ae/en/eservices/request-for-golden-visa-investor/', d: '2026-11-14' },
  ae_added_gv: { n: 'Abu Dhabi ADDED: Visa for real estate investors', u: 'https://www.added.gov.ae/en/live/long-term-residency/abu-dhabi-golden-visa/Investors/visa-for-real-estate-investors', d: '2026-11-14' },
  cy_crmd: { n: 'Civil Registry and Migration Department: immigration permit, Regulation 6(2)', u: 'https://moi.gov.cy/moi/CRMD/crmd.nsf/immigrationpfi_en/immigrationpfi_en', d: '2026-11-14' }
};
// item 19: countries where the law limits what a foreigner can hold; note keys of NT (kbx_buy_notes.js) or of H (ow_ae_note)
const OWN = [
  { s: 'indonesia', co: ['Indonesia'], notes: [['n_id_milik', 'id_uupa'], ['n_id_pakai', 'id_pp18'], ['n_id_sewa', 'id_uupa_sewa']], q1: 'n_id_pakai' },
  { s: 'thailand', co: ['Thailand'], notes: [['n_th_land', 'th_dol'], ['n_th_quota', 'th_condo']], q1: 'n_th_quota' },
  { s: 'mexico', co: ['Mexico'], notes: [['n_mx_trust', 'mx_lie']], q1: 'n_mx_trust' },
  { s: 'uae', co: ['UAE', 'United Arab Emirates'], notes: [['ow_ae_note', 'ae_l7']], q1: 'ow_ae_note' }
];
const noteT = (k, lang) => (NT[k] && (NT[k][lang] || NT[k].en)) || t(lang, k);
const tenure = s => { s = String(s || '').toLowerCase();
  const tr = /fideicomiso|bank trust/.test(s), fh = /freehold|full ownership|title deed|hak milik|\bshm\b|full title|fee simple|direct (title|ownership)|title directly|own property .*directly|hold title directly|escritura|tapu|chanote|outright/.test(s), lh = /leasehold|\blease|hak pakai|hak sewa|\bhgb\b|usufruct|right of use/.test(s);
  if (tr && !fh && !lh) return 'trust'; if ((fh && lh) || (tr && (fh || lh))) return 'mixed'; return fh ? 'freehold' : lh ? 'leasehold' : 'other'; };
// item 20: thresholds set on official pages
const GV = [
  { s: 'uae', co: ['UAE', 'United Arab Emirates'], cur: 'AED', th: 2e6, src: ['ae_dld_gv', 'ae_added_gv'] },
  { s: 'cyprus', co: ['Cyprus'], cur: 'EUR', th: 3e5, src: ['cy_crmd'] }
];
// item 21: international airports (IATA) whose OpenStreetMap point is in around.json
const AIRPORTS = new Set(['DXB', 'DWC', 'SHJ', 'AUH', 'RKT', 'MIA', 'FLL', 'NCE', 'BER', 'MAN', 'TQO', 'CUN', 'KUL', 'HKT', 'DPS', 'LIS', 'AGP', 'LCA', 'PFO', 'IST', 'AYT', 'BKK', 'SGN', 'PVR', 'SJD', 'LHR', 'BCN', 'DOH', 'MCT', 'BAH']);
const hav = (a, b) => { const R = 6371.0088, r = Math.PI / 180, d1 = (b[0] - a[0]) * r, d2 = (b[1] - a[1]) * r; const h = Math.sin(d1 / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(d2 / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
const decs = v => { const s = String(v), i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1; };
// unit types (item 24)
const UT = [['ut_studio', /studio/i], ['ut_pent', /penthouse/i], ['ut_villa', /villa/i], ['ut_town', /town ?house|townhome|row ?house/i], ['ut_com', /\b(shop|retail|office|commercial)\b/i]];
function unitKinds(list) {
  const k = new Set();
  for (const raw of list || []) { const s = String(raw);
    for (const [key, rx] of UT) if (rx.test(s)) k.add(key);
    let m; const rx = /(\d)\s*(?:[-–to/]+\s*(\d))?\s*\+?\s*(?:br\b|bed|bhk|bedroom|dormitorio|спальн)/gi;
    while ((m = rx.exec(s))) { const a = +m[1], b = m[2] ? +m[2] : a; for (let i = a; i <= Math.min(b, 9); i++) k.add(i >= 4 ? 'ut_b4' : 'ut_b' + i); }
    if (/\bone[- ]bed/i.test(s)) k.add('ut_b1'); if (/\btwo[- ]bed/i.test(s)) k.add('ut_b2'); if (/\bthree[- ]bed/i.test(s)) k.add('ut_b3');
  }
  k.delete('ut_b0'); return k;
}

let IX = null;
export async function h29Data(env) {
  const F = await facetsData(env);
  const [tri, AR] = await Promise.all([trData(env).catch(() => null), load(env, 'around.json').catch(() => null)]);
  const month = today().slice(0, 7);
  if (IX && IX.F === F && IX.AR === AR && IX.month === month) return IX;
  const ix = F.ix, P = F.P, sc = id => F.score(id);
  const comp = id => { const r = tri && tri.rows.get(id); return r ? r.comp : null; };
  const byScore = (a, b) => (sc(b.id) ?? -1) - (sc(a.id) ?? -1) || String(a.n).localeCompare(String(b.n));
  const byMk = new Map(); for (const x of P) { if (!byMk.has(x.mk)) byMk.set(x.mk, []); byMk.get(x.mk).push(x); }
  const mkOfSlug = new Map(); for (const mk of byMk.keys()) mkOfSlug.set(slugA(mk), mk);
  const hd = x => !!handoverOf(ix, x), ov = x => !!overdueOf(ix, x), moved = x => { const h = (ix.prom[x.id] || []).find(p => p.k === 'handover'); return !!(h && h.mv > 0); };
  const devStats = L => { const s = L.map(x => sc(x.id)).filter(v => v != null); const best = L.slice().sort(byScore)[0]; return { L: L.slice().sort(byScore), k: L.length, med: s.length ? Math.round(median(s)) : null, best, bestS: best ? sc(best.id) : null, pn: L.filter(x => x.pn).length, hd: L.filter(hd).length, ov: L.filter(ov).length, mv: L.filter(moved).length }; };
  // 16 developer rankings and 25 pairs
  const DR = new Map(), VS = new Map(), vsOfMk = new Map(), vsOfDev = new Map(), drOfDev = new Map();
  for (const [mk, L] of byMk) {
    const dm = new Map(); for (const x of L) { if (!x.dvs || !x.dv) continue; if (!dm.has(x.dvs)) dm.set(x.dvs, { dvs: x.dvs, dv: x.dv, L: [] }); dm.get(x.dvs).L.push(x); }
    const devs = [...dm.values()].map(d => Object.assign(d, devStats(d.L)));
    devs.sort((a, b) => (b.med ?? -1) - (a.med ?? -1) || b.k - a.k || a.dv.localeCompare(b.dv));
    let prev = null, rank = 0; devs.forEach((d, i) => { if (d.med !== prev) { rank = i + 1; prev = d.med; } d.rank = rank; });
    const s = slugA(mk);
    if (devs.length >= DR_DEV && L.length >= DR_PROJ) { DR.set(s, { mk, s, devs, n: L.filter(x => x.dvs).length, lm: maxS(L.map(x => lastmod(ix, x))) }); for (const d of devs) { if (!drOfDev.has(d.dvs)) drOfDev.set(d.dvs, []); drOfDev.get(d.dvs).push(s); } }
    const big = devs.filter(d => d.k >= MIN).sort((a, b) => a.dvs.localeCompare(b.dvs));
    for (let i = 0; i < big.length; i++) for (let j = i + 1; j < big.length; j++) {
      const a = big[i], b = big[j], k = a.dvs + '-vs-' + b.dvs; if (VS.has(k) || k.length > 200) continue;
      const pr = { k, mk, s, a, b, lm: maxS(a.L.concat(b.L).map(x => lastmod(ix, x))) }; VS.set(k, pr);
      if (!vsOfMk.has(mk)) vsOfMk.set(mk, []); vsOfMk.get(mk).push(pr);
      for (const d of [a, b]) { if (!vsOfDev.has(d.dvs)) vsOfDev.set(d.dvs, []); vsOfDev.get(d.dvs).push(pr); }
    }
  }
  // 17 permits
  const PM = new Map();
  for (const [mk, L] of byMk) { const W = L.filter(x => x.pn).sort(byScore); if (W.length >= MIN) PM.set(slugA(mk), { mk, s: slugA(mk), L: W, n: L.length, conf: W.filter(x => { const c = comp(x.id); return c && c.permitreg && c.permitreg.st === 'yes'; }).length, lm: maxS(W.map(x => lastmod(ix, x))) }); }
  // 18 price ranges: the currency most projects of the place use
  const PR = new Map();
  for (const [mk, L] of byMk) {
    const cc = new Map(); for (const x of L) if (pmin(x)) { const c = curOf(x); cc.set(c, (cc.get(c) || 0) + 1); }
    const top = [...cc.entries()].sort((a, b) => b[1] - a[1])[0]; if (!top || !BANDS[top[0]] || top[1] < PR_PRICED) continue;
    const cur = top[0], B = BANDS[cur], W = L.filter(x => pmin(x) && curOf(x) === cur);
    const bands = [0, 1, 2, 3].map(i => ({ i, lo: i ? B[i - 1] : null, hi: i < 3 ? B[i] : null, L: [] }));
    for (const x of W) { const p = pmin(x); bands[p < B[0] ? 0 : p < B[1] ? 1 : p < B[2] ? 2 : 3].L.push(x); }
    for (const b of bands) b.L.sort((a, c) => pmin(a) - pmin(c) || String(a.n).localeCompare(String(c.n)));
    if (!bands.some(b => b.L.length >= MIN)) continue;
    const other = [...cc.entries()].filter(([c]) => c !== cur);
    PR.set(slugA(mk), { mk, s: slugA(mk), cur, bands, W, other, lm: maxS(W.map(x => lastmod(ix, x))) });
  }
  // 19 ownership
  const OW = new Map();
  for (const o of OWN) {
    const W = P.filter(x => o.co.includes(x.co) && x.fx && x.fx.foreign_ownership).sort((a, b) => String(a.mk).localeCompare(String(b.mk)) || byScore(a, b));
    if (W.length < MIN) continue;
    const G = { freehold: [], leasehold: [], trust: [], mixed: [], other: [] }; for (const x of W) G[tenure(x.fx.foreign_ownership)].push(x);
    OW.set(o.s, { o, s: o.s, co: W[0].co, W, G, lm: maxS(W.map(x => lastmod(ix, x))) });
  }
  // 20 residence by investment
  const GVM = new Map();
  for (const g of GV) {
    const W = P.filter(x => g.co.includes(x.co) && pmin(x) && curOf(x) === g.cur);
    const all = W.filter(x => pmin(x) >= g.th).sort((a, b) => pmin(a) - pmin(b) || String(a.n).localeCompare(String(b.n)));
    const some = W.filter(x => pmin(x) < g.th && (pmax(x) || 0) >= g.th).sort((a, b) => pmin(b) - pmin(a));
    if (all.length < MIN) continue;
    GVM.set(g.s, { g, s: g.s, co: W[0].co, all, some, n: W.length, lm: maxS(all.concat(some).map(x => lastmod(ix, x))) });
  }
  // 21 airports: points from around.json, pins from named.json (3+ decimals, not shared with another project)
  const AP = new Map(), apOfMk = new Map();
  if (AR && AR.projects) {
    const pts = new Map(); for (const v of Object.values(AR.projects)) for (const k of ['airport', 'airport2']) { const a = v && v[k]; if (a && a.iata && AIRPORTS.has(a.iata) && Array.isArray(a.ll)) pts.set(a.iata, { i: a.iata, n: a.n || a.iata, ll: a.ll }); }
    const seen = new Map(); for (const x of P) if (x.fx && x.fx.lat != null && x.fx.lng != null) { const k = x.fx.lat + ',' + x.fx.lng; seen.set(k, (seen.get(k) || 0) + 1); }
    const pins = P.filter(x => x.fx && isFinite(x.fx.lat) && isFinite(x.fx.lng) && x.fx.lat !== null && decs(x.fx.lat) >= 3 && decs(x.fx.lng) >= 3 && seen.get(x.fx.lat + ',' + x.fx.lng) === 1);
    for (const a of pts.values()) {
      const L = pins.map(x => ({ x, km: hav([+x.fx.lat, +x.fx.lng], a.ll) })).filter(r => r.km <= AP_KM).sort((p, q) => p.km - q.km);
      if (L.length < MIN) continue;
      const s = a.i.toLowerCase(); AP.set(s, Object.assign({ s, L, lm: maxS(L.map(r => lastmod(ix, r.x))) }, a));
      for (const mk of new Set(L.map(r => r.x.mk))) { if (!apOfMk.has(mk)) apOfMk.set(mk, []); apOfMk.get(mk).push(s); }
    }
  }
  // 23 and 24 monthly reports
  const RP = new Map();
  for (const [mk, L] of byMk) {
    if (L.length < RP_PROJ) continue;
    const S = L.slice().sort(byScore), nw = L.filter(x => String(x.ad || '').slice(0, 7) === month).sort((a, b) => String(b.ad).localeCompare(String(a.ad)) || byScore(a, b));
    const cc = new Map(); for (const x of L) if (pmin(x)) { const c = curOf(x); if (c) cc.set(c, (cc.get(c) || 0) + 1); }
    const top = [...cc.entries()].sort((a, b) => b[1] - a[1])[0], cur = top ? top[0] : null, prices = cur ? L.filter(x => pmin(x) && curOf(x) === cur).map(pmin) : [];
    const years = new Map(); let noDate = 0; for (const x of L) { const y = F.yr.get(x.id); if (!y) { noDate++; continue; } const r = years.get(y) || { y, k: 0, mv: 0 }; r.k++; if (moved(x)) r.mv++; years.set(y, r); }
    const ut = new Map(); for (const x of L) for (const k of unitKinds(x.fx && x.fx.unit_types)) ut.set(k, (ut.get(k) || 0) + 1);
    const dep = L.map(x => x.fx && +x.fx.deposit_pct).filter(v => v > 0 && v <= 100);
    const dm = new Map(); for (const x of L) if (x.dvs && x.dv) { if (!dm.has(x.dvs)) dm.set(x.dvs, { dvs: x.dvs, dv: x.dv, L: [] }); dm.get(x.dvs).L.push(x); }
    const devs = [...dm.values()].map(d => Object.assign(d, devStats(d.L))).sort((a, b) => b.k - a.k || (b.med ?? -1) - (a.med ?? -1) || a.dv.localeCompare(b.dv));
    const latest = nw.length >= MIN ? nw : L.slice().sort((a, b) => String(b.ad || '').localeCompare(String(a.ad || '')) || byScore(a, b)).slice(0, MIN);
    RP.set(slugA(mk), { mk, s: slugA(mk), L: S, nw, latest, cur, prices, years: [...years.values()].sort((a, b) => a.y - b.y), noDate, ut, pay: L.filter(x => x.fx && x.fx.payment_plan).length, dep, devs, pn: L.filter(x => x.pn).length, lm: maxS(L.map(x => lastmod(ix, x))) });
  }
  const updated = F.updated;
  IX = { F, AR, ix, month, sc, comp, byMk, mkOfSlug, DR, VS, vsOfMk, vsOfDev, drOfDev, PM, PR, OW, GV: GVM, AP, apOfMk, RP, updated,
    v: F.v + '|' + month + '|' + DR.size + '|' + VS.size + '|' + PM.size + '|' + PR.size + '|' + OW.size + '|' + GVM.size + '|' + AP.size + '|' + RP.size };
  return IX;
}

// ------------------------------------------------------------------------------------------------ shared cells
const pLink = (lang, x) => '<a href="' + pre(lang) + '/projects/' + x.s + '/">' + bdi(x.n) + '</a>';
const dLink = (D, lang, x) => x.dv ? (x.dvs && D.ix.devs.has(x.dvs) ? '<a href="' + pre(lang) + '/developers/' + x.dvs + '/">' + bdi(x.dv) + '</a>' : bdi(x.dv)) : te(lang, 'np');
const dLinkS = (D, lang, dvs, dv) => D.ix.devs.has(dvs) ? '<a href="' + pre(lang) + '/developers/' + dvs + '/">' + bdi(dv) + '</a>' : bdi(dv);
const hoCell = (D, lang, x) => { const h = handoverOf(D.ix, x); return h ? esc(fd(h.d, lang)) : te(lang, 'np'); };
const scCell = (D, lang, x) => { const s = D.sc(x.id); return s == null ? '-' : '<b>' + nf(lang, s) + '</b>'; };
const pc = (lang, x) => pmin(x) ? money(lang, curOf(x), pmin(x)) : te(lang, 'np');
const px = (lang, x) => pmax(x) ? money(lang, curOf(x), pmax(x)) : '-';
const dataLine = (D, lang, d, files) => '<p class="k-small k-muted">' + te(lang, 'data_d', { d: fd(D.updated, lang) }) + ' ' + (files || ['named.json']).map(f => '<a href="/data/' + f + '">' + f + '</a>').join(' · ') + ' · <a href="' + pre(lang) + '/methods/transparency-score/">' + te(lang, 'score_m') + '</a></p>';
const method = lang => '<h2 id="method">' + te(lang, 'meth_h') + '</h2><p>' + te(lang, 'meth') + '</p>';
const citeBox = (lang, title, url, d) => '<h2 id="cite">' + te(lang, 'cite_h') + '</h2><p><code>' + te(lang, 'cite', { t: title, u: url, d: fd(d, lang) }) + '</code></p>';
const head = (lang, cr, h1, lead, d) => '<div class="k-phead">' + crumbHtml(cr) + '<h1>' + h1 + '</h1><p class="lead">' + lead + '</p><p class="k-small k-muted"><time datetime="' + d + '">' + esc(fd(d, lang)) + '</time></p></div>';
const wrap = body => '<div class="kfa"><section class="k-sec"><div class="k-wrap">' + body + '</div></section></div>';
const webLd = (lang, url, title, desc, lm, type) => ({ '@type': type || 'CollectionPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: lm, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } });
const listLd = (lang, title, L) => ({ '@type': 'ItemList', name: title, numberOfItems: L.length, itemListElement: L.slice(0, 100).map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.n, url: PUB(lang, '/projects/' + x.s + '/') })) });
const dataLd = (url, title, desc, lm, place, files) => ({ '@type': 'Dataset', '@id': url + '#data', name: title, description: desc, url, isAccessibleForFree: true, dateModified: lm, license: 'https://creativecommons.org/licenses/by/4.0/', creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, ...(place ? { spatialCoverage: { '@type': 'Place', name: place } } : {}), distribution: (files || ['named.json']).map(f => ({ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/data/' + f })) });
const crumbs = (lang, mid, last) => [['Kolaboro', pre(lang) + '/']].concat(mid || []).concat([last]);
const pct = (k, n) => n ? Math.round(k / n * 100) : 0;

// more data on a place: the links of this module for one market (used at the end of each page and on the existing pages)
function placeLinks(D, mk, lang, skip) {
  const s = slugA(mk), L = [];
  if (D.RP.has(s)) L.push([t(lang, 'l_rp'), '/reports/' + s + '/']);
  if (D.DR.has(s)) L.push([t(lang, 'l_dr'), '/rankings/developers/' + s + '/']);
  if (D.PM.has(s)) L.push([t(lang, 'l_pm'), '/permits/' + s + '/']);
  if (D.PR.has(s)) L.push([t(lang, 'l_pr'), '/price-ranges/' + s + '/']);
  for (const a of D.apOfMk.get(mk) || []) { const A = D.AP.get(a); L.push([t(lang, 'l_ap', { a: A.n }), '/airports/' + a + '/']); }
  const co = (D.byMk.get(mk) || [])[0]; if (co) { for (const o of D.OW.values()) if (o.o.co.includes(co.co)) L.push([t(lang, 'l_ow') + ': ' + (coName(o.co, lang) || o.co), '/ownership/' + o.s + '/']); for (const g of D.GV.values()) if (g.g.co.includes(co.co)) L.push([t(lang, 'gv_p_' + g.s), '/golden-visa/' + g.s + '/']); }
  for (const pr of (D.vsOfMk.get(mk) || []).slice(0, 6)) L.push([t(lang, 'vs_t2', { a: pr.a.dv, b: pr.b.dv }), '/developers/' + pr.k + '/']);
  return L.filter(([, p]) => p !== skip);
}
const linksBlock = (lang, title, L) => L.length ? '<h2 id="more">' + esc(title) + '</h2><ul class="kfa-l">' + L.map(([l, p]) => '<li><a href="' + pre(lang) + p + '">' + esc(l) + '</a></li>').join('') + '</ul>' : '';
const moreHtml = (D, mk, lang, skip) => { const L = placeLinks(D, mk, lang, skip); return L.length ? '<h2 id="more">' + te(lang, 'more_h', { p: mkName(mk, lang) }) + '</h2><ul class="kfa-l">' + L.map(([l, p]) => '<li><a href="' + pre(lang) + p + '">' + esc(l) + '</a></li>').join('') + '</ul>' : ''; };

// ------------------------------------------------------------------------------------------------ 16 developer ranking
function drPage(D, s, lang) {
  const g = D.DR.get(s); if (!g) return null;
  const p = mkName(g.mk, lang), path = '/rankings/developers/' + s + '/', url = PUB(lang, path), d = D.updated, top = g.devs[0];
  const title = fitT(t(lang, 'dr_t', { p }), t(lang, 'dr_t2', { p }), t(lang, 'dr_t3', { p }));
  const desc = fitD(t(lang, 'dr_d', { k: nf(lang, g.devs.length), p, n: nf(lang, g.n), d: fd(d, lang) }));
  const cr = crumbs(lang, [[t(lang, 'drh_t'), pre(lang) + '/rankings/developers/']], [title, pre(lang) + path]);
  const cols = t(lang, 'dr_cols');
  const rows = g.devs.map(v => [nf(lang, v.rank), dLinkS(D, lang, v.dvs, v.dv), nf(lang, v.k), v.med == null ? '-' : '<b>' + nf(lang, v.med) + '</b>', v.best ? pLink(lang, v.best) + ' <small class="k-muted">' + nf(lang, v.bestS) + '</small>' : '-', nf(lang, v.pn), nf(lang, v.hd), nf(lang, v.ov)]);
  const Q = [[t(lang, 'dr_q1', { p }), t(lang, 'dr_a1', { dv: top.dv, s: nf(lang, top.med), k: nf(lang, top.k), d: fd(d, lang) })], [t(lang, 'dr_q2', { p }), t(lang, 'dr_a2', { k: nf(lang, g.devs.length), n: nf(lang, g.n), d: fd(d, lang) })]];
  const allS = g.devs.flatMap(v => v.L.map(x => D.sc(x.id))).filter(v => v != null);
  const vs = D.vsOfMk.get(g.mk) || [];
  const body = wrap(head(lang, cr, th(lang, 'dr_t', { p: bdi(p) }), te(lang, 'dr_lead', { p }), today()) +
    kv([[nf(lang, g.devs.length), t(lang, 'kv_dev')], [nf(lang, g.n), t(lang, 'kv_tr')], [nf(lang, Math.round(median(allS))), t(lang, 'kv_med')], [nf(lang, g.devs.reduce((a, v) => a + v.pn, 0)), t(lang, 'kv_pn')]]) +
    '<h2 id="ranking">' + esc(title) + '</h2>' + table(cols, rows, [0, 2, 3, 5, 6, 7]) + '<p class="k-small k-muted">' + te(lang, 'dr_one') + '</p>' + dataLine(D, lang, g.lm, ['named.json', 'bali-cases.json', 'on-time.json']) +
    (vs.length ? '<h2 id="compare">' + te(lang, 'vs_hub_h') + '</h2><ul class="kfa-l">' + vs.map(pr => '<li><a href="' + pre(lang) + '/developers/' + pr.k + '/">' + th(lang, 'vs_t2', { a: bdi(pr.a.dv), b: bdi(pr.b.dv) }) + '</a></li>').join('') + '</ul>' : '') +
    method(lang) + citeBox(lang, title, url, d) + faqHtml(lang, Q) + moreHtml(D, g.mk, lang, path) + replyBox(lang));
  const ld = [webLd(lang, url, title, desc, g.lm), dataLd(url, title, desc, g.lm, g.mk, ['named.json', 'bali-cases.json']), { '@type': 'ItemList', name: title, numberOfItems: g.devs.length, itemListElement: g.devs.map((v, i) => ({ '@type': 'ListItem', position: i + 1, name: v.dv, ...(D.ix.devs.has(v.dvs) ? { url: PUB(lang, '/developers/' + v.dvs + '/') } : {}) })) }, crumbLd(cr), faqLd(Q)];
  return { title, desc, body, ld, path, lm: g.lm };
}
function drHub(D, lang) {
  if (!D.DR.size) return null;
  const path = '/rankings/developers/', url = PUB(lang, path), G = [...D.DR.values()].sort((a, b) => b.devs.length - a.devs.length || a.mk.localeCompare(b.mk));
  const title = fitT(t(lang, 'drh_t')), desc = fitD(t(lang, 'drh_lead')), lm = maxS(G.map(g => g.lm));
  const cr = crumbs(lang, [], [title, pre(lang) + path]), cols = t(lang, 'drh_cols');
  const rows = G.map(g => ['<a href="' + pre(lang) + path + g.s + '/">' + bdi(mkName(g.mk, lang)) + '</a>', nf(lang, g.devs.length), nf(lang, g.n), dLinkS(D, lang, g.devs[0].dvs, g.devs[0].dv)]);
  const V = [...D.VS.values()].sort((a, b) => a.mk.localeCompare(b.mk) || a.k.localeCompare(b.k));
  const body = wrap(head(lang, cr, te(lang, 'drh_t'), te(lang, 'drh_lead'), today()) + table(cols, rows, [1, 2]) +
    (V.length ? '<h2 id="compare">' + te(lang, 'vs_hub_h') + '</h2><ul class="kfa-l">' + V.map(pr => '<li><a href="' + pre(lang) + '/developers/' + pr.k + '/">' + th(lang, 'vs_t', { a: bdi(pr.a.dv), b: bdi(pr.b.dv), p: bdi(mkName(pr.mk, lang)) }) + '</a></li>').join('') + '</ul>' : '') +
    dataLine(D, lang, lm) + method(lang) + hubNav(lang, path) + replyBox(lang));
  const ld = [webLd(lang, url, title, desc, lm), { '@type': 'ItemList', name: title, numberOfItems: G.length, itemListElement: G.map((g, i) => ({ '@type': 'ListItem', position: i + 1, name: g.mk, url: PUB(lang, path + g.s + '/') })) }, crumbLd(cr)];
  return { title, desc, body, ld, path, lm };
}

// ------------------------------------------------------------------------------------------------ 25 developer comparison
function vsPage(D, k, lang) {
  const pr = D.VS.get(k); if (!pr) return null;
  const { a, b, mk } = pr, p = mkName(mk, lang), path = '/developers/' + k + '/', url = PUB(lang, path), d = D.updated, ix = D.ix;
  const title = fitT(t(lang, 'vs_t', { a: a.dv, b: b.dv, p }), t(lang, 'vs_t2', { a: a.dv, b: b.dv }));
  const desc = fitD(t(lang, 'vs_d', { a: a.dv, b: b.dv, p, d: fd(d, lang) }));
  const cr = crumbs(lang, [[t(lang, 'drh_t'), pre(lang) + '/rankings/developers/'], [mkName(mk, lang), pre(lang) + '/rankings/developers/' + pr.s + '/']], [title, pre(lang) + path]);
  const medP = v => { const c = new Map(); for (const x of v.L) if (pmin(x)) c.set(curOf(x), (c.get(curOf(x)) || []).concat(pmin(x))); const top = [...c.entries()].sort((q, r) => r[1].length - q[1].length)[0]; return top ? money(lang, top[0], Math.round(median(top[1]))) + ' <small class="k-muted">(' + nf(lang, top[1].length) + ')</small>' : te(lang, 'np'); };
  const done = v => { const s = D.F.dev.get(v.dvs); return s ? nf(lang, s.done) : '-'; };
  const R = t(lang, 'vs_rows'), vals = v => [nf(lang, v.k), v.med == null ? '-' : '<b>' + nf(lang, v.med) + '</b>', v.bestS == null ? '-' : nf(lang, v.bestS), nf(lang, v.pn), nf(lang, v.hd), nf(lang, v.mv), nf(lang, v.ov), medP(v), done(v)];
  const va = vals(a), vb = vals(b);
  const tbl = '<div class="k-table-wrap"><table class="k-table kfa-vs"><thead><tr><th scope="col"></th><th scope="col">' + dLinkS(D, lang, a.dvs, a.dv) + '</th><th scope="col">' + dLinkS(D, lang, b.dvs, b.dv) + '</th></tr></thead><tbody>' +
    R.map((r, i) => '<tr><th scope="row">' + esc(r.replace('{p}', p)) + '</th><td>' + va[i] + '</td><td>' + vb[i] + '</td></tr>').join('') + '</tbody></table></div>';
  const cols = [t(lang, 'c_proj'), t(lang, 'c_place'), t(lang, 'c_ho'), t(lang, 'c_from'), t(lang, 'c_sc')];
  const lst = v => '<h2 id="p-' + esc(v.dvs) + '">' + th(lang, 'vs_proj_h', { a: bdi(v.dv), p: bdi(p) }) + '</h2>' + table(cols, v.L.map(x => [pLink(lang, x), esc(placeName(x.ar || x.mk, lang)), hoCell(D, lang, x), pc(lang, x), scCell(D, lang, x)]), [4]);
  const w = a.med === b.med ? null : (a.med ?? -1) > (b.med ?? -1) ? a : b, l = w === a ? b : a;
  const Q = [[t(lang, 'vs_q1', { p, a: a.dv, b: b.dv }), w ? t(lang, 'vs_a1', { w: w.dv, s1: nf(lang, w.med), s2: nf(lang, l.med), d: fd(d, lang) }) : t(lang, 'vs_a1e', { s1: nf(lang, a.med), d: fd(d, lang) })],
    [t(lang, 'vs_q2', { a: a.dv, b: b.dv, p }), t(lang, 'vs_a2', { a: a.dv, b: b.dv, k1: nf(lang, a.k), k2: nf(lang, b.k), d: fd(d, lang) })]];
  const others = (D.vsOfMk.get(mk) || []).filter(o => o !== pr);
  const body = wrap(head(lang, cr, th(lang, 'vs_t', { a: bdi(a.dv), b: bdi(b.dv), p: bdi(p) }), te(lang, 'vs_lead', { p }), today()) + tbl + dataLine(D, lang, pr.lm, ['named.json', 'promises.json', 'on-time.json']) + lst(a) + lst(b) +
    (others.length ? '<h2 id="other">' + te(lang, 'vs_other', { p }) + '</h2><ul class="kfa-l">' + others.map(o => '<li><a href="' + pre(lang) + '/developers/' + o.k + '/">' + th(lang, 'vs_t2', { a: bdi(o.a.dv), b: bdi(o.b.dv) }) + '</a></li>').join('') + '</ul>' : '') +
    method(lang) + faqHtml(lang, Q) + moreHtml(D, mk, lang, path) + replyBox(lang));
  const ld = [webLd(lang, url, title, desc, pr.lm, 'WebPage'), listLd(lang, title, a.L.concat(b.L)), crumbLd(cr), faqLd(Q)];
  return { title, desc, body, ld, path, lm: pr.lm };
}

// ------------------------------------------------------------------------------------------------ 17 permits
function pmPage(D, s, lang) {
  const g = D.PM.get(s); if (!g) return null;
  const p = mkName(g.mk, lang), path = '/permits/' + s + '/', url = PUB(lang, path), d = D.updated, k = g.L.length;
  const title = fitT(t(lang, 'pm_t', { p }), t(lang, 'pm_t2', { p }), t(lang, 'pm_t3', { p }));
  const desc = fitD(t(lang, 'pm_d', { k: nf(lang, k), n: nf(lang, g.n), p, d: fd(d, lang) }));
  const cr = crumbs(lang, [[t(lang, 'pmh_t'), pre(lang) + '/permits/']], [title, pre(lang) + path]), cols = t(lang, 'pm_cols');
  const rows = g.L.map(x => { const c = D.comp(x.id), ok = c && c.permitreg && c.permitreg.st === 'yes'; return [pLink(lang, x), dLink(D, lang, x), '<bdi dir="ltr">' + esc(x.pn) + '</bdi>' + srcA(okHttp(x.du) ? x.du : x.url), x.fx && x.fx.permit_authority ? bdi(x.fx.permit_authority) : te(lang, 'np'), ok ? te(lang, 'yes') : te(lang, 'no'), hoCell(D, lang, x), scCell(D, lang, x)]; });
  const regs = regFor(D.F, g.L[0]) || [];
  const regH = '<h2 id="register">' + te(lang, 'pm_reg_h', { p }) + '</h2>' + (regs.length ? '<ul class="fl">' + regs.slice(0, 3).map(r => '<li>' + bdi(r.register) + (r.url ? srcA(r.url) : '') + '</li>').join('') + '</ul>' : '<p>' + te(lang, 'pm_reg_none', { p }) + '</p>') + '<p><a href="' + pre(lang) + '/registers/">' + te(lang, 'pm_guide') + '</a></p>';
  const Q = [[t(lang, 'pm_q1', { p }), t(lang, 'pm_a1', { k: nf(lang, k), n: nf(lang, g.n), r: nf(lang, pct(k, g.n)), d: fd(d, lang) })], [t(lang, 'pm_q2'), t(lang, 'pm_a2', { c: nf(lang, g.conf), k: nf(lang, k) })]];
  const body = wrap(head(lang, cr, th(lang, 'pm_t', { p: bdi(p) }), te(lang, 'pm_lead'), today()) +
    kv([[nf(lang, k), t(lang, 'kv_pn')], [nf(lang, g.n), t(lang, 'kv_tr')], [nf(lang, pct(k, g.n)) + ' %', t(lang, 'pmh_cols')[3]], [nf(lang, g.conf), t(lang, 'pm_cols')[4]]]) +
    '<h2 id="projects">' + esc(title) + '</h2>' + table(cols, rows, [6]) + dataLine(D, lang, g.lm, ['named.json', 'register-checks.json']) + regH + method(lang) + citeBox(lang, title, url, d) + faqHtml(lang, Q) + moreHtml(D, g.mk, lang, path) + replyBox(lang));
  const ld = [webLd(lang, url, title, desc, g.lm), dataLd(url, title, desc, g.lm, g.mk, ['named.json', 'register-checks.json']), listLd(lang, title, g.L), crumbLd(cr), faqLd(Q)];
  return { title, desc, body, ld, path, lm: g.lm };
}
function pmHub(D, lang) {
  if (!D.PM.size) return null;
  const path = '/permits/', url = PUB(lang, path), G = [...D.PM.values()].sort((a, b) => b.L.length - a.L.length || a.mk.localeCompare(b.mk));
  const title = fitT(t(lang, 'pmh_t')), desc = fitD(t(lang, 'pmh_lead')), lm = maxS(G.map(g => g.lm)), cr = crumbs(lang, [], [title, pre(lang) + path]), cols = t(lang, 'pmh_cols');
  const rows = G.map(g => ['<a href="' + pre(lang) + path + g.s + '/">' + bdi(mkName(g.mk, lang)) + '</a>', '<b>' + nf(lang, g.L.length) + '</b>', nf(lang, g.n), nf(lang, pct(g.L.length, g.n)) + ' %']);
  const body = wrap(head(lang, cr, te(lang, 'pmh_t'), te(lang, 'pmh_lead'), today()) + table(cols, rows, [1, 2, 3]) + dataLine(D, lang, lm) + method(lang) + hubNav(lang, path) + replyBox(lang));
  const ld = [webLd(lang, url, title, desc, lm), { '@type': 'ItemList', name: title, numberOfItems: G.length, itemListElement: G.map((g, i) => ({ '@type': 'ListItem', position: i + 1, name: g.mk, url: PUB(lang, path + g.s + '/') })) }, crumbLd(cr)];
  return { title, desc, body, ld, path, lm };
}

// ------------------------------------------------------------------------------------------------ 18 price ranges
const bandLabel = (lang, cur, b) => b.lo == null ? t(lang, 'pr_lt', { a: moneyT(lang, cur, b.hi) }) : b.hi == null ? t(lang, 'pr_ge', { a: moneyT(lang, cur, b.lo) }) : t(lang, 'pr_bt', { a: moneyT(lang, cur, b.lo), b: moneyT(lang, cur, b.hi) });
function prPage(D, s, lang) {
  const g = D.PR.get(s); if (!g) return null;
  const p = mkName(g.mk, lang), path = '/price-ranges/' + s + '/', url = PUB(lang, path), d = D.updated, n = g.W.length, cur = g.cur;
  const title = fitT(t(lang, 'pr_t', { p }), t(lang, 'pr_t2', { p }), t(lang, 'pr_t3', { p }));
  const desc = fitD(t(lang, 'pr_d', { n: nf(lang, n), p, c: cur, d: fd(d, lang) }));
  const cr = crumbs(lang, [[t(lang, 'prh_t'), pre(lang) + '/price-ranges/']], [title, pre(lang) + path]);
  const sc = t(lang, 'pr_scols'), cols = t(lang, 'pr_cols');
  const sum = g.bands.map(b => { const ss = b.L.map(x => D.sc(x.id)).filter(v => v != null); return [b.L.length >= MIN ? '<a href="#range-' + b.i + '">' + bdi(bandLabel(lang, cur, b)) + '</a>' : bdi(bandLabel(lang, cur, b)), '<b>' + nf(lang, b.L.length) + '</b>', b.L.length ? money(lang, cur, Math.round(median(b.L.map(pmin)))) : '-', nf(lang, b.L.filter(x => x.pn).length), ss.length ? nf(lang, Math.round(median(ss))) : '-']; });
  const secs = g.bands.filter(b => b.L.length >= MIN).map(b => '<h2 id="range-' + b.i + '">' + bdi(bandLabel(lang, cur, b)) + ' <small class="k-muted">(' + nf(lang, b.L.length) + ')</small></h2>' + table(cols, b.L.map(x => [pLink(lang, x), dLink(D, lang, x), pc(lang, x), px(lang, x), hoCell(D, lang, x), scCell(D, lang, x)]), [5])).join('');
  const all = g.W.map(pmin), big = g.bands.slice().sort((a, b) => b.L.length - a.L.length)[0];
  const Q = [[t(lang, 'pr_q1', { p }), t(lang, 'pr_a1', { m: moneyT(lang, cur, Math.round(median(all))), n: nf(lang, n), c: cur, lo: moneyT(lang, cur, Math.min(...all)), hi: moneyT(lang, cur, Math.max(...all)), d: fd(d, lang) })], [t(lang, 'pr_q2', { p }), t(lang, 'pr_a2', { b: bandLabel(lang, cur, big), k: nf(lang, big.L.length), n: nf(lang, n) })]];
  const oth = g.other.reduce((a, [, k]) => a + k, 0);
  const body = wrap(head(lang, cr, th(lang, 'pr_t', { p: bdi(p) }), te(lang, 'pr_lead', { c: cur }), today()) +
    kv([[nf(lang, n), t(lang, 'kv_tr')], [money(lang, cur, Math.round(median(all))), t(lang, 'kv_mp')], [money(lang, cur, Math.min(...all)), t(lang, 'rp_pr_cols')[0]], [money(lang, cur, Math.max(...all)), t(lang, 'rp_pr_cols')[4]]]) +
    '<h2 id="ranges">' + te(lang, 'pr_sum_h') + '</h2>' + table(sc, sum, [1, 2, 3, 4]) + '<p class="k-small k-muted">' + te(lang, 'pr_small') + (oth ? ' ' + te(lang, 'pr_other', { k: nf(lang, oth), p, c: g.other.map(([c]) => c).join(', ') }) : '') + '</p>' +
    secs + dataLine(D, lang, g.lm) + method(lang) + citeBox(lang, title, url, d) + faqHtml(lang, Q) + moreHtml(D, g.mk, lang, path) + replyBox(lang));
  const ld = [webLd(lang, url, title, desc, g.lm), dataLd(url, title, desc, g.lm, g.mk), listLd(lang, title, g.W), crumbLd(cr), faqLd(Q)];
  return { title, desc, body, ld, path, lm: g.lm };
}
function prHub(D, lang) {
  if (!D.PR.size) return null;
  const path = '/price-ranges/', url = PUB(lang, path), G = [...D.PR.values()].sort((a, b) => b.W.length - a.W.length || a.mk.localeCompare(b.mk));
  const title = fitT(t(lang, 'prh_t')), desc = fitD(t(lang, 'prh_lead')), lm = maxS(G.map(g => g.lm)), cr = crumbs(lang, [], [title, pre(lang) + path]), cols = t(lang, 'prh_cols');
  const rows = G.map(g => ['<a href="' + pre(lang) + path + g.s + '/">' + bdi(mkName(g.mk, lang)) + '</a>', esc(g.cur), nf(lang, g.W.length), money(lang, g.cur, Math.round(median(g.W.map(pmin))))]);
  const body = wrap(head(lang, cr, te(lang, 'prh_t'), te(lang, 'prh_lead'), today()) + table(cols, rows, [2, 3]) + dataLine(D, lang, lm) + method(lang) + hubNav(lang, path) + replyBox(lang));
  const ld = [webLd(lang, url, title, desc, lm), { '@type': 'ItemList', name: title, numberOfItems: G.length, itemListElement: G.map((g, i) => ({ '@type': 'ListItem', position: i + 1, name: g.mk, url: PUB(lang, path + g.s + '/') })) }, crumbLd(cr)];
  return { title, desc, body, ld, path, lm };
}

// ------------------------------------------------------------------------------------------------ 19 ownership
const srcLine = (lang, k) => { const S = SRC[k]; return S ? ' <small class="k-muted">' + srcA(S.u, S.n) + ' (' + esc(fd(S.d, lang)) + ')</small>' : ''; };
function owPage(D, s, lang) {
  const g = D.OW.get(s); if (!g) return null;
  const c = coName(g.co, lang) || g.co, path = '/ownership/' + s + '/', url = PUB(lang, path), d = D.updated, G = g.G, n = g.W.length;
  const f = G.freehold.length, l = G.leasehold.length, o = n - f - l;
  const title = fitT(t(lang, 'ow_t', { c }), t(lang, 'ow_t2', { c }), t(lang, 'ow_t3', { c }));
  const desc = fitD(t(lang, 'ow_d', { n: nf(lang, n), c, f: nf(lang, f), l: nf(lang, l), o: nf(lang, o), d: fd(d, lang) }));
  const cr = crumbs(lang, [[t(lang, 'owh_t'), pre(lang) + '/ownership/']], [title, pre(lang) + path]);
  const law = '<h2 id="law">' + te(lang, 'ow_law_h') + '</h2><ul class="fl">' + g.o.notes.map(([k, sk]) => '<li class="kfact">' + esc(noteT(k, lang)) + srcLine(lang, sk) + '</li>').join('') + '</ul>';
  const cols = t(lang, 'ow_cols');
  const secs = ['freehold', 'leasehold', 'trust', 'mixed', 'other'].filter(k => G[k].length).map(k => '<h2 id="' + k + '">' + te(lang, 'ow_g_' + k) + ' <small class="k-muted">(' + nf(lang, G[k].length) + ')</small></h2>' +
    table(cols, G[k].map(x => [pLink(lang, x), dLink(D, lang, x), esc(placeName(x.ar || x.mk, lang)), '<span lang="en" dir="ltr">' + esc(String(x.fx.foreign_ownership)) + '</span>' + srcA(x.url)]))).join('');
  const Q = [[t(lang, 'ow_q1', { c }), noteT(g.o.q1, lang)], [t(lang, 'ow_q2', { c }), t(lang, 'ow_a2', { f: nf(lang, f), n: nf(lang, n), l: nf(lang, l), d: fd(d, lang) })]];
  const mks = [...new Set(g.W.map(x => x.mk))];
  const body = wrap(head(lang, cr, th(lang, 'ow_t', { c: bdi(c) }), te(lang, 'ow_lead', { c }), today()) +
    kv([[nf(lang, f), t(lang, 'ow_kv_f')], [nf(lang, l), t(lang, 'ow_kv_l')], ...(G.trust.length ? [[nf(lang, G.trust.length), t(lang, 'ow_kv_t')]] : []), [nf(lang, G.mixed.length + G.other.length), t(lang, 'ow_kv_o')]]) +
    law + secs + '<p class="k-small k-muted">' + te(lang, 'ow_rule') + '</p>' + dataLine(D, lang, g.lm) + method(lang) + citeBox(lang, title, url, d) + faqHtml(lang, Q) +
    linksBlock(lang, t(lang, 'more_h', { p: c }), mks.filter(mk => D.RP.has(slugA(mk))).map(mk => [t(lang, 'l_rp') + ': ' + mkName(mk, lang), '/reports/' + slugA(mk) + '/']).concat([[t(lang, 'owh_t'), '/ownership/']])) + replyBox(lang));
  const ld = [webLd(lang, url, title, desc, g.lm), dataLd(url, title, desc, g.lm, g.co), listLd(lang, title, g.W), crumbLd(cr), faqLd(Q)];
  return { title, desc, body, ld, path, lm: g.lm };
}
function owHub(D, lang) {
  if (!D.OW.size) return null;
  const path = '/ownership/', url = PUB(lang, path), G = [...D.OW.values()];
  const title = fitT(t(lang, 'owh_t')), desc = fitD(t(lang, 'owh_lead')), lm = maxS(G.map(g => g.lm)), cr = crumbs(lang, [], [title, pre(lang) + path]), cols = t(lang, 'owh_cols');
  const rows = G.map(g => ['<a href="' + pre(lang) + path + g.s + '/">' + bdi(coName(g.co, lang) || g.co) + '</a>', nf(lang, g.W.length), nf(lang, g.G.freehold.length), nf(lang, g.G.leasehold.length), nf(lang, g.W.length - g.G.freehold.length - g.G.leasehold.length)]);
  const body = wrap(head(lang, cr, te(lang, 'owh_t'), te(lang, 'owh_lead'), today()) + table(cols, rows, [1, 2, 3, 4]) + dataLine(D, lang, lm) + method(lang) + hubNav(lang, path) + replyBox(lang));
  const ld = [webLd(lang, url, title, desc, lm), { '@type': 'ItemList', name: title, numberOfItems: G.length, itemListElement: G.map((g, i) => ({ '@type': 'ListItem', position: i + 1, name: g.co, url: PUB(lang, path + g.s + '/') })) }, crumbLd(cr)];
  return { title, desc, body, ld, path, lm };
}

// ------------------------------------------------------------------------------------------------ 20 residence by investment
function gvPage(D, s, lang) {
  const g = D.GV.get(s); if (!g) return null;
  const c = coName(g.co, lang) || g.co, path = '/golden-visa/' + s + '/', url = PUB(lang, path), d = D.updated, thr = moneyT(lang, g.g.cur, g.g.th);
  const title = fitT(t(lang, 'gv_t_' + s), t(lang, 'gv_t2_' + s));
  const desc = fitD(t(lang, 'gv_d', { k: nf(lang, g.all.length), c, th: thr, s: nf(lang, g.some.length), d: fd(d, lang) }));
  const cr = crumbs(lang, [[t(lang, 'gvh_t'), pre(lang) + '/golden-visa/']], [title, pre(lang) + path]), cols = t(lang, 'gv_cols');
  const rule = '<h2 id="rule">' + te(lang, 'gv_rule_h') + '</h2><p>' + te(lang, 'gv_rule_' + s) + '</p><ul class="fl">' + g.g.src.map(k => '<li>' + srcA(SRC[k].u, SRC[k].n) + ' <small class="k-muted">(' + esc(fd(SRC[k].d, lang)) + ')</small></li>').join('') + '</ul>';
  const rowsOf = L => L.map(x => [pLink(lang, x), dLink(D, lang, x), esc(placeName(x.ar || x.mk, lang)), pc(lang, x), px(lang, x), hoCell(D, lang, x), scCell(D, lang, x)]);
  const Q = [[t(lang, 'gv_q1', { c, th: thr }), t(lang, 'gv_a1', { k: nf(lang, g.all.length), th: thr, s: nf(lang, g.some.length), d: fd(d, lang) })], [t(lang, 'gv_q2'), t(lang, 'gv_a2', { r: t(lang, 'gv_rule_' + s) })]];
  const mks = [...new Set(g.all.map(x => x.mk))];
  const body = wrap(head(lang, cr, esc(t(lang, 'gv_t_' + s)), te(lang, 'gv_lead'), today()) +
    kv([[money(lang, g.g.cur, g.g.th), t(lang, 'gvh_cols')[1]], [nf(lang, g.all.length), t(lang, 'gvh_cols')[2]], [nf(lang, g.some.length), t(lang, 'gvh_cols')[3]], [nf(lang, g.n), t(lang, 'kv_tr')]]) + rule +
    '<h2 id="all">' + te(lang, 'gv_g_all', { th: thr }) + ' <small class="k-muted">(' + nf(lang, g.all.length) + ')</small></h2>' + table(cols, rowsOf(g.all), [6]) +
    (g.some.length ? '<h2 id="some">' + te(lang, 'gv_g_some', { th: thr }) + ' <small class="k-muted">(' + nf(lang, g.some.length) + ')</small></h2>' + table(cols, rowsOf(g.some), [6]) : '') +
    dataLine(D, lang, g.lm) + method(lang) + citeBox(lang, title, url, d) + faqHtml(lang, Q) +
    linksBlock(lang, t(lang, 'more_h', { p: c }), mks.filter(mk => D.PR.has(slugA(mk))).map(mk => [t(lang, 'l_pr') + ': ' + mkName(mk, lang), '/price-ranges/' + slugA(mk) + '/']).concat([...D.OW.values()].filter(o => o.o.co.includes(g.co)).map(o => [t(lang, 'l_ow'), '/ownership/' + o.s + '/'])).concat([[t(lang, 'gvh_t'), '/golden-visa/']])) + replyBox(lang));
  const ld = [webLd(lang, url, title, desc, g.lm), dataLd(url, title, desc, g.lm, g.co), listLd(lang, title, g.all.concat(g.some)), crumbLd(cr), faqLd(Q)];
  return { title, desc, body, ld, path, lm: g.lm };
}
function gvHub(D, lang) {
  if (!D.GV.size) return null;
  const path = '/golden-visa/', url = PUB(lang, path), G = [...D.GV.values()];
  const title = fitT(t(lang, 'gvh_t')), desc = fitD(t(lang, 'gvh_lead')), lm = maxS(G.map(g => g.lm)), cr = crumbs(lang, [], [title, pre(lang) + path]), cols = t(lang, 'gvh_cols');
  const rows = G.map(g => ['<a href="' + pre(lang) + path + g.s + '/">' + esc(t(lang, 'gv_p_' + g.s)) + '</a>', money(lang, g.g.cur, g.g.th), nf(lang, g.all.length), nf(lang, g.some.length)]);
  const body = wrap(head(lang, cr, te(lang, 'gvh_t'), te(lang, 'gvh_lead'), today()) + table(cols, rows, [2, 3]) + dataLine(D, lang, lm) + method(lang) + hubNav(lang, path) + replyBox(lang));
  const ld = [webLd(lang, url, title, desc, lm), { '@type': 'ItemList', name: title, numberOfItems: G.length, itemListElement: G.map((g, i) => ({ '@type': 'ListItem', position: i + 1, name: t('en', 'gv_p_' + g.s), url: PUB(lang, path + g.s + '/') })) }, crumbLd(cr)];
  return { title, desc, body, ld, path, lm };
}

// ------------------------------------------------------------------------------------------------ 21 airports
const kmT = (lang, v) => nf(lang, v, 1);
function apPage(D, s, lang) {
  const g = D.AP.get(s); if (!g) return null;
  const path = '/airports/' + s + '/', url = PUB(lang, path), d = D.updated, k = g.L.length;
  const title = fitT(t(lang, 'ap_t', { a: g.n, i: g.i }), t(lang, 'ap_t2', { i: g.i }), t(lang, 'ap_t3', { i: g.i }));
  const desc = fitD(t(lang, 'ap_d', { k: nf(lang, k), r: nf(lang, AP_KM), a: g.n, i: g.i, d: fd(d, lang) }));
  const cr = crumbs(lang, [[t(lang, 'aph_t'), pre(lang) + '/airports/']], [title, pre(lang) + path]), cols = t(lang, 'ap_cols');
  const rows = g.L.map(r => [pLink(lang, r.x), dLink(D, lang, r.x), esc(placeName(r.x.ar || r.x.mk, lang)), '<b>' + kmT(lang, r.km) + '</b>', hoCell(D, lang, r.x), scCell(D, lang, r.x)]);
  const n = g.L[0];
  const Q = [[t(lang, 'ap_q1', { a: g.n }), t(lang, 'ap_a1', { x: n.x.n, km: kmT(lang, n.km), d: fd(d, lang) })], [t(lang, 'ap_q2', { r: nf(lang, AP_KM), a: g.n }), t(lang, 'ap_a2', { k: nf(lang, k), d: fd(d, lang) })]];
  const mks = [...new Set(g.L.map(r => r.x.mk))];
  const b = (D.AR && D.AR.osm_build) || '';
  const body = wrap(head(lang, cr, th(lang, 'ap_t', { a: bdi(g.n), i: '<bdi dir="ltr">' + esc(g.i) + '</bdi>' }), te(lang, 'ap_lead'), today()) +
    kv([[nf(lang, k), t(lang, 'kv_tr')], [kmT(lang, n.km), t(lang, 'aph_cols')[2]], [kmT(lang, median(g.L.map(r => r.km))), t(lang, 'rp_pr_cols')[2] + ' (km)']]) +
    '<h2 id="projects">' + esc(title) + '</h2>' + table(cols, rows, [3, 5]) + '<p class="k-small k-muted">' + te(lang, 'ap_src', { b }) + ' <a href="https://www.openstreetmap.org/copyright" rel="nofollow noopener" target="_blank">openstreetmap.org/copyright</a></p>' +
    dataLine(D, lang, g.lm, ['named.json', 'around.json']) + method(lang) + citeBox(lang, title, url, d) + faqHtml(lang, Q) +
    linksBlock(lang, t(lang, 'aph_t'), mks.filter(mk => D.RP.has(slugA(mk))).map(mk => [t(lang, 'l_rp') + ': ' + mkName(mk, lang), '/reports/' + slugA(mk) + '/']).concat([...D.AP.values()].filter(o => o !== g).map(o => [o.n + ' (' + o.i + ')', '/airports/' + o.s + '/']))) + replyBox(lang));
  const ld = [webLd(lang, url, title, desc, g.lm), dataLd(url, title, desc, g.lm, g.n, ['named.json', 'around.json']), listLd(lang, title, g.L.map(r => r.x)), crumbLd(cr), faqLd(Q)];
  return { title, desc, body, ld, path, lm: g.lm };
}
function apHub(D, lang) {
  if (!D.AP.size) return null;
  const path = '/airports/', url = PUB(lang, path), G = [...D.AP.values()].sort((a, b) => b.L.length - a.L.length || a.i.localeCompare(b.i));
  const title = fitT(t(lang, 'aph_t')), desc = fitD(t(lang, 'aph_lead', { r: nf(lang, AP_KM) })), lm = maxS(G.map(g => g.lm)), cr = crumbs(lang, [], [title, pre(lang) + path]), cols = t(lang, 'aph_cols').map(c => c.replace('{r}', nf(lang, AP_KM)));
  const rows = G.map(g => ['<a href="' + pre(lang) + path + g.s + '/">' + bdi(g.n) + ' (<bdi dir="ltr">' + esc(g.i) + '</bdi>)</a>', nf(lang, g.L.length), kmT(lang, g.L[0].km)]);
  const body = wrap(head(lang, cr, te(lang, 'aph_t'), te(lang, 'aph_lead', { r: nf(lang, AP_KM) }), today()) + table(cols, rows, [1, 2]) + dataLine(D, lang, lm, ['named.json', 'around.json']) + method(lang) + hubNav(lang, path) + replyBox(lang));
  const ld = [webLd(lang, url, title, desc, lm), { '@type': 'ItemList', name: title, numberOfItems: G.length, itemListElement: G.map((g, i) => ({ '@type': 'ListItem', position: i + 1, name: g.n, url: PUB(lang, path + g.s + '/') })) }, crumbLd(cr)];
  return { title, desc, body, ld, path, lm };
}

// ------------------------------------------------------------------------------------------------ 23 and 24 monthly report
function rpPage(D, s, lang) {
  const g = D.RP.get(s); if (!g) return null;
  const p = mkName(g.mk, lang), mo = fd(D.month, lang), path = '/reports/' + s + '/', url = PUB(lang, path), d = D.updated, n = g.L.length, a = g.nw.length, cur = g.cur;
  const mp = g.prices.length ? moneyT(lang, cur, Math.round(median(g.prices))) : t(lang, 'np');
  const title = fitT(t(lang, 'rp_t', { p, mo }), t(lang, 'rp_t2', { p, mo }), t(lang, 'rp_t3', { p }));
  const desc = fitD(t(lang, 'rp_d', { p, mo, n: nf(lang, n), a: nf(lang, a), m: mp, d: fd(d, lang) }));
  const cr = crumbs(lang, [[t(lang, 'rph_t', { mo }), pre(lang) + '/reports/']], [title, pre(lang) + path]);
  const ncols = t(lang, 'rp_new_cols');
  const newT = '<h2 id="new">' + te(lang, 'rp_new_h', { mo }) + ' <small class="k-muted">(' + nf(lang, a) + ')</small></h2>' + (a < MIN ? '<p class="ki">' + te(lang, 'rp_new_few', { mo }) + '</p>' : '') +
    table(ncols, g.latest.map(x => [pLink(lang, x), dLink(D, lang, x), x.ad ? '<time datetime="' + esc(x.ad) + '">' + esc(fd(x.ad, lang)) + '</time>' : '-', pc(lang, x), hoCell(D, lang, x), scCell(D, lang, x)]), [5]);
  const ho = g.years.length ? '<h2 id="handover">' + te(lang, 'rp_ho_h') + '</h2>' + table(t(lang, 'rp_ho_cols'), g.years.map(r => [String(r.y), '<b>' + nf(lang, r.k) + '</b>', nf(lang, r.mv)]), [1, 2]) + '<p class="k-small k-muted">' + te(lang, 'rp_ho_none', { k: nf(lang, g.noDate) }) + '</p>' : '';
  const pr = g.prices.length >= MIN ? '<h2 id="prices">' + te(lang, 'rp_pr_h', { c: cur }) + '</h2>' + table(t(lang, 'rp_pr_cols'), [[Math.min(...g.prices), quant(g.prices, 0.25), median(g.prices), quant(g.prices, 0.75), Math.max(...g.prices)].map(v => money(lang, cur, Math.round(v))).concat([nf(lang, g.prices.length)])], [0, 1, 2, 3, 4, 5]) + (D.PR.has(s) ? '<p><a href="' + pre(lang) + '/price-ranges/' + s + '/">' + te(lang, 'l_pr') + '</a></p>' : '') : '';
  const UTK = ['ut_studio', 'ut_b1', 'ut_b2', 'ut_b3', 'ut_b4', 'ut_villa', 'ut_town', 'ut_pent', 'ut_com'].filter(k => g.ut.get(k));
  const ut = UTK.length ? '<h2 id="units">' + te(lang, 'rp_ut_h') + '</h2>' + table(t(lang, 'rp_ut_cols'), UTK.map(k => [te(lang, k), nf(lang, g.ut.get(k))]), [1]) : '';
  const pay = '<h2 id="payment">' + te(lang, 'rp_pay_h') + '</h2><p>' + (g.dep.length ? te(lang, 'rp_pay', { k: nf(lang, g.pay), n: nf(lang, n), q: nf(lang, g.dep.length), m: nf(lang, median(g.dep), 1) }) : te(lang, 'rp_pay0', { k: nf(lang, g.pay), n: nf(lang, n) })) + '</p>';
  const dv = '<h2 id="developers">' + te(lang, 'rp_dev_h') + '</h2>' + table(t(lang, 'rp_dev_cols'), g.devs.slice(0, 8).map(v => [dLinkS(D, lang, v.dvs, v.dv), nf(lang, v.k), v.med == null ? '-' : nf(lang, v.med)]), [1, 2]) + (D.DR.has(s) ? '<p><a href="' + pre(lang) + '/rankings/developers/' + s + '/">' + te(lang, 'l_dr') + '</a></p>' : '');
  const ty = g.years.slice().sort((q, r) => r.k - q.k || q.y - r.y)[0];
  const Q = [[t(lang, 'rp_q1', { p }), t(lang, 'rp_a1', { a: nf(lang, a), mo, d: fd(d, lang) })]];
  if (g.prices.length >= MIN) Q.push([t(lang, 'rp_q2', { p }), t(lang, 'rp_a2', { m: mp, k: nf(lang, g.prices.length), c: cur, d: fd(d, lang) })]);
  if (ty) Q.push([t(lang, 'rp_q3', { p }), t(lang, 'rp_a3', { y: String(ty.y), k: nf(lang, ty.k), z: nf(lang, g.noDate) })]);
  const sc = g.L.map(x => D.sc(x.id)).filter(v => v != null);
  const body = wrap(head(lang, cr, th(lang, 'rp_t', { p: bdi(p), mo: esc(mo) }), te(lang, 'rp_lead', { d: fd(d, lang) }), today()) +
    kv([[nf(lang, n), t(lang, 'kv_tr')], [nf(lang, a), t(lang, 'kv_new', { mo })], [g.prices.length ? money(lang, cur, Math.round(median(g.prices))) : '-', t(lang, 'kv_mp')], [nf(lang, g.pay), t(lang, 'kv_pp')], [nf(lang, g.pn), t(lang, 'kv_pn')], [sc.length ? nf(lang, Math.round(median(sc))) : '-', t(lang, 'kv_med')]]) +
    newT + ho + pr + ut + pay + dv + dataLine(D, lang, g.lm, ['named.json', 'promises.json']) + method(lang) + citeBox(lang, title, url, d) + faqHtml(lang, Q) + moreHtml(D, g.mk, lang, path) + replyBox(lang));
  const ld = [webLd(lang, url, title, desc, g.lm, 'WebPage'), Object.assign(dataLd(url, title, desc, g.lm, g.mk, ['named.json', 'promises.json']), { temporalCoverage: D.month }), listLd(lang, title, g.latest), crumbLd(cr), faqLd(Q)];
  return { title, desc, body, ld, path, lm: g.lm };
}
function rpHub(D, lang) {
  if (!D.RP.size) return null;
  const mo = fd(D.month, lang), path = '/reports/', url = PUB(lang, path), G = [...D.RP.values()].sort((a, b) => b.L.length - a.L.length || a.mk.localeCompare(b.mk));
  const title = fitT(t(lang, 'rph_t', { mo })), desc = fitD(t(lang, 'rph_lead')), lm = maxS(G.map(g => g.lm)), cr = crumbs(lang, [], [title, pre(lang) + path]), cols = t(lang, 'rph_cols').map(c => c.replace('{mo}', mo));
  const rows = G.map(g => ['<a href="' + pre(lang) + path + g.s + '/">' + bdi(mkName(g.mk, lang)) + '</a>', nf(lang, g.L.length), nf(lang, g.nw.length), g.prices.length ? money(lang, g.cur, Math.round(median(g.prices))) : '-']);
  const body = wrap(head(lang, cr, te(lang, 'rph_t', { mo }), te(lang, 'rph_lead'), today()) + table(cols, rows, [1, 2, 3]) + dataLine(D, lang, lm) + method(lang) + hubNav(lang, path) + replyBox(lang));
  const ld = [webLd(lang, url, title, desc, lm), { '@type': 'ItemList', name: title, numberOfItems: G.length, itemListElement: G.map((g, i) => ({ '@type': 'ListItem', position: i + 1, name: g.mk, url: PUB(lang, path + g.s + '/') })) }, crumbLd(cr)];
  return { title, desc, body, ld, path, lm };
}

// links between the hubs of this module
const HUBS = [['rph_t', '/reports/'], ['drh_t', '/rankings/developers/'], ['pmh_t', '/permits/'], ['prh_t', '/price-ranges/'], ['owh_t', '/ownership/'], ['gvh_t', '/golden-visa/'], ['aph_t', '/airports/']];
const hubNav = (lang, skip) => '<ul class="kfa-l">' + HUBS.filter(([, p]) => p !== skip).map(([k, p]) => '<li><a href="' + pre(lang) + p + '">' + esc(t(lang, k, { mo: '' }).replace(/[,，،]\s*$/, '').trim()) + '</a></li>').join('') + '</ul>';

// ------------------------------------------------------------------------------------------------ paths, render, routing
export function allPaths(D) {
  const out = [], hub = (path, M) => { if (M.size) out.push([path, maxS([...M.values()].map(g => g.lm))]); for (const g of M.values()) out.push([path + g.s + '/', g.lm]); };
  hub('/reports/', D.RP); hub('/rankings/developers/', D.DR); hub('/permits/', D.PM); hub('/price-ranges/', D.PR); hub('/ownership/', D.OW); hub('/golden-visa/', D.GV); hub('/airports/', D.AP);
  for (const pr of D.VS.values()) out.push(['/developers/' + pr.k + '/', pr.lm]);
  return out;
}
export function renderPath(D, path, lang) {
  let m;
  const R = [[/^\/reports\/$/, () => rpHub(D, lang)], [/^\/reports\/([a-z0-9-]+)\/$/, s => rpPage(D, s, lang)], [/^\/rankings\/developers\/$/, () => drHub(D, lang)], [/^\/rankings\/developers\/([a-z0-9-]+)\/$/, s => drPage(D, s, lang)],
    [/^\/permits\/$/, () => pmHub(D, lang)], [/^\/permits\/([a-z0-9-]+)\/$/, s => pmPage(D, s, lang)], [/^\/price-ranges\/$/, () => prHub(D, lang)], [/^\/price-ranges\/([a-z0-9-]+)\/$/, s => prPage(D, s, lang)],
    [/^\/ownership\/$/, () => owHub(D, lang)], [/^\/ownership\/([a-z-]+)\/$/, s => owPage(D, s, lang)], [/^\/golden-visa\/$/, () => gvHub(D, lang)], [/^\/golden-visa\/([a-z-]+)\/$/, s => gvPage(D, s, lang)],
    [/^\/airports\/$/, () => apHub(D, lang)], [/^\/airports\/([a-z]{3})\/$/, s => apPage(D, s, lang)], [/^\/developers\/([a-z0-9-]+-vs-[a-z0-9-]+)\/$/, k => vsPage(D, k, lang)]];
  for (const [rx, f] of R) if ((m = rx.exec(path))) return f(m[1]);
  return null;
}
const BODY = new Map();
export async function page(req, u, env, ctx, shell) {
  if (u.pathname === SITEMAP) return sitemap(env);
  const m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(.*?)(\/?)$/.exec(u.pathname); if (!m || !shell) return null;
  const lang = m[1] || 'en', path = '/' + m[2] + '/';
  let D; try { D = await h29Data(env); } catch (e) { return new Response('Temporarily unavailable', { status: 503, headers: { 'retry-after': '60', 'cache-control': 'no-store', 'content-type': 'text/plain; charset=utf-8' } }); }
  const key = lang + '|' + path + '|' + D.v;
  let pg = BODY.get(key);
  if (!pg) { pg = renderPath(D, path, lang); if (!pg) return null; if (BODY.size > 400) BODY.clear(); BODY.set(key, pg); }
  if (!m[3]) return new Response(null, { status: 301, headers: { location: pre(lang) + path + u.search, 'cache-control': 'public, max-age=86400' } });
  const sh = await shell(pre(lang) + '/how-we-score/');
  const url = PUB(lang, pg.path), alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + PUB(l, pg.path) + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + pg.path + '">';
  const tags = '<title>' + esc(pg.title) + ([...pg.title].length + 11 <= 60 ? ' | Kolaboro' : '') + '</title><meta name="description" content="' + esc(pg.desc) + '"><link rel="canonical" href="' + url + '">' + alts + '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">' +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="Kolaboro"><meta property="og:title" content="' + esc(pg.title) + '"><meta property="og:description" content="' + esc(pg.desc) + '"><meta property="og:url" content="' + url + '"><meta property="og:image" content="' + ORIGIN + '/og.png"><meta name="twitter:card" content="summary_large_image">' +
    '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@graph': pg.ld }).replace(/</g, '\\u003c') + '</script>' + CSS;
  const res = new HTMLRewriter()
    .on('html', { element(e) { e.setAttribute('lang', lang); if (lang === 'ar') e.setAttribute('dir', 'rtl'); else e.removeAttribute('dir'); } })
    .on('title', { element(e) { e.remove(); } })
    .on('meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
    .on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(pg.body, { html: true }); } })
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + pg.path); } })
    .transform(new Response(sh.body, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
  return new Response(req.method === 'HEAD' ? null : await res.text(), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600', 'last-modified': new Date((pg.lm || D.updated) + 'T00:00:00Z').toUTCString(), 'x-kb-h29': D.v } });
}
async function sitemap(env) {
  let D; try { D = await h29Data(env); } catch (e) { return new Response('Not ready', { status: 503 }); }
  const xe = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const urls = allPaths(D).flatMap(([p, lm]) => LANGS.map(l => '<url><loc>' + xe(PUB(l, p)) + '</loc><lastmod>' + (lm || D.updated) + '</lastmod>' + LANGS.map(a => '<xhtml:link rel="alternate" hreflang="' + a + '" href="' + xe(PUB(a, p)) + '"/>').join('') + '<xhtml:link rel="alternate" hreflang="x-default" href="' + xe(ORIGIN + p) + '"/></url>'));
  return new Response('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + urls.join('\n') + '\n</urlset>\n', { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}

// ------------------------------------------------------------------------------------------------ links from existing pages
// HTML appended to <main> of existing pages so every page of this module is linked from at least two of them:
//   /m/<market>/ (English market file), /handover/<year>/<place>/ and /handover/, /rankings/transparency/[<place>/], /developers/<slug>/,
//   /guides/buying-off-plan/<place>/, /new/ and /rankings/. Returns '' when there is nothing to link.
const GUIDE = { bali: ['Bali'], dubai: ['Dubai'], phuket: ['Phuket'], 'costa-del-sol': ['Costa del Sol'], lisbon: ['Portugal'], cyprus: ['Cyprus'], miami: ['Miami'], tulum: ['Riviera Maya'] };
const box = (lang, title, L) => L.length ? '<section class="k-sec kh29-more"><div class="k-wrap"><h2>' + esc(title) + '</h2><ul class="kfa-l" style="display:flex;flex-wrap:wrap;gap:8px 16px;padding:0;list-style:none">' + L.map(([l, p]) => '<li><a href="' + pre(lang) + p + '">' + esc(l) + '</a></li>').join('') + '</ul></div></section>' : '';
export async function linksFor(env, pathname) {
  const m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(.*)$/.exec(pathname); if (!m) return '';
  const lang = m[1] || 'en', p = '/' + m[2].replace(/\/?$/, '/');
  let D; try { D = await h29Data(env); } catch (e) { return ''; }
  const hubs = () => HUBS.map(([k, q]) => [t(lang, k, { mo: fd(D.month, lang) }), q]);
  let x;
  if ((x = /^\/m\/([^/]+)\/$/.exec(p))) { const mk = [...D.byMk.keys()].find(k => slugM(k) === x[1] || slugA(k) === slugA(decodeURIComponent(x[1]))); return mk ? box(lang, t(lang, 'more_h', { p: mkName(mk, lang) }), placeLinks(D, mk, lang)) : ''; }
  if ((x = /^\/handover\/20\d\d\/([a-z0-9-]+)\/$/.exec(p))) { const mk = D.mkOfSlug.get(x[1]); return mk ? box(lang, t(lang, 'more_h', { p: mkName(mk, lang) }), placeLinks(D, mk, lang)) : ''; }
  if (p === '/handover/' || p === '/rankings/transparency/' || p === '/new/' || p === '/rankings/' || p === '/guides/buying-off-plan/') return box(lang, t(lang, 'all_places'), hubs());
  if ((x = /^\/rankings\/transparency\/([a-z0-9-]+)\/$/.exec(p))) { const P = TR_PLACES.find(q => q.s === x[1]); const mk = P && !P.a && P.m.find(k => D.byMk.has(k)); return mk ? box(lang, t(lang, 'more_h', { p: mkName(mk, lang) }), placeLinks(D, mk, lang)) : ''; }
  if ((x = /^\/guides\/buying-off-plan\/([a-z-]+)\/$/.exec(p))) { const mk = (GUIDE[x[1]] || []).find(k => D.byMk.has(k)); return mk ? box(lang, t(lang, 'more_h', { p: mkName(mk, lang) }), placeLinks(D, mk, lang)) : ''; }
  if ((x = /^\/developers\/([a-z0-9-]+)\/$/.exec(p)) && !/-vs-/.test(x[1])) {
    const L = (D.drOfDev.get(x[1]) || []).map(s => [t(lang, 'l_dr') + ': ' + mkName(D.DR.get(s).mk, lang), '/rankings/developers/' + s + '/']).concat((D.vsOfDev.get(x[1]) || []).map(pr => [t(lang, 'vs_t', { a: pr.a.dv, b: pr.b.dv, p: mkName(pr.mk, lang) }), '/developers/' + pr.k + '/']));
    return box(lang, t(lang, 'l_vs'), L);
  }
  return '';
}
export const LINK_RX = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:m\/[^/.]{2,60}|handover(?:\/20\d\d\/[a-z0-9-]{2,60})?|rankings(?:\/transparency(?:\/[a-z0-9-]{2,40})?)?|new|guides\/buying-off-plan(?:\/[a-z-]{2,30})?|developers\/[a-z0-9-]{1,90})\/?$/;
