// kolaboro.com batch 31 (n31s, 18 Nov 2026): SEO and AI items of the 300 list. No model calls, no keys, nothing stored.
// Strings: /data/n31s-i18n.json (moved out of the worker on 18 Nov 2026, Pages 25 MiB limit).
//   GET /<lang>/tools/                      item 186: the /tools/ hub in 7 more languages (built from the English hub, so a tool
//                                           added there shows up here at once, in English until it is translated)
//   GET /<lang>/glossary/                   item 186: the glossary in 7 more languages
//   enStatic(u, r, env)                     items 186 and 205: hreflang on the English /tools/ and /glossary/, and on /glossary/ (all
//                                           languages) up to 3 real project pages per term, quoting the fact as recorded there
//   GET /[<lang>/]reports/month/            item 209: figures of the month, same address every month (from /data/progress.json and
//                                           /data/named.json), with earlier months
//   GET /[<lang>/]docs/                     items 228 and 230: Kolaboro for developers (API, MCP, widget, SDK, webhooks, open data)
//                                           with curl, Python and JavaScript examples that answer today without a key
//   GET /projects/<slug>.md                 item 226: the project's markdown answer file (same as /answers/<slug>.md), canonical
//                                           Link header to the project page
//   GET /engineering/notes/[<post>/]        item 212: engineering notes on how the checks work (English)
//   inject(req, u, env, r)                  items 184, 213, 217: on place hubs (guides, handover by place, transparency by place) the
//                                           most searched project pages of the place; Atom/JSON feed links in the head and a visible
//                                           "Follow changes" line; one dated, citable sentence under the h1 of handover and ranking hubs
// Rules kept: facts with source and date; Sumba, Eco Beach City and Equinox never listed; 8 languages, Arabic RTL; no Review schema.
import * as N from './kbx_named.js';
import { mkName } from './kbx_hdate.js';
import { TR_PLACES } from './kbx_tr_places.js';

const ORIGIN = 'https://kolaboro.com';
// strings live in /data/n31s-i18n.json (static asset, read once per isolate) to keep the worker bundle small
let S = { en: {} }, TOOLS = {}, GL = {}, I18N = false;
async function loadI18n(env) {
  if (I18N) return true;
  let j = null;
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/n31s-i18n.json')); if (r.ok) j = await r.json(); } catch (e) {}
  if (!j) { try { const r = await fetch(ORIGIN + '/data/n31s-i18n.json', { cf: { cacheTtl: 300 } }); if (r.ok) j = await r.json(); } catch (e) {} }
  if (j && j.S) { S = j.S; TOOLS = j.TOOLS || {}; GL = j.GL || {}; I18N = true; }
  return I18N;
}
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const COI_RX = /eco\s*beach\s*city|\bequinox\b/i;
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const t = (lang, k, v) => { let s = (S[lang] && S[lang][k]) || S.en[k] || k; if (v) s = s.replace(/\{(\w+)\}/g, (m, a) => v[a] != null ? v[a] : m); return s; };
const nmf = (lang, d) => new Intl.NumberFormat(lang === 'en' ? 'en-GB' : lang === 'zh' ? 'zh-CN' : lang, { maximumFractionDigits: d || 0, numberingSystem: 'latn' });
const num = (v, lang, d) => { try { return nmf(lang, d).format(v); } catch (e) { return String(v); } };
const fdt = (d, lang) => N.fd(String(d).slice(0, 10), lang);
const monthName = (ym, lang) => { try { return new Date(ym + '-15T00:00:00Z').toLocaleDateString(lang === 'en' ? 'en-GB' : lang === 'zh' ? 'zh-CN' : lang, { month: 'long', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }); } catch (e) { return ym; } };
const slugA = s => String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const N31S_V = 'n31s1';
export const PATHS = /^\/(?:es|de|fr|nl|ru|zh|ar)\/(?:tools|glossary)\/?$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:docs|reports\/month)\/?$|^\/engineering\/notes(?:\/[a-z0-9-]{3,60})?\/?$|^\/projects\/[a-z0-9-]{1,90}\.md$/;
const html = (b, cc) => new Response(b, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': cc || 'public, max-age=600' } });

const MEMO = {};
async function asset(env, path, kind, ttl) {
  const m = MEMO[path]; if (m && Date.now() - m.t < (ttl || 600000)) return m.v;
  let v = null;
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + path)); if (r.ok) v = kind === 'json' ? await r.json() : await r.text(); } catch (e) { v = null; }
  MEMO[path] = { t: Date.now(), v }; return v;
}
const CSS = '<style>.n31 h2{margin:32px 0 10px}.n31 .k-table-wrap{overflow-x:auto;margin:10px 0 18px}.n31 table{width:100%;border-collapse:collapse;min-width:480px}.n31 th,.n31 td{padding:8px 10px;border-bottom:1px solid var(--k-line,#d5dbd8);text-align:start;vertical-align:top}.n31 td.k-n,.n31 th.k-n{text-align:end;font-variant-numeric:tabular-nums}.n31 pre{overflow-x:auto;background:var(--k-sunken,#f3f5f4);border:1px solid var(--k-line,#d5dbd8);border-radius:8px;padding:12px;font-size:.86rem;line-height:1.45;white-space:pre;max-width:100%}.n31 .n31-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin:14px 0}.n31 .n31-g>div{border:1px solid var(--k-line,#d5dbd8);border-radius:10px;padding:14px}.n31 .n31-g h3{margin:0 0 6px;font-size:1.05rem}.n31 .n31-s{font-size:.9rem;color:var(--k-muted,#56636F)}.n31 dl.glossary .gl{margin:0 0 18px}.n31-ex{font-size:.92rem;margin:6px 0 0;padding-inline-start:18px}.n31-ex li{margin:3px 0}.n31-ex q{color:var(--k-muted,#56636F)}</style>';
async function page(shell, lang, o) {
  const sh = await shell(pre(lang) + '/how-we-score/'); if (!sh || sh.status !== 200) return null;
  const crumb = '<p class="crumb"><a href="' + pre(lang) + '/">Kolaboro</a>' + (o.crumb || []).map(([h, l]) => ' / ' + (h ? '<a href="' + h + '">' + esc(l) + '</a>' : esc(l))).join('') + '</p>';
  const body = (o.head || '') + '<section class="phero kp"><div class="wrap">' + crumb + '<h1>' + esc(o.h1) + '</h1><p class="lead">' + esc(o.lead) + '</p>' + (o.hero || '') + '</div></section><div class="wrap kwrap n31"' + (lang === 'ar' ? ' dir="rtl"' : '') + '>' + o.body + '</div>' + CSS;
  const pg = { title: o.title + ' | Kolaboro', desc: o.desc, canon: o.canon, body, alt: o.alt,
    ld: { '@context': 'https://schema.org', '@graph': [{ '@type': o.type || 'WebPage', name: o.title, url: o.canon, inLanguage: lang, description: o.desc, dateModified: o.mod || undefined, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } }].concat(o.ld || []) } };
  let out = await N.assemble(pg, lang, sh);
  if (o.enOnly) out = out.replace(/<link rel="alternate" hreflang="(?!en"|x-default")[^"]*" href="[^"]*">/g, '');   // English-only pages: no hreflang to other languages
  return html(out);
}
const altOf = path => l => ORIGIN + pre(l) + path;

// ------------------------------------------------------------------------------------------------ item 186: /<lang>/tools/
const ITEM_RX = /<div class="ft-f( look)?"><h3><a href="([^"]+)">([\s\S]*?)<\/a>(?:<span class="ft-tag (ok|note)">([\s\S]*?)<\/span>)?<\/h3><p>([\s\S]*?)<\/p><\/div>/g;
const TAGS = { 'In your browser': 'tag_browser', 'Photos stay on your phone': 'tag_phone', 'Live lookup': 'tag_live', 'Works offline': 'tag_offline', 'Opens after setup': 'tag_setup' };
// n35b (batch 35): price per m2 checker, private document vault, developer comparison
const T35 = { en: ['Price per m² checker', 'Private document vault', 'Compare developers'], es: ['Comprobador de precio por m²', 'Archivo privado de documentos', 'Comparar promotoras'], fr: ['Vérificateur de prix au m²', 'Coffre de documents privé', 'Comparer des promoteurs'], de: ['Preis pro m² prüfen', 'Privater Dokumententresor', 'Bauträger vergleichen'], nl: ['Prijs per m² controleren', 'Privé documentenkluis', 'Ontwikkelaars vergelijken'], ru: ['Проверка цены за м²', 'Личный сейф документов', 'Сравнение застройщиков'], zh: ['每平方米价格检查', '私人文件保险箱', '比较开发商'], ar: ['فاحص سعر المتر المربع', 'خزنة مستندات خاصة', 'قارن بين المطوّرين'] };
const T34 = { en: ['Due-diligence report builder', 'Search all projects with filters', 'Compare markets'], es: ['Generador de informe de due diligence', 'Buscar proyectos con filtros', 'Comparar mercados'], fr: ['Générateur de rapport de due diligence', 'Rechercher des projets avec filtres', 'Comparer des marchés'], de: ['Due-Diligence-Bericht erstellen', 'Projekte mit Filtern suchen', 'Märkte vergleichen'], nl: ['Due-diligencerapport samenstellen', 'Projecten zoeken met filters', 'Markten vergelijken'], ru: ['Конструктор отчёта due diligence', 'Поиск проектов с фильтрами', 'Сравнить рынки'], zh: ['尽职调查报告生成器', '带筛选搜索项目', '比较市场'], ar: ['منشئ تقرير العناية الواجبة', 'البحث في المشاريع مع مرشحات', 'مقارنة الأسواق'] };   // n34b (batch 34)
const LOCAL_TOOLS = new Set(['/tools/bulk-check/', '/tools/contract-addendum/', '/tools/contract-reader/', '/tools/permit-photo/', '/tools/widget/', '/tools/total-cost/dubai/']);   // tool pages that exist in all 8 languages (checked 18 Nov 2026)
export function toolsParse(src) {
  const m = /<main[^>]*>([\s\S]*?)<\/main>/.exec(src || ''); if (!m) return null;
  const main = m[1], css = (/<link rel="stylesheet" href="(\/tools\/ft\.css[^"]*)"/.exec(src) || [])[1] || '/tools/ft.css';
  const G = []; const gr = /<p class="eyebrow" role="heading" aria-level="2" id="([a-z]+)"[^>]*>[^<]*<\/p>\s*<div class="ft-method"[^>]*>([\s\S]*?)<\/div>\s*(?=<p class="eyebrow"|<\/div><\/section>)/g; let g;
  while ((g = gr.exec(main))) { const L = []; let it; ITEM_RX.lastIndex = 0; while ((it = ITEM_RX.exec(g[2]))) L.push({ look: !!it[1], href: it[2], name: it[3], tc: it[4], tag: it[5], desc: it[6] }); G.push({ id: g[1], L }); }
  return { G, css };
}
async function toolsHub(u, env, shell, lang) {
  const src = await asset(env, '/tools/', 'text'); const P = toolsParse(src); if (!P || !P.G.length) return null;
  let untr = 0, LT = LOCAL_TOOLS;
  try { LT = new Set([...LOCAL_TOOLS, ...(await (await import('./kbx_n32t.js')).localSet(env, lang))]); } catch (e) {}   // n32t: tool pages translated by kbx_n32t.js
  const grp = P.G.map((g, gi) => '<p class="eyebrow" role="heading" aria-level="2" id="' + g.id + '"' + (gi ? ' style="margin-top:40px"' : '') + '>' + esc(t(lang, 'g_' + g.id)) + '</p><div class="ft-method" style="margin-top:12px">' + g.L.map(x => {
    const tr = (TOOLS[x.href] || {})[lang]; if (!tr) untr++;
    const href = LT.has(x.href) ? pre(lang) + x.href : x.href, en = !LT.has(x.href);
    const tag = x.tag ? '<span class="ft-tag ' + x.tc + '">' + esc(TAGS[x.tag] ? t(lang, TAGS[x.tag]) : x.tag) + '</span>' : '';
    return '<div class="ft-f' + (x.look ? ' look' : '') + '"><h3><a href="' + href + '"' + (en ? ' hreflang="en"' : '') + '>' + (tr ? esc(tr[0]) : x.name) + '</a>' + tag + '</h3><p>' + (tr ? esc(tr[1]) : x.desc) + (en ? ' <span class="n31-s">(' + esc(t(lang, 'inen')) + ')</span>' : '') + '</p></div>';
  }).join('') + '</div>').join('');
  const jump = '<nav class="ft-jump" aria-label="' + esc(t(lang, 't_groups')) + '">' + P.G.map(g => '<a href="#' + g.id + '">' + esc(t(lang, 'g_' + g.id)) + ' <small>' + g.L.length + '</small></a>').join('') + '</nav>';
  const n = P.G.reduce((a, g) => a + g.L.length, 0);
  return page(shell, lang, { title: t(lang, 't_title'), desc: t(lang, 't_desc'), h1: t(lang, 't_title'), lead: t(lang, 't_lead'), canon: ORIGIN + pre(lang) + '/tools/', alt: altOf('/tools/'),
    crumb: [[null, t(lang, 'tools')]], head: '<link rel="stylesheet" href="' + esc(P.css) + '">', hero: '<p class="k-small"><a href="' + pre(lang) + '/tools/widget/">' + esc(t(lang, 't_widget')) + '</a>' + (T34[lang] || T34.en).map((x, i) => ' · <a href="' + pre(lang) + ['/tools/due-diligence/', '/search/', '/markets/compare/'][i] + '">' + esc(x) + '</a>').join('') + (T35[lang] || T35.en).map((x, i) => ' · <a href="' + pre(lang) + ['/tools/price-per-m2/', '/tools/vault/', '/developers/compare/'][i] + '">' + esc(x) + '</a>').join('') + '</p>' + jump,   // n34b, n35b
    body: '<section class="ft-sec">' + grp + '</section><!-- n31s tools ' + n + ', untranslated ' + untr + ' -->',
    type: 'CollectionPage' });
}

// ------------------------------------------------------------------------------------------------ items 186 and 205: glossary
const GL_RX = {
  escrow: [/\bescrow\b/i], 'certid-o-permanente': [/certid[aã]o/i], ejido: [/\bejido/i, 'Mexico'], fideicomiso: [/fideicomiso/i, 'Mexico'], 'foreign-quota-thailand': [/foreign (?:freehold )?quota/i, 'Thailand'],
  freehold: [/\bfreehold\b/i], 'hak-guna-bangunan-hgb': [/\bHGB\b|Hak Guna Bangunan/], 'hak-milik-shm': [/\bSHM\b|Hak Milik/], 'hak-pakai': [/Hak Pakai/i], leasehold: [/\bleasehold\b/i],
  'milestone-payment': [/\bmilestones?\b|construction[- ]linked|tied to construction/i], nif: [/\bNIF\b/], oqood: [/\boqood\b/i], pbg: [/\bPBG\b/], ppat: [/\bPPAT\b/], 'pt-pma': [/\bPT\.? ?PMA\b/i],
  'rental-yield': [/\byields?\b/i], rera: [/\bRERA\b/, 'UAE'], slf: [/\bSLF\b/], snagging: [/\bsnag/i], zoning: [/\bzon(?:ing|ed)\b/i]
};
let GX = null;
async function glossaryExamples(env) {
  const ix = await N.data(env); if (GX && GX.ix === ix) return GX.M;
  let top = []; try { const T = (await import('./kbx_g27.js')).TOP_IDS; top = Array.isArray(T) ? T : String(T).split(/\s+/); } catch (e) {}
  const rank = new Map(top.map((id, i) => [id, i]));
  const P = ix.P.filter(x => x.n && !COI_RX.test(x.n + ' ' + x.dv)).sort((a, b) => (rank.has(a.id) ? rank.get(a.id) : 1e6) - (rank.has(b.id) ? rank.get(b.id) : 1e6) || String(a.id).localeCompare(b.id));
  const M = new Map();
  for (const [k, [rx, co]] of Object.entries(GL_RX)) {
    const L = [], mks = new Set();
    const neg = new RegExp('\\b(?:no|not|none|without|lacks?|missing)\\b[^.;:]{0,40}(?:' + rx.source + ')', 'i');
    for (const pass of [0, 1]) for (const x of P) {   // pass 0: the term stated; pass 1 (only if needed): the term said to be missing
      if (L.length >= 3) break;
      if (co && x.co !== co) continue; if (L.some(e => e.s === x.s)) continue;
      const parts = [].concat(x.dl || [], Object.values(x.ev || {})).filter(s => typeof s === 'string');
      const hit = parts.find(s => rx.test(s) && !N.OPINION_RX.test(s) && (pass === 1 || !neg.test(s))); if (!hit) continue;
      if (mks.has(x.mk) && L.length < 2) continue;   // spread across places first
      const i = hit.search(rx); let a = Math.max(0, i - 60), b = Math.min(hit.length, i + 90);
      while (a > 0 && hit[a - 1] !== ' ') a--; while (b < hit.length && hit[b] !== ' ') b++;
      L.push({ s: x.s, n: x.n, mk: x.mk, q: (a > 0 ? '... ' : '') + hit.slice(a, b).trim() + (b < hit.length ? ' ...' : '') }); mks.add(x.mk);
    }
    if (L.length) M.set(k, L);
  }
  GX = { ix, M }; return M;
}
const exHtml = (L, lang) => L && L.length ? '<ul class="n31-ex" aria-label="' + esc(t(lang, 'gl_ex')) + '"><li><b>' + esc(t(lang, 'gl_ex')) + '</b></li>' + L.map(e => '<li><a href="' + pre(lang) + '/projects/' + e.s + '/"><bdi>' + esc(e.n) + '</bdi></a> (<bdi>' + esc(mkName(e.mk, lang)) + '</bdi>): <q lang="en">' + esc(e.q) + '</q></li>').join('') + '</ul>' : '';
const GL_MORE = { escrow: ['/glossary/escrow/', 'gl_m_escrow'], freehold: ['/glossary/leasehold/', 'gl_m_lease'], leasehold: ['/glossary/leasehold/', 'gl_m_lease'], 'milestone-payment': ['/glossary/payment-plan/', 'gl_m_plan'] };
async function glossaryPage(u, env, shell, lang) {
  const src = await asset(env, '/glossary/', 'text'); if (!src) return null;
  const E = []; const rx = /<div class="gl" id="([^"]+)"><dt>([\s\S]*?)<\/dt><dd>([\s\S]*?)<\/dd><\/div>/g; let m;
  while ((m = rx.exec(src))) E.push({ id: m[1], dt: m[2], dd: m[3] });
  if (!E.length) return null;
  let X = new Map(); try { X = await glossaryExamples(env); } catch (e) {}
  const rows = E.map(e => { const tr = (GL[e.id] || {})[lang], mo = GL_MORE[e.id];
    return '<div class="gl" id="' + e.id + '"><dt>' + (tr ? esc(tr[0]) : e.dt) + '</dt><dd>' + (tr ? esc(tr[1]) : e.dd.replace(/<a [^>]*>[\s\S]*?<\/a>/g, '')) + (mo ? ' <a href="' + pre(lang) + mo[0] + '">' + esc(t(lang, mo[1])) + '</a>' : '') + exHtml(X.get(e.id), lang) + '</dd></div>'; }).join('');
  const terms = E.map(e => { const tr = (GL[e.id] || {})[lang]; return { '@type': 'DefinedTerm', name: tr ? tr[0] : e.dt.replace(/<[^>]+>/g, ''), description: tr ? tr[1] : e.dd.replace(/<[^>]+>/g, '').trim(), url: ORIGIN + pre(lang) + '/glossary/#' + e.id }; });
  return page(shell, lang, { title: t(lang, 'gl_title'), desc: t(lang, 'gl_desc'), h1: t(lang, 'gl_title'), lead: t(lang, 'gl_lead'), canon: ORIGIN + pre(lang) + '/glossary/', alt: altOf('/glossary/'),
    crumb: [[null, t(lang, 'gloss')]], body: '<dl class="glossary">' + rows + '</dl><p class="n31-s">' + esc(t(lang, 'gl_ex_note')) + '</p>', type: 'DefinedTermSet',
    ld: [{ '@type': 'DefinedTermSet', '@id': ORIGIN + pre(lang) + '/glossary/#terms', name: t(lang, 'gl_title'), hasDefinedTerm: terms }] });
}
// the English static /tools/ and /glossary/: hreflang to the 7 new languages, and the project examples on /glossary/
export async function enStatic(u, r, env) {
  if (!(await loadI18n(env))) return r;
  if (!r || r.status !== 200 || !/text\/html/.test(r.headers.get('content-type') || '')) return r;
  const p = u.pathname, alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + p + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + p + '">';
  let rw = new HTMLRewriter().on('link[rel="alternate"][hreflang]', { element(e) { e.remove(); } }).on('head', { element(e) { e.append(alts, { html: true }); } });
  if (p === '/glossary/') {
    let X = new Map(); try { X = await glossaryExamples(env); } catch (e) {}
    let gid = null; rw = rw.on('div.gl', { element(e) { gid = e.getAttribute('id'); } }).on('div.gl > dd', { element(e) { const h = exHtml(X.get(gid), 'en'); if (h) e.append(h, { html: true }); } })   // n35b: inside the <dd> (a list directly in the dl group failed axe definition-list).on('dl.glossary', { element(e) { e.after('<p class="n31-s" style="font-size:.9rem;color:var(--k-muted,#56636F)">' + esc(t('en', 'gl_ex_note')) + '</p><style>.n31-ex{font-size:.92rem;margin:6px 0 0;padding-inline-start:18px}.n31-ex li{margin:3px 0}.n31-ex q{color:var(--k-muted,#56636F)}</style>', { html: true }); } });
  }
  return rw.transform(r);
}

// ------------------------------------------------------------------------------------------------ item 209: figures of the month
async function monthPage(u, env, shell, lang) {
  const [pr, ix] = await Promise.all([asset(env, '/data/progress.json', 'json'), N.data(env)]);
  const days = ((pr && pr.days) || []).filter(d => d && d.d).sort((a, b) => a.d.localeCompare(b.d)); if (!days.length) return null;
  const now = days[days.length - 1], mo = now.d.slice(0, 7), first = days.find(d => d.d.slice(0, 7) === mo) || now, moN = monthName(mo, lang);
  const P = ix.P.filter(x => !COI_RX.test(String(x.n) + ' ' + String(x.dv)));
  let permit = 0, hand = 0, over = 0, rev = 0, added = 0; const today = new Date();
  for (const x of P) { const c = ix.caseBy.get(x.id) || {}; if ((c.checks || {}).permit === 2) permit++; if (N.handoverOf(ix, x)) hand++; if (N.overdueOf(ix, x, today)) over++; if (x.rw) rev++; if (String(x.ad || '').slice(0, 7) === mo) added++; }
  const pc = v => num(v / P.length * 100, lang, 1) + ' %';
  const ch = (a, b) => { if (a == null || b == null) return '-'; const d = a - b; return (d > 0 ? '+' : d < 0 ? '−' : '') + num(Math.abs(d), lang); };
  const K = [['m_projects', 'projects'], ['m_markets', 'markets'], ['m_countries', 'countries'], ['m_sources', 'sources'], ['m_claims', 'claims_total'], ['m_urls', 'sitemap_urls']];
  const t1 = '<div class="k-table-wrap"><table><thead><tr><th scope="col"></th><th scope="col" class="k-n">' + esc(t(lang, 'm_now')) + ' (' + esc(fdt(now.d, lang)) + ')</th><th scope="col" class="k-n">' + esc(t(lang, 'm_start', { d: fdt(first.d, lang) })) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'm_ch')) + '</th></tr></thead><tbody>' +
    K.map(([l, k]) => '<tr><th scope="row">' + esc(t(lang, l)) + '</th><td class="k-n">' + (now[k] != null ? num(now[k], lang) : '-') + '</td><td class="k-n">' + (first[k] != null ? num(first[k], lang) : '-') + '</td><td class="k-n">' + ch(now[k], first[k]) + '</td></tr>').join('') + '</tbody></table></div>';
  const Q = [['m_permit', permit], ['m_hand', hand], ['m_over', over], ['m_rev', rev]];
  const t2 = '<div class="k-table-wrap"><table><tbody>' + Q.map(([l, v]) => '<tr><th scope="row">' + esc(t(lang, l)) + '</th><td class="k-n">' + num(v, lang) + '</td><td class="k-n">' + pc(v) + '</td></tr>').join('') +
    '<tr><th scope="row">' + esc(t(lang, 'm_added', { mo: moN })) + '</th><td class="k-n">' + num(added, lang) + '</td><td class="k-n"></td></tr></tbody></table></div><p class="n31-s">' + esc(t(lang, 'm_share', { n: num(P.length, lang) })) + ' <a href="' + pre(lang) + '/handover/overdue/">/handover/overdue/</a> · <a href="' + pre(lang) + '/methods/handover-slippage/">/methods/handover-slippage/</a> · <a href="' + pre(lang) + '/numbers/">/numbers/</a></p>';
  const byMo = new Map(); for (const d of days) byMo.set(d.d.slice(0, 7), d);
  const past = [...byMo.entries()].filter(([m]) => m !== mo).reverse();
  const t3 = past.length ? '<div class="k-table-wrap"><table><thead><tr><th scope="col">' + esc(t(lang, 'm_month')) + '</th>' + K.map(([l]) => '<th scope="col" class="k-n">' + esc(t(lang, l)) + '</th>').join('') + '</tr></thead><tbody>' + past.map(([m, d]) => '<tr><th scope="row">' + esc(monthName(m, lang)) + ' (' + esc(fdt(d.d, lang)) + ')</th>' + K.map(([, k]) => '<td class="k-n">' + (d[k] != null ? num(d[k], lang) : '-') + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>' : '<p>' + esc(t(lang, 'm_first')) + '</p>';
  const rd = fdt(new Date().toISOString().slice(0, 10), lang);
  const body = '<h2>' + esc(moN) + '</h2>' + t1 + '<h2>' + esc(t(lang, 'm_quality')) + '</h2>' + t2 + '<h2>' + esc(t(lang, 'm_hist')) + '</h2><p class="n31-s">' + esc(t(lang, 'm_hist_p')) + '</p>' + t3 +
    '<p class="n31-s">' + esc(t(lang, 'm_src', { d: rd })) + ' <a href="/data/progress.json">progress.json</a> · <a href="/data/named.json">named.json</a></p><p class="n31-s" id="cite">' + esc(t(lang, 'm_cite', { mo: moN, d: rd })) + ' <a href="' + pre(lang) + '/cite/">/cite/</a></p>';
  return page(shell, lang, { title: t(lang, 'm_title', { mo: moN }), desc: t(lang, 'm_desc', { mo: moN }), h1: t(lang, 'm_title', { mo: moN }), lead: t(lang, 'm_lead'), canon: ORIGIN + pre(lang) + '/reports/month/', alt: altOf('/reports/month/'),
    crumb: [[pre(lang) + '/reports/', t(lang, 'reports')], [null, moN]], body, mod: now.d, type: 'Report',
    ld: [{ '@type': 'Dataset', name: t(lang, 'm_title', { mo: moN }), description: t(lang, 'm_lead') || t(lang, 'm_title', { mo: moN }), url: ORIGIN + pre(lang) + '/reports/month/', license: 'https://creativecommons.org/licenses/by/4.0/', creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, dateModified: now.d, temporalCoverage: mo, distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/data/progress.json' }] }] });
}

// ------------------------------------------------------------------------------------------------ items 228 and 230: /docs/
function codeBlocks(slug) {
  const p = 'https://kolaboro.com/api/v1/projects/' + slug, c = 'https://kolaboro.com/api/v1/changes?since=2026-11-01', s = 'https://kolaboro.com/api/v1/slippage';
  return [
    ['d_ex1', 'curl -s ' + p + '\n', 'import json, urllib.request\n\nwith urllib.request.urlopen("' + p + '") as r:\n    p = json.load(r)\nprint(p["name"], p["developer"]["name"])\n', 'const r = await fetch("' + p + '");\nconst p = await r.json();\nconsole.log(p.name, p.developer.name);\n'],
    ['d_ex2', 'curl -s "' + c + '"\n', 'import json, urllib.request\n\nurl = "' + c + '"\nwhile url:\n    with urllib.request.urlopen(url) as r:\n        page = json.load(r)\n    for ch in page.get("changes", []):\n        print(ch.get("at"), ch.get("id"))\n    url = page.get("next") if page.get("has_more") else None\n', 'let url = "' + c + '";\nwhile (url) {\n  const page = await (await fetch(url)).json();\n  for (const ch of page.changes || []) console.log(ch.at, ch.id);\n  url = page.has_more ? page.next : null;\n}\n'],
    ['d_ex3', 'curl -s ' + s + '\n', 'import json, urllib.request\n\nwith urllib.request.urlopen("' + s + '") as r:\n    d = json.load(r)\nprint(d["method"])\n', 'const d = await (await fetch("' + s + '")).json();\nconsole.log(d.method);\n']
  ];
}
async function docsPage(u, env, shell, lang) {
  const P = lang === 'en' ? '' : pre(lang);
  const card = (h, p, links) => '<div><h3>' + esc(h) + '</h3><p>' + esc(p) + '</p><p class="n31-s">' + links.map(([href, l, en]) => '<a href="' + href + '"' + (en && lang !== 'en' ? ' hreflang="en"' : '') + '>' + esc(l) + '</a>').join(' · ') + (h === t(lang, 'd_mcp') ? ' · <code dir="ltr">https://kolaboro.com/mcp</code>' : '') + '</p></div>';
  const cards = '<div class="n31-g">' +
    card(t(lang, 'd_api'), t(lang, 'd_api_p'), [[P + '/api/docs/', '/api/docs/'], ['/api/v1/openapi.json', 'openapi.json'], [P + '/data/snapshots/', '/data/snapshots/']]) +
    card(t(lang, 'd_mcp'), t(lang, 'd_mcp_p'), [['/docs/mcp/', '/docs/mcp/', 1]]) +
    card(t(lang, 'd_wid'), t(lang, 'd_wid_p'), [[P + '/tools/widget/', '/tools/widget/']]) +
    card(t(lang, 'd_sdk'), t(lang, 'd_sdk_p'), [['/docs/sdk/', '/docs/sdk/', 1]]) +
    card(t(lang, 'd_hook'), t(lang, 'd_hook_p'), [['/docs/webhooks/', '/docs/webhooks/', 1]]) +
    card(t(lang, 'd_open'), t(lang, 'd_open_p'), [['/docs/api/', '/docs/api/', 1], ['/data/named.json', 'named.json'], ['/llms.txt', 'llms.txt']]) + '</div>';
  const ex = codeBlocks('amani-melasti').map(([k, sh, py, js]) => '<h3>' + esc(t(lang, k)) + '</h3><p class="n31-s">curl</p><pre dir="ltr"><code>' + esc(sh) + '</code></pre><p class="n31-s">Python 3</p><pre dir="ltr"><code>' + esc(py) + '</code></pre><p class="n31-s">JavaScript (browser, Node 18+, Deno)</p><pre dir="ltr"><code>' + esc(js) + '</code></pre>').join('');
  const body = cards + '<h2 id="examples">' + esc(t(lang, 'd_ex')) + '</h2><p>' + esc(t(lang, 'd_ex_p')) + '</p>' + ex + '<p class="n31-s">' + esc(t(lang, 'd_lim')) + '</p>';
  return page(shell, lang, { title: t(lang, 'd_title'), desc: t(lang, 'd_desc'), h1: t(lang, 'd_title'), lead: t(lang, 'd_lead'), canon: ORIGIN + pre(lang) + '/docs/', alt: altOf('/docs/'), crumb: [[null, t(lang, 'docs')]], body, type: 'TechArticle' });
}

// ------------------------------------------------------------------------------------------------ item 212: engineering notes (English)
const NOTES = [
  { s: 'overdue-handovers', d: '2026-11-18', h: 'How we decide that a handover date has passed', l: 'The rule behind the overdue notices, the monthly overdue report and the slippage statistics, and what it cannot tell you.',
    b: () => '<p>Every project page shows the handover date we hold on record, with its source. A date is a month, a quarter, a half or a year, as the developer or listing printed it. To compare it with today we turn it into its <b>last</b> month: a year counts from December, a quarter from its third month ("Q3 2026" ends in September 2026), a half from June or December. Giving the developer the whole period means we never call a date passed too early.</p>' +
      '<p>A date has <b>passed</b> when that last month is before the current month and the project is not recorded as completed. A promise recorded as kept is also left out. The number of months past is the current month minus that last month. The same function feeds the notice at the top of a project page, its quick answer and title, and the <a href="/handover/overdue/">overdue report by place</a>, so the figures cannot disagree between pages.</p>' +
      '<p>The <a href="/methods/handover-slippage/">handover slippage statistics</a> use a stricter starting point: the <b>first</b> date on record (the developer\'s original date where our research found one), so a date moved later does not hide lateness. When two sources were read on the same day with different dates, the later one is used, so lateness is not overstated. Medians and quartiles are shown for a market only from 5 projects past their first date.</p>' +
      '<p><b>Limits.</b> We hold the dates developers and listings published, not the contracts. A project past its first date may be on time against a later date the developer announced; the project page shows both. We have no completion date for completed projects, so they are counted but not measured. Finished projects that stopped marketing are under-represented, because we track projects being sold now.</p>' },
  { s: 'sitemaps-and-crawlers', d: '2026-11-18', h: 'How we choose and check the URLs in our sitemaps', l: 'Which pages we list for search engines, how we check that each one answers, and how we test that crawlers and answer engines can read them.',
    b: c => '<p>Every page stays reachable, but the sitemaps list only pages with something of their own: project pages with at least two of six basic facts, developer pages, place and market files, rankings, guides and data pages. A page is never marked noindex because it is thin; we add data to it instead. Each URL carries the date its content last changed (lastmod), computed from the data behind the page, not the date of the build.</p>' +
      (c && c.crawl ? '<p><b>Every URL answers.</b> On ' + esc(c.crawl.checked_at) + ' we requested ' + (c.crawl.sampled ? 'a random sample of ' + nmf('en').format(c.crawl.urls) + ' of the ' + nmf('en').format(c.crawl.listed_urls) + ' URLs' : 'all ' + nmf('en').format(c.crawl.urls) + ' URLs') + ' listed in our ' + c.crawl.sitemaps + ' sitemaps, a few at a time: ' + Object.entries(c.crawl.status_counts).map(([k, v]) => nmf('en').format(v) + ' answered ' + esc(k)).join(', ') + '. ' + (c.crawl.without_lastmod ? nmf('en').format(c.crawl.without_lastmod) + ' URLs had no lastmod. ' : 'Every URL had a lastmod. ') + (c.crawl.not_200 && c.crawl.not_200.length ? 'The ones that did not answer 200 are listed in <a href="/data/seo-checks.json">/data/seo-checks.json</a> and are being fixed.' : '') + '</p>' : '') +
      (c && c.nojs ? '<p><b>Without JavaScript.</b> Search engines and answer engines often read the HTML as served. For the pages added on 17 and 18 November 2026 in 8 languages we fetched the raw HTML and checked that the title, the description, the h1, the canonical link and the main text are there before any script runs: ' + nmf('en').format(c.nojs.ok) + ' of ' + nmf('en').format(c.nojs.n) + ' pages passed' + (c.nojs.fail && c.nojs.fail.length ? '; the others are listed in <a href="/data/seo-checks.json">/data/seo-checks.json</a>' : '') + '.</p>' : '') +
      (c && c.crawlers ? '<p><b>AI crawlers are not blocked.</b> Our <a href="/robots.txt">robots.txt</a> allows every crawler on public pages. On ' + esc(c.crawlers.checked_at) + ' we requested the home page, a project page, /llms.txt, an answer file and the open dataset with the user agents of ' + c.crawlers.agents.map(esc).join(', ') + ': ' + (c.crawlers.blocked ? nmf('en').format(c.crawlers.blocked) + ' requests were refused.' : 'all answered 200.') + ' This tests our rules and the edge in front of the site, not the IP checks a crawler operator may run.</p>' : '') +
      '<p>Visits by AI crawlers per day and by page type are counted at the edge without storing anything about the visitor; see <a href="/engineering/#ai-crawlers">/engineering/</a>.</p>' }
];
async function notesPage(u, env, shell) {
  const m = /^\/engineering\/notes(?:\/([a-z0-9-]{3,60}))?\/?$/.exec(u.pathname), s = m && m[1];
  if (s) {
    const n = NOTES.find(x => x.s === s); if (!n) return null;
    const c = await asset(env, '/data/seo-checks.json', 'json', 300000);
    return page(shell, 'en', { title: n.h, desc: n.l, h1: n.h, lead: n.l, canon: ORIGIN + '/engineering/notes/' + s + '/', alt: () => ORIGIN + '/engineering/notes/' + s + '/', enOnly: true, crumb: [['/engineering/', 'Engineering'], ['/engineering/notes/', 'Notes'], [null, n.h]],
      body: '<p class="n31-s">' + esc(fdt(n.d, 'en')) + '</p>' + n.b(c) + '<p class="n31-s"><a href="/engineering/notes/">All engineering notes</a></p>', type: 'TechArticle', mod: n.d,
      ld: [{ '@type': 'TechArticle', headline: n.h, datePublished: n.d, dateModified: n.d, author: { '@type': 'Organization', name: 'Kolaboro' }, url: ORIGIN + '/engineering/notes/' + s + '/' }] });
  }
  return page(shell, 'en', { title: 'Engineering notes', desc: 'How Kolaboro works under the hood: the rules behind overdue handovers and slippage, and how sitemaps and crawler access are checked.', h1: 'Engineering notes', lead: 'How the checks work, written down with their rules and limits.', canon: ORIGIN + '/engineering/notes/', alt: () => ORIGIN + '/engineering/notes/', enOnly: true, crumb: [['/engineering/', 'Engineering'], [null, 'Notes']],
    body: '<ul>' + NOTES.map(n => '<li><a href="/engineering/notes/' + n.s + '/">' + esc(n.h) + '</a> <span class="n31-s">(' + esc(fdt(n.d, 'en')) + ')</span><br>' + esc(n.l) + '</li>').join('') + '</ul>', type: 'CollectionPage' });
}

// ------------------------------------------------------------------------------------------------ items 184, 213, 217: hub additions
const GUIDE = { bali: ['Bali'], dubai: ['Dubai'], phuket: ['Phuket'], 'costa-del-sol': ['Costa del Sol'], lisbon: ['Portugal'], cyprus: ['Cyprus'], miami: ['Miami'], tulum: ['Riviera Maya'] };
let TOPM = null;
async function topByMk(env) {
  const ix = await N.data(env); if (TOPM && TOPM.ix === ix) return TOPM.M;
  let ids = []; try { const T = (await import('./kbx_g27.js')).TOP_IDS; ids = Array.isArray(T) ? T : String(T).split(/\s+/); } catch (e) {}
  const M = new Map(); for (const id of ids) { const x = ix.byId.get(id); if (!x || COI_RX.test(String(x.n) + ' ' + String(x.dv))) continue; if (!M.has(x.mk)) M.set(x.mk, []); M.get(x.mk).push(x); }
  TOPM = { ix, M }; return M;
}
function placeOf(p) {   // { mks, tr } for a place hub path (language prefix removed)
  let m;
  if ((m = /^\/guides\/buying-off-plan\/([a-z-]+)\/$/.exec(p))) { const mks = GUIDE[m[1]]; if (!mks) return null; return { mks, tr: TR_PLACES.find(P => !P.coi && !P.a && P.s === slugA(mks[0])) || TR_PLACES.find(P => !P.coi && !P.a && P.m.some(k => mks.includes(k))), name: mks[0] }; }
  if ((m = /^\/rankings\/transparency\/([a-z0-9-]+)\/$/.exec(p))) { const P = TR_PLACES.find(q => q.s === m[1] && !q.coi); return P ? { mks: P.m, tr: P, name: P.n } : null; }
  if ((m = /^\/handover\/20\d\d\/([a-z0-9-]+)\/$/.exec(p))) { const P = TR_PLACES.find(q => q.s === m[1] && !q.coi); return { slug: m[1], tr: P, mks: P ? P.m : null, name: P ? P.n : null }; }
  if ((m = /^\/m\/([^/]+)\/$/.exec(p))) { let k = m[1]; try { k = decodeURIComponent(k); } catch (e) {} const P = TR_PLACES.find(q => !q.coi && !q.a && q.s === slugA(k)) || TR_PLACES.find(q => !q.coi && !q.a && q.m.some(x => slugA(x) === slugA(k))); return { tr: P, mks: null, name: null, mOnly: true }; }
  return null;
}
export async function inject(req, u, env, r) {
  if (req.method !== 'GET' || !r || r.status !== 200 || !/text\/html/.test(r.headers.get('content-type') || '')) return r;
  if (!(await loadI18n(env))) return r;
  const lm = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(.*)$/.exec(u.pathname), lang = lm[1] || 'en', p = '/' + lm[2].replace(/\/?$/, '/');
  if (/^\/developers\//.test(p)) return r;   // developer pages keep their own feeds
  let pl = null; try { pl = placeOf(p); } catch (e) {}
  // item 213: feeds in the head and one visible line
  const wk = pl && pl.tr ? pl.tr : null;
  const head = (wk ? '<link rel="alternate" type="application/atom+xml" title="' + esc(t(lang, 'fd_place', { p: mkName(wk.n, lang) })) + '" href="/weekly/' + wk.s + '/feed.atom">' : '') + '<link rel="alternate" type="application/feed+json" title="' + esc(t(lang, 'fd_all')) + '" href="/api/v1/changes/feed.json">';
  const line = '<section class="k-sec n31-fd"><div class="wrap k-wrap"><p style="font-size:.92rem"><b>' + esc(t(lang, 'fd_h')) + ':</b> ' + (wk ? '<a href="' + pre(lang) + '/weekly/' + wk.s + '/">' + esc(t(lang, 'fd_place', { p: mkName(wk.n, lang) })) + '</a> (<a href="/weekly/' + wk.s + '/feed.atom">Atom</a>) · ' : '') + '<a href="/api/v1/changes/feed.json">' + esc(t(lang, 'fd_all')) + '</a> · <a href="/feed.xml">' + esc(t(lang, 'fd_ship')) + '</a></p></div></section>';
  // item 184: most searched project pages of the place (the /m/ files carry their own list since batch 27)
  let ms = '';
  if (pl && pl.mks && !pl.mOnly) {
    try { const M = await topByMk(env), L = [].concat(...pl.mks.map(k => M.get(k) || [])).slice(0, 24);
      if (L.length) ms = '<section class="k-sec n31-ms" id="most-searched"><div class="wrap k-wrap"><h2>' + esc(t(lang, 'ms_h', { p: mkName(pl.name || pl.mks[0], lang) })) + '</h2><p>' + esc(t(lang, 'ms_p', { p: mkName(pl.name || pl.mks[0], lang) })) + '</p><ul style="columns:3 220px;padding-inline-start:18px;margin:0">' + L.map(x => '<li style="margin:0 0 8px;break-inside:avoid"><a href="' + pre(lang) + '/projects/' + x.s + '/"><bdi>' + esc(x.n) + '</bdi></a></li>').join('') + '</ul></div></section>'; } catch (e) {}
  }
  return new HTMLRewriter().on('head', { element(e) { e.append(head, { html: true }); } }).on('main', { element(e) { e.append(ms + line, { html: true }); } }).transform(r);
}

// ------------------------------------------------------------------------------------------------ routes
export async function handle(req, u, env, ctx, shell) {
  const p = u.pathname;
  if (!/\.md$/.test(p) && !(await loadI18n(env))) return null;
  let m = /^\/projects\/([a-z0-9-]{1,90})\.md$/.exec(p);
  if (m) {
    const C = await import('./kbx_cite.js'), au = new URL('/answers/' + m[1] + '.md', u);
    const r = await C.handle(new Request(au, { method: 'GET', headers: req.headers }), au, env, ctx, shell); if (!r || r.status !== 200) return null;
    const h = new Headers(r.headers); h.set('content-type', 'text/markdown; charset=utf-8'); h.set('link', '<' + ORIGIN + '/projects/' + m[1] + '/>; rel="canonical"'); h.set('access-control-allow-origin', '*');
    return new Response(r.body, { status: 200, headers: h });
  }
  if (!p.endsWith('/')) return Response.redirect(ORIGIN + p + '/' + u.search, 301);
  m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(.*?)\/$/.exec(p); const lang = m[1] || 'en', what = m[2];
  try {
    if (what === 'tools') return await toolsHub(u, env, shell, lang);
    if (what === 'glossary') return await glossaryPage(u, env, shell, lang);
    if (what === 'reports/month') return await monthPage(u, env, shell, lang);
    if (what === 'docs') return await docsPage(u, env, shell, lang);
    if (/^engineering\/notes/.test(what)) return await notesPage(u, env, shell);
  } catch (e) { return null; }
  return null;
}
