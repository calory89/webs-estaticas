# 13-nov-2026 · Position fixes checked against OpenStreetMap land polygons (osmdata.openstreetmap.de, land-polygons-split-4326).
# Beaches more than 250 m from the coastline (they showed up on the hills) are moved to the nearest shore point, 40 m inland;
# villages that fell in the sea are moved 40 m onto land. tools/check_coords.py re-runs the test.
COORD_FIX = {
 "ratenggaro": [-9.62959, 119.00041],
 "tarimbang-bay": [-9.97343, 119.94917],
 "kapulit-beach": [-9.36023, 119.56757],
 "karendi-beach": [-9.377, 119.42818],
 "lenang-beach": [-9.38797, 119.74912],
}
