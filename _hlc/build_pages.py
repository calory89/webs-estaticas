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

home_extra = '<link rel="stylesheet" href="/hlc/home.css?v=6"><link rel="preload" as="image" href="/hlc/img/cities/lisboa.jpg">' + \
 '<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@graph": [
   {"@type": "Organization", "@id": "https://www.happylowcost.com/#org", "name": "Happy Low Cost", "url": "https://www.happylowcost.com/", "foundingDate": "2015", "logo": "https://www.happylowcost.com/hlc/brand/icon-512.png", "slogan": "Cazamos los vuelos más baratos del mundo", "sameAs": ["https://www.facebook.com/happylowcostofficialpage/", "https://www.instagram.com/happylowcost/", "https://twitter.com/happylowcost"]},
   {"@type": "WebSite", "@id": "https://www.happylowcost.com/#web", "url": "https://www.happylowcost.com/", "name": "Happy Low Cost", "inLanguage": "es-ES", "publisher": {"@id": "https://www.happylowcost.com/#org"}}]}, ensure_ascii=False) + '</script>'

HERO_IMGS = ['lisboa', 'maldivas', 'nueva-york', 'bali', 'tokio', 'paris']
hero_imgs = ''.join(f'<div class="hero-img{" on" if i == 0 else ""}" data-hero-img style="background-image:url(/hlc/img/cities/{s}.jpg)" role="img" aria-label="{s.replace("-", " ").title()}"></div>' for i, s in enumerate(HERO_IMGS))
ORIG = ['Madrid', 'Barcelona', 'Málaga', 'Valencia', 'Sevilla', 'Bilbao', 'Canarias']
chips = ''.join(f'<button type="button" class="chip" data-origin="{o}" aria-pressed="false">{o}</button>' for o in ORIG)

STEPS = [
 ('lisboa', '01 · DESPEGA', 'Elige desde dónde vuelas', 'Madrid, Barcelona, Málaga, Valencia, Bilbao o Canarias. Te enseñamos primero lo que sale desde tu aeropuerto.', ('Ver chollos de hoy', '/chollos/', '')),
 ('maldivas', '02 · CAZAMOS', 'Rastreamos los errores de tarifa', 'Vigilamos aerolíneas y webs de chollos de todo el mundo, 24 horas al día. Cuando una tarifa se desploma, saltamos.', None),
 ('nueva-york', '03 · VERIFICAMOS', 'Comprobamos el precio antes de publicarlo', 'Solo publicamos si el precio sigue ahí en ese momento, con las fechas exactas. Si mañana ya no está, lo quitamos.', None),
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
def map_block(full=False):
    orig = ''.join(f'<option>{c}</option>' for c in ['Madrid', 'Barcelona', 'Málaga', 'Valencia', 'Sevilla', 'Bilbao', 'Alicante', 'Canarias', 'Palma'])
    regs = ''.join(f'<button type="button" data-region="{r}" aria-pressed="false">{n}</button>' for r, n in [('europa', 'Europa'), ('mediterraneo', 'Mediterráneo'), ('america', 'América'), ('asia', 'Asia'), ('africa', 'África'), ('mundo', 'Mundo')])
    fl = ''.join(f'<button type="button" class="chip" data-f="{f}" aria-pressed="{str(f == "todos").lower()}">{n}</button>' for f, n in [('todos', 'Todos'), ('deal', '🔥 Con chollo hoy'), ('playa', '🏝️ Playa'), ('ciudad', '🏙️ Ciudad'), ('naturaleza', '⛰️ Naturaleza'), ('europa', 'Europa'), ('america', 'América'), ('asia', 'Asia'), ('africa', 'África')])
    cards = ''.join(f'<button type="button" class="mx-cd" data-s="{d["s"]}"><span class="mx-cd-ph" style="background-image:url(/hlc/img/cities/{d["s"]}-800.jpg)"></span><b>{html.escape(d["n"])}</b><small>{html.escape(d["c"])}</small></button>' for d in DJ)
    return (f'<div class="mapx{" mapx-full" if full else ""} reveal" data-hlc-map>'
            f'<div class="mapx-top"><label class="mapx-o">✈️ Desde <select data-map-origin aria-label="Ciudad de salida">{orig}</select></label><div class="mapx-reg" role="group" aria-label="Zona del mapa">{regs}</div></div>'
            f'<svg class="mapx-svg" role="img" aria-label="Mapa de destinos de Happy Low Cost"></svg>'
            f'<div class="mapx-zoom"><button type="button" data-zoom="1" aria-label="Acercar">+</button><button type="button" data-zoom="-1" aria-label="Alejar">−</button></div>'
            f'<div class="mapx-hint" data-map-count>{len(DJ)} destinos</div>'
            f'<div class="mapx-card" hidden aria-live="polite"></div>'
            f'<div class="mapx-load">Cargando el mapa…</div></div>'
            f'<div class="chips mapx-f" data-map-filters role="group" aria-label="Filtrar destinos">{fl}</div>'
            f'<div class="mapx-strip" data-map-strip>{cards}</div>'
            '<script src="/hlc/map.js?v=1" defer></script>')
MAP = map_block()

blog = ''.join(f'<a class="reveal" href="{u}"><div style="background-image:url({i})"></div><span>{html.escape(t)}</span></a>' for i, u, t in posts)

home = head(title='Happy Low Cost · Cazamos los vuelos más baratos del mundo',
            desc='Chollos de vuelos baratos y errores de tarifa desde España, verificados antes de publicarlos. Más de 400.000 viajeros nos siguen. Crea tu alerta gratis.',
            canonical='https://www.happylowcost.com/', extra_head=home_extra, body_class='home')
home += f'''
<main>
<section class="hero" aria-labelledby="h1">{hero_imgs}
<div class="hero-in">
<div class="kicker" style="color:#FFC531">Chollos de vuelos desde España · verificados</div>
<h1 id="h1">Cazamos los vuelos <em>más baratos</em> del mundo.</h1>
<svg class="smile" viewBox="0 0 250 46" aria-hidden="true"><path class="s" d="M8 8 Q120 58 214 14" fill="none" stroke="#FF5A36" stroke-width="7" stroke-linecap="round"/><g transform="translate(214 12) rotate(-24)"><path d="M-2 0 L22 -1 L26 0 L22 1 Z M8 -1 L2 -11 L6 -11 L15 -1 Z M8 1 L2 11 L6 11 L15 1 Z" fill="#FF5A36"/></g></svg>
<p class="lead">Errores de tarifa, vuelos low cost y escapadas imposibles. Los comprobamos antes de publicarlos; si mañana ya no están, los quitamos.</p>
<div><div style="font:600 14px Inter,sans-serif;color:#D6DCEA;margin-bottom:8px">¿Desde dónde vuelas?</div><div class="chips">{chips}</div></div>
<div class="hero-cta"><a class="hlc-btn" href="#hoy">Ver los chollos de hoy</a><a class="hlc-btn o" href="/alertas/">🔔 Crear alerta gratis</a></div>
<div class="hero-proof"><span><b>400.000+</b> viajeros en Facebook</span><span><b>Desde 2015</b> cazando chollos</span><span><b>100%</b> precios comprobados</span></div>
</div>
<div class="hero-credit">Fotos: Wikimedia Commons</div>
</section>

<section class="sec" id="hoy"><div class="wrap">
<div class="sec-h reveal"><div><div class="kicker">Recién cazados</div><h2>Los chollos de hoy</h2><p>Comprobados en el momento. Toca uno para ver las fechas y reservar.</p></div><a class="hlc-btn o" href="/chollos/">Ver todos</a></div>
<div class="dc-grid" data-hlc-deals data-filter data-max="8"><div class="dc-empty"><b>Cargando chollos…</b></div></div>
</div></section>

<section class="journey" data-journey aria-labelledby="jh">
<svg class="journey-path" viewBox="0 0 1000 1800" preserveAspectRatio="none" aria-hidden="true"><path data-journey-path d="M500 0 C 900 200, 100 420, 520 640 S 900 1050, 480 1260 S 100 1600, 520 1800" fill="none" stroke="rgba(255,197,49,.45)" stroke-width="3" stroke-dasharray="1 0" vector-effect="non-scaling-stroke"/><g data-journey-plane><path d="M-14 0 L14 -1 L18 0 L14 1 Z M2 -1 L-4 -12 L0 -12 L8 -1 Z M2 1 L-4 12 L0 12 L8 1 Z M-14 -1 L-18 -6 L-15 -6 L-10 -1 Z M-14 1 L-18 6 L-15 6 L-10 1 Z" fill="#FFC531"/></g></svg>
<div class="wrap" style="position:relative">
<div class="reveal"><div class="kicker">Así funciona</div><h2 id="jh" style="font:800 clamp(34px,5vw,60px)/1 'Bricolage Grotesque',sans-serif;letter-spacing:-.03em;margin:8px 0 0;max-width:760px">Tu próximo viaje empieza aquí. Y acaba en la playa.</h2></div>
<div class="steps">{steps}</div>
</div></section>

<section class="sec mapx-sec" id="destinos"><div class="wrap">
<div class="sec-h reveal"><div><div class="kicker">El mapa de los chollos</div><h2>¿A dónde te escapas?</h2><p>Toca un destino y te enseñamos la ruta desde tu ciudad, los vuelos, los hoteles y si hay chollo hoy.</p></div><a class="hlc-btn o" href="/destinos/">Mapa a pantalla completa</a></div>
{MAP}
</div></section>

<section class="sec" id="alertas" style="padding-top:20px"><div class="alert-box reveal">
<div><div class="kicker">Alertas gratis</div><h2>Que el chollo te encuentre a ti.</h2><p>Dinos desde dónde vuelas, a dónde sueñas ir y cuánto quieres pagar. Te avisamos por email o WhatsApp en cuanto lo cacemos. Máximo un aviso al día.</p></div>
{ALERT}
</div></section>

<section class="sec"><div class="wrap">
<div class="sec-h reveal"><div><div class="kicker">La comunidad</div><h2>400.000 viajeros felices</h2></div><a class="hlc-btn b" href="https://www.facebook.com/happylowcostofficialpage/" target="_blank" rel="noopener">Únete en Facebook</a></div>
<div class="fbproof"><div class="reveal"><b>400K+</b><span>seguidores en Facebook que reciben nuestros chollos cada día.</span></div><div class="reveal"><b>2015</b><span>el año en que empezamos a cazar errores de tarifa desde España.</span></div><div class="reveal"><b>24/7</b><span>vigilando precios para que tú solo tengas que hacer la maleta.</span></div></div>
</div></section>

<section class="sec" style="padding-top:0"><div class="wrap">
<div class="sec-h reveal"><div><div class="kicker">Del blog</div><h2>Ideas para tu próximo viaje</h2></div><a class="hlc-btn o" href="/guias-ciudades/">Todas las guías</a></div>
<div class="blog">{blog}</div>
</div></section>
</main>
</body>
</html>'''
open('index.html', 'w', encoding='utf-8').write(home)

# ---------- /destinos/ ----------
os.makedirs('destinos', exist_ok=True)
dp = head(title='Mapa de destinos y chollos de vuelos desde España · Happy Low Cost', desc=f'Explora {len(DJ)} destinos en un mapa interactivo: ruta desde tu ciudad, vuelos, hoteles y los chollos de hoy verificados.',
          canonical='https://www.happylowcost.com/destinos/', extra_head='<link rel="stylesheet" href="/hlc/home.css?v=6">', body_class='destinos')
dp += f'''<main class="sec" style="padding-top:28px"><div class="wrap">
<div class="sec-h"><div><div class="kicker">El mapa de los chollos</div><h1 style="font:800 clamp(36px,5vw,60px)/.98 'Bricolage Grotesque',sans-serif;letter-spacing:-.03em;margin:8px 0 0">¿A dónde te escapas?</h1><p>Elige desde dónde vuelas y toca un destino: ruta, vuelos, hoteles y chollos de hoy.</p></div></div>
{map_block(True)}
</div></main></body></html>'''
open('destinos/index.html', 'w', encoding='utf-8').write(dp)

# ---------- /chollos/ver/ (chollo recién cazado, antes de tener página propia) ----------
os.makedirs('chollos/ver', exist_ok=True)
vp = head(title='Chollo de vuelo verificado · Happy Low Cost', desc='Chollo de vuelo desde España comprobado hoy por Happy Low Cost.', robots='noindex, follow',
          canonical='https://www.happylowcost.com/chollos/', extra_head='<link rel="stylesheet" href="/hlc/home.css?v=6">', body_class='deal')
vp += '''<main data-ver><section class="deal-hero" data-v-hero><div class="wrap"><div class="kicker" style="color:#FFC531">✓ Chollo verificado</div><h1 data-v-t>Cargando el chollo…</h1>
<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-top:18px"><span class="price-tag" data-v-p></span><a class="hlc-btn" data-v-f rel="sponsored nofollow noopener" target="_blank" href="/chollos/">Ver vuelo y fechas ✈️</a></div></div></section>
<div class="wrap deal-body"><div class="txt" data-v-b></div><aside class="deal-card"><div class="facts" data-v-facts></div><a class="hlc-btn" data-v-f2 rel="sponsored nofollow noopener" target="_blank" href="/chollos/">✈️ Ver vuelo</a><a class="hlc-btn t" data-v-h rel="sponsored nofollow noopener" target="_blank" href="/chollos/">🏨 Hoteles</a><a class="hlc-btn o" href="/alertas/">🔔 Crear alerta</a></aside></div></main>
<script>
(function(){var s=new URLSearchParams(location.search).get('s');var $=function(q){return document.querySelector(q);};
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function go(){if(!window.HLC_feed){return setTimeout(go,80);}window.HLC_feed().then(function(l){var x=(l||[]).filter(function(y){return y.slug===s;})[0];
if(!x){location.replace('/chollos/');return;}var f=x.facts||{};document.title=(x.title||'Chollo')+' · Happy Low Cost';
$('[data-v-t]').textContent=x.title||(f.origen+' → '+f.destino);$('[data-v-p]').innerHTML=esc(x.price)+' € <small>'+esc(f.tipo||'')+'</small>';
['[data-v-f]','[data-v-f2]'].forEach(function(q){$(q).href=x.cta_flight;});$('[data-v-h]').href=x.cta_hotel;$('[data-v-h]').textContent='🏨 Hoteles en '+(f.destino||'');
var ph=window.HLC_photo(f.destino);if(ph)$('[data-v-hero]').style.backgroundImage='url('+ph.replace('-800','')+')';
var b=String(x.body_html||'').replace(/<(?!\\/?p>)[^>]*>/g,'');$('[data-v-b]').innerHTML=b;
$('[data-v-facts]').innerHTML=[['Desde',f.origen],['Destino',f.destino],['Precio',x.price+' €'],['Tipo',f.tipo],['Ida',f.ida],['Vuelta',f.vuelta||'—']].map(function(k){return '<div><small>'+k[0]+'</small><b>'+esc(k[1])+'</b></div>';}).join('');
});}go();})();
</script></body></html>'''
open('chollos/ver/index.html', 'w', encoding='utf-8').write(vp)

# ---------- /alertas/ ----------
os.makedirs('alertas', exist_ok=True)
al = head(title='Crea tu alerta de chollos de vuelos · Happy Low Cost', desc='Te avisamos gratis por email o WhatsApp cuando encontremos un vuelo barato desde tu aeropuerto. Máximo un aviso al día.',
          canonical='https://www.happylowcost.com/alertas/', extra_head='<link rel="stylesheet" href="/hlc/home.css?v=6">', body_class='alertas')
al += f'''<main class="sec"><div class="alert-box" style="max-width:1180px;margin:0 auto">
<div><div class="kicker">Alertas gratis</div><h1 style="font:800 clamp(38px,5.6vw,64px)/.98 'Bricolage Grotesque',sans-serif;letter-spacing:-.03em;margin:10px 0 14px">Que el chollo te encuentre a ti.</h1><p>Elige tu aeropuerto, tu destino soñado y tu precio máximo. Cuando cacemos un vuelo que encaje, te avisamos. Sin spam: máximo un aviso al día y te das de baja con un clic.</p></div>
{ALERT}
</div></main></body></html>'''
open('alertas/index.html', 'w', encoding='utf-8').write(al)
print('ok', len(posts), 'posts')
