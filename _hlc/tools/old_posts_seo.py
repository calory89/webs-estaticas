#!/usr/bin/env python3
"""SEO de los posts antiguos de WordPress (ronda 5, 27-nov-2026). Idempotente.

1) Títulos, H1 y og:title por la consulta real de Search Console (28 días, pos. 7-21, 0 clics).
2) Arriba de cada post indexado (keep_indexed.txt) cuyo título es de un destino con guía:
   enlace "Guía actualizada" a la guía nueva y al hub de vuelos (bloque <!--hlc-gtop-->).
3) Enlaces internos que apuntan a una URL con redirección 301 en _redirects: se cambian por el destino final.

Uso (desde la raíz de la rama pub/happylowcost.com): python3 _hlc/tools/old_posts_seo.py
"""
import html as _html
import json
import os
import re
import sys
import unicodedata as _ud

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
os.chdir(ROOT)

RETITLE = {
    # slug: (título, H1)
    'explora-la-isla-de-tuvalu': 'Excursiones en Tuvalu: qué ver y hacer en la isla',  # "excursiones a tuvalu" pos. 17,6; "tuvalu excursiones precio" pos. 9,5
    'salir-de-noche-por-oviedo': 'Dónde salir de fiesta en Oviedo: vida nocturna y bares',  # "dónde salir de fiesta en oviedo" pos. 19,3; "vida nocturna en oviedo" pos. 20,7
    'que-comer-en-lisboa-11-cosas-que-debes-probar': 'Comida típica de Lisboa: 11 platos que debes probar',  # "comida tipica de lisboa" pos. 17,5
    'visitar-vitoria-un-dia': 'Qué hacer en Vitoria-Gasteiz en un día: ruta por la ciudad',  # "cosas que hacer en vitoria gasteiz" pos. 20,9
    'las-ciudades-mas-bonitas-de-dinamarca': 'Las ciudades más bonitas de Dinamarca para visitar',  # "ciudades mas bonitas de dinamarca" pos. 6,9
    '100-cosas-que-ver-y-hacer-en-barcelona': 'Qué ver y hacer en Barcelona: 100 cosas imprescindibles',  # "que ver/hacer en barcelona" 254 impr. pos. 29
    'islas-maldivas-el-lugar-perfecto-para-una-luna-de-miel': 'Luna de miel en Maldivas: el viaje de novios perfecto',  # "luna de miel maldivas" 197 impr.; "viaje de novios maldivas" 92
    'los-5-mejores-casinos-en-las-vegas': 'Los 5 mejores casinos de Las Vegas',  # "mejor casino de las vegas" pos. 24
}


def _sl(t):
    t = _ud.normalize('NFD', t or '').encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')


DL = json.load(open('hlc/destinos.json', encoding='utf-8'))
GUIDES = {p['s'] for p in DL if p.get('g') and os.path.isfile(f"destinos/{p['s']}/index.html")}
try:
    DIAS = json.load(open('destinos/dias.json', encoding='utf-8'))
except Exception:
    DIAS = {}


def dest_of(title):
    t = '-' + _sl(title) + '-'
    best = None
    for p in DL:
        for n in [p['s'], _sl(p['n'])] + list(p.get('a') or []):
            if n and len(n) > 3 and f'-{n}-' in t and (best is None or len(n) > best[1]):
                best = (p, len(n))
    return best[0] if best else None


def retitle(t, new):
    t = re.sub(r'<title>.*?</title>', '<title>' + _html.escape(new, quote=False) + '</title>', t, count=1, flags=re.S)
    t = re.sub(r'(<h1 class="post-title[^"]*"[^>]*>).*?(</h1>)', lambda m: m.group(1) + _html.escape(new, quote=False) + m.group(2), t, count=1, flags=re.S)
    t = re.sub(r'(<meta (?:property|name)="(?:og|twitter):title" content=")[^"]*(")', lambda m: m.group(1) + _html.escape(new) + m.group(2), t)
    t = re.sub(r'("headline":")[^"]*(")', lambda m: m.group(1) + new.replace('"', '\\"') + m.group(2), t, count=1)
    return t


# redirecciones estáticas ASCII de _redirects (origen -> destino)
REDIR = {}
for ln in open('_redirects', encoding='utf-8'):
    ln = ln.split('#', 1)[0].strip()
    parts = ln.split()
    if len(parts) >= 2 and parts[0].startswith('/') and '*' not in parts[0] and ':' not in parts[0] and (len(parts) < 3 or parts[2] in ('301', '308')):
        src, dst = parts[0], parts[1]
        if dst.startswith('/') or dst.startswith('https://www.happylowcost.com'):
            REDIR[src.rstrip('/') + '/'] = dst.replace('https://www.happylowcost.com', '')


def fix_links(t):
    n = [0]

    def r(m):
        path = m.group(2)
        k = path if path.endswith('/') else path + '/'
        if k in REDIR and REDIR[k] != k:
            n[0] += 1
            return m.group(1) + REDIR[k] + m.group(3)
        return m.group(0)
    t = re.sub(r'(href=")(?:https?://(?:www\.)?happylowcost\.com)?(/[a-z0-9][a-z0-9\-/]*)(")', r, t)
    return t, n[0]


def gtop(t):
    t = re.sub(r'<!--hlc-gtop-->.*?<!--/hlc-gtop-->', '', t, flags=re.S)
    if 'hlc-old-ssr' in t or not re.search(r'<body[^>]*class="[^"]*\bsingle\b', t):
        return t
    h = re.search(r'<h1[^>]*>(.*?)</h1>', t, re.S)
    p = dest_of(_html.unescape(re.sub(r'<[^>]+>', '', h.group(1)))) if h else None
    if not p or p['s'] not in GUIDES:
        return t
    nd = DIAS.get(p['s']) or 0
    n = _html.escape(p['n'])
    links = f'<a href="/destinos/{p["s"]}/">Qué ver en {n}' + (f' en {nd} días' if nd else '') + '</a>'
    if os.path.isfile(f"vuelos/a/{p['s']}/index.html"):
        links += f' · <a href="/vuelos/a/{p["s"]}/">Vuelos baratos a {n}</a>'
    box = ('<!--hlc-gtop--><p class="hlc-gtop" style="background:#FFF6E0;border-left:4px solid #FFC531;padding:10px 14px;border-radius:10px;font:15px/1.5 Inter,sans-serif">'
           f'📖 <strong>Guía actualizada:</strong> {links}</p><!--/hlc-gtop-->')
    m = re.search(r'<div class="inner-post-entry[^>]*>', t)
    if not m:
        return t
    return t[:m.end()] + box + t[m.end():]


def main():
    keep = set(open('_hlc/keep_indexed.txt', encoding='utf-8').read().split()) if os.path.exists('_hlc/keep_indexed.txt') else set()
    stats = dict(retitled=0, gtop=0, links=0, files=0)
    for d in sorted(os.listdir('.')):
        f = os.path.join(d, 'index.html')
        if d.startswith(('.', '_', 'en', 'hlc', 'vuelos', 'chollos', 'destinos', 'wp-')) or not os.path.isfile(f):
            continue
        t0 = open(f, encoding='utf-8', errors='surrogateescape').read()
        if 'id="soledad_wrapper"' not in t0:
            continue
        t = t0
        if d in RETITLE:
            t = retitle(t, RETITLE[d])
            stats['retitled'] += 1
        if d in keep or f'/{d}/' in keep or any(k.rstrip('/').endswith('/' + d) for k in ()):
            t2 = gtop(t)
            stats['gtop'] += int('<!--hlc-gtop-->' in t2)
            t = t2
        t, nl = fix_links(t)
        stats['links'] += nl
        if t != t0:
            open(f, 'w', encoding='utf-8', errors='surrogateescape').write(t)
            stats['files'] += 1
    print(json.dumps(stats))


if __name__ == '__main__':
    main()
