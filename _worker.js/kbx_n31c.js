// kolaboro.com (n31c, batch 31, 18 Nov 2026): data part 2. No paid AI, no database reads or writes: everything comes from the
// published data files (named.json, bali-cases.json, stalled-sites.json, wayback.json).
//   12, 117  stable ids with aliases: a developer recorded under two spellings and a project recorded twice answer with a 301 to the
//            one stable page (/[lang/]projects|developers/<alias>/..., /api/v1/projects|developers/<alias>..., /answers/developer/<alias>.md)
//   121-123  Dubai Land Department register line on Dubai project pages: DLD project number and status, escrow bank, % built at the
//            latest DLD inspection and its date, units, completion date on the register (from named.json fx.dld, built by named.py)
//   116, 118 /engineering/data-quality/: what to fill next by place (gaps) and the automatic checks run on every build (named.json qa)
//   108      GET /[lang/]stalled/: projects where a public source reports stopped works, or the official completion date passed with the
//            register showing work unfinished, or the handover date passed with no visible change from space; facts and sources only
//   114      Wayback Machine line on project pages: earliest and latest archived copy of the tracked page (/data/wayback.json)
const ORIGIN = 'https://kolaboro.com';
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const pre = l => l === 'en' ? '' : '/' + l;
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
const nf = (n, l, d) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { maximumFractionDigits: d == null ? 0 : d, numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
const fdt = (d, l) => { if (!d) return ''; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(String(d).slice(0, 10) + 'T12:00:00Z')); } catch (e) { return d; } };
const bdi = t => '<bdi>' + esc(t) + '</bdi>';

// ------------------------------------------------------------------------------------------------ 12, 117: aliases
// Same map as tools/kolaboro-agent/aliases.json on main (named.py publishes it in named.json "aliases"; this copy answers before any
// data file is read). A new pair is added to both.
export const DEV_ALIAS = {
  'aldar-properties-pjsc': 'aldar-properties', 'arada-developments-l-l-c-s-o-c': 'arada', 'azizi-developments-l-l-c': 'azizi-developments', 'berjaya-land-bhd': 'berjaya-land-berhad',
  'breig-property-development': 'breig-property', 'danube-properties-development-l-l-c': 'danube-properties', 'dar-global-plc': 'dar-global', emaar: 'emaar-properties',
  'investland-bali-properties': 'investland-bali', 'lamda-development-s-a': 'lamda-development', 'magnum-estate-international': 'magnum-estate', 'metrovacesa-s-a': 'metrovacesa',
  'modon-properties-pjsc': 'modon', 'rak-properties-pjsc': 'rak-properties', 'range-developments-group': 'range-developments', 'sansiri-pcl': 'sansiri',
  'sansiri-public-company-limited': 'sansiri', 'sumitomo-realty-development-co-ltd': 'sumitomo-realty-development', 'taraf-development-l-l-c': 'taraf', cyrela: 'cyrela-brazil-realty',
  'the-related-group': 'related-group', 'abitarein-s-p-a': 'abitare-in-s-p-a', 'cps-africa': 'cps', 'banyan-group': 'banyan-group-residences',
  'origin-property-pcl': 'origin-property-public-company-limited', 'ornsirin-group': 'ornsirin-holding-pcl', 'sc-asset-corporation-pcl': 'sc-asset-corporation-plc', 'rhom-bho-property-pcl': 'rhom-bho-property-plc'
};
export const PROJ_ALIAS = { 'eaton-park-gamuda-land': 'eaton-park-thu-duc-hcmc', 'pavilion-damansara-heights-phase-2-imperial-residences-and-r': 'pavilion-damansara-heights-phase-2-jendela-mayang' };
const AL_RX = /^(\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:projects|developers)\/|\/api\/v1\/(?:projects|developers)\/|\/answers\/developer\/)([a-z0-9-]{1,90})(\/.*|\.md|\.csv)?$/;
let LIVE = null;   // the aliases of the last named.json this isolate read (a pair added on main before this file is updated)
export function setLive(a) { if (a && typeof a === 'object') LIVE = a; }
export function aliasOf(kind, slug) {
  const m = kind === 'developers' ? DEV_ALIAS : PROJ_ALIAS, l = LIVE && LIVE[kind];
  return m[slug] || (l && l[slug]) || null;
}
export function aliasRedirect(u) {   // 301 Response or null
  const m = AL_RX.exec(u.pathname); if (!m) return null;
  const kind = /developer/.test(m[1]) ? 'developers' : 'projects', to = aliasOf(kind, m[2]);
  if (!to) return null;
  return new Response(null, { status: 301, headers: { location: m[1] + to + (m[3] || '') + u.search, 'cache-control': 'public, max-age=86400', 'x-kb-alias': m[2] } });
}
export function aliasesFor(slug) { return [...new Set(Object.entries(DEV_ALIAS).concat(Object.entries((LIVE && LIVE.developers) || {})).filter(([, v]) => v === slug).map(([k]) => k))].sort(); }

// ------------------------------------------------------------------------------------------------ 121-123: DLD register line
const DL = {
  en: { k: 'DLD register', no: 'project {n}', built: '{p} % built at the DLD inspection of {d}', bank: 'escrow bank: {b}', units: '{u} units', comp: 'completion date on the register: {d}' },
  es: { k: 'Registro DLD', no: 'proyecto {n}', built: '{p} % construido en la inspección del DLD del {d}', bank: 'banco de la cuenta escrow: {b}', units: '{u} unidades', comp: 'fecha de terminación en el registro: {d}' },
  de: { k: 'DLD-Register', no: 'Projekt {n}', built: '{p} % gebaut bei der DLD-Inspektion vom {d}', bank: 'Treuhandbank: {b}', units: '{u} Einheiten', comp: 'Fertigstellungsdatum im Register: {d}' },
  fr: { k: 'Registre DLD', no: 'projet {n}', built: '{p} % construit à l’inspection DLD du {d}', bank: 'banque du compte séquestre : {b}', units: '{u} logements', comp: 'date d’achèvement au registre : {d}' },
  nl: { k: 'DLD-register', no: 'project {n}', built: '{p} % gebouwd bij de DLD-inspectie van {d}', bank: 'escrowbank: {b}', units: '{u} eenheden', comp: 'opleverdatum in het register: {d}' },
  ru: { k: 'Реестр DLD', no: 'проект {n}', built: 'построено {p} % по инспекции DLD от {d}', bank: 'банк эскроу-счёта: {b}', units: '{u} объектов', comp: 'дата завершения в реестре: {d}' },
  zh: { k: 'DLD 登记', no: '项目 {n}', built: 'DLD {d} 检查时完工 {p}%', bank: '托管账户银行：{b}', units: '{u} 套', comp: '登记的竣工日期：{d}' },
  ar: { k: 'سجل دائرة الأراضي والأملاك', no: 'المشروع {n}', built: 'نسبة الإنجاز {p}٪ في فحص الدائرة بتاريخ {d}', bank: 'بنك حساب الضمان: {b}', units: '{u} وحدة', comp: 'تاريخ الإنجاز في السجل: {d}' }
};
export function dldKf(x, lang) {   // one key-facts tile, or ''
  const r = x && x.fx && x.fx.dld; if (!r || !r.src) return '';
  const L = DL[lang] || DL.en, parts = [];
  if (r.no) parts.push(esc(fill(L.no, { n: r.no })) + (r.st ? ' · <span lang="en" dir="ltr">' + esc(r.st) + '</span>' : ''));
  if (r.pct != null && r.pd) parts.push(esc(fill(L.built, { p: nf(r.pct, lang, 2), d: fdt(r.pd, lang) })));
  if (r.bank) parts.push(esc(fill(L.bank, { b: '' })) + '<span lang="en" dir="ltr">' + esc(r.bank) + '</span>');
  if (r.units) parts.push(esc(fill(L.units, { u: nf(r.units, lang) })));
  if (r.comp) parts.push(esc(fill(L.comp, { d: fdt(r.comp, lang) })));
  if (!parts.length) return '';
  let h = ''; try { h = new URL(r.src).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
  return '<div class="kf kdld"><dt>' + esc(L.k) + '</dt><dd>' + parts.join('<br>') + ' <a class="src" href="' + esc(r.src) + '" rel="nofollow noopener" target="_blank">' + esc(h) + '</a></dd></div>';
}

// ------------------------------------------------------------------------------------------------ 114: Wayback Machine line
const WB = {
  en: 'Earlier copies of the tracked page in the Internet Archive: first {a}, latest {b}.', es: 'Copias anteriores de la página seguida en Internet Archive: la primera del {a}, la última del {b}.',
  de: 'Frühere Kopien der beobachteten Seite im Internet Archive: erste vom {a}, letzte vom {b}.', fr: 'Copies antérieures de la page suivie dans l’Internet Archive : première du {a}, dernière du {b}.',
  nl: 'Eerdere kopieën van de gevolgde pagina in het Internet Archive: eerste van {a}, laatste van {b}.', ru: 'Прежние копии отслеживаемой страницы в Internet Archive: первая от {a}, последняя от {b}.',
  zh: 'Internet Archive 中所跟踪页面的早期副本：最早 {a}，最近 {b}。', ar: 'نسخ سابقة من الصفحة المتابَعة في أرشيف الإنترنت: الأولى بتاريخ {a}، والأخيرة بتاريخ {b}.'
};
const WB_ALL = { en: 'all copies', es: 'todas las copias', de: 'alle Kopien', fr: 'toutes les copies', nl: 'alle kopieën', ru: 'все копии', zh: '全部副本', ar: 'كل النسخ' };
const ts2d = t => /^\d{8}/.test(String(t || '')) ? t.slice(0, 4) + '-' + t.slice(4, 6) + '-' + t.slice(6, 8) : null;
export function wbLine(wb, x, lang) {   // '' or one <li>
  const r = wb && x && wb.pages && wb.pages[x.url]; if (!r || !r.f) return '';
  const a = ts2d(r.f), b = ts2d(r.l || r.f); if (!a) return '';
  const link = (t, label) => '<a href="https://web.archive.org/web/' + esc(t) + '/' + esc(x.url) + '" rel="nofollow noopener" target="_blank">' + esc(label) + '</a>';
  return '<li class="kfact kwb">' + fill(esc(WB[lang] || WB.en), { a: link(r.f, fdt(a, lang)), b: link(r.l || r.f, fdt(b, lang)) }) + ' <a class="src" href="https://web.archive.org/web/*/' + esc(x.url) + '" rel="nofollow noopener" target="_blank">' + esc(WB_ALL[lang] || WB_ALL.en) + '</a></li>';
}

// ------------------------------------------------------------------------------------------------ 116, 118: gaps and automatic checks
const GF = ['pin', 'pn', 'co', 'pay', 'prog', 'price', 'ho'];
const GW = { pin: 3, pn: 3, co: 2, pay: 2, prog: 2, price: 1, ho: 1 };   // what a buyer needs first counts more when choosing the next work
const G = {
  en: { h: 'What to fill next, by place', lead: 'For each place with 10 or more projects: how many projects still miss each fact, and the three facts to look for first (missing count weighted: pin and permit number 3, company register, payment plan and construction status 2, price and handover 1). The daily data work starts from this list; the same table is in /api/v1/data-quality as "gaps".', th: ['Place', 'Projects', 'Look for first'], f: { pin: 'pin on the map', pn: 'permit number', co: 'registered company', pay: 'payment plan', prog: 'construction status', price: 'price', ho: 'handover date' }, miss: '{f}: {n} missing',
    vh: 'Automatic checks on every build', vlead: 'Every time the dataset is built, each record is checked by fixed rules before it is published. "Held": the value is impossible and is not published. "Check": the value is possible but unusual, a person looks again. Results of the build of {d}: {n} records checked.', vth: ['Rule', 'Kind', 'Records'], vk: { hold: 'held', check: 'check' }, vnone: 'No record matched this rule in this build.', vlist: 'Records to look at again',
    ah: 'One stable id per developer and per project', alead: 'The same company recorded under two spellings of its name, and the same project recorded twice, now have one page each. The other addresses answer with a permanent redirect (301) to the stable page, in every language and in the API.', ath: ['Address before', 'Stable page'] },
  es: { h: 'Qué falta por completar, por lugar', lead: 'Para cada lugar con 10 o más proyectos: cuántos proyectos no tienen todavía cada dato y los tres datos que conviene buscar primero (faltas ponderadas: ubicación y número de permiso 3, empresa registrada, plan de pagos y estado de obra 2, precio y entrega 1). El trabajo diario de datos parte de esta lista; la misma tabla está en /api/v1/data-quality como "gaps".', th: ['Lugar', 'Proyectos', 'Buscar primero'], f: { pin: 'ubicación en el mapa', pn: 'número de permiso', co: 'empresa registrada', pay: 'plan de pagos', prog: 'estado de obra', price: 'precio', ho: 'fecha de entrega' }, miss: '{f}: faltan {n}',
    vh: 'Comprobaciones automáticas en cada publicación', vlead: 'Cada vez que se genera el conjunto de datos, cada ficha pasa por reglas fijas antes de publicarse. "Retenido": el valor es imposible y no se publica. "Revisar": el valor es posible pero raro y lo vuelve a mirar una persona. Resultados de la generación del {d}: {n} fichas comprobadas.', vth: ['Regla', 'Tipo', 'Fichas'], vk: { hold: 'retenido', check: 'revisar' }, vnone: 'Ninguna ficha cumplió esta regla en esta generación.', vlist: 'Fichas para volver a mirar',
    ah: 'Un identificador estable por promotor y por proyecto', alead: 'La misma empresa registrada con dos formas de su nombre y el mismo proyecto registrado dos veces tienen ahora una sola página. Las otras direcciones responden con una redirección permanente (301) a la página estable, en todos los idiomas y en la API.', ath: ['Dirección anterior', 'Página estable'] },
  de: { h: 'Was als Nächstes fehlt, nach Ort', lead: 'Für jeden Ort mit 10 oder mehr Projekten: wie vielen Projekten jede Angabe noch fehlt, und die drei Angaben, nach denen zuerst gesucht wird (Fehlzahl gewichtet: Kartenpunkt und Genehmigungsnummer 3, eingetragenes Unternehmen, Zahlungsplan und Baustand 2, Preis und Übergabe 1). Die tägliche Datenarbeit beginnt mit dieser Liste; dieselbe Tabelle steht in /api/v1/data-quality als "gaps".', th: ['Ort', 'Projekte', 'Zuerst suchen'], f: { pin: 'Kartenpunkt', pn: 'Genehmigungsnummer', co: 'eingetragenes Unternehmen', pay: 'Zahlungsplan', prog: 'Baustand', price: 'Preis', ho: 'Übergabetermin' }, miss: '{f}: {n} fehlen',
    vh: 'Automatische Prüfungen bei jedem Build', vlead: 'Bei jedem Erstellen des Datensatzes wird jeder Eintrag vor der Veröffentlichung nach festen Regeln geprüft. "Zurückgehalten": der Wert ist unmöglich und wird nicht veröffentlicht. "Prüfen": der Wert ist möglich, aber ungewöhnlich; eine Person sieht ihn sich erneut an. Ergebnis des Builds vom {d}: {n} Einträge geprüft.', vth: ['Regel', 'Art', 'Einträge'], vk: { hold: 'zurückgehalten', check: 'prüfen' }, vnone: 'Kein Eintrag hat in diesem Build diese Regel erfüllt.', vlist: 'Einträge zum erneuten Ansehen',
    ah: 'Eine feste Kennung je Bauträger und Projekt', alead: 'Dasselbe Unternehmen unter zwei Schreibweisen und dasselbe Projekt, das zweimal erfasst war, haben jetzt je eine Seite. Die anderen Adressen leiten dauerhaft (301) auf die feste Seite weiter, in allen Sprachen und in der API.', ath: ['Frühere Adresse', 'Feste Seite'] },
  fr: { h: 'Ce qui reste à compléter, par lieu', lead: 'Pour chaque lieu de 10 projets ou plus : combien de projets n’ont pas encore chaque donnée, et les trois données à chercher d’abord (manques pondérés : position sur la carte et numéro de permis 3, société immatriculée, plan de paiement et état du chantier 2, prix et livraison 1). Le travail quotidien sur les données part de cette liste ; le même tableau est dans /api/v1/data-quality sous "gaps".', th: ['Lieu', 'Projets', 'À chercher d’abord'], f: { pin: 'position sur la carte', pn: 'numéro de permis', co: 'société immatriculée', pay: 'plan de paiement', prog: 'état du chantier', price: 'prix', ho: 'date de livraison' }, miss: '{f} : {n} manquants',
    vh: 'Contrôles automatiques à chaque publication', vlead: 'À chaque construction du jeu de données, chaque fiche passe des règles fixes avant d’être publiée. « Retenu » : la valeur est impossible et n’est pas publiée. « À revoir » : la valeur est possible mais inhabituelle, une personne la revoit. Résultats de la construction du {d} : {n} fiches contrôlées.', vth: ['Règle', 'Type', 'Fiches'], vk: { hold: 'retenu', check: 'à revoir' }, vnone: 'Aucune fiche n’a déclenché cette règle dans cette construction.', vlist: 'Fiches à revoir',
    ah: 'Un identifiant stable par promoteur et par projet', alead: 'La même société enregistrée sous deux graphies de son nom et le même projet enregistré deux fois ont désormais une seule page. Les autres adresses répondent par une redirection permanente (301) vers la page stable, dans toutes les langues et dans l’API.', ath: ['Ancienne adresse', 'Page stable'] },
  nl: { h: 'Wat nog ontbreekt, per plaats', lead: 'Voor elke plaats met 10 of meer projecten: hoeveel projecten elk gegeven nog missen, en de drie gegevens om eerst naar te zoeken (gewogen: kaartpunt en vergunningsnummer 3, ingeschreven bedrijf, betalingsplan en bouwstand 2, prijs en oplevering 1). Het dagelijkse datawerk begint bij deze lijst; dezelfde tabel staat in /api/v1/data-quality als "gaps".', th: ['Plaats', 'Projecten', 'Eerst zoeken'], f: { pin: 'kaartpunt', pn: 'vergunningsnummer', co: 'ingeschreven bedrijf', pay: 'betalingsplan', prog: 'bouwstand', price: 'prijs', ho: 'opleverdatum' }, miss: '{f}: {n} ontbreken',
    vh: 'Automatische controles bij elke build', vlead: 'Elke keer dat de dataset wordt gebouwd, gaat elk record door vaste regels voordat het wordt gepubliceerd. "Tegengehouden": de waarde is onmogelijk en wordt niet gepubliceerd. "Nakijken": de waarde kan, maar is ongewoon; iemand kijkt opnieuw. Resultaat van de build van {d}: {n} records gecontroleerd.', vth: ['Regel', 'Soort', 'Records'], vk: { hold: 'tegengehouden', check: 'nakijken' }, vnone: 'Geen record voldeed in deze build aan deze regel.', vlist: 'Records om opnieuw te bekijken',
    ah: 'Eén vaste id per ontwikkelaar en per project', alead: 'Hetzelfde bedrijf onder twee schrijfwijzen en hetzelfde project dat twee keer was vastgelegd, hebben nu elk één pagina. De andere adressen sturen permanent (301) door naar de vaste pagina, in alle talen en in de API.', ath: ['Vorig adres', 'Vaste pagina'] },
  ru: { h: 'Что заполнить дальше, по местам', lead: 'Для каждого места с 10 и более проектами: у скольких проектов ещё нет каждого факта и три факта, которые ищем в первую очередь (вес пропусков: точка на карте и номер разрешения 3, зарегистрированная компания, план оплаты и стадия строительства 2, цена и сдача 1). Ежедневная работа с данными начинается с этого списка; та же таблица есть в /api/v1/data-quality как "gaps".', th: ['Место', 'Проекты', 'Искать в первую очередь'], f: { pin: 'точка на карте', pn: 'номер разрешения', co: 'зарегистрированная компания', pay: 'план оплаты', prog: 'стадия строительства', price: 'цена', ho: 'дата сдачи' }, miss: '{f}: нет у {n}',
    vh: 'Автоматические проверки при каждой сборке', vlead: 'При каждой сборке набора данных каждая запись проходит фиксированные правила до публикации. «Задержано»: значение невозможно и не публикуется. «Проверить»: значение возможно, но необычно, его пересматривает человек. Результаты сборки от {d}: проверено записей: {n}.', vth: ['Правило', 'Тип', 'Записи'], vk: { hold: 'задержано', check: 'проверить' }, vnone: 'В этой сборке ни одна запись не попала под это правило.', vlist: 'Записи для повторной проверки',
    ah: 'Один постоянный идентификатор для каждого застройщика и проекта', alead: 'Одна и та же компания, записанная под двумя написаниями, и один и тот же проект, записанный дважды, теперь имеют по одной странице. Остальные адреса отвечают постоянным перенаправлением (301) на постоянную страницу на всех языках и в API.', ath: ['Прежний адрес', 'Постоянная страница'] },
  zh: { h: '各地下一步要补的数据', lead: '每个有 10 个及以上项目的地点：每项事实还有多少项目缺少，以及最先要找的三项（缺失数加权：地图位置和许可证号 3，注册公司、付款计划和施工状态 2，价格和交付 1）。每天的数据工作从这张表开始；同一张表在 /api/v1/data-quality 的 "gaps" 中。', th: ['地点', '项目', '最先查找'], f: { pin: '地图位置', pn: '许可证号', co: '注册公司', pay: '付款计划', prog: '施工状态', price: '价格', ho: '交付日期' }, miss: '{f}：缺 {n}',
    vh: '每次构建时的自动检查', vlead: '每次生成数据集时，每条记录在发布前都按固定规则检查。“扣留”：数值不可能，不发布。“复查”：数值可能但不寻常，由人再看一次。{d} 构建的结果：检查了 {n} 条记录。', vth: ['规则', '类型', '记录'], vk: { hold: '扣留', check: '复查' }, vnone: '本次构建没有记录触发此规则。', vlist: '需要再看的记录',
    ah: '每个开发商和每个项目一个固定标识', alead: '以两种写法记录的同一家公司、记录了两次的同一项目，现在各只有一个页面。其他地址以永久重定向 (301) 指向固定页面，所有语言和 API 均如此。', ath: ['原地址', '固定页面'] },
  ar: { h: 'ما يجب استكماله بعد ذلك، حسب المكان', lead: 'لكل مكان فيه 10 مشاريع أو أكثر: كم مشروعًا ما زال ينقصه كل معلومة، والمعلومات الثلاث التي نبحث عنها أولًا (النقص موزون: الموقع على الخريطة ورقم الترخيص 3، الشركة المسجلة وخطة الدفع وحالة البناء 2، السعر والتسليم 1). يبدأ العمل اليومي على البيانات من هذه القائمة؛ والجدول نفسه في /api/v1/data-quality باسم "gaps".', th: ['المكان', 'المشاريع', 'يُبحث عنه أولًا'], f: { pin: 'الموقع على الخريطة', pn: 'رقم الترخيص', co: 'الشركة المسجلة', pay: 'خطة الدفع', prog: 'حالة البناء', price: 'السعر', ho: 'موعد التسليم' }, miss: '{f}: ينقص {n}',
    vh: 'فحوص تلقائية في كل إصدار', vlead: 'في كل مرة تُبنى فيها مجموعة البيانات، يمر كل سجل بقواعد ثابتة قبل نشره. "محجوز": القيمة مستحيلة ولا تُنشر. "للمراجعة": القيمة ممكنة لكنها غير معتادة، ويعيد شخص النظر فيها. نتائج إصدار {d}: فُحص {n} سجلًا.', vth: ['القاعدة', 'النوع', 'السجلات'], vk: { hold: 'محجوز', check: 'للمراجعة' }, vnone: 'لم يطابق أي سجل هذه القاعدة في هذا الإصدار.', vlist: 'سجلات تحتاج إلى نظرة ثانية',
    ah: 'معرّف ثابت واحد لكل مطوّر ولكل مشروع', alead: 'الشركة نفسها المسجلة بكتابتين لاسمها، والمشروع نفسه المسجل مرتين، صار لكل منهما صفحة واحدة. العناوين الأخرى تُحوَّل تحويلًا دائمًا (301) إلى الصفحة الثابتة، بكل اللغات وفي واجهة البرمجة.', ath: ['العنوان السابق', 'الصفحة الثابتة'] }
};
const RULE = {
  pin_range: { en: 'pin outside the valid range or at 0,0', es: 'ubicación fuera de rango o en 0,0', de: 'Kartenpunkt außerhalb des gültigen Bereichs oder bei 0,0', fr: 'position hors limites ou à 0,0', nl: 'kaartpunt buiten bereik of op 0,0', ru: 'точка вне допустимого диапазона или в 0,0', zh: '位置超出有效范围或为 0,0', ar: 'موقع خارج النطاق الصحيح أو عند 0,0' },
  date_impossible: { en: 'handover or start year before 1990 or after 2050', es: 'año de entrega o de inicio antes de 1990 o después de 2050', de: 'Übergabe- oder Baubeginnjahr vor 1990 oder nach 2050', fr: 'année de livraison ou de début avant 1990 ou après 2050', nl: 'oplever- of startjaar vóór 1990 of na 2050', ru: 'год сдачи или начала до 1990 или после 2050', zh: '交付或开工年份早于 1990 或晚于 2050', ar: 'سنة التسليم أو البدء قبل 1990 أو بعد 2050' },
  price_negative: { en: 'price of zero or below', es: 'precio igual o inferior a cero', de: 'Preis null oder darunter', fr: 'prix nul ou négatif', nl: 'prijs nul of lager', ru: 'цена ноль или ниже', zh: '价格为零或更低', ar: 'سعر صفر أو أقل' },
  deposit_range: { en: 'deposit outside 0 to 100 %', es: 'depósito fuera de 0 a 100 %', de: 'Anzahlung außerhalb 0 bis 100 %', fr: 'acompte hors de 0 à 100 %', nl: 'aanbetaling buiten 0 tot 100 %', ru: 'задаток вне 0–100 %', zh: '定金不在 0 到 100% 之间', ar: 'دفعة مقدمة خارج 0 إلى 100٪' },
  pin_far: { en: 'pin more than 150 km from the other pins of its place', es: 'ubicación a más de 150 km de las demás de su lugar', de: 'Kartenpunkt mehr als 150 km von den anderen des Ortes entfernt', fr: 'position à plus de 150 km des autres du même lieu', nl: 'kaartpunt meer dan 150 km van de andere in die plaats', ru: 'точка дальше 150 км от остальных точек места', zh: '位置距同地其他位置超过 150 公里', ar: 'موقع يبعد أكثر من 150 كم عن بقية مواقع المكان' },
  price_range: { en: 'price from below USD 5,000 or above USD 150 million', es: 'precio desde por debajo de 5.000 USD o por encima de 150 millones', de: 'Preis ab unter 5.000 USD oder über 150 Mio. USD', fr: 'prix à partir de moins de 5 000 USD ou plus de 150 millions', nl: 'vanafprijs onder 5.000 USD of boven 150 miljoen', ru: 'цена «от» ниже 5 000 USD или выше 150 млн', zh: '起价低于 5,000 美元或高于 1.5 亿美元', ar: 'سعر يبدأ بأقل من 5,000 دولار أو أكثر من 150 مليونًا' },
  price_order: { en: 'price "to" below price "from"', es: 'precio "hasta" menor que el precio "desde"', de: 'Preis "bis" unter Preis "ab"', fr: 'prix « jusqu’à » inférieur au prix « à partir de »', nl: 'prijs "tot" lager dan prijs "vanaf"', ru: 'цена «до» ниже цены «от»', zh: '最高价低于起价', ar: 'السعر "إلى" أقل من السعر "من"' },
  size_range: { en: 'size below 8 m² or above 50,000 m², or minimum above maximum', es: 'superficie menor de 8 m² o mayor de 50.000 m², o mínimo mayor que máximo', de: 'Fläche unter 8 m² oder über 50.000 m² oder Minimum über Maximum', fr: 'surface inférieure à 8 m² ou supérieure à 50 000 m², ou minimum au-dessus du maximum', nl: 'oppervlak onder 8 m² of boven 50.000 m², of minimum boven maximum', ru: 'площадь меньше 8 м² или больше 50 000 м², или минимум больше максимума', zh: '面积小于 8 平方米或大于 50,000 平方米，或最小值大于最大值', ar: 'مساحة أقل من 8 م² أو أكثر من 50,000 م²، أو الحد الأدنى أكبر من الأعلى' },
  start_after_handover: { en: 'building start later than the promised handover', es: 'inicio de obra posterior a la entrega prometida', de: 'Baubeginn nach der zugesagten Übergabe', fr: 'début des travaux après la livraison promise', nl: 'bouwstart na de beloofde oplevering', ru: 'начало строительства позже обещанной сдачи', zh: '开工晚于承诺交付', ar: 'بدء البناء بعد موعد التسليم الموعود' },
  completed_future: { en: '"completed" with a handover more than a year ahead', es: '"terminado" con entrega a más de un año vista', de: '"fertiggestellt" mit Übergabe in mehr als einem Jahr', fr: '« achevé » avec une livraison à plus d’un an', nl: '"opgeleverd" met oplevering over meer dan een jaar', ru: '«завершён» при сдаче более чем через год', zh: '“已完工”但交付在一年以后', ar: '"مكتمل" مع تسليم بعد أكثر من سنة' },
  same_name: { en: 'the same name twice in one place', es: 'el mismo nombre dos veces en un lugar', de: 'derselbe Name zweimal an einem Ort', fr: 'le même nom deux fois dans un lieu', nl: 'dezelfde naam twee keer in één plaats', ru: 'одно и то же название дважды в одном месте', zh: '同一地点同名两次', ar: 'الاسم نفسه مرتين في مكان واحد' },
  twin_pin: { en: 'two pins of one place less than 25 m apart with similar names', es: 'dos ubicaciones a menos de 25 m con nombres parecidos', de: 'zwei Kartenpunkte unter 25 m Abstand mit ähnlichen Namen', fr: 'deux positions à moins de 25 m avec des noms proches', nl: 'twee kaartpunten minder dan 25 m uit elkaar met vergelijkbare namen', ru: 'две точки ближе 25 м с похожими названиями', zh: '两个位置相距不到 25 米且名称相似', ar: 'موقعان تفصلهما أقل من 25 م وبأسماء متشابهة' }
};
const has = v => v != null && v !== '' && !(Array.isArray(v) && !v.length);
function fieldOk(ix, x, k) {
  const fx = x.fx || {}, c = ix.caseBy.get(x.id) || {};
  switch (k) {
    case 'pin': return has(fx.lat) && has(fx.lng);
    case 'pn': return has(x.pn);
    case 'co': return has(fx.developer_company) || !!(c.verified && c.verified.record && c.verified.record !== 'none');
    case 'pay': return has(fx.payment_plan);
    case 'prog': return (c.checks || {}).progress != null || (fx.dld && fx.dld.pct != null);
    case 'price': return has(fx.price_min);
    case 'ho': return has(fx.handover_promised) || has(c.done);
  }
  return false;
}
const GAPS = new WeakMap();
export function gaps(ix) {   // [{ market, country, projects, missing: {field: n}, next: [field, n][] }]
  let g = GAPS.get(ix); if (g) return g;
  const M = new Map();
  for (const x of ix.P) {
    const m = M.get(x.mk) || { market: x.mk, country: x.co, projects: 0, missing: Object.fromEntries(GF.map(k => [k, 0])) };
    m.projects++; for (const k of GF) if (!fieldOk(ix, x, k)) m.missing[k]++; M.set(x.mk, m);
  }
  g = [...M.values()].filter(m => m.projects >= 10).map(m => Object.assign(m, { next: GF.map(k => [k, m.missing[k], m.missing[k] * GW[k]]).filter(a => a[1] > 0).sort((a, b) => b[2] - a[2] || b[1] - a[1]).slice(0, 3).map(a => [a[0], a[1]]) }))
    .sort((a, b) => b.next.reduce((s, n) => s + n[1] * GW[n[0]], 0) - a.next.reduce((s, n) => s + n[1] * GW[n[0]], 0));
  GAPS.set(ix, g); return g;
}
export function dqJson(ix) {
  const qa = (ix.named && ix.named.qa) || null, al = (ix.named && ix.named.aliases) || { developers: DEV_ALIAS, projects: PROJ_ALIAS };
  return {
    gaps: { method: 'Places with 10 or more projects. missing = projects without the fact on their published record. next = up to three facts ranked by missing count x weight (pin 3, permit number 3, registered company 2, payment plan 2, construction status 2, price 1, handover 1).', weights: GW, places: gaps(ix).map(m => ({ market: m.market, country: m.country, projects: m.projects, missing: m.missing, next: m.next.map(a => a[0]) })) },
    validation: qa ? { checked: qa.checked, records: qa.records, held: qa.held, counts: qa.counts || {}, rules: qa.rules, issues: (qa.issues || []).slice(0, 500).map(i => ({ id: i[0], rule: i[1], field: i[2], value: i[3] })) } : null,
    aliases: { developers: al.developers || {}, projects: al.projects || {}, rule: 'Old addresses answer with a 301 to the stable page in every language and in /api/v1.' }
  };
}
export function dqExtra(ix, lang) {
  const L = G[lang] || G.en, P = pre(lang), byId = ix.byId;
  const g = gaps(ix);
  const grow = g.map(m => '<tr><th scope="row">' + bdi(m.market) + '</th><td>' + nf(m.projects, lang) + '</td><td>' + m.next.map(a => esc(fill(L.miss, { f: L.f[a[0]], n: nf(a[1], lang) }))).join('<br>') + '</td></tr>').join('');
  let h = '<h2 id="gaps">' + esc(L.h) + '</h2><p class="k-xs">' + esc(L.lead) + '</p><div class="n30-tw"><table class="n30-t n30-sm"><thead><tr>' + L.th.map(t => '<th scope="col">' + esc(t) + '</th>').join('') + '</tr></thead><tbody>' + grow + '</tbody></table></div>';
  const qa = ix.named && ix.named.qa;
  if (qa && qa.rules) {
    const cnt = qa.counts || {};
    const vrow = Object.entries(qa.rules).map(([k, r]) => '<tr><th scope="row">' + esc((RULE[k] || {})[lang] || (RULE[k] || {}).en || r[1]) + '</th><td>' + esc(L.vk[r[0]] || r[0]) + '</td><td>' + nf(cnt[k] || 0, lang) + '</td></tr>').join('');
    const items = (qa.issues || []).filter(i => byId.has(i[0])).slice(0, 40).map(i => { const x = byId.get(i[0]); return '<li><a href="' + P + '/projects/' + esc(x.s) + '/">' + bdi(x.n) + '</a> <small>(' + bdi(x.mk) + ')</small>: ' + esc((RULE[i[1]] || {})[lang] || i[1]) + (i[3] != null ? ' <small lang="en" dir="ltr">[' + esc(String(i[3])) + ']</small>' : '') + '</li>'; }).join('');
    h += '<h2 id="checks">' + esc(L.vh) + '</h2><p class="k-xs">' + esc(fill(L.vlead, { d: fdt(qa.checked, lang), n: nf(qa.records, lang) })) + '</p><div class="n30-tw"><table class="n30-t n30-sm"><thead><tr>' + L.vth.map(t => '<th scope="col">' + esc(t) + '</th>').join('') + '</tr></thead><tbody>' + vrow + '</tbody></table></div>' +
      (items ? '<h3>' + esc(L.vlist) + '</h3><ul>' + items + '</ul>' : '');
  }
  const al = (ix.named && ix.named.aliases) || { developers: DEV_ALIAS, projects: PROJ_ALIAS };
  const arow = [...Object.entries(al.projects || {}).map(([a, b]) => [P + '/projects/' + a + '/', P + '/projects/' + b + '/']), ...Object.entries(al.developers || {}).filter(([, b]) => ix.devs.has(b)).map(([a, b]) => [P + '/developers/' + a + '/', P + '/developers/' + b + '/'])]
    .map(([a, b]) => '<tr><td><code>' + esc(a) + '</code></td><td><a href="' + esc(b) + '">' + esc(b) + '</a></td></tr>').join('');
  if (arow) h += '<h2 id="ids">' + esc(L.ah) + '</h2><p class="k-xs">' + esc(L.alead) + '</p><div class="n30-tw"><table class="n30-t n30-sm"><thead><tr>' + L.ath.map(t => '<th scope="col">' + esc(t) + '</th>').join('') + '</tr></thead><tbody>' + arow + '</tbody></table></div>';
  return h;
}

// ------------------------------------------------------------------------------------------------ 108: stalled works
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?stalled\/?$|^\/api\/v1\/stalled$/;
const S = {
  en: { t: 'Stalled or unfinished projects past their date, with sources', h1: 'Stalled works and passed dates', lead: 'Projects we track where a public source reports that building work stopped, where the completion date on the official register has passed while the register still shows the work unfinished, or where the handover date on record has passed and satellite images show no visible change for at least 6 months. Each line is a dated fact with its source, never a verdict about a developer: works can restart, and registers and images lag behind the site.',
    a: 'A public source reports a stop or stall in the works', b: 'Official completion date passed, register shows the work unfinished', c: 'Handover date passed, no visible change from space',
    la: 'Reported in a public source.', lb: 'Completion date on the DLD register as we last read it: {d}, now passed; {p} % built at the DLD inspection of {i}.', lc: 'Handover on record {h} passed {m} months ago; Sentinel-2: no visible change for {n} months (newest clear image {d}).',
    none: 'No project in this group today.', n: '{n} projects', upd: 'Built from the published dataset of {d}.', more: 'See also', ov: 'Overdue handovers by place', sat: 'Satellite checks', dq: 'Data quality', m_h: 'How this list is made',
    method: 'Group 1: projects whose record holds a public source (press, court or regulator) classified as "stalled" by fixed wording rules (construction halted, stalled, stopped, suspended, abandoned site). Group 2: Dubai projects whose completion date on the Dubai Land Department register is in the past while the latest DLD inspection shows less than 100 % built. Group 3: projects whose handover date on record passed and whose 150 m window around the pin shows no visible change between clear Sentinel-2 quarters for 6 months or more (method on the satellite page). A project can be in more than one group. The DLD can extend a completion date after we read it: check the live register (linked on /registers/) before relying on a date.' },
  es: { t: 'Proyectos parados o sin terminar pasada su fecha, con fuentes', h1: 'Obras paradas y fechas vencidas', lead: 'Proyectos que seguimos en los que una fuente pública informa de que la obra se detuvo, en los que la fecha de terminación del registro oficial ya pasó y el registro sigue mostrando la obra sin terminar, o en los que la fecha de entrega registrada pasó y las imágenes de satélite no muestran cambios visibles en al menos 6 meses. Cada línea es un hecho fechado con su fuente, nunca un juicio sobre un promotor: las obras pueden reanudarse y los registros y las imágenes van por detrás de la obra.',
    a: 'Una fuente pública informa de una parada en la obra', b: 'Fecha oficial de terminación vencida y el registro muestra la obra sin terminar', c: 'Fecha de entrega vencida y sin cambios visibles desde el espacio',
    la: 'Publicado en una fuente pública.', lb: 'Fecha de terminación en el registro del DLD según nuestra última lectura: {d}, ya pasada; {p} % construido en la inspección del DLD del {i}.', lc: 'La entrega registrada, {h}, pasó hace {m} meses; Sentinel-2: sin cambios visibles en {n} meses (última imagen clara del {d}).',
    none: 'Hoy no hay proyectos en este grupo.', n: '{n} proyectos', upd: 'Generado con el conjunto de datos publicado el {d}.', more: 'Ver también', ov: 'Entregas vencidas por lugar', sat: 'Comprobaciones por satélite', dq: 'Calidad de los datos', m_h: 'Cómo se hace esta lista',
    method: 'Grupo 1: proyectos cuya ficha contiene una fuente pública (prensa, tribunal o regulador) clasificada como "parada" por reglas fijas de redacción (obra detenida, paralizada, suspendida, obra abandonada). Grupo 2: proyectos de Dubái cuya fecha de terminación en el registro del Dubai Land Department ya pasó mientras la última inspección del DLD muestra menos del 100 % construido. Grupo 3: proyectos cuya fecha de entrega registrada pasó y cuya ventana de 150 m alrededor de la ubicación no muestra cambios visibles entre trimestres despejados de Sentinel-2 durante 6 meses o más (método en la página de satélite). Un proyecto puede estar en más de un grupo. El DLD puede ampliar una fecha de terminación después de nuestra lectura: consulte el registro en vivo (enlazado en /registers/) antes de fiarse de una fecha.' },
  de: { t: 'Stillstehende oder unfertige Projekte nach ihrem Termin, mit Quellen', h1: 'Stillstand und verstrichene Termine', lead: 'Projekte, die wir verfolgen, bei denen eine öffentliche Quelle über einen Baustopp berichtet, bei denen das Fertigstellungsdatum im amtlichen Register verstrichen ist, während das Register die Arbeiten als unfertig zeigt, oder bei denen der erfasste Übergabetermin verstrichen ist und Satellitenbilder seit mindestens 6 Monaten keine sichtbare Veränderung zeigen. Jede Zeile ist eine datierte Tatsache mit Quelle, nie ein Urteil über einen Bauträger: Arbeiten können wieder aufgenommen werden, Register und Bilder hinken der Baustelle hinterher.',
    a: 'Eine öffentliche Quelle berichtet über einen Baustopp', b: 'Amtliches Fertigstellungsdatum verstrichen, Register zeigt die Arbeiten unfertig', c: 'Übergabetermin verstrichen, keine sichtbare Veränderung aus dem All',
    la: 'In einer öffentlichen Quelle berichtet.', lb: 'Fertigstellungsdatum im DLD-Register bei unserer letzten Abfrage: {d}, inzwischen verstrichen; {p} % gebaut bei der DLD-Inspektion vom {i}.', lc: 'Erfasste Übergabe {h} vor {m} Monaten verstrichen; Sentinel-2: seit {n} Monaten keine sichtbare Veränderung (neuestes klares Bild {d}).',
    none: 'Heute kein Projekt in dieser Gruppe.', n: '{n} Projekte', upd: 'Erstellt aus dem veröffentlichten Datensatz vom {d}.', more: 'Siehe auch', ov: 'Überfällige Übergaben nach Ort', sat: 'Satellitenprüfungen', dq: 'Datenqualität', m_h: 'Wie diese Liste entsteht',
    method: 'Gruppe 1: Projekte, deren Eintrag eine öffentliche Quelle (Presse, Gericht oder Aufsicht) enthält, die nach festen Wortregeln als "Stillstand" eingestuft ist (Bau gestoppt, stillgelegt, ausgesetzt, aufgegebene Baustelle). Gruppe 2: Projekte in Dubai, deren Fertigstellungsdatum im Register des Dubai Land Department in der Vergangenheit liegt, während die letzte DLD-Inspektion weniger als 100 % gebaut zeigt. Gruppe 3: Projekte, deren erfasster Übergabetermin verstrichen ist und deren 150-m-Fenster um den Kartenpunkt zwischen klaren Sentinel-2-Quartalen seit 6 Monaten oder länger keine sichtbare Veränderung zeigt (Methode auf der Satellitenseite). Ein Projekt kann in mehreren Gruppen stehen. Das DLD kann ein Fertigstellungsdatum nach unserer Abfrage verlängern: vor jeder Entscheidung das aktuelle Register prüfen (verlinkt auf /registers/).' },
  fr: { t: 'Projets à l’arrêt ou inachevés après leur date, avec sources', h1: 'Chantiers à l’arrêt et dates dépassées', lead: 'Projets que nous suivons pour lesquels une source publique signale l’arrêt du chantier, dont la date d’achèvement au registre officiel est passée alors que le registre montre encore les travaux inachevés, ou dont la date de livraison enregistrée est passée et dont les images satellite ne montrent aucun changement visible depuis au moins 6 mois. Chaque ligne est un fait daté avec sa source, jamais un jugement sur un promoteur : un chantier peut reprendre, et registres et images ont du retard sur le terrain.',
    a: 'Une source publique signale un arrêt du chantier', b: 'Date officielle d’achèvement dépassée, le registre montre les travaux inachevés', c: 'Date de livraison dépassée, aucun changement visible depuis l’espace',
    la: 'Signalé dans une source publique.', lb: 'Date d’achèvement au registre du DLD lors de notre dernière lecture : {d}, aujourd’hui dépassée ; {p} % construit à l’inspection DLD du {i}.', lc: 'Livraison enregistrée {h} dépassée depuis {m} mois ; Sentinel-2 : aucun changement visible depuis {n} mois (image claire la plus récente du {d}).',
    none: 'Aucun projet dans ce groupe aujourd’hui.', n: '{n} projets', upd: 'Construit à partir du jeu de données publié le {d}.', more: 'Voir aussi', ov: 'Livraisons en retard par lieu', sat: 'Contrôles par satellite', dq: 'Qualité des données', m_h: 'Comment cette liste est faite',
    method: 'Groupe 1 : projets dont la fiche contient une source publique (presse, tribunal ou régulateur) classée « arrêt » par des règles fixes de formulation (chantier arrêté, à l’arrêt, suspendu, site abandonné). Groupe 2 : projets de Dubaï dont la date d’achèvement au registre du Dubai Land Department est passée alors que la dernière inspection DLD montre moins de 100 % construit. Groupe 3 : projets dont la date de livraison enregistrée est passée et dont la fenêtre de 150 m autour de la position ne montre aucun changement visible entre trimestres Sentinel-2 dégagés depuis 6 mois ou plus (méthode sur la page satellite). Un projet peut figurer dans plusieurs groupes. Le DLD peut prolonger une date d’achèvement après notre lecture : consultez le registre en direct (lien sur /registers/) avant de vous fier à une date.' },
  nl: { t: 'Stilgevallen of onafgemaakte projecten na hun datum, met bronnen', h1: 'Stilgevallen bouw en verstreken data', lead: 'Projecten die we volgen waarbij een openbare bron meldt dat de bouw stillag, waarbij de opleverdatum in het officiële register verstreken is terwijl het register het werk nog als onafgemaakt toont, of waarbij de vastgelegde opleverdatum verstreken is en satellietbeelden al minstens 6 maanden geen zichtbare verandering tonen. Elke regel is een gedateerd feit met bron, nooit een oordeel over een ontwikkelaar: werk kan hervatten, en registers en beelden lopen achter op de bouwplaats.',
    a: 'Een openbare bron meldt een bouwstop', b: 'Officiële opleverdatum verstreken, register toont het werk onafgemaakt', c: 'Opleverdatum verstreken, geen zichtbare verandering vanuit de ruimte',
    la: 'Gemeld in een openbare bron.', lb: 'Opleverdatum in het DLD-register bij onze laatste lezing: {d}, inmiddels verstreken; {p} % gebouwd bij de DLD-inspectie van {i}.', lc: 'Vastgelegde oplevering {h} {m} maanden geleden verstreken; Sentinel-2: al {n} maanden geen zichtbare verandering (nieuwste heldere beeld {d}).',
    none: 'Vandaag geen project in deze groep.', n: '{n} projecten', upd: 'Gemaakt uit de gepubliceerde dataset van {d}.', more: 'Zie ook', ov: 'Te late opleveringen per plaats', sat: 'Satellietcontroles', dq: 'Datakwaliteit', m_h: 'Hoe deze lijst wordt gemaakt',
    method: 'Groep 1: projecten waarvan het record een openbare bron (pers, rechtbank of toezichthouder) bevat die met vaste woordregels als "stilgevallen" is ingedeeld (bouw stilgelegd, gestopt, opgeschort, verlaten bouwplaats). Groep 2: projecten in Dubai waarvan de opleverdatum in het register van het Dubai Land Department voorbij is terwijl de laatste DLD-inspectie minder dan 100 % gebouwd toont. Groep 3: projecten waarvan de vastgelegde opleverdatum verstreken is en waarvan het venster van 150 m rond het kaartpunt tussen heldere Sentinel-2-kwartalen 6 maanden of langer geen zichtbare verandering toont (methode op de satellietpagina). Een project kan in meer dan één groep staan. Het DLD kan een opleverdatum na onze lezing verlengen: controleer het actuele register (gelinkt op /registers/) voordat u op een datum vertrouwt.' },
  ru: { t: 'Остановленные или незавершённые проекты после срока, с источниками', h1: 'Остановленные стройки и прошедшие сроки', lead: 'Отслеживаемые проекты, по которым публичный источник сообщает об остановке работ, или по которым дата завершения в официальном реестре прошла, а реестр всё ещё показывает работы незавершёнными, или по которым записанная дата сдачи прошла, а спутниковые снимки не показывают видимых изменений не менее 6 месяцев. Каждая строка это датированный факт с источником, а не оценка застройщика: работы могут возобновиться, а реестры и снимки отстают от стройки.',
    a: 'Публичный источник сообщает об остановке работ', b: 'Официальная дата завершения прошла, реестр показывает работы незавершёнными', c: 'Дата сдачи прошла, видимых изменений из космоса нет',
    la: 'Сообщается в публичном источнике.', lb: 'Дата завершения в реестре DLD при нашем последнем чтении: {d}, уже прошла; построено {p} % по инспекции DLD от {i}.', lc: 'Записанная сдача {h} прошла {m} мес. назад; Sentinel-2: нет видимых изменений {n} мес. (последний ясный снимок {d}).',
    none: 'Сегодня в этой группе нет проектов.', n: 'проектов: {n}', upd: 'Собрано из набора данных, опубликованного {d}.', more: 'См. также', ov: 'Просроченные сдачи по местам', sat: 'Спутниковые проверки', dq: 'Качество данных', m_h: 'Как составлен этот список',
    method: 'Группа 1: проекты, в записи которых есть публичный источник (пресса, суд или регулятор), отнесённый фиксированными правилами формулировок к «остановке» (стройка остановлена, заморожена, приостановлена, заброшенная площадка). Группа 2: проекты в Дубае, у которых дата завершения в реестре Dubai Land Department в прошлом, а последняя инспекция DLD показывает меньше 100 % готовности. Группа 3: проекты, у которых записанная дата сдачи прошла, а окно 150 м вокруг точки не показывает видимых изменений между ясными кварталами Sentinel-2 6 месяцев и более (метод на странице спутника). Проект может входить в несколько групп. DLD может продлить дату завершения после нашего чтения: прежде чем полагаться на дату, проверьте действующий реестр (ссылка на /registers/).' },
  zh: { t: '逾期停工或未完工的项目（附来源）', h1: '停工与已过期限', lead: '我们跟踪的项目中：公开来源报道施工已停止的；官方登记的竣工日期已过而登记仍显示未完工的；或登记的交付日期已过且卫星图像至少 6 个月没有可见变化的。每一行都是带来源和日期的事实，绝非对开发商的评判：工程可能复工，登记和图像也会落后于现场。',
    a: '公开来源报道施工停止', b: '官方竣工日期已过，登记显示未完工', c: '交付日期已过，从太空看无可见变化',
    la: '见于公开来源。', lb: '我们最近一次读取时 DLD 登记的竣工日期为 {d}，现已过期；DLD {i} 检查时完工 {p}%。', lc: '登记的交付日期 {h} 已过 {m} 个月；Sentinel-2：{n} 个月无可见变化（最新清晰图像 {d}）。',
    none: '今天此组没有项目。', n: '{n} 个项目', upd: '根据 {d} 发布的数据集生成。', more: '另见', ov: '各地逾期交付', sat: '卫星检查', dq: '数据质量', m_h: '此列表的做法',
    method: '第 1 组：记录中含有按固定措辞规则归为“停工”的公开来源（媒体、法院或监管机构）的项目（施工停止、搁置、暂停、工地废弃）。第 2 组：迪拜土地局登记的竣工日期已过、而最近一次 DLD 检查显示完工不足 100% 的迪拜项目。第 3 组：登记的交付日期已过、且位置周围 150 米范围在 6 个月或更长时间内各晴朗季度的 Sentinel-2 图像之间无可见变化的项目（方法见卫星页面）。一个项目可同时属于多个组。DLD 可能在我们读取后延长竣工日期：依赖某个日期前，请查看实时登记（链接见 /registers/）。' },
  ar: { t: 'مشاريع متوقفة أو غير مكتملة بعد موعدها، مع المصادر', h1: 'أعمال متوقفة ومواعيد فائتة', lead: 'مشاريع نتابعها أفاد مصدر عام بتوقف أعمال البناء فيها، أو فات تاريخ إنجازها في السجل الرسمي بينما ما زال السجل يُظهر الأعمال غير مكتملة، أو فات موعد تسليمها المسجل ولا تُظهر صور الأقمار الصناعية أي تغيّر مرئي منذ 6 أشهر على الأقل. كل سطر حقيقة مؤرخة مع مصدرها، وليس حكمًا على أي مطوّر: قد تُستأنف الأعمال، والسجلات والصور تتأخر عن الموقع.',
    a: 'مصدر عام يفيد بتوقف الأعمال', b: 'فات تاريخ الإنجاز الرسمي والسجل يُظهر الأعمال غير مكتملة', c: 'فات موعد التسليم ولا تغيّر مرئي من الفضاء',
    la: 'ورد في مصدر عام.', lb: 'تاريخ الإنجاز في سجل الدائرة كما قرأناه آخر مرة: {d}، وقد فات؛ نسبة الإنجاز {p}٪ في فحص الدائرة بتاريخ {i}.', lc: 'فات موعد التسليم المسجل {h} منذ {m} شهرًا؛ Sentinel-2: لا تغيّر مرئي منذ {n} شهرًا (أحدث صورة صافية {d}).',
    none: 'لا مشاريع في هذه المجموعة اليوم.', n: '{n} مشروعًا', upd: 'أُعدّ من مجموعة البيانات المنشورة في {d}.', more: 'انظر أيضًا', ov: 'تسليمات متأخرة حسب المكان', sat: 'فحوص الأقمار الصناعية', dq: 'جودة البيانات', m_h: 'كيف تُعدّ هذه القائمة',
    method: 'المجموعة 1: مشاريع يتضمن سجلها مصدرًا عامًا (صحافة أو محكمة أو جهة رقابية) مصنفًا "متوقفًا" وفق قواعد صياغة ثابتة (توقف البناء، تجميد، تعليق، موقع مهجور). المجموعة 2: مشاريع في دبي فات تاريخ إنجازها في سجل دائرة الأراضي والأملاك بينما يُظهر آخر فحص للدائرة أقل من 100٪ إنجازًا. المجموعة 3: مشاريع فات موعد تسليمها المسجل ولا تُظهر نافذة 150 م حول موقعها أي تغيّر مرئي بين أرباع Sentinel-2 الصافية لمدة 6 أشهر أو أكثر (الطريقة في صفحة الأقمار الصناعية). قد يرد المشروع في أكثر من مجموعة. قد تمدّد الدائرة تاريخ الإنجاز بعد قراءتنا: راجع السجل المباشر (الرابط في /registers/) قبل الاعتماد على أي تاريخ.' }
};
async function loadPub(env, name) {
  const c = (globalThis.__kbN31 = globalThis.__kbN31 || {});
  if (c[name] && Date.now() - c[name].t < 600000) return c[name].v;
  let v = null;
  try {
    let r = null; try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); } catch (e) { r = null; }
    if (!r || !r.ok) r = await fetch(ORIGIN + '/data/' + name, { cf: { cacheTtl: 300, cacheEverything: true } });
    if (r.ok) v = await r.json();
  } catch (e) { v = null; }
  c[name] = { t: Date.now(), v }; return v;
}
export async function wayback(env) { return loadPub(env, 'wayback.json'); }
let N = null;
async function named() { if (!N) N = await import('./kbx_named.js'); return N; }
export async function stalledList(env) {
  const n = await named(), ix = await n.data(env), ss = await loadPub(env, 'stalled-sites.json'), today = new Date().toISOString().slice(0, 10);
  const A = [], B = [], C = [];
  for (const x of ix.P) {
    for (const f of x.fl || []) if (f[0] === 'stalled' && n.okHttp(f[1])) { A.push({ x, src: f[1] }); break; }
    const d = x.fx && x.fx.dld;
    if (d && d.comp && d.comp < today && d.pct != null && d.pct < 100 && d.pd && d.src) B.push({ x, d });
    const sp = ss && ss.projects && ss.projects[x.id], ov = n.overdueOf(ix, x), ho = n.handoverOf(ix, x);
    if (sp && sp.status === 'ok' && (sp.no_visible_change_months || 0) >= 6 && ov && ho) C.push({ x, sp, ov, ho });
  }
  B.sort((a, b) => a.d.pct - b.d.pct); C.sort((a, b) => b.sp.no_visible_change_months - a.sp.no_visible_change_months);
  return { ix, n, A, B, C, updated: ix.updated };
}
async function stalledPage(env, shell, lang) {
  const L = S[lang] || S.en, P = pre(lang), R = await stalledList(env), { n } = R;
  const li = (x, inner, src) => { let h = ''; try { h = new URL(src).hostname.replace(/^www\./, ''); } catch (e) {} return '<li><a href="' + P + '/projects/' + esc(x.s) + '/">' + bdi(x.n) + '</a> <small>(' + bdi(x.mk) + ')</small><br>' + inner + (src ? ' <a class="src" href="' + esc(src) + '" rel="nofollow noopener" target="_blank">' + esc(h) + '</a>' : '') + '</li>'; };
  const grp = (id, h, rows) => '<h2 id="' + id + '">' + esc(h) + ' <small>(' + esc(fill(L.n, { n: nf(rows.length, lang) })) + ')</small></h2>' + (rows.length ? '<ul class="n31s">' + rows.join('') + '</ul>' : '<p>' + esc(L.none) + '</p>');
  const A = R.A.map(r => li(r.x, esc(L.la), r.src));
  const B = R.B.map(r => li(r.x, esc(fill(L.lb, { d: fdt(r.d.comp, lang), p: nf(r.d.pct, lang, 2), i: fdt(r.d.pd, lang) })), r.d.src));
  const C = R.C.map(r => li(r.x, esc(fill(L.lc, { h: n.fd(r.ho.d, lang), m: nf(r.ov.m, lang), n: nf(r.sp.no_visible_change_months, lang), d: fdt((r.sp.newest_clear_dates || []).slice(-1)[0], lang) })), null));
  const canonU = ORIGIN + P + '/stalled/', dir = lang === 'ar' ? ' dir="rtl"' : '';
  const body = '<section class="phero"' + dir + '><div class="wrap"><p class="crumb"><a href="' + P + '/">Kolaboro</a> / ' + esc(L.h1) + '</p><h1>' + esc(L.h1) + '</h1><p class="lead">' + esc(L.lead) + '</p></div></section>' +
    '<div class="wrap n31"' + dir + '><style>.n31{padding-bottom:40px}.n31 h2{margin-top:28px}.n31s{padding-inline-start:18px}.n31s li{margin:0 0 12px}.n31 .src{font-size:.85em}</style>' +
    '<p class="k-xs">' + esc(fill(L.upd, { d: fdt(R.updated, lang) })) + ' <a href="/api/v1/stalled">JSON</a></p>' +
    grp('reported', L.a, A) + grp('register', L.b, B) + grp('space', L.c, C) +
    '<h2>' + esc(L.m_h) + '</h2><p class="k-xs">' + esc(L.method) + '</p><p>' + esc(L.more) + ': <a href="' + P + '/handover/overdue/">' + esc(L.ov) + '</a> · <a href="/satellite/">' + esc(L.sat) + '</a> · <a href="' + P + '/engineering/data-quality/">' + esc(L.dq) + '</a></p></div>';
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebPage', url: canonU, name: L.h1, description: L.lead.slice(0, 300), inLanguage: lang, dateModified: R.updated, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + P + '/' }, { '@type': 'ListItem', position: 2, name: L.h1, item: canonU }] }] };
  return n.assemble({ title: L.t + ' | Kolaboro', desc: L.lead.slice(0, 152).replace(/\s+\S*$/, '') + '...', canon: canonU, body, ld, lastmod: R.updated, alt: l => ORIGIN + pre(l) + '/stalled/' }, lang, await shell(P + '/handover/overdue/'));
}
async function stalledJson(env) {
  const R = await stalledList(env);
  const one = x => ({ id: x.id, slug: x.s, name: x.n, market: x.mk, country: x.co, url: ORIGIN + '/projects/' + x.s + '/' });
  return { api: 'kolaboro-stalled-v1', updated: R.updated, method: S.en.method, licence: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)',
    reported_in_source: R.A.map(r => Object.assign(one(r.x), { source: r.src })),
    register_date_passed: R.B.map(r => Object.assign(one(r.x), { register: 'Dubai Land Department', completion_on_register: r.d.comp, built_pct: r.d.pct, inspection: r.d.pd, source: r.d.src })),
    no_visible_change: R.C.map(r => Object.assign(one(r.x), { handover_on_record: r.ho.d, months_since: r.ov.m, no_visible_change_months: r.sp.no_visible_change_months, newest_clear_image: (r.sp.newest_clear_dates || []).slice(-1)[0] || null, source: ORIGIN + '/data/stalled-sites.json' })) };
}
export async function handle(req, u, env, ctx, shell) {
  const p = u.pathname;
  if (!PATHS.test(p) || (req.method !== 'GET' && req.method !== 'HEAD')) return null;
  if (p === '/api/v1/stalled') return new Response(JSON.stringify(await stalledJson(env), null, 1), { headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=900' } });
  if (!p.endsWith('/')) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } });
  const lang = (/^\/(es|de|fr|nl|ru|zh|ar)\//.exec(p) || [])[1] || 'en';
  return new Response(await stalledPage(env, shell, lang), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600', 'content-language': lang } });
}
export const stalledLabel = lang => (S[lang] || S.en).h1;
export { LANGS };

// ------------------------------------------------------------------------------------------------ 129, 130: results and credit ratings
// Latest full-year results and credit ratings of a few large listed developers, as the company announced them (listed-developers.json fin, rt).
const FR = {
  en: { res: 'Full-year {y} results as published by the company on {d}: revenue {rev}{np}{pbt}.', np: '; net profit {v}', pbt: '; profit before tax {v}', rt: 'Credit rating announced by the company on {d}: {a} {r}, outlook {o}.', o: { stable: 'stable', positive: 'positive', negative: 'negative' }, cav: 'Ratings and results change: the rating agency and the company\'s latest report are the sources of the current figures.' },
  es: { res: 'Resultados del año {y} publicados por la empresa el {d}: ingresos {rev}{np}{pbt}.', np: '; beneficio neto {v}', pbt: '; beneficio antes de impuestos {v}', rt: 'Calificación crediticia anunciada por la empresa el {d}: {a} {r}, perspectiva {o}.', o: { stable: 'estable', positive: 'positiva', negative: 'negativa' }, cav: 'Las calificaciones y los resultados cambian: la agencia y el último informe de la empresa son la fuente de las cifras vigentes.' },
  de: { res: 'Jahresergebnis {y}, vom Unternehmen veröffentlicht am {d}: Umsatz {rev}{np}{pbt}.', np: '; Nettogewinn {v}', pbt: '; Gewinn vor Steuern {v}', rt: 'Vom Unternehmen am {d} gemeldetes Kreditrating: {a} {r}, Ausblick {o}.', o: { stable: 'stabil', positive: 'positiv', negative: 'negativ' }, cav: 'Ratings und Ergebnisse ändern sich: Quelle der aktuellen Zahlen sind die Ratingagentur und der jüngste Bericht des Unternehmens.' },
  fr: { res: 'Résultats annuels {y} publiés par la société le {d} : chiffre d’affaires {rev}{np}{pbt}.', np: ' ; bénéfice net {v}', pbt: ' ; bénéfice avant impôts {v}', rt: 'Notation de crédit annoncée par la société le {d} : {a} {r}, perspective {o}.', o: { stable: 'stable', positive: 'positive', negative: 'négative' }, cav: 'Les notations et les résultats changent : l’agence de notation et le dernier rapport de la société sont la source des chiffres actuels.' },
  nl: { res: 'Jaarresultaten {y}, door het bedrijf gepubliceerd op {d}: omzet {rev}{np}{pbt}.', np: '; nettowinst {v}', pbt: '; winst voor belasting {v}', rt: 'Kredietrating, door het bedrijf bekendgemaakt op {d}: {a} {r}, vooruitzicht {o}.', o: { stable: 'stabiel', positive: 'positief', negative: 'negatief' }, cav: 'Ratings en resultaten veranderen: het ratingbureau en het laatste verslag van het bedrijf zijn de bron van de actuele cijfers.' },
  ru: { res: 'Годовые результаты за {y} год, опубликованные компанией {d}: выручка {rev}{np}{pbt}.', np: '; чистая прибыль {v}', pbt: '; прибыль до налогов {v}', rt: 'Кредитный рейтинг, объявленный компанией {d}: {a} {r}, прогноз {o}.', o: { stable: 'стабильный', positive: 'позитивный', negative: 'негативный' }, cav: 'Рейтинги и результаты меняются: источник актуальных данных это рейтинговое агентство и последний отчёт компании.' },
  zh: { res: '公司于 {d} 公布的 {y} 年全年业绩：收入 {rev}{np}{pbt}。', np: '；净利润 {v}', pbt: '；税前利润 {v}', rt: '公司于 {d} 公布的信用评级：{a} {r}，展望{o}。', o: { stable: '稳定', positive: '正面', negative: '负面' }, cav: '评级和业绩会变化：当前数据以评级机构和公司最新报告为准。' },
  ar: { res: 'نتائج العام {y} كما نشرتها الشركة في {d}: الإيرادات {rev}{np}{pbt}.', np: '؛ صافي الربح {v}', pbt: '؛ الربح قبل الضريبة {v}', rt: 'تصنيف ائتماني أعلنته الشركة في {d}: {a} {r}، النظرة {o}.', o: { stable: 'مستقرة', positive: 'إيجابية', negative: 'سلبية' }, cav: 'التصنيفات والنتائج تتغير: مصدر الأرقام الحالية هو وكالة التصنيف وآخر تقرير للشركة.' }
};
const fdym = (d, l) => /^\d{4}-\d{2}$/.test(String(d || '')) ? (() => { try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(d + '-15T12:00:00Z')); } catch (e) { return d; } })() : fdt(d, l);
const money = (cur, v, l) => '<span dir="ltr">' + esc(cur) + ' ' + nf(v / 1e9, l, 1) + ' bn</span>';
export function finRtHtml(d, lang) {   // '' or <li> items
  if (!d) return '';
  const L = FR[lang] || FR.en, src = (u, ) => { let h = ''; try { h = new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } return ' <a class="k-src" href="' + esc(u) + '" rel="noopener nofollow" target="_blank">' + esc(h) + '</a>'; };
  const out = [];
  const f = d.fin;
  if (f && f.rev && f.src) out.push(fill(esc(L.res), { y: esc(f.y), d: esc(fdt(f.d, lang)), rev: money(f.cur, f.rev, lang), np: f.np ? fill(esc(L.np), { v: money(f.cur, f.np, lang) }) : '', pbt: f.pbt ? fill(esc(L.pbt), { v: money(f.cur, f.pbt, lang) }) : '' }) + src(f.src));
  for (const r of d.rt || []) if (r.src && r.r) out.push(fill(esc(L.rt), { d: esc(fdym(r.d, lang)), a: '<span lang="en" dir="ltr">' + esc(r.a) + '</span>', r: '<b dir="ltr">' + esc(r.r) + '</b>', o: esc(L.o[r.o] || r.o) }) + src(r.src));
  if (!out.length) return '';
  return out.map(s => '<li class="kfact">' + s + '</li>').join('') + '<li class="k-muted">' + esc(L.cav) + '</li>';
}
