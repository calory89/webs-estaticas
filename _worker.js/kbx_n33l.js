// kolaboro.com batch 33 (n33l, 20 Nov 2026): internal links and the language menu. Data: /data/n33l.json (built by
// open/n33l-build.py from data/named.json, the live sitemaps and today's translated footers), read once per isolate.
//   footer(lang)            items 63 and 74: the footer columns (Buyers, the 12 biggest markets, Data, About): about 40 links
//                           instead of 82; the pages that left the footer are listed on /sitemap/ (two clicks from every page)
//   msBlock(lang, path)     item 64: "Most searched this month" at the start of the home page, the hubs and the country pages:
//                           the pages behind the Google searches with the most impressions (Search Console, 28 days to 20 Nov 2026)
//   lsw / alternates        item 71: the language menu links each language version of the page itself (from the page's own
//                           hreflang links), and pages with hreflang links but no menu get one
//   GET /[<lang>/]sitemap/  item 76: HTML site map by country and market, 8 languages, Arabic RTL
//   devMarkets(...)         item 66: developer pages link the market pages of their projects
// Rules kept: Sumba, Eco Beach City and Equinox never listed (filtered in the build); no em dashes; facts with source and date.
const ORIGIN = 'https://kolaboro.com';
export const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let J = null, JP = null;
export async function load(env) {   // never caches a failure
  if (J) return J;
  if (!JP) JP = (async () => { try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/n33l.json')); if (r.ok) J = await r.json(); } catch (e) {} JP = null; return J; })();
  return JP;
}
const lab = (l, k) => (J.lab[l] && J.lab[l][k]) || J.lab.en[k] || k;
const has = (s, l) => { for (let i = 0; i < (s || '').length; i += 2) if (s.slice(i, i + 2) === l) return true; return false; };

// ------------------------------------------------------------------------------------------------ items 63, 74: footer
const FC = {};
export function footer(lang) {
  if (!J) return '';
  if (FC[lang]) return FC[lang];
  const G = J.ft[lang] || J.ft.en, order = ['h_buyers', 'h_markets', 'h_data', 'h_about'];   // the markets go third: that column has two sub-columns on wide screens
  const h = order.map(k => G.find(g => g[0] === k)).filter(Boolean).map(g => '<div><h2 class="fh">' + esc(lab(lang, g[0])) + '</h2><ul>' + g[1].map(x => '<li><a href="' + esc(x[0]) + '"' + (lang !== 'en' && !/^\/(es|de|fr|nl|ru|zh|ar)\//.test(x[0]) ? ' hreflang="en"' : '') + '>' + esc(x[1]) + '</a></li>').join('') + '</ul></div>').join('');
  return (FC[lang] = h);
}

// ------------------------------------------------------------------------------------------------ item 64: most searched
const MS_RX = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:|projects\/|m\/|countries\/|countries\/[a-z0-9-]{2,60}\/|rankings\/)$/;
const slugC = c => String(c || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const msWants = p => MS_RX.test(p);
const MSCSS = '<style>.n33-ms{border-bottom:1px solid var(--line,#d5dbd8);background:var(--card,#fff);font-size:.9rem}.n33-ms .wrap{display:flex;align-items:center;gap:6px 14px;padding-top:8px;padding-bottom:8px;overflow-x:auto;white-space:nowrap;scrollbar-width:thin}.n33-ms b{flex:none}.n33-ms a{flex:none}.n33-ms small{flex:none;color:var(--muted,#56636F);font-size:.78rem}</style>';
export function msBlock(lang, path) {
  if (!J || !J.ms) return '';
  const c = /\/countries\/([a-z0-9-]{2,60})\/$/.exec(path), co = c ? c[1] : null;
  let L = J.ms.slice();
  if (co) L = L.filter(x => x[2] && slugC(x[2]) === co).concat(L.filter(x => !(x[2] && slugC(x[2]) === co)));   // the country's own pages first
  const a = L.slice(0, 9).map(x => { const href = lang !== 'en' && has(x[3], lang) ? '/' + lang + x[0] : x[0];
    return '<a href="' + esc(href) + '"' + (lang !== 'en' && href === x[0] ? ' hreflang="en"' : '') + '><bdi>' + esc((x[5] && x[5][lang]) || x[4]) + '</bdi></a>'; }).join(' · ');
  return MSCSS + '<nav class="n33-ms" aria-label="' + esc(lab(lang, 'ms_h')) + '"' + (lang === 'ar' ? ' dir="rtl"' : '') + '><div class="wrap"><b>' + esc(lab(lang, 'ms_h')) + ':</b> ' + a + ' <small>' + esc(lab(lang, 'ms_src')) + '</small></div></nav>';
}

// ------------------------------------------------------------------------------------------------ item 71: language menu
const LN = { en: 'English', es: 'Español', de: 'Deutsch', fr: 'Français', ru: 'Русский', nl: 'Nederlands', ar: 'العربية', zh: '简体中文' }, LO = ['en', 'es', 'de', 'fr', 'ru', 'nl', 'ar', 'zh'];
export function lswHtml(lang, alt) {   // alt: { lang: path } from the page's own hreflang links
  if (!J) return '';
  const cur = lang.toUpperCase();
  return '<style id="lsw-css">' + (J.lswcss || '') + '</style><details class="lsw"><summary aria-label="' + esc(lab(lang, 'language')) + ': ' + cur + ' (' + LN[lang] + ')"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M2 10h16M10 2c2.4 2.3 3.4 5 3.4 8s-1 5.7-3.4 8M10 2C7.6 4.3 6.6 7 6.6 10s1 5.7 3.4 8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg><span class="lsw-w">' + esc(lab(lang, 'language')) + ':</span> ' + cur + '</summary><ul>' +
    LO.map(l => '<li><a href="' + esc(alt[l] || pre(l) + '/') + '" hreflang="' + l + '" lang="' + l + '"' + (l === lang ? ' aria-current="page"' : '') + '>' + l.toUpperCase() + ' <span' + (l === 'ar' ? ' dir="rtl"' : '') + '>' + LN[l] + '</span></a></li>').join('') + '</ul></details>';
}
// a language version the page links in its head but its menu leaves out (some shells had no ES line): added at the end of the menu
export const lswMissing = (alt, seen) => LO.filter(l => alt[l] && !seen.has(l)).map(l => '<li><a href="' + esc(alt[l]) + '" hreflang="' + l + '" lang="' + l + '">' + l.toUpperCase() + ' <span' + (l === 'ar' ? ' dir="rtl"' : '') + '>' + LN[l] + '</span></a></li>').join('');
export const altPath = href => { try { const u = new URL(href, ORIGIN); return u.hostname.replace(/^www\./, '') === 'kolaboro.com' ? u.pathname + u.search : null; } catch (e) { return null; } };

// ------------------------------------------------------------------------------------------------ item 66: developer -> markets
export async function devMarkets(req, u, env, r) {
  const m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?developers\/([a-z0-9-]{1,90})\/$/.exec(u.pathname);
  if (!m || req.method !== 'GET' || !r || r.status !== 200 || !/text\/html/.test(r.headers.get('content-type') || '')) return r;
  const lang = m[1] || 'en';
  if (!(await load(env))) return r;
  let ix; try { ix = await (await import('./kbx_named.js')).data(env); } catch (e) { return r; }
  const d = ix.devs && ix.devs.get(m[2]); if (!d || !d.ids || !d.ids.length) return r;
  const c = new Map(); for (const id of d.ids) { const x = ix.byId.get(id); if (x && x.mk && !/sumba/i.test(x.mk)) c.set(x.mk, (c.get(x.mk) || 0) + 1); }
  if (!c.size) return r;
  let mkName = k => k; try { mkName = (await import('./kbx_hdate.js')).mkName; } catch (e) {}
  const slugM = k => encodeURIComponent(String(k).toLowerCase().replace(/\s+/g, '-'));
  const L = [...c].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(b[0])).slice(0, 12).map(([k, n]) => {
    const tr = lang !== 'en' && ((ix.mk.get(k) || {}).k || 0) >= 5;   // translated market pages exist for markets with 5 or more projects
    return '<a href="' + (tr ? '/' + lang : '') + '/m/' + slugM(k) + '/"' + (lang !== 'en' && !tr ? ' hreflang="en"' : '') + '><bdi>' + esc(mkName(k, lang)) + '</bdi></a> (' + esc(lab(lang, n === 1 ? 'sm_n1' : 'sm_n').replace('{n}', n)) + ')';
  });
  const line = '<p class="n33-dm" style="margin:6px 0 0;font-size:.92rem"><b>' + esc(lab(lang, 'h_markets')) + ':</b> ' + L.join(' · ') + '</p>';
  let done = false;
  return new HTMLRewriter().on('main p.crumb', { element(e) { if (done) return; done = true; e.after(line, { html: true }); } }).transform(r);
}

// ------------------------------------------------------------------------------------------------ item 76: /sitemap/
export const SM_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?sitemap\/?$/;
const CSS = '<style>.n33-sm h2{margin:30px 0 10px}.n33-sm .n33-co{columns:2 300px;column-gap:32px}.n33-sm .n33-c{break-inside:avoid;margin:0 0 18px}.n33-sm .n33-c h3{font-size:1rem;margin:0 0 4px}.n33-sm ul{margin:0;padding-inline-start:18px}.n33-sm li{margin:2px 0}.n33-sm .n33-n{color:var(--muted,#56636F);font-size:.85rem}.n33-sm .n33-l{columns:3 200px;column-gap:28px;padding-inline-start:18px}</style>';
export async function sitemapPage(req, u, env, shell) {
  const m = SM_RX.exec(u.pathname); if (!m) return null;
  if (!/\/$/.test(u.pathname)) return new Response(null, { status: 301, headers: { location: u.pathname + '/' } });
  const lang = m[1] || 'en';
  if (!(await load(env))) return null;
  const N = await import('./kbx_named.js');
  const sh = await shell(pre(lang) + '/how-we-score/'); if (!sh || sh.status !== 200) return null;
  const nf = new Intl.NumberFormat(lang === 'en' ? 'en-GB' : lang === 'zh' ? 'zh-CN' : lang, { numberingSystem: 'latn' });
  const cnt = n => esc(lab(lang, n === 1 ? 'sm_n1' : 'sm_n').replace('{n}', nf.format(n)));
  let dd = J.data || J.v; try { dd = new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : lang === 'zh' ? 'zh-CN' : lang, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(String(J.data || J.v).slice(0, 10) + 'T00:00:00Z')); } catch (e) {}
  const href = (path, ls) => lang !== 'en' && has(ls, lang) ? '/' + lang + path : path;
  const enOnly = (path, ls) => lang !== 'en' && !has(ls, lang) ? ' hreflang="en"' : '';
  let total = 0;
  const co = J.sm.map(([c, cs, ls, nm, mks]) => {
    const n = mks.reduce((a, x) => a + x[1], 0); total += n;
    const cn = (nm && nm[lang]) || c, cp = '/countries/' + cs + '/';
    const head = has(ls, 'en') ? '<a href="' + href(cp, ls) + '"' + enOnly(cp, ls) + '><bdi>' + esc(cn) + '</bdi></a>' : '<bdi>' + esc(cn) + '</bdi>';
    const sl = s => encodeURIComponent(String(s).toLowerCase().replace(/\s+/g, '-'));
    const li = mks.map(([mk, k, mls, mn]) => { const mp = '/m/' + sl(mk) + '/', t = '<bdi>' + esc((mn && mn[lang]) || mk) + '</bdi>';
      return '<li>' + (has(mls, 'en') ? '<a href="' + href(mp, mls) + '"' + enOnly(mp, mls) + '>' + t + '</a>' : t) + ' <span class="n33-n">' + cnt(k) + '</span></li>'; }).join('');
    return '<div class="n33-c"><h3>' + head + ' <span class="n33-n">' + cnt(n) + '</span></h3><ul>' + li + '</ul></div>';
  }).join('');
  const G = J.ft[lang] || J.ft.en, main = G.filter(g => g[0] === 'h_buyers' || g[0] === 'h_data').flatMap(g => g[1]);
  const li = A => A.map(x => '<li><a href="' + esc(x[0]) + '"' + (lang !== 'en' && !/^\/(es|de|fr|nl|ru|zh|ar)\//.test(x[0]) ? ' hreflang="en"' : '') + '>' + esc(x[1]) + '</a></li>').join('');
  const body = '<section class="phero kp"><div class="wrap"><p class="crumb"><a href="' + pre(lang) + '/">Kolaboro</a> / ' + esc(lab(lang, 'sm_h1')) + '</p><h1>' + esc(lab(lang, 'sm_h1')) + '</h1><p class="lead">' + esc(lab(lang, 'sm_lead').replace('{d}', dd)) + '</p></div></section>' +
    '<div class="wrap kwrap n33-sm"' + (lang === 'ar' ? ' dir="rtl"' : '') + '><h2>' + esc(lab(lang, 'sm_main')) + '</h2><ul class="n33-l">' + li(main) + '</ul>' +
    '<h2>' + esc(lab(lang, 'sm_co')) + '</h2><div class="n33-co">' + co + '</div>' +
    '<h2>' + esc(lab(lang, 'sm_more')) + '</h2><ul class="n33-l">' + li((J.ft[lang] || J.ft.en).find(g => g[0] === 'h_about')[1].concat(J.more[lang] || J.more.en)) + '</ul></div>' + CSS;
  const canon = ORIGIN + pre(lang) + '/sitemap/', title = lab(lang, 'sm_title');
  const pg = { title: (title + ' | Kolaboro').length > 60 ? title : title + ' | Kolaboro', desc: lab(lang, 'sm_desc'), canon, body, alt: l => ORIGIN + pre(l) + '/sitemap/',
    ld: { '@context': 'https://schema.org', '@graph': [{ '@type': 'CollectionPage', name: title, url: canon, inLanguage: lang, description: lab(lang, 'sm_desc'), dateModified: String(J.data || J.v).slice(0, 10), isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + pre(lang) + '/' }, { '@type': 'ListItem', position: 2, name: lab(lang, 'sm_h1'), item: canon }] }] } };
  const out = await N.assemble(pg, lang, sh);
  return new Response(out, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600' } });
}
