/*! Kolaboro command palette: Cmd/Ctrl+K or the search button. Fuzzy search over every tracked project, market and key page,
 *  entirely in the browser. The index (/api/x/a/index, Ed25519-signed, about 15 KB compressed) is kept in localStorage, so
 *  search keeps working offline once it has loaded one time.
 */
(function () {
  if (window.KBPalette) return;
  var LS = 'kb-sx-v1', RK = 'kb-sx-recent';
  var PAGES = [
    ['Check a project website', '/check', 'desk review ai analyze url link scan free', 'Tool'],
    ['Database of off-plan projects', '/database', 'all projects table filter download data', 'Page'],
    ['Live cases', '/cases', 'projects tracked list', 'Page'],
    ['Pricing', '/pricing', 'price cost fee 490 99 monitoring check', 'Page'],
    ['Book a check', '/book/', 'buy order pay paypal pre-purchase', 'Page'],
    ['How the Trust Score works', '/how-we-score', 'scoring method score six checks methodology', 'Page'],
    ['Verify evidence and signatures', '/verify', 'signature ed25519 receipt hash proof check', 'Trust'],
    ['Public log', '/log/', 'transparency log merkle rekor bitcoin opentimestamps head', 'Trust'],
    ['Status and uptime', '/status', 'uptime self-test incidents health probes', 'Trust'],
    ['Independence', '/independence', 'developers never pay conflict of interest', 'Trust'],
    ['Engineering', '/engineering', 'architecture tech stack how it is built', 'Trust'],
    ['AI evaluations', '/engineering/evals/', 'evals tests desk review accuracy injection', 'Trust'],
    ['Technology: the verification engine', '/technology', 'ai contract certificate price images progress', 'Page'],
    ['Open data and API', '/docs/api', 'api json csv developers endpoints openapi', 'Developers'],
    ['Open metrics', '/metrics', 'numbers metrics traffic revenue', 'Trust'],
    ['Security and your data', '/security', 'privacy encryption security scan', 'Trust'],
    ['Corrections', '/corrections', 'errors fixed mistakes', 'Trust'],
    ['How we collect data', '/data-policy', 'sources crawl research', 'Trust'],
    ['Off-Plan Disclosure Standard', '/standard', 'standard disclosure six things', 'Page'],
    ['Transparency Index by market', '/transparency-index', 'markets ranking countries index', 'Page'],
    ['Official registers', '/registers', 'registry permits licence check yourself', 'Page'],
    ['Before-you-sign checklist', '/checklist', '20 points checklist deposit contract', 'Guide'],
    ['Glossary', '/glossary', 'terms leasehold freehold escrow pbg imb', 'Guide'],
    ['Off-plan risk calculator', '/tools/risk', 'risk money at risk calculator', 'Tool'],
    ['Rental yield check', '/tools/yield-check', 'yield roi rental return calculator', 'Tool'],
    ['Contract first pass', '/tools/contract-scan', 'contract clauses scan pdf', 'Tool'],
    ['Payment plan checker', '/tools/payment-plan', 'payment schedule milestones instalments', 'Tool'],
    ['Compare projects side by side', '/compare', 'compare versus', 'Tool'],
    ['Your watchlist', '/watchlist', 'saved projects follow changes alerts', 'Tool'],
    ['Satellite watch', '/satellite', 'satellite imagery construction progress space', 'Page'],
    ['Live from the site', '/live', 'video site visit agent', 'Page'],
    ['Sample client report', '/report/sample', 'example report villa', 'Page'],
    ['Buyer portal demo', '/portal/demo', 'portal login demo client', 'Page'],
    ['Destinations', '/destinations', 'countries markets where', 'Guide'],
    ['Buying property in Bali', '/bali', 'indonesia bali foreigner leasehold', 'Guide'],
    ['Buying property in Dubai', '/dubai', 'uae dubai rera escrow', 'Guide'],
    ['Buying property in Phuket', '/phuket', 'thailand phuket condo', 'Guide'],
    ['Buying property in Tulum', '/tulum', 'mexico tulum fideicomiso', 'Guide'],
    ['Buying property in the Algarve', '/algarve', 'portugal algarve', 'Guide'],
    ['Buying property in Lombok', '/lombok', 'indonesia lombok', 'Guide'],
    ['Agent academy', '/academy', 'training course agents', 'Page'],
    ['Become a Kolaboro agent', '/agents', 'work earn agent join', 'Page'],
    ['For developers', '/developers', 'developer verified badge reply', 'Page'],
    ['For lawyers and notaries', '/lawyers', 'lawyer notary case file', 'Page'],
    ['For regulators', '/regulators', 'government regulator data', 'Page'],
    ['Investors', '/investors', 'investors deck fundraising', 'Page'],
    ['About Kolaboro', '/about', 'founder team company', 'Page'],
    ['Changelog', '/changelog', 'what shipped updates new', 'Page'],
    ['Roadmap', '/roadmap', 'features planned', 'Page'],
    ['Press kit', '/press', 'media logo press', 'Page'],
    ['Research agent', '/research', 'research agent bali developers advertise', 'Page'],
    ['Browser extension', '/extension', 'chrome extension one click', 'Tool'],
    ['Log in', '/login', 'sign in account', 'Account'],
    ['Privacy policy', '/legal/privacy', 'gdpr privacy', 'Legal'],
    ['Terms', '/legal/terms', 'terms conditions', 'Legal']
  ];

  // translated pages: the palette speaks the page language and lists the pages that exist in it
  var LG = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase(), PLm = (window.KBL && KBL.pl) || {}, pl = function (x) { return PLm[x] || x; };
  var TL = {
    es: { pg: ['Comprueba la web de un proyecto', 'Base de datos de proyectos sobre plano', 'Casos en seguimiento', 'Precios', 'Cómo funciona el Trust Score', 'Lista antes de firmar', 'Sobre Kolaboro', 'Inicio'], ty: { Tool: 'Herramienta', Page: 'Página' },
      ph: 'Busca proyectos, mercados, páginas…', al: 'Buscar proyectos, mercados y páginas', dl: 'Buscar en Kolaboro', cl: 'Cerrar búsqueda', rs: 'Resultados', mk: 'Mercado', pj: ['proyecto', 'proyectos'], ck: 'de 6 comprobaciones públicas', pr: ['problema público', 'problemas públicos'], fl: ['alerta', 'alertas'],
      st: { 'under construction': 'en construcción', 'off-plan': 'sobre plano', completed: 'terminado' }, none: function (q) { return 'Nada coincide con «' + q + '». Prueba un mercado (Bali, Dubái), un id de proyecto (BALI-014) o una página (precios).'; }, ld: 'Cargando el índice de proyectos…',
      dr: ['Revisión de escritorio de ', 'Herramienta · lee la página y lista lo que promete y lo que omite'], ft: ['proyectos', 'mercados', 'páginas', 'páginas (cargando proyectos)', 'buscado en', 'ms en tu navegador', 'guardado para usar sin conexión', 'firma del índice verificada', 'firma del índice'], kb: ['mover', 'abrir', 'cerrar'] },
    de: { pg: ['Projekt-Website prüfen', 'Datenbank der Off-Plan-Projekte', 'Laufende Fälle', 'Preise', 'So funktioniert der Trust Score', 'Checkliste vor der Unterschrift', 'Über Kolaboro', 'Startseite'], ty: { Tool: 'Werkzeug', Page: 'Seite' },
      ph: 'Projekte, Märkte, Seiten suchen…', al: 'Projekte, Märkte und Seiten durchsuchen', dl: 'Kolaboro durchsuchen', cl: 'Suche schließen', rs: 'Ergebnisse', mk: 'Markt', pj: ['Projekt', 'Projekte'], ck: 'von 6 Prüfungen öffentlich', pr: ['öffentliches Problem', 'öffentliche Probleme'], fl: ['Warnung', 'Warnungen'],
      st: { 'under construction': 'im Bau', 'off-plan': 'Off-Plan', completed: 'fertiggestellt' }, none: function (q) { return 'Keine Treffer für „' + q + '“. Versuchen Sie einen Markt (Bali, Dubai), eine Projekt-ID (BALI-014) oder eine Seite (Preise).'; }, ld: 'Projektindex wird geladen…',
      dr: ['Desk-Review von ', 'Werkzeug · liest die Seite und listet, was sie verspricht und was fehlt'], ft: ['Projekte', 'Märkte', 'Seiten', 'Seiten (Projekte werden geladen)', 'durchsucht in', 'ms in Ihrem Browser', 'offline gespeichert', 'Index-Signatur geprüft', 'Index-Signatur'], kb: ['bewegen', 'öffnen', 'schließen'] },
    fr: { pg: ['Vérifier le site d’un projet', 'Base de données des projets sur plan', 'Dossiers suivis', 'Tarifs', 'Comment fonctionne le Trust Score', 'Liste avant de signer', 'À propos de Kolaboro', 'Accueil'], ty: { Tool: 'Outil', Page: 'Page' },
      ph: 'Rechercher projets, marchés, pages…', al: 'Rechercher des projets, marchés et pages', dl: 'Rechercher sur Kolaboro', cl: 'Fermer la recherche', rs: 'Résultats', mk: 'Marché', pj: ['projet', 'projets'], ck: 'sur 6 vérifications publiques', pr: ['problème public', 'problèmes publics'], fl: ['alerte', 'alertes'],
      st: { 'under construction': 'en construction', 'off-plan': 'sur plan', completed: 'achevé' }, none: function (q) { return 'Aucun résultat pour « ' + q + ' ». Essayez un marché (Bali, Dubaï), un identifiant de projet (BALI-014) ou une page (tarifs).'; }, ld: 'Chargement de l’index des projets…',
      dr: ['Analyse documentaire de ', 'Outil · lit la page et liste ce qu’elle promet et ce qu’elle omet'], ft: ['projets', 'marchés', 'pages', 'pages (projets en cours de chargement)', 'recherche en', 'ms dans votre navigateur', 'enregistré pour un usage hors ligne', 'signature de l’index vérifiée', 'signature de l’index'], kb: ['naviguer', 'ouvrir', 'fermer'] },
    nl: { pg: ['Website van een project controleren', 'Database van off-plan projecten', 'Lopende dossiers', 'Prijzen', 'Zo werkt de Trust Score', 'Checklist vóór het tekenen', 'Over Kolaboro', 'Startpagina'], ty: { Tool: 'Tool', Page: 'Pagina' },
      ph: 'Zoek projecten, markten, pagina’s…', al: 'Zoek projecten, markten en pagina’s', dl: 'Zoeken op Kolaboro', cl: 'Zoeken sluiten', rs: 'Resultaten', mk: 'Markt', pj: ['project', 'projecten'], ck: 'van 6 controles openbaar', pr: ['openbaar probleem', 'openbare problemen'], fl: ['waarschuwing', 'waarschuwingen'],
      st: { 'under construction': 'in aanbouw', 'off-plan': 'off-plan', completed: 'opgeleverd' }, none: function (q) { return 'Niets gevonden voor ‘' + q + '’. Probeer een markt (Bali, Dubai), een project-id (BALI-014) of een pagina (prijzen).'; }, ld: 'Projectindex laden…',
      dr: ['Desk review van ', 'Tool · leest de pagina en somt op wat ze belooft en weglaat'], ft: ['projecten', 'markten', 'pagina’s', 'pagina’s (projecten laden)', 'gezocht in', 'ms in uw browser', 'offline opgeslagen', 'indexhandtekening geverifieerd', 'indexhandtekening'], kb: ['bewegen', 'openen', 'sluiten'] },
    ru: { pg: ['Проверить сайт проекта', 'База строящихся проектов', 'Отслеживаемые проекты', 'Цены', 'Как работает Trust Score', 'Чек-лист перед подписанием', 'О Kolaboro', 'Главная'], ty: { Tool: 'Инструмент', Page: 'Страница' },
      ph: 'Поиск проектов, рынков, страниц…', al: 'Поиск проектов, рынков и страниц', dl: 'Поиск по Kolaboro', cl: 'Закрыть поиск', rs: 'Результаты', mk: 'Рынок', pj: ['проект', 'проекта', 'проектов'], ck: 'из 6 проверок открыто', pr: ['публичная проблема', 'публичные проблемы', 'публичных проблем'], fl: ['сигнал', 'сигнала', 'сигналов'], fw: [['проект', 'проекта', 'проектов'], ['рынок', 'рынка', 'рынков'], ['страница', 'страницы', 'страниц']],
      st: { 'under construction': 'строится', 'off-plan': 'на этапе котлована', completed: 'сдан' }, none: function (q) { return 'Ничего не найдено по запросу «' + q + '». Попробуйте рынок (Бали, Дубай), ID проекта (BALI-014) или страницу (цены).'; }, ld: 'Загружаем индекс проектов…',
      dr: ['Проверка сайта ', 'Инструмент · читает страницу и показывает, что она обещает и о чём молчит'], ft: ['проектов', 'рынков', 'страниц', 'страниц (проекты загружаются)', 'поиск за', 'мс в вашем браузере', 'сохранено для работы офлайн', 'подпись индекса проверена', 'подпись индекса'], kb: ['перейти', 'открыть', 'закрыть'] },
    zh: { pg: ['核查项目网站', '期房项目数据库', '跟踪中的案例', '价格', 'Trust Score 如何计算', '签约前清单', '关于 Kolaboro', '首页'], ty: { Tool: '工具', Page: '页面' },
      ph: '搜索项目、市场、页面…', al: '搜索项目、市场和页面', dl: '搜索 Kolaboro', cl: '关闭搜索', rs: '结果', mk: '市场', pj: ['个项目', '个项目'], ck: '/6 项核查公开', pr: ['个公开问题', '个公开问题'], fl: ['个警示', '个警示'],
      st: { 'under construction': '在建', 'off-plan': '期房', completed: '已竣工' }, none: function (q) { return '没有与“' + q + '”匹配的结果。试试市场（巴厘岛、迪拜）、项目编号（BALI-014）或页面（价格）。'; }, ld: '正在加载项目索引…',
      dr: ['对以下网站做案头审查：', '工具 · 读取页面，列出它承诺了什么、遗漏了什么'], ft: ['个项目', '个市场', '个页面', '个页面（项目加载中）', '搜索用时', '毫秒，在您的浏览器中完成', '已保存供离线使用', '索引签名已验证', '索引签名'], kb: ['移动', '打开', '关闭'] },
    ar: { pg: ['افحص موقع مشروع', 'قاعدة بيانات المشاريع على الخارطة', 'الحالات قيد المتابعة', 'الأسعار', 'كيف يعمل Trust Score', 'قائمة ما قبل التوقيع', 'عن Kolaboro', 'الرئيسية'], ty: { Tool: 'أداة', Page: 'صفحة' },
      ph: 'ابحث في المشاريع والأسواق والصفحات…', al: 'ابحث في المشاريع والأسواق والصفحات', dl: 'البحث في Kolaboro', cl: 'إغلاق البحث', rs: 'النتائج', mk: 'سوق', pj: ['مشروع', 'مشاريع'], ck: 'من 6 فحوص منشورة', pr: ['مشكلة علنية', 'مشكلات علنية'], fl: ['تنبيه', 'تنبيهات'],
      st: { 'under construction': 'قيد الإنشاء', 'off-plan': 'على الخارطة', completed: 'مكتمل' }, none: function (q) { return 'لا توجد نتائج لـ «' + q + '». جرّب سوقًا (بالي، دبي) أو رقم مشروع (BALI-014) أو صفحة (الأسعار).'; }, ld: 'جارٍ تحميل فهرس المشاريع…',
      dr: ['مراجعة مكتبية لـ ', 'أداة · تقرأ الصفحة وتسرد ما تعد به وما تغفله'], ft: ['مشروع', 'سوق', 'صفحات', 'صفحات (المشاريع قيد التحميل)', 'البحث استغرق', 'مللي ثانية في متصفحك', 'محفوظ للاستخدام دون اتصال', 'تم التحقق من توقيع الفهرس', 'توقيع الفهرس'], kb: ['تنقّل', 'فتح', 'إغلاق'] }
  }[LG] || null;
  if (TL) PAGES = [['/check', 'desk review ai analyze url link scan free', 'Tool', 0], ['/database', 'all projects table filter download data', 'Page', 1], ['/cases', 'projects tracked list', 'Page', 2], ['/pricing', 'price cost fee 490 99 monitoring check', 'Page', 3],
    ['/how-we-score', 'scoring method score six checks methodology', 'Page', 4], ['/checklist', 'checklist before sign contract', 'Page', 5], ['/about', 'about team founders', 'Page', 6], ['', 'home start', 'Page', 7]].map(function (p) { return [TL.pg[p[3]], '/' + LG + p[0] + '/', p[1] + ' ' + norm(TL.pg[p[3]]), TL.ty[p[2]]]; });
  // n28c: plural forms by the page language (Russian has three: 1 проект, 2 проекта, 5 проектов)
  var PR = null; try { PR = new Intl.PluralRules(LG); } catch (e) {}
  var pn = function (n, f) { if (f.length < 3 || !PR) return n === 1 ? f[0] : f[1]; var c = PR.select(n); return c === 'one' ? f[0] : c === 'few' ? f[1] : f[2]; };
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
  var items = [], ready = false, meta = { n: 0, markets: 0, updated: '', offline: false, verified: null };
  PAGES.forEach(function (p) { items.push({ t: 'page', title: p[0], sub: p[3] + ' · kolaboro.com' + p[1], href: p[1], h: norm(p[0] + ' ' + p[2] + ' ' + p[1].replace(/[\/-]/g, ' ')), w: 3 }); });
  var pageCount = items.length;
  function build(ix) {
    items.length = pageCount; LASTIX = ix;
    (ix.m || []).forEach(function (m) { items.push({ t: 'market', title: TL ? pl(m[0]) : m[0], sub: (TL ? TL.mk + ' · ' + m[2] + ' ' + pn(m[2], TL.pj) + (m[3] && m[3] !== m[0] ? ' · ' + pl(m[3]) : '') : 'Market · ' + m[2] + ' project' + (m[2] === 1 ? '' : 's') + (m[3] && m[3] !== m[0] ? ' · ' + m[3] : '')), href: '/m/' + m[1] + '/', h: norm(m[0] + ' ' + m[3] + ' market' + (TL ? ' ' + pl(m[0]) + ' ' + pl(m[3]) : '')), w: 2 }); });
    (ix.p || []).forEach(function (p) {
      var id = p[0], idn = norm(id), sub = TL ? [pl(p[1]) + (p[2] && p[2] !== p[1] ? (LG === 'ar' ? '، ' : LG === 'zh' ? '，' : ', ') + pl(p[2]) : ''), pl(p[3]), TL.st[p[4]] || p[4], p[5] != null ? p[5] + (LG === 'zh' ? '' : ' ') + TL.ck : '', p[7] ? p[7] + ' ' + pn(p[7], TL.pr) : ''].filter(Boolean).join(' · ') : [p[1] + (p[2] && p[2] !== p[1] ? ', ' + p[2] : ''), p[3], p[4], p[5] != null ? p[5] + ' of 6 checks public' : '', p[7] ? p[7] + ' public problem' + (p[7] > 1 ? 's' : '') : ''].filter(Boolean).join(' · ');
      items.push({ t: 'project', title: id, sub: sub, href: '/p/' + encodeURIComponent(id) + '/', flags: p[7], h: norm(id + ' ' + idn.replace(/-/g, '') + ' ' + idn.replace(/-0*/g, ' ') + ' ' + p[1] + ' ' + p[2] + ' ' + p[3] + ' ' + p[4] + ' ' + p[8] + ' ' + p[9] + (p[7] ? ' flags problems' : '')), w: 1 });
    });
    meta.n = (ix.p || []).length; meta.markets = (ix.m || []).length; meta.updated = ix.updated || ''; ready = true;
    if (NX) named(NX);
  }
  // 6 Nov 2026 (b9a): named projects and developers. /api/v1/search-index gives the public name, developer and named page of every
  // project except the anonymous ones (Sumba, conflict of interest); project rows get their name and open the named page in the page language.
  var NX = null, NLS = 'kb-sx-named-v1', NL = ['es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'].indexOf(LG) >= 0 ? '/' + LG : '';
  var DVL = { en: ['Developer', 'project', 'projects'], es: ['Promotora', 'proyecto', 'proyectos'], de: ['Bauträger', 'Projekt', 'Projekte'], fr: ['Promoteur', 'projet', 'projets'], nl: ['Ontwikkelaar', 'project', 'projecten'], ru: ['Застройщик', ['проект', 'проекта', 'проектов']], zh: ['开发商', '个项目', '个项目'], ar: ['مطوّر', 'مشروع', 'مشاريع'] }[LG] || ['Developer', 'project', 'projects'];
  function named(nx) {
    var by = {}; (nx.p || []).forEach(function (p) { by[p[2]] = p; });
    for (var i = pageCount; i < items.length; i++) { var it = items[i];
      if (it.t === 'project' && !it.nm && by[it.title]) { var p = by[it.title]; it.nm = 1; it.id = it.title; it.sub = it.title + ' · ' + (p[3] ? p[3] + ' · ' : '') + it.sub; it.h += ' ' + norm(p[1] + ' ' + p[3]); it.title = p[1]; it.href = NL + '/projects/' + p[0] + '/'; it.w = 2; }
      if (it.t === 'dev') { items.length = i; break; } }
    (nx.d || []).forEach(function (d) { items.push({ t: 'dev', title: d[1], sub: DVL[0] + ' · ' + d[2] + (LG === 'zh' ? '' : ' ') + (Array.isArray(DVL[1]) ? pn(d[2], DVL[1]) : d[2] === 1 ? DVL[1] : DVL[2]) + (d[3] ? ' · ' + (TL ? String(d[3]).split(', ').map(pl).join(LG === 'ar' ? '، ' : LG === 'zh' ? '，' : ', ') : d[3]) : ''), href: NL + '/developers/' + d[0] + '/', h: norm(d[1] + ' developer promotora ' + d[3]), w: 2 }); });
    meta.devs = (nx.d || []).length;
  }
  function loadNamed() {
    var st = store(), c = null; try { c = st && JSON.parse(st.getItem(NLS) || 'null'); } catch (e) {}
    if (c && c.ix) { NX = c.ix; if (ready) named(NX); }
    if (c && Date.now() - c.at < 6 * 3600e3) return Promise.resolve();
    return fetch('/api/v1/search-index').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j || !j.p) return; NX = j; if (ready) { build(LASTIX || { p: [], m: [] }); }
      try { st && st.setItem(NLS, JSON.stringify({ at: Date.now(), ix: j })); } catch (e) {}
      if (root && root.classList.contains('on')) render();
    }).catch(function () {});
  }
  var LASTIX = null;
  function store() { try { return window.localStorage; } catch (e) { return null; } }
  var loading = null;
  function load() {
    if (loading) return loading;
    var st = store(), cached = null;
    try { cached = st && JSON.parse(st.getItem(LS) || 'null'); } catch (e) {}
    if (cached && cached.ix) { build(cached.ix); meta.offline = true; }
    var fresh = cached && Date.now() - cached.at < 6 * 3600e3;
    var net = fresh && navigator.onLine !== false ? Promise.resolve() : (window.KBVerify ? KBVerify.fetchSigned('/api/x/a/index') : fetch('/api/x/a/index').then(function (r) { return r.text().then(function (t) { return { ok: r.ok, text: t, json: JSON.parse(t), check: null }; }); }))
      .then(function (r) {
        if (!r || !r.ok || !r.json || !r.json.p) return;
        if (!cached || cached.ix.v !== r.json.v) build(r.json);
        try { st && st.setItem(LS, JSON.stringify({ at: Date.now(), ix: r.json })); meta.offline = true; } catch (e) { meta.offline = false; }
        if (r.check) r.check.then(function (c) { meta.verified = c.state; foot(); });
      }).catch(function () {});
    var nm = loadNamed();
    loading = cached && cached.ix ? Promise.resolve() : Promise.all([net, nm]);
    return loading;
  }
  // scoring: every query word must appear, as a substring (word start scores more) or as an ordered subsequence within a short span
  function score(it, qs) {
    var s = 0, h = it.h;
    for (var i = 0; i < qs.length; i++) {
      var q = qs[i], k = h.indexOf(q);
      if (k >= 0) { s += (k === 0 ? 14 : /[\s\-\/]/.test(h[k - 1]) ? 10 : 5) + Math.min(q.length, 6); if (it.t === 'project' && norm(it.id || it.title) === q) s += 40; continue; }
      if (q.length < 3) return -1;
      // tightest ordered match of the letters, trying each start position (typos like "prcing", "offplan")
      var best = 1e9, st0 = h.indexOf(q[0]);
      while (st0 >= 0 && best > q.length) { var j = 1, x = st0 + 1; for (; x < h.length && j < q.length; x++) if (h[x] === q[j]) j++; if (j === q.length) best = Math.min(best, x - st0); else break; st0 = h.indexOf(q[0], st0 + 1); }
      if (best > q.length * 2) return -1;
      s += 2;
    }
    return s * 10 + it.w * (qs.join('').length < 4 ? 6 : 2) - h.length / 400;
  }
  function search(q) {
    var t0 = performance.now(), qs = norm(q).split(' ').filter(Boolean), out = [];
    if (!qs.length) out = items.filter(function (x) { return x.t === 'page'; }).slice(0, 10).map(function (x) { return { it: x, s: 0 }; });
    else { for (var i = 0; i < items.length; i++) { var s = score(items[i], qs); if (s > 0) out.push({ it: items[i], s: s }); } out.sort(function (a, b) { return b.s - a.s; }); out = out.slice(0, 40); }
    var url = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(q.trim()) && !/^[a-z]{2,6}-\d+$/i.test(q.trim());
    if (url) out.unshift({ it: { t: 'action', title: (TL ? TL.dr[0] : 'Run a desk review of ') + q.trim(), sub: TL ? TL.dr[1] : 'Tool · reads the page and lists what it promises and leaves out', href: (TL ? '/' + LG : '') + '/check?url=' + encodeURIComponent(q.trim()) + '#analyze' }, s: 1e9 });
    return { list: out, ms: performance.now() - t0, total: items.length };
  }
  var root, input, list, footEl, last = { list: [] }, active = 0, prevFocus = null;
  var CSS = '.kxp{position:fixed;inset:0;z-index:1000;display:none;align-items:flex-start;justify-content:center;padding:12vh 16px 16px;background:rgba(23,33,43,.42)}' +
    '.kxp.on{display:flex}.kxp-b{width:min(640px,100%);max-height:72vh;display:flex;flex-direction:column;background:#fff;border-radius:16px;box-shadow:0 24px 60px rgba(23,33,43,.35);overflow:hidden;font-family:Archivo,system-ui,sans-serif;color:#17212B}' +
    '.kxp-h{display:flex;align-items:center;gap:10px;padding:0 14px;border-bottom:1px solid rgba(23,33,43,.12)}.kxp-h svg{width:18px;height:18px;flex:none;color:#59626B}' +
    '.kxp-h input{flex:1;min-width:0;height:56px;border:0;outline:0;font:500 1.05rem Archivo,system-ui,sans-serif;color:#17212B;background:none}.kxp-h input::placeholder{color:#7A838C}' +
    '.kxp-x{border:1px solid rgba(23,33,43,.18);background:#F6F6F3;border-radius:7px;font:700 .72rem Archivo,system-ui,sans-serif;color:#59626B;padding:5px 8px;cursor:pointer;min-height:30px}' +
    '.kxp-l{list-style:none;margin:0;padding:6px;overflow-y:auto;overscroll-behavior:contain;flex:1}' +
    '.kxp-l li{display:flex;align-items:center;gap:12px;padding:9px 10px;border-radius:10px;cursor:pointer;min-height:48px}.kxp-l li[aria-selected=true]{background:#F1EFE9;box-shadow:inset 3px 0 0 #FF5B14}' +
    '.kxp-l .ic{flex:none;width:30px;height:30px;border-radius:8px;display:grid;place-items:center;font:800 .62rem Archivo,system-ui,sans-serif;letter-spacing:.04em;background:#E3E2DD;color:#2A3541}.kxp-l .ic.project{background:#17212B;color:#fff}.kxp-l .ic.market{background:#DDEFE7;color:#075E41}.kxp-l .ic.action{background:#FF5B14;color:#170800}.kxp-l .ic.dev{background:#E8E1F5;color:#3B2672}' +
    '.kxp-l .tx{min-width:0;flex:1}.kxp-l b{display:block;font-weight:700;font-size:.95rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.kxp-l small{display:block;color:#59626B;font-size:.8rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.kxp-l mark{background:none;color:#B83A05;font-weight:800}' +
    '.kxp-l .fl{flex:none;font:700 .7rem Archivo,system-ui,sans-serif;color:#8F2D04;background:#FDE6DC;border-radius:99px;padding:2px 8px}' +
    '.kxp-e{padding:22px 16px;color:#59626B;font-size:.92rem}' +
    '.kxp-f{display:flex;flex-wrap:wrap;gap:4px 14px;justify-content:space-between;padding:9px 14px;border-top:1px solid rgba(23,33,43,.12);font-size:.74rem;color:#59626B;background:#FAFAF8}.kxp-f kbd{font:600 .7rem ui-monospace,Menlo,monospace;border:1px solid rgba(23,33,43,.2);border-bottom-width:2px;border-radius:4px;padding:0 4px;background:#fff}' +
    '[dir=rtl] .kxp-l li[aria-selected=true]{box-shadow:inset -3px 0 0 #FF5B14}' +
    '@media (max-width:600px){.kxp{padding:0;align-items:stretch}.kxp-b{max-height:none;height:100%;border-radius:0}.kxp-f .kb{display:none}}' +
    '@media (max-width:600px),(pointer:coarse){.kxp-x{min-width:44px;min-height:44px;font-size:0;line-height:0;border-radius:10px}.kxp-x::before{content:"\\00d7";font-size:1.6rem;line-height:1;font-weight:500}}';
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hl(text, q) {
    var e = esc(text), qs = norm(q).split(' ').filter(function (x) { return x.length > 1; });
    qs.forEach(function (w) { var k = norm(text).indexOf(w); if (k >= 0 && norm(text).length === text.length) { var raw = text.substr(k, w.length); e = e.replace(esc(raw), '<mark>' + esc(raw) + '</mark>'); } });
    return e;
  }
  // n28c: the type badges were English letters (PG, ID, MK, GO, DV) in every language; drawn icons read the same everywhere
  var SV = function (d) { return '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg>'; };
  var IC = { page: SV('M5 2.5h7l3 3v12H5zM12 2.5v3h3M8 10h5M8 13.5h5'), project: SV('M3 17.5h14M5 17.5V8l5-4 5 4v9.5M8.5 17.5v-4h3v4'), market: SV('M10 18s-5.5-5-5.5-9.5a5.5 5.5 0 0 1 11 0C15.5 13 10 18 10 18zM10 10.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'), action: SV('M4 10h11M11 5.5 15.5 10 11 14.5'), dev: SV('M3 17.5h14M4.5 17.5V6h6v11.5M10.5 9.5h5v8M7 9h1.5M7 12h1.5M13 12.5h.5') };
  function render() {
    var q = input.value, r = search(q); last = r; active = 0;
    if (!r.list.length) { list.innerHTML = '<li class="kxp-e" role="presentation">' + (ready || !q ? (TL ? esc(TL.none(q)) : 'Nothing matches "' + esc(q) + '". Try a market (Bali, Dubai), a project id (BALI-014) or a page (pricing).') : (TL ? TL.ld : 'Loading the project index…')) + '</li>'; input.setAttribute('aria-activedescendant', ''); }
    else list.innerHTML = r.list.map(function (x, i) { var it = x.it; return '<li role="option" id="kxp-o' + i + '" aria-selected="' + (i === 0) + '" data-i="' + i + '"><span class="ic ' + it.t + '" aria-hidden="true">' + IC[it.t] + '</span><span class="tx"><b>' + hl(it.title, q) + '</b><small>' + esc(it.sub) + '</small></span>' + (it.flags ? '<span class="fl">' + it.flags + ' ' + (TL ? pn(it.flags, TL.fl) : 'flag' + (it.flags > 1 ? 's' : '')) + '</span>' : '') + '</li>'; }).join('');
    if (r.list.length) input.setAttribute('aria-activedescendant', 'kxp-o0');
    input.setAttribute('aria-expanded', r.list.length ? 'true' : 'false');
    foot();
  }
  function foot() {
    if (!footEl) return;
    if (TL) { var F = TL.ft, nloc = LG === 'ar' || LG === 'zh' ? 'en' : LG, vv = meta.verified === 'ok' ? ' · ' + F[7] : meta.verified ? ' · ' + F[8] + ': ' + meta.verified : '';
      var cm = LG === 'ar' ? '، ' : LG === 'zh' ? '，' : ', ';
      footEl.innerHTML = '<span>' + (ready ? meta.n.toLocaleString(nloc) + ' ' + (TL.fw ? pn(meta.n, TL.fw[0]) : F[0]) + cm + meta.markets + ' ' + (TL.fw ? pn(meta.markets, TL.fw[1]) : F[1]) + cm + PAGES.length + ' ' + (TL.fw ? pn(PAGES.length, TL.fw[2]) : F[2]) : PAGES.length + ' ' + F[3]) + ' · ' + F[4] + ' ' + (last.ms != null ? last.ms.toLocaleString(nloc, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '0') + ' ' + F[5] + (meta.offline ? ' · ' + F[6] : '') + vv + '</span><span class="kb"><kbd>↑</kbd> <kbd>↓</kbd> ' + TL.kb[0] + ' · <kbd>Enter</kbd> ' + TL.kb[1] + ' · <kbd>Esc</kbd> ' + TL.kb[2] + '</span>'; return; }
    var v = meta.verified === 'ok' ? ' · index signature verified' : meta.verified && meta.verified !== 'ok' ? ' · index signature: ' + meta.verified : '';
    footEl.innerHTML = '<span>' + (ready ? meta.n.toLocaleString('en') + ' projects, ' + meta.markets + ' markets, ' + PAGES.length + ' pages' : PAGES.length + ' pages (projects loading)') + ' · searched in ' + (last.ms != null ? last.ms.toFixed(1) : '0') + ' ms in your browser' + (meta.offline ? ' · saved for offline use' : '') + v + '</span><span class="kb"><kbd>↑</kbd> <kbd>↓</kbd> move · <kbd>Enter</kbd> open · <kbd>Esc</kbd> close</span>';
  }
  function setActive(i) {
    var n = last.list.length; if (!n) return; active = (i + n) % n;
    list.querySelectorAll('[role=option]').forEach(function (li, k) { li.setAttribute('aria-selected', k === active ? 'true' : 'false'); });
    var el = document.getElementById('kxp-o' + active); if (el) { el.scrollIntoView({ block: 'nearest' }); input.setAttribute('aria-activedescendant', el.id); }
  }
  function go(i, newTab) {
    var x = last.list[i]; if (!x) return;
    try { var st = store(), rc = JSON.parse((st && st.getItem(RK)) || '[]').filter(function (h) { return h !== x.it.href; }); rc.unshift(x.it.href); st && st.setItem(RK, JSON.stringify(rc.slice(0, 8))); } catch (e) {}
    try { if (window.kbEvent) kbEvent('palette_open_result', { type: x.it.t }); } catch (e) {}
    if (newTab) window.open(x.it.href, '_blank', 'noopener'); else { close(true); location.href = x.it.href; }
  }
  function mount() {
    if (root) return;
    var s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s);
    root = document.createElement('div'); root.className = 'kxp'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', TL ? TL.dl : 'Search Kolaboro');
    root.innerHTML = '<div class="kxp-b"><div class="kxp-h"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="m13 13 5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
      '<input type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="kxp-l" aria-label="' + (TL ? TL.al : 'Search projects, markets and pages') + '" placeholder="' + (TL ? TL.ph : 'Search projects, markets, pages…') + '" autocomplete="off" spellcheck="false" enterkeyhint="go">' +
      '<button type="button" class="kxp-x" aria-label="' + (TL ? TL.cl : 'Close search') + '">Esc</button></div><ul class="kxp-l" id="kxp-l" role="listbox" aria-label="' + (TL ? TL.rs : 'Results') + '"></ul><div class="kxp-f" aria-live="polite"></div></div>';
    document.body.appendChild(root);
    input = root.querySelector('input'); list = root.querySelector('.kxp-l'); footEl = root.querySelector('.kxp-f');
    input.addEventListener('input', render);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
      else if (e.key === 'Home' && e.ctrlKey) { e.preventDefault(); setActive(0); }
      else if (e.key === 'Enter') { e.preventDefault(); go(active, e.metaKey || e.ctrlKey); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
    list.addEventListener('mousemove', function (e) { var li = e.target.closest('[role=option]'); if (li && +li.dataset.i !== active) setActive(+li.dataset.i); });
    list.addEventListener('click', function (e) { var li = e.target.closest('[role=option]'); if (li) go(+li.dataset.i, e.metaKey || e.ctrlKey); });
    root.querySelector('.kxp-x').addEventListener('click', function () { close(); });
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); close(); return; } if (e.key !== 'Tab') return; var b = root.querySelector('.kxp-x'); e.preventDefault(); (document.activeElement === input ? b : input).focus(); });
    root.addEventListener('mousedown', function (e) { if (e.target === root) close(); });
  }
  var bodyOverflow = '';
  function open(q) {
    mount(); if (root.classList.contains('on')) { input.select(); return; }
    prevFocus = document.activeElement; root.classList.add('on'); bodyOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    if (typeof q === 'string') input.value = q;
    render(); input.focus(); input.select();
    load().then(function () { if (root.classList.contains('on')) render(); });
    try { if (window.kbEvent) kbEvent('palette_open'); } catch (e) {}
    document.querySelectorAll('[data-kx-search]').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
  }
  function close(navigating) {
    if (!root || !root.classList.contains('on')) return;
    root.classList.remove('on'); document.body.style.overflow = bodyOverflow;
    document.querySelectorAll('[data-kx-search]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    if (!navigating && prevFocus && prevFocus.focus) prevFocus.focus();
  }
  window.KBPalette = { open: open, close: close, load: load, search: search, isOpen: function () { return !!(root && root.classList.contains('on')); }, meta: meta };
  try { document.dispatchEvent(new CustomEvent('kbpalette:ready')); } catch (e) {}
})();
