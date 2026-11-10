# -*- coding: utf-8 -*-
"""Reader tools for The Sumba Times: trip planner, saved list, listen button, extra "Today in Sumba" rows,
embeddable weather widget and road/fuel report form. Standalone module in the style of newsletter.py.

WHERE TO CALL EACH FUNCTION (wiring in build.py; nothing here edits build.py)
---------------------------------------------------------------------------
0. import reader_tools                      next to `import newsletter`
   CSS = CSS + reader_tools.CSS             right after the big CSS string (head() inlines the global CSS on every page)
   reader_tools.build(globals())            next to `newsletter.build(globals())` at the end of the build
                                            -> writes /en|es|id/saved/ (noindex) and /widget/weather.html

1. PLANNER  (page /LANG/plan/, inside plan_page(l), e.g. right before {calc_html(l)})
   reader_tools.planner_html(l, reader_tools.places_for(globals(), l))
   places_for() builds the clean list from all_places()/ptype()/url_of(); you may instead pass plan_page's own `pts`
   list (keys n, a, la, lo, u, k) or raw dicts (name, lat, lon, area, url, type): planner_html() normalises all of them,
   drops airports, ports and off-island points, and merges duplicates that share coordinates.
   It returns the section, the JSON blob (embedded once, <script type="application/json" id="rt-pd">) and its script.
   Anchor: /LANG/plan/#planner ; shared plans look like /LANG/plan/#plan=7.tmc.3.beach-water-village

2. SAVED LIST
   reader_tools.save_button(l)              in article_page(a, l), e.g. inside or right after <div class="meta">, or
                                            next to share(a, l). On cards or place lists pass the target explicitly:
                                            save_button(l, url=url_of(a, l), title=a[l]["title"])
   reader_tools.saved_js(l)                 once per page that has save buttons; simplest is to append it in footer(l)
                                            (it is idempotent and does nothing when the page has no buttons)
   reader_tools.saved_link(l)               optional <a> to /LANG/saved/ for the footer links or the top bar
   The /LANG/saved/ page itself is written by build(g). Storage: localStorage "st-saved" = [{u, t, d}].

3. LISTEN
   reader_tools.listen_button(l)            in article_page(a, l), right after <div class="meta">...</div>
   reader_tools.listen_js(l)                once on the same page, anywhere after the article body (e.g. before footer(l))
   The button is rendered hidden and only shown when speechSynthesis exists.

4. TODAY IN SUMBA (front page)
   reader_tools.live_box_plus(live_box(l), l)   instead of live_box(l) in home(l): inserts the extra rows inside the
                                                existing <div class="lv"> (falls back to a second .lv block)
   reader_tools.live_extra_js(l)                right after live_js(l) in home(l)
   If you prefer to place the rows by hand: reader_tools.live_extra_html(l) returns bare rows for inside .lv, and
   live_extra_html(l, wrap=True) returns them in their own <div class="lv">.

5. WIDGET
   reader_tools.widget(g)                   called by build(g); writes /widget/weather.html (?lang=en|es|id, ?theme=dark|light)
   reader_tools.embed_snippet_html(l)       wherever you want the "embed this" section (/LANG/press/, about, plan...)
   IMPORTANT: the worker sends x-frame-options: SAMEORIGIN on every response (SEC in deploy.py). Other sites cannot
   show the iframe until /widget/* is served without that header (and ideally with
   content-security-policy: frame-ancestors *). That change belongs in deploy.py, not here.

6. REPORTS
   reader_tools.report_form_html(l)         any page, e.g. plan_page(l) next to qform_html(l) or a road/fuel article.
   POSTs {q: "[REPORT] ...", e, lang, page, w} to /api/question (same fields and limits as qform_html).

All UI text lives in S (en/es/id). No em or en dashes anywhere."""
import json, html

BASE = "https://thesumbatimes.com"
WGP = (-9.656, 120.264)      # Waingapu
TMC = (-9.39, 119.25)        # Tambolaka / Waikelo coast

S = {
 "en": {
  "pl_t": "Build your Sumba itinerary", "pl_p": "Choose how many days you have, where you land and what you like. We order the stops from your arrival side of the island to the other, so you do not have to double back.",
  "pl_days": "Days", "pl_arr": "Arrival airport", "pl_tmc": "Tambolaka (west)", "pl_wgp": "Waingapu (east)", "pl_int": "Interests", "pl_pace": "Pace",
  "pl_paces": ["Relaxed (2 stops a day)", "Normal (3 stops a day)", "Full (4 stops a day)"],
  "pl_i": {"beach": "Beaches", "water": "Waterfalls", "village": "Villages and culture", "view": "Hills and viewpoints", "surf": "Surf", "town": "Towns"},
  "pl_k": {"beach": "Beach", "water": "Waterfall", "village": "Village", "view": "Viewpoint", "nature": "Nature park", "town": "Town", "surf": "Surf"},
  "pl_go": "Build itinerary", "pl_day": "Day", "pl_arrive": "Arrival at", "pl_air": {"tmc": "Tambolaka airport", "wgp": "Waingapu airport"},
  "pl_free": "Free day: rest, swim or take the long drive slowly.", "pl_none": "Pick at least one interest.",
  "pl_note": "Kilometres are straight-line distance, roads are longer.", "pl_total": "in a straight line", "pl_from": "from the airport",
  "pl_cut": "This plan shows {n} of the {m} places that match. Add days or raise the pace to see more.",
  "pl_print": "Print / save as PDF", "pl_copy": "Copy link", "pl_copied": "Link copied", "pl_guide": "Read the guide",
  "sv_save": "Save", "sv_saved": "Saved", "sv_title": "Saved for later", "sv_desc": "The articles, guides and places you saved on this device.",
  "sv_empty": "Nothing saved yet. Tap Save on any article, guide or place to keep it here.", "sv_note": "The list is stored on this device only. Pages you have already opened can be read without a connection.",
  "sv_remove": "Remove", "sv_link": "Saved",
  "li_play": "Listen", "li_pause": "Pause", "li_resume": "Resume", "li_stop": "Stop", "li_aria": "Listen to this article",
  "lx_uv": "UV index, today's max", "lx_lv": ["low", "moderate", "high", "very high", "extreme"], "lx_wgp": "Waves off Waingapu", "lx_tmc": "Waves off Tambolaka", "lx_swell": "swell",
  "lx_moon": "Moon", "lx_ph": ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"],
  "wg_title": "Weather in Sumba now", "wg_fail": "No data right now", "wg_by": "More on",
  "em_t": "Put Sumba's weather on your site", "em_p": "Free for hotels, guides and blogs. Copy this code and paste it where you want the box to appear.", "em_copy": "Copy code", "em_copied": "Code copied", "em_frame": "Weather in Sumba, by The Sumba Times",
  "rp_t": "Road and fuel reports", "rp_p": "Seen a closed road, a landslide, a queue at the pump or a station with no fuel? Tell us. Our editors check every report before anything is published.",
  "rp_what": "What did you see?", "rp_where": "Where? (road, village or fuel station)", "rp_when": "When? (day and time)", "rp_e": "Your email (optional, in case we need to check a detail)",
  "rp_b": "Send report", "rp_ok": "Thank you. Our editors will check your report.", "rp_err": "The report could not be sent. Please try again.", "rp_limit": "You have reached today's limit. Please try again tomorrow."},
 "es": {
  "pl_t": "Crea tu itinerario por Sumba", "pl_p": "Elige cuántos días tienes, por dónde llegas y qué te interesa. Ordenamos las paradas desde tu lado de la isla hasta el otro, para que no tengas que volver sobre tus pasos.",
  "pl_days": "Días", "pl_arr": "Aeropuerto de llegada", "pl_tmc": "Tambolaka (oeste)", "pl_wgp": "Waingapu (este)", "pl_int": "Intereses", "pl_pace": "Ritmo",
  "pl_paces": ["Tranquilo (2 paradas al día)", "Normal (3 paradas al día)", "Intenso (4 paradas al día)"],
  "pl_i": {"beach": "Playas", "water": "Cascadas", "village": "Pueblos y cultura", "view": "Colinas y miradores", "surf": "Surf", "town": "Ciudades"},
  "pl_k": {"beach": "Playa", "water": "Cascada", "village": "Pueblo", "view": "Mirador", "nature": "Parque natural", "town": "Ciudad", "surf": "Surf"},
  "pl_go": "Crear itinerario", "pl_day": "Día", "pl_arrive": "Llegada al", "pl_air": {"tmc": "aeropuerto de Tambolaka", "wgp": "aeropuerto de Waingapu"},
  "pl_free": "Día libre: para descansar, darte un baño o hacer con calma el trayecto largo.", "pl_none": "Elige al menos un interés.",
  "pl_note": "Los kilómetros son en línea recta; por carretera la distancia es mayor.", "pl_total": "en línea recta", "pl_from": "desde el aeropuerto",
  "pl_cut": "Este plan incluye {n} de los {m} lugares que encajan. Añade días o sube el ritmo para ver más.",
  "pl_print": "Imprimir o guardar en PDF", "pl_copy": "Copiar enlace", "pl_copied": "Enlace copiado", "pl_guide": "Leer la guía",
  "sv_save": "Guardar", "sv_saved": "Guardado", "sv_title": "Tus lecturas guardadas", "sv_desc": "Las noticias, guías y lugares que has guardado en este dispositivo.",
  "sv_empty": "Todavía no has guardado nada. Pulsa Guardar en cualquier noticia, guía o lugar para tenerlo aquí.", "sv_note": "La lista se guarda solo en este dispositivo. Las páginas que ya has abierto se pueden leer sin conexión.",
  "sv_remove": "Quitar", "sv_link": "Guardados",
  "li_play": "Escuchar", "li_pause": "Pausar", "li_resume": "Reanudar", "li_stop": "Detener", "li_aria": "Escuchar este artículo",
  "lx_uv": "Índice UV máximo de hoy", "lx_lv": ["bajo", "moderado", "alto", "muy alto", "extremo"], "lx_wgp": "Oleaje en Waingapu", "lx_tmc": "Oleaje en Tambolaka", "lx_swell": "mar de fondo",
  "lx_moon": "Luna", "lx_ph": ["Luna nueva", "Luna creciente", "Cuarto creciente", "Gibosa creciente", "Luna llena", "Gibosa menguante", "Cuarto menguante", "Luna menguante"],
  "wg_title": "El tiempo en Sumba ahora", "wg_fail": "Sin datos en este momento", "wg_by": "Más en",
  "em_t": "Lleva el tiempo de Sumba a tu web", "em_p": "Gratis para hoteles, guías y blogs. Copia este código y pégalo donde quieras que aparezca el recuadro.", "em_copy": "Copiar código", "em_copied": "Código copiado", "em_frame": "El tiempo en Sumba, por The Sumba Times",
  "rp_t": "Avisos de carreteras y combustible", "rp_p": "¿Has visto una carretera cortada, un desprendimiento, colas en la gasolinera o un surtidor sin combustible? Cuéntanoslo. La redacción comprueba cada aviso antes de publicar nada.",
  "rp_what": "¿Qué has visto?", "rp_where": "¿Dónde? (carretera, pueblo o gasolinera)", "rp_when": "¿Cuándo? (día y hora)", "rp_e": "Tu correo (opcional, por si necesitamos confirmar algún dato)",
  "rp_b": "Enviar aviso", "rp_ok": "Gracias. La redacción revisará tu aviso.", "rp_err": "No se ha podido enviar el aviso. Inténtalo de nuevo.", "rp_limit": "Has alcanzado el límite de hoy. Vuelve a intentarlo mañana."},
 "id": {
  "pl_t": "Susun rencana perjalanan Sumba Anda", "pl_p": "Pilih jumlah hari, bandara kedatangan, dan minat Anda. Kami mengurutkan persinggahan dari sisi pulau tempat Anda tiba hingga ke sisi seberangnya, supaya Anda tidak perlu bolak-balik.",
  "pl_days": "Jumlah hari", "pl_arr": "Bandara kedatangan", "pl_tmc": "Tambolaka (barat)", "pl_wgp": "Waingapu (timur)", "pl_int": "Minat", "pl_pace": "Ritme perjalanan",
  "pl_paces": ["Santai (2 tempat sehari)", "Sedang (3 tempat sehari)", "Padat (4 tempat sehari)"],
  "pl_i": {"beach": "Pantai", "water": "Air terjun", "village": "Kampung adat dan budaya", "view": "Bukit dan titik pandang", "surf": "Selancar", "town": "Kota"},
  "pl_k": {"beach": "Pantai", "water": "Air terjun", "village": "Kampung adat", "view": "Titik pandang", "nature": "Taman nasional", "town": "Kota", "surf": "Selancar"},
  "pl_go": "Susun rencana", "pl_day": "Hari", "pl_arrive": "Tiba di", "pl_air": {"tmc": "Bandara Tambolaka", "wgp": "Bandara Waingapu"},
  "pl_free": "Hari bebas: untuk beristirahat, berenang, atau menempuh perjalanan jauh dengan santai.", "pl_none": "Pilih setidaknya satu minat.",
  "pl_note": "Jarak dihitung menurut garis lurus; lewat jalan raya jaraknya lebih jauh.", "pl_total": "menurut garis lurus", "pl_from": "dari bandara",
  "pl_cut": "Rencana ini memuat {n} dari {m} tempat yang sesuai. Tambah hari atau pilih ritme lebih padat untuk melihat lebih banyak.",
  "pl_print": "Cetak atau simpan sebagai PDF", "pl_copy": "Salin tautan", "pl_copied": "Tautan tersalin", "pl_guide": "Baca panduannya",
  "sv_save": "Simpan", "sv_saved": "Tersimpan", "sv_title": "Bacaan tersimpan", "sv_desc": "Berita, panduan, dan tempat yang Anda simpan di perangkat ini.",
  "sv_empty": "Belum ada yang disimpan. Ketuk Simpan pada berita, panduan, atau tempat mana pun agar muncul di sini.", "sv_note": "Daftar ini hanya tersimpan di perangkat ini. Halaman yang sudah pernah Anda buka tetap bisa dibaca tanpa koneksi.",
  "sv_remove": "Hapus", "sv_link": "Tersimpan",
  "li_play": "Dengarkan", "li_pause": "Jeda", "li_resume": "Lanjutkan", "li_stop": "Berhenti", "li_aria": "Dengarkan artikel ini",
  "lx_uv": "Indeks UV maksimum hari ini", "lx_lv": ["rendah", "sedang", "tinggi", "sangat tinggi", "ekstrem"], "lx_wgp": "Gelombang di Waingapu", "lx_tmc": "Gelombang di Tambolaka", "lx_swell": "alun",
  "lx_moon": "Bulan", "lx_ph": ["Bulan baru", "Sabit awal", "Perbani awal", "Cembung awal", "Purnama", "Cembung akhir", "Perbani akhir", "Sabit akhir"],
  "wg_title": "Cuaca Sumba saat ini", "wg_fail": "Data belum tersedia", "wg_by": "Selengkapnya di",
  "em_t": "Pasang cuaca Sumba di situs Anda", "em_p": "Gratis untuk hotel, pemandu, dan blog. Salin kode ini lalu tempelkan di bagian situs tempat kotak cuaca ingin ditampilkan.", "em_copy": "Salin kode", "em_copied": "Kode tersalin", "em_frame": "Cuaca Sumba, oleh The Sumba Times",
  "rp_t": "Laporan jalan dan BBM", "rp_p": "Melihat jalan tertutup, longsor, antrean di SPBU, atau SPBU yang kehabisan BBM? Kabari kami. Redaksi memeriksa setiap laporan sebelum ada yang dipublikasikan.",
  "rp_what": "Apa yang Anda lihat?", "rp_where": "Di mana? (jalan, desa, atau SPBU)", "rp_when": "Kapan? (hari dan jam)", "rp_e": "Email Anda (opsional, jika kami perlu memastikan detail)",
  "rp_b": "Kirim laporan", "rp_ok": "Terima kasih. Redaksi akan memeriksa laporan Anda.", "rp_err": "Laporan gagal terkirim. Silakan coba lagi.", "rp_limit": "Batas hari ini sudah tercapai. Silakan coba lagi besok."},
}
# fallback weather words for the widget (build() passes travel.N[l]["wcode"] when available)
WCODE = {"en": {"0": "clear", "1": "mostly clear", "2": "partly cloudy", "3": "overcast", "45": "fog", "51": "drizzle", "61": "rain", "71": "snow", "80": "showers", "95": "thunderstorm"},
         "es": {"0": "despejado", "1": "poco nuboso", "2": "nubes y claros", "3": "cubierto", "45": "niebla", "51": "llovizna", "61": "lluvia", "71": "nieve", "80": "chubascos", "95": "tormenta"},
         "id": {"0": "cerah", "1": "cerah berawan", "2": "berawan", "3": "mendung", "45": "kabut", "51": "gerimis", "61": "hujan", "71": "salju", "80": "hujan lokal", "95": "badai petir"}}

def esc(s): return html.escape(str(s), quote=True)
def _j(o): return json.dumps(o, ensure_ascii=False).replace("</", "<\\/")
def _fill(tpl, **kw):
    for k, v in kw.items(): tpl = tpl.replace("__" + k + "__", v)
    return tpl

CSS = """.rt-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:44px;padding:10px 16px;border:1px solid var(--ink);border-radius:999px;background:var(--ink);color:var(--bg);font:700 14px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;cursor:pointer;text-decoration:none}
.rt-btn:hover{opacity:.88;color:var(--bg)}.rt-btn.alt{background:transparent;color:var(--ink);border-color:var(--line)}.rt-btn.alt:hover{border-color:var(--ink);color:var(--ink)}.rt-btn[disabled]{opacity:.5;cursor:default}
.rt-hp{position:absolute;left:-9999px}
.rt-plan .rt-f{display:grid;grid-template-columns:1fr;gap:14px;margin:14px 0;font:15px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}
.rt-plan label.rt-l,.rt-plan fieldset{display:flex;flex-direction:column;gap:6px;border:0;padding:0;margin:0;min-width:0}
.rt-plan .rt-l>span,.rt-plan legend{font-weight:600;font-size:13px;color:var(--muted);padding:0}
.rt-plan select,.rt-plan input[type=number]{font:16px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:44px;padding:8px 10px;border:1px solid var(--line);border-radius:6px;background:var(--card,var(--bg));color:var(--ink);width:100%}
.rt-chips{display:flex;flex-wrap:wrap;gap:8px}.rt-chips label{position:relative;display:inline-flex;align-items:center;min-height:44px;padding:0 14px;border:1px solid var(--line);border-radius:999px;background:var(--card,var(--bg));color:var(--muted);cursor:pointer;user-select:none}
.rt-chips input{position:absolute;opacity:0;width:100%;height:100%;left:0;top:0;margin:0;cursor:pointer}.rt-chips label:has(input:checked){border-color:var(--ink);color:var(--ink);font-weight:600}.rt-chips label:has(input:focus-visible){outline:3px solid var(--accent);outline-offset:2px}
.rt-pm{font:14px -apple-system,sans-serif;color:var(--red,var(--accent));margin:0;min-height:1em}
.rt-po{margin-top:8px}.rt-po h3{font:700 22px/1.2 'Cormorant Garamond',Georgia,serif;margin:22px 0 2px;border-top:1px solid var(--line);padding-top:14px}.rt-po h3 small{display:block;font:13px -apple-system,sans-serif;color:var(--muted);margin-top:2px}
.rt-po ol{list-style:none;margin:8px 0 0;padding:0;counter-reset:rt}.rt-po li.s{counter-increment:rt;display:flex;gap:10px;align-items:flex-start;padding:6px 0}
.rt-po li.s:before{content:counter(rt);flex:0 0 26px;height:26px;border-radius:50%;background:var(--accent);color:var(--bg);font:700 13px/26px -apple-system,sans-serif;text-align:center;margin-top:2px}
.rt-po li.s a{font-weight:700;display:inline-block;padding:2px 0}.rt-po li.s b{font-weight:700}.rt-po li.s span{display:block;font:13px/1.4 -apple-system,sans-serif;color:var(--muted)}
.rt-po li.d{font:12.5px -apple-system,sans-serif;color:var(--muted);padding:0 0 0 36px}.rt-po .rt-fr{font:15px -apple-system,sans-serif;color:var(--muted);margin:8px 0}
.rt-po .rt-sum{font:13px -apple-system,sans-serif;color:var(--muted);margin:6px 0 0}
.rt-pn{font:13px/1.5 -apple-system,sans-serif;color:var(--muted);border-left:3px solid var(--accent);padding:2px 0 2px 10px;margin:14px 0}
.rt-pa{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 6px}
.rt-save{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:8px 14px;border:1px solid var(--line);border-radius:999px;background:var(--card,var(--bg));color:var(--ink);font:600 14px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;cursor:pointer}
.rt-save svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2}.rt-save[aria-pressed=true]{border-color:var(--ink)}.rt-save[aria-pressed=true] svg{fill:currentColor}
.rt-sl{list-style:none;margin:16px 0;padding:0}.rt-sl li{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--line)}
.rt-sl a{font-weight:700;text-decoration:none;display:block;padding:6px 0}.rt-sl small{display:block;font:12.5px -apple-system,sans-serif;color:var(--muted)}.rt-sl button{flex:0 0 auto}
.rt-listen{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 16px}.rt-listen[hidden],.rt-listen [hidden]{display:none}
.lv div[hidden]{display:none}.rt-lv{margin-top:0}
.rt-emb textarea{width:100%;min-height:96px;font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;padding:10px;border:1px solid var(--line);border-radius:6px;background:var(--card,var(--bg));color:var(--ink);resize:vertical}
.rt-emb iframe{border:1px solid var(--line);border-radius:8px;max-width:100%;display:block;margin:12px 0}
.rt-rep form{display:flex;flex-direction:column;gap:10px;max-width:640px}.rt-rep label{display:flex;flex-direction:column;gap:4px;font:600 13px -apple-system,sans-serif;color:var(--muted)}
.rt-rep textarea,.rt-rep input{font:16px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:44px;padding:10px;border:1px solid var(--line);border-radius:6px;background:var(--card,var(--bg));color:var(--ink);width:100%}
.rt-rep button{align-self:flex-start}.rt-rep .rt-rm{font:14px -apple-system,sans-serif;margin:0;min-height:1em}
@media(min-width:700px){.rt-plan .rt-f{grid-template-columns:120px 1fr 1fr}.rt-plan fieldset{grid-column:1/-1}}
@media print{.rt-np,.rt-pa,.rt-plan .rt-f,.rt-plan .rt-pm,.rt-save,.rt-listen,.rt-rep,.rt-emb{display:none!important}.rt-po li.s:before{background:#000;color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}.rt-po h3{break-after:avoid}.rt-po li{break-inside:avoid}}"""

# ---------------------------------------------------------------- 1. planner
INTERESTS = ["beach", "water", "village", "view", "surf", "town"]
_SURF = ("pero", "marosi", "kerewe", "tarimbang", "kalala")          # known surf breaks among our places
_SKIP = ("airport", "bandara", "port", "pelabuhan", "(tmc", "(wgp", " wgp)", " tmc)")

def _norm(places, url_of=None, ptype=None, l="en"):
    """Accepts plan_page's pts (n,a,la,lo,u,k) or raw place dicts (name,lat,lon,area,url,type). Returns clean pts with s=1 for surf."""
    out = {}
    for p in places:
        n = p.get("n") or p.get("name") or ""; la = p.get("la", p.get("lat")); lo = p.get("lo", p.get("lon"))
        if not n or la is None or lo is None: continue
        la, lo = float(la), float(lo); low = n.lower()
        if any(w in low for w in _SKIP): continue
        if not (-10.45 <= la <= -9.2 and 118.85 <= lo <= 120.95): continue      # Sumba only
        u = p.get("u", p.get("url")) or ""
        if isinstance(u, dict): u = url_of(u, l) if url_of else ""
        k = p.get("k") or p.get("type") or (ptype(p) if ptype else "town")
        d = {"n": n.strip(), "a": p.get("a", p.get("area", "")) or "", "la": round(la, 4), "lo": round(lo, 4), "u": u, "k": k}
        if any(w in low for w in _SURF): d["s"] = 1
        key = (round(la, 2), round(lo, 2)); o = out.get(key)
        if o is None: out[key] = d; continue
        better = (o["k"] == "town" and k != "town") or ((o["k"] == "town") == (k == "town") and len(d["n"]) < len(o["n"]))
        if better:
            if o.get("s"): d["s"] = 1
            if not d["u"]: d["u"] = o["u"]
            out[key] = d
        else:
            if d.get("s"): o["s"] = 1
            if not o["u"]: o["u"] = d["u"]
    return sorted(out.values(), key=lambda d: d["lo"])

def places_for(g, l):
    """Clean planner place list from build.py globals: reader_tools.planner_html(l, reader_tools.places_for(globals(), l))."""
    return _norm(g["all_places"](), g["url_of"], g["ptype"], l)

_PLAN_JS = r"""<script>(function(){var f=document.getElementById('rt-pf');if(!f)return;var P=[];try{P=JSON.parse(document.getElementById('rt-pd').textContent)}catch(e){}
var T=__T__,AP={tmc:{la:-9.409,lo:119.244},wgp:{la:-9.669,lo:120.302}},out=document.getElementById('rt-po'),msg=f.querySelector('.rt-pm'),sec=document.getElementById('planner');
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function hv(a,b){var r=Math.PI/180,x=Math.sin((b.la-a.la)*r/2),y=Math.sin((b.lo-a.lo)*r/2),h=x*x+Math.cos(a.la*r)*Math.cos(b.la*r)*y*y;return 12742*Math.asin(Math.sqrt(h))}
function km(x){return (x<10?Math.round(x*10)/10:Math.round(x)).toLocaleString('__L__')+' km'}
function get(){var i=[];f.querySelectorAll('input[name=i]:checked').forEach(function(c){i.push(c.value)});return{d:Math.max(3,Math.min(14,parseInt(f.d.value,10)||7)),a:f.a.value==='wgp'?'wgp':'tmc',p:Math.max(2,Math.min(4,parseInt(f.p.value,10)||3)),i:i}}
function put(o){f.d.value=o.d;f.a.value=o.a;f.p.value=o.p;f.querySelectorAll('input[name=i]').forEach(function(c){c.checked=o.i.indexOf(c.value)>=0})}
function enc(o){return 'plan='+o.d+'.'+o.a+'.'+o.p+'.'+o.i.join('-')}
function dec(h){var m=/plan=(\d{1,2})\.(tmc|wgp)\.([234])\.([a-z-]*)/.exec(h||'');if(!m)return null;var i=m[4].split('-').filter(function(x){return T.ik.indexOf(x)>=0});return{d:Math.max(3,Math.min(14,+m[1])),a:m[2],p:+m[3],i:i}}
function plan(o){var c=P.filter(function(p){return o.i.indexOf(p.k)>=0||(p.s&&o.i.indexOf('surf')>=0)||(p.k==='nature'&&o.i.indexOf('view')>=0)});
c.sort(function(a,b){return a.lo-b.lo});if(o.a==='wgp')c.reverse();var m=c.length,n=o.d*o.p;
if(m>n){var r=[];for(var i=0;i<n;i++)r.push(c[Math.floor(i*m/n)]);c=r}
var M=c.length,days=[],prev=AP[o.a];
for(var d=0;d<o.d;d++){var pool=c.slice(Math.floor(d*M/o.d),Math.floor((d+1)*M/o.d)),ord=[],cur=prev;
while(pool.length){var bi=0,bd=1e9;for(var k=0;k<pool.length;k++){var x=hv(cur,pool[k]);if(x<bd){bd=x;bi=k}}cur=pool.splice(bi,1)[0];ord.push({p:cur,km:bd});}
if(ord.length)prev=cur;days.push(ord)}
return{days:days,n:M,m:m}}
function draw(o,quiet){msg.textContent='';if(!o.i.length){msg.textContent=T.none;out.textContent='';out.hidden=true;return false}
var r=plan(o);out.textContent='';out.hidden=false;
out.appendChild(el('p','rt-pn',T.note));
r.days.forEach(function(day,di){var h=el('h3',null,T.day+' '+(di+1));var ar=[];day.forEach(function(s){var a=s.p.a.split(',').pop().trim();if(a&&ar.indexOf(a)<0)ar.push(a)});
var sub=(di===0?T.arrive+' '+T.air[o.a]+(ar.length?' · ':''):'')+ar.slice(0,2).join(' · ');if(sub)h.appendChild(el('small',null,sub));out.appendChild(h);
if(!day.length){out.appendChild(el('p','rt-fr',T.free));return}
var ol=el('ol'),tot=0;day.forEach(function(s,si){if(si>0||di===0){var t=km(s.km)+(si===0?' '+T.from:'');ol.appendChild(el('li','d','↓ '+t));if(si>0)tot+=s.km}
var li=el('li','s'),w=el('div'),nm;if(s.p.u){nm=el('a',null,s.p.n);nm.href=s.p.u;nm.title=T.guide}else nm=el('b',null,s.p.n);w.appendChild(nm);
var tg=T.k[s.p.k]||'';if(s.p.s&&o.i.indexOf('surf')>=0&&s.p.k!=='beach')tg=T.k.surf;else if(s.p.s&&o.i.indexOf('surf')>=0)tg+=' · '+T.k.surf;
w.appendChild(el('span',null,tg+(s.p.a?' · '+s.p.a:'')));li.appendChild(w);ol.appendChild(li)});out.appendChild(ol);
if(day.length>1)out.appendChild(el('p','rt-sum',km(tot)+' '+T.total))});
if(r.m>r.n)out.appendChild(el('p','rt-pn',T.cut.replace('{n}',r.n).replace('{m}',r.m)));
var act=el('div','rt-pa'),bp=el('button','rt-btn',T.print),bc=el('button','rt-btn alt',T.copy);bp.type=bc.type='button';
bp.onclick=function(){var marked=[],n=sec;while(n&&n!==document.body){var p=n.parentNode;if(!p)break;Array.prototype.forEach.call(p.children,function(s){if(s!==n&&s.tagName!=='SCRIPT'&&s.tagName!=='STYLE'&&!s.classList.contains('rt-np')){s.classList.add('rt-np');marked.push(s)}});n=p}
function undo(){marked.forEach(function(s){s.classList.remove('rt-np')});marked=[];window.removeEventListener('afterprint',undo)}window.addEventListener('afterprint',undo);try{clarity('event','planner_print')}catch(e){}window.print();setTimeout(undo,60000)};
bc.onclick=function(){var u=location.origin+location.pathname+'#'+enc(o);function done(){bc.textContent=T.copied;setTimeout(function(){bc.textContent=T.copy},2500)}
function old(){var t=document.createElement('textarea');t.value=u;t.setAttribute('readonly','');t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();try{document.execCommand('copy');done()}catch(e){}document.body.removeChild(t)}
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u).then(done,old)}else old();try{clarity('event','planner_copy')}catch(e){}};
act.appendChild(bp);act.appendChild(bc);out.appendChild(act);
try{history.replaceState(null,'','#'+enc(o))}catch(e){}if(!quiet){try{clarity('event','planner_made')}catch(e){}}return true}
f.onsubmit=function(e){e.preventDefault();var o=get();put(o);if(draw(o)&&out.scrollIntoView)out.scrollIntoView({behavior:'smooth',block:'start'})};
function fromHash(){var o=dec(location.hash);if(o){put(o);draw(o,true);return true}return false}
if(fromHash()&&sec.scrollIntoView)setTimeout(function(){sec.scrollIntoView()},50);window.addEventListener('hashchange',fromHash)})();</script>"""

def planner_html(l, places, url_of=None, ptype=None):
    """Trip planner section for /LANG/plan/. `places`: see places_for(); JSON blob is embedded once."""
    s = S[l]; pts = _norm(places, url_of, ptype, l)
    days = "".join(f'<option value="{d}"{" selected" if d == 7 else ""}>{d}</option>' for d in range(3, 15))
    paces = "".join(f'<option value="{i + 2}"{" selected" if i == 1 else ""}>{esc(t)}</option>' for i, t in enumerate(s["pl_paces"]))
    chips = "".join(f'<label><input type="checkbox" name="i" value="{k}"{" checked" if k in ("beach", "water", "village", "view") else ""}>{esc(s["pl_i"][k])}</label>' for k in INTERESTS)
    T = {"day": s["pl_day"], "arrive": s["pl_arrive"], "air": s["pl_air"], "free": s["pl_free"], "none": s["pl_none"], "note": s["pl_note"], "total": s["pl_total"], "from": s["pl_from"],
         "cut": s["pl_cut"], "print": s["pl_print"], "copy": s["pl_copy"], "copied": s["pl_copied"], "guide": s["pl_guide"], "k": s["pl_k"], "ik": INTERESTS}
    return f"""<section class="block rt-plan" id="planner"><div class="hd"><h2>{s["pl_t"]}</h2></div><p>{s["pl_p"]}</p>
<form id="rt-pf" class="rt-f"><label class="rt-l"><span>{s["pl_days"]}</span><select name="d">{days}</select></label>
<label class="rt-l"><span>{s["pl_arr"]}</span><select name="a"><option value="tmc">{s["pl_tmc"]}</option><option value="wgp">{s["pl_wgp"]}</option></select></label>
<label class="rt-l"><span>{s["pl_pace"]}</span><select name="p">{paces}</select></label>
<fieldset><legend>{s["pl_int"]}</legend><div class="rt-chips">{chips}</div></fieldset>
<div><button type="submit" class="rt-btn">{s["pl_go"]}</button></div><p class="rt-pm" role="status" aria-live="polite"></p></form>
<div id="rt-po" class="rt-po" hidden aria-live="polite"></div></section>
<script type="application/json" id="rt-pd">{_j(pts)}</script>
""" + _fill(_PLAN_JS, T=_j(T), L=l)

# ---------------------------------------------------------------- 2. saved list
_BM = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4.5L6 21z"/></svg>'

def save_button(l, url=None, title=None):
    """Toggle button. Without url/title it saves the current page (location.pathname + the page <h1>)."""
    s = S[l]; d = (f' data-u="{esc(url)}"' if url else "") + (f' data-t="{esc(title)}"' if title else "")
    return f'<button type="button" class="rt-save"{d} aria-pressed="false">{_BM}<span>{s["sv_save"]}</span></button>'

def saved_link(l):
    return f'<a href="/{l}/saved/" rel="nofollow">{S[l]["sv_link"]}</a>'

_SAVED_JS = r"""<script>(function(){if(window.stSavedInit)return;window.stSavedInit=1;var K='st-saved',T=__T__;
function all(){try{var a=JSON.parse(localStorage.getItem(K)||'[]');return Array.isArray(a)?a.filter(function(x){return x&&x.u}):[]}catch(e){return[]}}
function store(a){try{localStorage.setItem(K,JSON.stringify(a.slice(0,200)));return true}catch(e){return false}}
function has(u){return all().some(function(x){return x.u===u})}
function info(b){var h=document.querySelector('main h1')||document.querySelector('h1');return{u:b.getAttribute('data-u')||location.pathname,t:(b.getAttribute('data-t')||(h&&h.textContent)||document.title||'').trim().slice(0,200)}}
function paint(){document.querySelectorAll('button.rt-save').forEach(function(b){var on=has(info(b).u);b.setAttribute('aria-pressed',on?'true':'false');var s=b.querySelector('span');if(s)s.textContent=on?T.saved:T.save})}
function list(){var ul=document.getElementById('rt-saved');if(!ul)return;var a=all(),em=document.getElementById('rt-saved-0');ul.textContent='';if(em)em.hidden=a.length>0;
a.forEach(function(x){var li=document.createElement('li'),d=document.createElement('div'),l=document.createElement('a'),b=document.createElement('button');
l.href=x.u.charAt(0)==='/'?x.u:'#';l.textContent=x.t||x.u;d.appendChild(l);if(x.d){var sm=document.createElement('small');try{sm.textContent=new Date(x.d).toLocaleDateString('__L__',{day:'numeric',month:'long',year:'numeric'})}catch(e){}d.appendChild(sm)}
b.type='button';b.className='rt-btn alt';b.textContent=T.remove;b.onclick=function(){store(all().filter(function(y){return y.u!==x.u}));list()};li.appendChild(d);li.appendChild(b);ul.appendChild(li)})}
document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('button.rt-save'):null;if(!b)return;var i=info(b),a=all();
if(has(i.u))a=a.filter(function(x){return x.u!==i.u});else{a.unshift({u:i.u,t:i.t,d:Date.now()});try{clarity('event','saved')}catch(_){}}store(a);paint();list()});
window.addEventListener('storage',function(e){if(e.key===K){paint();list()}});paint();list()})();</script>"""

def saved_js(l):
    s = S[l]
    return _fill(_SAVED_JS, T=_j({"save": s["sv_save"], "saved": s["sv_saved"], "remove": s["sv_remove"]}), L=l)

def saved_page(g, l):
    s = S[l]; tpl = "/{l}/saved/"
    pg = g["head"](l, s["sv_title"] + " · The Sumba Times", s["sv_desc"], tpl, noindex=True) + g["masthead"](l, tpl)
    pg += f"""<main id="main" class="w"><div class="nar"><div class="crumbs"><a href="/{l}/">{g["X"][l]["home"]}</a></div><h1>{s["sv_title"]}</h1><p class="dek">{s["sv_desc"]}</p>
<p id="rt-saved-0">{s["sv_empty"]}</p><ul id="rt-saved" class="rt-sl"></ul><p class="when">{s["sv_note"]}</p></div></main>{saved_js(l)}""" + g["footer"](l)
    g["write"](tpl.format(l=l), pg)

# ---------------------------------------------------------------- 3. listen
def listen_button(l):
    s = S[l]
    return f'<div class="rt-listen" id="rt-listen" hidden role="group" aria-label="{esc(s["li_aria"])}"><button type="button" class="rt-btn alt" data-a="play">▶ <span>{s["li_play"]}</span></button><button type="button" class="rt-btn alt" data-a="stop" hidden>■ {s["li_stop"]}</button></div>'

_LISTEN_JS = r"""<script>(function(){var box=document.getElementById('rt-listen'),ss=window.speechSynthesis;if(!box||box.getAttribute('data-on')||!ss||typeof SpeechSynthesisUtterance==='undefined')return;box.setAttribute('data-on','1');
var L='__L__',T=__T__,LC={en:'en-GB',es:'es-ES',id:'id-ID'}[L],bp=box.querySelector('[data-a=play]'),bs=box.querySelector('[data-a=stop]'),lab=bp.querySelector('span'),q=[],i=0,st=0,gen=0;
function voice(){var v=[],m=null;try{v=ss.getVoices()||[]}catch(e){}for(var k=0;k<v.length;k++){var c=(v[k].lang||'').toLowerCase().replace('_','-');
if(c.indexOf(L)===0||(L==='id'&&c.indexOf('in')===0)){if(!m)m=v[k];if(c===LC.toLowerCase()){m=v[k];break}}}return m}
function text(){var h=document.querySelector('main h1')||document.querySelector('h1'),b=document.querySelector('.body,.body0'),t=h?h.textContent.trim()+'.\n':'';
if(b){var c=b.cloneNode(true);c.querySelectorAll('script,style,form,figure,table,button,.sub,.np,.toc,.rt-listen,.rt-save').forEach(function(e){e.parentNode.removeChild(e)});
c.querySelectorAll('p,h2,h3,h4,li,blockquote').forEach(function(e){e.appendChild(document.createTextNode('\n'))});t+=c.textContent}return t}
function chunks(t){var o=[];t.split(/\n+/).forEach(function(p){p=p.replace(/\s+/g,' ').trim();if(!p)return;var s=p.match(/[^.!?]+[.!?]*\s*/g)||[p],cur='';
s.forEach(function(x){if(cur&&(cur+x).length>220){o.push(cur);cur=''}cur+=x});if(cur.trim())o.push(cur)});return o}
function ui(){lab.textContent=st===1?T.pause:st===2?T.resume:T.play;bs.hidden=st===0;bp.setAttribute('aria-pressed',st===1?'true':'false')}
function reset(){st=0;i=0;gen++;try{ss.cancel()}catch(e){}ui()}
function next(){if(i>=q.length){reset();return}var g=gen,u=new SpeechSynthesisUtterance(q[i]),v=voice();u.lang=v?v.lang:LC;if(v)u.voice=v;
u.onend=function(){if(g!==gen||!st)return;i++;next()};u.onerror=function(){if(g!==gen)return;reset()};try{ss.speak(u)}catch(e){reset()}}
bp.onclick=function(){if(st===0){q=chunks(text());if(!q.length)return;i=0;gen++;try{ss.cancel()}catch(e){}st=1;ui();next();try{clarity('event','listen')}catch(e){}}
else if(st===1){try{ss.pause()}catch(e){}st=2;ui()}else{try{ss.resume()}catch(e){}st=1;ui()}};
bs.onclick=reset;window.addEventListener('pagehide',function(){try{ss.cancel()}catch(e){}});
try{ss.getVoices();if(ss.addEventListener)ss.addEventListener('voiceschanged',function(){})}catch(e){}box.hidden=false;ui()})();</script>"""

def listen_js(l):
    s = S[l]
    return _fill(_LISTEN_JS, T=_j({"play": s["li_play"], "pause": s["li_pause"], "resume": s["li_resume"]}), L=l)

# ---------------------------------------------------------------- 4. Today in Sumba: UV, waves, moon
def live_extra_html(l, wrap=False):
    """Rows for the front-page "Today in Sumba" box. Bare rows go inside the existing <div class="lv">; wrap=True gives a separate .lv block.
    Weather rows stay hidden until data arrives, so a failed request leaves no trace."""
    s = S[l]
    rows = (f'<div hidden><b>{s["lx_uv"]}</b><span id="wx-uv"></span></div><div hidden><b>{s["lx_wgp"]}</b><span id="wx-sea-wgp"></span></div>'
            f'<div hidden><b>{s["lx_tmc"]}</b><span id="wx-sea-tmc"></span></div><div hidden><b>{s["lx_moon"]}</b><span id="wx-moon"></span></div>')
    return f'<div class="lv rt-lv">{rows}</div>' if wrap else rows

def live_box_plus(box_html, l):
    """live_box(l) with the extra rows added at the end of its .lv grid."""
    mark = '</div></div>\n<p class="src2">'
    if mark in box_html: return box_html.replace(mark, "</div>" + live_extra_html(l) + '</div>\n<p class="src2">', 1)
    mark = '<p class="src2">'
    if mark in box_html: return box_html.replace(mark, live_extra_html(l, True) + mark, 1)
    return box_html + live_extra_html(l, True)

_LIVE_JS = r"""<script>(function(){var L='__L__',T=__T__,Q='latitude=__LA__&longitude=__LO__&timezone=Asia%2FMakassar';
function row(id,t){var e=document.getElementById(id);if(e&&t){e.textContent=t;if(e.parentNode)e.parentNode.hidden=false}}
function ok(x){return typeof x==='number'&&isFinite(x)}
function num(x){try{return x.toLocaleString(L,{minimumFractionDigits:1,maximumFractionDigits:1})}catch(e){return x.toFixed(1)}}
try{var p=(((Date.now()/864e5-10962.76)/29.530588853)%1+1)%1,il=Math.round((1-Math.cos(2*Math.PI*p))*50),k=p<0.034||p>=0.966?0:p<0.216?1:p<0.284?2:p<0.466?3:p<0.534?4:p<0.716?5:p<0.784?6:7;row('wx-moon',T.ph[k]+' · '+il+'%')}catch(e){}
if(!window.fetch)return;function js(r){if(!r.ok)throw 0;return r.json()}
fetch('https://api.open-meteo.com/v1/forecast?'+Q+'&daily=uv_index_max&forecast_days=1').then(js).then(function(j){var a=j[0].daily.uv_index_max[0],b=j[1].daily.uv_index_max[0];if(!ok(a)||!ok(b))return;
a=Math.round(a);b=Math.round(b);var u=Math.max(a,b);row('wx-uv','Waingapu '+a+' · Tambolaka '+b+' · '+T.lv[u<3?0:u<6?1:u<8?2:u<11?3:4])}).catch(function(){});
fetch('https://marine-api.open-meteo.com/v1/marine?'+Q+'&current=wave_height,swell_wave_period').then(js).then(function(j){function w(x){var c=x&&x.current;if(!c||!ok(c.wave_height))return'';
return num(c.wave_height)+' m'+(ok(c.swell_wave_period)?' · '+T.swell+' '+Math.round(c.swell_wave_period)+' s':'')}row('wx-sea-wgp',w(j[0]));row('wx-sea-tmc',w(j[1]))}).catch(function(){})})();</script>"""

def live_extra_js(l):
    s = S[l]
    return _fill(_LIVE_JS, T=_j({"lv": s["lx_lv"], "swell": s["lx_swell"], "ph": s["lx_ph"]}), L=l, LA=f"{WGP[0]},{TMC[0]}", LO=f"{WGP[1]},{TMC[1]}")

# ---------------------------------------------------------------- 5. embeddable widget
_WIDGET = r"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Sumba weather · The Sumba Times</title><link rel="canonical" href="__BASE__/widget/weather.html">
<style>:root{--bg:#fffdf9;--ink:#1d1b18;--muted:#5f584e;--line:#d9cfbf;--accent:#7a5a2f}
@media(prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#1d1b18;--ink:#ece6da;--muted:#b3aa9b;--line:#3a352e;--accent:#d8b27a}}
:root[data-theme=dark]{--bg:#1d1b18;--ink:#ece6da;--muted:#b3aa9b;--line:#3a352e;--accent:#d8b27a}
*{box-sizing:border-box}html,body{margin:0}body{background:var(--bg);color:var(--ink);font:15px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;padding:12px 14px}
h1{font:700 12px/1.3 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0 0 6px}
.r{display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:7px 0;border-bottom:1px dotted var(--line)}.r b{font-weight:600}.r span{text-align:right;color:var(--muted)}.r strong{color:var(--ink);font-size:20px;font-variant-numeric:tabular-nums}
p{margin:8px 0 0;font-size:12px;color:var(--muted);display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}a{color:var(--accent);font-weight:700;text-decoration:none;display:inline-block;padding:4px 0}a:hover{text-decoration:underline}</style></head>
<body><h1 id="t"></h1><div class="r"><b>Waingapu</b><span id="a">…</span></div><div class="r"><b>Tambolaka</b><span id="b">…</span></div>
<p><span id="by"></span> <a id="lk" href="__BASE__/" target="_blank" rel="noopener">The Sumba Times</a></p>
<script>(function(){var q={};try{location.search.slice(1).split('&').forEach(function(x){var p=x.split('=');q[p[0]]=decodeURIComponent(p[1]||'')})}catch(e){}
var S=__S__,l=S[q.lang]?q.lang:'en',s=S[l],W=s.w;document.documentElement.lang=l;if(q.theme==='dark'||q.theme==='light')document.documentElement.setAttribute('data-theme',q.theme);
function $(i){return document.getElementById(i)}$('t').textContent=s.t;$('by').textContent=s.by;$('lk').href='__BASE__/'+l+'/?utm_source=widget&utm_medium=embed';document.title=s.t+' · The Sumba Times';
function wc(c){c=+c;var r=W['0']||'';Object.keys(W).map(Number).sort(function(a,b){return a-b}).forEach(function(k){if(c>=k)r=W[k]});return r}
function put(e,x){e.textContent='';var st=document.createElement('strong');st.textContent=Math.round(x.current.temperature_2m)+'°C';e.appendChild(st);e.appendChild(document.createTextNode(' '+wc(x.current.weather_code)))}
function fail(){$('a').textContent=s.f;$('b').textContent=''}if(!window.fetch){fail();return}
fetch('https://api.open-meteo.com/v1/forecast?latitude=__LA__&longitude=__LO__&current=temperature_2m,weather_code&timezone=Asia%2FMakassar').then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){put($('a'),j[0]);put($('b'),j[1])}).catch(fail)})();</script></body></html>"""

def widget(g):
    """Writes /widget/weather.html: standalone, no site CSS or scripts, language from ?lang=."""
    N = g.get("N") or {}
    data = {l: {"t": S[l]["wg_title"], "f": S[l]["wg_fail"], "by": S[l]["wg_by"], "w": (N.get(l) or {}).get("wcode") or WCODE[l]} for l in ("en", "es", "id")}
    g["write"]("/widget/weather.html", _fill(_WIDGET, S=_j(data), BASE=BASE, LA=f"{WGP[0]},{TMC[0]}", LO=f"{WGP[1]},{TMC[1]}"))

def embed_code(l):
    return f'<iframe src="{BASE}/widget/weather.html?lang={l}" title="{S[l]["em_frame"]}" width="320" height="150" style="border:0;max-width:100%" loading="lazy"></iframe>'

def embed_snippet_html(l, preview=True):
    """Section with the iframe code to copy (and a live preview). Use on /LANG/press/ or anywhere."""
    s = S[l]; code = embed_code(l)
    pv = f'<iframe src="/widget/weather.html?lang={l}" title="{esc(s["em_frame"])}" width="320" height="150" loading="lazy"></iframe>' if preview else ""
    return f"""<section class="block rt-emb" id="embed"><div class="hd"><h2>{s["em_t"]}</h2></div><p>{s["em_p"]}</p>{pv}
<textarea readonly rows="4" aria-label="{esc(s["em_copy"])}" onfocus="this.select()">{esc(code)}</textarea>
<p><button type="button" class="rt-btn" onclick="var b=this,t=b.parentNode.previousElementSibling;function d(){{b.textContent={esc(_j(s["em_copied"]))}}}t.select();if(navigator.clipboard&amp;&amp;navigator.clipboard.writeText){{navigator.clipboard.writeText(t.value).then(d,function(){{try{{document.execCommand('copy');d()}}catch(e){{}}}})}}else{{try{{document.execCommand('copy');d()}}catch(e){{}}}}">{s["em_copy"]}</button></p></section>"""

# ---------------------------------------------------------------- 6. road and fuel reports
_REPORT_JS = r"""<script>(function(){var f=document.getElementById('rt-rf');if(!f||f.getAttribute('data-on'))return;f.setAttribute('data-on','1');var m=f.querySelector('.rt-rm'),T=__T__;
f.onsubmit=function(e){e.preventDefault();var b=f.querySelector('button');b.disabled=true;m.textContent='';
var q='[REPORT] '+f.what.value.trim()+' | Where: '+f.where.value.trim()+' | When: '+f.when.value.trim();
fetch('/api/question',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({q:q.slice(0,1500),e:f.e.value.trim(),w:f.w.value,lang:'__L__',page:location.pathname})})
.then(function(r){m.textContent=r.ok?T.ok:(r.status===429?T.limit:T.err);if(r.ok){f.reset();try{clarity('event','report_sent')}catch(_){}}}).catch(function(){m.textContent=T.err}).then(function(){b.disabled=false})}})();</script>"""

def report_form_html(l):
    """"Road and fuel reports" form. Sends to /api/question as q="[REPORT] <what> | Where: <where> | When: <when>" (labels in English for the moderators)."""
    s = S[l]
    return f"""<section class="block rt-rep" id="report"><div class="hd"><h2>{s["rp_t"]}</h2></div><p>{s["rp_p"]}</p>
<form id="rt-rf"><label>{s["rp_what"]}<textarea name="what" rows="3" minlength="5" maxlength="1100" required></textarea></label>
<label>{s["rp_where"]}<input type="text" name="where" maxlength="150" required></label><label>{s["rp_when"]}<input type="text" name="when" maxlength="80" required></label>
<label>{s["rp_e"]}<input type="email" name="e" maxlength="200" autocomplete="email"></label>
<input type="text" name="w" tabindex="-1" autocomplete="off" class="rt-hp" aria-hidden="true"><button type="submit" class="rt-btn">{s["rp_b"]}</button><p class="rt-rm" role="status" aria-live="polite"></p></form></section>
""" + _fill(_REPORT_JS, T=_j({"ok": s["rp_ok"], "err": s["rp_err"], "limit": s["rp_limit"]}), L=l)

# ---------------------------------------------------------------- build hook
def build(g):
    """Called from build.py as reader_tools.build(globals()): writes /LANG/saved/ and /widget/weather.html."""
    for l in g["LANGS"]: saved_page(g, l)
    widget(g)
