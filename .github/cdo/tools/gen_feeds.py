#!/usr/bin/env python3
"""Sitemaps de posts (con imagenes) y categorias + feed RSS real. Uso: gen_feeds.py <raiz> <fecha YYYY-MM-DD>"""
import os, re, sys, json, html
from email.utils import format_datetime
from datetime import datetime
ROOT, TODAY = sys.argv[1], sys.argv[2]
SITE = 'https://www.carlosdeory.com'
P = json.load(open('/home/claude/tools/data.json'))['posts']
A = json.load(open('/home/claude/tools/archives.json'))
x = html.escape
posts = sorted(P.values(), key=lambda r: r['date'], reverse=True)
out = ['<?xml version="1.0" encoding="UTF-8"?>',
       '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">']
for r in posts:
    fp = os.path.join(ROOT, r['url'].strip('/'), 'index.html')
    if not os.path.exists(fp): continue
    h = open(fp, errors='ignore').read()
    if re.search(r"<meta name='robots' content='noindex", h): continue
    imgs = []
    e = h[h.find('<div class="entry'):h.find('Sigue leyendo')]
    for m in re.finditer(r'<img\b[^>]*\ssrc="(/wp-content/uploads/[^"]+)"', e):
        if m.group(1) not in imgs: imgs.append(m.group(1))
    out.append(f'<url><loc>{SITE}{x(r["url"])}</loc><lastmod>{TODAY}</lastmod>' +
               ''.join(f'<image:image><image:loc>{SITE}{x(i)}</image:loc></image:image>' for i in imgs[:10]) + '</url>')
out.append('</urlset>')
open(os.path.join(ROOT, 'post-sitemap.xml'), 'w').write('\n'.join(out) + '\n')
cats = sorted((v for v in A['cat'].values() if v['n'] >= 3), key=lambda v: v['path'])
open(os.path.join(ROOT, 'category-sitemap.xml'), 'w').write(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    '\n'.join(f'<url><loc>{SITE}{x(v["path"])}</loc><lastmod>{TODAY}</lastmod></url>' for v in cats) + '\n</urlset>\n')
import os as _os
if _os.path.exists('/home/claude/tools/authors.json'):
    AU = json.load(open('/home/claude/tools/authors.json'))
    open(os.path.join(ROOT, 'author-sitemap.xml'), 'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        '\n'.join(f'<url><loc>{SITE}{x(p)}</loc><lastmod>{TODAY}</lastmod></url>' for p, n in sorted(AU.values()) if n >= 3) + '\n</urlset>\n')
for name in ('sitemap_index.xml', 'sitemap.xml'):
    open(os.path.join(ROOT, name), 'w').write(
        '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        ''.join(f'<sitemap><loc>{SITE}/{s}</loc><lastmod>{TODAY}</lastmod></sitemap>\n' for s in ('page-sitemap.xml', 'post-sitemap.xml', 'category-sitemap.xml', 'author-sitemap.xml')) +
        '</sitemapindex>\n')
# RSS
items = []
for r in posts[:40]:
    try: d = format_datetime(datetime.fromisoformat(r['date']))
    except Exception: d = ''
    img = f'<enclosure url="{SITE}{x(r["img"])}" type="image/{"png" if r["img"].lower().endswith(".png") else "jpeg"}" length="0"/>' if r.get('img') else ''
    items.append(f'<item><title>{x(r["h1"])}</title><link>{SITE}{x(r["url"])}</link><guid isPermaLink="true">{SITE}{x(r["url"])}</guid>'
                 f'<pubDate>{d}</pubDate><description>{x(r["desc"])}</description>{img}</item>')
open(os.path.join(ROOT, 'feed.xml'), 'w').write(
    '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n'
    f'<title>Carlos de Ory</title><link>{SITE}/</link><description>Viajes, puntos y millas, y cómo monto empresas desde Sumba.</description>'
    f'<language>es</language><atom:link href="{SITE}/feed.xml" rel="self" type="application/rss+xml"/>\n' + '\n'.join(items) + '\n</channel>\n</rss>\n')
print('posts en sitemap', len(out) - 3, 'categorias', len(cats), 'items rss', len(items))
