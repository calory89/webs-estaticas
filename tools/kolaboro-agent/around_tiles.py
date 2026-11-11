#!/usr/bin/env python3
"""OpenStreetMap features near a pin, read from OpenFreeMap vector tiles (OpenMapTiles schema, weekly planet build).
No key, no account. Tiles are cached on disk so a rerun asks for nothing twice."""
import math, os, time, gzip, json, requests
import mapbox_vector_tile
from shapely.geometry import shape, Point
from shapely.ops import transform

UA = {'user-agent': 'KolaboroAround/1.0 (+https://kolaboro.com/methods/)'}
S = requests.Session(); S.headers.update(UA)
CACHE = os.environ.get('TILE_CACHE', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tiles'))
_TJ = {}
STATS = {'fetched': 0, 'bytes': 0, 'cached': 0}


def tilejson():
    if not _TJ:
        p = os.path.join(CACHE, 'tilejson.json')
        if os.path.exists(p): _TJ.update(json.load(open(p)))
        else:
            j = S.get('https://tiles.openfreemap.org/planet', timeout=60).json()
            os.makedirs(CACHE, exist_ok=True); json.dump({'tiles': j['tiles'][0]}, open(p, 'w')); _TJ.update({'tiles': j['tiles'][0]})
    return _TJ['tiles']


def build():   # the planet build the tiles come from, e.g. 20261101
    return tilejson().split('/planet/')[1].split('_')[0]


def km(a, b, c, d):
    R = math.radians
    x = math.sin(R(c - a) / 2) ** 2 + math.cos(R(a)) * math.cos(R(c)) * math.sin(R(d - b) / 2) ** 2
    return 12742 * math.asin(min(1, math.sqrt(x)))


def txy(lat, lng, z):
    n = 2 ** z
    x = (lng + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y


def tile_km(lat, z):
    return 40075.017 * math.cos(math.radians(lat)) / 2 ** z


def fetch(z, x, y):
    n = 2 ** z; x %= n
    if y < 0 or y >= n: return {}
    p = os.path.join(CACHE, str(z), str(x), str(y) + '.pbf')
    if os.path.exists(p):
        b = open(p, 'rb').read(); STATS['cached'] += 1
    else:
        url = tilejson().replace('{z}', str(z)).replace('{x}', str(x)).replace('{y}', str(y))
        b = None
        for k in range(4):
            try:
                r = S.get(url, timeout=60)
                if r.status_code == 200: b = r.content; break
                if r.status_code in (204, 404): b = b''; break
            except Exception: pass
            time.sleep(2 + 3 * k)
        if b is None: raise RuntimeError('tile failed ' + url)
        os.makedirs(os.path.dirname(p), exist_ok=True); open(p, 'wb').write(b)
        STATS['fetched'] += 1; STATS['bytes'] += len(b); time.sleep(0.05)
    if not b: return {}
    if b[:2] == b'\x1f\x8b': b = gzip.decompress(b)
    return mapbox_vector_tile.decode(b, default_options={'y_coord_down': True})


def lonlat(z, x, y, ext):
    def f(px, py, pz=None):
        n = 2 ** z
        gx = (x + px / ext) / n; gy = (y + py / ext) / n
        return gx * 360 - 180, math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * gy))))
    return f


def features(lat, lng, z, ring, layers):
    """Yield (layer, props, geometry in tile units, to_lonlat, extent) for the (2*ring+1)^2 tiles around the pin."""
    fx, fy = txy(lat, lng, z); cx, cy = int(fx), int(fy)
    for dx in range(-ring, ring + 1):
        for dy in range(-ring, ring + 1):
            t = fetch(z, cx + dx, cy + dy)
            for ln in layers:
                L = t.get(ln)
                if not L: continue
                ext = L.get('extent', 4096); f = lonlat(z, (cx + dx) % 2 ** z, cy + dy, ext)
                for ft in L['features']:
                    try: g = shape(ft['geometry'])
                    except Exception: continue
                    if g.is_empty: continue
                    yield ln, ft.get('properties') or {}, g, f, ext


def covered_km(lat, lng, z, ring):
    """Radius around the pin that the fetched tiles cover fully (km)."""
    fx, fy = txy(lat, lng, z); ox, oy = fx - int(fx), fy - int(fy)
    return (ring + min(ox, 1 - ox, oy, 1 - oy)) * tile_km(lat, z)


def local(lat, lng):
    """lon/lat -> metres east/north of the pin (equirectangular; fine under 100 km)."""
    k = 111320.0; c = math.cos(math.radians(lat))
    return lambda x, y, z=None: ((x - lng) * k * c, (y - lat) * 110574.0)
