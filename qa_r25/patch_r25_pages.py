# -*- coding: utf-8 -*-
"""R25 (21-nov-2026) sobre city_pages.py ya con la R24 (parte de city_pages.pre_r25.py):
- Ingles por pais: «food banks» (o «food pantries» en EE. UU. y Canada) en vez de «free food places»: es lo que se busca.
- Pagina de ciudad: una frase con datos propios (cuantos sitios con nombre tienen horario y telefono) y
  preguntas frecuentes con los sitios mas cercanos de comida, albergue y duchas (visibles + FAQPage).
- Fuera de las paginas los hospitales y clinicas privados conocidos y los dentistas (no son ayuda gratis;
  traian busquedas como «quironsalud pamplona»). La app no cambia.
- max-image-preview:large en todas las paginas que se indexan.
- Datos abiertos: /datos y un CSV por pais (ODbL), enlazados desde cada pagina de pais.
python3 patch_r25_pages.py"""
import io, shutil, os
P = '/home/claude/sn/work_osm/city_pages.py'
B = P.replace('.py', '.pre_r25.py')
if not os.path.exists(B):
    shutil.copy(P, B)
s = io.open(B, encoding='utf-8').read()


def rep(old, new, n=1):
    global s
    c = s.count(old)
    assert c == n, (c, old[:90])
    s = s.replace(old, new)


# ---------- 1. textos nuevos ----------
rep("""DATA_DATE = os.environ.get('SN_BUILT', '2026-10-28')""", '''R25 = {
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
# Ingles: la palabra que se escribe en Google en cada pais
CUR = {'cc': ''}
FOOD_EN_US = {'US', 'CA'}
ROBOTS_IDX = '<meta name="robots" content="max-image-preview:large">'
DATA_DATE = os.environ.get('SN_BUILT', '2026-10-28')''')

rep("""def TT(lang, key, **kw):
    v = (CP.get(lang) or CP_EN).get(key) or CP_EN[key]""",
    """def TT(lang, key, **kw):
    v = (CP.get(lang) or CP_EN).get(key) or CP_EN[key]
    if lang == 'en' and key == 'pl.food':
        v = 'food pantries' if CUR['cc'] in FOOD_EN_US else 'food banks'""")
rep("""def need_word(lang, c, n):
    if n == 1 and c in SG.get(lang, {}):""",
    """def need_word(lang, c, n):
    if n == 1 and lang == 'en' and c == 'food':
        return 'food pantry' if CUR['cc'] in FOOD_EN_US else 'food bank'
    if n == 1 and c in SG.get(lang, {}):""")

# ---------- 2. fuera privados y dentistas ----------
rep("""        places.append({'name': S_(r[0]), 'lat': la / 1e5, 'lon': lo / 1e5, 'cat': CATIDS[r[3]],""",
    """        if CATIDS[r[3]] == 'health' and (S_(r[4]) in ('dentist', 'audiologist', 'company') or _PRIV.search(S_(r[0]) or '')):
            continue
        places.append({'name': S_(r[0]), 'lat': la / 1e5, 'lon': lo / 1e5, 'cat': CATIDS[r[3]],""")
rep("""# todos los sitios, decodificados una vez
places = []""", """# todos los sitios, decodificados una vez
# R25: hospitales y clinicas privados conocidos y dentistas no son ayuda gratis: fuera de estas paginas
_PRIV = re.compile(r'quir[oó]n|vithas|sanitas|\\bhm hospital|hospiten|\\bnisa\\b|\\bhla\\b|ruber|teknon|dexeus|\\bdental|dentist|odontol|'
                   r'\\bbupa\\b|spire |nuffield|cromwell hospital|mediclinic|\\bprivate (?:hospital|clinic)|cl[ií]nica privada|hospital privado|clinique priv', re.I)
places = []""")

# ---------- 3. pagina de ciudad: frase con datos + preguntas frecuentes ----------
rep("""    few = total < 15
    dir_attr = ' dir="rtl"' if lang in RTL else ''""", """    few = total < 15
    dir_attr = ' dir="rtl"' if lang in RTL else ''
    alln = [p for _, p in near if p['name']]
    hours_line = TT_R(lang, 'hours_n', n=len(alln), h=sum(1 for p in alln if p.get('oh')), p=sum(1 for p in alln if p.get('phone'))) if len(alln) >= 5 else ''
    faq = []
    for fc in ('food', 'shelter', 'hygiene'):
        fl = [(d, p) for d, p in near if p['cat'] == fc and p['name']]
        if not fl: continue
        lst = ', '.join('%s (%s)' % (p['name'], km(d)) for d, p in fl[:3])
        faq.append((R(lang, 'faq_' + fc, city=city), R(lang, 'faq_ans', list=lst, n=fmt_n(fc, cnt[fc]))))""")
rep("""  }]), ensure_ascii=False).replace('</', LDESC)}</script>
</head>
<body>
<div class="wrap">
{header('../?city=' + qcity, TT(lang, 'cp.open', city=city))}""",
    """  }] + ([{"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
      {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq]}] if faq else [])), ensure_ascii=False).replace('</', LDESC)}</script>
</head>
<body>
<div class="wrap">
{header('../?city=' + qcity, TT(lang, 'cp.open', city=city))}""")
rep("""<h2>{H.escape(TT(lang, 'cp.what'))}</h2>
<ul class="cnt">{counts}</ul>""", """<h2>{H.escape(TT(lang, 'cp.what'))}</h2>
<ul class="cnt">{counts}</ul>
{('<p>' + H.escape(hours_line) + '</p>') if hours_line else ''}""")
rep("""{('<h2>' + H.escape(R(lang, 'nearby')) + '</h2><p class="needs">'""",
    """{('<h2>' + H.escape(R(lang, 'faq_h')) + '</h2>' + ''.join('<h3>%s</h3><p>%s</p>' % (H.escape(q), H.escape(a)) for q, a in faq)) if faq else ''}
{('<h2>' + H.escape(R(lang, 'nearby')) + '</h2><p class="needs">'""")
rep("""def R(lang, key, **kw):""", """def TT_R(lang, key, **kw):
    return R(lang, key, **kw)


def R(lang, key, **kw):""")

# ---------- 4. max-image-preview ----------
rep("""<link rel="canonical" href="{self_url}">{'<meta name="robots" content="noindex,follow">' if noidx else ''}""",
    """<link rel="canonical" href="{self_url}">{'<meta name="robots" content="noindex,follow">' if noidx else ROBOTS_IDX}""")
rep("""<link rel="canonical" href="{url}">
{alts_n}""", """<link rel="canonical" href="{url}">{ROBOTS_IDX}
{alts_n}""")
rep("""<link rel="canonical" href="{url}">
<meta property="og:title" content="{H.escape(title)}"><meta property="og:description" content="{H.escape(desc)}">""",
    """<link rel="canonical" href="{url}">{ROBOTS_IDX}
<meta property="og:title" content="{H.escape(title)}"><meta property="og:description" content="{H.escape(desc)}">""")
rep("""<link rel="canonical" href="{url}">
<meta property="og:title" content="{H.escape(h1)}"><meta property="og:description" content="{H.escape(lede)}">""",
    """<link rel="canonical" href="{url}">{ROBOTS_IDX}
<meta property="og:title" content="{H.escape(h1)}"><meta property="og:description" content="{H.escape(lede)}">""")

# ---------- 5. el pais actual (para el ingles de cada pais) ----------
rep("""    amb = _i in AMB
    lang = LANG_BY_CC.get(cc, 'en')""", """    amb = _i in AMB
    lang = LANG_BY_CC.get(cc, 'en')
    CUR['cc'] = cc""")
rep("""for p, k in PLACES_P:
    ci = CINFO[k]""", """for p, k in PLACES_P:
    ci = CINFO[k]
    CUR['cc'] = ci['cc']""")
rep("""for cc, cis in sorted(_bycc.items()):
    lang = LANG_BY_CC.get(cc, 'en')""", """for cc, cis in sorted(_bycc.items()):
    lang = LANG_BY_CC.get(cc, 'en')
    CUR['cc'] = cc""")

# ---------- 6. datos abiertos: un CSV por pais ----------
rep("""<div class="btns"><a class="btn btn--p" href="../">{H.escape(AT(lang, 'cta.open', 'Open the map'))}</a><a class="btn" href="../c/">{H.escape(TT(lang, 'cp.cities'))}</a></div>""",
    """<div class="btns"><a class="btn btn--p" href="../">{H.escape(AT(lang, 'cta.open', 'Open the map'))}</a><a class="btn" href="../c/">{H.escape(TT(lang, 'cp.cities'))}</a>
<a class="btn" href="../datos/{cs}.csv" download>{H.escape(R(lang, 'csv'))}</a></div>""")
rep("""    urls.append((url, 0.7))
print('paginas de pais:', len(_bycc))""", """    urls.append((url, 0.7))
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
save('datos/index.html', 'https://supportnear.com/datos/', f\"\"\"<!DOCTYPE html>
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
</div></body></html>\"\"\")
urls.append(('https://supportnear.com/datos/', 0.5))""")
rep("""_bycc = {}
for ci in CINFO:""", """_bycc = {}; DATOS = []
for ci in CINFO:""")
rep("""os.makedirs('country', exist_ok=True)
for f in os.listdir('country'):""", """os.makedirs('datos', exist_ok=True)
for f in os.listdir('datos'):
    if f.endswith('.csv') or f.endswith('.html'): os.remove(os.path.join('datos', f))
os.makedirs('country', exist_ok=True)
for f in os.listdir('country'):""")

io.open(P, 'w', encoding='utf-8').write(s)
print('ok', len(s))
