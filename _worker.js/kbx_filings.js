// kolaboro.com batch 21 (agent n21c, 11 Nov 2026): official filings of developers that are listed companies. No model calls.
//   For developers whose published name matches a listed company exactly (legal-form endings such as PJSC, PLC, PCL, S.A., Inc.
//   aside), the developer page shows the exchange, the ticker and a link to the official place where the company files its
//   accounts and announcements (the exchange or the securities regulator), plus, for companies that file with the US SEC, the
//   form and date of the latest annual report from the SEC EDGAR open API. No share prices, no advice, no verdicts.
//   Sources: Wikidata (CC0) for exchange and ticker, SEC EDGAR (public domain) for US filers. Subsidiaries with another name are
//   not matched. Data: /data/listed-developers.json (one file, built by hand-checked script; see "method" inside the file).
// Routes:
//   GET /api/x/filings            every matched developer (public JSON)
//   GET /api/x/filings?dev=<slug> one developer
import { finRtHtml, loadT as n31cT } from './kbx_n31c.js';
import { TB } from './kbx_strings.js';   // n31c (items 129, 130)
const ORIGIN = 'https://kolaboro.com';
export const PATHS = /^\/api\/x\/filings\/?$/;
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ltr = s => '<bdi dir="ltr">' + esc(s) + '</bdi>';
const fdt = (d, l) => { if (!d) return ''; try { return new Date(d + 'T00:00:00Z').toLocaleDateString(LOC[l] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return d; } };

let MEMO = null;
export async function filingsData(env) {
  await n31cT(env).catch(() => {});   // n31c strings for the results and ratings lines
  if (MEMO && Date.now() - MEMO.t < 600000) return MEMO.v;
  let r = null; const path = '/data/listed-developers.json';
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + path)); } catch (e) { r = null; }
  if (!r || !r.ok) { try { r = await fetch(ORIGIN + path + '?v=' + Math.floor(Date.now() / 600000), { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
  const v = r && r.ok ? await r.json().catch(() => null) : null;
  MEMO = { t: Date.now(), v }; return v;
}

const S = TB.kbx_filings_S /* n40 k5: in /data/i18n/kbx_filings.json */;
const t = (l, k) => (S[l] && S[l][k] != null ? S[l][k] : S.en[k]);
export const filingsHeading = lang => t(lang, 'h');
const FIL_CSS = '.kfi-tw{margin:12px 0;max-width:760px;overflow-x:auto}.kfi-tw td,.kfi-tw th{vertical-align:top}.kfi-tw .k-src{white-space:normal}.kfi{overflow-wrap:anywhere}';
const okUrl = u => /^https:\/\/[a-z0-9.-]+\//i.test(String(u || ''));

// section body for the developer page ('' when the developer is not matched to a listed company)
export function filingsDevHtml(fd, slug, lang) {
  const d = fd && fd.developers && fd.developers[slug]; if (!d || !(d.l || []).length) return '';
  const EX = fd.exchanges || {}, th = t(lang, 'th');
  const rows = d.l.map(l => { const e = EX[l.x] || {}; const link = okUrl(l.u) ? '<a class="k-src" href="' + esc(l.u) + '" rel="noopener nofollow" target="_blank">' + esc(t(lang, 'fil')) + '</a>' : okUrl(e.u) ? '<a class="k-src" href="' + esc(e.u) + '" rel="noopener nofollow" target="_blank">' + esc(t(lang, 'exhome')) + '</a>' : '-';
    return '<tr><th scope="row" data-label="' + esc(th[0]) + '">' + ltr(e.n || l.x) + '</th><td data-label="' + esc(th[1]) + '">' + (l.t ? '<b>' + ltr(l.t) + '</b>' : '-') + '</td><td data-label="' + esc(th[2]) + '">' + link + '</td></tr>'; }).join('');
  let h = '<style>' + FIL_CSS + '</style><div class="kfi"><p class="kfact">' + esc(t(lang, 'intro')).replace('{co}', ltr(d.co)) + '</p>' +
    '<div class="k-table-wrap kfi-tw"><table class="k-table k-table--dense k-table--stack"><thead><tr>' + th.map(x => '<th scope="col">' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  const L = [];
  if (d.annual && d.cik) L.push(esc(t(lang, 'annual')).replace('{form}', ltr(d.annual.form)).replace('{d}', esc(fdt(d.annual.filed, lang))).replace('{p}', esc(fdt(d.annual.period, lang))) +
    ' <a class="k-src" href="https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&amp;CIK=' + esc(d.cik) + '&amp;type=' + esc(d.annual.form) + '" rel="noopener nofollow" target="_blank">' + esc(t(lang, 'annual_l')) + '</a>');
  if (d.lei) L.push(esc(t(lang, 'lei')) + ': ' + ltr(d.lei) + ' <a class="k-src" href="https://search.gleif.org/#/record/' + esc(d.lei) + '" rel="noopener" target="_blank">search.gleif.org</a>');
  if (d.q) L.push(esc(t(lang, 'src_wd')) + ' <a class="k-src" href="https://www.wikidata.org/wiki/' + esc(d.q) + '" rel="noopener" target="_blank">Wikidata ' + esc(d.q) + '</a>');
  if (d.src && fd.sources && fd.sources[d.src] && okUrl(fd.sources[d.src].url)) L.push(esc(t(lang, 'src_list')) + ' <a class="k-src" href="' + esc(fd.sources[d.src].url) + '" rel="noopener nofollow" target="_blank">' + ltr(fd.sources[d.src].name) + '</a>');
  if (d.cik) L.push(esc(t(lang, 'src_sec')) + ' <a class="k-src" href="https://data.sec.gov/submissions/CIK' + esc(String(d.cik).padStart(10, '0')) + '.json" rel="noopener nofollow" target="_blank">SEC EDGAR, CIK ' + esc(d.cik) + '</a>');
  const FR31 = finRtHtml(d, lang);   // n31c: latest results and credit ratings as the company announced them
  if (L.length || FR31) h += '<ul class="fl">' + L.map(s => '<li class="kfact">' + s + '</li>').join('') + FR31 + '</ul>';
  h += '<p class="k-small k-muted">' + esc(t(lang, 'cav')) + '</p><p class="k-small"><a class="k-src" href="/api/x/filings?dev=' + esc(slug) + '">' + esc(t(lang, 'json')) + '</a> <span class="k-muted">' + esc(String(t(lang, 'upd')).replace('{d}', fdt(fd.updated, lang))) + '</span></p></div>';
  return h;
}

// ------------------------------------------------------------------------------------------------ JSON API
export async function handle(req, u, env) {
  const H = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=600', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' };
  const out = (o, s) => new Response(JSON.stringify(o, null, 1), { status: s || 200, headers: s && s >= 400 ? Object.assign({}, H, { 'cache-control': 'no-store' }) : H });
  if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: 'method' }, 405);
  const fd = await filingsData(env); if (!fd) return out({ error: 'not_built_yet' }, 503);
  const s = (u.searchParams.get('dev') || '').toLowerCase();
  if (s) {
    if (!/^[a-z0-9-]{1,90}$/.test(s)) return out({ error: 'bad_dev' }, 400);
    const d = (fd.developers || {})[s];
    if (!d) return out({ dev: s, listed_match: false, note: 'No exact-name match to a listed company in our sources. This is not a finding: the developer may be private, listed under another name, or a subsidiary of a listed group.', updated: fd.updated }, 404);
    return out({ dev: s, url: ORIGIN + '/developers/' + s + '/#filings', listed_match: true, updated: fd.updated, company: d.co, wikidata: d.q || null, lei: d.lei || null, sec_cik: d.cik || null,
      listings: d.l.map(l => ({ exchange: (fd.exchanges[l.x] || {}).n || l.x, ticker: l.t || null, filings: l.u || (fd.exchanges[l.x] || {}).u || null })), latest_annual_report_sec: d.annual || null, results_as_published: d.fin || null, credit_ratings_as_announced: d.rt || null, sources: fd.sources });
  }
  return out(Object.assign({ per_developer: ORIGIN + '/api/x/filings?dev=<slug>' }, fd));
}
