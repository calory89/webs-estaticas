# -*- coding: utf-8 -*-
"""Refresco completo de los datos de OpenStreetMap de SupportNear.

Sustituye a fetch_es.py, fetch_world*.py, fetch200/300/500.py, fetch_empty.py y
fetch_planet.py (los ficheros crudos de septiembre se perdieron). Se lanza en
GitHub Actions con el workflow patch-pub sobre la rama src/supportnear:

    python3 refresh/fetch_all.py <raiz de la rama>

* Tres capas, en este orden:
    nat     España entera (lo de fetch_es.py) + agua/aseos/bibliotecas de las 48 ciudades
    cities  las 1.173 ciudades del resto del mundo (11 km; 25 km y mas etiquetas
            si la ciudad sale casi vacia, como hacia fetch_empty.py)
    planet  lo esencial (comedores, albergues, duchas, ropa, ONG) de cualquier
            pueblo del mundo, por celdas de 5 grados que se parten si no caben
* Se puede cortar en cualquier momento: cada respuesta se añade a
  raw/<capa>.jsonl al llegar y al volver a lanzarlo se sigue donde se quedo.
  Cada 40 minutos se hace commit y push de lo bajado.
* Pide `out meta` para saber la fecha de la ultima edicion de cada sitio (lo que
  antes hacia fetch_meta.py con una segunda tanda de consultas); de los metadatos
  solo se guarda la fecha: ni usuario ni uid.
* Solo servidores Overpass publicos de la comunidad, con pocas consultas a la vez
  y esperas cuando dicen que esperemos (429).
"""
import gzip, io, json, os, subprocess, sys, threading, time
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else '.')
RAW = os.path.join(ROOT, 'raw')
os.makedirs(RAW, exist_ok=True)
BUDGET = float(os.environ.get('BUDGET_MIN', '325')) * 60
T0 = time.time()
EPS = {  # servidor -> consultas a la vez
    'https://overpass-api.de/api/interpreter': 2,
    'https://overpass.kumi.systems/api/interpreter': 2,
    'https://overpass.private.coffee/api/interpreter': 1,
}
SEM = {ep: threading.Semaphore(n) for ep, n in EPS.items()}
COOL = {ep: 0.0 for ep in EPS}          # hasta cuando no se le pregunta (429)
LOCK = threading.Lock()
STATS = {'ok': 0, 'fail': 0, 'els': 0, '429': 0}


def left():
    return BUDGET - (time.time() - T0)


def load(layer):
    """Lo ya bajado de una capa: {clave: elementos}."""
    out = {}
    for fn in (layer + '.jsonl.gz', layer + '.jsonl'):
        p = os.path.join(RAW, fn)
        if not os.path.exists(p):
            continue
        op = gzip.open if fn.endswith('.gz') else open
        with op(p, 'rt', encoding='utf-8') as f:
            for line in f:
                try:
                    o = json.loads(line)
                    out[o['k']] = o['els']
                except Exception:
                    pass
    return out


def slim(els):
    out = []
    for e in els:
        o = {'type': e.get('type'), 'id': e.get('id')}
        for k in ('lat', 'lon', 'center', 'tags'):
            if k in e:
                o[k] = e[k]
        ts = e.get('timestamp')
        if ts:
            o['ts'] = ts[:10]
        out.append(o)
    return out


def append(layer, key, els):
    with LOCK:
        with open(os.path.join(RAW, layer + '.jsonl'), 'a', encoding='utf-8') as f:
            f.write(json.dumps({'k': key, 'els': els}, ensure_ascii=False, separators=(',', ':')) + '\n')
        STATS['ok'] += 1
        STATS['els'] += len(els)


def ask(q, maxtime, tries=6):
    """Una consulta. Devuelve la lista de elementos, 'TOPE' si Overpass la corto
    por tiempo o memoria (hay que partirla) o None si no hubo manera."""
    order = list(EPS)
    for k in range(tries):
        if left() < maxtime + 60:
            return None
        ep = order[(k + int(time.time())) % len(order)]
        wait = COOL[ep] - time.time()
        if wait > 0:
            time.sleep(min(wait, 30))
        with SEM[ep]:
            try:
                o = subprocess.run(['curl', '-sG', '-m', str(maxtime), '-w', '\n%{http_code}', ep,
                                    '--data-urlencode', 'data=' + q], capture_output=True)
                t = o.stdout.decode('utf-8', 'ignore')
                body, _, code = t.rpartition('\n')
            except Exception:
                body, code = '', '000'
        if code == '429':
            with LOCK:
                STATS['429'] += 1
            COOL[ep] = time.time() + 30
            continue
        if body.strip().startswith('{'):
            try:
                j = json.loads(body)
            except Exception:
                time.sleep(5)
                continue
            rem = j.get('remark') or ''
            if 'runtime error' in rem or 'Query timed out' in rem or 'out of memory' in rem:
                return 'TOPE'
            return j.get('elements', [])
        time.sleep(4 + 4 * k)
    with LOCK:
        STATS['fail'] += 1
    return None


# ------------------------------------------------------------------ capas
ES = '[out:json][timeout:280];area["ISO3166-1"="ES"][admin_level=2]->.a;'
NAT_JOBS = [
    ('social_facility', ES + 'nwr["social_facility"](area.a);out center meta;'),
    ('amenities', ES + 'nwr["amenity"~"^(shower|public_bath|refugee_site|food_sharing|give_box|social_centre)$"](area.a);out center meta;'),
    ('orgs', ES + '(nwr["shop"="charity"](area.a);nwr["office"="ngo"](area.a););out center meta;'),
    ('hospital', ES + 'nwr["amenity"="hospital"](area.a);out center meta;'),
    ('healthcentre', ES + '(nwr["healthcare"="centre"](area.a);nwr["amenity"="doctors"]["healthcare"](area.a););out center meta;'),
    ('named', ES + '(nwr["name"~"C[áa]ritas|Cruz Roja|Creu Roja|Banco de Alimentos|Banc dels Aliments|Comedor [Ss]ocial|Menjador [Ss]ocial|Albergue|Casa de Acogida|Centro de Acogida|Ropero|Roper[ií]a|Economato [Ss]ocial",i](area.a);'
                  'nwr["operator"~"C[áa]ritas|Cruz Roja|Creu Roja|Banco de Alimentos",i](area.a);'
                  'nwr["social_facility:for"~"homeless|homless"](area.a););out center meta 8000;'),
]


def q_es_city(la, lo):
    return ('[out:json][timeout:200];(nwr["amenity"="drinking_water"](around:3500,%s,%s);'
            'nwr["amenity"="toilets"]["fee"="no"](around:3500,%s,%s);'
            'nwr["amenity"="library"](around:6000,%s,%s););out center meta;' % (la, lo, la, lo, la, lo))


def q_city(la, lo):
    a = '(around:11000,%s,%s)' % (la, lo)
    b = '(around:2500,%s,%s)' % (la, lo)
    return ('[out:json][timeout:180];('
            'nwr["social_facility"]%s;'
            'nwr["amenity"~"^(shower|public_bath|refugee_site|food_sharing|give_box|social_centre)$"]%s;'
            'nwr["shop"="charity"]%s;nwr["office"="ngo"]%s;nwr["amenity"="library"]%s;'
            'nwr["amenity"="hospital"]%s;nwr["healthcare"="centre"]%s;'
            'nwr["amenity"="drinking_water"]%s;nwr["amenity"="toilets"]["fee"="no"]%s;'
            ');out center meta 2500;' % (a, a, a, a, a, a, a, b, b))


def q_wide(la, lo):
    a = '(around:25000,%s,%s)' % (la, lo)
    b = '(around:6000,%s,%s)' % (la, lo)
    return ('[out:json][timeout:180];('
            'nwr["social_facility"]%s;'
            'nwr["amenity"~"^(shower|public_bath|refugee_site|food_sharing|give_box|social_centre|community_centre|social_facility)$"]%s;'
            'nwr["shop"="charity"]%s;nwr["office"~"^(ngo|charity|association)$"]%s;nwr["amenity"="library"]%s;'
            'nwr["amenity"~"^(hospital|clinic|doctors|health_post|pharmacy)$"]%s;nwr["healthcare"]%s;'
            'nwr["amenity"="drinking_water"]%s;nwr["man_made"="water_well"]["drinking_water"!="no"]%s;nwr["man_made"="water_tap"]%s;'
            'nwr["amenity"="toilets"]%s;'
            'nwr["amenity"="place_of_worship"]["social_facility"]%s;'
            ');out center meta 3000;' % (a, a, a, a, a, a, a, b, b, b, b, a))


def q_planet(s, w, n, e):
    b = '(%s,%s,%s,%s)' % (s, w, n, e)
    parts = ['nwr["social_facility"]', 'nwr["shop"="charity"]', 'nwr["office"="ngo"]', 'nwr["office"="charity"]'] + \
            ['nwr["amenity"="%s"]' % v for v in ('shower', 'public_bath', 'refugee_site', 'food_sharing',
                                                  'give_box', 'social_centre', 'social_facility')]
    return '[out:json][timeout:90];(' + ''.join(x + b + ';' for x in parts) + ');out center meta;'


def run_nat(cities):
    have = load('nat')
    jobs = [(k, q, 300) for k, q in NAT_JOBS if k not in have]
    jobs += [(c['nkey'], q_es_city(c['lat'], c['lon']), 220) for c in cities if c['es'] and c['nkey'] not in have]
    print('nat: por bajar', len(jobs), flush=True)

    def one(j):
        k, q, mt = j
        els = ask(q, mt)
        if isinstance(els, list):
            append('nat', k, slim(els))
            print('nat', k, len(els), flush=True)
        else:
            print('nat FALLO', k, els, flush=True)
    with ThreadPoolExecutor(max_workers=4) as ex:
        list(ex.map(one, jobs))


def run_cities(cities):
    have = load('cities')
    todo = [c for c in cities if not c['es'] and c['key'] not in have]
    print('ciudades: por bajar', len(todo), 'de', sum(1 for c in cities if not c['es']), flush=True)

    def one(c):
        if left() < 400:
            return
        els = ask(q_city(c['lat'], c['lon']), 200)
        if els == 'TOPE' or els is None:
            # una ciudad enorme: se pide la version con tope de 2500 ya va; si
            # falla igual, se deja para la proxima vuelta
            print('ciudad FALLO', c['disp'], els, flush=True)
            return
        els = slim(els)
        if len(els) < 40:
            w = ask(q_wide(c['lat'], c['lon']), 200)
            if isinstance(w, list):
                seen = {(e['type'], e['id']) for e in els}
                els += [e for e in slim(w) if (e['type'], e['id']) not in seen]
        append('cities', c['key'], els)
        print('ciudad', c['disp'], len(els), '| %d ok, %d fallos, %.0f min' %
              (STATS['ok'], STATS['fail'], (time.time() - T0) / 60), flush=True)
    with ThreadPoolExecutor(max_workers=5) as ex:
        list(ex.map(one, todo))


BIG = 25000


def run_planet():
    have = load('planet')
    land = [tuple(x) for x in json.load(open(os.path.join(ROOT, 'refresh', 'cells_land.json')))]
    done_cover = []
    for k in have:
        s0, w0, sz = map(float, k.split('_'))
        done_cover.append((s0, w0, sz))

    def covered(s, w, sz):
        return any(s0 <= s and s + sz <= s0 + z0 and w0 <= w and w + sz <= w0 + z0 for s0, w0, z0 in done_cover)
    todo = [(s, w, 5.0) for s, w in land if not covered(s, w, 5.0)]
    todo.sort(key=lambda c: (abs(c[0] - 40), abs(c[1] - 10)))
    print('planeta: celdas de 5 grados por bajar', len(todo), 'de', len(land), flush=True)

    def one(cell):
        s, w, sz = cell
        if left() < 300:
            return
        key = '%g_%g_%g' % (s, w, sz)
        if covered(s, w, sz):
            return
        els = ask(q_planet(s, w, s + sz, w + sz), 100)
        if els is None:
            # los servidores no contestan: se deja para la proxima vuelta (partirla
            # aqui solo multiplicaria las consultas a servidores que ya fallan)
            print('celda', key, 'FALLO (se reintenta la proxima vez)', flush=True)
            return
        if els == 'TOPE' or len(els) >= BIG:
            if sz <= 0.3:
                if isinstance(els, list):
                    append('planet', key, slim(els))
                    with LOCK:
                        done_cover.append((s, w, sz))
                print('celda', key, 'NO CABE', flush=True)
                return
            h = sz / 2
            for sub in ((s, w, h), (s, w + h, h), (s + h, w, h), (s + h, w + h, h)):
                one(sub)
            return
        append('planet', key, slim(els))
        with LOCK:
            done_cover.append((s, w, sz))
        print('celda', key, len(els), '| %d ok, %d fallos, %.0f min' %
              (STATS['ok'], STATS['fail'], (time.time() - T0) / 60), flush=True)
    with ThreadPoolExecutor(max_workers=5) as ex:
        list(ex.map(one, todo))


def pack():
    """jsonl -> jsonl.gz (lo que se sube a git). Junta lo viejo y lo nuevo."""
    for layer in ('nat', 'cities', 'planet'):
        p = os.path.join(RAW, layer + '.jsonl')
        if not os.path.exists(p):
            continue
        allk = load(layer)
        with gzip.open(os.path.join(RAW, layer + '.jsonl.gz'), 'wt', encoding='utf-8', compresslevel=9) as f:
            for k, els in allk.items():
                f.write(json.dumps({'k': k, 'els': els}, ensure_ascii=False, separators=(',', ':')) + '\n')
        os.remove(p)


def checkpoint_loop(stop):
    last = time.time()
    while not stop.is_set():
        time.sleep(30)
        if time.time() - last > 40 * 60:
            last = time.time()
            with LOCK:
                pack()
            subprocess.run('git add raw && git -c user.name=calory89 -c user.email=rrppspain@gmail.com '
                           'commit -q -m "SupportNear refresco OSM: avance" && git push -q origin HEAD:$(git branch --show-current)',
                           shell=True, cwd=ROOT)
            print('== guardado en git a los %.0f min' % ((time.time() - T0) / 60), flush=True)


if __name__ == '__main__':
    cities = json.load(open(os.path.join(ROOT, 'refresh', 'cities_all.json'), encoding='utf-8'))
    stop = threading.Event()
    th = threading.Thread(target=checkpoint_loop, args=(stop,), daemon=True)
    th.start()
    try:
        run_nat(cities)
        run_cities(cities)
        run_planet()
    finally:
        stop.set()
        with LOCK:
            pack()
    st = {l: len(load(l)) for l in ('nat', 'cities', 'planet')}
    nat_ok = len(NAT_JOBS) + sum(1 for c in cities if c['es'])
    cit_ok = sum(1 for c in cities if not c['es'])
    land = [tuple(x) for x in json.load(open(os.path.join(ROOT, 'refresh', 'cells_land.json')))]
    cov = [tuple(map(float, k.split('_'))) for k in load('planet')]
    def _cov_area(s, w):
        # parte de la celda de 5 grados que ya esta bajada (0..1)
        return sum(z0 * z0 for s0, w0, z0 in cov if s <= s0 < s + 5 and w <= w0 < w + 5) / 25.0
    pl_left = sum(1 for s, w in land if _cov_area(s, w) < 0.999)
    st['planet_cells_left'] = pl_left
    complete = st['nat'] >= nat_ok and st['cities'] >= cit_ok and pl_left == 0
    print('RESUMEN', json.dumps(st), json.dumps(STATS), 'min=%.0f' % ((time.time() - T0) / 60),
          'COMPLETO' if complete else 'SIGUE (relanzar)', flush=True)
