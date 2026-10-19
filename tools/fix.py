#!/usr/bin/env python3
"""Deja una copia de wget lista para Cloudflare Pages: quita '?ver=' de nombres y enlaces, borra páginas ?p=."""
import os, re, sys
root = sys.argv[1]
renamed = drop = 0
for dp, dn, fn in os.walk(root):
    for f in fn:
        if '?' not in f: continue
        p = os.path.join(dp, f); base = f.split('?', 1)[0]
        if base in ('index.html', '') or base.endswith('.php') or not base:
            os.remove(p); drop += 1; continue
        t = os.path.join(dp, base)
        if os.path.exists(t): os.remove(p); drop += 1
        else: os.rename(p, t); renamed += 1
q = re.compile(r'%3F[^"\'\s)<>]*')
fixed = 0
for dp, dn, fn in os.walk(root):
    for f in fn:
        if not f.endswith(('.html', '.css', '.js', '.xml')): continue
        p = os.path.join(dp, f)
        s = open(p, encoding='utf-8', errors='surrogateescape').read()
        n = q.sub('', s)
        if n != s: open(p, 'w', encoding='utf-8', errors='surrogateescape').write(n); fixed += 1
print(f'{root}: renombrados={renamed} borrados={drop} archivos_corregidos={fixed}')
