// kolaboro.com batch 17 (n17b): radar through the clouds, mapped building footprints and a sealed site-visit record. No model calls.
// Data (built monthly on main by .github/workflows/kolaboro-space-extra.yml, tools/kolaboro-agent/space_extra.py):
//   /data/satellite-radar.json  Sentinel-1 RTC (Microsoft Planetary Computer, CC BY 4.0; contains modified Copernicus Sentinel data)
//                               for projects whose Sentinel-2 series is too cloudy: monthly VV/VH backscatter, circle vs ring
//   /data/buildings.json        Overture Maps buildings (ODbL) touching the 150 m circle of each project pin, first seen per GERS registry
// Both use exactly the projects and pins of /data/construction-progress.json. Shown inside the "from space" section of named pages
// (kbx_named_sat.js calls spaceHtml) and in /api/x/pay/series (kbx_pay.js calls radarSeries).
// Routes:
//   GET  /api/x/space/<ID>            pin, radar series and buildings of one named project (public, cacheable)
//   GET  /api/x/space/pins?q=<text>   named projects with a pin, for the site-visit tool (/tools/site-visit/)
//   POST /api/x/space/visit           a site-visit record: the browser sends photo SHA-256 hashes (never the photos), its GPS fix and
//                                     clock; we add the time we received it and the distance to the project pin, sign it as a W3C VC
//                                     (did:web:kolaboro.com, eddsa-jcs-2022) and timestamp its root hash with OpenTimestamps
//                                     (/api/kb/stamp keeps the hash only). Nothing else is stored or logged: the record goes back to the buyer.
const ORIGIN = 'https://kolaboro.com';
let MEMO = null;
async function loadOne(env, name) {
  let r = null;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); } catch (e) { r = null; }
  if (!r || !r.ok) { try { r = await fetch(ORIGIN + '/data/' + name, { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
  return r && r.ok ? await r.json().catch(() => null) : null;
}
export async function spaceData(env) {
  if (MEMO && Date.now() - MEMO.t < 600000) return MEMO.v;
  const [radar, bld] = await Promise.all([loadOne(env, 'satellite-radar.json'), loadOne(env, 'buildings.json')]);
  const v = { radar, bld, v: ((radar && radar.updated) || '') + '/' + ((bld && bld.updated) || '') };
  MEMO = { t: Date.now(), v }; return v;
}

// ------------------------------------------------------------------------------------------------ strings (8 languages)
const S = {
  en: { sv: 'Visiting the site? Record your visit against this circle', rh: 'Radar, through the clouds', ri: 'Clouds hid this site in {c} of {n} months, so we also read Sentinel-1 radar, which sees through cloud and at night. Same 150 m circle, one satellite track every month ({o} pass, relative orbit {r}).',
    rk: '{k} of {n} months have a radar reading.', rx: 'Radar change index for the last 3 months ({a} to {b}): {x} dB against {base}.', rvis: 'Beyond the normal month-to-month variation of {band} dB.', rnov: 'Within the normal month-to-month variation of {band} dB.',
    rv: 'VV backscatter in the circle: {v1} dB in the first months, {v2} dB in the last. In the ring 300 to 600 m away: {r1} and {r2} dB.', rfew: 'Too few radar months for a series: {k} of {n}.',
    rlx: 'Radar change index (VV, circle minus ring, against the first 3 months), dB', rlb: 'Normal month-to-month variation', rlm: 'Developer\'s promised date',
    rlim: 'New walls, frames, roofs and cranes usually make the radar return brighter; cleared vegetation usually makes VH darker. Radar does not show floors, finishes or quality of work, and how a building faces the satellite changes how bright it looks. Pixels are 10 m and grainy, so a single villa may not show. Use a change as a reason to ask the developer for dated site photos, not as proof.',
    rth: ['Month', 'Scene date', 'Scenes', 'VV circle, dB', 'VV ring, dB', 'Index, dB'], rtbl: 'Monthly radar values', raria: 'Chart of the monthly radar change index from {a} to {b}.', none: 'No radar reading',
    bh: 'Buildings on the map', bn: 'Buildings mapped within 150 m of the pin: {n}, covering {p}% of the circle.', b0: 'No building is mapped within 150 m of the pin in Overture release {rel}. The plot may be empty, or nobody has mapped it yet.',
    bf: 'First seen in Overture: {a} (earliest) to {b} (newest).', bfs: 'First seen in Overture: {a}.', breg: 'The Overture ID registry starts at {s}, so a building first seen then may be older.', bnew: 'First seen after {s}: {k}.',
    bsrc: 'Mapped by: {l}.', btall: 'Tallest mapped: {h}.', bfl: 'floors: {f}', bm: '{h} m', blim: 'Footprints come from volunteers (OpenStreetMap) and from machine learning on satellite imagery (Microsoft, Google, Esri). They can be years behind the ground. The pin is about 100 m accurate, so the circle can include a neighbour.',
    bth: ['Distance', 'Footprint', 'Height', 'Floors', 'Mapped by', 'First seen', 'Overture id'], btbl: 'Buildings in the circle', method: 'method and data', upd: 'updated {d}' },
  es: { sv: '¿Visitas la obra? Registra tu visita frente a este círculo', rh: 'Radar, a través de las nubes', ri: 'Las nubes taparon este lugar en {c} de {n} meses, así que también leemos el radar Sentinel-1, que ve a través de las nubes y de noche. El mismo círculo de 150 m, la misma pasada del satélite cada mes (pasada {o}, órbita relativa {r}).',
    rk: '{k} de {n} meses tienen lectura de radar.', rx: 'Índice de cambio del radar de los 3 últimos meses ({a} a {b}): {x} dB frente a {base}.', rvis: 'Por encima de la variación normal de un mes a otro, {band} dB.', rnov: 'Dentro de la variación normal de un mes a otro, {band} dB.',
    rv: 'Retrodispersión VV en el círculo: {v1} dB en los primeros meses, {v2} dB en los últimos. En el anillo a 300-600 m: {r1} y {r2} dB.', rfew: 'Muy pocos meses de radar para una serie: {k} de {n}.',
    rlx: 'Índice de cambio del radar (VV, círculo menos anillo, frente a los 3 primeros meses), dB', rlb: 'Variación normal de un mes a otro', rlm: 'Fecha prometida por el promotor',
    rlim: 'Muros, estructuras, cubiertas y grúas nuevas suelen hacer más brillante el eco del radar; la vegetación desbrozada suele oscurecer VH. El radar no muestra plantas, acabados ni calidad de obra, y la orientación de un edificio respecto al satélite cambia su brillo. Los píxeles son de 10 m y granulados, así que una sola villa puede no verse. Use un cambio como motivo para pedir al promotor fotos fechadas de la obra, no como prueba.',
    rth: ['Mes', 'Fecha de la escena', 'Escenas', 'VV círculo, dB', 'VV anillo, dB', 'Índice, dB'], rtbl: 'Valores mensuales del radar', raria: 'Gráfico del índice de cambio mensual del radar de {a} a {b}.', none: 'Sin lectura de radar',
    bh: 'Edificios en el mapa', bn: 'Edificios cartografiados a menos de 150 m del punto: {n}, que cubren el {p}% del círculo.', b0: 'No hay ningún edificio cartografiado a menos de 150 m del punto en la versión {rel} de Overture. La parcela puede estar vacía o nadie la ha cartografiado aún.',
    bf: 'Vistos por primera vez en Overture: de {a} (el más antiguo) a {b} (el más reciente).', bfs: 'Visto por primera vez en Overture: {a}.', breg: 'El registro de identificadores de Overture empieza en {s}, así que un edificio visto por primera vez entonces puede ser anterior.', bnew: 'Vistos por primera vez después de {s}: {k}.',
    bsrc: 'Cartografiado por: {l}.', btall: 'El más alto cartografiado: {h}.', bfl: 'plantas: {f}', bm: '{h} m', blim: 'Las huellas vienen de voluntarios (OpenStreetMap) y de aprendizaje automático sobre imágenes de satélite (Microsoft, Google, Esri). Pueden ir años por detrás del terreno. El punto tiene unos 100 m de precisión, así que el círculo puede incluir a un vecino.',
    bth: ['Distancia', 'Huella', 'Altura', 'Plantas', 'Cartografiado por', 'Visto por primera vez', 'Id de Overture'], btbl: 'Edificios en el círculo', method: 'método y datos', upd: 'actualizado {d}' },
  fr: { sv: 'Vous visitez le site ? Enregistrez votre visite face à ce cercle', rh: 'Le radar, à travers les nuages', ri: 'Les nuages ont caché ce site pendant {c} mois sur {n} : nous lisons donc aussi le radar Sentinel-1, qui voit à travers les nuages et de nuit. Même cercle de 150 m, même passage du satellite chaque mois (passage {o}, orbite relative {r}).',
    rk: '{k} mois sur {n} ont une mesure radar.', rx: 'Indice de changement radar des 3 derniers mois ({a} à {b}) : {x} dB par rapport à {base}.', rvis: 'Au-delà de la variation normale d\'un mois à l\'autre, {band} dB.', rnov: 'Dans la variation normale d\'un mois à l\'autre, {band} dB.',
    rv: 'Rétrodiffusion VV dans le cercle : {v1} dB les premiers mois, {v2} dB les derniers. Dans l\'anneau à 300-600 m : {r1} et {r2} dB.', rfew: 'Trop peu de mois radar pour une série : {k} sur {n}.',
    rlx: 'Indice de changement radar (VV, cercle moins anneau, par rapport aux 3 premiers mois), dB', rlb: 'Variation normale d\'un mois à l\'autre', rlm: 'Date promise par le promoteur',
    rlim: 'De nouveaux murs, ossatures, toits et grues rendent en général l\'écho radar plus brillant ; une végétation défrichée assombrit en général VH. Le radar ne montre ni les étages, ni les finitions, ni la qualité des travaux, et l\'orientation d\'un bâtiment par rapport au satellite change sa brillance. Les pixels font 10 m et sont granuleux : une villa seule peut ne pas apparaître. Un changement est une raison de demander au promoteur des photos datées du chantier, pas une preuve.',
    rth: ['Mois', 'Date de la scène', 'Scènes', 'VV cercle, dB', 'VV anneau, dB', 'Indice, dB'], rtbl: 'Valeurs radar mensuelles', raria: 'Graphique de l\'indice de changement radar mensuel de {a} à {b}.', none: 'Pas de mesure radar',
    bh: 'Les bâtiments sur la carte', bn: 'Bâtiments cartographiés à moins de 150 m du point : {n}, couvrant {p} % du cercle.', b0: 'Aucun bâtiment n\'est cartographié à moins de 150 m du point dans la version {rel} d\'Overture. La parcelle est peut-être vide, ou personne ne l\'a encore cartographiée.',
    bf: 'Vus pour la première fois dans Overture : de {a} (le plus ancien) à {b} (le plus récent).', bfs: 'Vu pour la première fois dans Overture : {a}.', breg: 'Le registre des identifiants Overture commence à {s} : un bâtiment vu pour la première fois alors peut être plus ancien.', bnew: 'Vus pour la première fois après {s} : {k}.',
    bsrc: 'Cartographié par : {l}.', btall: 'Le plus haut cartographié : {h}.', bfl: 'étages : {f}', bm: '{h} m', blim: 'Les emprises viennent de bénévoles (OpenStreetMap) et d\'apprentissage automatique sur images satellite (Microsoft, Google, Esri). Elles peuvent avoir des années de retard sur le terrain. Le point est précis à environ 100 m : le cercle peut inclure un voisin.',
    bth: ['Distance', 'Emprise', 'Hauteur', 'Étages', 'Cartographié par', 'Vu pour la première fois', 'Id Overture'], btbl: 'Bâtiments dans le cercle', method: 'méthode et données', upd: 'mis à jour le {d}' },
  de: { sv: 'Sie besuchen die Baustelle? Halten Sie Ihren Besuch an diesem Kreis fest', rh: 'Radar, durch die Wolken', ri: 'Wolken verdeckten diesen Ort in {c} von {n} Monaten. Deshalb lesen wir auch das Sentinel-1-Radar, das durch Wolken und nachts sieht. Derselbe Kreis von 150 m, jeden Monat dieselbe Satellitenbahn ({o} Überflug, relative Bahn {r}).',
    rk: 'Für {k} von {n} Monaten gibt es einen Radarwert.', rx: 'Radar-Änderungsindex der letzten 3 Monate ({a} bis {b}): {x} dB gegenüber {base}.', rvis: 'Über der normalen Schwankung von Monat zu Monat von {band} dB.', rnov: 'Innerhalb der normalen Schwankung von Monat zu Monat von {band} dB.',
    rv: 'VV-Rückstreuung im Kreis: {v1} dB in den ersten Monaten, {v2} dB in den letzten. Im Ring 300 bis 600 m entfernt: {r1} und {r2} dB.', rfew: 'Zu wenige Radarmonate für eine Reihe: {k} von {n}.',
    rlx: 'Radar-Änderungsindex (VV, Kreis minus Ring, gegenüber den ersten 3 Monaten), dB', rlb: 'Normale Schwankung von Monat zu Monat', rlm: 'Vom Bauträger versprochener Termin',
    rlim: 'Neue Wände, Tragwerke, Dächer und Kräne machen das Radarecho meist heller; gerodete Vegetation macht VH meist dunkler. Radar zeigt keine Geschosse, keinen Ausbau und keine Bauqualität, und die Ausrichtung eines Gebäudes zum Satelliten ändert seine Helligkeit. Die Pixel sind 10 m groß und körnig, eine einzelne Villa ist daher vielleicht nicht zu sehen. Nutzen Sie eine Änderung, um beim Bauträger datierte Baustellenfotos anzufragen, nicht als Beweis.',
    rth: ['Monat', 'Aufnahmedatum', 'Aufnahmen', 'VV Kreis, dB', 'VV Ring, dB', 'Index, dB'], rtbl: 'Monatliche Radarwerte', raria: 'Diagramm des monatlichen Radar-Änderungsindex von {a} bis {b}.', none: 'Kein Radarwert',
    bh: 'Gebäude auf der Karte', bn: 'Kartierte Gebäude im Umkreis von 150 m um den Punkt: {n}, sie bedecken {p}% des Kreises.', b0: 'In der Overture-Version {rel} ist im Umkreis von 150 m um den Punkt kein Gebäude kartiert. Das Grundstück ist vielleicht leer, oder niemand hat es bisher kartiert.',
    bf: 'Zuerst in Overture gesehen: {a} (das älteste) bis {b} (das neueste).', bfs: 'Zuerst in Overture gesehen: {a}.', breg: 'Das Overture-ID-Register beginnt mit {s}; ein damals zuerst gesehenes Gebäude kann älter sein.', bnew: 'Zuerst nach {s} gesehen: {k}.',
    bsrc: 'Kartiert von: {l}.', btall: 'Höchstes kartiertes Gebäude: {h}.', bfl: 'Geschosse: {f}', bm: '{h} m', blim: 'Grundrisse stammen von Freiwilligen (OpenStreetMap) und aus maschinellem Lernen auf Satellitenbildern (Microsoft, Google, Esri). Sie können der Wirklichkeit Jahre hinterherhinken. Der Punkt ist etwa 100 m genau, der Kreis kann also ein Nachbargrundstück einschließen.',
    bth: ['Entfernung', 'Grundfläche', 'Höhe', 'Geschosse', 'Kartiert von', 'Zuerst gesehen', 'Overture-ID'], btbl: 'Gebäude im Kreis', method: 'Methode und Daten', upd: 'aktualisiert {d}' },
  nl: { sv: 'Bezoek je de bouwplaats? Leg je bezoek vast tegenover deze cirkel', rh: 'Radar, door de wolken heen', ri: 'Wolken verborgen deze plek in {c} van de {n} maanden, dus lezen we ook de Sentinel-1-radar, die door wolken en \'s nachts kijkt. Dezelfde cirkel van 150 m, elke maand dezelfde satellietbaan ({o} passage, relatieve baan {r}).',
    rk: '{k} van de {n} maanden hebben een radarmeting.', rx: 'Radarveranderingsindex van de laatste 3 maanden ({a} tot {b}): {x} dB ten opzichte van {base}.', rvis: 'Meer dan de normale schommeling van maand tot maand van {band} dB.', rnov: 'Binnen de normale schommeling van maand tot maand van {band} dB.',
    rv: 'VV-terugverstrooiing in de cirkel: {v1} dB in de eerste maanden, {v2} dB in de laatste. In de ring op 300 tot 600 m: {r1} en {r2} dB.', rfew: 'Te weinig radarmaanden voor een reeks: {k} van {n}.',
    rlx: 'Radarveranderingsindex (VV, cirkel min ring, ten opzichte van de eerste 3 maanden), dB', rlb: 'Normale schommeling van maand tot maand', rlm: 'Door de ontwikkelaar beloofde datum',
    rlim: 'Nieuwe muren, constructies, daken en kranen maken de radarecho meestal helderder; gekapte begroeiing maakt VH meestal donkerder. Radar toont geen verdiepingen, afwerking of bouwkwaliteit, en hoe een gebouw naar de satelliet staat verandert hoe helder het lijkt. Pixels zijn 10 m en korrelig, dus één villa is soms niet te zien. Gebruik een verandering als reden om de ontwikkelaar om gedateerde bouwfoto\'s te vragen, niet als bewijs.',
    rth: ['Maand', 'Opnamedatum', 'Opnamen', 'VV cirkel, dB', 'VV ring, dB', 'Index, dB'], rtbl: 'Maandelijkse radarwaarden', raria: 'Grafiek van de maandelijkse radarveranderingsindex van {a} tot {b}.', none: 'Geen radarmeting',
    bh: 'Gebouwen op de kaart', bn: 'Gekarteerde gebouwen binnen 150 m van het punt: {n}, samen {p}% van de cirkel.', b0: 'In Overture-versie {rel} is binnen 150 m van het punt geen gebouw gekarteerd. Het perceel is misschien leeg, of niemand heeft het nog gekarteerd.',
    bf: 'Voor het eerst gezien in Overture: {a} (het oudste) tot {b} (het nieuwste).', bfs: 'Voor het eerst gezien in Overture: {a}.', breg: 'Het Overture-id-register begint bij {s}, dus een gebouw dat toen voor het eerst werd gezien, kan ouder zijn.', bnew: 'Voor het eerst gezien na {s}: {k}.',
    bsrc: 'Gekarteerd door: {l}.', btall: 'Hoogste gekarteerde gebouw: {h}.', bfl: 'verdiepingen: {f}', bm: '{h} m', blim: 'Contouren komen van vrijwilligers (OpenStreetMap) en van machine learning op satellietbeelden (Microsoft, Google, Esri). Ze kunnen jaren achterlopen op de werkelijkheid. Het punt is ongeveer 100 m nauwkeurig, dus de cirkel kan een buur omvatten.',
    bth: ['Afstand', 'Oppervlak', 'Hoogte', 'Verdiepingen', 'Gekarteerd door', 'Voor het eerst gezien', 'Overture-id'], btbl: 'Gebouwen in de cirkel', method: 'methode en gegevens', upd: 'bijgewerkt {d}' },
  ru: { sv: 'Едете на объект? Запишите визит относительно этого круга', rh: 'Радар сквозь облака', ri: 'Облака закрывали этот участок в {c} из {n} месяцев, поэтому мы также читаем радар Sentinel-1, который видит сквозь облака и ночью. Тот же круг 150 м, каждый месяц одна и та же орбита спутника ({o} пролёт, относительная орбита {r}).',
    rk: 'Радарные данные есть за {k} из {n} месяцев.', rx: 'Индекс изменений по радару за последние 3 месяца ({a}–{b}): {x} дБ относительно {base}.', rvis: 'Больше обычного колебания от месяца к месяцу ({band} дБ).', rnov: 'В пределах обычного колебания от месяца к месяцу ({band} дБ).',
    rv: 'Обратное рассеяние VV в круге: {v1} дБ в первые месяцы, {v2} дБ в последние. В кольце 300–600 м: {r1} и {r2} дБ.', rfew: 'Слишком мало месяцев с радаром для ряда: {k} из {n}.',
    rlx: 'Индекс изменений по радару (VV, круг минус кольцо, относительно первых 3 месяцев), дБ', rlb: 'Обычное колебание от месяца к месяцу', rlm: 'Срок, обещанный застройщиком',
    rlim: 'Новые стены, каркасы, крыши и краны обычно делают радарный сигнал ярче; расчищенная растительность обычно делает VH темнее. Радар не показывает этажи, отделку и качество работ, а ориентация здания к спутнику меняет его яркость. Пиксель 10 м и зернистый, поэтому отдельная вилла может быть не видна. Используйте изменение как повод запросить у застройщика датированные фото стройки, а не как доказательство.',
    rth: ['Месяц', 'Дата снимка', 'Снимков', 'VV круг, дБ', 'VV кольцо, дБ', 'Индекс, дБ'], rtbl: 'Месячные значения радара', raria: 'График месячного индекса изменений по радару с {a} по {b}.', none: 'Нет данных радара',
    bh: 'Здания на карте', bn: 'Зданий на карте в радиусе 150 м от точки: {n}, они занимают {p}% круга.', b0: 'В выпуске Overture {rel} в радиусе 150 м от точки нет ни одного здания. Участок может быть пустым, или его ещё никто не нанёс на карту.',
    bf: 'Впервые появились в Overture: с {a} (самое раннее) по {b} (самое новое).', bfs: 'Впервые появилось в Overture: {a}.', breg: 'Реестр идентификаторов Overture начинается с {s}, поэтому здание, впервые замеченное тогда, может быть старше.', bnew: 'Впервые появились после {s}: {k}.',
    bsrc: 'Нанесено на карту: {l}.', btall: 'Самое высокое на карте: {h}.', bfl: 'этажей: {f}', bm: '{h} м', blim: 'Контуры зданий наносят добровольцы (OpenStreetMap) и машинное обучение по спутниковым снимкам (Microsoft, Google, Esri). Они могут отставать от реальности на годы. Точность точки около 100 м, поэтому круг может захватить соседний участок.',
    bth: ['Расстояние', 'Площадь', 'Высота', 'Этажи', 'Источник', 'Впервые', 'Id Overture'], btbl: 'Здания в круге', method: 'метод и данные', upd: 'обновлено {d}' },
  zh: { sv: '要去现场？对照这个圆圈记录您的考察', rh: '雷达：穿透云层', ri: '在 {n} 个月中有 {c} 个月该地点被云层遮挡，因此我们同时读取 Sentinel-1 雷达，它可以穿透云层并在夜间观测。同样是 150 米的圆圈，每月使用同一条卫星轨道（{o}过境，相对轨道 {r}）。',
    rk: '{n} 个月中有 {k} 个月有雷达读数。', rx: '最近 3 个月（{a} 至 {b}）的雷达变化指数：相对 {base} 为 {x} dB。', rvis: '超过月度正常波动（{band} dB）。', rnov: '在月度正常波动（{band} dB）之内。',
    rv: '圆圈内 VV 后向散射：最初几个月 {v1} dB，最近几个月 {v2} dB。300 至 600 米环带：{r1} 和 {r2} dB。', rfew: '雷达月份太少，无法形成序列：{n} 个月中 {k} 个。',
    rlx: '雷达变化指数（VV，圆圈减环带，相对最初 3 个月），dB', rlb: '月度正常波动', rlm: '开发商承诺的日期',
    rlim: '新的墙体、框架、屋顶和塔吊通常会让雷达回波更亮；清除植被通常会让 VH 变暗。雷达看不到楼层、装修或施工质量，建筑朝向卫星的角度也会改变其亮度。像素为 10 米且有颗粒噪声，单栋别墅可能看不出来。请把变化当作向开发商索取带日期工地照片的理由，而不是证据。',
    rth: ['月份', '影像日期', '景数', 'VV 圆圈，dB', 'VV 环带，dB', '指数，dB'], rtbl: '每月雷达数值', raria: '{a} 至 {b} 每月雷达变化指数图。', none: '无雷达读数',
    bh: '地图上的建筑', bn: '定位点 150 米内已测绘的建筑：{n} 栋，覆盖圆圈的 {p}%。', b0: '在 Overture 版本 {rel} 中，定位点 150 米内没有已测绘的建筑。地块可能是空的，也可能还没有人测绘。',
    bf: '首次出现在 Overture：{a}（最早）至 {b}（最新）。', bfs: '首次出现在 Overture：{a}。', breg: 'Overture 标识注册表始于 {s}，因此当时首次出现的建筑可能更早就已存在。', bnew: '{s} 之后首次出现：{k} 栋。',
    bsrc: '测绘来源：{l}。', btall: '已测绘的最高建筑：{h}。', bfl: '{f} 层', bm: '{h} 米', blim: '建筑轮廓来自志愿者（OpenStreetMap）以及基于卫星影像的机器学习（Microsoft、Google、Esri），可能比实际情况滞后数年。定位点精度约 100 米，圆圈可能包含相邻地块。',
    bth: ['距离', '占地', '高度', '楼层', '测绘来源', '首次出现', 'Overture 标识'], btbl: '圆圈内的建筑', method: '方法与数据', upd: '更新于 {d}' },
  ar: { sv: 'تزور الموقع؟ سجّل زيارتك مقارنة بهذه الدائرة', rh: 'الرادار عبر الغيوم', ri: 'حجبت الغيوم هذا الموقع في {c} من {n} شهرًا، لذلك نقرأ أيضًا رادار Sentinel-1 الذي يرى عبر الغيوم وفي الليل. الدائرة نفسها بقطر 150 م، والمسار نفسه للقمر الصناعي كل شهر (مرور {o}، المدار النسبي {r}).',
    rk: 'تتوفر قراءة رادار في {k} من {n} شهرًا.', rx: 'مؤشر تغيّر الرادار لآخر 3 أشهر ({a} إلى {b}): {x} ديسيبل مقارنة بـ {base}.', rvis: 'أكبر من التذبذب المعتاد من شهر لآخر ({band} ديسيبل).', rnov: 'ضمن التذبذب المعتاد من شهر لآخر ({band} ديسيبل).',
    rv: 'الارتداد VV في الدائرة: {v1} ديسيبل في الأشهر الأولى و{v2} ديسيبل في الأخيرة. في الحلقة على بعد 300 إلى 600 م: {r1} و{r2} ديسيبل.', rfew: 'أشهر الرادار قليلة جدًا لتكوين سلسلة: {k} من {n}.',
    rlx: 'مؤشر تغيّر الرادار (VV، الدائرة ناقص الحلقة، مقارنة بأول 3 أشهر)، ديسيبل', rlb: 'التذبذب المعتاد من شهر لآخر', rlm: 'موعد وعد به المطوّر',
    rlim: 'الجدران والهياكل والأسطح والرافعات الجديدة تجعل صدى الرادار أسطع عادةً، وإزالة النباتات تجعل VH أغمق عادةً. لا يُظهر الرادار الطوابق ولا التشطيبات ولا جودة العمل، واتجاه المبنى نحو القمر الصناعي يغيّر سطوعه. حجم البكسل 10 م وفيه تحبّب، لذا قد لا تظهر فيلا واحدة. استخدم التغيّر سببًا لتطلب من المطوّر صورًا مؤرخة للموقع، لا كدليل.',
    rth: ['الشهر', 'تاريخ الصورة', 'الصور', 'VV الدائرة، ديسيبل', 'VV الحلقة، ديسيبل', 'المؤشر، ديسيبل'], rtbl: 'قيم الرادار الشهرية', raria: 'مخطط مؤشر تغيّر الرادار الشهري من {a} إلى {b}.', none: 'لا قراءة رادار',
    bh: 'المباني على الخريطة', bn: 'المباني المرسومة على الخريطة ضمن 150 م من النقطة: {n}، وتغطي {p}% من الدائرة.', b0: 'لا يوجد أي مبنى مرسوم ضمن 150 م من النقطة في إصدار Overture ‏{rel}. قد تكون القطعة فارغة، أو لم يرسمها أحد بعد.',
    bf: 'أول ظهور في Overture: من {a} (الأقدم) إلى {b} (الأحدث).', bfs: 'أول ظهور في Overture: {a}.', breg: 'يبدأ سجل معرّفات Overture في {s}، لذا قد يكون المبنى الذي ظهر أول مرة حينها أقدم.', bnew: 'ظهرت أول مرة بعد {s}: {k}.',
    bsrc: 'المصدر: {l}.', btall: 'أعلى مبنى مرسوم: {h}.', bfl: 'الطوابق: {f}', bm: '{h} م', blim: 'تأتي حدود المباني من متطوعين (OpenStreetMap) ومن التعلم الآلي على صور الأقمار الصناعية (Microsoft وGoogle وEsri). قد تتأخر عن الواقع سنوات. دقة النقطة نحو 100 م، لذا قد تشمل الدائرة قطعة مجاورة.',
    bth: ['المسافة', 'المساحة', 'الارتفاع', 'الطوابق', 'المصدر', 'أول ظهور', 'معرّف Overture'], btbl: 'المباني في الدائرة', method: 'المنهجية والبيانات', upd: 'حُدّث في {d}' },
};
const OD = { en: { ascending: 'ascending', descending: 'descending' }, es: { ascending: 'ascendente', descending: 'descendente' }, fr: { ascending: 'ascendant', descending: 'descendant' }, de: { ascending: 'aufsteigender', descending: 'absteigender' },
  nl: { ascending: 'opgaande', descending: 'neergaande' }, ru: { ascending: 'восходящий', descending: 'нисходящий' }, zh: { ascending: '升轨', descending: '降轨' }, ar: { ascending: 'صاعد', descending: 'هابط' } };
const t = (lang, k, v) => { const s = (S[lang] && S[lang][k]) || S.en[k]; return v && typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mi = s => { const m = String(s).match(/^(\d{4})-(\d{2})/); return m ? +m[1] * 12 + (+m[2] - 1) : null; };
const ym = i => Math.floor(i / 12) + '-' + String(i % 12 + 1).padStart(2, '0');
const sg = v => (v > 0 ? '+' : '') + v;
const relDate = r => String(r || '').replace(/\.\d+$/, '');   // Overture release 2026-10-21.0 -> 2026-10-21
const CSS = '<style id="kspace-css">.kspace{margin-top:28px;padding-top:4px;border-top:1px solid var(--k-line,var(--line))}.kspace h3{margin:18px 0 6px;font-size:var(--k-fs-lg,1.2rem)}' +
  '.kspace .tw{overflow-x:auto}.kspace table{border-collapse:collapse;font-size:var(--k-fs-xs,.82rem);min-width:100%}.kspace th,.kspace td{text-align:start;padding:6px 8px;border-bottom:1px solid var(--k-line,var(--line));white-space:nowrap;font-variant-numeric:tabular-nums}' +
  '.kspace code{font-size:.78rem;word-break:break-all;white-space:normal}.ksat-chart .rl{fill:none;stroke:var(--k-ink,#13222E);stroke-width:2;stroke-linejoin:round}.ksat-chart .rp{fill:var(--k-ink,#13222E)}.ksat-lg i.r{border-top-color:var(--k-ink,#13222E)}</style>';

function rchart(rec, band, ms, lang, fd, W) {
  const m0 = mi(rec.m0), n = rec.n, end = m0 + n;
  const ys = rec.y.filter(v => v != null);
  const lim = Math.max(3, Math.ceil(Math.max(...ys.map(Math.abs), band || 0) + 1));
  const narrow = W < 500, H = narrow ? 220 : 200, L = 34, R = 8, T = 14, B = 26, iw = W - L - R, ih = H - T - B;
  const X = i => L + (i - m0) / (end - m0) * iw, Y = v => T + ih / 2 - v / lim * ih / 2;
  let g = band ? '<rect class="band" x="' + L + '" y="' + Y(band).toFixed(1) + '" width="' + iw + '" height="' + (Y(-band) - Y(band)).toFixed(1) + '"/>' : '';
  const st = lim > 8 ? Math.ceil(lim / 4) : lim > 4 ? 2 : 1;
  for (let v = -Math.floor(lim / st) * st; v <= lim; v += st) g += '<line class="' + (v ? 'gl' : 'ax') + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text x="' + (L - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end">' + sg(v) + '</text>';
  for (let y = Math.floor(m0 / 12) + 1; y * 12 < end; y++) { const x = X(y * 12); g += '<line class="gl" x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + T + '" y2="' + (T + ih) + '"/><text x="' + x.toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + y + '</text>'; }
  for (const o of ms || []) if (!o.old && o.a >= m0 && o.a < end) g += '<line class="ml" x1="' + X(o.a).toFixed(1) + '" x2="' + X(o.a).toFixed(1) + '" y1="' + T + '" y2="' + (T + ih) + '"><title>' + esc(fd(o.d)) + '</title></line>';
  const pts = []; for (let i = 0; i < n; i++) if (rec.y[i] != null) pts.push([X(m0 + i + 0.5), Y(rec.y[i]), i]);
  if (pts.length) g += '<path class="rl" d="M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + '"/>';
  for (const [x, y, i] of pts) g += '<circle class="rp" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.4"><title>' + esc(fd(ym(m0 + i)) + ': ' + sg(rec.y[i]) + ' dB') + '</title></circle>';
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t(lang, 'raria', { a: fd(rec.m0), b: fd(ym(end - 1)) })) + '">' + g + '</svg>';
}

function radarHtml(rd, id, lang, fd, ms, opt) {
  const rec = rd && rd.projects && rd.projects[id];
  if (!rec || !rec.n || !rec.m0) return '';
  const m0 = mi(rec.m0), n = rec.n, months = Array.from({ length: n }, (_, i) => ym(m0 + i));
  const k = rec.months_ok || 0, tr = rec.track || {};
  let h = '<h3>' + esc(t(lang, 'rh')) + '</h3><p class="ki">' + esc(t(lang, 'ri', { c: opt && opt.cloudy != null ? opt.cloudy : '-', n: opt && opt.n || n, o: (OD[lang] || OD.en)[tr.orbit] || tr.orbit || '-', r: tr.relative_orbit != null ? tr.relative_orbit : '-' })) + '</p><ul class="ksat-sum"><li>' + esc(t(lang, 'rk', { k, n })) + '</li>';
  const band = rd.band_db;
  if (rec.status === 'ok' && rec.sum && rec.y) {
    const s = rec.sum, big = band != null && Math.abs(s.y_last) > band;
    h += '<li>' + (band != null ? '<b>' + esc(t(lang, big ? 'rvis' : 'rnov', { band: '±' + band })) + ' </b>' : '') + esc(t(lang, 'rx', { a: fd(s.last[0]), b: fd(s.last[1]), x: sg(s.y_last), base: fd(s.first[0]) + (s.first[1] !== s.first[0] ? ' - ' + fd(s.first[1]) : '') })) + '</li>';
    h += '<li>' + esc(t(lang, 'rv', { v1: s.vv_first, v2: s.vv_last, r1: s.rvv_first, r2: s.rvv_last })) + '</li></ul>';
    h += '<figure class="ksat-chart"><div dir="ltr" class="ksat-w">' + rchart(rec, band, ms, lang, fd, 720) + '</div><div dir="ltr" class="ksat-n">' + rchart(rec, band, ms, lang, fd, 360) + '</div><ul class="ksat-lg"><li><i class="r"></i>' + esc(t(lang, 'rlx')) + '</li>' + (band != null ? '<li><i class="b"></i>' + esc(t(lang, 'rlb')) + ' (±' + band + ' dB)</li>' : '') + ((ms || []).some(o => !o.old) ? '<li><i class="m"></i>' + esc(t(lang, 'rlm')) + '</li>' : '') + '</ul></figure>';
  } else h += '<li>' + esc(t(lang, 'rfew', { k, n })) + '</li></ul>';
  h += '<p class="ksat-lim">' + esc(t(lang, 'rlim')) + '</p>';
  h += '<p class="ksat-src">' + esc(rd.source.attribution) + '. <a class="src" href="' + esc(rd.source.url) + '" rel="noopener" target="_blank">Sentinel-1 RTC, Microsoft Planetary Computer</a> <a class="src" href="' + esc(rd.source.licence_url) + '" rel="noopener" target="_blank">CC BY 4.0</a> <a class="src" href="/data/satellite-radar.json">' + esc(t(lang, 'method')) + ', ' + esc(t(lang, 'upd', { d: fd(rd.updated) })) + '</a></p>';
  if (k) {
    const th = t(lang, 'rth'), f = v => v == null ? '' : String(v);
    const rows = months.map((m, i) => '<tr><td>' + esc(fd(m)) + '</td><td>' + esc(rec.dt[i] ? fd(rec.dt[i]) : t(lang, 'none')) + '</td><td>' + (rec.ns[i] || '') + '</td><td>' + f(rec.vv[i]) + '</td><td>' + f(rec.rvv[i]) + '</td><td>' + (rec.y && rec.y[i] != null ? sg(rec.y[i]) : '') + '</td></tr>').reverse().join('');
    h += '<details><summary>' + esc(t(lang, 'rtbl')) + '</summary><div class="tw"><table><thead><tr>' + th.map(x => '<th>' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div></details>';
  }
  return h;
}

function bldHtml(bd, id, lang, fd, num) {
  const rec = bd && bd.projects && bd.projects[id];
  if (!rec) return '';
  const rel = bd.release, rs = bd.registry_start;
  let h = '<h3>' + esc(t(lang, 'bh')) + '</h3><ul class="ksat-sum">';
  if (!rec.n) h += '<li>' + esc(t(lang, 'b0', { rel: fd(relDate(rel)) })) + '</li>';
  else {
    h += '<li><b>' + esc(t(lang, 'bn', { n: num(rec.n), p: rec.cover_pct })) + '</b></li>';
    if (rec.first_seen_min) {
      h += '<li>' + esc(rec.first_seen_min === rec.first_seen_max ? t(lang, 'bfs', { a: fd(relDate(rec.first_seen_min)) }) : t(lang, 'bf', { a: fd(relDate(rec.first_seen_min)), b: fd(relDate(rec.first_seen_max)) }));
      if (rs) { const nw = Object.entries(rec.first_seen || {}).filter(([r]) => r > rs).reduce((a, [, c]) => a + c, 0); h += ' ' + esc(t(lang, 'bnew', { s: fd(relDate(rs)), k: num(nw) })) + ' ' + esc(t(lang, 'breg', { s: fd(relDate(rs)) })); }
      h += '</li>';
    }
    const src = Object.entries(rec.by_source || {}).sort((a, b) => b[1] - a[1]).map(([d, c]) => d + ' ' + num(c)).join(', ');
    if (src) h += '<li>' + esc(t(lang, 'bsrc', { l: src })) + '</li>';
    if (rec.max_height_m || rec.max_floors) h += '<li>' + esc(t(lang, 'btall', { h: [rec.max_height_m ? t(lang, 'bm', { h: num(rec.max_height_m) }) : '', rec.max_floors ? t(lang, 'bfl', { f: rec.max_floors }) : ''].filter(Boolean).join(', ') })) + '</li>';
  }
  h += '</ul><p class="ksat-lim">' + esc(t(lang, 'blim')) + '</p>';
  h += '<p class="ksat-src">' + esc(bd.source.attribution) + '. <a class="src" href="' + esc(bd.source.url) + '" rel="noopener" target="_blank">Overture Maps buildings, ' + esc(rel) + '</a> <a class="src" href="' + esc(bd.source.licence_url) + '" rel="noopener" target="_blank">ODbL 1.0</a> <a class="src" href="' + esc(bd.source.attribution_url) + '" rel="noopener" target="_blank">Overture attribution</a> <a class="src" href="/data/buildings.json">' + esc(t(lang, 'method')) + ', ' + esc(t(lang, 'upd', { d: fd(bd.updated) })) + '</a></p>';
  if (rec.b && rec.b.length) {
    const th = t(lang, 'bth');
    const rows = rec.b.map(b => '<tr><td>' + num(b.d) + ' m</td><td>' + num(b.m2) + ' m²</td><td>' + (b.h ? num(b.h) + ' m' : '') + '</td><td>' + (b.f || '') + '</td><td>' + esc((b.src || []).join(', ')) + '</td><td>' + esc(b.fs ? fd(relDate(b.fs)) : '') + '</td><td><code title="' + esc(b.id) + '">' + esc(String(b.id).slice(0, 8)) + '</code></td></tr>').join('');
    h += '<details><summary>' + esc(t(lang, 'btbl')) + ' (' + num(rec.b.length) + (rec.n > rec.b.length ? ' / ' + num(rec.n) : '') + ')</summary><div class="tw"><table><thead><tr>' + th.map(x => '<th>' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div></details>';
  }
  return h;
}

// n20p: one formatter per locale and options for the life of the isolate (building one per call cost most of the render time)
const dtf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'd' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.DateTimeFormat(L, o)); };
const nmf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'n' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.NumberFormat(L, o)); };
// inside the "from space" section of a named page: sp = spaceData(), opt = { cloudy months, months } from the optical series
export function spaceHtml(sp, id, lang, fd, ms, opt) {
  if (!sp) return '';
  const num = v => { try { return nmf(lang === 'en' ? 'en-GB' : lang).format(v); } catch (e) { return String(v); } };
  const a = radarHtml(sp.radar, id, lang, fd, ms, opt), b = bldHtml(sp.bld, id, lang, fd, num);
  const lk = '<p class="ksat-src"><a href="/tools/site-visit/?p=' + encodeURIComponent(id) + (lang !== 'en' ? '&amp;lang=' + lang : '') + '">' + esc(t(lang, 'sv')) + '</a></p>';
  return a || b ? CSS + '<div class="kspace">' + a + b + lk + '</div>' : '';
}

// for /api/x/pay/series (kbx_pay.js)
export function radarSeries(sp, id) {
  const rd = sp && sp.radar, rec = rd && rd.projects && rd.projects[id];
  if (!rec) return null;
  return { m0: rec.m0, n: rec.n, y: rec.y || null, yh: rec.yh || null, vv: rec.vv, rvv: rec.rvv, date: rec.dt, status: rec.status, track: rec.track, band_db: rd.band_db, unit: 'dB',
    updated: rd.updated, source: { attribution: rd.source.attribution, url: rd.source.url, licence_url: rd.source.licence_url, method: '/data/satellite-radar.json' } };
}

// ------------------------------------------------------------------------------------------------ routes
export const PATHS = /^\/api\/x\/space\//;
const H = { 'content-type': 'application/json; charset=utf-8', 'x-content-type-options': 'nosniff', 'access-control-allow-origin': '*' };
const out = (o, st, cc) => new Response(JSON.stringify(o), { status: st || 200, headers: Object.assign({ 'cache-control': cc || 'no-store' }, H) });
const decs = v => { const s = String(v); const i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1; };
function pinOf(x) {
  const fx = x.fx || {};
  if (typeof fx.lat !== 'number' || typeof fx.lng !== 'number' || Math.abs(fx.lat) > 90 || Math.abs(fx.lng) > 180) return null;
  const d = Math.min(decs(fx.lat), decs(fx.lng));
  return { lat: fx.lat, lng: fx.lng, precision_m: d >= 3 ? 100 : d === 2 ? 1000 : 10000, source: 'Kolaboro project record (public sources)' };
}
const R = 6371008.8, rad = x => x * Math.PI / 180;
function dist(a, b) { const dl = rad(b.lat - a.lat), dn = rad(b.lng - a.lng); const h = Math.sin(dl / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dn / 2) ** 2; return Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(h)))); }
const fnum = (v, lo, hi) => typeof v === 'number' && isFinite(v) && v >= lo && v <= hi ? v : null;
const hex64 = v => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v) ? v : null;
const isoT = v => { if (typeof v !== 'string' || v.length > 40) return null; const d = new Date(v); return isNaN(d) ? null : d.toISOString(); };
async function sha256hex(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }

async function limited(req, ctx, name, max) {
  const ip = req.headers.get('cf-connecting-ip') || 'x', hour = new Date().toISOString().slice(0, 13);
  const k = new Request(ORIGIN + '/__ksp_rl/' + name + '/' + encodeURIComponent(ip) + '/' + hour);
  const hit = await caches.default.match(k); const n = hit ? (+(await hit.text()) || 0) : 0;
  if (n >= max) return true;
  const p = caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=3600' } }));
  if (ctx && ctx.waitUntil) ctx.waitUntil(p.catch(() => {})); else await p.catch(() => {});
  return false;
}

async function visit(req, env, ctx) {
  const o = req.headers.get('origin'); if (o && o !== ORIGIN) return out({ error: 'origin' }, 403);
  if (+(req.headers.get('content-length') || 0) > 32768) return out({ error: 'too_large' }, 413);
  let b; try { const txt = await req.text(); if (txt.length > 32768) return out({ error: 'too_large' }, 413); b = JSON.parse(txt); } catch (e) { return out({ error: 'bad_request' }, 400); }
  if (await limited(req, ctx, 'visit', 20)) return out({ error: 'rate', note: 'At most 20 sealed visit records per hour from one address.' }, 429);
  const { data } = await import('./kbx_named.js');
  const ix = await data(env).catch(() => null);
  const pid = String(b.project || '').toUpperCase();
  const x = ix && ix.byId.get(pid); if (!x) return out({ error: 'project', note: 'Pick a project from the list (named projects with a location in our records).' }, 400);
  const pin = pinOf(x); if (!pin) return out({ error: 'no_pin' }, 400);
  const pos = b.position || {};
  const lat = fnum(pos.lat, -90, 90), lng = fnum(pos.lng, -180, 180), acc = fnum(pos.accuracy_m, 0, 100000);
  const photos = (Array.isArray(b.photos) ? b.photos : []).slice(0, 40).map(p => {
    const g = p && p.exif_gps ? { lat: fnum(p.exif_gps.lat, -90, 90), lng: fnum(p.exif_gps.lng, -180, 180) } : null;
    return hex64(p && p.sha256) ? { sha256: p.sha256, bytes: fnum(p.bytes, 0, 2e9), type: typeof p.type === 'string' ? p.type.slice(0, 40) : null,
      exif_time: typeof p.exif_time === 'string' ? p.exif_time.slice(0, 25) : null, exif_gps: g && g.lat != null && g.lng != null ? g : null, captured_at: isoT(p.captured_at) } : null;
  }).filter(Boolean);
  if (!photos.length && lat == null) return out({ error: 'empty', note: 'Add at least one photo or a GPS position.' }, 400);
  const now = new Date(), at = now.toISOString().replace(/\.\d+Z$/, 'Z'), dev = isoT(b.device_time);
  const checks = { received_at: at, pin, circle_m: 150,
    device_clock_minus_server_s: dev ? Math.round((new Date(dev) - now) / 1000) : null,
    position_distance_m: lat != null && lng != null ? dist(pin, { lat, lng }) : null,
    photos: photos.map(p => ({ sha256: p.sha256, exif_gps_distance_m: p.exif_gps ? dist(pin, p.exif_gps) : null })) };
  checks.position_inside_circle = checks.position_distance_m == null ? null : checks.position_distance_m <= 150 + Math.min(acc || 0, 500);
  const subject = { type: 'SiteVisitRecord', project: { id: x.id, name: x.n || null, market: x.mk || null, page: ORIGIN + '/projects/' + x.s + '/' },
    reported_by_browser: { position: lat != null && lng != null ? { lat, lng, accuracy_m: acc } : null, device_time: dev, photos },
    checked_by_kolaboro: checks,
    note: 'Kolaboro signs what the visitor\'s browser reported and when it reached us, plus the distance to the project location in our records. Photos never left the device: only their SHA-256 fingerprints are here, so anyone holding a photo can check it is one of these. GPS and clocks can be set by the device owner, so this record shows consistency, not proof of presence. Not a verdict on any project or company.' };
  const lines = photos.map(p => 'photo ' + p.sha256).sort();
  const { jcs, issue } = await import('./kbx_acct.js');
  lines.push('subject ' + await sha256hex(jcs(Object.assign({}, subject, { photos_hashed: lines.length }))));
  const root = await sha256hex(lines.join('\n'));
  subject.rootSha256 = root; subject.sealLines = lines;
  subject.sealMethod = 'rootSha256 = SHA-256 of the lines joined by a newline: "photo <sha256>" per photo (sorted), then "subject <SHA-256 of JCS(credentialSubject without rootSha256, sealLines, sealMethod, timestamp), plus photos_hashed: number of photo lines>". JCS = RFC 8785.';
  // OpenTimestamps: the existing stamp path keeps the root hash only (no position, no project, no photo hashes)
  let stamp = { status: 'not_stamped' };
  try {
    const { api } = await import('./kolaboro.js');
    const r = await api(new Request(ORIGIN + '/api/kb/stamp', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': req.headers.get('cf-connecting-ip') || 'x' }, body: JSON.stringify({ hash: root, source: 'visit' }) }), new URL(ORIGIN + '/api/kb/stamp'), env, ctx);
    const d = await r.json().catch(() => ({}));
    stamp = d.stamp ? { status: 'submitted', created_at: d.stamp.created_at || null, calendars: d.stamp.calendars || null, verify: ORIGIN + '/api/kb/stamp?hash=' + root } : { status: d.error === 'rate' ? 'rate_limited' : 'not_stamped' };
  } catch (e) { stamp = { status: 'error' }; }
  subject.timestamp = stamp;
  const doc = { '@context': ['https://www.w3.org/ns/credentials/v2'], id: 'urn:sha256:' + root, type: ['VerifiableCredential', 'KolaboroSiteVisitRecord'], name: 'Kolaboro site-visit record',
    description: 'A buyer\'s site visit as their browser reported it, received and signed by Kolaboro, with the distance to the project location in our records.',
    issuer: { id: 'did:web:kolaboro.com', name: 'Kolaboro' }, validFrom: at, credentialSubject: subject };
  const vc = await issue(env, doc, at);
  if (!vc) return out({ error: 'signing_unavailable', unsigned: doc }, 503);
  return out({ vc, root, stamp, verify: ORIGIN + '/verify/#vc', stored: false });
}

export async function handle(req, u, env, ctx) {
  const p = u.pathname.replace(/\/+$/, '');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400' } });
  try {
    if (p === '/api/x/space/visit') return req.method === 'POST' ? await visit(req, env, ctx) : out({ error: 'method', use: 'POST' }, 405);
    if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: 'method' }, 405);
    const { data } = await import('./kbx_named.js');
    const ix = await data(env).catch(() => null);
    if (!ix) return out({ error: 'unavailable' }, 503);
    if (p === '/api/x/space/pins') {
      const q = String(u.searchParams.get('q') || '').trim().toLowerCase().slice(0, 80), id = String(u.searchParams.get('id') || '').toUpperCase();
      let L = [];
      if (id) { const x = ix.byId.get(id) || ix.bySlug.get(id.toLowerCase()); if (x) L = [x]; }
      else if (q.length >= 2) {
        const nq = q.normalize('NFKD').replace(/[̀-ͯ]/g, '');
        for (const x of ix.P) {
          const hay = (x.id + ' ' + (x.n || '') + ' ' + (x.dv || '') + ' ' + (x.mk || '') + ' ' + (x.ar || '') + ' ' + x.s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
          if (hay.includes(nq) && pinOf(x)) { L.push(x); if (L.length >= 12) break; }
        }
      }
      return out({ q, results: L.filter(pinOf).map(x => ({ id: x.id, name: x.n || null, developer: x.dv || null, market: x.mk || null, area: x.ar || null, url: '/projects/' + x.s + '/', pin: pinOf(x) })) }, 200, 'public, max-age=300');
    }
    const m = p.match(/^\/api\/x\/space\/([A-Za-z0-9-]{3,20})$/);
    if (m) {
      const id = m[1].toUpperCase(), x = ix.byId.get(id);
      if (!x) return out({ id, named: false }, 404, 'public, max-age=300');
      const sp = await spaceData(env), bd = sp.bld;
      const b = bd && bd.projects && bd.projects[id];
      return out({ id, named: true, name: x.n || null, url: '/projects/' + x.s + '/', pin: pinOf(x), radar: radarSeries(sp, id),
        buildings: b ? Object.assign({ release: bd.release, registry_start: bd.registry_start, radius_m: bd.radius_m, updated: bd.updated, source: bd.source }, b) : null }, 200, 'public, max-age=600');
    }
    return out({ error: 'not_found', see: ['/api/x/space/<ID>', '/api/x/space/pins?q=', 'POST /api/x/space/visit'] }, 404);
  } catch (e) { return out({ error: 'server' }, 500); }
}
