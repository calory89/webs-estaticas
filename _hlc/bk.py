import re
"""Booking: una búsqueda solo con ?ss=<ciudad> falla a muchos usuarios ("nuestro sistema no reconoce este nombre"
o 0 resultados). Con dest_id + dest_type funciona siempre. Este módulo añade el dest_id a cualquier enlace de búsqueda
de Booking (directo o envuelto en el deep link de CJ). Ids en _hlc/booking_dest.json (sacados de Booking)."""
import json, os, re, unicodedata
from urllib.parse import quote, unquote, urlsplit, parse_qsl, urlencode

_M = None


def _k(s):
    s = unicodedata.normalize('NFKD', (s or '').replace('+', ' ')).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()


def _map():
    global _M
    if _M is None:
        raw = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'booking_dest.json'), encoding='utf-8'))
        _M = {_k(k): v for k, v in raw.items()}
    return _M


def dest(name):
    return _map().get(_k(name))


def fix_booking(u):
    """https://www.booking.com/searchresults.xx.html?ss=X  ->  ...&dest_id=..&dest_type=.."""
    if 'searchresults' not in u or 'dest_id=' in u:
        return u
    sp = urlsplit(u)
    q = dict(parse_qsl(sp.query))
    d = dest(q.get('ss', ''))
    if not d:
        return u
    q['dest_id'], q['dest_type'] = d
    return f'{sp.scheme}://{sp.netloc}{sp.path}?{urlencode(q)}'


def with_dates(u, checkin, checkout=None, adults=2):
    """Añade las fechas del chollo (y 2 adultos, 1 habitación) a un enlace de Booking, directo o dentro del de CJ.
    Sin vuelta (solo ida) se ponen 3 noches."""
    import datetime
    ci = (checkin or '')[:10]
    if not re.match(r'\d{4}-\d{2}-\d{2}$', ci) or not u or 'booking.com' not in unquote(u):
        return u
    co = (checkout or '')[:10]
    if not re.match(r'\d{4}-\d{2}-\d{2}$', co) or co <= ci:
        co = (datetime.date.fromisoformat(ci) + datetime.timedelta(days=3)).isoformat()
    m = re.match(r'(https://www\.[a-z]+\.com/click-\d+-\d+\?.*?url=)([^&]+)(.*)$', u)
    if m:
        return m.group(1) + quote(with_dates(unquote(m.group(2)), ci, co, adults), safe='') + m.group(3)
    u = fix_booking(u)
    sp = urlsplit(u)
    q = dict(parse_qsl(sp.query))
    q.update({'checkin': ci, 'checkout': co, 'group_adults': str(adults), 'no_rooms': '1', 'group_children': '0'})
    return f'{sp.scheme}://{sp.netloc}{sp.path}?{urlencode(q)}'


# ---------- GetYourGuide (actividades y traslados, por CJ) ----------
GYG_LINK = {'es': '15084034', 'en': '15084019'}


def gyg(q=None, lang='es', checkin=None, checkout=None, sid='happylowcost'):
    """Enlace de GetYourGuide por CJ: búsqueda de actividades (o traslados) en la ciudad, con fechas si las hay."""
    base = 'https://www.getyourguide.es' if lang == 'es' else 'https://www.getyourguide.com'
    if q:
        qs = {'q': q}
        if checkin and re.match(r'\d{4}-\d{2}-\d{2}', checkin or ''):
            qs['date_from'] = checkin[:10]
            if checkout and re.match(r'\d{4}-\d{2}-\d{2}', checkout) and checkout[:10] > checkin[:10]:
                qs['date_to'] = checkout[:10]
        u = f'{base}/s/?{urlencode(qs)}'
    else:
        u = base + '/'
    return f'https://www.kqzyfj.com/click-101900924-{GYG_LINK[lang]}?sid={sid}&url={quote(u, safe="")}'


def gyg_transfer(city=None, lang='es', checkin=None):
    q = (f'{city} traslado aeropuerto' if lang == 'es' else f'{city} airport transfer') if city else ('traslado aeropuerto' if lang == 'es' else 'airport transfer')
    return gyg(q, lang, checkin, None, 'happylowcost-traslado')


# ---------- DiscoverCars (alquiler de coches, afiliado directo happylowcost) ----------
def dc(lang='es', sid='happylowcost'):
    """Enlace de afiliado de DiscoverCars (Post Affiliate Pro: a_aid + data1 como subid)."""
    base = 'https://www.discovercars.com/es' if lang == 'es' else 'https://www.discovercars.com/'
    return f'{base}?{urlencode({"a_aid": "happylowcost", "data1": sid})}'


_OLD_ATTR = re.compile(r'https://www\.kqzyfj\.com/click-101900924-17288984\?[^"\'\s<>]*')
_OLD_TAXI = re.compile(r'https://www\.kqzyfj\.com/click-101900924-17322565\?[^"\'\s<>]*')


def fix_gyg(s, lang='es'):
    """Excursiones y traslados de Booking -> GetYourGuide."""
    s = _OLD_ATTR.sub(lambda m: gyg(None, lang).replace('&', '&amp;') if '&amp;' in m.group(0) else gyg(None, lang), s)
    s = _OLD_TAXI.sub(lambda m: gyg_transfer(None, lang).replace('&', '&amp;') if '&amp;' in m.group(0) else gyg_transfer(None, lang), s)
    return s.replace('🏨 Hoteles en Booking.com', '🏨 Hoteles')


_CJ = re.compile(r'(https://www\.(?:kqzyfj|anrdoezrs|jdoqocy|tkqlhce|dpbolvw)\.com/click-\d+-\d+\?[^"\'\s<>]*?url=)([^"\'\s<>&]+)')


def fix_html(s):
    def cj(m):
        inner = unquote(m.group(2))
        new = fix_booking(inner)
        return m.group(0) if new == inner else m.group(1) + quote(new, safe='')
    s = _CJ.sub(cj, s)
    # enlaces directos a booking (sin CJ)
    s = re.sub(r'https://www\.booking\.com/searchresults\.[a-z-]+\.html\?[^"\'\s<>]+', lambda m: fix_booking(m.group(0).replace('&amp;', '&')).replace('&', '&amp;') if 'dest_id' not in m.group(0) else m.group(0), s)
    return s


def js_map():
    return json.dumps({k: v[0] + '|' + v[1] for k, v in _map().items()}, separators=(',', ':'), ensure_ascii=False)


if __name__ == '__main__':  # python3 _hlc/bk.py [prefijos...]  -> arregla todo el HTML
    import sys, glob
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root)
    pre = sys.argv[1:] or ['']
    n = 0
    for f in glob.glob('**/*.html', recursive=True):
        if f.startswith(('_', 'node_modules')) or not any(f.startswith(p) for p in pre):
            continue
        s = open(f, encoding='utf-8', errors='surrogateescape').read()
        if 'searchresults' not in s:
            continue
        t = fix_html(s)
        if t != s:
            open(f, 'w', encoding='utf-8', errors='surrogateescape').write(t); n += 1
    print('booking dest_id:', n, 'archivos')


# Booking.com vuelos: los códigos de ciudad con varios aeropuertos (ROM, LON, PAR...) van como .CITY; con .AIRPORT Booking entiende otra cosa (ROM -> Rumanía)
METRO = set("LON MIL NYC PAR ROM STO BUE RIO TYO OSA YTO TCI WAS CHI SEL BJS SHA MOW BUH SAO YMQ JKT REK DTT QDF HOU YEA".split())
_FL = re.compile(r'\b([A-Z]{3})\.AIRPORT\b')


def fix_flight(u):
    if not u:
        return u
    from urllib.parse import unquote, quote
    def rep(t):
        return _FL.sub(lambda m: m.group(1) + ('.CITY' if m.group(1) in METRO else '.AIRPORT'), t)
    if 'url=' in u:
        head, _, enc = u.partition('url=')
        tail = ''
        if '&' in enc and not enc.startswith('http'):
            enc, _, tail = enc.partition('&')
            tail = '&' + tail if tail else ''
        return head + 'url=' + quote(rep(unquote(enc)), safe='') + tail
    return rep(u)
