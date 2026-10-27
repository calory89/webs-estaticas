# -*- coding: utf-8 -*-
"""raw/*.jsonl.gz (lo que baja refresh/fetch_all.py) -> los ficheros que lee build.py:

    raw_nat.json     {"social_facility": [...], ..., "city:Madrid": [...]}
    raw_world.json   {"<lat>,<lon>": [...]}   (build.py busca cada ciudad por sus coordenadas)
    raw_planet.json  {"<s>_<w>_<tamano>": [...]}
    meta.json        {"node/123": "2024-05"}  (mes de la ultima edicion en OSM)

Los otros ficheros crudos de antes (raw_world2..7, raw_w200/300/500, raw_empty,
raw_es, raw_es2) se vacian: todo lo que traian lo trae ahora raw_world.json.
"""
import gzip, json, os, sys

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else '.')
RAW = os.path.join(ROOT, 'raw')


def load(layer):
    out = {}
    for fn in (layer + '.jsonl.gz', layer + '.jsonl'):
        p = os.path.join(RAW, fn)
        if not os.path.exists(p):
            continue
        op = gzip.open if fn.endswith('.gz') else open
        with op(p, 'rt', encoding='utf-8') as f:
            for line in f:
                o = json.loads(line)
                out[o['k']] = o['els']
    return out


meta = {}
def take_meta(d):
    for els in d.values():
        for e in els:
            if e.get('ts'):
                meta['%s/%s' % (e['type'], e['id'])] = e['ts'][:7]
            e.pop('ts', None)


nat, cities, planet = load('nat'), load('cities'), load('planet')
# España por celdas (es:<s>_<w>_<tamaño>) -> una sola lista, sin repetidos; las
# claves de pais entero de la primera vuelta (social_facility, orgs...) se suman.
_es, _seen = [], set()
for k in list(nat):
    if k.startswith('es:') or k in ('social_facility', 'amenities', 'orgs', 'hospital', 'healthcentre', 'named'):
        for e in nat.pop(k):
            if (e['type'], e['id']) not in _seen:
                _seen.add((e['type'], e['id'])); _es.append(e)
nat['named'] = _es
for d in (nat, cities, planet):
    take_meta(d)
os.chdir(ROOT)
json.dump(nat, open('raw_nat.json', 'w'))
json.dump(cities, open('raw_world.json', 'w'))
json.dump(planet, open('raw_planet.json', 'w'))
json.dump(meta, open('meta.json', 'w'))
for f in ('raw_world2.json', 'raw_world3.json', 'raw_world4.json', 'raw_world5.json', 'raw_world6.json',
          'raw_world7.json', 'raw_w200.json', 'raw_w300.json', 'raw_w500.json', 'raw_empty.json',
          'raw_es.json', 'raw_es2.json'):
    if os.path.exists(f):
        os.remove(f)
n = lambda d: sum(len(v) for v in d.values())
print('nat %d claves %d elementos | ciudades %d / %d | planeta %d celdas %d | fechas %d'
      % (len(nat), n(nat), len(cities), n(cities), len(planet), n(planet), len(meta)))
