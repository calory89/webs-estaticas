#!/usr/bin/env python3
"""Descarga del original los recursos locales que faltan (favicons, srcset, url() de CSS...)."""
import os, re, sys, urllib.request, urllib.parse
root, origin = sys.argv[1], sys.argv[2].rstrip('/')
pat = re.compile(r'''(?:src|href|data-src|data-bgset|data-bg|data-lazy-src|data-original|data-background|content)=["']([^"'#]+)["']|url\(\s*["']?([^"')]+)["']?\s*\)|(?:data-)?srcset=["']([^"']+)["']''')
miss = set()
for dp, _, fs in os.walk(root):
    for f in fs:
        if not f.endswith(('.html', '.css')): continue
        p = os.path.join(dp, f); s = open(p, encoding='utf-8', errors='ignore').read()
        for m in pat.finditer(s):
            vals = [m.group(1) or m.group(2) or '']
            if m.group(3): vals = [x.strip().split(' ')[0] for x in m.group(3).split(',')]
            for v in vals:
                v = v.strip()
                if not v or v.startswith(('http:', 'https:', '//', 'data:', 'mailto:', 'tel:', 'javascript:', '#')): continue
                v = urllib.parse.unquote(v.split('?')[0])
                if not re.search(r'\.(png|jpe?g|gif|webp|svg|ico|css|js|woff2?|ttf|eot|mp4|webm|pdf|json)$', v, re.I): continue
                t = os.path.normpath(os.path.join(root, v.lstrip('/')) if v.startswith('/') else os.path.join(dp, v))
                if t.startswith(os.path.abspath(root)) or t.startswith(root):
                    if not os.path.exists(t): miss.add(t)
ok = 0
for t in sorted(miss):
    rel = os.path.relpath(t, root).replace(os.sep, '/')
    try:
        data = urllib.request.urlopen(urllib.request.Request(origin + '/' + urllib.parse.quote(rel), headers={'User-Agent': 'Mozilla/5.0'}), timeout=30).read()
        os.makedirs(os.path.dirname(t), exist_ok=True); open(t, 'wb').write(data); ok += 1
    except Exception: pass
print(f'{root}: faltaban={len(miss)} descargados={ok}')
