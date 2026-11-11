"""Build worker.js for sumbasecrets.com: CF_TOKEN=... python3 build.py
CF_TOKEN (Workers AI) is only needed when new text must be machine-translated; translations are cached in tr_cache.json."""
import json, datetime, copy
from places import PLACES, TOWNS, CREDITS, AIRPORTS
from ui import LANGS as HAND, LNAME, TIMES_LANG, UI, GUIDES
from ui2 import UI2, REGION_TXT, REGION_SLUG, CAT_SLUG, CAT_TXT, SEASON
from gallery import GALLERY
from guides2 import GUIDES2, TOWNS_TXT, EXTRA_UI
from translate import tr_tree

NEW = ["it", "zh", "ja", "ko", "ru", "pt"]
LANGS = HAND + NEW
LNAME = dict(LNAME, it="Italiano", zh="中文", ja="日本語", ko="한국어", ru="Русский", pt="Português")
TIMES_LANG = dict(TIMES_LANG, **{l: "en" for l in NEW})
CREDITS = dict(CREDITS)
CREDITS["how-to-get-to-sumba-from-bali"] = ["Davidelit", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:TambolakaAirport.jpg"]
WX_EN = ["Clear", "Partly cloudy", "Cloudy", "Fog", "Drizzle", "Rain", "Showers", "Thunderstorm"]
WX = {"en": WX_EN,
 "es": ["Despejado","Parcialmente nuboso","Nublado","Niebla","Llovizna","Lluvia","Chubascos","Tormenta"],
 "id": ["Cerah","Cerah berawan","Berawan","Kabut","Gerimis","Hujan","Hujan lokal","Badai petir"],
 "de": ["Klar","Teilweise bewölkt","Bewölkt","Nebel","Nieselregen","Regen","Schauer","Gewitter"],
 "fr": ["Dégagé","Partiellement nuageux","Nuageux","Brouillard","Bruine","Pluie","Averses","Orage"],
 "nl": ["Helder","Half bewolkt","Bewolkt","Mist","Motregen","Regen","Buien","Onweer"]}

# ---- machine translation for the six new languages (existing content) and for new content (all languages) ----
for l in NEW:
    UI[l] = tr_tree(UI["en"], l)
    UI2[l] = tr_tree(UI2["en"], l)
    WX[l] = tr_tree(WX_EN, l)
    for p in PLACES: p[l] = tr_tree({k: v for k, v in p["en"].items() if k != "n"}, l) | {"n": p["en"]["n"]}
    for g in GUIDES: g[l] = tr_tree(g["en"], l)
    for d in (REGION_TXT, CAT_TXT, SEASON):
        for k in d: d[k][l] = tr_tree(d[k]["en"], l)
for l in LANGS:
    UI2[l] = dict(UI2[l], **(EXTRA_UI if l == "en" else tr_tree(EXTRA_UI, l)))
GUIDES_ALL = []
for g in GUIDES:
    GUIDES_ALL.append(dict(g))
for g in GUIDES2:
    e = {"t": g["t"], "d": g["d"], "b": g["b"]}
    ng = {"s": g["s"], "img": g["img"], "en": e}
    for l in LANGS[1:]: ng[l] = tr_tree(e, l)
    GUIDES_ALL.append(ng)
TOWNS_ALL = {}
for s, e in TOWNS_TXT.items():
    TOWNS_ALL[s] = {"en": e}
    for l in LANGS[1:]: TOWNS_ALL[s][l] = tr_tree(e, l)

# ---- checks ----
for p in PLACES:
    for l in LANGS: assert p[l]["t"] and p[l]["tip"], (p["s"], l)
    assert p["s"] in GALLERY or p["img"], ("no photo", p["s"])
for l in LANGS:
    assert set(UI[l]) == set(UI["en"]), (l, set(UI["en"]) ^ set(UI[l]))
    assert set(UI2[l]) == set(UI2["en"]), (l, set(UI2["en"]) ^ set(UI2[l]))
    assert len(WX[l]) == 8 and len(UI[l]["days"]) == 7, l
bad = ["nihi", "karoso", "sumbabari", "hotel", "resort"]
blob = json.dumps(GALLERY).lower()
assert not any(b in blob for b in bad), "hotel photo in gallery"

data = {"langs": LANGS, "lname": LNAME, "tl": TIMES_LANG, "ui": UI, "ui2": UI2, "wx": WX, "places": PLACES, "towns": TOWNS, "towntxt": TOWNS_ALL,
        "guides": GUIDES_ALL, "credits": CREDITS, "rtxt": REGION_TXT, "rslug": REGION_SLUG, "cslug": CAT_SLUG, "ctxt": CAT_TXT, "season": SEASON,
        "gallery": GALLERY, "airports": AIRPORTS, "regions": json.load(open("regions.json")), "indexnow": "5f0c3b7e9a2d4c18b6e1a7f3d9c2e0b4",
        "built": datetime.date.today().isoformat()}
tpl = open("worker.tpl.js").read()
out = tpl.replace("__DATA__", json.dumps(data, ensure_ascii=False, separators=(",", ":")))
open("worker.js", "w").write(out)
print("worker.js", len(out.encode()), "bytes,", len(LANGS), "languages,", len(PLACES), "places,", len(GUIDES_ALL), "guides")
