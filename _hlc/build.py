#!/usr/bin/env python3
"""Aplica las mejoras de Happy Low Cost a todas las páginas estáticas (idempotente).
Uso: python3 hlc/build.py   (desde la raíz de la rama pub/happylowcost.com)
"""
import os, re, subprocess, json

V = '8'
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
    '<!--hlc-foot--><div class="hlc-foot">Happy Low Cost busca chollos de vuelos, hoteles y viajes desde España desde 2012. '
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


stats = dict(files=0, changed=0, gtm=0, rel=0, ebc=0)
for f in files:
    stats['files'] += 1
    t0 = open(f, encoding='utf-8', errors='surrogateescape').read()
    t = t0
    # limpiar inyecciones anteriores (idempotencia)
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
    if t != t0:
        open(f, 'w', encoding='utf-8', errors='surrogateescape').write(t)
        stats['changed'] += 1

print(json.dumps(stats))
