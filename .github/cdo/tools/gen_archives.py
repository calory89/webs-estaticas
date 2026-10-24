#!/usr/bin/env python3
"""Regenera paginas de categoria y etiqueta de carlosdeory.com a partir de los posts reales.
Arregla: /europa/ inexistente, paginaciones rotas, recuentos inflados, etiquetas sin pagina, tarjetas sin foto.
Uso: python3 gen_archives.py <raiz_del_sitio>  (escribe tambien /home/claude/tools/archives.json)"""
import os, re, json, html, sys, math, shutil

ROOT = sys.argv[1]
D = json.load(open('/home/claude/tools/data.json'))
P = D['posts']; catname = D['catname']; tagname = D['tagname']
SITE = 'https://www.carlosdeory.com'
PER = 12

NAMES = {'pekin': 'Pekín', 'sidney': 'Sídney', 'camberra': 'Canberra', 'gold-coast': 'Gold Coast', 'paris': 'París',
 'niza': 'Niza', 'ciudad-de-mexico': 'Ciudad de México', 'ciudad-del-cabo': 'Ciudad del Cabo', 'saopaulo': 'São Paulo',
 'nueva-delhi': 'Nueva Delhi', 'munich': 'Múnich', 'milan': 'Milán', 'taipei': 'Taipéi', 'cadiz': 'Cádiz',
 'dusseldorf': 'Düsseldorf', 'santiago-de-chile': 'Santiago de Chile', 'la-coruna': 'La Coruña', 'el-salvador': 'El Salvador',
 'puerto-natales': 'Puerto Natales', 'nueva-zelanda': 'Nueva Zelanda', 'reinounido': 'Reino Unido', 'republicacheca': 'República Checa',
 'estados-unidos': 'Estados Unidos', 'corea-del-sur': 'Corea del Sur', 'hong-kong': 'Hong Kong', 'espana': 'España',
 'sudafrica': 'Sudáfrica', 'peru': 'Perú', 'mexico': 'México', 'canada': 'Canadá', 'turquia': 'Turquía', 'rumania': 'Rumanía',
 'hungria': 'Hungría', 'belgica': 'Bélgica', 'america': 'América', 'africa': 'África', 'oceania': 'Oceanía'}
NONTRAVEL = {'growth-marketing', 'emprender', 'digital-nomad', 'puntos-y-millas', 'episodios', 'episodes', 'consejos', '1', 'sin-categoria'}
REGIONS = {'europa', 'asia', 'america', 'africa', 'oceania'}

def cname(c):
    for k in (c, 'category/' + c):
        if k in catname: return catname[k]
    return NAMES.get(c, c.replace('-', ' ').title())

def esc(s): return html.escape(s, quote=True)

# --- ruta de cada categoria: la existente si hay pagina, si no /<slug>/ (si no choca con un post)
existing = {}
for d, _, fs in os.walk(ROOT):
    if '.git' in d or 'index.html' not in fs or '/page/' in d: continue
    rel = os.path.relpath(d, ROOT)
    h = open(os.path.join(d, 'index.html'), errors='ignore').read(4000)
    b = re.search(r'<body[^>]*class="([^"]*)"', open(os.path.join(d, 'index.html'), errors='ignore').read())
    if b and ' category ' in ' ' + b.group(1) + ' ':
        m = re.search(r'category-([\w-]+) category-\d+', b.group(1))
        if m: existing[m.group(1)] = '/' + rel + '/'
posts_by_cat = {}; posts_by_tag = {}
for u, r in P.items():
    for c in r['cats']: posts_by_cat.setdefault(c, []).append(u)
    for t in r['tags']: posts_by_tag.setdefault(t, []).append(u)
catpath = {}
for c in posts_by_cat:
    if c in ('1',): continue
    if c == 'consejos': catpath[c] = '/consejos/'; continue
    if c in existing: catpath[c] = existing[c]; continue
    cand = '/' + c + '/'
    if cand in P: continue
    catpath[c] = cand

TPL = open(os.path.join(ROOT, 'asia/index.html')).read()
HEAD_END = TPL.find('</head>')
MAIN_S = TPL.find('<main id="main">'); MAIN_E = TPL.find('</main>') + 7
NEWS = re.search(r'<div class="sec"> <div class="news".*?</div> </div>', re.sub(r'\s+', ' ', TPL[MAIN_S:MAIN_E]))
NEWS = NEWS.group(0) if NEWS else ''


THEMES = [('Dónde dormir', r'dormir|hotel|alojamiento|hospedarse|hostel|albergue'),
          ('Comer y beber', r'comer|restaurante|brunch|caf[eé]|cerveza|cervecer|vino|tapas|gastronom|platos|vegan|kebab|mercado'),
          ('Cómo llegar y moverse', r'llegar|aeropuerto|transporte|moverte|moverse|coche|tren|bus|vuelo|visado|bici'),
          ('Fiestas y temporadas', r'fiesta|festival|navidad|carnaval|oto[ñn]o|invierno|verano|primavera|marzo|diciembre|san valent|halloween'),
          ('Vivir, estudiar y trabajar', r'vivir|estudiar|trabajar|mudar|n[oó]mada|idiomas|erasmus|empleo'),
          ('Qué ver y qué hacer', r'qu[eé] ver|qu[eé] hacer|imprescindible|lugares|planes|cosas que|visitar|ruta|paseo|en un d[ií]a|en \d+ d[ií]as|museo|palacio|catedral|mezquita|templo|castillo|iglesia|parque|playa|barrio')]
def guide_block(name, urls):
    groups = []
    used = set()
    for label, rx in THEMES:
        items = [u for u in urls if u not in used and re.search(rx, P[u]['h1'].lower())]
        if len(items) >= 2:
            items = items[:6]; used.update(items); groups.append((label, items))
    groups.sort(key=lambda g: 0 if g[0].startswith('Qué ver') else 1)
    if len(groups) < 2: return ''
    cols = ''.join(f'<div><h3 style="font-size:15px;letter-spacing:.06em;text-transform:uppercase;margin:0 0 10px;color:var(--o-acc,#C2452D)">{esc(l)}</h3><ul style="list-style:none;padding:0;margin:0;display:grid;gap:8px">' +
                   ''.join(f'<li><a href="{u}" style="color:inherit">{esc(P[u]["h1"])}</a></li>' for u in it) + '</ul></div>' for l, it in groups)
    return (f'<div class="sec tight cdo-guide"><h2 style="margin:0 0 18px">Guía rápida de {esc(name)}</h2>'
            f'<div style="display:grid;gap:26px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">{cols}</div></div> ')

def most_specific(r):
    cs = [c for c in r['cats'] if c not in REGIONS and c not in NONTRAVEL and c != '1']
    if cs: return cs[-1]
    return r['cats'][0] if r['cats'] else ''

def card(u):
    r = P[u]; c = r.get('card') or ''
    img = r.get('img') or ''
    chip = esc(cname(most_specific(r))) if most_specific(r) else ''
    title = esc(r['h1'])
    if not c:
        ex = esc((r['desc'] or '')[:140].rsplit(' ', 1)[0]) + '&hellip;'
        media = f'<img width="720" height="450" src="{esc(img)}" class="attachment-ory-card size-ory-card wp-post-image" alt="{title}" decoding="async" loading="lazy" />' if img else ''
        c = (f'<article class="card post"> <div class="card-media"> {media} <span class="chip on-photo">{chip}</span> </div> '
             f'<div class="card-body"> <h3>{title}</h3> <p class="ex">{ex}</p> <div class="meta"> <time datetime="{esc(r["date"])}">{esc(r["datefmt"])}</time> '
             f'<span>&middot;</span> <span>{r["mins"]} min de lectura</span> </div> </div> '
             f'<a class="stretch" href="{SITE}{u}"> <span class="screen-reader-text">{title}</span> </a> </article>')
    else:
        c = re.sub(r'\s+', ' ', c)
        if '<img' not in c.split('card-body')[0] and img:
            c = c.replace('<div class="card-media">', f'<div class="card-media"> <img width="720" height="450" src="{esc(img)}" class="attachment-ory-card size-ory-card wp-post-image" alt="{title}" decoding="async" loading="lazy" />', 1)
        # nunca fetchpriority/eager en listados: lo pone la primera tarjeta
        c = c.replace(' fetchpriority="high"', '').replace('loading="eager"', 'loading="lazy"')
        if '<img' in c and 'alt=""' in c: c = c.replace('alt=""', f'alt="{title}"', 1)
    return c

def pagination(base, n, cur):
    if n <= 1: return ''
    def href(i): return f'{SITE}{base}' + ('' if i == 1 else f'page/{i}/')
    parts = []
    if cur > 1: parts.append(f'<a class="prev page-numbers" href="{href(cur-1)}" aria-label="Anterior">&larr;</a>')
    shown = sorted({1, n, cur - 1, cur, cur + 1} & set(range(1, n + 1)))
    last = 0
    for i in shown:
        if i - last > 1: parts.append('<span class="page-numbers dots">&hellip;</span>')
        parts.append(f'<span aria-current="page" class="page-numbers current">{i}</span>' if i == cur else f'<a class="page-numbers" href="{href(i)}">{i}</a>')
        last = i
    if cur < n: parts.append(f'<a class="next page-numbers" href="{href(cur+1)}" aria-label="Siguiente">&rarr;</a>')
    return ('<nav class="navigation pagination" aria-label="Paginación de entradas"> <h2 class="screen-reader-text">Paginación de entradas</h2> '
            '<div class="nav-links">' + ' '.join(parts) + '</div> </nav>')

def build(base, kind, slug, name, urls, desc, index, parent=None):
    urls = sorted(urls, key=lambda u: P[u]['date'], reverse=True)
    n = max(1, math.ceil(len(urls) / PER)); out = []
    for i in range(1, n + 1):
        chunk = urls[(i - 1) * PER:i * PER]
        path = base if i == 1 else f'{base}page/{i}/'
        title = f'{name} - Página {i} de {n} - Carlos de Ory' if i > 1 else (f'{name}: guías de viaje y consejos - Carlos de Ory' if kind == 'cat' and slug not in NONTRAVEL else f'{name} - Carlos de Ory')
        robots = 'index, follow, max-image-preview:large' if (index and i == 1) else 'noindex, follow'
        head = TPL[:HEAD_END]
        head = re.sub(r"<meta name='robots'[^>]*>", f"<meta name='robots' content='{robots}' />", head)
        head = re.sub(r'<title>.*?</title>', f'<title>{esc(title)}</title>', head, flags=re.S)
        d2 = desc if i == 1 else f'{desc} Página {i} de {n}.'
        head = re.sub(r'<meta name="description" content="[^"]*" />', f'<meta name="description" content="{esc(d2)}" />', head)
        head = re.sub(r'<meta property="og:description" content="[^"]*" />', f'<meta property="og:description" content="{esc(d2)}" />', head)
        head = re.sub(r'<link rel="canonical" href="[^"]*" />', f'<link rel="canonical" href="{SITE}{path}" />', head)
        head = re.sub(r'<link rel="(?:next|prev)" href="[^"]*" />\s*', '', head)
        rel = ''
        if i > 1: rel += f'<link rel="prev" href="{SITE}{base if i == 2 else base + "page/" + str(i-1) + "/"}" />\n'
        if i < n: rel += f'<link rel="next" href="{SITE}{base}page/{i+1}/" />\n'
        head = head.replace(f'<link rel="canonical" href="{SITE}{path}" />', f'<link rel="canonical" href="{SITE}{path}" />\n' + rel)
        head = re.sub(r'<meta property="og:title" content="[^"]*" />', f'<meta property="og:title" content="{esc(title)}" />', head)
        head = re.sub(r'<meta property="og:url" content="[^"]*" />', f'<meta property="og:url" content="{SITE}{path}" />', head)
        head = re.sub(r'<link rel="alternate" type="application/rss\+xml"[^>]*>\s*', '', head)
        head = re.sub(r'<script type="application/ld\+json" class="yoast-schema-graph">.*?</script>', '', head, flags=re.S)
        head = re.sub(r'<script type="application/ld\+json">\{"@context": "https://schema.org", "@graph": \[\{"@type": "CollectionPage".*?</script>\n?', '', head, flags=re.S)
        crumbs = [{'@type': 'ListItem', 'position': 1, 'name': 'Inicio', 'item': SITE + '/'}]
        if parent: crumbs.append({'@type': 'ListItem', 'position': 2, 'name': parent[1], 'item': SITE + parent[0]})
        crumbs.append({'@type': 'ListItem', 'position': len(crumbs) + 1, 'name': name, 'item': SITE + base})
        ld = {'@context': 'https://schema.org', '@graph': [
            {'@type': 'CollectionPage', '@id': SITE + path, 'url': SITE + path, 'name': title, 'description': d2, 'inLanguage': 'es',
             'isPartOf': {'@id': SITE + '/#website'},
             'mainEntity': {'@type': 'ItemList', 'numberOfItems': len(chunk), 'itemListElement': [
                 {'@type': 'ListItem', 'position': k + 1, 'url': SITE + u, 'name': P[u]['h1']} for k, u in enumerate(chunk)]}},
            {'@type': 'BreadcrumbList', 'itemListElement': crumbs}]}
        head += '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + '</script>\n'
        body_cls = (f'archive category category-{slug}' if kind == 'cat' else f'archive tag tag-{slug}') + (' paged' if i > 1 else '') + ' wp-embed-responsive wp-theme-ory-theme'
        rest = TPL[HEAD_END:MAIN_S]
        rest = re.sub(r'<body class="[^"]*">', f'<body class="{body_cls}">', rest)
        cards = ' '.join(card(u) for u in chunk)
        if i == 1 and cards:
            cards = cards.replace('loading="lazy"', 'loading="eager" fetchpriority="high"', 1)
        label = 'Categoría' if kind == 'cat' else 'Etiqueta'
        h1html = (f'<span>{esc(name)}</span>: guías de viaje' if (kind == 'cat' and slug not in NONTRAVEL) else f'{label}: <span>{esc(name)}</span>')
        crumb_html = f'<a href="/">Inicio</a> &rsaquo; ' + (f'<a href="{parent[0]}">{esc(parent[1])}</a> &rsaquo; ' if parent else '') + esc(name)
        main = (f'<main id="main"> <div class="wrap"> <div class="page-hero"> <span class="eyebrow">{crumb_html}</span> '
                f'<h1>{h1html}</h1> <p>{esc(desc)}</p> </div> ' +
                (guide_block(name, urls) if (kind == 'cat' and i == 1 and slug not in NONTRAVEL and len(urls) >= 6) else '') + f'<div class="sec tight"> <div class="grid g3"> {cards} </div> {pagination(base, n, i)} </div> {NEWS} </div> </main>')
        doc = head + rest + main + TPL[MAIN_E:]
        fp = os.path.join(ROOT, path.strip('/'), 'index.html')
        os.makedirs(os.path.dirname(fp), exist_ok=True)
        open(fp, 'w').write(doc)
        out.append(path)
    return out

made = {'cat': {}, 'tag': {}}
REGION_OF = {}
for u, r in P.items():
    for c in r['cats']:
        if c in REGIONS: REGION_OF.setdefault(u, c)
for c, path in sorted(catpath.items()):
    urls = posts_by_cat[c]; name = cname(c)
    old = ''
    fp = os.path.join(ROOT, path.strip('/'), 'index.html')
    if os.path.exists(fp):
        m = re.search(r'<meta name="description" content="([^"]*)"', open(fp, errors='ignore').read())
        old = html.unescape(m.group(1)) if m else ''
    if c == 'growth-marketing':
        desc = f'Growth marketing explicado claro: coste por cliente, Google Ads, Meta Ads, SEO, landing pages y embudos. {len(urls)} artículos prácticos de Carlos de Ory.'
    elif c in NONTRAVEL and old:
        desc = re.sub(r'\d[\d.]* artículos', f'{len(urls)} artículos', old)
    else:
        desc = f'Guías de viaje de {name}: qué ver, dónde comer, dónde dormir y trucos para ahorrar. {len(urls)} artículo{"s" if len(urls) != 1 else ""} para preparar tu viaje.'
    parent = None
    if c not in REGIONS:
        regs = [REGION_OF[u] for u in urls if u in REGION_OF]
        if regs:
            rg = max(set(regs), key=regs.count)
            if rg in catpath: parent = (catpath[rg], cname(rg))
    made['cat'][c] = {'path': path, 'n': len(urls), 'pages': build(path, 'cat', c, name, urls, desc, len(urls) >= 3, parent), 'name': name}
for t, urls in sorted(posts_by_tag.items()):
    name = tagname.get(t, t.replace('-', ' '))
    desc = f'Artículos de Carlos de Ory sobre {name}: {len(urls)} artículo{"s" if len(urls) != 1 else ""}.'
    made['tag'][t] = {'path': f'/tag/{t}/', 'n': len(urls), 'pages': build(f'/tag/{t}/', 'tag', t, name, urls, desc, False), 'name': name}
json.dump(made, open('/home/claude/tools/archives.json', 'w'), ensure_ascii=False)
print('categorias', len(made['cat']), 'paginas', sum(len(v['pages']) for v in made['cat'].values()))
print('etiquetas', len(made['tag']), 'paginas', sum(len(v['pages']) for v in made['tag'].values()))
