#!/usr/bin/env python3
"""Paginas de contenido EN/ES de carlosdeory.com con la misma cabecera, estilos y pie que /growth/.
Uso: python3 gen_pages.py <raiz>  (lee PAGES de pages_content.py)"""
import os, re, sys, json, html
sys.path.insert(0, '/home/claude/tools')
from pages_content import PAGES
from extra_pages import EXTRA
PAGES = PAGES + EXTRA
ROOT = sys.argv[1]
SITE = 'https://www.carlosdeory.com'
SRC = open(os.path.join(ROOT, 'growth/index.html')).read()
STYLE = re.search(r'<style>.*?</style>', SRC, re.S).group(0)
ICON = re.search(r'<link rel="icon"[^>]*>', SRC).group(0)
NAV = {
 'en': [('/speaking/', 'Talks'), ('/growth/', 'Growth'), ('/book/', 'The book'), ('/destinos/', 'Travel'), ('/blog/', 'Blog'), ('/about-me/', 'About')],
 'es': [('/charlas/', 'Charlas'), ('/agencia/', 'Growth'), ('/libro/', 'El libro'), ('/destinos/', 'Viajes'), ('/blog/', 'Blog'), ('/quien-soy/', 'Sobre mí')]}
FOOT = {
 'en': [('/speaking/', 'Talks'), ('/growth/', 'Growth marketing'), ('/book/', 'The book'), ('/destinos/', 'Travel guides'), ('/archive/', 'All articles'), ('/press/', 'Press'), ('/#contact', 'Contact'), ('/aviso-legal/', 'Legal notice'), ('/politica-de-privacidad/', 'Privacy'), ('/politica-de-cookies/', 'Cookies'), ('/transparencia/', 'Affiliate disclosure')],
 'es': [('/charlas/', 'Charlas'), ('/agencia/', 'Growth marketing'), ('/libro/', 'El libro'), ('/destinos/', 'Guías de viaje'), ('/archive/', 'Todos los artículos'), ('/prensa/', 'Prensa'), ('/#contact', 'Contacto'), ('/aviso-legal/', 'Aviso legal'), ('/politica-de-privacidad/', 'Privacidad'), ('/politica-de-cookies/', 'Cookies'), ('/transparencia/', 'Transparencia')]}
e = lambda s: html.escape(s, quote=True)

def page(p, lang, other):
    t = p[lang]
    path = t['path']; alt = p[other]['path'] if other in p else None
    crumbs = t['crumbs']  # [(href, label), ...] ultimo sin href
    ld = [{'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': i + 1, 'name': n, **({'item': SITE + hr} if hr else {'item': SITE + path})} for i, (hr, n) in enumerate(crumbs)]}]
    if t.get('faq'):
        ld.append({'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in t['faq']]})
    if t.get('schema'): ld.append(t['schema'])
    hreflang = ''
    if alt:
        en_p, es_p = (path, alt) if lang == 'en' else (alt, path)
        hreflang = f'<link rel="alternate" hreflang="en" href="{SITE}{en_p}">\n<link rel="alternate" hreflang="es" href="{SITE}{es_p}">\n<link rel="alternate" hreflang="x-default" href="{SITE}{en_p}">\n'
    og = t.get('og', '/assets/cdo/og-growth.jpg')
    head = (f'<!doctype html>\n<html lang="{lang}">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            f'<title>{e(t["title"])} · Carlos de Ory</title>\n<meta name="description" content="{e(t["desc"])}">\n<link rel="canonical" href="{SITE}{path}">\n{hreflang}'
            f'<meta name="theme-color" content="#F3EFE6">\n{ICON}\n<meta property="og:type" content="website">\n<meta property="og:site_name" content="Carlos de Ory">\n'
            f'<meta property="og:title" content="{e(t["title"])}">\n<meta property="og:description" content="{e(t["desc"])}">\n<meta property="og:url" content="{SITE}{path}">\n'
            f'<meta property="og:image" content="{SITE}{og}">\n<meta property="og:locale" content="{"en_US" if lang == "en" else "es_ES"}">\n<meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@mrstartups">\n'
            '<link rel="preload" href="/assets/fonts/a972324267.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/fonts/dab710cf25.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/assets/fonts/fonts.css?v=1">\n'
            + ''.join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>\n' for x in ld) + STYLE +
            '\n<link rel="alternate" type="application/rss+xml" title="Carlos de Ory" href="https://www.carlosdeory.com/feed.xml" />\n<link rel="stylesheet" href="/assets/cdo/cdo-boost.css?v=4">\n</head>\n')
    sec = t['section']  # 'speaking' o 'growth' para marcar el menu
    menu = ''.join(f'<li><a href="{hr}"{" aria-current=\"page\"" if (sec == "speaking" and k == 0) or (sec == "growth" and k == 1) else ""}>{e(n)}</a></li>' for k, (hr, n) in enumerate(NAV[lang]))
    langs = (f'<div class="lang" role="group" aria-label="Language"><a href="{(path if lang == "en" else alt) or "/"}" lang="en" class="lgbtn" aria-current="{"true" if lang == "en" else "false"}">EN</a>'
             f'<a href="{(path if lang == "es" else alt) or "/"}" lang="es" class="lgbtn" aria-current="{"true" if lang == "es" else "false"}">ES</a></div>') if alt else ''
    header = (f'<body>\n<a class="skip" href="#main">{"Skip to content" if lang == "en" else "Saltar al contenido"}</a>\n<header class="top"><div class="wrap nav">\n'
              f'<a class="logo" href="/" aria-label="Carlos de Ory, home"><span class="mk" aria-hidden="true"><span>C</span><span>O</span></span>Carlos de Ory</a>\n'
              f'<ul class="menu">{menu}</ul>\n<div class="tools">{langs}<a class="btn solid sm" href="/#contact">{"Let&#x27;s talk" if lang == "en" else "Hablemos"}</a></div></div></header>\n')
    cr = '<nav class="crumbs" aria-label="Breadcrumb"><ol>' + ''.join(
        (f'<li><a href="{hr}">{e(n)}</a></li>' if hr else f'<li aria-current="page">{e(n)}</li>') for hr, n in crumbs) + '</ol></nav>'
    hero = (f'<section class="hero"><span class="eyebrow">{e(t["eyebrow"])}</span><h1>{e(t["h1"])}</h1><p>{t["lead"]}</p>'
            f'<p style="display:flex;flex-wrap:wrap;gap:12px;margin-top:22px">' + ''.join(f'<a class="btn {"solid" if i == 0 else "ghost"}" href="{hr}">{e(n)}</a>' for i, (hr, n) in enumerate(t['ctas'])) + '</p></section>')
    body = ''
    for s in t['sections']:
        body += f'<section class="sec"><h2>{e(s["h"])}</h2>{s["html"]}</section>'
    if t.get('faq'):
        body += f'<section class="sec"><h2>{"Questions" if lang == "en" else "Preguntas frecuentes"}</h2><div style="max-width:780px">' + ''.join(
            f'<details style="border-top:1px solid var(--line,#E6E1D8);padding:16px 0"><summary style="cursor:pointer;font-weight:700;font-size:17px">{e(q)}</summary><p style="margin:10px 0 0;color:var(--ink-2)">{e(a)}</p></details>' for q, a in t['faq']) + '</div></section>'
    body += (f'<section class="sec"><div class="card" style="padding:clamp(20px,4vw,36px)"><h2 style="margin-top:0">{e(t["end_h"])}</h2><p style="color:var(--ink-2)">{t["end_p"]}</p>'
             f'<p><a class="btn solid" href="{t["end_href"]}">{e(t["end_cta"])}</a></p></div></section>')
    foot = ('<footer class="foot"><div class="wrap"><nav aria-label="Footer">' + ''.join(f'<a href="{hr}">{e(n)}</a>' for hr, n in FOOT[lang]) +
            '</nav>© 2026 Carlos de Ory · Equinox Investment Group LLC · <a href="https://x.com/mrstartups" rel="me noopener">@mrstartups</a></div></footer>\n'
            '<style>.lgbtn{display:inline-flex;align-items:center;justify-content:center;min-width:38px;height:32px;border-radius:100px;font:700 12px var(--mono,monospace);text-decoration:none;color:inherit}.lgbtn[aria-current="true"]{background:var(--ink,#141418);color:#fff}</style>\n'
            '<script src="/assets/cdo/cdo-boost.js?v=11" defer></script>\n</body>\n</html>\n')
    doc = head + header + f'<main id="main" class="wrap">\n{cr}\n{hero}\n{body}\n</main>\n' + foot
    fp = os.path.join(ROOT, path.strip('/'), 'index.html')
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    open(fp, 'w').write(doc)
    return path

made = []
for p in PAGES:
    for lang, other in (('en', 'es'), ('es', 'en')):
        if lang in p: made.append(page(p, lang, other))
json.dump(made, open('/home/claude/tools/pages_made.json', 'w'))
print(len(made), 'paginas')
