# 13-nov-2026 · Third batch of long guides (targets from claude/sumbasecrets-auditoria-nota-100.md and -nota-100-top.md).
# Rules as in guides3.py: English source, machine-translated at build time; no hotel names, no invented prices,
# no em dashes. Distances are computed from our verified coordinates; climate tables come from climate.json.
import json, math
from places import PLACES, AIRPORTS, TOWNS
from places_mamboro import MAMBORO
from coords_fix import COORD_FIX
def PL(s, t): return f'<a href="/{{l}}/place/{s}/">{t}</a>'
def GD(s, t): return f'<a href="/{{l}}/guide/{s}/">{t}</a>'
MAP = '<a href="/{l}/map/">interactive map</a>'
_ALL = {p["s"]: COORD_FIX.get(p["s"], p["ll"]) for p in PLACES + MAMBORO}
_NAME = {p["s"]: p["en"]["n"] for p in PLACES + MAMBORO}
def _km(a, b):
    R, t = 6371, math.radians
    dl, dn = t(b[0] - a[0]), t(b[1] - a[1])
    h = math.sin(dl / 2) ** 2 + math.cos(t(a[0])) * math.cos(t(b[0])) * math.sin(dn / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))
def _drive(k):
    m = max(15, round((k * 1.35 / 35 * 60 + 10) / 15) * 15); h, mm = divmod(m, 60)
    return (f"{h} h" if h else "") + (" " if h and mm else "") + (f"{mm} min" if mm else "")
def _table(origin, slugs):
    rows = sorted(((round(_km(origin, _ALL[s])), s) for s in slugs), key=lambda x: x[0])
    return "<table><thead><tr><th>Place</th><th>Straight line</th><th>By road (approx.)</th></tr></thead><tbody>" + "".join(
        f"<tr><td>{PL(s, _NAME[s])}</td><td>{k} km</td><td>{_drive(k)}</td></tr>" for k, s in rows) + "</tbody></table>"
TMC = [a for a in AIRPORTS if a["code"] == "TMC"][0]["ll"]; WGP = [a for a in AIRPORTS if a["code"] == "WGP"][0]["ll"]
CL = json.load(open("climate.json"))
MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
def _clim(key, label):
    r = CL[key]
    return (f"<h3>{label}</h3><table><thead><tr><th>Month</th><th>Max °C</th><th>Min °C</th><th>Rain (mm, model)</th></tr></thead><tbody>" +
            "".join(f"<tr><td>{MON[m[0]-1]}</td><td>{round(m[1])}</td><td>{round(m[2])}</td><td>{m[3]}</td></tr>" for m in r) + "</tbody></table>")
WEST = ["weekuri-lagoon", "mandorak-beach", "ratenggaro", "pero-beach", "watu-maladong", "weekacura-waterfall", "lapopu-waterfall", "tarung-village", "marosi-beach", "prai-ijing"]
EAST = ["walakiri-beach", "wairinding-hill", "tanggedu-waterfall", "puru-kambera", "prailiu-village", "praiyawang-rende", "waimarang-waterfall", "tarimbang-bay", "londa-lima-beach"]

GUIDES4 = []

GUIDES4.append({"s": "tambolaka-airport", "img": "weekuri-lagoon", "t": "Tambolaka Airport (TMC): flights, transfers and distances",
 "d": "Everything about Tambolaka Airport in Southwest Sumba: which cities fly there, how long the flight from Bali takes, how to get from the airport to Weekuri, Kodi and Waikabubak, and drive times.",
 "faq": [
  ["Where is Tambolaka Airport?", "Tambolaka Airport (IATA code TMC) is on the north side of Southwest Sumba, next to the town of Tambolaka (Waitabula), the regency capital. It is the main gateway to the west of the island."],
  ["How long is the flight from Bali to Tambolaka?", "About an hour on a direct flight. The distance between Denpasar and Tambolaka is roughly 450 km."],
  ["Which airlines fly to Tambolaka?", "Flight-search sites in 2026 list NAM Air, Batik Air, Sriwijaya Air and Wings Air on the Bali route, with fewer flights from Lombok (Praya), Kupang and Surabaya. Schedules change often, so check current timetables before planning."],
  ["How do I get from Tambolaka Airport to my hotel?", "There is no public bus. Arrange a pickup with your accommodation or a driver in advance; taxis and drivers also wait for arriving flights."],
  ["Should I fly into Tambolaka or Waingapu?", "Tambolaka if you are visiting the west (Weekuri, Kodi, Waikabubak, Pasola). Waingapu for the east (Wairinding, Walakiri, Tanggedu). For a full trip, fly into one and out of the other."]],
 "b": f"""<p>Tambolaka is the busiest airport in Sumba and the one most visitors use. It sits in Southwest Sumba, a short drive from the island's most photographed places, and it is the natural starting point for Weekuri Lagoon, the Kodi coast, the traditional villages around Waikabubak and, in February and March, the Pasola. This guide explains how to get there, what to expect on arrival and how far everything is from the runway.</p>
<h2>Tambolaka Airport in brief</h2>
<ul><li><b>Code:</b> TMC.</li><li><b>Location:</b> Southwest Sumba (Sumba Barat Daya), next to the regency capital Tambolaka, also called Waitabula.</li><li><b>Time zone:</b> WITA, UTC+8, the same as Bali.</li><li><b>Main route:</b> Denpasar (Bali), about an hour of flying for roughly 450 km.</li><li><b>Other routes:</b> Lombok (Praya), Kupang and Surabaya appear in 2026 timetables, with fewer weekly flights than Bali.</li></ul>
<h2>Flights to Tambolaka</h2>
<p>Bali is by far the most common way in. In 2026 flight-search sites showed between about 18 and 40 flights a week between Denpasar and Tambolaka, depending on the season and the source, operated by airlines such as NAM Air, Batik Air, Sriwijaya Air and Wings Air. Numbers move a lot from month to month, and small airlines change schedules at short notice, so always check the current timetable and book directly or through a well-known agency.</p>
<p>The planes are small, often turboprops, and baggage allowances can be tight: surfboards and large bags may cost extra or need to be booked in advance. Morning flights are usually more reliable than late ones, because a delay in the afternoon can push you into the evening, when roads in Sumba are dark and slow. If you have an international flight to catch in Bali on the way home, leave a comfortable buffer of at least a few hours, or better, a night in Bali.</p>
<p>For the full route from Bali, including ferries and what to do if your flight is cancelled, see our guide {GD('bali-to-sumba', 'how to get from Bali to Sumba')}.</p>
<h2>Arriving at Tambolaka</h2>
<p>The terminal is small and arrivals are quick. There is no public bus or train, and ride-hailing apps are not dependable here, so the easiest plan is to have someone waiting for you: most guesthouses and hotels offer a pickup, and local drivers meet flights. If you plan to rent a car with a driver for your whole stay, ask the driver to collect you at the airport; it saves a day.</p>
<p>Withdraw some cash before leaving town. Tambolaka has banks and ATMs, but once you are on the coast or in the villages, card payments are rare. Our {GD('money-atms-sim-sumba', 'guide to money, ATMs and SIM cards')} covers this in detail.</p>
<h2>Distances from Tambolaka Airport</h2>
<p>The table shows straight-line distances from the airport and an estimated drive time by car, assuming about 35 km/h on average. Real times depend on the road, the weather and stops; in the rainy season add more.</p>
{_table(TMC, WEST)}
<p>As a rule of thumb: the Kodi coast (Weekuri, Mandorak, Ratenggaro, Pero) is the closest group of sights, about an hour away. Waikabubak and the villages of West Sumba take around an hour and a half. The south coast of Lamboya and Wanokaka is further. East Sumba is a full day's drive, which is why many travellers leave from {GD('waingapu-airport', 'Waingapu Airport')} instead.</p>
<h2>Where to go first</h2>
<p>On an arrival day with a morning flight, a classic first afternoon is {PL('weekuri-lagoon', 'Weekuri Lagoon')} followed by sunset at {PL('pero-beach', 'Pero Beach')} or {PL('mandorak-beach', 'Mandorak')}. The next day can cover {PL('ratenggaro', 'Ratenggaro')} and the villages of Kodi, then Waikabubak. Our {GD('itinerary-3-days', '3-day itinerary')} and {GD('itinerary-5-days', '5-day itinerary')} start from Tambolaka, and the {MAP} shows every place with its distance from the airport.</p>
<h2>Practical tips</h2>
<ul><li>Reconfirm your flight the day before; small airlines sometimes merge or move flights.</li><li>Keep valuables and medicines in your hand luggage, because checked bags can be offloaded when planes are full.</li><li>Agree the price of a transfer before getting in the car.</li><li>If you are heading to Central or East Sumba after landing, start early: the road across the island is long and slow after dark.</li></ul>"""})

GUIDES4.append({"s": "waingapu-airport", "img": "wairinding-hill", "t": "Waingapu Airport (WGP): flights, transfers and distances in East Sumba",
 "d": "Guide to Waingapu Airport, Umbu Mehang Kunda, the gateway to East Sumba: flights, getting into town, distances to Wairinding, Walakiri and Tanggedu, and tips.",
 "faq": [
  ["What is the airport in East Sumba?", "Waingapu Airport, officially Umbu Mehang Kunda (IATA code WGP), just outside Waingapu, the largest town on the island."],
  ["How far is Waingapu Airport from town?", "Only a few kilometres; the drive into the centre of Waingapu is short."],
  ["Where can I fly to from Waingapu?", "Bali (Denpasar) is the main connection, with other flights in Nusa Tenggara such as Kupang and Ende appearing in timetables. Routes change, so check current schedules."],
  ["Is Waingapu a good base?", "Yes for East Sumba: Wairinding Hill, Walakiri Beach, Puru Kambera and the Tanggedu canyon are all day trips from town."]],
 "b": f"""<p>If Tambolaka is the door to the green west of Sumba, Waingapu is the door to the east: open savanna, the rolling hills of Wairinding, the mangroves of Walakiri at sunset and the canyon pools of Tanggedu. Waingapu Airport, officially named Umbu Mehang Kunda, is a few minutes from the island's largest town and is the best place to start or end a trip that covers East Sumba.</p>
<h2>Waingapu Airport in brief</h2>
<ul><li><b>Code:</b> WGP.</li><li><b>Official name:</b> Umbu Mehang Kunda.</li><li><b>Location:</b> next to Waingapu, capital of East Sumba regency.</li><li><b>Time zone:</b> WITA, UTC+8.</li></ul>
<h2>Flights</h2>
<p>Bali (Denpasar) is the main connection, and there are flights within East Nusa Tenggara, for example to Kupang and Ende in Flores. There are usually fewer flights than at Tambolaka, so book early in July and August and around holidays. The aircraft are small, so the same rules apply as at Tambolaka: watch baggage limits and leave a buffer before international connections.</p>
<h2>Open-jaw: the smart way to see the whole island</h2>
<p>Sumba is about 200 km from west to east and the drive across takes most of a day. The most efficient plan is an open-jaw ticket: fly from Bali to Tambolaka, travel east, and fly out of Waingapu (or the other way round). You see both halves of the island without driving the same road twice. Our {GD('itinerary-7-days', '7-day itinerary')} is built this way.</p>
<h2>Getting into town and around</h2>
<p>Waingapu has more services than anywhere else on Sumba: banks, ATMs, markets, fuel and a choice of places to stay. Most accommodation offers airport pickups, and drivers can be hired for day trips. Public transport outside town is limited, so for the sights below you need a car with a driver or a scooter, if you are an experienced rider.</p>
<h2>Distances from Waingapu Airport</h2>
<p>Straight-line distance and an estimated drive time at about 35 km/h on average:</p>
{_table(WGP, EAST)}
<p>Walakiri Beach is the classic first evening: it is close to town and its "dancing" mangrove trees are at their best at sunset. Wairinding Hill is best early in the morning or late afternoon. Tanggedu is a half-day trip with a walk at the end; check our {PL('tanggedu-waterfall', 'Tanggedu page')} for the latest notes. The south coast around Tarimbang is a long drive and worth an overnight.</p>
<h2>Tips</h2>
<ul><li>East Sumba is much drier than the west; from May to October expect sun, dust and strong light, so bring a hat and plenty of water.</li><li>Fuel up in Waingapu before heading to the south coast.</li><li>The sunset at Walakiri is popular; arrive an hour early for low tide and soft light.</li><li>See the {MAP} for every place in the east and its distance from town.</li></ul>"""})

GUIDES4.append({"s": "ferry-to-sumba", "img": "londa-lima-beach", "t": "Ferry to Sumba: routes from Flores, Sumbawa, Bali and Timor",
 "d": "How to reach Sumba by boat: Pelni and ASDP routes to Waingapu and Waikelo, typical crossing times, what the ships are like and how to check schedules.",
 "faq": [
  ["Is there a ferry to Sumba?", "Yes. Sumba has two main ports: Waingapu in the east and Waikelo near Tambolaka in the west. Pelni passenger ships and ASDP car ferries link them with Flores, Sumbawa, Timor and, less often, Bali."],
  ["How long is the ferry from Flores to Sumba?", "The ship from Ende (Flores) to Waingapu takes around 13 hours, and services are not daily."],
  ["Is there a ferry from Sumbawa to Sumba?", "Yes. The ASDP crossing between Sape (Sumbawa) and Waikelo (Southwest Sumba) was officially reopened in May 2026; the trip takes roughly 8 to 9 hours."],
  ["Can I take a ferry from Bali to Sumba?", "Some Pelni ships call at Benoa (Bali) and Sumba on their loops, but the trip is long and infrequent. For most travellers flying is far more practical."]],
 "b": f"""<p>Almost everyone flies to Sumba, but the island is also connected by sea. Ferries are cheaper and can fit into a slow overland trip through Nusa Tenggara, for example from Flores or Sumbawa. They are also slower, less frequent and more affected by weather. This guide explains the routes, how long they take and how to check what is actually running.</p>
<h2>Sumba's ports</h2>
<ul><li><b>Waingapu</b> (East Sumba): the main port, with Pelni passenger ships and ASDP ferries.</li><li><b>Waikelo</b> (Southwest Sumba, near Tambolaka): a smaller harbour used mainly for the crossing from Sumbawa and some Pelni calls.</li></ul>
<h2>The main routes</h2>
<h3>From Flores: Ende or Aimere to Waingapu</h3>
<p>The most used sea link. Ships from Ende to Waingapu take around 13 hours. Services run roughly weekly rather than daily, and delays are common. Pelni ships such as KM Awu call here on their loops through Nusa Tenggara.</p>
<h3>From Sumbawa: Sape to Waikelo</h3>
<p>The ASDP ferry between Sape, in the east of Sumbawa, and Waikelo was officially reopened on 24 May 2026, according to the Southwest Sumba regency government. The crossing takes roughly 8 to 9 hours. It is the most direct way from Labuan Bajo and Komodo overland: Labuan Bajo to Sape by ferry, then Sape to Waikelo.</p>
<h3>From Timor: Kupang to Waingapu</h3>
<p>Ships from Kupang reach Waingapu, often via Flores, in around 15 to 20 hours. These are irregular, so check locally.</p>
<h3>From Bali: Benoa</h3>
<p>Some Pelni ships include Benoa (Bali) and Sumba on routes that take about two weeks to complete a loop. It is possible but slow; for most people the one-hour flight is the obvious choice. See {GD('bali-to-sumba', 'Bali to Sumba')} for both options.</p>
<h2>What the ships are like</h2>
<p>There are two kinds of boats. <b>Pelni</b> runs large passenger ships with economy decks and cabins, following long loops between many islands. <b>ASDP</b> runs roll-on/roll-off car ferries on shorter crossings; they carry cars and motorbikes, and some have a small air-conditioned room you can pay to use. Bring food and water, a sarong or light blanket and something to sleep on, and keep valuables with you.</p>
<h2>How to check schedules</h2>
<ul><li>Pelni publishes schedules and sells tickets on its official website and app.</li><li>ASDP schedules are on the ASDP website; for local changes, port offices often post updates on social media.</li><li>Ask your accommodation in Sumba to confirm the week before; schedules change with the weather and with ship maintenance.</li></ul>
<h2>Is the ferry worth it?</h2>
<p>If you are travelling slowly through Nusa Tenggara with time to spare, yes: the sea route from Sumbawa or Flores is part of the adventure. If you have one or two weeks of holiday, fly, and spend the saved days on the island. Whatever you choose, plan your first day in Sumba with our {MAP} and the {GD('getting-around-sumba', 'guide to getting around')}.</p>"""})

GUIDES4.append({"s": "sumba-weather-by-month", "img": "wairinding-hill", "t": "Sumba weather by month: temperature, rain and the best time to go",
 "d": "Month-by-month climate tables for Waingapu, Waikabubak, Tambolaka and the south coast, from ten years of weather data, with what each month is like for beaches, waterfalls and travel.",
 "faq": [
  ["What is the driest month in Sumba?", "August is the driest month in Waingapu and East Sumba; July to September are dry across most of the island."],
  ["When is the rainy season in Sumba?", "Roughly from November or December to March or April. January to March are usually the wettest months, especially in the west and the highlands."],
  ["Is East Sumba drier than West Sumba?", "Yes. East Sumba is markedly drier; the hills around Waikabubak in the west receive the most rain and are also the coolest."],
  ["What is the temperature in Sumba?", "On the coast, daytime highs are around 29 to 32 °C all year. Waikabubak, in the hills, is cooler, with highs near 27 to 29 °C and nights around 19 to 22 °C."]],
 "b": f"""<p>Sumba has two seasons, but they are not the same everywhere on the island. The east, around Waingapu, is one of the driest corners of Indonesia, with brown savanna for months. The hills of West Sumba around Waikabubak are greener, cooler and rainier. This guide uses ten years of daily weather data (2015 to 2024) to show what each month is really like, and what that means for your trip.</p>
<h2>The short answer</h2>
<ul><li><b>Best overall:</b> May to October, the dry season: sunny, dry roads, calmer travel.</li><li><b>Greenest landscapes:</b> January to April, when the hills and rice fields are bright green and waterfalls are full.</li><li><b>Pasola:</b> February and March in West and Southwest Sumba; see {GD('pasola-guide', 'our Pasola guide')}.</li><li><b>Hottest:</b> October and November, just before the rains.</li></ul>
<h2>Climate tables</h2>
<p>Average daily maximum and minimum temperatures and monthly rainfall. The data come from the Open-Meteo historical weather service (ERA5 reanalysis, a weather model), averaged for 2015 to 2024. Models tend to overestimate rain in dry places, so read the rain column as a guide to the pattern rather than an exact figure.</p>
{_clim('waingapu', 'Waingapu and East Sumba')}
{_clim('tambolaka', 'Tambolaka and the Kodi coast (Southwest Sumba)')}
{_clim('waikabubak', 'Waikabubak and the West Sumba highlands')}
{_clim('south', 'The south coast (around Tarimbang)')}
<h2>Month by month</h2>
<h3>January to March</h3>
<p>The heart of the wet season. Rain usually comes as heavy showers rather than all-day drizzle, often in the afternoon or at night, and there are sunny spells. The island is at its greenest, and waterfalls such as {PL('lapopu-waterfall', 'Lapopu')} and {PL('tanggedu-waterfall', 'Tanggedu')} are powerful, though some can be muddy and some paths slippery. Unpaved roads can be difficult. February and March bring the Pasola.</p>
<h3>April</h3>
<p>A transition month: rain eases, especially in the east, while the hills are still green. A good compromise between landscapes and dry roads.</p>
<h3>May and June</h3>
<p>The dry season settles in. Skies are clear, the savanna begins to turn gold and travel is easy. Many visitors consider this the sweet spot.</p>
<h3>July to September</h3>
<p>The driest and, in the west and highlands, the coolest months, with fresh nights in Waikabubak. It is peak season for travel, so book flights early. The south and west coasts receive big swells from the Indian Ocean, good for surfing, see {GD('surf-sumba', 'surfing in Sumba')}, but not for swimming on exposed beaches.</p>
<h3>October and November</h3>
<p>The hottest time of year, especially in East Sumba where daytime highs reach about 32 °C. Some waterfalls are thin. The first rains usually arrive in November.</p>
<h3>December</h3>
<p>The rains return; the landscape turns green within weeks. Holiday flights fill up around Christmas and New Year.</p>
<h2>Weather tips</h2>
<ul><li>Check the live forecast for the four towns on our <a href="/{{l}}/weather/">Sumba weather page</a>.</li><li>Even in the dry season, bring a light rain jacket for the highlands.</li><li>The sun is strong all year at 10° south: use sunscreen, a hat and water.</li><li>In the wet season, plan the longest drives for the morning.</li></ul>"""})

GUIDES4.append({"s": "sumba-in-the-rainy-season", "img": "lapopu-waterfall", "t": "Sumba in the rainy season: is it worth visiting from November to April?",
 "d": "What travelling in Sumba during the wet season is really like: rain patterns, roads, waterfalls, green landscapes, the Pasola, and how to plan around the weather.",
 "faq": [
  ["Is it worth visiting Sumba in the rainy season?", "Yes, if you are flexible. The island is at its most beautiful and green, waterfalls are full and there are fewer visitors. Expect some disrupted plans and slower roads."],
  ["Does it rain all day in Sumba in the wet season?", "Usually not. Rain tends to come in heavy showers, often in the afternoon or at night, with sunny periods in between."],
  ["Which months are wettest?", "January to March are generally the wettest months, especially in West Sumba and the highlands around Waikabubak."]],
 "b": f"""<p>Most guides tell you to visit Sumba in the dry season, and for many people that is good advice. But the wet season, roughly November or December to March or April, has its own rewards: emerald hills, roaring waterfalls, flowering rice fields and far fewer visitors. If you can stay flexible, it can be the most beautiful time of year.</p>
<h2>What the rain is like</h2>
<p>Rain in Sumba usually arrives as heavy tropical showers rather than days of steady drizzle. A typical pattern is a clear morning, clouds building after midday and a downpour in the afternoon or night. Some days are fully wet, especially from January to March in West Sumba and the highlands, where our data show the most rain. The east around Waingapu is much drier even in the wet months; see the tables in {GD('sumba-weather-by-month', 'Sumba weather by month')}.</p>
<h2>The upsides</h2>
<ul><li><b>Green landscapes:</b> the savanna of {PL('wairinding-hill', 'Wairinding')} and the hills of the west turn bright green.</li><li><b>Waterfalls at full power:</b> {PL('lapopu-waterfall', 'Lapopu')}, {PL('matayangu-waterfall', 'Matayangu')} and {PL('waimarang-waterfall', 'Waimarang')} are at their most spectacular.</li><li><b>The Pasola:</b> held in February and March in West and Southwest Sumba, see {GD('pasola-guide', 'the Pasola guide')}.</li><li><b>Fewer visitors</b> and easier bookings outside the Christmas holidays.</li></ul>
<h2>The downsides</h2>
<ul><li><b>Roads:</b> unpaved tracks to remote beaches and villages can become muddy or impassable; river crossings rise.</li><li><b>Murky water:</b> waterfalls and some beaches can turn brown after heavy rain.</li><li><b>Flights:</b> storms can delay small planes.</li><li><b>Mosquitoes</b> are more common; use repellent, see {GD('health-safety', 'health and safety')}.</li></ul>
<h2>How to plan a wet-season trip</h2>
<ul><li>Base yourself in one or two places rather than moving every day.</li><li>Do long drives and hikes in the morning, and keep afternoons flexible.</li><li>Keep a spare day before your flight out.</li><li>Pick places reachable on paved roads for rainy days, such as the villages near Waikabubak, {PL('tarung-village', 'Tarung')} and {PL('prai-ijing', 'Prai Ijing')}.</li><li>Ask your driver each morning which roads are passable.</li></ul>
<p>Pack a light rain jacket, quick-dry clothes, sandals with grip and dry bags for your phone and camera. With that, the rainy season is less a problem than a different way to see the island. Use the {MAP} to choose the places closest to your base.</p>"""})

GUIDES4.append({"s": "best-sunsets-in-sumba", "img": "walakiri-beach", "t": "Best sunsets in Sumba: 9 places for golden hour",
 "d": "Where to watch the sunset in Sumba, from the dancing mangroves of Walakiri to the cliffs of Kodi and the savanna hills, with timing tips and sunset hours.",
 "faq": [
  ["Where is the best sunset in Sumba?", "Walakiri Beach in East Sumba is the most famous, for its silhouetted mangrove trees. In the west, Pero Beach, Mandorak and the Kodi coast face the open ocean."],
  ["What time is sunset in Sumba?", "Between about 17:45 and 18:30 local time (WITA, UTC+8), depending on the month. Each place page on our site shows the exact range for that spot."],
  ["Is sunrise or sunset better at Wairinding?", "Both work. Early morning gives soft light and cool air; late afternoon gives golden light on the hills."]],
 "b": f"""<p>Sumba's sunsets are one of the reasons people fall for the island. With few buildings, wide horizons and clean air, the last hour of daylight turns the savanna gold and the sea silver. Here are the best places to be at golden hour, how to time it and what to bring.</p>
<h2>Timing</h2>
<p>Sumba is close to the equator, so sunset times change little through the year: roughly between 17:45 and 18:30 local time (WITA, UTC+8). Darkness falls quickly, within about half an hour, so plan the drive back. Every place page on this site shows the sunrise and sunset range for that exact spot.</p>
<h2>East Sumba</h2>
<h3>1. Walakiri Beach</h3>
<p>{PL('walakiri-beach', 'Walakiri')} is the classic: small mangrove trees on the tidal flats look like dancers when silhouetted against the sky. Go at low tide, arrive an hour early and walk out on the sand. It is close to Waingapu, so it fits an arrival day.</p>
<h3>2. Wairinding Hill</h3>
<p>The rolling savanna of {PL('wairinding-hill', 'Wairinding')} glows at the end of the day. Green from January to April, golden in the dry season.</p>
<h3>3. Puru Kambera</h3>
<p>The savanna and beach at {PL('puru-kambera', 'Puru Kambera')}, often with horses grazing, are quiet in the evening.</p>
<h2>West and Southwest Sumba</h2>
<h3>4. Pero Beach</h3>
<p>{PL('pero-beach', 'Pero')} faces west across the ocean near Kodi, with a fishing village and a river mouth. One of the easiest sunsets in the west.</p>
<h3>5. Mandorak Beach</h3>
<p>The small cove of {PL('mandorak-beach', 'Mandorak')} is framed by rocky cliffs; watch from the top for the best view.</p>
<h3>6. Weekuri Lagoon</h3>
<p>{PL('weekuri-lagoon', 'Weekuri')} is lovely in the late afternoon, when day visitors leave and the water turns calm.</p>
<h3>7. Watu Maladong</h3>
<p>The rocky coast of {PL('watu-maladong', 'Watu Maladong')} catches the evening light dramatically.</p>
<h3>8. Ratenggaro</h3>
<p>The tall thatched roofs of {PL('ratenggaro', 'Ratenggaro')} against the evening sky by the sea are unforgettable. Visit respectfully, see {GD('respect-etiquette', 'village etiquette')}.</p>
<h2>Central Sumba</h2>
<h3>9. The Mamboro savanna and north coast</h3>
<p>The {PL('mamboro-savanna', 'Mamboro savanna')} and the beaches of the north coast, such as {PL('kapulit-beach', 'Kapulit')}, are almost empty at sunset. See {GD('sumba-north-coast', 'the north coast guide')}.</p>
<h2>Tips for sunset photos</h2>
<ul><li>Arrive 45 to 60 minutes early to find your spot and catch the golden light.</li><li>Check the tide for Walakiri: low tide gives the best reflections.</li><li>Bring a torch for the walk back and agree a pickup time with your driver.</li><li>Ask before photographing people, and before flying a drone near villages.</li></ul>
<p>Find all these places on the {MAP} with their distances from your base.</p>"""})

GUIDES4.append({"s": "sumba-with-kids", "img": "weekuri-lagoon", "t": "Sumba with kids: a practical family guide",
 "d": "Is Sumba good for families? Child-friendly places, long drives, safety in the sea, health, food and how to plan a family trip to Sumba.",
 "faq": [
  ["Is Sumba suitable for children?", "Yes for families who like nature and simple travel. The main challenges are long drives, limited medical care and strong surf on many beaches."],
  ["Where can kids swim safely in Sumba?", "Weekuri Lagoon is the classic: sheltered salt water behind a coral wall. Many ocean beaches have strong currents, so always check conditions locally."],
  ["Do I need special vaccines for children?", "Ask a travel clinic before you go. Malaria and dengue are present in parts of East Nusa Tenggara, so mosquito protection is important for everyone."]],
 "b": f"""<p>Sumba can be a wonderful family adventure: horses grazing by the road, villages with houses as tall as trees, lagoons and waterfalls to swim in. It is also a remote island with long drives, few services and limited healthcare. With the right plan, children often love it. This guide helps you decide and prepare.</p>
<h2>Is Sumba right for your family?</h2>
<p>Sumba suits families who enjoy nature, are comfortable with simple food and can handle a few hours in the car. It is less suited to very young babies who need specific products, or to children with medical needs, because pharmacies and hospitals are basic outside the towns. If in doubt, Bali or Lombok are easier; see {GD('sumba-vs-lombok', 'Sumba or Lombok')}.</p>
<h2>Child-friendly places</h2>
<ul><li>{PL('weekuri-lagoon', 'Weekuri Lagoon')}: calm salt water for swimming and jumping, with shallow edges. Supervise children at all times.</li><li>{PL('walakiri-beach', 'Walakiri Beach')}: shallow tidal flats at low tide and the famous dancing trees at sunset.</li><li>{PL('lapopu-waterfall', 'Lapopu')} and {PL('waimarang-waterfall', 'Waimarang')}: natural pools, best in the dry season when the water is calmer.</li><li>{PL('wairinding-hill', 'Wairinding Hill')}: short walk, wide views, often horses and buffalo.</li><li>Traditional villages such as {PL('prai-ijing', 'Prai Ijing')} and {PL('tarung-village', 'Tarung')}: children are usually welcomed; teach yours to greet people and ask before taking photos.</li></ul>
<h2>The sea</h2>
<p>Many of Sumba's most beautiful beaches face the open Indian Ocean, with big waves and strong currents. There are no lifeguards. Choose sheltered spots, swim only when locals say it is safe, and keep small children within arm's reach. Reef shoes protect feet on coral and rocks.</p>
<h2>Distances and car time</h2>
<p>Sights are spread out and drives of one to three hours are normal. Plan one main outing per day, base yourself in two places instead of moving daily, and bring snacks, water and something to do in the car. A child seat is rarely available; bring a light travel seat if you need one. A good structure is the {GD('itinerary-5-days', '5-day itinerary')} at a slower pace.</p>
<h2>Health</h2>
<ul><li>Talk to a travel clinic before the trip about vaccines and malaria prevention for each family member.</li><li>Use repellent, long sleeves at dusk and mosquito nets where offered.</li><li>Bring a children's first-aid kit, oral rehydration salts, fever medicine and any prescriptions.</li><li>Get travel insurance that covers medical evacuation; see {GD('health-safety', 'health and safety')}.</li></ul>
<h2>Food</h2>
<p>Local food is mostly rice, vegetables, fish, chicken and noodles, often fine for children if you ask for it without chilli ("tidak pedas"). Bottled or filtered water only. Bring familiar snacks from Bali for fussy moments; see {GD('food-in-sumba', 'food in Sumba')}.</p>
<h2>Packing extras for kids</h2>
<ul><li>Reef shoes, sun hats, long-sleeve swim shirts and plenty of high-SPF sunscreen.</li><li>A headlamp: nights are dark and power cuts happen.</li><li>Games and downloaded films for the drives, because mobile data is patchy.</li></ul>
<p>Plan your days with the {MAP}, which shows drive distances between places.</p>"""})

GUIDES4.append({"s": "money-atms-sim-sumba", "img": "prailiu-village", "t": "Money, ATMs and SIM cards in Sumba: what to know",
 "d": "Cash or card in Sumba? Where the ATMs are, how much cash to carry, mobile coverage, which SIM works best and how to stay connected on the island.",
 "faq": [
  ["Are there ATMs in Sumba?", "Yes, in the main towns: Waingapu, Waikabubak, Tambolaka and Waibakul. Outside towns there are almost none, so withdraw before heading out."],
  ["Can I pay by card in Sumba?", "Some larger hotels accept cards, but most guesthouses, warungs, drivers, village contributions and entry fees are cash only."],
  ["Which SIM card works best in Sumba?", "Telkomsel generally has the widest coverage in East Nusa Tenggara. Coverage is good in towns and patchy on remote coasts and in the hills."]],
 "b": f"""<p>Sumba runs on cash. The towns have banks and ATMs, but the beaches, villages and waterfalls that you came to see usually do not even have a shop. A little planning avoids awkward moments. Here is how money and mobile connections work on the island.</p>
<h2>Cash is king</h2>
<p>Carry Indonesian rupiah in cash for drivers, small guesthouses, warungs (local eateries), parking, entrance fees and village contributions. Small notes are precious: change for a 100,000 rupiah note can be hard to find in a village, so keep a stack of 2,000, 5,000, 10,000 and 20,000 notes.</p>
<h2>ATMs</h2>
<ul><li><b>Where:</b> Waingapu, Waikabubak, Tambolaka and Waibakul have banks and ATMs. Look for the big Indonesian banks such as BRI, BNI, Mandiri and BCA.</li><li><b>Limits:</b> withdrawals per transaction are limited, and machines sometimes run out of cash at weekends or holidays. Withdraw when you can, not when you must.</li><li><b>Cards:</b> foreign cards usually work at major bank ATMs; tell your bank you are travelling and have a backup card.</li></ul>
<h2>Cards and transfers</h2>
<p>Some larger hotels accept cards. Many local businesses accept Indonesian bank transfers or QR payments (QRIS) through local apps, which visitors usually cannot use. Plan on cash for almost everything else.</p>
<h2>How much cash to carry</h2>
<p>It depends on your style of travel. Count your driver and fuel (usually agreed per day), meals, entry and parking fees, village contributions and any guesthouses that do not take cards. Our {GD('budget-guide', 'budget guide')} helps estimate a daily figure. Split cash between bags, and keep a reserve for emergencies.</p>
<h2>Mobile coverage and SIM cards</h2>
<p>Telkomsel generally has the widest network in East Nusa Tenggara. In towns 4G works well; along the main roads coverage is usually fine; on remote beaches, in valleys and on the south coast it can disappear. Buy a SIM in Bali before flying, or in a Sumba town at an official counter; you need your passport to register it. eSIMs that use Indonesian networks are a convenient option if your phone supports them.</p>
<h2>Staying connected</h2>
<ul><li>Download offline maps before you go; our {MAP} keeps map tiles you have viewed on your phone.</li><li>Tell your accommodation your plans when heading to remote places.</li><li>Many guesthouses have Wi-Fi, often slow; do not count on it for video calls.</li><li>Keep a power bank: power cuts happen.</li></ul>
<p>See also: {GD('sumba-practical-tips', 'practical tips for Sumba')} and {GD('getting-around-sumba', 'getting around')}.</p>"""})

GUIDES4.append({"s": "is-sumba-safe", "img": "tarung-village", "t": "Is Sumba safe? An honest guide for travellers",
 "d": "An honest look at safety in Sumba: roads, the sea, health, theft, village visits and local customs, with practical tips to travel calmly.",
 "faq": [
  ["Is Sumba safe for tourists?", "Generally yes. Sumbanese people are welcoming and violent crime against visitors is rare. The real risks are road accidents, dangerous surf and limited medical care."],
  ["Is Sumba safe for solo female travellers?", "Many women travel in Sumba without problems. Dress modestly, avoid driving alone at night, and use a trusted driver recommended by your accommodation."],
  ["Is it safe to drive a scooter in Sumba?", "Only for experienced riders. Roads are narrow, potholed and shared with trucks and animals, and nights are dark. A car with a driver is safer."]],
 "b": f"""<p>Sumba has a reputation, sometimes exaggerated, for being wild. The truth for travellers is simpler: it is a calm, welcoming island where the main risks are practical ones, roads, sea and distance from hospitals, rather than crime. Here is an honest overview.</p>
<h2>People and crime</h2>
<p>Most visitors find Sumbanese people friendly and curious, especially in villages. Petty theft can happen, as anywhere, so keep valuables out of sight in cars and lock your room. Children sometimes ask for sweets or money at popular sights; a smile and a firm no is fine. Buying ikat or paying a village contribution supports local families in a better way.</p>
<p>Sumba has old traditions around land, livestock and family honour. Disputes between locals occasionally happen but rarely involve visitors. Follow local advice and do not get involved in arguments.</p>
<h2>Roads</h2>
<p>Road travel is the biggest risk. Roads are narrow, often potholed, with blind curves, livestock and few lights. Avoid driving at night, choose a driver recommended by your accommodation, and use seat belts where there are any. Riding a scooter is only for experienced riders with a helmet and proper licence. See {GD('getting-around-sumba', 'getting around Sumba')}.</p>
<h2>The sea</h2>
<p>Many south and west coast beaches have powerful waves and rip currents and no lifeguards. Swim only where locals say it is safe, never alone, and be careful on rocks and reef. Sheltered options such as {PL('weekuri-lagoon', 'Weekuri Lagoon')} are easier, but still supervise children.</p>
<h2>Health</h2>
<p>Medical care is basic outside the towns, and serious cases go to Bali or Kupang. Get travel insurance with medical evacuation, ask a travel clinic about vaccines and malaria prevention, protect yourself from mosquitoes, drink only bottled or filtered water and carry a first-aid kit. More in {GD('health-safety', 'health and safety in Sumba')}.</p>
<h2>Villages and customs</h2>
<p>Respect keeps visits safe and pleasant. Ask before entering a village or a house and before photos, sign the guestbook and leave a contribution, do not touch the stone tombs, and go with a local guide when you can. Read {GD('respect-etiquette', 'village etiquette')} before you go.</p>
<h2>Natural hazards</h2>
<p>Sumba lies in an earthquake-prone region, like much of Indonesia. Learn the basics: in a strong quake by the coast, move to high ground. In the wet season, avoid crossing swollen rivers and check road conditions.</p>
<h2>Quick safety checklist</h2>
<ul><li>Travel insurance with evacuation cover.</li><li>No driving after dark on rural roads.</li><li>Swim only where locals swim.</li><li>Cash split between bags; copies of your passport.</li><li>Your accommodation knows your plans for the day.</li></ul>"""})

GUIDES4.append({"s": "sumba-vs-flores", "img": "ratenggaro", "t": "Sumba or Flores? How to choose between the two islands",
 "d": "Sumba vs Flores compared: landscapes, culture, Komodo, travel time, crowds, roads and budget, plus how to combine both islands in one trip.",
 "faq": [
  ["Which is better, Sumba or Flores?", "Flores is better for Komodo dragons, diving, volcanoes and an overland route. Sumba is better for empty beaches, savanna, megalithic villages and fewer tourists."],
  ["Can I combine Sumba and Flores?", "Yes. There are flights within East Nusa Tenggara and ships between Ende (Flores) and Waingapu (Sumba), taking about 13 hours."],
  ["Is Sumba near Flores?", "Yes, Sumba lies south of Flores across the Sumba Strait."]],
 "b": f"""<p>Sumba and Flores are neighbours in East Nusa Tenggara and both are wonderful, but they offer very different trips. This comparison helps you choose, or plan to see both.</p>
<h2>In one sentence</h2>
<p><b>Flores</b> is long, volcanic and mountainous, with Komodo National Park at its western tip and a classic overland route from Labuan Bajo to Maumere. <b>Sumba</b> is lower and drier, with savanna, empty beaches and some of the last living megalithic cultures in the world.</p>
<h2>Landscapes</h2>
<p>Flores has volcanoes, the coloured crater lakes of Kelimutu, rice terraces and steep mountain roads. Sumba has rolling grassland like {PL('wairinding-hill', 'Wairinding')}, canyons like {PL('tanggedu-waterfall', 'Tanggedu')}, turquoise {PL('weekuri-lagoon', 'Weekuri Lagoon')} and long beaches facing the Indian Ocean.</p>
<h2>Culture</h2>
<p>Both have strong local traditions. Flores is mostly Catholic with traditional villages such as those in the Bajawa area. In Sumba the ancestral Marapu religion remains alive alongside Christianity: villages of high-roofed houses like {PL('ratenggaro', 'Ratenggaro')} and {PL('tarung-village', 'Tarung')}, giant stone tombs and the Pasola horse ritual. See {GD('marapu-religion-sumba', 'Marapu')}.</p>
<h2>Wildlife and the sea</h2>
<p>If you want Komodo dragons, manta rays and boat trips, Flores and Labuan Bajo are the place. Sumba is more about surf, quiet beaches and horses.</p>
<h2>Tourism and crowds</h2>
<p>Labuan Bajo is busy and developed. The Flores overland route is well travelled. Sumba sees far fewer visitors, with fewer restaurants and services, which is the attraction for many.</p>
<h2>Getting there and around</h2>
<p>Both have flights from Bali. Flores is long and best crossed overland over a week or more. Sumba is about 200 km across: use two airports, Tambolaka and Waingapu, to avoid backtracking; see {GD('tambolaka-airport', 'Tambolaka Airport')} and {GD('waingapu-airport', 'Waingapu Airport')}.</p>
<h2>Combining both</h2>
<p>A popular route is Bali, Labuan Bajo (Komodo), across Flores to Ende, then a flight or ship to Sumba, and back to Bali. Between Ende and Waingapu the ship takes about 13 hours and runs roughly weekly; see {GD('ferry-to-sumba', 'ferry to Sumba')}. Allow at least two and a half weeks for both.</p>
<h2>Our verdict</h2>
<ul><li>Choose <b>Flores</b> for Komodo, diving, volcanoes and a classic overland adventure.</li><li>Choose <b>Sumba</b> for space, culture and beaches without crowds.</li><li>Have time? Do both.</li></ul>"""})

GUIDES4.append({"s": "sumba-vs-lombok", "img": "mandorak-beach", "t": "Sumba or Lombok? Honest comparison for your next trip",
 "d": "Sumba vs Lombok: beaches, surf, culture, infrastructure, crowds and travel time compared, to help you pick the right island.",
 "faq": [
  ["Is Sumba better than Lombok?", "For untouched landscapes and traditional culture, yes. For ease, choice of places to stay, the Gili Islands and Rinjani, Lombok wins."],
  ["Is there a flight from Lombok to Sumba?", "Flight-search sites in 2026 list flights between Lombok (Praya) and Tambolaka. Check current schedules."],
  ["Which is quieter?", "Sumba, by far."]],
 "b": f"""<p>Lombok is Bali's neighbour and has become a popular alternative. Sumba is further east and much less visited. Both have great beaches and surf, but the experience is very different.</p>
<h2>Ease of travel</h2>
<p>Lombok is easy: many flights, a fast boat from Bali, good roads in the south, many places to stay and eat. Sumba is simpler and slower, with fewer services and longer drives, see {GD('getting-around-sumba', 'getting around Sumba')}.</p>
<h2>Beaches and surf</h2>
<p>Both have world-class surf on their southern coasts. Lombok has the Gili Islands for snorkelling and a social atmosphere; Sumba has empty beaches like {PL('marosi-beach', 'Marosi')}, {PL('tarimbang-bay', 'Tarimbang')} and {PL('mandorak-beach', 'Mandorak')}, where you may be alone. See {GD('best-beaches-in-sumba', 'best beaches in Sumba')} and {GD('surf-sumba', 'surfing in Sumba')}.</p>
<h2>Nature</h2>
<p>Lombok has Mount Rinjani, one of Indonesia's great volcano treks. Sumba has no big volcano but offers savanna, canyons and waterfalls, such as {PL('tanggedu-waterfall', 'Tanggedu')} and {PL('lapopu-waterfall', 'Lapopu')}.</p>
<h2>Culture</h2>
<p>Lombok's Sasak culture is mostly Muslim, with traditional villages like Sade. Sumba's Marapu traditions, megalithic tombs and the Pasola make it one of the most distinctive cultures in Indonesia; see {GD('traditional-villages-sumba', 'traditional villages')}.</p>
<h2>Crowds</h2>
<p>Kuta Lombok and the Gilis can be busy. Sumba remains quiet, even in July and August.</p>
<h2>Verdict</h2>
<ul><li>Pick <b>Lombok</b> for an easy trip, Gili snorkelling, Rinjani and nightlife.</li><li>Pick <b>Sumba</b> for solitude, culture and landscapes that feel untouched.</li><li>With time, combine them: there are flights between Lombok and Sumba.</li></ul>"""})

GUIDES4.append({"s": "sumba-packing-list", "img": "puru-kambera", "t": "Sumba packing list: what to bring (and what you can't buy there)",
 "d": "A practical packing list for Sumba: clothes, sun protection, health kit, cash, electronics, village visits and items that are hard to find on the island.",
 "faq": [
  ["What should I wear in Sumba?", "Light, breathable clothes, plus modest options that cover shoulders and knees for villages. A light jacket for the cooler highlands around Waikabubak."],
  ["Can I buy sunscreen in Sumba?", "Basic products exist in town shops, but choice is limited. Bring high-SPF sunscreen and repellent from home or Bali."],
  ["What plug is used in Sumba?", "Indonesia uses type C and F plugs at 230 V."]],
 "b": f"""<p>Sumba has shops in its towns but little choice outside them. Packing well makes a big difference. Here is a list built for the island's conditions: strong sun, long drives, simple accommodation and village visits.</p>
<h2>Clothes</h2>
<ul><li>Light, quick-dry shirts and trousers or shorts.</li><li>Modest clothing for villages: something that covers shoulders and knees; a sarong is perfect.</li><li>A light jacket or fleece for the highlands and evenings in July and August.</li><li>A rain jacket in the wet season (November to April).</li><li>Swimwear and a long-sleeve swim shirt against the sun.</li></ul>
<h2>Shoes</h2>
<ul><li>Sandals with good grip for waterfalls and rocks.</li><li>Reef shoes for coral and rocky beaches.</li><li>Light walking shoes for Tanggedu or hilltops.</li></ul>
<h2>Sun and insects</h2>
<ul><li>High-SPF sunscreen, lip balm and after-sun.</li><li>Hat and sunglasses.</li><li>Insect repellent with DEET or picaridin, especially for dusk.</li></ul>
<h2>Health kit</h2>
<ul><li>Personal medicines in your hand luggage, with prescriptions.</li><li>Painkillers, fever medicine, rehydration salts, antiseptic and plasters.</li><li>Anti-diarrhoea tablets and motion-sickness pills for winding roads.</li><li>Malaria prevention if a travel clinic recommends it, see {GD('health-safety', 'health and safety')}.</li></ul>
<h2>Money and documents</h2>
<ul><li>Cash in small notes, see {GD('money-atms-sim-sumba', 'money and ATMs')}.</li><li>Passport, copies, travel insurance details.</li></ul>
<h2>Electronics</h2>
<ul><li>Power bank and a headlamp: power cuts happen.</li><li>Plug adapter (type C or F, 230 V).</li><li>Dry bag for phone and camera.</li><li>Offline maps; our {MAP} also works with tiles you have already viewed.</li></ul>
<h2>For village visits</h2>
<ul><li>A sarong or scarf.</li><li>Small notes for contributions.</li><li>Patience and a smile; read {GD('respect-etiquette', 'village etiquette')}.</li></ul>
<h2>Nice to have</h2>
<ul><li>Snorkel mask for Weekuri Lagoon.</li><li>Reusable water bottle with a filter.</li><li>Snacks from Bali for long drives.</li></ul>"""})

GUIDES4.append({"s": "hire-a-driver-sumba", "img": "wanggameti", "t": "Hiring a driver in Sumba: how it works and what to agree",
 "d": "How to hire a car with driver in Sumba: where to find one, what is usually included, questions to ask, scooter vs car, and tips for a smooth trip.",
 "faq": [
  ["Do I need a driver in Sumba?", "For most visitors, yes. Public transport is very limited and roads are slow; a local driver knows the way, the villages and the road conditions."],
  ["How do I find a driver in Sumba?", "Ask your accommodation first; they usually work with trusted drivers. Recommendations from other travellers are also useful."],
  ["What should be included in the price?", "Agree clearly whether fuel, the driver's meals and accommodation on multi-day trips, parking and entry fees are included."]],
 "b": f"""<p>Hiring a car with a driver is the way most people explore Sumba, and for good reason: sights are far apart, public transport barely exists outside the towns, signs are few and roads can be tricky. A good driver is also a guide, translator and introducer in villages.</p>
<h2>Where to find one</h2>
<ul><li><b>Your accommodation:</b> the easiest and safest option; most work with drivers they trust.</li><li><b>Airport arrivals:</b> drivers meet flights at {GD('tambolaka-airport', 'Tambolaka')} and {GD('waingapu-airport', 'Waingapu')}.</li><li><b>Recommendations</b> from recent travellers.</li></ul>
<h2>What to agree before you start</h2>
<ul><li>Daily price and what it includes: fuel, the driver's meals, parking and entry fees.</li><li>Hours per day, and what happens if you return late.</li><li>For multi-day trips: who pays the driver's accommodation.</li><li>The route, day by day. Share it on our {MAP} or from our {GD('itinerary-5-days', 'itineraries')}.</li><li>Whether the driver speaks English, and whether he can act as a guide in villages.</li></ul>
<h2>Questions to ask</h2>
<ul><li>Is the car in good condition, with working seat belts and air conditioning?</li><li>Does he know the road to remote places such as {PL('tarimbang-bay', 'Tarimbang')} or {PL('wanggameti', 'Wanggameti')}?</li><li>Can we avoid driving after dark?</li></ul>
<h2>Car or scooter?</h2>
<p>A scooter is cheaper and flexible, but only for experienced riders: roads are narrow, potholed, shared with trucks and animals, and dark at night. You need a valid licence and helmet. For most visitors, a car with a driver is safer and less tiring. See {GD('is-sumba-safe', 'is Sumba safe')}.</p>
<h2>Tips</h2>
<ul><li>Pay part in advance and the rest at the end, in cash.</li><li>Ask the driver about village contributions and etiquette before arriving.</li><li>Tipping is appreciated for good service.</li><li>Plan realistic days: two or three main stops are plenty.</li></ul>"""})

GUIDES4.append({"s": "sumba-horses", "img": "puru-kambera", "t": "Sumba's horses: sandalwood ponies, Pasola and where to see them",
 "d": "Horses are everywhere in Sumba: the history of the sandalwood pony, their role in Marapu culture, dowries and the Pasola, and where to see them.",
 "faq": [
  ["What is a sandalwood pony?", "A small, hardy horse breed from Sumba and nearby islands, named after the sandalwood that was once traded from the island along with the horses."],
  ["Where can I see horses in Sumba?", "Almost anywhere in the savanna: around Wairinding, Puru Kambera, the Mamboro savanna and the south coast. During the Pasola in February and March, riders gather in West Sumba."],
  ["Can I ride a horse in Sumba?", "Some places offer rides on the beach. Choose operators that treat their animals well, and ask locally."]],
 "b": f"""<p>On Sumba, horses are everywhere: grazing on the savanna, trotting along the beach, tied in villages, carrying riders at full gallop during the Pasola. They are part of the island's identity and economy, and you will see them on almost every drive.</p>
<h2>The sandalwood pony</h2>
<p>Sumba's horses are small and strong. They are known as sandalwood ponies, a name from the colonial-era trade, when horses and sandalwood were among the island's most valuable exports. They are tough enough for long distances in heat and on rough ground.</p>
<h2>Horses in Sumbanese culture</h2>
<p>Horses carry status and meaning. They feature in marriage negotiations, where livestock is part of the exchange between families, and in funerals and ceremonies tied to the Marapu belief in ancestors; see {GD('marapu-religion-sumba', 'Marapu')}. You will see them carved on stone tombs and woven into ikat textiles; see {GD('ikat-guide', 'Sumba ikat')}.</p>
<h2>The Pasola</h2>
<p>The most famous horse tradition is the Pasola, a ritual contest held each year in February and March in West and Southwest Sumba, where riders throw blunt wooden spears at each other. It is linked to the planting season and the ancestors. See {GD('pasola-guide', 'the Pasola guide')} and the {PL('pasola-wanokaka', 'Pasola field of Wanokaka')}.</p>
<h2>Where to see horses</h2>
<ul><li>{PL('wairinding-hill', 'Wairinding Hill')} and the savanna of East Sumba.</li><li>{PL('puru-kambera', 'Puru Kambera')}, where horses often graze near the beach.</li><li>The {PL('mamboro-savanna', 'Mamboro savanna')} in Central Sumba.</li><li>Beaches of the south coast at the end of the day.</li></ul>
<h2>Respect the animals</h2>
<ul><li>Horses belong to families; do not approach, feed or ride without asking.</li><li>Keep a distance from riders at events.</li><li>If you ride, check that the animal looks healthy and is not overworked.</li></ul>"""})

GUIDES4.append({"s": "sumba-megalithic-tombs", "img": "gallubakul-tomb", "t": "Sumba's megalithic tombs: a living stone-age tradition",
 "d": "Why Sumba is one of the last places where megalithic tombs are still built: meaning, how stones are hauled, where to see the finest tombs and how to visit respectfully.",
 "faq": [
  ["Why are there stone tombs in Sumba villages?", "In the Marapu tradition, the dead remain part of the family and community. Large stone tombs in the heart of villages honour ancestors and the status of their families."],
  ["Are megalithic tombs still built in Sumba?", "Yes. Sumba is one of the few places in the world where large stone tombs are still made, sometimes with huge stones hauled by many people."],
  ["Where are the best tombs?", "Around Anakalang in Central Sumba, such as Pasunga and Gallubakul, and in the villages of Kodi and West Sumba such as Ratenggaro and Tarung."]],
 "b": f"""<p>In most of the world, megaliths are archaeology. In Sumba, they are part of daily life. Stone tombs stand in the middle of villages, children play around them and families still build new ones. Few places allow you to see a megalithic culture that is still alive.</p>
<h2>What the tombs mean</h2>
<p>In the Marapu belief, ancestors keep watching over the living. A tomb in the village square keeps them close. Its size and decoration reflect the status of the family, and building one is a major event: stones can be dragged for long distances by many people, with ceremonies and the sacrifice of animals. See {GD('marapu-religion-sumba', 'Marapu religion')}.</p>
<h2>What they look like</h2>
<p>The classic form is a flat stone slab resting on legs or blocks, sometimes with a carved upright stone in front showing figures, horses, buffalo or symbols. Older tombs are weathered and covered in lichen; newer ones are sometimes made with cement.</p>
<h2>Where to see them</h2>
<ul><li>{PL('pasunga-village', 'Pasunga')} and {PL('gallubakul-tomb', 'Gallubakul')} around Anakalang in Central Sumba, famous for their size and carvings.</li><li>{PL('ratenggaro', 'Ratenggaro')} and {PL('wainyapu', 'Wainyapu')} on the Kodi coast, with tombs by the sea.</li><li>{PL('tarung-village', 'Tarung')} and {PL('prai-ijing', 'Prai Ijing')} near Waikabubak.</li><li>{PL('prailiu-village', 'Prailiu')} and {PL('praiyawang-rende', 'Praiyawang (Rende)')} in East Sumba.</li></ul>
<h2>How to visit respectfully</h2>
<ul><li>Do not sit, stand or climb on tombs.</li><li>Ask before photographing, and sign the guestbook with a contribution.</li><li>Visit with a local guide who can explain the stories.</li><li>Read {GD('respect-etiquette', 'village etiquette')} first.</li></ul>
<p>Find every village and tomb on the {MAP}.</p>"""})

GUIDES4.append({"s": "sumba-traditional-houses", "img": "ratenggaro", "t": "Sumba's traditional houses: the tall thatched roofs explained",
 "d": "Why Sumbanese houses have tall peaked roofs, what each level is for, how they connect to the ancestors, and the best villages to see them.",
 "faq": [
  ["Why do Sumba houses have such tall roofs?", "In the Marapu tradition, the high roof is a sacred space linked to the ancestors, where heirlooms are kept. The peak marks the importance of the clan house."],
  ["What is inside a traditional Sumba house?", "Typically three levels: the space below the floor for animals, the living level for the family with the hearth, and the high roof for sacred heirlooms and offerings."],
  ["Where can I see traditional houses?", "Ratenggaro and Wainyapu in Kodi, Tarung and Prai Ijing near Waikabubak, and Praiyawang in East Sumba."]],
 "b": f"""<p>The silhouettes of Sumbanese houses, with their towering thatched roofs, are among the most striking sights in Indonesia. They are more than architecture: each house is a link between the living family and its ancestors.</p>
<h2>Three levels, three worlds</h2>
<p>Traditional houses are usually described in three levels. Below the raised floor live animals such as pigs and chickens. The middle level is the family's home, with the hearth and sleeping areas, organised by rules about where men and women sit and work. The high roof is the sacred space, linked to the ancestors and the Marapu spirits, where heirlooms and ritual objects are kept.</p>
<h2>Materials and building</h2>
<p>Houses are built with wooden pillars, bamboo and thatch from grass. Construction and repair involve the whole clan and ceremonies. Fires are a constant risk with thatch, and some villages have been rebuilt after fires; today some roofs use other materials, but the shape is preserved.</p>
<h2>Villages to visit</h2>
<ul><li>{PL('ratenggaro', 'Ratenggaro')}: among the tallest roofs on the island, by the sea in Kodi.</li><li>{PL('wainyapu', 'Wainyapu')}: a large village near Ratenggaro.</li><li>{PL('tarung-village', 'Tarung')}: on a hill in Waikabubak, easy to reach.</li><li>{PL('prai-ijing', 'Prai Ijing')}: a photogenic village in green surroundings near Waikabubak.</li><li>{PL('praiyawang-rende', 'Praiyawang (Rende)')} and {PL('prailiu-village', 'Prailiu')}: East Sumba, known for ikat.</li></ul>
<h2>Visiting</h2>
<p>These are homes: ask before entering, sign the guestbook and leave a contribution, dress modestly and go with a guide when possible. Read {GD('traditional-villages-sumba', 'our guide to traditional villages')} and {GD('respect-etiquette', 'etiquette')}.</p>"""})

GUIDES4.append({"s": "itinerary-10-days", "img": "tarimbang-bay", "t": "Sumba itinerary: 10 days from west to east",
 "d": "A 10-day Sumba itinerary that covers the Kodi coast, Waikabubak's villages, Central Sumba, the north coast, East Sumba's savanna and the south coast, with drive times.",
 "faq": [
  ["Is 10 days enough for Sumba?", "Yes, 10 days lets you see the west, centre and east of the island at a comfortable pace, including a remote coast."],
  ["Which airports should I use for 10 days?", "Fly into Tambolaka (west) and out of Waingapu (east), or the reverse, to avoid driving back."]],
 "b": f"""<p>Ten days is the ideal length for Sumba: enough to cross the whole island, see its four regions and still enjoy slow afternoons. This route flies into Tambolaka and out of Waingapu. Drive times are estimates; check them on the {MAP}.</p>
<h2>Day 1: Arrive in Tambolaka</h2>
<p>Land at {GD('tambolaka-airport', 'Tambolaka')}, head to the Kodi coast and swim in {PL('weekuri-lagoon', 'Weekuri Lagoon')}. Sunset at {PL('pero-beach', 'Pero Beach')}.</p>
<h2>Day 2: Kodi villages and cliffs</h2>
<p>Morning at {PL('ratenggaro', 'Ratenggaro')} and {PL('wainyapu', 'Wainyapu')}, then {PL('mandorak-beach', 'Mandorak')} and {PL('watu-maladong', 'Watu Maladong')}.</p>
<h2>Day 3: Waterfall and the road to Waikabubak</h2>
<p>{PL('weekacura-waterfall', 'Weekacura')} or {PL('lapopu-waterfall', 'Lapopu')}, then on to Waikabubak and {PL('tarung-village', 'Tarung')} at sunset.</p>
<h2>Day 4: West Sumba villages and the south coast</h2>
<p>{PL('prai-ijing', 'Prai Ijing')}, the {PL('pasola-wanokaka', 'Pasola field of Wanokaka')} and the beaches of {PL('marosi-beach', 'Marosi')} or {PL('rua-beach', 'Rua')}.</p>
<h2>Day 5: Central Sumba's megaliths</h2>
<p>Drive east to Anakalang for {PL('pasunga-village', 'Pasunga')} and {PL('gallubakul-tomb', 'Gallubakul')}. See {GD('sumba-megalithic-tombs', 'megalithic tombs')}.</p>
<h2>Day 6: The north coast and Mamboro</h2>
<p>The {PL('mamboro-savanna', 'Mamboro savanna')}, {PL('kapulit-beach', 'Kapulit')} and quiet beaches, see {GD('sumba-north-coast', 'north coast guide')}.</p>
<h2>Day 7: East to Waingapu</h2>
<p>Continue to Waingapu, stopping at {PL('wairinding-hill', 'Wairinding Hill')} for late-afternoon light. Evening in town.</p>
<h2>Day 8: Tanggedu and Walakiri</h2>
<p>Half-day trip to the canyon pools of {PL('tanggedu-waterfall', 'Tanggedu')}, then sunset at {PL('walakiri-beach', 'Walakiri')}.</p>
<h2>Day 9: The south coast</h2>
<p>A long drive to {PL('tarimbang-bay', 'Tarimbang')} or {PL('waimarang-waterfall', 'Waimarang')}; consider staying overnight on the coast.</p>
<h2>Day 10: Villages of East Sumba and fly out</h2>
<p>{PL('prailiu-village', 'Prailiu')} for ikat weaving, {PL('puru-kambera', 'Puru Kambera')} if time allows, then fly out of {GD('waingapu-airport', 'Waingapu')}.</p>
<h2>Adapting the route</h2>
<ul><li>Shorter trip? Use our {GD('itinerary-7-days', '7-day')} or {GD('itinerary-5-days', '5-day')} versions.</li><li>Wet season? Keep a spare day and check {GD('sumba-in-the-rainy-season', 'the rainy season guide')}.</li><li>Need a driver? Read {GD('hire-a-driver-sumba', 'hiring a driver')}.</li></ul>"""})

GUIDES4.append({"s": "pasola-dates", "img": "pasola-wanokaka", "t": "Pasola dates: when the next Pasola is and how dates are set",
 "d": "When is the Pasola in Sumba? How the dates are chosen, the 2026 schedule as an example, when 2027 dates are usually announced and how to plan your trip.",
 "faq": [
  ["When is the Pasola?", "Every year in February and March, in West and Southwest Sumba (Kodi, Lamboya, Wanokaka and Gaura). Exact days follow local ritual timing."],
  ["Have the 2027 Pasola dates been announced?", "Not yet at the time of writing. Dates are usually published a few weeks or months before; we will update this page when they are confirmed."],
  ["What were the 2026 dates?", "Published schedules for 2026 listed events on 9, 10 and 11 February and 9, 10 and 11 March, in different villages."]],
 "b": f"""<p>The Pasola is Sumba's most famous event: riders on horseback throwing blunt wooden spears at each other in a ritual contest linked to the ancestors and the planting season. Planning a trip around it means understanding how the dates work.</p>
<h2>How the dates are set</h2>
<p>The Pasola takes place in February and March in West and Southwest Sumba, in areas such as Kodi, Lamboya, Wanokaka and Gaura. The exact day in each place is decided by local priests (ratu) following ritual timing tied to the moon and the appearance of sea worms called nyale on the beaches. That is why dates are announced relatively late, and why they can change.</p>
<h2>An example: the 2026 schedule</h2>
<p>For 2026, published schedules listed Pasola events on 9, 10 and 11 February and on 9, 10 and 11 March, spread across different villages, including Homba Kalayo, Bondo Kawango and Rara Winyo in February, and Maliti Bondo Ate, Wai Ha and Wainyapu in March. Use it as an idea of the pattern, not as a promise for next year.</p>
<h2>2027 dates</h2>
<p>The 2027 dates have not been announced at the time of writing. Expect events again in February and March. We will update this page as soon as the regency governments or local organisers publish them. Our sister site <a href="https://thesumbatimes.com/en/">The Sumba Times</a> also reports local news.</p>
<h2>How to plan</h2>
<ul><li>Book flights to {GD('tambolaka-airport', 'Tambolaka')}, the closest airport, as soon as the dates are confirmed: places to stay nearby fill up.</li><li>Keep your plans flexible by a day or two.</li><li>Stay in Tambolaka, Waikabubak or near the coast depending on which Pasola you will attend.</li><li>Go with a local guide who knows the ceremonies.</li></ul>
<h2>Watching safely and respectfully</h2>
<ul><li>Stay behind the crowd; horses and spears move fast.</li><li>Follow instructions from organisers and locals.</li><li>Ask before photographing people and rituals.</li></ul>
<p>Learn more in our full {GD('pasola-guide', 'Pasola guide')} and see the {PL('pasola-wanokaka', 'Pasola field of Wanokaka')}.</p>"""})

# ---- 14-nov-2026 · fourth batch ----
GUIDES4.append({"s": "sumba-national-parks-birds", "img": "lapopu-waterfall", "t": "Sumba's national parks and endemic birds: Manupeu Tanah Daru and Laiwangi Wanggameti",
 "d": "A guide to Sumba's two national parks, known together as Matalawa: forests, waterfalls, the Sumba hornbill and other birds found nowhere else, and how to visit responsibly.",
 "faq": [
  ["How many national parks does Sumba have?", "Two: Manupeu Tanah Daru and Laiwangi Wanggameti, both designated in 1998. They are managed together and often called Matalawa."],
  ["What birds are endemic to Sumba?", "Sumba has several birds found nowhere else, including the Sumba hornbill, Sumba boobook, Sumba buttonquail, red-naped fruit-dove, Sumba green pigeon, Sumba flycatcher and apricot-breasted sunbird."],
  ["Can I see the Sumba hornbill?", "It is possible in the forests of the national parks with a local guide, especially early in the morning. The species is uncommon and declining, so sightings are never guaranteed."]],
 "b": f"""<p>Most visitors come to Sumba for beaches and villages, but the island also has two national parks and a list of birds that live nowhere else on Earth. The forests along the southern hills hide waterfalls such as {PL('lapopu-waterfall', 'Lapopu')} and {PL('matayangu-waterfall', 'Matayangu')}, and they are the last strongholds of the Sumba hornbill.</p>
<h2>Two parks, one name</h2><p>Sumba's two national parks, <b>Manupeu Tanah Daru</b> in the west and centre and <b>Laiwangi Wanggameti</b> in the east, were both designated in 1998 to protect endangered species. Today they are managed together and are often referred to as Matalawa. Manupeu Tanah Daru consists of lowland forest on steep slopes rising to about 600 m. Laiwangi Wanggameti includes Mount {PL('wanggameti', 'Wanggameti')}, the highest point in the area.</p>
<h2>Birds found nowhere else</h2><p>For a small island, Sumba has a remarkable number of endemic birds. They include four vulnerable species, the secretive Sumba boobook (an owl), the Sumba buttonquail, the red-naped fruit-dove and the Sumba hornbill, plus the more common Sumba green pigeon, Sumba flycatcher and apricot-breasted sunbird.</p>
<h3>The Sumba hornbill</h3><p>Known locally as julang, the Sumba hornbill is a large bird found only on Sumba, living in semi-evergreen forest up to about 950 m. Its numbers have fallen as forest has been cleared, and the national parks protect some of its most important habitat. Hornbills spread seeds through the forest, so protecting them helps the forest itself.</p>
<h2>Visiting the parks</h2><ul><li><b>Waterfalls:</b> the easiest way to experience the forest is a visit to {PL('lapopu-waterfall', 'Lapopu')} or {PL('matayangu-waterfall', 'Matayangu')} in Manupeu Tanah Daru. Check our pages for access notes.</li><li><b>Birdwatching:</b> go early in the morning with a local guide who knows where fruiting trees are. Bring binoculars and patience.</li><li><b>Wanggameti:</b> the forests of the east are remote; plan a full day or an overnight from Waingapu, see {PL('wanggameti', 'Wanggameti')}.</li><li><b>Permits and fees:</b> rules can change; ask at the park offices or your guide before visiting, and before flying a drone in a national park.</li></ul>
<h2>Respect the forest</h2><ul><li>Stay on paths, take your rubbish with you and do not feed or disturb animals.</li><li>Do not buy birds or animal products.</li><li>Hire local guides: it supports communities that live around the parks.</li></ul>
<p>Plan your visit with the {MAP}, and read {GD('sumba-waterfalls', 'Sumba waterfalls')} for practical tips.</p>"""})

GUIDES4.append({"s": "snorkeling-diving-sumba", "img": "weekuri-lagoon", "t": "Snorkeling and diving in Sumba: where, when and how to stay safe",
 "d": "What snorkeling and diving are really like in Sumba: sheltered spots such as Weekuri Lagoon, the best season, ocean conditions, gear to bring and safety tips.",
 "faq": [
  ["Is there good snorkeling in Sumba?", "Yes, in sheltered spots. Weekuri Lagoon is the easiest; some reef flats on calmer coasts are good at the right tide. Much of the south and west coast is too rough."],
  ["Are there dive centres in Sumba?", "Very few compared with Bali or Flores. Some resorts and operators arrange trips; ask locally and choose certified operators with good safety equipment."],
  ["When is the sea calmest?", "Conditions vary by coast. Mornings are usually calmer, and sheltered bays and the north coast are often gentler than the exposed south and west."]],
 "b": f"""<p>Sumba is not a classic dive destination like Komodo or Raja Ampat, and most of its coastline faces the powerful open Indian Ocean. But with the right spot and the right conditions, there is clear water, coral and fish to enjoy. This guide helps you choose wisely and stay safe.</p>
<h2>The easy option: Weekuri Lagoon</h2><p>{PL('weekuri-lagoon', 'Weekuri Lagoon')} in Southwest Sumba is a saltwater lagoon protected from the ocean by a coral wall. The water is calm and clear, with shallow edges and deeper areas. A mask and snorkel are enough. Go early or late in the day to avoid crowds.</p>
<h2>Reef flats and calmer coasts</h2><p>At low and mid tide, some reef flats and bays show rock pools and coral, and the north coast around {GD('sumba-north-coast', 'Mamboro')} is often calmer than the south. Always ask local fishermen or your guide about currents and the right tide before getting in.</p>
<h2>Diving</h2><p>Dive operators in Sumba are few compared with Bali or Flores. Some resorts and operators organise boat dives; ask in advance and check certifications, equipment and emergency plans. Remember that medical care, including any decompression facilities, is far away: dive conservatively.</p>
<h2>Ocean safety</h2><ul><li>Many south and west coast beaches have strong rip currents and big waves; there are no lifeguards.</li><li>Never snorkel alone; tell someone your plans.</li><li>Wear reef shoes and a long-sleeve swim shirt against coral and sun.</li><li>Do not stand on or touch coral.</li><li>Check the weather: storms and swells change conditions quickly. See {GD('sumba-weather-by-month', 'weather by month')}.</li></ul>
<h2>What to bring</h2><ul><li>Your own mask, snorkel and fins: rental gear is rare.</li><li>Reef-safe sunscreen.</li><li>A dry bag for your phone.</li></ul>
<p>Combine a snorkel at Weekuri with the beaches of Kodi: see {GD('best-beaches-in-sumba', 'best beaches in Sumba')} and the {MAP}.</p>"""})

GUIDES4.append({"s": "drones-photography-sumba", "img": "wairinding-hill", "t": "Photography and drones in Sumba: best spots, light and the rules",
 "d": "Where and when to take the best photos in Sumba, how to photograph people and villages respectfully, and what to know before flying a drone in Indonesia.",
 "faq": [
  ["Can I fly a drone in Sumba?", "Recreational flying is generally possible, but Indonesia regulates drones under PM 37/2020. Sources report that drones over 250 g must be registered and that national parks require permits. Check current rules before you travel."],
  ["Where are the best photo spots in Sumba?", "Weekuri Lagoon, Wairinding Hill, Walakiri Beach at sunset, the villages of Ratenggaro and Prai Ijing, and the Tanggedu canyon."],
  ["Can I photograph people in villages?", "Ask first. Many people are happy to be photographed, but always ask permission, especially at ceremonies and around tombs."]],
 "b": f"""<p>Sumba is one of the most photogenic islands in Indonesia: turquoise lagoons, rolling savanna, towering thatched roofs and some of the best sunsets you will see. A little planning helps you get great pictures while respecting the people and places in front of your lens.</p>
<h2>The best light</h2><p>Sumba is near the equator, so the sun rises and sets quickly, around 05:30 to 06:20 and 17:45 to 18:30 local time depending on the month. The best light is in the first and last hour. Midday light is harsh, especially in the dry season. Every place page on our site shows the sunrise and sunset range for that spot.</p>
<h2>Top photo spots</h2><ul><li>{PL('wairinding-hill', 'Wairinding Hill')}: rolling hills at sunrise or late afternoon; green from January to April, golden in the dry season.</li><li>{PL('walakiri-beach', 'Walakiri Beach')}: silhouetted mangroves at sunset and low tide.</li><li>{PL('weekuri-lagoon', 'Weekuri Lagoon')}: turquoise water from the viewpoint above.</li><li>{PL('ratenggaro', 'Ratenggaro')} and {PL('prai-ijing', 'Prai Ijing')}: traditional houses and tombs.</li><li>{PL('tanggedu-waterfall', 'Tanggedu')}: canyon pools; best with soft light.</li><li>{PL('mandorak-beach', 'Mandorak')}: a small cove between cliffs.</li></ul>
<p>More ideas in {GD('best-sunsets-in-sumba', 'best sunsets in Sumba')}.</p>
<h2>Photographing people and villages</h2><ul><li>Ask before photographing people, houses and tombs; accept a no gracefully.</li><li>At ceremonies such as the Pasola, follow organisers and your guide.</li><li>Sign the village guestbook and leave a contribution; share photos with people if they ask.</li><li>Read {GD('respect-etiquette', 'village etiquette')}.</li></ul>
<h2>Drones: what to know</h2><p>Indonesia regulates drones under Ministry of Transport regulation PM 37/2020. Travel and customs sources report that drones over 250 g must be registered with the civil aviation authority and that tourists need a temporary flight permit, and that flying near airports and military areas is forbidden. National parks in Indonesia can require separate permits and fees for drone photography. Rules change, so check the latest official information before you travel.</p>
<ul><li>Keep well away from {GD('tambolaka-airport', 'Tambolaka')} and {GD('waingapu-airport', 'Waingapu')} airports.</li><li>Ask permission before flying over villages, people and ceremonies; never fly over riders and horses at the Pasola.</li><li>Do not fly in Manupeu Tanah Daru or Laiwangi Wanggameti national parks without checking permits; see {GD('sumba-national-parks-birds', 'national parks')}.</li><li>Fly only in daylight and keep your drone in sight.</li></ul>
<h2>Gear tips</h2><ul><li>Bring spare batteries and a power bank: power cuts happen.</li><li>Protect gear from dust in the dry season and humidity in the wet season.</li><li>A polarising filter helps with water and sky.</li></ul>"""})

GUIDES4.append({"s": "digital-nomads-sumba", "img": "kapulit-beach", "t": "Sumba for digital nomads: internet, visas and what to expect",
 "d": "Can you work remotely from Sumba? Mobile coverage, Wi-Fi, power, where to base yourself and Indonesia's E33G remote worker visa, with honest pros and cons.",
 "faq": [
  ["Is the internet good in Sumba?", "In towns, 4G mobile data usually works well; on remote coasts and in the hills it can be weak or absent. Many places have Wi-Fi, but speeds vary, so test before committing."],
  ["Can I work remotely in Indonesia on a tourist visa?", "Tourist visas and visas on arrival do not authorise work. Indonesia's E33G Remote Worker visa, available since April 2024, is the route for people employed by companies outside Indonesia."],
  ["What does the E33G visa require?", "Sources report a minimum income of about USD 60,000 a year and an employment contract with a company outside Indonesia. It is valid for one year. Check the official immigration site before applying."]],
 "b": f"""<p>Sumba is not Bali: there are no coworking hubs, few cafés with fast Wi-Fi and limited services. But for remote workers who value quiet, nature and space, a stay in Sumba can be wonderful, if you plan for connectivity and the legal side.</p>
<h2>Internet and power</h2><ul><li><b>Mobile data:</b> Telkomsel generally has the widest coverage in East Nusa Tenggara. 4G works well in towns such as Waingapu, Waikabubak and Tambolaka, but can drop on remote coasts and in valleys. See {GD('money-atms-sim-sumba', 'money, ATMs and SIM cards')}.</li><li><b>Wi-Fi:</b> many guesthouses have it, but speeds vary a lot. Ask for a speed test before booking a long stay.</li><li><b>Backup:</b> carry two SIM cards from different networks and a power bank; power cuts happen.</li></ul>
<h2>Where to base yourself</h2><ul><li><b>Waingapu:</b> the biggest town, with the most services and the most reliable connection.</li><li><b>Waikabubak and Tambolaka:</b> practical bases in the west.</li><li><b>The north coast around Mamboro:</b> quiet beaches and savanna; see {GD('sumba-north-coast', 'the north coast')}.</li><li><b>Remote coasts:</b> beautiful but often poorly connected; better for a few offline days.</li></ul>
<h2>Visas</h2><p>Tourist visas, visas on arrival and business visit visas do not authorise paid work. Since April 2024, Indonesia has offered the E33G Remote Worker visa, a one-year permit for people working for companies outside Indonesia. Visa agencies report an income requirement of about USD 60,000 a year and an employment agreement with a foreign company, and that holders cannot work for Indonesian companies or clients. Staying in Indonesia more than 183 days can also make you a tax resident. Rules change, so check the official immigration website (evisa.imigrasi.go.id) and get professional advice.</p>
<h2>Pros and cons</h2><ul><li><b>Pros:</b> peace and space, beaches and nature on your doorstep, a unique culture, few tourists.</li><li><b>Cons:</b> patchy internet outside towns, few cafés and services, long distances, limited healthcare.</li></ul>
<h2>Tips</h2><ul><li>Download work files and maps before heading out.</li><li>Schedule calls from towns; keep exploring days offline.</li><li>Rent a car with a driver for weekends: {GD('hire-a-driver-sumba', 'hiring a driver')}.</li><li>Read {GD('sumba-practical-tips', 'practical tips')} and {GD('is-sumba-safe', 'is Sumba safe?')}.</li></ul>"""})
