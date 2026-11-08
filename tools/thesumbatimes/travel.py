# -*- coding: utf-8 -*-
# Travel layer for The Sumba Times (Nov 2026): localized slugs, travel home hero, "Plan your trip" hub,
# quick facts and the long travel guides in guides/*.py (each defines GUIDES = [...]).
import os, glob, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))

# Localized slugs for articles that only have an English slug in content.py / news_briefs.py.
# New items can carry their own "slugs": {"es": ..., "id": ...}; this table wins only when they do not.
SLUGS = {
    "how-to-get-to-sumba-from-bali": {"es": "como-llegar-a-sumba-desde-bali", "id": "cara-ke-sumba-dari-bali"},
    "pasola-explained": {"es": "la-pasola-explicada", "id": "pasola-dijelaskan"},
    "marapu-ikat-traditional-villages": {"es": "marapu-ikat-pueblos-tradicionales", "id": "marapu-ikat-kampung-adat"},
    "beaches-lagoons-waterfalls": {"es": "playas-lagunas-y-cascadas-de-sumba", "id": "pantai-laguna-dan-air-terjun-sumba"},
    "where-to-stay-in-sumba": {"es": "donde-dormir-en-sumba", "id": "tempat-menginap-di-sumba"},
    "what-is-being-built-in-sumba": {"es": "que-se-construye-en-sumba", "id": "apa-yang-dibangun-di-sumba"},
}

def load_guides():
    out = []
    for fp in sorted(glob.glob(os.path.join(HERE, "guides", "g_*.py"))):
        try:
            spec = importlib.util.spec_from_file_location(os.path.basename(fp)[:-3], fp)
            m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
            out += list(getattr(m, "GUIDES", []))
        except Exception as e:
            print("guide file skipped:", fp, e)
    return out

HERO_IMG = "beaches-lagoons-waterfalls"   # Walakiri mangroves at low tide (real photo, credited on the guide)

T = {
 "en": {
  "plan": "Plan your trip",
  "hero_k": "Sumba, Indonesia",
  "hero_t": "The island that still feels like a secret",
  "hero_p": "Savannas the colour of lions, turquoise lagoons, thatched villages under tall roofs and wild horses on empty beaches. One hour from Bali, a world away.",
  "hero_b1": "Plan your trip", "hero_b2": "Read the guides",
  "facts_t": "Sumba in 30 seconds",
  "facts": [["Size", "About 200 km long, roughly twice the size of Bali"], ["Getting there", "About 1 h 30 by plane from Bali, to Tambolaka (west) or Waingapu (east)"],
            ["Best time", "Dry season, roughly May to October"], ["Don't miss", "The Pasola horseback ritual, in February and March"],
            ["Time zone", "WITA, UTC+8 (same as Bali)"], ["Money", "Indonesian rupiah (IDR). Carry cash: ATMs are only in the towns"]],
  "start_t": "Start here: your Sumba guides",
  "plan_title": "Plan your trip to Sumba",
  "plan_dek": "Everything you need to fall in love with Sumba and get around it well: when to go, how to get here, what it costs, where to go and how to respect the island.",
  "plan_intro": "<p>Sumba is the island people describe with the same words Bali earned decades ago: quiet roads, empty beaches, villages where the old Marapu faith is still alive. It is also big, slow to cross and short on cash machines, so a little planning makes the difference between a rushed trip and the trip of a lifetime. Start with the essentials below, then dive into our guides.</p>",
  "g_before": "Before you go", "g_island": "On the island", "g_culture": "Culture and people",
  "map_t": "Map of Sumba: the places in our guides", "map_note": "Tap a point to see its name. Map data © OpenStreetMap contributors, tiles by OpenFreeMap.",
  "map_btn": "Show the map",
  "faq_t": "Frequently asked questions", "answer": "Quick answer", "facts_box": "Key facts", "places_t": "Places in this guide", "open_map": "Open in maps",
  "plan_cta_t": "Planning a trip to Sumba?", "plan_cta_p": "Our free guides cover when to go, how to get around, costs, safety and culture.", "plan_cta_b": "Plan your trip",
  "news_t": "Latest news from the island",
 },
 "es": {
  "plan": "Planifica tu viaje",
  "hero_k": "Sumba, Indonesia",
  "hero_t": "La isla que todavía parece un secreto",
  "hero_p": "Sabanas color león, lagunas turquesa, pueblos de tejados altísimos y caballos salvajes en playas vacías. A una hora de Bali, a un mundo de distancia.",
  "hero_b1": "Planifica tu viaje", "hero_b2": "Leer las guías",
  "facts_t": "Sumba en 30 segundos",
  "facts": [["Tamaño", "Unos 200 km de largo, aproximadamente el doble que Bali"], ["Cómo llegar", "Aproximadamente 1 h 30 en avión desde Bali, a Tambolaka (oeste) o Waingapu (este)"],
            ["Mejor época", "La estación seca, más o menos de mayo a octubre"], ["No te pierdas", "La Pasola, el ritual a caballo de febrero y marzo"],
            ["Hora", "WITA, UTC+8 (la misma que Bali)"], ["Dinero", "Rupia indonesia (IDR). Lleva efectivo: solo hay cajeros en las ciudades"]],
  "start_t": "Empieza aquí: tus guías de Sumba",
  "plan_title": "Planifica tu viaje a Sumba",
  "plan_dek": "Todo lo que necesitas para enamorarte de Sumba y moverte bien por ella: cuándo ir, cómo llegar, cuánto cuesta, adónde ir y cómo respetar la isla.",
  "plan_intro": "<p>Sumba es la isla que la gente describe con las mismas palabras que Bali se ganó hace décadas: carreteras tranquilas, playas vacías y pueblos donde la antigua fe marapu sigue viva. También es grande, lenta de cruzar y con pocos cajeros, así que un poco de planificación marca la diferencia entre un viaje con prisas y el viaje de tu vida. Empieza por lo esencial y luego sumérgete en nuestras guías.</p>",
  "g_before": "Antes de ir", "g_island": "En la isla", "g_culture": "Cultura y gente",
  "map_t": "Mapa de Sumba: los lugares de nuestras guías", "map_note": "Toca un punto para ver su nombre. Datos del mapa © colaboradores de OpenStreetMap, teselas de OpenFreeMap.",
  "map_btn": "Ver el mapa",
  "faq_t": "Preguntas frecuentes", "answer": "Respuesta rápida", "facts_box": "Datos clave", "places_t": "Lugares de esta guía", "open_map": "Abrir en mapas",
  "plan_cta_t": "¿Preparas un viaje a Sumba?", "plan_cta_p": "Nuestras guías gratuitas explican cuándo ir, cómo moverse, cuánto cuesta, la seguridad y la cultura.", "plan_cta_b": "Planifica tu viaje",
  "news_t": "Últimas noticias de la isla",
 },
 "id": {
  "plan": "Rencanakan perjalanan",
  "hero_k": "Sumba, Indonesia",
  "hero_t": "Pulau yang masih terasa seperti rahasia",
  "hero_p": "Sabana berwarna keemasan, laguna biru toska, kampung adat beratap menara dan kuda liar di pantai yang sepi. Satu jam dari Bali, terasa seperti dunia lain.",
  "hero_b1": "Rencanakan perjalanan", "hero_b2": "Baca panduan",
  "facts_t": "Sumba dalam 30 detik",
  "facts": [["Luas", "Panjang sekitar 200 km, kira-kira dua kali luas Bali"], ["Cara ke sana", "Sekitar 1 jam 30 menit terbang dari Bali, ke Tambolaka (barat) atau Waingapu (timur)"],
            ["Waktu terbaik", "Musim kemarau, kira-kira Mei sampai Oktober"], ["Jangan lewatkan", "Pasola, ritual berkuda pada Februari dan Maret"],
            ["Zona waktu", "WITA, UTC+8 (sama dengan Bali)"], ["Uang", "Rupiah (IDR). Bawa uang tunai: ATM hanya ada di kota"]],
  "start_t": "Mulai di sini: panduan Sumba",
  "plan_title": "Rencanakan perjalanan ke Sumba",
  "plan_dek": "Semua yang Anda perlukan untuk jatuh cinta pada Sumba dan berkeliling dengan baik: kapan pergi, cara ke sana, biayanya, tujuan wisata dan cara menghormati pulau ini.",
  "plan_intro": "<p>Sumba sering digambarkan dengan kata-kata yang dulu dipakai untuk Bali puluhan tahun lalu: jalan yang tenang, pantai yang sepi, kampung tempat kepercayaan Marapu masih hidup. Pulau ini juga luas, perjalanan darat lambat dan ATM jarang, jadi sedikit perencanaan membuat perbedaan besar. Mulailah dari hal-hal penting di bawah ini, lalu baca panduan kami.</p>",
  "g_before": "Sebelum berangkat", "g_island": "Di pulau", "g_culture": "Budaya dan masyarakat",
  "map_t": "Peta Sumba: tempat-tempat dalam panduan kami", "map_note": "Ketuk titik untuk melihat namanya. Data peta © kontributor OpenStreetMap, ubin oleh OpenFreeMap.",
  "map_btn": "Tampilkan peta",
  "faq_t": "Pertanyaan yang sering diajukan", "answer": "Jawaban singkat", "facts_box": "Fakta penting", "places_t": "Tempat dalam panduan ini", "open_map": "Buka di peta",
  "plan_cta_t": "Merencanakan perjalanan ke Sumba?", "plan_cta_p": "Panduan gratis kami membahas waktu terbaik, transportasi, biaya, keamanan dan budaya.", "plan_cta_b": "Rencanakan perjalanan",
  "news_t": "Berita terbaru dari pulau",
 },
}

# Base map points (towns and airports, well known) used when guides add none.
BASE_PLACES = [
    {"name": "Tambolaka (TMC airport)", "lat": -9.4097, "lon": 119.2445, "area": "Southwest Sumba"},
    {"name": "Waingapu (WGP airport)", "lat": -9.6692, "lon": 120.3020, "area": "East Sumba"},
    {"name": "Waikabubak", "lat": -9.6450, "lon": 119.4120, "area": "West Sumba"},
]

# Guide photos imported from Wikimedia Commons into KV by claude-ops jobs/tst_images.py (3:2 crop, 1280x853).
IMPORTED = {"sumba-ikat-weaving-where-to-buy", "sumbanese-food", "sumba-travel-costs", "getting-around-sumba", "sumba-itinerary-5-7-10-days",
            "best-time-to-visit-sumba", "sumba-travel-safety-health", "surfing-in-sumba", "sumba-horses-sandalwood-pony",
            "wairinding-hill", "walakiri-beach", "puru-kambera", "rende-village", "waimarang-waterfall", "weekuri-lagoon", "mandorak-beach", "ratenggaro-village", "kodi", "tambolaka-town", "praijing-village", "lapopu-waterfall", "manupeu-tanah-daru-national-park", "waikabubak-town", "pasola-2027-dates"}

def candidate_image(a):
    c = a.get("image_candidate")
    if not c or a["slug"] not in IMPORTED: return None
    return {"w": 1280, "h": 853, "credit": c["credit"], "license": c["license"], "license_url": c.get("license_url", ""), "page": c["file_page"], "ai": False, "caption": c["caption"]}

# Newspaper front page strings (7 Nov 2026, v3)
N = {
 "en": {"ed": "International edition", "brief_t": "Briefing", "travel_desk": "The travel desk", "today_t": "Today on Sumba", "more_news": "More news",
        "wx": "Weather", "sunrise": "Sunrise", "sunset": "Sunset", "fx": "Exchange rate", "wx_src": "Live data: Open-Meteo, ExchangeRate-API",
        "figures_t": "Sumba in figures", "letter_t": "The Sunday letter", "essential_t": "Essential guides", "start": "New to Sumba? Start here",
        "wcode": {"0": "Clear", "1": "Mostly clear", "2": "Partly cloudy", "3": "Cloudy", "45": "Fog", "51": "Drizzle", "61": "Rain", "63": "Rain", "65": "Heavy rain", "80": "Showers", "81": "Showers", "82": "Heavy showers", "95": "Thunderstorm"},
        "figures": [["41,524", "visitors to East Sumba in 2025", "/en/business/east-sumba-visitor-numbers-2025/"], ["1 in 8", "of them came from abroad", "/en/business/east-sumba-visitor-numbers-2025/"],
                    ["3 nights", "average stay in East Sumba", "/en/business/east-sumba-visitor-numbers-2025/"], ["~1,500", "hotel rooms on the whole island", "/en/where-to-stay/where-to-stay-in-sumba/"],
                    ["2", "airports: Tambolaka and Waingapu", "/en/getting-here/how-to-get-to-sumba-from-bali/"], ["4x", "weekly non-stop flights Bali-Waingapu", "/en/news/new-direct-flights-bali-waingapu/"]]},
 "es": {"ed": "Edición en español", "brief_t": "Breves", "travel_desk": "La mesa de viajes", "today_t": "Hoy en Sumba", "more_news": "Más noticias",
        "wx": "El tiempo", "sunrise": "Amanece", "sunset": "Anochece", "fx": "Cambio", "wx_src": "Datos en vivo: Open-Meteo, ExchangeRate-API",
        "figures_t": "Sumba en cifras", "letter_t": "La carta del domingo", "essential_t": "Guías esenciales", "start": "¿Primera vez en Sumba? Empieza aquí",
        "wcode": {"0": "Despejado", "1": "Casi despejado", "2": "Nubes y claros", "3": "Nublado", "45": "Niebla", "51": "Llovizna", "61": "Lluvia", "63": "Lluvia", "65": "Lluvia fuerte", "80": "Chubascos", "81": "Chubascos", "82": "Chubascos fuertes", "95": "Tormenta"},
        "figures": [["41.524", "visitantes en Sumba Oriental en 2025", "/es/business/east-sumba-visitor-numbers-2025/"], ["1 de 8", "llegó del extranjero", "/es/business/east-sumba-visitor-numbers-2025/"],
                    ["3 noches", "estancia media en Sumba Oriental", "/es/business/east-sumba-visitor-numbers-2025/"], ["~1.500", "habitaciones de hotel en toda la isla", "/es/where-to-stay/donde-dormir-en-sumba/"],
                    ["2", "aeropuertos: Tambolaka y Waingapu", "/es/getting-here/como-llegar-a-sumba-desde-bali/"], ["4", "vuelos directos semanales Bali-Waingapu", "/es/news/new-direct-flights-bali-waingapu/"]]},
 "id": {"ed": "Edisi bahasa Indonesia", "brief_t": "Kabar singkat", "travel_desk": "Meja wisata", "today_t": "Hari ini di Sumba", "more_news": "Berita lainnya",
        "wx": "Cuaca", "sunrise": "Matahari terbit", "sunset": "Matahari terbenam", "fx": "Kurs", "wx_src": "Data langsung: Open-Meteo, ExchangeRate-API",
        "figures_t": "Sumba dalam angka", "letter_t": "Surat hari Minggu", "essential_t": "Panduan utama", "start": "Pertama kali ke Sumba? Mulai di sini",
        "wcode": {"0": "Cerah", "1": "Cerah berawan", "2": "Berawan sebagian", "3": "Berawan", "45": "Kabut", "51": "Gerimis", "61": "Hujan", "63": "Hujan", "65": "Hujan lebat", "80": "Hujan lokal", "81": "Hujan lokal", "82": "Hujan lebat lokal", "95": "Badai petir"},
        "figures": [["41.524", "wisatawan ke Sumba Timur pada 2025", "/id/business/east-sumba-visitor-numbers-2025/"], ["1 dari 8", "datang dari luar negeri", "/id/business/east-sumba-visitor-numbers-2025/"],
                    ["3 malam", "rata-rata lama tinggal di Sumba Timur", "/id/business/east-sumba-visitor-numbers-2025/"], ["~1.500", "kamar hotel di seluruh pulau", "/id/where-to-stay/tempat-menginap-di-sumba/"],
                    ["2", "bandara: Tambolaka dan Waingapu", "/id/getting-here/cara-ke-sumba-dari-bali/"], ["4x", "penerbangan langsung Bali-Waingapu per minggu", "/id/news/new-direct-flights-bali-waingapu/"]]},
}

# Reader assistant (bottom-right chat)
AI = {
 "en": {"btn": "Ask about Sumba", "title": "Sumba assistant", "sub": "Answers from our guides, in your language", "hello": "Hi! Ask me anything about Sumba: when to go, how to get around, beaches, villages, the Pasola, costs or safety.",
        "ph": "Ask about Sumba…", "send": "Send", "chips": ["When is the best time to visit?", "How do I get from Bali to Sumba?", "How many days do I need?"],
        "note": "AI answers based on The Sumba Times guides. It can make mistakes: check important details.", "err": "Sorry, I could not answer right now. Please try again in a moment.",
        "limit": "You have reached today's limit of questions. Our guides have the full answers.", "off": "The assistant is starting soon. Meanwhile, our travel guides have the answers:", "close": "Close"},
 "es": {"btn": "Pregunta sobre Sumba", "title": "Asistente de Sumba", "sub": "Responde con nuestras guías, en tu idioma", "hello": "¡Hola! Pregúntame lo que quieras sobre Sumba: cuándo ir, cómo moverte, playas, pueblos, la Pasola, cuánto cuesta o la seguridad.",
        "ph": "Pregunta sobre Sumba…", "send": "Enviar", "chips": ["¿Cuál es la mejor época para ir?", "¿Cómo llego de Bali a Sumba?", "¿Cuántos días necesito?"],
        "note": "Respuestas con IA basadas en las guías de The Sumba Times. Puede equivocarse: comprueba lo importante.", "err": "Lo siento, ahora no he podido responder. Inténtalo de nuevo en un momento.",
        "limit": "Has llegado al límite de preguntas de hoy. Nuestras guías tienen las respuestas completas.", "off": "El asistente arranca muy pronto. Mientras tanto, nuestras guías de viaje tienen las respuestas:", "close": "Cerrar"},
 "id": {"btn": "Tanya soal Sumba", "title": "Asisten Sumba", "sub": "Menjawab dari panduan kami, dalam bahasa Anda", "hello": "Halo! Tanyakan apa saja tentang Sumba: kapan sebaiknya datang, cara berkeliling, pantai, kampung adat, Pasola, biaya atau keamanan.",
        "ph": "Tanya soal Sumba…", "send": "Kirim", "chips": ["Kapan waktu terbaik ke Sumba?", "Bagaimana cara ke Sumba dari Bali?", "Berapa hari yang dibutuhkan?"],
        "note": "Jawaban AI berdasarkan panduan The Sumba Times. Bisa keliru: periksa hal penting.", "err": "Maaf, saat ini saya tidak bisa menjawab. Coba lagi sebentar lagi.",
        "limit": "Anda sudah mencapai batas pertanyaan hari ini. Panduan kami berisi jawaban lengkapnya.", "off": "Asisten akan segera aktif. Sementara itu, panduan wisata kami punya jawabannya:", "close": "Tutup"},
}

# Budget calculator + reader questions (plan page). Ranges derived from guides/g_money.py (2 people, 7 days, 2026).
CALC = {
 "en": {"t": "Trip budget calculator", "days": "Days in Sumba", "people": "Travellers", "style": "Style", "styles": ["Budget", "Mid-range", "Luxury"], "res": "Estimated total, including return flights from Bali",
        "pp": "per person", "note": "A rough estimate built from the ranges in our cost guide (2026 prices), not a quote. Prices rise in July-August and Pasola weeks.", "more": "How we calculate it"},
 "es": {"t": "Calculadora de presupuesto", "days": "Días en Sumba", "people": "Viajeros", "style": "Estilo", "styles": ["Económico", "Medio", "Lujo"], "res": "Total estimado, con vuelos de ida y vuelta desde Bali",
        "pp": "por persona", "note": "Estimación orientativa a partir de los rangos de nuestra guía de costes (precios de 2026), no un presupuesto. Los precios suben en julio-agosto y en semanas de Pasola.", "more": "Cómo lo calculamos"},
 "id": {"t": "Kalkulator biaya perjalanan", "days": "Hari di Sumba", "people": "Jumlah orang", "style": "Gaya", "styles": ["Hemat", "Menengah", "Mewah"], "res": "Perkiraan total, termasuk tiket pulang pergi dari Bali",
        "pp": "per orang", "note": "Perkiraan kasar dari kisaran di panduan biaya kami (harga 2026), bukan penawaran. Harga naik pada Juli-Agustus dan pekan Pasola.", "more": "Cara kami menghitung"},
}
QF = {
 "en": {"t": "Ask The Sumba Times", "p": "A question about Sumba our guides do not answer? Send it to the desk. We read every one, and the most common questions become new guides.", "q": "Your question", "e": "Email (optional, only if you want a reply)", "b": "Send question", "ok": "Thank you. Your question reached the desk.", "err": "It could not be sent. Please try again later."},
 "es": {"t": "Pregunta a The Sumba Times", "p": "¿Tienes una pregunta sobre Sumba que nuestras guías no responden? Envíala a la redacción. Las leemos todas y las más repetidas se convierten en guías nuevas.", "q": "Tu pregunta", "e": "Email (opcional, solo si quieres respuesta)", "b": "Enviar pregunta", "ok": "Gracias. Tu pregunta ha llegado a la redacción.", "err": "No se ha podido enviar. Inténtalo más tarde."},
 "id": {"t": "Tanya The Sumba Times", "p": "Punya pertanyaan tentang Sumba yang belum dijawab panduan kami? Kirim ke redaksi. Kami membaca semuanya, dan pertanyaan yang sering muncul menjadi panduan baru.", "q": "Pertanyaan Anda", "e": "Email (opsional, hanya jika ingin dibalas)", "b": "Kirim pertanyaan", "ok": "Terima kasih. Pertanyaan Anda sudah sampai ke redaksi.", "err": "Gagal terkirim. Coba lagi nanti."},
}
