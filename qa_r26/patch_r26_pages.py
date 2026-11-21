# -*- coding: utf-8 -*-
"""R26 (21-nov-2026) sobre city_pages.py con R24+R25 (parte de city_pages.pre_r26.py):
- Pagina «voluntariado y donaciones de comida» por ciudad (/c/<ciudad>-volunteer) donde hay pagina de comida:
  los mismos sitios, con telefono y horario, y como ayudar. Se busca («food bank volunteer near me» ya sale 9,5).
- Enlace a ella desde la pagina de comida de la ciudad.
python3 patch_r26_pages.py"""
import io, shutil, os
P = '/home/claude/sn/work_osm/city_pages.py'
B = P.replace('.py', '.pre_r26.py')
if not os.path.exists(B):
    shutil.copy(P, B)
s = io.open(B, encoding='utf-8').read()


def rep(old, new, n=1):
    global s
    c = s.count(old)
    assert c == n, (c, old[:90])
    s = s.replace(old, new)


rep("""for _l, _d in R25.items(): R24.setdefault(_l, {}).update(_d)""", '''for _l, _d in R25.items(): R24.setdefault(_l, {}).update(_d)
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
for _l, _d in R26.items(): R24.setdefault(_l, {}).update(_d)''')

# enlace desde la pagina de comida
rep("""{('<h2>' + H.escape(TT(lang, 'cn.other', city=city)) + '</h2><p class="needs">' + others + '</p>') if others else ''}""",
    """{('<p><a class="btn" href="%s-volunteer">%s</a></p>' % (sl, H.escape(R(lang, 'vol_link')))) if cat == 'food' and not main_lang else ''}{('<h2>' + H.escape(TT(lang, 'cn.other', city=city)) + '</h2><p class="needs">' + others + '</p>') if others else ''}""")

# la pagina
rep("""def has_need(near, c):""", '''def vol_page(city, country, cc, lang, sl, near, local='', amb=False):
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
           ('<span class="ad"><a href="tel:%s">%s</a></span>' % (H.escape(re.sub(r'[^+\\d]', '', q['phone'])), H.escape(q['phone']))) if q.get('phone') else '')
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


def has_need(near, c):''')

# generarla en el bucle, junto a las de necesidad
rep("""    save(os.path.join('c', sl + '.cartel.html'), None, poster(name, country, cc, lang, sl, lat, lon, local))""",
    """    if 'food' in dict(needs):
        save(os.path.join('c', '%s-volunteer.html' % sl), 'https://supportnear.com/c/%s-volunteer' % sl,
             vol_page(cname, country, cc, lang, sl, near, name, amb=amb))
        urls.append(('https://supportnear.com/c/%s-volunteer' % sl, 0.5))
    save(os.path.join('c', sl + '.cartel.html'), None, poster(name, country, cc, lang, sl, lat, lon, local))""")

io.open(P, 'w', encoding='utf-8').write(s)
print('ok', len(s))
