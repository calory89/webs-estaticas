// kolaboro.com batch 29 (agent n29i, 14 Nov 2026): international search and chat assistants. No model calls, nothing stored, nothing
// estimated: every figure is computed at the edge from the published data files (/data/named.json, bali-cases.json, promises.json and
// the transparency index of kbx_tr.js), dated with the data date.
//   item 89  GET /[<lang>/]guides/buyers-from/<russia|china|gulf>/  what changes with the buyer's nationality in Dubai, Bali,
//                                           Phuket and Cyprus (official texts, dated), the four places compared from our data
//   item 88  GET /<lang>/m/<market>/        the market file in es fr de nl ru zh ar (before: English only, these URLs were a 301 to /m/).
//                                           Only markets with 5+ named projects (anti-thin rule); smaller ones keep the 301 to English.
//                                           The English /m/<market>/ gets the hreflang alternates (index.js, mAlternates).
//            GET /m/sitemap.xml             every translated market file with its English page, hreflang and the real lastmod
//   item 93/95  hubInject: on hubs without a Q&A block, a table of key figures under the page heading and 3 to 4 questions answered
//                from the data at the end (FAQPage JSON-LD only for those questions): /projects/, /rankings/transparency/, /handover/,
//                /handover/overdue/ (8 languages)
//   item 97  GET /answers/questions.md|json  about 800 questions people ask about off-plan projects, each answered from our data with
//                                           the page that shows the facts and the data date (markets, countries and developers with
//                                           5+ named projects only)
// Conflict of interest: Sumba projects are never named (kbx_named.js data() drops them); Eco Beach City and Equinox never appear.
import { TB } from './kbx_strings.js';   // n32w: string tables loaded as static JSON (worker size limit)
import { data as namedData, handoverOf, overdueOf, OV_MIN, lastmod, esc, pre, fd } from './kbx_named.js';
import { trData } from './kbx_tr.js';
import { TR_PLACES, inPlace } from './kbx_tr_places.js';
import { BUY_PLACES } from './kbx_buy_i18n.js';
import { mkName, placeName, coName, hdisp, hyear } from './kbx_hdate.js';

const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const MIN_MK = 5;
const CO_AL = { 'Puerto Rico (USA)': 'Puerto Rico', 'St Lucia': 'Saint Lucia', 'United States': 'USA', 'United Arab Emirates': 'UAE' };   // same country names as the country hubs (kbx_seo.js)
export const PAGE_RX = /^\/(es|de|fr|nl|ru|zh|ar)\/m\/([^/.]{2,60})(\/?)$/;
export const PATHS = /^\/(?:es|de|fr|nl|ru|zh|ar)\/(?:countries|rankings)(?:\/[a-z0-9-]{2,60})?\/?$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?guides\/buyers-from(?:\/(?:russia|china|gulf))?\/?$|^\/(?:es|de|fr|nl|ru|zh|ar)\/m\/[^/.]{2,60}\/?$|^\/m\/sitemap\.xml$|^\/answers\/questions\.(?:md|json)$/;
const slugM = m => encodeURIComponent(String(m).toLowerCase().replace(/\s+/g, '-'));
const slugA = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const bdi = s => '<bdi>' + esc(s) + '</bdi>';
// k15 (26 Nov 2026): area text in the page language when /data/i18n/kbx_n29i.json AR holds it; English wording we hold no translation for keeps lang="en"
const ENW = /\b(the|near|of|and|side|shore|highway|next|area|phase|west|east|north|south|labels|page|parcel|urban|listing|road|street|lake|beach|airport|behind|opposite|between|along|axis)\b/i;
const arCell = (a, lang) => lang === 'en' ? bdi(a) : '<bdi>' + String(a).split(', ').map(k => { const h = TB.kbx_n29i_AR[k] && TB.kbx_n29i_AR[k][lang]; if (h) return esc(h); const m = mkName(k, lang); return m === k && ENW.test(k) ? '<span lang="en">' + esc(k) + '</span>' : esc(m); }).join(', ') + '</bdi>';
const nf = (lang, n) => Number(n).toLocaleString(LOC[lang] || 'en-GB');
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const med = a => { const s = a.filter(v => v != null).sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : Math.round((s[s.length / 2 - 1] + s[s.length / 2]) / 2)) : null; };

// ------------------------------------------------------------------------------------------------ words (8 languages)
const T = TB.kbx_n29i_T /* n32w (19 Nov 2026): table moved to /data/i18n/kbx_n29i.json, filled by kbx_strings.js before any kolaboro.com request is handled */;
const t = (lang, k, v) => { let s = (T[lang] && T[lang][k] != null) ? T[lang][k] : T.en[k]; if (Array.isArray(s)) return s; if (v) s = String(s).replace(/\{(\w+)\}/g, (m, a) => v[a] != null ? v[a] : m); return s.replace(/\.\.(?=\s|$)/g, '.'); };   // "2026 г.."
const th = (lang, k, v) => { const e = {}; for (const a in (v || {})) e[a] = v[a] && v[a].__html ? v[a].__html : esc(v[a]); return t(lang, k, e); };   // template with escaped values; {__html} values pass as HTML
const H = s => ({ __html: s });

// ------------------------------------------------------------------------------------------------ data
let MD = null;
async function mdata(env) {
  const [ix, tri] = await Promise.all([namedData(env), trData(env).catch(() => null)]);
  if (MD && MD.ix === ix && MD.tri === tri && MD.day === new Date().toISOString().slice(0, 10)) return MD;
  const g = new Map();
  for (const x of ix.P) { if (!g.has(x.mk)) g.set(x.mk, []); g.get(x.mk).push(x); }
  const score = id => { const r = tri && tri.rows.get(id); return r ? r.score : null; };
  const stats = L => {
    const n = L.length, devs = new Map(); for (const x of L) if (x.dv) { const k = x.dvs || x.dv; const d = devs.get(k) || { n: x.dv, s: x.dvs, k: 0 }; d.k++; devs.set(k, d); }
    const permit = x => !!x.pn || ((ix.caseBy.get(x.id) || {}).checks || {}).permit === 2;
    const H = L.map(x => [x, handoverOf(ix, x)]).filter(e => e[1]), ys = new Map();
    for (const [, h] of H) { const y = hyear(h.d); if (y) ys.set(y, (ys.get(y) || 0) + 1); }
    const yTop = [...ys.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0] || null;
    const mv = L.filter(x => { const h = (ix.prom[x.id] || []).find(p => p.k === 'handover'); return h && h.mv > 0; }).length;
    const OV = L.map(x => [x, overdueOf(ix, x)]).filter(e => e[1]);
    const lm = L.map(x => lastmod(ix, x)).sort().pop() || String(ix.updated || '').slice(0, 10);
    return { n, devs, dv: devs.size, pn: L.filter(permit).length, permit, h: H.length, ys, yTop, mv, OV, ov: OV.length, med: med(L.map(x => score(x.id))), lm };
  };
  const M = new Map(); for (const [mk, L] of g) if (L.length >= MIN_MK) M.set(slugM(mk), { mk, L, st: stats(L) });
  const CG = new Map(); for (const x of ix.P) if (x.co) { const c = CO_AL[x.co] || x.co; if (!CG.has(c)) CG.set(c, []); CG.get(c).push(x); }
  const C = new Map(); for (const [co, L] of CG) if (L.length >= MIN_MK) C.set(slugA(co), { kind: 'c', co, s: slugA(co), mk: co, L, st: stats(L) });
  MD = { ix, tri, g, M, C, score, stats, all: stats(ix.P), day: new Date().toISOString().slice(0, 10), body: new Map(), d: String(ix.updated || '').slice(0, 10) };
  return MD;
}
const findMk = (D, key) => { const k = String(key || '').toLowerCase(); let m = D.M.get(k); if (m) return m; try { m = D.M.get(slugM(decodeURIComponent(k))); } catch (e) { m = null; } return m || null; };

// ------------------------------------------------------------------------------------------------ shared HTML
export const CSS = '<style id="k29i-css">.k29-kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));border:1px solid var(--k-line,#d5d3cc);border-radius:var(--k-r-lg,14px);overflow:hidden;background:var(--k-surface,#fff);margin:16px 0}' +
  '.k29-kv div{padding:12px 16px;border-inline-end:1px solid var(--k-line,#d5d3cc);border-bottom:1px solid var(--k-line,#d5d3cc)}.k29-kv b{display:block;font-size:var(--k-fs-xl,24px);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.k29-kv span{font-size:var(--k-fs-xs,13px);color:var(--k-muted,#5f5c55)}' +
  '.k29 .k-table-wrap{overflow-x:auto;margin:12px 0 24px}.k29 td{vertical-align:top}.k29-l{display:flex;flex-wrap:wrap;gap:8px 16px;padding:0;list-style:none;margin:12px 0}.k29-l a{display:inline-flex;align-items:center;min-height:44px}.k29-q{padding:28px 0;border-top:1px solid var(--k-line,#d5d3cc)}.k29-q h2{font-size:1.25rem;margin:0 0 12px}.k29-k h2{font-size:1rem;margin:16px 0 0}</style>';
const kvHtml = items => '<div class="k29-kv">' + items.map(([v, l]) => '<div><b>' + v + '</b><span>' + esc(l) + '</span></div>').join('') + '</div>';
const faqHtml = (title, Q) => '<h2 id="questions">' + esc(title) + '</h2><div class="k-disc">' + Q.map(([q, a]) => '<details><summary>' + esc(q) + '</summary><p>' + esc(a) + '</p></details>').join('') + '</div>';
const faqLd = Q => ({ '@type': 'FAQPage', mainEntity: Q.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const list = (lang, items) => { try { return new Intl.ListFormat(LOC[lang] || 'en-GB', { style: 'long', type: 'conjunction' }).format(items); } catch (e) { return items.join(', '); } };

// ------------------------------------------------------------------------------------------------ item 88: translated market file
function marketPage(D, m, lang) {
  const { mk, L, st } = m, ix = D.ix, isC = m.kind === 'c', p = isC ? coName(m.co, lang) : mkName(mk, lang), co = L[0].co, d = fd(D.d, lang), path = isC ? '/countries/' + m.s + '/' : '/m/' + slugM(mk) + '/';
  const v = { p, n: nf(lang, st.n), dv: nf(lang, st.dv), d };
  // n29q: a country with a market file of the same name (Malaysia, Vietnam, Costa Rica...) had the same title on both pages (255 pairs)
  const CT = { en: '{p}: off-plan projects by market and developer', es: '{p}: obra nueva sobre plano por mercado y promotor', fr: '{p} : programmes sur plan par marché et promoteur', de: '{p}: Off-Plan-Projekte nach Markt und Bauträger', nl: '{p}: projecten op plan per markt en ontwikkelaar', ru: '{p}: новостройки по рынкам и застройщикам', zh: '{p}期房项目：按市场与开发商', ar: '{p}: مشاريع على الخارطة حسب السوق والمطوّر' };
  let title = isC && (D.M.has(slugM(mk)) || [...D.M.values()].some(o => mkName(o.mk, lang) === p)) ? (CT[lang] || CT.en).replace('{p}', p) : t(lang, 'm_t', v), desc = t(lang, 'm_desc', v);
  const C40 = TB.kbx_n29i_CTR; if (!isC && C40.s && C40.s.includes(slugM(mk))) {   // n40 k16 (R07-05..08, R07-30..33): titles and descriptions from the market's own counts, logged in /data/ctr-changes.tsv
    const w = Object.assign({}, v, { pn: nf(lang, st.pn), pp: nf(lang, pct(st.pn, st.n)), ov: nf(lang, st.ov), y: st.yTop ? st.yTop[0] : '' }), fl = x => String(x).replace(/\{(\w+)\}/g, (q, a) => w[a] != null ? w[a] : q);
    const tt = (C40.t[lang] || C40.t.en).map(fl).find(x => x.length <= 60); if (tt) title = tt; desc = fl((C40.d[lang] || C40.d.en)[st.yTop ? 0 : 1]).replace(/\.\.(?=\s|$)/g, '.'); }
  const TRP = TR_PLACES.filter(P => !P.coi && (isC ? (CO_AL[P.co] || P.co) === m.co : P.m.includes(mk)) && D.tri && D.tri.places.get(P.s) && D.tri.places.get(P.s).n);
  const BUY = BUY_PLACES.filter(P => isC ? (CO_AL[P.c] || P.c) === m.co : (TRP.some(q => q.s === P.s) || slugA(mk) === P.s));
  const rows = L.slice().sort((a, b) => (D.score(b.id) ?? -1) - (D.score(a.id) ?? -1) || a.n.localeCompare(b.n)).map(x => {
    const h = handoverOf(ix, x), s = D.score(x.id);
    return '<tr><td><a href="' + pre(lang) + '/projects/' + x.s + '/">' + bdi(x.n) + '</a></td><td>' +
      (x.dv ? (x.dvs && ix.devs.has(x.dvs) ? '<a href="' + pre(lang) + '/developers/' + x.dvs + '/">' + bdi(x.dv) + '</a>' : bdi(x.dv)) : esc(t(lang, 'np'))) + '</td><td>' + (x.ar && x.ar !== x.mk ? arCell(x.ar, lang) : '') +
      '</td><td>' + (h ? bdi(hdisp(h.d, lang)) : esc(t(lang, 'np'))) + '</td><td>' + esc(st.permit(x) ? t(lang, 'yes') : t(lang, 'no')) + '</td><td>' + (s == null ? '-' : nf(lang, s)) + '</td></tr>';
  }).join('');
  const Q = [[t(lang, 'q1', v), t(lang, 'a1', v)], [t(lang, 'q2', v), t(lang, 'a2', Object.assign({}, v, { pn: nf(lang, st.pn), pp: nf(lang, pct(st.pn, st.n)) }))],
    [t(lang, 'q3', v), st.h && st.yTop ? t(lang, 'a3', Object.assign({}, v, { h: nf(lang, st.h), y: st.yTop[0], k: nf(lang, st.yTop[1]) })) : t(lang, 'a3n', v)],
    [t(lang, 'q4', v), t(lang, st.ov === 1 ? 'a4_1' : 'a4', Object.assign({}, v, { ov: nf(lang, st.ov), mv: nf(lang, st.mv) }))]];
  const links = [];
  for (const P of TRP) links.push('<a href="' + pre(lang) + '/rankings/transparency/' + P.s + '/">' + th(lang, 'l_tr', { p: mkName(P.n, lang) }) + '</a>');
  if (isC) for (const g of [...new Set(L.map(x => x.mk))].map(k => D.M.get(slugM(k))).filter(Boolean).sort((a, b) => b.L.length - a.L.length)) links.push('<a href="' + pre(lang) + '/m/' + slugM(g.mk) + '/">' + bdi(mkName(g.mk, lang)) + ' (' + nf(lang, g.L.length) + ')</a>');
  for (const P of BUY) links.push('<a href="' + pre(lang) + '/guides/buying-off-plan/' + P.s + '/">' + th(lang, 'l_buy', { p: isC ? (P.m ? mkName(P.m[0], lang) : coName(P.c, lang)) : mkName(mk, lang) }) + '</a>');
  if (!isC && st.ov >= OV_MIN) links.push('<a href="' + pre(lang) + '/handover/overdue/' + slugA(mk) + '/">' + th(lang, 'l_ov', { p }) + '</a>');
  if (!isC) for (const [y, k] of [...st.ys.entries()].filter(e => e[1] >= 3).sort((a, b) => a[0] - b[0]).slice(0, 4)) links.push('<a href="' + pre(lang) + '/handover/' + y + '/' + slugA(mk) + '/">' + th(lang, 'l_hy', { y }) + '</a>');
  links.push('<a href="' + path + '" hreflang="en">' + esc(t(lang, isC ? 'l_enc' : 'l_en')) + '</a>', '<a href="' + pre(lang) + '/methods/transparency-score/">' + esc(t(lang, 'l_mt')) + '</a>');
  // n29q: market files use the same trail as the English /m/ page (Countries / <country> / <market>), the country page in this language when it exists
  const coS = co ? slugA(co) : null, coU = coS ? (D.C.has(coS) ? pre(lang) : '') + '/countries/' + coS + '/' : null;
  const cr = isC ? [['Kolaboro', pre(lang) + '/'], [t(lang, 'crumb_c'), pre(lang) + '/countries/'], [p, pre(lang) + path]] : [['Kolaboro', pre(lang) + '/'], [t(lang, 'crumb_c'), pre(lang) + '/countries/']].concat(coU && co !== mk ? [[coName(co, lang), coU]] : []).concat([[p, pre(lang) + path]]);
  const body = '<div class="k29"><section class="k-sec"><div class="k-wrap"><div class="k-phead"><p class="k-crumb">' + cr.map((c, i) => i < cr.length - 1 ? '<a href="' + c[1] + '">' + esc(c[0]) + '</a>' : '<span>' + bdi(c[0]) + '</span>').join(' / ') + '</p>' +
    '<h1>' + th(lang, 'm_h1', { p: H(bdi(p)) }) + '</h1><p class="lead">' + th(lang, 'm_lead', { p: H(bdi(p)), d }) + '</p></div>' +
    kvHtml([[nf(lang, st.n), t(lang, 'k_n')], [nf(lang, st.dv), t(lang, 'k_dv')], [nf(lang, st.pn) + ' (' + nf(lang, pct(st.pn, st.n)) + '%)', t(lang, 'k_pn')], [nf(lang, st.h) + ' (' + nf(lang, pct(st.h, st.n)) + '%)', t(lang, 'k_h')],
      [nf(lang, st.mv), t(lang, 'k_mv')], [nf(lang, st.ov), t(lang, 'k_ov')], [st.med == null ? '-' : nf(lang, st.med), t(lang, 'k_med')], [esc(d), t(lang, 'k_d')]]) +
    '<h2 id="projects">' + esc(t(lang, 'tb')) + '</h2><style>@media (max-width:640px){' + ['c_p', 'c_dv', 'c_ar', 'c_h', 'c_pn', 'c_s'].map((k, i) => '.k40m td:nth-child(' + (i + 1) + ')::before{content:"' + String(t(lang, k)).replace(/[\\"<>]/g, '') + '"}').join('') + '}</style><div class="k-table-wrap"><table class="k-table k-table--dense k-table--stack k40m"><thead><tr>' + ['c_p', 'c_dv', 'c_ar', 'c_h', 'c_pn', 'c_s'].map(k => '<th scope="col">' + esc(t(lang, k)) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
    (isC && TR_PLACES.some(P => P.coi && (CO_AL[P.co] || P.co) === m.co) ? '<p class="k-small k-muted">' + esc(t(lang, 'coi_n')) + ' <a href="/independence/" hreflang="en">' + esc(t(lang, 'coi_l')) + '</a></p>' : '') +   // n40 k4 (R04-02): neutral conflict-of-interest line, no place named
    faqHtml(t(lang, 'faq', { p }), Q) + (BPL.some(P => P.mk === mk) ? buyerLinks(lang, mk).replace('<section class="k29-q"><div class="k-wrap wrap">', '').replace('</div></section>', '') : '') + '<h2 id="more">' + th(lang, 'more', { p: H(bdi(p)) }) + '</h2><ul class="k29-l">' + links.map(a => '<li>' + a + '</li>').join('') + '</ul><p class="k-small k-muted">' + esc(t(lang, 'src')) + ' <a href="/data/named.json">named.json</a> · <a href="/data/promises.json">promises.json</a></p></div></section></div>';
  const url = ORIGIN + pre(lang) + path;
  const ld = [{ '@type': 'CollectionPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: st.lm, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' },
      about: isC ? { '@type': 'Country', name: p, alternateName: p !== m.co ? m.co : undefined } : { '@id': url + '#place' }, mainEntity: { '@type': 'ItemList', numberOfItems: L.length, itemListElement: L.slice(0, 50).map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: ORIGIN + pre(lang) + '/projects/' + x.s + '/', name: x.n })) } },
    { '@type': 'BreadcrumbList', itemListElement: cr.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: ORIGIN + c[1] })) }, faqLd(Q)];
  if (!isC) ld.splice(1, 0, { '@type': 'Place', '@id': url + '#place', name: p, alternateName: p !== mk ? mk : undefined, containedInPlace: co ? { '@type': 'Country', name: coName(co, lang), url: coU ? ORIGIN + coU : undefined } : undefined });   // n29q: Place node as on the English /m/ page
  return { path, title, desc, body, ld, lm: st.lm };
}
// English /m/<market>/: hreflang alternates when the market has translated files (index.js appends them to <head>)
export async function mAlternates(env, key) {
  let D; try { D = await mdata(env); } catch (e) { return ''; } const m = findMk(D, key); if (!m) return /^[a-z0-9-]{2,80}$/.test(key || '') ? '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + '/m/' + key + '/">' : '';   // n40 k11 (R05-01): a market with no translated file says so with one x-default (its /xx/ URLs answer 301)
  const p = '/m/' + slugM(m.mk) + '/'; return LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + p + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + p + '">';
}
// is there a translated market file? (for links from other pages)
function mSitemap(D) {
  const xe = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const urls = [...D.M.values()].flatMap(m => { const p = '/m/' + slugM(m.mk) + '/'; return LANGS.map(l => '<url><loc>' + xe(ORIGIN + pre(l) + p) + '</loc><lastmod>' + m.st.lm + '</lastmod>' + LANGS.map(a => '<xhtml:link rel="alternate" hreflang="' + a + '" href="' + xe(ORIGIN + pre(a) + p) + '"/>').join('') + '<xhtml:link rel="alternate" hreflang="x-default" href="' + xe(ORIGIN + p) + '"/></url>'); });
  for (const p of ['/countries/', '/rankings/'].concat([...D.C.values()].map(c => '/countries/' + c.s + '/'))) { const c = D.C.get(p.split('/')[2]), lm = c ? c.st.lm : D.d; for (const l of LANGS) urls.push('<url><loc>' + ORIGIN + pre(l) + p + '</loc><lastmod>' + lm + '</lastmod>' + LANGS.map(a => '<xhtml:link rel="alternate" hreflang="' + a + '" href="' + ORIGIN + pre(a) + p + '"/>').join('') + '<xhtml:link rel="alternate" hreflang="x-default" href="' + ORIGIN + p + '"/></url>'); }
  for (const g of GROUPS) { const p = '/guides/buyers-from/' + g + '/', lm = BPL.map(P => (D.M.get(slugM(P.mk)) || { st: { lm: '' } }).st.lm).concat(['2026-11-14']).sort().pop(); for (const l of LANGS) urls.push('<url><loc>' + ORIGIN + pre(l) + p + '</loc><lastmod>' + lm + '</lastmod>' + LANGS.map(a => '<xhtml:link rel="alternate" hreflang="' + a + '" href="' + ORIGIN + pre(a) + p + '"/>').join('') + '<xhtml:link rel="alternate" hreflang="x-default" href="' + ORIGIN + p + '"/></url>'); }
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + urls.join('\n') + '\n</urlset>\n';
}

// ------------------------------------------------------------------------------------------------ items 93 and 95: hub figures and Q&A
const HUB_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(projects|rankings\/transparency|handover|handover\/overdue)\/$/;   // /countries/ and /developers/ count all tracked cases (incl. anonymous ones): left out so the figures never disagree
function hubParts(D, kind, lang) {
  const A = D.all, ix = D.ix, d = fd(D.d, lang), N = n => nf(lang, n);
  if (kind === 'projects') {
    const cos = new Set(ix.P.map(x => CO_AL[x.co] || x.co).filter(Boolean)), top = [...D.g.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 5);
    const k = [[N(A.n), t(lang, 'k_n')], [N(D.g.size), t(lang, 'k_mk')], [N(cos.size), t(lang, 'k_co')], [N(A.dv), t(lang, 'k_dv')], [N(A.pn) + ' (' + N(pct(A.pn, A.n)) + '%)', t(lang, 'k_pn')], [N(A.h) + ' (' + N(pct(A.h, A.n)) + '%)', t(lang, 'k_h')], [N(A.mv), t(lang, 'k_mv')], [N(A.ov), t(lang, 'k_ov')], [A.med == null ? '-' : N(A.med), t(lang, 'k_med')], [esc(d), t(lang, 'k_d')]];
    const Q = [[t(lang, 'hp_q1'), t(lang, 'hp_a1', { n: N(A.n), m: N(D.g.size), c: N(cos.size), dv: N(A.dv), d })], [t(lang, 'hp_q2'), t(lang, 'hp_a2', { l: list(lang, top.map(([m, L]) => mkName(m, lang) + ' (' + N(L.length) + ')')) })],
      [t(lang, 'hp_q3'), t(lang, 'hp_a3', { pn: N(A.pn), n: N(A.n), pp: N(pct(A.pn, A.n)) })], [t(lang, 'hp_q4'), t(lang, 'hp_a4', { ov: N(A.ov), op: N(pct(A.ov, A.h)) })]];
    return { k, Q };
  }
  if (kind === 'rankings/transparency') {
    if (!D.tri) return null;
    const R = [...D.tri.places.values()].filter(pl => pl.ranked && pl.med != null)   // n29q: Sumba is ranked on this page (owner decision), so it counts here as on /numbers/
   .sort((a, b) => b.med - a.med || b.n - a.n);
    if (!R.length) return null; const hi = R[0], lo = R[R.length - 1], scored = new Set(); for (const pl of R) for (const r of pl.L) scored.add(r.id);
    const k = [[N(R.length), t(lang, 'k_pl')], [N(scored.size), t(lang, 'k_sc')], [esc(mkName(hi.P.n, lang)) + ' · ' + N(hi.med), t(lang, 'k_top')], [esc(d), t(lang, 'k_d')]];
    const Q = [[t(lang, 'ht_q1'), t(lang, 'ht_a1', { p: mkName(hi.P.n, lang), s: N(hi.med), n: N(hi.n), d })], [t(lang, 'ht_q2'), t(lang, 'ht_a2', { p: mkName(lo.P.n, lang), s: N(lo.med), n: N(lo.n) })], [t(lang, 'ht_q3'), t(lang, 'ht_a3')]];
    return { k, Q };
  }
  if (kind === 'handover') {
    const y0 = new Date().getUTCFullYear(), Y = [y0, y0 + 1, y0 + 2], cnt = y => A.ys.get(y) || 0, later = [...A.ys.entries()].filter(e => e[0] >= y0 + 3).reduce((a, e) => a + e[1], 0), yq = y0 + 1;
    const byMk = [...D.g.entries()].map(([m, L]) => [m, L.filter(x => { const h = handoverOf(ix, x); return h && hyear(h.d) === yq; }).length]).filter(e => e[1]).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const k = [[N(A.h), t(lang, 'k_h')], ...Y.map(y => [N(cnt(y)), t(lang, 'k_y', { y })]), [N(later), t(lang, 'k_y2', { y: y0 + 3 })], [N(A.ov), t(lang, 'k_ov')], [esc(d), t(lang, 'k_d')]];
    const Q = [[t(lang, 'hh_q1', { y: yq }), t(lang, 'hh_a1', { k: N(cnt(yq)), y: yq })], ...(byMk.length ? [[t(lang, 'hh_q2', { y: yq }), t(lang, 'hh_a2', { l: list(lang, byMk.map(([m, n]) => mkName(m, lang) + ' (' + N(n) + ')')) })]] : []),
      [t(lang, 'hh_q3'), t(lang, 'hh_a3', { ov: N(A.ov), mv: N(A.mv) })]];
    return { k, Q };
  }
  if (kind === 'handover/overdue') {
    if (!A.ov) return null;
    const ms = A.OV.map(e => e[1].m), mx = A.OV.slice().sort((a, b) => b[1].m - a[1].m)[0], byMk = new Map(); for (const [x] of A.OV) byMk.set(x.mk, (byMk.get(x.mk) || 0) + 1);
    const top = [...byMk.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const k = [[N(A.ov), t(lang, 'k_ov')], [N([...byMk.values()].filter(v => v >= OV_MIN).length), t(lang, 'k_ovp')], [N(med(ms)), t(lang, 'k_ovm')], [N(mx[1].m), t(lang, 'k_ovx')], [esc(d), t(lang, 'k_d')]];
    // n29q: /numbers/ and /api/open/stats show a smaller overdue count (first date in the data file); say why the two differ
    const HON = { en: '{a}Kolaboro in numbers{b} counts projects past the first handover date in the data file; this page uses the handover date shown on each project page and the current month, so the two counts differ.',
      es: '{a}Kolaboro en cifras{b} cuenta los proyectos que pasaron la primera fecha de entrega del archivo de datos; esta página usa la fecha de entrega que muestra cada ficha y el mes actual, por eso las dos cifras difieren.',
      fr: '{a}Kolaboro en chiffres{b} compte les projets qui ont dépassé la première date de livraison du fichier de données ; cette page utilise la date de livraison affichée sur chaque fiche et le mois en cours, d’où l’écart entre les deux chiffres.',
      de: '{a}Kolaboro in Zahlen{b} zählt Projekte nach dem ersten Übergabetermin in der Datendatei; diese Seite nutzt den Übergabetermin, den jede Projektseite zeigt, und den aktuellen Monat. Daher weichen die Zahlen ab.',
      nl: '{a}Kolaboro in cijfers{b} telt projecten voorbij de eerste opleverdatum in het gegevensbestand; deze pagina gebruikt de opleverdatum op elke projectpagina en de huidige maand, daarom verschillen de twee aantallen.',
      ru: '{a}Kolaboro в цифрах{b} считает проекты, у которых прошла первая дата сдачи в файле данных; эта страница берёт дату сдачи со страницы каждого проекта и текущий месяц, поэтому числа различаются.',
      zh: '{a}Kolaboro 数据一览{b}统计的是已超过数据文件中首个交付日期的项目；本页使用每个项目页显示的交付日期和当前月份，因此两个数字不同。',
      ar: 'تحسب صفحة {a}Kolaboro بالأرقام{b} المشاريع التي تجاوزت أول موعد تسليم في ملف البيانات؛ أما هذه الصفحة فتستخدم موعد التسليم الظاهر في صفحة كل مشروع والشهر الحالي، لذلك يختلف العددان.' };
    const note = esc(HON[lang] || HON.en).replace('{a}', '<a href="' + pre(lang) + '/numbers/">').replace('{b}', '</a>');
    const Q = [[t(lang, 'ho_q1'), t(lang, 'ho_a1', { ov: N(A.ov), m: N(med(ms)), d })], [t(lang, 'ho_q2'), t(lang, 'ho_a2', { l: list(lang, top.map(([m, n]) => mkName(m, lang) + ' (' + N(n) + ')')) })], [t(lang, 'ho_q3'), t(lang, 'ho_a3')]];
    return { k, Q, note };
  }
  if (kind === 'developers') {
    const DV = [...ix.devs.values()].sort((a, b) => b.ids.length - a.ids.length || a.n.localeCompare(b.n)), d5 = DV.filter(v => v.ids.length >= 5).length;
    const k = [[N(ix.devs.size), t(lang, 'k_dv')], [N(d5), t(lang, 'k_d5')], [N(A.n), t(lang, 'k_n')], [esc(d), t(lang, 'k_d')]];
    const Q = [[t(lang, 'hd_q1'), t(lang, 'hd_a1', { dv: N(ix.devs.size), n: N(A.n), d })], [t(lang, 'hd_q2'), t(lang, 'hd_a2', { l: list(lang, DV.slice(0, 5).map(v => v.n + ' (' + N(v.ids.length) + ')')) })], [t(lang, 'hd_q3'), t(lang, 'hd_a3')]];
    return { k, Q };
  }
  if (kind === 'countries') {
    const C = new Map(); for (const x of ix.P) if (x.co) C.set(x.co, (C.get(x.co) || 0) + 1);
    const top = [...C.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const k = [[N(C.size), t(lang, 'k_co')], [N(A.n), t(lang, 'k_n')], [N([...C.values()].filter(v => v >= 10).length), t(lang, 'k_co') + ' (10+)'], [esc(d), t(lang, 'k_d')]];
    const Q = [[t(lang, 'hc_q1'), t(lang, 'hc_a1', { c: N(C.size), n: N(A.n), d })], [t(lang, 'hc_q2'), t(lang, 'hc_a2', { l: list(lang, top.map(([c, n]) => coName(c, lang) + ' (' + N(n) + ')')) })]];
    return { k, Q };
  }
  return null;
}
export async function hubInject(req, u, env, r, fix) {
  const m = HUB_RX.exec(u.pathname); if (!m || req.method !== 'GET' || !r || r.status !== 200 || !/text\/html/.test(r.headers.get('content-type') || '')) return r;
  const lang = m[1] || 'en', kind = m[2];
  let D; try { D = await mdata(env); } catch (e) { return r; }
  const key = lang + '|' + kind; let pt = D.body.get(key);
  if (pt === undefined) { try { pt = hubParts(D, kind, lang); } catch (e) { pt = null; } D.body.set(key, pt); }
  if (!pt) return r;
  const fx = lang === 'ru' && fix ? fix : (h => h);
  const top = CSS + '<div class="k29-k"><h2>' + esc(t(lang, 'hub_k')) + '</h2>' + kvHtml(pt.k) + (pt.note ? '<p class="k-small k-muted">' + pt.note + '</p>' : '') + '</div>', top2 = fx(top);
  const qa = '<section class="k29-q" id="hub-questions"><div class="k-wrap wrap">' + faqHtml(t(lang, 'hub_q'), pt.Q).replace('<h2 id="questions">', '<h2>') + '</div></section><script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@graph': [faqLd(pt.Q)] }).replace(/</g, '\\u003c') + '</script>';
  let done = false;
  return new HTMLRewriter()
    .on('p.lead', { element(e) { if (!done) { done = true; e.after(top2, { html: true }); } } })
    .on('main', { element(e) { e.onEndTag(tg => { tg.before(fx((done ? '' : top) + qa), { html: true }); }); } })
    .transform(r);
}

// ------------------------------------------------------------------------------------------------ item 97: questions answered from data
let QC = null;
function questions(D) {
  if (QC && QC.D === D) return QC.q;
  const ix = D.ix, d = D.d, Q = [], add = (q, a, url, scope) => Q.push({ q, a, url, scope, date: d });
  const pl = n => n === 1 ? '' : 's';
  const lstP = (L, f) => L.slice(0, 10).map(f).join('; ') + (L.length > 10 ? '; and ' + (L.length - 10) + ' more' : '');
  for (const { mk, L, st } of [...D.M.values()].sort((a, b) => b.L.length - a.L.length)) {
    const url = ORIGIN + '/m/' + slugM(mk) + '/', where = mk + (L[0].co && L[0].co !== mk ? ', ' + L[0].co : '');
    add('How many off-plan projects in ' + mk + ' does Kolaboro track?', st.n + ' named off-plan projects in ' + where + ' from ' + st.dv + ' developer' + pl(st.dv) + '.', url, mk);
    const P = L.filter(st.permit);
    add('Which off-plan projects in ' + mk + ' publish a permit or licence number?', P.length ? P.length + ' of ' + st.n + ': ' + lstP(P, x => x.n + (x.pn ? ' (' + x.pn + ')' : '')) + '.' : 'None of the ' + st.n + ' projects publishes a permit or licence number in the sources we read.', url, mk);
    if (st.h) add('When are off-plan projects in ' + mk + ' due to be handed over?', st.h + ' of ' + st.n + ' publish a handover date: ' + [...st.ys.entries()].sort((a, b) => a[0] - b[0]).map(([y, k]) => y + ': ' + k).join(', ') + '.', url, mk);
    add('Which off-plan projects in ' + mk + ' are past their handover date?', st.ov ? st.ov + ' project' + pl(st.ov) + ' with a handover date on record that has passed without a recorded completion: ' + lstP(st.OV.slice().sort((a, b) => b[1].m - a[1].m), ([x, o]) => x.n + ' (' + o.m + ' months past ' + hdisp(o.d, 'en') + ')') + '.' : 'None: no handover date on record has passed without a recorded completion.', url, mk);
    const dv = [...st.devs.values()].sort((a, b) => b.k - a.k || a.n.localeCompare(b.n)).slice(0, 5);
    if (dv.length) add('Which developers have the most off-plan projects in ' + mk + '?', dv.map(v => v.n + ' (' + v.k + ')').join(', ') + '.', url, mk);
    const sc = L.map(x => [x, D.score(x.id)]).filter(e => e[1] != null).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (sc.length) add('Which off-plan projects in ' + mk + ' publish the most checkable facts?', 'Highest transparency scores (0-100, what is published and checkable, not a verdict): ' + sc.map(([x, s]) => x.n + ' ' + s).join(', ') + '. Median in ' + mk + ': ' + st.med + '.', url, mk);
  }
  const C = new Map(); for (const x of ix.P) if (x.co) { if (!C.has(x.co)) C.set(x.co, []); C.get(x.co).push(x); }
  const cslug = c => slugA(c);
  for (const [co, L] of [...C.entries()].filter(e => e[1].length >= MIN_MK).sort((a, b) => b[1].length - a[1].length)) {
    const st = D.stats(L), url = ORIGIN + '/countries/' + cslug(co) + '/', mks = [...new Set(L.map(x => x.mk))];
    add('How many off-plan projects in ' + co + ' does Kolaboro track?', st.n + ' named projects in ' + mks.length + ' market' + pl(mks.length) + ' (' + mks.slice(0, 8).join(', ') + (mks.length > 8 ? ', ...' : '') + ') from ' + st.dv + ' developer' + pl(st.dv) + '.', url, co);
    add('What share of off-plan projects in ' + co + ' publish a permit or licence number?', st.pn + ' of ' + st.n + ' (' + pct(st.pn, st.n) + '%) in the sources we read.', url, co);
    add('How many off-plan projects in ' + co + ' are past their handover date?', st.ov + ' of the ' + st.h + ' with a handover date on record; the date moved later at least once for ' + st.mv + '.', url, co);
  }
  for (const v of [...ix.devs.values()].filter(v => v.ids.length >= MIN_MK).sort((a, b) => b.ids.length - a.ids.length)) {
    const L = v.ids.map(id => ix.byId.get(id)).filter(Boolean), st = D.stats(L), url = ORIGIN + '/developers/' + v.s + '/';
    add('Which off-plan projects does ' + v.n + ' have?', L.length + ' tracked: ' + lstP(L, x => { const h = handoverOf(ix, x); return x.n + ' (' + x.mk + (h ? ', handover ' + hdisp(h.d, 'en') : '') + ')'; }) + '.', url, v.n);
    add('Does ' + v.n + ' deliver on time?', 'Of ' + st.h + ' projects with a handover date on record, ' + st.ov + ' are past it without a recorded completion and ' + st.mv + ' saw the date move later at least once. The developer page lists promised against actual dates where a completion is on record.', url, v.n);
  }
  QC = { D, q: Q }; return Q;
}
function questionsMd(D) {
  const Q = questions(D), L = ['# Kolaboro: questions about off-plan projects, answered from our data', '', '> ' + Q.length + ' questions about markets, countries and developers with at least ' + MIN_MK + ' named projects. Each answer is computed from the published data (no estimates) and links the page that shows the facts with their sources. Data of ' + D.d + '. CC BY 4.0, attribute "Kolaboro". JSON: ' + ORIGIN + '/answers/questions.json', ''];
  let scope = null; for (const q of Q) { if (q.scope !== scope) { scope = q.scope; L.push('## ' + scope, ''); } L.push('### ' + q.q, '', q.a + ' Source: ' + q.url + ' (data of ' + q.date + ')', ''); }
  return L.join('\n');
}


// ------------------------------------------------------------------------------------------------ item 89: buyers by nationality
// One page per buyer group (Russia, mainland China, the Gulf states), not one per place and nationality: what changes with the buyer's
// nationality in the four places where these buyers look most (Dubai, Bali, Phuket, Cyprus), with the official text read on the date
// shown, and the same four places compared from our data. Rules that are the same for every foreigner are linked to the buying guides.
export const BUYER_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?guides\/buyers-from(?:\/(russia|china|gulf))?(\/?)$/;
const GROUPS = ['russia', 'china', 'gulf'];
const BPL = [{ s: 'dubai', mk: 'Dubai', g: 'dubai' }, { s: 'bali', mk: 'Bali', g: 'bali' }, { s: 'phuket', mk: 'Phuket', g: 'phuket' }, { s: 'cyprus', mk: 'Cyprus', g: 'cyprus' }];
const BSRC = {
  ae7: { n: 'Dubai Law No. 7 of 2006 (Real Property Registration), Article 4', u: 'https://dlp.dubai.gov.ae/Legislation%20Reference/2006/Law%20No.%20(7)%20of%202006.html', d: '2026-11-14' },
  pp18: { n: 'Government Regulation No. 18 of 2021, Articles 52, 69, 71 and 72', u: 'https://www.peraturan.go.id/files3/pp-no-18-tahun-2021_asli.pdf', d: '2026-11-03' },
  th: { n: 'Condominium Act B.E. 2522, sections 19 bis and 19 ter', u: 'https://www.dol.go.th/media/716929789247754240/migration/2025/10/6Wp3Tk7hgK5HdDRuvYXGcNsi.pdf', d: '2026-11-14' },
  eu5b: { n: 'European Commission: FAQ on Article 5b of Council Regulation 833/2014 (deposits)', u: 'https://finance.ec.europa.eu/system/files/2022-10/faqs-sanctions-russia-deposits_en.pdf', d: '2026-11-14' },
  safe: { n: 'SAFE Beijing branch: current account FAQ (notice Huifa [2016] No. 36)', u: 'https://www.safe.gov.cn/beijing/file/file/20191127/b29df7fa63504266b9ccb23429185d40.pdf', d: '2026-11-14' }
};
// [rule key, source key] per group and place; null: nothing changes with this nationality there (the guide covers it)
const BRULE = {
  russia: { home: null, dubai: ['ae_for', 'ae7'], bali: ['id_for', 'pp18'], phuket: ['th_for', 'th'], cyprus: ['cy_ru', 'eu5b'] },
  china: { home: ['cn_safe', 'safe'], dubai: ['ae_for', 'ae7'], bali: ['id_for', 'pp18'], phuket: ['th_for', 'th'], cyprus: null },
  gulf: { home: null, dubai: ['ae_gcc', 'ae7'], bali: ['id_for', 'pp18'], phuket: ['th_for', 'th'], cyprus: null }
};
const BT = TB.kbx_n29i_BT /* n32w (19 Nov 2026): table moved to /data/i18n/kbx_n29i.json, filled by kbx_strings.js before any kolaboro.com request is handled */;
const bt = (lang, k, v) => { let s = (BT[lang] && BT[lang][k] != null) ? BT[lang][k] : BT.en[k]; if (v) s = String(s).replace(/\{(\w+)\}/g, (m, a) => v[a] != null ? v[a] : m); return s.replace(/\.\.(?=\s|$)/g, '.'); };
function buyerPage(D, g, lang) {
  const G = bt(lang, 'g_' + g), d = fd(D.d, lang), path = '/guides/buyers-from/' + g + '/', R = BRULE[g], N = n => nf(lang, n);
  const srcP = k => { const S = BSRC[k]; return '<p class="k-small k-muted">' + esc(bt(lang, 'src', { s: S.n, d: fd(S.d, lang) })).replace(esc(S.n), '<a href="' + esc(S.u) + '" rel="noopener">' + esc(S.n) + '</a>') + '</p>'; };
  let body = '<div class="k29"><section class="k-sec"><div class="k-wrap"><div class="k-phead"><p class="k-crumb"><a href="' + pre(lang) + '/">Kolaboro</a> / <a href="' + pre(lang) + '/guides/buying-off-plan/">' + esc(bt(lang, 'hub')) + '</a> / <span>' + esc(G) + '</span></p>' +
    '<h1>' + esc(bt(lang, 'h1', { g: G })) + '</h1><p class="lead">' + esc(bt(lang, 'lead', { g: G })) + '</p></div>';
  if (R.home) body += '<h2 id="home">' + esc(bt(lang, 'home')) + '</h2><p>' + esc(bt(lang, R.home[0])) + '</p>' + srcP(R.home[1]);
  body += '<h2 id="rules">' + esc(bt(lang, 'rules')) + '</h2>';
  const rows = [];
  for (const P of BPL) {
    const m = D.M.get(slugM(P.mk)), pn = mkName(P.mk, lang), r = R[P.s];
    body += '<h3 id="' + P.s + '">' + bdi(pn) + '</h3>' + (r ? '<p>' + esc(bt(lang, r[0])) + '</p>' + srcP(r[1]) : '<p>' + esc(bt(lang, 'same')) + '</p>') +
      '<ul class="k29-l"><li><a href="' + pre(lang) + '/guides/buying-off-plan/' + P.g + '/">' + esc(bt(lang, 'guide', { p: pn })) + '</a></li>' + (m ? '<li><a href="' + pre(lang) + '/m/' + slugM(P.mk) + '/">' + esc(bt(lang, 'mk', { p: pn })) + '</a></li>' : '') + '</ul>';
    if (m) rows.push('<tr><td data-label="' + esc(bt(lang, 'c_pl')) + '"><a href="' + pre(lang) + '/m/' + slugM(P.mk) + '/">' + bdi(pn) + '</a></td><td data-label="' + esc(bt(lang, 'c_n')) + '">' + N(m.st.n) + '</td><td data-label="' + esc(bt(lang, 'c_pn')) + '">' + N(m.st.pn) + ' (' + N(pct(m.st.pn, m.st.n)) + '%)</td><td data-label="' + esc(bt(lang, 'c_ov')) + '">' + N(m.st.ov) + '</td><td data-label="' + esc(bt(lang, 'c_m')) + '">' + (m.st.med == null ? '-' : N(m.st.med)) + '</td></tr>');
  }
  body += '<h2 id="data">' + esc(bt(lang, 'data')) + '</h2><p class="k-small k-muted">' + esc(t(lang, 'k_d')) + ': ' + esc(d) + '</p><div class="k-table-wrap"><table class="k-table k-table--dense k-table--stack"><thead><tr>' + ['c_pl', 'c_n', 'c_pn', 'c_ov', 'c_m'].map(k => '<th scope="col">' + esc(bt(lang, k)) + '</th>').join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>' +
    '<h2 id="other">' + esc(bt(lang, 'other')) + '</h2><ul class="k29-l">' + GROUPS.filter(x => x !== g).map(x => '<li><a href="' + pre(lang) + '/guides/buyers-from/' + x + '/">' + esc(bt(lang, 'h1', { g: bt(lang, 'g_' + x) })) + '</a></li>').join('') + '</ul><p class="k-small k-muted">' + esc(bt(lang, 'reviewed', { d: fd('2026-11-14', lang) })) + '</p></div></section></div>';
  const title = bt(lang, 't', { g: G }), desc = bt(lang, 'desc', { g: G, d }), url = ORIGIN + pre(lang) + path;
  const lm = BPL.map(P => (D.M.get(slugM(P.mk)) || { st: { lm: '' } }).st.lm).concat(['2026-11-14']).sort().pop();
  const ld = [{ '@type': 'Article', '@id': url + '#page', url, headline: title, description: desc, inLanguage: lang, dateModified: lm, datePublished: '2026-11-14', author: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, publisher: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' },
    about: BPL.map(P => ({ '@type': 'Place', name: mkName(P.mk, lang) })), citation: Object.values(BSRC).filter((S, i, a) => JSON.stringify(R).includes(Object.keys(BSRC)[i])).map(S => ({ '@type': 'Legislation', name: S.n, url: S.u })) }];
  return { path, title, desc, body, ld, lm };
}
// links to the buyer pages from the four buying guides and market files (index.js and marketPage)
export function buyerLinks(lang, mkOrGuide) {
  const P = BPL.find(q => q.s === mkOrGuide || q.mk === mkOrGuide); if (!P) return '';
  return '<section class="k29-q"><div class="k-wrap wrap"><h2>' + esc(bt(lang, 'hub')) + '</h2><p>' + esc(bt(lang, 'hubl')) + '</p><ul class="k29-l">' + GROUPS.map(x => '<li><a href="' + pre(lang) + '/guides/buyers-from/' + x + '/#' + P.s + '">' + esc(bt(lang, 'h1', { g: bt(lang, 'g_' + x) })) + '</a></li>').join('') + '</ul></div></section>';
}

// ------------------------------------------------------------------------------------------------ lead's request (14 Nov): /<lang>/countries/ and /<lang>/rankings/
// The English /countries/ pages (kbx_seo.js) carry much more (registers, delay tables); the language versions carry the figures,
// the project table and the links, from the same data, for countries with 5+ named projects. /<lang>/rankings/ lists the rankings
// and place reports that already exist in every language.
export const CR_RX = /^\/(es|de|fr|nl|ru|zh|ar)\/(countries|rankings)(?:\/([a-z0-9-]{2,60}))?(\/?)$/;
const RK = ['/rankings/transparency/', '/rankings/developers/', '/permits/', '/price-ranges/', '/ownership/', '/golden-visa/', '/airports/', '/reports/', '/handover/', '/handover/overdue/', '/areas/', '/weekly/', '/numbers/'];
function countriesHub(D, lang) {
  const C = [...D.C.values()].sort((a, b) => b.L.length - a.L.length || a.co.localeCompare(b.co)), d = fd(D.d, lang), N = n => nf(lang, n), path = '/countries/';
  const n = C.reduce((a, c) => a + c.L.length, 0), title = t(lang, 'ch_t', { c: N(C.length), n: N(n) }), desc = t(lang, 'ch_lead', { k: MIN_MK, d });
  const rows = C.map(c => '<tr><td data-label="' + esc(t(lang, 'c_co')) + '"><a href="' + pre(lang) + '/countries/' + c.s + '/">' + bdi(coName(c.co, lang)) + '</a></td><td data-label="' + esc(t(lang, 'k_n')) + '">' + N(c.st.n) + '</td><td data-label="' + esc(t(lang, 'k_pn')) + '">' + N(c.st.pn) + ' (' + N(pct(c.st.pn, c.st.n)) + '%)</td><td data-label="' + esc(t(lang, 'k_ov')) + '">' + N(c.st.ov) + '</td><td data-label="' + esc(t(lang, 'k_med')) + '">' + (c.st.med == null ? '-' : N(c.st.med)) + '</td></tr>').join('');
  const cr = [['Kolaboro', pre(lang) + '/'], [t(lang, 'crumb_c'), pre(lang) + path]];
  const body = '<div class="k29"><section class="k-sec"><div class="k-wrap"><div class="k-phead"><p class="k-crumb"><a href="' + pre(lang) + '/">Kolaboro</a> / <span>' + esc(t(lang, 'crumb_c')) + '</span></p><h1>' + esc(t(lang, 'ch_h')) + '</h1><p class="lead">' + esc(desc) + '</p></div>' +
    kvHtml([[N(C.length), t(lang, 'k_co')], [N(n), t(lang, 'k_n')], [esc(d), t(lang, 'k_d')]]) +
    '<div class="k-table-wrap"><table class="k-table k-table--dense k-table--stack"><thead><tr>' + ['c_co', 'k_n', 'k_pn', 'k_ov', 'k_med'].map(k => '<th scope="col">' + esc(t(lang, k)) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<ul class="k29-l"><li><a href="/countries/" hreflang="en">' + esc(t(lang, 'l_enc')) + '</a></li><li><a href="' + pre(lang) + '/rankings/">' + esc(t(lang, 'rk_t')) + '</a></li></ul><p class="k-small k-muted">' + esc(t(lang, 'src')) + '</p></div></section></div>';
  const url = ORIGIN + pre(lang) + path, lm = C.map(c => c.st.lm).sort().pop();
  return { path, title, desc, body, lm, ld: [{ '@type': 'CollectionPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: lm, mainEntity: { '@type': 'ItemList', numberOfItems: C.length, itemListElement: C.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: coName(c.co, lang), url: ORIGIN + pre(lang) + '/countries/' + c.s + '/' })) } }, { '@type': 'BreadcrumbList', itemListElement: cr.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: ORIGIN + c[1] })) }] };
}
function rankingsHub(D, lang) {
  const path = '/rankings/', title = t(lang, 'rk_t'), desc = t(lang, 'rk_lead'), L = t(lang, 'rk'), d = fd(D.d, lang);
  const body = '<div class="k29"><section class="k-sec"><div class="k-wrap"><div class="k-phead"><p class="k-crumb"><a href="' + pre(lang) + '/">Kolaboro</a> / <span>' + esc(title) + '</span></p><h1>' + esc(title) + '</h1><p class="lead">' + esc(desc) + '</p></div>' +
    '<ul class="k-list">' + RK.map((r, i) => '<li><a href="' + pre(lang) + r + '">' + esc(L[i]) + '</a></li>').join('') + '</ul>' +
    '<ul class="k29-l"><li><a href="' + pre(lang) + '/countries/">' + esc(t(lang, 'ch_h')) + '</a></li><li><a href="/rankings/" hreflang="en">English</a></li></ul><p class="k-small k-muted">' + esc(t(lang, 'k_d')) + ': ' + esc(d) + '</p></div></section></div>';
  const url = ORIGIN + pre(lang) + path;
  return { path, title, desc, body, lm: D.d, ld: [{ '@type': 'CollectionPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: D.d, mainEntity: { '@type': 'ItemList', numberOfItems: RK.length, itemListElement: RK.map((r, i) => ({ '@type': 'ListItem', position: i + 1, name: L[i], url: ORIGIN + pre(lang) + r })) } }] };
}
// English /countries/, /countries/<c>/ and /rankings/: hreflang to the language versions (index.js)
export async function crAlternates(env, path) {
  let ok = path === '/rankings/' || path === '/countries/';
  if (!ok) { const m = /^\/countries\/([a-z0-9-]{2,60})\/$/.exec(path); if (m) { let D; try { D = await mdata(env); } catch (e) { return ''; } ok = D.C.has(m[1]); } }
  return ok ? LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + path + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + path + '">' : '';
}
// ------------------------------------------------------------------------------------------------ routing
const txt = (b, ct, h) => new Response(b, { headers: Object.assign({ 'content-type': ct, 'cache-control': 'public, max-age=3600', 'access-control-allow-origin': '*' }, h || {}) });
export async function page(req, u, env, ctx, shell) {
  const p = u.pathname;
  let D; try { D = await mdata(env); } catch (e) { return new Response('Temporarily unavailable', { status: 503, headers: { 'retry-after': '60', 'cache-control': 'no-store' } }); }
  if (p === '/m/sitemap.xml') return txt(mSitemap(D), 'application/xml; charset=utf-8');
  if (p === '/answers/questions.md') return txt(questionsMd(D), 'text/markdown; charset=utf-8', { 'x-robots-tag': 'noindex' });
  if (p === '/answers/questions.json') return txt(JSON.stringify({ about: 'Questions about off-plan projects answered from Kolaboro data (no estimates). Each answer links the page with the facts and their sources.', licence: 'CC BY 4.0, attribute "Kolaboro"', updated: D.d, count: questions(D).length, questions: questions(D) }), 'application/json; charset=utf-8');
  const cm = CR_RX.exec(p);
  if (cm) {
    const lang = cm[1], kind = cm[2], slug = cm[3];
    if (kind === 'rankings' && slug) return null;
    const cc = slug ? D.C.get(slug) : null; if (slug && !cc) return null;   // other pages under /<lang>/countries/ belong to other modules
    if (!cm[4]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
    const key = 'c|' + lang + '|' + kind + '|' + (slug || ''); let pg = D.body.get(key);
    if (!pg) { pg = kind === 'rankings' ? rankingsHub(D, lang) : cc ? marketPage(D, cc, lang) : countriesHub(D, lang); D.body.set(key, pg); }
    return render(req, lang, pg, await shell(pre(lang) + '/how-we-score/'));
  }
  const bm = BUYER_RX.exec(p);
  if (bm) {
    const lang = bm[1] || 'en', g = bm[2]; if (!g) return new Response(null, { status: 301, headers: { location: pre(lang) + '/guides/buyers-from/russia/', 'cache-control': 'public, max-age=3600' } });
    if (!bm[3]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
    const key = 'b|' + lang + '|' + g; let pg = D.body.get(key); if (!pg) { pg = buyerPage(D, g, lang); D.body.set(key, pg); }
    return render(req, lang, pg, await shell(pre(lang) + '/how-we-score/'));
  }
  const m = PAGE_RX.exec(p); if (!m || !shell) return null;
  const lang = m[1], mm = findMk(D, m[2]); if (!mm) return null;   // smaller markets: kbx_404.js keeps the 301 to the English file
  if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
  const key = 'm|' + lang + '|' + mm.mk; let pg = D.body.get(key); if (!pg) { pg = marketPage(D, mm, lang); D.body.set(key, pg); }
  return render(req, lang, pg, await shell(pre(lang) + '/how-we-score/'));
}
async function render(req, lang, pg, sh) {
  const url = ORIGIN + pre(lang) + pg.path, alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + pg.path + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + pg.path + '">';
  const tags = '<title>' + esc(pg.title) + ([...pg.title].length + 11 <= 60 ? ' | Kolaboro' : '') + '</title><meta name="description" content="' + esc(pg.desc) + '"><link rel="canonical" href="' + url + '">' + alts + '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">' +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="Kolaboro"><meta property="og:title" content="' + esc(pg.title) + '"><meta property="og:description" content="' + esc(pg.desc) + '"><meta property="og:url" content="' + url + '"><meta property="og:image" content="' + ORIGIN + '/og.png"><meta name="twitter:card" content="summary_large_image">' +
    '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@graph': pg.ld }).replace(/</g, '\\u003c') + '</script>' + CSS;
  const res = new HTMLRewriter()
    .on('html', { element(e) { e.setAttribute('lang', lang); if (lang === 'ar') e.setAttribute('dir', 'rtl'); else e.removeAttribute('dir'); } })
    .on('title', { element(e) { e.remove(); } })
    .on('meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
    .on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(pg.body, { html: true }); } })
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + pg.path); } })
    .transform(new Response(sh.body, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
  return new Response(req.method === 'HEAD' ? null : await res.text(), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600', 'last-modified': new Date(pg.lm + 'T00:00:00Z').toUTCString() } });
}
export { marketPage, mdata, questions, hubParts, buyerPage };   // for the local test
