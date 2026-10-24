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
PREF = ['Madrid', 'Barcelona', 'Londres', 'París', 'Nueva York', 'Málaga', 'Valencia', 'Ámsterdam', 'Berlín', 'Milán', 'Roma', 'Lisboa', 'Dublín', 'Toronto', 'Sídney', 'Singapur', 'Dubái']
MES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
MES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
e = G.e


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


def page_shell(en, title, desc, url, alt_url, ld, body_class):
    if en:
        return E.head(title, desc, url, alt_url, ld=ld, body_class=body_class)
    alt = f'<link rel="alternate" hreflang="es" href="{url}"><link rel="alternate" hreflang="en" href="{alt_url}"><link rel="alternate" hreflang="x-default" href="{url}">'
    return G.head(title=e(title), desc=e(desc), canonical=url, og_type='article', og_image=f'{SITE}/hlc/brand/og-default.jpg',
                  extra_head='<link rel="stylesheet" href="/hlc/home.css?v=12">' + alt + G.ld_script(ld), body_class=body_class)


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
        title = f'Cheap flights to {name}: real prices from {len(lst)} cities'
        lead = (f'The cheapest return flight to {name} we found leaves from {oname(r0)} for {r0["price_from"]} € ({stops(f0.get("escalas_ida"), True)}, {f0.get("aerolinea") or "several airlines"}). '
                f'Usual prices from the {len(lst)} cities we track range from {min(meds)} € to {max(meds)} €.') if meds else f'Return flights to {name} from {len(lst)} cities, with the lowest price we found.'
        qas = [(f'How much is a flight to {name}?', f'The cheapest return flight we found was {r0["price_from"]} € from {oname(r0)} (search on {fd(f0.get("consultado"), True)}). ' + (f'The usual price across the {len(lst)} cities we track is between {min(meds)} € and {max(meds)} €.' if meds else '')),
               (f'Which city has the cheapest flights to {name}?', 'Cheapest departures: ' + ', '.join(f'{oname(r)} ({r["price_from"]} €)' for r in lst[:3]) + '.')]
        if direct:
            qas.append((f'Are there direct flights to {name}?', f'Yes, we found direct flights from {len(direct)} of the cities we track: ' + ', '.join(oname(r) for r in direct[:8]) + ('…' if len(direct) > 8 else '.')))
        else:
            qas.append((f'Are there direct flights to {name}?', f'In our last search, none of the {len(lst)} cities we track had a direct flight in the cheapest options; all had at least one stop.'))
        if best:
            qas.append((f'What is the cheapest month to fly to {name}?', f'From {oname(best[0])}, the cheapest month in the next six months is {mname(best[1], True)}, at {best[2]} € return.'))
        crumbs = [('Home', '/en/'), ('Flight routes', '/en/flights/'), (f'Flights to {name}', None)]
    else:
        title = f'Vuelos baratos a {name}: precios reales desde {len(lst)} ciudades'
        lead = (f'El vuelo de ida y vuelta más barato a {name} que hemos encontrado sale desde {oname(r0)} por {r0["price_from"]} € ({stops(f0.get("escalas_ida"))}, {f0.get("aerolinea") or "varias aerolíneas"}). '
                f'Lo habitual desde las {len(lst)} ciudades que vigilamos va de {min(meds)} € a {max(meds)} €.') if meds else f'Vuelos de ida y vuelta a {name} desde {len(lst)} ciudades, con el precio más bajo que hemos encontrado.'
        qas = [(f'¿Cuánto cuesta un vuelo a {name}?', f'El más barato que encontramos fue de {r0["price_from"]} € ida y vuelta desde {oname(r0)} (consulta del {fd(f0.get("consultado"))}). ' + (f'Lo habitual desde las {len(lst)} ciudades que vigilamos está entre {min(meds)} € y {max(meds)} €.' if meds else '')),
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
    desc = G.smart_desc(lead)
    ld = [faq_ld(qas, 'en' if en else 'es-ES'), crumbs_ld(crumbs)]
    T = (lambda a, b: b if en else a)
    stats = (f'<div class="pm-stats"><div><b>{r0["price_from"]} €</b><span>{T("lo más barato que encontramos", "cheapest we found")}</span></div>'
             + (f'<div><b>{int(statistics.median(meds))} €</b><span>{T("precio habitual (mediana)", "usual price (median)")}</span></div>' if meds else '')
             + f'<div><b>{len(direct)}</b><span>{T("ciudades con vuelo directo", "cities with direct flights")}</span></div><div><b>{len(lst)}</b><span>{T("ciudades de salida", "departure cities")}</span></div></div>')
    gl = ''
    if guide:
        gl = f'<a class="hlc-btn o" href="{T("/destinos/" + d + "/", "/en/destinations/" + slug_en + "/")}">{T("Guía de " + name, name + " travel guide")}</a>'
    out = page_shell(en, title + ' · Happy Low Cost', desc, url, url_es if en else url_en, ld, 'precios')
    out += (f'<main class="sec" style="padding-top:22px"><div class="wrap">{crumbs_html(crumbs, en)}'
            f'<div class="kicker">{T("Precios reales, consultados en Kiwi.com", "Real prices, checked on Kiwi.com")}</div><h1 class="x-h1">{e(title)}</h1>'
            f'<p style="font-size:18px;max-width:820px">{e(lead)}</p>{stats}'
            f'<div class="hlc-row" style="margin:18px 0 6px">{gl}<a class="hlc-btn o" href="{T("/alertas/", "/en/deals/")}">{T("Avísame de chollos a " + name, "Today’s deals")}</a></div>'
            f'<h2>{T("Precio desde cada ciudad", "Price from each city")}</h2><input type="search" class="pm-q" placeholder="{T("Filtra por ciudad de salida", "Filter by departure city")}" aria-label="{T("Filtrar", "Filter")}">'
            + table(lst, en, T('Salida', 'Departure'), oname, link)
            + f'<p class="pm-note">{e(T(f"Precios de ida y vuelta en clase turista para 1 adulto, consultados en Kiwi.com (última consulta: {fd(checked)}). Habitual es la mediana de los precios que vimos. Los precios cambian cada día.", f"Return prices in economy for 1 adult, checked on Kiwi.com (last search: {fd(checked, True)}). Usual is the median of the prices we saw. Prices change every day."))}</p>'
            + (f'<h2>{T("Cuándo es más barato volar a " + name, "When it is cheapest to fly to " + name)}</h2>{mt}' if mt else '')
            + ('' if en else f'<section class="hlc-rel"><h2 data-rel-h>Chollos de hoy a {e(name)}</h2><div class="dc-grid" data-hlc-deals data-max="4" data-dest="{e(d)}"></div><div class="hlc-row"><a class="hlc-btn o" href="/chollos/">Todos los chollos de hoy</a></div></section>')
            + f'<h2>{T("Preguntas frecuentes", "FAQ")}</h2><div class="txt guide">' + ''.join(f'<h3>{e(q)}</h3><p>{e(a)}</p>' for q, a in qas) + '</div>'
            + '</div></main>' + FILTER_JS + (E.FOOTER if en else '') + '</body></html>')
    return out


# ---------- origen ----------
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
        title = f'Cheap flights from {oname}: real prices to {len(lst)} destinations'
        lead = f'The cheapest return flights from {oname} we found: ' + ', '.join(f'{dname(r)} ({r["price_from"]} €)' for r in lst[:4]) + f'. {len(under)} destinations under 100 € return and {len(direct)} with direct flights.'
        qas = [(f'Where can I fly cheaply from {oname}?', 'The cheapest destinations in our last search: ' + ', '.join(f'{dname(r)} ({r["price_from"]} €)' for r in lst[:5]) + '.'),
               (f'How many destinations under 100 € can I reach from {oname}?', f'{len(under)} of the {len(lst)} destinations we track had a return flight under 100 €' + (': ' + ', '.join(dname(r) for r in under[:8]) + ('…' if len(under) > 8 else '.') if under else '.')),
               (f'Which direct flights from {oname} are cheapest?', ('Cheapest direct flights: ' + ', '.join(f'{dname(r)} ({r["price_from"]} €)' for r in direct[:5]) + '.') if direct else 'In our last search the cheapest options all had at least one stop.')]
        crumbs = [('Home', '/en/'), ('Flight routes', '/en/flights/'), (f'Flights from {oname}', None)]
    else:
        title = f'Vuelos baratos desde {oname}: precios reales a {len(lst)} destinos'
        lead = f'Los vuelos de ida y vuelta más baratos desde {oname} que hemos encontrado: ' + ', '.join(f'{dname(r)} ({r["price_from"]} €)' for r in lst[:4]) + f'. {len(under)} destinos por menos de 100 € ida y vuelta y {len(direct)} con vuelo directo.'
        qas = [(f'¿A dónde se puede volar barato desde {oname}?', 'Los destinos más baratos en nuestra última consulta: ' + ', '.join(f'{dname(r)} ({r["price_from"]} €)' for r in lst[:5]) + '.'),
               (f'¿Cuántos destinos hay por menos de 100 € desde {oname}?', f'{len(under)} de los {len(lst)} destinos que vigilamos tenían vuelo de ida y vuelta por menos de 100 €' + (': ' + ', '.join(dname(r) for r in under[:8]) + ('…' if len(under) > 8 else '.') if under else '.')),
               (f'¿Qué vuelos directos desde {oname} son los más baratos?', ('Los directos más baratos: ' + ', '.join(f'{dname(r)} ({r["price_from"]} €)' for r in direct[:5]) + '.') if direct else 'En nuestra última consulta, las opciones más baratas hacían al menos una escala.')]
        crumbs = [('Inicio', '/'), ('Rutas de vuelos', '/vuelos/'), (f'Vuelos desde {oname}', None)]
    desc = G.smart_desc(lead)
    ld = [faq_ld(qas, 'en' if en else 'es-ES'), crumbs_ld(crumbs)]
    out = page_shell(en, title + ' · Happy Low Cost', desc, url, url_es if en else url_en, ld, 'precios')
    out += (f'<main class="sec" style="padding-top:22px"><div class="wrap">{crumbs_html(crumbs, en)}'
            f'<div class="kicker">{T("Precios reales, consultados en Kiwi.com", "Real prices, checked on Kiwi.com")}</div><h1 class="x-h1">{e(title)}</h1>'
            f'<p style="font-size:18px;max-width:820px">{e(lead)}</p>'
            f'<div class="pm-stats"><div><b>{lst[0]["price_from"]} €</b><span>{T("el destino más barato", "cheapest destination")}</span></div><div><b>{len(under)}</b><span>{T("destinos por menos de 100 €", "destinations under 100 €")}</span></div><div><b>{len(direct)}</b><span>{T("con vuelo directo", "with direct flights")}</span></div><div><b>{len(lst)}</b><span>{T("destinos", "destinations")}</span></div></div>'
            f'<div class="hlc-row" style="margin:18px 0 6px"><a class="hlc-btn o" href="{T("/chollos/?aero=" + os_, "/en/deals/")}">{T("Chollos de hoy desde " + oname, "Today’s deals")}</a><a class="hlc-btn o" href="{T("/alertas/", "/en/deals/")}">{T("Crear alerta gratis", "See all deals")}</a></div>'
            f'<h2>{T("Precio a cada destino", "Price to each destination")}</h2><input type="search" class="pm-q" placeholder="{T("Filtra por destino", "Filter by destination")}" aria-label="{T("Filtrar", "Filter")}">'
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
        urls_es.append(f'{SITE}/vuelos/a/{d}/')
        urls_en.append(f'{SITE}/en/flights/to/{G.en_dest_slug(d)}/')
    for o, lst in by_orig.items():
        if len(lst) < 3:
            continue
        write(f'vuelos/desde/{G.slugify(o)}', orig_page(o, lst, False, en_slug))
        write(f'en/flights/from/{G.slugify(en_names.city_en(o))}', orig_page(o, lst, True, en_slug))
        urls_es.append(f'{SITE}/vuelos/desde/{G.slugify(o)}/')
        urls_en.append(f'{SITE}/en/flights/from/{G.slugify(en_names.city_en(o))}/')
    # enlaces: cada ruta -> sus dos páginas de precios; guías de destino -> precios; índice de rutas -> todas
    for r in rows:
        dn, on = r['dest'], r['origin']
        _inject(f'vuelos/{r["slug"]}/index.html', f'<nav class="wrap pm-links" aria-label="Más precios"><a href="/vuelos/a/{r["dest_slug"]}/">Todos los vuelos a {e(dn)}, desde {len(by_dest[r["dest_slug"]])} ciudades</a><a href="/vuelos/desde/{G.slugify(on)}/">Todos los destinos desde {e(on)}</a></nav>')
        dne, one = E.NAMES.get(r['dest_slug'], dn), en_names.city_en(on)
        _inject(f'en/flights/{en_slug(r)}/index.html', f'<nav class="wrap pm-links" aria-label="More prices"><a href="/en/flights/to/{G.en_dest_slug(r["dest_slug"])}/">All flights to {e(dne)}, from {len(by_dest[r["dest_slug"]])} cities</a><a href="/en/flights/from/{G.slugify(one)}/">All destinations from {e(one)}</a></nav>')
    for d, lst in by_dest.items():
        if len(lst) >= 3:
            low = min(x['price_from'] for x in lst)
            _inject(f'destinos/{d}/index.html', f'<section class="sec" style="padding-top:0"><div class="wrap"><a class="pm-card" href="/vuelos/a/{d}/"><b>Precios de vuelos a {e(lst[0]["dest"])}</b><span>Desde {len(lst)} ciudades, desde {low} € ida y vuelta, con el mes más barato</span></a></div></section>')
            _inject(f'en/destinations/{G.en_dest_slug(d)}/index.html', f'<section class="sec" style="padding-top:0"><div class="wrap"><a class="pm-card" href="/en/flights/to/{G.en_dest_slug(d)}/"><b>Flight prices to {e(E.NAMES.get(d, lst[0]["dest"]))}</b><span>From {len(lst)} cities, from {low} € return</span></a></div></section>')
    ds = sorted(by_dest.items(), key=lambda kv: kv[1][0]['dest'])
    os_ = sorted(by_orig.items())
    for en, path in ((False, 'vuelos/index.html'), (True, 'en/flights/index.html')):
        T = (lambda a, b: b if en else a)
        da = ''.join(f'<a class="chip" href="{T("/vuelos/a/" + d + "/", "/en/flights/to/" + G.en_dest_slug(d) + "/")}">{e(E.NAMES.get(d, l[0]["dest"]) if en else l[0]["dest"])}</a>' for d, l in ds if len(l) >= 3)
        oa = ''.join(f'<a class="chip" href="{T("/vuelos/desde/" + G.slugify(o) + "/", "/en/flights/from/" + G.slugify(en_names.city_en(o)) + "/")}">{e(en_names.city_en(o) if en else o)}</a>' for o, l in os_ if len(l) >= 3)
        _inject(path, f'<section class="sec"><div class="wrap"><h2>{T("Precios por destino", "Prices by destination")}</h2><div class="chips pm-chips">{da}</div>'
                      f'<h2 style="margin-top:28px">{T("Precios por ciudad de salida", "Prices by departure city")}</h2><div class="chips pm-chips">{oa}</div></div></section>')
    print('precios', {'destinos': len(urls_es) and sum(1 for u in urls_es if '/a/' in u), 'origenes': sum(1 for u in urls_es if '/desde/' in u), 'meses_nuevos': w, 'meses_total': len(meses)})
    return urls_es, urls_en
