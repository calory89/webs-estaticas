// kolaboro.com batch 21 (agent n21c, 11 Nov 2026): can you legally short-let there? No model calls, nothing stored about visitors.
//   A rules table per jurisdiction: licence or registration, caps or zones, night limits, rules of the building or its owners.
//   Only what the official source we read says, each cell linked to that source with the date of the law or page and the date we
//   read it. "Not stated in the sources we read" and "Not checked yet" are shown as such. Facts and questions to ask, no advice.
//   Data: /data/short-let-rules.json (one file; rule summaries in 8 languages, sources, Inside Airbnb dataset -> rule sets).
// Shown: next to the short-let figures on named project pages (kbx_money.js calls rulesHtml), and as a page:
//   GET /guides/short-let-rules/ (+ /<lang>/)   the whole table in 8 languages
//   GET /api/x/short-let-rules                  the data file with a short description (public JSON)
import { TB } from './kbx_strings.js';   // n32w: string tables loaded as static JSON (worker size limit)
const ORIGIN = 'https://kolaboro.com';
export const PAGE_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?guides\/short-let-rules(\/?)$/;
export const PATHS = /^\/api\/x\/short-let-rules\/?$/;
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CELLS = ['reg', 'cap', 'stay', 'own'];

let MEMO = null;
export async function rulesData(env) {
  if (MEMO && Date.now() - MEMO.t < 600000) return MEMO.v;
  let r = null; const path = '/data/short-let-rules.json';
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + path)); } catch (e) { r = null; }
  if (!r || !r.ok) { try { r = await fetch(ORIGIN + path + '?v=' + Math.floor(Date.now() / 600000), { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
  const v = r && r.ok ? await r.json().catch(() => null) : null;
  MEMO = { t: Date.now(), v }; return v;
}

const S = TB.kbx_rules_S /* n32w (19 Nov 2026): table moved to /data/i18n/kbx_rules.json, filled by kbx_strings.js before any kolaboro.com request is handled */;
const t = (l, k) => (S[l] && S[l][k] != null ? S[l][k] : S.en[k]);
const fdt = (d, l) => { if (!d) return ''; try { return new Date(d + 'T00:00:00Z').toLocaleDateString(LOC[l] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return d; } };
const ltr = s => '<bdi dir="ltr">' + esc(s) + '</bdi>';

// which rule sets apply to a named project: the Inside Airbnb dataset of its short-let figures first, else its market, else its country
export function rulesFor(rd, x, ds) {
  if (!rd || !rd.rules || !x) return [];
  const ids = (ds && rd.by_dataset && rd.by_dataset[ds]) || (rd.by_market && rd.by_market[x.mk]) || (rd.by_country && rd.by_country[x.co]) || [];
  return ids.filter(i => rd.rules[i]);
}
function srcMark(rd, id, lang) {
  const s = rd.sources && rd.sources[id]; if (!s) return '';
  const pub = String(s.n).split(',')[0], when = s.d ? String(t(lang, 'dk')[s.dk || 'page'] || '{d}').replace('{d}', s.dk === 'edition' ? s.d.slice(0, 4) : fdt(s.d, lang)) : String(t(lang, 'read')).replace('{d}', fdt(s.read, lang));
  return '<a class="k-src" href="' + esc(s.u) + '" rel="noopener" target="_blank"><span>' + ltr(pub) + ', ' + esc(when) + '</span></a>';
}
function cellHtml(rd, c, lang) {
  if (!c || c.s === 'nc') return '<span class="k-muted">' + esc(t(lang, 'nc')) + '</span>';
  if (c.s === 'nf') return '<span class="k-muted">' + esc(t(lang, 'nf')) + '</span>';
  if (c.s === 'up') return '<span class="k-muted">' + esc(t(lang, 'up')) + '</span>';
  const txt = (c.t && (c.t[lang] || c.t.en)) || '';
  return '<div class="ksr-c"><span class="ksr-t">' + esc(txt) + '</span>' + (c.q ? ' <q class="ksr-q" lang="' + esc(c.q.l) + '" dir="ltr">' + esc(c.q.t) + '</q>' : '') + ' ' + (c.src || []).map(i => srcMark(rd, i, lang)).join(' ') + '</div>';
}
function tableHtml(rd, ids, lang, quotes) {
  const cols = t(lang, 'cols');
  return '<div class="k-table-wrap ksr-tw"><table class="k-table k-table--dense k-table--stack ksr"><thead><tr>' + cols.map(c => '<th scope="col">' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' +
    ids.map(i => { const j = rd.rules[i]; return '<tr id="r-' + esc(i) + '"><th scope="row" data-label="' + esc(cols[0]) + '">' + ltr(j.name) + '</th>' + CELLS.map((c, n) => '<td data-label="' + esc(cols[n + 1]) + '">' + cellHtml(rd, quotes ? j[c] : Object.assign({}, j[c], { q: null }), lang) + '</td>').join('') + '</tr>'; }).join('') + '</tbody></table></div>';
}
export const RULES_CSS = '.ksr-tw{margin:12px 0;overflow-x:auto}.ksr th[scope=row]{min-width:6.5em;font-weight:600}.ksr td{min-width:9.5em;vertical-align:top;font-size:var(--k-fs-sm,15px)}.ksr .k-src{display:flex;white-space:normal;margin-top:4px;width:fit-content;max-width:100%}.ksr-t{display:block}.ksr-q{display:block;margin:4px 0;color:var(--k-muted,var(--muted));font-size:var(--k-fs-xs,13px);unicode-bidi:isolate}' +
  '@media (max-width:640px){.ksr td,.ksr th[scope=row]{min-width:0}.ksr.k-table--stack td{display:block;text-align:start;padding:6px 0}.ksr.k-table--stack td::before{display:block;margin-bottom:2px;font-size:var(--k-fs-xs,13px)}.ksr.k-table--stack th[scope=row]{display:block;padding:2px 0 4px;font-size:var(--k-fs-md,17px);text-align:start}}';

// block for the named project page ('' when no rule set covers the project)
export function rulesHtml(rd, x, lang, ds) {
  const ids = rulesFor(rd, x, ds); if (!ids.length) return '';
  return '<h3 id="short-let-rules">' + esc(t(lang, 'h')) + '</h3><p class="kfact k-small">' + esc(t(lang, 'lead')) + '</p>' + tableHtml(rd, ids, lang, false) +
    '<p class="k-small"><a href="' + pre(lang) + '/guides/short-let-rules/">' + esc(t(lang, 'all')) + '</a></p>';
}
// plain data for the JSON API of a project (/api/x/money/<ID>)
export function rulesJson(rd, x, ds) {
  const ids = rulesFor(rd, x, ds); if (!ids.length) return null;
  return { page: ORIGIN + '/guides/short-let-rules/', read: rd.updated, note: rd.note, rules: ids.map(i => { const j = rd.rules[i], o = { id: i, place: j.name }; for (const c of CELLS) o[c] = { status: j[c].s, text: j[c].t ? j[c].t.en : null, sources: (j[c].src || []).map(s => rd.sources[s]) }; return o; }) };
}

// ------------------------------------------------------------------------------------------------ page /guides/short-let-rules/
const PG_CSS = '<style>' + RULES_CSS + '.ksr-pg h2{margin-top:var(--k-6,32px)}.ksr-pg ul,.ksr-pg ol{padding-inline-start:1.2em}.ksr-pg li{margin:6px 0}.ksr-src li{overflow-wrap:anywhere}.ksr-pg .k-table-wrap{max-width:100%}</style>';
export function pageBody(rd, lang) {   // exported for the local test
  const order = ['uk-lon', 'uk-eng', 'uk-sco', 'ie-dub', 'de-be', 'fr', 'es-an', 'es-ib', 'es-vc', 'es', 'pt', 'gr-ath', 'gr-the', 'gr', 'tr', 'ae-du', 'ca-bc', 'ca-to', 'us-nyc', 'us-nash', 'us-aus', 'us-fl', 'us-nv', 'us-hi', 'th', 'lv-riga', 'ke-nbo'].filter(i => rd.rules[i]);
  for (const i of Object.keys(rd.rules)) if (!order.includes(i)) order.push(i);
  const used = new Set(); for (const i of order) for (const c of CELLS) for (const s of (rd.rules[i][c].src || [])) used.add(s);
  const srcs = Object.keys(rd.sources).filter(k => used.has(k)).map(k => { const s = rd.sources[k]; return '<li><a href="' + esc(s.u) + '" rel="noopener" target="_blank">' + ltr(s.n) + '</a> <span class="k-muted">' + (s.d ? esc(String(t(lang, 'dk')[s.dk || 'page']).replace('{d}', s.dk === 'edition' ? s.d.slice(0, 4) : fdt(s.d, lang))) + ', ' : '') + esc(String(t(lang, 'read')).replace('{d}', fdt(s.read, lang))) + '</span></li>'; }).join('');
  const nr = t(lang, 'p_not'), nots = (rd.not_read || []).map(n => '<li>' + ltr(n.place) + ': ' + esc(nr[n.place] || n.why) + '</li>').join('');
  return '<div class="ksr-pg"><section class="k-sec"><div class="k-wrap"><div class="k-phead"><p class="k-crumb"><a href="' + pre(lang) + '/">Kolaboro</a> / ' + esc(t(lang, 'crumb')) + '</p><h1>' + esc(t(lang, 'p_title')) + '</h1><p class="lead">' + esc(t(lang, 'p_lead')) + '</p>' +
    '<p class="k-small k-muted">' + esc(String(t(lang, 'p_upd')).replace('{d}', fdt(rd.updated, lang))) + '</p></div>' +
    '<h2>' + esc(t(lang, 'p_how_h')) + '</h2><ul>' + t(lang, 'p_how').map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>' +
    '<h2 id="rules">' + esc(t(lang, 'p_t_h')) + '</h2>' + tableHtml(rd, order, lang, true) +
    '<h2>' + esc(t(lang, 'p_q_h')) + '</h2><ol>' + t(lang, 'p_q').map(s => '<li>' + esc(s) + '</li>').join('') + '</ol>' +
    '<h2 id="sources">' + esc(t(lang, 'p_src_h')) + '</h2><p>' + esc(t(lang, 'p_src_d')) + '</p><ul class="ksr-src">' + srcs + '</ul>' +
    (nots ? '<h2>' + esc(t(lang, 'p_not_h')) + '</h2><ul>' + nots + '</ul>' : '') +
    '<h2>' + esc(t(lang, 'p_where')) + '</h2><p>' + esc(t(lang, 'p_where_t')) + ' <a href="' + pre(lang) + '/projects/">kolaboro.com/projects</a></p>' +
    '<p class="k-small"><a class="k-src" href="/api/x/short-let-rules">' + esc(t(lang, 'p_json')) + '</a> <a class="k-src" href="/data/short-let-rules.json">/data/short-let-rules.json</a> <span class="k-muted">' + esc(t(lang, 'p_lic')) + '</span></p></div></section></div>';
}
export async function page(req, u, env, ctx, shell) {
  const m = u.pathname.match(PAGE_RX); if (!m || !shell) return null;
  if (!m[2]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
  const lang = m[1] || 'en', path = '/guides/short-let-rules/', url = ORIGIN + pre(lang) + path;
  const rd = await rulesData(env); if (!rd || !rd.rules) return null;
  const sh = await shell(pre(lang) + '/how-we-score/');
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': url + '#page', url, name: t(lang, 'p_title'), description: t(lang, 'p_desc'), inLanguage: lang, dateModified: rd.updated, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'Dataset', name: t(lang, 'p_title'), description: t(lang, 'p_desc'), url, isAccessibleForFree: true, dateModified: rd.updated, license: 'https://creativecommons.org/licenses/by/4.0/', creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/data/short-let-rules.json' }] },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + pre(lang) + '/' }, { '@type': 'ListItem', position: 2, name: t(lang, 'p_title'), item: url }] }] };
  const alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + path + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + path + '">';
  const tags = '<title>' + esc(t(lang, 'p_title')) + ' | Kolaboro</title><meta name="description" content="' + esc(t(lang, 'p_desc')) + '"><link rel="canonical" href="' + url + '">' + alts +
    '<meta property="og:type" content="article"><meta property="og:site_name" content="Kolaboro"><meta property="og:title" content="' + esc(t(lang, 'p_title')) + ' | Kolaboro"><meta property="og:description" content="' + esc(t(lang, 'p_desc')) + '"><meta property="og:url" content="' + url + '"><meta name="twitter:card" content="summary">' +
    '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' + PG_CSS;
  const body = pageBody(rd, lang);
  const res = new HTMLRewriter()
    .on('html', { element(e) { e.setAttribute('lang', lang); if (lang === 'ar') e.setAttribute('dir', 'rtl'); else e.removeAttribute('dir'); } })
    .on('title', { element(e) { e.remove(); } })
    .on('meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
    .on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(body, { html: true }); } })
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + path); } })
    .transform(new Response(sh.body, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
  return new Response(await res.text(), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600' } });
}

// ------------------------------------------------------------------------------------------------ JSON API
export async function handle(req, u, env) {
  const H = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=600', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' };
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response(JSON.stringify({ error: 'method' }), { status: 405, headers: Object.assign({}, H, { 'cache-control': 'no-store' }) });
  const rd = await rulesData(env);
  if (!rd) return new Response(JSON.stringify({ error: 'not_built_yet' }), { status: 503, headers: Object.assign({}, H, { 'cache-control': 'no-store' }) });
  return new Response(JSON.stringify(Object.assign({ page: ORIGIN + '/guides/short-let-rules/', per_project: ORIGIN + '/api/x/money/<ID> (field short_let_rules)' }, rd), null, 1), { headers: H });
}
