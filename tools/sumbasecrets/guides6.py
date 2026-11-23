# 23-nov-2026 · s100 week 1: nine guides on places, areas, routes and activities (plan in claude/ s100 sumbasecrets-plan).
# Rules: English source, machine-translated at build time; no hotel names, no invented prices, visits or quotes, no em dashes.
# Road distances: roads.json (OpenStreetMap network routed with OSRM, 23-nov-2026; see roads_osrm.py).
# Sun, moon and Milky Way figures: astro.json (computed with PyEphem; see astro_calc.py). Climate: climate.json (ERA5 2015-2024).
# Population and area: BPS (Badan Pusat Statistik) 2020 census, as published in the Kecamatan Dalam Angka series.
import json
from guides4 import PL, GD, MAP
R = json.load(open("roads.json"))
A = json.load(open("astro.json"))
CL = json.load(open("climate.json"))
MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
MONL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
NAME = {"waingapu": "Waingapu", "tambolaka": "Tambolaka", "waikabubak": "Waikabubak", "waibakul": "Waibakul", "lewa": "Lewa", "mamboro": "Mamboro",
        "melolo": "Melolo", "bondo-kodi": "Bondo Kodi", "kabukarudi": "Kabukarudi", "rambangaru": "Rambangaru", "TMC": "Tambolaka Airport", "WGP": "Waingapu Airport"}
from places import PLACES as _P
from places_mamboro import MAMBORO as _M
for _p in _P + _M: NAME[_p["s"]] = _p["en"]["n"]
PLACE_SLUGS = {p["s"] for p in _P + _M}
OSM = '<a href="https://www.openstreetmap.org/copyright" rel="nofollow">OpenStreetMap</a>'
OSRM = '<a href="https://project-osrm.org/" rel="nofollow">OSRM</a>'
def nm(s): return PL(s, NAME[s]) if s in PLACE_SLUGS else NAME[s]
def hm(km):  # planning time at 35 km/h, rounded to 15 min (same rule as the rest of the site)
    m = max(15, round(km / 35 * 60 / 15) * 15); h, mm = divmod(m, 60)
    return (f"{h} h" if h else "") + (" " if h and mm else "") + (f"{mm} min" if mm else "")
def km(key, i=0): return R[key][i][2]
def tot(key): return round(sum(x[2] for x in R[key]))
def legs(key, cum=True):
    rows, c = [], 0
    for a, b, d, _ in R[key]:
        c += d
        rows.append(f"<tr><td>{nm(a)} to {nm(b)}</td><td>{d:.0f} km</td>" + (f"<td>{c:.0f} km</td>" if cum else "") + f"<td>{hm(d)}</td></tr>")
    head = "<tr><th>Leg</th><th>Road distance</th>" + ("<th>Running total</th>" if cum else "") + "<th>Planning time</th></tr>"
    return f"<table><thead>{head}</thead><tbody>{''.join(rows)}</tbody></table>"
ROADNOTE = (f"<p><small>Road distances come from the {OSM} road network, routed with {OSRM} in November 2026. Planning times assume an average of "
            "35 km/h, which is what we use across this site; they do not include stops.</small></p>")
def sunrow(town, m): return A[town][m - 1]
WG, TB = A["Waingapu"], A["Tambolaka"]
def rain(k, m): return CL[k][m - 1][3]

def climrow(k, label):
    r = CL[k]
    return (f"<table><thead><tr><th>{label}</th>" + "".join(f"<th>{MON[x[0]-1]}</th>" for x in r) + "</tr></thead><tbody><tr><td>Rain (mm)</td>" +
            "".join(f"<td>{x[3]}</td>" for x in r) + "</tr><tr><td>Rain days</td>" + "".join(f"<td>{x[4]}</td>" for x in r) + "</tr><tr><td>Max °C</td>" +
            "".join(f"<td>{round(x[1])}</td>" for x in r) + "</tr></tbody></table>" +
            "<p><small>Monthly means 2015 to 2024 from the Open-Meteo historical weather service (ERA5 reanalysis, a weather model). A rain day is a day with at least 1 mm. Models tend to overestimate rain in dry places, so read it as the pattern rather than an exact figure.</small></p>")

GUIDES6 = []

# ---------------------------------------------------------------- 1
GUIDES6.append({"s": "drive-across-sumba", "img": "wairinding-hill",
 "t": "Driving across Sumba: Waingapu to Tambolaka by road",
 "d": f"The two road routes between Waingapu and Tambolaka, inland via Waibakul ({tot('inland')} km) or along the north coast ({tot('north')} km), with legs, fuel, stops and timing.",
 "faq": [["How far is Waingapu from Tambolaka by road?", f"About {km('w_t_direct'):.0f} km on the inland road through Lewa, Waibakul and Waikabubak, according to OpenStreetMap routing. The north coast road via Mamboro is about {tot('north')} km."],
         ["How long does the drive take?", f"Plan on about {hm(km('w_t_direct'))} of driving at a realistic 35 km/h average, and a full day once you add stops. In the rainy season, allow more."],
         ["Can I drive across Sumba in one day?", "Yes. Leave early, avoid the last stretch after dark, and pick two or three stops rather than trying to see everything on the way."],
         ["Where can I get fuel between Waingapu and Tambolaka?", "On the inland road, OpenStreetMap shows fuel stations in Waingapu, Lewa, Anakalang (near Waibakul), Waikabubak and Tambolaka. It shows none on the north coast between Waingapu and Tambolaka, so fill up before you start."]],
 "b": f"""<p>Waingapu, in the east, and Tambolaka, in the south-west, are the two airports of Sumba and the two ends of almost every trip across the island. By road they are {km('w_t_direct'):.0f} km apart. That is about {hm(km('w_t_direct'))} at the wheel, and a long day once you stop for anything worth seeing. Many visitors fly into one and out of the other, so this drive is the backbone of most itineraries.</p>
<p>There are two ways to do it. The inland road climbs over the hills through Lewa, Waibakul and Waikabubak, and has the towns, the fuel and the traditional villages. The north coast road runs along the Sumba Strait through savanna and fishing villages, with long empty beaches and almost no services. This page gives the distances for both, leg by leg.</p>
<h2>The inland route via Waibakul and Waikabubak</h2>
<p>This is the main road of the island and the one a driver will take unless you ask for something else. It is paved, it passes through all four regency capitals, and it has most of the island's fuel stations.</p>
{legs('inland')}
<p>The first 25 km out of Waingapu are the most famous: the road climbs into open grass hills and passes {PL('wairinding-hill', 'Wairinding Hill')}, the classic East Sumba viewpoint, right next to the tarmac. After that the land gets emptier until the small town of Lewa, about {km('inland', 0) + km('inland', 1):.0f} km from Waingapu and roughly a third of the way across. From Lewa it is {km('inland', 2):.0f} km more through the hills, where East Sumba becomes Central Sumba, to Waibakul.</p>
<p>Waibakul is the capital of Central Sumba. Just west of it, in Anakalang, the road passes straight through {PL('pasunga-village', 'Pasunga Village')}, whose high-roofed houses face a square of stone tombs. The giant tomb at {PL('gallubakul-tomb', 'Gallubakul')} is {R['wb_gal'][1][2]:.0f} km south of Pasunga. From Waibakul it is {km('wk_wb'):.0f} km to Waikabubak, the capital of West Sumba, and another {km('tmc_wk'):.0f} km down to Tambolaka.</p>
<h2>The north coast route via Mamboro</h2>
<p>The coast road leaves Waingapu to the north-west, passes {PL('puru-kambera', 'Puru Kambera')}, where the savanna meets the sea, and follows the north shore of the island to Mamboro in Central Sumba before turning inland towards Tambolaka.</p>
{legs('north')}
<p>On the map this route is a little shorter than the inland road, about {tot('north')} km against {km('w_t_direct'):.0f} km, but it is not faster. The long middle section from Puru Kambera to Mamboro, {km('north', 1):.0f} km, has very few villages, no fuel station that we can find in OpenStreetMap and long stretches with weak mobile signal. Ask your driver about the current state of the road before you choose it, especially between December and March.</p>
<p>What you get in return is the dry, open north: the {PL('mamboro-savanna', 'Mamboro savanna')}, white beaches such as {PL('kapulit-beach', 'Kapulit')} and {PL('lenang-beach', 'Lenang')}, where the sea is usually calm, and very little traffic. Our {GD('sumba-north-coast', 'guide to the north coast')} describes the beaches along this road.</p>
<h2>Fuel, cash and signal</h2>
<p>These are the fuel stations mapped in OpenStreetMap along the two routes in November 2026. The map is incomplete, so there may be more, and small roadside stalls sell petrol in bottles in many villages. Still, the pattern is clear: the inland road has fuel every 20 to 60 km, the north coast has none mapped between the two ends.</p>
<table><thead><tr><th>Place</th><th>Route</th><th>Fuel stations mapped</th></tr></thead><tbody>
<tr><td>Waingapu</td><td>Both (start)</td><td>4</td></tr>
<tr><td>Lewa</td><td>Inland</td><td>1</td></tr>
<tr><td>Anakalang, near Waibakul</td><td>Inland</td><td>1</td></tr>
<tr><td>Waikabubak</td><td>Inland</td><td>2</td></tr>
<tr><td>Tambolaka</td><td>Both (end)</td><td>1</td></tr>
</tbody></table>
<p>The same towns have the ATMs: Waingapu, Waibakul, Waikabubak and Tambolaka. Take enough cash for the day before you leave, because village stalls, donations at traditional villages and parking are paid in cash. Our {GD('money-atms-sim-sumba', 'guide to money, ATMs and SIM cards')} has the details.</p>
<h2>Stops that are worth the time</h2>
<p>With one day, choose three. These are all on the inland road or a short detour from it:</p>
<ul><li><b>{PL('wairinding-hill', 'Wairinding Hill')}</b>, {km('w_wairinding'):.0f} km from Waingapu. Best early in the morning if you are driving west, or at sunset if you are arriving from the west.</li>
<li><b>{PL('pasunga-village', 'Pasunga')}</b> in Anakalang, on the road itself. Sign the guestbook and leave a donation.</li>
<li><b>{PL('gallubakul-tomb', 'Gallubakul')}</b>, a few kilometres south of the main road, for one of the largest megalithic tombs in Sumba.</li>
<li><b>{PL('lapopu-waterfall', 'Lapopu Waterfall')}</b>, a detour of about {km('wb_lap'):.0f} km each way from Waibakul or {km('wk_lap'):.0f} km from Waikabubak, inside Matalawa National Park. It turns a long day into a very long one, so it suits a two-day crossing best.</li>
<li><b>{PL('tarung-village', 'Tarung')}</b>, a traditional village on a hill in the centre of Waikabubak, five minutes off the road.</li></ul>
<h2>One day or two?</h2>
<p>It can be done in one day, and plenty of people do it on the way to a flight. But the drive is long, and if you add Lapopu or a village visit you will finish in the dark. Night driving is the thing to avoid here: roads are unlit, animals and motorbikes without lights are common, and potholes appear after rain. A good split is to sleep in Waikabubak or Waibakul, which turns one long drive into two easy days with time for the stops.</p>
<p>If you are going the other way, from Tambolaka to Waingapu, the logic is the same. Leave Waikabubak early and you reach Wairinding in the late afternoon, which is the best light on the hills. See {GD('best-sunsets-in-sumba', 'the best sunsets in Sumba')} and our page on {GD('sunrise-sunset-times-sumba', 'sunrise and sunset times')} to time it.</p>
<h2>Driver or self-drive</h2>
<p>Most visitors hire a car with a driver for this trip, and we think that is the right call: drivers know where the road is broken and where to stop to eat, and they take the stress out of the hills. If you drive yourself, read {GD('rent-scooter-car-sumba', 'our guide to renting a scooter or a car')} first and agree on what happens if the car breaks down far from town. For what to agree with a driver, see {GD('hire-a-driver-sumba', 'hiring a driver in Sumba')}.</p>
{ROADNOTE}"""})

# ---------------------------------------------------------------- 2
_d1, _d2a, _d2b, _d2c, _d2d, _d3 = R["east_d1"], R["w_tang"][0], R["tang_puru"][0], R["puru_wair"][0], R["wair_wgp"][0], R["east_d3"]
_d2 = round(_d2a[2] + _d2b[2] + _d2c[2] + _d2d[2])
GUIDES6.append({"s": "east-sumba-3-days", "img": "walakiri-beach",
 "t": "East Sumba in 3 days: a road-tested route from Waingapu",
 "d": "A three-day plan for East Sumba from Waingapu: ikat and Walakiri on day one, Tanggedu, Puru Kambera and Wairinding on day two, Rende and Waimarang on day three, with road distances.",
 "faq": [["Is three days enough for East Sumba?", "For the main sights around Waingapu, yes: Prailiu, Walakiri, Wairinding, Tanggedu, Puru Kambera, Rende and Waimarang. Add a fourth day for the south coast at Tarimbang."],
         ["Where should I stay for an East Sumba trip?", "In or near Waingapu. Every day of this route starts and ends there, and it has the airport, ATMs and fuel."],
         ["When is the best time to visit East Sumba?", f"The dry months from May to October. Our ten-year climate data for Waingapu show {rain('waingapu', 8)} mm of rain in August against {rain('waingapu', 1)} mm in January."]],
 "b": f"""<p>Our {GD('itinerary-3-days', 'three-day route')} covers the west of Sumba. This one is for the other side of the island. East Sumba is drier, wider and emptier: golden grass hills, a canyon river, a beach where horses graze and the old royal villages of the south-east. Every day starts and ends in Waingapu, so you only unpack once.</p>
<p>The distances below are road distances from {OSM} routing. They add up to about {tot('east_d1') + _d2 + tot('east_d3')} km over the three days. That is very manageable with a driver, and it leaves time to stop.</p>
<h2>Day 1: Waingapu, ikat and the dancing trees ({tot('east_d1')} km)</h2>
{legs('east_d1')}
<p>If you land in the morning, this day fits around your flight. Start at {PL('prailiu-village', 'Prailiu')}, a royal village inside Waingapu where weavers often work in front of the houses. It is the easiest place on the island to see how ikat is tied, dyed and woven, and to buy directly from the people who made it. Our {GD('sumba-ikat-weaving', 'ikat guide')} explains what to look for.</p>
<p>In the afternoon go up {PL('brotherhood-hill', 'Brotherhood Hill')} (Bukit Persaudaraan) for the view over the valleys, then drive east to {PL('walakiri-beach', 'Walakiri Beach')} for sunset. The small mangrove trees standing in the water there are the "dancing trees" that appear in almost every photo of Sumba. They look best at low tide, so check a tide table before you go. In Waingapu the sun sets between {min(r[4] for r in WG)} and {max(r[4] for r in WG)} depending on the month.</p>
<h2>Day 2: Tanggedu, Puru Kambera and Wairinding ({_d2} km)</h2>
<table><thead><tr><th>Leg</th><th>Road distance</th><th>Planning time</th></tr></thead><tbody>
<tr><td>Waingapu to {PL('tanggedu-waterfall', 'Tanggedu')}</td><td>{_d2a[2]:.0f} km</td><td>{hm(_d2a[2])}</td></tr>
<tr><td>Tanggedu to {PL('puru-kambera', 'Puru Kambera')}</td><td>{_d2b[2]:.0f} km</td><td>{hm(_d2b[2])}</td></tr>
<tr><td>Puru Kambera to {PL('wairinding-hill', 'Wairinding Hill')}</td><td>{_d2c[2]:.0f} km</td><td>{hm(_d2c[2])}</td></tr>
<tr><td>Wairinding Hill to Waingapu</td><td>{_d2d[2]:.0f} km</td><td>{hm(_d2d[2])}</td></tr></tbody></table>
<p>This is the big day. Leave early for {PL('tanggedu-waterfall', 'Tanggedu')}, where a river has cut a narrow canyon into the hills and left a staircase of turquoise pools. The last part is a walk across open savanna and down to the water, so bring water, sun protection and shoes you can wade in. Go with a local guide, and only in the dry season: after heavy rain the river is brown and the path is slippery.</p>
<p>From Tanggedu drop down to the coast at {PL('puru-kambera', 'Puru Kambera')}, where the savanna runs straight onto a long beach. Horses belonging to local families graze among the trees. On a calm day it is one of the better places in the east for a swim.</p>
<p>End the day on {PL('wairinding-hill', 'Wairinding Hill')}, next to the main road west of Waingapu, about an hour before sunset. Children from the nearby village usually offer to guide you along the ridge. A small tip is customary; sweets are not a good idea.</p>
<h2>Day 3: Melolo, Rende and Waimarang ({tot('east_d3')} km)</h2>
{legs('east_d3')}
<p>The south-east is home to old royal villages and is quieter than anywhere else on this route. From Melolo it is a short hop to {PL('praiyawang-rende', 'Praiyawang')}, the royal village of Rende, famous for some of the largest carved stone tombs on the island. Ask permission before photographing the tombs, and sign the guestbook.</p>
<p>In the afternoon continue to {PL('waimarang-waterfall', 'Waimarang Waterfall')}, which drops into a round, jade-green pool surrounded by rock walls. The last part is a steep walk down on loose ground: good shoes, no flip-flops. Our page on {GD('melolo-rende-sumba', 'Melolo and Rende')} has more on this corner of the island, including the archaeology.</p>
<h2>A fourth day: the south coast</h2>
<p>If you have one more day, {PL('tarimbang-bay', 'Tarimbang Bay')} on the south coast is {R['east_misc'][2][2]:.0f} km from Waingapu, on a winding road through the hills. It has a wide beach, a surf break and very few people. It is a long day out and back; many visitors prefer to sleep there. Fill up with fuel and cash before leaving Waingapu.</p>
<p>For a slower day close to town, {PL('londa-lima-beach', 'Londa Lima')} is {R['east_misc'][0][2]:.0f} km from Waingapu and has calm water on most days.</p>
<h2>Before you go</h2>
<ul><li><b>Season.</b> Tanggedu and Waimarang are dry-season trips. See {GD('sumba-weather-by-month', 'Sumba weather by month')} for the numbers.</li>
<li><b>Transport.</b> A car with a driver for all three days is simplest. See {GD('hire-a-driver-sumba', 'hiring a driver in Sumba')}.</li>
<li><b>Villages.</b> Prailiu and Praiyawang are homes. The rules in {GD('respect-etiquette', 'our etiquette guide')} apply: guestbook, donation, ask before photos, do not climb on tombs.</li>
<li><b>Arriving.</b> Waingapu Airport is {R['wgp_town'][0][2]:.0f} km from the town centre. See {GD('waingapu-airport', 'our guide to Waingapu Airport')}.</li></ul>
{ROADNOTE}"""})

# ---------------------------------------------------------------- 3
GUIDES6.append({"s": "kodi-sumba", "img": "ratenggaro",
 "t": "Kodi, Southwest Sumba: lagoon, cliffs and stone tombs",
 "d": "A guide to the Kodi area at the western tip of Sumba: Weekuri, Mandorak, Pero, Ratenggaro, Wainyapu and Watu Maladong, with a day loop from Tambolaka and population facts.",
 "faq": [["How far is Kodi from Tambolaka?", f"Weekuri Lagoon is about {km('tmc_weekuri'):.0f} km from Tambolaka by road and Pero about {km('kodi2'):.0f} km. Ratenggaro is about {km('tmc_rat'):.0f} km."],
         ["Can I visit Kodi in one day?", f"Yes. A loop from Tambolaka Airport through Weekuri, Mandorak, Pero, Ratenggaro and Watu Maladong is about {tot('kodi')} km of driving."],
         ["When is the Pasola in Kodi?", "In February or March, on dates set by local priests and confirmed only shortly before. See our Pasola dates page for the latest."]],
 "b": f"""<p>Kodi is the far western end of Sumba: a low peninsula of limestone, grassland and coconut palms that ends in cliffs above the Indian Ocean. It is also one of the most densely populated parts of the island. The four Kodi districts of Southwest Sumba (Kodi, Kodi Bangedo, Kodi Balaghar and Kodi Utara) cover 496 km² and counted 114,070 people at the 2020 census, according to <a href="https://sumbabaratdayakab.bps.go.id/" rel="nofollow">BPS Sumba Barat Daya</a>. That is about 230 people per km², more than six times the density of East Sumba.</p>
<p>For visitors, Kodi is the place of the tall thatched roofs and the stone tombs, of Weekuri Lagoon and of the Pasola in February. It is about an hour from Tambolaka Airport, which makes it the first thing many people see in Sumba.</p>
<h2>Kodi in numbers</h2>
<table><thead><tr><th>District</th><th>Area</th><th>Population (2020 census)</th><th>Administrative centre</th></tr></thead><tbody>
<tr><td>Kodi Utara (North Kodi)</td><td>220.3 km²</td><td>48,860</td><td>Kori</td></tr>
<tr><td>Kodi</td><td>75.0 km²</td><td>30,010</td><td>Bondo Kodi</td></tr>
<tr><td>Kodi Balaghar</td><td>124.8 km²</td><td>17,980</td><td>Panenggo Ede</td></tr>
<tr><td>Kodi Bangedo</td><td>75.9 km²</td><td>17,220</td><td>Walla Ndimu</td></tr></tbody></table>
<p><small>Source: BPS, Kecamatan Dalam Angka series for each district. Kodi Balaghar was split from Kodi Bangedo after 2010.</small></p>
<h2>The north shore: Weekuri and Mandorak</h2>
<p>{PL('weekuri-lagoon', 'Weekuri Lagoon')} is a saltwater lagoon cut off from the ocean by a wall of coral rock. Waves push sea water through the cracks, so the pool stays clear and calm while the surf breaks a few metres away. It is the most visited place in Southwest Sumba, and on weekends it fills with local families; come early on a weekday if you want space. Bring water shoes for the rocks.</p>
<p>{PL('mandorak-beach', 'Mandorak')} is {km('kodi', 1):.0f} km further along: a tiny cove of white sand between two cliffs. The ocean hits the rocks at its mouth, so it is more for looking than swimming. Most people do the two together in a morning.</p>
<h2>The west coast: Pero and Bondo Kodi</h2>
<p>From Mandorak the road turns south to Bondo Kodi, the administrative centre of Kodi district and the place for supplies, then reaches the sea at {PL('pero-beach', 'Pero')}. Pero is a working fishing village. Wooden boats are pulled up on the sand, and a reef break offshore draws a few experienced surfers. The beach faces west, straight out to sea, which makes it one of the best sunset spots on the island. In Tambolaka, the nearest town with data in our tables, the sun sets between {min(r[4] for r in TB)} and {max(r[4] for r in TB)}.</p>
<h2>Ratenggaro and Wainyapu</h2>
<p>{PL('ratenggaro', 'Ratenggaro')} sits right above the beach a few kilometres south of Pero. Its houses have some of the tallest thatched roofs in Sumba, and stone tombs stand between them and the sea. The houses are homes and the tombs are sacred in the Marapu religion, so sign the guestbook, leave a donation and ask before photographing anyone. Do not climb on the tombs.</p>
<p>{PL('wainyapu', 'Wainyapu')}, across the river mouth, has one of the largest groups of stone tombs in Kodi and far fewer visitors. Ask someone in Ratenggaro to take you across. Kodi is one of the places where large stone tombs are still made today; our page on {GD('sumba-megalithic-tombs', 'megalithic tombs')} explains how and why.</p>
<h2>The south coast: Watu Maladong</h2>
<p>{PL('watu-maladong', 'Watu Maladong')} is {km('kodi_wm_rat'):.0f} km south-east of Ratenggaro on a long, rough road. Big rock formations frame a beach with clear water. You will often have it almost to yourself. Ask locally about the road first, and keep away from the rocks when the swell is up.</p>
<h2>A day loop from Tambolaka</h2>
{legs('kodi')}
<p>That is about {tot('kodi')} km. With stops it fills a full day, so start early. If you only have an afternoon, do Weekuri and Mandorak and end at Pero for sunset, about {km('kodi2'):.0f} km from Tambolaka.</p>
<h2>The Pasola in Kodi</h2>
<p>Kodi is one of four places in Sumba that hold the Pasola, the ritual contest in which horsemen throw blunt wooden spears at each other. It falls in February or March, and the exact days are set by local priests following the moon and the appearance of the nyale sea worms on the beaches. In 2026, for example, one of the March events was held at Wainyapu. Dates are confirmed only shortly ahead. See {GD('pasola-dates', 'Pasola dates')} and {GD('pasola-guide', 'our Pasola guide')}.</p>
<h2>Practical notes</h2>
<ul><li><b>Getting there.</b> Tambolaka Airport is the gateway; see {GD('tambolaka-airport', 'our airport guide')}.</li>
<li><b>Swimming.</b> Outside Weekuri, the sea in Kodi is open ocean. Read {GD('swimming-in-sumba', 'where to swim in Sumba')} before you go in.</li>
<li><b>Money.</b> Bring cash from Tambolaka for donations, parking and food.</li>
<li><b>Villages.</b> See {GD('traditional-villages-sumba', 'traditional villages in Sumba')} for what to expect and how to behave.</li></ul>
{ROADNOTE}"""})

# ---------------------------------------------------------------- 4
GUIDES6.append({"s": "wanokaka-lamboya", "img": "pasola-wanokaka",
 "t": "Wanokaka and Lamboya: West Sumba's south coast",
 "d": "The south coast below Waikabubak: Waigalli village, the Wanokaka Pasola field, Rua and Marosi beaches, with a day loop of about 100 km and district facts from BPS.",
 "faq": [["How far is Wanokaka from Waikabubak?", f"The Wanokaka Pasola field is about {km('wk_pasola'):.0f} km south of Waikabubak by road."],
         ["When is the Pasola in Wanokaka and Lamboya?", "The Pasola is held once a year, around February or March, in Kodi, Lamboya, Wanokaka and Gaura. The days are set by Marapu elders and confirmed only shortly before."],
         ["Can you swim at Marosi Beach?", "Marosi has strong currents. Swim only where local people do, never alone, and not when the surf is big."]],
 "b": f"""<p>South of Waikabubak the land drops quickly from the green hills to the sea. In about half an hour you go from the capital of West Sumba to rice fields, hilltop villages and long beaches facing the open Indian Ocean. This coast is shared by three districts: Wanokaka, Lamboya and Laboya Barat. Together they are home to about 50,000 people (2020 census) on 420 km².</p>
<p>It is best known for the Pasola, which is held on fields here every year, but it is worth the trip in any month. This page covers the villages, beaches and the loop that links them.</p>
<h2>The three districts</h2>
<table><thead><tr><th>District</th><th>Area</th><th>Population (2020 census)</th></tr></thead><tbody>
<tr><td>Lamboya</td><td>125.7 km²</td><td>22,059</td></tr>
<tr><td>Wanokaka</td><td>133.7 km²</td><td>18,811</td></tr>
<tr><td>Laboya Barat (West Laboya)</td><td>161.2 km²</td><td>8,815</td></tr></tbody></table>
<p><small>Source: <a href="https://sumbabaratkab.bps.go.id/" rel="nofollow">BPS Sumba Barat</a>, Kecamatan Dalam Angka series.</small></p>
<h2>Wanokaka: Waigalli and the Pasola field</h2>
<p>The road from Waikabubak reaches Wanokaka after about {km('wano', 2):.0f} km. {PL('waigalli-village', 'Waigalli')} is a traditional village on a hilltop, with high-roofed houses and stone tombs. A short way below it is {PL('pasola-wanokaka', 'the field where the Wanokaka Pasola is held')}. For most of the year it is simply an open field.</p>
<p>As in every village, sign the guestbook at Waigalli and leave a donation. The tombs are sacred in the Marapu religion; do not climb on them.</p>
<h2>Rua Beach</h2>
<p>{PL('rua-beach', 'Rua')}, about {km('wk_rua'):.0f} km from Waikabubak, is a pale-sand beach with clear water and few people. On calm days it is one of the nicer places to swim on this coast. Check the sea first: it is the open ocean, and the waves change quickly.</p>
<h2>Marosi Beach and Lamboya</h2>
<p>{PL('marosi-beach', 'Marosi')} is a long, wide stretch of sand on the Lamboya coast, backed by palms and fields. It feels endless and is often empty. The currents are strong, so swim only where local people swim and never alone. Bring shade: there is very little of it.</p>
<p>Kabukarudi, the administrative centre of Lamboya, is on the road back up to Waikabubak. Lamboya also holds a Pasola of its own.</p>
<h2>A day loop from Waikabubak</h2>
{legs('wano')}
<p>The loop is about {tot('wano')} km, including a short warm-up to {PL('prai-ijing', 'Prai Ijing')}, a terraced traditional village on the edge of Waikabubak. Plan a full day if you want to swim and stop in the villages. Skip Prai Ijing if you have already seen {PL('tarung-village', 'Tarung')} in town.</p>
<h2>The Pasola here</h2>
<p>The Pasola is a ritual contest in which riders throw blunt wooden spears at each other from horseback. It is held once a year, around February or March, in Kodi, Lamboya, Wanokaka and Gaura. The exact days are set by Marapu elders and confirmed only a few days ahead, so a trip built around it needs flexible dates. Watch from where local people tell you to, well away from the horses. Our {GD('pasola-dates', 'Pasola dates page')} tracks what is known about the next one.</p>
<h2>When to go</h2>
<p>The south coast follows the same seasons as the rest of West Sumba: a wet season from about December to April and a dry season from May to October. These are the figures for the south coast in our climate data:</p>
{climrow('south', 'South coast')}
<p>In the wet months the hills are green and the rice fields full, but dirt tracks to the beaches can turn to mud. The dry months are better for the beaches and the roads; the Pasola, in February or March, falls in the wet season.</p>
<h2>Surf and the open ocean</h2>
<p>This coast faces south-west into the Indian Ocean, which is why it has surf and also why it needs care. For where and when to surf, see {GD('surf-sumba', 'surfing in Sumba')}. For swimming, see {GD('swimming-in-sumba', 'where to swim in Sumba')}.</p>
<h2>Getting there</h2>
<p>Waikabubak is the base. It is {km('wano2'):.0f} km from Tambolaka Airport by road. For a longer stay in West Sumba, our {GD('day-trips-from-waikabubak', 'day trips from Waikabubak')} lists more places within reach.</p>
{ROADNOTE}"""})

# ---------------------------------------------------------------- 5
GUIDES6.append({"s": "swimming-in-sumba", "img": "weekuri-lagoon",
 "t": "Where to swim in Sumba: calm water, rips and pools",
 "d": "Which beaches and pools in Sumba are good for swimming, which are for looking only, how to spot a rip current, and the emergency numbers to save before you go.",
 "faq": [["Is it safe to swim in Sumba?", "In the right places, yes. The north coast and Weekuri Lagoon are usually calm. The south coast faces the open Indian Ocean and often has strong currents. There are no lifeguards on almost any beach."],
         ["Which beach in Sumba is best for swimming?", "Weekuri Lagoon in the south-west is the easiest. On the north coast, Kapulit, Lenang and Puru Kambera are usually calm. Near Waingapu, Londa Lima has calm water on most days."],
         ["What should I do if I am caught in a rip current?", "Do not swim against it. Stay calm, float, and swim parallel to the shore until you are out of the current, then head back to land. If you cannot, wave and shout for help."],
         ["What is the emergency number in Indonesia?", "112 is the general emergency number. 115 is Basarnas, the national search and rescue agency. Mobile signal is weak on many beaches, so do not count on calling."]],
 "b": f"""<p>Sumba is surrounded by water and has very few lifeguards. Whether a beach is good for swimming depends mostly on which way it faces. The north coast looks across the Sumba Strait towards Flores and is usually calm. The south coast faces the open Indian Ocean, which sends long swells, strong currents and the waves that bring surfers here. Get that one fact right and most of the rest follows.</p>
<p>This page sorts the beaches and pools on our {MAP} into three groups, using what we know about each place, and explains how to read the sea when you get there.</p>
<h2>Usually calm: good for a swim</h2>
<ul><li><b>{PL('weekuri-lagoon', 'Weekuri Lagoon')}</b>, Southwest Sumba. A saltwater lagoon behind a coral wall: clear, calm and safe for most swimmers. Wear water shoes on the rocks.</li>
<li><b>{PL('kapulit-beach', 'Kapulit')}</b>, Central Sumba north coast. A wide white beach with gentle waves where local people fish and snorkel.</li>
<li><b>{PL('lenang-beach', 'Lenang (Pahar)')}</b>, Central Sumba north coast. Clear water and mangroves; usually calm enough to swim and snorkel.</li>
<li><b>{PL('puru-kambera', 'Puru Kambera')}</b>, East Sumba north coast. A long quiet beach, good for swimming on calm days.</li>
<li><b>{PL('londa-lima-beach', 'Londa Lima')}</b>, near Waingapu. Calm on most days and the easiest swim from town.</li></ul>
<h2>Swim with care: open water</h2>
<p>These beaches can be fine on a flat day and dangerous on a rough one. Look before you go in, ask the people who live there, and stay in your depth.</p>
<ul><li><b>{PL('rua-beach', 'Rua')}</b>, West Sumba south coast. One of the nicer swims on this coast when the sea is calm.</li>
<li><b>{PL('marosi-beach', 'Marosi')}</b>, Lamboya. Strong currents: swim only where local people do, and never alone.</li>
<li><b>{PL('maloba-beach', 'Maloba')}</b> and <b>{PL('konda-beach', 'Konda')}</b>, Central Sumba south coast. Waves change quickly here.</li>
<li><b>{PL('tarimbang-bay', 'Tarimbang')}</b>, East Sumba south coast. A surf beach first; swim inside the bay only when it is small.</li>
<li><b>{PL('mananga-beach', 'Mananga')}</b>, Mamboro. A fishing beach on the calmer north coast; boats come and go, so keep clear of them.</li></ul>
<h2>For looking, not swimming</h2>
<ul><li><b>{PL('mandorak-beach', 'Mandorak')}</b>: the ocean pounds the rocks at the entrance of the cove. Only on very calm days.</li>
<li><b>{PL('pero-beach', 'Pero')}</b>: a reef break for experienced surfers, not a swimming beach.</li>
<li><b>{PL('watu-maladong', 'Watu Maladong')}</b>: rock formations and swell; keep away from the rocks when the sea is up.</li>
<li><b>{PL('walakiri-beach', 'Walakiri')}</b>: very shallow, with sharp shells on the bottom. Come for the trees at sunset, and wear shoes.</li>
<li><b>{PL('padadita-beach', 'Padadita')}</b>: Waingapu's town beach and fishing harbour.</li></ul>
<h2>Rip currents: how to spot one and get out</h2>
<p>A rip current is a narrow channel of water flowing away from the beach. It is the main danger on surf beaches anywhere in the world. The US National Weather Service, which runs one of the best-known <a href="https://www.weather.gov/safety/ripcurrent" rel="nofollow">rip current safety programmes</a>, gives signs that work in Sumba too:</p>
<ul><li>a gap in the line of breaking waves, where the water looks flatter;</li>
<li>a channel of darker or churned-up, sandy water;</li>
<li>foam, seaweed or debris moving steadily out to sea.</li></ul>
<p>If you are caught, do not swim against the current. Stay calm and float. Swim parallel to the shore until you feel the pull ease, then swim back at an angle. If you cannot get out, face the beach, wave and shout. Many people who drown in rip currents could swim; they wore themselves out fighting the water.</p>
<h2>Waterfall pools</h2>
<p>Several of Sumba's waterfalls end in pools you can swim in: {PL('waimarang-waterfall', 'Waimarang')}, {PL('kolam-jodoh-waterfall', 'Kolam Jodoh')}, {PL('tanggedu-waterfall', 'Tanggedu')} and the pools below {PL('lapopu-waterfall', 'Lapopu')}. They are at their best in the dry season. After heavy rain, rivers rise fast and turn brown; do not swim then, and never jump into water you have not checked for depth and rocks.</p>
<h2>Rivers and estuaries</h2>
<p>Some rivers and river mouths in Sumba have saltwater crocodiles. Our page on {PL('karendi-beach', 'Karendi')}, on the north coast, warns about the salty river on the way to the beach. As a rule, swim in the sea or in waterfall pools, not in slow brown rivers or estuaries, and ask local people before going into any river.</p>
<h2>Before you go in</h2>
<ul><li><b>Check the forecast.</b> Indonesia's weather agency BMKG publishes wave forecasts for its coastal waters on <a href="https://maritim.bmkg.go.id/" rel="nofollow">maritim.bmkg.go.id</a>. A big south swell means the south coast is for watching.</li>
<li><b>Ask.</b> Fishermen and villagers know where the currents run. If nobody local is swimming, there is usually a reason.</li>
<li><b>Never swim alone</b>, and keep children within reach. See {GD('sumba-with-kids', 'Sumba with kids')}.</li>
<li><b>Save the numbers.</b> 112 for emergencies and 115 for <a href="https://basarnas.go.id/" rel="nofollow">Basarnas</a>, the search and rescue agency. Signal is weak on many beaches.</li>
<li><b>Reef and sun.</b> Wear shoes on coral and rocks, and use reef-safe sun cream. More in {GD('health-safety', 'health and safety in Sumba')} and {GD('snorkeling-diving-sumba', 'snorkeling and diving')}.</li></ul>"""})

# ---------------------------------------------------------------- 6
_mw = A["milkyway_core"]
_mwrows = "".join(f"<tr><td>{MONL[m - 1]}</td><td>{h:.1f} h</td><td>{(a + ' to ' + b) if a else 'not visible in full darkness'}</td><td>{rain('waingapu', m)} mm</td></tr>" for m, h, a, b in _mw)
_nm = [x for x in A["new_moons"] if x >= "2026-12"]
_nmlist = ", ".join(f"{int(x[8:10])} {MONL[int(x[5:7]) - 1]} {x[:4]}" for x in _nm)
GUIDES6.append({"s": "stargazing-sumba", "img": "wairinding-hill",
 "t": "Stargazing in Sumba: Milky Way season and moon dates",
 "d": "When and where to see the Milky Way in Sumba: hours of dark sky with the galactic core up, month by month, new moon dates for 2027, what you can see from 10° south, and where to go.",
 "faq": [["When is the best time to see the Milky Way in Sumba?", "From May to August. The bright core of the Milky Way is high in a fully dark sky for 6 to 10 hours a night in those months, and they are also the driest of the year."],
         ["Can you see the Southern Cross from Sumba?", "Yes. Sumba is about 10 degrees south of the equator, so the Southern Cross and the two Magellanic Clouds are all visible. The North Star is not: it stays below the horizon."],
         ["When is the next new moon?", f"New moons in the coming months fall on {', '.join(f'{int(x[8:10])} {MONL[int(x[5:7]) - 1]}' for x in _nm[:3])} (times in WITA). Plan the darkest nights for the week around these dates."]],
 "b": f"""<p>Sumba has no large city. The biggest town, Waingapu, had 35,856 people in its town district at the 2020 census according to BPS, and once you leave the four regency capitals the nights are dark. Add a long dry season, and the Milky Way is easy to see with your own eyes. This page puts numbers on that: when the sky is dark, when the core of the galaxy is up, and when the moon is out of the way.</p>
<p>We calculated the figures for Waingapu with the open-source <a href="https://rhodesmill.org/pyephem/" rel="nofollow">PyEphem</a> astronomy library. They hold for the whole island to within a few minutes.</p>
<h2>Milky Way season, month by month</h2>
<p>The brightest part of the Milky Way is its core, in the constellations Sagittarius and Scorpius. The table shows, for the middle of each month, how many hours the core is at least 15° above the horizon while the sky is fully dark (the Sun more than 18° below the horizon), and the rainfall in Waingapu from our ten-year climate data. Less rain usually means clearer skies.</p>
<table><thead><tr><th>Month</th><th>Core up in full darkness</th><th>When (WITA)</th><th>Rain, Waingapu</th></tr></thead><tbody>{_mwrows}</tbody></table>
<p>The best window is clear: May to August, when the core is up for most of the night and the rain has almost stopped. In June the core is already high when darkness falls and stays up until dawn. In September and October it is still there in the evening. From November to January it is lost in the glow of the Sun, and those are also the wettest months.</p>
<h2>Work around the moon</h2>
<p>A full or nearly full moon washes out the Milky Way, even in a dark place. The best nights are the week either side of a new moon. New moons in the coming year, in local time (WITA, UTC+8), fall on: {_nmlist}.</p>
<p>A quick rule: around a new moon the whole night is dark. In the week after it, the crescent sets in the evening, so the late night is dark. In the week before it, the moon rises only in the early morning, so the evening is dark.</p>
<h2>What you can see from 10° south</h2>
<p>Sumba lies at about 9.5° to 10° south. From here a lot of the southern sky that people in Europe, North America or northern Asia never see is high overhead.</p>
<ul><li><b>The Southern Cross (Crux)</b> rises to about 40° above the southern horizon. It is best in the evening from April to June.</li>
<li><b>The Large and Small Magellanic Clouds</b>, two small galaxies next to ours, reach about 30° and 27° above the southern horizon. They look like pale patches of cloud that do not move. They are best in the evening from November to February, when you will need a clear night between the rains.</li>
<li><b>The galactic core</b> passes about 70° up, almost overhead, which is higher than from anywhere in Europe or the United States.</li>
<li><b>The North Star (Polaris)</b> is not visible: from this latitude it stays below the northern horizon.</li></ul>
<h2>Where to go</h2>
<p>Get away from the towns and find a clear horizon to the south. Open savanna is ideal, because there are no trees in the way. Some places on our {MAP} that fit:</p>
<ul><li><b>{PL('mamboro-savanna', 'The Mamboro savanna')}</b> on the north coast of Central Sumba, far from any town.</li>
<li><b>{PL('puru-kambera', 'Puru Kambera')}</b> and the {PL('napu-valley', 'Napu valley')} on the north coast of East Sumba.</li>
<li><b>{PL('wairinding-hill', 'Wairinding Hill')}</b>, open grass hills next to the main road, about 25 km from Waingapu. The town glows to the east, but the southern sky is dark.</li>
<li><b>South coast beaches</b> such as {PL('marosi-beach', 'Marosi')} or {PL('tarimbang-bay', 'Tarimbang')}, which face the open ocean to the south.</li></ul>
<p>To compare places, the <a href="https://www.lightpollutionmap.info/" rel="nofollow">light pollution map</a> shows satellite measurements of artificial light at night for the whole island.</p>
<h2>Safety and respect at night</h2>
<ul><li>Do not drive long distances after dark to reach a spot. Roads are unlit and animals sleep on them. Choose a place close to where you are staying.</li>
<li>Do not go alone, and tell someone where you are going. Bring a torch with a red light so you keep your night vision.</li>
<li>Land belongs to someone, even when it looks empty. Near a village, ask first. Do not set up near graves or ritual places.</li>
<li>Mosquitoes are most active at dusk. Cover up and use repellent; see {GD('health-safety', 'health and safety')}.</li></ul>
<h2>Photographing the night sky</h2>
<p>A phone with a night mode on a small tripod can catch the Milky Way on a moonless night here. With a camera, a wide lens, the widest aperture, ISO 1600 to 6400 and exposures of 10 to 20 seconds are a good start; longer exposures turn stars into short streaks. If you plan to use a drone at blue hour, read {GD('drones-photography-sumba', 'our photography and drone guide')} first. For the first and last light of the day, see {GD('sunrise-sunset-times-sumba', 'sunrise and sunset times in Sumba')}.</p>"""})

# ---------------------------------------------------------------- 7
_sunrows = "".join(f"<tr><td>{MONL[i]}</td><td>{w[1]}</td><td>{w[2]}</td><td>{w[4]}</td><td>{w[5]}</td><td>{t[2]}</td><td>{t[4]}</td></tr>" for i, (w, t) in enumerate(zip(WG, TB)))
_az = "".join(f"<tr><td>{MONL[i]}</td><td>{w[3]}°</td><td>{w[6]}°</td></tr>" for i, w in enumerate(WG))
GUIDES6.append({"s": "sunrise-sunset-times-sumba", "img": "brotherhood-hill",
 "t": "Sunrise and sunset times in Sumba, month by month",
 "d": "Sunrise, sunset and twilight times for Waingapu and Tambolaka for every month, where on the horizon the sun rises and sets, and the best places for first and last light.",
 "faq": [["What time is sunrise in Sumba?", f"Between about {A['earliest_rise'][1][:5]} in mid-November and {A['latest_rise'][1][:5]} in mid-July in Waingapu (WITA, UTC+8). Tambolaka is about 4 minutes later."],
         ["What time is sunset in Sumba?", f"Between about {A['earliest_set'][2][:5]} in late May and {A['latest_set'][2][:5]} in late January in Waingapu. Tambolaka is about 4 minutes later."],
         ["Does Sumba change the clock for summer time?", "No. Sumba is on WITA (Central Indonesian Time, UTC+8) all year, the same as Bali."],
         ["How long is the day in Sumba?", f"Close to 12 hours all year: from about 11 h 34 min in mid-June to about 12 h 41 min in mid-December."]],
 "b": f"""<p>Near the equator the length of the day barely changes, but the exact times do, and in Sumba they move in a way that surprises people. The earliest sunrise of the year is in mid-November, not in December. The latest sunset is in late January. And the sun swings a long way along the horizon, from east-north-east in June to east-south-east in December, which changes which beaches and hills catch the light.</p>
<p>We calculated the times below for 2027 with the <a href="https://rhodesmill.org/pyephem/" rel="nofollow">PyEphem</a> astronomy library, using the standard definition of sunrise and sunset (the top of the Sun on a flat sea horizon). They repeat within a minute or two every year. You can check any date with the <a href="https://gml.noaa.gov/grad/solcalc/" rel="nofollow">NOAA solar calculator</a>.</p>
<h2>Times for the 15th of each month</h2>
<p>All times are WITA (UTC+8). Sumba does not use summer time. "First light" and "last light" are the start and end of civil twilight, when there is enough light to see without a torch.</p>
<table><thead><tr><th>Month</th><th>Waingapu first light</th><th>Waingapu sunrise</th><th>Waingapu sunset</th><th>Waingapu last light</th><th>Tambolaka sunrise</th><th>Tambolaka sunset</th></tr></thead><tbody>{_sunrows}</tbody></table>
<p>Tambolaka is about 1° of longitude west of Waingapu, so everything there happens about 4 minutes later. Waikabubak and Waibakul fall in between.</p>
<h2>A short twilight</h2>
<p>Twilight is short in the tropics. In Sumba, first light comes only about 22 minutes before sunrise, and it is dark about 22 minutes after sunset. If you want the colour before sunrise, be in place 30 minutes early. For a sunset photo, arrive at least an hour early: once the sun touches the sea, you have little time left.</p>
<h2>Where the sun rises and sets</h2>
<p>The direction changes through the year. The table gives the compass bearing of sunrise and sunset in Waingapu (90° is due east, 270° due west).</p>
<table><thead><tr><th>Month</th><th>Sunrise bearing</th><th>Sunset bearing</th></tr></thead><tbody>{_az}</tbody></table>
<p>In June and July the sun rises and sets about 23° north of due east and due west. In December and January it is about 24° south of them. Over a few months that moves the sunset point by almost 50° along the horizon, enough to put it behind a headland or a hill at one time of year and over open sea at another. When you scout a spot, check the bearing for your month.</p>
<h2>Good places for first light</h2>
<ul><li><b>{PL('brotherhood-hill', 'Brotherhood Hill')}</b>, a few minutes from Waingapu, with views across the valleys. The quickest sunrise if you are staying in town.</li>
<li><b>{PL('wairinding-hill', 'Wairinding Hill')}</b>, {km('w_wairinding'):.0f} km from Waingapu by road. Famous at sunset, quiet at dawn, and the low light picks out every fold in the grass.</li>
<li><b>{PL('mamboro-savanna', 'The Mamboro savanna')}</b> on the north coast of Central Sumba, where herds of horses and buffalo move across the hills in the early morning.</li>
<li><b>{PL('napu-valley', 'The Napu valley')}</b> in the dry north-east, for wide grass hills and a green river valley.</li></ul>
<h2>Good places for last light</h2>
<p>Our full list is in {GD('best-sunsets-in-sumba', 'the best sunsets in Sumba')}. Three that depend most on timing:</p>
<ul><li><b>{PL('walakiri-beach', 'Walakiri Beach')}</b>, east of Waingapu. The "dancing trees" only work as silhouettes if the tide is low at sunset, so you need both tables.</li>
<li><b>{PL('pero-beach', 'Pero')}</b>, on the west coast of Kodi, faces straight out to sea.</li>
<li><b>{PL('wairinding-hill', 'Wairinding Hill')}</b>: arrive an hour before sunset.</li></ul>
<h2>Planning a day around the light</h2>
<p>With sunrise around 6 and sunset around 6, you have about 12 hours of daylight all year. Long drives are best started at first light so you arrive before dark; see {GD('drive-across-sumba', 'driving across Sumba')}. In the dry season the middle of the day is hot and the light is flat, which is a good time for the road or a swim. For the night sky after the sun has gone, see {GD('stargazing-sumba', 'stargazing in Sumba')}, and for the weather, {GD('sumba-weather-by-month', 'Sumba weather by month')}.</p>"""})

# ---------------------------------------------------------------- 8
GUIDES6.append({"s": "melolo-rende-sumba", "img": "praiyawang-rende",
 "t": "Melolo and Rende: the south-east corner of East Sumba",
 "d": "Melolo, Rende and Waimarang in the south-east of Sumba: the royal village of Praiyawang, a 2,800-year-old burial site, a waterfall pool and a day loop of 170 km from Waingapu.",
 "faq": [["How far is Rende from Waingapu?", f"Praiyawang, the royal village of Rende, is about {km('w_rende'):.0f} km from Waingapu by road. Melolo is about {km('w_mel'):.0f} km."],
         ["Can I visit Rende and Waimarang in one day?", f"Yes. A loop from Waingapu through Melolo, Praiyawang and Waimarang Waterfall is about {tot('east_d3')} km and fills a day."],
         ["Can you see the archaeological sites at Melolo?", "We have not found official visitor information for the excavated burial sites. Treat them as part of the history of the area rather than as a sight with opening hours."]],
 "b": f"""<p>The road south-east from Waingapu runs for about {km('w_mel'):.0f} km through dry hills and reaches the coast at Melolo. This corner of Sumba, now the districts of Umalulu and Rindi, is home to old royal villages such as Praiyawang in Rende. It also holds one of the oldest dated human burial sites found on the island. Today it is quiet. Few visitors come this far, and most of those who do come for one day.</p>
<h2>The area in brief</h2>
<table><thead><tr><th>District</th><th>Area</th><th>Population (2020 census)</th><th>Centre</th></tr></thead><tbody>
<tr><td>Umalulu</td><td>307.9 km²</td><td>17,667</td><td>Melolo</td></tr>
<tr><td>Rindi</td><td>366.5 km²</td><td>9,628</td><td>Tanaraing</td></tr></tbody></table>
<p><small>Source: <a href="https://sumbatimurkab.bps.go.id/" rel="nofollow">BPS Sumba Timur</a>, Kecamatan Dalam Angka series. Rende lies in Rindi district.</small></p>
<h2>2,800 years of people at Melolo</h2>
<p>Archaeologists have excavated several prehistoric burial sites in East Sumba. At Lambanapu, near Waingapu, the excavation published in BRIN's journal Amerta found skeletons buried in pottery urns and directly in the ground, with pottery, beads, metal jewellery and stone tools, and showed that the site was <a href="https://ejournal.brin.go.id/amerta/article/view/3229" rel="nofollow">inhabited at least 2,000 years ago</a>.</p>
<p>In July 2024, BRIN archaeologist Retno Handini reported that the oldest date among the Sumba sites she has studied comes from Melolo, at about 2,800 years, which makes it one of the earliest signs of people living on the island; the finds there include 26 individual skeletons, according to a <a href="https://inet.detik.com/science/d-7442606/peneliti-brin-ungkap-pulau-sumba-dihuni-manusia-sejak-2-800-tahun-lalu" rel="nofollow">report of her presentation</a>. There is no site museum that we know of. The story is worth knowing because it connects the stone tombs you see today with a burial tradition that goes back thousands of years. Our {GD('sumba-history', 'short history of Sumba')} picks it up from there.</p>
<h2>Praiyawang, the royal village of Rende</h2>
<p>{PL('praiyawang-rende', 'Praiyawang')} is {R['east_d3'][1][2]:.0f} km from Melolo. It is the old royal village of Rende, famous for some of the largest carved stone tombs in Sumba and for fine ikat. The tombs stand among the high-roofed houses. See {GD('sumba-megalithic-tombs', 'megalithic tombs')} and {GD('marapu-religion-sumba', 'Marapu')} for what they mean.</p>
<p>This is a living village, not a museum. Sign the guestbook, leave a donation, and ask before photographing the tombs or anyone in the village. Our {GD('respect-etiquette', 'etiquette guide')} covers the rest.</p>
<h2>Waimarang Waterfall</h2>
<p>{PL('waimarang-waterfall', 'Waimarang')} is about {R['east_d3'][2][2]:.0f} km from Praiyawang, in the Rindi hills. The water falls into a round, jade-green pool closed in by rock walls, like a natural amphitheatre. The last part of the way is a steep walk down on loose ground. Wear proper shoes, go in the dry season, and stay away after heavy rain, when the path is slippery and the pool turns brown.</p>
<h2>The loop from Waingapu</h2>
{legs('east_d3')}
<p>About {tot('east_d3')} km in all. Leave Waingapu early, see Praiyawang in the morning and keep the afternoon for Waimarang and the swim. If you prefer, do it the other way round to have the pool earlier in the day. This is also day three of our {GD('east-sumba-3-days', 'three-day East Sumba route')}.</p>
<h2>When to go</h2>
<p>East Sumba is the driest part of the island, and the south-east shares that climate. These are the ten-year averages for Waingapu, the nearest town in our climate data:</p>
{climrow('waingapu', 'Waingapu')}
<p>From May to October there is hardly any rain, and that is the season for Waimarang: the path down is dry and the pool clear. From December to March, heavy showers can make the last part of the walk dangerous.</p>
<h2>Practical notes</h2>
<ul><li><b>Supplies.</b> Melolo is the last real town on this route. Fill up with fuel and cash in Waingapu.</li>
<li><b>Ikat.</b> Rende and the villages around it weave some of the finest ikat in Sumba. Buy directly from weavers when you can; see {GD('sumba-ikat-weaving', 'our ikat guide')}.</li>
<li><b>Going further.</b> The south coast at {PL('tarimbang-bay', 'Tarimbang')} is reached by a different road from Waingapu, not from here.</li></ul>
{ROADNOTE}"""})

# ---------------------------------------------------------------- 9
GUIDES6.append({"s": "wunga-napu-haharu", "img": "napu-valley",
 "t": "Wunga and Napu: the dry north-east of Sumba",
 "d": "Haharu, the emptiest district of East Sumba: the Napu valley, Wunga village of the first ancestors and the Puru Kambera coast, with distances from Waingapu and what to bring.",
 "faq": [["How far is Wunga from Waingapu?", f"About {km('w_wunga'):.0f} km by road, via the coast road past Puru Kambera."],
         ["Why is Wunga important?", "In Sumbanese oral tradition, Wunga is where the island's first ancestors came ashore. That gives it a special place in Marapu belief."],
         ["Do I need a guide for Wunga and Napu?", "For Wunga, yes: go with a local guide who can introduce you to the village. Napu can be reached by road, but a driver who knows the area makes the day much easier."]],
 "b": f"""<p>Haharu, in the north-east of Sumba, is the emptiest district of East Sumba. It covers 601.5 km² and had 6,248 inhabitants at the 2020 census, according to <a href="https://sumbatimurkab.bps.go.id/" rel="nofollow">BPS Sumba Timur</a>. That is about 10 people per km², against about 35 for East Sumba as a whole. The land is grass, rock and dry riverbeds, and the coast looks north across the Sumba Strait.</p>
<p>It is also the place where, in Sumbanese oral tradition, the first ancestors of the island came ashore. For a day trip from Waingapu, few places give you as strong a sense of how big and empty Sumba can be.</p>
<h2>Getting there from Waingapu</h2>
{legs('wunga')}
<p>The coast road from Waingapu passes {PL('puru-kambera', 'Puru Kambera')} after {km('wunga', 0):.0f} km and then enters Haharu. Rambangaru is the administrative centre of the district. The total distance to Wunga is about {tot('wunga')} km. That is under two hours of driving at our planning speed, but the road gets slower towards the end, so allow more.</p>
<h2>The Napu valley</h2>
<p>{PL('napu-valley', 'Napu')} is a village above a green river valley, surrounded by wide grass hills. In the dry months the grass on the hills turns gold while the river valley stays greener. The light is at its best early in the morning and late in the afternoon. Bring water and sun protection: there is almost no shade.</p>
<h2>Wunga, the village of the first ancestors</h2>
<p>{PL('wunga-village', 'Wunga')} is a traditional village close to Napu. According to Sumbanese oral tradition, this is where the first ancestors landed, which gives it a particular place in Marapu belief. The Japanese anthropologist Makoto Koike described it in a 2009 <a href="https://crcs.ugm.ac.id/?p=1424" rel="nofollow">interview with Gadjah Mada University's CRCS</a> as "the first village in Sumba", with a mythical character.</p>
<p>Go with a local guide who can introduce you. The usual rules for {GD('traditional-villages-sumba', 'traditional villages')} apply: sign the guestbook, leave a donation, ask before taking photos and do not climb on the stone tombs. Find out before you go whether a ceremony is taking place; on those days, visitors may not be welcome.</p>
<h2>Puru Kambera on the way</h2>
<p>{PL('puru-kambera', 'Puru Kambera')} is where the savanna runs straight down to a long beach. Horses belonging to local families graze among the trees; keep your distance from them. On calm days it is one of the better places to swim in East Sumba, and a good stop on the way back. See {GD('swimming-in-sumba', 'where to swim in Sumba')}.</p>
<h2>When to go</h2>
<p>We do not have a climate series for Haharu itself. Waingapu, about 60 km away on the same dry side of the island, gives the pattern:</p>
{climrow('waingapu', 'Waingapu')}
<p>Come between May and October if you want gold grass, dusty tracks and clear evenings. In the rainy months, mainly December to March, the hills turn green and the valley floor is at its best, but river crossings can be harder and some tracks are slow.</p>
<h2>What to bring</h2>
<ul><li><b>Fuel and cash from Waingapu.</b> OpenStreetMap shows no fuel station or ATM in Haharu.</li>
<li><b>Water and food</b> for the day. Shops are few and small.</li>
<li><b>Sun protection.</b> This is one of the driest parts of the island; see {GD('sumba-weather-by-month', 'Sumba weather by month')} for the seasons.</li>
<li><b>Offline maps.</b> Mobile coverage is patchy. Save offline maps on your phone before you leave town, and look at our {MAP} while you still have signal.</li></ul>
<h2>Combine it with</h2>
<p>Haharu fits well with a day at {PL('tanggedu-waterfall', 'Tanggedu')}, which is inland from Puru Kambera, or with the {GD('east-sumba-3-days', 'three-day East Sumba route')}. If you are heading west along the north coast, see {GD('drive-across-sumba', 'driving across Sumba')} and the {GD('sumba-north-coast', 'north coast guide')}.</p>
{ROADNOTE}"""})
