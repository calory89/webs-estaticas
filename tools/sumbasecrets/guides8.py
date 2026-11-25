# 25-nov-2026 · Batch 8: Indonesian-market pages (actions 31, 33, 34, 35 of claude/sumbasecrets-100-competencia-25nov.md).
# Indonesian is written natively ("id_native"); English is the base for the other languages.
# Prices are only those published by named sources, with the source and a warning that they change. No hotel names, no em dashes.
from guides4 import PL, GD, _km, _drive, TMC, WGP
from guides7 import SRC, SRC_ID, G

LL = {"weekuri-lagoon": [-9.49109, 118.95983], "ratenggaro": [-9.63019, 119.00037], "tarung-village": [-9.63234, 119.40754],
      "lapopu-waterfall": [-9.67832, 119.49298], "wairinding-hill": [-9.67946, 120.10005], "walakiri-beach": [-9.62861, 120.42751],
      "puru-kambera": [-9.48493, 120.13265], "prailiu-village": [-9.65913, 120.27668], "mandorak-beach": [-9.49908, 118.9541]}
def D(a, b): return _drive(_km(a, LL[b] if isinstance(b, str) else b))
def DI(s): return s.replace(" h", " jam").replace(" min", " menit")

TOP = [("weekuri-lagoon", "Danau Weekuri", "laguna air asin di balik dinding karang, Sumba Barat Daya"),
       ("mandorak-beach", "Pantai Mandorak", "teluk kecil di antara tebing, dekat Weekuri"),
       ("ratenggaro", "Kampung Adat Ratenggaro", "rumah adat beratap menara dan kubur batu di tepi laut, Kodi"),
       ("wainyapu", "Kampung Wainyapu", "kampung adat besar di Kodi, salah satu lokasi Pasola"),
       ("pero-beach", "Pantai Pero", "pantai nelayan untuk sunset di Kodi"),
       ("watu-maladong", "Pantai Watu Maladong", "batu karang besar di pesisir barat daya"),
       ("tarung-village", "Kampung Tarung", "kampung adat di atas bukit di tengah Kota Waikabubak"),
       ("prai-ijing", "Kampung Prai Ijing", "kampung adat yang rapi dekat Waikabubak"),
       ("lapopu-waterfall", "Air Terjun Lapopu", "air terjun bertingkat di Sumba Tengah"),
       ("matayangu-waterfall", "Air Terjun Matayangu", "air terjun di tengah hutan, dekat Lapopu"),
       ("marosi-beach", "Pantai Marosi", "pantai pasir putih panjang di Lamboya, Sumba Barat"),
       ("pasunga-village", "Kampung Pasunga", "kubur batu megalitik terkenal di Anakalang"),
       ("mamboro-savanna", "Sabana Mamboro", "padang sabana pesisir utara Sumba Tengah"),
       ("wairinding-hill", "Bukit Wairinding", "bukit sabana paling terkenal di Sumba Timur"),
       ("puru-kambera", "Puru Kambera", "sabana dan pantai dengan kuda liar, Sumba Timur"),
       ("walakiri-beach", "Pantai Walakiri", "pohon bakau 'menari' saat sunset, Sumba Timur"),
       ("prailiu-village", "Kampung Prailiu", "kampung penenun ikat di Waingapu"),
       ("tanggedu-waterfall", "Air Terjun Tanggedu", "kolam-kolam di ngarai batu, Sumba Timur"),
       ("waimarang-waterfall", "Air Terjun Waimarang", "kolam hijau toska di Sumba Timur bagian selatan"),
       ("tarimbang-bay", "Pantai Tarimbang", "teluk selancar di pesisir selatan Sumba Timur")]

def _top_id():
    return "<ol>" + "".join(f"<li>{PL(s, n)}: {d}.</li>" for s, n, d in TOP) + "</ol>"
def _top_en():
    EN = {"weekuri-lagoon": "saltwater lagoon behind a coral wall", "mandorak-beach": "small cove between cliffs next to Weekuri", "ratenggaro": "tall-roofed village and stone tombs by the sea",
          "wainyapu": "large Kodi village and Pasola field", "pero-beach": "fishing beach for sunsets", "watu-maladong": "giant rock formations on the southwest coast",
          "tarung-village": "hilltop village in the middle of Waikabubak", "prai-ijing": "neat traditional village near Waikabubak", "lapopu-waterfall": "tiered waterfall in Central Sumba",
          "matayangu-waterfall": "forest waterfall near Lapopu", "marosi-beach": "long white-sand beach in Lamboya", "pasunga-village": "famous megalithic tombs in Anakalang",
          "mamboro-savanna": "coastal savannah on the north coast", "wairinding-hill": "the best-known savannah hill", "puru-kambera": "savannah and beach with wild horses",
          "walakiri-beach": "the 'dancing' mangroves at sunset", "prailiu-village": "ikat weaving village in Waingapu", "tanggedu-waterfall": "pools in a rock canyon",
          "waimarang-waterfall": "turquoise pool in southern East Sumba", "tarimbang-bay": "surf bay on the south coast"}
    return "<ol>" + "".join(f"<li>{PL(s, n)}: {EN[s]}.</li>" for s, n, d in TOP) + "</ol>"

GUIDES8 = [
G("tempat-wisata-sumba", "weekuri-lagoon", "20 best places to visit in Sumba (the list Indonesian travellers search for)",
  "The 20 most visited places in Sumba from west to east: lagoons, traditional villages, waterfalls, savannah hills and beaches, with links to maps and tips.",
  "<p>This is our list of the 20 places most visitors to Sumba look for, ordered from west to east so you can plan a route. Each name links to a page with the location on our map, photos and practical tips.</p><h2>The 20 places</h2>" + _top_en() +
  "<h2>How to plan</h2><ul><li>West (Kodi, Waikabubak): fly into Tambolaka.</li><li>East (Wairinding, Walakiri, Tanggedu): fly into Waingapu.</li><li>Both sides: allow five days or more; see " + GD("east-or-west-sumba", "east or west Sumba") + ".</li></ul>",
  [["What are the best places to visit in Sumba?", "Weekuri Lagoon, Ratenggaro, Mandorak, Tarung, Lapopu, Wairinding Hill, Walakiri Beach and Tanggedu are the most visited."]],
  {"t": "20 tempat wisata di Sumba yang paling populer (dari barat ke timur)",
   "d": "Daftar 20 tempat wisata Sumba dari barat ke timur: Danau Weekuri, Ratenggaro, Lapopu, Bukit Wairinding, Walakiri, Tanggedu dan lainnya, lengkap dengan peta dan tips.",
   "b": "<p>Berikut 20 tempat wisata di Sumba yang paling sering dicari wisatawan, diurutkan dari barat ke timur supaya mudah menyusun rute. Setiap nama terhubung ke halaman dengan lokasi di peta kami, foto dan tips praktis.</p><h2>Daftar tempat wisata</h2>" + _top_id() +
   "<h2>Tips menyusun rute</h2><ul><li><b>Sumba bagian barat</b> (Kodi, Waikabubak): turun di Bandara Tambolaka.</li><li><b>Sumba Timur</b> (Wairinding, Walakiri, Tanggedu): turun di Bandara Waingapu.</li><li><b>Keliling dua sisi:</b> sediakan minimal lima hari, masuk lewat satu bandara dan pulang lewat bandara lain.</li><li>Tiket masuk biasanya berupa retribusi atau parkir yang dibayar tunai kepada warga; siapkan uang pecahan kecil.</li><li>Isi bensin dan ambil uang tunai di kota: Waingapu, Waikabubak, Tambolaka atau Waibakul.</li></ul>",
   "faq": [["Apa tempat wisata terbaik di Sumba?", "Danau Weekuri, Ratenggaro, Mandorak, Kampung Tarung, Air Terjun Lapopu, Bukit Wairinding, Pantai Walakiri dan Air Terjun Tanggedu termasuk yang paling banyak dikunjungi."], ["Berapa hari untuk keliling Sumba?", "Tiga hari cukup untuk satu sisi pulau; lima hari atau lebih untuk Sumba bagian barat dan Sumba Timur."]]}),
G("car-and-scooter-hire-sumba-prices", "mamboro-savanna", "Car and scooter hire in Sumba: what to expect and how to book",
  "Hiring a car with driver or a scooter in Sumba: why most visitors use a driver, what published prices look like, what is usually included and booking tips.",
  """<p>Public transport in Sumba is very limited, so almost every visitor hires a car with a driver or rides a scooter. This page covers what is usually included and what to ask. For safety on the road see """ + GD("rent-scooter-car-sumba", "renting a scooter or car") + """.</p>
<h2>Car with driver</h2><ul><li>The usual arrangement: a 5 to 7 seat car with a local driver for the day, picked up at the airport or your accommodation.</li><li>Ask whether fuel, the driver's meals and accommodation, parking and village contributions are included.</li><li>Published prices vary a lot by season, car and distance. The Indonesian travel site Hipwee quoted an average of about Rp 1.3 million per day in a backpacker guide; treat it as a rough reference, not a current price.</li><li>Agree the route and total price before you start, especially for long days to Tanggedu or the south coast.</li></ul>
<h2>Scooter</h2><ul><li>Cheaper and flexible for short trips around Waingapu, Waikabubak or Tambolaka.</li><li>Long distances, gravel and steep roads make a scooter tiring for cross-island trips.</li><li>You need a licence valid for motorcycles and a helmet.</li></ul>
<p>Our team will publish real 2026 prices collected in Tambolaka and Waingapu. Until then, compare at least two quotes.</p>""" + SRC(("Hipwee: backpacker guide to Sumba 4 days 3 nights", "https://www.hipwee.com/travel/panduan-backpacker-ke-sumba-4-hari-3-malam-cocok-buat-yang-hobi-berpetualang-dan-dompet-pas-pasan/"), ("Seek Sophie: driver and car hire in Sumba", "https://www.seeksophie.com/options/2030")),
  [["Do I need a driver in Sumba?", "Most visitors hire a car with a local driver because public transport is very limited and roads are long and poorly signposted."]],
  {"t": "Sewa mobil dan motor di Sumba: kisaran harga dan tips",
   "d": "Panduan sewa mobil dengan sopir dan sewa motor di Sumba: apa saja yang termasuk, kisaran harga yang pernah dipublikasikan, dan tips sebelum memesan.",
   "b": """<p>Transportasi umum di Sumba sangat terbatas, sehingga hampir semua wisatawan menyewa mobil dengan sopir atau motor.</p>
<h2>Sewa mobil dengan sopir</h2><ul><li>Biasanya mobil 5 sampai 7 kursi dengan sopir lokal, dijemput di bandara atau penginapan.</li><li>Tanyakan apakah harga sudah termasuk bensin, makan dan penginapan sopir, parkir serta retribusi kampung.</li><li>Harga sangat bervariasi menurut musim, jenis mobil dan jarak. Hipwee menyebut rata-rata sewa mobil sekitar Rp 1,3 juta per hari dalam panduan backpacker-nya; anggap ini sebagai acuan kasar, bukan harga terbaru.</li><li>Sepakati rute dan total harga sebelum berangkat, terutama untuk perjalanan jauh ke Tanggedu atau pesisir selatan.</li></ul>
<h2>Sewa motor</h2><ul><li>Lebih murah dan fleksibel untuk jalan-jalan dekat Waingapu, Waikabubak atau Tambolaka.</li><li>Untuk keliling pulau, jalan panjang, berbatu dan menanjak membuat motor cukup melelahkan.</li><li>Bawa SIM C dan selalu pakai helm.</li></ul>
<p>Tim kami akan menerbitkan harga sewa 2026 yang dikumpulkan langsung di Tambolaka dan Waingapu. Sementara itu, bandingkan minimal dua penawaran.</p>""" + SRC_ID(("Hipwee: panduan backpacker ke Sumba 4 hari 3 malam", "https://www.hipwee.com/travel/panduan-backpacker-ke-sumba-4-hari-3-malam-cocok-buat-yang-hobi-berpetualang-dan-dompet-pas-pasan/")),
   "faq": [["Berapa harga sewa mobil di Sumba?", "Bervariasi; Hipwee pernah menyebut rata-rata sekitar Rp 1,3 juta per hari dengan sopir. Selalu tanyakan apa saja yang termasuk."], ["Apakah perlu sopir di Sumba?", "Sangat disarankan karena jalan panjang, petunjuk arah minim dan transportasi umum terbatas."]]}),
G("sumba-3-days-2-nights", "weekuri-lagoon", "Sumba in 3 days and 2 nights (West Sumba from Tambolaka)",
  "A 3-day, 2-night Sumba itinerary from Tambolaka airport: Weekuri, Mandorak, Ratenggaro, Waikabubak's villages and Lapopu, with drive times from our map.",
  f"""<p>Three days is enough for the highlights of the west. Fly into Tambolaka (TMC). Drive times are estimates from our map data.</p>
<h2>Day 1: Kodi coast</h2><p>From the airport to {PL("weekuri-lagoon", "Weekuri")} (about {D(TMC, "weekuri-lagoon")}), then {PL("mandorak-beach", "Mandorak")} and sunset at {PL("pero-beach", "Pero")}.</p>
<h2>Day 2: villages</h2><p>{PL("ratenggaro", "Ratenggaro")} and {PL("wainyapu", "Wainyapu")} in the morning, then drive to Waikabubak for {PL("tarung-village", "Tarung")} and {PL("prai-ijing", "Prai Ijing")}.</p>
<h2>Day 3: waterfall and back</h2><p>{PL("lapopu-waterfall", "Lapopu")} in the morning, then back to Tambolaka (about {D(TMC, "lapopu-waterfall")}) for your flight.</p>
<p>Longer: {GD("itinerary-4-days", "4 days")} or {GD("itinerary-7-days-east-to-west", "7 days")}.</p>""",
  [["Is 3 days enough for Sumba?", "Three days is enough for the main sights of West and Southwest Sumba; the east needs extra days."]],
  {"t": "Itinerary Sumba 3 hari 2 malam (Sumba Barat dari Tambolaka)",
   "d": "Contoh itinerary Sumba 3 hari 2 malam dari Bandara Tambolaka: Danau Weekuri, Mandorak, Ratenggaro, kampung adat Waikabubak dan Air Terjun Lapopu.",
   "b": f"""<p>Tiga hari cukup untuk melihat tempat-tempat utama di Sumba bagian barat. Turun di Bandara Tambolaka (TMC). Waktu tempuh adalah perkiraan dari data peta kami.</p>
<h2>Hari 1: pesisir Kodi</h2><p>Dari bandara ke {PL("weekuri-lagoon", "Danau Weekuri")} (sekitar {DI(D(TMC, "weekuri-lagoon"))}), lanjut ke {PL("mandorak-beach", "Pantai Mandorak")} dan menikmati sunset di {PL("pero-beach", "Pantai Pero")}.</p>
<h2>Hari 2: kampung adat</h2><p>Pagi ke {PL("ratenggaro", "Ratenggaro")} dan {PL("wainyapu", "Wainyapu")}, lalu ke Waikabubak untuk {PL("tarung-village", "Kampung Tarung")} dan {PL("prai-ijing", "Prai Ijing")}.</p>
<h2>Hari 3: air terjun dan pulang</h2><p>Pagi ke {PL("lapopu-waterfall", "Air Terjun Lapopu")}, lalu kembali ke Tambolaka (sekitar {DI(D(TMC, "lapopu-waterfall"))}) untuk penerbangan pulang.</p>
<h2>Tips</h2><ul><li>Sewa mobil dengan sopir untuk tiga hari penuh.</li><li>Bawa uang tunai untuk retribusi kampung dan parkir.</li><li>Berpakaian sopan saat masuk kampung adat dan minta izin sebelum memotret.</li></ul>""",
   "faq": [["Apakah 3 hari cukup untuk Sumba?", "Cukup untuk tempat utama di Sumba Barat dan Sumba Barat Daya; Sumba Timur butuh tambahan hari."]]}),
G("sumba-4-days-3-nights-east", "wairinding-hill", "Sumba in 4 days and 3 nights (East Sumba from Waingapu)",
  "A 4-day, 3-night itinerary for East Sumba from Waingapu: Wairinding, Puru Kambera, Walakiri, Prailiu and Tanggedu, with drive times from our map.",
  f"""<p>East Sumba is the island of savannah, canyons and ikat. Fly into Waingapu (WGP). Drive times are estimates from our map data.</p>
<h2>Day 1: Waingapu</h2><p>Weavers at {PL("prailiu-village", "Prailiu")} and sunset at {PL("walakiri-beach", "Walakiri")} (about {D(WGP, "walakiri-beach")} from the airport).</p>
<h2>Day 2: savannah</h2><p>{PL("wairinding-hill", "Wairinding")} (about {D(WGP, "wairinding-hill")}) and {PL("puru-kambera", "Puru Kambera")}. See also {GD("tanarara-hills", "Tanarara")}.</p>
<h2>Day 3: Tanggedu</h2><p>A long day to {PL("tanggedu-waterfall", "Tanggedu")}; see {GD("waingapu-to-tanggedu-waterfall", "how to get there")}.</p>
<h2>Day 4: back</h2><p>{PL("brotherhood-hill", "Brotherhood Hill")} at sunrise, then your flight.</p>""",
  [["What can you see in 4 days in East Sumba?", "Wairinding, Puru Kambera, Walakiri, Prailiu and Tanggedu, with one long day for the waterfall."]],
  {"t": "Itinerary Sumba Timur 4 hari 3 malam dari Waingapu",
   "d": "Contoh itinerary Sumba Timur 4 hari 3 malam: Bukit Wairinding, Puru Kambera, Pantai Walakiri, Kampung Prailiu dan Air Terjun Tanggedu, dengan perkiraan waktu tempuh.",
   "b": f"""<p>Sumba Timur adalah wilayah sabana, ngarai dan tenun ikat. Turun di Bandara Umbu Mehang Kunda, Waingapu (WGP). Waktu tempuh adalah perkiraan dari data peta kami.</p>
<h2>Hari 1: Waingapu</h2><p>Melihat penenun di {PL("prailiu-village", "Kampung Prailiu")} dan sunset di {PL("walakiri-beach", "Pantai Walakiri")} (sekitar {DI(D(WGP, "walakiri-beach"))} dari bandara).</p>
<h2>Hari 2: sabana</h2><p>{PL("wairinding-hill", "Bukit Wairinding")} (sekitar {DI(D(WGP, "wairinding-hill"))}) dan {PL("puru-kambera", "Puru Kambera")}. Bisa juga ke {GD("tanarara-hills", "Bukit Tanarara")}.</p>
<h2>Hari 3: Tanggedu</h2><p>Perjalanan panjang ke {PL("tanggedu-waterfall", "Air Terjun Tanggedu")}; berangkat pagi dan bawa bekal.</p>
<h2>Hari 4: pulang</h2><p>Sunrise di {PL("brotherhood-hill", "Bukit Persaudaraan")}, lalu ke bandara.</p>
<h2>Tips</h2><ul><li>Musim kemarau sabana berwarna keemasan; musim hujan hijau tetapi jalan ke Tanggedu bisa sulit.</li><li>Di Bukit Wairinding warga kadang menyewakan kain tenun untuk berfoto.</li></ul>""",
   "faq": [["Apa saja yang bisa dilihat dalam 4 hari di Sumba Timur?", "Bukit Wairinding, Puru Kambera, Pantai Walakiri, Kampung Prailiu dan Air Terjun Tanggedu."]]}),
G("sumba-holiday-cost-from-jakarta", "walakiri-beach", "How much does a trip to Sumba cost from Jakarta?",
  "What a Sumba holiday costs for Indonesian travellers: published flight prices from Jakarta, the ferry alternative, driver hire and what else to budget for.",
  """<p>The biggest costs of a Sumba trip from Jakarta are the flight and the car with driver. Here are the figures published by travel sites; prices change, so check before you book. For international visitors see """ + GD("sumba-trip-cost", "the cost of a trip to Sumba") + """.</p>
<h2>Flights</h2><ul><li>IndonesiaJuara gives about 4 h 50 min from Jakarta (CGK) to Tambolaka including a stop in Bali, from about Rp 1.9 million, and from about Rp 3 million to Waingapu.</li><li>Rome2rio estimates Rp 1.9 to 3.3 million for the flight.</li></ul>
<h2>The overland alternative</h2><p>Rome2rio estimates around Rp 1 to 1.3 million by train, bus and ferry, but the journey takes about four days.</p>
<h2>On the island</h2><ul><li>Car with driver: the largest daily cost; see """ + GD("car-and-scooter-hire-sumba-prices", "car and scooter hire") + """.</li><li>Village contributions and parking, paid in cash.</li><li>Food: simple local warung meals are inexpensive.</li></ul>""" + SRC(("IndonesiaJuara: how to get to Sumba", "https://indonesiajuara.asia/en/how-to-get-to-sumba"), ("Rome2rio: Jakarta to Sumba", "https://www.rome2rio.com/s/Jakarta/Sumba")),
  [["How much is a flight from Jakarta to Sumba?", "Published estimates start at about Rp 1.9 million to Tambolaka via Bali; prices change with the season."]],
  {"t": "Biaya liburan ke Sumba dari Jakarta: tiket pesawat, sewa mobil dan lainnya",
   "d": "Berapa biaya liburan ke Sumba? Kisaran harga tiket pesawat dari Jakarta, alternatif kapal, sewa mobil dengan sopir dan pengeluaran lain yang perlu disiapkan.",
   "b": """<p>Pengeluaran terbesar liburan ke Sumba dari Jakarta adalah tiket pesawat dan sewa mobil dengan sopir. Berikut angka yang dipublikasikan situs perjalanan; harga bisa berubah, jadi cek kembali sebelum memesan.</p>
<h2>Tiket pesawat</h2><ul><li>Menurut IndonesiaJuara, penerbangan Jakarta (CGK) ke Tambolaka dengan transit di Bali memakan waktu sekitar 4 jam 50 menit, mulai sekitar Rp 1,9 juta; ke Waingapu mulai sekitar Rp 3 juta.</li><li>Rome2rio memperkirakan Rp 1,9 sampai 3,3 juta.</li></ul>
<h2>Alternatif jalur darat dan laut</h2><p>Rome2rio memperkirakan sekitar Rp 1 sampai 1,3 juta dengan kereta, bus dan kapal, tetapi perjalanannya sekitar empat hari.</p>
<h2>Selama di Sumba</h2><ul><li><b>Sewa mobil dengan sopir:</b> pengeluaran harian terbesar.</li><li><b>Retribusi kampung dan parkir:</b> dibayar tunai.</li><li><b>Makan:</b> warung lokal relatif murah.</li><li><b>Bensin:</b> isi penuh di kota karena SPBU jarang di luar kota.</li></ul>
<h2>Tips hemat</h2><ul><li>Pesan tiket jauh hari dan hindari musim libur.</li><li>Berbagi mobil dengan teman agar biaya sopir lebih ringan.</li><li>Pilih satu sisi pulau jika waktu terbatas.</li></ul>""" + SRC_ID(("IndonesiaJuara: cara ke Sumba", "https://indonesiajuara.asia/en/how-to-get-to-sumba"), ("Rome2rio: Jakarta ke Sumba", "https://www.rome2rio.com/s/Jakarta/Sumba")),
   "faq": [["Berapa harga tiket pesawat Jakarta ke Sumba?", "Perkiraan yang dipublikasikan mulai sekitar Rp 1,9 juta ke Tambolaka dengan transit di Bali; harga berubah sesuai musim."], ["Apakah ada kapal dari Jakarta ke Sumba?", "Tidak langsung; bisa dengan kombinasi kereta, bus dan kapal, sekitar empat hari perjalanan."]]}),
]
