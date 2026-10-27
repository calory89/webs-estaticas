# -*- coding: utf-8 -*-
"""Horarios sacados de la web de cada sitio.

El dato que mas falta en el mapa no es la direccion: es la hora. Un comedor
con direccion y sin horario obliga a andar hasta alli para descubrir que abre
a las seis. En OpenStreetMap hay 1.960 comedores y albergues que tienen web
puesta y no tienen `opening_hours`. Casi todos lo dicen en su propia pagina,
escrito para personas.

Esto lee esa pagina (y, si hace falta, la de «horario» / «contacto» / «hours»),
busca las horas escritas en once idiomas y las convierte al formato de
OpenStreetMap. Solo guarda lo que entiende entero y sin ambiguedad: si la
pagina dice «consultar horarios», no se inventa nada. Lo que sale va a
extra_sources/hours.csv y lo recoge build.py.

No sustituye a OpenStreetMap: es una capa aparte, marcada como tal, y lo que
se confirma se puede subir a OSM despues.

    python3 hours_crawl.py --cats food,shelter --limit 400 --out extra_sources/hours.csv
"""
import argparse, csv, io, json, os, re, sys, time, random
from concurrent.futures import ThreadPoolExecutor
import urllib.request, urllib.error, urllib.parse

CATIDS = ['food', 'shelter', 'hygiene', 'clothes', 'social', 'legal', 'health', 'water', 'warm']
UA = 'Mozilla/5.0 (compatible; SupportNearBot/1.0; +https://supportnear.com/ non-profit map of free help)'

# ---- los dias de la semana, en las lenguas donde hay mas sitios sin horario ----
DAYS = {
 'Mo': r'lunes|lun|monday|mon|lundi|lun\.|segunda[- ]feira|seg|montag|mo|lunedì|lunedi|poniedziałek|pon|luni|понеділок|пн|понедельник|maandag|mandag|maanantai',
 'Tu': r'martes|mar|tuesday|tue|tues|mardi|terça[- ]feira|ter|dienstag|di|martedì|martedi|wtorek|wt|marți|marti|вівторок|вт|вторник|dinsdag|tirsdag|tiistai',
 'We': r'miércoles|miercoles|mié|mie|wednesday|wed|mercredi|quarta[- ]feira|qua|mittwoch|mi|mercoledì|mercoledi|środa|sroda|śr|miercuri|середа|ср|среда|woensdag|onsdag|keskiviikko',
 'Th': r'jueves|jue|thursday|thu|thur|thurs|jeudi|quinta[- ]feira|qui|donnerstag|do|giovedì|giovedi|czwartek|czw|joi|четвер|чт|четверг|donderdag|torsdag|torstai',
 'Fr': r'viernes|vie|friday|fri|vendredi|sexta[- ]feira|sex|freitag|fr|venerdì|venerdi|piątek|piatek|pt|vineri|пʼятниця|пятница|пт|vrijdag|fredag|perjantai',
 'Sa': r'sábado|sabado|sáb|sab|saturday|sat|samedi|samstag|sonnabend|sa|sabato|sobota|sb|sâmbătă|sambata|субота|сб|суббота|zaterdag|lørdag|lauantai',
 'Su': r'domingo|dom|sunday|sun|dimanche|sonntag|so|domenica|niedziela|nd|duminică|duminica|неділя|нд|воскресенье|вс|zondag|søndag|sunnuntai',
}
ORDER = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
_W = 'áéíóúàèìòùâêîôûäöüñçğışżźćłńśěščřůõ'


def _daypat(v):
    """«sábados», «samedis», «domingos»: en media Europa el dia va en plural en
    cuanto hay mas de uno. La s se admite solo en las formas largas; en «do» o
    «mar» sobraria y convertiria «dos» en jueves."""
    long_, short = [], []
    for w in v.split('|'):
        (long_ if len(w) >= 5 else short).append(w)
    alts = []
    if long_: alts.append('(?:%s)s?' % '|'.join(long_))
    if short: alts.append('(?:%s)' % '|'.join(short))
    return '|'.join(alts)


DAYRE = {k: re.compile(r'(?<![\w%s])(?:%s)(?![\w%s])' % (_W, _daypat(v), _W), re.I | re.U) for k, v in DAYS.items()}
# «de lunes a viernes», «Mon-Fri», «du lundi au vendredi»
RANGE_WORD = re.compile(r'\b(?:a|al|to|au|à|a|até|bis|do|la|по|до|-|–|—|hasta|until)\b', re.I)
CLOSED = re.compile(r'cerrad|closed|fermé|ferme|geschlossen|chiuso|encerrad|zamkni|închis|inchis|зачинено|закрыт|gesloten|lukket|suljettu', re.I)
APPT = re.compile(r'cita previa|con cita|by appointment|sur rendez|solo con cita|previa cita|nach vereinbarung|su appuntamento|marcação|consultar horario|consulte horario|horarios? variable|varies|call for|llamar para|ring for', re.I)
NOISE = re.compile(r'24\s*/\s*7|24h|24 hours|todos los días|every day|tous les jours|täglich|sempre', re.I)

# 9:00-14:00 · 9.00 – 14.00 · 9h-14h · 9 a 14 · 9am-2pm
TIME = r'(\d{1,2})(?:[:.,h](\d{2}))?\s*(a\.?m\.?|p\.?m\.?|h|hs|horas|uhr)?'
SPAN = re.compile(TIME + r'\s*(?:-|–|—|a|to|à|au|bis|do|until|hasta|até|până|до|y|and)\s*' + TIME, re.I)


def norm_time(h, m, suf):
    h = int(h); m = int(m or 0)
    if suf:
        s = suf.lower().replace('.', '')
        if s == 'pm' and h < 12: h += 12
        elif s == 'am' and h == 12: h = 0
    if h == 24 and m == 0: return '24:00'
    if h > 24 or m > 59: return None
    return '%02d:%02d' % (h, m)


def spans(txt):
    """Todos los tramos horarios de un trozo de texto, en orden."""
    out = []
    for m in SPAN.finditer(txt):
        a = norm_time(m.group(1), m.group(2), m.group(3))
        b = norm_time(m.group(4), m.group(5), m.group(6))
        if not a or not b or a == b: continue
        # 9-14 sin sufijo ni minutos en ninguno de los dos: puede ser un rango de
        # cualquier otra cosa (precios, edades). Se exige alguna senal de hora.
        if not (m.group(2) or m.group(5) or m.group(3) or m.group(6) or ':' in m.group(0) or 'h' in m.group(0).lower()):
            continue
        if b <= a and b != '24:00':
            # 20:00-02:00 cruza la medianoche: valido en OSM
            if int(b[:2]) > 6: continue
        out.append((a, b))
        if len(out) >= 3: break
    return out


def days_in(txt):
    """Que dias nombra este trozo. «lunes a viernes» -> Mo,Tu,We,Th,Fr."""
    hits = []
    for d in ORDER:
        m = DAYRE[d].search(txt)
        if m: hits.append((m.start(), d))
    if not hits: return []
    hits.sort()
    ds = [d for _, d in hits]
    if len(ds) == 2:
        # ¿es un rango? «de lunes a viernes»: hay una palabra de rango entre medias
        i0 = [p for p, d in hits][0]; i1 = [p for p, d in hits][1]
        between = txt[i0:i1]
        if RANGE_WORD.search(between) or '-' in between or '–' in between:
            a, b = ORDER.index(ds[0]), ORDER.index(ds[1])
            if a < b: return ORDER[a:b + 1]
    return ds


def compact(day_map):
    """{'Mo':'09:00-14:00', ...} -> 'Mo-Fr 09:00-14:00; Sa 10:00-13:00'"""
    parts = []; i = 0
    while i < 7:
        d = ORDER[i]
        if d not in day_map: i += 1; continue
        j = i
        while j + 1 < 7 and ORDER[j + 1] in day_map and day_map[ORDER[j + 1]] == day_map[d]: j += 1
        tag = ORDER[i] if i == j else '%s-%s' % (ORDER[i], ORDER[j])
        parts.append('%s %s' % (tag, day_map[d]))
        i = j + 1
    return '; '.join(parts)


def segments(line):
    """«de lunes a viernes de 9 a 14 y sabados de 10 a 13» son dos frases, no
    una. Se corta cada vez que aparece un dia nuevo despues de que ya haya
    salido una hora: si no, el sabado hereda el horario de los laborables."""
    pos = []
    for d in ORDER:
        for m in DAYRE[d].finditer(line):
            pos.append(m.start())
    if len(pos) < 2:
        return [line]
    pos = sorted(set(pos))
    out = []; start = pos[0]
    for p in pos[1:]:
        if SPAN.search(line[start:p]):
            out.append(line[start:p]); start = p
    out.append(line[start:])
    return out


def parse_hours(text):
    """De una pagina entera al formato de OpenStreetMap, o nada.

    Se va linea a linea: una linea que nombra dias y tiene horas manda. Si la
    pagina habla de cita previa y no da horas claras, no se guarda nada: es
    peor un horario inventado que ninguno."""
    lines = [l.strip() for l in re.split(r'[\n\r]|(?<=[.;])\s{2,}', text) if l.strip()]
    day_map = {}
    for raw in lines:
        if len(raw) > 220: continue
        for l in segments(raw):
            ds = days_in(l)
            if not ds: continue
            if CLOSED.search(l) and not SPAN.search(l):
                for d in ds: day_map.setdefault(d, 'off')
                continue
            sp = spans(l)
            if not sp: continue
            val = ','.join('%s-%s' % (a, b) for a, b in sp)
            for d in ds:
                if d not in day_map: day_map[d] = val
    if not day_map: return ''
    real = [d for d, v in day_map.items() if v != 'off']
    if len(real) < 2: return ''            # un solo dia suelto casi siempre es ruido
    if len(set(day_map[d] for d in real)) > 4: return ''   # demasiado dispar: mejor no tocar
    oh = compact(day_map)
    return oh if len(oh) <= 120 else ''


def fetch(url, timeout=12):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Language': '*'})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            if r.status != 200: return ''
            ct = (r.headers.get('Content-Type') or '').lower()
            if 'html' not in ct and 'text' not in ct: return ''
            raw = r.read(600000)
        enc = 'utf-8'
        m = re.search(rb'charset=["\']?([\w-]+)', raw[:3000], re.I)
        if m:
            try: enc = m.group(1).decode('ascii')
            except Exception: pass
        return raw.decode(enc, 'replace')
    except Exception:
        return ''


def to_text(html):
    html = re.sub(r'(?is)<(script|style|noscript|svg)[^>]*>.*?</\1>', ' ', html)
    html = re.sub(r'(?i)<br\s*/?>|</(p|div|li|tr|td|h[1-6])>', '\n', html)
    txt = re.sub(r'<[^>]+>', ' ', html)
    txt = (txt.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&ndash;', '–')
              .replace('&#8211;', '–').replace('&mdash;', '—').replace('&aacute;', 'á'))
    txt = re.sub(r'&#(\d+);', lambda m: chr(int(m.group(1))) if int(m.group(1)) < 0x11000 else ' ', txt)
    txt = re.sub(r'[ \t\xa0]+', ' ', txt)
    return re.sub(r'\n{2,}', '\n', txt)


SUBP = re.compile(r'(?i)href=["\']([^"\'#]{1,180})["\'][^>]*>[^<]{0,80}(horario|horarios|hours|opening|apertura|contacto|contact|kontakt|contatti|godziny|program|розклад|график|visit|besuch)', re.U)


def one(job):
    oid, url, name = job
    if not re.match(r'https?://', url): url = 'http://' + url
    html = fetch(url)
    if not html: return None
    txt = to_text(html)
    oh = parse_hours(txt)
    if not oh:
        # la pagina de «horarios» o «contacto», si la hay y no nos vamos de dominio
        base = urllib.parse.urlsplit(url)
        for m in list(SUBP.finditer(html))[:2]:
            sub = urllib.parse.urljoin(url, m.group(1))
            if urllib.parse.urlsplit(sub).netloc != base.netloc: continue
            h2 = fetch(sub)
            if not h2: continue
            oh = parse_hours(to_text(h2))
            if oh: url = sub; break
    if not oh: return None
    return {'id': oid, 'oh': oh, 'src': url, 'name': name}


def load_targets(cats, limit, only_missing=True):
    h = io.open('index.full.html', encoding='utf-8').read()
    STR = json.loads(re.search(r'const STR = /\*__STR__\*/(\[.*?\]);', h, re.S).group(1))
    def S_(v): return (STR[v] if 0 <= v < len(STR) else '') if isinstance(v, int) else (v or '')
    out = []
    for f in sorted(os.listdir('d')):
        if not f.endswith('.json'): continue
        for r in json.load(io.open('d/' + f, encoding='utf-8')):
            if CATIDS[r[3]] not in cats: continue
            oh = r[7] if len(r) > 7 else ''
            web = r[9] if len(r) > 9 else ''
            if not web or (only_missing and oh): continue
            oid = r[5]
            oid = ('way/%d' % -oid if oid < 0 else 'node/%d' % oid) if isinstance(oid, int) else oid
            out.append((oid, S_(web), S_(r[0])))
    random.Random(7).shuffle(out)
    return out[:limit] if limit else out


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--cats', default='food,shelter')
    ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--workers', type=int, default=12)
    ap.add_argument('--out', default='extra_sources/hours.csv')
    ap.add_argument('--self-test', action='store_true')
    a = ap.parse_args()

    if a.self_test:
        T = [("Horario: de lunes a viernes de 9:00 a 14:00 y sábados de 10:00 a 13:00", 'Mo-Fr 09:00-14:00; Sa 10:00-13:00'),
             ("Opening hours\nMonday - Friday 9am - 5pm\nSaturday 10am - 1pm", 'Mo-Fr 09:00-17:00; Sa 10:00-13:00'),
             ("Ouvert du lundi au vendredi de 8h30 à 12h30", 'Mo-Fr 08:30-12:30'),
             ("Lun-Vie 9:00-14:00 | Sáb 10:00-13:00 | Dom cerrado", 'Mo-Fr 09:00-14:00; Sa 10:00-13:00; Su off'),
             ("Ouvert du lundi au vendredi de 8h30 à 12h30\nSamedi de 9h à 12h", 'Mo-Fr 08:30-12:30; Sa 09:00-12:00'),
             ("Atendemos solo con cita previa", ''),
             ("Precios de 9 a 14 euros", ''),
             ("Lunes cerrado\nMartes a domingo 12:00-16:00", 'Mo off; Tu-Su 12:00-16:00')]
        ok = 0
        for t, want in T:
            got = parse_hours(t)
            print(('OK  ' if got == want else 'MAL '), repr(t[:46]), '->', repr(got), '' if got == want else '(esperado %r)' % want)
            ok += got == want
        print('%d/%d' % (ok, len(T)))
        sys.exit(0 if ok == len(T) else 1)

    jobs = load_targets(set(a.cats.split(',')), a.limit)
    print('a mirar: %d webs' % len(jobs), flush=True)
    os.makedirs(os.path.dirname(a.out) or '.', exist_ok=True)
    found = []; t0 = time.time()
    with ThreadPoolExecutor(max_workers=a.workers) as ex:
        for i, res in enumerate(ex.map(one, jobs)):
            if res: found.append(res)
            if (i + 1) % 100 == 0:
                print('  %d/%d · %d horarios · %.0f s' % (i + 1, len(jobs), len(found), time.time() - t0), flush=True)
    with io.open(a.out, 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f)
        w.writerow(['id', 'opening_hours', 'source', 'name'])
        for r in found:
            w.writerow([r['id'], r['oh'], r['src'], r['name']])
    print('horarios encontrados: %d de %d (%.1f%%) -> %s' % (len(found), len(jobs), 100.0 * len(found) / max(1, len(jobs)), a.out))
