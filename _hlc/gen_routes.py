#!/usr/bin/env python3
"""Páginas de rutas "vuelos baratos de X a Y" (ES en /vuelos/<ruta>/ y EN en /en/flights/<ruta>/).
El texto lo escribe la función hlc-routes de Supabase con la API de Claude (créditos de Carlos);
este script solo descarga ese contenido y monta el HTML estático. Ejecutar desde la raíz de la rama pub/happylowcost.com,
después de gen_deals.py y gen_en.py, y antes de `HLC_ONLY=vuelos python3 _hlc/build.py`."""
import io, os, re, sys, json, html, shutil, urllib.request, datetime
from urllib.parse import quote
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_deals as G  # noqa: E402
import gen_en as E  # noqa: E402

SITE = 'https://www.happylowcost.com'
# días de cada guía (los escribe gen_deals): el enlace dice la consulta que la guía ya posiciona, "qué ver en X en 3 días"
try:
    GUIDE_DAYS = json.load(open(os.path.join('destinos', 'dias.json'), encoding='utf-8'))
except Exception:
    GUIDE_DAYS = {}
R8_LOWCOST = ('Ryanair', 'Wizz', 'easyJet', 'Vueling', 'Transavia', 'Norwegian', 'Volotea', 'Jet2', 'Eurowings', 'Pegasus', 'Iberia Express', 'airBaltic', 'Binter')
try:
    R8_COUNTRY = {d_['s']: d_['c'] for d_ in json.load(open(os.path.join('hlc', 'destinos.json'), encoding='utf-8'))}
except Exception:
    R8_COUNTRY = {}
R8_THE = {'United States', 'United Kingdom', 'Netherlands', 'United Arab Emirates', 'Dominican Republic', 'Philippines', 'Maldives', 'Czech Republic', 'Caribbean Netherlands'}
R8_ALIAS = {'Sídney': ('Sydney',), 'Nueva York': ('NYC', 'New York'), 'New York': ('NYC',), 'Las Vegas': ('Vegas',), 'Zúrich': ('Zurich',), 'Dubái': ('Dubai',),
            'Ciudad de México': ('CDMX', 'México DF'), 'Mexico City': ('CDMX',), 'Los Ángeles': ('LA',), 'Los Angeles': ('LA',), 'Marrakech': ('Marrakesh',),
            'Reikiavik': ('Reykjavik',), 'Fráncfort': ('Frankfurt',), 'Múnich': ('Munich', 'München'), 'Cracovia': ('Kraków',), 'Estambul': ('Istanbul',)}
UK_ORIG = {'Londres', 'London', 'Manchester', 'Edimburgo', 'Edinburgh', 'Glasgow', 'Bristol', 'Birmingham', 'Liverpool', 'Leeds', 'Newcastle', 'Belfast'}
try:
    GBP = float(json.load(open(os.path.join('hlc', 'fx.json')))['rates']['GBP'])
except Exception:
    GBP = 0
FEED = 'https://gmdalfsvtfhzepyrdmjj.supabase.co/functions/v1/hlc-routes?action=feed'
# ---- que rutas siguen en el indice de Google ----------------------------------
# Las 3.380 paginas de ruta son el 61% de las impresiones del sitio y el 16% de
# los clics, con posicion media 38-46. Las que no llegan a la posicion 25 y no
# han tenido ni un clic en 28 dias sumaban 56.956 impresiones y cero clics: no
# compiten, solo gastan rastreo. Quedan en noindex, follow (siguen pasando
# enlace a los hubs) y fuera del sitemap.
def _keep_routes():
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'rutas_indexadas.txt')
    try:
        out = set()
        for ln in io.open(p, encoding='utf-8'):
            ln = ln.split('#')[0].split()
            if len(ln) == 2:
                out.add(ln[0] + ' ' + ln[1])
        return out
    except Exception:
        return set()


KEEP_ROUTES = _keep_routes()
MESES = {}            # vuelos/meses.json: mes más barato de cada ruta (lo completa gen_prices)
BY_DEST = {}          # destino -> rutas
INDEXED_SLUGS = {'es': set(), 'en': set()}  # slugs ES de las rutas indexadas en cada idioma
CHEAP_SLUGS = set()   # lo rellena main(): las dos mas baratas por destino y por origen
BY_PAIR = {}          # (origen, destino) -> ruta, para enlazar cada ruta con su inversa


def route_indexed(lang, sl, r):
    if not KEEP_ROUTES:
        return True
    return (lang + ' ' + sl) in KEEP_ROUTES or r['slug'] in CHEAP_SLUGS


def e(x):
    return html.escape(str(x if x is not None else ""))


def cj(aid, url):
    return f'https://www.kqzyfj.com/click-101900924-{aid}?sid=happylowcost-rutas&url={quote(url, safe="")}'


def flight_link(f, locale):
    o, d = f.get('origen_iata'), f.get('destino_iata')
    dep, ret = (f.get('ejemplo_ida') or '')[:10], (f.get('ejemplo_vuelta') or '')[:10]
    u = (f'https://flights.booking.com/flights/{o}.AIRPORT-{d}.AIRPORT/?type=ROUNDTRIP&adults=1&cabinClass=ECONOMY&from={o}.AIRPORT&to={d}.AIRPORT'
         f'&depart={dep}&return={ret}&sort=CHEAPEST&locale={locale}&salesCurrency=EUR')
    return G.BK.fix_flight(cj('17288982', u))


def hotel_link(city, en):
    host = 'searchresults.en-gb.html' if en else 'searchresults.es.html'
    return cj('17288959', f'https://www.booking.com/{host}?ss={city}')


def body(c):
    s = ''.join(f'<h2>{e(x.get("h", ""))}</h2><p>{e(x.get("p", ""))}</p>' for x in c.get('sections', []))
    faq = c.get('faq', [])
    if faq:
        _rt = c.get('_route')  # ronda 10: "Preguntas frecuentes sobre el vuelo X-Y" (antes un H2 genérico igual en 6.000 páginas)
        s += '<h2>' + ((f'Preguntas frecuentes sobre el vuelo {_rt[0]}-{_rt[1]}' if _rt else 'Preguntas frecuentes') if c is not None and c.get('_lang') == 'es' else (f'FAQ: {_rt[0]} to {_rt[1]} flights' if _rt else 'FAQ')) + '</h2>'
        s += ''.join(f'<h3>{e(q.get("q", ""))}</h3><p>{e(q.get("a", ""))}</p>' for q in faq)
    return s


def fdate(iso, en=False):
    try:
        d = datetime.date.fromisoformat(str(iso)[:10])
        m_es = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
        return d.strftime('%-d %b %Y') if en else f'{d.day} {m_es[d.month - 1]} {d.year}'
    except Exception:
        return ''


def ld(c, url, crumbs, checked=None, lang='es'):
    faq = {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q.get('q', ''), "acceptedAnswer": {"@type": "Answer", "text": q.get('a', '')}} for q in c.get('faq', [])]}
    bc = {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, **({"item": SITE + u} if u else {})} for i, (n, u) in enumerate(crumbs)]}
    # fecha real de la consulta de precios: frescura para Google y para los asistentes que citan precios
    wp = {"@type": "WebPage", "@id": url, "url": url, "name": c.get('h1', ''), "inLanguage": "en" if lang == 'en' else "es-ES", "publisher": {"@id": G.ORG_ID},
          "speakable": {"@type": "SpeakableSpecification", "cssSelector": ["h1", ".txt > p:first-child"]}}
    if checked:
        wp["dateModified"] = checked
    return [wp, faq, bc]


def route_links(r, en):
    """Enlaces internos de cada ruta: la inversa y los hubs "a destino" y "desde ciudad"."""
    import en_names
    out = []
    inv = BY_PAIR.get((r['dest'], r['origin']))
    ds, o = r['dest_slug'], r['origin']
    dest = E.NAMES.get(ds, r['dest']) if en else r['dest']
    if inv:
        out.append((f"/en/flights/{en_slug(inv)}/" if en else f"/vuelos/{inv['slug']}/", (f"Return route: {en_names.city_en(inv['origin'])} → {E.NAMES.get(inv['dest_slug'], inv['dest'])}" if en else f"Ruta inversa: {inv['origin']} → {inv['dest']}")))
    hub_to = f"en/flights/to/{G.en_dest_slug(ds)}" if en else f"vuelos/a/{ds}"
    if os.path.isfile(os.path.join(hub_to, 'index.html')):
        out.append((f'/{hub_to}/', (f'Cheap flights to {dest} from every city' if en else f'Vuelos baratos a {dest} desde todas las ciudades')))
    hub_from = f"en/flights/from/{G.slugify(en_names.city_en(o))}" if en else f"vuelos/desde/{G.slugify(o)}"
    if os.path.isfile(os.path.join(hub_from, 'index.html')):
        out.append((f'/{hub_from}/', (f'Cheap flights from {en_names.city_en(o)}' if en else f'Vuelos baratos desde {o}')))
    return out


def en_slug(r):
    """alicante-atenas -> alicante-athens (slug de la página inglesa)"""
    import en_names
    return G.slugify(en_names.city_en(r['origin'])) + '-' + G.en_dest_slug(r['dest_slug'])


try:
    _AP = json.load(open(os.path.join('hlc', 'airports.json'), encoding='utf-8'))
except Exception:
    _AP = {}


def airport_km(a, b):
    import math
    pa, pb = _AP.get((a or '').upper()), _AP.get((b or '').upper())
    if not pa or not pb or a == b:
        return 0
    la1, lo1, la2, lo2 = map(math.radians, (pa[0], pa[1], pb[0], pb[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    km = 2 * 6371 * math.asin(math.sqrt(h))
    return int(round(km / 10.0) * 10) if km >= 50 else 0


def _norm9(t):
    import unicodedata as _u
    return re.sub(r'[^a-z]+', ' ', _u.normalize('NFD', t or '').encode('ascii', 'ignore').decode().lower()).strip()


def no_rail(a, b):
    """Ronda 9: "trains from brussels to bogota" (14 impr. pos. 7,6), "trains from dublin/stockholm to bogota": solo decimos que no hay tren
    cuando la ruta cruza un océano sin duda posible (un extremo en América y el otro no, o un extremo en Oceanía y el otro no)."""
    pa, pb = _AP.get((a or '').upper()), _AP.get((b or '').upper())
    if not pa or not pb:
        return False
    am = lambda p_: p_[1] < -30
    oc = lambda p_: p_[1] > 110 and p_[0] < -10
    return am(pa) != am(pb) or oc(pa) != oc(pb)


def dest_airport(iata, dest, alts=()):
    """Ronda 9: "vuelos sevilla ponta delgada", "vuelos directos bilbao alghero", "cheapest flights from the uk to ponta delgada", "vuelos a callao":
    nombre de la ciudad del aeropuerto cuando no coincide con el destino (islas y regiones)."""
    pa = _AP.get((iata or '').upper())
    if not pa or not pa[2]:
        return ''
    c = _norm9(pa[2])
    if not c or c in _norm9(dest) or _norm9(dest) in c or any(c in _norm9(a_) for a_ in alts):
        return ''
    return pa[2]


def flight_ld(r, f, dest, url, oname=None):
    """Ronda 7 (#78): el vuelo de la ruta como schema Flight con su aerolínea (Airline) y aeropuertos IATA.
    Ronda 10: en inglés, la ciudad de salida en inglés (antes "Bruselas - Buenos Aires" en /en/)."""
    on = oname or r['origin']
    x = {"@type": "Flight", "@id": url + '#flight', "name": f"{on} - {dest}",
         "departureAirport": {"@type": "Airport", "iataCode": r.get('origin_iata'), "name": on},
         "arrivalAirport": {"@type": "Airport", "iataCode": r.get('dest_iata'), "name": dest}}
    if f.get('aerolinea'):
        x["provider"] = {"@type": "Airline", "name": f.get('aerolinea')}
    km = airport_km(r.get('origin_iata'), r.get('dest_iata'))
    if km:
        x["flightDistance"] = f"{int(round(km))} km"
    return x


def page(r, lang, others):
    en = lang == 'en'
    c = dict(r['content'][lang]); c['_lang'] = lang
    # ronda 10: algunas fichas EN venían con la ciudad de salida en español ("Cheap flights Viena to London", "Estocolmo-Nassau", "Singapur-Copenhagen")
    if en:
        _oe = __import__('en_names').city_en(r['origin'])
        _de = E.NAMES.get(r['dest_slug'], r['dest'])
        _subs = [(a_, b_) for a_, b_ in ((r['origin'], _oe), (r['dest'], _de)) if b_ and a_ != b_ and a_.lower() not in b_.lower()]
        if _subs:
            _rx = re.compile(r'(?<![\w-])(' + '|'.join(re.escape(a_) for a_, _ in _subs) + r')(?![\w])')
            _map = dict(_subs)
            def _fix(v):
                if isinstance(v, str):
                    return _rx.sub(lambda m_: _map[m_.group(1)], v)
                if isinstance(v, list):
                    return [_fix(x) for x in v]
                if isinstance(v, dict):
                    return {k: _fix(x) for k, x in v.items()}
                return v
            c = {k: (_fix(v) if k != '_lang' else v) for k, v in c.items()}
    f = dict(r['facts'])
    # fechas de ejemplo ya pasadas: se mueven a las mismas fechas de la semana más adelante, para que los enlaces no abran un buscador vacío
    shifted = False
    try:
        d0_ = datetime.date.fromisoformat((f.get('ejemplo_ida') or '')[:10])
        if d0_ < datetime.date.today() + datetime.timedelta(days=3):
            k_ = ((datetime.date.today() + datetime.timedelta(days=21) - d0_).days + 6) // 7 * 7
            f['ejemplo_ida'] = (d0_ + datetime.timedelta(days=k_)).isoformat()
            if f.get('ejemplo_vuelta'):
                f['ejemplo_vuelta'] = (datetime.date.fromisoformat(f['ejemplo_vuelta'][:10]) + datetime.timedelta(days=k_)).isoformat()
            shifted = True
    except Exception:
        pass
    for k_ in ('h1', 'title'):
        if c.get(k_):
            c[k_] = re.sub(r'(\d)\s?€', '\\1\u00a0€', c[k_])
    slug = r['slug']
    url = f"{SITE}/en/flights/{en_slug(r)}/" if en else f"{SITE}/vuelos/{slug}/"
    es_url, en_url = f"{SITE}/vuelos/{slug}/", f"{SITE}/en/flights/{en_slug(r)}/"
    rob = G.ROBOTS_IDX if route_indexed(lang, en_slug(r) if en else slug, r) else 'noindex, follow'
    ds = r['dest_slug']
    hero = f'/hlc/img/cities/{ds}.jpg'
    dest = E.NAMES.get(ds, r['dest']) if en else r['dest']
    stops = f.get('escalas_ida')
    stops_t = ('Nonstop' if en else 'Directo') if stops == 0 else (f'{stops} stop' + ('s' if stops > 1 else '') if en else f'{stops} escala' + ('s' if stops > 1 else ''))
    when = (f.get('ejemplo_ida') or '')[:10]
    crumbs = [('Home', '/en/'), ('Flights', '/en/flights/'), (c.get('h1', ''), None)] if en else [('Inicio', '/'), ('Vuelos', '/vuelos/'), (c.get('h1', ''), None)]
    alt = (f'<link rel="alternate" hreflang="es" href="{es_url}"><link rel="alternate" hreflang="en" href="{en_url}"><link rel="alternate" hreflang="x-default" href="{es_url}">')
    # ronda 7 (#311): sin hreflang si cualquiera de las dos versiones está en noindex (Google lo ignora y gasta rastreo)
    if not (route_indexed('es', slug, r) and route_indexed('en', en_slug(r), r)):
        alt = ''
    # título con mes y año, y descripción con los datos de la ruta (antes: frases de plantilla iguales en todas)
    p_, med_, air_ = f.get('precio_desde_ida_y_vuelta_eur'), f.get('mediana_ida_y_vuelta_eur'), f.get('aerolinea')
    td = datetime.date.today()
    mes_es = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][td.month - 1]
    mes_en = td.strftime('%B')
    t0 = c.get('title', '')
    # "ida y vuelta" / "return" en el título cuando cabe (la gente busca así y el precio es de ida y vuelta)
    _core0 = re.sub(r'\s*[|·–-]\s*Happy Low Cost\s*$', '', t0).strip()
    if t0 and not re.search(r'20\d\d', t0) and not re.search(r'ida y vuelta|return', _core0, re.I):
        _cand = re.sub(r'(€\s?\d+)', r'\1 return', _core0, count=1) if en else re.sub(r'(\d[\s ]?€)', r'\1 ida y vuelta', _core0, count=1)
        if _cand != _core0 and len(_cand) + 11 <= 60:
            t0 = _cand
    if t0 and not re.search(r'20\d\d', t0) and len(t0) <= 58:
        # "Vuelos baratos Madrid-Roma desde 44 € (nov 2026) · Happy Low Cost": la fecha va con el precio, la marca al final
        core = re.sub(r'\s*[|·–-]\s*Happy Low Cost\s*$', '', t0).strip()
        c['title'] = (f"{core} ({mes_en[:3]} {td.year}) · Happy Low Cost" if en else f"{core} ({mes_es[:3]} {td.year}) · Happy Low Cost") if core != t0 else (f"{t0} ({mes_en[:3]} {td.year})" if en else f"{t0} ({mes_es[:3]} {td.year})")
    # salidas de Reino Unido: el precio también en libras en el título (la gente de allí busca en £; tipo del BCE de hlc/fx.json)
    if en and r['origin'] in UK_ORIG and GBP and c.get('title'):
        _t = re.sub(r'€\s?(\d+)', lambda m_: f'£{int(round(int(m_.group(1)) * GBP))} (€{m_.group(1)})', c['title'], count=1)
        if len(re.sub(r'\s*·\s*Happy Low Cost\s*$', '', _t)) <= 66:
            c['title'] = _t
    if p_:
        if en:
            c['meta'] = (f"✓ Flights {__import__('en_names').city_en(r['origin'])} to {dest} from €{p_} return" + (', nonstop' if stops == 0 else '') + (f' with {air_}' if air_ else '') + '. '
                         + (f"The usual price is about €{med_}. " if med_ and med_ > p_ else '') + f"Cheapest month, price calendar and fares checked on {fdate(f.get('consultado'), True)}.")
        else:
            c['meta'] = (f"✓ Vuelos {r['origin']}-{dest} desde {p_} € ida y vuelta" + (', directo' if stops == 0 else '') + (f' con {air_}' if air_ else '') + '. '
                         + (f"Lo normal son unos {med_} €. " if med_ and med_ > p_ else '') + f"Mes más barato, calendario de precios y tarifas consultadas el {fdate(f.get('consultado'))}.")
    # ---- ronda 8 (GSC 30-oct a 26-nov): aerolínea low cost en el título, país del destino y nombres alternativos ----
    # "vuelos zaragoza praga ryanair" 20 impr. pos. 8, "valencia brujas ryanair", "zaragoza dublín ryanair": la gente busca la ruta con la aerolínea
    # solo con vuelo directo: con escalas Kiwi.com mezcla un primer tramo low cost con otra aerolínea (nota de la ronda 6)
    if air_ and stops == 0 and air_.startswith(R8_LOWCOST) and c.get('title') and air_.split()[0].lower() not in c['title'].lower():
        _br = ' · Happy Low Cost' if c['title'].endswith(' · Happy Low Cost') else ''
        _core = c['title'][:len(c['title']) - len(_br)] if _br else c['title']
        _air1 = air_.split(' (')[0]
        for _base in (_core, re.sub(r' (ida y vuelta|return)(?= \()', '', _core, count=1), re.sub(r' \([A-Za-z]{3} 20\d\d\)$', '', _core)):
            _cand = re.sub(r'^(.*?\S[-–]\S[^0-9€£]*?)\s+(desde|from)\b', lambda m_: f"{m_.group(1)} {'with' if en else 'con'} {_air1} {m_.group(2)}", _base, count=1)
            if _cand != _base and len(_cand) <= 64:
                c['title'] = _cand + (_br if len(_cand) + len(_br) <= 70 else '')
                break
    # "vuelos madrid colombia" 10 impr. pos. 14,8 en /vuelos/madrid-bogota/: el país del destino en la meta y en la respuesta rápida
    _cty = R8_COUNTRY.get(ds, '')
    _cty_t = (__import__('en_names').country_en(_cty) if en else __import__('en_names').COUNTRY_ES_FIX.get(_cty, _cty)) if _cty else ''
    if _cty_t and _cty_t.lower() not in dest.lower() and c.get('meta') and _cty_t not in c['meta']:
        c['meta'] = c['meta'].replace(f' to {dest} from', f' to {dest} ({_cty_t}) from', 1) if en else c['meta'].replace(f'-{dest} desde', f'-{dest} ({_cty_t}) desde', 1)
    # "vuelos de sydney a tokio" en la página ES de Sídney, "flights to orlando from nyc": nombres que también busca la gente
    _seen = (c.get('title', '') + c.get('h1', '')).lower()
    _alts = [(nm_, [a_ for a_ in R8_ALIAS.get(nm_, ()) if a_.lower() not in _seen]) for nm_ in dict.fromkeys([(__import__('en_names').city_en(r['origin']) if en else r['origin']), dest])]
    _alts = [(nm_, al_) for nm_, al_ in _alts if al_]
    # ---- datos propios citables: respuesta rápida, mes más barato, pregunta de vuelo directo ----
    o_name = __import__('en_names').city_en(r['origin']) if en else r['origin']
    best_m = None
    mm_ = (MESES.get(slug) or {}).get('m') or []
    mm_ = [m for m in mm_ if m[0] >= td.strftime('%Y-%m') and m[1]]
    if len(mm_) >= 3:
        best_m = min(mm_, key=lambda m: m[1])
    MES_ES_ = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    bm_txt = ''
    if best_m:
        y_, m_ = int(best_m[0][:4]), int(best_m[0][5:7])
        bm_txt = (f'{datetime.date(y_, m_, 1).strftime("%B")} {y_}' if en else f'{MES_ES_[m_ - 1]} de {y_}')
    pct = int(round((1 - p_ / med_) * 100)) if (p_ and med_ and med_ > p_) else 0
    qa_parts = []
    if p_:
        if en:
            qa_parts.append(f'The cheapest return flight from {o_name} to {dest} we found costs {p_} € (search on {fdate(f.get("consultado"), True)}, Kiwi.com)'
                            + (f', {pct}% below the usual {med_} €.' if pct >= 5 else '.'))
            qa_parts.append((('It is a nonstop flight' if stops == 0 else f'It has {stops_t.lower()}') + (f' with {air_}' if air_ else '') + '.') if stops is not None else '')
            if bm_txt:
                qa_parts.append(f'The cheapest month in the next six is {bm_txt}, at {best_m[1]} €.')
        else:
            qa_parts.append(f'El vuelo de ida y vuelta más barato de {r["origin"]} a {dest} que hemos encontrado cuesta {p_} € (consulta del {fdate(f.get("consultado"))} en Kiwi.com)'
                            + (f', un {pct} % menos que lo habitual ({med_} €).' if pct >= 5 else '.'))
            qa_parts.append((('Es vuelo directo' if stops == 0 else f'Hace {stops_t}') + (f' con {air_}' if air_ else '') + '.') if stops is not None else '')
            if bm_txt:
                qa_parts.append(f'El mes más barato de los próximos seis es {bm_txt}, con {best_m[1]} €.')
    # distancia entre aeropuertos (hlc/airports.json, gran círculo): "distancia bruselas orlando" 13 impr. pos. 15,7 sin respuesta en la página
    km_ = airport_km(r.get('origin_iata'), r.get('dest_iata'))
    if km_:
        kmt = f'{km_:,}'.replace(',', '.') if not en else f'{km_:,}'
        qa_parts.append(f'The distance between the airports ({r["origin_iata"]} and {r["dest_iata"]}) is about {kmt} km in a straight line.' if en else
                        f'La distancia entre los aeropuertos ({r["origin_iata"]} y {r["dest_iata"]}) es de unos {kmt} km en línea recta.')
        if not re.search(r'distan|how far|qu[eé] tan lejos', ' '.join(q.get('q', '') for q in c.get('faq', [])).lower()):
            c['faq'] = list(c.get('faq', [])) + [{
                'q': (f'How far is {dest} from {o_name}?' if en else f'¿Qué distancia hay entre {r["origin"]} y {dest}?'),
                'a': (f'About {kmt} km in a straight line between {r["origin_iata"]} and {r["dest_iata"]} airports.' if en else
                      f'Unos {kmt} km en línea recta entre los aeropuertos de {r["origin_iata"]} y {r["dest_iata"]}.')}]
    if _cty_t and _cty_t.lower() not in dest.lower():
        qa_parts.append(f'{dest} is in {"the " if _cty_t in R8_THE else ""}{_cty_t}.' if en else f'{dest} está en {_cty_t}.')
    # ronda 9: aeropuerto de llegada cuando no se llama como el destino (Azores → Ponta Delgada, Cerdeña → Alghero/Cagliari)
    _apt = dest_airport(r.get('dest_iata'), dest, R8_ALIAS.get(dest, ()))
    if _apt:
        qa_parts.append(f'You fly into {_apt} airport ({r["dest_iata"]}).' if en else f'Se vuela al aeropuerto de {_apt} ({r["dest_iata"]}).')
        if not re.search(r'airport|aeropuerto', ' '.join(q.get('q', '') for q in c.get('faq', [])).lower()):
            c['faq'] = list(c.get('faq', [])) + [{
                'q': (f'Which airport do you fly into for {dest}?' if en else f'¿A qué aeropuerto se vuela para ir a {dest}?'),
                'a': (f'The cheapest flight from {o_name} we found lands at {_apt} ({r["dest_iata"]}).' if en else
                      f'El vuelo más barato desde {r["origin"]} que encontramos llega al aeropuerto de {_apt} ({r["dest_iata"]}).')}]
    # ronda 9: "trains from brussels to bogota": no hay tren cuando la ruta cruza un océano
    if no_rail(r.get('origin_iata'), r.get('dest_iata')) and not re.search(r'\btren|\btrain', ' '.join(q.get('q', '') for q in c.get('faq', [])).lower()):
        c['faq'] = list(c.get('faq', [])) + [{
            'q': (f'Is there a train from {o_name} to {dest}?' if en else f'¿Se puede ir en tren de {r["origin"]} a {dest}?'),
            'a': (f'No. There is an ocean between {o_name} and {dest}' + (f' (about {kmt} km between the airports)' if km_ else '') + ', so the practical way to get there is by plane.' if en else
                  f'No. Entre {r["origin"]} y {dest} hay un océano' + (f' (unos {kmt} km entre los aeropuertos)' if km_ else '') + ', así que la forma práctica de llegar es en avión.')}]
    if _alts:
        qa_parts.append(' '.join((f'{nm_} is also known as {" or ".join(al_)}.' if en else f'{nm_} también se conoce como {" o ".join(al_)}.') for nm_, al_ in _alts))
    # "¿qué aerolíneas vuelan de barcelona a varsovia y cuál ofrece la mejor relación calidad-precio?" 20 impr. pos. 6,6: respuesta con nuestros datos
    _airs = list(dict.fromkeys(a_ for a_ in ((o.get('facts') or {}).get('aerolinea') for o in sorted(BY_DEST.get(ds, []), key=lambda o: o['price_from'])) if a_ and a_ != air_))
    if air_ and not re.search(r'aerol[ií]neas vuelan|which airlines fly', ' '.join(q.get('q', '') for q in c.get('faq', [])).lower()):
        c['faq'] = list(c.get('faq', [])) + [{
            'q': (f'Which airlines fly from {o_name} to {dest}, and which is cheapest?' if en else f'¿Qué aerolíneas vuelan de {r["origin"]} a {dest} y cuál es la más barata?'),
            'a': ((f'In our search of {fdate(f.get("consultado"), True)} the cheapest fare was with {air_}' + (' (nonstop)' if stops == 0 else '') + (f', from {p_} € return' if p_ else '') + '.'
                   + (f' On the other routes to {dest} we track, the cheapest fares were with {", ".join(_airs[:4])} (cheapest first).' if _airs else '') + ' Fares change daily: check the dates in the calendar below.') if en else
                  (f'En nuestra consulta del {fdate(f.get("consultado"))} la tarifa más barata era con {air_}' + (' (vuelo directo)' if stops == 0 else '') + (f', desde {p_} € ida y vuelta' if p_ else '') + '.'
                   + (f' En las otras rutas a {dest} que vigilamos, las tarifas más baratas eran con {", ".join(_airs[:4])} (de más barata a más cara).' if _airs else '') + ' Los precios cambian cada día: mira las fechas en el calendario de abajo.'))}]
    quick = ' '.join(x for x in qa_parts if x)
    # cuándo comprar, con nuestros propios datos: semanas entre la consulta y la salida del precio más barato (ruta y media del destino)
    def _lead(fx):
        try:
            return (datetime.date.fromisoformat((fx.get('ejemplo_ida') or '')[:10]) - datetime.date.fromisoformat((fx.get('consultado') or '')[:10])).days
        except Exception:
            return None
    lead_d = _lead(r['facts'])
    leads_ = sorted(x for x in (_lead(o['facts']) for o in BY_DEST.get(ds, [])) if x is not None and x > 0)
    lead_html = ''
    if lead_d and lead_d > 0:
        wk = max(1, round(lead_d / 7))
        med_l = round(leads_[len(leads_) // 2] / 7) if len(leads_) >= 3 else None
        if en:
            lead_txt = (f'When to book: the cheapest fare on this route was for a departure {wk} week{"s" if wk != 1 else ""} after our search ({fdate(r["facts"].get("consultado"), True)}).'
                        + (f' Across the {len(leads_)} routes to {dest} we track, the cheapest fare leaves on average {med_l} weeks after the search.' if med_l else ''))
        else:
            lead_txt = (f'Cuándo comprar: el precio más barato de esta ruta era para salir {wk} semana{"s" if wk != 1 else ""} después de nuestra consulta ({fdate(r["facts"].get("consultado"))}).'
                        + (f' En las {len(leads_)} rutas a {dest} que seguimos, el más barato sale de media {med_l} semanas después de la consulta.' if med_l else ''))
        lead_html = f'<p class="lead-t">{e(lead_txt)}</p>'
        if not re.search(r'antelaci|in advance|how far ahead|when to book|cu[aá]ndo comprar', have_q_pre := ' '.join(q.get('q', '') for q in c.get('faq', [])).lower()):
            c['faq'] = list(c.get('faq', [])) + [{
                'q': (f'How far in advance should I book flights from {o_name} to {dest}?' if en else f'¿Con cuánta antelación conviene comprar el vuelo de {r["origin"]} a {dest}?'),
                'a': (f'In our data the cheapest fare was for a departure about {wk} weeks after the search' + (f', and across all routes to {dest} the average is {med_l} weeks' if med_l else '') + '. Set a free alert to catch drops.' if en else
                      f'En nuestros datos, el precio más barato era para salir unas {wk} semanas después de la consulta' + (f', y en todas las rutas a {dest} la media es de {med_l} semanas' if med_l else '') + '. Crea una alerta gratis para enterarte si baja.')}]
    # enlace al hub del destino con la consulta que trae visitas ("flight deals to X" / "vuelos baratos a X")
    hub_html = ''
    n_hub = len(BY_DEST.get(ds, []))
    if n_hub >= 3:
        lo_hub = min(o['price_from'] for o in BY_DEST[ds])
        hub_html = (f'<p class="hub-t">{"More" if en else "Más"}: <a href="/en/flights/to/{G.en_dest_slug(ds)}/">{e(f"Flight deals to {dest}: {n_hub} cities from €{lo_hub}")}</a></p>' if en else
                    f'<p class="hub-t">Más: <a href="/vuelos/a/{ds}/">{e(f"Vuelos baratos a {dest}: {n_hub} ciudades desde {lo_hub} €")}</a></p>')
    have_q = ' '.join(q.get('q', '') for q in c.get('faq', [])).lower()
    if stops is not None and not re.search(r'direct', have_q):
        c['faq'] = list(c.get('faq', [])) + [{
            'q': (f'Are there direct flights from {o_name} to {dest}?' if en else f'¿Hay vuelos directos de {r["origin"]} a {dest}?'),
            'a': ((f'Yes: the cheapest option we found on {fdate(f.get("consultado"), True)} was a nonstop flight' + (f' with {air_}' if air_ else '') + '.') if stops == 0 else
                  (f'The cheapest option we found on {fdate(f.get("consultado"), True)} had {stops_t.lower()}' + (f' ({air_})' if air_ else '') + '. A direct flight may exist but costs more.')) if en else
                 ((f'Sí: la opción más barata que encontramos el {fdate(f.get("consultado"))} era un vuelo directo' + (f' con {air_}' if air_ else '') + '.') if stops == 0 else
                  (f'La opción más barata que encontramos el {fdate(f.get("consultado"))} hacía {stops_t}' + (f' ({air_})' if air_ else '') + '. Puede haber vuelo directo, pero más caro.'))}]
    if bm_txt and not re.search(r'mes más barato|cheapest month', have_q):
        c['faq'] = list(c.get('faq', [])) + [{
            'q': (f'What is the cheapest month to fly from {o_name} to {dest}?' if en else f'¿Cuál es el mes más barato para volar de {r["origin"]} a {dest}?'),
            'a': (f'In our price calendar the cheapest month in the next six is {bm_txt}, with a return flight from {best_m[1]} €.' if en else
                  f'En nuestro calendario de precios, el mes más barato de los próximos seis es {bm_txt}, con vuelo de ida y vuelta desde {best_m[1]} €.')}]
    # ronda 10: "hotels in buenos aires for a trip from brussels" (22 impr. pos. 9), "hotels in bogota for a trip from stockholm" (pos. 4,9):
    # pregunta con los 3 hoteles de top3hotels.com (nota real de huéspedes y precio por noche) y título de la sección de hoteles con la ciudad de salida
    _ll = G.dest_ll({"destino": r["dest"], "destino_iata": r["dest_iata"]})
    _hq = G.T3.hotel_faq(dest, *_ll, lang=lang, trip_from=o_name)
    if _hq and not re.search(r'hotel|dormir|alojar', ' '.join(q.get('q', '') for q in c.get('faq', [])).lower()):
        c['faq'] = list(c.get('faq', [])) + [{'q': _hq[0], 'a': _hq[1]}]
    c['_route'] = (e(o_name), e(dest))
    chk_ = (f.get('consultado') or '')[:10]
    mt_ = f'<meta property="article:modified_time" content="{e(chk_)}">' if chk_ else ''
    # foto de cabecera: precarga (LCP) y versión de 800 px en móvil
    has800 = os.path.exists(f'hlc/img/cities/{ds}-800.jpg')
    if has800:
        mt_ += (f'<link rel="preload" as="image" href="/hlc/img/cities/{ds}-800.jpg" media="(max-width: 800px)" fetchpriority="high">'
                f'<link rel="preload" as="image" href="{hero}" media="(min-width: 801px)" fetchpriority="high">'
                f'<style>@media (max-width:800px){{.deal-hero{{background-image:url(/hlc/img/cities/{ds}-800.jpg)!important}}}}</style>')
    else:
        mt_ += f'<link rel="preload" as="image" href="{hero}" fetchpriority="high">'
    mt_ += '<link rel="alternate" type="text/markdown" href="' + ('/en/flights/routes.md' if en else '/vuelos/rutas.md') + '" title="Markdown">'
    if en:
        h = E.head(c.get('title', ''), c.get('meta', ''), url, es_url, og_image=f'{SITE}{hero}', ld=ld(c, url, crumbs, chk_, 'en') + [G.guide_image_ld(ds, dest, 'en'), flight_ld(r, f, dest, url, o_name)], robots=rob, body_class='deal', extra_head=mt_, og_alt=f'Photo of {dest}')
        if not alt:
            h = re.sub(r'<link rel="alternate" hreflang="[^"]+" href="[^"]+">', '', h)
    else:
        h = G.head(title=e(c.get('title', '')), desc=e(c.get('meta', '')), canonical=url, og_image=f'{SITE}{hero}', og_type='article', robots=rob, og_alt=e(f'Foto de {dest}'),
                   extra_head='<link rel="stylesheet" href="/hlc/home.css?v=12">' + mt_ + alt + G.ld_script(ld(c, url, crumbs, chk_, 'es') + [G.guide_image_ld(ds, dest, 'es'), flight_ld(r, f, dest, url)]), body_class='deal')
    rel = ''.join(f'<a class="hub-l" href="{"/en/flights/" + en_slug(o) if en else "/vuelos/" + o["slug"]}/">{e(__import__('en_names').city_en(o["origin"]) if en else o["origin"])} → {e(E.NAMES.get(o["dest_slug"], o["dest"]) if en else o["dest"])} · {o["price_from"]} €</a>' for o in others[:12])
    L = (lambda es_, en_: en_ if en else es_)
    gpath = f"en/destinations/{G.en_dest_slug(ds)}" if en else f"destinos/{ds}"
    nd_g = GUIDE_DAYS.get(ds) or 0
    g_txt = L("Qué ver en " + dest + (f" en {nd_g} días" if nd_g else ""), dest + (f" itinerary: {nd_g} days" if nd_g else " itinerary"))
    guide_btn = f'<a class="hlc-btn o" href="/{gpath}/">📖 {e(g_txt)}</a>' if os.path.isfile(os.path.join(gpath, 'index.html')) else ''
    r_o = r['origin']
    # otras ciudades al mismo destino (solo rutas indexadas) y, si esta ruta no está en el índice, la ruta indexada más barata al mismo destino
    sib = sorted([o for o in BY_DEST.get(ds, []) if o['slug'] != slug and o['slug'] in INDEXED_SLUGS[lang]], key=lambda o: o['price_from'])
    href_ = (lambda o: f"/en/flights/{en_slug(o)}/" if en else f"/vuelos/{o['slug']}/")
    oname_ = (lambda o: __import__('en_names').city_en(o['origin']) if en else o['origin'])
    oc_html = (f'<section class="hub"><h2>{e(L("Vuelos baratos a " + dest + " desde otras ciudades", "Flight deals to " + dest + " from other cities"))}</h2><div class="hub-g">'
               + ''.join(f'<a class="hub-l" href="{href_(o)}">{e(oname_(o))} → {e(dest)} · {o["price_from"]} €</a>' for o in sib[:6]) + '</div></section>') if sib else ''
    best_idx = ''
    if sib and slug not in INDEXED_SLUGS[lang]:
        b0 = sib[0]
        best_idx = f'<a class="hlc-btn o" href="{href_(b0)}">{e(L("Más barato a " + dest + ": ", "Cheapest to " + dest + ": "))}{e(oname_(b0))} → {e(dest)} · {b0["price_from"]} €</a>'
    out = h + f'''<main>
<section class="deal-hero" style="background-image:url({hero})"{G.photos_attr(ds)}><div class="wrap">
<div class="kicker" style="color:#FFC531" data-checked="{e((f.get("consultado") or "")[:10])}">{L("✓ Precios reales consultados el", "✓ Real prices checked on")} {e(fdate(f.get("consultado"), en))}</div>
<h1>{e(c.get("h1", ""))}</h1>
<div class="deal-cta"><a class="price-tag" href="{e(flight_link(f, "en-gb" if en else "es"))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="ruta_precio">{e(f.get("precio_desde_ida_y_vuelta_eur"))} € <small>{L("ida y vuelta", "return")}</small></a><span class="price-was">{L("Lo normal", "Typical price")}: {e(f.get("mediana_ida_y_vuelta_eur"))} €</span><a class="hlc-btn" href="{e(flight_link(f, "en-gb" if en else "es"))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="ruta_vuelo" style="min-height:56px;font-size:17px">{L("Ver vuelos y fechas ✈️", "See flights and dates ✈️")}</a></div>
</div></section>
<div class="wrap"><div class="deal-body">
<article class="txt"><h2 class="qa-h">{e(L(f"Vuelo {r_o} {dest}: precio de hoy", f"{o_name} to {dest} flights: today's price"))}</h2>{f'<p class="qa" style="background:#FFF6E0;border-left:4px solid #FFC531;padding:12px 14px;border-radius:10px"><b>{L("Respuesta rápida:", "Quick answer:")}</b> {e(quick)}</p>' if quick else ''}{hub_html}{lead_html}<p><strong>{e(c.get("intro", ""))}</strong></p>{body(c)}
<p class="credit">{L("Foto: Wikimedia Commons. Precios de ida y vuelta en clase turista para 1 adulto, consultados en Kiwi.com en la fecha indicada; pueden cambiar.", "Photo: Wikimedia Commons. Return economy fares for 1 adult, checked on Kiwi.com on the date shown; they can change.")}</p></article>
<aside class="deal-card">
<div class="facts">
<div><small>{L("Desde", "From")}</small><b>{e(o_name)} (<abbr title="{L("Código IATA del aeropuerto de", "IATA airport code of")} {e(o_name)}">{e(r["origin_iata"])}</abbr>)</b></div><div><small>{L("Hasta", "To")}</small><b>{e(dest)} (<abbr title="{L("Código IATA del aeropuerto de", "IATA airport code of")} {e(dest)}">{e(r["dest_iata"])}</abbr>)</b></div>
<div><small>{L("Precio desde", "Price from")}</small><b>{e(f.get("precio_desde_ida_y_vuelta_eur"))} €</b></div><div><small>{L("Lo normal", "Typical")}</small><b>{e(f.get("mediana_ida_y_vuelta_eur"))} €</b></div>
<div><small>{L("Aerolínea", "Airline")}</small><b>{e(f.get("aerolinea") or L("Varias", "Several"))}</b></div><div><small>{L("Escalas", "Stops")}</small><b>{e(stops_t)}</b></div>
</div>
<p class="src" style="font:12px/1.45 Inter,sans-serif;color:#4A5468;margin:6px 0 10px">{L("Fuente: Happy Low Cost (happylowcost.com), precios consultados en Kiwi.com el", "Source: Happy Low Cost (happylowcost.com), fares checked on Kiwi.com on")} {e(fdate(f.get("consultado"), en))}.</p>
{best_idx}
<a class="hlc-btn" href="{e(flight_link(f, "en-gb" if en else "es"))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="ruta_vuelo" style="min-height:56px;font-size:17px">{L("Ver vuelos desde", "Flights from")} {e(f.get("precio_desde_ida_y_vuelta_eur"))} €</a>
<a class="hlc-btn t" href="{e(G.BK.with_dates(hotel_link(r["dest"], en), f.get("ejemplo_ida"), f.get("ejemplo_vuelta")))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="ruta_hotel" data-tvcity="{e(dest)}">🏨 {L("Hoteles en", "Hotels in")} {e(dest)}</a>
<a class="hlc-btn g" href="{e(G.BK.gyg(dest, "en" if en else "es", f.get("ejemplo_ida"), f.get("ejemplo_vuelta"), "happylowcost-rutas"))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="ruta_gyg">🎟️ {L("Qué hacer en", "Things to do in")} {e(dest)}</a>
<a class="hlc-btn o" href="{e(G.BK.gyg_transfer(dest, "en" if en else "es", f.get("ejemplo_ida")))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="ruta_traslado">🚕 {L("Traslado del aeropuerto", "Airport transfer")}</a>
<a class="hlc-btn o" href="{e(G.BK.dc("en" if en else "es", "happylowcost-rutas"))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="ruta_coche">🚗 {L("Alquiler de coche en", "Car hire in")} {e(dest)}</a>
{"" if en else f'<a class="hlc-btn s" href="/alertas/?d={quote(r["dest"])}">🔔 Avísame si baja de precio</a>'}
{guide_btn}
{"" if shifted else f'<div style="font:13px/1.5 Inter,sans-serif;color:#4A5468">{L("Ejemplo de fechas encontradas", "Example dates found")}: {e(fdate(when, en))}</div>'}
</aside>
</div>
<section class="sec rcal" id="calendario" data-route-cal data-slug="{e(slug)}" data-o="{e(r["origin_iata"])}" data-d="{e(r["dest_iata"])}"><div class="sec-h"><div><div class="kicker">{L("Calendario de precios", "Price calendar")}</div><h2>{e(L(f"Vuelos de {r_o} a {dest}: el mes más barato", f"Flights from {o_name} to {dest}: the cheapest month"))}</h2><p>{L("Vuelo de ida y vuelta más barato que encontramos en cada mes, consultado en Kiwi.com (se actualiza cada 3 días). Toca un mes para ver esas fechas.", "Cheapest return flight we found in each month, checked on Kiwi.com (refreshed every 3 days). Tap a month to see those dates.")}</p>{f'<p><strong>{e(L(f"Según nuestros datos, el mes más barato para volar de {r_o} a {dest} es {bm_txt}, con {best_m[1]} € ida y vuelta.", f"According to our data, the cheapest month to fly from {o_name} to {dest} is {bm_txt}, at {best_m[1]} € return."))}</strong></p>' if bm_txt else ''}</div></div><div class="rcal-bars" data-rcal-bars><div class="dc-empty"><b>{L("Consultando precios…", "Checking prices…")}</b></div></div><div data-rcal-hist></div></section>
{G.T3.block(dest, *_ll, lang="en" if en else "es", checkin=f.get("ejemplo_ida"), checkout=f.get("ejemplo_vuelta"), trip_from=o_name)}
{(lambda rl: f'<section class="hub"><h2>{L("Seguir buscando", "Keep looking")}</h2><div class="hub-g">' + ''.join(f'<a class="hub-l" href="{u_}">{e(t_)}</a>' for u_, t_ in rl) + '</div></section>' if rl else '')(route_links(r, en))}
{oc_html}
{f'<section class="hub"><h2>{L("Más rutas baratas", "More cheap routes")}</h2><div class="hub-g">{rel}</div></section>' if rel else ''}
</div></main>{E.FOOTER if en else ""}</body></html>'''
    return G.hero_img(out)


def search_form(rows, en):
    """Buscador de rutas: origen + destino + mes. Va a la página de la ruta si existe; si no, a los chollos filtrados."""
    import en_names
    origins = sorted({r['origin'] for r in rows})
    dests = sorted({(E.NAMES.get(r['dest_slug'], r['dest']) if en else r['dest']) for r in rows})
    MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] if en else ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    import datetime
    t = datetime.date.today().replace(day=1)
    months = []
    for i in range(12):
        y, m = t.year + (t.month - 1 + i) // 12, (t.month - 1 + i) % 12 + 1
        months.append((f'{y}-{m:02d}', f'{MON[m - 1]} {y}'))
    L = (lambda a, b: b if en else a)
    oo = ''.join(f'<option value="{e(o)}">{e(en_names.city_en(o) if en else o)}</option>' for o in origins)
    dd = ''.join(f'<option value="{e(d)}"></option>' for d in dests)
    mm = ''.join(f'<option value="{k}">{v}</option>' for k, v in months)
    return f'''<form class="xf open" data-route-search style="margin-bottom:26px" role="search" aria-label="{L("Buscar ruta", "Search a route")}">
<div class="xf-row">
<label class="xf-sel"><span>{L("Desde", "From")}</span><select name="o" aria-label="{L("Aeropuerto de salida", "Departure airport")}">{oo}</select></label>
<label class="xf-search"><span aria-hidden="true">✈️</span><input name="d" list="rs-dests" placeholder="{L("¿A dónde? Roma, Tokio, Nueva York…", "Where to? Rome, Tokyo, New York…")}" aria-label="{L("Destino", "Destination")}" autocomplete="off" required></label>
<datalist id="rs-dests">{dd}</datalist>
<label class="xf-sel"><span>{L("Mes", "Month")}</span><select name="m" aria-label="{L("Mes del viaje", "Travel month")}"><option value="">{L("Cualquier fecha", "Any date")}</option>{mm}</select></label>
<button type="submit" class="hlc-btn">{L("Buscar", "Search")}</button>
</div><div data-rs-msg role="status" aria-live="polite" style="font:14px Inter,sans-serif;color:#4A5468;margin-top:8px"></div></form>
<script>
(function(){{var f=document.querySelector('[data-route-search]');if(!f)return;var EN={'true' if en else 'false'};
var sl=function(s){{return String(s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}};
try{{var o=localStorage.getItem('hlc_origin');if(o)for(var i=0;i<f.o.options.length;i++)if(f.o.options[i].value===o||f.o.options[i].text===o){{f.o.selectedIndex=i;break;}}}}catch(e){{}}
var IDX=null;fetch('/vuelos/rutas-idx.json').then(function(r){{return r.json();}}).then(function(j){{IDX=j;}}).catch(function(){{IDX=[];}});
f.addEventListener('submit',function(ev){{ev.preventDefault();var o=f.o.value,d=sl(f.d.value),m=f.m.value;if(!d)return;
var hit=(IDX||[]).filter(function(r){{return r[2]===o&&(sl(r[3])===d||sl(r[4])===d||r[5]===d);}})[0];
if(hit){{location.href=(EN?'/en/flights/'+hit[1]:'/vuelos/'+hit[0])+'/'+(m?'?mes='+m:'');return;}}
location.href=(EN?'/en/deals/':'/chollos/')+'?q='+encodeURIComponent(d)+(m?'&mes='+m:'');}});}})();
</script>'''


def hub(rows, en):
    by = {}
    # ronda 7 (#224): las listas y el ItemList solo con rutas indexadas (el HTML pesaba 260 KB); el buscador sigue con todas
    idx = [r for r in rows if route_indexed('en' if en else 'es', en_slug(r) if en else r['slug'], r)] or rows
    for r in idx:
        by.setdefault(r['origin'], []).append(r)
    base = '/en/flights/' if en else '/vuelos/'
    secs = ''.join(f'<details class="hub"{" open" if n_ < 2 else ""}><summary><h2 style="all:unset">{"Cheap flights from" if en else "Vuelos baratos desde"} {e(o)}</h2><small>{len(lst)} {"routes" if en else "rutas"} · {"from" if en else "desde"} {min(x["price_from"] for x in lst)} €</small></summary><div class="hub-g">' + ''.join(
        f'<a class="hub-l" href="{base}{en_slug(r) if en else r["slug"]}/">{e(E.NAMES.get(r["dest_slug"], r["dest"]) if en else r["dest"])} · {r["price_from"]} €</a>' for r in sorted(lst, key=lambda x: x['price_from'])) + '</div></details>' for n_, (o, lst) in enumerate(sorted(by.items(), key=lambda kv: -len(kv[1]))))
    title = 'Cheap flights: every route with real prices · Happy Low Cost' if en else 'Vuelos baratos: todas las rutas con precios reales · Happy Low Cost'
    desc = (f'{len(rows)} routes with real return prices, airlines and the best time to fly.' if en
            else f'{len(rows)} rutas con precios reales de ida y vuelta, aerolíneas y mejor época para volar.')
    if en:
        h = E.head(title, desc, SITE + base, SITE + '/vuelos/', body_class='chollos', extra_head='<link rel="alternate" type="application/json" href="/en/flights/feed.json" title="Routes JSON"><link rel="alternate" type="text/markdown" href="/en/flights/routes.md" title="Markdown">')
    else:
        il = {"@type": "ItemList", "name": title, "numberOfItems": len(idx), "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": f"{SITE}/vuelos/{r['slug']}/", "name": f"{r['origin']} → {r['dest']}"} for i, r in enumerate(sorted(idx, key=lambda x: x['price_from'])[:100])]}
        h = G.head(title=e(title), desc=e(desc), canonical=SITE + base, og_image=f'{SITE}/hlc/brand/og-default.jpg', og_type='website',
                   extra_head=f'<link rel="stylesheet" href="/hlc/home.css?v=12"><link rel="alternate" type="application/json" href="/vuelos/feed.json" title="Rutas JSON"><link rel="alternate" type="text/markdown" href="/vuelos/rutas.md" title="Markdown"><link rel="alternate" hreflang="es" href="{SITE}/vuelos/"><link rel="alternate" hreflang="en" href="{SITE}/en/flights/">' + G.ld_script([il]), body_class='chollos')
    return h + f'''<main class="sec" style="padding-top:26px"><div class="wrap">
<div class="sec-h"><div><div class="kicker">{"Real prices, checked on Kiwi.com" if en else "Precios reales, consultados en Kiwi.com"}</div><h1 class="x-h1">{"Cheap flights, route by route" if en else "Vuelos baratos, ruta a ruta"}</h1><p>{e(desc)}</p></div></div>
{search_form(rows, en)}
{secs}
</div></main>{E.FOOTER if en else ""}</body></html>'''


def write_md_and_feeds(rows):
    """Datos de las rutas indexadas para asistentes de IA: un Markdown y un JSON por idioma
    (un fichero por idioma y no uno por ruta: Cloudflare Pages tiene un límite de 20.000 ficheros)."""
    import en_names
    now = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%MZ')
    for lang in ('es', 'en'):
        en = lang == 'en'
        sel = sorted([r for r in rows if r['slug'] in INDEXED_SLUGS[lang]], key=lambda r: (r['origin'], r['price_from']))
        items, md = [], []
        for r in sel:
            f = r.get('facts') or {}
            dest = E.NAMES.get(r['dest_slug'], r['dest']) if en else r['dest']
            org = en_names.city_en(r['origin']) if en else r['origin']
            url = f"{SITE}/en/flights/{en_slug(r)}/" if en else f"{SITE}/vuelos/{r['slug']}/"
            bm = None
            mm = [m for m in ((MESES.get(r['slug']) or {}).get('m') or []) if m[1]]
            if len(mm) >= 3:
                bm = min(mm, key=lambda m: m[1])
            it = {"origin": org, "origin_iata": r.get('origin_iata'), "destination": dest, "destination_iata": r.get('dest_iata'), "country": r.get('country'),
                  "price_from_eur_return": r['price_from'], "usual_price_eur_return": f.get('mediana_ida_y_vuelta_eur'), "stops_cheapest": f.get('escalas_ida'),
                  "airline_cheapest": f.get('aerolinea'), "checked_on": (f.get('consultado') or '')[:10], "cheapest_month": bm[0] if bm else None,
                  "cheapest_month_price_eur": bm[1] if bm else None, "url": url}
            # ronda 9: aeropuerto de llegada cuando no se llama como el destino (Azores → Ponta Delgada) y distancia entre aeropuertos
            _ap = dest_airport(r.get('dest_iata'), dest, R8_ALIAS.get(dest, ()))
            if _ap:
                it["destination_airport_city"] = _ap
            _km = airport_km(r.get('origin_iata'), r.get('dest_iata'))
            if _km:
                it["distance_km"] = _km
            items.append(it)
            st = f.get('escalas_ida')
            st_t = ('' if st is None else (('nonstop' if st == 0 else f'{st} stop(s)') if en else ('directo' if st == 0 else f'{st} escala(s)')))
            if en:
                md.append(f"- [{org} → {dest}]({url}): from {r['price_from']} € return" + (f", usual {f.get('mediana_ida_y_vuelta_eur')} €" if f.get('mediana_ida_y_vuelta_eur') else '')
                          + (f", {st_t}" if st_t else '') + (f", {f.get('aerolinea')}" if f.get('aerolinea') else '') + (f", cheapest month {bm[0]} ({bm[1]} €)" if bm else '') + (f", airport {_ap}" if _ap else '') + (f", {_km:,} km" if _km else '') + f", checked {it['checked_on']}")
            else:
                md.append(f"- [{org} → {dest}]({url}): desde {r['price_from']} € ida y vuelta" + (f", lo habitual {f.get('mediana_ida_y_vuelta_eur')} €" if f.get('mediana_ida_y_vuelta_eur') else '')
                          + (f", {st_t}" if st_t else '') + (f", {f.get('aerolinea')}" if f.get('aerolinea') else '') + (f", mes más barato {bm[0]} ({bm[1]} €)" if bm else '') + (f", aeropuerto de {_ap}" if _ap else '') + (f", {_km:,} km".replace(',', '.') if _km else '') + f", consultado el {it['checked_on']}")
        lic = "https://creativecommons.org/licenses/by/4.0/"
        feed = {"name": "Happy Low Cost flight routes" if en else "Rutas de vuelos de Happy Low Cost", "publisher": "Happy Low Cost", "home": SITE + ('/en/flights/' if en else '/vuelos/'),
                "license": lic, "attribution": "Happy Low Cost (happylowcost.com)", "generated": now,
                "note": ("Return economy fares for 1 adult, checked on Kiwi.com. usual_price is the median of the prices we saw. Prices change every day." if en else
                         "Precios de ida y vuelta en turista para 1 adulto, consultados en Kiwi.com. usual_price es la mediana de los precios que vimos. Cambian cada día."),
                "count": len(items), "routes": items}
        base = 'en/flights' if en else 'vuelos'
        json.dump(feed, open(f'{base}/feed.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        if en:
            head_ = (f"# Happy Low Cost: cheap flight routes with real prices\n\n> {len(items)} routes. Return economy fares for 1 adult, checked on Kiwi.com; \"usual\" is the median of the prices we saw. "
                     f"Generated {now}. Licence CC BY 4.0: cite \"Happy Low Cost (happylowcost.com)\". JSON: {SITE}/en/flights/feed.json\n\n")
        else:
            head_ = (f"# Happy Low Cost: rutas de vuelos baratos con precios reales\n\n> {len(items)} rutas. Precios de ida y vuelta en turista para 1 adulto, consultados en Kiwi.com; \"lo habitual\" es la mediana de los precios que vimos. "
                     f"Generado {now}. Licencia CC BY 4.0: cita \"Happy Low Cost (happylowcost.com)\". JSON: {SITE}/vuelos/feed.json\n\n")
        open(f'{base}/' + ('routes.md' if en else 'rutas.md'), 'w', encoding='utf-8').write(head_ + '\n'.join(md) + '\n')
        # llms-full: las rutas indexadas con su fecha de consulta en texto plano (los asistentes citan precio y fecha)
        lf_p = 'en/llms-full.txt' if en else os.path.join('chollos', 'llms-full.txt')
        if os.path.isfile(lf_p):
            t_ = re.sub(r'\n?<!-- rutas -->.*?<!-- /rutas -->\n?', '\n', open(lf_p, encoding='utf-8').read(), flags=re.S).rstrip('\n')
            sec_ = ((f"## Flight routes with real prices ({len(items)} routes, fares checked on Kiwi.com on the date shown)" if en else
                     f"## Rutas de vuelos con precios reales ({len(items)} rutas, consultadas en Kiwi.com en la fecha indicada)") + '\n\n' + '\n'.join(md))
            open(lf_p, 'w', encoding='utf-8').write(t_ + '\n\n<!-- rutas -->\n' + sec_ + '\n<!-- /rutas -->\n')


def main():
    rows, raw, off = [], b'', 0
    while True:
        chunk = urllib.request.urlopen(urllib.request.Request(f'{FEED}&offset={off}', headers={'User-Agent': 'hlc-build'}), timeout=90).read()
        part = json.loads(chunk)
        raw += chunk
        rows += part
        if len(part) < 500:
            break
        off += 500
    rows = [r for r in rows if r.get('content') and r['content'].get('es') and r['content'].get('en') and os.path.exists(f"hlc/img/cities/{r['dest_slug']}.jpg")]
    by_dest, by_orig = {}, {}
    for r in rows:
        by_dest.setdefault(r['dest_slug'], []).append(r)
        by_orig.setdefault(r['origin'], []).append(r)
    # una ruta nueva, aunque Search Console no la conozca todavia, se indexa si es
    # una de las dos mas baratas a su destino o desde su ciudad: ahi si aporta algo
    # que no esta en otra pagina.
    for r in rows:
        BY_PAIR[(r['origin'], r['dest'])] = r
    BY_DEST.update(by_dest)
    try:
        MESES.update(json.load(open('vuelos/meses.json', encoding='utf-8')))
    except Exception:
        pass
    for _l in list(by_dest.values()) + list(by_orig.values()):
        for _r in sorted(_l, key=lambda x: x['price_from'])[:2]:
            CHEAP_SLUGS.add(_r['slug'])
    for r in rows:
        if route_indexed('es', r['slug'], r):
            INDEXED_SLUGS['es'].add(r['slug'])
        if route_indexed('en', en_slug(r), r):
            INDEXED_SLUGS['en'].add(r['slug'])
    urls_es, urls_en = [f'{SITE}/vuelos/'], [f'{SITE}/en/flights/']
    moved = {}
    for r in rows:
        others = [o for o in by_dest[r['dest_slug']] if o['slug'] != r['slug']] + [o for o in sorted(by_orig[r['origin']], key=lambda x: x['price_from']) if o['slug'] != r['slug']]
        for lang, base, urls in (('es', 'vuelos', urls_es), ('en', 'en/flights', urls_en)):
            sl = en_slug(r) if lang == 'en' else r['slug']
            d = os.path.join(base, sl)
            os.makedirs(d, exist_ok=True)
            open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(page(r, lang, others))
            if route_indexed(lang, sl, r):
                urls.append((f"{SITE}/{base}/{sl}/", ((r.get('facts') or {}).get('consultado') or '')[:10], r['dest_slug']))
            if lang == 'en' and sl != r['slug']:
                moved[f"/en/flights/{r['slug']}/"] = f"/en/flights/{sl}/"
                if os.path.isdir(os.path.join(base, r['slug'])):
                    shutil.rmtree(os.path.join(base, r['slug']))
    for base, en in (('vuelos', False), ('en/flights', True)):
        os.makedirs(base, exist_ok=True)
        open(os.path.join(base, 'index.html'), 'w', encoding='utf-8').write(hub(rows, en))
    import gen_prices
    pu_es, pu_en = gen_prices.build(rows, en_slug)
    urls_es += pu_es
    urls_en += pu_en
    json.dump({r['slug']: r['price_from'] for r in rows}, open('vuelos/rutas.json', 'w'), separators=(',', ':'))
    import en_names
    json.dump([[r['slug'], en_slug(r), r['origin'], r['dest'], E.NAMES.get(r['dest_slug'], r['dest']), r['dest_slug'], r['price_from'], (r.get('facts') or {}).get('mediana_ida_y_vuelta_eur')] for r in rows], open('vuelos/rutas-idx.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    for name, urls in (('vuelos-sitemap.xml', urls_es), ('flights-sitemap.xml', urls_en)):
        # lastmod = fecha real en que se consultaron los precios de cada ruta (Google y Bing recrawlean antes lo que cambia)
        # con la foto del destino (sitemap de imágenes: Google Imágenes)
        open(name, 'w', encoding='utf-8').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' + ''.join((f'<url><loc>{u[0]}</loc>' + (f'<lastmod>{u[1]}</lastmod>' if u[1] else '') + (f'<image:image><image:loc>{SITE}/hlc/img/cities/{u[2]}.jpg</image:loc></image:image>' if len(u) > 2 and u[2] else '') + '</url>') if isinstance(u, tuple) else f'<url><loc>{u}</loc></url>' for u in urls) + '</urlset>\n')
    write_md_and_feeds(rows)
    si = open('sitemap_index.xml', encoding='utf-8').read()
    for sm in ('vuelos-sitemap.xml', 'flights-sitemap.xml'):
        if sm not in si:
            si = si.replace('</sitemapindex>', f'\t<sitemap>\n\t\t<loc>{SITE}/{sm}</loc>\n\t</sitemap>\n</sitemapindex>')
        si = re.sub(rf'(<loc>{re.escape(SITE)}/{re.escape(sm)}</loc>)(\s*<lastmod>[^<]*</lastmod>)?', rf'\1\n\t\t<lastmod>{datetime.date.today().isoformat()}</lastmod>', si)
    open('sitemap_index.xml', 'w', encoding='utf-8').write(si)
    stamp = urllib.request.urlopen(urllib.request.Request(FEED.replace('action=feed', 'action=stamp'), headers={'User-Agent': 'hlc-build'}), timeout=60).read().decode()
    open('vuelos/feed.sha', 'w').write(stamp)
    json.dump(moved, open('en/_map-flights.json', 'w'), separators=(',', ':'))
    print('rutas', len(rows), 'EN movidas', len(moved), 'indexadas ES', sum(1 for r in rows if route_indexed('es', r['slug'], r)), 'indexadas EN', sum(1 for r in rows if route_indexed('en', en_slug(r), r)))


if __name__ == '__main__':
    main()
