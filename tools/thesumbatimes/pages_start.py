# -*- coding: utf-8 -*-
"""'Start here' page per language (/LANG/start/): six steps for a first trip to Sumba. Each step shows the quick answer already written and
sourced in the guide it links to, so nothing here is new information. Also all_guides_html(g, l): text list of every guide and place for the front page."""
import html, json
def esc(s): return html.escape(str(s), quote=True)
STEPS = [("when", ["best-time-to-visit-sumba", "sumba-rainy-season"], [("/{l}/sumba-in/", {"en": "Sumba month by month", "es": "Sumba mes a mes", "id": "Sumba dari bulan ke bulan"})]),
         ("how", ["getting-around-sumba", "tambolaka-airport-guide", "waingapu-airport-guide", "ferries-to-sumba"], [("/{l}/flights/", {"en": "Flights to Sumba today", "es": "Vuelos a Sumba hoy", "id": "Penerbangan ke Sumba hari ini"})]),
         ("days", ["how-many-days-in-sumba", "sumba-itinerary-3-days-2-nights", "sumba-itinerary-4-days-3-nights", "sumba-itinerary-5-7-10-days"], []),
         ("where", ["east-sumba-or-west-sumba", "where-to-stay-in-sumba-best-areas", "things-to-do-in-sumba"], [("/{l}/map/", {"en": "Map of every place", "es": "Mapa de todos los lugares", "id": "Peta semua tempat"}), ("/{l}/distances/", {"en": "Distances and driving times", "es": "Distancias y tiempos", "id": "Jarak dan waktu tempuh"})]),
         ("cost", ["sumba-travel-costs", "sumba-on-a-budget", "car-with-driver-in-sumba", "atms-cash-cards-sumba"], [("/{l}/plan/", {"en": "Budget calculator", "es": "Calculadora de presupuesto", "id": "Kalkulator anggaran"})]),
         ("respect", ["sumba-etiquette-mistakes", "sumba-travel-safety-health", "sumba-packing-list"], [("/{l}/glossary/", {"en": "Glossary", "es": "Glosario", "id": "Glosarium"})])]
S = {"en": {"title": "Start here: plan a first trip to Sumba in six steps", "h1": "New to Sumba? Start here", "desc": "Six steps to plan a first trip to Sumba, Indonesia: when to go, how to get there, how many days, where to base yourself, what it costs and how to behave.",
            "lead": "Sumba is an island of Indonesia one hour by plane east of Bali. It has no mass tourism, long distances and few services outside the towns, so it rewards a little planning. These six steps follow the order in which most people decide a trip. Each one gives the short answer and links to the full guide.",
            "steps": {"when": "When to go", "how": "How to get there and around", "days": "How many days", "where": "West, east or both", "cost": "What it costs", "respect": "Rules of respect and safety"}, "more": "Also useful", "step": "Step", "all": "All guides", "places": "Places", "crumb": "Start here"},
     "es": {"title": "Empieza aquí: planifica tu primer viaje a Sumba en seis pasos", "h1": "¿Primera vez en Sumba? Empieza aquí", "desc": "Seis pasos para planificar un primer viaje a Sumba (Indonesia): cuándo ir, cómo llegar, cuántos días, dónde alojarte, cuánto cuesta y cómo comportarte.",
            "lead": "Sumba es una isla de Indonesia a una hora de avión al este de Bali. No tiene turismo de masas, las distancias son largas y hay pocos servicios fuera de las ciudades, así que conviene planificar un poco. Estos seis pasos siguen el orden en que casi todo el mundo decide un viaje. Cada uno da la respuesta corta y enlaza la guía completa.",
            "steps": {"when": "Cuándo ir", "how": "Cómo llegar y moverse", "days": "Cuántos días", "where": "Oeste, este o los dos", "cost": "Cuánto cuesta", "respect": "Normas de respeto y seguridad"}, "more": "También útil", "step": "Paso", "all": "Todas las guías", "places": "Lugares", "crumb": "Empieza aquí"},
     "id": {"title": "Mulai di sini: rencanakan perjalanan pertama ke Sumba dalam enam langkah", "h1": "Pertama kali ke Sumba? Mulai di sini", "desc": "Enam langkah merencanakan perjalanan pertama ke Sumba: kapan pergi, cara ke sana, berapa hari, menginap di mana, berapa biayanya, dan cara bersikap.",
            "lead": "Sumba adalah pulau di Indonesia, satu jam penerbangan di sebelah timur Bali. Pulau ini belum ramai wisatawan, jarak antartempat jauh, dan layanan di luar kota terbatas, sehingga sedikit perencanaan sangat membantu. Enam langkah ini mengikuti urutan orang biasanya memutuskan perjalanan. Setiap langkah memberi jawaban singkat dan tautan ke panduan lengkapnya.",
            "steps": {"when": "Kapan pergi", "how": "Cara ke sana dan berkeliling", "days": "Berapa hari", "where": "Barat, timur, atau keduanya", "cost": "Berapa biayanya", "respect": "Aturan sopan santun dan keselamatan"}, "more": "Juga berguna", "step": "Langkah", "all": "Semua panduan", "places": "Tempat", "crumb": "Mulai di sini"}}
SITEMAP = ["/{l}/start/"]
FOOTER = [("/{l}/start/", {"en": "Start here", "es": "Empieza aquí", "id": "Mulai di sini"})]
CSS = """
.stp{counter-reset:st}.stp section{border-top:3px solid var(--ink);margin:26px 0 0;padding-top:8px}.stp h2{font-size:24px;margin:.2em 0 .4em}.stp .sn{font:700 12px -apple-system,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}.stp ul{font:16px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.allg{margin:30px 0 0;border-top:3px solid var(--ink);padding-top:8px}.allg h2{font-size:22px;margin:.2em 0 .5em}.allg h3{font:700 12.5px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);margin:14px 0 4px}.allg p{font:14.5px/1.7 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0}.allg a{text-decoration:none;color:inherit;border-bottom:1px solid var(--line)}.allg a:hover{border-color:var(--ink)}
"""
def all_guides_html(g, l):
    """Plain text links to every guide and place page, grouped by section: every guide hangs one click from the front page."""
    by = {}
    for a in g["all_items"]():
        if g["kind_of"](a) == "guide": by.setdefault(a["section"], []).append(a)
    out = ""
    order = ["things-to-do", "getting-here", "where-to-stay", "culture", "living", "business", "projects", "places"]
    for sec in order + [s for s in by if s not in order]:
        its = by.get(sec)
        if not its: continue
        name = (lambda a: g["pages_hubs"].pname(a, l)) if sec == "places" else (lambda a: a[l]["title"].split(":")[0].strip() if len(a[l]["title"]) > 60 else a[l]["title"])
        out += f'<h3><a href="/{l}/{sec}/">{esc(g["sec_name"](l, sec))}</a></h3><p>' + " · ".join(f'<a href="{g["url_of"](a, l)}">{esc(name(a))}</a>' for a in sorted(its, key=lambda a: name(a).lower())) + "</p>"
    return f'<section class="allg" data-block="allguides"><h2>{S[l]["all"]}</h2>{out}</section>'
def build(g):
    build_a11y(g)
    items = {a["slug"]: a for a in g["all_items"]()}
    for l in g["LANGS"]:
        t = S[l]; tpl = "/{l}/start/"; body = f'<p class="dek">{esc(t["lead"])}</p><div class="stp">'; howto = []
        for n, (k, slugs, extra) in enumerate(STEPS, 1):
            gs = [items[s] for s in slugs if s in items]
            if not gs: continue
            first = gs[0]; ans = first[l].get("answer") or first[l]["dek"]
            li = "".join(f'<li><a href="{g["url_of"](a, l)}">{esc(a[l]["title"])}</a></li>' for a in gs) + "".join(f'<li><a href="{u.format(l=l)}">{esc(nm[l])}</a></li>' for u, nm in extra)
            body += f'<section><p class="sn">{t["step"]} {n}</p><h2 id="{k}">{esc(t["steps"][k])}</h2><p>{esc(ans)}</p><ul>{li}</ul></section>'
            howto.append({"@type": "HowToStep", "position": n, "name": t["steps"][k], "text": ans, "url": g["BASE"] + g["url_of"](first, l)})
        body += "</div>" + all_guides_html(g, l)
        ld = [{"@context": "https://schema.org", "@type": "HowTo", "name": t["h1"], "description": t["desc"], "inLanguage": l, "step": howto}]
        g["pages_hubs"]._page(g, l, tpl, t["title"], t["desc"], t["h1"], [(g["X"][l]["home"], f"/{l}/")], body, ld)

# ---------- accessibility statement (/LANG/accessibility/) ----------
A11Y = {"en": ("Accessibility statement", "What The Sumba Times does so that everyone can read it, what we tested, what still falls short and how to ask for content in another format.",
               [("Our aim", "We want every page to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA. Pages are plain HTML that works without JavaScript for reading; the site follows your light or dark setting and has its own switch; every page has a link to skip to the content and one main heading."),
                ("What we tested", "On 19 November 2026 we ran the axe-core automated checker on 16 page types (front page, news story, guide, place page, tools, tables, forms) at phone width, in light and dark mode. After fixing what it found (contrast of one button in dark mode, the size of small links, keyboard access to wide tables) it reported no failures. An automated checker finds only part of the problems, so this is not a full audit: no test with screen reader users has been done yet."),
                ("Known limits", "The interactive map on the trip planner has not been tested with a screen reader; the same places are listed as text on the map page and in the attractions table. The maps drawn on place pages are pictures with a short text description; the distances they show are also written out in the box above them. The PDF guide has not been checked for accessibility; its content is available as web pages. Photos have a caption used as their text alternative, which describes the place more than the picture. The listen button uses your browser's voice, whose quality in Indonesian and Spanish depends on the device."),
                ("Ask for another format or report a barrier", "Write to [MAIL] and tell us the page and the problem. We answer within five working days and, if you need it, send the content of any page as plain text or Markdown. Every article already has a plain Markdown version: add index.md to its address.")]),
        "es": ("Declaración de accesibilidad", "Qué hace The Sumba Times para que cualquiera pueda leerlo, qué hemos comprobado, qué falla todavía y cómo pedir un contenido en otro formato.",
               [("Nuestro objetivo", "Queremos que todas las páginas cumplan las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.2 en el nivel AA. Las páginas son HTML sencillo que se puede leer sin JavaScript; la web sigue tu ajuste de modo claro u oscuro y tiene su propio interruptor; cada página tiene un enlace para saltar al contenido y un único titular principal."),
                ("Qué hemos comprobado", "El 19 de noviembre de 2026 pasamos el comprobador automático axe-core a 16 tipos de página (portada, noticia, guía, ficha de lugar, herramientas, tablas, formularios) en ancho de móvil, en modo claro y oscuro. Tras corregir lo que encontró (el contraste de un botón en modo oscuro, el tamaño de los enlaces pequeños, el acceso con teclado a las tablas anchas) no señaló ningún fallo. Un comprobador automático solo detecta una parte de los problemas, así que esto no es una auditoría completa: todavía no se ha hecho ninguna prueba con personas que usan lector de pantalla."),
                ("Límites conocidos", "El mapa interactivo del planificador no se ha probado con lector de pantalla; los mismos lugares están en texto en la página del mapa y en la tabla de lugares. Los mapas de las fichas son imágenes con una descripción breve; las distancias que muestran también están escritas en la caja de encima. La guía en PDF no se ha revisado en accesibilidad; su contenido está disponible como páginas web. Las fotos usan el pie como texto alternativo, que describe más el lugar que la imagen. El botón de escuchar usa la voz de tu navegador, cuya calidad en indonesio y en español depende del dispositivo."),
                ("Pedir otro formato o avisar de una barrera", "Escribe a [MAIL] e indícanos la página y el problema. Respondemos en cinco días laborables y, si lo necesitas, enviamos el contenido de cualquier página en texto plano o Markdown. Cada artículo tiene ya una versión Markdown sencilla: añade index.md a su dirección.")]),
        "id": ("Pernyataan aksesibilitas", "Apa yang dilakukan The Sumba Times agar bisa dibaca semua orang, apa yang sudah kami uji, apa yang masih kurang, dan cara meminta konten dalam format lain.",
               [("Tujuan kami", "Kami ingin setiap halaman memenuhi Pedoman Aksesibilitas Konten Web (WCAG) 2.2 tingkat AA. Halaman kami berupa HTML sederhana yang tetap bisa dibaca tanpa JavaScript; situs mengikuti setelan mode terang atau gelap di perangkat Anda dan punya tombolnya sendiri; setiap halaman memiliki tautan untuk langsung ke isi dan satu judul utama."),
                ("Yang sudah kami uji", "Pada 19 November 2026 kami menjalankan pemeriksa otomatis axe-core pada 16 jenis halaman (halaman depan, berita, panduan, halaman tempat, alat bantu, tabel, formulir) dengan lebar layar ponsel, dalam mode terang dan gelap. Setelah temuannya diperbaiki (kontras satu tombol pada mode gelap, ukuran tautan kecil, akses papan ketik ke tabel lebar), pemeriksa itu tidak lagi melaporkan kegagalan. Pemeriksa otomatis hanya menemukan sebagian masalah, jadi ini bukan audit lengkap: uji bersama pengguna pembaca layar belum pernah dilakukan."),
                ("Keterbatasan yang kami ketahui", "Peta interaktif di perencana perjalanan belum diuji dengan pembaca layar; tempat yang sama tersedia sebagai teks di halaman peta dan di tabel tempat wisata. Peta pada halaman tempat berupa gambar dengan deskripsi singkat; jarak yang ditampilkan juga tertulis di kotak di atasnya. Panduan PDF belum diperiksa aksesibilitasnya; isinya tersedia sebagai halaman web. Foto memakai keterangan gambar sebagai teks alternatif, yang lebih menjelaskan tempat daripada gambarnya. Tombol dengarkan memakai suara peramban Anda, yang mutunya untuk bahasa Indonesia dan Spanyol bergantung pada perangkat."),
                ("Meminta format lain atau melaporkan hambatan", "Kirim surel ke [MAIL] dan sebutkan halaman serta masalahnya. Kami menjawab dalam lima hari kerja dan, bila diperlukan, mengirim isi halaman mana pun sebagai teks polos atau Markdown. Setiap artikel sudah punya versi Markdown sederhana: tambahkan index.md pada alamatnya.")])}
SITEMAP.append("/{l}/accessibility/")
FOOTER.append(("/{l}/accessibility/", {"en": "Accessibility", "es": "Accesibilidad", "id": "Aksesibilitas"}))
def build_a11y(g):
    for l in g["LANGS"]:
        title, desc, secs = A11Y[l]; c = g["CONTACT"]
        body = f'<p class="dek">{esc(desc)}</p>' + "".join(f'<h2>{esc(h)}</h2><p>{esc(p).replace("[MAIL]", f"""<a href="mailto:{c}">{c}</a>""")}</p>' for h, p in secs)
        g["pages_hubs"]._page(g, l, "/{l}/accessibility/", title + ": The Sumba Times", desc, title, [(g["X"][l]["home"], f"/{l}/")], body, [])
