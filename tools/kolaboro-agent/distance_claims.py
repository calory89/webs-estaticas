#!/usr/bin/env python3
"""Kolaboro distance claims check: distance and travel-time claims on the developer's own page (our sealed copy), next to what
OpenStreetMap data gives from the pin.

Usage: distance_claims.py DATA_DIR AROUND_JSON OUT_JSON [ROUTE_CACHE_JSON]
Reads DATA_DIR/page-history-*.json (the sealed page texts), DATA_DIR/named.json and AROUND_JSON (pins and nearest features).
Claims are found with fixed multilingual patterns (no model calls). A claim is measured only when it points at a kind of place we
measure (beach, sea, airport, rail or metro station, bus stop, hospital, school, supermarket). Road distance and time: OSRM on
OpenStreetMap data, the public server run by FOSSGIS e.V. (routing.openstreetmap.de), one request per second, cached.
"""
import json, re, sys, os, time, glob, requests
import around_tiles as o

UA = {'user-agent': 'KolaboroAround/1.0 (+https://kolaboro.com/methods/)'}
NUM = r'(?<![\w.,$€£฿])(\d{1,4}(?:[.,]\d{1,2})?)(?:\s?(?:-|–|—|to|a|bis|à|до)\s?(\d{1,4}(?:[.,]\d{1,2})?))?'
T_UNIT = r'(?:min(?:ute)?s?\b\.?|mins\b\.?|minutos?\b|minuti\b|minuto\b|[Mm]inuten\b|мин(?:ут[аы]?)?\b\.?|分钟|分鐘|دقائق|دقيقة|menit\b|dakika\b|dk\b)'
D_UNIT = r'(?:km\b|kilomet(?:er|re)s?\b|kil[oó]metros?\b|kilom[eè]tres?\b|chilometri\b|m\b(?!\s?[2²])|mt\b|met(?:er|re)s?\b|metros?\b|m[eè]tres?\b|metri\b|miles?\b|км\b|м\b|公里|米|متر|كم)'
RX = re.compile(NUM + r'\s?[-‑]?\s?(' + T_UNIT + '|' + D_UNIT + ')', re.I)
AFTER = re.compile(r"^\s*(?:(?:walk(?:ing)?|drive|driving|ride|by car|by foot|on foot|away|only|just|a pie|andando|en coche|à pied|en voiture|zu Fuß|mit dem Auto|a piedi|in auto|пешком|на машине|езды|ходьбы|car|foot)\s+){0,3}(?:from the|from|to the|to|away from the|away from|de la|del|de los|de las|de|a la|al|a los|a las|a|à la|à l'|au|aux|à|du|des|vom|von der|von|zum|zur|zu|bis zum|bis zur|dalla|dal|dall'|da|alla|al|до|от|إلى|من|عن|距离|到|dari|ke)\s+", re.I)
CATS = [
    ('airport', r"airport|aeropuerto|a[eé]roport|flughafen|aeroporto|аэропорт|机场|機場|مطار|bandara|luchthaven|havaliman"),
    ('beach', r"beach|playa|platja|plage|strand\b|spiaggia|praia|пляж|海滩|沙滩|شاطئ|pantai"),
    ('coast', r"\bsea\b|\bthe sea|seafront|seaside|\bmar\b|\bmer\b|\bmeer\b|\bmare\b|мор[яе]\b|海边|البحر|\bocean|\bcoast"),
    ('rail', r"metro\b|subway|underground|\btube\b|train station|railway|rail station|\btram|estaci[oó]n de (?:tren|metro)|\bgare\b|bahnhof|u-bahn|s-bahn|stazione|метро|вокзал|地铁|地鐵|مترو|\bmrt\b|\bbts\b|skytrain|monorail"),
    ('stop', r"bus stop|bus station|parada de autob[uú]s|arr[eê]t de bus|bushaltestelle|fermata|автобус|公交|巴士|حافلات|public transport"),
    ('hospital', r"hospital|h[oô]pital|krankenhaus|ospedale|больниц|医院|醫院|مستشفى|rumah sakit"),
    ('school', r"\bschools?\b|colegio|escuela|[eé]cole|schule|scuola|школ|学校|學校|مدرسة|sekolah"),
    ('supermarket', r"supermarket|supermercado|supermarch[eé]|supermarkt|supermercato|супермаркет|超市|سوبرماركت|grocery|hypermarket"),
]
CATS = [(k, re.compile(r, re.I)) for k, r in CATS]
WALK = re.compile(r"walk|on foot|by foot|a pie|andando|caminando|à pied|zu fuß|fußweg|a piedi|пешком|ходьбы|步行|مشي|pe jos|jalan kaki", re.I)
CAR = re.compile(r"driv|by car|en coche|en auto|en voiture|mit dem auto|autofahrt|in auto|на машине|езды|车程|开车|بالسيارة|cu mașina", re.I)
SKIP = re.compile(r"respond|reply|repl(?:ies|y)|call you|whatsapp|session|video|read\b|reading|ago\b|every \d|interval|workout|massage|yoga|sq\.?\s?m|sqm|m2|m²|sq ft|per month|/month|monthly|year|deposit|payment|install?ment|floor|storey|height|deep|depth|long\b|length|wide|width|pool|tall|above sea|altitude|elevation|plot|land area|built|track|runway|ceiling|lap\b", re.I)
SEP = re.compile(r"[.;!?|•·\n\r\t\u2190-\u2bff\uf000-\uf8ff\U0001F000-\U0001FAFF]|\s[-–—]\s|\s{2,}|:\s|-->")


def clean(s): return ' '.join(s.split())


def num(s): return float(s.replace(',', '.'))


def unit(u):
    u = u.lower().strip('. ')
    if re.match(r'min|мин|分|دق|menit|dakika|dk', u): return 'min'
    if re.match(r'km|kil|chil|км|公里|كم', u): return 'km'
    if re.match(r'mile', u): return 'mi'
    return 'm'


GEN = set("""the a an to from of at in on by and or our your its is are away only just about approx approximately around roughly within nearest closest nearby near local main new
international intl public private city central centre center station stations stop stops terminal line lines distance drive driving walk walking car foot minutes minute mins min
el la los las de del al un una y en por solo sólo unos más cercano cercana próximo próxima le les du des au aux et à plus proche der die das den dem zum zur und nächste nächsten il lo gli
alla dal più vicino vicina sea beach beaches ocean coast coastline seafront seaside airport airports hospital hospitals school schools supermarket supermarkets metro subway underground
tube train railway rail tram bus mrt bts skytrain monorail playa playas plage plages strand spiaggia praia mar mer meer mare aeropuerto aéroport aeroport flughafen aeroporto bandara
colegio colegios escuela école schule scuola supermercado supermarché supermarkt grocery hypermarket bahnhof gare stazione estación pantai sandy white pristine golden beautiful
stunning direct access miles km metres meters meter metre""".split())
TRAIL = re.compile(r"(?:\s|:|–|—|-|\*|~|≈|\(|,)+$|\s(?:a|is|are|at|about|approx\.?|approximately|around|roughly|only|just|within|in|is listed at about|at about|at roughly|is just|is only|en|à|a solo|a unos|a tan solo|ca\.?|circa|nur|in nur|- only|: only)$", re.I)
LEAD = re.compile(r"^(?:(?:away|drive|driving|walk|walking|by car|by driving|to|from|and|y|et|und|the|nearby|location|landmarks?|highlights?)\s+)+", re.I)
ROM = re.compile(r"(?:\b(?:a|à|a solo|a sólo|a tan solo|a unos|a menos de|a escasos|a pocos|à seulement|à moins de|situé à|situada a|situado a|ubicado a|ubicada a|a soli|a circa)\s*)$", re.I)
ROMPREP = re.compile(r"^(?:de la|del|de los|de las|de|du|des|dalla|dal|dall'|da)\b", re.I)


CUT = re.compile(r"similar (?:projects|properties|listings|homes|developments)|related (?:projects|properties|listings)|you may also like|you might also like|other (?:projects|developments)|more (?:projects|developments) (?:by|from|in)|nearby (?:projects|developments)|proyectos similares|otros proyectos|otras promociones|ähnliche (?:projekte|immobilien)|projets similaires|autres programmes|похожие проекты", re.I)
INDEX = re.compile(r"/(?:projects?|properties|developments|portfolio|new-projects|proyectos|promociones|projekte|programmes)/?$", re.I)


def words(s): return re.findall(r"[^\W\d_]{2,}['’]?[^\W\d_]*", s, re.U)


def distinct(target): return [w for w in words(target) if w.lower() not in GEN and len(w) >= 3]


def find(text):
    """Candidate claims in one page text: number, unit, target phrase, kind of place, whether the place is named, and the quote."""
    text = re.sub(r'<[^>]{0,300}>', ' ', text)
    cut = CUT.search(text, len(text) // 5)        # a block of other projects further down the page is not about this one
    if cut: text = text[:cut.start()]
    out = []; ms = list(RX.finditer(text))
    for i, m in enumerate(ms):
        raw = m.group(3); u = unit(raw); v = num(m.group(1)); v2 = num(m.group(2)) if m.group(2) else None
        if raw in ('M', 'MT', 'Mi', 'MI', 'Mt'): continue
        if u == 'min' and not (1 <= v <= 180): continue
        if u == 'm' and not (20 <= v <= 5000): continue
        if u in ('km', 'mi') and not (0.1 <= v <= 300): continue
        if v2 is not None and v2 <= v: v2 = None
        nxt = ms[i + 1].start() if i + 1 < len(ms) else len(text); prv = ms[i - 1].end() if i else 0
        tail = text[m.end():min(nxt, m.end() + 110)]; head = text[max(prv, m.start() - 90):m.start()]
        a = AFTER.match(tail); side = None
        if a:
            prep = tail[:a.end()].strip().split()[-1] if tail[:a.end()].strip() else ''
            pm = re.search(r"(from the|from|to the|to|away from the|away from|de la|del|de los|de las|de|a la|al|a los|a las|a|à la|à l'|au|aux|à|du|des|vom|von der|von|zum|zur|zu|bis zum|bis zur|dalla|dal|dall'|da|alla|до|от|إلى|من|عن|距离|到|dari|ke)\s+$", tail[:a.end()], re.I)
            okp = True
            if pm and ROMPREP.match(pm.group(1)) and not ROM.search(text[max(0, m.start() - 25):m.start()]): okp = False   # "7 km de playa" is a length, "a 7 km de la playa" a distance
            if okp:
                rest = tail[a.end():]; s = SEP.search(rest); target = rest[:s.start()] if s else rest
                target = re.split(r'\d|,\s|\svia\s|\s\(', target)[0]; target = ' '.join(target.split()[:6]); side = 'after'
                quote = clean(text[m.start():m.end() + a.end()]) + ' ' + target
        if side is None:
            parts = SEP.split(head); target = parts[-1] if parts else head
            if len(target.strip()) < 3 and len(parts) > 1: target = parts[-2]
            target = clean(target); t0_ = target
            for _ in range(3): target = TRAIL.sub('', target)
            if re.search(r'\bwithin\b', t0_[len(target):], re.I): continue      # "bus stops within 800 m" is a count in a radius, not a distance claim
            if re.search(r"\b(?:no|not|without|sin|kein|keine|sans|нет)\b", target, re.I): continue
            target = re.split(r'\d', target)[-1]; target = re.sub(r"^\s*(?:min(?:ute)?s?|km|m|hrs?|hours?)\b\.?\s*", '', target, flags=re.I)
            target = ' '.join(target.split()[-5:]); target = LEAD.sub('', target)
            side = 'before'
            mt = re.match(r"\s*\*?\s*(?:(?:by |on |a |à |zu |pe |cu |de |en )?(?:walk(?:ing)?|drive|driving|car|foot|pie|pied|coche|auto|voiture|Fuß|Auto|jos|mașina|away|caminando|andando)\b\s*){1,3}", tail, re.I)
            quote = target + ' ' + clean(text[m.start():m.end()]) + (' ' + clean(mt.group(0)) if mt else '')
        target = clean(target).strip(' ,:-–—()*~')
        if len(target) < 3 or len(target) > 80: continue
        quote = re.sub(r"^[^\w(]+|[^\w)%]+$", '', clean(quote), flags=re.U)
        if SKIP.search(quote) or '@' in quote or re.search(r'\d{6,}', quote): continue
        modectx = text[max(0, m.start() - 25):m.end() + 30]
        mode = 'walk' if WALK.search(modectx) else 'car' if CAR.search(modectx) else None
        cats = [k for k, rx in CATS if rx.search(target)]
        cat = cats[0] if len(cats) == 1 else ('beach' if set(cats) == {'beach', 'coast'} else None)
        dt = distinct(target)
        out.append({'v': v, 'v2': v2, 'u': u, 'mode': mode, 'cat': cat, 'target': target, 'named': dt, 'q': quote[:170], 'side': side, 'pos': m.start()})
    return out


def pois(lat, lng, ring=2):
    """Named places of the kinds we measure near the pin (z14 tiles, about 3 to 5 km around)."""
    cls = {'hospital': 'hospital', 'school': 'school', 'college': 'school', 'grocery': 'supermarket', 'shop': 'supermarket', 'bus': 'stop', 'railway': 'rail', 'ferry_terminal': 'stop'}
    L = []
    for ln, p, g, f, ext in o.features(lat, lng, 14, ring, ['poi']):
        c = cls.get(p.get('class'))
        if not c or g.geom_type != 'Point': continue
        names = {clean(str(p[k])) for k in ('name', 'name_en', 'name:latin', 'name_int') if p.get(k)}
        if not names: continue
        lon, la = f(g.x, g.y)
        L.append({'cat': c, 'names': names, 'n': clean(str(p.get('name_en') or p.get('name:latin') or p.get('name')))[:90], 'll': [round(la, 5), round(lon, 5)], 'd': round(o.km(lat, lng, la, lon) * 1000)})
    return L, o.covered_km(lat, lng, 14, ring)


def match_poi(cat, dt, L):
    """The one mapped place of this kind whose name fits the name in the claim, or None when none or several fit."""
    want = {w.lower() for w in dt}; need = -(-len(want) * 3 // 5); C = []
    for p in L:
        if p['cat'] != cat: continue
        best = 0; exact = False
        for n in p['names']:
            have = {w.lower() for w in words(n) if w.lower() not in GEN and len(w) >= 3}
            k = len(want & have)
            if k > best: best = k
            if have == want: exact = True
        if best >= need and best: C.append((exact, best, p))
    if not C: return None
    if len({(c[2]['n'], c[2]['d']) for c in C}) == 1: return C[0][2]
    ex = [c for c in C if c[0]]
    return ex[0][2] if len(ex) == 1 else None


def airports(lat, lng):
    L = {}
    for z in (10, 8):
        for ln, p, g, f, ext in o.features(lat, lng, z, 1, ['aerodrome_label']):
            if g.geom_type != 'Point' or not p.get('iata'): continue
            lon, la = f(g.x, g.y); n = p.get('name_en') or p.get('name:latin') or p.get('name') or ''
            L[p['iata']] = {'iata': p['iata'], 'n': clean(str(n))[:90], 'll': [round(la, 5), round(lon, 5)], 'd': round(o.km(lat, lng, la, lon) * 1000)}
    return sorted(L.values(), key=lambda a: a['d'])


GENERIC = {'international', 'airport', 'intl', 'the', 'new', 'aeropuerto', 'aeroport', 'de', 'el', 'al', 'city', 'bandara', 'flughafen'}


def pick_airport(target, aps):
    """(airport, matched): the airport named in the claim when exactly one fits best, else the nearest one for a claim that names none."""
    t = target.lower(); toks = set(re.findall(r"[a-zà-ÿ']{3,}", t)) - GENERIC
    for a in aps:
        if re.search(r'\b' + a['iata'] + r'\b', target): return a, True
    sc = []
    for a in aps:
        nt = set(re.findall(r"[a-zà-ÿ']{3,}", a['n'].lower())) - GENERIC
        k = len(toks & nt)
        if k: sc.append((k / len(toks | nt), a))
    if sc:
        sc.sort(key=lambda x: -x[0])
        if len(sc) == 1 or sc[0][0] > sc[1][0]: return sc[0][1], True
        return None, False            # two airports fit the name equally: not measured
    return (aps[0], False) if aps else (None, False)


MINW = r"(?:[Mm]in|MIN|[Mm]ins|MINS|[Mm]inutes|MINUTES|[Mm]inutos|[Mm]inuten)"
NAMEW = r"(?!(?:Within|Approximately|Approx|Only|Just|Travel|About|Around|Under|Over|Every|From|Responds|Google)\b)[A-ZÀ-Ý][\w'’\-]+(?:\s(?:[A-ZÀ-Ý&][\w'’\-]*|de|del|la|el|of|al|y|and)){0,4}"
OTHER = re.compile(r"^(?:\d{1,3}(?:\s?[-–]\s?\d{1,3})?\s?" + MINW + r"\s(?:to|from|TO|FROM|de|del|a|al|à|von|zum|zur)\s(?:the\s|la\s|el\s)?" + NAMEW + r"|" + NAMEW + r"\s\d{1,3}(?:\s?[-–]\s?\d{1,3})?\s?" + MINW + r"(?:\s(?:walk|drive|by car|on foot|a pie|en coche))?)$")
RC = {}


def route(prof, a, b):
    key = prof + '|%.5f,%.5f|%.5f,%.5f' % (a[0], a[1], b[0], b[1])
    if key in RC: return RC[key]
    url = 'https://routing.openstreetmap.de/routed-%s/route/v1/driving/%.5f,%.5f;%.5f,%.5f?overview=false' % (prof, a[1], a[0], b[1], b[0])
    res = None
    for k in range(3):
        try:
            r = requests.get(url, headers=UA, timeout=40); time.sleep(1.1)
            if r.status_code == 200:
                j = r.json()
                if j.get('code') == 'Ok' and j.get('routes'):
                    w = j.get('waypoints') or [{}, {}]
                    res = [round(j['routes'][0]['distance']), round(j['routes'][0]['duration']), round(w[0].get('distance') or 0), round(w[-1].get('distance') or 0)]
                else: res = None
                break
        except Exception: time.sleep(3)
    RC[key] = res; return res


def main(data_dir, around_path, out_path, rc_path='route-cache.json'):
    global RC
    if os.path.exists(rc_path): RC = json.load(open(rc_path))
    named = {p['id']: p for p in json.load(open(os.path.join(data_dir, 'named.json')))['projects']}
    AR = json.load(open(around_path)); A = AR['projects']
    H = {}
    for f in sorted(glob.glob(os.path.join(data_dir, 'page-history-*.json'))):
        j = json.load(open(f)); H.update(j.get('projects') or {k: v for k, v in j.items() if isinstance(v, dict) and 'v' in v})
    P = {}; t0 = time.time(); stats = {'pins': 0, 'with_copy': 0, 'with_claims': 0, 'measured': 0, 'other': 0, 'routes': 0}
    for pid, ar in sorted(A.items()):
        x = named.get(pid)
        if not x or str(x.get('mk', '')).lower() == 'sumba': continue
        stats['pins'] += 1; h = H.get(pid)
        if not h or not h.get('v'): continue
        stats['with_copy'] += 1; last = h['v'][-1]; text = ''.join(h['seg'][i] for i in last['ix'])
        if INDEX.search(str(x.get('url') or '').split('?')[0]):      # the page lists several projects: its claims are not read as this project's
            P[pid] = {'sha': last['sha'], 'd': last['d'], 'c': [], 'o': 0, 'ox': [], 'index': 1}; stats['index_pages'] = stats.get('index_pages', 0) + 1; continue
        lat, lng = [float(v) for v in ar['pin'].split(',')]
        cl = find(text); seen = set(); M = []; other = []; aps = None; PL = None; percat = {}
        for c in cl:
            def skip(c=c):
                if c['u'] == 'min' and len(c['q']) <= 60 and OTHER.match(c['q']) and not any(c['q'][:22] == q[:22] or c['q'][-22:] == q[-22:] for q in other): other.append(c['q'])
            if not c['cat']: skip(); continue
            key = (c['cat'], c['v'], c['u'])
            if key in seen or percat.get(c['cat'], 0) >= 3: continue
            rec = {'q': c['q'], 'v': c['v'], 'u': c['u'], 'cat': c['cat']}
            if c['v2']: rec['v2'] = c['v2']
            if c['mode']: rec['mode'] = c['mode']
            tgt = None; cat = c['cat']
            if cat == 'airport':
                if aps is None: aps = airports(lat, lng)
                a, nm_ = pick_airport(c['target'], aps)
                if c['named'] and not nm_: skip(); continue      # an airport is named and we could not match it: not measured
                if a: tgt = {'ll': a['ll'], 'd': a['d'], 'n': a['n'], 'iata': a['iata']}; rec['matched'] = 1 if nm_ else 0
                else: rec['none'] = 150
            elif c['named']:
                if cat in ('beach', 'coast'): skip(); continue   # beaches carry no name in our map data: a named beach is not measured
                if PL is None: PL = pois(lat, lng)
                p = match_poi(cat, c['named'], PL[0])
                if not p: skip(); continue
                tgt = {'ll': p['ll'], 'd': p['d'], 'n': p['n']}; rec['matched'] = 1
            else:
                t = ar.get(cat)
                if t and t.get('same'): t = ar.get('stop')
                if t and 'd' in t:
                    tgt = {k: t[k] for k in ('ll', 'd', 'n', 'k') if k in t}
                    if t.get('in'): tgt['in'] = 1
                elif t and 'none' in t: rec['none'] = t['none']
                else: continue
            seen.add(key); percat[cat] = percat.get(cat, 0) + 1
            if tgt:
                rec['t'] = tgt
                if tgt['d'] > 30 and not tgt.get('in'):
                    far = 1500 if cat == 'airport' else 400     # an airport's label sits in the middle of the airfield
                    car = route('car', (lat, lng), tgt['ll'])
                    if car and len(car) == 4 and car[2] <= 400 and car[3] <= far: rec['car'] = car[:2]
                    if tgt['d'] <= 5000 and cat != 'airport':
                        ft = route('foot', (lat, lng), tgt['ll'])
                        if ft and len(ft) == 4 and ft[2] <= 400 and ft[3] <= far: rec['foot'] = ft[:2]
                    stats['routes'] += 1
            M.append(rec)
            if len(M) >= 8: break
        if M or other:
            stats['with_claims'] += 1; stats['measured'] += len(M); stats['other'] += len(other)
        P[pid] = {'sha': last['sha'], 'd': last['d'], 'c': M, 'o': len(other), 'ox': other[:2]}
        json.dump(RC, open(rc_path, 'w'))
        print(pid, len(M), len(other), flush=True)
    out = {'v': 1, 'updated': time.strftime('%Y-%m-%d', time.gmtime()), 'osm_build': AR.get('osm_build'), 'stats': stats, 'seconds': round(time.time() - t0),
           'source': {'claims': 'The developer\'s own page as we sealed it (text copy with its SHA-256), /projects/<slug>/changes/<sha>.txt',
                      'map': 'OpenStreetMap contributors, ODbL, https://www.openstreetmap.org/copyright (read from OpenFreeMap vector tiles, planet build ' + str(AR.get('osm_build')) + ')',
                      'routing': 'OSRM on OpenStreetMap data, public server of FOSSGIS e.V., https://routing.openstreetmap.de/ (car and foot profiles; times without traffic)'},
           'route_limits': 'A route is kept when it starts within 400 m of the pin and ends within 400 m of the place (1,500 m for an airport, whose map label sits in the middle of the airfield).',
           'method': 'Fixed patterns find numbers followed by minutes, metres, kilometres or miles in the page text, and the place they point at; text after a block of other projects ("similar projects" and the like) is not read. A claim is measured when that place is a kind we measure from the pin: beach, sea, airport, rail or metro station, bus stop, hospital, school, supermarket. A claim that names its place is measured only when exactly one mapped place fits that name (airports within about 150 km, other places within about 4 km); a named beach is not measured because beaches carry no name in our map data. A claim that names no place ("the beach", "airport") is measured to the nearest one mapped. Straight-line distance from the pin; road distance and time by OSRM where the route starts and ends within 400 m of both points.',
           'limits': 'The pin is accurate to about 100 m. The nearest mapped place may not be the one the developer means. OpenStreetMap can be incomplete. Route times ignore traffic, parking and waiting. Patterns can miss or misread a claim.',
           'fields': {'q': 'quote from the sealed copy (whitespace collapsed)', 'v': 'number claimed', 'v2': 'upper number of a range', 'u': 'min, m, km or mi', 'mode': 'walk or car when the page says so', 'cat': 'kind of place',
                      't': 'place measured: ll, d (straight line, m), n (name), iata', 'car': '[road metres, seconds]', 'foot': '[path metres, seconds]', 'none': 'no such place mapped within this many km', 'matched': '1 when the airport named in the claim was matched by name or code',
                      'index': '1 when the page we track lists several projects, so no claim was read', 'o': 'travel-time claims to other named places, not measured', 'ox': 'up to two of them'},
           'projects': P}
    json.dump(out, open(out_path, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(stats, os.path.getsize(out_path))


if __name__ == '__main__':
    main(*sys.argv[1:5])
