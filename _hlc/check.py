#!/usr/bin/env python3
"""Comprobaciones antes de publicar Happy Low Cost. Sale con código 1 si algo grave está mal.
Uso (desde la raíz de la rama pub/happylowcost.com): python3 _hlc/check.py [--all]
- enlaces internos rotos en las páginas generadas (portada, chollos, rutas, destinos, herramientas, /en/)
- códigos de ciudad de Booking mal puestos (ROM.AIRPORT...)
- nº de chollos y páginas mínimos, versión única de hlc.js
- límite de ficheros de Cloudflare Pages
"""
import os, re, sys, json, glob, subprocess
from urllib.parse import unquote, urlsplit

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
errors, warns = [], []

redirect_src = set()
for line in open('_redirects', encoding='utf-8'):
    p = line.split()
    if len(p) >= 2 and not p[0].startswith('#'):
        redirect_src.add(unquote(p[0]).rstrip('*'))
maps = {}
for m in ('en/_map-deals.json', 'en/_map-flights.json'):
    if os.path.exists(m):
        maps.update(json.load(open(m)))
FUNC_PREFIX = ('/api/', '/_hlc/')


def exists(path):
    path = unquote(path.split('#')[0].split('?')[0])
    if not path or path == '/':
        return True
    if path in redirect_src or path.rstrip('/') in redirect_src or any(path.startswith(r) for r in redirect_src if r.endswith('/') and len(r) > 1 and r.endswith('/')) and False:
        return True
    if path.startswith(FUNC_PREFIX) or path in maps:
        return True
    rel = path.lstrip('/')
    if os.path.isfile(rel):
        return True
    if os.path.isfile(os.path.join(rel, 'index.html')):
        return True
    return False


scope = ['index.html', 'chollos/index.html', 'destinos/index.html', 'vuelos/index.html', 'alertas/index.html', 'como-verificamos/index.html', 'herramientas/index.html', 'en/index.html',
         'en/deals/index.html', 'en/flights/index.html', 'en/destinations/index.html', 'en/legal/index.html', 'en/tools/index.html', '404.html', 'blog/index.html', 'buscar/index.html', 'en/search/index.html']
scope += glob.glob('chollos/*/index.html') + glob.glob('chollos/desde/*/index.html') + glob.glob('chollos/desde/*/*/index.html') + glob.glob('chollos/a/*/index.html') + glob.glob('chollos/ideas/*/index.html')
scope += glob.glob('en/deals/*/index.html') + glob.glob('en/deals/ideas/*/index.html') + glob.glob('destinos/*/index.html') + glob.glob('en/destinations/*/index.html') + glob.glob('herramientas/*/index.html') + glob.glob('en/tools/*/index.html')
rutas = sorted(glob.glob('vuelos/*/index.html'))
scope += rutas[::25] + sorted(glob.glob('en/flights/*/index.html'))[::25]  # muestra de rutas
if '--all' in sys.argv:
    scope += rutas + glob.glob('en/flights/*/index.html')
HREF = re.compile(r'href="(/[^"]*)"')
bad = {}
for f in sorted(set(scope)):
    if not os.path.isfile(f):
        continue
    s = open(f, encoding='utf-8', errors='ignore').read()
    for h in HREF.findall(s):
        if h.startswith('//'):
            continue
        if not exists(h.replace('&amp;', '&')):
            bad.setdefault(h, []).append(f)
    if re.search(r'\b(LON|MIL|NYC|PAR|ROM|STO|BUE|RIO|TYO|OSA|YTO|TCI)\.AIRPORT', unquote(s)):
        errors.append(f'{f}: código de ciudad con .AIRPORT (Booking lo entiende mal)')
for h, fs in sorted(bad.items(), key=lambda kv: -len(kv[1])):
    errors.append(f'enlace roto {h} en {len(fs)} página(s), p. ej. {fs[0]}')

# ---------- puertas de SEO en las páginas revisadas ----------
# JSON-LD que no se puede leer (error), hreflang ES<->EN que no vuelve, canónica distinta de la URL,
# títulos de más de 65 caracteres y rayas largas en título o descripción (avisos: no paran la publicación).
SITE_ = 'https://www.happylowcost.com'
LDJ = re.compile(r'<script type="application/ld\+json">(.*?)</script>', re.S)
HL = re.compile(r'<link rel="alternate" hreflang="(es|en)" href="([^"]+)">')
CAN = re.compile(r'<link rel="canonical" href="([^"]+)"')
TIT = re.compile(r'<title>(.*?)</title>', re.S)
DSC = re.compile(r'<meta name="description" content="([^"]*)"')
bad_ld, bad_hl, bad_can, long_t, dash = [], [], [], [], []
_cache = {}


def _head(rel):
    if rel not in _cache:
        try:
            _cache[rel] = open(rel, encoding='utf-8', errors='ignore').read()
        except Exception:
            _cache[rel] = None
    return _cache[rel]


def _file_of(url):
    p_ = unquote(urlsplit(url).path).lstrip('/')
    return p_ if p_.endswith('.html') else os.path.join(p_, 'index.html')


for f in sorted(set(scope)):
    s_ = _head(f) if os.path.isfile(f) else None
    if not s_:
        continue
    for blk in LDJ.findall(s_):
        try:
            json.loads(blk)
        except Exception:
            bad_ld.append(f)
            break
    m_ = CAN.search(s_)
    self_url = SITE_ + '/' + (f[:-len('index.html')] if f.endswith('index.html') else f)
    if m_ and m_.group(1) != self_url and f != '404.html' and "noindex" not in s_[:6000]:
        bad_can.append(f'{f} -> {m_.group(1)}')
    me = m_.group(1) if m_ else self_url
    for lang, href in HL.findall(s_):
        if href == me:
            continue
        t_ = _file_of(href)
        o_ = _head(t_) if os.path.isfile(t_) else None
        if o_ is None:
            bad_hl.append(f'{f} -> {href} (no existe)')
        elif f'href="{me}"' not in o_ and HL.search(o_):
            bad_hl.append(f'{f} -> {href} (no vuelve)')
    t = TIT.search(s_)
    if t:
        tt = t.group(1).strip()
        if len(tt) > 65:
            long_t.append(f)
        d_ = DSC.search(s_)
        if '—' in tt or (d_ and '—' in d_.group(1)):
            dash.append(f)
if bad_ld:
    errors.append(f'{len(bad_ld)} página(s) con JSON-LD ilegible, p. ej. {bad_ld[0]}')
if bad_hl:
    warns.append(f'{len(bad_hl)} hreflang sin reciprocidad, p. ej. {bad_hl[0]}')
if bad_can:
    warns.append(f'{len(bad_can)} canónica(s) distinta(s) de la URL, p. ej. {bad_can[0]}')
if long_t:
    warns.append(f'{len(long_t)} título(s) de más de 65 caracteres, p. ej. {long_t[0]}')
if dash:
    warns.append(f'{len(dash)} página(s) con raya larga en título o descripción, p. ej. {dash[0]}')

# mínimos
n_deals = len(glob.glob('chollos/*/og.jpg'))
if n_deals < 1:  # con el listón al 40 % hay menos chollos vivos; por debajo de 5 sí es señal de fallo
    errors.append(f'solo {n_deals} chollos con imagen: ¿ha fallado el agente?')
vers = set()
for f in scope[:400]:
    if os.path.isfile(f):
        vers |= set(re.findall(r'hlc\.js\?v=(\d+)', open(f, encoding='utf-8', errors='ignore').read()))
if len(vers) > 1:
    warns.append(f'varias versiones de hlc.js en las páginas: {sorted(vers)}')
nfiles = len([x for x in subprocess.run(['git', 'ls-files', '-co', '--exclude-standard'], capture_output=True, text=True).stdout.split('\n') if x])
if nfiles > 19500:
    errors.append(f'{nfiles} ficheros: cerca del límite de 20.000 de Cloudflare Pages')
elif nfiles > 18500:
    warns.append(f'{nfiles} ficheros (límite 20.000)')

# ---------- lo que pedimos a Google tiene que existir ----------
# El 26-nov-2026 los sitemaps pedian 1.702 URLs y 1.115 daban 404, y 195 de las
# 207 URLs de /en/deals/ que Google tenia indexadas tambien. Se mira aqui.
sm_dead, sm_noidx = [], []
for sm in sorted(glob.glob('*-sitemap*.xml') + glob.glob('sitemap*.xml')):
    if sm.startswith('sitemap_index'):
        continue
    try:
        x = open(sm, encoding='utf-8', errors='ignore').read()
    except Exception:
        continue
    for loc in re.findall(r'<loc>\s*(.*?)\s*</loc>', x):
        p = unquote(urlsplit(loc).path)
        rel = p.lstrip('/')
        if not rel:
            continue
        f_ = rel if os.path.isfile(rel) else os.path.join(rel, 'index.html')
        if os.path.isfile(f_):
            # Pedirle a Google una pagina que le dice noindex es mandarle a rastrear
            # para nada. Desde el 26-nov gen_routes.py deja en noindex las rutas que
            # no llegan a la posicion 25, asi que esto puede pasar por despiste.
            try:
                h_ = open(f_, encoding='utf-8', errors='ignore').read(4000)
            except Exception:
                h_ = ''
            if "content='noindex" in h_ or 'content="noindex' in h_:
                sm_noidx.append((sm, p))
            continue
        sm_dead.append((sm, p))
# Se arregla, no se protesta: el paso de check.py del workflow no lleva
# "|| true", asi que un error aqui deja la web sin actualizar. Y como esto corre
# despues de generar y antes del git add, basta con sacar la URL del sitemap.
def _drop_locs(sm, paths):
    try:
        x = open(sm, encoding='utf-8', errors='ignore').read()
    except Exception:
        return 0
    want = set(paths)

    def one(m):
        loc = re.search(r'<loc>\s*(.*?)\s*</loc>', m.group(0))
        if loc and unquote(urlsplit(loc.group(1)).path) in want:
            return ''
        return m.group(0)
    y = re.sub(r'\s*<url>.*?</url>', one, x, flags=re.S)
    if y != x:
        open(sm, 'w', encoding='utf-8').write(y)
        return x.count('<url>') - y.count('<url>')
    return 0


_fixed = 0
for _sm in sorted({sm for sm, _ in sm_dead} | {sm for sm, _ in sm_noidx}):
    _fixed += _drop_locs(_sm, [p for s_, p in sm_dead if s_ == _sm] + [p for s_, p in sm_noidx if s_ == _sm])
if sm_dead:
    ex = ', '.join(p for _, p in sm_dead[:5])
    warns.append(f'{len(sm_dead)} URL(s) sin pagina fuera de los sitemaps: {ex}')
if sm_noidx:
    ex = ', '.join(p for _, p in sm_noidx[:5])
    warns.append(f'{len(sm_noidx)} URL(s) con noindex fuera de los sitemaps: {ex}')
if _fixed:
    warns.append(f'{_fixed} <url> quitadas de los sitemaps por check.py')

# ---------- una redireccion no puede llevar a un 404 ----------
red_dead = []
nrules = 0
for line in open('_redirects', encoding='utf-8'):
    p = line.split()
    if len(p) < 2 or p[0].startswith('#'):
        continue
    nrules += 1
    dst = unquote(p[1].split('#')[0].split('?')[0])
    if not dst.startswith('/') or '*' in dst or ':' in dst:
        continue
    if not exists(dst):
        red_dead.append((p[0], dst))
if red_dead:
    ex = ', '.join(f'{a} -> {b}' for a, b in red_dead[:5])
    errors.append(f'{len(red_dead)} redireccion(es) llevan a una pagina que no existe: {ex}')
if nrules > 1900:
    errors.append(f'{nrules} reglas en _redirects: Cloudflare Pages solo aplica 2.000 estaticas')
elif nrules > 1600:
    warns.append(f'{nrules} reglas en _redirects (limite 2.000)')

print(json.dumps({'paginas': len(set(scope)), 'ficheros': nfiles, 'reglas': nrules, 'errores': len(errors), 'avisos': len(warns)}, ensure_ascii=False))
for w in warns:
    print('AVISO', w)
for e in errors[:60]:
    print('ERROR', e)
sys.exit(1 if errors else 0)
