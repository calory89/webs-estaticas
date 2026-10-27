# Las 200 ciudades nuevas, de los paises donde mas falta hace.
#
# Vienen de una consulta por pais a OpenStreetMap, asi que el pais no hay que
# adivinarlo: viene en la propia consulta. El orden de paises sale del PIB por
# habitante y de la pobreza extrema del Banco Mundial, no de mi criterio.
import json, math, re
from collections import defaultdict

need_top = json.load(open('need_top.json'))          # ya ordenados de mas a menos necesidad
raw = json.load(open('cities_need.json'))


def pop(t):
    d = ''.join(ch for ch in (t.get('population', '') or '') if ch.isdigit())
    return int(d) if d else 0


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

by = defaultdict(list)
for cc, els in raw.items():
    for e in els:
        t = e.get('tags') or {}
        la = e.get('lat') or (e.get('center') or {}).get('lat')
        lo = e.get('lon') or (e.get('center') or {}).get('lon')
        name = t.get('name:en') or t.get('name')
        if la is None or lo is None or not name:
            continue
        by[cc].append({'name': name.strip(), 'local': (t.get('name') or name).strip(),
                       'lat': round(la, 5), 'lon': round(lo, 5), 'cc': cc,
                       'pop': pop(t), 'place': t.get('place', '')})

for cc, v in by.items():
    # Dentro de cada pais mandan las mas grandes, y una capital sin poblacion
    # etiquetada no se queda fuera solo por eso.
    # La poblacion real manda siempre. El comodin para las que no la llevan
    # etiquetada es pequeno a proposito: antes valia 400.000 y colaba pueblos sin
    # dato por delante de capitales de verdad. Asi se quedo Juba fuera, que es la
    # capital del pais con mas necesidad de toda la lista.
    v.sort(key=lambda c: (-(c['pop'] if c['pop'] else (60000 if c['place'] == 'city' else 0)), c['name']))
    # quitar duplicados muy juntos dentro del propio pais
    keep = []
    for c in v:
        if any(hav(c['lat'], c['lon'], k['lat'], k['lon']) < 25 for k in keep):
            continue
        keep.append(c)
    by[cc] = keep

order = [cc for cc in need_top if by.get(cc)]
print('paises con ciudades disponibles:', len(order))

CAP = 6                                              # tope por pais, para repartir
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
    k = c['name'].lower() + '|' + c['cc']
    if k in seen:
        continue
    seen.add(k)
    out.append(c)

json.dump(out, open('cities_new200.json', 'w'), ensure_ascii=False, indent=0)
cnt = defaultdict(int)
for c in out:
    cnt[c['cc']] += 1
print('elegidas:', len(out), '| paises:', len(cnt))
print('con poblacion etiquetada:', sum(1 for c in out if c['pop']),
      '| mediana:', sorted(c['pop'] for c in out if c['pop'])[len([c for c in out if c['pop']]) // 2] if any(c['pop'] for c in out) else 0)
print('reparto:', ' '.join('%s:%d' % (k, v) for k, v in sorted(cnt.items(), key=lambda x: -x[1])))
