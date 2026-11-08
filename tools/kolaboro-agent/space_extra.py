#!/usr/bin/env python3
"""Kolaboro: radar and building footprints for named projects with a plot-level pin (batch 17, n17b). No model calls.

  space_extra.py radar OUT.json      Sentinel-1 radar (RTC, Microsoft Planetary Computer, free anonymous SAS token) for the
                                     projects whose optical series (construction-progress.json) had a clear view in fewer than
                                     75% of months: monthly VV and VH backscatter in the same 150 m circle and 300-600 m ring.
  space_extra.py buildings OUT.json  Overture Maps buildings (latest release on AWS Open Data) touching the 150 m circle of every
                                     project with a plot-level pin, with the release each building was first seen in (GERS registry).

Selection and pins: exactly the projects and pins of https://kolaboro.com/data/construction-progress.json (pins from named.json,
at least 3 decimals, not shared, not an area centre, Sumba excluded). Options: --only ID,ID  --from YYYY-MM  --budget-min N"""
import json, os, sys, math, time, datetime, argparse, statistics, concurrent.futures, urllib.request, urllib.parse

ORIGIN = 'https://kolaboro.com'
R_IN, RING0, RING1 = 150, 300, 600          # same circle and ring as the optical series
UA = {'user-agent': 'Kolaboro-space/1.0 (+https://kolaboro.com/data/)'}


def get_json(url, data=None, timeout=60):
    req = urllib.request.Request(url, data=json.dumps(data).encode() if data is not None else None,
                                 headers=dict(UA, **({'content-type': 'application/json'} if data is not None else {})))
    for i in range(5):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r: return json.load(r)
        except Exception as e:
            if i == 4: raise
            time.sleep(2 + i * 3)


def projects(only):
    cp = get_json(ORIGIN + '/data/construction-progress.json?run=%d' % time.time())
    named = get_json(ORIGIN + '/data/named.json?run=%d' % time.time())
    by = {p['id']: p for p in named['projects']}
    out = []
    for pid, rec in cp['projects'].items():
        p = by.get(pid); fx = (p or {}).get('fx') or {}
        if not p or not isinstance(fx.get('lat'), (int, float)) or not isinstance(fx.get('lng'), (int, float)): continue
        if str(p.get('mk', '')).lower() == 'sumba': continue
        if only and pid not in only: continue
        out.append({'id': pid, 'lat': float(fx['lat']), 'lng': float(fx['lng']), 'mk': p.get('mk'),
                    'clear': rec.get('clear_months'), 'n': rec.get('n'), 'm0': rec.get('m0')})
    return cp, out


def months(a, b):
    y, m = map(int, a.split('-')); y1, m1 = map(int, b.split('-')); o = []
    while (y, m) <= (y1, m1):
        o.append('%04d-%02d' % (y, m)); m += 1
        if m == 13: y, m = y + 1, 1
    return o


def med(v):
    v = [x for x in v if x is not None]
    return statistics.median(v) if v else None


# ------------------------------------------------------------------------------------------------ radar
PC = 'https://planetarycomputer.microsoft.com/api/stac/v1'
PC_TOKEN = 'https://planetarycomputer.microsoft.com/api/sas/v1/token/sentinel-1-rtc'
CLOUDY = 0.75            # optical clear months / months below this: radar series
MAX_SCENES = 3           # scenes per month from the chosen track
MIN_VALID = 0.8          # a scene must have valid radar values for 80% of the circle
_tok = {'t': None, 'exp': 0}


def token():
    if not _tok['t'] or time.time() > _tok['exp']:
        d = get_json(PC_TOKEN); _tok['t'] = d['token']; _tok['exp'] = time.time() + 40 * 60
    return _tok['t']


def pc_items(lat, lng, t0, t1):
    body = {'collections': ['sentinel-1-rtc'], 'intersects': {'type': 'Point', 'coordinates': [lng, lat]},
            'datetime': '%sT00:00:00Z/%sT23:59:59Z' % (t0, t1), 'limit': 250}
    out, url = [], PC + '/search'
    for _ in range(20):
        d = get_json(url, body)
        out += d.get('features', [])
        nx = next((l for l in d.get('links', []) if l.get('rel') == 'next'), None)
        if not nx: break
        url = nx['href']; body = nx.get('body') or body
    return out


def radar_site(p, mlist, deadline):
    import numpy as np, rasterio
    from rasterio.windows import from_bounds
    from rasterio.warp import transform as warp_xy
    t0 = time.time()
    last_day = (datetime.date(int(mlist[-1][:4]), int(mlist[-1][5:]), 28) + datetime.timedelta(days=4)).replace(day=1) - datetime.timedelta(days=1)
    items = pc_items(p['lat'], p['lng'], mlist[0] + '-01', last_day.isoformat())
    tracks = {}
    for it in items:
        pr = it['properties']
        k = (pr.get('sat:orbit_state'), pr.get('sat:relative_orbit'))
        tracks.setdefault(k, []).append(it)
    if not tracks:
        return {'id': p['id'], 'status': 'no_scene', 'm0': mlist[0], 'n': len(mlist)}
    # one track only: same viewing angle every month, so changes are not geometry
    best = max(tracks.items(), key=lambda kv: (len({i['properties']['datetime'][:7] for i in kv[1]}), len(kv[1])))
    (state, rel), tit = best
    by_m = {}
    for it in sorted(tit, key=lambda i: i['properties']['datetime']): by_m.setdefault(it['properties']['datetime'][:7], []).append(it)
    rec = {'id': p['id'], 'm0': mlist[0], 'n': len(mlist), 'track': {'orbit': state, 'relative_orbit': rel, 'scenes_listed': len(tit),
           'other_tracks': len(tracks) - 1}, 'vv': [], 'vh': [], 'rvv': [], 'rvh': [], 'ns': [], 'dt': [], 'platform': []}
    cache = {}

    def masks(crs, b, shape):
        key = (crs, b, shape)
        if key in cache: return cache[key]
        xs, ys = warp_xy('EPSG:4326', crs, [p['lng']], [p['lat']])
        h, w = shape; px = (b[2] - b[0]) / w; py = (b[3] - b[1]) / h
        yy, xx = np.mgrid[0:h, 0:w]
        d = np.hypot(b[0] + (xx + .5) * px - xs[0], b[3] - (yy + .5) * py - ys[0])
        cache[key] = (d <= R_IN, (d >= RING0) & (d <= RING1)); return cache[key]

    def read(it):
        try:
            pr = it['properties']
            crs = 'EPSG:%s' % (pr.get('proj:epsg') or str(pr.get('proj:code', '')).split(':')[-1])
            xs, ys = warp_xy('EPSG:4326', crs, [p['lng']], [p['lat']])
            half = RING1 + 40
            b = (math.floor((xs[0] - half) / 10) * 10, math.floor((ys[0] - half) / 10) * 10, math.ceil((xs[0] + half) / 10) * 10, math.ceil((ys[0] + half) / 10) * 10)
            shape = (int(round((b[3] - b[1]) / 10)), int(round((b[2] - b[0]) / 10)))
            res = {}
            for band in ('vv', 'vh'):
                a = it['assets'].get(band)
                if not a: return None
                with rasterio.open(a['href'] + ('&' if '?' in a['href'] else '?') + token()) as ds:
                    arr = ds.read(1, window=from_bounds(*b, transform=ds.transform), out_shape=shape, boundless=True, fill_value=-32768).astype('float32')
                arr[(arr <= 0) | (arr == -32768) | ~np.isfinite(arr)] = np.nan
                res[band] = arr
            cin, ring = masks(crs, b, shape)
            v_in = np.isfinite(res['vv'][cin]).mean()
            if v_in < MIN_VALID: return None
            o = {'date': pr['datetime'][:10], 'platform': pr.get('platform')}
            for band in ('vv', 'vh'):
                o[band] = float(np.nanmean(res[band][cin])); o['r' + band] = float(np.nanmean(res[band][ring]))
            return o
        except Exception as e:
            print('radar read fail', p['id'], it.get('id'), str(e)[:160]); return None

    for mo in mlist:
        cands = by_m.get(mo, [])
        if time.time() > deadline: cands = []
        # spread the picks over the month (first, middle, last) rather than the first three passes
        if len(cands) > MAX_SCENES: cands = [cands[0], cands[len(cands) // 2], cands[-1]]
        with concurrent.futures.ThreadPoolExecutor(6) as ex: got = [g for g in ex.map(read, cands) if g]
        db = lambda v: None if v is None or v <= 0 else round(10 * math.log10(v), 2)
        if got:
            for k in ('vv', 'vh', 'rvv', 'rvh'): rec[k].append(db(med([g[k] for g in got])))
            rec['ns'].append(len(got)); rec['dt'].append(min(g['date'] for g in got)); rec['platform'].append(sorted({g['platform'] for g in got if g['platform']}))
        else:
            for k in ('vv', 'vh', 'rvv', 'rvh'): rec[k].append(None)
            rec['ns'].append(0); rec['dt'].append(None); rec['platform'].append([])
    ok = [i for i, v in enumerate(rec['vv']) if v is not None and rec['rvv'][i] is not None]
    rec['months_ok'] = len(ok)
    rec['status'] = 'ok' if len(ok) >= 6 else ('few' if ok else 'no_scene')
    # change index (dB): circle minus ring, against the median of the first 3 months with data. A whole-area change (rain,
    # a new satellite) moves circle and ring together and cancels out; something built on the plot does not.
    if len(ok) >= 6:
        d = [rec['vv'][i] - rec['rvv'][i] if i in ok else None for i in range(len(mlist))]
        dh = [rec['vh'][i] - rec['rvh'][i] if (i in ok and rec['vh'][i] is not None and rec['rvh'][i] is not None) else None for i in range(len(mlist))]
        b0 = med([d[i] for i in ok[:3]]); bh = med([dh[i] for i in ok[:3] if dh[i] is not None])
        rec['y'] = [None if v is None else round(v - b0, 1) for v in d]
        rec['yh'] = [None if v is None or bh is None else round(v - bh, 1) for v in dh]
        rec['base'] = [mlist[ok[0]], mlist[ok[min(2, len(ok) - 1)]]]
        last = ok[-3:]
        rec['sum'] = {'first': [mlist[ok[0]], mlist[ok[min(2, len(ok) - 1)]]], 'last': [mlist[last[0]], mlist[last[-1]]],
                      'y_last': round(med([rec['y'][i] for i in last]), 1),
                      'yh_last': None if bh is None else round(med([rec['yh'][i] for i in last if rec['yh'][i] is not None]) or 0, 1),
                      'vv_first': round(med([rec['vv'][i] for i in ok[:3]]), 1), 'vv_last': round(med([rec['vv'][i] for i in last]), 1),
                      'rvv_first': round(med([rec['rvv'][i] for i in ok[:3]]), 1), 'rvv_last': round(med([rec['rvv'][i] for i in last]), 1)}
    rec['seconds'] = round(time.time() - t0)
    print('radar', p['id'], rec['status'], rec.get('months_ok'), rec.get('sum'), rec['seconds'], 's')
    return rec


def run_radar(a):
    cp, P = projects(a.only)
    sel = [p for p in P if p['clear'] is not None and p['n'] and p['clear'] / p['n'] < CLOUDY] if not a.all else P
    end = cp.get('to') or datetime.date.today().strftime('%Y-%m')
    mlist = months(a.frm or cp.get('from') or '2023-07', end)
    deadline = time.time() + a.budget_min * 60
    res = []
    with concurrent.futures.ThreadPoolExecutor(3) as ex:
        for r in ex.map(lambda p: _safe(radar_site, p, mlist, deadline), sel):
            if r: res.append(r)
    # normal variation: 90th percentile of the month-to-month change of the index over every project (consecutive months with data)
    steps = []
    for r in res:
        y = r.get('y') or []
        prev = None
        for v in y:
            if v is None: continue
            if prev is not None: steps.append(abs(v - prev))
            prev = v
    band = round(sorted(steps)[int(len(steps) * 0.9)], 1) if len(steps) >= 50 else None
    out = {'v': 1, 'updated': datetime.date.today().isoformat(), 'from': mlist[0], 'to': mlist[-1], 'resolution_m': 10, 'radius_m': R_IN, 'ring_m': [RING0, RING1],
           'selection': {'rule': 'Projects of construction-progress.json (plot-level pin) whose Sentinel-2 series had a clear view in fewer than %d%% of months: clouds hide them too often for the optical series alone.' % int(CLOUDY * 100),
                         'selected': len(sel), 'of': len(P)},
           'band_db': band, 'band_rule': '90th percentile of the absolute month-to-month change of the index over all %d month pairs of all projects' % len(steps),
           'source': {'name': 'Copernicus Sentinel-1 radar, Radiometrically Terrain Corrected (RTC) by Catalyst, hosted by Microsoft Planetary Computer',
                      'url': 'https://planetarycomputer.microsoft.com/dataset/sentinel-1-rtc', 'stac': PC + '/collections/sentinel-1-rtc',
                      'licence': 'CC BY 4.0 (Microsoft Planetary Computer, sentinel-1-rtc). Copernicus Sentinel data are free and open (EU Regulation 1159/2013).',
                      'licence_url': 'https://creativecommons.org/licenses/by/4.0/',
                      'attribution': 'Contains modified Copernicus Sentinel data %s-%s, processed by ESA; radiometric terrain correction by Catalyst; hosted by Microsoft Planetary Computer; analysis by Kolaboro' % (mlist[0][:4], mlist[-1][:4])},
           'method': ('Per project, one Sentinel-1 track (the same orbit direction and relative orbit every month, so the viewing angle does not change). Per month, up to %d scenes '
                      'spread over the month with valid values for at least %d%% of the circle. Per scene, the mean gamma-nought backscatter (linear power) in the %d m circle around the pin '
                      'and in a ring %d to %d m from it, for VV and VH; per month, the median of the scenes, in decibels. Change index y: (circle minus ring) minus its median over the first 3 months with data, in dB. '
                      'Rain, wet soil or a different satellite move the circle and the ring together and cancel out; a structure on the plot does not.') % (MAX_SCENES, MIN_VALID * 100, R_IN, RING0, RING1),
           'limits': ('Radar sees through cloud and at night. New walls, frames, roofs and cranes usually raise VV (corner reflections); cleared vegetation usually lowers VH. '
                      'It does not show floors, finishes or quality of work, and a building\'s orientation to the satellite changes how bright it looks. Pixels are 10 m and speckled, '
                      'so small plots and single villas may not show. Treat a change as a reason to ask the developer for dated site photos, not as proof.'),
           'fields': {'vv': 'VV backscatter in the circle, dB', 'vh': 'VH in the circle, dB', 'rvv': 'VV in the ring, dB', 'rvh': 'VH in the ring, dB', 'ns': 'scenes used', 'dt': 'first scene date',
                      'y': 'change index VV, dB', 'yh': 'change index VH, dB', 'track': 'Sentinel-1 track used', 'sum': 'medians of the first and last 3 months with data'},
           'projects': {r['id']: r for r in sorted(res, key=lambda r: r['id'])}}
    json.dump(out, open(a.out, 'w'), separators=(',', ':'))
    print('radar done', len(res), 'band', band)


# ------------------------------------------------------------------------------------------------ buildings
OV = 'overturemaps-us-west-2'
OV_HTTP = 'https://%s.s3.us-west-2.amazonaws.com' % OV


def ov_releases(prefix):
    u = OV_HTTP + '/?list-type=2&delimiter=/&prefix=' + urllib.parse.quote(prefix)
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60) as r: x = r.read().decode()
    import re
    return sorted(re.findall(r'<Prefix>' + re.escape(prefix) + r'([^<]+)/</Prefix>', x))


def run_buildings(a):
    import duckdb
    from shapely import wkb
    from shapely.geometry import Point
    from shapely.ops import transform as stx   # noqa (deprecated alias, still present in shapely 2.x)
    cp, P = projects(a.only)
    rel = [r for r in ov_releases('release/') if not r.endswith('-beta')][-1]
    con = duckdb.connect()
    con.sql("install httpfs; load httpfs")
    con.sql("create secret (type s3, key_id '', secret '', region 'us-west-2')")
    for q in ("set parquet_metadata_cache=true", "set memory_limit='%s'" % os.environ.get('DUCKDB_MEM', '6GB'), "set threads=%s" % os.environ.get('DUCKDB_THREADS', '8'), "set enable_progress_bar=false"):
        try: con.sql(q)
        except Exception as e: print('duckdb setting', q, str(e)[:80])
    src = "read_parquet('s3://%s/release/%s/theme=buildings/type=building/*.parquet')" % (OV, rel)
    res, ids = {}, {}
    t0 = time.time()
    for p in P:
        lat, lng = p['lat'], p['lng']
        dy = (R_IN + 40) / 110540.0; dx = (R_IN + 40) / (111320.0 * math.cos(math.radians(lat)))
        q = ("select id, geometry, height, num_floors, subtype, class, [s.dataset for s in sources] as ds from " + src +
             " where bbox.xmin < %f and bbox.xmax > %f and bbox.ymin < %f and bbox.ymax > %f") % (lng + dx, lng - dx, lat + dy, lat - dy)
        try: rows = con.sql(q).fetchall()
        except Exception as e: print('buildings fail', p['id'], str(e)[:200]); continue
        k = math.cos(math.radians(lat))
        loc = lambda x, y, z=None: ((x - lng) * 111320.0 * k, (y - lat) * 110540.0)
        circ = Point(0, 0).buffer(R_IN, 64)
        L = []
        for bid, g, h, nf, st, cl, ds in rows:
            try: geo = stx(loc, wkb.loads(bytes(g)))
            except Exception: continue
            if not geo.intersects(circ): continue
            L.append({'id': bid, 'a': round(geo.area), 'ai': geo.intersection(circ).area, 'h': h, 'f': nf, 'st': st, 'cl': cl,
                      'ds': (ds or [None])[0], 'dsa': sorted({d for d in (ds or []) if d}), 'd': round(geo.distance(Point(0, 0)))})
        res[p['id']] = L
        for b in L: ids[b['id']] = None
        print('buildings', p['id'], len(L), round(time.time() - t0), 's')
    # first seen: GERS registry (one row per GERS id ever published), looked up by id with the parquet page index
    reg_start = None; reg_done = False
    try:
        from datafusion import SessionContext, SessionConfig
        from datafusion.object_store import Http
        cfg = SessionConfig().set('datafusion.execution.parquet.enable_page_index', 'true').set('datafusion.execution.parquet.pushdown_filters', 'true')
        ctx = SessionContext(cfg)
        ctx.register_object_store('https://', Http(OV_HTTP), OV + '.s3.us-west-2.amazonaws.com')
        u = OV_HTTP + '/?list-type=2&prefix=registry/'
        import re
        files = []
        tok = None
        while True:
            with urllib.request.urlopen(urllib.request.Request(u + ('&continuation-token=' + urllib.parse.quote(tok) if tok else ''), headers=UA), timeout=60) as r: x = r.read().decode()
            files += [f for f in re.findall(r'<Key>([^<]+\.parquet)</Key>', x)]
            m = re.search(r'<NextContinuationToken>([^<]+)</NextContinuationToken>', x)
            if not m: break
            tok = m.group(1)
        want = sorted(ids)
        reg_deadline = time.time() + float(os.environ.get('REGISTRY_MIN', '70')) * 60
        for i, f in enumerate(files):
            if not want: break
            if time.time() > reg_deadline: print('registry: time budget reached after', i, 'files'); break
            tn = 'reg%d' % i
            ctx.register_parquet(tn, OV_HTTP + '/' + f)
            for j in range(0, len(want), 400):
                chunk = want[j:j + 400]
                lst = ','.join("'%s'" % w for w in chunk if all(c in '0123456789abcdef-' for c in w))
                for b in ctx.sql("select id, first_seen from %s where id in (%s)" % (tn, lst)).collect():
                    d = b.to_pydict()
                    for k_, v_ in zip(d['id'], d['first_seen']): ids[k_] = v_
            want = [w for w in want if not ids[w]]
            print('registry', i + 1, '/', len(files), sum(1 for v in ids.values() if v), 'found', round(time.time() - t0), 's')
        reg_start = min((v for v in ids.values() if v), default=None)
        reg_done = (i + 1 == len(files)) or all(ids.values())
    except Exception as e:
        print('registry lookup failed', str(e)[:300])
    out_p = {}
    for pid, L in res.items():
        fs = sorted(ids.get(b['id']) for b in L if ids.get(b['id'])) if reg_done else []   # a partial registry read would make 'earliest' wrong
        by_ds = {}
        for b in L: by_ds[b['ds'] or 'unknown'] = by_ds.get(b['ds'] or 'unknown', 0) + 1
        by_fs = {}
        for v in fs: by_fs[v] = by_fs.get(v, 0) + 1
        hs = [b['h'] for b in L if b['h']]; fl = [b['f'] for b in L if b['f']]
        out_p[pid] = {'n': len(L), 'cover_pct': round(sum(b['ai'] for b in L) / (math.pi * R_IN ** 2) * 100, 1),
                      'by_source': by_ds, 'n_height': len(hs), 'max_height_m': round(max(hs), 1) if hs else None, 'max_floors': max(fl) if fl else None,
                      'first_seen_known': len(fs), 'first_seen_min': fs[0] if fs else None, 'first_seen_max': fs[-1] if fs else None, 'first_seen': by_fs,
                      'b': [{'id': b['id'], 'm2': b['a'], 'd': b['d'], 'h': round(b['h'], 1) if b['h'] else None, 'f': b['f'], 'src': b['dsa'], 'fs': ids.get(b['id']) if reg_done else None}
                            for b in sorted(L, key=lambda b: b['d'])[:40]]}
    out = {'v': 1, 'updated': datetime.date.today().isoformat(), 'release': rel, 'registry_start': reg_start if reg_done else None, 'registry_complete': reg_done, 'radius_m': R_IN,
           'selection': {'rule': 'Every project of construction-progress.json (a plot-level pin in our records, at least 3 decimals, not shared, not an area centre; Sumba excluded).', 'selected': len(P), 'done': len(out_p)},
           'source': {'name': 'Overture Maps Foundation, buildings theme, release ' + rel, 'url': 'https://docs.overturemaps.org/guides/buildings/',
                      'data': 's3://%s/release/%s/theme=buildings/type=building/' % (OV, rel), 'registry': 's3://%s/registry/' % OV,
                      'licence': 'ODbL 1.0', 'licence_url': 'https://opendatacommons.org/licenses/odbl/1-0/', 'attribution_url': 'https://docs.overturemaps.org/attribution/',
                      'attribution': '© OpenStreetMap contributors, Overture Maps Foundation',
                      'datasets': {'OpenStreetMap': 'ODbL, © OpenStreetMap contributors', 'Microsoft ML Buildings': 'ODbL, Global ML Building Footprints (Microsoft)',
                                   'Google Open Buildings': 'CC BY 4.0, Google Open Buildings', 'Esri Community Maps': 'CC BY 4.0, Esri Community Maps contributors'}},
           'method': ('Buildings of the Overture release whose footprint touches the %d m circle around the pin (the same circle as the satellite series). cover_pct: share of the circle covered by footprints. '
                      'First seen: the release in which the building\'s GERS id first appeared, from the Overture GERS registry, which starts at release %s: a building first seen then may be older. '
                      'A footprint drawn from imagery can be a few years behind the ground, and an empty circle can mean nobody has mapped it yet.') % (R_IN, reg_start or 'its first'),
           'seconds': round(time.time() - t0), 'projects': out_p}
    json.dump(out, open(a.out, 'w'), separators=(',', ':'), ensure_ascii=False)
    print('buildings done', len(out_p), 'release', rel, 'registry start', reg_start)


def _safe(fn, *a):
    try: return fn(*a)
    except Exception as e: print('fail', str(e)[:300]); return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('what', choices=['radar', 'buildings']); ap.add_argument('out')
    ap.add_argument('--only', default=''); ap.add_argument('--from', dest='frm', default='')
    ap.add_argument('--budget-min', type=float, default=80); ap.add_argument('--all', action='store_true')
    a = ap.parse_args(); a.only = set(x for x in a.only.split(',') if x)
    os.environ.setdefault('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR'); os.environ.setdefault('GDAL_HTTP_MAX_RETRY', '4'); os.environ.setdefault('GDAL_HTTP_RETRY_DELAY', '2')
    os.environ.setdefault('CPL_VSIL_CURL_USE_HEAD', 'NO'); os.environ.setdefault('GDAL_HTTP_MULTIRANGE', 'YES'); os.environ.setdefault('GDAL_HTTP_MERGE_CONSECUTIVE_RANGES', 'YES')
    (run_radar if a.what == 'radar' else run_buildings)(a)


if __name__ == '__main__':
    main()
