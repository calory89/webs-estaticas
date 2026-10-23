"""Exporta el top 3 de hoteles por ciudad de top3hotels.com (repo calory89/top-3-hotels, src/generated)
a hlc/top3.json para enseñarlo en cada chollo. Uso: python3 _hlc/top3_export.py /ruta/top-3-hotels"""
import json, sys, os, re
from urllib.parse import urlsplit
src = os.path.join(sys.argv[1], 'src', 'generated')
P = json.load(open(os.path.join(src, 'catalogue-packed.json')))
S, SC = P['dictionary']
def w(v):
    if isinstance(v, list):
        if v and v[0] == -1: return [w(x) for x in v[1:]]
        if v and v[0] == -2:
            ks = SC[v[1]] if v[1] < len(SC) else []
            return {k: w(v[i + 2]) for i, k in enumerate(ks)}
        return [w(x) for x in v]
    if isinstance(v, dict):
        if 's' in v and len(v) == 1: return S[v['s']]
        return {k: w(x) for k, x in v.items()}
    return v
idx = {c['id']: c for c in json.load(open(os.path.join(src, 'seo-data.json')))['cities']}
CAT = {'Budget': 'b', 'Best Value': 'v', 'Value': 'v', 'Luxury': 'l'}
out = []
for cid, raw in P['cities'].items():
    c = w(raw); ix = idx.get(cid)
    if not ix or not c.get('hotels'): continue
    hs = []
    for h in c['hotels'][:3]:
        bk = h.get('booking') or {}
        u = bk.get('url') or ''
        if 'booking.com/hotel/' not in u: continue
        pu = urlsplit(u); burl = f'https://www.booking.com{pu.path}'
        img = next((g.get('src') for g in (h.get('gallery') or []) if 'bstatic.com' in (g.get('src') or '')), None)
        if img: img = re.sub(r'/max\d+x\d+/', '/max500/', img)
        of = h.get('offer') or {}
        hs.append([h.get('name'), CAT.get(h.get('category'), 'v'), h.get('area') or '', bk.get('score'), bk.get('count'), bk.get('stars'),
                   round(of['nightly']) if of.get('nightly') else None, burl, img])
    if len(hs) < 3: continue
    out.append([ix['slug'], ix['city'], ix.get('cc') or '', round(ix['lat'], 3), round(ix['lng'], 3), ix.get('pop') or 0, hs])
json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'top3.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(out), 'ciudades')
