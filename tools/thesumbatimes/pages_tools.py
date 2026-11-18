# -*- coding: utf-8 -*-
"""Tools and tables built from data the site already holds (18 Nov 2026):
  /LANG/attractions/  every place page in one table: type, regency, entrance fee and best time (the 'facts' rows of each place page,
                      sourced there) plus road distance from the nearer airport. Also /data/sumba-entrance-fees.csv
  /LANG/rain/         "will it rain on my dates": share of days with rain per month and coast (pages_months.MONTHS, ERA5 2015-2024)
  /LANG/tools/        hub of every tool + two small calculators: fuel for a drive and the per-person share of a car with driver
                      (defaults are the prices sourced in the guide car-with-driver-in-sumba; every field can be changed)
Nothing here states a new fact: tables read the place pages, the month table and the car guide."""
import html, json, csv, io, re, calendar
import pages_hubs, pages_geo, pages_months

def esc(s): return html.escape(str(s), quote=True)
ENTRY_K = {"en": ("Entry",), "es": ("Entrada",), "id": ("Tiket", "Tiket masuk")}
BEST_K = {"en": ("Best time",), "es": ("Mejor momento", "Mejor época"), "id": ("Waktu terbaik",)}
def fact(a, l, keys):
    for k, v in (a.get("facts") or {}).get(l) or []:
        if k in keys: return v
    return ""
FUEL = {"pertalite": 10000, "pertamax": 15950}   # IDR per litre, Nov 2026, as sourced in the guide car-with-driver-in-sumba
CAR_DAY = (600000, 1000000)                      # IDR per day with driver, travel guides 2025-2026, same guide

S = {
 "en": {"a_title": "Sumba attractions: full list with entrance fees and distances", "a_h1": "Sumba attractions: the full list with entrance fees",
        "a_desc": "{n} beaches, waterfalls, traditional villages, hills and towns in Sumba in one table: entrance fee or donation, best time to visit and road distance from the nearest airport.",
        "a_lead": "This table lists the {n} places in Sumba that have their own page in The Sumba Times, grouped by regency from west to east. The entrance fee and the best time come from each place page, where the source and the date of every figure are given. Fees in Sumba are often a donation written in a guest book in a traditional village or a small ticket and parking charge at a beach, and they change without notice: carry small notes.",
        "place": "Place", "type": "Type", "entry": "Entrance fee", "best": "Best time", "dist": "From the nearer airport", "see": "Details and sources on each place page.", "dl": "Download this table (CSV)", "crumb": "Attractions",
        "r_title": "Will it rain in Sumba on my dates? Rain chance by month", "r_h1": "Will it rain in Sumba on my dates?", "r_desc": "Pick your dates and coast: the share of days with rain in Sumba for each month, west and east, from ten years of climate data (2015-2024).",
        "r_lead": "Sumba has a dry season from about May to October and a wet season from about November to April, and the east is drier than the west. Enter your dates to see how many days with rain a typical year brings.",
        "r_from": "Arrival", "r_nights": "Nights", "r_coast": "Coast", "r_w": "West (Tambolaka)", "r_e": "East (Waingapu)",
        "r_res": "In a typical year, about {d} of your {n} days have at least 1 mm of rain ({p} %). {m}", "r_month": "{m}: rain on about {d} of {t} days, {mm} mm in the month.",
        "r_tab": "Share of days with rain, month by month", "r_mo": "Month", "r_note": "A day with rain here is a day with 1 mm or more in the ERA5 climate model for 2015-2024, computed by The Sumba Times. The model counts many days of light rain and reads wetter than the Waingapu weather station, so use it to compare months and coasts, not as a forecast. Tropical rain often falls in short heavy showers with sun before and after.",
        "r_more": "Sumba month by month", "r_crumb": "Rain by dates",
        "t_title": "Sumba trip tools: calculators, maps, flights and data", "t_h1": "Tools to plan a trip to Sumba", "t_desc": "Every free tool of The Sumba Times in one page: trip planner, budget, distances, rain by dates, fuel and car-share calculators, flights, events, map and open data.",
        "t_lead": "Free tools built on the data we publish. None needs an account.", "t_all": "All tools", "t_fuel": "Fuel for a drive", "t_km": "Distance (km)", "t_cons": "Consumption (litres per 100 km)", "t_price": "Fuel price (IDR per litre)",
        "t_fuel_res": "{l} litres, about IDR {c}.", "t_fuel_note": "Prices preset: Pertalite IDR {a} and Pertamax IDR {b} per litre in November 2026, as sourced in our car guide. The consumption figures are examples (a small car and a scooter): replace them with your vehicle's. Fuel stations are in the towns; fill up before long drives.",
        "t_car": "Car with driver: cost per person", "t_day": "Price per day (IDR)", "t_days": "Days", "t_people": "People", "t_car_res": "Total IDR {t}: IDR {p} per person, IDR {d} per person per day.",
        "t_car_note": "Preset: the middle of the IDR {a} to {b} a day that travel guides quoted in 2025-2026 (see our car guide). Ask in writing whether fuel, the driver's meals and his room are included.",
        "t_ex_car": "small car", "t_ex_sc": "scooter", "crumb": "Tools", "kicker": "Tools"},
 "es": {"a_title": "Qué ver en Sumba: lista completa con entradas y distancias", "a_h1": "Qué ver en Sumba: la lista completa con el precio de las entradas",
        "a_desc": "{n} playas, cascadas, aldeas tradicionales, colinas y ciudades de Sumba en una tabla: entrada o donativo, mejor momento para ir y distancia por carretera desde el aeropuerto más cercano.",
        "a_lead": "Esta tabla recoge los {n} lugares de Sumba que tienen ficha propia en The Sumba Times, agrupados por regencia de oeste a este. La entrada y el mejor momento salen de cada ficha, donde figuran la fuente y la fecha de cada cifra. En Sumba la entrada suele ser un donativo que se apunta en un libro de visitas en las aldeas tradicionales, o un pequeño tique y aparcamiento en las playas, y cambia sin aviso: lleva billetes pequeños.",
        "place": "Lugar", "type": "Tipo", "entry": "Entrada", "best": "Mejor momento", "dist": "Desde el aeropuerto más cercano", "see": "Detalles y fuentes en la ficha de cada lugar.", "dl": "Descargar esta tabla (CSV)", "crumb": "Qué ver",
        "r_title": "¿Lloverá en Sumba en mis fechas? Probabilidad de lluvia por mes", "r_h1": "¿Lloverá en Sumba en mis fechas?", "r_desc": "Elige tus fechas y la costa: proporción de días con lluvia en Sumba cada mes, oeste y este, con diez años de datos climáticos (2015-2024).",
        "r_lead": "Sumba tiene una estación seca de mayo a octubre, más o menos, y una húmeda de noviembre a abril, y el este es más seco que el oeste. Introduce tus fechas para ver cuántos días con lluvia trae un año normal.",
        "r_from": "Llegada", "r_nights": "Noches", "r_coast": "Costa", "r_w": "Oeste (Tambolaka)", "r_e": "Este (Waingapu)",
        "r_res": "En un año normal, unos {d} de tus {n} días tienen al menos 1 mm de lluvia ({p} %). {m}", "r_month": "{m}: lluvia en unos {d} de {t} días, {mm} mm en el mes.",
        "r_tab": "Proporción de días con lluvia, mes a mes", "r_mo": "Mes", "r_note": "Aquí un día con lluvia es un día con 1 mm o más en el modelo climático ERA5 de 2015-2024, calculado por The Sumba Times. El modelo cuenta muchos días de lluvia débil y da más lluvia que la estación meteorológica de Waingapu, así que sirve para comparar meses y costas, no como previsión. La lluvia tropical suele caer en chaparrones cortos e intensos, con sol antes y después.",
        "r_more": "Sumba mes a mes", "r_crumb": "Lluvia por fechas",
        "t_title": "Herramientas para viajar a Sumba: calculadoras, mapas, vuelos y datos", "t_h1": "Herramientas para planificar un viaje a Sumba", "t_desc": "Todas las herramientas gratuitas de The Sumba Times en una página: planificador, presupuesto, distancias, lluvia por fechas, gasolina, coche compartido, vuelos, eventos, mapa y datos abiertos.",
        "t_lead": "Herramientas gratuitas hechas con los datos que publicamos. Ninguna pide cuenta.", "t_all": "Todas las herramientas", "t_fuel": "Gasolina para un trayecto", "t_km": "Distancia (km)", "t_cons": "Consumo (litros cada 100 km)", "t_price": "Precio del combustible (IDR por litro)",
        "t_fuel_res": "{l} litros, unas {c} IDR.", "t_fuel_note": "Precios preestablecidos: Pertalite {a} IDR y Pertamax {b} IDR por litro en noviembre de 2026, con la fuente en nuestra guía del coche con conductor. Los consumos son ejemplos (un coche pequeño y una moto): cámbialos por los de tu vehículo. Las gasolineras están en las ciudades; llena el depósito antes de los trayectos largos.",
        "t_car": "Coche con conductor: coste por persona", "t_day": "Precio por día (IDR)", "t_days": "Días", "t_people": "Personas", "t_car_res": "Total {t} IDR: {p} IDR por persona, {d} IDR por persona y día.",
        "t_car_note": "Valor preestablecido: el punto medio de las {a} a {b} IDR al día que citaban las guías de viaje en 2025-2026 (ver nuestra guía del coche). Pide por escrito si incluye el combustible, las comidas del conductor y su habitación.",
        "t_ex_car": "coche pequeño", "t_ex_sc": "moto", "crumb": "Herramientas", "kicker": "Herramientas"},
 "id": {"a_title": "Tempat wisata di Sumba: daftar lengkap, tiket masuk, dan jarak", "a_h1": "Tempat wisata di Sumba: daftar lengkap dengan harga tiket masuk",
        "a_desc": "{n} pantai, air terjun, kampung adat, bukit, dan kota di Sumba dalam satu tabel: tiket masuk atau donasi, waktu terbaik berkunjung, dan jarak lewat jalan dari bandara terdekat.",
        "a_lead": "Tabel ini memuat {n} tempat wisata di Sumba yang punya halaman sendiri di The Sumba Times, dikelompokkan per kabupaten dari barat ke timur. Harga tiket dan waktu terbaik diambil dari halaman tiap tempat, lengkap dengan sumber dan tanggal setiap angka di sana. Di Sumba, biaya masuk sering berupa donasi yang dicatat di buku tamu kampung adat, atau karcis kecil dan parkir di pantai, dan bisa berubah tanpa pemberitahuan: bawalah uang pecahan kecil.",
        "place": "Tempat", "type": "Jenis", "entry": "Tiket masuk", "best": "Waktu terbaik", "dist": "Dari bandara terdekat", "see": "Rincian dan sumber ada di halaman tiap tempat.", "dl": "Unduh tabel ini (CSV)", "crumb": "Tempat wisata",
        "r_title": "Apakah akan hujan di Sumba pada tanggal saya? Peluang hujan per bulan", "r_h1": "Apakah akan hujan di Sumba pada tanggal saya?", "r_desc": "Pilih tanggal dan pesisir: porsi hari hujan di Sumba setiap bulan, barat dan timur, dari data iklim sepuluh tahun (2015-2024).",
        "r_lead": "Sumba mengalami musim kemarau kira-kira Mei sampai Oktober dan musim hujan kira-kira November sampai April, dan bagian timur lebih kering daripada barat. Masukkan tanggal Anda untuk melihat berapa hari hujan pada tahun yang normal.",
        "r_from": "Tiba", "r_nights": "Malam", "r_coast": "Pesisir", "r_w": "Barat (Tambolaka)", "r_e": "Timur (Waingapu)",
        "r_res": "Pada tahun yang normal, sekitar {d} dari {n} hari Anda mengalami hujan minimal 1 mm ({p} %). {m}", "r_month": "{m}: hujan pada sekitar {d} dari {t} hari, {mm} mm sebulan.",
        "r_tab": "Porsi hari hujan dari bulan ke bulan", "r_mo": "Bulan", "r_note": "Hari hujan di sini adalah hari dengan curah hujan 1 mm atau lebih menurut model iklim ERA5 tahun 2015-2024, diolah oleh The Sumba Times. Model ini menghitung banyak hari hujan ringan dan lebih basah daripada catatan stasiun cuaca Waingapu, jadi gunakan untuk membandingkan bulan dan pesisir, bukan sebagai prakiraan. Hujan tropis sering turun singkat dan deras, dengan matahari sebelum dan sesudahnya.",
        "r_more": "Sumba dari bulan ke bulan", "r_crumb": "Hujan per tanggal",
        "t_title": "Alat bantu liburan ke Sumba: kalkulator, peta, penerbangan, dan data", "t_h1": "Alat bantu merencanakan perjalanan ke Sumba", "t_desc": "Semua alat gratis The Sumba Times dalam satu halaman: perencana perjalanan, anggaran, jarak, hujan per tanggal, kalkulator bensin dan patungan mobil, penerbangan, acara, peta, dan data terbuka.",
        "t_lead": "Alat gratis yang dibuat dari data yang kami terbitkan. Tidak perlu akun.", "t_all": "Semua alat", "t_fuel": "Bensin untuk satu perjalanan", "t_km": "Jarak (km)", "t_cons": "Konsumsi (liter per 100 km)", "t_price": "Harga BBM (Rp per liter)",
        "t_fuel_res": "{l} liter, sekitar Rp{c}.", "t_fuel_note": "Harga bawaan: Pertalite Rp{a} dan Pertamax Rp{b} per liter pada November 2026, dengan sumber di panduan sewa mobil kami. Angka konsumsi hanyalah contoh (mobil kecil dan sepeda motor): ganti dengan angka kendaraan Anda. SPBU ada di kota; isi penuh sebelum perjalanan jauh.",
        "t_car": "Mobil dengan sopir: biaya per orang", "t_day": "Harga per hari (Rp)", "t_days": "Hari", "t_people": "Orang", "t_car_res": "Total Rp{t}: Rp{p} per orang, Rp{d} per orang per hari.",
        "t_car_note": "Angka bawaan: nilai tengah dari Rp{a} sampai Rp{b} per hari yang disebut panduan wisata pada 2025-2026 (lihat panduan sewa mobil kami). Minta kepastian tertulis apakah BBM, makan sopir, dan penginapannya sudah termasuk.",
        "t_ex_car": "mobil kecil", "t_ex_sc": "sepeda motor", "crumb": "Alat bantu", "kicker": "Alat bantu"},
}
SITEMAP = ["/{l}/attractions/", "/{l}/rain/", "/{l}/tools/"]
FOOTER = [("/{l}/tools/", {"en": "Tools", "es": "Herramientas", "id": "Alat bantu"}), ("/{l}/attractions/", {"en": "Attractions list", "es": "Qué ver: lista", "id": "Daftar tempat wisata"})]
CSS = """
.tcalc{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:6px;padding:14px 16px;margin:0 0 18px;font:15.5px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.tcalc h2{font-size:21px;margin:0 0 8px}.tcalc label{display:inline-block;margin:0 14px 8px 0}.tcalc input,.tcalc select{font:inherit;padding:6px;width:9.5em;max-width:100%;display:block;margin-top:2px}.tcalc output{display:block;font-weight:700;margin:6px 0}.tcalc small{color:var(--muted);display:block}
.tlist{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;margin:10px 0 24px}.tlist li{border:1px solid var(--line);border-radius:6px;padding:12px 14px;background:var(--card);font:15px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.tlist a{font-weight:700;text-decoration:none;display:block;margin-bottom:3px}
"""
def _idr(n, l): return f"{n:,}".replace(",", "." if l != "en" else ",")
def _home(g, l): return [(g["X"][l]["home"], f"/{l}/")]

def _attractions(g, l):
    t = S[l]; rows = pages_geo._place_rows(g); n = len(rows); tpl = "/{l}/attractions/"
    def typ(a): return g["ptype"]({"name": a["places"][0]["name"], "url": a})
    groups = {}
    for i, a in rows: groups.setdefault(pages_hubs.area_l(a, l) or "Sumba", []).append((i, a))
    body = f'<p class="dek">{esc(t["a_lead"].format(n=n))}</p>'
    for area, its in sorted(groups.items(), key=lambda kv: min(pages_geo.PTS[i]["lon"] for i, _ in kv[1])):
        its.sort(key=lambda r: pages_geo.PTS[r[0]]["lon"]); tr = []
        for i, a in its:
            h = 0 if pages_geo.km(i, 0) <= pages_geo.km(i, 1) else 1
            tr.append([f'<a href="{g["url_of"](a, l)}">{esc(pages_hubs.pname(a, l))}</a><br><small>{esc(g["PTYPES"][typ(a)][1][l])}</small>', esc(fact(a, l, ENTRY_K[l])), esc(fact(a, l, BEST_K[l])),
                       f'{pages_geo.num(pages_geo.km(i, h), l)} km<br><small>{esc(pages_geo.HUB["tmc" if h == 0 else "wgp"][l])}, {pages_geo.drv(pages_geo.km(i, h), l)}</small>'])
        body += f'<h2 id="{g["slugify"](area)}">{esc(area)} ({len(its)})</h2>' + pages_geo._table([t["place"], t["entry"], t["best"], t["dist"]], tr, 9)
    body += f'<p>{esc(t["see"])} <a href="/data/sumba-entrance-fees.csv">{t["dl"]}</a> · <a href="/{l}/map/">{pages_geo.P[l]["m_h1"]}</a> · <a href="/{l}/distances/">{pages_geo.P[l]["d_h1"]}</a> · <a href="/{l}/best/">{ {"en": "Best of Sumba by type", "es": "Lo mejor de Sumba por tipo", "id": "Terbaik di Sumba per jenis"}[l]}</a></p><p class="gnote">{esc(pages_geo.S[l]["note"].format(d=pages_geo.fdate(g, l)))}</p>'
    il = {"@context": "https://schema.org", "@type": "ItemList", "name": t["a_h1"], "numberOfItems": n, "itemListElement": [{"@type": "ListItem", "position": k + 1, "name": pages_hubs.pname(a, l), "url": pages_hubs.BASE + g["url_of"](a, l)} for k, (i, a) in enumerate(rows)]}
    pages_hubs._page(g, l, tpl, t["a_title"], t["a_desc"].format(n=n), t["a_h1"], _home(g, l), body, [il], pages_geo.P[l]["kicker"])

def _fees_csv(g):
    rows = [["place", "regency", "entry_en", "entry_id", "best_time_en", "page", "page_first_published"]]
    for i, a in pages_geo._place_rows(g):
        rows.append([pages_hubs.pname(a, "en"), pages_geo.PTS[i].get("area", ""), fact(a, "en", ENTRY_K["en"]), fact(a, "id", ENTRY_K["id"]), fact(a, "en", BEST_K["en"]), pages_hubs.BASE + g["url_of"](a, "en"), a.get("updated") or a["date"]])
    f = io.StringIO(); csv.writer(f, lineterminator="\n").writerows(rows); g["write"]("/data/sumba-entrance-fees.csv", f.getvalue())
    pages_geo.FILES.append(("/data/sumba-entrance-fees.csv", "text/csv", len(rows) - 1, {"en": "Entrance fee or donation and best time for every place, as stated on its page with source and date.", "es": "Entrada o donativo y mejor momento de cada lugar, tal como figura en su ficha con fuente y fecha.", "id": "Tiket masuk atau donasi dan waktu terbaik setiap tempat, sesuai halaman masing-masing dengan sumber dan tanggal."}, "The Sumba Times place pages (sources on each page)"))

def _rain(g, l):
    t = S[l]; tpl = "/{l}/rain/"; M = pages_months.MONTHS; names = g["MONTHS"][l]
    data = {"w": [[m[1][2], m[1][3]] for m in M], "e": [[m[2][2], m[2][3]] for m in M], "n": [n.capitalize() if l != "id" else n for n in names]}
    rows = [[data["n"][k], f'{round(M[k][1][3] / calendar.monthrange(2023, k + 1)[1] * 100)} %<br><small>{M[k][1][2]} mm</small>', f'{round(M[k][2][3] / calendar.monthrange(2023, k + 1)[1] * 100)} %<br><small>{M[k][2][2]} mm</small>'] for k in range(12)]
    js = ("<script>(function(){var D=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ",DIM=[31,28,31,30,31,30,31,31,30,31,30,31];var a=document.getElementById('ra'),n=document.getElementById('rn'),c=document.getElementById('rc'),o=document.getElementById('ro');"
          "var d0=new Date(Date.now()+30*864e5);a.value=d0.toISOString().slice(0,10);"
          "function f(){var d=new Date(a.value+'T00:00:00'),k=Math.max(1,Math.min(60,+n.value||1));if(isNaN(d)){o.textContent='';return}var per={},exp=0,i;for(i=0;i<k;i++){var x=new Date(d.getTime()+i*864e5),m=x.getMonth();per[m]=(per[m]||0)+1}"
          "var parts=[];Object.keys(per).forEach(function(m){m=+m;var r=D[c.value][m];exp+=per[m]*r[1]/DIM[m];parts.push(" + json.dumps(t["r_month"], ensure_ascii=False) + ".replace('{m}',D.n[m]).replace('{d}',r[1]).replace('{t}',DIM[m]).replace('{mm}',r[0]))});"
          "o.textContent=" + json.dumps(t["r_res"], ensure_ascii=False) + ".replace('{d}',Math.round(exp)).replace('{n}',k).replace('{p}',Math.round(exp/k*100)).replace('{m}',parts.join(' '))}"
          "a.onchange=n.oninput=c.onchange=f;f()})()</script>")
    body = (f'<p class="dek">{esc(t["r_lead"])}</p><div class="tcalc" data-block="raintool"><label>{t["r_from"]}<input type="date" id="ra"></label><label>{t["r_nights"]}<input type="number" id="rn" min="1" max="60" value="7" inputmode="numeric"></label>'
            f'<label>{t["r_coast"]}<select id="rc"><option value="w">{t["r_w"]}</option><option value="e">{t["r_e"]}</option></select></label><output id="ro" aria-live="polite"></output></div>'
            f'<h2 id="months">{t["r_tab"]}</h2>{pages_geo._table([t["r_mo"], t["r_w"], t["r_e"]], rows)}<p class="gnote">{esc(t["r_note"])} {esc(pages_months.SOURCE)}.</p>'
            f'<p><a href="/{l}/sumba-in/">{t["r_more"]} →</a> · <a href="/data/sumba-climate-monthly.csv">CSV</a></p>')
    pages_hubs._page(g, l, tpl, t["r_title"], t["r_desc"], t["r_h1"], _home(g, l), body, [], t["kicker"], js)

TOOLS = [("/{l}/plan/", {"en": ("Trip planner and budget", "Map, budget calculator and questions to our desk."), "es": ("Planificador y presupuesto", "Mapa, calculadora de presupuesto y preguntas a la redacción."), "id": ("Perencana dan anggaran", "Peta, kalkulator anggaran, dan pertanyaan untuk redaksi.")}),
         ("/{l}/distances/", {"en": ("Distances and driving times", "Road km and time between towns, airports and every place."), "es": ("Distancias y tiempos", "Km por carretera y tiempo entre ciudades, aeropuertos y cada lugar."), "id": ("Jarak dan waktu tempuh", "Km lewat jalan dan waktu antara kota, bandara, dan tiap tempat.")}),
         ("/{l}/rain/", {"en": ("Rain on my dates", "Share of rainy days for your dates and coast."), "es": ("Lluvia en mis fechas", "Proporción de días de lluvia según tus fechas y costa."), "id": ("Hujan pada tanggal saya", "Porsi hari hujan untuk tanggal dan pesisir Anda.")}),
         ("/{l}/attractions/", {"en": ("Attractions and entrance fees", "Every place with fee, best time and distance."), "es": ("Qué ver y entradas", "Cada lugar con entrada, mejor momento y distancia."), "id": ("Tempat wisata dan tiket masuk", "Semua tempat dengan tiket, waktu terbaik, dan jarak.")}),
         ("/{l}/map/", {"en": ("Map of Sumba", "Every place by regency."), "es": ("Mapa de Sumba", "Todos los lugares por regencia."), "id": ("Peta Sumba", "Semua tempat per kabupaten.")}),
         ("/{l}/flights/", {"en": ("Flights to Sumba", "Routes and airlines to both airports, checked with sources."), "es": ("Vuelos a Sumba", "Rutas y aerolíneas a los dos aeropuertos, comprobadas con fuentes."), "id": ("Penerbangan ke Sumba", "Rute dan maskapai ke dua bandara, dicek dengan sumber.")}),
         ("/{l}/travel-status/", {"en": ("Travel status", "What affects travel this month: weather, ferries, roads."), "es": ("Estado del viaje", "Lo que afecta al viaje este mes: tiempo, ferris, carreteras."), "id": ("Status perjalanan", "Hal yang memengaruhi perjalanan bulan ini: cuaca, feri, jalan.")}),
         ("/{l}/events/", {"en": ("Events calendar", "Pasola, festivals and ceremonies through the year."), "es": ("Calendario de eventos", "Pasola, fiestas y ceremonias a lo largo del año."), "id": ("Kalender acara", "Pasola, festival, dan upacara sepanjang tahun.")}),
         ("/{l}/sumba-in/", {"en": ("Sumba month by month", "Climate table for each month, west and east."), "es": ("Sumba mes a mes", "Tabla de clima de cada mes, oeste y este."), "id": ("Sumba dari bulan ke bulan", "Tabel iklim tiap bulan, barat dan timur.")}),
         ("/{l}/earthquakes/", {"en": ("Earthquakes since 2000", "List and map from the USGS catalogue."), "es": ("Terremotos desde 2000", "Lista y mapa del catálogo del USGS."), "id": ("Gempa sejak 2000", "Daftar dan peta dari katalog USGS.")}),
         ("/{l}/glossary/", {"en": ("Glossary", "Sumbanese and Indonesian words explained."), "es": ("Glosario", "Palabras sumbanesas e indonesias explicadas."), "id": ("Glosarium", "Penjelasan istilah Sumba dan Indonesia.")}),
         ("/{l}/faq/", {"en": ("Questions and answers", "Search every answer from our guides."), "es": ("Preguntas y respuestas", "Busca todas las respuestas de nuestras guías."), "id": ("Tanya jawab", "Cari semua jawaban dari panduan kami.")}),
         ("/{l}/data/", {"en": ("Open data", "CSV, JSON and GeoJSON files to download."), "es": ("Datos abiertos", "Archivos CSV, JSON y GeoJSON para descargar."), "id": ("Data terbuka", "Berkas CSV, JSON, dan GeoJSON untuk diunduh.")})]
def _tools(g, l):
    t = S[l]; tpl = "/{l}/tools/"
    items = {a["slug"]: a for a in g["all_items"]()}; cg = items.get("car-with-driver-in-sumba")
    cgl = f' <a href="{g["url_of"](cg, l)}">{esc(cg[l]["title"])}</a>' if cg else ""
    mid = (CAR_DAY[0] + CAR_DAY[1]) // 2
    li = "".join(f'<li><a href="{u.format(l=l)}">{esc(d[l][0])}</a>{esc(d[l][1])}</li>' for u, d in TOOLS)
    fuel = (f'<div class="tcalc" id="fuel" data-block="fueltool"><h2>{t["t_fuel"]}</h2><label>{t["t_km"]}<input type="number" id="fk" value="170" min="1" inputmode="decimal"></label>'
            f'<label>{t["t_cons"]}<input type="number" id="fc" value="8" min="0.5" step="0.1" inputmode="decimal"><small>8 = {t["t_ex_car"]}, 2.5 = {t["t_ex_sc"]}</small></label>'
            f'<label>{t["t_price"]}<select id="fp"><option value="{FUEL["pertalite"]}">Pertalite {_idr(FUEL["pertalite"], l)}</option><option value="{FUEL["pertamax"]}">Pertamax {_idr(FUEL["pertamax"], l)}</option></select></label>'
            f'<output id="fo" aria-live="polite"></output><small>{esc(t["t_fuel_note"].format(a=_idr(FUEL["pertalite"], l), b=_idr(FUEL["pertamax"], l)))}{cgl} · <a href="/{l}/distances/">{pages_geo.P[l]["d_h1"]}</a></small></div>')
    car = (f'<div class="tcalc" id="car" data-block="cartool"><h2>{t["t_car"]}</h2><label>{t["t_day"]}<input type="number" id="cd" value="{mid}" min="0" step="50000" inputmode="numeric"></label>'
           f'<label>{t["t_days"]}<input type="number" id="cn" value="4" min="1" inputmode="numeric"></label><label>{t["t_people"]}<input type="number" id="cp" value="2" min="1" inputmode="numeric"></label>'
           f'<output id="co" aria-live="polite"></output><small>{esc(t["t_car_note"].format(a=_idr(CAR_DAY[0], l), b=_idr(CAR_DAY[1], l)))}{cgl}</small></div>')
    sep = "." if l != "en" else ","
    js = ("<script>(function(){function $(i){return document.getElementById(i)}function n(x){return Math.round(x).toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g,'" + sep + "')}"
          "function f(){var l=(+$('fk').value||0)*(+$('fc').value||0)/100;$('fo').textContent=" + json.dumps(t["t_fuel_res"], ensure_ascii=False) + ".replace('{l}',(Math.round(l*10)/10).toString()" + (".replace('.',',')" if l != "en" else "") + ").replace('{c}',n(l*+$('fp').value))}"
          "function c(){var tt=(+$('cd').value||0)*(+$('cn').value||1),p=Math.max(1,+$('cp').value||1);$('co').textContent=" + json.dumps(t["t_car_res"], ensure_ascii=False) + ".replace('{t}',n(tt)).replace('{p}',n(tt/p)).replace('{d}',n(tt/p/(+$('cn').value||1)))}"
          "['fk','fc','fp'].forEach(function(i){$(i).oninput=$(i).onchange=f});['cd','cn','cp'].forEach(function(i){$(i).oninput=c});f();c()})()</script>")
    body = f'<p class="dek">{esc(t["t_lead"])}</p><h2 id="all">{t["t_all"]}</h2><ul class="tlist" data-block="toolslist">{li}</ul>{fuel}{car}'
    il = {"@context": "https://schema.org", "@type": "ItemList", "name": t["t_h1"], "itemListElement": [{"@type": "ListItem", "position": k + 1, "name": d[l][0], "url": pages_hubs.BASE + u.format(l=l)} for k, (u, d) in enumerate(TOOLS)]}
    pages_hubs._page(g, l, tpl, t["t_title"], t["t_desc"], t["t_h1"], _home(g, l), body, [il], t["kicker"], js)

def tools_line(g, a, l):
    """One line of live tools related to the article's topics (flights, weather, culture, places) for the end of every article."""
    import seo_extra
    tags = set(g["strict_tags"](a)); want = []
    def add(u):
        if u not in want: want.append(u)
    blob = " ".join(tags)
    if re.search(r"flight|airport|transport", blob): add("/{l}/flights/"); add("/{l}/travel-status/")
    if re.search(r"ferr|port|sea", blob): add("/{l}/travel-status/")
    if re.search(r"weather|climate|rain", blob): add("/{l}/rain/"); add("/{l}/sumba-in/"); add("/{l}/travel-status/")
    if re.search(r"pasola|culture|festival|marapu|ikat", blob): add("/{l}/events/"); add("/{l}/glossary/")
    if a.get("section") in ("places", "things-to-do", "getting-here") or re.search(r"beach|waterfall|surf|fuel|west-sumba|waingapu", blob): add("/{l}/distances/"); add("/{l}/map/"); add("/{l}/attractions/")
    if re.search(r"quake|disaster|safety", blob): add("/{l}/earthquakes/")
    if not want: return ""
    by = dict(TOOLS)
    lab = {"en": "Tools for this topic", "es": "Herramientas sobre este tema", "id": "Alat bantu untuk topik ini"}[l]
    return f'<p class="tags" data-block="toolsline"><b>{lab}:</b> ' + " ".join(f'<a href="{u.format(l=l)}">{esc(by[u][l][0])}</a>' for u in want[:5]) + "</p>"

def build(g):
    _fees_csv(g)
    for l in g["LANGS"]: _attractions(g, l); _rain(g, l); _tools(g, l)
