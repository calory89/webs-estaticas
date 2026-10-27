# Numeros de emergencia de cada pais, sacados de Wikidata (propiedad P2852),
# no de mi memoria. Cada numero se guarda con el pais y con el servicio al que
# corresponde, para poder citar la fuente en la web y publicar la tabla.
import json, subprocess, sys

Q = """
SELECT ?iso ?countryLabel ?numLabel ?useLabel WHERE {
  ?country wdt:P297 ?iso .
  ?country p:P2852 ?st .
  ?st ps:P2852 ?num .
  OPTIONAL { ?st pq:P366 ?use . }
  FILTER NOT EXISTS { ?st wikibase:rank wikibase:DeprecatedRank }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
"""

r = subprocess.run(
    ['curl', '-sG', '-m', '180',
     'https://query.wikidata.org/sparql',
     '--data-urlencode', 'query=' + Q,
     '-H', 'Accept: application/sparql-results+json',
     '-A', 'SupportNear/1.0 (rrppspain@gmail.com)'],
    capture_output=True)

txt = r.stdout.decode('utf-8', 'ignore')
if not txt.strip().startswith('{'):
    print('respuesta inesperada:', txt[:400]); sys.exit(1)

rows = json.loads(txt)['results']['bindings']
out = {}
for b in rows:
    iso = b['iso']['value'].strip().upper()
    if len(iso) != 2:
        continue
    num = b['numLabel']['value'].strip()
    use = b.get('useLabel', {}).get('value', '').strip()
    if not num or num.startswith('Q'):          # etiqueta sin resolver
        continue
    d = out.setdefault(iso, {'country': b['countryLabel']['value'], 'nums': []})
    if not any(x[0] == num and x[1] == use for x in d['nums']):
        d['nums'].append([num, use])

json.dump(out, open('emg_raw.json', 'w'), ensure_ascii=False, indent=0)
print('paises con numero en Wikidata:', len(out))
print('ejemplo ES:', out.get('ES'))
print('ejemplo KE:', out.get('KE'))
print('ejemplo BD:', out.get('BD'))
