#!/usr/bin/env python3
"""Kolaboro optical construction progress (Sentinel-2 L2A, Element84 Earth Search STAC, COGs on AWS open data, no account).

For every watched site: a monthly cloud-masked series inside the analysis box (or a 100 m buffer around the plot point when
a site has one): share of the box seen without cloud, mean brightness, mean NDVI, share of pixels that look built-up or bare
(NDBI > 0 and NDVI < 0.25) and the share that turned built-up or bare since the baseline month. Plus a true-colour frame per
clear month (JPEG) and an animated WebP timelapse. Writes OUTDIR/satellite-optical.json and OUTDIR/<site>/opt/*.

Usage: satellite_optical.py SITES.json OUTDIR [--sites id,id] [--from YYYY-MM] [--budget-min N]
Incremental: months already published (PREV_URL) older than the last 2 months are reused instead of recomputed."""
import json, os, sys, io, math, time, datetime, argparse, concurrent.futures, urllib.request
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
from rasterio.warp import transform_bounds, transform as warp_xy
from rasterio.enums import Resampling
from pystac_client import Client
from PIL import Image, ImageDraw, ImageFont

STAC = 'https://earth-search.aws.element84.com/v1'
PREV_URL = 'https://kolaboro.com/data/satellite-optical.json'
HALF = 0.005            # same ~1.1 km box as satellite.py
PLOT_BUFFER_M = 100     # when a site has a plot point
CLEAR = (4, 5, 6, 7)    # SCL: vegetation, not vegetated, water, unclassified. Excluded: 0 nodata, 1 saturated, 2 dark/shadow, 3 cloud shadow, 8-10 cloud and cirrus, 11 snow
MAX_SCENES = 3          # clearest scenes kept per month
MIN_SCENE_CLEAR = 0.3   # scene must see at least 30% of the box without cloud
MONTH_OK = 60           # month published with metrics if >= 60% of the box was seen clear at least once
FRAME_OK = 80           # frame and timelapse only from months >= 80% clear
BUILT_NDBI, BUILT_NDVI = 0.0, 0.25
FRAME_PX = 220


def months(a, b):
    y, m = a; out = []
    while (y, m) <= b:
        out.append('%04d-%02d' % (y, m)); m += 1
        if m == 13: y, m = y + 1, 1
    return out


def refl(item, asset, arr):
    """DN -> reflectance. Earth Search v1 lists offset -0.1 for baseline >= 04.00 but, when earthsearch:boa_offset_applied is
    true, the DNs were already harmonised, so the offset must not be applied twice."""
    rb = (asset.extra_fields.get('raster:bands') or [{}])[0]
    sc = rb.get('scale', 0.0001)
    off = 0.0 if item.properties.get('earthsearch:boa_offset_applied') else rb.get('offset', 0.0)
    a = arr.astype('float32') * sc + off
    a[arr == 0] = np.nan
    a = np.clip(a, 0, None)
    return a


class Site:
    def __init__(self, s):
        self.s = s; self.id = s['id']
        pl = s.get('plot') or {}
        self.plot = None
        try: self.plot = (float(pl['lat']), float(pl['lng']))
        except (KeyError, TypeError, ValueError): pass
        lat, lng = s['lat'], s['lng']
        dx = HALF / math.cos(math.radians(lat))
        self.bbox = (lng - dx, lat - HALF, lng + dx, lat + HALF)


def grid_for(ds_crs, bbox):
    """Box in the item CRS, snapped outwards to the 20 m grid so 10 m and 20 m windows align exactly."""
    x0, y0, x1, y1 = transform_bounds('EPSG:4326', ds_crs, *bbox, densify_pts=21)
    x0, y0 = math.floor(x0 / 20) * 20, math.floor(y0 / 20) * 20
    x1, y1 = math.ceil(x1 / 20) * 20, math.ceil(y1 / 20) * 20
    return x0, y0, x1, y1


def scene_clear(item, site):
    """Read only SCL (20 m, small) to decide if the scene sees the box. Returns (clear fraction, ctx) or (0, None)."""
    try:
        crs = 'EPSG:%d' % int(item.properties.get('proj:epsg') or str(item.properties.get('proj:code', '')).split(':')[-1])
        b = grid_for(crs, site.bbox)
        h20, w20 = int(round((b[3] - b[1]) / 20)), int(round((b[2] - b[0]) / 20))
        with rasterio.open(item.assets['scl'].href) as ds:
            scl = ds.read(1, window=from_bounds(*b, transform=ds.transform), out_shape=(h20, w20), boundless=True, fill_value=0)
        clear = np.isin(scl, CLEAR)
        mask = site_mask(site, crs, b, (h20, w20))
        frac = float(clear[mask].mean()) if mask.any() else 0.0
        return frac, {'crs': crs, 'b': b, 'scl': scl}
    except Exception as e:
        print('scl fail', site.id, item.id, str(e)[:120]); return 0.0, None


_mask_cache = {}
def site_mask(site, crs, b, shape):
    """Analysis area: whole box, or a 100 m buffer around the plot point when the site has one."""
    key = (site.id, crs, b, shape)
    if key in _mask_cache: return _mask_cache[key]
    m = np.ones(shape, bool)
    if site.plot:
        xs, ys = warp_xy('EPSG:4326', crs, [site.plot[1]], [site.plot[0]])
        h, w = shape; px = (b[2] - b[0]) / w
        yy, xx = np.mgrid[0:h, 0:w]
        cx, cy = b[0] + (xx + .5) * px, b[3] - (yy + .5) * px
        m = (cx - xs[0]) ** 2 + (cy - ys[0]) ** 2 <= PLOT_BUFFER_M ** 2
    _mask_cache[key] = m
    return m


def scene_data(item, ctx):
    b = ctx['b']
    h10, w10 = int(round((b[3] - b[1]) / 10)), int(round((b[2] - b[0]) / 10))
    clear = np.isin(np.kron(ctx['scl'], np.ones((2, 2), dtype=ctx['scl'].dtype)), CLEAR)
    with rasterio.open(item.assets['visual'].href) as ds:
        rgb = ds.read((1, 2, 3), window=from_bounds(*b, transform=ds.transform), out_shape=(3, h10, w10), boundless=True, fill_value=0)
    def band(k, res):
        with rasterio.open(item.assets[k].href) as ds:
            a = ds.read(1, window=from_bounds(*b, transform=ds.transform), out_shape=(h10, w10), boundless=True, fill_value=0,
                        resampling=Resampling.nearest)
        return refl(item, item.assets[k], a)
    red, nir, swir = band('red', 10), band('nir', 10), band('swir16', 20)
    ok = clear & (rgb.sum(0) > 0) & np.isfinite(red) & np.isfinite(nir) & np.isfinite(swir)
    ndvi = (nir - red) / (nir + red + 1e-6)
    ndbi = (swir - nir) / (swir + nir + 1e-6)
    return {'rgb': rgb.astype('float32'), 'ndvi': ndvi, 'ndbi': ndbi, 'ok': ok, 'date': item.datetime.date().isoformat(), 'id': item.id}


def compose(scenes, mask):
    ok = np.stack([s['ok'] for s in scenes])                       # n,h,w
    def med(arrs):
        a = np.stack(arrs).astype('float32'); a[~ok] = np.nan
        with np.errstate(all='ignore'): return np.nanmedian(a, axis=0)
    rgb = np.stack([med([s['rgb'][c] for s in scenes]) for c in range(3)])
    ndvi, ndbi = med([s['ndvi'] for s in scenes]), med([s['ndbi'] for s in scenes])
    seen = ok.any(0) & mask
    return rgb, ndvi, ndbi, seen


def frame_img(rgb, seen):
    a = np.nan_to_num(rgb, nan=0).transpose(1, 2, 0)
    a = np.clip(a * 1.15, 0, 255).astype('uint8')
    a[~seen] = (40, 46, 54)
    return Image.fromarray(a, 'RGB').resize((FRAME_PX, FRAME_PX), Image.LANCZOS)


def site_series(cat, site, mlist, prev, outdir, deadline):
    sd = os.path.join(outdir, site.id, 'opt'); os.makedirs(sd, exist_ok=True)
    keep_before = mlist[-2] if len(mlist) >= 2 else mlist[0]
    reuse = {m['month']: m for m in (prev or {}).get('months', []) if m['month'] < keep_before}
    t0 = time.time()
    items = list(cat.search(collections=['sentinel-2-l2a'], bbox=site.bbox,
                            datetime='%s-01T00:00:00Z/%sT23:59:59Z' % (mlist[0], datetime.date.today().isoformat()),
                            query={'eo:cloud_cover': {'lt': 85}}, limit=200).items())
    by_month = {}
    for it in items:
        by_month.setdefault(it.datetime.strftime('%Y-%m'), []).append(it)
    base = None; base_month = None
    if prev and prev.get('baseline_month') and prev['baseline_month'] in reuse:
        base_month = prev['baseline_month']
        try:
            bm = Image.open(urllib.request.urlopen('https://kolaboro.com/k/sat/%s/opt/baseline-built.png' % site.id, timeout=30))
            base = np.array(bm.convert('L')) > 127
        except Exception as e:
            print('baseline reuse failed, full recompute', site.id, e); reuse = {}; base_month = None
    out = []; frames = []; crs0 = (prev or {}).get('baseline_crs') if base is not None else None; shape0 = base.shape if base is not None else None; scenes_read = 0
    for mo in mlist:
        if mo in reuse:
            m = dict(reuse[mo]); out.append(m)
            if m.get('frame'): frames.append(mo)
            continue
        cands = by_month.get(mo, [])
        rec = {'month': mo, 'scenes_listed': len(cands)}
        if time.time() > deadline:
            rec['status'] = 'not processed (time budget)'; out.append(rec); continue
        with concurrent.futures.ThreadPoolExecutor(8) as ex:
            checks = list(ex.map(lambda it: (it, scene_clear(it, site)), cands))
        # same acquisition can come from two overlapping MGRS tiles: keep the one that sees more of the box
        best = {}
        for it, (fr, ctx) in checks:
            if ctx is None or fr < MIN_SCENE_CLEAR: continue
            k = it.datetime.strftime('%Y%m%d') + (it.properties.get('platform') or '')
            if k not in best or fr > best[k][1]: best[k] = (it, fr, ctx)
        pick = sorted(best.values(), key=lambda x: -x[1])
        if crs0 is not None: pick = [p for p in pick if p[2]['crs'] == crs0] or pick
        pick = pick[:MAX_SCENES]
        if not pick:
            rec.update({'status': 'cloudy', 'clear_pct': 0, 'scenes_used': 0}); out.append(rec); print(site.id, mo, 'cloudy', len(cands)); continue
        with concurrent.futures.ThreadPoolExecutor(6) as ex:
            res = list(ex.map(lambda p: _safe(scene_data, p[0], p[2]), pick))
        scenes = [r for r in res if r is not None]
        if crs0 is None and scenes:
            crs0 = pick[0][2]['crs']
        scenes = [s for s, p in zip(res, pick) if s is not None and p[2]['crs'] == crs0 and s['ok'].shape == scenes[0]['ok'].shape] if scenes else []
        scenes_read += len(scenes)
        if not scenes:
            rec.update({'status': 'cloudy', 'clear_pct': 0, 'scenes_used': 0}); out.append(rec); continue
        b = pick[0][2]['b']; mask = site_mask(site, crs0, b, scenes[0]['ok'].shape)
        rgb, ndvi, ndbi, seen = compose(scenes, mask)
        clear_pct = round(float(seen.sum()) / float(mask.sum()) * 100, 1)
        rec.update({'scenes_used': len(scenes), 'dates': sorted(s['date'] for s in scenes), 'clear_pct': clear_pct})
        if clear_pct < MONTH_OK:
            rec['status'] = 'cloudy'; out.append(rec); print(site.id, mo, 'cloudy', clear_pct); continue
        built = (ndbi > BUILT_NDBI) & (ndvi < BUILT_NDVI) & seen
        lum = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2])
        rec.update({'status': 'ok',
                    'brightness': round(float(np.nanmean(lum[seen])), 1),
                    'ndvi': round(float(np.nanmean(ndvi[seen])), 3),
                    'built_pct': round(float(built.sum()) / float(seen.sum()) * 100, 1)})
        if base is None and clear_pct >= FRAME_OK and shape0 is None:
            base, base_month = built.copy(), mo; shape0 = built.shape
            Image.fromarray((base * 255).astype('uint8'), 'L').save(os.path.join(sd, 'baseline-built.png'), optimize=True)
        elif base is not None and base.shape == built.shape:
            both = seen & mask
            new = built & ~base & both
            rec['new_built_since_baseline_pct'] = round(float(new.sum()) / float(both.sum()) * 100, 1) if both.any() else None
        if clear_pct >= FRAME_OK:
            frame_img(rgb, seen).save(os.path.join(sd, mo + '.jpg'), quality=82, optimize=True)
            rec['frame'] = True; frames.append(mo)
        out.append(rec); print(site.id, mo, {k: v for k, v in rec.items() if k != 'dates'})
    # timelapse: every clear frame, month burned in
    try:
        imgs = []
        try: font = ImageFont.load_default(size=15)
        except TypeError: font = ImageFont.load_default()
        for mo in frames:
            p = os.path.join(sd, mo + '.jpg')
            if os.path.exists(p): im = Image.open(p).convert('RGB')
            else:
                try: im = Image.open(urllib.request.urlopen('https://kolaboro.com/k/sat/%s/opt/%s.jpg' % (site.id, mo), timeout=30)).convert('RGB')
                except Exception: continue
            d = ImageDraw.Draw(im); d.rectangle((0, FRAME_PX - 22, 74, FRAME_PX), fill=(23, 33, 43)); d.text((6, FRAME_PX - 20), mo, fill=(255, 255, 255), font=font)
            imgs.append(im)
        if len(imgs) >= 2:
            imgs[0].save(os.path.join(sd, 'timelapse.webp'), save_all=True, append_images=imgs[1:], duration=700, loop=0, quality=70, method=4)
    except Exception as e:
        print('timelapse fail', site.id, e)
    ok = [m for m in out if m.get('status') == 'ok']
    first_ok = next((m for m in ok if m['month'] == base_month), None)
    last_ok = ok[-1] if ok else None
    summary = {'months': len(out), 'months_clear': len(ok), 'frames': len(frames), 'scenes_read': scenes_read, 'seconds': round(time.time() - t0)}
    if first_ok and last_ok and last_ok is not first_ok:
        summary.update({'from': first_ok['month'], 'to': last_ok['month'],
                        'built_change_pts': round(last_ok['built_pct'] - first_ok['built_pct'], 1),
                        'brightness_change': round(last_ok['brightness'] - first_ok['brightness'], 1),
                        'new_built_since_baseline_pct': last_ok.get('new_built_since_baseline_pct')})
    return {'id': site.id, 'label': site.s['label'], 'area': 'plot buffer %d m' % PLOT_BUFFER_M if site.plot else 'box %.1f km' % (HALF * 2 * 111),
            'baseline_month': base_month, 'baseline_crs': crs0, 'timelapse': len(frames) >= 2, 'summary': summary, 'months': out}


def _safe(fn, *a):
    try: return fn(*a)
    except Exception as e: print('read fail', a[0].id if a else '', str(e)[:160]); return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('sites'); ap.add_argument('outdir')
    ap.add_argument('--sites', dest='only', default='')
    ap.add_argument('--from', dest='frm', default='2023-01')
    ap.add_argument('--to', dest='to', default='')
    ap.add_argument('--budget-min', type=float, default=70)
    ap.add_argument('--no-prev', action='store_true')
    a = ap.parse_args()
    sites = [Site(s) for s in json.load(open(a.sites))['sites']]
    if a.only: sites = [s for s in sites if s.id in a.only.split(',')]
    os.makedirs(a.outdir, exist_ok=True)
    today = datetime.date.today()
    y0, m0 = map(int, a.frm.split('-'))
    end = tuple(map(int, a.to.split('-'))) if a.to else (today.year, today.month)
    mlist = months((y0, m0), end)
    prev = {}
    if not a.no_prev:
        try: prev = {s['id']: s for s in json.load(urllib.request.urlopen(PREV_URL, timeout=30)).get('sites', [])}
        except Exception as e: print('no previous file', str(e)[:80])
    cat = Client.open(STAC)
    t0 = time.time(); deadline = t0 + a.budget_min * 60
    res = []
    # sites in parallel (each site already parallelises its reads)
    with concurrent.futures.ThreadPoolExecutor(3) as ex:
        futs = [ex.submit(site_series, cat, s, mlist, prev.get(s.id), a.outdir, deadline) for s in sites]
        for f, s in zip(futs, sites):
            try: res.append(f.result())
            except Exception as e: print('site fail', s.id, str(e)[:200])
    out = {'updated': today.isoformat(),
           'source': 'Copernicus Sentinel-2 L2A via Element84 Earth Search (STAC) and the Sentinel-2 COGs on AWS Open Data. Contains modified Copernicus Sentinel data.',
           'resolution_m': 10,
           'method': ('Per month, up to %d scenes that see at least %d%% of the area without cloud (Sentinel-2 scene classification: cloud, cirrus, cloud shadow, dark and no-data pixels removed), '
                      'per-pixel median. A month is reported only if at least %d%% of the area was seen clear. built_pct: share of clear pixels with NDBI > %.2f and NDVI < %.2f '
                      '(built-up OR bare ground: at 10 m a cleared plot and a concrete slab look alike). new_built_since_baseline_pct: pixels that were not built-up or bare in the baseline month and are now. '
                      'Frames: months at least %d%% clear.') % (MAX_SCENES, MIN_SCENE_CLEAR * 100, MONTH_OK, BUILT_NDBI, BUILT_NDVI, FRAME_OK),
           'from': mlist[0], 'to': mlist[-1], 'seconds': round(time.time() - t0),
           'sites': sorted(res, key=lambda r: [s.id for s in sites].index(r['id']))}
    json.dump(out, open(os.path.join(a.outdir, 'satellite-optical.json'), 'w'), indent=1)
    print('done', len(res), 'sites in', round(time.time() - t0), 's')


if __name__ == '__main__':
    main()
