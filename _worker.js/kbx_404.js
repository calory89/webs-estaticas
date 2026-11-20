// kolaboro.com (n25e, 12 Nov 2026): what a missing URL answers. No paid AI, no DB.
//   fix(u, env)  -> 301 to the one current page that clearly replaces an old URL, 410 Gone for junk that was never ours, or null (keep 404).
//                   Called only after the site answered 404, so normal pages pay nothing.
//   page(r, u, status, env) -> the static 404 page (n26i: translated header and footer from the /<lang>/ shell) with a useful, translated body (project search, /projects/, transparency rankings,
//                   tools), noindex, and the right status (404 or 410).
// Rules: never redirect to the home page as a catch-all; Sumba ids (conflict of interest) never go to a named page, they keep the
// anonymous /p/<id>/ file; private paths and API paths keep their 404.
import { data } from './kbx_named.js';

const LANGS = ['es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const COI = new Set(['sumba']);
// old static paths -> current page (one table; a path here must answer 200 at the target)
const MAP = {
  '/score/': '/how-we-score/', '/report/': '/report/sample/', '/docs/': '/docs/api/', '/guides/': '/guides/buying-off-plan/',
  '/data/visual-tests.json': '/data/quality.json', '/data/page-weight.json': '/data/quality.json',
  '/open/evals/': '/engineering/evals/',
  '/data/coast/': '/data/#coast-tiles', '/data/mangroves/': '/data/#mangrove-tiles', '/data/benchmark/': '/data/#benchmark',
  // n33i (20 Nov 2026): 404s in Search Console: /x/ (the X-ray pages live at /x/<seal>/; the tool is /check/), /pay, /k/sat/ (satellite tiles folder)
  '/x/': '/check/', '/x': '/check/', '/pay': '/pricing/', '/pay/': '/pricing/', '/k/sat/': '/satellite/', '/k/sat': '/satellite/'
};
const GONE = new Set(['/6', '/p/HO', '/k']);   // n33i: /k/ is the asset folder, never a page   // truncated or garbled strings found by Search Console, never pages of ours
const rd = (loc, s) => new Response(null, { status: s || 301, headers: { location: loc, 'cache-control': 'public, max-age=86400', 'x-robots-tag': 'noindex' } });

export async function fix(u, env) {
  let p = u.pathname; if (/^\/(api|admin|portal|cdn-cgi|backup-admin)(\/|$)/.test(p)) return null;
  const lm = p.match(/^\/(es|de|fr|nl|ru|zh|ar)(\/.*)$/), lang = lm ? lm[1] : 'en', rest = lm ? lm[2] : p, pre = lang === 'en' ? '' : '/' + lang;
  if (GONE.has(p.replace(/\/$/, ''))) return 'gone';
  // /p/<ID>/<anything> (267 of the 290 Search Console 404s were /p/<ID>/Printed, from text in the print header of the old project file)
  // and /<lang>/p/<ID>/: the named page in that language, or the anonymous /p/<ID>/ file when the project is not named (Sumba)
  const pm = rest.match(/^\/p\/([A-Za-z0-9]{2,6}-[0-9]{1,4})(\/.*)?$/);
  if (pm && (pm[2] && pm[2] !== '/' || lm)) {
    const id = pm[1].toUpperCase();
    try {
      const ix = await data(env), x = ix.byId.get(id), c = ix.caseBy.get(id);
      if (x && !COI.has(String(x.mk || '').toLowerCase())) return rd(pre + '/projects/' + x.s + '/');
      if (c) return rd('/p/' + encodeURIComponent(id) + '/');
    } catch (e) { return null; }
    return null;
  }
  // market pages exist in English only: /<lang>/m/<market>/ -> /m/<market>/
  const mm = rest.match(/^\/m\/([^/.]{2,60})\/?$/); if (lm && mm) return rd('/m/' + mm[1] + '/');
  // /data/<dir>/<dir>/<file>: a file name read as a path relative to its folder
  const dd = p.match(/^\/data\/([a-z0-9-]+)\/\1\/(.+)$/); if (dd) return rd('/data/' + dd[1] + '/' + dd[2]);
  const t = MAP[p]; if (t) return rd(t);
  return null;
}

const T = {
  en: { t: 'Page not found', g: 'This page is gone', h: "This page doesn't exist.", hg: 'This page was removed.', l: 'The link may be old or mistyped. Search the projects we track, or start from one of these pages.', s: 'Search projects and developers', ph: 'Project, developer or market', b: 'Search', p: ['Projects', 'Every project we track, with sources'], r: ['Transparency rankings', 'What each project publishes, by island and city'], o: ['Tools', 'Free checks for buyers'], c: ['Check a project', 'Paste a website or name'], u: ['Country guides', 'Buying abroad, country by country'], m: ['Home', ''] },
  es: { t: 'Página no encontrada', g: 'Esta página ya no existe', h: 'Esta página no existe.', hg: 'Esta página se retiró.', l: 'El enlace puede ser antiguo o tener un error. Busca entre los proyectos que seguimos o empieza por una de estas páginas.', s: 'Buscar proyectos y promotoras', ph: 'Proyecto, promotora o mercado', b: 'Buscar', p: ['Proyectos', 'Todos los proyectos que seguimos, con fuentes'], r: ['Rankings de transparencia', 'Lo que publica cada proyecto, por isla y ciudad'], o: ['Herramientas', 'Comprobaciones gratuitas para compradores (en inglés)'], c: ['Comprobar un proyecto', 'Pega una web o un nombre'], u: ['Guías por país', 'Comprar en el extranjero, país por país (en inglés)'], m: ['Inicio', ''] },
  de: { t: 'Seite nicht gefunden', g: 'Diese Seite gibt es nicht mehr', h: 'Diese Seite gibt es nicht.', hg: 'Diese Seite wurde entfernt.', l: 'Der Link ist vielleicht veraltet oder falsch geschrieben. Durchsuchen Sie die Projekte, die wir verfolgen, oder beginnen Sie auf einer dieser Seiten.', s: 'Projekte und Bauträger suchen', ph: 'Projekt, Bauträger oder Markt', b: 'Suchen', p: ['Projekte', 'Alle Projekte, die wir verfolgen, mit Quellen'], r: ['Transparenz-Rankings', 'Was jedes Projekt veröffentlicht, nach Insel und Stadt'], o: ['Werkzeuge', 'Kostenlose Prüfungen für Käufer (auf Englisch)'], c: ['Projekt prüfen', 'Website oder Namen einfügen'], u: ['Länderratgeber', 'Kaufen im Ausland, Land für Land (auf Englisch)'], m: ['Startseite', ''] },
  fr: { t: 'Page introuvable', g: "Cette page n'existe plus", h: "Cette page n'existe pas.", hg: 'Cette page a été retirée.', l: 'Le lien est peut-être ancien ou mal saisi. Cherchez parmi les projets que nous suivons, ou commencez par l’une de ces pages.', s: 'Chercher des projets et des promoteurs', ph: 'Projet, promoteur ou marché', b: 'Chercher', p: ['Projets', 'Tous les projets que nous suivons, avec leurs sources'], r: ['Classements de transparence', 'Ce que publie chaque projet, par île et par ville'], o: ['Outils', 'Vérifications gratuites pour les acheteurs (en anglais)'], c: ['Vérifier un projet', 'Collez un site ou un nom'], u: ['Guides par pays', 'Acheter à l’étranger, pays par pays (en anglais)'], m: ['Accueil', ''] },
  nl: { t: 'Pagina niet gevonden', g: 'Deze pagina bestaat niet meer', h: 'Deze pagina bestaat niet.', hg: 'Deze pagina is verwijderd.', l: 'De link is misschien oud of verkeerd getypt. Zoek in de projecten die we volgen, of begin bij een van deze pagina’s.', s: 'Projecten en ontwikkelaars zoeken', ph: 'Project, ontwikkelaar of markt', b: 'Zoeken', p: ['Projecten', 'Elk project dat we volgen, met bronnen'], r: ['Transparantierankings', 'Wat elk project publiceert, per eiland en stad'], o: ['Hulpmiddelen', 'Gratis controles voor kopers (in het Engels)'], c: ['Project controleren', 'Plak een website of naam'], u: ['Landengidsen', 'Kopen in het buitenland, per land (in het Engels)'], m: ['Home', ''] },
  ru: { t: 'Страница не найдена', g: 'Этой страницы больше нет', h: 'Такой страницы нет.', hg: 'Эта страница удалена.', l: 'Возможно, ссылка устарела или в ней опечатка. Найдите проект среди тех, за которыми мы следим, или начните с одной из этих страниц.', s: 'Поиск проектов и застройщиков', ph: 'Проект, застройщик или рынок', b: 'Найти', p: ['Проекты', 'Все проекты, за которыми мы следим, с источниками'], r: ['Рейтинги прозрачности', 'Что публикует каждый проект, по островам и городам'], o: ['Инструменты', 'Бесплатные проверки для покупателей (на английском)'], c: ['Проверить проект', 'Вставьте сайт или название'], u: ['Гиды по странам', 'Покупка за рубежом, страна за страной (на английском)'], m: ['Главная', ''] },
  zh: { t: '页面未找到', g: '此页面已不存在', h: '此页面不存在。', hg: '此页面已移除。', l: '链接可能已过期或输入有误。请搜索我们跟踪的项目，或从以下页面开始。', s: '搜索项目和开发商', ph: '项目、开发商或市场', b: '搜索', p: ['项目', '我们跟踪的所有项目，附来源'], r: ['透明度排名', '各项目公开了什么，按岛屿和城市'], o: ['工具', '面向买家的免费核查（英文）'], c: ['核查项目', '粘贴网站或名称'], u: ['国家指南', '海外购房，逐国说明（英文）'], m: ['首页', ''] },
  ar: { t: 'الصفحة غير موجودة', g: 'هذه الصفحة لم تعد موجودة', h: 'هذه الصفحة غير موجودة.', hg: 'أُزيلت هذه الصفحة.', l: 'ربما يكون الرابط قديماً أو مكتوباً بشكل خاطئ. ابحث في المشاريع التي نتابعها، أو ابدأ من إحدى هذه الصفحات.', s: 'ابحث عن المشاريع والمطورين', ph: 'مشروع أو مطور أو سوق', b: 'بحث', p: ['المشاريع', 'كل مشروع نتابعه، مع المصادر'], r: ['تصنيفات الشفافية', 'ما ينشره كل مشروع، حسب الجزيرة والمدينة'], o: ['الأدوات', 'فحوص مجانية للمشترين (بالإنجليزية)'], c: ['افحص مشروعاً', 'الصق موقعاً أو اسماً'], u: ['أدلة الدول', 'الشراء في الخارج، دولة بدولة (بالإنجليزية)'], m: ['الرئيسية', ''] }
};
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// the help block: project search (prefills /projects/?q=), then the pages most people want; also used by the named-page 404 (kbx_named.js)
export function helpBody(lang, h1, lead) {
  const L = T[lang] || T.en, pre = lang === 'en' ? '' : '/' + lang;
  const li = (href, a) => '<li><a href="' + href + '"><b>' + esc(a[0]) + '</b>' + (a[1] ? '<span>' + esc(a[1]) + '</span>' : '') + '</a></li>';
  return '<section class="phero"' + (lang === 'ar' ? ' dir="rtl"' : '') + ' lang="' + lang + '"><div class="wrap"><h1>' + esc(h1 || L.h) + '</h1><p class="lead">' + esc(lead || L.l) + '</p>' +
    '<form class="hero-check" role="search" action="' + pre + '/projects/" method="get" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:22px;max-width:560px">' +
    '<label for="nf-q" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">' + esc(L.s) + '</label>' +
    '<input id="nf-q" name="q" type="search" required placeholder="' + esc(L.ph) + '" style="flex:1 1 240px;min-width:0;min-height:46px;padding:10px 14px;border:1px solid #C9D0D6;border-radius:10px;font:inherit">' +
    '<button class="btn btn-hi" type="submit">' + esc(L.b) + '</button></form>' +
    // n28c: long words (nl "Transparantierankings", de compounds) widened the 1fr columns past the screen on phones
    '<style>.nf-links{grid-template-columns:repeat(3,minmax(0,1fr))}@media (max-width:700px){.nf-links{grid-template-columns:repeat(2,minmax(0,1fr))}}.nf-links b{overflow-wrap:anywhere;hyphens:auto}</style><ul class="nf-links">' + li(pre + '/projects/', L.p) + li(pre + '/rankings/transparency/', L.r) + li(pre + '/check/', L.c) + li('/tools/', L.o) + li('/countries/', L.u) + li(pre + '/', L.m) + '</ul></div></section>';
}

export async function page(r, u, status, env) {
  const lm = u.pathname.match(/^\/(es|de|fr|nl|ru|zh|ar)(\/|$)/), lang = lm ? lm[1] : 'en', L = T[lang], gone = status === 410;
  const body = helpBody(lang, gone ? L.hg : L.h, L.l);
  // n26i (batch 26): header and footer in the page language too. The static 404.html is English; for /<lang>/ paths the shell is the
  // translated /<lang>/how-we-score/ page (the same shell the named pages use), with its head reduced to a noindex 404.
  let src = r;
  if (lang !== 'en' && env && env.ASSETS) try { const s = await env.ASSETS.fetch(new Request('https://kolaboro.com/_s/kolaboro.com/' + lang + '/how-we-score/index.html')); if (s.ok && /text\/html/.test(s.headers.get('content-type') || 'text/html')) src = s; } catch (e) { src = r; }
  const h = new Headers(r.headers); h.set('x-robots-tag', 'noindex'); h.set('cache-control', 'no-cache'); h.set('content-type', 'text/html; charset=utf-8'); h.delete('content-length'); h.delete('etag');
  const out = new Response(src.body, { status: gone ? 410 : 404, headers: h });
  const title = (gone ? L.g : L.t) + ' | Kolaboro'; let seenLsw = false;
  // n28c: language buttons of a missing page lead to that language's home (also on the English static 404)
  let rw = new HTMLRewriter().on('head title', { element(e) { e.setInnerContent(title); } }).on('main', { element(e) { e.setInnerContent(body, { html: true }); } })
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); e.setAttribute('href', l === 'en' ? '/' : '/' + l + '/'); e.removeAttribute('aria-current'); } })
    .on('link[rel="canonical"],meta[property="og:url"]', { element(e) { e.remove(); } });   // n28a: a missing page has no canonical (the English shell pointed every 404 at /404.html, itself a 308)
  // n28c: the translated shell is read straight from the static files, so its scripts carried no nonce and the enforced CSP of this
  // response blocked all of them (ticker, menu, search: 6 to 10 console errors per page). Stamp this response's nonce, as kbHeaders does.
  const nm = ((h.get('content-security-policy') || '') + ' ' + (h.get('content-security-policy-report-only') || '')).match(/'nonce-([A-Za-z0-9+/=]+)'/);
  if (src !== r && nm) rw = rw.on('script', { element(e) { e.setAttribute('nonce', nm[1]); } });
  if (src !== r) rw = rw
    .on('link[rel="canonical"],link[rel="alternate"][hreflang],script[type="application/ld+json"],meta[property^="og:"],meta[name^="twitter:"]', { element(e) { e.remove(); } })
    .on('meta[name="description"]', { element(e) { e.setAttribute('content', L.l); } })
    .on('meta[name="robots"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append('<meta name="robots" content="noindex">', { html: true }); } })
    .on('style[id="lsw-css"]', { element(e) { if (seenLsw) e.remove(); seenLsw = true; } });
  return rw.transform(out);
}
