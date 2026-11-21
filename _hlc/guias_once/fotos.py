"""Fotos de biblioteca para las ciudades nuevas de las guías (una vez). Uso: python3 _hlc/guias_once/fotos.py"""
import os, sys, json, time
sys.path.insert(0, '_hlc'); sys.path.insert(0, '_hlc/guias_once')
import gen_deals as G
from cities import C
_fi = G.fetch_img
def _fetch(url):
    for w in ('1920px-', '1280px-'):
        im = _fi(url.replace('1600px-', w)) if '1600px-' in url else None
        if im is not None:
            return im
    return _fi(url)
G.fetch_img = _fetch
G.UA = {'User-Agent': 'HappyLowCostBot/1.0 (https://www.happylowcost.com; bot@happylowcost.com)'}
have = {p['s'] for p in G.DLIB}
added = []
for s, n, ne, c, i, r, t in C:
    if s in have and os.path.exists(os.path.join(G.LIB, s + '.jpg')):
        continue
    im, cred = None, ''
    for q in (ne, n):
        try:
            im, cred = G.city_photo(q, i, c)
        except Exception as ex:
            print('err', s, ex)
        if im is not None:
            break
        time.sleep(6)
    if im is None:
        try:
            im, cred = G.commons_photo(ne, c)
        except Exception as ex:
            print('err2', s, ex)
    if im is None:
        print('SIN FOTO', s); continue
    big = G.cover(im, 1600, 1000) if im.width >= 1600 else G.cover(im, im.width, int(im.width / 1.6))
    big.save(os.path.join(G.LIB, s + '.jpg'), 'JPEG', quality=80, optimize=True, progressive=True)
    G.cover(im, 800, 500).save(os.path.join(G.LIB, s + '-800.jpg'), 'JPEG', quality=78, optimize=True, progressive=True)
    G.CR[s] = {'file': '', 'author': cred.replace('Foto: ', '').split(' · ')[0], 'license': '', 'page': ''}
    if s not in have:
        ap = G.AIRPORTS.get(i) or []
        G.DLIB.append({'s': s, 'n': n, 'c': c, 'i': i, 'y': ap[0] if ap else None, 'x': ap[1] if ap else None, 'r': r, 't': t, 'a': [G.slugify(ne)] if G.slugify(ne) != s else [], 'auto': 1})
    added.append(s); print('ok', s, cred[:70]); time.sleep(6)
json.dump(G.CR, open(os.path.join(G.LIB, 'credits.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(G.DLIB, open(os.path.join('hlc', 'destinos.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print('nuevas', len(added))
