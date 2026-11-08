#!/usr/bin/env python3
"""Kolaboro: see the site (batch 18, n18c). No model calls, no accounts, no keys.

  see_site.py street OUT.json   Open street-level photos within 200 m of each reliable project pin, newest first, at most one per
                                sequence: Panoramax (meta-catalogue api.panoramax.xyz, CC BY-SA 4.0 / Licence Ouverte 2.0 per photo),
                                KartaView (api.kartaview.org, CC BY-SA 4.0) and Wikimedia Commons geotagged files (only CC0, public
                                domain, CC BY 4.0 and CC BY-SA 4.0, which allow credit through a link to the file page).
                                We keep the source page, capture date, distance, camera heading, licence and the source's own thumbnail
                                URL (kolaboro.com shows that thumbnail unchanged through /api/x/see/ph/<ID>/<n>.jpg). No EXIF, no names.
  see_site.py 3d OUT.json       Overture Maps building footprints (latest release, ODbL) within 250 m of each pin, in metres from the
                                pin (0.5 m steps), with height and floors where mapped, for the 3D view on named project pages.

Projects and pins: exactly those of https://kolaboro.com/data/construction-progress.json (plot-level pin in named.json, at least
3 decimals, not shared, not an area centre, Sumba excluded), the same selection as the satellite, radar and building files.
Options: --only ID,ID"""
import json, os, sys, math, time, datetime, argparse, re, urllib.request, urllib.parse

ORIGIN = 'https://kolaboro.com'
UA = {'user-agent': 'Kolaboro-see-site/1.0 (+https://kolaboro.com/data/; agent@kolaboro.com)'}
R_PH = 200          # street photos: metres from the pin
R_3D = 250          # 3D: footprints touching this radius
R_IN = 150          # the analysis circle used everywhere else
MAX_PH = 4          # photos kept per project
MAX_B = 700         # footprints kept per project (nearest first)


def get_json(url, data=None, timeout=60, tries=4):
    req = urllib.request.Request(url, data=data, headers=UA)
    for i in range(tries):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r: return json.load(r)
        except Exception as e:
            if i == tries - 1: raise
            time.sleep(3 + i * 5)


def projects(only):
    cp = get_json(ORIGIN + '/data/construction-progress.json?run=%d' % time.time())
    named = get_json(ORIGIN + '/data/named.json?run=%d' % time.time())
    by = {p['id']: p for p in named['projects']}
    out = []
    for pid in cp['projects']:
        p = by.get(pid); fx = (p or {}).get('fx') or {}
        if not p or not isinstance(fx.get('lat'), (int, float)) or not isinstance(fx.get('lng'), (int, float)): continue
        if str(p.get('mk', '')).lower() == 'sumba': continue
        if only and pid not in only: continue
        dec = min(len(str(fx['lat']).split('.')[-1]) if '.' in str(fx['lat']) else 0, len(str(fx['lng']).split('.')[-1]) if '.' in str(fx['lng']) else 0)
        out.append({'id': pid, 'lat': float(fx['lat']), 'lng': float(fx['lng']), 'dec': dec})
    return out


def dist(lat1, lng1, lat2, lng2):
    R = 6371008.8; r = math.radians
    dl, dn = r(lat2 - lat1), r(lng2 - lng1)
    h = math.sin(dl / 2) ** 2 + math.cos(r(lat1)) * math.cos(r(lat2)) * math.sin(dn / 2) ** 2
    return 2 * R * math.asin(min(1, math.sqrt(h)))


def bearing(lat1, lng1, lat2, lng2):
    r = math.radians
    y = math.sin(r(lng2 - lng1)) * math.cos(r(lat2))
    x = math.cos(r(lat1)) * math.sin(r(lat2)) - math.sin(r(lat1)) * math.cos(r(lat2)) * math.cos(r(lng2 - lng1))
    return (math.degrees(math.atan2(y, x)) + 360) % 360


def https(u):
    return isinstance(u, str) and u.startswith('https://') and len(u) < 600


# ------------------------------------------------------------------------------------------------ street photos
PX = 'https://api.panoramax.xyz/api'
LIC = {'CC-BY-SA-4.0': ('CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/'),
       'CC-BY-4.0': ('CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/'),
       'CC0-1.0': ('CC0 1.0', 'https://creativecommons.org/publicdomain/zero/1.0/'),
       'etalab-2.0': ('Licence Ouverte 2.0', 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/')}


def panoramax(p):
    q = urllib.parse.urlencode({'place_position': '%f,%f' % (p['lng'], p['lat']), 'place_distance': '0-%d' % R_PH, 'limit': 100, 'sortby': '-ts'})
    d = get_json(PX + '/search?' + q)
    out = []
    for f in d.get('features') or []:
        pr = f.get('properties') or {}
        if pr.get('geovisio:visibility', 'anyone') not in ('anyone', None) or pr.get('geovisio:status', 'ready') != 'ready': continue
        lic = LIC.get(pr.get('license'))
        if not lic: continue
        th = ((f.get('assets') or {}).get('thumb') or {}).get('href')
        lng, lat = (f.get('geometry') or {}).get('coordinates', [None, None])[:2]
        if not https(th) or lat is None: continue
        via = next((l for l in f.get('links', []) if l.get('rel') == 'via'), {})
        dm = dist(p['lat'], p['lng'], lat, lng)
        if dm > R_PH: continue
        out.append({'src': 'panoramax', 'id': f['id'], 'seq': f.get('collection'), 'date': (pr.get('datetime') or '')[:10] or None,
                    'd': round(dm), 'az': round(pr['view:azimuth']) if isinstance(pr.get('view:azimuth'), (int, float)) else None,
                    'to': round(bearing(lat, lng, p['lat'], p['lng'])), 'lic': lic[0], 'lic_url': lic[1],
                    'page': 'https://api.panoramax.xyz/#focus=pic&pic=' + f['id'], 'item': PX + '/collections/%s/items/%s' % (f.get('collection'), f['id']),
                    'inst': via.get('href') if https(via.get('href')) else None, 'thumb': th, 'pano': bool((pr.get('pers:interior_orientation') or {}).get('field_of_view') == 360)})
    return len(d.get('features') or []), out


def kartaview(p):
    q = urllib.parse.urlencode({'lat': p['lat'], 'lng': p['lng'], 'radius': R_PH, 'itemsPerPage': 150})
    d = get_json('https://api.kartaview.org/2.0/photo/?' + q)
    if ((d.get('status') or {}).get('apiCode')) != 600: raise RuntimeError('kartaview ' + str((d.get('status') or {}).get('apiMessage'))[:120])
    rows = ((d.get('result') or {}).get('data')) or []
    out = []
    for f in rows:
        if f.get('status') != 'active' or f.get('visibility', 'public') != 'public': continue
        try: lat, lng = float(f['lat']), float(f['lng'])
        except Exception: continue
        th = f.get('imageLthUrl') or f.get('fileurlLTh') or f.get('imageThUrl')
        if not https(th): continue
        dm = dist(p['lat'], p['lng'], lat, lng)
        if dm > R_PH: continue
        try: az = round(float(f.get('heading'))) % 360
        except Exception: az = None
        out.append({'src': 'kartaview', 'id': str(f['id']), 'seq': str(f.get('sequenceId')), 'date': (f.get('shotDate') or '')[:10] or None, 'd': round(dm),
                    'az': az, 'to': round(bearing(lat, lng, p['lat'], p['lng'])), 'lic': 'CC BY-SA 4.0', 'lic_url': 'https://creativecommons.org/licenses/by-sa/4.0/',
                    'page': 'https://kartaview.org/details/%s/%s/track-info' % (f.get('sequenceId'), f.get('sequenceIndex')), 'thumb': th,
                    'blur': f.get('autoImgProcessingResult') == 'BLURRED'})
    return len(rows), out


COMMONS_OK = [(re.compile(r'^cc0'), 'CC0 1.0', 'https://creativecommons.org/publicdomain/zero/1.0/'),
              (re.compile(r'^public domain$|^pd'), 'Public domain', None),
              (re.compile(r'^cc by-sa 4\.0$'), 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/'),
              (re.compile(r'^cc by 4\.0$'), 'CC BY 4.0', 'https://creativecommons.org/licenses/by/4.0/')]


def commons(p):
    q = urllib.parse.urlencode({'action': 'query', 'format': 'json', 'formatversion': 2, 'generator': 'geosearch', 'ggscoord': '%f|%f' % (p['lat'], p['lng']),
                                'ggsradius': R_PH, 'ggslimit': 50, 'ggsnamespace': 6, 'prop': 'imageinfo|coordinates', 'iiprop': 'url|extmetadata|mime',
                                'iiurlwidth': 500, 'iiextmetadatafilter': 'DateTimeOriginal|LicenseShortName|LicenseUrl'})
    d = get_json('https://commons.wikimedia.org/w/api.php?' + q)
    pages = ((d.get('query') or {}).get('pages')) or []
    out = []
    for pg in pages:
        ii = (pg.get('imageinfo') or [{}])[0]; co = (pg.get('coordinates') or [{}])[0]
        if ii.get('mime') not in ('image/jpeg', 'image/png', 'image/webp'): continue
        em = ii.get('extmetadata') or {}
        ln = re.sub('<[^>]+>', '', (em.get('LicenseShortName') or {}).get('value', '')).strip().lower()
        ok = next((o for o in COMMONS_OK if o[0].search(ln)), None)
        if not ok or not https(ii.get('thumburl')) or co.get('lat') is None: continue
        dm = dist(p['lat'], p['lng'], co['lat'], co['lon'])
        if dm > R_PH: continue
        raw = re.sub('<[^>]+>', '', (em.get('DateTimeOriginal') or {}).get('value', ''))
        m = re.search(r'(19|20)\d\d-\d\d-\d\d', raw) or re.search(r'(19|20)\d\d:\d\d:\d\d', raw)
        dt = m.group(0).replace(':', '-') if m else None
        out.append({'src': 'commons', 'id': str(pg.get('pageid')), 'seq': 'c' + str(pg.get('pageid')), 'date': dt, 'd': round(dm), 'az': None,
                    'to': round(bearing(co['lat'], co['lon'], p['lat'], p['lng'])), 'lic': ok[1], 'lic_url': ok[2] or ii.get('descriptionurl'),
                    'page': ii.get('descriptionurl'), 'thumb': ii['thumburl']})
    return len(pages), out


def pick(L):
    # street-level imagery first (Panoramax, KartaView), then geotagged Commons files; within each, newest first, one photo per
    # sequence (a drive of 300 frames is one view), nearest on ties, undated last
    L = sorted(L, key=lambda x: (x['src'] != 'commons', x['date'] or '0000', -x['d']), reverse=True)
    seen, out = set(), []
    for x in L:
        k = (x['src'], x.get('seq'))
        if k in seen: continue
        seen.add(k); out.append(x)
        if len(out) >= MAX_PH: break
    return out


def run_street(a):
    P = projects(a.only)
    res, t0 = {}, time.time()
    for p in P:
        rec = {'checked': datetime.date.today().isoformat(), 'found': {}, 'errors': [], 'ph': []}
        allp = []
        for name, fn in (('panoramax', panoramax), ('kartaview', kartaview), ('commons', commons)):
            try:
                n, L = fn(p); rec['found'][name] = len(L); allp += L
            except Exception as e:
                rec['errors'].append(name); print('street fail', p['id'], name, str(e)[:160])
            time.sleep(1.0)
        rec['ph'] = pick(allp)
        rec['newest'] = max((x['date'] for x in allp if x['date']), default=None)
        res[p['id']] = rec
        print('street', p['id'], rec['found'], len(rec['ph']), round(time.time() - t0), 's')
    out = {'v': 1, 'updated': datetime.date.today().isoformat(), 'radius_m': R_PH, 'max_per_project': MAX_PH,
           'selection': {'rule': 'Every project of construction-progress.json (a plot-level pin in our records, at least 3 decimals, not shared, not an area centre; Sumba excluded).', 'selected': len(P), 'done': len(res)},
           'sources': {
               'panoramax': {'name': 'Panoramax', 'url': 'https://panoramax.fr/', 'api': PX, 'licence': 'per photo: CC BY-SA 4.0 or Licence Ouverte 2.0 (etalab-2.0)', 'note': 'Federated open street-level imagery; faces and number plates are blurred by the hosting instance.'},
               'kartaview': {'name': 'KartaView', 'url': 'https://kartaview.org/', 'api': 'https://api.kartaview.org/2.0/photo/', 'licence': 'CC BY-SA 4.0', 'licence_url': 'https://creativecommons.org/licenses/by-sa/4.0/', 'note': 'Open street-level imagery; faces and number plates are blurred by KartaView.'},
               'commons': {'name': 'Wikimedia Commons', 'url': 'https://commons.wikimedia.org/', 'api': 'https://commons.wikimedia.org/w/api.php (geosearch)', 'licence': 'only files under CC0, public domain, CC BY 4.0 or CC BY-SA 4.0', 'note': 'Geotagged files; the author and full licence are on each file page.'},
               'not_used': {'Mapillary': 'needs an account access token', 'Google Street View': 'needs an API key and its terms do not allow storing results'}},
           'method': ('For each pin, every photo the three sources return within %d m, newest capture first, at most one photo per sequence (a drive or walk of many frames counts once), '
                      'at most %d per project. d: metres from the pin; az: the direction the camera faced, degrees from north, where recorded; to: the direction from the photo to the pin. '
                      'Credit and licence: through the link to each photo\'s own page, which names the author. The thumbnail is the source\'s own, unchanged. We keep no EXIF and no names.') % (R_PH, MAX_PH),
           'seconds': round(time.time() - t0), 'projects': res}
    json.dump(out, open(a.out, 'w'), separators=(',', ':'), ensure_ascii=False)
    print('street done', len(res), sum(1 for r in res.values() if r['ph']), 'with photos')


# ------------------------------------------------------------------------------------------------ 3D footprints
OV = 'overturemaps-us-west-2'
OV_HTTP = 'https://%s.s3.us-west-2.amazonaws.com' % OV
SRC = {'OpenStreetMap': 'o', 'Microsoft ML Buildings': 'm', 'Google Open Buildings': 'g', 'Esri Community Maps': 'e'}


def ov_release():
    u = OV_HTTP + '/?list-type=2&delimiter=/&prefix=release/'
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60) as r: x = r.read().decode()
    rel = sorted(re.findall(r'<Prefix>release/([^<]+)/</Prefix>', x))
    return [r for r in rel if not r.endswith('-beta')][-1]


def run_3d(a):
    import duckdb
    from shapely import wkb
    from shapely.geometry import Point
    from shapely.ops import transform as stx
    P = projects(a.only)
    rel = os.environ.get('OV_RELEASE') or ov_release()
    con = duckdb.connect()
    con.sql("install httpfs; load httpfs")
    con.sql("create secret (type s3, key_id '', secret '', region 'us-west-2')")
    for q in ("set parquet_metadata_cache=true", "set memory_limit='%s'" % os.environ.get('DUCKDB_MEM', '6GB'), "set threads=%s" % os.environ.get('DUCKDB_THREADS', '8'), "set enable_progress_bar=false"):
        try: con.sql(q)
        except Exception as e: print('duckdb setting', q, str(e)[:80])
    src = "read_parquet('s3://%s/release/%s/theme=buildings/type=building/*.parquet')" % (OV, rel)
    res, t0 = {}, time.time()
    for p in P:
        lat, lng = p['lat'], p['lng']
        dy = (R_3D + 40) / 110540.0; dx = (R_3D + 40) / (111320.0 * math.cos(math.radians(lat)))
        q = ("select id, geometry, height, num_floors, min_height, [s.dataset for s in sources] as ds from " + src +
             " where bbox.xmin < %f and bbox.xmax > %f and bbox.ymin < %f and bbox.ymax > %f") % (lng + dx, lng - dx, lat + dy, lat - dy)
        try: rows = con.sql(q).fetchall()
        except Exception as e: print('3d fail', p['id'], str(e)[:200]); continue
        k = math.cos(math.radians(lat))
        loc = lambda x, y, z=None: ((x - lng) * 111320.0 * k, (y - lat) * 110540.0)
        c3, cin = Point(0, 0).buffer(R_3D, 64), Point(0, 0).buffer(R_IN, 64)
        L = []
        for bid, g, h, nf, mh, ds in rows:
            try: geo = stx(loc, wkb.loads(bytes(g)))
            except Exception: continue
            if not geo.intersects(c3): continue
            geo = geo.simplify(0.4, preserve_topology=True)
            polys = list(geo.geoms) if geo.geom_type == 'MultiPolygon' else [geo] if geo.geom_type == 'Polygon' else []
            for pg in polys:
                ring = list(pg.exterior.coords)[:-1]
                if len(ring) < 3: continue
                flat = []
                for x, y in ring: flat += [int(round(x * 2)), int(round(y * 2))]
                L.append({'c': flat, 'h': round(h, 1) if h else None, 'f': nf or None, 'mh': round(mh, 1) if mh else None,
                          's': ''.join(sorted({SRC.get(d, '') for d in (ds or []) if d})) or None, 'i': 1 if pg.intersects(cin) else 0,
                          'd': round(pg.distance(Point(0, 0))), 'id': bid})
        L.sort(key=lambda b: b['d'])
        res[p['id']] = {'lat': lat, 'lng': lng, 'dec': p['dec'], 'n': len(L), 'n_in': sum(b['i'] for b in L), 'cut': len(L) > MAX_B,
                        'b': [{k_: v_ for k_, v_ in b.items() if v_ is not None and k_ != 'd'} for b in L[:MAX_B]]}
        print('3d', p['id'], len(L), round(time.time() - t0), 's')
    out = {'v': 1, 'updated': datetime.date.today().isoformat(), 'release': rel, 'radius_m': R_3D, 'circle_m': R_IN, 'unit': 'c: footprint outline as x,y pairs in half-metres east and north of the pin',
           'source': {'name': 'Overture Maps Foundation, buildings theme, release ' + rel, 'url': 'https://docs.overturemaps.org/guides/buildings/',
                      'licence': 'ODbL 1.0', 'licence_url': 'https://opendatacommons.org/licenses/odbl/1-0/', 'attribution_url': 'https://docs.overturemaps.org/attribution/',
                      'attribution': '© OpenStreetMap contributors, Overture Maps Foundation', 'codes': {v: k for k, v in SRC.items()}},
           'fields': {'h': 'height in metres where mapped', 'f': 'floors where mapped', 'mh': 'height of the lowest part above ground', 's': 'mapped by (codes)', 'i': '1 if the footprint touches the 150 m circle', 'id': 'Overture GERS id'},
           'method': 'Overture buildings whose footprint touches the %d m radius around the pin, nearest first, at most %d per project, outlines simplified to 0.4 m and rounded to 0.5 m. Heights are drawn only where mapped; buildings without a mapped height are drawn at a nominal 3 m and shown in a lighter colour.' % (R_3D, MAX_B),
           'seconds': round(time.time() - t0), 'projects': res}
    json.dump(out, open(a.out, 'w'), separators=(',', ':'), ensure_ascii=False)
    print('3d done', len(res), 'release', rel, os.path.getsize(a.out), 'bytes')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('what', choices=['street', '3d']); ap.add_argument('out'); ap.add_argument('--only', default='')
    a = ap.parse_args(); a.only = set(x for x in a.only.split(',') if x)
    (run_street if a.what == 'street' else run_3d)(a)


if __name__ == '__main__':
    main()
