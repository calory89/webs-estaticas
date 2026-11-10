# -*- coding: utf-8 -*-
"""Writes distribution/pinterest-pins.csv for Pinterest's bulk "Create Pins" upload (Business account, web only).
Run AFTER the build:   python3 build.py && python3 distribution/pinterest_pins.py
One Pin per guide and per place page, per language (en, es, id). Nothing is uploaded or posted by this script.

Columns (checked 10 Nov 2026): Title, Media URL, Pinterest board, Thumbnail, Description, Link, Publish date, Keywords.
  Title max 100 characters, Description max 500, Thumbnail only for video (left empty), Publish date empty = publish at once,
  up to 200 Pins per upload (Pinterest help, "Bulk upload video Pins" page; the Description/Link/Keywords header names come
  from the template as quoted by third parties, so download the current template from Pinterest once and compare the header).
Media URL: the page's 1280 px WebP when the built HTML uses one, otherwise its og:image. Pages that only have the generic
  site image (/og.png) are NOT pinned (a logo is not a Pin): they go to pinterest-pins-need-photo.csv.
Options:
  --og                 use the 1200x630 og:image (JPEG with the masthead band) instead of the WebP
  --start 2026-11-16   fill "Publish date" from that day (UTC), spreading the Pins
  --per-day 6          Pins per day when --start is given (default 6: two per language)
"""
import os, re, sys, csv, html, argparse, datetime

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT)
import build as B   # importing build.py does not run the build

HEADER = ["Title", "Media URL", "Pinterest board", "Thumbnail", "Description", "Link", "Publish date", "Keywords"]
BOARD = {"en": ("Sumba travel guide", "Places in Sumba"), "es": ("Sumba: guía de viaje", "Lugares de Sumba"), "id": ("Panduan wisata Sumba", "Tempat wisata di Sumba")}
BASE_KW = {"en": ["Sumba", "Sumba Indonesia", "Sumba island", "Sumba travel", "Indonesia travel"],
           "es": ["Sumba", "Sumba Indonesia", "isla de Sumba", "viajar a Sumba", "viajar a Indonesia"],
           "id": ["Sumba", "wisata Sumba", "Pulau Sumba", "Nusa Tenggara Timur", "wisata Indonesia"]}
SEC_KW = {"places": {"en": ["places to visit in Sumba"], "es": ["qué ver en Sumba"], "id": ["tempat wisata Sumba"]},
          "getting-here": {"en": ["how to get to Sumba"], "es": ["cómo llegar a Sumba"], "id": ["cara ke Sumba"]},
          "culture": {"en": ["Sumba culture", "Marapu"], "es": ["cultura de Sumba", "marapu"], "id": ["budaya Sumba", "Marapu"]},
          "things-to-do": {"en": ["things to do in Sumba"], "es": ["qué hacer en Sumba"], "id": ["liburan ke Sumba"]},
          "where-to-stay": {"en": ["where to stay in Sumba"], "es": ["dónde dormir en Sumba"], "id": ["penginapan di Sumba"]},
          "projects": {"en": ["Sumba development"], "es": ["proyectos en Sumba"], "id": ["pembangunan Sumba"]}}

def cut(s, n):
    s = re.sub(r"\s+", " ", s).strip()
    return s if len(s) <= n else s[:n - 1].rsplit(" ", 1)[0].rstrip(",;:.") + "…"

def media(a, l, use_og):
    fp = os.path.join(B.OUT, B.url_of(a, l).strip("/"), "index.html")
    h = open(fp, encoding="utf-8").read()
    og = re.search(r'<meta property="og:image" content="([^"]+)"', h)
    og = html.unescape(og.group(1)) if og else ""
    own = re.search(r'/img/' + re.escape(B.img_key(a)) + r'-1280\.webp', h)   # the page's own hero, not a related card
    if og.endswith("/og.png") or not og: return None, og
    if own and not use_og: return B.BASE + own.group(0), og
    return og, og

def keywords(a, l):
    kw = list((a.get("keywords") or {}).get(l) or [])
    name = re.split(r"[:,(]", a[l]["title"])[0].strip()
    for k in [name] + SEC_KW.get(a["section"], {}).get(l, []) + BASE_KW[l]:
        if k and k.lower() not in [x.lower() for x in kw]: kw.append(k)
    return ", ".join(k.replace(",", " ") for k in kw[:8])

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--og", action="store_true"); ap.add_argument("--start"); ap.add_argument("--per-day", type=int, default=6)
    o = ap.parse_args()
    if not os.path.isdir(B.OUT): sys.exit("Run python3 build.py first: out/ not found")
    items = [a for a in B.all_items() if B.kind_of(a) == "guide"]
    rows, skipped, seen = [], [], set()
    for a in sorted(items, key=lambda a: (a["section"] != "places", a["slug"])):
        for l in B.LANGS:
            link = f"{B.BASE}{B.url_of(a, l)}?utm_source=pinterest&utm_medium=social&utm_campaign=pins"
            m, og = media(a, l, o.og)
            title = cut(a[l]["title"], 100)
            if title in seen: title = cut(a[l]["title"], 94) + f" ({l.upper()})"
            seen.add(title)
            board = BOARD[l][0] + ("/" + BOARD[l][1] if a["section"] == "places" else "")
            row = [title, m or og, board, "", cut(a[l]["dek"], 500), link, "", keywords(a, l)]
            (rows if m else skipped).append(row)
    if o.start:   # interleave languages so each day mixes en/es/id, then stamp dates
        d0 = datetime.date.fromisoformat(o.start)
        for i, r in enumerate(rows):
            day = d0 + datetime.timedelta(days=i // o.per_day); hour = 1 + (i % o.per_day) * 3   # UTC; 01:00 UTC = 09:00 WITA
            r[6] = f"{day.isoformat()}T{hour % 24:02d}:00:00"
    def dump(name, rr):
        with open(os.path.join(HERE, name), "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f, quoting=csv.QUOTE_MINIMAL); w.writerow(HEADER); w.writerows(rr)
    dump("pinterest-pins.csv", rows); dump("pinterest-pins-need-photo.csv", skipped)
    for l in B.LANGS: dump(f"pinterest-pins-{l}.csv", [r for r in rows if f"/{l}/" in r[5]])
    print(f"pinterest-pins.csv: {len(rows)} pins ({len(rows)//1} rows + header) from {len(items)} guide and place pages x {len(B.LANGS)} languages")
    print(f"pinterest-pins-need-photo.csv: {len(skipped)} rows without their own photo (generic og.png), not pinned")
    for l in B.LANGS: print(f"  {l}: {sum(1 for r in rows if f'/{l}/' in r[5])}")
    bad = [r for r in rows if len(r[0]) > 100 or len(r[4]) > 500]
    print("over limits:", len(bad))

if __name__ == "__main__":
    main()
