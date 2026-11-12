"""Find the visible sandy beach next to the sea in Esri World Imagery around each beach point and return its coordinates.
Used on 13-nov-2026 because the OSM coastline is offset in remote parts of Sumba. Prints a proposal; results go to coords_fix.py."""
import math, io, os, sys, urllib.request, json
from PIL import Image
Z = 16; R = 3  # 7x7 tiles of ~600 m
def tile_xy(lat, lon, z):
    n = 2 ** z; x = (lon + 180) / 360 * n; y = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n
    return x, y
def px_ll(px, py, z):
    n = 2 ** z * 256; lon = px / n * 360 - 180; lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * py / n)))); return lat, lon
def tile(x, y):
    f = f"/tmp/tiles/{Z}_{x}_{y}.jpg"
    if not os.path.exists(f):
        req = urllib.request.Request(f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{Z}/{y}/{x}", headers={"user-agent": "sumbasecrets-build/1.0"})
        open(f, "wb").write(urllib.request.urlopen(req, timeout=30).read())
    return Image.open(f).convert("RGB")
def sand(c): r, g, b = c; return (r + g + b) / 3 > 150 and r >= g - 8 and g >= b - 4 and r - b > 18
def water(c): r, g, b = c; return (b > r + 12 and g > r) or (b > r + 25)
def snap(lat, lon, maxm=1600):
    fx, fy = tile_xy(lat, lon, Z); tx, ty = int(fx), int(fy)
    W = (2 * R + 1) * 256; img = Image.new("RGB", (W, W))
    for i in range(-R, R + 1):
        for j in range(-R, R + 1): img.paste(tile(tx + i, ty + j), ((i + R) * 256, (j + R) * 256))
    px = img.load(); ox, oy = (tx - R) * 256, (ty - R) * 256
    cx, cy = fx * 256 - ox, fy * 256 - oy
    mpp = 156543.03 * math.cos(math.radians(lat)) / 2 ** Z; lim = maxm / mpp
    S = 3; best = None
    # downsample grid search: sand pixel with water within 6 px and sand neighbours (not a single bright roof)
    for y in range(6, W - 6, S):
        for x in range(6, W - 6, S):
            d = math.hypot(x - cx, y - cy)
            if d > lim or (best and d >= best[0]): continue
            if not sand(px[x, y]): continue
            nsand = sum(sand(px[x + a, y + b]) for a in (-3, 0, 3) for b in (-3, 0, 3))
            if nsand < 6: continue
            if not any(water(px[x + a, y + b]) for a in (-6, -3, 0, 3, 6) for b in (-6, -3, 0, 3, 6)): continue
            best = (d, x, y)
    if not best: return None
    d, x, y = best; la, lo = px_ll(x + ox, y + oy, Z); return round(la, 5), round(lo, 5), round(d * mpp)
if __name__ == "__main__":
    from places import PLACES; from places_mamboro import MAMBORO; from coords_fix import COORD_FIX
    out = {}
    for p in PLACES + MAMBORO:
        if p["c"] != "beach" or p["s"] == "weekuri-lagoon": continue
        la, lo = COORD_FIX.get(p["s"], p["ll"]); r = snap(la, lo)
        print(p["s"], (la, lo), "->", r, flush=True)
        if r: out[p["s"]] = r
    json.dump(out, open("/tmp/sand.json", "w"))
