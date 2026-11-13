// kolaboro.com batch 27 (agent n27t, 13 Nov 2026): trust pages and files. No model calls, nothing stored, nothing estimated:
// every line comes from a published data file or from what other pages of the site already state.
// Routes (8 languages, prefix /es /de /fr /nl /ru /zh /ar; page frame and styles of kbx_trust.js):
//   GET /corrections/[?id=ID]            dated corrections log and accuracy checks, from /data/corrections.json (one source, also
//                                        for machines: the same file is the corrections record of the open data)
//   GET /buyer-cases/                    structure for real buyer cases; empty until a real case with written permission exists
//   GET /cite/                           how to cite Kolaboro (credit lines, files, BibTeX, CC BY 4.0)
//   GET /contact/                        every address with the response time the site already publishes for it
//   GET /transparency-badge/             projects with a transparency score of 70 or more, with their embed code
//   GET /embed/transparency/<slug>.svg   the badge: current score and data date, linked to the project page by the embed code;
//                                        "not issued" below 70 (status 404), never for Sumba or excluded projects
//   GET /rankings/transparency.csv       every place of the transparency ranking, one row per project and place (CC BY 4.0)
//   GET /rankings/transparency/<place>.csv   one place
// Static fallback: if a data file cannot be read, /corrections/ falls through to the static page.
import { t27 } from './kbx_t27_i18n.js';
import { trData } from './kbx_tr.js';
import { trustRender, head, crumbLd } from './kbx_trust.js';

const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const PAGE_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(corrections|buyer-cases|cite|contact|transparency-badge)(\/?)$/;
export const FILE_RX = /^\/embed\/transparency\/([a-z0-9-]{1,90})\.svg$|^\/rankings\/transparency(?:\/([a-z0-9-]{2,40}))?\.csv$/;
export const PAGES = ['/corrections/', '/buyer-cases/', '/cite/', '/contact/', '/transparency-badge/'];
export const REVIEWED = '2026-11-13';
const BADGE_MIN = 70;
const MAIL = { hello: 'hello@kolaboro.com', founder: 'carlos@kolaboro.com', press: 'press@kolaboro.com' };
// Real buyer cases only, each with the buyer's written permission on file. Empty until one exists: never add an example.
const CASES = [];
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bdi = s => '<bdi>' + esc(s) + '</bdi>';
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, a) => v && v[a] != null ? v[a] : m);
const te = (lang, k, v) => fill(esc(t27(lang, k)), v);   // template escaped, values already HTML
const tx = (lang, k, v) => fill(t27(lang, k), v);
const nf = (lang, n) => Number(n).toLocaleString(LOC[lang] || 'en-GB');
const fdt = (iso, lang) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); if (!m) return String(iso || ''); try { return new Intl.DateTimeFormat(LOC[lang] || 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))); } catch (e) { return iso.slice(0, 10); } };
const tm = (iso, lang) => '<time datetime="' + esc(iso) + '">' + esc(fdt(iso, lang)) + '</time>';
const mail = (a, subj) => '<a href="mailto:' + a + (subj ? '?subject=' + encodeURIComponent(subj) : '') + '"><bdi>' + a + '</bdi></a>';
const ul = L => '<ul>' + L.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
const links = (lang, L) => '<h2>' + esc(t27(lang, 'related')) + '</h2><ul>' + L.map(([h, k]) => '<li><a href="' + h + '">' + esc(t27(lang, k)) + '</a></li>').join('') + '</ul>';
const reviewed = lang => '<p class="k-small k-muted">' + fill(esc(t27(lang, 'rev')), { d: tm(REVIEWED, lang) }) + '</p>';
const CSS27 = '<style id="k27-css">.k27-tw{overflow-x:auto;border:1px solid var(--k-line);border-radius:var(--k-r-md,10px);background:var(--k-surface);margin:var(--k-4,16px) 0}.k27-tw table{width:100%;min-width:560px;border-collapse:collapse}.k27-tw th,.k27-tw td{padding:10px 12px;text-align:start;vertical-align:top;border-bottom:1px solid var(--k-line)}.k27-tw th{font-size:var(--k-fs-xs,13px);font-weight:600}' +
  '.k27-log{list-style:none;padding:0!important}.k27-log li{padding:12px 0;border-bottom:1px solid var(--k-line);margin:0!important}.k27-log small{display:block;color:var(--k-muted)}.k27-code{display:block;white-space:pre-wrap;overflow-wrap:anywhere;background:var(--k-sunken);border-radius:var(--k-r-sm,6px);padding:var(--k-3,12px);font-size:var(--k-fs-xs,13px)}' +
  '.k27-empty{border:1px dashed var(--k-line-2);border-radius:var(--k-r-md,10px);padding:var(--k-4,16px)}@media (max-width:640px){.k27-tw table{min-width:0}.k27-tw thead{display:none}.k27-tw tr{display:block;border-bottom:1px solid var(--k-line);padding:8px 0}.k27-tw td{display:block;border:0;padding:4px 12px}}</style>';

// ------------------------------------------------------------------------------------------------ data
const SHARED = (globalThis.__kbJson = globalThis.__kbJson || {});
async function load(env, name) {   // same shared parse cache as kbx_tr.js / kbx_trust.js
  const m = SHARED[name]; if (m && (m.a || Date.now() - m.t < 600000)) return m.v;
  let r = null, a = false;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); a = !!(r && r.ok); } catch (e) { r = null; }
  if (!r || !r.ok) r = await fetch(ORIGIN + '/data/' + name, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!r.ok) throw new Error(name + ' ' + r.status);
  const v = await r.json(); SHARED[name] = { t: Date.now(), v, a }; return v;
}
const eligible = ix => [...ix.rows.values()].filter(r => !r.sumba && r.score >= BADGE_MIN).sort((a, b) => b.score - a.score || a.n.localeCompare(b.n));

// ------------------------------------------------------------------------------------------------ pages
function corrPage(C, lang, id, SL) {
  const st = v => v == null ? '' : esc(t27(lang, 'st_' + v) || v);
  const E = (C.entries || []).filter(e => !id || e.id === id);
  const row = e => '<li><b>' + tm(e.date, lang) + '</b> · ' + (SL[e.id] ? '<a href="' + pre(lang) + '/projects/' + SL[e.id].s + '/"><bdi>' + esc(SL[e.id].n) + '</bdi></a> <small class="k-muted" dir="ltr">' + esc(e.id) + '</small>' : '<bdi>' + esc(e.id) + '</bdi>') + ' · ' + esc(t27(lang, e.kind === 'pin' ? 'co_k_pin' : 'co_k_claim')) + '<br>' +
    (e.kind === 'pin' ? esc(t27(lang, 'co_k_pin')) + ': ' + st(e.after) + '.' : e.before ? te(lang, 'co_from', { what: '<span lang="en">' + esc(e.what) + '</span>', b: st(e.before), a: st(e.after) }) : te(lang, 'co_to', { what: '<span lang="en">' + esc(e.what) + '</span>', a: st(e.after) })) + '<small lang="en">' + esc(e.why) + '</small></li>';
  const A = (C.audits || []).map(a => '<p>' + te(lang, 'co_audit', { d: tm(a.date, lang), n: nf(lang, a.sample_projects), c: nf(lang, a.claims), s: nf(lang, a.supported), w: nf(lang, a.wrong), u: nf(lang, a.unchecked), r: Number(a.error_rate_pct).toLocaleString(LOC[lang] || 'en-GB'), k: nf(lang, a.claims - a.unchecked) }) + '</p><p class="k-small k-muted">' + esc(t27(lang, 'co_audit_note')) + '</p>' +
    (a.method ? '<p class="k-small">' + esc(t27(lang, 'co_method')) + ' <a class="k-src" href="' + esc(a.method.replace(ORIGIN, '')) + '">' + esc(a.method.replace(ORIGIN, '').replace(/^\//, '')) + '</a></p>' : '')).join('');
  const latest = (C.entries || []).reduce((m, e) => e.date > m ? e.date : m, '');
  const log = id ? '<h2 id="log">' + te(lang, 'co_for', { id: bdi(id) }) + '</h2>' + (E.length ? '<ol class="k27-log">' + E.map(row).join('') + '</ol>' : '<p class="k27-empty">' + te(lang, 'co_for_none', { id: bdi(id) }) + '</p>') + '<p><a href="' + pre(lang) + '/corrections/">' + esc(t27(lang, 'co_all')) + '</a></p>'
    : '<h2 id="log">' + esc(t27(lang, 'co_log_h')) + '</h2>' + (E.length ? '<p>' + te(lang, 'co_n', { n: nf(lang, E.length), d: tm(latest, lang) }) + ' <span class="k-small k-muted">' + esc(t27(lang, 'co_en')) + '</span></p><ol class="k27-log">' + E.map(row).join('') + '</ol>' : '<p class="k27-empty">' + esc(t27(lang, 'co_empty')) + '</p>');
  const req = '<h2 id="request">' + esc(t27(lang, 'co_req_h')) + '</h2><p>' + te(lang, 'co_req', { mail: mail(MAIL.hello) }) + '</p><p><a class="k-btn k-btn--line" href="mailto:' + MAIL.hello + '?subject=' + encodeURIComponent(t27(lang, 'co_req_subj') + (id ? ' ' + id : '')) + '">' + esc(t27(lang, 'co_req_b')) + '</a></p>' +
    '<h2 id="removal">' + esc(t27(lang, 'co_rm_h')) + '</h2><p>' + esc(t27(lang, 'co_rm')) + '</p><p class="k-small">' + esc(t27(lang, 'co_data')) + ' <a class="k-src" href="/data/corrections.json">/data/corrections.json</a></p>';
  const body = '<div class="kpg">' + head(lang, [[t27(lang, 'co_h1'), pre(lang) + '/corrections/']], esc(t27(lang, 'co_h1')), esc(t27(lang, 'co_lead')), '<p class="k-small k-muted">' + fill(esc(t27(lang, 'upd')), { d: tm(C.updated || REVIEWED, lang) }) + '</p>') +
    '<div class="k-prose">' + (id ? log + req : '<h2 id="audits">' + esc(t27(lang, 'co_audit_h')) + '</h2>' + A + log + req) +
    links(lang, [[pre(lang) + '/moderation/', 'l_mod'], ['/independence/', 'l_ind'], [pre(lang) + '/contact/', 'l_contact'], [pre(lang) + '/cite/', 'l_cite']]) + '</div></div></section></div>';
  const title = t27(lang, 'co_title'), desc = t27(lang, 'co_desc'), url = ORIGIN + pre(lang) + '/corrections/';
  return { path: '/corrections/', title, desc, body, ttl: 600, ld: [{ '@type': 'WebPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: C.updated || REVIEWED, publisher: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'Dataset', name: C.name || 'Kolaboro corrections log', description: desc, url, license: 'https://creativecommons.org/licenses/by/4.0/', dateModified: C.updated || REVIEWED, creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/data/corrections.json' }] },
    crumbLd(lang, [[t27(lang, 'co_h1'), pre(lang) + '/corrections/']])] };
}
function casesPage(lang) {
  const pub = CASES.length ? '<ul>' + CASES.map(c => '<li>' + esc(c.title) + '</li>').join('') + '</ul>' : '<p class="k27-empty">' + esc(t27(lang, 'bc_none')) + '</p>';
  const body = '<div class="kpg">' + head(lang, [[t27(lang, 'bc_h1'), pre(lang) + '/buyer-cases/']], esc(t27(lang, 'bc_h1')), esc(t27(lang, 'bc_lead')), reviewed(lang)) +
    '<div class="k-prose"><h2 id="published">' + esc(t27(lang, 'bc_pub_h')) + '</h2>' + pub + '<h2 id="shows">' + esc(t27(lang, 'bc_what_h')) + '</h2><ol>' + t27(lang, 'bc_what').map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>' +
    '<h2 id="rules">' + esc(t27(lang, 'bc_rules_h')) + '</h2>' + ul(t27(lang, 'bc_rules')) + '<h2 id="share">' + esc(t27(lang, 'bc_share_h')) + '</h2><p>' + esc(t27(lang, 'bc_share')) + '</p><p><a class="k-btn k-btn--line" href="/buyer-reports/">' + esc(t27(lang, 'bc_share_b')) + '</a></p>' +
    links(lang, [['/buyer-reports/', 'l_rep'], [pre(lang) + '/moderation/', 'l_mod'], [pre(lang) + '/corrections/', 'l_corr']]) + '</div></div></section></div>';
  const title = t27(lang, 'bc_title'), desc = t27(lang, 'bc_desc'), url = ORIGIN + pre(lang) + '/buyer-cases/';
  return { path: '/buyer-cases/', title, desc, body, ld: [{ '@type': 'WebPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: REVIEWED }, crumbLd(lang, [[t27(lang, 'bc_h1'), pre(lang) + '/buyer-cases/']])] };
}
function citePage(lang, ix) {
  const d = ix ? ix.updated : REVIEWED, place = ix && ix.places.get('bali') ? ix.places.get('bali').P.n : 'Bali';
  const pageU = ORIGIN + pre(lang) + '/rankings/transparency/bali/', csvU = ORIGIN + '/rankings/transparency/bali.csv';
  const code = s => '<code class="k27-code">' + esc(s) + '</code>';
  const bib = '@misc{kolaboro_transparency_' + d.replace(/-/g, '') + ',\n  author = {{Kolaboro}},\n  title = {Transparency ranking of off-plan projects},\n  year = {' + d.slice(0, 4) + '},\n  url = {' + ORIGIN + '/rankings/transparency/},\n  note = {Data as of ' + d + '. Licence CC BY 4.0}\n}';
  const F = [['/rankings/transparency.csv', 'ci_f_csv'], ['/rankings/transparency/bali.csv', 'ci_f_csvp'], ['/api/x/transparency', 'ci_f_api'], ['/data/corrections.json', 'ci_f_corr'], ['/docs/api/', 'ci_f_open'], [pre(lang) + '/press/places/', 'ci_f_press']];
  const body = '<div class="kpg">' + head(lang, [[t27(lang, 'ci_h1'), pre(lang) + '/cite/']], esc(t27(lang, 'ci_h1')), esc(t27(lang, 'ci_lead')), reviewed(lang)) +
    '<div class="k-prose"><h2 id="short">' + esc(t27(lang, 'ci_short_h')) + '</h2>' + code(tx(lang, 'ci_short', { d: fdt(d, lang) })) +
    '<h2 id="page">' + esc(t27(lang, 'ci_page_h')) + '</h2>' + code(tx(lang, 'ci_page', { t: t27(lang, 'ci_page_t'), u: pageU, d: fdt(d, lang) })) +
    '<h2 id="data">' + esc(t27(lang, 'ci_data_h')) + '</h2>' + code(tx(lang, 'ci_data', { p: place, u: csvU, d: fdt(d, lang) })) + '<h3>' + esc(t27(lang, 'ci_bib_h')) + '</h3><pre class="k27-code" dir="ltr">' + esc(bib) + '</pre>' +
    '<h2 id="please">' + esc(t27(lang, 'ci_rules_h')) + '</h2>' + ul(t27(lang, 'ci_rules')) +
    '<h2 id="files">' + esc(t27(lang, 'ci_files_h')) + '</h2><ul>' + F.map(([h, k]) => '<li><a href="' + h + '">' + esc(t27(lang, k)) + '</a> <small dir="ltr">' + esc(h) + '</small></li>').join('') + '</ul>' +
    '<p>' + te(lang, 'ci_ask', { mail: mail(MAIL.press) }) + '</p>' + links(lang, [['/press/', 'l_press'], [pre(lang) + '/corrections/', 'l_corr'], [pre(lang) + '/contact/', 'l_contact']]) + '</div></div></section></div>';
  const title = t27(lang, 'ci_title'), desc = t27(lang, 'ci_desc'), url = ORIGIN + pre(lang) + '/cite/';
  return { path: '/cite/', title, desc, body, ld: [{ '@type': 'WebPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: REVIEWED, license: 'https://creativecommons.org/licenses/by/4.0/' }, crumbLd(lang, [[t27(lang, 'ci_h1'), pre(lang) + '/cite/']])] };
}
function contactPage(lang) {
  const where = [mail(MAIL.hello), mail(MAIL.founder), mail(MAIL.press), mail(MAIL.hello, t27(lang, 'co_req_subj')), '<a href="/developers/reply/">' + esc(t27(lang, 'ct_form')) + '</a>', '<a href="/buyer-reports/">' + esc(t27(lang, 'ct_rep')) + '</a>', mail(MAIL.hello) + ' · <a href="/.well-known/security.txt">security.txt</a>'];
  const th = t27(lang, 'ct_th'), rows = t27(lang, 'ct_rows');
  const body = '<div class="kpg">' + head(lang, [[t27(lang, 'ct_h1'), pre(lang) + '/contact/']], esc(t27(lang, 'ct_h1')), esc(t27(lang, 'ct_lead')), reviewed(lang)) +
    '<div class="k-prose"><div class="k27-tw"><table><thead><tr>' + th.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(([w, tt], i) => '<tr><td>' + esc(w) + '</td><td>' + where[i] + '</td><td>' + esc(tt) + '</td></tr>').join('') + '</tbody></table></div>' +
    '<p>' + esc(t27(lang, 'ct_note')) + '</p>' + links(lang, [[pre(lang) + '/corrections/', 'l_corr'], [pre(lang) + '/moderation/', 'l_mod'], [pre(lang) + '/cite/', 'l_cite'], ['/press/', 'l_press']]) + '</div></div></section></div>';
  const title = t27(lang, 'ct_title'), desc = t27(lang, 'ct_desc'), url = ORIGIN + pre(lang) + '/contact/';
  return { path: '/contact/', title, desc, body, ld: [{ '@type': 'ContactPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: REVIEWED, about: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/', email: MAIL.hello, contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer support', email: MAIL.hello }, { '@type': 'ContactPoint', contactType: 'press', email: MAIL.press }] } }, crumbLd(lang, [[t27(lang, 'ct_h1'), pre(lang) + '/contact/']])] };
}
function badgePage(lang, ix) {
  const L = eligible(ix), th = t27(lang, 'bd_th');
  const codeOf = r => '<a href="' + ORIGIN + '/projects/' + r.s + '/"><img src="' + ORIGIN + '/embed/transparency/' + r.s + '.svg" width="260" height="44" alt="' + t27('en', 'bd_alt') + ': ' + r.n.replace(/["<>&]/g, '') + '"></a>';
  // one embed code, shown for the first project; every row links its own badge image (same code with that project's slug)
  const table = L.length ? '<div class="k27-tw"><table><thead><tr>' + th.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + L.map(r => '<tr><td><a href="' + pre(lang) + '/projects/' + r.s + '/">' + bdi(r.n) + '</a></td><td>' + (r.dv ? bdi(r.dv) : '') + '</td><td>' + nf(lang, r.score) + '</td><td><a href="/embed/transparency/' + r.s + '.svg" dir="ltr">' + r.s + '.svg</a></td></tr>').join('') + '</tbody></table></div>' : '<p class="k27-empty">' + esc(t27(lang, 'bd_none')) + '</p>';
  const ex = L[0] ? '<p><a href="' + pre(lang) + '/projects/' + L[0].s + '/"><img src="/embed/transparency/' + L[0].s + '.svg" width="260" height="44" alt="' + esc(t27(lang, 'bd_alt')) + '" loading="lazy"></a></p><h3>' + esc(t27(lang, 'bd_code')) + '</h3><code class="k27-code" dir="ltr">' + esc(codeOf(L[0])) + '</code>' : '';
  const body = '<div class="kpg">' + head(lang, [[t27(lang, 'bd_h1'), pre(lang) + '/transparency-badge/']], esc(t27(lang, 'bd_h1')), esc(t27(lang, 'bd_lead')), '<p class="k-small k-muted">' + fill(esc(t27(lang, 'upd')), { d: tm(ix.updated, lang) }) + '</p>') +
    '<div class="k-prose">' + ex + '<h2 id="rules">' + esc(t27(lang, 'bd_rules_h')) + '</h2>' + ul(t27(lang, 'bd_rules')) + '<p><a class="k-src" href="' + pre(lang) + '/methods/transparency-score/">' + esc(t27(lang, 'bd_method')) + '</a></p>' +
    '<h2 id="list">' + te(lang, 'bd_list_h', { n: nf(lang, L.length) }) + '</h2>' + table + '<h2 id="below">' + esc(t27(lang, 'bd_low_h')) + '</h2><p>' + esc(t27(lang, 'bd_low')) + '</p><p><a class="k-btn k-btn--line" href="/developers/reply/">' + esc(t27(lang, 'ct_form')) + '</a></p>' +
    links(lang, [[pre(lang) + '/methods/transparency-score/', 'bd_method'], ['/independence/', 'l_ind'], [pre(lang) + '/cite/', 'l_cite']]) + '</div></div></section></div>';
  const title = t27(lang, 'bd_title'), desc = t27(lang, 'bd_desc'), url = ORIGIN + pre(lang) + '/transparency-badge/';
  return { path: '/transparency-badge/', title, desc, body, ld: [{ '@type': 'WebPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: ix.updated }, crumbLd(lang, [[t27(lang, 'bd_h1'), pre(lang) + '/transparency-badge/']])] };
}

// ------------------------------------------------------------------------------------------------ files
function badgeSvg(score, date) {
  const L = 'Kolaboro transparency', R = score == null ? 'not issued' : score + '/100 · ' + date, lw = 150, rw = score == null ? 92 : 110, w = lw + rw;
  const col = score == null ? '#56636F' : '#0B6E4F';
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="44" viewBox="0 0 ' + w + ' 44" role="img" aria-label="' + esc(L + ': ' + R) + '"><title>' + esc(L + ': ' + R) + '</title>' +
    '<rect width="' + w + '" height="44" rx="8" fill="#17212B"/><rect x="' + lw + '" width="' + rw + '" height="44" rx="8" fill="' + col + '"/><rect x="' + lw + '" width="10" height="44" fill="' + col + '"/>' +
    '<g font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" fill="#fff"><text x="12" y="19" font-size="12" font-weight="700">Kolaboro</text><text x="12" y="34" font-size="11" opacity=".85">transparency score</text>' +
    '<text x="' + (lw + 10) + '" y="' + (score == null ? 27 : 21) + '" font-size="' + (score == null ? 12 : 15) + '" font-weight="700">' + (score == null ? 'not issued' : score + ' / 100') + '</text>' + (score == null ? '' : '<text x="' + (lw + 10) + '" y="36" font-size="10" opacity=".85">data ' + esc(date) + '</text>') + '</g></svg>';
}
const csvCell = v => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) || /^[=+\-@]/.test(s) ? '"' + (/^[=+\-@]/.test(s) ? "'" : '') + s.replace(/"/g, '""') + '"' : s; };
const COMP = ['legal', 'register', 'permit', 'permitreg', 'date', 'record', 'deposit', 'location', 'web', 'notices', 'price'];
function csv(ix, slug) {
  const H = ['place', 'place_kind', 'country_iso', 'rank', 'ranked_place', 'project_id', 'project', 'developer', 'transparency_score', 'points', 'points_available', 'reviewed_by_kolaboro', ...COMP.map(k => k + '_status'), 'page', 'data_as_of', 'method', 'licence'];
  const out = [H.join(',')];
  for (const [s, pl] of ix.places) {
    if (slug && s !== slug) continue;
    for (const r of pl.L) {
      const st = k => { const q = r.comp[k]; return q.st === 'yes' ? 'yes' : q.st === 'part' ? 'partly' : q.st === 'no' ? 'not published' : 'not checked'; };
      out.push([pl.P.n, pl.P.k === 'i' ? 'island' : 'city', pl.P.cc, pl.ranked ? r['rk_' + s] : '', pl.ranked ? 'yes' : 'no', r.id, r.n, r.dv || '', r.score, r.got, r.avail, r.rv ? 'yes' : 'no', ...COMP.map(st), r.sumba ? '' : ORIGIN + '/projects/' + r.s + '/', ix.updated, ORIGIN + '/methods/transparency-score/', 'CC BY 4.0, credit: Kolaboro (kolaboro.com)'].map(csvCell).join(','));
    }
  }
  return out.join('\r\n') + '\r\n';
}
async function file(u, env, m) {
  let ix; try { ix = await trData(env); } catch (e) { return new Response('Not ready', { status: 503, headers: { 'cache-control': 'no-store' } }); }
  if (m[1] !== undefined && m[1] !== null && /\.svg$/.test(u.pathname)) {
    const r = [...ix.rows.values()].find(x => x.s === m[1] && !x.sumba);
    const ok = r && r.score >= BADGE_MIN;
    return new Response(badgeSvg(ok ? r.score : null, ix.updated), { status: ok ? 200 : 404, headers: { 'content-type': 'image/svg+xml; charset=utf-8', 'cache-control': 'public, max-age=3600', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'" } });
  }
  const slug = m[2] || null;
  if (slug && !ix.places.has(slug)) return new Response('Unknown place', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  return new Response('﻿' + csv(ix, slug), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'inline; filename="kolaboro-transparency-' + (slug || 'all') + '-' + ix.updated + '.csv"', 'cache-control': 'public, max-age=600', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff', link: '<https://creativecommons.org/licenses/by/4.0/>; rel="license"' } });
}

// ------------------------------------------------------------------------------------------------ entry
const BODY = new Map();
export async function handle(req, u, env, ctx, shell) {
  const f = FILE_RX.exec(u.pathname); if (f) return file(u, env, f);
  const m = PAGE_RX.exec(u.pathname); if (!m || !shell) return null;
  if (!m[3]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
  const lang = m[1] || 'en', kind = m[2];
  let pg;
  try {
    if (kind === 'corrections') {
      const [C, NM] = await Promise.all([load(env, 'corrections.json'), load(env, 'named.json').catch(() => null)]), id = String(u.searchParams.get('id') || '').toUpperCase();
      const okId = /^[A-Z]{2,5}-\d{3,4}$/.test(id) ? id : '';
      const k = lang + '|c|' + okId + '|' + (C.updated || '') + '|' + (C.entries || []).length; pg = BODY.get(k); if (!pg) { const SL = {}; if (NM) for (const x of NM.projects || []) if ((C.entries || []).some(e => e.id === x.id)) SL[x.id] = { s: x.s, n: String(x.n || x.id).replace(/\s*\([^)]*\)\s*$/, '') }; pg = corrPage(C, lang, okId, SL); if (BODY.size > 600) BODY.clear(); BODY.set(k, pg); }
    } else if (kind === 'transparency-badge' || kind === 'cite') {
      let ix = null; try { ix = await trData(env); } catch (e) { if (kind === 'transparency-badge') return null; }
      const k = lang + '|' + kind + '|' + (ix ? ix.v : ''); pg = BODY.get(k); if (!pg) { pg = kind === 'cite' ? citePage(lang, ix) : badgePage(lang, ix); if (BODY.size > 600) BODY.clear(); BODY.set(k, pg); }
    } else { const k = lang + '|' + kind; pg = BODY.get(k); if (!pg) { pg = kind === 'contact' ? contactPage(lang) : casesPage(lang); BODY.set(k, pg); } }
  } catch (e) { return null; }   // a data file did not load: the static page (if any) answers
  return trustRender(lang, Object.assign({}, pg, { ld: pg.ld, body: pg.body.replace('<div class="kpg">', CSS27 + '<div class="kpg">') }), shell);
}
