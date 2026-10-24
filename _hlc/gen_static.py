#!/usr/bin/env python3
"""Páginas fijas de Happy Low Cost en español e inglés: cómo verificamos los chollos (/como-verificamos/, /en/how-we-verify/).
Uso (desde la raíz de la rama pub/happylowcost.com): python3 _hlc/gen_static.py
"""
import os, sys, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
sys.path.insert(0, os.path.join(ROOT, '_hlc'))
import gen_deals as G  # noqa: E402
import gen_en as E  # noqa: E402

SITE = G.SITE
FOOT_ES = '<!--hlc-footer-->' + open(os.path.join(ROOT, '_hlc', 'partials', 'footer.html'), encoding='utf-8').read() + '<!--/hlc-footer-->'


def faq_ld(qas, lang):
    return {"@type": "FAQPage", "inLanguage": lang, "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in qas]}


ES_QA = [
    ('¿De dónde salen los chollos?', 'Leemos a todas horas las ofertas que publican webs de chollos de varios países (España, Europa, Estados Unidos y Australia) y las que encuentra nuestro propio rastreador de rutas. Cada oferta encontrada es solo un punto de partida: no se publica hasta pasar las comprobaciones de abajo.'),
    ('¿Cómo comprobáis el precio?', 'Buscamos ese mismo vuelo en Kiwi.com, con la ruta y las fechas anunciadas (con un margen de unos días), desde el aeropuerto anunciado o uno cercano. Si el precio real de ese momento es más de un 20 % mayor que el anunciado, el chollo se descarta.'),
    ('¿Qué es el «precio habitual»?', 'Para la misma ruta y la misma duración de viaje consultamos el vuelo más barato en tres fechas distintas, 3, 6 y 9 semanas después de la fecha del chollo, y nos quedamos con la mediana, redondeada a 10 €. El descuento que ves se calcula frente a ese precio.'),
    ('¿Cuánto tiene que bajar para ser un chollo?', 'Nuestro agente descarta todo lo que no esté al menos un 20 % por debajo del precio habitual, y en la web solo enseñamos los que bajan un 25 % o más.'),
    ('¿Publicáis vuelos solo de ida?', 'Casi nunca: publicamos ida y vuelta, salvo cuando es un error de tarifa claro.'),
    ('¿Qué pasa si el mismo vuelo ya estaba publicado?', 'Si ya teníamos esa ruta igual o más barata, el nuevo no se publica. Si el nuevo es más barato, sustituye al anterior.'),
    ('¿Cuándo se comprobó cada chollo?', 'Cada chollo muestra la fecha y la hora exactas de la comprobación. Los precios de los vuelos cambian a menudo, a veces en horas: si al reservar ves otro precio, prueba fechas cercanas.'),
    ('¿Cuándo desaparece un chollo?', 'Lo retiramos de la web cuando pasa su fecha de salida. Todavía no volvemos a comprobar cada precio a diario; por eso enseñamos siempre cuándo se comprobó.'),
    ('¿Por qué algunos precios aparecen en otra moneda?', 'Los precios se consultan en euros. Si sales de un país sin euro, añadimos el equivalente aproximado en tu moneda con el tipo de referencia del Banco Central Europeo del día. El precio final lo fija la web donde reserves.'),
    ('¿Ganáis dinero con los chollos?', 'Algunos enlaces son de afiliado: si reservas a través de ellos podemos recibir una pequeña comisión, sin coste extra para ti. Que un chollo tenga o no comisión no influye en si lo publicamos.'),
]
EN_QA = [
    ('Where do the deals come from?', 'Around the clock we read the fares published by deal sites in several countries (Spain, Europe, the United States and Australia) and those found by our own route scanner. A fare we find is only a starting point: it is not published until it passes the checks below.'),
    ('How do you check the price?', 'We search for the same flight on Kiwi.com, on the advertised route and dates (give or take a few days), from the advertised airport or a nearby one. If the real price at that moment is more than 20% above the advertised one, the deal is dropped.'),
    ('What is the "usual price"?', 'For the same route and the same trip length we look up the cheapest flight on three other dates, 3, 6 and 9 weeks after the deal date, and take the median, rounded to €10. The saving you see is measured against that price.'),
    ('How big does the drop have to be?', 'Our agent rejects anything that is not at least 20% below the usual price, and the website only shows deals that are 25% or more below it.'),
    ('Do you publish one-way flights?', 'Rarely: we publish return trips, except for clear error fares.'),
    ('What if the same flight was already published?', 'If we already had that route at the same price or cheaper, the new one is not published. If the new one is cheaper, it replaces the old one.'),
    ('When was each deal checked?', 'Every deal shows the exact date and time of the check. Flight prices change often, sometimes within hours: if you see a different price when booking, try nearby dates.'),
    ('When does a deal disappear?', 'We remove it from the site once its departure date has passed. We do not yet re-check every price daily, which is why we always show when it was checked.'),
    ('Why do some prices show another currency?', 'Prices are checked in euros. If you fly from a country without the euro, we add an approximate amount in your currency using the European Central Bank reference rate of the day. The final price is set by the site where you book.'),
    ('Do you make money from the deals?', 'Some links are affiliate links: if you book through them we may earn a small commission at no extra cost to you. Whether a deal pays a commission has no effect on whether we publish it.'),
]


def body(qas, kicker, h1, lead, cta, cta_href):
    items = ''.join(f'<h2>{G.e(q)}</h2><p>{G.e(a)}</p>' for q, a in qas)
    return (f'<main class="sec" style="padding-top:26px"><div class="wrap" style="max-width:820px">'
            f'<div class="kicker">{G.e(kicker)}</div><h1 class="x-h1">{G.e(h1)}</h1><p style="font-size:18px;line-height:1.6">{G.e(lead)}</p>'
            f'<article class="txt guide">{items}</article>'
            f'<p style="margin-top:28px"><a class="hlc-btn" href="{cta_href}">{G.e(cta)}</a></p></div></main>')


def main():
    es_url, en_url = f'{SITE}/como-verificamos/', f'{SITE}/en/how-we-verify/'
    alt = f'<link rel="alternate" hreflang="es" href="{es_url}"><link rel="alternate" hreflang="en" href="{en_url}"><link rel="alternate" hreflang="x-default" href="{es_url}">'
    t = 'Cómo verificamos cada chollo de vuelo · Happy Low Cost'
    lead = 'Un chollo solo se publica si el precio existe de verdad en el momento de publicarlo y está muy por debajo de lo que suele costar esa ruta. Así lo comprobamos, sin letra pequeña.'
    page = G.head(title=G.e(t), desc=G.e(G.smart_desc(lead)), canonical=es_url, og_type='article', og_image=f'{SITE}/hlc/brand/og-default.jpg',
                  extra_head='<link rel="stylesheet" href="/hlc/home.css?v=9">' + alt + G.ld_script([faq_ld(ES_QA, 'es-ES')]), body_class='metodo')
    page += body(ES_QA, 'Metodología', 'Cómo verificamos cada chollo', lead, 'Ver los chollos de hoy', '/chollos/') + '</body></html>'
    os.makedirs('como-verificamos', exist_ok=True)
    open('como-verificamos/index.html', 'w', encoding='utf-8').write(page)

    lead_en = 'A deal is only published if the price really exists at the moment we publish it and is well below what that route usually costs. This is how we check, with no small print.'
    page = E.head('How we verify every flight deal · Happy Low Cost', G.smart_desc(lead_en), en_url, es_url, ld=[faq_ld(EN_QA, 'en')], og_type='article')
    page += body(EN_QA, 'Methodology', 'How we verify every deal', lead_en, "See today's deals", '/en/deals/') + E.FOOTER + '</body></html>'
    os.makedirs('en/how-we-verify', exist_ok=True)
    open('en/how-we-verify/index.html', 'w', encoding='utf-8').write(page)
    print('static ok')


if __name__ == '__main__':
    main()
