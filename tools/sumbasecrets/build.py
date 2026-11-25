"""Build worker.js for sumbasecrets.com: CF_TOKEN=... python3 build.py
CF_TOKEN (Workers AI) is only needed when new text must be machine-translated; translations are cached in tr_cache.json."""
import json, datetime, copy
from places import PLACES, TOWNS, CREDITS, AIRPORTS
from ui import LANGS as HAND, LNAME, TIMES_LANG, UI, GUIDES
from ui2 import UI2, REGION_TXT, REGION_SLUG, CAT_SLUG, CAT_TXT, SEASON
from gallery import GALLERY
from guides2 import GUIDES2, TOWNS_TXT, EXTRA_UI, EXTRA_UI2, VIDEOS, VIDEO_META
from ui3 import EXTRA_UI3
EXTRA_UI = dict(EXTRA_UI, **EXTRA_UI2, **EXTRA_UI3)
from translate import tr_tree
from guides3 import GUIDES3
import translate
from places_mamboro import MAMBORO, TR6, MAMBORO_GAL, BASE as NEAR_BASE, NEAR
PLACES += MAMBORO
from coords_fix import COORD_FIX
for _p in PLACES:
    if _p['s'] in COORD_FIX: _p['ll'] = COORD_FIX[_p['s']]
GALLERY.update(MAMBORO_GAL)
for _l, _m in TR6.items():  # hand translations for the six extra languages
    for _en, _tx in _m.items(): translate.CACHE[translate.key(_l, _en)] = _tx

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
for p in PLACES:
    for l in HAND[1:]:
        if l not in p: p[l] = tr_tree({k: v for k, v in p["en"].items() if k != "n"}, l) | {"n": (lambda x: x[:1].upper() + x[1:])(tr_tree(p["en"]["n"], l)) if l != "id" else p["n"].get("id", p["en"]["n"])}
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
import re as _re
def _parts(html):  # translate long articles section by section so the model never truncates
    return [x for x in _re.split(r'(?=<h2>)', html) if x]
for g in GUIDES2 + GUIDES3:
    e = {"t": g["t"], "d": g["d"], "b": g["b"]}
    if g.get("faq"): e["faq"] = g["faq"]
    ng = {"s": g["s"], "img": g["img"], "en": e}
    if g.get("info"): ng["info"] = 1
    for l in LANGS[1:]:
        src = dict(e, b=_parts(e["b"])) if g in GUIDES3 else e
        tr = tr_tree(src, l)
        if isinstance(tr.get("b"), list): tr = dict(tr, b="".join(tr["b"]))
        ng[l] = tr
    GUIDES_ALL.append(ng)
from months import MONTHS
MONTHS_ALL = {}
for l in LANGS:
    MONTHS_ALL[l] = [dict(x) if l == "en" else dict(x, **tr_tree({"t": x["t"], "b": x["b"]}, l)) for x in MONTHS]
import native, guides4, guides_add
for g in GUIDES_ALL:  # extra sections for the shorter existing guides
    add = guides_add.ADD.get(g["s"]); fq = guides_add.FAQ.get(g["s"], [])
    if not add and not fq: continue
    for l in LANGS:
        if l not in g: continue
        a = add if l == "en" else ("".join(tr_tree(_parts(add), l)) if add else "")
        g[l] = dict(g[l], b=(g[l].get("b") or "") + a)
        if fq: g[l]["faq"] = (g[l].get("faq") or []) + (fq if l == "en" else tr_tree(fq, l))
import guides5
for g in guides4.GUIDES4 + guides5.GUIDES5:
    e = {"t": g["t"], "d": g["d"], "b": g["b"]}
    if g.get("faq"): e["faq"] = g["faq"]
    ng = {"s": g["s"], "img": g["img"], "en": e}
    if g.get("info"): ng["info"] = 1
    for l in LANGS[1:]:
        tr = tr_tree(dict(e, b=_parts(e["b"])), l)
        if isinstance(tr.get("b"), list): tr = dict(tr, b="".join(tr["b"]))
        ng[l] = tr
    GUIDES_ALL.append(ng)
# ---- batch 6 (23-nov-2026): 100 guides; English kept in the Worker, other languages' bodies go to KV (DATA) to stay under the 3 MB limit ----
import guides6_data, guides6a, guides6b, guides6c, hashlib as _hl
import guides7, guides8
GUIDES6 = guides6_data.GUIDES6D + guides6a.GUIDES6A + guides6b.GUIDES6B + guides6c.GUIDES6C + guides7.GUIDES7 + guides8.GUIDES8
KV6 = []
for g in GUIDES6:
    e = {"t": g["t"], "d": g["d"], "b": g["b"], "faq": g["faq"]}
    ng = {"s": g["s"], "img": g["img"], "en": e, "kv": 1}
    if g.get("rt"): ng["rt"] = g["rt"]
    for l in LANGS[1:]:
        if l == "id" and g.get("id_native"): tr = g["id_native"]  # Indonesian written natively, not machine translated
        else:
            tr = tr_tree(dict(e, b=_parts(e["b"])), l)
            if isinstance(tr.get("b"), list): tr = dict(tr, b="".join(tr["b"]))
        body = {"b": tr["b"], "faq": tr.get("faq") or []}
        js = json.dumps(body, ensure_ascii=False, separators=(",", ":"))
        h = _hl.sha1(js.encode()).hexdigest()[:10]
        ng[l] = {"t": tr["t"], "d": tr["d"], "h": h}
        KV6.append({"key": f"g6:{l}:{g['s']}:{h}", "value": js})
    GUIDES_ALL.append(ng)
json.dump(KV6, open("kv_g6.json", "w"), ensure_ascii=False, separators=(",", ":"))
_pl = {"s": "places-to-visit-in-sumba", "img": "wairinding-hill"}
for l in LANGS:
    src = native.INTRO.get(l)
    if src is None:  # other languages: translate the English intro, list comes from our translated place data
        src = tr_tree({k: v for k, v in native.INTRO["en"].items()}, l)
        mp, top = tr_tree(list(native.LINKS["en"]), l)
        src = dict(src, i=src["i"].replace("{map}", f'<a href="/{{l}}/map/">{mp}</a>').replace("{top}", f'<a href="/{{l}}/guide/sumba-travel-guide/">{top}</a>'))
    pls = [(p, {**p["en"], **p.get(l, {})}) for p in PLACES]
    _pl[l] = {"t": src["t"], "d": src["d"], "b": native.build(l, pls, UI[l], src), "faq": src["faq"]}
GUIDES_ALL.append(_pl)
TOWNS_ALL = {}
for s, e in TOWNS_TXT.items():
    TOWNS_ALL[s] = {"en": e}
    for l in LANGS[1:]: TOWNS_ALL[s][l] = tr_tree(e, l)

# ---- checks ----
for p in PLACES:
    for l in LANGS: assert p[l]["t"] and p[l]["tip"], (p["s"], l)
    assert p["s"] in GALLERY or p["img"], ("no photo", p["s"])
for l in LANGS:
    assert l in NEAR and set(NEAR[l]) == set(NEAR["en"]), ("near ui", l)
    assert set(UI[l]) == set(UI["en"]), (l, set(UI["en"]) ^ set(UI[l]))
    assert set(UI2[l]) == set(UI2["en"]), (l, set(UI2["en"]) ^ set(UI2[l]))
    assert len(WX[l]) == 8 and len(UI[l]["days"]) == 7, l
bad = ["nihi", "karoso", "sumbabari", "hotel", "resort"]
blob = json.dumps(GALLERY).lower()
assert not any(b in blob for b in bad), "hotel photo in gallery"

data = {"langs": LANGS, "lname": LNAME, "tl": TIMES_LANG, "ui": UI, "ui2": UI2, "wx": WX, "places": PLACES, "towns": TOWNS, "towntxt": TOWNS_ALL,
        "guides": GUIDES_ALL, "credits": CREDITS, "rtxt": REGION_TXT, "rslug": REGION_SLUG, "cslug": CAT_SLUG, "ctxt": CAT_TXT, "season": SEASON,
        "gallery": GALLERY, "airports": AIRPORTS, "regions": json.load(open("regions.json")), "indexnow": "5f0c3b7e9a2d4c18b6e1a7f3d9c2e0b4",
        "built": datetime.date.today().isoformat(), "ver": datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d%H%M%S"), "nbase": NEAR_BASE, "svc": json.load(open("osm_services.json")), "climate": json.load(open("climate.json")), "months": MONTHS_ALL, "near": NEAR, "videos": VIDEOS, "vmeta": VIDEO_META}
# ---- real lastmod per page: date changes only when that page's content changes ----
import hashlib, os
_lm = json.load(open("lastmod.json")) if os.path.exists("lastmod.json") else {}
_today = datetime.date.today().isoformat()
def _stamp(path, obj):
    h = hashlib.sha1(json.dumps(obj, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:12]
    old = _lm.get(path)
    if not old or old[0] != h: _lm[path] = [h, _today if old else "2026-11-11"]
for p in PLACES: _stamp(f"/place/{p['s']}/", {k: p[k] for k in p if k not in ("ll",)} | {"g": GALLERY.get(p["s"])})
for g in GUIDES_ALL: _stamp(f"/guide/{g['s']}/", g)
json.dump(_lm, open("lastmod.json", "w"), indent=0, sort_keys=True)
data["mod"] = {k: v[1] for k, v in _lm.items()}
tpl = open("worker.tpl.js").read()
out = tpl.replace("__DATA__", json.dumps(data, ensure_ascii=False, separators=(",", ":")))
open("worker.js", "w").write(out)
print("worker.js", len(out.encode()), "bytes,", len(LANGS), "languages,", len(PLACES), "places,", len(GUIDES_ALL), "guides")
