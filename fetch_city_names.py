"""Nombres de las ciudades del mapa en cada idioma (name:xx de OpenStreetMap).
Se busca el nodo place mas cercano que se llama asi (name o name:en) y se
guardan sus name:xx. Sale en i18n_src/city_names.json: {"Cairo": {"es":"El Cairo",...}}"""
import json, re, time, urllib.request, urllib.parse, ssl, sys
LANGS = ['es','fr','ar','uk','ro','pl','ru','pt','ur','fa','wo','bm','ti','ps','so','am','tr','bn','zh']
s = open('index.full.html', encoding='utf-8').read()
i = s.find('const CITIES = /*__CITIES__*/') + len('const CITIES = /*__CITIES__*/')
dec = json.JSONDecoder(); cities, _ = dec.raw_decode(s[i:])
ctx = ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt')
OVP = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter']
out = {}
try: out = json.load(open('i18n_src/city_names.json'))
except Exception: pass
todo = [c for c in cities if c[0] not in out]
print('ciudades', len(cities), 'por hacer', len(todo), flush=True)
def q(batch):
    parts = []
    for c in batch:
        nm = c[0].split(' · ')[0].replace('"', '')
        for key in ('name', 'name:en'):
            parts.append('node(around:9000,%.5f,%.5f)[place~"^(city|town|municipality|village|suburb)$"]["%s"="%s"];' % (c[1], c[2], key, nm))
    data = '[out:json][timeout:120];(' + ''.join(parts) + ');out tags center;'
    for k in range(6):
        url = OVP[k % len(OVP)]
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, data=urllib.parse.urlencode({'data': data}).encode(), headers={'User-Agent': 'SupportNear city names (non-profit)'}), timeout=180, context=ctx)
            return json.loads(r.read())['elements']
        except Exception as e:
            print('  reintento', k, url, str(e)[:80], flush=True); time.sleep(8 + 6 * k)
    return []
B = 40
for n in range(0, len(todo), B):
    batch = todo[n:n + B]
    els = q(batch)
    for c in batch:
        nm = c[0].split(' · ')[0]
        best = None
        for e in els:
            tg = e.get('tags', {})
            if tg.get('name') == nm or tg.get('name:en') == nm:
                la, lo = e.get('lat'), e.get('lon')
                d = (la - c[1]) ** 2 + (lo - c[2]) ** 2
                if best is None or d < best[0]: best = (d, tg)
        names = {}
        if best:
            tg = best[1]
            for L in LANGS:
                v = tg.get('name:' + L)
                if v and v != nm: names[L] = v
        out[c[0]] = names
    json.dump(out, open('i18n_src/city_names.json', 'w'), ensure_ascii=False)
    print(n + len(batch), '/', len(todo), 'con nombres:', sum(1 for v in out.values() if v), flush=True)
    time.sleep(4)
print('hecho')
