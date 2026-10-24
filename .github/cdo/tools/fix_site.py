#!/usr/bin/env python3
"""Arreglos masivos idempotentes en carlosdeory.com (rama pub/carlosdeory.com). Uso: python3 fix_site.py <raiz>"""
import os, re, sys, json, html, collections
from urllib.parse import unquote

ROOT = sys.argv[1]
SITE = 'https://www.carlosdeory.com'
D = json.load(open('/home/claude/tools/data.json')); P = D['posts']
A = json.load(open('/home/claude/tools/archives.json'))
MISS = json.load(open('/home/claude/tools/missredir.json'))
CATP = {c: v['path'] for c, v in A['cat'].items()}
CATN = {c: v['name'] for c, v in A['cat'].items()}
CATCOUNT = {c: v['n'] for c, v in A['cat'].items()}
REGIONS = {'europa', 'asia', 'america', 'africa', 'oceania'}
NONTRAVEL = {'growth-marketing', 'emprender', 'digital-nomad', 'puntos-y-millas', 'episodios', 'episodes', 'consejos', '1'}
FEED = f'<link rel="alternate" type="application/rss+xml" title="Carlos de Ory" href="{SITE}/feed.xml" />'
stats = collections.Counter()

def specific(r):
    cs = [c for c in r['cats'] if c in CATP and c not in REGIONS and c not in NONTRAVEL]
    cs.sort(key=lambda c: CATCOUNT.get(c, 0))  # la mas concreta = la que tiene menos posts
    if cs: return cs[0]
    cs = [c for c in r['cats'] if c in CATP]
    return cs[0] if cs else None

def related(u, k=3):
    r = P[u]; sc = []
    sp = set(c for c in r['cats'] if c not in REGIONS and c != '1'); tg = set(r['tags']); rg = set(r['cats']) & REGIONS
    for v, s in P.items():
        if v == u: continue
        score = 3 * len(sp & set(s['cats'])) + len(tg & set(s['tags'])) + 0.5 * len(rg & set(s['cats']))
        if s['lang'][:2] != r['lang'][:2]: score -= 2
        if score > 0: sc.append((score, s['date'], v))
    sc.sort(reverse=True)
    return [v for _, _, v in sc[:k]]

def card_html(v):
    s = P[v]; c = re.sub(r'\s+', ' ', s.get('card') or '')
    t = html.escape(s['h1'])
    img = s.get('img') or ''
    if not c:
        media = f'<img width="720" height="450" src="{html.escape(img)}" class="attachment-ory-card size-ory-card wp-post-image" alt="{t}" decoding="async" loading="lazy" />' if img else ''
        ex = html.escape((s['desc'] or '')[:140].rsplit(' ', 1)[0]) + '&hellip;'
        sp = specific(s); chip = html.escape(CATN.get(sp, '')) if sp else ''
        return (f'<article class="card post"> <div class="card-media"> {media} <span class="chip on-photo">{chip}</span> </div> '
                f'<div class="card-body"> <h3>{t}</h3> <p class="ex">{ex}</p> <div class="meta"> <time datetime="{s["date"]}">{s["datefmt"]}</time> '
                f'<span>&middot;</span> <span>{s["mins"]} min de lectura</span> </div> </div> <a class="stretch" href="{SITE}{v}"> <span class="screen-reader-text">{t}</span> </a> </article>')
    if '<img' not in c.split('card-body')[0] and img:
        c = c.replace('<div class="card-media">', f'<div class="card-media"> <img width="720" height="450" src="{html.escape(img)}" class="attachment-ory-card size-ory-card wp-post-image" alt="{t}" decoding="async" loading="lazy" />', 1)
    return c.replace(' fetchpriority="high"', '').replace('loading="eager"', 'loading="lazy"')

def fix_links(h):
    def rep(m):
        q, url = m.group(1), m.group(2)
        path = re.sub(r'^https?://(www\.)?carlosdeory\.com', '', url)
        p0 = path.split('#')[0].split('?')[0]
        if p0 in MISS:
            stats['link_missing_post'] += 1
            return f'href={q}{SITE}{MISS[p0]}{q}'
        if re.match(r'^/(comments/)?feed/?$', p0) or re.match(r'^/[^/]+/feed/?$', p0):
            stats['link_feed'] += 1
            return f'href={q}{SITE}/feed.xml{q}'
        return m.group(0)
    return re.sub(r'href=(["\'])((?:https?://(?:www\.)?carlosdeory\.com)?/[^"\']*)\1', rep, h)

def alt_fill(h, fallback):
    def rep(m):
        tag = m.group(0)
        if re.search(r'\salt=(["\'])[^"\']+\1', tag): return tag
        if 'gravatar' in tag: return tag
        t = re.search(r'\stitle="([^"]+)"', tag)
        if t: alt = t.group(1)
        else:
            src = re.search(r'\ssrc="([^"]+)"', tag)
            name = unquote(src.group(1).rsplit('/', 1)[-1]).rsplit('.', 1)[0] if src else ''
            name = re.sub(r'-\d+x\d+$', '', name)
            words = re.sub(r'[-_]+', ' ', name).strip()
            if re.search(r'[a-zA-Záéíóúñ]{3,}', words) and not re.match(r'^(img|dsc|image|captura|screenshot|photo|foto|wp|pexels|unsplash|pixabay)\b', words.lower()) and not re.search(r'\d{5,}', words):
                alt = words[:1].upper() + words[1:]
            else:
                alt = fallback
        stats['alt_added'] += 1
        alt = html.escape(html.unescape(alt), quote=True)
        tag = re.sub(r'\salt=(["\'])\1', '', tag)
        return tag.replace('<img', f'<img alt="{alt}"', 1)
    return re.sub(r'<img\b[^>]*>', rep, h)

def process(fp, rel):
    h = open(fp, errors='ignore').read(); o = h
    url = '/' + rel[:-len('index.html')] if rel.endswith('index.html') else '/' + rel
    # 1. feeds en <head>
    head_end = h.find('</head>')
    if head_end > 0:
        head = h[:head_end]
        if head.count('application/rss+xml') == 1 and FEED in head: head2 = head
        else:
            head2 = re.sub(r'<link rel="alternate" type="application/rss\+xml"[^>]*>\s*', '', head)
            if FEED not in head2: head2 = head2.rstrip() + '\n' + FEED + '\n'
        if head2 != head: h = head2 + h[head_end:]
    # 2. enlaces internos rotos y feeds
    h = fix_links(h)
    # 3. afiliados con URL codificada (rotos)
    h, n = re.subn(r'href="(https?%3A%2F%2F[^"]*)"', lambda m: f'href="{unquote(m.group(1))}"', h); stats['affiliate_decoded'] += n
    # 4. http -> https en dominios que lo soportan
    h, n = re.subn(r'(href|src)="http://(bit\.ly|www\.instagram\.com|instagram\.com|www\.youtube\.com|youtu\.be|www\.facebook\.com|twitter\.com|amzn\.to)/', r'\1="https://\2/', h); stats['https_upgrade'] += n
    r = P.get(url)
    if r:
        # 5. gravatar -> iniciales o foto de Carlos (sin peticiones a terceros)
        def grav(m):
            seg = h[m.end():m.end() + 400]
            nm = re.search(r'<h4>([^<]+)</h4>', seg)
            name = nm.group(1).strip() if nm else ''
            stats['gravatar_removed'] += 1
            if 'Carlos' in name and 'Ory' in name:
                return '<img alt="Carlos de Ory" src="/assets/cdo/carlos.jpg" class="avatar avatar-72 photo" height="72" width="72" loading="lazy" decoding="async" style="border-radius:50%;object-fit:cover"/>'
            ini = ''.join(w[0] for w in name.split()[:2]).upper() or 'CO'
            return f'<div class="ory-initials" aria-hidden="true">{html.escape(ini)}</div>'
        h = re.sub(r"<img alt='' src='https://secure\.gravatar\.com/[^>]*/>", grav, h)
        # 6. og:image generico -> primera imagen del articulo
        if r.get('img') and 'carlos-de-ory-og.jpg' in (re.search(r'property="og:image" content="([^"]+)"', h) or [''])[0]:
            imgabs = SITE + r['img']
            h = re.sub(r'<meta property="og:image" content="[^"]*" />', f'<meta property="og:image" content="{imgabs}" />', h, count=1)
            h = re.sub(r'<meta property="og:image:(?:width|height|type)" content="[^"]*" />\s*', '', h)
            if 'name="twitter:image"' not in h:
                h = h.replace('<meta name="twitter:card" content="summary_large_image" />', f'<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:image" content="{imgabs}" />', 1)
            stats['og_image'] += 1
        # 7. caja de afiliados duplicada (generica + la del pais)
        boxes = list(re.finditer(r'<div style="border: 3px solid #fce9a5;padding: 1\.2em;background-color: #faf4de[^"]*">(?:(?!<div).)*?</div>', h, re.S))
        if len(boxes) >= 2:
            gen = [b for b in boxes if 'Te ayudo a ahorrar en tu viaje:' in b.group(0)]
            spec = [b for b in boxes if re.search(r'Te ayudo a ahorrar en tu viaje (a|al|en) ', b.group(0))]
            if gen and spec:
                for b in reversed(gen): h = h[:b.start()] + h[b.end():]
                stats['dup_affiliate_box'] += len(gen)
        # 8. chip de categoria -> la mas concreta
        sp = specific(r)
        if sp:
            h = re.sub(r'(<header class="post-hero"> <div class="read"> <a class="chip" href=")[^"]*(">)\s*[^<]*?\s*(</a>)',
                       lambda m: f'{m.group(1)}{SITE}{CATP[sp]}{m.group(2)} {html.escape(CATN[sp])} {m.group(3)}', h, count=1)
        # 9. "Sigue leyendo" con articulos relacionados de verdad
        j = h.find('<div class="sec"> <div class="sec-head"> <h2>Sigue leyendo</h2>')
        if j > 0:
            g = h.find('<div class="grid g3">', j); depth = 0; end = None
            for m in re.finditer(r'<div\b|</div>', h[g:]):
                depth += 1 if m.group(0) == '<div' else -1
                if depth == 0: end = g + m.end(); break
            rel3 = related(url)
            if end and rel3:
                more = f'<a class="more" href="{SITE}{CATP[sp]}"> Todo sobre {html.escape(CATN[sp])} &rarr; </a>' if sp else '<a class="more" href="/destinos/"> Todos los destinos &rarr; </a>'
                block = (f'<div class="sec"> <div class="sec-head"> <h2>Sigue leyendo</h2> {more} </div> '
                         f'<div class="grid g3"> ' + ' '.join(card_html(v) for v in rel3) + ' </div>')
                h = h[:j] + block + h[end:]
                stats['related'] += 1
        # 10. alt en imagenes
        h = alt_fill(h, r['h1'])
    else:
        t = re.search(r'<h1[^>]*>(.*?)</h1>', h, re.S)
        h = alt_fill(h, html.unescape(re.sub('<[^>]+>', '', t.group(1))).strip() if t else 'Carlos de Ory')
    # 12. pie: newsletter y growth marketing
    if '<ul id="menu-pie" class="menu">' in h and 'menu-item-nl' not in h:
        es_ = '<html lang="es' in h[:400]
        add = (f'<li class="menu-item menu-item-nl"><a href="https://www.carlosdeory.com/{"newsletter" if es_ else "the-newsletter"}/">Newsletter</a></li> '
               + ('<li class="menu-item menu-item-gm"><a href="https://www.carlosdeory.com/growth-marketing/">Growth marketing</a></li> ' if es_ else ''))
        h = h.replace('<ul id="menu-pie" class="menu">', '<ul id="menu-pie" class="menu">' + add, 1)
    # 13. pie: ahora y glosario
    if '<ul id="menu-pie" class="menu">' in h and 'menu-item-now' not in h:
        es_ = '<html lang="es' in h[:400]
        add = (f'<li class="menu-item menu-item-now"><a href="https://www.carlosdeory.com/{"ahora" if es_ else "now"}/">{"Ahora" if es_ else "Now"}</a></li> '
               f'<li class="menu-item menu-item-gl"><a href="https://www.carlosdeory.com/{"glosario-puntos-y-millas" if es_ else "points-and-miles-glossary"}/">{"Glosario de millas" if es_ else "Miles glossary"}</a></li> ')
        h = h.replace('<ul id="menu-pie" class="menu">', '<ul id="menu-pie" class="menu">' + add, 1)
    # 11. biografia del autor en espanol en paginas en espanol
    if '<html lang="es' in h[:400]:
        h = h.replace('Founder since 2013. I write about travel, points and miles, and building companies from Sumba.', 'Fundador desde 2013. Escribo sobre viajes, puntos y millas, y sobre cómo monto empresas desde Sumba.')
    if h != o:
        open(fp, 'w').write(h); stats['files'] += 1

for d, _, fs in os.walk(ROOT):
    if '.git' in d: continue
    for f in fs:
        if f.endswith('.html'):
            fp = os.path.join(d, f); process(fp, os.path.relpath(fp, ROOT))
print(dict(stats))
