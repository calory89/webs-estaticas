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
ANON_KEY = 'sb_publishable_Eh-sCyaGiw6AVE910v_mqA_WsW63Bdz'  # clave pública (anon) de Supabase gmdalf: solo deja leer el panel agregado e insertar clics
FOOT_ES = '<!--hlc-footer-->' + open(os.path.join(ROOT, '_hlc', 'partials', 'footer.html'), encoding='utf-8').read() + '<!--/hlc-footer-->'


def faq_ld(qas, lang):
    return {"@type": "FAQPage", "inLanguage": lang, "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in qas]}


ES_QA = [
    ('¿De dónde salen los chollos?', 'Leemos a todas horas las ofertas que publican webs de chollos de varios países (España, Europa, Estados Unidos y Australia) y las que encuentra nuestro propio rastreador de rutas. Cada oferta encontrada es solo un punto de partida: no se publica hasta pasar las comprobaciones de abajo.'),
    ('¿Cómo comprobáis el precio?', 'Buscamos ese mismo vuelo en Kiwi.com, con la ruta y las fechas anunciadas (con un margen de unos días), desde el aeropuerto anunciado o uno cercano. Si el precio real de ese momento es más de un 20 % mayor que el anunciado, el chollo se descarta.'),
    ('¿Qué es el «precio habitual»?', 'Para la misma ruta y la misma duración de viaje consultamos el vuelo más barato en tres fechas distintas, 3, 6 y 9 semanas después de la fecha del chollo, y nos quedamos con la mediana, redondeada a 10 €. El descuento que ves se calcula frente a ese precio.'),
    ('¿Cuánto tiene que bajar para ser un chollo?', 'Nuestro agente descarta todo lo que no esté al menos un 20 % por debajo del precio habitual, y en la web solo enseñamos los que bajan un 40 % o más.'),
    ('¿Publicáis vuelos solo de ida?', 'Casi nunca: publicamos ida y vuelta, salvo cuando es un error de tarifa claro.'),
    ('¿Qué pasa si el mismo vuelo ya estaba publicado?', 'Si ya teníamos esa ruta igual o más barata, el nuevo no se publica. Si el nuevo es más barato, sustituye al anterior.'),
    ('¿Cuándo se comprobó cada chollo?', 'Cada chollo muestra la fecha y la hora exactas de la última comprobación. Los precios de los vuelos cambian a menudo, a veces en horas: si al reservar ves otro precio, prueba fechas cercanas.'),
    ('¿Cuándo desaparece un chollo?', 'Por defecto, a la semana de publicarse. Además, volvemos a buscar cada chollo activo una vez al día, con la misma ruta y las mismas fechas. Si ya no aparece o ha subido más de un 10 %, lo retiramos y su página pasa a «caducado». También lo retiramos cuando pasa su fecha de salida.'),
    ('¿Por qué algunos precios aparecen en otra moneda?', 'Los precios se consultan en euros. Si sales de un país sin euro, añadimos el equivalente aproximado en tu moneda con el tipo de referencia del Banco Central Europeo del día. El precio final lo fija la web donde reserves.'),
    ('¿Ganáis dinero con los chollos?', 'Algunos enlaces son de afiliado: si reservas a través de ellos podemos recibir una pequeña comisión, sin coste extra para ti. Que un chollo tenga o no comisión no influye en si lo publicamos.'),
]
EN_QA = [
    ('Where do the deals come from?', 'Around the clock we read the fares published by deal sites in several countries (Spain, Europe, the United States and Australia) and those found by our own route scanner. A fare we find is only a starting point: it is not published until it passes the checks below.'),
    ('How do you check the price?', 'We search for the same flight on Kiwi.com, on the advertised route and dates (give or take a few days), from the advertised airport or a nearby one. If the real price at that moment is more than 20% above the advertised one, the deal is dropped.'),
    ('What is the "usual price"?', 'For the same route and the same trip length we look up the cheapest flight on three other dates, 3, 6 and 9 weeks after the deal date, and take the median, rounded to €10. The saving you see is measured against that price.'),
    ('How big does the drop have to be?', 'Our agent rejects anything that is not at least 20% below the usual price, and the website only shows deals that are 40% or more below it.'),
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


def alerts_pages():
    """/en/alerts/: la mitad inglesa del sitio no tenia donde pedir un aviso.

    /en/ se llevo 49.892 de las 104.935 impresiones del ultimo mes y la unica
    pagina de alertas estaba en espanol, asi que un ingles que llegaba a una
    ruta no tenia ninguna forma de dejar su correo. Los aeropuertos de salida
    que se ofrecen salen del feed de hoy, no de una lista inventada: si no
    publicamos chollos desde Londres, Londres no sale como si lo hicieramos.
    """
    inp = 'style="min-height:52px;border-radius:14px;border:1.5px solid #EADCC4;background:#fff;padding:0 16px;font:16px Inter,sans-serif;color:#14213D;width:100%;box-sizing:border-box"'
    tops = []
    try:
        import urllib.request
        import en_names
        feed = json.loads(urllib.request.urlopen(urllib.request.Request(G.API, headers=G.UA), timeout=45).read())
        cnt = {}
        for x in feed:
            c = ((x.get('facts') or {}).get('origen') or '').strip()
            if c:
                cnt[en_names.city_en(c)] = cnt.get(en_names.city_en(c), 0) + 1
        tops = [c for c, _ in sorted(cnt.items(), key=lambda kv: -kv[1])[:9]]
    except Exception as err:
        print('alerts: feed no disponible', str(err)[:60])
    if not tops:
        tops = ['Madrid', 'Barcelona', 'London', 'Dublin', 'New York', 'Paris', 'Rome', 'Lisbon', 'Milan']
    chips = ''.join(f'<button type="button" class="chip" data-chip data-v="{G.e(c)}" aria-pressed="{"true" if i == 0 else "false"}">{G.e(c)}</button>' for i, c in enumerate(tops))
    qas = [('Is it free?', 'Yes. We send at most one email a day and you unsubscribe with one click.'),
           ('Where do your deals leave from?', 'Most of them from Spain, and a growing number from the United States, Canada, Australia and the rest of Europe. The airports above are the ones in today\'s deals, so you can see what we actually cover before you leave your email.'),
           ('What counts as a deal?', 'A return flight at least 40 % below the usual price for that route, with the price checked again before it is published and every day after that.')]
    form = f'''<form class="alert-form" data-hlc-alert novalidate><div class="af" style="display:flex;flex-direction:column;gap:20px">
<fieldset class="fld"><legend>Where do you fly from?</legend><div class="chips">{chips}</div></fieldset>
<div class="fld"><label for="af-dest">Where do you dream of going?</label><input id="af-dest" name="destination" type="text" placeholder="Japan, New York, Bali… or anywhere" autocomplete="off" {inp}></div>
<fieldset class="fld"><legend>Highest price (return)</legend><div class="chips">
<button type="button" class="chip" data-pick="price" data-v="100" aria-pressed="false">€100</button>
<button type="button" class="chip" data-pick="price" data-v="300" aria-pressed="true">€300</button>
<button type="button" class="chip" data-pick="price" data-v="600" aria-pressed="false">€600</button>
<button type="button" class="chip" data-pick="price" data-v="1000" aria-pressed="false">€1,000</button>
</div></fieldset>
<div class="fld"><label for="af-contact" data-contact-label>Your email</label>
<input id="af-contact" name="contact" type="email" placeholder="you@email.com" autocomplete="email" required {inp}>
<small style="color:#4A5468">Rather not give an email? Turn on the alert in this browser with the button below.</small></div>
<label class="consent"><input type="checkbox" name="consent" required><span>I agree to receive Happy Low Cost deal alerts (one a day at most) and I accept the <a href="/en/legal/">privacy policy</a>. I can unsubscribe whenever I want.</span></label>
<button type="submit" class="hlc-btn" style="min-height:56px;font-size:17px">Turn on my free alert</button>
<div data-msg role="status" aria-live="polite"></div>
</div><div class="af-ok" data-ok hidden></div></form>'''
    body = ('<main class="sec"><div class="alert-box" style="max-width:1180px;margin:0 auto">'
            '<div><div class="kicker">Free alerts</div>'
            '<h1 style="font:800 clamp(38px,5.6vw,64px)/.98 \'Bricolage Grotesque\',sans-serif;letter-spacing:-.03em;margin:10px 0 14px">Let the deal find you.</h1>'
            '<p>Pick your airport, the place you dream of and the most you want to pay. When we hunt down a flight that fits, we tell you. '
            'No spam: one alert a day at most, and you leave with one click.</p>'
            f'<article class="txt guide" style="margin-top:26px">{"".join(f"<h2>{G.e(q)}</h2><p>{G.e(a)}</p>" for q, a in qas)}</article></div>'
            f'{form}</div></main>')
    url = f'{SITE}/en/alerts/'
    pg = E.head('Free flight deal alerts: let the deal find you · Happy Low Cost',
                'Tell us your airport, your dream destination and your top price. We check every price before we send it, one alert a day at most, free and one click to leave.',
                url, f'{SITE}/alertas/', ld=[faq_ld(qas, 'en')], body_class='alertas') + body + E.FOOTER + '</body></html>'
    os.makedirs('en/alerts', exist_ok=True)
    open('en/alerts/index.html', 'w', encoding='utf-8').write(pg)
    print('en/alerts', len(tops), 'aeropuertos del feed')


def videos_pages():
    """/videos/ y /en/videos/: los viajeros comparten el vídeo de su viaje (enlace o archivo) y se ve el muro de vídeos aprobados."""
    for en in (False, True):
        L = (lambda a, b: b if en else a)
        url = f"{SITE}/en/videos/" if en else f"{SITE}/videos/"
        alt = f'<link rel="alternate" hreflang="es" href="{SITE}/videos/"><link rel="alternate" hreflang="en" href="{SITE}/en/videos/"><link rel="alternate" hreflang="x-default" href="{SITE}/videos/">'
        inp = 'style="min-height:52px;border-radius:14px;border:1.5px solid #EADCC4;background:#fff;padding:0 16px;font:16px Inter,sans-serif;color:#14213D;width:100%;box-sizing:border-box"'
        qas = [(L('¿Qué vídeos publicáis?', 'Which videos do you publish?'), L('Vídeos cortos de un viaje real: el destino, un rincón, la comida, el hotel o el vuelo. Mejor en vertical y de 15 a 60 segundos. No publicamos anuncios ni vídeos de otras personas.', 'Short videos of a real trip: the place, a corner, the food, the hotel or the flight. Vertical and 15 to 60 seconds works best. We do not publish ads or other people\'s videos.')),
               (L('¿Cuándo sale publicado?', 'When does it go live?'), L('Revisamos cada vídeo a mano. Si encaja, sale en la web en uno o dos días, con tu nombre o tu @usuario. Los mejores los compartimos también en nuestra página de Facebook.', 'We review every video by hand. If it fits, it goes live within a day or two, with your name or @handle. We also share the best ones on our Facebook page.')),
               (L('¿Puedo retirarlo después?', 'Can I take it down later?'), L('Sí. Escríbenos desde la página de contacto con el destino y tu @usuario y lo quitamos.', 'Yes. Write to us from the contact page with the place and your @handle and we will remove it.'))]
        body = f"""<main class="sec" style="padding-top:26px"><div class="wrap" style="max-width:1100px">
<div class="kicker">{L("Comunidad", "Community")}</div><h1 class="x-h1">{L("Vídeos de viajeros", "Traveller videos")}</h1>
<p style="font-size:18px;line-height:1.6;max-width:720px">{L("Viajes reales de gente que vuela barato. Comparte el tuyo: pega el enlace de tu TikTok, Reel o YouTube, o sube el vídeo directamente. Los mejores salen también en nuestra página de Facebook, con más de 420.000 seguidores.", "Real trips from people who fly cheap. Share yours: paste your TikTok, Reel or YouTube link, or upload the video directly. The best ones also go on our Facebook page, followed by more than 420,000 travellers.")}</p>
<div class="vf-grid">
<form class="alert-form vf" data-hlc-video novalidate><div class="af" style="display:flex;flex-direction:column;gap:16px">
<h2 style="margin:0;font:800 24px/1.15 'Bricolage Grotesque',sans-serif">{L("Comparte tu viaje en vídeo", "Share your trip video")}</h2>
<div class="chips" role="group" aria-label="{L("Cómo lo envías", "How you send it")}"><button type="button" class="chip" data-vk="link" aria-pressed="true">🔗 {L("Pegar enlace", "Paste a link")}</button><button type="button" class="chip" data-vk="file" aria-pressed="false">⬆️ {L("Subir archivo", "Upload a file")}</button></div>
<div class="fld" data-vpane="link"><label for="vf-url">{L("Enlace de TikTok, Reel de Instagram o YouTube", "TikTok, Instagram Reel or YouTube link")}</label><input id="vf-url" name="url" type="url" inputmode="url" placeholder="https://www.tiktok.com/@tu_usuario/video/…" {inp}></div>
<div class="fld" data-vpane="file" hidden><label for="vf-file">{L("Tu vídeo (MP4, MOV o WebM, hasta 50 MB)", "Your video (MP4, MOV or WebM, up to 50 MB)")}</label><input id="vf-file" name="file" type="file" accept="video/mp4,video/quicktime,video/webm" style="font:15px Inter,sans-serif"><small data-fname style="color:#4A5468"></small></div>
<div class="fld"><label for="vf-dest">{L("¿Dónde lo grabaste?", "Where did you film it?")}</label><input id="vf-dest" name="dest" type="text" list="vf-dests" autocomplete="off" placeholder="{L("Lisboa, Bali, Nueva York…", "Lisbon, Bali, New York…")}" required {inp}><datalist id="vf-dests"></datalist></div>
<div class="fld"><label for="vf-cap">{L("Una frase sobre el viaje (opcional)", "One line about the trip (optional)")}</label><input id="vf-cap" name="caption" type="text" maxlength="300" placeholder="{L("4 días por 120 € con vuelo y hotel", "4 days for €120 with flight and hotel")}" {inp}></div>
<div class="fld"><label for="vf-h">{L("Tu nombre o @usuario para el crédito", "Your name or @handle for the credit")}</label><input id="vf-h" name="handle" type="text" maxlength="60" placeholder="@{L("tu_usuario", "your_handle")}" {inp}></div>
<div class="fld"><label for="vf-e">{L("Email (opcional, solo para avisarte cuando se publique)", "Email (optional, only to tell you when it goes live)")}</label><input id="vf-e" name="email" type="email" autocomplete="email" placeholder="{L("tu@email.com", "you@email.com")}" {inp}></div>
<label class="consent"><input type="checkbox" name="consent" required><span>{L('El vídeo es mío y autorizo a Happy Low Cost a publicarlo en su web y en sus redes con mi crédito. Acepto la <a href="/aviso-legal-datos-cookies/">política de privacidad</a>.', 'The video is mine and I allow Happy Low Cost to publish it on its website and social media with my credit. I accept the <a href="/en/legal/">privacy policy</a>.')}</span></label>
<button type="submit" class="hlc-btn" style="min-height:56px;font-size:17px">{L("Enviar mi vídeo", "Send my video")}</button>
<div data-msg role="status" aria-live="polite"></div></div></form>
<aside class="vf-tips"><h2>{L("Para que salga publicado", "To get it published")}</h2><ul><li>{L("Vertical y corto: de 15 a 60 segundos.", "Vertical and short: 15 to 60 seconds.")}</li><li>{L("Que se vea el sitio: playa, calle, plato, vistas.", "Show the place: beach, street, food, views.")}</li><li>{L("Si fue un chollo, cuéntanos cuánto pagaste.", "If it was a deal, tell us what you paid.")}</li><li>{L("Sin música con derechos si lo subes como archivo.", "No copyrighted music if you upload a file.")}</li></ul></aside>
</div>
<section class="vw" data-hlc-videos aria-label="{L("Vídeos publicados", "Published videos")}"><h2 class="x-h2">{L("Los últimos vídeos", "Latest videos")}</h2><div class="vw-grid"><p class="vw-empty">{L("Cargando vídeos…", "Loading videos…")}</p></div></section>
<article class="txt guide" style="max-width:820px">{"".join(f"<h2>{G.e(q)}</h2><p>{G.e(a)}</p>" for q, a in qas)}</article>
</div></main>"""
        title = L('Vídeos de viajeros: comparte tu viaje · Happy Low Cost', 'Traveller videos: share your trip · Happy Low Cost')
        desc = L('Vídeos reales de viajes baratos. Comparte el tuyo con un enlace de TikTok, Reels o YouTube, o súbelo: los mejores salen en nuestra página de Facebook.', 'Real cheap-trip videos. Share yours with a TikTok, Reels or YouTube link, or upload it: the best go on our Facebook page.')
        if en:
            pg = E.head(title, desc, url, f'{SITE}/videos/', ld=[faq_ld(qas, 'en')], body_class='videos') + body + E.FOOTER + '</body></html>'
            os.makedirs('en/videos', exist_ok=True); open('en/videos/index.html', 'w', encoding='utf-8').write(pg)
        else:
            pg = G.head(title=title, desc=desc, canonical=url, og_type='website', og_image=f'{SITE}/hlc/brand/og-default.jpg',
                        extra_head='<link rel="stylesheet" href="/hlc/home.css?v=12">' + alt + G.ld_script([faq_ld(qas, 'es-ES')]), body_class='videos') + body + '</body></html>'
            os.makedirs('videos', exist_ok=True); open('videos/index.html', 'w', encoding='utf-8').write(pg)


# Fundador y responsable editorial: entidad Person para Google y los asistentes (quién está detrás de los datos)
PERSON = {"@type": "Person", "@id": SITE + "/#carlos-de-ory", "name": "Carlos de Ory", "url": "https://www.carlosdeory.com", "sameAs": ["https://www.carlosdeory.com"],
          "jobTitle": "Fundador de Happy Low Cost", "worksFor": {"@id": SITE + "/#org"}, "knowsAbout": ["vuelos baratos", "errores de tarifa", "viajes low cost"]}

GLOSS = [
    ('chollo', 'Chollo', 'Deal',
     'Vuelo que publicamos porque cuesta al menos un 40 % menos que su precio habitual, comprobado en Kiwi.com en el momento de publicarlo.',
     'A flight we publish because it costs at least 40% less than its usual price, checked on Kiwi.com when we publish it.'),
    ('error-de-tarifa', 'Error de tarifa', 'Fare error',
     'Precio publicado por error por una aerolínea o agencia, muy por debajo de lo normal (por ejemplo, un vuelo de 500 € a 100 €). Suele durar horas y a veces la aerolínea no lo respeta.',
     'A price published by mistake by an airline or agency, far below normal (for example, a 500 € flight for 100 €). It usually lasts hours and the airline sometimes cancels it.'),
    ('precio-habitual', 'Precio habitual', 'Usual price',
     'La mediana del precio de la misma ruta y duración en tres fechas, 3, 6 y 9 semanas después del chollo, redondeada a 10 €. Es la referencia con la que calculamos el descuento.',
     'The median price of the same route and trip length on three dates, 3, 6 and 9 weeks after the deal, rounded to 10 €. It is the reference we use to work out the discount.'),
    ('mediana', 'Mediana', 'Median',
     'El valor del medio cuando se ordenan los precios de menor a mayor. La usamos en vez de la media para que un precio raro, muy alto o muy bajo, no desvíe la referencia.',
     'The middle value when prices are sorted from lowest to highest. We use it instead of the average so that one odd price, very high or very low, does not skew the reference.'),
    ('ida-y-vuelta', 'Ida y vuelta', 'Return flight',
     'Billete que incluye el viaje de ida y el de regreso. Todos los precios de Happy Low Cost son de ida y vuelta salvo errores de tarifa claros.',
     'A ticket that includes the outbound and the return journey. All Happy Low Cost prices are return fares except clear fare errors.'),
    ('vuelo-directo', 'Vuelo directo', 'Nonstop flight',
     'Vuelo sin escalas entre el aeropuerto de salida y el de destino. En nuestras rutas indicamos si la opción más barata que encontramos es directa o cuántas escalas hace.',
     'A flight with no stops between departure and arrival airports. On our routes we say whether the cheapest option we found is nonstop or how many stops it makes.'),
    ('escala', 'Escala', 'Stopover',
     'Parada en un aeropuerto intermedio, con o sin cambio de avión. Más escalas suelen abaratar el billete y alargar el viaje.',
     'A stop at an intermediate airport, with or without a change of plane. More stops usually make the ticket cheaper and the trip longer.'),
    ('low-cost', 'Aerolínea low cost', 'Low-cost airline',
     'Aerolínea de bajo coste que vende la tarifa básica barata y cobra aparte equipaje, asiento y otros extras.',
     'A budget airline that sells a cheap basic fare and charges separately for bags, seats and other extras.'),
    ('alerta-de-precio', 'Alerta de precio', 'Price alert',
     'Aviso gratis por email o notificación cuando publicamos un chollo al destino o desde la ciudad que eliges.',
     'A free email or push notification when we publish a deal to the destination or from the city you choose.'),
    ('mes-mas-barato', 'Mes más barato', 'Cheapest month',
     'El mes de los próximos seis con el vuelo de ida y vuelta más barato que encontramos para una ruta, según nuestro calendario de precios.',
     'The month in the next six with the cheapest return flight we found for a route, according to our price calendar.'),
]


def seo_pages():
    """Glosario (DefinedTermSet) y preguntas sobre Happy Low Cost (FAQPage), en español y en inglés."""
    for en in (False, True):
        L = (lambda a, b: b if en else a)
        url_es, url_en = f'{SITE}/glosario/', f'{SITE}/en/glossary/'
        url = url_en if en else url_es
        title = L('Glosario de vuelos baratos: chollo, error de tarifa, mediana · Happy Low Cost', 'Cheap flights glossary: deal, fare error, median · Happy Low Cost')
        lead = L('Qué queremos decir exactamente con cada palabra que usamos en los chollos y en las páginas de precios.', 'What we mean exactly by each word we use on deals and price pages.')
        dts = {"@type": "DefinedTermSet", "@id": url + "#set", "name": L('Glosario de Happy Low Cost', 'Happy Low Cost glossary'), "url": url, "inLanguage": "en" if en else "es-ES", "publisher": {"@id": SITE + "/#org"},
               "hasDefinedTerm": [{"@type": "DefinedTerm", "@id": url + "#" + k, "name": L(n_es, n_en), "description": L(d_es, d_en), "inDefinedTermSet": url + "#set", "url": url + "#" + k} for k, n_es, n_en, d_es, d_en in GLOSS]}
        items = ''.join(f'<h2 id="{k}">{G.e(L(n_es, n_en))}</h2><p>{G.e(L(d_es, d_en))}</p>' for k, n_es, n_en, d_es, d_en in GLOSS)
        bod = (f'<main class="sec" style="padding-top:26px"><div class="wrap" style="max-width:820px"><div class="kicker">{L("Glosario", "Glossary")}</div>'
               f'<h1 class="x-h1">{L("Glosario de vuelos baratos", "Cheap flights glossary")}</h1><p style="font-size:18px;line-height:1.6">{G.e(lead)}</p><article class="txt guide">{items}</article>'
               f'<p style="margin-top:28px"><a class="hlc-btn" href="{L("/como-verificamos/", "/en/how-we-verify/")}">{L("Cómo verificamos los chollos", "How we verify deals")}</a> '
               f'<a class="hlc-btn o" href="{L("/sobre-happy-low-cost/", "/en/about/")}">{L("Preguntas sobre Happy Low Cost", "About Happy Low Cost")}</a></p></div></main>')
        _write(en, url, url_es, url_en, title, lead, [dts], bod, 'glosario', L('glosario', 'en/glossary'))
        # ---- preguntas sobre Happy Low Cost ----
        url_es, url_en = f'{SITE}/sobre-happy-low-cost/', f'{SITE}/en/about/'
        url = url_en if en else url_es
        qas = [
            (L('¿Qué es Happy Low Cost?', 'What is Happy Low Cost?'),
             L('Una web de chollos de vuelos fundada en 2012 por Carlos de Ory. Publicamos vuelos de ida y vuelta que cuestan al menos un 40 % menos de lo habitual, comprobados en Kiwi.com, y guías de viaje de destino.',
               'A flight deals website founded in 2012 by Carlos de Ory. We publish return flights that cost at least 40% less than usual, checked on Kiwi.com, plus destination travel guides.')),
            (L('¿Quién está detrás?', 'Who is behind it?'),
             L('Carlos de Ory, fundador (carlosdeory.com). Nos siguen más de 420.000 viajeros en Facebook.', 'Carlos de Ory, founder (carlosdeory.com). More than 420,000 travellers follow us on Facebook.')),
            (L('¿Cómo gana dinero Happy Low Cost?', 'How does Happy Low Cost make money?'),
             L('Con enlaces de afiliado: si reservas a través de ellos podemos recibir una pequeña comisión, sin coste extra para ti. También publicamos artículos patrocinados, siempre marcados como tales. Que un chollo tenga comisión no influye en si lo publicamos.',
               'Through affiliate links: if you book through them we may earn a small commission at no extra cost to you. We also publish sponsored articles, always labelled as such. Whether a deal pays a commission does not affect whether we publish it.')),
            (L('¿Vendéis vuelos?', 'Do you sell flights?'),
             L('No. Encontramos y comprobamos el precio; la reserva se hace en la web de la aerolínea o de la agencia a la que enlazamos.', 'No. We find and check the price; you book on the airline or agency website we link to.')),
            (L('¿De dónde salen los precios de las rutas?', 'Where do the route prices come from?'),
             L('De nuestras propias consultas en Kiwi.com: precio más bajo de ida y vuelta, el habitual (mediana) y el mes más barato. Cada página dice la fecha de la consulta. Los datos se pueden reutilizar citando a Happy Low Cost (CC BY 4.0).',
               'From our own searches on Kiwi.com: lowest return fare, usual fare (median) and cheapest month. Each page shows the date of the search. The data can be reused crediting Happy Low Cost (CC BY 4.0).')),
            (L('¿Cuánto dura un chollo?', 'How long does a deal last?'),
             L('Por defecto, una semana desde que se publica. Lo volvemos a comprobar cada día y lo retiramos si sube más de un 10 % o desaparece.', 'By default, one week from publication. We re-check it every day and remove it if it rises more than 10% or disappears.')),
            (L('¿Cómo me entero de los chollos?', 'How do I hear about deals?'),
             L('Con una alerta gratis por email o notificación en el móvil, eligiendo destino o ciudad de salida.', 'With a free email or push alert, choosing a destination or departure city.')),
        ]
        org = {"@type": "Organization", "@id": SITE + "/#org", "name": "Happy Low Cost", "url": SITE + "/", "foundingDate": "2012", "founder": {"@id": SITE + "/#carlos-de-ory"}}
        title = L('Preguntas sobre Happy Low Cost: quiénes somos y cómo ganamos dinero', 'About Happy Low Cost: who we are and how we make money')
        lead = L('Respuestas cortas a lo que más nos preguntan sobre la web, quién la hace y de dónde salen los precios.', 'Short answers to what people ask most about the site, who runs it and where the prices come from.')
        items = ''.join(f'<h2>{G.e(q)}</h2><p>{G.e(a)}</p>' for q, a in qas)
        bod = (f'<main class="sec" style="padding-top:26px"><div class="wrap" style="max-width:820px"><div class="kicker">{L("Sobre nosotros", "About us")}</div>'
               f'<h1 class="x-h1">{L("Preguntas sobre Happy Low Cost", "About Happy Low Cost")}</h1><p style="font-size:18px;line-height:1.6">{G.e(lead)}</p><article class="txt guide">{items}</article>'
               f'<p style="margin-top:28px"><a class="hlc-btn" href="{L("/chollos/", "/en/deals/")}">{L("Ver los chollos de hoy", "See today’s deals")}</a> '
               f'<a class="hlc-btn o" href="{L("/glosario/", "/en/glossary/")}">{L("Glosario", "Glossary")}</a> <a class="hlc-btn o" href="{L("/vuelos/datos/", "/en/flights/data/")}">{L("Nuestros datos de precios", "Our price data")}</a></p></div></main>')
        _write(en, url, url_es, url_en, title, lead, [faq_ld(qas, 'en' if en else 'es-ES'), org, PERSON], bod, 'metodo', L('sobre-happy-low-cost', 'en/about'))


def _write(en, url, url_es, url_en, title, lead, ld, bod, cls, path):
    if en:
        pg = E.head(title, G.smart_desc(lead), url, url_es, ld=ld, og_type='article', body_class=cls) + bod + E.FOOTER + '</body></html>'
    else:
        alt = f'<link rel="alternate" hreflang="es" href="{url_es}"><link rel="alternate" hreflang="en" href="{url_en}"><link rel="alternate" hreflang="x-default" href="{url_es}">'
        pg = G.head(title=G.e(title), desc=G.e(G.smart_desc(lead)), canonical=url, og_type='article', og_image=f'{SITE}/hlc/brand/og-default.jpg',
                    extra_head='<link rel="stylesheet" href="/hlc/home.css?v=12">' + alt + G.ld_script(ld), body_class=cls) + bod + '</body></html>'
    os.makedirs(path, exist_ok=True)
    open(os.path.join(path, 'index.html'), 'w', encoding='utf-8').write(pg)


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
                  extra_head='<link rel="stylesheet" href="/hlc/home.css?v=12">' + alt + G.ld_script([faq_ld(ES_QA, 'es-ES'), PERSON]), body_class='metodo')
    page += body(ES_QA, 'Metodología', 'Cómo verificamos cada chollo', lead, 'Ver los chollos de hoy', '/chollos/').replace('</div></main>', '<p style="margin-top:18px;color:#4A5468">Responsable: <a href="https://www.carlosdeory.com" rel="author">Carlos de Ory</a>, fundador. Más: <a href="/glosario/">glosario</a> · <a href="/sobre-happy-low-cost/">preguntas sobre Happy Low Cost</a> · <a href="/vuelos/datos/">nuestros datos de precios</a></p></div></main>', 1) + '</body></html>'
    os.makedirs('como-verificamos', exist_ok=True)
    open('como-verificamos/index.html', 'w', encoding='utf-8').write(page)

    lead_en = 'A deal is only published if the price really exists at the moment we publish it and is well below what that route usually costs. This is how we check, with no small print.'
    page = E.head('How we verify every flight deal · Happy Low Cost', G.smart_desc(lead_en), en_url, es_url, ld=[faq_ld(EN_QA, 'en'), PERSON], og_type='article')
    page += body(EN_QA, 'Methodology', 'How we verify every deal', lead_en, "See today's deals", '/en/deals/').replace('</div></main>', '<p style="margin-top:18px;color:#4A5468">Editor: <a href="https://www.carlosdeory.com" rel="author">Carlos de Ory</a>, founder. More: <a href="/en/glossary/">glossary</a> · <a href="/en/about/">about Happy Low Cost</a> · <a href="/en/flights/data/">our price data</a></p></div></main>', 1) + E.FOOTER + '</body></html>'
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

    # ---------- aviso legal en español con el diseño nuevo (el texto legal vive en partials/legal-es.html) ----------
    legal_es = open(os.path.join(ROOT, '_hlc', 'partials', 'legal-es.html'), encoding='utf-8').read()
    lurl = f'{SITE}/aviso-legal-datos-cookies/'
    lalt = f'<link rel="alternate" hreflang="es" href="{lurl}"><link rel="alternate" hreflang="en" href="{SITE}/en/legal/">'
    pg = G.head(title='Aviso legal, privacidad y cookies · Happy Low Cost', desc='Quién está detrás de Happy Low Cost, cómo funcionan los precios y los enlaces de afiliado, qué datos guardamos para las alertas y cuáles son tus derechos.',
                canonical=lurl, og_type='website', og_image=f'{SITE}/hlc/brand/og-default.jpg', extra_head='<link rel="stylesheet" href="/hlc/home.css?v=12">' + lalt, body_class='legal')
    # índice con anclas: aviso legal, privacidad y cookies en la misma página, pero localizables
    legal_es = legal_es.replace('<h2>Aviso legal</h2>', '<h2 id="aviso-legal">Aviso legal</h2>', 1)
    legal_es = legal_es.replace('<h3>SÉPTIMA.- TRATAMIENTO DE DATOS Y UTILIZACIÓN DE COOKIES</h3>', '<h3 id="privacidad">SÉPTIMA.- TRATAMIENTO DE DATOS Y UTILIZACIÓN DE COOKIES</h3>', 1)
    legal_es = legal_es.replace('<p><b>DESCRIPCIÓN DE COOKIES: </b>', '<h3 id="cookies">Cookies</h3><p><b>DESCRIPCIÓN DE COOKIES: </b>', 1)
    legal_es = legal_es.replace('<p><b>FORMAS DE BLOQUEAR Y LIMITAR EL USO DE COOKIES: </b>', '<p id="bloquear-cookies"><b>FORMAS DE BLOQUEAR Y LIMITAR EL USO DE COOKIES: </b>', 1)
    toc = ('<ul class="legal-toc"><li><a href="#aviso-legal">Aviso legal</a></li><li><a href="#privacidad">Privacidad y datos</a></li>'
           '<li><a href="#cookies">Cookies</a></li><li><a href="#bloquear-cookies">Cómo bloquear las cookies</a></li><li><a href="/contacto/">Contacto</a></li></ul>')
    pg += (f'<main class="sec" style="padding-top:26px"><div class="wrap" style="max-width:820px"><div class="kicker">Legal</div><h1 class="x-h1">Aviso legal, privacidad y cookies</h1>{toc}'
           f'<article class="txt guide">{legal_es}</article></div></main></body></html>')
    os.makedirs('aviso-legal-datos-cookies', exist_ok=True)
    open('aviso-legal-datos-cookies/index.html', 'w', encoding='utf-8').write(pg)

    # ---------- 404 con el diseño nuevo: buscador, chollos de hoy y accesos ----------
    p404 = G.head(title='Página no encontrada · Happy Low Cost', desc='Esta página ya no existe. Mira los chollos de vuelos de hoy o busca un destino.', canonical=f'{SITE}/404', robots='noindex, follow', og_type='website',
                  og_image=f'{SITE}/hlc/brand/og-default.jpg', extra_head='<link rel="stylesheet" href="/hlc/home.css?v=12">', body_class='e404')
    p404 = p404.replace(f'<link rel="canonical" href="{SITE}/404">\n', '')
    p404 += ('<main class="sec" style="padding-top:40px"><div class="wrap" style="max-width:760px;text-align:center"><div class="kicker">Error 404</div>'
             '<h1 class="x-h1">Este vuelo ya ha despegado</h1><p style="font-size:18px;line-height:1.6">La página que buscas no existe o el chollo ha caducado. Los chollos duran poco: estos son los caminos más cortos para encontrar uno vivo.</p>'
             '<form action="/buscar/" method="get" role="search" style="display:flex;gap:8px;max-width:520px;margin:22px auto"><input type="search" name="q" placeholder="Busca un destino: Roma, Tokio, Bali…" aria-label="Buscar" '
             'style="flex:1;min-height:52px;border-radius:14px;border:1.5px solid #EADCC4;background:#fff;padding:0 16px;font:16px Inter,sans-serif;color:#14213D"><button class="hlc-btn" type="submit" style="min-height:52px">Buscar</button></form>'
             '<p style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center"><a class="hlc-btn" href="/chollos/">Ver los chollos de hoy</a><a class="hlc-btn o" href="/alertas/">Crear alerta gratis</a></p>'
             '<p style="margin-top:22px;color:#4A5468"><a href="/chollos/desde/espana/">Chollos desde España</a> · <a href="/vuelos/">Rutas de vuelos</a> · <a href="/destinos/">Destinos y guías</a> · <a href="/blog/">Blog</a> · <a href="/en/">English</a></p>'
             '</div></main></body></html>')
    open('404.html', 'w', encoding='utf-8').write(p404)

    # ---------- /publicidad/: artículos patrocinados y colaboraciones ----------
    purl = f'{SITE}/publicidad/'
    pg = G.head(title='Publicidad y artículos patrocinados · Happy Low Cost', desc='Llega a viajeros que buscan vuelos baratos: artículos patrocinados desde 200 €, publicaciones en nuestra página de Facebook (420.000 seguidores) y menciones en las alertas.',
                canonical=purl, og_type='website', og_image=f'{SITE}/hlc/brand/og-default.jpg', extra_head='<link rel="stylesheet" href="/hlc/home.css?v=12">', body_class='legal')
    pg += ('<main class="sec" style="padding-top:26px"><div class="wrap" style="max-width:820px"><div class="kicker">Para marcas y agencias</div><h1 class="x-h1">Publicidad en Happy Low Cost</h1>'
           '<p style="font-size:18px;line-height:1.6">Happy Low Cost publica chollos de vuelos verificados desde 2012. Nos siguen más de 420.000 viajeros en Facebook y la web está en español e inglés. Si tu marca ayuda a viajar mejor o más barato, aquí puedes llegar a ellos.</p>'
           '<article class="txt guide">'
           '<h2>Artículo patrocinado</h2><p>Un artículo sobre tu destino, producto o servicio, publicado en el blog y enlazado desde la portada del blog. Desde 200 €; el precio depende de lo que necesites (redacción, enlaces, permanencia). Siempre va marcado como contenido patrocinado.</p>'
           '<h2>Publicación en Facebook</h2><p>Una publicación en la página de Happy Low Cost para sus 420.000 seguidores, sola o junto al artículo. Precio según formato y fechas.</p>'
           '<h2>Mención en las alertas</h2><p>Tu oferta junto a los chollos que enviamos a quienes tienen una alerta activa. Precio según fechas.</p>'
           '<h2>Qué no hacemos</h2><p>No publicamos precios que no hayamos podido comprobar, ni contenido patrocinado sin marcarlo como tal. Tampoco apuestas, créditos rápidos ni nada que no tenga que ver con viajar.</p>'
           '</article><p style="margin-top:24px"><a class="hlc-btn" href="/contacto/">Pedir tarifas</a></p></div></main></body></html>')
    os.makedirs('publicidad', exist_ok=True)
    open('publicidad/index.html', 'w', encoding='utf-8').write(pg)

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
(function(){var K='ANONKEY',U='https://gmdalfsvtfhzepyrdmjj.supabase.co/rest/v1/rpc/hlc_panel';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function key(){var k='';try{k=localStorage.getItem('hlc_panel_k')||'';}catch(e){}if(!k){k=prompt('Clave del panel')||'';}return k;}
function load(){var k=key();if(!k)return;fetch(U,{method:'POST',headers:{apikey:K,'content-type':'application/json'},body:JSON.stringify({p:k})}).then(function(r){if(!r.ok)throw new Error('clave');return r.json();}).then(function(d){try{localStorage.setItem('hlc_panel_k',k);}catch(e){}
document.querySelector('#t tbody').innerHTML=(d.semanal||[]).map(function(r){return '<tr><td>'+esc(r.semana)+'</td><td>'+r.alertas+'</td><td>'+r.alertas_email+'</td><td>'+r.alertas_whatsapp+'</td><td>'+r.alertas_push+'</td><td>'+r.push_enviados+'</td><td>'+r.chollos_publicados+'</td><td>'+r.retirados_revalidacion+'</td><td>'+r.clics_vuelo+'</td><td>'+r.clics_hotel+'</td><td>'+r.clics_total+'</td></tr>';}).join('');
document.querySelector('#top tbody').innerHTML=(d.top||[]).map(function(r){return '<tr><td><a href="/chollos/'+esc(r.slug)+'/">'+esc(r.slug)+'</a></td><td>'+r.clics_vuelo+'</td><td>'+r.clics_hotel+'</td><td>'+r.total+'</td></tr>';}).join('')||'<tr><td colspan="4">Aún no hay clics registrados.</td></tr>';
}).catch(function(){try{localStorage.removeItem('hlc_panel_k');}catch(e){}document.querySelector('#t tbody').innerHTML='<tr><td colspan="11">Clave incorrecta. <a href="">Probar otra vez</a></td></tr>';});}
load();
})();
</script>
<h2 style="margin-top:40px">Vídeos de viajeros por revisar</h2>
<p style="color:#4A5468">Nada se publica sin tu OK. Aprobar pasa el vídeo a la web (/videos/ y la guía del destino); rechazar lo borra. <span id="vq"></span></p>
<div id="vids" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px"></div>
<script>
(function(){var V='https://gmdalfsvtfhzepyrdmjj.supabase.co/functions/v1/hlc-videos';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function k(){try{return localStorage.getItem('hlc_panel_k')||'';}catch(e){return '';}}
function call(b){b.pass=k();return fetch(V,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)}).then(function(r){return r.json();});}
function card(v){var media=v.kind==='file'?(v.preview||v.public_url?'<video src="'+esc(v.preview||v.public_url)+'" controls preload="metadata" style="width:100%;max-height:360px;background:#000;border-radius:10px"></video>':'(archivo no disponible)'):'<a href="'+esc(v.url)+'" target="_blank" rel="noopener">▶ Abrir en '+esc(v.platform)+'</a>';
return '<div style="background:#fff;border:1px solid #EADCC4;border-radius:14px;padding:12px" data-id="'+v.id+'">'+media+'<p style="margin:8px 0 4px"><b>📍 '+esc(v.dest)+'</b> · '+esc(v.status==='approved'?'publicado':'pendiente')+(v.size?' · '+Math.round(v.size/1048576*10)/10+' MB':'')+'</p><p style="margin:0 0 6px">'+esc(v.caption||'')+'</p><small>'+esc(v.handle||'')+' '+esc(v.email||'')+' · '+esc((v.created_at||'').slice(0,16).replace('T',' '))+'</small><div style="display:flex;gap:8px;margin-top:10px">'+(v.status!=='approved'?'<button class="hlc-btn" data-a="approve">Aprobar</button>':'')+'<button class="hlc-btn o" data-a="reject">'+(v.status==='approved'?'Retirar':'Rechazar')+'</button></div></div>';}
function load(){if(!k())return;call({action:'admin_list'}).then(function(j){if(j.error){document.getElementById('vids').textContent=j.error;return;}document.getElementById('vq').textContent='Almacén usado: '+j.used_mb+' de '+j.max_mb+' MB.';document.getElementById('vids').innerHTML=(j.videos||[]).map(card).join('')||'<p>No hay vídeos.</p>';});}
document.getElementById('vids').addEventListener('click',function(e){var b=e.target.closest('[data-a]');if(!b)return;var c=b.closest('[data-id]');b.disabled=true;call({action:b.getAttribute('data-a'),id:c.getAttribute('data-id')}).then(function(j){if(j.ok)load();else{b.disabled=false;c.insertAdjacentHTML('beforeend','<p style="color:#D63B1C">'+esc(j.error||'error')+'</p>');}});});
setTimeout(load,800);})();
</script></div></main></body></html>'''.replace('ANONKEY', ANON_KEY)
    os.makedirs('panel', exist_ok=True)
    open('panel/index.html', 'w', encoding='utf-8').write(ph)
    pg = G.head(title='Sin conexión · Happy Low Cost', desc='Sin conexión.', canonical=f'{SITE}/offline/', robots='noindex, nofollow', og_type='website', og_image=f'{SITE}/hlc/brand/og-default.jpg', body_class='offline')
    pg += ('<main class="sec"><div class="wrap" style="max-width:640px;text-align:center"><h1 class="x-h1">Sin conexión</h1><p style="font-size:18px">No hay internet ahora mismo. '
           'Los chollos que ya abriste siguen guardados en este móvil; vuelve a intentarlo en un momento para ver los de hoy.</p><p><a class="hlc-btn" href="/chollos/">Reintentar</a></p></div></main></body></html>')
    os.makedirs('offline', exist_ok=True)
    open('offline/index.html', 'w', encoding='utf-8').write(pg)
    seo_pages()
    tools_pages()
    extra_pages()
    videos_pages()
    alerts_pages()
    import gen_blog
    gen_blog.main()
    pages = ['/videos/', '/en/videos/', '/en/alerts/', '/como-verificamos/', '/herramientas/', '/herramientas/equipaje/', '/herramientas/es-buen-precio/', '/alertas/', '/destinos/', '/vuelos/',
             '/hoteles/', '/en/hotels/', '/aviso-legal-datos-cookies/', '/publicidad/', '/contacto/', '/en/contact/', '/blog/', '/guias/errores-de-tarifa/', '/en/guides/error-fares/', '/en/how-we-verify/', '/en/legal/', '/en/tools/', '/en/tools/baggage/', '/en/tools/is-it-a-good-price/', '/glosario/', '/en/glossary/', '/sobre-happy-low-cost/', '/en/about/']
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
