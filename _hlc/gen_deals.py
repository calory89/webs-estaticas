#!/usr/bin/env python3
"""Genera /chollos/ y /chollos/<slug>/ desde el agente (Supabase hlc-deals). Idempotente.
Uso (desde la raíz de la rama pub/happylowcost.com): python3 _hlc/gen_deals.py
"""
import os, re, json, html, unicodedata, urllib.request, urllib.parse, io, datetime
from urllib.parse import quote
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
HERE = os.path.join(ROOT, '_hlc')
import sys
sys.path.insert(0, HERE)
import top3 as T3
import en_names
import bk as BK
API = 'https://gmdalfsvtfhzepyrdmjj.supabase.co/functions/v1/hlc-deals?action=feed'
SITE = 'https://www.happylowcost.com'
UA = {'User-Agent': 'HappyLowCost/1.0 (carlos@equinoxinvestmentgroup.com)'}
HEAD = open(os.path.join(HERE, 'partials', 'head.html'), encoding='utf-8').read()
# ronda 7 (#313, #315): speculation rules. Al pasar el ratón (o el dedo) por un enlace a una guía, ruta, hub o chollo,
# el navegador la pide por adelantado: la página siguiente abre al instante (mejor LCP/INP de campo). Sin coste: estático.
SPEC_RULES = ('<script type="speculationrules">{"prefetch":[{"where":{"and":[{"href_matches":["/destinos/*","/en/destinations/*","/vuelos/*","/en/flights/*","/chollos/*","/en/deals/*"]},'
              '{"not":{"href_matches":["/*.md","/*.json","/*.txt","/*.csv"]}}]},"eagerness":"moderate"}]}</script>')
if 'speculationrules' not in HEAD:
    HEAD = HEAD.replace('</head>', SPEC_RULES + '\n</head>', 1)
LIB = os.path.join('hlc', 'img', 'cities')
CR = json.load(open(os.path.join(LIB, 'credits.json'), encoding='utf-8'))
F = lambda n, s: ImageFont.truetype(os.path.join(HERE, 'fonts', n), s)
MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
ALIAS = {'nueva-york': ['new-york', 'nueva-york', 'nyc'], 'la-habana': ['habana', 'la-habana'], 'el-cairo': ['cairo', 'el-cairo'], 'tokio': ['tokyo', 'tokio'],
         'estambul': ['istanbul', 'estambul'], 'copenhague': ['copenhagen', 'copenhague'], 'londres': ['london', 'londres'], 'paris': ['paris'], 'roma': ['rome', 'roma'],
         'maldivas': ['maldivas', 'male', 'maldives'], 'bali': ['bali', 'denpasar'], 'punta-cana': ['punta-cana'], 'amsterdam': ['amsterdam'], 'bangkok': ['bangkok'],
         'budapest': ['budapest'], 'lisboa': ['lisboa', 'lisbon'], 'marrakech': ['marrakech', 'marrakesh'], 'tenerife': ['tenerife'], 'varsovia': ['warsaw', 'warszawa'], 'praga': ['prague', 'praha'], 'viena': ['vienna', 'wien'], 'berlin': ['berlin'], 'oporto': ['porto'], 'milan': ['milano', 'milan'],
         'venecia': ['venice', 'venezia'], 'florencia': ['florence', 'firenze'], 'napoles': ['naples', 'napoli'], 'atenas': ['athens'], 'cracovia': ['krakow', 'cracow'], 'bruselas': ['brussels', 'bruxelles'],
         'brujas': ['bruges', 'brugge'], 'edimburgo': ['edinburgh'], 'estocolmo': ['stockholm'], 'reikiavik': ['reykjavik', 'reikiavic', 'islandia'], 'malta': ['la-valeta', 'valletta'],
         'munich': ['munchen'], 'bucarest': ['bucharest'], 'sofia': ['sofia'], 'fez': ['fes'], 'dubai': ['dubai'], 'cancun': ['cancun'], 'ciudad-de-mexico': ['mexico-city', 'mexico-df', 'cdmx'],
         'lima': ['lima', 'cusco', 'cuzco', 'machu-picchu'], 'buenos-aires': ['buenos-aires'], 'rio-de-janeiro': ['rio', 'rio-de-janeiro'], 'los-angeles': ['la', 'los-angeles', 'burbank', 'long-beach'], 'san-francisco': ['san-francisco', 'san-jose-california', 'oakland'], 'miami': ['miami', 'fort-lauderdale'],
         'singapur': ['singapore', 'singapur'], 'hanoi': ['hanoi', 'ha-long'], 'seul': ['seoul', 'seul'], 'kioto': ['kyoto'], 'ciudad-del-cabo': ['cape-town'], 'sri-lanka': ['colombo'],
         'tallin': ['tallinn'], 'vilna': ['vilnius'], 'zurich': ['zurich'], 'bolonia': ['bologna'], 'salzburgo': ['salzburg'], 'hamburgo': ['hamburg'], 'mykonos': ['miconos'], 'chipre': ['larnaca', 'pafos', 'paphos'],
         'belgrado': ['belgrade'], 'cerdena': ['cagliari', 'olbia', 'alghero', 'sardinia'], 'creta': ['heraklion', 'chania', 'crete'], 'palermo': ['sicilia', 'catania'], 'bogota': ['bogota'], 'madeira': ['funchal', 'madeira'], 'azores': ['ponta-delgada', 'islas-azores', 'azores'], 'mauricio': ['isla-mauricio', 'mauritius', 'mauricio'], 'hong-kong': ['hong-kong', 'hongkong'], 'kuala-lumpur': ['kuala-lumpur'], 'manila': ['manila'], 'sal': ['sal', 'isla-de-sal', 'santa-maria'], 'portland': ['portland']}


NORM_CITY = {'Las Palmas de Gran Canaria': 'Gran Canaria', 'Denpasar (Bali)': 'Bali', 'Denpasar': 'Bali', 'Abu Dhabi': 'Abu Dabi', 'Port Louis': 'Isla Mauricio'}
NORM_C = {'EE. UU.': 'Estados Unidos', 'EEUU': 'Estados Unidos', 'EE.UU.': 'Estados Unidos', 'Emiratos': 'Emiratos Árabes Unidos', 'Rep. Dominicana': 'República Dominicana', 'Escocia': 'Reino Unido', 'Sicilia': 'Italia'}


def en_dest_slug(s):
    """Slug inglés de una guía: edimburgo -> edinburgh, maldivas -> maldives."""
    import en_names
    n = en_names.NAMES.get(s)
    return re.sub(r'^the-', '', slugify(n)) if n else s


def en_deal_slug(x):
    """zaragoza-estocolmo-127-euros-2026-11-17 -> zaragoza-stockholm-127-eur-2026-11-17"""
    import en_names
    f, en = x['facts'], x.get('en') or {}
    o = en.get('orig_en') or en_names.city_en(f.get('origen') or '')
    d = en.get('dest_en') or en_names.NAMES.get(lib_slug(f) or '') or f.get('destino') or ''
    return slugify(f"{o}-{re.sub(r'^the ', '', d, flags=re.I)}-{x.get('price')}-eur-{(f.get('ida') or '')[:10]}")


def norm_deal(x):
    """Un mismo sitio, un mismo nombre (Abu Dabi, Gran Canaria, Bali, Estados Unidos...) en tarjetas, títulos y filtros."""
    f = x.get('facts') or {}
    for k in ('origen', 'destino'):
        if f.get(k) in NORM_CITY:
            f[k] = NORM_CITY[f[k]]
    for k in ('origen_pais', 'pais'):
        if f.get(k) in NORM_C:
            f[k] = NORM_C[f[k]]
    for k in ('title', 'excerpt', 'seo_title', 'meta_description', 'body_html'):
        if isinstance(x.get(k), str):
            for a, b in NORM_CITY.items():
                if a != 'Denpasar':
                    x[k] = x[k].replace(a, b)
    return x


def smart_desc(t, n=155):
    """Meta description sin cortes a media frase: frases enteras hasta n caracteres; si no cabe ni una, corte por palabra con puntos suspensivos."""
    t = ' '.join((t or '').split())
    if len(t) <= n:
        return t
    out = ''
    for sent in re.split(r'(?<=[.!?])\s+', t):
        if len(out) + len(sent) + (1 if out else 0) > n:
            break
        out = (out + ' ' + sent).strip()
    if out:
        return out
    return t[:n - 1].rsplit(' ', 1)[0].rstrip(',;:') + '…'


MAX_DAYS = 7  # días que un chollo sigue vivo en la web desde que se publica
MIN_SAVE = 40  # % mínimo frente al precio habitual para enseñar un chollo en la web (el agente exige 20 %). Carlos, 11-nov-2026: listón arriba, solo chollos de verdad


def clean_title(t):
    """Título sin emoji ni símbolos delante: para el H1 y los datos estructurados."""
    return re.sub(r'^[^0-9A-Za-zÀ-ÿ¿¡]+', '', t or '').strip()


def madrid(iso):
    """Fecha ISO en UTC -> 'AAAA-MM-DD HH:MM' en hora peninsular española."""
    try:
        from zoneinfo import ZoneInfo
        d = datetime.datetime.fromisoformat((iso or '').replace('Z', '+00:00'))
        if d.tzinfo is None:
            d = d.replace(tzinfo=datetime.timezone.utc)
        return d.astimezone(ZoneInfo('Europe/Madrid')).strftime('%Y-%m-%d %H:%M')
    except Exception:
        return (iso or '')[:16].replace('T', ' ')


def deal_faq(x, en=False):
    """Preguntas y respuestas de una ficha, solo con datos del chollo (para la página y para FAQPage)."""
    f = x['facts']
    o, d_, p = f.get('origen'), f.get('destino'), x.get('price')
    air = f.get('aerolinea')
    direct = f.get('escalas') == 0
    qa = []
    if en:
        import gen_en as _E
        o, d_ = _E.names(x)
        qa.append((f'How much is the flight from {o} to {d_}?', f'€{p} return' + (f' with {air}' if air else '') + f', leaving {_E.date_en(f.get("ida"))}' + (f' and coming back {_E.date_en(f.get("vuelta"))}' if f.get('vuelta') else '') + f'. Price last checked on {_E.date_en(checked(x))}.'))
        if f.get('precio_normal'):
            qa.append(('How much do I save?', f'The usual price for this route and trip length is about €{f.get("precio_normal")}, so this fare is {f.get("ahorro_pct")}% cheaper.'))
        qa.append(('Is it a nonstop flight?', 'Yes, it is nonstop.' if direct else (f'No, it has {f.get("escalas")} stop(s).' if f.get('escalas') else 'Check the stops on the booking page before you pay.')))
        qa.append(('Is a suitcase included?', 'The cheapest fare usually includes only a small bag under the seat. Check the baggage of your fare before paying: adding a cabin bag or a checked bag changes the final price.'))
        qa.append(('How long will this price last?', 'Nobody knows: fares like this can disappear in hours. We re-check every live deal once a day and remove it if it has gone up more than 10%.'))
    else:
        qa.append((f'¿Cuánto cuesta el vuelo de {o} a {d_}?', f'{p} € ida y vuelta' + (f' con {air}' if air else '') + f', saliendo el {fecha(f.get("ida"))}' + (f' y volviendo el {fecha(f.get("vuelta"))}' if f.get('vuelta') else '') + f'. Precio comprobado por última vez el {fecha(madrid(checked(x)))}.'))
        if f.get('precio_normal'):
            qa.append(('¿Cuánto se ahorra?', f'El precio habitual de esta ruta para un viaje de la misma duración ronda los {f.get("precio_normal")} €, así que esta tarifa sale un {f.get("ahorro_pct")} % más barata.'))
        qa.append(('¿Es un vuelo directo?', 'Sí, es un vuelo sin escalas.' if direct else (f'No, tiene {f.get("escalas")} escala(s).' if f.get('escalas') else 'Revisa las escalas en la página de reserva antes de pagar.')))
        qa.append(('¿Incluye maleta?', 'La tarifa más barata suele incluir solo un bolso pequeño bajo el asiento. Revisa el equipaje de tu tarifa antes de pagar: añadir maleta de cabina o facturada cambia el precio final.'))
        qa.append(('¿Hasta cuándo dura este precio?', 'No se puede saber: tarifas así pueden desaparecer en horas. Volvemos a comprobar cada chollo activo una vez al día y lo retiramos si ha subido más de un 10 %.'))
    # ronda 10: dónde dormir en el destino con los 3 hoteles de top3hotels.com (nota real y precio por noche), igual que en rutas y guías
    try:
        hq = T3.hotel_faq(d_, *dest_ll(f), lang='en' if en else 'es', trip_from=o)
    except Exception:
        hq = None
    if hq:
        qa.append(hq)
    return qa


def faq_html(qa, en=False):
    return ('<section class="deal-faq"><h2>' + ('Quick questions' if en else 'Preguntas rápidas') + '</h2>'
            + ''.join(f'<details><summary>{e(q)}</summary><p>{e(a)}</p></details>' for q, a in qa) + '</section>')


def faq_ld(qa, lang):
    return {"@type": "FAQPage", "inLanguage": lang, "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in qa]}


def deal_md(x, url, title, qa, en=False):
    """Versión Markdown de un chollo vivo (index.md) para asistentes de IA: solo datos del feed (ronda SEO 3)."""
    f = x['facts']
    L = (lambda a, b: b if en else a)
    rows = [(L('Precio', 'Price'), (f'€{x.get("price")} ' + L('', 'return')) if en else f'{x.get("price")} € ida y vuelta'),
            (L('Ida', 'Outbound'), f.get('ida')), (L('Vuelta', 'Return'), f.get('vuelta')), (L('Aerolínea', 'Airline'), f.get('aerolinea')),
            (L('Escalas', 'Stops'), f.get('escalas') if f.get('escalas') is not None else None),
            (L('Precio habitual de la ruta', 'Usual price on this route'), (f'€{f.get("precio_normal")}' if en else f'{f.get("precio_normal")} €') if f.get('precio_normal') else None),
            (L('Ahorro', 'Saving'), f'{f.get("ahorro_pct")} %' if f.get('ahorro_pct') else None),
            (L('Comprobado', 'Checked'), (checked(x) or '')[:10] or None)]
    out = f'# {title}\n\n> ' + L('Chollo de vuelo verificado por Happy Low Cost. Página original', 'Flight deal verified by Happy Low Cost. Original page') + f': {url}\n\n'
    out += ''.join(f'- **{k}:** {v}\n' for k, v in rows if v not in (None, ''))
    out += '\n## ' + L('Preguntas frecuentes', 'FAQ') + '\n\n' + ''.join(f'### {q}\n\n{a}\n\n' for q, a in qa)
    out += L('Los precios cambian cada hora: comprueba el precio en la página original antes de reservar.\n', 'Fares change by the hour: check the live price on the original page before booking.\n')
    return out.replace(' — ', ', ').replace('—', ', ')


def deal_seo_title(f, price, en=False, trip_=''):
    """Título del chollo con el ahorro (% sobre el precio normal de la ruta) y la fecha, recortado para que quepa (ronda SEO 3)."""
    o, d = f.get('origen'), f.get('destino')
    try:
        pct = int(round(float(f.get('ahorro_pct') or 0)))
    except Exception:
        pct = 0
    if en:
        base = f'Flights {o} → {d} for €{price} {trip_}'.rstrip()
        parts = [f' ({pct}% off)' if pct >= 20 else '', f' · {f.get("periodo_en")}' if f.get('periodo_en') else '', ' · Verified deal']
    else:
        base = f"Vuelos {o} → {d} por {price} € {f.get('tipo', '')}".rstrip()
        per = f.get('periodo')
        if not per and re.match(r'\d{4}-\d\d', f.get('ida') or ''):
            per = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][int(f['ida'][5:7]) - 1] + ' ' + f['ida'][:4]
        parts = [f' (-{pct} %)' if pct >= 20 else '', f" en {per}" if per else '',
                 f" con {f.get('aerolinea')}" if f.get('aerolinea') and len(f.get('aerolinea')) < 22 else '']
    t = base
    for p_ in parts:
        if p_ and len(t + p_) <= 72:
            t += p_
    return t


def quick_answer(x):
    f = x['facts']
    air = f' con {f.get("aerolinea")}' if f.get('aerolinea') else ''
    stops = ', sin escalas' if f.get('escalas') == 0 else ''
    was = f' Lo habitual en esta ruta son unos {f.get("precio_normal")} € (ahorras un {f.get("ahorro_pct")} %).' if f.get('precio_normal') else ''
    return (f'<p class="deal-quick"><strong>En corto:</strong> vuelo de {e(f.get("origen"))} a {e(f.get("destino"))} por {e(x.get("price"))} € ida y vuelta{e(air)}{stops}, '
            f'del {e(fecha(f.get("ida")))} al {e(fecha(f.get("vuelta")))}.{e(was)} Precio comprobado el {e(fecha(madrid(checked(x))))}.</p>')


def keep_deal(x):
    f = x.get('facts') or {}
    if not f.get('vuelta'):  # solo ida y vuelta, sin excepciones
        return False
    p = f.get('ahorro_pct')
    if p and p < MIN_SAVE:
        return False
    # Carlos, 21-nov-2026: todo chollo caduca por defecto a la semana de publicarse
    try:
        age = (datetime.datetime.utcnow() - datetime.datetime.fromisoformat((x.get('approved_at') or '')[:19])).days
    except Exception:
        age = 0
    return age < MAX_DAYS


# moneda local del país de salida (tipos de referencia del BCE del día)
CUR = {'US': ('USD', 'US$'), 'CA': ('CAD', 'CA$'), 'AU': ('AUD', 'AU$'), 'NZ': ('NZD', 'NZ$'), 'MX': ('MXN', 'MX$'), 'BR': ('BRL', 'R$'), 'GB': ('GBP', '£'),
       'CH': ('CHF', 'CHF'), 'JP': ('JPY', '¥'), 'KR': ('KRW', '₩'), 'CN': ('CNY', 'CN¥'), 'HK': ('HKD', 'HK$'), 'SG': ('SGD', 'S$'), 'IN': ('INR', '₹'), 'ID': ('IDR', 'Rp'),
       'MY': ('MYR', 'RM'), 'PH': ('PHP', '₱'), 'TH': ('THB', '฿'), 'ZA': ('ZAR', 'R'), 'TR': ('TRY', '₺'), 'PL': ('PLN', 'zł'), 'CZ': ('CZK', 'Kč'), 'HU': ('HUF', 'Ft'),
       'RO': ('RON', 'lei'), 'SE': ('SEK', 'kr'), 'NO': ('NOK', 'kr'), 'DK': ('DKK', 'kr'), 'IS': ('ISK', 'kr'), 'IL': ('ILS', '₪')}
FX = {}


def load_fx():
    """Tipos de cambio del BCE (euro = base). Se guardan en hlc/fx.json para el JavaScript."""
    global FX
    try:
        x = urllib.request.urlopen(urllib.request.Request('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml', headers=UA), timeout=30).read().decode()
        FX = {m.group(1): float(m.group(2)) for m in re.finditer(r"currency='([A-Z]{3})' rate='([0-9.]+)'", x)}
        dt = (re.search(r"time='([0-9-]+)'", x) or [None, ''])[1]
        if FX:
            json.dump({'date': dt, 'rates': FX, 'cc': {k: v for k, v in CUR.items()}}, open(os.path.join('hlc', 'fx.json'), 'w'), separators=(',', ':'))
    except Exception as ex:
        print('fx', ex)
        try:
            FX = json.load(open(os.path.join('hlc', 'fx.json')))['rates']
        except Exception:
            FX = {}


def local(eur, cc, en=False):
    """'≈ 553 US$' (o 'US$553' en inglés) si el país de salida no usa euro; '' si usa euro o no hay tipo."""
    c = CUR.get((cc or '').upper())
    if not c or not eur or c[0] not in FX:
        return ''
    v = float(eur) * FX[c[0]]
    v = int(round(v, -2 if v >= 20000 else (-1 if v >= 2000 else 0)))
    n = f'{v:,}'.replace(',', ',' if en else '.')
    return f'≈ {c[1]}{n}' if en else f'≈ {n} {c[1]}'


# continentes de verdad (Oriente Medio es Asia; Caribe y Centroamérica, América del Norte)
REAL_CONT = {'Europa': 'Europa', 'Asia': 'Asia', 'Oriente Medio': 'Asia', 'Norteamérica': 'América del Norte', 'Centroamérica y Caribe': 'América del Norte',
             'Sudamérica': 'América del Sur', 'África': 'África', 'Oceanía': 'Oceanía'}


def slugify(s):
    s = unicodedata.normalize('NFD', s or '').encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


def e(s):
    return html.escape(str(s if s is not None else ''), quote=True)


def guide_block(x):
    g = x.get('guide_html') or ''
    if not g:
        return ''
    g = re.sub(r'<(?!/?(h2|h3|p|ul|li|strong)\b)[^>]*>', '', g)
    g = re.sub(r'<(h2|h3|p|ul|li|strong)\b[^>]*>', r'<\1>', g)
    h = e(x.get('seo_title') or f"Qué ver en {x.get('facts', {}).get('destino', '')}")
    return f'<section class="guide"><div class="kicker">Guía del destino</div><h2 class="guide-h">{h}</h2>{g}</section>'


def fecha(iso):
    try:
        d = datetime.date.fromisoformat(iso[:10])
        return f'{d.day} {MESES[d.month - 1]} {d.year}'
    except Exception:
        return ''


def lib_photo(dest):
    k = slugify(dest)
    for slug, names in ALIAS.items():
        if k in names or k == slug:
            return os.path.join(LIB, slug + '.jpg'), CR.get(slug)
    p = os.path.join(LIB, k + '.jpg')
    return (p, CR.get(k)) if os.path.exists(p) else (None, None)


def wiki_photo(dest, country=''):
    """Imagen principal del artículo de Wikipedia del destino (horizontal, sin mapas ni escudos)."""
    for lang, q in (('es', f'{dest} {country}'.strip()), ('en', dest)):
        u = f'https://{lang}.wikipedia.org/w/api.php?' + urllib.parse.urlencode({'action': 'query', 'format': 'json', 'generator': 'search', 'gsrsearch': q, 'gsrlimit': 1, 'prop': 'pageimages', 'piprop': 'original|name'})
        try:
            j = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=40))
        except Exception:
            continue
        for pg in (j.get('query') or {}).get('pages', {}).values():
            o = pg.get('original') or {}
            src, w, h = o.get('source', ''), o.get('width', 0), o.get('height', 1)
            if not src or src.lower().endswith('.svg') or re.search(r'(map|mapa|flag|bandera|coat|escudo|logo|locator|location)', src, re.I) or w < 1000 or w / h < 1.2:
                continue
            thumb = re.sub(r'/commons/(\w/\w\w)/', r'/commons/thumb/\1/', src) + '/1920px-' + src.rsplit('/', 1)[-1] if '/commons/' in src else src
            im = fetch_img(thumb) or fetch_img(src)
            if im:
                return im, f'Foto: Wikipedia · Wikimedia Commons ({pg.get("title", "")})'
    return None, ''


def commons_photo(dest, country=''):
    """Foto para destinos fuera de la biblioteca: Wikipedia y, si no, foto destacada de Commons con paisaje urbano."""
    im, cr = wiki_photo(dest, country)
    if im:
        return im, cr
    for q in (f'{dest} skyline', f'{dest} panorama', f'{dest} {country}'.strip()):
        for cat in ('Featured_pictures_on_Wikimedia_Commons', 'Quality_images'):
            u = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({'action': 'query', 'format': 'json', 'generator': 'search', 'gsrsearch': f'{q} incategory:{cat} filetype:bitmap', 'gsrnamespace': 6, 'gsrlimit': 15, 'prop': 'imageinfo', 'iiprop': 'url|size|extmetadata', 'iiurlwidth': 1920})
            try:
                j = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=40))
            except Exception:
                continue
            for pg in sorted((j.get('query') or {}).get('pages', {}).values(), key=lambda p: p.get('index', 99)):
                ii = (pg.get('imageinfo') or [{}])[0]
                w, h = ii.get('width', 0), ii.get('height', 1)
                if w < 1800 or not 1.3 <= w / h <= 2.6:
                    continue
                md = ii.get('extmetadata', {})
                lic = re.sub('<[^>]+>', '', (md.get('LicenseShortName') or {}).get('value', ''))
                if not re.search(r'cc|public domain|pd', lic, re.I):
                    continue
                im = fetch_img(ii.get('thumburl') or ii['url'])
                if im:
                    art = re.sub('<[^>]+>', '', (md.get('Artist') or {}).get('value', '')).strip()[:60] or 'Wikimedia Commons'
                    return im, f'Foto: {art} · {lic} · Wikimedia Commons'
    return None, ''


def fetch_img(url):
    # Wikimedia solo sirve miniaturas de tamaños estándar desde 2026 (1600px da error 400)
    if url and 'upload.wikimedia.org' in url and '/1600px-' in url:
        url = url.replace('/1600px-', '/1920px-')
    try:
        return Image.open(io.BytesIO(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read())).convert('RGB')
    except Exception:
        return None


def cover(im, w, h):
    r = max(w / im.width, h / im.height)
    im = im.resize((int(im.width * r + 1), int(im.height * r + 1)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def og_image(photo, f, out):
    W, H = 1200, 630
    base = cover(photo, W, H) if photo else Image.new('RGB', (W, H), (20, 33, 61))
    grad = Image.new('L', (1, H))
    for y in range(H):
        grad.putpixel((0, y), int(max(0, (y - H * 0.25) / (H * 0.75)) ** 1.3 * 235))
    shade = Image.new('RGB', (W, H), (20, 33, 61))
    base = Image.composite(shade, base, grad.resize((W, H)))
    d = ImageDraw.Draw(base)
    o, de = f.get('origen', ''), f.get('destino', '')
    size = 92
    while d.textlength(o + '      ' + de, font=F('B800.woff', size)) > W - 120 and size > 44:
        size -= 4
    fnt = F('B800.woff', size)
    y = H - 210
    d.text((60, y), o, font=fnt, fill='white')
    x0 = 60 + d.textlength(o, font=fnt) + size * 0.28
    aw, cy = size * 0.85, y + size * 0.62
    d.line((x0, cy, x0 + aw, cy), fill=(255, 197, 49), width=max(6, size // 11))
    d.polygon([(x0 + aw + size * 0.08, cy), (x0 + aw - size * 0.28, cy - size * 0.26), (x0 + aw - size * 0.28, cy + size * 0.26)], fill=(255, 197, 49))
    d.text((x0 + aw + size * 0.36, y), de, font=fnt, fill='white')
    meta = f"{f.get('tipo', '')} · {fecha(f.get('ida', ''))}" + (' · directo' if f.get('escalas') == 0 else '')
    d.text((62, H - 96), meta, font=F('I600.woff', 34), fill=(230, 235, 245))
    price = f"{f.get('precio')} €"
    pf = F('B800.woff', 96)
    pw = d.textlength(price, font=pf)
    d.rounded_rectangle((W - pw - 110, 44, W - 44, 44 + 128), radius=26, fill=(255, 197, 49))
    d.text((W - pw - 77, 52), price, font=pf, fill=(20, 33, 61))
    # logo
    import brand
    lw, lh = brand.logo_size(56)
    d.rounded_rectangle((44, 44, 44 + lw + 48, 44 + lh + 30), radius=22, fill=(255, 248, 238))
    brand.draw_logo(d, 68, 62, 56, low=(232, 67, 31))
    base.save(out, 'JPEG', quality=86, optimize=True, progressive=True)


CONT = {'Europa': ('europa', 'Europa', '🇪🇺'), 'Asia': ('asia', 'Asia', '🌏'), 'Oriente Medio': ('oriente-medio', 'Oriente Medio', '🕌'),
        'Norteamérica': ('norteamerica', 'Norteamérica', '🗽'), 'Centroamérica y Caribe': ('caribe', 'el Caribe y Centroamérica', '🏝️'),
        'Sudamérica': ('sudamerica', 'Sudamérica', '🌎'), 'África': ('africa', 'África', '🌍'), 'Oceanía': ('oceania', 'Oceanía', '🦘')}
CONT_BY_SLUG = {v[0]: (k, v[1], v[2]) for k, v in CONT.items()}
DLIB = json.load(open(os.path.join('hlc', 'destinos.json'), encoding='utf-8'))


def flag(cc):
    cc = (cc or '').upper()
    return ''.join(chr(0x1F1E6 + ord(c) - 65) for c in cc) if len(cc) == 2 and cc.isalpha() else '✈️'


def dest_ll(f):
    """(lat, lng, nombres, nombre_aeropuerto) del destino para casar con top3hotels. Aeropuerto primero: la biblioteca a veces es un país entero."""
    d0 = slugify(f.get('destino', ''))
    k = next((p['s'] for p in DLIB if p['s'] == d0 or slugify(p['n']) == d0), None) or lib_slug(f)
    names, weak = {d0}, set()
    lat = lng = None
    a = AIRPORTS.get((f.get('destino_iata') or '').upper()) if 'AIRPORTS' in globals() else None
    if a:
        lat, lng = a[0], a[1]
        weak.add(slugify(a[2]))
    for p in DLIB:
        if p['s'] == k:
            names.update(p.get('a') or [])
            if lat is None:
                lat, lng = p['y'], p['x']
    return lat, lng, sorted(n for n in names if n), sorted(weak)


def lib_slug(f):
    k = slugify(f.get('destino', ''))
    for p in DLIB:  # primero por nombre (Brujas no debe caer en Bruselas por compartir aeropuerto)
        if p['s'] == k or slugify(p['n']) == k or k in (p.get('a') or []):
            return p['s']
    for p in DLIB:
        if f.get('destino_iata') and p['i'] == f.get('destino_iata'):
            return p['s']
    for s_, names in ALIAS.items():
        if k in names:
            return s_
    return None


REGION_OF = {'Europa': 'europa', 'Asia': 'asia', 'Oriente Medio': 'asia', 'Norteamérica': 'america', 'Centroamérica y Caribe': 'america', 'Sudamérica': 'america', 'África': 'africa', 'Oceanía': 'oceania'}
try:
    AIRPORTS = json.load(open(os.path.join('hlc', 'airports.json'), encoding='utf-8'))
except Exception:
    AIRPORTS = {}


def n_extra(slug):
    """Fotos extra de la biblioteca (<slug>-2.jpg, -3.jpg...) para que la imagen vaya cambiando."""
    n = 0
    while os.path.exists(os.path.join(LIB, f'{slug}-{n + 2}.jpg')):
        n += 1
    return n


def photos_attr(slug):
    """Atributo para que hlc.js vaya rotando las fotos del destino en la cabecera."""
    if not slug or not n_extra(slug):
        return ''
    return ' data-photos="' + '|'.join([f'/hlc/img/cities/{slug}.jpg'] + [f'/hlc/img/cities/{slug}-{i + 2}.jpg' for i in range(n_extra(slug))]) + '"'


def city_photo(dest, iata='', country=''):
    """Foto fiable de una ciudad nueva: artículo de Wikipedia cuyas coordenadas están a menos de 80 km del aeropuerto
    (evita confundir Phoenix con una marca o San Juan de Puerto Rico con otro San Juan)."""
    import math
    ap = AIRPORTS.get((iata or '').upper()) or []
    if not ap:
        return None, ''
    la0, lo0 = ap[0], ap[1]
    def dist(a, b):
        p1, p2 = math.radians(a), math.radians(la0)
        dl = math.radians(b - lo0)
        return 6371 * math.acos(min(1, math.sin(p1) * math.sin(p2) + math.cos(p1) * math.cos(p2) * math.cos(dl)))
    cands = []
    for lang, q in (('en', dest), ('en', f'{dest} {country}'.strip()), ('es', dest)):
        u = f'https://{lang}.wikipedia.org/w/api.php?' + urllib.parse.urlencode({'action': 'query', 'format': 'json', 'generator': 'search', 'gsrsearch': q, 'gsrlimit': 6,
                                                                                    'prop': 'pageimages|coordinates', 'piprop': 'original', 'colimit': 'max'})
        try:
            j = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=40))
        except Exception:
            continue
        for pg in sorted((j.get('query') or {}).get('pages', {}).values(), key=lambda p: p.get('index', 99)):
            co = (pg.get('coordinates') or [{}])[0]
            o = pg.get('original') or {}
            if not co.get('lat') or not o.get('source'):
                continue
            if dist(co['lat'], co['lon']) > 80 or re.search(r'airport|aeropuerto|aéroport|flughafen|airfield|air base|station|stadium|university|universidad|county|condado|metropolitan area|área metropolitana', pg.get('title', ''), re.I):
                continue
            src, w, h = o['source'].split('?')[0], o.get('width', 0), o.get('height', 1)
            if not (src.lower().endswith('.svg') or re.search(r'(map|mapa|flag|bandera|coat|escudo|seal|logo|locator|location|montage|collage|airport|aeropuerto)', src, re.I) or w < 1000 or w / h < 1.2):
                cands.append((src, pg.get('title', '')))
                continue
            # la imagen principal es un mosaico o un mapa: buscamos dentro del artículo una vista de la ciudad
            try:
                u2 = f'https://{lang}.wikipedia.org/w/api.php?' + urllib.parse.urlencode({'action': 'query', 'format': 'json', 'generator': 'images', 'titles': pg['title'], 'gimlimit': 50,
                                                                                            'prop': 'imageinfo', 'iiprop': 'url|size', 'iiurlwidth': 1920})
                j2 = json.load(urllib.request.urlopen(urllib.request.Request(u2, headers=UA), timeout=40))
                for ip in (j2.get('query') or {}).get('pages', {}).values():
                    t2 = ip.get('title', '')
                    ii = (ip.get('imageinfo') or [{}])[0]
                    if not re.search(r'skyline|downtown|panorama|aerial|view|beach|bay|harbou?r|old town|city|centro|vista', t2, re.I) or re.search(r'map|flag|seal|logo|svg', t2, re.I):
                        continue
                    if ii.get('width', 0) >= 1400 and 1.3 <= ii['width'] / max(ii.get('height', 1), 1) <= 2.6:
                        cands.append((ii.get('thumburl') or ii['url'], pg.get('title', '')))
            except Exception:
                pass
        if cands:
            break
    for src, t in cands:
        thumb = re.sub(r'/commons/(\w/\w\w)/', r'/commons/thumb/\1/', src) + '/1920px-' + src.rsplit('/', 1)[-1] if ('/commons/' in src and '/thumb/' not in src) else src
        im = fetch_img(thumb) or fetch_img(src)
        if im:
            return im, f'Foto: Wikipedia · Wikimedia Commons ({t})'
    return None, ''


def ensure_lib(f):
    """Ningún destino sin foto: si un chollo va a un destino que no está en la biblioteca, lo añadimos
    (foto de Wikipedia/Commons, coordenadas del aeropuerto, crédito) y queda para siempre."""
    if lib_slug(f):
        return lib_slug(f)
    dest = (f.get('destino') or '').strip()
    k = slugify(dest)
    if not k:
        return None
    im, cred = city_photo(dest, f.get('destino_iata', ''), f.get('pais', ''))
    if im is None and f.get('_image_url'):
        im, cred = fetch_img(f['_image_url']), f.get('_image_credit') or 'Foto: Wikimedia Commons'
    if im is None:
        return None
    big = cover(im, 1600, 1000) if im.width >= 1600 else cover(im, im.width, int(im.width / 1.6))
    big.save(os.path.join(LIB, k + '.jpg'), 'JPEG', quality=80, optimize=True, progressive=True)
    cover(im, 800, 500).save(os.path.join(LIB, k + '-800.jpg'), 'JPEG', quality=78, optimize=True, progressive=True)
    CR[k] = {'file': '', 'author': cred.replace('Foto: ', '').split(' · ')[0], 'license': (cred.split(' · ')[1] if cred.count(' · ') >= 2 else ''), 'page': ''}
    json.dump(CR, open(os.path.join(LIB, 'credits.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    ap = AIRPORTS.get((f.get('destino_iata') or '').upper()) or []
    DLIB.append({'s': k, 'n': dest, 'c': f.get('pais') or '', 'i': (f.get('destino_iata') or '').upper(), 'y': ap[0] if ap else None, 'x': ap[1] if ap else None,
                 'r': REGION_OF.get(f.get('continente') or '', 'mundo'), 't': 'ciudad', 'a': [], 'auto': 1})
    print('biblioteca: nuevo destino', k)
    return k


def cont_of(f):
    c = f.get('continente') or ''
    return CONT.get(c, ('', '', ''))


def ago_iso(s):
    return (s or '')[:19]


def head(**k):
    d = dict(robots=ROBOTS_IDX, og_type='article', extra_head='<link rel="stylesheet" href="/hlc/home.css?v=12">', body_class='')
    d.update(k)
    d.setdefault('og_title', d['title'])
    d.setdefault('og_alt', d['title'])
    xh = d.get('extra_head') or ''
    m_es = re.search(r'<link rel="alternate" hreflang="es" href="([^"]+)">', xh)
    if m_es and 'hreflang="x-default"' not in xh:  # toda pareja es/en lleva también x-default (la española)
        d['extra_head'] = xh.replace(m_es.group(0), m_es.group(0) + f'<link rel="alternate" hreflang="x-default" href="{m_es.group(1)}">', 1)
    h = HEAD
    for key, v in d.items():
        h = h.replace('{' + key + '}', v)
    return h


def photo_url(x):
    f = x['facts']
    ls_ = lib_slug(f)
    if ls_:
        return f'/hlc/img/cities/{ls_}-800.jpg'
    if os.path.exists(os.path.join('chollos', x['slug'], 'foto.jpg')):
        return f"/chollos/{x['slug']}/foto.jpg"
    return x.get('image_url') or ''


def nights_of(f):
    try:
        return (datetime.date.fromisoformat(f['vuelta'][:10]) - datetime.date.fromisoformat(f['ida'][:10])).days
    except Exception:
        return ''


def level_es(p):
    return '' if not p else ('Excepcional' if p >= 50 else 'Muy bueno')


def dates_es(f):
    a, b = fecha(f.get('ida', '')), fecha(f.get('vuelta') or '')
    if b and a and a.split()[-1] == b.split()[-1]:
        a = ' '.join(a.split()[:2])
    return f'{a} – {b}' if b else a


def stops_es(f):
    n = f.get('escalas')
    return 'directo' if n == 0 else (f'{n} escala' + ('s' if n and n > 1 else '') if isinstance(n, int) else 'con escalas')



def guide_extras(gh, lang='es', name=None):
    """Índice con anclas, minutos de lectura y preguntas frecuentes (FAQPage) a partir del HTML de una guía."""
    import html as _h
    used = {}
    toc = []
    def anchor(m):
        txt = re.sub('<[^>]+>', '', m.group(1)).strip()
        k = slugify(txt)[:60] or 'seccion'
        used[k] = used.get(k, 0) + 1
        if used[k] > 1:
            k = f'{k}-{used[k]}'
        toc.append((k, txt))
        return f'<h2 id="{k}">{m.group(1)}</h2>'
    gh = re.sub(r'<h2>(.*?)</h2>', anchor, gh, flags=re.S)
    # ronda 10: "Preguntas frecuentes sobre X" / "FAQ about X" (el H2 genérico no decía de qué destino)
    if name:
        gh = re.sub(r'(<h2 id="[^"]*">)\s*(Preguntas frecuentes|FAQs?|Frequently asked questions)\s*(</h2>)', lambda m_: m_.group(1) + (f'Preguntas frecuentes sobre {e(name)}' if lang == 'es' else f'FAQ about {e(name)}') + m_.group(3), gh, count=1)
    words = len(re.sub('<[^>]+>', ' ', gh).split())
    mins = max(3, round(words / 230))
    faq = []
    m = re.search(r'<h2 id="[^"]*">[^<]*(?:Preguntas frecuentes|FAQ)[^<]*</h2>(.*?)(?=<h2|$)', gh, re.S | re.I)
    if m:
        for q, a in re.findall(r'<h3>(.*?)</h3>\s*<p>(.*?)</p>', m.group(1), re.S):
            q, a = _h.unescape(re.sub('<[^>]+>', '', q)).strip(), _h.unescape(re.sub('<[^>]+>', '', a)).strip()
            if q and a:
                faq.append({"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}})
    faq_ld = {"@type": "FAQPage", "mainEntity": faq[:16]} if len(faq) >= 3 else None  # ronda 10: 16 (antes 10)
    if len(toc) >= 4:
        lab = ('En esta guía', 'min de lectura') if lang == 'es' else ('In this guide', 'min read')
        nav = (f'<nav class="g-toc" aria-label="{lab[0]}"><details open><summary><b>{lab[0]}</b><span>{mins} {lab[1]}</span></summary><ol>'
               + ''.join(f'<li><a href="#{k}">{e(t)}</a></li>' for k, t in toc) + '</ol></details></nav>')
        gh = nav + gh
    return gh, faq_ld, words


# ---------- SEO para buscadores e IA en las guías (ronda SEO 1, 26-nov-2026) ----------
# Robots: permitir fragmentos completos (AI Overviews, modo IA de Google y Bing/Copilot citan mejor
# cuando pueden usar el texto entero) además de la imagen grande.
ROBOTS_IDX = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
ORG_ID = SITE + '/#org'
ORG_LD = {"@type": "Organization", "@id": ORG_ID, "name": "Happy Low Cost", "url": SITE + "/", "foundingDate": "2012",
          "logo": {"@type": "ImageObject", "url": SITE + "/hlc/brand/icon-512.png"},
          "sameAs": ["https://www.facebook.com/happylowcostofficialpage/"],
          "founder": {"@type": "Person", "name": "Carlos de Ory", "url": "https://www.carlosdeory.com"}}


def guide_days(title, gh):
    """Días del itinerario: los que dice el título ("en 3 días", "in 3 days") o el mayor "Día N"/"Day N" del texto."""
    m = re.search(r'\b(?:en|in)\s+(\d{1,2})\s+(?:d[ií]as|days)\b', title or '', re.I)
    if m and 1 <= int(m.group(1)) <= 21:
        return int(m.group(1))
    # ronda 9: "Zanzíbar: guía práctica para 7 días…" no decía "en 7 días" y la guía se quedaba sin días (sin título por consulta,
    # sin tabla de itinerario ni FAQ de 1/2 días). Cualquier "N días"/"N-day" del título vale.
    m = re.search(r'\b(\d{1,2})[\s-]+(?:d[ií]as|days?)\b', title or '', re.I)
    if m and 2 <= int(m.group(1)) <= 21:
        return int(m.group(1))
    nd = 0
    for m_ in re.finditer(r'\b(?:d[ií]a|day)\s*(\d{1,2})\b', gh or '', re.I):
        nd = max(nd, int(m_.group(1)))
    return nd if 2 <= nd <= 21 else 0


def _first_sentence(txt, n=230):
    txt = html.unescape(re.sub(r'<[^>]+>', ' ', txt or ''))
    txt = re.sub(r'\s+', ' ', txt).strip()
    m = re.match(r'(.{40,}?[.!?])(\s|$)', txt)
    s = m.group(1) if m else txt
    if len(s) > n:
        s = s[:n].rsplit(' ', 1)[0].rstrip(',;:') + '…'
    return s.replace(' — ', ', ').replace('—', ', ')


def section_text(gh, rx, prefer=None, fallback=True):
    """Frase de la sección h2 cuyo título encaja con rx (texto de la propia guía, sin inventar nada).
    Con prefer, la primera frase de la sección que lo cumple (p. ej. que tenga una cifra en €)."""
    for m in re.finditer(r'<h2[^>]*>(.*?)</h2>(.*?)(?=<h2|$)', gh or '', re.S):
        if re.search(rx, re.sub('<[^>]+>', '', m.group(1)), re.I):
            if prefer:
                txt = html.unescape(re.sub(r'<[^>]+>', ' ', ' '.join(re.findall(r'<(?:p|li)>(.*?)</(?:p|li)>', m.group(2), re.S))))
                snts = re.split(r'(?<=[.!?])\s+', re.sub(r'\s+', ' ', txt))
                for pf in (prefer if isinstance(prefer, tuple) else (prefer,)):
                    for snt in snts:
                        if 30 <= len(snt) and re.search(pf, snt, re.I):
                            return _first_sentence(snt)
                if not fallback:
                    return ''
            p = re.search(r'<p>(.*?)</p>', m.group(2), re.S)
            if p:
                return _first_sentence(p.group(1))
            li = re.findall(r'<li>(.*?)</li>', m.group(2), re.S)
            if li:
                return _first_sentence('; '.join(li[:3]))
    return ''


def guide_summary(gh, name, days, sub, updated_iso, lang='es', deal_href=None):
    """Caja "En resumen" arriba de la guía: respuestas directas y citables sacadas de la propia guía y de los chollos vivos."""
    es = lang == 'es'
    rows = []
    if days:
        rows.append(((f'Cuántos días para ver {name}' if es else f'How many days in {name}'), (f'{days} días para ver lo esencial de {name}; abajo tienes la ruta día a día.' if es else f'{days} days to see the essentials of {name}; the day-by-day route is below.')))
    MON = r'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|primavera|otoño|verano|invierno|January|February|March|April|May|June|July|August|September|October|November|December|spring|autumn|summer|winter'
    for lab_es, lab_en, rx, pref in (('Cuándo ir', 'When to go', r'cu[aá]ndo ir|mejor [eé]poca|when to go|best time', (rf'\b(mejor|ideal|best)\b.*\b({MON})\b|\b({MON})\b.*\b(mejor|ideal|best)\b', rf'^(?!(Es|Hace|It|This|That|Esta|Este)\b).*\b({MON})\b')),
                                     ('Presupuesto', 'Budget', r'presupuesto|cu[aá]nto cuesta|budget|cost', r'\d+\s?(€|euros?|EUR)|€\s?\d+|\d+\s?(\$|USD|£)'),
                                     ('Desde el aeropuerto', 'From the airport', r'aeropuerto|c[oó]mo llegar|airport|getting', r'aeropuerto|airport'),
                                     # ronda 10: zona para dormir en la caja de resumen ("dónde alojarse en X" es una de las preguntas que más hacen los asistentes)
                                     ('Dónde dormir', 'Where to stay', r'^\s*(d[oó]nde dormir|d[oó]nde alojarse|where to stay)', r'\b(barrio|zona|centro|casco|area|district|neighbou?rhood|old town|centre|center)\b'),
                                     ('Qué comer', 'What to eat', r'^\s*(qu[eé] comer|gastronom|what to eat|food)', r'\b(prueba|probar|t[ií]pic[oa]s?|plato|try|traditional|dish)\b')):
        t = section_text(gh, rx, pref, fallback=False)
        if t:
            rows.append((lab_es if es else lab_en, t))
    if sub:
        x = min(sub, key=lambda x_: x_.get('price') or 99999)
        f = x.get('facts') or {}
        o = f.get('origen') or ''
        href = deal_href(x) if deal_href else f"/chollos/{x['slug']}/"
        rows.append((('Vuelo más barato hoy' if es else 'Cheapest flight today'),
                     (f'<a href="{href}">{x["price"]} € ida y vuelta' + (f' desde {e(o)}' if o else '') + '</a>, comprobado por Happy Low Cost.' if es else
                      f'<a href="{href}">€{x["price"]} return' + (f' from {e(o)}' if o else '') + '</a>, checked by Happy Low Cost.')))
    if len(rows) < 2:
        return ''
    upd = (updated_iso or '')[:10]
    lab = ('En resumen' if es else 'In short')
    when = (f'<time datetime="{upd}">{fecha(updated_iso) if es else upd}</time>' if upd else '')
    return (f'<section class="g-sum" aria-label="{lab}"><div class="kicker">{lab}' + (f' · {"actualizado" if es else "updated"} {when}' if when else '') + '</div><dl>'
            + ''.join(f'<div><dt>{e(k)}</dt><dd>{v if "<a " in v else e(v)}</dd></div>' for k, v in rows) + '</dl></section>')


def guide_extra_faq(gh, name, days, sub, lang='es'):
    """Preguntas que la gente hace a Google y a los asistentes y que la guía aún no responde, con datos reales."""
    es = lang == 'es'
    have = ' '.join(re.findall(r'<h3>(.*?)</h3>', gh or '')).lower()
    out = []
    if days and not re.search(r'cu[aá]ntos d[ií]as|how many days|enough', have):
        out.append(((f'¿Cuántos días hacen falta para ver {name}?' if es else f'How many days do you need in {name}?'),
                    (f'Con {days} días ves lo esencial de {name} sin prisas. La ruta de esta guía está organizada día a día.' if es else f'{days} days are enough to see the essentials of {name} without rushing. The route in this guide is organised day by day.')))
    if sub:
        x = min(sub, key=lambda x_: x_.get('price') or 99999)
        o = (x.get('facts') or {}).get('origen') or ''
        out.append(((f'¿Cuánto cuesta un vuelo barato a {name}?' if es else f'How much is a cheap flight to {name}?'),
                    (f'Hoy el chollo más barato que tenemos a {name} cuesta {x["price"]} € ida y vuelta' + (f' desde {o}' if o else '') + '. Los precios cambian cada hora: compruébalo en la página del chollo.' if es else
                     f'Today the cheapest deal we have to {name} is €{x["price"]} return' + (f' from {o}' if o else '') + '. Fares change by the hour: check the live price on the deal page.')))
    # ronda 6: "is casablanca worth visiting" (pos. 9,4) y "¿merece la pena X?": respuesta con la primera frase de la propia guía
    if not re.search(r'merece la pena|vale la pena|worth', have):
        p1 = next((p_ for p_ in re.findall(r'<p>(.*?)</p>', gh or '', re.S) if len(re.sub(r'<[^>]+>', '', p_)) > 80), '')
        s1 = _first_sentence(p1, 220) if p1 else ''
        if s1 and not s1.endswith('…'):
            bud = section_text(gh, r'presupuesto|cu[aá]nto cuesta|budget|cost', r'\d+\s?(€|euros?|EUR)|€\s?\d+', fallback=False)
            if es:
                out.append((f'¿Merece la pena visitar {name}?', f'Para quien escribió esta guía, sí: {s1}' + (f' Con {days} días ves lo esencial.' if days else '') + (f' Presupuesto: {bud}' if bud else '')))
            else:
                out.append((f'Is {name} worth visiting?', f'For the traveller who wrote this guide, yes: {s1}' + (f' {days} days are enough for the essentials.' if days else '') + (f' Budget: {bud}' if bud else '')))
    return out


def guide_image_ld(slug, name, lang='es'):
    """ImageObject con autor y licencia de Wikimedia Commons: Google Imágenes muestra la licencia y el crédito."""
    c = CR.get(slug) or {}
    im = {"@type": "ImageObject", "@id": f"{SITE}/hlc/img/cities/{slug}.jpg#img", "url": f"{SITE}/hlc/img/cities/{slug}.jpg", "contentUrl": f"{SITE}/hlc/img/cities/{slug}.jpg",
          "caption": (f'Foto de {name}' if lang == 'es' else f'Photo of {name}')}
    if c.get('author'):
        im["creator"] = {"@type": "Person", "name": c['author']}
        im["creditText"] = f"{c['author']} / Wikimedia Commons"
    if c.get('license'):
        lic = c['license']
        mm = re.match(r'CC (BY(?:-SA)?|BY-NC(?:-SA)?) ?(\d\.\d)', lic)
        if mm:
            im["license"] = f"https://creativecommons.org/licenses/{mm.group(1).lower()}/{mm.group(2)}/"
        elif 'CC0' in lic or 'ublic domain' in lic:
            im["license"] = "https://creativecommons.org/publicdomain/zero/1.0/"
        im["copyrightNotice"] = lic
    if c.get('page'):
        im["acquireLicensePage"] = c['page']
    return im


# ---------- ronda SEO 3 (26-nov-2026): itinerario, lugares y presupuesto estructurados ----------
_DSPEC = r'(?:D[ií]as?|Days?)\s*(\d{1,2})(?:\s*(?:-|–|y|a|al|and|to)\s*(\d{1,2}))?'
_DAY_A = re.compile(r'<(li|p)>\s*<strong>\s*' + _DSPEC + r'\b([^<]*)</strong>(.*?)</\1>', re.S | re.I)
_DAY_B = re.compile(r'<h3>\s*' + _DSPEC + r'\b([^<]*)</h3>(.*?)(?=<h3>|$)', re.S | re.I)
_PARTS = (('mañana', r'mañana|morning'), ('tarde', r'tarde|afternoon'), ('noche', r'noche|evening|night'))


def _plain(h):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', h or ''))).strip()


def _cap(t):
    return t[:1].upper() + t[1:] if t else t


def _day_parts(h):
    """{'mañana': ..., 'tarde': ..., 'noche': ...} cuando la guía marca los tramos en negrita (Mañana:/Morning:)."""
    out = {}
    marks = list(re.finditer(r'<strong>\s*([^<:]{3,20}?)\s*:?\s*</strong>\s*:?', h))
    for k, m in enumerate(marks):
        lab = m.group(1).strip().lower()
        for key, rx in _PARTS:
            if re.fullmatch(rf'(?:por la |de |in the |the )?(?:{rx})', lab):
                end = marks[k + 1].start() if k + 1 < len(marks) else len(h)
                out[key] = _cap(_plain(h[m.end():end]).lstrip(' :.,'))
    return out


def guide_itinerary(gh, name, nd, lang='es'):
    """Ruta día a día de la propia guía en tabla (Día | Plan, o Día | Mañana | Tarde | Noche si la guía lo separa)
    y como TouristTrip para buscadores e IA. También pone el H2 literal de la consulta ("Qué ver en X en N días" /
    "X itinerary: N days"). Devuelve (gh, trip_ld). Sin días seguidos en el texto no toca nada (ronda SEO 3)."""
    es = lang == 'es'
    for m in re.finditer(r'<h2>(.*?)</h2>(.*?)(?=<h2>|$)', gh, re.S):
        sec = m.group(2)
        for rx, kind in ((_DAY_A, 'a'), (_DAY_B, 'b')):
            ms = list(rx.finditer(sec))
            if len(ms) < 2:
                continue
            items, nxt, ok = [], 1, True
            for d in ms:
                a, b = int(d.group(2) if kind == 'a' else d.group(1)), d.group(3) if kind == 'a' else d.group(2)
                b = int(b) if b else a
                if a != nxt or b < a:
                    ok = False
                    break
                nxt = b + 1
                lab = _plain(d.group(4) if kind == 'a' else d.group(3)).strip(' ,.:;')
                body_ = d.group(5) if kind == 'a' else d.group(4)
                items.append((a, b, _cap(lab), _cap(_plain(body_).lstrip(' :.,')), _day_parts(body_)))
            if ok:
                break
        else:
            continue
        if not ok:
            continue
        last = items[-1][1]
        n = nd if nd and nd >= last else last
        D = ('Día', 'Días') if es else ('Day', 'Days')
        dl = (lambda a, b: f'{D[0]} {a}' if a == b else f'{D[1]} {a}-{b}')
        # tres columnas solo si los tramos recogen todo el texto del día (no se pierde nada de la guía)
        three = all(len(it[4]) >= 2 and sum(len(v) for v in it[4].values()) >= 0.85 * len(re.sub(r'(?i)\b(por la )?(mañana|tarde|noche|morning|afternoon|evening|night)\s*:', '', it[3])) for it in items)
        if three:
            H = ('Mañana', 'Tarde', 'Noche') if es else ('Morning', 'Afternoon', 'Evening')
            head_ = f'<th scope="col">{D[0]}</th>' + ''.join(f'<th scope="col">{h_}</th>' for h_ in H)
            rows = ''.join(f'<tr><th scope="row">{dl(a, b)}' + (f'<br><small>{e(lab)}</small>' if lab else '') + '</th>' + ''.join(f'<td>{e(pt.get(k_, ""))}</td>' for k_, _r in _PARTS) + '</tr>' for a, b, lab, txt, pt in items)
        else:
            head_ = f'<th scope="col">{D[0]}</th><th scope="col">Plan</th>'
            rows = ''.join(f'<tr><th scope="row">{dl(a, b)}</th><td>' + (f'<b>{e(lab)}.</b> ' if lab else '') + f'{e(txt)}</td></tr>' for a, b, lab, txt, pt in items)
        cap = (f'Itinerario de {n} días en {name}' if es else f'{n}-day itinerary for {name}')
        tbl = f'<div class="g-tw" role="region" tabindex="0" aria-label="{e(cap)}"><table class="g-itin"><caption>{e(cap)}</caption><thead><tr>{head_}</tr></thead><tbody>{rows}</tbody></table></div>'
        first, lastm = ms[0], ms[-1]
        rx_ = _DAY_A if kind == 'a' else _DAY_B
        mid = rx_.sub('', sec[first.start():lastm.end()])
        new = sec[:first.start()] + '\x00' + mid + sec[lastm.end():]
        new = re.sub(r'<ul>\s*\x00\s*</ul>', '\x00', new)
        new = re.sub(r'<ul>\s*</ul>', '', new).replace('\x00', tbl)
        h2 = m.group(1)
        lit = (f'Qué ver en {name} en {n} días' if es else f'{name} itinerary: {n} days')
        if lit.lower() not in _plain(h2).lower():
            h2 = e(f'{lit}: ruta día a día' if es else f'{lit}, day by day')
        gh = gh[:m.start()] + f'<h2>{h2}</h2>' + new + gh[m.end():]
        trip = {"@type": "TouristTrip", "name": cap, "itinerary": {"@type": "ItemList", "numberOfItems": len(items), "itemListElement": [
            {"@type": "ListItem", "position": k + 1, "name": dl(a, b) + (f': {lab}' if lab else ''), "description": _first_sentence(txt, 300)} for k, (a, b, lab, txt, pt) in enumerate(items)]}}
        return gh, trip
    return gh, None


def guide_short_faq(gh, trip, name, lang='es'):
    """Ronda 7 (#382, #383): "¿Qué ver en X en 1 día?" y "en 2 días" con los días 1 y 2 de la propia ruta.
    Solo si la ruta tiene más días que la pregunta y los días 1 y 2 van sueltos (no "Días 1-2")."""
    es = lang == 'es'
    if not trip:
        return gh
    its = (trip.get('itinerary') or {}).get('itemListElement') or []
    D = 'Día' if es else 'Day'
    one = [i for i in its if re.match(rf'{D} 1(:|$)', i.get('name', ''))]
    two = [i for i in its if re.match(rf'{D} 2(:|$)', i.get('name', ''))]
    have = ' '.join(re.findall(r'<h3>(.*?)</h3>', gh or '')).lower()
    lab = lambda i: (i['name'].split(':', 1)[1].strip() + '. ') if ':' in i['name'] else ''
    add = []
    if one and len(its) >= 2 and not re.search(r'\b(1|un|one) d[ií]a\b|\bone day\b|\b1 day\b', have):
        d1 = one[0].get('description') or ''
        if d1 and not d1.endswith('…'):
            add.append((f'¿Qué ver en {name} en 1 día?', f'Si solo tienes un día, haz el día 1 de esta ruta: {lab(one[0])}{d1}') if es else
                       (f'What to see in {name} in one day?', f'If you only have one day, follow day 1 of this itinerary: {lab(one[0])}{d1}'))
    if one and two and len(its) >= 3 and not re.search(r'\b(2|dos|two) d[ií]as\b|\b2 days\b|\btwo days\b', have):
        d1, d2 = one[0].get('description') or '', two[0].get('description') or ''
        if d1 and d2 and not d1.endswith('…') and not d2.endswith('…'):
            add.append((f'¿Qué ver en {name} en 2 días?', f'Con dos días, sigue los días 1 y 2 de esta ruta. Día 1: {lab(one[0])}{d1} Día 2: {lab(two[0])}{d2}') if es else
                       (f'What to see in {name} in two days?', f'With two days, follow days 1 and 2 of this itinerary. Day 1: {lab(one[0])}{d1} Day 2: {lab(two[0])}{d2}'))
    if not add:
        return gh
    h = ''.join(f'<h3>{e(q)}</h3><p>{e(a)}</p>' for q, a in add)
    mfaq = re.search(r'(<h2>[^<]*(?:Preguntas frecuentes|FAQ)[^<]*</h2>.*?)(?=<h2|$)', gh, re.S | re.I)
    return (gh[:mfaq.end()] + h + gh[mfaq.end():]) if mfaq else gh + ('<h2>Preguntas frecuentes</h2>' if es else '<h2>FAQs</h2>') + h


_NUM_ES = {2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco', 6: 'seis', 7: 'siete', 8: 'ocho', 9: 'nueve', 10: 'diez'}
_NUM_EN = {2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten'}
_GUIDES_BY_COUNTRY = {}


def _clip9(t, n=90):
    """Corta en la última coma (o en el último espacio, con …) para no dejar palabras a medias."""
    t = t.strip().rstrip(' ,;.')
    if len(t) <= n:
        return t
    k = t.rfind(',', 0, n)
    if k >= 25:
        return t[:k]
    k = t.rfind(' ', 0, n)
    return re.sub(r'\s+(y|e|o|de|del|la|el|en|a|con|and|the|of|to|in|with|for)$', '', t[:k]) + '…'


def guide_todo_faq(gh, trip, name, country='', lang='es'):
    """Ronda 9 (GSC 31-oct a 27-nov): "que hacer en bucarest en 3 dias" (20 impr.), "que hacer en varsovia en 3 dias", "que hacer en zanzibar 7 dias",
    "que hacer en oslo/helsinki/zurich…", "what to do in turin for 3 days", "que ver en hamburgo en tres dias", "bruselas three days" y
    "que ver en estonia en 3 días" (19 impr. en la guía de Tallin). Dos preguntas con la ruta de la propia guía:
    "¿Qué hacer en X en N días?" (con el número también en letra) y, si es la única guía de su país, "¿Qué ver en <país> en N días?"."""
    es = lang == 'es'
    if not trip:
        return gh
    its = (trip.get('itinerary') or {}).get('itemListElement') or []
    if len(its) < 2:
        return gh
    m_ = re.search(r'(\d{1,2})', trip.get('name', ''))
    n = int(m_.group(1)) if m_ else 0
    if not 2 <= n <= 21:
        return gh
    have = ' '.join(re.findall(r'<h3>(.*?)</h3>', gh or '')).lower()
    word = (_NUM_ES if es else _NUM_EN).get(n, str(n))
    parts = []
    for i in its:
        nm = i.get('name', '')
        if ':' in nm:
            d_, lab = nm.split(':', 1)
            parts.append(f'{d_.strip()}, {_clip9(lab.strip())}')
        else:
            parts.append(f'{nm}, {_clip9(_first_sentence(i.get("description") or "", 300).rstrip("."))}')
    if any(len(x_) < 8 for x_ in parts):
        return gh
    plan = '; '.join(parts) + '.'
    add = []
    if not re.search(r'qu[eé] hacer en .* en \d|what to do in .* in \d', have):
        add.append((f'¿Qué hacer en {name} en {n} días?', f'Con {word} días en {name}, esta es la ruta de la guía: {plan} En la tabla de arriba tienes el plan completo de cada día.') if es else
                   (f'What to do in {name} in {n} days?', f'With {word} days in {name}, this is the guide\'s route: {plan} The table above has the full plan for each day.'))
    if not _GUIDES_BY_COUNTRY:
        for q_ in DLIB:
            for k_ in {en_names.COUNTRY_ES_FIX.get(q_['c'], q_['c']), en_names.country_en(q_['c'])}:
                _GUIDES_BY_COUNTRY[k_] = _GUIDES_BY_COUNTRY.get(k_, 0) + 1
    if country and _GUIDES_BY_COUNTRY.get(country, 0) == 1 and country.lower() not in name.lower() and not re.search(re.escape(country.lower()), have):
        add.append((f'¿Qué ver en {country} en {n} días?', f'Con {word} días en {country}, esta guía propone quedarse en {name} y seguir su ruta: {plan}') if es else
                   (f'What to see in {country} in {n} days?', f'With {word} days in {country}, this guide suggests staying in {name} and following its route: {plan}'))
    if not add:
        return gh
    h = ''.join(f'<h3>{e(q)}</h3><p>{e(a)}</p>' for q, a in add)
    mfaq = re.search(r'(<h2>[^<]*(?:Preguntas frecuentes|FAQ)[^<]*</h2>.*?)(?=<h2|$)', gh, re.S | re.I)
    return (gh[:mfaq.end()] + h + gh[mfaq.end():]) if mfaq else gh + ('<h2>Preguntas frecuentes</h2>' if es else '<h2>FAQs</h2>') + h


def _sec_sents(gh, rx):
    """Frases de la primera sección h2 cuyo título encaja con rx."""
    for m in re.finditer(r'<h2[^>]*>(.*?)</h2>(.*?)(?=<h2|$)', gh or '', re.S):
        if re.search(rx, re.sub('<[^>]+>', '', m.group(1)), re.I):
            txt = html.unescape(re.sub(r'<[^>]+>', ' ', ' '.join(re.findall(r'<(?:p|li)>(.*?)</(?:p|li)>', m.group(2), re.S))))
            txt = re.sub(r'\s+([,.;:!?])', r'\1', re.sub(r'\s+', ' ', txt)).replace(' — ', ', ').replace('—', ', ')
            return [x.strip() for x in re.split(r'(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])', txt) if x.strip()]
    return []


def _pick(sents, inc, exc=None, n=240):
    for pat in (inc if isinstance(inc, tuple) else (inc,)):
        for x in sents:
            if 40 <= len(x) <= n and x[-1] in '.!?' and re.search(pat, x, re.I) and not (exc and re.search(exc, x, re.I)):
                return x
    return ''


def guide_section_faq(gh, name, lang='es', hotels=None):
    """Ronda 10: preguntas que hacen la gente y los asistentes de IA ("mejor época para viajar a X", "dónde alojarse en X", "qué comer en X",
    "cómo llegar del aeropuerto", "cómo moverse por X", "qué lugares ver en X") respondidas con frases de las secciones de la propia guía.
    Todas las guías tienen esas secciones (Cuándo ir, Dónde dormir, Qué comer y dónde, Cómo llegar desde el aeropuerto y moverse, Qué ver),
    pero la respuesta estaba repartida por la página y no en la FAQ (que es lo que extraen FAQPage, Bing/Copilot y los LLM).
    Solo se añade la pregunta si la FAQ no la tiene ya y si hay una frase entera que responda. hotels = (pregunta, respuesta) de top3.hotel_faq."""
    es = lang == 'es'
    have = ' '.join(re.findall(r'<h3>(.*?)</h3>', gh or '')).lower()
    MON = r'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|primavera|otoño|verano|invierno|January|February|March|April|May|June|July|August|September|October|November|December|spring|autumn|summer|winter'
    add = []
    if not re.search(r'cu[aá]ndo ir|[eé]poca|best time|when to (go|visit)', have):
        t = _pick(_sec_sents(gh, r'^\s*(cu[aá]ndo ir|mejor [eé]poca|when to go|best time)'),
                  (rf'\b(mejor|ideal|best|perfect|recomend|recommend|most comfortable|easy answer|más agradable)\b.*\b({MON})\b|\b({MON})\b.*\b(mejor|ideal|best|perfect|más agradable|most comfortable)\b',))
        if t:
            add.append((f'¿Cuál es la mejor época para viajar a {name}?', t) if es else (f'When is the best time to visit {name}?', t))
    if not re.search(r'dormir|alojar|where to stay|hotel', have):
        t = _pick(_sec_sents(gh, r'^\s*(d[oó]nde dormir|d[oó]nde alojarse|alojamiento|where to stay)'), (r'\b(barrio|zona|centro|casco|area|district|neighbou?rhood|old town|centre|center)\b',))
        extra = (' ' + hotels[1]) if hotels else ''
        if t or hotels:
            add.append((f'¿Dónde alojarse en {name}?', (t + extra).strip()) if es else (f'Where to stay in {name}?', (t + extra).strip()))
    if not re.search(r'comer|gastronom|eat|food|dish', have):
        t = _pick(_sec_sents(gh, r'^\s*(qu[eé] comer|gastronom|what to eat|food)'), (r'\b(prueba|probar|t[ií]pic[oa]s?|plato|try|traditional|dish|signature)\b',))
        if t:
            add.append((f'¿Qué comer en {name}?', t) if es else (f'What to eat in {name}?', t))
    ss = _sec_sents(gh, r'aeropuerto|airport|c[oó]mo llegar|getting')
    if not re.search(r'aeropuerto|airport', have):
        t = _pick(ss, (r'aeropuerto|airport',))
        if t:
            add.append((f'¿Cómo llegar del aeropuerto al centro de {name}?', t) if es else (f'How do you get from the airport to central {name}?', t))
    if not re.search(r'moverse|getting around|transporte|transport|get around', have):
        t = _pick(ss, (r'\b(metro|tranv[ií]a|tram|a pie|andando|caminando|on foot|walk\w*|bici\w*|bike|tarjeta|card|pass)\b',), r'aeropuerto|airport|\bOTP\b|desde el avi[oó]n')
        if t:
            add.append((f'¿Cómo moverse por {name}?', t) if es else (f'How do you get around {name}?', t))
    if not re.search(r'imprescindible|must-see|lugares|places', have):
        for m in re.finditer(r'<h2[^>]*>(.*?)</h2>(.*?)(?=<h2|$)', gh or '', re.S):
            if re.match(r'\s*(qu[eé] ver|what to see)', re.sub('<[^>]+>', '', m.group(1)), re.I):
                pl = [html.unescape(re.sub('<[^>]+>', '', h3)).strip() for h3 in re.findall(r'<h3>(.*?)</h3>', m.group(2), re.S)]
                pl = [x for x in pl if 2 < len(x) <= 60][:8]
                if len(pl) >= 3:
                    lst = '; '.join(pl)
                    add.append((f'¿Qué lugares imprescindibles ver en {name}?', f'Según esta guía: {lst}. En la sección "Qué ver" tienes cada uno explicado.') if es else
                               (f'What are the must-see places in {name}?', f'According to this guide: {lst}. Each one is explained in the "What to see" section.'))
                break
    if not add:
        return gh
    h = ''.join(f'<h3>{e(q)}</h3><p>{e(a)}</p>' for q, a in add)
    mfaq = re.search(r'(<h2>[^<]*(?:Preguntas frecuentes|FAQ)[^<]*</h2>.*?)(?=<h2|$)', gh, re.S | re.I)
    return (gh[:mfaq.end()] + h + gh[mfaq.end():]) if mfaq else gh + ('<h2>Preguntas frecuentes</h2>' if es else '<h2>FAQs</h2>') + h


def llms_month_blocks(deals, lang='es', namer=None):
    """Ronda 7 (#76, #72): "Datos del mes" y "Últimos cambios" fechados al principio de llms-full (ES y EN).
    Todo sale de los chollos vivos: nada inventado."""
    es = lang == 'es'
    if not deals:
        return []
    import statistics
    pr = sorted(x.get('price') for x in deals if x.get('price'))
    sv = [x['facts'].get('ahorro_pct') for x in deals if x['facts'].get('ahorro_pct')]
    dr = [x for x in deals if x['facts'].get('escalas') == 0]
    orig = {x['facts'].get('origen') for x in deals if x['facts'].get('origen')}
    cheap = min(deals, key=lambda y: y.get('price') or 99999)
    cf = dict(cheap['facts'])
    nm = namer or (lambda y: (y['facts'].get('origen'), y['facts'].get('destino')))
    cf['origen'], cf['destino'] = nm(cheap)
    d0 = fecha(datetime.date.today().isoformat()) if es else datetime.date.today().strftime('%-d %b %Y')
    out = [(f'## Datos del mes (a {d0})' if es else f'## This month in numbers (as of {d0})'), '']
    if es:
        out += [f'- Chollos activos: {len(deals)}, desde {len(orig)} ciudades de salida.',
                f'- Precio mediano de un chollo: {int(statistics.median(pr))} € ida y vuelta (el más barato: {cf.get("origen")} → {cf.get("destino")} por {cheap.get("price")} €).' if pr else '',
                f'- Descuento mediano frente al precio habitual: {int(statistics.median(sv))} %.' if sv else '',
                f'- Chollos con vuelo directo: {len(dr)} de {len(deals)}.', '']
    else:
        out += [f'- Live deals: {len(deals)}, from {len(orig)} departure cities.',
                f'- Median deal price: €{int(statistics.median(pr))} return (cheapest: {cf.get("origen")} to {cf.get("destino")} for €{cheap.get("price")}).' if pr else '',
                f'- Median saving against the usual fare: {int(statistics.median(sv))}%.' if sv else '',
                f'- Deals with a nonstop flight: {len(dr)} of {len(deals)}.', '']
    out = [l for l in out if l != ''] + ['']
    rec = sorted(deals, key=lambda y: y.get('approved_at') or '', reverse=True)[:8]
    out += [('## Últimos cambios' if es else '## Latest changes'), '']
    for x in rec:
        f = x['facts']
        dd = fecha((x.get('approved_at') or '')[:10]) if es else (x.get('approved_at') or '')[:10]
        if es:
            out.append(f"- {dd}: nuevo chollo {f.get('origen')} → {f.get('destino')} por {x.get('price')} € ({SITE}/chollos/{x['slug']}/)")
        else:
            out.append(f"- {dd}: new deal {nm(x)[0]} to {nm(x)[1]} for €{x.get('price')} ({SITE}/en/deals/{en_deal_slug(x)}/)")
    return out + ['']


IDEA_T_ES = {'directos': 'Chollos de vuelos directos', 'fin-de-semana': 'Escapadas de fin de semana baratas', 'larga-distancia': 'Vuelos de larga distancia por menos de 600 €',
             'menos-de-100-euros': 'Vuelos por menos de 100 euros ida y vuelta', 'menos-de-50-euros': 'Vuelos por menos de 50 euros ida y vuelta'}  # ronda 9: "vuelos por menos de 50/100 euros" pos. 8-10
IDEA_T_EN = {'nonstop': 'Nonstop flight deals', 'weekend-getaways': 'Cheap weekend getaways', 'long-haul': 'Long-haul flights under €600',
             'under-100': 'Flights under €100 return', 'under-50': 'Flights under €50 return'}
_MES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']


def idea_title_es(k_, h1_):
    """Ronda 7 (#253): ideas sin fecha llevan mes y año en el título (frescura y CTR) y sin "chollos de vuelos" repetido.
    "ida y vuelta" en las de precio: GSC "vuelos por 50 euros ida y vuelta" 38 impr. pos. 9,2."""
    t = IDEA_T_ES.get(k_)
    if not t:
        return f'{h1_}: chollos de vuelos · Happy Low Cost'
    d = datetime.date.today()
    return f'{t} ({_MES_L[d.month - 1]} {d.year})'


def idea_title_en(k_, h1_):
    t = IDEA_T_EN.get(k_)
    if not t:
        return f'{h1_}: cheap flight deals · Happy Low Cost'
    return f'{t} ({datetime.date.today().strftime("%B %Y")})'


try:
    _DIAS = json.load(open(os.path.join('destinos', 'dias.json'), encoding='utf-8'))
except Exception:
    _DIAS = {}


def deal_days_p(slug, name, lang='es'):
    """Ronda 7 (#415): en cada chollo, párrafo "Qué ver en X en N días" enlazado a la guía (ancla con la consulta que posiciona)."""
    n = _DIAS.get(slug)
    if not n:
        return ''
    if lang == 'es':
        return (f'<p><b>¿Qué ver en {e(name)} en {n} días?</b> Si coges este vuelo, <a href="/destinos/{slug}/">aquí tienes la ruta de {n} días por {e(name)}</a>, '
                'día a día, con lo que cuesta, dónde dormir y qué comer.</p>')
    return (f'<p><b>What to do in {e(name)} in {n} days?</b> If you book this flight, <a href="/en/destinations/{en_dest_slug(slug)}/">here is our {n}-day {e(name)} itinerary</a>, '
            'day by day, with costs, where to stay and what to eat.</p>')


_RFEED = {}


def deal_route_p(f, lang='es'):
    """Ronda 8: en cada chollo, enlace a la página de la ruta (precio de hoy y calendario) si está indexada.
    GSC: "vuelo sevilla edimburgo" 17 impr. pos. 18 en el chollo, mientras /vuelos/sevilla-edimburgo/ es la página que dura."""
    es = lang == 'es'
    k = 'es' if es else 'en'
    if k not in _RFEED:
        try:
            fp = os.path.join('vuelos', 'feed.json') if es else os.path.join('en', 'flights', 'feed.json')
            _RFEED[k] = {(r['origin_iata'], r['destination_iata']): r for r in json.load(open(fp, encoding='utf-8'))['routes']}
        except Exception:
            _RFEED[k] = {}
    r = _RFEED[k].get(((f.get('origen_iata') or '').upper(), (f.get('destino_iata') or '').upper()))
    if not r:
        return ''
    u = r['url'].replace(SITE, '')
    # ronda 9: "vuelo sevilla edimburgo", "vuelo ibiza helsinki", "vuelos gran canaria hong kong" en chollos (pos. 17-18): H2 con la consulta literal
    if es:
        return (f'<h2>Vuelo {e(r["origin"])} {e(r["destination"])}: precio de hoy en la ruta</h2><p><b>¿Y si este chollo se acaba?</b> En <a href="{u}">vuelos baratos {e(r["origin"])}-{e(r["destination"])}</a> tienes el precio más bajo que hemos visto en esta ruta '
                f'({r["price_from_eur_return"]} € ida y vuelta), el mes más barato y el calendario de precios.</p>')
    return (f'<h2>{e(r["origin"])} to {e(r["destination"])} flight: today\'s price on the route</h2><p><b>What if this deal ends?</b> Our <a href="{u}">cheap flights {e(r["origin"])} to {e(r["destination"])}</a> page shows the lowest fare we have seen on this route '
            f'(€{r["price_from_eur_return"]} return), the cheapest month and the price calendar.</p>')


def guide_attractions(gh):
    """Lugares de la sección "Qué ver" (nombre en negrita + descripción de la guía) como TouristAttraction."""
    for m in re.finditer(r'<h2>(.*?)</h2>(.*?)(?=<h2>|$)', gh, re.S):
        if not re.search(r'qu[eé] ver|what to see|sights|top sights', _plain(m.group(1)), re.I) or re.search(r'd[ií]as|days', _plain(m.group(1)), re.I):
            continue
        out = []
        pairs = [(li.group(1), li.group(2)) for li in re.finditer(r'<li>\s*<strong>(.*?)</strong>(.*?)</li>', m.group(2), re.S)]
        if len(pairs) < 3:
            pairs = [(h_.group(1), h_.group(2)) for h_ in re.finditer(r'<h3>(.*?)</h3>\s*(.*?)(?=<h3>|$)', m.group(2), re.S)]
        for li_name, li_body in pairs:
            nm = _plain(li_name).rstrip(' .:,;')
            if 2 < len(nm) < 90:
                d_ = _first_sentence(li_body, 240)
                out.append({"@type": "TouristAttraction", "name": nm, **({"description": d_} if len(d_) > 20 else {})})
        if len(out) >= 3:
            return out[:20]
    return []



def hotels_ld(hl, lang='es'):
    """Ronda 8 (#443): /hoteles/ y /en/hotels/ con ItemList de destinos, cada uno con su foto como ImageObject (autor y licencia en la ficha de la guía)."""
    es = lang == 'es'
    items = []
    for i, (p, _c) in enumerate(hl):
        u = f"{SITE}/destinos/{p['s']}/#hoteles" if es else f"{SITE}/en/destinations/{en_dest_slug(p['s'])}/#hotels"
        nm = p['n'] if es else en_names.NAMES.get(p['s'], p['n'])
        items.append({"@type": "ListItem", "position": i + 1, "item": {"@type": "TouristDestination", "name": nm, "url": u,
                      "image": {"@type": "ImageObject", "contentUrl": f"{SITE}/hlc/img/cities/{p['s']}-800.jpg", "caption": (f"Foto de {nm}" if es else f"Photo of {nm}")}}})
    return {"@type": "ItemList", "name": ("Dónde dormir en cada destino" if es else "Where to stay in every destination"), "numberOfItems": len(items), "itemListElement": items}


def guide_meta(name, nd, attr, bud, lang='es'):
    """Ronda 8 (#99/#137 continuación, CTR): meta description con 3 lugares concretos de la propia guía.
    GSC 30-oct a 26-nov: las guías están en pos. 5-10 por "qué ver en X en 3 días" con CTR casi 0 (Bucarest 460 impr., Varsovia 322,
    Hamburgo 204, Tallinn EN 359, Zanzíbar EN 297) y la meta empezaba igual en todas ("3 días en X, día a día: guía hecha por un viajero...")."""
    es = lang == 'es'
    names = []
    for a in attr or []:
        n_ = re.sub(r'\s*\(.*?\)', '', a.get('name', '')).strip(' .,:;')
        if 3 <= len(n_) <= 30 and n_.lower() != name.lower() and n_ not in names and not re.search(r'[:—/]|\d{3,}|\s(y|e|and|&)\s', n_):
            names.append(n_)
        if len(names) == 3:
            break
    if len(names) < 3 or not nd:
        return ''
    lst = f'{names[0]}, {names[1]} {"y" if es else "and"} {names[2]}'
    bud_ = re.sub(r'(?i)\s*euros?\b', ' €', bud or '').strip()
    if es:
        d = f'Qué ver en {name} en {nd} días: {lst}. Ruta día a día, dónde dormir y qué comer.'
        if bud_ and len(d) + len(bud_) + 22 <= 170:
            d += f' Presupuesto: {bud_} al día.'
    else:
        d = f'{name} itinerary for {nd} days: {lst}. Day-by-day route, where to stay and what to eat.'
        if bud_ and len(d) + len(bud_) + 18 <= 170:
            d += f' Budget: {bud_} a day.'
    return d if len(d) <= 175 else ''

# Ronda 5: título y H1 con la consulta exacta que trae impresiones en Search Console (28 días, pos. 8-20, 0 clics)
TITLE_Q_ES = {
    'bruselas': lambda n, d: f'Qué ver en {n} en {d} días: qué comer y cuánto cuesta',  # "que ver en bruselas en 3 dias" 38 impr. pos. 19
    'sofia': lambda n, d: f'Qué ver y hacer en {n} en {d} días: guía low cost con precios',  # ronda 9: + "que hacer en sofia en 3 dias" pos. 10,6  # "que ver en sofia 3 dias" 33 impr. pos. 10
    'punta-cana': lambda n, d: f'{n} en {d} días: guía para viajar barato por tu cuenta',  # "7 días en punta cana" pos. 11,5 (la guía tiene 6)
    'maldivas': lambda n, d: f'Qué ver y hacer en {n} en {d} días: guía low cost',  # "que hacer en maldivas 7 días" 33 impr. pos. 7,9
    'estocolmo': lambda n, d: f'Qué ver y hacer en {n} en {d} días: guía práctica low cost',  # ronda 9: + "que hacer en estocolmo en 3 dias" pos. 9,2  # "que ver en estocolmo en 3 dias" 26 impr. pos. 11
    # Ronda 6 (GSC 30-oct a 26-nov)
    'zanzibar': lambda n, d: f'Qué ver en {n} en {d} días: playa, Stone Town y precios',  # "que ver/que hacer en zanzibar 7 dias" 71 impr. pos. 9,6
    'cerdena': lambda n, d: f'{n} barato: qué ver en {d} días y cuánto cuesta',  # "cerdeña barato" 23 impr. pos. 22,5
    'cancun': lambda n, d: f'Qué hacer en {n} en {d} días: guía low cost con precios',  # "que hacer en cancun en 4 dias" 15 impr. pos. 9,6
    'fez': lambda n, d: f'Qué ver en {n} en {d} días: la medina, dónde comer y dormir',  # "que ver en fez en 3 dias" 16 impr. pos. 9,2
    'las-vegas': lambda n, d: f'Qué ver y hacer en {n} en {d} días: guía low cost',  # ronda 9: "que ver en las vegas" 35 impr. pos. 21 y "que ver en las vegas en 4 dias" pos. 5,9  # "que hacer en las vegas en 4 dias" 15 impr. pos. 5,9
    # Ronda 7 (GSC 31-oct a 27-nov): "qué hacer" y variantes que no estaban en el título
    'varsovia': lambda n, d: f'Qué ver en {n} en {d} días: qué hacer y cuánto cuesta',  # "que ver..." 189 impr. pos. 10,6 + "que hacer en varsovia en 3 dias" 17 pos. 9,5
    'helsinki': lambda n, d: f'Qué ver en {n} en {d} días: qué hacer y cuánto cuesta',  # + "que hacer en helsinki 3 dias" 12 pos. 10,1
    'bucarest': lambda n, d: f'Qué ver en {n} en {d} días: qué hacer y cuánto cuesta',  # 155 impr. pos. 10,2 + "que hacer en bucarest en 3 dias" 20 pos. 9,7
    'oslo': lambda n, d: f'Qué ver en {n} en {d} días: qué hacer y cuánto cuesta',  # 37 impr. pos. 10,2 + "que hacer en oslo 3 dias" 11 pos. 10,5
    'zurich': lambda n, d: f'Qué ver en {n} en {d} días: qué hacer y cuánto cuesta',  # 33 impr. pos. 9,7 + "que hacer en zurich en 2 dias" 10 pos. 9,8
    'buenos-aires': lambda n, d: f'Qué hacer en {n} en {d} días: qué ver y cuánto cuesta',  # "que hacer..." 12+4 impr. pos. 4-11, "que ver..." 11
    'phuket': lambda n, d: f'Qué hacer en {n} en {d} días: playas, qué ver y precios',  # "que hacer en phuket en 5 dias" 9 impr. pos. 6,1
    'miami': lambda n, d: f'Qué hacer en {n} en {d} días: qué visitar y cuánto cuesta',  # "que hacer en miami en 4 dias" 8 pos. 8,1, "que visitar..." 3
    'oporto': lambda n, d: f'Qué hacer en {n} en {d} días: qué ver y presupuesto',  # "que hacer en oporto 3 dias" 6+3 impr.
    'munich': lambda n, d: f'Qué ver en {n} en {d} días: comer y dormir sin arruinarte',  # "que ver en munich en 3 dias" 48 impr. pos. 49,7 (el título no decía "qué ver")
    'marrakech': lambda n, d: f'Qué ver en {n} en {d} días: precios y dónde dormir',  # "precios en marrakech" 9 pos. 22, "que ver en marrakech en 3 días" 5
    'chipre': lambda n, d: f'Qué ver en {n} en {d} días: una semana en coche',  # "que ver en chipre en una semana" 10 pos. 11,3
    'tallin': lambda n, d: f'Qué ver en {n} en {d} días: Estonia low cost con precios',  # "que ver en estonia en 3 días" 19 pos. 10,2

    # Ronda 9 (GSC 31-oct a 27-nov): "qué hacer" junto a "qué ver"
    'belgrado': lambda n, d: f'Qué ver y hacer en {n} en {d} días: guía de un viajero low cost',  # "que hacer en belgrado 3 dias" pos. 8,4 + "que ver" 77 impr. pos. 7,5
    'riga': lambda n, d: f'Qué ver y hacer en {n} en {d} días: guía barata y sin prisas',  # "que hacer en riga en 3 dias" pos. 7,7 + "que ver" 64 impr. pos. 8,2
}

try:
    PAISES = json.load(open(os.path.join('vuelos', 'paises.json'), encoding='utf-8'))  # slug de país -> (hub ES, hub EN), lo escribe gen_prices
except Exception:
    PAISES = {}

BUD_ROWS = []  # filas (nivel, importe, qué incluye) de la última tabla de presupuesto construida


def guide_cost_faq(gh, name, lang='es'):
    """Ronda 5: FAQ "¿Es caro X?" / "Is X expensive?" con las cifras de la propia tabla de presupuesto.
    Search Console (28 días): "is salzburg expensive" 49 impresiones en pos. 20, "is munich expensive" 17 en pos. 25,
    "how expensive is it to go to the maldives"... y la guía no lo respondía en una frase."""
    es = lang == 'es'
    rows = list(BUD_ROWS)
    BUD_ROWS[:] = []
    if len(rows) < 2:
        return gh
    have = ' '.join(re.findall(r'<h3>(.*?)</h3>', gh or '')).lower()
    if re.search(r'\bcaro\b|expensive|pricey', have):
        return gh
    clean = lambda v: re.sub(r'(?i)\s*(al d[ií]a|por d[ií]a|por persona( y d[ií]a)?|a day|per day|per person( per day)?|pp)\b\.?', '', v).strip(' ,.')
    lo, hi = rows[0], rows[-1]
    if es:
        q = f'¿Es caro viajar a {name}?'
        a = (f'Depende de cómo viajes. Según esta guía, en el nivel "{lo[0].lower()}" se gastan unos {clean(lo[1])} por persona y día, '
             f'y en el nivel "{hi[0].lower()}", unos {clean(hi[1])}. El vuelo va aparte: en esta página tienes los precios reales comprobados por Happy Low Cost.')
    else:
        q = f'Is {name} expensive?'
        a = (f'It depends on how you travel. This guide puts the "{lo[0].lower()}" level at about {clean(lo[1])} per person per day '
             f'and the "{hi[0].lower()}" level at about {clean(hi[1])}. Flights are extra: this page shows real fares checked by Happy Low Cost.')
    add = f'<h3>{e(q)}</h3><p>{e(a)}</p>'
    mfaq = re.search(r'(<h2>[^<]*(?:Preguntas frecuentes|FAQ)[^<]*</h2>.*?)(?=<h2|$)', gh, re.S | re.I)
    return (gh[:mfaq.end()] + add + gh[mfaq.end():]) if mfaq else gh + ('<h2>Preguntas frecuentes</h2>' if es else '<h2>FAQs</h2>') + add


def guide_budget(gh, lang='es'):
    """Sección de presupuesto por día en tabla (Nivel | Por día | Qué incluye) con las cifras de la guía.
    Devuelve (gh, importe del nivel más barato en texto o '')."""
    es = lang == 'es'
    for m in re.finditer(r'<h2>(.*?)</h2>(.*?)(?=<h2>|$)', gh, re.S):
        h2t = _plain(m.group(1))
        if not re.search(r'presupuesto|budget|cu[aá]nto cuesta|how much', h2t, re.I) or re.search(r'dormir|alojar|stay|sleep', h2t, re.I):
            continue
        ul = re.search(r'<ul>(.*?)</ul>', m.group(2), re.S)
        if not ul:
            continue
        rows, rest = [], []
        for li in re.findall(r'<li>(.*?)</li>', ul.group(1), re.S):
            mm = re.match(r'\s*<strong>(.*?)</strong>(.*)', li, re.S)
            lab = _plain(mm.group(1)).rstrip(' :.') if mm else ''
            am = (re.match(r'(.*?)\s*\(([^()]*\d[^()]*)\)$', lab) or re.match(r'(.*?)[,:]\s*([^,:]*\d[^,:]*)$', lab)) if mm else None
            if am and re.search(r'€|eur|£|\$|usd', am.group(2), re.I) and not re.search(r'entrada|ticket|vuelo|flight', am.group(1), re.I):
                rows.append((am.group(1).strip(), am.group(2).strip(), _cap(_plain(mm.group(2)).lstrip(' :.,'))))
            else:
                rest.append(li)
        if len(rows) < 2:
            continue
        H = ('Nivel', 'Por persona y día', 'Qué incluye') if es else ('Level', 'Per person per day', 'What it covers')
        tbl = (f'<div class="g-tw" role="region" tabindex="0" aria-label="{"Presupuesto por día" if es else "Daily budget"}"><table class="g-bud"><caption>{"Presupuesto orientativo por día" if es else "Rough daily budget"}</caption><thead><tr>' + ''.join(f'<th scope="col">{h}</th>' for h in H)
               + '</tr></thead><tbody>' + ''.join(f'<tr><th scope="row">{e(a)}</th><td>{e(b)}</td><td>{e(c)}</td></tr>' for a, b, c in rows) + '</tbody></table></div>'
               + (('<ul>' + ''.join(f'<li>{x}</li>' for x in rest) + '</ul>') if rest else ''))
        sec = m.group(2)[:ul.start()] + tbl + m.group(2)[ul.end():]
        gh = gh[:m.start(2)] + sec + gh[m.end(2):]
        amt = re.sub(r'(?i)\s*(al d[ií]a|por d[ií]a|por persona|a day|per day|per person|pp)\b\.?', '', rows[0][1]).strip(' ,.')
        BUD_ROWS[:] = rows
        return gh, amt
    return gh, ''


def nearby_guides(p, have, n=3):
    """Las n guías más cercanas en km (por coordenadas), para enlazar destinos que se combinan en un viaje."""
    import math
    if p.get('y') is None:
        return []
    def km(a, b):
        la1, lo1, la2, lo2 = map(math.radians, (a['y'], a['x'], b['y'], b['x']))
        h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
        return 6371 * 2 * math.asin(math.sqrt(h))
    c = sorted(((km(p, q), q) for q in DLIB if q['s'] in have and q['s'] != p['s'] and q.get('y') is not None), key=lambda t: t[0])
    return [(round(d_ / 10) * 10, q) for d_, q in c[:n] if d_ < 2500]


GUIDE_TABLE_CSS = ('<style>.deal-body>.txt{min-width:0}.g-tw{overflow-x:auto;max-width:100%;margin:14px 0}.g-itin,.g-bud{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;font-size:15px;line-height:1.5}'
                   '.g-itin caption,.g-bud caption{text-align:left;font-weight:700;padding:0 0 6px}.g-itin th,.g-itin td,.g-bud th,.g-bud td{padding:10px 12px;border-bottom:1px solid #EADCC4;text-align:left;vertical-align:top}'
                   '.g-itin th[scope=row]{white-space:nowrap}.g-near{display:flex;flex-wrap:wrap;gap:8px}main>section.sec.t3,main>section.sec#precios,main>section.sec#prices{content-visibility:auto;contain-intrinsic-size:auto 900px}</style>')


def hero_preload(hero, lib=None):
    """Precarga de la foto de cabecera (LCP); con foto de la biblioteca, la de 800 px en móvil."""
    if not hero:
        return ''
    if lib and os.path.exists(os.path.join(LIB, f'{lib}-800.jpg')):
        return (f'<link rel="preload" as="image" href="/hlc/img/cities/{lib}-800.jpg" media="(max-width: 800px)" fetchpriority="high">'
                f'<link rel="preload" as="image" href="{hero}" media="(min-width: 801px)" fetchpriority="high">'
                f'<style>@media (max-width:800px){{.deal-hero{{background-image:url(/hlc/img/cities/{lib}-800.jpg)!important}}}}</style>')
    return f'<link rel="preload" as="image" href="{hero}" fetchpriority="high">'


try:
    WIKIDATA = json.load(open(os.path.join(HERE, 'wikidata.json'), encoding='utf-8'))
except Exception:
    WIKIDATA = {}


def wd_same(slug, lang='es'):
    """sameAs de Wikidata y Wikipedia para el destino (comprobado por coordenadas al sacarlo: el mismo sitio, no un homónimo)."""
    w = WIKIDATA.get(slug)
    if not w or not w.get('q'):
        return []
    out = [f"https://www.wikidata.org/wiki/{w['q']}"]
    t = w.get('es') if lang == 'es' else w.get('en')
    if t:
        out.append(f"https://{'es' if lang == 'es' else 'en'}.wikipedia.org/wiki/" + urllib.parse.quote(t.replace(' ', '_')))
    return out


_DIMS = {}


def _dims(path):
    if path not in _DIMS:
        try:
            _DIMS[path] = Image.open(path).size
        except Exception:
            _DIMS[path] = None
    return _DIMS[path]


HERO_CSS = '<style>.deal-hero .dh-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}@media print{.deal-hero .dh-img{display:none}}</style>'
_HERO_RX = re.compile(r'<section class="deal-hero" style="background-image:url\(([^)]+)\)"([^>]*)>')


def hero_img(page):
    """Cabecera como <img> real con alt (Google Imágenes la indexa; un background no), srcset 800/1200/original
    para que el móvil baje la de 800 px, precarga con imagesrcset y og:image recortada a 1200x630 (lo que declara la página)."""
    m = _HERO_RX.search(page)
    if not m or 'class="dh-img"' in page:
        return page
    src, rest = m.group(1).strip('\'"'), m.group(2)
    alt_m = re.search(r'<meta property="og:image:alt" content="([^"]*)"', page)
    alt = alt_m.group(1) if alt_m else ''
    lm = re.match(r'/hlc/img/cities/([a-z0-9-]+?)(?:-800)?\.jpg$', src)
    srcset, img_src, wh = '', src, None
    if lm:
        slug = lm.group(1)
        base = os.path.join(LIB, slug + '.jpg')
        wh = _dims(base)
        if wh:
            parts = []
            if os.path.exists(os.path.join(LIB, slug + '-800.jpg')):
                parts.append(f'/hlc/img/cities/{slug}-800.jpg 800w')
            if os.path.exists(os.path.join(LIB, slug + '-w1200.jpg')):
                parts.append(f'/hlc/img/cities/{slug}-w1200.jpg 1200w')
            parts.append(f'/hlc/img/cities/{slug}.jpg {wh[0]}w')
            srcset = ', '.join(parts)
            img_src = f'/hlc/img/cities/{slug}.jpg'
        og = os.path.join(LIB, slug + '-og.jpg')
        if os.path.exists(og):
            page = re.sub(r'(<meta property="og:image" content=")' + re.escape(SITE) + r'/hlc/img/cities/' + re.escape(slug) + r'(?:-800)?\.jpg"',
                          r'\g<1>' + SITE + f'/hlc/img/cities/{slug}-og.jpg"', page, count=1)
            page = page.replace(f'<meta name="twitter:image" content="{SITE}/hlc/img/cities/{slug}.jpg"', f'<meta name="twitter:image" content="{SITE}/hlc/img/cities/{slug}-og.jpg"')
        # fuera las precargas y el truco de background de 800 px: la precarga nueva usa el mismo srcset que la <img>
        page = re.sub(r'<link rel="preload" as="image" href="/hlc/img/cities/' + re.escape(slug) + r'(?:-800)?\.jpg"[^>]*>', '', page)
        page = re.sub(r'<style>@media \(max-width:800px\)\{\.deal-hero\{background-image:url\([^)]*\)!important\}\}</style>', '', page)
    else:
        page = re.sub(r'<link rel="preload" as="image" href="' + re.escape(src) + r'"[^>]*>', '', page)
    pre = (f'<link rel="preload" as="image" imagesrcset="{srcset}" imagesizes="100vw" fetchpriority="high">' if srcset else
           f'<link rel="preload" as="image" href="{src}" fetchpriority="high">')
    img = (f'<img class="dh-img" src="{img_src}"' + (f' srcset="{srcset}" sizes="100vw"' if srcset else '')
           + (f' width="{wh[0]}" height="{wh[1]}"' if wh else '') + f' alt="{alt}" title="{alt}" fetchpriority="high" decoding="async">')  # ronda 8 (#446): title = nombre del lugar
    page = page.replace(m.group(0), f'<section class="deal-hero"{rest}>{img}', 1)
    return page.replace('</head>', pre + HERO_CSS + '</head>', 1)


def guide_md(title, url, gh, name, days, updated_iso, lang='es', extra=''):
    """Versión Markdown de la guía (index.md) para asistentes de IA: mismo contenido, sin plantilla."""
    t = gh or ''
    t = re.sub(r'<nav class="g-toc".*?</nav>', '', t, flags=re.S)

    def _tbl(m_):
        cap = re.search(r'<caption>(.*?)</caption>', m_.group(1), re.S)
        rows = [[re.sub(r'\s+', ' ', re.sub(r'<br\s*/?>', ' · ', c)).strip().replace('|', '/') for c in re.findall(r'<t[hd][^>]*>(.*?)</t[hd]>', r_, re.S)] for r_ in re.findall(r'<tr>(.*?)</tr>', m_.group(1), re.S)]
        rows = [[re.sub(r'<[^>]+>', '', c) for c in r_] for r_ in rows if r_]
        if not rows:
            return ''
        md = ('\n\n**' + re.sub(r'<[^>]+>', '', cap.group(1)) + '**\n\n' if cap else '\n\n') + '| ' + ' | '.join(rows[0]) + ' |\n|' + '---|' * len(rows[0]) + '\n'
        return md + ''.join('| ' + ' | '.join(r_) + ' |\n' for r_ in rows[1:]) + '\n'
    t = re.sub(r'<div class="g-tw"[^>]*>(.*?)</table></div>', _tbl, t, flags=re.S)
    t = re.sub(r'<h2[^>]*>(.*?)</h2>', lambda m: '\n\n## ' + re.sub('<[^>]+>', '', m.group(1)).strip() + '\n\n', t, flags=re.S)
    t = re.sub(r'<h3[^>]*>(.*?)</h3>', lambda m: '\n\n### ' + re.sub('<[^>]+>', '', m.group(1)).strip() + '\n\n', t, flags=re.S)
    t = re.sub(r'<li>(.*?)</li>', lambda m: '\n- ' + re.sub(r'\s+', ' ', m.group(1)).strip(), t, flags=re.S)
    t = re.sub(r'</?strong>', '**', t)
    t = re.sub(r'</p>', '\n\n', t)
    t = html.unescape(re.sub(r'<[^>]+>', '', t))
    t = re.sub(r'[ \t]+', ' ', t)
    t = re.sub(r'\n{3,}', '\n\n', t).strip()
    head_ = (f'# {title}\n\n> Guía de viaje de {name} de Happy Low Cost' + (f', itinerario de {days} días' if days else '') + f'. Página original: {url}\n> Actualizada: {(updated_iso or "")[:10]}\n\n'
             if lang == 'es' else
             f'# {title}\n\n> {name} travel guide by Happy Low Cost' + (f', {days}-day itinerary' if days else '') + f'. Original page: {url}\n> Updated: {(updated_iso or "")[:10]}\n\n')
    return head_ + t.replace(' — ', ', ').replace('—', ', ') + '\n\n' + extra


def guide_head_extra(slug, md_url, updated_iso, lang='es', has_alt=True):
    """Metadatos de cabecera de las guías: versión Markdown, fecha de modificación, locale alterno y precarga de la foto principal (LCP)."""
    loc_alt = ('en_GB' if lang == 'es' else 'es_ES')
    return (f'<link rel="alternate" type="text/markdown" href="{md_url}" title="Markdown">'
            + (f'<meta property="article:modified_time" content="{e(updated_iso)}">' if updated_iso else '')
            + (f'<meta property="og:locale:alternate" content="{loc_alt}">' if has_alt else '')
            + f'<link rel="preload" as="image" href="/hlc/img/cities/{slug}.jpg" fetchpriority="high">')


def dia_sem(iso, en=False):
    try:
        d = datetime.date.fromisoformat(str(iso)[:10])
        return (['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] if en else ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'])[d.weekday()] + ' '
    except Exception:
        return ''


def noches(f, en=False):
    try:
        n = (datetime.date.fromisoformat(str(f.get('vuelta'))[:10]) - datetime.date.fromisoformat(str(f.get('ida'))[:10])).days
        return (f' · {n} night' + ('s' if n != 1 else '') if en else f' · {n} noche' + ('s' if n != 1 else '')) if n > 0 else ''
    except Exception:
        return ''


def ics_link(f, title, url):
    """Enlace para guardar las fechas del chollo en el calendario del móvil (.ics en data URI)."""
    from urllib.parse import quote as _q
    try:
        a = datetime.date.fromisoformat(str(f.get('ida'))[:10])
        b = datetime.date.fromisoformat(str(f.get('vuelta') or f.get('ida'))[:10]) + datetime.timedelta(days=1)
    except Exception:
        return ''
    ics = ('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Happy Low Cost//ES\r\nBEGIN:VEVENT\r\n'
           f'UID:{a:%Y%m%d}-{slugify(title)[:40]}@happylowcost.com\r\nDTSTART;VALUE=DATE:{a:%Y%m%d}\r\nDTEND;VALUE=DATE:{b:%Y%m%d}\r\n'
           f'SUMMARY:{title[:70]}\r\nDESCRIPTION:{url}\r\nURL:{url}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n')
    return 'data:text/calendar;charset=utf-8,' + _q(ics)

def deal_meta(x, en=False, o=None, d=None):
    """Ronda 5: meta description del chollo con los datos que deciden el clic: precio, fechas, aerolínea, escalas y fecha de comprobación."""
    f = x.get('facts') or {}
    o, d = o or f.get('origen'), d or f.get('destino')
    p_ = x.get('price') or f.get('precio')
    if not (o and d and p_):
        return ''
    ck = checked(x)[:10]
    air = f.get('aerolinea') if f.get('aerolinea') and len(f.get('aerolinea')) < 26 else ''
    sc = f.get('escalas')
    if en:
        import gen_en as _E
        dates = f" {_E.date_en(f.get('ida'))} to {_E.date_en(f.get('vuelta'))}" if f.get('vuelta') else ''
        s_ = f'✓ {o} to {d} for €{p_} return' + (f',{dates}' if dates else '') + (f', {air}' if air else '') + (', nonstop' if sc == 0 else '') + '.'
        s_ += f' Price checked {_E.date_en(ck)}.' if ck else ''
    else:
        dates = f" del {fecha(f.get('ida'))} al {fecha(f.get('vuelta'))}" if f.get('vuelta') else ''
        s_ = f'✓ {o} → {d} por {p_} € ida y vuelta' + (f',{dates}' if dates else '') + (f', con {air}' if air else '') + (', directo' if sc == 0 else '') + '.'
        s_ += f' Precio comprobado el {fecha(ck)}.' if ck else ''
    return smart_desc(s_, 160)


def checked(x):
    """Última comprobación del precio: la revalidación diaria (facts.checked_at) o la publicación."""
    a, c = x.get('approved_at') or '', (x.get('facts') or {}).get('checked_at') or ''
    return max(a[:19], c[:19]) if c else a


def bag_box(f, en=False):
    """Equipaje de mano de la aerolínea del chollo (datos de _hlc/bags.py, con fuente)."""
    import bags
    row = bags.bag_of(f.get('aerolinea'))
    if not row:
        return ''
    name, free, kg, cab, price = row
    src = bags.BAG_SRC[0]
    if en:
        cabin = (f' A cabin bag ({bags.cm(cab)}) costs {price.replace("incluida en tarifa", "included in the").replace("incluida", "included")}.' if cab and price else '')
        return (f'<div class="bagbox"><b>🧳 Baggage with {e(name)}</b><p>Free: one personal item of {bags.cm(free)}{(" up to " + kg) if kg else ""} under the seat.{e(cabin)} '
                f'Check your fare before paying. <a href="/en/tools/baggage/">Compare airlines</a> · source: <a href="{src[1]}" rel="nofollow noopener" target="_blank">{e(src[0])}</a></p></div>')
    cabin = (f' La maleta de cabina ({bags.cm(cab)}) cuesta {price}.' if cab and price else '')
    return (f'<div class="bagbox"><b>🧳 Equipaje con {e(name)}</b><p>Gratis: un bolso de {bags.cm(free)}{(" y hasta " + kg) if kg else ""} bajo el asiento.{e(cabin)} '
            f'Revisa tu tarifa antes de pagar. <a href="/herramientas/equipaje/">Comparar aerolíneas</a> · fuente: <a href="{src[1]}" rel="nofollow noopener" target="_blank">{e(src[0])}</a></p></div>')


_RIDX = None


def alt_box(f, en=False):
    """El mismo destino desde otras ciudades, con el precio más bajo que encontramos (vuelos/rutas-idx.json)."""
    global _RIDX
    if _RIDX is None:
        try:
            _RIDX = json.load(open('vuelos/rutas-idx.json', encoding='utf-8'))
        except Exception:
            _RIDX = []
    d = lib_slug(f)
    if not d:
        return ''
    rows = sorted([r for r in _RIDX if r[5] == d and r[2] != f.get('origen') and r[6]], key=lambda r: r[6])
    if len(rows) < 3:
        return ''
    import en_names
    if en:
        lis = ''.join(f'<li><a href="/en/flights/{r[1]}/">{e(en_names.city_en(r[2]))} → {e(r[4])}</a> <span>from €{r[6]}</span></li>' for r in rows[:5])
        return (f'<div class="altbox"><b>Same destination from other cities</b><ul>{lis}</ul>'
                f'<a href="/en/flights/to/{en_dest_slug(d)}/">All {len(rows) + 1} departure cities to {e(rows[0][4])}</a><small>Lowest return price we found in our last search; it changes every day.</small></div>')
    lis = ''.join(f'<li><a href="/vuelos/{r[0]}/">{e(r[2])} → {e(r[3])}</a> <span>desde {r[6]} €</span></li>' for r in rows[:5])
    return (f'<div class="altbox"><b>El mismo destino desde otras ciudades</b><ul>{lis}</ul>'
            f'<a href="/vuelos/a/{d}/">Las {len(rows) + 1} ciudades de salida a {e(rows[0][3])}</a><small>Precio de ida y vuelta más bajo que encontramos en nuestra última consulta; cambia cada día.</small></div>')


def route_cal_link(f):
    slug_ = f"{slugify(f.get('origen') or '')}-{slugify(f.get('destino') or '')}"
    return f'<a class="hlc-btn o" href="/vuelos/{slug_}/">📅 Precio de esta ruta mes a mes</a>' if os.path.isdir(os.path.join('vuelos', slug_)) else ''


def clase_of(f):
    """playa | ciudad | naturaleza (biblioteca de destinos)"""
    ls_ = lib_slug(f)
    for p in DLIB:
        if p['s'] == ls_:
            return p.get('t') or ''
    return ''


def _age_bucket(x):
    """0: menos de 12 h, 1: menos de 36 h, 2: más antiguo (los más nuevos primero, como en hlc.js)"""
    try:
        h = (datetime.datetime.utcnow() - datetime.datetime.fromisoformat((x.get('approved_at') or '1970-01-01')[:19])).total_seconds() / 3600
    except Exception:
        return 2
    return 0 if h < 12 else 1 if h < 36 else 2


def card(x):
    f = x['facts']
    cs, cn, ce = cont_of(f)
    img = photo_url(x)
    bg = 'background:linear-gradient(135deg,#FF5A36,#2E6BF0)'
    ph = f'<img class="dc-ph" src="{e(img)}" alt="{e(f.get("destino"))}{(", " + e(f.get("pais"))) if f.get("pais") else ""}{(": vuelo desde " + e(f.get("origen")) + (" por " + e(x.get("price")) + " €" if x.get("price") else "")) if f.get("origen") else ""}" loading="lazy" decoding="async" width="800" height="533">' if img else ''  # ronda 7 (#445): alt con origen y precio
    oc = slugify(f.get('origen_pais') or '')
    return (f'<a class="dc" href="/chollos/{e(x["slug"])}/" data-slug="{e(x["slug"])}" data-oc="{e(oc)}" data-occ="{e(f.get("origen_cc", ""))}" data-orig="{e(f.get("origen", ""))}" data-cont="{e(cs)}" '
            f'data-price="{e(x.get("price"))}" data-ida="{e(f.get("ida", ""))}" data-dir="{1 if f.get("escalas") == 0 else 0}" data-tipo="{"rt" if f.get("vuelta") else "ow"}" data-clase="{e(clase_of(f))}" data-n="{nights_of(f)}" data-ts="{e(ago_iso(checked(x)))}" aria-label="{e(f.get("origen"))} a {e(f.get("destino"))}, {e(x.get("price"))} euros{(", antes " + e(f.get("precio_normal")) + " euros") if f.get("precio_normal") else ""}, {e(dates_es(f))}" data-q="{e(slugify((f.get("origen", "") + " " + f.get("destino", "") + " " + (f.get("pais") or "") + " " + (f.get("origen_pais") or ""))))}">'
            f'<div class="dc-img" style="{bg}">{ph}{f"<span class=dc-save title='{level_es(f.get(chr(97)+chr(104)+chr(111)+chr(114)+chr(114)+chr(111)+chr(95)+chr(112)+chr(99)+chr(116)))}'>−{f.get(chr(97)+chr(104)+chr(111)+chr(114)+chr(114)+chr(111)+chr(95)+chr(112)+chr(99)+chr(116))} % · {level_es(f.get('ahorro_pct'))}</span>" if f.get("ahorro_pct") else ""}<span class="dc-ok" data-ok-ts>✓ Verificado {e(fecha(checked(x)))}</span><span class="dc-fav" role="button" tabindex="0" aria-label="Guardar en favoritos" data-fav="{e(x["slug"])}">♡</span>'
            f'<span class="dc-city">{e(f.get("destino"))}</span></div>'
            f'<div class="dc-b"><div><div class="dc-r"><span class="dc-flag" title="{e(f.get("origen_pais") or "")}">{flag(f.get("origen_cc"))}</span> {e(f.get("origen"))} → {e(f.get("destino"))} <span class="dc-flag" title="{e(f.get("pais") or "")}">{flag(f.get("destino_cc"))}</span></div>'
            f'<div class="dc-m">{e(f.get("tipo", ""))} · {e(stops_es(f))}{(" · " + e(f.get("aerolinea"))) if f.get("aerolinea") else ""} · {e(dates_es(f))}</div></div><div class="dc-p">{f'<s>{e(f.get("precio_normal"))} €</s>' if f.get('precio_normal') else ''}{e(x.get("price"))} €{f'<small class="dc-loc">{e(local(x.get("price"), f.get("origen_cc")))}</small>' if local(x.get("price"), f.get("origen_cc")) else ''}</div></div></a>')


def crumbs(items):
    """items: [(name, url)] último sin url"""
    html_ = '<nav class="crumbs" aria-label="Migas de pan">' + ' <span>›</span> '.join(
        (f'<a href="{u}">{e(n)}</a>' if u else f'<span aria-current="page">{e(n)}</span>') for n, u in items) + '</nav>'
    ld = {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, **({"item": SITE + u} if u else {})} for i, (n, u) in enumerate(items)]}
    return html_, ld


def ld_script(graph):
    return '<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False) + '</script>'


EMPTY = '<div class="dc-empty"><b>Ahora mismo no hay chollos aquí.</b><span>Los chollos vuelan: crea una alerta gratis y te avisamos en cuanto cacemos uno.</span><a class="hlc-btn" href="/alertas/">Crear alerta gratis</a></div>'


def filters_html(deals):
    occ = {}
    for x in deals:
        f = x['facts']
        k = slugify(f.get('origen_pais') or '')
        if k:
            occ.setdefault(k, [f.get('origen_pais'), f.get('origen_cc'), 0])[2] += 1
    opts = ''.join(f'<option value="{k}">{flag(v[1])} {e(v[0])} ({v[2]})</option>' for k, v in sorted(occ.items(), key=lambda kv: -kv[1][2]))
    conts = {}
    for x in deals:
        cs, cn, ce = cont_of(x['facts'])
        if cs:
            conts.setdefault(cs, [cn, ce, 0])[2] += 1
    cchips = ''.join(f'<button type="button" class="chip" data-cont="{k}" aria-pressed="false">{v[1]} {e(v[0].replace("el Caribe y Centroamérica", "Caribe"))} <small>{v[2]}</small></button>' for k, v in sorted(conts.items(), key=lambda kv: -kv[1][2]))
    ac = {}
    for x in deals:
        o_ = x['facts'].get('origen')
        if o_:
            ac[o_] = ac.get(o_, 0) + 1
    aopts = ''.join(f'<option value="{slugify(k)}">{e(k)} ({v})</option>' for k, v in sorted(ac.items(), key=lambda kv: (-kv[1], kv[0])))
    months = sorted({(x['facts'].get('ida') or '')[:7] for x in deals if x['facts'].get('ida')})
    MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    mopts = ''.join(f'<option value="{m}">{MES[int(m[5:7]) - 1]} {m[:4]}</option>' for m in months)
    return f'''<div class="xf" data-explorer-filters>
<div class="xf-row">
<label class="xf-search"><span aria-hidden="true">🔎</span><input type="search" data-x="q" placeholder="Busca un destino, ciudad o país" aria-label="Buscar chollos"></label>
<label class="xf-sel"><span>Salida desde</span><select data-x="desde" aria-label="País de salida"><option value="">Todos los países</option>{opts}</select></label>
<label class="xf-sel"><span>Aeropuerto</span><select data-x="aero" aria-label="Aeropuerto de salida"><option value="">Todos</option>{aopts}</select></label>
<label class="xf-sel"><span>Tipo de destino</span><select data-x="clase" aria-label="Tipo de destino"><option value="">Todos</option><option value="playa">Playa</option><option value="ciudad">Ciudad</option><option value="naturaleza">Naturaleza</option></select></label>
<label class="xf-sel"><span>Duración</span><select data-x="dur" aria-label="Duración del viaje"><option value="">Cualquiera</option><option value="finde">Escapada (1-4 noches)</option><option value="semana">Una semana (5-9)</option><option value="largo">10 noches o más</option></select></label>
<label class="xf-sel"><span>Mes</span><select data-x="mes" aria-label="Mes de salida"><option value="">Cualquier fecha</option>{mopts}</select></label>
<label class="xf-sel"><span>Ordenar</span><select data-x="orden" aria-label="Ordenar"><option value="nuevo">Más recientes</option><option value="precio">Más baratos</option><option value="fecha">Salida más próxima</option></select></label>
</div>
<div class="xf-row chips" role="group" aria-label="Continente de destino"><button type="button" class="chip" data-cont="" aria-pressed="true">🌐 Todo el mundo</button>{cchips}</div>
<div class="xf-row xf-more">
<label class="xf-range"><span>Precio máx.: <b data-x-out="max">sin límite</b></span><input type="range" min="20" max="1500" step="10" value="1500" data-x="max" aria-label="Precio máximo"></label>
<label class="xf-tg"><input type="checkbox" data-x="dir"> Solo directos</label>
<label class="xf-tg"><input type="checkbox" data-x="rt"> Solo ida y vuelta</label>
<label class="xf-tg"><input type="checkbox" data-x="fav"> ♥ Mis favoritos</label>
<button type="button" class="hlc-btn o xf-clear" data-x-clear>Limpiar filtros</button><button type="button" class="hlc-btn o" data-x-random>🎲 Sorpréndeme</button>
</div>
<div class="xf-count" aria-live="polite"><b data-x-count>{len(deals)}</b> chollos <button type="button" class="xf-tog" data-x-toggle aria-expanded="false">⚙️ Más filtros</button></div>
</div>'''


def _air_qa(sub, hl, L, pr):
    """Ronda 5: "which airlines provide good-value fares for weekend getaways?" (78 impr., pos. 6,4): respuesta con las aerolíneas de los chollos vivos."""
    airs = {}
    for x in sub:
        a = ((x.get('facts') or {}).get('aerolinea') or '').strip()
        if a and len(a) < 40:
            airs.setdefault(a, []).append(x.get('price') or 0)
    if not airs:
        return []
    top = sorted(airs.items(), key=lambda kv: (-len(kv[1]), min(kv[1])))[:5]
    return [(L(f'¿Qué aerolíneas tienen los chollos más baratos de {hl}?', f'Which airlines have good-value fares for {hl}?'),
             L('En los chollos de hoy: ', 'In today\'s deals: ') + ', '.join(f'{k} ({len(v)} {L("chollo" if len(v) == 1 else "chollos", "deal" if len(v) == 1 else "deals")}, {L("desde", "from")} {pr(min(v))})' for k, v in top) + '.')]


def _nye_qa(sub, h1, L, nm):
    """Ronda 9: "cheap flights for new years 2026" (pos. 5) en la página de Navidad: chollos vivos que pasan la Nochevieja fuera
    (ida hasta el 31 de diciembre y vuelta el 1 de enero o después)."""
    if not re.search(r'navidad|christmas', h1, re.I):
        return []
    ny = sorted([x for x in sub if (x['facts'].get('ida') or '')[:10] <= '2026-12-31' and (x['facts'].get('vuelta') or '')[:10] >= '2027-01-01'], key=lambda x: x.get('price') or 99999)
    if not ny:
        return [(L('¿Hay vuelos baratos para Nochevieja y Año Nuevo?', 'Are there cheap flights for New Year\'s Eve?'),
                 L('Ahora mismo ningún chollo activo pasa la Nochevieja fuera (ida hasta el 31 de diciembre y vuelta en enero). Crea una alerta gratis y te avisamos.',
                   'Right now no live deal covers New Year\'s Eve (out by 31 December, back in January). Set a free alert and we will tell you.'))]
    return [(L('¿Hay vuelos baratos para Nochevieja y Año Nuevo?', 'Are there cheap flights for New Year\'s Eve?'),
             L(f'Sí, {len(ny)} de estos chollos pasan la Nochevieja fuera: ', f'Yes, {len(ny)} of these deals cover New Year\'s Eve: ')
             + ', '.join(f'{nm(x)[0]} → {nm(x)[1]} ({L(str(x["price"]) + " €", "€" + str(x["price"]))})' for x in ny[:5]) + '.')]


def ideas_faq(sub, h1, en=False, budget=None):
    """FAQ con datos reales de los chollos de una página de ideas + enlaces a los hubs de precios del mismo presupuesto (ronda SEO 3)."""
    if not sub:
        return ''
    import gen_en as _E
    L = (lambda a, b: b if en else a)
    nm = (lambda x: _E.names(x)) if en else (lambda x: (x['facts'].get('origen'), x['facts'].get('destino')))
    c0 = min(sub, key=lambda x: x.get('price') or 99999)
    o0, d0 = nm(c0)
    f0 = c0['facts']
    orig = {}
    for x in sub:
        orig[nm(x)[0]] = orig.get(nm(x)[0], 0) + 1
    dests = {}
    for x in sorted(sub, key=lambda x: x.get('price') or 99999):
        dests.setdefault(nm(x)[1], x.get('price'))
    pr = (lambda v: f'€{v}') if en else (lambda v: f'{v} €')
    hl = h1[:1].lower() + h1[1:]
    qa = [(L(f'¿Cuál es el chollo más barato de {hl}?', f'What is the cheapest deal in {hl}?'),
           L(f'{o0} → {d0} por {c0["price"]} € ida y vuelta' + (f', del {fecha(f0.get("ida"))} al {fecha(f0.get("vuelta"))}' if f0.get('vuelta') else '') + '.',
             f'{o0} → {d0} for €{c0["price"]} return' + (f', {_E.date_en(f0.get("ida"))} to {_E.date_en(f0.get("vuelta"))}' if f0.get('vuelta') else '') + '.')),
          (L('¿Desde qué ciudades salen?', 'Which cities do they leave from?'),
           ', '.join(f'{k} ({v})' for k, v in sorted(orig.items(), key=lambda kv: -kv[1])[:8]) + '.'),
          (L('¿A qué destinos hay chollos?', 'Which destinations have deals?'),
           ', '.join(f'{k} ({L("desde", "from")} {pr(v)})' for k, v in list(dests.items())[:8]) + '.'),
          *_air_qa(sub, hl, L, pr),
          *_nye_qa(sub, h1, L, nm),
          (L('¿Cada cuánto se actualizan?', 'How often are they updated?'),
           L('Volvemos a comprobar cada chollo activo una vez al día y lo retiramos si ha subido más de un 10 %.', 'We re-check every live deal once a day and remove it if it has gone up more than 10%.'))]
    ld = {"@context": "https://schema.org", "@type": "FAQPage", "inLanguage": L('es-ES', 'en'), "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in qa]}
    links = ''
    if budget:
        hubs = []
        for o_ in sorted(orig, key=lambda k: -orig[k]):
            sl = slugify(o_)
            pth = f'en/flights/from/{sl}' if en else f'vuelos/desde/{sl}'
            if os.path.isfile(os.path.join(pth, 'index.html')):
                hubs.append(f'<a class="chip" href="/{pth}/#{"under" if en else "menos"}-{budget}">{e(L(f"Desde {o_} por menos de {budget} €", f"From {o_} under €{budget}"))}</a>')
        if hubs:
            links = f'<h2>{L("Más rutas del mismo presupuesto", "More routes on the same budget")}</h2><div class="chips" style="flex-wrap:wrap">' + ''.join(hubs[:8]) + '</div>'
    return (f'<section class="sec" style="padding-top:10px">{links}<h2>{L("Preguntas frecuentes", "FAQ")}</h2><div class="txt guide">'
            + ''.join(f'<h3>{e(q)}</h3><p>{e(a)}</p>' for q, a in qa) + f'</div><script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script></section>')


IDEAS_EN = {'fin-de-semana': 'weekend-getaways', 'menos-de-50-euros': 'under-50', 'menos-de-100-euros': 'under-100', 'larga-distancia': 'long-haul', 'directos': 'nonstop', 'navidad-2026': 'christmas-2026', 'semana-santa-2027': 'easter-2027'}
EN_ALT = {'chollos': '/en/deals/', **{f'chollos/ideas/{k}': f'/en/deals/ideas/{v}/' for k, v in IDEAS_EN.items()}}


def list_page(path, title, h1, kicker, intro, deals, canonical, crumb_items, extra_links='', explorer=False, noindex=False, seo_html=''):
    ch, cld = crumbs(crumb_items)
    items = [{"@type": "ListItem", "position": i + 1, "url": f"{SITE}/chollos/{x['slug']}/", "name": clean_title(x.get('title') or '')} for i, x in enumerate(deals[:50])]
    graph = [cld, {"@type": "CollectionPage", "name": h1, "url": canonical, "inLanguage": "es-ES", "description": intro, "mainEntity": {"@type": "ItemList", "numberOfItems": len(deals), "itemListElement": items}}]
    desc = smart_desc(intro)
    page = head(title=e(title), desc=e(desc), canonical=canonical, og_type='website', og_image=f'{SITE}/hlc/brand/og-default.jpg', robots='noindex, follow' if noindex else ROBOTS_IDX,
                extra_head='<link rel="stylesheet" href="/hlc/home.css?v=12"><link rel="alternate" type="application/rss+xml" title="Chollos Happy Low Cost" href="/chollos/feed.xml">' + ('<link rel="alternate" hreflang="es" href="' + canonical + '"><link rel="alternate" hreflang="en" href="' + SITE + EN_ALT[path] + '"><link rel="alternate" hreflang="x-default" href="' + canonical + '">' if path in EN_ALT and os.path.isdir(EN_ALT[path].strip('/')) else '') + ld_script(graph), body_class='chollos')
    cards = ''.join(card(x) for x in deals) or EMPTY
    page += f'''<main class="sec" style="padding-top:26px"><div class="wrap">
{ch}
<div class="sec-h"><div><div class="kicker">{kicker}</div><h1 class="x-h1">{e(h1)}</h1><p>{e(intro)}</p></div><a class="hlc-btn s" href="/alertas/">🔔 Crear alerta</a></div>
{filters_html(deals) if explorer else ''}
<div class="dc-grid" data-explorer-grid>{cards}</div>
<div class="dc-empty" data-x-empty hidden><b>Ningún chollo con esos filtros.</b><span>Prueba a quitar algún filtro o crea una alerta y te avisamos.</span><a class="hlc-btn" href="/alertas/">Crear alerta gratis</a></div>
{extra_links}
{seo_html}
</div></main>{'<script src="/hlc/explorer.js?v=6" defer></script>' if explorer else ''}</body></html>'''
    os.makedirs(path, exist_ok=True)
    open(os.path.join(path, 'index.html'), 'w', encoding='utf-8').write(page)


IDEA_NAMES = [('fin-de-semana', 'Escapadas de fin de semana'), ('menos-de-50-euros', 'Menos de 50 €'), ('menos-de-100-euros', 'Menos de 100 €'), ('larga-distancia', 'Larga distancia'),
              ('directos', 'Solo directos'), ('puente-diciembre-2026', 'Puente de diciembre'), ('navidad-2026', 'Navidad 2026'), ('semana-santa-2027', 'Semana Santa 2027')]


def hub_links(origins, conts, dests_with_deals, cities=None):
    o = ''.join(f'<a class="hub-l" href="/chollos/desde/{k}/">{flag(v[1])} {e(v[0])} <small>{v[2]}</small></a>' for k, v in sorted(origins.items(), key=lambda kv: -kv[1][2]))
    c = ''.join(f'<a class="hub-l" href="/chollos/a/{k}/">{CONT_BY_SLUG[k][2]} {e(CONT_BY_SLUG[k][1])} <small>{v}</small></a>' for k, v in sorted(conts.items(), key=lambda kv: -kv[1]))
    dd = ''.join(f'<a class="hub-l" href="/destinos/{s_}/">{e(n)}</a>' for s_, n in dests_with_deals[:24])
    ci = ''.join(f'<a class="hub-l" href="/chollos/desde/{pk}/{ck}/">{e(n)} <small>{c}</small></a>' for (pk, ck), (n, c) in sorted((cities or {}).items(), key=lambda kv: -kv[1][1])[:40])
    ide = ''.join(f'<a class="hub-l" href="/chollos/ideas/{k}/">{e(n)}</a>' for k, n in IDEA_NAMES)
    return f'''<section class="hub"><h2>Ideas para viajar barato</h2><div class="hub-g">{ide}</div>
<h2>Chollos por ciudad de salida</h2><div class="hub-g">{ci}</div>
<h2>Chollos por país de salida</h2><div class="hub-g">{o}</div>
<h2>Chollos por continente de destino</h2><div class="hub-g">{c}</div>
{f'<h2>Guías de los destinos con chollo</h2><div class="hub-g">{dd}</div>' if dd else ''}</section>'''


def related(x, deals, n=4):
    f = x['facts']
    cs = cont_of(f)[0]
    same = [y for y in deals if y is not x and cont_of(y['facts'])[0] == cs]
    org = [y for y in deals if y is not x and y not in same and y['facts'].get('origen_cc') == f.get('origen_cc')]
    rest = [y for y in deals if y is not x and y not in same and y not in org]
    return (same + org + rest)[:n]


def main():
    raw = urllib.request.urlopen(urllib.request.Request(API, headers=UA), timeout=60).read()
    deals = json.loads(urllib.request.urlopen(urllib.request.Request(API + '&full=1', headers=UA), timeout=90).read())
    try:
        raw_d = urllib.request.urlopen(urllib.request.Request(API.replace('action=feed', 'action=dests'), headers=UA), timeout=90).read()
        dests = json.loads(raw_d)
    except Exception:
        raw_d, dests = b'', []
    os.makedirs('chollos', exist_ok=True)
    import hashlib
    open(os.path.join('chollos', 'feed.sha'), 'w').write(hashlib.sha256(raw).hexdigest() + hashlib.sha256(raw_d).hexdigest()[:16] + '\n')
    today = datetime.date.today().isoformat()
    deals = [x for x in deals if x.get('slug') and x.get('price') and x.get('facts') and (x['facts'].get('ida') or '9999') >= today]
    deals = [norm_deal(x) for x in deals]
    for x in deals:
        x['cta_flight'] = BK.fix_flight(x.get('cta_flight'))
    # los chollos por debajo del umbral salen de los listados; si ya tenían página, pasa a «caducado» más abajo (no un 404: hay enlaces desde Facebook y Google)
    deals = [x for x in deals if keep_deal(x)]
    load_fx()
    deals.sort(key=lambda x: x.get('approved_at') or '', reverse=True)
    dmap = {g['slug']: g for g in dests if g.get('guide_html')}

    # ningún destino sin foto: los nuevos entran en la biblioteca
    for x in deals:
        try:
            had = lib_slug(x['facts'])
            x['facts']['_image_url'], x['facts']['_image_credit'] = x.get('image_url'), x.get('image_credit')
            if ensure_lib(x['facts']) and not had:
                for fn in ('og.jpg', 'foto.jpg'):  # se rehacen con la foto nueva de la biblioteca
                    fp = os.path.join('chollos', x['slug'], fn)
                    if os.path.exists(fp):
                        os.remove(fp)
        except Exception as ex:
            print('ensure_lib', ex)
    # regla: nunca enseñamos un chollo sin foto del destino
    sin_foto = [x['slug'] for x in deals if not photo_url(x)]
    if sin_foto:
        print('sin foto, no se publican:', sin_foto)
    deals = [x for x in deals if photo_url(x)]
    # marca en destinos.json qué destinos tienen guía (lo usa el mapa) y cuántas fotos extra hay
    DLIB[:] = [p for p in DLIB if not (p.get('auto') and p['s'] in ('burbank', 'fort-lauderdale', 'san-jose-california'))]
    for p in DLIB:
        p['c'] = NORM_C.get(p.get('c'), p.get('c'))
        p['g'] = 1 if p['s'] in dmap else 0
        p['k'] = n_extra(p['s'])
    json.dump(DLIB, open(os.path.join('hlc', 'destinos.json'), 'w'), ensure_ascii=False, separators=(',', ':'))

    origins, conts = {}, {}
    for x in deals:
        f = x['facts']
        k = slugify(f.get('origen_pais') or '')
        if k:
            origins.setdefault(k, [f.get('origen_pais'), f.get('origen_cc'), 0])[2] += 1
        cs = cont_of(f)[0]
        if cs:
            conts[cs] = conts.get(cs, 0) + 1
    dests_with_deals = []
    for x in deals:
        ls_ = lib_slug(x['facts'])
        if ls_ and ls_ in dmap and ls_ not in [d_[0] for d_ in dests_with_deals]:
            dests_with_deals.append((ls_, dmap[ls_]['name']))

    # ---------- páginas de chollo ----------
    for x in deals:
        f, slug = x['facts'], x['slug']
        out = os.path.join('chollos', slug)
        os.makedirs(out, exist_ok=True)
        lp, lc = lib_photo(f.get('destino', ''))
        photo, cred = None, ''
        if lp:
            photo = Image.open(lp).convert('RGB')
            cred = f"Foto: {lc.get('author') or 'Wikimedia Commons'} · {lc.get('license', '')} · Wikimedia Commons" if lc else ''
        elif not os.path.exists(os.path.join(out, 'foto.jpg')):
            photo, cred = commons_photo(f.get('destino', ''), f.get('pais', ''))
            if cred:
                open(os.path.join(out, 'credito.txt'), 'w', encoding='utf-8').write(cred)
        elif os.path.exists(os.path.join(out, 'credito.txt')):
            cred = open(os.path.join(out, 'credito.txt'), encoding='utf-8').read().strip()
        if not os.path.exists(os.path.join(out, 'og.jpg')) or (photo is not None and not lp and not os.path.exists(os.path.join(out, 'foto.jpg'))):
            if photo is not None and not lp:
                p = photo.copy()
                if p.width > 1600:
                    p = p.resize((1600, int(p.height * 1600 / p.width)), Image.LANCZOS)
                p.save(os.path.join(out, 'foto.jpg'), 'JPEG', quality=80, optimize=True, progressive=True)
            og_image(photo, f, os.path.join(out, 'og.jpg'))
        if lp and os.path.exists(os.path.join(out, 'foto.jpg')):
            os.remove(os.path.join(out, 'foto.jpg'))  # la foto sale de la biblioteca: un fichero menos
        hero = (f"/hlc/img/cities/{lib_slug(f)}.jpg" if lp else (f"/chollos/{slug}/foto.jpg" if os.path.exists(os.path.join(out, 'foto.jpg')) else (x.get('image_url') or '')))
        url = f'{SITE}/chollos/{slug}/'
        title = x.get('title') or f"{f.get('origen')} → {f.get('destino')} desde {f.get('precio')} €"
        h1t = clean_title(title)
        seo_t = deal_seo_title(f, x.get('price'))
        qa = deal_faq(x)
        excerpt = x.get('excerpt') or f"Chollo de vuelo {f.get('origen')} - {f.get('destino')} por {x.get('price')} € {f.get('tipo', '')}, comprobado hoy."
        share_txt = quote(f"✈️ {f.get('origen')} → {f.get('destino')} por {f.get('precio')} € ida y vuelta" + (f" ({fecha(f.get('ida'))} – {fecha(f.get('vuelta'))})" if f.get('vuelta') else '') + f"\n{url}")
        verified = madrid(checked(x))
        cs, cn, ce = cont_of(f)
        oc = slugify(f.get('origen_pais') or '')
        dls = lib_slug(f)
        items = [('Inicio', '/'), ('Chollos', '/chollos/')]
        if oc:
            items.append((f"Desde {f.get('origen_pais')}", f'/chollos/desde/{oc}/'))
            items.append((f"Desde {f.get('origen')}", f'/chollos/desde/{oc}/{slugify(f.get("origen") or "")}/'))
        items.append((f"{f.get('origen')} → {f.get('destino')}", None))
        ch, cld = crumbs(items)
        offer = {"@type": "Offer", "name": h1t, "url": url, "price": x.get('price'), "priceCurrency": "EUR", "availability": "https://schema.org/InStock",
                 "validThrough": f.get('ida'), "category": "Vuelo", "itemOffered": {"@type": "Flight", "name": f"{f.get('origen')} → {f.get('destino')}",
                 "departureAirport": {"@type": "Airport", "iataCode": f.get('origen_iata'), "name": f.get('origen')},
                 "arrivalAirport": {"@type": "Airport", "iataCode": f.get('destino_iata'), "name": f.get('destino')}, "departureTime": f.get('ida')}}
        art = {"@type": "Article", "headline": h1t[:110], "description": excerpt, "image": f"{url}og.jpg", "datePublished": x.get('approved_at'), "dateModified": checked(x) or x.get('approved_at'), "inLanguage": "es-ES",
               "author": {"@type": "Organization", "@id": SITE + '/#org', "name": "Happy Low Cost", "url": SITE + '/'}, "publisher": {"@type": "Organization", "@id": SITE + '/#org', "name": "Happy Low Cost", "logo": {"@type": "ImageObject", "url": f"{SITE}/hlc/brand/icon-512.png"}}, "mainEntityOfPage": url}
        rel = related(x, deals)
        rel_html = ''.join(card(y) for y in rel)
        guide_link = f'<a class="hlc-btn o" href="/destinos/{dls}/">📖 Guía completa de {e(dmap[dls]["name"])}</a>' if dls and dls in dmap else ''
        page = head(title=e(seo_t), desc=e(deal_meta(x) or excerpt), canonical=url, og_image=url + 'og.jpg', og_title=e(title),
                    extra_head='<link rel="stylesheet" href="/hlc/home.css?v=12">' + hero_preload(hero, dls if lp else None) + ('<link rel="alternate" hreflang="es" href="' + url + '"><link rel="alternate" hreflang="en" href="' + f'{SITE}/en/deals/{en_deal_slug(x)}/' + '"><link rel="alternate" hreflang="x-default" href="' + url + '">' if x.get('en') else '') + ld_script([art, cld, offer, faq_ld(qa, 'es-ES')] + ([guide_image_ld(dls, f.get('destino') or '', 'es')] if lp and dls else [])), body_class='deal')
        page += f'''<main data-deal-slug="{e(slug)}" data-deal-ida="{e(f.get('ida', ''))}" data-deal-pub="{e((x.get('approved_at') or '')[:19])}Z">
<section class="deal-hero" style="{f'background-image:url({hero})' if hero else ''}"{photos_attr(lib_slug(f)) if lp else ''}><div class="wrap">
{ch.replace('class="crumbs"', 'class="crumbs crumbs-l"')}
<div class="kicker" style="color:#FFC531">✓ Precio {"comprobado de nuevo" if (x.get("facts") or {}).get("checked_at") else "verificado"} <span data-rel="{e(checked(x)[:19])}Z">el {e(fecha(verified))} a las {e(verified[11:16])} (hora peninsular)</span>{f' · Publicado el <time datetime="{e((x.get("approved_at") or "")[:19])}">{e(fecha(madrid(x.get("approved_at"))))}</time>' if x.get("approved_at") else ""}{f" · {ce} {e(cn)}" if cs else ""} <span class="k-n">· <a href="/como-verificamos/" style="color:#FFC531;text-decoration:underline">cómo lo comprobamos</a></span></div>
<h1>{e(h1t)}</h1>
<div class="deal-cta"><a class="price-tag" href="{e(x.get('cta_flight', '#'))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="deal_precio">{e(f.get('precio'))} € <small>{e(f.get('tipo', ''))}</small></a>{f'<span class="price-was">Precio habitual <s>{e(f.get("precio_normal"))} €</s> · ahorras un {e(f.get("ahorro_pct"))} %</span>' if f.get('precio_normal') else ''}{f'<span class="price-was">{e(local(x.get("price"), f.get("origen_cc")))} al cambio de hoy</span>' if local(x.get("price"), f.get("origen_cc")) else ''}<a class="hlc-btn" href="{e(x.get('cta_flight', '#'))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="deal_vuelo" style="min-height:56px;font-size:17px">Ver vuelo y fechas ✈️</a><span class="dc-fav big" role="button" tabindex="0" aria-label="Guardar en favoritos" data-fav="{e(slug)}">♡</span></div>
<div class="deal-days" data-days></div>
</div></section>
<div class="wrap"><div class="deal-body">
<article class="txt">{quick_answer(x)}<div class="howbook"><b>Cómo reservarlo en 3 pasos</b><ol><li>Pulsa «Ver vuelo y fechas»: se abre la búsqueda con estas fechas.</li><li>Si el precio ha cambiado, prueba un día antes o después; suele haber fechas parecidas.</li><li>Antes de pagar, revisa qué equipaje incluye la tarifa.</li></ol></div>{bag_box(f)}{x.get('body_html') or ''}
{guide_block(x)}
{f'<p>{guide_link}</p>' if guide_link else ''}
{deal_days_p(dls, dmap[dls]['name'], 'es') if dls and dls in dmap else ''}
{deal_route_p(f, 'es')}
{faq_html(qa)}
<p class="credit">{e(cred)}</p></article>
<aside class="deal-card">
<div class="facts">
<div><small>Desde</small><b>{flag(f.get('origen_cc'))} {e(f.get('origen'))}</b></div><div><small>Hasta</small><b>{flag(f.get('destino_cc'))} {e(f.get('destino'))}</b></div>
<div><small>Ida</small><b>{e(dia_sem(f.get('ida', '')) + fecha(f.get('ida', '')))}</b></div><div><small>Vuelta</small><b>{e((dia_sem(f.get('vuelta')) + fecha(f.get('vuelta'))) if f.get('vuelta') else '—')}{e(noches(f))}</b></div>
<div><small>Aerolínea</small><b>{e(f.get('aerolinea') or 'Varias')}</b></div><div><small>Escalas</small><b>{'Directo' if f.get('escalas') == 0 else e(f.get('escalas'))}</b></div>
</div>
<a class="hlc-btn" href="{e(x.get('cta_flight', '#'))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="deal_vuelo" style="min-height:56px;font-size:17px">Ver vuelo desde {e(f.get('precio'))} €</a>
<a class="hlc-btn t" href="{e(BK.with_dates(x.get('cta_hotel', '#'), f.get('ida'), f.get('vuelta')))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="deal_hotel" data-tvcity="{e(f.get('destino'))}">🏨 Hoteles en {e(f.get('destino'))} en estas fechas</a>
<a class="hlc-btn g" href="{e(BK.gyg(f.get('destino'), 'es', f.get('ida'), f.get('vuelta'), 'happylowcost-chollo'))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="deal_gyg">🎟️ Qué hacer en {e(f.get('destino'))}: tours y entradas</a>
<a class="hlc-btn o" href="{e(BK.gyg_transfer(f.get('destino'), 'es', f.get('ida')))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="deal_traslado">🚕 Traslado del aeropuerto en {e(f.get('destino'))}</a>
<a class="hlc-btn o" href="{e(BK.dc('es', 'happylowcost-chollo'))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="deal_coche">🚗 Alquiler de coche en {e(f.get('destino'))}</a>
{guide_link}
{route_cal_link(f)}<a class="hlc-btn o" href="/herramientas/equipaje/">🧳 ¿Cabe gratis tu maleta?</a>
{alt_box(f)}
<div style="font:13px/1.5 Inter,sans-serif;color:#4A5468">Precio comprobado cada día. Los vuelos baratos vuelan: si cambia, prueba fechas cercanas.</div>
<div class="rep"><button type="button" class="hlc-btn o" data-hlc-report="{e(slug)}">⚠️ ¿Ya no está a este precio? Avísanos</button><small data-report-msg role="status" aria-live="polite"></small></div>
{f'<a class="hlc-btn o" href="{e(ics_link(f, f"✈️ {f.get('origen')} → {f.get('destino')} · {f.get('precio')} €", url))}" download="chollo-{e(slug)}.ics" data-hlc="deal_calendario">📅 Guardar fechas en el calendario</a>' if f.get('ida') else ''}
<div class="share"><button class="hlc-btn o" type="button" data-share data-title="{e(title)}" data-url="{url}">📤 Compartir</button><a class="hlc-btn o" href="https://wa.me/?text={share_txt}" target="_blank" rel="noopener">WhatsApp</a><a class="hlc-btn o" href="https://www.facebook.com/sharer/sharer.php?u={quote(url)}" target="_blank" rel="noopener">Facebook</a><button class="hlc-btn o" type="button" data-copy="{url}">Copiar enlace</button></div>
<a class="hlc-btn s" href="/alertas/?d={quote(f.get('destino', ''))}">🔔 Avísame de chollos a {e(f.get('destino'))}</a>
</aside>
</div>
{T3.block(f.get('destino', ''), *dest_ll(f), lang='es', checkin=f.get('ida'), checkout=f.get('vuelta'), trip_from=f.get('origen') or None)}
<section class="sec" style="padding-top:10px"><div class="sec-h"><div><div class="kicker">También te puede interesar</div><h2>Chollos parecidos</h2></div><a class="hlc-btn o" href="/chollos/">Ver todos</a></div><div class="dc-grid">{rel_html}</div></section>
</div></main></body></html>'''
        page = page.replace('</head>', '<link rel="alternate" type="text/markdown" href="' + url + 'index.md" title="Markdown"></head>', 1)
        open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(hero_img(page))
        open(os.path.join(out, 'index.md'), 'w', encoding='utf-8').write(deal_md(x, url, h1t, qa))

    cities_ = {}
    for x in deals:
        f_ = x['facts']
        k_ = (slugify(f_.get('origen_pais') or ''), slugify(f_.get('origen') or ''))
        if all(k_):
            cities_.setdefault(k_, [f_.get('origen'), 0])[1] += 1
    hub = hub_links(origins, conts, dests_with_deals, cities_)
    nconts = len({REAL_CONT.get(x['facts'].get('continente') or '') for x in deals} - {None, ''})
    # ---------- chollos retirados (caducados o revalidados al alza): su página pasa a "caducado", noindex ----------
    live = {x['slug'] for x in deals}
    gone = 0
    for d_ in os.listdir('chollos'):
        p_ = os.path.join('chollos', d_, 'index.html')
        if d_ in ('ver', 'desde', 'a') or d_ in live or not os.path.isfile(p_):
            continue
        old = open(p_, encoding='utf-8').read()
        if 'data-expired' in old:
            continue
        m_ = re.search(r'<h1>(.*?)</h1>', old, re.S)
        t_ = m_.group(1) if m_ else 'Este chollo'
        mt = re.match(r'(.+?)-(\d+)-euros-', d_)
        route = mt.group(1) if mt else ''
        rlink = f'<a class="hlc-btn" href="/vuelos/{route}/">Precio de hoy en esta ruta</a>' if route and os.path.isdir(os.path.join('vuelos', route)) else ''
        pg = head(title=f'{t_} · caducado · Happy Low Cost', desc='Este chollo ya no está disponible. Mira los chollos verificados de hoy.', canonical=f'{SITE}/chollos/{d_}/', robots='noindex, follow', og_image=f'{SITE}/hlc/brand/og-default.jpg', body_class='deal')
        pg += (f'<main class="sec" data-expired style="padding-top:30px"><div class="wrap" style="max-width:760px"><div class="kicker">Chollo caducado</div><h1 class="x-h1">{t_}</h1>'
               f'<p style="font-size:18px">Este precio ya no está disponible: o ha pasado la fecha o, al volver a comprobarlo, había subido. Los chollos vuelan, pero salen otros cada día.</p>'
               f'<div style="display:flex;gap:10px;flex-wrap:wrap">{rlink}<a class="hlc-btn{" o" if rlink else ""}" href="/chollos/">Ver los chollos de hoy</a><a class="hlc-btn o" href="/alertas/">Crear alerta</a></div></div></main></body></html>')
        open(p_, 'w', encoding='utf-8').write(pg)
        for fn in ('og.jpg', 'foto.jpg', 'credito.txt'):
            if os.path.exists(os.path.join('chollos', d_, fn)):
                os.remove(os.path.join('chollos', d_, fn))
        gone += 1
    print('caducados', gone)

    # ---------- explorador /chollos/ ----------
    intro = (f"{len(deals)} chollo{'s' if len(deals) != 1 else ''} de vuelos activo{'s' if len(deals) != 1 else ''} ahora mismo, con salida desde {len(origins)} país{'es' if len(origins) != 1 else ''} y destinos en {nconts} continente{'s' if nconts != 1 else ''}. "
             f"Cada precio se comprueba en Kiwi.com antes de publicarlo y otra vez cada día; si sube más de un 10 %, lo retiramos.")
    _d = datetime.date.today()
    list_page('chollos', f'Chollos de vuelos de hoy, {_d.day} de {["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"][_d.month - 1]}: verificados · Happy Low Cost', 'Chollos de vuelos de hoy', 'Recién cazados · verificados', intro, deals,
              f'{SITE}/chollos/', [('Inicio', '/'), ('Chollos', None)], extra_links=hub, explorer=True)

    # ---------- para asistentes de IA y agentes: feed JSON y texto plano con los chollos vivos ----------
    def _row(x):
        f = x['facts']
        return {"title": clean_title(x.get('title') or ''), "url": f"{SITE}/chollos/{x['slug']}/", "url_en": (f"{SITE}/en/deals/{en_deal_slug(x)}/" if x.get('en') else None),
                "origin": f.get('origen'), "origin_iata": f.get('origen_iata'), "origin_country": f.get('origen_pais'),
                "destination": f.get('destino'), "destination_iata": f.get('destino_iata'), "destination_country": f.get('pais'),
                "price_eur": x.get('price'), "usual_price_eur": f.get('precio_normal'), "saving_pct": f.get('ahorro_pct'), "trip": "return",
                "depart": f.get('ida'), "return": f.get('vuelta'), "airline": f.get('aerolinea'), "stops": f.get('escalas'),
                "price_checked_at_utc": checked(x), "published_at_utc": x.get('approved_at'),
                # ronda 7 (#73): tipo de chollo. Solo se publica ida sin vuelta si es un error de tarifa de verdad (regla de la casa)
                "category": ("fare_error" if (f.get('tipo') and 'vuelta' not in (f.get('tipo') or '')) or any('error' in (t or '').lower() for t in (x.get('tags') or [])) else "deal"),
                "level": ("exceptional" if (f.get('ahorro_pct') or 0) >= 50 else "very_good")}
    now_iso = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    json.dump({"site": "Happy Low Cost", "home": SITE + '/', "generated_at_utc": now_iso, "currency": "EUR",
               "note": "Flight deals at least %d%% below the usual price of the route. Return trips only. Prices change by the hour: check the live price on the deal page." % MIN_SAVE,
               "deals": [_row(x) for x in deals]}, open(os.path.join('chollos', 'feed.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    lf = [f"# Happy Low Cost: chollos de vuelos activos ({fecha(today)})", '',
          f"> {len(deals)} chollos de vuelos de ida y vuelta, cada uno al menos un {MIN_SAVE} % por debajo del precio habitual de su ruta. Actualizado: {now_iso}. "
          "Los precios cambian por horas: comprueba siempre el precio en la página del chollo. Mismo contenido en JSON: " + SITE + "/chollos/feed.json", '',
          "Happy Low Cost (desde 2012, más de 420.000 seguidores) publica chollos de vuelos verificados, sobre todo con salida desde España. Método: " + SITE + "/como-verificamos/", '']
    lf += llms_month_blocks(deals, 'es')
    by_o = {}
    for x in sorted(deals, key=lambda y: (0 if y['facts'].get('origen_cc') == 'ES' else 1, y['facts'].get('origen') or '', y.get('price') or 0)):
        by_o.setdefault(f"{x['facts'].get('origen')} ({x['facts'].get('origen_pais')})", []).append(x)
    for o_, lst in by_o.items():
        lf.append(f"## Desde {o_}")
        for x in lst:
            f = x['facts']
            lf.append(f"- [{f.get('origen')} → {f.get('destino')} ({f.get('pais')}): {x.get('price')} € ida y vuelta]({SITE}/chollos/{x['slug']}/)"
                      + (f", {f.get('aerolinea')}" if f.get('aerolinea') else '') + (', directo' if f.get('escalas') == 0 else '')
                      + f", {fecha(f.get('ida'))} a {fecha(f.get('vuelta'))}" + (f". Precio habitual {f.get('precio_normal')} € (−{f.get('ahorro_pct')} %)" if f.get('precio_normal') else '')
                      + f". Comprobado el {fecha(madrid(checked(x)))}.")
        lf.append('')
    open(os.path.join('chollos', 'llms-full.txt'), 'w', encoding='utf-8').write('\n'.join(lf))

    # ---------- portada: chollos en el HTML (Google y móviles lentos los ven sin esperar al JavaScript) ----------
    if os.path.exists('index.html'):
        pool = sorted(deals, key=lambda x: (_age_bucket(x), 0 if x['facts'].get('origen_cc') == 'ES' else 1, 0 if x['facts'].get('ahorro_pct') else 1, -(datetime.datetime.fromisoformat((x.get('approved_at') or '1970-01-01')[:19]).timestamp())))
        top = pool[:6]
        ix = open('index.html', encoding='utf-8').read()
        ix = re.sub(r'<!--ssr-count-->.*?<!--/ssr-count-->', f'<!--ssr-count-->{len(deals)} chollo{"s" if len(deals) != 1 else ""} activo{"s" if len(deals) != 1 else ""} ahora, desde {len(origins)} país{"es" if len(origins) != 1 else ""}. Precio comprobado cada día frente a lo que suele costar la ruta.<!--/ssr-count-->', ix, flags=re.S)
        if '<!--ssr-deals-->' in ix:
            ix = re.sub(r'<!--ssr-deals-->.*?<!--/ssr-deals-->', lambda m: '<!--ssr-deals-->' + (''.join(card(x) for x in top) or EMPTY) + '<!--/ssr-deals-->', ix, flags=re.S)
        def phone(x, cls, attr):
            f = x['facts']
            was = f'<s>{e(f.get("precio_normal"))} €</s> ' if f.get('precio_normal') else ''
            sv = f' <i>−{e(f.get("ahorro_pct"))} %</i>' if f.get('ahorro_pct') else ''
            return (f'<div class="{cls}" {attr}><a href="/chollos/{e(x["slug"])}/"><span class="h2-ph" style="background-image:url({e(photo_url(x))})"></span>'
                    f'<span class="h2-t"><b>✈️ {e(f.get("origen"))} → {e(f.get("destino"))}</b><span>{was}<em>{e(x.get("price"))} €</em>{sv}</span><small>{e(f.get("tipo", ""))}{" · directo" if f.get("escalas") == 0 else ""}</small></span></a></div>')
        sv_pool = [x for x in pool if x['facts'].get('precio_normal')] or pool
        if '<!--ssr-hero-->' in ix and len(sv_pool) >= 2:
            ix = re.sub(r'<!--ssr-hero-->.*?<!--/ssr-hero-->', lambda m: '<!--ssr-hero-->' + phone(sv_pool[0], 'h2-deal', 'data-hlc-hero-deal') + phone(sv_pool[1], 'h2-deal h2-deal2', 'data-hlc-hero-deal2') + '<!--/ssr-hero-->', ix, flags=re.S)
        il = ld_script([{"@type": "ItemList", "name": "Chollos de vuelos de hoy", "numberOfItems": len(top), "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "url": f"{SITE}/chollos/{x['slug']}/", "name": clean_title(x.get('title') or '')} for i, x in enumerate(top)]}])
        ix = re.sub(r'<!--ssr-ld-->.*?<!--/ssr-ld-->', '', ix, flags=re.S).replace('</head>', '<!--ssr-ld-->' + il + '<!--/ssr-ld--></head>', 1)
        cnt_desc = f"{len(deals)} chollos de vuelos verificados hoy, desde {min(x['price'] for x in deals)} € ida y vuelta, todos al menos un {MIN_SAVE} % por debajo del precio habitual. Te avisamos gratis por email o en el móvil." if deals else None
        if cnt_desc:
            ix = re.sub(r'(<meta name="description" content=")[^"]*(")', lambda m: m.group(1) + e(cnt_desc) + m.group(2), ix, count=1)
            ix = re.sub(r'(<meta property="og:description" content=")[^"]*(")', lambda m: m.group(1) + e(cnt_desc) + m.group(2), ix, count=1)
        open('index.html', 'w', encoding='utf-8').write(ix)

    # ---------- landings por país de salida ----------
    known = set(json.load(open('chollos/landings.json'))) if os.path.exists('chollos/landings.json') else set()
    gen = set()
    allo = dict(origins)
    for k in [k_ for k_ in known if k_.startswith('desde/')]:
        allo.setdefault(k[6:], [k[6:].replace('-', ' ').title(), '', 0])
    allo.setdefault('espana', ['España', 'ES', 0])
    for k, (pais, cc, n) in allo.items():
        sub = [x for x in deals if slugify(x['facts'].get('origen_pais') or '') == k]
        cheapest = min((x['price'] for x in sub), default=None)
        tops = ', '.join(dict.fromkeys(x['facts'].get('destino') for x in sub))
        intro = (f"{len(sub)} chollos de vuelos desde {pais} verificados hoy" + (f", desde {cheapest} €" if cheapest else "") + (f": {tops[:160]}." if tops else ".") +
                 " Comprobamos cada precio antes de publicarlo y mostramos cuándo.") if sub else f"Ahora mismo no hay chollos con salida desde {pais}. Vuelve pronto o crea una alerta gratis y te avisamos."
        list_page(f'chollos/desde/{k}', f'Chollos de vuelos desde {pais} hoy · Happy Low Cost', f'Chollos de vuelos desde {pais}', f'{flag(cc)} Salidas desde {pais}', intro, sub,
                  f'{SITE}/chollos/desde/{k}/', [('Inicio', '/'), ('Chollos', '/chollos/'), (f'Desde {pais}', None)], extra_links=hub, noindex=not sub)
        gen.add('desde/' + k)
    # ---------- landings por continente ----------
    for cs, (cname_k, cname, cemoji) in CONT_BY_SLUG.items():
        sub = [x for x in deals if cont_of(x['facts'])[0] == cs]
        if not sub and ('a/' + cs) not in known:
            continue
        cheapest = min((x['price'] for x in sub), default=None)
        tops = ', '.join(dict.fromkeys(x['facts'].get('destino') for x in sub))
        intro = (f"{len(sub)} chollos de vuelos a {cname} comprobados hoy" + (f", desde {cheapest} €" if cheapest else "") + (f": {tops[:160]}." if tops else ".") +
                 " Precios verificados antes de publicar, con salidas desde España y desde todo el mundo.") if sub else f"Ahora mismo no hay chollos a {cname}. Crea una alerta gratis y te avisamos en cuanto cacemos uno."
        list_page(f'chollos/a/{cs}', f'Chollos de vuelos a {cname} · Happy Low Cost', f'Chollos de vuelos a {cname}', f'{cemoji} Destinos en {cname}', intro, sub,
                  f'{SITE}/chollos/a/{cs}/', [('Inicio', '/'), ('Chollos', '/chollos/'), (f'A {cname}', None)], extra_links=hub, noindex=not sub)
        gen.add('a/' + cs)
    # ---------- landings por ciudad de salida (chollos/desde/<pais>/<ciudad>/) ----------
    bycity = {}
    for x in deals:
        f_ = x['facts']
        pk, ck = slugify(f_.get('origen_pais') or ''), slugify(f_.get('origen') or '')
        if pk and ck:
            bycity.setdefault((pk, ck), [f_.get('origen'), f_.get('origen_pais'), f_.get('origen_cc'), []])[3].append(x)
    for k_ in [k for k in known if k.startswith('desde/') and k.count('/') == 2]:
        _, pk, ck = k_.split('/')
        bycity.setdefault((pk, ck), [ck.replace('-', ' ').title(), pk.replace('-', ' ').title(), '', []])
    for (pk, ck), (city, pais, cc, sub) in bycity.items():
        cheapest = min((x['price'] for x in sub), default=None)
        tops = ', '.join(dict.fromkeys(x['facts'].get('destino') for x in sub))
        intro = (f"{len(sub)} chollos de vuelos desde {city} comprobados" + (f", desde {cheapest} €" if cheapest else "") + (f": {tops[:150]}." if tops else ".") +
                 " Cada precio se comprueba antes de publicarlo y se vuelve a comprobar cada día.") if sub else f"Ahora mismo no hay chollos desde {city}. Crea una alerta gratis y te avisamos en cuanto salga uno."
        list_page(f'chollos/desde/{pk}/{ck}', f'Vuelos baratos desde {city}: chollos de hoy · Happy Low Cost', f'Chollos de vuelos desde {city}', f'{flag(cc)} Salidas desde {city}', intro, sub,
                  f'{SITE}/chollos/desde/{pk}/{ck}/', [('Inicio', '/'), ('Chollos', '/chollos/'), (f'Desde {pais}', f'/chollos/desde/{pk}/'), (city, None)], extra_links=hub, noindex=not sub,
                  # ronda 9: "cheapest flights" en chollos desde Santiago de Chile (pos. 4,6): enlace a la página de todas las rutas desde la ciudad
                  seo_html=(f'<section class="sec" style="padding-top:6px"><p><a class="hlc-btn o" href="/vuelos/desde/{ck}/">Vuelos más baratos desde {e(city)}: todos los destinos y precios</a></p></section>' if os.path.isfile(f'vuelos/desde/{ck}/index.html') else ''))
        gen.add(f'desde/{pk}/{ck}')

    # ---------- ideas: temporadas, puentes y presupuestos (se actualizan solas) ----------
    def nights(f_):
        try:
            return (datetime.date.fromisoformat(f_['vuelta'][:10]) - datetime.date.fromisoformat(f_['ida'][:10])).days
        except Exception:
            return 99
    IDEAS = [
        ('puente-diciembre-2026', 'Puente de diciembre 2026', 'Chollos para el puente de la Constitución y la Inmaculada, con salida entre el 3 y el 8 de diciembre de 2026.', lambda f_: '2026-12-03' <= (f_.get('ida') or '')[:10] <= '2026-12-08'),
        ('navidad-2026', 'Navidad y fin de año 2026', 'Chollos de vuelos con salida entre el 18 de diciembre de 2026 y el 6 de enero de 2027.', lambda f_: '2026-12-18' <= (f_.get('ida') or '')[:10] <= '2027-01-06'),
        ('semana-santa-2027', 'Semana Santa 2027', 'Chollos con salida entre el 19 y el 28 de marzo de 2027 (Semana Santa: 25 al 28 de marzo).', lambda f_: '2027-03-19' <= (f_.get('ida') or '')[:10] <= '2027-03-28'),
        ('fin-de-semana', 'Escapadas de fin de semana baratas', 'Vuelos baratos para una escapada: viajes de ida y vuelta de 2 a 4 noches con salida jueves, viernes o sábado, del más barato al más caro.', lambda f_: f_.get('vuelta') and 2 <= nights(f_) <= 4 and datetime.date.fromisoformat(f_['ida'][:10]).weekday() in (3, 4, 5)),
        ('menos-de-50-euros', 'Vuelos por menos de 50 euros ida y vuelta', 'Vuelos por 50 euros o menos, ida y vuelta: chollos comprobados.', lambda f_: (f_.get('precio') or 999) <= 50),
        ('menos-de-100-euros', 'Vuelos por menos de 100 euros ida y vuelta', 'Vuelos por menos de 100 euros, ida y vuelta: chollos comprobados.', lambda f_: (f_.get('precio') or 999) <= 100),
        ('larga-distancia', 'Larga distancia por menos de 600 €', 'Chollos a otro continente por 600 € o menos, ida y vuelta.', lambda f_: (f_.get('precio') or 9999) <= 600 and f_.get('continente') and REAL_CONT.get(f_.get('continente')) != REAL_CONT.get(f_.get('origen_continente') or '', f_.get('origen_continente'))),
        ('directos', 'Chollos de vuelos directos', 'Vuelos directos baratos, sin escalas, de ida y vuelta.', lambda f_: f_.get('escalas') == 0),
    ]
    ideas_links = []
    for k_, h1_, desc_, fn_ in IDEAS:
        sub = [x for x in deals if fn_(x['facts'])]
        cheapest = min((x['price'] for x in sub), default=None)
        intro = (f"{desc_} {len(sub)} chollos ahora mismo" + (f", desde {cheapest} €." if cheapest else ".") + " Precios comprobados cada día.") if sub else f"{desc_} Ahora mismo no hay ninguno: crea una alerta y te avisamos."
        list_page(f'chollos/ideas/{k_}', ('Vuelos baratos para Navidad 2026 y fin de año: chollos' if k_ == 'navidad-2026' else idea_title_es(k_, h1_)), ('Vuelos baratos para Navidad 2026' if k_ == 'navidad-2026' else h1_), 'Ideas para viajar barato', intro, sub, f'{SITE}/chollos/ideas/{k_}/',
                  [('Inicio', '/'), ('Chollos', '/chollos/'), (h1_, None)], extra_links=hub, noindex=not sub,
                  seo_html=ideas_faq(sub, h1_, False, {'menos-de-50-euros': 50, 'menos-de-100-euros': 100}.get(k_)))
        gen.add(f'ideas/{k_}')
        ideas_links.append((k_, h1_, len(sub)))
    json.dump(ideas_links, open('chollos/ideas.json', 'w', encoding='utf-8'), ensure_ascii=False)
    json.dump(sorted(gen | known), open('chollos/landings.json', 'w'))

    # ---------- guías de destino /destinos/<slug>/ ----------
    dlinks = []
    guide_days_map = {}
    for p in DLIB:
        g = dmap.get(p['s'])
        if not g:
            continue
        sub = [x for x in deals if lib_slug(x['facts']) == p['s']]
        url = f"{SITE}/destinos/{p['s']}/"
        gh = re.sub(r'<(?!/?(h2|h3|p|ul|li|strong)\b)[^>]*>', '', g['guide_html'])
        gh = re.sub(r'<(h2|h3|p|ul|li|strong)\b[^>]*>', r'<\1>', gh)
        ttl0 = g.get('seo_title') or f"Qué ver en {p['n']}"
        nd = guide_days(ttl0, gh)
        if p['s'] in TITLE_Q_ES and nd:
            ttl0 = TITLE_Q_ES[p['s']](p['n'], nd) or ttl0
        xq = guide_extra_faq(gh, p['n'], nd, sub, 'es')
        if xq:
            add = ''.join(f'<h3>{e(q)}</h3><p>{e(a)}</p>' for q, a in xq)
            mfaq = re.search(r'(<h2>[^<]*(?:Preguntas frecuentes|FAQ)[^<]*</h2>.*?)(?=<h2|$)', gh, re.S | re.I)
            gh = (gh[:mfaq.end()] + add + gh[mfaq.end():]) if mfaq else gh + '<h2>Preguntas frecuentes</h2>' + add
        gh, trip_ld = guide_itinerary(gh, p['n'], nd, 'es')
        gh = guide_short_faq(gh, trip_ld, p['n'], 'es')
        gh = guide_todo_faq(gh, trip_ld, p['n'], en_names.COUNTRY_ES_FIX.get(p['c'], p['c']), 'es')
        gh = guide_section_faq(gh, p['n'], 'es', T3.hotel_faq(p['n'], p.get('y'), p.get('x'), [p['s']] + list(p.get('a') or []), (), lang='es'))
        gh, bud = guide_budget(gh, 'es')
        gh = guide_cost_faq(gh, p['n'], 'es')
        attr = guide_attractions(gh)
        gh, g_faq, words = guide_extras(gh, 'es', p['n'])
        _pc = PAISES.get(slugify(en_names.COUNTRY_ES_FIX.get(p['c'], p['c'])))  # ronda 5: país en la miga cuando existe su hub de vuelos
        ch, cld = crumbs([('Inicio', '/'), ('Destinos', '/destinos/')] + ([(en_names.COUNTRY_ES_FIX.get(p['c'], p['c']), _pc[0])] if _pc else []) + [(p['n'], None)])
        # título con el año (las consultas que ya posicionan son "qué ver en X en 3 días": la cifra y el año suben el CTR)
        yr = str(datetime.date.today().year)
        ttl = ttl0 if yr in ttl0 else re.sub(r'(\ben \d{1,2} d[ií]as)', r'\1 (' + yr + ')', ttl0, count=1)
        if ttl == ttl0 and yr not in ttl0 and len(ttl0) <= 52:
            ttl = ttl0 + f' ({yr})'
        dsc = g.get('meta_description') or f"Guía de {p['n']}: qué ver, dónde dormir, qué comer y chollos de vuelos."
        if nd and not re.search(r'd[ií]a a d[ií]a|\d+ d[ií]as', dsc, re.I):
            dsc = f"{nd} días en {p['n']}, día a día: " + dsc[:1].lower() + dsc[1:]
        if bud and 'presupuesto' not in dsc.lower():
            bud_ = re.sub(r'(?i)\s*euros?\b', ' €', bud).strip()
            add_ = f" Presupuesto: {bud_} al día."
            if len(dsc.rstrip()) + len(add_) <= 200:
                dsc = dsc.rstrip() + ('' if dsc.rstrip().endswith('.') else '.') + add_
        dsc = guide_meta(p['n'], nd, attr, bud, 'es') or dsc
        summ = guide_summary(gh, p['n'], nd, sub, g.get('updated_at'), 'es')
        img_ld = guide_image_ld(p['s'], p['n'], 'es')
        hub_es = f"/vuelos/a/{p['s']}/" if os.path.isfile(os.path.join('vuelos', 'a', p['s'], 'index.html')) else ''
        en_url_ = f"{SITE}/en/destinations/{en_dest_slug(p['s'])}/" 
        cr = CR.get(p['s']) or {}
        dest_ld = {"@type": "TouristDestination", "name": p['n'], "url": url, "image": f"{SITE}/hlc/img/cities/{p['s']}.jpg", "geo": {"@type": "GeoCoordinates", "latitude": p['y'], "longitude": p['x']},
                   "containedInPlace": {"@type": "Country", "name": en_names.COUNTRY_ES_FIX.get(p['c'], p['c'])}}
        if attr:
            dest_ld["includesAttraction"] = attr
        if wd_same(p['s'], 'es'):
            dest_ld["sameAs"] = wd_same(p['s'], 'es')
        art = {"@type": "Article", "headline": (g.get('seo_title') or f"Qué ver en {p['n']}")[:110], "description": g.get('meta_description') or '', "image": f"{SITE}/hlc/img/cities/{p['s']}.jpg",
               "dateModified": g.get('updated_at'), "datePublished": g.get('updated_at'), "wordCount": words, "inLanguage": "es-ES", "about": {"@id": url + '#destino'},
               "author": {"@id": ORG_ID}, "publisher": {"@id": ORG_ID}, "mainEntityOfPage": url, "isAccessibleForFree": True,
               "speakable": {"@type": "SpeakableSpecification", "cssSelector": [".g-sum", "h1"]}}
        art["headline"] = ttl[:110]
        art["description"] = dsc[:300]  # ronda 8: la misma descripción que la meta
        art["image"] = {"@id": img_ld["@id"]}
        dest_ld["image"] = {"@id": img_ld["@id"]}
        dest_ld["@id"] = url + '#destino'
        side = ''.join(card(x) for x in sub[:3])
        near = nearby_guides(p, dmap)
        near_html = (f'<section class="sec" style="padding-top:10px"><div class="sec-h"><div><div class="kicker">Para combinar en el mismo viaje</div><h2>Destinos cerca de {e(p["n"])}</h2></div></div><div class="hub-g">'
                     + ''.join(f'<a class="hub-l" href="/destinos/{q["s"]}/">Qué ver en {e(q["n"])} <small>a unos {km_} km</small></a>' for km_, q in near) + '</div></section>') if near else ''
        guide_days_map[p['s']] = nd
        page = head(title=e(ttl + (' · Happy Low Cost' if len(ttl) <= 46 else '')), desc=e(dsc[:300]),
                    canonical=url, og_image=f"{SITE}/hlc/img/cities/{p['s']}.jpg", og_title=e(ttl), og_alt=e(f"Foto de {p['n']} ({p['c']})"),
                    extra_head='<link rel="stylesheet" href="/hlc/home.css?v=12">' + guide_head_extra(p['s'], url + 'index.md', g.get('updated_at'), 'es', bool(g.get('guide_html_en'))) + ('<link rel="alternate" hreflang="es" href="' + url + '"><link rel="alternate" hreflang="en" href="' + en_url_ + '"><link rel="alternate" hreflang="x-default" href="' + url + '">' if g.get('guide_html_en') else '') + GUIDE_TABLE_CSS + ld_script([ORG_LD, img_ld, dest_ld, art, cld] + ([g_faq] if g_faq else []) + ([trip_ld] if trip_ld else [])), body_class='destino')
        page += f'''<main>
<section class="deal-hero" style="background-image:url(/hlc/img/cities/{p['s']}.jpg)"{photos_attr(p['s'])}><div class="wrap">
{ch.replace('class="crumbs"', 'class="crumbs crumbs-l"')}
<div class="kicker" style="color:#FFC531">Guía de viaje · {e(p['c'])}</div>
<h1>{e(ttl0)}</h1>
<div class="deal-cta">{f'<a class="hlc-btn" href="#chollos">🔥 {len(sub)} chollo{"s" if len(sub) != 1 else ""} a {e(p["n"])}</a>' if sub else ''}<a class="hlc-btn t" href="{CJ_H(p['n'])}" target="_blank" rel="sponsored nofollow noopener">🏨 Hoteles en {e(p['n'])}</a>{f'<a class="hlc-btn o" href="{hub_es}" style="background:#fff">✈️ Vuelos baratos a {e(p["n"])}</a>' if hub_es else ''}<a class="hlc-btn o" href="/destinos/#destinos" style="background:#fff">🗺️ Ver en el mapa</a></div>
</div></section>
<div class="wrap"><div class="deal-body">
<article class="txt guide">{summ}{gh}
<p class="credit">Foto: {e(cr.get('author') or 'Wikimedia Commons')} · {e(cr.get('license', ''))} · Wikimedia Commons · Guía actualizada el {e(fecha(g.get('updated_at') or ''))}</p></article>
<aside class="deal-card" id="chollos">
<div class="kicker">Chollos a {e(p['n'])}</div>
{side or f'<p style="margin:0;color:#4A5468">Hoy no hay chollo a {e(p["n"])}. Te avisamos gratis cuando salga uno.</p>'}
<a class="hlc-btn s" href="/alertas/?d={quote(p['n'])}">🔔 Alerta de chollos a {e(p['n'])}</a>
<a class="hlc-btn t" href="{CJ_H(p['n'])}" target="_blank" rel="sponsored nofollow noopener">🏨 Hoteles en {e(p['n'])}</a>
<a class="hlc-btn o" href="/chollos/">Ver todos los chollos</a>
</aside></div>
<div id="hoteles">{T3.block(p['n'], p.get('y'), p.get('x'), [p['s']] + list(p.get('a') or []), (), lang='es')}</div>
<section class="sec vw" data-hlc-videos data-dest="{p["s"]}" data-hide-empty hidden><div class="sec-h"><div><div class="kicker">Vídeos de viajeros</div><h2>{e(p["n"])} en vídeo</h2></div><a class="hlc-btn o" href="/videos/">Comparte el tuyo</a></div><div class="vw-grid"></div></section>
{near_html}<section class="sec" style="padding-top:10px"><div class="sec-h"><div><div class="kicker">Más inspiración</div><h2>Otros destinos</h2></div></div><div class="hub-g">{''.join(f'<a class="hub-l" href="/destinos/{q["s"]}/">{e(("Qué ver en " + q["n"] + " en " + str(_DIAS[q["s"]]) + " días") if _DIAS.get(q["s"]) else q["n"])}</a>' for q in DLIB if q['s'] in dmap and q['s'] != p['s'] and q['r'] == p['r'])}{f'<a class="hub-l" href="/destinos/region/{p["r"]}/"><b>Todas las guías de la zona</b></a>' if os.path.isdir(f"destinos/region/{p['r']}") else ''}</div></section>
</div></main></body></html>'''
        os.makedirs(os.path.join('destinos', p['s']), exist_ok=True)
        open(os.path.join('destinos', p['s'], 'index.html'), 'w', encoding='utf-8').write(hero_img(page))
        open(os.path.join('destinos', p['s'], 'index.md'), 'w', encoding='utf-8').write(guide_md(ttl0, url, re.sub(r'<section class="g-sum".*?</section>', '', gh, flags=re.S), p['n'], nd, g.get('updated_at'), 'es',
             (f"## Vuelos y chollos\n\n- Chollos de vuelos a {p['n']}: {SITE}/destinos/{p['s']}/#chollos\n" + (f"- Precios de vuelos a {p['n']} desde varias ciudades: {SITE}{hub_es}\n" if hub_es else '') + f"- Alerta gratis de chollos: {SITE}/alertas/\n")))
        dlinks.append((p, g))
    # días de cada guía: gen_routes los usa en el texto del enlace ("Qué ver en X en 3 días")
    json.dump(guide_days_map, open(os.path.join('destinos', 'dias.json'), 'w', encoding='utf-8'), sort_keys=True)
    # ---------- /hoteles/: los 3 hoteles de cada destino con guía ----------
    hl = []
    for p, g in dlinks:
        c_ = T3.find(p.get('y'), p.get('x'), [p['s']] + list(p.get('a') or []), ())
        if c_:
            hl.append((p, c_))
    tiles = ''.join(f'<a class="dc" href="/destinos/{p["s"]}/#hoteles"><div class="dc-img" ' + (f'style="background-image:url(/hlc/img/cities/{p["s"]}-800.jpg)"' if i_ < 6 else f'data-bg="/hlc/img/cities/{p["s"]}-800.jpg"') + f'><span class="dc-city">{e(p["n"])}</span></div><div class="dc-b"><div><div class="dc-r">3 hoteles en {e(p["n"])}</div><div class="dc-m">Económico · calidad-precio · lujo</div></div></div></a>' for i_, (p, c_) in enumerate(hl))
    hp = head(title='Dónde dormir barato: los 3 mejores hoteles de cada destino · Happy Low Cost', desc=f'Un hotel económico, uno con la mejor calidad-precio y uno de lujo en {len(hl)} destinos, elegidos por nota real de huéspedes.',
              canonical=f'{SITE}/hoteles/', og_type='website', og_image=f'{SITE}/hlc/brand/og-default.jpg',
              extra_head=f'<link rel="stylesheet" href="/hlc/home.css?v=12"><link rel="alternate" hreflang="es" href="{SITE}/hoteles/"><link rel="alternate" hreflang="en" href="{SITE}/en/hotels/"><link rel="alternate" hreflang="x-default" href="{SITE}/hoteles/">'
              + ld_script([hotels_ld(hl, 'es')]), body_class='chollos')
    hp += f'''<main class="sec" style="padding-top:26px"><div class="wrap"><div class="sec-h"><div><div class="kicker">Hoteles</div><h1 class="x-h1">Dónde dormir en cada destino</h1><p>Para cada destino, 3 hoteles: el económico, el de mejor calidad-precio y uno de lujo, elegidos por top3hotels.com según la nota real de los huéspedes. {len(hl)} destinos.</p></div></div>
<div class="dc-grid">{tiles}</div></div></main></body></html>'''
    os.makedirs('hoteles', exist_ok=True)
    open('hoteles/index.html', 'w', encoding='utf-8').write(hp)
    json.dump([p['s'] for p, c_ in hl], open('hoteles/destinos.json', 'w'))

    # portada: guías más leídas (las 8 con más impresiones en Search Console, 28 días hasta el 25-nov-2026)
    TOP_GUIAS = ['bucarest', 'varsovia', 'belgrado', 'tallin', 'salzburgo', 'riga', 'maldivas', 'sofia']
    if os.path.exists('index.html'):
        nm_ = {p['s']: p['n'] for p, g in dlinks}
        tg = [s_ for s_ in TOP_GUIAS if s_ in nm_]
        if tg:
            blk = ('<!--top-guias--><section class="sec" style="padding-top:10px"><div class="wrap"><div class="sec-h"><div><div class="kicker">Lo que más se lee</div><h2>Guías más leídas</h2></div><a class="hlc-btn o" href="/destinos/">Todas las guías</a></div><div class="hub-g">'
                   + ''.join(f'<a class="hub-l" href="/destinos/{s_}/">Qué ver en {e(nm_[s_])}' + (f' en {guide_days_map[s_]} días' if guide_days_map.get(s_) else '') + '</a>' for s_ in tg)
                   + '</div></div></section><!--/top-guias-->')
            hi = open('index.html', encoding='utf-8').read()
            hi = re.sub(r'<!--top-guias-->.*?<!--/top-guias-->', lambda _m: blk, hi, flags=re.S) if '<!--top-guias-->' in hi else hi.replace('</main>', blk + '</main>', 1)
            open('index.html', 'w', encoding='utf-8').write(hi)

    # índice de guías dentro de /destinos/
    if os.path.exists('destinos/index.html'):
        di = open('destinos/index.html', encoding='utf-8').read()
        il = {"@type": "ItemList", "name": "Guías de viaje por destino", "numberOfItems": len(dlinks), "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": f"{SITE}/destinos/{p['s']}/", "name": p['n']} for i, (p, g) in enumerate(dlinks)]}
        block = '<!--guias--><section class="hub"><h2>Guías de viaje por destino</h2><div class="hub-g">' + ''.join(f'<a class="hub-l" href="/destinos/{p["s"]}/">{e(p["n"])} <small>{e(p["c"])}</small></a>' for p, g in dlinks) + '</div></section>' + ld_script([il]) + '<!--/guias-->'
        di = re.sub(r'<!--guias-->.*?<!--/guias-->', block, di, flags=re.S) if '<!--guias-->' in di else di.replace('</main>', block + '</main>', 1)
        if 'hreflang="x-default"' not in di and '<link rel="alternate" hreflang="es" href="https://www.happylowcost.com/destinos/">' in di:
            di = di.replace('<link rel="alternate" hreflang="es" href="https://www.happylowcost.com/destinos/">', '<link rel="alternate" hreflang="es" href="https://www.happylowcost.com/destinos/"><link rel="alternate" hreflang="x-default" href="https://www.happylowcost.com/destinos/">', 1)
        open('destinos/index.html', 'w', encoding='utf-8').write(di)

    # llms-full.txt: además de los chollos, todas las guías con su versión Markdown (lo leen ChatGPT, Claude, Perplexity...)
    try:
        lg = ['', f'# Guías de viaje ({len(dlinks)} destinos)', '',
              'Cada guía tiene qué ver, ruta por días, cuándo ir, dónde dormir, qué comer y presupuesto. Versión Markdown en index.md; versión inglesa en /en/destinations/.', '']
        for p, g in dlinks:
            why = section_text(g.get('guide_html') or '', r'por qu[eé] ir|por qu[eé] visitar')
            lg.append(f"- [{g.get('seo_title') or 'Qué ver en ' + p['n']}]({SITE}/destinos/{p['s']}/) ({p['c']}). Markdown: {SITE}/destinos/{p['s']}/index.md" + (f". English: {SITE}/en/destinations/{en_dest_slug(p['s'])}/" if g.get('guide_html_en') else '') + (f". {why}" if why else ''))
        with open(os.path.join('chollos', 'llms-full.txt'), 'a', encoding='utf-8') as fh:
            fh.write('\n'.join(lg) + '\n')
    except Exception as ex:
        print('llms-full guías', ex)

    # ---------- RSS ----------
    def rfc(s):
        try:
            return datetime.datetime.fromisoformat((s or '').replace('Z', '+00:00')).strftime('%a, %d %b %Y %H:%M:%S +0000')
        except Exception:
            return ''
    rss = ('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Happy Low Cost · Chollos de vuelos</title><link>' + SITE + '/chollos/</link>'
           '<atom:link href="' + SITE + '/chollos/feed.xml" rel="self" type="application/rss+xml"/><description>Chollos de vuelos verificados de todo el mundo</description><language>es-es</language>' +
           ''.join(f'<item><title>{e(x.get("title"))}</title><link>{SITE}/chollos/{x["slug"]}/</link><guid>{SITE}/chollos/{x["slug"]}/</guid><pubDate>{rfc(x.get("approved_at"))}</pubDate><description>{e(x.get("excerpt") or "")}</description></item>' for x in deals[:50]) +
           '</channel></rss>\n')
    open('chollos/feed.xml', 'w', encoding='utf-8').write(rss)

    # ---------- sitemaps ----------
    def u(loc, lm=None):
        return f'<url><loc>{loc}</loc>' + (f'<lastmod>{lm[:10]}</lastmod>' if lm else '') + '</url>'
    lm0 = deals[0]['approved_at'] if deals else today
    urls = [u(f'{SITE}/chollos/', lm0)] + [u(f"{SITE}/chollos/{x['slug']}/", checked(x) or x.get('approved_at')).replace('</url>', (f"<image:image><image:loc>{SITE}/chollos/{x['slug']}/og.jpg</image:loc></image:image>" if os.path.exists(f"chollos/{x['slug']}/og.jpg") else '') + '</url>') for x in deals]
    urls += [u(f'{SITE}/chollos/{k}/', lm0) for k in sorted(gen) if (k.startswith('desde/') and k[6:] in origins) or (k.startswith('a/') and k[2:] in conts)]
    _live = {f'desde/{slugify(x["facts"].get("origen_pais") or "")}/{slugify(x["facts"].get("origen") or "")}' for x in deals} | {f'ideas/{k}' for k, h, n in ideas_links if n}
    urls += [u(f'{SITE}/chollos/{k}/', lm0) for k in sorted(gen) if k in _live]
    open('chollos-sitemap.xml', 'w', encoding='utf-8').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' + ''.join(urls) + '</urlset>\n')
    # con la foto de cada guía (sitemap de imágenes: Google Imágenes y Discover)
    durls = [u(f'{SITE}/destinos/')] + [u(f"{SITE}/destinos/{p['s']}/", g.get('updated_at')).replace('</url>', f"<image:image><image:loc>{SITE}/hlc/img/cities/{p['s']}.jpg</image:loc></image:image></url>") for p, g in dlinks]
    open('destinos-sitemap.xml', 'w', encoding='utf-8').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' + ''.join(durls) + '</urlset>\n')
    si = open('sitemap_index.xml', encoding='utf-8').read()
    for sm in ('chollos-sitemap.xml', 'destinos-sitemap.xml'):
        if sm not in si:
            si = si.replace('</sitemapindex>', f'\t<sitemap>\n\t\t<loc>{SITE}/{sm}</loc>\n\t</sitemap>\n</sitemapindex>')
        # lastmod en el índice: Google y Bing recrawlean antes los sitemaps que cambian
        si = re.sub(rf'(<loc>{re.escape(SITE)}/{re.escape(sm)}</loc>)(\s*<lastmod>[^<]*</lastmod>)?', rf'\1\n\t\t<lastmod>{today}</lastmod>', si)
    open('sitemap_index.xml', 'w', encoding='utf-8').write(si)
    json.dump(sorted(d_ for d_ in os.listdir('chollos') if os.path.isfile(os.path.join('chollos', d_, 'index.html')) and d_ not in ('ver', 'desde', 'a')), open(os.path.join('chollos', 'hechos.json'), 'w'))
    print('deals', len(deals), 'origins', len(origins), 'conts', len(conts), 'guides', len(dlinks))


def CJ_H(city):
    return f"https://www.kqzyfj.com/click-101900924-17288959?sid=happylowcost&url={quote('https://www.booking.com/searchresults.es.html?ss=' + city, safe='')}"


if __name__ == '__main__':
    main()
