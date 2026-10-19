#!/usr/bin/env python3
"""Guarda robots.txt y todos los sitemaps XML del original en la carpeta de la web (mismas rutas)."""
import os, re, sys, urllib.request, urllib.parse
root, origin = sys.argv[1], sys.argv[2].rstrip('/')
def get(u):
    try: return urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=30).read()
    except Exception: return None
def save(path, data):
    p = os.path.join(root, path.lstrip('/'))
    if p.endswith('/'): p += 'index.xml'
    os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'wb').write(data)
n = 0
r = get(origin + '/robots.txt')
todo = []
if r and b'<html' not in r[:500].lower():
    save('/robots.txt', r); n += 1
    todo += re.findall(r'(?im)^sitemap:\s*(\S+)', r.decode('utf8', 'ignore'))
todo += [origin + '/wp-sitemap.xml', origin + '/sitemap_index.xml', origin + '/sitemap.xml']
seen = set()
while todo:
    u = todo.pop()
    if u in seen or len(seen) > 500: continue
    seen.add(u); d = get(u)
    if not d or b'<' not in d[:200] or b'<html' in d[:500].lower(): continue
    path = urllib.parse.urlparse(u).path
    if not path.endswith('.xml') and not path.endswith('.xsl'): continue
    save(path, d); n += 1
    s = d.decode('utf8', 'ignore')
    for loc in re.findall(r'<loc>\s*([^<\s]+)\s*</loc>', s):
        loc = loc.replace('&amp;', '&')
        if loc.endswith('.xml'): todo.append(loc)
    for x in re.findall(r'href="([^"]+\.xsl[^"]*)"', s):
        todo.append(urllib.parse.urljoin(u, x.replace('&amp;', '&').split('?')[0]))
print(f'{root}: archivos={n}')
