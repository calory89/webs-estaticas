# 18-nov-2026 · Batch 5 of guides (items 31-75 and 254-269 of claude/sumbasecrets-300-prioridades.md).
# Rules: English source, machine-translated at build time; no hotel names, no invented prices or people, no em dashes.
# Figures with a source say so (BPS = Badan Pusat Statistik, Indonesia's statistics office).
from guides4 import PL, GD, MAP, _table, TMC, WGP, WEST, EAST
from places import PLACES as _P
from places_mamboro import MAMBORO as _M

TEAM = "Sumba Secrets team (Eco Beach City, Mamboro)"

GUIDES5 = [
# ---------------- trust pages ----------------
{"s": "editorial-policy", "img": "wairinding-hill", "info": 1,
 "t": "Editorial policy: how Sumba Secrets checks what it publishes",
 "d": "How we research, verify, date and correct every place, map pin and guide on Sumba Secrets, and what we never publish.",
 "b": """<p>Sumba Secrets is a free guide to the island of Sumba in Indonesia. People use it to plan real trips on real roads, so a wrong pin or an outdated tip costs them time and sometimes money. This page explains the rules we follow.</p>
<h2>Where our information comes from</h2>
<ul><li><b>Our own visits.</b> The team lives in Mamboro, on the north coast of Central Sumba, and travels the island regularly. When a page says it was checked on the ground, it was.</li>
<li><b>Satellite imagery and open maps.</b> Every pin on the map is checked against satellite imagery at high zoom and against OpenStreetMap. Beaches are placed on the sand, not in the hills.</li>
<li><b>Official data.</b> Population and administrative facts come from BPS, Indonesia's statistics office. Climate tables come from the ERA5 reanalysis (2015 to 2024), not from guesses.</li>
<li><b>Published research.</b> Pages about Marapu, the Pasola and traditional villages cite academic and local sources where we rely on them.</li></ul>
<h2>What we never publish</h2>
<ul><li>Invented prices, opening hours or reviews. When a figure is approximate we say so.</li>
<li>Paid rankings disguised as advice. Nobody can pay to appear higher in a list.</li>
<li>AI-generated images presented as photos. Our photos are credited, with author and licence, and most come from Wikimedia Commons until our own are ready.</li>
<li>Exact locations of sacred sites that communities ask to keep private.</li></ul>
<h2>Dates and updates</h2>
<p>Every page shows when it was last updated. Guides are reviewed at least once a year and after any change we hear about: a road that washes out, a new flight route, a village that changes its visiting rules.</p>
<h2>Who pays for this guide</h2>
<p>Sumba Secrets is published by Eco Beach City, a project based in Mamboro. That is a commercial interest and we say it openly. It never changes which places we recommend or how we describe them.</p>
<h2>Found a mistake?</h2>
<p>Use the "report an error" button on any place page or write to info@ecobeachcity.com. We fix confirmed errors quickly and list important ones on our """ + GD("corrections", "corrections page") + """.</p>""",
 "faq": [["Who writes Sumba Secrets?", "The guide is written and maintained by the Sumba Secrets team at Eco Beach City, based in Mamboro, Central Sumba."],
         ["Can a business pay to be listed?", "No. Places are chosen and described on their own merits. We do not sell positions in our lists."],
         ["How are map pins checked?", "Each pin is compared with satellite imagery at high zoom and with OpenStreetMap, and corrected by hand when they disagree."]]},
{"s": "corrections", "img": "pero-beach", "info": 1,
 "t": "Corrections and updates log",
 "d": "A public log of the important corrections we have made to places, map pins and guides on Sumba Secrets.",
 "b": """<p>We prefer to say openly when we got something wrong. This log lists the corrections that change what a traveller would do. Small typo fixes are not listed.</p>
<h2>November 2026</h2>
<ul><li><b>Beach pins.</b> Several beaches appeared inland on the map because the island coastline in open map data is shifted in remote areas. Every beach was re-checked on satellite imagery and moved onto the sand.</li>
<li><b>Map points disappearing when zooming.</b> Grouped markers hid places at some zoom levels. The map now always shows every place.</li>
<li><b>Short distances.</b> Very short drives showed as "0 km by road". They now show at least 1 km.</li></ul>
<h2>How to report a problem</h2>
<p>Use the "report an error" button on any place page, or email info@ecobeachcity.com with the page link and what you saw. See our """ + GD("editorial-policy", "editorial policy") + """ for how we verify information.</p>"""},
{"s": "contact", "img": "weekuri-lagoon", "info": 1,
 "t": "Contact Sumba Secrets",
 "d": "How to contact the Sumba Secrets team in Mamboro, Central Sumba: corrections, press, partnerships and trip questions.",
 "b": """<p>Sumba Secrets is made by a small team based in Mamboro, on the north coast of Central Sumba, Indonesia. We read every message.</p>
<h2>Email</h2>
<p><b>info@ecobeachcity.com</b>. Please include the link to the page you are writing about.</p>
<h2>What to write to us about</h2>
<ul><li><b>Corrections:</b> a wrong pin, a closed road, a place that has changed.</li>
<li><b>Press and creators:</b> maps, data and photos you can use are explained on """ + GD("use-our-maps", "use our maps and data") + """.</li>
<li><b>Local guides and community projects</b> that want to be mentioned. We never charge for this.</li>
<li><b>Trip questions:</b> we answer when we can, and the best answers become new guides.</li></ul>
<h2>Where we are</h2>
<p>Mamboro, Central Sumba (Sumba Tengah), East Nusa Tenggara, Indonesia. See """ + GD("central-sumba-guide", "our guide to Central Sumba") + """.</p>"""},
{"s": "privacy-policy", "img": "walakiri-beach", "info": 1,
 "t": "Privacy policy and legal notice",
 "d": "What data Sumba Secrets collects, why, and your rights. Short, plain and complete.",
 "b": """<p>This page explains, in plain words, what happens to your data when you use sumbasecrets.com.</p>
<h2>Who is responsible</h2>
<p>Sumba Secrets is published by Eco Beach City, Mamboro, Central Sumba, Indonesia. Contact: info@ecobeachcity.com.</p>
<h2>What we collect</h2>
<ul><li><b>Saved places and routes</b> stay in your own browser (local storage). We do not receive them.</li>
<li><b>Newsletter:</b> if you subscribe we store your email address and language, only to send the newsletter. Every email has an unsubscribe link.</li>
<li><b>Error reports and tips</b> you send through forms: the text you write and, if you give it, your email.</li>
<li><b>Statistics:</b> anonymous, aggregated visit counts to understand which pages help people. We do not sell data and we do not build advertising profiles.</li>
<li><b>Location:</b> the "near me" button uses your position only inside your browser to sort places by distance. It is never sent to us.</li></ul>
<h2>Third parties</h2>
<p>Map tiles are loaded from Esri, photos from Wikimedia Commons through our own image server, and weather from Open-Meteo. These services receive your IP address as part of a normal web request.</p>
<h2>Your rights</h2>
<p>You can ask us at any time to see, correct or delete the data we hold about you by writing to info@ecobeachcity.com.</p>
<h2>Content and liability</h2>
<p>We check our information carefully, but roads, tides and local rules change. Use your own judgement, follow local advice and respect the communities you visit.</p>"""},
{"s": "use-our-maps", "img": "mandorak-beach", "info": 1,
 "t": "Use our maps, data and embed",
 "d": "Free map embed, KML and GPX downloads of every Sumba place, and how to credit Sumba Secrets.",
 "b": """<p>Bloggers, journalists, schools and local businesses are welcome to use our map and data, for free, with a visible credit.</p>
<h2>Embed the interactive map</h2>
<p>Copy this code into your page:</p>
<pre>&lt;iframe src="https://sumbasecrets.com/embed/map?l=en" width="100%" height="480" style="border:0" loading="lazy" title="Map of Sumba"&gt;&lt;/iframe&gt;</pre>
<p>Change <b>l=en</b> to your language code (es, id, de, fr, nl, it, pt, ru, zh, ja, ko).</p>
<h2>Download every place</h2>
<ul><li><a href="/sumba-places.kml">KML file</a> for Google Earth and Google My Maps.</li>
<li><a href="/sumba-places.gpx">GPX file</a> for offline map apps such as Organic Maps or Maps.me.</li></ul>
<h2>How to credit us</h2>
<p>Please write "Map and data: Sumba Secrets" with a link to https://sumbasecrets.com. Photos keep the licence and author shown under each image; most are from Wikimedia Commons.</p>
<h2>Press</h2>
<p>For interviews, data or fact checks write to info@ecobeachcity.com. See also our """ + GD("sumba-in-numbers", "Sumba in numbers") + """ page, with sources.</p>"""},
# ---------------- content guides ----------------
{"s": "sumba-trip-cost", "img": "weekuri-lagoon",
 "t": "How much does a trip to Sumba cost? A realistic budget breakdown",
 "d": "What you will actually spend money on in Sumba: flights, transport, rooms, food, entry donations and guides, and how to keep costs down.",
 "b": """<p>Sumba is not a cheap island to travel around, even though daily life there is modest. The reason is simple: distances are long, there is almost no public transport for visitors, and most travellers hire a car with a driver. This guide explains where the money goes so you can build your own budget. We do not quote exact prices because they change every season; ask for quotes before you go.</p>
<h2>The four big costs</h2>
<ul><li><b>Flights.</b> Most people fly from Bali to """ + GD("tambolaka-airport", "Tambolaka") + """ or """ + GD("waingapu-airport", "Waingapu") + """. Fares depend heavily on the season and how early you book. Holiday periods in Indonesia and the European summer are the most expensive.</li>
<li><b>Ground transport.</b> Usually the biggest single cost. A car with a driver is charged per day, and fuel may or may not be included. Splitting a car between three or four people changes the budget completely. See """ + GD("hire-a-driver-sumba", "hiring a driver") + """ and """ + GD("rent-scooter-car-sumba", "renting a scooter or car") + """.</li>
<li><b>Rooms.</b> The range is enormous, from simple homestays in towns to some of the most expensive resorts in Indonesia. There is very little in between in remote areas.</li>
<li><b>Food.</b> Local warung meals are inexpensive. Western food in tourist areas costs several times more.</li></ul>
<h2>Small costs that add up</h2>
<ul><li><b>Entry donations</b> at traditional villages, beaches and waterfalls, usually paid to a local family or the village. Carry small notes.</li>
<li><b>Local guides</b> at villages and waterfalls. Worth it, and it supports the community.</li>
<li><b>Parking and boys who help</b> at beaches and viewpoints.</li>
<li><b>SIM card and data</b>, see """ + GD("money-atms-sim-sumba", "money, ATMs and SIM cards") + """.</li>
<li><b>Ceremonies:</b> if you are invited, a small gift is expected. Ask your guide what is appropriate.</li></ul>
<h2>How to spend less</h2>
<ul><li>Travel in the shoulder months (April to June, September and October), see """ + GD("best-time-weather", "the best time to visit") + """.</li>
<li>Stay in one region at a time instead of crossing the island every day. Use the """ + MAP + """ to group nearby places.</li>
<li>Share a car with other travellers.</li>
<li>Eat where locals eat.</li>
<li>Fly into one airport and out of the other to avoid driving back across the island.</li></ul>
<h2>Cash</h2>
<p>Cards are accepted only in a few hotels and shops. Plan to pay almost everything in cash, and withdraw it in Tambolaka, Waikabubak, Waibakul or Waingapu before heading to the coast.</p>""",
 "faq": [["Is Sumba expensive?", "Daily life is modest, but transport is expensive for visitors because distances are long and most people hire a car with a driver. Sharing a car is the biggest saving."],
         ["Do I need cash in Sumba?", "Yes. Most places only take cash. Withdraw money in the main towns before going to the coast or villages."]]},
{"s": "rent-scooter-car-sumba", "img": "wairinding-hill",
 "t": "Renting a scooter or a car in Sumba: what to know",
 "d": "Scooter or car with driver? Roads, licences, fuel, safety and the questions to ask before you rent anything in Sumba.",
 "b": """<p>There is no train, almost no public bus for visitors, and ride-hailing apps are unreliable outside the towns. So in Sumba you choose between three options: a scooter you ride yourself, a car you drive yourself, or a car with a driver.</p>
<h2>Car with driver</h2>
<p>This is what most visitors do, and for good reason. Drivers know which roads are passable after rain, where to buy fuel, and how to behave in villages. Many also act as informal guides and translators. See our """ + GD("hire-a-driver-sumba", "guide to hiring a driver") + """.</p>
<h2>Scooter</h2>
<ul><li>Good for short trips around a base such as Waikabubak, Tambolaka or Waingapu.</li>
<li>Long distances on a scooter are tiring and the main roads carry trucks.</li>
<li>Some beach and waterfall tracks are steep, rocky or muddy. Do not ride them if you are not experienced.</li>
<li>Always wear a helmet. Indonesian law requires it and medical care far from towns is limited.</li></ul>
<h2>Self-drive car</h2>
<p>Possible but less common. Cars are usually rented through guesthouses or local contacts rather than international companies. Driving is on the left. At night roads are dark, unmarked and shared with animals, so plan to arrive before sunset.</p>
<h2>Licences and insurance</h2>
<p>To ride or drive legally you need a licence valid for that vehicle plus an International Driving Permit. Check your travel insurance: many policies do not cover scooter accidents without the correct licence.</p>
<h2>Fuel</h2>
<p>Petrol stations are in the towns. In villages fuel is sold in bottles at roadside stalls. Fill up whenever you pass a station.</p>
<h2>Questions to ask before renting</h2>
<ul><li>Is fuel included, and is the driver's food and room included on multi-day trips?</li>
<li>What happens if the vehicle breaks down far from town?</li>
<li>Are there extra charges for East Sumba or very rough roads?</li>
<li>Take photos of the vehicle before you leave.</li></ul>"""},
{"s": "sumba-ikat-weaving", "img": "prailiu-village",
 "t": "Sumba ikat: how the island's famous textiles are made and where to see them",
 "d": "Hinggi and lau cloths, natural dyes, motifs and meaning, and how to buy Sumba ikat fairly from the weavers.",
 "b": """<p>Sumba ikat is one of the best known textile traditions in Indonesia. The cloths are not souvenirs made for tourists: they are exchanged at weddings and funerals, worn at ceremonies and wrapped around the dead. A single large piece can take many months of work.</p>
<h2>What ikat means</h2>
<p>Ikat comes from the Indonesian word for "to tie". Before weaving, bundles of thread are tied tightly in a pattern and dyed. The tied parts resist the dye. The process is repeated for each colour, and only then is the cloth woven, so the pattern appears as the threads cross.</p>
<h2>Hinggi and lau</h2>
<ul><li><b>Hinggi</b> are large cloths traditionally worn by men, as a wrap and over the shoulder. East Sumba is especially famous for them.</li>
<li><b>Lau</b> are tubular skirts traditionally worn by women, sometimes decorated with beads or shells.</li></ul>
<h2>Natural dyes</h2>
<p>The classic colours are deep blue from indigo and red-brown from the root of the morinda (mengkudu) tree. Natural dyeing is slow and is one reason why authentic pieces are expensive. Cheaper cloths often use chemical dyes; both exist side by side today.</p>
<h2>Motifs</h2>
<p>Common motifs include horses, roosters, shrimps and lobsters, crocodiles, snakes, deer and human figures, often arranged symmetrically. Many motifs relate to status, clans and the ancestral world of """ + GD("marapu-religion-sumba", "Marapu") + """. Ask the weaver what a cloth represents: the answer is part of what you take home.</p>
<h2>Where to see weaving</h2>
<p>Weaving happens in many villages, especially in East Sumba around Waingapu, including """ + PL("prailiu-village", "Prailiu") + """ and the """ + PL("praiyawang-rende", "Rende") + """ area, and in West Sumba villages such as """ + PL("tarung-village", "Tarung") + """ and """ + PL("prai-ijing", "Prai Ijing") + """. See all villages on the """ + MAP + """.</p>
<h2>Buying fairly</h2>
<ul><li>Buy directly from the weaver or a family when you can.</li>
<li>Ask whether the dyes are natural or chemical; the price should reflect it.</li>
<li>Do not bargain aggressively. A large hand-tied cloth represents months of work.</li>
<li>Very old cloths may be family heirlooms. Do not pressure people to sell them.</li></ul>"""},
{"s": "indonesian-phrases-sumba", "img": "ratenggaro",
 "t": "Useful Indonesian phrases for travelling in Sumba",
 "d": "The Indonesian words that actually help in Sumba: greetings, directions, food, prices and polite village etiquette.",
 "b": """<p>Very few people in rural Sumba speak English. Everyone speaks their local language, and almost everyone also speaks Indonesian (Bahasa Indonesia). A few words of Indonesian change how people respond to you. Sumba has several local languages too, see """ + GD("languages-of-sumba", "languages of Sumba") + """.</p>
<h2>Greetings and politeness</h2>
<table><thead><tr><th>English</th><th>Indonesian</th></tr></thead><tbody>
<tr><td>Good morning</td><td>Selamat pagi</td></tr><tr><td>Good afternoon (around midday)</td><td>Selamat siang</td></tr><tr><td>Good late afternoon</td><td>Selamat sore</td></tr><tr><td>Good evening</td><td>Selamat malam</td></tr>
<tr><td>Thank you</td><td>Terima kasih</td></tr><tr><td>You're welcome</td><td>Sama-sama</td></tr><tr><td>Excuse me / sorry</td><td>Permisi / Maaf</td></tr><tr><td>Yes / No</td><td>Ya / Tidak</td></tr>
<tr><td>What is your name?</td><td>Siapa nama Anda?</td></tr><tr><td>My name is...</td><td>Nama saya...</td></tr></tbody></table>
<h2>Directions</h2>
<table><thead><tr><th>English</th><th>Indonesian</th></tr></thead><tbody>
<tr><td>Where is...?</td><td>Di mana...?</td></tr><tr><td>Beach</td><td>Pantai</td></tr><tr><td>Waterfall</td><td>Air terjun</td></tr><tr><td>Village</td><td>Kampung / Desa</td></tr><tr><td>Hill</td><td>Bukit</td></tr>
<tr><td>Left / Right / Straight</td><td>Kiri / Kanan / Lurus</td></tr><tr><td>Far / Near</td><td>Jauh / Dekat</td></tr><tr><td>Petrol station</td><td>Pom bensin</td></tr></tbody></table>
<h2>Food and shopping</h2>
<table><thead><tr><th>English</th><th>Indonesian</th></tr></thead><tbody>
<tr><td>How much?</td><td>Berapa harganya?</td></tr><tr><td>Water</td><td>Air (mineral)</td></tr><tr><td>Rice / fried rice / fried noodles</td><td>Nasi / nasi goreng / mie goreng</td></tr><tr><td>Not spicy</td><td>Tidak pedas</td></tr><tr><td>Delicious</td><td>Enak</td></tr><tr><td>The bill, please</td><td>Minta bon</td></tr></tbody></table>
<h2>In a village</h2>
<table><thead><tr><th>English</th><th>Indonesian</th></tr></thead><tbody>
<tr><td>May I take a photo?</td><td>Boleh saya foto?</td></tr><tr><td>May I come in?</td><td>Boleh saya masuk?</td></tr><tr><td>Where do I pay the donation?</td><td>Di mana saya bayar sumbangan?</td></tr><tr><td>Beautiful</td><td>Indah / Cantik</td></tr></tbody></table>
<p>Read our """ + GD("respect-etiquette", "guide to respect and etiquette") + """ before visiting villages.</p>"""},
{"s": "sumba-glossary", "img": "tarung-village",
 "t": "Sumba glossary: words you will hear on the island",
 "d": "Marapu, kabisu, rato, uma, pasola, ikat, kampung, wulla poddu and more, explained simply.",
 "b": """<p>A short glossary of words that come up again and again when you travel in Sumba. Spellings vary between local languages and sources.</p>
<h2>Belief and society</h2>
<ul><li><b>Marapu:</b> the ancestral religion of Sumba, centred on the spirits of ancestors who mediate between people and the divine. See """ + GD("marapu-religion-sumba", "Marapu religion") + """.</li>
<li><b>Rato:</b> a priest or ritual leader in the Marapu tradition. Rato also play a central role in the Pasola.</li>
<li><b>Kabisu:</b> a clan, the basic social unit, linked to a founding ancestor and an ancestral village.</li>
<li><b>Umbu and Rambu:</b> respectful titles used in East Sumba before the names of men (Umbu) and women (Rambu) of noble families.</li>
<li><b>Belis:</b> bride wealth, traditionally paid in horses, buffalo, cloth and other valuables.</li></ul>
<h2>Villages and houses</h2>
<ul><li><b>Kampung / paraingu:</b> a traditional village, often on a hilltop, with houses around a central area of stone tombs.</li>
<li><b>Uma:</b> house. The tall peaked roof (uma mbatangu in East Sumba) holds sacred heirlooms. See """ + GD("sumba-traditional-houses", "traditional houses") + """.</li>
<li><b>Megalith / kubur batu:</b> stone tombs, some weighing many tonnes. See """ + GD("sumba-megalithic-tombs", "megalithic tombs") + """.</li></ul>
<h2>Events</h2>
<ul><li><b>Pasola:</b> ritual mounted spear-throwing contest in West and Southwest Sumba, usually in February and March. See """ + GD("pasola-dates", "Pasola dates") + """.</li>
<li><b>Wulla poddu:</b> the "bitter month" of the Marapu calendar in parts of West Sumba, usually between October and December, a sacred period with special rules.</li>
<li><b>Nyale:</b> sea worms that appear on the shore around the Pasola; their arrival is read by the rato as a sign.</li></ul>
<h2>Everyday words</h2>
<ul><li><b>Ikat:</b> tie-dyed woven cloth. See """ + GD("sumba-ikat-weaving", "Sumba ikat") + """.</li>
<li><b>Sirih pinang:</b> betel leaf and areca nut, offered to guests as a sign of welcome.</li>
<li><b>Kuda Sandelwood:</b> the Sumba sandalwood pony. See """ + GD("sumba-horses", "horses of Sumba") + """.</li>
<li><b>Warung:</b> small local eatery or shop.</li></ul>"""},
{"s": "hiking-sumba", "img": "wairinding-hill",
 "t": "Hiking and walking in Sumba: hills, savannah and waterfall trails",
 "d": "The best walks in Sumba, from the Wairinding savannah to waterfall trails and the forests of the national parks, with season and safety tips.",
 "b": """<p>Sumba is not a classic trekking destination with marked multi-day trails, but it is wonderful for short walks: rolling savannah hills, river valleys, waterfalls hidden in forest and hilltop villages reached on foot.</p>
<h2>Savannah hills of East Sumba</h2>
<p>""" + PL("wairinding-hill", "Wairinding Hill") + """ is the most famous: grassy hills that turn green in the wet season and golden in the dry. You can wander freely along the ridges. Go at sunrise or late afternoon for soft light and cooler air. Local children often act as guides and expect a small tip.</p>
<h2>Waterfall walks</h2>
<ul><li>""" + PL("tanggedu-waterfall", "Tanggedu") + """ in East Sumba involves a hot walk across open country and a scramble down to the river.</li>
<li>""" + PL("lapopu-waterfall", "Lapopu") + """ in West Sumba is reached by a shorter path in the forest of Manupeu Tanah Daru.</li>
<li>""" + PL("weekacura-waterfall", "Weekacura") + """ and others are listed in our """ + GD("sumba-waterfalls", "waterfalls guide") + """.</li></ul>
<h2>National parks</h2>
<p>Sumba has two national parks with the island's largest remaining forests, rich in birds. See """ + GD("sumba-national-parks-birds", "national parks and birdwatching") + """.</p>
<h2>Village walks</h2>
<p>Walking between neighbouring villages with a local guide is one of the best ways to understand the island. Always ask permission and follow """ + GD("respect-etiquette", "village etiquette") + """.</p>
<h2>Season and safety</h2>
<ul><li>The dry season (roughly May to October) has firmer paths but strong sun and little shade. Carry more water than you think.</li>
<li>In the wet season tracks get slippery and rivers can rise quickly. Do not cross fast-flowing water.</li>
<li>Wear proper shoes, a hat and sunscreen. Tell someone where you are going.</li>
<li>Phone coverage is patchy away from towns.</li></ul>""",
 "faq": [["Can you hike Wairinding Hill on your own?", "Yes, the hills are open and easy to walk. Local children often offer to guide you for a small tip."]]},
{"s": "sumba-events-calendar", "img": "ratenggaro",
 "t": "Sumba events calendar: festivals, rituals and holidays month by month",
 "d": "When the Pasola, Wulla Poddu, national holidays and the dry and wet seasons fall in Sumba, and how to plan around them.",
 "b": """<p>Many of Sumba's most important events follow the traditional Marapu calendar, which is based on moon phases and the readings of ritual leaders, not on fixed dates. Use this calendar as a guide and confirm locally.</p>
<h2>February and March: Pasola</h2>
<p>The Pasola, the famous ritual mounted spear-throwing contest, takes place in West and Southwest Sumba, in Kodi, Lamboya, Wanokaka and Gaura. The exact day depends on the arrival of the nyale sea worms on the shore. See """ + GD("pasola-dates", "Pasola dates and how to attend") + """.</p>
<h2>April to June: end of the rains</h2>
<p>The countryside is still green and the roads are drying out. A very good time for photography and waterfalls. See """ + GD("best-time-weather", "best time to visit") + """.</p>
<h2>17 August: Independence Day</h2>
<p>Indonesia's national day is celebrated in every town and village with flag ceremonies, parades and games. Offices close and transport is busier.</p>
<h2>October to December: Wulla Poddu</h2>
<p>In parts of West Sumba, especially around Waikabubak in villages such as """ + PL("tarung-village", "Tarung") + """ and """ + PL("prai-ijing", "Prai Ijing") + """, the Marapu community observes Wulla Poddu, the "bitter month", a sacred period of about a month with strict rules. Some ceremonies are open to respectful visitors with a guide, others are not.</p>
<h2>December: Christmas</h2>
<p>Most people in Sumba today are Christian. Christmas and New Year are major family holidays and many people travel home.</p>
<h2>Funerals and weddings, all year</h2>
<p>Traditional funerals can last days and may include animal sacrifices and the dragging of tomb stones. If you are invited, go with a guide, dress modestly and bring a small gift.</p>
<p>See every month in detail: start with our month pages from the """ + GD("sumba-weather-by-month", "weather by month guide") + """.</p>"""},
{"s": "sumba-on-a-budget", "img": "pero-beach",
 "t": "Sumba on a budget: backpacking tips that really work",
 "d": "How to travel Sumba with little money: where to base yourself, sharing transport, local food and free places worth visiting.",
 "b": """<p>Sumba has a reputation as a luxury island because of a few famous resorts. But most of the island is rural and simple, and you can travel it on a modest budget if you plan around one problem: transport.</p>
<h2>Pick one or two bases</h2>
<p>Instead of crossing the island every day, base yourself in one region. Waikabubak works well for the villages of West Sumba, Tambolaka for the Kodi coast, and Waingapu for East Sumba. Each has simple guesthouses, markets and transport.</p>
<h2>Share the car</h2>
<p>A car with a driver costs the same for one person or four. Ask at your guesthouse if other travellers want to share a day trip.</p>
<h2>Eat local</h2>
<p>Warung meals of rice with vegetables, fish or chicken are filling and cheap. Markets sell fresh fruit. Bring a refillable bottle; many guesthouses refill water. See """ + GD("food-in-sumba", "food in Sumba") + """.</p>
<h2>Places that cost little or nothing</h2>
<ul><li>Many beaches only ask for a small parking fee or donation, for example """ + PL("pero-beach", "Pero") + """ and """ + PL("walakiri-beach", "Walakiri") + """.</li>
<li>Savannah viewpoints such as """ + PL("wairinding-hill", "Wairinding") + """.</li>
<li>Town markets in Waikabubak and Waingapu.</li></ul>
<h2>Time is cheaper than money</h2>
<p>Travelling slowly is the best way to spend less: fewer long drives, more time in one area, and better relationships with local people who can point you to places that are not on any map. Plan your days with the """ + MAP + """.</p>
<h2>Safety on a budget</h2>
<p>Do not save money on helmets, travel insurance or water. Read """ + GD("is-sumba-safe", "is Sumba safe") + """.</p>"""},
{"s": "central-sumba-guide", "img": "wairinding-hill",
 "t": "Central Sumba (Sumba Tengah): the least visited part of the island",
 "d": "A guide to Central Sumba: Waibakul, Anakalang's megaliths, the north coast around Mamboro and how to get there.",
 "b": """<p>Central Sumba (Sumba Tengah) is the smallest regency by population and the one most travellers drive straight through on the way between east and west. That is a pity: it has some of the island's most impressive megaliths, quiet villages and an almost untouched north coast.</p>
<h2>In brief</h2>
<ul><li><b>Capital:</b> Waibakul.</li>
<li><b>Population:</b> about 94,000 (BPS estimate, mid 2025).</li>
<li><b>Created:</b> 2007, from parts of West and East Sumba.</li>
<li><b>North coast:</b> the Mamboro area, with a small port, long beaches and fishing villages.</li></ul>
<h2>Anakalang and the megaliths</h2>
<p>The Anakalang area near Waibakul is known for large stone tombs, some carved, standing in village squares. See """ + GD("sumba-megalithic-tombs", "megalithic tombs of Sumba") + """.</p>
<h2>Mamboro and the north coast</h2>
<p>The coast north of Waibakul is quiet and rarely visited, with beaches, mangroves and villages where daily life goes on as it always has. We live here, and we have mapped the ten best places in our <a href="/{l}/mamboro/">Mamboro top 10</a>.</p>
<h2>Getting there</h2>
<p>Central Sumba lies between the two airports: roughly halfway between """ + GD("tambolaka-airport", "Tambolaka") + """ and """ + GD("waingapu-airport", "Waingapu") + """. The main trans-Sumba road passes through Waibakul.</p>
<h2>Why stop here</h2>
<ul><li>Break up the long drive across the island.</li>
<li>See villages and tombs without crowds.</li>
<li>Combine savannah, coast and culture in a single day.</li></ul>"""},
{"s": "sumba-history", "img": "tarung-village",
 "t": "A short history of Sumba",
 "d": "From megalith builders and the sandalwood trade to Dutch rule, independence and tourism: the story of Sumba in a few minutes.",
 "b": """<p>Sumba's history is told less in written records than in stone tombs, clan genealogies and the cloths and rituals passed down through generations. This is a short overview.</p>
<h2>Ancestors and clans</h2>
<p>Sumbanese oral traditions trace each clan (kabisu) to founding ancestors who arrived by sea. Society was organised in domains led by noble families, with priests (rato) responsible for the ritual calendar. The tradition of building megalithic tombs continues to this day, which is rare anywhere in the world.</p>
<h2>Sandalwood and horses</h2>
<p>For centuries Sumba was known to traders as a source of sandalwood, and later of horses. The Sumba "sandalwood pony" became famous across the archipelago. See """ + GD("sumba-horses", "horses of Sumba") + """.</p>
<h2>Colonial period</h2>
<p>The Dutch East India Company and later the Dutch colonial state claimed Sumba, but effective control of the interior came late, in the early twentieth century. Christian missions became active in the same period.</p>
<h2>Independence</h2>
<p>After Indonesian independence Sumba became part of the province of East Nusa Tenggara (Nusa Tenggara Timur). In 2007 the island was divided into the four regencies it has today. See """ + GD("sumba-regencies", "the four regencies of Sumba") + """.</p>
<h2>Today</h2>
<p>Most Sumbanese are now Christian, while Marapu remains alive, especially in West Sumba. Tourism has grown since the 2010s, still on a small scale compared with Bali. Read about """ + GD("marapu-religion-sumba", "Marapu") + """ and about """ + GD("traditional-villages-sumba", "traditional villages") + """.</p>
<h2>Further reading</h2>
<p>See our list of """ + GD("books-films-sumba", "books and films about Sumba") + """.</p>"""},
{"s": "sumba-regencies", "img": "walakiri-beach",
 "t": "The four regencies of Sumba explained",
 "d": "West Sumba, Southwest Sumba, Central Sumba and East Sumba: capitals, size, population and what each is known for.",
 "b": """<p>Sumba is divided into four regencies (kabupaten), each with its own capital and character. The figures below are official BPS estimates for mid 2025 unless stated otherwise.</p>
<table><thead><tr><th>Regency</th><th>Capital</th><th>Area</th><th>Known for</th></tr></thead><tbody>
<tr><td>Southwest Sumba (Sumba Barat Daya)</td><td>Tambolaka</td><td>about 1,445 km²</td><td>Main airport, Kodi coast, Weekuri Lagoon, Pasola</td></tr>
<tr><td>West Sumba (Sumba Barat)</td><td>Waikabubak</td><td>about 737 km²</td><td>Traditional villages, Marapu, Lapopu, Wanokaka</td></tr>
<tr><td>Central Sumba (Sumba Tengah)</td><td>Waibakul</td><td>about 1,790 km²</td><td>Anakalang megaliths, Mamboro north coast</td></tr>
<tr><td>East Sumba (Sumba Timur)</td><td>Waingapu</td><td>about 7,000 km²</td><td>Savannah, Wairinding, ikat, Walakiri</td></tr></tbody></table>
<h2>West and Southwest: green and traditional</h2>
<p>The west is wetter and greener, with rice fields and the strongest Marapu traditions. West Sumba is small but densely populated, with about 160,000 people. Explore """ + GD("traditional-villages-sumba", "traditional villages") + """.</p>
<h2>Central: in between</h2>
<p>Central Sumba was created in 2007 and has fewer than 100,000 inhabitants. See """ + GD("central-sumba-guide", "Central Sumba guide") + """.</p>
<h2>East: dry and wide</h2>
<p>East Sumba covers more than half the island, with savannah, long beaches and the town of Waingapu, the largest on the island. See """ + GD("east-vs-west-sumba", "East vs West Sumba") + """.</p>"""},
{"s": "books-films-sumba", "img": "ratenggaro",
 "t": "Books and films about Sumba",
 "d": "The best reading and watching before a trip to Sumba: anthropology classics, a celebrated Indonesian film and practical resources.",
 "b": """<p>Few books are written about Sumba, but some of the best are excellent. This short list mixes academic classics and films you can watch before you go.</p>
<h2>Books</h2>
<ul><li><b>Janet Hoskins, "The Play of Time: Kodi Perspectives on Calendars, History, and Exchange" (1993).</b> A classic study of the Kodi region of West Sumba, its calendar, rituals and memory.</li>
<li><b>Webb Keane, "Signs of Recognition: Powers and Hazards of Representation in an Indonesian Society" (1997).</b> Based on fieldwork in Anakalang, Central Sumba, about ritual speech and exchange.</li>
<li><b>Janet Hoskins, "Biographical Objects: How Things Tell the Stories of People's Lives" (1998).</b> Uses Kodi objects such as cloths and betel bags to tell life stories.</li></ul>
<h2>Films</h2>
<ul><li><b>"Marlina the Murderer in Four Acts" (2017), directed by Mouly Surya.</b> An acclaimed Indonesian film shot in the savannah of East Sumba. Its landscapes alone are worth it.</li></ul>
<h2>On this site</h2>
<p>Start with our """ + GD("sumba-history", "short history of Sumba") + """, """ + GD("marapu-religion-sumba", "Marapu") + """ and the """ + GD("sumba-glossary", "Sumba glossary") + """.</p>"""},
{"s": "languages-of-sumba", "img": "prai-ijing",
 "t": "Languages of Sumba: Kambera, Kodi, Wewewa and more",
 "d": "Sumba has several local languages besides Indonesian. Where each is spoken, and what it means for travellers.",
 "b": """<p>Sumba is a small island with surprising linguistic variety. Almost everyone speaks Indonesian as well, but at home and in ritual people use their own language.</p>
<h2>The main languages</h2>
<ul><li><b>Kambera:</b> the language of East Sumba, with the most speakers on the island.</li>
<li><b>Wewewa:</b> spoken in Southwest Sumba, around Tambolaka and Waitabula.</li>
<li><b>Kodi:</b> spoken in the far west, around the Kodi coast and Ratenggaro.</li>
<li><b>Loli, Lamboya and Wanokaka:</b> spoken around Waikabubak and the south coast of West Sumba.</li>
<li><b>Anakalang:</b> spoken in Central Sumba around Waibakul.</li>
<li><b>Mamboru:</b> spoken on the north coast of Central Sumba around Mamboro.</li></ul>
<h2>Ritual speech</h2>
<p>Marapu ceremonies use a special formal speech of paired lines and parallel phrases, recited by experienced speakers. It is one of the island's great oral arts.</p>
<h2>What this means for you</h2>
<p>Learn some Indonesian: it works everywhere. See our """ + GD("indonesian-phrases-sumba", "useful Indonesian phrases") + """. A greeting in the local language, taught to you by your guide, always gets a smile.</p>"""},
{"s": "sumba-in-numbers", "img": "weekuri-lagoon",
 "t": "Sumba in numbers: population, size and key facts",
 "d": "Population, area, highest point, regencies and other key facts about Sumba, with sources.",
 "b": """<p>Quick facts about Sumba with their sources. Figures from BPS (Badan Pusat Statistik, Indonesia's statistics office) are official estimates.</p>
<table><thead><tr><th>Fact</th><th>Figure</th><th>Source</th></tr></thead><tbody>
<tr><td>Population</td><td>about 850,000 (mid 2025 estimate)</td><td>BPS</td></tr>
<tr><td>Population at the 2020 census</td><td>about 779,000</td><td>BPS census 2020</td></tr>
<tr><td>Area</td><td>about 11,000 km² (sources differ slightly)</td><td>BPS, regional data</td></tr>
<tr><td>Highest point</td><td>Mount Wanggameti, about 1,225 m</td><td>Regional data</td></tr>
<tr><td>Regencies</td><td>4 (since 2007)</td><td>Indonesian law</td></tr>
<tr><td>Largest regency</td><td>East Sumba, about 7,000 km²</td><td>BPS</td></tr>
<tr><td>Largest town</td><td>Waingapu</td><td>BPS</td></tr>
<tr><td>Province</td><td>East Nusa Tenggara (capital Kupang, on Timor)</td><td></td></tr>
<tr><td>Time zone</td><td>WITA, UTC+8, same as Bali</td><td></td></tr>
<tr><td>Airports</td><td>Tambolaka (TMC) and Waingapu (WGP)</td><td></td></tr>
<tr><td>Places on our map</td><td>""" + str(len(_P) + len(_M)) + """</td><td>Sumba Secrets</td></tr></tbody></table>
<h2>Size comparison</h2>
<p>Sumba is roughly twice the size of Bali, with a fraction of its population and visitors.</p>
<h2>Using these figures</h2>
<p>Journalists and bloggers may use this table with a link to this page. See """ + GD("use-our-maps", "use our maps and data") + """ and """ + GD("sumba-regencies", "the four regencies") + """.</p>"""},
{"s": "sumba-facts", "img": "mandorak-beach",
 "t": "20 surprising facts about Sumba",
 "d": "Living megalithic culture, sandalwood ponies, the Pasola, twice the size of Bali: things most visitors do not know about Sumba.",
 "b": """<p>Some things about Sumba surprise almost every first-time visitor.</p>
<h2>Culture</h2>
<ol><li>Sumba is one of the very few places in the world where people still build megalithic stone tombs.</li>
<li>Marapu, the ancestral religion, is still practised, especially in West Sumba.</li>
<li>The Pasola, a ritual battle on horseback with wooden spears, is timed by the arrival of sea worms on the beach.</li>
<li>The tall peaked roofs of traditional houses store sacred heirlooms and are thought of as the dwelling of ancestral spirits.</li>
<li>Ikat cloths are used as currency of respect at weddings and funerals.</li>
<li>Bride wealth can still be counted in horses and buffalo.</li>
<li>The island has several local languages, see """ + GD("languages-of-sumba", "languages of Sumba") + """.</li></ol>
<h2>Nature</h2>
<ol start="8"><li>Sumba is about twice the size of Bali.</li>
<li>East Sumba is mostly savannah, with a landscape more like Africa than the Indonesia of postcards.</li>
<li>West Sumba is much greener and wetter than the east.</li>
<li>The island has two national parks with endemic birds.</li>
<li>The Sumba sandalwood pony is famous across Indonesia.</li>
<li>""" + PL("weekuri-lagoon", "Weekuri Lagoon") + """ is a saltwater lagoon fed by the sea through the rocks.</li>
<li>""" + PL("walakiri-beach", "Walakiri") + """ is known for mangrove trees that look like they are dancing at sunset.</li></ol>
<h2>Travel</h2>
<ol start="15"><li>Sumba has two airports, one in the west and one in the east.</li>
<li>Crossing the island by road takes most of a day.</li>
<li>Most people are Christian today.</li>
<li>The island is on the same time as Bali.</li>
<li>Cash is still king.</li>
<li>Sumba is rarely crowded, even in high season.</li></ol>
<p>See it all on the """ + MAP + """.</p>"""},
{"s": "sumba-quick-answers", "img": "pero-beach",
 "t": "Sumba quick answers: Grab, ATMs, visas, Wi-Fi and other common questions",
 "d": "Short, direct answers to the questions travellers ask most about Sumba before they go.",
 "b": """<p>Short answers to the questions we hear most. Each links to a longer guide.</p>
<h2>Transport</h2>
<p><b>Is there Grab or Gojek in Sumba?</b> Ride-hailing apps are not dependable on the island, especially outside towns. Arrange a driver. See """ + GD("hire-a-driver-sumba", "hiring a driver") + """.</p>
<p><b>Is there public transport?</b> Local minibuses (bemo) and trucks run between towns, but they are slow and not practical for sightseeing.</p>
<p><b>How do I get to Sumba?</b> Usually by plane from Bali. See """ + GD("bali-to-sumba", "Bali to Sumba") + """ and """ + GD("ferry-to-sumba", "ferries to Sumba") + """.</p>
<h2>Money and connectivity</h2>
<p><b>Are there ATMs?</b> Yes, in the main towns. Not on the coast or in villages. See """ + GD("money-atms-sim-sumba", "money, ATMs and SIM") + """.</p>
<p><b>Is there mobile internet?</b> In towns and along main roads, yes. Coverage drops in remote areas.</p>
<h2>Entry and health</h2>
<p><b>Do I need a different visa for Sumba?</b> No. Sumba is part of Indonesia: the same entry rules as Bali apply. Check the official rules for your nationality before travelling.</p>
<p><b>Is there malaria?</b> Malaria is present in parts of eastern Indonesia, including Sumba. Ask a travel doctor before your trip and use mosquito protection. See """ + GD("health-safety", "health and safety") + """.</p>
<h2>Trip planning</h2>
<p><b>How many days do I need?</b> At least five to see the highlights of one side of the island; a week or more for both. See """ + GD("itinerary-7-days", "7-day itinerary") + """.</p>
<p><b>When is the best time?</b> The dry season, roughly May to October, with green landscapes in April and May. See """ + GD("best-time-weather", "best time to visit") + """.</p>
<p><b>Is Sumba safe?</b> Generally yes, with common sense. See """ + GD("is-sumba-safe", "is Sumba safe") + """.</p>
<h2>Property</h2>
<p><b>Can a foreigner buy a house or land in Sumba?</b> Not as freehold: Indonesian law reserves full ownership of land (hak milik) for Indonesian citizens. Foreigners use other legal titles, such as a right of use (hak pakai) or a long lease, and should always work with an Indonesian notary. RealHunt explains the rules and costs in its <a href="https://realhunt.co/guide/indonesia">guide to buying property in Indonesia</a> and <a href="https://realhunt.co/costs/indonesia">buying costs in Indonesia</a>; homes and land for sale on the island are listed on <a href="https://sumbahomes.com/">Sumba Homes</a>.</p>""",
 "faq": [["Is there Grab in Sumba?", "Ride-hailing apps are not dependable in Sumba, especially outside the towns. Most visitors arrange a car with a driver."],
         ["Do I need a separate visa for Sumba?", "No. Sumba is part of Indonesia, so the same entry rules as Bali apply."],
         ["Are there ATMs in Sumba?", "Yes, in the main towns such as Tambolaka, Waikabubak, Waibakul and Waingapu, but not on the coast or in villages."],
         ["Can a foreigner buy property in Sumba?", "Not as freehold. Full land ownership (hak milik) is reserved for Indonesian citizens; foreigners use other titles such as a right of use (hak pakai) or a long lease, with an Indonesian notary."]]},
{"s": "responsible-travel-sumba", "img": "praiyawang-rende",
 "t": "Responsible travel in Sumba: how to visit without doing harm",
 "d": "Photos, donations, children, plastic, water and sacred places: simple rules for a trip that helps Sumba instead of hurting it.",
 "b": """<p>Tourism in Sumba is still small, and that is part of its magic. How visitors behave now will shape what the island becomes.</p>
<h2>In villages</h2>
<ul><li>Always ask before entering and before taking photos of people.</li>
<li>Pay the donation to the person or family the village indicates, not to whoever asks first.</li>
<li>Do not touch tombs, ritual objects or the posts of houses without permission.</li>
<li>See """ + GD("respect-etiquette", "respect and etiquette") + """.</li></ul>
<h2>Children</h2>
<p>Do not hand out sweets or money to children; it encourages begging and keeps children out of school. If you want to help, support a school or community project through a trusted organisation.</p>
<h2>Plastic and water</h2>
<p>Waste collection is limited. Bring a refillable bottle, refuse plastic bags, and take your rubbish back to town. Fresh water is scarce in the dry season, especially in East Sumba: use it carefully.</p>
<h2>Money that stays local</h2>
<ul><li>Hire local drivers and guides.</li>
<li>Buy ikat directly from weavers, see """ + GD("sumba-ikat-weaving", "Sumba ikat") + """.</li>
<li>Eat in local warung.</li></ul>
<h2>Nature</h2>
<p>Do not fly drones over villages or ceremonies without permission, see """ + GD("drones-photography-sumba", "drones and photography") + """. Stay on paths in the national parks and never buy shells, coral or wildlife.</p>"""},
{"s": "sumba-music-dance", "img": "ratenggaro",
 "t": "Music and dance in Sumba: gongs, the jungga and the Kataga war dance",
 "d": "The sounds of Sumba: gong and drum ensembles at ceremonies, the jungga lute, the Kataga war dance and women's dances, and how to experience them respectfully.",
 "b": """<p>In Sumba, music is rarely a show for visitors. It belongs to ceremonies: weddings, funerals, house raisings, harvests and the Pasola. If you are lucky enough to be invited to one, you will hear it at its best.</p>
<h2>Gongs and drums</h2>
<p>Sets of gongs and drums accompany most ceremonies, played in interlocking rhythms that can go on for hours. Their sound carries across the valleys and tells neighbouring villages that something important is happening.</p>
<h2>The jungga</h2>
<p>The jungga is a small plucked lute played by men, often in the evening, to accompany songs about love, longing and the ancestors. It is one of the most personal sounds of the island.</p>
<h2>Kataga, the war dance</h2>
<p>Kataga is a warrior dance performed by men with swords and shields, shouting and leaping in mock combat. It recalls the island's history of clan warfare and is performed at important ceremonies and celebrations.</p>
<h2>Women's dances</h2>
<p>Women dance in ikat cloth with ornaments such as the mamuli, a gold or metal pendant shaped like a stylised womb, a symbol of fertility and status. The movements are slow and graceful, often to the rhythm of gongs.</p>
<h2>Ritual speech and chant</h2>
<p>In Marapu ceremonies, specialists recite long chants in paired lines, a formal ritual language. See """ + GD("marapu-religion-sumba", "Marapu religion") + """ and """ + GD("languages-of-sumba", "languages of Sumba") + """.</p>
<h2>How to experience it</h2>
<ul><li>Ask your driver or guesthouse whether there is a ceremony nearby and whether visitors are welcome.</li>
<li>Go with a local guide, dress modestly and bring a small gift.</li>
<li>Ask before filming. Some moments are sacred.</li>
<li>See """ + GD("sumba-events-calendar", "the events calendar") + """ and """ + GD("respect-etiquette", "respect and etiquette") + """.</li></ul>"""},
{"s": "sumba-markets", "img": "prailiu-village",
 "t": "Markets in Sumba: what to see, eat and buy",
 "d": "Town and village markets in Sumba: when to go, what you will find, how to buy ikat and betel, and simple market etiquette.",
 "b": """<p>Markets are the easiest way to see everyday life in Sumba. People come from the villages to sell vegetables, fruit, fish, betel nut and cloth, and to meet friends.</p>
<h2>Town markets</h2>
<p>Each of the four main towns has a daily market: Waingapu, Waikabubak, Tambolaka and Waibakul. Mornings are the busiest and freshest time. Weekly markets are also held in some villages; ask locally which day.</p>
<h2>What you will find</h2>
<ul><li><b>Fruit and vegetables</b> from the island's farms, depending on the season.</li>
<li><b>Fish</b> from the coast, best early in the morning.</li>
<li><b>Sirih pinang</b>, betel leaf and areca nut, chewed by many adults and offered to guests.</li>
<li><b>Ikat cloth</b>, from simple pieces to fine hand-dyed cloths. See """ + GD("sumba-ikat-weaving", "Sumba ikat") + """.</li>
<li><b>Household goods</b>, machetes, baskets and plastic everything.</li></ul>
<h2>Eating at the market</h2>
<p>Simple stalls sell rice with side dishes, grilled fish and sweet snacks. Choose busy stalls where food is cooked fresh. See """ + GD("food-in-sumba", "food in Sumba") + """.</p>
<h2>Market etiquette</h2>
<ul><li>Ask before photographing people.</li>
<li>Bargain politely for cloth and souvenirs, not for food.</li>
<li>Carry small notes. Change can be hard to find.</li>
<li>Learn a few words, see """ + GD("indonesian-phrases-sumba", "useful Indonesian phrases") + """.</li></ul>"""},
]
