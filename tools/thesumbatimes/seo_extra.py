# -*- coding: utf-8 -*-
"""Topic (tag) hub pages with intro text, the 'Topics' line under articles, Dataset schema for data pages and the
'reviewed' line for guides. Wired from build.py: seo_extra.build(globals()), seo_extra.topics_html(g, a, l), seo_extra.dataset_ld(...)."""
import json, re, html

def esc(s): return html.escape(str(s), quote=True)
BASE = "https://thesumbatimes.com"

# slug -> (match terms, names, intros). Intros say only what the hub contains; facts live in the linked pieces.
TAGS = {
 "pasola": (["pasola"], {"en": "Pasola", "es": "Pasola", "id": "Pasola"},
  {"en": "Everything we publish about the Pasola, the ritual mounted spear contest of western Sumba: the calendar, how to watch it with respect and the latest news on dates.", "es": "Todo lo que publicamos sobre la Pasola, el combate ritual a caballo del oeste de Sumba: el calendario, cómo verla con respeto y las últimas noticias sobre las fechas.", "id": "Semua tulisan kami tentang Pasola, perang ritual berkuda di Sumba bagian barat: kalender, cara menonton dengan hormat, dan kabar terbaru soal tanggalnya."}),
 "ikat": (["ikat", "tenun", "weaving", "tejido"], {"en": "Ikat weaving", "es": "Ikat", "id": "Tenun ikat"},
  {"en": "Sumba's ikat textiles: how they are made, what the motifs mean and how to buy directly from the weavers.", "es": "Los tejidos ikat de Sumba: cómo se hacen, qué significan sus motivos y cómo comprar directamente a las tejedoras.", "id": "Tenun ikat Sumba: cara pembuatannya, makna motifnya, dan cara membeli langsung dari para penenun."}),
 "marapu": (["marapu", "megalith", "megalit", "village", "kampung", "pueblo"], {"en": "Marapu and traditional villages", "es": "Marapu y pueblos tradicionales", "id": "Marapu dan kampung adat"},
  {"en": "The Marapu belief, megalithic tombs and the traditional villages where Sumba's customs are still lived every day, with visiting etiquette.", "es": "La creencia marapu, las tumbas megalíticas y los pueblos tradicionales donde las costumbres de Sumba se viven a diario, con las normas de visita.", "id": "Kepercayaan Marapu, kubur batu megalitik, dan kampung adat tempat tradisi Sumba masih dijalani sehari-hari, lengkap dengan tata krama berkunjung."}),
 "flights": (["flight", "vuelo", "penerbangan", "airport", "bandara", "aeropuerto", "transnusa", "wings"], {"en": "Flights to Sumba", "es": "Vuelos a Sumba", "id": "Penerbangan ke Sumba"},
  {"en": "Routes, airlines and airport news for Tambolaka and Waingapu, and step-by-step guides from each origin.", "es": "Rutas, aerolíneas y noticias de los aeropuertos de Tambolaka y Waingapu, con guías paso a paso desde cada origen.", "id": "Rute, maskapai, dan kabar bandara Tambolaka serta Waingapu, lengkap dengan panduan langkah demi langkah dari tiap kota asal."}),
 "ferries": (["ferry", "ferri", "feri", "kapal", "pelni", "asdp", "port", "pelabuhan", "puerto"], {"en": "Ferries and ports", "es": "Ferris y puertos", "id": "Feri dan pelabuhan"},
  {"en": "Sea links to and from Sumba: routes, ports, service changes and practical advice.", "es": "Las conexiones por mar con Sumba: rutas, puertos, cambios de servicio y consejos prácticos.", "id": "Jalur laut dari dan ke Sumba: rute, pelabuhan, perubahan layanan, dan saran praktis."}),
 "weather": (["weather", "rain", "el-nino", "lluvia", "clima", "tiempo", "cuaca", "hujan", "bmkg", "season", "musim", "epoca", "temporada"], {"en": "Weather and seasons", "es": "Tiempo y estaciones", "id": "Cuaca dan musim"},
  {"en": "Seasons, forecasts and what the weather means for a trip to Sumba, month by month.", "es": "Las estaciones, las previsiones y lo que el tiempo supone para un viaje a Sumba, mes a mes.", "id": "Musim, prakiraan, dan arti cuaca bagi perjalanan ke Sumba, bulan demi bulan."}),
 "beaches": (["beach", "playa", "pantai", "lagoon", "laguna", "danau"], {"en": "Beaches and lagoons", "es": "Playas y lagunas", "id": "Pantai dan laguna"},
  {"en": "Sumba's beaches and lagoons one by one: how to get there, what to expect and when to go.", "es": "Las playas y lagunas de Sumba, una a una: cómo llegar, qué esperar y cuándo ir.", "id": "Pantai dan laguna Sumba satu per satu: cara ke sana, apa yang akan Anda temui, dan kapan sebaiknya datang."}),
 "waterfalls": (["waterfall", "cascada", "air-terjun"], {"en": "Waterfalls", "es": "Cascadas", "id": "Air terjun"},
  {"en": "The island's waterfalls, with access, walking times and the best season for each.", "es": "Las cascadas de la isla, con el acceso, el tiempo de caminata y la mejor época para cada una.", "id": "Air terjun di pulau ini, lengkap dengan akses, lama berjalan kaki, dan musim terbaik untuk masing-masing."}),
 "surf": (["surf", "selancar", "ombak", "olas"], {"en": "Surf", "es": "Surf", "id": "Selancar"},
  {"en": "Waves, seasons and the practical side of surfing in Sumba.", "es": "Olas, temporadas y el lado práctico de surfear en Sumba.", "id": "Ombak, musim, dan sisi praktis berselancar di Sumba."}),
 "horses": (["horse", "caballo", "kuda", "sandalwood"], {"en": "Horses", "es": "Caballos", "id": "Kuda"},
  {"en": "The Sandalwood pony and the horse culture that runs through Sumba's rituals and daily life.", "es": "El poni Sandalwood y la cultura ecuestre que atraviesa los rituales y la vida diaria de Sumba.", "id": "Kuda Sandalwood dan budaya berkuda yang mewarnai ritual serta keseharian Sumba."}),
 "land": (["land", "tierra", "tanah", "adat", "invest", "inversion", "investasi", "property", "propiedad"], {"en": "Land and investment", "es": "Tierra e inversión", "id": "Tanah dan investasi"},
  {"en": "Customary land, titles, tourism figures and projects: neutral, sourced reporting for people who invest or work in Sumba.", "es": "Tierra consuetudinaria, títulos, cifras de turismo y proyectos: información neutral y con fuentes para quien invierte o trabaja en Sumba.", "id": "Tanah ulayat, sertifikat, angka pariwisata, dan proyek: liputan netral dan bersumber jelas bagi yang berinvestasi atau bekerja di Sumba."}),
 "fuel-roads": (["fuel", "gasolina", "combustible", "bbm", "spbu", "road", "carretera", "jalan", "getting-around", "moverse", "berkeliling"], {"en": "Roads and fuel", "es": "Carreteras y combustible", "id": "Jalan dan BBM"},
  {"en": "Getting around the island: road conditions, fuel supply and how to hire a car with a driver.", "es": "Moverse por la isla: estado de las carreteras, suministro de combustible y cómo contratar un coche con conductor.", "id": "Berkeliling pulau: kondisi jalan, pasokan BBM, dan cara menyewa mobil dengan sopir."}),
 "waingapu": (["waingapu", "east-sumba", "sumba-timur", "sumba-oriental"], {"en": "Waingapu and East Sumba", "es": "Waingapu y Sumba Oriental", "id": "Waingapu dan Sumba Timur"},
  {"en": "News and guides from Waingapu and the savannas, hills and beaches of East Sumba.", "es": "Noticias y guías de Waingapu y de las sabanas, colinas y playas de Sumba Oriental.", "id": "Berita dan panduan dari Waingapu serta sabana, bukit, dan pantai Sumba Timur."}),
 "west-sumba": (["tambolaka", "waikabubak", "kodi", "southwest-sumba", "west-sumba", "sumba-barat", "suroccidental", "occidental"], {"en": "Tambolaka and West Sumba", "es": "Tambolaka y el oeste de Sumba", "id": "Tambolaka dan Sumba bagian barat"},
  {"en": "News and guides from Tambolaka, Waikabubak and Kodi: lagoons, traditional villages and the Pasola fields.", "es": "Noticias y guías de Tambolaka, Waikabubak y Kodi: lagunas, pueblos tradicionales y campos de Pasola.", "id": "Berita dan panduan dari Tambolaka, Waikabubak, dan Kodi: laguna, kampung adat, dan arena Pasola."}),
}
T = {"en": {"topics": "Topics", "all": "All topics", "desc": "Browse The Sumba Times by topic: Pasola, ikat, flights, ferries, beaches, weather, land and more, with every story and guide on each.", "reviewed": "Reviewed by the newsroom on"},
     "es": {"topics": "Temas", "all": "Todos los temas", "desc": "Explora The Sumba Times por temas: Pasola, ikat, vuelos, ferris, playas, tiempo, tierra y más, con todas las noticias y guías de cada uno.", "reviewed": "Revisado por la redacción el"},
     "id": {"topics": "Topik", "all": "Semua topik", "desc": "Jelajahi The Sumba Times berdasarkan topik: Pasola, tenun ikat, penerbangan, feri, pantai, cuaca, tanah, dan lainnya, lengkap dengan semua berita dan panduan.", "reviewed": "Ditinjau redaksi pada"}}
_cache = {}

def tags_of(a):
    if a["slug"] in _cache: return _cache[a["slug"]]
    kw = a.get("keywords") or {}
    hay = " ".join([a["slug"], (a.get("slugs") or {}).get("es", ""), (a.get("slugs") or {}).get("id", ""), a["en"]["title"].lower().replace(" ", "-")] + [k.lower().replace(" ", "-") for k in (kw.get("en", []) if isinstance(kw, dict) else [])])
    out = [t for t, (terms, _, _) in TAGS.items() if any(x in hay for x in terms)]
    _cache[a["slug"]] = out[:4]; return _cache[a["slug"]]

def topics_html(a, l):
    ts = tags_of(a)
    if not ts: return ""
    return f'<p class="tags"><b>{T[l]["topics"]}:</b> ' + " ".join(f'<a href="/{l}/topic/{t}/">{esc(TAGS[t][1][l])}</a>' for t in ts) + "</p>"

def dataset_ld(a, l, url):
    """Dataset schema for pages whose value is their data tables (facts page, Pasola calendar, costs)."""
    if a["slug"] not in ("sumba-facts-figures", "pasola-2027-dates", "sumba-travel-costs", "best-time-to-visit-sumba"): return None
    return {"@context": "https://schema.org", "@type": "Dataset", "name": a[l]["title"], "description": (a[l].get("answer") or a[l]["dek"])[:4900], "url": url, "inLanguage": l,
            "isAccessibleForFree": True, "creator": {"@type": "NewsMediaOrganization", "name": "The Sumba Times", "url": BASE},
            "dateModified": a.get("updated") or a["date"], "spatialCoverage": {"@type": "Place", "name": "Sumba, East Nusa Tenggara, Indonesia"},
            "keywords": (a.get("keywords") or {}).get(l, []) if isinstance(a.get("keywords"), dict) else []}

def reviewed_html(g, a, l):
    if g["kind_of"](a) != "guide": return ""
    d = a.get("updated") or a["date"]
    return f'<span>{T[l]["reviewed"]} <time datetime="{d}">{g["fdate"](dict(a, date=d), l, False)}</time></span>'

CSS = """.tags{margin:18px 0 0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:14px}.tags a{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:5px 11px;margin:4px 4px 0 0;text-decoration:none;color:var(--ink)}.tags a:hover{border-color:var(--accent);color:var(--accent)}
.pager{display:flex;justify-content:space-between;gap:12px;margin:26px 0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}.pager a{border:1px solid var(--line);border-radius:999px;padding:9px 16px;text-decoration:none;color:var(--ink)}"""
SITEMAP = ["/{l}/topic/"] + ["/{l}/topic/" + t + "/" for t in TAGS]

def build(g):
    for l in g["LANGS"]:
        items = g["all_items"](); idx = ""
        for t, (terms, names, intros) in TAGS.items():
            its = [a for a in items if t in tags_of(a)]
            if not its: continue
            tpl = "/{l}/topic/" + t + "/"
            ld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": names[l], "description": intros[l], "inLanguage": l, "url": BASE + tpl.format(l=l),
                  "mainEntity": {"@type": "ItemList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": BASE + g["url_of"](a, l), "name": a[l]["title"]} for i, a in enumerate(its[:50])]}}
            pg = g["head"](l, {"en": f"{names[l]}: news and guides", "es": f"{names[l]}: noticias y guías", "id": f"{names[l]}: berita dan panduan"}[l] + " · The Sumba Times", intros[l], tpl, extra=f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>') + g["masthead"](l, tpl)
            pg += f'<main id="main" class="w"><div class="crumbs"><a href="/{l}/">{g["X"][l]["home"]}</a> › <a href="/{l}/topic/">{T[l]["topics"]}</a></div><div class="sec-h"><h1>{esc(names[l])}</h1><p>{esc(intros[l])}</p></div><div class="grid">{"".join(g["card"](a, l) for a in its)}</div><div class="nar" style="margin-top:26px">{g["subscribe"](l, False, None, "topic")}</div></main>' + g["footer"](l)
            g["write"](tpl.format(l=l), pg)
            idx += f'<article class="wk"><h2><a href="/{l}/topic/{t}/">{esc(names[l])}</a> <small>({len(its)})</small></h2><p>{esc(intros[l])}</p></article>'
        tpl = "/{l}/topic/"
        pg = g["head"](l, f'{T[l]["all"]} · The Sumba Times', T[l]["desc"], tpl) + g["masthead"](l, tpl)
        pg += f'<main id="main" class="w"><div class="nar"><div class="crumbs"><a href="/{l}/">{g["X"][l]["home"]}</a></div><h1>{T[l]["all"]}</h1><p class="dek">{T[l]["desc"]}</p>{idx}</div></main>' + g["footer"](l)
        g["write"](tpl.format(l=l), pg)
