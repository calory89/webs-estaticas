#!/usr/bin/env python3
"""Convierte https://(www.)dominio/wp-content|wp-includes/... en rutas /wp-content/... (mismo origen tras el cambio)."""
import os, re, sys
root, dom = sys.argv[1], sys.argv[2]
rx = re.compile(r'(?:https?:)?(?:\\?/\\?/)(?:www\.)?' + re.escape(dom) + r'(\\?/(?:wp-content|wp-includes)\\?/)')
n = 0
for dp, _, fs in os.walk(root):
    for f in fs:
        if not f.endswith(('.html', '.css', '.js')): continue
        p = os.path.join(dp, f); s = open(p, encoding='utf-8', errors='surrogateescape').read()
        t = rx.sub(lambda m: m.group(1), s)
        if t != s: open(p, 'w', encoding='utf-8', errors='surrogateescape').write(t); n += 1
print(f'{root}: archivos={n}')
