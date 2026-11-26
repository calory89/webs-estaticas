#!/usr/bin/env python3
"""kolaboro.com (n34a, 21 Nov 2026): market boundaries and area centres for the pin check, from OpenStreetMap (Nominatim).
  python3 n34a-boundaries.py <named.json> <out boundaries.json>
One request every 1.6 s (Nominatim usage policy), only for markets and areas that hold at least one pin. Only an OSM relation
with a polygon (administrative boundary or place outline, kind recorded) counts as the market boundary; a point is left out.
Data (c) OpenStreetMap contributors, ODbL 1.0."""
import json, math, sys, time, urllib.error, urllib.parse, urllib.request
from datetime import datetime, timezone
UA = 'KolaboroDataCheck/1.0 (+https://kolaboro.com/engineering/data-quality/pins/)'
named = json.load(open(sys.argv[1])); OUT = sys.argv[2]
try: old = json.load(open(OUT))
except Exception: old = {'m': {}, 'a': {}}
last = [0.0]
def q(text, poly, tries=4):
    u = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode({'q': text, 'format': 'jsonv2', 'limit': 1, 'polygon_geojson': 1 if poly else 0, 'polygon_threshold': 0.005, 'accept-language': 'en'})
    for k in range(tries):
        w = last[0] + 1.6 - time.time()
        if w > 0: time.sleep(w)
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers={'user-agent': UA}), timeout=60) as r: return (json.loads(r.read()) or [None])[0]
        except urllib.error.HTTPError as e:
            if e.code == 429: time.sleep(30 * (k + 1)); continue
            print('fail', text, e); return None
        except Exception as e:
            print('fail', text, e); return None
        finally: last[0] = time.time()
    print('gave up', text); return 'retry'
def save():
    json.dump({'source': 'OpenStreetMap Nominatim (nominatim.openstreetmap.org), (c) OpenStreetMap contributors, ODbL 1.0', 'read': datetime.now(timezone.utc).strftime('%Y-%m-%d'), 'm': M, 'a': A},
              open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'), sort_keys=True)
def rnd(c):
    if isinstance(c, list): return [rnd(x) for x in c]
    return round(c, 4)
P = [p for p in named['projects'] if (p.get('fx') or {}).get('lat') is not None and p.get('mk') != 'Sumba']
mk = sorted(set((p['mk'], p['co']) for p in P))
M, A = {}, {}
for m, co in mk:
    if m in old.get('m', {}): M[m] = old['m'][m]; continue
    r = q(m if m == co else m + ', ' + co, True)
    if r == 'retry': continue
    if r and r.get('osm_type') == 'relation' and r.get('geojson', {}).get('type') in ('Polygon', 'MultiPolygon'):
        bb = [float(x) for x in r['boundingbox']]
        M[m] = {'osm': 'relation/%s' % r['osm_id'], 'kind': r.get('category', '') + '/' + r.get('type', ''), 'name': r.get('name'), 'display': r.get('display_name'), 'bbox': bb, 'c': [round(float(r['lat']), 5), round(float(r['lon']), 5)], 'geo': {'type': r['geojson']['type'], 'coordinates': rnd(r['geojson']['coordinates'])}}
    else:
        M[m] = {'none': True, 'found': (r or {}).get('category', '') + '/' + (r or {}).get('type', '') if r else 'nothing'}
    print('market', m, 'ok' if M[m].get('geo') else M[m], flush=True)
    if len(M) % 10 == 0: save()
ar = sorted(set((p['mk'], p['co'], p.get('ar') or '') for p in P if p.get('ar')))
for m, co, a in ar:
    k = m + '|' + a
    if k in old.get('a', {}): A[k] = old['a'][k]; continue
    first = a.split(',')[0].split('(')[0].strip()
    r = q(first + ', ' + (m + ', ' if m != co else '') + co, False)
    if r == 'retry': continue
    if len(A) % 20 == 0: save()
    if r:
        bb = [float(x) for x in r['boundingbox']]
        rad = 0.5 * 6371 * math.hypot((bb[3] - bb[2]) * math.pi / 180 * math.cos((bb[0] + bb[1]) / 2 * math.pi / 180), (bb[1] - bb[0]) * math.pi / 180)
        A[k] = {'q': first, 'c': [round(float(r['lat']), 5), round(float(r['lon']), 5)], 'r': round(rad, 1), 'osm': '%s/%s' % (r.get('osm_type'), r.get('osm_id')), 'type': r.get('category', '') + '/' + r.get('type', '')}
save()
print('markets', len(M), 'with boundary', sum(1 for v in M.values() if v.get('geo')), 'areas', len(A))
