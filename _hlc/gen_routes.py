#!/usr/bin/env python3
"""Páginas de rutas "vuelos baratos de X a Y" (ES en /vuelos/<ruta>/ y EN en /en/flights/<ruta>/).
El texto lo escribe la función hlc-routes de Supabase con la API de Claude (créditos de Carlos);
este script solo descarga ese contenido y monta el HTML estático. Ejecutar desde la raíz de la rama pub/happylowcost.com,
después de gen_deals.py y gen_en.py, y antes de `HLC_ONLY=vuelos python3 _hlc/build.py`."""
import os, sys, json, html, urllib.request
from urllib.parse import quote
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_deals as G  # noqa: E402
import gen_en as E  # noqa: E402

SITE = 'https://www.happylowcost.com'
FEED = 'https://gmdalfsvtfhzepyrdmjj.supabase.co/functions/v1/hlc-routes?action=feed'
def e(x):
    return html.escape(str(x if x is not None else ""))


def cj(aid, url):
    return f'https://www.kqzyfj.com/click-101900924-{aid}?sid=happylowcost-rutas&url={quote(url, safe="")}'


def flight_link(f, locale):
    o, d = f.get('origen_iata'), f.get('destino_iata')
    dep, ret = (f.get('ejemplo_ida') or '')[:10], (f.get('ejemplo_vuelta') or '')[:10]
    u = (f'https://flights.booking.com/flights/{o}.AIRPORT-{d}.AIRPORT/?type=ROUNDTRIP&adults=1&cabinClass=ECONOMY&from={o}.AIRPORT&to={d}.AIRPORT'
         f'&depart={dep}&return={ret}&sort=CHEAPEST&locale={locale}&salesCurrency=EUR')
    return cj('17288982', u)


def hotel_link(city, en):
    host = 'searchresults.en-gb.html' if en else 'searchresults.es.html'
    return cj('17288959', f'https://www.booking.com/{host}?ss={city}')


def body(c):
    s = ''.join(f'<h2>{e(x.get("h", ""))}</h2><p>{e(x.get("p", ""))}</p>' for x in c.get('sections', []))
    faq = c.get('faq', [])
    if faq:
        s += '<h2>' + ('Preguntas frecuentes' if c is not None and c.get('_lang') == 'es' else 'FAQ') + '</h2>'
        s += ''.join(f'<h3>{e(q.get("q", ""))}</h3><p>{e(q.get("a", ""))}</p>' for q in faq)
    return s


def ld(c, url, crumbs):
    faq = {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q.get('q', ''), "acceptedAnswer": {"@type": "Answer", "text": q.get('a', '')}} for q in c.get('faq', [])]}
    bc = {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, **({"item": SITE + u} if u else {})} for i, (n, u) in enumerate(crumbs)]}
    return [faq, bc]


def page(r, lang, others):
    en = lang == 'en'
    c = dict(r['content'][lang]); c['_lang'] = lang
    f = r['facts']
    slug = r['slug']
    url = f"{SITE}/en/flights/{slug}/" if en else f"{SITE}/vuelos/{slug}/"
    es_url, en_url = f"{SITE}/vuelos/{slug}/", f"{SITE}/en/flights/{slug}/"
    ds = r['dest_slug']
    hero = f'/hlc/img/cities/{ds}.jpg'
    dest = E.NAMES.get(ds, r['dest']) if en else r['dest']
    stops = f.get('escalas_ida')
    stops_t = ('Nonstop' if en else 'Directo') if stops == 0 else (f'{stops} stop' + ('s' if stops > 1 else '') if en else f'{stops} escala' + ('s' if stops > 1 else ''))
    when = (f.get('ejemplo_ida') or '')[:10]
    crumbs = [('Home', '/en/'), ('Flights', '/en/flights/'), (c.get('h1', ''), None)] if en else [('Inicio', '/'), ('Vuelos', '/vuelos/'), (c.get('h1', ''), None)]
    alt = (f'<link rel="alternate" hreflang="es" href="{es_url}"><link rel="alternate" hreflang="en" href="{en_url}"><link rel="alternate" hreflang="x-default" href="{es_url}">')
    if en:
        h = E.head(c.get('title', ''), c.get('meta', ''), url, es_url, og_image=f'{SITE}{hero}', ld=ld(c, url, crumbs), body_class='deal')
    else:
        h = G.head(title=e(c.get('title', '')), desc=e(c.get('meta', '')), canonical=url, og_image=f'{SITE}{hero}', og_type='article',
                   extra_head='<link rel="stylesheet" href="/hlc/home.css?v=9">' + alt + G.ld_script(ld(c, url, crumbs)), body_class='deal')
    rel = ''.join(f'<a class="hub-l" href="{"/en/flights/" if en else "/vuelos/"}{o["slug"]}/">{e(o["origin"])} → {e(E.NAMES.get(o["dest_slug"], o["dest"]) if en else o["dest"])} · {o["price_from"]} €</a>' for o in others[:12])
    L = (lambda es_, en_: en_ if en else es_)
    out = h + f'''<main>
<section class="deal-hero" style="background-image:url({hero})"{G.photos_attr(ds)}><div class="wrap">
<div class="kicker" style="color:#FFC531">{L("✓ Precios reales consultados el", "✓ Real prices checked on")} {e(f.get("consultado", ""))}</div>
<h1>{e(c.get("h1", ""))}</h1>
<div class="deal-cta"><a class="price-tag" href="{e(flight_link(f, "en-gb" if en else "es"))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="ruta_precio">{e(f.get("precio_desde_ida_y_vuelta_eur"))} € <small>{L("ida y vuelta", "return")}</small></a><span class="price-was">{L("Lo normal", "Typical price")}: {e(f.get("mediana_ida_y_vuelta_eur"))} €</span><a class="hlc-btn" href="{e(flight_link(f, "en-gb" if en else "es"))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="ruta_vuelo" style="min-height:56px;font-size:17px">{L("Ver vuelos y fechas ✈️", "See flights and dates ✈️")}</a></div>
</div></section>
<div class="wrap"><div class="deal-body">
<article class="txt"><p><strong>{e(c.get("intro", ""))}</strong></p>{body(c)}
<p class="credit">{L("Foto: Wikimedia Commons. Precios de ida y vuelta en clase turista para 1 adulto, consultados en Kiwi.com en la fecha indicada; pueden cambiar.", "Photo: Wikimedia Commons. Return economy fares for 1 adult, checked on Kiwi.com on the date shown; they can change.")}</p></article>
<aside class="deal-card">
<div class="facts">
<div><small>{L("Desde", "From")}</small><b>{e(r["origin"])} ({e(r["origin_iata"])})</b></div><div><small>{L("Hasta", "To")}</small><b>{e(dest)} ({e(r["dest_iata"])})</b></div>
<div><small>{L("Precio desde", "Price from")}</small><b>{e(f.get("precio_desde_ida_y_vuelta_eur"))} €</b></div><div><small>{L("Lo normal", "Typical")}</small><b>{e(f.get("mediana_ida_y_vuelta_eur"))} €</b></div>
<div><small>{L("Aerolínea", "Airline")}</small><b>{e(f.get("aerolinea") or L("Varias", "Several"))}</b></div><div><small>{L("Escalas", "Stops")}</small><b>{e(stops_t)}</b></div>
</div>
<a class="hlc-btn" href="{e(flight_link(f, "en-gb" if en else "es"))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="ruta_vuelo" style="min-height:56px;font-size:17px">{L("Ver vuelos desde", "Flights from")} {e(f.get("precio_desde_ida_y_vuelta_eur"))} €</a>
<a class="hlc-btn t" href="{e(G.BK.with_dates(hotel_link(r["dest"], en), f.get("ejemplo_ida"), f.get("ejemplo_vuelta")))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="ruta_hotel">🏨 {L("Hoteles en", "Hotels in")} {e(dest)}</a>
{"" if en else f'<a class="hlc-btn s" href="/alertas/?d={quote(r["dest"])}">🔔 Avísame si baja de precio</a>'}
<a class="hlc-btn o" href="{"/en/destinations/" if en else "/destinos/"}{e(ds)}/">📖 {L("Guía de", "Guide to")} {e(dest)}</a>
<div style="font:13px/1.5 Inter,sans-serif;color:#4A5468">{L("Ejemplo de fechas encontradas", "Example dates found")}: {e(when)}</div>
</aside>
</div>
{G.T3.block(dest, *G.dest_ll({"destino": r["dest"], "destino_iata": r["dest_iata"]}), lang="en" if en else "es", checkin=f.get("ejemplo_ida"), checkout=f.get("ejemplo_vuelta"))}
{f'<section class="hub"><h2>{L("Más rutas baratas", "More cheap routes")}</h2><div class="hub-g">{rel}</div></section>' if rel else ''}
</div></main>{E.FOOTER if en else ""}</body></html>'''
    return out


def hub(rows, en):
    by = {}
    for r in rows:
        by.setdefault(r['origin'], []).append(r)
    base = '/en/flights/' if en else '/vuelos/'
    secs = ''.join(f'<section class="hub"><h2>{"Cheap flights from" if en else "Vuelos baratos desde"} {e(o)}</h2><div class="hub-g">' + ''.join(
        f'<a class="hub-l" href="{base}{r["slug"]}/">{e(E.NAMES.get(r["dest_slug"], r["dest"]) if en else r["dest"])} · {r["price_from"]} €</a>' for r in sorted(lst, key=lambda x: x['price_from'])) + '</div></section>' for o, lst in sorted(by.items(), key=lambda kv: -len(kv[1])))
    title = 'Cheap flights: every route with real prices · Happy Low Cost' if en else 'Vuelos baratos: todas las rutas con precios reales · Happy Low Cost'
    desc = (f'{len(rows)} routes with real return prices, airlines and the best time to fly.' if en
            else f'{len(rows)} rutas con precios reales de ida y vuelta, aerolíneas y mejor época para volar.')
    if en:
        h = E.head(title, desc, SITE + base, SITE + '/vuelos/', body_class='chollos')
    else:
        h = G.head(title=e(title), desc=e(desc), canonical=SITE + base, og_image=f'{SITE}/hlc/brand/og-default.jpg', og_type='website',
                   extra_head=f'<link rel="stylesheet" href="/hlc/home.css?v=9"><link rel="alternate" hreflang="es" href="{SITE}/vuelos/"><link rel="alternate" hreflang="en" href="{SITE}/en/flights/">', body_class='chollos')
    return h + f'''<main class="sec" style="padding-top:26px"><div class="wrap">
<div class="sec-h"><div><div class="kicker">{"Real prices, checked on Kiwi.com" if en else "Precios reales, consultados en Kiwi.com"}</div><h1 class="x-h1">{"Cheap flights, route by route" if en else "Vuelos baratos, ruta a ruta"}</h1><p>{e(desc)}</p></div></div>
{secs}
</div></main>{E.FOOTER if en else ""}</body></html>'''


def main():
    rows, raw, off = [], b'', 0
    while True:
        chunk = urllib.request.urlopen(urllib.request.Request(f'{FEED}&offset={off}', headers={'User-Agent': 'hlc-build'}), timeout=90).read()
        part = json.loads(chunk)
        raw += chunk
        rows += part
        if len(part) < 500:
            break
        off += 500
    rows = [r for r in rows if r.get('content') and r['content'].get('es') and r['content'].get('en') and os.path.exists(f"hlc/img/cities/{r['dest_slug']}.jpg")]
    by_dest, by_orig = {}, {}
    for r in rows:
        by_dest.setdefault(r['dest_slug'], []).append(r)
        by_orig.setdefault(r['origin'], []).append(r)
    urls_es, urls_en = [f'{SITE}/vuelos/'], [f'{SITE}/en/flights/']
    for r in rows:
        others = [o for o in by_dest[r['dest_slug']] if o['slug'] != r['slug']] + [o for o in sorted(by_orig[r['origin']], key=lambda x: x['price_from']) if o['slug'] != r['slug']]
        for lang, base, urls in (('es', 'vuelos', urls_es), ('en', 'en/flights', urls_en)):
            d = os.path.join(base, r['slug'])
            os.makedirs(d, exist_ok=True)
            open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(page(r, lang, others))
            urls.append(f"{SITE}/{base}/{r['slug']}/")
    json.dump({r['slug']: r['price_from'] for r in rows}, open('vuelos/rutas.json', 'w'), separators=(',', ':'))
    for base, en in (('vuelos', False), ('en/flights', True)):
        os.makedirs(base, exist_ok=True)
        open(os.path.join(base, 'index.html'), 'w', encoding='utf-8').write(hub(rows, en))
    for name, urls in (('vuelos-sitemap.xml', urls_es), ('flights-sitemap.xml', urls_en)):
        open(name, 'w', encoding='utf-8').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join(f'<url><loc>{u}</loc></url>' for u in urls) + '</urlset>\n')
    si = open('sitemap_index.xml', encoding='utf-8').read()
    for sm in ('vuelos-sitemap.xml', 'flights-sitemap.xml'):
        if sm not in si:
            si = si.replace('</sitemapindex>', f'\t<sitemap>\n\t\t<loc>{SITE}/{sm}</loc>\n\t</sitemap>\n</sitemapindex>')
    open('sitemap_index.xml', 'w', encoding='utf-8').write(si)
    stamp = urllib.request.urlopen(urllib.request.Request(FEED.replace('action=feed', 'action=stamp'), headers={'User-Agent': 'hlc-build'}), timeout=60).read().decode()
    open('vuelos/feed.sha', 'w').write(stamp)
    print('rutas', len(rows))


if __name__ == '__main__':
    main()
