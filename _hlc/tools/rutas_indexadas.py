"""Ronda 7 (#306): añade a _hlc/rutas_indexadas.txt las rutas que en los últimos 28 días de Search Console
han tenido algún clic o posición media <= 25 (misma regla que el fichero original). Solo añade, nunca quita:
quitar rutas del índice es una decisión aparte.

Uso: python3 _hlc/tools/rutas_indexadas.py paginas_gsc.json   (filas de la API con dimensions=['page'])"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
F = os.path.join(ROOT, '_hlc', 'rutas_indexadas.txt')
HUB = re.compile(r'^(a|desde|to|from|pais|country|mes|month|datos|data|escapadas|weekend-breaks|menos-de-50|under-50)$')


def main(path):
    rows = json.load(open(path, encoding='utf-8'))
    have = set()
    for ln in open(F, encoding='utf-8'):
        p = ln.split('#')[0].split()
        if len(p) == 2:
            have.add(' '.join(p))
    add = []
    for r in rows:
        u = r['keys'][0].replace('https://www.happylowcost.com', '')
        m = re.match(r'^/(vuelos|en/flights)/([a-z0-9-]+)/$', u)
        if not m or HUB.match(m.group(2)) or '-' not in m.group(2):
            continue
        lang = 'es' if m.group(1) == 'vuelos' else 'en'
        if not os.path.isfile(os.path.join(ROOT, m.group(1), m.group(2), 'index.html')):
            continue
        if r.get('clicks', 0) >= 1 or r.get('position', 99) <= 25:
            k = f'{lang} {m.group(2)}'
            if k not in have:
                add.append((k, r.get('clicks', 0), r.get('impressions', 0), round(r.get('position', 0), 1)))
    if add:
        with open(F, 'a', encoding='utf-8') as fh:
            fh.write('# Añadidas en la ronda 7 (GSC 31-oct a 27-nov-2026): algún clic o posición <= 25\n')
            for k, c, i, p in sorted(add):
                fh.write(f'{k}  # {c} clics, {i} impr., pos. {p}\n')
    print('añadidas', len(add))
    for a in sorted(add, key=lambda x: -x[2])[:15]:
        print(a)


if __name__ == '__main__':
    main(sys.argv[1])
