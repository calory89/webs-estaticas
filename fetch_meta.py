# La fecha de la ultima edicion de cada sitio en OpenStreetMap.
#
# Es el aviso mas honesto que se le puede dar a alguien: un comedor que nadie ha
# tocado desde 2019 hay que llamarlo antes de andar hasta alli. Overpass la
# devuelve con `out meta`; se pide por lotes de ids, que es barato para el
# servidor y no toca la consulta grande. Va a meta.json {"node/123": "2024-05"}.
import json, os, subprocess, time, io
from concurrent.futures import ThreadPoolExecutor

EPS = ["https://overpass.kumi.systems/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"]
OUTF = 'meta.json'
META = json.load(open(OUTF)) if os.path.exists(OUTF) else {}
ids = [tuple(x) for x in json.load(open('all_ids.json'))]
todo = [(t, i) for t, i in ids if t + '/' + str(i) not in META]
print('pendientes', len(todo), 'de', len(ids), flush=True)

BATCH = 400
batches = []
for typ in ('node', 'way', 'relation'):
    lst = [i for t, i in todo if t == typ]
    for k in range(0, len(lst), BATCH):
        batches.append((typ, lst[k:k + BATCH]))


def job(arg):
    n, (typ, lst) = arg
    q = '[out:json][timeout:50];%s(id:%s);out meta;' % (typ, ','.join(map(str, lst)))
    # solo hace falta el id y la fecha: out meta trae etiquetas, pero es lo que hay
    for k in range(4):
        ep = EPS[(n + k) % len(EPS)]
        try:
            o = subprocess.run(['curl', '-sG', '-m', '58', ep, '--data-urlencode', 'data=' + q], capture_output=True)
            t = o.stdout.decode('utf-8', 'ignore')
            if t.strip().startswith('{'):
                els = json.loads(t).get('elements', [])
                out = {}
                for e in els:
                    ts = e.get('timestamp', '')
                    if ts:
                        out[e['type'] + '/' + str(e['id'])] = ts[:7]
                return out
        except Exception:
            pass
        time.sleep(3)
    print('FALLO lote', n, typ, len(lst), flush=True)
    return {}


done = 0
with ThreadPoolExecutor(max_workers=4) as ex:
    for out in ex.map(job, list(enumerate(batches))):
        META.update(out)
        done += 1
        if done % 5 == 0:
            json.dump(META, open(OUTF, 'w'))
            print('lotes %d/%d | fechas %d' % (done, len(batches), len(META)), flush=True)
json.dump(META, open(OUTF, 'w'))
print('LISTO', len(META), flush=True)
