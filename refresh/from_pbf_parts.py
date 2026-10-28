# -*- coding: utf-8 -*-
"""Como from_pbf.py, pero por partes: cada region se guarda (raw/parts/<region>.jsonl.gz) y se
sube a git al acabarla, asi un job que se corta a las 6 h no pierde nada. Al relanzarlo
se salta lo hecho; cuando estan todas, se juntan en raw/{nat,cities,planet}.jsonl.gz.

Refresco de los datos de OpenStreetMap SIN Overpass: desde los ficheros .pbf de Geofabrik.

El 27-oct-2026 los servidores Overpass publicos estaban saturados (de 385
consultas en 20 minutos, 337 fallaron): pedir 2.000 consultas era cosa de dias.
Este script baja los extractos de Geofabrik continente a continente (unos 85 GB
en total, en el disco temporal de GitHub Actions), se queda con lo que interesa
con osmium y escribe exactamente lo mismo que escribia refresh/fetch_all.py:

    raw/nat.jsonl.gz     España (de spain-latest.osm.pbf): 'es:all' + 'city:<Ciudad>'
    raw/cities.jsonl.gz  las 1.173 ciudades del resto del mundo, por coordenadas
    raw/planet.jsonl.gz  lo esencial de cualquier sitio del mundo, por celdas de 5 grados

con las mismas reglas que las consultas de antes (radios de 11 km y 2,5 km, 25 y
6 km si la ciudad sale casi vacia, tope de 2.500 / 3.000 por ciudad). Sin
usuario ni uid: de los metadatos solo se guarda la fecha de la ultima edicion.

    python3 refresh/from_pbf.py <raiz de la rama>      (en GitHub Actions, con sudo)
"""
import gzip, json, math, os, re, shutil, subprocess, sys, time

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else '.')
RAW = os.path.join(ROOT, 'raw')
T0 = time.time()
UA = 'SupportNear-data-refresh/1.0 (+https://supportnear.com/about)'
GF = 'https://download.geofabrik.de/'
# Extractos de Geofabrik: continentes pequeños enteros y los grandes (Europa, Asia,
# Norteamerica) pais a pais o estado a estado: el disco de un runner tiene unos 14 GB
# y europe-latest pesa 33 (el 28-oct los jobs por continente murieron sin disco).
_R = json.load(open(os.path.join(ROOT, 'refresh', 'regions.json'), encoding='utf-8'))
SIZE_GB = {r: s for r, s in _R}
ALL_REGIONS = ['europe/spain'] + [r for r, _ in _R if r != 'europe/spain']   # España primero (mas etiquetas)
REGIONS = list(ALL_REGIONS)
if os.environ.get('REGIONS'):
    REGIONS = os.environ['REGIONS'].split(',')
elif os.environ.get('JOB'):              # JOB=k/N: reparto por tamaño en N cajas parecidas
    k, N = map(int, os.environ['JOB'].split('/'))
    bins = [[0.0, []] for _ in range(N)]
    for r in sorted(ALL_REGIONS, key=lambda r: (-SIZE_GB[r], r)):
        b = min(bins, key=lambda b: b[0]); b[0] += SIZE_GB[r]; b[1].append(r)
    REGIONS = bins[k][1]
LOGF = os.path.join(RAW, 'parts', '_log_%s.txt' % os.environ.get('JOB', 'x').replace('/', 'de'))


def log(*a):
    line = '%6.1f min | %s' % ((time.time() - T0) / 60, ' '.join(str(x) for x in a))
    print(line, flush=True)
    try:
        os.makedirs(os.path.dirname(LOGF), exist_ok=True)
        open(LOGF, 'a').write(line + '\n')     # va a git con cada parte: si el runner muere, queda
    except Exception:
        pass


def sh(cmd, **kw):
    r = subprocess.run(cmd, shell=True, **kw)
    if r.returncode:
        raise SystemExit('fallo: %s' % cmd)
    return r


# ------------------------------------------------------------------ disco y osmium
WORK = os.environ.get('OSM_WORK', '/mnt/osm')
try:
    sh('mkdir -p %s 2>/dev/null || (sudo mkdir -p %s && sudo chown $(id -u) %s)' % (WORK, WORK, WORK))
except SystemExit:
    WORK = '/tmp/osm'
    os.makedirs(WORK, exist_ok=True)
if not shutil.which('osmium'):
    sh('sudo apt-get -qq update >/dev/null && sudo apt-get -qq install -y osmium-tool >/dev/null')
log('osmium', subprocess.run(['osmium', '--version'], capture_output=True, text=True).stdout.splitlines()[0],
    '| disco', WORK, shutil.disk_usage(WORK).free // 2**30, 'GB libres')

FILTER = os.path.join(WORK, 'filter.txt')
open(FILTER, 'w').write('\n'.join([
    'nwr/social_facility', 'nwr/social_facility:for',
    'nwr/amenity=shower,public_bath,refugee_site,food_sharing,give_box,social_centre,community_centre,'
    'social_facility,library,hospital,clinic,doctors,health_post,pharmacy,drinking_water,toilets',
    'nwr/shop=charity', 'nwr/office=ngo,charity,association', 'nwr/healthcare',
    'nwr/man_made=water_well,water_tap']) + '\n')
# España: ademas cualquier amenity/office/albergue, para buscar por nombre
# («Cáritas», «Comedor social», «Ropero»...) como hacia la consulta 'named'.
FILTER_ES = os.path.join(WORK, 'filter_es.txt')
open(FILTER_ES, 'w').write(open(FILTER).read() + 'nwr/amenity\nnwr/office\nnwr/tourism=hostel\n')


def elements(region, filt):
    """Baja el extracto, filtra, exporta y va dando (tipo, id, lat, lon, tags, fecha)."""
    name = region.replace('/', '_')       # europe/georgia y us/georgia no chocan
    pbf = os.path.join(WORK, name + '.osm.pbf')
    flt = os.path.join(WORK, name + '.f.pbf')
    geo = os.path.join(WORK, name + '.geojsonseq')
    url = GF + region + '-latest.osm.pbf'
    t = time.time()
    free = shutil.disk_usage(WORK).free / 2**30
    if free < SIZE_GB.get(region, 5) * 1.6 + 1:
        raise SystemExit('sin disco para %s: %.1f GB libres' % (region, free))
    if not os.path.exists(pbf):          # (en las pruebas el fichero ya esta)
        sh('curl -fsSL -A "%s" --retry 5 --retry-delay 20 -o %s %s' % (UA, pbf, url))
    size = os.path.getsize(pbf)
    log(region, 'bajado: %.2f GB en %.0f s (libres %.1f GB)' % (size / 2**30, time.time() - t, shutil.disk_usage(WORK).free / 2**30))
    sh('osmium tags-filter --overwrite -e %s -o %s %s' % (filt, flt, pbf))
    os.remove(pbf)
    # geometrias rotas (multipoligonos a medias en los bordes del extracto) dan
    # avisos y a veces codigo de error: no importa mientras haya fichero
    subprocess.run('osmium export --overwrite -f geojsonseq -x print_record_separator=false '
                   '--attributes=type,id,timestamp -o %s %s 2>/dev/null' % (geo, flt), shell=True)
    if not os.path.exists(geo):
        raise SystemExit('export sin salida: ' + region)
    os.remove(flt)
    n = 0
    with open(geo, encoding='utf-8') as f:
        for line in f:
            try:
                ft = json.loads(line)
            except Exception:
                continue
            p = ft.get('properties') or {}
            typ, oid = p.pop('@type', None), p.pop('@id', None)
            ts = p.pop('@timestamp', '') or ''
            if isinstance(ts, (int, float)):          # osmium da segundos desde 1970
                ts = time.strftime('%Y-%m-%d', time.gmtime(ts))
            ts = str(ts)[:10]
            if typ not in ('node', 'way', 'relation') or oid is None:
                continue
            g = ft.get('geometry') or {}
            c = g.get('coordinates')
            if g.get('type') == 'Point':
                lon, lat = c[0], c[1]
            else:
                xs, ys = [], []
                def walk(v):
                    if v and isinstance(v[0], (int, float)):
                        xs.append(v[0]); ys.append(v[1])
                    else:
                        for w in v:
                            walk(w)
                try:
                    walk(c)
                except Exception:
                    continue
                if not xs:
                    continue
                # como «out center» de Overpass: el centro de la caja
                lon, lat = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
            n += 1
            yield typ, int(oid), round(lat, 7), round(lon, 7), {k: str(v) for k, v in p.items()}, ts
    os.remove(geo)
    log(region, n, 'elementos')


# ------------------------------------------------------------------ reglas (las de las consultas)
HELP_AM = {'shower', 'public_bath', 'refugee_site', 'food_sharing', 'give_box', 'social_centre'}


def is_help(t):          # 11 km alrededor de la ciudad
    a = t.get('amenity')
    return ('social_facility' in t or a in HELP_AM or t.get('shop') == 'charity' or t.get('office') == 'ngo'
            or a in ('library', 'hospital') or t.get('healthcare') == 'centre')


def is_water(t):         # 2,5 km
    a = t.get('amenity')
    return a == 'drinking_water' or (a == 'toilets' and t.get('fee') == 'no')


def is_wide(t):          # 25 km, ciudades casi vacias
    a = t.get('amenity')
    return ('social_facility' in t or a in HELP_AM | {'community_centre', 'social_facility', 'library',
            'hospital', 'clinic', 'doctors', 'health_post', 'pharmacy'}
            or t.get('shop') == 'charity' or t.get('office') in ('ngo', 'charity', 'association') or 'healthcare' in t)


def is_wide_water(t):    # 6 km
    a, m = t.get('amenity'), t.get('man_made')
    return (a in ('drinking_water', 'toilets') or (m == 'water_well' and t.get('drinking_water') != 'no')
            or m == 'water_tap')


def is_planet(t):
    a = t.get('amenity')
    return ('social_facility' in t or t.get('shop') == 'charity' or t.get('office') in ('ngo', 'charity')
            or a in ('shower', 'public_bath', 'refugee_site', 'food_sharing', 'give_box', 'social_centre', 'social_facility'))


NAMED = re.compile(r'C[áa]ritas|Cruz Roja|Creu Roja|Banco de Alimentos|Banc dels Aliments|Comedor [Ss]ocial|'
                   r'Menjador [Ss]ocial|Albergue|Casa de Acogida|Centro de Acogida|Ropero|Roper[ií]a|Economato [Ss]ocial', re.I)
NAMEDOP = re.compile(r'C[áa]ritas|Cruz Roja|Creu Roja|Banco de Alimentos', re.I)


def is_es(t):
    a = t.get('amenity')
    return ('social_facility' in t or a in HELP_AM or t.get('shop') == 'charity' or t.get('office') == 'ngo'
            or a == 'hospital' or t.get('healthcare') == 'centre' or (a == 'doctors' and 'healthcare' in t)
            or NAMED.search(t.get('name', '')) or NAMEDOP.search(t.get('operator', ''))
            or re.search('homeless|homless', t.get('social_facility:for', '')))


def hav(a, b, c, d):
    p = math.pi / 180
    x = math.sin((c - a) * p / 2) ** 2 + math.cos(a * p) * math.cos(c * p) * math.sin((d - b) * p / 2) ** 2
    return 12742000 * math.asin(math.sqrt(min(1, x)))


def rec(typ, oid, lat, lon, tags, ts):
    o = {'type': typ, 'id': oid, 'tags': tags}
    if typ == 'node':
        o['lat'], o['lon'] = lat, lon
    else:
        o['center'] = {'lat': lat, 'lon': lon}
    if ts:
        o['ts'] = ts
    return o


TORD = {'node': 0, 'way': 1, 'relation': 2}


def capped(lst, n):
    lst.sort(key=lambda e: (TORD[e['type']], e['id']))
    return lst[:n]



PARTS = os.path.join(RAW, 'parts')
os.makedirs(PARTS, exist_ok=True)
BUDGET = float(os.environ.get('BUDGET_MIN', '320')) * 60


def git_save(msg):
    # varios jobs a la vez suben partes a la misma rama: si el push choca, se
    # trae lo de los otros y se reintenta
    subprocess.run('git add raw && git -c user.name=calory89 -c user.email=rrppspain@gmail.com commit -q -m "%s"' % msg,
                   shell=True, cwd=ROOT)
    for k in range(14):
        r = subprocess.run('git push -q origin HEAD:$(git branch --show-current)', shell=True, cwd=ROOT)
        if r.returncode == 0:
            return
        subprocess.run('git -c user.name=calory89 -c user.email=rrppspain@gmail.com pull -q --rebase origin '
                       '$(git branch --show-current)', shell=True, cwd=ROOT)
        time.sleep(3 + 4 * k + (os.getpid() % 7))
    log('AVISO: no se pudo subir', msg)


for region in REGIONS:
    name = region.replace('/', '_')
    part = os.path.join(PARTS, name + '.jsonl.gz')
    if os.path.exists(part):
        log('ya estaba', region); continue
    # sin tiempo para una region grande: se deja para la siguiente vuelta
    if (time.time() - T0) + (2 + SIZE_GB.get(region, 5) * 4) * 60 > BUDGET:
        log('sin tiempo para', region, '-> siguiente vuelta'); continue
    es = region == 'europe/spain'
    n = 0
    tmp = part + '.tmp'
    try:
        with gzip.open(tmp, 'wt', encoding='utf-8', compresslevel=6) as f:
            for typ, oid, lat, lon, t, ts in elements(region, FILTER_ES if es else FILTER):
                if not (is_planet(t) or is_water(t) or is_help(t) or is_wide(t) or is_wide_water(t)
                        or (es and (is_es(t) or t.get('amenity') == 'library'))):
                    continue
                f.write(json.dumps([typ, oid, lat, lon, t, ts], ensure_ascii=False, separators=(',', ':')) + '\n')
                n += 1
    except (SystemExit, Exception) as e:
        log('FALLO', region, repr(e)[:300])
        for x in os.listdir(WORK):            # que no se quede el disco lleno
            if x.endswith(('.pbf', '.geojsonseq')):
                os.remove(os.path.join(WORK, x))
        if os.path.exists(tmp):
            os.remove(tmp)
        git_save('SupportNear OSM: fallo %s' % region)
        continue
    os.replace(tmp, part)
    log('parte', region, n, 'elementos')
    git_save('SupportNear OSM: %s' % region)

if os.environ.get('NO_ASSEMBLE'):
    log('RESUMEN job', os.environ.get('JOB'), 'hecho'); git_save('SupportNear OSM: log %s' % os.environ.get('JOB')); sys.exit(0)
missing = [r for r in ALL_REGIONS if not os.path.exists(os.path.join(PARTS, r.replace('/', '_') + '.jsonl.gz'))]
if missing:
    log('RESUMEN faltan', missing, '-> relanzar'); sys.exit(0)

cities = json.load(open(os.path.join(ROOT, 'refresh', 'cities_all.json'), encoding='utf-8'))
world = [c for c in cities if not c['es']]
spain = [c for c in cities if c['es']]
grid = {}
for i, c in enumerate(world):
    grid.setdefault((math.floor(c['lat']), math.floor(c['lon'])), []).append(i)
STD = [[] for _ in world]; WIDE = [[] for _ in world]
PLANET = {}; SEEN = set(); NAT = {'es:all': []}; NATC = {c['nkey']: [] for c in spain}
for region in ALL_REGIONS:
    es = region == 'europe/spain'
    with gzip.open(os.path.join(PARTS, region.replace('/', '_') + '.jsonl.gz'), 'rt', encoding='utf-8') as f:
        for line in f:
            typ, oid, lat, lon, t, ts = json.loads(line)
            key = (typ, oid)
            if key in SEEN:
                continue
            SEEN.add(key)
            if es:
                if is_es(t):
                    NAT['es:all'].append(rec(typ, oid, lat, lon, t, ts))
                a = t.get('amenity')
                for c in spain:
                    if abs(c['lat'] - lat) > 0.1 or abs(c['lon'] - lon) > 0.13:
                        continue
                    d = hav(c['lat'], c['lon'], lat, lon)
                    if (is_water(t) and d <= 3500) or (a == 'library' and d <= 6000):
                        NATC[c['nkey']].append(rec(typ, oid, lat, lon, t, ts))
            if is_planet(t):
                cell = '%g_%g_5' % (math.floor(lat / 5) * 5, math.floor(lon / 5) * 5)
                PLANET.setdefault(cell, []).append(rec(typ, oid, lat, lon, t, ts))
            hw, hh, ww, wwa = is_water(t), is_help(t), is_wide(t), is_wide_water(t)
            if not (hw or hh or ww or wwa):
                continue
            gy, gx = math.floor(lat), math.floor(lon)
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    for i in grid.get((gy + dy, gx + dx), ()):
                        c = world[i]
                        d = hav(c['lat'], c['lon'], lat, lon)
                        if d > 25000:
                            continue
                        if (hh and d <= 11000) or (hw and d <= 2500):
                            STD[i].append(rec(typ, oid, lat, lon, t, ts))
                        if (ww and d <= 25000) or (wwa and d <= 6000):
                            WIDE[i].append(rec(typ, oid, lat, lon, t, ts))
    log('juntado', region)


def write(layer, items):
    with gzip.open(os.path.join(RAW, layer + '.jsonl.gz'), 'wt', encoding='utf-8', compresslevel=9) as f:
        for k, els in items:
            f.write(json.dumps({'k': k, 'els': els}, ensure_ascii=False, separators=(',', ':')) + '\n')


for old in ('nat.jsonl', 'cities.jsonl', 'planet.jsonl'):
    if os.path.exists(os.path.join(RAW, old)):
        os.remove(os.path.join(RAW, old))
write('nat', list(NAT.items()) + list(NATC.items()))
out, poor = [], 0
for i, c in enumerate(world):
    els = capped(STD[i], 2500)
    if len(els) < 40:
        poor += 1
        have = {(e['type'], e['id']) for e in els}
        els += [e for e in capped(WIDE[i], 3000) if (e['type'], e['id']) not in have]
    out.append((c['key'], els))
write('cities', out)
write('planet', sorted(PLANET.items()))
prog = {'source': 'geofabrik', 'min': round((time.time() - T0) / 60), 'final': True,
        'stored': {'nat': 1 + len(NATC), 'cities': len(out), 'planet': len(PLANET)},
        'elements': {'es': len(NAT['es:all']), 'cities': sum(len(e) for _, e in out),
                     'planet': sum(len(v) for v in PLANET.values()), 'poor_cities': poor}}
json.dump(prog, open(os.path.join(RAW, 'progress.json'), 'w'), indent=1)
log('RESUMEN', json.dumps(prog))
