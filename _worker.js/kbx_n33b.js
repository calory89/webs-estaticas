// kolaboro.com batch 33 (agent n33b, 20 Nov 2026): authority items. No model calls, nothing stored, nothing estimated.
// Strings live in /_s/kolaboro.com/data/n33b-i18n.json (loaded once per isolate), not in the worker.
// Routes (8 languages, prefix /es /de /fr /nl /ru /zh /ar):
//   GET /reports/transparency/              monthly transparency ranking by market, latest edition (item 97: same URL every month)
//   GET /reports/transparency/<YYYY-MM>/    one edition, frozen (data/transparency-monthly/<YYYY-MM>.json, written on the first run of the
//                                           month by the Kolaboro delay index workflow; 2026-11 frozen by hand on 20 Nov 2026)
//   GET /reports/transparency[/<YYYY-MM>].csv   the same edition as CSV (CC BY 4.0)
//   GET /transparency-badge/developers/     developers whose every tracked project makes all 6 buyer checks public (item 98)
//   GET /embed/transparency/developer/<slug>.svg   their badge, linked to /developers/<slug>/ by the embed code; "not issued" (404) otherwise
// cite(): appends a "How to cite this page" block (text with link, BibTeX, licence) to report pages that have none (item 93)
import { trData } from './kbx_tr.js';
import { trustRender, head, crumbLd } from './kbx_trust.js';

const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const FIRST = '2026-11';
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:reports\/transparency(?:\/20\d\d-[01]\d)?|transparency-badge\/developers)\/?$|^\/reports\/transparency(?:\/20\d\d-[01]\d)?\.csv$|^\/embed\/transparency\/developer\/[a-z0-9-]{1,90}\.svg$/;
// report pages that get a citation block when they carry none (pages with id="cite" or id="how-to-cite" are left as they are)
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

// ------------------------------------------------------------------------------------------------ data
const SHARED = (globalThis.__kbJson = globalThis.__kbJson || {});
async function json(env, name, ttl) {   // name relative to /data/; same shared parse cache as kbx_t27.js / kbx_tr.js
  const m = SHARED[name]; if (m && Date.now() - m.t < (m.a ? 3600000 : ttl || 600000)) return m.v;
  let r = null, a = false;
  try { r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); a = !!(r && r.ok); } catch (e) { r = null; }
  if (!r || !r.ok) { try { r = await fetch(ORIGIN + '/data/' + name, { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
  const v = r && r.ok ? await r.json() : null;
  SHARED[name] = { t: Date.now(), v, a: a && v != null }; return v;
}
function months(now) {   // every month from the first edition to this one
  const L = []; let [y, m] = FIRST.split('-').map(Number); const ey = now.getUTCFullYear(), em = now.getUTCMonth() + 1;
  while (y < ey || (y === ey && m <= em)) { L.push(y + '-' + String(m).padStart(2, '0')); m++; if (m > 12) { m = 1; y++; } }
  return L;
}
async function editions(env) {
  const L = months(new Date()), got = await Promise.all(L.map(ym => json(env, 'transparency-monthly/' + ym + '.json', 3600000)));
  return L.map((ym, i) => got[i] && got[i].markets ? got[i] : null).filter(Boolean);
}
function withChange(E, ed) {   // index points against the edition before it
  const i = E.indexOf(ed), prev = i > 0 ? E[i - 1] : null, P = new Map(((prev && prev.markets) || []).map(r => [r.market, r]));
  return { prev, rows: ed.markets.map(r => Object.assign({}, r, { chg: prev ? (P.has(r.market) ? r.transparency_index - P.get(r.market).transparency_index : null) : undefined })) };
}

// ------------------------------------------------------------------------------------------------ item 97: monthly report
const CSS = '<style id="n33b-css">.n3t-w{overflow-x:auto;border:1px solid var(--k-line);border-radius:var(--k-r-md,10px);background:var(--k-surface);margin:16px 0}.n3t-w table{width:100%;min-width:640px;border-collapse:collapse}.n3t-w th,.n3t-w td{padding:9px 10px;text-align:start;vertical-align:top;border-bottom:1px solid var(--k-line)}.n3t-w th{font-size:var(--k-fs-xs,13px)}.n3t-w td.n{font-variant-numeric:tabular-nums;white-space:nowrap}.n3t-up{color:var(--k-ok,#0B7A55)}.n3t-dn{color:var(--k-bad,#B4321B)}.n3t-k{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:16px 0}.n3t-k div{border:1px solid var(--k-line);border-radius:10px;padding:12px;background:var(--k-surface)}.n3t-k b{display:block;font-size:1.5rem}.n3t-code{display:block;white-space:pre-wrap;overflow-wrap:anywhere;background:var(--k-sunken);border-radius:6px;padding:12px;font-size:13px}.n3t-l a{display:inline-block;padding:10px 0;min-height:44px}@media (max-width:640px){.n3t-w table{min-width:0}.n3t-w thead{display:none}.n3t-w tr{display:block;border-bottom:1px solid var(--k-line);padding:6px 0}.n3t-w td{display:block;border:0;padding:3px 12px}.n3t-w td[data-l]::before{content:attr(data-l) ": ";color:var(--k-muted)}}</style>';
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
  const arch = '<ul class="n3t-l">' + E.slice().reverse().map((e, i) => '<li><a href="' + pre(lang) + BASE + e.edition + '/">' + esc(mon(e.edition, lang)) + '</a>' + (i === 0 ? ' (' + esc(t(lang, 'r_latest')) + ')' : '') + ' · <a href="/reports/transparency/' + e.edition + '.csv" dir="ltr">CSV</a> · <a href="/data/transparency-monthly/' + e.edition + '.json" dir="ltr">JSON</a></li>').join('') + '</ul>';
  const url = ORIGIN + pre(lang) + path, title = t(lang, 'r_title', { m: M }), h1 = t(lang, 'r_h1', { m: M });
  const bib = '@misc{kolaboro_transparency_markets_' + ed.edition.replace('-', '') + ',\n  author = {{Kolaboro}},\n  title = {Off-plan transparency ranking by market, ' + mon(ed.edition, 'en') + '},\n  year = {' + ed.edition.slice(0, 4) + '},\n  url = {' + ORIGIN + BASE + ed.edition + '/},\n  note = {Data as of ' + ed.data_as_of + '. Licence CC BY 4.0}\n}';
  const body = '<div class="kpg">' + head(lang, [[t(lang, 'r_cr_rep'), pre(lang) + '/reports/'], [t(lang, 'r_cr'), pre(lang) + BASE]], esc(h1), esc(t(lang, 'r_lead')),
      '<p class="k-small k-muted">' + esc(t(lang, 'r_asof', { m: M, d: dt(ed.data_as_of, lang), f: dt(ed.frozen || ed.data_as_of, lang) })) + '</p>') +
    '<div class="k-prose">' + keys +
    '<div class="n3t-w"><table><thead><tr>' + cols.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(tr).join('') + '</tbody></table></div>' +
    '<p class="k-small k-muted">' + esc(prev ? t(lang, 'r_chg', { p: mon(prev.edition, lang) }) : t(lang, 'r_first')) + ' ' + esc(t(lang, 'r_small')) + '</p>' +
    '<h2 id="method">' + esc(t(lang, 'r_method_h')) + '</h2><p>' + esc(t(lang, 'r_method')) + '</p><p>' + esc(t(lang, 'r_limit')) + '</p>' +
    '<p>' + esc(t(lang, 'r_live')) + ' <a href="/transparency-index/">' + esc(t(lang, 'r_live_a')) + '</a> · <a href="' + pre(lang) + '/how-we-score/">/how-we-score/</a></p>' +
    '<h2 id="download">' + esc(t(lang, 'r_dl_h')) + '</h2><ul class="n3t-l"><li><a href="' + fileBase + '.csv" dir="ltr">' + esc(fileBase) + '.csv</a></li><li><a href="/data/transparency-monthly/' + ed.edition + '.json" dir="ltr">/data/transparency-monthly/' + ed.edition + '.json</a> <small dir="ltr">sha256 ' + esc(String((ed.source || {}).sha256 || '').slice(0, 16)) + '</small></li></ul>' +
    '<h2 id="cite">' + esc(t(lang, 'c_h')) + '</h2><p>' + esc(t(lang, 'c_lic')) + '</p><code class="n3t-code">Kolaboro, "Off-plan transparency ranking by market, ' + esc(mon(ed.edition, 'en')) + '", <a href="' + ORIGIN + BASE + ed.edition + '/">' + ORIGIN + BASE + ed.edition + '/</a>, data as of ' + esc(ed.data_as_of) + '. CC BY 4.0.</code>' +
    '<details><summary>BibTeX</summary><pre class="n3t-code" dir="ltr">' + esc(bib) + '</pre></details><p><a href="' + pre(lang) + '/cite/">' + esc(t(lang, 'c_more')) + '</a></p>' +
    '<h2 id="editions">' + esc(t(lang, 'r_arch_h')) + '</h2>' + arch + '</div></div></section></div>';
  const ld = [{ '@type': 'Dataset', '@id': ORIGIN + BASE + ed.edition + '/#dataset', name: 'Off-plan transparency ranking by market, ' + mon(ed.edition, 'en'), description: t('en', 'r_desc', { n: rows.length }), url: ORIGIN + BASE + ed.edition + '/',
      inLanguage: 'en', license: 'https://creativecommons.org/licenses/by/4.0/', creator: { '@type': 'Organization', '@id': ORIGIN + '/#org', name: 'Kolaboro', url: ORIGIN + '/' }, temporalCoverage: ed.edition, dateModified: ed.data_as_of, version: ed.edition,
      isBasedOn: ORIGIN + '/data/bali-cases.json', distribution: [{ '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: ORIGIN + '/reports/transparency/' + ed.edition + '.csv' }, { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/data/transparency-monthly/' + ed.edition + '.json' }] },
    { '@type': 'WebPage', '@id': url + '#page', url, name: title, inLanguage: lang, dateModified: ed.data_as_of }, crumbLd(lang, [[t(lang, 'r_cr_rep'), pre(lang) + '/reports/'], [t(lang, 'r_cr'), pre(lang) + BASE]])];
  return { path, title, desc: t(lang, 'r_desc', { n: rows.length }), body, ld, ttl: 900 };
}
const csvCell = v => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) || /^[=+\-@]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s) ? '"' + (/^[=+@]/.test(s) ? "'" : '') + s.replace(/"/g, '""') + '"' : s; };
function csv(E, ed) {
  const { rows } = withChange(E, ed), H = ['edition', 'rank', 'market', 'country', 'projects', 'transparency_index', 'change_vs_previous_edition', 'avg_public_checks_of_6', 'avg_confirmed_checks_of_6', 'permit_public_pct', 'deposit_protection_pct', 'all_six_public', 'with_flags', 'data_as_of', 'page', 'licence'];
  return [H.join(',')].concat(rows.map(r => [ed.edition, r.rank, r.market, r.country, r.projects, r.transparency_index, r.chg == null ? '' : r.chg, r.avg_checks, r.avg_confirmed, r.permit_public_pct, r.deposit_protection_pct, r.all_six_public, r.with_flags, ed.data_as_of, ORIGIN + BASE + ed.edition + '/', 'CC BY 4.0, credit: Kolaboro (kolaboro.com)'].map(csvCell).join(','))).join('\r\n') + '\r\n';
}

// ------------------------------------------------------------------------------------------------ item 98: developer badge (6 of 6 buyer checks public on every tracked project)
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
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="44" viewBox="0 0 ' + w + ' 44" role="img" aria-label="' + esc(L + ': ' + R) + '"><title>' + esc(L + ': ' + R + (n == null ? '' : ', data ' + date)) + '</title>' +
    '<rect width="' + w + '" height="44" rx="8" fill="#17212B"/><rect x="' + lw + '" width="' + rw + '" height="44" rx="8" fill="' + col + '"/><rect x="' + lw + '" width="10" height="44" fill="' + col + '"/>' +
    '<g font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" fill="#fff"><text x="12" y="19" font-size="12" font-weight="700">Kolaboro</text><text x="12" y="34" font-size="11" opacity=".85">buyer checks public</text>' +
    '<text x="' + (lw + 10) + '" y="' + (n == null ? 27 : 21) + '" font-size="' + (n == null ? 12 : 14) + '" font-weight="700">' + (n == null ? 'not issued' : esc(R)) + '</text>' + (n == null ? '' : '<text x="' + (lw + 10) + '" y="36" font-size="10" opacity=".85">data ' + esc(date) + '</text>') + '</g></svg>';
}
const codeOf = d => '<a href="' + ORIGIN + '/developers/' + d.s + '/"><img src="' + ORIGIN + '/embed/transparency/developer/' + d.s + '.svg" height="44" alt="Kolaboro: ' + String(d.n).replace(/["<>&]/g, '') + ', 6 of 6 buyer checks public"></a>';
function devPage(lang, D) {
  const P = '/transparency-badge/developers/', L = D.L, th = t(lang, 'b_th');
  const table = L.length ? '<div class="n3t-w"><table><thead><tr>' + th.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' +
    L.map(d => '<tr><td data-l="' + esc(th[0]) + '"><a href="' + pre(lang) + '/developers/' + d.s + '/"><bdi>' + esc(d.n) + '</bdi></a></td><td class="n" data-l="' + esc(th[1]) + '">' + nf(lang, d.P.length) + '</td><td data-l="' + esc(th[2]) + '"><a href="/embed/transparency/developer/' + d.s + '.svg" dir="ltr">' + d.s + '.svg</a></td></tr>').join('') + '</tbody></table></div>' : '<p>' + esc(t(lang, 'b_none')) + '</p>';
  const ex = L[0] ? '<p><a href="' + pre(lang) + '/developers/' + L[0].s + '/"><img src="/embed/transparency/developer/' + L[0].s + '.svg" height="44" alt="' + esc('Kolaboro: ' + L[0].n) + '" loading="lazy"></a></p><h3>' + esc(t(lang, 'b_code')) + '</h3><code class="n3t-code" dir="ltr">' + esc(codeOf(L[0])) + '</code>' : '';
  const body = '<div class="kpg">' + head(lang, [[t(lang, 'b_cr'), '/developers/'], [t(lang, 'b_title'), pre(lang) + P]], esc(t(lang, 'b_title')), esc(t(lang, 'b_lead')), '<p class="k-small k-muted">' + esc(t(lang, 'upd', { d: dt(D.updated, lang) })) + '</p>') +
    '<div class="k-prose">' + ex + '<h2 id="rules">' + esc(t(lang, 'b_rules_h')) + '</h2><ul>' + t(lang, 'b_rules').map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
    '<h2 id="list">' + esc(t(lang, 'b_list_h', { n: nf(lang, L.length) })) + '</h2>' + table +
    '<h2 id="more">' + esc(t(lang, 'b_more_h')) + '</h2><p>' + esc(t(lang, 'b_more')) + '</p><p><a class="k-btn k-btn--line" href="/developers/reply/">' + esc(t(lang, 'b_reply')) + '</a></p>' +
    '<ul class="n3t-l"><li><a href="' + pre(lang) + '/transparency-badge/">' + esc(t(lang, 'b_proj')) + '</a></li><li><a href="' + pre(lang) + '/how-we-score/">/how-we-score/</a></li></ul></div></div></section></div>';
  const title = t(lang, 'b_title'), url = ORIGIN + pre(lang) + P;
  return { path: P, title, desc: t(lang, 'b_desc'), body, ld: [{ '@type': 'WebPage', '@id': url + '#page', url, name: title, description: t(lang, 'b_desc'), inLanguage: lang, dateModified: D.updated }, crumbLd(lang, [[t(lang, 'b_title'), pre(lang) + P]])], ttl: 900 };
}

// ------------------------------------------------------------------------------------------------ entry
const SVGH = { 'content-type': 'image/svg+xml; charset=utf-8', 'cache-control': 'public, max-age=3600', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'" };
const BODY = new Map();
export async function handle(req, u, env, ctx, shell) {
  const p = u.pathname;
  let m = /^\/embed\/transparency\/developer\/([a-z0-9-]{1,90})\.svg$/.exec(p);
  if (m) { let D; try { D = await devData(env); } catch (e) { return new Response('Not ready', { status: 503, headers: { 'cache-control': 'no-store' } }); }
    const d = D.set.get(m[1]); return new Response(devSvg(d ? d.P.length : null, D.updated), { status: d ? 200 : 404, headers: SVGH }); }
  m = /^\/reports\/transparency(?:\/(20\d\d-[01]\d))?\.csv$/.exec(p);
  if (m) { const E = await editions(env), ed = m[1] ? E.find(e => e.edition === m[1]) : E[E.length - 1];
    if (!ed) return new Response('Unknown edition', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
    return new Response('﻿' + csv(E, ed), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'inline; filename="kolaboro-transparency-by-market-' + ed.edition + '.csv"', 'cache-control': 'public, max-age=900', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff', link: '<https://creativecommons.org/licenses/by/4.0/>; rel="license"' } }); }
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
      if (m[3] && ed === last) { pg = reportPage(lang, E, ed, true); pg = Object.assign({}, pg, { path: BASE }); }   // the latest edition's own URL: canonical is the fixed URL
      else { const k = lang + '|r|' + ed.edition + '|' + E.length + '|' + !m[3]; pg = BODY.get(k); if (!pg) { pg = reportPage(lang, E, ed, !m[3]); BODY.set(k, pg); } }
    }
  } catch (e) { return null; }
  if (BODY.size > 400) BODY.clear();
  return trustRender(lang, Object.assign({}, pg, { body: pg.body.replace('<div class="kpg">', CSS + '<div class="kpg">') }), shell);
}

// n40 k6 (R04-17): copy buttons for the plain credit line and an APA reference (date in the page language)
const apa40 = (lang, ti, url, d) => { let ds = d; try { ds = d.slice(0, 4) + ', ' + new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : LOC[lang] || 'en-GB', { month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z')); } catch (e) {} return 'Kolaboro. (' + ds + '). ' + ti + '. ' + url; };
const CB40JS = "document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-c40]');if(!b)return;var x=b.getAttribute('data-c40'),o=b.parentNode.querySelector('.c40-ok'),f=function(){if(o)o.textContent=b.getAttribute('data-ok')};if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(x).then(f,function(){prompt('',x)});else prompt('',x)});";
const cb40 = (lang, plain, apa, nc) => { const bs = 'min-height:44px;padding:8px 14px;margin:0 8px 8px 0;border:1px solid var(--line,#c9c9c9);border-radius:8px;background:transparent;color:inherit;font:inherit;cursor:pointer';
  return '<p class="c40" style="display:flex;flex-wrap:wrap;align-items:center;margin:8px 0">' + (plain ? '<button type="button" style="' + bs + '" data-c40="' + esc(plain) + '" data-ok="' + esc(t(lang, 'c_ok')) + '">' + esc(t(lang, 'c_cp')) + '</button>' : '') +
    '<button type="button" style="' + bs + '" data-c40="' + esc(apa) + '" data-ok="' + esc(t(lang, 'c_ok')) + '">' + esc(t(lang, 'c_apa')) + '</button><span class="c40-ok" role="status" aria-live="polite"></span></p><script nonce="' + esc(nc) + '">' + CB40JS + '</script>'; };

// ------------------------------------------------------------------------------------------------ item 93: "How to cite this page" on report pages
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
