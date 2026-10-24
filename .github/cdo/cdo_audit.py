"""Auditoria mensual de carlosdeory.com en vivo: estado de todas las URLs del sitemap, titulos y descripciones
duplicados, noindex accidental, canonical distinto, imagenes pesadas, enlaces internos rotos y una muestra de externos."""
import re, urllib.request, urllib.error, collections, random, html, concurrent.futures as cf
SITE = 'https://www.carlosdeory.com'
UA = {'User-Agent': 'cdo-audit/1.0 (+https://www.carlosdeory.com)'}
def get(u, method='GET', timeout=25):
    try:
        r = urllib.request.urlopen(urllib.request.Request(u, headers=UA, method=method), timeout=timeout)
        return r.status, (r.read() if method == 'GET' else b''), r.headers
    except urllib.error.HTTPError as e: return e.code, b'', e.headers
    except Exception as e: return 0, str(e).encode(), {}
idx = get(SITE + '/sitemap_index.xml')[1].decode('utf-8', 'ignore')
urls = []
for sm in re.findall(r'<loc>([^<]+)</loc>', idx):
    urls += re.findall(r'<url><loc>([^<]+)</loc>', get(sm)[1].decode('utf-8', 'ignore'))
urls = list(dict.fromkeys(urls))
problems = collections.defaultdict(list)
titles = collections.defaultdict(list); descs = collections.defaultdict(list)
internal = set(); external = set(); imgs = set(); affiliate = set()
def check(u):
    st, body, hd = get(u)
    return u, st, body.decode('utf-8', 'ignore')
with cf.ThreadPoolExecutor(8) as ex:
    for u, st, h in ex.map(check, urls):
        if st != 200: problems['URL del sitemap que no da 200'].append(f'{u} ({st})'); continue
        t = re.search(r'<title>(.*?)</title>', h, re.S); t = html.unescape(t.group(1).strip()) if t else ''
        titles[t].append(u)
        d = re.search(r'<meta name="description" content="([^"]*)"', h)
        if d: descs[d.group(1)].append(u)
        else: problems['Sin meta descripcion'].append(u)
        if re.search(r"<meta name=['\"]robots['\"] content=['\"]noindex", h): problems['noindex en una URL del sitemap'].append(u)
        c = re.search(r'<link rel="canonical" href="([^"]+)"', h)
        if c and c.group(1).rstrip('/') != u.rstrip('/'): problems['Canonical distinto de la URL'].append(f'{u} -> {c.group(1)}')
        for a in re.findall(r'href="([^"#]+)"', h):
            a = html.unescape(a)
            if "'" in a or '+' in a or '/cdn-cgi/' in a: continue
            if a.startswith('/') and not a.startswith('//'): internal.add(SITE + a.split('?')[0])
            elif a.startswith(SITE): internal.add(a.split('?')[0])
            if a.startswith('http') and re.search(r'anrdoezrs|civitatis\.com|amzn\.to', a): affiliate.add(a)
            elif a.startswith('http') and not re.search(r'anrdoezrs|booking|civitatis|amzn|amazon|skyscanner|airbnb|twitter|facebook|linkedin|whatsapp|wa\.me|x\.com|instagram|youtube|google', a): external.add(a)
        for i in re.findall(r'<img[^>]+src="(/wp-content/[^"]+)"', h): imgs.add(SITE + i)
for t, us in titles.items():
    if len(us) > 1: problems['Titulo duplicado'].append(f'"{t[:70]}" en {len(us)} URLs')
for d, us in descs.items():
    if len(us) > 1: problems['Descripcion duplicada'].append(f'{len(us)} URLs: {us[0]}')
def head(u): return u, get(u, 'HEAD')[0]
with cf.ThreadPoolExecutor(8) as ex:
    for u, st in ex.map(head, sorted(internal - set(urls))[:3000]):
        if st >= 400 or st == 0: problems['Enlace interno roto'].append(f'{u} ({st})')
    sample = random.sample(sorted(external), min(150, len(external)))
    for u, st in ex.map(head, sample):
        if st in (404, 410) or st == 0: problems['Enlace externo caido (muestra de 150)'].append(f'{u} ({st})')
    for u, st in ex.map(lambda x: (x, get(x, 'GET')[0]), random.sample(sorted(affiliate), min(60, len(affiliate)))):
        if st >= 400 or st == 0: problems['Enlace de afiliado que falla (muestra de 60)'].append(f'{u} ({st})')
    for u in random.sample(sorted(imgs), min(200, len(imgs))):
        st, _, hd = get(u, 'HEAD')
        try:
            if int(hd.get('Content-Length', 0)) > 600_000: problems['Imagen de mas de 600 KB (muestra)'].append(u)
        except Exception: pass
print(f'# Auditoria de carlosdeory.com\n\n{len(urls)} URLs del sitemap revisadas, {len(internal)} enlaces internos, muestra de {min(150, len(external))} externos.\n')
for k, v in problems.items():
    print(f'## {k} ({len(v)})\n')
    for x in v[:60]: print(f'- {x}')
    print()
if not problems: print('Todo correcto.')
