"""Ronda 7 (#320): prueba rápida en vivo tras cada despliegue. Pide las URLs clave y comprueba estado 200,
<title>, canónica y que no haya restos de código en el texto. Uso: python3 _hlc/tools/smoke_live.py [URL ...]
Sale con código 1 si algo falla (sirve para un paso de workflow o para revisar a mano)."""
import re, sys, urllib.request

SITE = 'https://www.happylowcost.com'
DEFAULT = ['/', '/en/', '/chollos/', '/en/deals/', '/vuelos/', '/en/flights/', '/destinos/', '/en/destinations/', '/llms.txt', '/robots.txt', '/sitemap_index.xml']
BAD = re.compile(r'&lt;function |<function [\w.<>]+ at 0x|\bNone\s?€|Traceback')


def check(u):
    url = u if u.startswith('http') else SITE + u
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'HLC-smoke/1.0'}), timeout=30)
        body = r.read().decode('utf-8', 'ignore')
        code = r.status
    except Exception as ex:
        return False, f'{url}: {ex}'
    probs = []
    if code != 200:
        probs.append(f'estado {code}')
    if url.endswith('/'):
        t = re.search(r'<title>([^<]*)', body)
        if not t:
            probs.append('sin <title>')
        c = re.search(r'<link rel="canonical" href="([^"]+)"', body)
        if not c:
            probs.append('sin canónica')
    if BAD.search(body):
        probs.append('restos de código en el texto')
    return not probs, f'{url}: ' + (', '.join(probs) if probs else 'ok' + (f' | {t.group(1)[:70]}' if url.endswith('/') and t else ''))


def main(urls):
    ok = True
    for u in urls or DEFAULT:
        good, msg = check(u)
        ok &= good
        print(('OK   ' if good else 'FALLO ') + msg)
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main(sys.argv[1:])
