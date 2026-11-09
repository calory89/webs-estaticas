#!/usr/bin/env python3
"""Kolaboro: money reality near the pin (batch 19, n19b). No model calls, no accounts, no keys.

  money_nearby.py shortlet OUT.json   Inside Airbnb (CC BY 4.0) listings within 1 km of each reliable project pin, for the cities
                                      Inside Airbnb covers: counts by room type, nightly price quartiles of entire homes (local
                                      currency as published by Inside Airbnb), Inside Airbnb's own occupancy and revenue estimates
                                      (estimated_occupancy_l365d, estimated_revenue_l365d, their "San Francisco model"). Aggregates
                                      only, at least 10 listings per figure; no listing, host or review data is kept. Also the
                                      rental yield or return claims printed on the developer page we track (our sealed copies).
  money_nearby.py sold OUT.json       Recorded sale prices within 1 km of each pin from official open registers:
                                      England and Wales HM Land Registry Price Paid Data (OGL v3.0; postcode centroids from
                                      postcodes.io, ONS data OGL), France DVF geolocated (Licence Ouverte 2.0), New York City
                                      rolling sales (NYC Open Data; tax block located with MapPLUTO). Medians, quartiles and price
                                      per m2 where the register publishes floor area; versus the developer's own headline price
                                      from /data/price-history.json, same currency only, never converted.

Projects and pins: those of https://kolaboro.com/data/construction-progress.json (plot-level pin in named.json, at least 3 decimals,
not shared, not an area centre, Sumba excluded), the same selection as the satellite, street photo and 3D files.
Options: --only ID,ID   --site DIR (read data/*.json from a checkout instead of kolaboro.com)"""
import json, os, sys, math, time, datetime, argparse, re, csv, gzip, io, statistics, urllib.request, urllib.parse

ORIGIN = 'https://kolaboro.com'
UA = {'user-agent': 'Kolaboro-money-nearby/1.0 (+https://kolaboro.com/data/; agent@kolaboro.com)'}
R = 1000          # metres from the pin
MIN_N = 10        # smallest group we publish a median for
csv.field_size_limit(10 ** 8)
SITE = None


def get(url, data=None, timeout=120, tries=5, headers=None):
    h = dict(UA); h.update(headers or {})
    req = urllib.request.Request(url, data=data, headers=h)
    for i in range(tries):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r: return r.read()
        except Exception as e:
            if i == tries - 1: raise
            time.sleep(3 + i * 6)


def get_json(url, **k): return json.loads(get(url, **k))


def site_json(path):
    if SITE:
        with open(os.path.join(SITE, 'data', path)) as f: return json.load(f)
    return get_json(ORIGIN + '/data/' + path + '?run=%d' % time.time())


def stream_lines(url):
    """Yield decoded text lines of a (possibly gzipped) remote CSV without keeping it on disk."""
    req = urllib.request.Request(urllib.parse.quote(url, safe=':/?&=%'), headers=UA)
    r = urllib.request.urlopen(req, timeout=300)
    raw = gzip.GzipFile(fileobj=r) if url.endswith('.gz') else r
    return io.TextIOWrapper(raw, encoding='utf-8', errors='replace', newline='')


def dist(lat1, lng1, lat2, lng2):
    Re = 6371008.8; r = math.radians
    dl, dn = r(lat2 - lat1), r(lng2 - lng1)
    h = math.sin(dl / 2) ** 2 + math.cos(r(lat1)) * math.cos(r(lat2)) * math.sin(dn / 2) ** 2
    return 2 * Re * math.asin(min(1, math.sqrt(h)))


def q(vals, p):
    v = sorted(vals)
    if not v: return None
    k = (len(v) - 1) * p; f = math.floor(k); c = math.ceil(k)
    return v[f] if f == c else v[f] + (v[c] - v[f]) * (k - f)


def rnd(x, nd=0):
    if x is None: return None
    return int(round(x)) if nd == 0 else round(x, nd)


def stats(vals, nd=0):
    vals = [v for v in vals if v is not None]
    if len(vals) < MIN_N: return {'n': len(vals)}
    return {'n': len(vals), 'p25': rnd(q(vals, .25), nd), 'p50': rnd(q(vals, .5), nd), 'p75': rnd(q(vals, .75), nd)}


def unchanged(args, name, fp):
    """Budget rule: skip the run when the inputs are the same as those of the published file."""
    if args.force or args.only: return False
    try: prev = get_json(ORIGIN + '/data/' + name + '?run=%d' % time.time(), tries=2).get('inputs_fp')
    except Exception: prev = None
    if prev == fp: print('inputs unchanged since the published file, nothing to do'); return True
    return False


def head_lm(url):
    try:
        req = urllib.request.Request(urllib.parse.quote(url, safe=':/?&=%'), headers=UA, method='HEAD')
        with urllib.request.urlopen(req, timeout=60) as r: return r.headers.get('last-modified') or r.headers.get('etag') or ''
    except Exception as e: return 'err'


def projects(only):
    cp = site_json('construction-progress.json')
    named = site_json('named.json')
    by = {p['id']: p for p in named['projects']}
    out = []
    for pid in cp['projects']:
        p = by.get(pid); fx = (p or {}).get('fx') or {}
        if not p or not isinstance(fx.get('lat'), (int, float)) or not isinstance(fx.get('lng'), (int, float)): continue
        if str(p.get('mk', '')).lower() == 'sumba': continue
        if only and pid not in only: continue
        out.append({'id': pid, 's': p['s'], 'co': p.get('co'), 'mk': p.get('mk'), 'lat': float(fx['lat']), 'lng': float(fx['lng'])})
    return out


# ------------------------------------------------------------------------------------------------ developer's own claims and prices
YIELD_RX = re.compile(r'(yield|roi\b|return on|returns?\b|rental (?:income|return|guarantee)|guaranteed (?:income|rent)|income|occupancy|rendimiento|rentabilidad|retorno|rendement|rentabilit|rendite|mietrendite|ertrag|доходн|окупаем|收益|回报|租金回报|عائد|العائد|rendement|huurrendement)', re.I)
PCT_RX = re.compile(r'(\d{1,2}(?:[.,]\d{1,2})?\s?(?:-|–|to|a|bis|à|до)?\s?(?:\d{1,2}(?:[.,]\d{1,2})?)?\s?%|%\s?\d{1,2}(?:[.,]\d)?)')
MASK = lambda s: re.sub(r'\+?\d[\d ()-]{8,}\d', lambda m: m.group(0) if re.search(r'\d{1,3}([.,\s]\d{3}){2,}', m.group(0)) else '[phone]', re.sub(r'[\w.+-]+@[\w-]+\.[\w.]+', '[e-mail]', s))


def page_history():
    out = {}
    for k in range(3):
        try: d = site_json('page-history-%d.json' % k)
        except Exception as e: print('page-history', k, e); continue
        out.update(d.get('projects') or {})
    return out


def yield_claims(ph, pid):
    """Rental yield / return claims printed on the page we track: newest sealed copy that has one; short snippets."""
    p = ph.get(pid)
    if not p or not p.get('v'): return None
    for v in reversed(p['v']):
        text = re.sub(r'\s+', ' ', ''.join(p['seg'][i] for i in v['ix']))
        found, seen, last = [], set(), -1
        for m in PCT_RX.finditer(text):
            if m.start() < last: continue
            kw = YIELD_RX.search(text[max(0, m.start() - 45):min(len(text), m.end() + 35)])
            if not kw: continue
            near = text[max(0, m.start() - 30):min(len(text), m.end() + 25)].lower()
            # percentages that are about something else: deposits, payment plan, discounts, interest, progress, price growth
            if re.search(r'deposit|down ?payment|instal|booking|discount|\boff\b|interest|commission|vat|\btax|\bfee|enganche|anticipo|acompte|anzahlung|скидк|首付|دفعة|complet|progress|construction|done|apprecia|growth|increase|past year|загр', near) and not re.search(r'yield|roi|rendim|rentab|rendite|доходн|收益|عائد|return', near): continue
            a, b = max(0, m.start() - 100), min(len(text), m.end() + 80)
            s = text[a:b].strip()
            if a > 0 and ' ' in s: s = '…' + s.split(' ', 1)[1]
            if b < len(text) and ' ' in s: s = s.rsplit(' ', 1)[0] + '…'
            key = m.group(0).replace(' ', '')
            if key in seen: continue
            seen.add(key); last = b; found.append(MASK(s)[:240])
            if len(found) >= 3: break
        if found: return {'d': v['d'], 'sha': v['sha'], 'q': found, 'url': p.get('url')}
    return None


def dev_price(phx, pid, cur):
    """Latest headline price printed on the developer page (price-history.json), only in the register's currency."""
    p = (phx.get('projects') or {}).get(pid)
    if not p: return None
    for pt in reversed(p.get('pts') or []):
        h = pt.get('head')
        if h and h.get('cur') == cur and h.get('v') and 20000 <= h['v'] <= 30000000:   # a unit price, not a project total or a fee
            return {'cur': cur, 'v': h['v'], 'p': h.get('p'), 'd': pt['d'], 'src': pt['src'], 'ref': pt['ref']}
    return None


def dev_per_m2(phx, pid, cur):
    p = (phx.get('projects') or {}).get(pid)
    if not p: return None
    for pt in reversed(p.get('pts') or []):
        for a in pt.get('all') or []:
            if a.get('k') == 'per_m2' and a.get('cur') == cur and a.get('v'):
                c = (a.get('c') or '').lower()
                sqft = bool(re.search(r'sq\.? ?ft|sqft|square f|ft²|ft2|pie', c))
                return {'cur': cur, 'v': a['v'], 'p': a.get('p'), 'unit': 'sqft' if sqft else 'm2', 'm2': round(a['v'] * (10.7639 if sqft else 1)), 'd': pt['d'], 'src': pt['src'], 'ref': pt['ref'], 'c': MASK(a.get('c') or '')[:120]}
    return None


# ------------------------------------------------------------------------------------------------ (3) Inside Airbnb
IA_PAGE = 'https://insideairbnb.com/get-the-data/'
# (country, market) of our projects -> Inside Airbnb dataset path (without date) and the currency its prices are in
IA_MAP = {
    ('Greece', 'Ellinikon'): 'greece/attica/athens', ('Greece', 'Elounda'): 'greece/crete/crete', ('Greece', 'Thessaloniki'): 'greece/central-macedonia/thessaloniki',
    ('USA', 'Austin'): 'united-states/tx/austin', ('USA', 'Nashville'): 'united-states/tn/nashville', ('USA', 'New York'): 'united-states/ny/new-york-city',
    ('USA', 'Fort Lauderdale'): 'united-states/fl/broward-county', ('USA', 'Las Vegas'): 'united-states/nv/clark-county-nv', ('USA', 'Hawaii'): 'united-states/hi/hawaii',
    ('Thailand', 'Bangkok'): 'thailand/central-thailand/bangkok', ('Germany', 'Berlin'): 'germany/be/berlin', ('Ireland', 'Dublin'): 'ireland/leinster/dublin',
    ('United Kingdom', 'Edinburgh'): 'united-kingdom/scotland/edinburgh', ('United Kingdom', 'Manchester'): 'united-kingdom/england/greater-manchester',
    ('United Kingdom', 'London'): 'united-kingdom/england/london', ('Turkey', 'Istanbul'): 'turkey/marmara/istanbul', ('Spain', 'Costa del Sol'): 'spain/andalucía/malaga',
    ('Spain', 'Mallorca'): 'spain/islas-baleares/mallorca', ('Spain', 'Costa Blanca'): 'spain/vc/valencia', ('Kenya', 'Nairobi'): 'kenya/nairobi/nairobi',
    ('Latvia', 'Riga'): 'latvia/riga/riga', ('Canada', 'Toronto'): 'canada/on/toronto', ('Canada', 'Vancouver'): 'canada/bc/vancouver',
}
IA_CUR = {'greece': 'EUR', 'united-states': 'USD', 'thailand': 'THB', 'germany': 'EUR', 'ireland': 'EUR', 'united-kingdom': 'GBP', 'turkey': 'TRY', 'spain': 'EUR', 'kenya': 'KES', 'latvia': 'EUR', 'canada': 'CAD'}


def ia_key(p, ar):
    co, mk = p['co'], p['mk']
    if (co, mk) in IA_MAP: return IA_MAP[(co, mk)]
    a = (ar or '').lower()
    if co == 'Greece':
        for k in ('Ellinikon', 'Elounda', 'Thessaloniki'):
            if k.lower() in a: return IA_MAP[('Greece', k)]
    if co == 'Spain':
        if 'mallorca' in a: return IA_MAP[('Spain', 'Mallorca')]
        if 'alicante' in a or 'costa blanca' in a: return IA_MAP[('Spain', 'Costa Blanca')]
    return None


def ia_latest():
    html = get(IA_PAGE).decode('utf-8', 'replace')
    best = {}
    for m in re.finditer(r'https://data\.insideairbnb\.com/([^"]+?)/(\d{4}-\d{2}-\d{2})/data/listings\.csv\.gz', html):
        path, d = urllib.parse.unquote(m.group(1)), m.group(2)
        if path not in best or d > best[path][0]: best[path] = (d, m.group(0))
    return best


def money(s):
    s = (s or '').replace('$', '').replace(',', '').strip()
    try: v = float(s); return v if v > 0 else None
    except ValueError: return None


def num(s):
    try: return float(s)
    except (TypeError, ValueError): return None


def shortlet(args):
    ps = projects(args.only)
    named = {p['id']: p for p in site_json('named.json')['projects']}
    ph = page_history()
    latest = ia_latest()
    want = {}
    for p in ps:
        k = ia_key(p, named[p['id']].get('ar'))
        if k: want.setdefault(k, []).append(p)
    fp = json.dumps({'ia': {k: latest.get(k, [''])[0] for k in sorted(want)}, 'pins': sorted((p['id'], p['lat'], p['lng']) for p in ps)}, sort_keys=True)
    if unchanged(args, 'short-lets.json', fp): return
    out = {'v': 1, 'updated': datetime.date.today().isoformat(), 'radius_m': R, 'min_n': MIN_N, 'inputs_fp': fp,
           'source': {'name': 'Inside Airbnb', 'url': 'https://insideairbnb.com/', 'data': IA_PAGE, 'licence': 'CC BY 4.0', 'licence_url': 'https://creativecommons.org/licenses/by/4.0/',
                      'method_url': 'https://insideairbnb.com/data-assumptions/',
                      'credit': 'Data from Inside Airbnb (insideairbnb.com), licensed CC BY 4.0. Aggregated by Kolaboro; no listing-level data republished.'},
           'method': ['Listings in the latest Inside Airbnb snapshot of the city whose map point lies within 1 km of our pin. Airbnb moves each map point up to 150 m from the real address, and our pin is about 100 m accurate.',
                      'Nightly price: the price shown on the listing on the day Inside Airbnb collected it, in the currency Inside Airbnb publishes for the city. Listings with no price that day are left out.',
                      'Occupancy and revenue: Inside Airbnb\'s own estimates per listing for the last 12 months (their "San Francisco model": reviews at a 50% review rate, times the average stay or the minimum nights, capped at 70%). We only take medians, over entire homes with at least one review in the last 12 months.',
                      'We publish a figure only when at least 10 listings stand behind it. No listing, host or review is shown or kept.',
                      'Developer claim: rental yield or return figures printed on the developer page we track, quoted from our dated sealed copy. We do not check or compute a yield.'],
           'datasets': {}, 'projects': {}, 'not_covered': []}
    covered_ids = set()
    for key, plist in sorted(want.items()):
        if key not in latest: print('no dataset', key); continue
        d, url = latest[key]
        cur = IA_CUR.get(key.split('/')[0], '')
        print('IA', key, d, len(plist), flush=True)
        acc = {p['id']: {'rt': {}, 'e_price': [], 'e_occ': [], 'e_rev': [], 'e_act': 0, 'e_n': 0, 'lic': 0, 'br': {}, 'near': 1e9} for p in plist}
        t0 = time.time(); rows = 0; bb = [90, -90, 180, -180]
        try:
            rd = csv.DictReader(stream_lines(url))
            for r in rd:
                rows += 1
                la, ln = num(r.get('latitude')), num(r.get('longitude'))
                if la is None or ln is None: continue
                bb[0] = min(bb[0], la); bb[1] = max(bb[1], la); bb[2] = min(bb[2], ln); bb[3] = max(bb[3], ln)
                for p in plist:
                    if abs(la - p['lat']) > 0.012 or abs(ln - p['lng']) > 0.012 / max(0.2, math.cos(math.radians(p['lat']))): continue
                    dd = dist(p['lat'], p['lng'], la, ln)
                    a = acc[p['id']]
                    if dd < a['near']: a['near'] = dd
                    if dd > R: continue
                    rt = r.get('room_type') or 'other'
                    a['rt'][rt] = a['rt'].get(rt, 0) + 1
                    if (r.get('license') or '').strip(): a['lic'] += 1
                    if rt != 'Entire home/apt': continue
                    a['e_n'] += 1
                    pr = money(r.get('price'))
                    if pr and pr < 100000: a['e_price'].append(pr)
                    br = num(r.get('bedrooms'))
                    if pr and br is not None:
                        g = '0-1' if br <= 1 else '2' if br == 2 else '3+'
                        a['br'].setdefault(g, []).append(pr)
                    if (num(r.get('number_of_reviews_ltm')) or 0) >= 1:
                        a['e_act'] += 1
                        o, rv = num(r.get('estimated_occupancy_l365d')), num(r.get('estimated_revenue_l365d'))
                        if o is not None: a['e_occ'].append(o)
                        if rv is not None: a['e_rev'].append(rv)
        except Exception as e:
            print('IA error', key, e, flush=True); continue
        out['datasets'][key] = {'date': d, 'url': url, 'currency': cur, 'rows': rows, 'city': key.split('/')[-1].replace('-', ' ').title()}
        print('  rows', rows, round(time.time() - t0), 's', flush=True)
        for p in plist:
            a = acc[p['id']]; n_all = sum(a['rt'].values())
            covered_ids.add(p['id'])
            rec = {'ds': key, 'n': n_all, 'rt': a['rt'], 'near_m': rnd(a['near']) if a['near'] < 1e8 else None}
            if n_all == 0 and not (bb[0] <= p['lat'] <= bb[1] and bb[2] <= p['lng'] <= bb[3]):
                rec['outside'] = True   # pin is outside the area the city's snapshot covers
            e = {'n': a['e_n'], 'act': a['e_act'], 'lic': a['lic']}
            e['price'] = stats(a['e_price'])
            e['occ'] = stats(a['e_occ'])
            e['rev'] = stats(a['e_rev'])
            e['br'] = {g: stats(v) for g, v in sorted(a['br'].items()) if len(v) >= MIN_N}
            rec['e'] = e
            rec['cur'] = cur
            c = yield_claims(ph, p['id'])
            if c: rec['claim'] = c
            elif (ph.get(p['id']) or {}).get('v'): rec['nocl'] = ph[p['id']]['v'][-1]['d']   # newest copy we searched, no figure found
            out['projects'][p['id']] = rec
    out['not_covered'] = sorted(p['id'] for p in ps if p['id'] not in covered_ids)
    out['summary'] = {'pins': len(ps), 'covered': len(out['projects']), 'with_listings': sum(1 for r in out['projects'].values() if r['n'] >= MIN_N), 'with_claim': sum(1 for r in out['projects'].values() if r.get('claim'))}
    json.dump(out, open(args.out, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(json.dumps(out['summary']))


# ------------------------------------------------------------------------------------------------ (4) recorded sales
PPD = 'http://prod2.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com/pp-%d.csv'
PC = 'https://api.postcodes.io/postcodes'


def postcodes_near(lat, lng):
    """Every postcode whose centroid is within R of the pin: postcodes.io nearest-postcode queries on a 250 m grid (radius 200 m),
    six at a time."""
    from concurrent.futures import ThreadPoolExecutor
    step = 250
    k = math.cos(math.radians(lat))
    n = int(R / step) + 1
    pts = [(lat + j * step / 111320, lng + i * step / (111320 * k)) for i in range(-n, n + 1) for j in range(-n, n + 1) if math.hypot(i * step, j * step) <= R + 150]
    def one(pt):
        qs = urllib.parse.urlencode({'lon': '%.6f' % pt[1], 'lat': '%.6f' % pt[0], 'radius': 200, 'limit': 100})
        try: return get_json(PC + '?' + qs, timeout=40).get('result') or []
        except Exception as e: print('postcodes.io', e, flush=True); return []
    found = {}
    with ThreadPoolExecutor(6) as ex:
        for res in ex.map(one, pts):
            for r in res:
                if r.get('latitude') is None: continue
                dd = dist(lat, lng, r['latitude'], r['longitude'])
                if dd <= R: found[r['postcode']] = (dd, r.get('country'), r.get('region'))
    return found


REGION = {'London': 'London', 'Manchester': 'North West', 'Liverpool': 'North West', 'Birmingham': 'West Midlands', 'Leeds': 'Yorkshire and The Humber'}


def england(ps, phx, years):
    pins = [p for p in ps if p['co'] == 'United Kingdom']
    pcs = {}
    for p in pins:
        f = postcodes_near(p['lat'], p['lng'])
        ctry = {v[1] for v in f.values()}; regs = {v[2] for v in f.values()}
        print('postcodes', p['id'], len(f), ctry, regs, flush=True)
        if not f or not (ctry & {'England', 'Wales'}): p['skip'] = 'outside England and Wales'; continue
        want = REGION.get(p['mk'])
        if want and want not in regs: p['skip'] = 'pin_mismatch'; p['regions'] = sorted(r for r in regs if r); continue   # the pin is not in the project's city
        p['pc'] = f
        for pc in f: pcs.setdefault(pc, []).append(p['id'])
    acc = {p['id']: [] for p in pins if p.get('pc')}
    period = [None, None]
    for y in years:
        url = PPD % y
        print('PPD', url, flush=True)
        for r in csv.reader(stream_lines(url)):
            if len(r) < 16: continue
            pc = r[3]
            if pc not in pcs: continue
            if r[14] != 'A' or r[15] == 'D': continue          # standard price paid, not deleted
            price, d = float(r[1]), r[2][:10]
            period[0] = d if not period[0] or d < period[0] else period[0]; period[1] = d if not period[1] or d > period[1] else period[1]
            for pid in pcs[pc]: acc[pid].append((price, d, r[4], r[5]))
    res = {}
    for p in pins:
        if p.get('skip') == 'pin_mismatch': print('PIN MISMATCH', p['id'], p['mk'], p.get('regions'), flush=True); res[p['id']] = {'reg': 'hmlr', 'skip': 'pin_mismatch'}; continue
        if p.get('skip'): res[p['id']] = {'reg': 'hmlr', 'skip': 'scotland' if p['mk'] in ('Edinburgh', 'Glasgow') else 'outside'}; continue
        rows = acc.get(p['id'], [])
        rec = {'reg': 'hmlr', 'cur': 'GBP', 'pc': len(p['pc']), 'all': stats([r[0] for r in rows]),
               'flat': stats([r[0] for r in rows if r[2] == 'F']), 'new': stats([r[0] for r in rows if r[3] == 'Y']),
               'new_flat': stats([r[0] for r in rows if r[3] == 'Y' and r[2] == 'F']),
               'from': min([r[1] for r in rows], default=None), 'to': max([r[1] for r in rows], default=None)}
        yrs = {}
        for r in rows: yrs.setdefault(r[1][:4], []).append(r[0])
        rec['by_year'] = {y: stats(v) for y, v in sorted(yrs.items())}
        dp = dev_price(phx, p['id'], 'GBP')
        if dp:
            rec['dev'] = dp
            ref = [r[0] for r in rows if r[2] == 'F'] if len([r for r in rows if r[2] == 'F']) >= MIN_N else [r[0] for r in rows]
            if len(ref) >= MIN_N: rec['dev']['below_pct'] = rnd(100 * sum(1 for v in ref if v < dp['v']) / len(ref)); rec['dev']['vs'] = 'flat' if ref is not None and len([r for r in rows if r[2] == 'F']) >= MIN_N else 'all'
        res[p['id']] = rec
    return res, period


DVF = 'https://files.data.gouv.fr/geo-dvf/latest/csv/%d/departements/%s.csv.gz'


def france(ps, phx, years):
    pins = [p for p in ps if p['co'] == 'France']
    deps = {}
    for p in pins:
        try:
            c = get_json('https://geo.api.gouv.fr/communes?' + urllib.parse.urlencode({'lat': p['lat'], 'lon': p['lng'], 'fields': 'codeDepartement,nom', 'format': 'json'}))
            dep = c[0]['codeDepartement']; p['dep'] = dep; p['commune'] = c[0]['nom']; deps.setdefault(dep, []).append(p)
        except Exception as e: print('geo.api.gouv.fr', p['id'], e)
    mut = {p['id']: {} for p in pins}
    period = [None, None]
    for dep, plist in deps.items():
        for y in years:
            url = DVF % (y, dep)
            print('DVF', url, flush=True)
            try:
                for r in csv.DictReader(stream_lines(url)):
                    la, ln = num(r.get('latitude')), num(r.get('longitude'))
                    if la is None: continue
                    for p in plist:
                        if abs(la - p['lat']) > 0.012 or abs(ln - p['lng']) > 0.017: continue
                        if dist(p['lat'], p['lng'], la, ln) > R: continue
                        nat = r['nature_mutation']
                        if nat not in ('Vente', "Vente en l'état futur d'achèvement"): continue
                        m = mut[p['id']].setdefault(r['id_mutation'], {'v': num(r['valeur_fonciere']), 'd': r['date_mutation'], 'vefa': nat != 'Vente', 'loc': [], 'other': 0})
                        tl = r.get('type_local') or ''
                        if tl in ('Appartement', 'Maison'): m['loc'].append((tl, num(r.get('surface_reelle_bati')), r.get('id_parcelle'), r.get('lot1_numero')))
                        elif tl == 'Local industriel. commercial ou assimilé': m['other'] += 1
            except Exception as e: print('DVF error', url, e)
    res = {}
    for p in pins:
        if not p.get('dep'): continue
        rows = []
        for m in mut[p['id']].values():
            # one dwelling per sale (a sale may also include a cellar or parking), no commercial premises
            locs = {(l[0], l[2], l[3]) for l in m['loc']}
            if len(locs) != 1 or m['other'] or not m['v']: continue
            tl, s = m['loc'][0][0], m['loc'][0][1]
            rows.append((m['v'], m['d'], tl, s if s and s >= 9 else None, m['vefa']))
            period[0] = m['d'] if not period[0] or m['d'] < period[0] else period[0]; period[1] = m['d'] if not period[1] or m['d'] > period[1] else period[1]
        pm2 = lambda rr: [r[0] / r[3] for r in rr if r[3]]
        apt = [r for r in rows if r[2] == 'Appartement']; vefa = [r for r in rows if r[4]]
        rec = {'reg': 'dvf', 'cur': 'EUR', 'commune': p.get('commune'), 'all': stats([r[0] for r in rows]), 'm2': stats(pm2(rows)),
               'apt': stats([r[0] for r in apt]), 'apt_m2': stats(pm2(apt)), 'house': stats([r[0] for r in rows if r[2] == 'Maison']),
               'new': stats([r[0] for r in vefa]), 'new_m2': stats(pm2(vefa)),
               'from': min([r[1] for r in rows], default=None), 'to': max([r[1] for r in rows], default=None)}
        dp = dev_price(phx, p['id'], 'EUR')
        if dp:
            rec['dev'] = dp
            ref = [r[0] for r in rows]
            if len(ref) >= MIN_N: rec['dev']['below_pct'] = rnd(100 * sum(1 for v in ref if v < dp['v']) / len(ref)); rec['dev']['vs'] = 'all'
        dm = dev_per_m2(phx, p['id'], 'EUR')
        if dm: rec['dev_m2'] = dm
        res[p['id']] = rec
    return res, period


NYC_SALES = 'https://data.cityofnewyork.us/resource/usep-8jbt.json'
PLUTO = 'https://data.cityofnewyork.us/resource/64uk-42ks.json'
BORO = {'MN': '1', 'BX': '2', 'BK': '3', 'QN': '4', 'SI': '5'}


def nyc(ps, phx):
    pins = [p for p in ps if p['co'] == 'USA' and p['mk'] == 'New York']
    res = {}
    for p in pins:
        dla, dln = 0.0095, 0.0095 / math.cos(math.radians(p['lat']))
        w = 'latitude between %f and %f and longitude between %f and %f' % (p['lat'] - dla, p['lat'] + dla, p['lng'] - dln, p['lng'] + dln)
        lots = get_json(PLUTO + '?' + urllib.parse.urlencode({'$select': 'borough,block,latitude,longitude', '$where': w, '$limit': 50000}), timeout=120, tries=8)
        blocks = set()
        for l in lots:
            la, ln = num(l.get('latitude')), num(l.get('longitude'))
            if la is None: continue
            if dist(p['lat'], p['lng'], la, ln) <= R: blocks.add((BORO.get(l['borough'], l['borough']), str(int(float(l['block'])))))
        print('NYC', p['id'], 'lots', len(lots), 'blocks', len(blocks), flush=True)
        rows = []
        by_b = {}
        for b, bl in blocks: by_b.setdefault(b, []).append(bl)
        for b, bls in by_b.items():
            for i in range(0, len(bls), 150):
                chunk = bls[i:i + 150]
                w = "borough='%s' and block in(%s)" % (b, ','.join("'%s'" % x for x in chunk))
                rows += get_json(NYC_SALES + '?' + urllib.parse.urlencode({'$select': 'building_class_category,sale_price,sale_date,gross_square_feet,residential_units,commercial_units,block,lot', '$where': w, '$limit': 50000}), timeout=120, tries=8)
        sales = []
        for r in rows:
            v = money(r.get('sale_price'))
            cat = (r.get('building_class_category') or '').upper()
            if not v or v < 10000: continue                      # NYC DOF: $0 and nominal amounts are transfers, not sales
            res_units = num((r.get('residential_units') or '0').replace(',', '')) or 0
            kind = 'condo' if 'CONDO' in cat and 'COOP' not in cat else 'coop' if 'COOP' in cat else 'home' if re.match(r'0[123] ', cat) else None
            if not kind: continue
            if kind != 'home' and res_units > 1: continue        # whole-building sales are left out
            g = num((r.get('gross_square_feet') or '').replace(',', ''))
            sales.append((v, r['sale_date'][:10], kind, g if kind == 'home' and g and g > 200 else None))
        rec = {'reg': 'nyc', 'cur': 'USD', 'blocks': len(blocks), 'all': stats([s[0] for s in sales]),
               'condo': stats([s[0] for s in sales if s[2] == 'condo']), 'coop': stats([s[0] for s in sales if s[2] == 'coop']),
               'home': stats([s[0] for s in sales if s[2] == 'home']), 'home_m2': stats([s[0] / (s[3] * 0.09290304) for s in sales if s[3]]),
               'from': min([s[1] for s in sales], default=None), 'to': max([s[1] for s in sales], default=None)}
        dp = dev_price(phx, p['id'], 'USD')
        if dp:
            rec['dev'] = dp
            ref = [s[0] for s in sales if s[2] == 'condo']
            if len(ref) >= MIN_N: rec['dev']['below_pct'] = rnd(100 * sum(1 for v in ref if v < dp['v']) / len(ref)); rec['dev']['vs'] = 'condo'
        res[p['id']] = rec
        time.sleep(1)
    return res


def sold(args):
    ps = projects(args.only)
    phx = site_json('price-history.json')
    y = datetime.date.today().year
    fpi = {'ppd': [head_lm(PPD % yy) for yy in (y - 1, y)], 'dvf': [head_lm(DVF % (yy, '06')) for yy in (y - 2, y - 1)], 'pins': sorted((p['id'], p['lat'], p['lng']) for p in ps)}
    try: fpi['nyc'] = get_json('https://data.cityofnewyork.us/api/views/usep-8jbt.json', tries=3).get('rowsUpdatedAt')
    except Exception: fpi['nyc'] = 'err'
    fp = json.dumps(fpi, sort_keys=True)
    if 'err' in fp or unchanged(args, 'sales-nearby.json', fp):
        if 'err' not in fp: return
    out = {'v': 1, 'updated': datetime.date.today().isoformat(), 'radius_m': R, 'min_n': MIN_N, 'inputs_fp': fp,
           'registers': {
               'hmlr': {'name': 'HM Land Registry, Price Paid Data (England and Wales)', 'url': 'https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads',
                        'licence': 'Open Government Licence v3.0', 'licence_url': 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
                        'credit': 'Contains HM Land Registry data © Crown copyright and database right 2026. This data is licensed under the Open Government Licence v3.0.',
                        'geo': {'name': 'postcodes.io (ONS Postcode Directory, OS data)', 'url': 'https://postcodes.io/', 'licence': 'Open Government Licence v3.0; contains OS data © Crown copyright and database right 2026, Royal Mail data © Royal Mail copyright and database right 2026'},
                        'rule': 'Standard price paid sales (category A) whose postcode centre is within 1 km of the pin. The register does not publish floor area, so there is no price per m².', 'years': [y - 1, y]},
               'dvf': {'name': 'Demandes de valeurs foncières (DVF), geolocated by Etalab', 'url': 'https://www.data.gouv.fr/fr/datasets/demandes-de-valeurs-foncieres-geolocalisees/',
                       'licence': 'Licence Ouverte 2.0', 'licence_url': 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/',
                       'credit': 'Source: DGFiP, Demandes de valeurs foncières, geolocated by Etalab (data.gouv.fr), Licence Ouverte 2.0.',
                       'rule': 'Sales (vente, and vente en l\'état futur d\'achèvement for off-plan) of exactly one flat or house, within 1 km of the pin. Price per m² uses the built floor area the register publishes (surface réelle bâtie).', 'years': [y - 2, y - 1]},
               'nyc': {'name': 'NYC Department of Finance, Citywide Rolling Calendar Sales (NYC Open Data)', 'url': 'https://data.cityofnewyork.us/City-Government/NYC-Citywide-Rolling-Calendar-Sales/usep-8jbt',
                       'licence': 'NYC Open Data, free to use (NYC Open Data Terms of Use)', 'licence_url': 'https://www.nyc.gov/home/terms-of-use.page',
                       'geo': {'name': 'MapPLUTO lot centres (NYC Department of City Planning, NYC Open Data)', 'url': 'https://data.cityofnewyork.us/City-Government/Primary-Land-Use-Tax-Lot-Output-PLUTO-/64uk-42ks'},
                       'credit': 'Source: NYC Department of Finance rolling sales and NYC Department of City Planning MapPLUTO, NYC Open Data.',
                       'rule': 'Sales of single condo and co-op units and one- to three-family homes in tax blocks with a lot within 1 km of the pin, last 12 months. Sales under USD 10,000 are transfers and left out. Price per m² only for homes, from the gross floor area the register publishes; condo sales carry no floor area.'}},
           'method': ['Medians and quartiles only, never single sales, and only when at least 10 sales stand behind a figure.',
                      'Developer price: the latest headline price printed on the developer page we track (Prices over time), in the same currency as the register. We never convert currencies. A headline "from" price is usually the cheapest unit.',
                      'Share of recorded sales below the developer price is a position in the local distribution, not a valuation.',
                      'The pin is about 100 m accurate. Within 1 km a city can mix very different streets and building ages.'],
           'not_covered': {'Dubai and other UAE': 'Dubai Land Department publishes sales by area, not by location; see the market comparison on /prices/.',
                           'Ireland': 'The Residential Property Price Register publishes addresses without coordinates; not located yet.',
                           'Scotland': 'Registers of Scotland does not publish individual sale prices as free open data.',
                           'Spain': 'Spain publishes notarial and registry statistics as aggregates, not per sale.',
                           'Other markets': 'No official per-sale open register with locations that we have found and confirmed.'},
           'projects': {}}
    periods = {}
    if not args.skip or 'hmlr' not in args.skip:
        r, per = england(ps, phx, [y - 1, y]); out['projects'].update(r); periods['hmlr'] = per
    if not args.skip or 'dvf' not in args.skip:
        r, per = france(ps, phx, [y - 2, y - 1]); out['projects'].update(r); periods['dvf'] = per
    if not args.skip or 'nyc' not in args.skip:
        try: out['projects'].update(nyc(ps, phx))
        except Exception as e: print('NYC error', e)
    for k, v in periods.items(): out['registers'][k]['period'] = v
    out['summary'] = {'pins': len(ps), 'covered': len(out['projects']), 'with_sales': sum(1 for r in out['projects'].values() if (r.get('all') or {}).get('p50'))}
    json.dump(out, open(args.out, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(json.dumps(out['summary']))


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('what', choices=['shortlet', 'sold'])
    ap.add_argument('out')
    ap.add_argument('--only', default='')
    ap.add_argument('--skip', default='')
    ap.add_argument('--site', default='')
    ap.add_argument('--force', action='store_true')
    a = ap.parse_args()
    a.only = set(x for x in a.only.split(',') if x)
    a.skip = set(x for x in a.skip.split(',') if x)
    if a.site: SITE = a.site
    (shortlet if a.what == 'shortlet' else sold)(a)
