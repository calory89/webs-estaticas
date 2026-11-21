# Contactos publicos (email / web) de entidades de ayuda en el mapa, por ciudad, para Espana e Irlanda.
import gzip, json, re, io, os, math, csv, sys
W = '/home/claude/sn/work_osm'
src = open(W + '/city_pages.py', encoding='utf-8').read()
cut = src.index("LDESC = ")
os.chdir(W)
exec(compile(src[:cut], 'cp', 'exec'))
# ciudades con slug como en las paginas
CI = []
for c in CITIES:
    raw, lat, lon, country = c[0], c[1], c[2], c[3] or ''
    cc = (c[4] if len(c) > 4 and c[4] else '') or ''
    if cc == 'ES' or (not cc and ((35.0 <= lat <= 44.0 and -9.5 <= lon <= 4.5) or (27.5 <= lat <= 29.5 and -18.5 <= lon <= -13.3))): cc = 'ES'
    CI.append((lat, lon, cc, raw))
built = {}
for f in os.listdir('c'):
    if f.endswith('.html') and '-' not in f[:-5] or f.count('.') == 1:
        pass
sm = open('sitemap-main.xml', encoding='utf-8').read()
city_urls = set(re.findall(r'<loc>https://supportnear.com/c/([^<.]+)</loc>', sm))
places_sm = open('sitemap-places.xml', encoding='utf-8').read()
place_ids = {}
for u in re.findall(r'<loc>https://supportnear.com/s/([^<]+)</loc>', places_sm):
    m = re.search(r'-([nwr])(\d+)$', u)
    if m: place_ids[({'n': 'node', 'w': 'way', 'r': 'relation'}[m.group(1)], int(m.group(2)))] = u
def kind(t):
    a, sf = t.get('amenity', ''), t.get('social_facility', '')
    if a == 'food_bank' or sf in ('food_bank', 'soup_kitchen') or t.get('social_facility:for') == 'homeless' and sf == 'outreach': return 'comida'
    if a == 'shelter' and sf or sf in ('shelter', 'group_home') : return 'albergue'
    if a == 'social_facility' or sf: return 'social'
    if a == 'library': return 'biblioteca'
    if a == 'townhall': return 'ayuntamiento'
    if a == 'social_centre' or a == 'community_centre': return 'centro social'
    return ''
OURS = {}
for p in places:
    t_, i_ = str(p['id']).split('/')
    OURS[(t_, int(i_))] = p
def kind_ours(p):
    c = p['cat']
    if c == 'food': return 'comida'
    if c == 'shelter': return 'albergue'
    if c == 'social': return 'social'
    if c == 'clothes': return 'ropa'
    if c == 'legal': return 'legal'
    if c == 'warm' and p['sub'] == 'library': return 'biblioteca'
    if c == 'warm' and p['sub'] in ('community_centre', 'social_centre'): return 'centro social'
    return ''
rows = {}
for fn in ('cities.jsonl.gz', 'planet.jsonl.gz', 'keep.jsonl.gz', 'nat.jsonl.gz'):
    for line in gzip.open('raw/' + fn, 'rt', encoding='utf-8'):
        d = json.loads(line)
        for e in d.get('els', []):
            t = e.get('tags', {})
            p_ = OURS.get((e.get('type'), e.get('id')))
            if not p_ or not t.get('name'): continue
            k = kind_ours(p_)
            if not k: continue
            em = t.get('email') or t.get('contact:email') or ''
            web = t.get('website') or t.get('contact:website') or t.get('url') or ''
            if not em and not web: continue
            lat, lon = e.get('lat'), e.get('lon')
            if lat is None:
                c = e.get('center') or {}; lat, lon = c.get('lat'), c.get('lon')
            if lat is None: continue
            best = None
            for clat, clon, cc, raw in CI:
                if abs(clat - lat) > 0.2 or abs(clon - lon) > 0.3: continue
                dd = hav(lat, lon, clat, clon)
                if dd <= 10000 and (best is None or dd < best[0]): best = (dd, cc, raw)
            if not best or best[1] not in ('ES', 'IE') and not (best[1] == '' and 51.3 < lat < 55.5 and -10.7 < lon < -5.9): continue
            cc = best[1] or 'IE'
            key = (e['type'], e['id'])
            nm, local = split_name(best[2])
            sl = slug(nm)
            page = ('https://supportnear.com/s/' + place_ids[key]) if key in place_ids else ('https://supportnear.com/c/' + sl if sl in city_urls else '')
            rows[key] = {'pais': cc, 'ciudad': nm, 'tipo': k, 'nombre': t['name'], 'email': em.split(';')[0].strip(), 'web': web.split(';')[0].strip(),
                         'telefono': t.get('phone') or t.get('contact:phone') or '', 'pagina_supportnear': page,
                         'osm': 'https://www.openstreetmap.org/%s/%s' % key}
out = sorted(rows.values(), key=lambda r: (r['pais'], {'comida': 0, 'albergue': 1, 'ropa': 2, 'legal': 3, 'social': 4, 'centro social': 5, 'biblioteca': 6}[r['tipo']], r['ciudad'], r['nombre']))
with open('/home/claude/sn/outreach/contactos_es_ie.csv', 'w', encoding='utf-8', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(out[0].keys())); w.writeheader(); w.writerows(out)
from collections import Counter
print(len(out), Counter((r['pais'], r['tipo']) for r in out).most_common(), 'con email', sum(1 for r in out if r['email']), 'con pagina', sum(1 for r in out if r['pagina_supportnear']))
