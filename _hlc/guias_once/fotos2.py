"""Segunda vía de fotos: imagen principal o vista de la ciudad en el artículo de Wikipedia en inglés (título exacto)."""
import os, sys, json, re, time, io, urllib.request, urllib.parse
sys.path.insert(0, '_hlc'); sys.path.insert(0, '_hlc/guias_once')
import gen_deals as G
from cities import C
from PIL import Image
UA = {'User-Agent': 'HappyLowCostBot/1.0 (https://www.happylowcost.com; bot@happylowcost.com)'}
T = {'lanzarote': 'Lanzarote', 'menorca': 'Menorca', 'niza': 'Nice', 'medellin': 'Medellín', 'jordania': 'Petra', 'ginebra': 'Geneva', 'marsella': 'Marseille', 'burdeos': 'Bordeaux',
     'algarve': 'Algarve', 'turin': 'Turin', 'verona': 'Verona', 'pisa': 'Pisa', 'bari': 'Bari', 'split': 'Split, Croatia', 'kotor': 'Kotor', 'sarajevo': 'Sarajevo', 'bratislava': 'Bratislava',
     'gdansk': 'Gdańsk', 'frankfurt': 'Frankfurt', 'bergen': 'Bergen', 'tromso': 'Tromsø', 'rovaniemi': 'Rovaniemi', 'estrasburgo': 'Strasbourg', 'tunez': 'Tunis', 'chiang-mai': 'Chiang Mai',
     'ciudad-de-panama': 'Panama City'}
BAD = r'(map|mapa|flag|coat|arms|seal|logo|locator|location|montage|collage|svg|diagram|plan|emblem|icon|signature|portrait|statue of|airport|aeropuerto|aéroport|flughafen|terminal|arrivals|coin|grosz|baedeker|stamp|banknote|council|parliament building|interior|museum|logo|bus|tram|train|station|stadium|university|hospital|19\\d\\d|18\\d\\d)'
GOOD = r'(skyline|panorama|old.?town|harbou?r|beach|bay|cityscape|view of|vista|aerial view of|seen from|from the|overlook|sunset)'
def api(q):
    time.sleep(7)
    return json.load(urllib.request.urlopen(urllib.request.Request('https://en.wikipedia.org/w/api.php?' + urllib.parse.urlencode({**q, 'format': 'json'}), headers=UA), timeout=40))
def get(url):
    time.sleep(4)
    return Image.open(io.BytesIO(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read())).convert('RGB')
have = {p['s'] for p in G.DLIB}; meta = {s: (n, ne, c, i, r, t) for s, n, ne, c, i, r, t in C}
for s, title in T.items():
    if os.path.exists(os.path.join(G.LIB, s + '-800.jpg')) and s in have:
        continue
    im = None; cred = ''
    try:
        j = api({'action': 'query', 'titles': title, 'prop': 'pageimages', 'piprop': 'original|name', 'redirects': 1})
        pg = list(j['query']['pages'].values())[0]; o = pg.get('original') or {}
        cands = []
        if o.get('source') and not re.search(BAD, o.get('source', ''), re.I) and o.get('width', 0) >= 1200 and o['width'] / max(o.get('height', 1), 1) >= 1.25:
            cands.append(pg.get('pageimage'))
        j2 = api({'action': 'query', 'titles': title, 'generator': 'images', 'gimlimit': 80, 'prop': 'imageinfo', 'iiprop': 'url|size', 'iiurlwidth': 1280, 'redirects': 1})
        imgs = sorted((j2.get('query') or {}).get('pages', {}).values(), key=lambda p: (0 if re.search(GOOD, p.get('title', ''), re.I) else 1))
        pool = {}
        for ip in imgs:
            ii = (ip.get('imageinfo') or [{}])[0]; t2 = ip.get('title', '')
            if re.search(BAD, t2, re.I) or not re.search(r'\.jpe?g$', t2, re.I): continue
            if ii.get('width', 0) >= 1600 and 1.3 <= ii['width'] / max(ii.get('height', 1), 1) <= 2.4:
                pool[t2.replace('File:', '')] = ii.get('thumburl')
        order = [c for c in cands if c and c in pool] + [k for k in pool if re.search(GOOD, k, re.I)] + list(pool)
        for k in order:
            try:
                im = get(pool[k]); cred = f'Foto: Wikimedia Commons ({k[:60]})'; break
            except Exception as ex:
                print('dl', s, ex)
    except Exception as ex:
        print('err', s, ex)
    if im is None:
        print('SIN FOTO', s); continue
    big = G.cover(im, 1280, 800) if im.width >= 1280 else G.cover(im, im.width, int(im.width / 1.6))
    big.save(os.path.join(G.LIB, s + '.jpg'), 'JPEG', quality=80, optimize=True, progressive=True)
    G.cover(im, 800, 500).save(os.path.join(G.LIB, s + '-800.jpg'), 'JPEG', quality=78, optimize=True, progressive=True)
    G.CR[s] = {'file': '', 'author': cred.replace('Foto: ', ''), 'license': '', 'page': ''}
    if s not in have:
        n, ne, c, i, r, t = meta[s]; ap = G.AIRPORTS.get(i) or []
        G.DLIB.append({'s': s, 'n': n, 'c': c, 'i': i, 'y': ap[0] if ap else None, 'x': ap[1] if ap else None, 'r': r, 't': t, 'a': [G.slugify(ne)] if G.slugify(ne) != s else [], 'auto': 1}); have.add(s)
    print('ok', s, cred)
json.dump(G.CR, open(os.path.join(G.LIB, 'credits.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(G.DLIB, open(os.path.join('hlc', 'destinos.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
