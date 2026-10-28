# -*- coding: utf-8 -*-
"""Ronda 20 (28-oct-2026): textos de privacidad veraces (GA4 + Clarity sin cookies) y
tiendas solidarias fuera del mapa, en los 20 idiomas.

    python3 patch_r20_text.py <dir con index.template.html, i18n_pages.py, about_page.py, build.py, social.py>
"""
import io, os, re, sys

D = sys.argv[1]
P = lambda f: os.path.join(D, f)

# ---------------------------------------------------------------- app (index.template.html)
NOADS = {  # «sin rastreo» -> «sin anuncios»: pares (viejo, nuevo) dentro del bloque de cada idioma
 'en': [('No tracking', 'No ads'), ('no tracking', 'no ads')],
 'es': [('Sin rastreo', 'Sin anuncios'), ('sin rastreo', 'sin anuncios')],
 'fr': [('Sans pistage', 'Sans pub'), ('sans traçage', 'sans pub'), ('ni traçage', 'ni pub')],
 'ar': [('بلا تتبع', 'بلا إعلانات'), ('بدون تتبّع', 'بدون إعلانات'), ('وبلا تتبّع', 'وبلا إعلانات')],
 'uk': [('Без стеження', 'Без реклами'), ('без стеження', 'без реклами')],
 'ro': [('Fără urmărire', 'Fără reclame'), ('fără urmărire', 'fără reclame')],
 'pl': [('Bez śledzenia', 'Bez reklam'), ('bez śledzenia', 'bez reklam')],
 'ru': [('Без слежки', 'Без рекламы'), ('без слежки', 'без рекламы')],
 'pt': [('Sem rastreio', 'Sem anúncios'), ('sem rastreio', 'sem anúncios')],
 'ur': [('بغیر ٹریکنگ', 'بغیر اشتہارات'), ('نہ ٹریکنگ', 'نہ اشتہارات')],
 'fa': [('بدون ردیابی', 'بدون تبلیغات')],
 'wo': [('Kenn du la topp', 'Amul pub'), ('kenn du la topp', 'amul pub')],
 'bm': [('Nɔminɛ tɛ', 'Piblisite tɛ'), ('nɔminɛ tɛ', 'piblisite tɛ')],
 'ti': [('ምክትታል የለን', 'መወዓውዒ የለን')],
 'ps': [('تعقیب نشته', 'اعلانونه نشته'), ('نه تعقیب', 'نه اعلانونه'), ('بې تعقیبه', 'بې اعلانونو')],
 'so': [("Raadraac la'aan", "Xayeysiis la'aan"), ("raadraac la'aan", "xayeysiis la'aan")],
 'am': [('ክትትል የለም', 'ማስታወቂያ የለም'), ('ያለ ክትትል', 'ያለ ማስታወቂያ')],
 'tr': [('Takip yok', 'Reklam yok'), ('takip yok', 'reklam yok'), ('takipsiz', 'reklamsız')],
 'bn': [('নজরদারি নেই', 'বিজ্ঞাপন নেই'), ('নজরদারি ছাড়া', 'বিজ্ঞাপন ছাড়া')],
 'zh': [('不追踪', '没有广告')],
}
KEYS_NOADS = ['wel.trust', 'hero.m2', 'foot.tag', 'share.text']

NOPERS = {  # orgs.b3p: «sin recogida de datos» -> «sin datos personales»
 'en': ('no data collection', 'no personal data'), 'es': ('sin recogida de datos', 'sin datos personales'),
 'fr': ('sans collecte de données', 'sans données personnelles'), 'ar': ('وبلا جمع بيانات', 'وبلا بيانات شخصية'),
 'uk': ('без збору даних', 'без персональних даних'), 'ro': ('fără colectare de date', 'fără date personale'),
 'pl': ('bez zbierania danych', 'bez danych osobowych'), 'ru': ('без сбора данных', 'без персональных данных'),
 'pt': ('sem recolha de dados', 'sem dados pessoais'), 'ur': ('نہ ڈیٹا جمع کرنا', 'نہ ذاتی ڈیٹا'),
 'fa': ('بدون جمع‌آوری داده', 'بدون داده‌های شخصی'), 'wo': ('amul dajale xibaar', 'amul dajale sa xibaar'),
 'bm': ('kunnafoni tali tɛ', 'i yɛrɛ ka kunnafoni tali tɛ'), 'ti': ('ምእካብ ሓበሬታ የለን', 'ምእካብ ውልቃዊ ሓበሬታ የለን'),
 'ps': ('نه د معلوماتو راټولول', 'نه د شخصي معلوماتو راټولول'), 'so': ("ururin xog la'aan", "ururin xog shakhsi ah la'aan"),
 'am': ('መረጃ መሰብሰብ የለም', 'የግል መረጃ መሰብሰብ የለም'), 'tr': ('veri toplama yok', 'kişisel veri toplama yok'),
 'bn': ('তথ্য সংগ্রহ নেই', 'ব্যক্তিগত তথ্য সংগ্রহ নেই'), 'zh': ('不收集数据', '不收集个人数据'),
}

CLOTHES_D = {
 'en': 'Clothing banks and points that give clothes for free.', 'es': 'Roperos solidarios y puntos de ropa gratuita.',
 'fr': 'Vestiaires solidaires et points de vêtements gratuits.', 'ar': 'بنوك ملابس ونقاط ملابس مجانية.',
 'uk': 'Банки одягу та пункти безкоштовного одягу.', 'ro': 'Bănci de haine și puncte cu haine gratuite.',
 'pl': 'Banki odzieży i punkty z darmowymi ubraniami.', 'ru': 'Банки одежды и пункты бесплатной одежды.',
 'pt': 'Bancos de roupa e pontos de roupa grátis.', 'ur': 'کپڑوں کے بینک اور مفت کپڑوں کے مقامات۔',
 'fa': 'بانک‌های لباس و نقاط توزیع لباس رایگان.', 'wo': 'Banku yére ak fu ñuy joxe yére te amul fay.',
 'bm': 'Fini bankiw ani fini fu yɔrɔw.', 'ti': 'ባንኪ ክዳውንቲን ነጻ ክዳውንቲ ዝዕደለሉ ነጥብታትን።',
 'ps': 'د کالیو بانکونه او د وړیا کالیو ځایونه.', 'so': 'Bangiyada dharka iyo goobaha dharka bilaashka ah.',
 'am': 'የልብስ ባንኮችና ነፃ ልብስ መስጫ ቦታዎች።', 'tr': 'Kıyafet bankaları ve ücretsiz kıyafet noktaları.',
 'bn': 'কাপড়ের ব্যাংক আর বিনা পয়সার কাপড়ের জায়গা।', 'zh': '衣物银行和免费衣物发放点。',
}

LI2 = {  # priv.2: el segundo <li> (lo que medimos)
 'en': '<li><b>No cookies, no ads.</b> To see what works and fix what fails, we measure visits anonymously and without cookies: our own counter (a visit, the language, the city and what was searched without finding it), Google Analytics (pages visited, country, type of device) and Microsoft Clarity (taps and scrolling, with all the text on screen hidden). None of them gets your name, an account or your position, and none of them loads if your browser asks not to be tracked.</li>',
 'es': '<li><b>Sin cookies ni anuncios.</b> Para saber qué funciona y arreglar lo que falla, medimos las visitas de forma anónima y sin cookies: nuestro propio contador (una visita, el idioma, la ciudad y lo que se buscó sin encontrarlo), Google Analytics (páginas vistas, país, tipo de aparato) y Microsoft Clarity (toques y desplazamientos, con todo el texto de la pantalla oculto). Ninguno recibe tu nombre, una cuenta ni tu posición, y ninguno se carga si tu navegador pide no ser rastreado.</li>',
 'fr': '<li><b>Ni cookies ni pub.</b> Pour savoir ce qui marche et corriger ce qui ne va pas, nous mesurons les visites de façon anonyme et sans cookies : notre propre compteur (une visite, la langue, la ville et ce qui a été cherché sans être trouvé), Google Analytics (pages vues, pays, type d’appareil) et Microsoft Clarity (appuis et défilement, avec tout le texte de l’écran masqué). Aucun ne reçoit ton nom, un compte ou ta position, et aucun ne se charge si ton navigateur demande à ne pas être suivi.</li>',
 'ar': '<li><b>لا كوكيز ولا إعلانات.</b> لنعرف ما ينجح ونصلح ما يتعطّل، نقيس الزيارات بشكل مجهول ودون كوكيز: عدّادنا الخاص (زيارة، واللغة، والمدينة، وما بُحث عنه ولم يُوجد)، و Google Analytics (الصفحات المزارة، والبلد، ونوع الجهاز)، و Microsoft Clarity (اللمسات والتمرير، مع إخفاء كل النصوص على الشاشة). لا يصل إلى أيٍّ منها اسمك ولا حساب ولا موقعك، ولا يُحمَّل أيٌّ منها إن طلب متصفحك عدم التتبّع.</li>',
 'uk': '<li><b>Без cookies і без реклами.</b> Щоб знати, що працює, і виправляти те, що ламається, ми анонімно й без cookies рахуємо відвідування: наш власний лічильник (відвідування, мова, місто і те, що шукали й не знайшли), Google Analytics (переглянуті сторінки, країна, тип пристрою) і Microsoft Clarity (дотики й прокручування, весь текст на екрані приховано). Жоден із них не отримує твого імені, акаунта чи місцезнаходження, і жоден не завантажується, якщо твій браузер просить не стежити.</li>',
 'ro': '<li><b>Fără cookie-uri, fără reclame.</b> Ca să știm ce merge și să reparăm ce nu merge, numărăm vizitele anonim și fără cookie-uri: propriul nostru contor (o vizită, limba, orașul și ce s-a căutat fără să se găsească), Google Analytics (pagini vizitate, țara, tipul de dispozitiv) și Microsoft Clarity (atingeri și derulare, cu tot textul de pe ecran ascuns). Niciunul nu primește numele tău, un cont sau poziția ta și niciunul nu se încarcă dacă browserul tău cere să nu fii urmărit.</li>',
 'pl': '<li><b>Bez ciasteczek i bez reklam.</b> Żeby wiedzieć, co działa, i naprawiać to, co nie działa, liczymy odwiedziny anonimowo i bez ciasteczek: nasz własny licznik (odwiedziny, język, miasto i to, czego szukano, a nie znaleziono), Google Analytics (odwiedzone strony, kraj, rodzaj urządzenia) i Microsoft Clarity (dotknięcia i przewijanie, z ukrytym całym tekstem na ekranie). Żadne z nich nie dostaje twojego imienia, konta ani twojej pozycji i żadne się nie wczytuje, jeśli twoja przeglądarka prosi, by jej nie śledzić.</li>',
 'ru': '<li><b>Без cookie и без рекламы.</b> Чтобы понимать, что работает, и чинить то, что ломается, мы анонимно и без cookie считаем посещения: наш собственный счётчик (посещение, язык, город и то, что искали и не нашли), Google Analytics (просмотренные страницы, страна, тип устройства) и Microsoft Clarity (касания и прокрутка, весь текст на экране скрыт). Ни один из них не получает твоего имени, аккаунта или местоположения, и ни один не загружается, если твой браузер просит не отслеживать.</li>',
 'pt': '<li><b>Sem cookies nem anúncios.</b> Para saber o que funciona e corrigir o que falha, medimos as visitas de forma anónima e sem cookies: o nosso próprio contador (uma visita, a língua, a cidade e o que se procurou sem encontrar), o Google Analytics (páginas vistas, país, tipo de aparelho) e o Microsoft Clarity (toques e deslocamentos, com todo o texto do ecrã escondido). Nenhum recebe o teu nome, uma conta ou a tua posição, e nenhum é carregado se o teu navegador pedir para não ser rastreado.</li>',
 'ur': '<li><b>نہ کوکیز، نہ اشتہارات۔</b> یہ جاننے کے لیے کہ کیا ٹھیک چلتا ہے اور جو خراب ہو اسے ٹھیک کرنے کے لیے، ہم بغیر کوکیز کے گمنام طریقے سے وزٹ گنتے ہیں: ہمارا اپنا کاؤنٹر (ایک وزٹ، زبان، شہر اور وہ جو ڈھونڈا گیا مگر ملا نہیں)، Google Analytics (دیکھے گئے صفحات، ملک، ڈیوائس کی قسم) اور Microsoft Clarity (ٹیپ اور اسکرول، اسکرین کا سارا متن چھپا ہوا)۔ ان میں سے کسی کو آپ کا نام، اکاؤنٹ یا آپ کی لوکیشن نہیں ملتی، اور اگر آپ کا براؤزر ٹریک نہ کرنے کا کہے تو ان میں سے کوئی لوڈ نہیں ہوتا۔</li>',
 'fa': '<li><b>بدون کوکی، بدون تبلیغات.</b> برای اینکه بدانیم چه چیزی کار می‌کند و آنچه خراب است را درست کنیم، بازدیدها را به‌صورت ناشناس و بدون کوکی می‌شماریم: شمارندهٔ خودمان (یک بازدید، زبان، شهر و آنچه جست‌وجو شد و پیدا نشد)، Google Analytics (صفحه‌های دیده‌شده، کشور، نوع دستگاه) و Microsoft Clarity (لمس‌ها و پیمایش، با پنهان بودن همهٔ متن صفحه). هیچ‌کدام نام تو، حساب کاربری یا موقعیتت را دریافت نمی‌کنند و اگر مرورگرت بخواهد ردیابی نشود، هیچ‌کدام بارگذاری نمی‌شوند.</li>',
 'wo': '<li><b>Amul cookies, amul pub.</b> Ngir xam lu dox ak defar lu yàqu, danuy waññ ñi ñëw te xamunu kan, te amul cookies: sunu waññukaay (ab ñëw, làkk wi, dëkk bi ak li ñu seet te gisuñu ko), Google Analytics (xët yi ñu xool, réew mi, xeetu jumtukaay bi) ak Microsoft Clarity (fu ñu bës ak fu ñu yëngal, te mbind mi ci ekraan bi lépp nëbbu na). Kenn ci ñoom du am sa tur, kont walla fi nga nekk, te kenn ci ñoom du yeb su sa navigateur laajee ñu bañ laa topp.</li>',
 'bm': '<li><b>Cookies tɛ, piblisite tɛ.</b> Walasa an k’a dɔn min bɛ taa ani k’a labɛn min tiɲɛna, an bɛ taamaw jate tɔgɔ kɔfɔbali la, cookies tɛ: an yɛrɛ ka jateminɛlan (taama kelen, kan, dugu ani min ɲininna k’a sɔrɔ a ma sɔrɔ), Google Analytics (ɲɛ minnu filɛla, jamana, minɛn suguya) ani Microsoft Clarity (digili ni yɛrɛyɛrɛli, ekaran kan sɛbɛn bɛɛ dogolen don). U si tɛ i tɔgɔ, kɔnti walima i ka yɔrɔ sɔrɔ, ani u si tɛ wuli ni i ka navigateur ye a ɲini ko i kana nɔminɛ.</li>',
 'ti': '<li><b>cookies የለን፣ መወዓውዒ የለን።</b> እንታይ ከም ዝሰርሕ ንምፍላጥን ዝተበላሸወ ንምእራምን፣ ምብጻሓት ብዘይ ስምን ብዘይ cookiesን ንቖጽር፦ ናይ ባዕልና ቖጸሪ (ሓደ ምብጻሕ፣ ቋንቋ፣ ከተማን እቲ ተደልዩ ዘይተረኽበን)፣ Google Analytics (ዝተራእዩ ገጻት፣ ሃገር፣ ዓይነት መሳርሒ)ን Microsoft Clarity (ምጥዋቕን ምንቅስቓስን፣ ኩሉ ጽሑፍ ናይ ስክሪን ተሓቢኡ)ን። ሓደ ካብኣቶም እውን ስምካ፣ ኣካውንት ወይ ቦታኻ ኣይበጽሖን፣ መርበብካ ከይከታተሉኻ እንተ ሓቲቱ ድማ ሓደ ካብኣቶም ኣይጽዓንን።</li>',
 'ps': '<li><b>نه کوکیز، نه اعلانونه.</b> د دې لپاره چې پوه شو څه کار کوي او څه چې خراب دي سم یې کړو، موږ لیدنې بې نومه او بې کوکیزو شمېرو: زموږ خپل شمېرونکی (یوه لیدنه، ژبه، ښار او هغه څه چې ولټول شول خو ونه موندل شول)، Google Analytics (لیدل شوې پاڼې، هېواد، د وسیلې ډول) او Microsoft Clarity (ټکونه او سکرول، د سکرین ټول متن پټ). هېڅ یو یې ستا نوم، حساب یا ستا ځای نه ترلاسه کوي، او که ستا براوزر وغواړي چې تعقیب نه شي، هېڅ یو یې نه پورته کېږي.</li>',
 'so': '<li><b>Cookies la’aan, xayeysiis la’aan.</b> Si aan u ogaanno waxa shaqeeya oo aan u hagaajinno waxa xumaada, booqashooyinka waxaan u tirinnaa si qarsoodi ah oo cookies la’aan ah: tiriyahayaga gaarka ah (booqasho, luqadda, magaalada iyo wixii la raadiyey ee aan la helin), Google Analytics (bogagga la eegay, dalka, nooca qalabka) iyo Microsoft Clarity (taabashada iyo dhaqaajinta, iyadoo qoraalka shaashadda oo dhan la qariyey). Midkoodna ma helo magacaaga, akoon ama goobtaada, midkoodna lama soo raro haddii browser-kaagu codsado in aan lagu raadraacin.</li>',
 'am': '<li><b>ኩኪ የለም፣ ማስታወቂያ የለም።</b> ምን እንደሚሰራ ለማወቅና የተበላሸውን ለማስተካከል፣ ጉብኝቶችን ስም ሳይጠቀስና ያለ ኩኪ እንቆጥራለን፦ የራሳችን ቆጣሪ (አንድ ጉብኝት፣ ቋንቋ፣ ከተማና ተፈልጎ ያልተገኘው)፣ Google Analytics (የታዩ ገጾች፣ አገር፣ የመሣሪያ ዓይነት) እና Microsoft Clarity (መንካትና ማሸብለል፣ በስክሪኑ ላይ ያለው ጽሑፍ ሁሉ ተደብቆ)። አንዳቸውም ስምህን፣ መለያ ወይም ያለህበትን ቦታ አያገኙም፤ አሳሽህ እንዳይከታተሉህ ከጠየቀም አንዳቸውም አይጫኑም።</li>',
 'tr': '<li><b>Çerez yok, reklam yok.</b> Neyin işe yaradığını görmek ve bozulanı düzeltmek için ziyaretleri anonim ve çerezsiz sayıyoruz: kendi sayacımız (bir ziyaret, dil, şehir ve arandığı hâlde bulunamayan şey), Google Analytics (görüntülenen sayfalar, ülke, cihaz türü) ve Microsoft Clarity (dokunmalar ve kaydırma; ekrandaki tüm yazılar gizli). Hiçbiri adını, bir hesabı ya da konumunu almaz ve tarayıcın takip edilmemeyi isterse hiçbiri yüklenmez.</li>',
 'bn': '<li><b>কুকি নেই, বিজ্ঞাপন নেই।</b> কী কাজ করছে জানতে আর যা খারাপ হচ্ছে তা ঠিক করতে, আমরা নাম ছাড়া আর কুকি ছাড়া ভিজিট গুনি: আমাদের নিজের কাউন্টার (একটা ভিজিট, ভাষা, শহর আর যা খোঁজা হয়েছিল কিন্তু পাওয়া যায়নি), Google Analytics (দেখা পাতা, দেশ, যন্ত্রের ধরন) আর Microsoft Clarity (ট্যাপ আর স্ক্রল, পর্দার সব লেখা লুকানো)। এদের কেউই তোমার নাম, অ্যাকাউন্ট বা তোমার অবস্থান পায় না, আর তোমার ব্রাউজার নজরদারি না করতে বললে এদের কোনোটাই চালু হয় না।</li>',
 'zh': '<li><b>没有 Cookie，没有广告。</b>为了知道哪些功能好用、修好出问题的地方，我们以匿名、不用 Cookie 的方式统计访问：我们自己的计数器（一次访问、语言、城市，以及搜了却没找到的内容）、Google Analytics（看过的页面、国家、设备类型）和 Microsoft Clarity（点按和滚动，屏幕上的所有文字都被隐藏）。它们都拿不到你的名字、账号或你的位置；如果你的浏览器要求不被追踪，它们都不会加载。</li>',
}


def blocks(h):
    # cada idioma: desde su «T.xx = {» hasta el siguiente (el ingles tiene claves
    # sueltas despues de cerrar su bloque, antes de T.es)
    ms = list(re.finditer(r'^T\.(\w+) = \{$', h, re.M))
    out = {}
    for i, m in enumerate(ms):
        end = ms[i + 1].start() if i + 1 < len(ms) else h.index('\n};', m.end())
        out[m.group(1)] = (m.end(), end)
    return out


def edit_value(seg, key, fn):
    """Aplica fn(valor_sin_escapar) -> nuevo al valor de key dentro de seg."""
    pat = re.compile(r'''(['"])%s\1(\s*:\s*)(['"])((?:\\.|(?!\3).)*)\3''' % re.escape(key), re.S)
    m = pat.search(seg)
    if not m:
        raise SystemExit('sin clave %s' % key)
    q = m.group(3)
    raw = m.group(4)
    val = raw.replace('\\' + q, q)
    new = fn(val)
    if new == val:
        return seg, False
    enc = new.replace('\\', '\\\\') if False else new
    enc = enc.replace(q, '\\' + q)
    return seg[:m.start(4)] + enc + seg[m.end(4):], True


h = io.open(P('index.template.html'), encoding='utf-8').read()
log = []
for code in sorted(blocks(h), key=lambda c: -blocks(h)[c][0]):     # de atras adelante: los indices no se mueven
    a, b = blocks(h)[code]
    seg = h[a:b]
    for k in KEYS_NOADS:
        def f(v, code=code):
            for o, n in NOADS[code]:
                v = v.replace(o, n)
            return v
        seg, ch = edit_value(seg, k, f)
        if not ch:
            log.append('SIN CAMBIO %s %s' % (code, k))
    o, n = NOPERS[code]
    seg, ch = edit_value(seg, 'orgs.b3p', lambda v: v.replace(o, n))
    if not ch: log.append('SIN CAMBIO %s orgs.b3p' % code)
    seg, ch = edit_value(seg, 'cat.clothes.d', lambda v: CLOTHES_D[code])
    def li2(v, code=code):
        lis = list(re.finditer(r'<li>.*?</li>', v, re.S))
        assert len(lis) >= 2, code
        x = lis[1]
        return v[:x.start()] + LI2[code] + v[x.end():]
    seg, ch = edit_value(seg, 'priv.2', li2)
    if not ch: log.append('SIN CAMBIO %s priv.2' % code)
    h = h[:a] + seg + h[b:]
# el texto visible por defecto (en ingles) del cartel de bienvenida
h = h.replace('data-i18n="wel.trust">No account · No cost · No tracking · Works offline', 'data-i18n="wel.trust">No account · No cost · No ads · Works offline')
# cliente: una tienda solidaria no es ropa gratis, ni en lo que llega en directo de Overpass
old = "  if(sf==='clothing_bank') return 'clothes';\n"
assert h.count(old) == 1
h = h.replace(old, old + "  // una tienda solidaria vende (barato, pero vende): no es ayuda gratis (R20, Carlos 28-oct)\n  if(sh==='charity' && !sf) return null;\n")
h = h.replace("    +'nwr[\"shop\"=\"charity\"]'+a+';'\n", '')
io.open(P('index.template.html'), 'w', encoding='utf-8').write(h)
print('\n'.join(log) or 'app: todo cambiado')

# ---------------------------------------------------------------- paginas de informacion (i18n_pages.py)
T50 = {'en': ('No account, no tracking,', 'No account, no ads,'), 'es': ('No pide cuenta, no rastrea y', 'No pide cuenta, no tiene anuncios y'),
       'fr': ('Sans compte, sans tra&ccedil;age,', 'Sans compte, sans pub,'), 'pt': ('Sem conta, sem rastreio,', 'Sem conta, sem an&uacute;ncios,'),
       'ar': ('بلا حساب، وبلا تتبّع،', 'بلا حساب، وبلا إعلانات،'), 'uk': ('Без акаунта, без стеження,', 'Без акаунта, без реклами,'),
       'ru': ('Без аккаунта, без слежки,', 'Без аккаунта, без рекламы,'), 'pl': ('Bez konta, bez śledzenia,', 'Bez konta, bez reklam,'),
       'ro': ('F&#259;r&#259; cont, f&#259;r&#259; urm&#259;rire,', 'F&#259;r&#259; cont, f&#259;r&#259; reclame,'),
       'fa': ('بدون حساب، بدون ردیابی،', 'بدون حساب، بدون تبلیغات،'), 'ur': ('نہ اکاؤنٹ، نہ نگرانی،', 'نہ اکاؤنٹ، نہ اشتہارات،'),
       'ti': ('ኣካውንት የለን፣ ምክትታል የለን፣', 'ኣካውንት የለን፣ መወዓውዒ የለን፣'), 'ps': ('حساب نشته، تعقیب نشته،', 'حساب نشته، اعلانونه نشته،'),
       'so': ("Akoon la'aan, raadraac la'aan,", "Akoon la'aan, xayeysiis la'aan,"), 'am': ('መለያ የለም፣ ክትትል የለም፣', 'መለያ የለም፣ ማስታወቂያ የለም፣'),
       'tr': ('Hesap yok, takip yok', 'Hesap yok, reklam yok'), 'bn': ('অ্যাকাউন্ট নেই, নজরদারি নেই,', 'অ্যাকাউন্ট নেই, বিজ্ঞাপন নেই,'),
       'zh': ('无需账号，不追踪，', '无需账号，没有广告，'), 'wo': ('Amul kont, kenn du la topp,', 'Amul kont, amul pub,'),
       'bm': ('Kɔnti tɛ, nɔminɛ tɛ,', 'Kɔnti tɛ, piblisite tɛ,')}
V4 = {
 'en': 'The site uses no external fonts, no advertising and no cookies. To count visits it loads Google Analytics and Microsoft Clarity, without cookies, and only if your browser does not ask not to be tracked. The map images and live data come from public map services (Esri, OpenStreetMap, Open-Meteo).',
 'es': 'La web no usa tipografías de fuera, ni publicidad, ni cookies. Para contar visitas carga Google Analytics y Microsoft Clarity, sin cookies, y solo si tu navegador no pide que no te rastreen. Las imágenes del mapa y los datos en directo vienen de servicios públicos de mapas (Esri, OpenStreetMap, Open-Meteo).',
 'fr': 'Le site n’utilise ni polices externes, ni publicité, ni cookies. Pour compter les visites, il charge Google Analytics et Microsoft Clarity, sans cookies, et seulement si ton navigateur ne demande pas à ne pas être suivi. Les images de la carte et les données en direct viennent de services cartographiques publics (Esri, OpenStreetMap, Open-Meteo).',
 'pt': 'O site não usa tipos de letra externos, nem publicidade, nem cookies. Para contar visitas carrega o Google Analytics e o Microsoft Clarity, sem cookies, e só se o teu navegador não pedir para não ser rastreado. As imagens do mapa e os dados em direto vêm de serviços públicos de mapas (Esri, OpenStreetMap, Open-Meteo).',
 'ar': 'لا يستخدم الموقع خطوطاً خارجية ولا إعلانات ولا كوكيز. ولعدّ الزيارات يحمّل Google Analytics و Microsoft Clarity دون كوكيز، وفقط إن لم يطلب متصفحك عدم التتبّع. صور الخريطة والبيانات المباشرة تأتي من خدمات خرائط عامة (Esri وOpenStreetMap وOpen-Meteo).',
 'uk': 'Сайт не використовує зовнішніх шрифтів, реклами чи cookies. Щоб рахувати відвідування, він завантажує Google Analytics і Microsoft Clarity без cookies — і лише якщо твій браузер не просить не стежити. Зображення карти та живі дані надходять від публічних картографічних сервісів (Esri, OpenStreetMap, Open-Meteo).',
 'ru': 'Сайт не использует внешних шрифтов, рекламы и cookie. Чтобы считать посещения, он загружает Google Analytics и Microsoft Clarity без cookie — и только если твой браузер не просит не отслеживать. Изображения карты и данные в реальном времени приходят от публичных картографических сервисов (Esri, OpenStreetMap, Open-Meteo).',
 'pl': 'Strona nie używa zewnętrznych czcionek, reklam ani ciasteczek. Żeby liczyć odwiedziny, wczytuje Google Analytics i Microsoft Clarity, bez ciasteczek, i tylko jeśli twoja przeglądarka nie prosi, by jej nie śledzić. Obrazy mapy i dane na żywo pochodzą z publicznych serwisów mapowych (Esri, OpenStreetMap, Open-Meteo).',
 'ro': 'Site-ul nu folosește fonturi externe, reclame sau cookie-uri. Ca să numere vizitele, încarcă Google Analytics și Microsoft Clarity, fără cookie-uri, și doar dacă browserul tău nu cere să nu fii urmărit. Imaginile hărții și datele în timp real vin de la servicii publice de hărți (Esri, OpenStreetMap, Open-Meteo).',
 'fa': 'سایت از قلم بیرونی، تبلیغات یا کوکی استفاده نمی‌کند. برای شمردن بازدیدها Google Analytics و Microsoft Clarity را بدون کوکی بارگذاری می‌کند، و فقط اگر مرورگرت نخواهد ردیابی نشود. تصاویر نقشه و داده‌های زنده از سرویس‌های عمومی نقشه می‌آیند (Esri، OpenStreetMap، Open-Meteo).',
 'ur': 'سائٹ نہ باہر کے فونٹ استعمال کرتی ہے، نہ اشتہار، نہ کوکیز۔ وزٹ گننے کے لیے یہ بغیر کوکیز کے Google Analytics اور Microsoft Clarity لوڈ کرتی ہے، اور صرف تب جب آپ کا براؤزر ٹریک نہ کرنے کا نہ کہے۔ نقشے کی تصویریں اور تازہ ڈیٹا عوامی نقشہ سروسز (Esri، OpenStreetMap، Open-Meteo) سے آتے ہیں۔',
 'ti': 'እቲ ወብሳይት ካብ ደገ ዝመጹ ፊደላት (fonts)፣ መወዓውዒ ወይ cookies ኣይጥቀምን። ምብጻሓት ንምቑጻር Google Analyticsን Microsoft Clarityን ብዘይ cookies ይጽዕን፣ መርበብካ ከይከታተሉኻ እንተዘይሓቲቱ ጥራይ። ስእልታት ካርታን ቀጥታዊ ሓበሬታን ካብ ህዝባዊ ኣገልግሎታት ካርታ (Esri, OpenStreetMap, Open-Meteo) እዮም ዝመጹ።',
 'ps': 'سایټ بهرني فونټونه، اعلانونه او کوکيز نه کاروي. د لیدنو د شمېرلو لپاره Google Analytics او Microsoft Clarity بې کوکیزو پورته کوي، او یوازې هغه وخت چې ستا براوزر ونه غواړي چې تعقیب نه شي. د نقشې انځورونه او ژوندي معلومات د نقشې له عامه خدمتونو نه راځي (Esri، OpenStreetMap، Open-Meteo).',
 'so': 'Websaydku ma isticmaalo far-qoraal dibadda ah (fonts), xayaysiis ama cookies. Si uu u tiriyo booqashooyinka wuxuu soo raraa Google Analytics iyo Microsoft Clarity, cookies la’aan, kaliya haddii browser-kaagu uusan codsan in aan lagu raadraacin. Sawirrada khariidadda iyo xogta tooska ahi waxay ka yimaadaan adeegyo khariidad oo dadweyne (Esri, OpenStreetMap, Open-Meteo).',
 'am': 'ድረ-ገጹ የውጭ ፊደላትን (fonts)፣ ማስታወቂያን ወይም cookies አይጠቀምም። ጉብኝቶችን ለመቁጠር Google Analyticsን እና Microsoft Clarityን ያለ cookies ይጭናል፤ ይህም አሳሽህ እንዳይከታተሉህ ካልጠየቀ ብቻ ነው። የካርታ ምስሎቹና የቀጥታ መረጃው የሚመጡት ከሕዝባዊ የካርታ አገልግሎቶች (Esri, OpenStreetMap, Open-Meteo) ነው።',
 'tr': 'Site harici yazı tipi, reklam ya da çerez kullanmaz. Ziyaretleri saymak için Google Analytics ve Microsoft Clarity’yi çerezsiz yükler; bunu da yalnızca tarayıcın takip edilmemeyi istemiyorsa yapar. Harita görüntüleri ve canlı veriler herkese açık harita servislerinden gelir (Esri, OpenStreetMap, Open-Meteo).',
 'bn': 'সাইটটি বাইরের কোনো ফন্ট, বিজ্ঞাপন বা কুকি ব্যবহার করে না। ভিজিট গুনতে এটি কুকি ছাড়া Google Analytics আর Microsoft Clarity চালায়, তবে শুধু তখনই যখন তোমার ব্রাউজার নজরদারি না করতে বলে না। ম্যাপের ছবি আর লাইভ তথ্য আসে সবার জন্য খোলা ম্যাপ সেবা থেকে (Esri, OpenStreetMap, Open-Meteo)।',
 'zh': '网站不使用外部字体，没有广告，没有 cookie。为了统计访问，它会在不用 cookie 的情况下加载 Google Analytics 和 Microsoft Clarity，而且只在你的浏览器没有要求“不要追踪”时才加载。地图图片和实时数据来自公共地图服务（Esri、OpenStreetMap、Open-Meteo）。',
 'wo': 'Site bi jëfandikoowul police yu jóge biti, pub walla cookies. Ngir waññ ñi ñëw, dafay yeb Google Analytics ak Microsoft Clarity, te amul cookies, su sa navigateur laajul ñu bañ laa topp rekk. Nataali kaart bi ak xibaar yu léegi yi ci sarwisu kaart yu ñépp lañu jóge (Esri, OpenStreetMap, Open-Meteo).',
 'bm': 'Site tɛ sɛbɛnni cogo (police) kɛnɛmatɔw ta, piblisite tɛ, cookies tɛ. Walasa ka taamaw jate, a bɛ Google Analytics ni Microsoft Clarity wuli, cookies tɛ, ni i ka navigateur ma a ɲini ko i kana nɔminɛ dɔrɔn. Karti jaw ni kunnafoni sisanw bɔra foroba karti baarakɛyɔrɔw la (Esri, OpenStreetMap, Open-Meteo).',
}
s = io.open(P('i18n_pages.py'), encoding='utf-8').read()
MARK = '# --- R20: textos de privacidad veraces (GA4 + Clarity sin cookies) ---'
if MARK not in s:
    i = s.find('\ndef ')
    add = '\n%s\n_R20_T50 = %r\n_R20_V4 = %r\nfor _l, (_o, _n) in _R20_T50.items():\n    if _l in TR and \'p.t50\' in TR[_l]:\n        assert _o in TR[_l][\'p.t50\'], (_l, _o)\n        TR[_l][\'p.t50\'] = TR[_l][\'p.t50\'].replace(_o, _n)\nfor _l, _v in _R20_V4.items():\n    if _l in TR and \'v4\' in TR[_l]:\n        TR[_l][\'v4\'] = _v\n' % (MARK, T50, V4)
    s = s[:i] + add + s[i:]
    io.open(P('i18n_pages.py'), 'w', encoding='utf-8').write(s)

# ---------------------------------------------------------------- /about, meta del index, imagen social
s = io.open(P('about_page.py'), encoding='utf-8').read()
s = s.replace('Sin cuenta, sin coste, sin publicidad, sin rastreo.', 'Sin cuenta, sin coste, sin publicidad, sin cookies.')
s = s.replace('No account, no cost, no ads, no tracking.', 'No account, no cost, no ads, no cookies.')
s = s.replace("'Solo recuentos anónimos: visitas, idioma, ciudad y qué se buscó sin encontrarlo. Sin cookies, sin dirección IP, sin identificador del móvil. Si tu navegador pide no ser rastreado, no contamos nada.'",
              "'Recuentos anónimos y sin cookies: nuestro contador (visitas, idioma, ciudad y qué se buscó sin encontrarlo), Google Analytics (páginas vistas, país, tipo de aparato) y Microsoft Clarity (toques y desplazamientos, con todo el texto de la pantalla oculto). Ninguno recibe tu nombre, una cuenta ni tu posición. Si tu navegador pide no ser rastreado, no se carga nada de esto.'")
s = re.sub(r"'Only anonymous counts: visits, language, city and what was searched without success\. No cookies, no IP address, no device identifier\. If your browser asks not to be tracked, we co[^']*'",
           "'Anonymous counts without cookies: our own counter (visits, language, city and what was searched without success), Google Analytics (pages visited, country, type of device) and Microsoft Clarity (taps and scrolling, with all the text on screen hidden). None of them gets your name, an account or your position. If your browser asks not to be tracked, none of this loads.'", s)
assert 'Google Analytics' in s and s.count('Google Analytics') >= 2, 'about'
io.open(P('about_page.py'), 'w', encoding='utf-8').write(s)
s = io.open(P('build.py'), encoding='utf-8').read()
s = s.replace("No account, no tracking, no cost.", "No account, no ads, no cost.")
io.open(P('build.py'), 'w', encoding='utf-8').write(s)
s = io.open(P('social.py'), encoding='utf-8').read()
s = s.replace("'No account. No tracking. No cost.'", "'No account. No ads. No cost.'")
io.open(P('social.py'), 'w', encoding='utf-8').write(s)
print('ok')
