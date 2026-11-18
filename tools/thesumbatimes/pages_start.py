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
