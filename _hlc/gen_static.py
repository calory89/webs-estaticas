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
    ('¿Cuándo se comprobó cada chollo?', 'Cada chollo muestra la fecha y la hora exactas de la última comprobación. Los precios de los vuelos cambian a menudo, a veces en horas: si al reservar ves otro precio, prueba fechas cercanas.'),
    ('¿Cuándo desaparece un chollo?', 'Volvemos a buscar cada chollo activo una vez al día, con la misma ruta y las mismas fechas. Si ya no aparece o ha subido más de un 10 %, lo retiramos y su página pasa a «caducado». También lo retiramos cuando pasa su fecha de salida.'),
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
    ('When was each deal checked?', 'Every deal shows the exact date and time of the latest check. Flight prices change often, sometimes within hours: if you see a different price when booking, try nearby dates.'),
    ('When does a deal disappear?', 'We search every live deal again once a day, same route and dates. If it is gone or has risen more than 10%, we pull it and its page is marked as expired. We also remove it once its departure date has passed.'),
    ('Why do some prices show another currency?', 'Prices are checked in euros. If you fly from a country without the euro, we add an approximate amount in your currency using the European Central Bank reference rate of the day. The final price is set by the site where you book.'),
    ('Do you make money from the deals?', 'Some links are affiliate links: if you book through them we may earn a small commission at no extra cost to you. Whether a deal pays a commission has no effect on whether we publish it.'),
]


LEGAL_EN = [
    ('Who runs this website', 'www.happylowcost.com ("Happy Low Cost") belongs to Nomadas Digitales OÜ, Lõõtsa tn 5-11, 11415 Tallinn, Estonia, registry code 14857974, VAT EE102226368. Contact: carlos@equinoxinvestmentgroup.com or the contact form at happylowcost.com/en/contact/.'),
    ('What the website does', 'Happy Low Cost publishes cheap flight deals, flight routes and travel guides for information only. We do not sell flights or hotels: bookings are made on third-party sites, under their own terms and prices.'),
    ('Prices and accuracy', 'Every deal shows when its price was checked. Fares change often and we cannot guarantee that a price is still available when you book. Amounts shown in currencies other than the euro are approximate conversions using the European Central Bank reference rate of the day.'),
    ('Affiliate links', 'Some links are affiliate links (for example to Booking.com through CJ). If you book through them we may earn a small commission at no extra cost to you. Commissions do not decide which deals we publish.'),
    ('Personal data we collect', 'If you create a deal alert we store the contact you give us (email or WhatsApp number), the airports, destination and price you choose, the date, and the IP address and browser of the request, to send you the alerts you asked for and to prevent abuse. We do not sell your data.'),
    ('Legal basis and how long we keep it', 'We process alert data on the basis of your consent, which you can withdraw at any time. We keep it while your alert is active and delete it when you unsubscribe or ask us to.'),
    ('Service providers', 'The website is hosted on Cloudflare. Alert data is stored with Supabase. Visit statistics and advertising measurement through Google Tag Manager only run if you accept them in the cookie banner. Each provider processes data on our behalf under its own data protection terms.'),
    ('Cookies and local storage', 'We use technically necessary storage (for example to remember your language, your airport, your favourite deals and your cookie choice). Analytics and advertising cookies are only set if you accept them; you can change your choice by clearing this site\'s data in your browser.'),
    ('Your rights', 'You can ask for access to, correction or deletion of your data, object to or restrict its use, or ask for a copy, by writing to carlos@equinoxinvestmentgroup.com or through the contact form (happylowcost.com/en/contact/). You can also complain to your data protection authority; in Estonia this is the Andmekaitse Inspektsioon.'),
    ('Intellectual property', 'Texts, design and code of the website belong to Happy Low Cost unless stated otherwise. Destination photos come from Wikimedia Commons and similar sources, credited on each page under their licences.'),
    ('Changes', 'We may update this notice. The Spanish version of the legal notice also applies; if the two differ, write to us and we will clarify.'),
]


from bags import BAGS, BAG_SRC  # noqa: E402


def tools_pages():
    import json as _j
    data = _j.dumps([[a, f, w, c, p] for a, f, w, c, p in BAGS], ensure_ascii=False)
    for en in (False, True):
        L = (lambda a, b: b if en else a)
        url = f"{SITE}/en/tools/baggage/" if en else f"{SITE}/herramientas/equipaje/"
        alt = f'<link rel="alternate" hreflang="es" href="{SITE}/herramientas/equipaje/"><link rel="alternate" hreflang="en" href="{SITE}/en/tools/baggage/">'
        rows = ''.join(f'<tr><td><b>{G.e(a)}</b></td><td>{f[0]}×{f[1]}×{f[2]}</td><td>{G.e(w) or "—"}</td><td>{(f"{c[0]}×{c[1]}×{c[2]}") if c else "—"}</td><td>{G.e(p) or "—"}</td></tr>' for a, f, w, c, p in BAGS)
        src = ' · '.join(f'<a href="{u}" target="_blank" rel="noopener">{G.e(t)}</a>' for t, u in BAG_SRC)
        title = L('Calculadora de equipaje de mano low cost 2026: ¿cabe gratis tu mochila?', 'Low-cost hand luggage checker 2026: does your bag fly free?')
        desc = L('Mete las medidas de tu mochila o maleta y mira en qué aerolíneas low cost viaja gratis: Ryanair, Vueling, easyJet, Wizz Air, Volotea y más.',
                 'Enter your bag size and see which low-cost airlines let it fly free: Ryanair, Vueling, easyJet, Wizz Air, Volotea and more.')
        body = f'''<main class="sec" style="padding-top:26px"><div class="wrap" style="max-width:900px">
<div class="kicker">{L("Herramientas lowcost", "Low-cost tools")}</div><h1 class="x-h1">{L("¿Cabe gratis tu equipaje?", "Does your bag fly free?")}</h1>
<p style="font-size:18px">{L("Pon las medidas de tu mochila o maleta, en centímetros y con asas y ruedas incluidas.", "Enter your bag size in centimetres, including handles and wheels.")}</p>
<form class="xf open" data-bag style="margin:18px 0"><div class="xf-row">
<label class="xf-sel"><span>{L("Alto", "Height")} (cm)</span><input type="number" inputmode="numeric" name="a" min="5" max="120" value="40" required></label>
<label class="xf-sel"><span>{L("Ancho", "Width")} (cm)</span><input type="number" inputmode="numeric" name="b" min="5" max="120" value="30" required></label>
<label class="xf-sel"><span>{L("Fondo", "Depth")} (cm)</span><input type="number" inputmode="numeric" name="c" min="3" max="80" value="20" required></label>
</div></form>
<div data-bag-out aria-live="polite"></div>
<h2 style="margin-top:34px">{L("Medidas por aerolínea", "Sizes by airline")}</h2>
<div style="overflow-x:auto"><table class="bagt"><thead><tr><th>{L("Aerolínea", "Airline")}</th><th>{L("Bulto gratis (cm)", "Free item (cm)")}</th><th>{L("Peso", "Weight")}</th><th>{L("Maleta de cabina (cm)", "Cabin bag (cm)")}</th><th>{L("Precio maleta de cabina", "Cabin bag price")}</th></tr></thead><tbody>{rows}</tbody></table></div>
<p style="color:#4A5468;font-size:14px">{L("Datos publicados en", "Data published in")} {src}. {L("Las aerolíneas cambian sus normas y precios: confírmalo siempre en su web antes de volar.", "Airlines change rules and prices: always confirm on their website before flying.")}</p>
<style>.bagt{{width:100%;border-collapse:collapse;background:#fff;border-radius:14px;font:15px Inter,sans-serif}}.bagt td,.bagt th{{padding:10px 12px;border-bottom:1px solid #EADCC4;text-align:left;white-space:nowrap}}
.bag-r{{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px}}.bag-c{{background:#fff;border:1.5px solid #EADCC4;border-radius:14px;padding:12px 14px;font:15px/1.4 Inter,sans-serif}}.bag-c b{{display:block;font-size:16px}}.bag-c.ok{{border-color:#1F9D55}}.bag-c.ok i{{color:#1F9D55}}.bag-c.mid i{{color:#B7791F}}.bag-c.no i{{color:#C53030}}.bag-c i{{font-style:normal;font-weight:700}}</style>
<script>
(function(){{var D={data},EN={'true' if en else 'false'},f=document.querySelector('[data-bag]'),o=document.querySelector('[data-bag-out]');
function fits(x,l){{if(!l)return false;var a=x.slice().sort(function(p,q){{return q-p;}}),b=l.slice().sort(function(p,q){{return q-p;}});return a[0]<=b[0]&&a[1]<=b[1]&&a[2]<=b[2];}}
function run(){{var x=[+f.a.value||0,+f.b.value||0,+f.c.value||0];var free=0;
o.innerHTML='<div class="bag-r">'+D.map(function(r){{var a=fits(x,r[1]),c=!a&&fits(x,r[3]);if(a)free++;var cls=a?'ok':(c?'mid':'no');
var t=a?(EN?'Free':'Gratis'):(c?(EN?'Paid cabin bag':'Maleta de cabina')+(r[4]?' · '+r[4]:''):(EN?'Must be checked in':'Tiene que facturarse'));
return '<div class="bag-c '+cls+'"><b>'+r[0]+'</b><i>'+t+'</i></div>';}}).join('')+'</div><p style="font:16px Inter,sans-serif"><b>'+free+'</b> '+(EN?'of':'de')+' '+D.length+' '+(EN?'airlines let it fly free.':'aerolíneas la llevan gratis.')+'</p>';}}
f.addEventListener('input',run);run();}})();
</script>
<p style="margin-top:26px"><a class="hlc-btn" href="{L("/chollos/", "/en/deals/")}">{L("Ver los chollos de hoy", "See today’s deals")}</a></p></div></main>'''
        if en:
            pg = E.head(title + ' · Happy Low Cost', desc, url, f"{SITE}/herramientas/equipaje/", og_type='article', body_class='tool') + body + E.FOOTER + '</body></html>'
            os.makedirs('en/tools/baggage', exist_ok=True)
            open('en/tools/baggage/index.html', 'w', encoding='utf-8').write(pg)
        else:
            pg = G.head(title=G.e(title + ' · Happy Low Cost'), desc=G.e(desc), canonical=url, og_type='article', og_image=f'{SITE}/hlc/brand/og-default.jpg',
                        extra_head='<link rel="stylesheet" href="/hlc/home.css?v=12">' + alt, body_class='tool') + body + '</body></html>'
            os.makedirs('herramientas/equipaje', exist_ok=True)
            open('herramientas/equipaje/index.html', 'w', encoding='utf-8').write(pg)

    # ¿es buen precio?
    for en in (False, True):
        L = (lambda a, b: b if en else a)
        url = f"{SITE}/en/tools/is-it-a-good-price/" if en else f"{SITE}/herramientas/es-buen-precio/"
        alt = f'<link rel="alternate" hreflang="es" href="{SITE}/herramientas/es-buen-precio/"><link rel="alternate" hreflang="en" href="{SITE}/en/tools/is-it-a-good-price/">'
        title = L('¿Es buen precio este vuelo? Compáralo con lo normal en su ruta', 'Is this flight a good price? Compare it with the usual fare')
        desc = L('Escribe origen, destino y el precio que has visto: te decimos si es un chollo comparado con el precio habitual de esa ruta.', 'Enter origin, destination and the price you saw: we tell you if it is a deal compared with the usual fare on that route.')
        body = f'''<main class="sec" style="padding-top:26px"><div class="wrap" style="max-width:820px">
<div class="kicker">{L("Herramientas lowcost", "Low-cost tools")}</div><h1 class="x-h1">{L("¿Es buen precio?", "Is it a good price?")}</h1>
<p style="font-size:18px">{L("Compara el precio de ida y vuelta que has visto con lo que suele costar esa ruta en nuestras consultas a Kiwi.com.", "Compare the return fare you saw with what that route usually costs in our Kiwi.com checks.")}</p>
<form class="xf open" data-gp style="margin:18px 0"><div class="xf-row">
<label class="xf-search"><span aria-hidden="true">🛫</span><input name="o" list="gp-o" placeholder="{L("Desde (Madrid, Barcelona…)", "From (London, Madrid…)")}" required autocomplete="off"></label><datalist id="gp-o"></datalist>
<label class="xf-search"><span aria-hidden="true">🛬</span><input name="d" list="gp-d" placeholder="{L("A (Roma, Tokio…)", "To (Rome, Tokyo…)")}" required autocomplete="off"></label><datalist id="gp-d"></datalist>
<label class="xf-sel"><span>{L("Precio ida y vuelta (€)", "Return price (€)")}</span><input type="number" name="p" min="5" max="9999" inputmode="numeric" required></label>
<button class="hlc-btn" type="submit">{L("Comprobar", "Check")}</button></div></form>
<div data-gp-out aria-live="polite"></div></div></main>
<script>
(function(){{var EN={'true' if en else 'false'},f=document.querySelector('[data-gp]'),o=document.querySelector('[data-gp-out]'),I=[];
var sl=function(s){{return String(s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}};
fetch('/vuelos/rutas-idx.json').then(function(r){{return r.json();}}).then(function(j){{I=j;var os={{}},ds={{}};j.forEach(function(r){{os[r[2]]=1;ds[EN?r[4]:r[3]]=1;}});
document.getElementById('gp-o').innerHTML=Object.keys(os).sort().map(function(x){{return '<option value="'+x+'">';}}).join('');document.getElementById('gp-d').innerHTML=Object.keys(ds).sort().map(function(x){{return '<option value="'+x+'">';}}).join('');}});
f.addEventListener('submit',function(e){{e.preventDefault();var on=sl(f.o.value),dn=sl(f.d.value),p=+f.p.value;
var r=I.filter(function(x){{return sl(x[2])===on&&(sl(x[3])===dn||sl(x[4])===dn||x[5]===dn);}})[0];
if(!r){{o.innerHTML='<div class="dc-empty"><b>'+(EN?'We do not track that route yet.':'Todavía no seguimos esa ruta.')+'</b><span>'+(EN?'Check the routes we track or create an alert.':'Mira las rutas que seguimos o crea una alerta.')+'</span><a class="hlc-btn" href="'+(EN?'/en/flights/':'/vuelos/')+'">'+(EN?'Routes':'Rutas')+'</a></div>';return;}}
var med=r[7]||r[6],low=r[6],diff=Math.round((1-p/med)*100);
var v=p<=low?(EN?'Excellent: at or below the lowest fare we found.':'Excelente: igual o por debajo del más barato que encontramos.'):diff>=25?(EN?'Great deal: '+diff+'% below the usual price.':'Chollo: un '+diff+' % por debajo de lo normal.'):diff>=10?(EN?'Good price: '+diff+'% below usual.':'Buen precio: un '+diff+' % por debajo de lo normal.'):diff>-10?(EN?'Normal price for this route.':'Precio normal para esta ruta.'):(EN?'Expensive: '+(-diff)+'% above the usual price.':'Caro: un '+(-diff)+' % por encima de lo normal.');
o.innerHTML='<div class="dc-empty" style="text-align:left"><b>'+v+'</b><span>'+(EN?'Usual price':'Lo normal')+': '+med+' € · '+(EN?'cheapest we found':'el más barato que encontramos')+': '+low+' €.</span><a class="hlc-btn" href="'+(EN?'/en/flights/'+r[1]:'/vuelos/'+r[0])+'/">'+(EN?'See the price calendar':'Ver el calendario de precios')+'</a></div>';}});}})();
</script>'''
        if en:
            pg = E.head(title + ' · Happy Low Cost', desc, url, f"{SITE}/herramientas/es-buen-precio/", og_type='article', body_class='tool') + body + E.FOOTER + '</body></html>'
            os.makedirs('en/tools/is-it-a-good-price', exist_ok=True)
            open('en/tools/is-it-a-good-price/index.html', 'w', encoding='utf-8').write(pg)
        else:
            pg = G.head(title=G.e(title + ' · Happy Low Cost'), desc=G.e(desc), canonical=url, og_type='article', og_image=f'{SITE}/hlc/brand/og-default.jpg',
                        extra_head='<link rel="stylesheet" href="/hlc/home.css?v=12">' + alt, body_class='tool') + body + '</body></html>'
            os.makedirs('herramientas/es-buen-precio', exist_ok=True)
            open('herramientas/es-buen-precio/index.html', 'w', encoding='utf-8').write(pg)

    # índice de herramientas
    for en in (False, True):
        L = (lambda a, b: b if en else a)
        items = [(L('/herramientas/equipaje/', '/en/tools/baggage/'), L('¿Cabe gratis tu equipaje?', 'Does your bag fly free?'), L('Medidas de 11 aerolíneas y comprobador.', 'Sizes for 11 airlines and a checker.')),
                 (L('/herramientas/es-buen-precio/', '/en/tools/is-it-a-good-price/'), L('¿Es buen precio?', 'Is it a good price?'), L('Compara un precio con lo normal en su ruta.', 'Compare a fare with the usual price.')),
                 (L('/vuelos/', '/en/flights/'), L('Calendario de precios por ruta', 'Price calendar by route'), L('El mes más barato para volar, en más de 3.000 rutas.', 'The cheapest month to fly, on 3,000+ routes.')),
                 (L('/chollos/ideas/fin-de-semana/', '/en/deals/'), L('Escapadas de fin de semana', 'Today’s deals'), L('Chollos de 2 a 4 noches.', 'Verified flight deals.')),
                 (L('/como-verificamos/', '/en/how-we-verify/'), L('Cómo verificamos', 'How we verify'), L('El método detrás de cada chollo.', 'The method behind every deal.')),
                 (L('/guias/errores-de-tarifa/', '/en/guides/error-fares/'), L('Errores de tarifa', 'Error fares'), L('Qué hacer si te cancelan el vuelo.', 'What to do if the airline cancels.'))]
        cards = ''.join(f'<a class="hub-l" href="{u}" style="display:block;padding:16px"><b style="display:block;font-size:17px">{G.e(t)}</b><small style="font-size:14px">{G.e(dsc)}</small></a>' for u, t, dsc in items)
        url = f"{SITE}/en/tools/" if en else f"{SITE}/herramientas/"
        title = L('Herramientas para viajar barato', 'Tools to travel cheap')
        body = f'<main class="sec" style="padding-top:26px"><div class="wrap"><div class="kicker">{L("Herramientas lowcost", "Low-cost tools")}</div><h1 class="x-h1">{title}</h1><div class="hub-g" style="margin-top:20px">{cards}</div></div></main>'
        if en:
            pg = E.head(title + ' · Happy Low Cost', 'Free tools for cheap travel: baggage checker, good-price checker and price calendars.', url, f"{SITE}/herramientas/", body_class='tool') + body + E.FOOTER + '</body></html>'
            os.makedirs('en/tools', exist_ok=True)
            open('en/tools/index.html', 'w', encoding='utf-8').write(pg)
        else:
            pg = G.head(title=G.e(title + ' · Happy Low Cost'), desc='Herramientas gratis para viajar barato: equipaje de mano, si un precio es bueno y calendarios de precios.', canonical=url, og_type='website', og_image=f'{SITE}/hlc/brand/og-default.jpg',
                        extra_head=f'<link rel="stylesheet" href="/hlc/home.css?v=12"><link rel="alternate" hreflang="es" href="{SITE}/herramientas/"><link rel="alternate" hreflang="en" href="{SITE}/en/tools/">', body_class='tool') + body + '</body></html>'
            os.makedirs('herramientas', exist_ok=True)
            open('herramientas/index.html', 'w', encoding='utf-8').write(pg)


ERR_ES = [
    ('¿Qué es un error de tarifa?', 'Un precio publicado por equivocación: una aerolínea o agencia se olvida de un recargo, aplica mal una moneda o carga una tarifa con un cero de menos. Suelen durar horas y se pueden reservar con normalidad mientras están a la venta.'),
    ('¿Me pueden cancelar el billete?', 'Sí, puede pasar. Algunas aerolíneas respetan el precio y otras cancelan la reserva y devuelven el dinero. Lo habitual es que, si cancelan, reembolsen el importe completo.'),
    ('Qué hacer al reservar uno', 'Resérvalo rápido, porque suelen desaparecer en horas. Espera unos días a que la aerolínea emita el billete antes de pagar hoteles u otros gastos no reembolsables, y no llames a la aerolínea para preguntar por el precio.'),
    ('Si te lo cancelan', 'Pide el reembolso completo si no te lo hacen solos. Si habías pagado un hotel con cancelación gratuita, cancélalo. Por eso recomendamos reservar hoteles con cancelación gratis hasta que el vuelo esté confirmado.'),
    ('¿Cómo distinguimos un error de tarifa de un chollo normal?', 'En Happy Low Cost marcamos el ahorro frente al precio habitual de la ruta. Un descuento del 50 % o más suele ser una oferta excepcional o un error; lo llamamos «Excepcional» en la tarjeta del chollo.'),
]
ERR_EN = [
    ('What is an error fare?', 'A price published by mistake: an airline or agency forgets a surcharge, applies the wrong currency or loads a fare with a missing zero. They usually last hours and can be booked normally while on sale.'),
    ('Can they cancel my ticket?', 'Yes, it can happen. Some airlines honour the price and others cancel the booking and refund it. If they cancel, they normally refund the full amount.'),
    ('What to do when you book one', 'Book fast, as they tend to disappear within hours. Wait a few days for the airline to issue the ticket before paying for hotels or other non-refundable costs, and do not call the airline to ask about the price.'),
    ('If it gets cancelled', 'Ask for a full refund if it is not issued automatically. If you paid a hotel with free cancellation, cancel it. That is why we recommend booking hotels with free cancellation until the flight is confirmed.'),
    ('How do we tell an error fare from a normal deal?', 'At Happy Low Cost we show the saving against the usual price of the route. A discount of 50% or more is usually an exceptional offer or an error; we label it “Exceptional” on the deal card.'),
]


def extra_pages():
    for en in (False, True):
        L = (lambda a, b: b if en else a)
        # contacto
        url = f"{SITE}/en/contact/" if en else f"{SITE}/contacto/"
        body = f"""<main class="sec" style="padding-top:26px"><div class="wrap" style="max-width:720px">
<div class="kicker">{L("Contacto", "Contact")}</div><h1 class="x-h1">{L("Escríbenos", "Write to us")}</h1>
<p style="font-size:18px">{L("¿Un chollo que ya no está, un error en la web o una idea? Cuéntanoslo. Deja tu email si quieres respuesta.", "A deal that is gone, a mistake on the site or an idea? Tell us. Leave your email if you want a reply.")}</p>
<form class="alert-form" data-hlc-contact novalidate><div class="af" style="display:flex;flex-direction:column;gap:16px">
<div class="fld"><label for="ct-e">{L("Tu email (opcional)", "Your email (optional)")}</label><input id="ct-e" name="email" type="email" autocomplete="email" placeholder="{L("tu@email.com", "you@email.com")}" style="min-height:52px;border-radius:14px;border:1.5px solid #EADCC4;background:#fff;padding:0 16px;font:16px Inter,sans-serif;width:100%;box-sizing:border-box"></div>
<div class="fld"><label for="ct-m">{L("Mensaje", "Message")}</label><textarea id="ct-m" name="message" rows="6" required style="border-radius:14px;border:1.5px solid #EADCC4;background:#fff;padding:12px 16px;font:16px/1.5 Inter,sans-serif;width:100%;box-sizing:border-box"></textarea></div>
<button type="submit" class="hlc-btn" style="min-height:52px">{L("Enviar", "Send")}</button><div data-msg role="status" aria-live="polite"></div>
<p style="font-size:13px;color:#4A5468;margin:0">{L("Guardamos tu mensaje y tu email solo para contestarte.", "We keep your message and email only to reply to you.")} <a href="{L("/aviso-legal-datos-cookies/", "/en/legal/")}">{L("Privacidad", "Privacy")}</a></p></div></form></div></main>"""
        alt = f'<link rel="alternate" hreflang="es" href="{SITE}/contacto/"><link rel="alternate" hreflang="en" href="{SITE}/en/contact/">'
        if en:
            pg = E.head('Contact · Happy Low Cost', 'Write to Happy Low Cost: deals that are gone, mistakes on the site or ideas.', url, f'{SITE}/contacto/', body_class='contact') + body + E.FOOTER + '</body></html>'
            os.makedirs('en/contact', exist_ok=True); open('en/contact/index.html', 'w', encoding='utf-8').write(pg)
        else:
            pg = G.head(title='Contacto · Happy Low Cost', desc='Escribe a Happy Low Cost: chollos que ya no están, errores en la web o ideas.', canonical=url, og_type='website', og_image=f'{SITE}/hlc/brand/og-default.jpg',
                        extra_head='<link rel="stylesheet" href="/hlc/home.css?v=12">' + alt, body_class='contact') + body + '</body></html>'
            os.makedirs('contacto', exist_ok=True); open('contacto/index.html', 'w', encoding='utf-8').write(pg)
        # guía de errores de tarifa
        qas = ERR_EN if en else ERR_ES
        url = f"{SITE}/en/guides/error-fares/" if en else f"{SITE}/guias/errores-de-tarifa/"
        alt = f'<link rel="alternate" hreflang="es" href="{SITE}/guias/errores-de-tarifa/"><link rel="alternate" hreflang="en" href="{SITE}/en/guides/error-fares/">'
        lead = L('Qué son, cómo aprovecharlos y qué hacer si la aerolínea los cancela, sin perder dinero en hoteles.', 'What they are, how to make the most of them and what to do if the airline cancels, without losing money on hotels.')
        body = (f'<main class="sec" style="padding-top:26px"><div class="wrap" style="max-width:820px"><div class="kicker">{L("Guías para volar barato", "Guides to fly cheap")}</div>'
                f'<h1 class="x-h1">{L("Errores de tarifa: guía práctica", "Error fares: a practical guide")}</h1><p style="font-size:18px;line-height:1.6">{G.e(lead)}</p>'
                f'<article class="txt guide">{"".join(f"<h2>{G.e(q)}</h2><p>{G.e(a)}</p>" for q, a in qas)}</article>'
                f'<p style="margin-top:24px"><a class="hlc-btn" href="{L("/chollos/ideas/menos-de-100-euros/", "/en/deals/ideas/under-100/")}">{L("Ver chollos de hoy", "See today’s deals")}</a></p></div></main>')
        if en:
            pg = E.head('Error fares: what they are and what to do if cancelled · Happy Low Cost', G.smart_desc(lead), url, f'{SITE}/guias/errores-de-tarifa/', ld=[faq_ld(qas, 'en')], og_type='article', body_class='guide') + body + E.FOOTER + '</body></html>'
            os.makedirs('en/guides/error-fares', exist_ok=True); open('en/guides/error-fares/index.html', 'w', encoding='utf-8').write(pg)
        else:
            pg = G.head(title='Errores de tarifa: qué son y qué hacer si te los cancelan · Happy Low Cost', desc=G.e(G.smart_desc(lead)), canonical=url, og_type='article', og_image=f'{SITE}/hlc/brand/og-default.jpg',
                        extra_head='<link rel="stylesheet" href="/hlc/home.css?v=12">' + alt + G.ld_script([faq_ld(qas, 'es-ES')]), body_class='guide') + body + '</body></html>'
            os.makedirs('guias/errores-de-tarifa', exist_ok=True); open('guias/errores-de-tarifa/index.html', 'w', encoding='utf-8').write(pg)


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
                  extra_head='<link rel="stylesheet" href="/hlc/home.css?v=12">' + alt + G.ld_script([faq_ld(ES_QA, 'es-ES')]), body_class='metodo')
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
                extra_head='<link rel="stylesheet" href="/hlc/home.css?v=12">', body_class='panel')
    ph += '''<main class="sec" style="padding-top:26px"><div class="wrap">
<div class="kicker">Interno</div><h1 class="x-h1">Panel semanal</h1>
<p style="color:#4A5468">Altas de alerta, chollos publicados y clics a reservar por semana (lunes a domingo, hora UTC). Los ingresos de afiliado salen en el informe de CJ: cada clic desde una ficha lleva el SID <code>hlc-&lt;chollo&gt;</code> (o <code>hlcen-</code> en inglés), así que CJ desglosa la comisión por chollo.</p>
<div style="overflow-x:auto"><table id="t" style="width:100%;border-collapse:collapse;font:15px Inter,sans-serif;background:#fff;border-radius:14px"><thead><tr style="text-align:left"><th>Semana</th><th>Alertas</th><th>Email</th><th>WhatsApp</th><th>Push</th><th>Push enviados</th><th>Chollos publicados</th><th>Retirados al recomprobar</th><th>Clics vuelo</th><th>Clics hotel</th><th>Clics total</th></tr></thead><tbody><tr><td colspan="11">Cargando…</td></tr></tbody></table></div>
<h2 style="margin-top:34px">Chollos con más clics (7 días)</h2>
<div style="overflow-x:auto"><table id="top" style="width:100%;border-collapse:collapse;font:15px Inter,sans-serif;background:#fff"><thead><tr style="text-align:left"><th>Chollo</th><th>Clics vuelo</th><th>Clics hotel</th><th>Total</th></tr></thead><tbody></tbody></table></div>
<style>#t td,#t th,#top td,#top th{padding:10px 12px;border-bottom:1px solid #EADCC4;white-space:nowrap}</style>
<script>
(function(){var K='ANONKEY',U='https://gmdalfsvtfhzepyrdmjj.supabase.co/rest/v1/';
function g(p){return fetch(U+p,{headers:{apikey:K}}).then(function(r){return r.json();});}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
g('hlc_panel_semanal?select=*').then(function(l){document.querySelector('#t tbody').innerHTML=(l||[]).map(function(r){return '<tr><td>'+esc(r.semana)+'</td><td>'+r.alertas+'</td><td>'+r.alertas_email+'</td><td>'+r.alertas_whatsapp+'</td><td>'+r.alertas_push+'</td><td>'+r.push_enviados+'</td><td>'+r.chollos_publicados+'</td><td>'+r.retirados_revalidacion+'</td><td>'+r.clics_vuelo+'</td><td>'+r.clics_hotel+'</td><td>'+r.clics_total+'</td></tr>';}).join('');}).catch(function(){document.querySelector('#t tbody').innerHTML='<tr><td colspan="11">No se ha podido cargar.</td></tr>';});
g('hlc_panel_top?select=*').then(function(l){document.querySelector('#top tbody').innerHTML=(l||[]).map(function(r){return '<tr><td><a href="/chollos/'+esc(r.slug)+'/">'+esc(r.slug)+'</a></td><td>'+r.clics_vuelo+'</td><td>'+r.clics_hotel+'</td><td>'+r.total+'</td></tr>';}).join('')||'<tr><td colspan="4">Aún no hay clics registrados.</td></tr>';});
})();
</script></div></main></body></html>'''.replace('ANONKEY', ANON_KEY)
    os.makedirs('panel', exist_ok=True)
    open('panel/index.html', 'w', encoding='utf-8').write(ph)
    pg = G.head(title='Sin conexión · Happy Low Cost', desc='Sin conexión.', canonical=f'{SITE}/offline/', robots='noindex, nofollow', og_type='website', og_image=f'{SITE}/hlc/brand/og-default.jpg', body_class='offline')
    pg += ('<main class="sec"><div class="wrap" style="max-width:640px;text-align:center"><h1 class="x-h1">Sin conexión</h1><p style="font-size:18px">No hay internet ahora mismo. '
           'Los chollos que ya abriste siguen guardados en este móvil; vuelve a intentarlo en un momento para ver los de hoy.</p><p><a class="hlc-btn" href="/chollos/">Reintentar</a></p></div></main></body></html>')
    os.makedirs('offline', exist_ok=True)
    open('offline/index.html', 'w', encoding='utf-8').write(pg)
    tools_pages()
    extra_pages()
    import gen_blog
    gen_blog.main()
    pages = ['/como-verificamos/', '/herramientas/', '/herramientas/equipaje/', '/herramientas/es-buen-precio/', '/alertas/', '/destinos/', '/vuelos/',
             '/hoteles/', '/en/hotels/', '/contacto/', '/en/contact/', '/blog/', '/guias/errores-de-tarifa/', '/en/guides/error-fares/', '/en/how-we-verify/', '/en/legal/', '/en/tools/', '/en/tools/baggage/', '/en/tools/is-it-a-good-price/']
    import datetime as _dt
    today = _dt.date.today().isoformat()
    open('paginas-sitemap.xml', 'w', encoding='utf-8').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join(f'<url><loc>{SITE}{p}</loc><lastmod>{today}</lastmod></url>' for p in pages) + '</urlset>\n')
    si = open('sitemap_index.xml', encoding='utf-8').read()
    if 'paginas-sitemap.xml' not in si:
        si = si.replace('</sitemapindex>', f'\t<sitemap>\n\t\t<loc>{SITE}/paginas-sitemap.xml</loc>\n\t</sitemap>\n</sitemapindex>')
        open('sitemap_index.xml', 'w', encoding='utf-8').write(si)
    print('static ok')


if __name__ == '__main__':
    main()
