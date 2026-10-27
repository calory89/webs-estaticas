"""Nombres de ciudad en cada idioma con Nominatim (namedetails), 1 peticion por
segundo como pide su politica de uso. Completa i18n_src/city_names.json."""
import json, time, urllib.request, urllib.parse, ssl
LANGS = ['es','fr','ar','uk','ro','pl','ru','pt','ur','fa','wo','bm','ti','ps','so','am','tr','bn','zh']
s = open('index.full.html', encoding='utf-8').read()
i = s.find('const CITIES = /*__CITIES__*/') + len('const CITIES = /*__CITIES__*/')
cities, _ = json.JSONDecoder().raw_decode(s[i:])
ctx = ssl.create_default_context(cafile='/root/.ccr/ca-bundle.crt')
try: out = json.load(open('i18n_src/city_names.json'))
except Exception: out = {}
todo = [c for c in cities if c[0] not in out]
print('por hacer', len(todo), flush=True)
for n, c in enumerate(todo):
    nm = c[0].split(' · ')[0]
    q = urllib.parse.urlencode({'q': nm, 'countrycodes': (c[4] or '').lower(), 'format': 'jsonv2', 'namedetails': 1, 'limit': 3, 'featureType': 'city'})
    names = {}
    try:
        r = urllib.request.urlopen(urllib.request.Request('https://nominatim.openstreetmap.org/search?' + q, headers={'User-Agent': 'SupportNear/1.0 (non-profit map of free help; https://supportnear.com)'}), timeout=30, context=ctx)
        res = json.loads(r.read())
        best = None
        for e in res:
            d = (float(e['lat']) - c[1]) ** 2 + (float(e['lon']) - c[2]) ** 2
            if d < 0.25 and (best is None or d < best[0]): best = (d, e)
        if best:
            nd = best[1].get('namedetails') or {}
            for L in LANGS:
                v = nd.get('name:' + L)
                if v and v != nm: names[L] = v
        out[c[0]] = names
    except Exception as e:
        print('error', nm, str(e)[:60], flush=True); time.sleep(5)
    if n % 25 == 0:
        json.dump(out, open('i18n_src/city_names.json', 'w'), ensure_ascii=False)
        print(n, '/', len(todo), 'con nombres:', sum(1 for v in out.values() if v), flush=True)
    time.sleep(1.1)
json.dump(out, open('i18n_src/city_names.json', 'w'), ensure_ascii=False)
print('hecho', sum(1 for v in out.values() if v))
