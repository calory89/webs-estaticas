# -*- coding: utf-8 -*-
"""R24 (21-nov-2026): SEO de SupportNear sobre city_pages.py.
- Ciudades cercanas + enlace a la pagina del pais en cada pagina de ciudad.
- Paginas de pais /country/<slug> (paises con 2+ ciudades).
- Una pagina por sitio con nombre /s/<slug> (comida, albergue, duchas, ropa, ayuda legal, con horario o telefono).
- Las listas de ciudad y de necesidad enlazan a la pagina del sitio cuando existe (antes: #p= dentro del mapa).
- /t/<ciudad>: canonica a /c/<ciudad> y fuera del sitemap (duplicaba /c/).
- Ciudades sin ningun sitio con nombre: noindex,follow y fuera del sitemap.
- Comida, albergue y duchas: pagina propia con 2 con nombre y 3 en total (antes 3 con nombre).
- Pie con la fecha de los datos y enlace a «Quien esta detras».
- sitemap.xml pasa a ser un indice: sitemap-main, -needs, -en, -places.
python3 patch_r24_pages.py   (idempotente: falla si no encuentra lo que cambia)"""
import io, shutil, os, sys
P = '/home/claude/sn/work_osm/city_pages.py'
if not os.path.exists(P.replace('.py', '.pre_r24.py')):
    shutil.copy(P, P.replace('.py', '.pre_r24.py'))
s = io.open(P.replace('.py', '.pre_r24.py'), encoding='utf-8').read()


def rep(old, new, n=1):
    global s
    c = s.count(old)
    assert c == n, (c, old[:90])
    s = s.replace(old, new)


# ---------- 1. textos nuevos (11 idiomas de las paginas) ----------
rep("""def TT(lang, key, **kw):""", '''R24 = {
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
DATA_DATE = os.environ.get('SN_BUILT', '2026-10-28')
_APPT = {}


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


def TT(lang, key, **kw):''')

# ---------- 1b. nombre de ciudad: el ingles cuando el otro es otra palabra ----------
# «Dublin · Baile Átha Cliath» salia como /c/baile-atha-cliath y con titulo en
# irlandes; nadie busca eso. Igual Köln, København, Göteborg, Nürnberg...
rep("""    other = [x for x in parts if x != en]
    return en, (other[0] if other else '')""", """    if parts[0] in NAME_FIRST and en != parts[0]:
        MOVES[slug(en)] = slug(parts[0])
        en = parts[0]
    other = [x for x in parts if x != en]
    return en, (other[0] if other else '')


NAME_FIRST = {'Dublin', 'Cologne', 'Copenhagen', 'Gothenburg', 'Nuremberg', 'Dire Dawa', 'Nasir', 'Ayod', 'Kokand', 'Nukus',
              'Tirana', 'Aydin', 'Ashgabat', 'Haiphong', 'Jimma'}
MOVES = {}""")

# ---------- 2. pagina de ciudad ----------
rep("""def page(city, country, lat, lon, cc, local='', raw_q='', lang='en', near=None, sl=None, needs=(), main_lang=None, amb=False):""",
    """def page(city, country, lat, lon, cc, local='', raw_q='', lang='en', near=None, sl=None, needs=(), main_lang=None, amb=False, nearc=(), ccpage='', noidx=False):""")
rep("""    rows = ''.join(
        '<li><div class="pl-h"><a href="../#p=%s@%.5f,%.5f">%s</a>'
        '<span class="ct">%s</span><span class="d">%s</span></div>%s</li>'
        % (H.escape(p['id']), p['lat'], p['lon'], H.escape(p['name']),""",
    """    rows = ''.join(
        '<li><div class="pl-h"><a href="%s">%s</a>'
        '<span class="ct">%s</span><span class="d">%s</span></div>%s</li>'
        % (H.escape(purl(p)), H.escape(p['name']),""")
rep("""<link rel="canonical" href="{self_url}">
{alts}
<meta property="og:title" content="{H.escape(title)}">""",
    """<link rel="canonical" href="{self_url}">{'<meta name="robots" content="noindex,follow">' if noidx else ''}
{alts}
<meta property="og:title" content="{H.escape(title)}">""")
rep(""""url": "https://supportnear.com/#p=%s@%.5f,%.5f" % (p['id'], p['lat'], p['lon'])}} for i, (_, p) in enumerate(named[:10])]""",
    """"url": purl(p, 'https://supportnear.com/')}} for i, (_, p) in enumerate(named[:10])]""")
rep("""<h2>{H.escape(TT(lang, 'cp.how'))}</h2>
<p>{H.escape(TT(lang, 'cp.how2', C=STATS["cities"], K=STATS["countries"], L=NLANG))}</p>
<div class="btns"><a class="btn btn--p" href="../?city={qcity}">{H.escape(TT(lang, 'cp.btn', city=city))}</a>""",
    """{('<h2>' + H.escape(R(lang, 'nearby')) + '</h2><p class="needs">' + ''.join('<a href="%s">%s</a>' % (H.escape(s2), H.escape(n2)) for n2, s2 in nearc) + '</p>') if nearc else ''}
{('<p><a class="btn" href="../country/%s">%s</a></p>' % (ccpage, H.escape(R(lang, 'more_cc', country=country)))) if ccpage else ''}
<h2>{H.escape(TT(lang, 'cp.how'))}</h2>
<p>{H.escape(TT(lang, 'cp.how2', C=STATS["cities"], K=STATS["countries"], L=NLANG))}</p>
<div class="btns"><a class="btn btn--p" href="../?city={qcity}">{H.escape(TT(lang, 'cp.btn', city=city))}</a>""")
rep("""<a class="btn" href="../t/{sl}.html">{H.escape(TT(lang, 'cp.lite'))}</a></div>
<footer>SupportNear &middot; OpenStreetMap (ODbL)</footer>""",
    """<a class="btn" href="../t/{sl}.html">{H.escape(TT(lang, 'cp.lite'))}</a></div>
{foot(lang, '../')}""")

# ---------- 3. pagina de necesidad ----------
rep("""    rows = ''.join(
        '<li><div class="pl-h"><a href="../#p=%s@%.5f,%.5f">%s</a>'
        '<span class="ct">%s</span><span class="d">%s</span></div>%s%s%s</li>'
        % (H.escape(q['id']), q['lat'], q['lon'], H.escape(q['name']),""",
    """    rows = ''.join(
        '<li><div class="pl-h"><a href="%s">%s</a>'
        '<span class="ct">%s</span><span class="d">%s</span></div>%s%s%s</li>'
        % (H.escape(purl(q)), H.escape(q['name']),""")
rep("""                     for c in NEED_ORDER if c != cat and sum(1 for _, q in near if q['cat'] == c and q['name']) >= NEED_MIN)""",
    """                     for c in NEED_ORDER if c != cat and has_need(near, c))""")
rep(""""url": "https://supportnear.com/#p=%s@%.5f,%.5f" % (q['id'], q['lat'], q['lon'])}}
            for i, (_, q) in enumerate(items[:10])]""",
    """"url": purl(q, 'https://supportnear.com/')}}
            for i, (_, q) in enumerate(items[:10])]""")
rep("""<a class="btn" href="./">{H.escape(TT(lang, 'cp.cities'))}</a></div>
<footer>SupportNear &middot; OpenStreetMap (ODbL)</footer>
</div>
</body>
</html>\"\"\"


os.makedirs('c', exist_ok=True)""",
    """<a class="btn" href="./">{H.escape(TT(lang, 'cp.cities'))}</a></div>
{foot(lang, '../')}
</div>
</body>
</html>\"\"\"


def has_need(near, c):
    named = sum(1 for _, q in near if q['cat'] == c and q['name'])
    if named >= NEED_MIN:
        return True
    # lo que mas se busca (comer, dormir, ducharse) tiene pagina con algo menos:
    # 2 con nombre y 3 en total. La pagina lo dice tal cual.
    return c in ('food', 'shelter', 'hygiene') and named >= 2 and sum(1 for _, q in near if q['cat'] == c) >= 3


os.makedirs('c', exist_ok=True)""")

# ---------- 4. version de texto: canonica a la pagina de ciudad ----------
rep("""'<title>%s · SupportNear</title><meta name="robots" content="%s"><link rel="canonical" href="https://supportnear.com/t/%s">'""",
    """'<title>%s · SupportNear</title><meta name="robots" content="%s"><link rel="canonical" href="https://supportnear.com/c/%s">'""")

# ---------- 5. bucle principal ----------
rep("""urls = []; empty = 0; needs_made = 0""", '''urls = []; empty = 0; needs_made = 0

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
        tag = {'node': 'n', 'way': 'w', 'relation': 'r'}.get(oid.split('/')[0], 'x') + re.sub(r'\\D', '', oid)
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
''')
rep("""    needs = [(c, acnt[c]) for c in NEED_ORDER if ncnt[c] >= NEED_MIN]
    body, total = page(name, country, lat, lon, cc, local, ci['raw'], lang, near, sl, needs, amb=amb)
    if total == 0:
        empty += 1
    save(os.path.join('c', sl + '.html'), 'https://supportnear.com/c/%s' % sl, body)
    urls.append(('https://supportnear.com/c/%s' % sl, 0.6 if total >= 15 else 0.4))
    if lang != 'en':
        # la version inglesa tambien, para quien llega de fuera
        body_en, _ = page(name, country_en if cc != 'ES' else 'Spain', lat, lon, cc, local, ci['raw'], 'en', near, sl, needs, main_lang=lang, amb=amb)
        save(os.path.join('c', sl + '.en.html'), 'https://supportnear.com/c/%s.en' % sl, body_en)
        urls.append(('https://supportnear.com/c/%s.en' % sl, 0.3))""",
    """    needs = [(c, acnt[c]) for c in NEED_ORDER if has_need(near, c)]
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
    ci['lang'] = lang; ci['needs'] = dict(needs); ci['noidx'] = noidx""")
rep("""    if nlite >= 5:
        urls.append(('https://supportnear.com/t/%s' % sl, 0.3))
    lite_idx.append((country, name, sl))""",
    """    lite_idx.append((country, name, sl))       # R24: /t/ ya no va al sitemap (canonica a /c/)""")

# ---------- 6. paginas de sitio y de pais, antes de los indices ----------
rep("""# ---- donde falta ayuda: las ciudades del mapa sin comedor, albergue o ducha a 10 km ----""", '''# ---- R24: una pagina por sitio ----
os.makedirs('s', exist_ok=True)
for f in os.listdir('s'):
    if f.endswith('.html'): os.remove(os.path.join('s', f))
_PCSS = '.facts{display:grid;grid-template-columns:max-content 1fr;gap:6px 14px;margin:14px 0}.facts dt{color:var(--ink-3);font-size:14px}.facts dd{margin:0}'
for p, k in PLACES_P:
    ci = CINFO[k]
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
    tel = re.sub(r'[^+\\d]', '', p['phone']) if p.get('phone') else ''
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
<link rel="canonical" href="{url}">
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
os.makedirs('country', exist_ok=True)
for f in os.listdir('country'):
    if f.endswith('.html'): os.remove(os.path.join('country', f))
_bycc = {}
for ci in CINFO:
    if ci['cc'] in CC_SLUG: _bycc.setdefault(ci['cc'], []).append(ci)
_TCATS = ['food', 'shelter', 'hygiene', 'health']
for cc, cis in sorted(_bycc.items()):
    lang = LANG_BY_CC.get(cc, 'en')
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
<link rel="canonical" href="{url}">
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
<div class="btns"><a class="btn btn--p" href="../">{H.escape(AT(lang, 'cta.open', 'Open the map'))}</a><a class="btn" href="../c/">{H.escape(TT(lang, 'cp.cities'))}</a></div>
{foot(lang, '../')}
</div>
</body>
</html>""")
    urls.append((url, 0.7))
print('paginas de pais:', len(_bycc))

# ---- donde falta ayuda: las ciudades del mapa sin comedor, albergue o ducha a 10 km ----''')

# ---------- 7. indice de ciudades: el pais enlaza a su pagina ----------
rep("""by_country = {}
for ci in CINFO:
    by_country.setdefault(ci['country'], []).append((ci['name'], ci['sl']))
idx = ''.join('<section data-c="%s"><h2>%s <small>(%d)</small></h2><p>%s</p></section>' % (H.escape(k.lower()), H.escape(k), len(v), ' &middot; '.join('<a href="%s.html">%s</a>' % (sl, H.escape(n)) for n, sl in sorted(v)))
              for k, v in sorted(by_country.items()))""",
    """by_country = {}; _cs_of = {}
for ci in CINFO:
    by_country.setdefault(ci['country'], []).append((ci['name'], ci['sl']))
    if ci['cc'] in CC_SLUG: _cs_of[ci['country']] = CC_SLUG[ci['cc']]
idx = ''.join('<section data-c="%s"><h2>%s <small>(%d)</small></h2><p>%s</p></section>' % (H.escape(k.lower()),
              ('<a href="../country/%s">%s</a>' % (_cs_of[k], H.escape(k))) if k in _cs_of else H.escape(k), len(v),
              ' &middot; '.join('<a href="%s.html">%s</a>' % (sl, H.escape(n)) for n, sl in sorted(v)))
              for k, v in sorted(by_country.items()))""")

# ---------- 8. sitemap partido ----------
rep("""sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']""",
    """sm = []""")
rep("""for u, pr in main + urls:
    sm.append('<url><loc>%s</loc><lastmod>%s</lastmod><priority>%.1f</priority></url>' % (H.escape(u), LASTMOD.get(u, [0, _today])[1], pr))""",
    """_SMG = {'main': [], 'needs': [], 'en': [], 'places': []}
for u, pr in main + urls:
    g = 'places' if '/s/' in u else ('en' if u.endswith('.en') else ('needs' if re.search(r'/c/[^/]+-(?:%s)$' % '|'.join(NEED_ORDER), u) else 'main'))
    _SMG[g].append('<url><loc>%s</loc><lastmod>%s</lastmod><priority>%.1f</priority></url>' % (H.escape(u), LASTMOD.get(u, [0, _today])[1], pr))
_smi = ['<?xml version="1.0" encoding="UTF-8"?>', '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for g, lines in _SMG.items():
    io.open('sitemap-%s.xml' % g, 'w', encoding='utf-8').write('\\n'.join(['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'] + lines + ['</urlset>']))
    _smi.append('<sitemap><loc>https://supportnear.com/sitemap-%s.xml</loc><lastmod>%s</lastmod></sitemap>' % (g, max([l.split('<lastmod>')[1][:10] for l in lines] or [_today])))
    print('sitemap-%s.xml' % g, len(lines))
_smi.append('</sitemapindex>')""")
rep("""sm.append('</urlset>')
io.open('sitemap.xml', 'w', encoding='utf-8').write('\\n'.join(sm))""",
    """io.open('sitemap.xml', 'w', encoding='utf-8').write('\\n'.join(_smi))""")

rep("""io.open('sitemap.xml', 'w', encoding='utf-8').write('\\n'.join(_smi))""",
    """io.open('sitemap.xml', 'w', encoding='utf-8').write('\\n'.join(_smi))
json.dump(MOVES, io.open('r24_slug_moves.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('slugs movidos:', MOVES)""")
io.open(P, 'w', encoding='utf-8').write(s)
print('ok', len(s))
