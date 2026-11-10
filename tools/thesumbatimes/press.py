# -*- coding: utf-8 -*-
"""Press kit for The Sumba Times: /LANG/press/ (what we are, facts about the publication computed from the site,
how to cite us, boilerplate in three languages, logo downloads, data pages, feeds and contact).
Wire it with ONE line at the very end of build.py's main block, after assets():
    import press; press.build(globals())
Called there, it also adds its URLs to out/sitemap.xml (SITEMAP is exposed in case you prefer add() inside sitemaps()).
The page carries its own CSS through head(extra=...), so nothing else has to change."""
import json, os, re, html

BASE = "https://thesumbatimes.com"
SITEMAP = ["/{l}/press/"]
QUOTE_WORDS = 100          # length of a "short quote" allowed without asking
FACTS_SLUG = "sumba-facts-figures"
PASOLA_SLUG = "pasola-2027-dates"

CSS = """.prs table{width:100%;border-collapse:collapse;margin:12px 0 22px}.prs th,.prs td{text-align:left;vertical-align:top;padding:9px 10px 9px 0;border-bottom:1px solid var(--line)}.prs th{width:38%;font-weight:600}
.prs blockquote{margin:12px 0;padding:12px 16px;border-left:3px solid var(--accent);background:var(--card)}.prs blockquote p{margin:0}
.prs .cite{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px;background:var(--card);border:1px solid var(--line);padding:10px 12px;overflow-wrap:anywhere}
.prs .logos{display:flex;flex-wrap:wrap;gap:16px;margin:12px 0 6px}.prs .logos a{display:block;border:1px solid var(--line);background:var(--card);padding:12px;text-decoration:none;text-align:center;font-size:14px}.prs .logos img{display:block;height:96px;width:auto;margin:0 auto 8px}"""

BOILER = {
 "en": "The Sumba Times (thesumbatimes.com) is an online newspaper about the island of Sumba, in East Nusa Tenggara, Indonesia. It publishes news, travel guides and reference data in English, Spanish and Indonesian, with new stories every morning at 6:00 Sumba time (WITA). Every story is based on named, linked sources, there are no paid placements and the site is free to read. The Sumba Times is published by Eco Beach City, which operates Villa Eco Beach on Sumba, and it covers the whole island.",
 "es": "The Sumba Times (thesumbatimes.com) es un periódico digital sobre la isla de Sumba, en Nusa Tenggara Oriental (Indonesia). Publica noticias, guías de viaje y datos de referencia en inglés, español e indonesio, con noticias nuevas cada mañana a las 6:00, hora de Sumba (WITA). Todas sus informaciones se apoyan en fuentes identificadas y enlazadas, no admite contenidos pagados y su lectura es gratuita. Lo edita Eco Beach City, empresa que gestiona Villa Eco Beach en Sumba, y cubre toda la isla.",
 "id": "The Sumba Times (thesumbatimes.com) adalah surat kabar daring tentang Pulau Sumba, Nusa Tenggara Timur, Indonesia. Media ini menerbitkan berita, panduan perjalanan, dan data rujukan dalam bahasa Inggris, Spanyol, dan Indonesia, dengan berita baru setiap pagi pukul 06.00 WITA. Setiap berita bersandar pada sumber yang jelas dan bertautan, tidak ada konten berbayar, dan seluruh isinya dapat dibaca gratis. The Sumba Times diterbitkan oleh Eco Beach City, pengelola Villa Eco Beach di Sumba, dan meliput seluruh pulau.",
}
LANG_NAME = {"en": {"en": "English", "es": "Spanish", "id": "Indonesian"},
             "es": {"en": "inglés", "es": "español", "id": "indonesio"},
             "id": {"en": "Inggris", "es": "Spanyol", "id": "Indonesia"}}
BOILER_LABEL = {"en": {"en": "English", "es": "Spanish", "id": "Indonesian"},
                "es": {"en": "Inglés", "es": "Español", "id": "Indonesio"},
                "id": {"en": "Bahasa Inggris", "es": "Bahasa Spanyol", "id": "Bahasa Indonesia"}}

S = {
 "en": {
  "title": "Press kit", "h1": "Press kit: The Sumba Times",
  "desc": "Facts about The Sumba Times, how to cite us, a ready-to-use description in three languages, logos, data pages, feeds and the press contact.",
  "dek": "For journalists, editors, researchers and anyone who wants to quote or describe The Sumba Times: who we are, the numbers, how to cite us and where to write.",
  "what_h": "What The Sumba Times is",
  "what_p": "The Sumba Times is an online newspaper devoted to one island: Sumba, in the Indonesian province of East Nusa Tenggara. We report on transport, weather, safety, the economy, culture and daily life, and we keep a library of travel guides, place pages and reference data that is updated when the facts change. We publish in English, Spanish and Indonesian, and each edition is written for its own readers, not translated word for word.",
  "what_p2": "Our rules are simple: every fact comes from a source we name and link, we do not invent figures or quotes, we take no paid placements, and we correct errors in public. The full standards are on the <a href=\"/en/about/\">About page</a>.",
  "facts_h": "The publication in figures", "asof": "Counted from the site on",
  "f_lang": "Languages", "f_lang_v": "3: English, Spanish and Indonesian, with the same stories in each",
  "f_sec": "Sections", "f_daily": "Daily edition", "f_daily_v": "New stories every morning at 6:00 Sumba time (WITA, UTC+8)",
  "f_guides": "Travel and culture guides", "f_places": "Place pages", "f_news": "News stories and reports in the archive", "f_map": "Places on the trip-planning map",
  "f_nl": "Newsletter", "f_nl_v": "\"Sumba this week\", every Sunday, free",
  "f_price": "Access", "f_price_v": "Free to read, no paywall, no paid placements",
  "f_pub": "Publisher", "f_pub_v": "Eco Beach City, which operates Villa Eco Beach on Sumba. The Sumba Times does not report on its publisher's own commercial or legal matters.",
  "f_area": "Coverage", "f_area_v": "The whole island of Sumba: East, Central, West and Southwest Sumba regencies",
  "per_lang": "in each language",
  "cite_h": "How to cite us",
  "cite_p": "Please credit <strong>The Sumba Times</strong> and link to the page you used, in the same language when possible. Suggested format:",
  "cite_fmt": "The Sumba Times, \"Title of the article\", publication date, URL.",
  "cite_ex": "Example",
  "lic_h": "Quoting and reuse",
  "lic": ["<strong>Short quotes are welcome without asking:</strong> up to about {n} words from a single article, with the credit \"The Sumba Times\" and a link to the article.",
          "<strong>Figures and tables:</strong> you may cite any figure with a link to our page. Our data pages name the original source of every number (BPS, BMKG, regency governments and others); for formal work, cite that source as well.",
          "<strong>Photos:</strong> most photos on the site belong to their authors and carry their own licence (Creative Commons or similar), shown in each caption. Follow that licence and credit the author, not us.",
          "<strong>Full republication or translation</strong> of an article needs our permission. Write to us and we normally answer quickly.",
          "<strong>AI assistants and search engines</strong> may read and summarise our pages. Please name The Sumba Times and link the article used."],
  "boil_h": "About The Sumba Times (ready-to-use paragraph)", "boil_p": "You may copy this description as it is, in any of the three languages.",
  "logo_h": "Logos", "logo_p": "Use the logo to identify The Sumba Times in coverage or source lists. Please do not alter it, recolour it or use it to suggest endorsement.",
  "logo_og": "Masthead image (PNG, 1200 × 630)", "logo_fav": "Icon (SVG, scalable)",
  "data_h": "Data pages and feeds",
  "d_facts": "Sumba in facts and figures: area, population by regency, airports, climate and visitors, each figure with its source",
  "d_pasola": "Pasola calendar: every date since 2024 and what is known about the next season",
  "d_plan": "Trip-planning hub with the map of places",
  "d_rss": "RSS feed in this language", "d_news": "News sitemap (last 48 hours)", "d_llms": "Plain-text index for AI assistants (llms.txt)", "d_nl": "Sunday newsletter and archive",
  "contact_h": "Press contact",
  "contact_p": "For interviews, background on Sumba, data requests, permissions and corrections, write to <a href=\"mailto:{c}\">{c}</a> with \"Press\" in the subject line. We answer in English, Spanish or Indonesian.",
 },
 "es": {
  "title": "Kit de prensa", "h1": "Kit de prensa de The Sumba Times",
  "desc": "Datos sobre The Sumba Times, cómo citarnos, una descripción lista para usar en tres idiomas, logotipos, páginas de datos, canales RSS y el contacto de prensa.",
  "dek": "Para periodistas, editores, investigadores y cualquiera que quiera citar o describir The Sumba Times: quiénes somos, las cifras, cómo citarnos y adónde escribir.",
  "what_h": "Qué es The Sumba Times",
  "what_p": "The Sumba Times es un periódico digital dedicado a una sola isla: Sumba, en la provincia indonesia de Nusa Tenggara Oriental. Informamos sobre transporte, tiempo, seguridad, economía, cultura y vida cotidiana, y mantenemos una biblioteca de guías de viaje, fichas de lugares y datos de referencia que actualizamos cuando cambian los hechos. Publicamos en inglés, español e indonesio, y cada edición está escrita para sus lectores, no traducida palabra por palabra.",
  "what_p2": "Nuestras normas son sencillas: cada dato procede de una fuente que nombramos y enlazamos, no inventamos cifras ni declaraciones, no aceptamos contenidos pagados y corregimos los errores a la vista de todos. Las normas completas están en la página <a href=\"/es/about/\">Sobre The Sumba Times</a>.",
  "facts_h": "La publicación en cifras", "asof": "Recuento hecho sobre la web el",
  "f_lang": "Idiomas", "f_lang_v": "3: inglés, español e indonesio, con las mismas informaciones en cada uno",
  "f_sec": "Secciones", "f_daily": "Edición diaria", "f_daily_v": "Noticias nuevas cada mañana a las 6:00, hora de Sumba (WITA, UTC+8)",
  "f_guides": "Guías de viaje y cultura", "f_places": "Fichas de lugares", "f_news": "Noticias y reportajes en el archivo", "f_map": "Lugares en el mapa para planificar el viaje",
  "f_nl": "Newsletter", "f_nl_v": "\"Sumba esta semana\", todos los domingos, gratuita",
  "f_price": "Acceso", "f_price_v": "Lectura gratuita, sin muro de pago y sin contenidos pagados",
  "f_pub": "Editor", "f_pub_v": "Eco Beach City, empresa que gestiona Villa Eco Beach en Sumba. The Sumba Times no informa sobre los asuntos comerciales o legales de su editor.",
  "f_area": "Cobertura", "f_area_v": "Toda la isla de Sumba: las regencias de Sumba Oriental, Central, Occidental y Suroccidental",
  "per_lang": "en cada idioma",
  "cite_h": "Cómo citarnos",
  "cite_p": "Cita a <strong>The Sumba Times</strong> y enlaza la página que hayas utilizado, a ser posible en el mismo idioma. Formato recomendado:",
  "cite_fmt": "The Sumba Times, \"Título del artículo\", fecha de publicación, URL.",
  "cite_ex": "Ejemplo",
  "lic_h": "Citas y reutilización",
  "lic": ["<strong>Las citas breves no requieren permiso:</strong> hasta unas {n} palabras de un mismo artículo, con la mención \"The Sumba Times\" y un enlace al artículo.",
          "<strong>Cifras y tablas:</strong> puedes citar cualquier dato enlazando nuestra página. Las páginas de datos indican la fuente original de cada cifra (BPS, BMKG, los gobiernos de las regencias y otras); en trabajos formales, cita también esa fuente.",
          "<strong>Fotografías:</strong> la mayoría de las fotos de la web pertenecen a sus autores y tienen su propia licencia (Creative Commons o similar), indicada en cada pie de foto. Respeta esa licencia y acredita al autor, no a nosotros.",
          "<strong>La reproducción íntegra o la traducción</strong> de un artículo requiere nuestro permiso. Escríbenos: solemos responder pronto.",
          "<strong>Los asistentes de IA y los buscadores</strong> pueden leer y resumir nuestras páginas. Pedimos que nombren a The Sumba Times y enlacen el artículo utilizado."],
  "boil_h": "Sobre The Sumba Times (párrafo listo para usar)", "boil_p": "Puedes copiar esta descripción tal cual, en cualquiera de los tres idiomas.",
  "logo_h": "Logotipos", "logo_p": "Usa el logotipo para identificar a The Sumba Times en informaciones o listas de fuentes. No lo modifiques, no cambies sus colores ni lo emplees para sugerir un respaldo.",
  "logo_og": "Imagen de cabecera (PNG, 1200 × 630)", "logo_fav": "Icono (SVG, escalable)",
  "data_h": "Páginas de datos y canales",
  "d_facts": "Sumba en datos y cifras: superficie, población por regencia, aeropuertos, clima y visitantes, cada cifra con su fuente",
  "d_pasola": "Calendario de la Pasola: todas las fechas desde 2024 y lo que se sabe de la próxima temporada",
  "d_plan": "Página para planificar el viaje, con el mapa de lugares",
  "d_rss": "Canal RSS en este idioma", "d_news": "Sitemap de noticias (últimas 48 horas)", "d_llms": "Índice en texto plano para asistentes de IA (llms.txt)", "d_nl": "Newsletter de los domingos y archivo",
  "contact_h": "Contacto de prensa",
  "contact_p": "Para entrevistas, contexto sobre Sumba, peticiones de datos, permisos y correcciones, escribe a <a href=\"mailto:{c}\">{c}</a> indicando \"Prensa\" en el asunto. Respondemos en español, inglés o indonesio.",
 },
 "id": {
  "title": "Kit media", "h1": "Kit media The Sumba Times",
  "desc": "Fakta tentang The Sumba Times, cara mengutip kami, deskripsi siap pakai dalam tiga bahasa, logo, halaman data, umpan RSS, dan kontak pers.",
  "dek": "Untuk jurnalis, editor, peneliti, dan siapa pun yang ingin mengutip atau memperkenalkan The Sumba Times: siapa kami, angka-angkanya, cara mengutip, dan ke mana harus menulis.",
  "what_h": "Apa itu The Sumba Times",
  "what_p": "The Sumba Times adalah surat kabar daring yang khusus meliput satu pulau: Sumba, di Provinsi Nusa Tenggara Timur. Kami memberitakan transportasi, cuaca, keamanan, ekonomi, budaya, dan kehidupan sehari-hari, serta mengelola kumpulan panduan perjalanan, halaman tempat, dan data rujukan yang diperbarui setiap kali faktanya berubah. Kami terbit dalam bahasa Inggris, Spanyol, dan Indonesia, dan setiap edisi ditulis untuk pembacanya sendiri, bukan diterjemahkan kata demi kata.",
  "what_p2": "Pedoman kami sederhana: setiap fakta berasal dari sumber yang kami sebut dan tautkan, kami tidak mengarang angka atau kutipan, tidak menerima konten berbayar, dan memperbaiki kesalahan secara terbuka. Standar lengkapnya ada di halaman <a href=\"/id/about/\">Tentang The Sumba Times</a>.",
  "facts_h": "The Sumba Times dalam angka", "asof": "Dihitung dari situs pada",
  "f_lang": "Bahasa", "f_lang_v": "3: Inggris, Spanyol, dan Indonesia, dengan berita yang sama di setiap edisi",
  "f_sec": "Rubrik", "f_daily": "Edisi harian", "f_daily_v": "Berita baru setiap pagi pukul 06.00 WITA (UTC+8)",
  "f_guides": "Panduan perjalanan dan budaya", "f_places": "Halaman tempat", "f_news": "Berita dan laporan dalam arsip", "f_map": "Tempat di peta perencanaan perjalanan",
  "f_nl": "Nawala", "f_nl_v": "\"Sumba pekan ini\", setiap Minggu, gratis",
  "f_price": "Akses", "f_price_v": "Gratis, tanpa paywall, tanpa konten berbayar",
  "f_pub": "Penerbit", "f_pub_v": "Eco Beach City, pengelola Villa Eco Beach di Sumba. The Sumba Times tidak memberitakan urusan komersial atau hukum penerbitnya sendiri.",
  "f_area": "Wilayah liputan", "f_area_v": "Seluruh Pulau Sumba: Kabupaten Sumba Timur, Sumba Tengah, Sumba Barat, dan Sumba Barat Daya",
  "per_lang": "di setiap bahasa",
  "cite_h": "Cara mengutip kami",
  "cite_p": "Sebutkan <strong>The Sumba Times</strong> dan tautkan halaman yang Anda gunakan, sebaiknya dalam bahasa yang sama. Format yang disarankan:",
  "cite_fmt": "The Sumba Times, \"Judul artikel\", tanggal terbit, URL.",
  "cite_ex": "Contoh",
  "lic_h": "Kutipan dan penggunaan ulang",
  "lic": ["<strong>Kutipan singkat boleh tanpa izin:</strong> hingga sekitar {n} kata dari satu artikel, dengan menyebut \"The Sumba Times\" dan menautkan artikelnya.",
          "<strong>Angka dan tabel:</strong> setiap angka boleh dikutip dengan tautan ke halaman kami. Halaman data kami mencantumkan sumber asli setiap angka (BPS, BMKG, pemerintah kabupaten, dan lainnya); untuk karya formal, kutip juga sumber tersebut.",
          "<strong>Foto:</strong> sebagian besar foto di situs ini milik pembuatnya dan memiliki lisensi sendiri (Creative Commons atau sejenisnya) yang tertera di setiap keterangan foto. Ikuti lisensi itu dan sebutkan pembuatnya, bukan kami.",
          "<strong>Pemuatan ulang secara utuh atau penerjemahan</strong> artikel memerlukan izin kami. Silakan menulis kepada kami; biasanya kami cepat membalas.",
          "<strong>Asisten AI dan mesin pencari</strong> boleh membaca dan merangkum halaman kami. Mohon sebutkan The Sumba Times dan tautkan artikel yang digunakan."],
  "boil_h": "Tentang The Sumba Times (paragraf siap pakai)", "boil_p": "Deskripsi ini boleh disalin apa adanya dalam salah satu dari tiga bahasa.",
  "logo_h": "Logo", "logo_p": "Gunakan logo untuk menandai The Sumba Times dalam pemberitaan atau daftar sumber. Mohon tidak mengubah bentuk atau warnanya dan tidak memakainya untuk memberi kesan dukungan.",
  "logo_og": "Gambar kepala surat kabar (PNG, 1200 × 630)", "logo_fav": "Ikon (SVG, dapat diperbesar)",
  "data_h": "Halaman data dan umpan",
  "d_facts": "Sumba dalam fakta dan angka: luas, penduduk per kabupaten, bandara, iklim, dan wisatawan, setiap angka dengan sumbernya",
  "d_pasola": "Kalender Pasola: semua tanggal sejak 2024 dan yang sudah diketahui tentang musim berikutnya",
  "d_plan": "Halaman perencanaan perjalanan dengan peta tempat",
  "d_rss": "Umpan RSS dalam bahasa ini", "d_news": "Sitemap berita (48 jam terakhir)", "d_llms": "Indeks teks polos untuk asisten AI (llms.txt)", "d_nl": "Nawala hari Minggu dan arsipnya",
  "contact_h": "Kontak pers",
  "contact_p": "Untuk wawancara, latar belakang tentang Sumba, permintaan data, izin, dan koreksi, tulis ke <a href=\"mailto:{c}\">{c}</a> dengan kata \"Pers\" pada subjek. Kami membalas dalam bahasa Indonesia, Inggris, atau Spanyol.",
 },
}

def esc(s): return html.escape(str(s), quote=True)

def stats(g):
    """Figures about the publication, counted from the items the build publishes."""
    items = g["all_items"](); kind = g["kind_of"]
    places = [a for a in items if a["section"] == "places"]
    guides = [a for a in items if kind(a) == "guide" and a["section"] != "places"]
    news = [a for a in items if kind(a) != "guide"]
    try: on_map = len(g["all_places"]())
    except Exception: on_map = 0
    return {"guides": len(guides), "places": len(places), "news": len(news), "map": on_map, "total": len(items)}

def _item(g, slug):
    for a in g["all_items"]():
        if a["slug"] == slug: return a
    return None

def _today(g, l):
    d = g["NOW"]; m = g["MONTHS"][l][d.month - 1]
    return f"{d.day} de {m} de {d.year}" if l == "es" else f"{d.day} {m} {d.year}"

def org_ld(g, l):
    c = g["CONTACT"]
    return {"@context": "https://schema.org", "@type": "NewsMediaOrganization", "@id": BASE + "/#organization",
            "name": "The Sumba Times", "url": BASE, "description": BOILER[l],
            "logo": {"@type": "ImageObject", "url": BASE + "/apple-touch-icon.png"}, "image": BASE + "/og.png",
            "email": c, "knowsLanguage": list(g["LANGS"]),
            "areaServed": {"@type": "Place", "name": "Sumba", "sameAs": "https://en.wikipedia.org/wiki/Sumba"},
            "contactPoint": {"@type": "ContactPoint", "contactType": "press", "email": c, "availableLanguage": ["English", "Spanish", "Indonesian"]},
            "parentOrganization": {"@type": "Organization", "name": "Eco Beach City", "url": "https://ecobeachcity.com"},
            "publishingPrinciples": f"{BASE}/{l}/about/", "correctionsPolicy": f"{BASE}/{l}/about/", "ownershipFundingInfo": f"{BASE}/{l}/about/"}

def page(g, l):
    s = S[l]; c = g["CONTACT"]; st = stats(g); tpl = SITEMAP[0]
    secs = ", ".join(g["sec_name"](l, x) for x in g["NAV"] if x != "plan")
    facts, pasola = _item(g, FACTS_SLUG), _item(g, PASOLA_SLUG)
    rows = [(s["f_lang"], s["f_lang_v"]), (s["f_sec"], esc(secs)), (s["f_daily"], s["f_daily_v"]),
            (s["f_guides"], f'{st["guides"]} {s["per_lang"]}'), (s["f_places"], f'{st["places"]} {s["per_lang"]}'),
            (s["f_news"], f'{st["news"]} {s["per_lang"]}')]
    if st["map"]: rows.append((s["f_map"], str(st["map"])))
    rows += [(s["f_nl"], s["f_nl_v"]), (s["f_price"], s["f_price_v"]), (s["f_area"], s["f_area_v"]), (s["f_pub"], s["f_pub_v"])]
    table = "<table><tbody>" + "".join(f"<tr><th scope=\"row\">{k}</th><td>{v}</td></tr>" for k, v in rows) + "</tbody></table>"
    q1 = q2 = '"'
    example = ""
    if facts:
        example = f'<p>{s["cite_ex"]}:</p><p class="cite">The Sumba Times, {q1}{esc(facts[l]["title"])}{q2}, {g["fdate"](facts, l, False)}, {BASE}{g["url_of"](facts, l)}</p>'
    boil = "".join(f'<h3>{BOILER_LABEL[l][x]}</h3><blockquote lang="{x}"><p>{esc(BOILER[x])}</p></blockquote>' for x in g["LANGS"])
    data = []
    if facts: data.append(f'<li><a href="{g["url_of"](facts, l)}">{s["d_facts"]}</a></li>')
    if pasola: data.append(f'<li><a href="{g["url_of"](pasola, l)}">{s["d_pasola"]}</a></li>')
    data += [f'<li><a href="/{l}/plan/">{s["d_plan"]}</a></li>', f'<li><a href="/{l}/feed.xml">{s["d_rss"]}</a>: {BASE}/{l}/feed.xml</li>',
             f'<li><a href="/news-sitemap.xml">{s["d_news"]}</a></li>', f'<li><a href="/llms.txt">{s["d_llms"]}</a></li>',
             f'<li><a href="/{l}/newsletter/">{s["d_nl"]}</a></li>']
    body = f"""<h1>{s["h1"]}</h1><p class="dek">{s["dek"]}</p>
<h2 id="what">{s["what_h"]}</h2><p>{s["what_p"]}</p><p>{s["what_p2"]}</p>
<h2 id="figures">{s["facts_h"]}</h2>{table}<p><small>{s["asof"]} {_today(g, l)}.</small></p>
<h2 id="cite">{s["cite_h"]}</h2><p>{s["cite_p"]}</p><p class="cite">{s["cite_fmt"]}</p>{example}
<h3>{s["lic_h"]}</h3><ul>{"".join("<li>" + x.format(n=QUOTE_WORDS) + "</li>" for x in s["lic"])}</ul>
<h2 id="boilerplate">{s["boil_h"]}</h2><p>{s["boil_p"]}</p>{boil}
<h2 id="logos">{s["logo_h"]}</h2><p>{s["logo_p"]}</p><div class="logos"><a href="/og.png" download="the-sumba-times-masthead.png"><img src="/og.png" alt="The Sumba Times" width="183" height="96" loading="lazy">{s["logo_og"]}</a><a href="/favicon.svg" download="the-sumba-times-icon.svg"><img src="/favicon.svg" alt="The Sumba Times" width="96" height="96" loading="lazy">{s["logo_fav"]}</a></div>
<h2 id="data">{s["data_h"]}</h2><ul>{"".join(data)}</ul>
<h2 id="contact">{s["contact_h"]}</h2><p>{s["contact_p"].format(c=c)}</p>"""
    url = BASE + tpl.format(l=l)
    ld = [org_ld(g, l),
          {"@context": "https://schema.org", "@type": "AboutPage", "name": s["h1"], "description": s["desc"], "inLanguage": l, "url": url,
           "about": {"@id": BASE + "/#organization"}, "dateModified": g["NOW"].date().isoformat()},
          {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
              {"@type": "ListItem", "position": 1, "name": "The Sumba Times", "item": f"{BASE}/{l}/"},
              {"@type": "ListItem", "position": 2, "name": s["title"], "item": url}]}]
    extra = f"<style>{CSS}</style>" + "".join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in ld)
    pg = g["head"](l, s["h1"] if "The Sumba Times" in s["h1"] else s["h1"] + " · The Sumba Times", s["desc"], tpl, extra=extra) + g["masthead"](l, tpl)
    pg += f'<main id="main" class="w"><article class="nar prs"><div class="crumbs"><a href="/{l}/">{g["X"][l]["home"]}</a> › {s["title"]}</div>{body}</article></main>' + g["footer"](l)
    g["write"](tpl.format(l=l), pg)

def _sitemap(g):
    """If build.py already wrote sitemap.xml (press.build called after sitemaps()), add the press URLs with hreflang."""
    fp = os.path.join(g["OUT"], "sitemap.xml")
    if not os.path.exists(fp): return
    x = open(fp, encoding="utf-8").read(); L = g["LANGS"]; add = ""
    for tpl in SITEMAP:
        if BASE + tpl.format(l=L[0]) + "<" in x: continue
        alts = "".join(f'<xhtml:link rel="alternate" hreflang="{y}" href="{BASE}{tpl.format(l=y)}"/>' for y in L)
        add += "".join(f"<url><loc>{BASE}{tpl.format(l=l)}</loc><lastmod>{g['NOW'].date().isoformat()}</lastmod>{alts}</url>" for l in L)
    if add: open(fp, "w", encoding="utf-8").write(x.replace("</urlset>", add + "</urlset>"))

def build(g):
    for l in g["LANGS"]: page(g, l)
    _sitemap(g)
