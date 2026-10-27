# Donde hace mas falta esto, con datos, no a ojo.
#
# Hasta ahora las ciudades se elegian por poblacion. Para un mapa de ayuda eso no
# basta: Tokio tiene mucha gente y buenos servicios; Goma tiene menos gente y
# muchisima mas necesidad. Aqui se puntua cada pais con tres cifras del Banco
# Mundial, que es publico y se puede comprobar:
#
#   NY.GDP.PCAP.PP.CD  PIB por habitante (PPA)      cuanto mas bajo, mas necesidad
#   SI.POV.DDAY        % bajo el umbral de pobreza  extrema
#   SM.POP.REFG        personas refugiadas acogidas
#
# El indicador manda sobre mi criterio: si un pais no sale mal parado en los
# datos, no entra por mucho que a mi me lo parezca.
import json, subprocess, sys

IND = {
    'gdp':  'NY.GDP.PCAP.PP.CD',
    'pov':  'SI.POV.DDAY',
    'ref':  'SM.POP.REFG',
    'pop':  'SP.POP.TOTL',
}


def wb(code):
    """Ultimo valor disponible de cada pais, de los ultimos 12 anos."""
    out = {}
    page = 1
    while True:
        url = ('https://api.worldbank.org/v2/country/all/indicator/%s'
               '?format=json&per_page=20000&mrnev=1&page=%d' % (code, page))
        r = subprocess.run(['curl', '-s', '-m', '90', url], capture_output=True)
        try:
            j = json.loads(r.stdout.decode('utf-8', 'ignore'))
        except Exception:
            break
        if not isinstance(j, list) or len(j) < 2 or not j[1]:
            break
        for row in j[1]:
            iso = (row.get('countryiso3code') or '').strip()
            v = row.get('value')
            if iso and v is not None and iso not in out:
                out[iso] = float(v)
        if page >= (j[0].get('pages') or 1):
            break
        page += 1
    return out


data = {k: wb(v) for k, v in IND.items()}
for k, v in data.items():
    print(k, len(v), 'paises')

json.dump(data, open('wb_raw.json', 'w'))
print('guardado wb_raw.json')
