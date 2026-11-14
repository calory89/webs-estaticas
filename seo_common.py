# -*- coding: utf-8 -*-
"""Lo que comparten los generadores de paginas sueltas (QA en vivo, 27-oct-2026).

- clean_links(): enlaces a URL limpias. Cloudflare Pages responde 308 de
  /x.html a /x: cada enlace a .html era un salto de mas para Google y para el
  movil (M5). Tampoco se cuelga ?v= de los enlaces a paginas: las paginas ya
  se revalidan siempre y la ?v= solo creaba URLs duplicadas.
- set_csp(): una Content-Security-Policy en <meta> con la huella de cada
  <script> en linea (p1). Las paginas que ya traen la suya no se tocan.
- LANGS: los 20 idiomas de la app, con su locale de Open Graph (M4).
- EXONYM / RU_NAME / clean_local(): el nombre de la ciudad como se escribe en
  el idioma de la pagina (p5).
"""
import re, base64, hashlib

SITE = 'https://supportnear.com'
LANGS = [('en', 'en_US'), ('es', 'es_ES'), ('fr', 'fr_FR'), ('ar', 'ar_AR'), ('uk', 'uk_UA'), ('ro', 'ro_RO'),
         ('pl', 'pl_PL'), ('ru', 'ru_RU'), ('pt', 'pt_PT'), ('ur', 'ur_PK'), ('fa', 'fa_IR'), ('wo', 'wo_SN'),
         ('bm', 'bm_ML'), ('ti', 'ti_ER'), ('ps', 'ps_AF'), ('so', 'so_SO'), ('am', 'am_ET'), ('tr', 'tr_TR'),
         ('bn', 'bn_BD'), ('zh', 'zh_CN')]
RTL = {'ar', 'ur', 'fa', 'ps'}


def lang_url(code):
    """La portada es la version inglesa; cada otro idioma tiene /xx/ (M4)."""
    return SITE + '/' if code == 'en' else '%s/%s/' % (SITE, code)


def hreflang_links(sep=''):
    out = ['<link rel="alternate" hreflang="x-default" href="%s/">' % SITE]
    out += ['<link rel="alternate" hreflang="%s" href="%s">' % (c, lang_url(c)) for c, _ in LANGS]
    return sep.join(out)


# ---------------------------------------------------------------- URLs
_SEG = re.compile(r'(<script\b.*?</script>|<style\b.*?</style>|<!--.*?-->)', re.S | re.I)


def clean_url(v):
    absu = v.startswith(SITE + '/')
    if not absu and re.match(r'^(?:[a-z][a-z0-9+.-]*:|//|#)', v, re.I):
        return v
    frag = ''
    if '#' in v:
        v, frag = v.split('#', 1); frag = '#' + frag
    q = ''
    if '?' in v:
        v, q = v.split('?', 1)
    if not v.endswith('.html'):
        return v + (('?' + q) if q else '') + frag
    p = v[:-5]
    if p == 'index' or p.endswith('/index'):
        p = p[:-5]
    if p == '':
        p = './'
    amp = '&amp;' if '&amp;' in q else '&'
    ps = [x for x in re.split(r'&amp;|&', q) if x and not x.startswith('v=')] if q else []
    return p + (('?' + amp.join(ps)) if ps else '') + frag


def clean_links(html):
    """href/src a .html -> URL limpia, fuera de <script>/<style>/comentarios."""
    parts = _SEG.split(html)
    fix = lambda t: re.sub(r'(\b(?:href|src)=")([^"]*\.html[^"]*)"', lambda m: m.group(1) + clean_url(m.group(2)) + '"', t)
    return ''.join(p if i % 2 else fix(p) for i, p in enumerate(parts))


def clean_abs(u):
    """Para canonical, hreflang, og:url, JSON-LD y sitemap."""
    return clean_url(u) if u.startswith(SITE + '/') else u


# ---------------------------------------------------------------- CSP
import analytics_snip as _an
CSP_BASE = ("default-src 'self'; script-src 'self' https://static.cloudflareinsights.com " + _an.CSP_SCRIPT + "{H}; "
            "style-src 'self' 'unsafe-inline'; img-src 'self' data: " + _an.CSP_IMG + "; connect-src 'self' https://cloudflareinsights.com " + _an.CSP_CONNECT + "; "
            "frame-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'")
CSP_MARK = 'data-sn="csp"'


def set_csp(s):
    if 'http-equiv="Content-Security-Policy"' in s and CSP_MARK not in s:
        return s
    s = _an.add(s)                      # GA4 + Clarity (R20)
    hashes = ["'sha256-%s'" % base64.b64encode(hashlib.sha256(m.group(1).encode('utf-8')).digest()).decode()
              for m in re.finditer(r'<script(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>(.*?)</script>', s, re.S)]
    tag = '<meta http-equiv="Content-Security-Policy" %s content="%s">' % (CSP_MARK, CSP_BASE.replace('{H}', ''.join(' ' + h for h in hashes)))
    s2 = re.sub(r'<meta http-equiv="Content-Security-Policy" %s content="[^"]*">' % CSP_MARK, lambda m: tag, s)
    if s2 == s and CSP_MARK not in s:
        s2 = re.sub(r'(<meta charset="utf-8">)', lambda m: m.group(1) + tag, s, count=1, flags=re.I)
    return s2


def add_main(html):
    """R22: toda pagina suelta lleva su zona principal marcada (lectores de pantalla saltan a ella).
    Si el <body> empieza por la caja de la pagina (<div class="wrap">), esa caja es la zona
    principal; si no, se envuelve el contenido en <main>."""
    if '<main' in html or 'role="main"' in html or '<body' not in html:
        return html
    # R23: si la caja lleva dentro la cabecera (<header>) o el pie (<footer>), la zona principal va
    # entre los dos y no en la caja entera: un <header>/<footer> dentro de la zona principal deja de
    # ser cabecera y pie para los lectores de pantalla (axe: landmark-*-is-top-level, 5.939 paginas).
    m = re.search(r'<body[^>]*>\s*<div class="(?:wrap|w)"[^>]*>', html)
    if m:
        rest = html[m.end():]
        fpos = rest.find('<footer')
        hend = rest.find('</header>')
        if fpos >= 0 or hend >= 0:
            a = (hend + len('</header>')) if (hend >= 0 and (fpos < 0 or hend < fpos)) else 0
            b = fpos if fpos > a else -1
            if b < 0:
                end = re.search(r'</div>\s*(?:<script\b[^>]*>.*?</script>\s*)*</body>', rest, re.S)
                b = end.start() if end and end.start() > a else -1
            if b > a:
                return html[:m.end()] + rest[:a] + '<main>' + rest[a:b] + '</main>' + rest[b:]
    h2 = re.sub(r'(<body[^>]*>\s*<div class="(?:wrap|w)")', lambda m: m.group(1) + ' role="main"', html, count=1)
    if h2 != html:
        return h2
    return re.sub(r'(<body[^>]*>)(.*)(</body>)', lambda m: m.group(1) + '<main>' + m.group(2) + '</main>' + m.group(3), html, count=1, flags=re.S)


def finalize(html):
    """Lo ultimo antes de escribir una pagina suelta."""
    return set_csp(clean_links(add_main(html)))


# ---------------------------------------------------------------- nombres
EXONYM = {'Wien': 'Vienna', 'München': 'Munich', 'Köln': 'Cologne', 'Nürnberg': 'Nuremberg', 'Napoli': 'Naples',
          'Roma': 'Rome', 'Milano': 'Milan', 'Lisboa': 'Lisbon', 'București': 'Bucharest', 'İstanbul': 'Istanbul',
          'Brussel': 'Brussels', 'København': 'Copenhagen', 'Göteborg': 'Gothenburg', 'Tiranë': 'Tirana', 'Rīga': 'Riga',
          'Sevilla': 'Seville', 'Ciudad de Guatemala': 'Guatemala City', 'Hà Nội': 'Hanoi',
          'Thành phố Hồ Chí Minh': 'Ho Chi Minh City', 'Québec': 'Quebec City'}
RU_NAME = {'Мінск': 'Минск', 'Віцебск': 'Витебск', 'Гродна': 'Гродно', 'Магілёў': 'Могилёв', 'Брэст': 'Брест',
           'Бабруйск': 'Бобруйск', 'Ақтөбе': 'Актобе', 'Қарағанды': 'Караганда', 'Өскемен': 'Усть-Каменогорск',
           'Қызылорда': 'Кызылорда', 'Ақтау': 'Актау'}
_ARABIC = r'[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]'


def clean_local(local, lang, latin):
    """«ⵟⴰⵕⴰⴱⵍⵓⵙ طرابلس Tripoli» -> «طرابلس» en una pagina arabe; «Магілёў» ->
    «Могилёв» en una rusa; sin tifinagh en los titulos."""
    if not local:
        return local
    if lang == 'ru' and local in RU_NAME:
        return RU_NAME[local]
    toks = [t for t in re.split(r'[\s;]+', local) if t and not re.search(r'[\u2D30-\u2D7F]', t)]
    if lang in ('ar', 'fa', 'ur'):                      # escritura arabe
        toks = [t for t in toks if re.search(_ARABIC, t)] or toks
    elif lang in ('uk', 'ru'):                          # cirilico
        toks = [t for t in toks if re.search(r'[\u0400-\u04FF]', t)] or toks
    elif lang == 'en':                                  # la etiqueta pequena junto al nombre ingles
        toks = [t for t in toks if t != latin] or toks
    else:                                               # es, fr, pt...: la forma latina
        toks = [t for t in toks if not re.search(r'[^\u0000-\u024F\u1E00-\u1EFF]', t)] or toks
    return ' '.join(toks).strip() or local


NONLATIN_LANGS = {'ar', 'fa', 'ur', 'uk', 'ru'}


def display_name(name, local, lang):
    """El nombre que va en titulos y h1, y el que va en pequeno al lado.
    En una pagina en espanol, frances o portugues, si las dos formas son
    latinas la buena es la de la lista (Córdoba, Panamá), no la inglesa
    (Cordoba, Panama City) que salia hasta ahora."""
    if lang != 'en' and local:
        loc = clean_local(local, lang, name)
        if lang not in NONLATIN_LANGS and not re.search(r'[^\u0000-\u024F\u1E00-\u1EFF]', loc):
            return name, ''
        return loc, name
    if lang == 'en' and name in EXONYM:
        return EXONYM[name], name
    return name, (clean_local(local, 'en', name) if local else '')
