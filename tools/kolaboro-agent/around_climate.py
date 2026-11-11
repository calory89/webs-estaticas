#!/usr/bin/env python3
"""Kolaboro "Climate at the plot": recent past (1995 to 2014) against around 2050 (2040 to 2059) at each reliable pin.

Usage: around_climate.py LAND_RULES_JSON OUT_JSON [CACHE_DIR]
Source: World Bank Climate Change Knowledge Portal, CMIP6 0.25 degree collection (bias-corrected NASA NEX-GDDP-CMIP6 models), public
bucket s3://wbg-cckp, CC BY 4.0. Per indicator: the multi-model ensemble median and the 10th and 90th percentile across models.
36 small files (about 80 MB) are downloaded once into CACHE_DIR. No key, no account, no model calls.
"""
import json, os, sys, time, math, urllib.request
import numpy as np, netCDF4

VARS = ['hd35', 'tr', 'pr', 'r20mm']
SCEN = [('h', 'historical', '1995-2014'), ('m', 'ssp245', '2040-2059'), ('x', 'ssp370', '2040-2059')]
STAT = ['median', 'p10', 'p90']
BASE = 'https://wbg-cckp.s3.amazonaws.com/data/cmip6-x0.25/'


def fname(v, s, p, q): return 'climatology-%s-annual-mean_cmip6-x0.25_ensemble-all-%s_climatology_%s_%s.nc' % (v, s, q, p)


def grid(cache, v, s, p, q):
    f = fname(v, s, p, q); path = os.path.join(cache, f)
    if not os.path.exists(path) or os.path.getsize(path) < 1000:
        os.makedirs(cache, exist_ok=True); urllib.request.urlretrieve(BASE + v + '/ensemble-all-' + s + '/' + f, path)
    d = netCDF4.Dataset(path); a = d.variables['climatology-%s-annual-mean' % v][0]
    return np.ma.filled(a.astype('float64'), np.nan)


def main(lr_path, out_path, cache='cckp'):
    lr = json.load(open(lr_path))['projects']; t0 = time.time()
    G = {(v, k, q): grid(cache, v, s, p, q) for v in VARS for k, s, p in SCEN for q in STAT}
    ref = G[('pr', 'h', 'median')]
    P = {}; nodata = []
    for pid, rec in sorted(lr.items()):
        pin = rec.get('pin')
        if not pin: continue
        lat, lng = [float(x) for x in pin.split(',')]
        i0 = int(round((lat + 90) / 0.25)); j0 = int(round((lng + 180) / 0.25)) % 1440
        # nearest grid cell with data (the collection covers land; a pin on the shore can fall in a sea cell): look up to 2 cells away
        best = None
        for di in range(-2, 3):
            for dj in range(-2, 3):
                i, j = i0 + di, (j0 + dj) % 1440
                if not (0 <= i < 721) or math.isnan(ref[i, j]): continue
                d = math.hypot((i * 0.25 - 90 - lat) * 110.57, ((j * 0.25 - 180) - lng) * 111.32 * math.cos(math.radians(lat)))
                if best is None or d < best[0]: best = (d, i, j)
        if not best: nodata.append(pid); continue
        d, i, j = best; out = {'pin': pin, 'cell': [round(i * 0.25 - 90, 2), round(j * 0.25 - 180, 2)], 'cell_km': round(d, 1)}
        ok = True
        for v in VARS:
            dec = 0 if v == 'pr' else 1; row = {}
            for k, s, p in SCEN:
                vals = [G[(v, k, q)][i, j] for q in STAT]
                if any(math.isnan(x) for x in vals): ok = False; break
                row[k] = [round(float(x), dec) if dec else int(round(float(x))) for x in vals]   # [median, p10, p90]
            out[v] = row
        if ok: P[pid] = out
        else: nodata.append(pid)
    out = {'v': 1, 'updated': time.strftime('%Y-%m-%d', time.gmtime()),
           'source': {'name': 'World Bank Climate Change Knowledge Portal, CMIP6 0.25 degree collection', 'url': 'https://climateknowledgeportal.worldbank.org/',
                      'data': 'https://registry.opendata.aws/wbg-cckp/', 'catalog': 'https://datacatalog.worldbank.org/search/dataset/0042297',
                      'licence': 'CC BY 4.0', 'licence_url': 'https://creativecommons.org/licenses/by/4.0/', 'built_on': 'NASA NEX-GDDP-CMIP6 (bias-corrected, downscaled CMIP6 models), https://doi.org/10.7917/OFSG3345',
                      'file_date': '2023-05-15'},
           'periods': {'h': '1995-2014', 'm': '2040-2059', 'x': '2040-2059'}, 'scenarios': {'h': 'historical', 'm': 'SSP2-4.5', 'x': 'SSP3-7.0'},
           'indicators': {'hd35': 'days per year with a maximum of 35 C or more', 'tr': 'nights per year that stay at 20 C or more', 'pr': 'rainfall per year, mm', 'r20mm': 'days per year with 20 mm of rain or more'},
           'values': '[ensemble median, 10th percentile across models, 90th percentile across models]', 'grid': '0.25 degree (about 25 km); cell = centre of the grid cell used, cell_km = its distance from the pin',
           'method': 'Value of the grid cell nearest to the pin that has data (searched up to 2 cells away for pins on the shore). Nothing is interpolated or adjusted.',
           'limits': 'Model output for a 25 km cell, not a measurement at the plot. It does not see a sea breeze, a valley, altitude differences inside the cell or the heat of a built-up area. 20-year averages: single years differ. Scenarios are not forecasts.',
           'no_data': nodata, 'seconds': round(time.time() - t0), 'projects': P}
    json.dump(out, open(out_path, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(len(P), 'projects', len(nodata), 'no data', os.path.getsize(out_path), 'bytes')


if __name__ == '__main__':
    main(*sys.argv[1:4])
