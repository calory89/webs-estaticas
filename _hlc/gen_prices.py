#!/usr/bin/env python3
"""Páginas de precios con nuestros datos: "vuelos baratos a <destino>" (/vuelos/a/<d>/, /en/flights/to/<d>/)
y "vuelos baratos desde <ciudad>" (/vuelos/desde/<o>/, /en/flights/from/<o>/), más el calendario por meses
(vuelos/meses.json) que se va completando poco a poco con la acción calendar de hlc-alerts (máx. HLC_WARM rutas por ejecución).
Lo llama gen_routes.py con las rutas ya descargadas."""
import os, re, json, html, statistics, datetime, urllib.request
import gen_deals as G
import gen_en as E
import en_names

SITE = G.SITE
CAL = 'https://gmdalfsvtfhzepyrdmjj.supabase.co/functions/v1/hlc-alerts?action=calendar&slug='
SPAIN = ['Madrid', 'Barcelona', 'Málaga', 'Valencia', 'Sevilla', 'Bilbao', 'Alicante', 'Palma', 'Ibiza', 'Gran Canaria', 'Zaragoza', 'Santiago de Compostela']
# Ciudades de habla inglesa que vigilamos: la edicion inglesa encabeza con
# estas. Antes el titulo de /en/flights/to/lisbon/ ponia 38 EUR y el precio
# salia de Malaga, y la pagina llevaba 304 impresiones y cero clics.
EN_HOME = ['London', 'Manchester', 'Dublin', 'New York', 'Toronto', 'Sydney', 'Singapore', 'Dubai',
           'Londres', 'Dublín', 'Nueva York', 'Sídney', 'Singapur', 'Dubái']
PREF = ['Madrid', 'Barcelona', 'Londres', 'París', 'Nueva York', 'Málaga', 'Valencia', 'Ámsterdam', 'Berlín', 'Milán', 'Roma', 'Lisboa', 'Dublín', 'Toronto', 'Sídney', 'Singapur', 'Dubái']
MES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
MES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
e = G.e


_today = datetime.date.today()
NOW_ES = f'{MES_ES[_today.month - 1]} {_today.year}'
NOW_EN = f'{MES_EN[_today.month - 1]} {_today.year}'


def fd(iso, en=False):
    try:
        d = datetime.date.fromisoformat(str(iso)[:10])
        return f'{d.day} {MES_EN[d.month - 1][:3]} {d.year}' if en else f'{d.day} {MES_ES[d.month - 1][:3]} {d.year}'
    except Exception:
        return ''


def mname(ym, en=False):
    y, m = int(ym[:4]), int(ym[5:7])
    return f'{MES_EN[m - 1]} {y}' if en else f'{MES_ES[m - 1]} de {y}'


def stops(n, en=False):
    if n == 0:
        return 'direct' if en else 'directo'
    if n is None:
        return ''
    return (f'{n} stop' + ('s' if n > 1 else '')) if en else (f'{n} escala' + ('s' if n > 1 else ''))


# ---------- calendario por meses (se completa poco a poco) ----------
def load_meses():
    try:
        return json.load(open('vuelos/meses.json', encoding='utf-8'))
    except Exception:
        return {}


def warm(rows, meses, n):
    if n <= 0:
        return 0
    by_dest = {}
    for r in rows:
        by_dest.setdefault(r['dest_slug'], []).append(r)
    order = []
    for lvl in range(3):  # 1.ª pasada: una ruta por destino desde la ciudad preferida; luego la 2.ª y la 3.ª
        for d, lst in sorted(by_dest.items()):
            cand = sorted(lst, key=lambda r: PREF.index(r['origin']) if r['origin'] in PREF else 99)
            if len(cand) > lvl:
                order.append(cand[lvl]['slug'])
    now = datetime.datetime.utcnow()
    todo = [s for s in order if s not in meses or (now - datetime.datetime.fromisoformat(meses[s]['t'][:19])).days >= 4]
    # rotar: cada pasada empieza en un punto distinto, para no preguntar siempre por las mismas rutas
    if todo:
        k = (now.hour * 37 + now.day * 11) % len(todo)
        todo = todo[k:] + todo[:k]
    done = 0
    for s in todo[:n]:
        try:
            j = json.loads(urllib.request.urlopen(urllib.request.Request(CAL + s, headers={'User-Agent': 'hlc-build'}), timeout=150).read())
        except Exception:
            break
        if j.get('error'):
            continue
        # si el cálculo está ocupado (límite de 40 rutas/h), la función devuelve igualmente los meses que ya tiene guardados
        mo = [m for m in (j.get('months') or []) if m.get('price') and m.get('month', '') >= now.strftime('%Y-%m')]
        ms = [[m['month'], m['price'], m.get('airline'), m.get('stops')] for m in mo]
        if len(ms) >= 3:
            t = max((m.get('checked_at') or '') for m in mo)[:19] or now.isoformat(timespec='seconds')
            meses[s] = {'m': ms, 't': t}
            done += 1
    json.dump(meses, open('vuelos/meses.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    return done


# ---------- piezas ----------
def faq_ld(qas, lang):
    return {"@type": "FAQPage", "inLanguage": lang, "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in qas]}


def crumbs_ld(items):
    return {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, **({"item": SITE + u} if u else {})} for i, (n, u) in enumerate(items)]}


def crumbs_html(items, en):
    return '<nav class="crumbs" aria-label="' + ('Breadcrumb' if en else 'Migas de pan') + '">' + ' <span>›</span> '.join(
        (f'<a href="{u}">{e(n)}</a>' if u else f'<span aria-current="page">{e(n)}</span>') for n, u in items) + '</nav>'


def months_table(lst, meses, en, label_of):
    """Tabla de meses para hasta 3 rutas con datos. Devuelve (html, mejor (ruta, mes, precio) o None)."""
    have = [r for r in lst if r['slug'] in meses][:3]
    if not have:
        return '', None
    allm = sorted({m[0] for r in have for m in meses[r['slug']]['m']})[:6]
    best = None
    head = ''.join(f'<th scope="col">{(MES_EN if en else MES_ES)[int(m[5:7]) - 1][:3].capitalize()} {m[2:4]}</th>' for m in allm)
    body = ''
    for r in have:
        mm = {m[0]: m for m in meses[r['slug']]['m']}
        low = min(m[1] for m in mm.values())
        cells = ''
        for m in allm:
            x = mm.get(m)
            if not x:
                cells += '<td>–</td>'
                continue
            cells += f'<td{" class=\"pm-best\"" if x[1] == low else ""}>{x[1]} €</td>'
            if best is None or x[1] < best[2]:
                best = (r, m, x[1], x[2])
        body += f'<tr><th scope="row">{e(label_of(r))}</th>{cells}</tr>'
    t = meses[have[0]['slug']]['t']
    note = (f'Cheapest return flight we found each month (search on {fd(t, True)}, 1 adult, economy). In bold, the cheapest month for each route.' if en else
            f'Vuelo de ida y vuelta más barato que encontramos en cada mes (consulta del {fd(t)}, 1 adulto, turista). En negrita, el mes más barato de cada ruta.')
    return (f'<div class="pm-scroll"><table class="pm-t pm-m"><thead><tr><th scope="col">{"Route" if en else "Ruta"}</th>{head}</tr></thead><tbody>{body}</tbody></table></div>'
            f'<p class="pm-note">{e(note)}</p>'), best


def table(lst, en, first_label, label_of, link_of, show_airline=True):
    trs = ''
    for r in lst:
        f = r.get('facts') or {}
        med = f.get('mediana_ida_y_vuelta_eur')
        trs += (f'<tr data-q="{e(G.slugify(label_of(r)))}"><th scope="row"><a href="{link_of(r)}">{e(label_of(r))}</a></th><td class="pm-p">{r["price_from"]} €</td>'
                f'<td>{(str(med) + " €") if med else "–"}</td><td>{e(stops(f.get("escalas_ida"), en))}</td>' + (f'<td>{e(f.get("aerolinea") or "")}</td>' if show_airline else '') + '</tr>')
    return (f'<div class="pm-scroll"><table class="pm-t"><thead><tr><th scope="col">{first_label}</th><th scope="col">{"Lowest" if en else "Más barato"}</th>'
            f'<th scope="col">{"Usual" if en else "Habitual"}</th><th scope="col">{"Stops" if en else "Escalas"}</th>' + (f'<th scope="col">{"Airline" if en else "Aerolínea"}</th>' if show_airline else '') +
            f'</tr></thead><tbody>{trs}</tbody></table></div>')


FILTER_JS = ('<script>(function(){var q=document.querySelector(".pm-q");if(!q)return;var rows=document.querySelectorAll(".pm-t:not(.pm-m) tbody tr");'
             'function sl(s){return String(s||"").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-");}'
             'q.addEventListener("input",function(){var v=sl(q.value).replace(/^-|-$/g,"");rows.forEach(function(r){r.hidden=v&&r.getAttribute("data-q").indexOf(v)<0;});});})();</script>')


def write(path, html_):
    os.makedirs(path, exist_ok=True)
    open(os.path.join(path, 'index.html'), 'w', encoding='utf-8').write(html_)


def page_shell(en, title, desc, url, alt_url, ld, body_class, og=None, og_alt=None):
    if en:
        return E.head(title, desc, url, alt_url, ld=ld, body_class=body_class, og_image=og, og_alt=og_alt)
    alt = f'<link rel="alternate" hreflang="es" href="{url}"><link rel="alternate" hreflang="en" href="{alt_url}"><link rel="alternate" hreflang="x-default" href="{url}">'
    return G.head(title=e(title), desc=e(desc), canonical=url, og_type='article', og_image=og or f'{SITE}/hlc/brand/og-default.jpg', og_alt=e(og_alt or title),
                  extra_head='<link rel="stylesheet" href="/hlc/home.css?v=12">' + alt + G.ld_script(ld), body_class=body_class)


# Ronda 8: nombres cortos que también se buscan ("flights to vegas" 71 impr. pos. 8,4 en /en/flights/to/las-vegas/; "flights to orlando from nyc")
HUB_ALIAS = {'Las Vegas': 'Vegas', 'Nueva York': 'NYC', 'New York': 'NYC', 'Los Ángeles': 'LA', 'Los Angeles': 'LA', 'Ciudad de México': 'CDMX', 'Mexico City': 'CDMX',
             'Sídney': 'Sydney', 'Reikiavik': 'Reykjavik', 'Múnich': 'Munich', 'Zúrich': 'Zurich'}


def alias_txt(name, en):
    a = HUB_ALIAS.get(name)
    if not a:
        return ''
    return f' {name} is also known as {a}.' if en else f' {name} también se conoce como {a}.'


def QA_BOX(T, txt):
    return (f'<p class="qa" style="background:#FFF6E0;border-left:4px solid #FFC531;padding:12px 14px;border-radius:10px;max-width:820px">'
            f'<b>{T("Respuesta rápida:", "Quick answer:")}</b> {e(txt)}</p>')


def _hotel(city, en):
    from urllib.parse import quote
    host = 'searchresults.en-gb.html' if en else 'searchresults.es.html'
    return f'https://www.kqzyfj.com/click-101900924-17288959?sid=happylowcost-precios&url={quote(f"https://www.booking.com/{host}?ss={city}", safe="")}'


# ---------- ronda 6: piezas comunes de los hubs (Search Console 30-oct a 26-nov) ----------
# Origenes fuera de Europa (el resto de ciudades que vigilamos estan en Europa)
ORIG_COUNTRY = {**{c: 'España' for c in SPAIN}, 'Londres': 'Reino Unido', 'Manchester': 'Reino Unido', 'Dublín': 'Irlanda', 'Berlín': 'Alemania', 'Múnich': 'Alemania',
                'Bruselas': 'Bélgica', 'Copenhague': 'Dinamarca', 'Estocolmo': 'Suecia', 'Oslo': 'Noruega', 'Lisboa': 'Portugal', 'Milán': 'Italia', 'Roma': 'Italia', 'París': 'Francia',
                'Viena': 'Austria', 'Zúrich': 'Suiza', 'Ámsterdam': 'Países Bajos', 'Nueva York': 'Estados Unidos', 'Toronto': 'Canadá', 'Sídney': 'Australia', 'Singapur': 'Singapur', 'Dubái': 'Emiratos Árabes Unidos'}
NON_EU_ORIG = {'Dubái', 'Nueva York', 'Singapur', 'Sídney', 'Toronto'}
try:
    REGION = {x['s']: x.get('r') for x in json.load(open('hlc/destinos.json', encoding='utf-8'))}
except Exception:
    REGION = {}
# Moneda local de la ciudad de salida (tipo del BCE de hlc/fx.json; el dirham va atado al dolar a 3,6725)
CUR = {'Londres': ('GBP', '£'), 'Manchester': ('GBP', '£'), 'Nueva York': ('USD', 'US$'), 'Toronto': ('CAD', 'C$'), 'Sídney': ('AUD', 'A$'),
       'Singapur': ('SGD', 'S$'), 'Dubái': ('AED', 'AED '), 'Copenhague': ('DKK', 'DKK '), 'Estocolmo': ('SEK', 'SEK '), 'Oslo': ('NOK', 'NOK '), 'Zúrich': ('CHF', 'CHF ')}
try:
    _FX = json.load(open('hlc/fx.json', encoding='utf-8'))
except Exception:
    _FX = {}
LOWCOST = ('Ryanair', 'Wizz', 'easyJet', 'Vueling', 'Transavia', 'Norwegian', 'Pegasus', 'Scoot', 'Volotea', 'Jet2', 'Eurowings', 'Flair', 'JetBlue',
           'Spirit', 'Frontier', 'flydubai', 'Air Arabia', 'Jetstar', 'AirAsia', 'Iberia Express', 'Level', 'French bee', 'Norse', 'Play', 'airBaltic', 'SKY express', 'Lynx')


def local_money(o, eur):
    """'£38' / 'C$70' a partir de euros, o '' si no hay tipo."""
    c = CUR.get(o)
    if not c:
        return ''
    rates = _FX.get('rates') or {}
    rt = rates.get(c[0]) or (rates.get('USD') * 3.6725 if c[0] == 'AED' and rates.get('USD') else None)
    return f'{c[1]}{round(eur * rt)}' if rt else ''


def clean_prices(lst):
    """Quita precios que se repiten exactos en 5 o mas rutas de la misma ciudad (dato raro del agente, ver notas de la ronda 5)."""
    from collections import Counter
    cnt = Counter((r['origin'], r['price_from']) for r in lst)
    return [r for r in lst if cnt[(r['origin'], r['price_from'])] < 5]


def page_ld(name, url, checked, en):
    """WebPage con fecha de los precios y speakable para la respuesta rapida (asistentes de voz e IA)."""
    return {"@type": "WebPage", "@id": url + '#webpage', "url": url, "name": name, "inLanguage": 'en' if en else 'es-ES',
            **({"dateModified": checked[:10]} if checked else {}), "publisher": {"@id": SITE + '/#organization'},
            "speakable": {"@type": "SpeakableSpecification", "cssSelector": ["h1", ".qa"]}}


def src_box(url, checked, en):
    if en:
        return f'<p class="pm-src" style="font-size:14px;color:#555;overflow-wrap:anywhere">Source: Happy Low Cost own data (fares checked on Kiwi.com, last search {fd(checked, True)}). To cite this page: <a href="{url}">{url}</a></p>'
    return f'<p class="pm-src" style="font-size:14px;color:#555;overflow-wrap:anywhere">Fuente: datos propios de Happy Low Cost (precios consultados en Kiwi.com, última consulta del {fd(checked)}). Para citar esta página: <a href="{url}">{url}</a></p>'


# ---------- destino ----------
def dest_page(d, lst, meses, en, en_slug, guide):
    lst = sorted(lst, key=lambda r: r['price_from'])
    r0 = lst[0]
    f0 = r0.get('facts') or {}
    name = E.NAMES.get(d, r0['dest']) if en else r0['dest']
    oname = (lambda r: en_names.city_en(r['origin'])) if en else (lambda r: r['origin'])
    link = (lambda r: f'/en/flights/{en_slug(r)}/') if en else (lambda r: f'/vuelos/{r["slug"]}/')
    meds = [x for x in ((r.get('facts') or {}).get('mediana_ida_y_vuelta_eur') for r in lst) if x]
    direct = [r for r in lst if (r.get('facts') or {}).get('escalas_ida') == 0]
    es_lst = [r for r in lst if r['origin'] in SPAIN]
    checked = max(((r.get('facts') or {}).get('consultado') or '') for r in lst)
    slug_en = G.en_dest_slug(d)
    url_es, url_en = f'{SITE}/vuelos/a/{d}/', f'{SITE}/en/flights/to/{slug_en}/'
    url = url_en if en else url_es
    mt, best = months_table(sorted(lst, key=lambda r: PREF.index(r['origin']) if r['origin'] in PREF else 99), meses, en, lambda r: f'{oname(r)} → {name}')
    if en:
        # El lector de la edicion inglesa esta en Reino Unido, Irlanda, Estados
        # Unidos o Canada: un vuelo que sale de Malaga no le sirve. Encabeza la
        # ciudad de habla inglesa mas barata, y el mas barato de todos se dice
        # igualmente, con su ciudad, en la misma frase.
        en_lst = [r for r in lst if r['origin'] in EN_HOME]
        r1 = en_lst[0] if en_lst else r0
        f1 = r1.get('facts') or {}
        # Search Console (28 días): las consultas que traen estos hubs son "flight deals to X" (Sri Lanka, Stockholm, Munich, Krakow, en posición 4-9)
        title = f'Flight deals to {name}: €{r1["price_from"]} from {oname(r1)} ({NOW_EN})' if en_lst else f'Flight deals to {name} from €{r0["price_from"]} ({NOW_EN})'
        lead = (f'The cheapest return flight to {name} from {oname(r1)} we found is {r1["price_from"]} € ({stops(f1.get("escalas_ida"), True)}, {f1.get("aerolinea") or "several airlines"}). '
                + (f'Cheaper still from {oname(r0)}, at {r0["price_from"]} €. ' if r0 is not r1 else '')
                + (f'The usual price across the {len(lst)} cities we track is about {int(statistics.median(meds))} € (median).' if meds else ''))
        qas = [(f'How much is a flight to {name}?', f'From {oname(r1)}, the cheapest return we found was {r1["price_from"]} € (search on {fd(f1.get("consultado"), True)}). ' + (f'Across all {len(lst)} cities we track the cheapest was {r0["price_from"]} € from {oname(r0)}, and the usual price is about {int(statistics.median(meds))} € (median).' if meds else '')),
               (f'Which city has the cheapest flights to {name}?', 'Cheapest departures: ' + ', '.join(f'{oname(r)} ({r["price_from"]} €)' for r in lst[:3]) + '.')]
        if en_lst:
            qas.append((f'How much is a flight to {name} from the UK or Ireland?', 'Cheapest from the English-speaking cities we track: ' + ', '.join(f'{oname(r)} ({r["price_from"]} €)' for r in en_lst[:4]) + '.'))
        if direct:
            qas.append((f'Are there direct flights to {name}?', f'Yes, we found direct flights from {len(direct)} of the cities we track: ' + ', '.join(oname(r) for r in direct[:8]) + ('…' if len(direct) > 8 else '.')))
        else:
            qas.append((f'Are there direct flights to {name}?', f'In our last search, none of the {len(lst)} cities we track had a direct flight in the cheapest options; all had at least one stop.'))
        if best:
            qas.append((f'What is the cheapest month to fly to {name}?', f'From {oname(best[0])}, the cheapest month in the next six months is {mname(best[1], True)}, at {best[2]} € return.'))
        crumbs = [('Home', '/en/'), ('Flight routes', '/en/flights/'), (f'Flights to {name}', None)]
    else:
        title = f'Vuelos baratos a {name} desde {r0["price_from"]} € ({NOW_ES})'
        lead = (f'El vuelo de ida y vuelta más barato a {name} que hemos encontrado sale desde {oname(r0)} por {r0["price_from"]} € ({stops(f0.get("escalas_ida"))}, {f0.get("aerolinea") or "varias aerolíneas"}). '
                f'Lo habitual desde las {len(lst)} ciudades que vigilamos ronda los {int(statistics.median(meds))} € (mediana).') if meds else f'Vuelos de ida y vuelta a {name} desde {len(lst)} ciudades, con el precio más bajo que hemos encontrado.'
        qas = [(f'¿Cuánto cuesta un vuelo a {name}?', f'El más barato que encontramos fue de {r0["price_from"]} € ida y vuelta desde {oname(r0)} (consulta del {fd(f0.get("consultado"))}). ' + (f'Lo habitual desde las {len(lst)} ciudades que vigilamos ronda los {int(statistics.median(meds))} € (mediana).' if meds else '')),
               (f'¿Desde qué ciudad es más barato volar a {name}?', 'Las salidas más baratas: ' + ', '.join(f'{oname(r)} ({r["price_from"]} €)' for r in lst[:3]) + '.')]
        if es_lst:
            qas.append((f'¿Cuánto cuesta volar a {name} desde España?', f'Desde España, lo más barato que encontramos sale de {es_lst[0]["origin"]} por {es_lst[0]["price_from"]} € ida y vuelta' + (f'; después {es_lst[1]["origin"]} ({es_lst[1]["price_from"]} €)' if len(es_lst) > 1 else '') + '.'))
        if direct:
            qas.append((f'¿Hay vuelos directos a {name}?', f'Sí, encontramos vuelos directos desde {len(direct)} de las ciudades que vigilamos: ' + ', '.join(r['origin'] for r in direct[:8]) + ('…' if len(direct) > 8 else '.')))
        else:
            qas.append((f'¿Hay vuelos directos a {name}?', f'En nuestra última consulta, ninguna de las {len(lst)} ciudades que vigilamos tenía vuelo directo entre las opciones más baratas: todas hacían al menos una escala.'))
        if best:
            qas.append((f'¿Cuál es el mes más barato para volar a {name}?', f'Desde {oname(best[0])}, el mes más barato de los próximos seis es {mname(best[1])}, con {best[2]} € ida y vuelta.'))
        crumbs = [('Inicio', '/'), ('Rutas de vuelos', '/vuelos/'), (f'Vuelos a {name}', None)]
    # ronda 5: "cheapest airline to new york" 24 impr. pos. 17: qué aerolínea tenía el precio más bajo, con nuestros datos
    _air = {}
    for r_ in lst:
        a_ = ((r_.get('facts') or {}).get('aerolinea') or '').strip()
        if a_ and len(a_) < 40:
            _air.setdefault(a_, []).append(r_)
    if _air:
        ra = r1 if en else r0
        a0 = ((ra.get('facts') or {}).get('aerolinea') or '').strip()
        top_ = sorted(_air.items(), key=lambda kv: (-len(kv[1]), min(x['price_from'] for x in kv[1])))[:4]
        if en:
            qas.append((f'Which is the cheapest airline to {name}?', (f'In our latest search, the cheapest return to {name} from {oname(ra)} was with {a0} ({ra["price_from"]} €). ' if a0 else '')
                        + 'Airlines with the cheapest fares across the cities we track: ' + ', '.join(f'{k} ({len(v)} route{"s" if len(v) != 1 else ""}, from {min(x["price_from"] for x in v)} €)' for k, v in top_) + '.'))
        else:
            qas.append((f'¿Qué aerolínea es la más barata para volar a {name}?', (f'En nuestra última consulta, el vuelo de ida y vuelta más barato a {name} era con {a0} ({ra["price_from"]} € desde {oname(ra)}). ' if a0 else '')
                        + 'Aerolíneas con los precios más bajos en las ciudades que vigilamos: ' + ', '.join(f'{k} ({len(v)} ruta{"s" if len(v) != 1 else ""}, desde {min(x["price_from"] for x in v)} €)' for k, v in top_) + '.'))
    # ronda 6: "vuelos a roma ryanair", "flights to tenerife ryanair", "who is cheaper for flights to dubrovnik, tui or ryanair?" (113 impr. pos. 4,6)
    # solo con vuelo directo de Ryanair: con escalas, Kiwi.com combina un primer tramo de Ryanair con otra aerolínea y no significa que Ryanair vuele allí
    _ry = [r_ for r_ in lst if ((r_.get('facts') or {}).get('aerolinea') or '').startswith('Ryanair') and (r_.get('facts') or {}).get('escalas_ida') == 0]
    _ot = [r_ for r_ in lst if ((r_.get('facts') or {}).get('aerolinea') or '') and not ((r_.get('facts') or {}).get('aerolinea') or '').startswith('Ryanair')]
    if _ry:
        ry0 = _ry[0]
        if en:
            a_ = (f'Yes. In our latest search Ryanair had the cheapest fare, with a direct flight, to {name} from {len(_ry)} of the {len(lst)} cities we track; the lowest was {ry0["price_from"]} € return from {oname(ry0)}. ')
            if _ot:
                a_ += (f'The cheapest fare with another airline was {_ot[0]["price_from"]} € ({(_ot[0].get("facts") or {}).get("aerolinea")}, from {oname(_ot[0])}), so ' + ('Ryanair was cheaper.' if ry0['price_from'] < _ot[0]['price_from'] else 'Ryanair was not the cheapest option.' if ry0['price_from'] > _ot[0]['price_from'] else 'both cost the same.'))
            qas.append((f'Does Ryanair fly to {name}, and is it the cheapest?', a_))
        else:
            a_ = f'Sí. En nuestra última consulta, Ryanair tenía la tarifa más barata, con vuelo directo, a {name} desde {len(_ry)} de las {len(lst)} ciudades que vigilamos; la más baja, {ry0["price_from"]} € ida y vuelta desde {oname(ry0)}. '
            if _ot:
                a_ += (f'Con otra aerolínea, lo más barato fue {_ot[0]["price_from"]} € ({(_ot[0].get("facts") or {}).get("aerolinea")}, desde {oname(_ot[0])}), así que ' + ('Ryanair salía más barata.' if ry0['price_from'] < _ot[0]['price_from'] else 'Ryanair no era la opción más barata.' if ry0['price_from'] > _ot[0]['price_from'] else 'costaban lo mismo.'))
            qas.append((f'¿Vuela Ryanair a {name} y es la más barata?', a_))
    # ronda 6: "cheapest flights to japan from europe" (pos. 2,1): destinos fuera de Europa, el vuelo más barato desde ciudades europeas
    if REGION.get(d) and REGION.get(d) != 'europa':
        eu_ = [r_ for r_ in lst if r_['origin'] not in NON_EU_ORIG][:4]
        if eu_:
            if en:
                qas.append((f'What is the cheapest flight to {name} from Europe?', f'From the European cities we track, the cheapest return to {name} was from {oname(eu_[0])} at {eu_[0]["price_from"]} € (search on {fd((eu_[0].get("facts") or {}).get("consultado"), True)}). Next: ' + ', '.join(f'{oname(r_)} ({r_["price_from"]} €)' for r_ in eu_[1:]) + '.' if len(eu_) > 1 else f'From the European cities we track, the cheapest return to {name} was from {oname(eu_[0])} at {eu_[0]["price_from"]} €.'))
            else:
                qas.append((f'¿Cuál es el vuelo más barato a {name} desde Europa?', f'Desde las ciudades europeas que vigilamos, el ida y vuelta más barato a {name} salía de {oname(eu_[0])} por {eu_[0]["price_from"]} € (consulta del {fd((eu_[0].get("facts") or {}).get("consultado"))}). Después: ' + ', '.join(f'{oname(r_)} ({r_["price_from"]} €)' for r_ in eu_[1:]) + '.' if len(eu_) > 1 else f'Desde las ciudades europeas que vigilamos, el ida y vuelta más barato a {name} salía de {oname(eu_[0])} por {eu_[0]["price_from"]} €.'))
    # ronda 8: "are there last-minute cheap flights to las vegas?" (GSC, pos. 4): la salida más cercana a la fecha de consulta entre las rutas baratas
    def _lead_d(r_):
        try:
            f_ = r_.get('facts') or {}
            return (datetime.date.fromisoformat((f_.get('ejemplo_ida') or '')[:10]) - datetime.date.fromisoformat((f_.get('consultado') or '')[:10])).days
        except Exception:
            return None
    _lm = sorted(((_lead_d(r_), r_) for r_ in lst if (_lead_d(r_) or -1) >= 0), key=lambda t_: (t_[0], t_[1]['price_from']))
    if _lm and _lm[0][0] <= 21:
        _d0, _r0 = _lm[0]
        if en:
            qas.append((f'Are there last-minute cheap flights to {name}?', f'In our data, the cheap fare departing soonest after the search was from {oname(_r0)}: {_r0["price_from"]} € return, departing {_d0} day{"s" if _d0 != 1 else ""} after we checked ({fd((_r0.get("facts") or {}).get("consultado"), True)}). Last-minute prices change fast: set a free alert.'))
        else:
            qas.append((f'¿Hay vuelos baratos de última hora a {name}?', f'En nuestros datos, la salida barata más próxima a la consulta era desde {oname(_r0)}: {_r0["price_from"]} € ida y vuelta, con salida {_d0} día{"s" if _d0 != 1 else ""} después de consultarla ({fd((_r0.get("facts") or {}).get("consultado"))}). Los precios de última hora cambian rápido: crea una alerta gratis.'))
    # descripción para el clic (CTR): precio, ciudades, directos, mes más barato y fecha de consulta
    if en:
        desc = (f'{name} flights from €{r1["price_from"]} return ({oname(r1)})' + (f' and €{r0["price_from"]} from {oname(r0)}' if r0 is not r1 else '')
                + f'. {len(lst)} departure cities, {len(direct)} direct.' + (f' Cheapest month: {mname(best[1], True)}.' if best else '') + f' Fares checked {fd(checked, True)}.')
    else:
        desc = (f'Vuelos a {name} desde {r0["price_from"]} € ida y vuelta ({oname(r0)}). {len(lst)} ciudades de salida, {len(direct)} con directo.'
                + (f' Mes más barato: {mname(best[1])}.' if best else '') + f' Precios del {fd(checked)}.')
    desc = G.smart_desc(desc, 160)
    ld = [faq_ld(qas, 'en' if en else 'es-ES'), crumbs_ld(crumbs), page_ld(title, url, checked, en)]
    T = (lambda a, b: b if en else a)
    stats = (f'<div class="pm-stats"><div><b>{r0["price_from"]} €</b><span>{T("lo más barato que encontramos", "cheapest we found")}</span></div>'
             + (f'<div><b>{int(statistics.median(meds))} €</b><span>{T("precio habitual (mediana)", "usual price (median)")}</span></div>' if meds else '')
             + f'<div><b>{len(direct)}</b><span>{T("ciudades con vuelo directo", "cities with direct flights")}</span></div><div><b>{len(lst)}</b><span>{T("ciudades de salida", "departure cities")}</span></div></div>')
    # respuesta rápida: 2-3 frases citables con precio, directos y mes más barato
    if en:
        lm1 = local_money(r1['origin'], r1['price_from'])
        qa_ = (f'Cheapest return flight to {name} we found from {oname(r1)}: {r1["price_from"]} €' + (f' (about {lm1})' if lm1 else '') + f' (search on {fd(f1.get("consultado"), True)})' + (f'; from any city, {r0["price_from"]} € from {oname(r0)}. ' if r1 is not r0 else '. ')
               + (f'Direct flights from {len(direct)} of the {len(lst)} cities we track. ' if direct else f'None of the {len(lst)} cities we track had a direct flight among the cheapest options. ')
               + (f'Cheapest month: {mname(best[1], True)} ({best[2]} € from {oname(best[0])}).' if best else ''))
    else:
        qa_ = (f'El vuelo de ida y vuelta más barato a {name} que encontramos: {r0["price_from"]} € desde {oname(r0)} (consulta del {fd(f0.get("consultado"))}). '
               + (f'Hay vuelo directo desde {len(direct)} de las {len(lst)} ciudades que vigilamos. ' if direct else f'Ninguna de las {len(lst)} ciudades que vigilamos tenía vuelo directo entre las opciones más baratas. ')
               + (f'Mes más barato: {mname(best[1])} ({best[2]} € desde {oname(best[0])}).' if best else ''))
    hot = (f'<a class="hlc-btn t" href="{e(G.BK.with_dates(_hotel(r0["dest"], en), f0.get("ejemplo_ida"), f0.get("ejemplo_vuelta")))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="precios_hotel" data-tvcity="{e(name)}">'
           f'🏨 {T("Hoteles en " + name, "Hotels in " + name)}</a>')
    gl = ''
    if guide:
        gl = f'<a class="hlc-btn o" href="{T("/destinos/" + d + "/", "/en/destinations/" + slug_en + "/")}">{T("Guía de " + name, name + " travel guide")}</a>'
    out = page_shell(en, title + ' · Happy Low Cost', desc, url, url_es if en else url_en, ld, 'precios', og=(f'{SITE}/hlc/img/cities/{d}-og.jpg' if os.path.exists(f'hlc/img/cities/{d}-og.jpg') else None), og_alt=(f'Photo of {name}' if en else f'Foto de {name}'))
    out += (f'<main class="sec" style="padding-top:22px"><div class="wrap">{crumbs_html(crumbs, en)}'
            f'<div class="kicker">{T("Precios reales, consultados en Kiwi.com", "Real prices, checked on Kiwi.com")}</div><h1 class="x-h1">{e(title)}</h1>'
            + QA_BOX(T, qa_ + alias_txt(name, en)) +
            f'<p style="font-size:18px;max-width:820px">{e(lead)}</p>{stats}'
            f'<div class="hlc-row" style="margin:18px 0 6px">{gl}{hot}<a class="hlc-btn o" href="{T("/alertas/", "/en/deals/")}">{T("Avísame de chollos a " + name, "Today’s deals")}</a></div>'
            f'<h2>{T("Vuelos baratos a " + name + " desde cada ciudad", "Cheap flights to " + name + " from each city")}</h2><input type="search" class="pm-q" placeholder="{T("Filtra por ciudad de salida", "Filter by departure city")}" aria-label="{T("Filtrar", "Filter")}">'
            + table(lst, en, T('Salida', 'Departure'), oname, link)
            + f'<p class="pm-note">{e(T(f"Precios de ida y vuelta en clase turista para 1 adulto, consultados en Kiwi.com (última consulta: {fd(checked)}). Habitual es la mediana de los precios que vimos. Los precios cambian cada día.", f"Return prices in economy for 1 adult, checked on Kiwi.com (last search: {fd(checked, True)}). Usual is the median of the prices we saw. Prices change every day."))}</p>'
            + src_box(url, checked, en)
            + (f'<h2>{T("Cuándo es más barato volar a " + name, "When it is cheapest to fly to " + name)}</h2>{mt}' if mt else '')
            + ('' if en else f'<section class="hlc-rel"><h2 data-rel-h>Chollos de hoy a {e(name)}</h2><div class="dc-grid" data-hlc-deals data-max="4" data-dest="{e(d)}"></div><div class="hlc-row"><a class="hlc-btn o" href="/chollos/">Todos los chollos de hoy</a></div></section>')
            + f'<h2>{T("Preguntas frecuentes", "FAQ")}</h2><div class="txt guide">' + ''.join(f'<h3>{e(q)}</h3><p>{e(a)}</p>' for q, a in qas) + '</div>'
            + '</div></main>' + FILTER_JS + (E.FOOTER if en else '') + '</body></html>')
    return out


# ---------- origen ----------
def budget_blocks(lst, en, dname, link):
    out = ''
    for lo, hi in ((0, 50), (50, 100), (100, 300)):
        g = [r for r in lst if lo <= r['price_from'] < hi]
        if not g:
            continue
        h = (f'Under €{hi}' if lo == 0 else f'€{lo} to €{hi}') if en else (f'Por menos de {hi} €' if lo == 0 else f'De {lo} a {hi} €')
        out += (f'<div class="pm-bud"><h3 id="{"under" if en else "menos"}-{hi}">{h} <small>{len(g)}</small></h3><div class="chips">'
                + ''.join(f'<a class="chip" href="{link(r)}">{e(dname(r))} · {("€" + str(r["price_from"])) if en else (str(r["price_from"]) + " €")}</a>' for r in g[:24]) + '</div></div>')
    return f'<h2>{"By budget" if en else "Por presupuesto"}</h2>{out}' if out else ''



def orig_extra_faq(o, lst, en, oname, dname):
    """Ronda 6: preguntas de asistentes de IA que ya traen impresiones a los hubs "desde" (GSC 30-oct a 26-nov):
    "¿cuáles son los países más baratos para visitar volando desde barcelona?" (pos. 6,8), "cheapest countries to fly to from ireland" (33 impr.),
    "what european cities usually have very cheap flights from london?" (pos. 3,3), "what destinations do budget airlines from london serve?" (22 impr. pos. 6)."""
    T = (lambda a, b: b if en else a)
    ok = clean_prices(lst)
    qas = []
    # países más baratos (el destino más barato de cada país)
    oc = ORIG_COUNTRY.get(o)
    byc = {}
    for r in ok:
        if oc and en_names.COUNTRY_ES_FIX.get(r['country'], r['country']) == oc:
            continue
        c0 = en_names.COUNTRY_ES_FIX.get(r['country'], r['country'])
        c = en_names.country_en(c0) if en else c0
        if c and (c not in byc or r['price_from'] < byc[c]['price_from']):
            byc[c] = r
    cs = sorted(byc.items(), key=lambda kv: kv[1]['price_from'])[:6]
    where = ('Ireland' if o == 'Dublín' else oname) if en else oname
    if len(cs) >= 3:
        qas.append((T(f'¿Cuáles son los países más baratos para volar desde {where}?', f'What are the cheapest countries to fly to from {where}?'),
                    T('Por el vuelo de ida y vuelta más barato a cada país en nuestra última consulta: ', 'By the cheapest return flight to each country in our latest search: ')
                    + ', '.join(f'{c} ({dname(r)}, {r["price_from"]} €)' for c, r in cs) + '.'))
    # ciudades europeas más baratas
    eu = [r for r in ok if REGION.get(r['dest_slug']) == 'europa'][:6]
    if len(eu) >= 3:
        qas.append((T(f'¿Qué ciudades europeas tienen los vuelos más baratos desde {oname}?', f'Which European cities have the cheapest flights from {oname}?'),
                    ', '.join(f'{dname(r)} ({r["price_from"]} €' + (T(', directo', ', direct') if (r.get('facts') or {}).get('escalas_ida') == 0 else '') + ')' for r in eu)
                    + T(', ida y vuelta, en nuestra última consulta.', ' return, in our latest search.')))
    # aerolíneas low cost y sus destinos
    bya = {}
    for r in ok:
        a = ((r.get('facts') or {}).get('aerolinea') or '').strip()
        if a and any(a.startswith(k) for k in LOWCOST):
            bya.setdefault(re.sub(r'\s+(UK|Malta|Sweden|France|Air Shuttle)$', '', a), []).append(r)
    top = sorted(bya.items(), key=lambda kv: -len(kv[1]))[:4]
    if top:
        qas.append((T(f'¿Qué aerolíneas low cost vuelan desde {oname} y a dónde?', f'Which budget airlines fly from {oname}, and where to?'),
                    T('Aerolíneas low cost con la tarifa más barata en nuestras rutas desde ', 'Budget airlines with the cheapest fare on our routes from ') + oname + ': '
                    + '; '.join(f'{a}: ' + ', '.join(f'{dname(r)} ({r["price_from"]} €)' for r in l[:3]) for a, l in top) + '.'))
    return qas


def orig_page(o, lst, en, en_slug):
    lst = sorted(lst, key=lambda r: r['price_from'])
    oname = en_names.city_en(o) if en else o
    dname = (lambda r: E.NAMES.get(r['dest_slug'], r['dest'])) if en else (lambda r: r['dest'])
    link = (lambda r: f'/en/flights/{en_slug(r)}/') if en else (lambda r: f'/vuelos/{r["slug"]}/')
    os_ = G.slugify(o)
    os_en = G.slugify(en_names.city_en(o))
    url_es, url_en = f'{SITE}/vuelos/desde/{os_}/', f'{SITE}/en/flights/from/{os_en}/'
    url = url_en if en else url_es
    direct = [r for r in lst if (r.get('facts') or {}).get('escalas_ida') == 0]
    checked = max(((r.get('facts') or {}).get('consultado') or '') for r in lst)
    under = [r for r in lst if r['price_from'] < 100]
    T = (lambda a, b: b if en else a)
    if en:
        # ronda 6 (GSC 30-oct a 26-nov): "cheap flights from X" tiene más impresiones que "cheapest" en Ámsterdam, Singapur, Copenhague, Dubái, Mánchester, Múnich, Madrid y Zúrich
        title = f'Cheap flights from {oname}: {len(lst)} destinations from €{lst[0]["price_from"]} ({NOW_EN})'
        lead = f'The cheapest return flights from {oname} we found: ' + ', '.join(f'{dname(r)} ({r["price_from"]} €)' for r in lst[:4]) + f'. {len(under)} destinations under 100 € return and {len(direct)} with direct flights.'
        qas = [(f'Where can I fly cheaply from {oname}?', 'The cheapest destinations in our last search: ' + ', '.join(f'{dname(r)} ({r["price_from"]} €)' for r in lst[:5]) + '.'),
               (f'How many destinations under 100 € can I reach from {oname}?', f'{len(under)} of the {len(lst)} destinations we track had a return flight under 100 €' + (': ' + ', '.join(dname(r) for r in under[:8]) + ('…' if len(under) > 8 else '.') if under else '.')),
               (f'Which direct flights from {oname} are cheapest?', ('Cheapest direct flights: ' + ', '.join(f'{dname(r)} ({r["price_from"]} €)' for r in direct[:5]) + '.') if direct else 'In our last search the cheapest options all had at least one stop.')]
        crumbs = [('Home', '/en/'), ('Flight routes', '/en/flights/'), (f'Flights from {oname}', None)]
    else:
        title = f'Vuelos baratos desde {oname}: {len(lst)} destinos desde {lst[0]["price_from"]} € ({NOW_ES})'
        lead = f'Los vuelos de ida y vuelta más baratos desde {oname} que hemos encontrado: ' + ', '.join(f'{dname(r)} ({r["price_from"]} €)' for r in lst[:4]) + f'. {len(under)} destinos por menos de 100 € ida y vuelta y {len(direct)} con vuelo directo.'
        qas = [(f'¿A dónde se puede volar barato desde {oname}?', 'Los destinos más baratos en nuestra última consulta: ' + ', '.join(f'{dname(r)} ({r["price_from"]} €)' for r in lst[:5]) + '.'),
               (f'¿Cuántos destinos hay por menos de 100 € desde {oname}?', f'{len(under)} de los {len(lst)} destinos que vigilamos tenían vuelo de ida y vuelta por menos de 100 €' + (': ' + ', '.join(dname(r) for r in under[:8]) + ('…' if len(under) > 8 else '.') if under else '.')),
               (f'¿Qué vuelos directos desde {oname} son los más baratos?', ('Los directos más baratos: ' + ', '.join(f'{dname(r)} ({r["price_from"]} €)' for r in direct[:5]) + '.') if direct else 'En nuestra última consulta, las opciones más baratas hacían al menos una escala.')]
        crumbs = [('Inicio', '/'), ('Rutas de vuelos', '/vuelos/'), (f'Vuelos desde {oname}', None)]
    if en:
        desc = (f'From {oname}: ' + ', '.join(f'{dname(r)} €{r["price_from"]}' for r in lst[:3]) + f' return. {len(under)} destinations under €100, {len(direct)} direct. Fares checked {fd(checked, True)}.')
    else:
        desc = (f'Desde {oname}: ' + ', '.join(f'{dname(r)} {r["price_from"]} €' for r in lst[:3]) + f' ida y vuelta. {len(under)} destinos por menos de 100 €, {len(direct)} directos. Precios del {fd(checked)}.')
    desc = G.smart_desc(desc, 160)
    qas += orig_extra_faq(o, lst, en, oname, dname)
    ld = [faq_ld(qas, 'en' if en else 'es-ES'), crumbs_ld(crumbs), page_ld(title, url, checked, en)]
    d0 = direct[0] if direct else None
    if en:
        lm = local_money(o, lst[0]['price_from'])
        qa_ = (f'The cheapest return flight from {oname} we found goes to {dname(lst[0])} for {lst[0]["price_from"]} €' + (f' (about {lm})' if lm else '') + f' (search on {fd(checked, True)}). '
               f'{len(under)} of the {len(lst)} destinations we track cost under 100 € return' + (f', and the cheapest direct flight is to {dname(d0)} ({d0["price_from"]} €).' if d0 else '.'))
    else:
        lm = local_money(o, lst[0]['price_from'])
        qa_ = (f'El vuelo de ida y vuelta más barato desde {oname} que encontramos va a {dname(lst[0])} por {lst[0]["price_from"]} €' + (f' (unos {lm})' if lm else '') + f' (consulta del {fd(checked)}). '
               f'{len(under)} de los {len(lst)} destinos que vigilamos cuestan menos de 100 € ida y vuelta' + (f', y el directo más barato es a {dname(d0)} ({d0["price_from"]} €).' if d0 else '.'))
    out = page_shell(en, title + ' · Happy Low Cost', desc, url, url_es if en else url_en, ld, 'precios')
    out += (f'<main class="sec" style="padding-top:22px"><div class="wrap">{crumbs_html(crumbs, en)}'
            f'<div class="kicker">{T("Precios reales, consultados en Kiwi.com", "Real prices, checked on Kiwi.com")}</div><h1 class="x-h1">{e(title)}</h1>'
            + QA_BOX(T, qa_ + alias_txt(oname, en)) +
            f'<p style="font-size:18px;max-width:820px">{e(lead)}</p>'
            f'<div class="pm-stats"><div><b>{lst[0]["price_from"]} €</b><span>{T("el destino más barato", "cheapest destination")}</span></div><div><b>{len(under)}</b><span>{T("destinos por menos de 100 €", "destinations under 100 €")}</span></div><div><b>{len(direct)}</b><span>{T("con vuelo directo", "with direct flights")}</span></div><div><b>{len(lst)}</b><span>{T("destinos", "destinations")}</span></div></div>'
            f'<div class="hlc-row" style="margin:18px 0 6px"><a class="hlc-btn o" href="{T("/chollos/?aero=" + os_, "/en/deals/")}">{T("Chollos de hoy desde " + oname, "Today’s deals")}</a>' + ('' if en else '<a class="hlc-btn o" href="/alertas/">Crear alerta gratis</a>') + '</div>'
            + budget_blocks(lst, en, dname, link)
            + f'<h2>{T("Precio a cada destino", "Price to each destination")}</h2><input type="search" class="pm-q" placeholder="{T("Filtra por destino", "Filter by destination")}" aria-label="{T("Filtrar", "Filter")}">'
            + table(lst, en, T('Destino', 'Destination'), dname, link)
            + f'<p class="pm-note">{e(T(f"Precios de ida y vuelta en clase turista para 1 adulto, consultados en Kiwi.com (última consulta: {fd(checked)}). Habitual es la mediana de los precios que vimos. Los precios cambian cada día.", f"Return prices in economy for 1 adult, checked on Kiwi.com (last search: {fd(checked, True)}). Usual is the median of the prices we saw. Prices change every day."))}</p>'
            + src_box(url, checked, en)
            + f'<h2>{T("Preguntas frecuentes", "FAQ")}</h2><div class="txt guide">' + ''.join(f'<h3>{e(q)}</h3><p>{e(a)}</p>' for q, a in qas) + '</div>'
            + '</div></main>' + FILTER_JS + (E.FOOTER if en else '') + '</body></html>')
    return out


def _strip(t, a, b):
    return re.sub(re.escape(a) + '.*?' + re.escape(b), '', t, flags=re.S)


def _inject(path, box, marker='hlc-prices'):
    if not os.path.isfile(path):
        return False
    t0 = open(path, encoding='utf-8', errors='surrogateescape').read()
    t = _strip(t0, f'<!--{marker}-->', f'<!--/{marker}-->')
    i = t.rfind('</main>')
    if i < 0:
        return False
    t = t[:i] + f'<!--{marker}-->{box}<!--/{marker}-->' + t[i:]
    if t != t0:
        open(path, 'w', encoding='utf-8', errors='surrogateescape').write(t)
    return True


UK_IE = ('Londres', 'London', 'Manchester', 'Dublín', 'Dublin', 'Edimburgo', 'Edinburgh', 'Glasgow', 'Bristol', 'Birmingham', 'Liverpool', 'Belfast', 'Cork', 'Shannon', 'Newcastle', 'Leeds')
try:
    DIAS = json.load(open(os.path.join('destinos', 'dias.json'), encoding='utf-8'))
except Exception:
    DIAS = {}


def guide_budget_eur(d):
    """Presupuesto diario más ajustado de la guía (primera fila de su tabla), en euros: (mínimo, máximo) o None."""
    p = os.path.join('destinos', d, 'index.html')
    if not os.path.isfile(p):
        return None
    m = re.search(r'<table class="g-bud">.*?<tbody><tr><th scope="row">[^<]*</th><td>([^<]*)</td>', open(p, encoding='utf-8', errors='surrogateescape').read(), re.S)
    if not m or not re.search(r'€|euro', m.group(1), re.I):
        return None
    n = [int(x) for x in re.findall(r'\d+', m.group(1).replace('.', ''))]
    n = [x for x in n if 5 <= x <= 2000]
    if not n or len(n) > 2:
        return None
    return (min(n), max(n))


def _put(path, marker, block, before_rx):
    """Mete un bloque idempotente (entre <!--marker--> y <!--/marker-->) antes de la primera sección que casa con before_rx."""
    if not os.path.isfile(path):
        return
    t0 = open(path, encoding='utf-8', errors='surrogateescape').read()
    t = _strip(t0, f'<!--{marker}-->', f'<!--/{marker}-->')
    if block:
        m = re.search(before_rx, t)
        if not m:
            return
        t = t[:m.start()] + f'<!--{marker}-->{block}<!--/{marker}-->' + t[m.start():]
    if t != t0:
        open(path, 'w', encoding='utf-8', errors='surrogateescape').write(t)


def home_blocks(by_orig, by_dest, en_slug):
    """Portadas: vuelos baratos desde Reino Unido e Irlanda (EN) y, hasta el 6 de enero, Navidad destacada (ES y EN)."""
    cols = []
    for o in ('Londres', 'Manchester', 'Dublín', 'Edimburgo'):
        lst = sorted(by_orig.get(o) or [], key=lambda r: r['price_from'])
        if len(lst) < 3:
            continue
        oe = en_names.city_en(o)
        cols.append(f'<div class="uk-c"><h3><a href="/en/flights/from/{G.slugify(oe)}/">Cheap flights from {e(oe)}</a></h3><ul>'
                    + ''.join(f'<li><a href="/en/flights/{en_slug(r)}/">{e(E.NAMES.get(r["dest_slug"], r["dest"]))}</a> <b>€{r["price_from"]}</b>'
                              + (' · nonstop' if (r.get('facts') or {}).get('escalas_ida') == 0 else '') + '</li>' for r in lst[:5])
                    + f'</ul><a class="uk-all" href="/en/flights/from/{G.slugify(oe)}/">All {len(lst)} destinations from {e(oe)}</a></div>')
    uk = ''
    if cols:
        uk = ('<section class="sec" id="uk-ie"><div class="wrap"><div class="sec-h"><div><div class="kicker">Real return fares, checked on Kiwi.com</div><h2>Cheap flights from the UK &amp; Ireland</h2></div></div>'
              '<style>.uk-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}.uk-c{background:#fff;border-radius:16px;padding:16px 18px;border:1px solid #EADCC4}.uk-c h3{margin:0 0 8px;font-size:18px}.uk-c ul{list-style:none;margin:0 0 10px;padding:0}.uk-c li{padding:6px 0;border-bottom:1px solid #F3E9D8;display:flex;gap:6px;flex-wrap:wrap}.uk-c li b{margin-left:auto}.uk-all{font-weight:600}</style>'
              f'<div class="uk-g">{"".join(cols)}</div></div></section>')
    _put('en/index.html', 'hlc-uk', uk, r'(?s)<section[^>]*>(?:(?!</section>).)*?Most-read itineraries')
    xmas = datetime.date.today() <= datetime.date(2027, 1, 6)
    es_x = ('<section class="sec" style="padding-top:10px" id="navidad"><div class="wrap"><a class="hlc-btn" href="/chollos/ideas/navidad-2026/" style="width:100%;justify-content:center">🎄 Vuelos baratos para Navidad 2026: los chollos de estas fechas</a>'
            '<p style="text-align:center;margin:8px 0 0"><a href="/chollos/ideas/puente-diciembre-2026/">Puente de diciembre 2026</a></p></div></section>') if xmas and os.path.isdir('chollos/ideas/navidad-2026') else ''
    en_x = ('<section class="sec" style="padding-top:10px" id="christmas"><div class="wrap"><a class="hlc-btn" href="/en/deals/ideas/christmas-2026/" style="width:100%;justify-content:center">🎄 Cheap flights for Christmas 2026: deals for these dates</a></div></section>'
            ) if xmas and os.path.isdir('en/deals/ideas/christmas-2026') else ''
    # ronda 5: pasada Navidad, Semana Santa 2027 destacada en portada hasta el 28 de marzo
    if not xmas and datetime.date.today() <= datetime.date(2027, 3, 28):
        if os.path.isdir('chollos/ideas/semana-santa-2027'):
            es_x = ('<section class="sec" style="padding-top:10px" id="semana-santa"><div class="wrap"><a class="hlc-btn" href="/chollos/ideas/semana-santa-2027/" style="width:100%;justify-content:center">'
                    '🌸 Vuelos baratos para Semana Santa 2027: los chollos de estas fechas</a></div></section>')
        if os.path.isdir('en/deals/ideas/easter-2027'):
            en_x = ('<section class="sec" style="padding-top:10px" id="easter"><div class="wrap"><a class="hlc-btn" href="/en/deals/ideas/easter-2027/" style="width:100%;justify-content:center">'
                    '🌸 Cheap flights for Easter 2027: deals for these dates</a></div></section>')
    _put('index.html', 'hlc-xmas', es_x, r'<!--top-guias-->')
    _put('en/index.html', 'hlc-xmas', en_x, r'(?s)<section[^>]*>(?:(?!</section>).)*?Ideas for cheap travel')


def xmas_blocks(rows, meses, en_slug):
    """Ideas de Navidad: precio más barato de diciembre de 2026 desde Reino Unido e Irlanda (EN) y desde España (ES), de nuestro calendario."""
    def dec(r):
        return next((m[1] for m in ((meses.get(r['slug']) or {}).get('m') or []) if m[0] == '2026-12' and m[1]), None)
    for en, path, origins in ((True, 'en/deals/ideas/christmas-2026/index.html', UK_IE), (False, 'chollos/ideas/navidad-2026/index.html', tuple(SPAIN))):
        if not os.path.isfile(path):
            continue
        lst = sorted([(r, dec(r)) for r in rows if r['origin'] in origins and dec(r)], key=lambda v: v[1])
        seen, top = set(), []
        for r, p_ in lst:
            if r['dest_slug'] in seen:
                continue
            seen.add(r['dest_slug'])
            top.append((r, p_))
        blk = ''
        if len(top) >= 5:
            if en:
                trs = ''.join(f'<tr><th scope="row"><a href="/en/flights/{en_slug(r)}/">{e(en_names.city_en(r["origin"]))} → {e(E.NAMES.get(r["dest_slug"], r["dest"]))}</a></th><td class="pm-p">€{p_}</td></tr>' for r, p_ in top[:15])
                blk = (f'<section class="sec" style="padding-top:0"><div class="wrap" style="max-width:760px"><h2>Christmas 2026 flights from the UK and Ireland</h2>'
                       f'<p>Cheapest return fare we found for a December 2026 departure from London, Manchester, Dublin and other UK and Irish airports, one line per destination. From our price calendar (Kiwi.com); fares change.</p>'
                       f'<div class="pm-scroll"><table class="pm-t"><thead><tr><th scope="col">Route</th><th scope="col">December from</th></tr></thead><tbody>{trs}</tbody></table></div>'
                       f'<p><a class="hlc-btn o" href="/en/flights/month/december-2026/">All cheap flights in December 2026</a></p></div></section>')
            else:
                trs = ''.join(f'<tr><th scope="row"><a href="/vuelos/{r["slug"]}/">{e(r["origin"])} → {e(r["dest"])}</a></th><td class="pm-p">{p_} €</td></tr>' for r, p_ in top[:15])
                blk = (f'<section class="sec" style="padding-top:0"><div class="wrap" style="max-width:760px"><h2>Vuelos para Navidad 2026 desde España</h2>'
                       f'<p>El vuelo de ida y vuelta más barato que encontramos con salida en diciembre de 2026 desde aeropuertos españoles, una línea por destino. Sale de nuestro calendario de precios (Kiwi.com); puede cambiar.</p>'
                       f'<div class="pm-scroll"><table class="pm-t"><thead><tr><th scope="col">Ruta</th><th scope="col">Diciembre desde</th></tr></thead><tbody>{trs}</tbody></table></div>'
                       f'<p><a class="hlc-btn o" href="/vuelos/mes/diciembre-2026/">Todos los vuelos baratos en diciembre de 2026</a></p></div></section>')
        t0 = open(path, encoding='utf-8', errors='surrogateescape').read()
        t = _strip(t0, '<!--hlc-xmasr-->', '<!--/hlc-xmasr-->')
        if blk:
            i = t.rfind('</main>')
            if i > 0:
                t = t[:i] + '<!--hlc-xmasr-->' + blk + '<!--/hlc-xmasr-->' + t[i:]
        if t != t0:
            open(path, 'w', encoding='utf-8', errors='surrogateescape').write(t)


# ---------- ronda 5: escapadas cortas y vuelos por menos de 50 desde las ciudades con más búsquedas ----------
try:
    _AP = json.load(open(os.path.join('hlc', 'airports.json'), encoding='utf-8'))
except Exception:
    _AP = {}


def airport_km(a, b):
    import math
    pa, pb = _AP.get((a or '').upper()), _AP.get((b or '').upper())
    if not pa or not pb or a == b:
        return 0
    la1, lo1, la2, lo2 = map(math.radians, (pa[0], pa[1], pb[0], pb[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return int(round(2 * 6371 * math.asin(math.sqrt(h)) / 10.0) * 10)


SHORT_LABEL = {}  # ruta publicada -> texto del enlace (lo rellena short_pages)
SHORT_KM = 2000
SHORT_ORIG = ['Madrid', 'Barcelona', 'Londres', 'Dublín', 'Manchester']
U50_ORIG = ['Madrid', 'Londres']


def _gbp():
    try:
        return float(json.load(open(os.path.join('hlc', 'fx.json')))['rates']['GBP'])
    except Exception:
        return 0


def _km_txt(k, en):
    return f'{k:,}' if en else f'{k:,}'.replace(',', '.')


def short_pages(by_orig, en_slug):
    """Escapadas de fin de semana (destinos a menos de 2.000 km) y vuelos por menos de 50 desde Madrid, Barcelona, Londres, Dublín y Manchester.
    Search Console: "show affordable airfare choices for a weekend escape" 134 impr. pos. 6,5; "escapadas fin de semana" sin página propia."""
    urls_es, urls_en = [], []
    gbp = _gbp()
    for o in SHORT_ORIG:
        lst = by_orig.get(o) or by_orig.get(en_names.city_en(o)) or []
        # el mismo precio exacto en 5 o más rutas de una ciudad es sospechoso (ej. 42 € desde Londres y Manchester, nov-2026): no se destaca hasta revisarlo
        _cnt = {}
        for r in lst:
            _cnt[r['price_from']] = _cnt.get(r['price_from'], 0) + 1
        lst = [r for r in lst if _cnt[r['price_from']] < 5]
        near = sorted([r for r in lst if 0 < airport_km(r.get('origin_iata'), r.get('dest_iata')) <= SHORT_KM], key=lambda r: r['price_from'])
        u50 = sorted([r for r in lst if r['price_from'] <= 50], key=lambda r: r['price_from'])
        u50_en = sorted([r for r in lst if (r['price_from'] * gbp <= 50 if (o == 'Londres' and gbp) else r['price_from'] <= 50)], key=lambda r: r['price_from'])
        oe, os_es, os_en = en_names.city_en(o), G.slugify(o), G.slugify(en_names.city_en(o))
        for kind, sel in (('esc', near), ('u50', u50)):
            if kind == 'u50' and o not in U50_ORIG:
                continue
            if len(sel) < 4 or (kind == 'u50' and len(u50_en) < 4):
                continue
            checked = max(((r.get('facts') or {}).get('consultado') or '') for r in sel)
            direct = [r for r in sel if (r.get('facts') or {}).get('escalas_ida') == 0]
            gb = (o == 'Londres' and gbp)
            sel_es = sel
            for en in (False, True):
                sel = u50_en if (kind == 'u50' and en) else sel_es
                checked = max(((r.get('facts') or {}).get('consultado') or '') for r in sel)
                direct = [r for r in sel if (r.get('facts') or {}).get('escalas_ida') == 0]
                T = (lambda a, b: b if en else a)
                on = oe if en else o
                dname = (lambda r: E.NAMES.get(r['dest_slug'], r['dest'])) if en else (lambda r: r['dest'])
                link = (lambda r: f'/en/flights/{en_slug(r)}/') if en else (lambda r: f'/vuelos/{r["slug"]}/')
                money = (lambda v: (f'£{int(round(v * gbp))} (€{v})' if gb else f'€{v}')) if en else (lambda v: f'{v} €')  # ronda 7: arreglado, en ES devolvía la función en vez del precio
                if kind == 'esc':
                    path_es, path_en = f'vuelos/escapadas/desde-{os_es}', f'en/flights/weekend-breaks/from-{os_en}'
                    title = T(f'Escapadas de fin de semana desde {on}: {len(sel)} destinos desde {sel[0]["price_from"]} €',
                              f'Weekend breaks from {on}: {len(sel)} cheap city breaks from {money(sel[0]["price_from"])}')
                    h1 = T(f'Escapadas de fin de semana desde {on}', f'Weekend breaks from {on}')
                    intro = T(f'Destinos a menos de {_km_txt(SHORT_KM, en)} km de {on} (vuelos cortos, buenos para 2 o 3 noches), ordenados por el vuelo de ida y vuelta más barato que hemos encontrado. {len(direct)} con vuelo directo. Precios consultados en Kiwi.com el {fd(checked)}.',
                              f'Destinations less than {_km_txt(SHORT_KM, en)} km from {on} (short flights, good for 2 or 3 nights), sorted by the cheapest return flight we found. {len(direct)} with direct flights. Fares checked on Kiwi.com on {fd(checked, True)}.')
                    qas = [(T(f'¿Cuál es la escapada más barata desde {on}?', f'What is the cheapest weekend break from {on}?'),
                            T(f'En nuestra última consulta, {dname(sel[0])}, con vuelo de ida y vuelta desde {money(sel[0]["price_from"])} ({stops((sel[0].get("facts") or {}).get("escalas_ida"))}). Le siguen ' + ', '.join(f'{dname(r)} ({money(r["price_from"])})' for r in sel[1:4]) + '.',
                              f'In our latest search, {dname(sel[0])}, with a return flight from {money(sel[0]["price_from"])} ({stops((sel[0].get("facts") or {}).get("escalas_ida"), True)}). Then ' + ', '.join(f'{dname(r)} ({money(r["price_from"])})' for r in sel[1:4]) + '.'))]
                    if direct:
                        qas.append((T(f'¿Qué escapadas desde {on} tienen vuelo directo?', f'Which weekend breaks from {on} have direct flights?'),
                                    T('Directos más baratos: ', 'Cheapest direct flights: ') + ', '.join(f'{dname(r)} ({money(r["price_from"])})' for r in direct[:6]) + '.'))
                    airs = {}
                    for r in sel:
                        a_ = ((r.get('facts') or {}).get('aerolinea') or '').strip()
                        if a_ and len(a_) < 40:
                            airs.setdefault(a_, []).append(r['price_from'])
                    if airs:
                        top_ = sorted(airs.items(), key=lambda kv: (-len(kv[1]), min(kv[1])))[:4]
                        qas.append((T(f'¿Qué aerolíneas tienen los vuelos más baratos para una escapada desde {on}?', f'Which airlines have good-value fares for a weekend getaway from {on}?'),
                                    T('Según nuestros datos: ', 'In our data: ') + ', '.join(f'{k} ({len(v)} {T("destinos", "destinations")}, {T("desde", "from")} {money(min(v))})' for k, v in top_) + '.'))
                else:
                    path_es, path_en = f'vuelos/menos-de-50/desde-{os_es}', f'en/flights/under-50/from-{os_en}'
                    cur = T('50 €', '£50' if gb else '€50')
                    title = T(f'Vuelos por menos de 50 € desde {on}: {len(sel)} destinos ida y vuelta', f'Flights under {cur} from {on}: {len(sel)} return destinations')
                    h1 = T(f'Vuelos por menos de 50 € desde {on}', f'Flights under {cur} from {on}')
                    intro = T(f'Destinos con vuelo de ida y vuelta por 50 € o menos desde {on} en nuestra última consulta ({fd(checked)}, Kiwi.com, 1 adulto). Los precios cambian cada día.',
                              f'Destinations with a return flight for {cur} or less from {on} in our latest search ({fd(checked, True)}, Kiwi.com, 1 adult). Prices change every day.' + (' Pounds at the ECB rate.' if gb else ''))
                    qas = [(T(f'¿A dónde se puede volar por menos de 50 € desde {on}?', f'Where can I fly for under {cur} from {on}?'),
                            ', '.join(f'{dname(r)} ({money(r["price_from"])})' for r in sel[:8]) + ('…' if len(sel) > 8 else '.'))]
                    if direct:
                        qas.append((T('¿Cuáles son directos?', 'Which ones are direct?'), ', '.join(dname(r) for r in direct[:8]) + '.'))
                url_es, url_en = f'{SITE}/{path_es}/', f'{SITE}/{path_en}/'
                url = url_en if en else url_es
                crumbs = [(T('Inicio', 'Home'), T('/', '/en/')), (T('Rutas de vuelos', 'Flight routes'), T('/vuelos/', '/en/flights/')),
                          (T(f'Vuelos desde {on}', f'Flights from {on}'), T(f'/vuelos/desde/{os_es}/', f'/en/flights/from/{os_en}/')), (h1, None)]
                desc = G.smart_desc(intro, 160)
                ld = [faq_ld(qas, 'en' if en else 'es-ES'), crumbs_ld(crumbs),
                      {"@type": "ItemList", "name": h1, "numberOfItems": min(len(sel), 20), "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": SITE + link(r), "name": f'{on} → {dname(r)}'} for i, r in enumerate(sel[:20])]}]
                trs = ''.join(f'<tr><th scope="row"><a href="{link(r)}">{e(dname(r))}</a></th><td class="pm-p">{e(money(r["price_from"]))}</td>'
                              f'<td>{_km_txt(airport_km(r.get("origin_iata"), r.get("dest_iata")), en)} km</td><td>{e(stops((r.get("facts") or {}).get("escalas_ida"), en))}</td><td>{e((r.get("facts") or {}).get("aerolinea") or "")}</td></tr>' for r in sel[:20])
                tbl = (f'<div class="pm-scroll"><table class="pm-t"><thead><tr><th scope="col">{T("Destino", "Destination")}</th><th scope="col">{T("Ida y vuelta desde", "Return from")}</th>'
                       f'<th scope="col">{T("Distancia", "Distance")}</th><th scope="col">{T("Escalas", "Stops")}</th><th scope="col">{T("Aerolínea", "Airline")}</th></tr></thead><tbody>{trs}</tbody></table></div>')
                out = page_shell(en, title, desc, url, url_es if en else url_en, ld, 'precios')
                out += (f'<main class="sec" style="padding-top:22px"><div class="wrap">{crumbs_html(crumbs, en)}'
                        f'<div class="kicker">{T("Precios reales, consultados en Kiwi.com", "Real prices, checked on Kiwi.com")}</div><h1 class="x-h1">{e(h1)}</h1>'
                        + QA_BOX(T, qas[0][1]) + f'<p style="font-size:18px;max-width:820px">{e(intro)}</p>' + tbl
                        + f'<div class="hlc-row" style="margin:18px 0 6px"><a class="hlc-btn o" href="{T(f"/vuelos/desde/{os_es}/", f"/en/flights/from/{os_en}/")}">{e(T(f"Todos los destinos desde {on}", f"All destinations from {on}"))}</a>'
                        + f'<a class="hlc-btn s" href="{T("/alertas/", "/en/alerts/")}">{T("🔔 Alerta gratis de chollos", "🔔 Free deal alert")}</a></div>'
                        + f'<h2>{T("Preguntas frecuentes", "FAQ")}</h2><div class="txt guide">' + ''.join(f'<h3>{e(q)}</h3><p>{e(a)}</p>' for q, a in qas) + '</div>'
                        + '</div></main>' + (E.FOOTER if en else '') + '</body></html>')
                write(path_en if en else path_es, out)
                (urls_en if en else urls_es).append((url, checked[:10]))
                SHORT_LABEL['/' + (path_en if en else path_es) + '/'] = h1
    return urls_es, urls_en


# ---------- ronda 5: hubs por país ("flight deals to mexico" 112 impr. pos. 5,4 en una página de ruta) ----------
COUNTRY_LABEL = {}


def country_pages(by_dest, en_slug):
    by_c = {}
    for d, lst in by_dest.items():
        c = (lst[0].get('country') or (lst[0].get('facts') or {}).get('destino_pais') or '').strip()
        c = en_names.COUNTRY_ES_FIX.get(c, c)
        if c:
            by_c.setdefault(c, {})[d] = lst
    urls_es, urls_en, have = [], [], {}
    for c, dd in sorted(by_c.items()):
        cs = G.slugify(c)
        if len(dd) < 2 or cs in dd:
            continue
        allr = sorted([r for l in dd.values() for r in l], key=lambda r: r['price_from'])
        if len(allr) < 4:
            continue
        ce = en_names.country_en(c)
        checked = max(((r.get('facts') or {}).get('consultado') or '') for r in allr)
        cities = sorted(dd.items(), key=lambda kv: min(r['price_from'] for r in kv[1]))
        direct = [r for r in allr if (r.get('facts') or {}).get('escalas_ida') == 0]
        url_es, url_en = f'{SITE}/vuelos/pais/{cs}/', f'{SITE}/en/flights/country/{G.slugify(ce)}/'
        have[cs] = (url_es.replace(SITE, ''), url_en.replace(SITE, ''))
        for en in (False, True):
            T = (lambda a, b: b if en else a)
            cn = (('the ' + ce) if ce in ('United States', 'United Kingdom', 'Netherlands', 'Philippines', 'Dominican Republic', 'United Arab Emirates', 'Maldives', 'Czech Republic') else ce) if en else c
            dname = (lambda r: E.NAMES.get(r['dest_slug'], r['dest'])) if en else (lambda r: r['dest'])
            oname = (lambda r: en_names.city_en(r['origin'])) if en else (lambda r: r['origin'])
            link = (lambda r: f'/en/flights/{en_slug(r)}/') if en else (lambda r: f'/vuelos/{r["slug"]}/')
            hub = (lambda d: f'/en/flights/to/{G.en_dest_slug(d)}/' if os.path.isfile(f'en/flights/to/{G.en_dest_slug(d)}/index.html') else '') if en else (lambda d: f'/vuelos/a/{d}/' if os.path.isfile(f'vuelos/a/{d}/index.html') else '')
            r0 = allr[0]
            title = T(f'Vuelos baratos a {cn}: {len(dd)} ciudades desde {r0["price_from"]} € ({NOW_ES})', f'Flight deals to {cn}: {len(dd)} cities from €{r0["price_from"]} ({NOW_EN})')
            h1 = T(f'Vuelos baratos a {cn}', f'Flight deals to {cn}')
            qa_ = T(f'El vuelo de ida y vuelta más barato a {cn} que encontramos: {r0["price_from"]} € de {oname(r0)} a {dname(r0)} (consulta del {fd((r0.get("facts") or {}).get("consultado"))}). '
                    f'Vigilamos {len(allr)} rutas a {len(dd)} ciudades de {cn}' + (f', {len(direct)} con vuelo directo.' if direct else ', ninguna con directo entre las opciones más baratas.'),
                    f'Cheapest return flight to {cn} we found: €{r0["price_from"]} from {oname(r0)} to {dname(r0)} (search on {fd((r0.get("facts") or {}).get("consultado"), True)}). '
                    f'We track {len(allr)} routes to {len(dd)} cities in {cn}' + (f', {len(direct)} of them direct.' if direct else ', none direct among the cheapest options.'))
            qas = [(T(f'¿Cuánto cuesta un vuelo a {cn}?', f'How much is a flight to {cn}?'), qa_),
                   (T(f'¿A qué ciudad de {cn} es más barato volar?', f'Which city in {cn} is cheapest to fly to?'),
                    ', '.join(f'{dname(l[0])} ({T("desde", "from")} {min(r["price_from"] for r in l)} €)' for _d, l in cities[:5]) + '.')]
            sp = [r for r in allr if (r['origin'] in SPAIN) if not en] or [r for r in allr if r['origin'] in UK_IE and en]
            if sp:
                qas.append((T(f'¿Cuánto cuesta volar a {cn} desde España?', f'How much is a flight to {cn} from the UK or Ireland?'),
                            T('Lo más barato que encontramos: ', 'Cheapest we found: ') + ', '.join(f'{oname(r)} → {dname(r)} ({r["price_from"]} €)' for r in sp[:4]) + '.'))
            crumbs = [(T('Inicio', 'Home'), T('/', '/en/')), (T('Rutas de vuelos', 'Flight routes'), T('/vuelos/', '/en/flights/')), (h1, None)]
            desc = G.smart_desc(T(f'Vuelos a {cn} desde {r0["price_from"]} € ida y vuelta: {len(dd)} ciudades (' + ', '.join(dname(l[0]) for _d, l in cities[:4]) + f') y {len(allr)} rutas con precios reales del {fd(checked)}.',
                                  f'{ce} flights from €{r0["price_from"]} return: {len(dd)} cities (' + ', '.join(dname(l[0]) for _d, l in cities[:4]) + f') and {len(allr)} routes with real fares checked {fd(checked, True)}.'), 160)
            ld = [faq_ld(qas, 'en' if en else 'es-ES'), crumbs_ld(crumbs), page_ld(title, url_en if en else url_es, checked, en)]
            cards = ''.join(f'<tr><th scope="row">' + (f'<a href="{hub(d)}">{e(dname(l[0]))}</a>' if hub(d) else e(dname(l[0]))) + f'</th><td class="pm-p">{min(r["price_from"] for r in l)} €</td><td>{len(l)}</td>'
                            f'<td><a href="{link(min(l, key=lambda r: r["price_from"]))}">{e(oname(min(l, key=lambda r: r["price_from"])))}</a></td></tr>' for d, l in cities)
            ctab = (f'<div class="pm-scroll"><table class="pm-t"><thead><tr><th scope="col">{T("Ciudad", "City")}</th><th scope="col">{T("Desde", "From")}</th><th scope="col">{T("Rutas", "Routes")}</th><th scope="col">{T("Salida más barata", "Cheapest departure")}</th></tr></thead><tbody>{cards}</tbody></table></div>')
            out = page_shell(en, title + ' · Happy Low Cost', desc, url_en if en else url_es, url_es if en else url_en, ld, 'precios')
            out += (f'<main class="sec" style="padding-top:22px"><div class="wrap">{crumbs_html(crumbs, en)}'
                    f'<div class="kicker">{T("Precios reales, consultados en Kiwi.com", "Real prices, checked on Kiwi.com")}</div><h1 class="x-h1">{e(title)}</h1>' + QA_BOX(T, qa_)
                    + f'<h2>{e(T(f"Ciudades de {cn}", f"Cities in {cn}"))}</h2>' + ctab
                    + f'<h2>{e(T(f"Las rutas más baratas a {cn}", f"Cheapest routes to {cn}"))}</h2>' + table(allr[:20], en, T('Ruta', 'Route'), lambda r: f'{oname(r)} → {dname(r)}', link)
                    + f'<p class="pm-note">{e(T(f"Precios de ida y vuelta en clase turista para 1 adulto, consultados en Kiwi.com (última consulta: {fd(checked)}). Cambian cada día.", f"Return economy fares for 1 adult, checked on Kiwi.com (last search: {fd(checked, True)}). They change every day."))}</p>'
                    + src_box(url_en if en else url_es, checked, en)
                    + f'<h2>{T("Preguntas frecuentes", "FAQ")}</h2><div class="txt guide">' + ''.join(f'<h3>{e(q)}</h3><p>{e(a)}</p>' for q, a in qas) + '</div>'
                    + '</div></main>' + (E.FOOTER if en else '') + '</body></html>')
            write(f'en/flights/country/{G.slugify(ce)}' if en else f'vuelos/pais/{cs}', out)
            (urls_en if en else urls_es).append((url_en if en else url_es, checked[:10]))
            COUNTRY_LABEL[(url_en if en else url_es).replace(SITE, '')] = cn
    # enlace desde cada hub de ciudad a su país
    for cs, (ue, un) in have.items():
        for d in by_c_rev(by_c, cs):  # noqa
            cname = d[1]
            _inject(f'vuelos/a/{d[0]}/index.html', f'<nav class="wrap pm-links" aria-label="País"><a href="{ue}">Vuelos baratos a {e(cname)}: todas las ciudades</a></nav>', 'hlc-pais')
            _inject(f'en/flights/to/{G.en_dest_slug(d[0])}/index.html', f'<nav class="wrap pm-links" aria-label="Country"><a href="{un}">Flight deals to {e(en_names.country_en(cname))}: all cities</a></nav>', 'hlc-pais')
    # fuera los países que ya no tienen hub (si una ciudad deja de tener rutas)
    import shutil
    for base, keep in (('vuelos/pais', {v[0].strip('/').rsplit('/', 1)[-1] for v in have.values()}), ('en/flights/country', {v[1].strip('/').rsplit('/', 1)[-1] for v in have.values()})):
        for x in (os.listdir(base) if os.path.isdir(base) else []):
            if x not in keep and os.path.isdir(os.path.join(base, x)):
                shutil.rmtree(os.path.join(base, x))
    json.dump({k: v for k, v in have.items()}, open('vuelos/paises.json', 'w', encoding='utf-8'), ensure_ascii=False)
    return urls_es, urls_en


def by_c_rev(by_c, cs):
    for c, dd in by_c.items():
        if G.slugify(c) == cs:
            return [(d, c) for d in dd]
    return []


def build(rows, en_slug):
    meses = load_meses()
    w = warm(rows, meses, int(os.environ.get('HLC_WARM', '40')))
    by_dest, by_orig = {}, {}
    for r in rows:
        by_dest.setdefault(r['dest_slug'], []).append(r)
        by_orig.setdefault(r['origin'], []).append(r)
    guides = {p.split('/')[1] for p in [x for x in os.popen('ls -d destinos/*/ 2>/dev/null').read().split()]}
    urls_es, urls_en = [], []
    for d, lst in by_dest.items():
        if len(lst) < 3:
            continue
        write(f'vuelos/a/{d}', dest_page(d, lst, meses, False, en_slug, d in guides))
        write(f'en/flights/to/{G.en_dest_slug(d)}', dest_page(d, lst, meses, True, en_slug, d in guides))
        lm = max(((r.get('facts') or {}).get('consultado') or '') for r in lst)[:10]
        urls_es.append((f'{SITE}/vuelos/a/{d}/', lm))
        urls_en.append((f'{SITE}/en/flights/to/{G.en_dest_slug(d)}/', lm))
    for o, lst in by_orig.items():
        if len(lst) < 3:
            continue
        write(f'vuelos/desde/{G.slugify(o)}', orig_page(o, lst, False, en_slug))
        write(f'en/flights/from/{G.slugify(en_names.city_en(o))}', orig_page(o, lst, True, en_slug))
        lm = max(((r.get('facts') or {}).get('consultado') or '') for r in lst)[:10]
        urls_es.append((f'{SITE}/vuelos/desde/{G.slugify(o)}/', lm))
        urls_en.append((f'{SITE}/en/flights/from/{G.slugify(en_names.city_en(o))}/', lm))
    # enlaces: cada ruta -> sus dos páginas de precios; guías de destino -> precios; índice de rutas -> todas
    for r in rows:
        dn, on = r['dest'], r['origin']
        _inject(f'vuelos/{r["slug"]}/index.html', f'<nav class="wrap pm-links" aria-label="Más precios"><a href="/vuelos/a/{r["dest_slug"]}/">Todos los vuelos a {e(dn)}, desde {len(by_dest[r["dest_slug"]])} ciudades</a><a href="/vuelos/desde/{G.slugify(on)}/">Todos los destinos desde {e(on)}</a></nav>')
        dne, one = E.NAMES.get(r['dest_slug'], dn), en_names.city_en(on)
        _inject(f'en/flights/{en_slug(r)}/index.html', f'<nav class="wrap pm-links" aria-label="More prices"><a href="/en/flights/to/{G.en_dest_slug(r["dest_slug"])}/">All flights to {e(dne)}, from {len(by_dest[r["dest_slug"]])} cities</a><a href="/en/flights/from/{G.slugify(one)}/">All destinations from {e(one)}</a></nav>')
    for d, lst in by_dest.items():
        if len(lst) >= 3:
            low = min(x['price_from'] for x in lst)
            top = sorted(lst, key=lambda r: (PREF.index(r['origin']) if r['origin'] in PREF else 99, r['price_from']))[:6]
            top.sort(key=lambda r: r['price_from'])
            rows_es = ''.join(f'<tr><th scope="row"><a href="/vuelos/{r["slug"]}/">{e(r["origin"])}</a></th><td class="pm-p">{r["price_from"]} €</td><td>{e(stops((r.get("facts") or {}).get("escalas_ida")))}</td></tr>' for r in top)
            rows_en = ''.join(f'<tr><th scope="row"><a href="/en/flights/{en_slug(r)}/">{e(en_names.city_en(r["origin"]))}</a></th><td class="pm-p">€{r["price_from"]}</td><td>{e(stops((r.get("facts") or {}).get("escalas_ida"), True))}</td></tr>' for r in top)
            dname, dname_en = lst[0]['dest'], E.NAMES.get(d, lst[0]['dest'])
            nd_, bud_ = DIAS.get(d) or 0, guide_budget_eur(d)
            # España: solo salidas españolas ("Cómo llegar a X desde España"); si no hay 2, la tabla general
            sp = sorted([r for r in lst if r['origin'] in SPAIN], key=lambda r: r['price_from'])
            if len(sp) >= 2:
                ndir = sum(1 for r in sp if (r.get('facts') or {}).get('escalas_ida') == 0)
                rows_sp = ''.join(f'<tr><th scope="row"><a href="/vuelos/{r["slug"]}/">{e(r["origin"])}</a></th><td class="pm-p">{r["price_from"]} €</td><td>{e(stops((r.get("facts") or {}).get("escalas_ida")))}</td><td>{e((r.get("facts") or {}).get("aerolinea") or "")}</td></tr>' for r in sp[:8])
                h_es = (f'<h2>Cómo llegar a {e(dname)} desde España</h2><p>Vuelo de ida y vuelta más barato que encontramos desde {len(sp)} ciudades españolas: desde {sp[0]["price_from"]} € ({e(sp[0]["origin"])})'
                        + (f'; con vuelo directo desde {ndir} de ellas' if ndir else '; ninguna con vuelo directo en la opción más barata') + '.</p>'
                        f'<div class="pm-scroll" style="max-width:720px"><table class="pm-t"><thead><tr><th scope="col">Salida</th><th scope="col">Más barato</th><th scope="col">Escalas</th><th scope="col">Aerolínea</th></tr></thead><tbody>{rows_sp}</tbody></table></div>')
                fl_es, fl_from = sp[0]['price_from'], sp[0]['origin']
            else:
                h_es = (f'<h2>Cuánto cuesta volar a {e(dname)}</h2><p>Lo más barato que encontramos desde las ciudades principales, ida y vuelta (desde {low} €).</p>'
                        f'<div class="pm-scroll" style="max-width:640px"><table class="pm-t"><thead><tr><th scope="col">Salida</th><th scope="col">Más barato</th><th scope="col">Escalas</th></tr></thead><tbody>{rows_es}</tbody></table></div>')
                fl_es, fl_from = low, min(lst, key=lambda r: r['price_from'])['origin']
            cost_es = cost_en = ''
            if nd_ and bud_:
                a_, b_ = fl_es + nd_ * bud_[0], fl_es + nd_ * bud_[1]
                rng = f'Unos {a_} €' if a_ == b_ else f'Entre {a_} y {b_} €'
                cost_es = (f'<h3>Cuánto cuesta un viaje de {nd_} días a {e(dname)}</h3><p>{rng} por persona: vuelo de ida y vuelta desde {fl_es} € (desde {e(fl_from)}) más {nd_} días a '
                           + (f'{bud_[0]} €' if bud_[0] == bud_[1] else f'{bud_[0]}-{bud_[1]} €') + ' al día, el presupuesto más ajustado de esta guía (alojamiento, comida y transporte). Precio del vuelo consultado en Kiwi.com; puede cambiar.</p>')
            _inject(f'destinos/{d}/index.html', f'<section class="sec" style="padding-top:0" id="precios"><div class="wrap">{h_es}{cost_es}'
                    f'<p style="margin-top:12px"><a class="hlc-btn o" href="/vuelos/a/{d}/">Precios desde las {len(lst)} ciudades y el mes más barato</a></p></div></section>')
            # Inglés: Reino Unido e Irlanda ("How to get to X from the UK and Ireland"), con la salida de Londres destacada
            uk = sorted([r for r in lst if r['origin'] in UK_IE], key=lambda r: r['price_from'])
            if uk:
                lon = next((r for r in uk if r['origin'] in ('Londres', 'London')), None)
                rows_uk = ''.join(f'<tr><th scope="row"><a href="/en/flights/{en_slug(r)}/">{e(en_names.city_en(r["origin"]))}</a></th><td class="pm-p">€{r["price_from"]}</td><td>{e(stops((r.get("facts") or {}).get("escalas_ida"), True))}</td><td>{e((r.get("facts") or {}).get("aerolinea") or "")}</td></tr>' for r in uk)
                lon_t = ''
                if lon:
                    fl_ = lon.get('facts') or {}
                    lon_t = (f' From London, the cheapest return flight we found costs €{lon["price_from"]}' + (f' with {e(fl_.get("aerolinea"))}' if fl_.get('aerolinea') else '')
                             + (', nonstop' if fl_.get('escalas_ida') == 0 else '') + '.')
                h_en = (f'<h2>How to get to {e(dname_en)} from the UK and Ireland</h2><p>Cheapest return flights we found from {len(uk)} UK and Irish {"city" if len(uk) == 1 else "cities"}, from €{uk[0]["price_from"]}.{lon_t}</p>'
                        f'<div class="pm-scroll" style="max-width:720px"><table class="pm-t"><thead><tr><th scope="col">From</th><th scope="col">Lowest</th><th scope="col">Stops</th><th scope="col">Airline</th></tr></thead><tbody>{rows_uk}</tbody></table></div>'
                        f'<p>Other departure cities:</p><div class="pm-scroll" style="max-width:640px"><table class="pm-t"><thead><tr><th scope="col">From</th><th scope="col">Lowest</th><th scope="col">Stops</th></tr></thead><tbody>{rows_en}</tbody></table></div>')
                fl_en, fl_from_en = uk[0]['price_from'], en_names.city_en(uk[0]['origin'])
            else:
                h_en = (f'<h2>How much it costs to fly to {e(dname_en)}</h2><p>Cheapest return price we found from the main cities (from €{low}).</p>'
                        f'<div class="pm-scroll" style="max-width:640px"><table class="pm-t"><thead><tr><th scope="col">From</th><th scope="col">Lowest</th><th scope="col">Stops</th></tr></thead><tbody>{rows_en}</tbody></table></div>')
                fl_en, fl_from_en = low, en_names.city_en(min(lst, key=lambda r: r['price_from'])['origin'])
            if nd_ and bud_:
                a_, b_ = fl_en + nd_ * bud_[0], fl_en + nd_ * bud_[1]
                cost_en = (f'<h3>How much a {nd_}-day trip to {e(dname_en)} costs</h3><p>About ' + (f'€{a_}' if a_ == b_ else f'€{a_} to €{b_}') + f' per person: a return flight from €{fl_en} (from {e(fl_from_en)}) plus {nd_} days at '
                           + (f'€{bud_[0]}' if bud_[0] == bud_[1] else f'€{bud_[0]}-{bud_[1]}') + ' a day, the tightest budget in our guide (accommodation, food and transport). Flight price checked on Kiwi.com; it can change.</p>')
            _inject(f'en/destinations/{G.en_dest_slug(d)}/index.html', f'<section class="sec" style="padding-top:0" id="prices"><div class="wrap">{h_en}{cost_en}'
                    f'<p style="margin-top:12px"><a class="hlc-btn o" href="/en/flights/to/{G.en_dest_slug(d)}/">Prices from all {len(lst)} cities</a></p></div></section>')
    cu_es, cu_en = country_pages(by_dest, en_slug)
    urls_es += cu_es
    urls_en += cu_en
    su_es, su_en = short_pages(by_orig, en_slug)
    urls_es += su_es
    urls_en += su_en
    for o in SHORT_ORIG:
        for en in (False, True):
            base = f'/en/flights/from/{G.slugify(en_names.city_en(o))}/' if en else f'/vuelos/desde/{G.slugify(o)}/'
            lk = [(u, t) for u, t in SHORT_LABEL.items() if u.startswith('/en/') == en and u.rstrip('/').endswith('-' + (G.slugify(en_names.city_en(o)) if en else G.slugify(o)))]
            if lk:
                _inject(base.strip('/') + '/index.html', '<nav class="wrap pm-links" aria-label="' + ('More' if en else 'Más') + '">' + ''.join(f'<a href="{u}">{e(t)}</a>' for u, t in lk) + '</nav>', 'hlc-short')
    hu_es, hu_en = holiday_pages(by_orig, en_slug)
    urls_es += hu_es
    urls_en += hu_en
    ds = sorted(by_dest.items(), key=lambda kv: kv[1][0]['dest'])
    os_ = sorted(by_orig.items())
    for en, path in ((False, 'vuelos/index.html'), (True, 'en/flights/index.html')):
        T = (lambda a, b: b if en else a)
        da = ''.join(f'<a class="chip" href="{T("/vuelos/a/" + d + "/", "/en/flights/to/" + G.en_dest_slug(d) + "/")}">{e(E.NAMES.get(d, l[0]["dest"]) if en else l[0]["dest"])}</a>' for d, l in ds if len(l) >= 3)
        oa = ''.join(f'<a class="chip" href="{T("/vuelos/desde/" + G.slugify(o) + "/", "/en/flights/from/" + G.slugify(en_names.city_en(o)) + "/")}">{e(en_names.city_en(o) if en else o)}</a>' for o, l in os_ if len(l) >= 3)
        _inject(path, f'<section class="sec"><div class="wrap"><h2>{T("Precios por destino", "Prices by destination")}</h2><div class="chips pm-chips">{da}</div>'
                      + (f'<h2 style="margin-top:28px">{T("Precios por país", "Prices by country")}</h2><div class="chips pm-chips">' + ''.join(f'<a class="chip" href="{u_[0].replace(SITE, "")}">{e(COUNTRY_LABEL.get(u_[0].replace(SITE, ""), ""))}</a>' for u_ in (cu_en if en else cu_es)) + '</div>' if (cu_en if en else cu_es) else '') +
                      f'<h2 style="margin-top:28px">{T("Precios por ciudad de salida", "Prices by departure city")}</h2><div class="chips pm-chips">{oa}</div>'
                      f'<h2 style="margin-top:28px">{T("Nuestros datos", "Our data")}</h2><div class="chips pm-chips"><a class="chip" href="{T("/vuelos/datos/", "/en/flights/data/")}">{T("Precios de vuelos 2026 por ruta", "Flight prices 2026 by route")}</a>'
                      f'<a class="chip" href="{T("/vuelos/datos/mes-mas-barato/", "/en/flights/data/cheapest-month/")}">{T("Mes más barato por destino", "Cheapest month by destination")}</a>'
                      f'<a class="chip" href="/vuelos/precios-vuelos-2026.csv">CSV</a>'
                      + ''.join(f'<a class="chip" href="{u_}">{e(t_)}</a>' for u_, t_ in HOLI_LINKS[en])
                      + ''.join(f'<a class="chip" href="{u_.replace(SITE, "")}">{e(t_)}</a>' for u_, t_ in ((u[0], SHORT_LABEL.get(u[0].replace(SITE, ''), '')) for u in (su_en if en else su_es)) if t_)
                      + ''.join(f'<a class="chip" href="{T("/vuelos/mes/" + MES_ES[m_ - 1] + "-" + str(y_) + "/", "/en/flights/month/" + MES_EN[m_ - 1].lower() + "-" + str(y_) + "/")}">{T("Vuelos baratos en " + MES_ES[m_ - 1], "Cheap flights in " + MES_EN[m_ - 1])} {y_}</a>'
                                for y_, m_ in [(_today.year + (_today.month - 1 + k) // 12, (_today.month - 1 + k) % 12 + 1) for k in range(1, 4)])
                      + '</div></div></section>')
    home_blocks(by_orig, by_dest, en_slug)
    xmas_blocks(rows, meses, en_slug)
    du_es, du_en = data_pages(rows, meses, en_slug)
    urls_es += du_es
    urls_en += du_en
    print('precios', {'destinos': sum(1 for u in urls_es if '/a/' in u[0]), 'origenes': sum(1 for u in urls_es if '/desde/' in u[0]), 'meses_nuevos': w, 'meses_total': len(meses)})
    return urls_es, urls_en


def cite_meta(page, title, url, date_, en):
    """Ronda 6: etiquetas citation_* (Google Scholar y lectores de citas) en las páginas de datos."""
    m = (f'<meta name="citation_title" content="{e(title)}"><meta name="citation_author" content="Happy Low Cost">'
         f'<meta name="citation_publisher" content="Happy Low Cost"><meta name="citation_date" content="{(date_ or "")[:10].replace("-", "/")}">'
         f'<meta name="citation_public_url" content="{url}"><meta name="citation_language" content="{"en" if en else "es"}">')
    return page.replace('</head>', m + '</head>', 1)


# ---------- ronda 6: puentes y festivos 2027 con escapadas baratas ----------
# Fiestas nacionales 2027: BOE-A-2026-21254 (Resolución de 8 de octubre de 2026, BOE del 13-oct-2026)
ES_HOL_2027 = [
    ('2027-01-01', 'Año Nuevo', "New Year's Day", 'Viernes: fin de semana largo del 1 al 3 de enero.', 'Friday: long weekend from 1 to 3 January.'),
    ('2027-01-06', 'Epifanía del Señor (Reyes)', 'Epiphany', 'Miércoles: cogiendo el jueves 7 y el viernes 8, tienes 5 días (del 6 al 10).', 'Wednesday: taking Thursday 7 and Friday 8 off gives you 5 days (6 to 10 January).'),
    ('2027-03-26', 'Viernes Santo', 'Good Friday', 'Semana Santa: fin de semana largo del 26 al 28 de marzo. El Jueves Santo (25) y el Lunes de Pascua (29) dependen de cada comunidad.', 'Easter: long weekend from 26 to 28 March. Maundy Thursday (25) and Easter Monday (29) depend on each region.'),
    ('2027-05-01', 'Fiesta del Trabajo', 'Labour Day', 'Cae en sábado: no hay puente nacional.', 'Falls on a Saturday: no national long weekend.'),
    ('2027-10-12', 'Fiesta Nacional de España', 'Spanish National Day', 'Martes: cogiendo el lunes 11, tienes 4 días (del 9 al 12).', 'Tuesday: taking Monday 11 off gives you 4 days (9 to 12 October).'),
    ('2027-11-01', 'Todos los Santos', "All Saints' Day", 'Lunes: fin de semana largo del 30 de octubre al 1 de noviembre.', 'Monday: long weekend from 30 October to 1 November.'),
    ('2027-12-06', 'Día de la Constitución', 'Constitution Day', 'Lunes, y el miércoles 8 también es festivo: cogiendo el martes 7, tienes 5 días (del 4 al 8).', 'Monday, and Wednesday 8 is also a holiday: taking Tuesday 7 off gives you 5 days (4 to 8 December).'),
    ('2027-12-08', 'Inmaculada Concepción', 'Immaculate Conception', 'Miércoles: el «acueducto» de diciembre, junto con el 6.', 'Wednesday: the December "bridge" together with the 6th.'),
    ('2027-12-25', 'Navidad', 'Christmas Day', 'Cae en sábado: consulta si tu comunidad traslada algún festivo.', 'Falls on a Saturday: check whether your region moves any holiday.'),
]
# Bank holidays 2027 de Inglaterra y Gales (gov.uk/bank-holidays; Escocia e Irlanda del Norte tienen días distintos)
UK_HOL_2027 = [
    ('2027-01-01', 'Año Nuevo', "New Year's Day", 'Fin de semana largo del 1 al 3 de enero.', 'Long weekend: 1 to 3 January.'),
    ('2027-03-26', 'Viernes Santo', 'Good Friday', 'Con el Lunes de Pascua, 4 días seguidos (26 al 29 de marzo).', 'With Easter Monday, 4 days in a row (26 to 29 March).'),
    ('2027-03-29', 'Lunes de Pascua', 'Easter Monday', 'Fin del puente de Semana Santa (no es festivo en Escocia).', 'End of the Easter weekend (not a bank holiday in Scotland).'),
    ('2027-05-03', 'Early May bank holiday', 'Early May bank holiday', 'Fin de semana largo del 1 al 3 de mayo.', 'Long weekend: 1 to 3 May.'),
    ('2027-05-31', 'Spring bank holiday', 'Spring bank holiday', 'Fin de semana largo del 29 al 31 de mayo.', 'Long weekend: 29 to 31 May.'),
    ('2027-08-30', 'Summer bank holiday', 'Summer bank holiday', 'Fin de semana largo del 28 al 30 de agosto (en Escocia es el 2 de agosto).', 'Long weekend: 28 to 30 August (Scotland has its own date).'),
    ('2027-12-27', 'Navidad (sustituye al sábado 25)', 'Christmas Day (substitute day)', 'Con el 28, del sábado 25 al martes 28 de diciembre: 4 días.', 'With the 28th, from Saturday 25 to Tuesday 28 December: 4 days.'),
    ('2027-12-28', 'Boxing Day (sustituye al domingo 26)', 'Boxing Day (substitute day)', 'Cierra el puente de Navidad.', 'Closes the Christmas break.'),
]
DOW_ES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
DOW_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
HOLI_LINKS = {False: [], True: []}


def holiday_pages(by_orig, en_slug):
    urls_es, urls_en = [], []
    gbp = _gbp()
    HOLI_LINKS[False][:] = []
    HOLI_LINKS[True][:] = []
    specs = [('es', ES_HOL_2027, ['Madrid', 'Barcelona'], 'vuelos/puentes-2027', 'en/flights/spain-bank-holidays-2027',
              'Puentes 2027: festivos nacionales y vuelos baratos para escaparte', 'Spain bank holidays 2027: long weekends and cheap flights',
              'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-21254', 'BOE del 13 de octubre de 2026', 'Spanish Official Gazette (BOE), 13 October 2026'),
             ('uk', UK_HOL_2027, ['Londres', 'Manchester'], 'vuelos/festivos-reino-unido-2027', 'en/flights/uk-bank-holidays-2027',
              'Festivos de Reino Unido 2027: puentes y escapadas baratas', 'UK bank holidays 2027: long weekends and cheap city breaks',
              'https://www.gov.uk/bank-holidays', 'gov.uk', 'gov.uk')]
    for key, hol, origs, p_es, p_en, t_es, t_en, src, src_es, src_en in specs:
        upcoming = [h for h in hol if h[0] >= _today.isoformat()]
        if not upcoming:
            continue
        picks = {}
        for o in origs:
            lst = clean_prices(by_orig.get(o) or [])
            near = sorted([r for r in lst if 0 < airport_km(r.get('origin_iata'), r.get('dest_iata')) <= SHORT_KM], key=lambda r: r['price_from'])
            picks[o] = near[:6]
        checked = max([((r.get('facts') or {}).get('consultado') or '') for l in picks.values() for r in l] or [''])
        for en in (False, True):
            T = (lambda a, b: b if en else a)
            url_es, url_en = f'{SITE}/{p_es}/', f'{SITE}/{p_en}/'
            url = url_en if en else url_es
            title = t_en if en else t_es
            dname = (lambda r: E.NAMES.get(r['dest_slug'], r['dest'])) if en else (lambda r: r['dest'])
            link = (lambda r: f'/en/flights/{en_slug(r)}/') if en else (lambda r: f'/vuelos/{r["slug"]}/')
            def money(o, v):
                if en and o in ('Londres', 'Manchester') and gbp:
                    return f'£{int(round(v * gbp))} (€{v})'
                return f'€{v}' if en else f'{v} €'
            def dlabel(iso):
                d_ = datetime.date.fromisoformat(iso)
                return f'{DOW_EN[d_.weekday()]} {d_.day} {MES_EN[d_.month - 1]}' if en else f'{DOW_ES[d_.weekday()]} {d_.day} de {MES_ES[d_.month - 1]}'
            if key == 'es':
                lead = T(f'España tiene 9 fiestas nacionales en 2027 (BOE del 13 de octubre de 2026). Siete caen en lunes, martes, miércoles o viernes y dan para puente: el mejor, el de diciembre, con 5 días cogiendo solo el martes 7. Cada comunidad añade sus propios festivos.',
                         'Spain has 9 national public holidays in 2027 (Official Gazette, 13 October 2026). Seven fall on a Monday, Tuesday, Wednesday or Friday and make a long weekend: the best is in December, with 5 days off for just one day of leave on Tuesday 7. Each region adds its own holidays.')
            else:
                lead = T('Inglaterra y Gales tienen 8 bank holidays en 2027, todos en día laborable: seis fines de semana largos, con 4 días seguidos en Semana Santa (26 al 29 de marzo) y en Navidad (25 al 28 de diciembre). Escocia e Irlanda del Norte tienen algunos días distintos.',
                         'England and Wales have 8 bank holidays in 2027, all on weekdays: six long weekends, with 4 days in a row at Easter (26 to 29 March) and Christmas (25 to 28 December). Scotland and Northern Ireland have some different days.')
            nxt = upcoming[0]
            qa_ = T(f'Próximo festivo: {nxt[1]}, {dlabel(nxt[0])}. {nxt[3]}', f'Next holiday: {nxt[2]}, {dlabel(nxt[0])}. {nxt[4]}')
            trs = ''.join(f'<tr><th scope="row"><time datetime="{h[0]}">{e(dlabel(h[0]))}</time></th><td>{e(h[2] if en else h[1])}</td><td>{e(h[4] if en else h[3])}</td></tr>' for h in hol)
            tab = (f'<div class="pm-scroll"><table class="pm-t"><thead><tr><th scope="col">{T("Fecha", "Date")}</th><th scope="col">{T("Festivo", "Holiday")}</th><th scope="col">{T("Puente", "Long weekend")}</th></tr></thead><tbody>{trs}</tbody></table></div>')
            fl = ''
            for o, l in picks.items():
                if len(l) < 3:
                    continue
                on = en_names.city_en(o) if en else o
                esc = (f'/en/flights/weekend-breaks/from-{G.slugify(en_names.city_en(o))}/' if en else f'/vuelos/escapadas/desde-{G.slugify(o)}/')
                fl += (f'<h3>{T("Escapadas desde " + on, "City breaks from " + on)}</h3><ul>' + ''.join(f'<li><a href="{link(r)}">{e(dname(r))}</a>: {T("desde", "from")} {money(o, r["price_from"])}' + (T(', directo', ', direct') if (r.get('facts') or {}).get('escalas_ida') == 0 else '') + '</li>' for r in l)
                       + f'</ul><p><a href="{esc}">{T("Todas las escapadas desde " + on, "All weekend breaks from " + on)}</a></p>')
            if fl:
                fl = (f'<h2>{T("Vuelos baratos para los puentes", "Cheap flights for the long weekends")}</h2><p class="pm-note">{e(T(f"Vuelo de ida y vuelta más barato que encontramos a menos de 2.000 km (consulta del {fd(checked)}, no necesariamente en esas fechas). Los precios cambian cada día.", f"Cheapest return flight we found under 2,000 km (search on {fd(checked, True)}, not necessarily on those dates). Prices change every day."))}</p>' + fl)
            qas = [(T('¿Cuántos festivos hay en 2027?', 'How many bank holidays are there in 2027?'), lead),
                   (T('¿Cuál es el próximo puente?', 'When is the next long weekend?'), qa_)]
            months = sorted({h[0][:7] for h in upcoming})[:3]
            mlinks = ''.join(f'<a class="chip" href="{T("/vuelos/mes/" + MES_ES[int(m[5:]) - 1] + "-" + m[:4] + "/", "/en/flights/month/" + MES_EN[int(m[5:]) - 1].lower() + "-" + m[:4] + "/")}">{T("Vuelos baratos en " + MES_ES[int(m[5:]) - 1], "Cheap flights in " + MES_EN[int(m[5:]) - 1])} {m[:4]}</a>'
                             for m in months if os.path.isdir(T('vuelos/mes/' + MES_ES[int(m[5:]) - 1] + '-' + m[:4], 'en/flights/month/' + MES_EN[int(m[5:]) - 1].lower() + '-' + m[:4])))
            crumbs = [(T('Inicio', 'Home'), T('/', '/en/')), (T('Rutas de vuelos', 'Flight routes'), T('/vuelos/', '/en/flights/')), (title.split(':')[0], None)]
            desc = G.smart_desc(lead, 160)
            ld = [faq_ld(qas, 'en' if en else 'es-ES'), crumbs_ld(crumbs), page_ld(title, url, checked, en)]
            out = page_shell(en, title + ' · Happy Low Cost', desc, url, url_es if en else url_en, ld, 'precios')
            out += (f'<main class="sec" style="padding-top:22px"><div class="wrap">{crumbs_html(crumbs, en)}<div class="kicker">{T("Calendario 2027", "2027 calendar")}</div><h1 class="x-h1">{e(title)}</h1>'
                    + QA_BOX(T, qa_) + f'<p style="font-size:18px;max-width:820px">{e(lead)}</p>'
                    + f'<h2>{T("Calendario de festivos 2027", "2027 bank holiday calendar")}</h2>' + tab
                    + f'<p class="pm-src" style="font-size:14px;color:#555;overflow-wrap:anywhere">{T("Fuente", "Source")}: <a href="{src}" rel="nofollow noopener">{e(src_en if en else src_es)}</a>.' + T(' Faltan los festivos autonómicos y locales.', '') + '</p>'
                    + fl + (f'<div class="chips pm-chips" style="margin-top:14px">{mlinks}</div>' if mlinks else '')
                    + f'<div class="hlc-row" style="margin:18px 0"><a class="hlc-btn" href="{T("/alertas/", "/en/alerts/")}">{T("Avísame de chollos para el puente", "Alert me to deals for the long weekend")}</a></div>'
                    + f'<h2>{T("Preguntas frecuentes", "FAQ")}</h2><div class="txt guide">' + ''.join(f'<h3>{e(q)}</h3><p>{e(a)}</p>' for q, a in qas) + '</div>'
                    + '</div></main>' + (E.FOOTER if en else '') + '</body></html>')
            write(p_en if en else p_es, out)
            (urls_en if en else urls_es).append((url, checked[:10]))
            HOLI_LINKS[en].append((url.replace(SITE, ''), title.split(':')[0]))
    return urls_es, urls_en


# ---------- páginas de datos propios (citables por buscadores y asistentes) ----------
def data_pages(rows, meses, en_slug):
    """/vuelos/datos/ y /en/flights/data/: precio más bajo y mediana por ruta desde España, con Dataset y CSV (CC BY 4.0).
    /vuelos/datos/mes-mas-barato/ y /en/flights/data/cheapest-month/: el mes más barato para volar a cada destino (vuelos/meses.json)."""
    import csv, io
    lic = 'https://creativecommons.org/licenses/by/4.0/'
    yr = _today.year
    checked = max(((r.get('facts') or {}).get('consultado') or '') for r in rows)[:10]
    # CSV con todas las rutas
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(['origin', 'origin_iata', 'destination', 'destination_iata', 'country', 'price_from_eur_return', 'usual_price_eur_return_median', 'stops_cheapest', 'airline_cheapest', 'checked_on', 'url_es', 'url_en'])
    for r in sorted(rows, key=lambda r: (r['origin'], r['dest'])):
        f = r.get('facts') or {}
        w.writerow([r['origin'], r.get('origin_iata'), r['dest'], r.get('dest_iata'), r.get('country'), r['price_from'], f.get('mediana_ida_y_vuelta_eur') or '', '' if f.get('escalas_ida') is None else f.get('escalas_ida'),
                    f.get('aerolinea') or '', (f.get('consultado') or '')[:10], f'{SITE}/vuelos/{r["slug"]}/', f'{SITE}/en/flights/{en_slug(r)}/'])
    open(f'vuelos/precios-vuelos-{yr}.csv', 'w', encoding='utf-8', newline='').write(buf.getvalue())
    csv_url = f'{SITE}/vuelos/precios-vuelos-{yr}.csv'
    sp = sorted([r for r in rows if r['origin'] in SPAIN], key=lambda r: (SPAIN.index(r['origin']), r['price_from']))
    meds = [x for x in ((r.get('facts') or {}).get('mediana_ida_y_vuelta_eur') for r in sp) if x]
    out_es, out_en = [], []
    for en in (False, True):
        T = (lambda a, b: b if en else a)
        url_es, url_en = f'{SITE}/vuelos/datos/', f'{SITE}/en/flights/data/'
        url = url_en if en else url_es
        dname = (lambda r: E.NAMES.get(r['dest_slug'], r['dest'])) if en else (lambda r: r['dest'])
        oname = (lambda r: en_names.city_en(r['origin'])) if en else (lambda r: r['origin'])
        link = (lambda r: f'/en/flights/{en_slug(r)}/') if en else (lambda r: f'/vuelos/{r["slug"]}/')
        title = T(f'Precios de vuelos desde España {yr} por ruta', f'Flight prices from Spain {yr} by route')
        below = [r for r in sp if (r.get('facts') or {}).get('mediana_ida_y_vuelta_eur')]
        lead = T(f'{len(sp)} rutas de ida y vuelta desde {len({r["origin"] for r in sp})} aeropuertos españoles, con el precio más bajo que encontramos y el habitual (mediana) de cada una. '
                 + (f'La mediana de los precios habituales de todas las rutas es de {int(statistics.median(meds))} €. ' if meds else '') + f'Última consulta: {fd(checked)}. Datos de Happy Low Cost con licencia CC BY 4.0.',
                 f'{len(sp)} return routes from {len({r["origin"] for r in sp})} Spanish airports, with the cheapest fare we found and the usual (median) fare for each. '
                 + (f'The median of the usual fares across all routes is {int(statistics.median(meds))} €. ' if meds else '') + f'Last search: {fd(checked, True)}. Happy Low Cost data, licensed CC BY 4.0.')
        ds = {"@type": "Dataset", "name": title, "description": lead, "url": url, "license": lic, "isAccessibleForFree": True, "inLanguage": "en" if en else "es-ES",
              "creator": {"@id": G.ORG_ID}, "publisher": {"@id": G.ORG_ID}, "dateModified": checked, "temporalCoverage": f"{yr}", "spatialCoverage": T("España", "Spain"),
              "keywords": T(["vuelos baratos", "precios de vuelos", "España"], ["cheap flights", "flight prices", "Spain"]),
              "variableMeasured": T(["precio más bajo ida y vuelta (EUR)", "precio habitual, mediana (EUR)", "escalas", "aerolínea"], ["lowest return fare (EUR)", "usual fare, median (EUR)", "stops", "airline"]),
              "distribution": [{"@type": "DataDownload", "encodingFormat": "text/csv", "contentUrl": csv_url}, {"@type": "DataDownload", "encodingFormat": "application/json", "contentUrl": f"{SITE}{T('/vuelos/feed.json', '/en/flights/feed.json')}"}]}
        crumbs = [(T('Inicio', 'Home'), T('/', '/en/')), (T('Rutas de vuelos', 'Flight routes'), T('/vuelos/', '/en/flights/')), (T('Datos', 'Data'), None)]
        trs = ''
        for r in sp:
            f = r.get('facts') or {}
            med = f.get('mediana_ida_y_vuelta_eur')
            pc = f'-{int(round((1 - r["price_from"] / med) * 100))} %' if med and med > r['price_from'] else '–'
            trs += (f'<tr data-q="{e(G.slugify(oname(r) + " " + dname(r)))}"><th scope="row"><a href="{link(r)}">{e(oname(r))} → {e(dname(r))}</a></th><td class="pm-p">{r["price_from"]} €</td>'
                    f'<td>{(str(med) + " €") if med else "–"}</td><td>{pc}</td><td>{e(stops(f.get("escalas_ida"), en))}</td><td>{e(f.get("aerolinea") or "")}</td><td>{e(fd(f.get("consultado"), en))}</td></tr>')
        tbl = (f'<div class="pm-scroll"><table class="pm-t"><thead><tr><th scope="col">{T("Ruta", "Route")}</th><th scope="col">{T("Más barato", "Lowest")}</th><th scope="col">{T("Habitual", "Usual")}</th>'
               f'<th scope="col">{T("Diferencia", "Difference")}</th><th scope="col">{T("Escalas", "Stops")}</th><th scope="col">{T("Aerolínea", "Airline")}</th><th scope="col">{T("Consulta", "Checked")}</th></tr></thead><tbody>{trs}</tbody></table></div>')
        cite = T(f'Cómo citarlo: «Happy Low Cost, Precios de vuelos desde España {yr}, {url_es}, consultado el {fd(checked)}».', f'How to cite: "Happy Low Cost, Flight prices from Spain {yr}, {url_en}, retrieved {fd(checked, True)}".')
        page = page_shell(en, title, G.smart_desc(lead), url, url_es if en else url_en, [ds, crumbs_ld(crumbs)], 'precios')
        page = cite_meta(page, title, url, checked, en)
        page += (f'<main class="sec" style="padding-top:22px"><div class="wrap">{crumbs_html(crumbs, en)}<div class="kicker">{T("Datos propios", "Our own data")}</div><h1 class="x-h1">{e(title)}</h1>'
                 + QA_BOX(T, lead) +
                 f'<div class="hlc-row" style="margin:14px 0"><a class="hlc-btn o" href="/vuelos/precios-vuelos-{yr}.csv" download>{T("Descargar CSV (todas las rutas)", "Download CSV (all routes)")}</a>'
                 f'<a class="hlc-btn o" href="{T("/vuelos/datos/mes-mas-barato/", "/en/flights/data/cheapest-month/")}">{T("Mes más barato por destino", "Cheapest month by destination")}</a></div>'
                 f'<input type="search" class="pm-q" placeholder="{T("Filtra por ciudad", "Filter by city")}" aria-label="{T("Filtrar", "Filter")}">' + tbl
                 + f'<p class="pm-note">{e(T("Precios de ida y vuelta en clase turista para 1 adulto, consultados en Kiwi.com. Habitual es la mediana de los precios que vimos para esa ruta. Diferencia es cuánto más barato es el precio más bajo frente al habitual.", "Return economy fares for 1 adult, checked on Kiwi.com. Usual is the median of the prices we saw for that route. Difference is how much cheaper the lowest fare is than the usual one."))}</p>'
                 + f'<p class="pm-note">{e(cite)} {T("Licencia", "Licence")}: <a href="{lic}" rel="license">CC BY 4.0</a>.</p>'
                 + '</div></main>' + FILTER_JS + (E.FOOTER if en else '') + '</body></html>')
        write('en/flights/data' if en else 'vuelos/datos', page)
        (out_en if en else out_es).append((url, checked))

        # ---- mes más barato por destino ----
        best = {}
        for r in rows:
            mm = [m for m in ((meses.get(r['slug']) or {}).get('m') or []) if m[1] and m[0] >= _today.strftime('%Y-%m')]
            if len(mm) < 3:
                continue
            b = min(mm, key=lambda m: m[1])
            if r['dest_slug'] not in best or b[1] < best[r['dest_slug']][1][1]:
                best[r['dest_slug']] = (r, b, meses[r['slug']]['t'])
        if not best:
            continue
        url2_es, url2_en = f'{SITE}/vuelos/datos/mes-mas-barato/', f'{SITE}/en/flights/data/cheapest-month/'
        url2 = url2_en if en else url2_es
        t2 = max(v[2] for v in best.values())[:10]
        title2 = T(f'El mes más barato para volar a cada destino ({NOW_ES})', f'The cheapest month to fly to each destination ({NOW_EN})')
        lead2 = T(f'Para {len(best)} destinos, el mes de los próximos seis con el vuelo de ida y vuelta más barato que hemos encontrado, y desde qué ciudad. Sale de nuestro calendario de precios (Kiwi.com), que se actualiza cada pocos días; última consulta: {fd(t2)}.',
                  f'For {len(best)} destinations, the month in the next six with the cheapest return flight we found, and from which city. It comes from our price calendar (Kiwi.com), refreshed every few days; last search: {fd(t2, True)}.')
        items = sorted(best.items(), key=lambda kv: (dname(kv[1][0])))
        trs2 = ''.join(f'<tr data-q="{e(G.slugify(dname(r) + " " + oname(r)))}"><th scope="row"><a href="{T("/vuelos/a/" + d + "/", "/en/flights/to/" + G.en_dest_slug(d) + "/") if len([x for x in rows if x["dest_slug"] == d]) >= 3 else link(r)}">{e(dname(r))}</a></th>'
                       f'<td>{e(mname(b[0], en))}</td><td class="pm-p">{b[1]} €</td><td><a href="{link(r)}">{e(oname(r))}</a></td><td>{e(b[2] or "")}</td></tr>' for d, (r, b, t) in items)
        tbl2 = (f'<div class="pm-scroll"><table class="pm-t"><thead><tr><th scope="col">{T("Destino", "Destination")}</th><th scope="col">{T("Mes más barato", "Cheapest month")}</th><th scope="col">{T("Precio", "Fare")}</th>'
                f'<th scope="col">{T("Desde", "From")}</th><th scope="col">{T("Aerolínea", "Airline")}</th></tr></thead><tbody>{trs2}</tbody></table></div>')
        ds2 = dict(ds, name=title2, description=lead2, url=url2, dateModified=t2, distribution=[{"@type": "DataDownload", "encodingFormat": "application/json", "contentUrl": f"{SITE}/vuelos/meses.json"}],
                   variableMeasured=T(["mes más barato", "precio ida y vuelta (EUR)"], ["cheapest month", "return fare (EUR)"]))
        crumbs2 = crumbs[:2] + [(T('Datos', 'Data'), T('/vuelos/datos/', '/en/flights/data/')), (T('Mes más barato', 'Cheapest month'), None)]
        page = page_shell(en, title2, G.smart_desc(lead2), url2, url2_es if en else url2_en, [ds2, crumbs_ld(crumbs2)], 'precios')
        page = cite_meta(page, title2, url2, t2, en)
        page += (f'<main class="sec" style="padding-top:22px"><div class="wrap">{crumbs_html(crumbs2, en)}<div class="kicker">{T("Datos propios", "Our own data")}</div><h1 class="x-h1">{e(title2)}</h1>'
                 + QA_BOX(T, lead2) + f'<input type="search" class="pm-q" placeholder="{T("Filtra por destino", "Filter by destination")}" aria-label="{T("Filtrar", "Filter")}">' + tbl2.replace('class="pm-t"', 'class="pm-t pm-x"')
                 + f'<p class="pm-note">{e(T("Precio de ida y vuelta en clase turista para 1 adulto. Un mes más barato no garantiza ese precio en todas sus fechas.", "Return economy fare for 1 adult. A cheaper month does not guarantee that fare on every date."))} '
                 f'{T("Datos de Happy Low Cost con licencia", "Happy Low Cost data, licensed")} <a href="{lic}" rel="license">CC BY 4.0</a>.</p>'
                 + '</div></main>' + FILTER_JS.replace('.pm-t:not(.pm-m) tbody tr', '.pm-t tbody tr') + (E.FOOTER if en else '') + '</body></html>')
        write('en/flights/data/cheapest-month' if en else 'vuelos/datos/mes-mas-barato', page)
        (out_en if en else out_es).append((url2, t2))

        # ---- vuelos baratos por mes (los tres próximos): el precio más bajo de cada destino en ese mes, de nuestro calendario ----
        base_m = 'en/flights/month' if en else 'vuelos/mes'
        keep_m = set()
        for k in range(1, 4):
            y_, m_ = _today.year + (_today.month - 1 + k) // 12, (_today.month - 1 + k) % 12 + 1
            ym = f'{y_}-{m_:02d}'
            slug_m = (MES_EN[m_ - 1].lower() if en else MES_ES[m_ - 1]) + f'-{y_}'
            keep_m.add(slug_m)
            pool = [r for r in rows if (en or r['origin'] in SPAIN)]
            bym = {}
            for r in pool:
                pm = next((m[1] for m in ((meses.get(r['slug']) or {}).get('m') or []) if m[0] == ym and m[1]), None)
                if pm and (r['dest_slug'] not in bym or pm < bym[r['dest_slug']][1]):
                    bym[r['dest_slug']] = (r, pm)
            if len(bym) < 10:
                continue
            lst_m = sorted(bym.values(), key=lambda v: v[1])
            mn = T(f'{MES_ES[m_ - 1]} de {y_}', f'{MES_EN[m_ - 1]} {y_}')
            url3_es, url3_en = f'{SITE}/vuelos/mes/{MES_ES[m_ - 1]}-{y_}/', f'{SITE}/en/flights/month/{MES_EN[m_ - 1].lower()}-{y_}/'
            url3 = url3_en if en else url3_es
            u100 = sum(1 for v in lst_m if v[1] < 100)
            title3 = T(f'Vuelos baratos en {MES_ES[m_ - 1]} {y_}: {len(lst_m)} destinos desde {lst_m[0][1]} €', f'Cheap flights in {mn}: {len(lst_m)} destinations from €{lst_m[0][1]}')
            lead3 = T(f'El vuelo de ida y vuelta más barato que encontramos para {mn} a cada destino, saliendo de España: {", ".join(f"{dname(r)} ({p} € desde {oname(r)})" for r, p in lst_m[:3])}. '
                      f'{u100} destinos por menos de 100 €. Sale de nuestro calendario de precios (Kiwi.com), que se actualiza cada pocos días.',
                      f'The cheapest return flight we found for {mn} to each destination: {", ".join(f"{dname(r)} (€{p} from {oname(r)})" for r, p in lst_m[:3])}. '
                      f'{u100} destinations under €100. From our price calendar (Kiwi.com), refreshed every few days.')
            trs3 = ''.join(f'<tr data-q="{e(G.slugify(dname(r) + " " + oname(r)))}"><th scope="row"><a href="{link(r)}">{e(dname(r))}</a></th><td class="pm-p">{p} €</td><td>{e(oname(r))}</td></tr>' for r, p in lst_m[:80])
            tbl3 = (f'<div class="pm-scroll"><table class="pm-t pm-x"><thead><tr><th scope="col">{T("Destino", "Destination")}</th><th scope="col">{T("Desde", "From")} ({e(mn)})</th><th scope="col">{T("Salida", "Departure")}</th></tr></thead><tbody>{trs3}</tbody></table></div>')
            other = ''.join(f'<a class="chip" href="/{base_m}/{s_}/">{e(s_.replace("-", " ").capitalize())}</a>' for s_ in [(MES_EN[((_today.month - 1 + j) % 12)].lower() if en else MES_ES[((_today.month - 1 + j) % 12)]) + f'-{_today.year + (_today.month - 1 + j) // 12}' for j in range(1, 4)] if s_ != slug_m)
            qas3 = [(T(f'¿Cuál es el destino más barato para volar en {mn}?', f'What is the cheapest destination to fly to in {mn}?'),
                     T(f'En nuestro calendario, {dname(lst_m[0][0])}: ida y vuelta desde {lst_m[0][1]} € saliendo de {oname(lst_m[0][0])}.', f'In our calendar, {dname(lst_m[0][0])}: return from €{lst_m[0][1]} from {oname(lst_m[0][0])}.')),
                    (T(f'¿Cuántos destinos hay por menos de 100 € en {mn}?', f'How many destinations are under €100 in {mn}?'),
                     T(f'{u100} de los {len(lst_m)} destinos que vigilamos tienen vuelo de ida y vuelta por menos de 100 € en {mn}.', f'{u100} of the {len(lst_m)} destinations we track have a return flight under €100 in {mn}.'))]
            crumbs3 = crumbs[:2] + [(T('Vuelos baratos en ' + mn, 'Cheap flights in ' + mn), None)]
            page = page_shell(en, title3, G.smart_desc(lead3, 160), url3, url3_es if en else url3_en, [faq_ld(qas3, 'en' if en else 'es-ES'), crumbs_ld(crumbs3)], 'precios')
            page += (f'<main class="sec" style="padding-top:22px"><div class="wrap">{crumbs_html(crumbs3, en)}<div class="kicker">{T("Precios reales, consultados en Kiwi.com", "Real prices, checked on Kiwi.com")}</div><h1 class="x-h1">{e(title3)}</h1>'
                     + QA_BOX(T, lead3) + f'<input type="search" class="pm-q" placeholder="{T("Filtra por destino", "Filter by destination")}" aria-label="{T("Filtrar", "Filter")}">' + tbl3
                     + f'<p class="pm-note">{e(T("Precio de ida y vuelta en clase turista para 1 adulto, el más bajo que vimos para alguna fecha de ese mes. Puede cambiar.", "Return economy fare for 1 adult, the lowest we saw for some date in that month. It can change."))}</p>'
                     + f'<h2>{T("Otros meses", "Other months")}</h2><div class="chips">{other}<a class="chip" href="{T("/vuelos/datos/mes-mas-barato/", "/en/flights/data/cheapest-month/")}">{T("Mes más barato por destino", "Cheapest month by destination")}</a></div>'
                     + '<h2>' + T('Preguntas frecuentes', 'FAQ') + '</h2>' + ''.join(f'<details><summary>{e(q)}</summary><p>{e(a)}</p></details>' for q, a in qas3)
                     + '</div></main>' + FILTER_JS.replace('.pm-t:not(.pm-m) tbody tr', '.pm-t tbody tr') + (E.FOOTER if en else '') + '</body></html>')
            write(f'{base_m}/{slug_m}', page)
            (out_en if en else out_es).append((url3, t2))
        if os.path.isdir(base_m):
            import shutil
            for d_ in os.listdir(base_m):
                if d_ not in keep_m and os.path.isdir(os.path.join(base_m, d_)):
                    shutil.rmtree(os.path.join(base_m, d_))
    return out_es, out_en
