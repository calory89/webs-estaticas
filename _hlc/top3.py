"""Top 3 hoteles de top3hotels.com por ciudad, para cada chollo (ES y EN).
Datos: _hlc/top3.json (lo genera _hlc/top3_export.py desde el repo calory89/top-3-hotels)."""
import json, os, html, math, re, unicodedata
from urllib.parse import quote

_D = None
CJ_HOTEL = 'https://www.kqzyfj.com/click-101900924-17288959?sid=happylowcost-top3&url='
CAT = {'es': {'b': 'Económico', 'v': 'Mejor calidad-precio', 'l': 'Lujo'},
       'en': {'b': 'Budget', 'v': 'Best value', 'l': 'Luxury'}}


def _data():
    global _D
    if _D is None:
        try:
            _D = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'top3.json'), encoding='utf-8'))
        except Exception:
            _D = []
    return _D


def _km(a, b, c, d):
    r = math.pi / 180
    x = math.sin((c - a) * r / 2) ** 2 + math.cos(a * r) * math.cos(c * r) * math.sin((d - b) * r / 2) ** 2
    return 12742 * math.asin(math.sqrt(min(1, x)))


def find(lat, lng, names=(), weak=()):
    """Ciudad de top3hotels: por nombre (a menos de 150 km), luego por nombre del aeropuerto, si no la más cercana a menos de 30 km."""
    if lat is None or lng is None:
        return None
    sq = lambda x: x.replace('-', '')
    strong, weak = {sq(n) for n in names or () if n}, {sq(n) for n in weak or () if n}
    best = {}
    for c in _data():
        if abs(c[3] - lat) > 2 or abs(c[4] - lng) > 3:
            continue
        k = _km(lat, lng, c[3], c[4])
        if k > 150:
            continue
        keys = {sq(c[0]), sq(_slug(c[1]))}
        segs = c[0].split('-')
        part = any(len(n) >= 6 and n in {sq('-'.join(segs[a:b])) for a in range(len(segs)) for b in range(a + 1, len(segs) + 1)} for n in strong)
        for tier, hit in ((0, keys & strong), (1, part), (2, keys & weak), (3, k <= 30)):
            if hit and (tier not in best or k < best[tier][0]):
                best[tier] = (k, c)
    for tier in range(4):
        if tier in best:
            return best[tier][1]
    return None


def _slug(s):
    s = unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def _e(x):
    return html.escape(str(x if x is not None else ''))


def hotel_faq(city_name, lat, lng, names=(), weak=(), lang='es', trip_from=None):
    """Ronda 10 (GSC: "hotels in buenos aires for a trip from brussels" 22 impr. pos. 9, "hotels in bogota for a trip from stockholm" pos. 4,9):
    pregunta y respuesta con los 3 hoteles de top3hotels.com (nombre, zona, nota de huéspedes y precio orientativo por noche). Nada inventado."""
    c = find(lat, lng, names, weak)
    if not c:
        return None
    es = lang == 'es'
    parts = []
    for name, cat, area, score, cnt, stars, nightly, burl, img in c[6]:
        det = ', '.join(x for x in ((f'{area}' if area else ''), (f'nota {str(score).replace(".", ",")}' if es else f'score {score}') if score else '',
                                    (f'desde {nightly} € la noche' if es else f'from €{nightly} a night') if nightly else '') if x)
        parts.append(f'{CAT[lang][cat].lower()}: {name}' + (f' ({det})' if det else ''))
    if len(parts) < 2:
        return None
    if es:
        q = f'¿Dónde dormir en {city_name}' + (f' en un viaje desde {trip_from}?' if trip_from else '?')
        a = 'Los 3 hoteles mejor valorados por huéspedes reales según top3hotels.com son ' + '; '.join(parts) + '. El precio por noche es orientativo y cambia con las fechas.'
    else:
        q = f'Which hotels in {city_name} for a trip from {trip_from}?' if trip_from else f'Which are the best hotels in {city_name}?'
        a = 'The 3 hotels with the best real guest scores, according to top3hotels.com, are ' + '; '.join(parts) + '. The nightly price is indicative and changes with the dates.'
    return q, a


def block(city_name, lat, lng, names=(), weak=(), lang='es', checkin=None, checkout=None, trip_from=None):
    c = find(lat, lng, names, weak)
    if not c:
        return ''
    slug, _, _, _, _, _, hs = c
    L = CAT[lang]
    t3 = f'https://www.top3hotels.com/{"es/" if lang == "es" else ""}{slug}'
    cards = []
    for name, cat, area, score, cnt, stars, nightly, burl, img in hs:
        bu = burl.replace('.html', '.es.html' if lang == 'es' else '.en-gb.html')
        if checkin:
            import bk
            bu = bk.with_dates(bu, checkin, checkout)
        href = CJ_HOTEL + quote(bu, safe='')
        meta = []
        if score:
            meta.append(f'<b class="t3-sc">{score:.1f}</b>' + (f' <span>{cnt:,} {"opiniones" if lang == "es" else "reviews"}</span>'.replace(',', '.' if lang == 'es' else ',') if cnt else ''))
        price = (f'<div class="t3-pr">{"desde" if lang == "es" else "from"} <b>{nightly} €</b>/{"noche" if lang == "es" else "night"}</div>' if nightly else '')
        go = ("Ver precio en tus fechas" if lang == "es" else "See price for your dates") if checkin else ("Ver hotel" if lang == "es" else "See hotel")
        cards.append(
            f'<a class="t3-c" href="{_e(href)}" target="_blank" rel="sponsored nofollow noopener" data-hlc="top3_hotel" data-tvcity="{_e(city_name)}">'
            + (f'<img src="{_e(img)}" alt="{_e(name)}, {"hotel en" if lang == "es" else "hotel in"} {_e(city_name)}{(" (" + _e(area) + ")") if area else ""}" loading="lazy" decoding="async" width="500" height="333">' if img else '<div class="t3-noimg">🏨</div>')
            + f'<div class="t3-b"><span class="t3-cat t3-{cat}">{L[cat]}</span><strong>{_e(name)}</strong>'
            + f'<div class="t3-m">{"★" * int(stars or 0)}{(" · " if stars and area else "") + _e(area) if area else ""}</div>'
            + (f'<div class="t3-m">{" ".join(meta)}</div>' if meta else '') + price
            + f'<span class="t3-go">{go} →</span></div></a>')
    if lang == 'es':
        h = (f'Hoteles en {_e(city_name)} para un viaje desde {_e(trip_from)}: los 3 mejores' if trip_from else f'Dónde dormir en {_e(city_name)}: los 3 mejores hoteles')
        k = 'Recomendados por top3hotels.com'
        more = f'Ver el análisis completo en top3hotels.com'
        note = 'Un hotel económico, uno con la mejor relación calidad-precio y uno de lujo, elegidos por nota real de huéspedes. Precio orientativo por noche.'
    else:
        h = (f'Hotels in {_e(city_name)} for a trip from {_e(trip_from)}: the 3 best' if trip_from else f'Where to stay in {_e(city_name)}: the 3 best hotels')
        k = 'Picked by top3hotels.com'
        more = 'Read the full analysis on top3hotels.com'
        note = 'One budget hotel, one best-value and one luxury pick, chosen on real guest scores. Indicative price per night.'
    return (f'<section class="sec t3" id="hoteles"><div class="sec-h"><div><div class="kicker">🏨 {k}</div><h2>{h}</h2></div>'
            f'<a class="hlc-btn o" href="{t3}" target="_blank" rel="noopener" data-hlc="top3_city">{more}</a></div>'
            f'<p class="t3-note">{note}</p><div class="t3-g">{"".join(cards)}</div></section>')
