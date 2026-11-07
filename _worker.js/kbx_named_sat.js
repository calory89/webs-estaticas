// kolaboro.com named project pages: construction progress from space (batch 14, f14b). No model calls.
// Data: /data/construction-progress.json, built monthly on main by .github/workflows/kolaboro-progress.yml
// (tools/kolaboro-landwatch/progress.py): per project with a plot-level pin in our records, a monthly Sentinel-2 L2A series
// (change index, built-up or bare share, surroundings) and one sprite of monthly true-colour thumbnails (/k/sat/proj/<id>.jpg,
// served from the satellite packs by kbsat.js). Shown with the developer's promised dates (/data/promises.json and the
// record's facts) on the same timeline. Server-rendered SVG, no client script. Projects without a series get no section.
const ORIGIN = 'https://kolaboro.com';
let MEMO = null;
export async function satData(env) {
  if (MEMO && Date.now() - MEMO.t < 600000) return MEMO.v;
  let r = null;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/construction-progress.json')); } catch (e) { r = null; }
  if (!r || !r.ok) { try { r = await fetch(ORIGIN + '/data/construction-progress.json', { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
  const v = r && r.ok ? await r.json().catch(() => null) : null;
  MEMO = { t: Date.now(), v }; return v;
}

const S = {
  en: { mk: { handover: 'Handover', construction_start: 'Start', structure: 'Topping out', milestone: 'Milestone', permit: 'Permit', rental: 'Rental start' }, h: 'Construction progress from space', toc: 'From space', intro: 'Monthly Sentinel-2 satellite images of a 150 m circle around this project\'s location in our records, with the developer\'s dates on the same timeline.',
    clear: '{c} of {n} months had a clear view (at least 90% of the circle without cloud).', xl: 'Change index for the last 3 clear months ({a} to {b}): {x} points.',
    vis: 'The site changed more than its surroundings since {base}.', novis: 'No change at the site beyond normal variation since {base}.', bl: 'Built-up or bare ground in the circle: {b1}% in the first clear months, {b2}% in the last. In the surroundings: {r1}% and {r2}%.',
    few: 'Too few clear months for a series: {c} of {n} months had a clear view. Clouds hide this site too often.', none: 'No usable Sentinel-2 scene was found for this location.',
    strip: 'Monthly images, true colour, 640 m across. The white circle is the area measured. Newest on the right.', cloudy: 'No clear view', chart: 'Change index and the developer\'s dates',
    lx: 'Change index: built-up or bare share of the circle minus that of the surroundings, in points, against the first 3 clear months', lb: 'Normal month-to-month variation (15 points either way)', lm: 'Developer\'s promised date (shaded: a quarter or a year)', lo: 'Earlier promised date',
    lim: 'Pixels are 10 m. They show cleared ground, slabs, roofs and cranes, not floors or interiors. A tower on a plot that was already concrete changes little, and a finished building should look unchanged. Season, low winter sun, haze and wet ground also move the index. Use it to ask the developer for dated site photos, not as proof.',
    tbl: 'Monthly values', th: ["Month", "Scene date", "Clear", "Built-up or bare, circle", "Surroundings", "Change index"], method: 'method and data', later: 'after the end of the chart', upd: 'updated {d}', aria: 'Chart of the monthly change index from {a} to {b}, with the developer\'s dates.' },
  es: { mk: { handover: 'Entrega', construction_start: 'Inicio', structure: 'Estructura', milestone: 'Hito', permit: 'Licencia', rental: 'Alquiler' }, h: 'Avance de obra visto desde el espacio', toc: 'Desde el espacio', intro: 'Imágenes mensuales del satélite Sentinel-2 de un círculo de 150 m alrededor de la ubicación de este proyecto en nuestros registros, con las fechas del promotor en la misma línea de tiempo.',
    clear: '{c} de {n} meses tuvieron vista despejada (al menos el 90% del círculo sin nubes).', xl: 'Índice de cambio de los 3 últimos meses despejados ({a} a {b}): {x} puntos.',
    vis: 'La parcela cambió más que su entorno desde {base}.', novis: 'Sin cambio en la parcela más allá de la variación normal desde {base}.', bl: 'Suelo edificado o desnudo en el círculo: {b1}% en los primeros meses despejados, {b2}% en los últimos. En el entorno: {r1}% y {r2}%.',
    few: 'Muy pocos meses despejados para una serie: {c} de {n} meses tuvieron vista despejada. Las nubes tapan este lugar con demasiada frecuencia.', none: 'No se encontró ninguna escena Sentinel-2 utilizable para esta ubicación.',
    strip: 'Imágenes mensuales, color real, 640 m de lado. El círculo blanco es la zona medida. La más reciente, a la derecha.', cloudy: 'Sin vista despejada', chart: 'Índice de cambio y fechas del promotor',
    lx: 'Índice de cambio: parte edificada o desnuda del círculo menos la del entorno, en puntos, frente a los 3 primeros meses despejados', lb: 'Variación normal de un mes a otro (15 puntos en cada sentido)', lm: 'Fecha prometida por el promotor (sombreado: un trimestre o un año)', lo: 'Fecha prometida anterior',
    lim: 'Los píxeles son de 10 m. Muestran terreno desbrozado, forjados, cubiertas y grúas, no plantas ni interiores. Una torre en una parcela que ya era de hormigón cambia poco, y un edificio terminado debería verse igual. La estación, el sol bajo de invierno, la bruma y el suelo húmedo también mueven el índice. Úselo para pedir al promotor fotos fechadas de la obra, no como prueba.',
    tbl: 'Valores mensuales', th: ["Mes", "Fecha de la escena", "Despejado", "Edificado o desnudo, círculo", "Entorno", "Índice de cambio"], method: 'método y datos', later: 'después del final del gráfico', upd: 'actualizado {d}', aria: 'Gráfico del índice de cambio mensual de {a} a {b}, con las fechas del promotor.' },
  de: { mk: { handover: 'Übergabe', construction_start: 'Baubeginn', structure: 'Rohbau', milestone: 'Meilenstein', permit: 'Genehmigung', rental: 'Vermietung' }, h: 'Baufortschritt aus dem All', toc: 'Aus dem All', intro: 'Monatliche Sentinel-2-Satellitenbilder eines Kreises von 150 m um den Standort dieses Projekts in unseren Daten, mit den Terminen des Bauträgers auf derselben Zeitachse.',
    clear: 'In {c} von {n} Monaten war die Sicht frei (mindestens 90% des Kreises ohne Wolken).', xl: 'Änderungsindex der letzten 3 klaren Monate ({a} bis {b}): {x} Punkte.',
    vis: 'Das Grundstück hat sich seit {base} stärker verändert als seine Umgebung.', novis: 'Seit {base} keine Veränderung am Grundstück über die normale Schwankung hinaus.', bl: 'Bebaute oder offene Fläche im Kreis: {b1}% in den ersten klaren Monaten, {b2}% in den letzten. In der Umgebung: {r1}% und {r2}%.',
    few: 'Zu wenige klare Monate für eine Reihe: in {c} von {n} Monaten war die Sicht frei. Wolken verdecken diesen Ort zu oft.', none: 'Für diesen Standort wurde keine verwendbare Sentinel-2-Aufnahme gefunden.',
    strip: 'Monatsbilder in Echtfarben, 640 m breit. Der weiße Kreis ist die gemessene Fläche. Das neueste rechts.', cloudy: 'Keine freie Sicht', chart: 'Änderungsindex und Termine des Bauträgers',
    lx: 'Änderungsindex: bebauter oder offener Anteil des Kreises minus der der Umgebung, in Punkten, gegenüber den ersten 3 klaren Monaten', lb: 'Normale Schwankung von Monat zu Monat (15 Punkte in jede Richtung)', lm: 'Vom Bauträger versprochener Termin (schattiert: ein Quartal oder ein Jahr)', lo: 'Früher versprochener Termin',
    lim: 'Die Pixel sind 10 m groß. Sie zeigen geräumte Flächen, Decken, Dächer und Kräne, keine Geschosse oder Innenräume. Ein Turm auf einem bereits betonierten Grundstück verändert wenig, und ein fertiges Gebäude sollte unverändert aussehen. Jahreszeit, tiefe Wintersonne, Dunst und nasser Boden bewegen den Index ebenfalls. Nutzen Sie ihn, um beim Bauträger datierte Baustellenfotos anzufragen, nicht als Beweis.',
    tbl: 'Monatswerte', th: ["Monat", "Aufnahmedatum", "Klar", "Bebaut oder offen, Kreis", "Umgebung", "Änderungsindex"], method: 'Methode und Daten', later: 'nach dem Ende des Diagramms', upd: 'aktualisiert {d}', aria: 'Diagramm des monatlichen Änderungsindex von {a} bis {b}, mit den Terminen des Bauträgers.' },
  fr: { mk: { handover: 'Livraison', construction_start: 'Début', structure: 'Gros œuvre', milestone: 'Étape', permit: 'Permis', rental: 'Location' }, h: 'Avancement du chantier vu de l\'espace', toc: 'Vu de l\'espace', intro: 'Images mensuelles du satellite Sentinel-2 d\'un cercle de 150 m autour de l\'emplacement de ce projet dans nos données, avec les dates du promoteur sur la même frise.',
    clear: '{c} mois sur {n} ont offert une vue dégagée (au moins 90 % du cercle sans nuages).', xl: 'Indice de changement des 3 derniers mois dégagés ({a} à {b}) : {x} points.',
    vis: 'La parcelle a changé davantage que ses alentours depuis {base}.', novis: 'Aucun changement sur la parcelle au-delà de la variation normale depuis {base}.', bl: 'Sol bâti ou nu dans le cercle : {b1} % les premiers mois dégagés, {b2} % les derniers. Aux alentours : {r1} % et {r2} %.',
    few: 'Trop peu de mois dégagés pour une série : {c} mois sur {n} ont offert une vue dégagée. Les nuages cachent ce site trop souvent.', none: 'Aucune scène Sentinel-2 exploitable n\'a été trouvée pour cet emplacement.',
    strip: 'Images mensuelles en couleurs réelles, 640 m de côté. Le cercle blanc est la zone mesurée. La plus récente à droite.', cloudy: 'Pas de vue dégagée', chart: 'Indice de changement et dates du promoteur',
    lx: 'Indice de changement : part bâtie ou nue du cercle moins celle des alentours, en points, par rapport aux 3 premiers mois dégagés', lb: 'Variation normale d’un mois à l’autre (15 points dans chaque sens)', lm: 'Date promise par le promoteur (zone grisée : un trimestre ou une année)', lo: 'Date promise antérieure',
    lim: 'Les pixels font 10 m. Ils montrent le terrain dégagé, les dalles, les toits et les grues, pas les étages ni l\'intérieur. Une tour sur une parcelle déjà bétonnée change peu, et un bâtiment terminé devrait sembler inchangé. La saison, le soleil bas d\'hiver, la brume et le sol humide font aussi varier l\'indice. Servez-vous-en pour demander au promoteur des photos datées du chantier, pas comme preuve.',
    tbl: 'Valeurs mensuelles', th: ["Mois", "Date de la scène", "Dégagé", "Bâti ou nu, cercle", "Alentours", "Indice de changement"], method: 'méthode et données', later: 'après la fin du graphique', upd: 'mis à jour le {d}', aria: 'Graphique de l\'indice de changement mensuel de {a} à {b}, avec les dates du promoteur.' },
  nl: { mk: { handover: 'Oplevering', construction_start: 'Start', structure: 'Ruwbouw', milestone: 'Mijlpaal', permit: 'Vergunning', rental: 'Verhuur' }, h: 'Bouwvoortgang vanuit de ruimte', toc: 'Vanuit de ruimte', intro: 'Maandelijkse Sentinel-2-satellietbeelden van een cirkel van 150 m rond de locatie van dit project in onze gegevens, met de data van de ontwikkelaar op dezelfde tijdlijn.',
    clear: 'In {c} van de {n} maanden was het zicht vrij (minstens 90% van de cirkel zonder wolken).', xl: 'Veranderingsindex van de laatste 3 heldere maanden ({a} tot {b}): {x} punten.',
    vis: 'Het perceel is sinds {base} meer veranderd dan zijn omgeving.', novis: 'Sinds {base} geen verandering op het perceel buiten de normale schommeling.', bl: 'Bebouwde of kale grond in de cirkel: {b1}% in de eerste heldere maanden, {b2}% in de laatste. In de omgeving: {r1}% en {r2}%.',
    few: 'Te weinig heldere maanden voor een reeks: in {c} van de {n} maanden was het zicht vrij. Wolken bedekken deze plek te vaak.', none: 'Voor deze locatie is geen bruikbare Sentinel-2-opname gevonden.',
    strip: 'Maandbeelden in ware kleuren, 640 m breed. De witte cirkel is het gemeten gebied. Het nieuwste rechts.', cloudy: 'Geen vrij zicht', chart: 'Veranderingsindex en data van de ontwikkelaar',
    lx: 'Veranderingsindex: bebouwd of kaal deel van de cirkel min dat van de omgeving, in punten, ten opzichte van de eerste 3 heldere maanden', lb: 'Normale schommeling van maand tot maand (15 punten naar beide kanten)', lm: 'Door de ontwikkelaar beloofde datum (gearceerd: een kwartaal of een jaar)', lo: 'Eerder beloofde datum',
    lim: 'De pixels zijn 10 m. Ze tonen vrijgemaakte grond, vloeren, daken en kranen, geen verdiepingen of interieurs. Een toren op een kavel die al beton was verandert weinig, en een afgerond gebouw hoort er onveranderd uit te zien. Seizoen, lage winterzon, nevel en natte grond bewegen de index ook. Gebruik hem om de ontwikkelaar om gedateerde bouwfoto\'s te vragen, niet als bewijs.',
    tbl: 'Maandwaarden', th: ["Maand", "Opnamedatum", "Helder", "Bebouwd of kaal, cirkel", "Omgeving", "Veranderingsindex"], method: 'methode en gegevens', later: 'na het einde van de grafiek', upd: 'bijgewerkt {d}', aria: 'Grafiek van de maandelijkse veranderingsindex van {a} tot {b}, met de data van de ontwikkelaar.' },
  ru: { mk: { handover: 'Сдача', construction_start: 'Начало', structure: 'Каркас', milestone: 'Этап', permit: 'Разрешение', rental: 'Аренда' }, h: 'Ход стройки из космоса', toc: 'Из космоса', intro: 'Ежемесячные снимки спутника Sentinel-2 круга радиусом 150 м вокруг местоположения проекта в наших данных, со сроками застройщика на той же шкале времени.',
    clear: 'В {c} из {n} месяцев обзор был ясным (не менее 90% круга без облаков).', xl: 'Индекс изменений за последние 3 ясных месяца ({a} – {b}): {x} п.',
    vis: 'С {base} участок изменился сильнее, чем окрестности.', novis: 'С {base} на участке нет изменений сверх обычных колебаний.', bl: 'Застроенная или открытая земля в круге: {b1}% в первые ясные месяцы, {b2}% в последние. Вокруг: {r1}% и {r2}%.',
    few: 'Слишком мало ясных месяцев для ряда: в {c} из {n} месяцев обзор был ясным. Облака слишком часто закрывают участок.', none: 'Для этого места не найдено пригодных снимков Sentinel-2.',
    strip: 'Ежемесячные снимки в естественных цветах, 640 м в поперечнике. Белый круг: измеряемая зона. Самый новый справа.', cloudy: 'Нет ясного обзора', chart: 'Индекс изменений и сроки застройщика',
    lx: 'Индекс изменений: доля застроенной или открытой земли в круге минус та же доля вокруг, в пунктах, относительно первых 3 ясных месяцев', lb: 'Обычные колебания от месяца к месяцу (15 пунктов в обе стороны)', lm: 'Срок, обещанный застройщиком (заливка: квартал или год)', lo: 'Ранее обещанный срок',
    lim: 'Пиксели имеют размер 10 м. Видны расчищенная земля, плиты, крыши и краны, но не этажи и не интерьеры. Башня на участке, который уже был забетонирован, меняет картину мало, а готовое здание должно выглядеть неизменным. Сезон, низкое зимнее солнце, дымка и влажная почва тоже влияют на индекс. Используйте его, чтобы запросить у застройщика датированные фото стройки, а не как доказательство.',
    tbl: 'Значения по месяцам', th: ["Месяц", "Дата снимка", "Ясно", "Застроено или открыто, круг", "Окрестности", "Индекс изменений"], method: 'метод и данные', later: 'после конца графика', upd: 'обновлено {d}', aria: 'График ежемесячного индекса изменений с {a} по {b} со сроками застройщика.' },
  zh: { mk: { handover: '交付', construction_start: '开工', structure: '封顶', milestone: '节点', permit: '许可', rental: '出租' }, h: '从太空看施工进度', toc: '太空视角', intro: '我们记录中该项目位置周围 150 米圆圈的 Sentinel-2 卫星月度影像，开发商承诺的日期标在同一时间轴上。',
    clear: '{n} 个月中有 {c} 个月视野晴朗（圆圈内至少 90% 无云）。', xl: '最近 3 个晴朗月份（{a} 至 {b}）的变化指数：{x} 个百分点。',
    vis: '自 {base} 以来，该地块的变化大于周边。', novis: '自 {base} 以来，该地块没有超出正常波动的变化。', bl: '圆圈内已建或裸露地面：最初几个晴朗月份为 {b1}%，最近为 {b2}%。周边地区：{r1}% 和 {r2}%。',
    few: '晴朗月份太少，无法形成序列：{n} 个月中只有 {c} 个月视野晴朗。云层太常遮挡此地。', none: '未找到此位置可用的 Sentinel-2 影像。',
    strip: '月度真彩色影像，宽 640 米。白色圆圈为测量范围。最新的在右侧。', cloudy: '无晴朗视野', chart: '变化指数与开发商日期',
    lx: '变化指数：圆圈内已建或裸露比例减去周边的比例，以百分点计，相对于最初 3 个晴朗月份', lb: '正常的逐月波动（上下 15 个百分点）', lm: '开发商承诺的日期（阴影：一个季度或一年）', lo: '较早承诺的日期',
    lim: '像素为 10 米。可以看到清理过的土地、楼板、屋顶和塔吊，看不到楼层或室内。原本已是混凝土的地块上建塔楼变化很小，已完工的建筑应看起来没有变化。季节、冬季低角度阳光、雾霾和潮湿地面也会影响指数。请用它向开发商索取注明日期的工地照片，而不是作为证据。',
    tbl: '月度数值', th: ["月份", "影像日期", "晴朗", "圆圈内已建或裸露", "周边", "变化指数"], method: '方法与数据', later: '在图表结束之后', upd: '更新于 {d}', aria: '{a} 至 {b} 的月度变化指数图，含开发商日期。' },
  ar: { mk: { handover: 'التسليم', construction_start: 'البدء', structure: 'الهيكل', milestone: 'مرحلة', permit: 'الترخيص', rental: 'التأجير' }, h: 'تقدّم البناء من الفضاء', toc: 'من الفضاء', intro: 'صور شهرية من القمر الصناعي Sentinel-2 لدائرة نصف قطرها 150 م حول موقع هذا المشروع في سجلاتنا، مع مواعيد المطوّر على المخطط الزمني نفسه.',
    clear: 'كانت الرؤية صافية في {c} من {n} شهرًا (90% على الأقل من الدائرة بلا غيوم).', xl: 'مؤشر التغيّر لآخر 3 أشهر صافية ({a} إلى {b}): {x} نقطة.',
    vis: 'تغيّرت القطعة أكثر من محيطها منذ {base}.', novis: 'لا تغيّر في القطعة يتجاوز التذبذب المعتاد منذ {base}.', bl: 'الأرض المبنية أو المكشوفة في الدائرة: {b1}% في أول الأشهر الصافية، و{b2}% في آخرها. في المحيط: {r1}% و{r2}%.',
    few: 'الأشهر الصافية قليلة جدًا لتكوين سلسلة: كانت الرؤية صافية في {c} من {n} شهرًا. الغيوم تحجب هذا الموقع كثيرًا.', none: 'لم يُعثر على صورة Sentinel-2 صالحة لهذا الموقع.',
    strip: 'صور شهرية بالألوان الطبيعية بعرض 640 م. الدائرة البيضاء هي المنطقة المقيسة. الأحدث على اليمين.', cloudy: 'لا رؤية صافية', chart: 'مؤشر التغيّر ومواعيد المطوّر',
    lx: 'مؤشر التغيّر: نسبة الأرض المبنية أو المكشوفة في الدائرة ناقص نسبتها في المحيط، بالنقاط، مقارنة بأول 3 أشهر صافية', lb: 'التذبذب المعتاد من شهر لآخر (15 نقطة في كل اتجاه)', lm: 'موعد وعد به المطوّر (المظلل: ربع سنة أو سنة)', lo: 'موعد موعود سابقًا',
    lim: 'حجم البكسل 10 م. تظهر الأرض الممهدة والبلاطات والأسطح والرافعات، لا الطوابق ولا الداخل. البرج على قطعة كانت خرسانية أصلًا لا يغيّر الكثير، والمبنى المكتمل يجب أن يبدو دون تغيير. الفصل وشمس الشتاء المنخفضة والضباب والأرض الرطبة تحرّك المؤشر أيضًا. استخدمه لتطلب من المطوّر صورًا مؤرخة للموقع، لا كدليل.',
    tbl: 'القيم الشهرية', th: ["الشهر", "تاريخ الصورة", "صافٍ", "مبني أو مكشوف، الدائرة", "المحيط", "مؤشر التغيّر"], method: 'المنهجية والبيانات', later: 'بعد نهاية المخطط', upd: 'حُدّث في {d}', aria: 'مخطط مؤشر التغيّر الشهري من {a} إلى {b} مع مواعيد المطوّر.' } };
const t = (lang, k, v) => { const s = (S[lang] && S[lang][k]) || S.en[k]; return v && typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
export const satToc = lang => t(lang, 'toc');
export const satHeading = lang => t(lang, 'h');

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mi = s => { const m = String(s).match(/^(\d{4})-(\d{2})/); return m ? +m[1] * 12 + (+m[2] - 1) : null; };
const ym = i => Math.floor(i / 12) + '-' + String(i % 12 + 1).padStart(2, '0');
const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
// a promised date or period as [first month index, last month index]
function span(d) {
  const s = String(d || '').trim(); let m;
  if ((m = s.match(/^(\d{4})-Q([1-4])$/i))) { const a = +m[1] * 12 + (+m[2] - 1) * 3; return [a, a + 2]; }
  if ((m = s.match(/^(\d{4})-H([12])$/i))) { const a = +m[1] * 12 + (+m[2] - 1) * 6; return [a, a + 5]; }
  if ((m = s.match(/^(\d{4})-(\d{2})/))) { const a = +m[1] * 12 + (+m[2] - 1); return [a, a]; }
  if ((m = s.match(/^(\d{4})$/))) return [+m[1] * 12, +m[1] * 12 + 11];
  if ((m = s.match(/^(?:\d{1,2} )?([A-Za-z]{3})[a-z]* (\d{4})$/)) && MON[m[1].toLowerCase()]) { const a = +m[2] * 12 + MON[m[1].toLowerCase()] - 1; return [a, a]; }
  return null;
}

// milestones: promise tracker first (with earlier dates of moved promises), then the record's facts for kinds it lacks
export function milestones(prom, fx) {
  const out = [], seen = new Set();
  const add = (k, d, old) => { const sp = span(d); if (!sp) return; const key = k + '|' + sp[0] + '|' + sp[1]; if (seen.has(key)) return; seen.add(key); out.push({ k, d: String(d), a: sp[0], b: sp[1], old: !!old }); };
  for (const p of prom || []) { add(p.k, p.d, false); for (const h of p.hist || []) if (h.d && h.d !== p.d) add(p.k, h.d, true); }
  const has = k => out.some(o => o.k === k && !o.old);
  if (!has('construction_start') && fx.construction_start) add('construction_start', fx.construction_start, false);
  if (!has('handover') && fx.handover_promised) add('handover', fx.handover_promised, false);
  if (fx.original_handover && fx.original_handover !== fx.handover_promised) add('handover', fx.original_handover, true);
  return out;
}

const CSS = '<style id="ksat-css">.ksat{--ksat-t:76px}.ksat .ksat-sum{margin:0 0 4px;padding:0;list-style:none}.ksat .ksat-sum li{border-top:1px solid var(--k-line,var(--line));padding:10px 0;line-height:1.5}' +
  '.ksat figure{margin:18px 0 0;border:1px solid var(--k-line,var(--line));border-radius:var(--k-r-lg,14px);background:var(--k-surface,var(--card,#fff));padding:14px 14px 10px}.ksat figcaption{font-size:var(--k-fs-xs,.82rem);color:var(--k-muted,var(--muted));margin:8px 0 0;line-height:1.45}' +
  '.ksat-strip{display:flex;flex-direction:row-reverse;gap:6px;overflow-x:auto;margin:0;padding:0 0 8px;list-style:none;scroll-snap-type:x proximity;overscroll-behavior-x:contain}.ksat-strip li{flex:0 0 var(--ksat-t);scroll-snap-align:end;margin:0}' +
  '.ksat-tile{display:block;width:var(--ksat-t);height:var(--ksat-t);border-radius:var(--k-r-xs,4px);background-color:var(--k-sunken,#E8ECEA);background-repeat:no-repeat}.ksat-tile.is-none{background-image:repeating-linear-gradient(135deg,transparent 0 6px,color-mix(in srgb,var(--k-muted,#56636F) 18%,transparent) 6px 7px)}' +
  '.ksat-strip small{display:block;font-size:.72rem;line-height:1.25;color:var(--k-muted,var(--muted));margin-top:4px;font-variant-numeric:tabular-nums}.ksat-strip .is-none+small{color:var(--k-faint,var(--muted))}' +
  '.ksat-n{display:none}@media(max-width:560px){.ksat-w{display:none}.ksat-n{display:block}}.ksat-chart svg{display:block;width:100%;height:auto;overflow:visible}.ksat-chart .ax{stroke:var(--k-line,#D5DAD8);stroke-width:1}.ksat-chart .gl{stroke:var(--k-line,#D5DAD8);stroke-width:1;stroke-dasharray:2 4}.ksat-chart text{fill:var(--k-muted,#56636F);font-size:11px;font-variant-numeric:tabular-nums}' +
  '.ksat-chart .lx{fill:none;stroke:var(--k-sea,#155C75);stroke-width:2.2;stroke-linejoin:round}.ksat-chart .px{fill:var(--k-sea,#155C75)}.ksat-chart .band{fill:color-mix(in srgb,var(--k-sea,#155C75) 8%,transparent)}' +
  '.ksat-chart .ms{fill:color-mix(in srgb,var(--k-ink,#13222E) 9%,transparent)}.ksat-chart .ml{stroke:var(--k-ink,#13222E);stroke-width:1.5}.ksat-chart .mo{stroke:var(--k-muted,#56636F);stroke-width:1;stroke-dasharray:3 3}.ksat-chart .mt{fill:var(--k-ink,#13222E);font-size:11px;font-weight:600}.ksat-chart .mto{fill:var(--k-muted,#56636F);font-weight:500}' +
  '.ksat-lg{display:flex;flex-wrap:wrap;gap:6px 18px;margin:8px 0 0;padding:0;list-style:none;font-size:var(--k-fs-xs,.82rem);color:var(--k-ink-2,var(--ink))}.ksat-lg li{display:flex;align-items:flex-start;gap:8px;line-height:1.4}.ksat-lg i{display:inline-block;flex:0 0 20px;margin-top:.6em;width:20px;height:0;border-top:2.2px solid var(--k-sea,#155C75)}.ksat-lg i.b{height:12px;margin-top:.15em;border:0;background:color-mix(in srgb,var(--k-sea,#155C75) 14%,transparent)}.ksat-lg i.m{height:12px;width:12px;flex-basis:12px;margin-top:.15em;border:0;border-inline-start:1.5px solid var(--k-ink,#13222E);background:color-mix(in srgb,var(--k-ink,#13222E) 9%,transparent)}.ksat-lg i.o{width:0;flex-basis:12px;margin-top:.15em;height:12px;border:0;border-inline-start:1px dashed var(--k-muted,#56636F)}' +
  '.ksat-lim{margin:14px 0 0;font-size:var(--k-fs-sm,.92rem);color:var(--k-ink-2,var(--ink));line-height:1.55;max-width:72ch}.ksat-src{margin:8px 0 0;font-size:var(--k-fs-xs,.82rem);color:var(--k-muted,var(--muted))}.ksat details{margin:12px 0 0}.ksat details summary{cursor:pointer;min-height:44px;display:flex;align-items:center;font-weight:600}' +
  '@media(max-width:640px){.ksat{--ksat-t:64px}.ksat figure{padding:10px 10px 8px}}</style>';

// change index per month: (built-up or bare share of the circle minus that of the ring) minus the median of that difference over the first
// 3 clear months, in points. Season and haze move circle and ring together, so the difference is far steadier than either share alone
// (on our 125 series the single-month deviation in the first months has a median of 4 points and a 90th percentile of 15).
export const BAND = 15;
export function index(rec) {
  const d = rec.b.map((v, i) => v != null && rec.r[i] != null ? v - rec.r[i] : null), ok = d.map((v, i) => v == null ? -1 : i).filter(i => i >= 0);
  if (ok.length < 6) return null;
  const med = a => { const v = a.slice().sort((x, y) => x - y), h = v.length >> 1; return v.length % 2 ? v[h] : (v[h - 1] + v[h]) / 2; };
  const base = med(ok.slice(0, 3).map(i => d[i])), y = d.map(v => v == null ? null : Math.round(v - base));
  const last = ok.slice(-3);
  return { y, first: [ok[0], ok[2]], last: [last[0], last[2]], now: Math.round(med(last.map(i => d[i])) - base) };
}

function chart(rec, ix, ms, lang, fd, trk, W) {
  const m0 = mi(rec.m0), n = rec.n, last = m0 + n - 1;
  const future = ms.filter(o => !o.old).map(o => o.b);
  const end = Math.max(last + 1, Math.min(Math.max(last, ...future) + 2, last + 72));
  const lim = Math.max(30, Math.min(100, Math.ceil(Math.max(...ix.y.filter(v => v != null).map(Math.abs)) / 10) * 10 + 10));
  const narrow = W < 500, H = narrow ? 260 : 240, L = 34, R = 8, T = 34, B = 26, iw = W - L - R, ih = H - T - B;
  const X = i => L + (i - m0) / (end - m0) * iw, Y = v => T + ih / 2 - v / lim * ih / 2;
  let g = '<rect class="band" x="' + L + '" y="' + Y(BAND) + '" width="' + iw + '" height="' + (Y(-BAND) - Y(BAND)) + '"/>';
  for (const v of [-lim, -lim / 2, 0, lim / 2, lim]) g += '<line class="' + (v ? 'gl' : 'ax') + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/><text x="' + (L - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + (v > 0 ? '+' : '') + v + '</text>';
  const y0 = Math.floor(m0 / 12), y1 = Math.floor(end / 12), step = y1 - y0 > (narrow ? 4 : 6) ? 2 : 1;
  for (let y = y0 + 1; y <= y1; y += step) { const x = X(y * 12); if (x > L && x < W - R) g += '<line class="gl" x1="' + x + '" x2="' + x + '" y1="' + T + '" y2="' + (T + ih) + '"/><text x="' + x + '" y="' + (H - 8) + '" text-anchor="middle">' + y + '</text>'; }
  // milestones (behind the line); labels alternate between two rows when close
  const vis = ms.filter(o => o.b >= m0 && o.a <= end).sort((a, b) => a.a - b.a);
  const rows = [[], []], cw = 6.3;   // label extents per row; a label that fits neither row is left out (the shaded band keeps its tooltip)
  for (const o of vis) {
    const xa = X(Math.max(o.a, m0)), xb = X(Math.min(o.b + 1, end));
    if (o.b > o.a && !o.old) g += '<rect class="ms" x="' + xa.toFixed(1) + '" y="' + T + '" width="' + Math.max(2, xb - xa).toFixed(1) + '" height="' + ih + '"><title>' + esc(trk(o.k) + ': ' + fd(o.d)) + '</title></rect>';
    g += '<line class="' + (o.old ? 'mo' : 'ml') + '" x1="' + xa.toFixed(1) + '" x2="' + xa.toFixed(1) + '" y1="' + (T - 4) + '" y2="' + (T + ih) + '"><title>' + esc(trk(o.k) + ': ' + fd(o.d)) + '</title></line>';
    if (o.old) continue;
    const txt = ((t(lang, 'mk') || {})[o.k] || trk(o.k)) + ' ' + fd(o.d), tw = txt.length * cw;
    const anchor = xa + 4 + tw > W - R ? 'end' : 'start', x0 = anchor === 'end' ? xa - 4 - tw : xa + 4, x1 = x0 + tw;
    const r = rows.findIndex(rw => rw.every(([a, b]) => x1 + 6 < a || x0 > b + 6));
    if (r < 0) continue;
    rows[r].push([x0, x1]);
    g += '<text class="mt" x="' + (anchor === 'end' ? xa - 4 : xa + 4).toFixed(1) + '" y="' + (T - 8 - r * 13) + '" text-anchor="' + anchor + '">' + esc(txt) + '</text>';
  }
  // the line joins clear months across cloudy ones (each dot is a real month; cloudy months show in the strip and the table)
  const pts = []; for (let i = 0; i < n; i++) if (ix.y[i] != null) pts.push([X(m0 + i + 0.5), Y(ix.y[i]), i]);
  g += '<path class="lx" d="M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + '"/>';
  for (const [x, y, i] of pts) g += '<circle class="px" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.6"><title>' + esc(fd(ym(m0 + i)) + ': ' + (ix.y[i] > 0 ? '+' : '') + ix.y[i]) + '</title></circle>';
  const after = ms.filter(o => o.a > end && !o.old);
  return { svg: '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t(lang, 'aria', { a: fd(rec.m0), b: fd(ym(last)) })) + '">' + g + '</svg>', after };
}

// rec: one project from construction-progress.json; meta: the whole file. trk(kind) = translated milestone kind, fd(date) = display date.
export function satSection(meta, id, prom, fx, lang, fd, trk, tl) {   // tl(date): the tile's accessible name with the project name (s15a)
  const rec = meta && meta.projects && meta.projects[id];
  if (!rec || !rec.n || !rec.m0) return '';
  const m0 = mi(rec.m0), n = rec.n, months = Array.from({ length: n }, (_, i) => ym(m0 + i));
  const clearN = rec.c.filter(v => v != null).length;
  const srcLine = '<p class="ksat-src">' + esc(meta.source.attribution) + '. <a class="src" href="' + esc(meta.source.url) + '" rel="noopener" target="_blank">Copernicus Sentinel-2 L2A, AWS Open Data</a> <a class="src" href="/data/construction-progress.json">' + esc(t(lang, 'method')) + ', ' + esc(t(lang, 'upd', { d: fd(meta.updated) })) + '</a></p>';
  let sum = '<ul class="ksat-sum"><li>' + esc(t(lang, 'clear', { c: clearN, n })) + '</li>';
  const ix = index(rec);
  if (ix) {
    const sg = v => (v > 0 ? '+' : '') + v;
    sum += '<li><b>' + esc(t(lang, Math.abs(ix.now) >= BAND ? 'vis' : 'novis', { base: fd(months[ix.first[0]]) })) + ' </b>' + esc(t(lang, 'xl', { a: fd(months[ix.last[0]]), b: fd(months[ix.last[1]]), x: sg(ix.now) })) + '</li>';
    if (rec.sum && rec.sum.b_first != null && rec.sum.b_last != null) sum += '<li>' + esc(t(lang, 'bl', { b1: Math.round(rec.sum.b_first), b2: Math.round(rec.sum.b_last), r1: rec.sum.r_first == null ? '-' : Math.round(rec.sum.r_first), r2: rec.sum.r_last == null ? '-' : Math.round(rec.sum.r_last) })) + '</li>';
  } else sum += '<li>' + esc(t(lang, clearN ? 'few' : 'none', { c: clearN, n })) + '</li>';
  sum += '</ul>';
  // strip: every month, newest first in the DOM; row-reverse shows them oldest-to-newest and starts scrolled to the newest
  let strip = '';
  if (rec.frames && rec.v) {
    const img = '/k/sat/proj/' + encodeURIComponent(id) + '.jpg?v=' + encodeURIComponent(rec.v);
    const li = [];
    for (let i = n - 1; i >= 0; i--) {
      const f = rec.f[i], lab = esc(fd(months[i]));
      li.push(f >= 0 ? '<li><span class="ksat-tile" role="img" aria-label="' + esc(tl ? tl(fd(rec.dt[i] || months[i])) : 'Sentinel-2, ' + fd(rec.dt[i] || months[i])) + '" style="background-image:url(' + img + ');background-size:calc(var(--ksat-t) * ' + rec.frames + ') var(--ksat-t);background-position:calc(var(--ksat-t) * -' + f + ') 0"></span><small>' + lab + '</small></li>'
        : '<li><span class="ksat-tile is-none" role="img" aria-label="' + lab + ': ' + esc(t(lang, 'cloudy')) + '"></span><small>' + lab + '</small></li>');
    }
    strip = '<figure dir="ltr"><ol class="ksat-strip">' + li.join('') + '</ol><figcaption>' + esc(t(lang, 'strip')) + '</figcaption></figure>';
  }
  let ch = '';
  if (ix) {
    const ms = milestones(prom, fx || {}), c = chart(rec, ix, ms, lang, fd, trk, 720), cn = chart(rec, ix, ms, lang, fd, trk, 360);
    const hasOld = ms.some(o => o.old);
    ch = '<figure class="ksat-chart"><div dir="ltr" class="ksat-w">' + c.svg + '</div><div dir="ltr" class="ksat-n">' + cn.svg + '</div><ul class="ksat-lg"><li><i></i>' + esc(t(lang, 'lx')) + '</li><li><i class="b"></i>' + esc(t(lang, 'lb')) + '</li>' + (ms.length ? '<li><i class="m"></i>' + esc(t(lang, 'lm')) + '</li>' : '') + (hasOld ? '<li><i class="o"></i>' + esc(t(lang, 'lo')) + '</li>' : '') + '</ul>' +
      (c.after.length ? '<figcaption>' + c.after.map(o => esc(trk(o.k) + ': ' + fd(o.d) + ' (' + t(lang, 'later') + ')')).join('; ') + '</figcaption>' : '') + '</figure>';
  }
  const th = t(lang, 'th'), pc = v => v == null ? '' : v + '%', pt = v => v == null ? '' : (v > 0 ? '+' : '') + v;
  const rows = months.map((m, i) => '<tr><td>' + esc(fd(m)) + '</td><td>' + esc(rec.dt[i] ? fd(rec.dt[i]) : t(lang, 'cloudy')) + '</td><td>' + pc(rec.c[i]) + '</td><td>' + pc(rec.b[i]) + '</td><td>' + pc(rec.r[i]) + '</td><td>' + (ix ? pt(ix.y[i]) : '') + '</td></tr>').reverse().join('');
  const table = clearN ? '<details><summary>' + esc(t(lang, 'tbl')) + '</summary><div class="tw"><table><thead><tr>' + th.map(h => '<th>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div></details>' : '';
  return CSS + '<div class="ksat"><p class="ki">' + esc(t(lang, 'intro')) + '</p>' + sum + ch + strip + '<p class="ksat-lim">' + esc(t(lang, 'lim')) + '</p>' + srcLine + table + '</div>';
}
