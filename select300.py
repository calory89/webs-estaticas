# Elige 300 ciudades nuevas repartidas por el mundo.
# Ordenar solo por poblacion daba una lista 80% china: para un mapa de ayuda
# eso es mala cobertura. Se reparte por rondas: primero la mayor de cada pais,
# luego la segunda de cada pais, etc. Asi 90 paises entran antes de que China
# meta su quinta ciudad.
import json, math, re
from collections import defaultdict

cand = json.load(open('cities_cc.json'))
cand = [c for c in cand if c.get('cc') and (c.get('en') or c.get('name'))]

# no repetir lo que ya esta en el mapa
src = open('build.py', encoding='utf-8').read()
have = []
for m in re.finditer(r'\(\s*"([^"]+)"\s*,\s*"([^"]*)"\s*,\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*,\s*"[^"]+"\s*\)', src):
    have.append((float(m.group(3)), float(m.group(4))))
for m in re.finditer(r'\("([^"]+)","([^"]*)",(-?\d+\.\d+),(-?\d+\.\d+)\)', src):
    have.append((float(m.group(3)), float(m.group(4))))

def hav(a,b,c,d):
    R=6371.0;p=math.pi/180
    x=math.sin((c-a)*p/2)**2+math.cos(a*p)*math.cos(c*p)*math.sin((d-b)*p/2)**2
    return 2*R*math.asin(math.sqrt(x))

by = defaultdict(list)
for c in cand: by[c['cc']].append(c)
for v in by.values(): v.sort(key=lambda c: -c['pop'])

CAP = 14                       # tope por pais, para que nadie acapare la lista
picked, r = [], 0
while len(picked) < 300 and r < CAP:
    progress = False
    for cc in sorted(by, key=lambda k: (-by[k][0]['pop'] if by[k] else 0)):
        if len(by[cc]) <= r: continue
        c = by[cc][r]
        if any(hav(c['lat'],c['lon'],a,b) < 40 for a,b in have): continue
        picked.append(c); have.append((c['lat'],c['lon'])); progress = True
        if len(picked) >= 300: break
    if not progress: break
    r += 1

seen=set(); out=[]
for c in picked:
    n = (c.get('en') or c['name']).strip()
    if n.lower() in seen: continue
    seen.add(n.lower())
    out.append({'name':n, 'local':c['name'], 'lat':round(c['lat'],5), 'lon':round(c['lon'],5),
                'cc':c['cc'], 'country':c.get('country',''), 'pop':c['pop']})

json.dump(out, open('cities_new300.json','w'), ensure_ascii=False, indent=0)
cnt = defaultdict(int)
for c in out: cnt[c['country'] or c['cc']] += 1
print('elegidas:', len(out), '| paises:', len(cnt))
print('top paises:', sorted(cnt.items(), key=lambda x:-x[1])[:12])
