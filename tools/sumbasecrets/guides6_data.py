# 23-nov-2026 · Batch 6, part 1: articles computed from our own verified data (coordinates, regions, OSM services, ERA5 climate).
# Rules: no invented prices or opening hours, no hotel names, no em dashes. Every distance is computed, every estimate says so.
import json
from guides4 import PL, GD, MAP, _km, _drive, CL, MON, TMC, WGP
from places import PLACES as _P, TOWNS as _T
from places_mamboro import MAMBORO as _M
from coords_fix import COORD_FIX

_ALL = list({p["s"]: dict(p, ll=COORD_FIX.get(p["s"], p["ll"])) for p in _P + _M}.values())  # build.py may append MAMBORO to PLACES: dedupe
_BY = {p["s"]: p for p in _ALL}
_TW = {t["s"]: t["ll"] for t in _T}
REG = {"sbd": "Southwest Sumba", "sb": "West Sumba", "st": "Central Sumba", "stim": "East Sumba"}
_RG = json.load(open("regions.json"))
_SV = json.load(open("osm_services.json"))["d"]
_CATN = {"beach": "beach", "village": "traditional village", "waterfall": "waterfall", "viewpoint": "viewpoint", "culture": "cultural site"}
MAMBORO_LL = [-9.3771602, 119.5460707]

def _inpoly(pt, ring):
    x, y, ins = pt[1], pt[0], False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]; xj, yj = ring[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi: ins = not ins
        j = i
    return ins
def _region(pt):
    for k, g in _RG.items():
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        if any(_inpoly(pt, poly[0]) for poly in polys): return k
    return None
def _along(a, b, maxkm=12):
    """places near the straight line a->b, ordered from a to b"""
    out = []
    for p in _ALL:
        ax, ay, bx, by, px, py = a[1], a[0], b[1], b[0], p["ll"][1], p["ll"][0]
        dx, dy = bx - ax, by - ay
        t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
        q = [ay + t * dy, ax + t * dx]
        d = _km(q, p["ll"])
        if d <= maxkm and 0.05 < t < 0.95: out.append((t, d, p))
    return sorted(out, key=lambda x: x[0])
def _svc_along(a, b, kinds, maxkm=6):
    n = 0
    for x in _SV:
        if x[0] not in kinds: continue
        ax, ay, bx, by = a[1], a[0], b[1], b[0]; dx, dy = bx - ax, by - ay
        t = max(0, min(1, ((x[2] - ax) * dx + (x[1] - ay) * dy) / (dx * dx + dy * dy)))
        if _km([ay + t * dy, ax + t * dx], [x[1], x[2]]) <= maxkm: n += 1
    return n
def _crossed(a, b):
    seen = []
    for i in range(21):
        t = i / 20; r = _region([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
        if r and r not in seen: seen.append(r)
    return seen
def _clim_short(key):
    r = CL[key]; wet = max(r, key=lambda m: m[3]); dry = min(r, key=lambda m: m[3])
    return wet, dry

def _route(slug, a_name, a_ll, b_name, b_ll, img, intro, tip, a_clim=None, b_clim=None):
    k = _km(a_ll, b_ll); road = round(k * 1.35 / 5) * 5; tm = _drive(k)
    al = _along(a_ll, b_ll); regs = [REG[r] for r in _crossed(a_ll, b_ll)]
    fuel = _svc_along(a_ll, b_ll, ("f",)); atm = _svc_along(a_ll, b_ll, ("a",)); med = _svc_along(a_ll, b_ll, ("h", "hH"))
    stops = "".join(f"<li>{PL(p['s'], p['en']['n'])} ({_CATN[p['c']]}, {REG[p['r']]}), about {round(d)} km off the direct line. {p['en']['t']}</li>" for t, d, p in al[:8])
    body = (f"<p>{intro}</p>"
            f"<h2>Distance and drive time</h2><table><tbody><tr><td>Straight-line distance</td><td>{round(k)} km</td></tr>"
            f"<tr><td>Road distance (estimate)</td><td>about {road} km</td></tr><tr><td>Drive time (estimate)</td><td>about {tm}</td></tr>"
            f"<tr><td>Regencies on the way</td><td>{', '.join(regs) if regs else 'one regency'}</td></tr></tbody></table>"
            f"<p class=\"note\">Road distance is the straight line times 1.35 and the drive time assumes about 35 km/h on average, which is realistic for Sumba's narrow, winding roads. Add time in the rainy season, after dark and on village tracks.</p>"
            + (f"<h2>Places worth a stop on the way</h2><p>These places on our map lie close to the route, listed from {a_name} towards {b_name}:</p><ul>{stops}</ul>" if stops else
               f"<h2>On the way</h2><p>There are no major sights from our map directly on this route, so most people drive it in one go and explore around {b_name}.</p>")
            + f"<h2>Fuel, cash and health care near the route</h2><p>OpenStreetMap shows {fuel} fuel station{'s' if fuel != 1 else ''}, {atm} ATM{'s' if atm != 1 else ''} and {med} clinic{'s' if med != 1 else ''} or hospital{'s' if med != 1 else ''} within about 6 km of the direct line. Open map data in Sumba is incomplete, so treat these numbers as a minimum: fill the tank and take cash in town before you set off. Small roadside stalls sell petrol in bottles in most villages.</p>"
            + f"<h2>Tips for this drive</h2><p>{tip}</p><ul><li>Most visitors hire a car with a driver; see {GD('hire-a-driver-sumba', 'hiring a driver in Sumba')}.</li><li>Leave early: light, temperature and traffic are all better in the morning, and dusk comes fast near the equator.</li><li>Phone signal drops in the hills; download the {MAP} and our offline tools before you go.</li></ul>")
    if a_clim and b_clim:
        wa, da = _clim_short(a_clim); wb, db = _clim_short(b_clim)
        body += f"<h2>Weather at each end</h2><p>Our climate data (ERA5, 2015 to 2024) gives {a_name} its wettest month in {MON[wa[0]-1]} (about {wa[3]} mm) and driest in {MON[da[0]-1]} (about {da[3]} mm); {b_name} is wettest in {MON[wb[0]-1]} (about {wb[3]} mm) and driest in {MON[db[0]-1]} (about {db[3]} mm). See {GD('sumba-weather-by-month', 'Sumba weather by month')}.</p>"
    body += f"<p>Plan other legs with our {GD('trip-tools', 'distance calculator').replace('/guide/trip-tools/', '/tools/')} and the full {GD('getting-around-sumba', 'getting around guide')}.</p>"
    faq = [[f"How far is {a_name} from {b_name}?", f"About {round(k)} km in a straight line and roughly {road} km by road, which takes about {tm} by car."],
           [f"Can I drive from {a_name} to {b_name} and back in a day?", ("Yes, comfortably, with time for stops." if k * 1.35 < 80 else "Yes, but it is a long day on the road; many travellers prefer to stay a night at the far end.")]]
    if al: faq.append([f"What can I see between {a_name} and {b_name}?", ", ".join(p["en"]["n"] for t, d, p in al[:4]) + " are all close to the route."])
    return {"s": slug, "img": img, "rt": [[round(a_ll[0], 5), round(a_ll[1], 5), a_name], [round(b_ll[0], 5), round(b_ll[1], 5), b_name]], "t": f"{a_name} to {b_name}: distance, drive time and stops",
            "d": f"How to get from {a_name} to {b_name} in Sumba: about {road} km by road, roughly {tm} by car, with places to stop, fuel and tips.", "b": body, "faq": faq}

_TMC_N, _WGP_N = "Tambolaka Airport", "Waingapu"
GUIDES6D = [
 _route("tambolaka-to-waingapu", "Tambolaka", _TW["tambolaka"], "Waingapu", _TW["waingapu"], "wairinding-hill",
        "Tambolaka in the west and Waingapu in the east are the two airport towns of Sumba, and many travellers fly into one and out of the other. The drive between them crosses the whole island, from the green hills of the west to the open savannah of the east.",
        "Break the journey in Waibakul or Waikabubak if you want to see villages, or along the north coast near Mamboro if you prefer beaches.", "tambolaka", "waingapu"),
 _route("tambolaka-to-waikabubak", "Tambolaka", _TW["tambolaka"], "Waikabubak", _TW["waikabubak"], "tarung-village",
        "Most visitors to West Sumba land at Tambolaka and head inland to Waikabubak, the capital of West Sumba, with its hilltop villages and cooler air.",
        "The road climbs gently into the hills; it is one of the busier roads on the island, so expect motorbikes, trucks and animals.", "tambolaka", "waikabubak"),
 _route("waikabubak-to-waingapu", "Waikabubak", _TW["waikabubak"], "Waingapu", _TW["waingapu"], "prailiu-village",
        "Waikabubak and Waingapu are the two largest towns on the island and the main bases for West and East Sumba. The road between them runs through Central Sumba and changes from green hills to dry savannah.",
        "Waibakul, the capital of Central Sumba, is a natural place for lunch and fuel about a third of the way from Waikabubak.", "waikabubak", "waingapu"),
 _route("waibakul-to-waingapu", "Waibakul", _TW["waibakul"], "Waingapu", _TW["waingapu"], "wairinding-hill",
        "Waibakul is the small capital of Central Sumba; Waingapu is the main town of the east and has its own airport. This is the longer, eastern half of the cross-island road.",
        "The last part into Waingapu passes through the open savannah hills that make East Sumba famous; stop at a viewpoint in the late afternoon if you can.", "waikabubak", "waingapu"),
 _route("tambolaka-to-waibakul", "Tambolaka", _TW["tambolaka"], "Waibakul", _TW["waibakul"], "pasunga-village",
        "Waibakul, capital of Central Sumba, is the gateway to the megalithic village of Pasunga and to the Mamboro coast. From Tambolaka airport it is a straightforward drive east.",
        "Combine this drive with the north coast beaches around Mamboro for a loop instead of a straight line.", "tambolaka", "waikabubak"),
 _route("waikabubak-to-waibakul", "Waikabubak", _TW["waikabubak"], "Waibakul", _TW["waibakul"], "gallubakul-tomb",
        "Waikabubak and Waibakul, the capitals of West and Central Sumba, are close neighbours. The short drive links the village country of the west with the stone tombs of Central Sumba.",
        "Short enough for a half day: see the Pasunga stones near Waibakul and be back in Waikabubak for the evening.", "waikabubak", "waikabubak"),
 _route("tambolaka-airport-to-weekuri-lagoon", "Tambolaka Airport", TMC, "Weekuri Lagoon", _BY["weekuri-lagoon"]["ll"], "weekuri-lagoon",
        "Weekuri Lagoon is the most photographed place in Southwest Sumba, and it is close enough to Tambolaka airport to visit on the day you land.",
        "Go early on a weekday; weekends are busy with local families. Water shoes help on the coral rocks.", "tambolaka", "tambolaka"),
 _route("tambolaka-to-mamboro", "Tambolaka", _TW["tambolaka"], "Mamboro", MAMBORO_LL, "kapulit-beach",
        "Mamboro is a quiet stretch of the north coast of Central Sumba with long, empty beaches. It is where the Sumba Secrets team is based, and an easy drive east from Tambolaka.",
        "Ask your driver which road is in the best state, and time the drive for a sunset on one of the Mamboro beaches.", "tambolaka", "tambolaka"),
 _route("waingapu-to-mamboro", "Waingapu", _TW["waingapu"], "Mamboro", MAMBORO_LL, "mananga-beach",
        "From Waingapu, Mamboro is reached by heading west across the island. It is a long drive, so most people combine it with a cross-island trip.",
        "Start early, as there are long stretches with few services; carry water and cash.", "waingapu", "tambolaka"),
 _route("waikabubak-to-mamboro", "Waikabubak", _TW["waikabubak"], "Mamboro", MAMBORO_LL, "karendi-beach",
        "From the cool hills of Waikabubak, the beaches of Mamboro on the north coast make a good change of scene for a day or a few nights.",
        "The road drops from the hills to the coast; check the state of the road after heavy rain.", "waikabubak", "tambolaka"),
 _route("waingapu-to-wairinding-hill", "Waingapu", _TW["waingapu"], "Wairinding Hill", _BY["wairinding-hill"]["ll"], "wairinding-hill",
        "Wairinding is the classic East Sumba viewpoint: rolling savannah hills that turn gold in the dry season and green after the rains. It is an easy trip from Waingapu.",
        "Late afternoon gives the best light. Local children often offer to guide visitors; read our tipping guide on how to thank them without encouraging begging.", "waingapu", "waingapu"),
 _route("waingapu-to-walakiri-beach", "Waingapu", _TW["waingapu"], "Walakiri Beach", _BY["walakiri-beach"]["ll"], "walakiri-beach",
        "Walakiri is famous for its dancing mangrove trees silhouetted at sunset, and it is one of the closest beaches to Waingapu.",
        "Check the tide: at low tide you can walk out among the trees for the classic photos.", "waingapu", "waingapu"),
 _route("waingapu-to-tanggedu-waterfall", "Waingapu", _TW["waingapu"], "Tanggedu Waterfall", _BY["tanggedu-waterfall"]["ll"], "tanggedu-waterfall",
        "Tanggedu is a canyon waterfall with pools carved into the rock, reached by a rough road and a walk. It is one of the great adventures of East Sumba.",
        "The last part of the road is rough and the walk is hot: go in the dry season, early, with plenty of water and a local driver who knows the track.", "waingapu", "waingapu"),
 _route("waingapu-to-tarimbang-bay", "Waingapu", _TW["waingapu"], "Tarimbang Bay", _BY["tarimbang-bay"]["ll"], "tarimbang-bay",
        "Tarimbang is a wide bay on the south coast of East Sumba, known for surf and big empty sands. Getting there means crossing the island from Waingapu.",
        "The road crosses the hills to the south coast; plan a night there rather than a rushed return.", "waingapu", "south"),
 _route("waingapu-to-puru-kambera", "Waingapu", _TW["waingapu"], "Puru Kambera", _BY["puru-kambera"]["ll"], "puru-kambera",
        "Puru Kambera is a long beach north-west of Waingapu where horses often graze on the savannah behind the sand.",
        "An easy half day from Waingapu; combine it with Walakiri for sunset.", "waingapu", "waingapu"),
 _route("waikabubak-to-lapopu-waterfall", "Waikabubak", _TW["waikabubak"], "Lapopu Waterfall", _BY["lapopu-waterfall"]["ll"], "lapopu-waterfall",
        "Lapopu is one of the best-known waterfalls in Sumba, in the forested hills south-east of Waikabubak, just inside Central Sumba.",
        "The falls are strongest in and just after the rainy season; the path can be slippery, so wear shoes with grip.", "waikabubak", "waikabubak"),
 _route("waikabubak-to-marosi-beach", "Waikabubak", _TW["waikabubak"], "Marosi Beach", _BY["marosi-beach"]["ll"], "marosi-beach",
        "Marosi is a long beach on the south coast of West Sumba, a classic trip from Waikabubak through village country.",
        "The south coast faces the open Indian Ocean: admire the waves, and only swim where locals say it is safe.", "waikabubak", "south"),
 _route("tambolaka-to-ratenggaro", "Tambolaka", _TW["tambolaka"], "Ratenggaro Village", _BY["ratenggaro"]["ll"], "ratenggaro",
        "Ratenggaro is a traditional village with towering thatched roofs and stone tombs right by the sea, in the Kodi area of Southwest Sumba.",
        "Visitors are asked to sign a guestbook and leave a donation; read our village etiquette before you go.", "tambolaka", "tambolaka"),
 _route("tambolaka-to-pero-beach", "Tambolaka", _TW["tambolaka"], "Pero Beach", _BY["pero-beach"]["ll"], "pero-beach",
        "Pero is a coastal village and beach on the far west coast of Sumba, known for its rock formations and sunsets.",
        "Combine Pero with Ratenggaro and Mandorak for a full day on the Kodi coast.", "tambolaka", "tambolaka"),
 _route("waingapu-to-wanggameti", "Waingapu", _TW["waingapu"], "Wanggameti", _BY["wanggameti"]["ll"], "wanggameti",
        "Wanggameti is the high mountain area of East Sumba, inside a national park with forest, birds and cool air. It is one of the least visited parts of the island.",
        "Roads are slow and services few; go with a local driver, and allow two days if you want to walk in the forest.", "waingapu", "south"),
]
for g in GUIDES6D:
    g["b"] = g["b"].replace(GD("trip-tools", "distance calculator").replace("/guide/trip-tools/", "/tools/"), '<a href="/{l}/tools/">distance calculator</a>')

# ---- town weather pages ----
def _wx(slug, key, name, img, intro):
    r = CL[key]; tot = sum(m[3] for m in r)
    wet = sorted(r, key=lambda m: -m[3])[:3]; dry = sorted(r, key=lambda m: m[3])[:3]
    hot = max(r, key=lambda m: m[1]); cool = min(r, key=lambda m: m[2])
    rows = "".join(f"<tr><td>{MON[m[0]-1]}</td><td>{round(m[1])}</td><td>{round(m[2])}</td><td>{m[3]}</td><td>{m[4]}</td></tr>" for m in r)
    others = [(k, n) for k, n in [("waingapu", "Waingapu"), ("waikabubak", "Waikabubak"), ("tambolaka", "Tambolaka"), ("south", "the south coast")] if k != key]
    comp = "; ".join(f"{n} gets about {sum(m[3] for m in CL[k])} mm" for k, n in others)
    body = (f"<p>{intro}</p><p>The figures below come from the ERA5 climate reanalysis (daily data 2015 to 2024, averaged by month), the same source used across Sumba Secrets. A rain day is a day with at least 1 mm of rain. Model data smooths out local storms, so treat it as a guide, not a forecast.</p>"
            f"<h2>{name} weather by month</h2><table><thead><tr><th>Month</th><th>Max °C</th><th>Min °C</th><th>Rain (mm)</th><th>Rain days</th></tr></thead><tbody>{rows}</tbody></table>"
            f"<h2>Wettest and driest months</h2><p>The wettest months are {', '.join(MON[m[0]-1] for m in wet)}; the driest are {', '.join(MON[m[0]-1] for m in dry)}. Over a year {name} gets about {tot} mm of rain in the model. For comparison, {comp}.</p>"
            f"<h2>Temperature</h2><p>The warmest days come in {MON[hot[0]-1]} (average maximum about {round(hot[1])} °C) and the coolest nights in {MON[cool[0]-1]} (average minimum about {round(cool[2])} °C).</p>"
            f"<h2>What it means for your trip</h2><ul><li><b>Driest months</b> are best for long drives, rough tracks and beach days.</li><li><b>The months just after the rains</b> keep the landscape green and the waterfalls flowing with fewer washed-out roads.</li><li><b>Peak wet months</b> bring heavy showers, often in the afternoon or at night; keep plans flexible.</li></ul>"
            f"<p>See also {GD('sumba-weather-by-month', 'Sumba weather by month')}, {GD('sumba-in-the-rainy-season', 'Sumba in the rainy season')} and today's forecast on our <a href=\"/{{l}}/weather/\">weather page</a>.</p>")
    return {"s": slug, "img": img, "t": f"{name} weather: rain and temperature month by month",
            "d": f"Average temperature, rainfall and rain days in {name}, Sumba, for every month, from 10 years of climate data, with the best and wettest months.",
            "b": body, "faq": [[f"What is the rainiest month in {name}?", f"{MON[wet[0][0]-1]}, with about {wet[0][3]} mm of rain on average in our climate data."],
                               [f"What is the driest month in {name}?", f"{MON[dry[0][0]-1]}, with about {dry[0][3]} mm on average."]]}
GUIDES6D += [
 _wx("waingapu-weather", "waingapu", "Waingapu", "puru-kambera", "Waingapu, on the north coast of East Sumba, is one of the driest places in the region: the east of the island lies in a rain shadow, which is why its hills are savannah rather than forest."),
 _wx("waikabubak-weather", "waikabubak", "Waikabubak", "tarung-village", "Waikabubak sits in the green hills of West Sumba. Its height makes nights cooler than on the coast, and the west of the island receives much more rain than the east."),
 _wx("tambolaka-weather", "tambolaka", "Tambolaka", "weekuri-lagoon", "Tambolaka, in Southwest Sumba near the main airport, is the gateway to the beaches of the west coast."),
 _wx("south-coast-sumba-weather", "south", "South coast of Sumba", "marosi-beach", "The south coast of Sumba faces the open Indian Ocean, with long beaches such as Marosi and Tarimbang. Our data point represents the south coast of the island."),
]

# ---- region x category roundups ----
_REGINTRO = {"sbd": "Southwest Sumba (Sumba Barat Daya) is the green, populated west end of the island around Tambolaka and the Kodi coast.",
             "sb": "West Sumba (Sumba Barat) is the hilly heartland around Waikabubak, rich in traditional villages.",
             "st": "Central Sumba (Sumba Tengah) is the narrow middle of the island, from the Mamboro coast in the north to the forested hills in the south.",
             "stim": "East Sumba (Sumba Timur) is the largest and driest regency, with savannah hills, long beaches and ikat-weaving villages around Waingapu."}
_CATP = {"beach": ("beaches", "Beaches"), "village": ("traditional villages", "Traditional villages"), "waterfall": ("waterfalls", "Waterfalls"), "viewpoint": ("viewpoints and hills", "Viewpoints and hills")}
def _rc(reg, cat, slug):
    ps = [p for p in _ALL if p["r"] == reg and p["c"] == cat]
    base = {"sbd": ("Tambolaka", _TW["tambolaka"]), "sb": ("Waikabubak", _TW["waikabubak"]), "st": ("Waibakul", _TW["waibakul"]), "stim": ("Waingapu", _TW["waingapu"])}[reg]
    ps.sort(key=lambda p: _km(base[1], p["ll"]))
    low, cap = _CATP[cat]
    items = "".join(f"<h3>{PL(p['s'], p['en']['n'])}{' ★' if p.get('sec') else ''}</h3><p>{p['en']['t']}</p><p><b>Tip:</b> {p['en']['tip']}</p><p class=\"note\">About {round(_km(base[1], p['ll']) * 1.35 / 5) * 5} km by road from {base[0]} (estimate, about {_drive(_km(base[1], p['ll']))}).</p>" for p in ps)
    body = (f"<p>{_REGINTRO[reg]} This guide lists every one of the {len(ps)} {low} in {REG[reg]} on our checked map, closest to {base[0]} first. Places marked ★ are lesser-known spots.</p>"
            f"<h2>{cap} in {REG[reg]}</h2>{items}"
            f"<h2>Plan your visit</h2><p>Distances are estimates from straight-line distance and our average Sumba road speed. See them all on the {MAP}, filter by region, and read {GD('things-to-do-in-sumba', 'the 50 best things to do in Sumba')} for the rest of the island.</p>")
    return {"s": slug, "img": ps[0]["s"], "t": f"{cap} in {REG[reg]}: {len(ps)} places, with map and tips",
            "d": f"All the {low} in {REG[reg]}, Sumba, checked on the map: what each is like, tips, and road distance from {base[0]}.",
            "b": body, "faq": [[f"How many {low} are there in {REG[reg]} on Sumba Secrets?", f"{len(ps)}: " + ", ".join(p['en']['n'] for p in ps) + "."],
                               [f"Which is closest to {base[0]}?", f"{ps[0]['en']['n']}, about {_drive(_km(base[1], ps[0]['ll']))} by road."]]}
_combos = [("sbd", "beach", "beaches-southwest-sumba"), ("sbd", "village", "villages-southwest-sumba"), ("sb", "beach", "beaches-west-sumba"), ("sb", "village", "villages-west-sumba"),
           ("st", "beach", "beaches-central-sumba"), ("st", "waterfall", "waterfalls-central-sumba"), ("stim", "beach", "beaches-east-sumba"), ("stim", "village", "villages-east-sumba"),
           ("stim", "waterfall", "waterfalls-east-sumba"), ("stim", "viewpoint", "viewpoints-east-sumba")]
for r, c, s in _combos:
    if len([p for p in _ALL if p["r"] == r and p["c"] == c]) >= 2: GUIDES6D.append(_rc(r, c, s))

# ---- day trips from Waibakul and Mamboro ----
from guides5 import _daytrips
GUIDES6D += [
 _daytrips("day-trips-from-waibakul", "Waibakul", _TW["waibakul"], "pasunga-village", "Waibakul, the small capital of Central Sumba, sits in the middle of the island, so both the villages of the west and the Mamboro coast are within reach.", "From the middle of the island you can reach both coasts; start early for the longer trips."),
 _daytrips("day-trips-from-mamboro", "Mamboro", MAMBORO_LL, "kapulit-beach", "Mamboro, on the north coast of Central Sumba, is where the Sumba Secrets team lives: a quiet coast of long beaches, villages and savannah between Tambolaka and Waingapu.", "See our <a href=\"/{l}/mamboro/\">Mamboro top 10</a> for the beaches closest to the village."),
]
for g in GUIDES6D: g["d"] = g["d"].replace(" ,", ",")
