#!/usr/bin/env python3
"""Happy Low Cost: TODOS los enlaces de afiliado pasan a CJ (PID 101900924). Idempotente.
Uso: python3 cj.py <raiz_rama> <short_res.tsv>
"""
import os, re, sys, subprocess, json
from urllib.parse import quote, unquote, urlsplit, urlunsplit, parse_qsl, urlencode

ROOT, SHORT = sys.argv[1], sys.argv[2]
os.chdir(ROOT)
PID = '101900924'
AID = {'hotel': '17288959', 'flight': '17288982', 'car_bk': '17288983', 'attr': '17288984', 'taxi': '17322565',
       'car': '12506471', 'paris': '11585459'}
DEF = {'hotel': 'https://www.booking.com/index.es.html', 'flight': 'https://www.booking.com/flights/index.es.html',
       'attr': 'https://www.booking.com/attractions/index.es.html', 'taxi': 'https://www.booking.com/taxi/index.es.html',
       'car': 'https://www.holidayautos.com/es/', 'paris': 'https://www.pariscityvision.com/es'}
CJ_DOM = re.compile(r'(kqzyfj|anrdoezrs|dpbolvw|jdoqocy|tkqlhce)\.(com|net)')


def cj(kind, url=None):
    return f'https://www.kqzyfj.com/click-{PID}-{AID[kind]}?sid=happylowcost&url=' + quote(url or DEF[kind], safe='')


short = {}
for line in open(SHORT, encoding='utf-8'):
    p = line.rstrip('\n').split('\t')
    if len(p) >= 3:
        short[p[0]] = (p[1], p[2])


def clean_booking(u):
    s = urlsplit(u)
    q = [(k, v) for k, v in parse_qsl(s.query) if k.lower() not in ('aid', 'label', 'sid')]
    path = s.path if s.path not in ('', '/') else '/index.es.html'
    return urlunsplit(('https', 'www.booking.com', path, urlencode(q), ''))


def resolve(u):
    if u in short:
        return short[u]
    try:
        r = subprocess.run(['curl', '-s', '-m', '15', '-o', '/dev/null', '-w', '%{http_code}\t%{redirect_url}', u], capture_output=True, text=True).stdout.split('\t')
        short[u] = (r[0], r[1] if len(r) > 1 else '')
    except Exception:
        short[u] = ('', '')
    return short[u]


def classify(href):
    """-> ('keep', None) | ('set', newhref) | ('unwrap', None)"""
    h = href.replace('&amp;', '&').strip()
    if h.startswith('//'):
        h = 'https:' + h
    if h.startswith('ttp'):
        h = 'h' + h
    fb = re.match(r'https?://l\.facebook\.com/l\.php\?u=([^&]+)', h)
    if fb:
        h = unquote(fb.group(1))
    l = h.lower()
    k, v = classify2(h, l)
    if k == 'keep' and h != href.replace('&amp;', '&').strip():
        return 'set', h
    return k, v


def classify2(h, l):
    if CJ_DOM.search(l) or l.startswith(('#', '/', 'mailto:', 'tel:', 'javascript:')) or ('happylowcost.com' in l.split('?')[0] and 'groupifly' not in l):
        return 'keep', None
    if re.match(r'https?://(bit\.ly|goo\.gl|cutt\.ly)/', l):
        code, dest = short.get(h) or short.get(h.replace('https://', 'http://')) or short.get(h.replace('http://', 'https://')) or resolve(h)
        if not dest or 'goo.gl' in dest or code == '404':
            return 'unwrap', None
        h, l = dest, dest.lower()
        k, v = classify2(h, l)
        return ('set', h) if k == 'keep' else (k, v)
    m = re.search(r'tradedoubler\.com/click\?p\((\d+)\).*?url\((.*)\)$', h)
    if m:
        if m.group(1) == '224466':
            h, l = unquote(m.group(2)), unquote(m.group(2)).lower()
        else:
            return 'unwrap', None
    if 'tradedoubler' in l:
        if 'p=224466' in l:
            return 'set', cj('flight')
        return 'unwrap', None
    if 'skyscanner' in l:
        if 'u=' in l:
            q = dict(parse_qsl(urlsplit(h).query))
            l = unquote(q.get('u', '')).lower() or l
        if 'hotel' in l:
            return 'set', cj('hotel')
        if 'coche' in l or 'carhire' in l or 'car-hire' in l:
            return 'set', cj('car')
        return 'set', cj('flight')
    if 'booking.com' in l:
        if '/flights' in l:
            return 'set', cj('flight')
        if '/attractions' in l:
            return 'set', cj('attr')
        return 'set', cj('hotel', clean_booking(h))
    if 'civitatis' in l:
        return 'set', cj('taxi' if 'traslado' in l else 'attr')
    if re.search(r'momondo|edreams|kayak|kiwi\.com|rumbo|opodo|logitravel|vueling|ryanair', l):
        return 'set', cj('flight')
    if 'airbnb' in l or 'hotels.com' in l or 'trivago' in l:
        return 'set', cj('hotel')
    if re.search(r'rentalcars|holidayautos|alquilerdecoche|doyouspain|autoeurope', l):
        return 'set', cj('car')
    if 'pariscityvision' in l:
        return 'set', cj('paris')
    if re.search(r'amzn\.|amazon\.|heymondo|iati|tradetracker|zanox|awin|n26|go2cloud|pxf\.io|groupifly|impact\.com', l):
        return 'unwrap', None
    return 'keep', None


A_FULL = re.compile(r'<a\s([^>]*?)href=(["\'])(.*?)\2([^>]*)>(.*?)</a>', re.S | re.I)
SIDEBAR = ('<aside id="hlc-side" class="widget widget_text"><div class="hlc-side"><b>Reserva tu viaje</b>'
           f'<a class="hlc-btn" href="{cj("hotel")}" target="_blank" rel="sponsored nofollow noopener">🏨 Hoteles en Booking.com</a>'
           f'<a class="hlc-btn b" href="{cj("flight")}" target="_blank" rel="sponsored nofollow noopener">✈️ Vuelos</a>'
           f'<a class="hlc-btn g" href="{cj("attr")}" target="_blank" rel="sponsored nofollow noopener">🎟️ Excursiones y entradas</a>'
           f'<a class="hlc-btn o" href="{cj("car")}" target="_blank" rel="sponsored nofollow noopener">🚗 Coches de alquiler</a>'
           f'<a class="hlc-btn o" href="{cj("taxi")}" target="_blank" rel="sponsored nofollow noopener">🚕 Traslados al aeropuerto</a>'
           '</div></aside>')

files = [f for f in subprocess.run(['git', 'ls-files', '-z', '*.html'], capture_output=True).stdout.decode().split('\0') if f]
st = dict(files=0, changed=0, set=0, unwrap=0, side=0, widgets=0, lines=0)
for f in files:
    st['files'] += 1
    t0 = open(f, encoding='utf-8', errors='surrogateescape').read()
    t = t0
    # barra lateral: fuera los banners de Skyscanner/Civitatis/Tradedoubler, dentro botones CJ
    t, n = re.subn(r'<aside id="block-6" class="widget widget_block widget_media_image">.*?</aside>', '', t, flags=re.S)
    t, n2 = re.subn(r'<aside id="block-8" class="widget widget_block">\s*<div data-skyscanner-widget.*?</aside>', '', t, flags=re.S)
    t, n3 = re.subn(r'<aside id="text-12" class="widget widget_text">.*?</aside>', SIDEBAR, t, count=1, flags=re.S)
    st['side'] += n3
    # widgets y píxeles de Skyscanner / Impact sueltos
    t, w1 = re.subn(r'<div data-skyscanner-widget[^>]*>\s*</div>', '', t)
    t, w2 = re.subn(r'<script[^>]*widgets\.skyscanner\.net[^>]*>\s*</script>', '', t)
    t, w3 = re.subn(r'<img[^>]*imp\.pxf\.io[^>]*>', '', t)
    st['widgets'] += w1 + w2 + w3
    # líneas de la caja "Te ayudamos a ahorrar" sin equivalente en CJ
    t, l1 = re.subn(r'<p[^>]*>\s*💗 Reserva tu <strong>seguro de viaje</strong>\s*<a[^>]*>aquí\.</a>\s*</p>', '', t)
    t, l2 = re.subn(r'📖 Las mejores guías de viaje en Amazon\s*<a[^>]*>aquí\.</a>', '', t)
    st['lines'] += l1 + l2

    def rep(m):
        kind, new = classify(m.group(3))
        if kind == 'keep':
            return m.group(0)
        if kind == 'unwrap':
            st['unwrap'] += 1
            return m.group(5)
        st['set'] += 1
        attrs = (m.group(1) + m.group(4))
        attrs = re.sub(r'\srel=(["\']).*?\1', '', ' ' + attrs).strip()
        return f'<a {attrs} href="{new.replace("&", "&amp;")}" rel="sponsored nofollow noopener">{m.group(5)}</a>'.replace('<a  ', '<a ')

    t = A_FULL.sub(rep, t)
    t, z = re.subn(r'<img[^>]*(ad\.zanox\.com|tradetracker|imp\.pxf\.io)[^>]*>', '', t)
    st['widgets'] += z
    # texto de enlace que muestra la URL antigua
    t = re.sub(r'(<a [^>]*href="https://www\.kqzyfj\.com/[^"]*"[^>]*>)\s*https?://[^<\s]+\s*(</a>)', r'\1Reservar aquí\2', t)
    # acortadores escritos como texto (fuera de etiquetas y scripts)
    parts = re.split(r'(<script.*?</script>|<style.*?</style>|<[^>]+>)', t, flags=re.S)
    for i, seg in enumerate(parts):
        if not seg or seg.startswith('<'):
            continue
        def txt(m):
            k, v = classify(m.group(0))
            st['txt'] = st.get('txt', 0) + 1
            if k == 'set' and 'kqzyfj' in v:
                return f'<a href="{v.replace("&", "&amp;")}" target="_blank" rel="sponsored nofollow noopener">ver precio aquí</a>'
            if k == 'set':
                return f'<a href="{v.replace("&", "&amp;")}" target="_blank" rel="noopener">{v}</a>'
            return ''
        parts[i] = re.sub(r'https?://(?:bit\.ly|goo\.gl|cutt\.ly)/[A-Za-z0-9_\-]+', txt, seg)
    t = ''.join(parts)
    if t != t0:
        open(f, 'w', encoding='utf-8', errors='surrogateescape').write(t)
        st['changed'] += 1
print(json.dumps(st))
