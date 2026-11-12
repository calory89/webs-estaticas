# 13-nov-2026 · "Places to visit in Sumba" list page, with intros written natively in Indonesian ("wisata Sumba")
# and Spanish ("qué ver en Sumba"), the two markets with the biggest search volume after English.
# The list itself is generated from our place data in each language, grouped by region.
REG_ORDER = ["sbd", "sb", "st", "stim"]
INTRO = {
 "en": {"t": "Places to visit in Sumba: all 41 spots by region",
        "d": "Every place worth visiting in Sumba, grouped by region with a one-line description, map links and distances: beaches, waterfalls, villages, hills and culture.",
        "i": "<p>This is our complete list of places to visit in Sumba, grouped by the island's four regions. Every place has its own page with photos, a map, how to get there, drive times, sunrise and sunset and practical tips. Use it to build your route, or open the {map} to see everything at once.</p><p>Short on time? Start with our {top}.</p>",
        "faq": [["What is the most famous place in Sumba?", "Weekuri Lagoon in Southwest Sumba is the most photographed place on the island, followed by Wairinding Hill and Walakiri Beach in the east."],
                ["How many days do I need to see Sumba?", "Five days covers the highlights of the west and east; ten days lets you see all four regions comfortably."]]},
 "id": {"t": "Wisata Sumba: 41 tempat wisata terbaik di Pulau Sumba",
        "d": "Daftar lengkap tempat wisata di Sumba per kabupaten: pantai, air terjun, kampung adat, bukit dan budaya, dengan peta, jarak dan tips perjalanan.",
        "i": "<p>Inilah daftar lengkap tempat wisata di Sumba, dikelompokkan menurut empat kabupaten: Sumba Barat Daya, Sumba Barat, Sumba Tengah dan Sumba Timur. Setiap tempat punya halaman sendiri berisi foto, peta, cara menuju ke sana, perkiraan waktu perjalanan, jam matahari terbit dan terbenam, serta tips praktis. Buka {map} untuk melihat semuanya sekaligus.</p><p>Waktunya terbatas? Mulai dari {top}.</p>",
        "faq": [["Tempat wisata apa yang paling terkenal di Sumba?", "Danau Weekuri di Sumba Barat Daya adalah tempat yang paling banyak difoto, disusul Bukit Wairinding dan Pantai Walakiri di Sumba Timur."],
                ["Berapa hari waktu yang dibutuhkan untuk keliling Sumba?", "Lima hari cukup untuk tempat utama di barat dan timur; sepuluh hari untuk menjelajahi keempat kabupaten dengan santai."]]},
 "es": {"t": "Qué ver en Sumba: los 41 mejores sitios de la isla",
        "d": "Todo lo que hay que ver en Sumba (Indonesia) por regiones: playas, cascadas, aldeas tradicionales, colinas y cultura, con mapa, distancias y consejos.",
        "i": "<p>Esta es nuestra lista completa de qué ver en Sumba, ordenada por las cuatro regiones de la isla: Sumba Suroccidental, Sumba Occidental, Sumba Central y Sumba Oriental. Cada sitio tiene su propia página con fotos, mapa, cómo llegar, tiempos en coche, horas de amanecer y atardecer y consejos prácticos. Abre el {map} para verlo todo de un vistazo.</p><p>¿Poco tiempo? Empieza por nuestro {top}.</p>",
        "faq": [["¿Cuál es el sitio más famoso de Sumba?", "La laguna Weekuri, en Sumba Suroccidental, es el lugar más fotografiado de la isla, seguida de la colina Wairinding y la playa Walakiri en el este."],
                ["¿Cuántos días hacen falta para ver Sumba?", "Con cinco días ves lo esencial del oeste y del este; con diez, las cuatro regiones con calma."]]},
}
LINKS = {"en": ("interactive map", "Sumba travel guide"), "id": ("peta interaktif", "panduan wisata Sumba"), "es": ("mapa interactivo", "guía de viaje de Sumba")}
def build(l, places, ui, intro):
    """places: list of (place, translated dict). ui: UI[l] with reg/cat names."""
    mp, top = LINKS.get(l, LINKS["en"]) if l in LINKS else (None, None)
    i = intro["i"]
    if mp: i = i.replace("{map}", f'<a href="/{{l}}/map/">{mp}</a>').replace("{top}", f'<a href="/{{l}}/guide/sumba-travel-guide/">{top}</a>')
    out = [i]
    for r in REG_ORDER:
        rows = [(p, t) for p, t in places if p["r"] == r]
        if not rows: continue
        out.append(f"<h2>{ui['reg'][r]}</h2><ol>")
        for p, t in rows:
            first = t["t"].split(". ")[0].rstrip(".") + "."
            out.append(f'<li><b><a href="/{{l}}/place/{p["s"]}/">{t["n"]}</a></b> ({ui["cat"][p["c"]]}). {first}</li>')
        out.append("</ol>")
    return "".join(out)
