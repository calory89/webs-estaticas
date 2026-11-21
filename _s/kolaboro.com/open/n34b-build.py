#!/usr/bin/env python3
"""kolaboro.com batch 34 (n34b, 21 Nov 2026): static data behind the product pages of this batch.
Reads only published files under _s/kolaboro.com/data/ (no network, no model calls). Usage: n34b-build.py <site-dir>
Writes:
  data/n34b-search.json   one row per public project for /search/ facets, the report builder picker and the command palette
  data/n34b-markets.json  per market: stage mix, handover dates past, dates moved, disclosure, price per m2 with a 95% bootstrap
                          interval, official registers we link; used by /markets/compare/
Intervals: percentile bootstrap of the median, 2,000 resamples, fixed seed 34, only when the sample has 5 or more values.
Projects in Sumba and anything named Eco Beach City or Equinox are left out (conflict of interest)."""
import json, sys, os, re, hashlib, random, statistics, collections

SITE = sys.argv[1]
D = os.path.join(SITE, 'data')
def J(p): return json.load(open(os.path.join(D, p)))
def W(p, o):
    s = json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    open(os.path.join(D, p), 'w').write(s); return len(s.encode())
def sha(p): return hashlib.sha256(open(os.path.join(D, p), 'rb').read()).hexdigest()

COI = re.compile(r'eco\s*beach|\bequinox\b|\bsumba\b', re.I)
named = J('named.json'); cases = {c['id']: c for c in J('bali-cases.json')['cases']}
PROM = J('promises.json')['projects']
def moved(i):
    """months the handover date moved later in our dated records (promises.json, kind handover), 0 when none"""
    for k in PROM.get(i) or []:
        if k.get('k') == 'handover' and (k.get('mm') or 0) > 0: return int(k['mm'])
    return 0
P = [p for p in named['projects'] if not COI.search(' '.join(str(p.get(k) or '') for k in ('n', 'dv', 'mk', 'ar')))]
slugM = lambda m: m.lower().replace(' ', '-')
STG = {'off-plan': 'o', 'under construction': 'u', 'completed': 'c'}

RS = re.compile(r'^Latest registered home sales listed on the page \((\d+), ([^)]*?) to ([^)]*?)\): (AED) ([\d,]+) to AED ([\d,]+)')
def reg_sale(x):
    """same rule as _worker.js/kbx_n31d_rs.js: a DLD registered sale range stored as the price is not an asking price"""
    fx = x.get('fx') or {}
    try: pm = float(fx.get('price_min') or 0); px = None if fx.get('price_max') is None else float(fx['price_max'])
    except (TypeError, ValueError): return False
    if pm <= 0: return False
    for t in [c[0] for c in (x.get('cl') or [])] + list(x.get('dl') or []):
        m = RS.match(str(t or ''))
        if not m: continue
        a = float(m.group(5).replace(',', '')); b = float(m.group(6).replace(',', ''))
        if a == pm and (b <= pm if px is None else px == b): return True
    return False

def ppm(x):
    fx = x.get('fx') or {}
    try: p = float(fx.get('price_min') or 0); s = float(fx.get('size_min_m2') or 0)
    except (TypeError, ValueError): return None
    if reg_sale(x): return None
    return p / s if p > 0 and 15 <= s <= 5000 and fx.get('currency') else None

rows = []
for x in P:
    c = cases.get(x['id'], {})
    st = c.get('stage') or x.get('st') or ''
    hy = c.get('done') if isinstance(c.get('done'), int) else 0
    ov = c.get('overdue') or 0
    mv = moved(x['id'])
    rows.append([x['s'], x['n'], x['id'], x.get('dv') or '', x.get('dvs') or '', x['mk'], x['co'], x.get('ar') or '', STG.get(st, ''), 1 if x.get('pn') else 0, hy, int(ov), int(round(mv))])
rows.sort(key=lambda r: r[1].lower())
src = {'file': '/data/named.json', 'sha256': sha('named.json'), 'updated': named['updated'], 'version': named['version']}
built = named['updated']
n1 = W('n34b-search.json', {'version': 'n34b-search-1', 'built': built, 'source': src,
       'fields': ['slug', 'name', 'id', 'developer', 'developer_slug', 'market', 'country', 'area', 'stage (o off-plan, u under construction, c completed)', 'permit number published (1/0)', 'handover year on record (0 none)', 'months past the handover date on record', 'months the handover date moved'],
       'p': rows})
print('n34b-search.json', len(rows), 'rows', n1, 'bytes')

# ---------------------------------------------------------------------------------------------- markets
rnd = random.Random(34)
def boot(v, k=2000):
    if len(v) < 5: return None
    v = sorted(v); n = len(v); meds = []
    for _ in range(k):
        s = sorted(v[rnd.randrange(n)] for _ in range(n)); meds.append(s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2)
    meds.sort(); return [meds[int(0.025 * k)], meds[int(0.975 * k) - 1]]
def med(v): return statistics.median(v) if v else None

tm = {m['market']: m for m in J('transparency-monthly/2026-11.json')['markets']}
tm_meta = J('transparency-monthly/2026-11.json')
regs = J('register-checks.json')['registers']
by = collections.defaultdict(list)
for x in P: by[x['mk']].append(x)
M = []
for mk, L in by.items():
    if len(L) < 3: continue
    co = collections.Counter(x['co'] for x in L).most_common(1)[0][0]
    stc = collections.Counter(STG.get((cases.get(x['id'], {}).get('stage') or x.get('st') or ''), '') for x in L)
    yrs = [cases.get(x['id'], {}).get('done') for x in L]
    with_date = sum(1 for y in yrs if isinstance(y, int))
    ov = [cases[x['id']]['overdue'] for x in L if cases.get(x['id'], {}).get('overdue')]
    mv = [moved(x['id']) for x in L if moved(x['id'])]
    cur = collections.Counter(str((x.get('fx') or {}).get('currency') or '').upper() for x in L if ppm(x) is not None)
    pm = None
    if cur:
        c0 = cur.most_common(1)[0][0]; v = [ppm(x) for x in L if ppm(x) is not None and str(x['fx']['currency']).upper() == c0]
        ci = boot(v)
        pm = {'currency': c0, 'n': len(v), 'median': round(med(v)), 'ci95': [round(ci[0]), round(ci[1])] if ci else None}
    ovs = {'n': len(ov), 'median': med(ov), 'ci95': boot(ov)} if ov else {'n': 0}
    mvs = {'n': len(mv), 'median': med(mv), 'ci95': boot(mv)} if mv else {'n': 0}
    t = tm.get(mk) or {}
    rg = [{'name': r['register'], 'url': r['url'], 'checks': r.get('checks') or [], 'automation': r.get('automation'), 'probed': (r.get('probed_at') or '')[:10]} for r in regs if r['market'] in (mk, co)]
    M.append({'market': mk, 'slug': slugM(mk), 'country': co, 'projects': len(L),
              'stage': {'o': stc.get('o', 0), 'u': stc.get('u', 0), 'c': stc.get('c', 0)},
              'with_date': with_date, 'past_date': ovs, 'moved': mvs,
              'permit_published': sum(1 for x in L if x.get('pn')),
              'disclosure': {k: t.get(k) for k in ('transparency_index', 'avg_checks', 'avg_confirmed', 'permit_public_pct', 'deposit_protection_pct', 'all_six_public')} if t else None,
              'ppm': pm, 'registers': rg})
M.sort(key=lambda m: -m['projects'])
n2 = W('n34b-markets.json', {'version': 'n34b-markets-1', 'built': built, 'source': src,
       'disclosure_source': {'file': '/data/transparency-monthly/2026-11.json', 'edition': tm_meta['edition'], 'method': tm_meta['method']},
       'registers_source': '/data/register-checks.json',
       'method': 'Counts from the public dataset. Months past the handover date on record come from bali-cases.json (overdue); months the date moved later come from promises.json (handover promises, months moved). Price per m2 = advertised price from / smallest unit size, in the currency most projects of the market use, registered sale prices left out. Intervals: percentile bootstrap of the median, 2,000 resamples, seed 34, shown only for samples of 5 or more.',
       'markets': M})
print('n34b-markets.json', len(M), 'markets', n2, 'bytes')

# ---------------------------------------------------------------------------------------------- command palette (/k/palette.js)
# every buyer tool listed on /tools/ (English title from the hub, the translated title where /<lang>/tools/<x>/ exists), the pages of
# batch 34 and the palette's own labels, all in 8 languages
import html as H
LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar']
I18N = J('n34b-i18n.json')
hub = open(os.path.join(SITE, 'tools', 'index.html')).read()
man = J('n32t/manifest.json')['pages']
tools, seen = [], set()
for m in re.finditer(r'<a[^>]*href="(/tools/[a-z0-9-]+/)"[^>]*>(.*?)</a>', hub, re.S):
    path = m.group(1)
    if path in seen: continue
    seen.add(path)
    b = re.search(r'<b>(.*?)</b>', m.group(2), re.S)
    en = H.unescape(re.sub(r'<[^>]+>', '', b.group(1) if b else m.group(2))).strip()
    en = re.sub(r'\s+', ' ', en).split(':')[0].strip() if not b else re.sub(r'\s+', ' ', en)
    tr = {}
    key = path.strip('/')
    if key in man:
        for l in LANGS[1:]:
            f = os.path.join(D, 'n32t', l, key.replace('/', '-') + '.json')
            if os.path.exists(f):
                t = json.load(open(f)).get('t')
                if t: tr[l] = t
    tools.append([path, en, tr])
pages = [['/search/', {l: I18N[l]['se_t'] for l in LANGS}, 'search find filter projects country stage permit handover'],
         ['/tools/due-diligence/', {l: I18N[l]['dd_t'] for l in LANGS}, 'due diligence report pdf print checks questions'],
         ['/markets/compare/', {l: I18N[l]['mc_t'] for l in LANGS}, 'compare markets delays disclosure price per m2 registers'],
         ['/watchlist/', {l: I18N[l]['wl_t'] for l in LANGS}, 'watchlist saved alerts notifications changes my projects']]
n3 = W('n34b-palette.json', {'version': 'n34b-palette-1', 'built': built, 'translated_tools': sorted(k for k in man if k.startswith('tools/')),
       'tools': tools, 'pages': pages, 'labels': {l: I18N[l]['pal'] for l in LANGS}})
print('n34b-palette.json', len(tools), 'tools', n3, 'bytes')
