// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_h29__q, $s = TB.kbx_h29__s, $t = TB.kbx_h29__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { facetsData, FA_KIT } from './kbx_facets.js';
import { jget } from './kbx_jget.js';
import { trData } from './kbx_tr.js';
import { TR_PLACES } from './kbx_tr_places.js';
import { handoverOf, overdueOf, fd, esc, pre, lastmod, okHttp, host, dvSlice } from './kbx_named.js';
import { mkName, placeName, coName } from './kbx_hdate.js';
import { NT } from './kbx_buy_notes.js';
import { H } from './kbx_h29_i18n.js';
import { regSale, rsText } from './kbx_n31d_rs.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:rankings\/developers(?:\/[a-z0-9-]{2,60})?|permits(?:\/[a-z0-9-]{2,60})?|price-ranges(?:\/[a-z0-9-]{2,60})?|ownership(?:\/[a-z-]{2,30})?|golden-visa(?:\/[a-z-]{2,30})?|airports(?:\/[a-z]{3})?|reports(?:\/[a-z0-9-]{2,60})?|developers\/[a-z0-9-]{2,100}-vs-[a-z0-9-]{2,100})\/?$|^\/reports\/sitemap\.xml$/;
export const SITEMAP = '/reports/sitemap.xml';
const MIN = 5, DR_DEV = 5, DR_PROJ = 10, PR_PRICED = 10, RP_PROJ = 15, AP_KM = 25;
const { CSS, crumbHtml, crumbLd, kv, faqLd, replyBox, regFor } = FA_KIT;
const t = (lang, k, v) => { let s = (H[lang] && H[lang][k] != null) ? H[lang][k] : H.en[k]; if (s == null) return k; if (typeof s !== $q.a) return s; if (v) s = s.replace(/\{(\w+)\}/g, (m, a) => v[a] != null ? v[a] : m); return s; };
const te = (lang, k, v) => esc(t(lang, k, v));
const th = (lang, k, v) => { const s = esc(t(lang, k)); return v ? s.replace(/\{(\w+)\}/g, (m, a) => v[a] != null ? v[a] : m) : s; };
const nf = (lang, n, d) => { try { return Number(n).toLocaleString(LOC[lang] || 'en-GB', { maximumFractionDigits: d == null ? 0 : d }); } catch (e) { return String(n); } };
const bdi = s => '<bdi>' + esc(s) + $q.b;
const slugA = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const slugM = m => encodeURIComponent(String(m).toLowerCase().replace(/\s+/g, '-'));
const PUB = (lang, path) => ORIGIN + pre(lang) + path;
const moneyT = (lang, cur, v) => (cur ? cur + ' ' : '') + nf(lang, v);
const money = (lang, cur, v) => $q.c + esc(moneyT(lang, cur, v)) + $q.b;
const clen = s => [...String(s)].length;
const cutW = (s, n) => { const a = [...s]; if (a.length <= n) return s; const c = a.slice(0, n).join(''); const k = c.lastIndexOf(' '); return (k > n * 0.6 ? c.slice(0, k) : c).replace(/[\s,;:·(]+$/, ''); };
const fitT = (...c) => c.find(x => clen(x) <= 60) || cutW(c[c.length - 1], 60);
const fitD = (...c) => { const f = c.find(x => clen(x) <= 155); if (f) return f; let d = c[c.length - 1]; const S = d.split(/(?<=[.。])\s*/).filter(Boolean); while (S.length > 1 && clen(S.join(' ')) > 155) S.pop(); d = S.join(/[。]/.test(d) ? '' : ' '); return clen(d) <= 155 ? d : cutW(d, 154) + '.'; };
const median = a => { const s = a.filter(v => v != null && isFinite(v)).sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null; };
const quant = (a, q) => { const s = a.slice().sort((x, y) => x - y); if (!s.length) return null; const p = (s.length - 1) * q, lo = Math.floor(p), hi = Math.ceil(p); return s[lo] + (s[hi] - s[lo]) * (p - lo); };
const maxS = a => a.filter(Boolean).sort().pop() || null;
const today = () => new Date().toISOString().slice(0, 10);
const faqHtml = (lang, Q) => $q.d + te(lang, 'faq_h') + $q.e + Q.map(([q, a]) => $q.f + esc(q) + $q.g + esc(a) + $q.h).join('') + $q.i;
const table = (cols, rows, numCols) => $q.j + cols.map(c => $q.k + esc(c) + '</th>').join('') + $q.l +
  rows.map(cells => '<tr>' + cells.map((c, i) => '<td' + (numCols && numCols.includes(i) ? $q.m : '') + $q.n + esc(cols[i]) + '">' + c + '</td>').join('') + '</tr>').join('') + $q.o;
const srcA = (u, label) => okHttp(u) ? $q.p + esc(u.trim()) + $t.k0 + esc(label || host(u)) + '</a>' : '';
const SHARED = (globalThis.__kbJson = globalThis.__kbJson || {});
async function load(env, name) {
const m = SHARED[name]; if (m && (m.a || Date.now() - m.t < 600000)) return m.v;
return jget(env, name, ORIGIN + $q.q + name, ORIGIN + $q.r + name).then(o => o.v || null, () => null);
}
const curOf = x => String((x.fx && x.fx.currency) || '').toUpperCase().trim();
const pmin = x => (x.fx && +x.fx.price_min > 0 && !regSale(x)) ? +x.fx.price_min : null;
const pmax = x => (x.fx && +x.fx.price_max > 0) ? +x.fx.price_max : null;
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
const noteT = (k, lang) => (NT[k] && (NT[k][lang] || NT[k].en)) || t(lang, k);
const tenure = s => { s = String(s || '').toLowerCase();
const tr = /fideicomiso|bank trust/.test(s), fh = /freehold|full ownership|title deed|hak milik|\bshm\b|full title|fee simple|direct (title|ownership)|title directly|own property .*directly|hold title directly|escritura|tapu|chanote|outright/.test(s), lh = /leasehold|\blease|hak pakai|hak sewa|\bhgb\b|usufruct|right of use/.test(s);
if (tr && !fh && !lh) return 'trust'; if ((fh && lh) || (tr && (fh || lh))) return 'mixed'; return fh ? $q.s : lh ? $q.t : 'other'; };
const AIRPORTS = new Set(['DXB', 'DWC', 'SHJ', 'AUH', 'RKT', 'MIA', 'FLL', 'NCE', 'BER', 'MAN', 'TQO', 'CUN', 'KUL', 'HKT', 'DPS', 'LIS', 'AGP', 'LCA', 'PFO', 'IST', 'AYT', 'BKK', 'SGN', 'PVR', 'SJD', 'LHR', 'BCN', 'DOH', 'MCT', 'BAH']);
const hav = (a, b) => { const R = 6371.0088, r = Math.PI / 180, d1 = (b[0] - a[0]) * r, d2 = (b[1] - a[1]) * r; const h = Math.sin(d1 / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(d2 / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
const decs = v => { const s = String(v), i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1; };
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
const [tri, AR] = await Promise.all([trData(env).catch(() => null), load(env, $q.u).catch(() => null)]);
const month = today().slice(0, 7);
if (IX && IX.F === F && IX.AR === AR && IX.month === month) return IX;
const ix = F.ix, P = F.P, sc = id => F.score(id);
const comp = id => { const r = tri && tri.rows.get(id); return r ? r.comp : null; };
const byScore = (a, b) => (sc(b.id) ?? -1) - (sc(a.id) ?? -1) || String(a.n).localeCompare(String(b.n));
const byMk = new Map(); for (const x of P) { if (!byMk.has(x.mk)) byMk.set(x.mk, []); byMk.get(x.mk).push(x); }
const mkOfSlug = new Map(); for (const mk of byMk.keys()) mkOfSlug.set(slugA(mk), mk);
const hd = x => !!handoverOf(ix, x), ov = x => !!overdueOf(ix, x), moved = x => { const h = (ix.prom[x.id] || []).find(p => p.k === $q.v); return !!(h && h.mv > 0); };
const devStats = L => { const s = L.map(x => sc(x.id)).filter(v => v != null); const best = L.slice().sort(byScore)[0]; return { L: L.slice().sort(byScore), k: L.length, med: s.length ? Math.round(median(s)) : null, best, bestS: best ? sc(best.id) : null, pn: L.filter(x => x.pn).length, hd: L.filter(hd).length, ov: L.filter(ov).length, mv: L.filter(moved).length }; };
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
const PM = new Map();
for (const [mk, L] of byMk) { const W = L.filter(x => x.pn).sort(byScore); if (W.length >= MIN) PM.set(slugA(mk), { mk, s: slugA(mk), L: W, n: L.length, conf: W.filter(x => { const c = comp(x.id); return c && c.permitreg && c.permitreg.st === 'yes'; }).length, lm: maxS(W.map(x => lastmod(ix, x))) }); }
const PR = new Map();
for (const [mk, L] of byMk) {
const cc = new Map(); for (const x of L) if (pmin(x)) { const c = curOf(x); cc.set(c, (cc.get(c) || 0) + 1); }
const top = [...cc.entries()].sort((a, b) => b[1] - a[1])[0]; if (!top || !$t.o_BANDS[top[0]] || top[1] < PR_PRICED) continue;
const cur = top[0], B = $t.o_BANDS[cur], W = L.filter(x => pmin(x) && curOf(x) === cur);
const bands = [0, 1, 2, 3].map(i => ({ i, lo: i ? B[i - 1] : null, hi: i < 3 ? B[i] : null, L: [] }));
for (const x of W) { const p = pmin(x); bands[p < B[0] ? 0 : p < B[1] ? 1 : p < B[2] ? 2 : 3].L.push(x); }
for (const b of bands) b.L.sort((a, c) => pmin(a) - pmin(c) || String(a.n).localeCompare(String(c.n)));
if (!bands.some(b => b.L.length >= MIN)) continue;
const other = [...cc.entries()].filter(([c]) => c !== cur);
PR.set(slugA(mk), { mk, s: slugA(mk), cur, bands, W, other, lm: maxS(W.map(x => lastmod(ix, x))) });
}
const OW = new Map();
for (const o of $t.o_OWN) {
const W = P.filter(x => o.co.includes(x.co) && x.fx && x.fx.foreign_ownership).sort((a, b) => String(a.mk).localeCompare(String(b.mk)) || byScore(a, b));
if (W.length < MIN) continue;
const G = { freehold: [], leasehold: [], trust: [], mixed: [], other: [] }; for (const x of W) G[tenure(x.fx.foreign_ownership)].push(x);
OW.set(o.s, { o, s: o.s, co: W[0].co, W, G, lm: maxS(W.map(x => lastmod(ix, x))) });
}
const GVM = new Map();
for (const g of $t.o_GV) {
const W = P.filter(x => g.co.includes(x.co) && pmin(x) && curOf(x) === g.cur);
const all = W.filter(x => pmin(x) >= g.th).sort((a, b) => pmin(a) - pmin(b) || String(a.n).localeCompare(String(b.n)));
const some = W.filter(x => pmin(x) < g.th && (pmax(x) || 0) >= g.th).sort((a, b) => pmin(b) - pmin(a));
if (all.length < MIN) continue;
GVM.set(g.s, { g, s: g.s, co: W[0].co, all, some, n: W.length, lm: maxS(all.concat(some).map(x => lastmod(ix, x))) });
}
const AP = new Map(), apOfMk = new Map();
if (AR && AR.projects) {
const pts = new Map(); for (const v of Object.values(AR.projects)) for (const k of [$q.w, $q.x]) { const a = v && v[k]; if (a && a.iata && AIRPORTS.has(a.iata) && Array.isArray(a.ll)) pts.set(a.iata, { i: a.iata, n: a.n || a.iata, ll: a.ll }); }
const seen = new Map(); for (const x of P) if (x.fx && x.fx.lat != null && x.fx.lng != null) { const k = x.fx.lat + ',' + x.fx.lng; seen.set(k, (seen.get(k) || 0) + 1); }
const pins = P.filter(x => x.fx && isFinite(x.fx.lat) && isFinite(x.fx.lng) && x.fx.lat !== null && decs(x.fx.lat) >= 3 && decs(x.fx.lng) >= 3 && seen.get(x.fx.lat + ',' + x.fx.lng) === 1);
for (const a of pts.values()) {
const L = pins.map(x => ({ x, km: hav([+x.fx.lat, +x.fx.lng], a.ll) })).filter(r => r.km <= AP_KM).sort((p, q) => p.km - q.km);
if (L.length < MIN) continue;
const s = a.i.toLowerCase(); AP.set(s, Object.assign({ s, L, lm: maxS(L.map(r => lastmod(ix, r.x))) }, a));
for (const mk of new Set(L.map(r => r.x.mk))) { if (!apOfMk.has(mk)) apOfMk.set(mk, []); apOfMk.get(mk).push(s); }
}
}
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
const pLink = (lang, x) => $q.y + pre(lang) + $q.z + x.s + '/">' + bdi(x.n) + '</a>';
const dLink = (D, lang, x) => x.dv ? (x.dvs && D.ix.devs.has(x.dvs) ? $q.y + pre(lang) + $q.A + x.dvs + '/">' + bdi(x.dv) + '</a>' : bdi(x.dv)) : te(lang, 'np');
const dLinkS = (D, lang, dvs, dv) => D.ix.devs.has(dvs) ? $q.y + pre(lang) + $q.A + dvs + '/">' + bdi(dv) + '</a>' : bdi(dv);
const hoCell = (D, lang, x) => { const h = handoverOf(D.ix, x); return h ? esc(fd(h.d, lang)) : te(lang, 'np'); };
const scCell = (D, lang, x) => { const s = D.sc(x.id); return s == null ? '-' : '<b>' + nf(lang, s) + '</b>'; };
const pc = (lang, x) => pmin(x) ? money(lang, curOf(x), pmin(x)) : te(lang, 'np');
const px = (lang, x) => pmax(x) ? money(lang, curOf(x), pmax(x)) : '-';
const dataLine = (D, lang, d, files) => $q.B + te(lang, $q.C, { d: fd(D.updated, lang) }) + ' ' + (files || [$q.D]).map(f => $q.E + f + '">' + f + '</a>').join(' · ') + $q.F + pre(lang) + $q.G + te(lang, $q.H) + $q.I;
const method = lang => $q.J + te(lang, $q.K) + $q.L + te(lang, 'meth') + '</p>';
const citeBox = (lang, title, url, d) => $q.M + te(lang, $q.N) + $q.O + te(lang, 'cite', { t: title, u: url, d: fd(d, lang) }) + $q.P;
const head = (lang, cr, h1, lead, d) => $q.Q + crumbHtml(cr) + '<h1>' + h1 + $q.R + lead + $q.S + d + '">' + esc(fd(d, lang)) + $q.T;
const wrap = body => $t.k1 + body + $q.U;
const webLd = (lang, url, title, desc, lm, type) => ({ '@type': type || $q.V, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: lm, isPartOf: { '@type': $q.W, name: $q.X, url: ORIGIN + '/' } });
const listLd = (lang, title, L) => ({ '@type': $q.Y, name: title, numberOfItems: L.length, itemListElement: L.slice(0, 100).map((x, i) => ({ '@type': $q.Z, position: i + 1, name: x.n, url: PUB(lang, $q.z + x.s + '/') })) });
const dataLd = (url, title, desc, lm, place, files) => ({ '@type': $q.aa, '@id': url + '#data', name: title, description: desc, url, isAccessibleForFree: true, dateModified: lm, license: $t.k2, creator: { '@type': $q.ab, name: $q.X, url: ORIGIN + '/' }, ...(place ? { spatialCoverage: { '@type': 'Place', name: place } } : {}), distribution: (files || [$q.D]).map(f => ({ '@type': $q.ac, encodingFormat: $q.ad, contentUrl: ORIGIN + $q.r + f })) });
const crumbs = (lang, mid, last) => [[$q.X, pre(lang) + '/']].concat(mid || []).concat([last]);
const pct = (k, n) => n ? Math.round(k / n * 100) : 0;
function placeLinks(D, mk, lang, skip) {
const s = slugA(mk), L = [];
if (D.RP.has(s)) L.push([t(lang, 'l_rp'), $q.ae + s + '/']);
if (D.DR.has(s)) L.push([t(lang, 'l_dr'), $q.af + s + '/']);
if (D.PM.has(s)) L.push([t(lang, 'l_pm'), $q.ag + s + '/']);
if (D.PR.has(s)) L.push([t(lang, 'l_pr'), $q.ah + s + '/']);
for (const a of D.apOfMk.get(mk) || []) { const A = D.AP.get(a); L.push([t(lang, 'l_ap', { a: A.n }), $q.ai + a + '/']); }
const co = (D.byMk.get(mk) || [])[0]; if (co) { for (const o of D.OW.values()) if (o.o.co.includes(co.co)) L.push([t(lang, 'l_ow') + ': ' + (coName(o.co, lang) || o.co), $q.aj + o.s + '/']); for (const g of D.GV.values()) if (g.g.co.includes(co.co)) L.push([t(lang, 'gv_p_' + g.s), $q.ak + g.s + '/']); }
for (const pr of (D.vsOfMk.get(mk) || []).slice(0, 6)) L.push([t(lang, 'vs_t2', { a: pr.a.dv, b: pr.b.dv }), $q.A + pr.k + '/']);
return L.filter(([, p]) => p !== skip);
}
const linksBlock = (lang, title, L) => L.length ? $q.al + esc(title) + $q.am + L.map(([l, p]) => $q.an + pre(lang) + p + '">' + esc(l) + $q.ao).join('') + '</ul>' : '';
const moreHtml = (D, mk, lang, skip) => { const L = placeLinks(D, mk, lang, skip); return L.length ? $q.al + te(lang, $q.ap, { p: mkName(mk, lang) }) + $q.am + L.map(([l, p]) => $q.an + pre(lang) + p + '">' + esc(l) + $q.ao).join('') + '</ul>' : ''; };
function drPage(D, s, lang) {
const g = D.DR.get(s); if (!g) return null;
const p = mkName(g.mk, lang), path = $q.af + s + '/', url = PUB(lang, path), d = D.updated, top = g.devs[0];
const title = fitT(...(H[lang] && H[lang].dr_tl ? [t(lang, 'dr_tl', { p, k: nf(lang, g.devs.length), n: nf(lang, g.n) })] : []), t(lang, 'dr_t', { p }), t(lang, 'dr_t2', { p }), t(lang, 'dr_t3', { p }));
const desc = fitD(t(lang, 'dr_d', { k: nf(lang, g.devs.length), p, n: nf(lang, g.n), d: fd(d, lang) }));
const cr = crumbs(lang, [[t(lang, 'drh_t'), pre(lang) + $q.af]], [title, pre(lang) + path]);
const cols = t(lang, $q.aq);
const rows = g.devs.map(v => [nf(lang, v.rank), dLinkS(D, lang, v.dvs, v.dv), nf(lang, v.k), v.med == null ? '-' : '<b>' + nf(lang, v.med) + '</b>', v.best ? pLink(lang, v.best) + $q.ar + nf(lang, v.bestS) + $q.as : '-', nf(lang, v.pn), nf(lang, v.hd), nf(lang, v.ov)]);
const Q = [[t(lang, 'dr_q1', { p }), t(lang, 'dr_a1', { dv: top.dv, s: nf(lang, top.med), k: nf(lang, top.k), d: fd(d, lang) })], [t(lang, 'dr_q2', { p }), t(lang, 'dr_a2', { k: nf(lang, g.devs.length), n: nf(lang, g.n), d: fd(d, lang) })]];
const allS = g.devs.flatMap(v => v.L.map(x => D.sc(x.id))).filter(v => v != null);
const vs = D.vsOfMk.get(g.mk) || [];
const body = wrap(head(lang, cr, th(lang, 'dr_t', { p: bdi(p) }), te(lang, $q.at, { p }), today()) +
kv([[nf(lang, g.devs.length), t(lang, $q.au)], [nf(lang, g.n), t(lang, 'kv_tr')], [nf(lang, Math.round(median(allS))), t(lang, $q.av)], [nf(lang, g.devs.reduce((a, v) => a + v.pn, 0)), t(lang, 'kv_pn')]]) +
$q.aw + esc(title) + '</h2>' + table(cols, rows, [0, 2, 3, 5, 6, 7]) + $q.B + te(lang, $q.ax) + '</p>' + dataLine(D, lang, g.lm, [$q.D, $q.ay, $q.az]) +
(vs.length ? $q.aA + te(lang, $q.aB) + $q.am + vs.map(pr => $q.an + pre(lang) + $q.A + pr.k + '/">' + th(lang, 'vs_t2', { a: bdi(pr.a.dv), b: bdi(pr.b.dv) }) + $q.ao).join('') + '</ul>' : '') +
method(lang) + citeBox(lang, title, url, d) + faqHtml(lang, Q) + moreHtml(D, g.mk, lang, path) + replyBox(lang));
const ld = [webLd(lang, url, title, desc, g.lm), dataLd(url, title, desc, g.lm, g.mk, [$q.D, $q.ay]), { '@type': $q.Y, name: title, numberOfItems: g.devs.length, itemListElement: g.devs.map((v, i) => ({ '@type': $q.Z, position: i + 1, name: v.dv, ...(D.ix.devs.has(v.dvs) ? { url: PUB(lang, $q.A + v.dvs + '/') } : {}) })) }, crumbLd(cr), faqLd(Q)];
return { title, desc, body, ld, path, lm: g.lm };
}
function drHub(D, lang) {
if (!D.DR.size) return null;
const path = $q.af, url = PUB(lang, path), G = [...D.DR.values()].sort((a, b) => b.devs.length - a.devs.length || a.mk.localeCompare(b.mk));
const title = fitT(t(lang, 'drh_t')), desc = fitD(t(lang, $q.aC)), lm = maxS(G.map(g => g.lm));
const cr = crumbs(lang, [], [title, pre(lang) + path]), cols = t(lang, $q.aD);
const rows = G.map(g => [$q.y + pre(lang) + path + g.s + '/">' + bdi(mkName(g.mk, lang)) + '</a>', nf(lang, g.devs.length), nf(lang, g.n), dLinkS(D, lang, g.devs[0].dvs, g.devs[0].dv)]);
const V = [...D.VS.values()].sort((a, b) => a.mk.localeCompare(b.mk) || a.k.localeCompare(b.k));
const body = wrap(head(lang, cr, te(lang, 'drh_t'), te(lang, $q.aC), today()) + table(cols, rows, [1, 2]) +
(V.length ? $q.aA + te(lang, $q.aB) + $q.am + V.map(pr => $q.an + pre(lang) + $q.A + pr.k + '/">' + th(lang, 'vs_t', { a: bdi(pr.a.dv), b: bdi(pr.b.dv), p: bdi(mkName(pr.mk, lang)) }) + $q.ao).join('') + '</ul>' : '') +
dataLine(D, lang, lm) + method(lang) + hubNav(lang, path) + replyBox(lang));
const ld = [webLd(lang, url, title, desc, lm), { '@type': $q.Y, name: title, numberOfItems: G.length, itemListElement: G.map((g, i) => ({ '@type': $q.Z, position: i + 1, name: g.mk, url: PUB(lang, path + g.s + '/') })) }, crumbLd(cr)];
return { title, desc, body, ld, path, lm };
}
function vsPage(D, k, lang) {
const pr = D.VS.get(k); if (!pr) return null;
const { a, b, mk } = pr, p = mkName(mk, lang), path = $q.A + k + '/', url = PUB(lang, path), d = D.updated, ix = D.ix;
const title = fitT(t(lang, 'vs_t', { a: a.dv, b: b.dv, p }), t(lang, 'vs_t2', { a: a.dv, b: b.dv }));
const desc = fitD(t(lang, 'vs_d', { a: a.dv, b: b.dv, p, d: fd(d, lang) }));
const cr = crumbs(lang, [[t(lang, 'drh_t'), pre(lang) + $q.af], [mkName(mk, lang), pre(lang) + $q.af + pr.s + '/']], [title, pre(lang) + path]);
const medP = v => { const c = new Map(); for (const x of v.L) if (pmin(x)) c.set(curOf(x), (c.get(curOf(x)) || []).concat(pmin(x))); const top = [...c.entries()].sort((q, r) => r[1].length - q[1].length)[0]; return top ? money(lang, top[0], Math.round(median(top[1]))) + $q.aE + nf(lang, top[1].length) + $q.aF : te(lang, 'np'); };
const done = v => { const s = D.F.dev.get(v.dvs); return s ? nf(lang, s.done) : '-'; };
const R = t(lang, $q.aG), vals = v => [nf(lang, v.k), v.med == null ? '-' : '<b>' + nf(lang, v.med) + '</b>', v.bestS == null ? '-' : nf(lang, v.bestS), nf(lang, v.pn), nf(lang, v.hd), nf(lang, v.mv), nf(lang, v.ov), medP(v), done(v)];
const va = vals(a), vb = vals(b);
const tbl = $s.k0 + dLinkS(D, lang, a.dvs, a.dv) + $q.aH + dLinkS(D, lang, b.dvs, b.dv) + $q.aI +
R.map((r, i) => $q.aJ + esc(r.replace('{p}', p)) + $q.aK + va[i] + $q.aL + vb[i] + $q.aM).join('') + $q.o;
const cols = [t(lang, $q.aN), t(lang, $q.aO), t(lang, 'c_ho'), t(lang, $q.aP), t(lang, 'c_sc')];
const lst = v => $q.aQ + esc(v.dvs) + '">' + th(lang, $q.aR, { a: bdi(v.dv), p: bdi(p) }) + '</h2>' + table(cols, v.L.map(x => [pLink(lang, x), esc(placeName(x.ar || x.mk, lang)), hoCell(D, lang, x), pc(lang, x), scCell(D, lang, x)]), [4]);
const w = a.med === b.med ? null : (a.med ?? -1) > (b.med ?? -1) ? a : b, l = w === a ? b : a;
const Q = [[t(lang, 'vs_q1', { p, a: a.dv, b: b.dv }), w ? t(lang, 'vs_a1', { w: w.dv, s1: nf(lang, w.med), s2: nf(lang, l.med), d: fd(d, lang) }) : t(lang, $q.aS, { s1: nf(lang, a.med), d: fd(d, lang) })],
[t(lang, 'vs_q2', { a: a.dv, b: b.dv, p }), t(lang, 'vs_a2', { a: a.dv, b: b.dv, k1: nf(lang, a.k), k2: nf(lang, b.k), d: fd(d, lang) })]];
const others = (D.vsOfMk.get(mk) || []).filter(o => o !== pr);
const body = wrap(head(lang, cr, th(lang, 'vs_t', { a: bdi(a.dv), b: bdi(b.dv), p: bdi(p) }), te(lang, $q.aT, { p }), today()) + tbl + dataLine(D, lang, pr.lm, [$q.D, $q.aU, $q.az]) + lst(a) + lst(b) +
(others.length ? $q.aV + te(lang, $q.aW, { p }) + $q.am + others.map(o => $q.an + pre(lang) + $q.A + o.k + '/">' + th(lang, 'vs_t2', { a: bdi(o.a.dv), b: bdi(o.b.dv) }) + $q.ao).join('') + '</ul>' : '') +
method(lang) + faqHtml(lang, Q) + moreHtml(D, mk, lang, path) + replyBox(lang));
const ld = [webLd(lang, url, title, desc, pr.lm, $q.aX), listLd(lang, title, a.L.concat(b.L)), crumbLd(cr), faqLd(Q)];
return { title, desc, body, ld, path, lm: pr.lm };
}
function pmPage(D, s, lang) {
const g = D.PM.get(s); if (!g) return null;
const p = mkName(g.mk, lang), path = $q.ag + s + '/', url = PUB(lang, path), d = D.updated, k = g.L.length;
const title = fitT(t(lang, 'pm_t', { p }), t(lang, 'pm_t2', { p }), t(lang, 'pm_t3', { p }));
const desc = fitD(t(lang, 'pm_d', { k: nf(lang, k), n: nf(lang, g.n), p, d: fd(d, lang) }));
const cr = crumbs(lang, [[t(lang, 'pmh_t'), pre(lang) + $q.ag]], [title, pre(lang) + path]), cols = t(lang, $q.aY);
const rows = g.L.map(x => { const c = D.comp(x.id), ok = c && c.permitreg && c.permitreg.st === 'yes'; return [pLink(lang, x), dLink(D, lang, x), $q.c + esc(x.pn) + $q.b + srcA(okHttp(x.du) ? x.du : x.url), x.fx && x.fx.permit_authority ? bdi(x.fx.permit_authority) : te(lang, 'np'), ok ? te(lang, 'yes') : te(lang, 'no'), hoCell(D, lang, x), scCell(D, lang, x)]; });
const regs = regFor(D.F, g.L[0]) || [];
const regH = $q.aZ + te(lang, $q.ba, { p }) + '</h2>' + (regs.length ? $q.bb + regs.slice(0, 3).map(r => '<li>' + bdi(r.register) + (r.url ? srcA(r.url) : '') + '</li>').join('') + '</ul>' : '<p>' + te(lang, $q.bc, { p }) + '</p>') + $q.bd + te(lang, $q.be) + $q.I;
const Q = [[t(lang, 'pm_q1', { p }), t(lang, 'pm_a1', { k: nf(lang, k), n: nf(lang, g.n), r: nf(lang, pct(k, g.n)), d: fd(d, lang) })], [t(lang, 'pm_q2'), t(lang, 'pm_a2', { c: nf(lang, g.conf), k: nf(lang, k) })]];
const body = wrap(head(lang, cr, th(lang, 'pm_t', { p: bdi(p) }), te(lang, $q.bf), today()) +
kv([[nf(lang, k), t(lang, 'kv_pn')], [nf(lang, g.n), t(lang, 'kv_tr')], [nf(lang, pct(k, g.n)) + ' %', t(lang, $q.bg)[3]], [nf(lang, g.conf), t(lang, $q.aY)[4]]]) +
$q.bh + esc(title) + '</h2>' + table(cols, rows, [6]) + dataLine(D, lang, g.lm, [$q.D, $q.bi]) + regH + method(lang) + citeBox(lang, title, url, d) + faqHtml(lang, Q) + moreHtml(D, g.mk, lang, path) + replyBox(lang));
const ld = [webLd(lang, url, title, desc, g.lm), dataLd(url, title, desc, g.lm, g.mk, [$q.D, $q.bi]), listLd(lang, title, g.L), crumbLd(cr), faqLd(Q)];
return { title, desc, body, ld, path, lm: g.lm };
}
function pmHub(D, lang) {
if (!D.PM.size) return null;
const path = $q.ag, url = PUB(lang, path), G = [...D.PM.values()].sort((a, b) => b.L.length - a.L.length || a.mk.localeCompare(b.mk));
const title = fitT(t(lang, 'pmh_t')), desc = fitD(t(lang, $q.bj)), lm = maxS(G.map(g => g.lm)), cr = crumbs(lang, [], [title, pre(lang) + path]), cols = t(lang, $q.bg);
const rows = G.map(g => [$q.y + pre(lang) + path + g.s + '/">' + bdi(mkName(g.mk, lang)) + '</a>', '<b>' + nf(lang, g.L.length) + '</b>', nf(lang, g.n), nf(lang, pct(g.L.length, g.n)) + ' %']);
const body = wrap(head(lang, cr, te(lang, 'pmh_t'), te(lang, $q.bj), today()) + table(cols, rows, [1, 2, 3]) + dataLine(D, lang, lm) + method(lang) + hubNav(lang, path) + replyBox(lang));
const ld = [webLd(lang, url, title, desc, lm), { '@type': $q.Y, name: title, numberOfItems: G.length, itemListElement: G.map((g, i) => ({ '@type': $q.Z, position: i + 1, name: g.mk, url: PUB(lang, path + g.s + '/') })) }, crumbLd(cr)];
return { title, desc, body, ld, path, lm };
}
const bandLabel = (lang, cur, b) => b.lo == null ? t(lang, 'pr_lt', { a: moneyT(lang, cur, b.hi) }) : b.hi == null ? t(lang, 'pr_ge', { a: moneyT(lang, cur, b.lo) }) : t(lang, 'pr_bt', { a: moneyT(lang, cur, b.lo), b: moneyT(lang, cur, b.hi) });
function prPage(D, s, lang) {
const g = D.PR.get(s); if (!g) return null;
const p = mkName(g.mk, lang), path = $q.ah + s + '/', url = PUB(lang, path), d = D.updated, n = g.W.length, cur = g.cur;
const title = fitT(t(lang, 'pr_t', { p }), t(lang, 'pr_t2', { p }), t(lang, 'pr_t3', { p }));
const desc = fitD(t(lang, 'pr_d', { n: nf(lang, n), p, c: cur, d: fd(d, lang) }));
const cr = crumbs(lang, [[t(lang, 'prh_t'), pre(lang) + $q.ah]], [title, pre(lang) + path]);
const sc = t(lang, $q.bk), cols = t(lang, $q.bl);
const sum = g.bands.map(b => { const ss = b.L.map(x => D.sc(x.id)).filter(v => v != null); return [b.L.length >= MIN ? $q.bm + b.i + '">' + bdi(bandLabel(lang, cur, b)) + '</a>' : bdi(bandLabel(lang, cur, b)), '<b>' + nf(lang, b.L.length) + '</b>', b.L.length ? money(lang, cur, Math.round(median(b.L.map(pmin)))) : '-', nf(lang, b.L.filter(x => x.pn).length), ss.length ? nf(lang, Math.round(median(ss))) : '-']; });
const secs = g.bands.filter(b => b.L.length >= MIN).map(b => $q.bn + b.i + '">' + bdi(bandLabel(lang, cur, b)) + $q.aE + nf(lang, b.L.length) + $q.bo + table(cols, b.L.map(x => [pLink(lang, x), dLink(D, lang, x), pc(lang, x), px(lang, x), hoCell(D, lang, x), scCell(D, lang, x)]), [5])).join('');
const all = g.W.map(pmin), big = g.bands.slice().sort((a, b) => b.L.length - a.L.length)[0];
const Q = [[t(lang, 'pr_q1', { p }), t(lang, 'pr_a1', { m: moneyT(lang, cur, Math.round(median(all))), n: nf(lang, n), c: cur, lo: moneyT(lang, cur, Math.min(...all)), hi: moneyT(lang, cur, Math.max(...all)), d: fd(d, lang) })], [t(lang, 'pr_q2', { p }), t(lang, 'pr_a2', { b: bandLabel(lang, cur, big), k: nf(lang, big.L.length), n: nf(lang, n) })]];
const oth = g.other.reduce((a, [, k]) => a + k, 0);
const body = wrap(head(lang, cr, th(lang, 'pr_t', { p: bdi(p) }), te(lang, $q.bp, { c: cur }), today()) +
kv([[nf(lang, n), t(lang, 'kv_tr')], [money(lang, cur, Math.round(median(all))), t(lang, 'kv_mp')], [money(lang, cur, Math.min(...all)), t(lang, $q.bq)[0]], [money(lang, cur, Math.max(...all)), t(lang, $q.bq)[4]]]) +
$q.br + te(lang, $q.bs) + '</h2>' + table(sc, sum, [1, 2, 3, 4]) + $q.B + te(lang, $q.bt) + (oth ? ' ' + te(lang, $q.bu, { k: nf(lang, oth), p, c: g.other.map(([c]) => c).join(', ') }) : '') + '</p>' +
secs + dataLine(D, lang, g.lm) + method(lang) + citeBox(lang, title, url, d) + faqHtml(lang, Q) + moreHtml(D, g.mk, lang, path) + replyBox(lang));
const ld = [webLd(lang, url, title, desc, g.lm), dataLd(url, title, desc, g.lm, g.mk), listLd(lang, title, g.W), crumbLd(cr), faqLd(Q)];
return { title, desc, body, ld, path, lm: g.lm };
}
function prHub(D, lang) {
if (!D.PR.size) return null;
const path = $q.ah, url = PUB(lang, path), G = [...D.PR.values()].sort((a, b) => b.W.length - a.W.length || a.mk.localeCompare(b.mk));
const title = fitT(t(lang, 'prh_t')), desc = fitD(t(lang, $q.bv)), lm = maxS(G.map(g => g.lm)), cr = crumbs(lang, [], [title, pre(lang) + path]), cols = t(lang, $q.bw);
const rows = G.map(g => [$q.y + pre(lang) + path + g.s + '/">' + bdi(mkName(g.mk, lang)) + '</a>', esc(g.cur), nf(lang, g.W.length), money(lang, g.cur, Math.round(median(g.W.map(pmin))))]);
const body = wrap(head(lang, cr, te(lang, 'prh_t'), te(lang, $q.bv), today()) + table(cols, rows, [2, 3]) + dataLine(D, lang, lm) + method(lang) + hubNav(lang, path) + replyBox(lang));
const ld = [webLd(lang, url, title, desc, lm), { '@type': $q.Y, name: title, numberOfItems: G.length, itemListElement: G.map((g, i) => ({ '@type': $q.Z, position: i + 1, name: g.mk, url: PUB(lang, path + g.s + '/') })) }, crumbLd(cr)];
return { title, desc, body, ld, path, lm };
}
const srcLine = (lang, k) => { const S = SRC[k]; return S ? $q.ar + srcA(S.u, S.n) + ' (' + esc(fd(S.d, lang)) + $q.aF : ''; };
function owPage(D, s, lang) {
const g = D.OW.get(s); if (!g) return null;
const c = coName(g.co, lang) || g.co, path = $q.aj + s + '/', url = PUB(lang, path), d = D.updated, G = g.G, n = g.W.length;
const f = G.freehold.length, l = G.leasehold.length, o = n - f - l;
const title = fitT(t(lang, 'ow_t', { c }), t(lang, 'ow_t2', { c }), t(lang, 'ow_t3', { c }));
const desc = fitD(t(lang, 'ow_d', { n: nf(lang, n), c, f: nf(lang, f), l: nf(lang, l), o: nf(lang, o), d: fd(d, lang) }));
const cr = crumbs(lang, [[t(lang, 'owh_t'), pre(lang) + $q.aj]], [title, pre(lang) + path]);
const law = $q.bx + te(lang, $q.by) + $q.bz + g.o.notes.map(([k, sk]) => $q.bA + esc(noteT(k, lang)) + srcLine(lang, sk) + '</li>').join('') + '</ul>';
const cols = t(lang, $q.bB);
const secs = [$q.s, $q.t, 'trust', 'mixed', 'other'].filter(k => G[k].length).map(k => $q.bC + k + '">' + te(lang, 'ow_g_' + k) + $q.aE + nf(lang, G[k].length) + $q.bo +
table(cols, G[k].map(x => [pLink(lang, x), dLink(D, lang, x), esc(placeName(x.ar || x.mk, lang)), $q.bD + esc(String(x.fx.foreign_ownership)) + $q.bE + srcA(x.url)]))).join('');
const Q = [[t(lang, 'ow_q1', { c }), noteT(g.o.q1, lang)], [t(lang, 'ow_q2', { c }), t(lang, 'ow_a2', { f: nf(lang, f), n: nf(lang, n), l: nf(lang, l), d: fd(d, lang) })]];
const mks = [...new Set(g.W.map(x => x.mk))];
const body = wrap(head(lang, cr, th(lang, 'ow_t', { c: bdi(c) }), te(lang, $q.bF, { c }), today()) +
kv([[nf(lang, f), t(lang, $q.bG)], [nf(lang, l), t(lang, $q.bH)], ...(G.trust.length ? [[nf(lang, G.trust.length), t(lang, $q.bI)]] : []), [nf(lang, G.mixed.length + G.other.length), t(lang, $q.bJ)]]) +
law + secs + $q.B + te(lang, $q.bK) + '</p>' + dataLine(D, lang, g.lm) + method(lang) + citeBox(lang, title, url, d) + faqHtml(lang, Q) +
linksBlock(lang, t(lang, $q.ap, { p: c }), mks.filter(mk => D.RP.has(slugA(mk))).map(mk => [t(lang, 'l_rp') + ': ' + mkName(mk, lang), $q.ae + slugA(mk) + '/']).concat([[t(lang, 'owh_t'), $q.aj]])) + replyBox(lang));
const ld = [webLd(lang, url, title, desc, g.lm), dataLd(url, title, desc, g.lm, g.co), listLd(lang, title, g.W), crumbLd(cr), faqLd(Q)];
return { title, desc, body, ld, path, lm: g.lm };
}
function owHub(D, lang) {
if (!D.OW.size) return null;
const path = $q.aj, url = PUB(lang, path), G = [...D.OW.values()];
const title = fitT(t(lang, 'owh_t')), desc = fitD(t(lang, $q.bL)), lm = maxS(G.map(g => g.lm)), cr = crumbs(lang, [], [title, pre(lang) + path]), cols = t(lang, $q.bM);
const rows = G.map(g => [$q.y + pre(lang) + path + g.s + '/">' + bdi(coName(g.co, lang) || g.co) + '</a>', nf(lang, g.W.length), nf(lang, g.G.freehold.length), nf(lang, g.G.leasehold.length), nf(lang, g.W.length - g.G.freehold.length - g.G.leasehold.length)]);
const body = wrap(head(lang, cr, te(lang, 'owh_t'), te(lang, $q.bL), today()) + table(cols, rows, [1, 2, 3, 4]) + dataLine(D, lang, lm) + method(lang) + hubNav(lang, path) + replyBox(lang));
const ld = [webLd(lang, url, title, desc, lm), { '@type': $q.Y, name: title, numberOfItems: G.length, itemListElement: G.map((g, i) => ({ '@type': $q.Z, position: i + 1, name: g.co, url: PUB(lang, path + g.s + '/') })) }, crumbLd(cr)];
return { title, desc, body, ld, path, lm };
}
function gvPage(D, s, lang) {
const g = D.GV.get(s); if (!g) return null;
const c = coName(g.co, lang) || g.co, path = $q.ak + s + '/', url = PUB(lang, path), d = D.updated, thr = moneyT(lang, g.g.cur, g.g.th);
const title = fitT(t(lang, 'gv_t_' + s), t(lang, $q.bN + s));
const desc = fitD(t(lang, 'gv_d', { k: nf(lang, g.all.length), c, th: thr, s: nf(lang, g.some.length), d: fd(d, lang) }));
const cr = crumbs(lang, [[t(lang, 'gvh_t'), pre(lang) + $q.ak]], [title, pre(lang) + path]), cols = t(lang, $q.bO);
const rule = $q.bP + te(lang, $q.bQ) + $q.L + te(lang, $q.bR + s) + $q.bS + g.g.src.map(k => '<li>' + srcA(SRC[k].u, SRC[k].n) + $q.aE + esc(fd(SRC[k].d, lang)) + $q.bT).join('') + '</ul>';
const rowsOf = L => L.map(x => [pLink(lang, x), dLink(D, lang, x), esc(placeName(x.ar || x.mk, lang)), pc(lang, x), px(lang, x), hoCell(D, lang, x), scCell(D, lang, x)]);
const Q = [[t(lang, 'gv_q1', { c, th: thr }), t(lang, 'gv_a1', { k: nf(lang, g.all.length), th: thr, s: nf(lang, g.some.length), d: fd(d, lang) })], [t(lang, 'gv_q2'), t(lang, 'gv_a2', { r: t(lang, $q.bR + s) })]];
const mks = [...new Set(g.all.map(x => x.mk))];
const body = wrap(head(lang, cr, esc(t(lang, 'gv_t_' + s)), te(lang, $q.bU), today()) +
kv([[money(lang, g.g.cur, g.g.th), t(lang, $q.bV)[1]], [nf(lang, g.all.length), t(lang, $q.bV)[2]], [nf(lang, g.some.length), t(lang, $q.bV)[3]], [nf(lang, g.n), t(lang, 'kv_tr')]]) + rule +
$q.bW + te(lang, $q.bX, { th: thr }) + $q.aE + nf(lang, g.all.length) + $q.bo + table(cols, rowsOf(g.all), [6]) +
(g.some.length ? $q.bY + te(lang, $q.bZ, { th: thr }) + $q.aE + nf(lang, g.some.length) + $q.bo + table(cols, rowsOf(g.some), [6]) : '') +
dataLine(D, lang, g.lm) + method(lang) + citeBox(lang, title, url, d) + faqHtml(lang, Q) +
linksBlock(lang, t(lang, $q.ap, { p: c }), mks.filter(mk => D.PR.has(slugA(mk))).map(mk => [t(lang, 'l_pr') + ': ' + mkName(mk, lang), $q.ah + slugA(mk) + '/']).concat([...D.OW.values()].filter(o => o.o.co.includes(g.co)).map(o => [t(lang, 'l_ow'), $q.aj + o.s + '/'])).concat([[t(lang, 'gvh_t'), $q.ak]])) + replyBox(lang));
const ld = [webLd(lang, url, title, desc, g.lm), dataLd(url, title, desc, g.lm, g.co), listLd(lang, title, g.all.concat(g.some)), crumbLd(cr), faqLd(Q)];
return { title, desc, body, ld, path, lm: g.lm };
}
function gvHub(D, lang) {
if (!D.GV.size) return null;
const path = $q.ak, url = PUB(lang, path), G = [...D.GV.values()];
const title = fitT(t(lang, 'gvh_t')), desc = fitD(t(lang, $q.ca)), lm = maxS(G.map(g => g.lm)), cr = crumbs(lang, [], [title, pre(lang) + path]), cols = t(lang, $q.bV);
const rows = G.map(g => [$q.y + pre(lang) + path + g.s + '/">' + esc(t(lang, 'gv_p_' + g.s)) + '</a>', money(lang, g.g.cur, g.g.th), nf(lang, g.all.length), nf(lang, g.some.length)]);
const body = wrap(head(lang, cr, te(lang, 'gvh_t'), te(lang, $q.ca), today()) + table(cols, rows, [2, 3]) + dataLine(D, lang, lm) + method(lang) + hubNav(lang, path) + replyBox(lang));
const ld = [webLd(lang, url, title, desc, lm), { '@type': $q.Y, name: title, numberOfItems: G.length, itemListElement: G.map((g, i) => ({ '@type': $q.Z, position: i + 1, name: t('en', 'gv_p_' + g.s), url: PUB(lang, path + g.s + '/') })) }, crumbLd(cr)];
return { title, desc, body, ld, path, lm };
}
const kmT = (lang, v) => nf(lang, v, 1);
function apPage(D, s, lang) {
const g = D.AP.get(s); if (!g) return null;
const path = $q.ai + s + '/', url = PUB(lang, path), d = D.updated, k = g.L.length;
const title = fitT(t(lang, 'ap_t', { a: g.n, i: g.i }), t(lang, 'ap_t2', { i: g.i }), t(lang, 'ap_t3', { i: g.i }));
const desc = fitD(t(lang, 'ap_d', { k: nf(lang, k), r: nf(lang, AP_KM), a: g.n, i: g.i, d: fd(d, lang) }));
const cr = crumbs(lang, [[t(lang, 'aph_t'), pre(lang) + $q.ai]], [title, pre(lang) + path]), cols = t(lang, $q.cb);
const rows = g.L.map(r => [pLink(lang, r.x), dLink(D, lang, r.x), esc(placeName(r.x.ar || r.x.mk, lang)), '<b>' + kmT(lang, r.km) + '</b>', hoCell(D, lang, r.x), scCell(D, lang, r.x)]);
const n = g.L[0];
const Q = [[t(lang, 'ap_q1', { a: g.n }), t(lang, 'ap_a1', { x: n.x.n, km: kmT(lang, n.km), d: fd(d, lang) })], [t(lang, 'ap_q2', { r: nf(lang, AP_KM), a: g.n }), t(lang, 'ap_a2', { k: nf(lang, k), d: fd(d, lang) })]];
const mks = [...new Set(g.L.map(r => r.x.mk))];
const b = (D.AR && D.AR.osm_build) || '';
const body = wrap(head(lang, cr, th(lang, 'ap_t', { a: bdi(g.n), i: $q.c + esc(g.i) + $q.b }), te(lang, $q.cc), today()) +
kv([[nf(lang, k), t(lang, 'kv_tr')], [kmT(lang, n.km), t(lang, $q.cd)[2]], [kmT(lang, median(g.L.map(r => r.km))), t(lang, $q.bq)[2] + ' (km)']]) +
$q.bh + esc(title) + '</h2>' + table(cols, rows, [3, 5]) + $q.B + te(lang, $q.ce, { b }) + $s.k1 +
dataLine(D, lang, g.lm, [$q.D, $q.u]) + method(lang) + citeBox(lang, title, url, d) + faqHtml(lang, Q) +
linksBlock(lang, t(lang, 'aph_t'), mks.filter(mk => D.RP.has(slugA(mk))).map(mk => [t(lang, 'l_rp') + ': ' + mkName(mk, lang), $q.ae + slugA(mk) + '/']).concat([...D.AP.values()].filter(o => o !== g).map(o => [o.n + ' (' + o.i + ')', $q.ai + o.s + '/']))) + replyBox(lang));
const ld = [webLd(lang, url, title, desc, g.lm), dataLd(url, title, desc, g.lm, g.n, [$q.D, $q.u]), listLd(lang, title, g.L.map(r => r.x)), crumbLd(cr), faqLd(Q)];
return { title, desc, body, ld, path, lm: g.lm };
}
function apHub(D, lang) {
if (!D.AP.size) return null;
const path = $q.ai, url = PUB(lang, path), G = [...D.AP.values()].sort((a, b) => b.L.length - a.L.length || a.i.localeCompare(b.i));
const title = fitT(t(lang, 'aph_t')), desc = fitD(t(lang, $q.cf, { r: nf(lang, AP_KM) })), lm = maxS(G.map(g => g.lm)), cr = crumbs(lang, [], [title, pre(lang) + path]), cols = t(lang, $q.cd).map(c => c.replace('{r}', nf(lang, AP_KM)));
const rows = G.map(g => [$q.y + pre(lang) + path + g.s + '/">' + bdi(g.n) + $q.cg + esc(g.i) + $q.ch, nf(lang, g.L.length), kmT(lang, g.L[0].km)]);
const body = wrap(head(lang, cr, te(lang, 'aph_t'), te(lang, $q.cf, { r: nf(lang, AP_KM) }), today()) + table(cols, rows, [1, 2]) + dataLine(D, lang, lm, [$q.D, $q.u]) + method(lang) + hubNav(lang, path) + replyBox(lang));
const ld = [webLd(lang, url, title, desc, lm), { '@type': $q.Y, name: title, numberOfItems: G.length, itemListElement: G.map((g, i) => ({ '@type': $q.Z, position: i + 1, name: g.n, url: PUB(lang, path + g.s + '/') })) }, crumbLd(cr)];
return { title, desc, body, ld, path, lm };
}
function rpPage(D, s, lang) {
const g = D.RP.get(s); if (!g) return null;
const p = mkName(g.mk, lang), mo = fd(D.month, lang), path = $q.ae + s + '/', url = PUB(lang, path), d = D.updated, n = g.L.length, a = g.nw.length, cur = g.cur;
const mp = g.prices.length ? moneyT(lang, cur, Math.round(median(g.prices))) : t(lang, 'np');
const title = fitT(t(lang, 'rp_t', { p, mo }), t(lang, 'rp_t2', { p, mo }), t(lang, 'rp_t3', { p }));
const desc = fitD(t(lang, 'rp_d', { p, mo, n: nf(lang, n), a: nf(lang, a), m: mp, d: fd(d, lang) }));
const cr = crumbs(lang, [[t(lang, 'rph_t', { mo }), pre(lang) + $q.ae]], [title, pre(lang) + path]);
const ncols = t(lang, $q.ci);
const newT = $q.cj + te(lang, $q.ck, { mo }) + $q.aE + nf(lang, a) + $q.bo + (a < MIN ? $q.cl + te(lang, $q.cm, { mo }) + '</p>' : '') +
table(ncols, g.latest.map(x => [pLink(lang, x), dLink(D, lang, x), x.ad ? $q.cn + esc(x.ad) + '">' + esc(fd(x.ad, lang)) + $q.co : '-', pc(lang, x), hoCell(D, lang, x), scCell(D, lang, x)]), [5]);
const ho = g.years.length ? $q.cp + te(lang, $q.cq) + '</h2>' + table(t(lang, $q.cr), g.years.map(r => [String(r.y), '<b>' + nf(lang, r.k) + '</b>', nf(lang, r.mv)]), [1, 2]) + $q.B + te(lang, $q.cs, { k: nf(lang, g.noDate) }) + '</p>' : '';
const pr = g.prices.length >= MIN ? $q.ct + te(lang, $q.cu, { c: cur }) + '</h2>' + table(t(lang, $q.bq), [[Math.min(...g.prices), quant(g.prices, 0.25), median(g.prices), quant(g.prices, 0.75), Math.max(...g.prices)].map(v => money(lang, cur, Math.round(v))).concat([nf(lang, g.prices.length)])], [0, 1, 2, 3, 4, 5]) + (D.PR.has(s) ? $q.cv + pre(lang) + $q.ah + s + '/">' + te(lang, 'l_pr') + $q.I : '') : '';
const UTK = [$q.cw, 'ut_b1', 'ut_b2', 'ut_b3', 'ut_b4', $q.cx, $q.cy, $q.cz, $q.cA].filter(k => g.ut.get(k));
const ut = UTK.length ? $q.cB + te(lang, $q.cC) + '</h2>' + table(t(lang, $q.cD), UTK.map(k => [te(lang, k), nf(lang, g.ut.get(k))]), [1]) : '';
const pay = $q.cE + te(lang, $q.cF) + $q.L + (g.dep.length ? te(lang, $q.cG, { k: nf(lang, g.pay), n: nf(lang, n), q: nf(lang, g.dep.length), m: nf(lang, median(g.dep), 1) }) : te(lang, $q.cH, { k: nf(lang, g.pay), n: nf(lang, n) })) + '</p>';
const dv = $q.cI + te(lang, $q.cJ) + '</h2>' + table(t(lang, $q.cK), g.devs.slice(0, 8).map(v => [dLinkS(D, lang, v.dvs, v.dv), nf(lang, v.k), v.med == null ? '-' : nf(lang, v.med)]), [1, 2]) + (D.DR.has(s) ? $q.cv + pre(lang) + $q.af + s + '/">' + te(lang, 'l_dr') + $q.I : '');
const ty = g.years.slice().sort((q, r) => r.k - q.k || q.y - r.y)[0];
const Q = [[t(lang, 'rp_q1', { p }), t(lang, 'rp_a1', { a: nf(lang, a), mo, d: fd(d, lang) })]];
if (g.prices.length >= MIN) Q.push([t(lang, 'rp_q2', { p }), t(lang, 'rp_a2', { m: mp, k: nf(lang, g.prices.length), c: cur, d: fd(d, lang) })]);
if (ty) Q.push([t(lang, 'rp_q3', { p }), t(lang, 'rp_a3', { y: String(ty.y), k: nf(lang, ty.k), z: nf(lang, g.noDate) })]);
const sc = g.L.map(x => D.sc(x.id)).filter(v => v != null);
const body = wrap(head(lang, cr, th(lang, 'rp_t', { p: bdi(p), mo: esc(mo) }), te(lang, $q.cL, { d: fd(d, lang) }), today()) +
kv([[nf(lang, n), t(lang, 'kv_tr')], [nf(lang, a), t(lang, $q.cM, { mo })], [g.prices.length ? money(lang, cur, Math.round(median(g.prices))) : '-', t(lang, 'kv_mp')], [nf(lang, g.pay), t(lang, 'kv_pp')], [nf(lang, g.pn), t(lang, 'kv_pn')], [sc.length ? nf(lang, Math.round(median(sc))) : '-', t(lang, $q.av)]]) +
newT + ho + pr + ut + pay + dv + dataLine(D, lang, g.lm, [$q.D, $q.aU]) + method(lang) + citeBox(lang, title, url, d) + faqHtml(lang, Q) + moreHtml(D, g.mk, lang, path) + replyBox(lang));
const ld = [webLd(lang, url, title, desc, g.lm, $q.aX), Object.assign(dataLd(url, title, desc, g.lm, g.mk, [$q.D, $q.aU]), { temporalCoverage: D.month }), listLd(lang, title, g.latest), crumbLd(cr), faqLd(Q)];
return { title, desc, body, ld, path, lm: g.lm };
}
function rpHub(D, lang) {
if (!D.RP.size) return null;
const mo = fd(D.month, lang), path = $q.ae, url = PUB(lang, path), G = [...D.RP.values()].sort((a, b) => b.L.length - a.L.length || a.mk.localeCompare(b.mk));
const title = fitT(t(lang, 'rph_t', { mo })), desc = fitD(t(lang, $q.cN)), lm = maxS(G.map(g => g.lm)), cr = crumbs(lang, [], [title, pre(lang) + path]), cols = t(lang, $q.cO).map(c => c.replace('{mo}', mo));
const rows = G.map(g => [$q.y + pre(lang) + path + g.s + '/">' + bdi(mkName(g.mk, lang)) + '</a>', nf(lang, g.L.length), nf(lang, g.nw.length), g.prices.length ? money(lang, g.cur, Math.round(median(g.prices))) : '-']);
const body = wrap(head(lang, cr, te(lang, 'rph_t', { mo }), te(lang, $q.cN), today()) + table(cols, rows, [1, 2, 3]) + dataLine(D, lang, lm) + method(lang) + hubNav(lang, path) + replyBox(lang));
const ld = [webLd(lang, url, title, desc, lm), { '@type': $q.Y, name: title, numberOfItems: G.length, itemListElement: G.map((g, i) => ({ '@type': $q.Z, position: i + 1, name: g.mk, url: PUB(lang, path + g.s + '/') })) }, crumbLd(cr)];
return { title, desc, body, ld, path, lm };
}
const hubNav = (lang, skip) => $q.cP + $t.o_HUBS.filter(([, p]) => p !== skip).map(([k, p]) => $q.an + pre(lang) + p + '">' + esc(t(lang, k, { mo: '' }).replace(/[,，،]\s*$/, '').trim()) + $q.ao).join('') + '</ul>';
export function allPaths(D) {
const out = [], hub = (path, M) => { if (M.size) out.push([path, maxS([...M.values()].map(g => g.lm))]); for (const g of M.values()) out.push([path + g.s + '/', g.lm]); };
hub($q.ae, D.RP); hub($q.af, D.DR); hub($q.ag, D.PM); hub($q.ah, D.PR); hub($q.aj, D.OW); hub($q.ak, D.GV); hub($q.ai, D.AP);
for (const pr of D.VS.values()) out.push([$q.A + pr.k + '/', pr.lm]);
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
  let D; try { D = await h29Data(env); } catch (e) { return new Response($q.cQ, { status: 503, headers: { 'retry-after': '60', 'cache-control': $q.cR, 'content-type': $q.cS } }); }
  const key = lang + '|' + path + '|' + D.v;
  let pg = BODY.get(key);
  if (!pg) { pg = renderPath(D, path, lang); if (!pg) return null; if (BODY.size >= 40) BODY.delete(BODY.keys().next().value); BODY.set(key, pg); }
  if (!m[3]) return new Response(null, { status: 301, headers: { location: pre(lang) + path + u.search, 'cache-control': $q.cT } });
  const sh = await shell(pre(lang) + $q.cU);
  const url = PUB(lang, pg.path), alts = LANGS.map(l => $q.cV + l + $q.cW + PUB(l, pg.path) + '">').join('') + $q.cX + ORIGIN + pg.path + '">';
  const tags = $q.cY + esc(pg.title) + ([...pg.title].length + 11 <= 60 ? $q.cZ : '') + $q.da + esc(pg.desc) + $q.db + url + '">' + alts + $q.dc +
    $q.dd + esc(pg.title) + $q.de + esc(pg.desc) + $q.df + url + $q.dg + ORIGIN + $q.dh +
    $q.di + JSON.stringify({ '@context': $q.dj, '@graph': pg.ld }).replace(/</g, $q.dk) + $q.dl + CSS;
  const res = new HTMLRewriter()
    .on('html', { element(e) { e.setAttribute('lang', lang); if (lang === 'ar') e.setAttribute('dir', 'rtl'); else e.removeAttribute('dir'); } })
    .on('title', { element(e) { e.remove(); } })
    .on($q.dm, { element(e) { e.remove(); } })
    .on($q.dn, { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(pg.body, { html: true }); } })
    .on($q.do, { element(e) { const l = e.getAttribute($q.dp); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + pg.path); } })
    .transform(new Response(sh.body, { headers: { 'content-type': $q.dq } }));
  return new Response(req.method === 'HEAD' ? null : await res.text(), { status: 200, headers: { 'content-type': $q.dq, 'cache-control': $q.dr, 'last-modified': new Date((pg.lm || D.updated) + $q.ds).toUTCString(), 'x-kb-h29': D.v } });
}
async function sitemap(env) {
let D; try { D = await h29Data(env); } catch (e) { return new Response($q.dt, { status: 503 }); }
const xe = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const urls = allPaths(D).flatMap(([p, lm]) => LANGS.map(l => $q.du + xe(PUB(l, p)) + $q.dv + (lm || D.updated) + $q.dw + LANGS.map(a => $t.k3 + a + $q.cW + xe(PUB(a, p)) + '"/>').join('') + $t.k4 + xe(ORIGIN + p) + $q.dx));
return new Response($s.k2 + urls.join('\n') + $q.dy, { headers: { 'content-type': $q.dz, 'cache-control': $q.dA } });
}
const box = (lang, title, L) => L.length ? $t.k5 + esc(title) + $s.k3 + L.map(([l, p]) => $q.an + pre(lang) + p + '">' + esc(l) + $q.ao).join('') + $q.dB : '';
export async function linksFor(env, pathname) {
const m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(.*)$/.exec(pathname); if (!m) return '';
const lang = m[1] || 'en', p = '/' + m[2].replace(/\/?$/, '/');
{ const dm = /^\/developers\/([a-z0-9-]+)\/$/.exec(p); if (dm && !/-vs-/.test(dm[1])) { const sl = await dvSlice(env, dm[1]).catch(() => null);   // n40 k61: links from the slice
if (sl) return box(lang, t(lang, 'l_vs'), sl.d.dr.map(([s, mk]) => [t(lang, 'l_dr') + ': ' + mkName(mk, lang), $q.af + s + '/']).concat(sl.d.vs.map(([k, a, b, mk]) => [t(lang, 'vs_t', { a, b, p: mkName(mk, lang) }), $q.A + k + '/']))); } }
let D; try { D = await h29Data(env); } catch (e) { return ''; }
const hubs = () => $t.o_HUBS.map(([k, q]) => [t(lang, k, { mo: fd(D.month, lang) }), q]);
let x;
if ((x = /^\/m\/([^/]+)\/$/.exec(p))) { const mk = [...D.byMk.keys()].find(k => slugM(k) === x[1] || slugA(k) === slugA(decodeURIComponent(x[1]))); return mk ? box(lang, t(lang, $q.ap, { p: mkName(mk, lang) }), placeLinks(D, mk, lang)) : ''; }
if ((x = /^\/handover\/20\d\d\/([a-z0-9-]+)\/$/.exec(p))) { const mk = D.mkOfSlug.get(x[1]); return mk ? box(lang, t(lang, $q.ap, { p: mkName(mk, lang) }), placeLinks(D, mk, lang)) : ''; }
if (p === $q.dC || p === $q.dD || p === '/new/' || p === $q.dE || p === $q.dF) return box(lang, t(lang, $q.dG), hubs());
if ((x = /^\/rankings\/transparency\/([a-z0-9-]+)\/$/.exec(p))) { const P = TR_PLACES.find(q => q.s === x[1]); const mk = P && !P.a && P.m.find(k => D.byMk.has(k)); return mk ? box(lang, t(lang, $q.ap, { p: mkName(mk, lang) }), placeLinks(D, mk, lang)) : ''; }
if ((x = /^\/guides\/buying-off-plan\/([a-z-]+)\/$/.exec(p))) { const mk = ($t.o_GUIDE[x[1]] || []).find(k => D.byMk.has(k)); return mk ? box(lang, t(lang, $q.ap, { p: mkName(mk, lang) }), placeLinks(D, mk, lang)) : ''; }
if ((x = /^\/developers\/([a-z0-9-]+)\/$/.exec(p)) && !/-vs-/.test(x[1])) {
const L = (D.drOfDev.get(x[1]) || []).map(s => [t(lang, 'l_dr') + ': ' + mkName(D.DR.get(s).mk, lang), $q.af + s + '/']).concat((D.vsOfDev.get(x[1]) || []).map(pr => [t(lang, 'vs_t', { a: pr.a.dv, b: pr.b.dv, p: mkName(pr.mk, lang) }), $q.A + pr.k + '/']));
return box(lang, t(lang, 'l_vs'), L);
}
return '';
}
