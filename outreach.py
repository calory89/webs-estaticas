# -*- coding: utf-8 -*-
# Lista de entidades del mapa con correo publico en OpenStreetMap, para invitarlas
# a confirmar horario y telefono en un minuto («reclama tu ficha»). Solo sitios
# que estan en el mapa (d/*.json), con su pais y su enlace de actualizacion.
import json, os, csv, math, re
h = open('index.full.html' if os.path.exists('index.full.html') else 'index.html', encoding='utf-8').read()
CITIES = json.loads(re.search(r'const CITIES = /\*__CITIES__\*/(\[.*?\]);', h, re.S).group(1))
STR = json.loads(re.search(r'const STR = /\*__STR__\*/(\[.*?\]);', h, re.S).group(1))
S_ = lambda v: STR[v] if isinstance(v, int) else v
ids = {}
for f in os.listdir('d'):
    if not f.endswith('.json'): continue
    la = lo = 0
    for r in json.load(open('d/' + f, encoding='utf-8')):
        la += r[1]; lo += r[2]; oid = r[5]
        key = ('way/%d' % -oid if oid < 0 else 'node/%d' % oid) if isinstance(oid, int) else oid
        ids[key] = (S_(r[0]), la / 1e5, lo / 1e5, r[7] if len(r) > 7 else '', r[8] if len(r) > 8 else '')
grid = {}
for c in CITIES: grid.setdefault((int(c[1] // 3), int(c[2] // 3)), []).append(c)
def cc_of(la, lo):
    best, bd = '', 1e9
    for i in range(-1, 2):
        for j in range(-1, 2):
            for c in grid.get((int(la // 3) + i, int(lo // 3) + j), []):
                d = (la - c[1]) ** 2 + (lo - c[2]) ** 2
                if d < bd: bd, best = d, c[4]
    return best if bd < 9 else ''
out = {}
for f in ['raw_planet.json', 'raw_w500.json']:
    if not os.path.exists(f): continue
    d = json.load(open(f)); cells = d.values() if isinstance(d, dict) else [d]
    for els in cells:
        if isinstance(els, dict): els = els.get('elements', [])
        for e in els:
            t = e.get('tags') or {}
            em = (t.get('email') or t.get('contact:email') or '').strip().split(';')[0].strip()
            if not em or '@' not in em: continue
            key = '%s/%s' % (e.get('type'), e.get('id'))
            if key not in ids: continue
            nm, la, lo, oh, ph = ids[key]
            out[em.lower()] = [em, nm, key, cc_of(la, lo), 'yes' if oh else 'no', 'yes' if ph else 'no', t.get('website') or t.get('contact:website') or '',
                               'https://supportnear.com/actualizar.html?id=' + key, 'https://supportnear.com/#p=%s@%.5f,%.5f' % (key, la, lo)]
rows = sorted(out.values(), key=lambda r: (r[3], r[1]))
with open('outreach.csv', 'w', encoding='utf-8', newline='') as f:
    w = csv.writer(f); w.writerow(['email', 'name', 'osm_id', 'country', 'has_hours', 'has_phone', 'website', 'update_url', 'map_url']); w.writerows(rows)
from collections import Counter
print('entidades con correo en el mapa:', len(rows), '| sin horario:', sum(1 for r in rows if r[4] == 'no'), '| paises:', Counter(r[3] for r in rows).most_common(8))
