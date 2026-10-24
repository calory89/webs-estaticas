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
ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZGFsZnN2dGZoemVweXJkbWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2Mzc3MjIsImV4cCI6MjA1OTIxMzcyMn0.IIbXzmsRZzBeS6DhTHtYJjQNAFVJMaqb0EnxJbwwMx4'  # clave pública (anon) de Supabase gmdalf: solo deja leer el panel agregado e insertar clics
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


LEGAL_EN = [
    ('Who runs this website', 'www.happylowcost.com ("Happy Low Cost") belongs to Nomadas Digitales OÜ, Lõõtsa tn 5-11, 11415 Tallinn, Estonia, registry code 14857974, VAT EE102226368. Contact: info@happylowcost.com.'),
    ('What the website does', 'Happy Low Cost publishes cheap flight deals, flight routes and travel guides for information only. We do not sell flights or hotels: bookings are made on third-party sites, under their own terms and prices.'),
    ('Prices and accuracy', 'Every deal shows when its price was checked. Fares change often and we cannot guarantee that a price is still available when you book. Amounts shown in currencies other than the euro are approximate conversions using the European Central Bank reference rate of the day.'),
    ('Affiliate links', 'Some links are affiliate links (for example to Booking.com through CJ). If you book through them we may earn a small commission at no extra cost to you. Commissions do not decide which deals we publish.'),
    ('Personal data we collect', 'If you create a deal alert we store the contact you give us (email or WhatsApp number), the airports, destination and price you choose, the date, and the IP address and browser of the request, to send you the alerts you asked for and to prevent abuse. We do not sell your data.'),
    ('Legal basis and how long we keep it', 'We process alert data on the basis of your consent, which you can withdraw at any time. We keep it while your alert is active and delete it when you unsubscribe or ask us to.'),
    ('Service providers', 'The website is hosted on Cloudflare. Alert data is stored with Supabase. Visit statistics and advertising measurement through Google Tag Manager only run if you accept them in the cookie banner. Each provider processes data on our behalf under its own data protection terms.'),
    ('Cookies and local storage', 'We use technically necessary storage (for example to remember your language, your airport, your favourite deals and your cookie choice). Analytics and advertising cookies are only set if you accept them; you can change your choice by clearing this site\'s data in your browser.'),
    ('Your rights', 'You can ask for access to, correction or deletion of your data, object to or restrict its use, or ask for a copy, by writing to info@happylowcost.com. You can also complain to your data protection authority; in Estonia this is the Andmekaitse Inspektsioon.'),
    ('Intellectual property', 'Texts, design and code of the website belong to Happy Low Cost unless stated otherwise. Destination photos come from Wikimedia Commons and similar sources, credited on each page under their licences.'),
    ('Changes', 'We may update this notice. The Spanish version of the legal notice also applies; if the two differ, write to us and we will clarify.'),
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
    url = f'{SITE}/en/legal/'
    items = ''.join(f'<h2>{G.e(q)}</h2><p>{G.e(a)}</p>' for q, a in LEGAL_EN)
    page = E.head('Legal notice, privacy and cookies · Happy Low Cost', 'Who runs Happy Low Cost, how prices and affiliate links work, what personal data we keep for deal alerts and your rights.', url,
                  f'{SITE}/aviso-legal-datos-cookies/', body_class='legal')
    page += (f'<main class="sec" style="padding-top:26px"><div class="wrap" style="max-width:820px"><div class="kicker">Legal</div><h1 class="x-h1">Legal notice, privacy and cookies</h1>'
             f'<article class="txt guide">{items}</article><p style="color:#4A5468">Last updated: 24 October 2026.</p></div></main>') + E.FOOTER + '</body></html>'
    os.makedirs('en/legal', exist_ok=True)
    open('en/legal/index.html', 'w', encoding='utf-8').write(page)

    # ---------- panel semanal (interno, sin indexar): alertas, chollos publicados y clics a reserva ----------
    ph = G.head(title='Panel semanal · Happy Low Cost', desc='Panel interno.', canonical=f'{SITE}/panel/', robots='noindex, nofollow', og_type='website', og_image=f'{SITE}/hlc/brand/og-default.jpg',
                extra_head='<link rel="stylesheet" href="/hlc/home.css?v=9">', body_class='panel')
    ph += '''<main class="sec" style="padding-top:26px"><div class="wrap">
<div class="kicker">Interno</div><h1 class="x-h1">Panel semanal</h1>
<p style="color:#4A5468">Altas de alerta, chollos publicados y clics a reservar por semana (lunes a domingo, hora UTC). Los ingresos de afiliado salen en el informe de CJ: cada clic desde una ficha lleva el SID <code>hlc-&lt;chollo&gt;</code> (o <code>hlcen-</code> en inglés), así que CJ desglosa la comisión por chollo.</p>
<div style="overflow-x:auto"><table id="t" style="width:100%;border-collapse:collapse;font:15px Inter,sans-serif;background:#fff;border-radius:14px"><thead><tr style="text-align:left"><th>Semana</th><th>Alertas</th><th>Email</th><th>WhatsApp</th><th>Chollos publicados</th><th>Clics vuelo</th><th>Clics hotel</th><th>Clics total</th></tr></thead><tbody><tr><td colspan="8">Cargando…</td></tr></tbody></table></div>
<h2 style="margin-top:34px">Chollos con más clics (7 días)</h2>
<div style="overflow-x:auto"><table id="top" style="width:100%;border-collapse:collapse;font:15px Inter,sans-serif;background:#fff"><thead><tr style="text-align:left"><th>Chollo</th><th>Clics vuelo</th><th>Clics hotel</th><th>Total</th></tr></thead><tbody></tbody></table></div>
<style>#t td,#t th,#top td,#top th{padding:10px 12px;border-bottom:1px solid #EADCC4;white-space:nowrap}</style>
<script>
(function(){var K='ANONKEY',U='https://gmdalfsvtfhzepyrdmjj.supabase.co/rest/v1/';
function g(p){return fetch(U+p,{headers:{apikey:K}}).then(function(r){return r.json();});}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
g('hlc_panel_semanal?select=*').then(function(l){document.querySelector('#t tbody').innerHTML=(l||[]).map(function(r){return '<tr><td>'+esc(r.semana)+'</td><td>'+r.alertas+'</td><td>'+r.alertas_email+'</td><td>'+r.alertas_whatsapp+'</td><td>'+r.chollos_publicados+'</td><td>'+r.clics_vuelo+'</td><td>'+r.clics_hotel+'</td><td>'+r.clics_total+'</td></tr>';}).join('');}).catch(function(){document.querySelector('#t tbody').innerHTML='<tr><td colspan="8">No se ha podido cargar.</td></tr>';});
g('hlc_panel_top?select=*').then(function(l){document.querySelector('#top tbody').innerHTML=(l||[]).map(function(r){return '<tr><td><a href="/chollos/'+esc(r.slug)+'/">'+esc(r.slug)+'</a></td><td>'+r.clics_vuelo+'</td><td>'+r.clics_hotel+'</td><td>'+r.total+'</td></tr>';}).join('')||'<tr><td colspan="4">Aún no hay clics registrados.</td></tr>';});
})();
</script></div></main></body></html>'''.replace('ANONKEY', ANON_KEY)
    os.makedirs('panel', exist_ok=True)
    open('panel/index.html', 'w', encoding='utf-8').write(ph)
    print('static ok')


if __name__ == '__main__':
    main()
