# -*- coding: utf-8 -*-
# The Sumba Times v2 generator: newspaper front page, 3 languages (en/es/id), hero photos from Workers KV.
# python3 build.py -> out/ ; the Worker `thesumbatimes` serves out/ (embedded) and /img/*, /og/* from KV (binding IMG).
import os, re, json, html, shutil, datetime
from content import LANGS, UI, ARTICLES, LETTER, stay_table
try:
    from news_briefs import BRIEFS
except Exception:
    BRIEFS = []
try:
    from images import IMAGES
except Exception:
    IMAGES = {}

BASE = "https://thesumbatimes.com"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
CLARITY = "z9xpaay63s"
SB_URL = "https://oykcsmextclpdnugixqz.supabase.co"
SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw"
CONTACT = "info@ecobeachcity.com"
WITA = datetime.timezone(datetime.timedelta(hours=8))
NOW = datetime.datetime.now(WITA)

NAV = ["news", "travel", "business", "culture", "living", "projects", "guides", "low-tide"]
GROUP = {"getting-here": "travel", "things-to-do": "travel", "where-to-stay": "travel"}
LEGACY = ["getting-here", "things-to-do", "where-to-stay"]
HTML_LANG = {"en": "en", "es": "es", "id": "id"}
OG_LOC = {"en": "en_US", "es": "es_ES", "id": "id_ID"}
MONTHS = {"en": ["January","February","March","April","May","June","July","August","September","October","November","December"],
          "es": ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"],
          "id": ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"]}
WD = {"en": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
      "es": ["lunes","martes","miércoles","jueves","viernes","sábado","domingo"],
      "id": ["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"]}

X = {
 "en": {"sec": {"news": "News", "travel": "Travel", "business": "Business & investment", "culture": "Culture", "living": "Living on Sumba", "projects": "Projects", "guides": "Guides", "low-tide": "Low Tide"},
        "sdesc": {"travel": "Getting here, getting around and what to see.", "business": "Land rules for foreigners, infrastructure, budgets, tourism figures and the economy of the island.", "living": "Healthcare, schools, visas, cost of living, safety and seasons for people who live here.", "guides": "Our evergreen guides to Sumba: how to get here, culture, beaches, where to stay and what is being built.", "culture": "Marapu, the Pasola, ikat weaving and the traditional villages of Sumba."},
        "daily": "New stories every morning at 6:00 Sumba time (WITA)", "desk": "By The Sumba Times desk", "pub": "Published", "upd": "Updated",
        "min": "min read", "ticker": "Latest", "today": "Today", "newest": "New", "toc": "In this article", "share": "Share", "copy": "Copy link", "copied": "Link copied",
        "related": "Related stories", "search": "Search", "search_ph": "Search The Sumba Times", "search_none": "No stories found.", "photo": "Photo", "ai": "AI-generated illustration",
        "license": "licence", "corr": "Spotted an error? Write to", "about": "About us", "guides_t": "Essential guides", "more_sec": "More in", "home": "Home", "skip": "Skip to content",
        "dark": "Dark mode", "top_story": "Top story", "rss": "RSS", "nf": "Page not found", "nf_t": "This page does not exist or has moved.", "back": "Back to the front page",
        "lt_t": "Low Tide, the weekly letter", "all": "All stories in", "brief": "Brief",
        "about_title": "About The Sumba Times",
        "about_body": "<p>The Sumba Times covers news, travel, business and everyday life on the island of Sumba, in East Nusa Tenggara, Indonesia, in English, Spanish and Indonesian. New stories are published every morning at 6:00 Sumba time (WITA).</p><h2>Who publishes it</h2><p>The Sumba Times is published by Eco Beach City, which operates Villa Eco Beach on Sumba. We say so on every page. We cover the whole island, including other hotels, projects and businesses, and we do not report on Eco Beach City's own commercial or legal matters.</p><h2>Our standards</h2><ul><li>Every story is based on named, linked sources: local and national media, official agencies and regency governments.</li><li>We do not invent facts. When a number comes from a single source, we say so.</li><li>No paid placements. No rankings with our publisher first.</li><li>Photos are real and credited with their licence. If we ever use an AI-generated illustration, it is labelled as such and never shows real people, sacred rituals or other hotels.</li></ul><h2>Corrections</h2><p>If you spot an error, write to " + CONTACT + " and we will correct it and note the change.</p>"},
 "es": {"sec": {"news": "Noticias", "travel": "Viajar", "business": "Negocios e inversión", "culture": "Cultura", "living": "Vivir en Sumba", "projects": "Proyectos", "guides": "Guías", "low-tide": "Marea baja"},
        "sdesc": {"travel": "Cómo llegar, cómo moverse y qué ver.", "business": "Normas sobre la tierra para extranjeros, infraestructuras, presupuestos, cifras de turismo y la economía de la isla.", "living": "Sanidad, colegios, visados, coste de vida, seguridad y estaciones para quien vive aquí.", "guides": "Nuestras guías de Sumba: cómo llegar, cultura, playas, dónde dormir y qué se está construyendo.", "culture": "Marapu, la Pasola, los tejidos ikat y los pueblos tradicionales de Sumba."},
        "daily": "Noticias nuevas cada mañana a las 6:00, hora de Sumba (WITA)", "desk": "Por la redacción de The Sumba Times", "pub": "Publicado", "upd": "Actualizado",
        "min": "min de lectura", "ticker": "Última hora", "today": "Hoy", "newest": "Nuevo", "toc": "En este artículo", "share": "Compartir", "copy": "Copiar enlace", "copied": "Enlace copiado",
        "related": "Noticias relacionadas", "search": "Buscar", "search_ph": "Buscar en The Sumba Times", "search_none": "No hay resultados.", "photo": "Foto", "ai": "Ilustración generada con IA",
        "license": "licencia", "corr": "¿Has visto un error? Escribe a", "about": "Quiénes somos", "guides_t": "Guías esenciales", "more_sec": "Más en", "home": "Portada", "skip": "Ir al contenido",
        "dark": "Modo oscuro", "top_story": "Noticia principal", "rss": "RSS", "nf": "Página no encontrada", "nf_t": "Esta página no existe o ha cambiado de dirección.", "back": "Volver a la portada",
        "lt_t": "Marea baja, la carta semanal", "all": "Todas las noticias de", "brief": "Breve",
        "about_title": "Sobre The Sumba Times",
        "about_body": "<p>The Sumba Times cuenta las noticias, los viajes, los negocios y la vida diaria de la isla de Sumba, en Nusa Tenggara Oriental (Indonesia), en inglés, español e indonesio. Publicamos noticias nuevas cada mañana a las 6:00, hora de Sumba (WITA).</p><h2>Quién lo publica</h2><p>The Sumba Times lo publica Eco Beach City, que gestiona Villa Eco Beach en Sumba. Lo decimos en todas las páginas. Cubrimos toda la isla, incluidos otros hoteles, proyectos y negocios, y no informamos sobre los asuntos comerciales o legales de Eco Beach City.</p><h2>Nuestras normas</h2><ul><li>Cada noticia se basa en fuentes con nombre y enlace: medios locales y nacionales, organismos oficiales y gobiernos de las regencias.</li><li>No inventamos datos. Cuando una cifra viene de una sola fuente, lo decimos.</li><li>Sin contenidos pagados. Sin rankings con nuestro editor en primer lugar.</li><li>Las fotos son reales y llevan su autor y licencia. Si alguna vez usamos una ilustración generada con IA, lo indicamos y nunca muestra personas reales, rituales sagrados ni otros hoteles.</li></ul><h2>Correcciones</h2><p>Si ves un error, escribe a " + CONTACT + " y lo corregiremos indicando el cambio.</p>"},
 "id": {"sec": {"news": "Berita", "travel": "Wisata", "business": "Bisnis & investasi", "culture": "Budaya", "living": "Tinggal di Sumba", "projects": "Proyek", "guides": "Panduan", "low-tide": "Air Surut"},
        "sdesc": {"travel": "Cara ke Sumba, berkeliling dan tempat yang layak dikunjungi.", "business": "Aturan tanah bagi warga asing, infrastruktur, anggaran daerah, data pariwisata dan ekonomi pulau.", "living": "Kesehatan, sekolah, visa, biaya hidup, keamanan dan musim bagi yang tinggal di sini.", "guides": "Panduan kami tentang Sumba: cara ke sini, budaya, pantai, tempat menginap dan apa yang sedang dibangun.", "culture": "Marapu, Pasola, tenun ikat dan kampung adat Sumba."},
        "daily": "Berita baru setiap pagi pukul 06.00 waktu Sumba (WITA)", "desk": "Oleh redaksi The Sumba Times", "pub": "Terbit", "upd": "Diperbarui",
        "min": "menit baca", "ticker": "Terbaru", "today": "Hari ini", "newest": "Baru", "toc": "Dalam artikel ini", "share": "Bagikan", "copy": "Salin tautan", "copied": "Tautan disalin",
        "related": "Berita terkait", "search": "Cari", "search_ph": "Cari di The Sumba Times", "search_none": "Tidak ada hasil.", "photo": "Foto", "ai": "Ilustrasi buatan AI",
        "license": "lisensi", "corr": "Menemukan kesalahan? Tulis ke", "about": "Tentang kami", "guides_t": "Panduan utama", "more_sec": "Lainnya di", "home": "Beranda", "skip": "Langsung ke isi",
        "dark": "Mode gelap", "top_story": "Berita utama", "rss": "RSS", "nf": "Halaman tidak ditemukan", "nf_t": "Halaman ini tidak ada atau sudah dipindahkan.", "back": "Kembali ke beranda",
        "lt_t": "Air Surut, surat mingguan", "all": "Semua berita di", "brief": "Kabar singkat",
        "about_title": "Tentang The Sumba Times",
        "about_body": "<p>The Sumba Times memberitakan kabar, wisata, bisnis dan kehidupan sehari-hari di Pulau Sumba, Nusa Tenggara Timur, Indonesia, dalam bahasa Inggris, Spanyol dan Indonesia. Berita baru terbit setiap pagi pukul 06.00 waktu Sumba (WITA).</p><h2>Siapa penerbitnya</h2><p>The Sumba Times diterbitkan oleh Eco Beach City, pengelola Villa Eco Beach di Sumba. Kami menyebutkannya di setiap halaman. Kami meliput seluruh pulau, termasuk hotel, proyek dan usaha lain, dan tidak memberitakan urusan komersial atau hukum Eco Beach City sendiri.</p><h2>Standar kami</h2><ul><li>Setiap berita berdasar sumber yang jelas dan bertautan: media lokal dan nasional, lembaga resmi dan pemerintah kabupaten.</li><li>Kami tidak mengarang fakta. Jika suatu angka hanya dari satu sumber, kami menyebutkannya.</li><li>Tanpa konten berbayar. Tanpa peringkat yang menempatkan penerbit kami di urutan pertama.</li><li>Foto adalah foto asli dan mencantumkan pembuat serta lisensinya. Jika kami memakai ilustrasi buatan AI, kami menandainya dan ilustrasi itu tidak menampilkan orang nyata, ritual sakral atau hotel lain.</li></ul><h2>Koreksi</h2><p>Jika menemukan kesalahan, tulis ke " + CONTACT + " dan kami akan memperbaikinya serta mencatat perubahannya.</p>"},
}

def esc(s): return html.escape(str(s), quote=True)
def sec_name(l, s): return X[l]["sec"].get(s) or UI[l]["sections"].get(s, s)
def sec_desc(l, s): return X[l]["sdesc"].get(s) or UI[l]["section_desc"].get(s, "")
def group_of(a): return GROUP.get(a["section"], a["section"])
def kind_of(a):
    if a.get("kind"): return a["kind"]
    if a["section"] == "low-tide": return "letter"
    if a["section"] == "news": return "brief"
    return "guide"
def tm(a): return a.get("time", "06:00")
def dt(a):
    y, m, d = map(int, a["date"].split("-")); hh, mm = map(int, tm(a).split(":"))
    return datetime.datetime(y, m, d, hh, mm, tzinfo=WITA)
def iso(a): return dt(a).isoformat()
def fdate(a, l, with_time=True):
    d = dt(a)
    if l == "en": s = f"{d.day} {MONTHS[l][d.month-1]} {d.year}"
    elif l == "es": s = f"{d.day} de {MONTHS[l][d.month-1]} de {d.year}"
    else: s = f"{d.day} {MONTHS[l][d.month-1]} {d.year}"
    if with_time: s += f", {d.strftime('%H:%M') if l != 'id' else d.strftime('%H.%M')} WITA"
    return s
def today_str(l):
    d = NOW
    if l == "en": return f"{WD[l][d.weekday()]}, {d.day} {MONTHS[l][d.month-1]} {d.year}"
    if l == "es": return f"{WD[l][d.weekday()]}, {d.day} de {MONTHS[l][d.month-1]} de {d.year}"
    return f"{WD[l][d.weekday()]}, {d.day} {MONTHS[l][d.month-1]} {d.year}"

def all_items():
    seen, items = set(), []
    for a in BRIEFS + ARTICLES + [LETTER]:
        if a["slug"] in seen: continue
        seen.add(a["slug"]); items.append(a)
    return sorted(items, key=dt, reverse=True)

def url_of(a, l): return f"/{l}/{a['section']}/{a['slug']}/"
def img_of(a): return a.get("image") or IMAGES.get(a["slug"])
def words(a, l): return len(re.sub(r"<[^>]+>", " ", body_raw(a, l)).split())
def mins(a, l): return max(1, round(words(a, l) / 220))
def body_raw(a, l):
    b = a[l]["body"]
    if a.get("table"): b = b.replace("{TABLE}", stay_table(l))
    return b
def lead_item():
    items = all_items()
    tops = [a for a in items if a.get("top")]
    return tops[0] if tops else items[0]

CSS = """:root{--bg:#f7f3ec;--ink:#1d1b18;--muted:#5f584e;--line:#d9cfbf;--accent:#7a5a2f;--card:#fffdf9;--red:#a3271c}
:root[data-theme=dark]{--bg:#141311;--ink:#ece6da;--muted:#b3aa9b;--line:#3a352e;--accent:#d8b27a;--card:#1d1b18;--red:#ff8a7a}
@media(prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#141311;--ink:#ece6da;--muted:#b3aa9b;--line:#3a352e;--accent:#d8b27a;--card:#1d1b18;--red:#ff8a7a}}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;background:var(--bg);color:var(--ink);font:18px/1.65 Georgia,'Iowan Old Style','Times New Roman',serif}
img{max-width:100%;height:auto}picture{display:block}.lead img{width:100%;aspect-ratio:3/2;object-fit:cover}a{color:inherit;text-underline-offset:3px}a:hover{color:var(--accent)}:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.skip{position:absolute;left:-999px;top:0;background:var(--ink);color:var(--bg);padding:8px 12px;z-index:9}.skip:focus{left:8px}
.sans{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}
.w{max-width:1180px;margin:0 auto;padding:0 16px}.nar{max-width:720px;margin:0 auto}
.bar{display:flex;justify-content:space-between;align-items:center;gap:10px;font:12.5px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:var(--muted);padding:8px 0;border-bottom:1px solid var(--line);flex-wrap:wrap}
.bar .r{display:flex;align-items:center;gap:4px}.bar a,.bar button{text-decoration:none;padding:6px 8px;border-radius:4px;min-height:32px;display:inline-flex;align-items:center}.bar a.on{color:var(--ink);font-weight:700}
.bar button{background:none;border:1px solid var(--line);color:var(--muted);cursor:pointer;font:inherit}
.daily{color:var(--red);font-weight:600}
header.m{border-bottom:3px double var(--ink);padding:16px 0 10px;text-align:center}
.mt{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:clamp(40px,9vw,82px);line-height:1;letter-spacing:.005em;text-decoration:none;display:inline-block}
.tg{font:12.5px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-top:8px}
nav.s{position:relative}nav.s .in{display:flex;gap:20px;overflow-x:auto;white-space:nowrap;padding:10px 0;border-bottom:1px solid var(--line);font:600 14px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;scrollbar-width:none}
nav.s .in::-webkit-scrollbar{display:none}nav.s a{text-decoration:none;padding:4px 0}nav.s a.on{border-bottom:2px solid var(--ink)}
nav.s:after{content:"";position:absolute;right:0;top:0;bottom:1px;width:28px;background:linear-gradient(90deg,transparent,var(--bg));pointer-events:none}
.ticker{display:flex;gap:14px;align-items:baseline;border-bottom:1px solid var(--line);padding:9px 0;font:14px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;overflow-x:auto;white-space:nowrap;scrollbar-width:none}
.ticker b{color:var(--red);text-transform:uppercase;letter-spacing:.08em;font-size:12px}.ticker a{text-decoration:none}.ticker time{color:var(--muted);margin-right:5px;font-variant-numeric:tabular-nums}
.k{font:700 12px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:.09em;text-transform:uppercase;color:var(--accent);margin:0 0 6px}.k a{text-decoration:none}
.badge[hidden]{display:none!important}.badge{display:inline-block;background:var(--red);color:#fff;font:700 10.5px -apple-system,sans-serif;letter-spacing:.08em;text-transform:uppercase;padding:2px 6px;border-radius:3px;margin-right:6px;vertical-align:2px}
h1{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:clamp(34px,6vw,56px);line-height:1.06;margin:.15em 0 .3em}
h2{font-size:23px;line-height:1.3;margin:1.6em 0 .4em}h3{font-size:21px;line-height:1.25;margin:.2em 0 .3em}
.dek{font-size:21px;color:var(--muted);line-height:1.45;margin:0 0 .8em}
.meta{font:13.5px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:var(--muted);border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:9px 0;margin:14px 0 18px;display:flex;flex-wrap:wrap;gap:4px 14px}
.meta b{color:var(--ink)}
.crumbs{font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:var(--muted);margin:18px 0 4px}.crumbs a{text-decoration:none}
figure{margin:0 0 18px}figure img{width:100%;height:auto;display:block;background:var(--line);border-radius:2px}
figcaption{font:13px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:var(--muted);padding-top:7px}figcaption .ai{color:var(--red);font-weight:700}
article p,article li{font-size:19px}article ul,article ol{padding-left:22px}article li{margin:.35em 0}
.dl{font:700 14px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:.06em}
ol.regrets{background:var(--card);border:1px solid var(--line);padding:18px 18px 18px 42px;border-radius:6px}.note{font-size:16px!important;color:var(--muted)}
.toc{background:var(--card);border:1px solid var(--line);border-radius:6px;padding:12px 16px;margin:0 0 20px;font:15px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}.toc b{display:block;margin-bottom:4px}.toc ol{margin:0;padding-left:20px}.toc a{text-decoration:none}
.share{display:flex;flex-wrap:wrap;gap:8px;margin:26px 0 8px;font:14px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;align-items:center}
.share a,.share button{border:1px solid var(--line);background:var(--card);color:var(--ink);padding:8px 12px;border-radius:999px;text-decoration:none;cursor:pointer;font:inherit;min-height:40px}
.src{font:14px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:var(--muted);border-top:1px solid var(--line);margin-top:26px;padding-top:12px}.src ol{padding-left:18px}.src .corr{margin-top:10px}
.tw{overflow-x:auto}table{border-collapse:collapse;width:100%;font:15px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}th{font-weight:600}
.front{display:grid;grid-template-columns:minmax(0,2.1fr) minmax(0,1fr);gap:30px;padding:22px 0;border-bottom:1px solid var(--ink)}
.lead h2{font-family:'Cormorant Garamond',Georgia,serif;font-size:clamp(32px,5vw,50px);line-height:1.05;margin:.15em 0 .3em}.lead h2 a{text-decoration:none}
.side{border-left:1px solid var(--line);padding-left:24px}.side .it{padding:0 0 14px;margin:0 0 14px;border-bottom:1px solid var(--line)}.side .it:last-child{border:0}
.side h3{font-size:19px}.side h3 a,.card h3 a{text-decoration:none}.side p{font-size:15.5px;color:var(--muted);margin:.2em 0}
.when{font:12.5px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:var(--muted)}
.block{padding:22px 0 8px;border-bottom:1px solid var(--line)}.block>.hd{display:flex;justify-content:space-between;align-items:baseline;border-top:3px solid var(--ink);padding-top:8px}
.block>.hd h2{margin:0;font:700 15px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase}.block>.hd a{font:13px -apple-system,sans-serif;color:var(--muted)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:24px;margin:16px 0}
.card a.ph{display:block;margin-bottom:10px}.card img{width:100%;height:auto;aspect-ratio:3/2;object-fit:cover;display:block;background:var(--line);border-radius:2px}
.card p{color:var(--muted);font-size:16px;margin:.3em 0}
.sub{background:#1d1b18;color:#f3ede3;border-radius:6px;padding:22px}.sub h3{color:#f3ede3}.sub p{font-size:16px;color:#d9d0c2}
.sub form{display:flex;gap:8px;flex-wrap:wrap}.sub input{flex:1 1 180px;padding:12px;border-radius:4px;border:0;font:16px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;min-height:46px}
.sub button{padding:12px 16px;border:0;border-radius:4px;background:#d8b27a;color:#1d1b18;font:700 15px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;cursor:pointer;min-height:46px}
.sub small{display:block;margin-top:8px;color:#b9ae9e;font:12px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}.sub .msg{font:14px -apple-system,sans-serif;margin-top:8px}
.sub.in{margin:22px 0;padding:16px}.sub.in h3{font-size:18px;margin:0 0 4px}.sub.in p{margin:0 0 10px}
footer{border-top:3px double var(--ink);margin-top:44px;padding:20px 0 40px;font:13.5px/1.7 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:var(--muted)}footer b{color:var(--ink)}footer .links a{margin-right:14px}
.sec-h{border-bottom:1px solid var(--ink);padding:22px 0 8px}.sec-h p{color:var(--muted);margin:.2em 0 0}
.srch{display:flex;gap:8px;margin:18px 0}.srch input{flex:1;padding:12px;font:17px -apple-system,sans-serif;border:1px solid var(--line);border-radius:4px;background:var(--card);color:var(--ink)}
@media(max-width:820px){.front{grid-template-columns:1fr}.side{border-left:0;padding-left:0;border-top:1px solid var(--line);padding-top:16px}}
@media print{.bar,nav.s,.ticker,.sub,.share,footer .links,.toc{display:none!important}body{background:#fff;color:#000;font-size:12pt}a{text-decoration:none}}"""

THEME_JS = "<script>try{var t=localStorage.getItem('st-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>"

def head(l, title, desc, path_tpl, og_type="website", extra="", image=None, noindex=False):
    alts = "".join(f'<link rel="alternate" hreflang="{x}" href="{BASE}{path_tpl.format(l=x)}">' for x in LANGS)
    alts += f'<link rel="alternate" hreflang="x-default" href="{BASE}{path_tpl.format(l="en")}">'
    url = BASE + path_tpl.format(l=l)
    og = image or (BASE + "/og.png")
    robots = '<meta name="robots" content="noindex">' if noindex else '<meta name="robots" content="max-image-preview:large">'
    return f"""<!doctype html><html lang="{HTML_LANG[l]}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title><meta name="description" content="{esc(desc)}">{robots}<link rel="canonical" href="{url}">{alts}
<meta property="og:site_name" content="The Sumba Times"><meta property="og:type" content="{og_type}"><meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc)}"><meta property="og:url" content="{url}"><meta property="og:locale" content="{OG_LOC[l]}"><meta property="og:image" content="{og}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{og}">
<meta name="theme-color" content="#f7f3ec" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#141311" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/manifest.webmanifest">
<link rel="alternate" type="application/rss+xml" title="The Sumba Times" href="{BASE}/{l}/feed.xml"><link rel="search" type="application/opensearchdescription+xml" title="The Sumba Times" href="/opensearch.xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700&display=swap" rel="stylesheet">
{THEME_JS}<style>{CSS}</style>
<script>(function(c,l,a,r,i,t,y){{c[a]=c[a]||function(){{(c[a].q=c[a].q||[]).push(arguments)}};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);}})(window,document,"clarity","script","{CLARITY}");</script>
{extra}</head><body><a class="skip" href="#main">{X[l]["skip"]}</a>"""

def masthead(l, path_tpl, active=None):
    x = X[l]
    langs = "".join(f'<a href="{path_tpl.format(l=y)}" hreflang="{y}" lang="{y}" class="{"on" if y==l else ""}">{y.upper()}</a>' for y in LANGS)
    nav = "".join(f'<a href="/{l}/{s}/" class="{"on" if s==active else ""}">{esc(sec_name(l,s))}</a>' for s in NAV)
    return f"""<div class="w"><div class="bar"><span><time id="st-today" datetime="{NOW.date().isoformat()}">{today_str(l)}</time> · <span class="daily">{x["daily"]}</span></span>
<span class="r"><a href="/{l}/search/" aria-label="{x["search"]}">&#9906; {x["search"]}</a>{langs}<button type="button" onclick="stTheme()" aria-label="{x["dark"]}">&#9680;</button></span></div>
<header class="m"><a class="mt" href="/{l}/">The Sumba Times</a><div class="tg">{esc(UI[l]["tagline"])}</div></header>
<nav class="s" aria-label="{esc(sec_name(l,'news'))}"><div class="in">{nav}</div></nav></div>
<script>function stTheme(){{var d=document.documentElement,c=d.getAttribute('data-theme'),dark=c?c==='dark':matchMedia('(prefers-color-scheme: dark)').matches,n=dark?'light':'dark';d.setAttribute('data-theme',n);try{{localStorage.setItem('st-theme',n)}}catch(e){{}}}}</script>"""

def subscribe(l, inline=False):
    u = UI[l]
    cls = "sub in" if inline else "sub"
    hid = '' if inline else ' id="subscribe"'
    return f"""<div class="{cls}"{hid}><h3>{u["sub_title"]}</h3><p>{u["sub_text"]}</p>
<form onsubmit="return stSub(event,this)"><input type="email" name="email" required autocomplete="email" placeholder="{esc(u["sub_ph"])}" aria-label="{esc(u["sub_ph"])}"><button type="submit">{u["sub_btn"]}</button></form>
<div class="msg" role="status" aria-live="polite"></div><small>{u["privacy"]}</small></div>"""

def sub_js(l):
    u = UI[l]
    return f"""<script>function stSub(e,f){{e.preventDefault();var m=f.parentNode.querySelector('.msg');var em=f.email.value.trim().toLowerCase();
fetch('{SB_URL}/rest/v1/newsletter_subscribers',{{method:'POST',headers:{{'apikey':'{SB_ANON}','Authorization':'Bearer {SB_ANON}','Content-Type':'application/json','Prefer':'return=minimal'}},body:JSON.stringify({{email:em,name:'The Sumba Times ({l})'}})}})
.then(function(r){{if(r.ok||r.status===409){{m.textContent={json.dumps(u["sub_ok"])};f.reset();try{{clarity('event','subscribe')}}catch(_){{}}}}else{{m.textContent={json.dumps(u["sub_err"])}}}}})
.catch(function(){{m.textContent={json.dumps(u["sub_err"])}}});return false}}
(function(){{var n=new Date(new Date().toLocaleString('en-US',{{timeZone:'Asia/Makassar'}}));var t=n.getFullYear()+'-'+('0'+(n.getMonth()+1)).slice(-2)+'-'+('0'+n.getDate()).slice(-2);
try{{var td=document.getElementById('st-today');if(td)td.textContent=new Intl.DateTimeFormat('{l}',{{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Makassar'}}).format(new Date())}}catch(e){{}}
document.querySelectorAll('[data-date]').forEach(function(el){{if(el.getAttribute('data-date')===t){{el.textContent={json.dumps(X[l]["today"])};el.hidden=false}}}})}})();</script>"""

def footer(l):
    u = UI[l]; x = X[l]
    links = "".join(f'<a href="/{l}/{s}/">{esc(sec_name(l,s))}</a>' for s in NAV)
    return f"""<div class="w"><footer><div class="links">{links}</div><p><b>The Sumba Times</b> · <a href="/{l}/about/">{x["about"]}</a> · <a href="/{l}/feed.xml">{x["rss"]}</a> · <a href="mailto:{CONTACT}">{CONTACT}</a><br>
<a href="https://ecobeachcity.com/" rel="noopener">{u["published_by"]}</a>. {u["disclosure"]}<br>© {NOW.year} The Sumba Times</p></footer></div>{sub_js(l)}</body></html>"""

def picture(a, l, sizes="(max-width: 820px) 100vw, 760px", eager=False, cap=True):
    im = img_of(a)
    if not im: return ""
    s = a["slug"]
    alt = im["caption"][l]
    load = 'fetchpriority="high" loading="eager"' if eager else 'loading="lazy" decoding="async"'
    pic = f'<picture><source type="image/webp" srcset="/img/{s}-640.webp 640w, /img/{s}-1280.webp {im["w"]}w" sizes="{sizes}"><img src="/img/{s}-1280.webp" width="{im["w"]}" height="{im["h"]}" alt="{esc(alt)}" {load}></picture>'
    if not cap: return pic
    x = X[l]
    if im.get("ai"):
        credit = f'<span class="ai">{x["ai"]}</span>'
    else:
        lic = f'<a href="{esc(im["license_url"])}" rel="license noopener" target="_blank">{esc(im["license"])}</a>' if im.get("license_url") else esc(im.get("license", ""))
        credit = f'{x["photo"]}: <a href="{esc(im["page"])}" rel="noopener" target="_blank">{esc(im["credit"])}</a> ({lic})'
    return f'<figure>{pic}<figcaption>{esc(alt)} {credit}</figcaption></figure>'

def thumb(a, l):
    im = img_of(a)
    if not im: return ""
    s = a["slug"]
    return f'<a class="ph" href="{url_of(a,l)}" tabindex="-1" aria-hidden="true"><img src="/img/{s}-640.webp" width="640" height="427" alt="" loading="lazy" decoding="async"></a>'

def kicker(a, l):
    c = a[l]
    return c.get("kicker") or sec_name(l, group_of(a))

def badge(a):
    return f'<span class="badge" data-date="{a["date"]}" hidden></span>'

def card(a, l, img=True):
    c = a[l]
    return f'<div class="card">{thumb(a,l) if img else ""}<p class="k">{badge(a)}<a href="/{l}/{group_of(a)}/">{esc(kicker(a,l))}</a></p><h3><a href="{url_of(a,l)}">{esc(c["title"])}</a></h3><p>{esc(c["dek"])}</p><div class="when"><time datetime="{iso(a)}">{fdate(a,l,False)}</time> · {mins(a,l)} {X[l]["min"]}</div></div>'

def write(p, s):
    fp = os.path.join(OUT, p.lstrip("/"))
    if fp.endswith("/"): fp += "index.html"
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    open(fp, "w", encoding="utf-8").write(s)

def slugify(t):
    t = re.sub(r"<[^>]+>", "", t).lower()
    t = re.sub(r"[^a-z0-9À-ɏ]+", "-", t).strip("-")
    return t[:60] or "s"

def with_toc(b, l):
    hs = re.findall(r"<h2>(.*?)</h2>", b)
    ids = []
    def rep(m):
        i = slugify(m.group(1)); 
        while i in ids: i += "-2"
        ids.append(i)
        return f'<h2 id="{i}">{m.group(1)}</h2>'
    b2 = re.sub(r"<h2>(.*?)</h2>", rep, b)
    if len(hs) < 3: return b2, ""
    toc = f'<nav class="toc" aria-label="{X[l]["toc"]}"><b>{X[l]["toc"]}</b><ol>' + "".join(f'<li><a href="#{i}">{h}</a></li>' for i, h in zip(ids, hs)) + "</ol></nav>"
    return b2, toc

def inline_sub(b, l):
    parts = b.split("</p>")
    if len(parts) < 7: return b
    return "</p>".join(parts[:3]) + "</p>" + subscribe(l, True) + "</p>".join(parts[3:])

def share(a, l):
    x = X[l]; u = BASE + url_of(a, l); t = a[l]["title"]
    from urllib.parse import quote
    qu, qt = quote(u, safe=""), quote(t, safe="")
    return f"""<div class="share" aria-label="{x["share"]}"><b>{x["share"]}:</b>
<a href="https://wa.me/?text={qt}%20{qu}" target="_blank" rel="noopener" onclick="try{{clarity('event','share_wa')}}catch(e){{}}">WhatsApp</a>
<a href="https://twitter.com/intent/tweet?url={qu}&text={qt}" target="_blank" rel="noopener">X</a>
<a href="https://www.facebook.com/sharer/sharer.php?u={qu}" target="_blank" rel="noopener">Facebook</a>
<a href="https://www.linkedin.com/sharing/share-offsite/?url={qu}" target="_blank" rel="noopener">LinkedIn</a>
<a href="mailto:?subject={qt}&body={qu}">Email</a>
<button type="button" onclick="var b=this;if(navigator.share){{navigator.share({{title:{esc(json.dumps(t))},url:'{u}'}}).catch(function(){{}})}}else{{navigator.clipboard.writeText('{u}').then(function(){{b.textContent={esc(json.dumps(x['copied']))}}})}}">{x["copy"]}</button></div>"""

def related(a, l):
    items = [b for b in all_items() if b is not a]
    same = [b for b in items if group_of(b) == group_of(a)]
    rest = [b for b in items if b not in same]
    pick = (same + rest)[:3]
    return f'<section class="block"><div class="hd"><h2>{X[l]["related"]}</h2></div><div class="grid">{"".join(card(b,l) for b in pick)}</div></section>'

def article_page(a, l):
    u = UI[l]; c = a[l]; x = X[l]
    tpl = "/{l}/" + a["section"] + "/" + a["slug"] + "/"
    url = BASE + tpl.format(l=l)
    im = img_of(a)
    og = f"{BASE}/og/{a['slug']}.jpg" if im else None
    imgs = [og, f"{BASE}/img/{a['slug']}-1280.webp"] if im else [BASE + "/og.png"]
    grp = group_of(a)
    ld = [{"@context": "https://schema.org", "@type": "NewsArticle", "headline": c["title"][:110], "description": c["dek"], "inLanguage": l,
           "datePublished": iso(a), "dateModified": iso(a), "mainEntityOfPage": url, "image": imgs, "articleSection": sec_name(l, grp), "wordCount": words(a, l),
           "author": {"@type": "Organization", "name": "The Sumba Times", "url": BASE + f"/{l}/about/"},
           "publisher": {"@type": "Organization", "name": "The Sumba Times", "logo": {"@type": "ImageObject", "url": BASE + "/apple-touch-icon.png"}, "parentOrganization": {"@type": "Organization", "name": "Eco Beach City", "url": "https://ecobeachcity.com"}}},
          {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
              {"@type": "ListItem", "position": 1, "name": x["home"], "item": BASE + f"/{l}/"},
              {"@type": "ListItem", "position": 2, "name": sec_name(l, grp), "item": BASE + f"/{l}/{grp}/"},
              {"@type": "ListItem", "position": 3, "name": c["title"], "item": url}]}]
    extra = f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script><meta property="article:published_time" content="{iso(a)}"><meta property="article:section" content="{esc(sec_name(l,grp))}">'
    s = head(l, c["title"] + " · The Sumba Times", c["dek"], tpl, "article", extra, og) + masthead(l, tpl, grp)
    srcs = "".join(f'<li><a href="{esc(h)}" rel="nofollow noopener" target="_blank">{esc(t)}</a></li>' for t, h in a.get("sources", []))
    b, toc = with_toc(body_raw(a, l), l)
    if a.get("dateline"):
        b = re.sub(r"^<p>", f'<p><span class="dl">{esc(a["dateline"])} —</span> ', b, count=1)
    if kind_of(a) != "letter": b = inline_sub(b, l)
    crumbs = f'<div class="crumbs"><a href="/{l}/">{x["home"]}</a> › <a href="/{l}/{grp}/">{esc(sec_name(l,grp))}</a></div>'
    s += f"""<main id="main" class="w"><article class="nar">{crumbs}<p class="k">{badge(a)}{esc(kicker(a,l))}</p>
<h1>{esc(c["title"])}</h1><p class="dek">{esc(c["dek"])}</p>
<div class="meta"><span><b>{x["desk"]}</b></span><span>{x["pub"]} <time datetime="{iso(a)}">{fdate(a,l)}</time></span><span>{mins(a,l)} {x["min"]}</span></div>
{picture(a,l,eager=True)}{toc}{b}{share(a,l)}
<div class="src"><b>{u["sources"]}</b><ol>{srcs}</ol><p class="corr">{x["corr"]} <a href="mailto:{CONTACT}">{CONTACT}</a>.</p></div>
<div style="margin-top:26px">{subscribe(l)}</div></article>{related(a,l)}</main>""" + footer(l)
    write(tpl.format(l=l), s)

def section_page(sec, l):
    x = X[l]; tpl = "/{l}/" + sec + "/"
    if sec == "guides": items = [a for a in all_items() if kind_of(a) == "guide"]
    elif sec in LEGACY: items = [a for a in all_items() if a["section"] == sec]
    else: items = [a for a in all_items() if group_of(a) == sec]
    s = head(l, sec_name(l, sec) + " · The Sumba Times", sec_desc(l, sec), tpl) + masthead(l, tpl, GROUP.get(sec, sec))
    grid = "".join(card(a, l) for a in items) or f'<p>{UI[l]["coming"]}</p>'
    s += f'<main id="main" class="w"><div class="sec-h"><h1>{esc(sec_name(l,sec))}</h1><p>{esc(sec_desc(l,sec))}</p></div><div class="grid">{grid}</div>'
    if sec == "low-tide": s += f'<div class="nar">{subscribe(l)}</div>'
    s += '</main>' + footer(l)
    write(tpl.format(l=l), s)

def home(l):
    u = UI[l]; x = X[l]; tpl = "/{l}/"
    items = all_items()
    top = lead_item()
    news = [a for a in items if a is not top and kind_of(a) == "brief"]
    side = news[:5]
    ticker = "".join(f'<a href="{url_of(a,l)}"><time datetime="{iso(a)}">{dt(a).strftime("%d/%m %H:%M")}</time>{esc(a[l]["title"])}</a>' for a in items if kind_of(a) == "brief")
    ld = [{"@context": "https://schema.org", "@type": "WebSite", "name": "The Sumba Times", "url": BASE + f"/{l}/", "inLanguage": l,
           "potentialAction": {"@type": "SearchAction", "target": BASE + f"/{l}/search/?q={{search_term_string}}", "query-input": "required name=search_term_string"}},
          {"@context": "https://schema.org", "@type": "NewsMediaOrganization", "name": "The Sumba Times", "url": BASE, "logo": BASE + "/apple-touch-icon.png",
           "publishingPrinciples": BASE + f"/{l}/about/", "parentOrganization": {"@type": "Organization", "name": "Eco Beach City", "url": "https://ecobeachcity.com"}}]
    s = head(l, "The Sumba Times · " + u["tagline"], x["daily"] + ". " + u["tagline"] + ".", tpl, extra=f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>') + masthead(l, tpl)
    sidehtml = "".join(f'<div class="it"><p class="k">{badge(a)}<a href="/{l}/{group_of(a)}/">{esc(kicker(a,l))}</a></p><h3><a href="{url_of(a,l)}">{esc(a[l]["title"])}</a></h3><p>{esc(a[l]["dek"])}</p><div class="when"><time datetime="{iso(a)}">{fdate(a,l)}</time></div></div>' for a in side)
    s += f"""<main id="main" class="w"><div class="ticker" aria-label="{x["ticker"]}"><b>{x["ticker"]}</b>{ticker}</div>
<section class="front"><div class="lead"><p class="k">{badge(top)}{x["top_story"]} · <a href="/{l}/{group_of(top)}/">{esc(sec_name(l,group_of(top)))}</a></p>
<a href="{url_of(top,l)}" tabindex="-1" aria-hidden="true" style="display:block">{picture(top,l,"(max-width: 820px) 100vw, 780px",eager=True,cap=False)}</a>
<h2><a href="{url_of(top,l)}">{esc(top[l]["title"])}</a></h2><p class="dek">{esc(top[l]["dek"])}</p><div class="when">{x["desk"]} · <time datetime="{iso(top)}">{fdate(top,l)}</time></div></div>
<aside class="side">{sidehtml}</aside></section>"""
    for sec in ["news", "travel", "business", "culture", "living", "projects"]:
        its = [a for a in items if group_of(a) == sec and a is not top and a not in side][:3]
        if len(its) < 3:
            extra_its = [a for a in items if group_of(a) == sec and a is not top and a not in its][:3 - len(its)]
            its += extra_its
        if not its: continue
        s += f'<section class="block"><div class="hd"><h2>{esc(sec_name(l,sec))}</h2><a href="/{l}/{sec}/">{x["all"]} {esc(sec_name(l,sec))} →</a></div><div class="grid">{"".join(card(a,l) for a in its)}</div></section>'
    guides = [a for a in items if kind_of(a) == "guide"]
    s += f'<section class="block"><div class="hd"><h2>{x["guides_t"]}</h2><a href="/{l}/guides/">{esc(sec_name(l,"guides"))} →</a></div><div class="grid">{"".join(card(a,l) for a in guides[:6])}</div></section>'
    s += f'<section class="block"><div class="hd"><h2>{x["lt_t"]}</h2><a href="/{l}/low-tide/">{esc(sec_name(l,"low-tide"))} →</a></div><div class="front" style="border:0"><div>{card(LETTER,l)}</div><div>{subscribe(l)}</div></div></section>'
    s += "</main>" + footer(l)
    write(tpl.format(l=l), s)

def about(l):
    x = X[l]; tpl = "/{l}/about/"
    s = head(l, x["about_title"] + " · The Sumba Times", x["daily"] + ".", tpl) + masthead(l, tpl)
    s += f'<main id="main" class="w"><article class="nar"><h1>{x["about_title"]}</h1>{x["about_body"]}</article></main>' + footer(l)
    write(tpl.format(l=l), s)

def search_page(l):
    x = X[l]; tpl = "/{l}/search/"
    idx = [{"t": a[l]["title"], "d": a[l]["dek"], "u": url_of(a, l), "s": sec_name(l, group_of(a)), "x": re.sub(r"<[^>]+>", " ", body_raw(a, l))[:4000]} for a in all_items()]
    write(f"/{l}/search.json", json.dumps(idx, ensure_ascii=False))
    s = head(l, x["search"] + " · The Sumba Times", x["search_ph"], tpl, noindex=True) + masthead(l, tpl)
    s += f"""<main id="main" class="w"><div class="nar"><h1>{x["search"]}</h1><form class="srch" role="search" onsubmit="event.preventDefault();go()"><input id="q" type="search" placeholder="{esc(x["search_ph"])}" aria-label="{esc(x["search_ph"])}" autofocus></form><div id="res"></div></div></main>
<script>var IX=null;function norm(s){{return s.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'')}}
function go(){{var q=norm(document.getElementById('q').value.trim());if(!q)return;history.replaceState(null,'','?q='+encodeURIComponent(q));try{{clarity('event','search')}}catch(e){{}}
var p=IX?Promise.resolve(IX):fetch('/{l}/search.json').then(function(r){{return r.json()}}).then(function(j){{IX=j;return j}});
p.then(function(ix){{var ws=q.split(/\\s+/),out=ix.map(function(a){{var h=norm(a.t+' '+a.d+' '+a.x),sc=0;ws.forEach(function(w){{if(h.indexOf(w)>-1)sc+=(norm(a.t).indexOf(w)>-1?3:1)}});return [sc,a]}}).filter(function(z){{return z[0]>0}}).sort(function(a,b){{return b[0]-a[0]}});
var r=document.getElementById('res');r.innerHTML=out.length?'':'<p>{x["search_none"]}</p>';out.forEach(function(z){{var a=z[1],d=document.createElement('div');d.className='card';d.style.margin='0 0 20px';d.innerHTML='<p class="k"></p><h3><a></a></h3><p></p>';d.querySelector('.k').textContent=a.s;var A=d.querySelector('a');A.href=a.u;A.textContent=a.t;d.querySelectorAll('p')[1].textContent=a.d;r.appendChild(d)}})}})}}
var q0=new URLSearchParams(location.search).get('q');if(q0){{document.getElementById('q').value=q0;go()}}</script>""" + footer(l)
    write(tpl.format(l=l), s)

def notfound(l):
    x = X[l]; tpl = "/{l}/404.html"
    s = head(l, x["nf"] + " · The Sumba Times", x["nf_t"], "/{l}/", noindex=True) + masthead(l, "/{l}/")
    s += f'<main id="main" class="w"><div class="nar" style="padding:40px 0"><h1>{x["nf"]}</h1><p>{x["nf_t"]}</p><p><a href="/{l}/">{x["back"]}</a> · <a href="/{l}/search/">{x["search"]}</a></p></div></main>' + footer(l)
    write(f"/{l}/404.html", s)

def feed(l):
    its = ""
    for a in all_items():
        im = img_of(a)
        enc = f'<enclosure url="{BASE}/img/{a["slug"]}-1280.webp" type="image/webp" length="0"/>' if im else ""
        its += f"<item><title>{esc(a[l]['title'])}</title><link>{BASE}{url_of(a,l)}</link><guid>{BASE}{url_of(a,l)}</guid><description>{esc(a[l]['dek'])}</description><category>{esc(sec_name(l,group_of(a)))}</category><pubDate>{dt(a).strftime('%a, %d %b %Y %H:%M:00 +0800')}</pubDate>{enc}</item>"
    write(f"/{l}/feed.xml", f'<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>The Sumba Times</title><link>{BASE}/{l}/</link><description>{esc(UI[l]["tagline"])}</description><language>{l}</language>{its}</channel></rss>')

def root():
    s = """<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Sumba Times · News, culture and travel from Sumba, Indonesia</title>
<meta name="description" content="News, travel, business and life on the island of Sumba, Indonesia. New stories every morning at 6:00 Sumba time. In English, Spanish and Indonesian."><link rel="canonical" href="https://thesumbatimes.com/en/">
<link rel="alternate" hreflang="en" href="https://thesumbatimes.com/en/"><link rel="alternate" hreflang="es" href="https://thesumbatimes.com/es/"><link rel="alternate" hreflang="id" href="https://thesumbatimes.com/id/"><link rel="alternate" hreflang="x-default" href="https://thesumbatimes.com/">
<script>(function(){var l=(navigator.language||'en').slice(0,2).toLowerCase();var t=l==='es'?'/es/':(l==='id'||l==='ms')?'/id/':'/en/';location.replace(t)})();</script>
<style>body{font:18px Georgia,serif;background:#f7f3ec;color:#1d1b18;text-align:center;padding:15vh 16px}a{margin:0 10px}</style></head>
<body><h1>The Sumba Times</h1><p><a href="/en/">English</a><a href="/es/">Español</a><a href="/id/">Bahasa Indonesia</a></p></body></html>"""
    write("/", s)

def sitemaps():
    urls = []
    def add(tpl, lastmod=None):
        alts = "".join(f'<xhtml:link rel="alternate" hreflang="{x}" href="{BASE}{tpl.format(l=x)}"/>' for x in LANGS)
        lm = f"<lastmod>{lastmod}</lastmod>" if lastmod else ""
        for l in LANGS: urls.append(f"<url><loc>{BASE}{tpl.format(l=l)}</loc>{lm}{alts}</url>")
    add("/{l}/", NOW.date().isoformat())
    for s in NAV + LEGACY: add("/{l}/" + s + "/")
    add("/{l}/about/")
    for a in all_items(): add("/{l}/" + a["section"] + "/" + a["slug"] + "/", a["date"])
    write("/sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' + "".join(urls) + "</urlset>")
    news = []
    for a in all_items():
        if kind_of(a) == "guide": continue
        if (NOW - dt(a)).total_seconds() > 2 * 86400: continue
        for l in LANGS:
            news.append(f'<url><loc>{BASE}{url_of(a,l)}</loc><news:news><news:publication><news:name>The Sumba Times</news:name><news:language>{l}</news:language></news:publication><news:publication_date>{iso(a)}</news:publication_date><news:title>{esc(a[l]["title"])}</news:title></news:news></url>')
    write("/news-sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">' + "".join(news) + "</urlset>")
    write("/robots.txt", "User-agent: *\nAllow: /\nDisallow: /*/search/\nSitemap: https://thesumbatimes.com/sitemap.xml\nSitemap: https://thesumbatimes.com/news-sitemap.xml\n")

def assets():
    write("/favicon.svg", '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="10" fill="#1d1b18"/><text x="32" y="45" font-family="Georgia,serif" font-size="38" text-anchor="middle" fill="#f7f3ec">S</text></svg>')
    write("/manifest.webmanifest", json.dumps({"name": "The Sumba Times", "short_name": "Sumba Times", "start_url": "/", "display": "standalone", "background_color": "#f7f3ec", "theme_color": "#1d1b18",
        "icons": [{"src": "/apple-touch-icon.png", "sizes": "180x180", "type": "image/png"}, {"src": "/favicon.svg", "sizes": "any", "type": "image/svg+xml"}]}))
    write("/opensearch.xml", '<?xml version="1.0" encoding="UTF-8"?><OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/"><ShortName>The Sumba Times</ShortName><Description>Search The Sumba Times</Description><Url type="text/html" template="https://thesumbatimes.com/en/search/?q={searchTerms}"/></OpenSearchDescription>')
    nf = """<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Not found · The Sumba Times</title><meta name="robots" content="noindex"><style>body{font:18px Georgia,serif;background:#f7f3ec;color:#1d1b18;text-align:center;padding:15vh 16px}</style></head><body><h1>The Sumba Times</h1><p>Page not found. <a href="/en/">Front page</a></p></body></html>"""
    write("/404.html", nf)

    try:
        from PIL import Image, ImageDraw, ImageFont
        fp = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
        def font(n):
            try: return ImageFont.truetype(fp, n)
            except Exception: return ImageFont.load_default()
        im = Image.new("RGB", (180, 180), (29, 27, 24)); d = ImageDraw.Draw(im)
        f = font(120); w = d.textlength("S", font=f); d.text(((180 - w) / 2, 18), "S", font=f, fill=(247, 243, 236))
        os.makedirs(OUT, exist_ok=True); im.save(os.path.join(OUT, "apple-touch-icon.png"))
        og = Image.new("RGB", (1200, 630), (247, 243, 236)); d = ImageDraw.Draw(og)
        f = font(96); t = "The Sumba Times"; w = d.textlength(t, font=f); d.text(((1200 - w) / 2, 230), t, font=f, fill=(29, 27, 24))
        d.line([(200, 370), (1000, 370)], fill=(29, 27, 24), width=3)
        f2 = font(34); t2 = "News, travel and life on Sumba, Indonesia"; w2 = d.textlength(t2, font=f2); d.text(((1200 - w2) / 2, 395), t2, font=f2, fill=(95, 88, 78))
        og.save(os.path.join(OUT, "og.png"))
    except Exception as e:
        print("icons skipped:", e)

if __name__ == "__main__":
    shutil.rmtree(OUT, ignore_errors=True)
    for l in LANGS:
        home(l); feed(l); about(l); search_page(l); notfound(l)
        for s in NAV + LEGACY: section_page(s, l)
        for a in all_items(): article_page(a, l)
    root(); sitemaps(); assets()
    n = sum(len(f) for _, _, f in os.walk(OUT)); print("files", n)
