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
