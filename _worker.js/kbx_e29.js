// comments: _notes/kolaboro-worker-comments.txt
import { e29t } from './kbx_e29_i18n.js';
import { trustRender, head, crumbLd } from './kbx_trust.js';
import { coName } from './kbx_hdate.js';
import { REVIEWED, NEXT, METHOD, ACC, FOUNDERS, dots, reviewLine, accLine, errLine } from './kbx_e29_lines.js';
import { TB } from './kbx_strings.js';
export { methodLine, guideNext, aboutBox, ABOUT_CSS } from './kbx_e29_lines.js';
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const PAGE_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(editorial-policy|how-we-work|sources|buyer-protection-law|countries\/foreign-buyers)(\/?)$/;
export const PAGES = ['/editorial-policy/', '/how-we-work/', '/sources/', '/buyer-protection-law/', '/countries/foreign-buyers/'];
const SUMBA = 'Sumba', COI_RX = /eco\s*beach\s*city|\bequinox\b/i;
const MIN_C = 5;
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bdi = s => '<bdi>' + esc(s) + '</bdi>';
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, a) => v && v[a] != null ? v[a] : m);
const t = (lang, k) => e29t(lang, k);
const te = (lang, k, v) => fill(esc(t(lang, k)), v);
const tx = (lang, k, v) => fill(t(lang, k), v);
const nf = (lang, n) => Number(n).toLocaleString(LOC[lang] || 'en-GB');
const fdt = (iso, lang) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); if (!m) return String(iso || ''); try { return new Intl.DateTimeFormat(LOC[lang] || 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))); } catch (e) { return iso.slice(0, 10); } };
const tm = (iso, lang) => '<time datetime="' + esc(String(iso).slice(0, 10)) + '">' + esc(fdt(iso, lang)) + '</time>';
const ul = L => '<ul>' + L.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
const ol = L => '<ol>' + L.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>';
const host = u => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { return ''; } };
const slugC = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const EN_ONLY = /^\/(independence|registers|changelog|shipping|status|tools|countries\/?$|countries\/[a-z0-9-]+\/$|data-policy)/;
const lk = (lang, h) => EN_ONLY.test(h) && !/^\/countries\/foreign-buyers\//.test(h) ? h : pre(lang) + h;
const rel = (lang, L) => '<h2 id="related">' + esc(t(lang, 'rel')) + '</h2><ul class="k29-rel">' + L.map(([h, k]) => '<li><a href="' + lk(lang, h) + '">' + esc(t(lang, k)) + '</a></li>').join('') + '</ul>';
const ldPage = (lang, path, title, desc, mod, extra) => Object.assign({ '@type': 'WebPage', '@id': ORIGIN + pre(lang) + path + '#page', url: ORIGIN + pre(lang) + path, name: title, description: desc, inLanguage: lang, dateModified: mod || REVIEWED, lastReviewed: REVIEWED, publisher: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' } }, extra || {});
const SHARED = (globalThis.__kbJson = globalThis.__kbJson || {});
async function load(env, name, base) {
const key = (base || 'data/') + name, m = SHARED[base ? key : name]; if (m && (m.a || Date.now() - m.t < 600000)) return m.v;
let r = null, a = false;
try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/' + key)); a = !!(r && r.ok); } catch (e) { r = null; }
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
try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); } catch (e) { r = null; }
if (!r || !r.ok) r = await fetch(ORIGIN + '/data/' + name, { cf: { cacheTtl: 300, cacheEverything: true } });
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
const P = '/editorial-policy/';
const who = '<p>' + esc(t(lang, 'ep_who_p')) + '</p><ul>' + FOUNDERS.map(([n, r]) => '<li><b>' + bdi(n) + '</b>: ' + esc(t(lang, r)) + '</li>').join('') + '</ul>' + accLine(lang) +
'<p><a href="' + pre(lang) + '/team/">' + esc(t(lang, 'l_team')) + '</a> · <a href="' + pre(lang) + '/about/">' + esc(t(lang, 'l_about')) + '</a></p>';
const body = '<div class="kpg">' + head(lang, [[t(lang, 'ep_h1'), pre(lang) + P]], esc(t(lang, 'ep_h1')), esc(t(lang, 'ep_lead')), reviewLine(lang)) +
TB.kbx_e29__t.k0 + esc(t(lang, 'ep_pub_h')) + '</h2>' + ul(t(lang, 'ep_pub')) +
'<h2 id="choose">' + esc(t(lang, 'ep_ch_h')) + '</h2>' + ul(t(lang, 'ep_ch')) + '<p><a href="/independence/">' + esc(t(lang, 'l_ind')) + '</a></p>' +
'<h2 id="facts">' + esc(t(lang, 'ep_fa_h')) + '</h2>' + ol(t(lang, 'ep_fa')) + '<p><a href="' + pre(lang) + '/moderation/">' + esc(t(lang, 'l_mod')) + '</a> · <a href="' + pre(lang) + '/sources/">' + esc(t(lang, 'l_src')) + '</a></p>' +
'<h2 id="who">' + esc(t(lang, 'ep_who_h')) + '</h2>' + who +
'<h2 id="review">' + esc(t(lang, 'ep_rv_h')) + '</h2>' + ul(t(lang, 'ep_rv')) + '<p class="k-small k-muted">' + fill(esc(t(lang, 'mv')), { v: METHOD.v, d: tm(METHOD.d, lang), n: tm(METHOD.next, lang) }) + ' <a href="' + pre(lang) + '/methods/transparency-score/">' + esc(t(lang, 'l_score')) + '</a> · <a href="' + pre(lang) + '/how-we-work/">' + esc(t(lang, 'l_hw')) + '</a></p>' +
'<h2 id="corrections">' + esc(t(lang, 'ep_co_h')) + '</h2>' + ul(t(lang, 'ep_co')) + '<p><a href="' + pre(lang) + '/corrections/">' + esc(t(lang, 'l_corr')) + '</a></p>' +
'<h2 id="licence">' + esc(t(lang, 'ep_li_h')) + '</h2>' + ul(t(lang, 'ep_li')) + '<p><a href="' + pre(lang) + '/cite/">' + esc(t(lang, 'l_cite')) + '</a> · <a href="/data-policy/">' + esc(t(lang, 'l_dp')) + TB.kbx_e29__s.k0 +
'<h2 id="not">' + esc(t(lang, 'ep_no_h')) + '</h2>' + ul(t(lang, 'ep_no')) +
rel(lang, [['/how-we-work/', 'l_hw'], ['/sources/', 'l_src'], ['/team/', 'l_team'], ['/moderation/', 'l_mod'], ['/corrections/', 'l_corr'], ['/cite/', 'l_cite'], ['/changelog/', 'l_chg']]) + '</div></div></section></div>';
const title = t(lang, 'ep_title'), desc = t(lang, 'ep_desc');
return { path: P, title, desc, body, ld: [ldPage(lang, P, title, desc, REVIEWED, { accountablePerson: { '@type': 'Person', name: ACC, url: ORIGIN + pre(lang) + '/team/' }, license: TB.kbx_e29__t.k1 }), crumbLd(lang, [[t(lang, 'ep_h1'), pre(lang) + P]])] };
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
if (dom === '*' && dow === '*') return tx(lang, 's_daily', { t: hm });
if (dom === '*/2') return tx(lang, 's_2d', { t: hm });
if (dow !== '*') return tx(lang, 's_wk', { w: t(lang, 'wd')[+dow % 7], t: hm });
const L = dom.split(',');
return L.length > 1 ? tx(lang, 's_mo2', { m: L.join(t(lang, 's_and')), t: hm }) : tx(lang, 's_mo', { m: dom, t: hm });
}
function workPage(lang, D) {
const P = '/how-we-work/', cols = t(lang, 'hw_cols');
const sortKey = j => { const [mi, hr, dom, , dow] = j[1].split(' '); return (cronKind(j[1]) === 'm' ? +dom.split(',')[0] * 1440 : dow !== '*' ? ((+dow + 6) % 7) * 1440 : 0) + (+hr) * 60 + (+mi); };
const tbl = kind => { const L = JOBS.filter(j => cronKind(j[1]) === kind).sort((a, b) => sortKey(a) - sortKey(b));
    return '<div class="k29-tw" tabindex="0" role="region" aria-label="' + esc(t(lang, 'hw_' + kind + '_h')) + '"><table><thead><tr>' + cols.map(c => '<th scope="col">' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' +
      L.map(([k, c, f, pg]) => '<tr><td class="k29-n" data-l="' + esc(cols[0]) + '">' + esc(cronText(c, lang)) + '</td><td data-l="' + esc(cols[1]) + '">' + (pg ? '<a href="' + esc(pg) + '">' + esc(t(lang, k)) + '</a>' : esc(t(lang, k))) + '</td><td data-l="' + esc(cols[2]) + '"><a href="/data/' + f + '" dir="ltr">' + esc(f) + '</a></td><td class="k29-n" data-l="' + esc(cols[3]) + '">' + (D[f] ? tm(D[f], lang) : esc(t(lang, 'hw_never'))) + '</td></tr>').join('') + '</tbody></table></div>'; };
const n = k => JOBS.filter(j => cronKind(j[1]) === k).length, last = Object.values(D).filter(Boolean).sort().pop();
const body = '<div class="kpg">' + head(lang, [[t(lang, 'hw_h1'), pre(lang) + P]], esc(t(lang, 'hw_h1')), esc(t(lang, 'hw_lead')), reviewLine(lang)) +
'<div class="k-prose"><p><b>' + esc(tx(lang, 'hw_sum', { a: nf(lang, JOBS.length), d: nf(lang, n('d')), w: nf(lang, n('w')), m: nf(lang, n('m')), last: last ? fdt(last, lang) : '-' })) + '</b></p>' +
'<h2 id="daily">' + esc(t(lang, 'hw_d_h')) + '</h2>' + tbl('d') + '<h2 id="weekly">' + esc(t(lang, 'hw_w_h')) + '</h2>' + tbl('w') + '<h2 id="monthly">' + esc(t(lang, 'hw_m_h')) + '</h2>' + tbl('m') +
'<p class="k-small k-muted">' + esc(tx(lang, 'hw_note', { d: fdt(READ_JOBS, lang) })) + '</p>' +
'<h2 id="people">' + esc(t(lang, 'hw_ppl_h')) + '</h2>' + ul(t(lang, 'hw_ppl')) + '<p><a href="' + pre(lang) + '/moderation/">' + esc(t(lang, 'l_mod')) + '</a> · <a href="' + pre(lang) + '/corrections/">' + esc(t(lang, 'l_corr')) + '</a></p>' +
'<h2 id="flow">' + esc(t(lang, 'hw_flow_h')) + '</h2>' + ol(t(lang, 'hw_flow')) + '<p><a href="/shipping/">' + esc(t(lang, 'l_ship')) + '</a> · <a href="/status/">' + esc(t(lang, 'l_status')) + '</a> · <a href="/changelog/">' + esc(t(lang, 'l_chg')) + '</a></p>' +
accLine(lang) + errLine(lang) + rel(lang, [['/editorial-policy/', 'l_ep'], ['/sources/', 'l_src'], ['/team/', 'l_team'], ['/numbers/', 'l_numbers'], ['/data-policy/', 'l_dp']]) + '</div></div></section></div>';
const title = t(lang, 'hw_title'), desc = t(lang, 'hw_desc');
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
const P = '/sources/', cols = t(lang, 'so_cols'), pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const cell = (a, b) => nf(lang, a) + ' <small>(' + nf(lang, pct(a, b)) + '%)</small>';
const rows = S.L.map(c => { const top = [...c.offD.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 3);
return '<tr><td data-l="' + esc(cols[0]) + '"><a href="/countries/' + slugC(c.co) + '/">' + bdi(coName(c.co, lang) || c.co) + '</a></td><td class="k29-n" data-l="' + esc(cols[1]) + '">' + nf(lang, c.p) + '</td><td class="k29-n" data-l="' + esc(cols[2]) + '">' + nf(lang, c.u) + '</td><td class="k29-n" data-l="' + esc(cols[3]) + '">' + cell(c.dv, c.u) + '</td><td class="k29-n" data-l="' + esc(cols[4]) + '">' + cell(c.of, c.u) + '</td><td class="k29-n" data-l="' + esc(cols[5]) + '">' + cell(c.ot, c.u) + '</td><td data-l="' + esc(cols[6]) + '">' +
(top.length ? top.map(([h, k]) => '<bdi dir="ltr">' + esc(h) + '</bdi> <small>(' + nf(lang, k) + ')</small>').join(', ') : '<small>' + esc(t(lang, 'so_none')) + '</small>') + '</td></tr>'; }).join('');
const A = S.all;
const body = '<div class="kpg">' + head(lang, [[t(lang, 'so_h1'), pre(lang) + P]], esc(t(lang, 'so_h1')), esc(t(lang, 'so_lead')), '<p class="k-small k-muted">' + esc(tx(lang, 'read', { d: fdt(S.updated, lang) })) + TB.kbx_e29__t.k2 + esc(t(lang, 'lic')) + '</p>') +
'<div class="k-prose"><p><b>' + esc(tx(lang, 'so_sum', { u: nf(lang, A.u), d: nf(lang, A.doms.size), p: nf(lang, A.p), c: nf(lang, S.L.length), dv: nf(lang, A.dv), of: nf(lang, A.of), ot: nf(lang, A.ot) })) + '</b></p>' +
TB.kbx_e29__t.k3 + esc(t(lang, 'so_h1')) + '"><table><thead><tr>' + cols.map(c => '<th scope="col">' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
'<p>' + esc(t(lang, 'so_low')) + TB.kbx_e29__t.k4 +
'<h2 id="rule">' + esc(t(lang, 'so_rule_h')) + '</h2>' + ul(t(lang, 'so_rule')) +
'<p>' + esc(t(lang, 'so_reg')) + ' <a href="/registers/">' + esc(t(lang, 'l_reg')) + '</a></p>' + reviewLine(lang) + accLine(lang) + errLine(lang) +
rel(lang, [['/editorial-policy/', 'l_ep'], ['/how-we-work/', 'l_hw'], ['/registers/', 'l_reg'], ['/countries/', 'l_countries'], ['/data-policy/', 'l_dp']]) + '</div></div></section></div>';
const title = t(lang, 'so_title'), desc = t(lang, 'so_desc');
return { path: P, title, desc, body, ld: [ldPage(lang, P, title, desc, S.updated, { license: TB.kbx_e29__t.k5 }), crumbLd(lang, [[t(lang, 'so_h1'), pre(lang) + P]])] };
}
let BUY = null;
async function buyMods() { if (!BUY) { const [b, n, i] = await Promise.all([import('./kbx_buy.js'), import('./kbx_buy_notes.js'), import('./kbx_buy_i18n.js')]); BUY = { PLAN: b.PLAN, SRC: b.SRC, guideData: b.guideData, NT: n.NT, PL: i.PL, BS: i.BS, PLACES: i.BUY_PLACES }; } return BUY; }
const note = (B, k, lang) => (B.NT[k] && (B.NT[k][lang] || B.NT[k].en)) || '';
const srcHtml = (B, lang, ids) => '<span class="k29-src">' + ids.map(i => B.SRC[i]).filter(Boolean).map(s => '<a href="' + esc(s.u) + '"' + (s.own ? '' : ' rel="noopener"') + '><bdi>' + esc(s.n) + '</bdi></a>' + (s.d ? ' (' + esc(tx(lang, s.own ? 'opened' : 'read', { d: fdt(s.d, lang) })) + ')' : '')).join(' · ') + '</span>';
const placeN = (B, P, lang) => (B.PL[P.s] && (B.PL[P.s].n[lang] || B.PL[P.s].n.en)) || P.s;
const stepN = (B, k, lang) => (B.BS[lang] && B.BS[lang]['st_' + k]) || B.BS.en['st_' + k];
const guideU = (lang, P) => pre(lang) + '/guides/buying-off-plan/' + P.s + '/';
const BP_STEPS = ['company', 'permit', 'money', 'sale', 'date'];
function protectPage(lang, B, G, LAW) {
const P = '/buyer-protection-law/', places = B.PLACES.filter(p => B.PLAN[p.s]);
let k = 0; const srcs = new Set();
const cards = places.map(p => { const pl = B.PLAN[p.s], g = G && G.places.get(p.s);
const dl = BP_STEPS.map(s => { const L = pl[s] || []; L.forEach(([, ids]) => { k++; ids.forEach(i => { if (B.SRC[i] && !B.SRC[i].own) srcs.add(B.SRC[i].u); }); });
return '<dt>' + esc(stepN(B, s, lang)) + '</dt><dd>' + (L.length ? L.map(([nk, ids]) => '<p>' + esc(note(B, nk, lang)) + '<br>' + srcHtml(B, lang, ids) + '</p>').join('') : '<p class="k-muted">' + esc(t(lang, 'bp_none')) + '</p>') + '</dd>'; }).join('');
return '<section class="k29-card" id="' + p.s + '"><h3>' + bdi(placeN(B, p, lang)) + (placeN(B, p, lang) !== (coName(p.c, lang) || p.c) ? ' <small class="k-muted">(' + bdi(coName(p.c, lang) || p.c) + ')</small>' : '') + '</h3>' + (g && g.n ? '<p class="k-small k-muted">' + esc(tx(lang, 'fb_proj', { n: nf(lang, g.n) })) + '</p>' : '') + '<dl>' + dl + '</dl><p><a href="' + guideU(lang, p) + '">' + esc(t(lang, 'bp_more')) + ': ' + bdi(placeN(B, p, lang)) + '</a></p></section>'; }).join('');
const n = places.length;
const body = '<div class="kpg">' + head(lang, [[t(lang, 'l_guides'), pre(lang) + '/guides/buying-off-plan/'], [t(lang, 'bp_h1'), pre(lang) + P]], esc(t(lang, 'bp_h1')), esc(t(lang, 'bp_lead')), reviewLine(lang)) +
'<div class="k-prose"><p><b>' + esc(tx(lang, 'bp_sum', { n: nf(lang, n), k: nf(lang, k), s: nf(lang, srcs.size) })) + '</b></p><p>' + places.map(p => '<a href="#' + p.s + '">' + bdi(placeN(B, p, lang)) + '</a>').join(' · ') + '</p>' + cards +
(LAW && LAW.rules ? '<p><a href="/tools/law/">' + esc(tx(lang, 'bp_law', { k: nf(lang, LAW.rules.length), m: nf(lang, Object.keys(LAW.markets || {}).length) })) + '</a></p>' : '') + accLine(lang) + errLine(lang) +
rel(lang, [['/countries/foreign-buyers/', 'l_fb'], ['/guides/buying-off-plan/', 'l_guides'], ['/tools/law/', 'l_law'], ['/registers/', 'l_reg'], ['/editorial-policy/', 'l_ep']]) + '</div></div></section></div>';
const title = tx(lang, 'bp_title', { n }), desc = tx(lang, 'bp_desc', { n });
return { path: P, title, desc, body, ld: [ldPage(lang, P, title, desc, REVIEWED, { about: places.map(p => ({ '@type': 'Place', name: placeN(B, p, 'en') })) }), crumbLd(lang, [[t(lang, 'l_guides'), pre(lang) + '/guides/buying-off-plan/'], [t(lang, 'bp_h1'), pre(lang) + P]])] };
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
const P = '/countries/foreign-buyers/', places = B.PLACES.filter(p => B.PLAN[p.s]), n = places.length;
const cards = places.map(p => { const pl = B.PLAN[p.s], g = G && G.places.get(p.s), land = pl.land || [];
const own = land.length ? land.map(([nk, ids]) => '<p>' + esc(note(B, nk, lang)) + '<br>' + srcHtml(B, lang, ids) + '</p>').join('') : '<p class="k-muted">' + esc(t(lang, 'np')) + ' <a href="' + guideU(lang, p) + '">' + esc(t(lang, 'bp_more')) + '</a></p>';
let tax = '<p class="k-muted">' + esc(t(lang, 'fb_tax_none')) + '</p>';
try { const c = costCalc && costCalc({ co: p.c, mk: (p.m || [])[0] || '', ar: '' }, 0, lang);
if (c && (c.rows.length || c.part || c.note)) tax = (c.rows.length ? '<ul>' + c.rows.map(r => '<li><b>' + esc(r.label) + ':</b> <bdi dir="ltr">' + esc(r.rate) + '</bdi>' + (r.src ? ' <span class="k29-src"><a href="' + esc(r.src) + '" rel="noopener"><bdi dir="ltr">' + esc(host(r.src)) + '</bdi></a></span>' : '') + '</li>').join('') + '</ul>' : '') + (c.part ? '<p>' + esc(c.part) + '</p>' : '') + (c.note ? '<p class="k-small">' + esc(c.note) + '</p>' : '') + '<p class="k-small"><a href="' + esc(c.tool) + '">' + esc(t(lang, 'fb_tc')) + '</a></p>';
} catch (e) {}
const lr = letRule(SL, p); let let_ = '<p class="k-muted">' + esc(t(lang, 'fb_let_nc')) + '</p>';
if (lr && lr.f && lr.f.s === 'rule' && lr.f.t) { const S = (lr.f.src || []).map(i => SL.sources && SL.sources[i]).filter(Boolean);
let_ = '<p>' + bdi(lr.r.name) + ': ' + esc(lr.f.t[lang] || lr.f.t.en) + '<br><span class="k29-src">' + S.map(s => '<a href="' + esc(s.u) + '" rel="noopener"><bdi>' + esc(s.n) + '</bdi></a>' + (s.read ? ' (' + esc(tx(lang, 'read', { d: fdt(s.read, lang) })) + ')' : '')).join(' · ') + TB.kbx_e29__t.k6 + esc(lr.id) + '">' + esc(t(lang, 'l_slr')) + '</a></p>'; }
else if (lr && lr.f && lr.f.s === 'nf') let_ = '<p class="k-muted">' + esc(t(lang, 'fb_let_none')) + '</p>';
return '<section class="k29-card" id="' + p.s + '"><h3>' + bdi(placeN(B, p, lang)) + (placeN(B, p, lang) !== (coName(p.c, lang) || p.c) ? ' <small class="k-muted">(' + bdi(coName(p.c, lang) || p.c) + ')</small>' : '') + '</h3>' + (g && g.n ? '<p class="k-small k-muted">' + esc(tx(lang, 'fb_proj', { n: nf(lang, g.n) })) + '</p>' : '') +
'<dl><dt>' + esc(stepN(B, 'land', lang)) + '</dt><dd>' + own + '</dd><dt>' + esc(t(lang, 'fb_tax')) + '</dt><dd>' + tax + '</dd><dt>' + esc(t(lang, 'fb_let')) + '</dt><dd>' + let_ + '</dd></dl><p><a href="' + guideU(lang, p) + '">' + esc(t(lang, 'bp_more')) + ': ' + bdi(placeN(B, p, lang)) + '</a></p></section>'; }).join('');
const body = '<div class="kpg">' + head(lang, [[t(lang, 'l_countries'), '/countries/'], [tx(lang, 'fb_h1', { n }), pre(lang) + P]], esc(tx(lang, 'fb_h1', { n })), esc(t(lang, 'fb_lead')), reviewLine(lang)) +
'<div class="k-prose"><p>' + places.map(p => '<a href="#' + p.s + '">' + bdi(placeN(B, p, lang)) + '</a>').join(' · ') + '</p>' + cards + '<p class="k-small">' + esc(t(lang, 'fb_note')) + '</p>' + accLine(lang) + errLine(lang) +
rel(lang, [['/buyer-protection-law/', 'l_bp'], ['/guides/buying-off-plan/', 'l_guides'], ['/tools/total-cost/', 'l_tc'], ['/guides/short-let-rules/', 'l_slr'], ['/countries/', 'l_countries']]) + '</div></div></section></div>';
const title = tx(lang, 'fb_title', { n }), desc = tx(lang, 'fb_desc', { n });
return { path: P, title, desc, body, ld: [ldPage(lang, P, title, desc, (SL && SL.updated) > REVIEWED ? SL.updated : REVIEWED), crumbLd(lang, [[t(lang, 'l_countries'), '/countries/'], [tx(lang, 'fb_h1', { n }), pre(lang) + P]])] };
}
const BODY = new Map();
export async function handle(req, u, env, ctx, shell) {
const m = PAGE_RX.exec(u.pathname); if (!m || !shell) return null;
if (!m[3]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
const lang = m[1] || 'en', kind = m[2];
let pg;
try {
if (kind === 'editorial-policy') { const k = lang + '|ep'; pg = BODY.get(k); if (!pg) { pg = editorialPage(lang); BODY.set(k, pg); } }
else if (kind === 'how-we-work') { const D = {}; await Promise.all([...new Set(JOBS.map(j => j[2]))].map(async f => { D[f] = await fileDate(env, f); })); pg = workPage(lang, D); }
else if (kind === 'sources') { const N = await load(env, 'named.json'), S = sourcesData(N), k = lang + '|so|' + S.updated + '|' + (N.projects || []).length; pg = BODY.get(k); if (!pg) { pg = sourcesPage(lang, S); if (BODY.size > 300) BODY.clear(); BODY.set(k, pg); } }
else {
const B = await buyMods(); let G = null; try { G = await B.guideData(env); } catch (e) {}
if (kind === 'buyer-protection-law') { let LAW = null; try { LAW = await load(env, 'law.json', 'tools/law/'); } catch (e) {} const k = lang + '|bp|' + (G ? G.v : '') + '|' + (LAW ? LAW.version : ''); pg = BODY.get(k); if (!pg) { pg = protectPage(lang, B, G, LAW); if (BODY.size > 300) BODY.clear(); BODY.set(k, pg); } }
else { let SL = null; try { SL = await load(env, 'short-let-rules.json'); } catch (e) {} let cc = null; try { cc = (await import('./kbx_facets.js')).costCalc; } catch (e) {}
const k = lang + '|fb|' + (G ? G.v : '') + '|' + (SL ? SL.updated : ''); pg = BODY.get(k); if (!pg) { pg = foreignPage(lang, B, G, SL, cc); if (BODY.size > 300) BODY.clear(); BODY.set(k, pg); } }
}
} catch (e) { return null; }
return trustRender(lang, Object.assign({}, pg, { body: dots(pg.body).replace('<div class="kpg">', TB.kbx_e29__s.CSS29 + '<div class="kpg">') }), shell);
}
export { editorialPage, workPage, sourcesPage, protectPage, foreignPage, sourcesData, cronText, JOBS, buyMods };
