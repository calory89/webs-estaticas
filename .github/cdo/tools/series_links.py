#!/usr/bin/env python3
"""Enlaza entre si los posts que forman serie o compiten por la misma busqueda (idempotente). Uso: python3 series_links.py <raiz>"""
import os, re, sys, json, html
ROOT = sys.argv[1]
D = json.load(open('/home/claude/tools/data.json'))['posts']
GROUPS = [
 ('Esta guía tiene dos partes', ['/que-ver-en-taipei/', '/que-visitar-en-taipei-parte-2/']),
 ('Esta guía tiene dos partes', ['/mercadillos-de-la-region-de-murcia/', '/mercadillos-de-la-region-de-murcia-ii/']),
 ('Esta guía tiene dos partes', ['/dusseldorf-que-ver-gratis/', '/dusseldorf-que-ver-gratis-parte-ii/']),
 ('Budapest según la época del año', ['/cosas-que-hacer-en-budapest/', '/10-cosas-que-hacer-en-budapest-en-otono/', '/budapest-en-invierno-10-cosas-que-hacer/']),
 ('Edimburgo según los días que tengas', ['/que-ver-en-edimburgo-en-2-dias/', '/edimburgo-en-3-dias/']),
 ('Cracovia en invierno', ['/invierno-en-cracovia/', '/actividades-de-invierno-en-cracovia/']),
 ('Lisboa', ['/que-ver-y-hacer-en-lisboa/', '/cosas-que-hacer-gratis-en-lisboa/']),
]
n = 0
for title, urls in GROUPS:
    for u in urls:
        fp = os.path.join(ROOT, u.strip('/'), 'index.html')
        if not os.path.exists(fp) or u not in D: continue
        s = open(fp).read()
        s = re.sub(r'<nav class="cdo-series".*?</nav>\s?', '', s, flags=re.S)
        items = ''.join((f'<li><b>{html.escape(D[x]["h1"])}</b> (estás aquí)</li>' if x == u else f'<li><a href="{x}">{html.escape(D[x]["h1"])}</a></li>') for x in urls if x in D)
        box = (f'<nav class="cdo-series" aria-label="{html.escape(title)}" style="border:1px solid #E6E1D8;border-radius:14px;padding:14px 18px;margin:0 0 24px;background:#FAF8F4;font-size:16px">'
               f'<b style="display:block;margin-bottom:6px">{html.escape(title)}:</b><ul style="margin:0;padding-left:20px">{items}</ul></nav> ')
        i = s.find('<div class="entry">')
        if i < 0: continue
        i += len('<div class="entry">')
        s = s[:i] + ' ' + box + s[i:]
        open(fp, 'w').write(s); n += 1
print(n, 'posts enlazados en serie')
