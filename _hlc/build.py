#!/usr/bin/env python3
"""Aplica las mejoras de Happy Low Cost a todas las páginas estáticas (idempotente).
Uso: python3 hlc/build.py   (desde la raíz de la rama pub/happylowcost.com)
"""
import os, re, subprocess, json, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bk as BK

V = '21'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
files = subprocess.run(['git', 'ls-files', '-co', '--exclude-standard', '-z', '*.html'], capture_output=True).stdout.decode().split('\0')
files = [f for f in files if f and not f.startswith('en/') and os.path.exists(f)]  # la versión en inglés la genera gen_en.py con su propia cabecera
ONLY = os.environ.get('HLC_ONLY')
if ONLY:
    files = [f for f in files if f.startswith(ONLY)]

HEAD = (
    '<!--hlc-head-->'
    "<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}"
    "(function(){var v=null;try{v=localStorage.getItem('hlc_ck');}catch(e){}"
    "if(!v){var m=document.cookie.match(/(?:^|; )hlc_ck=(\\w+)/);v=m&&m[1];}"
    "var g=v==='granted'?'granted':'denied';"
    "gtag('consent','default',{ad_storage:g,analytics_storage:g,ad_user_data:g,ad_personalization:g,wait_for_update:500});"
    "gtag('set','ads_data_redaction',g!=='granted');})();</script>"
    f'<link rel="stylesheet" href="/hlc/hlc.css?v={V}">'
    '<link rel="icon" href="/hlc/brand/favicon.ico" sizes="any"><link rel="icon" type="image/svg+xml" href="/hlc/brand/icon.svg">'
    '<link rel="apple-touch-icon" href="/hlc/brand/icon-180.png"><link rel="manifest" href="/manifest.webmanifest">'
    '<link rel="alternate" type="application/rss+xml" title="Chollos Happy Low Cost" href="/chollos/feed.xml">'
    '<!--/hlc-head-->'
)
PARTS = os.environ.get('HLC_PARTIALS', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'partials'))
HEADER = '<!--hlc-header-->' + open(os.path.join(PARTS, 'header.html'), encoding='utf-8').read() + '<!--/hlc-header-->'
FOOTERX = '<!--hlc-footer-->' + open(os.path.join(PARTS, 'footer.html'), encoding='utf-8').read() + '<!--/hlc-footer-->'
TAIL = f'<!--hlc-tail--><script src="/hlc/hlc.js?v={V}" defer></script><!--/hlc-tail-->'
FOOT = (
    '<!--hlc-foot--><div class="hlc-foot">Happy Low Cost caza chollos de vuelos con salida desde todo el mundo desde 2012. '
    'Algunos enlaces son de afiliado: si reservas a través de ellos podemos recibir una pequeña comisión, sin coste extra para ti. '
    'Los precios publicados eran correctos en la fecha de cada oferta y pueden cambiar. '
    '<a href="/aviso-legal-datos-cookies/">Aviso legal, privacidad y cookies</a> · '
    '<a href="https://www.facebook.com/happylowcostofficialpage/" target="_blank" rel="noopener">Facebook</a></div><!--/hlc-foot-->'
)
DUP_GTM = re.compile(r"<script>\(function\(w,d,s,l,i\)\{w\[l\]=w\[l\]\|\|\[\];w\[l\]\.push\(\{'gtm\.start':\s*new Date\(\)\.getTime\(\),event:'gtm\.js'\}\);.*?'GTM-P57ZNGL'\);</script>", re.S)
AFF = re.compile(r'(kqzyfj\.com|anrdoezrs\.net|skyscanner\.pxf\.io|booking\.com/[^"\']*aid=|civitatis\.com/[^"\']*aid=|tradedoubler\.com|amzn\.to/|amazon\.[a-z.]+/[^"\']*tag=)')
A_TAG = re.compile(r'<a\s[^>]*>', re.S)
EBC_OLD = 'Compra una casa en el paraíso por solo 20,000€'
EBC_NEW = 'Tu casa en una isla paradisíaca, a una hora de Bali, desde 35.000€'


def strip_block(t, a, b):
    return re.sub(re.escape(a) + '.*?' + re.escape(b), '', t, flags=re.S)


def fix_rel(m):
    tag = m.group(0)
    href = re.search(r'href=["\']([^"\']+)', tag)
    if not href or not AFF.search(href.group(1)):
        return tag
    rel = re.search(r'\srel=(["\'])(.*?)\1', tag)
    if rel:
        vals = rel.group(2).split()
        for v in ('sponsored', 'nofollow'):
            if v not in vals:
                vals.append(v)
        return tag[:rel.start()] + ' rel="' + ' '.join(vals) + '"' + tag[rel.end():]
    return tag[:-1].rstrip('/').rstrip() + ' rel="sponsored nofollow">'




# ---------- chollos antiguos: aviso de caducado en el HTML (Google y usuarios sin JS lo ven) ----------
import datetime, html as _html, unicodedata as _ud
MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
try:
    _DL = json.load(open('hlc/destinos.json', encoding='utf-8'))
except Exception:
    _DL = []
_GUIDES = {p['s'] for p in _DL if p.get('g')}
OFFER_RX = re.compile(r'\d\s?€|€\s?\d|\bchollo|\bganga|por s[oó]lo|desde s[oó]lo|\bi/v\b', re.I)


def _sl(t):
    t = _ud.normalize('NFD', t or '').encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')


def _dest_of(title):
    t = '-' + _sl(title) + '-'
    best = None
    for p in _DL:
        for n in [p['s'], _sl(p['n'])] + list(p.get('a') or []):
            if n and len(n) > 3 and f'-{n}-' in t and (best is None or len(n) > best[1]):
                best = (p, len(n))
    return best[0] if best else None


def old_notice(t):
    m = re.search(r'article:published_time" content="(\d{4}-\d{2}-\d{2})', t)
    if not m or 'hlc-old-ssr' in t:
        return t
    pub = datetime.date.fromisoformat(m.group(1))
    if (datetime.date.today() - pub).days < 21:
        return t
    h = re.search(r'<h1[^>]*>([^<]+)', t)
    title = _html.unescape(h.group(1)) if h else ''
    if not OFFER_RX.search(title):
        return t
    p = _dest_of(title)
    links = '<a class="hlc-btn" href="/chollos/">Ver los chollos verificados de hoy</a>'
    if p:
        if p['s'] in _GUIDES:
            links = f'<a class="hlc-btn" href="/destinos/{p["s"]}/#chollos">Chollos de hoy a {_html.escape(p["n"])}</a>' + links.replace('class="hlc-btn"', 'class="hlc-btn o"')
        links += f'<a class="hlc-btn o" href="/chollos/?q={_html.escape(_sl(p["n"]))}">Buscar {_html.escape(p["n"])} en los chollos</a>'
    box = (f'<!--hlc-old--><div class="hlc-old hlc-old-ssr" role="note">🕒 <strong>Oferta caducada.</strong> Este chollo se publicó el {pub.day} de {MES[pub.month - 1]} de {pub.year} '
           f'y su precio ya no está disponible. <div class="hlc-row">{links}</div></div><!--/hlc-old-->')
    m1 = re.search(r'<div class="post-image\b', t)
    if m1:
        return t[:m1.start()] + box + t[m1.start():]
    m2 = re.search(r'<div class="inner-post-entry[^>]*>|<div class="(?:post-entry|entry-content)[^>]*>', t)
    if not m2:
        return t
    return t[:m2.end()] + box + t[m2.end():]




# ---------- restos de la plantilla WordPress (Soledad) en los posts antiguos ----------
_TAG_RX = re.compile(r'<(/?)(div|nav|footer|aside|header|ul|section)\b[^>]*>', re.I)


def _drop(t, start_rx):
    """Quita el elemento que empieza en start_rx, contando etiquetas del mismo tipo (balanceado)."""
    n = 0
    while True:
        m = re.search(start_rx, t)
        if not m:
            return t, n
        tag = re.match(r'<(\w+)', m.group(0)).group(1).lower()
        depth, pos = 0, m.start()
        for x in _TAG_RX.finditer(t, m.start()):
            if x.group(2).lower() != tag:
                continue
            depth += -1 if x.group(1) else 1
            if depth == 0:
                pos = x.end()
                break
        else:
            return t, n
        t = t[:m.start()] + t[pos:]
        n += 1


LEGACY = [r'<div class="penci-header-wrap"', r'<nav id="sidebar-nav"', r'<div class="post-author\b', r'<footer id="footer-section"', r'<div class="clear-footer"',
          r'<aside id="block-\d+"', r'<div class="penci-single-link-pages"', r'<div class="post-pagination\b', r'<div class="tags-share-box\b']


def legacy_clean(t):
    if 'id="soledad_wrapper"' not in t:
        return t, 0
    total = 0
    for rx in LEGACY:
        t, n = _drop(t, rx)
        total += n
    t = re.sub(r'<a href="#" id="close-sidebar-nav"[^>]*>.*?</a>', '', t, flags=re.S)
    # JavaScript de la plantilla vieja que ya no hace nada (menús, me gusta, compartir, comentarios)
    t, nj = re.subn(r'<script[^>]*id=["\'](?:gtm4wp-form-move-tracker|js-cookies|penci_ajax_like_post|comment-reply|jquery\.inview|penci-sticky-share|main-scripts|penci-libs-js)-js["\'][^>]*>\s*</script>\s*', '', t)
    t, nj2 = re.subn(r'<script[^>]*id=["\'](?:penci_ajax_like_post|main-scripts|penci-libs-js|penci-sticky-share)-js-(?:extra|before|after)["\'][^>]*>.*?</script>\s*', '', t, flags=re.S)
    return t, total + nj + nj2


stats = dict(files=0, changed=0, gtm=0, rel=0, ebc=0, old=0, legacy=0)
for f in files:
    stats['files'] += 1
    t0 = open(f, encoding='utf-8', errors='surrogateescape').read()
    t = t0
    # limpiar inyecciones anteriores (idempotencia)
    t = strip_block(t, '<!--hlc-old-->', '<!--/hlc-old-->')
    for a, b in (('<!--hlc-head-->', '<!--/hlc-head-->'), ('<!--hlc-tail-->', '<!--/hlc-tail-->'), ('<!--hlc-foot-->', '<!--/hlc-foot-->'), ('<!--hlc-header-->', '<!--/hlc-header-->'), ('<!--hlc-footer-->', '<!--/hlc-footer-->')):
        t = strip_block(t, a, b)
    t = re.sub(r'<link rel=["\'](?:icon|shortcut icon|apple-touch-icon)["\'][^>]*wp-content[^>]*>\s*', '', t)
    t = re.sub(r'<meta name=["\']msapplication-TileImage["\'][^>]*>\s*', '', t)
    # GTM duplicado (gtm4wp ya lo carga)
    t, n = DUP_GTM.subn('', t)
    stats['gtm'] += n
    # cabecera: consentimiento antes de GTM + CSS
    t = re.sub(r'(<meta charset="UTF-8">)', lambda m: m.group(1) + HEAD, t, count=1)
    # cabecera nueva justo después de <body>
    t = re.sub(r'(<body[^>]*>)', lambda m: m.group(1) + HEADER, t, count=1)
    # pie nuevo + script antes de </body>
    i = t.rfind('</body>')
    if i != -1:
        t = t[:i] + FOOTERX + TAIL + t[i:]
    # rel="sponsored nofollow" en enlaces de afiliado
    before = t.count('sponsored')
    t = A_TAG.sub(fix_rel, t)
    stats['rel'] += t.count('sponsored') - before
    # precio actualizado de Eco Beach City
    c = t.count(EBC_OLD)
    if c:
        t = t.replace(EBC_OLD, EBC_NEW)
        stats['ebc'] += c
    t, nl = legacy_clean(t)
    stats['legacy'] += 1 if nl else 0
    t2 = old_notice(t)
    if t2 != t:
        stats['old'] += 1
    t = t2
    # búsquedas de hoteles en Booking con dest_id (solo ?ss= da error a muchos usuarios)
    if 'searchresults' in t:
        t = BK.fix_html(t)
    if t != t0:
        open(f, 'w', encoding='utf-8', errors='surrogateescape').write(t)
        stats['changed'] += 1

# la versión en inglés (en/) no pasa por este script: arreglar sus enlaces de Booking aquí también
EN_OF = {'chollos': 'en/deals', 'vuelos': 'en/flights', 'destinos': 'en/destinations'}
en_pre = [EN_OF[ONLY]] if ONLY in EN_OF else (['en/'] if not ONLY else [])
for f in subprocess.run(['git', 'ls-files', '-co', '--exclude-standard', '-z', 'en/*.html'], capture_output=True).stdout.decode().split('\0'):
    if f and os.path.exists(f) and any(f.startswith(p_) for p_ in en_pre):
        s0 = open(f, encoding='utf-8', errors='surrogateescape').read()
        if 'searchresults' in s0:
            s1 = BK.fix_html(s0)
            if s1 != s0:
                open(f, 'w', encoding='utf-8', errors='surrogateescape').write(s1); stats['bk_en'] = stats.get('bk_en', 0) + 1

print(json.dumps(stats))
