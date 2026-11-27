# -*- coding: utf-8 -*-
"""Bloques de datos para los articulos: telefonos, horarios de fin de semana, bibliotecas, fuentes, informe."""
import csv, re, math, json, io, os, collections
from core import *

NEED_LAB = {
 'es': {'food': 'comida', 'shelter': 'albergues', 'hygiene': 'duchas y aseos', 'health': 'salud', 'social': 'servicios sociales',
        'warm': 'sitios donde estar', 'clothes': 'ropa'},
 'en': {'food': 'food', 'shelter': 'shelters', 'hygiene': 'showers and toilets', 'health': 'health care', 'social': 'social services',
        'warm': 'warm places', 'clothes': 'clothes'}}

# ---------- telefonos de ayuda (helplines/social.json, revisado a mano) y emergencias ----------
def phones(cc, lang='es'):
    d = HELP.get(cc, {})
    rows = []
    for x in d.get('national', []):
        rows.append(('Todo el país' if lang == 'es' else 'Whole country', x))
    for city, xs in d.get('cities', {}).items():
        for x in xs: rows.append((city, x))
    if not rows: return ''
    lab = 'label_es' if lang == 'es' else 'label_en'
    hd = ('Dónde', 'Teléfono', 'Para qué', 'Gratis', '24 h') if lang == 'es' else ('Where', 'Number', 'What for', 'Free call', '24 h')
    yes, no = ('sí', 'no') if lang == 'es' else ('yes', 'no')
    tr = ''.join('<tr><td>%s</td><td class="n"><a href="tel:%s">%s</a></td><td><a href="%s" rel="noopener">%s</a></td><td>%s</td><td>%s</td></tr>' % (
        esc(w), re.sub(r'[^\d+]', '', x['n']), esc(x['n']), esc(x['url']), esc(x[lab]), yes if x.get('free') else no, yes if x.get('h24') else no) for w, x in rows)
    return '<div class="tw"><table><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>' % (''.join('<th>%s</th>' % h for h in hd), tr)


EMG = list(csv.DictReader(open(LIVE + '/emergency-numbers.csv', encoding='utf-8')))
ES_NAMES = {}
def emergency_table(lang='es'):
    by = collections.OrderedDict()
    for r in EMG:
        by.setdefault((r['country'], r['country_code']), []).append(r)
    svc = {'es': {'general': 'general', 'police': 'policía', 'emergency medical services': 'ambulancia', 'fire department': 'bomberos'},
           'en': {}}
    hd = ('País', 'Emergencias', 'Otros') if lang == 'es' else ('Country', 'Emergency', 'Others')
    tr = []
    for (country, cc), rs in sorted(by.items()):
        gen = [r['number'] for r in rs if r['service'] == 'general']
        oth = ['%s %s' % (svc.get(lang, {}).get(r['service'], r['service']), r['number']) for r in rs if r['service'] != 'general']
        tr.append('<tr><td>%s</td><td class="n">%s</td><td>%s</td></tr>' % (esc(country), esc(' / '.join(gen) or '—'), esc(', '.join(oth))))
    return '<div class="tw"><table><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>' % (''.join('<th>%s</th>' % h for h in hd), ''.join(tr))


# ---------- horarios: abiertos en fin de semana ----------
def open_weekend(e):
    if '24/7' in e or '00:00–24:00' in e: return True
    if not re.search(r'\d\d:\d\d', e): return False
    days = re.findall(r'(Mon–Sun|lun–dom|Sat[^·]*|Sun[^·]*|sáb[^·]*|dom[^·]*|Tue–Sun|mar–dom|Sat–Sun[^·]*)', e)
    if days: return any('closed' not in d and 'cerrado' not in d for d in days)
    return not re.search(r'[A-Za-záé]{3}', e.split(' ')[0])  # solo horas: todos los dias


def weekend_list(scope, needs='food,shelter,hygiene', lang='es', limit='60'):
    if scope.startswith('cc='): cs = cities_where(ccs=set(scope[3:].split(',')))
    else: cs = cities_where(lang=scope[5:])
    out = []
    for c in sorted(cs, key=lambda c: c['name']):
        ps = []
        for nd in needs.split(','):
            for p in c['needs'].get(nd, {}).get('places', []):
                hrs = [e for e in p['extra'] if re.search(r'\d\d:\d\d|24/7', e)]
                if hrs and any(open_weekend(e) for e in hrs) and not generic(p): ps.append(p)
        if ps:
            seen = set(); ps2 = []
            for p in ps:
                if p['href'] not in seen: seen.add(p['href']); ps2.append(p)
            out.append('<h3>%s</h3><ul class="pl">%s</ul>' % (esc(c['name']), ''.join(place_li(p) for p in ps2[:8])))
    return ''.join(out[:int(limit)]) or '<p>—</p>'


# ---------- por tipo de sitio en ciudades (ct contiene) ----------
def type_list(scope, need, ctpat, per='5', limit='40'):
    if scope.startswith('cc='): cs = cities_where(ccs=set(scope[3:].split(',')))
    elif scope.startswith('lang='): cs = cities_where(lang=scope[5:])
    else: cs = cities_where()
    out = []
    for c in sorted(cs, key=lambda c: c['name']):
        ps = [p for p in c['needs'].get(need, {}).get('places', []) if re.search(ctpat, p['ct'], re.I) and not generic(p)]
        if ps: out.append('<h3>%s <small>(%s)</small></h3><ul class="pl">%s</ul>' % (esc(c['name']), esc(c['country']), ''.join(place_li(p) for p in ps[:int(per)])))
    return ''.join(out[:int(limit)]) or '<p>—</p>'


def type_count_table(scope, need, ctpat, lab_city, lab_n, lab_link, linktext, minn='1'):
    if scope.startswith('cc='): cs = cities_where(ccs=set(scope[3:].split(',')))
    elif scope.startswith('lang='): cs = cities_where(lang=scope[5:])
    else: cs = cities_where()
    rows = []
    for c in cs:
        k = sum(1 for p in c['needs'].get(need, {}).get('places', []) if re.search(ctpat, p['ct'], re.I))
        if k >= int(minn): rows.append((k, c))
    rows.sort(key=lambda r: (-r[0], r[1]['name']))
    tr = ''.join('<tr><td>%s</td><td class="n">%d</td><td><a href="../c/%s-%s">%s</a></td></tr>' % (esc(c['name']), k, c['slug'], need, esc(linktext)) for k, c in rows)
    return '<div class="tw"><table><thead><tr><th>%s</th><th>%s</th><th>%s</th></tr></thead><tbody>%s</tbody></table></div>' % (esc(lab_city), esc(lab_n), esc(lab_link), tr)


# ---------- carteles imprimibles ----------
def posters(scope, label):
    cs = cities_where(ccs=set(scope[3:].split(','))) if scope.startswith('cc=') else cities_where(lang=scope[5:])
    cs = [c for c in cs if os.path.exists('%s/c/%s.cartel.html' % (LIVE, c['slug']))]
    return '<p class="needs">%s</p>' % ''.join('<a href="../c/%s.cartel">%s</a>' % (c['slug'], esc(c['name'])) for c in sorted(cs, key=lambda c: c['name']))


# ---------- fuentes de agua (CSV abierto de Espana + centro aproximado de cada ciudad) ----------
def _center(c):
    pts = []
    for v in c['needs'].values():
        for p in v['places']:
            m = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', p['href'])
            if m: pts.append((float(m.group(1)), float(m.group(2))))
    if not pts: return None
    pts.sort(); la = sorted(x[0] for x in pts)[len(pts) // 2]; lo = sorted(x[1] for x in pts)[len(pts) // 2]
    return la, lo


def _km(a, b, c, d):
    p = math.pi / 180
    x = math.sin((c - a) * p / 2) ** 2 + math.cos(a * p) * math.cos(c * p) * math.sin((d - b) * p / 2) ** 2
    return 12742 * math.asin(math.sqrt(x))


_ES = None
def es_csv():
    global _ES
    if _ES is None: _ES = list(csv.DictReader(open('/home/claude/sn/es.csv', encoding='utf-8')))
    return _ES


def csv_type_table(types, lab_city, lab_n, km='5'):
    rows = []
    pts = [(float(r['lat']), float(r['lon'])) for r in es_csv() if r['type'] in types.split(',')]
    for c in cities_where(cc='ES'):
        ce = _center(c)
        if not ce: continue
        k = sum(1 for la, lo in pts if abs(la - ce[0]) < 0.1 and abs(lo - ce[1]) < 0.12 and _km(ce[0], ce[1], la, lo) <= float(km))
        if k: rows.append((k, c))
    rows.sort(key=lambda r: (-r[0], r[1]['name']))
    tr = ''.join('<tr><td><a href="../c/%s">%s</a></td><td class="n">%d</td></tr>' % (c['slug'], esc(c['name']), k) for k, c in rows)
    return '<div class="tw"><table><thead><tr><th>%s</th><th>%s</th></tr></thead><tbody>%s</tbody></table></div>' % (esc(lab_city), esc(lab_n), tr)


# ---------- informe: barras ----------
def bars(rows, unit=''):
    mx = max(v for _, v in rows) or 1
    return ''.join('<div class="bar"><span>%s</span><i style="width:%.1f%%"></i><b>%s%s</b></div>' % (esc(l), 70.0 * v / mx, format(v, ',d').replace(',', '.'), esc(unit)) for l, v in rows)


def report_need_bars(scope, need, top='15'):
    cs = cities_where(ccs=set(scope[3:].split(','))) if scope.startswith('cc=') else cities_where(lang=scope[5:])
    rows = sorted(((c['name'], count_of(c, need)[0]) for c in cs), key=lambda r: -r[1])[:int(top)]
    return bars([r for r in rows if r[1] > 0])


def report_gaps(scope, lang='es'):
    cs = cities_where(ccs=set(scope[3:].split(',')))
    needs = ['food', 'shelter', 'hygiene']
    lab = NEED_LAB[lang]
    tr = []
    for c in sorted(cs, key=lambda c: c['name']):
        miss = [lab[n] for n in needs if count_of(c, n)[0] == 0]
        if miss: tr.append('<tr><td><a href="../c/%s">%s</a></td><td>%s</td></tr>' % (c['slug'], esc(c['name']), esc(', '.join(miss))))
    hd = ('Ciudad', 'Sin nada en el mapa para') if lang == 'es' else ('City', 'Nothing mapped for')
    return '<div class="tw"><table><thead><tr><th>%s</th><th>%s</th></tr></thead><tbody>%s</tbody></table></div>' % (hd[0], hd[1], ''.join(tr))


def report_summary(scope, lang='es'):
    cs = cities_where(ccs=set(scope[3:].split(',')))
    tot = collections.Counter()
    for c in cs:
        for n in ('food', 'shelter', 'hygiene', 'health', 'social', 'warm'):
            tot[n] += count_of(c, n)[0]
    lab = NEED_LAB[lang]
    return '<ul class="cnt">%s</ul>' % ''.join('<li><b>%s</b>%s</li>' % (format(tot[n], ',d').replace(',', '.'), esc(lab[n])) for n in ('food', 'shelter', 'hygiene', 'health', 'social', 'warm'))


def hours_share(scope, lang='es'):
    cs = cities_where(ccs=set(scope[3:].split(','))) if scope.startswith('cc=') else cities_where(lang=scope[5:])
    rows = []
    for n in ('food', 'shelter', 'hygiene'):
        tot = withh = wk = 0
        for c in cs:
            for p in c['needs'].get(n, {}).get('places', []):
                tot += 1; hrs = [e for e in p['extra'] if re.search(r'\d\d:\d\d|24/7', e)]
                if hrs: withh += 1; wk += any(open_weekend(e) for e in hrs)
        rows.append((NEED_LAB[lang][n], tot, withh, wk))
    hd = ('Necesidad', 'Sitios listados', 'Con horario', 'Abren en fin de semana (según su horario)') if lang == 'es' else \
         ('Need', 'Places listed', 'With hours', 'Open at weekends (per their hours)')
    tr = ''.join('<tr><td>%s</td><td class="n">%d</td><td class="n">%d (%d %%)</td><td class="n">%d</td></tr>' % (esc(l), t, w, round(100 * w / t) if t else 0, k) for l, t, w, k in rows)
    return '<div class="tw"><table><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>' % (''.join('<th>%s</th>' % h for h in hd), tr)


def countries_table(lang='es'):
    # /datos/index.html: filas pais -> numero de sitios
    h = open(LIVE + '/datos/index.html', encoding='utf-8').read()
    rows = re.findall(r'<tr><td><a href="[^"]+">([^<]+)</a></td><td>\d+</td><td>([\d,]+)</td>', h)
    rows = sorted(((H.unescape(nm), int(n.replace(',', ''))) for nm, n in rows), key=lambda r: -r[1])[:20]
    return bars(rows)


for k, f in dict(phones=phones, emergency=emergency_table, weekend=weekend_list, types=type_list, typecount=type_count_table,
                 posters=posters, csvtypes=csv_type_table, rbars=report_need_bars, gaps=report_gaps, rsum=report_summary,
                 hshare=hours_share, countries=countries_table).items():
    DATA[k] = f
