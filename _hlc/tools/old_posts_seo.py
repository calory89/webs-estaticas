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
    '100-cosas-que-ver-y-hacer-en-barcelona': 'Qué ver, hacer y conocer en Barcelona: 100 cosas',  # ronda 10: "que conocer en barcelona" 14 impr. pos. 19,2  # "que ver/hacer en barcelona" 254 impr. pos. 29
    'islas-maldivas-el-lugar-perfecto-para-una-luna-de-miel': 'Luna de miel en Maldivas: el viaje de novios perfecto',  # "luna de miel maldivas" 197 impr.; "viaje de novios maldivas" 92
    'los-5-mejores-casinos-en-las-vegas': 'Los 5 mejores casinos de Las Vegas',  # "mejor casino de las vegas" pos. 24
    # Ronda 8 (GSC 30-oct a 26-nov, pos. 6-16, 0 clics): la consulta real en el título
    'donde-alojarse-vitoria': 'Dónde alojarse en Vitoria y alrededores: hoteles y rurales con encanto',  # "dormir cerca de vitoria con encanto" 32 impr. pos. 13; "alojamiento cerca de vitoria" 14 pos. 6
    'alojamiento-low-cost-en-copenhague': 'Hoteles baratos en Copenhague: alojamiento low cost',  # "hoteles baratos en copenhague" 14+3 impr. pos. 15-16
    '5-mejores-heladerias-de-roma': 'Heladerías en Roma: las 5 mejores',  # ronda 10: "heladeria roma" 11 impr. pos. 14,6 (empieza por la consulta)  # "heladeria roma" 11 impr. pos. 14,6
    'maimonides-un-ilustre-cordobes': 'Maimónides en Córdoba: el ilustre cordobés',  # "maimonides cordoba" 15+7 impr. pos. 12; 233 impr. en total
    '12-planes-para-hacer-gratis-en-toronto': 'Qué visitar en Toronto gratis: 12 planes',  # "que visitar en toronto gratis" 10 impr. pos. 16,3
    'restaurantes-cafeterias-y-bares-en-malaga': 'Mejores restaurantes, cafeterías y bares en Málaga',  # "mejores restaurantes y cafeterías en málaga" 8 impr. pos. 9
    'trucos-para-escoger-los-mejores-hoteles-en-amsterdam': 'Hoteles en Ámsterdam: trucos para escoger los mejores',  # "¿qué hoteles me recomiendas en ámsterdam?" 8 impr. pos. 10 (consulta de asistente)
    'como-llegar-vitoria-primer-paso-viaje-pais-vasco': 'Cómo llegar a Vitoria-Gasteiz: en coche, tren, autobús o avión',  # "vitoria como llegar" 124 impr. pos. 10; "cómo llegar a vitoria-gasteiz en coche" 16 pos. 9
    'jardin-de-los-sentidos': 'Jardín de los Sentidos (Altea): jardín, hotel y precios',  # "precios de jardin de los sentidos altea" 9 impr. pos. 8,7 (el post da los precios de 2019)
    'conoce-el-misterio-de-la-facultad-de-filosofia-y-letras': 'Facultad de Filosofía y Letras de Córdoba: su misterio',  # "facultad de filosofia y letras" pos. 12; 144 impr.
    'conoce-la-facultad-de-derecho-de-cordoba': 'Facultad de Derecho de Córdoba: historia y edificio',  # "facultad de derecho cordoba" pos. 16
    # Ronda 9 (GSC 31-oct a 27-nov): la consulta real, sin esconder que el chollo es antiguo
    'vuelos-directos-a-nueva-york-desde-solo-389e-i-v': 'Vuelos baratos a Nueva York: directo por 389 € (chollo de 2023)',  # "vuelos baratos a nueva york" 19+18+10 impr. pos. 9-14
    'vuelos-directos-a-islas-maldivas-por-solo-339e-i-v': 'Vuelos baratos a Maldivas desde Milán por 339 € (chollo de 2019)',  # "vuelos baratos a maldivas" pos. 16,6 (el vuelo sale de Milán, no de España)
    'vuelos-a-moscu-rusia-desde-solo-93e-i-v': 'Vuelos baratos a Moscú, Rusia, desde 93 € (chollo de 2019)',  # "vuelos para rusia" 14 impr., "vuelos baratos a moscu" pos. 16-20
    'paraisos-irresistibles-tahiti': 'Qué hacer en Tahití: qué ver en el paraíso de la Polinesia',  # "qué hacer en tahití" pos. 15
    'los-cinco-mejores-safaris-en-africa': 'Safaris por África: los cinco mejores',  # "safaris por africa" pos. 9,3
    'museos-interesantes-que-visitar-en-dinamarca': 'Museos de Dinamarca: los más interesantes que visitar',  # "museo dinamarca" pos. 7,2
    'las-cinco-plazas-de-buenos-aires-mas-bonitas': 'Las 5 plazas más bonitas de Buenos Aires',  # "plazas de buenos aires" pos. 13-25; 154 impr.
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


def old_hub(t):
    """Ronda 8: chollos antiguos de WordPress (caja "Oferta caducada"): enlace al hub de precios de hoy del destino.
    GSC: el post de 2023 "vuelos directos a Nueva York desde 389 €" sigue saliendo por "vuelos baratos a nueva york" (19+18+10 impr., pos. 9-14)."""
    if 'hlc-old-ssr' not in t or 'data-hlc-oldhub' in t:
        return t
    h = re.search(r'<h1[^>]*>(.*?)</h1>', t, re.S)
    p = dest_of(_html.unescape(re.sub(r'<[^>]+>', '', h.group(1)))) if h else None
    if not p or not os.path.isfile(f"vuelos/a/{p['s']}/index.html") or not re.search(r'vuelo', h.group(1), re.I):
        return t
    a = f'<a class="hlc-btn" data-hlc-oldhub href="/vuelos/a/{p["s"]}/">Vuelos baratos a {_html.escape(p["n"])}: precios de hoy</a>'
    m = re.search(r'(<div class="hlc-old hlc-old-ssr"[^>]*>.*?<div class="hlc-row">)(<a class="hlc-btn")', t, re.S)
    if not m:
        return t
    return t[:m.end(1)] + a + '<a class="hlc-btn o"' + t[m.end(2):]


def main():
    keep = set(open('_hlc/keep_indexed.txt', encoding='utf-8').read().split()) if os.path.exists('_hlc/keep_indexed.txt') else set()
    stats = dict(retitled=0, gtop=0, links=0, files=0)
    for d in sorted(os.listdir('.')):
        f = os.path.join(d, 'index.html')
        # ronda 8: antes se saltaba cualquier carpeta que empezara por "vuelos"/"en"/"destinos" (p. ej. vuelos-directos-a-nueva-york-...), no solo las de la web nueva
        if d.startswith(('.', '_', 'wp-')) or d in ('en', 'hlc', 'vuelos', 'chollos', 'destinos') or not os.path.isfile(f):
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
        if d in keep:
            t2 = old_hub(t)
            stats['oldhub'] = stats.get('oldhub', 0) + int(t2 != t)
            t = t2
        t, nl = fix_links(t)
        stats['links'] += nl
        if t != t0:
            open(f, 'w', encoding='utf-8', errors='surrogateescape').write(t)
            stats['files'] += 1
    print(json.dumps(stats))


if __name__ == '__main__':
    main()
