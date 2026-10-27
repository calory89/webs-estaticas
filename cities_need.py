# Ciudades de los paises con mas necesidad, sacadas de OpenStreetMap pais por pais.
#
# El primer barrido pedia todas las place=city con mas de 600.000 habitantes.
# Eso deja fuera casi toda Africa subsahariana y buena parte de Centroamerica,
# donde una capital de provincia con 120.000 personas es una ciudad grande y
# donde mas falta hace esto.
#
# Preguntando dentro del area de cada pais, el pais viene en la propia consulta:
# no hay que geocodificar nada despues ni fiarse de un nombre.
import json, os, subprocess, threading, time
from concurrent.futures import ThreadPoolExecutor

EPS = ["https://maps.mail.ru/osm/tools/overpass/api/interpreter",
       "https://overpass.kumi.systems/api/interpreter",
       "https://overpass.private.coffee/api/interpreter",
       "https://overpass-api.de/api/interpreter"]

CCS = json.load(open('need_top.json'))
OUTF = 'cities_need.json'
OUT = json.load(open(OUTF)) if os.path.exists(OUTF) else {}
todo = [c for c in CCS if c not in OUT]
print('paises por consultar:', len(todo), flush=True)

lock = threading.Lock()


def q(cc):
    return ('[out:json][timeout:180];'
            'area["ISO3166-1"="%s"][admin_level=2]->.a;'
            '('
            'node(area.a)["place"="city"];'
            'node(area.a)["place"="town"]["population"];'
            ');out tags center 900;' % cc)


def job(cc):
    for k in range(8):
        try:
            o = subprocess.run(['curl', '-sG', '-m', '200', EPS[k % 4],
                                '--data-urlencode', 'data=' + q(cc)], capture_output=True)
            t = o.stdout.decode('utf-8', 'ignore')
            if t.strip().startswith('{'):
                els = json.loads(t).get('elements', [])
                with lock:
                    OUT[cc] = els
                    json.dump(OUT, open(OUTF, 'w'))
                    print(cc, len(els), flush=True)
                return
        except Exception:
            pass
        time.sleep(5)
    with lock:
        print('FALLO', cc, flush=True)


with ThreadPoolExecutor(max_workers=4) as ex:
    list(ex.map(job, todo))
json.dump(OUT, open(OUTF, 'w'))
print('LISTO', len(OUT), sum(len(v) for v in OUT.values()), flush=True)
