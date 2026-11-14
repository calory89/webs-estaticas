# -*- coding: utf-8 -*-
"""Living reference pages for The Sumba Times, built by build.py: pages_live.build(globals()).
  /LANG/flights/        current scheduled routes into Tambolaka (TMC) and Waingapu (WGP)  -> edit FLIGHTS + CHECKED
  /LANG/events/         annual events calendar + /sumba-events.ics                         -> edit EVENTS
  /LANG/travel-status/  generated on every build from the news briefs of the last 30 days  -> nothing to edit
Rules (EDITORIAL.md): every row has a source that was opened; a route or date that cannot be verified is left out;
no hotel names; never the em or en dash. To update the flights page: re-open each `source`, fix the row, bump CHECKED."""
import json, datetime, html, re

BASE = "https://thesumbatimes.com"
DAILY = ("/{l}/travel-status/", "/{l}/flights/")
SITEMAP = ["/{l}/flights/", "/{l}/events/", "/{l}/travel-status/"]
CSS = """.lv-upd{font:14px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:var(--muted);margin:0 0 1em}
.lv td,.lv th{padding:9px 8px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}.lv th{font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
.lv td small{display:block;color:var(--muted);margin-top:2px}.lv caption{caption-side:bottom;text-align:left;font-size:13px;color:var(--muted);padding-top:8px}
.lv-g{border-top:2px solid var(--ink);margin-top:28px;padding-top:4px}.lv-g ul{list-style:none;padding:0;margin:0}.lv-g li{border-bottom:1px solid var(--line);padding:12px 0}
.lv-g li time{font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:var(--muted);display:block}.lv-g li a{font-weight:700;text-decoration:none}.lv-g li p{margin:.3em 0 0;font-size:17px}
.lv-ok{color:var(--muted);font-style:italic}.lv-ev h3{margin:1.4em 0 .2em}.lv-ev .k{margin:0 0 .3em}"""

def esc(s): return html.escape(str(s), quote=True)
def _ld(*objs): return "".join(f'<script type="application/ld+json">{json.dumps(o, ensure_ascii=False)}</script>' for o in objs)
def _date(g, d, l):
    m = g["MONTHS"][l][d.month - 1]
    return f"{d.day} de {m} de {d.year}" if l == "es" else f"{d.day} {m} {d.year}"
def _item(g, slug):
    for a in g["all_items"]():
        if a["slug"] == slug: return a
    return None
def _link(g, slug, l, text=None):
    a = _item(g, slug)
    if not a: return ""
    return f'<a href="{g["url_of"](a, l)}">{esc(text or a[l]["title"])}</a>'
def _crumbs(g, l, sec):
    return f'<div class="crumbs"><a href="/{l}/">{g["X"][l]["home"]}</a> › <a href="/{l}/{sec}/">{esc(g["sec_name"](l, sec))}</a></div>'
def _bc(g, l, sec, name, tpl):
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": g["X"][l]["home"], "item": f"{BASE}/{l}/"},
        {"@type": "ListItem", "position": 2, "name": g["sec_name"](l, sec), "item": f"{BASE}/{l}/{sec}/"},
        {"@type": "ListItem", "position": 3, "name": name, "item": BASE + tpl.format(l=l)}]}
def _faq_ld(l, faq):
    return {"@context": "https://schema.org", "@type": "FAQPage", "inLanguage": l, "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq]}
def _faq_html(title, faq):
    return f'<section class="faq"><h2 id="faq">{title}</h2>' + "".join(f"<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>" for q, a in faq) + "</section>"
def _page(g, l, tpl, sec, title, desc, body, ld):
    pg = g["head"](l, title + " · The Sumba Times", desc, tpl, extra=_ld(*ld)) + g["masthead"](l, tpl, sec)
    pg += f'<main id="main" class="w"><div class="nar">{_crumbs(g, l, sec)}{body}</div></main>' + g["footer"](l)
    g["write"](tpl.format(l=l), pg)

# =====================================================================================================================
# 1. FLIGHTS
# =====================================================================================================================
CHECKED = "2026-11-10"   # the day every `source` below was last opened
AIRPORTS = {"TMC": {"en": "Tambolaka (TMC), Lede Kalumbang Airport, Southwest Sumba", "es": "Tambolaka (TMC), aeropuerto Lede Kalumbang, Sumba Suroccidental", "id": "Tambolaka (TMC), Bandara Lede Kalumbang, Sumba Barat Daya"},
            "WGP": {"en": "Waingapu (WGP), Umbu Mehang Kunda Airport, East Sumba", "es": "Waingapu (WGP), aeropuerto Umbu Mehang Kunda, Sumba Oriental", "id": "Waingapu (WGP), Bandara Umbu Mehang Kunda, Sumba Timur"}}
ORIGINS = {"DPS": "Bali (Denpasar, DPS)", "KOE": "Kupang (KOE)", "LBJ": "Labuan Bajo (LBJ)", "SUB": "Surabaya (SUB)", "LOP": "Lombok (Praya, LOP)"}
GUIDE_OF = {"DPS": "how-to-get-to-sumba-from-bali", "KOE": "kupang-to-sumba", "LBJ": "labuan-bajo-to-sumba", "SUB": "surabaya-to-sumba"}
# mins = typical non-stop flight time in minutes as listed by the source. Leave a route out if it cannot be verified.
FLIGHTS = [
 {"to": "TMC", "from": "DPS", "airline": "Batik Air", "mins": 75,
  "freq": {"en": "Daily", "es": "Diario", "id": "Setiap hari"},
  "note": {"en": "Flight ID 6324, Airbus A320, leaves Bali at 09:10.", "es": "Vuelo ID 6324, Airbus A320, sale de Bali a las 09:10.", "id": "Penerbangan ID 6324, Airbus A320, berangkat dari Bali pukul 09.10."},
  "src_name": "AirportOverview", "source": "https://www.airportoverview.com/routes/DPS/TMC"},
 {"to": "TMC", "from": "DPS", "airline": "Nam Air / Sriwijaya Air", "mins": 60,
  "freq": {"en": "Several a week", "es": "Varios a la semana", "id": "Beberapa kali sepekan"},
  "note": {"en": "Boeing 737-500. Counting all three airlines, the route has between 15 and 21 flights a week depending on the database.", "es": "Boeing 737-500. Sumando las tres aerolíneas, la ruta tiene entre 15 y 21 vuelos semanales, según la base de datos.", "id": "Boeing 737-500. Jika ketiga maskapai dijumlahkan, rute ini dilayani 15 sampai 21 penerbangan sepekan, bergantung pada basis data."},
  "src_name": "FlightConnections", "source": "https://www.flightconnections.com/flights-from-dps-to-tmc"},
 {"to": "TMC", "from": "KOE", "airline": "Nam Air", "mins": 60,
  "freq": {"en": "Daily", "es": "Diario", "id": "Setiap hari"},
  "note": {"en": "Flight IN 631, Boeing 737-500, leaves Kupang at 15:00.", "es": "Vuelo IN 631, Boeing 737-500, sale de Kupang a las 15:00.", "id": "Penerbangan IN 631, Boeing 737-500, berangkat dari Kupang pukul 15.00."},
  "src_name": "FlightsFrom", "source": "https://www.flightsfrom.com/KOE-TMC"},
 {"to": "TMC", "from": "KOE", "airline": "Wings Air", "mins": 95,
  "freq": {"en": "3 a week (Tue, Thu, Sat)", "es": "3 a la semana (martes, jueves y sábado)", "id": "3 kali sepekan (Selasa, Kamis, Sabtu)"},
  "note": {"en": "Flight IW 1921, ATR 72 turboprop, leaves Kupang at 11:10.", "es": "Vuelo IW 1921, turbohélice ATR 72, sale de Kupang a las 11:10.", "id": "Penerbangan IW 1921, pesawat baling-baling ATR 72, berangkat dari Kupang pukul 11.10."},
  "src_name": "FlightsFrom", "source": "https://www.flightsfrom.com/KOE-TMC"},
 {"to": "TMC", "from": "LBJ", "airline": "Wings Air", "mins": 50,
  "freq": {"en": "3 a week", "es": "3 a la semana", "id": "3 kali sepekan"},
  "note": {"en": "Flight IW 1916, ATR 72, leaves Labuan Bajo at 16:05. Listed as seasonal, from November to March.", "es": "Vuelo IW 1916, ATR 72, sale de Labuan Bajo a las 16:05. Figura como ruta de temporada, de noviembre a marzo.", "id": "Penerbangan IW 1916, ATR 72, berangkat dari Labuan Bajo pukul 16.05. Tercatat sebagai rute musiman, November sampai Maret."},
  "src_name": "FlightConnections", "source": "https://www.flightconnections.com/flights-from-lbj-to-tmc"},
 {"to": "TMC", "from": "SUB", "airline": "Nam Air", "mins": 90,
  "freq": {"en": "3 a week (Tue, Thu, Sat)", "es": "3 a la semana (martes, jueves y sábado)", "id": "3 kali sepekan (Selasa, Kamis, Sabtu)"},
  "note": {"en": "Flight IN 671 from Tambolaka at 10:50, Boeing 737-500.", "es": "Vuelo IN 671 desde Tambolaka a las 10:50, Boeing 737-500.", "id": "Penerbangan IN 671 dari Tambolaka pukul 10.50, Boeing 737-500."},
  "src_name": "FlightsFrom", "source": "https://www.flightsfrom.com/TMC-SUB"},
 {"to": "WGP", "from": "DPS", "airline": "TransNusa", "mins": 85,
  "freq": {"en": "4 a week (Tue, Wed, Fri, Sat)", "es": "4 a la semana (martes, miércoles, viernes y sábado)", "id": "4 kali sepekan (Selasa, Rabu, Jumat, Sabtu)"},
  "note": {"en": "Non-stop since 15 July 2026, flight 8B 5652, Comac ARJ21 jet.", "es": "Sin escalas desde el 15 de julio de 2026, vuelo 8B 5652, reactor Comac ARJ21.", "id": "Tanpa transit sejak 15 Juli 2026, penerbangan 8B 5652, jet Comac ARJ21."},
  "src_name": "ANTARA News Bali", "source": "https://bali.antaranews.com/berita/409805/bandara-ngurah-rai-tambah-dua-rute-baru-ke-waingapu-dan-wakatobi"},
 {"to": "WGP", "from": "DPS", "airline": "Sriwijaya Air", "mins": 80,
  "freq": {"en": "2 to 3 a week", "es": "De 2 a 3 a la semana", "id": "2 sampai 3 kali sepekan"},
  "note": {"en": "Flight SJ 740, Boeing 737-500, leaves Bali at 09:10. One database shows the current schedule ending on 30 December, so check before booking for 2027.", "es": "Vuelo SJ 740, Boeing 737-500, sale de Bali a las 09:10. Una base de datos da por terminada la programación actual el 30 de diciembre: conviene comprobarlo antes de reservar para 2027.", "id": "Penerbangan SJ 740, Boeing 737-500, berangkat dari Bali pukul 09.10. Satu basis data mencatat jadwal saat ini berakhir pada 30 Desember, jadi periksa dulu sebelum memesan untuk 2027."},
  "src_name": "FlightConnections", "source": "https://www.flightconnections.com/flights-from-dps-to-wgp"},
 {"to": "WGP", "from": "KOE", "airline": "Wings Air", "mins": 75,
  "freq": {"en": "Daily", "es": "Diario", "id": "Setiap hari"},
  "note": {"en": "Flight IW 1923, ATR 72, leaves Kupang at 15:20.", "es": "Vuelo IW 1923, ATR 72, sale de Kupang a las 15:20.", "id": "Penerbangan IW 1923, ATR 72, berangkat dari Kupang pukul 15.20."},
  "src_name": "FlightConnections", "source": "https://www.flightconnections.com/flights-from-koe-to-wgp"},
 {"to": "WGP", "from": "LOP", "airline": "Wings Air", "mins": 80,
  "freq": {"en": "Up to 2 a day (9 to 14 a week)", "es": "Hasta 2 al día (de 9 a 14 a la semana)", "id": "Hingga 2 kali sehari (9 sampai 14 kali sepekan)"},
  "note": {"en": "Flights IW 1884 and IW 1886, ATR 72, leave Lombok at 10:35 and 14:45.", "es": "Vuelos IW 1884 e IW 1886, ATR 72, salen de Lombok a las 10:35 y a las 14:45.", "id": "Penerbangan IW 1884 dan IW 1886, ATR 72, berangkat dari Lombok pukul 10.35 dan 14.45."},
  "src_name": "FlightsFrom", "source": "https://www.flightsfrom.com/LOP-WGP"},
]
MORE_SOURCES = [("FlightsFrom: Tambolaka (TMC)", "https://www.flightsfrom.com/TMC"), ("FlightsFrom: Waingapu (WGP)", "https://www.flightsfrom.com/WGP"),
                ("FlightConnections: Tambolaka (TMC)", "https://www.flightconnections.com/flights-from-tambolaka-tmc"), ("FlightConnections: Waingapu (WGP)", "https://www.flightconnections.com/flights-from-waingapu-wgp"),
                ("Wikipedia: Lede Kalumbang Airport", "https://en.wikipedia.org/wiki/Tambolaka_Airport"), ("Wikipedia: Umbu Mehang Kunda Airport", "https://en.wikipedia.org/wiki/Umbu_Mehang_Kunda_Airport")]

def _dur(m, l):
    h, r = divmod(m, 60)
    if l == "id": return ((f"{h} jam " if h else "") + (f"{r} menit" if r else "")).strip()
    return ((f"{h} h " if h else "") + (f"{r} min" if r else "")).strip()

F = {
 "en": {"title": "Flights to Sumba: current routes and airlines", "h1": "Flights to Sumba: current routes and airlines",
  "desc": "Every scheduled route into Tambolaka (TMC) and Waingapu (WGP): where it leaves from, which airline, how often and how long it takes, with sources.",
  "dek": "Every scheduled passenger route into Sumba's two airports, Tambolaka in the west and Waingapu in the east, with the airline, the frequency, the flight time and the page where we checked it.",
  "intro": "Sumba has no international flights. You arrive on a domestic flight from Bali, Kupang, Lombok, Surabaya or Labuan Bajo, to one of two airports four to five hours apart by road. Pick the airport first: Tambolaka for the west and south-west (Kodi, the Pasola fields, the traditional villages), Waingapu for the east (the savanna hills, the ikat villages, the beaches near town).",
  "checked": "Last checked", "th": ["From", "Airline", "Frequency", "Flight time", "Source"], "to": "Flights to", "cap": "Schedules change without notice. Confirm on the airline's own site before you pay.",
  "wings_h": "What changed on the Bali to Tambolaka route",
  "wings": "Wings Air, which flew Bali to Tambolaka with turboprops in earlier seasons, does not appear on that route in the schedule databases we opened on {d}. They list Batik Air, Nam Air and Sriwijaya Air instead, all with jets. Wings Air still flies to Tambolaka from Kupang and Labuan Bajo, and to Waingapu from Kupang and Lombok.",
  "guides_h": "Route by route", "guides_p": "Fares, baggage rules, connections and the sea alternatives are in our route guides:",
  "news_h": "Latest news on this", "src_h": "Sources", "faq_h": "Frequently asked questions",
  "faq": [("Which airports does Sumba have?", "Two. Tambolaka (TMC, Lede Kalumbang Airport) serves West and Southwest Sumba. Waingapu (WGP, Umbu Mehang Kunda Airport) serves East Sumba. They are four to five hours apart by road."),
          ("Are there direct flights from Bali to Sumba?", "Yes, to both airports. Batik Air, Nam Air and Sriwijaya Air fly Bali to Tambolaka in about 1 hour to 1 hour 15 minutes. TransNusa flies Bali to Waingapu non-stop four times a week (Tuesday, Wednesday, Friday and Saturday) and Sriwijaya Air two or three times a week."),
          ("Is there a direct flight from Jakarta to Sumba?", "No. None of the schedule databases we checked lists a non-stop flight from Jakarta to Tambolaka or Waingapu. Connect in Bali, or in Kupang, Surabaya or Lombok."),
          ("How often is this page checked?", "We reopen every source and update the table when a route starts, stops or changes. The date of the last check is shown at the top of the page.")]},
 "es": {"title": "Vuelos a Sumba: rutas y aerolíneas actuales", "h1": "Vuelos a Sumba: rutas y aerolíneas actuales",
  "desc": "Todas las rutas regulares a Tambolaka (TMC) y Waingapu (WGP): de dónde salen, qué aerolínea las opera, con qué frecuencia y cuánto dura el vuelo, con fuentes.",
  "dek": "Todas las rutas regulares de pasajeros a los dos aeropuertos de Sumba, Tambolaka en el oeste y Waingapu en el este, con la aerolínea, la frecuencia, la duración del vuelo y la página donde lo hemos comprobado.",
  "intro": "A Sumba no llegan vuelos internacionales. Se entra en un vuelo nacional desde Bali, Kupang, Lombok, Surabaya o Labuan Bajo, a uno de los dos aeropuertos de la isla, separados por cuatro o cinco horas de carretera. Lo primero es elegir aeropuerto: Tambolaka para el oeste y el suroeste (Kodi, los campos del Pasola, las aldeas tradicionales) y Waingapu para el este (las colinas de sabana, las aldeas del ikat, las playas cercanas a la ciudad).",
  "checked": "Última comprobación", "th": ["Origen", "Aerolínea", "Frecuencia", "Duración", "Fuente"], "to": "Vuelos a", "cap": "Los horarios cambian sin previo aviso. Confírmalos en la web de la aerolínea antes de pagar.",
  "wings_h": "Qué ha cambiado en la ruta de Bali a Tambolaka",
  "wings": "Wings Air, que en temporadas anteriores volaba de Bali a Tambolaka con turbohélices, no aparece en esa ruta en las bases de datos de horarios que consultamos el {d}. En su lugar figuran Batik Air, Nam Air y Sriwijaya Air, las tres con reactores. Wings Air sigue volando a Tambolaka desde Kupang y Labuan Bajo, y a Waingapu desde Kupang y Lombok.",
  "guides_h": "Ruta a ruta", "guides_p": "Las tarifas, las normas de equipaje, las conexiones y las alternativas por mar están en nuestras guías de rutas:",
  "news_h": "Últimas noticias sobre esto", "src_h": "Fuentes", "faq_h": "Preguntas frecuentes",
  "faq": [("¿Qué aeropuertos tiene Sumba?", "Dos. Tambolaka (TMC, aeropuerto Lede Kalumbang) da servicio a Sumba Occidental y Sumba Suroccidental. Waingapu (WGP, aeropuerto Umbu Mehang Kunda), a Sumba Oriental. Los separan cuatro o cinco horas de carretera."),
          ("¿Hay vuelos directos de Bali a Sumba?", "Sí, a los dos aeropuertos. Batik Air, Nam Air y Sriwijaya Air vuelan de Bali a Tambolaka en entre 1 hora y 1 hora y 15 minutos. TransNusa vuela de Bali a Waingapu sin escalas cuatro veces por semana (martes, miércoles, viernes y sábado) y Sriwijaya Air, dos o tres."),
          ("¿Hay vuelo directo de Yakarta a Sumba?", "No. Ninguna de las bases de datos de horarios que hemos consultado recoge un vuelo sin escalas de Yakarta a Tambolaka o Waingapu. Hay que hacer escala en Bali, o en Kupang, Surabaya o Lombok."),
          ("¿Cada cuánto se revisa esta página?", "Volvemos a abrir cada fuente y actualizamos la tabla cuando una ruta empieza, se suspende o cambia. La fecha de la última comprobación figura al principio de la página.")]},
 "id": {"title": "Penerbangan ke Sumba: rute dan maskapai terkini", "h1": "Penerbangan ke Sumba: rute dan maskapai terkini",
  "desc": "Semua rute berjadwal ke Tambolaka (TMC) dan Waingapu (WGP): kota asal, maskapai, frekuensi, dan lama terbang, lengkap dengan sumbernya.",
  "dek": "Semua rute penumpang berjadwal ke dua bandara di Sumba, Tambolaka di barat dan Waingapu di timur, beserta maskapai, frekuensi, lama terbang, dan halaman tempat kami memeriksanya.",
  "intro": "Sumba tidak dilayani penerbangan internasional. Anda tiba dengan penerbangan domestik dari Bali, Kupang, Lombok, Surabaya, atau Labuan Bajo, di salah satu dari dua bandara yang terpisah empat sampai lima jam perjalanan darat. Tentukan dulu bandaranya: Tambolaka untuk wilayah barat dan barat daya (Kodi, arena Pasola, kampung adat), Waingapu untuk wilayah timur (perbukitan sabana, kampung tenun ikat, pantai di sekitar kota).",
  "checked": "Terakhir diperiksa", "th": ["Asal", "Maskapai", "Frekuensi", "Lama terbang", "Sumber"], "to": "Penerbangan ke", "cap": "Jadwal dapat berubah tanpa pemberitahuan. Pastikan lagi di situs maskapai sebelum membayar.",
  "wings_h": "Yang berubah di rute Bali ke Tambolaka",
  "wings": "Wings Air, yang pada musim-musim sebelumnya melayani Bali ke Tambolaka dengan pesawat baling-baling, tidak tercantum di rute itu dalam basis data jadwal yang kami buka pada {d}. Yang tercatat adalah Batik Air, Nam Air, dan Sriwijaya Air, semuanya dengan pesawat jet. Wings Air masih terbang ke Tambolaka dari Kupang dan Labuan Bajo, serta ke Waingapu dari Kupang dan Lombok.",
  "guides_h": "Rute demi rute", "guides_p": "Harga tiket, aturan bagasi, koneksi, dan pilihan lewat laut ada di panduan rute kami:",
  "news_h": "Berita terbaru tentang ini", "src_h": "Sumber", "faq_h": "Pertanyaan yang sering diajukan",
  "faq": [("Sumba punya bandara apa saja?", "Dua. Tambolaka (TMC, Bandara Lede Kalumbang) melayani Sumba Barat dan Sumba Barat Daya. Waingapu (WGP, Bandara Umbu Mehang Kunda) melayani Sumba Timur. Keduanya terpisah empat sampai lima jam perjalanan darat."),
          ("Apakah ada penerbangan langsung dari Bali ke Sumba?", "Ada, ke kedua bandara. Batik Air, Nam Air, dan Sriwijaya Air terbang dari Bali ke Tambolaka sekitar 1 jam sampai 1 jam 15 menit. TransNusa terbang dari Bali ke Waingapu tanpa transit empat kali sepekan (Selasa, Rabu, Jumat, dan Sabtu), sedangkan Sriwijaya Air dua atau tiga kali sepekan."),
          ("Apakah ada penerbangan langsung dari Jakarta ke Sumba?", "Tidak ada. Basis data jadwal yang kami periksa tidak mencatat penerbangan tanpa transit dari Jakarta ke Tambolaka atau Waingapu. Anda perlu transit di Bali, atau di Kupang, Surabaya, atau Lombok."),
          ("Seberapa sering halaman ini diperiksa?", "Kami membuka lagi setiap sumber dan memperbarui tabel ketika ada rute yang dibuka, dihentikan, atau berubah. Tanggal pemeriksaan terakhir tercantum di bagian atas halaman.")]},
}
ROUTE_GUIDES = ["how-to-get-to-sumba-from-bali", "kupang-to-sumba", "labuan-bajo-to-sumba", "surabaya-to-sumba", "jakarta-to-sumba", "europe-to-sumba", "australia-to-sumba"]
FLIGHT_NEWS = ["new-direct-flights-bali-waingapu"]

def flights_page(g, l):
    t = F[l]; tpl = "/{l}/flights/"; chk = datetime.date.fromisoformat(CHECKED); chk_s = _date(g, chk, l)
    body = f'<h1>{t["h1"]}</h1><p class="dek">{t["dek"]}</p><p class="lv-upd">{t["checked"]}: <time datetime="{CHECKED}">{chk_s}</time></p><p>{t["intro"]}</p>'
    for ap in ("TMC", "WGP"):
        rows = ""
        for r in [x for x in FLIGHTS if x["to"] == ap]:
            gl = _item(g, GUIDE_OF.get(r["from"], ""))
            org = f'<a href="{g["url_of"](gl, l)}">{ORIGINS[r["from"]]}</a>' if gl else ORIGINS[r["from"]]
            rows += f'<tr><td>{org}</td><td>{esc(r["airline"])}</td><td>{esc(r["freq"][l])}<small>{esc(r["note"][l])}</small></td><td>{_dur(r["mins"], l)}</td><td><a href="{esc(r["source"])}" rel="noopener nofollow">{esc(r["src_name"])}</a><small>{chk_s}</small></td></tr>'
        body += f'<h2 id="{ap.lower()}">{t["to"]} {AIRPORTS[ap][l]}</h2><div class="tw" tabindex="0" role="region" aria-label="{esc(t["to"])} {ap}"><table class="lv"><caption>{t["cap"]}</caption><thead><tr>{"".join(f"<th scope=col>{h}</th>" for h in t["th"])}</tr></thead><tbody>{rows}</tbody></table></div>'
    body += f'<h2>{t["wings_h"]}</h2><p>{t["wings"].format(d=chk_s)}</p>'
    gl = "".join(f"<li>{x}</li>" for x in (_link(g, s, l) for s in ROUTE_GUIDES) if x)
    if gl: body += f'<h2>{t["guides_h"]}</h2><p>{t["guides_p"]}</p><ul>{gl}</ul>'
    nw = "".join(f"<li>{x}</li>" for x in (_link(g, s, l) for s in FLIGHT_NEWS) if x)
    if nw: body += f'<h2>{t["news_h"]}</h2><ul>{nw}</ul>'
    body += _faq_html(t["faq_h"], t["faq"])
    seen, src = set(), ""
    for n, u in [(f'{r["src_name"]}: {ORIGINS[r["from"]]} · {r["to"]}', r["source"]) for r in FLIGHTS] + MORE_SOURCES:
        if u in seen: continue
        seen.add(u); src += f'<li><a href="{esc(u)}" rel="noopener nofollow">{esc(n)}</a></li>'
    body += f'<div class="src"><b>{t["src_h"]}</b> ({t["checked"].lower()}: {chk_s})<ol>{src}</ol></div><div style="margin-top:26px">{g["subscribe"](l, False, "travel", "flights")}</div>'
    url = BASE + tpl.format(l=l)
    ld = [{"@context": "https://schema.org", "@type": "WebPage", "name": t["title"], "description": t["desc"], "inLanguage": l, "url": url, "dateModified": CHECKED,
           "about": [{"@type": "Airport", "name": "Lede Kalumbang Airport", "iataCode": "TMC"}, {"@type": "Airport", "name": "Umbu Mehang Kunda Airport", "iataCode": "WGP"}]},
          {"@context": "https://schema.org", "@type": "ItemList", "name": t["title"], "inLanguage": l, "numberOfItems": len(FLIGHTS), "itemListElement": [
              {"@type": "ListItem", "position": i + 1, "name": f'{ORIGINS[r["from"]]} · {AIRPORTS[r["to"]][l].split(",")[0]}: {r["airline"]}, {r["freq"][l]}, {_dur(r["mins"], l)}', "url": r["source"]} for i, r in enumerate(FLIGHTS)]},
          _faq_ld(l, t["faq"]), _bc(g, l, "travel", t["title"], tpl)]
    _page(g, l, tpl, "travel", t["title"], t["desc"], body, ld)

# =====================================================================================================================
# 2. EVENTS
# =====================================================================================================================
# "months": month-only events (exact days not announced): shown as a window, written to the .ics on the 1st with "(dates to be confirmed)".
# "dates": [(start, end)] inclusive ISO days, ONLY when officially confirmed and sourced: these get Event JSON-LD and real .ics days.
# "ics": False keeps an entry out of the calendar file (used for events we could not confirm are still held).
SRC_HOLIDAYS = ("Kalender 2027: 18 libur nasional dan 8 cuti bersama, Fortune Indonesia, 2 Nov 2026", "https://www.fortuneidn.com/news/kalender-2027-18-libur-nasional-dan-8-cuti-bersama-d7w02-00-fykp7-9dwpqy")
EVENTS = [
 {"id": "pasola-lamboya", "months": [2], "kind": "culture", "guide": "pasola-2027-dates",
  "name": {"en": "Pasola in Lamboya", "es": "Pasola de Lamboya", "id": "Pasola Lamboya"},
  "where": {"en": "Lamboya, West Sumba", "es": "Lamboya, Sumba Occidental", "id": "Lamboya, Sumba Barat"},
  "what": {"en": "Riders from rival villages charge and throw blunt wooden spears from horseback, a Marapu ritual tied to the rice cycle. The customary elders (Rato) fix the day a few weeks ahead. In 2026 it was held on 10 February at the Hobakalla field.",
           "es": "Jinetes de aldeas rivales cargan a caballo y se lanzan jabalinas de madera sin punta, en un ritual marapu ligado al ciclo del arroz. Los ancianos tradicionales (rato) fijan el día con pocas semanas de antelación. En 2026 se celebró el 10 de febrero en el campo de Hobakalla.",
           "id": "Para penunggang dari kampung yang berhadapan saling melempar lembing kayu tumpul dari atas kuda, ritual Marapu yang terkait dengan siklus padi. Para Rato menetapkan harinya beberapa pekan sebelumnya. Pada 2026 Pasola ini digelar 10 Februari di lapangan Hobakalla."},
  "sources": [("Pasola Lamboya di Sumba Barat kembali digelar 10 Februari, detikBali, 5 Feb 2026", "https://www.detik.com/bali/nusra/d-8341214/pasola-lamboya-di-sumba-barat-kembali-digelar-10-februari")]},
 {"id": "pasola-kodi", "months": [2, 3], "kind": "culture", "guide": "pasola-2027-dates",
  "name": {"en": "Pasola in Kodi", "es": "Pasola de Kodi", "id": "Pasola Kodi"},
  "where": {"en": "Kodi, Kodi Bangedo and Kodi Balaghar, Southwest Sumba", "es": "Kodi, Kodi Bangedo y Kodi Balaghar, Sumba Suroccidental", "id": "Kodi, Kodi Bangedo, dan Kodi Balaghar, Sumba Barat Daya"},
  "what": {"en": "The longest Pasola season on the island: six Pasola in two rounds of three days, one in February and one in March. In 2026 the first round began on 9 February and the second on 9 March.",
           "es": "La temporada de Pasola más larga de la isla: seis Pasola en dos tandas de tres días, una en febrero y otra en marzo. En 2026 la primera empezó el 9 de febrero y la segunda, el 9 de marzo.",
           "id": "Musim Pasola terpanjang di pulau ini: enam Pasola dalam dua putaran, masing-masing tiga hari, pada Februari dan Maret. Pada 2026 putaran pertama dimulai 9 Februari dan putaran kedua 9 Maret."},
  "sources": [("Jadwal Pasola Sumba Barat Daya Februari-Maret 2026, detikBali, 23 Jan 2026", "https://www.detik.com/bali/budaya/d-8319732/jadwal-pasola-sumba-barat-daya-februari-maret-2026-tradisi-perang-di-atas-kuda")]},
 {"id": "nyale", "months": [2, 3], "kind": "culture", "guide": "pasola-explained",
  "name": {"en": "Nyale, the sea worm ceremony", "es": "Nyale, la ceremonia de los gusanos marinos", "id": "Nyale, upacara cacing laut"},
  "where": {"en": "Beaches near the Pasola fields, West and Southwest Sumba", "es": "Playas cercanas a los campos del Pasola, Sumba Occidental y Suroccidental", "id": "Pantai di dekat arena Pasola, Sumba Barat dan Sumba Barat Daya"},
  "what": {"en": "At dawn on the day of each Pasola the Rato gather the nyale sea worms on the shore and read them as a forecast of the harvest. The Pasola only goes ahead once the worms have been found, which is why its date follows the moon.",
           "es": "Al amanecer del día de cada Pasola, los rato recogen en la orilla los gusanos marinos nyale y leen en ellos el augurio de la cosecha. El Pasola solo se celebra cuando aparecen los gusanos, y por eso su fecha depende de la luna.",
           "id": "Saat fajar pada hari Pasola, para Rato mengumpulkan cacing laut nyale di pantai dan membacanya sebagai pertanda panen. Pasola baru digelar setelah nyale ditemukan, dan karena itu tanggalnya mengikuti peredaran bulan."},
  "sources": [("Pasola Sumba Barat (event listing), Indonesia Travel, Ministry of Tourism", "https://www.indonesia.travel/gb/en/events/event-detail/pasola-sumba-barat")]},
 {"id": "pasola-wanokaka", "months": [3], "kind": "culture", "guide": "pasola-2027-dates",
  "name": {"en": "Pasola in Wanokaka", "es": "Pasola de Wanokaka", "id": "Pasola Wanokaka"},
  "where": {"en": "Wanokaka, West Sumba", "es": "Wanokaka, Sumba Occidental", "id": "Wanokaka, Sumba Barat"},
  "what": {"en": "One of the most visited Pasola, on a field near the beach south of Waikabubak. In 2026 it was held on 9 March and was stopped after a brawl among spectators, so keep your distance from the crowd.",
           "es": "Uno de los Pasola más concurridos, en un campo junto a la playa al sur de Waikabubak. En 2026 se celebró el 9 de marzo y se suspendió tras una pelea entre espectadores, así que conviene mantenerse a distancia de la multitud.",
           "id": "Salah satu Pasola yang paling ramai, di lapangan dekat pantai di selatan Waikabubak. Pada 2026 Pasola ini digelar 9 Maret dan dihentikan setelah terjadi keributan di antara penonton, jadi jagalah jarak dari kerumunan."},
  "sources": [("Dari atraksi budaya ke kepanikan: ritual adat Pasola Wanokaka berakhir oleh kericuhan, Waingapu.com, 9 Mar 2026", "https://www.waingapu.com/dari-atraksi-budaya-ke-kepanikan-ritual-adat-pasola-wanokaka-berakhir-oleh-kericuhan/")]},
 {"id": "pasola-gaura", "months": [3], "kind": "culture", "guide": "pasola-2027-dates",
  "name": {"en": "Pasola in Gaura", "es": "Pasola de Gaura", "id": "Pasola Gaura"},
  "where": {"en": "Gaura, West Sumba", "es": "Gaura, Sumba Occidental", "id": "Gaura, Sumba Barat"},
  "what": {"en": "Closes the Pasola season a few days after Wanokaka. In 2026 the main day was 14 March.",
           "es": "Cierra la temporada del Pasola unos días después de Wanokaka. En 2026 el día principal fue el 14 de marzo.",
           "id": "Menutup musim Pasola beberapa hari setelah Wanokaka. Pada 2026 hari utamanya jatuh pada 14 Maret."},
  "sources": [("Wagub Johni Asadoma minta tradisi Pasola Gaura di Sumba Barat terus dijaga, Swara Timor, 14 Mar 2026", "https://swaratimor.co.id/2026/03/14/wagub-johni-asadoma-minta-tradisi-pasola-gaura-di-sumba-barat-harus-terus-dijaga/")]},
 {"id": "idul-fitri", "dates": [("2027-03-10", "2027-03-11")], "kind": "holiday",
  "name": {"en": "Eid al-Fitr (Idul Fitri 1448 H)", "es": "Fin del Ramadán (Idul Fitri 1448 H)", "id": "Idul Fitri 1448 H"},
  "where": {"en": "All Indonesia", "es": "Toda Indonesia", "id": "Seluruh Indonesia"},
  "what": {"en": "National holiday, with collective leave on 9, 12 and 15 March 2027. In 2027 it falls in the middle of the Pasola weeks.",
           "es": "Festivo nacional, con días de permiso colectivo el 9, el 12 y el 15 de marzo de 2027. En 2027 cae en plenas semanas del Pasola.",
           "id": "Libur nasional, dengan cuti bersama pada 9, 12, dan 15 Maret 2027. Pada 2027 hari raya ini jatuh di tengah pekan-pekan Pasola."},
  "sources": [SRC_HOLIDAYS]},
 {"id": "good-friday", "dates": [("2027-03-26", "2027-03-26")], "kind": "holiday",
  "name": {"en": "Good Friday", "es": "Viernes Santo", "id": "Wafat Yesus Kristus (Jumat Agung)"},
  "where": {"en": "All Indonesia", "es": "Toda Indonesia", "id": "Seluruh Indonesia"},
  "what": {"en": "National holiday, with collective leave on Thursday 25 March 2027.", "es": "Festivo nacional, con permiso colectivo el jueves 25 de marzo de 2027.", "id": "Libur nasional, dengan cuti bersama pada Kamis, 25 Maret 2027."},
  "sources": [SRC_HOLIDAYS]},
 {"id": "easter", "dates": [("2027-03-28", "2027-03-28")], "kind": "holiday",
  "name": {"en": "Easter Sunday", "es": "Domingo de Pascua", "id": "Paskah (Kebangkitan Yesus Kristus)"},
  "where": {"en": "All Indonesia", "es": "Toda Indonesia", "id": "Seluruh Indonesia"},
  "what": {"en": "National holiday.", "es": "Festivo nacional.", "id": "Libur nasional."},
  "sources": [SRC_HOLIDAYS]},
 {"id": "ascension", "dates": [("2027-05-06", "2027-05-06")], "kind": "holiday",
  "name": {"en": "Ascension Day", "es": "Día de la Ascensión", "id": "Kenaikan Yesus Kristus"},
  "where": {"en": "All Indonesia", "es": "Toda Indonesia", "id": "Seluruh Indonesia"},
  "what": {"en": "National holiday.", "es": "Festivo nacional.", "id": "Libur nasional."},
  "sources": [SRC_HOLIDAYS]},
 {"id": "independence-day", "dates": [("2027-08-17", "2027-08-17")], "kind": "holiday",
  "name": {"en": "Indonesian Independence Day", "es": "Día de la Independencia de Indonesia", "id": "Hari Kemerdekaan Republik Indonesia"},
  "where": {"en": "All Indonesia", "es": "Toda Indonesia", "id": "Seluruh Indonesia"},
  "what": {"en": "National holiday every 17 August, marking the proclamation of independence in 1945.", "es": "Festivo nacional cada 17 de agosto, aniversario de la proclamación de la independencia en 1945.", "id": "Libur nasional setiap 17 Agustus, memperingati Proklamasi Kemerdekaan 1945."},
  "sources": [SRC_HOLIDAYS]},
 {"id": "west-sumba-arts-festival", "months": [8], "kind": "culture",
  "name": {"en": "West Sumba Cultural Arts Festival (Festival Seni Budaya Sumba Barat)", "es": "Festival de Artes y Cultura de Sumba Occidental (Festival Seni Budaya Sumba Barat)", "id": "Festival Seni Budaya Sumba Barat"},
  "where": {"en": "West Sumba", "es": "Sumba Occidental", "id": "Sumba Barat"},
  "what": {"en": "An annual festival of performances, traditional food, crafts and a bazaar, with free admission, according to the Ministry of Tourism listing. The 2026 edition ran from 25 to 29 August.",
           "es": "Festival anual con actuaciones, cocina tradicional, artesanía y un mercadillo, de entrada gratuita, según la ficha del Ministerio de Turismo. La edición de 2026 se celebró del 25 al 29 de agosto.",
           "id": "Festival tahunan berisi pertunjukan seni, kuliner tradisional, kerajinan, dan bazar, tanpa tiket masuk, menurut laman Kementerian Pariwisata. Edisi 2026 berlangsung 25 sampai 29 Agustus."},
  "sources": [("Festival Seni Budaya Sumba Barat 2026 (event listing), Indonesia Travel, Ministry of Tourism", "https://www.indonesia.travel/us-en/events/event-detail/festival-seni-budaya-sumba-barat-2026")]},
 {"id": "wulla-poddu", "months": [10, 11], "kind": "culture",
  "name": {"en": "Wulla Poddu, the sacred month", "es": "Wulla Poddu, el mes sagrado", "id": "Wulla Poddu, bulan suci"},
  "where": {"en": "West Sumba: Loli (Tambera, Tarung, Bondo Maroto, Gollu), Lamboya, Wanokaka and Tana Righu", "es": "Sumba Occidental: Loli (Tambera, Tarung, Bondo Maroto, Gollu), Lamboya, Wanokaka y Tana Righu", "id": "Sumba Barat: Loli (Tambera, Tarung, Bondo Maroto, Gollu), Lamboya, Wanokaka, dan Tana Righu"},
  "what": {"en": "The holy month of the Marapu faith, a long sequence of rituals in the traditional villages, usually around October and November. Work in the fields, funerals and parties are forbidden while it lasts. Its climax is Kalango Loddo, a night of dances and songs that runs into the morning.",
           "es": "El mes sagrado de la fe marapu, una larga sucesión de rituales en las aldeas tradicionales, por lo general entre octubre y noviembre. Mientras dura están prohibidos el trabajo en el campo, los funerales y las fiestas. Culmina con el Kalango Loddo, una noche de danzas y cantos que se alarga hasta la mañana.",
           "id": "Bulan suci penganut Marapu, berupa rangkaian panjang ritual di kampung-kampung adat, biasanya sekitar Oktober dan November. Selama berlangsung, warga pantang bekerja di ladang, menggelar pemakaman, dan berpesta. Puncaknya Kalango Loddo, malam tarian dan nyanyian yang berlanjut sampai pagi."},
  "sources": [("Wulla Poddu, ritual sakral masyarakat Sumba Barat, Good News From Indonesia, 10 Dec 2021", "https://www.goodnewsfromindonesia.id/2021/12/10/wulla-poddu-ritual-sakral-masyarakat-sumba-barat-untuk-mendekatkan-diri-dengan-tuhan")]},
 {"id": "christmas", "dates": [("2026-12-25", "2026-12-25"), ("2027-12-25", "2027-12-25")], "kind": "holiday",
  "name": {"en": "Christmas Day", "es": "Navidad", "id": "Hari Raya Natal"},
  "where": {"en": "All Indonesia", "es": "Toda Indonesia", "id": "Seluruh Indonesia"},
  "what": {"en": "National holiday every 25 December. In 2027 there is collective leave on Friday 24 December.", "es": "Festivo nacional cada 25 de diciembre. En 2027 hay permiso colectivo el viernes 24 de diciembre.", "id": "Libur nasional setiap 25 Desember. Pada 2027 ada cuti bersama pada Jumat, 24 Desember."},
  "sources": [SRC_HOLIDAYS]},
 {"id": "sandalwood-parade", "months": [7], "kind": "unconfirmed", "ics": False, "guide": "sumba-horses-sandalwood-pony",
  "name": {"en": "Sandalwood horse parade and ikat festival", "es": "Desfile de caballos sandalwood y festival del ikat", "id": "Parade Kuda Sandelwood dan Festival Tenun Ikat"},
  "where": {"en": "East Sumba (2019 edition)", "es": "Sumba Oriental (edición de 2019)", "id": "Sumba Timur (edisi 2019)"},
  "what": {"en": "A parade of hundreds of Sumba horses with an exhibition of ikat weaving, held in July in past years. The last edition we can document, in 2019, ran from 10 to 13 July, with the parade on 12 July from the Puru Kambera savanna to the beach. We have found no announcement of a recent edition, so do not plan a trip around it.",
           "es": "Un desfile de cientos de caballos de Sumba con una exposición de tejidos ikat, celebrado en julio en años anteriores. La última edición que hemos podido documentar, la de 2019, tuvo lugar del 10 al 13 de julio, con el desfile el día 12 desde la sabana de Puru Kambera hasta la playa. No hemos encontrado ningún anuncio de una edición reciente: no conviene organizar el viaje en torno a él.",
           "id": "Parade ratusan kuda Sumba yang disertai pameran tenun ikat, digelar pada Juli di tahun-tahun sebelumnya. Edisi terakhir yang dapat kami pastikan, tahun 2019, berlangsung 10 sampai 13 Juli, dengan parade pada 12 Juli dari sabana Puru Kambera menuju pantai. Kami tidak menemukan pengumuman edisi terbaru, jadi jangan menyusun perjalanan berdasarkan acara ini."},
  "sources": [("Sumba celebrates island's cultural, natural beauty with Sandalwood Festival, The Jakarta Post, 11 Jul 2019", "https://www.thejakartapost.com/travel/2019/07/11/sumba-celebrates-islands-cultural-natural-beauty-with-sandalwood-festival.html")]},
]

E = {
 "en": {"title": "Sumba events calendar", "h1": "Sumba events calendar: festivals, rituals and holidays",
  "desc": "What happens in Sumba and when: the Pasola in February and March, Nyale, Wulla Poddu, the West Sumba arts festival and the public holidays, with sources.",
  "dek": "The annual rituals, festivals and public holidays that matter to a visitor, month by month. Exact days appear only where an official source has confirmed them.",
  "intro": "Most of Sumba's big days are not fixed in a diary. The Pasola and Wulla Poddu belong to the Marapu faith, and the customary elders (Rato) set the days by the moon, usually only a few weeks ahead. For those we give the month and what happened last year, and we update this page when the dates are announced.",
  "ics": "Add to calendar (.ics)", "ics_p": "The calendar file has the confirmed days as all-day events. Events with no confirmed day sit on the first of their month, marked \"dates to be confirmed\".",
  "th": ["When", "Event", "Where"], "tbc": "dates to be confirmed", "unc": "not confirmed", "det": "Event by event", "src": "Source", "more": "Read more", "src_h": "Sources",
  "kinds": {"culture": "Ritual and culture", "holiday": "Public holiday", "unconfirmed": "Not confirmed"},
  "pasola": "Planning around the Pasola? Our {a} tracks every field and is updated as soon as the Rato announce the days."},
 "es": {"title": "Calendario de eventos de Sumba", "h1": "Calendario de eventos de Sumba: fiestas, rituales y festivos",
  "desc": "Qué se celebra en Sumba y cuándo: el Pasola en febrero y marzo, el Nyale, el Wulla Poddu, el festival de artes de Sumba Occidental y los festivos, con fuentes.",
  "dek": "Los rituales, las fiestas y los festivos que importan a quien visita la isla, mes a mes. Solo damos días exactos cuando una fuente oficial los ha confirmado.",
  "intro": "Casi ninguna de las grandes citas de Sumba tiene fecha fija en el calendario. El Pasola y el Wulla Poddu pertenecen a la fe marapu, y los ancianos tradicionales (rato) fijan los días según la luna, por lo general con pocas semanas de antelación. En esos casos indicamos el mes y lo que ocurrió el año anterior, y actualizamos esta página cuando se anuncian las fechas.",
  "ics": "Añadir al calendario (.ics)", "ics_p": "El archivo de calendario incluye los días confirmados como eventos de día completo. Los que aún no tienen día confirmado aparecen el primer día de su mes, con la nota \"dates to be confirmed\" (fechas por confirmar).",
  "th": ["Cuándo", "Evento", "Dónde"], "tbc": "fechas por confirmar", "unc": "sin confirmar", "det": "Evento a evento", "src": "Fuente", "more": "Leer más", "src_h": "Fuentes",
  "kinds": {"culture": "Ritual y cultura", "holiday": "Festivo", "unconfirmed": "Sin confirmar"},
  "pasola": "¿Vas a organizar el viaje en torno al Pasola? Nuestro {a} sigue cada campo y se actualiza en cuanto los rato anuncian los días."},
 "id": {"title": "Kalender acara Sumba", "h1": "Kalender acara Sumba: festival, ritual, dan hari libur",
  "desc": "Apa yang berlangsung di Sumba dan kapan: Pasola pada Februari dan Maret, Nyale, Wulla Poddu, Festival Seni Budaya Sumba Barat, dan hari libur nasional, lengkap dengan sumber.",
  "dek": "Ritual tahunan, festival, dan hari libur yang penting bagi pengunjung, bulan demi bulan. Tanggal pasti hanya kami cantumkan jika sudah dikonfirmasi sumber resmi.",
  "intro": "Sebagian besar hari besar di Sumba tidak punya tanggal tetap. Pasola dan Wulla Poddu adalah bagian dari kepercayaan Marapu, dan para Rato menetapkan harinya menurut peredaran bulan, biasanya hanya beberapa pekan sebelumnya. Untuk acara seperti itu kami mencantumkan bulannya dan apa yang terjadi tahun lalu, lalu memperbarui halaman ini begitu tanggalnya diumumkan.",
  "ics": "Tambahkan ke kalender (.ics)", "ics_p": "Berkas kalender memuat tanggal yang sudah pasti sebagai acara sehari penuh. Acara yang tanggalnya belum pasti ditaruh pada tanggal 1 bulan terkait dengan keterangan \"dates to be confirmed\" (tanggal menunggu konfirmasi).",
  "th": ["Kapan", "Acara", "Tempat"], "tbc": "tanggal menunggu konfirmasi", "unc": "belum terkonfirmasi", "det": "Acara demi acara", "src": "Sumber", "more": "Baca selengkapnya", "src_h": "Sumber",
  "kinds": {"culture": "Ritual dan budaya", "holiday": "Hari libur nasional", "unconfirmed": "Belum terkonfirmasi"},
  "pasola": "Ingin menyusun perjalanan mengikuti Pasola? {a} kami memantau setiap arena dan diperbarui begitu para Rato mengumumkan harinya."},
}
PASOLA_A = {"en": "Pasola calendar", "es": "calendario del Pasola", "id": "Kalender Pasola"}

def _d(s): return datetime.date.fromisoformat(s)
def _occurrences(e, today):
    """Upcoming occurrences of an event: [(start, end, exact)] sorted by start."""
    out = []
    for a, b in e.get("dates", []):
        if _d(b) >= today: out.append((_d(a), _d(b), True))
    first = today.replace(day=1)
    for m in e.get("months", []):
        d = datetime.date(today.year, m, 1)
        if d < first: d = datetime.date(today.year + 1, m, 1)
        out.append((d, d, False))
    return sorted(out)
def _range(g, a, b, l):
    if a == b: return _date(g, a, l)
    M = g["MONTHS"][l]
    if a.month == b.month and a.year == b.year:
        two = (b - a).days == 1
        return {"en": f"{a.day} {'and' if two else 'to'} {b.day} {M[a.month-1]} {a.year}", "es": f"{a.day} y {b.day} de {M[a.month-1]} de {a.year}" if two else f"del {a.day} al {b.day} de {M[a.month-1]} de {a.year}",
                "id": f"{a.day} {'dan' if two else 'sampai'} {b.day} {M[a.month-1]} {a.year}"}[l]
    return _date(g, a, l) + {"en": " to ", "es": " a ", "id": " sampai "}[l] + _date(g, b, l)
def _when(g, e, occ, l):
    t = E[l]; M = g["MONTHS"][l]
    if e.get("dates"): return "; ".join(_range(g, a, b, l) for a, b, x in occ if x)
    ms = [M[m - 1] for m in e["months"]]; j = {"en": " and ", "es": " y ", "id": " dan "}[l]
    lab = j.join(ms); lab = lab[0].upper() + lab[1:]
    return f'{lab} <small>({t["unc"] if e.get("kind") == "unconfirmed" else t["tbc"]})</small>'

def _ics_esc(s): return s.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")
def _fold(line):
    b = line.encode("utf-8"); out = []
    while len(b) > 73:
        cut = 73
        while (b[cut] & 0xC0) == 0x80: cut -= 1
        out.append(b[:cut].decode("utf-8")); b = b" " + b[cut:]
    out.append(b.decode("utf-8")); return "\r\n".join(out)
def events_ics(g):
    today = g["NOW"].date(); stamp = g["NOW"].astimezone(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//The Sumba Times//Sumba events calendar//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
         "X-WR-CALNAME:Sumba events (The Sumba Times)", "X-WR-TIMEZONE:Asia/Makassar", "X-PUBLISHED-TTL:P1D"]
    for e in EVENTS:
        if e.get("ics") is False: continue
        for a, b, exact in _occurrences(e, today):
            summ = e["name"]["en"] + ("" if exact else " (dates to be confirmed)")
            desc = e["what"]["en"] + ("" if exact else " The exact days are not announced yet: this entry only marks the month.") + " Source: " + e["sources"][0][1] + " More: " + BASE + "/en/events/"
            L += ["BEGIN:VEVENT", f'UID:{e["id"]}-{a.isoformat()}@thesumbatimes.com', f"DTSTAMP:{stamp}", f"DTSTART;VALUE=DATE:{a.strftime('%Y%m%d')}",
                  f"DTEND;VALUE=DATE:{(b + datetime.timedelta(days=1)).strftime('%Y%m%d')}", "SUMMARY:" + _ics_esc(summ), "LOCATION:" + _ics_esc(e["where"]["en"] + ", Sumba, Indonesia" if e["where"]["en"] != "All Indonesia" else "Indonesia"),
                  "DESCRIPTION:" + _ics_esc(desc), f"URL:{BASE}/en/events/#{e['id']}", "STATUS:" + ("CONFIRMED" if exact else "TENTATIVE"), "TRANSP:TRANSPARENT", "END:VEVENT"]
    L.append("END:VCALENDAR")
    g["write"]("/sumba-events.ics", "\r\n".join(_fold(x) for x in L) + "\r\n")

def events_page(g, l):
    t = E[l]; tpl = "/{l}/events/"; today = g["NOW"].date(); url = BASE + tpl.format(l=l)
    evs = []
    for e in EVENTS:
        occ = _occurrences(e, today)
        if occ: evs.append((occ[0][0], e, occ))
    evs.sort(key=lambda x: (x[0], x[1].get("kind") == "unconfirmed"))
    rows = "".join(f'<tr><td>{_when(g, e, occ, l)}</td><td><a href="#{e["id"]}">{esc(e["name"][l])}</a><small>{t["kinds"][e["kind"]]}</small></td><td>{esc(e["where"][l])}</td></tr>' for _, e, occ in evs)
    pa = _item(g, "pasola-2027-dates")
    body = f'<h1>{t["h1"]}</h1><p class="dek">{t["dek"]}</p><p class="lv-upd">{TS[l]["upd"]}: <time datetime="{today.isoformat()}">{_date(g, today, l)}</time></p><p>{t["intro"]}</p>'
    if pa: body += "<p>" + t["pasola"].format(a=f'<a href="{g["url_of"](pa, l)}">{PASOLA_A[l]}</a>') + "</p>"
    body += f'<p><a class="btnp" href="/sumba-events.ics" download>{t["ics"]}</a></p><p class="note">{t["ics_p"]}</p>'
    body += f'<div class="tw" tabindex="0" role="region" aria-label="{esc(t["title"])}"><table class="lv"><thead><tr>{"".join(f"<th scope=col>{h}</th>" for h in t["th"])}</tr></thead><tbody>{rows}</tbody></table></div><div class="lv-ev"><h2>{t["det"]}</h2>'
    for _, e, occ in evs:
        more = _link(g, e.get("guide", ""), l) if e.get("guide") else ""
        body += f'<h3 id="{e["id"]}">{esc(e["name"][l])}</h3><p class="k">{_when(g, e, occ, l)} · {esc(e["where"][l])}</p><p>{esc(e["what"][l])}{(" " + t["more"] + ": " + more + ".") if more else ""}</p>'
    seen, src = set(), ""
    for _, e, _o in evs:
        for n, u in e["sources"]:
            if u in seen: continue
            seen.add(u); src += f'<li><a href="{esc(u)}" rel="noopener nofollow">{esc(n)}</a></li>'
    body += f'</div><div class="src"><b>{t["src_h"]}</b><ol>{src}</ol></div><div style="margin-top:26px">{g["subscribe"](l, False, "pasola", "events")}</div>'
    ld = [{"@context": "https://schema.org", "@type": "WebPage", "name": t["title"], "description": t["desc"], "inLanguage": l, "url": url, "dateModified": g["NOW"].isoformat()},
          _bc(g, l, "culture", t["title"], tpl)]
    for _, e, occ in evs:      # Event JSON-LD only for officially confirmed exact dates
        for a, b, exact in occ:
            if not exact: continue
            ld.append({"@context": "https://schema.org", "@type": "Event", "name": e["name"][l], "description": e["what"][l], "inLanguage": l, "startDate": a.isoformat(), "endDate": b.isoformat(),
                       "eventStatus": "https://schema.org/EventScheduled", "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode", "isAccessibleForFree": True, "url": f'{url}#{e["id"]}',
                       "location": {"@type": "Place", "name": "Sumba" if e["where"]["en"] == "All Indonesia" else e["where"][l], "address": {"@type": "PostalAddress", "addressRegion": "East Nusa Tenggara", "addressCountry": "ID"}}})
    _page(g, l, tpl, "culture", t["title"], t["desc"], body, ld)

# =====================================================================================================================
# 3. TRAVEL STATUS (generated from the news briefs on every build)
# =====================================================================================================================
DAYS = 30
GROUPS = [   # order = priority when a brief scores the same in two groups; keywords are matched on the English slug, keywords and title
 ("transport", r"flights?|airline|airport|non-stop|route|ferr(?:y|ies)|port|ship|pelni|asdp|roads?|bridge|fuel|petrol|pertalite|pertamina|driving|queues?"),
 ("weather", r"weather|rain(?:s|y)?|season|el-?ni[nñ]o|la-?ni[nñ]a|drought|storm|cyclone|winds?|waves?|swell|tides?|floods?|heat|bmkg|sea"),
 ("safety", r"safe|safety|earthquake|tsunami|quake|police|drugs?|crime|theft|brawl|clash|riot|malaria|dengue|rabies|health|hospital|clinic|outbreak|crocodile|landslide|fire|warning"),
]
OFFICIAL = [
 ("BMKG", {"en": "weather, wave and earthquake warnings from Indonesia's meteorological agency", "es": "avisos de tiempo, oleaje y terremotos de la agencia meteorológica indonesia", "id": "peringatan cuaca, gelombang, dan gempa bumi"}, "https://www.bmkg.go.id/"),
 ("BNPB", {"en": "Indonesia's national disaster management agency", "es": "la agencia nacional indonesia de gestión de desastres", "id": "Badan Nasional Penanggulangan Bencana"}, "https://bnpb.go.id/"),
 ("UK FCDO", {"en": "United Kingdom travel advice for Indonesia", "es": "recomendaciones de viaje del Reino Unido para Indonesia", "id": "saran perjalanan pemerintah Inggris untuk Indonesia"}, "https://www.gov.uk/foreign-travel-advice/indonesia"),
 ("US State Department", {"en": "United States travel advisory for Indonesia", "es": "aviso de viaje de Estados Unidos para Indonesia", "id": "imbauan perjalanan pemerintah Amerika Serikat untuk Indonesia"}, "https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories/indonesia-travel-advisory.html"),
 ("Ministerio de Asuntos Exteriores (España)", {"en": "Spain's travel recommendations for Indonesia", "es": "recomendaciones de viaje de España para Indonesia", "id": "rekomendasi perjalanan pemerintah Spanyol untuk Indonesia"}, "https://www.exteriores.gob.es/es/ServiciosAlCiudadano/Paginas/Detalle-recomendaciones-de-viaje.aspx?trc=Indonesia"),
]
TS = {
 "en": {"title": "Sumba travel status today: is it safe to travel now?", "h1": "Sumba travel status today: is it safe to travel now?",
  "desc": "What is affecting travel in Sumba right now: flights, ferries, roads and fuel, weather and sea, safety and health, from our news desk in the last 30 days.",
  "dek": "What our news desk has reported in the last 30 days that affects a trip to Sumba, grouped by transport, weather and safety. Rebuilt with every edition.",
  "upd": "Updated", "sum_h": "In short", "none_all": "We have published no travel alerts for Sumba in the last 30 days. That is not a guarantee: check the official links below before you travel.",
  "g": {"transport": "Transport: flights, ferries, roads and fuel", "weather": "Weather and sea", "safety": "Safety and health"},
  "gs": {"transport": "Transport", "weather": "Weather and sea", "safety": "Safety and health"},
  "none": "No alerts in the last 30 days.", "off_h": "Official sources to check before you travel",
  "off_p": "This page only summarises what The Sumba Times has published. For warnings in real time and for your government's advice, go to the source:",
  "safe": "For the standing risks (malaria, roads, sea, earthquakes) and how to prepare, read our {a}.", "safe_a": "Sumba safety and health guide",
  "how": "How this page works", "how_p": "It is generated automatically from our news stories of the last 30 days. It adds nothing that is not in those stories, and it does not replace official advice.",
  "faq_h": "Frequently asked questions",
  "q": {"safety": "Is it safe to travel to Sumba right now?", "transport": "Are flights, ferries and fuel normal in Sumba?", "weather": "What is the weather and the sea like in Sumba now?"},
  "a_none": {"safety": "The Sumba Times has published no safety or health alerts for Sumba in the 30 days to {d}. Check your government's travel advice and BMKG warnings before you go.",
             "transport": "The Sumba Times has published no transport alerts for Sumba in the 30 days to {d}. Confirm your flight or ferry with the operator before you travel.",
             "weather": "The Sumba Times has published no weather or sea alerts for Sumba in the 30 days to {d}. Check BMKG for the current forecast and warnings."},
  "a_pre": "Latest report, {d}: "},
 "es": {"title": "Situación en Sumba hoy: ¿es seguro viajar ahora?", "h1": "Situación en Sumba hoy: ¿es seguro viajar ahora?",
  "desc": "Qué afecta ahora a un viaje a Sumba: vuelos, ferris, carreteras y combustible, tiempo y mar, seguridad y salud, según nuestras noticias de los últimos 30 días.",
  "dek": "Lo que nuestra redacción ha publicado en los últimos 30 días y afecta a un viaje a Sumba, agrupado en transporte, tiempo y seguridad. Se rehace con cada edición.",
  "upd": "Actualizado", "sum_h": "En resumen", "none_all": "No hemos publicado ninguna alerta de viaje sobre Sumba en los últimos 30 días. No es una garantía: consulta los enlaces oficiales antes de viajar.",
  "g": {"transport": "Transporte: vuelos, ferris, carreteras y combustible", "weather": "Tiempo y estado del mar", "safety": "Seguridad y salud"},
  "gs": {"transport": "Transporte", "weather": "Tiempo y mar", "safety": "Seguridad y salud"},
  "none": "Sin alertas en los últimos 30 días.", "off_h": "Fuentes oficiales que conviene consultar antes de viajar",
  "off_p": "Esta página solo resume lo que ha publicado The Sumba Times. Para los avisos en tiempo real y las recomendaciones de tu Gobierno, acude a la fuente:",
  "safe": "Sobre los riesgos permanentes (malaria, carreteras, mar, terremotos) y cómo prepararse, lee nuestra {a}.", "safe_a": "guía de seguridad y salud en Sumba",
  "how": "Cómo funciona esta página", "how_p": "Se genera de forma automática a partir de nuestras noticias de los últimos 30 días. No añade nada que no esté en ellas ni sustituye a las recomendaciones oficiales.",
  "faq_h": "Preguntas frecuentes",
  "q": {"safety": "¿Es seguro viajar a Sumba ahora mismo?", "transport": "¿Funcionan con normalidad los vuelos, los ferris y el suministro de combustible en Sumba?", "weather": "¿Qué tiempo hace y cómo está el mar en Sumba ahora?"},
  "a_none": {"safety": "The Sumba Times no ha publicado ninguna alerta de seguridad o salud sobre Sumba en los 30 días anteriores al {d}. Consulta las recomendaciones de viaje de tu Gobierno y los avisos de la BMKG antes de salir.",
             "transport": "The Sumba Times no ha publicado ninguna alerta de transporte sobre Sumba en los 30 días anteriores al {d}. Confirma tu vuelo o tu ferri con la compañía antes de viajar.",
             "weather": "The Sumba Times no ha publicado ninguna alerta meteorológica o marítima sobre Sumba en los 30 días anteriores al {d}. Consulta la previsión y los avisos vigentes de la BMKG."},
  "a_pre": "Última información, {d}: "},
 "id": {"title": "Kondisi perjalanan Sumba hari ini: amankah bepergian sekarang?", "h1": "Kondisi perjalanan Sumba hari ini: amankah bepergian sekarang?",
  "desc": "Hal yang sedang memengaruhi perjalanan ke Sumba: penerbangan, feri, jalan, dan BBM, cuaca dan laut, keamanan dan kesehatan, dari pemberitaan kami 30 hari terakhir.",
  "dek": "Rangkuman pemberitaan redaksi kami dalam 30 hari terakhir yang berpengaruh pada perjalanan ke Sumba, dikelompokkan menjadi transportasi, cuaca, dan keamanan. Disusun ulang pada setiap edisi.",
  "upd": "Diperbarui", "sum_h": "Singkatnya", "none_all": "Kami tidak menerbitkan peringatan perjalanan tentang Sumba dalam 30 hari terakhir. Ini bukan jaminan: periksa tautan resmi di bawah sebelum berangkat.",
  "g": {"transport": "Transportasi: penerbangan, feri, jalan, dan BBM", "weather": "Cuaca dan laut", "safety": "Keamanan dan kesehatan"},
  "gs": {"transport": "Transportasi", "weather": "Cuaca dan laut", "safety": "Keamanan dan kesehatan"},
  "none": "Tidak ada peringatan dalam 30 hari terakhir.", "off_h": "Sumber resmi yang perlu diperiksa sebelum berangkat",
  "off_p": "Halaman ini hanya merangkum pemberitaan The Sumba Times. Untuk peringatan terkini dan imbauan pemerintah, bukalah sumbernya langsung:",
  "safe": "Untuk risiko yang selalu ada (malaria, jalan, laut, gempa bumi) dan cara mempersiapkan diri, baca {a} kami.", "safe_a": "panduan keamanan dan kesehatan di Sumba",
  "how": "Cara kerja halaman ini", "how_p": "Halaman ini disusun otomatis dari berita kami selama 30 hari terakhir. Isinya tidak menambahkan apa pun di luar berita tersebut dan tidak menggantikan imbauan resmi.",
  "faq_h": "Pertanyaan yang sering diajukan",
  "q": {"safety": "Apakah aman bepergian ke Sumba saat ini?", "transport": "Apakah penerbangan, feri, dan pasokan BBM di Sumba berjalan normal?", "weather": "Bagaimana cuaca dan kondisi laut di Sumba sekarang?"},
  "a_none": {"safety": "The Sumba Times tidak menerbitkan peringatan keamanan atau kesehatan tentang Sumba dalam 30 hari hingga {d}. Periksa imbauan perjalanan pemerintah dan peringatan BMKG sebelum berangkat.",
             "transport": "The Sumba Times tidak menerbitkan peringatan transportasi tentang Sumba dalam 30 hari hingga {d}. Pastikan jadwal penerbangan atau feri Anda kepada operator sebelum berangkat.",
             "weather": "The Sumba Times tidak menerbitkan peringatan cuaca atau laut tentang Sumba dalam 30 hari hingga {d}. Periksa prakiraan dan peringatan terkini dari BMKG."},
  "a_pre": "Laporan terakhir, {d}: "},
}

def _txt(h): return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", h or ""))).strip()
def _first(s):
    """First sentence of a text (a full stop followed by a space and a capital, so 6.1 and 2,500 are safe)."""
    m = re.search(r"^(.+?[.!?])(?=\s+[A-ZÁÉÍÓÚÑ¿¡])", s)
    return m.group(1) if m else s
def classify(a):
    """Return the group id of a news brief, or None if it is not travel-relevant."""
    kw = a.get("keywords") or {}; kw = kw.get("en", []) if isinstance(kw, dict) else kw
    hay = " ".join([a["slug"].replace("-", " "), " ".join(kw), _txt(a["en"]["title"])]).lower()
    best, score = None, 0
    for gid, rx in GROUPS:
        n = len(set(re.findall(r"\b(?:" + rx + r")\b", hay)))
        if n > score: best, score = gid, n
    return best
def status_groups(g):
    NOW = g["NOW"]; out = {gid: [] for gid, _ in GROUPS}
    for a in g["all_items"]():       # newest first
        if g["kind_of"](a) != "brief": continue
        age = (NOW - g["dt"](a)).days
        if age < 0 or age > DAYS: continue
        gid = classify(a)
        if gid and len(out[gid]) < 4: out[gid].append(a)
    return out

def status_page(g, l):
    t = TS[l]; tpl = "/{l}/travel-status/"; NOW = g["NOW"]; url = BASE + tpl.format(l=l); grp = status_groups(g)
    stamp = _date(g, NOW.date(), l) + ", " + (NOW.strftime("%H.%M") if l == "id" else NOW.strftime("%H:%M")) + " WITA"
    ans = lambda a: _txt(a[l].get("answer") or a[l].get("dek") or "")
    parts = [f'<b>{t["gs"][gid]}:</b> {esc(_first(ans(grp[gid][0])))}' for gid, _ in GROUPS if grp[gid] and ans(grp[gid][0])]
    summary = " ".join(parts) if parts else t["none_all"]
    body = f'<h1>{t["h1"]}</h1><p class="dek">{t["dek"]}</p><p class="lv-upd">{t["upd"]}: <time datetime="{NOW.isoformat()}">{stamp}</time></p><h2>{t["sum_h"]}</h2><p id="status-summary">{summary}</p>'
    for gid, _ in GROUPS:
        body += f'<section class="lv-g" id="{gid}"><h2>{t["g"][gid]}</h2>'
        if grp[gid]:
            body += "<ul>" + "".join(f'<li><time datetime="{g["dt"](a).isoformat()}">{g["fdate"](a, l, False)}</time><a href="{g["url_of"](a, l)}">{esc(_txt(a[l]["title"]))}</a><p>{esc(ans(a))}</p></li>' for a in grp[gid]) + "</ul>"
        else: body += f'<p class="lv-ok">{t["none"]}</p>'
        body += "</section>"
    off = "".join(f'<li><a href="{esc(u)}" rel="noopener">{esc(n)}</a>: {d[l]}</li>' for n, d, u in OFFICIAL)
    sg = _link(g, "sumba-travel-safety-health", l, t["safe_a"])
    body += f'<h2>{t["off_h"]}</h2><p>{t["off_p"]}</p><ul>{off}</ul>' + (f'<p>{t["safe"].format(a=sg)}</p>' if sg else "")
    faq = []
    for gid in ("safety", "transport", "weather"):
        if grp[gid] and ans(grp[gid][0]): a = grp[gid][0]; faq.append((t["q"][gid], t["a_pre"].format(d=g["fdate"](a, l, False)) + ans(a)))
        else: faq.append((t["q"][gid], t["a_none"][gid].format(d=_date(g, NOW.date(), l))))
    body += _faq_html(t["faq_h"], faq) + f'<h2>{t["how"]}</h2><p class="note">{t["how_p"]}</p><div style="margin-top:26px">{g["subscribe"](l, False, "travel", "travel-status")}</div>'
    ld = [{"@context": "https://schema.org", "@type": "WebPage", "name": t["title"], "description": t["desc"], "inLanguage": l, "url": url, "dateModified": NOW.isoformat(),
           "speakable": {"@type": "SpeakableSpecification", "cssSelector": ["#status-summary"]},
           "hasPart": [{"@type": "NewsArticle", "headline": _txt(a[l]["title"]), "datePublished": g["dt"](a).isoformat(), "url": BASE + g["url_of"](a, l)} for gid, _ in GROUPS for a in grp[gid]]},
          _faq_ld(l, faq), _bc(g, l, "news", t["title"], tpl)]
    _page(g, l, tpl, "news", t["title"], t["desc"], body, ld)

def build(g):
    for l in g["LANGS"]:
        flights_page(g, l); events_page(g, l); status_page(g, l)
    events_ics(g)
