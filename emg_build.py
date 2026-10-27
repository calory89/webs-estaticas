# Convierte lo de Wikidata en la tabla que usa la app, y en un CSV descargable.
#
# Dos reglas que importan:
#  - El numero general es el que hay que marcar si no sabes a quien llamar. Se
#    elige el que Wikidata da sin servicio concreto, o el que cubre a la vez
#    policia, ambulancia y bomberos. Entre varios validos gana 112, luego 911,
#    luego 999, porque son los que mas gente ya conoce.
#  - Las lineas de ayuda escritas a mano (violencia de genero, suicidio, sinhogarismo)
#    NO estan en Wikidata y son las mas utiles de todas: se conservan tal cual y
#    se anaden delante de lo que venga de Wikidata.
import json, re

def svc(use):
    """Wikidata escribe el servicio de mil maneras ('Carabineros de Chile',
    'emergency medical services', 'gendarmerie'). Se normaliza por lo que dice."""
    u = use.lower()
    if not u: return ''
    if 'police' in u or 'gendarm' in u or 'carabin' in u: return 'police'
    if 'medical' in u or 'ambulanc' in u: return 'ambulance'
    if 'fire' in u: return 'fire'
    if u in ('emergency', 'emergency service', 'emergency services'): return 'general'
    return ''

PREF = ['112', '911', '999', '000', '111', '110', '119', '190', '133', '123']

raw = json.load(open('emg_raw.json'))
out = {}
csv = [['country_code', 'country', 'number', 'service', 'source']]

for cc, d in sorted(raw.items()):
    by = {}
    plain = []          # statement sin ningun matiz: es el numero nacional
    emerg = []          # marcado como 'emergency': suele ser una linea concreta
    allnums = []
    for num, use in d['nums']:
        num = re.sub(r'\s+', ' ', num).strip()
        key = svc(use)
        allnums.append(num)
        if not use:
            plain.append(num)
        elif key == 'general':
            emerg.append(num)
        elif key:
            by.setdefault(num, set()).add(key)
        csv.append([cc, d['country'], num, use or 'general', 'Wikidata P2852'])

    plain = list(dict.fromkeys(plain)); emerg = list(dict.fromkeys(emerg))
    # En Reino Unido se marca 999 y en Australia 000, aunque el 112 tambien
    # funcione: se ensena el que la gente de ese pais conoce. Pero en India el
    # numero nacional ES el 112 y el 108 es solo la ambulancia, asi que primero
    # manda el statement sin matices y solo despues los marcados 'emergency'.
    gen = None
    for bucket in (plain, emerg):
        if bucket:
            gen = next((n for n in bucket if n != '112'), bucket[0]); break
    if not gen:
        if '112' in allnums:
            gen = '112'
        else:
            pol = [n for n, srv in by.items() if 'police' in srv]
            cands = pol or list(by.keys())
            if not cands:
                continue
            gen = next((p for p in PREF if p in cands),
                       sorted(cands, key=lambda x: (len(x), x))[0])

    # un mismo numero suele cubrir policia, ambulancia y bomberos: se lista una vez
    lines, seen = [], {gen}
    for want in ('police', 'ambulance', 'fire'):
        for n, srv in sorted(by.items()):
            if want in srv and n not in seen:
                seen.add(n); lines.append([n, want]); break
    if gen != '112' and '112' in allnums:
        lines.append(['112', 'intl'])
    out[cc] = {'gen': gen, 'l': lines}

# Correcciones a mano donde Wikidata mezcla numeros viejos, locales o directamente
# erroneos (Finlandia salia con el 000 de Australia). Fuente: lista de numeros de
# emergencia de Wikipedia y webs oficiales, revisado en septiembre de 2026.
OVERRIDE = {
 'FI': ('112', []), 'AD': ('112', [['110','police'],['116','ambulance'],['118','fire']]),
 'AE': ('999', [['998','ambulance'],['997','fire'],['112','intl']]),
 'AR': ('911', [['101','police'],['107','ambulance'],['100','fire']]),
 'PE': ('105', [['106','ambulance'],['116','fire']]),
 'IQ': ('104', [['122','ambulance'],['115','fire']]),
 'OM': ('9999', []), 'RS': ('112', [['192','police'],['194','ambulance'],['193','fire']]),
 'JM': ('119', [['110','ambulance']]), 'HN': ('911', []),
 'GH': ('112', [['191','police'],['193','ambulance'],['192','fire']]),
 'CD': ('112', [['114','police'],['118','fire']]),
 'ZM': ('999', [['991','ambulance'],['993','fire']]),
 'KG': ('112', [['102','police'],['103','ambulance'],['101','fire']]),
 'FJ': ('911', [['919','police']]), 'AO': ('112', [['113','police'],['116','ambulance'],['115','fire']]),
 'AF': ('119', [['112','intl'],['102','ambulance']]),
 'YE': ('191', [['194','ambulance']]),
 'BS': ('919', [['911','intl']]),
}
for cc,(g,l) in OVERRIDE.items():
    out[cc] = {'gen': g, 'l': l}
json.dump(out, open('emg_clean.json', 'w'), ensure_ascii=False)
with open('emergency-numbers.csv', 'w', encoding='utf-8') as f:
    for row in csv:
        f.write(','.join('"' + str(x).replace('"', '""') + '"' for x in row) + '\n')

print('paises:', len(out), '| filas en el CSV:', len(csv) - 1)
for cc in ('ES', 'KE', 'BD', 'NG', 'IN', 'US', 'BR', 'PH', 'CD', 'HT'):
    print(' ', cc, out.get(cc))
