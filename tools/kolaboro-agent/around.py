#!/usr/bin/env python3
"""Kolaboro "Around the site": nearest beach, coastline, airport, runway end, hospital, school, supermarket and public transport
stop for each project with a reliable pin, measured in a straight line on OpenStreetMap data (ODbL).

Usage: around.py LAND_RULES_JSON OUT_JSON [PREVIOUS_OUT_JSON]
Pins: the same set as /data/land-rules.json (project records with coordinates of 3+ decimals, not shared, not an area centre).
Source: OpenFreeMap vector tiles (OpenMapTiles schema; weekly build of the OpenStreetMap planet). No key, no account, no model calls.
Incremental: a project whose pin is unchanged and whose record was built from the same planet build is copied from PREVIOUS_OUT_JSON.
"""
import json, sys, time, math, re
from shapely.geometry import Point
from shapely.ops import transform, nearest_points
import around_tiles as o

STOP = {('bus', 'bus_stop'): 'bus_stop', ('bus', 'bus_station'): 'bus_station', ('railway', 'station'): 'station', ('railway', 'halt'): 'station',
        ('railway', 'tram_stop'): 'tram_stop', ('railway', 'subway'): 'subway', ('ferry_terminal', 'ferry_terminal'): 'ferry'}
CAT = {('hospital', 'hospital'): 'hospital', ('school', 'school'): 'school', ('grocery', 'supermarket'): 'supermarket'}
RAIL = ('station', 'tram_stop', 'subway')


META = {
    'source': {'name': 'OpenStreetMap contributors', 'licence': 'ODbL 1.0', 'licence_url': 'https://www.openstreetmap.org/copyright',
               'via': 'OpenFreeMap vector tiles (OpenMapTiles schema), weekly build of the OpenStreetMap planet', 'via_url': 'https://openfreemap.org/'},
    'selection': 'Projects with a reliable pin: the same set as /data/land-rules.json (coordinates with 3 or more decimals in the project record, not shared with another project, not the centre of an area).',
    'method': 'Straight-line (great-circle) distance from the pin. Hospital (amenity=hospital), school (amenity=school), supermarket (shop=supermarket) and public transport stops (bus stop or station, rail station or halt, tram stop, metro station, ferry terminal): zoom 14 tiles in growing rings around the pin until the nearest one lies inside the fully covered radius (up to about 7 to 10 km). Beach (natural=beach areas) and sea (the area seaward of the OpenStreetMap coastline): nearest edge, zoom 14 then 12 then, for the sea, 10. Runway ends: ends of aeroway=runway lines within the covered radius (at least 6 km); u5 is 1 when the nearest end is under 5 km. Airport: the nearest aerodrome with an IATA code within about 150 km.',
    'limits': 'Volunteer-drawn map data: a place can be missing, closed or wrongly tagged. Distances are straight lines, not routes. The pin is accurate to about acc metres. A runway can belong to a small private or military airfield (k and n say which label is nearest).',
    'fields': {'d': 'metres from the pin', 'll': '[lat, lng] of the place (for areas: the nearest point)', 'n': 'name (Latin script when the map has one)', 'nl': 'local name', 'k': 'kind', 'none': 'nothing mapped within this many km', 'in': 'the pin falls inside the area',
               'rail': 'nearest rail, metro or tram stop (same: it is the nearest stop)', 'airport2': 'second nearest airport with an IATA code', 'aq': 'yearly mean PM2.5 and NO2 in micrograms per cubic metre (see air)'},
}


def nm(p):
    n = p.get('name_en') or p.get('name:latin') or p.get('name_int') or p.get('name') or None
    loc = p.get('name') or None
    if n: n = ' '.join(str(n).split())[:90]
    if loc: loc = ' '.join(str(loc).split())[:90]
    return n, (loc if loc and loc != n else None)


def r5(x): return round(x, 5)


def poly_near(lat, lng, z, ring, layer, test, cache):
    """Nearest point of the matching polygons to the pin: (metres, [lat, lng], inside) or None."""
    L = o.local(lat, lng); best = None
    for ln, p, g, f, ext in o.features(lat, lng, z, ring, [layer]):
        if not test(p) or g.geom_type not in ('Polygon', 'MultiPolygon'): continue
        try:
            g2 = transform(L, transform(f, g))
            if not g2.is_valid: g2 = g2.buffer(0)
            if g2.is_empty: continue
            d = g2.distance(Point(0, 0))
        except Exception: continue
        if best is None or d < best[0]:
            q = nearest_points(g2, Point(0, 0))[0]
            best = (d, [r5(lat + q.y / 110574.0), r5(lng + q.x / (111320.0 * math.cos(math.radians(lat))))], d == 0)
    return best


def air(lat, lng):
    """Runway ends and airports near the pin: {'runway': ..., 'airport': ..., 'airport2': ...}."""
    out = {}
    # ---- runway ends: z12; a line end inside the tile is a real end, one outside it was cut at the tile edge
    ring = 1 if o.covered_km(lat, lng, 12, 1) >= 6 else 2
    cv = o.covered_km(lat, lng, 12, ring); best = None
    for ln, p, g, f, ext in o.features(lat, lng, 12, ring, ['aeroway']):
        if p.get('class') != 'runway': continue
        lines = [g] if g.geom_type == 'LineString' else list(g.geoms) if g.geom_type == 'MultiLineString' else []
        for l in lines:
            cs = list(l.coords)
            for px, py in (cs[0][:2], cs[-1][:2]):
                if not (0 <= px <= ext and 0 <= py <= ext): continue
                lon, la = f(px, py); d = o.km(lat, lng, la, lon) * 1000
                if best is None or d < best['d']:
                    mp = l.interpolate(0.5, normalized=True); mlon, mla = f(mp.x, mp.y)
                    best = {'d': round(d), 'll': [r5(la), r5(lon)], '_mid': (mla, mlon)}
                    if p.get('ref'): best['ref'] = str(p['ref'])[:20]
    out['runway'] = best if best and best['d'] <= cv * 1000 else {'none': round(cv, 1)}
    # ---- airports: every aerodrome label at z10 (about 40 km around) and z8 (about 150 km); the nearest with an IATA code is "the airport"
    labels = {}; cv = o.covered_km(lat, lng, 8, 1)
    for z in (10, 8):
        for ln, p, g, f, ext in o.features(lat, lng, z, 1, ['aerodrome_label']):
            if g.geom_type != 'Point': continue
            lon, la = f(g.x, g.y); n, loc = nm(p)
            key = (p.get('iata') or p.get('icao') or n or '') + '|' + str(round(la, 2)) + ',' + str(round(lon, 2))
            if key not in labels: labels[key] = {'d': round(o.km(lat, lng, la, lon) * 1000), 'll': [r5(la), r5(lon)], 'iata': (str(p['iata'])[:4] if p.get('iata') else None), 'icao': (str(p['icao'])[:4] if p.get('icao') else None), 'k': p.get('class'), 'n': n, 'nl': loc}
    ap = sorted([a for a in labels.values() if a['iata'] and a['d'] <= cv * 1000], key=lambda a: a['d'])
    seen = set(); ap = [a for a in ap if not (a['iata'] in seen or seen.add(a['iata']))]
    out['airport'] = {k: v for k, v in ap[0].items() if v is not None and k != 'icao'} if ap else {'none': round(cv)}
    if len(ap) > 1 and not re.search(r'air force|air base|airbase|naval|military|army|RAF\b', ap[1]['n'] or '', re.I): out['airport2'] = {k: v for k, v in ap[1].items() if v is not None and k not in ('icao', 'k', 'nl')}   # the second nearest: the nearest can be a small field
    if 'd' in out['runway']:
        # which airfield the runway belongs to, judged from the middle of the runway: the nearest label with an IATA or ICAO code within
        # 4 km; else an airport with an IATA code within 6 km; else any label within 4 km (a label without a code can be a hangar or an office)
        mid = out['runway'].pop('_mid'); near = None
        for test, reach in ((lambda a: a['iata'] or a['icao'], 4), (lambda a: a['iata'], 6), (lambda a: True, 4)):
            for a in labels.values():
                if not test(a): continue
                d = o.km(mid[0], mid[1], a['ll'][0], a['ll'][1])
                if d <= reach and (near is None or d < near[0]): near = (d, a)
            if near: break
        if near:
            if near[1]['n']: out['runway']['n'] = near[1]['n']
            if near[1]['iata']: out['runway']['iata'] = near[1]['iata']
        out['runway']['u5'] = 1 if out['runway']['d'] < 5000 else 0
    return out


def one(lat, lng):
    out = {}
    # ---- points of interest: z14, growing rings until the nearest of each kind lies inside the fully covered radius
    want = ['hospital', 'school', 'supermarket', 'stop', 'rail']
    found = {}; cov = 0
    for ring in (1, 2, 3, 4):
        cov = o.covered_km(lat, lng, 14, ring); found = {}
        for ln, p, g, f, ext in o.features(lat, lng, 14, ring, ['poi']):
            if g.geom_type != 'Point': continue
            key = (p.get('class'), p.get('subclass')); kinds = []
            if key in CAT: kinds.append(CAT[key])
            if key in STOP:
                kinds.append('stop')
                if STOP[key] in RAIL: kinds.append('rail')
            if not kinds: continue
            lon, la = f(g.x, g.y); d = o.km(lat, lng, la, lon) * 1000
            for kd in kinds:
                if kd not in found or d < found[kd]['d']:
                    n, loc = nm(p); rec = {'d': round(d), 'll': [r5(la), r5(lon)]}
                    if n: rec['n'] = n
                    if loc: rec['nl'] = loc
                    if kd in ('stop', 'rail'): rec['k'] = STOP[key]
                    found[kd] = rec
        if all(k in found and found[k]['d'] <= cov * 1000 for k in want if k != 'rail'): break
    for k in want:
        if k in found and found[k]['d'] <= cov * 1000: out[k] = found[k]
        else: out[k] = {'none': round(cov, 1)}
    if 'd' in out['rail'] and 'd' in out['stop'] and out['rail']['d'] == out['stop']['d']: out['rail'] = {'same': 1}
    # ---- beach and sea: z14 ring 1, then z12 ring 1, then (sea only) z10 ring 1
    isb = lambda p: p.get('class') == 'sand' and p.get('subclass') == 'beach'
    iso = lambda p: p.get('class') == 'ocean'
    for name, layer, test, steps in (('beach', 'landcover', isb, ((14, 1), (12, 1))), ('coast', 'water', iso, ((14, 1), (12, 1), (10, 1)))):
        res = None; cv = 0
        for z, ring in steps:
            cv = o.covered_km(lat, lng, z, ring); b = poly_near(lat, lng, z, ring, layer, test, None)
            if b and b[0] <= cv * 1000: res = {'d': round(b[0]), 'll': b[1]}; res.update({'in': 1} if b[2] else {}); break
        out[name] = res or {'none': round(cv, 1)}
    out.update(air(lat, lng))
    return out


def main(lr_path, out_path, prev_path=None):
    lr = json.load(open(lr_path))['projects']
    prev = {}
    if prev_path:
        try: prev = json.load(open(prev_path))
        except Exception: prev = {}
    pb = prev.get('osm_build'); pp = prev.get('projects') or {}
    build = o.build(); t0 = time.time(); P = {}; fails = []; reused = 0
    for i, (pid, v) in enumerate(sorted(lr.items())):
        pin = v.get('pin')
        if not pin: continue
        if pid in pp and pp[pid].get('pin') == pin and pb == build and not pp[pid].get('err'):
            P[pid] = pp[pid]; reused += 1; continue
        lat, lng = [float(x) for x in pin.split(',')]
        try:
            rec = one(lat, lng); rec['pin'] = pin; rec['acc'] = v.get('acc') or 100
            if pid in pp and pp[pid].get('pin') == pin and pp[pid].get('aq'): rec['aq'] = pp[pid]['aq']
            P[pid] = rec
        except Exception as e:
            fails.append(pid); print('FAIL', pid, repr(e)[:200], flush=True)
        if i % 10 == 0: print(i, pid, o.STATS, round(time.time() - t0), flush=True)
    out = dict(prev) if prev else {}
    out.update(META)
    out.update({'v': 1, 'updated': time.strftime('%Y-%m-%d', time.gmtime()), 'osm_build': build, 'projects': P, 'failures': fails,
                'stats': {'projects': len(P), 'reused': reused, 'tiles_fetched': o.STATS['fetched'], 'seconds': round(time.time() - t0)}})
    json.dump(out, open(out_path, 'w'), ensure_ascii=False, separators=(',', ':'))
    print('done', out['stats'], len(fails))


if __name__ == '__main__':
    main(*sys.argv[1:4])
