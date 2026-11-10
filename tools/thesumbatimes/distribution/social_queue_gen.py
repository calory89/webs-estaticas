# -*- coding: utf-8 -*-
import sys, os, re
ROOT = "/home/claude/webs-estaticas/tools/thesumbatimes"; sys.path.insert(0, ROOT)
import build as B
Q = [
 ("weekuri-lagoon", ["A lagoon the ocean fills through the rock.", "Una laguna que el océano llena a través de la roca.", "Laguna yang diisi laut lewat celah karang."], "#Weekuri #Kodi #SouthwestSumba"),
 ("pasola-2027-dates", ["Pasola 2027: no dates yet, and there is a reason.", "Pasola 2027: aún no hay fechas, y tiene su explicación.", "Pasola 2027: tanggalnya belum ada, dan memang begitu adatnya."], "#Pasola #Pasola2027 #Marapu"),
 ("wairinding-hill", ["Green in March, gold in August.", "Verde en marzo, dorada en agosto.", "Hijau pada Maret, keemasan pada Agustus."], "#Wairinding #Waingapu #EastSumba"),
 ("new-direct-flights-bali-waingapu", ["Bali to Waingapu without a stop, four times a week.", "De Bali a Waingapu sin escalas, cuatro veces por semana.", "Bali-Waingapu tanpa transit, empat kali seminggu."], "#Waingapu #TransNusa #BaliToSumba"),
 ("ratenggaro-village", ["You visit Ratenggaro as a guest, not as a spectator.", "A Ratenggaro se va como invitado, no como espectador.", "Datanglah ke Ratenggaro sebagai tamu, bukan penonton."], "#Ratenggaro #Kodi #Marapu"),
 ("walakiri-beach", ["Low tide and sunset: that is the whole secret of Walakiri.", "Marea baja y atardecer: ese es todo el secreto de Walakiri.", "Air surut dan matahari terbenam: itulah rahasia Walakiri."], "#Walakiri #Waingapu #EastSumba"),
 ("best-time-to-visit-sumba", ["The month you pick decides the Sumba you get.", "El mes que elijas decide la Sumba que vas a ver.", "Bulan yang Anda pilih menentukan Sumba yang Anda temui."], "#BestTimeToVisit #DrySeason #Pasola"),
 ("lapopu-waterfall", ["About 90 metres of falling water, a short walk from the road.", "Unos 90 metros de caída a un paseo de la carretera.", "Air terjun sekitar 90 meter, cukup jalan kaki singkat dari jalan."], "#Lapopu #Waikabubak #WestSumba"),
 ("sumba-ikat-weaving-where-to-buy", ["One cloth, up to a year of work.", "Una sola tela, hasta un año de trabajo.", "Selembar kain, hingga setahun pengerjaan."], "#Ikat #TenunIkat #Prailiu"),
 ("mandorak-beach", ["A cove small enough to miss, a kilometre from Weekuri.", "Una cala tan pequeña que pasa inadvertida, a un kilómetro de Weekuri.", "Teluk mungil yang mudah terlewat, sekitar satu kilometer dari Weekuri."], "#Mandorak #Kodi #SouthwestSumba"),
 ("el-nino-late-rainy-season-ntt-sumba-2026", ["The rains are running late this year.", "Este año las lluvias llegan tarde.", "Musim hujan tahun ini datang terlambat."], "#ElNino #BMKG #Weather"),
 ("praijing-village", ["A Marapu village that runs its own tourism.", "Un pueblo marapu que gestiona su propio turismo.", "Kampung Marapu yang mengelola wisatanya sendiri."], "#Praijing #Waikabubak #Marapu"),
 ("waimarang-waterfall", ["The turquoise pool is real. So is the climb back up.", "La poza turquesa existe. La cuesta de vuelta, también.", "Kolam toskanya nyata. Tanjakan pulangnya juga."], "#Waimarang #EastSumba #Waterfall"),
 ("sumba-horses-sandalwood-pony", ["Small, fast and present on every big day in Sumba.", "Pequeños, rápidos y presentes en cada gran día de Sumba.", "Kecil, cepat, dan selalu hadir pada hari-hari besar orang Sumba."], "#SandalwoodPony #Horses #Pasola"),
 ("puru-kambera", ["Horses on the savanna, then a calm beach.", "Caballos en la sabana y, después, una playa tranquila.", "Kuda di sabana, lalu pantai yang tenang."], "#PuruKambera #Waingapu #Savanna"),
 ("how-to-get-to-sumba-from-bali", ["Arrive at one end of the island, leave from the other.", "Llega por un extremo de la isla y sal por el otro.", "Tiba di satu ujung pulau, pulang dari ujung lainnya."], "#BaliToSumba #Tambolaka #Waingapu"),
 ("tanggedu-waterfall", ["Two hours by road, then a walk across the savanna.", "Dos horas de carretera y, después, una caminata por la sabana.", "Dua jam berkendara, lalu berjalan kaki melintasi sabana."], "#Tanggedu #EastSumba #Waterfall"),
 ("sumbanese-food", ["What Sumba really eats.", "Lo que de verdad se come en Sumba.", "Yang sehari-hari dimakan orang Sumba."], "#SumbaFood #Katemak #Coffee"),
 ("kodi", ["Where the tall roofs meet the Indian Ocean.", "Donde los tejados altos se asoman al Índico.", "Tempat atap menjulang bertemu Samudra Hindia."], "#Kodi #SouthwestSumba #Pasola"),
 ("east-sumba-visitor-numbers-2025", ["41,524 visits in a year: East Sumba in one number.", "41.524 visitas en un año: Sumba Oriental en una cifra.", "41.524 kunjungan dalam setahun: Sumba Timur dalam satu angka."], "#EastSumba #Tourism #Waingapu"),
 ("tarimbang-beach", ["Three hours of bends for a horseshoe bay.", "Tres horas de curvas para llegar a una bahía en herradura.", "Tiga jam jalan berkelok menuju teluk berbentuk tapal kuda."], "#Tarimbang #EastSumba #Surf"),
 ("sumba-facts-figures", ["Twice the size of Bali, with a fraction of the people.", "El doble de grande que Bali, con muchísima menos gente.", "Dua kali luas Bali, dengan penduduk jauh lebih sedikit."], "#SumbaFacts #Data #NTT"),
 ("rende-village", ["The old domain of the kings of Rindi, still lived in.", "El antiguo dominio de los reyes de Rindi sigue habitado.", "Bekas wilayah raja-raja Rindi yang masih dihuni."], "#Rende #EastSumba #Megalith"),
 ("surfing-in-sumba", ["Sumba's waves face the open Indian Ocean.", "Las olas de Sumba miran al Índico abierto.", "Ombak Sumba menghadap langsung ke Samudra Hindia."], "#SurfSumba #SurfIndonesia #IndianOcean"),
 ("watu-maladong-beach", ["Come at low tide. Do not swim.", "Ve con marea baja. Y no te bañes.", "Datanglah saat air surut. Jangan berenang."], "#WatuMaladong #Kodi #SouthwestSumba"),
 ("sumba-itinerary-5-7-10-days", ["5, 7 or 10 days: the route that never backtracks.", "5, 7 o 10 días: la ruta que no vuelve sobre sus pasos.", "5, 7, atau 10 hari: rute tanpa bolak-balik."], "#SumbaItinerary #RoadTrip #Tambolaka"),
 ("manupeu-tanah-daru-national-park", ["The forest of the Sumba hornbill.", "El bosque del cálao de Sumba.", "Hutan tempat hidup julang sumba."], "#Matalawa #NationalPark #Birdwatching"),
 ("ntt-foreign-arrivals-september-2026-west-sumba-hotels", ["Foreign arrivals to NTT rose 38.77% in September.", "Las llegadas de extranjeros a NTT subieron un 38,77% en septiembre.", "Kunjungan wisman ke NTT naik 38,77 persen pada September."], "#NTT #Tourism #WestSumba"),
 ("bawana-beach", ["The arch fell in 2020. The beach is still there.", "El arco cayó en 2020. La playa sigue ahí.", "Batu bolongnya runtuh pada 2020. Pantainya masih ada."], "#Bawana #Kodi #SouthwestSumba"),
 ("sumba-vs-bali-flores", ["Bali, Flores or Sumba? Three different trips.", "¿Bali, Flores o Sumba? Tres viajes distintos.", "Bali, Flores, atau Sumba? Tiga perjalanan yang berbeda."], "#Bali #Flores #Komodo"),
]
BASE_TAGS = {"en": "#Sumba #SumbaIsland #Indonesia #TravelIndonesia", "es": "#Sumba #IslaDeSumba #Indonesia #ViajarAIndonesia", "id": "#Sumba #PulauSumba #WisataSumba #NTT"}
BIO = {"en": "Full story at the link in our bio.", "es": "La información completa, en el enlace de la bio.", "id": "Selengkapnya lewat tautan di bio."}
READ = {"en": "Read it here:", "es": "Léelo aquí:", "id": "Baca selengkapnya:"}
NAME = {"en": "English", "es": "Español", "id": "Bahasa Indonesia"}
it = {a["slug"]: a for a in B.all_items()}
o = ["# The Sumba Times: 30-day social queue (Instagram, TikTok, Facebook)", "",
"Prepared on 10 November 2026 from the pages published on the site. Nothing here has been posted: Carlos posts from his own accounts.", "",
"## How to use it",
"- One place or story per day. Day 1 is whichever day you start; the order alternates places, stories and practical guides, west and east.",
"- **Instagram and TikTok:** paste the caption, then the hashtags. Links in captions are not clickable there, so the caption ends with the \"link in bio\" line: put that day's Instagram or TikTok URL in the profile link (or keep the profile link on the trip planner and add each post's URL to a link list).",
"- **Facebook:** paste the caption without the \"link in bio\" line, then the line \"Read it here:\" with the Facebook URL. Facebook shows the article card by itself. Use two or three hashtags at most there.",
"- One language per post. If you run a single account, post English on the day and repeat Spanish or Indonesian as a second post or as a carousel caption; with three accounts, use one language in each.",
"- **Photo:** where the site has its own licensed photo, the 1280 px file is listed. Check the credit and licence in the caption on the page and keep the credit in your post when the licence asks for it (CC BY and CC BY-SA do). Where it says \"own photo needed\", use a photo you took or have rights to. Never use a photo of a hotel.",
"- Every URL below was read from the built site (out/) and carries `utm_source` (instagram, tiktok or facebook), `utm_medium=social` and `utm_campaign=queue30`.",
"- Dated items (the news stories on days 4, 11, 20 and 28 and the Pasola page on day 2) should be checked against the live page before posting, in case the story has been updated.", ""]
for i, (slug, hooks, tags) in enumerate(Q, 1):
    a = it[slug]
    o.append(f"## Day {i}: {a['en']['title']}"); o.append("")
    h = open(os.path.join(B.OUT, B.url_of(a, "en").strip("/"), "index.html"), encoding="utf-8").read()
    own = re.search(r'/img/' + re.escape(B.img_key(a)) + r'-1280\.webp', h); im = B.img_of(a) if own else None
    if own: o.append(f"Photo: {B.BASE}{own.group(0)} (credit: {im.get('credit', 'see page')}, {im.get('license', 'see page')}{', AI illustration, say so' if im.get('ai') else ''})")
    else: o.append("Photo: own photo needed (the page has no photo of its own yet)")
    o.append("")
    for k, l in enumerate(B.LANGS):
        p = B.url_of(a, l); assert os.path.exists(os.path.join(B.OUT, p.strip("/"), "index.html")), p
        dek = a[l]["dek"].strip()
        o.append(f"**{NAME[l]}**"); o.append("")
        o.append(f"> {hooks[k]}"); o.append(">"); o.append(f"> {dek}"); o.append(">"); o.append(f"> {BIO[l]}"); o.append("")
        o.append(f"Hashtags: {BASE_TAGS[l]} {tags}")
        u = B.BASE + p + "?utm_source={s}&utm_medium=social&utm_campaign=queue30"
        o.append(f"- Instagram: {u.format(s='instagram')}"); o.append(f"- TikTok: {u.format(s='tiktok')}"); o.append(f"- Facebook ({READ[l]}) {u.format(s='facebook')}"); o.append("")
txt = "\n".join(o)
assert "—" not in txt and "–" not in txt
open(os.path.join(ROOT, "distribution", "social-queue.md"), "w", encoding="utf-8").write(txt + "\n")
print(len(Q), "days", len(txt), "chars", txt.count("utm_source="), "urls")
