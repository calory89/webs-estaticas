// comments: _notes/kolaboro-worker-comments.txt
import { trData } from './kbx_tr.js';
import { trustRender, head, crumbLd } from './kbx_trust.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const FIRST = '2026-11';
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:reports\/transparency(?:\/20\d\d-[01]\d)?|transparency-badge\/developers)\/?$|^\/reports\/transparency(?:\/20\d\d-[01]\d)?\.csv$|^\/embed\/transparency\/developer\/[a-z0-9-]{1,90}\.svg$/;
export const CITE_RX = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:press\/monthly|press\/data|press\/places(?:\/[a-z0-9-]{2,40})?|research(?:\/[a-z0-9-]{1,80})?|index\/(?:delays|prices)|transparency-index|rankings(?:\/[a-z0-9-]{1,60}){0,2}|handover(?:\/[a-z0-9-]{1,60}){0,2}|numbers|data|reports)\/$/;
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, a) => v && v[a] != null ? v[a] : m);
const nf = (lang, n, d) => Number(n).toLocaleString(LOC[lang] || 'en-GB', d != null ? { minimumFractionDigits: d, maximumFractionDigits: d } : undefined);
const dt = (iso, lang) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); if (!m) return esc(iso || ''); try { return new Intl.DateTimeFormat(LOC[lang], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))); } catch (e) { return iso.slice(0, 10); } };
const mon = (ym, lang) => { const m = /^(\d{4})-(\d{2})$/.exec(ym || ''); if (!m) return ym; try { return new Intl.DateTimeFormat(LOC[lang], { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+m[1], +m[2] - 1, 15))); } catch (e) { return ym; } };
let T = null;
async function loadT(env) {
if (T) return T;
try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/n33b-i18n.json')); if (r.ok) T = await r.json(); } catch (e) {}
if (!T) { try { const r = await fetch(ORIGIN + '/data/n33b-i18n.json', { cf: { cacheTtl: 300 } }); if (r.ok) T = await r.json(); } catch (e) {} }
return T;
}
const t = (lang, k, v) => { const L = (T && T[lang]) || {}, E = (T && T.en) || {}; const s = L[k] != null ? L[k] : E[k] != null ? E[k] : k; return v && typeof s === 'string' ? fill(s, v) : s; };
const SHARED = (globalThis.__kbJson = globalThis.__kbJson || {});
async function json(env, name, ttl) {   // name relative to /data/; same shared parse cache as kbx_t27.js / kbx_tr.js
  const m = SHARED[name]; if (m && Date.now() - m.t < (m.a ? 3600000 : ttl || 600000)) return m.v;
  let r = null, a = false;
  try { r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); a = !!(r && r.ok); } catch (e) { r = null; }
  if (!r || !r.ok) { try { r = await fetch(ORIGIN + '/data/' + name, { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
  const v = r && r.ok ? await r.json() : null;
  SHARED[name] = { t: Date.now(), v, a: a && v != null }; return v;
}
function months(now) {
const L = []; let [y, m] = FIRST.split('-').map(Number); const ey = now.getUTCFullYear(), em = now.getUTCMonth() + 1;
while (y < ey || (y === ey && m <= em)) { L.push(y + '-' + String(m).padStart(2, '0')); m++; if (m > 12) { m = 1; y++; } }
return L;
}
async function editions(env) {
const L = months(new Date()), got = await Promise.all(L.map(ym => json(env, 'transparency-monthly/' + ym + '.json', 3600000)));
return L.map((ym, i) => got[i] && got[i].markets ? got[i] : null).filter(Boolean);
}
function withChange(E, ed) {
const i = E.indexOf(ed), prev = i > 0 ? E[i - 1] : null, P = new Map(((prev && prev.markets) || []).map(r => [r.market, r]));
return { prev, rows: ed.markets.map(r => Object.assign({}, r, { chg: prev ? (P.has(r.market) ? r.transparency_index - P.get(r.market).transparency_index : null) : undefined })) };
}
const med = a => { const s = a.slice().sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; };
const BASE = '/reports/transparency/';
function reportPage(lang, E, ed, isLatest) {
const { prev, rows } = withChange(E, ed), th = t(lang, 'r_th'), M = mon(ed.edition, lang);
const path = isLatest ? BASE : BASE + ed.edition + '/', fileBase = isLatest ? '/reports/transparency' : '/reports/transparency/' + ed.edition;
const chg = r => r.chg === undefined ? '' : r.chg === null ? esc(t(lang, 'r_new')) : r.chg > 0 ? '<span class="n3t-up">+' + nf(lang, r.chg) + '</span>' : r.chg < 0 ? '<span class="n3t-dn">' + nf(lang, r.chg) + '</span>' : '0';
const cols = prev ? th : th.filter((x, i) => i !== 5);
const tr = r => { const c = [nf(lang, r.rank), esc(r.market) + (r.projects < 10 ? ' *' : ''), esc(r.country || ''), nf(lang, r.projects), '<b>' + nf(lang, r.transparency_index) + '</b>', chg(r), nf(lang, r.avg_checks, 2), nf(lang, r.permit_public_pct) + '%', nf(lang, r.deposit_protection_pct) + '%'];
if (!prev) c.splice(5, 1);
return '<tr>' + c.map((v, i) => '<td' + (i === 1 ? '' : ' class="n"') + ' data-l="' + esc(cols[i]) + '">' + (i === 1 ? '<bdi>' + v + '</bdi>' : v) + '</td>').join('') + '</tr>'; };
const tot = rows.reduce((s, r) => s + r.projects, 0), top = rows[0];
const keys = '<div class="n3t-k"><div><b>' + nf(lang, rows.length) + '</b>' + esc(t(lang, 'r_k_markets')) + '</div><div><b>' + nf(lang, tot) + '</b>' + esc(t(lang, 'r_k_projects')) + '</div><div><b>' + nf(lang, med(rows.map(r => r.transparency_index))) + '</b>' + esc(t(lang, 'r_k_median')) + '</div>' + (top ? '<div><b>' + nf(lang, top.transparency_index) + '</b>' + esc(t(lang, 'r_k_top')) + ': <bdi>' + esc(top.market) + '</bdi></div>' : '') + '</div>';
const arch = '<ul class="n3t-l">' + E.slice().reverse().map((e, i) => '<li><a href="' + pre(lang) + BASE + e.edition + '/">' + esc(mon(e.edition, lang)) + '</a>' + (i === 0 ? ' (' + esc(t(lang, 'r_latest')) + ')' : '') + ' · <a href="/reports/transparency/' + e.edition + TB.kbx_n33b__t.k0 + e.edition + '.json" dir="ltr">JSON</a></li>').join('') + '</ul>';
const url = ORIGIN + pre(lang) + path, title = t(lang, 'r_title', { m: M }), h1 = t(lang, 'r_h1', { m: M });
const bib = '@misc{kolaboro_transparency_markets_' + ed.edition.replace('-', '') + TB.kbx_n33b__t.k1 + mon(ed.edition, 'en') + '},\n  year = {' + ed.edition.slice(0, 4) + '},\n  url = {' + ORIGIN + BASE + ed.edition + '/},\n  note = {Data as of ' + ed.data_as_of + '. Licence CC BY 4.0}\n}';
const body = '<div class="kpg">' + head(lang, [[t(lang, 'r_cr_rep'), pre(lang) + '/reports/'], [t(lang, 'r_cr'), pre(lang) + BASE]], esc(h1), esc(t(lang, 'r_lead')),
'<p class="k-small k-muted">' + esc(t(lang, 'r_asof', { m: M, d: dt(ed.data_as_of, lang), f: dt(ed.frozen || ed.data_as_of, lang) })) + '</p>') +
'<div class="k-prose">' + keys +
'<div class="n3t-w"><table><thead><tr>' + cols.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(tr).join('') + '</tbody></table></div>' +
'<p class="k-small k-muted">' + esc(prev ? t(lang, 'r_chg', { p: mon(prev.edition, lang) }) : t(lang, 'r_first')) + ' ' + esc(t(lang, 'r_small')) + '</p>' +
'<h2 id="method">' + esc(t(lang, 'r_method_h')) + '</h2><p>' + esc(t(lang, 'r_method')) + '</p><p>' + esc(t(lang, 'r_limit')) + '</p>' +
'<p>' + esc(t(lang, 'r_live')) + ' <a href="/transparency-index/">' + esc(t(lang, 'r_live_a')) + '</a> · <a href="' + pre(lang) + TB.kbx_n33b__t.k2 +
'<h2 id="download">' + esc(t(lang, 'r_dl_h')) + '</h2><ul class="n3t-l"><li><a href="' + fileBase + '.csv" dir="ltr">' + esc(fileBase) + TB.kbx_n33b__t.k3 + ed.edition + TB.kbx_n33b__t.k4 + ed.edition + '.json</a> <small dir="ltr">sha256 ' + esc(String((ed.source || {}).sha256 || '').slice(0, 16)) + '</small></li></ul>' +
'<h2 id="cite">' + esc(t(lang, 'c_h')) + '</h2><p>' + esc(t(lang, 'c_lic')) + TB.kbx_n33b__t.k5 + esc(mon(ed.edition, 'en')) + '", <a href="' + ORIGIN + BASE + ed.edition + '/">' + ORIGIN + BASE + ed.edition + '/</a>, data as of ' + esc(ed.data_as_of) + '. CC BY 4.0.</code>' +
TB.kbx_n33b__t.k6 + esc(bib) + '</pre></details><p><a href="' + pre(lang) + '/cite/">' + esc(t(lang, 'c_more')) + '</a></p>' +
'<h2 id="editions">' + esc(t(lang, 'r_arch_h')) + '</h2>' + arch + '</div></div></section></div>';
const ld = [{ '@type': 'Dataset', '@id': ORIGIN + BASE + ed.edition + '/#dataset', name: TB.kbx_n33b__t.k7 + mon(ed.edition, 'en'), description: t('en', 'r_desc', { n: rows.length }), url: ORIGIN + BASE + ed.edition + '/',
inLanguage: 'en', license: TB.kbx_n33b__t.k8, creator: { '@type': 'Organization', '@id': ORIGIN + '/#org', name: 'Kolaboro', url: ORIGIN + '/' }, temporalCoverage: ed.edition, dateModified: ed.data_as_of, version: ed.edition,
isBasedOn: ORIGIN + '/data/bali-cases.json', distribution: [{ '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: ORIGIN + '/reports/transparency/' + ed.edition + '.csv' }, { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/data/transparency-monthly/' + ed.edition + '.json' }] },
{ '@type': 'WebPage', '@id': url + '#page', url, name: title, inLanguage: lang, dateModified: ed.data_as_of }, crumbLd(lang, [[t(lang, 'r_cr_rep'), pre(lang) + '/reports/'], [t(lang, 'r_cr'), pre(lang) + BASE]])];
return { path, title, desc: t(lang, 'r_desc', { n: rows.length }), body, ld, ttl: 900 };
}
const csvCell = v => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) || /^[=+\-@]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s) ? '"' + (/^[=+@]/.test(s) ? "'" : '') + s.replace(/"/g, '""') + '"' : s; };
function csv(E, ed) {
const { rows } = withChange(E, ed), H = ['edition', 'rank', 'market', 'country', 'projects', 'transparency_index', 'change_vs_previous_edition', 'avg_public_checks_of_6', 'avg_confirmed_checks_of_6', 'permit_public_pct', 'deposit_protection_pct', 'all_six_public', 'with_flags', 'data_as_of', 'page', 'licence'];
return [H.join(',')].concat(rows.map(r => [ed.edition, r.rank, r.market, r.country, r.projects, r.transparency_index, r.chg == null ? '' : r.chg, r.avg_checks, r.avg_confirmed, r.permit_public_pct, r.deposit_protection_pct, r.all_six_public, r.with_flags, ed.data_as_of, ORIGIN + BASE + ed.edition + '/', TB.kbx_n33b__t.k9].map(csvCell).join(','))).join('\r\n') + '\r\n';
}
let DEV = null;
async function devData(env) {
const [ix, cs] = await Promise.all([trData(env), json(env, 'bali-cases.json')]);
if (DEV && DEV.ix === ix && DEV.cs === cs) return DEV;
const C = new Map(((cs && cs.cases) || []).map(c => [c.id, c])), by = new Map();
for (const r of ix.rows.values()) { if (!r.dvs) continue; const d = by.get(r.dvs) || { s: r.dvs, n: r.dv || r.dvs, P: [], sumba: false }; d.P.push(r); if (r.sumba) d.sumba = true; by.set(r.dvs, d); }
const ok = d => !d.sumba && d.P.length > 0 && d.P.every(r => { const c = C.get(r.id); return c && c.read !== false && (c.max || 6) === 6 && c.score === 6; });
const L = [...by.values()].filter(ok).sort((a, b) => b.P.length - a.P.length || a.n.localeCompare(b.n));
DEV = { ix, cs, L, set: new Map(L.map(d => [d.s, d])), updated: ix.updated };
return DEV;
}
function devSvg(n, date) {
const L = 'Kolaboro public checks', R = n == null ? 'not issued' : '6 of 6 · ' + n + (n === 1 ? ' project' : ' projects'), lw = 150, rw = n == null ? 92 : 132, w = lw + rw, col = n == null ? '#56636F' : '#0B6E4F';
return TB.kbx_n33b__t.k10 + w + '" height="44" viewBox="0 0 ' + w + ' 44" role="img" aria-label="' + esc(L + ': ' + R) + '"><title>' + esc(L + ': ' + R + (n == null ? '' : ', data ' + date)) + '</title>' +
'<rect width="' + w + TB.kbx_n33b__t.k11 + lw + '" width="' + rw + '" height="44" rx="8" fill="' + col + '"/><rect x="' + lw + '" width="10" height="44" fill="' + col + '"/>' +
TB.kbx_n33b__s.k0 +
'<text x="' + (lw + 10) + '" y="' + (n == null ? 27 : 21) + '" font-size="' + (n == null ? 12 : 14) + '" font-weight="700">' + (n == null ? 'not issued' : esc(R)) + '</text>' + (n == null ? '' : '<text x="' + (lw + 10) + TB.kbx_n33b__t.k12 + esc(date) + '</text>') + '</g></svg>';
}
const codeOf = d => '<a href="' + ORIGIN + '/developers/' + d.s + '/"><img src="' + ORIGIN + '/embed/transparency/developer/' + d.s + '.svg" height="44" alt="Kolaboro: ' + String(d.n).replace(/["<>&]/g, '') + ', 6 of 6 buyer checks public"></a>';
function devPage(lang, D) {
const P = '/transparency-badge/developers/', L = D.L, th = t(lang, 'b_th');
const table = L.length ? '<div class="n3t-w"><table><thead><tr>' + th.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' +
L.map(d => '<tr><td data-l="' + esc(th[0]) + '"><a href="' + pre(lang) + '/developers/' + d.s + '/"><bdi>' + esc(d.n) + '</bdi></a></td><td class="n" data-l="' + esc(th[1]) + '">' + nf(lang, d.P.length) + '</td><td data-l="' + esc(th[2]) + TB.kbx_n33b__t.k13 + d.s + '.svg" dir="ltr">' + d.s + '.svg</a></td></tr>').join('') + '</tbody></table></div>' : '<p>' + esc(t(lang, 'b_none')) + '</p>';
const ex = L[0] ? '<p><a href="' + pre(lang) + '/developers/' + L[0].s + TB.kbx_n33b__t.k14 + L[0].s + '.svg" height="44" alt="' + esc('Kolaboro: ' + L[0].n) + '" loading="lazy"></a></p><h3>' + esc(t(lang, 'b_code')) + TB.kbx_n33b__t.k15 + esc(codeOf(L[0])) + '</code>' : '';
const body = '<div class="kpg">' + head(lang, [[t(lang, 'b_cr'), '/developers/'], [t(lang, 'b_title'), pre(lang) + P]], esc(t(lang, 'b_title')), esc(t(lang, 'b_lead')), '<p class="k-small k-muted">' + esc(t(lang, 'upd', { d: dt(D.updated, lang) })) + '</p>') +
'<div class="k-prose">' + ex + '<h2 id="rules">' + esc(t(lang, 'b_rules_h')) + '</h2><ul>' + t(lang, 'b_rules').map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
'<h2 id="list">' + esc(t(lang, 'b_list_h', { n: nf(lang, L.length) })) + '</h2>' + table +
'<h2 id="more">' + esc(t(lang, 'b_more_h')) + '</h2><p>' + esc(t(lang, 'b_more')) + TB.kbx_n33b__t.k16 + esc(t(lang, 'b_reply')) + '</a></p>' +
'<ul class="n3t-l"><li><a href="' + pre(lang) + '/transparency-badge/">' + esc(t(lang, 'b_proj')) + '</a></li><li><a href="' + pre(lang) + TB.kbx_n33b__t.k17;
const title = t(lang, 'b_title'), url = ORIGIN + pre(lang) + P;
return { path: P, title, desc: t(lang, 'b_desc'), body, ld: [{ '@type': 'WebPage', '@id': url + '#page', url, name: title, description: t(lang, 'b_desc'), inLanguage: lang, dateModified: D.updated }, crumbLd(lang, [[t(lang, 'b_title'), pre(lang) + P]])], ttl: 900 };
}
const BODY = new Map();
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname;
let m = /^\/embed\/transparency\/developer\/([a-z0-9-]{1,90})\.svg$/.exec(p);
if (m) { let D; try { D = await devData(env); } catch (e) { return new Response('Not ready', { status: 503, headers: { 'cache-control': 'no-store' } }); }
const d = D.set.get(m[1]); return new Response(devSvg(d ? d.P.length : null, D.updated), { status: d ? 200 : 404, headers: TB.kbx_n33b__t.o_SVGH }); }
m = /^\/reports\/transparency(?:\/(20\d\d-[01]\d))?\.csv$/.exec(p);
if (m) { const E = await editions(env), ed = m[1] ? E.find(e => e.edition === m[1]) : E[E.length - 1];
if (!ed) return new Response('Unknown edition', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
return new Response('﻿' + csv(E, ed), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': TB.kbx_n33b__t.k18 + ed.edition + '.csv"', 'cache-control': 'public, max-age=900', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff', link: TB.kbx_n33b__t.k19 } }); }
m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(reports\/transparency(?:\/(20\d\d-[01]\d))?|transparency-badge\/developers)(\/?)$/.exec(p);
if (!m || !shell) return null;
if (!m[4]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
const lang = m[1] || 'en';
await loadT(env); if (!T) return null;
let pg;
try {
if (m[2].startsWith('transparency-badge')) {
const D = await devData(env), k = lang + '|b|' + D.updated + '|' + D.L.length; pg = BODY.get(k); if (!pg) { pg = devPage(lang, D); BODY.set(k, pg); }
} else {
const E = await editions(env); if (!E.length) return null;
const last = E[E.length - 1], ed = m[3] ? E.find(e => e.edition === m[3]) : last; if (!ed) return null;
if (m[3] && ed === last) { pg = reportPage(lang, E, ed, true); pg = Object.assign({}, pg, { path: BASE }); }
else { const k = lang + '|r|' + ed.edition + '|' + E.length + '|' + !m[3]; pg = BODY.get(k); if (!pg) { pg = reportPage(lang, E, ed, !m[3]); BODY.set(k, pg); } }
}
} catch (e) { return null; }
if (BODY.size > 400) BODY.clear();
return trustRender(lang, Object.assign({}, pg, { body: pg.body.replace('<div class="kpg">', TB.kbx_n33b__s.CSS + '<div class="kpg">') }), shell);
}
const apa40 = (lang, ti, url, d) => { let ds = d; try { ds = d.slice(0, 4) + ', ' + new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : LOC[lang] || 'en-GB', { month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z')); } catch (e) {} return 'Kolaboro. (' + ds + '). ' + ti + '. ' + url; };
const cb40 = (lang, plain, apa, nc) => { const bs = TB.kbx_n33b__s.k1;
return TB.kbx_n33b__t.k20 + (plain ? '<button type="button" style="' + bs + '" data-c40="' + esc(plain) + '" data-ok="' + esc(t(lang, 'c_ok')) + '">' + esc(t(lang, 'c_cp')) + '</button>' : '') +
'<button type="button" style="' + bs + '" data-c40="' + esc(apa) + '" data-ok="' + esc(t(lang, 'c_ok')) + '">' + esc(t(lang, 'c_apa')) + TB.kbx_n33b__t.k21 + esc(nc) + '">' + TB.kbx_n33b__s.CB40JS + '</script>'; };
export async function cite(req, r, env, u) {
  const m = /^\/(es|de|fr|nl|ru|zh|ar)\//.exec(u.pathname), lang = m ? m[1] : 'en';
  await loadT(env); if (!T) return r;
  let h1 = '', inH1 = false, seenH1 = false, has = false;
  const url = ORIGIN + u.pathname, today = new Date().toISOString().slice(0, 10);
  const kc = { on: false, tx: '' };
  const nc = ((((r.headers.get('content-security-policy') || '').match(/'nonce-([A-Za-z0-9+/=]+)'/)) || [])[1]) || '';
  return new HTMLRewriter()
    .on('#cite, #how-to-cite', { element() { has = true; } })
    .on('p.kpg-cite', { element(e) { kc.on = true; e.onEndTag(end => { kc.on = false; const pl = kc.tx.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim(); end.after(cb40(lang, pl, apa40(lang, h1.replace(/\s+/g, ' ').trim() || 'Kolaboro', url, today), nc), { html: true }); }); }, text(x) { if (kc.on) kc.tx += x.text; } })   // n40 k6: copy buttons on /press/places/<place>/
    .on('.dd-cite', { element(e) { e.append(cb40(lang, null, apa40(lang, h1.replace(/\s+/g, ' ').trim() || 'Press data desk', url, today), nc), { html: true }); } })   // n40 k6: APA copy on /press/data/
    .on('main h1', { element(e) { if (seenH1) return; seenH1 = true; inH1 = true; e.onEndTag(() => { inH1 = false; }); }, text(x) { if (inH1) h1 += x.text; } })
    .on('main', { element(e) {
      e.onEndTag(end => {
        if (has) return;
        const ti = h1.replace(/\s+/g, ' ').trim().slice(0, 160) || 'Kolaboro';
        const bib = '@misc{kolaboro_' + u.pathname.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 50) + '_' + today.replace(/-/g, '') + ',\n  author = {{Kolaboro}},\n  title = {' + ti.replace(/[{}\\]/g, '') + '},\n  year = {' + today.slice(0, 4) + '},\n  url = {' + url + '},\n  note = {Read on ' + today + '. Licence CC BY 4.0}\n}';
        end.before('<section id="how-to-cite" aria-labelledby="n33b-ch" style="max-width:1120px;margin:40px auto 24px;padding:0 16px;box-sizing:border-box"><h2 id="n33b-ch">' + esc(t(lang, 'c_h')) + '</h2><p>' + esc(t(lang, 'c_lic')) + '</p>' +
          '<p style="overflow-wrap:anywhere"><code style="white-space:normal">Kolaboro, "' + esc(ti) + '", <a href="' + esc(url) + '">' + esc(url) + '</a>, ' + esc(t(lang, 'c_read', { d: today })) + '. CC BY 4.0.</code></p>' +
          cb40(lang, 'Kolaboro, "' + ti + '", ' + url + ', ' + t(lang, 'c_read', { d: today }) + '. CC BY 4.0.', apa40(lang, ti, url, today), nc) +
          '<details><summary style="min-height:44px;display:flex;align-items:center;cursor:pointer">BibTeX</summary><pre dir="ltr" style="white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px">' + esc(bib) + '</pre></details>' +
          '<p><a href="' + pre(lang) + '/cite/" style="display:inline-block;padding:10px 0">' + esc(t(lang, 'c_more')) + '</a></p></section>', { html: true });
      });
    } })
    .transform(r);
}
