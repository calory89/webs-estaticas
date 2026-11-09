// kolaboro.com batch 18 (n18c): see the site. Open street-level photos near the pin and a 3D view of the plot. No model calls, no keys.
// Data (built on main by .github/workflows/kolaboro-see-site.yml, tools/kolaboro-agent/see_site.py; same projects and pins as
// /data/construction-progress.json):
//   /data/street-photos.json  Panoramax (CC BY-SA 4.0 / Licence Ouverte 2.0), KartaView (CC BY-SA 4.0) and Wikimedia Commons
//                             (street-level files imported from Mapillary, CC0 to CC BY-SA 4.0) photos within 200 m of the pin, newest first
//   /data/site-3d.json        Overture Maps building footprints (ODbL) within 250 m of the pin, in half-metres from the pin
// Shown in the "street level and 3D" section of named project pages (kbx_named.js calls seeHtml). The 3D view loads only on a tap:
// MapLibre GL JS 4.7.1 (cdnjs), OpenStreetMap raster tiles, AWS Terrain Tiles (terrarium) and our footprints.
// Routes:
//   GET /api/x/see/<ID>             photos and 3D summary of one project (public, cacheable)
//   GET /api/x/see/3d/<ID>          footprints, pin and accuracy for the 3D view
//   GET /api/x/see/ph/<ID>/<n>.jpg  the source's own thumbnail of photo n, unchanged (only URLs from our data file; cached a week),
//                                   so a page view sends nothing about the viewer to the photo hosts
//   GET /api/x/see/3d.js            the 3D viewer script
const ORIGIN = 'https://kolaboro.com';
const ML = '4.7.1', ML_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/' + ML + '/';
let MEMO = {};
async function loadOne(env, name) {
  const m = MEMO[name]; if (m && Date.now() - m.t < 600000) return m.v;
  let r = null;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); } catch (e) { r = null; }
  if (!r || !r.ok) { try { r = await fetch(ORIGIN + '/data/' + name + '?w=1', { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
  const v = r && r.ok ? await r.json().catch(() => null) : null;
  MEMO[name] = { t: Date.now(), v }; return v;
}
export async function seeData(env) {
  const [ph, d3] = await Promise.all([loadOne(env, 'street-photos.json'), loadOne(env, 'site-3d.json')]);
  return { ph, d3, v: ((ph && ph.updated) || '') + '/' + ((d3 && d3.updated) || '') };
}
// pin accuracy ring: the pin comes from public sources; given to 3 decimals we draw about 100 m (as the satellite sections say)
export const accM = dec => dec >= 5 ? 15 : dec === 4 ? 30 : 100;

// ------------------------------------------------------------------------------------------------ strings (8 languages)
const S = {
  en: { h: 'The site at street level and in 3D', toc: 'Street level and 3D', ph: 'Street-level photos near the pin', phn: '{n} open street-level photos within 200 m of the pin, newest first, one per drive or walk.',
    ph0: 'No open street-level photo within 200 m of the pin in {s} (checked {d}).', cap: 'Taken {d}, {m} m from the pin', nod: 'Date not recorded, {m} m from the pin',
    face: 'camera facing the pin', pano: '360° photo', lic: 'Licence {l}. Author and full credit on the photo\'s page.', open: 'Open at {s}', commons: 'imported from Mapillary',
    phlim: 'These photos are by volunteers and the public, not by the developer or by us. A photo can be years old, so check its date. The pin is about {a} m accurate, so a photo may show a neighbouring plot.',
    other: 'Mapillary and Google Street View need an account or a key, so we do not search them. You can open the place there yourself:', gsv: 'Google Street View', mpl: 'Mapillary',
    d3: '3D view', d3i: 'Terrain, the buildings mapped within 250 m ({n}, of which {k} touch the 150 m circle), the 150 m circle used by the satellite sections and how accurate the pin is.', d3i0: 'Terrain, the 150 m circle used by the satellite sections and how accurate the pin is. No building is mapped within 250 m of the pin in Overture release {rel}.',
    d3b: 'Show the site in 3D', d3s: 'Loads only when you ask, about 1 MB of map data.', d3l: 'Loading the 3D view', d3e: 'The 3D view could not load in this browser. It needs WebGL.', d3help: 'Drag to move. Right-drag or two fingers to tilt and turn. Pinch or Ctrl and scroll to zoom.',
    lgk: 'Building, height mapped', lgu: 'Building, height not mapped (drawn at 3 m)', lgc: '150 m circle', lga: 'Pin accuracy, about {a} m (pin given to {dec} decimals)', lgp: 'Pin',
    d3lim: 'Footprints come from volunteers (OpenStreetMap) and from machine learning on satellite imagery. They can be years behind the ground, and most heights are not mapped. Terrain is a public elevation model with cells of about 30 m in most places, so small slopes and cuts do not show.',
    method: 'method and data', upd: 'updated {d}', reset: 'Reset view' },
  es: { h: 'La obra a pie de calle y en 3D', toc: 'A pie de calle y 3D', ph: 'Fotos a pie de calle cerca del punto', phn: '{n} fotos abiertas a pie de calle a menos de 200 m del punto, de la más reciente a la más antigua, una por recorrido.',
    ph0: 'No hay ninguna foto abierta a pie de calle a menos de 200 m del punto en {s} (comprobado el {d}).', cap: 'Tomada el {d}, a {m} m del punto', nod: 'Fecha no registrada, a {m} m del punto',
    face: 'cámara orientada hacia el punto', pano: 'foto de 360°', lic: 'Licencia {l}. Autor y créditos completos en la página de la foto.', open: 'Abrir en {s}', commons: 'importada de Mapillary',
    phlim: 'Estas fotos son de voluntarios y del público, no del promotor ni nuestras. Una foto puede tener años, así que mire su fecha. El punto tiene unos {a} m de precisión, así que una foto puede mostrar una parcela vecina.',
    other: 'Mapillary y Google Street View piden una cuenta o una clave, así que no los consultamos. Puede abrir el lugar allí usted mismo:', gsv: 'Google Street View', mpl: 'Mapillary',
    d3: 'Vista 3D', d3i: 'El terreno, los edificios cartografiados a menos de 250 m ({n}, de los que {k} tocan el círculo de 150 m), el círculo de 150 m de las secciones de satélite y la precisión del punto.', d3i0: 'El terreno, el círculo de 150 m de las secciones de satélite y la precisión del punto. No hay ningún edificio cartografiado a menos de 250 m del punto en la versión {rel} de Overture.',
    d3b: 'Ver la obra en 3D', d3s: 'Se carga solo si lo pide, cerca de 1 MB de datos de mapa.', d3l: 'Cargando la vista 3D', d3e: 'La vista 3D no ha podido cargarse en este navegador. Necesita WebGL.', d3help: 'Arrastre para mover. Clic derecho o dos dedos para inclinar y girar. Pellizque o Ctrl y rueda para acercar.',
    lgk: 'Edificio con altura cartografiada', lgu: 'Edificio sin altura cartografiada (dibujado a 3 m)', lgc: 'Círculo de 150 m', lga: 'Precisión del punto, unos {a} m (punto con {dec} decimales)', lgp: 'Punto',
    d3lim: 'Las huellas vienen de voluntarios (OpenStreetMap) y de aprendizaje automático sobre imágenes de satélite. Pueden ir años por detrás del terreno y la mayoría de las alturas no están cartografiadas. El terreno es un modelo de elevación público con celdas de unos 30 m en casi todas partes, así que no se ven pendientes ni desmontes pequeños.',
    method: 'método y datos', upd: 'actualizado {d}', reset: 'Restablecer vista' },
  fr: { h: 'Le site au niveau de la rue et en 3D', toc: 'Rue et 3D', ph: 'Photos au niveau de la rue près du point', phn: '{n} photos libres au niveau de la rue à moins de 200 m du point, de la plus récente à la plus ancienne, une par parcours.',
    ph0: 'Aucune photo libre au niveau de la rue à moins de 200 m du point dans {s} (vérifié le {d}).', cap: 'Prise le {d}, à {m} m du point', nod: 'Date non enregistrée, à {m} m du point',
    face: 'appareil tourné vers le point', pano: 'photo à 360°', lic: 'Licence {l}. Auteur et crédits complets sur la page de la photo.', open: 'Ouvrir sur {s}', commons: 'importée de Mapillary',
    phlim: 'Ces photos sont de bénévoles et du public, pas du promoteur ni de nous. Une photo peut dater de plusieurs années : regardez sa date. Le point est précis à environ {a} m, une photo peut donc montrer une parcelle voisine.',
    other: 'Mapillary et Google Street View demandent un compte ou une clé, nous ne les interrogeons donc pas. Vous pouvez y ouvrir le lieu vous-même :', gsv: 'Google Street View', mpl: 'Mapillary',
    d3: 'Vue 3D', d3i: 'Le relief, les bâtiments cartographiés à moins de 250 m ({n}, dont {k} touchent le cercle de 150 m), le cercle de 150 m des sections satellite et la précision du point.', d3i0: 'Le relief, le cercle de 150 m des sections satellite et la précision du point. Aucun bâtiment n\'est cartographié à moins de 250 m du point dans la version {rel} d\'Overture.',
    d3b: 'Voir le site en 3D', d3s: 'Chargé seulement à votre demande, environ 1 Mo de données cartographiques.', d3l: 'Chargement de la vue 3D', d3e: 'La vue 3D n\'a pas pu se charger dans ce navigateur. Elle a besoin de WebGL.', d3help: 'Glissez pour déplacer. Clic droit ou deux doigts pour incliner et tourner. Pincez ou Ctrl et molette pour zoomer.',
    lgk: 'Bâtiment, hauteur cartographiée', lgu: 'Bâtiment, hauteur non cartographiée (dessiné à 3 m)', lgc: 'Cercle de 150 m', lga: 'Précision du point, environ {a} m (point à {dec} décimales)', lgp: 'Point',
    d3lim: 'Les emprises viennent de bénévoles (OpenStreetMap) et d\'apprentissage automatique sur images satellite. Elles peuvent avoir des années de retard sur le terrain, et la plupart des hauteurs ne sont pas cartographiées. Le relief est un modèle d\'élévation public à mailles d\'environ 30 m presque partout : les petites pentes et les terrassements ne se voient pas.',
    method: 'méthode et données', upd: 'mis à jour le {d}', reset: 'Réinitialiser la vue' },
  de: { h: 'Das Grundstück auf Straßenhöhe und in 3D', toc: 'Straße und 3D', ph: 'Straßenfotos nahe dem Punkt', phn: '{n} freie Straßenfotos im Umkreis von 200 m um den Punkt, die neuesten zuerst, eines pro Fahrt oder Gang.',
    ph0: 'Kein freies Straßenfoto im Umkreis von 200 m um den Punkt in {s} (geprüft am {d}).', cap: 'Aufgenommen am {d}, {m} m vom Punkt', nod: 'Datum nicht erfasst, {m} m vom Punkt',
    face: 'Kamera zeigt zum Punkt', pano: '360°-Foto', lic: 'Lizenz {l}. Urheber und vollständige Angaben auf der Seite des Fotos.', open: 'Bei {s} öffnen', commons: 'aus Mapillary importiert',
    phlim: 'Diese Fotos stammen von Freiwilligen und der Öffentlichkeit, nicht vom Bauträger und nicht von uns. Ein Foto kann Jahre alt sein, prüfen Sie das Datum. Der Punkt ist etwa {a} m genau, ein Foto kann also ein Nachbargrundstück zeigen.',
    other: 'Mapillary und Google Street View verlangen ein Konto oder einen Schlüssel, deshalb fragen wir sie nicht ab. Sie können den Ort dort selbst öffnen:', gsv: 'Google Street View', mpl: 'Mapillary',
    d3: '3D-Ansicht', d3i: 'Gelände, die im Umkreis von 250 m kartierten Gebäude ({n}, davon {k} am 150-m-Kreis), der 150-m-Kreis der Satellitenabschnitte und die Genauigkeit des Punkts.', d3i0: 'Gelände, der 150-m-Kreis der Satellitenabschnitte und die Genauigkeit des Punkts. In der Overture-Version {rel} ist im Umkreis von 250 m um den Punkt kein Gebäude kartiert.',
    d3b: 'Grundstück in 3D zeigen', d3s: 'Wird nur auf Wunsch geladen, etwa 1 MB Kartendaten.', d3l: '3D-Ansicht wird geladen', d3e: 'Die 3D-Ansicht konnte in diesem Browser nicht geladen werden. Sie braucht WebGL.', d3help: 'Ziehen zum Verschieben. Rechtsklick-Ziehen oder zwei Finger zum Neigen und Drehen. Zwei Finger spreizen oder Strg und Mausrad zum Zoomen.',
    lgk: 'Gebäude, Höhe kartiert', lgu: 'Gebäude, Höhe nicht kartiert (mit 3 m gezeichnet)', lgc: '150-m-Kreis', lga: 'Genauigkeit des Punkts, etwa {a} m (Punkt mit {dec} Dezimalstellen)', lgp: 'Punkt',
    d3lim: 'Grundrisse stammen von Freiwilligen (OpenStreetMap) und aus maschinellem Lernen auf Satellitenbildern. Sie können Jahre hinter der Wirklichkeit liegen, und die meisten Höhen sind nicht kartiert. Das Gelände ist ein öffentliches Höhenmodell mit meist etwa 30 m großen Zellen, kleine Hänge und Abgrabungen sind daher nicht zu sehen.',
    method: 'Methode und Daten', upd: 'aktualisiert {d}', reset: 'Ansicht zurücksetzen' },
  nl: { h: 'Het terrein op straatniveau en in 3D', toc: 'Straat en 3D', ph: 'Straatfoto\'s bij het punt', phn: '{n} open straatfoto\'s binnen 200 m van het punt, nieuwste eerst, één per rit of wandeling.',
    ph0: 'Geen open straatfoto binnen 200 m van het punt in {s} (gecontroleerd op {d}).', cap: 'Genomen op {d}, {m} m van het punt', nod: 'Datum niet vastgelegd, {m} m van het punt',
    face: 'camera gericht op het punt', pano: '360°-foto', lic: 'Licentie {l}. Maker en volledige vermelding op de pagina van de foto.', open: 'Openen op {s}', commons: 'geïmporteerd uit Mapillary',
    phlim: 'Deze foto\'s zijn van vrijwilligers en het publiek, niet van de ontwikkelaar of van ons. Een foto kan jaren oud zijn, kijk dus naar de datum. Het punt is ongeveer {a} m nauwkeurig, dus een foto kan een buurperceel tonen.',
    other: 'Mapillary en Google Street View vragen een account of sleutel, dus doorzoeken wij ze niet. Je kunt de plek daar zelf openen:', gsv: 'Google Street View', mpl: 'Mapillary',
    d3: '3D-weergave', d3i: 'Het terrein, de gebouwen gekarteerd binnen 250 m ({n}, waarvan {k} de cirkel van 150 m raken), de cirkel van 150 m uit de satellietdelen en hoe nauwkeurig het punt is.', d3i0: 'Het terrein, de cirkel van 150 m uit de satellietdelen en hoe nauwkeurig het punt is. In Overture-versie {rel} is binnen 250 m van het punt geen gebouw gekarteerd.',
    d3b: 'Toon het terrein in 3D', d3s: 'Laadt alleen als je erom vraagt, ongeveer 1 MB kaartgegevens.', d3l: '3D-weergave laden', d3e: 'De 3D-weergave kon in deze browser niet laden. Ze heeft WebGL nodig.', d3help: 'Sleep om te verplaatsen. Rechts slepen of twee vingers om te kantelen en draaien. Knijp of Ctrl en scroll om te zoomen.',
    lgk: 'Gebouw, hoogte gekarteerd', lgu: 'Gebouw, hoogte niet gekarteerd (getekend op 3 m)', lgc: 'Cirkel van 150 m', lga: 'Nauwkeurigheid van het punt, ongeveer {a} m (punt met {dec} decimalen)', lgp: 'Punt',
    d3lim: 'Contouren komen van vrijwilligers (OpenStreetMap) en van machine learning op satellietbeelden. Ze kunnen jaren achterlopen en de meeste hoogtes zijn niet gekarteerd. Het terrein is een openbaar hoogtemodel met cellen van meestal ongeveer 30 m, dus kleine hellingen en afgravingen zijn niet te zien.',
    method: 'methode en gegevens', upd: 'bijgewerkt {d}', reset: 'Weergave herstellen' },
  ru: { h: 'Участок с уровня улицы и в 3D', toc: 'Улица и 3D', ph: 'Уличные фото рядом с точкой', phn: '{n} открытых уличных фото в пределах 200 м от точки, сначала новые, по одному на поездку или прогулку.',
    ph0: 'В {s} нет открытых уличных фото в пределах 200 м от точки (проверено {d}).', cap: 'Снято {d}, {m} м от точки', nod: 'Дата не записана, {m} м от точки',
    face: 'камера направлена на точку', pano: 'фото 360°', lic: 'Лицензия {l}. Автор и полная атрибуция на странице фото.', open: 'Открыть на {s}', commons: 'импортировано из Mapillary',
    phlim: 'Эти фото сделаны волонтёрами и обычными людьми, а не застройщиком и не нами. Фото может быть многолетней давности, смотрите дату. Точность точки около {a} м, поэтому на фото может быть соседний участок.',
    other: 'Mapillary и Google Street View требуют аккаунт или ключ, поэтому мы их не опрашиваем. Вы можете открыть место там сами:', gsv: 'Google Street View', mpl: 'Mapillary',
    d3: 'Вид в 3D', d3i: 'Рельеф, здания на карте в пределах 250 м ({n}, из них {k} касаются круга 150 м), круг 150 м из спутниковых разделов и точность точки.', d3i0: 'Рельеф, круг 150 м из спутниковых разделов и точность точки. В выпуске Overture {rel} в пределах 250 м от точки нет ни одного здания на карте.',
    d3b: 'Показать участок в 3D', d3s: 'Загружается только по вашему запросу, около 1 МБ картографических данных.', d3l: 'Загрузка 3D-вида', d3e: 'Не удалось загрузить 3D-вид в этом браузере. Нужен WebGL.', d3help: 'Перетаскивайте, чтобы двигать. Правой кнопкой или двумя пальцами наклон и поворот. Щипок или Ctrl и колесо для масштаба.',
    lgk: 'Здание, высота на карте', lgu: 'Здание, высота не указана (нарисовано 3 м)', lgc: 'Круг 150 м', lga: 'Точность точки, около {a} м (точка с {dec} знаками после запятой)', lgp: 'Точка',
    d3lim: 'Контуры зданий от волонтёров (OpenStreetMap) и из машинного обучения по спутниковым снимкам. Они могут отставать от реальности на годы, а высота у большинства не указана. Рельеф взят из открытой модели высот с ячейкой около 30 м почти везде, поэтому небольшие склоны и выемки не видны.',
    method: 'метод и данные', upd: 'обновлено {d}', reset: 'Сбросить вид' },
  zh: { h: '街景与三维中的项目地块', toc: '街景与三维', ph: '定位点附近的街景照片', phn: '定位点 200 米内的 {n} 张开放街景照片，按时间从新到旧，每次拍摄行程一张。',
    ph0: '{s} 中，定位点 200 米内没有开放的街景照片（核查于 {d}）。', cap: '拍摄于 {d}，距定位点 {m} 米', nod: '未记录日期，距定位点 {m} 米',
    face: '镜头朝向定位点', pano: '360° 照片', lic: '许可 {l}。作者和完整署名见照片页面。', open: '在 {s} 打开', commons: '从 Mapillary 导入',
    phlim: '这些照片来自志愿者和公众，不是开发商拍摄，也不是我们拍摄。照片可能已有多年，请看拍摄日期。定位点精度约 {a} 米，照片可能拍到相邻地块。',
    other: 'Mapillary 和 Google 街景需要账户或密钥，所以我们不查询它们。您可以自己在那里打开这个地点：', gsv: 'Google 街景', mpl: 'Mapillary',
    d3: '三维视图', d3i: '地形、250 米内已绘制的建筑（{n} 栋，其中 {k} 栋触及 150 米圆圈）、卫星部分使用的 150 米圆圈，以及定位点的精度。', d3i0: '地形、卫星部分使用的 150 米圆圈，以及定位点的精度。在 Overture {rel} 版本中，定位点 250 米内没有已绘制的建筑。',
    d3b: '以三维查看地块', d3s: '仅在您点击时加载，约 1 MB 地图数据。', d3l: '正在加载三维视图', d3e: '此浏览器无法加载三维视图，需要 WebGL。', d3help: '拖动可移动。右键拖动或双指可倾斜和旋转。双指缩放或按住 Ctrl 滚动可缩放。',
    lgk: '建筑，已绘制高度', lgu: '建筑，未绘制高度（按 3 米绘制）', lgc: '150 米圆圈', lga: '定位点精度，约 {a} 米（定位点有 {dec} 位小数）', lgp: '定位点',
    d3lim: '建筑轮廓来自志愿者（OpenStreetMap）和基于卫星影像的机器学习，可能比实际情况晚数年，大多数建筑没有高度数据。地形来自公开的高程模型，多数地方网格约 30 米，因此看不到小的坡度和开挖。',
    method: '方法与数据', upd: '更新于 {d}', reset: '重置视图' },
  ar: { h: 'الموقع على مستوى الشارع وبالأبعاد الثلاثة', toc: 'الشارع والأبعاد الثلاثة', ph: 'صور على مستوى الشارع قرب النقطة', phn: '{n} صور مفتوحة على مستوى الشارع ضمن 200 م من النقطة، الأحدث أولًا، صورة واحدة لكل جولة تصوير.',
    ph0: 'لا توجد صورة مفتوحة على مستوى الشارع ضمن 200 م من النقطة في {s} (تم التحقق في {d}).', cap: 'التُقطت في {d}، على بعد {m} م من النقطة', nod: 'التاريخ غير مسجّل، على بعد {m} م من النقطة',
    face: 'الكاميرا موجّهة نحو النقطة', pano: 'صورة 360°', lic: 'الترخيص {l}. اسم المؤلف والإسناد الكامل في صفحة الصورة.', open: 'افتح في {s}', commons: 'مستوردة من Mapillary',
    phlim: 'هذه الصور من متطوعين ومن الجمهور، لا من المطوّر ولا منّا. قد تكون الصورة قديمة بسنوات، فانظر إلى تاريخها. دقة النقطة نحو {a} م، لذا قد تُظهر الصورة قطعة مجاورة.',
    other: 'يتطلب Mapillary وGoogle Street View حسابًا أو مفتاحًا، لذا لا نبحث فيهما. يمكنك فتح المكان هناك بنفسك:', gsv: 'Google Street View', mpl: 'Mapillary',
    d3: 'عرض ثلاثي الأبعاد', d3i: 'التضاريس، والمباني المرسومة ضمن 250 م ({n}، منها {k} تلامس دائرة 150 م)، ودائرة 150 م المستخدمة في أقسام الأقمار الصناعية، ومدى دقة النقطة.', d3i0: 'التضاريس، ودائرة 150 م المستخدمة في أقسام الأقمار الصناعية، ومدى دقة النقطة. لا يوجد مبنى مرسوم ضمن 250 م من النقطة في إصدار Overture ‏{rel}.',
    d3b: 'اعرض الموقع بالأبعاد الثلاثة', d3s: 'يُحمَّل فقط عند طلبك، نحو 1 ميغابايت من بيانات الخريطة.', d3l: 'جارٍ تحميل العرض ثلاثي الأبعاد', d3e: 'تعذّر تحميل العرض ثلاثي الأبعاد في هذا المتصفح. يحتاج إلى WebGL.', d3help: 'اسحب للتحريك. اسحب بالزر الأيمن أو بإصبعين للإمالة والتدوير. باعد إصبعين أو استخدم Ctrl مع العجلة للتكبير.',
    lgk: 'مبنى، ارتفاعه مرسوم', lgu: 'مبنى، ارتفاعه غير مرسوم (مرسوم بارتفاع 3 م)', lgc: 'دائرة 150 م', lga: 'دقة النقطة، نحو {a} م (النقطة بـ {dec} منازل عشرية)', lgp: 'النقطة',
    d3lim: 'تأتي حدود المباني من متطوعين (OpenStreetMap) ومن التعلم الآلي على صور الأقمار الصناعية. قد تتأخر عن الواقع سنوات، ومعظم الارتفاعات غير مرسومة. التضاريس من نموذج ارتفاعات عام بخلايا نحو 30 م في معظم الأماكن، لذا لا تظهر المنحدرات والحفريات الصغيرة.',
    method: 'المنهجية والبيانات', upd: 'حُدّث في {d}', reset: 'إعادة ضبط العرض' },
};
const t = (lang, k, v) => { const s = (S[lang] && S[lang][k]) || S.en[k]; return v && typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const seeToc = lang => t(lang, 'toc');
export const seeHeading = lang => t(lang, 'h');
const SRCN = { panoramax: 'Panoramax', kartaview: 'KartaView', commons: 'Wikimedia Commons' };
const adiff = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

const CSS = '<style id="ksee-css">.ksee h3{margin:20px 0 6px;font-size:var(--k-fs-lg,1.2rem)}.ksee-ph{list-style:none;margin:12px 0;padding:0;display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(min(100%,150px),1fr))}@media (min-width:700px){.ksee-ph{grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}}' +
  '.ksee-ph li{margin:0;border:1px solid var(--k-line,var(--line));border-radius:var(--k-r-md,10px);overflow:hidden;background:var(--k-surface,#fff);display:flex;flex-direction:column}' +
  '.ksee-ph a.im{display:block;aspect-ratio:4/3;background:var(--k-sunken,#E8ECEA)}.ksee-ph img{display:block;width:100%;height:100%;object-fit:cover}.ksee-ph .tx{padding:10px 12px 12px;font-size:var(--k-fs-xs,.82rem);color:var(--k-ink-2,inherit);display:flex;flex-direction:column;gap:4px}' +
  '.ksee-ph .tx b{font-size:var(--k-fs-sm,.92rem);color:var(--k-ink,inherit)}.ksee-ph .tx a{color:var(--k-sea,#155C75)}.ksee-lnk{display:flex;flex-wrap:wrap;gap:8px 16px;margin:6px 0 0;padding:0;list-style:none}.ksee-lnk a{color:var(--k-sea,#155C75)}' +
  '.ksee-3d{margin:10px 0 0}.ksee-map{position:relative;width:100%;height:min(72vh,560px);min-height:340px;border:1px solid var(--k-line,var(--line));border-radius:var(--k-r-md,10px);overflow:hidden;background:var(--k-sunken,#E8ECEA)}' +
  '.ksee-map[hidden]{display:none}.ksee-map .msg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;text-align:center;color:var(--k-muted,#56636F)}' +
  '.ksee-lg{list-style:none;margin:10px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:6px 18px;font-size:var(--k-fs-xs,.82rem);color:var(--k-ink-2,inherit)}.ksee-lg li{display:flex;align-items:center;gap:6px}' +
  '.ksee-lg i{display:inline-block;width:16px;height:12px;border-radius:2px;flex:none}.ksee-lg .k{background:#155C75}.ksee-lg .u{background:#9FB4BF}.ksee-lg .c{border:2px solid #FF5B14;border-radius:50%;width:12px}.ksee-lg .a{border:2px dashed #13222E;border-radius:50%;width:12px}' +
  '.ksee-lg .p{background:#FF5B14;border:2px solid #fff;border-radius:50%;width:10px;height:10px;box-shadow:0 0 0 1px #13222E}.ksee .k-btn{min-height:44px}.ksee-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin:8px 0}' +
  ':root[data-theme=dark] .ksee-lg .a{border-color:#E6ECEF}.ksee-map summary{list-style:none}.ksee-map summary::-webkit-details-marker{display:none}.ksee-map summary::after,.ksee-map summary::before{content:none!important;display:none!important}</style>';

// n20p: one formatter per locale and options for the life of the isolate (building one per call cost most of the render time)
const dtf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'd' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.DateTimeFormat(L, o)); };
const nmf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'n' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.NumberFormat(L, o)); };
// inside the named project page: section "street level and 3D"
export function seeHtml(sd, id, lang, fd, name) {
  if (!sd) return '';
  const php = sd.ph && sd.ph.projects && sd.ph.projects[id], d3 = sd.d3 && sd.d3.projects && sd.d3.projects[id];
  if (!php && !d3) return '';
  const num = v => { try { return nmf(lang === 'en' ? 'en-GB' : lang).format(v); } catch (e) { return String(v); } };
  const lat = d3 ? d3.lat : null, lng = d3 ? d3.lng : null, dec = d3 ? d3.dec : 3, acc = accM(dec);
  let h = CSS + '<div class="ksee">';
  if (php) {
    h += '<h3>' + esc(t(lang, 'ph')) + '</h3>';
    const L = php.ph || [];
    if (!L.length) { const ok = ['panoramax', 'kartaview', 'commons'].filter(k => !(php.errors || []).includes(k)).map(k => SRCN[k]); if (ok.length) h += '<p>' + esc(t(lang, 'ph0', { d: fd(php.checked), s: ok.join(', ') })) + '</p>'; }
    else {
      h += '<p class="ki">' + esc(t(lang, 'phn', { n: num(L.length) })) + '</p><ul class="ksee-ph">' + L.map((x, i) => {
        const sn = SRCN[x.src] || x.src, alt = sn + (x.date ? ', ' + fd(x.date) : '') + ', ' + num(x.d) + ' m' + (name ? ', ' + name : '');
        const ex = [x.az != null && x.to != null && adiff(x.az, x.to) <= 60 ? t(lang, 'face') : '', x.pano ? t(lang, 'pano') : '', x.src === 'commons' ? t(lang, 'commons') : ''].filter(Boolean).join(', ');
        return '<li><a class="im" href="' + esc(x.page) + '" rel="noopener nofollow" target="_blank"><img src="/api/x/see/ph/' + encodeURIComponent(id) + '/' + i + '.jpg?v=' + encodeURIComponent(sd.ph.updated || '') + '" alt="' + esc(alt) + '" loading="lazy" decoding="async" width="500" height="375" referrerpolicy="no-referrer"></a>' +
          '<div class="tx"><b>' + esc(x.date ? t(lang, 'cap', { d: fd(x.date), m: num(x.d) }) : t(lang, 'nod', { m: num(x.d) })) + '</b>' + (ex ? '<span>' + esc(ex) + '</span>' : '') +
          '<span>' + esc(t(lang, 'lic', { l: x.lic })) + (x.lic_url ? ' <a href="' + esc(x.lic_url) + '" rel="noopener license" target="_blank">' + esc(x.lic) + '</a>' : '') + '</span>' +
          '<a class="k-src" href="' + esc(x.page) + '" rel="noopener nofollow" target="_blank">' + esc(t(lang, 'open', { s: sn })) + '</a></div></li>';
      }).join('') + '</ul>';
    }
    h += '<p class="ksat-lim">' + esc(t(lang, 'phlim', { a: acc })) + '</p>';
    if (lat != null) h += '<p class="ksat-lim">' + esc(t(lang, 'other')) + '</p><ul class="ksee-lnk"><li><a href="https://www.google.com/maps/@?api=1&amp;map_action=pano&amp;viewpoint=' + lat + ',' + lng + '" rel="noopener nofollow" target="_blank">' + esc(t(lang, 'gsv')) + '</a></li><li><a href="https://www.mapillary.com/app/?lat=' + lat + '&amp;lng=' + lng + '&amp;z=17" rel="noopener nofollow" target="_blank">' + esc(t(lang, 'mpl')) + '</a></li></ul>';
    h += '<p class="ksat-src">' + ['panoramax', 'kartaview', 'commons'].map(k => { const s = sd.ph.sources[k]; return '<a class="src" href="' + esc(s.url) + '" rel="noopener" target="_blank">' + esc(s.name) + '</a>'; }).join(' ') +
      ' <a class="src" href="/data/street-photos.json">' + esc(t(lang, 'method')) + ', ' + esc(t(lang, 'upd', { d: fd(php.checked || sd.ph.updated) })) + '</a></p>';
  }
  if (d3) {
    const rel = String(sd.d3.release || '').replace(/\.\d+$/, '');
    h += '<h3>' + esc(t(lang, 'd3')) + '</h3><p>' + esc(d3.n ? t(lang, 'd3i', { n: num(d3.n), k: num(d3.n_in) }) : t(lang, 'd3i0', { rel: fd(rel) })) + '</p>' +
      '<div class="ksee-3d" data-id="' + esc(id) + '" data-lat="' + d3.lat + '" data-lng="' + d3.lng + '" data-acc="' + acc + '" data-v="' + esc(sd.d3.updated || '') + '" data-l="' + esc(t(lang, 'd3l')) + '" data-e="' + esc(t(lang, 'd3e')) + '" data-r="' + esc(t(lang, 'reset')) + '">' +
      '<div class="ksee-bar"><button type="button" class="k-btn ksee-go" aria-expanded="false">' + esc(t(lang, 'd3b')) + '</button><span class="k-small k-muted">' + esc(t(lang, 'd3s')) + '</span></div>' +
      '<div class="ksee-map" hidden role="region" aria-label="' + esc(t(lang, 'd3') + (name ? ': ' + name : '')) + '"></div><p class="k-small k-muted ksee-help" hidden>' + esc(t(lang, 'd3help')) + '</p>' +
      '<ul class="ksee-lg"><li><i class="p"></i>' + esc(t(lang, 'lgp')) + '</li><li><i class="a"></i>' + esc(t(lang, 'lga', { a: acc, dec })) + '</li><li><i class="c"></i>' + esc(t(lang, 'lgc')) + '</li>' +
      (d3.n ? '<li><i class="k"></i>' + esc(t(lang, 'lgk')) + '</li><li><i class="u"></i>' + esc(t(lang, 'lgu')) + '</li>' : '') + '</ul></div>' +
      '<p class="ksat-lim">' + esc(t(lang, 'd3lim')) + '</p>' +
      '<p class="ksat-src">' + esc(sd.d3.source.attribution) + '. <a class="src" href="' + esc(sd.d3.source.url) + '" rel="noopener" target="_blank">Overture Maps buildings, ' + esc(sd.d3.release) + '</a> <a class="src" href="' + esc(sd.d3.source.licence_url) + '" rel="noopener" target="_blank">ODbL 1.0</a>' +
      ' <a class="src" href="https://registry.opendata.aws/terrain-tiles/" rel="noopener" target="_blank">Terrain Tiles, AWS Open Data (Mapzen)</a> <a class="src" href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" rel="noopener" target="_blank">terrain attribution</a>' +
      ' <a class="src" href="https://www.openstreetmap.org/copyright" rel="noopener" target="_blank">© OpenStreetMap contributors</a> <a class="src" href="https://maplibre.org/" rel="noopener" target="_blank">MapLibre GL JS ' + ML + '</a>' +
      ' <a class="src" href="/data/site-3d.json">' + esc(t(lang, 'method')) + ', ' + esc(t(lang, 'upd', { d: fd(sd.d3.updated) })) + '</a></p>' +
      '<script>(function(){var b=document.querySelectorAll(".ksee-go");b.forEach(function(x){x.addEventListener("click",function(){var r=x.closest(".ksee-3d");if(!r||r.dataset.on)return;r.dataset.on="1";x.setAttribute("aria-expanded","true");x.disabled=true;' +
      'var m=r.querySelector(".ksee-map");m.hidden=false;m.innerHTML="<div class=\\"msg\\" role=\\"status\\"><span class=\\"k-spin\\"></span>&nbsp;"+r.dataset.l.replace(/</g,"&lt;")+"</div>";' +
      'if(window.kSee3D){window.kSee3D(r);return;}var s=document.createElement("script");s.src="/api/x/see/3d.js?v=' + ML + '-4";s.onload=function(){window.kSee3D(r)};s.onerror=function(){m.innerHTML="<div class=\\"msg\\">"+r.dataset.e.replace(/</g,"&lt;")+"</div>"};document.head.appendChild(s);});});})();</script>';
  }
  return h + '</div>';
}

// ------------------------------------------------------------------------------------------------ 3D viewer (browser)
const VIEWER = `(function(){
var ML="${ML_CDN}";
function css(){if(document.getElementById("ksee-ml-css"))return;var l=document.createElement("link");l.id="ksee-ml-css";l.rel="stylesheet";l.href=ML+"maplibre-gl.min.css";l.integrity="sha384-K282sW/zFjTkrjR/+yr1H+gCukuy4OEYrkXRybV88g7pk+kZZYpNV6SAV59NcgFg";l.crossOrigin="anonymous";document.head.appendChild(l);}
function lib(){return new Promise(function(ok,no){if(window.maplibregl)return ok();var s=document.createElement("script");s.src=ML+"maplibre-gl.min.js";s.integrity="sha384-KKgyz2mG25bKJ1O2PyqTJPlAF8Kw2BpDmsLTNBXslICOBvhTAyF5F0XhLWF2ZovY";s.crossOrigin="anonymous";s.onload=function(){ok()};s.onerror=no;document.head.appendChild(s);});}
function gl(){try{var c=document.createElement("canvas");return !!(c.getContext("webgl2")||c.getContext("webgl"));}catch(e){return false}}
function circle(lat,lng,r,n){var k=Math.cos(lat*Math.PI/180),o=[];for(var i=0;i<=n;i++){var a=i/n*2*Math.PI;o.push([lng+Math.cos(a)*r/(111320*k),lat+Math.sin(a)*r/110540]);}return o;}
window.kSee3D=function(r){
 var m=r.querySelector(".ksee-map"),lat=+r.dataset.lat,lng=+r.dataset.lng,acc=+r.dataset.acc,err=function(){m.innerHTML='<div class="msg">'+r.dataset.e.replace(/</g,"&lt;")+'</div>'};
 if(!gl())return err();
 css();
 Promise.all([lib(),fetch("/api/x/see/3d/"+encodeURIComponent(r.dataset.id)+"?v="+encodeURIComponent(r.dataset.v)).then(function(x){if(!x.ok)throw 0;return x.json()})]).then(function(a){
  var d=a[1],k=Math.cos(lat*Math.PI/180),F=[];
  (d.b||[]).forEach(function(b){var c=b.c,ring=[];for(var i=0;i<c.length;i+=2)ring.push([lng+c[i]/2/(111320*k),lat+c[i+1]/2/110540]);ring.push(ring[0]);
   var h=b.h||(b.f?b.f*3.2:null);F.push({type:"Feature",properties:{h:h||3,mh:b.mh||0,k:h?1:0,i:b.i||0},geometry:{type:"Polygon",coordinates:[ring]}});});
  m.innerHTML="";
  var dark=document.documentElement.getAttribute("data-theme")==="dark",phone=matchMedia("(pointer:coarse)").matches;
  var map=new maplibregl.Map({container:m,center:[lng,lat],zoom:16.2,pitch:58,bearing:-24,maxPitch:78,minZoom:13,maxZoom:19,attributionControl:false,cooperativeGestures:phone,
   style:{version:8,sources:{
    osm:{type:"raster",tiles:["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],tileSize:256,maxzoom:19,attribution:'<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a>'},
    dem:{type:"raster-dem",tiles:["https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png"],tileSize:256,maxzoom:13,encoding:"terrarium",attribution:'<a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank" rel="noopener">Terrain Tiles (Mapzen, AWS Open Data)</a>'},
    b:{type:"geojson",data:{type:"FeatureCollection",features:F},attribution:'<a href="https://docs.overturemaps.org/attribution/" target="_blank" rel="noopener">Overture Maps (ODbL)</a>'},
    c:{type:"geojson",data:{type:"FeatureCollection",features:[{type:"Feature",properties:{t:"c"},geometry:{type:"LineString",coordinates:circle(lat,lng,150,96)}},{type:"Feature",properties:{t:"a"},geometry:{type:"LineString",coordinates:circle(lat,lng,acc,72)}}]}},
    p:{type:"geojson",data:{type:"Feature",properties:{},geometry:{type:"Point",coordinates:[lng,lat]}}}},
   layers:[{id:"bg",type:"background",paint:{"background-color":dark?"#1B2731":"#E8ECEA"}},
    {id:"osm",type:"raster",source:"osm",paint:{"raster-saturation":-0.55,"raster-opacity":dark?0.55:0.9,"raster-brightness-max":dark?0.75:1}},
    {id:"hs",type:"hillshade",source:"dem",paint:{"hillshade-exaggeration":0.35,"hillshade-shadow-color":"#13222E"}},
    {id:"acc",type:"line",source:"c",filter:["==",["get","t"],"a"],paint:{"line-color":dark?"#E6ECEF":"#13222E","line-width":2,"line-dasharray":[2,2]}},
    {id:"circ",type:"line",source:"c",filter:["==",["get","t"],"c"],paint:{"line-color":"#FF5B14","line-width":3}},
    {id:"bx",type:"fill-extrusion",source:"b",paint:{"fill-extrusion-color":["case",["==",["get","k"],1],["case",["==",["get","i"],1],"#155C75","#4C7C8F"],"#9FB4BF"],"fill-extrusion-height":["get","h"],"fill-extrusion-base":["get","mh"],"fill-extrusion-opacity":0.88,"fill-extrusion-vertical-gradient":true}},
    {id:"pin",type:"circle",source:"p",paint:{"circle-radius":7,"circle-color":"#FF5B14","circle-stroke-color":"#fff","circle-stroke-width":2}}]}});
  map.addControl(new maplibregl.AttributionControl({compact:true}));
  map.addControl(new maplibregl.NavigationControl({visualizePitch:true}),"top-right");
  map.addControl(new maplibregl.FullscreenControl(),"top-right");
  map.on("load",function(){try{map.setTerrain({source:"dem",exaggeration:1})}catch(e){}if(phone){var at=m.querySelector(".maplibregl-ctrl-attrib");if(at){at.classList.remove("maplibregl-compact-show");at.removeAttribute("open");}}});
  map.on("error",function(e){if(window.console&&e&&e.error&&!/tile|Failed to fetch|AJAXError/i.test(String(e.error.message||"")))console.warn("3D view",e.error.message);});
  var bt=document.createElement("button");bt.type="button";bt.className="k-btn k-btn--sm";bt.textContent=r.dataset.r;bt.addEventListener("click",function(){map.easeTo({center:[lng,lat],zoom:16.2,pitch:58,bearing:-24})});
  var bar=r.querySelector(".ksee-bar");if(bar){var g=r.querySelector(".ksee-go");if(g)g.remove();bar.prepend(bt);}
  var hp=r.querySelector(".ksee-help");if(hp)hp.hidden=false;
 }).catch(err);
};
})();`;

// ------------------------------------------------------------------------------------------------ routes
export const PATHS = /^\/api\/x\/see\//;
const H = { 'content-type': 'application/json; charset=utf-8', 'x-content-type-options': 'nosniff', 'access-control-allow-origin': '*' };
const out = (o, st, cc) => new Response(JSON.stringify(o), { status: st || 200, headers: Object.assign({ 'cache-control': cc || 'no-store' }, H) });
const UA = 'Kolaboro-see-site/1.0 (+https://kolaboro.com/data/; agent@kolaboro.com)';

async function thumb(req, sd, id, n, ctx) {
  const rec = sd.ph && sd.ph.projects && sd.ph.projects[id], x = rec && rec.ph && rec.ph[n];
  if (!x || !/^https:\/\//.test(x.thumb || '')) return new Response('not found', { status: 404, headers: { 'cache-control': 'public, max-age=3600' } });
  const ck = new Request(ORIGIN + '/__see_ph/' + encodeURIComponent(id) + '/' + n + '/' + encodeURIComponent(x.src + ':' + x.id + ':' + x.thumb.slice(-48)));
  try { const hit = await caches.default.match(ck); if (hit) return hit; } catch (e) {}
  let r;
  try { r = await fetch(x.thumb, { headers: { 'user-agent': UA, accept: 'image/jpeg,image/webp,image/png,image/*' }, cf: { cacheTtl: 604800, cacheEverything: true }, redirect: 'follow' }); } catch (e) { r = null; }
  const ct = r && r.headers.get('content-type') || '';
  if (!r || !r.ok || !/^image\/(jpeg|png|webp)/.test(ct)) return new Response('unavailable', { status: 502, headers: { 'cache-control': 'no-store' } });
  const buf = await r.arrayBuffer();
  if (buf.byteLength > 2500000) return new Response('too large', { status: 502, headers: { 'cache-control': 'no-store' } });
  const res = new Response(buf, { status: 200, headers: { 'content-type': ct.split(';')[0], 'cache-control': 'public, max-age=604800', 'x-content-type-options': 'nosniff', 'access-control-allow-origin': '*',
    'x-photo-source': x.page, 'x-photo-licence': x.lic, 'content-security-policy': "default-src 'none'" } });
  try { ctx && ctx.waitUntil && ctx.waitUntil(caches.default.put(ck, res.clone())); } catch (e) {}
  return res;
}

export async function handle(req, u, env, ctx) {
  const p = u.pathname;
  if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: 'method' }, 405);
  try {
    if (p === '/api/x/see/3d.js') return new Response(VIEWER, { status: 200, headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'public, max-age=86400', 'x-content-type-options': 'nosniff' } });
    const sd = await seeData(env);
    let m = p.match(/^\/api\/x\/see\/ph\/([A-Za-z0-9-]{3,20})\/([0-9])\.jpg$/);
    if (m) return thumb(req, sd, m[1].toUpperCase(), +m[2], ctx);
    m = p.match(/^\/api\/x\/see\/3d\/([A-Za-z0-9-]{3,20})\/?$/);
    if (m) {
      const id = m[1].toUpperCase(), r = sd.d3 && sd.d3.projects && sd.d3.projects[id];
      if (!r) return out({ id, error: 'no_pin', note: 'Only projects with a plot-level pin have a 3D view.' }, 404, 'public, max-age=600');
      return out(Object.assign({ id, release: sd.d3.release, updated: sd.d3.updated, radius_m: sd.d3.radius_m, circle_m: sd.d3.circle_m, acc_m: accM(r.dec), unit: sd.d3.unit, source: sd.d3.source }, r), 200, 'public, max-age=3600');
    }
    m = p.match(/^\/api\/x\/see\/([A-Za-z0-9-]{3,20})\/?$/);
    if (m) {
      const id = m[1].toUpperCase(), ph = sd.ph && sd.ph.projects && sd.ph.projects[id], r = sd.d3 && sd.d3.projects && sd.d3.projects[id];
      if (!ph && !r) return out({ id, error: 'no_pin', note: 'Only projects with a plot-level pin are covered.' }, 404, 'public, max-age=600');
      const { data } = await import('./kbx_named.js'); const ix = await data(env).catch(() => null); const x = ix && ix.byId.get(id);
      return out({ id, name: x ? x.n : null, url: x ? ORIGIN + '/projects/' + x.s + '/#ground' : null,
        photos: ph ? { checked: ph.checked, radius_m: sd.ph.radius_m, found: ph.found, newest: ph.newest || null,
          items: (ph.ph || []).map((y, i) => ({ source: SRCN[y.src] || y.src, date: y.date, distance_m: y.d, camera_heading: y.az, licence: y.lic, licence_url: y.lic_url, page: y.page, thumbnail: ORIGIN + '/api/x/see/ph/' + id + '/' + i + '.jpg' })),
          sources: sd.ph.sources, method: '/data/street-photos.json' } : null,
        model3d: r ? { pin: { lat: r.lat, lng: r.lng, decimals: r.dec, accuracy_m: accM(r.dec) }, buildings: r.n, touching_150m_circle: r.n_in, release: sd.d3.release, data: ORIGIN + '/api/x/see/3d/' + id } : null }, 200, 'public, max-age=600');
    }
    return out({ error: 'not_found', see: ['/api/x/see/<ID>', '/api/x/see/3d/<ID>', '/api/x/see/ph/<ID>/<n>.jpg', '/api/x/see/3d.js'] }, 404);
  } catch (e) { return out({ error: 'server' }, 500); }
}
