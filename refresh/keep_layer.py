# -*- coding: utf-8 -*-
"""Capa «keep»: que un refresco no se lleve sitios que ya estaban publicados.

Las reglas de refresh/from_pbf_parts.py (radios, topes por ciudad) son las de la
consulta original, pero los datos publicados se juntaron durante meses con otras
descargas (radios de 5-6 km para aseos, ciudades vacias, etc.). Sin esta capa, el
refresco del 28-oct-2026 perdia unos 25.000 sitios que siguen en OpenStreetMap.

    python3 refresh/keep_layer.py <raiz> <foto_publicada.json> [relaciones_overpass.json ...]

- <foto_publicada.json>: la foto de lo publicado (snapshot.json / snapshot_now.json
  de la publicacion anterior: {"places": {"node/123": [...], ...}}).
- Busca esos ids en raw/parts/*.jsonl.gz (los datos NUEVOS, con sus etiquetas de hoy)
  y los escribe en raw/keep.jsonl.gz. build.py los añade al final, pasando por
  classify(): lo que hoy no es ayuda (reglas de calidad) sigue fuera.
- Las relaciones que osmium no sabe dibujar (multipoligonos rotos en el borde de un
  extracto, type=site) no salen en las partes: se pueden dar aparte, bajadas de
  Overpass con «out center tags meta» (sin usuario ni uid).
- Lo que ya no esta en OpenStreetMap (borrado o sin etiquetas de ayuda) no vuelve.
"""
import gzip, json, os, sys

ROOT = os.path.abspath(sys.argv[1])
SNAP = sys.argv[2]
EXTRA = sys.argv[3:]
RAW = os.path.join(ROOT, 'raw')

want = set(json.load(open(SNAP, encoding='utf-8'))['places'])
out, have = [], set()


def rec(typ, oid, lat, lon, tags, ts):
    o = {'type': typ, 'id': oid, 'tags': tags}
    if typ == 'node':
        o['lat'], o['lon'] = lat, lon
    else:
        o['center'] = {'lat': lat, 'lon': lon}
    if ts:
        o['ts'] = ts
    return o


for fn in sorted(os.listdir(os.path.join(RAW, 'parts'))):
    if not fn.endswith('.jsonl.gz'):
        continue
    with gzip.open(os.path.join(RAW, 'parts', fn), 'rt', encoding='utf-8') as f:
        for line in f:
            typ, oid, lat, lon, t, ts = json.loads(line)
            k = '%s/%d' % (typ, oid)
            if k in want and k not in have:
                have.add(k)
                out.append(rec(typ, oid, lat, lon, t, ts))
n_parts = len(out)
for fn in EXTRA:
    for e in json.load(open(fn, encoding='utf-8')):
        k = '%s/%d' % (e['type'], e['id'])
        c = e.get('center') or ({'lat': e['lat'], 'lon': e['lon']} if 'lat' in e else None)
        if k not in want or k in have or not c:
            continue
        have.add(k)
        out.append(rec(e['type'], e['id'], round(c['lat'], 7), round(c['lon'], 7),
                       {a: str(b) for a, b in (e.get('tags') or {}).items()}, (e.get('timestamp') or '')[:10]))
with gzip.open(os.path.join(RAW, 'keep.jsonl.gz'), 'wt', encoding='utf-8', compresslevel=9) as f:
    f.write(json.dumps({'k': 'keep', 'els': out}, ensure_ascii=False, separators=(',', ':')) + '\n')
print('keep: %d de %d publicados siguen en OSM (%d de las partes, %d de Overpass); %d ya no estan'
      % (len(out), len(want), n_parts, len(out) - n_parts, len(want) - len(out)))
