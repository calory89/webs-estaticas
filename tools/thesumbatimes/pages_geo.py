# -*- coding: utf-8 -*-
"""Geodata pages and blocks for The Sumba Times (18 Nov 2026). All numbers come from data files next to this module, fetched once
(the build never needs the network):
  data_osrm.json      road km and driving minutes between 7 hubs and every place page (OSRM on OpenStreetMap roads)
  data_routes.json    route lines between the four towns
  data_outline.json   coastline of Sumba, data_regencies.json the four regencies (OpenStreetMap via Nominatim, ODbL)
  data_quakes.json    USGS catalogue, magnitude 5+, within 250 km, since 2000
Pages: /LANG/distances/ (+ 6 town-to-town pages), /LANG/map/, /LANG/earthquakes/, /LANG/data/ and the files under /data/.
Helpers for build.py: place_box(g, a, l) (road distances, locator map, combine-in-a-day) and place_desc(g, a, l).
"""
import os, json, math, html, csv, io, datetime, re
import pages_hubs, pages_months, pages_live

HERE = os.path.dirname(os.path.abspath(__file__))
def _load(n): return json.load(open(os.path.join(HERE, n), encoding="utf-8"))
OSRM = _load("data_osrm.json"); OUTLINE = _load("data_outline.json"); REGS = _load("data_regencies.json"); ROUTES = _load("data_routes.json"); QUAKES = _load("data_quakes.json")
PTS = OSRM["points"]; IDX = {p["k"]: i for i, p in enumerate(PTS)}
FETCHED = OSRM["fetched"]
def esc(s): return html.escape(str(s), quote=True)

HUB = {"tmc": {"en": "Tambolaka Airport (TMC)", "es": "aeropuerto de Tambolaka (TMC)", "id": "Bandara Tambolaka (TMC)"},
       "wgp": {"en": "Waingapu Airport (WGP)", "es": "aeropuerto de Waingapu (WGP)", "id": "Bandara Waingapu (WGP)"},
       "waikabubak": {"en": "Waikabubak", "es": "Waikabubak", "id": "Waikabubak"}, "waibakul": {"en": "Waibakul", "es": "Waibakul", "id": "Waibakul"},
       "waingapu": {"en": "Waingapu", "es": "Waingapu", "id": "Waingapu"}, "tambolaka": {"en": "Tambolaka", "es": "Tambolaka", "id": "Tambolaka"},
       "waikelo": {"en": "Waikelo port", "es": "puerto de Waikelo", "id": "Pelabuhan Waikelo"}}
HUB_PAGE = {"tmc": "tambolaka-airport-guide", "wgp": "waingapu-airport-guide", "waikabubak": "waikabubak-town", "waibakul": "waibakul-town", "waingapu": "waingapu-town", "tambolaka": "tambolaka-town", "waikelo": "ferries-to-sumba"}
TOWNS = ["tambolaka", "waikabubak", "waibakul", "waingapu"]
PAIRS = [tuple(k.split("|")) for k in ROUTES["routes"]]
def pair_slug(a, b): return f"{a}-to-{b}"

S = {
 "en": {"box_t": "Distances by road", "from": "From", "km_road": "km by road", "about": "about", "drive": "driving", "nearest": "Nearest town", "coords": "Coordinates", "open_map": "Open in Google Maps",
        "combine_t": "Combine it in one day", "combine_p": "The closest places by road from here, with the driving time between them:",
        "note": "Road distances were calculated on {d} with the OSRM routing engine on OpenStreetMap roads. Driving times are our estimate at an average of 34 to 42 km/h without long stops, the pace at which the 170 km between Tambolaka and Waingapu take 4 to 5 hours.",
        "snap": "The mapped road ends about {m} km from this point: the last stretch is a track or a walk.",
        "sentence": "{n} is in {area}, on the island of Sumba, Indonesia: {k1} km by road from {h1} (about {t1}) and {k2} km from {h2} (about {t2}).",
        "all_d": "All distances between towns and places", "map_alt": "Map of Sumba with the position of {n}", "map_cap": "Position of {n} on Sumba. Map: The Sumba Times, coastline and boundaries © OpenStreetMap contributors.",
        "h": "h", "min": "min", "line": "in a straight line", "see_map": "See all places on the map"},
 "es": {"box_t": "Distancias por carretera", "from": "Desde", "km_road": "km por carretera", "about": "unos", "drive": "en coche", "nearest": "Ciudad más cercana", "coords": "Coordenadas", "open_map": "Abrir en Google Maps",
        "combine_t": "Combínalo en un día", "combine_p": "Los lugares más cercanos por carretera desde aquí, con el tiempo de trayecto entre ellos:",
        "note": "Las distancias por carretera se calcularon el {d} con el motor de rutas OSRM sobre las carreteras de OpenStreetMap. Los tiempos son nuestra estimación a una media de 34 a 42 km/h sin paradas largas, el ritmo al que los 170 km entre Tambolaka y Waingapu se hacen en 4 o 5 horas.",
        "snap": "La carretera cartografiada termina a unos {m} km de este punto: el último tramo es una pista o un paseo a pie.",
        "sentence": "{n} está en {area}, en la isla de Sumba (Indonesia): a {k1} km por carretera del {h1} (unos {t1}) y a {k2} km del {h2} (unos {t2}).",
        "all_d": "Todas las distancias entre ciudades y lugares", "map_alt": "Mapa de Sumba con la posición de {n}", "map_cap": "Posición de {n} en Sumba. Mapa: The Sumba Times, costa y límites © colaboradores de OpenStreetMap.",
        "h": "h", "min": "min", "line": "en línea recta", "see_map": "Ver todos los lugares en el mapa"},
 "id": {"box_t": "Jarak lewat jalan darat", "from": "Dari", "km_road": "km lewat jalan", "about": "sekitar", "drive": "berkendara", "nearest": "Kota terdekat", "coords": "Koordinat", "open_map": "Buka di Google Maps",
        "combine_t": "Gabungkan dalam satu hari", "combine_p": "Tempat terdekat lewat jalan darat dari sini, dengan waktu tempuh di antaranya:",
        "note": "Jarak lewat jalan dihitung pada {d} dengan mesin rute OSRM di atas data jalan OpenStreetMap. Waktu tempuh adalah perkiraan kami dengan kecepatan rata-rata 34 sampai 42 km/jam tanpa berhenti lama, yaitu laju yang membuat 170 km antara Tambolaka dan Waingapu ditempuh 4 sampai 5 jam.",
        "snap": "Jalan yang terpetakan berakhir sekitar {m} km dari titik ini: sisanya berupa jalan tanah atau jalan kaki.",
        "sentence": "{n} berada di {area}, Pulau Sumba, Indonesia: {k1} km lewat jalan darat dari {h1} (sekitar {t1}) dan {k2} km dari {h2} (sekitar {t2}).",
        "all_d": "Semua jarak antarkota dan tempat wisata", "map_alt": "Peta Sumba dengan posisi {n}", "map_cap": "Posisi {n} di Sumba. Peta: The Sumba Times, garis pantai dan batas © kontributor OpenStreetMap.",
        "h": "jam", "min": "menit", "line": "garis lurus", "see_map": "Lihat semua tempat di peta"},
}
def dur(m, l):
    t = S[l]
    if m is None: return "?"
    if m < 60: return f"{m} {t['min']}"
    h, r = divmod(int(m), 60)
    return f"{h} {t['h']}" + (f" {r} {t['min']}" if r else "")
V_FAST, V_SLOW = 42, 34   # km/h: our guides give 4 to 5 hours for the 170 km between Tambolaka and Waingapu
def tmin(k):
    """(low, high) driving minutes for k road km at 42 and 34 km/h, rounded to 5 minutes."""
    lo, hi = k / V_FAST * 60, k / V_SLOW * 60
    r = lambda x: max(5, int(round(x / 5.0)) * 5)
    return r(lo), r(hi)
def drv(k, l):
    """Driving time as text: a range, or a single figure when both ends round to the same."""
    if k is None: return "?"
    lo, hi = tmin(k)
    if hi <= 5: return {"en": "under 10 min", "es": "menos de 10 min", "id": "kurang dari 10 menit"}[l]
    if lo == hi: return dur(lo, l)
    return dur(lo, l) + {"en": " to ", "es": " a ", "id": " sampai "}[l] + dur(hi, l)
def num(x, l):
    s = f"{x:.1f}" if x < 20 and x != int(x) else str(int(round(x)))
    return s.replace(".", ",") if l != "en" else s
def km(i, j): return OSRM["km"][i][j]
def mn(i, j): return OSRM["min"][i][j]
def fdate(g, l, d=None): return g["fdate"]({"date": d or FETCHED, "time": "06:00"}, l, False)

# ---------- map drawing ----------
W, H = 640, 384; LON0, LON1, LAT0, LAT1 = 118.86, 120.92, -10.42, -9.18
def xy(lon, lat): return round((lon - LON0) / (LON1 - LON0) * W, 1), round((LAT1 - lat) / (LAT1 - LAT0) * H, 1)
def _rings(gj): return [gj["coordinates"]] if gj["type"] == "Polygon" else gj["coordinates"]
def _path(gj, minpts=8):
    d = ""
    for poly in _rings(gj):
        ring = poly[0]
        if len(ring) < minpts: continue
        pts = [xy(x, y) for x, y in ring]
        out = [pts[0]]
        for p in pts[1:]:
            if abs(p[0] - out[-1][0]) + abs(p[1] - out[-1][1]) >= 1.5: out.append(p)
        d += "M" + " ".join(f"{x:g},{y:g}" for x, y in out) + "Z"
    return d
_BASE_SVG = None
def base_svg():
    global _BASE_SVG
    if _BASE_SVG is None:
        regs = "".join(f'<path d="{_path(gj, 20)}" fill="none" stroke="currentColor" stroke-opacity=".28" stroke-width="1" stroke-dasharray="3 3"/>' for gj in REGS["regencies"].values())
        _BASE_SVG = f'<path d="{_path(OUTLINE["geojson"], 4)}" fill="var(--card,#fff)" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' + regs
    return _BASE_SVG
def svg(l, title, dots=(), lines=(), labels=(), cls="lmap"):
    """dots: (lon, lat, radius, colour); lines: list of [[lon, lat], ...]; labels: (lon, lat, text, anchor)."""
    s = f'<svg class="{cls}" viewBox="0 0 {W} {H}" role="img" aria-label="{esc(title)}" xmlns="http://www.w3.org/2000/svg"><title>{esc(title)}</title>{base_svg()}'
    for ln in lines:
        s += '<polyline points="' + " ".join("{:g},{:g}".format(*xy(x, y)) for x, y in ln) + '" fill="none" stroke="#a3271c" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>'
    for lon, lat, r, col in dots:
        x, y = xy(lon, lat); s += f'<circle cx="{x:g}" cy="{y:g}" r="{r}" fill="{col}" stroke="#fff" stroke-width="1"/>'
    for lon, lat, text, anchor in labels:
        x, y = xy(lon, lat); dx = {"start": 8, "end": -8, "middle": 0}[anchor]; dy = -9 if anchor == "middle" else 4
        s += f'<text x="{x + dx:g}" y="{y + dy:g}" text-anchor="{anchor}" font-size="13" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" fill="currentColor" paint-order="stroke" stroke="var(--bg,#fff)" stroke-width="3">{esc(text)}</text>'
    return s + "</svg>"
TOWN_LABELS = [("tambolaka", "start"), ("waikabubak", "middle"), ("waingapu", "end")]
def town_dots(): return [(PTS[IDX[k]]["lon"], PTS[IDX[k]]["lat"], 3.2, "#555") for k in TOWNS]
def town_labels(l): return [(PTS[IDX[k]]["lon"], PTS[IDX[k]]["lat"], HUB[k][l], an) for k, an in TOWN_LABELS]

# ---------- helpers for place pages ----------
def _items(g): return {a["slug"]: a for a in g["all_items"]()}
def _url(g, slug, l):
    a = _items(g).get(slug)
    return g["url_of"](a, l) if a else None
def _place_idx(a):
    if a.get("section") != "places" or pages_hubs._is_area(a): return None
    return IDX.get(a["slug"])
def neighbours(g, a, n=3, max_km=45):
    i = _place_idx(a)
    if i is None: return []
    its = _items(g); rows = []
    for j, p in enumerate(PTS):
        if p.get("hub") or j == i or p["k"] not in its or pages_hubs._is_area(its[p["k"]]): continue
        if mn(i, j) is None or km(i, j) < 0.3: continue
        rows.append((km(i, j), km(i, j), its[p["k"]]))
    rows.sort(key=lambda r: r[0])
    return [r for r in rows if r[0] <= max_km][:n]
def place_sentence(g, a, l):
    i = _place_idx(a)
    if i is None or km(i, 0) is None or km(i, 1) is None: return ""
    return S[l]["sentence"].format(n=pages_hubs.pname(a, l), area=pages_hubs.area_l(a, l) or "Sumba", k1=num(km(i, 0), l), h1=HUB["tmc"][l], t1=drv(km(i, 0), l), k2=num(km(i, 1), l), h2=HUB["wgp"][l], t2=drv(km(i, 1), l))
def place_desc(g, a, l):
    """Hard facts first for the meta description of a place page (road km from the nearer airport), or ''."""
    i = _place_idx(a)
    if i is None or km(i, 0) is None: return ""
    h = 0 if km(i, 0) <= km(i, 1) else 1; hk = "tmc" if h == 0 else "wgp"
    pat = {"en": "{k} km by road from {h} (about {t}).", "es": "A {k} km por carretera del {h} (unos {t}).", "id": "{k} km lewat jalan dari {h} (sekitar {t})."}[l]
    return pat.format(k=num(km(i, h), l), h=HUB[hk][l], t=drv(km(i, h), l))
def place_box(g, a, l):
    i = _place_idx(a)
    if i is None or km(i, 0) is None: return ""
    t = S[l]; p = PTS[i]; name = pages_hubs.pname(a, l)
    rows = ""
    for hk in ("tmc", "wgp"):
        j = IDX[hk]; u = _url(g, HUB_PAGE[hk], l)
        lab = f'<a href="{u}">{esc(HUB[hk][l])}</a>' if u else esc(HUB[hk][l])
        rows += f'<dt>{t["from"]} {lab}</dt><dd>{num(km(i, j), l)} {t["km_road"]}, {t["about"]} {drv(km(i, j), l)} {t["drive"]}</dd>'
    near = sorted(((km(i, IDX[k]), k) for k in TOWNS if km(i, IDX[k]) is not None))
    if near and a["slug"] != HUB_PAGE.get(near[0][1]):
        k = near[0][1]; j = IDX[k]; u = _url(g, HUB_PAGE[k], l)
        rows += f'<dt>{t["nearest"]}</dt><dd>{f"""<a href="{u}">{HUB[k][l]}</a>""" if u else HUB[k][l]}: {num(km(i, j), l)} {t["km_road"]}, {t["about"]} {drv(km(i, j), l)}</dd>'
    rows += f'<dt>{t["coords"]}</dt><dd>{p["lat"]:.4f}, {p["lon"]:.4f} · <a href="https://www.google.com/maps/search/?api=1&query={p["lat"]},{p["lon"]}" target="_blank" rel="noopener">{t["open_map"]}</a></dd>'
    rows += sun_row(g, p, l)
    nb = neighbours(g, a)
    comb = ""
    if nb:
        comb = f'<p class="gcomb"><b>{t["combine_t"]}.</b> {t["combine_p"]}</p><ul class="gnb">' + "".join(
            f'<li><a href="{g["url_of"](b, l)}">{esc(pages_hubs.pname(b, l))}</a><span>{num(k_, l)} km · {drv(k_, l)}</span></li>' for m, k_, b in nb) + "</ul>"
    snap = OSRM["snap_m"][i]
    note = t["note"].format(d=fdate(g, l)) + (" " + t["snap"].format(m=num(round(snap / 100) / 10, l)) if snap >= 600 else "")
    dots = town_dots() + [(PTS[IDX[b["slug"]]]["lon"], PTS[IDX[b["slug"]]]["lat"], 3.5, "#1f7a8c") for _, _, b in nb] + [(p["lon"], p["lat"], 7, "#a3271c")]
    fig = f'<figure class="gfig">{svg(l, t["map_alt"].format(n=name), dots, labels=town_labels(l))}<figcaption>{esc(t["map_cap"].format(n=name))} <a href="/{l}/map/">{t["see_map"]} →</a></figcaption></figure>'
    return (f'<section class="gbox" data-block="geo"><h2 id="distances">{t["box_t"]}</h2><p class="gsent">{esc(place_sentence(g, a, l))}</p><dl>{rows}</dl>{comb}{fig}'
            f'<p class="gnote">{esc(note)} <a href="/{l}/distances/">{t["all_d"]} →</a></p></section>')

# ---------- pages ----------
P = {
 "en": {"d_title": "Sumba distances and driving times: table and calculator", "d_h1": "Distances and driving times in Sumba",
        "d_desc": "Road distance and driving time between Tambolaka, Waikabubak, Waibakul, Waingapu, both airports and {n} places in Sumba. Calculated on OpenStreetMap roads.",
        "d_lead": "How far is it? This page gives the road distance and the driving time between the four towns of Sumba, its two airports, the port of Waikelo and {n} beaches, waterfalls, villages and viewpoints. Pick two points in the calculator or read the tables.",
        "calc_t": "Distance calculator", "from": "From", "to": "To", "res": "{a} to {b}: {k} km by road, about {t} driving.", "towns_t": "Between towns, airports and port", "places_t": "From the airports to every place",
        "place": "Place", "area": "Regency", "pairs_t": "Town to town, with the stops on the way", "method_t": "How these numbers were calculated",
        "method": "Road distances come from the OSRM routing engine (router.project-osrm.org) running on OpenStreetMap road data, queried on {d}, along the fastest route by car. Driving times are our own estimate: the distance divided by an average speed of 34 to 42 km/h, the pace at which the 170 km between Tambolaka and Waingapu are driven in 4 to 5 hours without long stops. We do not publish the routing engine's own times because they assume open-road speeds that Sumba's roads do not allow: most have one lane each way, bends are frequent in the hills between Waikabubak and Waingapu, and horses, buffalo and schoolchildren share the road. Rain, roadworks and rough final tracks add more. Where the map point is far from a mapped road (some waterfalls and beaches), the last stretch is on foot or on a track and is not counted.",
        "dl": "Download the full table", "kicker": "Data", "crumb": "Distances",
        "pair_title": "{a} to {b}: distance, driving time and stops", "pair_h1": "{a} to {b} by road", "pair_desc": "{a} to {b} is {k} km by road, about {t} driving. Route map, places along the way and how far each one is from the main road.",
        "pair_p1": "The road from {a} to {b} is {k} km long and takes about {t} by car without long stops. The distance comes from the OSRM routing engine on OpenStreetMap roads ({d}); the time is our estimate at 34 to 42 km/h. In a straight line the two towns are {s} km apart, so the road is {r} times longer than the direct line.",
        "pair_p2": "The same figures apply in the opposite direction, from {b} to {a}. Plan extra time for stops, slower stretches behind trucks and the chance of rain between November and April.",
        "stops_t": "Places near this road", "stops_p": "Place pages of The Sumba Times that lie within {x} km of the route, in order from {a}. The second column is the point of the route where the turn-off is, the third the straight-line distance from the road to the place.",
        "stops_none": "No place page lies within {x} km of this road.", "at_km": "At km", "off": "From the road", "other_t": "Other town-to-town routes", "map_alt": "Map of the road from {a} to {b} in Sumba",
        "how": "How to travel it", "how_p": "There is no train and no ride-hailing app between towns. Most visitors hire a car with a driver; buses and shared minibuses run between the towns in the morning.",
        "m_title": "Map of Sumba: {n} places by regency", "m_h1": "Map of Sumba: every place we cover", "m_desc": "Map of Sumba island with {n} beaches, waterfalls, traditional villages, hills and towns, grouped by regency, with the road distance from each airport.",
        "m_lead": "Sumba is an island of Indonesia in East Nusa Tenggara province, about 210 km long from west to east. It has four regencies, two airports (Tambolaka in the west and Waingapu in the east) and no road that runs all the way around the coast. The map shows the {n} places with their own page in The Sumba Times.",
        "m_inter": "Open the interactive map", "m_reg": "regency", "m_crumb": "Map",
        "q_title": "Earthquakes near Sumba since 2000: list and map", "q_h1": "Earthquakes near Sumba since 2000", "q_desc": "{n} earthquakes of magnitude 5 or more within 250 km of Sumba since 2000, from the USGS catalogue: the ten largest, a map and the count per year.",
        "q_lead": "The USGS catalogue lists {n} earthquakes of magnitude 5.0 or more within 250 km of the centre of Sumba between 1 January 2000 and {d}. The largest was magnitude {m} on {md} ({mp}). The most recent was magnitude {lm} on {ld} ({lp}).",
        "q_why": "Sumba lies just north of the Java Trench, where the Australian plate moves under the Sunda plate, and south of the Flores back-arc thrust. That is an average of {avg} a year. The 1977 Sumba earthquake (magnitude 8.3, outside the period of this list) produced a tsunami on the south coasts of Sumba and Sumbawa.",
        "q_top": "The ten largest", "q_year": "Earthquakes per year", "q_all": "All {n} earthquakes", "q_date": "Date (UTC)", "q_mag": "Magnitude", "q_where": "Location (USGS)", "q_depth": "Depth", "q_dist": "From central Sumba", "q_n": "Number",
        "q_method": "Source: USGS Earthquake Catalog, query of {d}: magnitude 5.0 or more, within 250 km of 9.7° S, 120.0° E, from 1 January 2000. Magnitudes published by Indonesia's BMKG for the same events can differ by a few tenths. Distances are from the epicentre to the centre of the island in a straight line.",
        "q_do": "What to do", "q_do_p": "If you feel a strong or long earthquake near the coast, move to higher ground without waiting for a warning. Official information is published by BMKG.", "q_crumb": "Earthquakes", "q_map_alt": "Map of earthquake epicentres of magnitude 5 or more around Sumba since 2000",
        "x_title": "Sumba open data: places, distances, climate, flights and more", "x_h1": "Sumba data to download", "x_desc": "Tables about Sumba to download as CSV, JSON and GeoJSON: places with coordinates, road distances, monthly climate, flights, events, earthquakes and glossary.",
        "x_lead": "These are the tables behind the pages of The Sumba Times, ready to download. Journalists, students, guides and developers can reuse them with credit to The Sumba Times and a link to this page. Each file states its source and the date of the data.",
        "x_file": "File", "x_rows": "Rows", "x_what": "What it contains", "x_src": "Source", "x_lic": "Reuse", "x_lic_p": "Our own compilation can be reused with credit and a link. The underlying sources keep their own terms: OpenStreetMap data is under ODbL, the USGS catalogue is public domain, and Open-Meteo ERA5 data is under CC BY 4.0. Flight and event rows cite the source of each item on its page.", "x_crumb": "Data"},
 "es": {"d_title": "Distancias en Sumba y tiempos en coche: tabla y calculadora", "d_h1": "Distancias y tiempos de trayecto en Sumba",
        "d_desc": "Distancia por carretera y tiempo en coche entre Tambolaka, Waikabubak, Waibakul, Waingapu, los dos aeropuertos y {n} lugares de Sumba. Calculado sobre carreteras de OpenStreetMap.",
        "d_lead": "¿Cuánto se tarda? Esta página da la distancia por carretera y el tiempo en coche entre las cuatro ciudades de Sumba, sus dos aeropuertos, el puerto de Waikelo y {n} playas, cascadas, aldeas y miradores. Elige dos puntos en la calculadora o consulta las tablas.",
        "calc_t": "Calculadora de distancias", "from": "Desde", "to": "Hasta", "res": "De {a} a {b}: {k} km por carretera, unos {t} en coche.", "towns_t": "Entre ciudades, aeropuertos y puerto", "places_t": "De los aeropuertos a cada lugar",
        "place": "Lugar", "area": "Regencia", "pairs_t": "De ciudad a ciudad, con las paradas del camino", "method_t": "Cómo se han calculado estas cifras",
        "method": "Las distancias por carretera salen del motor de rutas OSRM (router.project-osrm.org) con los datos de carreteras de OpenStreetMap, consultado el {d}, por la ruta más rápida en coche. Los tiempos son una estimación propia: la distancia dividida entre una velocidad media de 34 a 42 km/h, el ritmo al que los 170 km entre Tambolaka y Waingapu se recorren en 4 o 5 horas sin paradas largas. No publicamos los tiempos del motor de rutas porque suponen velocidades de carretera abierta que en Sumba no se alcanzan: casi todas las carreteras tienen un carril por sentido, hay muchas curvas en las colinas entre Waikabubak y Waingapu, y caballos, búfalos y escolares comparten la calzada. La lluvia, las obras y las pistas del tramo final suman más. Cuando el punto del mapa queda lejos de una carretera cartografiada (algunas cascadas y playas), el último tramo se hace a pie o por pista y no está contado.",
        "dl": "Descargar la tabla completa", "kicker": "Datos", "crumb": "Distancias",
        "pair_title": "De {a} a {b}: distancia, tiempo en coche y paradas", "pair_h1": "De {a} a {b} por carretera", "pair_desc": "De {a} a {b} hay {k} km por carretera, unos {t} en coche. Mapa de la ruta, lugares del camino y a qué distancia queda cada uno de la carretera.",
        "pair_p1": "La carretera de {a} a {b} mide {k} km y se recorre en unos {t} en coche sin paradas largas. La distancia sale del motor de rutas OSRM sobre las carreteras de OpenStreetMap ({d}); el tiempo es nuestra estimación a una media de entre 34 y 42 km/h. En línea recta las dos ciudades están a {s} km, así que la carretera es {r} veces más larga que la línea directa.",
        "pair_p2": "Las mismas cifras valen en sentido contrario, de {b} a {a}. Cuenta con tiempo extra para las paradas, los tramos lentos detrás de camiones y la posibilidad de lluvia entre noviembre y abril.",
        "stops_t": "Lugares cerca de esta carretera", "stops_p": "Fichas de The Sumba Times que quedan a menos de {x} km de la ruta, en orden desde {a}. La segunda columna es el punto de la ruta donde está el desvío y la tercera la distancia en línea recta de la carretera al lugar.",
        "stops_none": "Ninguna ficha queda a menos de {x} km de esta carretera.", "at_km": "En el km", "off": "Desde la carretera", "other_t": "Otras rutas entre ciudades", "map_alt": "Mapa de la carretera de {a} a {b} en Sumba",
        "how": "Cómo hacer el trayecto", "how_p": "No hay tren ni aplicaciones de transporte entre ciudades. La mayoría de los visitantes alquila un coche con conductor; por la mañana circulan autobuses y minibuses compartidos entre las ciudades.",
        "m_title": "Mapa de Sumba: {n} lugares por regencia", "m_h1": "Mapa de Sumba: todos los lugares que cubrimos", "m_desc": "Mapa de la isla de Sumba con {n} playas, cascadas, aldeas tradicionales, colinas y ciudades, agrupadas por regencia, con la distancia por carretera desde cada aeropuerto.",
        "m_lead": "Sumba es una isla de Indonesia, en la provincia de Nusa Tenggara Oriental, de unos 210 km de oeste a este. Tiene cuatro regencias, dos aeropuertos (Tambolaka al oeste y Waingapu al este) y ninguna carretera que dé la vuelta completa a la costa. El mapa muestra los {n} lugares que tienen ficha propia en The Sumba Times.",
        "m_inter": "Abrir el mapa interactivo", "m_reg": "regencia", "m_crumb": "Mapa",
        "q_title": "Terremotos cerca de Sumba desde 2000: lista y mapa", "q_h1": "Terremotos cerca de Sumba desde 2000", "q_desc": "{n} terremotos de magnitud 5 o más a menos de 250 km de Sumba desde 2000, según el catálogo del USGS: los diez mayores, un mapa y el recuento por año.",
        "q_lead": "El catálogo del USGS recoge {n} terremotos de magnitud 5,0 o más a menos de 250 km del centro de Sumba entre el 1 de enero de 2000 y el {d}. El mayor fue de magnitud {m} el {md} ({mp}). El más reciente fue de magnitud {lm} el {ld} ({lp}).",
        "q_why": "Sumba queda justo al norte de la fosa de Java, donde la placa australiana se hunde bajo la placa de la Sonda, y al sur de la falla de retroarco de Flores. Son {avg} de media al año. El terremoto de Sumba de 1977 (magnitud 8,3, fuera del periodo de esta lista) provocó un tsunami en las costas del sur de Sumba y Sumbawa.",
        "q_top": "Los diez mayores", "q_year": "Terremotos por año", "q_all": "Los {n} terremotos", "q_date": "Fecha (UTC)", "q_mag": "Magnitud", "q_where": "Localización (USGS)", "q_depth": "Profundidad", "q_dist": "Desde el centro de Sumba", "q_n": "Número",
        "q_method": "Fuente: catálogo de terremotos del USGS, consulta del {d}: magnitud 5,0 o más, a menos de 250 km de 9,7° S, 120,0° E, desde el 1 de enero de 2000. Las magnitudes que publica la BMKG de Indonesia para los mismos sismos pueden diferir en unas décimas. Las distancias son en línea recta del epicentro al centro de la isla.",
        "q_do": "Qué hacer", "q_do_p": "Si notas un terremoto fuerte o largo cerca de la costa, sube a un lugar alto sin esperar un aviso. La información oficial la publica la BMKG.", "q_crumb": "Terremotos", "q_map_alt": "Mapa de epicentros de terremotos de magnitud 5 o más alrededor de Sumba desde 2000",
        "x_title": "Datos abiertos de Sumba: lugares, distancias, clima, vuelos y más", "x_h1": "Datos de Sumba para descargar", "x_desc": "Tablas sobre Sumba para descargar en CSV, JSON y GeoJSON: lugares con coordenadas, distancias por carretera, clima mensual, vuelos, eventos, terremotos y glosario.",
        "x_lead": "Estas son las tablas que hay detrás de las páginas de The Sumba Times, listas para descargar. Periodistas, estudiantes, guías y desarrolladores pueden reutilizarlas citando a The Sumba Times y enlazando esta página. Cada archivo indica su fuente y la fecha de los datos.",
        "x_file": "Archivo", "x_rows": "Filas", "x_what": "Qué contiene", "x_src": "Fuente", "x_lic": "Reutilización", "x_lic_p": "Nuestra recopilación se puede reutilizar con cita y enlace. Las fuentes de origen mantienen sus condiciones: los datos de OpenStreetMap están bajo ODbL, el catálogo del USGS es de dominio público y los datos ERA5 de Open-Meteo están bajo CC BY 4.0. Las filas de vuelos y eventos citan la fuente de cada dato en su página.", "x_crumb": "Datos"},
 "id": {"d_title": "Jarak dan waktu tempuh di Sumba: tabel dan kalkulator", "d_h1": "Jarak dan waktu tempuh di Sumba",
        "d_desc": "Jarak lewat jalan darat dan waktu berkendara antara Tambolaka, Waikabubak, Waibakul, Waingapu, dua bandara, dan {n} tempat wisata di Sumba. Dihitung dari data jalan OpenStreetMap.",
        "d_lead": "Berapa jauh dan berapa jam? Halaman ini memuat jarak lewat jalan darat dan waktu berkendara antara empat kota di Sumba, dua bandaranya, Pelabuhan Waikelo, dan {n} pantai, air terjun, kampung adat, dan bukit. Pilih dua titik di kalkulator atau baca tabelnya.",
        "calc_t": "Kalkulator jarak", "from": "Dari", "to": "Ke", "res": "{a} ke {b}: {k} km lewat jalan darat, sekitar {t} berkendara.", "towns_t": "Antarkota, bandara, dan pelabuhan", "places_t": "Dari bandara ke setiap tempat wisata",
        "place": "Tempat", "area": "Kabupaten", "pairs_t": "Rute antarkota dan tempat singgah di jalan", "method_t": "Cara angka ini dihitung",
        "method": "Jarak lewat jalan berasal dari mesin rute OSRM (router.project-osrm.org) yang memakai data jalan OpenStreetMap, diambil pada {d}, mengikuti rute tercepat dengan mobil. Waktu tempuh adalah perkiraan kami sendiri: jarak dibagi kecepatan rata-rata 34 sampai 42 km/jam, yaitu laju yang membuat 170 km antara Tambolaka dan Waingapu ditempuh 4 sampai 5 jam tanpa berhenti lama. Kami tidak memuat waktu dari mesin rute karena angkanya mengandaikan kecepatan jalan lapang yang tidak mungkin di Sumba: sebagian besar jalan hanya satu lajur per arah, banyak tikungan di perbukitan antara Waikabubak dan Waingapu, dan kuda, kerbau, serta anak sekolah ikut memakai jalan. Hujan, perbaikan jalan, dan jalan tanah di ujung rute menambah waktu. Jika titik di peta jauh dari jalan yang terpetakan (beberapa air terjun dan pantai), bagian terakhir ditempuh dengan berjalan kaki atau lewat jalan tanah dan tidak ikut dihitung.",
        "dl": "Unduh tabel lengkap", "kicker": "Data", "crumb": "Jarak",
        "pair_title": "{a} ke {b}: jarak, waktu tempuh, dan tempat singgah", "pair_h1": "{a} ke {b} lewat jalan darat", "pair_desc": "Jarak {a} ke {b} {k} km lewat jalan darat, sekitar {t} berkendara. Peta rute, tempat wisata di sepanjang jalan, dan jarak tiap tempat dari jalan utama.",
        "pair_p1": "Jalan dari {a} ke {b} panjangnya {k} km dan ditempuh sekitar {t} dengan mobil tanpa berhenti lama. Jaraknya berasal dari mesin rute OSRM di atas data jalan OpenStreetMap ({d}); waktunya perkiraan kami dengan kecepatan 34 sampai 42 km/jam. Dalam garis lurus kedua kota berjarak {s} km, jadi jalannya {r} kali lebih panjang daripada garis lurus.",
        "pair_p2": "Angka yang sama berlaku untuk arah sebaliknya, dari {b} ke {a}. Siapkan waktu tambahan untuk singgah, ruas yang lambat di belakang truk, dan kemungkinan hujan antara November dan April.",
        "stops_t": "Tempat wisata di dekat jalan ini", "stops_p": "Halaman tempat di The Sumba Times yang berada kurang dari {x} km dari rute, berurutan dari {a}. Kolom kedua adalah titik rute tempat persimpangannya, kolom ketiga jarak garis lurus dari jalan ke tempat itu.",
        "stops_none": "Tidak ada halaman tempat yang berada kurang dari {x} km dari jalan ini.", "at_km": "Di km", "off": "Dari jalan", "other_t": "Rute antarkota lainnya", "map_alt": "Peta jalan dari {a} ke {b} di Sumba",
        "how": "Cara menempuhnya", "how_p": "Tidak ada kereta dan tidak ada ojek daring antarkota. Sebagian besar wisatawan menyewa mobil dengan sopir; bus dan travel antarkota berangkat pada pagi hari.",
        "m_title": "Peta Sumba: {n} tempat wisata per kabupaten", "m_h1": "Peta Sumba: semua tempat yang kami liput", "m_desc": "Peta Pulau Sumba dengan {n} pantai, air terjun, kampung adat, bukit, dan kota, dikelompokkan per kabupaten, lengkap dengan jarak lewat jalan dari tiap bandara.",
        "m_lead": "Sumba adalah pulau di Provinsi Nusa Tenggara Timur, Indonesia, dengan panjang sekitar 210 km dari barat ke timur. Pulau ini terdiri atas empat kabupaten, memiliki dua bandara (Tambolaka di barat dan Waingapu di timur), dan tidak punya jalan yang mengelilingi seluruh pesisir. Peta ini menampilkan {n} tempat yang punya halaman sendiri di The Sumba Times.",
        "m_inter": "Buka peta interaktif", "m_reg": "kabupaten", "m_crumb": "Peta",
        "q_title": "Gempa bumi di sekitar Sumba sejak 2000: daftar dan peta", "q_h1": "Gempa bumi di sekitar Sumba sejak 2000", "q_desc": "{n} gempa bermagnitudo 5 atau lebih dalam radius 250 km dari Sumba sejak 2000 menurut katalog USGS: sepuluh terbesar, peta, dan jumlah per tahun.",
        "q_lead": "Katalog USGS mencatat {n} gempa bermagnitudo 5,0 atau lebih dalam radius 250 km dari pusat Pulau Sumba antara 1 Januari 2000 dan {d}. Yang terbesar bermagnitudo {m} pada {md} ({mp}). Yang terbaru bermagnitudo {lm} pada {ld} ({lp}).",
        "q_why": "Sumba terletak tepat di utara Palung Jawa, tempat Lempeng Australia menunjam ke bawah Lempeng Sunda, dan di selatan Sesar Naik Busur Belakang Flores. Rata-ratanya {avg} gempa per tahun. Gempa Sumba 1977 (magnitudo 8,3, di luar periode daftar ini) memicu tsunami di pesisir selatan Sumba dan Sumbawa.",
        "q_top": "Sepuluh terbesar", "q_year": "Jumlah gempa per tahun", "q_all": "Seluruh {n} gempa", "q_date": "Tanggal (UTC)", "q_mag": "Magnitudo", "q_where": "Lokasi (USGS)", "q_depth": "Kedalaman", "q_dist": "Dari pusat Sumba", "q_n": "Jumlah",
        "q_method": "Sumber: Katalog Gempa USGS, kueri {d}: magnitudo 5,0 atau lebih, dalam radius 250 km dari 9,7° LS, 120,0° BT, sejak 1 Januari 2000. Magnitudo yang dirilis BMKG untuk gempa yang sama bisa berbeda beberapa persepuluh. Jarak dihitung garis lurus dari episentrum ke pusat pulau.",
        "q_do": "Apa yang harus dilakukan", "q_do_p": "Jika merasakan gempa kuat atau lama di dekat pantai, segera menuju tempat tinggi tanpa menunggu peringatan. Informasi resmi dikeluarkan oleh BMKG.", "q_crumb": "Gempa bumi", "q_map_alt": "Peta episentrum gempa bermagnitudo 5 atau lebih di sekitar Sumba sejak 2000",
        "x_title": "Data terbuka Sumba: tempat, jarak, iklim, penerbangan, dan lainnya", "x_h1": "Data Sumba untuk diunduh", "x_desc": "Tabel tentang Sumba untuk diunduh dalam format CSV, JSON, dan GeoJSON: tempat dengan koordinat, jarak lewat jalan, iklim bulanan, penerbangan, acara, gempa, dan glosarium.",
        "x_lead": "Inilah tabel di balik halaman-halaman The Sumba Times, siap diunduh. Jurnalis, pelajar, pemandu, dan pengembang boleh memakainya kembali dengan menyebut The Sumba Times dan menautkan halaman ini. Setiap berkas mencantumkan sumber dan tanggal datanya.",
        "x_file": "Berkas", "x_rows": "Baris", "x_what": "Isi", "x_src": "Sumber", "x_lic": "Pemakaian ulang", "x_lic_p": "Kompilasi kami boleh dipakai ulang dengan menyebut sumber dan menautkan halaman ini. Sumber asalnya tetap mengikuti ketentuan masing-masing: data OpenStreetMap berlisensi ODbL, katalog USGS merupakan domain publik, dan data ERA5 dari Open-Meteo berlisensi CC BY 4.0. Baris penerbangan dan acara menyebut sumber tiap data di halamannya.", "x_crumb": "Data"},
}
SITEMAP = ["/{l}/distances/", "/{l}/map/", "/{l}/earthquakes/", "/{l}/data/"] + ["/{l}/distances/" + pair_slug(a, b) + "/" for a, b in PAIRS]
FOOTER = [("/{l}/distances/", {"en": "Distances", "es": "Distancias", "id": "Jarak"}), ("/{l}/data/", {"en": "Data", "es": "Datos", "id": "Data"})]
CSS = """
.gbox{margin:26px 0 0;border-top:3px solid var(--ink);padding-top:8px}.gbox h2{font-size:22px;margin:.2em 0 .4em}.gbox dl{display:grid;grid-template-columns:max-content 1fr;gap:6px 14px;margin:8px 0 12px;font:15px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.gbox dt{font-weight:700}.gbox dd{margin:0}
.gsent,.gcomb,.gnote{font:15.5px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.gnote{color:var(--muted);font-size:13.5px}.gnb{list-style:none;padding:0;margin:0 0 12px;font:15px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.gnb li{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid var(--line);padding:7px 0}.gnb span{color:var(--muted);white-space:nowrap}
.gfig{margin:10px 0}.gfig figcaption{font:12.5px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:var(--muted);margin-top:4px}.lmap{width:100%;height:auto;display:block;background:color-mix(in srgb,var(--accent) 6%,var(--bg));border:1px solid var(--line);border-radius:6px;color:var(--ink)}
.gtab{width:100%;border-collapse:collapse;font:14.5px/1.35 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:8px 0 18px}.gtab th,.gtab td{border-bottom:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}.gtab th{font-size:12.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}.gtab td.n,.gtab th.n{text-align:right;white-space:nowrap}.gscroll{overflow-x:auto}
.gcalc{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:6px;padding:14px 16px;margin:0 0 18px;font:15.5px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.gcalc label{display:inline-block;margin:0 12px 8px 0}.gcalc select{font:inherit;padding:6px;max-width:100%}.gcalc output{display:block;font-weight:700;margin-top:6px}
@media(max-width:600px){.gbox dl{grid-template-columns:1fr}.gbox dt{margin-top:6px}}
"""

def _table(head, rows, num_from=1):
    th = "".join(f'<th{" class=n" if i >= num_from else ""}>{h}</th>' for i, h in enumerate(head))
    tr = "".join("<tr>" + "".join(f'<td{" class=n" if i >= num_from else ""}>{c}</td>' for i, c in enumerate(r)) + "</tr>" for r in rows)
    return f'<div class="gscroll" tabindex="0" role="region" aria-label="{re.sub("<[^>]+>", "", head[0] or head[1])}"><table class="gtab"><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table></div>'
def _place_rows(g):
    its = _items(g)
    return [(i, its[p["k"]]) for i, p in enumerate(PTS) if not p.get("hub") and p["k"] in its and not pages_hubs._is_area(its[p["k"]]) and km(i, 0) is not None]
def _crumbs(l, g): return [(g["X"][l]["home"], f"/{l}/")]
def _ds(name, desc, url, files, l, date=None):
    return {"@context": "https://schema.org", "@type": "Dataset", "name": name, "description": desc, "url": url, "inLanguage": l, "dateModified": date or FETCHED, "isAccessibleForFree": True,
            "creator": {"@type": "NewsMediaOrganization", "@id": pages_hubs.BASE + "/#organization", "name": "The Sumba Times", "url": pages_hubs.BASE + "/"},
            "spatialCoverage": {"@type": "Place", "name": "Sumba, East Nusa Tenggara, Indonesia"},
            "distribution": [{"@type": "DataDownload", "encodingFormat": fmt, "contentUrl": pages_hubs.BASE + f} for f, fmt in files]}

def _distances(g, l):
    t = P[l]; s_ = S[l]; rows = _place_rows(g); n = len(rows); tpl = "/{l}/distances/"
    hubs = ["tmc", "tambolaka", "waikelo", "waikabubak", "waibakul", "waingapu", "wgp"]
    head = [""] + [esc(HUB[h][l]) for h in hubs]
    m = [[f"<b>{esc(HUB[a][l])}</b>"] + [("·" if a == b else f'{num(km(IDX[a], IDX[b]), l)} km<br><small>{drv(km(IDX[a], IDX[b]), l)}</small>') for b in hubs] for a in hubs]
    pr = sorted(rows, key=lambda r: km(r[0], 0))
    prow = [[f'<a href="{g["url_of"](a, l)}">{esc(pages_hubs.pname(a, l))}</a>', esc(pages_hubs.area_l(a, l)), f"{num(km(i, 0), l)} km", drv(km(i, 0), l), f"{num(km(i, 1), l)} km", drv(km(i, 1), l)] for i, a in pr]
    # calculator data: names and the two matrices for every point with a page or a hub
    keep = [IDX[h] for h in hubs] + [i for i, _ in rows]
    names = [HUB[PTS[i]["k"]][l] if PTS[i].get("hub") else pages_hubs.pname(_items(g)[PTS[i]["k"]], l) for i in keep]
    data = {"n": names, "k": [[km(a, b) for b in keep] for a in keep]}
    opts = "".join(f'<option value="{i}">{esc(nm)}</option>' for i, nm in sorted(enumerate(names), key=lambda x: (x[0] >= len(hubs), x[1].lower() if x[0] >= len(hubs) else x[0])))
    to_w = {"en": " to ", "es": " a ", "id": " sampai "}[l]; under = {"en": "under 10 min", "es": "menos de 10 min", "id": "kurang dari 10 menit"}[l]
    js = ("<script>(function(){var D=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";var a=document.getElementById('ga'),b=document.getElementById('gb'),o=document.getElementById('go');"
          "function d(m){if(m<60)return m+' " + s_["min"] + "';var h=Math.floor(m/60),r=m%60;return h+' " + s_["h"] + "'+(r?' '+r+' " + s_["min"] + "':'')}"
          "function r5(x){return Math.max(5,Math.round(x/5)*5)}function tt(k){var lo=r5(k/" + str(V_FAST) + "*60),hi=r5(k/" + str(V_SLOW) + "*60);if(hi<=5)return '" + under + "';return lo===hi?d(lo):d(lo)+'" + to_w + "'+d(hi)}"
          "function f(){var i=+a.value,j=+b.value;if(i===j||D.k[i][j]==null){o.textContent='';return}var k=D.k[i][j];o.textContent=" + json.dumps(t["res"], ensure_ascii=False) +
          ".replace('{a}',D.n[i]).replace('{b}',D.n[j]).replace('{k}'," + ("String(k)" if l == "en" else "String(k).replace('.',',')") + ").replace('{t}',tt(k))}"
          "a.onchange=b.onchange=f;b.selectedIndex=" + str(len(hubs) - 1) + ";f()})()</script>")
    pairs = "<ul>" + "".join(f'<li><a href="/{l}/distances/{pair_slug(a, b)}/">{t["pair_h1"].format(a=HUB[a][l], b=HUB[b][l])}</a>: {num(ROUTES["routes"][a + "|" + b]["km"], l)} km, {drv(ROUTES["routes"][a + "|" + b]["km"], l)}</li>' for a, b in PAIRS) + "</ul>"
    body = (f'<p class="dek">{esc(t["d_lead"].format(n=n))}</p><div class="gcalc" data-block="calc"><b>{t["calc_t"]}</b><br><label>{t["from"]} <select id="ga">{opts}</select></label><label>{t["to"]} <select id="gb">{opts}</select></label><output id="go" aria-live="polite"></output></div>'
            f'<h2 id="towns">{t["towns_t"]}</h2>{_table(head, m)}<h2 id="routes">{t["pairs_t"]}</h2>{pairs}<h2 id="places">{t["places_t"]}</h2>'
            + _table([t["place"], t["area"], esc(HUB["tmc"][l]), "", esc(HUB["wgp"][l]), ""], prow, 2) +
            f'<h2 id="method">{t["method_t"]}</h2><p>{esc(t["method"].format(d=fdate(g, l)))}</p><p><a href="/data/sumba-distances.csv">{t["dl"]} (CSV)</a> · <a href="/{l}/data/">{P[l]["x_h1"]}</a> · <a href="/{l}/map/">{P[l]["m_h1"]}</a></p>')
    url = pages_hubs.BASE + tpl.format(l=l)
    pages_hubs._page(g, l, tpl, t["d_title"], t["d_desc"].format(n=n), t["d_h1"], _crumbs(l, g), body,
                     [_ds(t["d_h1"], t["d_desc"].format(n=n), url, [("/data/sumba-distances.csv", "text/csv")], l)], t["kicker"], js)

def _seg_dist(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay; q = dx * dx + dy * dy
    u = 0 if q == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / q))
    return math.hypot(px - (ax + u * dx), py - (ay + u * dy)), u
def _along(line, lat, lon):
    """(km from the route in a straight line, km along the route of the closest point)."""
    kx = 111.32 * math.cos(math.radians(9.6)); ky = 110.57
    pts = [(x * kx, y * ky) for x, y in line]; px, py = lon * kx, lat * ky
    best = (1e9, 0); acc = 0
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        seg = math.hypot(bx - ax, by - ay); d, u = _seg_dist(px, py, ax, ay, bx, by)
        if d < best[0]: best = (d, acc + u * seg)
        acc += seg
    return best[0], best[1], acc
OFF_KM = 8
def _pair(g, l, a, b):
    t = P[l]; r = ROUTES["routes"][a + "|" + b]; A, B = HUB[a][l], HUB[b][l]; tpl = "/{l}/distances/" + pair_slug(a, b) + "/"
    pa, pb = PTS[IDX[a]], PTS[IDX[b]]; sl = pages_hubs.hav(pa["lat"], pa["lon"], pb["lat"], pb["lon"])
    stops = []
    for i, it in _place_rows(g):
        if it["slug"] in (HUB_PAGE[a], HUB_PAGE[b]): continue
        off, at, total = _along(r["line"], PTS[i]["lat"], PTS[i]["lon"])
        if off <= OFF_KM: stops.append((at * r["km"] / total, off, i, it))
    stops.sort(key=lambda x: x[0])
    if stops:
        st = f'<p>{esc(t["stops_p"].format(x=OFF_KM, a=A))}</p>' + _table([t["place"], t["at_km"], t["off"]], [[f'<a href="{g["url_of"](it, l)}">{esc(pages_hubs.pname(it, l))}</a> <small>({esc(pages_hubs.area_l(it, l))})</small>', num(round(at), l), f"{num(round(off, 1), l)} km"] for at, off, i, it in stops])
    else: st = f'<p>{esc(t["stops_none"].format(x=OFF_KM))}</p>'
    dots = [(PTS[i]["lon"], PTS[i]["lat"], 3.5, "#1f7a8c") for _, _, i, _ in stops] + [(pa["lon"], pa["lat"], 6, "#a3271c"), (pb["lon"], pb["lat"], 6, "#a3271c")]
    labels = [(pa["lon"], pa["lat"], A, "start" if pa["lon"] < 119.5 else "end"), (pb["lon"], pb["lat"], B, "end" if pb["lon"] > 119.9 else "middle")]
    ga = _url(g, "getting-around-sumba", l); cw = _url(g, "car-with-driver-in-sumba", l)
    how = f'<h2 id="how">{t["how"]}</h2><p>{esc(t["how_p"])}' + (f' <a href="{cw}">{esc(_items(g)["car-with-driver-in-sumba"][l]["title"])}</a>.' if cw else "") + (f' <a href="{ga}">{esc(_items(g)["getting-around-sumba"][l]["title"])}</a>.' if ga else "") + "</p>"
    ends = "".join(f' <a href="{_url(g, HUB_PAGE[k], l)}">{esc(HUB[k][l])}</a>' for k in (a, b) if _url(g, HUB_PAGE[k], l))
    other = "<ul>" + "".join(f'<li><a href="/{l}/distances/{pair_slug(x, y)}/">{t["pair_h1"].format(a=HUB[x][l], b=HUB[y][l])}</a></li>' for x, y in PAIRS if (x, y) != (a, b)) + "</ul>"
    kw = dict(a=A, b=B, k=num(r["km"], l), t=drv(r["km"], l), s=num(round(sl), l), r=num(round(r["km"] / sl, 1), l), d=fdate(g, l))
    body = (f'<div class="ans"><b>{g["T"][l]["answer"]}</b><p>{esc(t["pair_desc"].format(**kw).split(". ")[0])}.</p></div><p>{esc(t["pair_p1"].format(**kw))}</p>'
            f'<figure class="gfig">{svg(l, t["map_alt"].format(a=A, b=B), dots, [r["line"]], labels)}<figcaption>{esc(t["map_alt"].format(a=A, b=B))}. © OpenStreetMap, OSRM.</figcaption></figure>'
            f'<p>{esc(t["pair_p2"].format(**kw))}{ends}</p><h2 id="stops">{t["stops_t"]}</h2>{st}{how}<h2 id="more">{t["other_t"]}</h2>{other}<p class="gnote">{esc(t["method"].format(d=fdate(g, l)))}</p>')
    faq = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": t["pair_h1"].format(a=A, b=B) + "?", "acceptedAnswer": {"@type": "Answer", "text": t["pair_p1"].format(**kw)}}]}
    pages_hubs._page(g, l, tpl, t["pair_title"].format(a=A, b=B), t["pair_desc"].format(**kw), t["pair_h1"].format(a=A, b=B), _crumbs(l, g) + [(t["crumb"], f"/{l}/distances/")], body, [faq], t["kicker"])

def _map(g, l):
    t = P[l]; rows = _place_rows(g); n = len(rows); tpl = "/{l}/map/"
    col = {"beach": "#1f7a8c", "water": "#2a6fdb", "village": "#a3271c", "view": "#c77d1a", "nature": "#3d7a3a", "town": "#555"}
    def typ(a): return g["ptype"]({"name": a["places"][0]["name"], "url": a})
    dots = [(PTS[i]["lon"], PTS[i]["lat"], 4.5, col.get(typ(a), "#555")) for i, a in rows]
    legend = " · ".join(f'<span style="color:{c}">●</span> {g["PTYPES"][k][1][l]}' for k, c in col.items())
    groups = {}
    for i, a in rows: groups.setdefault(pages_hubs.area_l(a, l) or "Sumba", []).append((i, a))
    lists = ""
    for area, its in sorted(groups.items(), key=lambda kv: min(PTS[i]["lon"] for i, _ in kv[1])):
        its.sort(key=lambda r: PTS[r[0]]["lon"])
        lists += f'<h2 id="{g["slugify"](area)}">{esc(area)} ({len(its)})</h2>' + _table([t["place"] if False else P[l]["place"], esc(HUB["tmc"][l]), esc(HUB["wgp"][l])],
            [[f'<a href="{g["url_of"](a, l)}">{esc(pages_hubs.pname(a, l))}</a><br><small>{esc(g["PTYPES"][typ(a)][1][l])} · {PTS[i]["lat"]:.3f}, {PTS[i]["lon"]:.3f}</small>', f"{num(km(i, 0), l)} km<br><small>{drv(km(i, 0), l)}</small>", f"{num(km(i, 1), l)} km<br><small>{drv(km(i, 1), l)}</small>"] for i, a in its])
    regs = [a for a in g["all_items"]() if a["section"] == "places" and pages_hubs._is_area(a)]
    regl = " · ".join(f'<a href="{g["url_of"](a, l)}">{esc(pages_hubs.pname(a, l))}</a>' for a in regs)
    body = (f'<p class="dek">{esc(t["m_lead"].format(n=n))}</p><figure class="gfig">{svg(l, t["m_h1"], dots + town_dots(), labels=town_labels(l))}<figcaption>{legend}. © OpenStreetMap.</figcaption></figure>'
            f'<p><a href="/{l}/plan/#map">{t["m_inter"]} →</a> · <a href="/{l}/distances/">{P[l]["d_h1"]}</a> · <a href="/data/sumba-places.geojson">GeoJSON</a> · <a href="/data/sumba-places.csv">CSV</a></p><p>{regl}</p>{lists}<p class="gnote">{esc(t["method"].format(d=fdate(g, l)))}</p>')
    il = {"@context": "https://schema.org", "@type": "ItemList", "name": t["m_h1"], "numberOfItems": n, "itemListElement": [{"@type": "ListItem", "position": k + 1, "name": pages_hubs.pname(a, l), "url": pages_hubs.BASE + g["url_of"](a, l)} for k, (i, a) in enumerate(rows)]}
    pages_hubs._page(g, l, tpl, t["m_title"].format(n=n), t["m_desc"].format(n=n), t["m_h1"], _crumbs(l, g), body, [il], t["kicker"])

CENTRE = (-9.65, 119.95)
def _qdate(g, e, l): return g["fdate"]({"date": datetime.datetime.fromtimestamp(e["t"] / 1000, datetime.timezone.utc).strftime("%Y-%m-%d"), "time": "06:00"}, l, False)
def _quakes(g, l):
    t = P[l]; E = QUAKES["events"]; n = len(E); tpl = "/{l}/earthquakes/"
    big = max(E, key=lambda e: e["m"]); last = max(E, key=lambda e: e["t"])
    def dist(e): return pages_hubs.hav(CENTRE[0], CENTRE[1], e["lat"], e["lon"])
    def row(e): return [_qdate(g, e, l), num(e["m"], l) if e["m"] != int(e["m"]) else num(e["m"], l) + (",0" if l != "en" else ".0"), esc(e["place"]), f'{e["depth"]} km', f"{int(round(dist(e)))} km"]
    head = [t["q_date"], t["q_mag"], t["q_where"], t["q_depth"], t["q_dist"]]
    top = sorted(E, key=lambda e: (-e["m"], -e["t"]))[:10]
    years = {}
    for e in E:
        y = datetime.datetime.fromtimestamp(e["t"] / 1000, datetime.timezone.utc).year; years[y] = years.get(y, 0) + 1
    ymax = max(years.values())
    bars = "".join(f'<tr><td>{y}</td><td class="n">{years.get(y, 0)}</td><td style="width:70%"><span style="display:block;height:10px;background:var(--accent);width:{years.get(y, 0) / ymax * 100:.0f}%"></span></td></tr>' for y in range(2000, max(years) + 1))
    # wider frame for the epicentre map
    dots = [(e["lon"], e["lat"], 2 + (e["m"] - 5) * 2.2, "#a3271c") for e in E if LON0 <= e["lon"] <= LON1 and LAT0 <= e["lat"] <= LAT1]
    inside = len(dots)
    kw = dict(n=n, d=fdate(g, l, QUAKES["fetched"]), m=num(big["m"], l), md=_qdate(g, big, l), mp=big["place"], lm=num(last["m"], l), ld=_qdate(g, last, l), lp=last["place"])
    sf = _url(g, "sumba-travel-safety-health", l)
    cap = {"en": f"The {inside} epicentres that fall inside the frame of this map; the rest lie further out to sea or under Flores and Sumbawa.", "es": f"Los {inside} epicentros que caen dentro del marco de este mapa; el resto queda mar adentro o bajo Flores y Sumbawa.", "id": f"{inside} episentrum yang berada di dalam bingkai peta ini; sisanya berada lebih jauh di laut atau di bawah Flores dan Sumbawa."}[l]
    body = (f'<div class="ans"><b>{g["T"][l]["answer"]}</b><p>{esc(t["q_lead"].format(**kw))}</p></div><p>{esc(t["q_why"].format(avg=num(round(n / ((big["t"] * 0 + max(e["t"] for e in E)) / 1000 - 946684800) * 31557600, 1), l)))}</p>'
            f'<figure class="gfig">{svg(l, t["q_map_alt"], dots + town_dots(), labels=town_labels(l))}<figcaption>{esc(cap)} USGS, © OpenStreetMap.</figcaption></figure>'
            f'<h2 id="largest">{t["q_top"]}</h2>{_table(head, [row(e) for e in top])}<h2 id="years">{t["q_year"]}</h2><div class="gscroll" tabindex="0" role="region" aria-label="{esc(t["q_year"])}"><table class="gtab"><tbody>{bars}</tbody></table></div>'
            f'<h2 id="do">{t["q_do"]}</h2><p>{esc(t["q_do_p"])} <a href="https://www.bmkg.go.id/gempabumi/gempabumi-terkini.bmkg" rel="nofollow noopener" target="_blank">BMKG</a>.' + (f' <a href="{sf}">{esc(_items(g)["sumba-travel-safety-health"][l]["title"])}</a>.' if sf else "") + "</p>"
            f'<details><summary><b>{esc(t["q_all"].format(n=n))}</b></summary>{_table(head, [row(e) for e in sorted(E, key=lambda e: -e["t"])])}</details>'
            f'<p class="gnote">{esc(t["q_method"].format(d=fdate(g, l, QUAKES["fetched"])))} <a href="https://earthquake.usgs.gov/earthquakes/search/" rel="nofollow noopener" target="_blank">USGS</a> · <a href="/data/sumba-earthquakes.csv">CSV</a></p>')
    url = pages_hubs.BASE + tpl.format(l=l)
    pages_hubs._page(g, l, tpl, t["q_title"], t["q_desc"].format(n=n), t["q_h1"], _crumbs(l, g), body,
                     [_ds(t["q_h1"], t["q_desc"].format(n=n), url, [("/data/sumba-earthquakes.csv", "text/csv")], l, QUAKES["fetched"])], t["kicker"])

def _csv(rows):
    f = io.StringIO(); csv.writer(f, lineterminator="\n").writerows(rows); return f.getvalue()
FILES = []   # (path, format, rows, {lang: description}, source)
def _files(g):
    """Writes /data/* once (language neutral, English headers) and fills FILES."""
    del FILES[:]
    rows = _place_rows(g); B = pages_hubs.BASE
    def typ(a): return g["ptype"]({"name": a["places"][0]["name"], "url": a})
    pl = [["slug", "name", "type", "regency", "lat", "lon", "road_km_from_tambolaka_airport", "drive_min_low_from_tambolaka_airport", "drive_min_high_from_tambolaka_airport", "road_km_from_waingapu_airport", "drive_min_low_from_waingapu_airport", "drive_min_high_from_waingapu_airport", "url_en", "url_es", "url_id"]]
    feats = []
    for i, a in rows:
        p = PTS[i]; r = [a["slug"], pages_hubs.pname(a, "en"), typ(a), p.get("area", ""), p["lat"], p["lon"], km(i, 0), tmin(km(i, 0))[0], tmin(km(i, 0))[1], km(i, 1), tmin(km(i, 1))[0], tmin(km(i, 1))[1]] + [B + g["url_of"](a, x) for x in ("en", "es", "id")]
        pl.append(r); feats.append({"type": "Feature", "geometry": {"type": "Point", "coordinates": [p["lon"], p["lat"]]}, "properties": dict(zip(pl[0][:4] + pl[0][6:], r[:4] + r[6:]))})
    g["write"]("/data/sumba-places.csv", _csv(pl))
    g["write"]("/data/sumba-places.geojson", json.dumps({"type": "FeatureCollection", "name": "Sumba places, The Sumba Times", "source": B + "/en/data/", "date": FETCHED, "features": feats}, ensure_ascii=False))
    src_osm = "The Sumba Times; road km from OSRM on OpenStreetMap roads, " + FETCHED + "; driving minutes estimated at 42 and 34 km/h"
    FILES.append(("/data/sumba-places.csv", "text/csv", len(pl) - 1, {"en": "Every place page: name, type, regency, coordinates and road distance and driving time from both airports.", "es": "Todas las fichas de lugares: nombre, tipo, regencia, coordenadas y distancia por carretera y tiempo en coche desde los dos aeropuertos.", "id": "Semua halaman tempat: nama, jenis, kabupaten, koordinat, serta jarak lewat jalan dan waktu tempuh dari kedua bandara."}, src_osm))
    FILES.append(("/data/sumba-places.geojson", "application/geo+json", len(feats), {"en": "The same places as points for any map software.", "es": "Los mismos lugares como puntos para cualquier programa de mapas.", "id": "Tempat yang sama dalam bentuk titik untuk perangkat lunak peta apa pun."}, src_osm))
    keep = [i for i, p in enumerate(PTS) if p.get("hub")] + [i for i, _ in rows]
    its = _items(g)
    def nm(i): return HUB[PTS[i]["k"]]["en"] if PTS[i].get("hub") else pages_hubs.pname(its[PTS[i]["k"]], "en")
    dd = [["from", "to", "road_km", "drive_min_low", "drive_min_high"]] + [[nm(a), nm(b), km(a, b), tmin(km(a, b))[0], tmin(km(a, b))[1]] for a in keep for b in keep if a != b and km(a, b) is not None]
    g["write"]("/data/sumba-distances.csv", _csv(dd))
    FILES.append(("/data/sumba-distances.csv", "text/csv", len(dd) - 1, {"en": "Road distance and driving time between every pair of towns, airports, port and places.", "es": "Distancia por carretera y tiempo en coche entre cada par de ciudades, aeropuertos, puerto y lugares.", "id": "Jarak lewat jalan dan waktu tempuh antara setiap pasangan kota, bandara, pelabuhan, dan tempat."}, src_osm))
    cl = [["month", "west_tmax_c", "west_tmin_c", "west_rain_mm", "west_rainy_days", "east_tmax_c", "east_tmin_c", "east_rain_mm", "east_rainy_days", "west_sunrise_first", "west_sunrise_last", "west_sunset_first", "west_sunset_last", "east_sunrise_first", "east_sunrise_last", "east_sunset_first", "east_sunset_last", "sea_temp_c"]]
    for m in pages_months.MONTHS:
        try: cl.append([m[0]] + list(m[1]) + list(m[2]) + list(m[3]) + list(m[4]) + [m[5]])
        except Exception: pass
    if len(cl) == 13:
        g["write"]("/data/sumba-climate-monthly.csv", _csv(cl))
        FILES.append(("/data/sumba-climate-monthly.csv", "text/csv", 12, {"en": "Monthly averages 2015-2024 for the west (Tambolaka) and east (Waingapu) coasts: temperatures, rain, rainy days, sunrise and sunset.", "es": "Medias mensuales 2015-2024 de la costa oeste (Tambolaka) y este (Waingapu): temperaturas, lluvia, días de lluvia, amanecer y atardecer.", "id": "Rata-rata bulanan 2015-2024 untuk pesisir barat (Tambolaka) dan timur (Waingapu): suhu, hujan, hari hujan, matahari terbit dan terbenam."}, "Open-Meteo ERA5 reanalysis 2015-2024"))
    fl = [["from", "to", "airline", "flight_minutes", "frequency", "note", "source"]] + [[f.get("from"), f.get("to"), f.get("airline"), f.get("mins"), (f.get("freq") or {}).get("en", ""), (f.get("note") or {}).get("en", ""), f.get("source", "")] for f in pages_live.FLIGHTS]
    g["write"]("/data/sumba-flights.csv", _csv(fl))
    FILES.append(("/data/sumba-flights.csv", "text/csv", len(fl) - 1, {"en": "Scheduled air routes to Tambolaka and Waingapu with airline, frequency and the source of each row.", "es": "Rutas aéreas regulares a Tambolaka y Waingapu con aerolínea, frecuencia y la fuente de cada fila.", "id": "Rute penerbangan berjadwal ke Tambolaka dan Waingapu dengan maskapai, frekuensi, dan sumber tiap baris."}, "The Sumba Times flight tracker, sources per row"))
    ev = [["id", "name", "where", "months", "kind", "source"]] + [[e.get("id"), e["name"]["en"], e["where"]["en"], " ".join(str(x) for x in e.get("months", [])), e.get("kind", ""), (e.get("sources") or [("", "")])[0][1]] for e in pages_live.EVENTS]
    g["write"]("/data/sumba-events.csv", _csv(ev))
    FILES.append(("/data/sumba-events.csv", "text/csv", len(ev) - 1, {"en": "Recurring festivals and ceremonies with place, usual months and source.", "es": "Fiestas y ceremonias recurrentes con lugar, meses habituales y fuente.", "id": "Festival dan upacara berkala dengan tempat, bulan pelaksanaan, dan sumber."}, "The Sumba Times events calendar, sources per row"))
    q = [["time_utc", "magnitude", "depth_km", "lat", "lon", "place", "usgs_id"]] + [[datetime.datetime.fromtimestamp(e["t"] / 1000, datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), e["m"], e["depth"], e["lat"], e["lon"], e["place"], e["id"]] for e in sorted(QUAKES["events"], key=lambda e: e["t"])]
    g["write"]("/data/sumba-earthquakes.csv", _csv(q))
    FILES.append(("/data/sumba-earthquakes.csv", "text/csv", len(q) - 1, {"en": "Earthquakes of magnitude 5 or more within 250 km of Sumba since 2000.", "es": "Terremotos de magnitud 5 o más a menos de 250 km de Sumba desde 2000.", "id": "Gempa bermagnitudo 5 atau lebih dalam radius 250 km dari Sumba sejak 2000."}, "USGS Earthquake Catalog, " + QUAKES["fetched"]))
    gl = [["term", "definition_en", "definition_es", "definition_id", "url"]] + [[t_["name"]["en"], t_["def"]["en"], t_["def"]["es"], t_["def"]["id"], B + "/en/glossary/" + t_["slug"] + "/"] for t_ in pages_hubs.TERMS]
    g["write"]("/data/sumba-glossary.csv", _csv(gl))
    FILES.append(("/data/sumba-glossary.csv", "text/csv", len(gl) - 1, {"en": "Sumbanese and Indonesian terms used in our reporting, with a short definition.", "es": "Términos sumbaneses e indonesios que usamos en las noticias, con una definición breve.", "id": "Istilah Sumba dan Indonesia yang kami pakai dalam pemberitaan, dengan definisi singkat."}, "The Sumba Times glossary"))

def _data(g, l):
    t = P[l]; tpl = "/{l}/data/"; B = pages_hubs.BASE
    rows = [[f'<a href="{f}" download>{f.split("/")[-1]}</a>', str(n), esc(d[l]), esc(src)] for f, fmt, n, d, src in FILES]
    more = {"en": "Related pages", "es": "Páginas relacionadas", "id": "Halaman terkait"}[l]
    links = " · ".join(f'<a href="/{l}/{p}/">{n}</a>' for p, n in (("distances", P[l]["d_h1"]), ("map", P[l]["m_h1"]), ("earthquakes", P[l]["q_h1"]), ("sumba-in", {"en": "Sumba month by month", "es": "Sumba mes a mes", "id": "Sumba dari bulan ke bulan"}[l]), ("flights", {"en": "Flights to Sumba", "es": "Vuelos a Sumba", "id": "Penerbangan ke Sumba"}[l]), ("events", {"en": "Events", "es": "Eventos", "id": "Acara"}[l]), ("glossary", {"en": "Glossary", "es": "Glosario", "id": "Glosarium"}[l])))
    body = (f'<p class="dek">{esc(t["x_lead"])}</p>{_table([t["x_file"], t["x_rows"], t["x_what"], t["x_src"]], rows, 9)}<h2 id="reuse">{t["x_lic"]}</h2><p>{esc(t["x_lic_p"])}</p><h2 id="pages">{more}</h2><p>{links}</p>')
    url = B + tpl.format(l=l)
    cat = {"@context": "https://schema.org", "@type": "DataCatalog", "name": t["x_h1"], "description": t["x_desc"], "url": url, "inLanguage": l,
           "publisher": {"@type": "NewsMediaOrganization", "@id": B + "/#organization", "name": "The Sumba Times", "url": B + "/"},
           "dataset": [{"@type": "Dataset", "name": f.split("/")[-1], "description": d[l] + " " + src, "url": url, "isAccessibleForFree": True, "creator": {"@type": "NewsMediaOrganization", "@id": B + "/#organization", "name": "The Sumba Times"},
                        "distribution": [{"@type": "DataDownload", "encodingFormat": fmt, "contentUrl": B + f}]} for f, fmt, n, d, src in FILES]}
    pages_hubs._page(g, l, tpl, t["x_title"], t["x_desc"], t["x_h1"], _crumbs(l, g), body, [cat], t["kicker"])

def build(g):
    _files(g)
    for l in g["LANGS"]:
        _distances(g, l); _map(g, l); _quakes(g, l)
        for a, b in PAIRS: _pair(g, l, a, b)

def build_data_pages(g):
    """Called by build.py after every module ran, so that files added by other modules are listed too."""
    for l in g["LANGS"]: _data(g, l)

# ---------- sun times per place (NOAA solar position equations, no network) ----------
def sun_times(lat, lon, year, month, day, tz=8):
    """(sunrise, sunset) as 'HH:MM' local time (WITA = UTC+8) from the NOAA sunrise equation; accuracy about one minute."""
    n = datetime.date(year, month, day).toordinal() - datetime.date(year, 1, 1).toordinal() + 1
    g_ = 2 * math.pi / 365 * (n - 1 + 0.5)
    eqt = 229.18 * (0.000075 + 0.001868 * math.cos(g_) - 0.032077 * math.sin(g_) - 0.014615 * math.cos(2 * g_) - 0.040849 * math.sin(2 * g_))
    dec = 0.006918 - 0.399912 * math.cos(g_) + 0.070257 * math.sin(g_) - 0.006758 * math.cos(2 * g_) + 0.000907 * math.sin(2 * g_) - 0.002697 * math.cos(3 * g_) + 0.00148 * math.sin(3 * g_)
    la = math.radians(lat)
    ha = math.degrees(math.acos(math.cos(math.radians(90.833)) / (math.cos(la) * math.cos(dec)) - math.tan(la) * math.tan(dec)))
    def hm(mins):
        mins = int(round(mins + tz * 60)) % 1440; return f"{mins // 60:02d}:{mins % 60:02d}"
    return hm(720 - 4 * (lon + ha) - eqt), hm(720 - 4 * (lon - ha) - eqt)
SUN_T = {"en": ("Sunrise and sunset", "Sunrise from {a} ({am}) to {b} ({bm}); sunset from {c} ({cm}) to {d} ({dm}), local time (WITA). Calculated for these coordinates on the 15th of each month."),
         "es": ("Amanecer y atardecer", "Amanece entre las {a} ({am}) y las {b} ({bm}); anochece entre las {c} ({cm}) y las {d} ({dm}), hora local (WITA). Calculado para estas coordenadas el día 15 de cada mes."),
         "id": ("Matahari terbit dan terbenam", "Terbit antara pukul {a} ({am}) dan {b} ({bm}); terbenam antara pukul {c} ({cm}) dan {d} ({dm}) WITA. Dihitung untuk koordinat ini pada tanggal 15 setiap bulan.")}
def sun_row(g, p, l):
    rows = [(m,) + sun_times(p["lat"], p["lon"], 2027, m, 15) for m in range(1, 13)]
    r0 = min(rows, key=lambda r: r[1]); r1 = max(rows, key=lambda r: r[1]); s0 = min(rows, key=lambda r: r[2]); s1 = max(rows, key=lambda r: r[2])
    mn_ = lambda m: g["MONTHS"][l][m - 1]; f = (lambda x: x.replace(":", ".")) if l == "id" else (lambda x: x)
    return f'<dt>{SUN_T[l][0]}</dt><dd>{SUN_T[l][1].format(a=f(r0[1]), am=mn_(r0[0]), b=f(r1[1]), bm=mn_(r1[0]), c=f(s0[2]), cm=mn_(s0[0]), d=f(s1[2]), dm=mn_(s1[0]))}</dd>'
