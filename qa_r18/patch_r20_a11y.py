# -*- coding: utf-8 -*-
"""R20: etiquetas para lector de pantalla en los 20 idiomas (antes, en ingles en todos) y
atribucion del mapa en una linea en moviles."""
import io, re, sys
p = sys.argv[1] + '/index.template.html'
h = io.open(p, encoding='utf-8').read()
K = ['a11y.close', 'a11y.back', 'a11y.lang', 'a11y.theme', 'a11y.filters', 'a11y.map', 'a11y.zin', 'a11y.zout',
     'a11y.center', 'a11y.list', 'a11y.closedet', 'a11y.grab', 'a11y.search', 'a11y.cities', 'a11y.langs']
V = {
 'en': 'Close|Back|Change language|Switch light or dark mode|Filter by type of help|Map of help points near you|Zoom in|Zoom out|Centre on my location|List of help points|Close details|Expand or collapse the list|Search a place|Cities|Language',
 'es': 'Cerrar|Atrás|Cambiar idioma|Cambiar entre modo claro y oscuro|Filtrar por tipo de ayuda|Mapa de puntos de ayuda cerca de ti|Acercar|Alejar|Centrar en mi ubicación|Lista de puntos de ayuda|Cerrar detalles|Desplegar o recoger la lista|Buscar un lugar|Ciudades|Idioma',
 'fr': 'Fermer|Retour|Changer de langue|Basculer entre mode clair et sombre|Filtrer par type d’aide|Carte des points d’aide près de toi|Zoomer|Dézoomer|Centrer sur ma position|Liste des points d’aide|Fermer les détails|Déplier ou replier la liste|Chercher un lieu|Villes|Langue',
 'ar': 'إغلاق|رجوع|تغيير اللغة|التبديل بين الوضع الفاتح والداكن|تصفية حسب نوع المساعدة|خريطة نقاط المساعدة القريبة منك|تكبير|تصغير|التوسيط على موقعي|قائمة نقاط المساعدة|إغلاق التفاصيل|توسيع القائمة أو طيّها|ابحث عن مكان|المدن|اللغة',
 'uk': 'Закрити|Назад|Змінити мову|Перемкнути світлий або темний режим|Фільтр за видом допомоги|Карта пунктів допомоги поруч із тобою|Наблизити|Віддалити|Центрувати на моєму місцезнаходженні|Список пунктів допомоги|Закрити деталі|Розгорнути або згорнути список|Шукати місце|Міста|Мова',
 'ro': 'Închide|Înapoi|Schimbă limba|Comută între modul luminos și întunecat|Filtrează după tipul de ajutor|Harta punctelor de ajutor de lângă tine|Mărește|Micșorează|Centrează pe locația mea|Lista punctelor de ajutor|Închide detaliile|Extinde sau restrânge lista|Caută un loc|Orașe|Limbă',
 'pl': 'Zamknij|Wstecz|Zmień język|Przełącz tryb jasny lub ciemny|Filtruj według rodzaju pomocy|Mapa punktów pomocy w pobliżu|Przybliż|Oddal|Wyśrodkuj na mojej pozycji|Lista punktów pomocy|Zamknij szczegóły|Rozwiń lub zwiń listę|Szukaj miejsca|Miasta|Język',
 'ru': 'Закрыть|Назад|Сменить язык|Переключить светлую или тёмную тему|Фильтр по виду помощи|Карта пунктов помощи рядом с тобой|Приблизить|Отдалить|Центрировать на моём местоположении|Список пунктов помощи|Закрыть подробности|Развернуть или свернуть список|Искать место|Города|Язык',
 'pt': 'Fechar|Voltar|Mudar de língua|Alternar entre modo claro e escuro|Filtrar por tipo de ajuda|Mapa de pontos de ajuda perto de ti|Aproximar|Afastar|Centrar na minha localização|Lista de pontos de ajuda|Fechar detalhes|Expandir ou recolher a lista|Procurar um lugar|Cidades|Língua',
 'ur': 'بند کریں|واپس|زبان بدلیں|روشن یا تاریک موڈ بدلیں|مدد کی قسم کے مطابق فلٹر کریں|آپ کے قریب مدد کے مقامات کا نقشہ|قریب کریں|دور کریں|میری لوکیشن پر مرکز کریں|مدد کے مقامات کی فہرست|تفصیلات بند کریں|فہرست کھولیں یا بند کریں|کوئی جگہ تلاش کریں|شہر|زبان',
 'fa': 'بستن|بازگشت|تغییر زبان|تغییر حالت روشن یا تیره|فیلتر بر اساس نوع کمک|نقشهٔ نقاط کمک نزدیک تو|بزرگ‌نمایی|کوچک‌نمایی|مرکز روی موقعیت من|فهرست نقاط کمک|بستن جزئیات|باز یا بسته کردن فهرست|جست‌وجوی یک مکان|شهرها|زبان',
 'wo': 'Tëj|Dellu|Soppi làkk|Soppi leer walla lëndëm|Tànn ci xeetu ndimbal|Kaartu bérabi ndimbal yi ci sa wet|Jegeñal|Sorewal|Dekkal ci fi ma nekk|Limu bérabi ndimbal yi|Tëj leeral yi|Ubbi walla tëj lim bi|Seet ab bérab|Dëkk yi|Làkk',
 'bm': 'A datugu|Segin|Kan yɛlɛma|Yeelen walima dibi yɛlɛma|Ka sugandi dɛmɛ suguya la|Dɛmɛ yɔrɔw karti i kɛrɛfɛ|Ka gɛrɛ|Ka yɔrɔja|Ka n ka yɔrɔ bila cɛmancɛ la|Dɛmɛ yɔrɔw lisi|Kunnafoniw datugu|Lisi dayɛlɛ walima a datugu|Yɔrɔ ɲini|Duguw|Kan',
 'ti': 'ዕጸው|ተመለስ|ቋንቋ ቀይር|ብሩህ ወይ ጸልማት ኣቀማምጣ ቀይር|ብዓይነት ሓገዝ ኣጻሪ|ኣብ ጥቓኻ ዘለዉ ቦታታት ሓገዝ ካርታ|ኣቕርብ|ኣርሕቕ|ኣብ ቦታይ ኣማእክል|ዝርዝር ቦታታት ሓገዝ|ዝርዝራት ዕጸው|ዝርዝር ዘርግሕ ወይ ዕጸፍ|ቦታ ድለ|ከተማታት|ቋንቋ',
 'ps': 'بندول|شاته|ژبه بدلول|روښانه یا تیاره حالت بدلول|د مرستې د ډول له مخې چاڼ|ستا تر څنګ د مرستې د ځایونو نقشه|نږدې کول|لرې کول|زما په ځای مرکز کول|د مرستې د ځایونو لېست|جزییات بندول|لېست پرانیستل یا ټولول|یو ځای ولټوه|ښارونه|ژبه',
 'so': 'Xir|Dib u noqo|Beddel luqadda|Beddel habka iftiinka ama mugdiga|Ku shaandhee nooca caawimaadda|Khariidadda goobaha caawimaadda ee kuu dhow|Soo dhawee|Fogee|Xarunta dhig goobtayda|Liiska goobaha caawimaadda|Xir faahfaahinta|Fidi ama laab liiska|Raadi meel|Magaalooyin|Luqad',
 'am': 'ዝጋ|ተመለስ|ቋንቋ ቀይር|ብሩህ ወይም ጨለማ ገጽታ ቀይር|በእርዳታ ዓይነት አጣራ|በአቅራቢያህ ያሉ የእርዳታ ቦታዎች ካርታ|አቅርብ|አርቅ|በእኔ ቦታ ላይ አተኩር|የእርዳታ ቦታዎች ዝርዝር|ዝርዝሩን ዝጋ|ዝርዝሩን ዘርጋ ወይም ሰብስብ|ቦታ ፈልግ|ከተሞች|ቋንቋ',
 'tr': 'Kapat|Geri|Dili değiştir|Açık veya koyu moda geç|Yardım türüne göre filtrele|Yakınındaki yardım noktalarının haritası|Yakınlaştır|Uzaklaştır|Konumuma ortala|Yardım noktalarının listesi|Ayrıntıları kapat|Listeyi aç veya kapat|Bir yer ara|Şehirler|Dil',
 'bn': 'বন্ধ করো|ফিরে যাও|ভাষা বদলাও|আলো বা অন্ধকার মোড বদলাও|সাহায্যের ধরন দিয়ে ছাঁকো|তোমার কাছের সাহায্যের জায়গার ম্যাপ|বড় করো|ছোট করো|আমার অবস্থানে কেন্দ্র করো|সাহায্যের জায়গার তালিকা|বিস্তারিত বন্ধ করো|তালিকা খোলো বা গোটাও|একটা জায়গা খোঁজো|শহর|ভাষা',
 'zh': '关闭|返回|切换语言|切换浅色或深色模式|按帮助类型筛选|你附近的帮助地点地图|放大|缩小|以我的位置为中心|帮助地点列表|关闭详情|展开或收起列表|搜索地点|城市|语言',
}
assert 'a11y.close' not in h, 'ya aplicado'
for code, vals in V.items():
    vs = vals.split('|')
    assert len(vs) == len(K), code
    m = re.search(r'^T\.%s = \{$' % code, h, re.M)
    assert m, code
    line = '\n  ' + ','.join('"%s":"%s"' % (k, v.replace('"', '\\"')) for k, v in zip(K, vs)) + ','
    h = h[:m.end()] + line + h[m.end():]
old = "  const hb=$('#homeBtn'); if(hb) hb.setAttribute('aria-label', t('menu.home'));\n"
assert h.count(old) == 1
h = h.replace(old, old + """  // R20: el resto de etiquetas para lector de pantalla tambien en el idioma elegido
  [['#qBack','a11y.back'],['#langBtn','a11y.lang'],['#themeBtn','a11y.theme'],['#filters','a11y.filters'],['#map','a11y.map'],
   ['#zin','a11y.zin'],['#zout','a11y.zout'],['#locate','a11y.center'],['#panel','a11y.list'],['#dClose','a11y.closedet'],
   ['.modal-x','a11y.close'],['#welLangs','a11y.langs'],['.wel-cities','a11y.cities'],['#q','a11y.search'],['#micBtn','ui.mic'],
   ['#geoBtn','wel.loc'],['#grab','a11y.grab']].forEach(([s,k])=>$$(s).forEach(el=>{ el.setAttribute('aria-label', t(k)); if(el.title) el.title=t(k); }));
""")
old = "  map = L.map('map',{zoomControl:false,attributionControl:true,worldCopyJump:true})\n        .setView([20,0],2);\n"
assert h.count(old) == 1
h = h.replace(old, old + "  // R20: en movil la atribucion ocupaba dos lineas encima de los iconos; Leaflet no pide la suya\n  if(innerWidth<560) map.attributionControl.setPrefix(false);\n")
io.open(p, 'w', encoding='utf-8').write(h)
print('ok')
