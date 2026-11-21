# -*- coding: utf-8 -*-
# Una pagina por ciudad, para que Google encuentre «comedor social Nairobi» o
# «free shower London» y lleve a alguien al mapa.
#
# Salen en ingles: es lo que indexa Google en todas partes y lo que hay escrito
# en el resto de paginas sueltas. Al pulsar «abrir el mapa» la app ya se pone en
# el idioma de la persona. Cada pagina lleva lo que hay de verdad en esa ciudad
# — cuantos sitios de cada tipo a 10 km del centro y los treinta con nombre mas
# cercanos — asi que si en una ciudad hay poco, la pagina lo dice; no se inventa
# nada para rellenar.
#
# Ademas: sitemap.xml y robots.txt, que hasta hoy no existian.
from datetime import date
import io, json, os, re, math, html as H
from urllib.parse import quote as Q
from collections import Counter
from seo_common import finalize, display_name, hreflang_links, SITE, LANGS as ALL_LANGS

h = io.open('index.full.html' if __import__('os').path.exists('index.full.html') else 'index.html', encoding='utf-8').read()
STR = json.loads(re.search(r'const STR = /\*__STR__\*/(\[.*?\]);', h, re.S).group(1))
CITIES = json.loads(re.search(r'const CITIES = /\*__CITIES__\*/(\[.*?\]);', h, re.S).group(1))
STATS = json.loads(re.search(r'const STATS = /\*__STATS__\*/(\{.*?\});', h, re.S).group(1))
EMG_N = json.loads(re.search(r'const EMG_N = (\{.*?\});', h, re.S).group(1))
PAGES_V = re.search(r"const PAGES_V = /\*__PAGESV__\*/'([^']*)'", h).group(1)
import hashlib as _hl
try: SV = '?v=' + _hl.sha1(open('social.jpg','rb').read()).hexdigest()[:8]
except Exception: SV = '?v=' + PAGES_V


def social_img(lang):
    """La tarjeta para compartir en el idioma de la pagina (social/make_social.py).
    Si no hay version de ese idioma, la inglesa."""
    f = 'social-%s.jpg' % lang
    if lang != 'en' and os.path.exists(f):
        return 'https://supportnear.com/%s?v=%s' % (f, _hl.sha1(open(f, 'rb').read()).hexdigest()[:8])
    return 'https://supportnear.com/social.jpg' + SV
CATIDS = ['food', 'shelter', 'hygiene', 'clothes', 'social', 'legal', 'health', 'water', 'warm']
NLANG = len(ALL_LANGS)          # «en 13 idiomas» se quedo viejo: ahora sale de la lista
# build.py corta la salud, los sitios donde estar y el agua de las ciudades del
# mundo en 21, 13 y 24 (W_HEALTH, W_WARM, W_WATER). Si la cuenta da justo eso,
# lo honrado es «21+», no «21» (QA m1).
CAPS = {'health': 21, 'warm': 13, 'water': 24}


def fmt_n(cat, n):
    return '%d+' % n if CAPS.get(cat) == n else str(n)
CATNAME = {'food': 'Food', 'shelter': 'Shelter and beds', 'hygiene': 'Showers and toilets',
           'clothes': 'Free clothes', 'social': 'Social help', 'legal': 'Legal aid',
           'health': 'Health care', 'water': 'Drinking water', 'warm': 'A warm place to be'}
SUB_EN = json.loads(re.search(r'const SUB = \{\n en:(\{.*?\})\n\}', h, re.S).group(1))
CSS = io.open('page.css.txt', encoding='utf-8').read()

# ---- idioma de cada pais: la pagina sale en la lengua que se busca en Google alli ----
LANG_BY_CC = {}
for cc in 'ES AR BO CL CO CR CU DO EC SV GT HN MX NI PA PY PE UY VE GQ'.split(): LANG_BY_CC[cc] = 'es'
for cc in 'FR BE CH SN ML CI BF NE TD CM GA CG CD BJ TG GN MG DJ KM HT LU MC BI RW CF MR'.split(): LANG_BY_CC[cc] = 'fr'
for cc in 'MA DZ TN LY EG SD SA YE OM AE QA BH KW IQ SY JO LB PS SO MR SS'.split(): LANG_BY_CC.setdefault(cc, 'ar')
LANG_BY_CC.update({'UA': 'uk', 'RO': 'ro', 'MD': 'ro', 'PL': 'pl', 'RU': 'ru', 'BY': 'ru', 'KZ': 'ru', 'KG': 'ru',
                   'PT': 'pt', 'BR': 'pt', 'AO': 'pt', 'MZ': 'pt', 'CV': 'pt', 'GW': 'pt', 'ST': 'pt', 'TL': 'pt',
                   'PK': 'ur', 'IR': 'fa', 'AF': 'fa', 'TJ': 'fa'})
RTL = {'ar', 'ur', 'fa'}
CP_EN = json.load(io.open('tr/citypage_src.json', encoding='utf-8'))
CP = json.load(io.open('tr/citypage_new.json', encoding='utf-8')); CP['en'] = CP_EN
# nombres de categoria por idioma, de la propia app
CATN = {'en': CATNAME}
for lang in CP:
    if lang == 'en': continue
    try:
        t = json.load(io.open('l/%s.json' % lang, encoding='utf-8'))['t']
        CATN[lang] = {c: t.get('cat.%s.n' % c, CATNAME[c]) for c in CATIDS}
    except Exception:
        CATN[lang] = CATNAME


ONE = {  # con n == 1, estas frases van en singular
    'en': {'cn.desc': '1 place in {city}, {country}, with address, hours and phone where they are known. Free map, no account, works with no signal.'},
    'es': {'cn.desc': '1 sitio en {city}, {country}, con dirección, horario y teléfono cuando se saben. Mapa gratis, sin cuenta, funciona sin cobertura.'},
    'fr': {'cn.desc': '1 lieu à {city}, {country}, avec adresse, horaires et téléphone quand on les connaît. Carte gratuite, sans compte, marche sans réseau.'},
    'pt': {'cn.desc': '1 sítio em {city}, {country}, com morada, horário e telefone quando se sabem. Mapa gratuito, sem conta, funciona sem rede.'},
}
R24 = {
 'en': {'nearby': 'Nearby cities', 'more_cc': 'All cities in {country}', 'data': 'Data from OpenStreetMap, updated {date}',
        'near_help': 'Other free help nearby', 'osm': 'Wrong or closed? Fix it on OpenStreetMap', 'city_col': 'City',
        'cc_lede': 'Cities on the map in {country}: {n}. Free food, shelter, showers and other help, city by city.'},
 'es': {'nearby': 'Ciudades cercanas', 'more_cc': 'Todas las ciudades — {country}', 'data': 'Datos de OpenStreetMap, actualizados el {date}',
        'near_help': 'Más ayuda gratis cerca', 'osm': '¿Está mal o ha cerrado? Corrígelo en OpenStreetMap', 'city_col': 'Ciudad',
        'cc_lede': 'Ciudades de {country} en el mapa: {n}. Comida gratis, albergues, duchas y otra ayuda, ciudad por ciudad.'},
 'fr': {'nearby': 'Villes proches', 'more_cc': 'Toutes les villes — {country}', 'data': 'Données OpenStreetMap, mises à jour le {date}',
        'near_help': 'Autres aides gratuites à proximité', 'osm': 'Erreur ou fermé ? Corrigez-le sur OpenStreetMap', 'city_col': 'Ville',
        'cc_lede': 'Villes sur la carte ({country}) : {n}. Repas gratuits, hébergement, douches et autres aides, ville par ville.'},
 'pt': {'nearby': 'Cidades próximas', 'more_cc': 'Todas as cidades — {country}', 'data': 'Dados do OpenStreetMap, atualizados em {date}',
        'near_help': 'Mais ajuda gratuita por perto', 'osm': 'Está errado ou fechou? Corrija no OpenStreetMap', 'city_col': 'Cidade',
        'cc_lede': 'Cidades no mapa ({country}): {n}. Comida grátis, abrigo, banho e outras ajudas, cidade a cidade.'},
 'ro': {'nearby': 'Orașe din apropiere', 'more_cc': 'Toate orașele — {country}', 'data': 'Date din OpenStreetMap, actualizate la {date}',
        'near_help': 'Alte ajutoare gratuite în apropiere', 'osm': 'Greșit sau închis? Corectează pe OpenStreetMap', 'city_col': 'Oraș',
        'cc_lede': 'Orașe pe hartă ({country}): {n}. Mâncare gratuită, adăpost, dușuri și alt ajutor, oraș cu oraș.'},
 'pl': {'nearby': 'Pobliskie miasta', 'more_cc': 'Wszystkie miasta — {country}', 'data': 'Dane z OpenStreetMap, aktualizacja {date}',
        'near_help': 'Inna bezpłatna pomoc w pobliżu', 'osm': 'Błąd albo zamknięte? Popraw w OpenStreetMap', 'city_col': 'Miasto',
        'cc_lede': 'Miasta na mapie ({country}): {n}. Darmowe jedzenie, noclegi, prysznice i inna pomoc, miasto po mieście.'},
 'uk': {'nearby': 'Міста поблизу', 'more_cc': 'Усі міста — {country}', 'data': 'Дані OpenStreetMap, оновлено {date}',
        'near_help': 'Інша безкоштовна допомога поруч', 'osm': 'Помилка чи зачинено? Виправте в OpenStreetMap', 'city_col': 'Місто',
        'cc_lede': 'Міста на мапі ({country}): {n}. Безкоштовна їжа, нічліг, душ та інша допомога.'},
 'ru': {'nearby': 'Города рядом', 'more_cc': 'Все города — {country}', 'data': 'Данные OpenStreetMap, обновлено {date}',
        'near_help': 'Другая бесплатная помощь рядом', 'osm': 'Ошибка или закрыто? Исправьте в OpenStreetMap', 'city_col': 'Город',
        'cc_lede': 'Города на карте ({country}): {n}. Бесплатная еда, ночлег, душ и другая помощь.'},
 'ar': {'nearby': 'مدن قريبة', 'more_cc': 'كل المدن — {country}', 'data': 'بيانات من OpenStreetMap، حُدّثت في {date}',
        'near_help': 'مساعدات مجانية أخرى قريبة', 'osm': 'خطأ أو مغلق؟ صحّحه على OpenStreetMap', 'city_col': 'المدينة',
        'cc_lede': 'المدن على الخريطة ({country}): {n}. طعام مجاني ومأوى واستحمام ومساعدات أخرى.'},
 'fa': {'nearby': 'شهرهای نزدیک', 'more_cc': 'همه شهرها — {country}', 'data': 'داده‌ها از OpenStreetMap، به‌روزشده در {date}',
        'near_help': 'کمک‌های رایگان دیگر در نزدیکی', 'osm': 'اشتباه است یا بسته شده؟ در OpenStreetMap اصلاحش کنید', 'city_col': 'شهر',
        'cc_lede': 'شهرهای روی نقشه ({country}): {n}. غذای رایگان، سرپناه، حمام و کمک‌های دیگر.'},
 'ur': {'nearby': 'قریبی شہر', 'more_cc': 'تمام شہر — {country}', 'data': 'ڈیٹا OpenStreetMap سے، {date} کو اپ ڈیٹ ہوا',
        'near_help': 'قریب میں دیگر مفت مدد', 'osm': 'غلط ہے یا بند ہو گیا؟ OpenStreetMap پر درست کریں', 'city_col': 'شہر',
        'cc_lede': 'نقشے پر شہر ({country}): {n}۔ مفت کھانا، رہائش، غسل اور دیگر مدد۔'},
}
R25 = {
 'en': {'faq_h': 'Common questions', 'faq_food': 'Where can I get free food in {city}?', 'faq_shelter': 'Where can I sleep tonight in {city}?',
        'faq_hygiene': 'Where are there free showers and toilets in {city}?', 'faq_ans': 'The closest to the centre: {list}. There are {n} in total on the map, within 10 km.',
        'hours_n': '{h} of the {n} places with a name list opening hours and {p} a phone number; check before you go.', 'csv': 'Download this data (CSV, ODbL)'},
 'es': {'faq_h': 'Preguntas frecuentes', 'faq_food': '¿Dónde puedo comer gratis en {city}?', 'faq_shelter': '¿Dónde puedo dormir esta noche en {city}?',
        'faq_hygiene': '¿Dónde hay duchas y aseos gratis en {city}?', 'faq_ans': 'Los más cercanos al centro: {list}. En el mapa hay {n} en total a menos de 10 km.',
        'hours_n': 'De los {n} sitios con nombre, {h} tienen horario y {p} teléfono; compruébalo antes de ir.', 'csv': 'Descargar estos datos (CSV, ODbL)'},
 'fr': {'faq_h': 'Questions fréquentes', 'faq_food': 'Où manger gratuitement à {city} ?', 'faq_shelter': 'Où dormir ce soir à {city} ?',
        'faq_hygiene': 'Où trouver des douches et toilettes gratuites à {city} ?', 'faq_ans': 'Les plus proches du centre : {list}. La carte en compte {n} à moins de 10 km.',
        'hours_n': 'Sur les {n} lieux nommés, {h} indiquent des horaires et {p} un téléphone ; vérifiez avant d’y aller.', 'csv': 'Télécharger ces données (CSV, ODbL)'},
 'pt': {'faq_h': 'Perguntas frequentes', 'faq_food': 'Onde posso comer de graça em {city}?', 'faq_shelter': 'Onde posso dormir esta noite em {city}?',
        'faq_hygiene': 'Onde há chuveiros e banheiros gratuitos em {city}?', 'faq_ans': 'Os mais próximos do centro: {list}. No mapa há {n} no total a menos de 10 km.',
        'hours_n': 'Dos {n} sítios com nome, {h} têm horário e {p} telefone; confirme antes de ir.', 'csv': 'Baixar estes dados (CSV, ODbL)'},
 'ro': {'faq_h': 'Întrebări frecvente', 'faq_food': 'Unde pot mânca gratuit în {city}?', 'faq_shelter': 'Unde pot dormi în noaptea asta în {city}?',
        'faq_hygiene': 'Unde găsesc dușuri și toalete gratuite în {city}?', 'faq_ans': 'Cele mai apropiate de centru: {list}. Pe hartă sunt {n} în total, pe o rază de 10 km.',
        'hours_n': 'Din cele {n} locuri cu nume, {h} au program și {p} telefon; verifică înainte să mergi.', 'csv': 'Descarcă datele (CSV, ODbL)'},
 'pl': {'faq_h': 'Częste pytania', 'faq_food': '{city}: gdzie zjeść za darmo?', 'faq_shelter': '{city}: gdzie przenocować dziś w nocy?',
        'faq_hygiene': '{city}: gdzie są darmowe prysznice i toalety?', 'faq_ans': 'Najbliżej centrum: {list}. Na mapie w promieniu 10 km: {n}.',
        'hours_n': 'Miejsca z nazwą: {n}; z godzinami otwarcia: {h}; z telefonem: {p}. Sprawdź przed wyjściem.', 'csv': 'Pobierz dane (CSV, ODbL)'},
 'uk': {'faq_h': 'Часті запитання', 'faq_food': '{city}: де безкоштовно поїсти?', 'faq_shelter': '{city}: де переночувати сьогодні?',
        'faq_hygiene': '{city}: де безкоштовні душ і туалети?', 'faq_ans': 'Найближче до центру: {list}. На мапі в радіусі 10 км: {n}.',
        'hours_n': 'Місць із назвою: {n}; із годинами роботи: {h}; із телефоном: {p}. Перевірте, перш ніж іти.', 'csv': 'Завантажити дані (CSV, ODbL)'},
 'ru': {'faq_h': 'Частые вопросы', 'faq_food': '{city}: где бесплатно поесть?', 'faq_shelter': '{city}: где переночевать сегодня?',
        'faq_hygiene': '{city}: где бесплатные душ и туалеты?', 'faq_ans': 'Ближе всего к центру: {list}. На карте в радиусе 10 км: {n}.',
        'hours_n': 'Мест с названием: {n}; с часами работы: {h}; с телефоном: {p}. Проверьте перед тем, как идти.', 'csv': 'Скачать данные (CSV, ODbL)'},
 'ar': {'faq_h': 'أسئلة شائعة', 'faq_food': 'أين يمكنني الحصول على طعام مجاني في {city}؟', 'faq_shelter': 'أين يمكنني المبيت الليلة في {city}؟',
        'faq_hygiene': 'أين توجد حمامات ودورات مياه مجانية في {city}؟', 'faq_ans': 'الأقرب إلى المركز: {list}. على الخريطة {n} في المجموع ضمن 10 كم.',
        'hours_n': 'من بين {n} مكانًا لها اسم، {h} لها مواعيد و{p} لها رقم هاتف؛ تحقّق قبل الذهاب.', 'csv': 'تنزيل هذه البيانات (CSV، ODbL)'},
 'fa': {'faq_h': 'پرسش‌های رایج', 'faq_food': 'کجا در {city} می‌توانم غذای رایگان بگیرم؟', 'faq_shelter': 'امشب در {city} کجا می‌توانم بخوابم؟',
        'faq_hygiene': 'در {city} دوش و سرویس بهداشتی رایگان کجاست؟', 'faq_ans': 'نزدیک‌ترین‌ها به مرکز: {list}. روی نقشه در شعاع ۱۰ کیلومتر: {n}.',
        'hours_n': 'از {n} مکان دارای نام، {h} ساعت کاری و {p} شماره تلفن دارند؛ پیش از رفتن بررسی کنید.', 'csv': 'دانلود این داده‌ها (CSV، ODbL)'},
 'ur': {'faq_h': 'عام سوالات', 'faq_food': '{city} میں مفت کھانا کہاں ملے گا؟', 'faq_shelter': 'آج رات {city} میں کہاں سو سکتا ہوں؟',
        'faq_hygiene': '{city} میں مفت غسل خانے اور بیت الخلا کہاں ہیں؟', 'faq_ans': 'مرکز کے قریب ترین: {list}۔ نقشے پر 10 کلومیٹر کے اندر کل {n}۔',
        'hours_n': 'نام والے {n} مقامات میں سے {h} کے اوقات اور {p} کا فون نمبر معلوم ہے؛ جانے سے پہلے تصدیق کریں۔', 'csv': 'یہ ڈیٹا ڈاؤن لوڈ کریں (CSV، ODbL)'},
}
for _l, _d in R25.items(): R24.setdefault(_l, {}).update(_d)
R26 = {
 'en': {'vol_h1': 'Volunteer or donate food in {city}', 'vol_link': 'Want to help? Volunteer or donate',
        'vol_lede': '{n} food banks and free meal places near the centre of {city}. Many look for volunteers to sort, cook or deliver, and accept non-perishable food. Call or write before you go to ask what they need.'},
 'es': {'vol_h1': 'Voluntariado y donaciones de comida en {city}', 'vol_link': '¿Quieres ayudar? Voluntariado y donaciones',
        'vol_lede': '{n} comedores sociales y bancos de alimentos cerca del centro de {city}. Muchos buscan voluntarios para clasificar, cocinar o repartir, y aceptan alimentos no perecederos. Llama o escribe antes de ir para preguntar qué necesitan.'},
 'fr': {'vol_h1': 'Bénévolat et dons alimentaires à {city}', 'vol_link': 'Envie d’aider ? Bénévolat et dons',
        'vol_lede': '{n} lieux de distribution alimentaire près du centre de {city}. Beaucoup cherchent des bénévoles pour trier, cuisiner ou distribuer, et acceptent des denrées non périssables. Appelez ou écrivez avant d’y aller pour demander ce dont ils ont besoin.'},
 'pt': {'vol_h1': 'Voluntariado e doação de alimentos em {city}', 'vol_link': 'Quer ajudar? Voluntariado e doações',
        'vol_lede': '{n} refeitórios sociais e bancos alimentares perto do centro de {city}. Muitos procuram voluntários para separar, cozinhar ou distribuir, e aceitam alimentos não perecíveis. Ligue ou escreva antes de ir para saber do que precisam.'},
 'ro': {'vol_h1': 'Voluntariat și donații de alimente în {city}', 'vol_link': 'Vrei să ajuți? Voluntariat și donații',
        'vol_lede': '{n} cantine sociale și bănci de alimente lângă centrul orașului {city}. Multe caută voluntari pentru sortat, gătit sau distribuit și primesc alimente neperisabile. Sună sau scrie înainte să mergi ca să afli de ce au nevoie.'},
 'pl': {'vol_h1': '{city}: wolontariat i dary żywności', 'vol_link': 'Chcesz pomóc? Wolontariat i dary',
        'vol_lede': 'Punkty z darmowym jedzeniem blisko centrum ({city}): {n}. Wiele z nich szuka wolontariuszy do sortowania, gotowania lub rozwożenia i przyjmuje żywność o długim terminie. Zadzwoń albo napisz przed wizytą i zapytaj, czego potrzebują.'},
 'uk': {'vol_h1': '{city}: волонтерство та пожертви їжі', 'vol_link': 'Хочете допомогти? Волонтерство й пожертви',
        'vol_lede': 'Місця безкоштовного харчування біля центру ({city}): {n}. Багато з них шукають волонтерів, щоб сортувати, готувати чи розвозити, і приймають продукти тривалого зберігання. Зателефонуйте або напишіть заздалегідь і спитайте, що їм потрібно.'},
 'ru': {'vol_h1': '{city}: волонтёрство и пожертвования еды', 'vol_link': 'Хотите помочь? Волонтёрство и пожертвования',
        'vol_lede': 'Места бесплатного питания у центра ({city}): {n}. Многие ищут волонтёров, чтобы сортировать, готовить или развозить, и принимают продукты длительного хранения. Позвоните или напишите заранее и спросите, что им нужно.'},
 'ar': {'vol_h1': 'التطوع والتبرع بالطعام في {city}', 'vol_link': 'تريد المساعدة؟ التطوع والتبرع',
        'vol_lede': '{n} أماكن لتوزيع الطعام المجاني قرب مركز {city}. كثير منها يبحث عن متطوعين للفرز أو الطبخ أو التوزيع، ويقبل الأطعمة غير القابلة للتلف. اتصل أو اكتب قبل الذهاب لتسأل عمّا يحتاجونه.'},
 'fa': {'vol_h1': 'داوطلبی و اهدای غذا در {city}', 'vol_link': 'می‌خواهید کمک کنید؟ داوطلبی و اهدا',
        'vol_lede': '{n} مکان توزیع غذای رایگان نزدیک مرکز {city}. بسیاری از آن‌ها برای مرتب‌کردن، آشپزی یا پخش به داوطلب نیاز دارند و مواد غذایی ماندگار می‌پذیرند. پیش از رفتن تماس بگیرید یا بنویسید و بپرسید چه نیاز دارند.'},
 'ur': {'vol_h1': '{city} میں رضاکاری اور کھانے کا عطیہ', 'vol_link': 'مدد کرنا چاہتے ہیں؟ رضاکاری اور عطیہ',
        'vol_lede': '{city} کے مرکز کے قریب مفت کھانے کے {n} مقامات۔ بہت سے چھانٹنے، پکانے یا تقسیم کے لیے رضاکار ڈھونڈتے ہیں اور خراب نہ ہونے والی غذا قبول کرتے ہیں۔ جانے سے پہلے فون یا پیغام کر کے پوچھیں کہ انہیں کیا چاہیے۔'},
}
for _l, _d in R26.items(): R24.setdefault(_l, {}).update(_d)
# Ingles: la palabra que se escribe en Google en cada pais
CUR = {'cc': ''}
FOOD_EN_US = {'US', 'CA'}
ROBOTS_IDX = '<meta name="robots" content="max-image-preview:large">'
DATA_DATE = os.environ.get('SN_BUILT', '2026-10-28')
_APPT = {}


def TT_R(lang, key, **kw):
    return R(lang, key, **kw)


def R(lang, key, **kw):
    v = (R24.get(lang) or R24['en']).get(key) or R24['en'][key]
    for k, x in kw.items():
        v = v.replace('{%s}' % k, str(x))
    return v


def AT(lang, key, fb):
    """Texto de la app (l/<lang>.json): ya traducido a los 20 idiomas."""
    if lang not in _APPT:
        try: _APPT[lang] = json.load(io.open('l/%s.json' % lang, encoding='utf-8'))['t']
        except Exception: _APPT[lang] = {}
    return _APPT[lang].get(key) or (AT('en', key, fb) if lang != 'en' else fb)


def foot(lang, back=''):
    return ('<footer>SupportNear &middot; %s &middot; <a href="%sabout">%s</a></footer>'
            % (H.escape(R(lang, 'data', date=DATA_DATE)), back, H.escape(AT(lang, 'menu.who', 'Who is behind this'))))


PLACE_URL = {}     # id OSM -> slug de su pagina /s/ (se llena antes de generar las ciudades)


def purl(p, pre='../'):
    s_ = PLACE_URL.get(p['id'])
    return (pre + 's/' + s_) if s_ else ('%s#p=%s@%.5f,%.5f' % (pre, p['id'], p['lat'], p['lon']))


def TT(lang, key, **kw):
    v = (CP.get(lang) or CP_EN).get(key) or CP_EN[key]
    if lang == 'en' and key == 'pl.food':
        v = 'food pantries' if CUR['cc'] in FOOD_EN_US else 'food banks'
    if str(kw.get('n')) == '1' and key in ONE.get(lang, {}):
        v = ONE[lang][key]
    for k, x in kw.items():
        v = v.replace('{%s}' % k, str(x))
    return v


# «1 sitios donde estar»: con un solo sitio la frase va en singular. Los
# idiomas eslavos ya escriben «{need} ({n})», que no necesita concordar.
SG = {
    'en': {'food': 'free food place', 'shelter': 'shelter', 'hygiene': 'free shower', 'clothes': 'free clothes point', 'social': 'social service', 'legal': 'free legal aid point', 'health': 'clinic or hospital', 'water': 'drinking water point', 'warm': 'warm place to sit'},
    'es': {'food': 'comedor social', 'shelter': 'albergue', 'hygiene': 'ducha pública', 'clothes': 'ropero', 'social': 'servicio social', 'legal': 'punto de asistencia jurídica gratuita', 'health': 'centro de salud u hospital', 'water': 'fuente de agua potable', 'warm': 'sitio donde estar'},
    'fr': {'food': 'distribution de repas', 'shelter': 'hébergement d’urgence', 'hygiene': 'douche gratuite', 'clothes': 'vestiaire solidaire', 'social': 'service social', 'legal': 'point d’aide juridique gratuite', 'health': 'lieu de soins', 'water': 'point d’eau potable', 'warm': 'lieu où se poser au chaud'},
    'pt': {'food': 'refeitório social', 'shelter': 'albergue', 'hygiene': 'ducha pública', 'clothes': 'roupeiro solidário', 'social': 'serviço social', 'legal': 'ponto de apoio jurídico gratuito', 'health': 'centro de saúde ou hospital', 'water': 'ponto de água potável', 'warm': 'sítio onde estar'},
    'ro': {'food': 'cantină socială', 'shelter': 'adăpost', 'hygiene': 'duș gratuit', 'clothes': 'punct de haine gratuite', 'social': 'serviciu social', 'legal': 'punct de asistență juridică gratuită', 'health': 'punct de îngrijiri medicale', 'water': 'punct de apă potabilă', 'warm': 'loc cald unde să stai'},
}
def need_word(lang, c, n):
    if n == 1 and lang == 'en' and c == 'food':
        return 'food pantry' if CUR['cc'] in FOOD_EN_US else 'food bank'
    if n == 1 and c in SG.get(lang, {}):
        return SG[lang][c]
    return TT(lang, 'pl.' + c)


# JSON-LD: sin campos vacios (los validadores de Google marcan los null) y el
# horario solo cuando es sencillo, que es lo que schema.org entiende.
def ld_clean(x):
    if isinstance(x, dict): return {k: ld_clean(v) for k, v in x.items() if v not in (None, '', [], {})}
    if isinstance(x, list): return [ld_clean(v) for v in x]
    return x
_OH_OK = re.compile(r'^(?:(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?(?:,(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?)* \d\d:\d\d-\d\d:\d\d(?:,\d\d:\d\d-\d\d:\d\d)*(?:; ?)?)+$')
def ld_oh(oh):
    oh = (oh or '').strip()
    if oh == '24/7': return 'Mo-Su 00:00-23:59'
    return oh if _OH_OK.match(oh) else None
# El pais en el idioma de la pagina: «Moçambique» en la portuguesa, no «Mozambique».
try:
    from babel import Locale as _Loc
except Exception:
    _Loc = None
_LOCS = {}
def country_in(cc, lang, fallback):
    if not _Loc or not cc or lang == 'en': return fallback
    try:
        if lang not in _LOCS: _LOCS[lang] = _Loc.parse(lang)
        return _LOCS[lang].territories.get(cc) or fallback
    except Exception:
        return fallback

# ---- QR para el cartel ----
import qrcode, qrcode.image.svg
def qr_svg(url):
    img = qrcode.make(url, image_factory=qrcode.image.svg.SvgPathImage, box_size=10, border=2,
                      error_correction=qrcode.constants.ERROR_CORRECT_M)
    raw = img.to_string(encoding='unicode')
    # solo el <svg>...</svg>, sin cabecera xml
    return raw[raw.index('<svg'):]

# pais (ISO) de cada ciudad, para el numero de emergencias
# Desde octubre CITIES ya trae el pais (c[4]); los ficheros viejos solo si estan.
CC = {}
if os.path.exists('legacy_cc.json'):
    for k, v in json.load(open('legacy_cc.json')).items():
        la, lo = k.split(','); CC[(round(float(la), 3), round(float(lo), 3))] = v['cc']
for f in ('cities_new300.json', 'cities_new200.json', 'cities_new500.json'):
    if not os.path.exists(f): continue
    for c in json.load(io.open(f, encoding='utf-8')):
        CC[(round(c['lat'], 3), round(c['lon'], 3))] = c.get('cc', '')


def S_(v):
    if isinstance(v, int):
        return STR[v] if 0 <= v < len(STR) else ''
    return v or ''


def hav(a, b, c, d):
    R = 6371000.0; p = math.pi / 180
    x = (math.sin((c - a) * p / 2) ** 2 + math.cos(a * p) * math.cos(c * p) * math.sin((d - b) * p / 2) ** 2)
    return 2 * R * math.asin(math.sqrt(x))


# todos los sitios, decodificados una vez
# R25: hospitales y clinicas privados conocidos y dentistas no son ayuda gratis: fuera de estas paginas
_PRIV = re.compile(r'quir[oó]n|vithas|sanitas|\bhm hospital|hospiten|\bnisa\b|\bhla\b|ruber|teknon|dexeus|\bdental|dentist|odontol|'
                   r'\bbupa\b|spire |nuffield|cromwell hospital|mediclinic|\bprivate (?:hospital|clinic)|cl[ií]nica privada|hospital privado|clinique priv', re.I)
places = []
for f in sorted(os.listdir('d')):
    if not f.endswith('.json'):
        continue
    rows = json.load(io.open(os.path.join('d', f), encoding='utf-8'))
    la = lo = 0
    for r in rows:
        la += r[1]; lo += r[2]
        oid = r[5]
        oid = ('way/%d' % -oid if oid < 0 else 'node/%d' % oid) if isinstance(oid, int) else oid
        if CATIDS[r[3]] == 'health' and (S_(r[4]) in ('dentist', 'audiologist', 'company') or _PRIV.search(S_(r[0]) or '')):
            continue
        places.append({'name': S_(r[0]), 'lat': la / 1e5, 'lon': lo / 1e5, 'cat': CATIDS[r[3]],
                       'sub': S_(r[4]), 'id': oid, 'addr': r[6] if len(r) > 6 else '',
                       'oh': r[7] if len(r) > 7 else '', 'phone': r[8] if len(r) > 8 else ''})
print('sitios:', len(places))

# indice por celda de medio grado para no recorrer 37.000 sitios 722 veces
grid = {}
for p in places:
    grid.setdefault((int(p['lat'] * 2), int(p['lon'] * 2)), []).append(p)


def around(lat, lon, km):
    out = []
    ci, cj = int(lat * 2), int(lon * 2)
    for i in range(ci - 1, ci + 2):
        for j in range(cj - 1, cj + 2):
            for p in grid.get((i, j), []):
                d = hav(lat, lon, p['lat'], p['lon'])
                if d <= km * 1000:
                    out.append((d, p))
    out.sort(key=lambda x: x[0])
    return out


def slug(name):
    s = name.lower()
    s = re.sub(r'[̀-ͯ]', '', __import__('unicodedata').normalize('NFD', s))
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s or 'city'


def km(d):
    return ('%d m' % (round(d / 10) * 10)) if d < 1000 else ('%.1f km' % (d / 1000)).replace('.0 km', ' km')


def split_name(raw):
    """«Αθήνα · Athens» o «Cairo · القاهرة»: el nombre en latino para el titulo y
    la URL, el otro para que quien vive alli se reconozca."""
    parts = [x.strip() for x in raw.split('·')]
    if len(parts) == 1:
        return parts[0], ''
    lat = [x for x in parts if re.search(r'[A-Za-z]', x) and not re.search(r'[\u0400-\u04FF\u0370-\u03FF\u0600-\u06FF\u0590-\u05FF\u0E00-\u0E7F\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF\u0900-\u097F]', x)]
    if len(lat) == 1:
        en = lat[0]
    else:
        en = parts[-1]
    if parts[0] in NAME_FIRST and en != parts[0]:
        MOVES[slug(en)] = slug(parts[0])
        en = parts[0]
    other = [x for x in parts if x != en]
    return en, (other[0] if other else '')


NAME_FIRST = {'Dublin', 'Cologne', 'Copenhagen', 'Gothenburg', 'Nuremberg', 'Dire Dawa', 'Nasir', 'Ayod', 'Kokand', 'Nukus',
              'Tirana', 'Aydin', 'Ashgabat', 'Haiphong', 'Jimma'}
MOVES = {}


LDESC = '<' + chr(92) + '/'

# Fecha de cada pagina: solo cambia si cambia lo que dice (no cada vez que se
# genera). La usan el JSON-LD (dateModified) y el sitemap (lastmod).
DATEMARK = '1970-01-01'
_LM_FILE = 'pages_lastmod.json'
_LM_OLD = json.load(io.open(_LM_FILE, encoding='utf-8')) if os.path.exists(_LM_FILE) else {}
LASTMOD = {}


def stamp(url, body):
    h = _hl.sha1(body.encode('utf-8')).hexdigest()[:16]
    old = _LM_OLD.get(url)
    d = old[1] if (old and old[0] == h) else date.today().isoformat()
    LASTMOD[url] = [h, d]
    return finalize(body.replace(DATEMARK, d))


def save(path, url, body):
    io.open(path, 'w', encoding='utf-8').write(stamp(url, body) if url else finalize(body))

# Orden en el que se nombran las necesidades: primero lo que aprieta esta noche.
# No por cantidad: en casi toda ciudad hay mas fuentes que comedores, y una
# lista encabezada por «412 fuentes de agua potable» es verdad y no sirve.
NEED_ORDER = ['food', 'shelter', 'hygiene', 'health', 'clothes', 'social', 'legal', 'water', 'warm']


def need_list(cnt, lang, maxn=3):
    """«8 comedores sociales, 16 albergues y 5 duchas publicas». Las cuentas de
    verdad, con la palabra que se busca en Google en esa lengua."""
    tops = [c for c in NEED_ORDER if cnt.get(c)][:maxn]
    if not tops:
        return ''
    frags = [TT(lang, 'cp.frag', n=fmt_n(c, cnt[c]), need=need_word(lang, c, cnt[c])) for c in tops]
    if len(frags) == 1:
        return frags[0]
    # en polaco, ucraniano y ruso los fragmentos van «sustantivo (n)» y no
    # admiten «y» en medio sin volver a torcer la gramatica: se separan con punto
    sep = TT(lang, 'cp.sep')
    if sep:
        return sep.join(frags)
    return ', '.join(frags[:-1]) + ' ' + TT(lang, 'cp.and') + ' ' + frags[-1]


# «Mo-Su 09:00-11:00» es como lo guarda OpenStreetMap y no lo entiende nadie
# fuera de OSM. En la app ya se traduce; en estas paginas salia crudo. No hace
# falta un interprete entero del formato: basta con poner los dias en la lengua
# de la pagina y el resto tal cual, que ya se lee.
DAY_TR = {
 'en': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
 'es': ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'],
 'fr': ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'],
 'pt': ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'],
 'ro': ['lun', 'mar', 'mie', 'joi', 'vin', 'sâm', 'dum'],
 'pl': ['pon', 'wt', 'śr', 'czw', 'pt', 'sob', 'niedz'],
 'uk': ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'нд'],
 'ru': ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'],
 'ar': ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'],
 'fa': ['دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه', 'یکشنبه'],
 'ur': ['پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ', 'اتوار'],
}
_OSMD = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
_OFF = {'en': 'closed', 'es': 'cerrado', 'fr': 'fermé', 'pt': 'fechado', 'ro': 'închis', 'pl': 'zamknięte',
        'uk': 'зачинено', 'ru': 'закрыто', 'ar': 'مغلق', 'fa': 'تعطیل', 'ur': 'بند'}


def oh_human(oh, lang):
    if not oh:
        return ''
    if oh.strip() == '24/7':
        return '24/7'
    d = DAY_TR.get(lang) or DAY_TR['en']
    # los festivos («PH off», «SH 10:00-14:00») se caen: en una lista de treinta
    # sitios solo anaden ruido, y quien va manana no necesita saberlos
    out = '; '.join(x for x in oh.split(';') if not re.match(r'\s*(PH|SH|easter)', x, re.I))
    if not out.strip():
        return ''
    out = re.sub(r'(\d)-(\d)', r'\1–\2', out)
    out = re.sub(r',(?=\d)', ', ', out)
    for i, code in enumerate(_OSMD):
        out = re.sub(r'\b%s\b' % code, d[i], out)
    out = re.sub(r'\boff\b|\bclosed\b', _OFF.get(lang, 'closed'), out)
    out = out.replace('; ', ' · ').replace(';', ' · ')
    # «lun-vie» con guion corto parece un resto de codigo; con raya se lee
    out = re.sub(r'(?<=[^\W\d_])-(?=[^\W\d_])', '–', out)
    return re.sub(r'\s{2,}', ' ', out).strip(' ·')


def cap(w):
    return w[:1].upper() + w[1:] if w else w


# Quien cae aqui desde Google no sabe donde ha caido: entraba directo a un
# titulo enorme, sin nombre ni marca, y tenia que fiarse de una lista de
# direcciones sin saber de quien. Una cabecera de 38 px lo arregla.
def header(href, label):
    return ('<header class="top"><a class="logo" href="../" aria-label="SupportNear"><svg viewBox="0 0 24 24" aria-hidden="true">'
            '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><path d="M12 7v6M9 10h6"/>'
            '</svg></a><b>SupportNear</b><a href="%s">%s</a></header>') % (href, H.escape(label))

EXTRA_CSS = """
.top{padding:20px 0 26px}
.top .logo{margin-inline-start:0}
.top a:last-child{margin-inline-start:auto;margin-left:0;text-align:end}
@media (max-width:430px){ .top a:last-child{display:none} .top{padding:16px 0 20px} }
.ct{color:var(--ink-3);font-size:14px}
.ad{display:block;color:var(--ink-2);font-size:14.5px}
.d{color:var(--ink-3);font-size:13px;font-variant-numeric:tabular-nums;white-space:nowrap}
ul.pl{list-style:none;padding:0;margin:0 0 8px}
ul.pl li{padding:14px 0;border-bottom:1px solid var(--line)}
ul.pl li:last-child{border-bottom:0}
ul.pl a{font-size:17px;font-weight:650;text-decoration:none;color:var(--ink)}
ul.pl a:hover{color:var(--brand)}
.pl-h{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.pl-h .d{margin-inline-start:auto}
.needs{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 8px}
.needs a{display:inline-block;padding:9px 14px;border:1px solid var(--line);border-radius:999px;background:var(--paper-2);text-decoration:none;font-weight:600;font-size:15px;color:var(--ink)}
.needs a:hover{border-color:var(--brand);color:var(--brand)}
.note{color:var(--ink-3);font-size:14.5px;margin:-4px 0 14px}
.emg{border:1px solid var(--line);border-inline-start:3px solid var(--alert);border-radius:0 12px 12px 0;padding:12px 16px;margin:0 0 26px;font-size:15px}
.emg strong{color:var(--ink)}
ul.cnt{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(158px,1fr));gap:8px}
ul.cnt li{background:var(--paper-2);border:1px solid var(--line);border-radius:12px;padding:12px 14px;font-size:14.5px;color:var(--ink-3)}
ul.cnt b{display:block;font-size:23px;color:var(--ink);font-variant-numeric:tabular-nums;letter-spacing:-.02em}
"""

def page(city, country, lat, lon, cc, local='', raw_q='', lang='en', near=None, sl=None, needs=(), main_lang=None, amb=False, nearc=(), ccpage='', noidx=False):
    # En la pagina en arabe, ucraniano, ruso, farsi o urdu, la ciudad se llama
    # por su nombre local («الدار البيضاء», no «Casablanca») y el latino va al lado.
    # En ingles, «Vienna (Wien)» y no «Wien» (p5). El parametro ?city= sigue
    # llevando el nombre latino de la lista, que es el que entiende la app.
    latin = city
    city, local = display_name(latin, local, lang)
    if near is None:
        near = around(lat, lon, 10)
    cnt = Counter(p['cat'] for _, p in near)
    named = [(d, p) for d, p in near if p['name']][:30]
    total = len(near)
    cn = CATN.get(lang, CATNAME)
    # El titulo dice lo que hay, no cuantos puntos hay. «680 sitios en Madrid»
    # es verdad y no ayuda: la mayoria son fuentes y bancos. «8 comedores
    # sociales y 16 albergues» es la misma verdad, util, y ademas es lo que la
    # gente escribe en Google.
    lst2, lst3 = need_list(cnt, lang, 2), need_list(cnt, lang, 3)
    # Una ciudad que se llama igual que otra (London, Valencia, Leon...) lleva
    # el pais en el titulo: si no, Google ve dos titulos identicos (QA m2).
    tcity = '%s (%s)' % (city, country) if amb else city
    title = TT(lang, 'cp.titleN', city=tcity, list=lst2) if lst2 else TT(lang, 'cp.title', city=tcity)
    desc = TT(lang, 'cp.descN', list=cap(lst3), city=city, country=country) if lst3 else TT(lang, 'cp.desc', n=total, city=city, country=country)
    emg = EMG_N.get(cc)
    emgnum = emg[0] if emg else ''
    if sl is None:
        sl = slug(latin)
    # el enlace al mapa lleva el nombre latino aunque el titulo vaya en el local:
    # es un parametro de URL, no texto, y el latino lo resuelve cualquier teclado.
    # Y el pais: «London» a secas abria London (Canada) desde EE. UU. (QA C1).
    qcity = Q(latin) + ('&amp;cc=' + cc if cc else '')
    subs = SUB_EN
    try:
        if lang != 'en':
            subs = json.load(io.open('l/%s.json' % lang, encoding='utf-8')).get('sub', SUB_EN)
    except Exception:
        pass
    rows = ''.join(
        '<li><div class="pl-h"><a href="%s">%s</a>'
        '<span class="ct">%s</span><span class="d">%s</span></div>%s</li>'
        % (H.escape(purl(p)), H.escape(p['name']),
           H.escape(subs.get(p['sub'], '') or cn[p['cat']]), H.escape(TT(lang, 'cp.from', d=km(d))),
           ('<span class="ad">%s</span>' % H.escape(p['addr'])) if p['addr'] else '')
        for d, p in named)
    counts = ''.join('<li><b>%s</b> %s</li>' % (fmt_n(c, cnt[c]), H.escape(cn[c].lower() if lang not in RTL else cn[c])) for c in CATIDS if cnt[c])
    # Quien busca «comedor social Madrid» no busca «ayuda en Madrid». Cada
    # necesidad con sitios de sobra tiene su propia pagina, y desde aqui se
    # llega a ella: es lo unico que hace que Google la encuentre.
    needlinks = ''.join('<a href="%s-%s.html">%s</a>' % (sl, c, H.escape(TT(lang, 'cp.frag', n=fmt_n(c, k), need=need_word(lang, c, k)))) for c, k in needs)
    few = total < 15
    dir_attr = ' dir="rtl"' if lang in RTL else ''
    alln = [p for _, p in near if p['name']]
    hours_line = TT_R(lang, 'hours_n', n=len(alln), h=sum(1 for p in alln if p.get('oh')), p=sum(1 for p in alln if p.get('phone'))) if len(alln) >= 5 else ''
    faq = []
    for fc in ('food', 'shelter', 'hygiene'):
        fl = [(d, p) for d, p in near if p['cat'] == fc and p['name']]
        if not fl: continue
        lst = ', '.join('%s (%s)' % (p['name'], km(d)) for d, p in fl[:3])
        faq.append((R(lang, 'faq_' + fc, city=city), R(lang, 'faq_ans', list=lst, n=fmt_n(fc, cnt[fc]))))
    # La version inglesa de una ciudad no inglesa (sl.en.html) es una pagina
    # propia: canonical a si misma y hreflang reciproco. Antes apuntaba a la
    # local y Google la descartaba (675 paginas).
    home = main_lang or lang
    self_url = 'https://supportnear.com/c/%s%s' % (sl, '.en' if (main_lang and main_lang != 'en') else '')
    alts = '<link rel="alternate" hreflang="%s" href="https://supportnear.com/c/%s">' % (home, sl)
    if home != 'en':
        alts += '<link rel="alternate" hreflang="en" href="https://supportnear.com/c/%s.en">' % sl
    alts += '<link rel="alternate" hreflang="x-default" href="https://supportnear.com/c/%s">' % sl
    body = f'''<!DOCTYPE html>
<html lang="{lang}"{dir_attr}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{H.escape(title)} · SupportNear</title>
<meta name="description" content="{H.escape(desc)}">
<link rel="canonical" href="{self_url}">{'<meta name="robots" content="noindex,follow">' if noidx else ROBOTS_IDX}
{alts}
<meta property="og:title" content="{H.escape(title)}">
<meta property="og:description" content="{H.escape(desc)}">
<meta property="og:image" content="{social_img(lang)}"><meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="SupportNear: free help near you. Food, a bed, a shower, clothes, a doctor.">
<meta property="og:type" content="website"><meta property="og:site_name" content="SupportNear">
<meta property="og:url" content="{self_url}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@mrstartups">
<meta name="twitter:title" content="{H.escape(title)}"><meta name="twitter:description" content="{H.escape(desc)}">
<meta name="twitter:image" content="{social_img(lang)}">
<meta name="theme-color" content="#0B7A63">
<link rel="icon" href="../favicon.ico" sizes="32x32"><link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../apple-touch-icon.png">
<style>{CSS}{EXTRA_CSS}</style>
<script type="application/ld+json">{json.dumps(ld_clean([{
    "@context": "https://schema.org", "@type": "WebPage", "name": title, "description": desc, "inLanguage": lang,
    "url": self_url,
    "isPartOf": {"@type": "WebSite", "name": "SupportNear", "url": "https://supportnear.com/"},
    "about": {"@type": "City", "name": city, "containedInPlace": {"@type": "Country", "name": country}},
    "dateModified": DATEMARK
  }, {
    "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
      {"@type": "ListItem", "position": 1, "name": "SupportNear", "item": "https://supportnear.com/"},
      {"@type": "ListItem", "position": 2, "name": TT(lang, 'cp.cities'), "item": "https://supportnear.com/c/"},
      {"@type": "ListItem", "position": 3, "name": city, "item": "https://supportnear.com/c/%s" % sl}]
  }, {
    "@context": "https://schema.org", "@type": "ItemList", "name": TT(lang, 'cp.closest'),
    "itemListElement": [{"@type": "ListItem", "position": i + 1, "item": {"@type": "Place", "name": p['name'],
       "address": p.get('addr') or None, "telephone": p.get('phone') or None, "openingHours": ld_oh(p.get('oh')),
       "geo": {"@type": "GeoCoordinates", "latitude": round(p['lat'], 5), "longitude": round(p['lon'], 5)},
       "url": purl(p, 'https://supportnear.com/')}} for i, (_, p) in enumerate(named[:10])]
  }] + ([{"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
      {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq]}] if faq else [])), ensure_ascii=False).replace('</', LDESC)}</script>
</head>
<body>
<div class="wrap">
{header('../?city=' + qcity, TT(lang, 'cp.open', city=city))}
<h1>{H.escape(TT(lang, 'cp.h1', city=city))}{(' <small style="font-weight:400;color:var(--ink-3)">· ' + H.escape(local) + '</small>') if local else ''}</h1>
<p class="lede">{H.escape(TT(lang, 'cp.ledeN', list=cap(lst3), city=city, country=country) if lst3 else TT(lang, 'cp.lede', n=total, city=city, country=country))}{(' ' + H.escape(TT(lang, 'cp.few'))) if few else ''}</p>
<div class="btns"><a class="btn btn--p" href="../?city={qcity}">{H.escape(TT(lang, 'cp.btn', city=city))}</a>
<a class="btn" href="../instalar">{H.escape(TT(lang, 'cp.offline'))}</a></div>
{('<div class="emg"><strong>%s</strong> %s</div>' % (H.escape(TT(lang, 'cp.emg', country=country, n=emgnum)), H.escape(TT(lang, 'cp.emg2')))) if emgnum else ''}
<h2>{H.escape(TT(lang, 'cp.what'))}</h2>
<ul class="cnt">{counts}</ul>
{('<p>' + H.escape(hours_line) + '</p>') if hours_line else ''}
{('<h2>' + H.escape(TT(lang, 'cp.byneed')) + '</h2><p class="needs">' + needlinks + '</p>') if needlinks else ''}
<h2>{H.escape(TT(lang, 'cp.closest'))}</h2>
<p>{H.escape(TT(lang, 'cp.closest2'))}</p>
<ul class="pl">{rows}</ul>
{('<h2>' + H.escape(R(lang, 'faq_h')) + '</h2>' + ''.join('<h3>%s</h3><p>%s</p>' % (H.escape(q), H.escape(a)) for q, a in faq)) if faq else ''}
{('<h2>' + H.escape(R(lang, 'nearby')) + '</h2><p class="needs">' + ''.join('<a href="%s">%s</a>' % (H.escape(s2), H.escape(n2)) for n2, s2 in nearc) + '</p>') if nearc else ''}
{('<p><a class="btn" href="../country/%s">%s</a></p>' % (ccpage, H.escape(R(lang, 'more_cc', country=country)))) if ccpage else ''}
<h2>{H.escape(TT(lang, 'cp.how'))}</h2>
<p>{H.escape(TT(lang, 'cp.how2', C=STATS["cities"], K=STATS["countries"], L=NLANG))}</p>
<div class="btns"><a class="btn btn--p" href="../?city={qcity}">{H.escape(TT(lang, 'cp.btn', city=city))}</a>
<a class="btn" href="{sl}.cartel.html">{H.escape(TT(lang, 'cp.poster'))}</a>
<a class="btn" href="../incrustar?city={qcity}">&lt;/&gt; {H.escape(TT(lang, 'cp.embed'))}</a>
<a class="btn" href="../prensa">{H.escape(TT(lang, 'cp.press'))}</a>
<a class="btn" href="./">{H.escape(TT(lang, 'cp.cities'))}</a>
<a class="btn" href="../t/{sl}.html">{H.escape(TT(lang, 'cp.lite'))}</a></div>
{foot(lang, '../')}
</div>
</body>
</html>'''
    return body, total


def poster(city, country, cc, lang, sl, lat=None, lon=None, local=''):
    """Cartel A4 para imprimir y pegar en una pared: donde no llega una app, llega
    un papel. QR grande, cuatro palabras, el numero de emergencias del pais."""
    cn = CATN.get(lang, CATNAME)
    # el QR lleva el pais: un cartel de London (Canada) leido con un movil con
    # SIM britanica abria Londres (QA C1)
    url = 'https://supportnear.com/?city=' + Q(city) + ('&cc=' + cc if cc else '')
    city = display_name(city, local, lang)[0]
    emg = EMG_N.get(cc); emgnum = emg[0] if emg else ''
    dir_attr = ' dir="rtl"' if lang in RTL else ''
    icons = {'food': '<path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M17 3c-2 0-3 3-3 6v3h3v9"/>',
             'shelter': '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-6h6v6"/>',
             'hygiene': '<path d="M4 4v16M4 6h5a4 4 0 0 1 4 4v1"/><path d="M8 14v.01M11 14v.01M14 14v.01M9 17v.01M12 17v.01"/>',
             'clothes': '<path d="M8 3l4 2 4-2 4 4-3 2v12H7V9L4 7z"/>',
             'health': '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'}
    row = ''.join('<div class="k"><svg viewBox="0 0 24 24">%s</svg><span>%s</span></div>' % (icons[c], H.escape(cn[c])) for c in ['food', 'shelter', 'hygiene', 'clothes', 'health'])
    # cinco sitios con nombre, uno por necesidad, los mas cercanos al centro: el
    # cartel sirve aunque nadie tenga movil con el que leer el QR
    five = []
    if lat is not None:
        near = [(d, q) for d, q in around(lat, lon, 8) if q['name']]
        used = set()
        for c in ['food', 'shelter', 'hygiene', 'health', 'social', 'clothes']:
            for d, q in near:
                if q['cat'] == c and q['id'] not in used and not re.search(r's\.?l\.?u?\.?$|s\.?a\.?$|clear channel|jcdecaux', q['name'], re.I):
                    five.append((d, q)); used.add(q['id']); break
            if len(five) >= 5: break
    subs = SUB_EN
    try:
        if lang != 'en': subs = json.load(io.open('l/%s.json' % lang, encoding='utf-8')).get('sub', SUB_EN)
    except Exception: pass
    five_html = ''
    if five:
        five_html = '<ol class="five">' + ''.join(
            '<li><b>%s</b> <span>%s</span>%s%s%s</li>' % (H.escape(q['name']), H.escape(subs.get(q['sub'], '') or cn[q['cat']]),
              (' &middot; ' + H.escape(q['addr'])) if q['addr'] else '', (' &middot; ' + H.escape(q['phone'])) if q.get('phone') else '',
              (' &middot; ' + H.escape(oh_human(q.get('oh', ''), lang))) if q.get('oh') else '')
            for d, q in five) + '</ol>'
    return f'''<!DOCTYPE html>
<html lang="{lang}"{dir_attr}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{H.escape(TT(lang, 'po.h1'))} · {H.escape(city)} · SupportNear</title>
<meta name="robots" content="noindex">
<style>
@page{{size:A4;margin:0}}
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{background:#fff;color:#111;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}}
.page{{width:210mm;min-height:297mm;margin:0 auto;padding:18mm 16mm 14mm;display:flex;flex-direction:column;position:relative}}
.top{{display:flex;align-items:center;gap:10px;font-weight:800;font-size:22px;letter-spacing:-.02em;color:#0B7A63}}
.top i{{width:34px;height:34px;border-radius:10px;background:#0B7A63;display:inline-grid;place-items:center}}
.top svg{{width:22px;height:22px;stroke:#fff;fill:none;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}}
h1{{font-size:58px;line-height:1.02;letter-spacing:-.03em;margin:14mm 0 6mm;font-weight:900}}
.sub{{font-size:22px;color:#333;line-height:1.35;margin-bottom:8mm}}
.kinds{{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:10mm}}
.k{{border:2px solid #111;border-radius:14px;padding:10px 6px;text-align:center;font-weight:700;font-size:13.5px;line-height:1.15}}
.k svg{{width:30px;height:30px;stroke:#111;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;display:block;margin:0 auto 6px}}
.qrbox{{display:flex;align-items:center;gap:8mm;margin:2mm 0 4mm}}
.qr{{width:62mm;height:62mm;flex:none;border:3px solid #111;border-radius:16px;padding:4mm;background:#fff}}
.five{{padding-inline-start:7mm;margin:0 0 4mm;font-size:13.5px;line-height:1.35}}
.five li{{padding:2.2mm 0;border-bottom:1px dashed #bbb}} .five b{{font-size:15px}} .five span{{color:#444}}
.qr svg{{width:100%;height:100%;display:block}}
.scan{{font-size:24px;font-weight:800;line-height:1.2}}
.scan small{{display:block;font-size:17px;font-weight:500;color:#444;margin-top:8px}}
.url{{font-size:30px;font-weight:900;letter-spacing:-.02em;margin-top:10px;color:#0B7A63;word-break:break-all}}
.free{{margin-top:8mm;font-size:18px;font-weight:700;padding:12px 16px;border-radius:12px;background:#E4F2EE;color:#075443;text-align:center}}
.emg{{margin-top:5mm;font-size:22px;font-weight:900;padding:12px 16px;border-radius:12px;background:#FDECEC;color:#B3261E;text-align:center}}
.foot{{margin-top:auto;padding-top:8mm;font-size:12.5px;color:#555;line-height:1.45}}
.city{{position:absolute;top:18mm;inset-inline-end:16mm;font-size:16px;font-weight:700;color:#555}}
@media print{{.page{{padding:14mm 14mm 10mm}}}}
@media screen{{body{{background:#eee;padding:12px}} .page{{box-shadow:0 4px 30px rgba(0,0,0,.2)}}}}
@media screen and (max-width:830px){{body{{padding:8px 0}}}}
</style><script>/* en el movil el A4 se salia de la pantalla: se encoge a lo ancho (al imprimir sigue siendo A4) */function fit(){{var w=document.documentElement.clientWidth,p=document.querySelector('.page');if(!p)return;p.style.zoom=w<810?(w/800).toFixed(3):''}}addEventListener('DOMContentLoaded',fit);addEventListener('resize',fit);addEventListener('beforeprint',function(){{var p=document.querySelector('.page');if(p)p.style.zoom=''}});addEventListener('afterprint',fit)</script></head><body>
<div class="page">
<div class="top"><i><svg viewBox="0 0 24 24"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><path d="M12 7v6M9 10h6"/></svg></i>SupportNear</div>
<div class="city">{H.escape(city)}</div>
<h1>{H.escape(TT(lang, 'po.h1'))}</h1>
<p class="sub">{H.escape(TT(lang, 'po.sub'))}</p>
<div class="kinds">{row}</div>
<div class="qrbox"><div class="qr">{qr_svg(url)}</div>
<div><div class="scan">{H.escape(TT(lang, 'po.scan'))}<small>{H.escape(TT(lang, 'po.or'))}</small></div>
<div class="url">supportnear.com</div></div></div>
{five_html}
<div class="free">{H.escape(TT(lang, 'po.free'))} · {H.escape(TT(lang, 'po.lang', L=NLANG))}</div>
{('<div class="emg">%s</div>' % H.escape(TT(lang, 'po.emg', n=emgnum))) if emgnum else ''}
<p class="foot">{H.escape(TT(lang, 'po.foot', C=STATS['cities'], K=STATS['countries']))}</p>
</div>
</body></html>'''



# ---------------- una pagina por ciudad y por necesidad ----------------
# La pagina de ciudad responde a «ayuda en Madrid». Nadie escribe eso. Se
# escribe «comedor social madrid», «albergue para dormir barcelona», «douche
# gratuite paris». Cada necesidad con al menos tres sitios con nombre tiene su
# pagina, con la palabra que se busca en el titulo y en el h1, y abre el mapa ya
# filtrado por esa necesidad (?city=X&need=food).
NEED_MIN = 3


def need_page(city, country, cc, lang, sl, cat, near, local='', total=0, main_lang=None, amb=False):
    cn = CATN.get(lang, CATNAME)
    latin = local or city
    city = display_name(latin, city if city != latin else '', lang)[0]
    word = TT(lang, 'pl.' + cat)
    all_c = [(d, q) for d, q in near if q['cat'] == cat]
    items = [(d, q) for d, q in all_c if q['name']][:40]
    ncat = len(all_c)
    h1 = TT(lang, 'cn.h1', need=cap(word), city=city)
    th1 = TT(lang, 'cn.h1', need=cap(word), city='%s (%s)' % (city, country)) if amb else h1
    desc = TT(lang, 'cn.desc', n=fmt_n(cat, ncat), city=city, country=country)
    url = 'https://supportnear.com/c/%s-%s%s' % (sl, cat, '.en' if main_lang else '')
    home = main_lang or lang
    alts_n = ('<link rel="alternate" hreflang="%s" href="https://supportnear.com/c/%s-%s">' % (home, sl, cat)
              + (('<link rel="alternate" hreflang="en" href="https://supportnear.com/c/%s-%s.en">' % (sl, cat)) if (main_lang or NEED_EN.get((sl, cat))) and home != 'en' else '')
              + '<link rel="alternate" hreflang="x-default" href="https://supportnear.com/c/%s-%s">' % (sl, cat))
    emg = EMG_N.get(cc); emgnum = emg[0] if emg else ''
    dir_attr = ' dir="rtl"' if lang in RTL else ''
    subs = SUB_EN
    try:
        if lang != 'en':
            subs = json.load(io.open('l/%s.json' % lang, encoding='utf-8')).get('sub', SUB_EN)
    except Exception:
        pass
    rows = ''.join(
        '<li><div class="pl-h"><a href="%s">%s</a>'
        '<span class="ct">%s</span><span class="d">%s</span></div>%s%s%s</li>'
        % (H.escape(purl(q)), H.escape(q['name']),
           H.escape(subs.get(q['sub'], '') or cn[cat]), H.escape(TT(lang, 'cp.from', d=km(d))),
           ('<span class="ad">%s</span>' % H.escape(q['addr'])) if q['addr'] else '',
           ('<span class="ad">%s</span>' % H.escape(oh_human(q['oh'], lang))) if q.get('oh') else '',
           ('<span class="ad"><a href="tel:%s">%s</a></span>' % (H.escape(re.sub(r'[^+\d]', '', q['phone'])), H.escape(q['phone']))) if q.get('phone') else '')
        for d, q in items)
    others = ''.join('<a href="%s-%s.html">%s</a>' % (sl, c, H.escape(TT(lang, 'pl.' + c)))
                     for c in NEED_ORDER if c != cat and has_need(near, c))
    named_n = sum(1 for _, q in all_c if q['name'])
    ld = json.dumps(ld_clean([{
        "@context": "https://schema.org", "@type": "WebPage", "name": th1, "description": desc,
        "inLanguage": lang, "url": url,
        "isPartOf": {"@type": "WebSite", "name": "SupportNear", "url": "https://supportnear.com/"},
        "about": {"@type": "City", "name": city, "containedInPlace": {"@type": "Country", "name": country}},
        "dateModified": DATEMARK
    }, {
        "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "SupportNear", "item": "https://supportnear.com/"},
            {"@type": "ListItem", "position": 2, "name": city, "item": "https://supportnear.com/c/%s" % sl},
            {"@type": "ListItem", "position": 3, "name": h1, "item": url}]
    }, {
        "@context": "https://schema.org", "@type": "ItemList", "name": h1,
        "itemListElement": [{"@type": "ListItem", "position": i + 1, "item": {"@type": "Place", "name": q['name'],
            "address": q['addr'] or None, "telephone": q.get('phone') or None,
            "openingHours": ld_oh(q.get('oh')),
            "geo": {"@type": "GeoCoordinates", "latitude": round(q['lat'], 5), "longitude": round(q['lon'], 5)},
            "url": purl(q, 'https://supportnear.com/')}}
            for i, (_, q) in enumerate(items[:10])]
    }]), ensure_ascii=False).replace('</', LDESC)
    qcity = Q(latin) + ('&amp;cc=' + cc if cc else '')
    return f"""<!DOCTYPE html>
<html lang="{lang}"{dir_attr}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{H.escape(th1)} · SupportNear</title>
<meta name="description" content="{H.escape(desc)}">
<link rel="canonical" href="{url}">{ROBOTS_IDX}
{alts_n}
<meta property="og:title" content="{H.escape(th1)}">
<meta property="og:description" content="{H.escape(desc)}">
<meta property="og:image" content="{social_img(lang)}"><meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="SupportNear: free help near you. Food, a bed, a shower, clothes, a doctor.">
<meta property="og:type" content="website"><meta property="og:site_name" content="SupportNear">
<meta property="og:url" content="{url}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@mrstartups">
<meta name="twitter:title" content="{H.escape(th1)}"><meta name="twitter:description" content="{H.escape(desc)}">
<meta name="twitter:image" content="{social_img(lang)}">
<meta name="theme-color" content="#0B7A63">
<link rel="icon" href="../favicon.ico" sizes="32x32"><link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../apple-touch-icon.png">
<style>{CSS}{EXTRA_CSS}</style>
<script type="application/ld+json">{ld}</script>
</head>
<body>
<div class="wrap">
{header(sl + ('.en' if main_lang else '') + '.html', TT(lang, 'cn.all', city=city))}
<h1>{H.escape(h1)}</h1>
<p class="lede">{H.escape(TT(lang, 'cn.lede', n=fmt_n(cat, ncat), city=city))}</p>
<div class="btns"><a class="btn btn--p" href="../?city={qcity}&amp;need={cat}">{H.escape(TT(lang, 'cn.btn', city=city))}</a>
<a class="btn" href="../instalar">{H.escape(TT(lang, 'cp.offline'))}</a></div>
{('<div class="emg"><strong>%s</strong> %s</div>' % (H.escape(TT(lang, 'cp.emg', country=country, n=emgnum)), H.escape(TT(lang, 'cp.emg2')))) if emgnum else ''}
<h2>{H.escape(TT(lang, 'cn.list'))}</h2>
<p class="note">{H.escape(TT(lang, 'cn.check'))}</p>
<ul class="pl">{rows}</ul>
{('<p class="note">' + H.escape(TT(lang, 'cn.unnamed', k=ncat - named_n)) + '</p>') if ncat - named_n >= 3 else ''}
{('<p><a class="btn" href="%s-volunteer">%s</a></p>' % (sl, H.escape(R(lang, 'vol_link')))) if cat == 'food' and not main_lang else ''}{('<h2>' + H.escape(TT(lang, 'cn.other', city=city)) + '</h2><p class="needs">' + others + '</p>') if others else ''}
<h2>{H.escape(TT(lang, 'cp.how'))}</h2>
<p>{H.escape(TT(lang, 'cp.how2', C=STATS["cities"], K=STATS["countries"], L=NLANG))}</p>
<div class="btns"><a class="btn btn--p" href="../?city={qcity}&amp;need={cat}">{H.escape(TT(lang, 'cn.btn', city=city))}</a>
<a class="btn" href="{sl}.cartel.html">{H.escape(TT(lang, 'cp.poster'))}</a>
<a class="btn" href="./">{H.escape(TT(lang, 'cp.cities'))}</a></div>
{foot(lang, '../')}
</div>
</body>
</html>"""


def vol_page(city, country, cc, lang, sl, near, local='', amb=False):
    latin = local or city
    city = display_name(latin, city if city != latin else '', lang)[0]
    cn = CATN.get(lang, CATNAME)
    try: subs = SUB_EN if lang == 'en' else json.load(io.open('l/%s.json' % lang, encoding='utf-8')).get('sub', SUB_EN)
    except Exception: subs = SUB_EN
    items = [(d, q) for d, q in near if q['cat'] == 'food' and q['name']][:40]
    h1 = R(lang, 'vol_h1', city=city)
    th1 = R(lang, 'vol_h1', city='%s (%s)' % (city, country)) if amb else h1
    lede = R(lang, 'vol_lede', n=len(items), city=city)
    url = 'https://supportnear.com/c/%s-volunteer' % sl
    dir_attr = ' dir="rtl"' if lang in RTL else ''
    rows = ''.join(
        '<li><div class="pl-h"><a href="%s">%s</a><span class="ct">%s</span><span class="d">%s</span></div>%s%s%s</li>'
        % (H.escape(purl(q)), H.escape(q['name']), H.escape(subs.get(q['sub'], '') or cn['food']), H.escape(TT(lang, 'cp.from', d=km(d))),
           ('<span class="ad">%s</span>' % H.escape(q['addr'])) if q['addr'] else '',
           ('<span class="ad">%s</span>' % H.escape(oh_human(q['oh'], lang))) if q.get('oh') else '',
           ('<span class="ad"><a href="tel:%s">%s</a></span>' % (H.escape(re.sub(r'[^+\d]', '', q['phone'])), H.escape(q['phone']))) if q.get('phone') else '')
        for d, q in items)
    ld = json.dumps(ld_clean([{"@context": "https://schema.org", "@type": "WebPage", "name": th1, "description": lede, "inLanguage": lang, "url": url,
                               "isPartOf": {"@type": "WebSite", "name": "SupportNear", "url": "https://supportnear.com/"},
                               "about": {"@type": "City", "name": city, "containedInPlace": {"@type": "Country", "name": country}}, "dateModified": DATEMARK},
                              {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
                                  {"@type": "ListItem", "position": 1, "name": "SupportNear", "item": "https://supportnear.com/"},
                                  {"@type": "ListItem", "position": 2, "name": city, "item": "https://supportnear.com/c/%s" % sl},
                                  {"@type": "ListItem", "position": 3, "name": h1, "item": url}]}]), ensure_ascii=False).replace('</', LDESC)
    return f"""<!DOCTYPE html>
<html lang="{lang}"{dir_attr}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{H.escape(th1)} · SupportNear</title>
<meta name="description" content="{H.escape(lede[:300])}">
<link rel="canonical" href="{url}">{ROBOTS_IDX}
<meta property="og:title" content="{H.escape(th1)}"><meta property="og:description" content="{H.escape(lede[:300])}">
<meta property="og:image" content="{social_img(lang)}"><meta property="og:type" content="website"><meta property="og:site_name" content="SupportNear">
<meta property="og:url" content="{url}"><meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0B7A63">
<link rel="icon" href="../favicon.ico" sizes="32x32"><link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../apple-touch-icon.png">
<style>{CSS}{EXTRA_CSS}</style>
<script type="application/ld+json">{ld}</script>
</head>
<body>
<div class="wrap">
{header(sl + '-food', TT(lang, 'cn.h1', need=cap(TT(lang, 'pl.food')), city=city))}
<h1>{H.escape(h1)}</h1>
<p class="lede">{H.escape(lede)}</p>
<ul class="pl">{rows}</ul>
<div class="btns"><a class="btn btn--p" href="{sl}-food">{H.escape(TT(lang, 'cn.h1', need=cap(TT(lang, 'pl.food')), city=city))}</a>
<a class="btn" href="{sl}">{H.escape(TT(lang, 'cp.h1', city=city))}</a></div>
{foot(lang, '../')}
</div>
</body>
</html>"""


def has_need(near, c):
    named = sum(1 for _, q in near if q['cat'] == c and q['name'])
    if named >= NEED_MIN:
        return True
    # lo que mas se busca (comer, dormir, ducharse) tiene pagina con algo menos:
    # 2 con nombre y 3 en total. La pagina lo dice tal cual.
    return c in ('food', 'shelter', 'hygiene') and named >= 2 and sum(1 for _, q in near if q['cat'] == c) >= 3


os.makedirs('c', exist_ok=True)
os.makedirs('t', exist_ok=True)
for f in os.listdir('t'):
    if f.endswith('.html'): os.remove(os.path.join('t', f))
lite_idx = []


def lite(city, country, lat, lon, cc, lang, sl, near=None, index=True, local='', amb=False):
    """Version de texto: menos de 5 KB, sin CSS que importe, sin script. Para un
    Nokia con Opera Mini, un movil de 2012 o una conexion que se cae. Diez
    sitios con calle, telefono y horario, y el numero de emergencias.

    Hasta hoy llevaba noindex y no estaba en el sitemap: la unica pagina que
    abre en dos segundos con una conexion de 2G era justo la que Google no
    podia ensenar. Ahora se indexa ella misma (canonical a si misma) siempre
    que tenga algo que contar; las que casi no tienen sitios siguen fuera."""
    if near is None:
        near = around(lat, lon, 10)
    near = [(d, q) for d, q in near if q['name']][:10]
    cn = CATN.get(lang, CATNAME)
    # el nombre como en la pagina de la ciudad: «Миколаїв», no «Mykolaiv», en la
    # version ucraniana (QA m10); y el pais si el nombre se repite (m2)
    city = display_name(city, local, lang)[0]
    tcity = '%s (%s)' % (city, country) if amb else city
    url = 'https://supportnear.com/t/%s' % sl
    ld = json.dumps([{"@context": "https://schema.org", "@type": "WebPage", "name": TT(lang, 'cp.h1', city=tcity),
                      "description": TT(lang, 'cn.desc', n=len(near), city=city, country=country), "inLanguage": lang, "url": url,
                      "isPartOf": {"@type": "WebSite", "name": "SupportNear", "url": "https://supportnear.com/"},
                      "about": {"@type": "City", "name": city}, "dateModified": DATEMARK},
                     {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
                         {"@type": "ListItem", "position": 1, "name": "SupportNear", "item": "https://supportnear.com/"},
                         {"@type": "ListItem", "position": 2, "name": TT(lang, 'cp.lite'), "item": "https://supportnear.com/t/"},
                         {"@type": "ListItem", "position": 3, "name": city, "item": url}]}], ensure_ascii=False).replace('</', LDESC)
    subs = SUB_EN
    try:
        if lang != 'en': subs = json.load(io.open('l/%s.json' % lang, encoding='utf-8')).get('sub', SUB_EN)
    except Exception: pass
    emg = EMG_N.get(cc); emgnum = emg[0] if emg else ''
    dir_attr = ' dir="rtl"' if lang in RTL else ''
    items = ''.join('<li><b>%s</b> (%s)%s%s%s <small>%s</small></li>' % (
        H.escape(q['name']), H.escape(subs.get(q['sub'], '') or cn[q['cat']]),
        (' - ' + H.escape(q['addr'])) if q['addr'] else '',
        (' - <a href="tel:%s">%s</a>' % (H.escape(re.sub(r'[^+\d]', '', q['phone'])), H.escape(q['phone']))) if q.get('phone') else '',
        (' - ' + H.escape(oh_human(q['oh'], lang))) if q.get('oh') else '', H.escape(km(d))) for d, q in near)
    return ('<!DOCTYPE html><html lang="%s"%s><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>%s · SupportNear</title><meta name="robots" content="%s"><link rel="canonical" href="https://supportnear.com/c/%s">'
            '<link rel="alternate" hreflang="' + lang + '" href="' + url + '"><link rel="alternate" hreflang="x-default" href="' + url + '">'
            '<script type="application/ld+json">' + ld + '</script>'
            '<meta name="description" content="%s">'
            '<meta property="og:title" content="%s"><meta property="og:image" content="%s"><meta property="og:url" content="https://supportnear.com/t/%s"><meta name="twitter:card" content="summary_large_image">'
            '<style>body{font:16px/1.5 sans-serif;margin:12px;max-width:40em}li{margin:0 0 10px}small{color:#555}</style></head><body>'
            '<p><b>SupportNear</b> - %s</p><h1>%s</h1>%s<ol>%s</ol>'
            '<p><a href="../c/%s.html">%s</a> - <a href="../">supportnear.com</a> - <a href="./">%s</a></p>'
            '<p><small>OpenStreetMap (ODbL)</small></p></body></html>') % (
        lang, dir_attr, H.escape(TT(lang, 'cp.h1', city=tcity)),
        'index,follow' if index else 'noindex,follow', sl,
        H.escape(TT(lang, 'cn.desc', n=len(near), city=city, country=country)),
        H.escape(TT(lang, 'cp.h1', city=city)), social_img(lang), sl, H.escape(TT(lang, 'po.free')),
        H.escape(TT(lang, 'cp.h1', city=city)),
        ('<p><b>%s</b></p>' % H.escape(TT(lang, 'po.emg', n=emgnum))) if emgnum else '', items,
        sl, H.escape(TT(lang, 'cp.closest')), H.escape(TT(lang, 'cp.cities')))

for f in os.listdir('c'):
    if f.endswith('.html'):
        os.remove(os.path.join('c', f))

# ---- el nombre limpio, para la ciudad que la gente busca ----
# Ocho nombres estan repetidos en el mundo: Valencia, Cordoba, Santiago, Toledo,
# Merida... Hasta hoy se quedaba con /c/valencia.html la primera que salia en la
# lista, y esa era Valencia de Venezuela: quien buscaba «comedor social
# valencia» desde Espana aterrizaba en la pagina equivocada. Ahora el nombre
# limpio es de la que mas sitios tiene mapeados y las demas llevan el pais
# detras, y el indice de ciudades usa exactamente este mismo mapa (antes no: el
# indice enlazaba a slugs que no existian).
CINFO = []
for c in CITIES:
    raw, lat, lon, country = c[0], c[1], c[2], c[3] or ''
    name, local = split_name(raw)
    cc = (c[4] if len(c) > 4 and c[4] else '') or CC.get((round(lat, 3), round(lon, 3)), '')
    if cc == 'ES' or (not cc and ((35.0 <= lat <= 44.0 and -9.5 <= lon <= 4.5) or (27.5 <= lat <= 29.5 and -18.5 <= lon <= -13.3))):
        cc = 'ES'          # las 48 ciudades espanolas vienen con la comunidad en vez del pais
        country = 'España'
    CINFO.append({'raw': raw, 'name': name, 'local': local, 'lat': lat, 'lon': lon,
                  'country': country, 'cc': cc, 'near': around(lat, lon, 10)})

_by = {}
for i, ci in enumerate(CINFO):
    _by.setdefault(slug(ci['name']), []).append(i)
# Las URL ya publicadas de los nombres repetidos no se mueven aunque cambien los
# datos (antes la limpia se la quedaba la que mas sitios tuviera ese dia).
PINNED = {('london', 'GB'): 'london', ('london', 'CA'): 'london-canada', ('hyderabad', 'IN'): 'hyderabad',
          ('hyderabad', 'PK'): 'hyderabad-pakistan', ('guadalajara', 'MX'): 'guadalajara', ('guadalajara', 'ES'): 'guadalajara-espana',
          ('valencia', 'ES'): 'valencia', ('valencia', 'VE'): 'valencia-venezuela', ('tripoli', 'LY'): 'tripoli',
          ('tripoli', 'LB'): 'tripoli-lebanon', ('cordoba', 'AR'): 'cordoba', ('cordoba', 'ES'): 'cordoba-espana',
          ('leon', 'MX'): 'leon', ('leon', 'NI'): 'leon-nicaragua', ('leon', 'ES'): 'leon-espana',
          ('cartagena', 'ES'): 'cartagena', ('cartagena', 'CO'): 'cartagena-colombia', ('san-jose', 'US'): 'san-jose',
          ('san-jose', 'CR'): 'san-jose-costa-rica', ('merida', 'VE'): 'merida', ('merida', 'MX'): 'merida-mexico',
          ('barcelona', 'ES'): 'barcelona', ('barcelona', 'VE'): 'barcelona-venezuela'}
AMB = set()
_dups = 0
for base, idxs in _by.items():
    if len(idxs) == 1:
        CINFO[idxs[0]]['sl'] = base
        continue
    _dups += 1
    for i in idxs:
        AMB.add(i)
    if all((base, CINFO[i]['cc']) in PINNED for i in idxs) and len({CINFO[i]['cc'] for i in idxs}) == len(idxs):
        for i in idxs:
            CINFO[i]['sl'] = PINNED[(base, CINFO[i]['cc'])]
        continue
    idxs.sort(key=lambda i: (-len(CINFO[i]['near']), CINFO[i]['country']))
    CINFO[idxs[0]]['sl'] = base
    taken = set(_by)
    for i in idxs[1:]:
        stem = base + '-' + (slug(CINFO[i]['country']) or CINFO[i]['cc'].lower() or 'x')
        sl2, k = stem, 2
        while sl2 in taken:
            sl2 = '%s-%d' % (stem, k); k += 1
        taken.add(sl2); CINFO[i]['sl'] = sl2
print('nombres repetidos resueltos:', _dups)

urls = []; empty = 0; needs_made = 0

# ---- R24: rejilla de ciudades (vecinas, pais y ciudad de cada sitio) ----
_cgrid = {}
for _k, _ci in enumerate(CINFO):
    _cgrid.setdefault((int(_ci['lat'] // 2), int(_ci['lon'] // 2)), []).append(_k)


def near_cities(lat, lon, km_max, skip=None, n=6):
    out = []
    gi, gj = int(lat // 2), int(lon // 2)
    for i in range(gi - 2, gi + 3):
        for j in range(gj - 2, gj + 3):
            for k in _cgrid.get((i, j), []):
                if k == skip: continue
                d = hav(lat, lon, CINFO[k]['lat'], CINFO[k]['lon'])
                if d <= km_max * 1000: out.append((d, k))
    out.sort()
    return [k for _, k in out[:n]]


CC_SLUG = {}
_ccn = Counter(ci['cc'] for ci in CINFO if ci['cc'])
for ci in CINFO:
    if ci['cc'] and _ccn[ci['cc']] >= 2 and ci['cc'] not in CC_SLUG:
        CC_SLUG[ci['cc']] = slug(ci['country'] or ci['cc'])
_seen_cs = {}
for _cc, _cs in sorted(CC_SLUG.items()):
    if _cs in _seen_cs: CC_SLUG[_cc] = _cs + '-' + _cc.lower()
    _seen_cs[_cs] = 1

# ---- R24: pagina por sitio ----
PLACE_CATS = ('food', 'shelter', 'hygiene', 'clothes', 'legal')
PLACES_P = []
_taken = set()
for p in places:
    if p['cat'] in PLACE_CATS and p['name'] and (p['oh'] or p['phone']):
        ks = near_cities(p['lat'], p['lon'], 30, n=1)
        if not ks: continue
        oid = str(p['id'])
        tag = {'node': 'n', 'way': 'w', 'relation': 'r'}.get(oid.split('/')[0], 'x') + re.sub(r'\D', '', oid)
        base = (slug(p['name'])[:60].strip('-') or 'place') + '-' + tag
        if base in _taken: continue
        _taken.add(base)
        PLACES_P.append((p, ks[0], base))
# nombres que no son nombres: el operador copiado en cada aseo («JCDecaux», «City
# of Toronto», «مركز ايواء» = «centro de acogida») o de 1-2 letras. Si un nombre se
# repite 3+ veces en la misma ciudad, las paginas saldrian con el mismo titulo.
_nn = Counter((k, p['name'].strip().lower()) for p, k, _ in PLACES_P)
_pp = []
for p, k, base in PLACES_P:
    if len(p['name'].strip()) < 3 or _nn[(k, p['name'].strip().lower())] >= 3: continue
    PLACE_URL[p['id']] = base
    _pp.append((p, k))
PLACES_P = _pp
print('paginas de sitio:', len(PLACES_P))

# Las ciudades no inglesas con bastante de una necesidad tienen tambien la pagina
# en ingles («food banks in Madrid»): quien llega de fuera busca en ingles.
NEED_EN = {}
for _ci in CINFO:
    _lang = LANG_BY_CC.get(_ci['cc'], 'en')
    if _lang == 'en': continue
    _nc = Counter(q['cat'] for _, q in _ci['near'] if q['name'])
    for _c in NEED_ORDER:
        if _nc[_c] >= 8: NEED_EN[(_ci['sl'], _c)] = 1
needs_en = 0
for _i, ci in enumerate(CINFO):
    name, local, lat, lon = ci['name'], ci['local'], ci['lat'], ci['lon']
    country, cc, sl, near = ci['country'], ci['cc'], ci['sl'], ci['near']
    amb = _i in AMB
    lang = LANG_BY_CC.get(cc, 'en')
    CUR['cc'] = cc
    country_en = country
    country = country_in(cc, lang, country)
    ncnt = Counter(q['cat'] for _, q in near if q['name'])
    acnt = Counter(q['cat'] for _, q in near)
    needs = [(c, acnt[c]) for c in NEED_ORDER if has_need(near, c)]
    noidx = sum(ncnt.values()) == 0          # R24: sin ningun sitio con nombre no hay nada que ensenar a Google
    nearc_l = [(display_name(CINFO[k]['name'], CINFO[k]['local'], lang)[0], CINFO[k]['sl']) for k in near_cities(lat, lon, 250, skip=_i)]
    nearc_e = [(display_name(CINFO[k]['name'], CINFO[k]['local'], 'en')[0], CINFO[k]['sl']) for k in near_cities(lat, lon, 250, skip=_i)]
    ccp = CC_SLUG.get(cc, '')
    body, total = page(name, country, lat, lon, cc, local, ci['raw'], lang, near, sl, needs, amb=amb, nearc=nearc_l, ccpage=ccp, noidx=noidx)
    if total == 0:
        empty += 1
    save(os.path.join('c', sl + '.html'), 'https://supportnear.com/c/%s' % sl, body)
    if not noidx:
        urls.append(('https://supportnear.com/c/%s' % sl, 0.6 if total >= 15 else 0.4))
    if lang != 'en':
        # la version inglesa tambien, para quien llega de fuera
        body_en, _ = page(name, country_en if cc != 'ES' else 'Spain', lat, lon, cc, local, ci['raw'], 'en', near, sl, needs, main_lang=lang, amb=amb,
                          nearc=nearc_e, ccpage=ccp, noidx=noidx)
        save(os.path.join('c', sl + '.en.html'), 'https://supportnear.com/c/%s.en' % sl, body_en)
        if not noidx:
            urls.append(('https://supportnear.com/c/%s.en' % sl, 0.3))
    ci['lang'] = lang; ci['needs'] = dict(needs); ci['noidx'] = noidx
    # una pagina por necesidad: «comedores sociales en Madrid», «albergues en
    # Barcelona». Es la busqueda que existe de verdad.
    cname = local if (lang != 'en' and local) else name
    for cat, k in needs:
        save(os.path.join('c', '%s-%s.html' % (sl, cat)), 'https://supportnear.com/c/%s-%s' % (sl, cat),
             need_page(cname, country, cc, lang, sl, cat, near, name, total, amb=amb))
        urls.append(('https://supportnear.com/c/%s-%s' % (sl, cat), 0.7 if k >= 8 else 0.5))
        needs_made += 1
        if NEED_EN.get((sl, cat)):
            save(os.path.join('c', '%s-%s.en.html' % (sl, cat)), 'https://supportnear.com/c/%s-%s.en' % (sl, cat),
                 need_page(name, country_en if cc != 'ES' else 'Spain', cc, 'en', sl, cat, near, name, total, main_lang=lang, amb=amb))
            urls.append(('https://supportnear.com/c/%s-%s.en' % (sl, cat), 0.4))
            needs_en += 1
    if 'food' in dict(needs):
        save(os.path.join('c', '%s-volunteer.html' % sl), 'https://supportnear.com/c/%s-volunteer' % sl,
             vol_page(cname, country, cc, lang, sl, near, name, amb=amb))
        urls.append(('https://supportnear.com/c/%s-volunteer' % sl, 0.5))
    save(os.path.join('c', sl + '.cartel.html'), None, poster(name, country, cc, lang, sl, lat, lon, local))
    nlite = sum(1 for _, q in near if q['name'])
    save(os.path.join('t', sl + '.html'), 'https://supportnear.com/t/%s' % sl,
         lite(name, country, lat, lon, cc, lang, sl, near, nlite >= 5, local, amb))
    lite_idx.append((country, name, sl))       # R24: /t/ ya no va al sitemap (canonica a /c/)
print('paginas ciudad x necesidad:', needs_made, '| en ingles:', needs_en)

# ---- R24: una pagina por sitio ----
os.makedirs('s', exist_ok=True)
for f in os.listdir('s'):
    if f.endswith('.html'): os.remove(os.path.join('s', f))
_PCSS = '.facts{display:grid;grid-template-columns:max-content 1fr;gap:6px 14px;margin:14px 0}.facts dt{color:var(--ink-3);font-size:14px}.facts dd{margin:0}'
for p, k in PLACES_P:
    ci = CINFO[k]
    CUR['cc'] = ci['cc']
    lang = ci.get('lang') or LANG_BY_CC.get(ci['cc'], 'en')
    cn = CATN.get(lang, CATNAME)
    try: subs = SUB_EN if lang == 'en' else json.load(io.open('l/%s.json' % lang, encoding='utf-8')).get('sub', SUB_EN)
    except Exception: subs = SUB_EN
    kind = subs.get(p['sub'], '') or cn[p['cat']]
    city = display_name(ci['name'], ci['local'], lang)[0]
    country = country_in(ci['cc'], lang, ci['country'])
    sl, slp = ci['sl'], PLACE_URL[p['id']]
    url = 'https://supportnear.com/s/' + slp
    ohh = oh_human(p['oh'], lang) if p.get('oh') else ''
    title = '%s — %s · %s' % (p['name'], kind, city)
    desc = ' · '.join(x for x in [kind + ', ' + city, p['addr'] if p['addr'].strip().lower() != city.lower() else '', (AT(lang, 'ui.hours', 'Hours') + ': ' + ohh) if ohh else '', p['phone']] if x)[:300]
    emg = EMG_N.get(ci['cc']); emgnum = emg[0] if emg else ''
    needp = ci.get('needs', {}).get(p['cat']) is not None
    near_p = [(d, q) for d, q in around(p['lat'], p['lon'], 3) if q['name'] and q['id'] != p['id'] and q['cat'] in PLACE_CATS + ('social', 'health')][:8]
    nrows = ''.join('<li><div class="pl-h"><a href="%s">%s</a><span class="ct">%s</span><span class="d">%s</span></div></li>'
                    % (H.escape(purl(q)), H.escape(q['name']), H.escape(subs.get(q['sub'], '') or cn[q['cat']]), H.escape(km(d))) for d, q in near_p)
    tel = re.sub(r'[^+\d]', '', p['phone']) if p.get('phone') else ''
    crumbs = [{"@type": "ListItem", "position": 1, "name": "SupportNear", "item": "https://supportnear.com/"},
              {"@type": "ListItem", "position": 2, "name": city, "item": "https://supportnear.com/c/%s" % sl}]
    if needp:
        crumbs.append({"@type": "ListItem", "position": 3, "name": TT(lang, 'cn.h1', need=cap(TT(lang, 'pl.' + p['cat'])), city=city), "item": "https://supportnear.com/c/%s-%s" % (sl, p['cat'])})
    crumbs.append({"@type": "ListItem", "position": len(crumbs) + 1, "name": p['name'], "item": url})
    ld = json.dumps(ld_clean([{"@context": "https://schema.org", "@type": "Place", "name": p['name'], "description": kind,
                               "address": p['addr'] or None, "telephone": p.get('phone') or None, "openingHours": ld_oh(p.get('oh')),
                               "geo": {"@type": "GeoCoordinates", "latitude": round(p['lat'], 5), "longitude": round(p['lon'], 5)},
                               "containedInPlace": {"@type": "City", "name": city}, "url": url,
                               "sameAs": "https://www.openstreetmap.org/" + str(p['id'])},
                              {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": crumbs}]),
                    ensure_ascii=False).replace('</', LDESC)
    dir_attr = ' dir="rtl"' if lang in RTL else ''
    mapu = '../#p=%s@%.5f,%.5f' % (p['id'], p['lat'], p['lon'])
    body = f"""<!DOCTYPE html>
<html lang="{lang}"{dir_attr}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{H.escape(title)} · SupportNear</title>
<meta name="description" content="{H.escape(desc)}">
<link rel="canonical" href="{url}">{ROBOTS_IDX}
<meta property="og:title" content="{H.escape(title)}"><meta property="og:description" content="{H.escape(desc)}">
<meta property="og:image" content="{social_img(lang)}"><meta property="og:type" content="website"><meta property="og:site_name" content="SupportNear">
<meta property="og:url" content="{url}"><meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0B7A63">
<link rel="icon" href="../favicon.ico" sizes="32x32"><link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../apple-touch-icon.png">
<style>{CSS}{EXTRA_CSS}{_PCSS}</style>
<script type="application/ld+json">{ld}</script>
</head>
<body>
<div class="wrap">
{header(('../c/%s-%s' % (sl, p['cat'])) if needp else ('../c/' + sl), TT(lang, 'cn.h1', need=cap(TT(lang, 'pl.' + p['cat'])), city=city) if needp else TT(lang, 'cp.h1', city=city))}
<h1>{H.escape(p['name'])}</h1>
<p class="lede">{H.escape(kind)} · <a href="../c/{sl}">{H.escape(city)}</a>, {H.escape(country)}</p>
<dl class="facts">
<dt>{H.escape(AT(lang, 'ui.addr', 'Address'))}</dt><dd>{H.escape(p['addr']) if p['addr'] else H.escape(AT(lang, 'ui.addrno', 'No street name. Use the map.'))}</dd>
<dt>{H.escape(AT(lang, 'ui.hours', 'Hours'))}</dt><dd>{H.escape(ohh) if ohh else H.escape(AT(lang, 'hours.none', 'We do not know the hours. Call before you go if you can.'))}</dd>
{('<dt>%s</dt><dd><a href="tel:%s">%s</a></dd>' % (H.escape(AT(lang, 'ui.phone', 'Phone')), H.escape(tel), H.escape(p['phone']))) if tel else ''}
</dl>
<div class="btns"><a class="btn btn--p" href="{mapu}">{H.escape(AT(lang, 'cta.open', 'Open the map'))}</a>
{('<a class="btn" href="tel:%s">%s</a>' % (H.escape(tel), H.escape(AT(lang, 'ui.call', 'Call')))) if tel else ''}</div>
{('<div class="emg"><strong>%s</strong> %s</div>' % (H.escape(TT(lang, 'cp.emg', country=country, n=emgnum)), H.escape(TT(lang, 'cp.emg2')))) if emgnum else ''}
{('<h2>' + H.escape(R(lang, 'near_help')) + '</h2><ul class="pl">' + nrows + '</ul>') if nrows else ''}
<p class="note"><a href="https://www.openstreetmap.org/{p['id']}" rel="noopener" target="_blank">{H.escape(R(lang, 'osm'))}</a></p>
<div class="btns"><a class="btn" href="../c/{sl}">{H.escape(TT(lang, 'cp.h1', city=city))}</a>
{('<a class="btn" href="../c/%s-%s">%s</a>' % (sl, p['cat'], H.escape(TT(lang, 'cn.h1', need=cap(TT(lang, 'pl.' + p['cat'])), city=city)))) if needp else ''}</div>
{foot(lang, '../')}
</div>
</body>
</html>"""
    save(os.path.join('s', slp + '.html'), url, body)
    urls.append((url, 0.5))

# ---- R24: una pagina por pais (2+ ciudades) ----
os.makedirs('datos', exist_ok=True)
for f in os.listdir('datos'):
    if f.endswith('.csv') or f.endswith('.html'): os.remove(os.path.join('datos', f))
os.makedirs('country', exist_ok=True)
for f in os.listdir('country'):
    if f.endswith('.html'): os.remove(os.path.join('country', f))
_bycc = {}; DATOS = []
for ci in CINFO:
    if ci['cc'] in CC_SLUG: _bycc.setdefault(ci['cc'], []).append(ci)
_TCATS = ['food', 'shelter', 'hygiene', 'health']
for cc, cis in sorted(_bycc.items()):
    lang = LANG_BY_CC.get(cc, 'en')
    CUR['cc'] = cc
    cn = CATN.get(lang, CATNAME)
    country = country_in(cc, lang, cis[0]['country'])
    cs = CC_SLUG[cc]; url = 'https://supportnear.com/country/' + cs
    rows_c = []
    for ci in sorted(cis, key=lambda c: -len(c['near'])):
        cnt = Counter(q['cat'] for _, q in ci['near'])
        nm = display_name(ci['name'], ci['local'], lang)[0]
        rows_c.append('<tr><td><a href="../c/%s">%s</a></td>%s</tr>' % (ci['sl'], H.escape(nm),
                      ''.join(('<td><a href="../c/%s-%s">%d</a></td>' % (ci['sl'], c, cnt[c])) if c in ci.get('needs', {}) else '<td>%d</td>' % cnt[c] for c in _TCATS)))
    h1 = TT(lang, 'cp.h1', city=country)
    lede = R(lang, 'cc_lede', country=country, n=len(cis))
    emg = EMG_N.get(cc); emgnum = emg[0] if emg else ''
    dir_attr = ' dir="rtl"' if lang in RTL else ''
    ld = json.dumps([{"@context": "https://schema.org", "@type": "CollectionPage", "name": h1, "description": lede, "inLanguage": lang, "url": url,
                      "isPartOf": {"@type": "WebSite", "name": "SupportNear", "url": "https://supportnear.com/"},
                      "about": {"@type": "Country", "name": country}, "dateModified": DATEMARK},
                     {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
                         {"@type": "ListItem", "position": 1, "name": "SupportNear", "item": "https://supportnear.com/"},
                         {"@type": "ListItem", "position": 2, "name": TT(lang, 'cp.cities'), "item": "https://supportnear.com/c/"},
                         {"@type": "ListItem", "position": 3, "name": country, "item": url}]}], ensure_ascii=False).replace('</', LDESC)
    save(os.path.join('country', cs + '.html'), url, f"""<!DOCTYPE html>
<html lang="{lang}"{dir_attr}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{H.escape(h1)} · SupportNear</title>
<meta name="description" content="{H.escape(lede)}">
<link rel="canonical" href="{url}">{ROBOTS_IDX}
<meta property="og:title" content="{H.escape(h1)}"><meta property="og:description" content="{H.escape(lede)}">
<meta property="og:image" content="{social_img(lang)}"><meta property="og:type" content="website"><meta property="og:site_name" content="SupportNear">
<meta property="og:url" content="{url}"><meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0B7A63">
<link rel="icon" href="../favicon.ico" sizes="32x32"><link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../apple-touch-icon.png">
<style>{CSS}{EXTRA_CSS}
table{{width:100%;border-collapse:collapse;font-size:15px}} td,th{{border-bottom:1px solid var(--line);padding:8px 6px;text-align:start}} th{{font-size:13px;color:var(--ink-3)}} .tw{{overflow-x:auto}}</style>
<script type="application/ld+json">{ld}</script>
</head>
<body>
<div class="wrap">
{header('../c/', TT(lang, 'cp.cities'))}
<h1>{H.escape(h1)}</h1>
<p class="lede">{H.escape(lede)}</p>
{('<div class="emg"><strong>%s</strong> %s</div>' % (H.escape(TT(lang, 'cp.emg', country=country, n=emgnum)), H.escape(TT(lang, 'cp.emg2')))) if emgnum else ''}
<div class="tw"><table><tr><th>{H.escape(R(lang, 'city_col'))}</th>{''.join('<th>%s</th>' % H.escape(cn[c]) for c in _TCATS)}</tr>{''.join(rows_c)}</table></div>
<div class="btns"><a class="btn btn--p" href="../">{H.escape(AT(lang, 'cta.open', 'Open the map'))}</a><a class="btn" href="../c/">{H.escape(TT(lang, 'cp.cities'))}</a>
<a class="btn" href="../datos/{cs}.csv" download>{H.escape(R(lang, 'csv'))}</a></div>
{foot(lang, '../')}
</div>
</body>
</html>""")
    urls.append((url, 0.7))
    # CSV del pais: los sitios a 10 km de sus ciudades, sin repetir
    import csv as _csv
    _seen = set(); _rows = []
    for ci in cis:
        for d, q in ci['near']:
            if q['id'] in _seen: continue
            _seen.add(q['id'])
            _rows.append([q['name'], q['cat'], q['sub'], '%.5f' % q['lat'], '%.5f' % q['lon'], q['addr'], q['oh'], q['phone'],
                          'https://www.openstreetmap.org/' + str(q['id']), ('https://supportnear.com/s/' + PLACE_URL[q['id']]) if q['id'] in PLACE_URL else ''])
    os.makedirs('datos', exist_ok=True)
    with io.open(os.path.join('datos', cs + '.csv'), 'w', encoding='utf-8', newline='') as _f:
        _w = _csv.writer(_f)
        _w.writerow(['name', 'category', 'type', 'lat', 'lon', 'address', 'opening_hours', 'phone', 'osm', 'supportnear'])
        _w.writerows(sorted(_rows, key=lambda r: (r[0] == '', r[0].lower(), r[8])))
    DATOS.append((country_in(cc, 'en', cis[0]['country']), cs, len(_rows), len(cis)))
print('paginas de pais:', len(_bycc))
DATOS.sort()
_dt = ''.join('<tr><td><a href="../country/%s">%s</a></td><td>%d</td><td>%s</td><td><a href="%s.csv" download>%s.csv</a></td></tr>'
              % (cs, H.escape(n), nc, format(nr, ',d'), cs, cs) for n, cs, nr, nc in DATOS)
save('datos/index.html', 'https://supportnear.com/datos/', f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Open data: free help places by country (CSV) · SupportNear</title>
<meta name="description" content="Download free food, shelter, shower, clothes and health places by country as CSV: {format(sum(x[2] for x in DATOS), ',d')} places in {len(DATOS)} countries, from OpenStreetMap (ODbL).">
<link rel="canonical" href="https://supportnear.com/datos/">{ROBOTS_IDX}
<meta property="og:title" content="Open data: free help places by country"><meta property="og:image" content="https://supportnear.com/social.jpg{SV}">
<link rel="icon" href="../favicon.ico" sizes="32x32"><meta name="theme-color" content="#0B7A63">
<style>{CSS}{EXTRA_CSS}
table{{width:100%;border-collapse:collapse;font-size:14.5px}} td,th{{border-bottom:1px solid var(--line);padding:8px 6px;text-align:start}} th{{font-size:13px;color:var(--ink-3)}} .tw{{overflow-x:auto}}</style>
<script type="application/ld+json">{json.dumps({"@context": "https://schema.org", "@type": "Dataset", "name": "SupportNear: free help places by country",
  "description": "Places offering free food, shelter, showers, clothes, legal aid, health care and other help within 10 km of 1,221 cities, from OpenStreetMap.",
  "url": "https://supportnear.com/datos/", "license": "https://opendatacommons.org/licenses/odbl/1-0/", "isAccessibleForFree": True,
  "creator": {"@type": "Organization", "name": "SupportNear", "url": "https://supportnear.com/"},
  "distribution": [{"@type": "DataDownload", "encodingFormat": "text/csv", "contentUrl": "https://supportnear.com/datos/%s.csv" % cs} for _, cs, _, _ in DATOS[:50]]}, ensure_ascii=False).replace('</', LDESC)}</script>
</head>
<body><div class="wrap">{header('../', 'Open the map')}
<h1>Open data: free help places by country</h1>
<p class="lede">One CSV per country with every place SupportNear shows within 10 km of its cities: name, category, type, coordinates, address, opening hours, phone and the OpenStreetMap element. {format(sum(x[2] for x in DATOS), ',d')} places in {len(DATOS)} countries.</p>
<p>The data comes from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> and is under the <a href="https://opendatacommons.org/licenses/odbl/1-0/">Open Database License (ODbL)</a>: you can reuse it if you credit «© OpenStreetMap contributors» and share changes under the same licence. To fix a place, edit it on OpenStreetMap: SupportNear picks it up on the next update.</p>
<div class="tw"><table><tr><th>Country</th><th>Cities</th><th>Places</th><th>Download</th></tr>{_dt}</table></div>
<footer>SupportNear &middot; © OpenStreetMap contributors (ODbL) &middot; updated {DATA_DATE} &middot; <a href="../about">Who is behind this</a></footer>
</div></body></html>""")
urls.append(('https://supportnear.com/datos/', 0.5))

# ---- donde falta ayuda: las ciudades del mapa sin comedor, albergue o ducha a 10 km ----
# Para voluntarios de OpenStreetMap y entidades: lo que no esta en el mapa no
# lo encuentra nadie. Cada fila abre el editor en esa ciudad.
_GAP = ['food', 'shelter', 'hygiene', 'health']
_gap_rows = []
for ci in CINFO:
    _c = Counter(q['cat'] for _, q in ci['near'])
    miss = [g for g in _GAP if not _c[g]]
    if miss: _gap_rows.append((len(miss), ci['country'], ci['name'], ci['sl'], miss, ci['lat'], ci['lon']))
_gap_rows.sort(key=lambda r: (-r[0], r[1], r[2]))
_GN = {'food': 'free food', 'shelter': 'shelter', 'hygiene': 'showers / toilets', 'health': 'free clinic'}
_gtab = ''.join('<tr><td><a href="c/%s">%s</a></td><td>%s</td><td>%s</td><td><a href="https://www.openstreetmap.org/edit#map=14/%.4f/%.4f" target="_blank" rel="noopener">edit map</a></td></tr>'
                % (sl, H.escape(n), H.escape(co), H.escape(', '.join(_GN[g] for g in m)), la, lo) for _, co, n, sl, m, la, lo in _gap_rows)
save('huecos.html', 'https://supportnear.com/huecos', f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Where free help is missing on the map · SupportNear</title>
<meta name="description" content="{len(_gap_rows)} cities with no free food, shelter, showers or clinic mapped within 10 km. Help fix the open map.">
<link rel="canonical" href="https://supportnear.com/huecos">
<meta property="og:title" content="Where free help is missing on the map"><meta property="og:image" content="https://supportnear.com/social.jpg{SV}">
<link rel="icon" href="favicon.ico" sizes="32x32"><meta name="theme-color" content="#0B7A63">
<style>{CSS}{EXTRA_CSS}
table{{width:100%;border-collapse:collapse;font-size:14.5px}} td,th{{border-bottom:1px solid var(--line);padding:8px 6px;text-align:start;vertical-align:top}} th{{font-size:13px;color:var(--ink-3)}}
.tw{{overflow-x:auto}}</style></head>
<body><div class="wrap">{header('./', 'Open the map').replace('../', './')}
<h1>Where free help is missing on the map</h1>
<p class="lede">These {len(_gap_rows)} cities have <b>nothing</b> mapped within 10 km for at least one basic need. Often the help exists but nobody has put it on OpenStreetMap. If you know a soup kitchen, a shelter, public showers or a free clinic in one of them, add it — it will show up here, and in every other app that uses the open map.</p>
<p><a class="btn btn--p" href="https://www.openstreetmap.org/" target="_blank" rel="noopener">How to add a place on OpenStreetMap</a></p>
<div class="tw"><table><tr><th>City</th><th>Country</th><th>Missing within 10 km</th><th>Add it</th></tr>{_gtab}</table></div>
<footer>SupportNear &middot; a non-profit project &middot; data from OpenStreetMap (ODbL) &middot; updated {DATEMARK}</footer>
</div></body></html>""")
urls.append(('https://supportnear.com/huecos', 0.5))
print('huecos:', len(_gap_rows), 'ciudades')

# indice de la version de texto: una lista, nada mas
lite_idx.sort()
_li = ''; _last = None
for country, name, sl in lite_idx:
    if country != _last:
        _li += '<h2>%s</h2>' % H.escape(country or '-'); _last = country
    _li += '<a href="%s.html">%s</a> ' % (sl, H.escape(name))
save('t/index.html', 'https://supportnear.com/t/',
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    '<title>Free help by city, text only · SupportNear</title><meta name="robots" content="index,follow">'
    '<meta property="og:type" content="website"><meta property="og:site_name" content="SupportNear">'
    '<meta property="og:title" content="Free help by city, text only"><meta property="og:url" content="https://supportnear.com/t/">'
    '<meta property="og:image" content="https://supportnear.com/social.jpg' + SV + '"><meta name="twitter:card" content="summary_large_image">'
    '<link rel="canonical" href="https://supportnear.com/t/">'
    '<meta name="description" content="Free food, shelter, showers and clothes, city by city, in plain text: under 5 KB a page, for an old phone or a connection that keeps dropping.">'
    '<style>body{font:16px/1.6 sans-serif;margin:12px;max-width:40em}h2{font-size:17px;margin:14px 0 2px}a{display:inline-block;margin:0 8px 2px 0;padding:6px 2px;min-height:32px}</style></head><body>'
    '<h1 style="font-size:20px;margin:6px 0">SupportNear: free help by city, text only</h1>'
    '<p>Text version for old phones. Free help: food, shelter, showers, clothes, health.</p>'
    '<p><a href="../">Open the full map</a></p>' + _li + '</body></html>')
print('version de texto:', len(lite_idx), 'ciudades')

# indice de ciudades, para que se pueda llegar a todas desde un sitio (y Google tambien)
by_country = {}; _cs_of = {}
for ci in CINFO:
    by_country.setdefault(ci['country'], []).append((ci['name'], ci['sl']))
    if ci['cc'] in CC_SLUG: _cs_of[ci['country']] = CC_SLUG[ci['cc']]
idx = ''.join('<section data-c="%s"><h2>%s <small>(%d)</small></h2><p>%s</p></section>' % (H.escape(k.lower()),
              ('<a href="../country/%s">%s</a>' % (_cs_of[k], H.escape(k))) if k in _cs_of else H.escape(k), len(v),
              ' &middot; '.join('<a href="%s.html">%s</a>' % (sl, H.escape(n)) for n, sl in sorted(v)))
              for k, v in sorted(by_country.items()))
idx = ('<p><input id="f" type="search" placeholder="Filter by city or country…" aria-label="Filter" '
       'style="width:100%;font:inherit;font-size:16px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--paper-2)"></p>'
       + idx + """<script>
document.getElementById('f').addEventListener('input',function(e){var q=e.target.value.trim().toLowerCase();
document.querySelectorAll('section[data-c]').forEach(function(s){var hit=!q||s.dataset.c.indexOf(q)>=0;var any=false;
s.querySelectorAll('a').forEach(function(a){var m=hit||a.textContent.toLowerCase().indexOf(q)>=0;a.style.display=m?'':'none';if(m)any=true;});
s.style.display=any?'':'none';});});</script>""")
save('c/index.html', 'https://supportnear.com/c/', f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Free help by city · SupportNear</title>
<meta name="description" content="Free food, shelter, showers and help in {format(len(CITIES), ',d')} cities across {STATS['countries']} countries. Pick your city.">
<link rel="canonical" href="https://supportnear.com/c/">
<meta property="og:type" content="website"><meta property="og:site_name" content="SupportNear">
<meta property="og:url" content="https://supportnear.com/c/"><meta property="og:title" content="Free help by city &middot; SupportNear"><meta property="og:description" content="Free food, shelter, showers and help in {format(len(CITIES), ',d')} cities across {STATS['countries']} countries. Pick your city.">
<meta property="og:image" content="https://supportnear.com/social.jpg{SV}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="SupportNear: free help, mapped in 166 countries. Food, a bed, a shower, clothes, a doctor.">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@mrstartups"><meta name="twitter:title" content="Free help by city &middot; SupportNear"><meta name="twitter:description" content="Free food, shelter, showers and help in {format(len(CITIES), ',d')} cities across {STATS['countries']} countries. Pick your city."><meta name="twitter:image" content="https://supportnear.com/social.jpg{SV}">
<link rel="icon" href="../favicon.ico" sizes="32x32"><link rel="icon" href="../favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="../apple-touch-icon.png"><meta name="theme-color" content="#0B7A63">
<style>{CSS}{EXTRA_CSS}
h2{{font-size:17px;margin:22px 0 6px;padding-top:16px}} p{{line-height:1.9}}</style></head>
<body><div class="wrap">{header('../', 'Open the map')}
<h1>Free help by city</h1>
<p class="lede">{format(len(CITIES), ',d')} cities in {STATS['countries']} countries. Each page lists what there is near the centre and opens the live map.</p>
{idx}
<footer>SupportNear &middot; a non-profit project &middot; data from OpenStreetMap (ODbL)</footer>
</div></body></html>""")

main = [('https://supportnear.com/', 1.0), ('https://supportnear.com/c/', 0.8), ('https://supportnear.com/t/', 0.5),
        ('https://supportnear.com/cambios', 0.7), ('https://supportnear.com/prensa', 0.7),
        ('https://supportnear.com/incrustar', 0.6), ('https://supportnear.com/instalar', 0.6),
        ('https://supportnear.com/about', 0.6), ('https://supportnear.com/impacto', 0.6)]
main += [('https://supportnear.com/%s/' % _c, 0.8) for _c, _ in ALL_LANGS if _c != 'en']
sm = []
# lastmod: la fecha de hoy para lo que se regenera (todo lo que hay aqui sale de
# este mismo script o del build de hoy), asi Google sabe que hay algo nuevo que
# rastrear. Y una lista plana de URLs para IndexNow (indexnow.py).
import datetime as _dt
_today = _dt.date.today().isoformat()
_SMG = {'main': [], 'needs': [], 'en': [], 'places': []}
for u, pr in main + urls:
    g = 'places' if '/s/' in u else ('en' if u.endswith('.en') else ('needs' if re.search(r'/c/[^/]+-(?:%s)$' % '|'.join(NEED_ORDER), u) else 'main'))
    _SMG[g].append('<url><loc>%s</loc><lastmod>%s</lastmod><priority>%.1f</priority></url>' % (H.escape(u), LASTMOD.get(u, [0, _today])[1], pr))
_smi = ['<?xml version="1.0" encoding="UTF-8"?>', '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for g, lines in _SMG.items():
    io.open('sitemap-%s.xml' % g, 'w', encoding='utf-8').write('\n'.join(['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'] + lines + ['</urlset>']))
    _smi.append('<sitemap><loc>https://supportnear.com/sitemap-%s.xml</loc><lastmod>%s</lastmod></sitemap>' % (g, max([l.split('<lastmod>')[1][:10] for l in lines] or [_today])))
    print('sitemap-%s.xml' % g, len(lines))
_smi.append('</sitemapindex>')
json.dump(LASTMOD, io.open(_LM_FILE, 'w', encoding='utf-8'), ensure_ascii=False, indent=0, sort_keys=True)
io.open('urls_all.txt', 'w', encoding='utf-8').write('\n'.join(u for u, _ in main + urls))
io.open('sitemap.xml', 'w', encoding='utf-8').write('\n'.join(_smi))
json.dump(MOVES, io.open('r24_slug_moves.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('slugs movidos:', MOVES)
# robots.txt es fichero propio (con la seccion de asistentes de IA, 27-oct): no se
# pisa. Solo se crea si no existe.
import os as _os
if not _os.path.exists('robots.txt'):
    io.open('robots.txt', 'w', encoding='utf-8').write('User-agent: *\nAllow: /\nSitemap: https://supportnear.com/sitemap.xml\n')
sz = sum(os.path.getsize(os.path.join('c', f)) for f in os.listdir('c'))
from collections import Counter as _C
print('paginas: %d | sin ningun sitio a 10 km: %d | %.1f MB en total | sitemap con %d urls' % (len(urls), empty, sz / 1e6, len(main) + len(urls)))
