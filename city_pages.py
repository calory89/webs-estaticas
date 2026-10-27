# -*- coding: utf-8 -*-
# Una pagina por ciudad, para que Google encuentre «comedor social Nairobi» o
# «free shower London» y lleve a alguien al mapa.
#
# Salen en ingles: es lo que indexa Google en todas partes y lo que hay escrito
# en el resto de paginas sueltas. Al pulsar «abrir el mapa» la app ya se pone en
# el idioma de la persona. Cada pagina lleva lo que hay de verdad en esa ciudad
# — cuantos sitios de cada tipo a 10 km del centro y los treinta con nombre mas
# cercanos — asi que si en una ciudad hay poco, la pagina lo dice; no se inventa
# nada para rellenar.
#
# Ademas: sitemap.xml y robots.txt, que hasta hoy no existian.
from datetime import date
import io, json, os, re, math, html as H
from urllib.parse import quote as Q
from collections import Counter

h = io.open('index.full.html' if __import__('os').path.exists('index.full.html') else 'index.html', encoding='utf-8').read()
STR = json.loads(re.search(r'const STR = /\*__STR__\*/(\[.*?\]);', h, re.S).group(1))
CITIES = json.loads(re.search(r'const CITIES = /\*__CITIES__\*/(\[.*?\]);', h, re.S).group(1))
STATS = json.loads(re.search(r'const STATS = /\*__STATS__\*/(\{.*?\});', h, re.S).group(1))
EMG_N = json.loads(re.search(r'const EMG_N = (\{.*?\});', h, re.S).group(1))
PAGES_V = re.search(r"const PAGES_V = /\*__PAGESV__\*/'([^']*)'", h).group(1)
import hashlib as _hl
try: SV = '?v=' + _hl.sha1(open('social.jpg','rb').read()).hexdigest()[:8]
except Exception: SV = '?v=' + PAGES_V


def social_img(lang):
    """La tarjeta para compartir en el idioma de la pagina (social/make_social.py).
    Si no hay version de ese idioma, la inglesa."""
    f = 'social-%s.jpg' % lang
    if lang != 'en' and os.path.exists(f):
        return 'https://supportnear.com/%s?v=%s' % (f, _hl.sha1(open(f, 'rb').read()).hexdigest()[:8])
    return 'https://supportnear.com/social.jpg' + SV
CATIDS = ['food', 'shelter', 'hygiene', 'clothes', 'social', 'legal', 'health', 'water', 'warm']
CATNAME = {'food': 'Food', 'shelter': 'Shelter and beds', 'hygiene': 'Showers and toilets',
           'clothes': 'Free clothes', 'social': 'Social help', 'legal': 'Legal aid',
           'health': 'Health care', 'water': 'Drinking water', 'warm': 'A warm place to be'}
SUB_EN = json.loads(re.search(r'const SUB = \{\n en:(\{.*?\})\n\}', h, re.S).group(1))
CSS = io.open('page.css.txt', encoding='utf-8').read()

# ---- idioma de cada pais: la pagina sale en la lengua que se busca en Google alli ----
LANG_BY_CC = {}
for cc in 'ES AR BO CL CO CR CU DO EC SV GT HN MX NI PA PY PE UY VE GQ'.split(): LANG_BY_CC[cc] = 'es'
for cc in 'FR BE CH SN ML CI BF NE TD CM GA CG CD BJ TG GN MG DJ KM HT LU MC BI RW CF MR'.split(): LANG_BY_CC[cc] = 'fr'
for cc in 'MA DZ TN LY EG SD SA YE OM AE QA BH KW IQ SY JO LB PS SO MR SS'.split(): LANG_BY_CC.setdefault(cc, 'ar')
LANG_BY_CC.update({'UA': 'uk', 'RO': 'ro', 'MD': 'ro', 'PL': 'pl', 'RU': 'ru', 'BY': 'ru', 'KZ': 'ru', 'KG': 'ru',
                   'PT': 'pt', 'BR': 'pt', 'AO': 'pt', 'MZ': 'pt', 'CV': 'pt', 'GW': 'pt', 'ST': 'pt', 'TL': 'pt',
                   'PK': 'ur', 'IR': 'fa', 'AF': 'fa', 'TJ': 'fa'})
RTL = {'ar', 'ur', 'fa'}
CP_EN = json.load(io.open('tr/citypage_src.json', encoding='utf-8'))
CP = json.load(io.open('tr/citypage_new.json', encoding='utf-8')); CP['en'] = CP_EN
# nombres de categoria por idioma, de la propia app
CATN = {'en': CATNAME}
for lang in CP:
    if lang == 'en': continue
    try:
        t = json.load(io.open('l/%s.json' % lang, encoding='utf-8'))['t']
        CATN[lang] = {c: t.get('cat.%s.n' % c, CATNAME[c]) for c in CATIDS}
    except Exception:
        CATN[lang] = CATNAME


ONE = {  # con n == 1, estas frases van en singular
    'en': {'cn.desc': '1 place in {city}, {country}, with address, hours and phone where they are known. Free map, no account, works with no signal.'},
    'es': {'cn.desc': '1 sitio en {city}, {country}, con dirección, horario y teléfono cuando se saben. Mapa gratis, sin cuenta, funciona sin cobertura.'},
    'fr': {'cn.desc': '1 lieu à {city}, {country}, avec adresse, horaires et téléphone quand on les connaît. Carte gratuite, sans compte, marche sans réseau.'},
    'pt': {'cn.desc': '1 sítio em {city}, {country}, com morada, horário e telefone quando se sabem. Mapa gratuito, sem conta, funciona sem rede.'},
}
def TT(lang, key, **kw):
    v = (CP.get(lang) or CP_EN).get(key) or CP_EN[key]
    if str(kw.get('n')) == '1' and key in ONE.get(lang, {}):
        v = ONE[lang][key]
    for k, x in kw.items():
        v = v.replace('{%s}' % k, str(x))
    return v


# «1 sitios donde estar»: con un solo sitio la frase va en singular. Los
# idiomas eslavos ya escriben «{need} ({n})», que no necesita concordar.
SG = {
    'en': {'food': 'free food place', 'shelter': 'shelter', 'hygiene': 'free shower', 'clothes': 'free clothes point', 'social': 'social service', 'legal': 'free legal aid point', 'health': 'free clinic', 'water': 'drinking water point', 'warm': 'warm place to sit'},
    'es': {'food': 'comedor social', 'shelter': 'albergue', 'hygiene': 'ducha pública', 'clothes': 'ropero', 'social': 'servicio social', 'legal': 'punto de asistencia jurídica gratuita', 'health': 'centro de salud gratuito', 'water': 'fuente de agua potable', 'warm': 'sitio donde estar'},
    'fr': {'food': 'distribution de repas', 'shelter': 'hébergement d’urgence', 'hygiene': 'douche gratuite', 'clothes': 'vestiaire solidaire', 'social': 'service social', 'legal': 'point d’aide juridique gratuite', 'health': 'lieu de soins gratuits', 'water': 'point d’eau potable', 'warm': 'lieu où se poser au chaud'},
    'pt': {'food': 'refeitório social', 'shelter': 'albergue', 'hygiene': 'ducha pública', 'clothes': 'roupeiro solidário', 'social': 'serviço social', 'legal': 'ponto de apoio jurídico gratuito', 'health': 'centro de saúde gratuito', 'water': 'ponto de água potável', 'warm': 'sítio onde estar'},
    'ro': {'food': 'cantină socială', 'shelter': 'adăpost', 'hygiene': 'duș gratuit', 'clothes': 'punct de haine gratuite', 'social': 'serviciu social', 'legal': 'punct de asistență juridică gratuită', 'health': 'punct de îngrijiri medicale gratuite', 'water': 'punct de apă potabilă', 'warm': 'loc cald unde să stai'},
}
def need_word(lang, c, n):
    if n == 1 and c in SG.get(lang, {}):
        return SG[lang][c]
    return TT(lang, 'pl.' + c)


# JSON-LD: sin campos vacios (los validadores de Google marcan los null) y el
# horario solo cuando es sencillo, que es lo que schema.org entiende.
def ld_clean(x):
    if isinstance(x, dict): return {k: ld_clean(v) for k, v in x.items() if v not in (None, '', [], {})}
    if isinstance(x, list): return [ld_clean(v) for v in x]
    return x
_OH_OK = re.compile(r'^(?:(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?(?:,(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?)* \d\d:\d\d-\d\d:\d\d(?:,\d\d:\d\d-\d\d:\d\d)*(?:; ?)?)+$')
def ld_oh(oh):
    oh = (oh or '').strip()
    if oh == '24/7': return 'Mo-Su 00:00-23:59'
    return oh if _OH_OK.match(oh) else None
# El pais en el idioma de la pagina: «Moçambique» en la portuguesa, no «Mozambique».
try:
    from babel import Locale as _Loc
except Exception:
    _Loc = None
_LOCS = {}
def country_in(cc, lang, fallback):
    if not _Loc or not cc or lang == 'en': return fallback
    try:
        if lang not in _LOCS: _LOCS[lang] = _Loc.parse(lang)
        return _LOCS[lang].territories.get(cc) or fallback
    except Exception:
        return fallback

# ---- QR para el cartel ----
import qrcode, qrcode.image.svg
def qr_svg(url):
    img = qrcode.make(url, image_factory=qrcode.image.svg.SvgPathImage, box_size=10, border=2,
                      error_correction=qrcode.constants.ERROR_CORRECT_M)
    raw = img.to_string(encoding='unicode')
    # solo el <svg>...</svg>, sin cabecera xml
    return raw[raw.index('<svg'):]

# pais (ISO) de cada ciudad, para el numero de emergencias
CC = {}
for k, v in json.load(open('legacy_cc.json')).items():
    la, lo = k.split(','); CC[(round(float(la), 3), round(float(lo), 3))] = v['cc']
for f in ('cities_new300.json', 'cities_new200.json', 'cities_new500.json'):
    for c in json.load(io.open(f, encoding='utf-8')):
        CC[(round(c['lat'], 3), round(c['lon'], 3))] = c.get('cc', '')


def S_(v):
    if isinstance(v, int):
        return STR[v] if 0 <= v < len(STR) else ''
    return v or ''


def hav(a, b, c, d):
    R = 6371000.0; p = math.pi / 180
    x = (math.sin((c - a) * p / 2) ** 2 + math.cos(a * p) * math.cos(c * p) * math.sin((d - b) * p / 2) ** 2)
    return 2 * R * math.asin(math.sqrt(x))


# todos los sitios, decodificados una vez
places = []
for f in sorted(os.listdir('d')):
    if not f.endswith('.json'):
        continue
    rows = json.load(io.open(os.path.join('d', f), encoding='utf-8'))
    la = lo = 0
    for r in rows:
        la += r[1]; lo += r[2]
        oid = r[5]
        oid = ('way/%d' % -oid if oid < 0 else 'node/%d' % oid) if isinstance(oid, int) else oid
        places.append({'name': S_(r[0]), 'lat': la / 1e5, 'lon': lo / 1e5, 'cat': CATIDS[r[3]],
                       'sub': S_(r[4]), 'id': oid, 'addr': r[6] if len(r) > 6 else '',
                       'oh': r[7] if len(r) > 7 else '', 'phone': r[8] if len(r) > 8 else ''})
print('sitios:', len(places))

# indice por celda de medio grado para no recorrer 37.000 sitios 722 veces
grid = {}
for p in places:
    grid.setdefault((int(p['lat'] * 2), int(p['lon'] * 2)), []).append(p)


def around(lat, lon, km):
    out = []
    ci, cj = int(lat * 2), int(lon * 2)
    for i in range(ci - 1, ci + 2):
        for j in range(cj - 1, cj + 2):
            for p in grid.get((i, j), []):
                d = hav(lat, lon, p['lat'], p['lon'])
                if d <= km * 1000:
                    out.append((d, p))
    out.sort(key=lambda x: x[0])
    return out


def slug(name):
    s = name.lower()
    s = re.sub(r'[̀-ͯ]', '', __import__('unicodedata').normalize('NFD', s))
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s or 'city'


def km(d):
    return ('%d m' % (round(d / 10) * 10)) if d < 1000 else ('%.1f km' % (d / 1000)).replace('.0 km', ' km')


def split_name(raw):
    """«Αθήνα · Athens» o «Cairo · القاهرة»: el nombre en latino para el titulo y
    la URL, el otro para que quien vive alli se reconozca."""
    parts = [x.strip() for x in raw.split('·')]
    if len(parts) == 1:
        return parts[0], ''
    lat = [x for x in parts if re.search(r'[A-Za-z]', x) and not re.search(r'[\u0400-\u04FF\u0370-\u03FF\u0600-\u06FF\u0590-\u05FF\u0E00-\u0E7F\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF\u0900-\u097F]', x)]
    if len(lat) == 1:
        en = lat[0]
    else:
        en = parts[-1]
    other = [x for x in parts if x != en]
    return en, (other[0] if other else '')


LDESC = '<' + chr(92) + '/'

# Orden en el que se nombran las necesidades: primero lo que aprieta esta noche.
# No por cantidad: en casi toda ciudad hay mas fuentes que comedores, y una
# lista encabezada por «412 fuentes de agua potable» es verdad y no sirve.
NEED_ORDER = ['food', 'shelter', 'hygiene', 'health', 'clothes', 'social', 'legal', 'water', 'warm']


def need_list(cnt, lang, maxn=3):
    """«8 comedores sociales, 16 albergues y 5 duchas publicas». Las cuentas de
    verdad, con la palabra que se busca en Google en esa lengua."""
    tops = [c for c in NEED_ORDER if cnt.get(c)][:maxn]
    if not tops:
        return ''
    frags = [TT(lang, 'cp.frag', n=cnt[c], need=need_word(lang, c, cnt[c])) for c in tops]
    if len(frags) == 1:
        return frags[0]
    # en polaco, ucraniano y ruso los fragmentos van «sustantivo (n)» y no
    # admiten «y» en medio sin volver a torcer la gramatica: se separan con punto
    sep = TT(lang, 'cp.sep')
    if sep:
        return sep.join(frags)
    return ', '.join(frags[:-1]) + ' ' + TT(lang, 'cp.and') + ' ' + frags[-1]


# «Mo-Su 09:00-11:00» es como lo guarda OpenStreetMap y no lo entiende nadie
# fuera de OSM. En la app ya se traduce; en estas paginas salia crudo. No hace
# falta un interprete entero del formato: basta con poner los dias en la lengua
# de la pagina y el resto tal cual, que ya se lee.
DAY_TR = {
 'en': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
 'es': ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'],
 'fr': ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'],
 'pt': ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'],
 'ro': ['lun', 'mar', 'mie', 'joi', 'vin', 'sâm', 'dum'],
 'pl': ['pon', 'wt', 'śr', 'czw', 'pt', 'sob', 'niedz'],
 'uk': ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'нд'],
 'ru': ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'],
 'ar': ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'],
 'fa': ['دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه', 'یکشنبه'],
 'ur': ['پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ', 'اتوار'],
}
_OSMD = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
_OFF = {'en': 'closed', 'es': 'cerrado', 'fr': 'fermé', 'pt': 'fechado', 'ro': 'închis', 'pl': 'zamknięte',
        'uk': 'зачинено', 'ru': 'закрыто', 'ar': 'مغلق', 'fa': 'تعطیل', 'ur': 'بند'}


def oh_human(oh, lang):
    if not oh:
        return ''
    if oh.strip() == '24/7':
        return '24/7'
    d = DAY_TR.get(lang) or DAY_TR['en']
    # los festivos («PH off», «SH 10:00-14:00») se caen: en una lista de treinta
    # sitios solo anaden ruido, y quien va manana no necesita saberlos
    out = '; '.join(x for x in oh.split(';') if not re.match(r'\s*(PH|SH|easter)', x, re.I))
    if not out.strip():
        return ''
    out = re.sub(r'(\d)-(\d)', r'\1–\2', out)
    out = re.sub(r',(?=\d)', ', ', out)
    for i, code in enumerate(_OSMD):
        out = re.sub(r'\b%s\b' % code, d[i], out)
    out = re.sub(r'\boff\b|\bclosed\b', _OFF.get(lang, 'closed'), out)
    out = out.replace('; ', ' · ').replace(';', ' · ')
    # «lun-vie» con guion corto parece un resto de codigo; con raya se lee
    out = re.sub(r'(?<=[^\W\d_])-(?=[^\W\d_])', '–', out)
    return re.sub(r'\s{2,}', ' ', out).strip(' ·')


def cap(w):
    return w[:1].upper() + w[1:] if w else w


# Quien cae aqui desde Google no sabe donde ha caido: entraba directo a un
# titulo enorme, sin nombre ni marca, y tenia que fiarse de una lista de
# direcciones sin saber de quien. Una cabecera de 38 px lo arregla.
def header(href, label):
    return ('<header class="top"><a class="logo" href="../" aria-label="SupportNear"><svg viewBox="0 0 24 24" aria-hidden="true">'
            '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><path d="M12 7v6M9 10h6"/>'
            '</svg></a><b>SupportNear</b><a href="%s">%s</a></header>') % (href, H.escape(label))

EXTRA_CSS = """
.top{padding:20px 0 26px}
.top .logo{margin-inline-start:0}
.top a:last-child{margin-inline-start:auto;margin-left:0;text-align:end}
@media (max-width:430px){ .top a:last-child{display:none} .top{padding:16px 0 20px} }
.ct{color:var(--ink-3);font-size:14px}
.ad{display:block;color:var(--ink-2);font-size:14.5px}
.d{color:var(--ink-3);font-size:13px;font-variant-numeric:tabular-nums;white-space:nowrap}
ul.pl{list-style:none;padding:0;margin:0 0 8px}
ul.pl li{padding:14px 0;border-bottom:1px solid var(--line)}
ul.pl li:last-child{border-bottom:0}
ul.pl a{font-size:17px;font-weight:650;text-decoration:none;color:var(--ink)}
ul.pl a:hover{color:var(--brand)}
.pl-h{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.pl-h .d{margin-inline-start:auto}
.needs{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 8px}
.needs a{display:inline-block;padding:9px 14px;border:1px solid var(--line);border-radius:999px;background:var(--paper-2);text-decoration:none;font-weight:600;font-size:15px;color:var(--ink)}
.needs a:hover{border-color:var(--brand);color:var(--brand)}
.note{color:var(--ink-3);font-size:14.5px;margin:-4px 0 14px}
.emg{border:1px solid var(--line);border-inline-start:3px solid var(--alert);border-radius:0 12px 12px 0;padding:12px 16px;margin:0 0 26px;font-size:15px}
.emg strong{color:var(--ink)}
ul.cnt{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(158px,1fr));gap:8px}
ul.cnt li{background:var(--paper-2);border:1px solid var(--line);border-radius:12px;padding:12px 14px;font-size:14.5px;color:var(--ink-3)}
ul.cnt b{display:block;font-size:23px;color:var(--ink);font-variant-numeric:tabular-nums;letter-spacing:-.02em}
"""

def page(city, country, lat, lon, cc, local='', raw_q='', lang='en', near=None, sl=None, needs=(), main_lang=None):
    # En la pagina en arabe, ucraniano, ruso, farsi o urdu, la ciudad se llama
    # por su nombre local («الدار البيضاء», no «Casablanca») y el latino va al lado.
    if lang != 'en' and local:
        city, local = local, city
    if near is None:
        near = around(lat, lon, 10)
    cnt = Counter(p['cat'] for _, p in near)
    named = [(d, p) for d, p in near if p['name']][:30]
    total = len(near)
    cn = CATN.get(lang, CATNAME)
    # El titulo dice lo que hay, no cuantos puntos hay. «680 sitios en Madrid»
    # es verdad y no ayuda: la mayoria son fuentes y bancos. «8 comedores
    # sociales y 16 albergues» es la misma verdad, util, y ademas es lo que la
    # gente escribe en Google.
    lst2, lst3 = need_list(cnt, lang, 2), need_list(cnt, lang, 3)
    title = TT(lang, 'cp.titleN', city=city, list=lst2) if lst2 else TT(lang, 'cp.title', city=city)
    desc = TT(lang, 'cp.descN', list=cap(lst3), city=city, country=country) if lst3 else TT(lang, 'cp.desc', n=total, city=city, country=country)
    emg = EMG_N.get(cc)
    emgnum = emg[0] if emg else ''
    if sl is None:
        sl = slug(local if (lang != 'en' and local) else city)
    # el enlace al mapa lleva el nombre latino aunque el titulo vaya en el local:
    # es un parametro de URL, no texto, y el latino lo resuelve cualquier teclado
    qcity = local if (lang != 'en' and local) else city
    subs = SUB_EN
    try:
        if lang != 'en':
            subs = json.load(io.open('l/%s.json' % lang, encoding='utf-8')).get('sub', SUB_EN)
    except Exception:
        pass
    rows = ''.join(
        '<li><div class="pl-h"><a href="../#p=%s@%.5f,%.5f">%s</a>'
        '<span class="ct">%s</span><span class="d">%s</span></div>%s</li>'
        % (H.escape(p['id']), p['lat'], p['lon'], H.escape(p['name']),
           H.escape(subs.get(p['sub'], '') or cn[p['cat']]), H.escape(TT(lang, 'cp.from', d=km(d))),
           ('<span class="ad">%s</span>' % H.escape(p['addr'])) if p['addr'] else '')
        for d, p in named)
    counts = ''.join('<li><b>%d</b> %s</li>' % (cnt[c], H.escape(cn[c].lower() if lang not in RTL else cn[c])) for c in CATIDS if cnt[c])
    # Quien busca «comedor social Madrid» no busca «ayuda en Madrid». Cada
    # necesidad con sitios de sobra tiene su propia pagina, y desde aqui se
    # llega a ella: es lo unico que hace que Google la encuentre.
    needlinks = ''.join('<a href="%s-%s.html">%s</a>' % (sl, c, H.escape(TT(lang, 'cp.frag', n=k, need=need_word(lang, c, k)))) for c, k in needs)
    few = total < 15
    dir_attr = ' dir="rtl"' if lang in RTL else ''
    # La version inglesa de una ciudad no inglesa (sl.en.html) es una pagina
    # propia: canonical a si misma y hreflang reciproco. Antes apuntaba a la
    # local y Google la descartaba (675 paginas).
    home = main_lang or lang
    self_url = 'https://supportnear.com/c/%s%s.html' % (sl, '.en' if (main_lang and main_lang != 'en') else '')
    alts = '<link rel="alternate" hreflang="%s" href="https://supportnear.com/c/%s.html">' % (home, sl)
    if home != 'en':
        alts += '<link rel="alternate" hreflang="en" href="https://supportnear.com/c/%s.en.html">' % sl
    alts += '<link rel="alternate" hreflang="x-default" href="https://supportnear.com/c/%s.html">' % sl
    body = f'''<!DOCTYPE html>
<html lang="{lang}"{dir_attr}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{H.escape(title)} · SupportNear</title>
<meta name="description" content="{H.escape(desc)}">
<link rel="canonical" href="{self_url}">
{alts}
<meta property="og:title" content="{H.escape(title)}">
<meta property="og:description" content="{H.escape(desc)}">
<meta property="og:image" content="{social_img(lang)}"><meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="SupportNear: free help near you. Food, a bed, a shower, clothes, a doctor.">
<meta property="og:type" content="website"><meta property="og:site_name" content="SupportNear">
<meta property="og:url" content="{self_url}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@mrstartups">
<meta name="twitter:title" content="{H.escape(title)}"><meta name="twitter:description" content="{H.escape(desc)}">
<meta name="twitter:image" content="{social_img(lang)}">
<meta name="theme-color" content="#0B7A63">
<link rel="icon" href="../favicon.ico" sizes="32x32"><link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../apple-touch-icon.png">
<style>{CSS}{EXTRA_CSS}</style>
<script type="application/ld+json">{json.dumps(ld_clean([{
    "@context": "https://schema.org", "@type": "WebPage", "name": title, "description": desc, "inLanguage": lang,
    "url": self_url,
    "isPartOf": {"@type": "WebSite", "name": "SupportNear", "url": "https://supportnear.com/"},
    "about": {"@type": "City", "name": city, "containedInPlace": {"@type": "Country", "name": country}},
    "dateModified": date.today().isoformat()
  }, {
    "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
      {"@type": "ListItem", "position": 1, "name": "SupportNear", "item": "https://supportnear.com/"},
      {"@type": "ListItem", "position": 2, "name": TT(lang, 'cp.cities'), "item": "https://supportnear.com/c/"},
      {"@type": "ListItem", "position": 3, "name": city, "item": "https://supportnear.com/c/%s.html" % sl}]
  }, {
    "@context": "https://schema.org", "@type": "ItemList", "name": TT(lang, 'cp.closest'),
    "itemListElement": [{"@type": "ListItem", "position": i + 1, "item": {"@type": "Place", "name": p['name'],
       "address": p.get('addr') or None, "telephone": p.get('phone') or None, "openingHours": ld_oh(p.get('oh')),
       "geo": {"@type": "GeoCoordinates", "latitude": round(p['lat'], 5), "longitude": round(p['lon'], 5)},
       "url": "https://supportnear.com/#p=%s@%.5f,%.5f" % (p['id'], p['lat'], p['lon'])}} for i, (_, p) in enumerate(named[:10])]
  }]), ensure_ascii=False).replace('</', LDESC)}</script>
</head>
<body>
<div class="wrap">
{header('../?city=' + Q(qcity), TT(lang, 'cp.open', city=city))}
<h1>{H.escape(TT(lang, 'cp.h1', city=city))}{(' <small style="font-weight:400;color:var(--ink-3)">· ' + H.escape(local) + '</small>') if local else ''}</h1>
<p class="lede">{H.escape(TT(lang, 'cp.ledeN', list=cap(lst3), city=city, country=country) if lst3 else TT(lang, 'cp.lede', n=total, city=city, country=country))}{(' ' + H.escape(TT(lang, 'cp.few'))) if few else ''}</p>
<div class="btns"><a class="btn btn--p" href="../?city={Q(qcity)}">{H.escape(TT(lang, 'cp.btn', city=city))}</a>
<a class="btn" href="../instalar.html?v={PAGES_V}">{H.escape(TT(lang, 'cp.offline'))}</a></div>
{('<div class="emg"><strong>%s</strong> %s</div>' % (H.escape(TT(lang, 'cp.emg', country=country, n=emgnum)), H.escape(TT(lang, 'cp.emg2')))) if emgnum else ''}
<h2>{H.escape(TT(lang, 'cp.what'))}</h2>
<ul class="cnt">{counts}</ul>
{('<h2>' + H.escape(TT(lang, 'cp.byneed')) + '</h2><p class="needs">' + needlinks + '</p>') if needlinks else ''}
<h2>{H.escape(TT(lang, 'cp.closest'))}</h2>
<p>{H.escape(TT(lang, 'cp.closest2'))}</p>
<ul class="pl">{rows}</ul>
<h2>{H.escape(TT(lang, 'cp.how'))}</h2>
<p>{H.escape(TT(lang, 'cp.how2', C=STATS["cities"], K=STATS["countries"]))}</p>
<div class="btns"><a class="btn btn--p" href="../?city={Q(qcity)}">{H.escape(TT(lang, 'cp.btn', city=city))}</a>
<a class="btn" href="{sl}.cartel.html">{H.escape(TT(lang, 'cp.poster'))}</a>
<a class="btn" href="../incrustar.html?v={PAGES_V}&amp;city={Q(qcity)}">&lt;/&gt; {H.escape(TT(lang, 'cp.embed'))}</a>
<a class="btn" href="../prensa.html?v={PAGES_V}">{H.escape(TT(lang, 'cp.press'))}</a>
<a class="btn" href="./">{H.escape(TT(lang, 'cp.cities'))}</a>
<a class="btn" href="../t/{sl}.html">{H.escape(TT(lang, 'cp.lite'))}</a></div>
<footer>SupportNear &middot; OpenStreetMap (ODbL)</footer>
</div>
</body>
</html>'''
    return body, total


def poster(city, country, cc, lang, sl, lat=None, lon=None):
    """Cartel A4 para imprimir y pegar en una pared: donde no llega una app, llega
    un papel. QR grande, cuatro palabras, el numero de emergencias del pais."""
    cn = CATN.get(lang, CATNAME)
    url = 'https://supportnear.com/?city=' + Q(city)
    emg = EMG_N.get(cc); emgnum = emg[0] if emg else ''
    dir_attr = ' dir="rtl"' if lang in RTL else ''
    icons = {'food': '<path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M17 3c-2 0-3 3-3 6v3h3v9"/>',
             'shelter': '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-6h6v6"/>',
             'hygiene': '<path d="M4 4v16M4 6h5a4 4 0 0 1 4 4v1"/><path d="M8 14v.01M11 14v.01M14 14v.01M9 17v.01M12 17v.01"/>',
             'clothes': '<path d="M8 3l4 2 4-2 4 4-3 2v12H7V9L4 7z"/>',
             'health': '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'}
    row = ''.join('<div class="k"><svg viewBox="0 0 24 24">%s</svg><span>%s</span></div>' % (icons[c], H.escape(cn[c])) for c in ['food', 'shelter', 'hygiene', 'clothes', 'health'])
    # cinco sitios con nombre, uno por necesidad, los mas cercanos al centro: el
    # cartel sirve aunque nadie tenga movil con el que leer el QR
    five = []
    if lat is not None:
        near = [(d, q) for d, q in around(lat, lon, 8) if q['name']]
        used = set()
        for c in ['food', 'shelter', 'hygiene', 'health', 'social', 'clothes']:
            for d, q in near:
                if q['cat'] == c and q['id'] not in used and not re.search(r's\.?l\.?u?\.?$|s\.?a\.?$|clear channel|jcdecaux', q['name'], re.I):
                    five.append((d, q)); used.add(q['id']); break
            if len(five) >= 5: break
    subs = SUB_EN
    try:
        if lang != 'en': subs = json.load(io.open('l/%s.json' % lang, encoding='utf-8')).get('sub', SUB_EN)
    except Exception: pass
    five_html = ''
    if five:
        five_html = '<ol class="five">' + ''.join(
            '<li><b>%s</b> <span>%s</span>%s%s%s</li>' % (H.escape(q['name']), H.escape(subs.get(q['sub'], '') or cn[q['cat']]),
              (' &middot; ' + H.escape(q['addr'])) if q['addr'] else '', (' &middot; ' + H.escape(q['phone'])) if q.get('phone') else '',
              (' &middot; ' + H.escape(oh_human(q.get('oh', ''), lang))) if q.get('oh') else '')
            for d, q in five) + '</ol>'
    return f'''<!DOCTYPE html>
<html lang="{lang}"{dir_attr}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{H.escape(TT(lang, 'po.h1'))} · {H.escape(city)} · SupportNear</title>
<meta name="robots" content="noindex">
<style>
@page{{size:A4;margin:0}}
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{background:#fff;color:#111;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}}
.page{{width:210mm;min-height:297mm;margin:0 auto;padding:18mm 16mm 14mm;display:flex;flex-direction:column;position:relative}}
.top{{display:flex;align-items:center;gap:10px;font-weight:800;font-size:22px;letter-spacing:-.02em;color:#0B7A63}}
.top i{{width:34px;height:34px;border-radius:10px;background:#0B7A63;display:inline-grid;place-items:center}}
.top svg{{width:22px;height:22px;stroke:#fff;fill:none;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}}
h1{{font-size:58px;line-height:1.02;letter-spacing:-.03em;margin:14mm 0 6mm;font-weight:900}}
.sub{{font-size:22px;color:#333;line-height:1.35;margin-bottom:8mm}}
.kinds{{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:10mm}}
.k{{border:2px solid #111;border-radius:14px;padding:10px 6px;text-align:center;font-weight:700;font-size:13.5px;line-height:1.15}}
.k svg{{width:30px;height:30px;stroke:#111;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;display:block;margin:0 auto 6px}}
.qrbox{{display:flex;align-items:center;gap:8mm;margin:2mm 0 4mm}}
.qr{{width:62mm;height:62mm;flex:none;border:3px solid #111;border-radius:16px;padding:4mm;background:#fff}}
.five{{padding-inline-start:7mm;margin:0 0 4mm;font-size:13.5px;line-height:1.35}}
.five li{{padding:2.2mm 0;border-bottom:1px dashed #bbb}} .five b{{font-size:15px}} .five span{{color:#444}}
.qr svg{{width:100%;height:100%;display:block}}
.scan{{font-size:24px;font-weight:800;line-height:1.2}}
.scan small{{display:block;font-size:17px;font-weight:500;color:#444;margin-top:8px}}
.url{{font-size:30px;font-weight:900;letter-spacing:-.02em;margin-top:10px;color:#0B7A63;word-break:break-all}}
.free{{margin-top:8mm;font-size:18px;font-weight:700;padding:12px 16px;border-radius:12px;background:#E4F2EE;color:#075443;text-align:center}}
.emg{{margin-top:5mm;font-size:22px;font-weight:900;padding:12px 16px;border-radius:12px;background:#FDECEC;color:#B3261E;text-align:center}}
.foot{{margin-top:auto;padding-top:8mm;font-size:12.5px;color:#555;line-height:1.45}}
.city{{position:absolute;top:18mm;inset-inline-end:16mm;font-size:16px;font-weight:700;color:#555}}
@media print{{.page{{padding:14mm 14mm 10mm}}}}
@media screen{{body{{background:#eee;padding:12px}} .page{{box-shadow:0 4px 30px rgba(0,0,0,.2)}}}}
@media screen and (max-width:830px){{body{{padding:8px 0}}}}
</style><script>/* en el movil el A4 se salia de la pantalla: se encoge a lo ancho (al imprimir sigue siendo A4) */function fit(){{var w=document.documentElement.clientWidth,p=document.querySelector('.page');if(!p)return;p.style.zoom=w<810?(w/800).toFixed(3):''}}addEventListener('DOMContentLoaded',fit);addEventListener('resize',fit);addEventListener('beforeprint',function(){{var p=document.querySelector('.page');if(p)p.style.zoom=''}});addEventListener('afterprint',fit)</script></head><body>
<div class="page">
<div class="top"><i><svg viewBox="0 0 24 24"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><path d="M12 7v6M9 10h6"/></svg></i>SupportNear</div>
<div class="city">{H.escape(city)}</div>
<h1>{H.escape(TT(lang, 'po.h1'))}</h1>
<p class="sub">{H.escape(TT(lang, 'po.sub'))}</p>
<div class="kinds">{row}</div>
<div class="qrbox"><div class="qr">{qr_svg(url)}</div>
<div><div class="scan">{H.escape(TT(lang, 'po.scan'))}<small>{H.escape(TT(lang, 'po.or'))}</small></div>
<div class="url">supportnear.com</div></div></div>
{five_html}
<div class="free">{H.escape(TT(lang, 'po.free'))} · {H.escape(TT(lang, 'po.lang'))}</div>
{('<div class="emg">%s</div>' % H.escape(TT(lang, 'po.emg', n=emgnum))) if emgnum else ''}
<p class="foot">{H.escape(TT(lang, 'po.foot', C=STATS['cities'], K=STATS['countries']))}</p>
</div>
</body></html>'''



# ---------------- una pagina por ciudad y por necesidad ----------------
# La pagina de ciudad responde a «ayuda en Madrid». Nadie escribe eso. Se
# escribe «comedor social madrid», «albergue para dormir barcelona», «douche
# gratuite paris». Cada necesidad con al menos tres sitios con nombre tiene su
# pagina, con la palabra que se busca en el titulo y en el h1, y abre el mapa ya
# filtrado por esa necesidad (?city=X&need=food).
NEED_MIN = 3


def need_page(city, country, cc, lang, sl, cat, near, local='', total=0, main_lang=None):
    cn = CATN.get(lang, CATNAME)
    word = TT(lang, 'pl.' + cat)
    all_c = [(d, q) for d, q in near if q['cat'] == cat]
    items = [(d, q) for d, q in all_c if q['name']][:40]
    ncat = len(all_c)
    h1 = TT(lang, 'cn.h1', need=cap(word), city=city)
    desc = TT(lang, 'cn.desc', n=ncat, city=city, country=country)
    url = 'https://supportnear.com/c/%s-%s%s.html' % (sl, cat, '.en' if main_lang else '')
    home = main_lang or lang
    alts_n = ('<link rel="alternate" hreflang="%s" href="https://supportnear.com/c/%s-%s.html">' % (home, sl, cat)
              + (('<link rel="alternate" hreflang="en" href="https://supportnear.com/c/%s-%s.en.html">' % (sl, cat)) if (main_lang or NEED_EN.get((sl, cat))) and home != 'en' else '')
              + '<link rel="alternate" hreflang="x-default" href="https://supportnear.com/c/%s-%s.html">' % (sl, cat))
    emg = EMG_N.get(cc); emgnum = emg[0] if emg else ''
    dir_attr = ' dir="rtl"' if lang in RTL else ''
    subs = SUB_EN
    try:
        if lang != 'en':
            subs = json.load(io.open('l/%s.json' % lang, encoding='utf-8')).get('sub', SUB_EN)
    except Exception:
        pass
    rows = ''.join(
        '<li><div class="pl-h"><a href="../#p=%s@%.5f,%.5f">%s</a>'
        '<span class="ct">%s</span><span class="d">%s</span></div>%s%s%s</li>'
        % (H.escape(q['id']), q['lat'], q['lon'], H.escape(q['name']),
           H.escape(subs.get(q['sub'], '') or cn[cat]), H.escape(TT(lang, 'cp.from', d=km(d))),
           ('<span class="ad">%s</span>' % H.escape(q['addr'])) if q['addr'] else '',
           ('<span class="ad">%s</span>' % H.escape(oh_human(q['oh'], lang))) if q.get('oh') else '',
           ('<span class="ad"><a href="tel:%s">%s</a></span>' % (H.escape(re.sub(r'[^+\d]', '', q['phone'])), H.escape(q['phone']))) if q.get('phone') else '')
        for d, q in items)
    others = ''.join('<a href="%s-%s.html">%s</a>' % (sl, c, H.escape(TT(lang, 'pl.' + c)))
                     for c in NEED_ORDER if c != cat and sum(1 for _, q in near if q['cat'] == c and q['name']) >= NEED_MIN)
    named_n = sum(1 for _, q in all_c if q['name'])
    ld = json.dumps(ld_clean([{
        "@context": "https://schema.org", "@type": "WebPage", "name": h1, "description": desc,
        "inLanguage": lang, "url": url,
        "isPartOf": {"@type": "WebSite", "name": "SupportNear", "url": "https://supportnear.com/"},
        "about": {"@type": "City", "name": city, "containedInPlace": {"@type": "Country", "name": country}},
        "dateModified": date.today().isoformat()
    }, {
        "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "SupportNear", "item": "https://supportnear.com/"},
            {"@type": "ListItem", "position": 2, "name": city, "item": "https://supportnear.com/c/%s.html" % sl},
            {"@type": "ListItem", "position": 3, "name": h1, "item": url}]
    }, {
        "@context": "https://schema.org", "@type": "ItemList", "name": h1,
        "itemListElement": [{"@type": "ListItem", "position": i + 1, "item": {"@type": "Place", "name": q['name'],
            "address": q['addr'] or None, "telephone": q.get('phone') or None,
            "openingHours": ld_oh(q.get('oh')),
            "geo": {"@type": "GeoCoordinates", "latitude": round(q['lat'], 5), "longitude": round(q['lon'], 5)},
            "url": "https://supportnear.com/#p=%s@%.5f,%.5f" % (q['id'], q['lat'], q['lon'])}}
            for i, (_, q) in enumerate(items[:10])]
    }]), ensure_ascii=False).replace('</', LDESC)
    qcity = Q(local if (lang != 'en' and local) else city)
    return f"""<!DOCTYPE html>
<html lang="{lang}"{dir_attr}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{H.escape(h1)} · SupportNear</title>
<meta name="description" content="{H.escape(desc)}">
<link rel="canonical" href="{url}">
{alts_n}
<meta property="og:title" content="{H.escape(h1)}">
<meta property="og:description" content="{H.escape(desc)}">
<meta property="og:image" content="{social_img(lang)}"><meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="SupportNear: free help near you. Food, a bed, a shower, clothes, a doctor.">
<meta property="og:type" content="website"><meta property="og:site_name" content="SupportNear">
<meta property="og:url" content="{url}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@mrstartups">
<meta name="twitter:title" content="{H.escape(h1)}"><meta name="twitter:description" content="{H.escape(desc)}">
<meta name="twitter:image" content="{social_img(lang)}">
<meta name="theme-color" content="#0B7A63">
<link rel="icon" href="../favicon.ico" sizes="32x32"><link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../apple-touch-icon.png">
<style>{CSS}{EXTRA_CSS}</style>
<script type="application/ld+json">{ld}</script>
</head>
<body>
<div class="wrap">
{header(sl + ('.en' if main_lang else '') + '.html', TT(lang, 'cn.all', city=city))}
<h1>{H.escape(h1)}</h1>
<p class="lede">{H.escape(TT(lang, 'cn.lede', n=ncat, city=city))}</p>
<div class="btns"><a class="btn btn--p" href="../?city={qcity}&amp;need={cat}">{H.escape(TT(lang, 'cn.btn', city=city))}</a>
<a class="btn" href="../instalar.html?v={PAGES_V}">{H.escape(TT(lang, 'cp.offline'))}</a></div>
{('<div class="emg"><strong>%s</strong> %s</div>' % (H.escape(TT(lang, 'cp.emg', country=country, n=emgnum)), H.escape(TT(lang, 'cp.emg2')))) if emgnum else ''}
<h2>{H.escape(TT(lang, 'cn.list'))}</h2>
<p class="note">{H.escape(TT(lang, 'cn.check'))}</p>
<ul class="pl">{rows}</ul>
{('<p class="note">' + H.escape(TT(lang, 'cn.unnamed', k=ncat - named_n)) + '</p>') if ncat - named_n >= 3 else ''}
{('<h2>' + H.escape(TT(lang, 'cn.other', city=city)) + '</h2><p class="needs">' + others + '</p>') if others else ''}
<h2>{H.escape(TT(lang, 'cp.how'))}</h2>
<p>{H.escape(TT(lang, 'cp.how2', C=STATS["cities"], K=STATS["countries"]))}</p>
<div class="btns"><a class="btn btn--p" href="../?city={qcity}&amp;need={cat}">{H.escape(TT(lang, 'cn.btn', city=city))}</a>
<a class="btn" href="{sl}.cartel.html">{H.escape(TT(lang, 'cp.poster'))}</a>
<a class="btn" href="./">{H.escape(TT(lang, 'cp.cities'))}</a></div>
<footer>SupportNear &middot; OpenStreetMap (ODbL)</footer>
</div>
</body>
</html>"""


os.makedirs('c', exist_ok=True)
os.makedirs('t', exist_ok=True)
for f in os.listdir('t'):
    if f.endswith('.html'): os.remove(os.path.join('t', f))
lite_idx = []


def lite(city, country, lat, lon, cc, lang, sl, near=None, index=True):
    """Version de texto: menos de 5 KB, sin CSS que importe, sin script. Para un
    Nokia con Opera Mini, un movil de 2012 o una conexion que se cae. Diez
    sitios con calle, telefono y horario, y el numero de emergencias.

    Hasta hoy llevaba noindex y no estaba en el sitemap: la unica pagina que
    abre en dos segundos con una conexion de 2G era justo la que Google no
    podia ensenar. Ahora se indexa ella misma (canonical a si misma) siempre
    que tenga algo que contar; las que casi no tienen sitios siguen fuera."""
    if near is None:
        near = around(lat, lon, 10)
    near = [(d, q) for d, q in near if q['name']][:10]
    cn = CATN.get(lang, CATNAME)
    subs = SUB_EN
    try:
        if lang != 'en': subs = json.load(io.open('l/%s.json' % lang, encoding='utf-8')).get('sub', SUB_EN)
    except Exception: pass
    emg = EMG_N.get(cc); emgnum = emg[0] if emg else ''
    dir_attr = ' dir="rtl"' if lang in RTL else ''
    items = ''.join('<li><b>%s</b> (%s)%s%s%s <small>%s</small></li>' % (
        H.escape(q['name']), H.escape(subs.get(q['sub'], '') or cn[q['cat']]),
        (' - ' + H.escape(q['addr'])) if q['addr'] else '',
        (' - <a href="tel:%s">%s</a>' % (H.escape(re.sub(r'[^+\d]', '', q['phone'])), H.escape(q['phone']))) if q.get('phone') else '',
        (' - ' + H.escape(oh_human(q['oh'], lang))) if q.get('oh') else '', H.escape(km(d))) for d, q in near)
    return ('<!DOCTYPE html><html lang="%s"%s><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>%s - SupportNear</title><meta name="robots" content="%s"><link rel="canonical" href="https://supportnear.com/t/%s.html">'
            '<meta name="description" content="%s">'
            '<meta property="og:title" content="%s"><meta property="og:image" content="%s"><meta property="og:url" content="https://supportnear.com/t/%s.html"><meta name="twitter:card" content="summary_large_image">'
            '<style>body{font:16px/1.5 sans-serif;margin:12px;max-width:40em}li{margin:0 0 10px}small{color:#555}</style></head><body>'
            '<p><b>SupportNear</b> - %s</p><h1>%s</h1>%s<ol>%s</ol>'
            '<p><a href="../c/%s.html">%s</a> - <a href="../">supportnear.com</a> - <a href="./">%s</a></p>'
            '<p><small>OpenStreetMap (ODbL)</small></p></body></html>') % (
        lang, dir_attr, H.escape(TT(lang, 'cp.h1', city=city)),
        'index,follow' if index else 'noindex,follow', sl,
        H.escape(TT(lang, 'cn.desc', n=len(near), city=city, country=country)),
        H.escape(TT(lang, 'cp.h1', city=city)), social_img(lang), sl, H.escape(TT(lang, 'po.free')),
        H.escape(TT(lang, 'cp.h1', city=city)),
        ('<p><b>%s</b></p>' % H.escape(TT(lang, 'po.emg', n=emgnum))) if emgnum else '', items,
        sl, H.escape(TT(lang, 'cp.closest')), H.escape(TT(lang, 'cp.cities')))

for f in os.listdir('c'):
    if f.endswith('.html'):
        os.remove(os.path.join('c', f))

# ---- el nombre limpio, para la ciudad que la gente busca ----
# Ocho nombres estan repetidos en el mundo: Valencia, Cordoba, Santiago, Toledo,
# Merida... Hasta hoy se quedaba con /c/valencia.html la primera que salia en la
# lista, y esa era Valencia de Venezuela: quien buscaba «comedor social
# valencia» desde Espana aterrizaba en la pagina equivocada. Ahora el nombre
# limpio es de la que mas sitios tiene mapeados y las demas llevan el pais
# detras, y el indice de ciudades usa exactamente este mismo mapa (antes no: el
# indice enlazaba a slugs que no existian).
CINFO = []
for c in CITIES:
    raw, lat, lon, country = c[0], c[1], c[2], c[3] or ''
    name, local = split_name(raw)
    cc = CC.get((round(lat, 3), round(lon, 3)), '')
    if not cc and ((35.0 <= lat <= 44.0 and -9.5 <= lon <= 4.5) or (27.5 <= lat <= 29.5 and -18.5 <= lon <= -13.3)):
        cc = 'ES'          # las 48 ciudades espanolas vienen sin pais: llevan la comunidad
        country = 'España'
    CINFO.append({'raw': raw, 'name': name, 'local': local, 'lat': lat, 'lon': lon,
                  'country': country, 'cc': cc, 'near': around(lat, lon, 10)})

_by = {}
for i, ci in enumerate(CINFO):
    _by.setdefault(slug(ci['name']), []).append(i)
_dups = 0
for base, idxs in _by.items():
    if len(idxs) == 1:
        CINFO[idxs[0]]['sl'] = base
        continue
    _dups += 1
    idxs.sort(key=lambda i: (-len(CINFO[i]['near']), CINFO[i]['country']))
    CINFO[idxs[0]]['sl'] = base
    taken = set(_by)
    for i in idxs[1:]:
        stem = base + '-' + (slug(CINFO[i]['country']) or CINFO[i]['cc'].lower() or 'x')
        sl2, k = stem, 2
        while sl2 in taken:
            sl2 = '%s-%d' % (stem, k); k += 1
        taken.add(sl2); CINFO[i]['sl'] = sl2
print('nombres repetidos resueltos:', _dups)

urls = []; empty = 0; needs_made = 0
# Las ciudades no inglesas con bastante de una necesidad tienen tambien la pagina
# en ingles («food banks in Madrid»): quien llega de fuera busca en ingles.
NEED_EN = {}
for _ci in CINFO:
    _lang = LANG_BY_CC.get(_ci['cc'], 'en')
    if _lang == 'en': continue
    _nc = Counter(q['cat'] for _, q in _ci['near'] if q['name'])
    for _c in NEED_ORDER:
        if _nc[_c] >= 8: NEED_EN[(_ci['sl'], _c)] = 1
needs_en = 0
for ci in CINFO:
    name, local, lat, lon = ci['name'], ci['local'], ci['lat'], ci['lon']
    country, cc, sl, near = ci['country'], ci['cc'], ci['sl'], ci['near']
    lang = LANG_BY_CC.get(cc, 'en')
    country_en = country
    country = country_in(cc, lang, country)
    ncnt = Counter(q['cat'] for _, q in near if q['name'])
    acnt = Counter(q['cat'] for _, q in near)
    needs = [(c, acnt[c]) for c in NEED_ORDER if ncnt[c] >= NEED_MIN]
    body, total = page(name, country, lat, lon, cc, local, ci['raw'], lang, near, sl, needs)
    if total == 0:
        empty += 1
    io.open(os.path.join('c', sl + '.html'), 'w', encoding='utf-8').write(body)
    urls.append(('https://supportnear.com/c/%s.html' % sl, 0.6 if total >= 15 else 0.4))
    if lang != 'en':
        # la version inglesa tambien, para quien llega de fuera
        body_en, _ = page(name, country_en, lat, lon, cc, local, ci['raw'], 'en', near, sl, needs, main_lang=lang)
        io.open(os.path.join('c', sl + '.en.html'), 'w', encoding='utf-8').write(body_en)
        urls.append(('https://supportnear.com/c/%s.en.html' % sl, 0.3))
    # una pagina por necesidad: «comedores sociales en Madrid», «albergues en
    # Barcelona». Es la busqueda que existe de verdad.
    cname = local if (lang != 'en' and local) else name
    for cat, k in needs:
        io.open(os.path.join('c', '%s-%s.html' % (sl, cat)), 'w', encoding='utf-8').write(
            need_page(cname, country, cc, lang, sl, cat, near, name, total))
        urls.append(('https://supportnear.com/c/%s-%s.html' % (sl, cat), 0.7 if k >= 8 else 0.5))
        needs_made += 1
        if NEED_EN.get((sl, cat)):
            io.open(os.path.join('c', '%s-%s.en.html' % (sl, cat)), 'w', encoding='utf-8').write(
                need_page(name, country_en, cc, 'en', sl, cat, near, name, total, main_lang=lang))
            urls.append(('https://supportnear.com/c/%s-%s.en.html' % (sl, cat), 0.4))
            needs_en += 1
    io.open(os.path.join('c', sl + '.cartel.html'), 'w', encoding='utf-8').write(poster(name, country, cc, lang, sl, lat, lon))
    nlite = sum(1 for _, q in near if q['name'])
    io.open(os.path.join('t', sl + '.html'), 'w', encoding='utf-8').write(
        lite(name, country, lat, lon, cc, lang, sl, near, nlite >= 5))
    if nlite >= 5:
        urls.append(('https://supportnear.com/t/%s.html' % sl, 0.3))
    lite_idx.append((country, name, sl))
print('paginas ciudad x necesidad:', needs_made, '| en ingles:', needs_en)

# ---- donde falta ayuda: las ciudades del mapa sin comedor, albergue o ducha a 10 km ----
# Para voluntarios de OpenStreetMap y entidades: lo que no esta en el mapa no
# lo encuentra nadie. Cada fila abre el editor en esa ciudad.
_GAP = ['food', 'shelter', 'hygiene', 'health']
_gap_rows = []
for ci in CINFO:
    _c = Counter(q['cat'] for _, q in ci['near'])
    miss = [g for g in _GAP if not _c[g]]
    if miss: _gap_rows.append((len(miss), ci['country'], ci['name'], ci['sl'], miss, ci['lat'], ci['lon']))
_gap_rows.sort(key=lambda r: (-r[0], r[1], r[2]))
_GN = {'food': 'free food', 'shelter': 'shelter', 'hygiene': 'showers / toilets', 'health': 'free clinic'}
_gtab = ''.join('<tr><td><a href="%s.html">%s</a></td><td>%s</td><td>%s</td><td><a href="https://www.openstreetmap.org/edit#map=14/%.4f/%.4f" target="_blank" rel="noopener">edit map</a></td></tr>'
                % (sl, H.escape(n), H.escape(co), H.escape(', '.join(_GN[g] for g in m)), la, lo) for _, co, n, sl, m, la, lo in _gap_rows)
io.open('huecos.html', 'w', encoding='utf-8').write(f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Where free help is missing on the map · SupportNear</title>
<meta name="description" content="{len(_gap_rows)} cities with no free food, shelter, showers or clinic mapped within 10 km. Help fix the open map.">
<link rel="canonical" href="https://supportnear.com/huecos.html">
<meta property="og:title" content="Where free help is missing on the map"><meta property="og:image" content="https://supportnear.com/social.jpg{SV}">
<link rel="icon" href="favicon.ico" sizes="32x32"><meta name="theme-color" content="#0B7A63">
<style>{CSS}{EXTRA_CSS}
table{{width:100%;border-collapse:collapse;font-size:14.5px}} td,th{{border-bottom:1px solid var(--line);padding:8px 6px;text-align:start;vertical-align:top}} th{{font-size:13px;color:var(--ink-3)}}
.tw{{overflow-x:auto}}</style></head>
<body><div class="wrap">{header('./', 'Open the map').replace('../', './')}
<h1>Where free help is missing on the map</h1>
<p class="lede">These {len(_gap_rows)} cities have <b>nothing</b> mapped within 10 km for at least one basic need. Often the help exists but nobody has put it on OpenStreetMap. If you know a soup kitchen, a shelter, public showers or a free clinic in one of them, add it — it will show up here, and in every other app that uses the open map.</p>
<p><a class="btn btn--p" href="https://www.openstreetmap.org/" target="_blank" rel="noopener">How to add a place on OpenStreetMap</a></p>
<div class="tw"><table><tr><th>City</th><th>Country</th><th>Missing within 10 km</th><th></th></tr>{_gtab}</table></div>
<footer>SupportNear &middot; a non-profit project &middot; data from OpenStreetMap (ODbL) &middot; updated {date.today().isoformat()}</footer>
</div></body></html>""")
urls.append(('https://supportnear.com/huecos.html', 0.5))
print('huecos:', len(_gap_rows), 'ciudades')

# indice de la version de texto: una lista, nada mas
lite_idx.sort()
_li = ''; _last = None
for country, name, sl in lite_idx:
    if country != _last:
        _li += '<h2>%s</h2>' % H.escape(country or '-'); _last = country
    _li += '<a href="%s.html">%s</a> ' % (sl, H.escape(name))
io.open('t/index.html', 'w', encoding='utf-8').write(
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    '<title>Free help by city, text only · SupportNear</title><meta name="robots" content="index,follow">'
    '<link rel="canonical" href="https://supportnear.com/t/">'
    '<meta name="description" content="Free food, shelter, showers and clothes, city by city, in plain text: under 5 KB a page, for an old phone or a connection that keeps dropping.">'
    '<style>body{font:16px/1.6 sans-serif;margin:12px;max-width:40em}h2{font-size:17px;margin:14px 0 2px}a{display:inline-block;margin:0 8px 2px 0;padding:6px 2px;min-height:32px}</style></head><body>'
    '<p><b>SupportNear</b> - text version for old phones. Free help: food, shelter, showers, clothes, health.</p>'
    '<p><a href="../">Open the full map</a></p>' + _li + '</body></html>')
print('version de texto:', len(lite_idx), 'ciudades')

# indice de ciudades, para que se pueda llegar a todas desde un sitio (y Google tambien)
by_country = {}
for ci in CINFO:
    by_country.setdefault(ci['country'], []).append((ci['name'], ci['sl']))
idx = ''.join('<section data-c="%s"><h2>%s <small>(%d)</small></h2><p>%s</p></section>' % (H.escape(k.lower()), H.escape(k), len(v), ' &middot; '.join('<a href="%s.html">%s</a>' % (sl, H.escape(n)) for n, sl in sorted(v)))
              for k, v in sorted(by_country.items()))
idx = ('<p><input id="f" type="search" placeholder="Filter by city or country…" aria-label="Filter" '
       'style="width:100%;font:inherit;font-size:16px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:var(--paper-2)"></p>'
       + idx + """<script>
document.getElementById('f').addEventListener('input',function(e){var q=e.target.value.trim().toLowerCase();
document.querySelectorAll('section[data-c]').forEach(function(s){var hit=!q||s.dataset.c.indexOf(q)>=0;var any=false;
s.querySelectorAll('a').forEach(function(a){var m=hit||a.textContent.toLowerCase().indexOf(q)>=0;a.style.display=m?'':'none';if(m)any=true;});
s.style.display=any?'':'none';});});</script>""")
io.open('c/index.html', 'w', encoding='utf-8').write(f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Free help by city · SupportNear</title>
<meta name="description" content="Free food, shelter, showers and help in {format(len(CITIES), ',d')} cities across {STATS['countries']} countries. Pick your city.">
<link rel="canonical" href="https://supportnear.com/c/">
<meta property="og:type" content="website"><meta property="og:site_name" content="SupportNear">
<meta property="og:url" content="https://supportnear.com/c/"><meta property="og:title" content="Free help by city &middot; SupportNear"><meta property="og:description" content="Free food, shelter, showers and help in {format(len(CITIES), ',d')} cities across {STATS['countries']} countries. Pick your city.">
<meta property="og:image" content="https://supportnear.com/social.jpg{SV}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="SupportNear: free help, mapped in 166 countries. Food, a bed, a shower, clothes, a doctor.">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@mrstartups"><meta name="twitter:title" content="Free help by city &middot; SupportNear"><meta name="twitter:description" content="Free food, shelter, showers and help in {format(len(CITIES), ',d')} cities across {STATS['countries']} countries. Pick your city."><meta name="twitter:image" content="https://supportnear.com/social.jpg{SV}">
<link rel="icon" href="../favicon.ico" sizes="32x32"><link rel="icon" href="../favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="../apple-touch-icon.png"><meta name="theme-color" content="#0B7A63">
<style>{CSS}{EXTRA_CSS}
h2{{font-size:17px;margin:22px 0 6px;padding-top:16px}} p{{line-height:1.9}}</style></head>
<body><div class="wrap">{header('../', 'Open the map')}
<h1>Free help by city</h1>
<p class="lede">{format(len(CITIES), ',d')} cities in {STATS['countries']} countries. Each page lists what there is near the centre and opens the live map.</p>
{idx}
<footer>SupportNear &middot; a non-profit project &middot; data from OpenStreetMap (ODbL)</footer>
</div></body></html>""")

main = [('https://supportnear.com/', 1.0), ('https://supportnear.com/c/', 0.8), ('https://supportnear.com/t/', 0.5),
        ('https://supportnear.com/cambios.html', 0.7), ('https://supportnear.com/prensa.html', 0.7),
        ('https://supportnear.com/incrustar.html', 0.6), ('https://supportnear.com/instalar.html', 0.6)]
sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
# lastmod: la fecha de hoy para lo que se regenera (todo lo que hay aqui sale de
# este mismo script o del build de hoy), asi Google sabe que hay algo nuevo que
# rastrear. Y una lista plana de URLs para IndexNow (indexnow.py).
import datetime as _dt
_today = _dt.date.today().isoformat()
for u, pr in main + urls:
    sm.append('<url><loc>%s</loc><lastmod>%s</lastmod><priority>%.1f</priority></url>' % (H.escape(u), _today, pr))
io.open('urls_all.txt', 'w', encoding='utf-8').write('\n'.join(u for u, _ in main + urls))
sm.append('</urlset>')
io.open('sitemap.xml', 'w', encoding='utf-8').write('\n'.join(sm))
io.open('robots.txt', 'w', encoding='utf-8').write('User-agent: *\nAllow: /\nSitemap: https://supportnear.com/sitemap.xml\n')
sz = sum(os.path.getsize(os.path.join('c', f)) for f in os.listdir('c'))
from collections import Counter as _C
print('paginas: %d | sin ningun sitio a 10 km: %d | %.1f MB en total | sitemap con %d urls' % (len(urls), empty, sz / 1e6, len(main) + len(urls)))
