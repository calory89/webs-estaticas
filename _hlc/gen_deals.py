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
         'belgrado': ['belgrade'], 'cerdena': ['cagliari', 'olbia', 'alghero', 'sardinia'], 'creta': ['heraklion', 'chania', 'crete'], 'palermo': ['sicilia', 'catania'], 'bogota': ['bogota']}


def slugify(s):
    s = unicodedata.normalize('NFD', s or '').encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


def e(s):
    return html.escape(str(s if s is not None else ''), quote=True)


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


def commons_photo(dest, country=''):
    """Foto destacada o de calidad de Wikimedia Commons (horizontal, grande) para destinos fuera de la biblioteca."""
    for q in (f'{dest} {country}'.strip(), dest):
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


def head(**k):
    d = dict(robots='index, follow, max-image-preview:large', og_type='article', extra_head='<link rel="stylesheet" href="/hlc/home.css?v=5">', body_class='')
    d.update(k)
    d.setdefault('og_title', d['title'])
    d.setdefault('og_alt', d['title'])
    h = HEAD
    for key, v in d.items():
        h = h.replace('{' + key + '}', v)
    return h


def main():
    raw = urllib.request.urlopen(urllib.request.Request(API, headers=UA), timeout=60).read()
    deals = json.loads(raw)
    os.makedirs('chollos', exist_ok=True)
    import hashlib
    open(os.path.join('chollos', 'feed.sha'), 'w').write(hashlib.sha256(raw).hexdigest() + '\n')
    deals = [x for x in deals if x.get('slug') and x.get('price') and x.get('facts')]
    os.makedirs('chollos', exist_ok=True)
    cards = []
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
            if not photo and x.get('image_url'):
                photo, cred = fetch_img(x['image_url']), x.get('image_credit') or ''
            if cred:
                open(os.path.join(out, 'credito.txt'), 'w', encoding='utf-8').write(cred)
        elif os.path.exists(os.path.join(out, 'credito.txt')):
            cred = open(os.path.join(out, 'credito.txt'), encoding='utf-8').read().strip()
        if not os.path.exists(os.path.join(out, 'foto.jpg')) or not os.path.exists(os.path.join(out, 'og.jpg')):
            if photo:
                p = photo.copy()
                if p.width > 1600:
                    p = p.resize((1600, int(p.height * 1600 / p.width)), Image.LANCZOS)
                p.save(os.path.join(out, 'foto.jpg'), 'JPEG', quality=80, optimize=True, progressive=True)
            og_image(photo, f, os.path.join(out, 'og.jpg'))
        has_photo = os.path.exists(os.path.join(out, 'foto.jpg'))
        url = f'{SITE}/chollos/{slug}/'
        title = x.get('title') or f"{f.get('origen')} → {f.get('destino')} desde {f.get('precio')} €"
        excerpt = x.get('excerpt') or ''
        share_txt = quote(f"{title} {url}")
        verified = x.get('approved_at', '')[:16].replace('T', ' ')
        bg = f"background-image:url(/chollos/{slug}/foto.jpg)" if has_photo else ''
        ld = {"@context": "https://schema.org", "@type": "Article", "headline": title, "description": excerpt, "image": f"{url}og.jpg", "datePublished": x.get('approved_at'), "inLanguage": "es-ES",
              "publisher": {"@type": "Organization", "name": "Happy Low Cost", "logo": {"@type": "ImageObject", "url": f"{SITE}/hlc/brand/icon-512.png"}}, "mainEntityOfPage": url}
        page = head(title=e(title) + ' · Happy Low Cost', desc=e(excerpt), canonical=url, og_image=url + 'og.jpg', og_title=e(title),
                    extra_head='<link rel="stylesheet" href="/hlc/home.css?v=5"><script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + '</script>', body_class='deal')
        page += f'''<main>
<section class="deal-hero" style="{bg}"><div class="wrap">
<div class="kicker" style="color:#FFC531">✓ Chollo verificado el {e(fecha(verified))} a las {e(verified[11:16])} (hora UTC)</div>
<h1>{e(title)}</h1>
<div style="margin-top:18px;display:flex;gap:12px;flex-wrap:wrap;align-items:center"><span class="price-tag">{e(f.get('precio'))} € <small>{e(f.get('tipo', ''))}</small></span><a class="hlc-btn" href="{e(x.get('cta_flight', '#'))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="deal_vuelo" style="min-height:56px;font-size:17px">Ver vuelo y fechas ✈️</a></div>
</div></section>
<div class="wrap"><div class="deal-body">
<article class="txt">{x.get('body_html') or ''}
<p class="credit">{e(cred)}</p></article>
<aside class="deal-card">
<div class="facts">
<div><small>Desde</small><b>{e(f.get('origen'))}</b></div><div><small>Hasta</small><b>{e(f.get('destino'))}</b></div>
<div><small>Ida</small><b>{e(fecha(f.get('ida', '')))}</b></div><div><small>Vuelta</small><b>{e(fecha(f.get('vuelta') or '') or '—')}</b></div>
<div><small>Aerolínea</small><b>{e(f.get('aerolinea') or 'Varias')}</b></div><div><small>Escalas</small><b>{'Directo' if f.get('escalas') == 0 else e(f.get('escalas'))}</b></div>
</div>
<a class="hlc-btn" href="{e(x.get('cta_flight', '#'))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="deal_vuelo" style="min-height:56px;font-size:17px">Ver vuelo desde {e(f.get('precio'))} €</a>
<a class="hlc-btn t" href="{e(x.get('cta_hotel', '#'))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="deal_hotel">🏨 Hoteles en {e(f.get('destino'))}</a>
<div style="font:13px/1.5 Inter,sans-serif;color:#4A5468">Precio comprobado al publicar. Los vuelos baratos vuelan: si cambia, prueba fechas cercanas.</div>
<div class="share"><a class="hlc-btn o" href="https://wa.me/?text={share_txt}" target="_blank" rel="noopener">WhatsApp</a><a class="hlc-btn o" href="https://www.facebook.com/sharer/sharer.php?u={quote(url)}" target="_blank" rel="noopener">Facebook</a><button class="hlc-btn o" type="button" onclick="navigator.clipboard&&navigator.clipboard.writeText('{url}');this.textContent='¡Copiado!'">Copiar enlace</button></div>
<a class="hlc-btn s" href="/alertas/">🔔 Avísame de chollos así</a>
</aside>
</div>
<section class="sec" style="padding-top:10px"><div class="sec-h"><div><div class="kicker">Más chollos</div><h2>Otros chollos de hoy</h2></div><a class="hlc-btn o" href="/chollos/">Ver todos</a></div><div class="dc-grid" data-hlc-deals data-max="4"></div></section>
</div></main></body></html>'''
        open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(page)
        img = f"/chollos/{slug}/foto.jpg" if has_photo else '/hlc/brand/og-default.jpg'
        cards.append(f'''<a class="dc" href="/chollos/{e(slug)}/"><div class="dc-img" style="background-image:url('{img}')"><span class="dc-ok">✓ {e(fecha(x.get('approved_at', '')))}</span><span class="dc-city">{e(f.get('destino'))}</span></div><div class="dc-b"><div><div class="dc-r">{e(f.get('origen'))} → {e(f.get('destino'))}</div><div class="dc-m">{e(f.get('tipo', ''))}{' · directo' if f.get('escalas') == 0 else ''} · {e(fecha(f.get('ida', '')))}</div></div><div class="dc-p">{e(f.get('precio'))} €</div></div></a>''')
    lst = head(title='Chollos de vuelos de hoy, verificados · Happy Low Cost', desc='Los chollos de vuelos baratos desde España de hoy, con el precio comprobado antes de publicarlos. Fechas exactas y reserva en dos clics.',
               canonical=f'{SITE}/chollos/', og_type='website', og_image=f'{SITE}/hlc/brand/og-default.jpg', body_class='chollos')
    empty = '<div class="dc-empty"><b>Estamos cazando los próximos chollos.</b><span>Crea una alerta y te avisamos en cuanto salga uno desde tu aeropuerto.</span><a class="hlc-btn" href="/alertas/">Crear alerta gratis</a></div>'
    lst += f'''<main class="sec"><div class="wrap">
<div class="sec-h"><div><div class="kicker">Recién cazados · verificados</div><h1 style="font:800 clamp(38px,6vw,72px)/.95 'Bricolage Grotesque',sans-serif;letter-spacing:-.04em;margin:8px 0 0">Chollos de vuelos de hoy</h1><p>Cada chollo se comprueba antes de publicarlo. Si mañana ya no está disponible, lo retiramos.</p></div><a class="hlc-btn s" href="/alertas/">🔔 Crear alerta</a></div>
<div class="dc-grid">{''.join(cards) or empty}</div>
</div></main></body></html>'''
    open(os.path.join('chollos', 'index.html'), 'w', encoding='utf-8').write(lst)
    # sitemap
    urls = [f'{SITE}/chollos/'] + [f"{SITE}/chollos/{x['slug']}/" for x in deals]
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join(f'<url><loc>{u}</loc></url>' for u in urls) + '</urlset>\n'
    open('chollos-sitemap.xml', 'w', encoding='utf-8').write(sm)
    si = open('sitemap_index.xml', encoding='utf-8').read()
    if 'chollos-sitemap.xml' not in si:
        si = si.replace('</sitemapindex>', f'\t<sitemap>\n\t\t<loc>{SITE}/chollos-sitemap.xml</loc>\n\t</sitemap>\n</sitemapindex>')
        open('sitemap_index.xml', 'w', encoding='utf-8').write(si)
    print('deals', len(deals))


if __name__ == '__main__':
    main()
