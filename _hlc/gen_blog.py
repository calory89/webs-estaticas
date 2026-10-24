#!/usr/bin/env python3
"""Blog (/blog/) con los artículos de viaje antiguos, buscador propio (/buscar/ y /en/search/) e índices de búsqueda.
Lo llama gen_static.py. Uso suelto: python3 _hlc/gen_blog.py (desde la raíz de la rama pub/happylowcost.com)
"""
import os, re, sys, json, glob, html as H, datetime, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_deals as G  # noqa: E402
import gen_en as E  # noqa: E402
import en_names as EN  # noqa: E402

SITE = G.SITE
OFFER_CATS = {'Ofertas de Vuelos', 'Ofertas de Hoteles', 'OTRAS OFERTAS'}
OFFER_RX = re.compile(r'\d\s?€|€\s?\d|\bchollo|\bganga|por s[oó]lo|desde s[oó]lo|\bi/v\b|\bvuelos\b.*\bpor\b', re.I)
# promociones de otros negocios (inversión, cursos, empleo): fuera del blog de viajes
PROMO_RX = re.compile(r'trabajar con nosotros|abre un|open an|s[eé] due[ñn]o|aprende a programar|invierte|inversi[oó]n|compra (una )?casa|emprendedor|franquicia|\bsocios?\b|curso de|cursos de|real estate|school|quieres (?:viajar por todo|ser director|trabajar)|trabajo garantizado|vente a trabajar|trabajar en bali|casa gratis|esto te interesa', re.I)
MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
CAT_NAMES = {'GUÍAS CIUDADES': 'Guías de ciudades', 'TOP HOTELES': 'Hoteles', 'OTRAS OFERTAS': 'Otras ofertas'}


def txt(h):
    return re.sub(r'\s+', ' ', H.unescape(re.sub(r'<[^>]+>', ' ', h or ''))).strip()


def legacy_posts():
    out = []
    for f in sorted(glob.glob('*/index.html')):
        slug = f.split('/')[0]
        if slug in ('en', 'chollos', 'vuelos', 'destinos', 'blog', 'buscar') or slug.startswith('_'):
            continue
        s = open(f, encoding='utf-8', errors='ignore').read()
        if 'id="soledad_wrapper"' not in s or not re.search(r'<body[^>]*class="[^"]*\bsingle\b', s):
            continue
        if re.search(r'[一-鿿]', s[:4000]):
            continue
        h1 = re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S)
        title = txt(h1.group(1)) if h1 else ''
        d = re.search(r'article:published_time" content="(\d{4}-\d\d-\d\d)', s)
        cat = re.findall(r'rel="category tag"><span[^>]*>([^<]+)<', s)
        img = re.search(r'<meta property="og:image" content="([^"]+)"', s)
        desc = re.search(r'<meta name="description" content="([^"]*)"', s)
        cat0 = cat[0].strip() if cat else ''
        offer = cat0 in OFFER_CATS or bool(OFFER_RX.search(title))
        promo = bool(PROMO_RX.search(title))
        out.append(dict(s=slug, t=title, d=d.group(1) if d else '', c=cat0, img=img.group(1).replace(SITE, '') if img else '',
                        desc=H.unescape(desc.group(1)) if desc else '', offer=offer, promo=promo))
    return out


def fdate(iso):
    try:
        x = datetime.date.fromisoformat(iso)
        return f'{x.day} {MES[x.month - 1]} {x.year}'
    except Exception:
        return ''


def blog_page(posts):
    arts = [p for p in posts if not p['offer'] and not p['promo'] and p['t']]
    arts.sort(key=lambda p: p['d'], reverse=True)
    cats = collections.Counter(CAT_NAMES.get(p['c'], p['c'].title() if p['c'].isupper() else p['c']) for p in arts)
    guides = [('/guias/errores-de-tarifa/', 'Errores de tarifa: guía práctica', 'Qué son, cómo aprovecharlos y qué hacer si la aerolínea te cancela el billete.'),
              ('/herramientas/equipaje/', 'Equipaje de mano por aerolínea', 'Medidas y precios de la maleta de cabina en las low cost, con fuentes.'),
              ('/herramientas/es-buen-precio/', '¿Es buen precio este vuelo?', 'Compara tu precio con lo que suele costar la ruta.'),
              ('/como-verificamos/', 'Cómo verificamos cada chollo', 'El método detrás de cada oferta que publicamos.'),
              ('/destinos/', 'Guías de destinos', 'Qué ver, cuánto cuesta y cuándo ir, con los chollos de hoy a cada ciudad.')]
    gh = ''.join(f'<a class="bl-g" href="{u}"><b>{G.e(t)}</b><span>{G.e(dsc)}</span></a>' for u, t, dsc in guides)

    def cardh(p):
        c = CAT_NAMES.get(p['c'], p['c'].title() if p['c'].isupper() else p['c'])
        im = (f'<img src="{G.e(p["img"])}" alt="" loading="lazy" decoding="async" width="400" height="250">' if p['img'] else '<span class="bl-ph"></span>')
        return (f'<a class="bl-c" href="/{p["s"]}/" data-c="{G.e(G.slugify(c))}" data-q="{G.e(G.slugify(p["t"] + " " + c))}">{im}'
                f'<span class="bl-k">{G.e(c)} · {fdate(p["d"])}</span><b>{G.e(p["t"])}</b></a>')
    chips = '<button type="button" class="chip on" data-c="" aria-pressed="true">Todo <small>' + str(len(arts)) + '</small></button>' + ''.join(
        f'<button type="button" class="chip" data-c="{G.e(G.slugify(c))}" aria-pressed="false">{G.e(c)} <small>{n}</small></button>' for c, n in cats.most_common(12))
    url = f'{SITE}/blog/'
    lead = 'Guías de ciudades, rutas y trucos para viajar barato que hemos escrito desde 2012. Los precios de los artículos antiguos pueden haber cambiado: los chollos de hoy están siempre en Chollos.'
    ld = [{"@type": "CollectionPage", "@id": url + "#page", "url": url, "name": "Blog de viajes low cost", "inLanguage": "es-ES", "description": lead,
           "mainEntity": {"@type": "ItemList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": f'{SITE}/{p["s"]}/', "name": p['t']} for i, p in enumerate(arts[:30])]}},
          {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Inicio", "item": SITE + '/'}, {"@type": "ListItem", "position": 2, "name": "Blog", "item": url}]}]
    pg = G.head(title='Blog de viajes low cost: guías de ciudades y trucos · Happy Low Cost', desc=G.e(G.smart_desc(lead)), canonical=url, og_type='website',
                og_image=f'{SITE}/hlc/brand/og-default.jpg', extra_head='<link rel="stylesheet" href="/hlc/home.css?v=12">' + G.ld_script(ld), body_class='hblog')
    pg += (f'<main class="sec" style="padding-top:26px"><div class="wrap"><nav class="crumbs" aria-label="Migas"><a href="/">Inicio</a> › Blog</nav>'
           f'<div class="kicker">Blog</div><h1 class="x-h1">Blog de viajes low cost</h1><p style="font-size:18px;max-width:760px">{G.e(lead)}</p>'
           f'<h2 style="margin-top:28px">Guías prácticas</h2><div class="bl-gs">{gh}</div>'
           f'<h2 style="margin-top:34px">Artículos</h2><div class="bl-tools"><input type="search" class="bl-q" placeholder="Busca una ciudad, país o tema" aria-label="Buscar en el blog"><div class="chips" role="group" aria-label="Categorías">{chips}</div></div>'
           f'<div class="bl-grid" id="bl-grid">{"".join(cardh(p) for p in arts)}</div><p class="bl-none" hidden>No hay artículos con esa búsqueda. <a href="/buscar/">Prueba el buscador</a>.</p>'
           '</div></main><script>(function(){var g=document.getElementById("bl-grid"),q=document.querySelector(".bl-q"),cs=document.querySelectorAll(".bl-tools .chip"),c="",no=document.querySelector(".bl-none");'
           'function sl(s){return String(s||"").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}'
           'function f(){var t=sl(q.value).split("-").filter(Boolean),n=0;[].forEach.call(g.children,function(a){var ok=(!c||a.getAttribute("data-c")===c)&&t.every(function(w){return a.getAttribute("data-q").indexOf(w)>=0;});a.hidden=!ok;if(ok)n++;});no.hidden=n>0;}'
           'q.addEventListener("input",f);cs.forEach(function(b){b.addEventListener("click",function(){c=b.getAttribute("data-c");cs.forEach(function(x){x.classList.toggle("on",x===b);x.setAttribute("aria-pressed",x===b);});f();});});})();</script></body></html>')
    os.makedirs('blog', exist_ok=True)
    open('blog/index.html', 'w', encoding='utf-8').write(pg)
    return arts


def search_index(posts):
    dl = json.load(open('hlc/destinos.json', encoding='utf-8'))
    have = lambda p: os.path.isfile(p.lstrip('/') + 'index.html')
    es = {'d': [], 'r': [], 'g': [], 'p': []}
    en = {'d': [], 'r': [], 'g': []}
    for p in dl:
        u = f'/destinos/{p["s"]}/'
        if have(u):
            es['d'].append([p['n'], u, p.get('c', ''), ' '.join(p.get('a') or [])])
        ue = f'/en/destinations/{G.en_dest_slug(p["s"])}/'
        if have(ue):
            en['d'].append([EN.NAMES.get(p['s']) or EN.city_en(p['n']), ue, '', ' '.join(p.get('a') or []) + ' ' + p['n'] + ' ' + p.get('c', '')])
    try:
        ri = json.load(open('vuelos/rutas-idx.json', encoding='utf-8'))
    except Exception:
        ri = []
    for r in ri:
        slug, en_slug, o, dst, dst_en = r[0], r[1], r[2], r[3], r[4]
        pf = r[6] if len(r) > 6 else None
        if have(f'/vuelos/{slug}/'):
            es['r'].append([f'{o} → {dst}', f'/vuelos/{slug}/', pf])
        if en_slug and have(f'/en/flights/{en_slug}/'):
            en['r'].append([f'{EN.city_en(o)} → {dst_en}', f'/en/flights/{en_slug}/', pf])
    for u, t in [('/guias/errores-de-tarifa/', 'Errores de tarifa: guía práctica'), ('/herramientas/equipaje/', 'Equipaje de mano por aerolínea'),
                 ('/herramientas/es-buen-precio/', '¿Es buen precio este vuelo?'), ('/como-verificamos/', 'Cómo verificamos cada chollo'), ('/alertas/', 'Alertas de chollos gratis'),
                 ('/hoteles/', 'Dónde dormir: hoteles por destino'), ('/blog/', 'Blog de viajes'), ('/contacto/', 'Contacto')]:
        es['g'].append([t, u])
    try:
        for it in json.load(open('chollos/ideas.json', encoding='utf-8')):
            if isinstance(it, (list, tuple)) and len(it) >= 2 and os.path.isdir(f'chollos/ideas/{it[0]}'):
                es['g'].append([f'Ideas: {it[1]}', f'/chollos/ideas/{it[0]}/'])
    except Exception:
        pass
    for f in sorted(glob.glob('chollos/desde/*/*/index.html')):
        city = f.split('/')[3]
        es['g'].append([f'Chollos desde {city.replace("-", " ").title()}', '/' + f[:-10]])
    for u, t in [('/en/guides/error-fares/', 'Error fares: a practical guide'), ('/en/tools/baggage/', 'Hand luggage rules by airline'), ('/en/tools/is-it-a-good-price/', 'Is this flight a good price?'),
                 ('/en/how-we-verify/', 'How we verify every deal'), ('/en/hotels/', 'Where to stay: hotels by destination'), ('/en/contact/', 'Contact')]:
        en['g'].append([t, u])
    for f in sorted(glob.glob('en/deals/from/*/index.html')):
        city = f.split('/')[3]
        en['g'].append([f'Deals from {city.replace("-", " ").title()}', '/' + f[:-10]])
    for p in sorted(posts, key=lambda p: p['d'], reverse=True):
        if p['t'] and not p['promo']:
            es['p'].append([p['t'], f'/{p["s"]}/', p['d'][:4], 1 if p['offer'] else 0])
    json.dump(es, open('hlc/search-es.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    json.dump(en, open('hlc/search-en.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    return es, en


SEARCH_JS = r'''<script>(function(){var EN=document.documentElement.lang==='en',T=function(a,b){return EN?b:a;};
var inp=document.getElementById('sq'),out=document.getElementById('sr'),IDX=null,DEALS=[];
function sl(s){return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function score(text,ws){var t=' '+sl(text)+' ',s=0;for(var i=0;i<ws.length;i++){var w=ws[i];if(t.indexOf(' '+w+' ')>=0)s+=3;else if(t.indexOf(' '+w)>=0)s+=2;else if(t.indexOf(w)>=0)s+=1;else return 0;}return s;}
function grp(h,items,more){if(!items.length)return '';return '<section class="sr-g"><h2>'+h+' <small>'+items.length+'</small></h2><ul>'+items.slice(0,more||8).map(function(x){return '<li><a href="'+esc(x[1])+'">'+x[0]+'</a></li>';}).join('')+'</ul>'+(items.length>(more||8)?'<button type="button" class="hlc-btn o sr-more">'+T('Ver los ','See all ')+items.length+'</button>':'')+'</section>';}
function run(){var q=inp.value.trim();var ws=sl(q).split(' ').filter(function(w){return w.length>1||/\d/.test(w);});
try{history.replaceState(null,'',q?'?q='+encodeURIComponent(q):location.pathname);}catch(e){}
if(!ws.length){out.innerHTML='<p class="sr-hint">'+T('Escribe una ciudad, un país, un aeropuerto o un tema: «Lisboa», «Japón», «Madrid Roma», «equipaje».','Type a city, country, airport or topic: “Lisbon”, “Japan”, “London Rome”, “baggage”.')+'</p>';return;}
if(!IDX){out.innerHTML='<p class="sr-hint">'+T('Cargando…','Loading…')+'</p>';return;}
var org='';try{org=sl(localStorage.getItem('hlc_origin')||'');}catch(e){}var rank=function(list,fn,tb){return list.map(function(x,i){return [score(fn(x),ws),x,tb?tb(x):i];}).filter(function(a){return a[0]>0;}).sort(function(a,b){return b[0]-a[0]||a[2]-b[2];}).map(function(a){return a[1];});};
var dl=rank(DEALS,function(x){var f=x.facts||{};return [f.origen,f.destino,f.pais,f.origen_pais,f.continente,x.title].join(' ');}).map(function(x){var f=x.facts||{};return ['<b>'+esc(f.origen)+' → '+esc(f.destino)+'</b> · '+esc(x.price)+' €'+(f.ahorro_pct?' <span class="sr-s">−'+esc(f.ahorro_pct)+' %</span>':''),EN?'/en/deals/':(x._u||'/chollos/?q='+encodeURIComponent(sl(f.destino).replace(/ /g,'-')))];});
var d=rank(IDX.d,function(x){return x[0]+' '+x[2]+' '+x[3];}).map(function(x){return ['<b>'+esc(x[0])+'</b>'+(x[2]&&x[2]!==x[0]?' <small>'+esc(x[2])+'</small>':''),x[1]];});
var r=rank(IDX.r,function(x){return x[0];},function(x){return (org&&sl(x[0].split('→')[0])===org?-1e6:0)+(x[2]||1e5);}).map(function(x){return [esc(x[0])+(x[2]?' <small>'+T('desde ','from ')+esc(x[2])+' €</small>':''),x[1]];});
var g=rank(IDX.g,function(x){return x[0];}).map(function(x){return [esc(x[0]),x[1]];});
var p=IDX.p?rank(IDX.p.filter(function(x){return !x[3];}),function(x){return x[0];}).map(function(x){return [esc(x[0])+' <small>'+esc(x[2])+'</small>',x[1]];}):[];
var o=IDX.p?rank(IDX.p.filter(function(x){return x[3];}),function(x){return x[0];}).map(function(x){return [esc(x[0])+' <small>'+esc(x[2])+'</small>',x[1]];}):[];
var h=grp(T('Chollos de hoy','Today’s deals'),dl,6)+grp(T('Destinos y guías','Destinations'),d)+grp(T('Rutas de vuelo','Flight routes'),r)+grp(T('Herramientas y páginas','Tools and pages'),g)+grp(T('Blog','Blog'),p)+grp(T('Chollos antiguos (caducados)','Old deals (expired)'),o,5);
out.innerHTML=h||'<div class="dc-empty"><b>'+T('No hemos encontrado nada con «','Nothing found for “')+esc(q)+T('».','”.')+'</b><span>'+T('Prueba con el nombre de la ciudad o del país, o crea una alerta y te avisamos.','Try the city or country name, or create an alert.')+'</span><a class="hlc-btn" href="'+T('/alertas/','/en/deals/')+'">'+T('Crear alerta gratis','See today’s deals')+'</a></div>';
[].forEach.call(out.querySelectorAll('.sr-more'),function(b){b.addEventListener('click',function(){var s=b.closest('.sr-g'),k=s.querySelector('h2').firstChild.textContent.trim();var all={};all[T('Chollos de hoy','Today’s deals')]=dl;all[T('Destinos y guías','Destinations')]=d;all[T('Rutas de vuelo','Flight routes')]=r;all[T('Herramientas y páginas','Tools and pages')]=g;all.Blog=p;all[T('Chollos antiguos (caducados)','Old deals (expired)')]=o;var it=all[k]||[];s.querySelector('ul').innerHTML=it.slice(0,200).map(function(x){return '<li><a href="'+esc(x[1])+'">'+x[0]+'</a></li>';}).join('');b.remove();});});
try{(window.dataLayer=window.dataLayer||[]).push({event:'hlc_search',hlc_q:q.slice(0,60)});}catch(e){}}
var tm;inp.addEventListener('input',function(){clearTimeout(tm);tm=setTimeout(run,150);});
document.getElementById('sf').addEventListener('submit',function(e){e.preventDefault();run();});
var q0=new URLSearchParams(location.search).get('q');if(q0)inp.value=q0;run();
fetch((EN?'/hlc/search-en.json':'/hlc/search-es.json')+'?v=IDXV').then(function(r){return r.json();}).then(function(j){IDX=j;run();}).catch(function(){out.innerHTML='<p class="sr-hint">'+T('No se ha podido cargar el buscador.','Search could not load.')+'</p>';});
var tries=0;(function wait(){if(window.HLC_feed){window.HLC_feed().then(function(l){DEALS=l||[];fetch('/chollos/hechos.json').then(function(r){return r.json();}).then(function(h){DEALS.forEach(function(x){if(h.indexOf(x.slug)>=0)x._u='/chollos/'+x.slug+'/';});run();}).catch(run);});}else if(tries++<40)setTimeout(wait,150);})();
})();</script>'''


def search_pages():
    import hashlib
    for en in (False, True):
        ver = hashlib.md5(open('hlc/search-en.json' if en else 'hlc/search-es.json', 'rb').read()).hexdigest()[:8]
        L = (lambda a, b: b if en else a)
        url = f'{SITE}/en/search/' if en else f'{SITE}/buscar/'
        body = (f'<main class="sec" style="padding-top:26px"><div class="wrap" style="max-width:860px"><h1 class="x-h1">{L("Buscar en Happy Low Cost", "Search Happy Low Cost")}</h1>'
                f'<form id="sf" class="sr-f" role="search"><input id="sq" type="search" name="q" autocomplete="off" autofocus placeholder="{L("Ciudad, país, aeropuerto o tema", "City, country, airport or topic")}" aria-label="{L("Buscar", "Search")}">'
                f'<button class="hlc-btn" type="submit">{L("Buscar", "Search")}</button></form><div id="sr" aria-live="polite"></div></div></main>' + SEARCH_JS.replace('IDXV', ver))
        if en:
            pg = E.head('Search · Happy Low Cost', 'Search flight deals, routes, destinations and guides on Happy Low Cost.', url, f'{SITE}/buscar/', robots='noindex, follow', body_class='search') + body + E.FOOTER + '</body></html>'
            os.makedirs('en/search', exist_ok=True)
            open('en/search/index.html', 'w', encoding='utf-8').write(pg)
        else:
            pg = G.head(title='Buscar · Happy Low Cost', desc='Busca chollos de vuelos, rutas, destinos, guías y artículos del blog de Happy Low Cost.', canonical=url, robots='noindex, follow', og_type='website',
                        og_image=f'{SITE}/hlc/brand/og-default.jpg', extra_head='<link rel="stylesheet" href="/hlc/home.css?v=12">', body_class='search') + body + '</body></html>'
            os.makedirs('buscar', exist_ok=True)
            open('buscar/index.html', 'w', encoding='utf-8').write(pg)


# ---------- enlazado interno: blog <-> guías de destino ----------
import unicodedata as _ud


def _sl(t):
    t = _ud.normalize('NFD', t or '').encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')


def _dest_of(title, dl):
    t = '-' + _sl(title) + '-'
    best = None
    for p in dl:
        for n in [p['s'], _sl(p['n'])] + list(p.get('a') or []):
            if n and len(n) > 3 and f'-{n}-' in t and (best is None or len(n) > best[1]):
                best = (p, len(n))
    return best[0] if best else None


def _strip(t, a, b):
    return re.sub(re.escape(a) + '.*?' + re.escape(b), '', t, flags=re.S)


def _li(p):
    return f'<li><a href="/{p["s"]}/">{G.e(p["t"])}</a> <small>{fdate(p["d"])}</small></li>'


def link_blocks(posts, arts):
    dl = json.load(open('hlc/destinos.json', encoding='utf-8'))
    dmap = {p['s']: _dest_of(p['t'], dl) for p in posts}
    by_dest, by_cat = collections.defaultdict(list), collections.defaultdict(list)
    for p in arts:
        if dmap.get(p['s']):
            by_dest[dmap[p['s']]['s']].append(p)
        by_cat[p['c']].append(p)
    n_post = n_dest = 0
    for p in posts:
        f = f'{p["s"]}/index.html'
        t0 = open(f, encoding='utf-8', errors='surrogateescape').read()
        t = _strip(t0, '<!--hlc-more-->', '<!--/hlc-more-->')
        if p['promo']:
            if t != t0:
                open(f, 'w', encoding='utf-8', errors='surrogateescape').write(t)
            continue
        d = dmap.get(p['s'])
        cand = [x for x in (by_dest.get(d['s'], []) if d else []) if x['s'] != p['s']][:4]
        hd = f'Más artículos sobre {G.e(d["n"])}' if cand else 'Más artículos del blog'
        if len(cand) < 4 and d:
            # mismo país y luego misma región
            for key in ('c', 'r'):
                seen = {x['s'] for x in cand} | {p['s']}
                more = [x for x in arts if x['s'] not in seen and dmap.get(x['s']) and dmap[x['s']].get(key) == d.get(key)]
                if more and not cand:
                    hd = f'Más artículos sobre {G.e(d["c"])}' if key == 'c' else 'Artículos de la zona'
                cand += more[:4 - len(cand)]
                if len(cand) >= 4:
                    break
        if len(cand) < 4 and not p['offer']:
            seen = {x['s'] for x in cand} | {p['s']}
            cand += [x for x in by_cat.get(p['c'], []) if x['s'] not in seen][:4 - len(cand)]
        if cand:
            box = (f'<!--hlc-more--><section class="hlc-more"><h2>{hd}</h2><ul>{"".join(_li(x) for x in cand)}</ul>'
                   f'<p><a href="/blog/">Ver todos los artículos del blog</a></p></section><!--/hlc-more-->')
            m = re.search(r'<div class="inner-post-entry[^>]*>', t)
            if m:
                depth = 0
                for x in re.finditer(r'<(/?)div\b[^>]*>', t[m.start():]):
                    depth += -1 if x.group(1) else 1
                    if depth == 0:
                        pos = m.start() + x.end()
                        t = t[:pos] + box + t[pos:]
                        n_post += 1
                        break
        if t != t0:
            open(f, 'w', encoding='utf-8', errors='surrogateescape').write(t)
    for s_, lst in by_dest.items():
        f = f'destinos/{s_}/index.html'
        if not os.path.isfile(f):
            continue
        t0 = open(f, encoding='utf-8', errors='surrogateescape').read()
        t = _strip(t0, '<!--hlc-more-->', '<!--/hlc-more-->')
        name = next((p['n'] for p in dl if p['s'] == s_), s_)
        box = (f'<!--hlc-more--><section class="sec hlc-more" id="blog"><div class="wrap"><h2>Artículos sobre {G.e(name)}</h2><ul>{"".join(_li(x) for x in lst[:6])}</ul>'
               f'<p><a href="/blog/">Ver todos los artículos del blog</a></p></div></section><!--/hlc-more-->')
        i = t.rfind('</main>')
        if i > 0:
            t = t[:i] + box + t[i:]
            n_dest += 1
        if t != t0:
            open(f, 'w', encoding='utf-8', errors='surrogateescape').write(t)
    return n_post, n_dest


def main():
    posts = legacy_posts()
    arts = blog_page(posts)
    es, en = search_index(posts)
    search_pages()
    lk = link_blocks(posts, arts)
    print('enlaces', lk)
    excl = [p['s'] for p in posts if p['promo']]
    print(json.dumps({'posts': len(posts), 'blog': len(arts), 'promo_fuera': len(excl), 'idx_es': {k: len(v) for k, v in es.items()}, 'idx_en': {k: len(v) for k, v in en.items()}}))
    return excl


if __name__ == '__main__':
    print(main())
