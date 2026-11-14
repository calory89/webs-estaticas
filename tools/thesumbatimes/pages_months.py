# -*- coding: utf-8 -*-
"""Month pages for The Sumba Times: /LANG/sumba-in/<month>/ (12 per language) and the index /LANG/sumba-in/.
Built by build.py when this module is in MODULES: pages_months.build(globals()).
Each page: west vs east data table, a native text per month, FAQPage + BreadcrumbList JSON-LD; the index carries a Dataset JSON-LD."""
import json, html

BASE = "https://thesumbatimes.com"
SLUGS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
SITEMAP = ["/{l}/sumba-in/"] + ["/{l}/sumba-in/" + s + "/" for s in SLUGS]
CSS = """.mo td,.mo th{padding:9px 8px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}.mo th{font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
.mo td:first-child{font-weight:700}.mo caption{caption-side:bottom;text-align:left;font-size:13px;color:var(--muted);padding-top:8px}
.mo-nav{display:flex;justify-content:space-between;gap:12px;margin:22px 0;font-weight:700}.mo-nav a{text-decoration:none}
.mo-all{list-style:none;padding:0;margin:0 0 18px;display:flex;flex-wrap:wrap;gap:6px 14px}"""

# =====================================================================================================================
# DATA. Do not edit by hand: recompute from the source.
# =====================================================================================================================
SOURCE = "Open-Meteo archive (ERA5), 2015-2024 averages, computed by The Sumba Times"
SOURCE_URL = "https://open-meteo.com/en/docs/historical-weather-api"
# Daily series requested on 14 Nov 2026 from archive-api.open-meteo.com/v1/archive, 2015-01-01 to 2024-12-31, timezone Asia/Makassar,
# daily=temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset (3,653 days per point, no gaps).
#   west = Tambolaka, requested -9.41, 119.24 (grid cell returned: -9.385, 119.244, 56 m)
#   east = Waingapu,  requested -9.656, 120.264 (grid cell returned: -9.666, 120.288, 14 m)
# Per calendar month: tmax / tmin = mean of all daily maxima / minima (C); rain = mean monthly total (mm, rounded);
# days = mean number of days per month with 1 mm or more (rounded).
# sunrise / sunset = earliest and latest time in that month of 2023 (WITA), same API.
# sea = sea temperature near Waingapu as already published in our best-time guide (Climates to Travel).
MONTHS = [
 # month, west(tmax, tmin, rain, days), east(tmax, tmin, rain, days), west sun (rise a, rise b, set a, set b), east sun, sea
 (1,  (29.5, 24.8, 260, 27), (30.3, 24.5, 263, 26), ("05:46", "06:00", "18:26", "18:31"), ("05:41", "05:56", "18:22", "18:28"), 29.5),
 (2,  (29.0, 24.5, 260, 26), (29.8, 24.1, 251, 25), ("06:01", "06:06", "18:24", "18:31"), ("05:56", "06:02", "18:20", "18:27"), 29.0),
 (3,  (29.4, 24.4, 245, 28), (29.7, 24.2, 251, 27), ("06:06", "06:07", "18:07", "18:23"), ("06:02", "06:02", "18:03", "18:19"), 29.5),
 (4,  (29.7, 24.1, 175, 24), (29.6, 23.9, 139, 18), ("06:06", "06:06", "17:53", "18:07"), ("06:02", "06:02", "17:49", "18:03"), 29.5),
 (5,  (30.0, 23.6, 67, 18),  (29.8, 23.6, 36, 9),   ("06:06", "06:12", "17:49", "17:53"), ("06:02", "06:08", "17:44", "17:49"), 28.5),
 (6,  (29.9, 22.8, 42, 13),  (29.6, 22.8, 21, 6),   ("06:12", "06:19", "17:49", "17:54"), ("06:08", "06:15", "17:44", "17:49"), 27.5),
 (7,  (29.7, 21.9, 38, 10),  (29.5, 22.0, 15, 4),   ("06:18", "06:20", "17:54", "18:00"), ("06:14", "06:16", "17:49", "17:55"), 27.0),
 (8,  (30.0, 21.7, 27, 9),   (30.1, 21.9, 10, 4),   ("06:06", "06:18", "18:00", "18:01"), ("06:02", "06:14", "17:56", "17:57"), 26.5),
 (9,  (30.7, 22.4, 36, 11),  (31.1, 22.6, 17, 4),   ("05:48", "06:05", "17:58", "18:01"), ("05:43", "06:01", "17:54", "17:56"), 27.0),
 (10, (31.5, 23.6, 78, 14),  (31.9, 23.7, 43, 9),   ("05:33", "05:47", "17:57", "17:59"), ("05:29", "05:43", "17:53", "17:55"), 28.0),
 (11, (31.4, 24.9, 117, 21), (31.7, 24.7, 123, 18), ("05:31", "05:33", "17:59", "18:10"), ("05:26", "05:29", "17:56", "18:06"), 29.5),
 (12, (30.3, 24.9, 211, 25), (30.6, 24.7, 232, 25), ("05:33", "05:45", "18:10", "18:25"), ("05:28", "05:40", "18:07", "18:21"), 29.5),
]
YEAR_RAIN = {"west": sum(m[1][2] for m in MONTHS), "east": sum(m[2][2] for m in MONTHS)}   # 1556 and 1401 mm

# crowd level 1 (quiet) to 3 (busy), in general terms, consistent with the best-time guide
CROWD = [1, 2, 2, 1, 1, 2, 3, 3, 1, 1, 1, 2]
# place pages linked from each month (slugs in guides/g_places_*.py)
PLACES = [
 ["wairinding-hill", "walakiri-beach", "praijing-village", "waingapu-town"],
 ["kodi", "ratenggaro-village", "wainyapu-village", "tambolaka-town"],
 ["wanokaka-beach", "matayangu-waterfall", "wairinding-hill", "waikabubak-town"],
 ["wairinding-hill", "tanggedu-waterfall", "lapopu-waterfall", "marosi-beach"],
 ["lapopu-waterfall", "tanggedu-waterfall", "walakiri-beach", "tarimbang-beach"],
 ["weekuri-lagoon", "mandorak-beach", "pero-beach", "wairinding-hill"],
 ["weekuri-lagoon", "puru-kambera", "tarimbang-beach", "ratenggaro-village"],
 ["wairinding-hill", "puru-kambera", "walakiri-beach", "kerewe-beach"],
 ["puru-kambera", "wairinding-hill", "weekuri-lagoon", "pero-beach"],
 ["tarung-village", "pero-beach", "marosi-beach", "londa-lima-beach"],
 ["tarung-village", "wanokaka-beach", "walakiri-beach", "prailiu-village"],
 ["walakiri-beach", "wairinding-hill", "praijing-village", "waingapu-town"],
]
GUIDES = ["best-time-to-visit-sumba", "sumba-rainy-season", "surfing-in-sumba", "sumba-sunsets-sunrises", "pasola-2027-dates"]

UI = {
 "en": {"name": "Sumba month by month", "months": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  "title": "Sumba in {m}: weather, what's on and where to go", "desc": "Sumba in {m}: {rw} mm of rain in the west and {re} mm in the east on average, {tx} C by day, sunset around {ss} WITA. What is on, which coast to choose and what to pack.",
  "h_data": "{m} in numbers: west and east", "west": "West (Tambolaka)", "east": "East (Waingapu)",
  "r_tmax": "Average daytime high", "r_tmin": "Average night-time low", "r_rain": "Average rainfall", "r_days": "Days with rain (1 mm or more)", "r_rise": "Sunrise (WITA)", "r_set": "Sunset (WITA)", "r_sea": "Sea temperature", "r_crowd": "Visitors",
  "crowd": ["", "Quiet", "Moderate, busy on a few dates", "Busiest of the year"], "days_u": "{n} of {t}", "whole": "whole island",
  "note": "Source: {src}. Model reanalysis for the grid cell nearest each town, not a weather-station record: it reads wetter than the Waingapu station (about 810 mm a year in 1991-2020, against {ye} mm here) and counts many days of light rain. Use it to compare months and coasts. Sun times are for 2023 and shift by a minute or two between years. Sea temperature as in our best-time guide.",
  "h_w": "Weather in {m}", "h_s": "Sea, surf and waterfalls", "h_o": "What is on in {m}", "h_d": "West or east in {m}?", "h_c": "How busy it gets", "h_p": "What to pack", "h_pl": "Places that suit {m}", "h_more": "Keep planning", "faq": "Questions about Sumba in {m}",
  "prev": "Previous month", "next": "Next month", "all": "All twelve months", "events": "Events calendar",
  "q_rain": "How much does it rain in Sumba in {m}?", "a_rain": "On 2015-2024 averages, {m} brings about {rw} mm of rain on about {dw} days around Tambolaka in the west and about {re} mm on about {de} days around Waingapu in the east. These are model (ERA5) figures computed by The Sumba Times; the Waingapu weather station records lower totals.",
  "q_good": "Is {m} a good time to visit Sumba?", "q_sun": "What time are sunrise and sunset in Sumba in {m}?", "a_sun": "In Waingapu the sun rises between {r1} and {r2} and sets between {s1} and {s2} WITA in {m}. In the west, around Tambolaka, both come about four to five minutes later. Twilight is short, so it is dark some 20 minutes after sunset.",
  "q_on": "What is on in Sumba in {m}?",
  "i_title": "Sumba month by month: climate, events and where to go", "i_desc": "Twelve months of Sumba compared: temperature, rainfall and rainy days in the west and the east, sunrise and sunset, crowds and the best coast, from our own 2015-2024 data.",
  "i_dek": "One island, two coasts and twelve very different months. This table compares them with our own averages for Tambolaka and Waingapu; each month has its own page.",
  "i_h": "The twelve months compared", "i_c": ["Month", "High / low, west", "Rain, west", "High / low, east", "Rain, east", "Sunset, east", "Visitors"], "i_dn": "days",
  "i_how_h": "How to read the table", "i_how": "The dry season runs roughly from May to October and the rains from November or December to March, with April and November as turning months. Rain differs between coasts mainly from April to October, when the west keeps receiving showers that seldom reach Waingapu. Over the year the model gives {yw} mm around Tambolaka and {ye} mm around Waingapu. For the reasoning behind each recommendation, read our month-by-month guide to the best time to visit.",
  "ds_name": "Monthly climate averages for West and East Sumba, 2015-2024", "ds_desc": "Mean daily maximum and minimum temperature, mean monthly rainfall and mean number of days with 1 mm of rain or more for Tambolaka (west) and Waingapu (east), Sumba, Indonesia, aggregated per calendar month by The Sumba Times from the Open-Meteo archive (ERA5), 2015-2024, with sunrise and sunset ranges."},
 "es": {"name": "Sumba mes a mes", "months": ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  "title": "Sumba en {m}: tiempo, qué hacer y adónde ir", "desc": "Sumba en {m}: {rw} mm de lluvia de media en el oeste y {re} mm en el este, {tx} °C de día y puesta de sol hacia las {ss} WITA. Qué se celebra, qué costa elegir y qué llevar.",
  "h_data": "{M} en cifras: oeste y este", "west": "Oeste (Tambolaka)", "east": "Este (Waingapu)",
  "r_tmax": "Máxima media diurna", "r_tmin": "Mínima media nocturna", "r_rain": "Lluvia media", "r_days": "Días con lluvia (1 mm o más)", "r_rise": "Salida del sol (WITA)", "r_set": "Puesta de sol (WITA)", "r_sea": "Temperatura del mar", "r_crowd": "Visitantes",
  "crowd": ["", "Poca gente", "Afluencia media, alta en fechas concretas", "La mayor del año"], "days_u": "{n} de {t}", "whole": "toda la isla",
  "note": "Fuente: {src}. Son datos de reanálisis para la celda del modelo más próxima a cada ciudad, no registros de una estación meteorológica: dan más lluvia que la estación de Waingapu (unos 810 mm al año en 1991-2020, frente a los {ye} mm de esta tabla) y cuentan muchos días de lluvia débil. Sirven para comparar meses y costas. Las horas del sol corresponden a 2023 y varían uno o dos minutos de un año a otro. La temperatura del mar es la de nuestra guía sobre la mejor época.",
  "h_w": "El tiempo en {m}", "h_s": "Mar, surf y cascadas", "h_o": "Qué se celebra en {m}", "h_d": "¿Oeste o este en {m}?", "h_c": "Cuánta gente hay", "h_p": "Qué llevar", "h_pl": "Lugares para {m}", "h_more": "Para seguir planificando", "faq": "Preguntas sobre Sumba en {m}",
  "prev": "Mes anterior", "next": "Mes siguiente", "all": "Los doce meses", "events": "Calendario de eventos",
  "q_rain": "¿Cuánto llueve en Sumba en {m}?", "a_rain": "Con las medias de 2015-2024, en {m} caen unos {rw} mm en unos {dw} días en la zona de Tambolaka, al oeste, y unos {re} mm en unos {de} días en la de Waingapu, al este. Son cifras de un modelo (ERA5) calculadas por The Sumba Times; la estación meteorológica de Waingapu registra totales más bajos.",
  "q_good": "¿Es {m} un buen mes para viajar a Sumba?", "q_sun": "¿A qué hora sale y se pone el sol en Sumba en {m}?", "a_sun": "En Waingapu, en {m} el sol sale entre las {r1} y las {r2} y se pone entre las {s1} y las {s2} WITA. En el oeste, en torno a Tambolaka, lo hace unos cuatro o cinco minutos más tarde. El crepúsculo es breve: unos 20 minutos después de la puesta ya es de noche.",
  "q_on": "¿Qué se celebra en Sumba en {m}?",
  "i_title": "Sumba mes a mes: clima, fiestas y adónde ir", "i_desc": "Los doce meses de Sumba, comparados: temperatura, lluvia y días de lluvia en el oeste y en el este, horas de sol, afluencia y la mejor costa, con datos propios de 2015-2024.",
  "i_dek": "Una isla, dos costas y doce meses muy distintos. Esta tabla los compara con nuestras propias medias para Tambolaka y Waingapu; cada mes tiene su página.",
  "i_h": "Los doce meses, comparados", "i_c": ["Mes", "Máx. / mín., oeste", "Lluvia, oeste", "Máx. / mín., este", "Lluvia, este", "Puesta de sol, este", "Visitantes"], "i_dn": "días",
  "i_how_h": "Cómo leer la tabla", "i_how": "La estación seca va, a grandes rasgos, de mayo a octubre, y las lluvias, de noviembre o diciembre a marzo; abril y noviembre son meses de transición. La diferencia entre costas se nota sobre todo de abril a octubre, cuando en el oeste siguen cayendo chubascos que rara vez llegan a Waingapu. En el conjunto del año, el modelo da {yw} mm en la zona de Tambolaka y {ye} mm en la de Waingapu. Las razones de cada recomendación están en nuestra guía mes a mes sobre la mejor época para viajar.",
  "ds_name": "Medias climáticas mensuales del oeste y el este de Sumba, 2015-2024", "ds_desc": "Temperatura máxima y mínima diaria media, lluvia mensual media y número medio de días con 1 mm o más de lluvia en Tambolaka (oeste) y Waingapu (este), Sumba, Indonesia, agregados por mes por The Sumba Times a partir del archivo de Open-Meteo (ERA5), 2015-2024, con los intervalos de salida y puesta del sol."},
 "id": {"name": "Sumba bulan demi bulan", "months": ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"],
  "title": "Sumba pada {m}: cuaca, acara, dan tempat tujuan", "desc": "Sumba pada {m}: rata-rata hujan {rw} mm di barat dan {re} mm di timur, suhu siang {tx} °C, matahari terbenam sekitar pukul {ss} WITA. Acara, pilihan pesisir, dan bekal yang perlu dibawa.",
  "h_data": "{m} dalam angka: barat dan timur", "west": "Barat (Tambolaka)", "east": "Timur (Waingapu)",
  "r_tmax": "Rata-rata suhu tertinggi siang", "r_tmin": "Rata-rata suhu terendah malam", "r_rain": "Rata-rata curah hujan", "r_days": "Hari hujan (1 mm atau lebih)", "r_rise": "Matahari terbit (WITA)", "r_set": "Matahari terbenam (WITA)", "r_sea": "Suhu air laut", "r_crowd": "Pengunjung",
  "crowd": ["", "Sepi", "Sedang, ramai pada tanggal tertentu", "Paling ramai sepanjang tahun"], "days_u": "{n} dari {t}", "whole": "seluruh pulau",
  "note": "Sumber: {src}. Angka ini hasil reanalisis model untuk sel grid terdekat dari tiap kota, bukan catatan stasiun cuaca: nilainya lebih basah daripada catatan stasiun Waingapu (sekitar 810 mm per tahun pada 1991-2020, sedangkan di tabel ini {ye} mm) dan menghitung banyak hari dengan hujan ringan. Gunakan untuk membandingkan bulan dan pesisir. Waktu matahari mengacu pada 2023 dan bergeser satu-dua menit dari tahun ke tahun. Suhu air laut mengikuti panduan waktu terbaik kami.",
  "h_w": "Cuaca pada {m}", "h_s": "Laut, ombak, dan air terjun", "h_o": "Acara pada {m}", "h_d": "Barat atau timur pada {m}?", "h_c": "Seberapa ramai", "h_p": "Bekal yang perlu dibawa", "h_pl": "Tempat yang cocok pada {m}", "h_more": "Lanjutkan perencanaan", "faq": "Pertanyaan tentang Sumba pada {m}",
  "prev": "Bulan sebelumnya", "next": "Bulan berikutnya", "all": "Kedua belas bulan", "events": "Kalender acara",
  "q_rain": "Seberapa sering hujan di Sumba pada {m}?", "a_rain": "Menurut rata-rata 2015-2024, pada {m} turun sekitar {rw} mm hujan dalam kira-kira {dw} hari di sekitar Tambolaka (barat) dan sekitar {re} mm dalam kira-kira {de} hari di sekitar Waingapu (timur). Angka ini berasal dari model (ERA5) yang diolah The Sumba Times; stasiun cuaca Waingapu mencatat jumlah yang lebih rendah.",
  "q_good": "Apakah {m} waktu yang baik untuk ke Sumba?", "q_sun": "Pukul berapa matahari terbit dan terbenam di Sumba pada {m}?", "a_sun": "Di Waingapu, pada {m} matahari terbit antara pukul {r1} dan {r2} serta terbenam antara pukul {s1} dan {s2} WITA. Di barat, sekitar Tambolaka, waktunya kira-kira empat sampai lima menit lebih lambat. Senja berlangsung singkat: sekitar 20 menit setelah matahari terbenam hari sudah gelap.",
  "q_on": "Ada acara apa di Sumba pada {m}?",
  "i_title": "Sumba bulan demi bulan: iklim, acara, dan tempat tujuan", "i_desc": "Dua belas bulan di Sumba dibandingkan: suhu, curah hujan, dan hari hujan di barat dan timur, waktu matahari, keramaian, dan pesisir terbaik, dari data olahan kami 2015-2024.",
  "i_dek": "Satu pulau, dua pesisir, dan dua belas bulan yang sangat berbeda. Tabel ini membandingkannya dengan rata-rata olahan kami untuk Tambolaka dan Waingapu; tiap bulan punya halaman sendiri.",
  "i_h": "Perbandingan dua belas bulan", "i_c": ["Bulan", "Maks. / min., barat", "Hujan, barat", "Maks. / min., timur", "Hujan, timur", "Terbenam, timur", "Pengunjung"], "i_dn": "hari",
  "i_how_h": "Cara membaca tabel", "i_how": "Musim kemarau berlangsung kira-kira Mei sampai Oktober dan musim hujan November atau Desember sampai Maret, dengan April dan November sebagai masa peralihan. Perbedaan hujan antara kedua pesisir paling terasa pada April sampai Oktober, saat wilayah barat masih menerima hujan yang jarang sampai ke Waingapu. Dalam setahun, model mencatat {yw} mm di sekitar Tambolaka dan {ye} mm di sekitar Waingapu. Alasan di balik tiap saran kami ada di panduan bulan demi bulan tentang waktu terbaik berkunjung.",
  "ds_name": "Rata-rata iklim bulanan Sumba bagian barat dan timur, 2015-2024", "ds_desc": "Rata-rata suhu maksimum dan minimum harian, rata-rata curah hujan bulanan, dan rata-rata jumlah hari dengan hujan 1 mm atau lebih untuk Tambolaka (barat) dan Waingapu (timur), Sumba, Indonesia, diolah per bulan oleh The Sumba Times dari arsip Open-Meteo (ERA5), 2015-2024, beserta rentang waktu matahari terbit dan terbenam."},
}

# =====================================================================================================================
# TEXTS. One dict per month and language: v = verdict (also the answer to "is it a good time"), w = weather, s = sea,
# o = what is on, d = which side, c = crowds, p = packing. Facts follow the best-time, rainy-season, surf and sunsets guides
# and pages_live.EVENTS; numbers follow MONTHS above.
# =====================================================================================================================
T = {}
T["en"] = [
 {"v": "January is Sumba at its wettest and greenest. It suits flexible travellers who want empty roads, deep green hills and full waterfalls, and who can live with rain on most days and a slower itinerary.",
  "w": "The north-west monsoon is fully in charge. Our 2015-2024 averages put January at about 260 mm of rain around both Tambolaka and Waingapu, with rain on roughly 26 days out of 31, usually as heavy afternoon and night storms with bright spells in between. Days hover around 30 C and nights stay near 25 C, so it never really cools down. Rivers run high and brown, and dirt tracks to remote beaches and villages can be impassable for days.",
  "s": "The sea is warm, about 29.5 C, but this is the weak half of the surf year: swells are smaller and less clean and the wind turns west and north-west. The reefs of the south-east, around Kalala, are the better bet. Waterfalls are at their most powerful and often too muddy and too strong to swim near.",
  "o": "No fixed event falls in January. The first days of the month are the tail of the school break, which in East Nusa Tenggara runs to 2 January in 2027, and families fill the beaches near the towns. In the west people start to talk about the Pasola, but the Rato elders announce its dates only a few weeks ahead.",
  "d": "Neither coast escapes the rain this month: the figures for west and east are almost identical. Choose by road, not by sky. Stay near Waingapu or Waikabubak, where the main sights are on asphalt: the green folds of Wairinding, Walakiri at low tide, the hilltop villages around Waikabubak. Leave long detours such as Tarimbang for another season.",
  "c": "Outside New Year this is one of the quietest months of the year. Rooms and drivers are easy to find.",
  "p": "A proper rain jacket, a dry bag for camera and phone, sandals with grip, quick-drying clothes and plenty of repellent. Carry cash and build spare days into the plan."},
 {"v": "February is the month of the first Pasola. Come for the ritual, not for the weather: it rains almost as much as in January, and plans need slack.",
  "w": "About 250 to 260 mm falls on both coasts, on roughly 25 days, and February is on average the coolest of the wet months by day, at around 29 to 30 C. Storms tend to build after midday, which leaves many mornings usable. The island is intensely green and the waterfalls run at full force.",
  "s": "Sea about 29 C. Small, wind-affected surf continues, with west and north-west winds favouring sheltered or south-east facing breaks in East Sumba. On Pasola mornings the beaches of Kodi and Lamboya belong to the nyale ceremony, not to swimmers: at dawn the Rato gather the sea worms on the shore and read the coming harvest in them.",
  "o": "The Pasola opens in the west, in Lamboya (West Sumba) and with the first round in Kodi (Southwest Sumba). In 2026 the Kodi round began on 9 February and Lamboya followed on 10 February. The elders fix each date a few weeks ahead by the moon and the worms, so build in spare days and follow our Pasola calendar.",
  "d": "West, without hesitation. Fly to Tambolaka and base yourself between Kodi and Waikabubak, where the Pasola fields, Ratenggaro and the hill villages are all within a morning's drive. The east is just as wet and has no Pasola.",
  "c": "Quiet, except around the Pasola days, when rooms and cars in the west sell out and the fields fill with spectators. Keep to the edge of the crowd: the 2026 Pasola in Wanokaka was stopped after a brawl among spectators.",
  "p": "Rain gear and a dry bag, modest clothes for the villages (shoulders and knees covered), a hat for hours on an open field, small notes for donation books, and patience."},
 {"v": "March closes the Pasola season and shows the island at its greenest. Rain is still frequent, but showers shorten as the month goes on.",
  "w": "Averages are about 245 mm in the west and 250 mm in the east, with rain on some 27 days: March has as many wet days as January, even if the rain eases a little towards the end. Temperatures stay flat, around 29 to 30 C by day and 24 C at night. Hills that most visitors know as golden are the colour of young rice.",
  "s": "Sea about 29.5 C. Some surf guides rate the early season, from around March to June, as the cleanest, before the south-east trade winds strengthen. Waterfalls peak: Matayangu becomes a wall of water, reached by a muddy and slippery trail, while Lapopu runs brown and strong.",
  "o": "The second round of Pasola in Kodi and the Pasola of Wanokaka and Gaura, in West Sumba, close the season; in 2026 they ran from 9 to 14 March. In 2027 Idul Fitri falls on 10 and 11 March, in the middle of the Pasola weeks, and Good Friday on 26 March, so flights fill early around both.",
  "d": "West for the Pasola in the first half of the month. Afterwards the east is worth the crossing: this is the moment for green Wairinding and Tanarara, and the main road from Waikabubak to Waingapu is asphalt, about 130 km and 3.5 to 4.5 hours.",
  "c": "Busy in the west on Pasola days and around the 2027 holidays, calm otherwise.",
  "p": "As in February, plus shoes you do not mind ruining on waterfall trails and a spare memory card: green Sumba is very photogenic."},
 {"v": "April is the sweet spot many photographers pick: the hills are still green, the rain is clearly retreating and visitors are few.",
  "w": "The two coasts start to part ways. The west still averages about 175 mm on 24 days, while the east drops to about 140 mm on 18 days. Storms get shorter and the roads begin to dry out. Days are around 30 C and nights around 24 C.",
  "s": "The surf season starts as southern-hemisphere swells reach the south and west coasts, and forecast statistics for Marosi show April among its cleanest months. The sea is still about 29.5 C. Waterfalls keep their volume but begin to clear.",
  "o": "No traditional event has a fixed place in April, and that is part of its charm: villages receive visitors without ceremony crowds. Easter moves from year to year; in 2027 Good Friday is on 26 March and Easter Sunday on 28 March, so April 2027 brings no long weekend.",
  "d": "East for the driest version of green: Wairinding, Tanggedu and the north coast near Waingapu. West if waterfalls are the priority, since Lapopu and Matayangu are still full. A crossing from Tambolaka to Waingapu, 4 to 5 hours by car, shows both in one trip.",
  "c": "Low. One of the quietest months, and bookings are easy.",
  "p": "A light rain jacket, swimwear, sunscreen as the sun returns, repellent and footwear for wet trails."},
 {"v": "May is one of the best all-round months: dry-season skies arrive while the island is still partly green, and the holiday crowds have not.",
  "w": "Rain collapses in the east, to about 35 mm on 9 days. The west keeps about 65 mm on 18 days, mostly brief showers. Nights begin to cool, to around 23.5 C, while days stay near 30 C. The first gold appears on the eastern savanna and the valleys stay green.",
  "s": "Regular south-west groundswell and light early-season winds make this a strong surf month on the Kodi coast, in the Lamboya bays and at Tarimbang. Sea about 28.5 C. Lapopu and Tanggedu start to run clear and are safer to swim near than in the rains.",
  "o": "Ascension Day, a national holiday, falls on 6 May 2027. On the north coast the sun now sets far enough to the north-west to drop towards the sea off Walakiri and Puru Kambera, an effect that lasts until about August.",
  "d": "Both. If you must choose, the east is drier and sunnier and the west greener, with fuller waterfalls. A week is enough to cross from one airport to the other without rushing.",
  "c": "Modest. Availability is still that of the shoulder season.",
  "p": "A sun hat, sunscreen, a light layer for breezy evenings, swimwear and a thin rain shell for the west."},
 {"v": "June is the dry season in full: sunny, mild and easy. For a first visit it is hard to beat, especially in the first three weeks.",
  "w": "The east averages about 20 mm on 6 days and the west about 40 mm on 13 days, so a passing shower in the western hills is still possible. Days are near 30 C and nights about 23 C. June has the earliest sunsets of the year, around 17:45 to 17:50 WITA, so start early and be in place for the last light by 17:00.",
  "s": "Main surf season, with consistent swell on the south and west coasts and the south-east trade winds blowing offshore at many breaks. The sea cools to about 27.5 C. Weekuri Lagoon is at its best for swimming, and from June into July the sun sets right between the two cliffs at Mandorak.",
  "o": "Nothing fixed. Indonesian school holidays usually begin late in the month, and domestic travel picks up with them.",
  "d": "Both sides are at their best. Sunset hunters should favour the west coast in Kodi and the north coast near Waingapu, where the sun meets the water at this time of year; the eastern hills are superb at both ends of the day.",
  "c": "Rising. Book rooms and a car with driver ahead for the last week of June.",
  "p": "Sun protection, a windbreaker or light jumper for evenings and hilltops, water shoes for the lagoon and a torch, because darkness comes fast."},
 {"v": "July is peak season: reliably dry, pleasantly cool at night and the busiest month Sumba gets, which is still quiet by Bali standards.",
  "w": "About 15 mm on 4 days in the east and 40 mm on 10 days in the west. Nights are among the coolest of the year, about 22 C, and days stay around 29.5 C. The savanna yellows week by week under steady sunshine.",
  "s": "The heart of the swell season: big days suit only experienced surfers, and large swell also means strong currents on open beaches, so swim where locals do. Sea about 27 C. Sheltered spots such as Weekuri Lagoon and the shallows of Walakiri stay calm.",
  "o": "The school year in East Nusa Tenggara started on 13 July in 2026, so the first half of the month is holiday time. A Sandalwood horse parade with an ikat exhibition was held in East Sumba in July in past years; the last edition we can document was in 2019 and we have found no recent announcement, so do not plan a trip around it.",
  "d": "Either. The west combines surf, lagoons and the villages of Kodi; the east gives the wide-open savanna and the horses of Puru Kambera. With a week or more, do both.",
  "c": "The highest of the year, with foreign and Indonesian holidays overlapping. Flights and the island's limited rooms fill up: book cars and accommodation weeks ahead.",
  "p": "A warm layer for night and dawn, sun protection, lip balm for the wind and offline copies of everything you have booked."},
 {"v": "August is golden Sumba: the driest month, with the savanna fully turned and some of the best light of the year.",
  "w": "The east averages about 10 mm and 4 wet days, the west about 25 mm and 9. Nights drop to around 22 C, the lowest of the year, and days hold at 30 C. The south-east trade winds blow and the grass hisses dry on every hill.",
  "s": "The sea is at its coolest, about 26.5 C. Surf stays consistent, and mornings are the cleanest window before the breeze picks up. Waterfalls are lower but clear, and some in the interior can almost dry up.",
  "o": "Independence Day, 17 August, is a national holiday marked across the island. The West Sumba Cultural Arts Festival, an annual programme of performances, traditional food and crafts with free admission, ran from 25 to 29 August in 2026.",
  "d": "East for the classic image: Wairinding, Puru Kambera with its free-roaming horses, and Walakiri when low tide meets sunset. The west is at its driest too, and good for beaches and villages.",
  "c": "Still high, with rooms and cars booked well ahead. In August scooters can be reserved two weeks in advance.",
  "p": "Sunglasses, a scarf for dust on unpaved roads, a light jacket for dawn on the hills and a long lens if you photograph horses."},
 {"v": "September keeps the dry weather and loses the crowds. For golden landscapes without competition, it is the pick of the year.",
  "w": "About 15 mm on 4 days in the east and 35 mm on 11 days in the west. Heat builds: days reach about 31 C and nights about 22.5 C. The grass is brittle, and late afternoons can be hazy from grass fires.",
  "s": "Sea about 27 C. Swell remains regular through the month. Smaller waterfalls in the interior can almost dry up; the bigger ones, such as Lapopu, run low but clear, with calm pools.",
  "o": "No fixed events. It is the last month before Wulla Poddu, the sacred month of the Marapu faith in West Sumba, which usually falls around October and November.",
  "d": "East for savanna and long empty roads, west for lagoon days and the Kodi sunsets. Sunrise moves earlier fast: by the end of the month it comes at about 05:45 in Waingapu, a gift for anyone climbing Wairinding or Tanarara at dawn.",
  "c": "Low once the holidays end, with good availability everywhere.",
  "p": "Hot-weather clothes, a hat, plenty of water in the car and a scarf or mask if smoke bothers you."},
 {"v": "October is the hottest and driest-looking month, loved by surfers and by anyone curious about Marapu ritual, less so by those who want green.",
  "w": "Days average about 31.5 to 32 C, the highest of the year, and the first storms return: about 80 mm on 14 days in the west and 45 mm on 9 days in the east, mostly late in the month and in the hills. Between storms the land is at its barest and dustiest.",
  "s": "Surfers often find glassy days and solid swells from October into December, with few people in the water. The sea warms to about 28 C.",
  "o": "Wulla Poddu, the holy month of the Marapu faith, usually falls around October and November in West Sumba: in the Loli villages (Tambera, Tarung, Bondo Maroto, Gollu), Lamboya, Wanokaka and Tana Righu. Work in the fields, funerals and parties are forbidden while it lasts, and it closes with Kalango Loddo, a night of dances and songs. Go with a guide and follow the villagers' lead.",
  "d": "The east stays dry for longer, so it is the safer choice for uninterrupted days. Choose the west if Wulla Poddu or surf is the reason for the trip, and expect the odd afternoon storm there.",
  "c": "Low. It is one of the quiet shoulder months.",
  "p": "The lightest clothes you own, serious sun protection, a rain shell from mid-month and modest dress for the villages."},
 {"v": "November is the turn of the season: hot, with the first real rain greening the hills within days. A quiet month for flexible travellers.",
  "w": "About 120 mm on both sides in our averages, on 18 to 21 days, first as short afternoon storms. In many years the east stays dry well into the month while the west breaks earlier. Days are around 31.5 C and nights around 25 C, the warmest of the year.",
  "s": "Sea about 29.5 C. Late-season surf can be clean and uncrowded, and around November and December the rights of Wanukaka tend to work on south-east swell, though the paddle-out crosses boulders.",
  "o": "Wulla Poddu continues in West Sumba and usually reaches its climax, Kalango Loddo, a night of dances and songs that runs into the morning. There are no national holidays this month.",
  "d": "East early in the month, while the dry weather lasts. In the west, plan the mornings outdoors and keep the afternoons loose.",
  "c": "Among the lowest of the year, with fewer visitors and lower prices.",
  "p": "The rain jacket again, a dry bag, repellent and light long sleeves for dusk."},
 {"v": "December brings regular rain and the Christmas holidays. It works for travellers who want green hills and a local, festive atmosphere, less for a first beach trip.",
  "w": "About 210 mm on 25 days in the west and 230 mm in the east. Rain becomes regular rather than occasional, and days ease to about 30.5 C. The hills are green again and the waterfalls refill.",
  "s": "Sea about 29.5 C. Surf slips into the wet-season pattern of smaller, less clean swell with westerly winds. After heavy rain, rivers colour the water near their mouths.",
  "o": "Christmas Day, 25 December, is a national holiday, and families come home to Sumba for it; in 2027 there is collective leave on Friday 24 December. The end-of-semester school break in East Nusa Tenggara runs from 21 December 2026 to 2 January 2027.",
  "d": "Stay close to the towns and the asphalt. The east has Walakiri and the hills within 45 minutes of Waingapu; the west has the villages around Waikabubak. Remote tracks become difficult.",
  "c": "Low until the school break starts, then busy with returning families; local beaches such as Walakiri fill at weekends. Book flights early.",
  "p": "Rain gear, a dry bag, repellent and enough cash to cover the holidays in case an ATM is empty or offline."},
]
