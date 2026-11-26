/* Developer benchmark: compares ticked checks with the live distribution in /data/bali-cases.json. Nothing is stored or sent.
   n40 L7: the strings this script writes are chosen by the page language (<html lang>), English by default. */
(function(){
  var $ = function(i){ return document.getElementById(i); };
  var LG = String(document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
  var LOC = { en: 'en-GB', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar-u-nu-latn' }[LG] || 'en-GB';
  var EN = {
    ck: [['Building permit or licence number', 'A number and issuing authority turn "approved" into something a buyer can check in minutes.', 'Publish your permit or licence number', 'Get your permit confirmed on the official register'],
      ['Deposit protection', 'Protected deposits can be returned to buyers if a project stops.', 'Publish how buyer deposits are protected', 'Get your deposit protection confirmed by the regulator or the bank'],
      ['Construction progress', 'Dated progress lets buyers compare the site with the schedule before each payment.', 'Publish dated construction progress', 'Get progress confirmed by the regulator or an independent engineer'],
      ['Plans and specification', 'Plans with areas and a specification define what the buyer is paying for.', 'Publish plans and a specification', 'Get your plans confirmed against the approved plans'],
      ['Developer track record', 'A company number and delivered projects with addresses show who is behind the brand.', 'Publish your company number and delivered projects', 'Get your company and deliveries confirmed by a registry or the press'],
      ['No guaranteed returns language', 'Estimates with their assumptions, instead of guarantees, keep you clear of a claim regulators restrict.', 'Remove guaranteed returns language', 'Have an independent source confirm you make no return guarantees']],
    pub: 'Published', conf: 'Confirmed', no: 'No', ym: 'your market', inm: 'in {m}', inall: 'in all markets', pct: '<b>{p}</b> percentile {l}',
    sm1: 'Only 1 project tracked in {m}: a rough signal.', smn: 'Only {n} projects tracked in {m}: a rough signal.',
    best: 'The change that moves you most', none: 'Nothing left to add', noneP: 'You publish all six core items and each is confirmed by a registry or an independent source. Keep them current: progress and permits go out of date fastest.',
    gp: 'Your published percentile in {m} goes from <b>{a}</b> to <b>{b}</b>{g}, and in all markets from <b>{c}</b> to <b>{d}</b>{h}. ', gc: 'Your confirmed percentile in {m} goes from <b>{a}</b> to <b>{b}</b>{g}, and in all markets from <b>{c}</b> to <b>{d}</b>{h}. ',
    shp: '{p}% of tracked projects in {m} publish this today.', shc: '{p}% of tracked projects in {m} have this confirmed today.',
    tpl: 'Template for this', what: 'What to publish ({id})', oth: 'Other changes, ranked', pts: 'Percentile points gained in {m} on the published or confirmed score.',
    hp: 'Published, {m}', hpa: 'Published, all markets', hc: 'Confirmed, {m}', hca: 'Confirmed, all markets', bar: '{i} of 6: {n}', you: 'You: {x}',
    th: ['Check', 'Publish, {m}', 'Confirmed, {m}', 'Publish, all', 'You'],
    upd: 'Live data updated {d}: {n} projects in {c} countries.', err: 'Live data unavailable right now. Please refresh in a moment.', err2: 'The live data did not load.'
  };
  var TX = {
    es: { ck: [['Número de licencia o permiso de obra', 'Un número y la autoridad que lo emite convierten "aprobado" en algo que un comprador puede comprobar en minutos.', 'Publique su número de licencia o permiso', 'Haga confirmar su licencia en el registro oficial'],
        ['Protección de los depósitos', 'Los depósitos protegidos se pueden devolver a los compradores si un proyecto se detiene.', 'Publique cómo se protegen los depósitos de los compradores', 'Haga confirmar la protección de los depósitos por el regulador o el banco'],
        ['Avance de obra', 'Un avance fechado permite comparar la obra con el calendario antes de cada pago.', 'Publique el avance de obra con fechas', 'Haga confirmar el avance por el regulador o un ingeniero independiente'],
        ['Planos y memoria de calidades', 'Los planos con superficies y una memoria de calidades definen lo que paga el comprador.', 'Publique planos y una memoria de calidades', 'Haga confirmar sus planos frente a los planos aprobados'],
        ['Historial del promotor', 'Un número de sociedad y proyectos entregados con dirección muestran quién está detrás de la marca.', 'Publique su número de sociedad y los proyectos entregados', 'Haga confirmar su sociedad y sus entregas por un registro o la prensa'],
        ['Sin promesas de rentabilidad garantizada', 'Estimaciones con sus supuestos, en lugar de garantías, le evitan una afirmación que los reguladores restringen.', 'Elimine las promesas de rentabilidad garantizada', 'Haga confirmar por una fuente independiente que no garantiza rentabilidades']],
      pub: 'Publicado', conf: 'Confirmado', no: 'No', ym: 'su mercado', inm: 'en {m}', inall: 'en todos los mercados', pct: 'percentil <b>{p}</b> {l}',
      sm1: 'Solo 1 proyecto seguido en {m}: una señal aproximada.', smn: 'Solo {n} proyectos seguidos en {m}: una señal aproximada.',
      best: 'El cambio que más le hace avanzar', none: 'No queda nada por añadir', noneP: 'Publica los seis elementos básicos y cada uno está confirmado por un registro o una fuente independiente. Manténgalos al día: el avance de obra y las licencias son lo que antes se queda desfasado.',
      gp: 'Su percentil publicado en {m} pasa de <b>{a}</b> a <b>{b}</b>{g}, y en todos los mercados de <b>{c}</b> a <b>{d}</b>{h}. ', gc: 'Su percentil confirmado en {m} pasa de <b>{a}</b> a <b>{b}</b>{g}, y en todos los mercados de <b>{c}</b> a <b>{d}</b>{h}. ',
      shp: 'El {p}% de los proyectos seguidos en {m} lo publica hoy.', shc: 'El {p}% de los proyectos seguidos en {m} lo tiene confirmado hoy.',
      tpl: 'Plantilla para esto', what: 'Qué publicar ({id})', oth: 'Otros cambios, por orden', pts: 'Puntos de percentil ganados en {m} en la puntuación publicada o confirmada.',
      hp: 'Publicado, {m}', hpa: 'Publicado, todos los mercados', hc: 'Confirmado, {m}', hca: 'Confirmado, todos los mercados', bar: '{i} de 6: {n}', you: 'Usted: {x}',
      th: ['Comprobación', 'Lo publica, {m}', 'Confirmado, {m}', 'Lo publica, todos', 'Usted'],
      upd: 'Datos en directo actualizados el {d}: {n} proyectos en {c} países.', err: 'Los datos en directo no están disponibles ahora mismo. Recargue en un momento.', err2: 'Los datos en directo no se han cargado.' },
    fr: { ck: [['Numéro de permis de construire ou de licence', 'Un numéro et l\'autorité qui le délivre transforment « approuvé » en quelque chose qu\'un acheteur vérifie en quelques minutes.', 'Publiez votre numéro de permis ou de licence', 'Faites confirmer votre permis dans le registre officiel'],
        ['Protection des acomptes', 'Des acomptes protégés peuvent être rendus aux acheteurs si un projet s\'arrête.', 'Publiez comment les acomptes des acheteurs sont protégés', 'Faites confirmer la protection des acomptes par le régulateur ou la banque'],
        ['Avancement des travaux', 'Un avancement daté permet de comparer le chantier au calendrier avant chaque paiement.', 'Publiez un avancement des travaux daté', 'Faites confirmer l\'avancement par le régulateur ou un ingénieur indépendant'],
        ['Plans et descriptif', 'Des plans avec surfaces et un descriptif définissent ce que l\'acheteur paie.', 'Publiez des plans et un descriptif', 'Faites confirmer vos plans par rapport aux plans approuvés'],
        ['Références du promoteur', 'Un numéro d\'entreprise et des projets livrés avec adresse montrent qui est derrière la marque.', 'Publiez votre numéro d\'entreprise et vos projets livrés', 'Faites confirmer votre société et vos livraisons par un registre ou la presse'],
        ['Aucune promesse de rendement garanti', 'Des estimations avec leurs hypothèses, plutôt que des garanties, vous évitent une affirmation que les régulateurs encadrent.', 'Supprimez les promesses de rendement garanti', 'Faites confirmer par une source indépendante que vous ne garantissez aucun rendement']],
      pub: 'Publié', conf: 'Confirmé', no: 'Non', ym: 'votre marché', inm: 'à {m}', inall: 'sur tous les marchés', pct: '<b>{p}</b>e centile {l}',
      sm1: 'Un seul projet suivi à {m} : un signal approximatif.', smn: 'Seulement {n} projets suivis à {m} : un signal approximatif.',
      best: 'Le changement qui vous fait le plus progresser', none: 'Plus rien à ajouter', noneP: 'Vous publiez les six éléments essentiels et chacun est confirmé par un registre ou une source indépendante. Tenez-les à jour : l\'avancement et les permis sont ce qui vieillit le plus vite.',
      gp: 'Votre centile publié à {m} passe de <b>{a}</b> à <b>{b}</b>{g}, et sur tous les marchés de <b>{c}</b> à <b>{d}</b>{h}. ', gc: 'Votre centile confirmé à {m} passe de <b>{a}</b> à <b>{b}</b>{g}, et sur tous les marchés de <b>{c}</b> à <b>{d}</b>{h}. ',
      shp: '{p} % des projets suivis à {m} publient cela aujourd\'hui.', shc: '{p} % des projets suivis à {m} l\'ont fait confirmer aujourd\'hui.',
      tpl: 'Modèle pour cela', what: 'Quoi publier ({id})', oth: 'Autres changements, par ordre', pts: 'Points de centile gagnés à {m} sur le score publié ou confirmé.',
      hp: 'Publié, {m}', hpa: 'Publié, tous les marchés', hc: 'Confirmé, {m}', hca: 'Confirmé, tous les marchés', bar: '{i} sur 6 : {n}', you: 'Vous : {x}',
      th: ['Contrôle', 'Publient, {m}', 'Confirmé, {m}', 'Publient, tous', 'Vous'],
      upd: 'Données en direct mises à jour le {d} : {n} projets dans {c} pays.', err: 'Les données en direct sont indisponibles pour le moment. Actualisez dans un instant.', err2: 'Les données en direct ne se sont pas chargées.' },
    de: { ck: [['Baugenehmigungs- oder Lizenznummer', 'Eine Nummer und die ausstellende Behörde machen aus "genehmigt" etwas, das ein Käufer in Minuten prüfen kann.', 'Veröffentlichen Sie Ihre Genehmigungs- oder Lizenznummer', 'Lassen Sie Ihre Genehmigung im amtlichen Register bestätigen'],
        ['Schutz der Anzahlungen', 'Geschützte Anzahlungen können an Käufer zurückgezahlt werden, wenn ein Projekt stoppt.', 'Veröffentlichen Sie, wie Käuferanzahlungen geschützt sind', 'Lassen Sie den Schutz der Anzahlungen von der Aufsicht oder der Bank bestätigen'],
        ['Baufortschritt', 'Datierter Fortschritt lässt Käufer die Baustelle vor jeder Zahlung mit dem Zeitplan vergleichen.', 'Veröffentlichen Sie datierten Baufortschritt', 'Lassen Sie den Fortschritt von der Aufsicht oder einem unabhängigen Ingenieur bestätigen'],
        ['Pläne und Baubeschreibung', 'Pläne mit Flächen und eine Baubeschreibung legen fest, wofür der Käufer zahlt.', 'Veröffentlichen Sie Pläne und eine Baubeschreibung', 'Lassen Sie Ihre Pläne gegen die genehmigten Pläne bestätigen'],
        ['Referenzen des Bauträgers', 'Eine Handelsregisternummer und fertiggestellte Projekte mit Adresse zeigen, wer hinter der Marke steht.', 'Veröffentlichen Sie Ihre Registernummer und fertiggestellte Projekte', 'Lassen Sie Firma und Fertigstellungen von einem Register oder der Presse bestätigen'],
        ['Keine Renditegarantien', 'Schätzungen mit ihren Annahmen statt Garantien halten Sie von einer Aussage fern, die Aufsichten beschränken.', 'Entfernen Sie Formulierungen mit garantierter Rendite', 'Lassen Sie von einer unabhängigen Quelle bestätigen, dass Sie keine Rendite garantieren']],
      pub: 'Veröffentlicht', conf: 'Bestätigt', no: 'Nein', ym: 'Ihrem Markt', inm: 'in {m}', inall: 'in allen Märkten', pct: '<b>{p}.</b> Perzentil {l}',
      sm1: 'Nur 1 Projekt in {m} erfasst: ein grobes Signal.', smn: 'Nur {n} Projekte in {m} erfasst: ein grobes Signal.',
      best: 'Die Änderung, die Sie am weitesten bringt', none: 'Nichts mehr hinzuzufügen', noneP: 'Sie veröffentlichen alle sechs Kernpunkte, und jeder ist von einem Register oder einer unabhängigen Quelle bestätigt. Halten Sie sie aktuell: Baufortschritt und Genehmigungen veralten am schnellsten.',
      gp: 'Ihr Perzentil (veröffentlicht) in {m} steigt von <b>{a}</b> auf <b>{b}</b>{g}, in allen Märkten von <b>{c}</b> auf <b>{d}</b>{h}. ', gc: 'Ihr Perzentil (bestätigt) in {m} steigt von <b>{a}</b> auf <b>{b}</b>{g}, in allen Märkten von <b>{c}</b> auf <b>{d}</b>{h}. ',
      shp: '{p} % der erfassten Projekte in {m} veröffentlichen das heute.', shc: '{p} % der erfassten Projekte in {m} haben das heute bestätigt.',
      tpl: 'Vorlage dafür', what: 'Was veröffentlichen ({id})', oth: 'Weitere Änderungen, nach Rang', pts: 'Gewonnene Perzentilpunkte in {m} beim veröffentlichten oder bestätigten Wert.',
      hp: 'Veröffentlicht, {m}', hpa: 'Veröffentlicht, alle Märkte', hc: 'Bestätigt, {m}', hca: 'Bestätigt, alle Märkte', bar: '{i} von 6: {n}', you: 'Sie: {x}',
      th: ['Prüfpunkt', 'Veröffentlichen, {m}', 'Bestätigt, {m}', 'Veröffentlichen, alle', 'Sie'],
      upd: 'Live-Daten aktualisiert am {d}: {n} Projekte in {c} Ländern.', err: 'Live-Daten gerade nicht verfügbar. Bitte gleich neu laden.', err2: 'Die Live-Daten wurden nicht geladen.' },
    nl: { ck: [['Bouwvergunning- of licentienummer', 'Een nummer en de uitgevende instantie maken van "goedgekeurd" iets wat een koper in minuten kan controleren.', 'Publiceer uw vergunning- of licentienummer', 'Laat uw vergunning bevestigen in het officiële register'],
        ['Bescherming van aanbetalingen', 'Beschermde aanbetalingen kunnen aan kopers worden terugbetaald als een project stopt.', 'Publiceer hoe aanbetalingen van kopers zijn beschermd', 'Laat de bescherming van aanbetalingen bevestigen door de toezichthouder of de bank'],
        ['Bouwvoortgang', 'Gedateerde voortgang laat kopers de bouwplaats vóór elke betaling met de planning vergelijken.', 'Publiceer gedateerde bouwvoortgang', 'Laat de voortgang bevestigen door de toezichthouder of een onafhankelijke ingenieur'],
        ['Plattegronden en technische omschrijving', 'Plattegronden met oppervlakten en een technische omschrijving bepalen waarvoor de koper betaalt.', 'Publiceer plattegronden en een technische omschrijving', 'Laat uw plattegronden toetsen aan de goedgekeurde plannen'],
        ['Staat van dienst van de ontwikkelaar', 'Een bedrijfsnummer en opgeleverde projecten met adres laten zien wie achter het merk zit.', 'Publiceer uw bedrijfsnummer en opgeleverde projecten', 'Laat uw bedrijf en opleveringen bevestigen door een register of de pers'],
        ['Geen gegarandeerd rendement', 'Schattingen met hun aannames, in plaats van garanties, houden u weg van een bewering die toezichthouders beperken.', 'Verwijder teksten over gegarandeerd rendement', 'Laat een onafhankelijke bron bevestigen dat u geen rendement garandeert']],
      pub: 'Gepubliceerd', conf: 'Bevestigd', no: 'Nee', ym: 'uw markt', inm: 'in {m}', inall: 'in alle markten', pct: '<b>{p}e</b> percentiel {l}',
      sm1: 'Slechts 1 project gevolgd in {m}: een ruw signaal.', smn: 'Slechts {n} projecten gevolgd in {m}: een ruw signaal.',
      best: 'De wijziging die u het verst brengt', none: 'Niets meer toe te voegen', noneP: 'U publiceert alle zes kernpunten en elk is bevestigd door een register of een onafhankelijke bron. Houd ze actueel: voortgang en vergunningen verouderen het snelst.',
      gp: 'Uw gepubliceerde percentiel in {m} gaat van <b>{a}</b> naar <b>{b}</b>{g}, en in alle markten van <b>{c}</b> naar <b>{d}</b>{h}. ', gc: 'Uw bevestigde percentiel in {m} gaat van <b>{a}</b> naar <b>{b}</b>{g}, en in alle markten van <b>{c}</b> naar <b>{d}</b>{h}. ',
      shp: '{p}% van de gevolgde projecten in {m} publiceert dit vandaag.', shc: '{p}% van de gevolgde projecten in {m} heeft dit vandaag bevestigd.',
      tpl: 'Sjabloon hiervoor', what: 'Wat publiceren ({id})', oth: 'Andere wijzigingen, gerangschikt', pts: 'Gewonnen percentielpunten in {m} op de gepubliceerde of bevestigde score.',
      hp: 'Gepubliceerd, {m}', hpa: 'Gepubliceerd, alle markten', hc: 'Bevestigd, {m}', hca: 'Bevestigd, alle markten', bar: '{i} van 6: {n}', you: 'U: {x}',
      th: ['Controle', 'Publiceert, {m}', 'Bevestigd, {m}', 'Publiceert, alle', 'U'],
      upd: 'Live gegevens bijgewerkt op {d}: {n} projecten in {c} landen.', err: 'Live gegevens zijn nu niet beschikbaar. Vernieuw zo meteen.', err2: 'De live gegevens zijn niet geladen.' },
    ru: { ck: [['Номер разрешения на строительство или лицензии', 'Номер и выдавший орган превращают «одобрено» в то, что покупатель может проверить за несколько минут.', 'Опубликуйте номер разрешения или лицензии', 'Подтвердите разрешение в официальном реестре'],
        ['Защита платежей', 'Защищённые платежи можно вернуть покупателям, если проект остановится.', 'Опубликуйте, как защищены платежи покупателей', 'Подтвердите защиту платежей у регулятора или в банке'],
        ['Ход строительства', 'Датированный ход работ позволяет сверить стройку с графиком перед каждым платежом.', 'Публикуйте ход строительства с датами', 'Подтвердите ход работ у регулятора или независимого инженера'],
        ['Планировки и спецификация', 'Планировки с площадями и спецификация определяют, за что платит покупатель.', 'Опубликуйте планировки и спецификацию', 'Подтвердите планировки по утверждённому проекту'],
        ['История застройщика', 'Регистрационный номер компании и сданные проекты с адресами показывают, кто стоит за брендом.', 'Опубликуйте номер компании и сданные проекты', 'Подтвердите компанию и сданные проекты в реестре или прессе'],
        ['Без обещаний гарантированной доходности', 'Оценки с допущениями вместо гарантий избавляют от заявлений, которые ограничивают регуляторы.', 'Уберите обещания гарантированной доходности', 'Пусть независимый источник подтвердит, что вы не гарантируете доходность']],
      pub: 'Опубликовано', conf: 'Подтверждено', no: 'Нет', ym: 'вашем рынке', inm: 'в {m}', inall: 'на всех рынках', pct: '<b>{p}-й</b> процентиль {l}',
      sm1: 'В {m} отслеживается только 1 проект: сигнал приблизительный.', smn: 'В {m} отслеживается только {n} проектов: сигнал приблизительный.',
      best: 'Изменение, которое продвинет вас дальше всего', none: 'Добавлять больше нечего', noneP: 'Вы публикуете все шесть основных пунктов, и каждый подтверждён реестром или независимым источником. Обновляйте их: ход работ и разрешения устаревают быстрее всего.',
      gp: 'Ваш процентиль по опубликованному в {m} растёт с <b>{a}</b> до <b>{b}</b>{g}, на всех рынках с <b>{c}</b> до <b>{d}</b>{h}. ', gc: 'Ваш процентиль по подтверждённому в {m} растёт с <b>{a}</b> до <b>{b}</b>{g}, на всех рынках с <b>{c}</b> до <b>{d}</b>{h}. ',
      shp: '{p}% отслеживаемых проектов в {m} публикуют это сегодня.', shc: 'У {p}% отслеживаемых проектов в {m} это сегодня подтверждено.',
      tpl: 'Шаблон для этого', what: 'Что публиковать ({id})', oth: 'Другие изменения по рангу', pts: 'Прирост процентиля в {m} по опубликованному или подтверждённому баллу.',
      hp: 'Опубликовано, {m}', hpa: 'Опубликовано, все рынки', hc: 'Подтверждено, {m}', hca: 'Подтверждено, все рынки', bar: '{i} из 6: {n}', you: 'Вы: {x}',
      th: ['Пункт', 'Публикуют, {m}', 'Подтверждено, {m}', 'Публикуют, все', 'Вы'],
      upd: 'Данные обновлены {d}: {n} проектов в {c} странах.', err: 'Данные сейчас недоступны. Обновите страницу чуть позже.', err2: 'Данные не загрузились.' },
    zh: { ck: [['建筑许可证或执照编号', '有了编号和签发机关，“已获批准”就成了买家几分钟内就能核实的事。', '公布您的许可证或执照编号', '在官方登记册上确认您的许可证'],
        ['定金保护', '受保护的定金在项目停工时可退还给买家。', '公布买家定金如何受到保护', '由监管机构或银行确认您的定金保护'],
        ['施工进度', '注明日期的进度让买家在每次付款前对照工地和进度表。', '公布注明日期的施工进度', '由监管机构或独立工程师确认进度'],
        ['图纸和规格说明', '带面积的图纸和规格说明界定了买家所购之物。', '公布图纸和规格说明', '对照获批图纸确认您的图纸'],
        ['开发商过往业绩', '公司注册号和附地址的已交付项目表明品牌背后是谁。', '公布公司注册号和已交付项目', '由登记机构或媒体确认您的公司和交付记录'],
        ['无保证回报表述', '用附带假设的估算代替保证，可避免监管机构限制的宣传。', '删除保证回报的表述', '由独立来源确认您不作回报保证']],
      pub: '已公布', conf: '已确认', no: '否', ym: '您的市场', inm: '{m}', inall: '全部市场', pct: '{l}第 <b>{p}</b> 百分位',
      sm1: '{m}仅追踪 1 个项目：仅供粗略参考。', smn: '{m}仅追踪 {n} 个项目：仅供粗略参考。',
      best: '提升最大的一项改动', none: '已无可补充', noneP: '您公布了全部六项核心内容，且每项均经登记册或独立来源确认。请保持更新：进度和许可证最容易过时。',
      gp: '您在{m}的公布百分位从 <b>{a}</b> 升至 <b>{b}</b>{g}，在全部市场从 <b>{c}</b> 升至 <b>{d}</b>{h}。', gc: '您在{m}的确认百分位从 <b>{a}</b> 升至 <b>{b}</b>{g}，在全部市场从 <b>{c}</b> 升至 <b>{d}</b>{h}。',
      shp: '{m}目前有 {p}% 的追踪项目公布了此项。', shc: '{m}目前有 {p}% 的追踪项目已确认此项。',
      tpl: '此项模板', what: '应公布的内容（{id}）', oth: '其他改动（按排名）', pts: '在{m}的公布分或确认分上提升的百分位点数。',
      hp: '已公布，{m}', hpa: '已公布，全部市场', hc: '已确认，{m}', hca: '已确认，全部市场', bar: '{i}/6：{n}', you: '您：{x}',
      th: ['检查项', '公布比例，{m}', '确认比例，{m}', '公布比例，全部', '您'],
      upd: '实时数据更新于 {d}：{c} 个国家的 {n} 个项目。', err: '实时数据暂时不可用，请稍后刷新。', err2: '实时数据未能加载。' },
    ar: { ck: [['رقم رخصة البناء أو الترخيص', 'الرقم والجهة المُصدِرة يحوّلان عبارة "معتمد" إلى شيء يتحقق منه المشتري في دقائق.', 'انشر رقم رخصتك أو ترخيصك', 'اجعل رخصتك مؤكدة في السجل الرسمي'],
        ['حماية الدفعات', 'يمكن إعادة الدفعات المحمية إلى المشترين إذا توقف المشروع.', 'انشر كيف تُحمى دفعات المشترين', 'اجعل حماية الدفعات مؤكدة من الجهة التنظيمية أو البنك'],
        ['تقدم البناء', 'التقدم المؤرخ يتيح للمشترين مقارنة الموقع بالجدول الزمني قبل كل دفعة.', 'انشر تقدم البناء مؤرخًا', 'اجعل التقدم مؤكدًا من الجهة التنظيمية أو مهندس مستقل'],
        ['المخططات والمواصفات', 'المخططات بالمساحات والمواصفات تحدد ما يدفع المشتري ثمنه.', 'انشر المخططات والمواصفات', 'اجعل مخططاتك مؤكدة مقابل المخططات المعتمدة'],
        ['سجل المطور', 'رقم الشركة والمشاريع المسلَّمة بعناوينها تُظهر من يقف وراء العلامة.', 'انشر رقم شركتك ومشاريعك المسلَّمة', 'اجعل شركتك وتسليماتك مؤكدة من سجل أو من الصحافة'],
        ['لا وعود بعوائد مضمونة', 'التقديرات مع افتراضاتها، بدلًا من الضمانات، تبعدك عن ادعاء تقيّده الجهات التنظيمية.', 'احذف عبارات العوائد المضمونة', 'اجعل مصدرًا مستقلًا يؤكد أنك لا تضمن عوائد']],
      pub: 'منشور', conf: 'مؤكد', no: 'لا', ym: 'سوقك', inm: 'في {m}', inall: 'في جميع الأسواق', pct: 'المئين <b>{p}</b> {l}',
      sm1: 'مشروع واحد فقط متابَع في {m}: إشارة تقريبية.', smn: '{n} مشاريع فقط متابَعة في {m}: إشارة تقريبية.',
      best: 'التغيير الذي يقدّمك أكثر', none: 'لم يبقَ ما يُضاف', noneP: 'تنشر البنود الأساسية الستة وكل منها مؤكد من سجل أو مصدر مستقل. حافظ على تحديثها: التقدم والرخص أسرع ما يتقادم.',
      gp: 'ينتقل مئينك المنشور في {m} من <b>{a}</b> إلى <b>{b}</b>{g}، وفي جميع الأسواق من <b>{c}</b> إلى <b>{d}</b>{h}. ', gc: 'ينتقل مئينك المؤكد في {m} من <b>{a}</b> إلى <b>{b}</b>{g}، وفي جميع الأسواق من <b>{c}</b> إلى <b>{d}</b>{h}. ',
      shp: '{p}% من المشاريع المتابَعة في {m} تنشر هذا اليوم.', shc: '{p}% من المشاريع المتابَعة في {m} لديها هذا مؤكدًا اليوم.',
      tpl: 'نموذج لهذا', what: 'ما يجب نشره ({id})', oth: 'تغييرات أخرى، مرتبة', pts: 'نقاط المئين المكتسبة في {m} في الدرجة المنشورة أو المؤكدة.',
      hp: 'منشور، {m}', hpa: 'منشور، جميع الأسواق', hc: 'مؤكد، {m}', hca: 'مؤكد، جميع الأسواق', bar: '{i} من 6: {n}', you: 'أنت: {x}',
      th: ['البند', 'ينشر، {m}', 'مؤكد، {m}', 'ينشر، الكل', 'أنت'],
      upd: 'حُدّثت البيانات الحية في {d}: {n} مشروعًا في {c} دولة.', err: 'البيانات الحية غير متاحة الآن. يُرجى التحديث بعد لحظة.', err2: 'لم تُحمَّل البيانات الحية.' }
  };
  var S = TX[LG] || EN;
  function f(t, o){ return String(t).replace(/\{(\w+)\}/g, function(z, k){ return o && o[k] != null ? o[k] : z; }); }
  function nf(n){ try { return Number(n).toLocaleString(LOC); } catch (e) { return String(n); } }
  var CK = [['permit', 'd1'], ['escrow', 'd2'], ['progress', 'd3'], ['plans', 'd4'], ['record', 'd5'], ['returns_ok', 'd6']].map(function(k, i){ var t = S.ck[i]; return [k[0], t[0], k[1], t[1], t[2], t[3]]; });
  var C = [], st = { m: '', pub: {}, conf: {} };
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(ch){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }
  function ok(c, k){ var x = c.checks || {}; return k === 'permit' ? x.permit === 2 : k === 'escrow' ? x.escrow === true : k === 'progress' ? x.progress != null : !!x[k]; }
  function cf(c, k){ var v = (c.verified || {})[k]; return v === 'registry' || v === 'independent'; }
  function sc(c){ return c.score || 0; }
  function vs(c){ return c.vscore || 0; }
  function pctile(list, f, x){ if (!list.length) return null; var b = 0, e = 0; list.forEach(function(c){ var y = f(c); if (y < x) b++; else if (y === x) e++; }); return { p: Math.round((b + e / 2) / list.length * 100), below: b, eq: e, n: list.length }; }
  function pc(n, d){ return d ? Math.round(n / d * 100) : 0; }
  function ord(n){ if (LG !== 'en') return n; var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  function mine(){ var s = 0, v = 0; CK.forEach(function(k){ if (st.pub[k[0]]) s++; if (st.conf[k[0]]) v++; }); return { s: s, v: v }; }
  function mkt(){ return C.filter(function(c){ return c.market === st.m; }); }

  function rows(){
    $('bkRows').innerHTML = CK.map(function(k){
      return '<div class="bk-row"><p class="bk-nm"><a href="/standard/#' + k[2] + '">' + k[2].toUpperCase() + '</a> ' + esc(k[1]) + '</p><div class="tq-chips">' +
        '<label class="tq-chip"><input type="checkbox" data-k="' + k[0] + '" data-t="pub"><span>' + esc(S.pub) + '<span class="sr-only">: ' + esc(k[1]) + '</span></span></label>' +
        '<label class="tq-chip"><input type="checkbox" data-k="' + k[0] + '" data-t="conf"><span>' + esc(S.conf) + '<span class="sr-only">: ' + esc(k[1]) + '</span></span></label></div></div>';
    }).join('');
  }
  function hist(list, f0, x, title){
    var d = [0, 0, 0, 0, 0, 0, 0]; list.forEach(function(c){ d[Math.min(6, f0(c))]++; }); var mx = Math.max.apply(null, d) || 1;
    return '<figure class="bk-h"><figcaption>' + esc(title) + ' <span class="tq-small">(' + nf(list.length) + ')</span></figcaption><div class="bk-bars" role="img" aria-label="' + esc(title + ': ' + d.map(function(n, i){ return f(S.bar, { i: i, n: n }); }).join(', ') + '. ' + f(S.you, { x: x })) + '">' +
      d.map(function(n, i){ return '<div class="' + (i === x ? 'is-you' : '') + '"><b>' + nf(n) + '</b><i style="height:' + Math.max(2, n / mx * 100) + '%"></i><span>' + i + '</span></div>'; }).join('') + '</div></figure>';
  }
  function candidates(M, me){
    var out = [], base = { sm: pctile(M, sc, me.s), sa: pctile(C, sc, me.s), vm: pctile(M, vs, me.v), va: pctile(C, vs, me.v) };
    CK.forEach(function(k){
      var share = M.length ? M.filter(function(c){ return ok(c, k[0]); }).length / M.length : 0;
      if (!st.pub[k[0]]) { var a = pctile(M, sc, me.s + 1), b = pctile(C, sc, me.s + 1); out.push({ k: k, kind: 'pub', what: k[4], metric: 'published', fm: base.sm, tm: a, fa: base.sa, ta: b, g: (a ? a.p - base.sm.p : 0), ga: b.p - base.sa.p, share: share }); }
      if (st.pub[k[0]] && !st.conf[k[0]]) { var cs = M.length ? M.filter(function(x){ return cf(x, k[0]); }).length / M.length : 0; var c = pctile(M, vs, me.v + 1), d = pctile(C, vs, me.v + 1); out.push({ k: k, kind: 'conf', what: k[5], metric: 'confirmed', fm: base.vm, tm: c, fa: base.va, ta: d, g: (c ? c.p - base.vm.p : 0), ga: d.p - base.va.p, share: cs }); }
    });
    out.sort(function(x, y){ return (y.g - x.g) || (y.ga - x.ga) || (x.share - y.share); });
    return out;
  }
  function render(){
    if (!C.length) return;
    var M = mkt(), me = mine(), name = st.m || S.ym;
    $('bkS').textContent = me.s; $('bkV').textContent = me.v;
    function line(list, f0, x, label){ var r = pctile(list, f0, x); if (!r) return ''; return '<span>' + f(S.pct, { p: ord(r.p), l: esc(label) }) + '</span>'; }
    var small = M.length && M.length < 5 ? '<span class="tq-small">' + esc(f(M.length === 1 ? S.sm1 : S.smn, { n: M.length, m: name })) + '</span>' : '';
    var inm = f(S.inm, { m: name });
    $('bkSp').innerHTML = line(M, sc, me.s, inm) + line(C, sc, me.s, S.inall) + small;
    $('bkVp').innerHTML = line(M, vs, me.v, inm) + line(C, vs, me.v, S.inall);
    var cand = candidates(M, me), b = cand[0], h = '<h2>' + esc(S.best) + '</h2>';
    if (!b) h += '<p class="bk-what">' + esc(S.none) + '</p><p>' + esc(S.noneP) + '</p>';
    else {
      h += '<p class="bk-what">' + esc(b.what) + '</p><p>' + f(b.metric === 'published' ? S.gp : S.gc, { m: esc(name), a: b.fm.p, b: b.tm.p, g: b.g > 0 ? ' (+' + b.g + ')' : '', c: b.fa.p, d: b.ta.p, h: b.ga > 0 ? ' (+' + b.ga + ')' : '' }) +
        esc(f(b.kind === 'conf' ? S.shc : S.shp, { p: pc(Math.round(b.share * M.length), M.length), m: name })) + '</p><p class="tq-small" style="margin-top:8px">' + esc(b.k[3]) + '</p>' +
        '<p class="tq-acts"><a class="btn btn-hi btn-sm" href="/developers/templates/">' + esc(S.tpl) + '</a><a class="btn btn-line btn-sm" href="/standard/#' + b.k[2] + '">' + esc(f(S.what, { id: b.k[2].toUpperCase() })) + '</a></p>';
      if (cand.length > 1) h += '<h3 class="bk-oh">' + esc(S.oth) + '</h3><ol class="bk-ol">' + cand.slice(1, 6).map(function(c){ return '<li><span>' + esc(c.what) + '</span><b>' + (c.g > 0 ? '+' + c.g : '0') + '</b></li>'; }).join('') + '</ol><p class="tq-small">' + esc(f(S.pts, { m: name })) + '</p>';
    }
    $('bkBest').innerHTML = h;
    $('bkDist').innerHTML = '<div class="bk-hs">' + hist(M, sc, me.s, f(S.hp, { m: name })) + hist(C, sc, me.s, S.hpa) + hist(M, vs, me.v, f(S.hc, { m: name })) + hist(C, vs, me.v, S.hca) + '</div>';
    $('bkShare').innerHTML = '<div class="tq-tw"><table class="tq-t"><thead><tr>' + S.th.map(function(t){ return '<th scope="col">' + esc(f(t, { m: name })) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      CK.map(function(k){ var p = M.filter(function(c){ return ok(c, k[0]); }).length, v = M.filter(function(c){ return cf(c, k[0]); }).length, a = C.filter(function(c){ return ok(c, k[0]); }).length;
        var you = st.conf[k[0]] ? S.conf : st.pub[k[0]] ? S.pub : S.no;
        return '<tr><td><a href="/standard/#' + k[2] + '">' + esc(k[1]) + '</a></td><td>' + pc(p, M.length) + '%</td><td>' + pc(v, M.length) + '%</td><td>' + pc(a, C.length) + '%</td><td>' + esc(you) + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  rows();
  $('bkForm').addEventListener('change', function(e){
    var t = e.target;
    if (t.id === 'bkMarket') st.m = t.value;
    else if (t.getAttribute('data-k')) st[t.getAttribute('data-t')][t.getAttribute('data-k')] = t.checked;
    render();
  });
  $('bkReset').addEventListener('click', function(){ st.pub = {}; st.conf = {}; Array.prototype.forEach.call(document.querySelectorAll('#bkRows input'), function(i){ i.checked = false; }); render(); });
  function ld(s){ var dd = new Date(s + 'T00:00:00Z'); if (isNaN(dd)) return s; if (LG === 'en') return dd.getUTCDate() + ' ' + dd.toLocaleString('en', { month: 'long', timeZone: 'UTC' }) + ' ' + dd.getUTCFullYear(); try { return new Intl.DateTimeFormat(LOC, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(dd); } catch (e) { return s; } }
  fetch('/data/bali-cases.json?t=' + Math.floor(Date.now() / 6e5)).then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); }).then(function(d){
    C = d.cases || [];
    try { var MM = {}; C.forEach(function(c){ var m = c.market || ''; if (/sumba/i.test(m + ' ' + (c.region || ''))) return; (MM[m] = MM[m] || []).push(c); });
      var md = function(v){ v.sort(function(a, b){ return a - b; }); var n = v.length, h = n >> 1; return n % 2 ? v[h] : (v[h - 1] + v[h]) / 2; };
      $('bkMed').innerHTML = Object.keys(MM).sort(function(a, b){ return MM[b].length - MM[a].length || (a < b ? -1 : 1); }).slice(0, 10).map(function(m){ var L = MM[m]; return '<tr><td>' + esc(m) + '</td><td>' + L.length.toLocaleString(LG === 'en' ? 'en' : LOC) + '</td><td>' + md(L.map(sc)) + '</td><td>' + md(L.map(vs)) + '</td><td>' + pc(L.filter(function(c){ return cf(c, 'permit'); }).length, L.length) + '%</td></tr>'; }).join('');
      if (d.updated) $('bkMedD').textContent = ld(d.updated); } catch (e) {}   // n40 R01-07: the medians table, refreshed from the live file
    var G = {}; C.forEach(function(c){ var g = G[c.country] = G[c.country] || {}; g[c.market] = (g[c.market] || 0) + 1; });
    var top = null, tn = 0, h = '';
    Object.keys(G).sort(function(a, b){ return a.localeCompare(b); }).forEach(function(k){ h += '<optgroup label="' + esc(k) + '">' + Object.keys(G[k]).sort(function(a, b){ return a.localeCompare(b); }).map(function(m){ if (G[k][m] > tn) { tn = G[k][m]; top = m; } return '<option value="' + esc(m) + '">' + esc(m) + ' (' + G[k][m] + ')</option>'; }).join('') + '</optgroup>'; });
    var sel = $('bkMarket'); sel.innerHTML = h; sel.disabled = false; sel.value = st.m = top;
    $('bkUpd').textContent = LG === 'en' ? 'Live data updated ' + (d.updated || '') + ': ' + C.length.toLocaleString('en') + ' projects in ' + Object.keys(G).length + ' countries.' : f(S.upd, { d: d.updated ? ld(d.updated) : '', n: nf(C.length), c: Object.keys(G).length });
    render();
  }).catch(function(){ $('bkUpd').textContent = S.err; $('bkBest').innerHTML = '<h2>' + esc(S.best) + '</h2><p class="tq-err">' + esc(S.err2) + '</p>'; });
})();
