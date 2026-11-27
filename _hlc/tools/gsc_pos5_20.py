#!/usr/bin/env python3
"""Revisión de consultas en posición 5-20 (ronda 5, #184).

Lee una exportación de Search Console (JSON con filas {keys: [page, query], impressions, clicks, position},
la que devuelve GOOGLE_SEARCH_CONSOLE_SEARCH_ANALYTICS_QUERY con dimensions=[page, query]) y lista, por página,
las consultas en posición 5-20 con impresiones cuyo texto NO está en el <title> ni en el <h1> de la página publicada
en esta rama. Esa es la lista de trabajo de cada ronda: título/H1/H2 o FAQ con la consulta literal.

Uso: python3 _hlc/tools/gsc_pos5_20.py gsc.json [min_impresiones] > informe.md
"""
import json
import os
import re
import sys
import unicodedata

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))


def norm(s):
    s = unicodedata.normalize('NFD', s or '').encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()


def head_text(path):
    f = os.path.join(ROOT, path.strip('/'), 'index.html') if path.strip('/') else os.path.join(ROOT, 'index.html')
    if not os.path.isfile(f):
        return None
    t = open(f, encoding='utf-8', errors='ignore').read(200000)
    ti = re.search(r'<title>(.*?)</title>', t, re.S)
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', t, re.S)
    return norm(re.sub(r'<[^>]+>', ' ', (ti.group(1) if ti else '') + ' ' + (h1.group(1) if h1 else '')))


def main():
    rows = json.load(open(sys.argv[1]))
    mi = int(sys.argv[2]) if len(sys.argv) > 2 else 8
    by = {}
    for r in rows:
        page, q = r['keys']
        if not (5 <= r['position'] <= 20) or r['impressions'] < mi:
            continue
        path = re.sub(r'^https?://(www\.)?happylowcost\.com', '', page)
        by.setdefault(path, []).append((r['impressions'], round(r['position'], 1), r['clicks'], q))
    out = []
    for path, L in sorted(by.items(), key=lambda kv: -sum(x[0] for x in kv[1])):
        ht = head_text(path)
        if ht is None:
            continue
        miss = [x for x in sorted(L, reverse=True) if not all(w in ht.split() for w in norm(x[3]).split() if len(w) > 2)]
        if miss:
            out.append(f'- `{path}`: ' + '; '.join(f'"{q}" ({i} impr., pos. {p})' for i, p, c, q in miss[:4]))
    print(f'# Consultas en posición 5-20 que no están en el título ni en el H1 ({len(out)} páginas)\n')
    print('\n'.join(out))


if __name__ == '__main__':
    main()
