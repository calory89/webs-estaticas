#!/usr/bin/env python3
"""Genera la portada nueva, /alertas/ y /chollos/ (cáscara) de Happy Low Cost. Uso: python3 build_pages.py <raiz_rama> <dir_partials>"""
import os, re, sys, json, subprocess, html
from urllib.parse import quote

ROOT, P = sys.argv[1], sys.argv[2]
os.chdir(ROOT)
part = lambda n: open(os.path.join(P, n), encoding='utf-8').read()
HEAD, ALERT = part('head.html'), part('alert-form.html')
CJ = lambda aid, u: f'https://www.kqzyfj.com/click-101900924-{aid}?sid=happylowcost&amp;url=' + quote(u, safe='')
R = 'target="_blank" rel="sponsored nofollow noopener"'
CR = json.load(open('hlc/img/cities/credits.json', encoding='utf-8'))

def head(**k):
    d = dict(robots='index, follow, max-image-preview:large', og_type='website', og_alt='Happy Low Cost', extra_head='', body_class='', og_image='https://www.happylowcost.com/hlc/brand/og-default.jpg')
    d.update(k); d.setdefault('og_title', d['title'])
    h = HEAD
    for key, v in d.items():
        h = h.replace('{' + key + '}', v)
    return h

def credit(slug):
    c = CR.get(slug, {})
    return html.escape(f"{c.get('author') or 'Wikimedia Commons'} · {c.get('license','')}")

# ---------- artículos recientes del blog (de la portada antigua) ----------
old = subprocess.run(['git', 'show', '22d7c41a:index.html'], capture_output=True).stdout.decode('utf-8', 'ignore') or open('index.html', encoding='utf-8').read()
posts = []
for m in re.finditer(r'data-bgset="([^"]+)"[^>]*href="(https://www\.happylowcost\.com/[^"]+)"[^>]*title="([^"]+)"', old):
    img, url, title = m.groups()
    if 'sumba' in url: continue
    loc = re.sub(r'^(https?://(www\.)?happylowcost\.com)?/', '', img).split('?')[0]
    if not os.path.exists(loc):
        alt = re.sub(r'-\d+x\d+(\.\w+)$', r'\1', loc)
        if not os.path.exists(alt): continue
        img = '/' + alt
    posts.append((img, url.replace('https://www.happylowcost.com', ''), html.unescape(title)))
posts = posts[:8]

home_extra = '<link rel="alternate" hreflang="es" href="https://www.happylowcost.com/"><link rel="alternate" hreflang="en" href="https://www.happylowcost.com/en/"><link rel="alternate" hreflang="x-default" href="https://www.happylowcost.com/"><link rel="stylesheet" href="/hlc/home.css?v=12"><link rel="preload" as="image" href="/hlc/img/cities/lisboa.jpg">' + \
 '<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@graph": [
   {"@type": "Organization", "@id": "https://www.happylowcost.com/#org", "name": "Happy Low Cost", "url": "https://www.happylowcost.com/", "foundingDate": "2012", "logo": "https://www.happylowcost.com/hlc/brand/icon-512.png", "slogan": "Cazamos los vuelos más baratos del mundo", "sameAs": ["https://www.facebook.com/happylowcostofficialpage/", "https://www.instagram.com/happylowcost/", "https://twitter.com/happylowcost"], "contactPoint": {"@type": "ContactPoint", "contactType": "customer support", "email": "carlos@equinoxinvestmentgroup.com", "availableLanguage": ["es", "en"]}, "publishingPrinciples": "https://www.happylowcost.com/como-verificamos/"},
   {"@type": "WebSite", "@id": "https://www.happylowcost.com/#web", "url": "https://www.happylowcost.com/", "name": "Happy Low Cost", "inLanguage": "es-ES", "publisher": {"@id": "https://www.happylowcost.com/#org"}, "potentialAction": {"@type": "SearchAction", "target": {"@type": "EntryPoint", "urlTemplate": "https://www.happylowcost.com/buscar/?q={search_term_string}"}, "query-input": "required name=search_term_string"}}]}, ensure_ascii=False) + '</script>'

HERO_IMGS = ['lisboa', 'maldivas', 'nueva-york', 'bali', 'tokio', 'paris']
hero_imgs = ''.join(f'<div class="hero-img{" on" if i == 0 else ""}" data-hero-img style="background-image:url(/hlc/img/cities/{s}.jpg)" role="img" aria-label="{s.replace("-", " ").title()}"></div>' for i, s in enumerate(HERO_IMGS))
ORIG = ['Madrid', 'Barcelona', 'Málaga', 'Valencia', 'Sevilla', 'Bilbao', 'Canarias']
chips = ''.join(f'<button type="button" class="chip" data-origin="{o}" aria-pressed="false">{o}</button>' for o in ORIG)

STEPS = [
 ('lisboa', '01 · DESPEGA', 'Elige desde dónde vuelas', 'Madrid, Barcelona, Málaga, Valencia, Bilbao o Canarias. Te enseñamos primero lo que sale desde tu aeropuerto.', ('Ver chollos de hoy', '/chollos/', '')),
 ('maldivas', '02 · CAZAMOS', 'Rastreamos los errores de tarifa', 'Vigilamos aerolíneas y webs de chollos de todo el mundo, 24 horas al día. Cuando una tarifa se desploma, saltamos.', None),
 ('nueva-york', '03 · VERIFICAMOS', 'Comprobamos el precio antes de publicarlo', 'Solo publicamos si el precio sigue ahí en ese momento, con las fechas exactas, y te decimos a qué hora lo comprobamos.', None),
 ('bali', '04 · RESERVA', 'Vuelo + hotel en dos clics', 'Te llevamos directo a las fechas encontradas y a hoteles con buena nota en tu destino. Sin dar vueltas.', ('Buscar hoteles', CJ('17288959', 'https://www.booking.com/index.es.html'), R)),
 ('tokio', '05 · DISFRUTA', 'Y vuelve con la cartera feliz', 'Más de 400.000 viajeros ya viajan así. Cuéntanos tu viaje en Facebook y ayuda al siguiente.', ('Síguenos en Facebook', 'https://www.facebook.com/happylowcostofficialpage/', 'target="_blank" rel="noopener"')),
]
steps = ''
for s, n, h, p, cta in STEPS:
    btn = f'<a class="hlc-btn s" href="{cta[1]}" {cta[2]}>{cta[0]}</a>' if cta else ''
    steps += f'<div class="step reveal"><div class="step-img" style="background-image:url(/hlc/img/cities/{s}-800.jpg)" role="img" aria-label="{s.replace("-", " ").title()}"></div><div><div class="step-n">{n}</div><h3>{h}</h3><p>{p}</p>{btn}</div></div>'

DEST = [('maldivas', 'Maldivas', 'Playas de postal', True), ('nueva-york', 'Nueva York', 'La ciudad que nunca duerme', False), ('marrakech', 'Marrakech', 'A 1 h 30 de Madrid', False),
        ('bangkok', 'Bangkok', 'Asia sin arruinarte', False), ('roma', 'Roma', 'Escapada de finde', False), ('punta-cana', 'Punta Cana', 'Caribe todo incluido', True),
        ('estambul', 'Estambul', 'Entre dos continentes', False), ('budapest', 'Budapest', 'Perla del Danubio', False), ('amsterdam', 'Ámsterdam', 'Canales y bicis', False), ('tenerife', 'Tenerife', 'Sol todo el año', False)]
dest = ''.join(f'<a class="reveal{" big" if big else ""}" href="{CJ("17288959", "https://www.booking.com/searchresults.es.html?ss=" + name)}" {R} style="background-image:url(/hlc/img/cities/{s}{"" if big else "-800"}.jpg)"><span>{name}<small>{sub} · ver hoteles</small></span></a>' for s, name, sub, big in DEST)

DJ = json.load(open('hlc/destinos.json', encoding='utf-8'))
DJ = [p for p in DJ if not p.get('auto') or p.get('g')]  # el mapa solo enseña destinos con guía o de la biblioteca curada
def map_block(full=False):
    orig = '<optgroup label="España">' + ''.join(f'<option>{c}</option>' for c in ['Madrid', 'Barcelona', 'Málaga', 'Valencia', 'Sevilla', 'Bilbao', 'Alicante', 'Canarias', 'Palma']) + '</optgroup><optgroup label="Europa">' + ''.join(f'<option>{c}</option>' for c in ['Lisboa', 'Oporto', 'Londres', 'París', 'Ámsterdam', 'Berlín', 'Roma', 'Milán', 'Dublín', 'Copenhague']) + '</optgroup><optgroup label="Resto del mundo">' + ''.join(f'<option>{c}</option>' for c in ['Nueva York', 'Miami', 'Los Ángeles', 'Ciudad de México', 'Bogotá', 'Buenos Aires', 'Dubái', 'Singapur', 'Sídney']) + '</optgroup>'
    regs = ''.join(f'<button type="button" data-region="{r}" aria-pressed="false">{n}</button>' for r, n in [('mundo', 'Mundo'), ('europa', 'Europa'), ('mediterraneo', 'Mediterráneo'), ('america', 'América'), ('asia', 'Asia'), ('africa', 'África'), ('oceania', 'Oceanía')])
    fl = ''.join(f'<button type="button" class="chip" data-f="{f}" aria-pressed="{str(f == "todos").lower()}">{n}</button>' for f, n in [('todos', 'Todos'), ('deal', '🔥 Con chollo hoy'), ('mine', '✈️ Desde mi ciudad'), ('europa', 'Europa'), ('america', 'América'), ('asia', 'Asia'), ('africa', 'África'), ('oceania', 'Oceanía'), ('playa', '🏝️ Playa'), ('ciudad', '🏙️ Ciudad'), ('naturaleza', '⛰️ Naturaleza')])
    cards = ''.join(f'<button type="button" class="mx-cd" data-s="{d["s"]}"><span class="mx-cd-ph" data-bg="/hlc/img/cities/{d["s"]}-800.jpg" style="background:#EADCC4"></span><b>{html.escape(d["n"])}</b><small>{html.escape(d["c"])}</small></button>' for d in DJ)
    return (f'<div class="mapx{" mapx-full" if full else ""} reveal" data-hlc-map>'
            f'<div class="mapx-top"><label class="mapx-o">✈️ Desde <select data-map-origin aria-label="Ciudad de salida">{orig}</select></label><div class="mapx-reg" role="group" aria-label="Zona del mapa">{regs}</div></div>'
            f'<svg class="mapx-svg" role="img" aria-label="Mapa de destinos de Happy Low Cost"></svg>'
            f'<div class="mapx-zoom"><button type="button" data-zoom="1" aria-label="Acercar">+</button><button type="button" data-zoom="-1" aria-label="Alejar">−</button></div>'
            f'<div class="mapx-hint" data-map-count>{len(DJ)} destinos</div>'
            f'<div class="mapx-card" hidden aria-live="polite"></div>'
            f'<div class="mapx-load"><span class="sk" aria-hidden="true"></span><span class="hlc-sr">Cargando el mapa</span></div></div>'
            f'<div class="chips mapx-f" data-map-filters role="group" aria-label="Filtrar destinos">{fl}</div>'
            f'<div class="mapx-strip" data-map-strip>{cards}</div>'
            '<script src="/hlc/map.js?v=6" defer></script>')
MAP = map_block()
TABS = '<button type="button" class="chip" data-tab="" aria-pressed="true">🌐 Todo <small></small></button>' + ''.join(f'<button type="button" class="chip" data-tab="{k}" aria-pressed="false">{em} {n} <small></small></button>' for k, em, n in [('europa', '🇪🇺', 'Europa'), ('asia', '🌏', 'Asia'), ('norteamerica', '🗽', 'Norteamérica'), ('caribe', '🏝️', 'Caribe'), ('sudamerica', '🌎', 'Sudamérica'), ('africa', '🌍', 'África'), ('oceania', '🦘', 'Oceanía'), ('oriente-medio', '🕌', 'Oriente Medio')])

blog = ''.join(f'<a class="reveal" href="{u}"><div style="background-image:url({i})"></div><span>{html.escape(t)}</span></a>' for i, u, t in posts)

PAST = [  # chollos reales que ya publicamos (enlazan al post original)
 ('nueva-york', 'Madrid → Nueva York', '97 €', 'ida y vuelta · publicado en 2020 · vuelos en mayo 2021', '/vuelos-a-nueva-york-por-solo-97e-ida-y-vuelta-desde-madrid-en-mayo-2021/'),
 ('maldivas', 'España → Maldivas', '307 €', 'ida y vuelta · 2022', '/mas-barato-que-nunca-vuelos-a-islas-maldivas-por-solo-307e-i-v/'),
 ('reikiavik', 'España → Islandia', '136 €', 'ida y vuelta · directo · 2022', '/vuelos-directos-a-islandia-desde-solo-136e-i-v/'),
 ('tokio', 'España → Tokio', '387 €', 'ida y vuelta · 2020', '/ganga-vuelos-a-tokio-desde-solo-387e-i-v-en-septiembre/'),
 ('miami', 'España → Miami', '167 €', 'ida y vuelta · 2020', '/vuelos-a-miami-por-solo-167e-ida-y-vuelta/'),
 ('santorini', 'España → Santorini', '97 €', 'ida y vuelta · directo · 2023', '/vuelos-directos-a-santorini-en-julio-por-solo-97e-i-v/'),
 ('bali', 'España → Bali', '420 €', 'ida y vuelta · 2020', '/chollo-vuelos-baratos-a-bali-desde-solo-420e-i-v/'),
 ('san-francisco', 'España → San Francisco', '317 €', 'ida y vuelta · directo · 2021', '/chollo-vuelos-directos-a-san-francisco-por-317e-i-v/'),
 ('ciudad-del-cabo', 'España → Sudáfrica', '311 €', 'ida y vuelta · 2022', '/chollo-vuelos-a-sudafrica-por-solo-311e-i-v/'),
 ('punta-cana', 'España → Punta Cana', '351 €', 'ida y vuelta · 2021', '/wow-viajamos-a-punta-cana-vuelos-por-350e-i-v/'),
 ('bangkok', 'España → Tailandia', '350 €', 'ida y vuelta · 2021', '/vuelos-a-tailandia-por-solo-350e-i-v/'),
 ('ciudad-de-mexico', 'España → México', '370 €', 'ida y vuelta · directo · 2020', '/viva-mexico-vuelos-directos-por-solo-370e-i-v-en-octubre/'),
]
past_html = ''.join(f'<a class="pw" href="{u or "/chollos/"}"><span class="pw-ph" style="background-image:url(/hlc/img/cities/{sl}-800.jpg)"></span><span class="pw-b"><b>{r}</b><em>{pr}</em><small>{d}</small></span></a>' for sl, r, pr, d, u in PAST)
AIRPORTS = '<optgroup label="España">' + ''.join(f'<option>{c}</option>' for c in ['Madrid', 'Barcelona', 'Málaga', 'Valencia', 'Sevilla', 'Bilbao', 'Alicante', 'Canarias', 'Palma', 'Santiago', 'Zaragoza', 'Ibiza']) + '</optgroup><optgroup label="Resto del mundo">' + ''.join(f'<option>{c}</option>' for c in ['Lisboa', 'Londres', 'París', 'Ámsterdam', 'Berlín', 'Roma', 'Dublín', 'Copenhague', 'Nueva York', 'Miami', 'Los Ángeles', 'Ciudad de México', 'Bogotá', 'Buenos Aires', 'Dubái', 'Singapur', 'Sídney']) + '</optgroup>'
def quick_form(idx):
    return f"""<form class="qf" data-hlc-quick novalidate>
<div class="qf-row"><label class="qf-sel"><span>Vuelo desde</span><select name="origin" aria-label="Tu aeropuerto">{AIRPORTS}</select></label>
<label class="qf-in"><span>Te aviso en</span><input name="contact" type="text" inputmode="email" autocomplete="email" placeholder="tu email o tu WhatsApp" aria-label="Email o WhatsApp" required></label>
<button type="submit" class="hlc-btn qf-go">Avisarme gratis</button></div>
<label class="qf-ok"><input type="checkbox" name="consent" required> Acepto recibir chollos de Happy Low Cost (máx. uno al día) y la <a href="/aviso-legal-datos-cookies/">privacidad</a>.</label>
<div class="qf-msg" data-msg role="status" aria-live="polite"></div></form>"""

_IDEAS = [('fin-de-semana', '🧳 Escapadas de fin de semana'), ('menos-de-50-euros', '💶 Menos de 50 €'), ('menos-de-100-euros', '💶 Menos de 100 €'), ('larga-distancia', '🌏 Larga distancia'),
          ('directos', '✈️ Solo directos'), ('puente-diciembre-2026', '🗓️ Puente de diciembre'), ('navidad-2026', '🎄 Navidad 2026'), ('semana-santa-2027', '🌸 Semana Santa 2027')]
IDEAS_CHIPS = ''.join(f'<a class="chip" href="/chollos/ideas/{k}/">{n}</a>' for k, n in _IDEAS) + '<a class="chip" href="/herramientas/">🧰 Herramientas</a>'
home = head(title='Happy Low Cost · Vuelos a mitad de precio desde tu aeropuerto',
            desc='Cazamos errores de tarifa y vuelos baratos desde tu aeropuerto y te avisamos gratis por email o WhatsApp. Más de 420.000 viajeros desde 2012.',
            canonical='https://www.happylowcost.com/', extra_head=home_extra, body_class='home home2')
home += f"""
<main>
<section class="h2-hero"><div class="wrap h2-grid">
<div>
<div class="h2-proof"><b>Más de 420.000 viajeros</b> nos siguen desde 2012</div>
<h1>Vuelos a <em>mitad de precio</em>, directos a tu móvil.</h1>
<p class="h2-lead">Vigilamos aerolíneas de todo el mundo, comprobamos cada precio y te avisamos cuando sale un chollo desde tu aeropuerto. Gratis.</p>
{quick_form(1)}
</div>
<div class="h2-phone" aria-hidden="true"><div class="h2-screen"><div class="h2-notif"><b>Happy Low Cost</b><span>ahora</span></div><!--ssr-hero--><div class="h2-deal" data-hlc-hero-deal><div class="h2-skel"></div></div><div class="h2-deal h2-deal2" data-hlc-hero-deal2></div><!--/ssr-hero--></div></div>
</div></section>

<section class="sec h2-sec" id="hoy"><div class="wrap">
<div class="h2-h"><h2>Así son los chollos de hoy</h2><p><!--ssr-count-->Precio habitual de la ruta frente al precio que hemos cazado.<!--/ssr-count--></p></div>
<div class="dc-grid h2-deals" id="hoy-grid" data-hlc-deals data-filter data-max="6" data-savings><!--ssr-deals--><div class="dc-empty"><b>Cargando chollos…</b></div><!--/ssr-deals--></div>
<div class="h2-more"><a class="hlc-btn o" href="/chollos/">Ver todos los chollos y filtrar</a></div>
<div class="h2-h" style="margin-top:34px"><h2>Ideas para viajar barato</h2></div>
<div class="chips" style="flex-wrap:wrap">{IDEAS_CHIPS}</div>
</div></section>

<section class="sec h2-sec h2-how"><div class="wrap">
<div class="h2-h"><h2>Cómo funciona</h2></div>
<ol class="h2-steps">
<li><b>1</b><h3>Dinos tu aeropuerto</h3><p>Y si prefieres email o WhatsApp.</p></li>
<li><b>2</b><h3>Cazamos y comprobamos</h3><p>Errores de tarifa y ofertas relámpago, verificados antes de publicarlos.</p></li>
<li><b>3</b><h3>Te avisamos y reservas</h3><p>Con las fechas exactas. Tú solo haces la maleta.</p></li>
</ol>
</div></section>

<section class="sec h2-sec h2-wall"><div class="wrap">
<div class="h2-big"><b>420.000+</b><span>viajeros nos siguen desde 2012</span></div>
<div class="h2-h"><h2>Chollos que ya cazamos</h2><p>Una muestra de lo que hemos publicado estos años. Ya caducaron, pero cada día cazamos chollos nuevos.</p></div>
<div class="pw-grid">{past_html}</div>
<div class="h2-cta2"><h3>Que el próximo no se te escape.</h3>{quick_form(2)}</div>
</div></section>

<section class="sec mapx-sec" id="destinos"><div class="wrap">
<div class="h2-h"><h2>¿A dónde te escapas?</h2><p>Toca un destino: ruta desde tu ciudad, vuelos, hoteles y si hay chollo hoy.</p></div>
{MAP}
</div></section>

</main>
</body>
</html>"""
open('index.html', 'w', encoding='utf-8').write(home)

# ---------- /destinos/ ----------
os.makedirs('destinos', exist_ok=True)
dp = head(title='Mapa de destinos y chollos de vuelos desde España · Happy Low Cost', desc=f'Explora {len(DJ)} destinos en un mapa interactivo: ruta desde tu ciudad, vuelos, hoteles y los chollos de hoy verificados.',
          canonical='https://www.happylowcost.com/destinos/', extra_head='<link rel="alternate" hreflang="es" href="https://www.happylowcost.com/destinos/"><link rel="alternate" hreflang="en" href="https://www.happylowcost.com/en/destinations/"><link rel="stylesheet" href="/hlc/home.css?v=12">', body_class='destinos')
dp += f'''<main class="sec" style="padding-top:28px"><div class="wrap">
<div class="sec-h"><div><div class="kicker">El mapa de los chollos</div><h1 style="font:800 clamp(36px,5vw,60px)/.98 'Bricolage Grotesque',sans-serif;letter-spacing:-.03em;margin:8px 0 0">¿A dónde te escapas?</h1><p>Elige desde dónde vuelas y toca un destino: ruta, vuelos, hoteles y chollos de hoy.</p></div></div>
{map_block(True)}
</div></main></body></html>'''
open('destinos/index.html', 'w', encoding='utf-8').write(dp)

# ---------- /chollos/ver/ (chollo recién cazado, antes de tener página propia) ----------
os.makedirs('chollos/ver', exist_ok=True)
vp = head(title='Chollo de vuelo verificado · Happy Low Cost', desc='Chollo de vuelo desde España comprobado hoy por Happy Low Cost.', robots='noindex, follow',
          canonical='https://www.happylowcost.com/chollos/', extra_head='<link rel="stylesheet" href="/hlc/home.css?v=12">', body_class='deal')
vp += '''<main data-ver><section class="deal-hero" data-v-hero><div class="wrap"><div class="kicker" style="color:#FFC531">✓ Chollo verificado</div><h1 data-v-t>Cargando el chollo…</h1>
<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-top:18px"><a class="price-tag" data-v-p data-v-f3 rel="sponsored nofollow noopener" target="_blank" href="/chollos/"></a><a class="hlc-btn" data-v-f rel="sponsored nofollow noopener" target="_blank" href="/chollos/">Ver vuelo y fechas ✈️</a></div></div></section>
<div class="wrap deal-body"><div class="txt" data-v-b></div><aside class="deal-card"><div class="facts" data-v-facts></div><a class="hlc-btn" data-v-f2 rel="sponsored nofollow noopener" target="_blank" href="/chollos/">✈️ Ver vuelo</a><a class="hlc-btn t" data-v-h rel="sponsored nofollow noopener" target="_blank" href="/chollos/">🏨 Hoteles</a><a class="hlc-btn o" href="/alertas/">🔔 Crear alerta</a></aside></div></main>
<script>
(function(){var s=new URLSearchParams(location.search).get('s');var $=function(q){return document.querySelector(q);};
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function go(){if(!window.HLC_feed){return setTimeout(go,80);}window.HLC_feed().then(function(l){var x=(l||[]).filter(function(y){return y.slug===s;})[0];
if(!x){location.replace('/chollos/');return;}var f=x.facts||{};document.title=(x.title||'Chollo')+' · Happy Low Cost';
$('[data-v-t]').textContent=x.title||(f.origen+' → '+f.destino);$('[data-v-p]').innerHTML=esc(x.price)+' € <small>'+esc(f.tipo||'')+'</small>';
['[data-v-f]','[data-v-f2]','[data-v-f3]'].forEach(function(q){$(q).href=x.cta_flight;});$('[data-v-h]').href=(function(u){try{if(!f.ida||!/booking/.test(decodeURIComponent(u)))return u;var co=f.vuelta&&f.vuelta>f.ida?f.vuelta:new Date(Date.parse(f.ida)+3*864e5).toISOString().slice(0,10);var q='checkin='+f.ida.slice(0,10)+'&checkout='+co.slice(0,10)+'&group_adults=2&no_rooms=1&group_children=0';u=window.HLC_bk?window.HLC_bk(u):u;var m=u.match(/^(.*?url=)([^&]+)(.*)$/);if(m){var i=decodeURIComponent(m[2]);return m[1]+encodeURIComponent(i+(i.indexOf('?')>0?'&':'?')+q)+m[3];}return u+(u.indexOf('?')>0?'&':'?')+q;}catch(e){return u;}})(x.cta_hotel);$('[data-v-h]').textContent='🏨 Hoteles en '+(f.destino||'');
var ph=window.HLC_photo(f.destino);if(ph)$('[data-v-hero]').style.backgroundImage='url('+ph.replace('-800','')+')';
var b=String(x.body_html||'').replace(/<(?!\\/?p>)[^>]*>/g,'');$('[data-v-b]').innerHTML=b;
fetch('https://gmdalfsvtfhzepyrdmjj.supabase.co/functions/v1/hlc-deals?action=feed&full=1').then(function(r){return r.json();}).then(function(l2){var z=(l2||[]).filter(function(y){return y.slug===s;})[0];if(!z||!z.guide_html)return;var g=String(z.guide_html).replace(/<(?!\\/?(h2|h3|p|ul|li|strong)\\b)[^>]*>/gi,'');var sec=document.createElement('section');sec.className='guide';sec.innerHTML='<div class="kicker">Guía del destino</div><h2 class="guide-h">'+esc(z.seo_title||('Qué ver en '+f.destino))+'</h2>'+g;$('[data-v-b]').appendChild(sec);}).catch(function(){});
$('[data-v-facts]').innerHTML=[['Desde',f.origen],['Destino',f.destino],['Precio',x.price+' €'],['Tipo',f.tipo],['Ida',f.ida],['Vuelta',f.vuelta||'—']].map(function(k){return '<div><small>'+k[0]+'</small><b>'+esc(k[1])+'</b></div>';}).join('');
});}go();})();
</script></body></html>'''
open('chollos/ver/index.html', 'w', encoding='utf-8').write(vp)

# ---------- /alertas/ ----------
os.makedirs('alertas', exist_ok=True)
al = head(title='Crea tu alerta de chollos de vuelos · Happy Low Cost', desc='Te avisamos gratis cuando encontremos un vuelo barato desde tu aeropuerto: en este navegador desde hoy, y por email o WhatsApp. Máximo un aviso al día.',
          canonical='https://www.happylowcost.com/alertas/', extra_head='<link rel="stylesheet" href="/hlc/home.css?v=12">', body_class='alertas')
al += f'''<main class="sec"><div class="alert-box" style="max-width:1180px;margin:0 auto">
<div><div class="kicker">Alertas gratis</div><h1 style="font:800 clamp(38px,5.6vw,64px)/.98 'Bricolage Grotesque',sans-serif;letter-spacing:-.03em;margin:10px 0 14px">Que el chollo te encuentre a ti.</h1><p>Elige tu aeropuerto, tu destino soñado y tu precio máximo. Cuando cacemos un vuelo que encaje, te avisamos. Sin spam: máximo un aviso al día y te das de baja con un clic.</p></div>
{ALERT}
</div></main></body></html>'''
open('alertas/index.html', 'w', encoding='utf-8').write(al)
print('ok', len(posts), 'posts')
