# -*- coding: utf-8 -*-
"""Newsletter for The Sumba Times ("Sumba this week"): subscription boxes, landing/confirm/prefs pages, weekly edition
(email JSON + public archive), welcome series, alerts and the free 7-day guide. Built by build.py: newsletter.build(globals()).
Emails are sent by the Supabase function tst-newsletter, which fetches /nl/<lang>/latest.json, /nl/<lang>/welcome.json and /nl/alerts.json."""
import json, datetime, html, re

BASE = "https://thesumbatimes.com"
FIRST_WEEK = (2026, 45)
TOPICS = ["travel", "culture", "business", "surf", "pasola"]

S = {
 "en": {"name": "Sumba this week", "title": "Sumba this week: the Sunday newsletter", "desc": "Every Sunday: the week's news from Sumba, travel status, one place worth the trip and one guide. Free, with the 7-day Sumba guide as a welcome gift.",
  "box_t": "Sumba this week, every Sunday", "box_p": "The week's news, one place worth the trip and practical travel notes. Free, and you get our 7-day Sumba guide (PDF) on signing up.",
  "ph": "Your email", "btn": "Subscribe free", "ok": "Almost there: check your inbox and confirm with one click.", "ok_legacy": "Thank you. You are on the list.", "err": "Something went wrong. Please try again.", "limit": "Too many attempts today. Please try again tomorrow.",
  "privacy": "One email a week. No spam. Unsubscribe in one click.",
  "t_pasola_t": "Pasola 2027 dates by email", "t_pasola_p": "The Rato elders set the dates only weeks ahead. We will email you the moment they are confirmed, with where and how to watch.", "t_pasola_b": "Alert me",
  "t_business_t": "Sumba business and projects, weekly", "t_business_p": "Land, tourism figures, flights and new projects: what matters if you invest or work in Sumba. Neutral and sourced.",
  "t_surf_t": "Surf and sea notes from Sumba", "t_surf_p": "Season, swell windows and access news for Sumba's coasts, in the Sunday letter.",
  "t_culture_t": "Sumba's culture in your inbox", "t_culture_p": "Marapu, ikat, horses and ceremonies, explained with care every Sunday.",
  "what": "What you get", "gets": ["The 5 stories of the week, in two minutes", "Travel status: season, flights, ferries and roads", "One place worth the trip and one useful guide", "A reader's question, answered", "Free on signing up: the 7-day Sumba guide (PDF)"],
  "topics_t": "What interests you?", "topics": {"travel": "Travel", "culture": "Culture", "business": "Business and investment", "surf": "Surf", "pasola": "Pasola date alerts"},
  "archive": "Past editions", "edition": "Edition", "read_web": "Read on the web",
  "w_title": "You are in. Welcome to The Sumba Times", "w_p": "Your subscription is confirmed. The next letter arrives on Sunday morning, Sumba time.", "w_pdf": "Download the 7-day Sumba guide (PDF)", "w_share": "Know someone who dreams of Sumba? Share your link. When three friends subscribe, we send you the Sumba offline pack.", "w_copy": "Copy my link", "w_copied": "Copied",
  "bye_title": "You are unsubscribed", "bye_p": "We will not email you again. If it was a mistake, you can subscribe again below.",
  "p_title": "Your newsletter preferences", "p_save": "Save preferences", "p_saved": "Saved.", "p_lang": "Language", "p_unsub": "Unsubscribe", "p_refs": "Friends who subscribed with your link", "p_err": "This link is not valid. Subscribe again to get a new one.",
  "pop_t": "Before you go: Sumba in 7 days, free", "pop_p": "Our day-by-day guide in PDF, plus the Sunday letter with the week's news from the island.", "pop_no": "No, thanks",
  "subj": "Sumba this week", "hello": "Good morning from Sumba.", "top": "This week in Sumba", "month_t": "The island right now", "place_t": "A place worth the trip", "guide_t": "Guide of the week", "ask_t": "Ask us about Sumba", "ask_p": "Planning a trip or just curious? Reply to this email with your question. We answer one every week.",
  "poll_t": "One question for you", "poll_p": "Tap an answer. Results are on the newsletter page next week.", "ref_t": "Share Sumba", "ref_p": "Forward this letter or share your personal link. Three friends and we send you the Sumba offline pack:", "foot": "You get this email because you subscribed at thesumbatimes.com.", "prefs": "Preferences", "unsub": "Unsubscribe", "more": "Read the story",
  "voted": "Thank you for voting.", "results": "Last week's poll", "count": "readers get this letter",
  "g_title": "Sumba in 7 days: the free guide", "g_dek": "A day-by-day plan from west to east, with what to know before you go.", "g_before": "Before you go", "g_print": "Save as PDF or print", "g_plan": "The plan, day by day", "g_words": "Useful words", "g_more": "Full, updated guides at thesumbatimes.com",
  "months": ["January: the heart of the rainy season. Green hills, full waterfalls, slower roads.", "February: rains continue and the Pasola season opens in the west (Kodi, Lamboya), on dates set by the Rato elders.", "March: last weeks of rain and the Pasola of Wanokaka and Gaura. Waterfalls at their best.", "April: the rains ease and the island is at its greenest. Fewer visitors.", "May: the dry season begins. Clear days and easier roads.", "June: dry, sunny and mild. Good month for the whole island.", "July: dry season and peak travel month. Book flights early.", "August: dry and windy, golden savannas in the east.", "September: the end of the dry season, the driest landscapes of the year.", "October: hot and dry, with the first showers possible in the west.", "November: the build-up to the rains. The east usually stays dry longer than the west.", "December: the rainy season returns. Check roads and ferries before long drives."]},
 "es": {"name": "Sumba esta semana", "title": "Sumba esta semana: la newsletter de los domingos", "desc": "Cada domingo: las noticias de la semana en Sumba, el estado del viaje, un lugar que merece la pena y una guía. Gratis, con la guía de Sumba en 7 días de regalo.",
  "box_t": "Sumba esta semana, todos los domingos", "box_p": "Las noticias de la semana, un lugar que merece el viaje y notas prácticas para viajeros. Gratis, y al apuntarte recibes nuestra guía de Sumba en 7 días (PDF).",
  "ph": "Tu correo electrónico", "btn": "Suscribirme gratis", "ok": "Ya casi está: revisa tu correo y confirma con un clic.", "ok_legacy": "Gracias. Ya estás en la lista.", "err": "Algo ha fallado. Inténtalo de nuevo.", "limit": "Demasiados intentos hoy. Vuelve a probar mañana.",
  "privacy": "Un correo a la semana. Sin spam. Baja con un clic.",
  "t_pasola_t": "Las fechas de la Pasola 2027, en tu correo", "t_pasola_p": "Los ancianos rato fijan las fechas con pocas semanas de margen. Te avisamos en cuanto se confirmen, con dónde y cómo verla.", "t_pasola_b": "Avisadme",
  "t_business_t": "Negocios y proyectos en Sumba, cada semana", "t_business_p": "Tierra, cifras de turismo, vuelos y nuevos proyectos: lo que importa si inviertes o trabajas en Sumba. Con fuentes y sin favoritismos.",
  "t_surf_t": "Surf y mar en Sumba", "t_surf_p": "Temporada, ventanas de oleaje y novedades de acceso a las costas de Sumba, en la carta del domingo.",
  "t_culture_t": "La cultura de Sumba, en tu correo", "t_culture_p": "Marapu, ikat, caballos y ceremonias, explicados con cuidado cada domingo.",
  "what": "Qué recibes", "gets": ["Las 5 noticias de la semana, en dos minutos", "Estado del viaje: temporada, vuelos, ferris y carreteras", "Un lugar que merece el viaje y una guía útil", "La pregunta de un lector, respondida", "De regalo al apuntarte: la guía de Sumba en 7 días (PDF)"],
  "topics_t": "¿Qué te interesa?", "topics": {"travel": "Viajes", "culture": "Cultura", "business": "Negocios e inversión", "surf": "Surf", "pasola": "Avisos de fechas de la Pasola"},
  "archive": "Ediciones anteriores", "edition": "Edición", "read_web": "Leer en la web",
  "w_title": "Ya estás dentro. Bienvenido a The Sumba Times", "w_p": "Tu suscripción está confirmada. La próxima carta llega el domingo por la mañana, hora de Sumba.", "w_pdf": "Descargar la guía de Sumba en 7 días (PDF)", "w_share": "¿Conoces a alguien que sueña con Sumba? Comparte tu enlace. Cuando se suscriban tres amigos, te enviamos el pack de Sumba sin conexión.", "w_copy": "Copiar mi enlace", "w_copied": "Copiado",
  "bye_title": "Te has dado de baja", "bye_p": "No volveremos a escribirte. Si ha sido un error, puedes suscribirte de nuevo aquí abajo.",
  "p_title": "Tus preferencias de la newsletter", "p_save": "Guardar preferencias", "p_saved": "Guardado.", "p_lang": "Idioma", "p_unsub": "Darme de baja", "p_refs": "Amigos suscritos con tu enlace", "p_err": "Este enlace no es válido. Suscríbete de nuevo para recibir uno nuevo.",
  "pop_t": "Antes de irte: Sumba en 7 días, gratis", "pop_p": "Nuestra guía día a día en PDF y la carta del domingo con las noticias de la semana en la isla.", "pop_no": "No, gracias",
  "subj": "Sumba esta semana", "hello": "Buenos días desde Sumba.", "top": "Esta semana en Sumba", "month_t": "La isla ahora mismo", "place_t": "Un lugar que merece el viaje", "guide_t": "La guía de la semana", "ask_t": "Pregúntanos sobre Sumba", "ask_p": "¿Preparas un viaje o solo tienes curiosidad? Responde a este correo con tu pregunta. Cada semana contestamos una.",
  "poll_t": "Una pregunta para ti", "poll_p": "Pulsa una respuesta. Los resultados, la semana que viene en la página de la newsletter.", "ref_t": "Comparte Sumba", "ref_p": "Reenvía esta carta o comparte tu enlace personal. Con tres amigos te enviamos el pack de Sumba sin conexión:", "foot": "Recibes este correo porque te suscribiste en thesumbatimes.com.", "prefs": "Preferencias", "unsub": "Darme de baja", "more": "Leer la noticia",
  "voted": "Gracias por votar.", "results": "La encuesta de la semana pasada", "count": "lectores reciben esta carta",
  "g_title": "Sumba en 7 días: la guía gratuita", "g_dek": "Un plan día a día de oeste a este, con lo que conviene saber antes de salir.", "g_before": "Antes de salir", "g_print": "Guardar como PDF o imprimir", "g_plan": "El plan, día a día", "g_words": "Palabras útiles", "g_more": "Guías completas y actualizadas en thesumbatimes.com",
  "months": ["Enero: pleno corazón de la temporada de lluvias. Colinas verdes, cascadas con caudal y carreteras más lentas.", "Febrero: siguen las lluvias y arranca la temporada de la Pasola en el oeste (Kodi, Lamboya), en fechas que fijan los ancianos rato.", "Marzo: últimas semanas de lluvia y Pasola en Wanokaka y Gaura. Las cascadas, en su mejor momento.", "Abril: las lluvias aflojan y la isla luce su mayor verdor. Pocos visitantes.", "Mayo: empieza la estación seca. Días despejados y carreteras más fáciles.", "Junio: seco, soleado y templado. Buen mes para recorrer toda la isla.", "Julio: estación seca y temporada alta. Conviene reservar los vuelos con tiempo.", "Agosto: seco y ventoso, con las sabanas doradas del este.", "Septiembre: final de la estación seca, los paisajes más áridos del año.", "Octubre: calor y sequedad, con posibles primeros chubascos en el oeste.", "Noviembre: la antesala de las lluvias. El este suele seguir seco más tiempo que el oeste.", "Diciembre: vuelve la temporada de lluvias. Consulta el estado de carreteras y ferris antes de trayectos largos."]},
 "id": {"name": "Sumba pekan ini", "title": "Sumba pekan ini: nawala setiap Minggu", "desc": "Setiap Minggu: berita sepekan dari Sumba, kondisi perjalanan, satu tempat yang layak dikunjungi, dan satu panduan. Gratis, dengan bonus panduan Sumba 7 hari.",
  "box_t": "Sumba pekan ini, setiap Minggu", "box_p": "Berita sepekan, satu tempat yang layak dikunjungi, dan catatan praktis untuk pelancong. Gratis, dan Anda langsung mendapat panduan Sumba 7 hari (PDF).",
  "ph": "Email Anda", "btn": "Langganan gratis", "ok": "Sedikit lagi: periksa kotak masuk Anda dan konfirmasi dengan satu klik.", "ok_legacy": "Terima kasih. Anda sudah terdaftar.", "err": "Terjadi kesalahan. Silakan coba lagi.", "limit": "Terlalu banyak percobaan hari ini. Silakan coba lagi besok.",
  "privacy": "Satu email seminggu. Tanpa spam. Berhenti dengan satu klik.",
  "t_pasola_t": "Tanggal Pasola 2027 lewat email", "t_pasola_p": "Para Rato baru menetapkan tanggal beberapa pekan sebelumnya. Kami akan mengabari Anda begitu tanggalnya pasti, lengkap dengan lokasi dan cara menontonnya.", "t_pasola_b": "Kabari saya",
  "t_business_t": "Bisnis dan proyek di Sumba, setiap pekan", "t_business_p": "Tanah, angka pariwisata, penerbangan, dan proyek baru: hal yang penting bila Anda berinvestasi atau bekerja di Sumba. Netral dan bersumber jelas.",
  "t_surf_t": "Kabar selancar dan laut dari Sumba", "t_surf_p": "Musim, jendela ombak, dan kabar akses pantai-pantai Sumba dalam surat hari Minggu.",
  "t_culture_t": "Budaya Sumba di kotak masuk Anda", "t_culture_p": "Marapu, tenun ikat, kuda, dan upacara adat, dijelaskan dengan cermat setiap Minggu.",
  "what": "Yang Anda dapatkan", "gets": ["Lima berita sepekan, cukup dua menit", "Kondisi perjalanan: musim, penerbangan, feri, dan jalan", "Satu tempat yang layak dikunjungi dan satu panduan berguna", "Satu pertanyaan pembaca, dijawab", "Bonus saat mendaftar: panduan Sumba 7 hari (PDF)"],
  "topics_t": "Apa yang Anda minati?", "topics": {"travel": "Wisata", "culture": "Budaya", "business": "Bisnis dan investasi", "surf": "Selancar", "pasola": "Kabar tanggal Pasola"},
  "archive": "Edisi sebelumnya", "edition": "Edisi", "read_web": "Baca di situs",
  "w_title": "Anda sudah terdaftar. Selamat datang di The Sumba Times", "w_p": "Langganan Anda sudah dikonfirmasi. Surat berikutnya tiba Minggu pagi waktu Sumba.", "w_pdf": "Unduh panduan Sumba 7 hari (PDF)", "w_share": "Punya teman yang memimpikan Sumba? Bagikan tautan Anda. Setelah tiga teman berlangganan, kami kirimkan paket Sumba luring.", "w_copy": "Salin tautan saya", "w_copied": "Tersalin",
  "bye_title": "Anda sudah berhenti berlangganan", "bye_p": "Kami tidak akan mengirim email lagi. Jika ini keliru, Anda bisa berlangganan lagi di bawah.",
  "p_title": "Preferensi nawala Anda", "p_save": "Simpan preferensi", "p_saved": "Tersimpan.", "p_lang": "Bahasa", "p_unsub": "Berhenti berlangganan", "p_refs": "Teman yang berlangganan lewat tautan Anda", "p_err": "Tautan ini tidak berlaku. Berlangganan lagi untuk mendapat tautan baru.",
  "pop_t": "Sebelum pergi: Sumba 7 hari, gratis", "pop_p": "Panduan hari demi hari dalam PDF, ditambah surat hari Minggu berisi berita sepekan dari pulau ini.", "pop_no": "Tidak, terima kasih",
  "subj": "Sumba pekan ini", "hello": "Selamat pagi dari Sumba.", "top": "Sepekan di Sumba", "month_t": "Sumba saat ini", "place_t": "Tempat yang layak dikunjungi", "guide_t": "Panduan pekan ini", "ask_t": "Tanyakan soal Sumba", "ask_p": "Sedang merencanakan perjalanan atau sekadar ingin tahu? Balas email ini dengan pertanyaan Anda. Setiap pekan kami menjawab satu.",
  "poll_t": "Satu pertanyaan untuk Anda", "poll_p": "Ketuk satu jawaban. Hasilnya tampil pekan depan di halaman nawala.", "ref_t": "Bagikan Sumba", "ref_p": "Teruskan surat ini atau bagikan tautan pribadi Anda. Tiga teman, dan kami kirimkan paket Sumba luring:", "foot": "Anda menerima email ini karena berlangganan di thesumbatimes.com.", "prefs": "Preferensi", "unsub": "Berhenti berlangganan", "more": "Baca beritanya",
  "voted": "Terima kasih atas suara Anda.", "results": "Jajak pendapat pekan lalu", "count": "pembaca menerima surat ini",
  "g_title": "Sumba 7 hari: panduan gratis", "g_dek": "Rencana hari demi hari dari barat ke timur, lengkap dengan hal yang perlu diketahui sebelum berangkat.", "g_before": "Sebelum berangkat", "g_print": "Simpan sebagai PDF atau cetak", "g_plan": "Rencana hari demi hari", "g_words": "Kata-kata berguna", "g_more": "Panduan lengkap dan terbaru di thesumbatimes.com",
  "months": ["Januari: puncak musim hujan. Bukit menghijau, air terjun deras, jalan lebih lambat.", "Februari: hujan berlanjut dan musim Pasola dibuka di barat (Kodi, Lamboya) pada tanggal yang ditetapkan para Rato.", "Maret: pekan-pekan terakhir hujan serta Pasola di Wanokaka dan Gaura. Air terjun sedang bagus-bagusnya.", "April: hujan mereda dan pulau sedang hijau-hijaunya. Pengunjung masih sedikit.", "Mei: musim kemarau dimulai. Hari cerah dan jalan lebih mudah dilalui.", "Juni: kering, cerah, dan sejuk. Bulan yang baik untuk menjelajahi seluruh pulau.", "Juli: musim kemarau dan puncak kunjungan. Pesan tiket pesawat lebih awal.", "Agustus: kering dan berangin, sabana di timur menguning keemasan.", "September: akhir musim kemarau, lanskap paling kering sepanjang tahun.", "Oktober: panas dan kering, hujan pertama mulai mungkin turun di barat.", "November: menjelang musim hujan. Bagian timur biasanya lebih lama kering daripada barat.", "Desember: musim hujan kembali. Periksa kondisi jalan dan feri sebelum perjalanan jauh."]},
}

POLLS = [
 ("when", {"en": "When would you travel to Sumba?", "es": "¿Cuándo viajarías a Sumba?", "id": "Kapan Anda ingin ke Sumba?"},
  {"en": ["Dry season (May-Sep)", "For the Pasola (Feb-Mar)", "Green season (Dec-Apr)", "I already live here"], "es": ["Estación seca (may-sep)", "Para la Pasola (feb-mar)", "Temporada verde (dic-abr)", "Ya vivo aquí"], "id": ["Musim kemarau (Mei-Sep)", "Saat Pasola (Feb-Mar)", "Musim hijau (Des-Apr)", "Saya sudah tinggal di sini"]}),
 ("why", {"en": "What draws you most to Sumba?", "es": "¿Qué te atrae más de Sumba?", "id": "Apa yang paling menarik Anda ke Sumba?"},
  {"en": ["Beaches and lagoons", "Culture and villages", "Surf", "Empty landscapes"], "es": ["Playas y lagunas", "Cultura y pueblos", "Surf", "Paisajes sin gente"], "id": ["Pantai dan laguna", "Budaya dan kampung adat", "Selancar", "Lanskap yang sepi"]}),
 ("days", {"en": "How long would you stay?", "es": "¿Cuántos días te quedarías?", "id": "Berapa lama Anda ingin tinggal?"},
  {"en": ["3-4 days", "5-7 days", "8-10 days", "More than 10"], "es": ["3-4 días", "5-7 días", "8-10 días", "Más de 10"], "id": ["3-4 hari", "5-7 hari", "8-10 hari", "Lebih dari 10"]}),
 ("read", {"en": "What should we cover more?", "es": "¿De qué deberíamos hablar más?", "id": "Topik apa yang perlu lebih sering kami bahas?"},
  {"en": ["Flights and ferries", "Culture and people", "Business and land", "Places to see"], "es": ["Vuelos y ferris", "Cultura y gente", "Negocios y tierra", "Lugares que ver"], "id": ["Penerbangan dan feri", "Budaya dan masyarakat", "Bisnis dan tanah", "Tempat wisata"]}),
 ("how", {"en": "How would you get around Sumba?", "es": "¿Cómo te moverías por Sumba?", "id": "Bagaimana Anda berkeliling Sumba?"},
  {"en": ["Car with driver", "Motorbike", "Organised tour", "Not sure yet"], "es": ["Coche con conductor", "Moto", "Viaje organizado", "Aún no lo sé"], "id": ["Mobil dengan sopir", "Sepeda motor", "Tur terorganisasi", "Belum tahu"]}),
 ("with", {"en": "Who would you travel with?", "es": "¿Con quién viajarías?", "id": "Dengan siapa Anda akan bepergian?"},
  {"en": ["Alone", "As a couple", "With family", "With friends"], "es": ["Por mi cuenta", "En pareja", "En familia", "Con amigos"], "id": ["Sendiri", "Berdua", "Bersama keluarga", "Bersama teman"]}),
]

WELCOME = [  # (day, guide slug, subject, intro) per language; the body reuses the guide's own quick answer and key facts
 (0, None, {"en": "Welcome to The Sumba Times (your 7-day guide inside)", "es": "Bienvenido a The Sumba Times (dentro, tu guía de 7 días)", "id": "Selamat datang di The Sumba Times (panduan 7 hari di dalam)"},
  {"en": "Thank you for subscribing. Here is your free guide, Sumba in 7 days, and what to expect: one letter every Sunday with the week's news from the island, one place worth the trip and practical notes for travellers.", "es": "Gracias por suscribirte. Aquí tienes tu guía gratuita, Sumba en 7 días, y lo que vas a recibir: una carta cada domingo con las noticias de la semana en la isla, un lugar que merece el viaje y notas prácticas para viajeros.", "id": "Terima kasih sudah berlangganan. Berikut panduan gratis Anda, Sumba 7 hari, dan yang akan Anda terima: satu surat setiap Minggu berisi berita sepekan dari pulau ini, satu tempat yang layak dikunjungi, dan catatan praktis untuk pelancong."}),
 (2, "best-time-to-visit-sumba", {"en": "When to go to Sumba (the short answer)", "es": "Cuándo ir a Sumba (la respuesta corta)", "id": "Kapan sebaiknya ke Sumba (jawaban singkat)"},
  {"en": "The first question everyone asks is when to go. Here is our short answer, and the month-by-month guide if you want the detail.", "es": "La primera pregunta de todo el mundo es cuándo ir. Esta es nuestra respuesta corta, y la guía mes a mes por si quieres el detalle.", "id": "Pertanyaan pertama hampir semua orang: kapan sebaiknya berangkat. Ini jawaban singkat kami, dan panduan bulan demi bulan bila Anda ingin rinciannya."}),
 (4, "how-to-get-to-sumba-from-bali", {"en": "How to get to Sumba", "es": "Cómo llegar a Sumba", "id": "Cara menuju Sumba"},
  {"en": "Sumba is closer than it looks on the map. This is how most travellers arrive.", "es": "Sumba está más cerca de lo que parece en el mapa. Así llega la mayoría de los viajeros.", "id": "Sumba lebih dekat daripada yang terlihat di peta. Beginilah kebanyakan pelancong tiba."}),
 (6, "pasola-explained", {"en": "The Pasola, Marapu and why Sumba feels different", "es": "La Pasola, el marapu y por qué Sumba es distinta", "id": "Pasola, Marapu, dan mengapa Sumba terasa berbeda"},
  {"en": "What sets Sumba apart is its living culture. Start with the Pasola.", "es": "Lo que distingue a Sumba es su cultura viva. Empieza por la Pasola.", "id": "Yang membedakan Sumba adalah budayanya yang masih hidup. Mulailah dari Pasola."}),
 (9, "sumba-travel-costs", {"en": "What a trip to Sumba costs (and a question for you)", "es": "Cuánto cuesta un viaje a Sumba (y una pregunta para ti)", "id": "Berapa biaya perjalanan ke Sumba (dan satu pertanyaan untuk Anda)"},
  {"en": "Last note of this welcome series: the money. After this, you will hear from us on Sundays only. If you have a question about Sumba, just reply to this email.", "es": "Última nota de esta bienvenida: el dinero. A partir de ahora solo te escribiremos los domingos. Si tienes alguna pregunta sobre Sumba, responde a este correo.", "id": "Catatan terakhir dari seri sambutan ini: soal biaya. Setelah ini kami hanya menyapa setiap Minggu. Jika punya pertanyaan tentang Sumba, cukup balas email ini."}),
]

def esc(s): return html.escape(str(s), quote=True)
def strip(h): return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h or "")).strip()

def topic_of(a):
    sl = (a or {}).get("slug", ""); sec = (a or {}).get("section", "")
    if "pasola" in sl: return "pasola"
    if "surf" in sl: return "surf"
    if sec in ("business", "projects"): return "business"
    if sec == "culture": return "culture"
    return "travel"

def box(l, inline=False, topic=None, src=""):
    s = S[l]; t = topic if topic in ("pasola", "business", "surf", "culture") else None
    title = s[f"t_{t}_t"] if t else s["box_t"]; text = s[f"t_{t}_p"] if t else s["box_p"]
    btn = s["t_pasola_b"] if t == "pasola" else s["btn"]
    cls = "sub in" if inline else "sub"; hid = "" if inline else ' id="subscribe"'
    return f"""<div class="{cls}"{hid}><h3>{title}</h3><p>{text}</p>
<form onsubmit="return stSub(event,this)" data-topic="{t or 'travel'}" data-src="{esc(src)}"><input type="email" name="email" required autocomplete="email" placeholder="{esc(s["ph"])}" aria-label="{esc(s["ph"])}"><input type="text" name="w" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"><button type="submit">{btn}</button></form>
<div class="msg" role="status" aria-live="polite"></div><small>{s["privacy"]} <a href="/{l}/newsletter/">{s["name"]}</a></small></div>"""

def js(l, SB_URL, SB_ANON):
    s = S[l]
    return f"""<script>function stSub(e,f){{e.preventDefault();var m=f.parentNode.querySelector('.msg'),em=f.email.value.trim().toLowerCase(),tp=[];
f.querySelectorAll('input[name=topic]:checked').forEach(function(c){{tp.push(c.value)}});if(!tp.length)tp=[f.getAttribute('data-topic')||'travel'];if(tp.indexOf('travel')<0&&tp.length<2)tp.push('travel');
var ref='';try{{ref=new URLSearchParams(location.search).get('ref')||localStorage.getItem('st-ref')||''}}catch(_){{}}
var done=function(t){{m.textContent=t;f.reset();try{{localStorage.setItem('st-sub','1');clarity('event','subscribe')}}catch(_){{}}var p=document.getElementById('st-pop');if(p)setTimeout(function(){{p.hidden=true}},2500)}};
var legacy=function(){{fetch('{SB_URL}/rest/v1/newsletter_subscribers',{{method:'POST',headers:{{'apikey':'{SB_ANON}','Authorization':'Bearer {SB_ANON}','Content-Type':'application/json','Prefer':'return=minimal'}},body:JSON.stringify({{email:em,name:'The Sumba Times ({l})'}})}}).then(function(r){{if(r.ok||r.status===409)done({json.dumps(s["ok_legacy"])});else m.textContent={json.dumps(s["err"])}}}).catch(function(){{m.textContent={json.dumps(s["err"])}}})}};
fetch('/api/nl/subscribe',{{method:'POST',headers:{{'content-type':'application/json'}},body:JSON.stringify({{email:em,lang:'{l}',topics:tp,src:(f.getAttribute('data-src')||'')+' '+location.pathname,ref:ref,w:f.w?f.w.value:''}})}})
.then(function(r){{if(r.status===503)return legacy();if(r.status===429){{m.textContent={json.dumps(s["limit"])};return}}if(r.ok)done({json.dumps(s["ok"])});else m.textContent={json.dumps(s["err"])}}}).catch(legacy);return false}}
(function(){{try{{var q=new URLSearchParams(location.search).get('ref');if(q)localStorage.setItem('st-ref',q)}}catch(_){{}}
var p=document.getElementById('st-pop');if(!p)return;var K='st-pop',ok=function(){{try{{if(localStorage.getItem('st-sub'))return false;var t=+localStorage.getItem(K)||0;return Date.now()-t>14*864e5}}catch(_){{return false}}}};
var show=function(){{if(!ok()||!p.hidden)return;p.hidden=false;try{{localStorage.setItem(K,Date.now())}}catch(_){{}}}};
p.addEventListener('click',function(e){{if(e.target===p||e.target.hasAttribute('data-x'))p.hidden=true}});addEventListener('keydown',function(e){{if(e.key==='Escape')p.hidden=true}});
var t0=Date.now();document.addEventListener('mouseout',function(e){{if(!e.relatedTarget&&e.clientY<8&&Date.now()-t0>15000)show()}});
var top=0;addEventListener('scroll',function(){{var y=scrollY,h=document.documentElement.scrollHeight-innerHeight;if(matchMedia('(max-width:820px)').matches&&h>1500&&y/h>.6&&y<top-60&&Date.now()-t0>30000)show();top=Math.max(top,y)}},{{passive:true}})}})();</script>"""

def popup(l):
    s = S[l]
    return f"""<div id="st-pop" class="pop" hidden role="dialog" aria-modal="true" aria-label="{esc(s["pop_t"])}"><div class="pop-b"><button type="button" class="pop-x" data-x aria-label="{esc(s["pop_no"])}">×</button><h3>{s["pop_t"]}</h3><p>{s["pop_p"]}</p>
<form onsubmit="return stSub(event,this)" data-topic="travel" data-src="popup"><input type="email" name="email" required autocomplete="email" placeholder="{esc(s["ph"])}" aria-label="{esc(s["ph"])}"><input type="text" name="w" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"><button type="submit">{s["btn"]}</button></form>
<div class="msg" role="status" aria-live="polite"></div><small>{s["privacy"]}</small><p><button type="button" class="pop-no" data-x>{s["pop_no"]}</button></p></div></div>"""

CSS = """.pop{position:fixed;inset:0;background:rgba(20,18,15,.55);z-index:90;display:flex;align-items:center;justify-content:center;padding:16px}.pop[hidden]{display:none}
.pop-b{background:var(--bg);color:var(--ink);max-width:460px;width:100%;padding:26px 24px 18px;border:1px solid var(--ink);position:relative;box-shadow:0 20px 60px rgba(0,0,0,.3)}.pop-b h3{font-size:26px;margin:0 0 8px;line-height:1.15}.pop-b form{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 8px}.pop-b input[type=email]{flex:1;min-width:180px;padding:12px;border:1px solid var(--ink);background:var(--bg);color:var(--ink);font:inherit}.pop-b form button{padding:12px 16px;background:var(--ink);color:var(--bg);border:0;font:inherit;cursor:pointer}
.pop-x{position:absolute;top:6px;right:8px;border:0;background:none;font-size:26px;line-height:1;cursor:pointer;color:var(--ink);min-width:44px;min-height:44px}.pop-no{border:0;background:none;color:var(--muted);text-decoration:underline;cursor:pointer;font:inherit;font-size:14px;padding:8px 0}
.nlg{list-style:none;padding:0;margin:14px 0 22px}.nlg li{padding:9px 0 9px 28px;border-bottom:1px solid var(--line);position:relative}.nlg li:before{content:"✓";position:absolute;left:4px;color:var(--accent);font-weight:700}
.tpc{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 14px}.tpc label{border:1px solid currentColor;border-radius:999px;padding:8px 13px;cursor:pointer;font-size:15px;display:inline-flex;gap:7px;align-items:center;min-height:40px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}.tpc input[type=checkbox]{width:16px!important;height:16px!important;min-height:0!important;padding:0!important;margin:0;flex:none!important;accent-color:var(--accent)}
.ed h2{font-size:24px;margin:26px 0 8px;border-top:1px solid var(--ink);padding-top:14px}.ed .it{padding:10px 0;border-bottom:1px solid var(--line)}.ed .it h3{margin:0 0 4px;font-size:20px}.ed .it p{margin:0}
.btnp{display:inline-block;background:var(--accent);color:var(--card);padding:13px 20px;text-decoration:none;border-radius:4px;border:0;font:inherit;cursor:pointer}.btnp:hover{opacity:.9;color:var(--card)}
@media print{.m,.bar,nav,footer,.sa,.pop,.np,.ticker{display:none!important}body{background:#fff;padding:0}.gpdf h2{break-after:avoid}.gpdf section{break-inside:auto}a{text-decoration:none;color:#000}}
.gpdf .cover{border:3px double var(--ink);padding:34px 22px;text-align:center;margin:10px 0 26px}.gpdf .cover h1{font-size:44px;margin:8px 0}.gpdf table{width:100%;border-collapse:collapse}.gpdf td,.gpdf th{border-bottom:1px solid var(--line);padding:7px 6px;text-align:left;vertical-align:top}"""

# ---------- email rendering ----------
def mail(l, pre, inner):
    s = S[l]
    return (f'<!doctype html><html lang="{l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f7f3ec">'
            f'<div style="display:none;max-height:0;overflow:hidden">{esc(pre)}</div>'
            f'<div style="max-width:600px;margin:0 auto;padding:22px 18px;font-family:Georgia,\'Times New Roman\',serif;color:#1d1b18;font-size:17px;line-height:1.55">'
            f'<div style="text-align:center;border-bottom:3px double #1d1b18;padding-bottom:10px;margin-bottom:18px"><a href="{BASE}/{l}/" style="font-size:30px;font-weight:700;color:#1d1b18;text-decoration:none">The Sumba Times</a></div>'
            f'{inner}'
            f'<p style="font-size:13px;color:#6b645a;border-top:1px solid #d9d2c5;padding-top:14px;margin-top:26px;font-family:Arial,Helvetica,sans-serif">{s["foot"]} <a href="{{{{PREFS}}}}" style="color:#6b645a">{s["prefs"]}</a> · <a href="{{{{UNSUB}}}}" style="color:#6b645a">{s["unsub"]}</a><br>The Sumba Times · Sumba, Nusa Tenggara Timur, Indonesia</p></div></body></html>')
H2 = 'style="font-size:14px;letter-spacing:.08em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;color:#8a2d1b;border-top:1px solid #1d1b18;padding-top:12px;margin:24px 0 8px"'
A = 'style="color:#1d1b18"'
BTN = 'style="display:inline-block;background:#8a2d1b;color:#ffffff;padding:12px 18px;text-decoration:none;border-radius:4px;font-family:Arial,Helvetica,sans-serif;font-size:15px"'

def week_bounds(y, w):
    mon = datetime.date.fromisocalendar(y, w, 1); return mon, mon + datetime.timedelta(days=6)

def edition(g, l, y, w):
    """Content of the edition for ISO week (y, w): dict with id, stories, place, guide, poll, month note."""
    mon, sun = week_bounds(y, w)
    briefs = [a for a in g["all_items"]() if g["kind_of"](a) == "brief"]
    its = [a for a in briefs if mon.isoformat() <= a["date"] <= sun.isoformat()]
    if len(its) < 3: its = (its + [a for a in briefs if a["date"] < mon.isoformat() and a not in its])[:5]
    its = its[:6]
    n = y * 53 + w
    places = sorted([a for a in g["all_items"]() if a["section"] == "places"], key=lambda a: a["slug"])
    guides = sorted([a for a in g["travel_guides"]() if a["section"] != "places"], key=lambda a: a["slug"])
    return {"id": f"{y}-W{w:02d}", "mon": mon, "sun": sun, "items": its, "place": places[n % len(places)] if places else None,
            "guide": guides[n % len(guides)] if guides else None, "poll": POLLS[n % len(POLLS)], "month": S[l]["months"][sun.month - 1]}

def fdate(g, d, l):
    try: return g["fdate"]({"date": d.isoformat(), "time": "06:00"}, l, False)
    except Exception: return d.isoformat()

def edition_email(g, l, e):
    s = S[l]; u = lambda a: BASE + g["url_of"](a, l) + "?utm_source=newsletter&utm_medium=email&utm_campaign=" + e["id"]
    top = e["items"][0] if e["items"] else None
    h = f'<p>{s["hello"]}</p><h2 {H2}>{s["top"]}</h2>'
    for a in e["items"]:
        h += f'<p style="margin:0 0 14px"><a href="{u(a)}" {A}><b style="font-size:19px;line-height:1.3">{esc(a[l]["title"])}</b></a><br>{esc(a[l].get("dek") or "")}</p>'
    h += f'<h2 {H2}>{s["month_t"]}</h2><p>{esc(e["month"])} <a href="{BASE}/{l}/plan/" {A}>{esc(g["T"][l].get("plan_title", "Plan"))}</a></p>'
    if e["place"]:
        p = e["place"]; h += f'<h2 {H2}>{s["place_t"]}</h2><p><a href="{u(p)}" {A}><b>{esc(p[l]["title"])}</b></a><br>{esc(p[l].get("answer") or p[l].get("dek") or "")}</p>'
    if e["guide"]:
        p = e["guide"]; h += f'<h2 {H2}>{s["guide_t"]}</h2><p><a href="{u(p)}" {A}><b>{esc(p[l]["title"])}</b></a><br>{esc(p[l].get("dek") or "")}</p>'
    pid, pq, po = e["poll"]; pk = f'{e["id"]}-{pid}'
    h += f'<h2 {H2}>{s["poll_t"]}</h2><p><b>{esc(pq[l])}</b><br>' + " ".join(f'<a href="{BASE}/api/nl/vote?p={pk}&o={i}&t={{{{TOKEN}}}}" style="display:inline-block;border:1px solid #1d1b18;border-radius:999px;padding:7px 12px;margin:6px 6px 0 0;color:#1d1b18;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px">{esc(o)}</a>' for i, o in enumerate(po[l])) + f'<br><span style="font-size:14px;color:#6b645a">{s["poll_p"]}</span></p>'
    h += f'<h2 {H2}>{s["ask_t"]}</h2><p>{s["ask_p"]}</p>'
    h += f'<h2 {H2}>{s["ref_t"]}</h2><p>{s["ref_p"]}<br><a href="{{{{REF}}}}" {A}>{{{{REF}}}}</a></p>'
    subj = f'{s["subj"]}: {top[l]["title"]}' if top else s["subj"]
    return subj[:140], mail(l, top[l].get("dek", "") if top else s["desc"], h)

def edition_page(g, l, e, latest):
    s = S[l]; tpl = "/{l}/newsletter/" + e["id"].lower() + "/"
    title = f'{s["name"]}: {fdate(g, e["sun"], l)}'
    rows = "".join(f'<div class="it"><h3><a href="{g["url_of"](a, l)}">{esc(a[l]["title"])}</a></h3><p>{esc(a[l].get("dek") or "")}</p></div>' for a in e["items"])
    b = f'<h2>{s["top"]}</h2>{rows}<h2>{s["month_t"]}</h2><p>{esc(e["month"])}</p>'
    for k, t in (("place", s["place_t"]), ("guide", s["guide_t"])):
        p = e[k]
        if p: b += f'<h2>{t}</h2><div class="it"><h3><a href="{g["url_of"](p, l)}">{esc(p[l]["title"])}</a></h3><p>{esc(p[l].get("answer") or p[l].get("dek") or "")}</p></div>'
    ld = {"@context": "https://schema.org", "@type": "ItemList", "name": title, "inLanguage": l, "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": BASE + g["url_of"](a, l), "name": a[l]["title"]} for i, a in enumerate(e["items"])]}
    pg = g["head"](l, title + " · The Sumba Times", s["desc"], tpl, extra=f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>') + g["masthead"](l, tpl)
    pg += f'<main id="main" class="w"><div class="nar ed"><div class="crumbs"><a href="/{l}/">{g["X"][l]["home"]}</a> › <a href="/{l}/newsletter/">{s["name"]}</a></div><p class="k">{s["edition"]} {e["id"]}</p><h1>{esc(title)}</h1>{b}<div style="margin-top:26px">{box(l, src="edition")}</div></div></main>' + g["footer"](l)
    g["write"](tpl.format(l=l), pg)
    return tpl.format(l=l), title

def guide_page(g, l):
    """Print-ready free guide 'Sumba in 7 days', composed only from published, sourced guides."""
    s = S[l]; by = {a["slug"]: a for a in g["all_items"]()}
    tpl = "/{l}/guide/sumba-7-days/"
    before = ""
    for sl in ("best-time-to-visit-sumba", "how-to-get-to-sumba-from-bali", "getting-around-sumba", "sumba-travel-costs", "sumba-travel-safety-health"):
        a = by.get(sl)
        if not a or not a[l].get("answer"): continue
        facts = "".join(f"<tr><th>{esc(k)}</th><td>{esc(strip(v))}</td></tr>" for k, v in (a.get("facts") or {}).get(l, [])[:5])
        before += f'<section><h3>{esc(a[l]["title"])}</h3><p>{esc(a[l]["answer"])}</p>{"<table>" + facts + "</table>" if facts else ""}<p class="np"><a href="{g["url_of"](a, l)}">{BASE}{g["url_of"](a, l)}</a></p></section>'
    it = by.get("sumba-itinerary-5-7-10-days"); plan = ""
    if it:
        plan = g["fix_links"](g["body_raw"](it, l)).replace('href="/', f'href="{BASE}/')
    ph = by.get("sumba-phrasebook-useful-words"); words = ""
    if ph:
        m = re.search(r"<table.*?</table>", g["body_raw"](ph, l), re.S)
        words = m.group(0) if m else ""
    pg = g["head"](l, s["g_title"] + " · The Sumba Times", s["g_dek"], tpl, noindex=True) + g["masthead"](l, tpl)
    pg += f"""<main id="main" class="w"><article class="nar gpdf"><p class="np"><button class="btnp" onclick="print()">{s["g_print"]}</button></p>
<div class="cover"><p class="k">The Sumba Times</p><h1>{s["g_title"].split(":")[0]}</h1><p class="dek">{s["g_dek"]}</p><p>thesumbatimes.com · {g["NOW"].strftime("%Y")}</p></div>
<h2>{s["g_before"]}</h2>{before}<h2>{s["g_plan"]}</h2><div class="body">{plan}</div>{f'<h2>{s["g_words"]}</h2>{words}' if words else ''}
<p><b>{s["g_more"]}</b></p><div class="np" style="margin-top:24px">{box(l, src="guide")}</div></article></main>""" + g["footer"](l)
    g["write"](tpl.format(l=l), pg)

def welcome_json(g, l):
    s = S[l]; by = {a["slug"]: a for a in g["all_items"]()}; out = []
    for day, slug, subj, intro in WELCOME:
        h = f'<p>{intro[l]}</p>'
        if slug is None:
            h += f'<p><a href="{BASE}/pdf/sumba-7-days-{l}.pdf" {BTN}>{s["w_pdf"]}</a></p><h2 {H2}>{s["what"]}</h2><ul>' + "".join(f"<li>{x}</li>" for x in s["gets"][:4]) + "</ul>"
            h += f'<h2 {H2}>{s["ref_t"]}</h2><p>{s["ref_p"]}<br><a href="{{{{REF}}}}" {A}>{{{{REF}}}}</a></p>'
        else:
            a = by.get(slug)
            if not a: continue
            u = BASE + g["url_of"](a, l) + "?utm_source=newsletter&utm_medium=email&utm_campaign=welcome"
            facts = "".join(f'<tr><td style="padding:6px 8px 6px 0;border-bottom:1px solid #d9d2c5;font-weight:700;vertical-align:top">{esc(k)}</td><td style="padding:6px 0;border-bottom:1px solid #d9d2c5">{esc(strip(v))}</td></tr>' for k, v in (a.get("facts") or {}).get(l, [])[:5])
            h += f'<h2 {H2}>{esc(a[l]["title"])}</h2><p>{esc(a[l].get("answer") or a[l].get("dek") or "")}</p>' + (f'<table style="width:100%;border-collapse:collapse;font-size:15px">{facts}</table>' if facts else "") + f'<p style="margin-top:16px"><a href="{u}" {BTN}>{esc(g["UI"][l].get("read", "Read"))}</a></p>'
        out.append({"day": day, "subject": subj[l], "html": mail(l, intro[l], h)})
    rw = {"en": ("Your Sumba offline pack (thank you for sharing)", "Three friends subscribed with your link. Thank you. Here is the Sumba offline pack: our guides to keep on your phone when there is no signal."),
          "es": ("Tu pack de Sumba sin conexión (gracias por compartir)", "Tres amigos se han suscrito con tu enlace. Gracias. Aquí tienes el pack de Sumba sin conexión: nuestras guías para llevar en el móvil cuando no haya cobertura."),
          "id": ("Paket Sumba luring Anda (terima kasih sudah berbagi)", "Tiga teman berlangganan lewat tautan Anda. Terima kasih. Inilah paket Sumba luring: panduan kami untuk disimpan di ponsel saat tidak ada sinyal.")}[l]
    reward = {"subject": rw[0], "html": mail(l, rw[1], f'<p>{rw[1]}</p><p><a href="{BASE}/{l}/guide/sumba-7-days/" {BTN}>{s["g_title"]}</a></p><p><a href="{BASE}/{l}/plan/" {A}>{BASE}/{l}/plan/</a></p>')}
    g["write"](f"/nl/{l}/welcome.json", json.dumps({"emails": out, "reward": reward}, ensure_ascii=False))

def alerts_json(g):
    """Items with "alert": "<topic>" (pasola, travel, business, surf, culture) become a one-off email to subscribers of that topic for 5 days."""
    al = []
    for a in g["all_items"]():
        t = a.get("alert")
        if t not in TOPICS: continue
        until = (g["dt"](a) + datetime.timedelta(days=5)).isoformat()
        d = {"id": a["slug"], "topic": t, "until": until}
        for l in ("en", "es", "id"):
            u = BASE + g["url_of"](a, l) + "?utm_source=newsletter&utm_medium=email&utm_campaign=alert"
            h = f'<h1 style="font-size:24px;line-height:1.25">{esc(a[l]["title"])}</h1><p>{esc(a[l].get("answer") or a[l].get("dek") or "")}</p><p><a href="{u}" {BTN}>{S[l]["more"]}</a></p>'
            d[l] = {"subject": a[l]["title"][:140], "html": mail(l, a[l].get("dek", ""), h)}
        al.append(d)
    g["write"]("/nl/alerts.json", json.dumps({"alerts": al}, ensure_ascii=False))

def simple_page(g, l, path, title, body, noindex=True):
    tpl = "/{l}/newsletter/" + path
    pg = g["head"](l, title + " · The Sumba Times", S[l]["desc"], tpl, noindex=noindex) + g["masthead"](l, tpl)
    pg += f'<main id="main" class="w"><div class="nar"><div class="crumbs"><a href="/{l}/">{g["X"][l]["home"]}</a> › <a href="/{l}/newsletter/">{S[l]["name"]}</a></div>{body}</div></main>' + g["footer"](l)
    g["write"](tpl.format(l=l), pg)

def build(g):
    NOW = g["NOW"]; y, w, _ = NOW.isocalendar(); LANGS = g["LANGS"]
    weeks = []; yy, ww = FIRST_WEEK
    while (yy, ww) <= (y, w):
        weeks.append((yy, ww)); nxt = datetime.date.fromisocalendar(yy, ww, 1) + datetime.timedelta(days=7); yy, ww, _ = nxt.isocalendar()
    for l in LANGS:
        s = S[l]; arch = []
        for (yy, ww) in weeks:
            e = edition(g, l, yy, ww)
            if not e["items"]: continue
            p, t = edition_page(g, l, e, (yy, ww) == (y, w)); arch.append((p, t))
            if (yy, ww) == (y, w):
                subj, htm = edition_email(g, l, e)
                g["write"](f"/nl/{l}/latest.json", json.dumps({"id": e["id"], "subject": subj, "html": htm, "web": BASE + p}, ensure_ascii=False))
        welcome_json(g, l); guide_page(g, l)
        # landing
        tp = "".join(f'<label><input type="checkbox" name="topic" value="{k}"{" checked" if k in ("travel", "culture") else ""}> {v}</label>' for k, v in s["topics"].items())
        form = f"""<div class="sub" id="subscribe"><form onsubmit="return stSub(event,this)" data-topic="travel" data-src="landing"><p><b>{s["topics_t"]}</b></p><div class="tpc">{tp}</div><input type="email" name="email" required autocomplete="email" placeholder="{esc(s["ph"])}" aria-label="{esc(s["ph"])}"><input type="text" name="w" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"><button type="submit">{s["btn"]}</button></form><div class="msg" role="status" aria-live="polite"></div><small>{s["privacy"]}</small></div>"""
        pid, pq, po = POLLS[((y * 53 + w) - 1) % len(POLLS)]
        prev = datetime.date.fromisocalendar(y, w, 1) - datetime.timedelta(days=7); py, pw, _ = prev.isocalendar(); pk = f"{py}-W{pw:02d}-{pid}"
        body = f"""<h1>{s["title"]}</h1><p class="dek">{s["desc"]}</p><p id="nl-voted" hidden><b>{s["voted"]}</b></p><p id="nl-count" hidden></p>
<h2>{s["what"]}</h2><ul class="nlg">{"".join(f"<li>{x}</li>" for x in s["gets"])}</ul>{form}
<div id="nl-res" hidden><h2>{s["results"]}</h2><p><b>{esc(pq[l])}</b></p><div id="nl-res-b"></div></div>
<h2>{s["archive"]}</h2><ul>{"".join(f'<li><a href="{p}">{esc(t)}</a></li>' for p, t in reversed(arch))}</ul>
<script>(function(){{var q=new URLSearchParams(location.search);if(q.get('voted'))document.getElementById('nl-voted').hidden=false;
fetch('/api/nl/count').then(function(r){{return r.json()}}).then(function(j){{if(j.n>=1000){{var c=document.getElementById('nl-count');c.textContent=j.n.toLocaleString('{l}')+' {s["count"]}';c.hidden=false}}}}).catch(function(){{}});
var O={json.dumps(po[l], ensure_ascii=False)};fetch('/api/nl/results?p={pk}').then(function(r){{return r.json()}}).then(function(j){{var t=0;(j.results||[]).forEach(function(x){{t+=x.n}});if(t<5)return;var h='';(j.results||[]).forEach(function(x){{var pc=Math.round(100*x.n/t);h+='<p style="margin:6px 0">'+O[x.option]+' <b>'+pc+'%</b><span style="display:block;height:6px;background:var(--accent);width:'+pc+'%"></span></p>'}});document.getElementById('nl-res-b').innerHTML=h;document.getElementById('nl-res').hidden=false}}).catch(function(){{}})}})();</script>"""
        tpl = "/{l}/newsletter/"
        ld = {"@context": "https://schema.org", "@type": "WebPage", "name": s["title"], "description": s["desc"], "inLanguage": l, "url": BASE + tpl.format(l=l)}
        pg = g["head"](l, s["title"] + " · The Sumba Times", s["desc"], tpl, extra=f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>') + g["masthead"](l, tpl)
        pg += f'<main id="main" class="w"><div class="nar"><div class="crumbs"><a href="/{l}/">{g["X"][l]["home"]}</a></div>{body}</div></main>' + g["footer"](l)
        g["write"](tpl.format(l=l), pg)
        # welcome / bye / prefs
        simple_page(g, l, "welcome/", s["w_title"], f"""<h1>{s["w_title"]}</h1><p class="dek">{s["w_p"]}</p><p><a class="btnp" href="/pdf/sumba-7-days-{l}.pdf">{s["w_pdf"]}</a></p>
<h2>{s["ref_t"]}</h2><p>{s["w_share"]}</p><p><input id="rf" readonly style="width:100%;padding:10px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font:inherit"> <button class="btnp" style="margin-top:8px" onclick="var i=document.getElementById('rf');i.select();try{{navigator.clipboard.writeText(i.value)}}catch(e){{document.execCommand('copy')}};this.textContent='{s["w_copied"]}'">{s["w_copy"]}</button></p>
<script>try{{localStorage.setItem('st-sub','1')}}catch(e){{}};document.getElementById('rf').value='{BASE}/{l}/newsletter/?ref='+(new URLSearchParams(location.search).get('ref')||'')</script>""")
        simple_page(g, l, "bye/", s["bye_title"], f'<h1>{s["bye_title"]}</h1><p class="dek">{s["bye_p"]}</p>{box(l, src="bye")}<script>try{{localStorage.removeItem("st-sub")}}catch(e){{}}</script>')
        tp2 = "".join(f'<label><input type="checkbox" name="topic" value="{k}"> {v}</label>' for k, v in s["topics"].items())
        ln = "".join(f'<option value="{k}">{v}</option>' for k, v in (("en", "English"), ("es", "Español"), ("id", "Bahasa Indonesia")))
        simple_page(g, l, "prefs/", s["p_title"], f"""<h1>{s["p_title"]}</h1><div id="pf" hidden><form onsubmit="return pfSave(event,this)"><p><b>{s["topics_t"]}</b></p><div class="tpc">{tp2}</div><p><label>{s["p_lang"]} <select name="lang" style="padding:8px;font:inherit">{ln}</select></label></p><p><button class="btnp" type="submit">{s["p_save"]}</button> <span id="pm" role="status"></span></p></form>
<p>{s["p_refs"]}: <b id="pr">0</b></p><p><a id="pu" href="#">{s["p_unsub"]}</a></p></div><p id="pe" hidden>{s["p_err"]} <a href="/{l}/newsletter/">{s["name"]}</a></p>
<script>var T=new URLSearchParams(location.search).get('t')||'';fetch('/api/nl/prefs?t='+T).then(function(r){{if(!r.ok)throw 0;return r.json()}}).then(function(j){{document.getElementById('pf').hidden=false;document.querySelectorAll('#pf input[name=topic]').forEach(function(c){{c.checked=(j.topics||[]).indexOf(c.value)>=0}});document.querySelector('#pf select').value=j.lang;document.getElementById('pr').textContent=j.referrals||0;document.getElementById('pu').href='/api/nl/unsub?t='+T}}).catch(function(){{document.getElementById('pe').hidden=false}});
function pfSave(e,f){{e.preventDefault();var t=[];f.querySelectorAll('input[name=topic]:checked').forEach(function(c){{t.push(c.value)}});fetch('/api/nl/prefs?t='+T,{{method:'POST',headers:{{'content-type':'application/json'}},body:JSON.stringify({{topics:t,lang:f.lang.value}})}}).then(function(r){{document.getElementById('pm').textContent=r.ok?{json.dumps(s["p_saved"])}:{json.dumps(s["err"])}}});return false}}</script>""")
    alerts_json(g)
