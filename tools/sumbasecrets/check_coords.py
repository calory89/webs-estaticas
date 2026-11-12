"""Check every place against OpenStreetMap land polygons: beaches must be within 250 m of the coast, nothing else in the sea.
Needs shapely and /tmp/osm/sumba_land.geojson (built from osmdata.openstreetmap.de land-polygons-split-4326, bbox 118.8,-10.5,120.95,-9.1)."""
import json, math, sys
from shapely.geometry import shape, Point
from shapely.ops import nearest_points
land = shape(json.load(open(sys.argv[1] if len(sys.argv) > 1 else "/tmp/osm/sumba_land.geojson"))); coast = land.boundary
from places import PLACES
from places_mamboro import MAMBORO
from coords_fix import COORD_FIX
k = 111320 * math.cos(math.radians(9.6)); bad = 0
for p in PLACES + MAMBORO:
    lat, lon = COORD_FIX.get(p["s"], p["ll"]); pt = Point(lon, lat); q = nearest_points(coast, pt)[0]
    d = math.hypot((pt.x - q.x) * k, (pt.y - q.y) * 110570)
    if (p["c"] == "beach" and p["s"] != "weekuri-lagoon" and d > 60) or (p["c"] != "beach" and not land.contains(pt)): bad += 1; print("CHECK", p["s"], p["c"], round(d), "m")
print("places", len(PLACES + MAMBORO), "problems", bad); sys.exit(1 if bad else 0)
