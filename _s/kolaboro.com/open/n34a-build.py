#!/usr/bin/env python3
"""kolaboro.com batch 34 (n34a, 21 Nov 2026): data and verification engine, built from files already published on kolaboro.com.

  python3 n34a-build.py <site data dir: _s/kolaboro.com/data> [--boundaries <market-boundaries.json>] [--check]

Reads only published files (named.json, the dated snapshots in /data/snapshots/, page-history-*.json, image-reuse.json,
delay-index.json, source-health.json, evidence.json, register-changes.json) and writes:
  data/n34a/history/<00-31>.json + index.json   every dated version of each project record with a JSON diff   (/api/v1/projects/<id>/history)
  data/n34a/track-record.json                   per developer, a dated series of what was promised and what happened     (/developers/track-record/)
  data/n34a/duplicates.json                     lookalike projects: same image, same page text, same pin, same website  (/watch/duplicates/)
  data/n34a/intervals.json                      bootstrap 95% intervals for market statistics, with sample sizes         (/numbers/intervals/)
  data/n34a/pins.json                           pin against address and market boundary (OSM), flags                     (/engineering/data-quality/pins/)
  data/kolaboro-pins.geojson, data/kolaboro-projects.jsonld, data/kolaboro.sqlite, data/formats.json                          (/data/formats/)
  data/n34a/build.json                          inputs and outputs with SHA-256: run with --check to rebuild and compare     (/engineering/reproducible/)
Deterministic: fixed random seed, sorted keys, no clock (the build date is the date of the newest input). Python 3.8+, stdlib only.
"""
import gzip, hashlib, json, math, os, random, re, sqlite3, sys, zlib
from collections import Counter, defaultdict

ARGS = sys.argv[1:]
def opt(k, d=None):
    if k in ARGS:
        i = ARGS.index(k); v = ARGS[i + 1]; del ARGS[i:i + 2]; return v
    return d
CHECK = '--check' in ARGS
if CHECK: ARGS.remove('--check')
BOUND = opt('--boundaries')
OUT_ARG = opt('--out')
D = os.path.abspath(ARGS[0] if ARGS else '_s/kolaboro.com/data')
if CHECK and not OUT_ARG:
    import tempfile; OUT_ARG = tempfile.mkdtemp(prefix='n34a-check-')
OUTD = os.path.abspath(OUT_ARG or D)
O = os.path.join(OUTD, 'n34a')
def rj(p, default=None):
    p = os.path.join(D, p)
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else default
def sha_file(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
def canon(o): return json.dumps(o, sort_keys=True, ensure_ascii=False, separators=(',', ':'))
OUTS = {}
def wj(rel, o, root=None):
    p = os.path.join(root or O, rel); os.makedirs(os.path.dirname(p), exist_ok=True)
    b = canon(o).encode('utf-8'); open(p, 'wb').write(b)
    OUTS[os.path.relpath(p, OUTD).replace(os.sep, '/')] = hashlib.sha256(b).hexdigest()
    return len(b)

named = rj('named.json'); LIVE = {p['id']: p for p in named['projects']}
SKIP_MK = {'Sumba'}
INPUTS = {'named.json': sha_file(os.path.join(D, 'named.json'))}

# ------------------------------------------------------------------------------------------------ versions (snapshots + live)
idx = rj('snapshots/index.json')
VERS = []   # (day, file sha256, {id: record})
for e in idx['entries']:
    p = os.path.join(D, e['copy'].replace('/data/', '', 1))
    b = gzip.open(p).read()
    assert hashlib.sha256(b).hexdigest() == e['sha256'], 'snapshot copy does not match its index: ' + e['day']
    VERS.append((e['day'], e['sha256'], {x['id']: x for x in json.loads(b)['projects']}))
    INPUTS['snapshots/' + e['day']] = e['sha256']
if INPUTS['named.json'] != VERS[-1][1]:
    VERS.append((named.get('updated') or 'live', INPUTS['named.json'], LIVE))
BUILT = max(v[0] for v in VERS if re.match(r'\d{4}-\d\d-\d\d$', v[0]))

def diff(a, b, path=''):
    """JSON diff in RFC 6902 form (op, path, value) plus "old" for replaced and removed values; list items compare as whole items."""
    ops = []
    if isinstance(a, dict) and isinstance(b, dict):
        for k in sorted(set(a) | set(b)):
            pk = path + '/' + str(k).replace('~', '~0').replace('/', '~1')
            if k not in a: ops.append({'op': 'add', 'path': pk, 'value': b[k]})
            elif k not in b: ops.append({'op': 'remove', 'path': pk, 'old': a[k]})
            elif a[k] != b[k]: ops += diff(a[k], b[k], pk)
        return ops
    if isinstance(a, list) and isinstance(b, list) and (len(a) > 3 or len(b) > 3 or any(isinstance(x, (list, dict)) for x in a + b)):
        sa, sb = [canon(x) for x in a], [canon(x) for x in b]
        cb = Counter(sb)
        for i in range(len(a) - 1, -1, -1):
            if cb[sa[i]]: cb[sa[i]] -= 1
            else: ops.append({'op': 'remove', 'path': path + '/' + str(i), 'old': a[i]})
        ca = Counter(sa)
        for j, x in enumerate(b):
            if ca[sb[j]]: ca[sb[j]] -= 1
            else: ops.append({'op': 'add', 'path': path + '/-', 'value': x})
        return ops
    return [{'op': 'replace', 'path': path or '/', 'old': a, 'value': b}]

def shard(i): return zlib.crc32(i.encode()) % 32
HIST = defaultdict(dict)
nver = Counter()
for pid in sorted(LIVE):
    rows, prev = [], None
    for day, fsha, recs in VERS:
        r = recs.get(pid)
        if r is None: continue
        h = hashlib.sha256(canon(r).encode('utf-8')).hexdigest()
        if prev is None: rows.append({'d': day, 'file': fsha, 'sha': h, 'base': r}); prev = (r, h); continue
        if h == prev[1]: continue
        rows.append({'d': day, 'file': fsha, 'sha': h, 'ops': diff(prev[0], r)}); prev = (r, h)
    nver[len(rows)] += 1
    HIST[shard(pid)][pid] = rows
for s in range(32): wj('history/%02d.json' % s, {'v': 'n34a-history-1', 'shard': s, 'p': HIST.get(s, {})})
wj('history/index.json', {'v': 'n34a-history-1', 'built': BUILT, 'shards': 32, 'shard_rule': 'CRC-32 (zlib) of the Kolaboro ID, mod 32',
    'record_hash': 'SHA-256 of the record as JSON with sorted keys, no spaces, UTF-8', 'diff': 'RFC 6902 operations (op, path, value); "old" holds the value replaced or removed; list items of claims, sources and facts compare as whole items',
    'versions_from': [{'d': d, 'file_sha256': f, 'kind': 'live' if f == INPUTS['named.json'] and d == VERS[-1][0] and len(VERS) > len(idx['entries']) else 'snapshot'} for d, f, _ in VERS],
    'records': len(LIVE), 'versions_per_record': {str(k): v for k, v in sorted(nver.items())},
    'slugs': {p['s']: p['id'] for p in named['projects']}})

# ------------------------------------------------------------------------------------------------ 1. developer track record over time
def hmonth(h):
    """first month of a promised handover written as YYYY, YYYY-Qn, YYYY-MM or YYYY-Hn: an index in months, or None"""
    m = re.match(r'(\d{4})(?:-(Q[1-4]|H[12]|\d{2}))?', str(h or ''))
    if not m: return None
    y, s = int(m.group(1)), m.group(2)
    if not s: mo = 12
    elif s[0] == 'Q': mo = int(s[1]) * 3
    elif s[0] == 'H': mo = int(s[1]) * 6
    else: mo = int(s)
    return y * 12 + mo - 1
def done(r): return 'complet' in str(r.get('st') or '').lower() or str(r.get('sts')) == 'completed'
TR = defaultdict(lambda: {'days': {}, 'ev': []})
for k, (day, fsha, recs) in enumerate(VERS):
    dm = int(day[:4]) * 12 + int(day[5:7]) - 1 if re.match(r'\d{4}-\d\d', day) else None
    by = defaultdict(list)
    for r in recs.values():
        if r.get('mk') in SKIP_MK or not r.get('dvs'): continue
        by[r['dvs']].append(r)
    prev = VERS[k - 1][2] if k else {}
    for dv, rs in by.items():
        c = Counter()
        for r in rs:
            fx = r.get('fx') or {}; c['p'] += 1
            hm = hmonth(fx.get('handover_promised'))
            if hm is not None:
                c['ho'] += 1
                if dm is not None and hm < dm and not done(r): c['past'] += 1
            if done(r): c['done'] += 1
            if r.get('pn'): c['pn'] += 1
            oh = hmonth(fx.get('original_handover'))
            if oh is not None and hm is not None and hm > oh: c['mv'] += 1
            for cl in r.get('cl') or []: c['c_' + str(cl[1])[:1]] += 1
            o = prev.get(r['id'])
            if not k: continue
            if o is None: TR[dv]['ev'].append([day, 'add', r['s'], '']); continue
            a, b = hmonth((o.get('fx') or {}).get('handover_promised')), hm
            if a is not None and b is not None and a != b: TR[dv]['ev'].append([day, 'later' if b > a else 'earlier', r['s'], '%s>%s' % ((o.get('fx') or {}).get('handover_promised'), fx.get('handover_promised'))])
            if not o.get('pn') and r.get('pn'): TR[dv]['ev'].append([day, 'permit', r['s'], ''])
            if not done(o) and done(r): TR[dv]['ev'].append([day, 'done', r['s'], ''])
            oc = {cl[0]: cl[1] for cl in o.get('cl') or []}
            for cl in r.get('cl') or []:
                if cl[1] == 'contradicted' and oc.get(cl[0]) != 'contradicted': TR[dv]['ev'].append([day, 'contra', r['s'], cl[0][:140]])
                if cl[1] == 'verified' and oc.get(cl[0]) not in (None, 'verified'): TR[dv]['ev'].append([day, 'verif', r['s'], cl[0][:140]])
        TR[dv]['days'][day] = [c['p'], c['ho'], c['past'], c['done'], c['pn'], c['c_v'], c['c_c'], c['c_u'], c['mv']]
names = {}
for r in named['projects']: names.setdefault(r['dvs'], r['dv'])
devs = {}
evk = Counter()
for dv, v in TR.items():
    if dv not in names: continue
    days = sorted(v['days'])
    devs[dv] = {'n': names[dv], 'days': [[d] + v['days'][d] for d in days], 'ev': sorted(v['ev'])}
    for e in v['ev']: evk[e[1]] += 1
multi = sum(1 for x in devs.values() if len(x['days']) >= 2)
withev = sum(1 for x in devs.values() if any(e[1] != 'add' for e in x['ev']))
top = sorted(devs, key=lambda s: (-(sum(1 for e in devs[s]['ev'] if e[1] != 'add') + devs[s]['days'][-1][9] + devs[s]['days'][-1][7]), -devs[s]['days'][-1][1], s))[:60]
totals = Counter()
for x in devs.values():
    for j, k in enumerate(['p', 'ho', 'past', 'done', 'pn', 'cv', 'cx', 'cu', 'mv']): totals[k] += x['days'][-1][j + 1]
wj('track-record.json', {'v': 'n34a-track-1', 'built': BUILT, 'licence': 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)',
    'columns': ['day', 'projects', 'with_promised_handover', 'promised_date_passed_not_completed', 'completed', 'with_permit_number', 'claims_verified', 'claims_contradicted', 'claims_unverified', 'handover_later_than_first_promised'],
    'events': {'add': 'project added to our records', 'later': 'promised handover moved later', 'earlier': 'promised handover moved earlier', 'permit': 'permit or registration number found', 'done': 'marked completed', 'contra': 'a claim marked contradicted by a record', 'verif': 'a claim marked verified by a record'},
    'versions': [v[0] for v in VERS], 'sample': {'latest': dict(totals), 'developers': len(devs), 'with_two_or_more_days': multi, 'with_events': withev, 'events': dict(sorted(evk.items()))},
    'top': top, 'd': devs})

# ------------------------------------------------------------------------------------------------ 5. duplicate and lookalike projects
P = [r for r in named['projects'] if r.get('mk') not in SKIP_MK]
byid = {r['id']: r for r in P}
pairs = {}
def addp(a, b, sig, val, src):
    if a == b or a not in byid or b not in byid: return
    if a > b: a, b = b, a
    k = (a, b); x = pairs.setdefault(k, {'a': a, 'b': b, 's': {}})
    x['s'][sig] = {'v': val, 'src': src}
ir = rj('image-reuse.json', {'pairs': []})
for pr in ir.get('pairs', []): addp(pr['a'], pr['b'], 'image', len(pr['m']), '/data/image-reuse.json')
PH = {}
for i in range(3):
    h = rj('page-history-%d.json' % i, {}) or {}
    for pid, v in (h.get('projects') or {}).items():
        last = v['v'][-1]; PH[pid] = (v['url'], ' '.join(v['seg'][j] for j in last['ix']), last['d'])
def shingles(t):
    w = re.findall(r'[^\W_]+', t.lower())
    return set(zlib.crc32(' '.join(w[i:i + 6]).encode()) for i in range(max(0, len(w) - 5)))
SH = {pid: shingles(t) for pid, (u, t, d) in PH.items()}
# shingles printed on many pages (menus, footers of one website builder) do not count
df = Counter(x for s in SH.values() for x in s)
SH = {k: set(x for x in s if df[x] <= 3) for k, s in SH.items()}
ids = sorted(k for k in SH if len(SH[k]) >= 40 and k in byid)
post = defaultdict(list)
for k in ids:
    for x in SH[k]: post[x].append(k)
inter = Counter()
for v in post.values():                                       # every kept shingle is on 3 pages at most, so this is cheap
    v = sorted(v)
    for i, a in enumerate(v):
        for b in v[i + 1:]: inter[(a, b)] += 1
for (a, b), n in sorted(inter.items()):
    j = n / float(len(SH[a]) + len(SH[b]) - n)
    if j >= 0.5 and PH[a][0] != PH[b][0]: addp(a, b, 'text', round(j, 2), [PH[a][0], PH[b][0]])
for a in sorted(byid):
    pass
pins = defaultdict(list)
for r in P:
    fx = r.get('fx') or {}
    if fx.get('lat') is not None and fx.get('lng') is not None: pins[(round(fx['lat'], 4), round(fx['lng'], 4))].append(r['id'])
for k, v in pins.items():
    for i, a in enumerate(v):
        for b in v[i + 1:]: addp(a, b, 'pin', '%s,%s' % k, None)
urls = defaultdict(list)
for r in P:
    u = re.sub(r'[#?].*$', '', str(r.get('url') or '')).rstrip('/').lower()
    if u and u.count('/') >= 3: urls[u].append(r['id'])
for u, v in urls.items():
    if len(v) != 2: continue                                  # a URL shared by 3 or more records is a list page (permits, news), not a project page
    for i, a in enumerate(v):
        for b in v[i + 1:]: addp(a, b, 'url', u, None)
def hostn(u): return re.sub(r'^www\.', '', re.sub(r'^https?://([^/]+).*$', r'\1', str(u or '').lower()))
def nm(s): return re.sub(r'[^a-z0-9]', '', s.lower())
out = []
for (a, b), x in sorted(pairs.items()):
    ra, rb = byid[a], byid[b]
    if nm(ra['n']) == nm(rb['n']) and ra['dvs'] == rb['dvs'] and list(x['s']) == ['pin']: continue   # same name, same developer, same pin: phases of one site
    x.update({'na': ra['n'], 'nb': rb['n'], 'sa': ra['s'], 'sb': rb['s'], 'ma': ra['mk'], 'mb': rb['mk'], 'da': ra['dv'], 'db': rb['dv'],
              'ua': ra.get('url'), 'ub': rb.get('url'), 'same_dev': ra['dvs'] == rb['dvs'], 'same_host': hostn(ra.get('url')) == hostn(rb.get('url')), 'cross_market': ra['mk'] != rb['mk'], 'same_name': nm(ra['n']) == nm(rb['n'])})
    x['k'] = len(x['s'])
    out.append(x)
out.sort(key=lambda x: (-x['k'], x['same_dev'], x['same_host'], not x['cross_market'], x['na']))
wj('duplicates.json', {'v': 'n34a-dup-1', 'built': BUILT, 'licence': 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)',
    'signals': {'image': 'the same image (perceptual hash, /data/image-reuse.json) on both projects', 'text': 'developer page text: share of rare 6-word shingles in common (Jaccard), at least 0.5',
                'pin': 'the same pin to 4 decimals (about 11 m)', 'url': 'the same official page URL'},
    'compared': {'projects': len(P), 'with_page_text': len(ids), 'with_pin': sum(len(v) for v in pins.values()), 'image_pairs_input': len(ir.get('pairs', []))},
    'counts': {'pairs': len(out), 'cross_market': sum(1 for x in out if x['cross_market']), 'different_developer': sum(1 for x in out if not x['same_dev']), 'two_or_more_signals': sum(1 for x in out if x['k'] >= 2)},
    'pairs': out})

# ------------------------------------------------------------------------------------------------ 6. bootstrap intervals
R = random.Random(34)
B = 2000
def q(a, p):
    a = sorted(a); n = len(a)
    if n == 1: return a[0]
    h = (n - 1) * p; i = int(math.floor(h)); return a[i] + (a[min(i + 1, n - 1)] - a[i]) * (h - i)
def med(a): return q(a, 0.5)
def boot(a, f=med):
    n = len(a); s = sorted(f([a[R.randrange(n)] for _ in range(n)]) for _ in range(B))
    return [round(q(s, 0.025), 2), round(q(s, 0.975), 2)]
def wilson(k, n, z=1.959964):
    if not n: return None
    p = k / n; d = 1 + z * z / n; c = p + z * z / (2 * n); r = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return [max(0.0, round(100 * (c - r) / d, 1)) + 0.0, min(100.0, round(100 * (c + r) / d, 1)) + 0.0]
di = rj('delay-index.json')
IV = {'delay': [], 'ppm': []}
for m in [di['all_markets']] + di['markets']:
    lm = m.get('late_months') or []
    row = {'mk': m['market'], 'tracked': m['tracked'], 'with_date': m['with_date'], 'past_first': m['past_first'], 'share_past_first': m['share_past_first'], 'share_ci': wilson(m['past_first'], m['with_date']),
           'n_late': len(lm), 'median_late': m.get('median_late'), 'median_ci': boot(lm) if len(lm) >= di['rules']['min_sample'] else None}
    if m['market'] in SKIP_MK: continue
    IV['delay'].append(row)
def reg_sale(x):
    fx = x.get('fx') or {}; pm = fx.get('price_min')
    if not pm: return False
    rx = re.compile(r'^Latest registered home sales listed on the page \((\d+), ([^)]*?) to ([^)]*?)\): (AED) ([\d,]+) to AED ([\d,]+)')
    for t in [c[0] for c in (x.get('cl') or [])] + list(x.get('dl') or []):
        mm = rx.match(str(t or ''))
        if mm and float(mm.group(5).replace(',', '')) == float(pm): return True
    return False
G = defaultdict(list)
for r in P:
    fx = r.get('fx') or {}
    try: p, s = float(fx.get('price_min') or 0), float(fx.get('size_min_m2') or 0)
    except Exception: continue
    if p > 0 and 15 <= s <= 5000 and fx.get('currency') and not reg_sale(r): G[(r['mk'], str(fx['currency']).upper())].append(p / s)
for (mk, cur), a in sorted(G.items()):
    if len(a) < 5: continue
    IV['ppm'].append({'mk': mk, 'cur': cur, 'n': len(a), 'median': round(med(a)), 'ci': [round(x) for x in boot(a)]})
wj('intervals.json', {'v': 'n34a-iv-1', 'built': BUILT, 'licence': 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)',
    'method': {'bootstrap': 'percentile bootstrap, %d resamples with replacement, fixed seed 34, 2.5%% and 97.5%% quantiles (type 7)' % B,
               'share': 'Wilson score interval, 95%', 'delay_input': '/data/delay-index.json (months late per project past its first handover, as on /delays/)',
               'ppm_input': '/data/named.json: lowest published price / smallest unit size, 15-5,000 m2, registered sales left out, same currency, 5 or more projects (as on project and market pages)',
               'min_sample': di['rules']['min_sample']},
    'delay_as_of': di.get('as_of_month'), 'delay': IV['delay'], 'ppm': IV['ppm']})

# ------------------------------------------------------------------------------------------------ 9. pins against address and market boundary
bd = json.load(open(BOUND)) if BOUND and os.path.exists(BOUND) else rj('n34a/boundaries.json', {'m': {}})
def inpoly(lat, lng, poly):
    """poly: GeoJSON Polygon or MultiPolygon coordinates; even-odd rule"""
    def ring(rg):
        c = False; j = len(rg) - 1
        for i in range(len(rg)):
            xi, yi = rg[i]; xj, yj = rg[j]
            if (yi > lat) != (yj > lat) and lng < (xj - xi) * (lat - yi) / ((yj - yi) or 1e-12) + xi: c = not c
            j = i
        return c
    if poly['type'] == 'Polygon': polys = [poly['coordinates']]
    else: polys = poly['coordinates']
    for pg in polys:
        if ring(pg[0]) and not any(ring(h) for h in pg[1:]): return True
    return False
def edge_km(lat, lng, poly):
    """shortest distance in km from a point to the edges of a Polygon or MultiPolygon (equirectangular, fine at these scales)"""
    polys = [poly['coordinates']] if poly['type'] == 'Polygon' else poly['coordinates']
    kx = 111.32 * math.cos(lat * math.pi / 180); ky = 110.57; best = 1e9
    for pg in polys:
        for rg in pg:
            for i in range(len(rg) - 1):
                x1, y1 = (rg[i][0] - lng) * kx, (rg[i][1] - lat) * ky; x2, y2 = (rg[i + 1][0] - lng) * kx, (rg[i + 1][1] - lat) * ky
                dx, dy = x2 - x1, y2 - y1; L = dx * dx + dy * dy
                t = 0 if L == 0 else max(0, min(1, -(x1 * dx + y1 * dy) / L))
                best = min(best, math.hypot(x1 + t * dx, y1 + t * dy))
    return best
def km(a, b, c, d):
    r = math.pi / 180; x = (d - b) * r * math.cos((a + c) / 2 * r); y = (c - a) * r; return 6371 * math.hypot(x, y)
pin_rows = []
fl = Counter()
dupl = {k: v for k, v in pins.items() if len(v) > 1}
for r in P:
    fx = r.get('fx') or {}
    if fx.get('lat') is None or fx.get('lng') is None: continue
    lat, lng = float(fx['lat']), float(fx['lng']); f = []
    if not (-90 <= lat <= 90 and -180 <= lng <= 180): f.append('range')
    b = (bd.get('m') or {}).get(r['mk'])
    adm = bool(b and b.get('geo') and b.get('kind') == 'boundary/administrative')
    dout = None
    if adm and not inpoly(lat, lng, b['geo']):
        dout = round(edge_km(lat, lng, b['geo']), 1)
        if dout > 3: f.append('outside')
    a = (bd.get('a') or {}).get(r['mk'] + '|' + str(r.get('ar') or ''))
    da = None
    if a and a.get('c') and re.match(r'(place|boundary)/', a.get('type') or '') and (not adm or inpoly(a['c'][0], a['c'][1], b['geo'])):
        da = round(km(lat, lng, a['c'][0], a['c'][1]), 1)
        if da > max(15.0, a.get('r', 0) * 1.5): f.append('far_area')
    if b and b.get('c') and km(lat, lng, b['c'][0], b['c'][1]) < 0.05: f.append('centroid')
    k = (round(lat, 4), round(lng, 4))
    if k in dupl and len(set(byid[i]['n'] for i in dupl[k] if i in byid)) > 1: f.append('shared')
    for x in f: fl[x] += 1
    pin_rows.append({'id': r['id'], 's': r['s'], 'n': r['n'], 'mk': r['mk'], 'ar': r.get('ar'), 'lat': lat, 'lng': lng, 'b': adm, 'da': da, 'do': dout, 'f': f})
wj('pins.json', {'v': 'n34a-pins-1', 'built': BUILT, 'licence': 'CC BY 4.0 (credit: Kolaboro, kolaboro.com); boundaries (c) OpenStreetMap contributors, ODbL',
    'flags': {'outside': 'pin more than 3 km outside the administrative boundary of the market (OpenStreetMap); markets named after a city use the city limits, so a suburb can be outside', 'far_area': 'pin more than 15 km (or 1.5 times the area radius) from the centre of the place named in the address (only places and boundaries found inside the market)',
              'centroid': 'pin within 50 m of the centre of the market: probably a default point, not the site', 'shared': 'the same pin is used by projects with different names', 'range': 'latitude or longitude out of range'},
    'boundaries': {'source': bd.get('source'), 'read': bd.get('read'), 'markets': len([1 for v in (bd.get('m') or {}).values() if v.get('geo') and v.get('kind') == 'boundary/administrative']), 'areas': len(bd.get('a') or {})},
    'counts': dict(sorted(fl.items())), 'pins': len(pin_rows), 'with_boundary': sum(1 for x in pin_rows if x['b']), 'flagged': sum(1 for x in pin_rows if x['f']), 'p': pin_rows})

# ------------------------------------------------------------------------------------------------ 10. open data formats
FMT = []
ver = named.get('version', '') + '+' + (named.get('updated') or '')
feats = []
for r in sorted(P, key=lambda r: r['id']):
    fx = r.get('fx') or {}
    if fx.get('lat') is None or fx.get('lng') is None: continue
    feats.append({'type': 'Feature', 'id': r['id'], 'geometry': {'type': 'Point', 'coordinates': [round(float(fx['lng']), 6), round(float(fx['lat']), 6)]},
                  'properties': {'id': r['id'], 'name': r['n'], 'developer': r['dv'], 'market': r['mk'], 'country': r['co'], 'area': r.get('ar'), 'status': r.get('st'),
                                 'handover_promised': fx.get('handover_promised'), 'permit_number': r.get('pn'), 'url': 'https://kolaboro.com/projects/' + r['s'] + '/'}})
gj = {'type': 'FeatureCollection', 'name': 'kolaboro-pins', 'version': ver, 'licence': 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)', 'features': feats}
def wfile(name, b, kind, media, rows):
    p = os.path.join(OUTD, name); open(p, 'wb').write(b)
    h = hashlib.sha256(b).hexdigest(); OUTS[name] = h
    FMT.append({'path': '/data/' + name, 'format': kind, 'media_type': media, 'bytes': len(b), 'sha256': h, 'rows': rows, 'version': ver})
wfile('kolaboro-pins.geojson', canon(gj).encode('utf-8'), 'GeoJSON (RFC 7946)', 'application/geo+json', len(feats))
graph = [{'@type': 'Dataset', '@id': 'https://kolaboro.com/data/#dataset', 'name': 'Kolaboro off-plan project records', 'version': ver, 'license': 'https://creativecommons.org/licenses/by/4.0/',
          'creator': {'@type': 'Organization', 'name': 'Kolaboro', 'url': 'https://kolaboro.com/'}, 'url': 'https://kolaboro.com/data/'}]
for r in sorted(P, key=lambda r: r['id']):
    fx = r.get('fx') or {}
    o = {'@type': 'Place', '@id': 'https://kolaboro.com/projects/' + r['s'] + '/#place', 'identifier': r['id'], 'name': r['n'], 'url': 'https://kolaboro.com/projects/' + r['s'] + '/',
         'address': {'@type': 'PostalAddress', 'addressLocality': r.get('ar') or r['mk'], 'addressRegion': r['mk'], 'addressCountry': r['co']}}
    if fx.get('lat') is not None and fx.get('lng') is not None: o['geo'] = {'@type': 'GeoCoordinates', 'latitude': fx['lat'], 'longitude': fx['lng']}
    props = [('developer', r['dv']), ('status', r.get('st')), ('handover_promised', fx.get('handover_promised')), ('permit_number', r.get('pn')), ('price_from', fx.get('price_min')), ('currency', fx.get('currency'))]
    o['additionalProperty'] = [{'@type': 'PropertyValue', 'name': k, 'value': v} for k, v in props if v not in (None, '')]
    o['subjectOf'] = {'@id': 'https://kolaboro.com/data/#dataset'}
    graph.append(o)
wfile('kolaboro-projects.jsonld', canon({'@context': 'https://schema.org', '@graph': graph}).encode('utf-8'), 'JSON-LD (schema.org)', 'application/ld+json', len(graph) - 1)
sq = os.path.join(OUTD, 'kolaboro.sqlite')
if os.path.exists(sq): os.remove(sq)
con = sqlite3.connect(sq)
con.executescript('''PRAGMA page_size=4096; PRAGMA journal_mode=OFF;
CREATE TABLE meta(key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE projects(id TEXT PRIMARY KEY, slug TEXT UNIQUE, name TEXT, developer TEXT, developer_slug TEXT, market TEXT, country TEXT, area TEXT, status TEXT,
  official_url TEXT, permit_number TEXT, handover_promised TEXT, price_min REAL, price_max REAL, currency TEXT, size_min_m2 REAL, size_max_m2 REAL,
  lat REAL, lng REAL, added TEXT, reviewed TEXT, record_sha256 TEXT);
CREATE TABLE claims(project_id TEXT, n INTEGER, claim TEXT, status TEXT, checked_against TEXT, source_url TEXT, PRIMARY KEY(project_id, n));
CREATE TABLE sources(project_id TEXT, url TEXT);
CREATE TABLE versions(project_id TEXT, day TEXT, record_sha256 TEXT, snapshot_sha256 TEXT, changes INTEGER);
CREATE INDEX claims_status ON claims(status); CREATE INDEX projects_market ON projects(market); CREATE INDEX versions_p ON versions(project_id);''')
for r in sorted(P, key=lambda r: r['id']):
    fx = r.get('fx') or {}
    def num(v):
        try: return float(v) if v not in (None, '') else None
        except Exception: return None
    con.execute('INSERT INTO projects VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', (r['id'], r['s'], r['n'], r['dv'], r['dvs'], r['mk'], r['co'], r.get('ar'), r.get('st'), r.get('url'), r.get('pn'),
                str(fx.get('handover_promised')) if fx.get('handover_promised') is not None else None, num(fx.get('price_min')), num(fx.get('price_max')), fx.get('currency'), num(fx.get('size_min_m2')), num(fx.get('size_max_m2')),
                num(fx.get('lat')), num(fx.get('lng')), r.get('ad'), (r.get('rvw') or {}).get('d'), hashlib.sha256(canon(r).encode('utf-8')).hexdigest()))
    for i, c in enumerate(r.get('cl') or []): con.execute('INSERT INTO claims VALUES (?,?,?,?,?,?)', (r['id'], i, c[0], c[1], c[2] if len(c) > 2 else None, c[3] if len(c) > 3 else None))
    for u in r.get('src') or []: con.execute('INSERT INTO sources VALUES (?,?)', (r['id'], u))
    for v in HIST[shard(r['id'])].get(r['id'], []): con.execute('INSERT INTO versions VALUES (?,?,?,?,?)', (r['id'], v['d'], v['sha'], v['file'], len(v.get('ops') or [])))
for k, v in [('name', 'Kolaboro off-plan project records'), ('version', ver), ('licence', 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)'), ('source', '/data/named.json'), ('source_sha256', INPUTS['named.json'])]: con.execute('INSERT INTO meta VALUES (?,?)', (k, v))
con.commit(); con.execute('VACUUM'); con.close()
b = open(sq, 'rb').read(); os.remove(sq)
wfile('kolaboro.sqlite', b, 'SQLite 3', 'application/vnd.sqlite3', len(P))
wj('formats.json', {'v': 'n34a-formats-1', 'built': BUILT, 'source': {'file': '/data/named.json', 'sha256': INPUTS['named.json'], 'version': ver}, 'files': FMT,
    'other': [['/data/named.json', 'JSON'], ['/data/kolaboro.parquet', 'Parquet'], ['/data/sql/', 'SQL in the browser'], ['/data/snapshots/', 'dated copies']]}, root=OUTD)

# ------------------------------------------------------------------------------------------------ 7. build record
for f in ['source-health.json', 'evidence.json', 'register-changes.json', 'image-reuse.json', 'delay-index.json', 'n34a/boundaries.json', 'page-history-0.json', 'page-history-1.json', 'page-history-2.json']:
    p = os.path.join(D, f)
    if os.path.exists(p): INPUTS[f] = sha_file(p)
rec = {'v': 'n34a-build-1', 'built': BUILT, 'command': 'python3 n34a-build.py _s/kolaboro.com/data --check', 'python': 'any 3.8+, standard library only',
       'inputs': dict(sorted(INPUTS.items())), 'outputs': dict(sorted(OUTS.items())),
       'outputs_sha256': hashlib.sha256(canon(dict(sorted(OUTS.items()))).encode()).hexdigest()}
if CHECK:
    pub = rj('n34a/build.json')
    if not pub: sys.exit('no published build.json to compare with')
    bad = [k for k in pub['outputs'] if OUTS.get(k) != pub['outputs'][k]]
    inp = [k for k in pub['inputs'] if INPUTS.get(k) != pub['inputs'][k]]
    print('inputs that differ from the published build:', inp or 'none')
    print('outputs that differ:', bad or 'none'); print('outputs_sha256', rec['outputs_sha256'], 'published', pub['outputs_sha256'])
    sys.exit(1 if bad else 0)
wj('build.json', rec)
print('versions', [v[0] for v in VERS], 'records', len(LIVE), 'devs', len(devs), 'dup pairs', len(out), 'pins', len(pin_rows), 'flagged', sum(1 for x in pin_rows if x['f']))
print('outputs_sha256', rec['outputs_sha256'])
