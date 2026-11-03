#!/usr/bin/env python3
"""Kolaboro satellite watch. Sentinel-2 L2A (Copernicus Data Space) cloud-free dry-season composites per site,
vegetation (NDVI) per period and the share of land cleared since the first period. Writes PNGs + satellite.json.
Plus Sentinel-1 GRD radar (sees through clouds): median VV backscatter in dB per period and its change since the first period.
Usage: satellite.py SITES.json OUTDIR   (env CDSE_CLIENT_ID, CDSE_CLIENT_SECRET)"""
import json, os, sys, io, math, time, tarfile, datetime, concurrent.futures, urllib.request, urllib.parse, urllib.error
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

# Sentinel-1 GRD (IW, VV+VH, orthorectified sigma0). Per pixel: median over the acquisitions of the window.
# vv/vh are encoded as UINT16 = round((dB + 40) * 1000), 0 = no data. n = acquisitions used at that pixel.
RPX = 112      # ~10 m pixels over the same ~1.1 km box
RADAR_WORKERS = 4
RADAR_BUDGET_S = 18 * 60
EV_S1 = """//VERSION=3
function setup(){return{input:[{bands:["VV","VH","dataMask"]}],output:[{id:"vv",bands:1,sampleType:"UINT16"},{id:"vh",bands:1,sampleType:"UINT16"},{id:"n",bands:1,sampleType:"UINT8"},{id:"img",bands:1,sampleType:"UINT8"}],mosaicking:"ORBIT"}}
function med(a){a.sort(function(x,y){return x-y});return a[Math.floor(a.length/2)]}
function db(v){return 10*Math.log(v)/Math.LN10}
function enc(v){if(!(v>0))return 0;return Math.max(1,Math.min(65535,Math.round((db(v)+40)*1000)))}
function evaluatePixel(ss){var v=[],h=[];for(var i=0;i<ss.length;i++){var s=ss[i];if(s.dataMask==1&&s.VV>0){v.push(s.VV);h.push(s.VH)}}
 if(!v.length)return{vv:[0],vh:[0],n:[0],img:[0]};
 var V=med(v),H=med(h);
 return{vv:[enc(V)],vh:[enc(H)],n:[Math.min(255,v.length)],img:[Math.max(1,Math.min(255,Math.round((db(V)+25)/27*254)))]}}"""

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

def fetch_s1(tok, lat, lng, a, b):
    dx = HALF / math.cos(math.radians(lat))
    body = {"input": {"bounds": {"bbox": [lng - dx, lat - HALF, lng + dx, lat + HALF], "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}},
                      "data": [{"type": "sentinel-1-grd",
                                "dataFilter": {"timeRange": {"from": a + "T00:00:00Z", "to": b + "T23:59:59Z"}, "acquisitionMode": "IW", "polarization": "DV", "resolution": "HIGH"},
                                "processing": {"backCoeff": "SIGMA0_ELLIPSOID", "orthorectify": True, "demInstance": "COPERNICUS"}}]},
            "output": {"width": RPX, "height": RPX, "responses": [{"identifier": k, "format": {"type": "image/png"}} for k in ("vv", "vh", "n", "img")]},
            "evalscript": EV_S1}
    r = urllib.request.Request(PROCESS_URL, json.dumps(body).encode(), {'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/json', 'Accept': 'application/tar'})
    x = urllib.request.urlopen(r, timeout=150)
    pu = float(x.headers.get('x-processingunits-spent') or 0)
    t = tarfile.open(fileobj=io.BytesIO(x.read()))
    o = {m.name: t.extractfile(m).read() for m in t.getmembers()}
    im = lambda k: Image.open(io.BytesIO(o[k + '.png']))
    return list(im('vv').getdata()), list(im('vh').getdata()), list(im('n').convert('L').getdata()), im('img').convert('L'), pu

def _median(a):
    a = sorted(a); return a[len(a) // 2] if a else None

def _db_median(vals, idx=None):
    it = vals if idx is None else (vals[i] for i in idx)
    m = _median([v for v in it if v > 0])
    return None if m is None else round(m / 1000.0 - 40, 2)

def plot_index(s):
    """Pixel indices of a ~60 m box around the site's plot point, if it has one inside the box."""
    pl = s.get('plot') or {}
    try: plat, plng = float(pl.get('lat', s.get('plot_lat'))), float(pl.get('lng', s.get('plot_lng')))
    except (TypeError, ValueError): return None
    dx = HALF / math.cos(math.radians(s['lat']))
    r = int(round((s['lat'] + HALF - plat) / (2 * HALF) * RPX)); c = int(round((plng - (s['lng'] - dx)) / (2 * dx) * RPX))
    h = 3  # 7 x 7 px at ~10 m = ~60-70 m
    if not (h <= r < RPX - h and h <= c < RPX - h): return None
    return [i * RPX + j for i in range(r - h, r + h + 1) for j in range(c - h, c + h + 1)]

def radar_site(tok_box, s, sd, pers, deadline):
    """Sentinel-1 per period for one site. Never raises; returns (radar dict or None, PU spent)."""
    pu_sum = 0.0; out = []; pidx = plot_index(s)
    for label, key, a, b in pers:
        if time.time() > deadline: print('radar budget reached', s['id'], key); break
        res = None
        for attempt in range(3):
            try:
                res = fetch_s1(tok_box[0], s['lat'], s['lng'], a, b); break
            except urllib.error.HTTPError as e:
                if e.code == 401:
                    try: tok_box[0] = token()
                    except Exception: pass
                elif e.code == 429: time.sleep(10 * (attempt + 1))
                else: print('radar fail', s['id'], key, e.code, e.read()[:200]); break
            except Exception as e:
                print('radar fail', s['id'], key, str(e)[:120]); time.sleep(3)
        if not res: continue
        vv, vh, n, img, pu = res; pu_sum += pu
        acq = max(n) if n else 0
        cov = sum(1 for v in vv if v > 0) / len(vv)
        if acq == 0 or cov < 0.5: print('radar no data', s['id'], key, acq, round(cov, 2)); continue
        p = {'key': key, 'label': label, 'from': a, 'to': b, 'acquisitions': acq, 'vv_db': _db_median(vv), 'vh_db': _db_median(vh), 'covered_pct': round(cov * 100)}
        if pidx:
            p['plot_vv_db'] = _db_median(vv, pidx)
        try: img.save(os.path.join(sd, key + '-radar.png'), optimize=True); p['image'] = True
        except Exception as e: print('radar png fail', s['id'], key, e)
        out.append(p); print('radar', s['id'], key, p, round(pu, 2))
    if not out: return None, pu_sum
    r = {'source': 'Copernicus Sentinel-1 GRD, IW mode, VV+VH, sigma0, orthorectified (Copernicus DEM)', 'periods': out}
    if len(out) >= 2 and out[0]['vv_db'] is not None and out[-1]['vv_db'] is not None:
        r['radar_change_db'] = round(out[-1]['vv_db'] - out[0]['vv_db'], 2)
        r['change_from'] = out[0]['key']; r['change_to'] = out[-1]['key']
        if out[0].get('plot_vv_db') is not None and out[-1].get('plot_vv_db') is not None:
            r['plot_radar_change_db'] = round(out[-1]['plot_vv_db'] - out[0]['plot_vv_db'], 2)
        dry = [p for p in out if p['key'].startswith('dry')]
        if len(dry) >= 2: r['dry_season_change_db'] = round(dry[-1]['vv_db'] - dry[0]['vv_db'], 2)
    return r, pu_sum

def add_radar(sites, res, outdir, today):
    """Adds 'radar' to each result site. Failures are logged and leave the Sentinel-2 results untouched."""
    t0 = time.time(); deadline = t0 + RADAR_BUDGET_S; pers = periods(today)
    try: tok_box = [token()]
    except Exception as e: print('radar token fail', e); return 0.0
    byid = {r['id']: r for r in res}; total = 0.0
    def job(s):
        try: return s['id'], radar_site(tok_box, s, os.path.join(outdir, s['id']), pers, deadline)
        except Exception as e: print('radar site fail', s['id'], str(e)[:160]); return s['id'], (None, 0.0)
    with concurrent.futures.ThreadPoolExecutor(RADAR_WORKERS) as ex:
        for sid, (r, pu) in ex.map(job, sites):
            total += pu
            if r and sid in byid: byid[sid]['radar'] = r
    ok = sum(1 for r in res if 'radar' in r)
    print('radar done: sites', ok, 'of', len(res), 'PU', round(total, 1), 'seconds', round(time.time() - t0))
    return total

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
    print('optical done PU', round(total_pu, 1))
    radar_pu = 0.0
    if os.environ.get('KOLABORO_NO_RADAR') != '1':
        try: radar_pu = add_radar(sites, res, outdir, today)
        except Exception as e: print('radar phase fail', str(e)[:200])
    has_radar = any('radar' in r for r in res)
    out = {'updated': today.isoformat(),
           'source': 'Copernicus Sentinel-2 L2A' + (' and Sentinel-1 GRD' if has_radar else '') + ', Copernicus Data Space Ecosystem',
           'processing_units': round(total_pu + radar_pu, 1), 'sites': res}
    if has_radar:
        out['processing_units_optical'] = round(total_pu, 1); out['processing_units_radar'] = round(radar_pu, 1)
        out['radar_method'] = 'Sentinel-1 GRD IW, VV+VH sigma0 orthorectified, per-pixel median over all acquisitions in the window, then median VV in dB over the box. radar_change_db = latest window minus first window. Built structures usually raise VV backscatter; wet ground, crops and viewing geometry also move it.'
    json.dump(out, open(os.path.join(outdir, 'satellite.json'), 'w'), indent=1)
    print('done PU', round(total_pu + radar_pu, 1))


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
