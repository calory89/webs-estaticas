# 23-nov-2026 · Batch 6, part 4: comparisons, itineraries and area guides. Same rules as the other batches.
from guides4 import PL, GD, MAP, _km, _drive, TMC, WGP
from places import PLACES as _P, TOWNS as _T
from places_mamboro import MAMBORO as _M
from coords_fix import COORD_FIX
_LL = {p["s"]: COORD_FIX.get(p["s"], p["ll"]) for p in _P + _M}
_N = {p["s"]: p["en"]["n"] for p in _P + _M}
def hop(a, b): return _drive(_km(_LL[a], _LL[b]))
def G(s, img, t, d, b, faq): return {"s": s, "img": img, "t": t, "d": d, "b": b, "faq": faq}
_photo = [p for p in {q["s"]: q for q in _P + _M}.values() if p["c"] == "viewpoint" or p.get("sec")]

GUIDES6C = [
G("sumba-vs-nusa-penida", "mandorak-beach", "Sumba vs Nusa Penida: which island should you choose?",
  "Comparing Sumba and Nusa Penida for cliffs, beaches, crowds, culture, access and the kind of trip you want.",
  """<p>Both islands are famous for dramatic coastlines, but they offer very different trips. Nusa Penida is a short boat ride from Bali; Sumba is a flight away and far larger.</p>
<h2>At a glance</h2><table><thead><tr><th></th><th>Sumba</th><th>Nusa Penida</th></tr></thead><tbody>
<tr><td>Getting there</td><td>Domestic flight from Bali</td><td>Fast boat from Bali</td></tr>
<tr><td>Size</td><td>Large island, four regencies</td><td>Small island, explored in a day or two</td></tr>
<tr><td>Crowds</td><td>Very few visitors</td><td>Popular viewpoints are busy, especially on day-trip hours</td></tr>
<tr><td>Culture</td><td>Living Marapu villages, megalithic tombs, ikat, Pasola</td><td>Balinese Hindu culture, temples</td></tr>
<tr><td>Landscape</td><td>Savannah, waterfalls, lagoons, long beaches</td><td>Cliffs, viewpoints, steep beaches</td></tr>
<tr><td>Marine life</td><td>Snorkelling on reefs; see our guide</td><td>Known for manta ray snorkelling and diving trips</td></tr></tbody></table>
<h2>Choose Sumba if</h2><ul><li>You want space, quiet and a culture very different from Bali.</li><li>You have at least four or five days.</li><li>You like road trips through varied landscapes.</li></ul>
<h2>Choose Nusa Penida if</h2><ul><li>You only have a day or two from Bali.</li><li>Manta rays are your priority.</li><li>You do not mind sharing famous viewpoints.</li></ul>
<h2>Or both</h2><p>They combine well in a two-week trip; see """ + GD("bali-and-sumba-two-weeks", "Bali and Sumba in two weeks") + """. For Sumba's cliffs, start with """ + PL("mandorak-beach", "Mandorak") + """ and """ + PL("watu-maladong", "Watu Maladong") + """.</p>""",
  [["Is Sumba like Nusa Penida?", "Both have dramatic coasts, but Sumba is far larger, quieter and culturally distinct, and needs a flight rather than a boat from Bali."]]),
G("sumba-vs-gili-islands", "walakiri-beach", "Sumba vs the Gili Islands",
  "Sumba or the Gilis? Comparing beaches, atmosphere, nightlife, snorkelling, culture, access and cost of getting around.",
  """<p>The Gili Islands off Lombok and the island of Sumba are both beach escapes from Bali, but they could hardly be more different in atmosphere.</p>
<h2>The Gilis in short</h2><p>Three tiny, car-free islands with a lively traveller scene, especially on Gili Trawangan, easy snorkelling with turtles, and everything within walking or cycling distance. Reached by boat from Bali or Lombok.</p>
<h2>Sumba in short</h2><p>A large, rural island with few visitors, living traditional culture, savannah hills, waterfalls and long empty beaches. Reached by a domestic flight; explored by car.</p>
<h2>Compared</h2><table><thead><tr><th></th><th>Sumba</th><th>Gili Islands</th></tr></thead><tbody>
<tr><td>Atmosphere</td><td>Quiet, rural, traditional</td><td>Social, lively, backpacker to boutique</td></tr>
<tr><td>Nightlife</td><td>Almost none</td><td>Plenty, especially on Gili T</td></tr>
<tr><td>Getting around</td><td>Car with driver or scooter</td><td>On foot, bicycle or horse cart</td></tr>
<tr><td>Beaches</td><td>Many, often empty, some with big surf</td><td>Small, sheltered, busy</td></tr>
<tr><td>Culture</td><td>Marapu villages, ikat, megaliths</td><td>Mostly tourism-focused</td></tr></tbody></table>
<h2>Which to choose</h2><ul><li><b>Sumba</b> for adventure, culture and solitude.</li><li><b>The Gilis</b> for a relaxed, social beach break with easy snorkelling.</li></ul>
<p>Read """ + GD("is-sumba-worth-it", "is Sumba worth it?") + """ and """ + GD("sumba-vs-lombok", "Sumba vs Lombok") + """.</p>""",
  [["Is Sumba better than the Gili Islands?", "It depends on the trip: Sumba for culture, space and adventure; the Gilis for a lively, easy beach break."]]),
G("sumba-vs-raja-ampat", "weekuri-lagoon", "Sumba vs Raja Ampat",
  "Comparing two remote corners of Indonesia: Raja Ampat's world-famous reefs and Sumba's culture and landscapes on land.",
  """<p>Both are remote, beautiful and far from the crowds, but they are built for different travellers.</p>
<h2>Raja Ampat</h2><p>An archipelago off West Papua, famous for some of the richest coral reefs on Earth. Most of the experience is underwater or on boats: diving, snorkelling, island hopping, often on liveaboards. Getting there takes several flights and boat connections, and trips are generally expensive. Visitors pay a marine park entry fee.</p>
<h2>Sumba</h2><p>One large island in East Nusa Tenggara, a short domestic flight from Bali. The highlights are on land: traditional villages, megalithic tombs, ikat weaving, savannahs, waterfalls, lagoons and long beaches. Snorkelling and diving exist but are not the main reason people come; see """ + GD("snorkeling-diving-sumba", "snorkelling and diving in Sumba") + """.</p>
<h2>Compared</h2><table><thead><tr><th></th><th>Sumba</th><th>Raja Ampat</th></tr></thead><tbody>
<tr><td>Best for</td><td>Culture, landscapes, road trips</td><td>Diving and marine life</td></tr>
<tr><td>Access</td><td>One flight from Bali</td><td>Several flights and boats</td></tr>
<tr><td>Trip style</td><td>Car with driver</td><td>Boats and liveaboards</td></tr>
<tr><td>Minimum time</td><td>4 to 5 days</td><td>About a week or more</td></tr></tbody></table>
<p>If you are a diver, Raja Ampat is in a league of its own. If you want to meet a living culture and explore on land, choose Sumba; start with """ + GD("sumba-travel-guide", "our Sumba travel guide") + """.</p>""",
  [["Is Sumba good for diving like Raja Ampat?", "No. Sumba's strengths are on land; Raja Ampat is one of the world's top diving destinations."]]),
G("sumba-vs-mentawai", "marosi-beach", "Sumba vs Mentawai for surfing",
  "Comparing Sumba and the Mentawai Islands for a surf trip: waves, access, boat versus land trips, crowds and what else there is to do.",
  """<p>The Mentawai Islands off Sumatra are one of the most famous surf destinations in the world. Sumba, far to the east, has its own powerful waves on the Indian Ocean coast and far fewer surfers in the water.</p>
<h2>Mentawai</h2><ul><li>A chain of islands with many world-class reef breaks.</li><li>Commonly surfed from boat charters or surf camps, reached by boat from Padang.</li><li>Popular and organised: you will rarely be alone at the best-known breaks in peak season.</li></ul>
<h2>Sumba</h2><ul><li>Reef and beach breaks along the south and west coasts, working best with the dry-season swells.</li><li>Surfed mostly by land, with a car and local knowledge; a few places are reached by boat.</li><li>Uncrowded, but also less organised; many breaks are only for experienced surfers.</li><li>Culture and landscapes for flat days: villages, waterfalls, savannah.</li></ul>
<h2>Which to choose</h2><ul><li><b>Mentawai</b> if you want a dedicated, waves-first trip on a boat.</li><li><b>Sumba</b> if you want quieter line-ups and a land trip with plenty to do out of the water.</li></ul>
<p>More: """ + GD("surf-sumba", "surfing in Sumba") + """, """ + GD("sumba-dry-season", "the dry season") + """, """ + GD("swimming-safety-sumba", "safety in the sea") + """.</p>""",
  [["Is Sumba good for surfing?", "Yes, for experienced surfers: powerful waves on the south and west coasts with few people, best in the dry season."]]),
# ---------------- itineraries ----------------
G("itinerary-1-day", "weekuri-lagoon", "One day in Sumba: the best of the west from Tambolaka",
  "If you only have one day in Sumba, this route from Tambolaka covers a lagoon, cliffs and a traditional village, with drive times.",
  f"""<p>A single day is not much for Sumba, but from Tambolaka airport you can see three of the island's icons in the southwest. Times are estimates from our map data.</p>
<h2>Morning: Weekuri Lagoon</h2><p>Drive from Tambolaka to {PL("weekuri-lagoon", "Weekuri Lagoon")} (about {_drive(_km(TMC, _LL["weekuri-lagoon"]))}) and swim in the turquoise water before the crowds arrive.</p>
<h2>Late morning: Mandorak Beach</h2><p>{PL("mandorak-beach", "Mandorak")} is a small cove between cliffs, about {hop("weekuri-lagoon", "mandorak-beach")} away.</p>
<h2>Afternoon: Ratenggaro Village</h2><p>Continue to {PL("ratenggaro", "Ratenggaro")} (about {hop("mandorak-beach", "ratenggaro")}), with its tall thatched roofs and stone tombs by the sea. Sign the guestbook and leave a donation; see {GD("respect-etiquette", "etiquette")}.</p>
<h2>Sunset: Pero Beach</h2><p>Finish at {PL("pero-beach", "Pero")} (about {hop("ratenggaro", "pero-beach")}) for sunset, then return to Tambolaka (about {_drive(_km(_LL["pero-beach"], TMC))}).</p>
<h2>Tips</h2><ul><li>Hire a car with driver; see {GD("hire-a-driver-sumba", "hiring a driver")}.</li><li>Bring cash, water, swimwear and water shoes.</li><li>If you have more time: {GD("itinerary-2-days", "2 days")}, {GD("itinerary-3-days", "3 days")}.</li></ul>""",
  [["What can I see in one day in Sumba?", "From Tambolaka: Weekuri Lagoon, Mandorak Beach, Ratenggaro village and sunset at Pero."]]),
G("itinerary-2-days", "ratenggaro", "Sumba in 2 days: a weekend itinerary",
  "A realistic two-day plan for Sumba from Tambolaka: the southwest coast on day one, villages and waterfalls around Waikabubak on day two.",
  f"""<p>Two days is enough for a taste of West and Southwest Sumba. Fly into Tambolaka and stay in the west; leave the east for another trip.</p>
<h2>Day 1: the Kodi coast</h2><ul><li>{PL("weekuri-lagoon", "Weekuri Lagoon")} in the morning (about {_drive(_km(TMC, _LL["weekuri-lagoon"]))} from the airport).</li><li>{PL("mandorak-beach", "Mandorak")} (about {hop("weekuri-lagoon", "mandorak-beach")}).</li><li>{PL("ratenggaro", "Ratenggaro")} and {PL("wainyapu", "Wainyapu")} villages.</li><li>Sunset at {PL("pero-beach", "Pero")}.</li></ul>
<h2>Day 2: Waikabubak and the hills</h2><ul><li>Drive inland to Waikabubak; see {GD("tambolaka-to-waikabubak", "Tambolaka to Waikabubak")}.</li><li>Morning at {PL("tarung-village", "Tarung")} on its hilltop in town.</li><li>{PL("lapopu-waterfall", "Lapopu Waterfall")} (about {_drive(_km(_LL["tarung-village"], _LL["lapopu-waterfall"]))} from Waikabubak), or the south coast at {PL("marosi-beach", "Marosi")}.</li><li>Back to Tambolaka for your flight or the night.</li></ul>
<h2>Tips</h2><ul><li>Check flight times: early arrivals make day 1 much fuller.</li><li>Keep both days flexible in the rainy season.</li><li>More time? See {GD("itinerary-3-days", "3 days")} or {GD("itinerary-4-days", "4 days")}.</li></ul>""",
  [["Is a weekend enough for Sumba?", "For a taste of the west, yes: one day on the Kodi coast and one around Waikabubak."]]),
G("itinerary-14-days", "wairinding-hill", "Sumba in 14 days: the complete island",
  "A slow two-week itinerary covering all four regencies of Sumba: the Kodi coast, Waikabubak's villages, the Mamboro coast, East Sumba's savannah and the south coast.",
  f"""<p>Two weeks lets you see all of Sumba at a pace the island deserves, with time for ceremonies, markets and lazy beach days. Fly into Tambolaka and out of Waingapu (or the reverse).</p>
<h2>Days 1 to 3: Southwest Sumba</h2><p>{PL("weekuri-lagoon", "Weekuri")}, {PL("mandorak-beach", "Mandorak")}, {PL("watu-maladong", "Watu Maladong")}, the villages of {PL("ratenggaro", "Ratenggaro")} and {PL("wainyapu", "Wainyapu")}, and sunsets at {PL("pero-beach", "Pero")}. See {GD("kodi-sumba-guide", "the Kodi area")}.</p>
<h2>Days 4 to 6: West Sumba</h2><p>Base in Waikabubak: {PL("tarung-village", "Tarung")} and {PL("waigalli-village", "Waigalli")}, {PL("lapopu-waterfall", "Lapopu")}, {PL("matayangu-waterfall", "Matayangu")} (a full day), and the south coast at {PL("marosi-beach", "Marosi")} and {PL("rua-beach", "Rua")}.</p>
<h2>Days 7 to 8: Central Sumba</h2><p>The stones of {PL("pasunga-village", "Pasunga")} and {PL("gallubakul-tomb", "Gallubakul")} ({GD("anakalang-guide", "Anakalang")}), then the north coast beaches of Mamboro; see {GD("day-trips-from-mamboro", "day trips from Mamboro")}.</p>
<h2>Days 9 to 12: East Sumba</h2><p>Cross to Waingapu ({GD("waibakul-to-waingapu", "Waibakul to Waingapu")}). {PL("wairinding-hill", "Wairinding")} at sunset, weaving at {PL("prailiu-village", "Prailiu")} and {PL("praiyawang-rende", "Praiyawang")}, {PL("walakiri-beach", "Walakiri")} and {PL("puru-kambera", "Puru Kambera")}, and a long day to {PL("tanggedu-waterfall", "Tanggedu")}.</p>
<h2>Days 13 to 14: the south of East Sumba</h2><p>{PL("tarimbang-bay", "Tarimbang")} or the highlands of {PL("wanggameti", "Wanggameti")}, then back to Waingapu for your flight.</p>
<h2>Tips</h2><ul><li>Keep one free day in each region for weather and invitations.</li><li>Check for {GD("pasola-dates", "the Pasola")} or {GD("wula-podu-festival", "Wula Podu")} if your dates match.</li><li>Shorter versions: {GD("itinerary-7-days", "7 days")}, {GD("itinerary-10-days", "10 days")}.</li></ul>""",
  [["Is two weeks too long for Sumba?", "No. Two weeks lets you see all four regencies at a relaxed pace, with time for culture and beaches."]]),
G("sumba-and-flores-itinerary", "wairinding-hill", "Sumba and Flores: how to combine them",
  "How to combine Sumba with Flores and Komodo in one trip: routes, how to travel between the islands, and sample plans for 10 to 16 days.",
  """<p>Flores, with Labuan Bajo and Komodo National Park, lies just north of Sumba. Combining them gives you dragons, boat trips and volcanoes plus Sumba's culture and savannah.</p>
<h2>Travelling between the islands</h2><ul><li><b>By air:</b> check whether a direct flight between Sumba and Labuan Bajo or other Flores airports is operating for your dates; routes change often. Otherwise connect through Bali or Kupang.</li><li><b>By sea:</b> ferries link Waingapu with ports in Flores, but schedules are infrequent and can change; see """ + GD("ferry-to-sumba", "ferries to Sumba") + """.</li></ul>
<h2>Sample plan (about 12 days)</h2><ol><li>Bali to Labuan Bajo by air.</li><li>Days 1 to 4: Komodo boat trip, Labuan Bajo.</li><li>Fly or sail to Sumba.</li><li>Days 5 to 11: Sumba from west to east (or east to west); see """ + GD("sumba-road-trip-west-to-east", "Sumba road trip") + """.</li><li>Fly back to Bali.</li></ol>
<h2>Which first?</h2><p>Plan around flight availability. If the Pasola is on (February or March), put Sumba at the right moment. See """ + GD("pasola-dates", "Pasola dates") + """.</p>
<h2>How they differ</h2><p>Flores is volcanic and mountainous, with a busy tourist hub in Labuan Bajo. Sumba is flatter, drier in the east, much quieter and culturally distinct. See """ + GD("sumba-vs-flores", "Sumba vs Flores") + """.</p>""",
  [["Can I combine Sumba and Komodo?", "Yes. Fly or sail between Sumba and Flores (Labuan Bajo), or connect through Bali or Kupang; check current routes."]]),
G("bali-and-sumba-two-weeks", "pero-beach", "Bali and Sumba in two weeks",
  "A two-week Indonesia itinerary combining Bali's highlights with a week in Sumba, with flight tips and how to split the days.",
  """<p>Bali and Sumba make a perfect pair: Bali's temples, rice terraces and food, and Sumba's empty beaches, villages and savannah, linked by a short domestic flight.</p>
<h2>How to split two weeks</h2><ul><li><b>Bali, 6 to 7 days:</b> Ubud for culture and rice terraces, plus a beach area.</li><li><b>Sumba, 7 to 8 days:</b> fly into Tambolaka, cross the island and fly out of Waingapu, or the reverse; see """ + GD("itinerary-7-days", "7 days in Sumba") + """.</li></ul>
<h2>Order</h2><ul><li>Bali first lets you recover from jet lag in comfort.</li><li>Sumba first and Bali last suits travellers who want to end with comfort and shopping.</li><li>Leave a buffer day in Bali before an international flight.</li></ul>
<h2>Flights</h2><p>Domestic flights connect Bali with Tambolaka and Waingapu. Schedules change by season; book early in high season. See """ + GD("bali-to-sumba", "Bali to Sumba") + """.</p>
<h2>What changes when you land in Sumba</h2><ul><li>Cash only in most places; see """ + GD("atm-locations-sumba", "ATMs") + """.</li><li>No ride-hailing; hire a driver.</li><li>Fewer visitors and more traditional culture; see """ + GD("sumba-vs-bali", "Sumba vs Bali") + """.</li></ul>""",
  [["How many days in Sumba on a two-week Bali trip?", "About a week, enough to cross the island from Tambolaka to Waingapu."]]),
G("sumba-road-trip-west-to-east", "napu-valley", "Sumba road trip: west to east in 6 days",
  "A classic road trip across Sumba from Tambolaka to Waingapu, with drive times, stops and nights, using one-way flights.",
  f"""<p>The best way to see Sumba's variety is to cross it: from the green, village-filled west to the open savannah of the east. Fly into Tambolaka and out of Waingapu.</p>
<h2>Day 1: Tambolaka and the Kodi coast</h2><p>{PL("weekuri-lagoon", "Weekuri")}, {PL("mandorak-beach", "Mandorak")} and sunset at {PL("pero-beach", "Pero")}.</p>
<h2>Day 2: villages of the southwest</h2><p>{PL("ratenggaro", "Ratenggaro")}, {PL("wainyapu", "Wainyapu")}, then inland to Waikabubak ({GD("tambolaka-to-waikabubak", "drive time")}).</p>
<h2>Day 3: West Sumba</h2><p>{PL("tarung-village", "Tarung")}, {PL("lapopu-waterfall", "Lapopu")} and the south coast at {PL("marosi-beach", "Marosi")}.</p>
<h2>Day 4: Central Sumba</h2><p>{PL("pasunga-village", "Pasunga")} in Anakalang, then north to the Mamboro coast for the night ({GD("waikabubak-to-mamboro", "Waikabubak to Mamboro")}).</p>
<h2>Day 5: across to the east</h2><p>The long drive to Waingapu ({GD("waingapu-to-mamboro", "Mamboro to Waingapu")}); stop at {PL("harunda-waterfall", "Harunda")} if the road allows, and reach {PL("wairinding-hill", "Wairinding")} for sunset.</p>
<h2>Day 6: East Sumba</h2><p>Weaving at {PL("prailiu-village", "Prailiu")}, the beach at {PL("walakiri-beach", "Walakiri")}, then your flight from Waingapu.</p>
<h2>Tips</h2><ul><li>Drive times are estimates; start early every day.</li><li>Fill up and get cash in each town; see {GD("fuel-stations-sumba", "fuel")} and {GD("atm-locations-sumba", "ATMs")}.</li><li>Seven days or more? Add a day in the east for {PL("tanggedu-waterfall", "Tanggedu")}.</li></ul>""",
  [["Can I drive across Sumba?", "Yes. A road crosses the island from Tambolaka to Waingapu; allow at least five or six days to enjoy the stops."]]),
G("beach-hopping-sumba", "kapulit-beach", "Beach hopping in Sumba: a route along the best beaches",
  "A beach-by-beach route around Sumba: lagoons and cliffs in the southwest, the quiet north coast, the dancing trees of the east and the wild south.",
  f"""<p>Sumba has beaches for every mood: turquoise lagoons, cliff coves, long empty sands and wild surf. This route links the best of them; see {GD("best-beaches-in-sumba", "the best beaches")} for more detail.</p>
<h2>Southwest: lagoons and cliffs</h2><ul><li>{PL("weekuri-lagoon", "Weekuri Lagoon")}: calm turquoise water.</li><li>{PL("mandorak-beach", "Mandorak")}: a cove between cliffs ({hop("weekuri-lagoon", "mandorak-beach")} from Weekuri).</li><li>{PL("watu-maladong", "Watu Maladong")} and {PL("pero-beach", "Pero")}: the far west coast and its sunsets.</li></ul>
<h2>West: the south coast</h2><ul><li>{PL("marosi-beach", "Marosi")} and {PL("rua-beach", "Rua")}: long beaches facing the open ocean. Admire the waves; see {GD("swimming-safety-sumba", "swimming safety")}.</li></ul>
<h2>Central: the Mamboro coast</h2><ul><li>{PL("kapulit-beach", "Kapulit")}, {PL("mananga-beach", "Mananga")}, {PL("karendi-beach", "Karendi")} and {PL("lenang-beach", "Lenang")}: quiet north coast beaches; see {GD("beaches-central-sumba", "beaches of Central Sumba")}.</li></ul>
<h2>East: savannah meets the sea</h2><ul><li>{PL("walakiri-beach", "Walakiri")}: the dancing trees at sunset.</li><li>{PL("puru-kambera", "Puru Kambera")}: long sands with horses.</li><li>{PL("tarimbang-bay", "Tarimbang")}: a wide bay on the south coast.</li></ul>
<h2>Tips</h2><ul><li>North coast beaches are usually calmer; the south is for experienced swimmers only.</li><li>Bring water shoes, shade and drinking water; few beaches have facilities.</li><li>Some beaches are on village land; a small fee or donation may be asked.</li></ul>""",
  [["Where are the calmest beaches in Sumba?", "Usually on the north coast and in lagoons such as Weekuri; the south coast has powerful waves."]]),
G("village-route-sumba", "praiyawang-rende", "Traditional villages of Sumba: a route from west to east",
  "A route through Sumba's most important traditional villages, from Kodi and Waikabubak to Anakalang and East Sumba, with etiquette tips.",
  f"""<p>Sumba is one of the few places in Indonesia where traditional villages with towering houses and megalithic tombs are still part of daily life. This route links the best known; see {GD("traditional-villages-sumba", "traditional villages")} for background.</p>
<h2>Southwest: Kodi</h2><ul><li>{PL("ratenggaro", "Ratenggaro")}: tall roofs and tombs by the sea.</li><li>{PL("wainyapu", "Wainyapu")}: a large village across the river mouth, with one of the biggest groups of stone tombs in Kodi.</li></ul>
<h2>West: around Waikabubak</h2><ul><li>{PL("tarung-village", "Tarung")} and {PL("waigalli-village", "Waigalli")}: Marapu villages in and just south of town; see {GD("wula-podu-festival", "Wula Podu")}.</li><li>{PL("prai-ijing", "Prai Ijing")}: a picturesque village near town.</li></ul>
<h2>Central: Anakalang</h2><ul><li>{PL("pasunga-village", "Pasunga")} and {PL("gallubakul-tomb", "Gallubakul")}: some of the most impressive stone tombs; see {GD("anakalang-guide", "Anakalang")}.</li></ul>
<h2>East</h2><ul><li>{PL("prailiu-village", "Prailiu")}: weaving next to Waingapu.</li><li>{PL("praiyawang-rende", "Praiyawang (Rende)")}: royal tombs and fine ikat.</li><li>{PL("wunga-village", "Wunga")}: in the north-east, linked with origin stories of the Sumbanese.</li></ul>
<h2>Etiquette in short</h2><ul><li>Greet the person who welcomes you, sign the guestbook and leave a donation.</li><li>Dress modestly, bring betel nut, ask before photos.</li><li>Do not climb on tombs.</li></ul><p>More: {GD("respect-etiquette", "etiquette")}, {GD("gifts-for-village-hosts", "gifts")}, {GD("kabisu-clans-sumba", "clans and houses")}.</p>""",
  [["Which traditional villages should I visit in Sumba?", "Ratenggaro and Wainyapu in the southwest, Tarung in Waikabubak, Pasunga in Central Sumba and Prailiu and Praiyawang in the east."]]),
G("waterfall-route-sumba", "matayangu-waterfall", "Sumba waterfall route: every waterfall on our map",
  "A route to Sumba's waterfalls, west to east, with drive times, the best season and safety tips for paths and pools.",
  f"""<p>Sumba's waterfalls range from easy forest pools to canyon adventures. They are strongest in and just after the rainy season. See {GD("sumba-waterfalls", "Sumba waterfalls")} for background.</p>
<h2>West and the Central Sumba hills</h2><ul><li>{PL("weekacura-waterfall", "Weekacura")}, among rice fields in Southwest Sumba.</li><li>{PL("lapopu-waterfall", "Lapopu")}, south-east of Waikabubak; see {GD("waikabubak-to-lapopu-waterfall", "how to get there")}.</li><li>{PL("matayangu-waterfall", "Matayangu")}, a longer adventure in the forested hills (about {hop("lapopu-waterfall", "matayangu-waterfall")} from Lapopu).</li></ul>
<h2>Central</h2><ul><li>{PL("harunda-waterfall", "Harunda")}, near the cross-island road.</li></ul>
<h2>East</h2><ul><li>{PL("waimarang-waterfall", "Waimarang")}: a turquoise pool in the forest.</li><li>{PL("tanggedu-waterfall", "Tanggedu")}: a canyon of pools; see {GD("waingapu-to-tanggedu-waterfall", "how to get there")}.</li><li>{PL("kolam-jodoh-waterfall", "Kolam Jodoh")}.</li></ul>
<h2>Best season</h2><p>From about January to May for strong flow; late in the dry season some falls shrink to a trickle. Paths are muddier in the rains.</p>
<h2>Safety</h2><ul><li>Wear shoes with grip; rocks are slippery.</li><li>Do not swim after heavy rain: water rises fast.</li><li>Go with a local guide for Matayangu and Tanggedu.</li></ul>""",
  [["When are Sumba's waterfalls best?", "During and just after the rainy season, roughly January to May."]]),
G("photo-spots-sumba", "wairinding-hill", f"The best photo spots in Sumba: {len(_photo)} places",
  "Sumba's most photogenic viewpoints and lesser-known spots, with the best light and tips for each, from our checked map.",
  """<p>Sumba is a photographer's island: savannah, sea cliffs, lagoons, tall roofs and golden light. This list combines all the viewpoints and lesser-known spots on our map.</p><h2>Photo spots</h2>""" +
  "".join(f"<h3>{PL(p['s'], p['en']['n'])}</h3><p>{p['en']['t']}</p><p><b>Tip:</b> {p['en']['tip']}</p>" for p in _photo) +
  """<h2>Light and timing</h2><ul><li>Golden hour is short near the equator: be in place 45 minutes before sunset.</li><li>East Sumba's hills are gold in the dry season and green from January to April.</li><li>Clear skies are most common from May to October.</li></ul>
<h2>Respect</h2><p>Ask before photographing people and villages; see """ + GD("photographing-people-sumba", "photographing people") + """. Drones: see """ + GD("drones-photography-sumba", "drones") + """.</p>""",
  [["Where are the best photo spots in Sumba?", "Wairinding Hill and the East Sumba savannah, Weekuri Lagoon, Mandorak, the dancing trees of Walakiri and the villages of Kodi."]]),
G("kodi-sumba-guide", "wainyapu", "Kodi, Southwest Sumba: villages, beaches and the Pasola",
  "A guide to the Kodi area at the western tip of Sumba: Ratenggaro, Wainyapu, Pero, Mandorak and Weekuri, how to get there and when to go.",
  f"""<p>Kodi is the far western corner of Sumba, in Southwest Sumba regency. It is famous for the tallest-roofed traditional villages on the island, dramatic coastline and one of the Pasola festivals.</p>
<h2>Villages</h2><ul><li>{PL("ratenggaro", "Ratenggaro")}: towering roofs and stone tombs on the shore.</li><li>{PL("wainyapu", "Wainyapu")}: a large traditional village across the river mouth.</li><li>{PL("pero-beach", "Pero")}: a fishing village with wooden boats on the sand.</li></ul>
<h2>Beaches and lagoons</h2><ul><li>{PL("mandorak-beach", "Mandorak")}: a cove between cliffs.</li><li>{PL("weekuri-lagoon", "Weekuri Lagoon")}: calm turquoise water behind a coral wall.</li><li>{PL("watu-maladong", "Watu Maladong")}: a rocky beach on the south side.</li></ul>
<h2>Pasola in Kodi</h2><p>Kodi holds one of the Pasola festivals in February or March, with dates set by the Marapu priests. See {GD("pasola-dates", "Pasola dates")} and {GD("pasola-safety-tips", "watching safely")}.</p>
<h2>Getting there</h2><p>From Tambolaka airport, Ratenggaro is about {_drive(_km(TMC, _LL["ratenggaro"]))} by road (estimate); see {GD("tambolaka-to-ratenggaro", "Tambolaka to Ratenggaro")}.</p>
<h2>Tips</h2><ul><li>Combine villages and beaches in one day; see {GD("itinerary-1-day", "one day in Sumba")}.</li><li>Sign guestbooks, leave donations and ask before photos.</li><li>Sunsets on the west coast are spectacular.</li></ul>""",
  [["Where is Kodi in Sumba?", "At the far western tip of the island, in Southwest Sumba regency."], ["What is Kodi known for?", "Tall-roofed villages such as Ratenggaro and Wainyapu, dramatic beaches and a Pasola festival."]]),
G("anakalang-guide", "pasunga-village", "Anakalang, Central Sumba: megalithic tombs on the main road",
  "A guide to Anakalang in Central Sumba: Pasunga village, the Gallubakul tomb, how to visit and what makes the stones special.",
  f"""<p>Anakalang, near Waibakul in Central Sumba, is home to some of the most impressive megalithic tombs on the island, and it sits right on the cross-island road, so it is an easy stop.</p>
<h2>Pasunga</h2><p>{PL("pasunga-village", "Pasunga")} faces the main road across from the Anakalang market, with rows of high-roofed houses around a square of stone tombs.</p>
<h2>Gallubakul</h2><p>{PL("gallubakul-tomb", "Gallubakul")} is a massive stone tomb near Anakalang. Stones like these were cut and dragged into place by large groups of people in ceremonies that could last days; see {GD("sumba-megalithic-tombs", "megalithic tombs")}.</p>
<h2>Visiting</h2><ul><li>Greet the families, sign the guestbook and leave a donation.</li><li>Do not climb on the tombs.</li><li>Ask your driver to time the stop on market day for extra atmosphere.</li></ul>
<h2>Getting there</h2><p>Anakalang is close to Waibakul; see {GD("waikabubak-to-waibakul", "Waikabubak to Waibakul")}, {GD("tambolaka-to-waibakul", "Tambolaka to Waibakul")} and {GD("day-trips-from-waibakul", "day trips from Waibakul")}.</p>
<h2>Understand what you see</h2><p>Read {GD("sumba-funerals", "funerals in Sumba")} and {GD("marapu-religion-sumba", "Marapu religion")}.</p>""",
  [["Where is Anakalang?", "In Central Sumba near Waibakul, on the main road across the island."], ["What is there to see in Anakalang?", "Pasunga village and the Gallubakul tomb, among the most impressive megalithic tombs in Sumba."]]),
]
