#!/usr/bin/env python3
"""Ronda 8 (#308): informe de Search Console por tipo de página (guías, rutas, hubs, chollos, posts antiguos...), ES y EN.
Uso: python3 _hlc/tools/gsc_tipos.py paginas_gsc.json   (exportación de GSC con dimensions=['page'], 28 días)
Sale una tabla Markdown: páginas con impresiones, clics, impresiones, CTR y posición media ponderada por impresiones."""
import json
import re
import sys

RULES = [
    ('EN guías', r'^/en/destinations/[^/]+/$'), ('EN hubs a destino', r'^/en/flights/(to|country)/'), ('EN hubs desde', r'^/en/flights/from/'),
    ('EN rutas', r'^/en/flights/[a-z0-9-]+-[a-z0-9-]+/$'), ('EN chollos', r'^/en/deals/'), ('EN otras', r'^/en/'),
    ('Guías', r'^/destinos/[^/]+/$'), ('Hubs a destino', r'^/vuelos/(a|pais)/'), ('Hubs desde', r'^/vuelos/desde/'), ('Rutas', r'^/vuelos/[a-z0-9-]+-[a-z0-9-]+/$'),
    ('Chollos e ideas', r'^/chollos/'), ('Otras de vuelos', r'^/vuelos/'), ('Portada', r'^/$'), ('Posts antiguos', r'^/[^/]+/$'), ('Resto', r'.'),
]


def kind(path):
    for k, rx in RULES:
        if re.search(rx, path):
            return k
    return 'Resto'


def main(fp):
    rows = json.load(open(fp, encoding='utf-8'))
    agg = {}
    for r in rows:
        u = r['keys'][0].replace('https://www.happylowcost.com', '').replace('https://happylowcost.com', '')
        a = agg.setdefault(kind(u), [0, 0, 0, 0.0])
        a[0] += 1
        a[1] += r['clicks']
        a[2] += r['impressions']
        a[3] += r['position'] * r['impressions']
    print('| Tipo | Páginas | Clics | Impresiones | CTR | Posición media |')
    print('|---|---:|---:|---:|---:|---:|')
    for k, (n, c, i, p) in sorted(agg.items(), key=lambda kv: -kv[1][2]):
        print(f'| {k} | {n} | {c} | {i} | {c / i * 100 if i else 0:.2f} % | {p / i if i else 0:.1f} |')


if __name__ == '__main__':
    main(sys.argv[1])
