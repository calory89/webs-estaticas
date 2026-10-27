# -*- coding: utf-8 -*-
"""Refresco completo de los datos de OpenStreetMap de SupportNear.

Sustituye a fetch_es.py, fetch_world*.py, fetch200/300/500.py, fetch_empty.py,
fetch_planet.py y fetch_meta.py (los ficheros crudos de septiembre se perdieron).
Se lanza en GitHub Actions con el workflow patch-pub sobre la rama src/supportnear:

    BUDGET_MIN=330 python3 refresh/fetch_all.py <raiz de la rama>

Que baja (tres capas, todas a la vez en una sola cola):
    nat     España: por celdas de 1 grado dentro de España (lo que antes eran seis
            consultas de pais entero, que con los servidores cargados no acababan
            nunca) + agua, aseos y bibliotecas de las 48 ciudades
    cities  las 1.173 ciudades del resto del mundo (11 km; 25 km y mas etiquetas
            si la ciudad sale casi vacia, como hacia fetch_empty.py)
    planet  lo esencial (comedores, albergues, duchas, ropa, ONG) de cualquier
            pueblo del mundo, por celdas de 5 grados que se parten si no caben

Como:
* Una sola cola. Una consulta que falla vuelve al final de la cola (hasta 4
  veces por vuelta) en vez de bloquear a las demas reintentando.
* Cada servidor tiene sus huecos; se elige el que mejor va. Tras tres fallos
  seguidos descansa dos minutos; si dice 429, lo que diga.
* Cada respuesta se añade a raw/<capa>.jsonl al llegar. Cada 20 minutos se
  comprime, se escribe raw/progress.json y se hace commit y push: si el job se
  corta no se pierde nada, y al relanzarlo sigue donde se quedo.
* `out meta`: de los metadatos solo se guarda la fecha (ni usuario ni uid).
"""
import gzip, json, os, random, subprocess, sys, threading, time
from collections import deque

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else '.')
RAW = os.path.join(ROOT, 'raw')
os.makedirs(RAW, exist_ok=True)
BUDGET = float(os.environ.get('BUDGET_MIN', '330')) * 60
WORKERS = int(os.environ.get('WORKERS', '6'))
T0 = time.time()
# overpass-api.de contesta 406 a las peticiones sin un User-Agent que diga quien
# pregunta (lo comprobamos el 27-oct desde GitHub Actions): va el de la web.
UA = 'SupportNear-data-refresh/1.0 (+https://supportnear.com/about)'
# Servidores publicos; el que falla se queda sin trabajo solo (ver pick_ep). Aqui
# no viaja la posicion de nadie: son consultas por ciudad y por celda del mapa.
EPS = json.loads(os.environ.get('EPS_JSON', 'null') or 'null') or {
    'https://overpass-api.de/api/interpreter': 2,
    'https://overpass.private.coffee/api/interpreter': 1,
    'https://overpass.kumi.systems/api/interpreter': 1,
    'https://overpass.openstreetmap.fr/api/interpreter': 1,
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter': 1,
}
LOCK = threading.Lock()
EP = {ep: {'slots': n, 'busy': 0, 'ok': 0, 'fail': 0, 'tope': 0, '429': 0, 'streak': 0, 'cool': 0.0, 'secs': 0.0}
      for ep, n in EPS.items()}
STATS = {'ok': 0, 'fail': 0, 'gaveup': 0, 'els': 0}


def left():
    return BUDGET - (time.time() - T0)


def mins():
    return (time.time() - T0) / 60


# ------------------------------------------------------------------ almacen
def load(layer):
    out = {}
    for fn in (layer + '.jsonl.gz', layer + '.jsonl'):
        p = os.path.join(RAW, fn)
        if not os.path.exists(p):
            continue
        op = gzip.open if fn.endswith('.gz') else open
        try:
            with op(p, 'rt', encoding='utf-8') as f:
                for line in f:
                    try:
                        o = json.loads(line)
                        out[o['k']] = o['els']
                    except Exception:
                        pass
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


def pack():
    for layer in ('nat', 'cities', 'planet'):
        p = os.path.join(RAW, layer + '.jsonl')
        if not os.path.exists(p):
            continue
        allk = load(layer)
        tmp = os.path.join(RAW, layer + '.jsonl.gz.tmp')
        with gzip.open(tmp, 'wt', encoding='utf-8', compresslevel=9) as f:
            for k, els in allk.items():
                f.write(json.dumps({'k': k, 'els': els}, ensure_ascii=False, separators=(',', ':')) + '\n')
        os.replace(tmp, os.path.join(RAW, layer + '.jsonl.gz'))
        os.remove(p)


# ------------------------------------------------------------------ servidores
def pick_ep():
    """El servidor libre que mejor va, o None si ahora no hay ninguno."""
    now = time.time()
    best, bs = None, -1e9
    for ep, s in EP.items():
        if s['busy'] >= s['slots'] or s['cool'] > now:
            continue
        n = s['ok'] + s['fail'] + 1
        avg = s['secs'] / max(1, s['ok'])
        score = (s['ok'] + 1) / n - avg / 600.0 + random.random() * 0.05
        if score > bs:
            best, bs = ep, score
    if best:
        EP[best]['busy'] += 1
    return best


def ask(q, maxtime):
    """Un intento. Devuelve (lista | 'TOPE' | None)."""
    while True:
        with LOCK:
            ep = pick_ep()
        if ep:
            break
        if left() < maxtime + 60:
            return None
        time.sleep(2)
    t = time.time()
    try:
        o = subprocess.run(['curl', '-sG', '-A', UA, '-m', str(maxtime), '-w', '\n%{http_code}', ep,
                            '--data-urlencode', 'data=' + q], capture_output=True)
        body, _, code = o.stdout.decode('utf-8', 'ignore').rpartition('\n')
    except Exception:
        body, code = '', '000'
    dt = time.time() - t
    res = None
    if body.strip().startswith('{'):
        try:
            j = json.loads(body)
            rem = j.get('remark') or ''
            if 'runtime error' in rem or 'timed out' in rem or 'out of memory' in rem:
                res = 'TOPE'
            else:
                res = j.get('elements', [])
        except Exception:
            res = None
    with LOCK:
        s = EP[ep]
        s['busy'] -= 1
        if isinstance(res, list):
            s['ok'] += 1; s['secs'] += dt; s['streak'] = 0
        elif res == 'TOPE':
            s['tope'] += 1; s['streak'] = 0
        else:
            s['fail'] += 1; s['streak'] += 1
            if code == '429':
                s['429'] += 1
                s['cool'] = time.time() + 60
            elif s['streak'] >= 3:
                s['cool'] = time.time() + 120
    return res


# ------------------------------------------------------------------ consultas
HELP_ES = ['nwr["social_facility"]', 'nwr["amenity"~"^(shower|public_bath|refugee_site|food_sharing|give_box|social_centre)$"]',
           'nwr["shop"="charity"]', 'nwr["office"="ngo"]', 'nwr["amenity"="hospital"]', 'nwr["healthcare"="centre"]',
           'nwr["amenity"="doctors"]["healthcare"]',
           'nwr["name"~"C[áa]ritas|Cruz Roja|Creu Roja|Banco de Alimentos|Banc dels Aliments|Comedor [Ss]ocial|Menjador [Ss]ocial|Albergue|Casa de Acogida|Centro de Acogida|Ropero|Roper[ií]a|Economato [Ss]ocial",i]',
           'nwr["operator"~"C[áa]ritas|Cruz Roja|Creu Roja|Banco de Alimentos",i]',
           'nwr["social_facility:for"~"homeless|homless"]']


def q_es_cell(s, w, n, e):
    b = '(area.a)(%s,%s,%s,%s)' % (s, w, n, e)
    return ('[out:json][timeout:170];area["ISO3166-1"="ES"][admin_level=2]->.a;('
            + ''.join(x + b + ';' for x in HELP_ES) + ');out center meta;')


def q_es_city(la, lo):
    return ('[out:json][timeout:120];(nwr["amenity"="drinking_water"](around:3500,%s,%s);'
            'nwr["amenity"="toilets"]["fee"="no"](around:3500,%s,%s);'
            'nwr["amenity"="library"](around:6000,%s,%s););out center meta;' % (la, lo, la, lo, la, lo))


def q_city(la, lo):
    a = '(around:11000,%s,%s)' % (la, lo)
    b = '(around:2500,%s,%s)' % (la, lo)
    return ('[out:json][timeout:170];('
            'nwr["social_facility"]%s;'
            'nwr["amenity"~"^(shower|public_bath|refugee_site|food_sharing|give_box|social_centre)$"]%s;'
            'nwr["shop"="charity"]%s;nwr["office"="ngo"]%s;nwr["amenity"="library"]%s;'
            'nwr["amenity"="hospital"]%s;nwr["healthcare"="centre"]%s;'
            'nwr["amenity"="drinking_water"]%s;nwr["amenity"="toilets"]["fee"="no"]%s;'
            ');out center meta 2500;' % (a, a, a, a, a, a, a, b, b))


def q_wide(la, lo):
    a = '(around:25000,%s,%s)' % (la, lo)
    b = '(around:6000,%s,%s)' % (la, lo)
    return ('[out:json][timeout:170];('
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
    return '[out:json][timeout:100];(' + ''.join(x + b + ';' for x in parts) + ');out center meta;'


BIG = 25000


# ------------------------------------------------------------------ trabajos
def make_jobs(cities):
    jobs = []
    nat = load('nat')
    for c in cities:
        if c['es'] and c['nkey'] not in nat:
            jobs.append({'layer': 'nat', 'key': c['nkey'], 'q': q_es_city(c['lat'], c['lon']), 'mt': 140, 'n': 0})
    escov = [tuple(map(float, k[3:].split('_'))) for k in nat if k.startswith('es:')]
    for s, w in json.load(open(os.path.join(ROOT, 'refresh', 'cells_es.json'))):
        s, w = float(s), float(w)
        inside = [c for c in escov if s <= c[0] < s + 1 and w <= c[1] < w + 1]
        if sum(z * z for _, _, z in inside) >= 0.999:
            continue
        if inside:
            # la celda se partio la vez anterior: se piden los cuartos que faltan
            for ss, ww in ((s, w), (s, w + .5), (s + .5, w), (s + .5, w + .5)):
                if not any(c[0] <= ss < c[0] + c[2] and c[1] <= ww < c[1] + c[2] for c in inside):
                    jobs.append({'layer': 'nat', 'key': 'es:%g_%g_0.5' % (ss, ww), 'q': q_es_cell(ss, ww, ss + .5, ww + .5),
                                 'mt': 190, 'n': 0, 'cell': (ss, ww, 0.5)})
            continue
        jobs.append({'layer': 'nat', 'key': 'es:%g_%g_1' % (s, w), 'q': q_es_cell(s, w, s + 1, w + 1), 'mt': 190, 'n': 0, 'cell': (s, w, 1.0)})
    have = load('cities')
    for c in cities:
        if not c['es'] and c['key'] not in have:
            jobs.append({'layer': 'cities', 'key': c['key'], 'q': q_city(c['lat'], c['lon']), 'mt': 190, 'n': 0, 'city': c})
    pl = load('planet')
    cover = [tuple(map(float, k.split('_'))) for k in pl]

    def covered(s, w, sz):
        return any(s0 <= s and s + sz <= s0 + z0 and w0 <= w and w + sz <= w0 + z0 for s0, w0, z0 in cover)
    land = [tuple(x) for x in json.load(open(os.path.join(ROOT, 'refresh', 'cells_land.json')))]
    todo = []

    def add_cell(s, w, sz):
        if covered(s, w, sz):
            return
        # trozos ya bajados dentro: se piden solo los cuartos que faltan
        if any(s <= s0 < s + sz and w <= w0 < w + sz for s0, w0, z0 in cover):
            h = sz / 2
            for ss, ww in ((s, w), (s, w + h), (s + h, w), (s + h, w + h)):
                add_cell(ss, ww, h)
            return
        todo.append((s, w, sz))
    for s, w in land:
        add_cell(float(s), float(w), 5.0)
    for s, w, sz in todo:
        jobs.append({'layer': 'planet', 'key': '%g_%g_%g' % (s, w, sz), 'q': q_planet(s, w, s + sz, w + sz),
                     'mt': 120, 'n': 0, 'cell': (s, w, sz)})
    return jobs


Q = deque()


def run_job(j):
    res = ask(j['q'], j['mt'])
    if isinstance(res, list) and j['layer'] == 'planet' and len(res) >= BIG:
        res = 'TOPE'
    if res == 'TOPE' and 'cell' in j:
        s, w, sz = j['cell']
        if sz > 0.3:
            h = sz / 2
            with LOCK:
                for ss, ww in ((s, w), (s, w + h), (s + h, w), (s + h, w + h)):
                    if j['layer'] == 'planet':
                        Q.appendleft({'layer': 'planet', 'key': '%g_%g_%g' % (ss, ww, h), 'q': q_planet(ss, ww, ss + h, ww + h),
                                      'mt': 120, 'n': 0, 'cell': (ss, ww, h)})
                    else:
                        Q.appendleft({'layer': 'nat', 'key': 'es:%g_%g_%g' % (ss, ww, h), 'q': q_es_cell(ss, ww, ss + h, ww + h),
                                      'mt': 190, 'n': 0, 'cell': (ss, ww, h)})
            print('parte', j['key'], flush=True)
            return
        res = None
    if isinstance(res, list):
        els = slim(res)
        if j['layer'] == 'cities' and len(els) < 40:
            w = ask(q_wide(j['city']['lat'], j['city']['lon']), 190)
            if isinstance(w, list):
                seen = {(e['type'], e['id']) for e in els}
                els += [e for e in slim(w) if (e['type'], e['id']) not in seen]
        append(j['layer'], j['key'], els)
        if STATS['ok'] % 25 == 0:
            print('%5.0f min | %d ok, %d fallos, cola %d | %s' % (mins(), STATS['ok'], STATS['fail'], len(Q),
                  ' '.join('%s:%d/%d' % (ep.split('/')[2].split('.')[-2], s['ok'], s['fail']) for ep, s in EP.items())), flush=True)
        return
    with LOCK:
        STATS['fail'] += 1
        j['n'] += 1
        if j['n'] < 4:
            Q.append(j)
        else:
            STATS['gaveup'] += 1
            print('se deja para la proxima vuelta:', j['layer'], j['key'], flush=True)


def worker():
    while left() > 240:
        with LOCK:
            j = Q.popleft() if Q else None
        if j is None:
            # quiza otros hilos van a partir celdas: esperar un poco antes de acabar
            time.sleep(5)
            with LOCK:
                if not Q and all(s['busy'] == 0 for s in EP.values()):
                    return
            continue
        run_job(j)


def progress(final=False):
    st = {l: len(load(l)) for l in ('nat', 'cities', 'planet')}
    p = {'min': round(mins()), 'final': final, 'stored': st, 'stats': STATS, 'queue': len(Q),
         'eps': {ep.split('/')[2]: {k: (round(v) if isinstance(v, float) else v) for k, v in s.items()} for ep, s in EP.items()}}
    json.dump(p, open(os.path.join(RAW, 'progress.json'), 'w'), indent=1)
    return p


def checkpoint_loop(stop):
    last = time.time()
    while not stop.is_set():
        time.sleep(20)
        if time.time() - last > 20 * 60:
            last = time.time()
            with LOCK:
                pack()
            progress()
            subprocess.run('git add raw && git -c user.name=calory89 -c user.email=rrppspain@gmail.com '
                           'commit -q -m "SupportNear refresco OSM: avance" && '
                           'git push -q origin HEAD:$(git branch --show-current)', shell=True, cwd=ROOT)
            print('== guardado en git a los %.0f min' % mins(), flush=True)


if __name__ == '__main__':
    cities = json.load(open(os.path.join(ROOT, 'refresh', 'cities_all.json'), encoding='utf-8'))
    jobs = make_jobs(cities)
    # primero lo pequeño y seguro (España, ciudades), con el planeta intercalado
    small = [j for j in jobs if j['layer'] != 'planet']
    big = [j for j in jobs if j['layer'] == 'planet']
    big.sort(key=lambda j: (abs(j['cell'][0] - 40), abs(j['cell'][1] - 10)))
    i = 0
    for j in small:
        Q.append(j)
        i += 1
        if i % 3 == 0 and big:
            Q.append(big.pop(0))
    Q.extend(big)
    print('trabajos:', len(jobs), {l: sum(1 for j in jobs if j['layer'] == l) for l in ('nat', 'cities', 'planet')}, flush=True)
    stop = threading.Event()
    threading.Thread(target=checkpoint_loop, args=(stop,), daemon=True).start()
    ths = [threading.Thread(target=worker) for _ in range(WORKERS)]
    for t in ths:
        t.start()
    for t in ths:
        t.join()
    stop.set()
    with LOCK:
        pack()
    p = progress(final=True)
    rest = make_jobs(cities)
    print('RESUMEN', json.dumps(p['stored']), json.dumps(STATS), 'min=%.0f' % mins(),
          'pendientes=%d' % len(rest), 'COMPLETO' if not rest else 'SIGUE (relanzar)', flush=True)
