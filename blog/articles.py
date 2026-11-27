# -*- coding: utf-8 -*-
"""Registro y render de articulos, indice, autor, RSS y sitemap del blog."""
import json, re, os, io, html as H
from core import *

ARTS = []   # dicts
AUTHOR = {"@type": "Person", "name": "Carlos de Ory", "url": "https://www.carlosdeory.com", "sameAs": ["https://www.carlosdeory.com"]}
PUB = {"@type": "Organization", "name": "SupportNear", "url": SITE + "/", "logo": {"@type": "ImageObject", "url": SITE + "/icon-512.png"}}
CAT = {'es': {'need': 'Guías por necesidad', 'city': 'Ciudades y países', 'pro': 'Para profesionales y entidades',
              'data': 'Datos e informes', 'season': 'Temporada', 'help': 'Cómo ayudar'},
       'en': {'need': 'Guides by need', 'city': 'Cities and countries', 'pro': 'For professionals', 'data': 'Data and reports',
              'season': 'Seasonal', 'help': 'How to help'}}


def art(slug, lang, title, desc, body, faq=(), src=(), rel=(), alts=None, cat='need', pub='2026-11-27', upd=TODAY,
        h1=None, cta=None, kind='Article', noindex=False):
    ARTS.append(dict(slug=slug, lang=lang, title=title, desc=desc, body=body, faq=list(faq), src=list(src), rel=list(rel),
                     alts=alts or {}, cat=cat, pub=pub, upd=upd, h1=h1, cta=cta, kind=kind, noindex=noindex))


def by_slug(s):
    for a in ARTS:
        if a['slug'] == s: return a
    raise KeyError(s)


def render(a):
    lang = a['lang']; t = UI.get(lang, UI['en'])
    body, toc = md(a['body'])
    meta = '<p class="meta">%s %s · %s <a href="autor">Carlos de Ory</a></p>' % (esc(t['upd']), esc(fdate(a['upd'], lang)), esc(t['by'])) if t['by'] else \
           '<p class="meta">%s %s · <a href="autor">Carlos de Ory</a></p>' % (esc(t['upd']), esc(a['upd']))
    toc_html = ''
    if len(toc) >= 4:
        toc_html = '<p class="toc"><b>%s:</b> %s</p>' % (esc(t['in']), ' · '.join('<a href="#%s">%s</a>' % (i, inline(x)) for i, x in toc))
    cta = a['cta'] or ('../', t['map'])
    cta_html = '<div class="btns"><a class="btn btn--p" href="%s">%s</a><a class="btn" href="../c/">%s</a></div>' % (
        esc(cta[0]), esc(cta[1]), esc({'es': 'Ayuda por ciudad', 'en': 'Help by city', 'fr': 'Aide par ville', 'pt': 'Ajuda por cidade'}.get(lang, 'Help by city')))
    faq_html = ''
    if a['faq']:
        faq_html = '<h2 id="faq">%s</h2>' % esc(t['faq']) + ''.join(
            '<details class="faq"><summary>%s</summary><p>%s</p></details>' % (inline(q), inline(x)) for q, x in a['faq'])
    src_html = ''
    if a['src']:
        src_html = '<h2 id="fuentes">%s</h2><ul class="src">%s</ul>' % (esc(t['src']), ''.join(
            '<li><a href="%s" rel="noopener">%s</a></li>' % (esc(u), esc(x)) for x, u in a['src']))
    rel_html = ''
    rels = [by_slug(s) for s in a['rel'] if any(z['slug'] == s for z in ARTS)]
    if rels:
        rel_html = '<h2 id="mas">%s</h2><ul class="post">%s</ul>' % (esc(t['rel']), ''.join(
            '<li><a href="%s">%s</a><span>%s</span></li>' % (r['slug'], esc(r['title']), esc(r['desc'])) for r in rels))
    html_body = meta + toc_html + body + cta_html + faq_html + src_html + rel_html
    url = '%s/blog/%s' % (SITE, a['slug'])
    ld = [{"@context": "https://schema.org", "@type": a['kind'], "headline": a['title'][:110], "description": a['desc'],
           "inLanguage": lang, "datePublished": a['pub'], "dateModified": a['upd'], "author": AUTHOR, "publisher": PUB,
           "mainEntityOfPage": url, "image": SITE + "/social.jpg", "isPartOf": {"@type": "WebSite", "name": "SupportNear", "url": SITE + "/"}},
          {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
              {"@type": "ListItem", "position": 1, "name": "SupportNear", "item": SITE + "/"},
              {"@type": "ListItem", "position": 2, "name": t['blog'], "item": SITE + "/blog/"},
              {"@type": "ListItem", "position": 3, "name": a['title'], "item": url}]}]
    if a['faq']:
        ld.append({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": re.sub(r'\*\*|`', '', q),
             "acceptedAnswer": {"@type": "Answer", "text": re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', re.sub(r'\*\*|`', '', x))}} for q, x in a['faq']]})
    alts = {l: 'blog/' + s for l, s in a['alts'].items()}
    if alts: alts[lang] = 'blog/' + a['slug']
    crumbs = [('SupportNear', '../'), (t['blog'], './'), (a['title'], None)]
    return page(lang, 'blog/' + a['slug'], a['title'], a['desc'], html_body, h1=a['h1'], crumbs=crumbs, ld=ld,
                alts=alts or None, robots='noindex' if a['noindex'] else '')


INTRO = {
 'es': ('Guías de SupportNear', 'Guías prácticas para encontrar comida, una cama, una ducha, un médico o ayuda social gratis, y para quien quiere ayudar. Con los sitios reales del mapa.'),
 'en': ('SupportNear guides', 'Practical guides to finding free food, a bed, a shower, a doctor or social help, and for people who want to help. With the real places from the map.'),
}


def index_page():
    parts = []
    for lang, lab in (('es', 'En español'), ('en', 'In English'), ('other', 'Otros idiomas · Other languages')):
        arts = [a for a in ARTS if (a['lang'] == lang if lang != 'other' else a['lang'] not in ('es', 'en')) and not a['noindex']]
        if not arts: continue
        parts.append('<h2 id="%s">%s</h2>' % (lang, esc(lab)))
        cats = CAT.get(lang, None)
        if cats:
            for ck, cl in cats.items():
                sub = [a for a in arts if a['cat'] == ck]
                if not sub: continue
                parts.append('<h3>%s</h3><ul class="post">%s</ul>' % (esc(cl), ''.join(
                    '<li><a href="%s" hreflang="%s">%s</a><span>%s</span></li>' % (a['slug'], a['lang'], esc(a['title']), esc(a['desc'])) for a in sub)))
        else:
            parts.append('<ul class="post">%s</ul>' % ''.join(
                '<li><a href="%s" lang="%s" hreflang="%s"%s>%s</a><span lang="%s">%s</span></li>' % (
                    a['slug'], a['lang'], a['lang'], ' dir="rtl"' if a['lang'] in RTL else '', esc(a['title']), a['lang'], esc(a['desc'])) for a in arts))
    body = ('<p class="lede">%s</p><p class="note">%s</p>' % (esc(INTRO['es'][1]), esc(INTRO['en'][1])) +
            '<div class="btns"><a class="btn btn--p" href="../">Abrir el mapa</a><a class="btn" href="feed.xml">RSS</a><a class="btn" href="autor">Quién escribe</a></div>' +
            ''.join(parts))
    ld = [{"@context": "https://schema.org", "@type": "Blog", "name": "Guías de SupportNear", "url": SITE + "/blog/", "inLanguage": ["es", "en"],
           "publisher": PUB, "blogPost": [{"@type": "BlogPosting", "headline": a['title'][:110], "url": SITE + "/blog/" + a['slug'],
                                           "datePublished": a['pub'], "inLanguage": a['lang']} for a in ARTS if not a['noindex']]}]
    return page('es', 'blog/index', INTRO['es'][0], INTRO['es'][1], body, ld=ld, og_type='website')


def author_page():
    body = md("""
Carlos de Ory hace SupportNear: un mapa gratuito y sin ánimo de lucro de sitios donde cualquiera puede conseguir comida, una cama, una ducha, ropa o un médico gratis. Escribe estas guías a partir de los datos del mapa y de fuentes oficiales, que se citan al final de cada una.

## Cómo se hacen las guías

- Cada guía responde en la primera frase a lo que alguien busca, y después explica qué llevar, qué esperar y a quién llamar.
- Los sitios que aparecen salen de OpenStreetMap, el mapa abierto que mantienen voluntarios. Los datos se revisan cada mes y la fecha está en cada página.
- Las normas, teléfonos y fechas salen de páginas oficiales (BOE, ministerios, ayuntamientos). Si algo cambia, se corrige la guía y su fecha.
- No hay anuncios ni enlaces pagados. SupportNear no cobra a nadie.

## Contacto

Si un dato está mal, un sitio ha cerrado o tu entidad quiere salir en el mapa, escribe a hello@supportnear.com. Más sobre el proyecto en [Quién está detrás](../about) y en [carlosdeory.com](https://www.carlosdeory.com).

## English

Carlos de Ory builds SupportNear, a free, non-profit map of places where anyone can get free food, a bed, a shower, clothes or a doctor. He writes these guides from the map's data and official sources, cited at the end of each one. Corrections: hello@supportnear.com.
""")[0]
    ld = [{"@context": "https://schema.org", "@type": "ProfilePage", "mainEntity": AUTHOR, "url": SITE + "/blog/autor"}]
    return page('es', 'blog/autor', 'Carlos de Ory, autor de las guías', 'Quién escribe las guías de SupportNear y cómo se hacen: datos de OpenStreetMap y fuentes oficiales.',
                '<p class="lede">Quién escribe las guías y cómo se comprueban.</p>' + body,
                crumbs=[('SupportNear', '../'), ('Guías', './'), ('Autor', None)], ld=ld, og_type='profile')


def feed():
    items = sorted([a for a in ARTS if not a['noindex']], key=lambda a: (a['pub'], a['slug']), reverse=True)
    def rfc(d):
        import datetime
        return datetime.datetime.strptime(d, '%Y-%m-%d').strftime('%a, %d %b %Y 09:00:00 +0000')
    x = ['<?xml version="1.0" encoding="UTF-8"?>', '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>',
         '<title>SupportNear: guías</title>', '<link>%s/blog/</link>' % SITE,
         '<atom:link href="%s/blog/feed.xml" rel="self" type="application/rss+xml"/>' % SITE,
         '<description>Guías prácticas para encontrar ayuda gratis cerca: comida, cama, ducha, médico.</description>', '<language>es</language>']
    for a in items:
        x.append('<item><title>%s</title><link>%s/blog/%s</link><guid>%s/blog/%s</guid><pubDate>%s</pubDate><description>%s</description></item>' % (
            esc(a['title']), SITE, a['slug'], SITE, a['slug'], rfc(a['pub']), esc(a['desc'])))
    x.append('</channel></rss>')
    return '\n'.join(x) + '\n'


def sitemap():
    urls = [(SITE + '/blog/', TODAY), (SITE + '/blog/autor', TODAY)] + [(SITE + '/blog/' + a['slug'], a['upd']) for a in ARTS if not a['noindex']]
    x = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    x += ['<url><loc>%s</loc><lastmod>%s</lastmod></url>' % (u, d) for u, d in urls]
    x.append('</urlset>')
    return '\n'.join(x) + '\n'
