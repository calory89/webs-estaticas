// comments: _notes/kolaboro-worker-comments.txt
import { t31, loadS as loadS31 } from './kbx_n31b_page.js';
import { t27 } from './kbx_t27_i18n.js';
import { mkName } from './kbx_hdate.js';
import { trData } from './kbx_tr.js';
import { trustRender, head, crumbLd } from './kbx_trust.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const PAGE_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(corrections|buyer-cases|cite|contact|transparency-badge|faq)(\/?)$/;
export const FILE_RX = /^\/embed\/transparency\/([a-z0-9-]{1,90})\.svg$|^\/rankings\/transparency(?:\/([a-z0-9-]{2,40}))?\.csv$/;
export const PAGES = ['/corrections/', '/buyer-cases/', '/cite/', '/contact/', '/transparency-badge/', '/faq/'];
export const REVIEWED = '2026-11-13';
const BADGE_MIN = 70;
const MAIL = { hello: 'hello@kolaboro.com', founder: 'carlos@kolaboro.com', press: 'press@kolaboro.com' };
const CASES = [];
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bdi = s => '<bdi>' + esc(s) + '</bdi>';
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, a) => v && v[a] != null ? v[a] : m);
const te = (lang, k, v) => fill(esc(t27(lang, k)), v);
const tx = (lang, k, v) => fill(t27(lang, k), v);
const nf = (lang, n) => Number(n).toLocaleString(LOC[lang] || 'en-GB');
const fdt = (iso, lang) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); if (!m) return String(iso || ''); try { return new Intl.DateTimeFormat(LOC[lang] || 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))); } catch (e) { return iso.slice(0, 10); } };
const tm = (iso, lang) => '<time datetime="' + esc(iso) + '">' + esc(fdt(iso, lang)) + '</time>';
const mail = (a, subj) => '<a href="mailto:' + a + (subj ? '?subject=' + encodeURIComponent(subj) : '') + '"><bdi>' + a + '</bdi></a>';
const ul = L => '<ul>' + L.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
const links = (lang, L) => '<h2>' + esc(t27(lang, 'related')) + '</h2><ul class="k27-rel">' + L.map(([h, k]) => '<li><a href="' + h + '">' + esc(t27(lang, k)) + '</a></li>').join('') + '</ul>';
const reviewed = lang => '<p class="k-small k-muted">' + fill(esc(t27(lang, 'rev')), { d: tm(REVIEWED, lang) }) + '</p>';
const SHARED = (globalThis.__kbJson = globalThis.__kbJson || {});
async function load(env, name) {
const m = SHARED[name]; if (m && (m.a || Date.now() - m.t < 600000)) return m.v;
let r = null, a = false;
try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); a = !!(r && r.ok); } catch (e) { r = null; }
if (!r || !r.ok) r = await fetch(ORIGIN + '/data/' + name, { cf: { cacheTtl: 300, cacheEverything: true } });
if (!r.ok) throw new Error(name + ' ' + r.status);
const v = await r.json(); SHARED[name] = { t: Date.now(), v, a }; return v;
}
const eligible = ix => [...ix.rows.values()].filter(r => !r.sumba && r.score >= BADGE_MIN).sort((a, b) => b.score - a.score || a.n.localeCompare(b.n));
function corrPage(C, lang, id, SL, pg) {
const st = v => v == null ? '' : esc(t27(lang, 'st_' + v) || v);
const E = (C.entries || []).filter(e => !id || e.id === id);
const row = e => '<li><b>' + tm(e.date, lang) + '</b> · ' + (SL[e.id] ? '<a href="' + pre(lang) + '/projects/' + SL[e.id].s + '/"><bdi>' + esc(SL[e.id].n) + '</bdi></a> <span class="k-muted k-small" dir="ltr">' + esc(e.id) + '</span>' : '<bdi>' + esc(e.id) + '</bdi>') + ' · ' + esc((e.kind === 'field' || e.kind === 'removal' ? t31(lang, 'co_k_' + e.kind) : '') || t27(lang, e.kind === 'pin' ? 'co_k_pin' : 'co_k_claim')) + '<br>' +
    (e.kind === 'pin' ? esc(t27(lang, 'co_k_pin')) + ': ' + st(e.after) + '.' : e.before ? te(lang, 'co_from', { what: '<span lang="en">' + esc(e.what) + '</span>', b: st(e.before), a: st(e.after) }) : te(lang, 'co_to', { what: '<span lang="en">' + esc(e.what) + '</span>', a: st(e.after) })) + '<small lang="en">' + esc(e.why) + '</small></li>';
const A = (C.audits || []).map(a => '<p>' + te(lang, 'co_audit', { d: tm(a.date, lang), n: nf(lang, a.sample_projects), c: nf(lang, a.claims), s: nf(lang, a.supported), w: nf(lang, a.wrong), u: nf(lang, a.unchecked), r: Number(a.error_rate_pct).toLocaleString(LOC[lang] || 'en-GB'), k: nf(lang, a.claims - a.unchecked) }) + '</p><p class="k-small k-muted">' + esc(t27(lang, 'co_audit_note')) + '</p>' +
(a.method ? '<p class="k-small">' + esc(t27(lang, 'co_method')) + ' <a class="k-src" href="' + esc(a.method.replace(ORIGIN, '')) + '">' + esc(a.method.replace(ORIGIN, '').replace(/^\//, '')) + '</a></p>' : '')).join('');
const latest = (C.entries || []).reduce((m, e) => e.date > m ? e.date : m, '');
const log = id ? '<h2 id="log">' + te(lang, 'co_for', { id: bdi(id) }) + '</h2>' + (E.length ? '<ol class="k27-log">' + E.map(row).join('') + '</ol>' : '<p class="k27-empty">' + te(lang, 'co_for_none', { id: bdi(id) }) + '</p>') + '<p><a href="' + pre(lang) + '/corrections/">' + esc(t27(lang, 'co_all')) + '</a></p>'
: '<h2 id="log">' + esc(t27(lang, 'co_log_h')) + '</h2>' + (E.length ? '<p>' + te(lang, 'co_n', { n: nf(lang, E.length), d: tm(latest, lang) }) + ' <span class="k-small k-muted">' + esc(t27(lang, 'co_en')) + '</span></p><ol class="k27-log">' + E.map(row).join('') + '</ol>' : '<p class="k27-empty">' + esc(t27(lang, 'co_empty')) + '</p>');
const req = '<h2 id="request">' + esc(t27(lang, 'co_req_h')) + '</h2>' + (pg ? '<p class="k27-empty" id="prefill">' + te(lang, 'co_pg', { p: '<a href="' + esc(pg) + '" dir="ltr">' + esc('kolaboro.com' + pg) + '</a>' }) + '</p>' : '') + '<p>' + te(lang, 'co_req', { mail: mail(MAIL.hello) }) + TB.kbx_t27__t.k0 + MAIL.hello + '?subject=' + encodeURIComponent(t27(lang, 'co_req_subj') + (id ? ' ' + id : '') + (pg ? ' ' + pg : '')) + (pg ? '&body=' + encodeURIComponent(fill(t27(lang, 'co_pg_body'), { u: ORIGIN + pg })) : '') + '">' + esc(t27(lang, 'co_req_b')) + '</a></p>' +
'<h2 id="removal">' + esc(t27(lang, 'co_rm_h')) + '</h2><p>' + esc(t27(lang, 'co_rm')) + '</p><p class="k-small">' + esc(t27(lang, 'co_data')) + TB.kbx_t27__t.k1;
const body = '<div class="kpg">' + head(lang, [[t27(lang, 'co_h1'), pre(lang) + '/corrections/']], esc(t27(lang, 'co_h1')), esc(t27(lang, 'co_lead')), '<p class="k-small k-muted">' + fill(esc(t27(lang, 'upd')), { d: tm(C.updated || REVIEWED, lang) }) + '</p>') +
'<div class="k-prose">' + (id ? log + req : '<h2 id="audits">' + esc(t27(lang, 'co_audit_h')) + '</h2>' + A + log + req) +
links(lang, [[pre(lang) + '/moderation/', 'l_mod'], ['/independence/', 'l_ind'], [pre(lang) + '/contact/', 'l_contact'], [pre(lang) + '/cite/', 'l_cite']]) + '</div></div></section></div>';
const title = t27(lang, 'co_title'), desc = t27(lang, 'co_desc'), url = ORIGIN + pre(lang) + '/corrections/';
return { path: '/corrections/', title, desc, body, ttl: 600, ld: [{ '@type': 'WebPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: C.updated || REVIEWED, publisher: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' } },
{ '@type': 'Dataset', name: C.name || 'Kolaboro corrections log', description: desc, url, license: TB.kbx_t27__t.k2, dateModified: C.updated || REVIEWED, creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/data/corrections.json' }] },
crumbLd(lang, [[t27(lang, 'co_h1'), pre(lang) + '/corrections/']])] };
}
function casesPage(lang) {
const pub = CASES.length ? '<ul>' + CASES.map(c => '<li>' + esc(c.title) + '</li>').join('') + '</ul>' : '<p class="k27-empty">' + esc(t27(lang, 'bc_none')) + '</p>';
const body = '<div class="kpg">' + head(lang, [[t27(lang, 'bc_h1'), pre(lang) + '/buyer-cases/']], esc(t27(lang, 'bc_h1')), esc(t27(lang, 'bc_lead')), reviewed(lang)) +
TB.kbx_t27__t.k3 + esc(t27(lang, 'bc_pub_h')) + '</h2>' + pub + '<h2 id="shows">' + esc(t27(lang, 'bc_what_h')) + '</h2><ol>' + t27(lang, 'bc_what').map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>' +
'<h2 id="rules">' + esc(t27(lang, 'bc_rules_h')) + '</h2>' + ul(t27(lang, 'bc_rules')) + '<h2 id="share">' + esc(t27(lang, 'bc_share_h')) + '</h2><p>' + esc(t27(lang, 'bc_share')) + TB.kbx_t27__t.k4 + esc(t27(lang, 'bc_share_b')) + '</a></p>' +
links(lang, [['/buyer-reports/', 'l_rep'], [pre(lang) + '/moderation/', 'l_mod'], [pre(lang) + '/corrections/', 'l_corr']]) + '</div></div></section></div>';
const title = t27(lang, 'bc_title'), desc = t27(lang, 'bc_desc'), url = ORIGIN + pre(lang) + '/buyer-cases/';
return { path: '/buyer-cases/', title, desc, body, ld: [{ '@type': 'WebPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: REVIEWED }, crumbLd(lang, [[t27(lang, 'bc_h1'), pre(lang) + '/buyer-cases/']])] };
}
function citePage(lang, ix) {
const d = ix ? ix.updated : REVIEWED, place = ix && ix.places.get('bali') ? ix.places.get('bali').P.n : 'Bali';
const pageU = ORIGIN + pre(lang) + '/rankings/transparency/bali/', csvU = ORIGIN + '/rankings/transparency/bali.csv';
const code = s => '<code class="k27-code">' + esc(s) + '</code>';
const bib = '@misc{kolaboro_transparency_' + d.replace(/-/g, '') + TB.kbx_t27__t.k5 + d.slice(0, 4) + '},\n  url = {' + ORIGIN + TB.kbx_t27__t.k6 + d + '. Licence CC BY 4.0}\n}';
const F = [['/rankings/transparency.csv', 'ci_f_csv'], ['/rankings/transparency/bali.csv', 'ci_f_csvp'], ['/api/x/transparency', 'ci_f_api'], ['/data/corrections.json', 'ci_f_corr'], ['/docs/api/', 'ci_f_open'], [pre(lang) + '/press/places/', 'ci_f_press']];
const body = '<div class="kpg">' + head(lang, [[t27(lang, 'ci_h1'), pre(lang) + '/cite/']], esc(t27(lang, 'ci_h1')), esc(t27(lang, 'ci_lead')), reviewed(lang)) +
'<div class="k-prose"><h2 id="short">' + esc(t27(lang, 'ci_short_h')) + '</h2>' + code(tx(lang, 'ci_short', { d: fdt(d, lang) })) +
'<h2 id="page">' + esc(t27(lang, 'ci_page_h')) + '</h2>' + code(tx(lang, 'ci_page', { t: t27(lang, 'ci_page_t'), u: pageU, d: fdt(d, lang) })) +
'<h2 id="data">' + esc(t27(lang, 'ci_data_h')) + '</h2>' + code(tx(lang, 'ci_data', { p: place, u: csvU, d: fdt(d, lang) })) + '<h3>' + esc(t27(lang, 'ci_bib_h')) + '</h3><pre class="k27-code" dir="ltr">' + esc(bib) + '</pre>' +
'<h2 id="please">' + esc(t27(lang, 'ci_rules_h')) + '</h2>' + ul(t27(lang, 'ci_rules')) +
'<h2 id="files">' + esc(t27(lang, 'ci_files_h')) + '</h2><ul>' + F.map(([h, k]) => '<li><a href="' + h + '">' + esc(t27(lang, k)) + '</a> <small dir="ltr">' + esc(h) + '</small></li>').join('') + '</ul>' +
'<p>' + te(lang, 'ci_ask', { mail: mail(MAIL.press) }) + '</p>' + links(lang, [['/press/', 'l_press'], [pre(lang) + '/corrections/', 'l_corr'], [pre(lang) + '/contact/', 'l_contact']]) + '</div></div></section></div>';
const title = t27(lang, 'ci_title'), desc = t27(lang, 'ci_desc'), url = ORIGIN + pre(lang) + '/cite/';
return { path: '/cite/', title, desc, body, ld: [{ '@type': 'WebPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: REVIEWED, license: TB.kbx_t27__t.k7 }, crumbLd(lang, [[t27(lang, 'ci_h1'), pre(lang) + '/cite/']])] };
}
function contactPage(lang) {
const where = [mail(MAIL.hello), mail(MAIL.founder), mail(MAIL.press), mail(MAIL.hello, t27(lang, 'co_req_subj')), '<a href="/developers/reply/">' + esc(t27(lang, 'ct_form')) + '</a>', '<a href="/buyer-reports/">' + esc(t27(lang, 'ct_rep')) + '</a>', mail(MAIL.hello) + TB.kbx_t27__t.k8];
const th = t27(lang, 'ct_th'), rows = t27(lang, 'ct_rows');
const body = '<div class="kpg">' + head(lang, [[t27(lang, 'ct_h1'), pre(lang) + '/contact/']], esc(t27(lang, 'ct_h1')), esc(t27(lang, 'ct_lead')), reviewed(lang)) +
TB.kbx_t27__t.k9 + th.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(([w, tt], i) => '<tr><td>' + esc(w) + '</td><td>' + where[i] + '</td><td>' + esc(tt) + '</td></tr>').join('') + '</tbody></table></div>' +
'<p>' + esc(t27(lang, 'ct_note')) + '</p>' + links(lang, [[pre(lang) + '/corrections/', 'l_corr'], [pre(lang) + '/moderation/', 'l_mod'], [pre(lang) + '/cite/', 'l_cite'], ['/press/', 'l_press']]) + '</div></div></section></div>';
const title = t27(lang, 'ct_title'), desc = t27(lang, 'ct_desc'), url = ORIGIN + pre(lang) + '/contact/';
return { path: '/contact/', title, desc, body, ld: [{ '@type': 'ContactPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: REVIEWED, about: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/', email: MAIL.hello, contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer support', email: MAIL.hello }, { '@type': 'ContactPoint', contactType: 'press', email: MAIL.press }] } }, crumbLd(lang, [[t27(lang, 'ct_h1'), pre(lang) + '/contact/']])] };
}
function badgePage(lang, ix) {
const L = eligible(ix), th = t27(lang, 'bd_th');
const codeOf = r => '<a href="' + ORIGIN + '/projects/' + r.s + '/"><img src="' + ORIGIN + '/embed/transparency/' + r.s + '.svg" width="260" height="44" alt="' + t27('en', 'bd_alt') + ': ' + r.n.replace(/["<>&]/g, '') + '"></a>';
const table = L.length ? TB.kbx_t27__t.k10 + th.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + L.map(r => '<tr><td><a href="' + pre(lang) + '/projects/' + r.s + '/">' + bdi(r.n) + '</a></td><td>' + (r.dv ? bdi(r.dv) : '') + '</td><td>' + nf(lang, r.score) + TB.kbx_t27__t.k11 + r.s + '.svg" dir="ltr">' + r.s + '.svg</a></td></tr>').join('') + '</tbody></table></div>' : '<p class="k27-empty">' + esc(t27(lang, 'bd_none')) + '</p>';
const ex = L[0] ? '<p><a href="' + pre(lang) + '/projects/' + L[0].s + '/"><img src="/embed/transparency/' + L[0].s + '.svg" width="260" height="44" alt="' + esc(t27(lang, 'bd_alt')) + '" loading="lazy"></a></p><h3>' + esc(t27(lang, 'bd_code')) + TB.kbx_t27__t.k12 + esc(codeOf(L[0])) + '</code>' : '';
const body = '<div class="kpg">' + head(lang, [[t27(lang, 'bd_h1'), pre(lang) + '/transparency-badge/']], esc(t27(lang, 'bd_h1')), esc(t27(lang, 'bd_lead')), '<p class="k-small k-muted">' + fill(esc(t27(lang, 'upd')), { d: tm(ix.updated, lang) }) + '</p>') +
'<div class="k-prose">' + ex + '<h2 id="rules">' + esc(t27(lang, 'bd_rules_h')) + '</h2>' + ul(t27(lang, 'bd_rules')) + '<p><a class="k-src" href="' + pre(lang) + '/methods/transparency-score/">' + esc(t27(lang, 'bd_method')) + '</a></p>' +
'<h2 id="list">' + te(lang, 'bd_list_h', { n: nf(lang, L.length) }) + '</h2>' + table + '<h2 id="below">' + esc(t27(lang, 'bd_low_h')) + '</h2><p>' + esc(t27(lang, 'bd_low')) + TB.kbx_t27__t.k13 + esc(t27(lang, 'ct_form')) + '</a></p>' +
links(lang, [[pre(lang) + '/methods/transparency-score/', 'bd_method'], ['/independence/', 'l_ind'], [pre(lang) + '/cite/', 'l_cite']]) + '</div></div></section></div>';
const title = t27(lang, 'bd_title'), desc = t27(lang, 'bd_desc'), url = ORIGIN + pre(lang) + '/transparency-badge/';
return { path: '/transparency-badge/', title, desc, body, ld: [{ '@type': 'WebPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: ix.updated }, crumbLd(lang, [[t27(lang, 'bd_h1'), pre(lang) + '/transparency-badge/']])] };
}
function badgeSvg(score, date) {
const L = 'Kolaboro transparency', R = score == null ? 'not issued' : score + '/100 · ' + date, lw = 150, rw = score == null ? 92 : 110, w = lw + rw;
const col = score == null ? '#56636F' : '#0B6E4F';
return TB.kbx_t27__t.k14 + w + '" height="44" viewBox="0 0 ' + w + ' 44" role="img" aria-label="' + esc(L + ': ' + R) + '"><title>' + esc(L + ': ' + R) + '</title>' +
'<rect width="' + w + TB.kbx_t27__t.k15 + lw + '" width="' + rw + '" height="44" rx="8" fill="' + col + '"/><rect x="' + lw + '" width="10" height="44" fill="' + col + '"/>' +
TB.kbx_t27__s.k0 +
'<text x="' + (lw + 10) + '" y="' + (score == null ? 27 : 21) + '" font-size="' + (score == null ? 12 : 15) + '" font-weight="700">' + (score == null ? 'not issued' : score + ' / 100') + '</text>' + (score == null ? '' : '<text x="' + (lw + 10) + TB.kbx_t27__t.k16 + esc(date) + '</text>') + '</g></svg>';
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
out.push([pl.P.n, pl.P.k === 'i' ? 'island' : 'city', pl.P.cc, pl.ranked ? r['rk_' + s] : '', pl.ranked ? 'yes' : 'no', r.id, r.n, r.dv || '', r.score, r.got, r.avail, r.rv ? 'yes' : 'no', ...COMP.map(st), r.sumba ? '' : ORIGIN + '/projects/' + r.s + '/', ix.updated, ORIGIN + '/methods/transparency-score/', TB.kbx_t27__t.k17].map(csvCell).join(','));
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
function faqPage(F, lang) {
const S = F.S[lang] || F.S.en, f = (k, v) => fill(esc(S[k]), v), d = tm(F.updated, lang), pc = (k, n) => nf(lang, n ? Math.round(k / n * 100) : 0) + ' %';
const src = h => '<p class="k-small k-muted">' + esc(S.src) + ': <a class="k-src" href="' + h + '">' + esc(h.replace(/^\/(?:[a-z]{2}\/)?/, '/')) + '</a> · ' + f('asof', { d }) + '</p>';
const st = F.stats, c = F.claims, Q = [], qa = (q, a, h) => Q.push([q, a, h]);
const gv = { n: nf(lang, st.n), mk: nf(lang, st.mk), co: nf(lang, st.co), s: nf(lang, st.s), t: nf(lang, c.t), v: nf(lang, c.v), u: nf(lang, c.u), c: nf(lang, c.c) };
[['g1', '/api/open/stats'], ['g2', '/standard/'], ['g3', '/developers/benchmark/'], ['g4', '/developers/benchmark/'], ['g5', '/api/open/stats'], ['g6', pre(lang) + '/check/'], ['g7', pre(lang) + '/corrections/'], ['g8', '/data/']].forEach(([k, h]) => qa(f(k + 'q'), f(k + 'a', gv), h));
const gen = Q.length;
for (const [m, n, kp, ep, ec, ms, mv] of F.mk) { const v = { m: '<bdi>' + esc(mkName(m, lang)) + '</bdi>', n: nf(lang, n) }, h = '/data/bali-cases.json';
qa(f('aq', v), f('aa', v), h); qa(f('bq', v), f('ba', Object.assign({ k: nf(lang, kp), p: pc(kp, n) }, v)), h); qa(f('cq', v), f('ca', Object.assign({ k: nf(lang, ep), p: pc(ep, n), v: nf(lang, ec) }, v)), h); qa(f('dq', v), f('da', Object.assign({ s: nf(lang, ms), v: nf(lang, mv) }, v)), h); }
const item = ([q, a, h]) => '<details class="kfaq"><summary>' + q + '</summary><p>' + a + '</p>' + src(h) + '</details>';
const url = ORIGIN + pre(lang) + '/faq/', strip = x => x.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
const body = '<div class="kpg">' + head(lang, [[S.h1, pre(lang) + '/faq/']], esc(S.h1), esc(S.lead), '<p class="k-small k-muted">' + f('asof', { d }) + '</p>') + '<div class="k-prose"><h2 id="data">' + esc(S.h_gen) + '</h2>' + Q.slice(0, gen).map(item).join('') +
'<h2 id="markets">' + esc(S.h_mk) + '</h2>' + Q.slice(gen).map(item).join('') + links(lang, [[pre(lang) + '/corrections/', 'l_corr'], [pre(lang) + '/cite/', 'l_cite'], [pre(lang) + '/contact/', 'l_contact']]) + '</div></div></section></div>';
return { path: '/faq/', title: S.title, desc: S.desc, body, ttl: 3600, ld: [{ '@type': 'FAQPage', '@id': url + '#faq', url, name: S.title, inLanguage: lang, dateModified: F.updated, mainEntity: Q.map(([q, a]) => ({ '@type': 'Question', name: strip(q), acceptedAnswer: { '@type': 'Answer', text: strip(a) } })) }, crumbLd(lang, [[S.h1, pre(lang) + '/faq/']])] };
}
const BODY = new Map();
export async function handle(req, u, env, ctx, shell) {
try { await loadS31(env); } catch (e) {}
const f = FILE_RX.exec(u.pathname); if (f) return file(u, env, f);
const m = PAGE_RX.exec(u.pathname); if (!m || !shell) return null;
if (!m[3]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
const lang = m[1] || 'en', kind = m[2];
let pg;
try {
if (kind === 'corrections') {
const [C, NM] = await Promise.all([load(env, 'corrections.json'), load(env, 'named.json').catch(() => null)]), id = String(u.searchParams.get('id') || '').toUpperCase();
const okId = /^[A-Z]{2,5}-\d{3,4}$/.test(id) ? id : '', pp = String(u.searchParams.get('page') || ''), okPg = /^\/[a-z0-9][a-z0-9\/._-]{0,160}$/i.test(pp) && !pp.includes('..') ? pp : '';
const k = lang + '|c|' + okId + '|' + okPg + '|' + (C.updated || '') + '|' + (C.entries || []).length; pg = BODY.get(k); if (!pg) { const SL = {}; if (NM) for (const x of NM.projects || []) if ((C.entries || []).some(e => e.id === x.id)) SL[x.id] = { s: x.s, n: String(x.n || x.id).replace(/\s*\([^)]*\)\s*$/, '') }; pg = corrPage(C, lang, okId, SL, okPg); if (BODY.size > 600) BODY.clear(); BODY.set(k, pg); }
} else if (kind === 'faq') {
const F = await load(env, 'n40-faq.json'), k = lang + '|faq|' + F.updated; pg = BODY.get(k); if (!pg) { pg = faqPage(F, lang); BODY.set(k, pg); }
} else if (kind === 'transparency-badge' || kind === 'cite') {
let ix = null; try { ix = await trData(env); } catch (e) { if (kind === 'transparency-badge') return null; }
const k = lang + '|' + kind + '|' + (ix ? ix.v : ''); pg = BODY.get(k); if (!pg) { pg = kind === 'cite' ? citePage(lang, ix) : badgePage(lang, ix); if (BODY.size > 600) BODY.clear(); BODY.set(k, pg); }
} else { const k = lang + '|' + kind; pg = BODY.get(k); if (!pg) { pg = kind === 'contact' ? contactPage(lang) : casesPage(lang); BODY.set(k, pg); } }
} catch (e) { return null; }
return trustRender(lang, Object.assign({}, pg, { ld: pg.ld, body: pg.body.replace('<div class="kpg">', TB.kbx_t27__s.CSS27 + '<div class="kpg">') }), shell);
}
