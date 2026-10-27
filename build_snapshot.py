# -*- coding: utf-8 -*-
"""Construye index.html con la plantilla de ahora y los datos de una foto fija.

Para cuando se cambia la app (codigo, textos, estilo) y NO los datos: en vez de
volver a procesar 250 MB de OpenStreetMap, se toman los datos tal cual estan
publicados (snapshot_live.json + d/) y se rellena la plantilla con ellos. El
resultado es el mismo index.html que saldria de build.py, con los mismos
171.872 sitios que hay en la web, byte a byte en los datos.

Existe porque el 22 de septiembre el contenedor se reinicio, se perdio el
trabajo local y los ficheros crudos de dos rondas; los datos buenos solo
quedaban en la web. Tambien sirve de atajo: un cambio de texto no deberia
necesitar cinco minutos de build.

    python3 build_snapshot.py                  # usa snapshot_live.json
    SNAP=otra.json python3 build_snapshot.py
"""
import json, os, re, io, hashlib
from collections import Counter
snap = json.load(open(os.environ.get('SNAP', 'snapshot_live.json'), encoding='utf-8'))

src = io.open('build.py', encoding='utf-8').read()
start = src.index("html=open('index.template.html'")
tail = src[start:]
# lo que necesita el resto del build, sacado de la foto
CATIDS = ['food', 'shelter', 'hygiene', 'clothes', 'social', 'legal', 'health', 'water', 'warm']
places = [None] * snap['STATS']['places']
countries = snap['STATS']['countries']
WORLD = [None] * (snap['STATS']['cities'] - 48); CITY_LIST = [None] * 48
cjson = json.dumps(snap['CITIES'], ensure_ascii=False, separators=(',', ':'))
sjson = json.dumps(snap['STR'], ensure_ascii=False, separators=(',', ':'))
data = json.dumps(snap['RAW'], ensure_ascii=False, separators=(',', ':'))
chunks_json = json.dumps(snap['CHUNKS'], separators=(',', ':'))
SPLIT = set(snap['SPLIT'])
table = snap['STR']; core = snap['RAW']; buckets = snap['CHUNKS']
chunk_bytes = sum(os.path.getsize('d/%s.json' % k) for k in snap['CHUNKS'] if os.path.exists('d/%s.json' % k))
cities = []
# la huella de los datos es la de la web: mismos datos, misma version, y los
# moviles no vuelven a bajarse 18 MB de trozos que ya tienen
tail = tail.replace("datav = hashlib.sha1((data + sjson + chunks_json).encode('utf-8')).hexdigest()[:8]",
                    "datav = %r" % snap['DATA_V'])
assert ("datav = %r" % snap['DATA_V']) in tail
# enlaces a ciudades de la bienvenida: los de la web
tail = re.sub(r"try:\n    _cnt=\{\}.*?except Exception as _ex: print\('citylinks:', _ex\)",
              "html=html.replace('<!--__CITYLINKS__-->', %r, 1)" % re.sub(r'href="(c/[^"]+)\.html"', r'href="\1"', snap['CITYLINKS']), tail, count=1, flags=re.S)
assert '<!--__CITYLINKS__-->' in tail and '_cnt' not in tail.split("html=html.replace('<!--__CITYLINKS__-->'")[0][-200:]
tail = tail.replace("c=Counter(CATIDS[p[3]] for p in places)", "c=Counter()")
exec(compile(tail, 'build.py(tail)', 'exec'))
print('build desde foto: %d sitios, datos %s' % (len(places), snap['DATA_V']))
