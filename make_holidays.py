"""Festivos nacionales de cada pais del mapa (libreria `holidays`), para que
«abierto ahora» no mienta un dia de fiesta. Sale holidays.json: {"ES":"2026:0101,0106,...|2027:..."}"""
import json, re, datetime, holidays
s = open('index.full.html', encoding='utf-8').read()
i = s.find('const CITIES = /*__CITIES__*/') + len('const CITIES = /*__CITIES__*/')
cities, _ = json.JSONDecoder().raw_decode(s[i:])
ccs = sorted({c[4] for c in cities if c[4]})
sup = holidays.list_supported_countries()
y0 = datetime.date.today().year
out = {}
for cc in ccs:
    if cc not in sup: continue
    parts = []
    for y in (y0, y0 + 1):
        try: h = holidays.country_holidays(cc, years=y)
        except Exception: continue
        ds = sorted(d.strftime('%m%d') for d in h.keys())
        if ds: parts.append('%d:%s' % (y, ','.join(ds)))
    if parts: out[cc] = '|'.join(parts)
json.dump(out, open('holidays.json', 'w'), separators=(',', ':'))
print(len(ccs), 'paises en el mapa,', len(out), 'con festivos;', len(json.dumps(out)), 'bytes')
