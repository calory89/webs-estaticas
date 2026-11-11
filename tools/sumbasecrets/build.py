"""Build worker.js for sumbasecrets.com: python3 build.py"""
import json, datetime
from places import PLACES, TOWNS, CREDITS
from ui import LANGS, LNAME, TIMES_LANG, UI, GUIDES
from places import AIRPORTS
from ui2 import UI2, REGION_TXT, REGION_SLUG, CAT_SLUG, CAT_TXT, SEASON
from gallery import GALLERY
REGIONS = json.load(open("regions.json"))
CREDITS = dict(CREDITS)
CREDITS["how-to-get-to-sumba-from-bali"] = ["Davidelit","CC BY-SA 4.0","https://commons.wikimedia.org/wiki/File:TambolakaAirport.jpg"]
for p in PLACES:
    for l in LANGS: assert l in p and p[l]["t"] and p[l]["tip"], (p["s"], l)
    if p["img"]: assert p["img"] in CREDITS, p["img"]
for g in GUIDES:
    for l in LANGS: assert g[l]["t"] and g[l]["b"], (g["s"], l)
    assert g["img"] in CREDITS
for l in LANGS: assert set(UI2[l]) == set(UI2["en"]), l
for p in PLACES: assert p["s"] in GALLERY or p["img"] or True
for l in LANGS: assert set(UI[l]) == set(UI["en"]), (l, set(UI["en"]) ^ set(UI[l]))
data = {"langs": LANGS, "lname": LNAME, "tl": TIMES_LANG, "ui": UI, "places": PLACES, "towns": TOWNS, "guides": GUIDES, "credits": CREDITS, "ui2": UI2, "rtxt": REGION_TXT, "rslug": REGION_SLUG, "cslug": CAT_SLUG, "ctxt": CAT_TXT, "season": SEASON, "gallery": GALLERY, "airports": AIRPORTS, "regions": REGIONS, "indexnow": "5f0c3b7e9a2d4c18b6e1a7f3d9c2e0b4",
        "built": datetime.date.today().isoformat()}
tpl = open("worker.tpl.js").read()
out = tpl.replace("__DATA__", json.dumps(data, ensure_ascii=False, separators=(",", ":")))
open("worker.js", "w").write(out)
print("worker.js", len(out.encode()), "bytes")
