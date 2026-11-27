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
try:  # ronda 7: las páginas de datos nuevas siempre se revisan
    scope += [u.strip('/') + '/index.html' for u in json.load(open('vuelos/r7_pages.json', encoding='utf-8'))]
except Exception:
    pass
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


bad_xd = []
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
    # x-default coherente: toda pareja es/en lleva x-default, y apunta a la versión española
    hl_ = dict(HL.findall(s_))
    xd_ = re.search(r'<link rel="alternate" hreflang="x-default" href="([^"]+)">', s_)
    if 'es' in hl_ and 'en' in hl_ and (not xd_ or xd_.group(1) != hl_['es']):
        bad_xd.append(f)
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
if bad_xd:
    warns.append(f'{len(bad_xd)} página(s) sin x-default o con x-default distinto de la versión española, p. ej. {bad_xd[0]}')
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
sm_dead, sm_noidx, sm_robots, sm_redir = [], [], [], []
# lo que robots.txt bloquea (grupo User-agent: *) no se pide en los sitemaps: Google lo cuenta como error de cobertura
_dis = []
try:
    _grp = re.split(r'(?im)^\s*User-agent:\s*', open('robots.txt', encoding='utf-8').read())
    for g_ in _grp:
        if g_.split('\n', 1)[0].strip() == '*':
            _dis = [l_.split(':', 1)[1].strip() for l_ in g_.splitlines() if l_.lower().startswith('disallow:') and l_.split(':', 1)[1].strip()]
            break
except Exception:
    pass
_dis_rx = [re.compile('^' + re.escape(d_).replace('\\*', '.*').replace('\\$', '$')) for d_ in _dis]
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
        pq = p + (('?' + urlsplit(loc).query) if urlsplit(loc).query else '')
        if any(rx.match(pq) for rx in _dis_rx):
            sm_robots.append((sm, p))
            continue
        # ronda 6: una URL que _redirects manda a otra (slugs EN antiguos: tallin, vilna, mauricio...) no se pide en el sitemap
        if p in redirect_src or p.rstrip('/') in redirect_src:
            sm_redir.append((sm, p))
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
for _sm in sorted({sm for sm, _ in sm_dead} | {sm for sm, _ in sm_noidx} | {sm for sm, _ in sm_robots} | {sm for sm, _ in sm_redir}):
    _fixed += _drop_locs(_sm, [p for s_, p in sm_dead if s_ == _sm] + [p for s_, p in sm_noidx if s_ == _sm] + [p for s_, p in sm_robots if s_ == _sm] + [p for s_, p in sm_redir if s_ == _sm])
if sm_redir:
    warns.append(f'{len(sm_redir)} URL(s) con redirección 301 fuera de los sitemaps: ' + ', '.join(p for _, p in sm_redir[:5]))
if sm_robots:
    warns.append(f'{len(sm_robots)} URL(s) bloqueadas por robots.txt fuera de los sitemaps: ' + ', '.join(p for _, p in sm_robots[:5]))
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

# ---------- ronda 7: restos de código en el texto (en ronda 5 se publicó "<function ... at 0x...>" como precio en 7 páginas) ----------
_bad = []
_BADRX = re.compile(r'&lt;function [\w.]+|<function [\w.<>]+ at 0x|&lt;lambda&gt;|\bNone\s?€|€\s?None\b|\bnan\s?€')
for _d in ('vuelos', 'chollos', 'destinos', 'en', 'guias'):
    for _r, _ds, _fs in os.walk(_d):
        if 'index.html' in _fs:
            _p = os.path.join(_r, 'index.html')
            try:
                if _BADRX.search(open(_p, encoding='utf-8', errors='ignore').read()):
                    _bad.append(_p)
            except Exception:
                pass
if _bad:
    errors.append(f'{len(_bad)} página(s) con restos de código en el texto (p. ej. "<function ...>" o "None €"): ' + ', '.join(_bad[:5]))

# ---------- ronda 7 (#251, #304): títulos duplicados entre páginas indexables y URLs de sitemap sin ningún enlace interno ----------
_titles, _linked = {}, set()
for _d in ('vuelos', 'destinos', 'chollos', 'en'):
    for _r, _ds, _fs in os.walk(_d):
        if 'index.html' not in _fs:
            continue
        _p = os.path.join(_r, 'index.html')
        try:
            _s = open(_p, encoding='utf-8', errors='ignore').read()
        except Exception:
            continue
        _hd = _s[:8000]
        if 'content="index' in _hd:
            _m = TIT.search(_hd)
            if _m:
                _titles.setdefault(_m.group(1).strip(), []).append(_p)
        for _h in HREF.findall(_s):
            _linked.add(unquote(_h.split('#')[0].split('?')[0]))
for _p in glob.glob('*.html') + ['index.html', 'en/index.html']:
    if os.path.isfile(_p):
        for _h in HREF.findall(open(_p, encoding='utf-8', errors='ignore').read()):
            _linked.add(unquote(_h.split('#')[0].split('?')[0]))
_dup = [(t, ps) for t, ps in _titles.items() if len(ps) > 1]
if _dup:
    warns.append(f'{len(_dup)} título(s) repetidos en páginas indexables, p. ej. "{_dup[0][0]}" en {", ".join(_dup[0][1][:3])}')
_orph = []
for _sm in ('vuelos-sitemap.xml', 'flights-sitemap.xml', 'destinos-sitemap.xml', 'en-sitemap.xml', 'paginas-sitemap.xml'):
    if os.path.exists(_sm):
        for _loc in re.findall(r'<loc>\s*https://www\.happylowcost\.com(/[^<\s]*)\s*</loc>', open(_sm, encoding='utf-8', errors='ignore').read()):
            if _loc not in _linked and _loc != '/':
                _orph.append(_loc)
if _orph:
    warns.append(f'{len(_orph)} URL(s) de los sitemaps sin ningún enlace interno (huérfanas), p. ej. ' + ', '.join(_orph[:5]))

# ---------- ronda 7 (#321): alarma si los sitemaps se vacían (un fallo del feed puede dejar a Google sin rutas) ----------
SM_MIN = {'vuelos-sitemap.xml': 400, 'flights-sitemap.xml': 400, 'destinos-sitemap.xml': 150, 'en-sitemap.xml': 150, 'paginas-sitemap.xml': 10}
try:
    _si = open('sitemap_index.xml', encoding='utf-8').read()
    _tot = 0
    for _sm in re.findall(r'<loc>\s*https://www\.happylowcost\.com/([^<\s]+\.xml)\s*</loc>', _si):
        _n = open(_sm, encoding='utf-8', errors='ignore').read().count('<url>') if os.path.exists(_sm) else -1
        _tot += max(_n, 0)
        if _n < 0:
            errors.append(f'sitemap_index.xml enlaza {_sm}, que no existe')
        elif _n < SM_MIN.get(_sm, 1):
            errors.append(f'{_sm} tiene {_n} URL(s) (mínimo esperado {SM_MIN.get(_sm, 1)}): ¿ha fallado el feed?')
    if _tot < 2000:
        errors.append(f'los sitemaps suman solo {_tot} URLs (normal: más de 3.000)')
except Exception as _ex:
    errors.append(f'no se pudo leer sitemap_index.xml: {_ex}')

print(json.dumps({'paginas': len(set(scope)), 'ficheros': nfiles, 'reglas': nrules, 'errores': len(errors), 'avisos': len(warns)}, ensure_ascii=False))
for w in warns:
    print('AVISO', w)
for e in errors[:60]:
    print('ERROR', e)
sys.exit(1 if errors else 0)
