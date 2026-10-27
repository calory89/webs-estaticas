# -*- coding: utf-8 -*-
# Lo esencial del planeta entero: comedores, albergues, duchas, ropa, ONG y
# centros sociales de cualquier pueblo del mundo, no solo de las ciudades de la
# lista. Se baja por celdas de 10 grados; si una celda falla o viene demasiado
# llena (Europa), se parte en cuatro y se vuelve a pedir. Cada celda se guarda
# al llegar: si esto se corta, no se pierde lo bajado.
import json, os, subprocess, time, threading
from concurrent.futures import ThreadPoolExecutor
EPS = ["https://overpass.kumi.systems/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"]
OUTF = 'raw_planet.json'
OUT = json.load(open(OUTF)) if os.path.exists(OUTF) else {}
lock = threading.Lock()
BIG = 25000          # mas de esto en una celda: se parte, para no perder nada por el tope

def q(s, w, n, e):
    b = '(%s,%s,%s,%s)' % (s, w, n, e)
    # valores exactos, no regex: Overpass usa el indice y tarda la mitad
    parts = ['nwr["social_facility"]', 'nwr["shop"="charity"]', 'nwr["office"="ngo"]', 'nwr["office"="charity"]'] + \
            ['nwr["amenity"="%s"]' % v for v in ('shower','public_bath','refugee_site','food_sharing','give_box','social_centre','social_facility')]
    return '[out:json][timeout:50];(' + ''.join(x + b + ';' for x in parts) + ');out center tags;'

def fetch(cell, k0=0):
    s, w, n, e = cell
    for k in range(3):
        ep = EPS[(k + k0) % len(EPS)]
        try:
            o = subprocess.run(['curl', '-sG', '-m', '58', ep, '--data-urlencode', 'data=' + q(s, w, n, e)], capture_output=True)
            t = o.stdout.decode('utf-8', 'ignore')
            if t.strip().startswith('{'):
                j = json.loads(t)
                if j.get('remark') and 'runtime error' in j['remark']:
                    print('  remark', cell, j['remark'][:80], flush=True); return None
                return j.get('elements', [])
            print('  no-json', cell, ep.split('/')[2], o.returncode, t[:60].replace('\n',' '), flush=True)
        except Exception as ex:
            print('  exc', cell, str(ex)[:60], flush=True)
        time.sleep(3)
    return None

def job(arg):
    idx, cell = arg
    s, w, n, e = cell
    key = '%g_%g_%g' % (s, w, n - s)
    if key in OUT: return
    els = fetch(cell, idx)
    if els is None or len(els) >= BIG:
        size = n - s
        if size <= 0.3:
            with lock:
                if els is None: print('celda', key, 'FALLO (se reintenta la proxima vez)', flush=True)
                else:
                    OUT[key] = els; json.dump(OUT, open(OUTF, 'w'))
                    print('celda', key, 'TOPE', len(els), flush=True)
            return
        h = size / 2
        subs = [(s, w, s + h, w + h), (s, w + h, s + h, e), (s + h, w, n, w + h), (s + h, w + h, n, e)]
        for i, sc in enumerate(subs): job((idx + i, sc))
        return
    with lock:
        OUT[key] = els
        json.dump(OUT, open(OUTF, 'w'))
        print('celda', key, len(els), '| total', sum(len(v) for v in OUT.values()), flush=True)

cells = []
for s in range(-60, 80, 5):
    for w in range(-180, 180, 5):
        cells.append((s, w, s + 5, w + 5))
# celdas ya cubiertas por una de 10 grados bajada al principio
def covered(c):
    for k in OUT:
        s0, w0, sz = map(float, k.split('_'))
        if sz >= 10 and s0 <= c[0] and c[2] <= s0 + sz and w0 <= c[1] and c[3] <= w0 + sz: return True
    return False
cells = [c for c in cells if not covered(c)]
# solo celdas con alguna ciudad de 40.000 habitantes o mas (13.298 en OSM): las
# demas son oceano, desierto, hielo o selva, y cada peticion vacia cuesta 30 s
LAND = set(tuple(x) for x in json.load(open('land_cells.json')))
cells = [c for c in cells if (c[0], c[1]) in LAND]
print('celdas por bajar:', len(cells), flush=True)
# primero las que mas tienen, para que lo gordo quede hecho pronto
cells.sort(key=lambda c: (abs(c[0] - 40), abs(c[1] - 10)))
with ThreadPoolExecutor(max_workers=3) as ex:
    list(ex.map(job, list(enumerate(cells))))
json.dump(OUT, open(OUTF, 'w'))
print('LISTO', len(OUT), sum(len(v) for v in OUT.values()), flush=True)
