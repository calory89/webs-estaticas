#!/usr/bin/env python3
"""Aplica las mejoras de Happy Low Cost a todas las páginas estáticas (idempotente).
Uso: python3 hlc/build.py   (desde la raíz de la rama pub/happylowcost.com)
"""
import os, re, subprocess, json, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bk as BK

V = '35'
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


LEGACY = [r'<div class="pcrlt-style-1 post-related"', r'<div class="penci-header-wrap"', r'<nav id="sidebar-nav"', r'<div class="post-author\b', r'<footer id="footer-section"', r'<div class="clear-footer"',
          r'<aside id="block-\d+"', r'<div class="penci-single-link-pages"', r'<div class="post-pagination\b', r'<div class="tags-share-box\b']


_EMO = re.compile('[\u203c\u2049\u2757\u2755\u2753\u2754\u2728\u2b50\u2708\ufe0f\u2600-\u27bf\U0001F1E6-\U0001F1FF\U0001F300-\U0001FAFF\u200b-\u200f\u202a-\u202e]+')


def tidy_title(t):
    """'‼CHOLLO‼ Vuelos a ISLAS MALDIVAS por solo 299€ I/V 😍' -> 'Chollo: vuelos a Islas Maldivas por solo 299€ I/V'"""
    t0 = t
    t = _EMO.sub(' ', t)
    t = re.sub(r'!{2,}', '', t)
    def cap(m):
        w = m.group(0)
        return w if len(w) < 3 or w in ('I/V', 'EEUU', 'USA', 'NYC', 'UK', 'VIP', 'TV', 'BBQ') else w[0] + w[1:].lower()
    t = re.sub(r"\b[A-ZÁÉÍÓÚÑÜ]{3,}\b", cap, t)
    t = re.sub(r'\s{2,}', ' ', t).strip(' -–·')
    t = re.sub(r'^(Chollo|Chollazo|Ganga|Wow|Planazo|De lujo|Correee|Cuba linda)\s+(?![:-])', r'\1: ', t, flags=re.I)
    return t or t0


def _fix_titles(t):
    t = re.sub(r'(<title>)(.*?)(</title>)', lambda m: m.group(1) + tidy_title(m.group(2)) + m.group(3), t, count=1, flags=re.S)
    t = re.sub(r'(<h1 class="post-title[^"]*"[^>]*>)(.*?)(</h1>)', lambda m: m.group(1) + tidy_title(m.group(2)) + m.group(3), t, count=1, flags=re.S)
    t = re.sub(r'(<meta (?:property|name)="(?:og|twitter):title" content=")([^"]*)(")', lambda m: m.group(1) + tidy_title(m.group(2)) + m.group(3), t)
    return t


HLC_LEGACY_CSS = '/wp-content/cache/fvm/min/1787084351-cssbc6f8b6689c0efdeb323aed2a81ecfc3403aa0a5c855e54d66da102695409.css'
LEGACY_CSS_NEW = '/hlc/wp-legacy.css?v=1'  # misma hoja depurada (1,1 MB -> 134 KB), ver _hlc/tools/purge-legacy.js


def legacy_clean(t):
    if HLC_LEGACY_CSS in t:
        t = t.replace(HLC_LEGACY_CSS, LEGACY_CSS_NEW)
    if 'id="soledad_wrapper"' not in t:
        return t, 0
    # jQuery y scripts del tema sin bloquear el pintado (defer mantiene el orden)
    t = re.sub(r'<script (id=["\'](?:jquery-core|jquery-migrate|toc-front|pc-lazy)-js["\'][^>]*?)(?<!defer)>', r'<script \1 defer>', t)
    t = _fix_titles(t)
    t = re.sub(r'<a [^>]*href="(?:https://www\.happylowcost\.com)?/tag/[^"]*"[^>]*>(.*?)</a>', r'\1', t, flags=re.S)
    t = re.sub(r'<link[^>]+(?:/feed/|/feed/atom/|wp-json|xmlrpc\.php|wlwmanifest|EditURI|rsd\+xml)[^>]*>\s*', '', t)
    total = 0
    for rx in LEGACY:
        t, n = _drop(t, rx)
        total += n
    t = re.sub(r'<a href="#" id="close-sidebar-nav"[^>]*>.*?</a>', '', t, flags=re.S)
    # JavaScript de la plantilla vieja que ya no hace nada (menús, me gusta, compartir, comentarios)
    t, nj = re.subn(r'<script[^>]*id=["\'](?:gtm4wp-form-move-tracker|js-cookies|penci_ajax_like_post|comment-reply|jquery\.inview|penci-sticky-share|main-scripts|penci-libs-js)-js["\'][^>]*>\s*</script>\s*', '', t)
    t, nj2 = re.subn(r'<script[^>]*id=["\'](?:penci_ajax_like_post|main-scripts|penci-libs-js|penci-sticky-share)-js-(?:extra|before|after)["\'][^>]*>.*?</script>\s*', '', t, flags=re.S)
    return t, total + nj + nj2


# ---------- SEO y lectura de los posts antiguos (WordPress) ----------
SITE = 'https://www.happylowcost.com'


def _txt(h):
    h = re.sub(r'<(script|style)\b.*?</\1>', ' ', h, flags=re.S)
    h = _html.unescape(re.sub(r'<[^>]+>', ' ', h))
    return re.sub(r'\s+', ' ', h).strip()


def _cut(s, n=155):
    s = s.strip()
    if len(s) <= n:
        return s
    s = s[:n].rsplit(' ', 1)[0].rstrip(' ,.;:-')
    return s + '…'


def _vis(t, fn):
    """Aplica fn solo al texto visible (fuera de script, style, head y atributos)."""
    out, pos = [], 0
    for m in re.finditer(r'<script\b.*?</script>|<style\b.*?</style>|<[^>]+>', t, flags=re.S):
        out.append(fn(t[pos:m.start()]))
        out.append(m.group(0))
        pos = m.end()
    out.append(fn(t[pos:]))
    return ''.join(out)


def _nodash(s):
    s = re.sub(r'\s*—\s*(?=[A-Za-zÁÉÍÓÚÑáéíóúñ¿¡0-9])', ', ', s)
    return s.replace('—', '-').replace('&mdash;', '-')


_MD = re.compile(r'(<meta (?:name|property)="(?:description|og:description|twitter:description|og:title|twitter:title)" content=")([^"]*—[^"]*)(")')


def dash_all(t):
    t = _MD.sub(lambda m: m.group(1) + _nodash(m.group(2)) + m.group(3), t)
    t = re.sub(r'(<title>)([^<]*—[^<]*)(</title>)', lambda m: m.group(1) + _nodash(m.group(2)) + m.group(3), t)
    t = re.sub(r'(<script type="application/ld\+json">)(.*?)(</script>)', lambda m: m.group(1) + (_nodash(m.group(2)) if '—' in m.group(2) else m.group(2)) + m.group(3), t, flags=re.S)
    b_ = t.find('<body')
    return t[:b_] + _vis(t[b_:], _nodash) if b_ > 0 else t


def legacy_seo(t):
    if 'id="soledad_wrapper"' not in t:
        return t
    single = bool(re.search(r'<body[^>]*class="[^"]*\bsingle\b', t))
    tm = re.search(r'<title>(.*?)</title>', t, re.S)
    title = _html.unescape(tm.group(1)).strip() if tm else ''
    short = re.sub(r'\s+[-–|·]\s+Happy Low Cost\s*$', '', title)
    # título: Google ya añade el nombre del sitio; si es largo, fuera el sufijo
    if tm and len(title) > 60 and short != title:
        t = t[:tm.start(1)] + _html.escape(short, quote=False) + t[tm.end(1):]
        t = re.sub(r'(<meta (?:property|name)="(?:og|twitter):title" content=")([^"]*?)\s+[-–|·]\s+Happy Low Cost(")', r'\1\2\3', t)
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', t, re.S)
    name = _txt(h1.group(1)) if h1 else short
    # descripción
    if not re.search(r'<meta name=["\']description["\']', t):
        og = re.search(r'<meta property="og:description" content="([^"]*)"', t)
        desc = _html.unescape(og.group(1)) if og else ''
        if len(desc) < 60:
            ent = re.search(r'<div class="(?:inner-post-entry|post-entry|entry-content)[^>]*>(.*?)</div>', t, re.S)
            body = _txt(ent.group(1)) if ent else ''
            desc = (desc + ' ' + body).strip() if body else desc
        desc = re.sub(r'^(Ver (Vuelos|Hotel(es)?|oferta)\s*:?\s*)', '', desc, flags=re.I)
        desc = re.sub(r'\s+', ' ', desc).strip()
        if len(desc) < 70:
            cat = re.search(r'rel="category tag"><span[^>]*>([^<]+)<', t)
            if single:
                desc = f'{name}. ' + (desc + ' ' if desc else '') + 'En Happy Low Cost publicamos chollos de vuelos verificados cada día.'
            else:
                desc = f'{name}: chollos de vuelos, hoteles y guías de viaje de Happy Low Cost' + (f' sobre {cat.group(1).title()}' if cat else '') + '.'
        desc = _cut(_nodash(desc))
        desc = desc[:1].upper() + desc[1:]
        if tm:
            t = re.sub(r'(</title>)', lambda m: m.group(1) + '<meta name="description" content="' + _html.escape(desc) + '">', t, count=1)
    t = t.replace('https:\\/\\/www.happylowcost.com\\/?s={search_term_string}', 'https:\\/\\/www.happylowcost.com\\/buscar\\/?q={search_term_string}')
    t = re.sub(r'<div class="container container-single([^"]*)">', r'<div class="container container-single\1" role="main">', t, count=1)
    t = re.sub(r'<h([2-6])[^>]*>(?:\s|&nbsp;|<br\s*/?>)*</h\1>', '', t)
    # imágenes sociales con URL absoluta
    t = re.sub(r'(<meta (?:property|name)="(?:og:image|twitter:image)" content=")/', r'\1' + SITE + '/', t)
    # http → https
    t = re.sub(r'(href|src)="http://(www\.)?happylowcost\.com', r'\1="https://www.happylowcost.com', t)
    t = re.sub(r'src="http://', 'src="https://', t)
    # imágenes con marcador SVG + data-src (lazy de la plantilla vieja): src real y lazy nativo, sin esperar al JS
    def unlazy(m):
        tag = m.group(0)
        ds = re.search(r'\sdata-src="([^"]+)"', tag)
        if not ds or not re.search(r'\ssrc="data:image/', tag):
            return tag
        tag = re.sub(r'\ssrc="data:image/[^"]*"', ' src="' + ds.group(1) + '"', tag)
        tag = re.sub(r'\s(?:data-src|data-ll-status)="[^"]*"', '', tag)
        tag = re.sub(r'\bpenci-lazy\b ?', '', tag)
        if ' loading=' not in tag:
            tag = tag[:4] + ' loading="lazy" decoding="async"' + tag[4:]
        return tag
    t = re.sub(r'<img\b[^>]*>', unlazy, t)
    if single:
        alt = _html.escape(name)
        # foto principal: alt con el título y prioridad alta (es la imagen LCP)
        def hero(m):
            tag = m.group(0)
            tag = re.sub(r'\salt=""', f' alt="{alt}"', tag) if ' alt=""' in tag else (tag if ' alt=' in tag else tag[:-1] + f' alt="{alt}">')
            tag = re.sub(r'\sloading="lazy"', '', tag)
            if 'fetchpriority' not in tag:
                tag = tag[:-1].rstrip('/').rstrip() + ' fetchpriority="high">'
            return tag
        pm = re.search(r'<div class="post-image">', t)
        if pm:
            im = re.compile(r'<img\b[^>]*>').search(t, pm.end(), pm.end() + 1500)
            if im:
                t = t[:im.start()] + hero(im) + t[im.end():]
        # imágenes del texto: diferidas y con alt
        ent = re.search(r'<div class="inner-post-entry[^>]*>', t)
        if ent:
            head, rest = t[:ent.end()], t[ent.end():]
            def lz(m):
                tag = m.group(0)
                if ' loading=' not in tag:
                    tag = tag[:4] + ' loading="lazy" decoding="async"' + tag[4:]
                if ' alt=""' in tag:
                    tag = tag.replace(' alt=""', f' alt="{alt}"', 1)
                elif ' alt=' not in tag:
                    tag = tag[:4] + f' alt="{alt}"' + tag[4:]
                return tag
            rest = re.sub(r'<img\b[^>]*>', lz, rest)
            # un solo h1 por página
            rest = re.sub(r'<h1(\b[^>]*)>(.*?)</h1>', r'<h2\1>\2</h2>', rest, flags=re.S)
            t = head + rest
    return t


def related_block(t):
    """Al final de cada post antiguo: chollos de hoy al mismo destino (se rellenan en vivo) y enlaces a la guía."""
    if 'id="soledad_wrapper"' not in t or not re.search(r'<body[^>]*class="[^"]*\bsingle\b', t):
        return t
    h = re.search(r'<h1[^>]*>(.*?)</h1>', t, re.S)
    title = _txt(h.group(1)) if h else ''
    p = _dest_of(title)
    links = []
    if p:
        if p['s'] in _GUIDES:
            links.append(f'<a class="hlc-btn" href="/destinos/{p["s"]}/">Guía de {_html.escape(p["n"])}</a>')
        links.append(f'<a class="hlc-btn o" href="/chollos/?q={_html.escape(_sl(p["n"]))}">Chollos a {_html.escape(p["n"])}</a>')
    links.append('<a class="hlc-btn o" href="/chollos/">Todos los chollos de hoy</a>')
    links.append('<a class="hlc-btn o" href="/alertas/">Crear alerta gratis</a>')
    hd = f'Chollos de hoy a {_html.escape(p["n"])}' if p else 'Chollos verificados de hoy'
    dest = f' data-dest="{_html.escape(p["s"])}" data-dest-c="{_html.escape(_sl(p.get("c", "")))}"' if p else ''
    box = (f'<!--hlc-rel--><section class="hlc-rel" aria-label="{hd}"><h2 data-rel-h>{hd}</h2>'
           f'<div class="dc-grid" data-hlc-deals data-max="4"{dest}></div><div class="hlc-row">{"".join(links)}</div></section><!--/hlc-rel-->')
    m = re.search(r'<div class="inner-post-entry[^>]*>', t)
    if not m:
        return t
    # cerrar al final de inner-post-entry (contando divs)
    depth = 0
    for x in re.finditer(r'<(/?)div\b[^>]*>', t[m.start():]):
        depth += -1 if x.group(1) else 1
        if depth == 0:
            pos = m.start() + x.end()
            return t[:pos] + box + t[pos:]
    return t


_DCI = re.compile(r'<div class="dc-img" style="background-image:url\(\'([^\']+)\'\),(linear-gradient\([^)]*\))">')


def lazy_cards(t):
    """Tarjetas de chollo: las 4 primeras con foto inmediata, el resto se cargan al acercarse (hlc.js lazyBg)."""
    n = [0]
    def r(m):
        n[0] += 1
        if n[0] <= 4:
            return m.group(0)
        return f'<div class="dc-img" data-bg="{m.group(1)}" style="background:{m.group(2)}">'
    return _DCI.sub(r, t) if t.count('class="dc-img"') > 4 else t


stats = dict(files=0, changed=0, gtm=0, rel=0, ebc=0, old=0, legacy=0)
for f in files:
    stats['files'] += 1
    t0 = open(f, encoding='utf-8', errors='surrogateescape').read()
    t = t0
    # limpiar inyecciones anteriores (idempotencia)
    t = strip_block(t, '<!--hlc-old-->', '<!--/hlc-old-->')
    t = strip_block(t, '<!--hlc-rel-->', '<!--/hlc-rel-->')
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
    t = lazy_cards(related_block(legacy_seo(t)))
    if '—' in t and not re.search(r'[\u4e00-\u9fff]', t):
        t = dash_all(t)
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
        s1 = BK.fix_html(s0) if 'searchresults' in s0 else s0
        s1 = lazy_cards(s1)
        if '—' in s1:
            s1 = dash_all(s1)
        if s1 != s0:
                open(f, 'w', encoding='utf-8', errors='surrogateescape').write(s1); stats['bk_en'] = stats.get('bk_en', 0) + 1

print(json.dumps(stats))
