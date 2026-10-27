# Elige 200 ciudades mas, priorizando donde la gente mas lo necesita.
#
# La necesidad no la pongo yo: sale del PIB por habitante (PPA) y del porcentaje
# de poblacion en pobreza extrema, los dos del Banco Mundial. Dentro de cada
# pais mandan las ciudades mas grandes que aun no estan en el mapa.
import json, math, re
from collections import defaultdict

wb = json.load(open('wb_raw.json'))
iso23 = json.load(open('iso2to3.json'))
gdp, pov = wb['gdp'], wb['pov']

GDP_MAX = max(gdp.values())


def need(cc2):
    """0 = pais rico y sin pobreza extrema. 1 = lo contrario."""
    i3 = iso23.get(cc2)
    if not i3:
        return 0.45                                   # sin datos: ni arriba ni abajo
    g = gdp.get(i3)
    p = pov.get(i3)
    # PIB por habitante en escala logaritmica: la diferencia entre 1.500 y 3.000
    # pesa lo mismo que entre 30.000 y 60.000, que es como se nota de verdad.
    if g and g > 0:
        s_g = 1 - (math.log(g) - math.log(700)) / (math.log(GDP_MAX) - math.log(700))
        s_g = min(1.0, max(0.0, s_g))
    else:
        s_g = 0.45
    s_p = min(1.0, (p or 0) / 40.0)                   # 40% o mas: tope
    return 0.6 * s_g + 0.4 * s_p


def hav(a, b, c, d):
    R = 6371.0; p = math.pi / 180
    x = (math.sin((c - a) * p / 2) ** 2 +
         math.cos(a * p) * math.cos(c * p) * math.sin((d - b) * p / 2) ** 2)
    return 2 * R * math.asin(math.sqrt(x))


# --- lo que ya esta en el mapa ---
src = open('build.py', encoding='utf-8').read()
have = []
for m in re.finditer(r'\(\s*"([^"]+)"\s*,\s*"([^"]*)"\s*,\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*,\s*"[^"]+"\s*\)', src):
    have.append((float(m.group(3)), float(m.group(4))))
for m in re.finditer(r'\("([^"]+)","([^"]*)",(-?\d+\.\d+),(-?\d+\.\d+)\)', src):
    have.append((float(m.group(3)), float(m.group(4))))
for c in json.load(open('cities_new300.json')):
    have.append((c['lat'], c['lon']))

# --- candidatas que ya tienen pais resuelto y aun no se han usado ---
cand = []
for c in json.load(open('cities_cc.json')):
    if not c.get('cc') or not (c.get('en') or c.get('name')):
        continue
    if any(hav(c['lat'], c['lon'], a, b) < 40 for a, b in have):
        continue
    cand.append(c)

print('candidatas libres con pais:', len(cand))

by = defaultdict(list)
for c in cand:
    by[c['cc']].append(c)
for v in by.values():
    v.sort(key=lambda c: -c['pop'])

# Orden de paises por necesidad. Dentro, por rondas, para que un pais no acapare.
order = sorted(by, key=lambda cc: -need(cc))
CAP = 10
picked, r = [], 0
while len(picked) < 200 and r < CAP:
    moved = False
    for cc in order:
        if len(by[cc]) <= r:
            continue
        c = by[cc][r]
        if any(hav(c['lat'], c['lon'], a, b) < 35 for a, b in have):
            continue
        picked.append(c); have.append((c['lat'], c['lon'])); moved = True
        if len(picked) >= 200:
            break
    if not moved:
        break
    r += 1

seen, out = set(), []
for c in picked:
    n = (c.get('en') or c['name']).strip()
    if n.lower() in seen:
        continue
    seen.add(n.lower())
    out.append({'name': n, 'local': c['name'], 'lat': round(c['lat'], 5), 'lon': round(c['lon'], 5),
                'cc': c['cc'], 'country': c.get('country', ''), 'pop': c['pop'],
                'need': round(need(c['cc']), 3)})

json.dump(out, open('cities_new200.json', 'w'), ensure_ascii=False, indent=0)

cnt = defaultdict(int)
for c in out:
    cnt[c['country'] or c['cc']] += 1
print('elegidas:', len(out), '| paises:', len(cnt))
print('necesidad media:', round(sum(c['need'] for c in out) / max(1, len(out)), 3))
print('los 15 paises con mas ciudades nuevas:')
for k, v in sorted(cnt.items(), key=lambda x: -x[1])[:15]:
    print('   %-28s %d' % (k, v))
