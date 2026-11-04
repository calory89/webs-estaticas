#!/usr/bin/env python3
"""Kolaboro night lights at tracked projects that should already be finished (block U, batch 4).

Source: NASA Black Marble VNP46A2 (VIIRS Suomi NPP, daily, gap-filled, BRDF and moonlight corrected night-time radiance), read through
NASA GIBS WMS as the colour-mapped layer VIIRS_SNPP_GapFilled_BRDF_Corrected_DayNightBand_Radiance. No Earthdata login is needed for
GIBS; the HDF5 files on LAADS DAAC do need one, so we do not use them. The PNG colours map one to one to radiance bins (GIBS colormap
VIIRS_DayNightBand_At_Sensor_Radiance: 0.1 nW/(cm2 sr) bins at the low end, saturating at 38.2), so values are bin midpoints.

For each project: 4 days per month (1st, 8th, 15th, 22nd) for the last 36 full months, a 25 x 25 pixel window (15 arc-seconds per
pixel, about 460 m) centred on the pin. Pin = mean of the 3 x 3 pixels around the pin (about 1.4 km square). Ring = median of pixels
between 4 and 12 pixels from the pin (about 1.9 to 5.5 km). Month = median of its days. Published per anonymous case id, rounded,
no coordinates. Usage: night.py IDS.json CASES.json OUT.json [--months 36]"""
import io, json, sys, time, math, datetime, argparse, statistics, re, urllib.request, concurrent.futures
import numpy as np
from PIL import Image

LAYER = 'VIIRS_SNPP_GapFilled_BRDF_Corrected_DayNightBand_Radiance'
WMS = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi'
CMAP = 'https://gibs.earthdata.nasa.gov/colormaps/v1.3/VIIRS_DayNightBand_At_Sensor_Radiance.xml'
RES = 1 / 240.0      # 15 arc-seconds
HALF = 12            # window = 25 x 25 pixels
DAYS = (1, 8, 15, 22)
UA = {'User-Agent': 'KolaboroNightLights/1.0 (+https://kolaboro.com/satellite/night/)'}


def get(url, tries=4):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return r.read(), r.headers.get('content-type', '')
        except Exception as e:
            if i == tries - 1: raise
            time.sleep(2 + 3 * i)


def colormap():
    x = get(CMAP)[0].decode()
    lut = {}
    for m in re.finditer(r'<ColorMapEntry rgb="(\d+),(\d+),(\d+)"[^>]*?value="([\[\(])([-0-9.]+),([-0-9.]+)([\]\)])"[^>]*?(nodata="true")?[^>]*/>', x):
        r, g, b, lo, hi, nd = int(m.group(1)), int(m.group(2)), int(m.group(3)), float(m.group(5)), float(m.group(6)), m.group(8)
        if nd: continue
        lut[(r, g, b)] = (lo + hi) / 2 if hi < 1000 else lo   # top bin is "38.2 and above": keep its lower edge, flagged as saturated
    if len(lut) < 150: raise SystemExit('colormap parse failed: %d entries' % len(lut))
    return lut


def window(lat, lng, day, lut):
    """25 x 25 radiance window aligned to the native 15 arc-second grid. NaN where the layer has no data."""
    c, r = math.floor(lng / RES), math.floor(lat / RES)
    x0, x1 = (c - HALF) * RES, (c + HALF + 1) * RES
    y0, y1 = (r - HALF) * RES, (r + HALF + 1) * RES
    q = '%s?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=%s&STYLES=&CRS=EPSG:4326&BBOX=%.7f,%.7f,%.7f,%.7f&WIDTH=%d&HEIGHT=%d&FORMAT=image/png&TIME=%s' % (
        WMS, LAYER, y0, x0, y1, x1, 2 * HALF + 1, 2 * HALF + 1, day)
    b, ct = get(q)
    if 'image/png' not in ct: raise RuntimeError('not a PNG: ' + ct + ' ' + b[:120].decode('latin1'))
    im = np.array(Image.open(io.BytesIO(b)).convert('RGBA'))
    out = np.full(im.shape[:2], np.nan, dtype='float32')
    for (rr, gg, bb), v in lut.items():
        out[(im[..., 0] == rr) & (im[..., 1] == gg) & (im[..., 2] == bb) & (im[..., 3] > 0)] = v
    return out


def months_back(n):
    t = datetime.date.today().replace(day=1)
    out = []
    for _ in range(n):
        t = (t - datetime.timedelta(days=1)).replace(day=1); out.append(t)
    return out[::-1]


def theil_sen(y):
    pts = [(i, v) for i, v in enumerate(y) if v is not None]
    s = [(b[1] - a[1]) / (b[0] - a[0]) for k, a in enumerate(pts) for b in pts[k + 1:]]
    return statistics.median(s) if s else None


def r1(x): return None if x is None else round(x, 1)
def r5(x): return None if x is None else int(5 * round(x / 5.0))


def project(p, mlist, lut):
    yy, xx = np.mgrid[-HALF:HALF + 1, -HALF:HALF + 1]
    d = np.hypot(yy, xx); core = (abs(yy) <= 1) & (abs(xx) <= 1); ring = (d >= 4) & (d <= HALF)
    pin_m, ring_m, days_ok, fails = [], [], 0, 0
    for mo in mlist:
        pv, rv = [], []
        for dd in DAYS:
            try: w = window(p['lat'], p['lng'], mo.replace(day=dd).isoformat(), lut)
            except Exception as e: fails += 1; print('fail', p['id'], mo, dd, str(e)[:100]); continue
            a, b = w[core], w[ring]
            if np.isfinite(a).sum() >= 5 and np.isfinite(b).sum() >= 50:
                pv.append(float(np.nanmean(a))); rv.append(float(np.nanmedian(b))); days_ok += 1
        pin_m.append(statistics.median(pv) if pv else None); ring_m.append(statistics.median(rv) if rv else None)
    def med(v): v = [x for x in v if x is not None]; return statistics.median(v) if len(v) >= 6 else None
    last, prev = med(pin_m[-12:]), med(pin_m[-24:-12])
    rlast = med(ring_m[-12:])
    slope = theil_sen(pin_m) if sum(1 for v in pin_m if v is not None) >= 12 else None
    sat = sum(1 for v in pin_m if v is not None and v >= 38.2)
    q = []
    for i in range(0, len(mlist), 3):
        v = [x for x in pin_m[i:i + 3] if x is not None]
        q.append(r1(statistics.median(v)) if v else None)
    o = {'group': p['group'], 'months': len(mlist), 'months_with_data': sum(1 for v in pin_m if v is not None), 'days_read': days_ok, 'requests_failed': fails,
         'pin_last12': r1(last), 'pin_prev12': r1(prev), 'ring_last12': r1(rlast),
         'change_pct': r5((last - prev) / prev * 100) if last is not None and prev and prev >= 0.5 else None,
         'pin_vs_ring': round(last / rlast, 1) if last is not None and rlast and rlast >= 0.3 else None,
         'trend_per_year': r1(slope * 12) if slope is not None else None, 'saturated_months': sat, 'quarters': q}
    # plain reading, descriptive only; thresholds are stated in the published method
    if last is None: o['reading'] = 'not enough clear data'
    elif last < 0.5: o['reading'] = 'dark: almost no light at the pin'
    elif o['pin_vs_ring'] is not None and o['pin_vs_ring'] < 0.5: o['reading'] = 'darker than its surroundings'
    elif o['change_pct'] is not None and o['change_pct'] >= 20: o['reading'] = 'lit, brighter than a year earlier'
    elif o['change_pct'] is not None and o['change_pct'] <= -20: o['reading'] = 'lit, dimmer than a year earlier'
    else: o['reading'] = 'lit, about as bright as a year earlier'
    return o


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('ids'); ap.add_argument('cases'); ap.add_argument('out'); ap.add_argument('--months', type=int, default=36)
    a = ap.parse_args()
    ids = json.load(open(a.ids)); cases = {c['id']: c for c in json.load(open(a.cases))['cases']}
    this_year = datetime.date.today().year
    sel = []
    for p in ids:
        c = cases.get(p['id'])
        if not c: continue
        st, done = (c.get('stage') or '').lower(), c.get('done')
        if st in ('completed', 'finished'): g = 'completed'
        elif isinstance(done, int) and done < this_year: g = 'handover year passed'
        else: continue
        sel.append(dict(p, group=g))
    print('projects selected', len(sel), [(s['id'], s['group']) for s in sel])
    lut = colormap(); mlist = months_back(a.months)
    t0 = time.time(); res = {}
    with concurrent.futures.ThreadPoolExecutor(4) as ex:
        for p, o in zip(sel, ex.map(lambda p: project(p, mlist, lut), sel)):
            res[p['id']] = o; print(p['id'], {k: v for k, v in o.items() if k != 'quarters'})
    out = {'updated': datetime.date.today().isoformat(), 'from': mlist[0].strftime('%Y-%m'), 'to': mlist[-1].strftime('%Y-%m'), 'seconds': round(time.time() - t0),
           'selection': 'Tracked projects with coordinates whose public stage is completed, or whose promised handover year (field done in /data/bali-cases.json) is before %d.' % this_year,
           'source': {'name': 'NASA Black Marble VNP46A2 (VIIRS/NPP Gap-Filled Lunar BRDF-Adjusted Nighttime Lights, daily), via NASA GIBS WMS layer ' + LAYER,
                      'url': 'https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/VNP46A2/', 'license': 'NASA data, no restrictions on use (NASA Earth Science Data and Information Policy). Please cite Roman et al. 2018, Remote Sensing of Environment.',
                      'query': WMS + '?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=' + LAYER + '&CRS=EPSG:4326&BBOX=<25 x 25 pixel window>&WIDTH=25&HEIGHT=25&FORMAT=image/png&TIME=<day>',
                      'colormap': CMAP},
           'method': ('Days %s of each month for %d months. Window of 25 x 25 pixels of 15 arc-seconds (about 460 m) on the pin, aligned to the native grid. '
                      'Pin: mean of the 3 x 3 pixels around the pin. Ring: median of the pixels 4 to 12 pixels away (about 1.9 to 5.5 km). Month: median of its days. '
                      'Radiance in nW/(cm2 sr) as the midpoint of the GIBS colour bin (0.1 wide at the low end, wider above 2, saturating at 38.2). '
                      'change_pct: median of the last 12 months against the 12 before, rounded to 5%%, only when the earlier level is at least 0.5. '
                      'pin_vs_ring: last 12 months, only when the ring is at least 0.3. trend_per_year: Theil-Sen slope of the monthly series. '
                      'Readings: dark if the pin is under 0.5; darker than its surroundings if pin_vs_ring is under 0.5; brighter or dimmer if change_pct is +20%% or more, or -20%% or less.') % (','.join(map(str, DAYS)), a.months),
           'limits': ('Light is a proxy, not proof of occupancy: a finished but empty building can keep its common areas and street lights on, a lived-in villa among trees can look dark, '
                      'and a construction site with floodlights can look busy. One pixel is about 460 m across, wider than most projects, so neighbours count too. Values are colour bins, '
                      'not the raw radiance. Gap-filled days repeat the last clear night when it is cloudy. Coordinates are those found in public sources, about 100 m.'),
           'projects': res}
    json.dump(out, open(a.out, 'w'), indent=1)
    print('done', len(res), 'projects in', out['seconds'], 's')


if __name__ == '__main__':
    main()
