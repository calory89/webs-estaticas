#!/usr/bin/env python3
"""Kolaboro construction progress from space, per named project (batch 14, f14b). No model calls, no paid data.

For every tracked project whose own coordinates are precise enough to stand for the plot (see select()), a monthly series from
Copernicus Sentinel-2 L2A (Element84 Earth Search STAC, COGs on AWS Open Data, read with HTTP range requests, no account):
  - per month, up to 2 scenes from one MGRS tile that see at least 90% of a 150 m circle around the pin without cloud
    (scene classification), per-pixel median;
  - b: share of the circle that looks built-up or bare (NDBI > 0 and NDVI < 0.25; at 10 m a cleared plot and a slab look alike);
  - r: the same share in a ring 300 to 600 m from the pin (the surroundings, for season and haze);
  - x: change index, share of the circle that differs visibly from the first clear month (true-colour brightness moved by more
    than 25 of 255, or the pixel switched between built-up/bare and not with NDBI moving more than 0.1), after subtracting the
    median shift of the ring (same rule as stalled.py);
  - one true-colour thumbnail per clear month (640 m square), all months of a project in one JPEG sprite.
Writes OUT/part-<shard>.json and OUT/proj/<ID>.jpg. Coordinates are not written to the output.

Usage: progress.py OUTDIR [--from 2023-07] [--shard 0/4] [--only ID,ID] [--workers 16] [--budget-min 70]"""
import json, os, sys, math, time, datetime, argparse, concurrent.futures, statistics
os.environ.setdefault('AWS_NO_SIGN_REQUEST', 'YES')
os.environ.setdefault('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR')
os.environ.setdefault('CPL_VSIL_CURL_ALLOWED_EXTENSIONS', '.tif')
os.environ.setdefault('GDAL_HTTP_MULTIRANGE', 'YES')
os.environ.setdefault('GDAL_HTTP_MERGE_CONSECUTIVE_RANGES', 'YES')
os.environ.setdefault('GDAL_HTTP_MAX_RETRY', '4')
os.environ.setdefault('GDAL_HTTP_RETRY_DELAY', '2')
import numpy as np
import rasterio
from rasterio.windows import from_bounds
from rasterio.warp import transform as warp_xy
from pystac_client import Client
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__)); AG = os.path.join(HERE, '..', 'kolaboro-agent')
STAC = 'https://earth-search.aws.element84.com/v1'
RADIUS_M, RING_M, THUMB_M = 150, (300, 600), 320     # analysis circle, surroundings ring, thumbnail half-width
CLEAR = (4, 5, 6)              # SCL vegetation, not vegetated, water. Cloud, cirrus, shadow, dark, unclassified, snow, no data removed
MIN_CLEAR, MIN_RING = 0.9, 0.5
PER_MONTH, CHECK_PER_MONTH = 2, 4
LUM_DELTA, NDBI_DELTA = 25.0, 0.1
BUILT_NDBI, BUILT_NDVI = 0.0, 0.25
TILE_PX = 96
COI_MARKETS = {'sumba'}        # never named (independence policy): no series either
AREA_SITES = os.path.join(AG, 'satellite-sites.json')


def decimals(v):
    s = str(v)
    return len(s.split('.', 1)[1].rstrip('0')) if '.' in s else 0


def select():
    """Tracked projects with a plot-level pin from our own records (projects.json facts lat/lng). Skipped as area-level:
    fewer than 3 decimals (rounded to about 1 km), a pin shared with another project, or a pin within 300 m of the centre of
    one of our watched development areas (those are area pins, not plots). Same id rule as agent.public_cases()."""
    sys.path.insert(0, AG)
    import agent  # noqa: E402 (constants only)
    P = json.load(open(os.path.join(AG, 'projects.json')))['projects'] + json.load(open(os.path.join(AG, 'projects-world.json'))).get('projects', [])
    areas = [(s['lat'], s['lng']) for s in json.load(open(AREA_SITES))['sites'] if s.get('kind') == 'area']
    n, out, skip = {}, [], {'no_coordinates': 0, 'rounded_area_pin': 0, 'shared_pin': 0, 'area_centre': 0, 'coi_market': 0}
    rows = []
    for p in sorted(P, key=lambda x: x.get('market', 'Bali') != 'Bali'):
        mk = p.get('market', 'Bali'); n[mk] = n.get(mk, 0) + 1
        cid = '%s-%03d' % (agent.PREFIX.get(mk, mk[:3].upper()), n[mk])
        fx = p.get('facts') or {}
        try: lat, lng = float(fx.get('lat')), float(fx.get('lng'))
        except (TypeError, ValueError): skip['no_coordinates'] += 1; continue
        if not (-60 <= lat <= 75 and -180 <= lng <= 180): skip['no_coordinates'] += 1; continue
        rows.append((cid, mk, lat, lng, min(decimals(fx.get('lat')), decimals(fx.get('lng')))))
    cnt = {}
    for r in rows: cnt[(round(r[2], 4), round(r[3], 4))] = cnt.get((round(r[2], 4), round(r[3], 4)), 0) + 1
    for cid, mk, lat, lng, dec in rows:
        if mk.lower() in COI_MARKETS: skip['coi_market'] += 1; continue
        if dec < 3: skip['rounded_area_pin'] += 1; continue
        if cnt[(round(lat, 4), round(lng, 4))] > 1: skip['shared_pin'] += 1; continue
        if any(math.hypot((lat - a) * 111000, (lng - b) * 111000 * math.cos(math.radians(lat))) < 300 for a, b in areas): skip['area_centre'] += 1; continue
        out.append({'id': cid, 'market': mk, 'lat': lat, 'lng': lng})
    return out, skip


def refl(item, asset, arr):
    """DN to reflectance; no double offset when Earth Search already harmonised the DNs (see satellite_optical.py)."""
    rb = (asset.extra_fields.get('raster:bands') or [{}])[0]
    sc = rb.get('scale', 0.0001)
    off = 0.0 if item.properties.get('earthsearch:boa_offset_applied') else rb.get('offset', 0.0)
    a = arr.astype('float32') * sc + off
    a[arr == 0] = np.nan
    return np.clip(a, 0, None)


class Win:
    def __init__(self, crs, lat, lng):
        xs, ys = warp_xy('EPSG:4326', crs, [lng], [lat]); x, y = xs[0], ys[0]
        R_ = RING_M[1]
        self.b = (math.floor((x - R_) / 20) * 20, math.floor((y - R_) / 20) * 20, math.ceil((x + R_) / 20) * 20, math.ceil((y + R_) / 20) * 20)
        self.h, self.w = int(round((self.b[3] - self.b[1]) / 10)), int(round((self.b[2] - self.b[0]) / 10))
        yy, xx = np.mgrid[0:self.h, 0:self.w]
        cx, cy = self.b[0] + (xx + .5) * 10, self.b[3] - (yy + .5) * 10
        d2 = (cx - x) ** 2 + (cy - y) ** 2
        self.mask = d2 <= RADIUS_M ** 2
        self.ring = (d2 >= RING_M[0] ** 2) & (d2 <= RING_M[1] ** 2)
        self.px = ((x - self.b[0]) / 10, (self.b[3] - y) / 10)      # pin in pixel coordinates

    def read(self, href, shape, bands=1):
        with rasterio.open(href) as ds:
            return ds.read(bands, window=from_bounds(*self.b, transform=ds.transform), out_shape=shape, boundless=True, fill_value=0)


def crs_of(item):
    return 'EPSG:%d' % int(item.properties.get('proj:epsg') or str(item.properties.get('proj:code', '')).split(':')[-1])


def tile_of(it):
    return it.properties.get('s2:mgrs_tile') or it.properties.get('grid:code') or it.id.split('_')[1]


def inside(pt, geom):
    """point in the item footprint (polygon or multipolygon, outer rings)"""
    polys = [geom['coordinates']] if geom.get('type') == 'Polygon' else geom.get('coordinates', [])
    x, y = pt
    for poly in polys:
        ring = poly[0]; c = False; j = len(ring) - 1
        for i in range(len(ring)):
            xi, yi = ring[i][:2]; xj, yj = ring[j][:2]
            if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-12) + xi: c = not c
            j = i
        if c: return True
    return False


def scene(item, w):
    scl = w.read(item.assets['scl'].href, (w.h, w.w))
    clear = np.isin(scl, CLEAR)
    frac = float(clear[w.mask].mean())
    if frac < MIN_CLEAR or float(clear[w.ring].mean()) < MIN_RING: return frac, None
    rgb = w.read(item.assets['visual'].href, (3, w.h, w.w), bands=(1, 2, 3)).astype('float32')
    red = refl(item, item.assets['red'], w.read(item.assets['red'].href, (w.h, w.w)))
    nir = refl(item, item.assets['nir'], w.read(item.assets['nir'].href, (w.h, w.w)))
    swir = refl(item, item.assets['swir16'], w.read(item.assets['swir16'].href, (w.h, w.w)))
    ok = clear & (rgb.sum(0) > 0) & np.isfinite(red) & np.isfinite(nir) & np.isfinite(swir)
    return frac, {'rgb': rgb, 'ndvi': (nir - red) / (nir + red + 1e-6), 'ndbi': (swir - nir) / (swir + nir + 1e-6), 'ok': ok, 'date': item.datetime.date().isoformat()}


def compose(sc):
    ok = np.stack([s['ok'] for s in sc])
    def med(arrs):
        a = np.stack(arrs).astype('float32'); a[~ok] = np.nan
        with np.errstate(all='ignore'): return np.nanmedian(a, axis=0)
    rgb = np.stack([med([s['rgb'][c] for s in sc]) for c in range(3)])
    return {'rgb': rgb, 'lum': 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2], 'ndvi': med([s['ndvi'] for s in sc]), 'ndbi': med([s['ndbi'] for s in sc]), 'seen': ok.any(0)}


def built(c):
    with np.errstate(invalid='ignore'): return (c['ndbi'] > BUILT_NDBI) & (c['ndvi'] < BUILT_NDVI)


def change(a, b, w):
    both = a['seen'] & b['seen'] & w.mask
    if both.sum() < 0.8 * w.mask.sum(): return None
    rr = a['seen'] & b['seen'] & w.ring
    if rr.sum() < 0.5 * w.ring.sum(): return None
    dl, dn = b['lum'] - a['lum'], b['ndbi'] - a['ndbi']
    dl = dl - float(np.nanmedian(dl[rr])); dn = dn - float(np.nanmedian(dn[rr]))
    ch = (np.abs(dl) > LUM_DELTA) | ((built(a) != built(b)) & (np.abs(dn) > NDBI_DELTA))
    return float(ch[both].mean() * 100)


def crop(c, w):
    half = THUMB_M // 10; cx, cy = int(round(w.px[0])), int(round(w.px[1]))
    return c['rgb'].transpose(1, 2, 0)[max(0, cy - half):cy + half, max(0, cx - half):cx + half]


def thumb(a, lo, hi):
    """one linear stretch for every month of a project (0 to the 99.5th percentile of all its frames), so months stay comparable"""
    a = (np.nan_to_num(a, nan=lo) - lo) / max(hi - lo, 1.0) * 255
    im = Image.fromarray(np.clip(a, 0, 255).astype('uint8'), 'RGB').resize((TILE_PX, TILE_PX), Image.LANCZOS)
    r = RADIUS_M / (2 * THUMB_M) * TILE_PX; m = TILE_PX / 2
    d = ImageDraw.Draw(im, 'RGBA'); d.ellipse((m - r, m - r, m + r, m + r), outline=(255, 255, 255, 170), width=1)
    return im


def months(a, b):
    y, m = a; out = []
    while (y, m) <= b:
        out.append('%04d-%02d' % (y, m)); m += 1
        if m == 13: y, m = y + 1, 1
    return out


def project(cat, p, mlist, outdir, deadline):
    t0 = time.time(); N = len(mlist)
    rec = {'m0': mlist[0], 'n': N, 'k': [0] * N, 'c': [None] * N, 'b': [None] * N, 'r': [None] * N, 'x': [None] * N, 'f': [-1] * N, 'dt': [''] * N}
    if time.time() > deadline: rec['status'] = 'not processed (time budget)'; return rec
    d = 0.007
    win_pts = [(p['lng'] - .006, p['lat'] - .006), (p['lng'] + .006, p['lat'] - .006), (p['lng'] - .006, p['lat'] + .006), (p['lng'] + .006, p['lat'] + .006)]
    try:
        items = list(cat.search(collections=['sentinel-2-l2a'], bbox=(p['lng'] - d, p['lat'] - d, p['lng'] + d, p['lat'] + d),
                                datetime='%s-01T00:00:00Z/%sT23:59:59Z' % (mlist[0], last_day(mlist[-1])), query={'eo:cloud_cover': {'lt': 70}}, limit=200).items())
    except Exception as e:
        rec['status'] = 'search failed'; print('search fail', p['id'], str(e)[:120]); return rec
    items = [it for it in items if all(inside(q, it.geometry or {}) for q in win_pts)]   # footprint covers the whole window
    if not items: rec['status'] = 'no scenes listed'; return rec
    tiles = {}
    for it in items: tiles[tile_of(it)] = tiles.get(tile_of(it), 0) + 1
    tile = max(tiles, key=tiles.get); rec['t'] = tile
    items = [it for it in items if tile_of(it) == tile]
    w = Win(crs_of(items[0]), p['lat'], p['lng'])
    by = {}
    for it in items: by.setdefault(it.datetime.strftime('%Y-%m'), []).append(it)
    base, frames, reads = None, [], 0
    for i, mo in enumerate(mlist):
        cands = sorted(by.get(mo, []), key=lambda it: it.properties.get('eo:cloud_cover', 100))
        rec['k'][i] = len(cands)
        if time.time() > deadline: rec['status_note'] = 'time budget reached at ' + mo; break
        got = []
        for it in cands[:CHECK_PER_MONTH]:
            try: fr, s = scene(it, w); reads += 1
            except Exception as e: print('read fail', p['id'], it.id, str(e)[:100]); continue
            if s is not None: got.append(s)
            if len(got) >= PER_MONTH: break
        if not got: continue
        c = compose(got)
        seen = c['seen'] & w.mask
        if seen.sum() < MIN_CLEAR * w.mask.sum(): continue
        rec['c'][i] = int(round(seen.sum() / w.mask.sum() * 100))
        bl = built(c)
        rec['b'][i] = int(round(float((bl & seen).sum()) / float(seen.sum()) * 100))
        rs = c['seen'] & w.ring
        if rs.sum(): rec['r'][i] = int(round(float((bl & rs).sum()) / float(rs.sum()) * 100))
        if base is None: base = c; rec['base'] = mo; rec['x'][i] = 0
        else:
            v = change(base, c, w); rec['x'][i] = None if v is None else int(round(v))
        rec['dt'][i] = min(s['date'] for s in got)
        rec['f'][i] = len(frames); frames.append(crop(c, w))
    if frames:
        allv = np.concatenate([f.reshape(-1) for f in frames]); allv = allv[np.isfinite(allv) & (allv > 0)]
        lo, hi = (0.0, max(float(np.percentile(allv, 99.5)), 60.0)) if allv.size else (0.0, 255.0)
        frames = [thumb(f, lo, hi) for f in frames]
        sp = Image.new('RGB', (TILE_PX * len(frames), TILE_PX))
        for j, im in enumerate(frames): sp.paste(im, (j * TILE_PX, 0))
        os.makedirs(os.path.join(outdir, 'proj'), exist_ok=True)
        sp.save(os.path.join(outdir, 'proj', p['id'] + '.jpg'), quality=74, optimize=True, progressive=True)
    clear = [i for i in range(N) if rec['c'][i] is not None]
    rec['frames'] = len(frames); rec['clear_months'] = len(clear); rec['reads'] = reads; rec['seconds'] = round(time.time() - t0)
    if len(clear) < 6: rec.setdefault('status', 'too few clear months'); return rec
    rec['status'] = 'ok'
    # headline: median of the first 3 clear months against the median of the last 3 clear months
    def med(k, idx): v = [rec[k][i] for i in idx if rec[k][i] is not None]; return None if not v else statistics.median(v)
    a, b = clear[:3], clear[-3:]
    rec['sum'] = {'first': [mlist[a[0]], mlist[a[-1]]], 'last': [mlist[b[0]], mlist[b[-1]]],
                  'x_last': med('x', b), 'b_first': med('b', a), 'b_last': med('b', b), 'r_first': med('r', a), 'r_last': med('r', b)}
    return rec


def last_day(mo):
    y, m = map(int, mo.split('-'))
    return (datetime.date(y + (m == 12), m % 12 + 1, 1) - datetime.timedelta(days=1)).isoformat()


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('outdir')
    ap.add_argument('--from', dest='frm', default='2023-07'); ap.add_argument('--to', default='')
    ap.add_argument('--shard', default='0/1'); ap.add_argument('--only', default='')
    ap.add_argument('--workers', type=int, default=16); ap.add_argument('--budget-min', type=float, default=70)
    a = ap.parse_args()
    sel, skip = select()
    k, n = map(int, a.shard.split('/'))
    todo = [p for i, p in enumerate(sel) if i % n == k]
    if a.only: todo = [p for p in sel if p['id'] in a.only.split(',')]
    today = datetime.date.today()
    prev = (today.replace(day=1) - datetime.timedelta(days=1))
    end = tuple(map(int, a.to.split('-'))) if a.to else (prev.year, prev.month)     # last complete month
    mlist = months(tuple(map(int, a.frm.split('-'))), end)
    os.makedirs(a.outdir, exist_ok=True)
    cat = Client.open(STAC)
    t0 = time.time(); deadline = t0 + a.budget_min * 60; res = {}
    print('selected', len(sel), 'skipped', skip, 'this shard', len(todo), 'months', mlist[0], mlist[-1], flush=True)
    with concurrent.futures.ThreadPoolExecutor(a.workers) as ex:
        futs = {ex.submit(project, cat, p, mlist, a.outdir, deadline): p for p in todo}
        for f in concurrent.futures.as_completed(futs):
            p = futs[f]
            try: res[p['id']] = f.result()
            except Exception as e: res[p['id']] = {'status': 'failed'}; print('fail', p['id'], str(e)[:160])
            r = res[p['id']]; print(p['id'], r.get('status'), r.get('clear_months'), r.get('frames'), r.get('reads'), r.get('seconds'), flush=True)
    json.dump({'shard': a.shard, 'selected': len(sel), 'skipped': skip, 'from': mlist[0], 'to': mlist[-1], 'seconds': round(time.time() - t0), 'projects': res},
              open(os.path.join(a.outdir, 'part-%d.json' % k), 'w'), separators=(',', ':'))
    print('done', len(res), 'in', round(time.time() - t0), 's')


if __name__ == '__main__':
    main()
