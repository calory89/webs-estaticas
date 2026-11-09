#!/usr/bin/env python3
"""Kolaboro: rules on the land and the map's own history at the plot (batch 19, n19c). No model calls, no accounts, no keys.

  land_rules.py rules OUT.json    Protected and restricted land at and near each reliable project pin, from official open layers:
                                  - Natura 2000 (EEA, ArcGIS service ProtectedSites/Natura2000Sites; EEA reuse policy, CC BY 4.0):
                                    sites containing the pin or within 2 km, with type and release date (EU member states only)
                                  - England: planning.data.gov.uk (Open Government Licence v3.0): green belt, conservation areas, SSSI,
                                    National Landscapes (AONB), national parks, SAC, SPA, Ramsar, ancient woodland, within 500 m
                                  - Spain, Ley de Costas (Ley 22/1988): distance from the pin to the sea as mapped in OpenStreetMap,
                                    against the 100 m protection easement and the 500 m zone of influence. We also try the MITECO
                                    boundary line (deslinde) map service and record what it answered; its file download needs a human check.
                                  - Everywhere: protected areas, nature reserves and national parks mapped in OpenStreetMap (ODbL), read
                                    from the OpenFreeMap vector tiles at zoom 14, the same method as kolaboro.com/api/x/u/protected
  land_rules.py osmhist OUT.json  OpenStreetMap history within 150 m of each pin (OSM API 0.6, ODbL): buildings, roads and land use,
                                  when each was first mapped (version 1) and last changed, buildings first mapped per year, recent edits.
                                  No user names or ids are kept.

Projects and pins: exactly those of https://kolaboro.com/data/construction-progress.json (plot-level pin in named.json, at least
3 decimals, not shared, not an area centre, Sumba excluded), the same selection as the satellite, street and 3D files.
Options: --only ID,ID"""
import json, os, sys, math, time, datetime, argparse, re, ssl, urllib.request, urllib.parse

ORIGIN = 'https://kolaboro.com'
UA = {'user-agent': 'Kolaboro-land-rules/1.0 (+https://kolaboro.com/data/; agent@kolaboro.com)'}
EU = {'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czechia', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany',
      'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania',
      'Slovakia', 'Slovenia', 'Spain', 'Sweden'}
SCOTLAND = {'edinburgh', 'glasgow', 'aberdeen', 'dundee', 'inverness', 'scotland'}
R_N2K = 2000      # Natura 2000: metres
R_UK = 500        # England planning data: metres
R_OSM = 1000      # OpenStreetMap protected areas: metres
R_HIST = 150      # map history circle (the analysis circle used everywhere else)


def now(): return datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d')


def get(url, data=None, timeout=60, tries=4, raw=False, ctx=None, hdr=None):
    req = urllib.request.Request(url, data=data, headers=dict(UA, **(hdr or {})))
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
                b = r.read(); return b if raw else json.loads(b)
        except urllib.error.HTTPError as e:
            last = e
            if e.code in (400, 404, 410): raise
        except Exception as e:
            last = e
        if i < tries - 1: time.sleep(3 + i * 6)
    raise last


def projects(only):
    cp = get(ORIGIN + '/data/construction-progress.json?run=%d' % time.time())
    named = get(ORIGIN + '/data/named.json?run=%d' % time.time())
    by = {p['id']: p for p in named['projects']}
    out = []
    for pid in cp['projects']:
        p = by.get(pid); fx = (p or {}).get('fx') or {}
        if not p or not isinstance(fx.get('lat'), (int, float)) or not isinstance(fx.get('lng'), (int, float)): continue
        if str(p.get('mk', '')).lower() == 'sumba': continue
        if only and pid not in only: continue
        dec = min(len(str(fx['lat']).split('.')[-1]) if '.' in str(fx['lat']) else 0, len(str(fx['lng']).split('.')[-1]) if '.' in str(fx['lng']) else 0)
        out.append({'id': pid, 'lat': float(fx['lat']), 'lng': float(fx['lng']), 'dec': dec, 'co': p.get('co') or '', 'mk': p.get('mk') or ''})
    return out


# ------------------------------------------------------------------------------------------------ geometry in local metres
class Local:
    def __init__(self, lat, lng):
        self.lat, self.lng = lat, lng
        self.kx, self.ky = 111320.0 * math.cos(math.radians(lat)), 110574.0

    def xy(self, lon, lat): return ((lon - self.lng) * self.kx, (lat - self.lat) * self.ky)


def seg_d(ax, ay, bx, by):
    dx, dy = bx - ax, by - ay; L = dx * dx + dy * dy
    t = 0 if not L else max(0, min(1, -(ax * dx + ay * dy) / L))
    return math.hypot(ax + t * dx, ay + t * dy)


def rings_eval(rings):
    """rings: list of lists of (x, y) in metres around the pin (0, 0). Returns (inside, distance to the nearest edge)."""
    inside, best = False, float('inf')
    for r in rings:
        n = len(r)
        for i in range(n):
            (xi, yi), (xj, yj) = r[i], r[i - 1]
            if (yi > 0) != (yj > 0) and 0 < (xj - xi) * (0 - yi) / (yj - yi) + xi: inside = not inside
            best = min(best, seg_d(xi, yi, xj, yj))
    return inside, best


def r10(m): return int(round(m / 10.0) * 10)


def acc_m(dec): return 15 if dec >= 5 else 30 if dec == 4 else 100


# ------------------------------------------------------------------------------------------------ Natura 2000 (EEA)
N2K = 'https://bio.discomap.eea.europa.eu/arcgis/rest/services/ProtectedSites/Natura2000Sites/MapServer'
N2K_TYPE = {'A': 'SPA', 'B': 'SCI/SAC', 'C': 'SPA and SCI/SAC'}


def natura(p):
    L = Local(p['lat'], p['lng']); found = {}; release = None
    for ly in (0, 1, 2):
        q = urllib.parse.urlencode({'f': 'json', 'geometry': '%f,%f' % (p['lng'], p['lat']), 'geometryType': 'esriGeometryPoint', 'inSR': 4326,
                                    'spatialRel': 'esriSpatialRelIntersects', 'distance': R_N2K, 'units': 'esriSRUnit_Meter',
                                    'outFields': 'SITECODE,SITENAME,SITETYPE,RELEASE_DATE,MS', 'returnGeometry': 'true', 'outSR': 4326,
                                    'maxAllowableOffset': 0.00005, 'geometryPrecision': 6})
        d = get(N2K + '/%d/query?%s' % (ly, q), timeout=90)
        if d.get('error'): raise RuntimeError('EEA ' + str(d['error'].get('message'))[:80])
        for f in d.get('features') or []:
            a = f.get('attributes') or {}; g = f.get('geometry') or {}
            code = a.get('SITECODE')
            if not code or code in found: continue
            rings = [[L.xy(x, y) for x, y in r] for r in g.get('rings') or []]
            if not rings: continue
            ins, dm = rings_eval(rings)
            rd = a.get('RELEASE_DATE')
            if isinstance(rd, (int, float)): rd = datetime.datetime.fromtimestamp(rd / 1000, datetime.timezone.utc).strftime('%Y-%m-%d'); release = max(release or '', rd)
            found[code] = {'code': code, 'name': (a.get('SITENAME') or '')[:120], 'type': N2K_TYPE.get(a.get('SITETYPE'), a.get('SITETYPE')),
                           'in': ins, 'd': 0 if ins else r10(dm), 'edge': r10(dm), 'rel': rd}
    L2 = sorted(found.values(), key=lambda x: (not x['in'], x['d']))
    return {'ok': True, 'in': [x for x in L2 if x['in']], 'near': [x for x in L2 if not x['in'] and x['d'] <= R_N2K][:8], 'release': release or n2k_release()}


_N2R = {}


def n2k_release():
    if 'r' not in _N2R:
        try:
            q = urllib.parse.urlencode({'f': 'json', 'where': '1=1', 'outFields': 'RELEASE_DATE', 'returnGeometry': 'false', 'resultRecordCount': 1, 'orderByFields': 'RELEASE_DATE DESC'})
            f = (get(N2K + '/2/query?' + q).get('features') or [{}])[0]
            rd = (f.get('attributes') or {}).get('RELEASE_DATE')
            _N2R['r'] = datetime.datetime.fromtimestamp(rd / 1000, datetime.timezone.utc).strftime('%Y-%m-%d') if isinstance(rd, (int, float)) else None
        except Exception: _N2R['r'] = None
    return _N2R['r']


# ------------------------------------------------------------------------------------------------ England: planning.data.gov.uk
PD = 'https://www.planning.data.gov.uk'
PD_SETS = ['green-belt', 'conservation-area', 'site-of-special-scientific-interest', 'area-of-outstanding-natural-beauty', 'national-park',
           'special-area-of-conservation', 'special-protection-area', 'ramsar', 'ancient-woodland']


def wkt_rings(w, L):
    rings = []
    for m in re.finditer(r'\(([-0-9.eE ,]+)\)', w or ''):
        pts = []
        for xy in m.group(1).split(','):
            s = xy.split()
            if len(s) >= 2: pts.append(L.xy(float(s[0]), float(s[1])))
        if len(pts) > 2: rings.append(pts)
    return rings


def england(p):
    L = Local(p['lat'], p['lng'])
    dy, dx = R_UK / L.ky, R_UK / L.kx
    poly = 'POLYGON((%f %f,%f %f,%f %f,%f %f,%f %f))' % (p['lng'] - dx, p['lat'] - dy, p['lng'] + dx, p['lat'] - dy, p['lng'] + dx, p['lat'] + dy, p['lng'] - dx, p['lat'] + dy, p['lng'] - dx, p['lat'] - dy)
    q = [('dataset', s) for s in PD_SETS] + [('geometry', poly), ('geometry_relation', 'intersects'), ('limit', '100')]
    d = get(PD + '/entity.json?' + urllib.parse.urlencode(q), timeout=60, tries=2)
    hits = []
    for e in d.get('entities') or []:
        rings = wkt_rings(e.get('geometry'), L)
        if not rings: continue
        ins, dm = rings_eval(rings)
        if not ins and dm > R_UK: continue
        hits.append({'ds': e.get('dataset'), 'name': (e.get('name') or '')[:120] or None, 'ref': e.get('reference'), 'in': ins, 'd': 0 if ins else r10(dm),
                     'entity': e.get('entity'), 'start': e.get('start-date') or None, 'ed': e.get('entry-date') or None})
    hits.sort(key=lambda x: (not x['in'], x['d']))
    return {'ok': True, 'hits': hits[:12], 'sets': PD_SETS}


# ------------------------------------------------------------------------------------------------ OpenFreeMap tiles (OSM)
_OFM = {}


def ofm_tmpl():
    if 'u' not in _OFM:
        j = get('https://tiles.openfreemap.org/planet')
        u = (j.get('tiles') or [None])[0]
        if not u or not u.startswith('https://tiles.openfreemap.org/'): raise RuntimeError('unexpected TileJSON')
        _OFM['u'] = u; m = re.search(r'/planet/(\d{8})', u); _OFM['build'] = m and '%s-%s-%s' % (m.group(1)[:4], m.group(1)[4:6], m.group(1)[6:])
    return _OFM['u']


def tiles_around(p, rad_m, layers):
    import mapbox_vector_tile
    Z = 14; n = 2 ** Z; L = Local(p['lat'], p['lng'])
    tx = lambda lo: int((lo + 180) / 360 * n)
    ty = lambda la: int((1 - math.log(math.tan(math.radians(la)) + 1 / math.cos(math.radians(la))) / math.pi) / 2 * n)
    dy, dx = rad_m / L.ky, rad_m / L.kx
    out = []
    for x in range(tx(p['lng'] - dx), tx(p['lng'] + dx) + 1):
        for y in range(ty(p['lat'] + dy), ty(p['lat'] - dy) + 1):
            url = ofm_tmpl().replace('{z}', str(Z)).replace('{x}', str(x)).replace('{y}', str(y))
            try: b = get(url, raw=True, timeout=40)
            except urllib.error.HTTPError as e:
                if e.code in (204, 404): continue
                raise
            if not b: continue
            t = mapbox_vector_tile.decode(b, default_options={'y_coord_down': True})
            for ly in layers:
                Ly = t.get(ly)
                if not Ly: continue
                E = Ly.get('extent', 4096)
                def ll(qx, qy, x=x, y=y, E=E):
                    lon = (x + qx / E) / n * 360 - 180
                    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (y + qy / E) / n))))
                    return L.xy(lon, lat)
                for f in Ly['features']:
                    g = f.get('geometry') or {}
                    if g.get('type') not in ('Polygon', 'MultiPolygon'): continue
                    polys = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
                    rings, edges = [], []
                    for poly in polys:
                        for r in poly:
                            rings.append([ll(a, b) for a, b in r])
                            # edges made by clipping at the tile border are not real boundaries
                            for i in range(1, len(r)):
                                a0, b0 = r[i - 1], r[i]
                                if (a0[0] <= 0 and b0[0] <= 0) or (a0[0] >= E and b0[0] >= E) or (a0[1] <= 0 and b0[1] <= 0) or (a0[1] >= E and b0[1] >= E): continue
                                edges.append((ll(*a0), ll(*b0)))
                    out.append({'layer': ly, 'props': f.get('properties') or {}, 'rings': rings, 'edges': edges, 'home': (x == tx(p['lng']) and y == ty(p['lat']))})
    return out


def osm_protected(p):
    feats = tiles_around(p, R_OSM, ['park'])
    found = {}
    for f in feats:
        pr = f['props']; cl = pr.get('class') or 'protected_area'
        kind = {'national_park': 'national park', 'nature_reserve': 'nature reserve', 'protected_area': 'protected area'}.get(cl, str(cl).replace('_', ' ')[:40])
        name = str(pr.get('name:en') or pr.get('name_en') or pr.get('name') or '')[:90] or None
        key = kind + '|' + (name or str(id(f)))
        ins = rings_eval(f['rings'])[0] if f['home'] else False
        dm = min([seg_d(a[0], a[1], b[0], b[1]) for a, b in f['edges']] or [float('inf')])
        o = found.setdefault(key, {'kind': kind, 'name': name, 'in': False, 'd': float('inf')})
        o['in'] = o['in'] or ins; o['d'] = min(o['d'], dm)
    L2 = [dict(o, d=0 if o['in'] else r10(o['d'])) for o in found.values() if o['in'] or o['d'] <= R_OSM]
    L2.sort(key=lambda x: (not x['in'], x['d']))
    return {'ok': True, 'in': [x for x in L2 if x['in']], 'near': [x for x in L2 if not x['in']][:8], 'build': _OFM.get('build')}


def sea_distance(p):
    """Metres from the pin to the sea (OpenMapTiles water class ocean), up to 1 km; None when farther."""
    feats = tiles_around(p, 1000, ['water'])
    best, on_sea = float('inf'), False
    for f in feats:
        if (f['props'].get('class') or '') != 'ocean': continue
        if f['home'] and rings_eval(f['rings'])[0]: on_sea = True
        for a, b in f['edges']: best = min(best, seg_d(a[0], a[1], b[0], b[1]))
    if on_sea: return 0
    return r10(best) if best <= 1000 else None


MITECO_WMS = 'https://wms.mapama.gob.es/sig/Costas/DPMT/wms.aspx?request=GetCapabilities&service=WMS'
_MIT = {}


def miteco_status():
    """What the MITECO boundary line (deslinde) map service answers today. The server omits its FNMT intermediate certificate, so we
    add FNMT's own published intermediate (fetched from the address in the certificate) to the normal trust store; verification stays on."""
    if 'st' in _MIT: return _MIT['st']
    st = {'checked': now(), 'url': MITECO_WMS}
    try:
        ctx = ssl.create_default_context()
        try:
            der = get('http://www.cert.fnmt.es/certs/ACCOMP.crt', raw=True, timeout=30, tries=2)
            ctx.load_verify_locations(cadata=ssl.DER_cert_to_PEM_cert(der))
        except Exception: pass
        b = get(MITECO_WMS, raw=True, timeout=60, tries=2, ctx=ctx).decode('utf-8', 'replace')
        if '<ServiceException' in b or 'WMS_Capabilities' not in b and 'WMT_MS_Capabilities' not in b:
            st['answer'] = 'error'; st['detail'] = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', b.replace('<![CDATA[', '').replace(']]>', '')))[:140].strip()
        else:
            st['answer'] = 'capabilities'; st['layers'] = re.findall(r'<Name>([^<]+)</Name>', b)[:20]
    except Exception as e:
        st['answer'] = 'unreachable'; st['detail'] = str(e)[:140]
    _MIT['st'] = st; return st


def plan(a, name, max_age_days):
    """Light runs: start from the published file, redo only projects whose pin changed or whose record is older than max_age_days
    (oldest first), and stop when the time budget is spent. Returns (projects to do, previous records kept)."""
    P = projects(a.only)
    try: prev = get(ORIGIN + '/data/' + name + '?run=%d' % time.time(), tries=2).get('projects') or {}
    except Exception: prev = {}
    if a.full: prev = {}
    pin = lambda p: '%.6f,%.6f' % (p['lat'], p['lng'])
    cut = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=max_age_days)).strftime('%Y-%m-%d')
    todo = [p for p in P if p['id'] not in prev or prev[p['id']].get('pin') != pin(p) or (prev[p['id']].get('checked') or '') < cut or not prev[p['id']].get('ok', True)]
    todo.sort(key=lambda p: (prev.get(p['id'], {}).get('checked') or ''))
    keep = {p['id']: prev[p['id']] for p in P if p['id'] in prev}
    for p in P: p['pin'] = pin(p)
    print(name, len(P), 'projects,', len(todo), 'to refresh', flush=True)
    return todo, keep


def run_rules(a):
    P, res = plan(a, 'land-rules.json', 28); t0 = time.time(); fails = {}
    if not P: print('nothing to refresh'); return
    for i, p in enumerate(P):
        if time.time() - t0 > a.budget: print('time budget reached, rest next run', flush=True); break
        r = {'checked': now(), 'acc': acc_m(p['dec']), 'pin': p['pin']}
        eu, es = p['co'] in EU, p['co'] == 'Spain'
        eng = p['co'] == 'United Kingdom' and p['mk'].lower() not in SCOTLAND
        r['scope'] = [s for s, on in (('n2k', eu), ('es', es), ('eng', eng), ('sco', p['co'] == 'United Kingdom' and not eng), ('osm', True)) if on]
        for key, on, fn in (('n2k', eu, natura), ('eng', eng, england), ('osm', True, osm_protected)):
            if not on: continue
            try: r[key] = fn(p)
            except Exception as e:
                r[key] = {'ok': False, 'why': str(e)[:100]}; fails[key] = fails.get(key, 0) + 1
            time.sleep(0.6)
        r['ok'] = all((r.get(k) or {}).get('ok', True) for k in ('n2k', 'eng', 'osm'))
        if es:
            try: r['es'] = {'ok': True, 'sea_m': sea_distance(p), 'mit': miteco_status().get('answer')}
            except Exception as e: r['es'] = {'ok': False, 'why': str(e)[:100], 'mit': miteco_status().get('answer')}
        res[p['id']] = r
        print(i + 1, len(P), p['id'], p['co'], ','.join(r['scope']), int(time.time() - t0), 's', flush=True)
    st = miteco_status() if any(p['co'] == 'Spain' for p in P) else None
    out = {'v': 1, 'updated': now(), 'seconds': int(time.time() - t0), 'radius_m': {'n2k': R_N2K, 'eng': R_UK, 'osm': R_OSM, 'es_sea': 1000},
           'selection': 'Named projects with a plot-level pin (same list as /data/construction-progress.json), Sumba excluded.',
           'failures': fails, 'refreshed': len([1 for v in res.values() if v.get('checked') == now()]),
           'sources': {
               'n2k': {'name': 'Natura 2000 sites (EEA, ProtectedSites/Natura2000Sites map service)', 'url': 'https://www.eea.europa.eu/en/datahub/datahubitem-view/6fc8ad2d-195d-40f4-bdec-576e7d1268e4',
                       'api': N2K, 'licence': 'EEA standard reuse policy (CC BY 4.0), (c) EEA, Copenhagen', 'licence_url': 'https://www.eea.europa.eu/en/legal-notice',
                       'viewer': 'https://natura2000.eea.europa.eu/', 'sdf': 'https://natura2000.eea.europa.eu/Natura2000/SDF.aspx?site='},
               'eng': {'name': 'Planning Data for England (MHCLG, planning.data.gov.uk)', 'url': 'https://www.planning.data.gov.uk/', 'api': PD + '/entity.json',
                       'licence': 'Open Government Licence v3.0', 'licence_url': 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/', 'datasets': PD_SETS},
               'osm': {'name': 'OpenStreetMap protected areas, nature reserves and national parks, read from OpenFreeMap vector tiles (OpenMapTiles schema, zoom 14)',
                       'url': 'https://www.openstreetmap.org/copyright', 'licence': 'ODbL, (c) OpenStreetMap contributors', 'build': _OFM.get('build')},
               'es': {'name': 'Spain, Ley de Costas (Ley 22/1988, de 28 de julio)', 'law': 'https://www.boe.es/buscar/act.php?id=BOE-A-1988-18762',
                      'viewer': 'https://gis.miteco.gob.es/web/dpmt/', 'downloads': 'https://www.miteco.gob.es/es/cartografia-y-sig/ide/descargas/costas-medio-marino/deslinde-dpmt.html',
                      'sea': 'OpenStreetMap sea (OpenMapTiles water class ocean), ODbL', 'miteco': st}},
           'not_used': {'WDPA (Protected Planet)': 'Its terms forbid commercial use without written permission from UNEP-WCMC.',
                        'MITECO deslinde files': 'The download page asks for a human check (a proof-of-work captcha), so a script cannot read it and we do not try to get around it.'},
           'projects': res}
    json.dump(out, open(a.out, 'w'), separators=(',', ':'), ensure_ascii=False)
    print('rules done', len(res), fails, os.path.getsize(a.out), 'bytes')


# ------------------------------------------------------------------------------------------------ OpenStreetMap history
OSM = 'https://api.openstreetmap.org/api/0.6'
ROADS = re.compile(r'^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|service|living_street|track|road|construction|pedestrian)(_link)?$')
LANDK = ('landuse', 'natural', 'leisure')
SKIP_NAT = {'coastline', 'tree_row', 'tree', 'ridge', 'cliff'}
SKIP_LEI = {'swimming_pool', 'pitch', 'playground', 'picnic_table', 'outdoor_seating', 'fitness_station', 'sunbathing'}


def cat(tags):
    if tags.get('building') and tags.get('building') != 'no': return 'b', 'building=' + tags['building']
    hw = tags.get('highway')
    if hw and ROADS.match(hw): return 'r', 'highway=' + hw
    for k in LANDK:
        v = tags.get(k)
        if v and not (k == 'natural' and v in SKIP_NAT) and not (k == 'leisure' and v in SKIP_LEI): return 'l', k + '=' + v
    return None, None


def first_versions(kind, ids):
    """version 1 timestamp of each way/relation, by multi-fetch (100 per call)."""
    out, ids = {}, list(ids)
    for i in range(0, len(ids), 100):
        chunk = ids[i:i + 100]
        def fetch(ch):
            try:
                d = get(OSM + '/%ss.json?%ss=%s' % (kind, kind, ','.join('%dv1' % x for x in ch)), timeout=60, tries=3)
                for e in d.get('elements') or []: out[e['id']] = e.get('timestamp')
            except urllib.error.HTTPError as e:   # a redacted version 1 fails the whole call: split
                if len(ch) > 1 and e.code in (403, 404, 410): fetch(ch[:len(ch) // 2]); fetch(ch[len(ch) // 2:])
        fetch(chunk); time.sleep(1.0)
    return out


def osm_history(p):
    L = Local(p['lat'], p['lng']); m = R_HIST + 20
    dy, dx = m / L.ky, m / L.kx
    d = get(OSM + '/map.json?bbox=%.6f,%.6f,%.6f,%.6f' % (p['lng'] - dx, p['lat'] - dy, p['lng'] + dx, p['lat'] + dy), timeout=120, tries=3)
    nodes = {e['id']: (e['lon'], e['lat']) for e in d['elements'] if e['type'] == 'node' and 'lon' in e}
    ways = {e['id']: e for e in d['elements'] if e['type'] == 'way'}
    keep = []
    def near(ns, closed):
        pts = [L.xy(*nodes[n]) for n in ns if n in nodes]
        if len(pts) < 2: return False, None
        best = min(seg_d(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]) for i in range(1, len(pts)))
        ins = closed and rings_eval([pts])[0]
        return (ins or best <= R_HIST), (0 if ins else best)
    for w in ways.values():
        c, tag = cat(w.get('tags') or {})
        if not c: continue
        ok, dm = near(w.get('nodes') or [], (w.get('nodes') or [None])[0] == (w.get('nodes') or [None])[-1])
        if ok: keep.append(('way', w, c, tag, dm))
    for r in [e for e in d['elements'] if e['type'] == 'relation']:
        c, tag = cat(r.get('tags') or {})
        if not c or (r.get('tags') or {}).get('type') not in ('multipolygon', 'building'): continue
        best = None
        for mb in r.get('members') or []:
            w = ways.get(mb.get('ref')) if mb.get('type') == 'way' else None
            if not w: continue
            ok, dm = near(w.get('nodes') or [], True)
            if ok: best = dm if best is None else min(best, dm)
        if best is not None: keep.append(('relation', r, c, tag, best))
    v1 = {}
    for kind in ('way', 'relation'):
        ids = [e['id'] for k, e, *_ in keep if k == kind and e.get('version', 1) > 1]
        v1[kind] = first_versions(kind, ids) if ids else {}
    items = []
    for kind, e, c, tag, dm in keep:
        last = (e.get('timestamp') or '')[:10]
        first = last if e.get('version', 1) == 1 else (v1[kind].get(e['id']) or '')[:10] or None
        items.append({'c': c, 'tag': tag[:60], 't': kind[0], 'id': e['id'], 'v': e.get('version', 1), 'first': first, 'last': last, 'd': r10(dm or 0),
                      'name': ((e.get('tags') or {}).get('name') or '')[:80] or None})
    def summ(c):
        L2 = [x for x in items if x['c'] == c]
        f = [x['first'] for x in L2 if x['first']]; l = [x['last'] for x in L2 if x['last']]
        yrs = {}
        for x in f: yrs[x[:4]] = yrs.get(x[:4], 0) + 1
        return {'n': len(L2), 'first': min(f) if f else None, 'last': max(l) if l else None, 'by_year': dict(sorted(yrs.items()))}
    land = sorted([x for x in items if x['c'] == 'l'], key=lambda x: (x['d'], x['first'] or '9'))[:8]
    land = [{k: x[k] for k in ('tag', 't', 'id', 'v', 'first', 'last', 'd', 'name')} for x in land]
    recent = sorted(items, key=lambda x: x['last'] or '', reverse=True)[:6]
    recent = [{k: x[k] for k in ('c', 'tag', 't', 'id', 'v', 'last', 'd')} for x in recent]
    cons = sorted([{k: x[k] for k in ('tag', 't', 'id', 'first', 'last', 'd')} for x in items if 'construction' in x['tag']], key=lambda x: x['first'] or '')[:6]
    return {'ok': True, 'b': summ('b'), 'r': summ('r'), 'l': summ('l'), 'land': land, 'recent': recent, 'cons': cons,
            'query': OSM + '/map.json?bbox=%.5f,%.5f,%.5f,%.5f' % (p['lng'] - dx, p['lat'] - dy, p['lng'] + dx, p['lat'] + dy)}


def run_osmhist(a):
    P, res = plan(a, 'map-history.json', 7); t0 = time.time(); fails = 0
    if not P: print('nothing to refresh'); return
    for i, p in enumerate(P):
        if time.time() - t0 > a.budget: print('time budget reached, rest next run', flush=True); break
        try: r = osm_history(p)
        except Exception as e:
            r = {'ok': False, 'why': str(e)[:100]}; fails += 1
        r['checked'] = now(); r['acc'] = acc_m(p['dec']); r['pin'] = p['pin']
        res[p['id']] = r
        print(i + 1, len(P), p['id'], r.get('ok'), (r.get('b') or {}).get('n'), int(time.time() - t0), 's', flush=True)
        time.sleep(1.5)
    out = {'v': 1, 'updated': now(), 'seconds': int(time.time() - t0), 'radius_m': R_HIST, 'failures': fails,
           'selection': 'Named projects with a plot-level pin (same list as /data/construction-progress.json), Sumba excluded.',
           'source': {'name': 'OpenStreetMap editing API 0.6 (current map within the circle, version 1 of each object)', 'url': 'https://www.openstreetmap.org/copyright',
                      'api': OSM, 'licence': 'ODbL, (c) OpenStreetMap contributors', 'licence_url': 'https://opendatacommons.org/licenses/odbl/1-0/'},
           'method': 'Objects counted: buildings (building=*), roads and tracks (highway=*, not footpaths) and land use areas (landuse, natural, leisure) with any part within 150 m of the pin, or containing it. First mapped is the date of version 1; last changed is the date of the current version. Objects deleted from the map are not counted. No user names or ids are kept.',
           'projects': res}
    json.dump(out, open(a.out, 'w'), separators=(',', ':'), ensure_ascii=False)
    print('osmhist done', len(res), 'failures', fails, os.path.getsize(a.out), 'bytes')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('what', choices=['rules', 'osmhist']); ap.add_argument('out'); ap.add_argument('--only', default='')
    ap.add_argument('--budget', type=int, default=780, help='seconds of work per run'); ap.add_argument('--full', action='store_true')
    a = ap.parse_args(); a.only = set(x for x in a.only.split(',') if x)
    (run_rules if a.what == 'rules' else run_osmhist)(a)


if __name__ == '__main__':
    main()
