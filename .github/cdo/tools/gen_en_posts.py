#!/usr/bin/env python3
"""Versiones en ingles de guias de viaje a partir de las traducciones en tr/*.en.json.
Plantilla: un post en ingles existente. Enlaza ES<->EN con hreflang y botones de idioma.
Uso: python3 gen_en_posts.py <raiz> <dir_traducciones>"""
import os, re, sys, json, html, glob, urllib.parse
from datetime import datetime
ROOT, TR = sys.argv[1], sys.argv[2]
SITE = 'https://www.carlosdeory.com'
TPL_SLUG = '5-to-8-or-9-to-12'
TPL = open(os.path.join(ROOT, TPL_SLUG, 'index.html')).read()
TPL_TITLE = 'Episode 2: 5 to 8 or 9 to 12, the Three Hours That Decide Your Life'
D = json.load(open('/home/claude/tools/data.json'))['posts']
CAT, CATN = 'travel-guides', 'Travel guides'
e = lambda s: html.escape(s, quote=True)
q = lambda s: urllib.parse.quote(s, safe='')
MONTHS = 'January February March April May June July August September October November December'.split()

items = []
for f in sorted(glob.glob(os.path.join(TR, '*.en.json'))):
    t = json.load(open(f)); src = json.load(open(f.replace('.en.json', '.json')))
    es_url = '/' + src['slug_es'] + '/'
    if es_url not in D: continue
    t['es_url'] = es_url; t['en_url'] = '/' + t['slug_en'].strip('/') + '/'; t['es'] = D[es_url]
    items.append(t)
json.dump([{'en': x['en_url'], 'es': x['es_url'], 'title': x['title'], 'desc': x['desc'], 'img': x['es'].get('img', '')} for x in items], open('/home/claude/tools/en_posts.json', 'w'), ensure_ascii=False)

ST = ('<style>.cdo-tldr{border-left:4px solid #0E4F49;background:#F1F6F4;border-radius:0 14px 14px 0;padding:14px 18px;margin:0 0 26px;font-size:17px;line-height:1.6}'
      '.cdo-tldr b{display:block;font:800 12px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#0E4F49;margin-bottom:8px}'
      '.cdo-tldr p{margin:0!important}.cdo-faq{margin-top:40px}.cdo-faq h2{font-size:26px;margin:0 0 10px}.cdo-faq details{border-top:1px solid #E6E1D8;padding:14px 0}'
      '.cdo-faq summary{cursor:pointer;font-weight:700;font-size:17px}.cdo-faq details p{margin:8px 0 0;color:#3A3A44}'
      '.cdo-lang{display:flex;justify-content:flex-end;margin:0 0 16px}.cdo-lang a{font:700 14px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;border:1.5px solid #E2DDD3;border-radius:100px;padding:8px 15px;text-decoration:none!important;color:#15151A!important;background:#FAF8F4}</style>')

def fmt_date(iso):
    try: d = datetime.fromisoformat(iso); return f'{MONTHS[d.month - 1]} {d.day}, {d.year}'
    except Exception: return ''

def card(x):
    img = x['es'].get('img') or ''
    media = f'<img loading="lazy" width="720" height="450" src="{e(img)}" class="attachment-ory-card size-ory-card wp-post-image" alt="{e(x["title"])}" decoding="async" />' if img else ''
    ex = x['desc'] if len(x['desc']) < 140 else x['desc'][:130].rsplit(' ', 1)[0] + '…'
    return (f'<article class="card post type-post status-publish format-standard has-post-thumbnail hentry category-{CAT}"> <div class="card-media"> {media} '
            f'<span class="chip on-photo">{CATN}</span> </div> <div class="card-body"> <h3>{e(x["title"])}</h3> <p class="ex">{e(ex)}</p> '
            f'<div class="meta"> <time datetime="{x["es"]["date"]}">{fmt_date(x["es"]["date"])}</time> <span>&middot;</span><span>{x["es"]["mins"]} min read</span> </div> </div> '
            f'<a class="stretch" href="{SITE}{x["en_url"]}"><span class="screen-reader-text">{e(x["title"])}</span></a> </article>')

def build(i, x):
    s = TPL; url = SITE + x['en_url']; es_abs = SITE + x['es_url']; title, desc = x['title'], x['desc']
    P = x['es']; pid = 40001 + i
    esh = open(os.path.join(ROOT, x['es_url'].strip('/'), 'index.html')).read()
    og = (re.search(r'<meta property="og:image" content="([^"]+)"', esh) or [None, P.get('og') or ''])[1]
    cover = (re.search(r'<div class="post-cover">.*?</div>', esh, re.S) or [None])[0] if re.search(r'<div class="post-cover">.*?</div>', esh, re.S) else ''
    s = re.sub(r'<title>.*?</title>', f'<title>{e(title)} - Carlos de Ory</title>', s, count=1, flags=re.S)
    s = re.sub(r'<meta name="description" content="[^"]*"', f'<meta name="description" content="{e(desc)}"', s, count=1)
    s = re.sub(r'<link rel="canonical" href="[^"]*"', f'<link rel="canonical" href="{url}"', s, count=1)
    s = re.sub(r'<meta property="og:title" content="[^"]*"', f'<meta property="og:title" content="{e(title)} - Carlos de Ory"', s, count=1)
    s = re.sub(r'<meta property="og:description" content="[^"]*"', f'<meta property="og:description" content="{e(desc)}"', s, count=1)
    s = re.sub(r'<meta property="og:url" content="[^"]*"', f'<meta property="og:url" content="{url}"', s, count=1)
    s = re.sub(r'<meta property="og:image" content="[^"]*"', f'<meta property="og:image" content="{e(og)}"', s, count=1)
    s = re.sub(r'<meta property="article:published_time" content="[^"]*"', f'<meta property="article:published_time" content="{P["date"]}"', s, count=1)
    s = re.sub(r'<meta property="article:modified_time" content="[^"]*"', '<meta property="article:modified_time" content="2026-10-24T20:00:00+00:00"', s, count=1)
    s = re.sub(r'<meta name="twitter:data2" content="[^"]*"', f'<meta name="twitter:data2" content="{P["mins"]} minutes"', s, count=1)
    s = re.sub(r'<link rel="alternate" hreflang="[^"]*" href="[^"]*" />\s*', '', s)
    s = s.replace(f'<link rel="canonical" href="{url}" />', f'<link rel="canonical" href="{url}" />\n<link rel="alternate" hreflang="en" href="{url}" />\n<link rel="alternate" hreflang="es" href="{es_abs}" />\n<link rel="alternate" hreflang="x-default" href="{es_abs}" />', 1)
    faq = [f for f in x.get('faq') or [] if len(f) == 2]
    graph = [{'@type': 'Article', '@id': url + '#article', 'headline': title, 'description': desc, 'image': og, 'datePublished': P['date'], 'dateModified': '2026-10-24T20:00:00+00:00',
              'inLanguage': 'en', 'mainEntityOfPage': url, 'articleSection': CATN, 'author': {'@type': 'Person', 'name': 'Carlos de Ory', 'url': SITE + '/about-me/'},
              'publisher': {'@type': 'Organization', 'name': 'Carlos de Ory', 'logo': {'@type': 'ImageObject', 'url': SITE + '/wp-content/uploads/2026/09/carlos-de-ory-icono-300x300.png'}},
              'translationOfWork': {'@id': es_abs}},
             {'@type': 'BreadcrumbList', 'itemListElement': [{'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE + '/'},
              {'@type': 'ListItem', 'position': 2, 'name': CATN, 'item': f'{SITE}/{CAT}/'}, {'@type': 'ListItem', 'position': 3, 'name': title, 'item': url}]}]
    if faq: graph.append({'@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': a, 'acceptedAnswer': {'@type': 'Answer', 'text': b}} for a, b in faq]})
    s = re.sub(r'<script type="application/ld\+json" class="yoast-schema-graph">.*?</script>',
               lambda m: '<script type="application/ld+json" class="yoast-schema-graph">' + json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False) + '</script>', s, count=1, flags=re.S)
    s = re.sub(r'postid-\d+', f'postid-{pid}', s, count=1)
    s = re.sub(r'<article class="post-\d+ post ([^"]*?)category-[\w-]+(\s[^"]*)?"', lambda m: f'<article class="post-{pid} post {m.group(1)}category-{CAT}"', s, count=1)
    hero = (f'<header class="post-hero"> <div class="read"> <nav class="ory-bc" aria-label="Breadcrumb"><a href="/">Home</a><span>›</span><a href="{SITE}/{CAT}/">{CATN}</a></nav>  '
            f'<a class="chip" href="{SITE}/{CAT}/"> {CATN} </a> <h1>{e(title)}</h1> <p class="dek">{e(desc)}</p> <div class="post-meta"> '
            f'<time datetime="{P["date"]}">{fmt_date(P["date"])}</time> <span>&middot;</span> <span>{P["mins"]} min read</span> </div> </div> </header>')
    s = re.sub(r'<header class="post-hero">.*?</header>', lambda m: hero, s, count=1, flags=re.S)
    s = re.sub(r'<div class="post-cover">.*?</div>', lambda m: cover.replace('loading="lazy"', 'loading="eager"'), s, count=1, flags=re.S)
    # entrada
    body = x['entry_html']
    body = re.sub(r'^\s*<div class="entry">', '', body)
    tl = f'<aside class="cdo-tldr" aria-label="In short"><b>In short</b><p>{e(x["tldr"])}</p></aside> ' if x.get('tldr') else ''
    sw = f'<p class="cdo-lang"><a href="{x["es_url"]}" lang="es" hreflang="es">Leer en español →</a></p> '
    fq = ('<div class="read cdo-faq"><h2>Frequently asked questions</h2>' + ''.join(f'<details><summary>{e(a)}</summary><p>{e(b)}</p></details>' for a, b in faq) + '</div><!--/cdo-faq--> ') if faq else ''
    j = s.find('<div class="entry">'); k = s.find('<div class="share">', j)
    s = s[:j] + '<div class="entry"> ' + ST + sw + tl + body + ' ' + fq + s[k:]
    t, u = q(title), q(url)
    sh = (f'<div class="share"> <span>Share</span> <a href="https://twitter.com/intent/tweet?url={u}&#038;text={t}" target="_blank" rel="noopener nofollow">X</a> '
          f'<a href="https://api.whatsapp.com/send?text={t}%20{u}" target="_blank" rel="noopener nofollow">WhatsApp</a> '
          f'<a href="https://www.facebook.com/sharer/sharer.php?u={u}" target="_blank" rel="noopener nofollow">Facebook</a> '
          f'<a href="mailto:?subject={t}&#038;body={u}" target="_blank" rel="noopener nofollow">Email</a> <button id="ory-copy" data-url="{url}">Copy link</button> </div>')
    s = re.sub(r'<div class="share">.*?</div>', lambda m: sh, s, count=1, flags=re.S)
    rel = [items[(i + d) % len(items)] for d in (1, 2, 3)]
    secrel = (f'<div class="sec"> <div class="sec-head"> <h2>Keep reading</h2> <a class="more" href="{SITE}/{CAT}/"> All travel guides in English &rarr; </a> </div> '
              f'<div class="grid g3"> {" ".join(card(r) for r in rel)} </div> </div>')
    s = re.sub(r'<div class="sec"> <div class="sec-head"> <h2>Keep reading</h2>.*?</article> </div> </div>', lambda m: secrel, s, count=1, flags=re.S)
    s = s.replace(f'alt="{TPL_TITLE}"', 'alt=""').replace(e(TPL_TITLE), e(title))
    s = s.replace('"visibility_show":"Mostrar","visibility_hide":"Ocultar"', '"visibility_show":"Show","visibility_hide":"Hide"')
    s = re.sub(r"value='\d+' id='comment_post_ID'", f"value='{pid}' id='comment_post_ID'", s)
    s = s.replace(f'/{TPL_SLUG}/', x['en_url']).replace(f'%2F{TPL_SLUG}%2F', q(x['en_url']))
    fp = os.path.join(ROOT, x['en_url'].strip('/'), 'index.html'); os.makedirs(os.path.dirname(fp), exist_ok=True)
    open(fp, 'w').write(s)
    left = [w for w in ('5-to-8', 'Episode 2', 'cdo-talkbox', 'Sigue leyendo') if w in s]
    if left: print('RESTOS', x['en_url'], left)
    # post en espanol: hreflang + boton "Read in English" (idempotente)
    esh = re.sub(r'<link rel="alternate" hreflang="[^"]*" href="[^"]*" />\s*', '', esh)
    esh = esh.replace(f'<link rel="canonical" href="{es_abs}" />', f'<link rel="canonical" href="{es_abs}" />\n<link rel="alternate" hreflang="es" href="{es_abs}" />\n<link rel="alternate" hreflang="en" href="{url}" />\n<link rel="alternate" hreflang="x-default" href="{es_abs}" />', 1)
    esh = re.sub(r'<p class="cdo-lang"[^>]*>.*?</p>\s?', '', esh, flags=re.S)
    jj = esh.find('<div class="entry">') + len('<div class="entry">')
    esh = esh[:jj] + f' <p class="cdo-lang" style="display:flex;justify-content:flex-end;margin:0 0 16px"><a href="{x["en_url"]}" lang="en" hreflang="en" style="font:700 14px -apple-system,BlinkMacSystemFont,sans-serif;border:1.5px solid #E2DDD3;border-radius:100px;padding:8px 15px;text-decoration:none;color:#15151A;background:#FAF8F4">Read in English →</a></p>' + esh[jj:]
    open(os.path.join(ROOT, x['es_url'].strip('/'), 'index.html'), 'w').write(esh)

for i, x in enumerate(items): build(i, x)
print(len(items), 'guias en ingles')
