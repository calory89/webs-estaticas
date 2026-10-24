#!/usr/bin/env python3
"""Genera los articulos de growth marketing (growth_articles.py) como posts del blog,
usando un post existente como plantilla. Uso: python3 gen_posts.py <raiz>"""
import os, re, sys, json, html, urllib.parse
sys.path.insert(0, '/home/claude/tools')
from growth_articles import ARTICLES
from PIL import Image, ImageDraw, ImageFont
ROOT = sys.argv[1]
SITE = 'https://www.carlosdeory.com'
TPL_SLUG = 'de-5-a-8-o-de-9-a-12'
TPL = open(os.path.join(ROOT, TPL_SLUG, 'index.html')).read()
CAT, CATN = 'growth-marketing', 'Growth marketing'
DATE_ISO, DATE_FMT = '2026-10-24T09:00:00+02:00', '24 octubre, 2026'
DATE_UTC = '2026-10-24T07:00:00+00:00'
e = lambda s: html.escape(s, quote=True)
q = lambda s: urllib.parse.quote(s, safe='')

def inline(t):
    t = e(t).replace('&quot;', '"')
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', lambda m: f'<a href="{m.group(2)}">{m.group(1)}</a>', t)
    return t

def md(body):
    out, lst = [], []
    def flush():
        if lst: out.append('<ul>' + ''.join(f'<li>{inline(x)}</li>' for x in lst) + '</ul>'); lst.clear()
    for block in re.split(r'\n\s*\n', body.strip()):
        for line in block.strip().split('\n'):
            line = line.strip()
            if line.startswith('- '): lst.append(line[2:]); continue
            flush()
            if line.startswith('### '): out.append(f'<h3>{inline(line[4:])}</h3>')
            elif line.startswith('## '):
                h = line[3:]; sid = re.sub(r'[^a-z0-9]+', '-', h.lower().translate(str.maketrans('áéíóúñü', 'aeiounu'))).strip('-')
                out.append(f'<h2 id="{sid}">{inline(h)}</h2>')
            elif line: out.append(f'<p>{inline(line)}</p>')
        flush()
    return '\n'.join(out)

def words(body): return len(re.findall(r'\w+', body))

FB = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
FS = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def cover(slug, title, W=1200, H=630, suf=''):
    k = W / 1200
    d = os.path.join(ROOT, 'assets/cdo/growth-covers'); os.makedirs(d, exist_ok=True)
    im = Image.new('RGB', (W, H), (14, 79, 73)); dr = ImageDraw.Draw(im)
    dr.rectangle([0, H - int(30 * k), W, H], fill=(194, 69, 45))
    small = ImageFont.truetype(FS, int(26 * k))
    if not suf: dr.text((80 * k, 70 * k), 'GROWTH MARKETING', font=small, fill=(244, 241, 234))
    avail = H - 270 * k
    for size in [int(x * k * (1.25 if suf else 1)) for x in (64, 58, 52, 46, 42)]:
        f = ImageFont.truetype(FB, size); lines, cur = [], ''
        for w in title.split():
            t = (cur + ' ' + w).strip()
            if dr.textlength(t, font=f) > W - 160 * k: lines.append(cur); cur = w
            else: cur = t
        lines.append(cur)
        if len(lines) * size * 1.25 <= avail: break
    y = (170 if suf else 150) * k + (avail - len(lines) * size * 1.25) / 2
    for l in lines: dr.text((80 * k, y), l, font=f, fill=(255, 255, 255)); y += size * 1.25
    dr.text((80 * k, H - 100 * k), 'Carlos de Ory', font=small, fill=(244, 241, 234))
    p = f'/assets/cdo/growth-covers/{slug}{suf}.jpg'
    im.save(os.path.join(ROOT, p.strip('/')), quality=82, optimize=True, progressive=True)
    return p

def card(a, img, mins):
    url = f'{SITE}/{a["slug"]}/'
    ex = a['desc'] if len(a['desc']) < 150 else a['desc'][:140].rsplit(' ', 1)[0] + '&hellip;'
    return (f'<article class="card post type-post status-publish format-standard has-post-thumbnail hentry category-{CAT}"> <div class="card-media"> '
            f'<img loading="lazy" width="720" height="450" src="{img}" class="attachment-ory-card size-ory-card wp-post-image" alt="{e(a["title"])}" decoding="async" /> '
            f'<span class="chip on-photo">{CATN}</span> </div> <div class="card-body"> <h3>{e(a["title"])}</h3> <p class="ex">{e(ex) if "&hellip;" not in ex else e(ex[:-8]) + "&hellip;"}</p> '
            f'<div class="meta"> <time datetime="{DATE_ISO}">{DATE_FMT}</time> <span>&middot;</span><span>{mins} min de lectura</span> </div> </div> '
            f'<a class="stretch" href="{url}"><span class="screen-reader-text">{e(a["title"])}</span></a> </article>')

CTA = ('<aside class="cdo-house cdo-growthbox"><p><b>¿Lo aplicamos a tu negocio?</b> Con mi equipo montamos campañas, webs y embudos que se miden por coste por cliente, no por clics.</p>'
       '<p><a href="/agencia/#calc">Calcula tu coste por cliente</a> &nbsp;·&nbsp; <a href="/agencia/">Ver cómo trabajamos</a></p></aside>')

info = {}
for i, a in enumerate(ARTICLES):
    info[a['slug']] = dict(img=cover(a['slug'], a['title']), card=cover(a['slug'], a['title'], 720, 450, '-card'), mins=max(3, round(words(a['body']) / 200)), pid=30001 + i)

def build(i, a):
    s = TPL; slug = a['slug']; url = f'{SITE}/{slug}/'; I = info[slug]; title = a['title']; desc = a['desc']
    img = I['img']; mins = I['mins']; pid = I['pid']
    # head
    s = re.sub(r'<title>.*?</title>', f'<title>{e(title)} - Carlos de Ory</title>', s, 1, re.S)
    s = re.sub(r'<meta name="description" content="[^"]*"', f'<meta name="description" content="{e(desc)}"', s, 1)
    s = re.sub(r'<link rel="canonical" href="[^"]*"', f'<link rel="canonical" href="{url}"', s, 1)
    s = re.sub(r'<meta property="og:title" content="[^"]*"', f'<meta property="og:title" content="{e(title)} - Carlos de Ory"', s, 1)
    s = re.sub(r'<meta property="og:description" content="[^"]*"', f'<meta property="og:description" content="{e(desc)}"', s, 1)
    s = re.sub(r'<meta property="og:url" content="[^"]*"', f'<meta property="og:url" content="{url}"', s, 1)
    s = re.sub(r'<meta property="article:(published|modified)_time" content="[^"]*"', lambda m: f'<meta property="article:{m.group(1)}_time" content="{DATE_UTC}"', s)
    s = re.sub(r'<meta property="og:image" content="[^"]*"', f'<meta property="og:image" content="{SITE}{img}"', s, 1)
    s = re.sub(r'<meta name="twitter:data2" content="[^"]*"', f'<meta name="twitter:data2" content="{mins} minutos"', s, 1)
    s = re.sub(r'<link rel="alternate" hreflang="[^"]*" href="[^"]*" />\s*', '', s)
    ld = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'Article', '@id': url + '#article', 'headline': title, 'description': desc, 'image': SITE + img, 'datePublished': DATE_ISO, 'dateModified': DATE_ISO,
         'inLanguage': 'es-ES', 'mainEntityOfPage': url, 'articleSection': CATN, 'wordCount': words(a['body']),
         'author': {'@type': 'Person', 'name': 'Carlos de Ory', 'url': SITE + '/quien-soy/'},
         'publisher': {'@type': 'Organization', 'name': 'Carlos de Ory', 'logo': {'@type': 'ImageObject', 'url': SITE + '/wp-content/uploads/2026/09/carlos-de-ory-icono-300x300.png'}}},
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Inicio', 'item': SITE + '/'},
            {'@type': 'ListItem', 'position': 2, 'name': CATN, 'item': f'{SITE}/{CAT}/'},
            {'@type': 'ListItem', 'position': 3, 'name': title, 'item': url}]}]}
    s = re.sub(r'<script type="application/ld\+json" class="yoast-schema-graph">.*?</script>',
               lambda m: '<script type="application/ld+json" class="yoast-schema-graph">' + json.dumps(ld, ensure_ascii=False) + '</script>', s, 1, re.S)
    # body / article
    s = re.sub(r'postid-\d+', f'postid-{pid}', s, 1)
    s = re.sub(r'<article class="post-\d+ post ([^"]*?)category-[\w-]+(\s[^"]*)?"', lambda m: f'<article class="post-{pid} post {m.group(1)}category-{CAT}"', s, 1)
    # hero
    hero = (f'<header class="post-hero"> <div class="read"> <nav class="ory-bc" aria-label="Migas de pan"><a href="/">Inicio</a><span>›</span><a href="{SITE}/{CAT}/">{CATN}</a></nav>  '
            f'<a class="chip" href="{SITE}/{CAT}/"> {CATN} </a> <h1>{e(title)}</h1> <p class="dek">{e(desc)}</p> <div class="post-meta"> '
            f'<time datetime="{DATE_ISO}">{DATE_FMT}</time> <span>&middot;</span> <span>{mins} min de lectura</span> </div> </div> </header>')
    s = re.sub(r'<header class="post-hero">.*?</header>', lambda m: hero, s, 1, re.S)
    s = re.sub(r'<div class="post-cover">.*?</div>', lambda m: f'<div class="post-cover"><img width="1200" height="630" src="{img}" class="attachment-ory-hero size-ory-hero wp-post-image" alt="{e(title)}" decoding="async" fetchpriority="high" loading="eager" style="height:auto" /></div>', s, 1, re.S)
    # entry + caja (sustituye la caja de charlas)
    j = s.find('<div class="entry">'); k = s.find('</aside>', s.find('<aside class="cdo-house cdo-talkbox"')) + len('</aside>')
    st = s.find('<style>.cdo-house', j)
    style = s[st:s.find('</style>', st) + 8]
    entry = f'<div class="entry"> {md(a["body"])} </div> {style}{CTA}'
    s = s[:j] + entry + s[k:]
    # compartir
    t = q(title); u = q(url)
    sh = (f'<div class="share"> <span>Compartir</span> <a href="https://twitter.com/intent/tweet?url={u}&#038;text={t}" target="_blank" rel="noopener nofollow">X</a> '
          f'<a href="https://api.whatsapp.com/send?text={t}%20{u}" target="_blank" rel="noopener nofollow">WhatsApp</a> '
          f'<a href="https://www.facebook.com/sharer/sharer.php?u={u}" target="_blank" rel="noopener nofollow">Facebook</a> '
          f'<a href="mailto:?subject={t}&#038;body={u}" target="_blank" rel="noopener nofollow">Email</a> <button id="ory-copy" data-url="{url}">Copiar enlace</button> </div>')
    s = re.sub(r'<div class="share">.*?</div>', lambda m: sh, s, 1, re.S)
    # relacionados: 3 siguientes de la serie
    rel = [ARTICLES[(i + d) % len(ARTICLES)] for d in (1, 2, 3)]
    cards = ' '.join(card(r, info[r['slug']]['card'], info[r['slug']]['mins']) for r in rel)
    secrel = (f'<div class="sec"> <div class="sec-head"> <h2>Sigue leyendo</h2> <a class="more" href="{SITE}/{CAT}/"> Todo sobre {CATN} &rarr; </a> </div> '
              f'<div class="grid g3"> {cards} </div> </div>')
    s = re.sub(r'<div class="sec"> <div class="sec-head"> <h2>Sigue leyendo</h2>.*?</article> </div> </div>', lambda m: secrel, s, 1, re.S)
    s = s.replace('alt="Episodio 2: De 5 a 8 o de 9 a 12, las tres horas que deciden tu vida"', 'alt=""')
    s = s.replace("value='20077' id='comment_post_ID'", f"value='{pid}' id='comment_post_ID'")
    s = s.replace(f'/{TPL_SLUG}/', f'/{slug}/').replace(f'%2F{TPL_SLUG}%2F', f'%2F{slug}%2F')
    fp = os.path.join(ROOT, slug, 'index.html'); os.makedirs(os.path.dirname(fp), exist_ok=True)
    open(fp, 'w').write(s)
    left = [x for x in ('de-5-a-8', 'chinchón', '20077', 'cdo-talkbox', '5-to-8') if x in s]
    if left: print('RESTOS', slug, left)

for i, a in enumerate(ARTICLES): build(i, a)
json.dump({a['slug']: info[a['slug']] | {'title': a['title'], 'desc': a['desc']} for a in ARTICLES}, open('/home/claude/tools/growth_posts.json', 'w'), ensure_ascii=False)
print(len(ARTICLES), 'posts')
