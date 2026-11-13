#!/usr/bin/env python3
"""Kolaboro satellite watch for client plots.
For every paid case with a plot on the map: Sentinel-2 L2A median composite of the last 60 days vs the same 60 days a year earlier,
vegetation (NDVI) inside the plot (or 40 m around the pin), share of the plot cleared, a before/after/change image.
If the last 60 days are too cloudy, falls back to Sentinel-1 radar (VV backscatter), which sees through clouds.
Results go into the client's case as sealed evidence through the kolaboro_machine RPC; the database emails the client on change.
Env: CDSE_CLIENT_ID, CDSE_CLIENT_SECRET, KB_MACHINE_KEY"""
import json, os, io, math, tarfile, datetime, urllib.request, urllib.parse, base64
from PIL import Image, ImageDraw

SB = 'https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/'
AK = 'sb_publishable_WWMM9pbZfP4hJosLJlTobg_lWFGoJ3X'
TOKEN_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token'
PROCESS_URL = 'https://sh.dataspace.copernicus.eu/api/v1/process'
HALF = 0.0027  # ~300 m each way
PX = 64        # ~9.4 m per pixel
S2 = """//VERSION=3
function setup(){return{input:[{bands:["B02","B03","B04","B08","SCL","dataMask"]}],output:[{id:"default",bands:4,sampleType:"UINT8"},{id:"ndvi",bands:1,sampleType:"UINT8"}],mosaicking:"ORBIT"}}
function ok(s){return s.dataMask==1 && [3,8,9,10,11].indexOf(s.SCL)<0}
function med(a){a.sort(function(x,y){return x-y});return a[Math.floor(a.length/2)]}
function evaluatePixel(ss){var r=[],g=[],b=[],n=[];for(var i=0;i<ss.length;i++){var s=ss[i];if(ok(s)){r.push(s.B04);g.push(s.B03);b.push(s.B02);n.push((s.B08-s.B04)/(s.B08+s.B04+1e-6))}}
 if(!r.length)return{default:[0,0,0,0],ndvi:[0]};
 return{default:[Math.min(255,med(r)*2.8*255),Math.min(255,med(g)*2.8*255),Math.min(255,med(b)*2.8*255),255],ndvi:[Math.max(1,Math.min(255,(med(n)+0.2)/1.2*255))]}}"""
S1 = """//VERSION=3
function setup(){return{input:[{bands:["VV","dataMask"]}],output:{bands:1,sampleType:"UINT8"},mosaicking:"ORBIT"}}
function med(a){a.sort(function(x,y){return x-y});return a[Math.floor(a.length/2)]}
function evaluatePixel(ss){var v=[];for(var i=0;i<ss.length;i++){if(ss[i].dataMask==1&&ss[i].VV>0)v.push(ss[i].VV)}if(!v.length)return[0];var db=10*Math.log(med(v))/Math.LN10;return[Math.max(1,Math.min(255,(db+25)*255/25))]}"""

def rpc(fn, body):
    r = urllib.request.Request(SB + fn, json.dumps(body).encode(), {'apikey': AK, 'Authorization': 'Bearer ' + AK, 'Content-Type': 'application/json'})
    return json.load(urllib.request.urlopen(r, timeout=120))

def token():
    d = urllib.parse.urlencode({'grant_type': 'client_credentials', 'client_id': os.environ['CDSE_CLIENT_ID'], 'client_secret': os.environ['CDSE_CLIENT_SECRET']}).encode()
    return json.load(urllib.request.urlopen(TOKEN_URL, d, timeout=60))['access_token']

def bbox(lat, lng):
    dx = HALF / math.cos(math.radians(lat)); return [lng - dx, lat - HALF, lng + dx, lat + HALF]

def process(tok, lat, lng, a, b, kind):
    data = {"type": "sentinel-2-l2a", "dataFilter": {"timeRange": {"from": a + "T00:00:00Z", "to": b + "T23:59:59Z"}, "maxCloudCoverage": 70}} if kind == 's2' else \
           {"type": "sentinel-1-grd", "dataFilter": {"timeRange": {"from": a + "T00:00:00Z", "to": b + "T23:59:59Z"}, "acquisitionMode": "IW", "polarization": "DV"}, "processing": {"backCoeff": "GAMMA0_TERRAIN", "orthorectify": True}}
    resp = [{"identifier": "default", "format": {"type": "image/png"}}] + ([{"identifier": "ndvi", "format": {"type": "image/png"}}] if kind == 's2' else [])
    body = {"input": {"bounds": {"bbox": bbox(lat, lng), "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}}, "data": [data]},
            "output": {"width": PX, "height": PX, "responses": resp}, "evalscript": S2 if kind == 's2' else S1}
    r = urllib.request.Request(PROCESS_URL, json.dumps(body).encode(), {'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/json', 'Accept': 'application/tar'})
    t = tarfile.open(fileobj=io.BytesIO(urllib.request.urlopen(r, timeout=180).read()))
    o = {m.name: t.extractfile(m).read() for m in t.getmembers()}
    if kind == 's2': return Image.open(io.BytesIO(o['default.png'])).convert('RGBA'), Image.open(io.BytesIO(o['ndvi.png'])).convert('L')
    return Image.open(io.BytesIO(o['default.png'])).convert('L'), None

def mask(case):
    """pixels inside the traced plot, or within 40 m of the pin"""
    lat, lng = case['lat'], case['lng']; bb = bbox(lat, lng)
    m = Image.new('L', (PX, PX), 0); d = ImageDraw.Draw(m)
    def px(lo, la): return ((lo - bb[0]) / (bb[2] - bb[0]) * PX, (bb[3] - la) / (bb[3] - bb[1]) * PX)
    poly = (case.get('plot') or {}).get('coordinates') or []
    if len(poly) >= 3: d.polygon([px(p[0], p[1]) for p in poly], fill=255)
    else:
        cx, cy = px(lng, lat); r = 40 / (HALF * 2 * 111000) * PX
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    return m

def main():
    key = os.environ['KB_MACHINE_KEY']
    plots = rpc('kolaboro_machine', {'p_key': key, 'p_action': 'plots', 'p_payload': {}})
    if isinstance(plots, dict): raise SystemExit('machine: ' + json.dumps(plots))
    print(len(plots), 'plots')
    if not plots: return
    tok = token(); today = datetime.date.today()
    a1, b1 = (today - datetime.timedelta(days=60)).isoformat(), today.isoformat()
    a0, b0 = (today - datetime.timedelta(days=425)).isoformat(), (today - datetime.timedelta(days=365)).isoformat()
    for c in plots:
        last = c.get('last') or {}
        if last.get('at') and (datetime.datetime.now(datetime.timezone.utc) - datetime.datetime.fromisoformat(last['at'].replace('Z', '+00:00'))).days < 5 and last.get('lat') == c['lat']:
            print('recent', c['code']); continue
        m = mask(c); inside = [i for i, v in enumerate(m.getdata()) if v > 0]
        if not inside: continue
        try:
            rgb0, nd0 = process(tok, c['lat'], c['lng'], a0, b0, 's2'); rgb1, nd1 = process(tok, c['lat'], c['lng'], a1, b1, 's2')
        except Exception as e: print('s2 fail', c['code'], e); continue
        v0, v1 = list(nd0.getdata()), list(nd1.getdata())
        ok = [i for i in inside if v0[i] > 0 and v1[i] > 0]
        meta = {'lat': c['lat'], 'lng': c['lng'], 'before': a0 + '/' + b0, 'after': a1 + '/' + b1, 'pixels': len(inside), 'source': 'Sentinel-2 L2A median, Copernicus'}
        ch = Image.new('RGBA', (PX, PX), (0, 0, 0, 0)); chp = ch.load()
        if len(ok) >= 0.5 * len(inside):
            f = lambda v: v / 255 * 1.2 - 0.2
            n0 = sum(f(v0[i]) for i in ok) / len(ok); n1 = sum(f(v1[i]) for i in ok) / len(ok)
            cleared = [i for i in ok if f(v0[i]) - f(v1[i]) > 0.2]; grown = [i for i in ok if f(v1[i]) - f(v0[i]) > 0.2]
            for i in cleared: chp[i % PX, i // PX] = (255, 91, 20, 200)
            for i in grown: chp[i % PX, i // PX] = (47, 178, 126, 200)
            pc = round(100 * len(cleared) / len(ok)); pg = round(100 * len(grown) / len(ok))
            change = pc >= 15 or pg >= 25
            meta.update({'ndvi_before': round(n0, 2), 'ndvi_after': round(n1, 2), 'cleared_pct': pc, 'greener_pct': pg, 'change': change, 'cloud_free_pct': round(100 * len(ok) / len(inside))})
            meta['summary'] = (f'About {pc}% of your plot lost its vegetation compared with a year ago (vegetation index {n0:.2f} → {n1:.2f}): land clearing or construction.' if pc >= 15 else
                               f'About {pg}% of your plot is greener than a year ago: no visible construction there.' if pg >= 25 else
                               f'No significant change on your plot compared with a year ago (vegetation index {n0:.2f} → {n1:.2f}).')
        else:
            try: r0, _ = process(tok, c['lat'], c['lng'], a0, b0, 's1'); r1, _ = process(tok, c['lat'], c['lng'], (today - datetime.timedelta(days=30)).isoformat(), b1, 's1')
            except Exception as e: print('s1 fail', c['code'], e); continue
            s0, s1 = list(r0.getdata()), list(r1.getdata()); ok = [i for i in inside if s0[i] > 0 and s1[i] > 0]
            if not ok: continue
            db = lambda v: v * 25 / 255 - 25
            up = [i for i in ok if db(s1[i]) - db(s0[i]) > 3]
            for i in up: chp[i % PX, i // PX] = (255, 91, 20, 200)
            pu = round(100 * len(up) / len(ok)); change = pu >= 15
            meta.update({'source': 'Sentinel-1 radar (clouds over the plot in the last 60 days)', 'radar_up_pct': pu, 'change': change})
            meta['summary'] = (f'Clouds hid your plot, so we used radar: about {pu}% of the plot reflects much more than a year ago, which usually means new structures or bare ground.' if change else
                               'Clouds hid your plot, so we used radar: no significant change compared with a year ago.')
        # before | after | change, 3 x 256 px
        S = 256; outl = Image.new('RGB', (S * 3 + 20, S + 30), (246, 246, 243)); d = ImageDraw.Draw(outl)
        mk = m.resize((S, S)).point(lambda v: 255 if v > 0 else 0)
        edge = mk.filter(__import__('PIL.ImageFilter', fromlist=['FIND_EDGES']).FIND_EDGES)
        for k, (im, lab) in enumerate([(rgb0, 'A year ago'), (rgb1, 'Last 60 days'), (rgb1, 'Change')]):
            tile = im.convert('RGB').resize((S, S), Image.NEAREST)
            if k == 2: tile = Image.alpha_composite(tile.convert('RGBA'), ch.resize((S, S), Image.NEAREST)).convert('RGB')
            tile.paste((255, 255, 255), mask=edge)
            outl.paste(tile, (k * (S + 10), 0)); d.text((k * (S + 10) + 4, S + 8), lab, fill=(23, 33, 43))
        buf = io.BytesIO(); outl.save(buf, 'PNG', optimize=True)
        r = rpc('kolaboro_machine', {'p_key': key, 'p_action': 'sat_result', 'p_payload': {'case_id': c['case_id'], 'image': 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode(), 'title': 'Satellite comparison ' + today.isoformat(), 'taken_at': today.isoformat() + 'T00:00:00Z', 'meta': meta}})
        print(c['code'], meta.get('summary'), r)

if __name__ == '__main__':
    main()
