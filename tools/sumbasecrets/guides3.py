# 13-nov-2026 · Long-form guides built from the Google SERP study (see claude/sumbasecrets-seo-mapa-100.md in the Equinox project).
# Targets: "sumba travel guide", "things to do in sumba", "best beaches sumba", "bali to sumba", "sumba itinerary",
# "where to stay sumba", "marapu", "sumba waterfalls", "traditional villages sumba", "is sumba worth it" ...
# Rules: English source, other languages machine-translated at build time; no hotel names, no invented prices
# (only clearly labelled approximate ranges), no em dashes, link to our place pages with /{l}/place/<slug>/.
def A(s, l, t=None):
    return f'<a href="/{{l}}/{l}/{s}/">{t or s}</a>'
def PL(s, t): return f'<a href="/{{l}}/place/{s}/">{t}</a>'
def GD(s, t): return f'<a href="/{{l}}/guide/{s}/">{t}</a>'
MAP = '<a href="/{l}/map/">interactive map</a>'

GUIDES3 = [
{"s": "sumba-travel-guide", "img": "weekuri-lagoon", "t": "Sumba travel guide: everything you need to plan your trip",
 "d": "The complete guide to Sumba, Indonesia: when to go, how to get there from Bali, the four regions, what to see, costs, safety, etiquette and itineraries.",
 "faq": [
  ["Where is Sumba?", "Sumba is an island in East Nusa Tenggara, eastern Indonesia, south of Flores and about an hour's flight east of Bali. It is roughly twice the size of Bali."],
  ["How many days do you need in Sumba?", "Three days is enough for the west, five days lets you see the west and the east if you fly into one airport and out of the other, and a week or more lets you reach the remote south and north coasts."],
  ["What is the best time to visit Sumba?", "The dry season, roughly May to October, has the easiest roads and the most reliable weather. February and March are the months of the Pasola, and the hills are greenest from January to April."],
  ["Is Sumba safe for tourists?", "Sumba is generally calm and welcoming. The main risks are long drives on narrow roads, strong currents on the south coast and limited medical care, so travel insurance with evacuation cover is essential."],
  ["Do I need a guide in Sumba?", "Not by law, but a local driver-guide makes the trip much easier: public transport is very limited, signposting is poor and a guide can introduce you properly in traditional villages."],
  ["Is Sumba the same as Sumbawa?", "No. Sumbawa is a different island to the north-west, between Lombok and Flores. Sumba lies further south."]],
 "b": f"""<p>Sumba is the island people describe when they talk about the Indonesia of thirty years ago: rolling savanna with wild-looking horses, turquoise lagoons, empty beaches facing the Indian Ocean and villages of towering thatched houses where the ancestral Marapu religion is still alive. It is only about an hour's flight from Bali, yet it receives a tiny fraction of Bali's visitors. This guide gathers everything you need to plan a trip, and every place mentioned is on our {MAP}.</p>
<h2>Sumba at a glance</h2>
<ul><li><b>Where:</b> East Nusa Tenggara province, south of Flores and east of Sumbawa. Not to be confused with Sumbawa.</li><li><b>Size:</b> about 11,000 km², roughly twice Bali, with far fewer people.</li><li><b>Regions:</b> four regencies, Southwest Sumba (capital Tambolaka), West Sumba (Waikabubak), Central Sumba (Waibakul) and East Sumba (Waingapu).</li><li><b>Airports:</b> Tambolaka (TMC) in the west and Waingapu (WGP) in the east.</li><li><b>Language:</b> Indonesian everywhere, plus several Sumbanese languages. Little English outside hotels.</li><li><b>Money:</b> Indonesian rupiah, mostly cash.</li><li><b>Time zone:</b> Central Indonesia Time (WITA, UTC+8), the same as Bali.</li></ul>
<h2>Why visit Sumba</h2>
<p>Three things make Sumba different from almost anywhere else in Indonesia. First, its <b>living culture</b>: Marapu, the belief in ancestral spirits, still shapes daily life, from the shape of the houses to the huge stone tombs in front of them and the Pasola, a ritual contest on horseback. Second, its <b>landscapes</b>: the east is dry savanna and limestone hills, the west is greener, with rice terraces, forests and waterfalls. Third, its <b>emptiness</b>: on many beaches you will be the only visitor, and the surf breaks of the south coast are among the most consistent in the country.</p>
<p>The flip side is that Sumba is not easy. Roads are slow, distances are long, there is little public transport, few restaurants and limited healthcare. If you want nightlife, cafés and short transfers, Bali is the better choice; see our honest {GD('sumba-vs-bali', 'Sumba or Bali comparison')}.</p>
<h2>The four regions and what to see in each</h2>
<h3>Southwest Sumba (Kodi and Tambolaka)</h3>
<p>Most first-time visitors start here because Tambolaka airport has the most flights. The Kodi coast has the island's most photographed sights: {PL('weekuri-lagoon', 'Weekuri Lagoon')}, a saltwater lagoon behind a coral wall; the cliffs of {PL('mandorak-beach', 'Mandorak Beach')}; the sunsets of {PL('pero-beach', 'Pero Beach')}; and the traditional villages of {PL('ratenggaro', 'Ratenggaro')} and {PL('wainyapu', 'Wainyapu')}, with some of the tallest roofs on the island. Inland, {PL('weekacura-waterfall', 'Weekacura')} spills over terraces in the middle of rice fields.</p>
<h3>West Sumba (Waikabubak, Lamboya and Wanokaka)</h3>
<p>Cooler and greener, with Waikabubak as its hill-town capital. Traditional villages such as {PL('tarung-village', 'Tarung')} sit right inside the town. To the south are the beaches of {PL('marosi-beach', 'Marosi')} and {PL('rua-beach', 'Rua')}, the {PL('pasola-wanokaka', 'Pasola field of Wanokaka')} and {PL('lapopu-waterfall', 'Lapopu')}, the island's best-known waterfall, inside Matalawa National Park.</p>
<h3>Central Sumba (Anakalang, Waibakul and Mamboro)</h3>
<p>The least visited region and one of the most rewarding. Around Anakalang are some of Sumba's finest megalithic tombs, at {PL('pasunga-village', 'Pasunga')} and {PL('gallubakul-tomb', 'Gallubakul')}. In the forest of the national park hides {PL('matayangu-waterfall', 'Matayangu waterfall')}. On the north coast, the savanna and beaches around Mamboro are almost untouched; see our {A('', 'mamboro', 'top 10 around Mamboro').replace('/mamboro//', '/mamboro/')}.</p>
<h3>East Sumba (Waingapu and the savanna)</h3>
<p>The east is drier and more open. Waingapu, the island's largest town, is the base for the hills of {PL('wairinding-hill', 'Wairinding')}, the canyon pools of {PL('tanggedu-waterfall', 'Tanggedu')}, the mangrove "dancing trees" of {PL('walakiri-beach', 'Walakiri Beach')} at sunset, the savanna and beach of {PL('puru-kambera', 'Puru Kambera')} and the ikat-weaving villages of {PL('prailiu-village', 'Prailiu')} and {PL('praiyawang-rende', 'Rende')}. Further south are {PL('waimarang-waterfall', 'Waimarang')} and the surf bay of {PL('tarimbang-bay', 'Tarimbang')}.</p>
<h2>When to go</h2>
<p>Sumba has a dry season from roughly May to October and a wet season from about November or December to March or April. The east is markedly drier than the west. In the dry season the savanna turns golden, roads are easier and waterfalls are clear, though some become thin by September and October. In the wet season the hills are spectacularly green but unpaved roads can become impassable and waterfalls turn brown after heavy rain. The Pasola takes place in February and March. Full details in our {GD('best-time-weather', 'guide to the weather')}.</p>
<h2>How to get to Sumba</h2>
<p>Almost everyone flies. There are daily flights from Bali (Denpasar) to Tambolaka and regular flights to Waingapu, plus connections from Kupang and other Indonesian cities. The flight from Bali takes around an hour on small turboprop planes with tight baggage limits. The smartest plan is to fly into one airport and out of the other so you never have to drive back across the island. Slow ferries also link Sumba with Sumbawa, Flores and Timor. Everything is explained in {GD('bali-to-sumba', 'how to get from Bali to Sumba')}.</p>
<h2>Getting around</h2>
<p>There are no trains, almost no taxis outside the towns and only basic public minibuses. Most visitors hire a <b>car with a local driver</b>, which also solves navigation and language. Confident riders rent scooters in the towns, but distances are long and roads can be rough. Allow plenty of time: a 100 km drive can take three hours. See {GD('getting-around-sumba', 'getting around Sumba')}.</p>
<h2>How many days and suggested routes</h2>
<ul><li><b>3 days:</b> the west only. {GD('itinerary-3-days', 'Our 3-day route')}.</li><li><b>5 days:</b> west and east, flying in and out of different airports. {GD('itinerary-5-days', 'Our 5-day route')}.</li><li><b>7 days or more:</b> the whole island, including the south and north coasts. {GD('itinerary-7-days', 'Our 7-day route')}.</li></ul>
<h2>Where to stay</h2>
<p>Accommodation clusters around the airports and towns: Tambolaka and the Kodi coast in the south-west, Waikabubak and the Lamboya and Wanokaka coast in the west, and Waingapu in the east. Options range from simple guesthouses to some of the most famous luxury resorts in Asia, with little in between in some areas. Read {GD('where-to-stay-in-sumba', 'where to stay in Sumba')} before booking.</p>
<h2>Money and costs</h2>
<p>Bring enough cash. There are ATMs in the main towns (Tambolaka, Waikabubak, Waibakul and Waingapu) but none along the coasts, and card payments are rare outside hotels. The biggest costs are flights, accommodation and the car with driver; entrance fees and village donations are small but frequent. See {GD('budget-guide', 'how much a trip costs')}.</p>
<h2>Visiting traditional villages</h2>
<p>Villages are homes, not museums. At the entrance you will usually sign a guestbook and leave a donation. Ask before taking photos of people, never climb on the stone tombs and dress modestly. Children may ask for money or sweets; buying ikat or other crafts directly from the makers is a better way to help. Our {GD('respect-etiquette', 'etiquette guide')} and {GD('traditional-villages-sumba', 'guide to the traditional villages')} explain how to visit well.</p>
<h2>Health and safety</h2>
<p>Sumba is generally peaceful, but it is remote. Medical facilities are basic, and serious cases are evacuated by air, so get insurance that covers evacuation. Use mosquito repellent, carry water, and be careful in the sea: the south coast faces the open ocean with strong currents and reef breaks. The biggest everyday risk is the road, especially at night. More in {GD('health-safety', 'health and safety in Sumba')}.</p>
<h2>Practical tips</h2>
<ul><li>Download offline maps before you go; mobile signal disappears in many areas.</li><li>Carry small notes for entrance fees, parking and donations.</li><li>Pack reef-safe sun protection, a hat, sandals with grip and a light layer for the hills.</li><li>Learn a few words of Indonesian: <i>terima kasih</i> (thank you), <i>permisi</i> (excuse me), <i>berapa?</i> (how much?).</li><li>Respect the drone rules of villages and sacred sites: always ask first.</li></ul>
<p>Everything else is in our {GD('sumba-practical-tips', 'practical tips for Sumba')}.</p>
<h2>Is Sumba worth it?</h2>
<p>If you are looking for culture that is lived rather than performed, wild landscapes and the feeling of travelling somewhere still unknown, very much so. Plan realistically, go slowly and treat the island with respect, and Sumba will be one of the most memorable trips you take in Indonesia. Start with the {MAP} and our list of {A('', 'secret-spots', 'secret spots').replace('/secret-spots//', '/secret-spots/')}.</p>"""},

{"s": "things-to-do-in-sumba", "img": "wairinding-hill", "t": "25 best things to do in Sumba",
 "d": "From Weekuri Lagoon to the Pasola, the dancing trees of Walakiri and the megalithic tombs of Anakalang: the best experiences on Sumba island, with a map.",
 "faq": [
  ["What is Sumba most famous for?", "Its traditional villages with tall thatched roofs and megalithic tombs, the Pasola horseback ritual, ikat textiles, Weekuri Lagoon, the savanna hills of the east and world-class surf on the south coast."],
  ["What can you do in Sumba in one day?", "From Tambolaka you can visit Weekuri Lagoon, Mandorak Beach, Ratenggaro village and watch the sunset at Pero Beach in one long day."],
  ["Can you swim in Weekuri Lagoon?", "Yes. It is a calm saltwater lagoon and the most popular swimming spot on the island. Go early to avoid the crowds."]],
 "b": f"""<p>Sumba rewards curiosity. Here are the experiences that make the island special, grouped by type, with links to each place on our {MAP}. Distances are long, so pick a region and explore it well rather than trying to do everything.</p>
<h2>Nature and swimming</h2>
<h3>1. Float in Weekuri Lagoon</h3><p>{PL('weekuri-lagoon', 'Weekuri Lagoon')} is a saltwater pool cut off from the ocean by a wall of coral rock. Waves push sea water through the cracks, so the water stays clear and turquoise. Go early on a weekday.</p>
<h3>2. Watch the cliffs of Mandorak</h3><p>A tiny white cove between two cliffs, minutes from Weekuri. {PL('mandorak-beach', 'Mandorak')} is at its best around sunset.</p>
<h3>3. Swim under Lapopu waterfall</h3><p>{PL('lapopu-waterfall', 'Lapopu')} tumbles down a staircase of rock inside Matalawa National Park in the west, with pools below.</p>
<h3>4. Explore the canyon pools of Tanggedu</h3><p>In the east, a river has carved a narrow canyon of turquoise pools at {PL('tanggedu-waterfall', 'Tanggedu')}. The walk across the savanna is part of the experience.</p>
<h3>5. Find the hidden pool of Waimarang</h3><p>{PL('waimarang-waterfall', 'Waimarang')} is a jungle waterfall into a deep green pool, reached on foot in East Sumba.</p>
<h3>6. Walk through the rice fields to Weekacura</h3><p>{PL('weekacura-waterfall', 'Weekacura')} is unusual: a series of low cascades in the middle of working paddies.</p>
<h3>7. Look for the Sumba hornbill</h3><p>The highlands of {PL('wanggameti', 'Wanggameti')} and the forests of Matalawa National Park are home to endemic birds, including the Sumba hornbill.</p>
<h2>Viewpoints and savanna</h2>
<h3>8. Sunset on Wairinding Hill</h3><p>{PL('wairinding-hill', 'Wairinding')}, half an hour from Waingapu, is the classic view of Sumba's rolling hills, green in the rains and golden in the dry season.</p>
<h3>9. The savanna and horses of Puru Kambera</h3><p>{PL('puru-kambera', 'Puru Kambera')} combines open grassland, grazing horses and a long beach on the east coast.</p>
<h3>10. The quiet north coast of Mamboro</h3><p>The {PL('mamboro-savanna', 'Mamboro savanna')} and nearby beaches such as {PL('kapulit-beach', 'Kapulit')} and {PL('mananga-beach', 'Mananga')} see almost no visitors. See our <a href="/{{l}}/mamboro/">top 10 around Mamboro</a>.</p>
<h3>11. The Napu valley and Wunga</h3><p>On the dry north coast of East Sumba, {PL('napu-valley', 'Napu')} and {PL('wunga-village', 'Wunga')} feel like the end of the world.</p>
<h2>Beaches and surf</h2>
<h3>12. The dancing trees of Walakiri</h3><p>At low tide and sunset, the mangroves of {PL('walakiri-beach', 'Walakiri')} stand out against the sky like dancers. Check the tide before going.</p>
<h3>13. Sunset at Pero</h3><p>{PL('pero-beach', 'Pero')} is a fishing village and beach on the Kodi coast with some of the best sunsets in the west.</p>
<h3>14. Surf the south coast</h3><p>Sumba's south coast faces the open Indian Ocean. Reef breaks near {PL('marosi-beach', 'Marosi')}, {PL('watu-maladong', 'Watu Maladong')} and {PL('tarimbang-bay', 'Tarimbang')} are for experienced surfers. Read {GD('surf-sumba', 'surfing in Sumba')}.</p>
<h3>15. A black-sand beach</h3><p>Most of Sumba's beaches are white. {PL('konda-beach', 'Konda')}, on the south coast of Central Sumba, is black.</p>
<p>All of them are in our {GD('best-beaches-in-sumba', 'guide to the best beaches')}.</p>
<h2>Culture and traditions</h2>
<h3>16. Visit a traditional village</h3><p>The tall-roofed houses and stone tombs of {PL('ratenggaro', 'Ratenggaro')}, {PL('wainyapu', 'Wainyapu')}, {PL('tarung-village', 'Tarung')} and {PL('pasunga-village', 'Pasunga')} are unforgettable. Read {GD('traditional-villages-sumba', 'how to visit them respectfully')}.</p>
<h3>17. See the megalithic tombs of Anakalang</h3><p>Central Sumba has some of the largest stone tombs on the island, such as {PL('gallubakul-tomb', 'Gallubakul')}.</p>
<h3>18. Watch the Pasola</h3><p>In February and March, riders in western Sumba throw blunt spears at each other in a ritual tied to the Marapu calendar. See our {GD('pasola-guide', 'Pasola guide')}.</p>
<h3>19. Learn about Marapu</h3><p>Understanding the ancestral religion changes how you see everything on the island. Start with {GD('marapu-religion-sumba', 'Marapu explained')}.</p>
<h3>20. Watch ikat being woven</h3><p>The weaving villages of {PL('prailiu-village', 'Prailiu')} and {PL('praiyawang-rende', 'Rende')} in the east make some of Indonesia's most admired textiles. Read {GD('ikat-guide', 'how to buy ikat well')}.</p>
<h3>21. Visit Wunga, where the ancestors landed</h3><p>According to Sumbanese oral tradition, {PL('wunga-village', 'Wunga')} is where the first ancestors came ashore.</p>
<h2>Food and daily life</h2>
<h3>22. Eat fresh fish with the fishermen</h3><p>Buy the catch at {PL('padadita-beach', 'Padadita')} in Waingapu or at {PL('mananga-beach', 'Mananga')} on the north coast. See {GD('food-in-sumba', 'what to eat in Sumba')}.</p>
<h3>23. Visit a market</h3><p>Weekly markets in the towns are the best place to see betel nut, ikat, livestock and local produce change hands.</p>
<h3>24. Watch salt being made</h3><p>On the north coast at {PL('lenang-beach', 'Lenang')}, villagers still make salt the traditional way.</p>
<h3>25. Drive across the island</h3><p>The road from Tambolaka to Waingapu crosses every landscape on Sumba in a day. Fly into one airport and out of the other and make the drive part of the trip.</p>"""},

{"s": "best-beaches-in-sumba", "img": "mandorak-beach", "t": "The best beaches in Sumba (with map)",
 "d": "Every beach worth the drive on Sumba: lagoons, surf breaks, sunset spots and empty white sand on all four coasts, with tips on safety and access.",
 "faq": [
  ["What is the most beautiful beach in Sumba?", "It depends on what you want: Weekuri Lagoon for calm turquoise water, Mandorak for cliffs, Walakiri for sunset, Pero for village life and the south coast beaches such as Marosi for wild surf."],
  ["Is it safe to swim at Sumba's beaches?", "The north coast is usually calm. The south and west coasts face the open Indian Ocean with strong currents and reef breaks, so swim only when the sea is calm and ask locals first. There are no lifeguards."],
  ["Which Sumba beaches are best for sunset?", "Pero, Mandorak and Walakiri are the classic sunset beaches."]],
 "b": f"""<p>Sumba has hundreds of kilometres of coastline and most of it is empty. The beaches fall into three families: the wild, surf-battered south and west, the calmer and drier north and the mangrove shores of the east. All of them are on our {MAP}.</p>
<h2>Southwest Sumba</h2>
<h3>Weekuri Lagoon</h3><p>{PL('weekuri-lagoon', 'Weekuri')} is not technically a beach but a lagoon of clear salt water behind a coral wall, the island's favourite swim. Busy at weekends.</p>
<h3>Mandorak Beach</h3><p>{PL('mandorak-beach', 'Mandorak')} is a tiny white cove framed by cliffs. Waves can be strong; enjoy it from the rocks when the swell is up.</p>
<h3>Pero Beach</h3><p>{PL('pero-beach', 'Pero')} is a fishing village and sunset beach on the Kodi coast with rock pools at low tide.</p>
<h3>Watu Maladong</h3><p>{PL('watu-maladong', 'Watu Maladong')} is remote, framed by big rocks and reached on a long, rough road.</p>
<h2>West Sumba</h2>
<h3>Marosi Beach</h3><p>{PL('marosi-beach', 'Marosi')} is a long arc of sand on the south coast, known for surf. Swim only on calm days.</p>
<h3>Rua Beach</h3><p>{PL('rua-beach', 'Rua')} has pale sand and clear water and is one of the nicer swimming spots on this stretch when the sea is calm.</p>
<h2>Central Sumba</h2>
<h3>Kapulit Beach</h3><p>On the quiet north coast, {PL('kapulit-beach', 'Kapulit')} is wide and white, with gentle waves and coral formations for shade.</p>
<h3>Mananga Beach</h3><p>{PL('mananga-beach', 'Mananga')} is reached by boat across a small lagoon and is where Mamboro's fishermen land their catch.</p>
<h3>Karendi Beach</h3><p>{PL('karendi-beach', 'Karendi')} has two river mouths, casuarina trees and old Japanese cannons. Crocodiles live in the salty river on the way: stay on the track.</p>
<h3>Lenang (Pahar) Beach</h3><p>{PL('lenang-beach', 'Lenang')} combines blue-green water, mangroves and traditional salt-making.</p>
<h3>Maloba and Konda</h3><p>On the south coast, {PL('maloba-beach', 'Maloba')} is firm white sand with a sacred grave on a coral outcrop, and {PL('konda-beach', 'Konda')} is a rare black-sand beach with surf.</p>
<h2>East Sumba</h2>
<h3>Walakiri Beach</h3><p>{PL('walakiri-beach', 'Walakiri')} is famous for its "dancing" mangrove trees silhouetted at sunset. Check the tide: the effect is best when the water is low.</p>
<h3>Puru Kambera</h3><p>{PL('puru-kambera', 'Puru Kambera')} pairs a long beach with savanna and grazing horses.</p>
<h3>Londa Lima and Padadita</h3><p>{PL('londa-lima-beach', 'Londa Lima')} is the easy swim near Waingapu; {PL('padadita-beach', 'Padadita')} is the town beach, best at golden hour.</p>
<h3>Tarimbang</h3><p>{PL('tarimbang-bay', 'Tarimbang')} is a remote surf bay on the south-east coast.</p>
<h2>Beach safety in Sumba</h2>
<ul><li>There are no lifeguards. Ask locals about currents before swimming.</li><li>Reef breaks are shallow; surf only with experience and booties.</li><li>Carry water and shade: most beaches have no shops.</li><li>Respect sacred sites such as graves and offerings on the shore.</li><li>Take your rubbish with you.</li></ul>"""},

{"s": "bali-to-sumba", "img": "magnitude-6-1-earthquake-southwest-sumba", "t": "How to get from Bali to Sumba: flights, ferries and airports",
 "d": "Flights from Bali to Tambolaka (TMC) and Waingapu (WGP), which airport to choose, baggage limits, ferries and how to get from the airport to your hotel.",
 "faq": [
  ["How long is the flight from Bali to Sumba?", "About an hour from Denpasar to Tambolaka or Waingapu."],
  ["Which airport should I fly into, Tambolaka or Waingapu?", "Tambolaka (TMC) for the west and south-west, Waingapu (WGP) for the east. If you have five days or more, fly into one and out of the other."],
  ["Is there a ferry from Bali to Sumba?", "Not a direct fast boat. Slow ferries link Sumba with Sumbawa, Flores and Timor, so going by sea from Bali means several days of island hopping."],
  ["Do I need a visa for Sumba?", "Sumba is part of Indonesia, so the same entry rules apply as for Bali. Many nationalities can get a visa on arrival or an e-visa; check the official Indonesian immigration website before you travel."]],
 "b": f"""<p>Sumba is close to Bali but there is no bridge, no fast boat and only a few flights a day, so getting there takes a little planning.</p>
<h2>The two airports</h2>
<ul><li><b>Tambolaka (TMC)</b>, in Southwest Sumba near the town of Tambolaka. Best for Kodi, Weekuri Lagoon, the west and most resorts in the south-west and west.</li><li><b>Waingapu (WGP)</b>, officially Umbu Mehang Kunda, next to the town of Waingapu. Best for the savanna, waterfalls and weaving villages of the east.</li></ul>
<p>The drive between them takes most of a day, so the classic plan is an "open jaw" trip: fly into one and out of the other.</p>
<h2>Flights from Bali</h2>
<p>Several Indonesian carriers fly between Denpasar (DPS) and Sumba, mostly on small turboprop planes. The flight takes about an hour. Schedules change often, so check current timetables and book early around Indonesian holidays and in July and August.</p>
<ul><li><b>Baggage:</b> allowances on these planes can be small, often around 10 to 20 kg. Pay for extra in advance, especially for surfboards.</li><li><b>Connections:</b> leave plenty of time if you connect to an international flight in Bali; delays and schedule changes happen.</li><li><b>From other cities:</b> there are also flights from Kupang and some from Jakarta and Surabaya, depending on the season.</li></ul>
<h2>By sea</h2>
<p>Slow ferries and passenger ships link Waingapu and the port of Waikelo near Tambolaka with Sumbawa, Flores and Timor. Going by sea from Bali means crossing Lombok and Sumbawa first and takes several days. It suits slow travellers with time; timetables are irregular and can change with the weather.</p>
<h2>From the airport to your accommodation</h2>
<p>There are few taxis at either airport. Most travellers arrange a pickup with their accommodation or with the driver they will hire for the trip. In Tambolaka and Waingapu ojek (motorbike taxis) wait outside.</p>
<h2>Entry rules</h2>
<p>Sumba is part of Indonesia, so you arrive on your Indonesian visa from Bali. Bali's tourist levy applies only to Bali. Always check the latest rules on the official Indonesian immigration website.</p>
<h2>Next steps</h2>
<p>Choose your route with our {GD('itinerary-5-days', '5-day itinerary')} and read {GD('getting-around-sumba', 'getting around Sumba')}.</p>"""},

{"s": "getting-around-sumba", "img": "napu-valley", "t": "Getting around Sumba: drivers, scooters, roads and maps",
 "d": "How to travel around Sumba: hiring a car with driver, renting a scooter, road conditions, fuel, mobile signal and offline maps.",
 "faq": [
  ["Is there public transport in Sumba?", "Only basic minibuses and buses between towns. They are cheap but slow and do not reach most sights, so most visitors hire a car with a driver."],
  ["Can I rent a scooter in Sumba?", "Yes, in the main towns. It suits confident riders; distances are long, roads can be rough and there is little help if you break down."],
  ["Does Google Maps work in Sumba?", "Roads are mapped, but signal disappears in many areas and some routes suggested by apps are tracks. Download offline maps and confirm routes with locals."]],
 "b": f"""<p>Sumba is big, roads are slow and public transport barely exists outside the towns. How you move around will shape your whole trip.</p>
<h2>Car with a local driver (recommended)</h2>
<p>The most common choice. A driver knows the roads, speaks the language, can introduce you in villages and often doubles as a guide. Agree in advance on the price per day, what is included (fuel, the driver's meals and lodging on multi-day trips) and the route. Ask your accommodation for a recommendation.</p>
<h2>Scooter</h2>
<p>Scooters can be rented in Tambolaka, Waikabubak and Waingapu. Wear a helmet, carry water and a phone charger, refuel when you can (fuel stations are scarce away from the towns, but small shops sell petrol in bottles) and avoid riding after dark.</p>
<h2>Self-drive car</h2>
<p>Possible but uncommon. You will need an international driving permit, patience on narrow roads and good offline maps.</p>
<h2>Road conditions</h2>
<p>The main road between Tambolaka, Waikabubak, Waibakul and Waingapu is paved. Side roads to beaches and villages range from good asphalt to rocky tracks that become muddy in the rains. As a rough rule, plan for 30 to 40 km per hour on average. Animals, children and potholes are common; night driving is best avoided.</p>
<h2>Distances</h2>
<p>Use our {MAP}: every place shows the distance to the nearest town and airport. Driving across the island from Tambolaka to Waingapu takes most of a day.</p>
<h2>Mobile signal and maps</h2>
<p>Coverage is good in towns and patchy elsewhere; some coasts have none. Buy a local SIM in town, download offline maps and save the places you want to visit before leaving the hotel.</p>"""},

{"s": "where-to-stay-in-sumba", "img": "marosi-beach", "t": "Where to stay in Sumba: the best areas for every trip",
 "d": "Which area of Sumba to stay in: Tambolaka and Kodi, Waikabubak and the south-west coast, Central Sumba and Waingapu in the east, and how to split your nights.",
 "faq": [
  ["Where should I stay in Sumba for the first time?", "Split your nights: two or three in the south-west or west (near Tambolaka, Kodi or the Lamboya and Wanokaka coast) and two or three in the east around Waingapu."],
  ["Are there cheap places to stay in Sumba?", "Yes, there are simple guesthouses in the towns, but outside them the choice is limited and some areas only have high-end resorts. Book ahead in the dry season."]],
 "b": f"""<p>Where you sleep matters more in Sumba than in most places, because distances are long and there are few places to eat outside your accommodation. Choose a base for each region you want to explore.</p>
<h2>Tambolaka and the Kodi coast (Southwest Sumba)</h2>
<p>Closest to Tambolaka airport and to {PL('weekuri-lagoon', 'Weekuri')}, {PL('mandorak-beach', 'Mandorak')}, {PL('pero-beach', 'Pero')} and {PL('ratenggaro', 'Ratenggaro')}. Tambolaka town has guesthouses and simple hotels; the coast has a mix of surf camps and resorts.</p>
<h2>Waikabubak (West Sumba)</h2>
<p>A cool hill town with traditional villages inside it, central for both the south coast and the Anakalang tombs. Practical, with shops and banks.</p>
<h2>Lamboya and Wanokaka coast (West Sumba)</h2>
<p>The green south coast near {PL('marosi-beach', 'Marosi')}, {PL('rua-beach', 'Rua')} and {PL('lapopu-waterfall', 'Lapopu')}, home to several of the island's best-known resorts and surf stays.</p>
<h2>Central Sumba</h2>
<p>Few places to stay, mostly in Waibakul, but a good stop to break the long drive and see the megalithic tombs. The north coast around Mamboro is quiet and undeveloped; see the <a href="/{{l}}/mamboro/">top 10 around Mamboro</a>.</p>
<h2>Waingapu and the east</h2>
<p>The largest town on the island, with the widest range of simple hotels and places to eat. Base yourself here for {PL('wairinding-hill', 'Wairinding')}, {PL('tanggedu-waterfall', 'Tanggedu')}, {PL('walakiri-beach', 'Walakiri')} and the weaving villages.</p>
<h2>Tips for booking</h2>
<ul><li>Book ahead for July, August and the Pasola weeks in February and March.</li><li>Ask whether meals are included: outside the towns there may be nowhere else to eat.</li><li>Check how the property handles airport transfers.</li><li>Confirm electricity, water and internet if you need them for work.</li></ul>"""},

{"s": "traditional-villages-sumba", "img": "ratenggaro", "t": "Traditional villages in Sumba: which to visit and how",
 "d": "Ratenggaro, Wainyapu, Tarung, Pasunga, Prailiu, Rende and more: what to see in Sumba's megalithic villages and how to visit respectfully.",
 "faq": [
  ["Do you have to pay to visit villages in Sumba?", "Usually you sign a guestbook and leave a donation. It is a contribution to the community, not an entrance fee."],
  ["Can I take photos in Sumba's villages?", "Ask first, especially for photos of people and of sacred objects. Some villages ask for an extra contribution for drones or professional shoots."],
  ["Why are the roofs so tall?", "The high roof is the sacred upper level of the house, where heirlooms and offerings to the ancestors are kept, in line with Marapu beliefs."]],
 "b": f"""<p>Nowhere else in Indonesia do you see villages quite like Sumba's: rows of houses with towering thatched roofs facing a square of massive stone tombs. They are inhabited homes and the centre of a living belief system, so visit with curiosity and respect.</p>
<h2>What you will see</h2>
<ul><li><b>The houses:</b> raised on stilts, with animals below, people in the middle and a tall sacred roof above, where heirlooms are kept.</li><li><b>The tombs:</b> huge stone slabs, sometimes dragged by hundreds of people, mark the graves of ancestors in the village square.</li><li><b>Buffalo horns and pig jaws:</b> hung on the houses as a record of past ceremonies and sacrifices.</li></ul>
<h2>The best villages to visit</h2>
<h3>Ratenggaro (Southwest Sumba)</h3><p>{PL('ratenggaro', 'Ratenggaro')} has some of the tallest roofs on the island and stands by the sea, facing {PL('wainyapu', 'Wainyapu')} across a river mouth.</p>
<h3>Tarung (West Sumba)</h3><p>{PL('tarung-village', 'Tarung')} sits on a hill in the middle of Waikabubak, an easy walk from the shops.</p>
<h3>Waigalli (West Sumba)</h3><p>{PL('waigalli-village', 'Waigalli')} overlooks Wanokaka, near the Pasola field.</p>
<h3>Pasunga and Gallubakul (Central Sumba)</h3><p>Anakalang has some of the finest megalithic tombs on Sumba: {PL('pasunga-village', 'Pasunga')} on the main road and {PL('gallubakul-tomb', 'Gallubakul')}, home to a slab said to weigh around 70 tonnes.</p>
<h3>Deri Kambajawa (Central Sumba)</h3><p>{PL('deri-kambajawa', 'Deri Kambajawa')} is known for tower-like clan houses up to about 30 metres. Remote: go with a local guide.</p>
<h3>Prailiu and Rende (East Sumba)</h3><p>{PL('prailiu-village', 'Prailiu')}, near Waingapu, and {PL('praiyawang-rende', 'Praiyawang in Rende')} are centres of East Sumba's ikat weaving and royal traditions.</p>
<h3>Wunga (East Sumba)</h3><p>{PL('wunga-village', 'Wunga')}, on the north coast, is where oral tradition says the first ancestors landed.</p>
<h2>How to visit respectfully</h2>
<ul><li>Go with a local guide or driver who can introduce you.</li><li>Sign the guestbook and leave a donation.</li><li>Ask before photographing people, houses' interiors or sacred objects.</li><li>Never sit or climb on the stone tombs.</li><li>Dress modestly, covering shoulders and knees.</li><li>Buy crafts directly from the makers instead of giving money to children.</li><li>If a ceremony or funeral is taking place, ask whether visitors are welcome before approaching.</li></ul>
<p>Read more in {GD('respect-etiquette', 'respect and etiquette in Sumba')} and {GD('marapu-religion-sumba', 'Marapu explained')}.</p>"""},
]

GUIDES3 += [
{"s": "sumba-waterfalls", "img": "tanggedu-waterfall", "t": "Sumba waterfalls: the complete guide",
 "d": "Lapopu, Tanggedu, Waimarang, Matayangu, Weekacura, Harunda and Kolam Jodoh: every waterfall in Sumba, how to reach it and the best season.",
 "faq": [
  ["What is the best waterfall in Sumba?", "Lapopu is the most famous, Tanggedu the most unusual with its canyon pools, and Waimarang the most photogenic jungle pool."],
  ["When is the best time to see Sumba's waterfalls?", "From the end of the rainy season to the middle of the dry season, roughly April to July, when there is still water but the paths are dry and the water is clear."]],
 "b": f"""<p>Sumba is a dry island, which makes its waterfalls feel even more special. Most sit inside forested valleys or canyons and need a walk to reach. All are on our {MAP}.</p>
<h2>West and Southwest Sumba</h2>
<h3>Lapopu</h3><p>{PL('lapopu-waterfall', 'Lapopu')} falls down a wide staircase of rock inside Matalawa National Park, between West and Central Sumba. A short walk leads from the parking area. An entrance fee applies.</p>
<h3>Weekacura</h3><p>{PL('weekacura-waterfall', 'Weekacura')} is a series of low cascades in the middle of rice paddies near Tambolaka. Walk carefully on the field edges.</p>
<h2>Central Sumba</h2>
<h3>Matayangu</h3><p>{PL('matayangu-waterfall', 'Matayangu')} hides deep in the national park forest and is reached on foot along a jungle trail. One of the island's most magical places, and one of the hardest to reach.</p>
<h3>Harunda</h3><p>{PL('harunda-waterfall', 'Harunda')} is a waterfall about 20 metres high reached by walking up a rocky riverbed.</p>
<h2>East Sumba</h2>
<h3>Tanggedu</h3><p>At {PL('tanggedu-waterfall', 'Tanggedu')} the river has carved a narrow canyon of turquoise pools. The walk crosses open savanna; go with a local guide.</p>
<h3>Waimarang</h3><p>{PL('waimarang-waterfall', 'Waimarang')} pours into a deep green pool surrounded by forest, reached on foot.</p>
<h3>Kolam Jodoh</h3><p>{PL('kolam-jodoh-waterfall', 'Kolam Jodoh')}, the "lovers' pool", is a small multi-step fall into a clear pool near Lewa.</p>
<h2>Tips</h2>
<ul><li>Wear sandals with grip; rocks are slippery.</li><li>Do not swim after heavy rain: water rises fast and turns brown.</li><li>Carry water, cash for entrance fees and parking, and leave nothing behind.</li><li>Late dry season (September and October) can leave some falls very thin.</li></ul>"""},

{"s": "marapu-religion-sumba", "img": "wainyapu", "t": "Marapu: Sumba's ancestral religion explained",
 "d": "What Marapu is, how it shapes Sumbanese houses, tombs, funerals and the Pasola, and how visitors can show respect.",
 "faq": [
  ["What does Marapu mean?", "Marapu refers to the ancestral spirits and, by extension, to the traditional belief system of Sumba built around honouring them."],
  ["Is Marapu still practised?", "Yes. Many Sumbanese are Christian, but Marapu traditions remain important across the island, and some communities follow Marapu as their main belief."]],
 "b": f"""<p>To understand Sumba you need to understand Marapu. It is the island's ancestral belief system, and it explains why the houses look the way they do, why huge stones are dragged across the island and why the Pasola exists.</p>
<h2>The basics</h2>
<p>Marapu is the belief that the spirits of ancestors watch over the living and act as intermediaries with a supreme creator. Keeping a good relationship with them through rituals, offerings and respect for custom (<i>adat</i>) brings harmony, good harvests and health. Ritual specialists, often called <i>rato</i>, lead the ceremonies.</p>
<h2>The house as a sacred map</h2>
<p>A traditional Sumbanese house has three levels. Animals live below, people in the middle and the tall roof is reserved for the ancestors, heirlooms and sacred objects. That is why the roofs of villages like {PL('ratenggaro', 'Ratenggaro')} and {PL('wainyapu', 'Wainyapu')} rise so high.</p>
<h2>Stone tombs and funerals</h2>
<p>The dead are buried in stone tombs in the village square, close to the living. Dragging a large slab can involve hundreds of people and long ceremonies, and funerals can last for days, with buffalo and pigs sacrificed. The horns and jaws you see on houses are records of these events. Some of the largest tombs are in Anakalang, at {PL('pasunga-village', 'Pasunga')} and {PL('gallubakul-tomb', 'Gallubakul')}.</p>
<h2>The Pasola</h2>
<p>The Pasola, a ritual contest on horseback in western Sumba, belongs to the Marapu calendar and is linked to the arrival of sea worms (<i>nyale</i>) on the shore. Read our {GD('pasola-guide', 'Pasola guide')}.</p>
<h2>How to show respect</h2>
<ul><li>Never touch, sit on or climb stone tombs or sacred objects.</li><li>Ask before entering a house or photographing ceremonies.</li><li>Accept betel nut (<i>sirih pinang</i>) if offered, even if you only hold it; it is a sign of welcome.</li><li>Follow your guide's lead at funerals and rituals.</li></ul>"""},

{"s": "food-in-sumba", "img": "padadita-beach", "t": "What to eat in Sumba: food, coffee and where to find it",
 "d": "Fresh fish, smoked meat, local vegetables, Sumba coffee and the betel-nut ritual: what you will eat on the island and practical tips.",
 "faq": [
  ["Is it easy to find restaurants in Sumba?", "In the towns yes, with simple warungs and a few cafés. Outside them there is little, so carry snacks and water and check whether your accommodation serves meals."],
  ["Is there vegetarian food in Sumba?", "Rice, vegetables, tofu and tempeh are easy to find in town warungs. Say 'tidak pakai daging' (without meat)."]],
 "b": f"""<p>Sumba is not a food destination in the way Bali is, but eating local is part of the experience, and the fish is excellent.</p>
<h2>What you will eat</h2>
<ul><li><b>Fresh fish:</b> grilled (<i>ikan bakar</i>) or in a sour broth, best near the coast. Buy it at {PL('padadita-beach', 'Padadita')} in Waingapu or from the fishermen at {PL('mananga-beach', 'Mananga')}.</li><li><b>Se'i:</b> smoked meat, a speciality across East Nusa Tenggara.</li><li><b>Local greens:</b> stir-fried papaya leaves and flowers, cassava leaves and other vegetables often served with rice.</li><li><b>Corn and cassava:</b> staples in the drier east.</li><li><b>Indonesian classics:</b> nasi goreng, mie goreng, soto and simple rice dishes in every town.</li></ul>
<h2>Coffee</h2><p>Coffee is grown in the hills of Sumba and served strong and sweet. Buy beans at local markets.</p>
<h2>Betel nut</h2><p>Chewing betel nut with lime (<i>sirih pinang</i>) is a central social ritual. Offering it is a sign of welcome; you can accept it and simply hold it if you do not want to chew.</p>
<h2>Practical tips</h2>
<ul><li>Drink bottled or filtered water only.</li><li>Eat where locals eat; busy warungs have the freshest food.</li><li>Carry snacks on long drives.</li><li>Many places close early in the evening.</li></ul>"""},

{"s": "sumba-practical-tips", "img": "praiyawang-rende", "t": "Sumba practical tips: money, internet, visas and what to pack",
 "d": "ATMs and cash, SIM cards and signal, visas, electricity, toilets, tipping, dress code and a packing list for Sumba.",
 "faq": [
  ["Are there ATMs in Sumba?", "Yes, in the main towns: Tambolaka, Waikabubak, Waibakul and Waingapu. There are none on the coasts, so withdraw enough cash before you set off."],
  ["Is there internet in Sumba?", "Mobile data works in the towns and along much of the main road. Many beaches and villages have weak or no signal."],
  ["What plug do they use in Sumba?", "The same as the rest of Indonesia: type C and F, 230 V."]],
 "b": f"""<h2>Money</h2><ul><li>The currency is the Indonesian rupiah (IDR).</li><li>Cash is king. Cards work only in some hotels and larger shops.</li><li>ATMs are in Tambolaka, Waikabubak, Waibakul and Waingapu.</li><li>Carry small notes for entrance fees, parking, donations and snacks.</li></ul>
<h2>Internet and phone</h2><ul><li>Buy a local SIM in town with your passport; coverage on the main road is reasonable.</li><li>Download offline maps and save our {MAP} places before you go.</li><li>Do not count on signal at beaches, waterfalls or remote villages.</li></ul>
<h2>Visas and entry</h2><p>Sumba is part of Indonesia: the same visa rules apply as for Bali. Many nationalities can use a visa on arrival or an e-visa. Check the official Indonesian immigration website before travelling.</p>
<h2>Electricity</h2><p>Type C and F plugs, 230 V. Power cuts happen; a power bank is useful.</p>
<h2>Toilets</h2><p>Major sights such as Weekuri Lagoon have basic toilets, usually for a small fee. Villages and remote beaches have none. Carry tissues and hand sanitiser.</p>
<h2>Dress and behaviour</h2><ul><li>Cover shoulders and knees in villages and towns.</li><li>Ask before taking photos of people.</li><li>Buy crafts rather than handing out money or sweets to children.</li></ul>
<h2>What to pack</h2><ul><li>Reef-safe sunscreen, hat and sunglasses</li><li>Sandals with grip and light walking shoes</li><li>Mosquito repellent and basic medicines (stomach, painkillers, motion sickness)</li><li>A light layer for the cool hills around Waikabubak</li><li>A sarong (useful in villages and on the beach)</li><li>Power bank, torch and refillable water bottle</li><li>Dry bag for boats and waterfalls</li></ul>
<p>Before you go, read {GD('health-safety', 'health and safety')} and {GD('respect-etiquette', 'etiquette')}.</p>"""},

{"s": "east-vs-west-sumba", "img": "puru-kambera", "t": "East or West Sumba? Which side to choose",
 "d": "The differences between East and West Sumba: landscapes, culture, beaches, weather, airports and which side suits your trip.",
 "faq": [
  ["Is East or West Sumba better?", "West Sumba has greener landscapes, more traditional villages and the famous beaches; East Sumba has the savanna hills, canyon waterfalls and ikat weaving. With five days or more, see both."]],
 "b": f"""<p>Sumba changes completely from one end to the other. If you only have a few days, choose one side; if you have five or more, see both by flying in and out of different airports.</p>
<h2>West Sumba (including Southwest and Central)</h2>
<ul><li><b>Landscape:</b> greener, with rice terraces, forests and hills.</li><li><b>Culture:</b> the densest concentration of traditional villages and megalithic tombs, and the Pasola.</li><li><b>Highlights:</b> {PL('weekuri-lagoon', 'Weekuri')}, {PL('mandorak-beach', 'Mandorak')}, {PL('ratenggaro', 'Ratenggaro')}, {PL('lapopu-waterfall', 'Lapopu')}, {PL('marosi-beach', 'Marosi')}.</li><li><b>Airport:</b> Tambolaka (TMC).</li></ul>
<h2>East Sumba</h2>
<ul><li><b>Landscape:</b> dry savanna, limestone hills and canyons; golden in the dry season.</li><li><b>Culture:</b> royal villages and the island's most famous ikat weaving.</li><li><b>Highlights:</b> {PL('wairinding-hill', 'Wairinding')}, {PL('tanggedu-waterfall', 'Tanggedu')}, {PL('walakiri-beach', 'Walakiri')}, {PL('puru-kambera', 'Puru Kambera')}, {PL('prailiu-village', 'Prailiu')}.</li><li><b>Airport:</b> Waingapu (WGP).</li></ul>
<h2>Which to choose</h2>
<p>Choose the west for culture and beaches, the east for landscapes and weaving. With five days or more, do both with our {GD('itinerary-5-days', '5-day route')}.</p>"""},

{"s": "is-sumba-worth-it", "img": "pero-beach", "t": "Is Sumba worth visiting? An honest answer",
 "d": "The good and the hard parts of travelling in Sumba, who will love it and who should choose somewhere else.",
 "faq": [
  ["Is Sumba worth it compared with Bali?", "For culture, empty landscapes and adventure, yes. For comfort, food, nightlife and short transfers, Bali is easier."]],
 "b": f"""<p>Sumba has been called one of the best places to visit in Asia, and photos of its lagoons and villages travel fast on social media. But is it right for you?</p>
<h2>Why you will love it</h2><ul><li>Living traditions you will not see anywhere else.</li><li>Empty beaches and wild landscapes.</li><li>Very few tourists, even in high season.</li><li>An hour from Bali by plane.</li></ul>
<h2>What is hard</h2><ul><li>Long, slow drives between sights.</li><li>Few restaurants and simple accommodation outside the towns and resorts.</li><li>Limited healthcare and patchy signal.</li><li>Requests for money in some villages, which can be uncomfortable.</li></ul>
<h2>Who should go</h2><p>Curious travellers who like culture and nature, are happy with simple comforts and can travel slowly. Families with older children who enjoy the outdoors.</p>
<h2>Who should choose somewhere else</h2><p>Travellers who want nightlife, varied food, quick transfers or easy access to hospitals.</p>
<p>Still unsure? Read our {GD('sumba-vs-bali', 'Sumba or Bali comparison')} and the full {GD('sumba-travel-guide', 'Sumba travel guide')}.</p>"""},

{"s": "sumba-north-coast", "img": "mamboro-savanna", "t": "Sumba's north coast: Mamboro, savanna and empty beaches",
 "d": "The quiet north coast of Central and East Sumba: the Mamboro savanna, Kapulit, Mananga, Karendi and Lenang beaches, Napu and Wunga.",
 "faq": [
  ["How do you get to Mamboro?", "Mamboro is on the north coast of Central Sumba, reached by road from Waibakul. Tambolaka airport is the closest for most visitors."]],
 "b": f"""<p>Most visitors stick to the south-west and the east. The north coast, facing the calm Sumba Strait towards Flores, is a different Sumba: dry savanna, fishing villages and beaches where you are usually alone.</p>
<h2>Mamboro and Central Sumba's north coast</h2>
<p>The {PL('mamboro-savanna', 'Mamboro savanna')} rolls down to the sea around the villages of Mamboro and Wendewa. Nearby are {PL('kapulit-beach', 'Kapulit')}, a wide white beach with gentle waves, {PL('mananga-beach', 'Mananga')}, where fishermen land their boats across a small lagoon, and {PL('karendi-beach', 'Karendi')}, with river mouths, casuarinas and Second World War cannons. Further east, {PL('lenang-beach', 'Lenang')} combines calm water, mangroves and traditional salt-making. See the full <a href="/{{l}}/mamboro/">top 10 around Mamboro</a>.</p>
<h2>East Sumba's north coast</h2>
<p>The {PL('napu-valley', 'Napu valley')} and the village of {PL('wunga-village', 'Wunga')} sit on the driest, most remote stretch of the island, where tradition says the first ancestors arrived.</p>
<h2>Tips</h2><ul><li>The north coast is calmer than the south: better for swimming and snorkelling.</li><li>There are almost no shops; bring water, food and fuel.</li><li>Light is spectacular early and late in the day.</li></ul>"""},
]
