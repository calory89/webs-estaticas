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
from travel import SLUGS, T, N, AI, HERO_IMG, BASE_PLACES, load_guides, candidate_image
_GUIDES = load_guides()
try:
    from brief_meta import BRIEF_META
except Exception:
    BRIEF_META = {}
def _merge_meta(items):
    for a in items:
        m = BRIEF_META.get(a["slug"])
        if not m: continue
        for k, v in m.items():
            if k in ("en", "es", "id"):
                for kk, vv in v.items(): a[k].setdefault(kk, vv)
            elif k == "extra_sources":
                have = {u for _, u in a.get("sources", [])}
                a["sources"] = a.get("sources", []) + [s_ for s_ in v if s_[1] not in have]
            else:
                a.setdefault(k, v)
_merge_meta(BRIEFS); _merge_meta(ARTICLES)
_have = {a["slug"] for a in ARTICLES}
ARTICLES = ARTICLES + [g for g in _GUIDES if g["slug"] not in _have]

BASE = "https://thesumbatimes.com"
INDEXNOW = "7f3c1e9a5b2d4c8e9f0a1b2c3d4e5f60"   # public IndexNow key (served at /<key>.txt)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
CLARITY = "z9xpaay63s"
SB_URL = "https://oykcsmextclpdnugixqz.supabase.co"
SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw"
CONTACT = "info@ecobeachcity.com"
WITA = datetime.timezone(datetime.timedelta(hours=8))
NOW = datetime.datetime.now(WITA)

NAV = ["news", "travel", "business", "culture", "living", "projects", "guides", "low-tide", "plan"]
GROUP = {"getting-here": "travel", "things-to-do": "travel", "where-to-stay": "travel", "places": "travel"}
LEGACY = ["getting-here", "things-to-do", "where-to-stay", "places"]
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
        "sdesc": {"travel": "Travel guides to Sumba: getting here, getting around, when to go, what it costs and the beaches, villages and waterfalls worth the drive.", "business": "Land rules for foreigners, infrastructure, budgets, tourism figures and the economy of the island.", "living": "Healthcare, schools, visas, cost of living, safety and seasons for people who live here.", "guides": "Our evergreen guides to Sumba: how to get here, culture, beaches, where to stay and what is being built.", "culture": "Marapu, the Pasola, ikat weaving and the traditional villages of Sumba."},
        "daily": "New stories every morning at 6:00 Sumba time (WITA)", "desk": "By The Sumba Times desk", "pub": "Published", "upd": "Updated",
        "min": "min read", "ticker": "Latest", "today": "Today", "newest": "New", "toc": "In this article", "share": "Share", "copy": "Copy link", "copied": "Link copied",
        "related": "Related stories", "search": "Search", "search_ph": "Search The Sumba Times", "search_none": "No stories found.", "photo": "Photo", "ai": "AI-generated illustration",
        "license": "licence", "corr": "Spotted an error? Write to", "about": "About us", "guides_t": "Essential guides", "more_sec": "More in", "home": "Home", "skip": "Skip to content",
        "dark": "Dark mode", "top_story": "Top story", "rss": "RSS", "nf": "Page not found", "nf_t": "This page does not exist or has moved.", "back": "Back to the front page",
        "lt_t": "Low Tide, the weekly letter", "all": "All stories in", "brief": "Brief",
        "about_title": "About The Sumba Times",
        "about_body": "<p>The Sumba Times covers news, travel, business and everyday life on the island of Sumba, in East Nusa Tenggara, Indonesia, in English, Spanish and Indonesian. New stories are published every morning at 6:00 Sumba time (WITA).</p><h2>Who publishes it</h2><p>The Sumba Times is published by Eco Beach City, which operates Villa Eco Beach on Sumba. We say so on every page. We cover the whole island, including other hotels, projects and businesses, and we do not report on Eco Beach City's own commercial or legal matters.</p><h2>Our standards</h2><ul><li>Every story is based on named, linked sources: local and national media, official agencies and regency governments.</li><li>We do not invent facts. When a number comes from a single source, we say so.</li><li>No paid placements. No rankings with our publisher first.</li><li>Photos are real and credited with their licence. If we ever use an AI-generated illustration, it is labelled as such and never shows real people, sacred rituals or other hotels.</li></ul><h2>Corrections</h2><p>If you spot an error, write to " + CONTACT + " and we will correct it and note the change.</p>"},
 "es": {"sec": {"news": "Noticias", "travel": "Viajar", "business": "Negocios e inversión", "culture": "Cultura", "living": "Vivir en Sumba", "projects": "Proyectos", "guides": "Guías", "low-tide": "Marea baja"},
        "sdesc": {"travel": "Guías de viaje de Sumba: cómo llegar, cómo moverse, cuándo ir, cuánto cuesta y las playas, pueblos y cascadas que merecen el viaje.", "business": "Normas sobre la tierra para extranjeros, infraestructuras, presupuestos, cifras de turismo y la economía de la isla.", "living": "Sanidad, colegios, visados, coste de vida, seguridad y estaciones para quien vive aquí.", "guides": "Nuestras guías de Sumba: cómo llegar, cultura, playas, dónde dormir y qué se está construyendo.", "culture": "Marapu, la Pasola, los tejidos ikat y los pueblos tradicionales de Sumba."},
        "daily": "Noticias nuevas cada mañana a las 6:00, hora de Sumba (WITA)", "desk": "Por la redacción de The Sumba Times", "pub": "Publicado", "upd": "Actualizado",
        "min": "min de lectura", "ticker": "Última hora", "today": "Hoy", "newest": "Nuevo", "toc": "En este artículo", "share": "Compartir", "copy": "Copiar enlace", "copied": "Enlace copiado",
        "related": "Noticias relacionadas", "search": "Buscar", "search_ph": "Buscar en The Sumba Times", "search_none": "No hay resultados.", "photo": "Foto", "ai": "Ilustración generada con IA",
        "license": "licencia", "corr": "¿Has visto un error? Escribe a", "about": "Quiénes somos", "guides_t": "Guías esenciales", "more_sec": "Más en", "home": "Portada", "skip": "Ir al contenido",
        "dark": "Modo oscuro", "top_story": "Noticia principal", "rss": "RSS", "nf": "Página no encontrada", "nf_t": "Esta página no existe o ha cambiado de dirección.", "back": "Volver a la portada",
        "lt_t": "Marea baja, la carta semanal", "all": "Todas las noticias de", "brief": "Breve",
        "about_title": "Sobre The Sumba Times",
        "about_body": "<p>The Sumba Times cuenta las noticias, los viajes, los negocios y la vida diaria de la isla de Sumba, en Nusa Tenggara Oriental (Indonesia), en inglés, español e indonesio. Publicamos noticias nuevas cada mañana a las 6:00, hora de Sumba (WITA).</p><h2>Quién lo publica</h2><p>The Sumba Times lo publica Eco Beach City, que gestiona Villa Eco Beach en Sumba. Lo decimos en todas las páginas. Cubrimos toda la isla, incluidos otros hoteles, proyectos y negocios, y no informamos sobre los asuntos comerciales o legales de Eco Beach City.</p><h2>Nuestras normas</h2><ul><li>Cada noticia se basa en fuentes con nombre y enlace: medios locales y nacionales, organismos oficiales y gobiernos de las regencias.</li><li>No inventamos datos. Cuando una cifra viene de una sola fuente, lo decimos.</li><li>Sin contenidos pagados. Sin rankings con nuestro editor en primer lugar.</li><li>Las fotos son reales y llevan su autor y licencia. Si alguna vez usamos una ilustración generada con IA, lo indicamos y nunca muestra personas reales, rituales sagrados ni otros hoteles.</li></ul><h2>Correcciones</h2><p>Si ves un error, escribe a " + CONTACT + " y lo corregiremos indicando el cambio.</p>"},
 "id": {"sec": {"news": "Berita", "travel": "Wisata", "business": "Bisnis & investasi", "culture": "Budaya", "living": "Tinggal di Sumba", "projects": "Proyek", "guides": "Panduan", "low-tide": "Air Surut"},
        "sdesc": {"travel": "Panduan wisata Sumba: cara ke sana, transportasi, waktu terbaik, biaya, serta pantai, kampung adat dan air terjun yang layak dikunjungi.", "business": "Aturan tanah bagi warga asing, infrastruktur, anggaran daerah, data pariwisata dan ekonomi pulau.", "living": "Kesehatan, sekolah, visa, biaya hidup, keamanan dan musim bagi yang tinggal di sini.", "guides": "Panduan kami tentang Sumba: cara ke sini, budaya, pantai, tempat menginap dan apa yang sedang dibangun.", "culture": "Marapu, Pasola, tenun ikat dan kampung adat Sumba."},
        "daily": "Berita baru setiap pagi pukul 06.00 waktu Sumba (WITA)", "desk": "Oleh redaksi The Sumba Times", "pub": "Terbit", "upd": "Diperbarui",
        "min": "menit baca", "ticker": "Terbaru", "today": "Hari ini", "newest": "Baru", "toc": "Dalam artikel ini", "share": "Bagikan", "copy": "Salin tautan", "copied": "Tautan disalin",
        "related": "Berita terkait", "search": "Cari", "search_ph": "Cari di The Sumba Times", "search_none": "Tidak ada hasil.", "photo": "Foto", "ai": "Ilustrasi buatan AI",
        "license": "lisensi", "corr": "Menemukan kesalahan? Tulis ke", "about": "Tentang kami", "guides_t": "Panduan utama", "more_sec": "Lainnya di", "home": "Beranda", "skip": "Langsung ke isi",
        "dark": "Mode gelap", "top_story": "Berita utama", "rss": "RSS", "nf": "Halaman tidak ditemukan", "nf_t": "Halaman ini tidak ada atau sudah dipindahkan.", "back": "Kembali ke beranda",
        "lt_t": "Air Surut, surat mingguan", "all": "Semua berita di", "brief": "Kabar singkat",
        "about_title": "Tentang The Sumba Times",
        "about_body": "<p>The Sumba Times memberitakan kabar, wisata, bisnis dan kehidupan sehari-hari di Pulau Sumba, Nusa Tenggara Timur, Indonesia, dalam bahasa Inggris, Spanyol dan Indonesia. Berita baru terbit setiap pagi pukul 06.00 waktu Sumba (WITA).</p><h2>Siapa penerbitnya</h2><p>The Sumba Times diterbitkan oleh Eco Beach City, pengelola Villa Eco Beach di Sumba. Kami menyebutkannya di setiap halaman. Kami meliput seluruh pulau, termasuk hotel, proyek dan usaha lain, dan tidak memberitakan urusan komersial atau hukum Eco Beach City sendiri.</p><h2>Standar kami</h2><ul><li>Setiap berita berdasar sumber yang jelas dan bertautan: media lokal dan nasional, lembaga resmi dan pemerintah kabupaten.</li><li>Kami tidak mengarang fakta. Jika suatu angka hanya dari satu sumber, kami menyebutkannya.</li><li>Tanpa konten berbayar. Tanpa peringkat yang menempatkan penerbit kami di urutan pertama.</li><li>Foto adalah foto asli dan mencantumkan pembuat serta lisensinya. Jika kami memakai ilustrasi buatan AI, kami menandainya dan ilustrasi itu tidak menampilkan orang nyata, ritual sakral atau hotel lain.</li></ul><h2>Koreksi</h2><p>Jika menemukan kesalahan, tulis ke " + CONTACT + " dan kami akan memperbaikinya serta mencatat perubahannya.</p>"},
}

for _l in X: X[_l]["sec"]["plan"] = T[_l]["plan"]
X["en"]["sec"]["places"] = "Places"; X["es"]["sec"]["places"] = "Lugares"; X["id"]["sec"]["places"] = "Tempat"
X["en"]["sdesc"]["places"] = "Every beach, waterfall, hill and traditional village of Sumba worth the drive: how to get there, when to go and how to visit with respect."
X["es"]["sdesc"]["places"] = "Cada playa, cascada, colina y pueblo tradicional de Sumba que merece el viaje: cómo llegar, cuándo ir y cómo visitarlo con respeto."
X["id"]["sdesc"]["places"] = "Setiap pantai, air terjun, bukit dan kampung adat di Sumba yang layak dikunjungi: cara ke sana, waktu terbaik dan cara berkunjung dengan hormat."
X["en"]["sdesc"]["projects"] = "New hotels, roads, ports and developments on Sumba: what is being built across the island, by whom and what it means."
X["es"]["sdesc"]["projects"] = "Nuevos hoteles, carreteras, puertos y desarrollos en Sumba: qué se construye en la isla, quién lo hace y qué supone."
X["id"]["sdesc"]["projects"] = "Hotel, jalan, pelabuhan dan pembangunan baru di Sumba: apa yang dibangun di seluruh pulau, oleh siapa dan apa dampaknya."
def esc(s): return html.escape(str(s), quote=True)
SUF = " · The Sumba Times"
def seo_title(t):
    """Keep <title> under ~65 chars: drop the subtitle after a colon, then the brand suffix, then cut on a word."""
    if not t.endswith(SUF) or len(t) <= 65: return t if len(t) <= 70 else t[:67].rsplit(" ", 1)[0] + "…"
    core = t[:-len(SUF)]
    if ":" in core and len(core.split(":")[0]) >= 18: core = core.split(":")[0]
    if len(core) + len(SUF) <= 65: return core + SUF
    return core if len(core) <= 70 else core[:67].rsplit(" ", 1)[0] + "…"
def seo_desc(d):
    d = re.sub(r"\s+", " ", d).strip()
    return d if len(d) <= 158 else d[:155].rsplit(" ", 1)[0].rstrip(",;:") + "…"
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

def url_slug(t):
    import unicodedata
    t = unicodedata.normalize("NFD", t.lower()); t = "".join(ch for ch in t if unicodedata.category(ch) != "Mn")
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return t[:70].rsplit("-", 1)[0] if len(t) > 70 else t
def slug_l(a, l):
    if l == "en": return a["slug"]
    s_ = (a.get("slugs") or {}).get(l) or SLUGS.get(a["slug"], {}).get(l)
    if s_: return s_
    if a.get("kind") == "brief" and a.get(l, {}).get("title"): return url_slug(a[l]["title"])
    return a["slug"]
def url_of(a, l): return f"/{l}/{a['section']}/{slug_l(a, l)}/"
def paths_of(a): return {x: url_of(a, x) for x in LANGS}
def P(path_tpl, l): return path_tpl[l] if isinstance(path_tpl, dict) else path_tpl.format(l=l)
def img_key(a): return a.get("img_key") or a["slug"]
def img_of(a): return a.get("image") or IMAGES.get(img_key(a)) or candidate_image(a)
def words(a, l): return len(re.sub(r"<[^>]+>", " ", body_raw(a, l)).split())
def mins(a, l): return max(1, round(words(a, l) / 220))
def body_raw(a, l):
    b = a[l]["body"]
    b = re.sub(r"(?<!<div class=\"tw\" tabindex=\"0\" role=\"region\" aria-label=\"Table\">)<table", '<div class="tw" tabindex="0" role="region" aria-label="Table"><table', b).replace("</table>", "</table></div>").replace("</table></div></div>", "</table></div>")
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
nav.s{position:relative}nav.s .in{display:flex;gap:20px;padding-right:30px!important;overflow-x:auto;white-space:nowrap;padding:10px 0;border-bottom:1px solid var(--line);font:600 14px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;scrollbar-width:none}
nav.s .in::-webkit-scrollbar{display:none}nav.s a{text-decoration:none;padding:4px 0}nav.s a.pl{margin-left:auto;color:var(--red)}nav.s a.on{border-bottom:2px solid var(--ink)}
nav.s:after{content:"";position:absolute;right:0;top:0;bottom:1px;width:28px;background:linear-gradient(90deg,transparent,var(--bg));pointer-events:none}
.ticker{display:flex;gap:14px;align-items:baseline;border-bottom:1px solid var(--line);padding:9px 0;font:14px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;overflow-x:auto;white-space:nowrap;scrollbar-width:none}
.ticker b{color:var(--red);text-transform:uppercase;letter-spacing:.08em;font-size:12px}.ticker a{text-decoration:none}.ticker time{color:var(--muted);margin-right:5px;font-variant-numeric:tabular-nums}
.k{font:700 12px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:.09em;text-transform:uppercase;color:var(--accent);margin:0 0 6px}.k a{text-decoration:none}
.badge[hidden]{display:none!important}.badge{display:inline-block;background:#a3271c;color:#fff;font:700 10.5px -apple-system,sans-serif;letter-spacing:.08em;text-transform:uppercase;padding:2px 6px;border-radius:3px;margin-right:6px;vertical-align:2px}
h1{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:clamp(34px,6vw,56px);line-height:1.06;margin:.15em 0 .3em}
h2{font-size:23px;line-height:1.3;margin:1.6em 0 .4em}h3{font-size:21px;line-height:1.25;margin:.2em 0 .3em}
.dek{font-size:21px;color:var(--muted);line-height:1.45;margin:0 0 .8em}
.meta{font:13.5px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:var(--muted);border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:9px 0;margin:14px 0 18px;display:flex;flex-wrap:wrap;gap:4px 14px}
.meta b{color:var(--ink)}
.crumbs{font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:var(--muted);margin:18px 0 4px}.crumbs a{text-decoration:none}
figure{margin:0 0 18px}figure img{width:100%;height:auto;display:block;background:var(--line);border-radius:2px}
figcaption{font:13px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:var(--muted);padding-top:7px}figcaption .ai{color:var(--red);font-weight:700}
article p,article li{font-size:19px}.body>p:first-of-type:first-letter{float:left;font:700 64px/.82 'Cormorant Garamond',Georgia,serif;margin:6px 8px 0 0;color:var(--ink)}article ul,article ol{padding-left:22px}article li{margin:.35em 0}
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
.hero{position:relative;margin:18px 0 0;border-radius:6px;overflow:hidden;background:#1d1b18;min-height:420px;display:flex;align-items:flex-end}
.hero picture,.hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.hero:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05) 30%,rgba(0,0,0,.72))}
.hv{position:relative;z-index:1;color:#fff;padding:28px 26px;max-width:760px}.hv h1{color:#fff;font-size:clamp(36px,6.5vw,64px);margin:.05em 0 .25em}.hk{font:700 12px -apple-system,sans-serif;letter-spacing:.14em;text-transform:uppercase;margin:0;color:#f0d9b0}
.hp{font-size:clamp(17px,2.2vw,21px);line-height:1.45;margin:0 0 16px;color:#f3ede3}.hb{display:flex;gap:10px;flex-wrap:wrap;margin:0}
.hb a{font:700 15px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-decoration:none;padding:13px 18px;border-radius:999px;min-height:46px;display:inline-flex;align-items:center}
.hb .b1{background:#d8b27a;color:#1d1b18}.hb .b2{border:1px solid rgba(255,255,255,.7);color:#fff}.hb a:hover{opacity:.9;color:inherit}
.qf{border-bottom:1px solid var(--line);padding:20px 0}.qf h2{font:700 15px -apple-system,sans-serif;letter-spacing:.08em;text-transform:uppercase;margin:0 0 12px}
.qf dl{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px 22px;margin:0}.qf dt{font:700 12px -apple-system,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--accent)}.qf dd{margin:2px 0 0;font-size:16.5px;line-height:1.45}
.ans,.facts,.pcta{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:6px;padding:14px 16px;margin:0 0 18px}.ans b,.facts>b{font:700 12px -apple-system,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}.ans p{margin:.3em 0 0;font-size:18px}.wk{border-bottom:1px solid var(--line);padding:14px 0}.wk h2{font-size:22px;margin:.15em 0 .3em}.wk h2 a{text-decoration:none}.wk p{margin:0}.corr2{font:14.5px/1.5 -apple-system,sans-serif;color:var(--muted);border-top:1px solid var(--line);padding-top:10px}.corr2 b{color:var(--ink)}.nwb ul{margin:.4em 0 0;padding-left:18px;font-size:16px}.nwb li{margin:4px 0}.nwb time{color:var(--muted);font-size:13px;margin-left:6px}.keys ul{margin:.4em 0 0;padding-left:20px;font-size:17px;line-height:1.45}.vis p{margin:.4em 0 0;font:16px/1.5 Georgia,serif}
.facts dl{display:grid;grid-template-columns:max-content 1fr;gap:6px 14px;margin:8px 0 0;font:15px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.facts dt{font-weight:700}.facts dd{margin:0}
.faq details{border-bottom:1px solid var(--line);padding:10px 0}.faq summary{cursor:pointer;font-weight:700;font-size:18px}.faq details p{margin:.5em 0 0}
.pls ul{font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.pcta{font:15.5px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin-top:24px}
.map{height:460px;border-radius:6px;overflow:hidden;background:var(--card);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;margin:14px 0 6px}.map button{padding:12px 18px;border-radius:999px;border:1px solid var(--line);background:var(--bg);color:var(--ink);font:600 15px -apple-system,sans-serif;cursor:pointer}
.maplibregl-popup-content{font:14px/1.4 -apple-system,sans-serif;color:#1d1b18}
@media(max-width:600px){.facts dl{grid-template-columns:1fr}.facts dt{margin-top:6px}.hero{min-height:480px}.hv{padding:22px 18px}}
header.m{position:relative}.mh{margin:0;font-size:inherit;line-height:1}.ear{position:absolute;top:22px;width:200px;border:1px solid var(--ink);padding:7px 9px;font:12px/1.35 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-align:left;color:var(--muted)}.ear b{display:block;color:var(--ink);text-transform:uppercase;letter-spacing:.06em;font-size:10.5px}.ear.l{left:0}.ear.r{right:0;text-align:right}
.rh{font:800 12.5px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:.11em;text-transform:uppercase;margin:0 0 10px;padding-top:7px;border-top:3px solid var(--ink)}.rh a{text-decoration:none}
.fp{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2.3fr) minmax(0,1.15fr);gap:0;padding:18px 0 22px;border-bottom:1px solid var(--ink)}
.fp>.brf{padding-right:20px;border-right:1px solid var(--line)}.fp>.lead{padding:0 22px}.fp>.rail{padding-left:20px;border-left:1px solid var(--line)}
.lead h2{font-family:'Cormorant Garamond',Georgia,serif;font-size:clamp(32px,4.2vw,50px);line-height:1.03;margin:.2em 0 .25em}.lead h2 a{text-decoration:none}.lead .dek{font-size:19.5px}
.rel{list-style:none;padding:0;margin:12px 0 0;border-top:1px solid var(--line)}.rel li{padding:8px 0;border-bottom:1px solid var(--line);font:600 15.5px/1.35 Georgia,serif}.rel li:before{content:"▸ ";color:var(--red)}.rel a{text-decoration:none}
.bi{padding:9px 0;border-bottom:1px solid var(--line);font-size:16px;line-height:1.3}.bi time{display:block;font:700 11.5px -apple-system,sans-serif;color:var(--red);letter-spacing:.04em;margin-bottom:2px;font-variant-numeric:tabular-nums}.bi a{text-decoration:none;font-weight:600}
.more{display:inline-block;margin-top:10px;font:600 13px -apple-system,sans-serif;color:var(--accent)}
.st h3{font-size:19px;line-height:1.2;margin:.1em 0 .25em}.st h3 a{text-decoration:none}.st .dk{font-size:15.5px;color:var(--muted);margin:.2em 0 .3em;line-height:1.45}.st .ph{display:block;margin-bottom:8px}.st img{width:100%;height:auto;aspect-ratio:3/2;object-fit:cover;display:block;background:var(--line)}
.live{margin-bottom:20px}.lv{display:grid;grid-template-columns:1fr;gap:0;font:14px/1.35 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.lv div{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px dotted var(--line)}.lv b{font-weight:600}.lv span{color:var(--muted);text-align:right;font-variant-numeric:tabular-nums}.src2{font:11px -apple-system,sans-serif;color:var(--muted);margin:6px 0 0}
.desk .st h3{font-size:21px}.plan{display:block;margin-top:14px;background:var(--ink);color:var(--bg);padding:13px 14px;border-radius:3px;text-decoration:none;font:14px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.plan b{display:block;font-size:15px;margin-bottom:3px}.plan:hover{color:var(--bg);opacity:.92}
.strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-bottom:1px solid var(--ink)}.strip>.st{padding:18px 16px;border-right:1px solid var(--line)}.strip>.st:first-child{padding-left:0}.strip>.st:last-child{border-right:0;padding-right:0}
.sec{padding:20px 0 6px;border-bottom:1px solid var(--line)}.sec>.hd{display:flex;justify-content:space-between;align-items:baseline;border-top:3px solid var(--ink);padding-top:8px;margin-bottom:14px}.sec>.hd h2{margin:0;font:800 15px -apple-system,sans-serif;letter-spacing:.1em;text-transform:uppercase}.sec>.hd a{font:13px -apple-system,sans-serif;color:var(--muted)}
.tr{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:26px}.tr .big h3{font-family:'Cormorant Garamond',Georgia,serif;font-size:clamp(28px,3.4vw,40px);line-height:1.05}.tr .big .dk{font-size:18px}
.trl{display:grid;grid-template-columns:1fr 1fr;gap:18px}.trl .st h3{font-size:17px}
.c4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:22px}
.cols{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px;padding:22px 0;border-bottom:1px solid var(--line)}
.bottom{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr) minmax(0,1.2fr);gap:26px;padding:22px 0}
.fg{display:grid;grid-template-columns:1fr 1fr;gap:0}.fg a{display:block;padding:10px 8px 10px 0;border-bottom:1px solid var(--line);text-decoration:none}.fg b{display:block;font:700 30px/1 'Cormorant Garamond',Georgia,serif;color:var(--red)}.fg span{font:13px/1.35 -apple-system,sans-serif;color:var(--muted)}
.ess ol{margin:0;padding-left:22px;font-size:16px;line-height:1.35}.ess li{padding:6px 0;border-bottom:1px solid var(--line)}.ess a{text-decoration:none;font-weight:600}
.letter .st h3{font-style:italic;font-size:22px}.letter .sub{margin-top:12px}
article p:first-of-type .dl+*{}
@media(max-width:980px){.fp{grid-template-columns:1fr}.fp>.lead{order:-1;padding:0 0 18px}.fp>.brf,.fp>.rail{border:0;padding:16px 0 0}.strip,.c4,.cols{grid-template-columns:1fr 1fr}.strip>.st{padding:16px 10px 16px 0;border-right:0}.tr,.bottom{grid-template-columns:1fr}.ear{display:none}}
@media(max-width:560px){.strip,.c4,.cols,.trl{grid-template-columns:1fr}.strip>.st{border-bottom:1px solid var(--line)}}
.sa[hidden]{display:none}.sa{position:fixed;right:16px;bottom:16px;z-index:50;font:15px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.sa-b{display:flex;align-items:center;gap:8px;background:#1d1b18;color:#f7f3ec;border:1px solid #3a352e;border-radius:999px;padding:12px 18px 12px 14px;box-shadow:0 8px 24px rgba(0,0,0,.25);cursor:pointer;font:700 14.5px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:48px}
.sa-b:hover{background:#a3271c}.sa.on .sa-b{display:none}
.sa-p{position:fixed;right:16px;bottom:16px;width:380px;max-width:calc(100vw - 32px);height:min(600px,calc(100vh - 32px));background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:12px;box-shadow:0 18px 50px rgba(0,0,0,.3);display:flex;flex-direction:column;overflow:hidden}
.sa-p[hidden]{display:none}.sa-p header{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:#1d1b18;color:#f7f3ec;border-bottom:3px double #d8b27a}.sa-p header b{display:block;font:700 18px 'Cormorant Garamond',Georgia,serif}.sa-p header small{color:#cfc6b6;font-size:12px}
.sa-x{background:none;border:0;color:#f7f3ec;font-size:28px;line-height:1;cursor:pointer;width:40px;height:40px}
.sa-m{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}.sa-m .m{max-width:88%;padding:9px 12px;border-radius:12px}.sa-m .m p{margin:0 0 .45em;font-size:15px;white-space:pre-line}.sa-m .m p:last-child{margin:0}
.sa-m .b{background:var(--card);border:1px solid var(--line);align-self:flex-start;border-bottom-left-radius:3px}.sa-m .u{background:#1d1b18;color:#f7f3ec;align-self:flex-end;border-bottom-right-radius:3px}
.sa-l{display:block;margin-top:4px;color:var(--accent);font-weight:600}.typing p{animation:sap 1s infinite}@keyframes sap{50%{opacity:.35}}
.sa-c{display:flex;flex-wrap:wrap;gap:6px}.ac{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:999px;padding:7px 11px;font:13.5px -apple-system,sans-serif;cursor:pointer;text-align:left}.ac:hover{border-color:var(--accent)}
.sa-f{display:flex;gap:8px;padding:10px;border-top:1px solid var(--line)}.sa-f textarea{flex:1;resize:none;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font:16px -apple-system,sans-serif;background:var(--card);color:var(--ink);max-height:120px}
.sa-f button{width:46px;border:0;border-radius:10px;background:#a3271c;color:#fff;font-size:18px;cursor:pointer}.sa-n{margin:0;padding:0 12px 10px;font-size:11.5px;color:var(--muted)}
@media(max-width:600px){.sa-b span{display:none}.sa-b{padding:13px}.sa-p{right:0;bottom:0;width:100vw;max-width:100vw;height:100dvh;border-radius:0}}
@media print{.sa{display:none}}
@media(max-width:820px){.front{grid-template-columns:1fr}.side{border-left:0;padding-left:0;border-top:1px solid var(--line);padding-top:16px}}
@media print{.bar,nav.s,.ticker,.sub,.share,footer .links,.toc{display:none!important}body{background:#fff;color:#000;font-size:12pt}a{text-decoration:none}}"""

THEME_JS = "<script>try{var t=localStorage.getItem('st-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>"

def head(l, title, desc, path_tpl, og_type="website", extra="", image=None, noindex=False):
    alts = "".join(f'<link rel="alternate" hreflang="{x}" href="{BASE}{P(path_tpl, x)}">' for x in LANGS)
    xdef = "/" if P(path_tpl, "en") == "/en/" else P(path_tpl, "en")
    alts += f'<link rel="alternate" hreflang="x-default" href="{BASE}{xdef}">'
    url = BASE + P(path_tpl, l)
    title = seo_title(title); desc = seo_desc(desc)
    og = image or (BASE + "/og.png")
    robots = '<meta name="robots" content="noindex">' if noindex else '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">'
    return f"""<!doctype html><html lang="{HTML_LANG[l]}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title><meta name="description" content="{esc(desc)}">{robots}<link rel="canonical" href="{url}">{alts}
<meta property="og:site_name" content="The Sumba Times"><meta property="og:type" content="{og_type}"><meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc)}"><meta property="og:url" content="{url}"><meta property="og:locale" content="{OG_LOC[l]}">{"".join(f'<meta property="og:locale:alternate" content="{OG_LOC[y]}">' for y in LANGS if y != l)}<meta property="og:image" content="{og}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{og}">
<meta name="theme-color" content="#f7f3ec" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#141311" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/manifest.webmanifest">
<link rel="alternate" type="application/rss+xml" title="The Sumba Times" href="{BASE}/{l}/feed.xml"><link rel="search" type="application/opensearchdescription+xml" title="The Sumba Times" href="/opensearch.xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700&display=swap" rel="stylesheet">
{THEME_JS}<style>{CSS}</style>
<script>(function(c,l,a,r,i,t,y){{c[a]=c[a]||function(){{(c[a].q=c[a].q||[]).push(arguments)}};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);}})(window,document,"clarity","script","{CLARITY}");</script>
{extra}</head><body><a class="skip" href="#main">{X[l]["skip"]}</a>"""

def masthead(l, path_tpl, active=None, front=False):
    x = X[l]
    langs = "".join(f'<a href="{P(path_tpl, y)}" hreflang="{y}" lang="{y}" class="{"on" if y==l else ""}" onclick="stLang(\'{y}\')">{y.upper()}</a>' for y in LANGS)
    nav = "".join(f'<a href="/{l}/{s}/" class="{"on" if s==active else ""}{" pl" if s=="plan" else ""}">{esc(sec_name(l,s))}</a>' for s in NAV)
    return f"""<div class="w"><div class="bar"><span><time id="st-today" datetime="{NOW.date().isoformat()}">{today_str(l)}</time> · <span class="daily">{x["daily"]}</span></span>
<span class="r"><a href="/{l}/search/" aria-label="{x["search"]}">&#9906; {x["search"]}</a>{langs}<button type="button" onclick="stTheme()" aria-label="{x["dark"]}">&#9680;</button></span></div>
<header class="m">{('<div class="ear l"><b>' + N[l]["ed"] + '</b><span>Sumba · Nusa Tenggara Timur</span></div><div class="ear r"><b>' + N[l]["wx"] + '</b><span id="ear-wx">Waingapu</span></div>') if front else ''}{'<h1 class="mh">' if front else ''}<a class="mt" href="/{l}/">The Sumba Times</a>{'</h1>' if front else ''}<div class="tg">{esc(UI[l]["tagline"])}</div></header>
<nav class="s" aria-label="{esc(sec_name(l,'news'))}"><div class="in">{nav}</div></nav></div>
<script>function stLang(x){{try{{document.cookie='st_lang='+x+';path=/;max-age=31536000;samesite=lax'}}catch(e){{}}}}function stTheme(){{var d=document.documentElement,c=d.getAttribute('data-theme'),dark=c?c==='dark':matchMedia('(prefers-color-scheme: dark)').matches,n=dark?'light':'dark';d.setAttribute('data-theme',n);try{{localStorage.setItem('st-theme',n)}}catch(e){{}}}}</script>"""

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

def assistant(l):
    a = AI[l]
    chips = "".join(f'<button type="button" class="ac">{esc(c)}</button>' for c in a["chips"])
    return rf"""<div id="sa" class="sa" data-l="{l}" hidden><button type="button" class="sa-b" aria-expanded="false" aria-controls="sa-p"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm3 6.5a1.5 1.5 0 1 0 0 .01zm5 0a1.5 1.5 0 1 0 0 .01zm5 0a1.5 1.5 0 1 0 0 .01z"/></svg><span>{esc(a["btn"])}</span></button>
<section id="sa-p" class="sa-p" role="dialog" aria-label="{esc(a["title"])}" hidden><header><div><b>{esc(a["title"])}</b><small>{esc(a["sub"])}</small></div><button type="button" class="sa-x" aria-label="{esc(a["close"])}">×</button></header>
<div class="sa-m" aria-live="polite"><div class="m b"><p>{esc(a["hello"])}</p></div><div class="sa-c">{chips}</div></div>
<form class="sa-f"><textarea rows="1" maxlength="600" placeholder="{esc(a["ph"])}" aria-label="{esc(a["ph"])}"></textarea><button type="submit" aria-label="{esc(a["send"])}">➤</button></form><p class="sa-n">{esc(a["note"])}</p></section></div>
<script>(function(){{var R=document.getElementById('sa'),P=R.querySelector('.sa-p'),B=R.querySelector('.sa-b'),M=R.querySelector('.sa-m'),F=R.querySelector('form'),T=F.querySelector('textarea'),L=R.dataset.l,TX={json.dumps({k: a[k] for k in ("err","limit","off")}, ensure_ascii=False)},H=[],busy=false;
try{{H=JSON.parse(sessionStorage.getItem('sa-h')||'[]')}}catch(e){{}}
function link(p,t){{var r=/→\s*([^|\n]+?)\s*\|\s*(https:\/\/thesumbatimes\.com\/[^\s]*)/g,i=0,m;while((m=r.exec(t))){{p.appendChild(document.createTextNode(t.slice(i,m.index)));var a=document.createElement('a');a.href=m[2];a.textContent='→ '+m[1];a.className='sa-l';p.appendChild(a);i=r.lastIndex}}p.appendChild(document.createTextNode(t.slice(i)))}}
function add(role,t){{var d=document.createElement('div');d.className='m '+(role==='user'?'u':'b');t.split(/\n{{2,}}/).forEach(function(x){{var p=document.createElement('p');link(p,x);d.appendChild(p)}});M.appendChild(d);M.scrollTop=M.scrollHeight;return d}}
H.forEach(function(m){{add(m.role,m.content)}});fetch('/api/ask').then(function(r){{return r.json()}}).then(function(j){{if(j.on)R.hidden=false}}).catch(function(){{}});
function open(o){{P.hidden=!o;B.setAttribute('aria-expanded',o);R.classList.toggle('on',o);if(o){{T.focus();try{{clarity('event','assistant_open')}}catch(e){{}}}}}}
B.onclick=function(){{open(P.hidden)}};R.querySelector('.sa-x').onclick=function(){{open(false);B.focus()}};document.addEventListener('keydown',function(e){{if(e.key==='Escape'&&!P.hidden){{open(false);B.focus()}}}});
R.querySelectorAll('.ac').forEach(function(c){{c.onclick=function(){{T.value=c.textContent;F.requestSubmit?F.requestSubmit():F.onsubmit()}}}});
T.addEventListener('keydown',function(e){{if(e.key==='Enter'&&!e.shiftKey){{e.preventDefault();F.requestSubmit?F.requestSubmit():F.onsubmit()}}}});
T.addEventListener('input',function(){{T.style.height='auto';T.style.height=Math.min(T.scrollHeight,120)+'px'}});
F.onsubmit=function(e){{if(e)e.preventDefault();var q=T.value.trim();if(!q||busy)return false;busy=true;T.value='';T.style.height='auto';var c=R.querySelector('.sa-c');if(c)c.remove();
add('user',q);var w=add('assistant','…');w.classList.add('typing');try{{clarity('event','assistant_ask')}}catch(_){{}}
fetch('/api/ask',{{method:'POST',headers:{{'content-type':'application/json'}},body:JSON.stringify({{q:q,lang:L,page:location.pathname,history:H.slice(-6)}})}}).then(function(r){{return r.json().then(function(j){{return [r.status,j]}})}}).then(function(z){{
w.remove();var s=z[0],j=z[1];if(s===200&&j.text){{add('assistant',j.text);H.push({{role:'user',content:q}},{{role:'assistant',content:j.text}});H=H.slice(-12);try{{sessionStorage.setItem('sa-h',JSON.stringify(H))}}catch(e){{}}}}
else if(s===429)add('assistant',TX.limit+'\n\n→ '+document.title.split(' · ')[0]+' | https://thesumbatimes.com/'+L+'/plan/');
else if(s===503)add('assistant',TX.off+'\n\n→ '+'The Sumba Times | https://thesumbatimes.com/'+L+'/plan/');else add('assistant',TX.err)}}).catch(function(){{w.remove();add('assistant',TX.err)}}).then(function(){{busy=false}});return false}};}})();</script>"""

def footer(l):
    u = UI[l]; x = X[l]
    links = "".join(f'<a href="/{l}/{s}/">{esc(sec_name(l,s))}</a>' for s in NAV)
    return f"""<div class="w"><footer><div class="links">{links}</div><p><b>The Sumba Times</b> · <a href="/{l}/about/">{x["about"]}</a> · <a href="/{l}/feed.xml">{x["rss"]}</a> · <a href="mailto:{CONTACT}">{CONTACT}</a><br>
<a href="https://ecobeachcity.com/" rel="noopener">{u["published_by"]}</a>. {u["disclosure"]}<br>© {NOW.year} The Sumba Times</p></footer></div>{sub_js(l)}{assistant(l)}<script>if('serviceWorker' in navigator)addEventListener('load',function(){{navigator.serviceWorker.register('/sw.js').catch(function(){{}})}})</script></body></html>"""

def picture(a, l, sizes="(max-width: 820px) 100vw, 760px", eager=False, cap=True):
    im = img_of(a)
    if not im: return ""
    s = img_key(a)
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
    s = img_key(a)
    return f'<a class="ph" href="{url_of(a,l)}" tabindex="-1"><img src="/img/{s}-640.webp" width="640" height="427" alt="{esc(im["caption"][l])}" loading="lazy" decoding="async"></a>'

def kicker(a, l):
    c = a[l]
    return c.get("kicker") or sec_name(l, group_of(a))

def badge(a):
    if kind_of(a) == "guide": return ""
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
<button type="button" onclick="window.print()">PDF</button><button type="button" onclick="var b=this;if(navigator.share){{navigator.share({{title:{esc(json.dumps(t))},url:'{u}'}}).catch(function(){{}})}}else{{navigator.clipboard.writeText('{u}').then(function(){{b.textContent={esc(json.dumps(x['copied']))}}})}}">{x["copy"]}</button></div>"""

def related(a, l):
    items = [b for b in all_items() if b is not a]
    same = [b for b in items if group_of(b) == group_of(a)]
    rest = [b for b in items if b not in same]
    pick = (same + rest)[:3]
    return f'<section class="block"><div class="hd"><h2>{X[l]["related"]}</h2></div><div class="grid">{"".join(card(b,l) for b in pick)}</div></section>'

def gmaps(pl): return f"https://www.google.com/maps/search/?api=1&query={pl['lat']},{pl['lon']}"

def extras_html(a, l):
    """Quick answer + key facts box (top of body) and FAQ + places (bottom)."""
    t = T[l]; c = a[l]; top = ""; bottom = ""
    if c.get("answer"):
        top += f'<div class="ans"><b>{t["answer"]}</b><p>{esc(c["answer"])}</p></div>'
    if c.get("keys"):
        top += f'<div class="ans keys"><b>{KEYS_T[l]}</b><ul>' + "".join(f"<li>{esc(k)}</li>" for k in c["keys"]) + "</ul></div>"
    if c.get("correction"):
        bottom += f'<p class="corr2"><b>{CORR_T[l]}</b> {esc(c["correction"])}</p>'
    if c.get("visitors"):
        bottom = f'<div class="facts vis"><b>{VIS_T[l]}</b><p>{esc(c["visitors"])}</p></div>' + bottom
    fx = (a.get("facts") or {}).get(l)
    if fx:
        top += f'<div class="facts"><b>{t["facts_box"]}</b><dl>' + "".join(f"<dt>{esc(k)}</dt><dd>{esc(v)}</dd>" for k, v in fx) + "</dl></div>"
    fq = (a.get("faq") or {}).get(l)
    if fq:
        bottom += f'<section class="faq"><h2 id="faq">{t["faq_t"]}</h2>' + "".join(f"<details><summary>{esc(q)}</summary><p>{esc(an)}</p></details>" for q, an in fq) + "</section>"
    if kind_of(a) == "guide":
        names = [re.split(r"[,:]", a[l]["title"])[0].strip()] + [p["name"] for p in (a.get("places") or [])]
        names = [n for n in names if len(n) >= 5]
        me = url_of(a, l)
        news = [b for b in all_items() if kind_of(b) == "brief" and (me in body_raw(b, l) or a["slug"] in body_raw(b, "en") or any(n.lower() in (b[l]["title"] + " " + b[l]["dek"] + " " + body_raw(b, l)).lower() for n in names[1:]))][:4]
        if news:
            bottom += f'<div class="facts nwb"><b>{NEWS_T[l]}</b><ul>' + "".join(f'<li><a href="{url_of(b,l)}">{esc(b[l]["title"])}</a><time datetime="{iso(b)}">{fdate(b,l,False)}</time></li>' for b in news) + "</ul></div>"
    pls = a.get("places") or []
    if pls:
        bottom += f'<section class="pls"><h2 id="places">{t["places_t"]}</h2><ul>' + "".join(
            f'<li><b>{esc(p["name"])}</b>{" · " + esc(p["area"]) if p.get("area") else ""} · <a href="{gmaps(p)}" target="_blank" rel="noopener">{t["open_map"]}</a></li>' for p in pls) + f'</ul><p><a href="/{l}/plan/#map">{t["map_t"]} →</a></p></section>'
    return top, bottom

CORR_T = {"en": "Correction:", "es": "Corrección:", "id": "Koreksi:"}
NEWS_T = {"en": "Latest news about this", "es": "Últimas noticias sobre esto", "id": "Berita terbaru tentang ini"}
KEYS_T = {"en": "Key points", "es": "Claves", "id": "Poin penting"}
VIS_T = {"en": "If you are travelling to Sumba", "es": "Si viajas a Sumba", "id": "Jika Anda bepergian ke Sumba"}
_PLACE_RX = None
def place_links(b, a, l):
    """Link the first plain-text mention of each place that has its own page (max 8 per article)."""
    global _PLACE_RX
    if _PLACE_RX is None:
        _PLACE_RX = []
        for x in all_items():
            if x["section"] != "places": continue
            for ll in LANGS:
                nm = (x.get("names") or {}).get(ll) or re.split(r"[,:]", x[ll]["title"])[0].strip()
                if len(nm) >= 4: _PLACE_RX.append((ll, nm, x))
    n = 0
    for ll, nm, x in sorted(_PLACE_RX, key=lambda z: -len(z[1])):
        if ll != l or x is a or n >= 8: continue
        href = url_of(x, l)
        if href in b: continue
        pat = re.compile(r"(?<![\w>/-])(" + re.escape(nm) + r")(?![\w<])")
        parts = re.split(r"(<a\b.*?</a>|<h[1-6][^>]*>.*?</h[1-6]>|<[^>]+>)", b, flags=re.S)
        for i, part in enumerate(parts):
            if part.startswith("<"): continue
            m = pat.search(part)
            if m:
                parts[i] = part[:m.start()] + f'<a href="{href}">{m.group(1)}</a>' + part[m.end():]; n += 1; break
        b = "".join(parts)
    return b

_LINKS = None
def fix_links(b):
    """Point internal links that use English slugs straight at the localized URL (no redirect hop)."""
    global _LINKS
    if _LINKS is None:
        _LINKS = {}
        for x in all_items():
            for l in LANGS:
                _LINKS[f"/{l}/{x['section']}/{x['slug']}/"] = url_of(x, l)
    return re.sub(r'href="(/(?:en|es|id)/[^"#?]*/)', lambda m: 'href="' + _LINKS.get(m.group(1), m.group(1)), b)

def article_ld(a, l, url, imgs, grp):
    c = a[l]; x = X[l]; kind = kind_of(a)
    mod = a.get("updated") or a["date"]
    art = {"@context": "https://schema.org", "@type": "NewsArticle" if kind == "brief" else "Article", "headline": c["title"][:110], "description": c["dek"], "inLanguage": l,
           "datePublished": iso(a), "dateModified": (mod + "T" + tm(a) + ":00+08:00") if a.get("updated") else iso(a), "mainEntityOfPage": url, "image": imgs,
           "articleSection": sec_name(l, grp), "wordCount": words(a, l),
           "author": {"@type": "Organization", "name": "The Sumba Times", "url": BASE + f"/{l}/about/"},
           "publisher": {"@type": "Organization", "name": "The Sumba Times", "logo": {"@type": "ImageObject", "url": BASE + "/apple-touch-icon.png"}, "parentOrganization": {"@type": "Organization", "name": "Eco Beach City", "url": "https://ecobeachcity.com"}},
           "about": {"@type": "Place", "name": "Sumba", "sameAs": "https://en.wikipedia.org/wiki/Sumba"}}
    if a.get("sources"): art["citation"] = [h for _, h in a["sources"]]
    art["isAccessibleForFree"] = True
    art["copyrightYear"] = int(a["date"][:4]); art["copyrightHolder"] = {"@type": "Organization", "name": "The Sumba Times"}
    art["workTranslation" if l == "en" else "translationOfWork"] = [{"@type": "CreativeWork", "@id": BASE + url_of(a, y), "inLanguage": y} for y in LANGS if y != l] if l == "en" else {"@id": BASE + url_of(a, "en")}
    if a.get("dateline"):
        art["locationCreated"] = {"@type": "Place", "name": a["dateline"].title() + ", Sumba, Indonesia"}
        art["dateline"] = a["dateline"].title()
    kw = (a.get("keywords") or {}).get(l) if isinstance(a.get("keywords"), dict) else a.get("keywords")
    if kw: art["keywords"] = kw if isinstance(kw, str) else ", ".join(kw)
    im = img_of(a)
    if im:
        art["image"] = [{"@type": "ImageObject", "url": u, "caption": im["caption"][l], "creditText": im.get("credit", ""), "license": im.get("license_url") or None,
                         "acquireLicensePage": im.get("page") or None, "width": 1280 if "-1280" in u else 1200, "height": 853 if "-1280" in u else 630} for u in imgs]
        art["thumbnailUrl"] = f"{BASE}/img/{img_key(a)}-640.webp"
    ments = [x for x in all_items() if x is not a and x["section"] == "places" and url_of(x, l) in (c.get("body") or "") + place_links(fix_links(body_raw(a, l)), a, l)]
    if ments: art["mentions"] = [{"@type": "TouristAttraction", "name": re.split(r"[,:]", x[l]["title"])[0], "url": BASE + url_of(x, l)} for x in ments[:8]]
    if c.get("answer"):
        art["abstract"] = c["answer"]
        art["speakable"] = {"@type": "SpeakableSpecification", "cssSelector": [".ans p", "h1", ".dek"]}
    ld = [art, {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
              {"@type": "ListItem", "position": 1, "name": x["home"], "item": BASE + f"/{l}/"},
              {"@type": "ListItem", "position": 2, "name": sec_name(l, grp), "item": BASE + f"/{l}/{grp}/"},
              {"@type": "ListItem", "position": 3, "name": c["title"], "item": url}]}]
    ev = a.get("event")
    if ev and ev.get("start") and ev.get("end"):
        ld.append({"@context": "https://schema.org", "@type": "Event", "name": ev["name"] + " " + ev["start"][:4], "description": c["dek"],
                   "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode", "eventStatus": "https://schema.org/EventScheduled",
                   "startDate": ev["start"], "endDate": ev["end"],
                   "location": {"@type": "Place", "name": ev["location"], "address": {"@type": "PostalAddress", "addressRegion": "Nusa Tenggara Timur", "addressCountry": "ID"}},
                   "isAccessibleForFree": True, "url": url, "organizer": {"@type": "Organization", "name": "Rato (customary elders) of Sumba"}})
    fq = (a.get("faq") or {}).get(l)
    if fq:
        ld.append({"@context": "https://schema.org", "@type": "FAQPage", "inLanguage": l, "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": an}} for q, an in fq]})
    if a.get("places"):
        ld.append({"@context": "https://schema.org", "@type": "ItemList", "name": T[l]["places_t"], "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "item": {"@type": "TouristAttraction", "name": p["name"], "geo": {"@type": "GeoCoordinates", "latitude": p["lat"], "longitude": p["lon"]},
             "containedInPlace": {"@type": "Place", "name": (p.get("area") or "Sumba") + ", Indonesia"}}} for i, p in enumerate(a["places"])]})
    return ld

def article_page(a, l):
    u = UI[l]; c = a[l]; x = X[l]
    tpl = paths_of(a)
    url = BASE + tpl[l]
    im = img_of(a)
    og = f"{BASE}/og/{img_key(a)}.jpg" if im else None
    imgs = [og, f"{BASE}/img/{img_key(a)}-1280.webp"] if im else [BASE + "/og.png"]
    grp = group_of(a)
    ld = article_ld(a, l, url, imgs, grp)
    extra = f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script><meta property="article:published_time" content="{iso(a)}"><meta property="article:section" content="{esc(sec_name(l,grp))}">'
    if a.get("updated"): extra += f'<meta property="article:modified_time" content="{a["updated"]}">'
    kw = (a.get("keywords") or {}).get(l) if isinstance(a.get("keywords"), dict) else a.get("keywords")
    if kw: extra += "".join(f'<meta property="article:tag" content="{esc(k.strip())}">' for k in (kw.split(",") if isinstance(kw, str) else kw))
    s = head(l, c["title"] + " · The Sumba Times", c["dek"], tpl, "article", extra, og) + masthead(l, tpl, grp)
    srcs = "".join(f'<li><a href="{esc(h)}" rel="nofollow noopener" target="_blank">{esc(t)}</a></li>' for t, h in a.get("sources", []))
    b, toc = with_toc(place_links(fix_links(body_raw(a, l)), a, l), l)
    if a.get("dateline"):
        b = re.sub(r"^<p>", f'<p><span class="dl">{esc(a["dateline"])} —</span> ', b, count=1)
    if kind_of(a) != "letter": b = inline_sub(b, l)
    top_x, bot_x = extras_html(a, l)
    upd = f'<span>{x["upd"]} <time datetime="{a["updated"]}">{fdate(dict(a, date=a["updated"]), l, False)}</time></span>' if a.get("updated") and a["updated"] != a["date"] else ""
    crumbs = f'<div class="crumbs"><a href="/{l}/">{x["home"]}</a> › <a href="/{l}/{grp}/">{esc(sec_name(l,grp))}</a></div>'
    plan_cta = "" if kind_of(a) == "letter" else f'<div class="pcta"><b>{T[l]["plan_cta_t"]}</b> {T[l]["plan_cta_p"]} <a href="/{l}/plan/">{T[l]["plan_cta_b"]} →</a></div>'
    s += f"""<main id="main" class="w"><article class="nar">{crumbs}<p class="k">{badge(a)}{esc(kicker(a,l))}</p>
<h1>{esc(c["title"])}</h1><p class="dek">{esc(c["dek"])}</p>
<div class="meta"><span><b>{x["desk"]}</b></span><span>{x["pub"]} <time datetime="{iso(a)}">{fdate(a,l)}</time></span>{upd}<span>{mins(a,l)} {x["min"]}</span></div>
{picture(a,l,eager=True)}{top_x}{toc}<div class="{"body" if not a.get("dateline") and kind_of(a) != "letter" else "body0"}">{b}</div>{bot_x}{plan_cta}{share(a,l)}
<div class="src"><b>{u["sources"]}</b><ol>{srcs}</ol><p class="corr">{x["corr"]} <a href="mailto:{CONTACT}">{CONTACT}</a>.</p></div>
<div style="margin-top:26px">{subscribe(l)}</div></article>{related(a,l)}</main>""" + footer(l)
    write(tpl[l], s)

def section_page(sec, l):
    x = X[l]; tpl = "/{l}/" + sec + "/"
    if sec == "guides": items = [a for a in all_items() if kind_of(a) == "guide"]
    elif sec in LEGACY: items = [a for a in all_items() if a["section"] == sec]
    else: items = [a for a in all_items() if group_of(a) == sec]
    s = head(l, sec_name(l, sec) + " · The Sumba Times", sec_desc(l, sec), tpl) + masthead(l, tpl, GROUP.get(sec, sec))
    grid = "".join(card(a, l) for a in items) or f'<p>{UI[l]["coming"]}</p>'
    s += f'<main id="main" class="w"><div class="crumbs"><a href="/{l}/">{x["home"]}</a>' + (f' › <a href="/{l}/{GROUP[sec]}/">{esc(sec_name(l,GROUP[sec]))}</a>' if sec in GROUP else '') + '</div>'
    s += f'<div class="sec-h"><h1>{esc(sec_name(l,sec))}</h1><p>{esc(sec_desc(l,sec))}</p></div><div class="grid">{grid}</div>'
    if sec == "low-tide": s += f'<div class="nar">{subscribe(l)}</div>'
    s += '</main>' + footer(l)
    write(tpl.format(l=l), s)

def travel_guides():
    order = ["things-to-do", "getting-here", "culture", "where-to-stay", "travel", "projects", "business", "living"]
    gs = [a for a in all_items() if kind_of(a) == "guide"]
    return sorted(gs, key=lambda a: (0 if a.get("answer_first") else 1, order.index(a["section"]) if a["section"] in order else 9, -dt(a).timestamp()))

def facts_strip(l):
    t = T[l]
    return f'<section class="qf" aria-label="{esc(t["facts_t"])}"><h2>{t["facts_t"]}</h2><dl>' + "".join(f'<div><dt>{esc(k)}</dt><dd>{esc(v)}</dd></div>' for k, v in t["facts"]) + "</dl></section>"

def hero(l):
    t = T[l]; k = HERO_IMG; im = IMAGES.get(k, {})
    alt = esc(im.get("caption", {}).get(l, "Sumba"))
    return f"""<section class="hero"><picture><source type="image/webp" srcset="/img/{k}-640.webp 640w, /img/{k}-1280.webp 1280w" sizes="100vw"><img src="/img/{k}-1280.webp" alt="{alt}" width="1280" height="853" fetchpriority="high" loading="eager"></picture>
<div class="hv"><p class="hk">{t["hero_k"]}</p><h1>{t["hero_t"]}</h1><p class="hp">{t["hero_p"]}</p>
<p class="hb"><a class="b1" href="/{l}/plan/" onclick="try{{clarity('event','hero_plan')}}catch(e){{}}">{t["hero_b1"]}</a><a class="b2" href="/{l}/guides/">{t["hero_b2"]}</a></p></div></section>"""

def hl(a, l, cls="", img=False, dek=True, when=True, size=640):
    """A newspaper story unit: optional photo, kicker, headline, dek, time."""
    c = a[l]; im = img_of(a)
    ph = ""
    if img and im:
        k = img_key(a)
        ph = f'<a class="ph" href="{url_of(a,l)}" tabindex="-1"><img src="/img/{k}-{size}.webp" width="{size}" height="{int(size*2/3)}" alt="{esc(im["caption"][l])}" loading="lazy" decoding="async"></a>'
    kind = X[l]["brief"] if kind_of(a) == "brief" else sec_name(l, "guides")[:-1] if l == "en" else kicker(a, l)
    k = f'<p class="k">{badge(a)}<a href="/{l}/{group_of(a)}/">{esc(kicker(a,l))}</a></p>'
    d = f'<p class="dk">{esc(c["dek"])}</p>' if dek else ""
    w = f'<div class="when"><time datetime="{iso(a)}">{fdate(a,l)}</time></div>' if when else ""
    return f'<article class="st {cls}">{ph}{k}<h3><a href="{url_of(a,l)}">{esc(c["title"])}</a></h3>{d}{w}</article>'

def live_box(l):
    n = N[l]
    return f"""<section class="live" aria-label="{esc(n["today_t"])}"><h2 class="rh">{n["today_t"]}</h2>
<div class="lv"><div><b>Waingapu</b><span id="wx-wgp">…</span></div><div><b>Tambolaka</b><span id="wx-tmc">…</span></div>
<div><b>{n["sunrise"]} / {n["sunset"]}</b><span id="wx-sun">…</span></div><div><b>{n["fx"]}</b><span id="fx">…</span></div></div>
<p class="src2">{n["wx_src"]}</p></section>"""

def live_js(l):
    n = N[l]
    return f"""<script>(function(){{var W={json.dumps(n["wcode"], ensure_ascii=False)};function wc(c){{c=+c;var ks=Object.keys(W).map(Number).sort(function(a,b){{return a-b}}),r=W['0'];ks.forEach(function(k){{if(c>=k)r=W[k]}});return r}}
function set(id,t){{var e=document.getElementById(id);if(e)e.textContent=t}}
fetch('https://api.open-meteo.com/v1/forecast?latitude=-9.656,-9.43&longitude=120.264,119.24&current=temperature_2m,weather_code&daily=sunrise,sunset&timezone=Asia%2FMakassar&forecast_days=1').then(function(r){{return r.json()}}).then(function(j){{
var a=j[0],b=j[1];function t(x){{return Math.round(x.current.temperature_2m)+'°C · '+wc(x.current.weather_code)}}
set('wx-wgp',t(a));set('wx-tmc',t(b));set('ear-wx','Waingapu '+t(a));set('wx-sun',a.daily.sunrise[0].slice(11)+' / '+a.daily.sunset[0].slice(11)+' WITA')}}).catch(function(){{set('wx-wgp','–');set('wx-tmc','–');set('wx-sun','–')}});
fetch('https://open.er-api.com/v6/latest/EUR').then(function(r){{return r.json()}}).then(function(j){{var e=j.rates.IDR,u=j.rates.IDR/j.rates.USD;set('fx','1 € = '+Math.round(e).toLocaleString('{l}')+' IDR · 1 $ = '+Math.round(u).toLocaleString('{l}')+' IDR')}}).catch(function(){{set('fx','–')}});}})();</script>"""

def figures(l):
    n = N[l]
    return f'<section class="figs"><h2 class="rh">{n["figures_t"]}</h2><div class="fg">' + "".join(f'<a href="{u}"><b>{esc(v)}</b><span>{esc(t)}</span></a>' for v, t, u in n["figures"]) + "</div></section>"

def home(l):
    u = UI[l]; x = X[l]; t = T[l]; n = N[l]; tpl = "/{l}/"
    items = all_items()
    top = lead_item()
    briefs = [a for a in items if kind_of(a) == "brief" and a is not top]
    guides = travel_guides()
    feat = next((g for g in guides if g["slug"] == "best-time-to-visit-sumba"), guides[0])
    ld = [{"@context": "https://schema.org", "@type": "WebSite", "name": "The Sumba Times", "url": BASE + f"/{l}/", "inLanguage": l,
           "potentialAction": {"@type": "SearchAction", "target": BASE + f"/{l}/search/?q={{search_term_string}}", "query-input": "required name=search_term_string"}},
          {"@context": "https://schema.org", "@type": "NewsMediaOrganization", "name": "The Sumba Times", "url": BASE, "logo": BASE + "/apple-touch-icon.png",
           "publishingPrinciples": BASE + f"/{l}/about/", "parentOrganization": {"@type": "Organization", "name": "Eco Beach City", "url": "https://ecobeachcity.com"}}]
    tk = img_key(top)
    pre = f'<link rel="preload" as="image" href="/img/{tk}-1280.webp" imagesrcset="/img/{tk}-640.webp 640w, /img/{tk}-1280.webp 1280w" imagesizes="(max-width: 980px) 100vw, 620px">'
    s = head(l, "The Sumba Times · " + u["tagline"], u["tagline"] + ". " + x["daily"] + ".", tpl, extra=pre + f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>') + masthead(l, tpl, front=True)
    ticker = "".join(f'<a href="{url_of(a,l)}"><time datetime="{iso(a)}">{dt(a).strftime("%d/%m %H:%M")}</time>{esc(a[l]["title"])}</a>' for a in items if kind_of(a) == "brief")
    rel = [a for a in briefs if group_of(a) == group_of(top)][:2]
    lead = f"""<div class="lead"><p class="k">{badge(top)}{x["top_story"]} · <a href="/{l}/{group_of(top)}/">{esc(sec_name(l,group_of(top)))}</a></p>
<a href="{url_of(top,l)}" tabindex="-1" style="display:block">{picture(top,l,"(max-width: 980px) 100vw, 620px",eager=True,cap=False)}</a>
<h2><a href="{url_of(top,l)}">{esc(top[l]["title"])}</a></h2><p class="dek">{esc(top[l]["dek"])}</p>
<div class="when">{x["desk"]} · <time datetime="{iso(top)}">{fdate(top,l)}</time></div>
{('<ul class="rel">' + "".join(f'<li><a href="{url_of(a,l)}">{esc(a[l]["title"])}</a></li>' for a in rel) + '</ul>') if rel else ''}</div>"""
    brief_col = f'<div class="brf"><h2 class="rh">{n["brief_t"]}</h2>' + "".join(
        f'<div class="bi"><time datetime="{iso(a)}">{dt(a).strftime("%d/%m · %H:%M")}</time><a href="{url_of(a,l)}">{esc(a[l]["title"])}</a></div>' for a in briefs[:7]) + f'<a class="more" href="/{l}/news/">{n["more_news"]} →</a> · <a class="more" href="/{l}/week/">{WEEK_T[l][0]} →</a></div>'
    rail = f"""<div class="rail">{live_box(l)}<section class="desk"><h2 class="rh">{n["travel_desk"]}</h2>{hl(feat, l, img=True, when=False)}
<a class="plan" href="/{l}/plan/"><b>{n["start"]}</b><span>{t["plan_cta_p"]}</span></a></section></div>"""
    s += f"""<main id="main" class="w"><div class="ticker" aria-label="{x["ticker"]}"><b>{x["ticker"]}</b>{ticker}</div>
<section class="fp">{brief_col}{lead}{rail}</section>"""
    # secondary strip: next stories with photos (news first, then guides)
    used = {id(top), id(feat)} | {id(a) for a in briefs[:7]}
    strip = [a for a in briefs[7:] + [g for g in guides if id(g) not in used]][:4]
    used |= {id(a) for a in strip}
    s += f'<section class="strip">{"".join(hl(a, l, img=True, dek=False) for a in strip)}</section>'
    # travel section: big feature + list
    tr = [g for g in guides if id(g) not in used and g["section"] in ("things-to-do", "getting-here", "where-to-stay")][:5]
    used |= {id(a) for a in tr}
    if tr:
        s += f"""<section class="sec"><div class="hd"><h2>{esc(sec_name(l,"travel"))}</h2><a href="/{l}/travel/">{x["all"]} {esc(sec_name(l,"travel"))} →</a></div>
<div class="tr">{hl(tr[0], l, "big", img=True, size=1280)}<div class="trl">{"".join(hl(a, l, img=True, when=False) for a in tr[1:5])}</div></div></section>"""
    cu = [a for a in items if group_of(a) == "culture" and id(a) not in used][:4]
    used |= {id(a) for a in cu}
    if cu:
        s += f'<section class="sec"><div class="hd"><h2>{esc(sec_name(l,"culture"))}</h2><a href="/{l}/culture/">{x["all"]} {esc(sec_name(l,"culture"))} →</a></div><div class="c4">{"".join(hl(a, l, img=True, when=False) for a in cu)}</div></section>'
    cols = ""
    for sec in ["business", "living", "projects", "news"]:
        its = [a for a in items if group_of(a) == sec and kind_of(a) != "letter" and a is not top][:4]
        if its:
            cols += f'<div class="col"><h2 class="rh"><a href="/{l}/{sec}/">{esc(sec_name(l,sec))}</a></h2>' + "".join(f'<div class="bi"><a href="{url_of(a,l)}">{esc(a[l]["title"])}</a></div>' for a in its) + "</div>"
    s += f'<section class="cols">{cols}</section>'
    ess = "".join(f'<li><a href="{url_of(a,l)}">{esc(a[l]["title"])}</a></li>' for a in guides[:10])
    s += f"""<section class="bottom">{figures(l)}<section class="ess"><h2 class="rh">{n["essential_t"]}</h2><ol>{ess}</ol></section>
<section class="letter"><h2 class="rh">{n["letter_t"]}</h2>{hl(LETTER, l, img=False, when=True)}{subscribe(l)}</section></section>"""
    s += "</main>" + footer(l) + live_js(l)
    write(tpl.format(l=l), s)

WEEK_T = {"en": ("This week in Sumba", "Every story we published on Sumba in the last seven days, in one page: transport, weather, culture, business and life on the island."),
          "es": ("Esta semana en Sumba", "Todas las noticias que publicamos sobre Sumba en los últimos siete días, en una sola página: transporte, tiempo, cultura, negocios y vida en la isla."),
          "id": ("Pekan ini di Sumba", "Semua berita tentang Sumba yang kami terbitkan dalam tujuh hari terakhir, dalam satu halaman: transportasi, cuaca, budaya, bisnis dan kehidupan di pulau.")}

def week_page(l):
    t, d = WEEK_T[l]; x = X[l]; tpl = "/{l}/week/"
    its = [a for a in all_items() if kind_of(a) == "brief" and (NOW - dt(a)).days < 7] or [a for a in all_items() if kind_of(a) == "brief"][:7]
    ld = [{"@context": "https://schema.org", "@type": "ItemList", "name": t, "inLanguage": l, "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": BASE + url_of(a, l), "name": a[l]["title"]} for i, a in enumerate(its)]}]
    s_ = head(l, t + " · The Sumba Times", d, tpl, extra=f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>') + masthead(l, tpl, "news")
    rows = "".join(f'<article class="wk"><p class="k">{esc(kicker(a,l))} · <time datetime="{iso(a)}">{fdate(a,l)}</time></p><h2><a href="{url_of(a,l)}">{esc(a[l]["title"])}</a></h2><p>{esc(a[l].get("answer") or a[l]["dek"])}</p></article>' for a in its)
    s_ += f'<main id="main" class="w"><div class="nar"><div class="crumbs"><a href="/{l}/">{x["home"]}</a></div><h1>{t}</h1><p class="dek">{d}</p>{rows}<div style="margin-top:24px">{subscribe(l)}</div></div></main>' + footer(l)
    write(tpl.format(l=l), s_)

def all_places():
    seen, out = set(), []
    for a in all_items():
        for p in a.get("places") or []:
            k = p["name"].strip().lower()
            if k in seen: continue
            seen.add(k); out.append(dict(p, url=a))
    for p in BASE_PLACES:
        if p["name"].lower() not in seen: out.append(dict(p, url=None))
    return out

def plan_page(l):
    t = T[l]; x = X[l]; tpl = "/{l}/plan/"
    gs = travel_guides()
    groups = [(t["g_before"], ["getting-here", "where-to-stay"]), (t["g_island"], ["things-to-do", "travel"]), (t["g_culture"], ["culture"]), (sec_name(l, "places"), ["places"])]
    used = set(); blocks = ""
    for name, secs in groups:
        its = [a for a in gs if a["section"] in secs and id(a) not in used]
        used.update(id(a) for a in its)
        if its: blocks += f'<section class="block"><div class="hd"><h2>{esc(name)}</h2></div><div class="grid">{"".join(card(a,l) for a in its)}</div></section>'
    faqs = []
    for a in gs:
        for q, an in ((a.get("faq") or {}).get(l) or [])[:2]:
            faqs.append((q, an, a))
    faqs = faqs[:14]
    pls = all_places()
    pts = [{"n": p["name"], "a": p.get("area", ""), "la": p["lat"], "lo": p["lon"], "u": url_of(p["url"], l) if p.get("url") else ""} for p in pls]
    ld = [{"@context": "https://schema.org", "@type": "TouristDestination", "name": "Sumba", "sameAs": "https://en.wikipedia.org/wiki/Sumba",
           "geo": {"@type": "GeoCoordinates", "latitude": -9.70, "longitude": 119.97}, "containedInPlace": {"@type": "Place", "name": "Nusa Tenggara Timur, Indonesia"},
           "includesAttraction": [{"@type": "TouristAttraction", "name": p["name"], "geo": {"@type": "GeoCoordinates", "latitude": p["lat"], "longitude": p["lon"]}} for p in pls[:40]]},
          {"@context": "https://schema.org", "@type": "CollectionPage", "name": t["plan_title"], "description": t["plan_dek"], "inLanguage": l, "url": BASE + f"/{l}/plan/",
           "about": {"@type": "Place", "name": "Sumba", "sameAs": "https://en.wikipedia.org/wiki/Sumba"},
           "hasPart": [{"@type": "Article", "headline": a[l]["title"], "url": BASE + url_of(a, l)} for a in gs]}]
    if faqs: ld.append({"@context": "https://schema.org", "@type": "FAQPage", "inLanguage": l, "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": an}} for q, an, _ in faqs]})
    s = head(l, t["plan_title"] + " · The Sumba Times", t["plan_dek"], tpl, extra=f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>') + masthead(l, tpl, "plan")
    faq_html = "".join(f'<details><summary>{esc(q)}</summary><p>{esc(an)} <a href="{url_of(a,l)}">→</a></p></details>' for q, an, a in faqs)
    s += f"""<main id="main" class="w"><div class="nar"><div class="crumbs"><a href="/{l}/">{x["home"]}</a></div><h1>{t["plan_title"]}</h1><p class="dek">{t["plan_dek"]}</p>{t["plan_intro"]}</div>
{facts_strip(l)}{blocks}
<section class="block" id="map"><div class="hd"><h2>{t["map_t"]}</h2></div><div id="stmap" class="map"><button type="button" onclick="stMap()">{t["map_btn"]}</button></div><p class="when">{t["map_note"]}</p></section>
{f'<section class="block nar faq"><div class="hd"><h2>{t["faq_t"]}</h2></div>{faq_html}</section>' if faqs else ''}
<div class="nar" style="margin-top:26px">{subscribe(l)}</div></main>
<script>var STP={json.dumps(pts, ensure_ascii=False)};var stMapOn=false;
function stMap(){{if(stMapOn)return;stMapOn=true;var el=document.getElementById('stmap');el.innerHTML='';
var c=document.createElement('link');c.rel='stylesheet';c.href='https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';document.head.appendChild(c);
var sc=document.createElement('script');sc.src='https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';sc.onload=function(){{
var m=new maplibregl.Map({{container:'stmap',style:'https://tiles.openfreemap.org/styles/liberty',center:[119.75,-9.65],zoom:7.4,cooperativeGestures:true}});
m.addControl(new maplibregl.NavigationControl({{showCompass:false}}));
STP.forEach(function(p){{var d=document.createElement('div');d.innerHTML='<b></b><br><span></span>';d.querySelector('b').textContent=p.n;d.querySelector('span').textContent=p.a;
if(p.u){{var a=document.createElement('a');a.href=p.u;a.textContent=' →';d.appendChild(a)}}
new maplibregl.Marker({{color:'#a3271c'}}).setLngLat([p.lo,p.la]).setPopup(new maplibregl.Popup({{offset:18}}).setDOMContent(d)).addTo(m)}});
try{{clarity('event','map_open')}}catch(e){{}}}};document.body.appendChild(sc)}}
if('IntersectionObserver' in window){{new IntersectionObserver(function(e,o){{if(e[0].isIntersecting){{o.disconnect();stMap()}}}},{{rootMargin:'200px'}}).observe(document.getElementById('stmap'))}}</script>""" + footer(l)
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
        enc = f'<enclosure url="{BASE}/img/{img_key(a)}-1280.webp" type="image/webp" length="0"/>' if im else ""
        full = "<![CDATA[" + (f'<p><img src="{BASE}/img/{img_key(a)}-1280.webp" alt=""></p>' if im else "") + body_raw(a, l).replace("]]>", "") + "]]>"
        its += f"<item><title>{esc(a[l]['title'])}</title><link>{BASE}{url_of(a,l)}</link><guid>{BASE}{url_of(a,l)}</guid><description>{esc(a[l]['dek'])}</description><content:encoded>{full}</content:encoded><category>{esc(sec_name(l,group_of(a)))}</category><pubDate>{dt(a).strftime('%a, %d %b %Y %H:%M:00 +0800')}</pubDate>{enc}</item>"
    write(f"/{l}/feed.xml", f'<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>The Sumba Times</title><link>{BASE}/{l}/</link><description>{esc(UI[l]["tagline"])}</description><language>{l}</language>{its}</channel></rss>')

def root():
    s = """<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Sumba Times · News, culture and travel from Sumba, Indonesia</title>
<meta name="description" content="News, travel, business and life on the island of Sumba, Indonesia. New stories every morning at 6:00 Sumba time. In English, Spanish and Indonesian."><link rel="canonical" href="https://thesumbatimes.com/en/">
<link rel="alternate" hreflang="en" href="https://thesumbatimes.com/en/"><link rel="alternate" hreflang="es" href="https://thesumbatimes.com/es/"><link rel="alternate" hreflang="id" href="https://thesumbatimes.com/id/"><link rel="alternate" hreflang="x-default" href="https://thesumbatimes.com/">
<link rel="alternate" type="text/plain" title="llms.txt" href="https://thesumbatimes.com/llms.txt">
<style>body{font:18px Georgia,serif;background:#f7f3ec;color:#1d1b18;text-align:center;padding:15vh 16px}a{margin:0 10px}</style></head>
<body><h1>The Sumba Times</h1><p><a href="/en/">English</a><a href="/es/">Español</a><a href="/id/">Bahasa Indonesia</a></p></body></html>"""
    write("/", s)

def sitemaps():
    urls = []
    def add(tpl, lastmod=None):
        alts = "".join(f'<xhtml:link rel="alternate" hreflang="{x}" href="{BASE}{P(tpl, x)}"/>' for x in LANGS)
        lm = f"<lastmod>{lastmod}</lastmod>" if lastmod else ""
        for l in LANGS: urls.append(f"<url><loc>{BASE}{P(tpl, l)}</loc>{lm}{alts}</url>")
    add("/{l}/", NOW.date().isoformat())
    add("/{l}/week/", NOW.date().isoformat())
    for s in NAV + LEGACY: add("/{l}/" + s + "/", NOW.date().isoformat() if s in ("plan", "guides", "news") else None)
    add("/{l}/about/")
    for a in all_items(): add(paths_of(a), a.get("updated") or a["date"])
    imgs = []
    for a in all_items():
        im = img_of(a)
        if not im: continue
        for l in LANGS:
            imgs.append(f'<url><loc>{BASE}{url_of(a,l)}</loc><image:image><image:loc>{BASE}/img/{img_key(a)}-1280.webp</image:loc></image:image></url>')
    write("/image-sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' + "".join(imgs) + "</urlset>")
    write("/" + INDEXNOW + ".txt", INDEXNOW)
    write("/sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' + "".join(urls) + "</urlset>")
    news = []
    for a in all_items():
        if kind_of(a) == "guide": continue
        if (NOW - dt(a)).total_seconds() > 2 * 86400: continue
        for l in LANGS:
            news.append(f'<url><loc>{BASE}{url_of(a,l)}</loc><news:news><news:publication><news:name>The Sumba Times</news:name><news:language>{l}</news:language></news:publication><news:publication_date>{iso(a)}</news:publication_date><news:title>{esc(a[l]["title"])}</news:title></news:news></url>')
    write("/news-sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">' + "".join(news) + "</urlset>")
    bots = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "anthropic-ai", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "Bingbot", "CCBot", "meta-externalagent", "DuckAssistBot", "MistralAI-User"]
    rb = "# The Sumba Times welcomes search engines and AI assistants. Please cite and link the article you use.\n"
    rb += "".join(f"User-agent: {b}\n" for b in bots) + "Allow: /\nDisallow: /*/search/\n\n"
    rb += "User-agent: *\nAllow: /\nDisallow: /*/search/\n\nSitemap: https://thesumbatimes.com/sitemap.xml\nSitemap: https://thesumbatimes.com/news-sitemap.xml\nSitemap: https://thesumbatimes.com/image-sitemap.xml\n"
    write("/robots.txt", rb)
    llms()

def llms():
    def lines(l):
        out = ""
        for a in travel_guides():
            c = a[l]; out += f"- [{c['title']}]({BASE}{url_of(a,l)}): {c.get('answer') or c['dek']}\n"
        return out
    t = "# The Sumba Times\n\n> Independent-style news, travel guides and culture from the island of Sumba, East Nusa Tenggara, Indonesia, in English, Spanish and Indonesian. New stories every morning at 6:00 WITA. Published by Eco Beach City (disclosed on every page); covers the whole island; sources are linked under every story.\n\n"
    t += f"Plan a trip: {BASE}/en/plan/ (Spanish {BASE}/es/plan/, Indonesian {BASE}/id/plan/)\n\n"
    t += "## Travel guides (English)\n" + lines("en") + "\n## Guías de viaje (español)\n" + lines("es") + "\n## Panduan perjalanan (Bahasa Indonesia)\n" + lines("id")
    t += "\n## News\n" + "".join(f"- [{a['en']['title']}]({BASE}{url_of(a,'en')}) ({a['date']})\n" for a in all_items() if kind_of(a) == "brief")
    t += f"\n## Optional\n- About and editorial standards: {BASE}/en/about/\n- RSS: {BASE}/en/feed.xml\n- Sitemap: {BASE}/sitemap.xml\n"
    write("/llms.txt", t)
    for ll in ("es", "id"):
        hdr = {"es": "# The Sumba Times (español)\n\n> Noticias, guías de viaje y cultura de la isla de Sumba (Indonesia). Fuentes enlazadas en cada artículo.\n\n",
               "id": "# The Sumba Times (Bahasa Indonesia)\n\n> Berita, panduan wisata dan budaya Pulau Sumba, Indonesia. Sumber ditautkan di setiap artikel.\n\n"}[ll]
        write(f"/{ll}/llms.txt", hdr + lines(ll) + "\n" + "".join(f"- [{a[ll]['title']}]({BASE}{url_of(a,ll)})\n" for a in all_items() if kind_of(a) == "brief"))
    full = ""
    for a in travel_guides():
        c = a["en"]
        full += f"# {c['title']}\nURL: {BASE}{url_of(a,'en')}\n\n{c['dek']}\n\n" + (c.get("answer", "") + "\n\n" if c.get("answer") else "")
        full += re.sub(r"\n{3,}", "\n\n", re.sub(r"<[^>]+>", "", re.sub(r"</(p|h2|h3|li|tr)>", "\n", body_raw(a, "en")))) + "\n\n"
        for q, an in (a.get("faq") or {}).get("en") or []: full += f"Q: {q}\nA: {an}\n\n"
        full += "---\n\n"
    write("/llms-full.txt", full)

def redirects():
    r = {}
    for a in all_items():
        for l in LANGS:
            old = f"/{l}/{a['section']}/{a['slug']}/"
            if old != url_of(a, l): r[old] = url_of(a, l)
    write("/_redirects.json", json.dumps(r))

SW_JS = "const V='tst-v1';\nself.addEventListener('install',e=>{self.skipWaiting()});\nself.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});\nself.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==location.origin||u.pathname.startsWith('/api/'))return;\n if(u.pathname.startsWith('/img/')){e.respondWith(caches.open(V).then(c=>c.match(r).then(m=>m||fetch(r).then(x=>{if(x.ok)c.put(r,x.clone());return x}))));return}\n if(r.mode==='navigate'||(r.headers.get('accept')||'').includes('text/html')){e.respondWith(fetch(r).then(x=>{if(x.ok){const y=x.clone();caches.open(V).then(c=>c.put(r,y))}return x}).catch(()=>caches.match(r).then(m=>m||caches.match('/'+(u.pathname.split('/')[1]||'en')+'/plan/')||new Response('<h1>Offline</h1>',{headers:{'content-type':'text/html'}}))))}});"

def assets():
    write("/sw.js", SW_JS)
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
        plan_page(l); week_page(l)
        for s in NAV + LEGACY:
            if s != "plan": section_page(s, l)
        for a in all_items(): article_page(a, l)
    root(); sitemaps(); redirects(); assets()
    n = sum(len(f) for _, _, f in os.walk(OUT)); print("files", n)
