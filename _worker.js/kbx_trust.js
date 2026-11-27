// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_trust__q, $s = TB.kbx_trust__s, $t = TB.kbx_trust__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { t31, loadS as loadS31 } from './kbx_n31b_page.js';
import { jget } from './kbx_jget.js';
import { e29t } from './kbx_e29_i18n.js';
import { REVIEWED as E29_REV } from './kbx_e29_lines.js';
import { TS } from './kbx_trust_i18n.js';
import { trData } from './kbx_tr.js';
import { placeName } from './kbx_hdate.js';
import { t27 } from './kbx_t27_i18n.js';
import { ogImg } from './kbx_ogt.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const PAGE_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(progress(?:\/improvements)?|moderation|team|press\/places(?:\/[a-z0-9-]{2,40})?)(\/?)$/;
export const SITEMAP = '/progress/sitemap.xml';
export const PATHS = /^\/api\/x\/progress(?:\/today)?\/?$/;
const REVIEWED = '2026-11-13';
const MIN_PRESS = 5;
const CTRY_ALIAS = { 'Puerto Rico (USA)': 'Puerto Rico', 'St Lucia': 'Saint Lucia', 'United States': 'USA', 'United Arab Emirates': 'UAE' };
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a, "'": '&#39;' }[c]));
const bdi = s => '<bdi>' + esc(s) + $q.b;
const t = (lang, k) => (TS[lang] && TS[lang][k] != null) ? TS[lang][k] : TS.en[k];
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, a) => v && v[a] != null ? v[a] : m);
const te = (lang, k, v) => fill(esc(t(lang, k)), v);
const tx = (lang, k, v) => fill(t(lang, k), v);
const nf = (lang, n) => n == null ? '' : Number(n).toLocaleString(LOC[lang] || 'en-GB');
const fdt = (iso, lang, short) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); if (!m) return String(iso || ''); try { return new Intl.DateTimeFormat(LOC[lang] || 'en-GB', short ? { day: $q.c, month: 'short', timeZone: 'UTC' } : { day: $q.c, month: 'long', year: $q.c, timeZone: 'UTC' }).format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))); } catch (e) { return iso.slice(0, 10); } };
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const day = d => d.toISOString().slice(0, 10);
const SHARED = (globalThis.__kbJson = globalThis.__kbJson || {});
async function load(env, name) {
const m = SHARED[name]; if (m && (m.a || Date.now() - m.t < 600000)) return m.v;
return (await jget(env, name, ORIGIN + $q.d + name, ORIGIN + $q.e + name)).v;
}
const opt = (env, n) => load(env, n).catch(() => null);
const capped = (p, ms) => Promise.race([p.catch(() => null), new Promise(r => setTimeout(() => r(null), ms))]);
let SMC = null, SMP = null;
async function sitemapUrls(env, inner, ctx, wait) {
if (SMC && Date.now() - SMC.t < 600000) return SMC.v;
const ck = typeof caches !== $q.f ? new Request(ORIGIN + $q.g + ((env && env.CF_PAGES_COMMIT_SHA) || 'x')) : null;
if (ck) { try { const h = await caches.default.match(ck); if (h) { const v = +(await h.text()); if (v > 0) { SMC = { t: Date.now(), v }; return v; } } } catch (e) {} }
if (!wait) return SMC ? SMC.v : null;
if (!SMP) SMP = (async () => {
const seo = await import('./kbx_seo.js');
let n = await seo.sitemapTotal(env, inner);
for (const x of [$q.h, $q.i, SITEMAP]) {
try { const r = x === SITEMAP ? new Response(await sitemapXml(env)) : (inner ? await inner(x) : null); if (r && r.ok) n += ((await r.text()).match(/<url>/g) || []).length; } catch (e) {}
}
SMC = { t: Date.now(), v: n };
if (ck) { try { await caches.default.put(ck, new Response(String(n), { headers: { 'cache-control': $q.j } })); } catch (e) {} }
return n;
})().catch(() => null).finally(() => { SMP = null; });
const p = SMP; if (ctx && ctx.waitUntil) ctx.waitUntil(p);
const v = await capped(p, wait ? 8000 : 600);
return v != null ? v : (SMC ? SMC.v : null);
}
let PD = null;
export async function progData(env, inner) {
const [named, cases, ship, dep, prog] = await Promise.all([load(env, $q.k), load(env, $q.l), opt(env, $q.m), opt(env, $q.n), opt(env, $q.o)]);
const today = day(new Date());
const key = [named, cases, ship, dep, prog, today];
let base = PD && PD.key.every((v, i) => v === key[i]) ? PD.v : null;
if (!base) {
const cs = cases.cases || [], byId = new Map(cs.map(c => [c.id, c]));
const add = new Map(); let first = null;
for (const x of named.projects || []) {
const d = /^\d{4}-\d{2}-\d{2}$/.test(x.ad || '') ? x.ad : null; if (!d) continue;
const c = byId.get(x.id), mk = (c && c.market) || x.mk, co = CTRY_ALIAS[(c && c.country) || x.co] || (c && c.country) || x.co;
const a = add.get(d) || { n: 0, mk: [], co: [] }; a.n++; if (mk) a.mk.push(mk); if (co) a.co.push(co); add.set(d, a);
if (!first || d < first) first = d;
}
const ships = new Map(((ship && ship.days) || []).map(x => [x.date, x.ships || 0]));
const deps = new Map(); for (const x of (dep && dep.deploys) || []) if (x && x.at && x.result !== $q.p) { const d = String(x.at).slice(0, 10); deps.set(d, (deps.get(d) || 0) + 1); }
const depFirst = [...deps.keys()].sort()[0] || null, shipFirst = (ship && ship.first_day) || null;
const series = [], MK = new Set(), CO = new Set(); let total = 0;
if (first) for (let d = new Date(first + $q.q); day(d) <= today; d.setUTCDate(d.getUTCDate() + 1)) {
const k = day(d), a = add.get(k);
if (a) { total += a.n; a.mk.forEach(m => MK.add(m)); a.co.forEach(c => CO.add(c)); }
series.push({ d: k, added: a ? a.n : 0, total, markets: MK.size, countries: CO.size, ships: shipFirst && k >= shipFirst && (ship.today ? k <= ship.today : true) ? (ships.get(k) || 0) : null, deploys: depFirst && k >= depFirst ? (deps.get(k) || 0) : null });
}
const db = cases.db || {};
const live = { projects: cs.length, markets: cases.markets, countries: cs.length ? new Set(cs.map(c => CTRY_ALIAS[c.country] || c.country).filter(Boolean)).size : cases.countries,
sources: db.sources, claims_total: db.claims_total, data_points: db.data_points, data_updated: cases.updated };
const since = day(new Date(Date.now() - 6 * 864e5));
live.ships_7d = series.filter(s => s.d >= since && s.ships != null).reduce((a, s) => a + s.ships, 0);
live.deploys_7d = series.filter(s => s.d >= since && s.deploys != null).reduce((a, s) => a + s.deploys, 0);
const items = (prog && prog.items) || [], cnt = { done: 0, doing: 0, next: 0, planned: 0 }; for (const i of items) if (cnt[i.st] != null) cnt[i.st]++;
base = { live, series, first, shipFirst, depFirst, shipBuilt: ship && ship.generated_at, items, cnt, itemsUpd: prog && prog.items_updated, days: ((prog && prog.days) || []).slice().sort((a, b) => String(b.d).localeCompare(String(a.d))) };
PD = { key, v: base };
}
return base;
}
const ST_BADGE = { done: 'ok', doing: 'info', next: 'plain', planned: 'plain' };
const badge = (lang, st) => $q.r + (ST_BADGE[st] || 'plain') + '">' + esc(t(lang, 'st_' + st)) + $q.s;
const crumb = (lang, list) => $q.t + pre(lang) + $q.u + list.map((x, i) => i < list.length - 1 ? $q.v + x[1] + '">' + esc(x[0]) + '</a>' : $q.w + esc(x[0]) + $q.s).join(' / ') + '</p>';
export const head = (lang, list, h1, lead, extra) => $q.x + crumb(lang, list) + '<h1>' + h1 + $q.y + lead + '</p>' + (extra || '') + $q.z;
export const crumbLd = (lang, list) => ({ '@type': $q.A, itemListElement: [[$q.B, pre(lang) + '/']].concat(list).map((x, i) => ({ '@type': $q.C, position: i + 1, name: x[0], item: ORIGIN + x[1] })) });
const stat = (lang, v, k, src) => $q.D + (v == null ? $q.E + esc(t(lang, 'none')) + $q.s : esc(nf(lang, v))) + $q.F + esc(t(lang, k)) + $q.s + (src ? $q.G + src + $q.H : '') + $q.z;
const srcA = (href, label) => $q.I + esc(href) + '">' + esc(label || href) + '</a>';
const PROG_P = '/progress/', IMP_P = '/progress/improvements/', MOD_P = '/moderation/', TEAM_P = '/team/', PRESS_P = '/press/places/';
function chartSvg(lang, S) {
const W = 720, H = 240, L = 34, R = 46, T = 18, B = 34, n = S.length; if (!n) return '';
const max = Math.max(1, ...S.map(s => s.added)), tot = Math.max(1, S[n - 1].total), cw = (W - L - R) / n, bw = Math.max(2, Math.min(28, cw * 0.7));
const y = v => T + (H - T - B) * (1 - v / max), y2 = v => T + (H - T - B) * (1 - v / tot), x = i => L + cw * i + cw / 2;
let g = $q.J + L + $q.K + (H - B) + $q.L + (W - R) + $q.M + (H - B) + '"/>';
g += $q.N + (L - 4) + '" y="' + (y(max) + 4) + $q.O + esc(nf(lang, max)) + $q.P + (L - 4) + '" y="' + (H - B + 4) + $q.Q;
g += $q.R + (W - R + 4) + '" y="' + (y2(tot) + 4) + '">' + esc(nf(lang, tot)) + $q.P + (W - R + 4) + '" y="' + (y2(tot) + 17) + '">' + esc(t(lang, $q.S)) + $q.T;
const every = Math.max(1, Math.ceil(n / 8));
S.forEach((s, i) => {
if (s.added) { const h = (H - T - B) - (y(s.added) - T); g += $q.U + (x(i) - bw / 2).toFixed(1) + '" y="' + y(s.added).toFixed(1) + $q.V + bw.toFixed(1) + $q.W + Math.max(1, h).toFixed(1) + $q.X + esc(fdt(s.d, lang) + ': ' + nf(lang, s.added)) + $q.Y;
if (cw >= 22) g += $q.Z + x(i).toFixed(1) + '" y="' + (y(s.added) - 4).toFixed(1) + $q.aa + esc(nf(lang, s.added)) + $q.T; }
if (i % every === 0 || i === n - 1) g += $q.N + x(i).toFixed(1) + '" y="' + (H - B + 16) + $q.aa + esc(fdt(s.d, lang, true)) + $q.T;
});
g += $q.ab + S.map((s, i) => x(i).toFixed(1) + ',' + y2(s.total).toFixed(1)).join(' ') + '"/>';
const alt = tx(lang, $q.ac, { a: fdt(S[0].d, lang), b: fdt(S[n - 1].d, lang), n: nf(lang, tot) });
return $t.k0 + W + ' ' + H + $q.ad + esc(alt) + $q.ae + esc(alt) + $q.af + g + $q.ag + esc(t(lang, $q.ah)) + $q.ai;
}
function progressPage(D, lang, sm, smDay) {
const L = D.live, S = D.series, now = day(new Date());
const st = [stat(lang, L.projects, $q.aj, srcA($q.ak)), stat(lang, L.markets, $q.al, srcA($q.ak)), stat(lang, L.countries, $q.am, srcA($q.ak)),
stat(lang, L.sources, $q.an, srcA($q.ao)), stat(lang, L.claims_total, $q.ap, srcA($q.ao)), stat(lang, sm, $q.aq, srcA($q.ar) + (smDay ? ' ' + esc(fdt(smDay, lang)) : '')),
stat(lang, L.ships_7d, $q.as, srcA($q.at)), stat(lang, L.deploys_7d, $q.au, srcA($q.av))].join('');
const cell = v => v == null ? $q.aw + esc(t(lang, 'none')) + '</td>' : $q.ax + esc(nf(lang, v)) + '</td>';
const rows = S.slice().reverse().map(s => $q.ay + esc(t(lang, 'c_day')) + $q.az + s.d + '">' + esc(fdt(s.d, lang)) + $q.aA + [s.added, s.total, s.markets, s.countries, s.ships, s.deploys].map((v, i) => cell(v).replace('<td', $q.aB + esc(t(lang, [$q.aC, $q.aD, 'c_mk', 'c_co', $q.aE, 'c_dep'][i])) + '"')).join('') + '</tr>').join('');
const th = ['c_day', $q.aC, $q.aD, 'c_mk', 'c_co', $q.aE, 'c_dep'].map((k, i) => $q.aF + (i ? $q.aG : '') + '>' + esc(t(lang, k)) + '</th>').join('');
const sn = D.days.length ? $s.k0 + esc(t(lang, 'c_day')) + $q.aH + esc(t(lang, 'c_src')) + $q.aH + esc(t(lang, 'c_cl')) + $q.aH + esc(t(lang, 'c_sm')) + $q.aI +
D.days.slice(0, 60).map(r => $q.aJ + esc(r.d) + '">' + esc(fdt(r.d, lang)) + $q.aA + [r.sources, r.claims_total, r.sitemap_urls].map((v, i) => cell(v).replace('<td', $q.aB + esc(t(lang, ['c_src', 'c_cl', 'c_sm'][i])) + '"')).join('') + '</tr>').join('') + $q.aK : $q.aL + esc(t(lang, $q.aM)) + '</p>';
const c = D.cnt;
const more = [[$q.aN, 'l_chg'], [$q.aO, $q.aP], [$q.aQ, 'l_met'], [$q.aR, $q.aS]].map(([h, k]) => $q.aT + h + '">' + esc(t(lang, k)) + $q.aU).join('')
+ $q.aT + pre(lang) + $q.aV + esc($t.o_NUMS_L[lang] || $t.o_NUMS_L.en) + $q.aU;
const body = $q.aW + head(lang, [[t(lang, 'chg_a'), pre(lang) + PROG_P]], esc(t(lang, 'p_h1')), esc(t(lang, $q.aX)), $q.aY + esc(tx(lang, $q.aZ, { d: fdt(now, lang) })) + '</p>') +
$q.ba + st + $q.z +
$q.bb + esc(t(lang, 'ch_h')) + '</h2>' + chartSvg(lang, S) +
$q.bc + esc(t(lang, 'tb_h')) + $t.k1 + th + $q.bd + rows + $t.k2 + esc(t(lang, $q.be)) + '</p>' +
$q.bf + esc(t(lang, 'sn_h')) + $q.bg + esc(t(lang, 'sn_d')) + '</p>' + sn +
$q.bh + esc(t(lang, 'imp_h')) + $q.bg + esc(tx(lang, 'imp_p', { a: nf(lang, c.done), b: nf(lang, c.doing), c: nf(lang, c.next), d: nf(lang, c.planned) })) + $t.k3 + pre(lang) + IMP_P + '">' + esc(t(lang, 'imp_a')) + $q.bi +
$q.bj + esc(t(lang, 'mt_h')) + $q.bk + t(lang, 'mt').map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>' +
'<h2>' + esc(t(lang, $q.bl)) + $q.bk + more + $q.aT + pre(lang) + TEAM_P + '">' + esc(t(lang, $q.bm)) + $q.bn + pre(lang) + PRESS_P + '">' + esc(t(lang, $q.bo)) + $q.bp +
$t.k4 + esc(t(lang, 'json')) + $s.k1;
const title = t(lang, $q.bq), desc = t(lang, $q.br), url = ORIGIN + pre(lang) + PROG_P;
const ld = [{ '@type': $q.bs, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: now, isPartOf: { '@type': $q.bt, name: $q.B, url: ORIGIN + '/' } },
{ '@type': $q.bu, name: title, description: desc, url, isAccessibleForFree: true, dateModified: now, license: $t.k5, creator: { '@type': $q.bv, name: $q.B, url: ORIGIN + '/' }, temporalCoverage: (D.first || now) + '/' + now, distribution: [{ '@type': $q.bw, encodingFormat: $q.bx, contentUrl: ORIGIN + $q.by }] },
crumbLd(lang, [[t(lang, 'chg_a'), pre(lang) + PROG_P]])];
return { path: PROG_P, title, desc, ld, body };
}
function improvementsPage(D, lang) {
const c = D.cnt, txtLang = lang === 'es' ? 'es' : 'en';
const secs = t(lang, 'sec');
let list = '';
for (let s = 1; s <= 10; s++) {
const its = D.items.filter(i => i.s === s); if (!its.length) continue;
const a = its[0].n, b = its[its.length - 1].n;
list += $q.bz + s + $q.bA + esc(secs[s - 1]) + $q.bB + nf(lang, a) + '‑' + nf(lang, b) + $q.bC +
its.map(i => $q.bD + i.n + '"><b>' + nf(lang, i.n) + '</b>' + badge(lang, i.st) + '<span' + (txtLang !== lang ? $q.bE : '') + '>' + esc(i[txtLang] || i.en) + $q.bF).join('') + $q.bG;
}
const note = t(lang, $q.bH);
const sum = esc(tx(lang, 'i_sum', { a: nf(lang, c.done), b: nf(lang, c.doing), c: nf(lang, c.next), d: nf(lang, c.planned) }));
const nav = $q.bI + esc(t(lang, $q.bJ)) + $t.k6 + secs.map((x, i) => $q.bK + (i + 1) + '">' + esc(x) + $q.aU).join('') + $q.bL;
const body = $q.aW + head(lang, [[t(lang, 'chg_a'), pre(lang) + PROG_P], [t(lang, $q.bJ), pre(lang) + IMP_P]], esc(t(lang, 'i_h1')), esc(t(lang, $q.bM)),
$q.bN + sum + $q.bO + esc(tx(lang, 'upd', { d: fdt(D.itemsUpd, lang) })) + (note ? ' ' + esc(note) : '') + '</p>') +
'<h2>' + esc(t(lang, $q.bP)) + $q.bQ + t(lang, $q.bR).map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>' + nav + list +
$q.bS + pre(lang) + PROG_P + '">' + esc(t(lang, 'chg_a')) + $s.k2;
const title = t(lang, $q.bT), desc = t(lang, $q.bU), url = ORIGIN + pre(lang) + IMP_P;
const ld = [{ '@type': $q.bs, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: D.itemsUpd, isPartOf: { '@type': $q.bt, name: $q.B, url: ORIGIN + '/' } },
crumbLd(lang, [[t(lang, 'chg_a'), pre(lang) + PROG_P], [t(lang, $q.bJ), pre(lang) + IMP_P]])];
return { path: IMP_P, title, desc, ld, body };
}
function pressPlaces(ix) {
const out = [];
for (const [s, pl] of ix.places) { if (s === 'sumba' || !pl.P || pl.L.some(r => r.sumba)) continue; out.push(pl); }
return out.sort((a, b) => b.n - a.n || a.P.n.localeCompare(b.P.n));
}
let OTP = null;   // n40 k24: moved and past counts from /data/on-time.json (the file behind /data/delay-index.json), so press, market files and rankings agree
let PMX = null, NXB = null;   // n40 k47: monthly note from the change feed (/data/changes.json, kbx_n37u) and the added date in named.json
function pmBlock(pl, lang) {
const X = PMX, b = X && NXB && X.built(); if (!b) return '';
const mo = b.slice(0, 7) + '-01', c0 = X.from() > mo ? X.from() : mo, S = new Set(pl.L.map(r => r.s)), P = pl.P;
const add = pl.L.filter(r => { const x = NXB.get(r.s); return x && x.ad && x.ad >= mo && x.ad <= b; }).length;
const C = X.allChanges().filter(([r, x]) => S.has(r[1]) && x.d >= c0).map(X.chRow), ho = C.filter(o => o.field === 'ho');
const R = (k, v) => esc(X.t(lang, k)).replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m);
let ml = b.slice(0, 7); try { ml = new Intl.DateTimeFormat(LOC[lang] || 'en-GB', { month: 'long', year: $q.c, timeZone: 'UTC' }).format(new Date(mo + $q.q)); } catch (e) {}
const v = { m: bdi(placeName(P.n, lang)), mo: esc(ml), d: esc(fdt(b, lang)), f: esc(fdt(mo, lang)), c: esc(fdt(c0, lang)), n: nf(lang, add), t: nf(lang, pl.n), h: nf(lang, ho.length), p: nf(lang, new Set(ho.map(o => o.slug)).size), a: nf(lang, ho.filter(o => o.months_moved > 0).length), e: nf(lang, ho.filter(o => o.months_moved < 0).length), o: nf(lang, C.length - ho.length) };
const one = P.m.length === 1 && !P.a, href = $q.bV + c0 + (one ? '&m=' + encodeURIComponent(P.m[0]) : '');
return $q.bW + R($q.bX, v) + $q.bY + R($q.bZ, v) + $q.ca + R($q.cb, v) + $q.cc + R($q.cd, v) + $q.cc + R($q.ce, v) + $q.cf + srcA(one ? href : $q.cg, X.t(lang, $q.ch)) + '</p>';
}
function placeFigures(pl) {
const L = pl.L, n = L.length, cnt = k => L.filter(r => r.comp[k] && r.comp[k].st === 'yes').length;
return { n, dv: new Set(L.map(r => r.dvs || r.dv).filter(Boolean)).size, date: cnt('date'), permit: cnt($q.ci), deposit: cnt($q.cj), location: cnt($q.ck), price: cnt('price'),
moved: OTP ? L.filter(r => (OTP[r.id] || {}).moved > 0).length : L.filter(r => ['moved', 'late'].includes(r.comp.record && r.comp.record.r)).length, past: OTP ? L.filter(r => { const o = OTP[r.id]; return o && o.overdue > 0 && !/^(done_|completed)/.test(o.s || ''); }).length : L.filter(r => r.comp.record && r.comp.record.r === 'past').length, med: pl.ranked ? pl.med : null };
}
function pressHub(ix, lang) {
const P = pressPlaces(ix).filter(pl => pl.n >= MIN_PRESS);
const rows = P.map(pl => { const f = placeFigures(pl), nm = placeName(pl.P.n, lang);
return $q.ay + esc(t(lang, $q.cl)) + $q.cm + pre(lang) + PRESS_P + pl.P.s + '/">' + bdi(nm) + $q.cn + esc(t(lang, 'c_n')) + '">' + nf(lang, f.n) + $q.co + esc(t(lang, $q.cp)) + '">' + nf(lang, pct(f.date, f.n)) + $q.cq + esc(t(lang, $q.cr)) + '">' + nf(lang, pct(f.permit, f.n)) + $q.cs; }).join('');
const body = $q.aW + head(lang, [[t(lang, $q.ct), $q.cu], [t(lang, $q.bo), pre(lang) + PRESS_P]], esc(t(lang, $q.cv)), esc(t(lang, $q.cw)), $q.aY + esc(tx(lang, 'upd', { d: fdt(ix.updated, lang) })) + '</p>') +
$t.k7 + esc(t(lang, $q.cl)) + $q.aH + esc(t(lang, 'c_n')) + $q.aH + esc(t(lang, $q.cp)) + $q.aH + esc(t(lang, $q.cr)) + $q.aI + rows + $q.aK +
$q.cx + pre(lang) + $q.cy + esc(t(lang, $q.cz)) + $q.bn + pre(lang) + $q.cA + esc(t(lang, $q.cB)) + $q.cC + esc(t(lang, 'l_kit')) + $q.cD + esc(t(lang, $q.cE)) + $q.cF;
const title = t(lang, $q.cG), desc = t(lang, $q.cH), url = ORIGIN + pre(lang) + PRESS_P;
const ld = [{ '@type': $q.bs, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: ix.updated, isPartOf: { '@type': $q.bt, name: $q.B, url: ORIGIN + '/' } }, crumbLd(lang, [[t(lang, $q.ct), $q.cu], [t(lang, $q.bo), pre(lang) + PRESS_P]])];
return { path: PRESS_P, title, desc, ld, body };
}
function pressPlace(ix, slug, lang) {
const pl = pressPlaces(ix).find(x => x.P.s === slug); if (!pl || pl.n < MIN_PRESS) return null;
const f = placeFigures(pl), nm = placeName(pl.P.n, lang), d = ix.updated, path = PRESS_P + slug + '/', url = ORIGIN + pre(lang) + path;
const P = bdi(nm), D = esc(fdt(d, lang)), of = (a, b) => te(lang, 'of', { n: nf(lang, a), m: nf(lang, b) }) + $q.cI + nf(lang, pct(a, b)) + $q.cJ;
const src = srcA(pre(lang) + $q.cK + slug + '/', t(lang, 'src'));
const fig = (k, v) => $q.D + v + $q.F + esc(t(lang, k)) + $q.cL;
const figs = fig('f_n', nf(lang, f.n)) + fig('f_dev', nf(lang, f.dv)) + fig($q.cM, of(f.date, f.n)) + fig($q.cN, of(f.permit, f.n)) + fig('f_dep', of(f.deposit, f.n)) + fig('f_loc', of(f.location, f.n)) + fig($q.cO, of(f.price, f.n)) + fig($q.cP, of(f.moved, f.n)) + fig($q.cQ, of(f.past, f.n)) + (f.med != null ? fig('f_med', nf(lang, f.med) + $q.cR) : '');
const q = [te(lang, 'q_n', { n: nf(lang, f.n), p: P, dv: nf(lang, f.dv), d: D }), te(lang, $q.cS, { n: nf(lang, f.date), m: nf(lang, f.n), p: P, x: nf(lang, pct(f.date, f.n)) }), te(lang, $q.cT, { n: nf(lang, f.permit), m: nf(lang, f.n), x: nf(lang, pct(f.permit, f.n)) }),
te(lang, 'q_dep', { n: nf(lang, f.deposit), m: nf(lang, f.n), x: nf(lang, pct(f.deposit, f.n)) }), te(lang, $q.cU, { n: nf(lang, f.moved), m: nf(lang, f.n) }), te(lang, $q.cV, { n: nf(lang, f.past), m: nf(lang, f.n) })];
if (f.med != null) q.push(te(lang, 'q_med', { p: P, s: nf(lang, f.med) }));
const cite = te(lang, $q.cW, { p: P, d: D, u: '<bdi>' + esc(url) + $q.b });
const body = $q.aW + head(lang, [[t(lang, $q.ct), $q.cu], [t(lang, $q.bo), pre(lang) + PRESS_P], [nm, pre(lang) + path]], te(lang, 'r_h1', { p: P }), te(lang, $q.cX, { p: P, d: D })) +
$q.cY + figs + $q.cZ + src + $q.da + esc(tx(lang, 'upd', { d: fdt(d, lang) })) + $q.db + $q.dc + esc(t(lang, $q.dd)) + $q.de + pre(lang) + $q.df + esc(t(lang, $q.dg)) + $q.bi +
(PMX ? pmBlock(pl, lang) : '') + $q.dh + esc(t(lang, 'q_h')) + $q.di + q.map(x => $q.dj + x + $q.dk).join('') + '</ul>' +
$q.dl + esc(t(lang, $q.dm)) + $q.dn + cite + '</p>' +
$q.do + esc(t(lang, 'rs_h')) + $q.bk + t(lang, 'rs').map(s => '<li>' + esc(fill(s, { d: fdt(d, lang) })) + '</li>').join('') + '</ul>' +
$q.cx + pre(lang) + $q.cK + slug + '/">' + te(lang, $q.dp, { p: P }) + $q.bn + pre(lang) + $q.cA + esc(t(lang, $q.cB)) + $t.k8 + slug + '">' + esc(t(lang, 'json')) + $q.bn + pre(lang) + PRESS_P + '">' + esc(t(lang, 'l_all')) + $q.cC + esc(t(lang, 'l_kit')) + $q.bp +
$q.dq + esc(t(lang, $q.cE)) + $q.cF;
const title = tx(lang, $q.dr, { p: nm }), desc = tx(lang, $q.ds, { p: nm, n: nf(lang, f.n), d: fdt(d, lang) });
const ld = [{ '@type': $q.bs, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: d, isPartOf: { '@type': $q.bt, name: $q.B, url: ORIGIN + '/' } },
{ '@type': $q.bu, name: title, description: desc, url, isAccessibleForFree: true, dateModified: d, license: $t.k9, creator: { '@type': $q.bv, name: $q.B, url: ORIGIN + '/' }, spatialCoverage: { '@type': 'Place', name: pl.P.n }, distribution: [{ '@type': $q.bw, encodingFormat: $q.bx, contentUrl: ORIGIN + $q.dt + slug }] },
crumbLd(lang, [[t(lang, $q.ct), $q.cu], [t(lang, $q.bo), pre(lang) + PRESS_P], [nm, pre(lang) + path]])];
return { path, title, desc, ld, body };
}
const linkList = (lang, L) => '<ul>' + L.map(([h, k]) => $q.aT + h + '">' + esc(t(lang, k)) + $q.aU).join('') + '</ul>';
function moderationPage(lang) {
const secs = t(lang, 'mo').map(([h, ps], i) => $q.du + (i + 1) + '">' + esc(h) + '</h2>' + (ps.length > 2 ? '<ul>' + ps.map(p => '<li>' + esc(p) + '</li>').join('') + '</ul>' : ps.map(p => '<p>' + esc(p) + '</p>').join(''))).join('');
const body = $q.aW + head(lang, [[t(lang, 'mo_h1'), pre(lang) + MOD_P]], esc(t(lang, 'mo_h1')), esc(t(lang, $q.dv)), $t.k10 + REVIEWED + '">' + esc(tx(lang, 'rev', { d: fdt(REVIEWED, lang) })) + $q.dw) +
$q.dx + secs + '<h2>' + esc(t(lang, $q.dy)) + '</h2>' + linkList(lang, [[$q.dz, $q.dA], [$q.dB, 'l_ind'], [$q.dC, $q.dD], [$q.dE, 'l_rep'], [pre(lang) + TEAM_P, $q.bm]]) + $q.dF;
const title = t(lang, $q.dG), desc = t(lang, $q.dH), url = ORIGIN + pre(lang) + MOD_P;
return { path: MOD_P, title, desc, body, ld: [{ '@type': $q.bs, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: REVIEWED, lastReviewed: REVIEWED, publisher: { '@type': $q.bv, name: $q.B, url: ORIGIN + '/' } }, crumbLd(lang, [[t(lang, 'mo_h1'), pre(lang) + MOD_P]])] };
}
const FOUNDERS = [['Carlos de Ory', 'r_ceo'], ['Ignacio Hojas García-Plaza', 'r_co']];
const FID = ['carlos-de-ory', 'ignacio-hojas-garcia-plaza'], FJOB = ['CEO', 'Co-founder'];
function teamPage(lang) {
const how = $q.dI + t(lang, $q.dJ).map(([h, p]) => $q.dK + esc(h) + $q.dL + esc(p) + $q.dM).join('') + '</ol>';
const ab = lang === 'en' || lang === 'es' ? pre(lang) + $q.dN : $q.dN;
const body = $q.aW + head(lang, [[t(lang, 'tm_h1'), pre(lang) + TEAM_P]], esc(t(lang, 'tm_h1')), esc(t(lang, $q.dO)), $t.k11 + REVIEWED + '">' + esc(tx(lang, 'rev', { d: fdt(REVIEWED, lang) })) + $q.dw) +
$q.dP + esc(t(lang, $q.dQ)) + $q.bg + esc(t(lang, $q.dR)) + $q.dS + FOUNDERS.map(([n, r], i) => $q.dT + FID[i] + '"><b>' + bdi(n) + $q.dU + esc(t(lang, r)) + '</li>').join('') + $q.dV + ab + '">' + esc(t(lang, $q.dW)) + $q.dX + esc(t(lang, $q.dY)) + '</p>' +
(t31(lang, $q.dZ) ? $q.ea + esc(t31(lang, $q.dZ)) + $q.bg + esc(t31(lang, $q.eb)) + '</p>' : '') +
$q.bj + esc(t(lang, $q.ec)) + '</h2>' + how +
$q.ed + esc(t(lang, $q.ee)) + $q.bk + t(lang, $q.ef).map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
$q.eg + esc(t(lang, $q.eh)) + $q.bk + t(lang, $q.ei).map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
$q.ej + esc(t27(lang, $q.ek)) + $q.bk + t27(lang, $q.el).map(x => '<li>' + esc(x) + '</li>').join('') + $q.dV + pre(lang) + $q.em + esc(t27(lang, $q.en)) + $q.bi +
$q.eo + esc(t27(lang, $q.ep)) + $q.bk + t27(lang, $q.eq).map(x => '<li>' + esc(x) + '</li>').join('') + $t.k12 + esc(t27(lang, 'l_ind')) + $q.er + (t31(lang, 'l_coi') ? $q.I + pre(lang) + $q.es + esc(t31(lang, 'l_coi')) + $q.er : '') + $q.I + pre(lang) + $q.et + esc(t27(lang, $q.eu)) + $q.ev + pre(lang) + $q.ew + esc(t27(lang, $q.dA)) + $q.bi +
$q.ex + esc(t(lang, $q.ey)) + $q.bg + esc(tx(lang, $q.ez, { d: fdt(REVIEWED, lang) })) + '</p>' +
linkList(lang, [[pre(lang) + $q.eA, $q.eB], [pre(lang) + $q.eC, 'l_tsm'], [$q.eD, 'l_reg'], [pre(lang) + MOD_P, 'l_mod'], [$q.dB, 'l_ind'], [$q.dz, $q.dA], [$q.aN, 'l_chg']]) +
'<p>' + [[$q.eE, 'l_ep'], [$q.eF, 'l_hw'], [$q.eG, 'l_src']].map(([h, k]) => $q.v + pre(lang) + h + '">' + esc(e29t(lang, k)) + '</a>').join(' · ') + $q.eH;
const title = t(lang, $q.eI), desc = t(lang, $q.eJ), url = ORIGIN + pre(lang) + TEAM_P;
return { path: TEAM_P, title, desc, body, ld: [{ '@type': $q.eK, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: REVIEWED, lastReviewed: REVIEWED, about: { '@id': ORIGIN + '/#org' }, mainEntity: { '@id': ORIGIN + '/#org' }, hasPart: FOUNDERS.map((f, i) => ({ '@id': ORIGIN + TEAM_P + '#' + FID[i] })) },
{ '@type': $q.bv, '@id': ORIGIN + '/#org', name: $q.B, url: ORIGIN + '/', sameAs: [$t.k13], founder: FOUNDERS.map((f, i) => ({ '@id': ORIGIN + TEAM_P + '#' + FID[i] })) },
...FOUNDERS.map(([n, r], i) => ({ '@type': $q.eL, '@id': ORIGIN + TEAM_P + '#' + FID[i], name: n, jobTitle: FJOB[i], description: t(lang, r), worksFor: { '@id': ORIGIN + '/#org' }, url: url + '#' + FID[i] })), crumbLd(lang, [[t(lang, 'tm_h1'), pre(lang) + TEAM_P]])] };
}
const BODY = new Map();
export async function page(req, u, env, ctx, shell, inner) {
  try { await loadS31(env); } catch (e) {}   // n31b: legal advisers note and COI link strings
  if (PATHS.test(u.pathname)) return api(req, u, env, inner, ctx);
  if (u.pathname === SITEMAP) return new Response(await sitemapXml(env), { headers: { 'content-type': $q.eM, 'cache-control': $q.eN } });
  const m = u.pathname.match(PAGE_RX); if (!m || !shell) return null;
  if (!m[3]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': $q.eO } });
  const lang = m[1] || 'en', kind = m[2];
  let pg = null;
  if (kind === $q.eP || kind === 'team') { const k = lang + '|' + kind; pg = BODY.get(k); if (!pg) { pg = kind === 'team' ? teamPage(lang) : moderationPage(lang); BODY.set(k, pg); } }
  else if (kind.startsWith($q.eQ)) {
    let ix; try { ix = await trData(env); } catch (e) { return null; }
    try { const N = await import('./kbx_named.js'), nx = await N.data(env); if (nx.ot && Object.keys(nx.ot).length) OTP = nx.ot; NXB = nx.bySlug; } catch (e) {}
    try { const N37 = await import('./kbx_n37u.js'); PMX = (await N37._r8u.load(env)) ? N37._r8u : null; } catch (e) { PMX = null; }
    const slug = kind.split('/')[2] || null, k = lang + '|p|' + (slug || '#') + '|' + ix.v + '|' + (OTP ? 1 : 0) + (PMX ? PMX.built() + PMX.allChanges().length : '');
    pg = BODY.get(k); if (!pg) { pg = slug ? pressPlace(ix, slug, lang) : pressHub(ix, lang); if (!pg) return null; if (BODY.size > 900) BODY.clear(); BODY.set(k, pg); }
  } else {
    let D; try { D = await progData(env, inner); } catch (e) { return null; }
    if (kind === $q.eR) { const sm = await sitemapUrls(env, inner, ctx); const rec = sm == null && D.days[0] && D.days[0].sitemap_urls ? D.days[0] : null; pg = progressPage(D, lang, sm != null ? sm : rec ? rec.sitemap_urls : null, rec && rec.d); }
    else pg = improvementsPage(D, lang);
  }
  return trustRender(lang, pg, shell);
}
export async function trustRender(lang, pg, shell) {
const sh = await shell(pre(lang) + $q.eA);
const url = ORIGIN + pre(lang) + pg.path, alts = LANGS.map(l => $q.eS + l + $q.eT + ORIGIN + pre(l) + pg.path + '">').join('') + $t.k14 + ORIGIN + pg.path + '">';
const tags = $q.eU + esc(pg.title) + ([...pg.title].length + 11 <= 60 ? $q.eV : '') + $t.k15 + esc(pg.desc) + $q.eW + url + '">' + alts + $t.k16 +
$s.k3 + esc(pg.title) + $t.k17 + esc(pg.desc) + $q.eX + url + $q.eY + ogImg(url) + $t.k18 +
$q.eZ + JSON.stringify({ '@context': $q.fa, '@graph': pg.ld }).replace(/</g, $q.fb) + $q.fc + $s.CSS;
const res = new HTMLRewriter()
.on('html', { element(e) { e.setAttribute('lang', lang); if (lang === 'ar') e.setAttribute('dir', 'rtl'); else e.removeAttribute('dir'); } })
.on('title', { element(e) { e.remove(); } })
.on($s.k4, { element(e) { e.remove(); } })
.on($q.fd, { element(e) { e.remove(); } })
.on('head', { element(e) { e.append(tags, { html: true }); } })
.on('main', { element(e) { e.setInnerContent(pg.body, { html: true }); } })
.on($q.fe, { element(e) { const l = e.getAttribute($q.ff); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + pg.path); } })
.transform(new Response(sh.body, { headers: { 'content-type': $q.fg } }));
return new Response(await res.text(), { status: 200, headers: { 'content-type': $q.fg, 'cache-control': $q.fh + (pg.ttl || 600) } });
}
async function sitemapXml(env) {
const paths = [PROG_P, IMP_P, MOD_P, TEAM_P, PRESS_P];
let lm = { [PROG_P]: day(new Date()), [IMP_P]: $q.fi, [MOD_P]: REVIEWED, [TEAM_P]: REVIEWED, [PRESS_P]: null };
try { const ix = await trData(env); lm[PRESS_P] = ix.updated; for (const pl of pressPlaces(ix)) if (pl.n >= MIN_PRESS) { paths.push(PRESS_P + pl.P.s + '/'); lm[PRESS_P + pl.P.s + '/'] = ix.updated; } } catch (e) {}
try { const p = await opt(env, $q.o); if (p && p.items_updated) lm[IMP_P] = p.items_updated; } catch (e) {}
for (const p of [$q.dz, $q.fj, $q.fk, $q.fl, $q.fm, '/faq/']) { paths.push(p); lm[p] = REVIEWED; }
for (const p of [$q.fn, $q.fo]) { paths.push(p); lm[p] = $q.fp; }
for (const p of [$q.fq, $q.fr, $q.fs, $q.ft, $q.fu, $q.fv, $q.fw, $q.fx, $q.fy]) { paths.push(p); lm[p] = $q.fz; }
for (const p of [$q.eE, $q.eF, $q.eG, $q.fA, $q.fB]) { paths.push(p); lm[p] = E29_REV; }
try { const c = await opt(env, $q.fC); if (c && c.updated) lm[$q.dz] = c.updated; } catch (e) {}
if (lm[PRESS_P]) lm[$q.fm] = lm[PRESS_P];
const x = paths.flatMap(p => LANGS.map(l => $q.fD + ORIGIN + pre(l) + p + $q.fE + (lm[p] ? $q.fF + lm[p] + $q.fG : '') + LANGS.map(a => $t.k19 + a + $q.eT + ORIGIN + pre(a) + p + '"/>').join('') + $t.k20 + ORIGIN + p + $q.fH));
return $s.k5 + x.join('\n') + $q.fI;
}
async function api(req, u, env, inner, ctx) {
  const H = { 'content-type': $q.fJ, 'cache-control': $q.fK, 'access-control-allow-origin': '*', 'x-content-type-options': $q.fL };
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response(JSON.stringify({ error: $q.fM }), { status: 405, headers: Object.assign({}, H, { 'cache-control': $q.fN }) });
  let D; try { D = await progData(env, inner); } catch (e) { return new Response(JSON.stringify({ error: $q.fO }), { status: 503, headers: Object.assign({}, H, { 'cache-control': $q.fN }) }); }
  const sm = await sitemapUrls(env, inner, ctx, true), L = D.live, now = new Date();
  if (/\/today\/?$/.test(u.pathname)) return new Response(JSON.stringify({ d: day(now), at: now.toISOString().slice(0, 19) + 'Z', projects: L.projects, markets: L.markets, countries: L.countries, sources: L.sources, claims_total: L.claims_total, data_points: L.data_points, sitemap_urls: sm, ships_7d: L.ships_7d, deploys_7d: L.deploys_7d, data_updated: L.data_updated }), { headers: Object.assign({}, H, { 'cache-control': $q.fN }) });
  return new Response(JSON.stringify({ page: ORIGIN + PROG_P, licence: $q.fP, at: now.toISOString().slice(0, 19) + 'Z',
    live: Object.assign({ sitemap_urls: sm }, L), per_day: D.series, daily_records: D.days, improvements: { updated: D.itemsUpd, counts: D.cnt, page: ORIGIN + IMP_P, file: ORIGIN + $q.fQ },
    method: { projects_per_day: $q.fR, changes_shipped: $q.fS, deploys: $q.fT + (D.depFirst || 'n/a') + ')', sitemap_urls: $q.fU } }, null, 1), { headers: H });
}
export { progressPage, improvementsPage, pressHub, pressPlace, moderationPage, teamPage, chartSvg };
