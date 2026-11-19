#!/usr/bin/env python3
"""kolaboro.com batch 32 (n32x): build the static data files behind ten engineering features.
Reads only published files under _s/kolaboro.com/data/ (no network, no model calls). Usage: build.py <site-dir> [<repo-dir>]
Writes: data/sql/* (Parquet, CSV, data card), data/claims-index.json, data/anomalies.json, data/entity-graph.json,
data/website-changes.json, data/construction-index.json, data/provenance.json"""
import json, sys, os, re, hashlib, math, statistics, collections, unicodedata, difflib, subprocess, datetime

SITE = sys.argv[1]; REPO = sys.argv[2] if len(sys.argv) > 2 else None
D = os.path.join(SITE, 'data')
TODAY = '2026-11-19'
def J(p): return json.load(open(os.path.join(D, p)))
def W(p, o, indent=None):
    os.makedirs(os.path.dirname(os.path.join(D, p)), exist_ok=True)
    s = json.dumps(o, ensure_ascii=False, separators=(',', ':') if indent is None else None, indent=indent)
    open(os.path.join(D, p), 'w').write(s); return len(s.encode())
def sha_file(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()

NAMED_PATH = os.path.join(D, 'named.json')
named = J('named.json'); P = named['projects']
NAMED_SHA = sha_file(NAMED_PATH); NAMED_DAY = named['updated']
COI = re.compile(r'eco\s*beach\s*city|\bequinox\b|\bsumba\b', re.I)
P = [p for p in P if not COI.search(' '.join(str(p.get(k) or '') for k in ('n', 'dv', 'mk', 'ar')))]
print('projects', len(P))

MON = {m: i + 1 for i, m in enumerate(['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'])}
def month_of(s):
    """'2027-Q2' -> 2027*12+6 (a quarter counts as its last month, a year as December); None when unreadable"""
    if not s: return None
    s = str(s).strip(); m = re.match(r'^(\d{4})-Q([1-4])', s)
    if m: return int(m.group(1)) * 12 + int(m.group(2)) * 3
    m = re.match(r'^(\d{4})-(\d{2})', s)
    if m and 1 <= int(m.group(2)) <= 12: return int(m.group(1)) * 12 + int(m.group(2))
    m = re.match(r'^([A-Za-z]+)\s+(\d{4})', s)
    if m and m.group(1).lower() in MON: return int(m.group(2)) * 12 + MON[m.group(1).lower()]
    m = re.match(r'^Q([1-4])\s+(\d{4})', s)
    if m: return int(m.group(2)) * 12 + int(m.group(1)) * 3
    m = re.match(r'^(\d{4})\b', s)
    if m and 1990 < int(m.group(1)) < 2060: return int(m.group(1)) * 12 + 12
    return None
def ym(mi): return None if mi is None else '%04d-%02d' % ((mi - 1) // 12, (mi - 1) % 12 + 1)
NOW_M = 2026 * 12 + 11
def num(v):
    try: f = float(v); return f if math.isfinite(f) else None
    except Exception: return None

# ------------------------------------------------------------------------------------------------ 1. SQL dataset
def company(s):
    if not s: return None
    s = re.sub(r'\s*\([^)]*\)', '', str(s)).strip(' ;,.')
    return s[:160] or None
proj_rows, claim_rows = [], []
LV = {'registry': 'official register', 'independent': 'independent source', 'developer': 'developer', 'none': 'not checked'}
for p in P:
    fx = p.get('fx') or {}; dld = fx.get('dld') or {}; cl = p.get('cl') or []; rv = p.get('rvw') or {}
    pmin, pmax, smin, smax = num(fx.get('price_min')), num(fx.get('price_max')), num(fx.get('size_min_m2')), num(fx.get('size_max_m2'))
    ho = month_of(fx.get('handover_promised')); oh = month_of(fx.get('original_handover'))
    st = collections.Counter(c[1] for c in cl)
    proj_rows.append({
        'id': p['id'], 'slug': p['s'], 'name': p['n'], 'developer': p.get('dv'), 'developer_slug': p.get('dvs'),
        'market': p.get('mk'), 'country': p.get('co'), 'area': p.get('ar'), 'stage': p.get('st'), 'sales_status': p.get('sts'),
        'developer_page': p.get('url'), 'permit_number': p.get('pn'),
        'handover_on_record': fx.get('handover_promised'), 'handover_month': ym(ho), 'first_handover_on_record': fx.get('original_handover'),
        'first_handover_month': ym(oh), 'delay_months': num(fx.get('delay_months')), 'construction_start': fx.get('construction_start'),
        'price_min': pmin, 'price_max': pmax, 'currency': fx.get('currency'), 'size_min_m2': smin, 'size_max_m2': smax,
        'price_per_m2_min': round(pmin / smin, 1) if pmin and smin and smin >= 10 else None,
        'deposit_pct': num(fx.get('deposit_pct')), 'payment_plan': fx.get('payment_plan'), 'foreign_ownership': fx.get('foreign_ownership'),
        'permit_authority': fx.get('permit_authority'), 'registered_company': company(fx.get('developer_company')),
        'lat': num(fx.get('lat')), 'lng': num(fx.get('lng')),
        'dld_project_number': dld.get('no'), 'dld_status': dld.get('st'), 'dld_percent_built': num(dld.get('pct')), 'dld_inspection_date': dld.get('pd'),
        'dld_completion_date': dld.get('comp'), 'dld_units': num(dld.get('units')), 'escrow_bank': dld.get('bank'), 'dld_source': dld.get('src'),
        'claims': len(cl), 'claims_verified': st.get('verified', 0), 'claims_unverified': st.get('unverified', 0), 'claims_contradicted': st.get('contradicted', 0),
        'sources': len(p.get('src') or []), 'added': p.get('ad'), 'reviewed': bool(rv.get('ok')), 'review_date': rv.get('d'),
        'record_sha256': p.get('sha'), 'page': 'https://kolaboro.com/projects/' + p['s'] + '/'})
    for i, c in enumerate(cl):
        claim_rows.append({'project_id': p['id'], 'project_slug': p['s'], 'n': i + 1, 'claim': c[0], 'status': c[1], 'checked_against': LV.get(c[2], c[2]), 'source': c[3], 'read': rv.get('d') or p.get('ad')})
mk = collections.defaultdict(list)
for r in proj_rows: mk[(r['market'], r['country'])].append(r)
mk_rows = []
for (m, c), rs in sorted(mk.items(), key=lambda x: -len(x[1])):
    ppm = [r['price_per_m2_min'] for r in rs if r['price_per_m2_min']]
    mk_rows.append({'market': m, 'country': c, 'projects': len(rs), 'with_permit_number': sum(1 for r in rs if r['permit_number']),
                    'with_handover_date': sum(1 for r in rs if r['handover_month']), 'overdue': sum(1 for r in rs if r['handover_month'] and month_of(r['handover_month']) < NOW_M and r['stage'] != 'completed'),
                    'claims': sum(r['claims'] for r in rs), 'claims_contradicted': sum(r['claims_contradicted'] for r in rs), 'reviewed': sum(1 for r in rs if r['reviewed']),
                    'median_price_per_m2_min': round(statistics.median(ppm), 1) if len(ppm) >= 3 else None, 'price_per_m2_sample': len(ppm)})

def build_sql():
    import pyarrow as pa, pyarrow.parquet as pq, csv, io
    out = os.path.join(D, 'sql'); os.makedirs(out, exist_ok=True)
    DESC = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'n32x-columns.json')))
    files = []
    for name, rows, desc in [('projects', proj_rows, 'One row per tracked off-plan project'), ('claims', claim_rows, 'One row per developer claim and how it was checked'), ('markets', mk_rows, 'One row per market, computed from the projects table')]:
        cols = list(rows[0].keys())
        def kind(c):
            vs = [r[c] for r in rows if r[c] is not None]
            if vs and all(isinstance(v, bool) for v in vs): return pa.bool_()
            if vs and all(isinstance(v, (int, float)) and not isinstance(v, bool) for v in vs): return pa.int64() if all(isinstance(v, int) for v in vs) else pa.float64()
            return pa.string()
        sch = pa.schema([(c, kind(c)) for c in cols])
        for r in rows:
            for c in cols:
                if sch.field(c).type == pa.string() and r[c] is not None and not isinstance(r[c], str): r[c] = json.dumps(r[c], ensure_ascii=False) if isinstance(r[c], (list, dict)) else str(r[c])
        tbl = pa.Table.from_pylist(rows, schema=sch)
        pth = os.path.join(out, name + '.parquet')
        pq.write_table(tbl, pth, compression='zstd', use_dictionary=True, write_statistics=True)
        cp = os.path.join(out, name + '.csv')
        with open(cp, 'w', newline='') as f:
            w = csv.DictWriter(f, fieldnames=cols); w.writeheader()
            for r in rows: w.writerow({k: ('' if v is None else ('true' if v is True else 'false' if v is False else v)) for k, v in r.items()})
        files.append({'table': name, 'description': desc, 'rows': len(rows),
                      'parquet': {'path': '/data/sql/' + name + '.parquet', 'bytes': os.path.getsize(pth), 'sha256': sha_file(pth)},
                      'csv': {'path': '/data/sql/' + name + '.csv', 'bytes': os.path.getsize(cp), 'sha256': sha_file(cp)},
                      'columns': [{'name': c, 'type': str(tbl.schema.field(c).type), 'description': DESC.get(name, {}).get(c, DESC.get('*', {}).get(c, ''))} for c in cols]})
    card = {'name': 'Kolaboro open dataset', 'version': NAMED_DAY + '.1', 'built': TODAY, 'licence': 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)',
            'source': {'file': '/data/named.json', 'sha256': NAMED_SHA, 'published': NAMED_DAY, 'snapshots': '/data/snapshots/'},
            'what_it_is': 'What developers advertise about off-plan projects and what official registers and independent sources show, each claim with its source link. Advertised claims are not verified facts unless the claim status says so.',
            'not_included': 'Names of people, buyer reports, contact details, anything from the private research record. Sumba projects and projects of the site operator are left out.',
            'limits': 'Projects are the ones being marketed and found by our research; this is not a census of a market. Prices are the developer or portal asking price in the stated currency, not sale prices. Dates written as a quarter count as its last month, a year as December.',
            'build': 'Built from the published /data/named.json by /open/n32x-build.py (Python, pyarrow, no network). The same input gives the same rows; Parquet bytes can differ between pyarrow versions, so compare rows, not file hashes, across builds.',
            'files': files}
    W('sql/datacard.json', card, indent=1)
    return card
card = build_sql() if not os.environ.get("ONLY") else None
if card: print("sql", [(f['table'], f['rows'], f['parquet']['bytes'], f['csv']['bytes']) for f in card['files']])

# ------------------------------------------------------------------------------------------------ 2. claims index
def fold(s): return ''.join(c for c in unicodedata.normalize('NFKD', s.lower()) if not unicodedata.combining(c))
TOK = re.compile(r'[a-z0-9]+')
STOP = set('the a an of and or to in on for by with is are at as from be this that it its no not'.split())
def toks(s): return [t for t in TOK.findall(fold(s)) if (len(t) >= 2 or t.isdigit()) and t not in STOP]
def build_claims():
    projs, srcs, sidx, docs, post, ppost = [], [], {}, [], collections.defaultdict(list), collections.defaultdict(list)
    pidx = {}
    SL = {'verified': 0, 'unverified': 1, 'contradicted': 2}; LL = {'registry': 0, 'independent': 1, 'developer': 2, 'none': 3}
    for p in P:
        rv = p.get('rvw') or {}
        pidx[p['id']] = len(projs); projs.append([p['s'], p['n'], p.get('mk') or '', (rv.get('d') or p.get('ad') or '')[:10]])
        for c in p.get('cl') or []:
            u = c[3] or ''
            if u not in sidx: sidx[u] = len(srcs); srcs.append(u)
            i = len(docs); docs.append([pidx[p['id']], SL.get(c[1], 1), LL.get(c[2], 3), sidx[u], c[0]])
            for t in set(toks(c[0])): post[t].append(i)
        for t in set(toks(p['n']) + toks(p.get('mk') or '') + toks(p.get('dv') or '')): ppost[t].append(pidx[p['id']])
    def enc(lst):
        out, prev = [], 0
        for x in lst: out.append(format(x - prev, 'x')); prev = x
        return ','.join(out)
    terms = sorted(post); pterms = sorted(ppost)
    idx = {'v': 'kolaboro-claims-index-1', 'built': TODAY, 'source': {'file': '/data/named.json', 'sha256': NAMED_SHA, 'published': NAMED_DAY},
           'format': 'docs[i] = [project index, status (0 verified, 1 unverified, 2 contradicted), checked against (0 official register, 1 independent, 2 developer, 3 not checked), source index, text]; projects[i] = [slug, name, market, date read]; terms[i] has postings[i] = claim indexes (claim text words), pterms[i] has ppostings[i] = project indexes (project name, market, developer words); both hex, each the difference to the previous one. Terms are lower case, accents removed, letters and digits only. A word that matches a source host is found by scanning sources.',
           'projects': projs, 'sources': srcs, 'docs': docs, 'terms': terms, 'postings': [enc(post[t]) for t in terms], 'pterms': pterms, 'ppostings': [enc(ppost[t]) for t in pterms]}
    n = W('claims-index.json', idx)
    return len(docs), len(srcs), len(terms), n
print('claims', build_claims())
if os.environ.get('ONLY') == 'claims': sys.exit(0)

# ------------------------------------------------------------------------------------------------ 3. anomaly radar
def build_anomalies():
    A = []
    def add(rule, p, numbers, src, read=None):
        A.append({'r': rule, 's': p['s'], 'n': p['n'], 'mk': p.get('mk'), 'x': numbers, 'src': src, 'd': read or (p.get('rvw') or {}).get('d') or p.get('ad')})
    # R1: asking price per m2 far from the market's other projects (same currency), robust z on the log
    grp = collections.defaultdict(list)
    for p in P:
        fx = p['fx'] or {}; pm, sm = num(fx.get('price_min')), num(fx.get('size_min_m2'))
        if pm and sm and sm >= 15 and pm > 0 and fx.get('currency'): grp[(p.get('mk'), fx['currency'])].append((p, pm / sm))
    r1_groups = 0
    for (m, cur), xs in grp.items():
        if len(xs) < 10: continue
        r1_groups += 1
        lg = [math.log(v) for _, v in xs]; med = statistics.median(lg); mad = statistics.median([abs(v - med) for v in lg]) * 1.4826
        if mad <= 0: continue
        for (p, v), l in zip(xs, lg):
            z = (l - med) / mad
            if abs(z) >= 3.5:
                add('ppm', p, {'ppm': round(v), 'cur': cur, 'median': round(math.exp(med)), 'n': len(xs), 'z': round(z, 1), 'price': (p['fx'] or {}).get('price_min'), 'size': (p['fx'] or {}).get('size_min_m2')}, p.get('url'))
    # R2: handover date moved by 12 months or more between the first date on record and the date on record now
    for p in P:
        fx = p['fx'] or {}; a, b = month_of(fx.get('original_handover')), month_of(fx.get('handover_promised'))
        if a and b and b - a >= 12: add('moved', p, {'from': fx.get('original_handover'), 'to': fx.get('handover_promised'), 'months': b - a}, p.get('url'))
    # R3: completion date on the Dubai DLD register differs from the advertised handover by more than 6 months
    for p in P:
        fx = p['fx'] or {}; dld = fx.get('dld') or {}
        a = month_of(fx.get('handover_promised')); c = dld.get('comp')
        if a and c:
            b = month_of(c[:7])
            if b and abs(b - a) > 6: add('register_date', p, {'advertised': fx.get('handover_promised'), 'register': c, 'months': b - a}, dld.get('src'), dld.get('pd'))
    # R4: register progress that does not fit the stage on record
    for p in P:
        fx = p['fx'] or {}; dld = fx.get('dld') or {}; pct = num(dld.get('pct')); start = month_of((dld.get('start') or '')[:7])
        if pct is None: continue
        if pct >= 95 and p.get('st') == 'off-plan': add('stage', p, {'pct': pct, 'stage': p.get('st'), 'inspected': dld.get('pd')}, dld.get('src'), dld.get('pd'))
        elif pct == 0 and p.get('st') == 'under construction' and start and NOW_M - start >= 12: add('stage', p, {'pct': pct, 'stage': p.get('st'), 'inspected': dld.get('pd'), 'start': dld.get('start')}, dld.get('src'), dld.get('pd'))
    # R5: unit sizes that do not add up
    for p in P:
        fx = p['fx'] or {}; a, b = num(fx.get('size_min_m2')), num(fx.get('size_max_m2')); pa_, pb = num(fx.get('price_min')), num(fx.get('price_max'))
        if a and b and a > b: add('size', p, {'min': a, 'max': b, 'why': 'min_gt_max'}, p.get('url'))
        elif a is not None and 0 < a < 12: add('size', p, {'min': a, 'max': b, 'why': 'tiny'}, p.get('url'))
        elif a and b and b / a > 40: add('size', p, {'min': a, 'max': b, 'why': 'ratio'}, p.get('url'))
        if pa_ and pb and pa_ > pb: add('size', p, {'pmin': pa_, 'pmax': pb, 'cur': fx.get('currency'), 'why': 'price_min_gt_max'}, p.get('url'))
    # R6: register units vs sizes: average unit size implied by DLD units is not computable without the built area, so only units = 0 on an active register entry
    for p in P:
        dld = (p['fx'] or {}).get('dld') or {}
        if dld.get('units') == 0 and (dld.get('st') or '').lower() == 'active': add('units', p, {'units': 0, 'status': dld.get('st')}, dld.get('src'), dld.get('pd'))
    cnt = collections.Counter(a['r'] for a in A)
    out = {'v': 'kolaboro-anomalies-1', 'built': TODAY, 'source': {'file': '/data/named.json', 'sha256': NAMED_SHA, 'published': NAMED_DAY}, 'projects_read': len(P),
           'rules': {'ppm': {'groups': r1_groups, 'min_group': 10, 'threshold': 3.5, 'method': 'asking price from / smallest unit size; per market and currency with 10 or more projects; robust z = (ln value - median ln) / (1.4826 x median absolute deviation)'},
                     'moved': {'threshold_months': 12}, 'register_date': {'threshold_months': 6}, 'stage': {'high': 95, 'zero_after_months': 12}, 'size': {'tiny_m2': 12, 'ratio': 40}, 'units': {}},
           'counts': dict(cnt), 'items': sorted(A, key=lambda a: (a['r'], a['mk'] or '', a['n']))}
    W('anomalies.json', out)
    return dict(cnt)
print('anomalies', build_anomalies())

# ------------------------------------------------------------------------------------------------ 4. entity graph
def build_graph():
    import networkx as nx
    G = nx.Graph(); meta = {}
    def node(k, t, label, extra=None):
        if k not in meta: meta[k] = [t, label, extra]; G.add_node(k)
    def norm(s): return re.sub(r'[^a-z0-9]+', ' ', fold(s)).strip()
    for p in P:
        pk = 'p:' + p['s']; node(pk, 'p', p['n'], p.get('mk'))
        if p.get('dvs'): dk = 'd:' + p['dvs']; node(dk, 'd', p.get('dv') or p['dvs']); G.add_edge(pk, dk)
        mkk = 'm:' + (p.get('mk') or '?'); node(mkk, 'm', (p.get('mk') or '?') + (', ' + p['co'] if p.get('co') and p['co'] != p.get('mk') else '')); G.add_edge(pk, mkk)
        c = company((p['fx'] or {}).get('developer_company'))
        if c and not re.search(r'not published|unknown|not stated', c, re.I):
            ck = 'c:' + norm(c)[:80]; node(ck, 'c', c); G.add_edge(pk, ck)
            if p.get('dvs'): G.add_edge('d:' + p['dvs'], ck)
        b = ((p['fx'] or {}).get('dld') or {}).get('bank')
        if b: bk = 'b:' + norm(b); node(bk, 'b', b); G.add_edge(pk, bk)
    # layout: developers, companies and banks are pulled together by their projects; markets act as anchors
    pos = nx.spring_layout(G, k=0.9 / math.sqrt(G.number_of_nodes()), iterations=60, seed=32)
    keys = list(G.nodes()); ix = {k: i for i, k in enumerate(keys)}
    xs = [pos[k][0] for k in keys]; ys = [pos[k][1] for k in keys]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    nodes = [[meta[k][0], meta[k][1], round((pos[k][0] - x0) / (x1 - x0) * 1000), round((pos[k][1] - y0) / (y1 - y0) * 1000), k.split(':', 1)[1] if meta[k][0] in 'pdm' else ''] + ([meta[k][2]] if meta[k][2] else []) for k in keys]
    edges = [[ix[a], ix[b]] for a, b in G.edges()]
    ct = collections.Counter(n[0] for n in nodes)
    out = {'v': 'kolaboro-entity-graph-1', 'built': TODAY, 'source': {'file': '/data/named.json', 'sha256': NAMED_SHA, 'published': NAMED_DAY},
           'types': {'p': 'project', 'd': 'developer (brand on our pages)', 'c': 'registered company named in our sources', 'b': 'escrow bank on the Dubai DLD register', 'm': 'market'},
           'counts': dict(ct), 'edges_n': len(edges),
           'method': 'One node per project, developer, registered company, escrow bank and market in the published dataset. A project links to its developer, its market, the company its sources name and, in Dubai, the escrow bank on the DLD register; a developer links to the companies named for its projects. Company names are matched after removing case, accents and punctuation, so two spellings of one company stay two nodes. Layout: force-directed (networkx spring layout, seed 32), computed once when the file is built.',
           'nodes': nodes, 'edges': edges}
    n = W('entity-graph.json', out)
    return dict(ct), len(edges), n
print('graph', build_graph())

# ------------------------------------------------------------------------------------------------ 8. website change index
MASK = [(re.compile(r'[\w.+-]+@[\w-]+\.[\w.-]+'), '[email]'), (re.compile(r'\+?\d[\d ()-]{8,}\d'), '[phone]')]
def mask(s):
    for rx, r in MASK: s = rx.sub(r, s)
    return s
K_DATE = re.compile(r'\b(20[1-4]\d)\b|\bQ[1-4]\b|\b(january|february|march|april|may|june|july|august|september|october|november|december|completion|handover|hand-over|delivery|ready by)\b', re.I)
K_PRICE = re.compile(r'(\$|€|£|฿|\b(usd|eur|aed|gbp|thb|idr|myr|php|aud|mxn|vnd)\b|\bprice|\bfrom\s+\d|\d[\d,.]*\s?(k|m|million)\b)', re.I)
K_PROM = re.compile(r'\b(guarantee|guaranteed|roi|yield|return|returns|rental income|permit|licen[cs]ed|escrow|freehold|leasehold|approved|pbg|imb|rera|dld)\b|\d+(\.\d+)?\s?%', re.I)
def kinds(s):
    k = []
    if K_DATE.search(s): k.append('date')
    if K_PRICE.search(s): k.append('price')
    if K_PROM.search(s): k.append('promise')
    return k
def wdiff(a, b):
    A, B = re.findall(r'\S+|\s+', a), re.findall(r'\S+|\s+', b)
    sm = difflib.SequenceMatcher(None, A, B, autojunk=False); oa, ob = [], []
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == 'equal': oa.append([0, ''.join(A[i1:i2])]); ob.append([0, ''.join(B[j1:j2])])
        else:
            if i2 > i1: oa.append([1, ''.join(A[i1:i2])])
            if j2 > j1: ob.append([1, ''.join(B[j1:j2])])
    return oa, ob
def clip(s, n=420): return s if len(s) <= n else s[:n].rsplit(' ', 1)[0] + ' …'
def build_web_changes():
    by_id = {p['id']: p for p in P}
    wb = J('wayback.json')['pages']
    out = []
    for k in range(3):
        H = J('page-history-%d.json' % k)['projects']
        for pid, v in H.items():
            p = by_id.get(pid); vs = v.get('v') or []
            if not p or len(vs) < 2: continue
            seg = v['seg']; a, b = vs[0], vs[-1]
            SA = [seg[i].strip() for i in a['ix'] if seg[i].strip()]; SB = [seg[i].strip() for i in b['ix'] if seg[i].strip()]
            sm = difflib.SequenceMatcher(None, SA, SB, autojunk=False); ch = []
            for op, i1, i2, j1, j2 in sm.get_opcodes():
                if op == 'equal': continue
                old, new = ' '.join(SA[i1:i2]), ' '.join(SB[j1:j2])
                ks = sorted(set(kinds(old)) | set(kinds(new)))
                if not ks: continue
                if op == 'replace' and len(old) + len(new) < 2400:
                    oa, ob = wdiff(mask(clip(old, 600)), mask(clip(new, 600)))
                    ch.append({'k': ks, 'a': oa, 'b': ob})
                else:
                    ch.append({'k': ks, 'a': [[1, mask(clip(old))]] if old else [], 'b': [[1, mask(clip(new))]] if new else []})
            if not ch: continue
            score = sum(len(c['k']) for c in ch)
            w = wb.get(v.get('url') or '') or {}
            out.append({'id': pid, 's': p['s'], 'n': p['n'], 'mk': p.get('mk'), 'dv': p.get('dv'), 'dvs': p.get('dvs'), 'url': v.get('url'),
                        'a': {'d': a['d'], 'sha': a['sha']}, 'b': {'d': b['d'], 'sha': b['sha']}, 'versions': len(vs), 'score': score,
                        'kinds': dict(collections.Counter(x for c in ch for x in c['k'])), 'wb': [w.get('f'), w.get('l')] if w else None, 'ch': ch[:12], 'more': max(0, len(ch) - 12)})
    out.sort(key=lambda x: (-x['score'], x['n'])); top = out[:200]
    res = {'v': 'kolaboro-website-changes-1', 'built': TODAY, 'source': 'page-history-0/1/2.json: developer page text archived by our agents, one version per change, SHA-256 per version; Internet Archive copy dates from wayback.json (read ' + J('wayback.json')['read'] + ')',
           'method': 'For each project page with two or more archived versions, the first and the latest version are split into the sentences our archive stores and compared in order (Python difflib). A changed passage is kept when the old or the new text mentions a date (a year, quarter, month or the words completion, handover, delivery), a price (currency sign or code, price, from + number) or a promise (guaranteed, yield, return, ROI, permit, licence, escrow, freehold, leasehold, approved, a percentage). Projects are ranked by the number of kept passages times the kinds they touch; the top 200 are listed. E-mail addresses and phone numbers are masked.',
           'pages_with_two_versions': sum(1 for k in range(3) for v in J('page-history-%d.json' % k)['projects'].values() if len(v.get('v') or []) >= 2),
           'pages_with_kept_changes': len(out), 'listed': len(top), 'items': top}
    n = W('website-changes.json', res)
    return len(out), len(top), n
print('webchanges', build_web_changes())

# ------------------------------------------------------------------------------------------------ 10. satellite construction index
def build_sat():
    cp = J('construction-progress.json'); by_id = {p['id']: p for p in P}; out = []
    for pid, v in cp['projects'].items():
        p = by_id.get(pid)
        if not p: continue
        b, r = v.get('b') or [], v.get('r') or []
        d = [(bb - rr) if bb is not None and rr is not None else None for bb, rr in zip(b, r)]
        clear = [x for x in d if x is not None]
        if len(clear) < 6: continue
        base = statistics.median(clear[:3]); idx = [None if x is None else x - base for x in d]
        # smoothed: median of the last 3 clear months at each clear month
        sm, win = [], []
        for x in idx:
            if x is None: sm.append(None); continue
            win.append(x); win = win[-3:]; sm.append(round(statistics.median(win)))
        m0 = month_of(v['m0']); n = len(idx)
        def window(a, z):   # median of smoothed values for months [a, z)
            xs = [sm[i] for i in range(max(0, a), min(n, z)) if sm[i] is not None]; return (round(statistics.median(xs)), len(xs)) if xs else (None, 0)
        last12, l12n = window(n - 12, n); prev12, p12n = window(n - 24, n - 12)
        first_up = None; run = 0
        for i, x in enumerate(sm):
            if x is None: continue
            run = run + 1 if x >= 15 else 0
            if run >= 3: first_up = ym(m0 + i - 2); break
        fx = p['fx'] or {}; cs = month_of(fx.get('construction_start'))
        note = None
        if p.get('st') == 'under construction' and cs and NOW_M - cs >= 12 and last12 is not None and prev12 is not None and abs(last12 - prev12) < 5 and (last12 or 0) < 15: note = 'flat'
        if last12 is not None and prev12 is not None and last12 - prev12 >= 15: note = 'rising'
        out.append({'id': pid, 's': p['s'], 'n': p['n'], 'mk': p.get('mk'), 'st': p.get('st'), 'cs': fx.get('construction_start'), 'ho': fx.get('handover_promised'),
                    'm0': v['m0'], 'i': [None if x is None else round(x) for x in idx], 'sm': sm, 'clear': len(clear), 'last12': last12, 'last12_n': l12n, 'prev12': prev12, 'prev12_n': p12n, 'up': first_up, 'note': note})
    out.sort(key=lambda x: x['n'])
    res = {'v': 'kolaboro-construction-index-1', 'built': TODAY, 'source': cp['source'], 'input': '/data/construction-progress.json (updated ' + cp['updated'] + ', ' + str(len(cp['projects'])) + ' projects)',
           'radius_m': cp['radius_m'], 'resolution_m': cp['resolution_m'],
           'method': 'Per month: b = share of the 150 m circle around the pin that is built-up or bare (Sentinel-2: NDBI above 0 and NDVI below 0.25, so vegetation counts as not built), r = the same share in a ring 300 to 600 m away. Index = (b - r) minus the median of (b - r) over the first 3 clear months, in percentage points. Smoothed = median of the last 3 clear months. "Visible change from" = first month of 3 clear months in a row with the smoothed index at 15 points or more (single-month noise in the first months: median 4, 90th percentile 15). Last 12 months and the 12 before: medians of the smoothed index.',
           'limits': cp['limits'], 'notes': {'flat': 'marked under construction, construction start on record 12 or more months ago, and the smoothed index moved less than 5 points between the two 12-month windows while staying under 15', 'rising': 'the smoothed index of the last 12 months is 15 or more points above the 12 months before'},
           'counts': {'projects': len(out), 'rising': sum(1 for x in out if x['note'] == 'rising'), 'flat': sum(1 for x in out if x['note'] == 'flat'), 'visible_change': sum(1 for x in out if x['up'])}, 'projects': out}
    n = W('construction-index.json', res)
    return res['counts'], n
print('sat', build_sat())

# ------------------------------------------------------------------------------------------------ 6. build provenance (history from git)
def build_prov():
    if not REPO: return None
    dep = J('deploys.json')['deploys']; hist = []; blob_sha = {}
    def g(*a):
        r = subprocess.run(['git', '-C', REPO] + list(a), capture_output=True, text=True); return r.stdout.strip() if r.returncode == 0 else ''
    for e in dep:
        c = e.get('commit')
        if not c or subprocess.run(['git', '-C', REPO, 'cat-file', '-e', c + '^{commit}'], capture_output=True).returncode: continue
        wt = g('rev-parse', c + ':_worker.js'); nb = g('rev-parse', c + ':_s/kolaboro.com/data/named.json')
        if not wt: continue
        if nb and nb not in blob_sha:
            raw = subprocess.run(['git', '-C', REPO, 'cat-file', 'blob', nb], capture_output=True).stdout; blob_sha[nb] = (hashlib.sha256(raw).hexdigest(), len(raw))
        sz = g('ls-tree', '-r', '-l', c, '_worker.js'); wb = sum(int(l.split()[3]) for l in sz.splitlines() if len(l.split()) >= 4 and l.split()[3].isdigit())
        hist.append({'commit': c, 'live_seen': e.get('at'), 'smoke': [e.get('checks_passed'), e.get('checks_total')], 'result': e.get('result'), 'committed': g('log', '-1', '--format=%cI', c),
                     'worker_tree': wt, 'worker_bytes': wb, 'dataset_sha256': blob_sha.get(nb, (None,))[0], 'dataset_bytes': blob_sha.get(nb, (None, None))[1]})
    out = {'v': 'kolaboro-provenance-1', 'built': TODAY,
           'fields': {'commit': 'git commit served by Cloudflare Pages (the same id /api/open/build reports)', 'live_seen': 'when the deploy guard saw it live and ran its smoke checks', 'smoke': 'checks passed, of total',
                      'committed': 'commit time', 'worker_tree': 'git tree id of the _worker.js directory: the exact worker source that Pages bundles', 'worker_bytes': 'sum of the worker source files, bytes',
                      'dataset_sha256': 'SHA-256 of /data/named.json in that commit', 'dataset_bytes': 'its size'},
           'how_recorded': 'Backfilled on 19 Nov 2026 from the git history of every deploy the guard recorded in /data/deploys.json. From then on the deploy guard (the existing scheduled job, /open/deploy-guard.py) adds worker_tree and dataset_sha256 to each deploy it checks.',
           'history': hist}
    W('provenance.json', out)
    return len(hist)
print('prov', build_prov())
