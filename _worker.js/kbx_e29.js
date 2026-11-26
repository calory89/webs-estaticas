// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_e29__q, $s = TB.kbx_e29__s, $t = TB.kbx_e29__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { e29t } from './kbx_e29_i18n.js';
import { trustRender, head, crumbLd } from './kbx_trust.js';
import { coName } from './kbx_hdate.js';
import { REVIEWED, NEXT, METHOD, ACC, FOUNDERS, dots, reviewLine, accLine, errLine } from './kbx_e29_lines.js';
import { TB } from './kbx_strings.js';
export { methodLine, guideNext, aboutBox, ABOUT_CSS } from './kbx_e29_lines.js';
const IF = (globalThis.__kbIF = globalThis.__kbIF || {}); function sf(k, f) { if (IF[k]) return IF[k]; const p = f(); IF[k] = p; const d = () => { if (IF[k] === p) delete IF[k]; }; p.then(d, d); return p; }   // n40 d12
const ORIGIN = 'https://kolaboro.com';
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const PAGE_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(editorial-policy|how-we-work|sources|buyer-protection-law|countries\/foreign-buyers)(\/?)$/;
export const PAGES = ['/editorial-policy/', '/how-we-work/', '/sources/', '/buyer-protection-law/', '/countries/foreign-buyers/'];
const SUMBA = 'Sumba', COI_RX = /eco\s*beach\s*city|\bequinox\b/i;
const MIN_C = 5;
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a, "'": '&#39;' }[c]));
const bdi = s => '<bdi>' + esc(s) + $q.b;
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, a) => v && v[a] != null ? v[a] : m);
const t = (lang, k) => e29t(lang, k);
const tx = (lang, k, v) => fill(t(lang, k), v);
const nf = (lang, n) => Number(n).toLocaleString(LOC[lang] || 'en-GB');
const fdt = (iso, lang) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); if (!m) return String(iso || ''); try { return new Intl.DateTimeFormat(LOC[lang] || 'en-GB', { day: $q.c, month: 'long', year: $q.c, timeZone: 'UTC' }).format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))); } catch (e) { return iso.slice(0, 10); } };
const tm = (iso, lang) => $q.d + esc(String(iso).slice(0, 10)) + '">' + esc(fdt(iso, lang)) + $q.e;
const ul = L => '<ul>' + L.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
const ol = L => '<ol>' + L.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>';
const host = u => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { return ''; } };
const slugC = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const EN_ONLY = /^\/(independence|registers|changelog|shipping|status|tools|countries\/?$|countries\/[a-z0-9-]+\/$|data-policy)/;
const lk = (lang, h) => EN_ONLY.test(h) && !/^\/countries\/foreign-buyers\//.test(h) ? h : pre(lang) + h;
const rel = (lang, L) => $q.f + esc(t(lang, 'rel')) + $q.g + L.map(([h, k]) => $q.h + lk(lang, h) + '">' + esc(t(lang, k)) + $q.i).join('') + '</ul>';
const ldPage = (lang, path, title, desc, mod, extra) => Object.assign({ '@type': $q.j, '@id': ORIGIN + pre(lang) + path + '#page', url: ORIGIN + pre(lang) + path, name: title, description: desc, inLanguage: lang, dateModified: mod || REVIEWED, lastReviewed: REVIEWED, publisher: { '@type': $q.k, name: $q.l, url: ORIGIN + '/' } }, extra || {});
const SHARED = (globalThis.__kbJson = globalThis.__kbJson || {});
const load = (env, name, base) => sf('e29:' + (base || '') + name, () => load0(env, name, base));
async function load0(env, name, base) {
const key = (base || 'data/') + name, m = SHARED[base ? key : name]; if (m && (m.a || Date.now() - m.t < 600000)) return m.v;
let r = null, a = false;
try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + $q.m + key)); a = !!(r && r.ok); } catch (e) { r = null; }
if (!r || !r.ok) r = await fetch(ORIGIN + '/' + key, { cf: { cacheTtl: 300, cacheEverything: true } });
if (!r.ok) throw new Error(name + ' ' + r.status);
const v = await r.json(); SHARED[base ? key : name] = { t: Date.now(), v, a }; return v;
}
const HEADS = new Map();
async function fileDate(env, name) {
const c = HEADS.get(name); if (c && Date.now() - c.t < 600000) return c.d;
let d = null;
try {
let r = null;
try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + $q.n + name)); } catch (e) { r = null; }
if (!r || !r.ok) r = await fetch(ORIGIN + $q.o + name, { cf: { cacheTtl: 300, cacheEverything: true } });
if (r.ok && r.body) {
const rd = r.body.getReader(), dec = new TextDecoder(); let s = '';
while (s.length < 4096) { const { value, done } = await rd.read(); if (done) break; s += dec.decode(value, { stream: true }); }
try { await rd.cancel(); } catch (e) {}
const m = /"(?:updated|generated|generated_at|date|at)"\s*:\s*"(\d{4}-\d{2}-\d{2})/.exec(s); d = m ? m[1] : null;
}
} catch (e) { d = null; }
HEADS.set(name, { t: Date.now(), d }); return d;
}
function editorialPage(lang) {
const P = $q.p;
const who = '<p>' + esc(t(lang, $q.q)) + $q.r + FOUNDERS.map(([n, r]) => $q.s + bdi(n) + $q.t + esc(t(lang, r)) + '</li>').join('') + '</ul>' + accLine(lang) +
$q.u + pre(lang) + $q.v + esc(t(lang, $q.w)) + $q.x + pre(lang) + $q.y + esc(t(lang, $q.z)) + $q.A;
const body = $q.B + head(lang, [[t(lang, 'ep_h1'), pre(lang) + P]], esc(t(lang, 'ep_h1')), esc(t(lang, $q.C)), reviewLine(lang)) +
$t.k0 + esc(t(lang, $q.D)) + '</h2>' + ul(t(lang, $q.E)) +
$q.F + esc(t(lang, $q.G)) + '</h2>' + ul(t(lang, 'ep_ch')) + $q.H + esc(t(lang, 'l_ind')) + $q.A +
$q.I + esc(t(lang, $q.J)) + '</h2>' + ol(t(lang, 'ep_fa')) + $q.u + pre(lang) + $q.K + esc(t(lang, 'l_mod')) + $q.x + pre(lang) + $q.L + esc(t(lang, 'l_src')) + $q.A +
$q.M + esc(t(lang, $q.N)) + '</h2>' + who +
$q.O + esc(t(lang, $q.P)) + '</h2>' + ul(t(lang, 'ep_rv')) + $q.Q + fill(esc(t(lang, 'mv')), { v: METHOD.v, d: tm(METHOD.d, lang), n: tm(METHOD.next, lang) }) + $q.R + pre(lang) + $q.S + esc(t(lang, $q.T)) + $q.x + pre(lang) + $q.U + esc(t(lang, 'l_hw')) + $q.A +
$q.V + esc(t(lang, $q.W)) + '</h2>' + ul(t(lang, 'ep_co')) + $q.u + pre(lang) + $q.X + esc(t(lang, $q.Y)) + $q.A +
$q.Z + esc(t(lang, $q.aa)) + '</h2>' + ul(t(lang, 'ep_li')) + $q.u + pre(lang) + $q.ab + esc(t(lang, $q.ac)) + $q.ad + esc(t(lang, 'l_dp')) + $s.k0 +
$q.ae + esc(t(lang, $q.af)) + '</h2>' + ul(t(lang, 'ep_no')) +
rel(lang, [[$q.ag, 'l_hw'], [$q.ah, 'l_src'], [$q.ai, $q.w], [$q.aj, 'l_mod'], [$q.ak, $q.Y], [$q.al, $q.ac], [$q.am, 'l_chg']]) + $q.an;
const title = t(lang, $q.ao), desc = t(lang, $q.ap);
return { path: P, title, desc, body, ld: [ldPage(lang, P, title, desc, REVIEWED, { accountablePerson: { '@type': $q.aq, name: ACC, url: ORIGIN + pre(lang) + $q.ai }, license: $t.k1 }), crumbLd(lang, [[t(lang, 'ep_h1'), pre(lang) + P]])] };
}
const READ_JOBS = '2026-11-14';
const JOBS = [
['j_shipping', '37 0 * * *', 'shipping.json', '/shipping/'], ['j_open', '41 0 * * *', 'traction.json', '/progress/'], ['j_devweb', '23 4 * * *', 'web-health.json'],
['j_pagehist', '52 5 * * *', 'page-history-0.json'], ['j_sanctions', '17 6 * * *', 'sanctions.json'], ['j_guard', '37 6 * * *', 'deploys.json', '/status/'],
['j_findings', '34 7 * * *', 'live-findings.json'], ['j_seo', '41 9 * * *', 'seo-daily.json', '/engineering/seo/'],
['j_look', '41 3 */2 * *', 'lookalikes.json'], ['j_gleif', '41 3 * * 2', 'gleif-family.json'], ['j_sec', '29 4 * * 2', 'security-scan.json', '/security/'],
['j_land', '41 4 * * 3', 'land-rules.json'], ['j_follow', '23 11 * * 3', 'promises.json', '/promises/'], ['j_price', '41 14 * * 3', 'price-index.json', '/index/prices/'],
['j_delay', '37 16 * * 4', 'delay-index.json', '/index/delays/'], ['j_quality', '41 6 * * 5', 'quality.json', '/metrics/'], ['j_paper', '17 4 * * 0', 'price-history.json'],
['j_agent', '17 6 1,15 * *', 'named.json', '/projects/'], ['j_sat', '41 7 3 * *', 'satellite.json', '/satellite/'], ['j_insolv', '23 7 5 * *', 'insolvency-watch.json', '/tools/insolvency-check/'],
['j_gazette', '41 4 6 * *', 'gazette.json'], ['j_haz', '17 3 9 * *', 'hazards.json', '/hazards/'], ['j_domain', '43 9 16 * *', 'domain-age.json'],
['j_lh', '23 4 17 * *', 'lighthouse.json', '/engineering/speed/'], ['j_a11y', '47 2 19 * *', 'a11y.json', '/accessibility/']
];
function cronKind(c) { const [, , dom, , dow] = c.split(' '); if (dom === '*' && dow === '*') return 'd'; if (dom === '*/2' || dow !== '*') return 'w'; return 'm'; }
function cronText(c, lang) {
const [mi, hr, dom, , dow] = c.split(' '), hm = String(hr).padStart(2, '0') + ':' + String(mi).padStart(2, '0');
if (dom === '*' && dow === '*') return tx(lang, $q.ar, { t: hm });
if (dom === '*/2') return tx(lang, 's_2d', { t: hm });
if (dow !== '*') return tx(lang, 's_wk', { w: t(lang, 'wd')[+dow % 7], t: hm });
const L = dom.split(',');
return L.length > 1 ? tx(lang, 's_mo2', { m: L.join(t(lang, 's_and')), t: hm }) : tx(lang, 's_mo', { m: dom, t: hm });
}
function workPage(lang, D) {
const P = $q.ag, cols = t(lang, $q.as);
const sortKey = j => { const [mi, hr, dom, , dow] = j[1].split(' '); return (cronKind(j[1]) === 'm' ? +dom.split(',')[0] * 1440 : dow !== '*' ? ((+dow + 6) % 7) * 1440 : 0) + (+hr) * 60 + (+mi); };
const tbl = kind => { const L = JOBS.filter(j => cronKind(j[1]) === kind).sort((a, b) => sortKey(a) - sortKey(b));
    return $q.at + esc(t(lang, 'hw_' + kind + '_h')) + $q.au + cols.map(c => $q.av + esc(c) + '</th>').join('') + $q.aw +
      L.map(([k, c, f, pg]) => $q.ax + esc(cols[0]) + '">' + esc(cronText(c, lang)) + $q.ay + esc(cols[1]) + '">' + (pg ? $q.az + esc(pg) + '">' + esc(t(lang, k)) + '</a>' : esc(t(lang, k))) + $q.ay + esc(cols[2]) + $q.aA + f + $q.aB + esc(f) + $q.aC + esc(cols[3]) + '">' + (D[f] ? tm(D[f], lang) : esc(t(lang, $q.aD))) + $q.aE).join('') + $q.aF; };
const n = k => JOBS.filter(j => cronKind(j[1]) === k).length, last = Object.values(D).filter(Boolean).sort().pop();
const body = $q.B + head(lang, [[t(lang, 'hw_h1'), pre(lang) + P]], esc(t(lang, 'hw_h1')), esc(t(lang, $q.aG)), reviewLine(lang)) +
$q.aH + esc(tx(lang, $q.aI, { a: nf(lang, JOBS.length), d: nf(lang, n('d')), w: nf(lang, n('w')), m: nf(lang, n('m')), last: last ? fdt(last, lang) : '-' })) + $q.aJ +
$q.aK + esc(t(lang, $q.aL)) + '</h2>' + tbl('d') + $q.aM + esc(t(lang, $q.aN)) + '</h2>' + tbl('w') + $q.aO + esc(t(lang, $q.aP)) + '</h2>' + tbl('m') +
$q.Q + esc(tx(lang, $q.aQ, { d: fdt(READ_JOBS, lang) })) + '</p>' +
$q.aR + esc(t(lang, $q.aS)) + '</h2>' + ul(t(lang, $q.aT)) + $q.u + pre(lang) + $q.K + esc(t(lang, 'l_mod')) + $q.x + pre(lang) + $q.X + esc(t(lang, $q.Y)) + $q.A +
$q.aU + esc(t(lang, $q.aV)) + '</h2>' + ol(t(lang, $q.aW)) + $q.aX + esc(t(lang, $q.aY)) + $q.aZ + esc(t(lang, $q.ba)) + $q.bb + esc(t(lang, 'l_chg')) + $q.A +
accLine(lang) + errLine(lang) + rel(lang, [[$q.p, 'l_ep'], [$q.ah, 'l_src'], [$q.ai, $q.w], [$q.bc, $q.bd], [$q.be, 'l_dp']]) + $q.an;
const title = t(lang, $q.bf), desc = t(lang, $q.bg);
return { path: P, title, desc, body, ttl: 900, ld: [ldPage(lang, P, title, desc, last || REVIEWED), crumbLd(lang, [[t(lang, 'hw_h1'), pre(lang) + P]])] };
}
const GOV_RX = /(^|\.)(gov|govt|gob|gouv|go|gv|gub|mil)\.[a-z]{2,3}$|(^|\.)gov$|(^|\.)gov\.[a-z.]+$|(^|\.)(europa\.eu|admin\.ch|gleif\.org|boe\.es|registradores\.org|myfloridalicense\.com|sunbiz\.org|kap\.org\.tr|dubailand\.gov\.ae)$/;
const official = h => GOV_RX.test(h);
let SRCX = null;
function sourcesData(N) {
if (SRCX && SRCX.k === N) return SRCX;
const C = new Map();
for (const x of N.projects || []) {
if (x.mk === SUMBA || COI_RX.test(String(x.dv || '') + ' ' + String(x.n || ''))) continue;
const co = x.co || ''; if (!co) continue;
const c = C.get(co) || { co, p: 0, u: 0, dv: 0, of: 0, ot: 0, doms: new Set(), offD: new Map() }; c.p++;
const dh = host(x.url), seen = new Set();
for (const s of (x.src || [])) {
const h = host(s); if (!h || seen.has(s)) continue; seen.add(s); c.u++; c.doms.add(h);
if (dh && (h === dh || h.endsWith('.' + dh) || dh.endsWith('.' + h))) c.dv++;
else if (official(h)) { c.of++; c.offD.set(h, (c.offD.get(h) || 0) + 1); }
else c.ot++;
}
C.set(co, c);
}
const L = [...C.values()].filter(c => c.p >= MIN_C).sort((a, b) => b.p - a.p || a.co.localeCompare(b.co));
const all = L.reduce((a, c) => { a.p += c.p; a.u += c.u; a.dv += c.dv; a.of += c.of; a.ot += c.ot; for (const d of c.doms) a.doms.add(d); return a; }, { p: 0, u: 0, dv: 0, of: 0, ot: 0, doms: new Set() });
SRCX = { k: N, L, all, updated: N.updated }; return SRCX;
}
function sourcesPage(lang, S) {
const P = $q.ah, cols = t(lang, $q.bh), pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const cell = (a, b) => nf(lang, a) + $q.bi + nf(lang, pct(a, b)) + $q.bj;
const rows = S.L.map(c => { const top = [...c.offD.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3);
return $q.bk + esc(cols[0]) + $q.bl + slugC(c.co) + '/">' + bdi(coName(c.co, lang) || c.co) + $q.aC + esc(cols[1]) + '">' + nf(lang, c.p) + $q.bm + esc(cols[2]) + '">' + nf(lang, c.u) + $q.bm + esc(cols[3]) + '">' + cell(c.dv, c.u) + $q.bm + esc(cols[4]) + '">' + cell(c.of, c.u) + $q.bm + esc(cols[5]) + '">' + cell(c.ot, c.u) + $q.ay + esc(cols[6]) + '">' +
(top.length ? top.map(([h, k]) => $q.bn + esc(h) + $q.bo + nf(lang, k) + $q.bp).join(', ') : $q.bq + esc(t(lang, $q.br)) + $q.bs) + $q.aE; }).join('');
const A = S.all;
const body = $q.B + head(lang, [[t(lang, 'so_h1'), pre(lang) + P]], esc(t(lang, 'so_h1')), esc(t(lang, $q.bt)), $q.Q + esc(tx(lang, 'read', { d: fdt(S.updated, lang) })) + $t.k2 + esc(t(lang, 'lic')) + '</p>') +
$q.aH + esc(tx(lang, $q.bu, { u: nf(lang, A.u), d: nf(lang, A.doms.size), p: nf(lang, A.p), c: nf(lang, S.L.length), dv: nf(lang, A.dv), of: nf(lang, A.of), ot: nf(lang, A.ot) })) + $q.aJ +
$t.k3 + esc(t(lang, 'so_h1')) + $q.au + cols.map(c => $q.av + esc(c) + '</th>').join('') + $q.aw + rows + $q.aF +
'<p>' + esc(t(lang, $q.bv)) + $t.k4 +
$q.bw + esc(t(lang, $q.bx)) + '</h2>' + ul(t(lang, $q.by)) +
'<p>' + esc(t(lang, $q.bz)) + $q.bA + esc(t(lang, 'l_reg')) + $q.A + reviewLine(lang) + accLine(lang) + errLine(lang) +
rel(lang, [[$q.p, 'l_ep'], [$q.ag, 'l_hw'], [$q.bB, 'l_reg'], [$q.bC, $q.bD], [$q.be, 'l_dp']]) + $q.an;
const title = t(lang, $q.bE), desc = t(lang, $q.bF);
return { path: P, title, desc, body, ld: [ldPage(lang, P, title, desc, S.updated, { license: $t.k5 }), crumbLd(lang, [[t(lang, 'so_h1'), pre(lang) + P]])] };
}
let BUY = null;
async function buyMods() { if (!BUY) { const [b, n, i] = await Promise.all([import('./kbx_buy.js'), import('./kbx_buy_notes.js'), import('./kbx_buy_i18n.js')]); BUY = { PLAN: b.PLAN, SRC: b.SRC, guideData: b.guideData, NT: n.NT, PL: i.PL, BS: i.BS, PLACES: i.BUY_PLACES }; } return BUY; }
const note = (B, k, lang) => (B.NT[k] && (B.NT[k][lang] || B.NT[k].en)) || '';
const srcHtml = (B, lang, ids) => $q.bG + ids.map(i => B.SRC[i]).filter(Boolean).map(s => $q.az + esc(s.u) + '"' + (s.own ? '' : $q.bH) + $q.bI + esc(s.n) + $q.bJ + (s.d ? ' (' + esc(tx(lang, s.own ? $q.bK : 'read', { d: fdt(s.d, lang) })) + ')' : '')).join(' · ') + $q.bL;
const placeN = (B, P, lang) => (B.PL[P.s] && (B.PL[P.s].n[lang] || B.PL[P.s].n.en)) || P.s;
const stepN = (B, k, lang) => (B.BS[lang] && B.BS[lang]['st_' + k]) || B.BS.en['st_' + k];
const guideU = (lang, P) => pre(lang) + $q.bM + P.s + '/';
const BP_STEPS = ['company', 'permit', 'money', 'sale', 'date'];
function protectPage(lang, B, G, LAW) {
const P = $q.bN, places = B.PLACES.filter(p => B.PLAN[p.s]);
let k = 0; const srcs = new Set();
const cards = places.map(p => { const pl = B.PLAN[p.s], g = G && G.places.get(p.s);
const dl = BP_STEPS.map(s => { const L = pl[s] || []; L.forEach(([, ids]) => { k++; ids.forEach(i => { if (B.SRC[i] && !B.SRC[i].own) srcs.add(B.SRC[i].u); }); });
return '<dt>' + esc(stepN(B, s, lang)) + $q.bO + (L.length ? L.map(([nk, ids]) => '<p>' + esc(note(B, nk, lang)) + '<br>' + srcHtml(B, lang, ids) + '</p>').join('') : $q.bP + esc(t(lang, $q.bQ)) + '</p>') + '</dd>'; }).join('');
return $q.bR + p.s + $q.bS + bdi(placeN(B, p, lang)) + (placeN(B, p, lang) !== (coName(p.c, lang) || p.c) ? $q.bT + bdi(coName(p.c, lang) || p.c) + $q.bp : '') + '</h3>' + (g && g.n ? $q.Q + esc(tx(lang, $q.bU, { n: nf(lang, g.n) })) + '</p>' : '') + '<dl>' + dl + $q.bV + guideU(lang, p) + '">' + esc(t(lang, $q.bW)) + ': ' + bdi(placeN(B, p, lang)) + $q.bX; }).join('');
const n = places.length;
const body = $q.B + head(lang, [[t(lang, $q.bY), pre(lang) + $q.bM], [t(lang, 'bp_h1'), pre(lang) + P]], esc(t(lang, 'bp_h1')), esc(t(lang, $q.bZ)), reviewLine(lang)) +
$q.aH + esc(tx(lang, $q.ca, { n: nf(lang, n), k: nf(lang, k), s: nf(lang, srcs.size) })) + $q.cb + places.map(p => $q.cc + p.s + '">' + bdi(placeN(B, p, lang)) + '</a>').join(' · ') + '</p>' + cards +
(LAW && LAW.rules ? $q.cd + esc(tx(lang, $q.ce, { k: nf(lang, LAW.rules.length), m: nf(lang, Object.keys(LAW.markets || {}).length) })) + $q.A : '') + accLine(lang) + errLine(lang) +
rel(lang, [[$q.cf, 'l_fb'], [$q.bM, $q.bY], [$q.cg, 'l_law'], [$q.bB, 'l_reg'], [$q.p, 'l_ep']]) + $q.an;
const title = tx(lang, $q.ch, { n }), desc = tx(lang, $q.ci, { n });
return { path: P, title, desc, body, ld: [ldPage(lang, P, title, desc, REVIEWED, { about: places.map(p => ({ '@type': 'Place', name: placeN(B, p, 'en') })) }), crumbLd(lang, [[t(lang, $q.bY), pre(lang) + $q.bM], [t(lang, 'bp_h1'), pre(lang) + P]])] };
}
function letRule(SL, p) {
if (!SL || !SL.rules) return null;
const ids = (SL.by_market && (p.m || []).map(m => SL.by_market[m]).find(Boolean)) || (SL.by_country && SL.by_country[p.c]) || (SL.rules[String(p.cc || '').toLowerCase()] ? [String(p.cc).toLowerCase()] : null);
if (!ids) return null;
for (const id of ids) { const r = SL.rules[id]; if (r && r.reg && r.reg.s === 'rule') return { id, r, f: r.reg }; }
for (const id of ids) { const r = SL.rules[id]; if (r) return { id, r, f: r.reg || {} }; }
return null;
}
function foreignPage(lang, B, G, SL, costCalc) {
const P = $q.cf, places = B.PLACES.filter(p => B.PLAN[p.s]), n = places.length;
const cards = places.map(p => { const pl = B.PLAN[p.s], g = G && G.places.get(p.s), land = pl.land || [];
const own = land.length ? land.map(([nk, ids]) => '<p>' + esc(note(B, nk, lang)) + '<br>' + srcHtml(B, lang, ids) + '</p>').join('') : $q.bP + esc(t(lang, 'np')) + $q.R + guideU(lang, p) + '">' + esc(t(lang, $q.bW)) + $q.A;
let tax = $q.bP + esc(t(lang, $q.cj)) + '</p>';
try { const c = costCalc && costCalc({ co: p.c, mk: (p.m || [])[0] || '', ar: '' }, 0, lang);
if (c && (c.rows.length || c.part || c.note)) tax = (c.rows.length ? '<ul>' + c.rows.map(r => $q.s + esc(r.label) + $q.ck + esc(r.rate) + $q.b + (r.src ? $q.cl + esc(r.src) + $q.cm + esc(host(r.src)) + $q.cn : '') + '</li>').join('') + '</ul>' : '') + (c.part ? '<p>' + esc(c.part) + '</p>' : '') + (c.note ? $q.co + esc(c.note) + '</p>' : '') + $q.cp + esc(c.tool) + '">' + esc(t(lang, 'fb_tc')) + $q.A;
} catch (e) {}
const lr = letRule(SL, p); let let_ = $q.bP + esc(t(lang, $q.cq)) + '</p>';
if (lr && lr.f && lr.f.s === 'rule' && lr.f.t) { const S = (lr.f.src || []).map(i => SL.sources && SL.sources[i]).filter(Boolean);
let_ = '<p>' + bdi(lr.r.name) + ': ' + esc(lr.f.t[lang] || lr.f.t.en) + $q.cr + S.map(s => $q.az + esc(s.u) + $q.cs + esc(s.n) + $q.bJ + (s.read ? ' (' + esc(tx(lang, 'read', { d: fdt(s.read, lang) })) + ')' : '')).join(' · ') + $t.k6 + esc(lr.id) + '">' + esc(t(lang, 'l_slr')) + $q.A; }
else if (lr && lr.f && lr.f.s === 'nf') let_ = $q.bP + esc(t(lang, $q.ct)) + '</p>';
return $q.bR + p.s + $q.bS + bdi(placeN(B, p, lang)) + (placeN(B, p, lang) !== (coName(p.c, lang) || p.c) ? $q.bT + bdi(coName(p.c, lang) || p.c) + $q.bp : '') + '</h3>' + (g && g.n ? $q.Q + esc(tx(lang, $q.bU, { n: nf(lang, g.n) })) + '</p>' : '') +
$q.cu + esc(stepN(B, 'land', lang)) + $q.bO + own + $q.cv + esc(t(lang, $q.cw)) + $q.bO + tax + $q.cv + esc(t(lang, $q.cx)) + $q.bO + let_ + $q.cy + guideU(lang, p) + '">' + esc(t(lang, $q.bW)) + ': ' + bdi(placeN(B, p, lang)) + $q.bX; }).join('');
const body = $q.B + head(lang, [[t(lang, $q.bD), $q.bC], [tx(lang, 'fb_h1', { n }), pre(lang) + P]], esc(tx(lang, 'fb_h1', { n })), esc(t(lang, $q.cz)), reviewLine(lang)) +
$q.cA + places.map(p => $q.cc + p.s + '">' + bdi(placeN(B, p, lang)) + '</a>').join(' · ') + '</p>' + cards + $q.co + esc(t(lang, $q.cB)) + '</p>' + accLine(lang) + errLine(lang) +
rel(lang, [[$q.bN, 'l_bp'], [$q.bM, $q.bY], [$q.cC, 'l_tc'], [$q.cD, 'l_slr'], [$q.bC, $q.bD]]) + $q.an;
const title = tx(lang, $q.cE, { n }), desc = tx(lang, $q.cF, { n });
return { path: P, title, desc, body, ld: [ldPage(lang, P, title, desc, (SL && SL.updated) > REVIEWED ? SL.updated : REVIEWED), crumbLd(lang, [[t(lang, $q.bD), $q.bC], [tx(lang, 'fb_h1', { n }), pre(lang) + P]])] };
}
const BODY = new Map();
export async function handle(req, u, env, ctx, shell) {
const m = PAGE_RX.exec(u.pathname); if (!m || !shell) return null;
if (!m[3]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': $q.cG } });
const lang = m[1] || 'en', kind = m[2];
let pg;
try {
if (kind === $q.cH) { const k = lang + '|ep'; pg = BODY.get(k); if (!pg) { pg = editorialPage(lang); BODY.set(k, pg); } }
else if (kind === $q.cI) { const D = {}; await Promise.all([...new Set(JOBS.map(j => j[2]))].map(async f => { D[f] = await fileDate(env, f); })); pg = workPage(lang, D); }
else if (kind === $q.cJ) { const N = await load(env, $q.cK), S = sourcesData(N), k = lang + '|so|' + S.updated + '|' + (N.projects || []).length; pg = BODY.get(k); if (!pg) { pg = sourcesPage(lang, S); if (BODY.size > 300) BODY.clear(); BODY.set(k, pg); } }
else {
const B = await buyMods(); let G = null; try { G = await B.guideData(env); } catch (e) {}
if (kind === $q.cL) { let LAW = null; try { LAW = await load(env, $q.cM, $q.cN); } catch (e) {} const k = lang + '|bp|' + (G ? G.v : '') + '|' + (LAW ? LAW.version : ''); pg = BODY.get(k); if (!pg) { pg = protectPage(lang, B, G, LAW); if (BODY.size > 300) BODY.clear(); BODY.set(k, pg); } }
else { let SL = null; try { SL = await load(env, $q.cO); } catch (e) {} let cc = null; try { cc = (await import('./kbx_facets.js')).costCalc; } catch (e) {}
const k = lang + '|fb|' + (G ? G.v : '') + '|' + (SL ? SL.updated : ''); pg = BODY.get(k); if (!pg) { pg = foreignPage(lang, B, G, SL, cc); if (BODY.size > 300) BODY.clear(); BODY.set(k, pg); } }
}
} catch (e) { return null; }
return trustRender(lang, Object.assign({}, pg, { body: dots(pg.body).replace($q.B, $s.CSS29 + $q.B) }), shell);
}
export { editorialPage, workPage, sourcesPage, protectPage, foreignPage, sourcesData, cronText, JOBS, buyMods };
