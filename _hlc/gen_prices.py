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


def QA_BOX(T, txt):
    return (f'<p class="qa" style="background:#FFF6E0;border-left:4px solid #FFC531;padding:12px 14px;border-radius:10px;max-width:820px">'
            f'<b>{T("Respuesta rápida:", "Quick answer:")}</b> {e(txt)}</p>')


def _hotel(city, en):
    from urllib.parse import quote
    host = 'searchresults.en-gb.html' if en else 'searchresults.es.html'
    return f'https://www.kqzyfj.com/click-101900924-17288959?sid=happylowcost-precios&url={quote(f"https://www.booking.com/{host}?ss={city}", safe="")}'


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
    # descripción para el clic (CTR): precio, ciudades, directos, mes más barato y fecha de consulta
    if en:
        desc = (f'{name} flights from €{r1["price_from"]} return ({oname(r1)})' + (f' and €{r0["price_from"]} from {oname(r0)}' if r0 is not r1 else '')
                + f'. {len(lst)} departure cities, {len(direct)} direct.' + (f' Cheapest month: {mname(best[1], True)}.' if best else '') + f' Fares checked {fd(checked, True)}.')
    else:
        desc = (f'Vuelos a {name} desde {r0["price_from"]} € ida y vuelta ({oname(r0)}). {len(lst)} ciudades de salida, {len(direct)} con directo.'
                + (f' Mes más barato: {mname(best[1])}.' if best else '') + f' Precios del {fd(checked)}.')
    desc = G.smart_desc(desc, 160)
    ld = [faq_ld(qas, 'en' if en else 'es-ES'), crumbs_ld(crumbs)]
    T = (lambda a, b: b if en else a)
    stats = (f'<div class="pm-stats"><div><b>{r0["price_from"]} €</b><span>{T("lo más barato que encontramos", "cheapest we found")}</span></div>'
             + (f'<div><b>{int(statistics.median(meds))} €</b><span>{T("precio habitual (mediana)", "usual price (median)")}</span></div>' if meds else '')
             + f'<div><b>{len(direct)}</b><span>{T("ciudades con vuelo directo", "cities with direct flights")}</span></div><div><b>{len(lst)}</b><span>{T("ciudades de salida", "departure cities")}</span></div></div>')
    # respuesta rápida: 2-3 frases citables con precio, directos y mes más barato
    if en:
        qa_ = (f'Cheapest return flight to {name} we found from {oname(r1)}: {r1["price_from"]} € (search on {fd(f1.get("consultado"), True)})' + (f'; from any city, {r0["price_from"]} € from {oname(r0)}. ' if r1 is not r0 else '. ')
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
            + QA_BOX(T, qa_) +
            f'<p style="font-size:18px;max-width:820px">{e(lead)}</p>{stats}'
            f'<div class="hlc-row" style="margin:18px 0 6px">{gl}{hot}<a class="hlc-btn o" href="{T("/alertas/", "/en/deals/")}">{T("Avísame de chollos a " + name, "Today’s deals")}</a></div>'
            f'<h2>{T("Precio desde cada ciudad", "Price from each city")}</h2><input type="search" class="pm-q" placeholder="{T("Filtra por ciudad de salida", "Filter by departure city")}" aria-label="{T("Filtrar", "Filter")}">'
            + table(lst, en, T('Salida', 'Departure'), oname, link)
            + f'<p class="pm-note">{e(T(f"Precios de ida y vuelta en clase turista para 1 adulto, consultados en Kiwi.com (última consulta: {fd(checked)}). Habitual es la mediana de los precios que vimos. Los precios cambian cada día.", f"Return prices in economy for 1 adult, checked on Kiwi.com (last search: {fd(checked, True)}). Usual is the median of the prices we saw. Prices change every day."))}</p>'
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
        title = f'Cheapest flights from {oname}: {len(lst)} destinations from €{lst[0]["price_from"]} ({NOW_EN})'
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
    ld = [faq_ld(qas, 'en' if en else 'es-ES'), crumbs_ld(crumbs)]
    d0 = direct[0] if direct else None
    if en:
        qa_ = (f'The cheapest return flight from {oname} we found goes to {dname(lst[0])} for {lst[0]["price_from"]} € (search on {fd(checked, True)}). '
               f'{len(under)} of the {len(lst)} destinations we track cost under 100 € return' + (f', and the cheapest direct flight is to {dname(d0)} ({d0["price_from"]} €).' if d0 else '.'))
    else:
        qa_ = (f'El vuelo de ida y vuelta más barato desde {oname} que encontramos va a {dname(lst[0])} por {lst[0]["price_from"]} € (consulta del {fd(checked)}). '
               f'{len(under)} de los {len(lst)} destinos que vigilamos cuestan menos de 100 € ida y vuelta' + (f', y el directo más barato es a {dname(d0)} ({d0["price_from"]} €).' if d0 else '.'))
    out = page_shell(en, title + ' · Happy Low Cost', desc, url, url_es if en else url_en, ld, 'precios')
    out += (f'<main class="sec" style="padding-top:22px"><div class="wrap">{crumbs_html(crumbs, en)}'
            f'<div class="kicker">{T("Precios reales, consultados en Kiwi.com", "Real prices, checked on Kiwi.com")}</div><h1 class="x-h1">{e(title)}</h1>'
            + QA_BOX(T, qa_) +
            f'<p style="font-size:18px;max-width:820px">{e(lead)}</p>'
            f'<div class="pm-stats"><div><b>{lst[0]["price_from"]} €</b><span>{T("el destino más barato", "cheapest destination")}</span></div><div><b>{len(under)}</b><span>{T("destinos por menos de 100 €", "destinations under 100 €")}</span></div><div><b>{len(direct)}</b><span>{T("con vuelo directo", "with direct flights")}</span></div><div><b>{len(lst)}</b><span>{T("destinos", "destinations")}</span></div></div>'
            f'<div class="hlc-row" style="margin:18px 0 6px"><a class="hlc-btn o" href="{T("/chollos/?aero=" + os_, "/en/deals/")}">{T("Chollos de hoy desde " + oname, "Today’s deals")}</a>' + ('' if en else '<a class="hlc-btn o" href="/alertas/">Crear alerta gratis</a>') + '</div>'
            + budget_blocks(lst, en, dname, link)
            + f'<h2>{T("Precio a cada destino", "Price to each destination")}</h2><input type="search" class="pm-q" placeholder="{T("Filtra por destino", "Filter by destination")}" aria-label="{T("Filtrar", "Filter")}">'
            + table(lst, en, T('Destino', 'Destination'), dname, link)
            + f'<p class="pm-note">{e(T(f"Precios de ida y vuelta en clase turista para 1 adulto, consultados en Kiwi.com (última consulta: {fd(checked)}). Habitual es la mediana de los precios que vimos. Los precios cambian cada día.", f"Return prices in economy for 1 adult, checked on Kiwi.com (last search: {fd(checked, True)}). Usual is the median of the prices we saw. Prices change every day."))}</p>'
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
    ds = sorted(by_dest.items(), key=lambda kv: kv[1][0]['dest'])
    os_ = sorted(by_orig.items())
    for en, path in ((False, 'vuelos/index.html'), (True, 'en/flights/index.html')):
        T = (lambda a, b: b if en else a)
        da = ''.join(f'<a class="chip" href="{T("/vuelos/a/" + d + "/", "/en/flights/to/" + G.en_dest_slug(d) + "/")}">{e(E.NAMES.get(d, l[0]["dest"]) if en else l[0]["dest"])}</a>' for d, l in ds if len(l) >= 3)
        oa = ''.join(f'<a class="chip" href="{T("/vuelos/desde/" + G.slugify(o) + "/", "/en/flights/from/" + G.slugify(en_names.city_en(o)) + "/")}">{e(en_names.city_en(o) if en else o)}</a>' for o, l in os_ if len(l) >= 3)
        _inject(path, f'<section class="sec"><div class="wrap"><h2>{T("Precios por destino", "Prices by destination")}</h2><div class="chips pm-chips">{da}</div>'
                      f'<h2 style="margin-top:28px">{T("Precios por ciudad de salida", "Prices by departure city")}</h2><div class="chips pm-chips">{oa}</div>'
                      f'<h2 style="margin-top:28px">{T("Nuestros datos", "Our data")}</h2><div class="chips pm-chips"><a class="chip" href="{T("/vuelos/datos/", "/en/flights/data/")}">{T("Precios de vuelos 2026 por ruta", "Flight prices 2026 by route")}</a>'
                      f'<a class="chip" href="{T("/vuelos/datos/mes-mas-barato/", "/en/flights/data/cheapest-month/")}">{T("Mes más barato por destino", "Cheapest month by destination")}</a>'
                      f'<a class="chip" href="/vuelos/precios-vuelos-2026.csv">CSV</a>'
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
