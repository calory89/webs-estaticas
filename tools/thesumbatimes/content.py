# -*- coding: utf-8 -*-
# Content for The Sumba Times v1. Each article: section, slug, date, per-language title/dek/body(html)/sources.

LANGS = ["en", "es", "id"]

UI = {
 "en": {"tagline": "News, culture and travel from the island of Sumba, Indonesia",
        "sections": {"news":"News","getting-here":"Getting here","things-to-do":"Things to do & see","culture":"Tribes & culture","where-to-stay":"Where to stay","projects":"Projects","low-tide":"Low Tide"},
        "section_desc": {"news":"What is happening on Sumba: flights, roads, festivals and decisions that affect the island.",
                         "getting-here":"Flights, airports and practical advice for reaching Sumba and getting around.",
                         "things-to-do":"Beaches, lagoons, waterfalls and hills worth the drive.",
                         "culture":"Marapu, the Pasola, ikat weaving and the traditional villages of Sumba.",
                         "where-to-stay":"Every kind of place to sleep on the island, listed fairly.",
                         "projects":"What is being built on Sumba, by everyone.",
                         "low-tide":"A weekly letter about living well. No selling, ever."},
        "published_by":"Published by Eco Beach City","read":"Read","sources":"Sources","latest":"Latest",
        "top":"Top story","more":"More from The Sumba Times","home":"Home","lang_name":"English",
        "sub_title":"Low Tide, every Sunday","sub_text":"One short letter a week about living well, from an island with more horses than traffic lights. Free.",
        "sub_ph":"Your email","sub_btn":"Subscribe","sub_ok":"Thank you. The next letter will reach you on Sunday.","sub_err":"Something went wrong. Please try again.",
        "disclosure":"The Sumba Times is published by Eco Beach City, which operates Villa Eco Beach on Sumba. We cover the whole island, including other hotels and projects.",
        "privacy":"We only use your email to send the letter. Unsubscribe in one click.","updated":"Published","coming":"New stories are added every day."},
 "es": {"tagline": "Noticias, cultura y viajes desde la isla de Sumba, Indonesia",
        "sections": {"news":"Noticias","getting-here":"Cómo llegar","things-to-do":"Qué hacer y ver","culture":"Cultura y tradiciones","where-to-stay":"Dónde dormir","projects":"Proyectos","low-tide":"Marea baja"},
        "section_desc": {"news":"La actualidad de Sumba: vuelos, carreteras, fiestas y decisiones que afectan a la isla.",
                         "getting-here":"Vuelos, aeropuertos y consejos prácticos para llegar a Sumba y desplazarse por la isla.",
                         "things-to-do":"Playas, lagunas, cascadas y colinas que merecen el viaje.",
                         "culture":"El marapu, la Pasola, los tejidos ikat y los pueblos tradicionales de Sumba.",
                         "where-to-stay":"Todos los tipos de alojamiento de la isla, sin favoritismos.",
                         "projects":"Lo que se construye en Sumba, lo haga quien lo haga.",
                         "low-tide":"Una carta semanal sobre el arte de vivir bien. Nunca vendemos nada."},
        "published_by":"Publicado por Eco Beach City","read":"Leer más","sources":"Fuentes","latest":"Última hora",
        "top":"Noticia principal","more":"Más de The Sumba Times","home":"Portada","lang_name":"Español",
        "sub_title":"Marea baja, todos los domingos","sub_text":"Una carta breve a la semana sobre vivir bien, desde una isla con más caballos que semáforos. Gratis.",
        "sub_ph":"Tu correo electrónico","sub_btn":"Suscribirme","sub_ok":"Gracias. La próxima carta te llegará el domingo.","sub_err":"Algo ha fallado. Inténtalo de nuevo.",
        "disclosure":"The Sumba Times es una publicación de Eco Beach City, empresa que gestiona Villa Eco Beach en Sumba. Cubrimos toda la isla, incluidos otros hoteles y proyectos.",
        "privacy":"Solo usamos tu correo para enviarte la carta. Puedes darte de baja con un clic.","updated":"Publicado","coming":"Cada día publicamos noticias nuevas."},
 "id": {"tagline": "Berita, budaya, dan perjalanan dari Pulau Sumba, Indonesia",
        "sections": {"news":"Berita","getting-here":"Cara ke Sumba","things-to-do":"Wisata","culture":"Budaya & tradisi","where-to-stay":"Tempat menginap","projects":"Proyek","low-tide":"Air Surut"},
        "section_desc": {"news":"Kabar terkini dari Sumba: penerbangan, jalan, festival, dan kebijakan yang berdampak pada pulau ini.",
                         "getting-here":"Penerbangan, bandara, dan saran praktis untuk menuju Sumba dan berkeliling pulau.",
                         "things-to-do":"Pantai, laguna, air terjun, dan bukit yang layak dikunjungi.",
                         "culture":"Marapu, Pasola, tenun ikat, dan kampung adat Sumba.",
                         "where-to-stay":"Semua jenis penginapan di pulau ini, tanpa pilih kasih.",
                         "projects":"Semua yang sedang dibangun di Sumba, siapa pun pembangunnya.",
                         "low-tide":"Surat mingguan tentang menjalani hidup dengan baik. Tanpa promosi."},
        "published_by":"Diterbitkan oleh Eco Beach City","read":"Baca selengkapnya","sources":"Sumber","latest":"Terbaru",
        "top":"Berita utama","more":"Lainnya dari The Sumba Times","home":"Beranda","lang_name":"Bahasa Indonesia",
        "sub_title":"Air Surut, setiap Minggu","sub_text":"Satu surat singkat setiap minggu tentang menjalani hidup dengan baik, dari pulau yang punya lebih banyak kuda daripada lampu lalu lintas. Gratis.",
        "sub_ph":"Email Anda","sub_btn":"Berlangganan","sub_ok":"Terima kasih. Surat berikutnya akan sampai kepada Anda pada hari Minggu.","sub_err":"Terjadi kesalahan. Silakan coba lagi.",
        "disclosure":"The Sumba Times diterbitkan oleh Eco Beach City, yang mengelola Villa Eco Beach di Sumba. Kami meliput seluruh pulau, termasuk hotel dan proyek lain.",
        "privacy":"Email Anda hanya kami gunakan untuk mengirim surat ini. Anda bisa berhenti berlangganan dengan satu klik.","updated":"Terbit","coming":"Berita baru terbit setiap hari."},
}

S_FLIGHT = [("ANTARA News Bali, 17 Jul 2026","https://bali.antaranews.com/berita/409805/bandara-ngurah-rai-tambah-dua-rute-baru-ke-waingapu-dan-wakatobi"),
            ("Times Indonesia, 12 Jul 2026","https://timesindonesia.co.id/ekonomi/598638/transnusa-buka-rute-waingapudenpasar-bupati-sumba-timur-tantangannya-menjaga-penerbangan-tetap-beroperasi")]
S_GET = S_FLIGHT + [("Bali.live, Wings Air Bali-Sumba, 1 Aug 2024","https://bali.live/p/wings-air-takes-off-with-new-direct-flights-from-bali-to-sumba")]
S_PASOLA = [("Backindo, Pasola Festival guide","https://www.backindo.com/pasola-sumba"),("Explore Sumba, festivals","https://exploresumba.com/sumba-island-indonesia/festivals")]
S_CULT = [("Topologica, Sumba island guide","https://topologica.co/local-guides/indonesia/sumba-island-pasola-megaliths-guide")]
S_BEACH = [("Seek Sophie, Sumba guide","https://www.seeksophie.com/en/magazine/a/sumba-ultimate-guide"),("Topologica, Sumba island guide","https://topologica.co/local-guides/indonesia/sumba-island-pasola-megaliths-guide")]
S_STAY = [("BPS Provinsi NTT, Statistik Pariwisata (2024)","https://ntt.bps.go.id/"),("Dinas Pariwisata Sumba Barat Daya","https://dispar.sbdkab.go.id/")]

ARTICLES = []

ARTICLES.append({"section":"news","slug":"new-direct-flights-bali-waingapu","date":"2026-11-07",
"en":{"title":"Bali-Waingapu non-stop: what the TransNusa route means for East Sumba",
 "dek":"Since 15 July, East Sumba has a direct link to Bali four times a week. The hard part, says the regent, is keeping it.",
 "body":"""<p>For years, travelling from Bali to East Sumba meant a stop in Lombok or Kupang. Since <strong>15 July 2026</strong>, TransNusa flies <strong>Denpasar-Waingapu non-stop</strong>, four times a week: Tuesday, Wednesday, Friday and Saturday.</p>
<p>Bali's Ngurah Rai airport announced the route together with a new Bali-Wakatobi service, opened the next day. According to ANTARA, the Waingapu flight (8B-5652) leaves Bali at 08:19 local time and the return (8B-5653) lands back in Bali at 12:24, on a Comac ARJ-21 jet.</p>
<h2>Why the Bali-Waingapu flight matters</h2>
<p>West Sumba already had daily flights to Tambolaka. The east, with its savannas, Wairinding hill, Walakiri beach and Tanggedu waterfall, was harder to reach. A direct link makes a classic route possible: <strong>fly into one airport and out of the other</strong>, crossing the island by road.</p>
<h2>"The hard part is not the plane arriving"</h2>
<p>East Sumba's regent, Umbu Lili Pekuwali, welcomed the route but warned that the real challenge is keeping it running. The airport's general manager asked for support so the new flights last and grow.</p>
<h2>What it means</h2>

<p>In short: if you want the route to stay, use it. Schedules can change, so check the airline before you book.</p>"""},
"es":{"title":"Bali-Waingapu sin escalas: qué supone la ruta de TransNusa para Sumba",
 "dek":"Desde el 15 de julio, Sumba Oriental tiene vuelo directo a Bali cuatro veces por semana. Lo difícil, advierte el regente, será mantenerlo.",
 "body":"""<p>Durante años, viajar de Bali a Sumba Oriental obligaba a hacer escala en Lombok o Kupang. Desde el <strong>15 de julio de 2026</strong>, TransNusa vuela <strong>Denpasar-Waingapu sin escalas</strong> cuatro veces por semana: martes, miércoles, viernes y sábado.</p>
<p>El aeropuerto Ngurah Rai de Bali anunció la ruta junto con un nuevo vuelo Bali-Wakatobi, inaugurado al día siguiente. Según ANTARA, el vuelo a Waingapu (8B-5652) sale de Bali a las 08:19, hora local, y el de vuelta (8B-5653) llega a Bali a las 12:24, en un avión Comac ARJ-21.</p>
<h2>Por qué importa el vuelo Bali-Waingapu</h2>
<p>El oeste de Sumba ya tenía vuelos diarios a Tambolaka. El este, con sus sabanas, la colina de Wairinding, la playa de Walakiri y la cascada de Tanggedu, era de más difícil acceso. Con un vuelo directo se puede hacer la ruta clásica: <strong>entrar por un aeropuerto y salir por el otro</strong>, cruzando la isla por carretera.</p>
<h2>"Lo difícil no es que llegue el avión"</h2>
<p>El regente de Sumba Oriental, Umbu Lili Pekuwali, celebró la ruta, pero advirtió de que el verdadero reto es mantenerla. El director del aeropuerto pidió apoyo para que los nuevos vuelos se consoliden y crezcan.</p>
<h2>Qué significa</h2>

<p>En resumen: si quieres que la ruta se mantenga, utilízala. Los horarios pueden cambiar, así que confírmalos con la aerolínea antes de reservar.</p>"""},
"id":{"title":"Bali-Waingapu tanpa transit: arti rute TransNusa bagi Sumba Timur",
 "dek":"Sejak 15 Juli, Sumba Timur punya penerbangan langsung ke Bali empat kali seminggu. Tantangannya, kata bupati, adalah mempertahankannya.",
 "body":"""<p>Selama bertahun-tahun, perjalanan dari Bali ke Sumba Timur berarti transit di Lombok atau Kupang. Sejak <strong>15 Juli 2026</strong>, TransNusa terbang <strong>Denpasar-Waingapu tanpa transit</strong> empat kali seminggu: Selasa, Rabu, Jumat, dan Sabtu.</p>
<p>Bandara Ngurah Rai Bali mengumumkan rute ini bersama rute baru Bali-Wakatobi yang dibuka sehari kemudian. Menurut ANTARA, penerbangan ke Waingapu (8B-5652) berangkat dari Bali pukul 08.19 WITA dan penerbangan pulang (8B-5653) tiba di Bali pukul 12.24, dengan pesawat Comac ARJ-21.</p>
<h2>Mengapa penerbangan Bali-Waingapu penting</h2>
<p>Sumba bagian barat sudah punya penerbangan harian ke Tambolaka. Bagian timur, dengan sabana, Bukit Wairinding, Pantai Walakiri, dan Air Terjun Tanggedu, lebih sulit dijangkau. Dengan penerbangan langsung, rute klasik pun bisa ditempuh: <strong>masuk lewat satu bandara dan keluar lewat bandara lainnya</strong>, menyeberangi pulau lewat darat.</p>
<h2>"Yang sulit bukan hadirnya pesawat"</h2>
<p>Bupati Sumba Timur, Umbu Lili Pekuwali, menyambut rute ini, tetapi mengingatkan bahwa tantangan sebenarnya adalah menjaga penerbangan tetap beroperasi. General manager bandara mengajak semua pihak mendukung agar penerbangan baru ini bertahan dan berkembang.</p>
<h2>Apa artinya</h2>

<p>Singkatnya: kalau ingin rute ini bertahan, gunakanlah. Jadwal bisa berubah, jadi pastikan ke maskapai sebelum memesan.</p>"""},
"sources":S_FLIGHT})

ARTICLES.append({"section":"getting-here","slug":"how-to-get-to-sumba-from-bali","date":"2026-11-07",
"en":{"title":"How to get to Sumba from Bali: flights, airports and the route that works best",
 "dek":"Two airports, short flights and one simple rule: arrive at one end of the island and leave from the other.",
 "body":"""<p>Sumba sits south-east of Bali and has no direct international flights. Almost everyone arrives by a short domestic flight from Bali (Denpasar, DPS).</p>
<h2>The two airports</h2>
<ul><li><strong>Tambolaka (TMC)</strong>, in the north-west. The main gateway for West and Southwest Sumba: Kodi, Lamboya, Wanokaka, the traditional villages and the Pasola fields.</li>
<li><strong>Waingapu (WGP)</strong>, in the east. Closest to the savannas, Wairinding hill, Walakiri beach and Tanggedu waterfall.</li></ul>
<h2>Flights from Bali</h2>
<ul><li><strong>Bali-Tambolaka:</strong> Wings Air has flown several daily flights, about 1 h 30 each way.</li>
<li><strong>Bali-Waingapu:</strong> TransNusa has flown non-stop four times a week since 15 July 2026 (Tuesday, Wednesday, Friday, Saturday).</li></ul>
<p>Schedules on small regional routes change often. Always check the airline before booking.</p>
<h2>The route that works best</h2>
<p>Sumba is about 200 km long and roughly twice the size of Bali. Roads are slow. The easiest plan is to <strong>fly into Tambolaka and out of Waingapu</strong>, or the other way round, and cross the island by car.</p>
<h2>Practical tips</h2>
<ul><li>Small planes mean small baggage allowances. Check yours before you pack.</li>
<li>Rent a car with a local driver. Signs are few and a driver knows the villages, the customs and the road conditions.</li>
<li>Carry cash. Outside the towns, card payments and ATMs are rare.</li>
<li>The dry season (roughly May to September) makes roads and waterfalls easier. In the rainy season (roughly November to March) some routes get hard.</li></ul>"""},
"es":{"title":"Cómo llegar a Sumba desde Bali: vuelos, aeropuertos y la ruta que mejor funciona",
 "dek":"Dos aeropuertos, vuelos cortos y una regla sencilla: llegar por un extremo de la isla y salir por el otro.",
 "body":"""<p>Sumba está al sureste de Bali y no tiene vuelos internacionales directos. Casi todos los viajeros llegan en un vuelo nacional corto desde Bali (Denpasar, DPS).</p>
<h2>Los dos aeropuertos</h2>
<ul><li><strong>Tambolaka (TMC)</strong>, en el noroeste. Es la principal puerta de entrada al oeste y el suroeste de Sumba: Kodi, Lamboya, Wanokaka, los pueblos tradicionales y los campos de la Pasola.</li>
<li><strong>Waingapu (WGP)</strong>, en el este. El más cercano a las sabanas, la colina de Wairinding, la playa de Walakiri y la cascada de Tanggedu.</li></ul>
<h2>Vuelos desde Bali</h2>
<ul><li><strong>Bali-Tambolaka:</strong> Wings Air ha operado varios vuelos diarios, de una hora y media de duración aproximada.</li>
<li><strong>Bali-Waingapu:</strong> TransNusa vuela sin escalas cuatro veces por semana desde el 15 de julio de 2026 (martes, miércoles, viernes y sábado).</li></ul>
<p>En estas rutas regionales los horarios cambian a menudo. Confírmalos siempre con la aerolínea antes de reservar.</p>
<h2>La ruta que mejor funciona</h2>
<p>Sumba mide unos 200 km de largo y su superficie duplica aproximadamente la de Bali. Las carreteras son lentas. Lo más fácil es <strong>llegar a Tambolaka y salir desde Waingapu</strong>, o al revés, y cruzar la isla en coche.</p>
<h2>Consejos prácticos</h2>
<ul><li>Aviones pequeños, franquicias de equipaje reducidas: revisa la tuya antes de hacer la maleta.</li>
<li>Alquila coche con conductor local. Hay poca señalización y un conductor de la zona conoce los pueblos, las costumbres y el estado de las carreteras.</li>
<li>Lleva efectivo. Fuera de las ciudades casi no hay cajeros ni pago con tarjeta.</li>
<li>La estación seca (aproximadamente de mayo a septiembre) facilita los desplazamientos por carretera y las visitas a las cascadas. En la de lluvias (aproximadamente de noviembre a marzo), algunas rutas se complican.</li></ul>"""},
"id":{"title":"Cara ke Sumba dari Bali: penerbangan, bandara, dan rute terbaik",
 "dek":"Dua bandara, penerbangan singkat, dan satu aturan sederhana: tiba di satu ujung pulau dan pulang dari ujung lainnya.",
 "body":"""<p>Sumba terletak di tenggara Bali dan tidak memiliki penerbangan internasional langsung. Hampir semua orang tiba dengan penerbangan domestik singkat dari Bali (Denpasar, DPS).</p>
<h2>Dua bandara</h2>
<ul><li><strong>Tambolaka (TMC)</strong>, di barat laut. Gerbang utama ke Sumba Barat dan Sumba Barat Daya: Kodi, Lamboya, Wanokaka, kampung adat, dan lapangan Pasola.</li>
<li><strong>Waingapu (WGP)</strong>, di timur. Paling dekat ke sabana, Bukit Wairinding, Pantai Walakiri, dan Air Terjun Tanggedu.</li></ul>
<h2>Penerbangan dari Bali</h2>
<ul><li><strong>Bali-Tambolaka:</strong> Wings Air telah melayani beberapa penerbangan setiap hari, dengan waktu tempuh sekitar 1 jam 30 menit.</li>
<li><strong>Bali-Waingapu:</strong> TransNusa terbang tanpa transit empat kali seminggu sejak 15 Juli 2026 (Selasa, Rabu, Jumat, Sabtu).</li></ul>
<p>Jadwal rute regional sering berubah. Selalu cek ke maskapai sebelum memesan.</p>
<h2>Rute terbaik</h2>
<p>Panjang Sumba sekitar 200 km dan luasnya kira-kira dua kali Bali. Jalannya lambat. Rencana termudah adalah <strong>tiba di Tambolaka dan pulang dari Waingapu</strong>, atau sebaliknya, lalu menyeberangi pulau dengan mobil.</p>
<h2>Tips praktis</h2>
<ul><li>Pesawat kecil berarti jatah bagasi kecil. Cek jatah Anda sebelum berkemas.</li>
<li>Sewa mobil dengan sopir lokal. Rambu jalan masih jarang, dan sopir lokal paham kampung, adat, dan kondisi jalan.</li>
<li>Bawa uang tunai. Di luar kota, ATM dan pembayaran dengan kartu jarang tersedia.</li>
<li>Musim kemarau (kira-kira Mei sampai September) memudahkan perjalanan dan kunjungan ke air terjun. Di musim hujan (kira-kira November sampai Maret) beberapa rute jadi sulit.</li></ul>"""},
"sources":S_GET})

ARTICLES.append({"section":"culture","slug":"pasola-explained","date":"2026-11-07",
"en":{"title":"The Pasola, explained: Sumba's ritual battle on horseback",
 "dek":"Riders throw blunt wooden spears at each other across an open field. It is not a show. It is a ritual that opens the planting season.",
 "body":"""<p>Every year, usually in February and March, horsemen in West and Southwest Sumba gather in two teams on an open field and charge at each other, throwing wooden spears while they dodge. This is the <strong>Pasola</strong>.</p>
<h2>Why it happens</h2>
<p>The Pasola belongs to <strong>Marapu</strong>, the ancestral religion of Sumba. It is tied to the farming year and to the ancestors. Older accounts say that blood spilled on the field fed the land. Today the spears are blunt, but the ritual meaning remains.</p>
<h2>Who sets the date</h2>
<p>There is no fixed date on the calendar. The <strong>rato</strong>, the traditional elders, read the signs. One of them is the arrival of the <strong>nyale</strong>, sea worms that appear on the shore. When the nyale come, the Pasola can begin.</p>
<h2>Where</h2>
<p>In the regions of Kodi, Lamboya, Wanokaka and Gaura. Most visitors stay near Tambolaka and drive up to about 2.5 hours to the fields.</p>
<h2>2026, for reference</h2>
<p>Local schedules announced for 2026 were 9-11 February (Homba Kalayo, Bondo Kawango, Rara Winyo) and 9-11 March (Maliti Bondo Ate, Wai Ha, Wainyapu). Dates for 2027 will depend, as always, on the elders.</p>
<h2>How to be a good guest</h2>
<ul><li>Remember that this is a ritual, not a performance for tourists.</li>
<li>Dress modestly and stay well back from the field. Riders fall, and horses run where they want.</li>
<li>Ask before photographing people, especially during the ceremonies around the battle.</li>
<li>Bring water, sun protection and cash. There is usually no ticket.</li>
<li>Go with a local guide or driver who can tell you when and where to be.</li></ul>"""},
"es":{"title":"Qué es la Pasola, la batalla ritual a caballo de Sumba",
 "dek":"Jinetes que se arrojan lanzas de madera sin punta en campo abierto. No es un espectáculo, sino el ritual que abre la temporada de siembra.",
 "body":"""<p>Cada año, normalmente en febrero y marzo, jinetes del oeste y el suroeste de Sumba se dividen en dos bandos en un campo abierto y cargan unos contra otros: se arrojan lanzas de madera e intentan esquivarlas. Es la <strong>Pasola</strong>.</p>
<h2>Por qué se celebra</h2>
<p>La Pasola forma parte del <strong>marapu</strong>, la religión ancestral de Sumba. Está ligada al año agrícola y a los antepasados. Según los relatos antiguos, la sangre derramada en el campo fertilizaba la tierra. Hoy las lanzas no tienen punta, pero el sentido ritual se mantiene.</p>
<h2>Quién decide la fecha</h2>
<p>No hay una fecha fija en el calendario. Los <strong>rato</strong>, los ancianos de la comunidad, interpretan las señales. Una de ellas es la llegada de los <strong>nyale</strong>, unos gusanos marinos que aparecen en la orilla. Cuando llegan los nyale, puede empezar la Pasola.</p>
<h2>Dónde</h2>
<p>En las regiones de Kodi, Lamboya, Wanokaka y Gaura. La mayoría de los visitantes se aloja cerca de Tambolaka, y el trayecto en coche hasta los campos puede llevar unas dos horas y media.</p>
<h2>Las fechas de 2026, como referencia</h2>
<p>Los calendarios locales anunciados para 2026 fijaron la Pasola del 9 al 11 de febrero (Homba Kalayo, Bondo Kawango, Rara Winyo) y del 9 al 11 de marzo (Maliti Bondo Ate, Wai Ha, Wainyapu). Las fechas de 2027 dependerán, como siempre, de los ancianos.</p>
<h2>Cómo ser un buen invitado</h2>
<ul><li>Recuerda que es un ritual, no una actuación para turistas.</li>
<li>Viste con discreción y mantente a buena distancia del campo: los jinetes se caen y los caballos van donde quieren.</li>
<li>Pide permiso antes de fotografiar a la gente, sobre todo en las ceremonias que rodean la batalla.</li>
<li>Lleva agua, protección solar y efectivo. Normalmente no hay entrada.</li>
<li>Ve con un guía o un conductor local que te indique cuándo y dónde situarte.</li></ul>"""},
"id":{"title":"Mengenal Pasola: perang adat berkuda di Sumba",
 "dek":"Para penunggang kuda saling melempar lembing kayu tumpul di lapangan terbuka. Ini bukan pertunjukan, melainkan ritual pembuka musim tanam.",
 "body":"""<p>Setiap tahun, biasanya pada bulan Februari dan Maret, para penunggang kuda di Sumba Barat dan Sumba Barat Daya berkumpul dalam dua kelompok di lapangan terbuka. Mereka saling menyerbu sambil melempar lembing kayu dan berkelit dari lembing lawan. Inilah <strong>Pasola</strong>.</p>
<h2>Mengapa diadakan</h2>
<p>Pasola adalah bagian dari <strong>Marapu</strong>, kepercayaan leluhur Sumba. Ritual ini terkait dengan siklus pertanian dan para leluhur. Kisah lama menyebut darah yang tertumpah di lapangan menyuburkan tanah. Kini lembingnya tumpul, tetapi makna ritualnya tetap ada.</p>
<h2>Siapa yang menentukan tanggal</h2>
<p>Tidak ada tanggal tetap di kalender. Para <strong>rato</strong>, tetua adat, membaca tanda-tanda alam. Salah satunya adalah kemunculan <strong>nyale</strong>, cacing laut yang naik ke tepi pantai. Ketika nyale datang, Pasola bisa dimulai.</p>
<h2>Di mana</h2>
<p>Di wilayah Kodi, Lamboya, Wanokaka, dan Gaura. Sebagian besar pengunjung menginap di sekitar Tambolaka dan berkendara hingga sekitar 2,5 jam ke lapangan.</p>
<h2>Sebagai acuan: 2026</h2>
<p>Jadwal lokal yang diumumkan untuk 2026 adalah 9-11 Februari (Homba Kalayo, Bondo Kawango, Rara Winyo) dan 9-11 Maret (Maliti Bondo Ate, Wai Ha, Wainyapu). Tanggal untuk 2027, seperti biasa, bergantung pada para tetua.</p>
<h2>Menjadi tamu yang baik</h2>
<ul><li>Ingat bahwa ini ritual, bukan pertunjukan untuk wisatawan.</li>
<li>Berpakaian sopan dan jaga jarak dari lapangan. Penunggang bisa jatuh, dan kuda bisa berlari ke mana saja.</li>
<li>Minta izin sebelum memotret orang, terutama saat upacara di sekitar Pasola.</li>
<li>Bawa air, tabir surya, dan uang tunai. Biasanya tidak ada tiket masuk.</li>
<li>Datanglah bersama pemandu atau sopir lokal yang tahu kapan dan di mana harus berada.</li></ul>"""},
"sources":S_PASOLA})

ARTICLES.append({"section":"culture","slug":"marapu-ikat-traditional-villages","date":"2026-11-07",
"en":{"title":"Marapu, ikat and the traditional villages: a respectful guide to Sumba's culture",
 "dek":"Tall thatched roofs, stone tombs still in use and cloth that takes hundreds of hours to weave.",
 "body":"""<p>Sumba is one of the few places in Indonesia where an ancestral religion is still part of daily life. Its name is <strong>Marapu</strong>.</p>
<h2>Marapu</h2>
<p>In Marapu, the ancestors stay present in the world of the living and must be honoured with offerings and ceremonies. Rocks, trees and springs can be home to spirits. Marapu guides planting, marriage and the settling of disputes. Estimates of how many Sumbanese follow it vary, from about a quarter to more than a third, strongest in the traditional villages of the west and centre.</p>
<h2>The villages</h2>
<ul><li><strong>Praijing</strong> (West Sumba): stone tombs and houses with tall peaked roofs (uma mbatangu).</li>
<li><strong>Waitabar</strong> (West Sumba): a hilltop village with tombs and homestays.</li>
<li><strong>Tarung</strong> (near Waikabubak): a large village with dozens of megalithic tombs and an active Marapu community.</li>
<li><strong>Ratenggaro</strong> (Southwest Sumba): very tall roofs and tombs facing the ocean. Popular, so go early.</li></ul>
<h2>Ikat</h2>
<p>Sumba's ikat is cloth made by tying and dyeing threads before weaving them. Traditional dyes come from indigo, morinda root (red) and turmeric (yellow). Women weave on backstrap looms, and a good piece can take <strong>200 to 400 hours</strong>. East Sumba is known for darker, denser patterns. Fine pieces are used in ceremonies, given at weddings and buried with the dead.</p>
<h2>How to visit well</h2>
<ul><li>These are homes, not museums. Ask before entering and before taking photos.</li>
<li>Many villages ask for a small contribution or entry fee. Pay it gladly.</li>
<li>Buy ikat directly from the weavers when you can. It is the fairest way to keep the craft alive.</li>
<li>A local guide helps with language and custom, and can explain what you are looking at.</li></ul>"""},
"es":{"title":"Marapu, ikat y pueblos tradicionales: guía para conocer Sumba con respeto",
 "dek":"Tejados de paja altísimos, tumbas de piedra todavía en uso y telas que exigen cientos de horas de trabajo.",
 "body":"""<p>Sumba es uno de los pocos lugares de Indonesia donde una religión ancestral sigue formando parte de la vida diaria. Se llama <strong>marapu</strong>.</p>
<h2>El marapu</h2>
<p>Para el marapu, los antepasados siguen presentes en el mundo de los vivos y hay que honrarlos con ofrendas y ceremonias. Las rocas, los árboles y los manantiales pueden albergar espíritus. El marapu guía la siembra, el matrimonio y la resolución de conflictos. Las estimaciones sobre el número de fieles varían entre una cuarta parte y más de un tercio de la población, sobre todo en los pueblos tradicionales del oeste y el centro.</p>
<h2>Los pueblos</h2>
<ul><li><strong>Praijing</strong> (Sumba Occidental): tumbas de piedra y casas de tejados altos y puntiagudos (uma mbatangu).</li>
<li><strong>Waitabar</strong> (Sumba Occidental): un pueblo en lo alto de una colina, con tumbas y casas donde alojarse.</li>
<li><strong>Tarung</strong> (junto a Waikabubak): un pueblo grande con decenas de tumbas megalíticas y una comunidad marapu activa.</li>
<li><strong>Ratenggaro</strong> (Sumba Suroccidental): tejados altísimos y tumbas frente al océano. Es muy visitado, así que ve temprano.</li></ul>
<h2>El ikat</h2>
<p>El ikat de Sumba es un tejido que se elabora atando y tiñendo los hilos antes de tejerlos. Los tintes tradicionales se obtienen del índigo, la raíz de morinda (rojo) y la cúrcuma (amarillo). Las mujeres tejen en telares de cintura, y una buena pieza puede llevar <strong>de 200 a 400 horas</strong>. Sumba Oriental es conocida por sus diseños más oscuros y densos. Las mejores piezas se usan en ceremonias, se regalan en las bodas y se entierran con los muertos.</p>
<h2>Cómo visitarlos con respeto</h2>
<ul><li>Son casas, no museos. Pide permiso antes de entrar y antes de hacer fotos.</li>
<li>Muchos pueblos piden un pequeño donativo o una entrada. Págalos de buen grado.</li>
<li>Compra el ikat directamente a las tejedoras siempre que puedas. Es la forma más justa de mantener vivo el oficio.</li>
<li>Un guía local ayuda con el idioma y las costumbres, y te explica lo que estás viendo.</li></ul>"""},
"id":{"title":"Marapu, ikat, dan kampung adat: panduan menghormati budaya Sumba",
 "dek":"Atap ilalang yang menjulang, makam batu yang masih digunakan, dan kain yang ditenun ratusan jam.",
 "body":"""<p>Sumba adalah salah satu dari sedikit tempat di Indonesia yang kepercayaan leluhurnya masih menjadi bagian dari kehidupan sehari-hari. Namanya <strong>Marapu</strong>.</p>
<h2>Marapu</h2>
<p>Dalam Marapu, para leluhur tetap hadir di dunia orang hidup dan harus dihormati dengan persembahan dan upacara. Batu, pohon, dan mata air dapat menjadi tempat tinggal roh. Marapu menuntun masa tanam, pernikahan, dan penyelesaian sengketa. Perkiraan jumlah penganutnya berbeda-beda, dari sekitar seperempat hingga lebih dari sepertiga penduduk, terutama di kampung adat di bagian barat dan tengah.</p>
<h2>Kampung adat</h2>
<ul><li><strong>Praijing</strong> (Sumba Barat): makam batu dan rumah beratap tinggi meruncing (uma mbatangu).</li>
<li><strong>Waitabar</strong> (Sumba Barat): kampung di atas bukit dengan makam dan homestay.</li>
<li><strong>Tarung</strong> (dekat Waikabubak): kampung besar dengan puluhan makam megalitik dan komunitas Marapu yang aktif.</li>
<li><strong>Ratenggaro</strong> (Sumba Barat Daya): atap sangat tinggi dan makam menghadap samudra. Ramai dikunjungi, jadi datanglah pagi.</li></ul>
<h2>Tenun ikat</h2>
<p>Ikat Sumba adalah kain yang dibuat dengan mengikat dan mewarnai benang sebelum ditenun. Pewarna tradisionalnya dari nila, akar mengkudu (merah), dan kunyit (kuning). Para perempuan menenun dengan alat tenun gedogan, dan satu kain yang baik bisa memakan waktu <strong>200 sampai 400 jam</strong>. Sumba Timur dikenal dengan motif yang lebih gelap dan padat. Kain terbaik dipakai dalam upacara, diberikan dalam pernikahan, dan dikuburkan bersama orang yang meninggal.</p>
<h2>Berkunjung dengan hormat</h2>
<ul><li>Ini rumah, bukan museum. Minta izin sebelum masuk dan sebelum memotret.</li>
<li>Banyak kampung meminta sumbangan kecil atau tiket masuk. Bayarlah dengan senang hati.</li>
<li>Belilah ikat langsung dari penenunnya bila memungkinkan. Itu cara paling adil untuk menjaga kerajinan ini tetap hidup.</li>
<li>Pemandu lokal membantu soal bahasa dan adat, dan bisa menjelaskan apa yang Anda lihat.</li></ul>"""},
"sources":S_CULT})

ARTICLES.append({"section":"things-to-do","slug":"beaches-lagoons-waterfalls","date":"2026-11-07",
"en":{"title":"Sumba's beaches, lagoons and waterfalls: nine places worth the drive",
 "dek":"From a turquoise lagoon in the north-west to mangroves that seem to dance at sunset in the east.",
 "body":"""<p>Sumba is large and quiet. Many of its best places have no crowds at all. These are nine of them, from west to east.</p>
<h2>West and Southwest</h2>
<ul><li><strong>Weekuri Lagoon.</strong> A saltwater lagoon with very clear water, good for a swim. Watch for sharp coral. There are basic toilets and a shower.</li>
<li><strong>Mandorak Beach.</strong> A small beach between two cliffs. In June and July the sun sets right between them.</li>
<li><strong>Pero and Marosi.</strong> Wide beaches on the south-west coast, often completely empty.</li>
<li><strong>Lapopu Waterfall.</strong> A tall waterfall that drops in tiers, a short walk from the car park. Best in the dry season. After rain the water runs brown and strong.</li></ul>
<h2>East</h2>
<ul><li><strong>Wairinding Hill.</strong> The most famous hill on the island, rolling savanna in every direction. Go for sunset.</li>
<li><strong>Walakiri Beach.</strong> Small mangrove trees on the sand that look like dancers against the sunset. Check the tide: at high tide they are under water.</li>
<li><strong>Tanggedu Waterfall.</strong> Called the Grand Canyon of Sumba, with pools carved into the rock. The last stretch is a walk of 15 to 20 minutes, or a short motorbike ride.</li>
<li><strong>Waimarang Waterfall.</strong> A turquoise pool in the forest, about a 20-minute trek each way.</li></ul>
<h2>When to go</h2>
<p>The dry season, roughly May to September, brings golden landscapes and easier roads. In the rainy season, roughly November to March, some tracks and waterfalls are hard to reach.</p>
<p>Please take your rubbish with you. Most of these places have no bins, and they stay beautiful because people care for them.</p>"""},
"es":{"title":"Playas, lagunas y cascadas de Sumba: nueve lugares que merecen el viaje",
 "dek":"De una laguna turquesa en el noroeste a unos manglares que parecen bailar al atardecer en el este.",
 "body":"""<p>Sumba es grande y tranquila, y muchos de sus mejores rincones apenas reciben visitas. Estos son nueve, de oeste a este.</p>
<h2>Oeste y suroeste</h2>
<ul><li><strong>Laguna de Weekuri.</strong> Una laguna de agua salada y cristalina, perfecta para el baño. Cuidado con el coral afilado. Hay baños sencillos y una ducha.</li>
<li><strong>Playa de Mandorak.</strong> Una playa pequeña entre dos acantilados. En junio y julio el sol se pone justo en medio.</li>
<li><strong>Pero y Marosi.</strong> Playas amplias en la costa suroeste, a menudo completamente desiertas.</li>
<li><strong>Cascada de Lapopu.</strong> Una cascada alta que cae en escalones, a un corto paseo del aparcamiento. Luce más en la estación seca: después de las lluvias, el agua baja turbia y con fuerza.</li></ul>
<h2>Este</h2>
<ul><li><strong>Colina de Wairinding.</strong> La colina más famosa de la isla, rodeada de sabana ondulada hasta donde alcanza la vista. Ve al atardecer.</li>
<li><strong>Playa de Walakiri.</strong> Pequeños mangles sobre la arena que, al atardecer, parecen bailarines. Consulta las mareas: con la pleamar quedan bajo el agua.</li>
<li><strong>Cascada de Tanggedu.</strong> La llaman el Gran Cañón de Sumba, con pozas excavadas en la roca. El último tramo se hace a pie, en 15 o 20 minutos, o con un corto trayecto en moto.</li>
<li><strong>Cascada de Waimarang.</strong> Una poza turquesa en mitad del bosque, a unos 20 minutos de caminata en cada sentido.</li></ul>
<h2>Cuándo ir</h2>
<p>La estación seca, aproximadamente de mayo a septiembre, trae paisajes dorados y carreteras más transitables. En la de lluvias, aproximadamente de noviembre a marzo, algunos caminos y cascadas resultan de difícil acceso.</p>
<p>Por favor, llévate tu basura. La mayoría de estos lugares no tiene papeleras y, si siguen siendo preciosos, es porque la gente los cuida.</p>"""},
"id":{"title":"Pantai, laguna, dan air terjun di Sumba: sembilan tempat yang layak dikunjungi",
 "dek":"Dari laguna toska di barat laut hingga bakau yang seolah menari saat matahari terbenam di timur.",
 "body":"""<p>Sumba luas dan tenang. Banyak tempat terindahnya masih sepi pengunjung. Berikut sembilan di antaranya, dari barat ke timur.</p>
<h2>Barat dan Barat Daya</h2>
<ul><li><strong>Danau Weekuri.</strong> Laguna air asin yang sangat jernih, cocok untuk berenang. Hati-hati dengan karang tajam. Tersedia toilet dan pancuran sederhana.</li>
<li><strong>Pantai Mandorak.</strong> Pantai kecil di antara dua tebing. Pada Juni dan Juli matahari terbenam tepat di tengahnya.</li>
<li><strong>Pero dan Marosi.</strong> Pantai luas di pesisir barat daya, sering kali benar-benar sepi.</li>
<li><strong>Air Terjun Lapopu.</strong> Air terjun tinggi bertingkat, hanya beberapa menit berjalan dari tempat parkir. Paling bagus di musim kemarau. Setelah hujan, airnya cokelat dan deras.</li></ul>
<h2>Timur</h2>
<ul><li><strong>Bukit Wairinding.</strong> Bukit paling terkenal di pulau ini, sabana bergelombang ke segala arah. Datanglah saat matahari terbenam.</li>
<li><strong>Pantai Walakiri.</strong> Pohon bakau kecil di atas pasir yang tampak seperti penari saat matahari terbenam. Cek pasang surut: saat pasang, pohonnya terendam.</li>
<li><strong>Air Terjun Tanggedu.</strong> Dijuluki Grand Canyon-nya Sumba, dengan kolam yang terukir di batu. Bagian terakhir ditempuh 15 sampai 20 menit berjalan kaki, atau naik motor sebentar.</li>
<li><strong>Air Terjun Waimarang.</strong> Kolam toska di tengah hutan, sekitar 20 menit berjalan kaki sekali jalan.</li></ul>
<h2>Kapan berkunjung</h2>
<p>Musim kemarau, kira-kira Mei sampai September, menghadirkan pemandangan keemasan dan jalan yang lebih mudah. Di musim hujan, kira-kira November sampai Maret, beberapa jalur dan air terjun sulit dijangkau.</p>
<p>Mohon bawa pulang sampah Anda. Sebagian besar tempat ini tidak punya tempat sampah, dan tempat-tempat ini tetap indah karena orang ikut menjaganya.</p>"""},
"sources":S_BEACH})

STAY_ROWS = [
 ("Alamayah","Southwest Sumba","Small boutique property, about 6 rooms"),
 ("Anna Villas","West Sumba","About 14 villas"),
 ("ARYA Sumba","West Sumba","About 19 villas, under construction (expected 2027)"),
 ("Cap Karoso","Kodi, Southwest Sumba","About 60 keys (40 rooms and 20 villas), opened 2023"),
 ("Hotel Sinar Tambolaka","Tambolaka","City hotel, roughly 40 to 90 rooms depending on the source"),
 ("Hotel Sumba Sejahtera","Tambolaka","About 54 rooms"),
 ("Kambaniru Beach Hotel & Resort","Waingapu","About 69 rooms"),
 ("Ketanu","Sumba","About 14 rooms"),
 ("Lelewatu Resort","Wanokaka","About 27 villas"),
 ("Maringi","Sumba","About 9 rooms"),
 ("Myze Hotel Waingapu","Waingapu","About 127 rooms, opened November 2025, the largest hotel on the island"),
 ("NIHI Sumba","West Sumba","About 31 villas, works continuing to 2027"),
 ("Padadita Beach Hotel","Waingapu","Roughly 33 to 56 rooms"),
 ("Rua Beach","West Sumba","About 11 rooms"),
 ("Sima Sumba Hotel","Tambolaka","About 102 rooms, opened 2023"),
 ("Tanto Hotel","Waingapu","About 29 rooms"),
 ("Villa Eco Beach","Sumba","Run by Eco Beach City, the publisher of this site"),
]
def stay_table(lang):
    h = {"en":("Place","Area","Size"),"es":("Alojamiento","Zona","Tamaño"),"id":("Penginapan","Wilayah","Ukuran")}[lang]
    tr = {
      "es": {"Southwest Sumba":"Sumba Suroccidental","West Sumba":"Sumba Occidental","Kodi, Southwest Sumba":"Kodi, Sumba Suroccidental"},
      "id": {"Southwest Sumba":"Sumba Barat Daya","West Sumba":"Sumba Barat","Kodi, Southwest Sumba":"Kodi, Sumba Barat Daya"},
    }
    sz = {
      "es": {"Small boutique property, about 6 rooms":"Pequeño alojamiento boutique, unas 6 habitaciones","About 14 villas":"Unas 14 villas","About 19 villas, under construction (expected 2027)":"Unas 19 villas, en construcción (apertura prevista en 2027)","About 60 keys (40 rooms and 20 villas), opened 2023":"Unas 60 unidades (40 habitaciones y 20 villas), inaugurado en 2023","City hotel, roughly 40 to 90 rooms depending on the source":"Hotel urbano, entre 40 y 90 habitaciones según la fuente","About 54 rooms":"Unas 54 habitaciones","About 69 rooms":"Unas 69 habitaciones","About 14 rooms":"Unas 14 habitaciones","About 27 villas":"Unas 27 villas","About 9 rooms":"Unas 9 habitaciones","About 127 rooms, opened November 2025, the largest hotel on the island":"Unas 127 habitaciones, inaugurado en noviembre de 2025; el hotel más grande de la isla","About 31 villas, works continuing to 2027":"Unas 31 villas, con obras hasta 2027","Roughly 33 to 56 rooms":"Entre 33 y 56 habitaciones","About 11 rooms":"Unas 11 habitaciones","About 102 rooms, opened 2023":"Unas 102 habitaciones, inaugurado en 2023","About 29 rooms":"Unas 29 habitaciones","Run by Eco Beach City, the publisher of this site":"Gestionado por Eco Beach City, que publica esta web"},
      "id": {"Small boutique property, about 6 rooms":"Penginapan butik kecil, sekitar 6 kamar","About 14 villas":"Sekitar 14 vila","About 19 villas, under construction (expected 2027)":"Sekitar 19 vila, sedang dibangun (diperkirakan 2027)","About 60 keys (40 rooms and 20 villas), opened 2023":"Sekitar 60 unit (40 kamar dan 20 vila), dibuka 2023","City hotel, roughly 40 to 90 rooms depending on the source":"Hotel kota, sekitar 40 sampai 90 kamar tergantung sumber","About 54 rooms":"Sekitar 54 kamar","About 69 rooms":"Sekitar 69 kamar","About 14 rooms":"Sekitar 14 kamar","About 27 villas":"Sekitar 27 vila","About 9 rooms":"Sekitar 9 kamar","About 127 rooms, opened November 2025, the largest hotel on the island":"Sekitar 127 kamar, dibuka November 2025, hotel terbesar di pulau ini","About 31 villas, works continuing to 2027":"Sekitar 31 vila, pembangunan berlanjut hingga 2027","Roughly 33 to 56 rooms":"Sekitar 33 sampai 56 kamar","About 11 rooms":"Sekitar 11 kamar","About 102 rooms, opened 2023":"Sekitar 102 kamar, dibuka 2023","About 29 rooms":"Sekitar 29 kamar","Run by Eco Beach City, the publisher of this site":"Dikelola oleh Eco Beach City, penerbit situs ini"},
    }
    rows = "".join(f"<tr><td>{n}</td><td>{tr.get(lang,{}).get(a,a)}</td><td>{sz.get(lang,{}).get(s,s)}</td></tr>" for n,a,s in STAY_ROWS)
    return f'<div class="tw"><table><thead><tr><th>{h[0]}</th><th>{h[1]}</th><th>{h[2]}</th></tr></thead><tbody>{rows}</tbody></table></div>'

ARTICLES.append({"section":"where-to-stay","slug":"where-to-stay-in-sumba","date":"2026-11-07",
"en":{"title":"Where to stay in Sumba: every kind of hotel on the island, listed fairly",
 "dek":"About 1,500 rooms for an island twice the size of Bali. Here they are, in alphabetical order.",
 "body":"""<p>Sumba is still one of the least developed islands in Indonesia for tourism. According to the statistics office of East Nusa Tenggara (BPS), in 2024 the whole island had about <strong>60 places to stay and roughly 1,460 rooms</strong>. For comparison, the area around Labuan Bajo alone had more than twice that.</p>
<h2>Where to base yourself</h2>
<ul><li><strong>Tambolaka</strong> (north-west): next to the main airport, with the island's larger city hotels.</li>
<li><strong>Southwest coast</strong> (Kodi, Wanokaka, Lamboya): the famous resorts, empty beaches and the Pasola fields.</li>
<li><strong>Waingapu</strong> (east): the capital of East Sumba, close to the savannas and waterfalls.</li></ul>
<h2>The list</h2>
<p>Alphabetical, no ranking. Sizes are approximate and come from public sources that do not always agree.</p>
{TABLE}
<p class="note">We will keep this list updated. If you run a place to stay on Sumba and it is missing or wrong, write to us and we will fix it.</p>"""},
"es":{"title":"Dónde dormir en Sumba: todo tipo de alojamientos, sin favoritismos",
 "dek":"Unas 1.500 habitaciones en una isla que dobla en tamaño a Bali. Esta es la lista, por orden alfabético.",
 "body":"""<p>Sumba sigue siendo una de las islas indonesias menos desarrolladas turísticamente. Según la oficina de estadística de Nusa Tenggara Oriental (BPS), en 2024 la isla entera tenía unos <strong>60 alojamientos y unas 1.460 habitaciones</strong>. A modo de comparación, solo la zona de Labuan Bajo tenía más del doble.</p>
<h2>En qué zona alojarse</h2>
<ul><li><strong>Tambolaka</strong> (noroeste): junto al aeropuerto principal, con los hoteles urbanos más grandes.</li>
<li><strong>Costa suroeste</strong> (Kodi, Wanokaka, Lamboya): los resorts famosos, las playas vacías y los campos de la Pasola.</li>
<li><strong>Waingapu</strong> (este): la capital de Sumba Oriental, cerca de las sabanas y las cascadas.</li></ul>
<h2>La lista</h2>
<p>Por orden alfabético, sin ranking. Las cifras de tamaño son aproximadas y proceden de fuentes públicas que no siempre coinciden.</p>
{TABLE}
<p class="note">Mantendremos esta lista al día. Si gestionas un alojamiento en Sumba y no aparece o hay algún error, escríbenos y lo corregiremos.</p>"""},
"id":{"title":"Menginap di Sumba: semua jenis penginapan di pulau ini, tanpa pilih kasih",
 "dek":"Sekitar 1.500 kamar untuk pulau yang dua kali lebih luas dari Bali. Berikut daftarnya, menurut abjad.",
 "body":"""<p>Dari sisi pariwisata, Sumba masih tergolong pulau yang paling belum berkembang di Indonesia. Menurut BPS Provinsi Nusa Tenggara Timur, pada 2024 seluruh pulau memiliki sekitar <strong>60 akomodasi dan sekitar 1.460 kamar</strong>. Sebagai perbandingan, wilayah Labuan Bajo saja memiliki lebih dari dua kali lipatnya.</p>
<h2>Di mana menginap</h2>
<ul><li><strong>Tambolaka</strong> (barat laut): dekat bandara utama, dengan hotel kota yang lebih besar.</li>
<li><strong>Pesisir barat daya</strong> (Kodi, Wanokaka, Lamboya): resor terkenal, pantai sepi, dan lapangan Pasola.</li>
<li><strong>Waingapu</strong> (timur): ibu kota Sumba Timur, dekat sabana dan air terjun.</li></ul>
<h2>Daftar penginapan</h2>
<p>Disusun menurut abjad, tanpa peringkat. Ukuran bersifat perkiraan dan berasal dari sumber publik yang tidak selalu sama.</p>
{TABLE}
<p class="note">Daftar ini akan terus kami perbarui. Jika Anda mengelola penginapan di Sumba dan datanya belum ada atau keliru, hubungi kami dan akan kami perbaiki.</p>"""},
"sources":S_STAY, "table":True})

ARTICLES.append({"section":"projects","slug":"what-is-being-built-in-sumba","date":"2026-11-07",
"en":{"title":"What is being built on Sumba: the new hotels and projects to watch",
 "dek":"A 127-room hotel in Waingapu, new villas in the west, and no mega-resort on the horizon.",
 "body":"""<p>Sumba is changing, but slowly. Here is what is open, what is being built and what is not happening.</p>
<h2>Recently opened</h2>
<ul><li><strong>Myze Hotel Waingapu</strong> (Artotel Group) opened in November 2025 with about 127 rooms and an event hall. It is now the largest hotel on the island.</li>
<li><strong>Sima Sumba Hotel</strong> (Swiss-Belhotel) opened in Tambolaka in 2023 with about 102 rooms.</li>
<li><strong>Cap Karoso</strong> opened in Kodi in 2023 with about 60 rooms and villas.</li></ul>
<h2>Under construction</h2>
<ul><li><strong>NIHI Sumba</strong> is adding villas, with works expected to continue into 2027.</li>
<li><strong>ARYA Sumba</strong>, about 19 villas, is expected around 2027.</li>
<li><strong>Eco Beach City</strong>, the publisher of this site, is building a beachfront community for sport, work and wellbeing, next to the villas it already operates.</li></ul>
<h2>What is not happening</h2>
<p>There is no announced project with more than 100 new rooms in the pipeline, and none of the big international chains has a hotel on the island yet. Sumba is also not one of Indonesia's special economic zones.</p>
<p class="note">Building something on Sumba? Tell us. This page is for every project on the island, not just ours.</p>"""},
"es":{"title":"Qué se construye en Sumba: hoteles y proyectos nuevos que seguir de cerca",
 "dek":"Un hotel de 127 habitaciones en Waingapu, villas nuevas en el oeste y ningún macrocomplejo turístico a la vista.",
 "body":"""<p>Sumba está cambiando, pero despacio. Esto es lo que ha abierto, lo que está en obras y lo que no está ocurriendo.</p>
<h2>Aperturas recientes</h2>
<ul><li><strong>Myze Hotel Waingapu</strong> (grupo Artotel) abrió en noviembre de 2025 con unas 127 habitaciones y un salón para eventos. Es ya el hotel más grande de la isla.</li>
<li><strong>Sima Sumba Hotel</strong> (Swiss-Belhotel) abrió en Tambolaka en 2023 con unas 102 habitaciones.</li>
<li><strong>Cap Karoso</strong> abrió en Kodi en 2023 con unas 60 habitaciones y villas.</li></ul>
<h2>En construcción</h2>
<ul><li><strong>NIHI Sumba</strong> amplía su oferta de villas, con obras previstas hasta 2027.</li>
<li><strong>ARYA Sumba</strong>, con unas 19 villas, tiene prevista su apertura en 2027.</li>
<li><strong>Eco Beach City</strong>, que publica esta web, construye una comunidad frente al mar para el deporte, el trabajo y el bienestar, junto a las villas que ya gestiona.</li></ul>
<h2>Lo que no está ocurriendo</h2>
<p>No se ha anunciado ningún proyecto de más de 100 habitaciones nuevas, y ninguna de las grandes cadenas internacionales tiene todavía un hotel en la isla. Sumba tampoco figura entre las zonas económicas especiales de Indonesia.</p>
<p class="note">¿Construyes algo en Sumba? Cuéntanoslo. Esta página es para todos los proyectos de la isla, no solo para el nuestro.</p>"""},
"id":{"title":"Apa yang sedang dibangun di Sumba: hotel dan proyek baru yang patut diikuti",
 "dek":"Hotel 127 kamar di Waingapu, vila baru di barat, dan belum ada resor raksasa.",
 "body":"""<p>Sumba sedang berubah, tetapi perlahan. Berikut yang sudah beroperasi, yang sedang dibangun, dan yang belum terjadi.</p>
<h2>Baru dibuka</h2>
<ul><li><strong>Myze Hotel Waingapu</strong> (Artotel Group) dibuka pada November 2025 dengan sekitar 127 kamar dan ruang acara. Kini menjadi hotel terbesar di pulau ini.</li>
<li><strong>Sima Sumba Hotel</strong> (Swiss-Belhotel) dibuka di Tambolaka pada 2023 dengan sekitar 102 kamar.</li>
<li><strong>Cap Karoso</strong> dibuka di Kodi pada 2023 dengan sekitar 60 kamar dan vila.</li></ul>
<h2>Sedang dibangun</h2>
<ul><li><strong>NIHI Sumba</strong> sedang menambah vila, dengan pembangunan diperkirakan berlanjut hingga 2027.</li>
<li><strong>ARYA Sumba</strong>, dengan sekitar 19 vila, diperkirakan dibuka pada 2027.</li>
<li><strong>Eco Beach City</strong>, penerbit situs ini, sedang membangun komunitas tepi pantai untuk olahraga, kerja, dan kesehatan, di samping vila yang sudah dikelolanya.</li></ul>
<h2>Yang belum terjadi</h2>
<p>Belum ada proyek yang diumumkan dengan lebih dari 100 kamar baru, dan belum ada jaringan hotel internasional besar yang punya hotel di pulau ini. Sumba juga bukan salah satu kawasan ekonomi khusus di Indonesia.</p>
<p class="note">Sedang membangun sesuatu di Sumba? Ceritakan kepada kami. Halaman ini untuk semua proyek di pulau ini, bukan hanya milik kami.</p>"""},
"sources":S_STAY})


# Daily story 2026-11-08 (06:00 WITA)
ARTICLES.append({"section":"living","slug":"el-nino-late-rainy-season-ntt-sumba-2026","date":"2026-11-08","time":"06:00",
"dateline":"WAINGAPU","kind":"brief","top":True,
"en":{"title":"Very strong El Niño delays rains in most of NTT until December",
"dek":"Indonesia's weather agency expects a late, short rainy season across East Nusa Tenggara, the province that includes Sumba. November should stay drier than normal.",
"body":"<p>The rainy season will come late and be shorter than usual in most of East Nusa Tenggara (NTT), the province that includes Sumba, because of a very strong El Niño, Indonesia's meteorology agency BMKG says. In its national outlook for 2026/2027, BMKG expects the wet season to start in December 2026 in most of NTT and in November only in a small part of the province. The peak is forecast for January 2027 in parts of NTT and February 2027 in most of it.</p><h2>What BMKG says about the very strong El Niño</h2><p>\"The rainy season is arriving late and will be shorter,\" BMKG head Teuku Faisal Fathani said. The agency put the Niño 3.4 sea-surface anomaly at +2.83 at the end of August, a reading it classes as a very strong El Niño. Nationally, it expects the start of the rains to come later than normal across about 61% of Indonesia's land area.</p><h2>Rainfall forecast for NTT, month by month</h2><p>NTT's climatology station gave monthly figures for the province: 0 to 20 mm of rain in October, 51 to 100 mm in November, both below normal, and 201 to 300 mm in December, still generally below normal. These are province-wide forecasts; BMKG did not publish separate figures for Sumba's four regencies in these outlooks.</p><h2>How Sumba farmers are preparing for the late rains</h2><p>On the island, farmers are getting ready. On Friday, 6 November, a village army officer in Karita, Tabundung district, East Sumba, urged farmers to prepare their fields now so rice can be planted on time when the rains arrive, local outlet SERGAP reported.</p><h2>What it means</h2><p><strong>Visitors:</strong> November should be mostly dry, with easy roads and golden savanna, but some seasonal waterfalls may run low. Expect heat and dust; carry water.</p><p><strong>Residents:</strong> BMKG asks people to use water sparingly, stay alert to drought and grass fires, and prepare for dengue, floods and landslides once the rains start and peak. Check your tank, well and drainage now, and use mosquito protection from December.</p><p><strong>Investors and builders:</strong> outdoor work and road travel may stay easier into December, but water for building sites and farms may be tight. Plan for heavier rain in January and February 2027.</p> <p>Planning a trip around the weather? Our <a href=\"/en/things-to-do/best-time-to-visit-sumba/\">month-by-month guide to the best time to visit Sumba</a> explains how the seasons usually run.</p>"},
"es":{"title":"El Niño retrasa hasta diciembre las lluvias en Sumba y casi toda NTT",
"dek":"La agencia meteorológica indonesia prevé una estación de lluvias tardía y corta en Nusa Tenggara Oriental, la provincia de Sumba. Noviembre seguirá más seco de lo normal.",
"body":"<p>Un episodio muy intenso de El Niño retrasará y acortará la estación de lluvias en la mayor parte de Nusa Tenggara Oriental (NTT), la provincia a la que pertenece Sumba, según la agencia meteorológica indonesia (BMKG). En su previsión nacional para 2026/2027, BMKG prevé que las lluvias comiencen en diciembre de 2026 en la mayor parte de NTT y que solo una pequeña parte de la provincia las vea llegar en noviembre. El máximo de precipitaciones se espera en enero de 2027 en parte de NTT y en febrero de 2027 en la mayor parte de la provincia.</p><h2>Qué dice BMKG sobre la intensidad de este El Niño</h2><p>\"La estación de lluvias llega tarde y será más corta\", afirmó el director de BMKG, Teuku Faisal Fathani. La agencia situó a finales de agosto la anomalía de la temperatura del mar en la región Niño 3.4 en +2,83, un valor que, según su clasificación, corresponde a un El Niño muy fuerte. A escala nacional, prevé que las lluvias empiecen más tarde de lo normal en cerca del 61% de la superficie terrestre de Indonesia.</p><h2>Previsión de lluvias en NTT, mes a mes</h2><p>La estación climatológica de NTT ofreció previsiones mensuales para la provincia: entre 0 y 20 mm de lluvia en octubre y entre 51 y 100 mm en noviembre, ambos por debajo de lo normal, y entre 201 y 300 mm en diciembre, todavía en general por debajo de lo normal. Son previsiones para toda la provincia; BMKG no publicó en estos informes cifras separadas para las cuatro regencias de Sumba.</p><h2>Cómo se preparan los agricultores de Sumba para las lluvias tardías</h2><p>En la isla, los agricultores ya se preparan. El viernes 6 de noviembre, un suboficial del ejército destinado en la aldea de Karita, en el distrito de Tabundung (Sumba Oriental), pidió a los campesinos que preparasen sus campos para poder sembrar el arroz a tiempo cuando lleguen las lluvias, según el medio local SERGAP.</p><h2>Qué significa</h2><p><strong>Visitantes:</strong> noviembre debería ser mayoritariamente seco, con carreteras transitables y la sabana dorada, aunque algunas cascadas estacionales pueden llevar poca agua. Cuenta con calor y polvo, y lleva agua.</p><p><strong>Residentes:</strong> BMKG pide usar el agua con moderación, vigilar la sequía y los incendios de pastos, y prepararse para el dengue, las inundaciones y los corrimientos de tierra al inicio y en el pico de la temporada de lluvias. Revisa ya el depósito, el pozo y los desagües, y protégete de los mosquitos a partir de diciembre.</p><p><strong>Inversores y constructores:</strong> las obras al aire libre y los desplazamientos por carretera pueden seguir siendo más sencillos hasta diciembre, pero el agua para obras y cultivos puede escasear. Hay que prever lluvias más intensas en enero y febrero de 2027.</p> <p>¿Organizas tu viaje en función del tiempo? Nuestra <a href=\"/es/things-to-do/best-time-to-visit-sumba/\">guía mes a mes de la mejor época para ir a Sumba</a> explica cómo suelen ser las estaciones.</p>"},
"id":{"title":"El Nino sangat kuat, musim hujan di sebagian besar NTT mundur ke Desember",
"dek":"BMKG memprakirakan musim hujan terlambat dan lebih singkat di NTT, provinsi tempat Pulau Sumba berada. November diperkirakan lebih kering dari normal.",
"body":"<p>Musim hujan akan datang terlambat dan lebih singkat dari biasanya di sebagian besar Nusa Tenggara Timur (NTT), provinsi tempat Pulau Sumba berada, akibat El Nino yang sangat kuat, menurut Badan Meteorologi, Klimatologi, dan Geofisika (BMKG). Dalam prakiraan nasional 2026/2027, BMKG memperkirakan awal musim hujan di sebagian besar NTT jatuh pada Desember 2026, sedangkan pada November hanya di sebagian kecil wilayah provinsi ini. Puncaknya diprakirakan pada Januari 2027 di sebagian NTT dan Februari 2027 di sebagian besar NTT.</p><h2>Penjelasan BMKG soal El Nino sangat kuat</h2><p>\"Musim hujan datang terlambat dan terjadi lebih singkat,\" kata Kepala BMKG Teuku Faisal Fathani. BMKG mencatat anomali suhu muka laut Nino 3.4 sebesar +2,83 pada akhir Agustus, yang masuk kategori El Nino sangat kuat. Secara nasional, awal musim hujan diprakirakan mundur dari normalnya di sekitar 61% wilayah daratan Indonesia.</p><h2>Prakiraan curah hujan NTT per bulan</h2><p>Stasiun Klimatologi NTT merilis prakiraan bulanan untuk provinsi ini: curah hujan 0 sampai 20 mm pada Oktober dan 51 sampai 100 mm pada November, keduanya di bawah normal, lalu 201 sampai 300 mm pada Desember, yang umumnya masih di bawah normal. Ini prakiraan tingkat provinsi; BMKG tidak merilis angka terpisah untuk empat kabupaten di Sumba dalam prakiraan tersebut.</p><h2>Persiapan petani Sumba menghadapi hujan yang terlambat</h2><p>Di pulau ini, petani mulai bersiap. Pada Jumat, 6 November, Babinsa Koramil 04/Tabundung di Desa Karita, Kecamatan Tabundung, Sumba Timur, mengajak petani menyiapkan lahan sejak sekarang agar padi bisa ditanam tepat waktu saat hujan tiba, seperti diberitakan media lokal SERGAP.</p><h2>Apa artinya</h2><p><strong>Wisatawan:</strong> November diperkirakan sebagian besar kering, jalan lebih mudah dilalui dan sabana berwarna keemasan, tetapi beberapa air terjun musiman bisa berdebit kecil. Bersiaplah menghadapi panas dan debu, dan bawa air minum.</p><p><strong>Penduduk:</strong> BMKG meminta warga berhemat air, waspada kekeringan dan kebakaran padang rumput, serta bersiap menghadapi demam berdarah, banjir dan tanah longsor saat awal dan puncak musim hujan. Periksa tandon, sumur dan saluran air sekarang, dan lindungi diri dari nyamuk mulai Desember.</p><p><strong>Investor dan pembangun:</strong> pekerjaan luar ruang dan perjalanan darat mungkin tetap lebih mudah hingga Desember, tetapi pasokan air untuk proyek dan lahan pertanian bisa terbatas. Perhitungkan hujan yang lebih lebat pada Januari dan Februari 2027.</p> <p>Merencanakan perjalanan sesuai cuaca? <a href=\"/id/things-to-do/best-time-to-visit-sumba/\">Panduan bulan per bulan waktu terbaik ke Sumba</a> menjelaskan pola musim yang biasa terjadi.</p>"},
"sources":[["BMKG: El Niño Sangat Kuat sedang Terjadi, Musim Hujan 2026/2027 Diprediksi Datang Lebih Lambat (22 Sep 2026)","https://www.bmkg.go.id/siaran-pers/bmkg-el-nino-sangat-kuat-sedang-terjadi-musim-hujan-2026-2027-diprediksi-datang-lebih-lambat"],
["Dinas Pertanian dan Ketahanan Pangan Provinsi NTT: BMKG Prediksi Curah Hujan NTT Meningkat Bertahap hingga Desember 2026 (23 Sep 2026)","https://distankp.nttprov.go.id/prediksi-curah-hujan-ntt-oktober-desember-2026/"],
["detikNews: Prakiraan Awal dan Puncak Musim Hujan 2026/2027 di Indonesia (23 Sep 2026)","https://news.detik.com/berita/d-8675280/prakiraan-awal-dan-puncak-musim-hujan-2026-2027-di-indonesia"],
["SERGAP: Sambut Musim Hujan, Babinsa Tabundung Ajak Petani Siapkan Lahan Tanam Padi (6 Nov 2026)","https://sergap.co.id/2026/11/06/sambut-musim-hujan-babinsa-tabundung-ajak-petani-siapkan-lahan-tanam-padi/"]],
"image":{"w":1280,"h":853,"credit":"Jordan siva","license":"CC BY-SA 4.0","license_url":"https://creativecommons.org/licenses/by-sa/4.0","page":"https://commons.wikimedia.org/wiki/File:Liarnya_keindahan_Sumba.jpg","ai":False,
"caption":{"en":"File photo: horses graze the dry, golden savanna at Puru Kambera, East Sumba, in May 2018.",
"es":"Foto de archivo: unos caballos pastan en la sabana seca y dorada de Puru Kambera (Sumba Oriental), en mayo de 2018.",
"id":"Foto arsip: kuda merumput di sabana kering keemasan di Puru Kambera, Sumba Timur, Mei 2018."}}})

LETTER = {"section":"low-tide","slug":"1","date":"2026-11-08",
"en":{"title":"What people say at the end","kicker":"Low Tide · No. 1",
 "dek":"A nurse listened to hundreds of people in their final weeks. They kept saying five things.",
 "body":"""<p>Bronnie Ware worked for years as a palliative care nurse in Australia. She sat with people who had weeks left, sometimes days. She asked them if they regretted anything.</p>
<p>Almost nobody talked about money. Almost everyone said one of these five things:</p>
<ol class="regrets"><li>I wish I'd had the courage to live a life true to myself, not the life others expected of me.</li>
<li>I wish I hadn't worked so hard.</li>
<li>I wish I'd had the courage to express my feelings.</li>
<li>I wish I had stayed in touch with my friends.</li>
<li>I wish I had let myself be happier.</li></ol>
<p>Nobody said "I wish I'd had a bigger house".</p>
<p>The good thing about reading this today is that you still have time.</p>
<h2>Five things for this week</h2>
<ol><li>Write down one thing you would do if nobody judged you. Just write it.</li>
<li>One day this week, close the laptop an hour early.</li>
<li>Tell someone something kind you have never told them.</li>
<li>Message a friend you have not spoken to in a year. "I thought of you" is enough.</li>
<li>Go outside for ten minutes before 9 am, without your phone. Look at the sky.</li></ol>
<h2>And the sea?</h2>
<p>Researchers at the University of Exeter have studied it for years. People who live near the coast tend to report better health. And in another of their studies, people who spent about two hours a week in nature were the most likely to say they felt healthy and happy.</p>
<p>Two hours a week. Not a new life. Just a different week.</p>
<h2>From the island</h2>
<p>06:12 in Sumba. Low tide. More than 2 km of sand and not a single footprint. A few horses cross the shore. Nobody leads them. Nobody looks at a phone.</p>
<h2>Your people</h2>
<p>We are more than 160,000 people in 176 countries. Most of us have never met. Some of us will, one day, on a beach.</p>
<h2>One question</h2>
<p>Which of the five hurt the most? Reply with a number from 1 to 5. We read every answer, and next week we will tell you which one most people chose.</p>
<p>From Sumba,<br><em>The Sumba Times</em></p>
<p class="note">P.S. If you know someone who needs to read this, forward it to them. Sometimes that is all it takes.</p>"""},
"es":{"title":"Lo que dicen los que se van","kicker":"Marea baja · n.º 1",
 "dek":"Una enfermera escuchó a cientos de personas en sus últimas semanas. Repetían cinco cosas.",
 "body":"""<p>Bronnie Ware fue enfermera de cuidados paliativos en Australia durante años. Se sentaba junto a personas a las que les quedaban semanas, a veces días. Les preguntaba si se arrepentían de algo.</p>
<p>Casi nadie habló de dinero. Casi todos dijeron alguna de estas cinco cosas:</p>
<ol class="regrets"><li>Ojalá hubiera tenido el valor de vivir la vida que yo quería, y no la que los demás esperaban de mí.</li>
<li>Ojalá no hubiera trabajado tanto.</li>
<li>Ojalá me hubiera atrevido a decir lo que sentía.</li>
<li>Ojalá hubiera seguido en contacto con mis amigos.</li>
<li>Ojalá me hubiera permitido ser más feliz.</li></ol>
<p>Nadie dijo "ojalá hubiera tenido una casa más grande".</p>
<p>Lo bueno de leer esto hoy es que tú todavía estás a tiempo.</p>
<h2>Cinco cosas para esta semana</h2>
<ol><li>Escribe en un papel una cosa que harías si nadie fuera a juzgarte. Solo escríbela.</li>
<li>Un día de esta semana, cierra el ordenador una hora antes.</li>
<li>Dile a alguien algo bonito que nunca le hayas dicho.</li>
<li>Escribe hoy a un amigo con el que no hablas desde hace un año. Basta con un "me he acordado de ti".</li>
<li>Sal a la calle diez minutos antes de las 9, sin el móvil. Mira el cielo.</li></ol>
<h2>¿Y el mar?</h2>
<p>Investigadores de la Universidad de Exeter llevan años estudiándolo. Quienes viven cerca de la costa suelen declarar mejor salud. Y en otro de sus estudios, quienes pasaban unas dos horas a la semana en la naturaleza eran los que con más frecuencia decían sentirse sanos y felices.</p>
<p>Dos horas a la semana. No hace falta cambiar de vida. Basta con cambiar de semana.</p>
<h2>Desde la isla</h2>
<p>Son las 06:12 en Sumba. Marea baja. Más de 2 km de arena sin una sola huella. Unos caballos cruzan la orilla. Nadie los guía. Nadie mira el móvil.</p>
<h2>Tu gente</h2>
<p>Somos más de 160.000 personas en 176 países. La mayoría no nos conocemos. Algunos lo haremos un día, en una playa.</p>
<h2>Una pregunta</h2>
<p>¿Cuál de las cinco frases te ha dolido más? Responde con un número del 1 al 5. Leemos todas las respuestas y en la próxima carta te contamos cuál eligió más gente.</p>
<p>Desde Sumba,<br><em>The Sumba Times</em></p>
<p class="note">P.D. Si conoces a alguien que necesite leer esto, reenvíaselo. A veces es lo único que hace falta.</p>"""},
"id":{"title":"Kata mereka di akhir hidup","kicker":"Air Surut · No. 1",
 "dek":"Seorang perawat mendengarkan ratusan orang di minggu-minggu terakhir hidup mereka. Lima hal ini terus mereka ucapkan.",
 "body":"""<p>Bronnie Ware bertahun-tahun bekerja sebagai perawat paliatif di Australia. Ia duduk menemani orang-orang yang hidupnya tinggal beberapa minggu, kadang beberapa hari. Ia bertanya apakah mereka menyesali sesuatu.</p>
<p>Hampir tidak ada yang membicarakan uang. Hampir semua mengatakan salah satu dari lima hal ini:</p>
<ol class="regrets"><li>Andai saya berani menjalani hidup sesuai keinginan saya sendiri, bukan hidup yang diharapkan orang lain.</li>
<li>Andai saya tidak bekerja terlalu keras.</li>
<li>Andai saya berani mengungkapkan perasaan saya.</li>
<li>Andai saya tetap berhubungan dengan teman-teman saya.</li>
<li>Andai saya membiarkan diri saya lebih bahagia.</li></ol>
<p>Tidak ada yang berkata "andai rumah saya lebih besar".</p>
<p>Kabar baiknya, karena Anda membaca ini hari ini, Anda masih punya waktu.</p>
<h2>Lima hal untuk minggu ini</h2>
<ol><li>Tulis satu hal yang akan Anda lakukan seandainya tidak ada yang menghakimi. Cukup tuliskan.</li>
<li>Satu hari minggu ini, tutup laptop satu jam lebih awal.</li>
<li>Sampaikan kepada seseorang hal baik yang belum pernah Anda katakan kepadanya.</li>
<li>Kirim pesan kepada teman yang sudah setahun tidak Anda ajak bicara. "Aku teringat kamu" sudah cukup.</li>
<li>Keluarlah sepuluh menit sebelum jam 9 pagi, tanpa ponsel. Pandangi langit.</li></ol>
<h2>Bagaimana dengan laut?</h2>
<p>Para peneliti di University of Exeter sudah bertahun-tahun menelitinya. Orang yang tinggal dekat pantai cenderung merasa lebih sehat. Dalam penelitian lain mereka, orang yang menghabiskan sekitar dua jam seminggu di alam paling sering mengaku merasa sehat dan bahagia.</p>
<p>Dua jam seminggu. Bukan hidup baru. Cukup minggu yang berbeda.</p>
<h2>Dari pulau</h2>
<p>Pukul 06.12 di Sumba. Air surut. Lebih dari 2 km pasir tanpa satu jejak kaki pun. Beberapa kuda menyeberangi pantai. Tidak ada yang menuntunnya. Tidak ada yang melihat ponsel.</p>
<h2>Komunitas Anda</h2>
<p>Kami lebih dari 160.000 orang di 176 negara. Sebagian besar dari kita belum pernah bertemu. Sebagian akan bertemu suatu hari nanti, di sebuah pantai.</p>
<h2>Satu pertanyaan</h2>
<p>Mana dari kelima hal itu yang paling menyentuh Anda? Balas dengan angka 1 sampai 5. Kami membaca setiap jawaban, dan minggu depan kami akan memberi tahu mana yang paling banyak dipilih.</p>
<p>Dari Sumba,<br><em>The Sumba Times</em></p>
<p class="note">N.B. Jika Anda mengenal seseorang yang perlu membaca ini, teruskan kepadanya. Terkadang hanya itu yang dibutuhkan.</p>"""},
"sources":[("Bronnie Ware, The Top Five Regrets of the Dying","https://bronnieware.com/"),
           ("Wheeler et al. (2012), Does living by the coast improve health and wellbeing? Health & Place","https://pubmed.ncbi.nlm.nih.gov/22796370/"),
           ("White et al. (2019), Spending at least 120 minutes a week in nature is associated with good health and wellbeing. Scientific Reports","https://doi.org/10.1038/s41598-019-44097-3")]}
