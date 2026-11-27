"""Ronda SEO 7 (27-nov-2026): páginas de datos propios, en español y en inglés, hechas con los JSON de rutas
indexadas (vuelos/feed.json y en/flights/feed.json), la biblioteca de destinos y los días de cada guía.

- #418 Vuelos baratos a Asia desde Europa            /vuelos/asia-desde-europa/            /en/flights/asia-from-europe/
- #419 Vuelos baratos a Latinoamérica desde España    /vuelos/latinoamerica-desde-espana/   /en/flights/latin-america-from-spain/
- #259 Vuelos directos baratos desde España           /vuelos/directos-desde-espana/        /en/flights/nonstop-from-spain/
- #421 Aerolíneas low cost: rutas y precios           /vuelos/aerolineas-low-cost/          /en/flights/low-cost-airlines/
- #80  Destinos baratos por aeropuerto de España      /vuelos/aeropuertos-espana/           /en/flights/airports-spain/
- #256 Guías por días de viaje                        /destinos/por-dias/                   /en/destinations/by-days/
- #223 Guías por continente                           /destinos/region/<r>/                 /en/destinations/region/<r>/

Lo llama gen_static.py (que el workflow ejecuta después de gen_routes), así se regenera cada 4 horas.
Nada inventado: solo cifras de los feeds y textos de plantilla."""
import os, re, json, statistics, datetime, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_deals as G  # noqa: E402
import gen_en as E  # noqa: E402
import en_names  # noqa: E402

SITE = G.SITE
e = G.e
SPAIN = ['Madrid', 'Barcelona', 'Málaga', 'Valencia', 'Sevilla', 'Bilbao', 'Alicante', 'Palma', 'Ibiza', 'Gran Canaria', 'Zaragoza', 'Santiago de Compostela']
NON_EU = {'Toronto', 'Nueva York', 'Dubái', 'Singapur', 'Sídney'}
LOWCOST = ('Ryanair', 'Wizz', 'easyJet', 'Vueling', 'Transavia', 'Norwegian', 'Pegasus', 'Scoot', 'Volotea', 'Jet2', 'Eurowings', 'Flair', 'JetBlue',
           'Spirit', 'Frontier', 'flydubai', 'Air Arabia', 'Jetstar', 'AirAsia', 'Iberia Express', 'Level', 'French bee', 'Norse', 'Play', 'airBaltic', 'SKY express', 'Lynx', 'Binter')
REG = {'europa': ('Europa', 'Europe', 'europe'), 'asia': ('Asia', 'Asia', 'asia'), 'oriente-medio': ('Oriente Medio', 'Middle East', 'middle-east'),
       'africa': ('África', 'Africa', 'africa'), 'norteamerica': ('Norteamérica y Caribe', 'North America and the Caribbean', 'north-america'),
       'america': ('América', 'Americas', 'americas'), 'sudamerica': ('Sudamérica', 'South America', 'south-america'), 'oceania': ('Oceanía', 'Oceania', 'oceania')}
LATAM_R = {'america', 'sudamerica', 'norteamerica'}
NOT_LATAM = {'Estados Unidos', 'Canadá'}
MES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
CSS = ('<style>.pm-scroll{overflow-x:auto;max-width:100%}.pm-t{border-collapse:collapse;width:100%;font-size:15px;background:#fff}'
       '.pm-t th,.pm-t td{padding:8px 10px;border-bottom:1px solid #EADCC4;text-align:left;vertical-align:top}.pm-t thead th{font-size:13px;color:#4A5468}'
       '.pm-p{font-weight:700;white-space:nowrap}.r7-g{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 22px}.r7-g a{background:#fff;border:1px solid #EADCC4;border-radius:999px;padding:8px 12px;text-decoration:none}</style>')


def fd(iso, en=False):
    try:
        d = datetime.date.fromisoformat((iso or '')[:10])
    except Exception:
        return iso or ''
    return d.strftime('%-d %b %Y') if en else f'{d.day} {MES_ES[d.month - 1]} {d.year}'


def load():
    es = json.load(open('vuelos/feed.json', encoding='utf-8'))['routes']
    en = json.load(open('en/flights/feed.json', encoding='utf-8'))['routes']
    enk = {(r['origin_iata'], r['destination_iata'], r['origin']): r for r in en}
    enk2 = {(r['origin_iata'], r['destination_iata']): r for r in en}
    lib = json.load(open('hlc/destinos.json', encoding='utf-8'))
    c2r = {}
    for d in lib:
        c2r.setdefault(d['c'], d['r'])
    for r in es:
        r['country_n'] = G.NORM_C.get(r['country'], r['country'])
        r['region'] = c2r.get(r['country_n']) or c2r.get(r['country'])
        x = enk2.get((r['origin_iata'], r['destination_iata']))
        r['en'] = x
        r['path_es'] = r['url'].replace(SITE, '')
        r['path_en'] = x['url'].replace(SITE, '') if x else None
    return es, lib


def stops(n, en):
    if n == 0:
        return 'nonstop' if en else 'directo'
    if isinstance(n, int):
        return f'{n} stop' + ('s' if n > 1 else '') if en else f'{n} escala' + ('s' if n > 1 else '')
    return ''


def crumbs(items, en):
    h = '<nav class="crumbs" aria-label="' + ('Breadcrumb' if en else 'Migas de pan') + '">' + ' <span>›</span> '.join(
        (f'<a href="{u}">{e(n)}</a>' if u else f'<span aria-current="page">{e(n)}</span>') for n, u in items) + '</nav>'
    ld = {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, **({"item": SITE + u} if u else {})} for i, (n, u) in enumerate(items)]}
    return h, ld


def faq(qas, lang):
    return {"@type": "FAQPage", "inLanguage": lang, "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in qas]}


def write(en, path, url, alt_url, title, desc, h1, kicker, quick, lead, body, qas, crumb_items, extra_ld=None):
    ch, cld = crumbs(crumb_items, en)
    now = datetime.date.today().isoformat()
    wp = {"@type": "WebPage", "@id": url + '#page', "url": url, "name": title, "inLanguage": 'en' if en else 'es-ES', "dateModified": now,
          "publisher": {"@id": SITE + '/#org'}, "speakable": {"@type": "SpeakableSpecification", "cssSelector": ["h1", ".qa"]}}
    ld = [wp, cld] + ([faq(qas, 'en' if en else 'es-ES')] if qas else []) + (extra_ld or [])
    if en:
        h = E.head(title, desc, url, alt_url, ld=ld, body_class='pm', extra_head=CSS)
    else:
        alt = f'<link rel="alternate" hreflang="es" href="{url}"><link rel="alternate" hreflang="en" href="{alt_url}"><link rel="alternate" hreflang="x-default" href="{url}">'
        h = G.head(title=e(title), desc=e(desc), canonical=url, og_type='article', og_image=f'{SITE}/hlc/brand/og-default.jpg', og_alt=e(title),
                   extra_head='<link rel="stylesheet" href="/hlc/home.css?v=12">' + CSS + alt + G.ld_script(ld), body_class='pm')
    qa_h = ''.join(f'<h3>{e(q)}</h3><p>{e(a)}</p>' for q, a in qas)
    h += (f'<main class="sec" style="padding-top:22px"><div class="wrap">{ch}<div class="kicker">{e(kicker)}</div><h1 class="x-h1">{e(h1)}</h1>'
          + (f'<p class="qa" style="background:#FFF6E0;border-left:4px solid #FFC531;padding:12px 14px;border-radius:10px;max-width:820px"><b>{"Quick answer:" if en else "Respuesta rápida:"}</b> {e(quick)}</p>' if quick else '')
          + f'<p style="font-size:18px;max-width:820px">{e(lead)}</p>{body}'
          + (f'<section class="txt guide" style="max-width:820px"><h2>{"FAQs" if en else "Preguntas frecuentes"}</h2>{qa_h}</section>' if qas else '')
          + (f'<p class="pm-src" style="font-size:14px;color:#555;overflow-wrap:anywhere">Source: Happy Low Cost own data (return economy fares for 1 adult, checked on Kiwi.com on the date shown on each row). To cite this page: <a href="{url}">{url}</a></p>' if en else
             f'<p class="pm-src" style="font-size:14px;color:#555;overflow-wrap:anywhere">Fuente: datos propios de Happy Low Cost (precios de ida y vuelta en turista para 1 adulto, consultados en Kiwi.com en la fecha de cada fila). Para citar esta página: <a href="{url}">{url}</a></p>')
          + '</div></main>' + (E.FOOTER if en else '') + '</body></html>')
    os.makedirs(path, exist_ok=True)
    open(os.path.join(path, 'index.html'), 'w', encoding='utf-8').write(h)
    return path


def rtable(lst, en, cols=('dest', 'origin', 'price', 'stops', 'airline', 'date')):
    lab = {'dest': ('Destino', 'Destination'), 'origin': ('Desde', 'From'), 'price': ('Ida y vuelta desde', 'Return from'), 'stops': ('Escalas', 'Stops'),
           'airline': ('Aerolínea', 'Airline'), 'date': ('Consultado', 'Checked'), 'route': ('Ruta', 'Route')}
    th = ''.join(f'<th scope="col">{lab[c][1 if en else 0]}</th>' for c in cols)
    trs = ''
    for r in lst:
        x = r['en'] if en else r
        href = r['path_en'] if en else r['path_es']
        cells = []
        for c in cols:
            if c == 'dest':
                cells.append(f'<th scope="row"><a href="{href}">{e(x["destination"])}</a></th>')
            elif c == 'route':
                cells.append(f'<th scope="row"><a href="{href}">{e(x["origin"])} → {e(x["destination"])}</a></th>')
            elif c == 'origin':
                cells.append(f'<td>{e(x["origin"])}</td>')
            elif c == 'price':
                cells.append(f'<td class="pm-p">{("€" + str(r["price_from_eur_return"])) if en else (str(r["price_from_eur_return"]) + " €")}</td>')
            elif c == 'stops':
                cells.append(f'<td>{e(stops(r["stops_cheapest"], en))}</td>')
            elif c == 'airline':
                cells.append(f'<td>{e(r.get("airline_cheapest") or "")}</td>')
            elif c == 'date':
                cells.append(f'<td>{e(fd(r.get("checked_on"), en))}</td>')
        trs += '<tr>' + ''.join(cells) + '</tr>'
    return f'<div class="pm-scroll" role="region" tabindex="0" aria-label="{"Fares" if en else "Precios"}"><table class="pm-t"><thead><tr>{th}</tr></thead><tbody>{trs}</tbody></table></div>'


def best_per_dest(lst):
    b = {}
    for r in lst:
        k = r['destination_iata']
        if k not in b or r['price_from_eur_return'] < b[k]['price_from_eur_return']:
            b[k] = r
    return sorted(b.values(), key=lambda r: r['price_from_eur_return'])


def both(lst):
    return [r for r in lst if r.get('en')]


def last_check(lst):
    return max((r.get('checked_on') or '') for r in lst) if lst else ''


def region_pages(es, NAV):
    out = []
    # ---- Asia desde Europa ----
    asia = best_per_dest(both([r for r in es if r['region'] in ('asia', 'oriente-medio') and r['origin'] not in NON_EU]))
    if len(asia) >= 6:
        c = asia[0]
        lc = last_check(asia)
        for en in (False, True):
            u_es, u_en = f'{SITE}/vuelos/asia-desde-europa/', f'{SITE}/en/flights/asia-from-europe/'
            dr = sum(1 for r in asia if r['stops_cheapest'] == 0)
            if en:
                ce = c['en']
                q = (f'The cheapest flight to Asia from Europe we have found is {ce["origin"]} to {ce["destination"]} for €{c["price_from_eur_return"]} return'
                     f' ({stops(c["stops_cheapest"], True)}, {c.get("airline_cheapest") or "several airlines"}, checked {fd(c["checked_on"], True)}). {len(asia)} Asian destinations below, cheapest first.')
                qas = [('What is the cheapest way to fly from Europe to Asia?', q),
                       ('Are there nonstop flights from Europe to Asia at these prices?', f'{dr} of the {len(asia)} cheapest fares in this table are nonstop; the rest have one or more stops.')]
                out.append(write(True, 'en/flights/asia-from-europe', u_en, u_es, f'Cheap flights to Asia from Europe: {len(asia)} destinations from €{c["price_from_eur_return"]}',
                                 f'Cheapest return flights from Europe to {len(asia)} Asian cities, from €{c["price_from_eur_return"]}. Real fares checked on Kiwi.com, last search {fd(lc, True)}.',
                                 'Cheap flights to Asia from Europe', 'Real fares, checked on Kiwi.com', q,
                                 'For each Asian destination, the cheapest return fare we found from any European city. Click a route for its price calendar, cheapest month and airlines.',
                                 rtable(asia, True), qas, [('Home', '/en/'), ('Flights', '/en/flights/'), ('Asia from Europe', None)]))
            else:
                q = (f'El vuelo más barato a Asia desde Europa que hemos encontrado es {c["origin"]}-{c["destination"]} por {c["price_from_eur_return"]} € ida y vuelta'
                     f' ({stops(c["stops_cheapest"], False)}, {c.get("airline_cheapest") or "varias aerolíneas"}, consultado el {fd(c["checked_on"])}). Abajo, {len(asia)} destinos de Asia del más barato al más caro.')
                qas = [('¿Cuál es el vuelo más barato de Europa a Asia?', q),
                       ('¿Hay vuelos directos a Asia a estos precios?', f'{dr} de las {len(asia)} tarifas más baratas de la tabla son vuelos directos; el resto tiene una o más escalas.')]
                out.append(write(False, 'vuelos/asia-desde-europa', u_es, u_en, f'Vuelos baratos a Asia desde Europa: {len(asia)} destinos desde {c["price_from_eur_return"]} €',
                                 f'Vuelos de ida y vuelta más baratos de Europa a {len(asia)} ciudades de Asia, desde {c["price_from_eur_return"]} €. Precios reales consultados en Kiwi.com, última consulta el {fd(lc)}.',
                                 'Vuelos baratos a Asia desde Europa', 'Precios reales, consultados en Kiwi.com', q,
                                 'Para cada destino de Asia, la tarifa de ida y vuelta más barata que hemos encontrado desde cualquier ciudad europea. Entra en cada ruta para ver su calendario de precios, el mes más barato y las aerolíneas.',
                                 rtable(asia, False), qas, [('Inicio', '/'), ('Vuelos', '/vuelos/'), ('Asia desde Europa', None)]))
        NAV['es'].append(('/vuelos/asia-desde-europa/', 'Vuelos baratos a Asia desde Europa'))
        NAV['en'].append(('/en/flights/asia-from-europe/', 'Cheap flights to Asia from Europe'))
    # ---- Latinoamérica desde España ----
    lat = best_per_dest(both([r for r in es if r['origin'] in SPAIN and r['region'] in LATAM_R and r['country_n'] not in NOT_LATAM]))
    if len(lat) >= 5:
        c = lat[0]
        lc = last_check(lat)
        u_es, u_en = f'{SITE}/vuelos/latinoamerica-desde-espana/', f'{SITE}/en/flights/latin-america-from-spain/'
        dr = sum(1 for r in lat if r['stops_cheapest'] == 0)
        ce = c['en']
        q_es = (f'El vuelo más barato a Latinoamérica desde España que hemos encontrado es {c["origin"]}-{c["destination"]} por {c["price_from_eur_return"]} € ida y vuelta'
                f' ({stops(c["stops_cheapest"], False)}, consultado el {fd(c["checked_on"])}). {len(lat)} destinos en la tabla, {dr} con vuelo directo.')
        q_en = (f'The cheapest flight to Latin America from Spain we have found is {ce["origin"]} to {ce["destination"]} for €{c["price_from_eur_return"]} return'
                f' ({stops(c["stops_cheapest"], True)}, checked {fd(c["checked_on"], True)}). {len(lat)} destinations in the table, {dr} nonstop.')
        write(False, 'vuelos/latinoamerica-desde-espana', u_es, u_en, f'Vuelos baratos a Latinoamérica desde España desde {c["price_from_eur_return"]} €',
              f'Los vuelos de ida y vuelta más baratos de España a {len(lat)} destinos de Latinoamérica y el Caribe, desde {c["price_from_eur_return"]} €. Precios reales, última consulta el {fd(lc)}.',
              'Vuelos baratos a Latinoamérica desde España', 'Precios reales, consultados en Kiwi.com', q_es,
              'Para cada destino de Latinoamérica y el Caribe, la tarifa de ida y vuelta más barata desde un aeropuerto español. Entra en la ruta para ver el calendario de precios y el mes más barato.',
              rtable(lat, False), [('¿Cuál es el vuelo más barato de España a Latinoamérica?', q_es),
                                   ('¿Hay vuelos directos de España a Latinoamérica a estos precios?', f'Sí, {dr} de los {len(lat)} precios de la tabla son de vuelo directo.' if dr else 'En nuestra última consulta, los precios más baratos de la tabla eran todos con escala.')],
              [('Inicio', '/'), ('Vuelos', '/vuelos/'), ('Latinoamérica desde España', None)])
        write(True, 'en/flights/latin-america-from-spain', u_en, u_es, f'Cheap flights to Latin America from Spain from €{c["price_from_eur_return"]}',
              f'Cheapest return flights from Spain to {len(lat)} destinations in Latin America and the Caribbean, from €{c["price_from_eur_return"]}. Real fares, last search {fd(lc, True)}.',
              'Cheap flights to Latin America from Spain', 'Real fares, checked on Kiwi.com', q_en,
              'For each destination in Latin America and the Caribbean, the cheapest return fare from a Spanish airport. Open a route for its price calendar and cheapest month.',
              rtable(lat, True), [('What is the cheapest flight from Spain to Latin America?', q_en),
                                  ('Are there nonstop flights from Spain to Latin America at these prices?', f'Yes, {dr} of the {len(lat)} fares in the table are nonstop.' if dr else 'In our latest search, the cheapest fares in the table all had stops.')],
              [('Home', '/en/'), ('Flights', '/en/flights/'), ('Latin America from Spain', None)])
        NAV['es'].append(('/vuelos/latinoamerica-desde-espana/', 'Vuelos baratos a Latinoamérica desde España'))
        NAV['en'].append(('/en/flights/latin-america-from-spain/', 'Cheap flights to Latin America from Spain'))
    # ---- Directos desde España ----
    dr_ = both(sorted([r for r in es if r['origin'] in SPAIN and r['stops_cheapest'] == 0], key=lambda r: r['price_from_eur_return']))
    if len(dr_) >= 10:
        c = dr_[0]
        lc = last_check(dr_)
        by_o = {}
        for r in dr_:
            by_o.setdefault(r['origin'], []).append(r)
        u_es, u_en = f'{SITE}/vuelos/directos-desde-espana/', f'{SITE}/en/flights/nonstop-from-spain/'
        for en in (False, True):
            body = ''
            for o in sorted(by_o, key=lambda o_: -len(by_o[o_])):
                on = en_names.city_en(o) if en else o
                body += f'<h2>{("Nonstop flights from " + e(on)) if en else ("Vuelos directos desde " + e(on))} ({len(by_o[o])})</h2>' + rtable(by_o[o], en, ('dest', 'price', 'airline', 'date'))
            mad = by_o.get('Madrid', [])
            if en:
                q = f'The cheapest nonstop return flight from Spain in our data is {c["en"]["origin"]} to {c["en"]["destination"]} for €{c["price_from_eur_return"]} with {c.get("airline_cheapest") or "a low-cost airline"} (checked {fd(c["checked_on"], True)}). {len(dr_)} nonstop routes from {len(by_o)} Spanish airports.'
                qas = [('What is the cheapest nonstop flight from Spain?', q)] + ([('Which cheap nonstop flights leave from Madrid?', 'From Madrid: ' + ', '.join(f'{r["en"]["destination"]} (€{r["price_from_eur_return"]})' for r in mad[:6]) + '.')] if mad else [])
                write(True, 'en/flights/nonstop-from-spain', u_en, u_es, f'Cheap nonstop flights from Spain: {len(dr_)} routes from €{c["price_from_eur_return"]}',
                      f'{len(dr_)} cheap nonstop return flights from {len(by_o)} Spanish airports, from €{c["price_from_eur_return"]}. Real fares checked on Kiwi.com, last search {fd(lc, True)}.',
                      'Cheap nonstop flights from Spain', 'Real fares, checked on Kiwi.com', q, 'Routes where the cheapest return fare we found is a nonstop flight, grouped by departure airport.',
                      body, qas, [('Home', '/en/'), ('Flights', '/en/flights/'), ('Nonstop from Spain', None)])
            else:
                q = f'El vuelo directo de ida y vuelta más barato desde España en nuestros datos es {c["origin"]}-{c["destination"]} por {c["price_from_eur_return"]} € con {c.get("airline_cheapest") or "una low cost"} (consultado el {fd(c["checked_on"])}). {len(dr_)} rutas directas desde {len(by_o)} aeropuertos españoles.'
                qas = [('¿Cuál es el vuelo directo más barato desde España?', q)] + ([('¿Qué vuelos directos baratos salen de Madrid?', 'Desde Madrid: ' + ', '.join(f'{r["destination"]} ({r["price_from_eur_return"]} €)' for r in mad[:6]) + '.')] if mad else [])
                write(False, 'vuelos/directos-desde-espana', u_es, u_en, f'Vuelos directos baratos desde España: {len(dr_)} rutas desde {c["price_from_eur_return"]} €',
                      f'{len(dr_)} vuelos directos de ida y vuelta baratos desde {len(by_o)} aeropuertos de España, desde {c["price_from_eur_return"]} €. Precios reales consultados en Kiwi.com, última consulta el {fd(lc)}.',
                      'Vuelos directos baratos desde España', 'Precios reales, consultados en Kiwi.com', q, 'Rutas en las que la tarifa de ida y vuelta más barata que hemos encontrado es un vuelo directo, por aeropuerto de salida.',
                      body, qas, [('Inicio', '/'), ('Vuelos', '/vuelos/'), ('Directos desde España', None)])
        NAV['es'].append(('/vuelos/directos-desde-espana/', 'Vuelos directos baratos desde España'))
        NAV['en'].append(('/en/flights/nonstop-from-spain/', 'Cheap nonstop flights from Spain'))
    # ---- Aerolíneas low cost ----
    by_a = {}
    for r in both(es):
        a = r.get('airline_cheapest') or ''
        k = next((l for l in LOWCOST if l.lower() in a.lower()), None)
        if k:
            by_a.setdefault(a, []).append(r)
    by_a = {a: sorted(l, key=lambda r: r['price_from_eur_return']) for a, l in by_a.items() if len(l) >= 3}
    if len(by_a) >= 3:
        order = sorted(by_a, key=lambda a: -len(by_a[a]))
        u_es, u_en = f'{SITE}/vuelos/aerolineas-low-cost/', f'{SITE}/en/flights/low-cost-airlines/'
        for en in (False, True):
            rows = ''.join(f'<tr><th scope="row"><a href="#{G.slugify(a)}">{e(a)}</a></th><td>{len(by_a[a])}</td><td class="pm-p">{("€" + str(by_a[a][0]["price_from_eur_return"])) if en else (str(by_a[a][0]["price_from_eur_return"]) + " €")}</td>'
                           f'<td>{int(statistics.median(r["price_from_eur_return"] for r in by_a[a]))}{"" if en else " €"}</td><td>{sum(1 for r in by_a[a] if r["stops_cheapest"] == 0)}</td></tr>' for a in order)
            hd = ('<th scope="col">Airline</th><th scope="col">Routes where it is cheapest</th><th scope="col">Lowest fare</th><th scope="col">Median fare (€)</th><th scope="col">Nonstop</th>' if en else
                  '<th scope="col">Aerolínea</th><th scope="col">Rutas donde es la más barata</th><th scope="col">Precio más bajo</th><th scope="col">Precio mediano</th><th scope="col">Directos</th>')
            body = f'<div class="pm-scroll" role="region" tabindex="0" aria-label="{"Airlines" if en else "Aerolíneas"}"><table class="pm-t"><thead><tr>{hd}</tr></thead><tbody>{rows}</tbody></table></div>'
            for a in order:
                body += f'<h2 id="{G.slugify(a)}">{e(a)}: {("cheapest routes" if en else "rutas más baratas")}</h2>' + rtable(by_a[a][:10], en, ('route', 'price', 'stops', 'date'))
            top = order[0]
            if en:
                q = f'In our route data, {top} offers the lowest fare on {len(by_a[top])} routes, more than any other low-cost airline. Its cheapest is {by_a[top][0]["en"]["origin"]} to {by_a[top][0]["en"]["destination"]} for €{by_a[top][0]["price_from_eur_return"]} return.'
                qas = [('Which low-cost airline is cheapest?', q), ('How was this table made?', 'For every indexed route we keep the airline of the cheapest return fare found on Kiwi.com. This page counts, for each low-cost airline, the routes where it was the cheapest.')]
                write(True, 'en/flights/low-cost-airlines', u_en, u_es, f'Low-cost airlines compared: real fares on {sum(len(v) for v in by_a.values())} routes',
                      f'Which low-cost airline is cheapest? {top} has the lowest fare on {len(by_a[top])} routes. Lowest fare, median and nonstop routes for {len(by_a)} airlines, from our own data.',
                      'Low-cost airlines compared with real fares', 'Own data, checked on Kiwi.com', q, f'{len(by_a)} low-cost airlines and the routes where each one had the cheapest return fare in our latest searches.',
                      body, qas, [('Home', '/en/'), ('Flights', '/en/flights/'), ('Low-cost airlines', None)])
            else:
                q = f'En nuestros datos de rutas, {top} tiene el precio más bajo en {len(by_a[top])} rutas, más que ninguna otra low cost. Su ruta más barata es {by_a[top][0]["origin"]}-{by_a[top][0]["destination"]} por {by_a[top][0]["price_from_eur_return"]} € ida y vuelta.'
                qas = [('¿Cuál es la aerolínea low cost más barata?', q), ('¿Cómo se ha hecho esta tabla?', 'De cada ruta indexada guardamos la aerolínea de la tarifa de ida y vuelta más barata encontrada en Kiwi.com. Aquí contamos, para cada low cost, las rutas en las que fue la más barata.')]
                write(False, 'vuelos/aerolineas-low-cost', u_es, u_en, f'Aerolíneas low cost comparadas: precios reales en {sum(len(v) for v in by_a.values())} rutas',
                      f'¿Qué aerolínea low cost es más barata? {top} tiene el precio más bajo en {len(by_a[top])} rutas. Precio más bajo, mediano y directos de {len(by_a)} aerolíneas, con datos propios.',
                      'Aerolíneas low cost comparadas con precios reales', 'Datos propios, consultados en Kiwi.com', q, f'{len(by_a)} aerolíneas low cost y las rutas en las que cada una tuvo la tarifa de ida y vuelta más barata en nuestras últimas consultas.',
                      body, qas, [('Inicio', '/'), ('Vuelos', '/vuelos/'), ('Aerolíneas low cost', None)])
        NAV['es'].append(('/vuelos/aerolineas-low-cost/', 'Aerolíneas low cost comparadas'))
        NAV['en'].append(('/en/flights/low-cost-airlines/', 'Low-cost airlines compared'))
    # ---- Aeropuertos de España ----
    by_o = {}
    for r in both(es):
        if r['origin'] in SPAIN:
            by_o.setdefault(r['origin'], []).append(r)
    if len(by_o) >= 5:
        u_es, u_en = f'{SITE}/vuelos/aeropuertos-espana/', f'{SITE}/en/flights/airports-spain/'
        order = sorted(by_o, key=lambda o: min(r['price_from_eur_return'] for r in by_o[o]))
        for en in (False, True):
            body = ''
            for o in order:
                lst = sorted(by_o[o], key=lambda r: r['price_from_eur_return'])[:5]
                on = en_names.city_en(o) if en else o
                hub = f'/en/flights/from/{G.slugify(on)}/' if en else f'/vuelos/desde/{G.slugify(o)}/'
                more = (f'<p><a href="{hub}">{"All cheap flights from " + e(on) if en else "Todos los vuelos baratos desde " + e(on)}</a></p>' if os.path.isfile(hub.strip('/') + '/index.html') else '')
                body += f'<h2>{("Cheapest destinations from " + e(on)) if en else ("Destinos más baratos desde " + e(on))}</h2>' + rtable(lst, en, ('dest', 'price', 'stops', 'airline')) + more
            c = min((r for o in by_o for r in by_o[o]), key=lambda r: r['price_from_eur_return'])
            if en:
                q = f'Of the {len(by_o)} Spanish airports in our data, the cheapest return fare is from {c["en"]["origin"]}: {c["en"]["destination"]} for €{c["price_from_eur_return"]} (checked {fd(c["checked_on"], True)}).'
                write(True, 'en/flights/airports-spain', u_en, u_es, f'Cheapest destinations from each Spanish airport ({len(by_o)} airports)',
                      f'The 5 cheapest return flights from {len(by_o)} airports in Spain (Madrid, Barcelona, Málaga and more), with real fares checked on Kiwi.com.',
                      'Cheapest destinations from each airport in Spain', 'Real fares, checked on Kiwi.com', q, 'For each Spanish airport, the five destinations with the cheapest return fare in our latest searches.',
                      body, [('Which Spanish airport has the cheapest flights?', q)], [('Home', '/en/'), ('Flights', '/en/flights/'), ('Airports in Spain', None)])
            else:
                q = f'De los {len(by_o)} aeropuertos españoles de nuestros datos, la tarifa de ida y vuelta más barata sale de {c["origin"]}: {c["destination"]} por {c["price_from_eur_return"]} € (consultado el {fd(c["checked_on"])}).'
                write(False, 'vuelos/aeropuertos-espana', u_es, u_en, f'Destinos más baratos desde cada aeropuerto de España ({len(by_o)} aeropuertos)',
                      f'Los 5 vuelos de ida y vuelta más baratos desde {len(by_o)} aeropuertos de España (Madrid, Barcelona, Málaga y más), con precios reales consultados en Kiwi.com.',
                      'Destinos más baratos desde cada aeropuerto de España', 'Precios reales, consultados en Kiwi.com', q, 'Para cada aeropuerto español, los cinco destinos con la tarifa de ida y vuelta más barata en nuestras últimas consultas.',
                      body, [('¿Desde qué aeropuerto de España salen los vuelos más baratos?', q)], [('Inicio', '/'), ('Vuelos', '/vuelos/'), ('Aeropuertos de España', None)])
        NAV['es'].append(('/vuelos/aeropuertos-espana/', 'Destinos baratos por aeropuerto de España'))
        NAV['en'].append(('/en/flights/airports-spain/', 'Cheapest destinations by Spanish airport'))
    return out


def guide_pages(es, lib, NAV):
    try:
        dias = json.load(open('destinos/dias.json', encoding='utf-8'))
    except Exception:
        return
    libm = {d['s']: d for d in lib}
    g = [(s, n) for s, n in dias.items() if s in libm and os.path.isfile(f'destinos/{s}/index.html') and os.path.isfile(f'en/destinations/{G.en_dest_slug(s)}/index.html') and n]
    cheap = {}
    for r in es:
        ds = G.slugify(r['destination'])
        if ds not in cheap or r['price_from_eur_return'] < cheap[ds]['price_from_eur_return']:
            cheap[ds] = r
    nm = lambda s, en: E.NAMES.get(s, libm[s]['n']) if en else libm[s]['n']
    link = lambda s, en: f'/en/destinations/{G.en_dest_slug(s)}/' if en else f'/destinos/{s}/'
    # ---- por días ----
    groups = {}
    for s, n in g:
        k = n if n <= 7 else (10 if n <= 10 else 14)
        groups.setdefault(k, []).append(s)
    if len(g) >= 20:
        u_es, u_en = f'{SITE}/destinos/por-dias/', f'{SITE}/en/destinations/by-days/'
        for en in (False, True):
            body = '<div class="r7-g">' + ''.join(f'<a href="#d{k}">{(str(k) + (" days" if k > 1 else " day")) if en else (str(k) + (" días" if k > 1 else " día"))}</a>' for k in sorted(groups)) + '</div>'
            for k in sorted(groups):
                lst = sorted(groups[k], key=lambda s: nm(s, en))
                lbl = (f'{k} days' if en else f'{k} días') if k <= 7 else ((f'8 to {k} days' if k == 10 else f'11 to {k} days') if en else (f'De 8 a {k} días' if k == 10 else f'De 11 a {k} días'))
                body += f'<h2 id="d{k}">{("Itineraries for " + lbl) if en else ("Guías para " + lbl.lower() if k <= 7 else "Guías de " + lbl.lower())} ({len(lst)})</h2><div class="r7-g">' + ''.join(
                    f'<a href="{link(s, en)}">{e(nm(s, en))}' + (f' · {dias[s]} {"days" if en else "días"}' if k > 7 else '') + '</a>' for s in lst) + '</div>'
            n3 = len(groups.get(3, []))
            if en:
                q = f'{len(g)} destination guides with a day-by-day itinerary, grouped by trip length. The most common is 3 days ({n3} guides), ideal for a long weekend.'
                qas = [('Which destinations can I see in 2 days?', 'In 2 days: ' + ', '.join(nm(s, True) for s in sorted(groups.get(2, []), key=lambda s: nm(s, True))[:12]) + '.')] if groups.get(2) else []
                qas += [('Which destinations can I see in 3 days?', 'In 3 days, for example: ' + ', '.join(nm(s, True) for s in sorted(groups.get(3, []), key=lambda s: nm(s, True))[:12]) + '.')] if groups.get(3) else []
                write(True, 'en/destinations/by-days', u_en, u_es, f'Travel itineraries by trip length: {len(g)} guides from 2 to 14 days',
                      f'Find a destination that fits your days off: {len(g)} itineraries grouped by length, from 2-day city breaks to 2-week trips. Each guide has a day-by-day route and a budget.',
                      'Travel itineraries by number of days', 'Destination guides', q, 'Pick how many days you have and choose a guide. Every guide has a day-by-day route, what it costs and cheap flight deals.',
                      body, qas, [('Home', '/en/'), ('Destinations', '/en/destinations/'), ('By number of days', None)],
                      [{"@type": "ItemList", "name": "Travel itineraries by number of days", "numberOfItems": len(g), "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": SITE + link(s, True), "name": nm(s, True)} for i, (s, _n) in enumerate(sorted(g, key=lambda x: (x[1], x[0])))]}])
            else:
                q = f'{len(g)} guías de destino con itinerario día a día, ordenadas por duración. Lo más habitual son 3 días ({n3} guías), perfecto para un puente.'
                qas = [('¿Qué destinos se pueden ver en 2 días?', 'En 2 días: ' + ', '.join(nm(s, False) for s in sorted(groups.get(2, []), key=lambda s: nm(s, False))[:12]) + '.')] if groups.get(2) else []
                qas += [('¿Qué destinos se pueden ver en 3 días?', 'En 3 días, por ejemplo: ' + ', '.join(nm(s, False) for s in sorted(groups.get(3, []), key=lambda s: nm(s, False))[:12]) + '.')] if groups.get(3) else []
                write(False, 'destinos/por-dias', u_es, u_en, f'Guías de viaje por días: {len(g)} destinos de 2 a 14 días',
                      f'Encuentra un destino para los días que tienes: {len(g)} guías ordenadas por duración, de escapadas de 2 días a viajes de 2 semanas. Cada una con ruta día a día y presupuesto.',
                      'Guías de viaje por número de días', 'Guías de destino', q, 'Elige cuántos días tienes y escoge una guía. Todas traen ruta día a día, cuánto cuesta y chollos de vuelos.',
                      body, qas, [('Inicio', '/'), ('Destinos', '/destinos/'), ('Por días', None)],
                      [{"@type": "ItemList", "name": "Guías de viaje por número de días", "numberOfItems": len(g), "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": SITE + link(s, False), "name": nm(s, False)} for i, (s, _n) in enumerate(sorted(g, key=lambda x: (x[1], x[0])))]}])
        NAV['es_d'].append(('/destinos/por-dias/', 'Guías por días de viaje'))
        NAV['en_d'].append(('/en/destinations/by-days/', 'Itineraries by number of days'))
    # ---- por continente ----
    reg = {}
    for s, n in g:
        reg.setdefault(libm[s].get('r'), []).append(s)
    for r_, lst in sorted(reg.items(), key=lambda x: -len(x[1])):
        if r_ not in REG or len(lst) < 4:
            continue
        nes, nen, sen = REG[r_]
        u_es, u_en = f'{SITE}/destinos/region/{r_}/', f'{SITE}/en/destinations/region/{sen}/'
        for en in (False, True):
            rows = ''
            items = sorted(lst, key=lambda s: nm(s, en))
            for s in items:
                c = cheap.get(s)
                fl = ''
                if c and (not en or c.get('en')):
                    fl = (f'<a href="{c["path_en"]}">€{c["price_from_eur_return"]} from {e(c["en"]["origin"])}</a>' if en else f'<a href="{c["path_es"]}">{c["price_from_eur_return"]} € desde {e(c["origin"])}</a>')
                rows += f'<tr><th scope="row"><a href="{link(s, en)}">{e(nm(s, en))}</a></th><td>{e(en_names.country_en(libm[s]["c"]) if en else libm[s]["c"])}</td><td>{dias[s]}</td><td>{fl or "–"}</td></tr>'
            hd = ('<th scope="col">Destination</th><th scope="col">Country</th><th scope="col">Days</th><th scope="col">Cheapest flight we found</th>' if en else
                  '<th scope="col">Destino</th><th scope="col">País</th><th scope="col">Días</th><th scope="col">Vuelo más barato que hemos visto</th>')
            body = f'<div class="pm-scroll" role="region" tabindex="0" aria-label="{e(nen if en else nes)}"><table class="pm-t"><thead><tr>{hd}</tr></thead><tbody>{rows}</tbody></table></div>'
            withf = [s for s in items if cheap.get(s) and (not en or cheap[s].get('en'))]
            cc = min(withf, key=lambda s: cheap[s]['price_from_eur_return']) if withf else None
            if en:
                q = f'{len(items)} travel guides for {nen}, each with a day-by-day itinerary and budget.' + (f' The cheapest flight we have seen to {nen} is to {nm(cc, True)}: €{cheap[cc]["price_from_eur_return"]} return from {cheap[cc]["en"]["origin"]}.' if cc else '')
                write(True, f'en/destinations/region/{sen}', u_en, u_es, f'{nen} travel guides: {len(items)} itineraries with real prices',
                      f'{len(items)} {nen} destination guides with day-by-day itineraries, budget and the cheapest flight we have found to each one.',
                      f'{nen}: travel guides and itineraries', 'Destination guides', q, f'Every {nen} destination we cover, how many days the itinerary lasts and the cheapest return flight in our data.',
                      body, [(f'What is the cheapest destination in {nen} to fly to?', q)] if cc else [], [('Home', '/en/'), ('Destinations', '/en/destinations/'), (nen, None)])
            else:
                q = f'{len(items)} guías de {nes}, cada una con ruta día a día y presupuesto.' + (f' El vuelo más barato que hemos visto a {nes} es a {nm(cc, False)}: {cheap[cc]["price_from_eur_return"]} € ida y vuelta desde {cheap[cc]["origin"]}.' if cc else '')
                write(False, f'destinos/region/{r_}', u_es, u_en, f'Guías de viaje de {nes}: {len(items)} destinos con precios reales',
                      f'{len(items)} guías de destinos de {nes} con itinerario día a día, presupuesto y el vuelo más barato que hemos encontrado a cada uno.',
                      f'{nes}: guías de viaje e itinerarios', 'Guías de destino', q, f'Todos los destinos de {nes} que tenemos, cuántos días dura su ruta y el vuelo de ida y vuelta más barato de nuestros datos.',
                      body, [(f'¿Cuál es el destino más barato para volar en {nes}?', q)] if cc else [], [('Inicio', '/'), ('Destinos', '/destinos/'), (nes, None)])
        NAV['es_d'].append((f'/destinos/region/{r_}/', f'Guías de {nes}'))
        NAV['en_d'].append((f'/en/destinations/region/{sen}/', f'{nen} guides'))


MES_L_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']


def y2027_pages(es, NAV):
    """Ronda 8 (#261): "Destinos baratos para viajar en 2027", con el mes más barato de cada ruta indexada (calendario de precios de Kiwi.com).
    Solo destinos cuyo mes más barato de los próximos seis cae en 2027; precio de ese mes, no inventado."""
    lst = [r for r in both(es) if str(r.get('cheapest_month') or '').startswith('2027') and r.get('cheapest_month_price_eur')]
    best = {}
    for r in lst:
        k = r['destination_iata']
        if k not in best or r['cheapest_month_price_eur'] < best[k]['cheapest_month_price_eur']:
            best[k] = r
    rows = sorted(best.values(), key=lambda r: r['cheapest_month_price_eur'])
    if len(rows) < 8:
        return
    lc = last_check(rows)
    u_es, u_en = f'{SITE}/vuelos/destinos-baratos-2027/', f'{SITE}/en/flights/cheap-destinations-2027/'
    c = rows[0]
    import collections
    mc = collections.Counter(r['cheapest_month'] for r in rows).most_common(1)[0]
    for en in (False, True):
        mname = (lambda ym: datetime.date(int(ym[:4]), int(ym[5:7]), 1).strftime('%B %Y')) if en else (lambda ym: f'{MES_L_ES[int(ym[5:7]) - 1]} de {ym[:4]}')
        th = ('Destination', 'From', 'Cheapest month', 'Return that month', 'Stops') if en else ('Destino', 'Desde', 'Mes más barato', 'Ida y vuelta ese mes', 'Escalas')
        trs = ''
        for r in rows:
            x = r['en'] if en else r
            href = r['path_en'] if en else r['path_es']
            pr = f'€{r["cheapest_month_price_eur"]}' if en else f'{r["cheapest_month_price_eur"]} €'
            trs += (f'<tr><th scope="row"><a href="{href}">{e(x["destination"])}</a></th><td>{e(x["origin"])}</td><td>{e(mname(r["cheapest_month"]))}</td>'
                    f'<td class="pm-p">{pr}</td><td>{e(stops(r["stops_cheapest"], en))}</td></tr>')
        tbl = (f'<div class="pm-scroll" role="region" tabindex="0" aria-label="{"Fares" if en else "Precios"}"><table class="pm-t"><thead><tr>'
               + ''.join(f'<th scope="col">{h}</th>' for h in th) + f'</tr></thead><tbody>{trs}</tbody></table></div>')
        ce = c['en'] if en else c
        if en:
            q = (f'The cheapest destination for 2027 in our price calendars is {ce["destination"]}: {ce["origin"]} to {ce["destination"]} costs €{c["cheapest_month_price_eur"]} return in {mname(c["cheapest_month"])}. '
                 f'{len(rows)} destinations have their cheapest month in 2027; the month that repeats most is {mname(mc[0])} ({mc[1]} destinations).')
            qas = [('What are the cheapest places to travel in 2027?', q),
                   ('Which month of 2027 is cheapest to fly?', f'In our data, {mname(mc[0])} is the cheapest month for {mc[1]} of the {len(rows)} destinations in this table. Prices come from the Kiwi.com price calendar and can change.')]
            write(True, 'en/flights/cheap-destinations-2027', u_en, u_es, f'Cheap destinations for 2027: {len(rows)} places from €{c["cheapest_month_price_eur"]}',
                  f'The cheapest places to travel in 2027 according to our fare calendars: {len(rows)} destinations from €{c["cheapest_month_price_eur"]} return, with the cheapest month for each. Checked {fd(lc, True)}.',
                  'Cheap destinations for 2027', 'Our fare calendars, checked on Kiwi.com', q,
                  'For each destination, the route and month of early 2027 with the cheapest return fare in our price calendar. Click a route for its full calendar.',
                  tbl, qas, [('Home', '/en/'), ('Flights', '/en/flights/'), ('Cheap destinations 2027', None)])
        else:
            q = (f'El destino más barato para 2027 en nuestros calendarios de precios es {c["destination"]}: {c["origin"]}-{c["destination"]} cuesta {c["cheapest_month_price_eur"]} € ida y vuelta en {mname(c["cheapest_month"])}. '
                 f'{len(rows)} destinos tienen su mes más barato en 2027; el mes que más se repite es {mname(mc[0])} ({mc[1]} destinos).')
            qas = [('¿Cuáles son los destinos más baratos para viajar en 2027?', q),
                   ('¿Qué mes de 2027 es el más barato para volar?', f'En nuestros datos, {mname(mc[0])} es el mes más barato para {mc[1]} de los {len(rows)} destinos de la tabla. Los precios salen del calendario de Kiwi.com y pueden cambiar.')]
            write(False, 'vuelos/destinos-baratos-2027', u_es, u_en, f'Destinos baratos para viajar en 2027: {len(rows)} desde {c["cheapest_month_price_eur"]} €',
                  f'Los destinos más baratos para viajar en 2027 según nuestros calendarios de precios: {len(rows)} destinos desde {c["cheapest_month_price_eur"]} € ida y vuelta, con el mes más barato de cada uno. Consulta del {fd(lc)}.',
                  'Destinos baratos para viajar en 2027', 'Calendarios de precios propios, consultados en Kiwi.com', q,
                  'Para cada destino, la ruta y el mes de principios de 2027 con el vuelo de ida y vuelta más barato de nuestro calendario de precios. Entra en cada ruta para ver el calendario completo.',
                  tbl, qas, [('Inicio', '/'), ('Vuelos', '/vuelos/'), ('Destinos baratos 2027', None)])
    NAV['es'].append(('/vuelos/destinos-baratos-2027/', 'Destinos baratos para viajar en 2027'))
    NAV['en'].append(('/en/flights/cheap-destinations-2027/', 'Cheap destinations for 2027'))


def inject_nav(NAV):
    """Enlaces a las páginas nuevas desde /vuelos/, /en/flights/, /destinos/ y /en/destinations/ (bloque idempotente)."""
    for f, key, h in (('vuelos/index.html', 'es', 'Más páginas con nuestros datos'), ('en/flights/index.html', 'en', 'More pages built on our data'),
                      ('destinos/index.html', 'es_d', 'Guías por días y por continente'), ('en/destinations/index.html', 'en_d', 'Guides by trip length and region')):
        if not NAV[key] or not os.path.exists(f):
            continue
        s = open(f, encoding='utf-8').read()
        blk = f'<!--hlc-r7--><section class="wrap" style="margin:22px auto"><h2>{h}</h2><div class="r7-g" style="display:flex;flex-wrap:wrap;gap:8px">' + ''.join(
            f'<a class="hub-l" href="{u}">{e(t)}</a>' for u, t in NAV[key]) + '</div></section><!--/hlc-r7-->'
        s = re.sub(r'<!--hlc-r7-->.*?<!--/hlc-r7-->', '', s, flags=re.S)
        if '</main>' in s:
            s = s.replace('</main>', blk + '</main>', 1)
            open(f, 'w', encoding='utf-8').write(s)


def main():
    es, lib = load()
    NAV = {'es': [], 'en': [], 'es_d': [], 'en_d': []}
    region_pages(es, NAV)
    guide_pages(es, lib, NAV)
    y2027_pages(es, NAV)
    inject_nav(NAV)
    urls = [u for k in ('es', 'es_d') for u, _ in NAV[k]] + [u for k in ('en', 'en_d') for u, _ in NAV[k]]
    json.dump(urls, open(os.path.join('vuelos', 'r7_pages.json'), 'w', encoding='utf-8'))
    print('r7 pages', len(urls))
    return urls


if __name__ == '__main__':
    main()
