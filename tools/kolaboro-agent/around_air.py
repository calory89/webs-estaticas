#!/usr/bin/env python3
"""Kolaboro "Around the site", air quality part: mean PM2.5 and NO2 over one calendar year at each reliable pin.

Usage: around_air.py AROUND_JSON YEAR      (adds "aq" to every project in AROUND_JSON and an "air" block at the top; rewrites the file)
Source: Copernicus Atmosphere Monitoring Service (CAMS) global atmospheric composition forecasts, hourly, 0.4 degree grid (about 44 km),
as republished by Open-Meteo in its open-data bucket on AWS (s3://openmeteo, CC BY 4.0). Read with HTTP range requests (a few KB per
point and file), not through the Open-Meteo API. No key, no account, no model calls.
"""
import json, sys, time, math, datetime, concurrent.futures as cf
import numpy as np, requests, omfiles

BASE = 'https://openmeteo.s3.amazonaws.com/data/cams_global/'
CH = 217   # hours per file (static/meta.json: chunk_time_length)
VARS = {'pm25': 'pm2_5', 'no2': 'nitrogen_dioxide'}
S = requests.Session(); S.headers['user-agent'] = 'KolaboroAround/1.0 (+https://kolaboro.com/methods/)'


class FS:
    def cat_file(self, path=None, start=None, end=None, **kw):
        for k in range(4):
            try:
                r = S.get(path, headers={'Range': 'bytes=%d-%d' % (start, end - 1)}, timeout=60)
                if r.status_code in (200, 206): return r.content
            except Exception: pass
            time.sleep(1 + 2 * k)
        raise RuntimeError('read failed ' + path)

    def size(self, path=None, **kw):
        return int(S.head(path, timeout=60).headers['content-length'])


def cell(lat, lng): return int(round((lat + 90) / 0.4)), int(round((lng + 180) / 0.4)) % 900


def chunk_series(var, c, cells):
    r = omfiles.OmFileReader.from_fsspec(FS(), BASE + var + '/chunk_%d.om' % c)
    return c, {ij: np.asarray(r[ij[0]:ij[0] + 1, ij[1]:ij[1] + 1, :], dtype='float64').ravel() for ij in cells}


def main(path, year):
    year = int(year); J = json.load(open(path)); P = J['projects']; t0 = time.time()
    h0 = int(datetime.datetime(year, 1, 1, tzinfo=datetime.timezone.utc).timestamp() // 3600)
    h1 = int(datetime.datetime(year + 1, 1, 1, tzinfo=datetime.timezone.utc).timestamp() // 3600)
    cells = {}
    for pid, v in P.items():
        lat, lng = [float(x) for x in v['pin'].split(',')]; cells.setdefault(cell(lat, lng), []).append(pid)
    chunks = list(range(h0 // CH, (h1 - 1) // CH + 1)); res = {}
    for key, var in VARS.items():
        tot = {ij: [0.0, 0] for ij in cells}
        with cf.ThreadPoolExecutor(6) as ex:
            for c, ser in ex.map(lambda c: chunk_series(var, c, list(cells)), chunks):
                a = max(h0, c * CH) - c * CH; b = min(h1, (c + 1) * CH) - c * CH
                for ij, s in ser.items():
                    x = s[a:b]; x = x[~np.isnan(x)]; tot[ij][0] += float(x.sum()); tot[ij][1] += int(x.size)
        res[key] = tot; print(key, 'done', round(time.time() - t0), flush=True)
    hours = h1 - h0; n = 0
    for ij, pids in cells.items():
        rec = {'y': year, 'cell': [round(ij[0] * 0.4 - 90, 1), round(ij[1] * 0.4 - 180, 1)]}
        for key in VARS:
            s, k = res[key][ij]
            if k >= 0.9 * hours: rec[key] = round(s / k, 1)
        rec['cover'] = round(100 * min(res[k][ij][1] for k in VARS) / hours)
        for pid in pids:
            if 'pm25' in rec or 'no2' in rec: P[pid]['aq'] = rec; n += 1
    J['air'] = {'year': year, 'source': 'Copernicus Atmosphere Monitoring Service (CAMS) global atmospheric composition forecasts, hourly, 0.4 degree grid',
                'via': 'Open-Meteo open data on AWS', 'via_url': 'https://registry.opendata.aws/open-meteo/', 'licence': 'CC BY 4.0', 'licence_url': 'https://creativecommons.org/licenses/by/4.0/',
                'cams_url': 'https://atmosphere.copernicus.eu/', 'credit': 'Generated using Copernicus Atmosphere Monitoring Service information ' + str(year),
                'method': 'Mean of the hourly surface values of the calendar year in the grid cell that contains the pin (micrograms per cubic metre). A year needs 90% of its hours.',
                'who': {'pm25': 5, 'no2': 10, 'url': 'https://www.who.int/publications/i/item/9789240034228', 'name': 'WHO global air quality guidelines 2021, annual mean'},
                'limits': 'Model values for a cell of about 44 km, not a monitoring station. A busy road, a port or a valley inside the cell is not seen.'}
    json.dump(J, open(path, 'w'), ensure_ascii=False, separators=(',', ':'))
    print('aq for', n, 'projects,', len(cells), 'cells,', round(time.time() - t0), 's')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
