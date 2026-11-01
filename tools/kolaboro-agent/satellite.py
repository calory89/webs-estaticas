#!/usr/bin/env python3
"""Kolaboro satellite watch. Sentinel-2 L2A (Copernicus Data Space) cloud-free dry-season composites per site,
vegetation (NDVI) per period and the share of land cleared since the first period. Writes PNGs + satellite.json.
Usage: satellite.py SITES.json OUTDIR   (env CDSE_CLIENT_ID, CDSE_CLIENT_SECRET)"""
import json, os, sys, io, math, tarfile, datetime, urllib.request, urllib.parse
from PIL import Image

TOKEN_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token'
PROCESS_URL = 'https://sh.dataspace.copernicus.eu/api/v1/process'
HALF = 0.005   # ~1.1 km box
PX = 240
EV = """//VERSION=3
function setup(){return{input:[{bands:["B02","B03","B04","B08","SCL","dataMask"]}],output:[{id:"default",bands:4,sampleType:"UINT8"},{id:"ndvi",bands:1,sampleType:"UINT8"}],mosaicking:"ORBIT"}}
function ok(s){return s.dataMask==1 && [3,8,9,10,11].indexOf(s.SCL)<0}
function med(a){a.sort(function(x,y){return x-y});return a[Math.floor(a.length/2)]}
function evaluatePixel(ss){var r=[],g=[],b=[],n=[];for(var i=0;i<ss.length;i++){var s=ss[i];if(ok(s)){r.push(s.B04);g.push(s.B03);b.push(s.B02);n.push((s.B08-s.B04)/(s.B08+s.B04+1e-6))}}
 if(!r.length)return{default:[0,0,0,0],ndvi:[0]};
 var R=med(r),G=med(g),B=med(b),N=med(n);
 return{default:[Math.min(255,R*2.8*255),Math.min(255,G*2.8*255),Math.min(255,B*2.8*255),255],ndvi:[Math.max(1,Math.min(255,(N+0.2)/1.2*255))]}}"""

def token():
    d = urllib.parse.urlencode({'grant_type': 'client_credentials', 'client_id': os.environ['CDSE_CLIENT_ID'], 'client_secret': os.environ['CDSE_CLIENT_SECRET']}).encode()
    return json.load(urllib.request.urlopen(TOKEN_URL, d, timeout=60))['access_token']

def fetch(tok, lat, lng, a, b):
    dx = HALF / math.cos(math.radians(lat))
    body = {"input": {"bounds": {"bbox": [lng - dx, lat - HALF, lng + dx, lat + HALF], "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}},
                      "data": [{"type": "sentinel-2-l2a", "dataFilter": {"timeRange": {"from": a + "T00:00:00Z", "to": b + "T23:59:59Z"}, "maxCloudCoverage": 60}}]},
            "output": {"width": PX, "height": PX, "responses": [{"identifier": "default", "format": {"type": "image/png"}}, {"identifier": "ndvi", "format": {"type": "image/png"}}]},
            "evalscript": EV}
    r = urllib.request.Request(PROCESS_URL, json.dumps(body).encode(), {'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/json', 'Accept': 'application/tar'})
    x = urllib.request.urlopen(r, timeout=180)
    pu = float(x.headers.get('x-processingunits-spent') or 0)
    t = tarfile.open(fileobj=io.BytesIO(x.read()))
    o = {m.name: t.extractfile(m).read() for m in t.getmembers()}
    return Image.open(io.BytesIO(o['default.png'])).convert('RGBA'), Image.open(io.BytesIO(o['ndvi.png'])).convert('L'), pu

def periods(today):
    out = []
    for y in range(2023, today.year + 1):
        a, b = datetime.date(y, 4, 1), min(datetime.date(y, 9, 30), today)
        if (b - a).days >= 60: out.append((f'{y} dry season', f'dry{y}', a.isoformat(), b.isoformat()))
    a = today - datetime.timedelta(days=120)
    out.append(('Last 120 days', 'latest', a.isoformat(), today.isoformat()))
    return out

def main():
    sites = json.load(open(sys.argv[1]))['sites']; outdir = sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    tok = token(); today = datetime.date.today(); total_pu = 0; res = []
    for s in sites:
        sd = os.path.join(outdir, s['id']); os.makedirs(sd, exist_ok=True)
        base = None; prev = None; ps = []
        for label, key, a, b in periods(today):
            try: rgb, ndvi, pu = fetch(tok, s['lat'], s['lng'], a, b)
            except Exception as e: print('fail', s['id'], key, e); continue
            total_pu += pu
            nd = list(ndvi.getdata()); valid = [v for v in nd if v > 0]
            if len(valid) < 0.5 * len(nd): print('too cloudy', s['id'], key); continue
            veg = sum(1 for v in valid if v > 140) / len(valid)
            rgb.convert('RGB').save(os.path.join(sd, key + '.jpg'), quality=86)
            p = {'label': label, 'key': key, 'from': a, 'to': b, 'vegetation_pct': round(veg * 100, 1), 'clear_pct': round(len(valid) / len(nd) * 100)}
            seasonal = key.startswith('dry')
            if base is not None and seasonal:
                cleared = [1 if (x > 0 and y > 0 and x - y > 45) else 0 for x, y in zip(base, nd)]
                p['cleared_since_first_pct'] = round(sum(cleared) / len(nd) * 100, 1)
                ov = Image.new('RGBA', ndvi.size, (0, 0, 0, 0)); ov.putdata([(255, 91, 20, 170) if c else (0, 0, 0, 0) for c in cleared])
                ov.save(os.path.join(sd, key + '-change.png'), optimize=True)
            if prev is not None and seasonal:
                p['changed_since_previous_pct'] = round(sum(1 for x, y in zip(prev, nd) if x > 0 and y > 0 and abs(x - y) > 45) / len(nd) * 100, 1)
            if base is None: base = nd
            if seasonal: prev = nd
            ps.append(p); print(s['id'], key, p, round(pu, 1))
        dry = [p for p in ps if p['key'].startswith('dry')]
        latest = dry[-1] if dry else {}
        res.append({'id': s['id'], 'kind': s['kind'], 'label': s['label'], 'lat': s['lat'], 'lng': s['lng'], 'box_km': round(HALF * 2 * 111, 1), 'periods': ps,
                    'activity': 'active' if latest.get('changed_since_previous_pct', 0) >= 3 else 'quiet'})
    json.dump({'updated': today.isoformat(), 'source': 'Copernicus Sentinel-2 L2A, Copernicus Data Space Ecosystem', 'processing_units': round(total_pu, 1), 'sites': res},
              open(os.path.join(outdir, 'satellite.json'), 'w'), indent=1)
    print('done PU', round(total_pu, 1))


def projects_mode(pfiles, out):
    """Private: change on each project site between the same 120-day window a year ago and the last 120 days.
    Writes only per-slug numbers (no images, never published with coordinates)."""
    global HALF, PX
    HALF, PX = 0.0018, 48
    P = []
    for f in pfiles:
        P += json.load(open(f))['projects']
    today = datetime.date.today()
    win = [('then', (today - datetime.timedelta(days=485)).isoformat(), (today - datetime.timedelta(days=365)).isoformat()),
           ('now', (today - datetime.timedelta(days=120)).isoformat(), today.isoformat())]
    tok = token(); res = {}; pu_total = 0
    for p in P:
        fx = p.get('facts') or {}; st = str(p.get('stage') or '').lower()
        try: lat, lng = float(fx.get('lat')), float(fx.get('lng'))
        except (TypeError, ValueError): continue
        if 'complet' in st: continue
        imgs = {}
        for key, a, b in win:
            try: rgb, nd, pu = fetch(tok, lat, lng, a, b); pu_total += pu; imgs[key] = (rgb, list(nd.getdata()))
            except Exception as e: print('fail', p.get('slug'), key, str(e)[:80])
        if len(imgs) < 2: continue
        n0, n1 = imgs['then'][1], imgs['now'][1]
        both = [(x, y) for x, y in zip(n0, n1) if x > 0 and y > 0]
        if len(both) < 0.5 * len(n0):
            res[p['slug']] = {'status': 'too cloudy', 'date': today.isoformat()}; continue
        lum = lambda im: [sum(px[:3]) / 3 for px in im.getdata()]
        l0, l1 = lum(imgs['then'][0]), lum(imgs['now'][0])
        ch = sum(1 for (x, y), a, b in zip(zip(n0, n1), l0, l1) if x > 0 and y > 0 and (abs(x - y) > 40 or abs(a - b) > 35)) / len(both)
        res[p['slug']] = {'status': 'visible change' if ch >= 0.06 else 'no visible change', 'changed_pct': round(ch * 100, 1), 'date': today.isoformat()}
        print(p['slug'], res[p['slug']])
    json.dump({'updated': today.isoformat(), 'method': 'Sentinel-2 L2A median composites, ~400 m box, same 120-day window a year apart; change = NDVI or brightness shift on 6%+ of clear pixels', 'processing_units': round(pu_total, 1), 'sites': res},
              open(out, 'w'), indent=1)
    print('projects done', len(res), 'PU', round(pu_total, 1))

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--projects':
        projects_mode(sys.argv[2:-1], sys.argv[-1])
    else:
        main()
