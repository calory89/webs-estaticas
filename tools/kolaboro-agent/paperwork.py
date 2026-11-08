#!/usr/bin/env python3
"""Kolaboro batch 18 (n18d): paperwork that protects buyers. No model calls, no paid services.

  python3 paperwork.py prices   <named.json> <page-history-dir> <previous price-history.json or -> <out.json>
  python3 paperwork.py planning <named.json> <previous planning.json or -> <out.json>

prices: the prices printed on the page we track for each named project, over time. Two kinds of dated copies:
  1. our own sealed copies (data/page-history-<k>.json, the exact archived text whose SHA-256 names it), and
  2. Internet Archive (Wayback Machine) captures of the same address since 2017, found with the public CDX API.
  Internet Archive is read politely: one CDX query per address, at most a few captures per address, a pause between
  requests, a hard budget per run, and we stop on the first 429. Results are kept between runs, so the archive is read once.
  A price is a currency sign or code next to an amount, exactly as printed. Per-square-metre amounts and rents are labelled
  and left out of the headline. The headline of a copy is the first price printed after a word such as "from", "price" or
  "starting" (in 8 languages), else the first price printed. Currency stays as printed; nothing is converted.

planning: official planning and building-permit records near projects with a reliable pin (3+ decimals, about 100 m):
  - England: planning.data.gov.uk (Department for Levelling Up / MHCLG, Open Government Licence v3.0), datasets
    planning-application and brownfield-land, within 200 m of the pin.
  - New York City: DOB NOW Build job application filings (NYC Department of Buildings via NYC Open Data, public), within ~200 m:
    new buildings, and other filings with an estimated cost of USD 1 million or more.
  - Miami: City of Miami building permits since 2014 (ArcGIS open data, public), within 200 m, permits with a total cost of
    USD 1 million or more. (The Miami-Dade County permit table has no map location, so it cannot be searched by distance.)
  No personal data: applicant, owner and contractor names, phone numbers and e-mails are never copied.
"""
import gzip, html, io, json, math, re, sys, time, urllib.parse, urllib.request

UA = 'kolaboro.com paperwork bot (+https://kolaboro.com/data-policy/; buyer due diligence, one request at a time)'


def get(url, timeout=40, tries=3, accept='*/*'):
    last = None
    for i in range(tries):
        try:
            rq = urllib.request.Request(url, headers={'user-agent': UA, 'accept': accept, 'accept-encoding': 'gzip'})
            with urllib.request.urlopen(rq, timeout=timeout) as r:
                b = r.read(6_000_000)
                if r.headers.get('content-encoding') == 'gzip':
                    b = gzip.decompress(b)
                return r.status, b, r.headers
        except urllib.error.HTTPError as e:
            if e.code in (404, 410, 400, 403):
                return e.code, b'', e.headers
            last = e
            if e.code == 429:
                return 429, b'', e.headers
        except Exception as e:  # noqa
            last = e
        time.sleep(3 + 4 * i)
    print('  fail', url[:140], repr(last)[:120], file=sys.stderr)
    return 0, b'', {}


def jget(url, **k):
    st, b, _ = get(url, accept='application/json', **k)
    if st != 200:
        return None
    try:
        return json.loads(b.decode('utf-8', 'replace'))
    except Exception:
        return None


def load(path):
    if not path or path == '-':
        return None
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return None


def no_sumba(p):
    return not re.search(r'sumba', ' '.join(str(p.get(k) or '') for k in ('mk', 'ar', 'n', 'id')), re.I)


# ------------------------------------------------------------------------------------------------ price extraction
SYM = r'US\$|USD|EUR|GBP|AED|THB|IDR|MXN|MYR|TRY|SAR|OMR|EGP|QAR|BHD|CAD|AUD|NZD|PHP|VND|JPY|INR|LKR|CRC|DOP|COP|PAB|MUR|GEL|BRL|ZAR|CHF|KES|MAD|R\$|RM|Rp\.?|\$|€|£|฿|₺|¥|₹|₱|₫|₩'
NUM = r'\d{1,3}(?:[.,\s  ]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d+)?'
MULT = r'(?:\s?(?:k|K|thousand|mil|m|M|mn|mln|million|millones|millions|Mio\.?|млн|B|bn|billion|billones|miliar|milyar|juta|jt|tỷ|lakh|crore))?'
RX_PRE = re.compile(r'(?<![A-Za-z])(' + SYM + r')\s?(' + NUM + r')(' + MULT + r')(?![A-Za-z0-9])(\s?(?:USD|MXN|CAD|AUD|NZD|SGD))?')
RX_POST = re.compile(r'(?<![\d.,])(' + NUM + r')(' + MULT + r')\s?(USD|EUR|GBP|AED|THB|IDR|MXN|MYR|TRY|SAR|OMR|EGP|€|£|฿|₺)(?![A-Za-z])')
CODE = {'US$': 'USD', '$': 'USD', '€': 'EUR', '£': 'GBP', '฿': 'THB', '₺': 'TRY', '¥': 'JPY', '₹': 'INR', '₱': 'PHP', '₫': 'VND', '₩': 'KRW', 'R$': 'BRL', 'RM': 'MYR', 'Rp': 'IDR', 'Rp.': 'IDR'}
MULV = {'k': 1e3, 'thousand': 1e3, 'm': 1e6, 'mn': 1e6, 'mln': 1e6, 'million': 1e6, 'millones': 1e6, 'millions': 1e6, 'mio': 1e6, 'mio.': 1e6, 'млн': 1e6, 'mil': 1e3,
        'b': 1e9, 'bn': 1e9, 'billion': 1e9, 'billones': 1e12, 'miliar': 1e9, 'milyar': 1e9, 'juta': 1e6, 'jt': 1e6, 'tỷ': 1e9, 'lakh': 1e5, 'crore': 1e7}
HEAD = re.compile(r'(?:from|starting|start(?:s|ing)? at|prices? (?:from|start)|price|priced|launch price|desde|a partir de|precio|precios|à partir de|dès|prix|ab |preis|vanaf|prijs|от|цена|起|售价|价格|ابتداء|يبدأ|بسعر|mulai|harga|เริ่มต้น|ราคา)\W{0,12}$', re.I)
PER = re.compile(r'^\s?(?:/|per\s|a\s|por\s|pro\s)?\s?(?:m2|m²|sqm|sq\.?\s?m|sq\.?\s?ft|sqft|ft²|ft2|square|m\b|month|mo\b|mes|mois|monat|night|noche|year|yr|año|week|/)', re.I)
RENT = re.compile(r'\brent|rental|alquiler|\bmiete|\bhuur|аренд|per month|/month|/mo\b|per night|a month|al mes|par mois', re.I)


def amount(num, mult):
    s = num.replace(' ', ' ').replace(' ', ' ').strip()
    if re.fullmatch(r'\d{1,3}(?:[ ]\d{3})+(?:[.,]\d{1,2})?', s):
        s = s.replace(' ', '')
    if re.fullmatch(r'\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?', s):
        v = float(s.replace(',', ''))
    elif re.fullmatch(r'\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?', s):
        v = float(s.replace('.', '').replace(',', '.'))
    elif re.fullmatch(r'\d+[.,]\d+', s):
        v = float(s.replace(',', '.'))
    elif re.fullmatch(r'\d+', s):
        v = float(s)
    else:
        return None
    m = (mult or '').strip().lower()
    if m:
        if m == 'm' and v >= 1000:
            return None  # "500 m" is a distance, not millions
        v *= MULV.get(m, MULV.get(m.rstrip('.'), 1))
    return v


# rough lower bounds per currency for a unit price (anything smaller is a fee, a deposit or a per-m2 figure)
LOW = {'IDR': 2e8, 'VND': 5e8, 'THB': 3e5, 'PHP': 5e5, 'INR': 1e6, 'LKR': 2e6, 'JPY': 5e6, 'KRW': 5e7, 'CRC': 1e7, 'COP': 5e7, 'DOP': 1e6, 'MXN': 3e5, 'TRY': 3e5,
       'EGP': 3e5, 'MUR': 1e6, 'BRL': 5e4, 'AED': 1e5, 'SAR': 1e5, 'QAR': 1e5, 'MYR': 5e4, 'ZAR': 2e5, 'KES': 1e6, 'MAD': 2e5, 'GEL': 3e4}


def prices(text, limit=8):
    t = re.sub(r'\s+', ' ', text)
    found = []
    for rx, pre in ((RX_PRE, True), (RX_POST, False)):
        for m in rx.finditer(t):
            if pre:
                sym, num, mult, suf = m.group(1), m.group(2), m.group(3), m.group(4)
                cur = (suf or '').strip() or CODE.get(sym, sym)
                if sym in ('$', 'US$') and suf:
                    cur = suf.strip()
            else:
                num, mult, sym = m.group(1), m.group(2), m.group(3)
                cur = CODE.get(sym, sym)
            v = amount(num, mult)
            if v is None or v <= 0:
                continue
            a, b = m.start(), m.end()
            before, after = t[max(0, a - 40):a], t[b:b + 30]
            kind = 'price'
            if PER.match(after) or re.search(r'(?:m2|m²|sqm|sq\.?\s?ft|per\s?m)\W{0,3}$', before, re.I):
                kind = 'per_m2' if re.match(r'^\s?(?:/|per\s|a\s|por\s|pro\s)?\s?(?:m2|m²|sqm|sq|ft|square|m\b)', after, re.I) or re.search(r'(?:m2|m²|sqm|sq\.?\s?ft|per\s?m)\W{0,3}$', before, re.I) else 'rent'
            elif RENT.search(before[-28:]) or RENT.search(after[:16]):
                kind = 'rent'
            elif v < LOW.get(cur, 2e4):
                kind = 'small'
            found.append({'a': a, 'cur': cur, 'v': round(v, 2), 'p': t[a:b].strip(), 'k': kind, 'h': bool(HEAD.search(before)),
                          'c': (before[-34:].lstrip() + '[' + t[a:b].strip() + ']' + after[:24].rstrip())})
    found.sort(key=lambda x: x['a'])
    seen, out = set(), []
    for f in found:  # drop overlaps (pre and post patterns matching the same amount)
        if any(abs(f['a'] - o['a']) < 3 for o in out):
            continue
        out.append(f)
    head = next((f for f in out if f['k'] == 'price' and f['h']), None) or next((f for f in out if f['k'] == 'price'), None)
    uniq = []
    for f in out:
        key = (f['cur'], f['v'], f['k'])
        if key in seen:
            continue
        seen.add(key)
        uniq.append({'cur': f['cur'], 'v': f['v'], 'p': f['p'], 'k': f['k'], 'c': f['c']})
    return (dict(cur=head['cur'], v=head['v'], p=head['p'], c=head['c']) if head else None), uniq[:limit], sum(1 for f in out if f['k'] == 'price')


def html_text(b):
    s = b.decode('utf-8', 'replace')
    s = re.sub(r'(?is)<(script|style|noscript|svg|template)\b.*?</\1>', ' ', s)
    s = re.sub(r'(?s)<!--.*?-->', ' ', s)
    s = re.sub(r'(?i)<br\s*/?>|</(p|div|li|h\d|tr|td|section)>', ' ', s)
    s = re.sub(r'<[^>]+>', ' ', s)
    return re.sub(r'\s+', ' ', html.unescape(s)).strip()


def ia_captures(url, max_n):
    q = 'https://web.archive.org/cdx/search/cdx?' + urllib.parse.urlencode(
        {'url': url, 'output': 'json', 'fl': 'timestamp,statuscode,mimetype,digest', 'filter': 'statuscode:200', 'from': '2017', 'collapse': 'digest', 'limit': '400'})
    st, b, _ = get(q, timeout=60, tries=2, accept='application/json')
    if st == 429:
        return 'rate'
    if st != 200:
        return None
    try:
        rows = json.loads(b.decode() or '[]')[1:]
    except Exception:
        return None
    rows = [r for r in rows if 'html' in (r[2] or '')]
    if not rows:
        return []
    # spread the picks over time: newest, oldest, and evenly between
    if len(rows) <= max_n:
        return [r[0] for r in rows]
    idx = sorted(set(round(i * (len(rows) - 1) / (max_n - 1)) for i in range(max_n)))
    return [rows[i][0] for i in idx]


def build_prices(named_p, ph_dir, prev_p, out_p, budget=int(sys.argv[6]) if len(sys.argv) > 6 else 360, per=6, minutes=24):
    named = load(named_p)
    prev = load(prev_p) or {}
    P = [p for p in named['projects'] if no_sumba(p)]
    hist = {}
    for k in range(3):
        d = load('%s/page-history-%d.json' % (ph_dir, k)) or {}
        hist.update(d.get('projects') or {})
    old = (prev.get('projects') or {})
    t0, fetched, rate = time.time(), 0, False
    out = {}
    order = sorted(P, key=lambda p: (len((old.get(p['id']) or {}).get('ia_seen') or []) > 0, p['id']))  # addresses never read first
    for p in order:
        id_ = p['id']
        h = hist.get(id_)
        url = (h or {}).get('url') or p.get('url')
        rec = {'url': url, 'pts': [], 'ia_seen': list((old.get(id_) or {}).get('ia_seen') or []), 'ia_cdx': (old.get(id_) or {}).get('ia_cdx')}
        if (old.get(id_) or {}).get('url') not in (None, url):
            rec['ia_seen'], rec['ia_cdx'] = [], None
        # 1. our sealed copies
        if h:
            for v in h['v']:
                text = ''.join(h['seg'][i] for i in v['ix'])
                head, allp, n = prices(text)
                rec['pts'].append({'d': v['d'], 'src': 'copy', 'ref': v['sha'], 'head': head, 'all': allp, 'n': n})
        # 2. Internet Archive (kept from earlier runs, new captures read within the budget)
        kept = [x for x in (old.get(id_) or {}).get('pts') or [] if x.get('src') == 'ia' and (old.get(id_) or {}).get('url') == url]
        rec['pts'].extend(kept)
        if url and url.startswith('http') and not rate and fetched < budget and time.time() - t0 < minutes * 60 and rec['ia_cdx'] is None:
            caps = ia_captures(url, per)
            fetched += 1
            time.sleep(1.5)
            if caps == 'rate':
                rate = True
                print('  Internet Archive asked us to slow down (429); stopping for this run', file=sys.stderr)
            elif caps is not None:
                rec['ia_cdx'] = time.strftime('%Y-%m-%d', time.gmtime())
                for ts in caps:
                    if ts in rec['ia_seen'] or fetched >= budget or time.time() - t0 > minutes * 60:
                        continue
                    st, b, _ = get('https://web.archive.org/web/%sid_/%s' % (ts, url), timeout=60, tries=2, accept='text/html')
                    fetched += 1
                    time.sleep(1.5)
                    if st == 429:
                        rate = True
                        break
                    if st != 200:
                        continue
                    rec['ia_seen'].append(ts)
                    head, allp, n = prices(html_text(b))
                    rec['pts'].append({'d': '%s-%s-%s' % (ts[:4], ts[4:6], ts[6:8]), 'src': 'ia', 'ref': ts, 'head': head, 'all': allp, 'n': n})
        rec['pts'].sort(key=lambda x: (x['d'], x['src']))
        rec['n_prices'] = sum(1 for x in rec['pts'] if x.get('head'))
        out[id_] = rec
    doc = {'version': 'price-history-1', 'updated': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
           'what': 'Prices printed on the page we track for each named project, by date of the copy: our sealed copies (SHA-256) and Internet Archive captures since 2017. Currency as printed, nothing converted.',
           'rules': ['A price is a currency sign or code next to an amount, exactly as printed on the page.',
                     'Headline of a copy: the first price printed after a word such as "from", "price" or "starting" (8 languages); otherwise the first price printed.',
                     'Amounts per square metre or square foot, rents and yields, and amounts too small to be a unit price (fees, deposits) are kept in the list with a label and never used as the headline.',
                     'Portal pages can show prices of other projects next to this one; each price keeps a short snippet of the text around it so you can see what it refers to.',
                     'Internet Archive is read politely: one CDX query per address, at most %d captures per address, %.1f s between requests, a budget of %d requests per run, stop on the first 429.' % (per, 1.5, budget)],
           'sources': {'copy': {'name': 'Kolaboro sealed copies of the page text', 'url': 'https://kolaboro.com/projects/{slug}/changes/{sha}.txt'},
                       'ia': {'name': 'Internet Archive, Wayback Machine', 'url': 'https://web.archive.org/web/{ts}/{url}', 'terms': 'https://archive.org/about/terms.php'}},
           'run': {'requests_to_archive': fetched, 'stopped_by_rate_limit': rate},
           'projects': out}
    with open(out_p, 'w') as f:
        json.dump(doc, f, ensure_ascii=False, separators=(',', ':'))
    n_with = sum(1 for r in out.values() if r['n_prices'])
    n_ia = sum(1 for r in out.values() for x in r['pts'] if x['src'] == 'ia')
    print('prices: %d projects, %d with a printed price, %d archive copies, %d archive requests this run, rate=%s' % (len(out), n_with, n_ia, fetched, rate))


# ------------------------------------------------------------------------------------------------ planning
R = 6371008.8


def dist(a, b, c, d):
    p1, p2 = math.radians(a), math.radians(c)
    h = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(d - b) / 2) ** 2
    return round(2 * R * math.asin(min(1, math.sqrt(h))))


def decs(v):
    s = repr(float(v))
    return len(s.split('.')[1]) if '.' in s else 0


def reliable(p):
    fx = p.get('fx') or {}
    la, ln = fx.get('lat'), fx.get('lng')
    if not isinstance(la, (int, float)) or not isinstance(ln, (int, float)):
        return None
    if min(decs(la), decs(ln)) < 3:
        return None
    return la, ln


SCRUB = re.compile(r'[\w.+-]+@[\w-]+\.[\w.]+|\+?\d[\d ()-]{8,}\d')


def clean(s, n=200):
    s = re.sub(r'\s+', ' ', str(s or '')).strip()
    s = SCRUB.sub('[removed]', s)
    return (s[:n - 1] + '…') if len(s) > n else s


def cref(s, n=60):
    s = re.sub(r'\s+', ' ', str(s or '')).strip()
    return s[:n]


def circle_wkt(la, ln, r=200, k=24):
    pts = []
    for i in range(k + 1):
        t = 2 * math.pi * i / k
        dla = (r * math.cos(t)) / 111320
        dln = (r * math.sin(t)) / (111320 * math.cos(math.radians(la)))
        pts.append('%.6f %.6f' % (ln + dln, la + dla))
    return 'POLYGON((' + ','.join(pts) + '))'


def pt_of(o):
    g = o.get('point') or ''
    m = re.match(r'POINT\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)', g)
    return (float(m.group(2)), float(m.group(1))) if m else None


UK_FAIL = [0]


def uk(la, ln):
    items, errs = [], []
    if UK_FAIL[0] >= 2:
        return items, ['planning-application', 'brownfield-land']
    for ds in ('planning-application', 'brownfield-land'):
        q = 'https://www.planning.data.gov.uk/entity.json?' + urllib.parse.urlencode({'dataset': ds, 'geometry': circle_wkt(la, ln), 'geometry_relation': 'intersects', 'limit': '100'})
        d = jget(q, timeout=60, tries=2)
        time.sleep(1)
        if d is None:
            errs.append(ds)
            UK_FAIL[0] += 1
            continue
        UK_FAIL[0] = 0
        ents = d.get('entities') or []
        if ents:
            print('   sample', ds, json.dumps({k: v for k, v in ents[0].items() if k not in ('geometry',)})[:600])
        for e in ents:
            pt = pt_of(e)
            it = {'kind': ds, 'ref': cref(e.get('reference')), 'name': clean(e.get('name'), 120), 'desc': clean(e.get('description') or e.get('notes'), 220),
                  'status': clean(e.get('planning-decision') or e.get('status') or e.get('planning-permission-status') or e.get('planning-application-status'), 60),
                  'd_in': e.get('start-date') or e.get('entry-date') or None, 'd_dec': e.get('decision-date') or e.get('planning-permission-date') or None,
                  'dist_m': dist(la, ln, pt[0], pt[1]) if pt else None, 'units': e.get('net-dwellings-range-to') or e.get('maximum-net-dwellings') or None,
                  'url': 'https://www.planning.data.gov.uk/entity/%s' % e.get('entity'), 'more': e.get('documentation-url') or e.get('planning-application-url') or None}
            items.append(it)
    return items, errs


def nyc(la, ln):
    dla, dln = 200 / 111320, 200 / (111320 * math.cos(math.radians(la)))
    w = "latitude::number between %.6f and %.6f and longitude::number between %.6f and %.6f" % (la - dla, la + dla, ln - dln, ln + dln)
    sel = 'job_filing_number,filing_status,house_no,street_name,borough,job_type,filing_date,first_permit_date,current_status_date,proposed_dwelling_units,initial_cost,latitude,longitude'
    q = 'https://data.cityofnewyork.us/resource/w9ak-ipjd.json?' + urllib.parse.urlencode({'$where': w, '$select': sel, '$order': 'filing_date DESC', '$limit': '2000'})
    d = jget(q, timeout=90)
    if d is None:
        return [], ['dob-now']
    items, seen = [], set()
    for r in d:
        try:
            cost = float(str(r.get('initial_cost') or '0').replace('$', '').replace(',', ''))
        except Exception:
            cost = 0
        nb = (r.get('job_type') or '') == 'New Building'
        if not nb and cost < 1e6:
            continue
        job = (r.get('job_filing_number') or '').split('-')[0]
        if job in seen:
            continue
        seen.add(job)
        try:
            dm = dist(la, ln, float(r['latitude']), float(r['longitude']))
        except Exception:
            dm = None
        if dm is not None and dm > 200:
            continue
        items.append({'kind': 'nyc-dob-now', 'ref': job, 'name': clean('%s %s, %s' % (r.get('house_no') or '', r.get('street_name') or '', r.get('borough') or ''), 120),
                      'desc': clean(r.get('job_type'), 60) + (' · %s dwelling units proposed' % r['proposed_dwelling_units'] if r.get('proposed_dwelling_units') not in (None, '', '0') else ''),
                      'status': clean(r.get('filing_status'), 60), 'd_in': (r.get('filing_date') or '')[:10] or None, 'd_dec': (r.get('first_permit_date') or '')[:10] or None,
                      'd_st': (r.get('current_status_date') or '')[:10] or None, 'cost': cost or None, 'cur': 'USD', 'dist_m': dm,
                      'url': 'https://data.cityofnewyork.us/resource/w9ak-ipjd.json?job_filing_number=' + urllib.parse.quote(r.get('job_filing_number') or '')})
    items.sort(key=lambda x: (x['desc'].startswith('New Building') is False, -(int((x['d_in'] or '0000').replace('-', '')[:8] or 0))))
    return items[:15], []


MIAMI = [('city-of-miami', 'https://services1.arcgis.com/CvuPhqcTQpZPT9qY/arcgis/rest/services/Building_Permits_Since_2014/FeatureServer/0',
          'City of Miami building permits since 2014', 'PermitNumber', 'ScopeofWork', 'BuildingPermitStatusDescription', 'PlanCreatedDate', 'IssuedDate', 'TotalCost', 'DeliveryAddress')]


def arcgis(la, ln, base):
    q = base + '/query?' + urllib.parse.urlencode({'geometry': '%f,%f' % (ln, la), 'geometryType': 'esriGeometryPoint', 'inSR': '4326', 'outSR': '4326', 'distance': '200', 'units': 'esriSRUnit_Meter',
                                                   'spatialRel': 'esriSpatialRelIntersects', 'outFields': '*', 'returnGeometry': 'true', 'resultRecordCount': '2000', 'f': 'json'})
    return jget(q, timeout=90)


MD_FIELDS = None


def miami(la, ln):
    global MD_FIELDS
    items, errs = [], []
    for key, base, label, f_ref, f_desc, f_st, f_in, f_dec, f_cost, f_addr in MIAMI:
        d = arcgis(la, ln, base)
        time.sleep(1)
        if not d or 'features' not in d:
            errs.append(key)
            continue
        feats = d['features']
        if key == 'miami-dade':
            if feats and MD_FIELDS is None:
                MD_FIELDS = sorted(feats[0]['attributes'].keys())
                print('   miami-dade fields', MD_FIELDS)
            pick = lambda a, *ks: next((a[k] for k in ks if k in a and a[k] not in (None, '')), None)
        for f in feats:
            a, g = f.get('attributes') or {}, f.get('geometry') or {}
            if key == 'city-of-miami':
                ref, desc, st, din, ddec, cost, addr = a.get(f_ref), a.get(f_desc), a.get(f_st), a.get(f_in), a.get(f_dec), a.get(f_cost), a.get(f_addr)
            else:
                ref = pick(a, 'PERMITNUMBER', 'PermitNumber', 'PERMIT_NUMBER', 'PROCNUM', 'ProcessNumber')
                desc = pick(a, 'DESC1', 'DESCRIPTION', 'WorkDescription', 'PROPUSE', 'ApplicationTypeDescription', 'TYPE')
                st = pick(a, 'STATUS', 'PermitStatus', 'STATUS_DESC')
                din = pick(a, 'APPLDATE', 'ApplicationDate', 'APPL_DATE')
                ddec = pick(a, 'ISSUDATE', 'IssueDate', 'ISSUED_DATE', 'ISSUEDDATE')
                cost = pick(a, 'ESTVALUE', 'EstimatedValue', 'EST_VALUE', 'VALUE')
                addr = pick(a, 'ADDRESS', 'STNDADDR', 'PropertyAddress', 'SITEADDR')
            try:
                c = float(str(cost or '0').replace('$', '').replace(',', ''))
            except Exception:
                c = 0
            if c < 1e6:
                continue
            ms = lambda v: time.strftime('%Y-%m-%d', time.gmtime(v / 1000)) if isinstance(v, (int, float)) and v > 0 else (str(v)[:10] if v else None)
            dm = dist(la, ln, g['y'], g['x']) if 'x' in g and 'y' in g else None
            items.append({'kind': key, 'ref': cref(ref), 'name': clean(addr, 120), 'desc': clean(desc, 220), 'status': clean(st, 60), 'd_in': ms(din), 'd_dec': ms(ddec),
                          'cost': c, 'cur': 'USD', 'dist_m': dm, 'url': base.rsplit('/FeatureServer', 1)[0] + '/FeatureServer/0/query?where=' + urllib.parse.quote("%s='%s'" % (f_ref or 'PERMITNUMBER', str(ref).replace("'", ''))) + '&outFields=*&f=html'})
    items.sort(key=lambda x: -(int((x['d_dec'] or x['d_in'] or '0000').replace('-', '')[:8] or 0)))
    return items[:15], errs


def build_planning(named_p, prev_p, out_p):
    named = load(named_p)
    prev = load(prev_p) or {}
    out, cov = {}, {'uk': 0, 'nyc': 0, 'miami': 0}
    for p in named['projects']:
        if not no_sumba(p):
            continue
        pin = reliable(p)
        if not pin:
            continue
        la, ln = pin
        co, mk = p.get('co'), (p.get('mk') or '')
        src = None
        if co == 'United Kingdom':
            if not (49.8 < la < 55.82 and -6.5 < ln < 1.8) or re.search(r'glasgow|edinburgh|aberdeen|dundee|scotland|wales|cardiff|belfast', mk + ' ' + (p.get('ar') or ''), re.I):
                out[p['id']] = {'pin': [la, ln], 'src': 'none', 'note': 'outside_england'}
                continue
            src, (items, errs) = 'uk', uk(la, ln)
        elif co == 'USA' and re.search(r'new york', mk, re.I):
            src, (items, errs) = 'nyc', nyc(la, ln)
        elif co == 'USA' and re.search(r'miami', mk, re.I):
            src, (items, errs) = 'miami', miami(la, ln)
        else:
            continue
        cov[src] += 1
        rec = {'pin': [la, ln], 'radius_m': 200, 'src': src, 'checked': time.strftime('%Y-%m-%d', time.gmtime()), 'items': items, 'errors': errs}
        if errs and (prev.get('projects') or {}).get(p['id'], {}).get('items') and not items:
            o = prev['projects'][p['id']]
            rec['items'], rec['checked'], rec['stale'] = o['items'], o.get('checked'), True   # keep the last good answer, say when it was
        out[p['id']] = rec
        print(' ', p['id'], src, len(rec['items']), 'errors=' + ','.join(errs) if errs else '')
    doc = {'version': 'planning-1', 'updated': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'coverage': cov,
           'sources': {
               'uk': {'name': 'planning.data.gov.uk (Ministry of Housing, Communities and Local Government), datasets planning-application and brownfield-land', 'url': 'https://www.planning.data.gov.uk/',
                      'licence': 'Open Government Licence v3.0', 'licence_url': 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/', 'covers': 'England, only councils that publish to the platform',
                      'rule': 'Every record whose location intersects a 200 m circle around the pin.'},
               'nyc': {'name': 'NYC Department of Buildings, DOB NOW: Build job application filings (NYC Open Data, dataset w9ak-ipjd)', 'url': 'https://data.cityofnewyork.us/Housing-Development/DOB-NOW-Build-Job-Application-Filings/w9ak-ipjd',
                       'licence': 'NYC Open Data terms of use (public data, no key)', 'licence_url': 'https://opendata.cityofnewyork.us/overview/#termsofuse', 'covers': 'New York City, DOB NOW filings',
                       'rule': 'Within about 200 m of the pin: new-building filings, and other filings with an estimated cost of USD 1 million or more. Newest 15.'},
               'miami': {'name': 'City of Miami, Building Permits Since 2014 (City of Miami open data, ArcGIS)', 'url': 'https://datahub-miamigis.opendata.arcgis.com/',
                         'licence': 'Public records published as open data by the City of Miami', 'licence_url': 'https://datahub-miamigis.opendata.arcgis.com/', 'covers': 'City of Miami only (not other municipalities in Miami-Dade County)',
                         'rule': 'Within 200 m of the pin, permits with a total cost of USD 1 million or more. Newest 15.'}},
           'not_covered': 'Scotland, Wales and Northern Ireland have their own planning portals without a national open API. For other markets we know of no free official planning API without a key; we link the official register where we have one.',
           'privacy': 'Names, phone numbers and e-mail addresses of applicants, owners, agents and contractors are never copied.',
           'projects': out}
    with open(out_p, 'w') as f:
        json.dump(doc, f, ensure_ascii=False, separators=(',', ':'))
    print('planning:', cov, sum(len(r.get('items') or []) for r in out.values()), 'records')


if __name__ == '__main__':
    if sys.argv[1] == 'prices':
        build_prices(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5])
    elif sys.argv[1] == 'planning':
        build_planning(sys.argv[2], sys.argv[3], sys.argv[4])
    elif sys.argv[1] == 'test':
        print(prices(sys.argv[2]))
