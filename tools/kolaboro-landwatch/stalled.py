#!/usr/bin/env python3
"""Kolaboro stalled-site check for every tracked project with coordinates (block U, batch 4).

Sentinel-2 L2A from Element84 Earth Search (STAC) and the COGs on AWS Open Data (no account, no cost), the same source and cloud
rules as satellite_optical.py, but a much smaller window: a 150 m radius around the pin. Per calendar quarter (newest first) we take
up to 2 scenes from one MGRS tile that see at least 90% of the window without cloud (scene classification), and build a per-pixel
median. Between each pair of consecutive clear quarters we count the share of pixels that changed visibly: true-colour brightness
moved by more than 25 (of 255), or the pixel switched between built-up/bare and vegetated with an NDBI move above 0.1.
no_visible_change_months: how far back from the newest clear quarter every consecutive pair stayed under the threshold (0 = the
newest pair already shows change). Published per anonymous case id, rounded, no coordinates.
Usage: stalled.py IDS.json OUT.json [--quarters 6] [--budget-min 70] [--workers 8]"""
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
from rasterio.enums import Resampling
from pystac_client import Client

STAC = 'https://earth-search.aws.element84.com/v1'
RADIUS_M = 150
RING_M = (300, 600)        # reference ring: the median change there is the scene-wide shift (sun angle, haze, season) and is subtracted
CLEAR = (4, 5, 6)            # SCL vegetation, not vegetated, water (same as satellite_optical.py)
MIN_CLEAR = 0.9              # scene must see 90% of the window without cloud
PER_QUARTER = 2              # clearest scenes per quarter in the composite
CHECK_PER_QUARTER = 6        # scenes whose cloud mask we read per quarter, lowest listed cloud cover first
LUM_DELTA, NDBI_DELTA = 25.0, 0.1
CHANGE_PCT = 10              # a pair with at least this share of changed pixels counts as visible change
BUILT_NDBI, BUILT_NDVI = 0.0, 0.25


def quarter(d): return '%d-Q%d' % (d.year, (d.month - 1) // 3 + 1)
def qmid(q): y, n = q.split('-Q'); return int(y) * 12 + (int(n) - 1) * 3 + 1   # month index of the quarter's middle month


def refl(item, asset, arr):
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
        self.h10, self.w10 = int(round((self.b[3] - self.b[1]) / 10)), int(round((self.b[2] - self.b[0]) / 10))
        yy, xx = np.mgrid[0:self.h10, 0:self.w10]
        cx, cy = self.b[0] + (xx + .5) * 10, self.b[3] - (yy + .5) * 10
        d2 = (cx - x) ** 2 + (cy - y) ** 2
        self.mask = d2 <= RADIUS_M ** 2
        self.ring = (d2 >= RING_M[0] ** 2) & (d2 <= RING_M[1] ** 2)

    def read(self, href, shape, bands=1, resampling=Resampling.nearest):
        with rasterio.open(href) as ds:
            return ds.read(bands, window=from_bounds(*self.b, transform=ds.transform), out_shape=shape, boundless=True, fill_value=0, resampling=resampling)


def crs_of(item):
    return 'EPSG:%d' % int(item.properties.get('proj:epsg') or str(item.properties.get('proj:code', '')).split(':')[-1])


def scene(item, w):
    scl = w.read(item.assets['scl'].href, (w.h10, w.w10))
    clear = np.isin(scl, CLEAR)
    frac = float(clear[w.mask].mean())
    if frac < MIN_CLEAR or float(clear[w.ring].mean()) < 0.5: return frac, None
    rgb = w.read(item.assets['visual'].href, (3, w.h10, w.w10), bands=(1, 2, 3)).astype('float32')
    red = refl(item, item.assets['red'], w.read(item.assets['red'].href, (w.h10, w.w10)))
    nir = refl(item, item.assets['nir'], w.read(item.assets['nir'].href, (w.h10, w.w10)))
    swir = refl(item, item.assets['swir16'], w.read(item.assets['swir16'].href, (w.h10, w.w10)))
    ok = clear & (rgb.sum(0) > 0) & np.isfinite(red) & np.isfinite(nir) & np.isfinite(swir)
    return frac, {'lum': 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2], 'ndvi': (nir - red) / (nir + red + 1e-6), 'ndbi': (swir - nir) / (swir + nir + 1e-6), 'ok': ok,
                  'date': item.datetime.date().isoformat()}


def compose(sc):
    ok = np.stack([s['ok'] for s in sc])
    def med(k):
        a = np.stack([s[k] for s in sc]).astype('float32'); a[~ok] = np.nan
        with np.errstate(all='ignore'): return np.nanmedian(a, axis=0)
    return {'lum': med('lum'), 'ndvi': med('ndvi'), 'ndbi': med('ndbi'), 'seen': ok.any(0)}


def change(a, b, w):
    both = a['seen'] & b['seen'] & w.mask
    if both.sum() < 0.8 * w.mask.sum(): return None
    rr = a['seen'] & b['seen'] & w.ring
    if rr.sum() < 0.5 * w.ring.sum(): return None
    dl, dn = b['lum'] - a['lum'], b['ndbi'] - a['ndbi']
    dl = dl - float(np.nanmedian(dl[rr])); dn = dn - float(np.nanmedian(dn[rr]))   # remove the scene-wide shift measured on the ring
    ba = (a['ndbi'] > BUILT_NDBI) & (a['ndvi'] < BUILT_NDVI); bb = (b['ndbi'] > BUILT_NDBI) & (b['ndvi'] < BUILT_NDVI)
    ch = (np.abs(dl) > LUM_DELTA) | ((ba != bb) & (np.abs(dn) > NDBI_DELTA))
    return float(ch[both].mean() * 100)


def project(cat, p, qlist, deadline):
    t0 = time.time(); rec = {'quarters_checked': 0, 'scenes_checked': 0}
    if time.time() > deadline: rec['status'] = 'not processed (time budget)'; return rec
    d = 0.003
    try:
        items = list(cat.search(collections=['sentinel-2-l2a'], bbox=(p['lng'] - d, p['lat'] - d, p['lng'] + d, p['lat'] + d),
                                datetime='%s/%s' % (qlist[0][1].isoformat() + 'T00:00:00Z', datetime.date.today().isoformat() + 'T23:59:59Z'),
                                query={'eo:cloud_cover': {'lt': 70}}, limit=200).items())
    except Exception as e:
        rec['status'] = 'search failed'; print('search fail', p['id'], str(e)[:120]); return rec
    if not items: rec['status'] = 'no scenes listed'; return rec
    tiles = {}
    for it in items: tiles[it.properties.get('s2:mgrs_tile') or it.id.split('_')[1]] = tiles.get(it.properties.get('s2:mgrs_tile') or it.id.split('_')[1], 0) + 1
    tile = max(tiles, key=tiles.get)
    items = [it for it in items if (it.properties.get('s2:mgrs_tile') or it.id.split('_')[1]) == tile]
    w = Win(crs_of(items[0]), p['lat'], p['lng'])
    byq = {}
    for it in items: byq.setdefault(quarter(it.datetime.date()), []).append(it)
    comps = []   # newest first: (quarter, composite, dates)
    for q, _ in reversed(qlist):
        if time.time() > deadline: rec['status_note'] = 'time budget reached'; break
        cands = sorted(byq.get(q, []), key=lambda it: it.properties.get('eo:cloud_cover', 100))[:CHECK_PER_QUARTER]
        rec['quarters_checked'] += 1
        got = []
        for it in cands:
            try:
                fr, s = scene(it, w); rec['scenes_checked'] += 1
            except Exception as e:
                print('read fail', p['id'], it.id, str(e)[:100]); continue
            if s is not None: got.append(s)
            if len(got) >= PER_QUARTER: break
        if got: comps.append((q, compose(got), sorted(s['date'] for s in got)))
    rec['clear_quarters'] = [c[0] for c in comps]
    if len(comps) < 2:
        rec['status'] = 'not enough clear quarters'; rec['seconds'] = round(time.time() - t0); return rec
    pairs = []
    for (qn, cn, _), (qo, co, _) in zip(comps, comps[1:]):
        v = change(co, cn, w); pairs.append({'from': qo, 'to': qn, 'change_pct': None if v is None else int(round(v))})
    rec['pairs'] = pairs
    first = pairs[0]['change_pct']
    rec['last_pair'] = [pairs[0]['from'], pairs[0]['to']]
    rec['change_pct_last'] = first
    if first is None: rec['status'] = 'newest pair not comparable'
    else:
        n = 0; oldest = comps[0][0]
        for k, pr in enumerate(pairs):
            if pr['change_pct'] is None or pr['change_pct'] >= CHANGE_PCT: break
            oldest = pr['from']
        rec['no_visible_change_months'] = qmid(comps[0][0]) - qmid(oldest)
        rec['status'] = 'ok'
    rec['newest_clear_dates'] = comps[0][2]
    rec['seconds'] = round(time.time() - t0)
    return rec


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('ids'); ap.add_argument('out')
    ap.add_argument('--quarters', type=int, default=6); ap.add_argument('--budget-min', type=float, default=70); ap.add_argument('--workers', type=int, default=8)
    ap.add_argument('--only', default='')
    a = ap.parse_args()
    ids = json.load(open(a.ids))
    if a.only: ids = [p for p in ids if p['id'] in a.only.split(',')]
    today = datetime.date.today(); y, m = today.year, (today.month - 1) // 3 * 3 + 1
    qlist = []
    for _ in range(a.quarters):
        qlist.append(('%d-Q%d' % (y, (m - 1) // 3 + 1), datetime.date(y, m, 1)))
        m -= 3
        if m < 1: m += 12; y -= 1
    qlist = qlist[::-1]   # oldest first; the newest is the current, possibly incomplete, quarter
    cat = Client.open(STAC)
    t0 = time.time(); deadline = t0 + a.budget_min * 60; res = {}
    with concurrent.futures.ThreadPoolExecutor(a.workers) as ex:
        futs = {ex.submit(project, cat, p, qlist, deadline): p for p in ids}
        for f in concurrent.futures.as_completed(futs):
            p = futs[f]
            try: res[p['id']] = f.result()
            except Exception as e: res[p['id']] = {'status': 'failed'}; print('fail', p['id'], str(e)[:160])
            print(p['id'], {k: v for k, v in res[p['id']].items() if k not in ('pairs',)}, flush=True)
    st = {}
    for r in res.values(): st[r.get('status')] = st.get(r.get('status'), 0) + 1
    out = {'updated': today.isoformat(), 'seconds': round(time.time() - t0), 'quarters': [q for q, _ in qlist], 'projects_with_coordinates': len(ids), 'status_counts': st,
           'threshold_pct': CHANGE_PCT, 'radius_m': RADIUS_M,
           'source': {'name': 'Copernicus Sentinel-2 L2A via Element84 Earth Search (STAC) and the Sentinel-2 COGs on AWS Open Data', 'url': 'https://registry.opendata.aws/sentinel-2-l2a-cogs/',
                      'license': 'Copernicus Sentinel data, free and open (contains modified Copernicus Sentinel data)', 'query': STAC + '/search collections=sentinel-2-l2a, bbox = pin +/- 0.003 degrees, eo:cloud_cover < 70'},
           'method': ('Window: %d m radius around the pin (about %d pixels of 10 m). Per quarter, newest first: up to %d scenes from the most frequent MGRS tile that see at least %d%% of the window without cloud '
                      '(Sentinel-2 scene classification: vegetation, bare and water kept; cloud, cirrus, shadow, dark and unclassified removed), at most %d cloud masks read per quarter, per-pixel median. '
                      'Change between consecutive clear quarters: share of pixels seen in both whose true-colour brightness moved by more than %d of 255, or that switched between built-up or bare (NDBI > 0 and NDVI < 0.25) '
                      'and not, with NDBI moving more than %.1f, after subtracting the median change in a ring 300 to 600 m from the pin (sun angle, haze and season move the whole scene). A pair at or above %d%% counts as visible change. no_visible_change_months: months between the middle of the newest clear quarter and the oldest quarter '
                      'reached without visible change.') % (RADIUS_M, int(math.pi * RADIUS_M ** 2 / 100), PER_QUARTER, MIN_CLEAR * 100, CHECK_PER_QUARTER, LUM_DELTA, NDBI_DELTA, CHANGE_PCT),
           'limits': ('10 m pixels see slabs, roofs, cleared ground and cranes, not work inside a building: a site where only interiors are being fitted out looks unchanged, and a finished building should look unchanged. '
                      'Season, sun angle, haze and wet ground also move brightness, which is why the threshold is high and the result is a prompt to ask, not a verdict. Coordinates come from public sources (about 100 m), '
                      'so the window can miss part of a large site or include a neighbour.'),
           'projects': dict(sorted(res.items()))}
    json.dump(out, open(a.out, 'w'), indent=1)
    print('done', len(res), 'in', out['seconds'], 's', st)


if __name__ == '__main__':
    main()
