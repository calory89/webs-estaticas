#!/usr/bin/env python3
"""Genera /chollos/ y /chollos/<slug>/ desde el agente (Supabase hlc-deals). Idempotente.
Uso (desde la raíz de la rama pub/happylowcost.com): python3 _hlc/gen_deals.py
"""
import os, re, json, html, unicodedata, urllib.request, urllib.parse, io, datetime
from urllib.parse import quote
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
HERE = os.path.join(ROOT, '_hlc')
import sys
sys.path.insert(0, HERE)
API = 'https://gmdalfsvtfhzepyrdmjj.supabase.co/functions/v1/hlc-deals?action=feed'
SITE = 'https://www.happylowcost.com'
UA = {'User-Agent': 'HappyLowCost/1.0 (carlos@equinoxinvestmentgroup.com)'}
HEAD = open(os.path.join(HERE, 'partials', 'head.html'), encoding='utf-8').read()
LIB = os.path.join('hlc', 'img', 'cities')
CR = json.load(open(os.path.join(LIB, 'credits.json'), encoding='utf-8'))
F = lambda n, s: ImageFont.truetype(os.path.join(HERE, 'fonts', n), s)
MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
ALIAS = {'nueva-york': ['new-york', 'nueva-york', 'nyc'], 'la-habana': ['habana', 'la-habana'], 'el-cairo': ['cairo', 'el-cairo'], 'tokio': ['tokyo', 'tokio'],
         'estambul': ['istanbul', 'estambul'], 'copenhague': ['copenhagen', 'copenhague'], 'londres': ['london', 'londres'], 'paris': ['paris'], 'roma': ['rome', 'roma'],
         'maldivas': ['maldivas', 'male', 'maldives'], 'bali': ['bali', 'denpasar'], 'punta-cana': ['punta-cana'], 'amsterdam': ['amsterdam'], 'bangkok': ['bangkok'],
         'budapest': ['budapest'], 'lisboa': ['lisboa', 'lisbon'], 'marrakech': ['marrakech', 'marrakesh'], 'tenerife': ['tenerife'], 'varsovia': ['warsaw', 'warszawa'], 'praga': ['prague', 'praha'], 'viena': ['vienna', 'wien'], 'berlin': ['berlin'], 'oporto': ['porto'], 'milan': ['milano', 'milan'],
         'venecia': ['venice', 'venezia'], 'florencia': ['florence', 'firenze'], 'napoles': ['naples', 'napoli'], 'atenas': ['athens'], 'cracovia': ['krakow', 'cracow'], 'bruselas': ['brussels', 'bruxelles'],
         'brujas': ['bruges', 'brugge'], 'edimburgo': ['edinburgh'], 'estocolmo': ['stockholm'], 'reikiavik': ['reykjavik', 'reikiavic', 'islandia'], 'malta': ['la-valeta', 'valletta'],
         'munich': ['munchen'], 'bucarest': ['bucharest'], 'sofia': ['sofia'], 'fez': ['fes'], 'dubai': ['dubai'], 'cancun': ['cancun'], 'ciudad-de-mexico': ['mexico-city', 'mexico-df', 'cdmx'],
         'lima': ['lima', 'cusco', 'cuzco', 'machu-picchu'], 'buenos-aires': ['buenos-aires'], 'rio-de-janeiro': ['rio', 'rio-de-janeiro'], 'los-angeles': ['la', 'los-angeles'], 'san-francisco': ['san-francisco'],
         'singapur': ['singapore', 'singapur'], 'hanoi': ['hanoi', 'ha-long'], 'seul': ['seoul', 'seul'], 'kioto': ['kyoto'], 'ciudad-del-cabo': ['cape-town'], 'sri-lanka': ['colombo'],
         'tallin': ['tallinn'], 'vilna': ['vilnius'], 'zurich': ['zurich'], 'bolonia': ['bologna'], 'salzburgo': ['salzburg'], 'hamburgo': ['hamburg'], 'mykonos': ['miconos'], 'chipre': ['larnaca', 'pafos', 'paphos'],
         'belgrado': ['belgrade'], 'cerdena': ['cagliari', 'olbia', 'alghero', 'sardinia'], 'creta': ['heraklion', 'chania', 'crete'], 'palermo': ['sicilia', 'catania'], 'bogota': ['bogota'], 'madeira': ['funchal', 'madeira'], 'azores': ['ponta-delgada', 'islas-azores', 'azores'], 'mauricio': ['isla-mauricio', 'mauritius', 'mauricio'], 'hong-kong': ['hong-kong', 'hongkong'], 'kuala-lumpur': ['kuala-lumpur'], 'manila': ['manila'], 'sal': ['sal', 'isla-de-sal', 'santa-maria'], 'portland': ['portland']}


def slugify(s):
    s = unicodedata.normalize('NFD', s or '').encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


def e(s):
    return html.escape(str(s if s is not None else ''), quote=True)


def guide_block(x):
    g = x.get('guide_html') or ''
    if not g:
        return ''
    g = re.sub(r'<(?!/?(h2|h3|p|ul|li|strong)\b)[^>]*>', '', g)
    g = re.sub(r'<(h2|h3|p|ul|li|strong)\b[^>]*>', r'<\1>', g)
    h = e(x.get('seo_title') or f"Qué ver en {x.get('facts', {}).get('destino', '')}")
    return f'<section class="guide"><div class="kicker">Guía del destino</div><h2 class="guide-h">{h}</h2>{g}</section>'


def fecha(iso):
    try:
        d = datetime.date.fromisoformat(iso[:10])
        return f'{d.day} {MESES[d.month - 1]} {d.year}'
    except Exception:
        return ''


def lib_photo(dest):
    k = slugify(dest)
    for slug, names in ALIAS.items():
        if k in names or k == slug:
            return os.path.join(LIB, slug + '.jpg'), CR.get(slug)
    p = os.path.join(LIB, k + '.jpg')
    return (p, CR.get(k)) if os.path.exists(p) else (None, None)


def wiki_photo(dest, country=''):
    """Imagen principal del artículo de Wikipedia del destino (horizontal, sin mapas ni escudos)."""
    for lang, q in (('es', f'{dest} {country}'.strip()), ('en', dest)):
        u = f'https://{lang}.wikipedia.org/w/api.php?' + urllib.parse.urlencode({'action': 'query', 'format': 'json', 'generator': 'search', 'gsrsearch': q, 'gsrlimit': 1, 'prop': 'pageimages', 'piprop': 'original|name'})
        try:
            j = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=40))
        except Exception:
            continue
        for pg in (j.get('query') or {}).get('pages', {}).values():
            o = pg.get('original') or {}
            src, w, h = o.get('source', ''), o.get('width', 0), o.get('height', 1)
            if not src or src.lower().endswith('.svg') or re.search(r'(map|mapa|flag|bandera|coat|escudo|logo|locator|location)', src, re.I) or w < 1000 or w / h < 1.2:
                continue
            thumb = re.sub(r'/commons/(\w/\w\w)/', r'/commons/thumb/\1/', src) + '/1600px-' + src.rsplit('/', 1)[-1] if '/commons/' in src else src
            im = fetch_img(thumb) or fetch_img(src)
            if im:
                return im, f'Foto: Wikipedia · Wikimedia Commons ({pg.get("title", "")})'
    return None, ''


def commons_photo(dest, country=''):
    """Foto para destinos fuera de la biblioteca: Wikipedia y, si no, foto destacada de Commons con paisaje urbano."""
    im, cr = wiki_photo(dest, country)
    if im:
        return im, cr
    for q in (f'{dest} skyline', f'{dest} panorama', f'{dest} {country}'.strip()):
        for cat in ('Featured_pictures_on_Wikimedia_Commons', 'Quality_images'):
            u = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({'action': 'query', 'format': 'json', 'generator': 'search', 'gsrsearch': f'{q} incategory:{cat} filetype:bitmap', 'gsrnamespace': 6, 'gsrlimit': 15, 'prop': 'imageinfo', 'iiprop': 'url|size|extmetadata', 'iiurlwidth': 1600})
            try:
                j = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=40))
            except Exception:
                continue
            for pg in sorted((j.get('query') or {}).get('pages', {}).values(), key=lambda p: p.get('index', 99)):
                ii = (pg.get('imageinfo') or [{}])[0]
                w, h = ii.get('width', 0), ii.get('height', 1)
                if w < 1800 or not 1.3 <= w / h <= 2.6:
                    continue
                md = ii.get('extmetadata', {})
                lic = re.sub('<[^>]+>', '', (md.get('LicenseShortName') or {}).get('value', ''))
                if not re.search(r'cc|public domain|pd', lic, re.I):
                    continue
                im = fetch_img(ii.get('thumburl') or ii['url'])
                if im:
                    art = re.sub('<[^>]+>', '', (md.get('Artist') or {}).get('value', '')).strip()[:60] or 'Wikimedia Commons'
                    return im, f'Foto: {art} · {lic} · Wikimedia Commons'
    return None, ''


def fetch_img(url):
    try:
        return Image.open(io.BytesIO(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read())).convert('RGB')
    except Exception:
        return None


def cover(im, w, h):
    r = max(w / im.width, h / im.height)
    im = im.resize((int(im.width * r + 1), int(im.height * r + 1)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def og_image(photo, f, out):
    W, H = 1200, 630
    base = cover(photo, W, H) if photo else Image.new('RGB', (W, H), (20, 33, 61))
    grad = Image.new('L', (1, H))
    for y in range(H):
        grad.putpixel((0, y), int(max(0, (y - H * 0.25) / (H * 0.75)) ** 1.3 * 235))
    shade = Image.new('RGB', (W, H), (20, 33, 61))
    base = Image.composite(shade, base, grad.resize((W, H)))
    d = ImageDraw.Draw(base)
    o, de = f.get('origen', ''), f.get('destino', '')
    size = 92
    while d.textlength(o + '      ' + de, font=F('B800.woff', size)) > W - 120 and size > 44:
        size -= 4
    fnt = F('B800.woff', size)
    y = H - 210
    d.text((60, y), o, font=fnt, fill='white')
    x0 = 60 + d.textlength(o, font=fnt) + size * 0.28
    aw, cy = size * 0.85, y + size * 0.62
    d.line((x0, cy, x0 + aw, cy), fill=(255, 197, 49), width=max(6, size // 11))
    d.polygon([(x0 + aw + size * 0.08, cy), (x0 + aw - size * 0.28, cy - size * 0.26), (x0 + aw - size * 0.28, cy + size * 0.26)], fill=(255, 197, 49))
    d.text((x0 + aw + size * 0.36, y), de, font=fnt, fill='white')
    meta = f"{f.get('tipo', '')} · {fecha(f.get('ida', ''))}" + (' · directo' if f.get('escalas') == 0 else '')
    d.text((62, H - 96), meta, font=F('I600.woff', 34), fill=(230, 235, 245))
    price = f"{f.get('precio')} €"
    pf = F('B800.woff', 96)
    pw = d.textlength(price, font=pf)
    d.rounded_rectangle((W - pw - 110, 44, W - 44, 44 + 128), radius=26, fill=(255, 197, 49))
    d.text((W - pw - 77, 52), price, font=pf, fill=(20, 33, 61))
    # logo
    import brand
    lw, lh = brand.logo_size(56)
    d.rounded_rectangle((44, 44, 44 + lw + 48, 44 + lh + 30), radius=22, fill=(255, 248, 238))
    brand.draw_logo(d, 68, 62, 56, low=(232, 67, 31))
    base.save(out, 'JPEG', quality=86, optimize=True, progressive=True)


CONT = {'Europa': ('europa', 'Europa', '🇪🇺'), 'Asia': ('asia', 'Asia', '🌏'), 'Oriente Medio': ('oriente-medio', 'Oriente Medio', '🕌'),
        'Norteamérica': ('norteamerica', 'Norteamérica', '🗽'), 'Centroamérica y Caribe': ('caribe', 'el Caribe y Centroamérica', '🏝️'),
        'Sudamérica': ('sudamerica', 'Sudamérica', '🌎'), 'África': ('africa', 'África', '🌍'), 'Oceanía': ('oceania', 'Oceanía', '🦘')}
CONT_BY_SLUG = {v[0]: (k, v[1], v[2]) for k, v in CONT.items()}
DLIB = json.load(open(os.path.join('hlc', 'destinos.json'), encoding='utf-8'))


def flag(cc):
    cc = (cc or '').upper()
    return ''.join(chr(0x1F1E6 + ord(c) - 65) for c in cc) if len(cc) == 2 and cc.isalpha() else '✈️'


def lib_slug(f):
    k = slugify(f.get('destino', ''))
    for p in DLIB:
        if p['s'] == k or slugify(p['n']) == k or k in (p.get('a') or []) or (f.get('destino_iata') and p['i'] == f.get('destino_iata')):
            return p['s']
    for s_, names in ALIAS.items():
        if k in names:
            return s_
    return None


REGION_OF = {'Europa': 'europa', 'Asia': 'asia', 'Oriente Medio': 'asia', 'Norteamérica': 'america', 'Centroamérica y Caribe': 'america', 'Sudamérica': 'america', 'África': 'africa', 'Oceanía': 'oceania'}
try:
    AIRPORTS = json.load(open(os.path.join('hlc', 'airports.json'), encoding='utf-8'))
except Exception:
    AIRPORTS = {}


def n_extra(slug):
    """Fotos extra de la biblioteca (<slug>-2.jpg, -3.jpg...) para que la imagen vaya cambiando."""
    n = 0
    while os.path.exists(os.path.join(LIB, f'{slug}-{n + 2}.jpg')):
        n += 1
    return n


def photos_attr(slug):
    """Atributo para que hlc.js vaya rotando las fotos del destino en la cabecera."""
    if not slug or not n_extra(slug):
        return ''
    return ' data-photos="' + '|'.join([f'/hlc/img/cities/{slug}.jpg'] + [f'/hlc/img/cities/{slug}-{i + 2}.jpg' for i in range(n_extra(slug))]) + '"'


def city_photo(dest, iata='', country=''):
    """Foto fiable de una ciudad nueva: artículo de Wikipedia cuyas coordenadas están a menos de 80 km del aeropuerto
    (evita confundir Phoenix con una marca o San Juan de Puerto Rico con otro San Juan)."""
    import math
    ap = AIRPORTS.get((iata or '').upper()) or []
    if not ap:
        return None, ''
    la0, lo0 = ap[0], ap[1]
    def dist(a, b):
        p1, p2 = math.radians(a), math.radians(la0)
        dl = math.radians(b - lo0)
        return 6371 * math.acos(min(1, math.sin(p1) * math.sin(p2) + math.cos(p1) * math.cos(p2) * math.cos(dl)))
    cands = []
    for lang, q in (('en', dest), ('en', f'{dest} {country}'.strip()), ('es', dest)):
        u = f'https://{lang}.wikipedia.org/w/api.php?' + urllib.parse.urlencode({'action': 'query', 'format': 'json', 'generator': 'search', 'gsrsearch': q, 'gsrlimit': 6,
                                                                                    'prop': 'pageimages|coordinates', 'piprop': 'original', 'colimit': 'max'})
        try:
            j = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=40))
        except Exception:
            continue
        for pg in sorted((j.get('query') or {}).get('pages', {}).values(), key=lambda p: p.get('index', 99)):
            co = (pg.get('coordinates') or [{}])[0]
            o = pg.get('original') or {}
            if not co.get('lat') or not o.get('source'):
                continue
            if dist(co['lat'], co['lon']) > 80 or re.search(r'airport|aeropuerto|aéroport|flughafen|airfield|air base|station|stadium|university|universidad|county|condado|metropolitan area|área metropolitana', pg.get('title', ''), re.I):
                continue
            src, w, h = o['source'].split('?')[0], o.get('width', 0), o.get('height', 1)
            if not (src.lower().endswith('.svg') or re.search(r'(map|mapa|flag|bandera|coat|escudo|seal|logo|locator|location|montage|collage|airport|aeropuerto)', src, re.I) or w < 1000 or w / h < 1.2):
                cands.append((src, pg.get('title', '')))
                continue
            # la imagen principal es un mosaico o un mapa: buscamos dentro del artículo una vista de la ciudad
            try:
                u2 = f'https://{lang}.wikipedia.org/w/api.php?' + urllib.parse.urlencode({'action': 'query', 'format': 'json', 'generator': 'images', 'titles': pg['title'], 'gimlimit': 50,
                                                                                            'prop': 'imageinfo', 'iiprop': 'url|size', 'iiurlwidth': 1600})
                j2 = json.load(urllib.request.urlopen(urllib.request.Request(u2, headers=UA), timeout=40))
                for ip in (j2.get('query') or {}).get('pages', {}).values():
                    t2 = ip.get('title', '')
                    ii = (ip.get('imageinfo') or [{}])[0]
                    if not re.search(r'skyline|downtown|panorama|aerial|view|beach|bay|harbou?r|old town|city|centro|vista', t2, re.I) or re.search(r'map|flag|seal|logo|svg', t2, re.I):
                        continue
                    if ii.get('width', 0) >= 1400 and 1.3 <= ii['width'] / max(ii.get('height', 1), 1) <= 2.6:
                        cands.append((ii.get('thumburl') or ii['url'], pg.get('title', '')))
            except Exception:
                pass
        if cands:
            break
    for src, t in cands:
        thumb = re.sub(r'/commons/(\w/\w\w)/', r'/commons/thumb/\1/', src) + '/1600px-' + src.rsplit('/', 1)[-1] if ('/commons/' in src and '/thumb/' not in src) else src
        im = fetch_img(thumb) or fetch_img(src)
        if im:
            return im, f'Foto: Wikipedia · Wikimedia Commons ({t})'
    return None, ''


def ensure_lib(f):
    """Ningún destino sin foto: si un chollo va a un destino que no está en la biblioteca, lo añadimos
    (foto de Wikipedia/Commons, coordenadas del aeropuerto, crédito) y queda para siempre."""
    if lib_slug(f):
        return lib_slug(f)
    dest = (f.get('destino') or '').strip()
    k = slugify(dest)
    if not k:
        return None
    im, cred = city_photo(dest, f.get('destino_iata', ''), f.get('pais', ''))
    if im is None and f.get('_image_url'):
        im, cred = fetch_img(f['_image_url']), f.get('_image_credit') or 'Foto: Wikimedia Commons'
    if im is None:
        return None
    big = cover(im, 1600, 1000) if im.width >= 1600 else cover(im, im.width, int(im.width / 1.6))
    big.save(os.path.join(LIB, k + '.jpg'), 'JPEG', quality=80, optimize=True, progressive=True)
    cover(im, 800, 500).save(os.path.join(LIB, k + '-800.jpg'), 'JPEG', quality=78, optimize=True, progressive=True)
    CR[k] = {'file': '', 'author': cred.replace('Foto: ', '').split(' · ')[0], 'license': (cred.split(' · ')[1] if cred.count(' · ') >= 2 else ''), 'page': ''}
    json.dump(CR, open(os.path.join(LIB, 'credits.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    ap = AIRPORTS.get((f.get('destino_iata') or '').upper()) or []
    DLIB.append({'s': k, 'n': dest, 'c': f.get('pais') or '', 'i': (f.get('destino_iata') or '').upper(), 'y': ap[0] if ap else None, 'x': ap[1] if ap else None,
                 'r': REGION_OF.get(f.get('continente') or '', 'mundo'), 't': 'ciudad', 'a': [], 'auto': 1})
    print('biblioteca: nuevo destino', k)
    return k


def cont_of(f):
    c = f.get('continente') or ''
    return CONT.get(c, ('', '', ''))


def ago_iso(s):
    return (s or '')[:19]


def head(**k):
    d = dict(robots='index, follow, max-image-preview:large', og_type='article', extra_head='<link rel="stylesheet" href="/hlc/home.css?v=7">', body_class='')
    d.update(k)
    d.setdefault('og_title', d['title'])
    d.setdefault('og_alt', d['title'])
    h = HEAD
    for key, v in d.items():
        h = h.replace('{' + key + '}', v)
    return h


def photo_url(x):
    f = x['facts']
    ls_ = lib_slug(f)
    if ls_:
        return f'/hlc/img/cities/{ls_}-800.jpg'
    if os.path.exists(os.path.join('chollos', x['slug'], 'foto.jpg')):
        return f"/chollos/{x['slug']}/foto.jpg"
    return x.get('image_url') or ''


def card(x):
    f = x['facts']
    cs, cn, ce = cont_of(f)
    img = photo_url(x)
    bg = f"background-image:url('{img}'),linear-gradient(135deg,#FF5A36,#2E6BF0)" if img else 'background:linear-gradient(135deg,#FF5A36,#2E6BF0)'
    oc = slugify(f.get('origen_pais') or '')
    return (f'<a class="dc" href="/chollos/{e(x["slug"])}/" data-slug="{e(x["slug"])}" data-oc="{e(oc)}" data-occ="{e(f.get("origen_cc", ""))}" data-orig="{e(f.get("origen", ""))}" data-cont="{e(cs)}" '
            f'data-price="{e(x.get("price"))}" data-ida="{e(f.get("ida", ""))}" data-dir="{1 if f.get("escalas") == 0 else 0}" data-tipo="{"rt" if f.get("vuelta") else "ow"}" data-ts="{e(ago_iso(x.get("approved_at")))}" data-q="{e(slugify((f.get("origen", "") + " " + f.get("destino", "") + " " + (f.get("pais") or "") + " " + (f.get("origen_pais") or ""))))}">'
            f'<div class="dc-img" style="{bg}">{f"<span class=dc-save>−{f.get(chr(97)+chr(104)+chr(111)+chr(114)+chr(114)+chr(111)+chr(95)+chr(112)+chr(99)+chr(116))} %</span>" if f.get("ahorro_pct") else ""}<span class="dc-ok">✓ Verificado</span><span class="dc-fav" role="button" tabindex="0" aria-label="Guardar en favoritos" data-fav="{e(x["slug"])}">♡</span>'
            f'<span class="dc-city">{e(f.get("destino"))}</span></div>'
            f'<div class="dc-b"><div><div class="dc-r"><span class="dc-flag" title="{e(f.get("origen_pais") or "")}">{flag(f.get("origen_cc"))}</span> {e(f.get("origen"))} → {e(f.get("destino"))}</div>'
            f'<div class="dc-m">{e(f.get("tipo", ""))}{" · directo" if f.get("escalas") == 0 else ""} · {e(fecha(f.get("ida", "")))}</div></div><div class="dc-p">{f'<s>{e(f.get("precio_normal"))} €</s>' if f.get('precio_normal') else ''}{e(x.get("price"))} €</div></div></a>')


def crumbs(items):
    """items: [(name, url)] último sin url"""
    html_ = '<nav class="crumbs" aria-label="Migas de pan">' + ' <span>›</span> '.join(
        (f'<a href="{u}">{e(n)}</a>' if u else f'<span aria-current="page">{e(n)}</span>') for n, u in items) + '</nav>'
    ld = {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, **({"item": SITE + u} if u else {})} for i, (n, u) in enumerate(items)]}
    return html_, ld


def ld_script(graph):
    return '<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False) + '</script>'


EMPTY = '<div class="dc-empty"><b>Ahora mismo no hay chollos aquí.</b><span>Los chollos vuelan: crea una alerta gratis y te avisamos en cuanto cacemos uno.</span><a class="hlc-btn" href="/alertas/">Crear alerta gratis</a></div>'


def filters_html(deals):
    occ = {}
    for x in deals:
        f = x['facts']
        k = slugify(f.get('origen_pais') or '')
        if k:
            occ.setdefault(k, [f.get('origen_pais'), f.get('origen_cc'), 0])[2] += 1
    opts = ''.join(f'<option value="{k}">{flag(v[1])} {e(v[0])} ({v[2]})</option>' for k, v in sorted(occ.items(), key=lambda kv: -kv[1][2]))
    conts = {}
    for x in deals:
        cs, cn, ce = cont_of(x['facts'])
        if cs:
            conts.setdefault(cs, [cn, ce, 0])[2] += 1
    cchips = ''.join(f'<button type="button" class="chip" data-cont="{k}" aria-pressed="false">{v[1]} {e(v[0].replace("el Caribe y Centroamérica", "Caribe"))} <small>{v[2]}</small></button>' for k, v in sorted(conts.items(), key=lambda kv: -kv[1][2]))
    months = sorted({(x['facts'].get('ida') or '')[:7] for x in deals if x['facts'].get('ida')})
    MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    mopts = ''.join(f'<option value="{m}">{MES[int(m[5:7]) - 1]} {m[:4]}</option>' for m in months)
    return f'''<div class="xf" data-explorer-filters>
<div class="xf-row">
<label class="xf-search"><span aria-hidden="true">🔎</span><input type="search" data-x="q" placeholder="Busca un destino, ciudad o país" aria-label="Buscar chollos"></label>
<label class="xf-sel"><span>Salida desde</span><select data-x="desde" aria-label="País de salida"><option value="">Todos los países</option>{opts}</select></label>
<label class="xf-sel"><span>Mes</span><select data-x="mes" aria-label="Mes de salida"><option value="">Cualquier fecha</option>{mopts}</select></label>
<label class="xf-sel"><span>Ordenar</span><select data-x="orden" aria-label="Ordenar"><option value="nuevo">Más recientes</option><option value="precio">Más baratos</option><option value="fecha">Salida más próxima</option></select></label>
</div>
<div class="xf-row chips" role="group" aria-label="Continente de destino"><button type="button" class="chip" data-cont="" aria-pressed="true">🌐 Todo el mundo</button>{cchips}</div>
<div class="xf-row xf-more">
<label class="xf-range"><span>Precio máx.: <b data-x-out="max">sin límite</b></span><input type="range" min="20" max="1500" step="10" value="1500" data-x="max" aria-label="Precio máximo"></label>
<label class="xf-tg"><input type="checkbox" data-x="dir"> Solo directos</label>
<label class="xf-tg"><input type="checkbox" data-x="rt"> Solo ida y vuelta</label>
<label class="xf-tg"><input type="checkbox" data-x="fav"> ♥ Mis favoritos</label>
<button type="button" class="hlc-btn o xf-clear" data-x-clear>Limpiar filtros</button>
</div>
<div class="xf-count" aria-live="polite"><b data-x-count>{len(deals)}</b> chollos <button type="button" class="xf-tog" data-x-toggle aria-expanded="false">⚙️ Más filtros</button></div>
</div>'''


def list_page(path, title, h1, kicker, intro, deals, canonical, crumb_items, extra_links='', explorer=False, noindex=False, seo_html=''):
    ch, cld = crumbs(crumb_items)
    items = [{"@type": "ListItem", "position": i + 1, "url": f"{SITE}/chollos/{x['slug']}/", "name": x.get('title') or ''} for i, x in enumerate(deals[:50])]
    graph = [cld, {"@type": "CollectionPage", "name": h1, "url": canonical, "inLanguage": "es-ES", "description": intro, "mainEntity": {"@type": "ItemList", "numberOfItems": len(deals), "itemListElement": items}}]
    desc = intro[:155]
    page = head(title=e(title), desc=e(desc), canonical=canonical, og_type='website', og_image=f'{SITE}/hlc/brand/og-default.jpg', robots='noindex, follow' if noindex else 'index, follow, max-image-preview:large',
                extra_head='<link rel="stylesheet" href="/hlc/home.css?v=7"><link rel="alternate" type="application/rss+xml" title="Chollos Happy Low Cost" href="/chollos/feed.xml">' + ('<link rel="alternate" hreflang="es" href="' + canonical + '"><link rel="alternate" hreflang="en" href="' + f'{SITE}/en/deals/' + '"><link rel="alternate" hreflang="x-default" href="' + canonical + '">' if path == 'chollos' else '') + ld_script(graph), body_class='chollos')
    cards = ''.join(card(x) for x in deals) or EMPTY
    page += f'''<main class="sec" style="padding-top:26px"><div class="wrap">
{ch}
<div class="sec-h"><div><div class="kicker">{kicker}</div><h1 class="x-h1">{e(h1)}</h1><p>{e(intro)}</p></div><a class="hlc-btn s" href="/alertas/">🔔 Crear alerta</a></div>
{filters_html(deals) if explorer else ''}
<div class="dc-grid" data-explorer-grid>{cards}</div>
<div class="dc-empty" data-x-empty hidden><b>Ningún chollo con esos filtros.</b><span>Prueba a quitar algún filtro o crea una alerta y te avisamos.</span><a class="hlc-btn" href="/alertas/">Crear alerta gratis</a></div>
{extra_links}
{seo_html}
</div></main>{'<script src="/hlc/explorer.js?v=1" defer></script>' if explorer else ''}</body></html>'''
    os.makedirs(path, exist_ok=True)
    open(os.path.join(path, 'index.html'), 'w', encoding='utf-8').write(page)


def hub_links(origins, conts, dests_with_deals):
    o = ''.join(f'<a class="hub-l" href="/chollos/desde/{k}/">{flag(v[1])} {e(v[0])} <small>{v[2]}</small></a>' for k, v in sorted(origins.items(), key=lambda kv: -kv[1][2]))
    c = ''.join(f'<a class="hub-l" href="/chollos/a/{k}/">{CONT_BY_SLUG[k][2]} {e(CONT_BY_SLUG[k][1])} <small>{v}</small></a>' for k, v in sorted(conts.items(), key=lambda kv: -kv[1]))
    dd = ''.join(f'<a class="hub-l" href="/destinos/{s_}/">{e(n)}</a>' for s_, n in dests_with_deals[:24])
    return f'''<section class="hub"><h2>Chollos por país de salida</h2><div class="hub-g">{o}</div>
<h2>Chollos por continente de destino</h2><div class="hub-g">{c}</div>
{f'<h2>Guías de los destinos con chollo</h2><div class="hub-g">{dd}</div>' if dd else ''}</section>'''


def related(x, deals, n=4):
    f = x['facts']
    cs = cont_of(f)[0]
    same = [y for y in deals if y is not x and cont_of(y['facts'])[0] == cs]
    org = [y for y in deals if y is not x and y not in same and y['facts'].get('origen_cc') == f.get('origen_cc')]
    rest = [y for y in deals if y is not x and y not in same and y not in org]
    return (same + org + rest)[:n]


def main():
    raw = urllib.request.urlopen(urllib.request.Request(API, headers=UA), timeout=60).read()
    deals = json.loads(urllib.request.urlopen(urllib.request.Request(API + '&full=1', headers=UA), timeout=90).read())
    try:
        raw_d = urllib.request.urlopen(urllib.request.Request(API.replace('action=feed', 'action=dests'), headers=UA), timeout=90).read()
        dests = json.loads(raw_d)
    except Exception:
        raw_d, dests = b'', []
    os.makedirs('chollos', exist_ok=True)
    import hashlib
    open(os.path.join('chollos', 'feed.sha'), 'w').write(hashlib.sha256(raw).hexdigest() + hashlib.sha256(raw_d).hexdigest()[:16] + '\n')
    today = datetime.date.today().isoformat()
    deals = [x for x in deals if x.get('slug') and x.get('price') and x.get('facts') and (x['facts'].get('ida') or '9999') >= today]
    deals.sort(key=lambda x: x.get('approved_at') or '', reverse=True)
    dmap = {g['slug']: g for g in dests if g.get('guide_html')}

    # ningún destino sin foto: los nuevos entran en la biblioteca
    for x in deals:
        try:
            had = lib_slug(x['facts'])
            x['facts']['_image_url'], x['facts']['_image_credit'] = x.get('image_url'), x.get('image_credit')
            if ensure_lib(x['facts']) and not had:
                for fn in ('og.jpg', 'foto.jpg'):  # se rehacen con la foto nueva de la biblioteca
                    fp = os.path.join('chollos', x['slug'], fn)
                    if os.path.exists(fp):
                        os.remove(fp)
        except Exception as ex:
            print('ensure_lib', ex)
    # regla: nunca enseñamos un chollo sin foto del destino
    sin_foto = [x['slug'] for x in deals if not photo_url(x)]
    if sin_foto:
        print('sin foto, no se publican:', sin_foto)
    deals = [x for x in deals if photo_url(x)]
    # marca en destinos.json qué destinos tienen guía (lo usa el mapa) y cuántas fotos extra hay
    for p in DLIB:
        p['g'] = 1 if p['s'] in dmap else 0
        p['k'] = n_extra(p['s'])
    json.dump(DLIB, open(os.path.join('hlc', 'destinos.json'), 'w'), ensure_ascii=False, separators=(',', ':'))

    origins, conts = {}, {}
    for x in deals:
        f = x['facts']
        k = slugify(f.get('origen_pais') or '')
        if k:
            origins.setdefault(k, [f.get('origen_pais'), f.get('origen_cc'), 0])[2] += 1
        cs = cont_of(f)[0]
        if cs:
            conts[cs] = conts.get(cs, 0) + 1
    dests_with_deals = []
    for x in deals:
        ls_ = lib_slug(x['facts'])
        if ls_ and ls_ in dmap and ls_ not in [d_[0] for d_ in dests_with_deals]:
            dests_with_deals.append((ls_, dmap[ls_]['name']))

    # ---------- páginas de chollo ----------
    for x in deals:
        f, slug = x['facts'], x['slug']
        out = os.path.join('chollos', slug)
        os.makedirs(out, exist_ok=True)
        lp, lc = lib_photo(f.get('destino', ''))
        photo, cred = None, ''
        if lp:
            photo = Image.open(lp).convert('RGB')
            cred = f"Foto: {lc.get('author') or 'Wikimedia Commons'} · {lc.get('license', '')} · Wikimedia Commons" if lc else ''
        elif not os.path.exists(os.path.join(out, 'foto.jpg')):
            photo, cred = commons_photo(f.get('destino', ''), f.get('pais', ''))
            if cred:
                open(os.path.join(out, 'credito.txt'), 'w', encoding='utf-8').write(cred)
        elif os.path.exists(os.path.join(out, 'credito.txt')):
            cred = open(os.path.join(out, 'credito.txt'), encoding='utf-8').read().strip()
        if not os.path.exists(os.path.join(out, 'og.jpg')) or (photo is not None and not lp and not os.path.exists(os.path.join(out, 'foto.jpg'))):
            if photo is not None and not lp:
                p = photo.copy()
                if p.width > 1600:
                    p = p.resize((1600, int(p.height * 1600 / p.width)), Image.LANCZOS)
                p.save(os.path.join(out, 'foto.jpg'), 'JPEG', quality=80, optimize=True, progressive=True)
            og_image(photo, f, os.path.join(out, 'og.jpg'))
        if lp and os.path.exists(os.path.join(out, 'foto.jpg')):
            os.remove(os.path.join(out, 'foto.jpg'))  # la foto sale de la biblioteca: un fichero menos
        hero = (f"/hlc/img/cities/{lib_slug(f)}.jpg" if lp else (f"/chollos/{slug}/foto.jpg" if os.path.exists(os.path.join(out, 'foto.jpg')) else (x.get('image_url') or '')))
        url = f'{SITE}/chollos/{slug}/'
        title = x.get('title') or f"{f.get('origen')} → {f.get('destino')} desde {f.get('precio')} €"
        seo_t = f"Vuelos {f.get('origen')} → {f.get('destino')} por {x.get('price')} € ({f.get('tipo', '')}) · Chollo verificado"
        excerpt = x.get('excerpt') or f"Chollo de vuelo {f.get('origen')} - {f.get('destino')} por {x.get('price')} € {f.get('tipo', '')}, comprobado hoy."
        share_txt = quote(f"{title} {url}")
        verified = x.get('approved_at', '')[:16].replace('T', ' ')
        cs, cn, ce = cont_of(f)
        oc = slugify(f.get('origen_pais') or '')
        dls = lib_slug(f)
        items = [('Inicio', '/'), ('Chollos', '/chollos/')]
        if oc:
            items.append((f"Desde {f.get('origen_pais')}", f'/chollos/desde/{oc}/'))
        items.append((f"{f.get('origen')} → {f.get('destino')}", None))
        ch, cld = crumbs(items)
        offer = {"@type": "Offer", "name": title, "url": url, "price": x.get('price'), "priceCurrency": "EUR", "availability": "https://schema.org/InStock",
                 "validThrough": f.get('ida'), "category": "Vuelo", "itemOffered": {"@type": "Flight", "name": f"{f.get('origen')} → {f.get('destino')}",
                 "departureAirport": {"@type": "Airport", "iataCode": f.get('origen_iata'), "name": f.get('origen')},
                 "arrivalAirport": {"@type": "Airport", "iataCode": f.get('destino_iata'), "name": f.get('destino')}, "departureTime": f.get('ida')}}
        art = {"@type": "Article", "headline": title[:110], "description": excerpt, "image": f"{url}og.jpg", "datePublished": x.get('approved_at'), "dateModified": x.get('approved_at'), "inLanguage": "es-ES",
               "author": {"@type": "Organization", "name": "Happy Low Cost", "url": SITE + '/'}, "publisher": {"@type": "Organization", "name": "Happy Low Cost", "logo": {"@type": "ImageObject", "url": f"{SITE}/hlc/brand/icon-512.png"}}, "mainEntityOfPage": url}
        rel = related(x, deals)
        rel_html = ''.join(card(y) for y in rel)
        guide_link = f'<a class="hlc-btn o" href="/destinos/{dls}/">📖 Guía completa de {e(dmap[dls]["name"])}</a>' if dls and dls in dmap else ''
        page = head(title=e(seo_t), desc=e(excerpt), canonical=url, og_image=url + 'og.jpg', og_title=e(title),
                    extra_head='<link rel="stylesheet" href="/hlc/home.css?v=7">' + ('<link rel="alternate" hreflang="es" href="' + url + '"><link rel="alternate" hreflang="en" href="' + f'{SITE}/en/deals/{slug}/' + '"><link rel="alternate" hreflang="x-default" href="' + url + '">' if x.get('en') else '') + ld_script([art, cld, offer]), body_class='deal')
        page += f'''<main data-deal-slug="{e(slug)}" data-deal-ida="{e(f.get('ida', ''))}">
<section class="deal-hero" style="{f'background-image:url({hero})' if hero else ''}"{photos_attr(lib_slug(f)) if lp else ''}><div class="wrap">
{ch.replace('class="crumbs"', 'class="crumbs crumbs-l"')}
<div class="kicker" style="color:#FFC531">✓ Chollo verificado el {e(fecha(verified))} a las {e(verified[11:16])} (UTC){f" · {ce} {e(cn)}" if cs else ""}</div>
<h1>{e(title)}</h1>
<div class="deal-cta"><span class="price-tag">{e(f.get('precio'))} € <small>{e(f.get('tipo', ''))}</small></span>{f'<span class="price-was">Precio habitual <s>{e(f.get("precio_normal"))} €</s> · ahorras un {e(f.get("ahorro_pct"))} %</span>' if f.get('precio_normal') else ''}<a class="hlc-btn" href="{e(x.get('cta_flight', '#'))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="deal_vuelo" style="min-height:56px;font-size:17px">Ver vuelo y fechas ✈️</a><span class="dc-fav big" role="button" tabindex="0" aria-label="Guardar en favoritos" data-fav="{e(slug)}">♡</span></div>
<div class="deal-days" data-days></div>
</div></section>
<div class="wrap"><div class="deal-body">
<article class="txt">{x.get('body_html') or ''}
{guide_block(x)}
{f'<p>{guide_link}</p>' if guide_link else ''}
<p class="credit">{e(cred)}</p></article>
<aside class="deal-card">
<div class="facts">
<div><small>Desde</small><b>{flag(f.get('origen_cc'))} {e(f.get('origen'))}</b></div><div><small>Hasta</small><b>{flag(f.get('destino_cc'))} {e(f.get('destino'))}</b></div>
<div><small>Ida</small><b>{e(fecha(f.get('ida', '')))}</b></div><div><small>Vuelta</small><b>{e(fecha(f.get('vuelta') or '') or '—')}</b></div>
<div><small>Aerolínea</small><b>{e(f.get('aerolinea') or 'Varias')}</b></div><div><small>Escalas</small><b>{'Directo' if f.get('escalas') == 0 else e(f.get('escalas'))}</b></div>
</div>
<a class="hlc-btn" href="{e(x.get('cta_flight', '#'))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="deal_vuelo" style="min-height:56px;font-size:17px">Ver vuelo desde {e(f.get('precio'))} €</a>
<a class="hlc-btn t" href="{e(x.get('cta_hotel', '#'))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="deal_hotel">🏨 Hoteles en {e(f.get('destino'))}</a>
{guide_link}
<div style="font:13px/1.5 Inter,sans-serif;color:#4A5468">Precio comprobado al publicar. Los vuelos baratos vuelan: si cambia, prueba fechas cercanas.</div>
<div class="share"><button class="hlc-btn o" type="button" data-share data-title="{e(title)}" data-url="{url}">📤 Compartir</button><a class="hlc-btn o" href="https://wa.me/?text={share_txt}" target="_blank" rel="noopener">WhatsApp</a><a class="hlc-btn o" href="https://www.facebook.com/sharer/sharer.php?u={quote(url)}" target="_blank" rel="noopener">Facebook</a><button class="hlc-btn o" type="button" data-copy="{url}">Copiar enlace</button></div>
<a class="hlc-btn s" href="/alertas/?d={quote(f.get('destino', ''))}">🔔 Avísame de chollos a {e(f.get('destino'))}</a>
</aside>
</div>
<section class="sec" style="padding-top:10px"><div class="sec-h"><div><div class="kicker">También te puede interesar</div><h2>Chollos parecidos</h2></div><a class="hlc-btn o" href="/chollos/">Ver todos</a></div><div class="dc-grid">{rel_html}</div></section>
</div></main></body></html>'''
        open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(page)

    hub = hub_links(origins, conts, dests_with_deals)
    nconts = len(conts)
    # ---------- explorador /chollos/ ----------
    intro = (f"{len(deals)} chollos de vuelos activos ahora mismo, con salida desde {len(origins)} países y destinos en {nconts} continentes. "
             f"Cada precio se comprueba antes de publicarlo; si mañana ya no está, lo retiramos.")
    list_page('chollos', 'Chollos de vuelos de hoy en todo el mundo, verificados · Happy Low Cost', 'Chollos de vuelos de hoy', 'Recién cazados · verificados', intro, deals,
              f'{SITE}/chollos/', [('Inicio', '/'), ('Chollos', None)], extra_links=hub, explorer=True)

    # ---------- landings por país de salida ----------
    known = set(json.load(open('chollos/landings.json'))) if os.path.exists('chollos/landings.json') else set()
    gen = set()
    allo = dict(origins)
    for k in [k_ for k_ in known if k_.startswith('desde/')]:
        allo.setdefault(k[6:], [k[6:].replace('-', ' ').title(), '', 0])
    allo.setdefault('espana', ['España', 'ES', 0])
    for k, (pais, cc, n) in allo.items():
        sub = [x for x in deals if slugify(x['facts'].get('origen_pais') or '') == k]
        cheapest = min((x['price'] for x in sub), default=None)
        tops = ', '.join(dict.fromkeys(x['facts'].get('destino') for x in sub))
        intro = (f"{len(sub)} chollos de vuelos desde {pais} verificados hoy" + (f", desde {cheapest} €" if cheapest else "") + (f": {tops[:160]}." if tops else ".") +
                 " Comprobamos cada precio antes de publicarlo y retiramos los que caducan.") if sub else f"Ahora mismo no hay chollos con salida desde {pais}. Vuelve pronto o crea una alerta gratis y te avisamos."
        list_page(f'chollos/desde/{k}', f'Chollos de vuelos desde {pais} hoy · Happy Low Cost', f'Chollos de vuelos desde {pais}', f'{flag(cc)} Salidas desde {pais}', intro, sub,
                  f'{SITE}/chollos/desde/{k}/', [('Inicio', '/'), ('Chollos', '/chollos/'), (f'Desde {pais}', None)], extra_links=hub, noindex=not sub)
        gen.add('desde/' + k)
    # ---------- landings por continente ----------
    for cs, (cname_k, cname, cemoji) in CONT_BY_SLUG.items():
        sub = [x for x in deals if cont_of(x['facts'])[0] == cs]
        if not sub and ('a/' + cs) not in known:
            continue
        cheapest = min((x['price'] for x in sub), default=None)
        tops = ', '.join(dict.fromkeys(x['facts'].get('destino') for x in sub))
        intro = (f"{len(sub)} chollos de vuelos a {cname} comprobados hoy" + (f", desde {cheapest} €" if cheapest else "") + (f": {tops[:160]}." if tops else ".") +
                 " Precios verificados antes de publicar, con salidas desde España y desde todo el mundo.") if sub else f"Ahora mismo no hay chollos a {cname}. Crea una alerta gratis y te avisamos en cuanto cacemos uno."
        list_page(f'chollos/a/{cs}', f'Chollos de vuelos a {cname} · Happy Low Cost', f'Chollos de vuelos a {cname}', f'{cemoji} Destinos en {cname}', intro, sub,
                  f'{SITE}/chollos/a/{cs}/', [('Inicio', '/'), ('Chollos', '/chollos/'), (f'A {cname}', None)], extra_links=hub, noindex=not sub)
        gen.add('a/' + cs)
    json.dump(sorted(gen | known), open('chollos/landings.json', 'w'))

    # ---------- guías de destino /destinos/<slug>/ ----------
    dlinks = []
    for p in DLIB:
        g = dmap.get(p['s'])
        if not g:
            continue
        sub = [x for x in deals if lib_slug(x['facts']) == p['s']]
        url = f"{SITE}/destinos/{p['s']}/"
        gh = re.sub(r'<(?!/?(h2|h3|p|ul|li|strong)\b)[^>]*>', '', g['guide_html'])
        gh = re.sub(r'<(h2|h3|p|ul|li|strong)\b[^>]*>', r'<\1>', gh)
        words = len(re.sub('<[^>]+>', ' ', gh).split())
        ch, cld = crumbs([('Inicio', '/'), ('Destinos', '/destinos/'), (p['n'], None)])
        cr = CR.get(p['s']) or {}
        dest_ld = {"@type": "TouristDestination", "name": p['n'], "url": url, "image": f"{SITE}/hlc/img/cities/{p['s']}.jpg", "geo": {"@type": "GeoCoordinates", "latitude": p['y'], "longitude": p['x']},
                   "containedInPlace": {"@type": "Country", "name": p['c']}}
        art = {"@type": "Article", "headline": (g.get('seo_title') or f"Qué ver en {p['n']}")[:110], "description": g.get('meta_description') or '', "image": f"{SITE}/hlc/img/cities/{p['s']}.jpg",
               "dateModified": g.get('updated_at'), "datePublished": g.get('updated_at'), "wordCount": words, "inLanguage": "es-ES", "about": {"@id": url + '#destino'},
               "author": {"@type": "Organization", "name": "Happy Low Cost"}, "publisher": {"@type": "Organization", "name": "Happy Low Cost", "logo": {"@type": "ImageObject", "url": f"{SITE}/hlc/brand/icon-512.png"}}, "mainEntityOfPage": url}
        dest_ld["@id"] = url + '#destino'
        side = ''.join(card(x) for x in sub[:3])
        page = head(title=e((g.get('seo_title') or f"Qué ver en {p['n']}") + ' · Happy Low Cost'), desc=e(g.get('meta_description') or f"Guía de {p['n']}: qué ver, dónde dormir, qué comer y chollos de vuelos."),
                    canonical=url, og_image=f"{SITE}/hlc/img/cities/{p['s']}.jpg", og_title=e(g.get('seo_title') or p['n']),
                    extra_head='<link rel="stylesheet" href="/hlc/home.css?v=7">' + ('<link rel="alternate" hreflang="es" href="' + url + '"><link rel="alternate" hreflang="en" href="' + f"{SITE}/en/destinations/{p['s']}/" + '"><link rel="alternate" hreflang="x-default" href="' + url + '">' if g.get('guide_html_en') else '') + ld_script([dest_ld, art, cld]), body_class='destino')
        page += f'''<main>
<section class="deal-hero" style="background-image:url(/hlc/img/cities/{p['s']}.jpg)"{photos_attr(p['s'])}><div class="wrap">
{ch.replace('class="crumbs"', 'class="crumbs crumbs-l"')}
<div class="kicker" style="color:#FFC531">Guía de viaje · {e(p['c'])}</div>
<h1>{e(g.get('seo_title') or 'Qué ver en ' + p['n'])}</h1>
<div class="deal-cta">{f'<a class="hlc-btn" href="#chollos">🔥 {len(sub)} chollo{"s" if len(sub) != 1 else ""} a {e(p["n"])}</a>' if sub else ''}<a class="hlc-btn t" href="{CJ_H(p['n'])}" target="_blank" rel="sponsored nofollow noopener">🏨 Hoteles en {e(p['n'])}</a><a class="hlc-btn o" href="/destinos/#destinos" style="background:#fff">🗺️ Ver en el mapa</a></div>
</div></section>
<div class="wrap"><div class="deal-body">
<article class="txt guide">{gh}
<p class="credit">Foto: {e(cr.get('author') or 'Wikimedia Commons')} · {e(cr.get('license', ''))} · Wikimedia Commons · Guía actualizada el {e(fecha(g.get('updated_at') or ''))}</p></article>
<aside class="deal-card" id="chollos">
<div class="kicker">Chollos a {e(p['n'])}</div>
{side or f'<p style="margin:0;color:#4A5468">Hoy no hay chollo a {e(p["n"])}. Te avisamos gratis cuando salga uno.</p>'}
<a class="hlc-btn s" href="/alertas/?d={quote(p['n'])}">🔔 Alerta de chollos a {e(p['n'])}</a>
<a class="hlc-btn t" href="{CJ_H(p['n'])}" target="_blank" rel="sponsored nofollow noopener">🏨 Hoteles en {e(p['n'])}</a>
<a class="hlc-btn o" href="/chollos/">Ver todos los chollos</a>
</aside></div>
<section class="sec" style="padding-top:10px"><div class="sec-h"><div><div class="kicker">Más inspiración</div><h2>Otros destinos</h2></div></div><div class="hub-g">{''.join(f'<a class="hub-l" href="/destinos/{q["s"]}/">{e(q["n"])}</a>' for q in DLIB if q['s'] in dmap and q['s'] != p['s'] and q['r'] == p['r'])}</div></section>
</div></main></body></html>'''
        os.makedirs(os.path.join('destinos', p['s']), exist_ok=True)
        open(os.path.join('destinos', p['s'], 'index.html'), 'w', encoding='utf-8').write(page)
        dlinks.append((p, g))
    # índice de guías dentro de /destinos/
    if os.path.exists('destinos/index.html'):
        di = open('destinos/index.html', encoding='utf-8').read()
        block = '<!--guias--><section class="hub"><h2>Guías de viaje por destino</h2><div class="hub-g">' + ''.join(f'<a class="hub-l" href="/destinos/{p["s"]}/">{e(p["n"])} <small>{e(p["c"])}</small></a>' for p, g in dlinks) + '</div></section><!--/guias-->'
        di = re.sub(r'<!--guias-->.*?<!--/guias-->', block, di, flags=re.S) if '<!--guias-->' in di else di.replace('</main>', block + '</main>', 1)
        open('destinos/index.html', 'w', encoding='utf-8').write(di)

    # ---------- RSS ----------
    def rfc(s):
        try:
            return datetime.datetime.fromisoformat((s or '').replace('Z', '+00:00')).strftime('%a, %d %b %Y %H:%M:%S +0000')
        except Exception:
            return ''
    rss = ('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Happy Low Cost · Chollos de vuelos</title><link>' + SITE + '/chollos/</link>'
           '<atom:link href="' + SITE + '/chollos/feed.xml" rel="self" type="application/rss+xml"/><description>Chollos de vuelos verificados de todo el mundo</description><language>es-es</language>' +
           ''.join(f'<item><title>{e(x.get("title"))}</title><link>{SITE}/chollos/{x["slug"]}/</link><guid>{SITE}/chollos/{x["slug"]}/</guid><pubDate>{rfc(x.get("approved_at"))}</pubDate><description>{e(x.get("excerpt") or "")}</description></item>' for x in deals[:50]) +
           '</channel></rss>\n')
    open('chollos/feed.xml', 'w', encoding='utf-8').write(rss)

    # ---------- sitemaps ----------
    def u(loc, lm=None):
        return f'<url><loc>{loc}</loc>' + (f'<lastmod>{lm[:10]}</lastmod>' if lm else '') + '</url>'
    lm0 = deals[0]['approved_at'] if deals else today
    urls = [u(f'{SITE}/chollos/', lm0)] + [u(f"{SITE}/chollos/{x['slug']}/", x.get('approved_at')) for x in deals]
    urls += [u(f'{SITE}/chollos/{k}/', lm0) for k in sorted(gen) if (k.startswith('desde/') and k[6:] in origins) or (k.startswith('a/') and k[2:] in conts)]
    open('chollos-sitemap.xml', 'w', encoding='utf-8').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join(urls) + '</urlset>\n')
    durls = [u(f'{SITE}/destinos/')] + [u(f"{SITE}/destinos/{p['s']}/", g.get('updated_at')) for p, g in dlinks]
    open('destinos-sitemap.xml', 'w', encoding='utf-8').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join(durls) + '</urlset>\n')
    si = open('sitemap_index.xml', encoding='utf-8').read()
    for sm in ('chollos-sitemap.xml', 'destinos-sitemap.xml'):
        if sm not in si:
            si = si.replace('</sitemapindex>', f'\t<sitemap>\n\t\t<loc>{SITE}/{sm}</loc>\n\t</sitemap>\n</sitemapindex>')
    open('sitemap_index.xml', 'w', encoding='utf-8').write(si)
    json.dump(sorted(d_ for d_ in os.listdir('chollos') if os.path.isfile(os.path.join('chollos', d_, 'index.html')) and d_ not in ('ver', 'desde', 'a')), open(os.path.join('chollos', 'hechos.json'), 'w'))
    print('deals', len(deals), 'origins', len(origins), 'conts', len(conts), 'guides', len(dlinks))


def CJ_H(city):
    return f"https://www.kqzyfj.com/click-101900924-17288959?sid=happylowcost&url={quote('https://www.booking.com/searchresults.es.html?ss=' + city, safe='')}"


if __name__ == '__main__':
    main()
