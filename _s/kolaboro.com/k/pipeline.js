// The machine behind the data: last run of each automated job, from the published data.
(function () {
  var el = document.getElementById('pipe-live'); if (!el) return;
  var TR = {
    es: { lr: 'Última ejecución: ', dy: 'Cada día', wk: 'Cada semana', st: 'empezando', all: 'todas las páginas', j: [
      ['Agente de investigación diario', 'Encuentra proyectos nuevos sobre plano y en construcción con búsqueda web, revisa cada uno en seis puntos y califica cada afirmación.', '# proyectos'],
      ['Lector de páginas', 'Vuelve a leer cada página de promotor y registra lo que cambió.', '# cambios registrados'],
      ['Sello de pruebas', 'Toma la huella de cada página leída y fecha un sello diario en Bitcoin.', '# páginas selladas'],
      ['Vigilancia de registros', 'Vuelve a consultar registros oficiales (primero las aprobaciones ambientales de Tailandia).', '# proyectos vigilados'],
      ['Vigilancia por satélite', 'Imágenes de Sentinel-2 de 27 zonas de mercado y una comprobación anual de cambios en los terrenos de los proyectos.', '# terrenos de proyectos'],
      ['Vigilante de retrasos', 'Meses de retraso sobre la entrega prometida en cada caso.', '# proyectos con retraso'],
      ['Control de calidad', 'Cada página en móvil y escritorio: enlaces rotos, errores, maquetación.', '']] },
    de: { lr: 'Zuletzt gelaufen: ', dy: 'Täglich', wk: 'Wöchentlich', st: 'startet', all: 'alle Seiten', j: [
      ['Täglicher Recherche-Agent', 'Findet per Websuche neue Off-Plan-Projekte und Projekte im Bau, prüft jedes in sechs Punkten und bewertet jede Angabe.', '# Projekte'],
      ['Seitenleser', 'Liest jede Bauträgerseite erneut und hält fest, was sich geändert hat.', '# Änderungen erfasst'],
      ['Beweissiegel', 'Erstellt einen Fingerabdruck jeder gelesenen Seite und verankert täglich ein Siegel in Bitcoin.', '# Seiten versiegelt'],
      ['Registerwache', 'Prüft amtliche Register erneut (zuerst Umweltgenehmigungen in Thailand).', '# Projekte beobachtet'],
      ['Satellitenwache', 'Sentinel-2-Bilder von 27 Marktgebieten und eine jährliche Änderungsprüfung der Projektgrundstücke.', '# Projektgrundstücke'],
      ['Verzugswächter', 'Monate über der versprochenen Übergabe, für jeden Fall.', '# Projekte im Verzug'],
      ['Qualitätsprüfung', 'Jede Seite auf Mobilgerät und Desktop: defekte Links, Fehler, Layout.', '']] },
    fr: { lr: 'Dernière exécution : ', dy: 'Chaque jour', wk: 'Chaque semaine', st: 'démarrage', all: 'toutes les pages', j: [
      ['Agent de recherche quotidien', 'Trouve par recherche web de nouveaux projets sur plan et en construction, vérifie chacun sur six points et note chaque affirmation.', '# projets'],
      ['Lecteur de pages', 'Relit chaque page de promoteur et enregistre ce qui a changé.', '# changements enregistrés'],
      ['Sceau de preuve', 'Prend l’empreinte de chaque page lue et horodate un sceau quotidien dans Bitcoin.', '# pages scellées'],
      ['Veille des registres', 'Revérifie les registres officiels (d’abord les autorisations environnementales en Thaïlande).', '# projets suivis'],
      ['Veille satellite', 'Images Sentinel-2 de 27 zones de marché et un contrôle annuel des changements sur les terrains des projets.', '# terrains de projets'],
      ['Veille des retards', 'Mois de retard sur la livraison promise, pour chaque dossier.', '# projets en retard'],
      ['Contrôle qualité', 'Chaque page sur mobile et ordinateur : liens cassés, erreurs, mise en page.', '']] },
    nl: { lr: 'Laatst uitgevoerd: ', dy: 'Elke dag', wk: 'Elke week', st: 'start', all: 'alle pagina’s', j: [
      ['Dagelijkse onderzoeksagent', 'Vindt via zoeken op het web nieuwe off-plan projecten en projecten in aanbouw, controleert elk op zes punten en beoordeelt elke claim.', '# projecten'],
      ['Paginalezer', 'Leest elke ontwikkelaarspagina opnieuw en legt vast wat er veranderd is.', '# wijzigingen vastgelegd'],
      ['Bewijszegel', 'Maakt een vingerafdruk van elke gelezen pagina en zet dagelijks een tijdstempel in Bitcoin.', '# pagina’s verzegeld'],
      ['Registerwacht', 'Controleert officiële registers opnieuw (eerst de milieuvergunningen in Thailand).', '# projecten gevolgd'],
      ['Satellietwacht', 'Sentinel-2-beelden van 27 marktgebieden en een jaarlijkse wijzigingscontrole van projectlocaties.', '# projectlocaties'],
      ['Vertragingswacht', 'Maanden over de beloofde oplevering, voor elk dossier.', '# projecten vertraagd'],
      ['Kwaliteitscontrole', 'Elke pagina op mobiel en desktop: kapotte links, fouten, opmaak.', '']] },
    ru: { lr: 'Последний запуск: ', dy: 'Каждый день', wk: 'Каждую неделю', st: 'запускается', all: 'все страницы', j: [
      ['Ежедневный исследовательский агент', 'Находит через веб-поиск новые проекты на этапе котлована и строящиеся, проверяет каждый по шести пунктам и оценивает каждое заявление.', 'проектов: #'],
      ['Чтение страниц', 'Заново читает каждую страницу застройщика и фиксирует изменения.', 'изменений зафиксировано: #'],
      ['Печать доказательств', 'Снимает отпечаток каждой прочитанной страницы и ежедневно фиксирует печать во времени в Bitcoin.', 'страниц опечатано: #'],
      ['Наблюдение за реестрами', 'Повторно проверяет официальные реестры (в первую очередь экологические разрешения в Таиланде).', 'проектов под наблюдением: #'],
      ['Спутниковое наблюдение', 'Снимки Sentinel-2 по 27 рыночным зонам и ежегодная проверка изменений на участках проектов.', 'участков проектов: #'],
      ['Контроль сроков', 'Месяцы просрочки обещанной сдачи по каждому проекту.', 'проектов с просрочкой: #'],
      ['Контроль качества', 'Каждая страница на телефоне и компьютере: битые ссылки, ошибки, вёрстка.', '']] },
    zh: { lr: '最近运行：', dy: '每天', wk: '每周', st: '即将开始', all: '全部页面', j: [
      ['每日研究代理', '通过网络搜索发现新的期房和在建项目，逐一核查六个要点，并为每项说法评级。', '# 个项目'],
      ['页面读取器', '重新读取每个开发商页面，并记录发生的变化。', '已记录 # 处变化'],
      ['证据封存', '为读取的每个页面生成指纹，并每天在比特币区块链上加盖一次时间戳。', '已封存 # 个页面'],
      ['登记处监测', '重新核查官方登记信息（首先是泰国的环境审批）。', '监测 # 个项目'],
      ['卫星监测', '27 个市场区域的 Sentinel-2 影像，并每年核查项目地块的变化。', '# 个项目地块'],
      ['逾期监测', '每个案例超过承诺交付日期的月数。', '# 个项目逾期'],
      ['质量检查', '每个页面在手机和电脑上的检查：失效链接、错误、版式。', '']] },
    ar: { lr: 'آخر تشغيل: ', dy: 'كل يوم', wk: 'كل أسبوع', st: 'قيد البدء', all: 'كل الصفحات', j: [
      ['وكيل البحث اليومي', 'يجد عبر البحث على الويب مشاريع جديدة على الخارطة وقيد الإنشاء، ويفحص كلًّا منها في ست نقاط ويقيّم كل ادعاء.', 'المشاريع: #'],
      ['قارئ الصفحات', 'يعيد قراءة كل صفحة مطوّر ويسجّل ما تغيّر.', 'التغييرات المسجّلة: #'],
      ['ختم الأدلة', 'يأخذ بصمة كل صفحة مقروءة ويختم ختمًا يوميًا بتوقيت في Bitcoin.', 'الصفحات المختومة: #'],
      ['مراقبة السجلات', 'يعيد فحص السجلات الرسمية (بدءًا بالموافقات البيئية في تايلاند).', 'المشاريع المراقَبة: #'],
      ['المراقبة بالأقمار الصناعية', 'صور Sentinel-2 لـ 27 منطقة سوق، وفحص سنوي للتغييرات في مواقع المشاريع.', 'مواقع المشاريع: #'],
      ['مراقب التأخير', 'عدد الأشهر بعد موعد التسليم الموعود في كل حالة.', 'المشاريع المتأخرة: #'],
      ['فحص الجودة', 'كل صفحة على الهاتف والكمبيوتر: الروابط المعطلة والأخطاء والتنسيق.', '']] }
  };
  fetch('/data/bali-cases.json?t=' + Math.floor(Date.now() / 6e5)).then(function (r) { return r.json(); }).then(function (d) {
    var C = d.cases || [], db = d.db || {}, ships = d.ships || [];
    var last = function (re) { var x = ships.filter(function (s) { return s.k === 'auto' && re.test(s.t); })[0]; return x ? x.d : null; };
    var maxd = function (f) { var v = C.map(f).filter(Boolean).sort(); return v.length ? v[v.length - 1] : null; };
    var J = [
      ['Daily crawler', 'Finds new off-plan and under-construction projects with web search, checks each on six points and rates every claim.', last(/new project/), 'Every day', (C.length).toLocaleString('en') + ' projects'],
      ['Page reader', 'Reads every developer page again and records what changed.', d.updated, 'Every day', (db.changes_detected || 0).toLocaleString('en') + ' changes recorded'],
      ['Evidence seal', 'Fingerprints every page read and timestamps one daily seal in Bitcoin.', d.seal ? d.seal.date : null, 'Every day', d.seal ? d.seal.count + ' pages sealed' : 'starting'],
      ['Registry watch', 'Re-checks official registers (Thailand environmental approvals first).', maxd(function (c) { return c.register && c.register.checked; }), 'Every week', (db.register_watched || 0) + ' projects watched'],
      ['Satellite watch', 'Sentinel-2 images of 27 market areas and a yearly change check for project sites.', maxd(function (c) { return c.sat && c.sat.date; }), 'Every week', (db.sat_watched || 0) + ' project sites'],
      ['Overdue watcher', 'Months past the promised handover on every case.', d.updated, 'Every day', (db.overdue || 0) + ' projects overdue'],
      ['Quality check', 'Every page on mobile and desktop: broken links, errors, layout.', null, 'Every day', 'all pages']
    ];
    // translated pages: the same jobs and figures in the page language
    var lg = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase(), T = TR[lg];
    if (T) {
      var nf = function (x) { return (+x || 0).toLocaleString(lg === 'ar' || lg === 'zh' ? 'en' : lg); };
      var dt = function (x) { if (!x) return x; var a = String(x).slice(0, 10).split('-'); try { return new Date(Date.UTC(+a[0], +a[1] - 1, +a[2])).toLocaleDateString(lg, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }); } catch (e) { return x; } };
      var U = [nf(C.length), nf(db.changes_detected), d.seal ? nf(d.seal.count) : null, nf(db.register_watched), nf(db.sat_watched), nf(db.overdue), null];
      J = J.map(function (j, i) { var t = T.j[i]; return [t[0], t[1], dt(j[2]), j[3] === 'Every week' ? T.wk : T.dy, U[i] == null ? (i === 2 ? T.st : T.all) : t[2].replace('#', U[i])]; });
      el.setAttribute('lang', lg);
    }
    el.innerHTML = J.map(function (j) {
      return '<li><div><b>' + j[0] + '</b><p>' + j[1] + '</p></div><div class="pl-m"><span class="pl-dot' + (j[2] ? '' : ' w') + '"></span>' + (j[2] ? (T ? T.lr : 'Last run ') + j[2] : j[3]) + '<small>' + j[3] + ' · ' + j[4] + '</small></div></li>';
    }).join('');
  }).catch(function () {});
})();
