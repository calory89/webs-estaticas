#!/usr/bin/env python3
"""kolaboro.com batch 35 (n35a, 22 Nov 2026): intelligence from our own data, built only from files already published on kolaboro.com.

  python3 n35a-build.py <site data dir: _s/kolaboro.com/data> [--check]

Reads named.json, price-reality.json, register-changes.json, court-cases.json, source-health.json, promise-drift.json,
n34a/track-record.json, n34a/history/*.json, construction-index.json, search-aliases.json, sql/datacard.json, sql/projects.csv and writes
data/n35a/:
  pace.json            Dubai: DLD % built against the time elapsed to the registered completion date; projected range from the pace
  asking.json          Dubai: advertised starting price per m2 against registered off-plan sales per m2, per DLD area
  escrow.json          Dubai: projects grouped by the escrow bank printed on the DLD register
  signals/<00-15>.json + signals-index.json   one dated stream of public signals per developer
  contradictions.json  the same field with different values in two of our sources for one project
  aliases.json         names across scripts and languages, with the matching rule
  dictionary.json      every public field: definition, type, coverage per market, source types, the code that fills it
  satchange.json       Sentinel-2 built-up index: largest change between the last two clear readings
  build.json           inputs and outputs with SHA-256 (--check rebuilds into a temp dir and compares)
Deterministic: fixed seed, sorted keys, no clock (the build date is the newest input date). Python 3.8+, stdlib only.
"""
import csv, hashlib, json, math, os, random, re, sys, tempfile, unicodedata, zlib
from collections import Counter, defaultdict
from datetime import date

ARGS = sys.argv[1:]
CHECK = '--check' in ARGS
if CHECK: ARGS.remove('--check')
D = os.path.abspath(ARGS[0] if ARGS else '_s/kolaboro.com/data')
OUTD = tempfile.mkdtemp(prefix='n35a-check-') if CHECK else D
O = os.path.join(OUTD, 'n35a')
os.makedirs(O, exist_ok=True)
def rj(p, default=None):
    p = os.path.join(D, p)
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else default
def sha_file(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
OUTS = {}
def wj(rel, o):
    p = os.path.join(O, rel); os.makedirs(os.path.dirname(p), exist_ok=True)
    s = json.dumps(o, sort_keys=True, ensure_ascii=False, separators=(',', ':'))
    open(p, 'w', encoding='utf-8').write(s); OUTS['n35a/' + rel] = hashlib.sha256(s.encode()).hexdigest()
INPUTS = ['named.json', 'price-reality.json', 'register-changes.json', 'court-cases.json', 'source-health.json', 'promise-drift.json',
          'n34a/track-record.json', 'construction-index.json', 'search-aliases.json', 'sql/datacard.json', 'sql/projects.csv']
LIC = 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)'
random.seed(35)

N = rj('named.json')
COI = re.compile(r'eco\s*beach|\bequinox\b|\bsumba\b', re.I)   # independence policy: Sumba only in the transparency ranking; the operator's projects never
P = [p for p in N['projects'] if not COI.search(' '.join(str(p.get(k) or '') for k in ('n', 's', 'dv', 'dvs', 'mk', 'ar', 'co')))]
BY = {p['id']: p for p in P}; BYS = {p['s']: p for p in P}
BUILT = max(N.get('updated', '')[:10], (rj('register-changes.json') or {}).get('updated', '')[:10])
def dd(s):
    try: return date.fromisoformat(str(s)[:10])
    except Exception: return None
MON = {m: i + 1 for i, m in enumerate(['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'])}
def dmy(s):
    m = re.match(r'(\d{1,2}) (\w{3})\w* (\d{4})', s)
    if not m or m.group(2).lower()[:3] not in MON: return None
    try: return date(int(m.group(3)), MON[m.group(2).lower()[:3]], int(m.group(1)))
    except Exception: return None
def q(xs, f):
    xs = sorted(xs);
    if not xs: return None
    k = (len(xs) - 1) * f; a = math.floor(k); b = math.ceil(k)
    return xs[a] + (xs[b] - xs[a]) * (k - a)
def med(xs): return q(xs, .5)
def boot_med(xs, n=2000):
    if len(xs) < 2: return None
    ms = sorted(med([random.choice(xs) for _ in xs]) for _ in range(n))
    return [ms[int(.025 * n)], ms[int(.975 * n) - 1]]
def wilson(k, n, z=1.96):
    if not n: return None
    p = k / n; d = 1 + z * z / n; c = p + z * z / (2 * n); r = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return [round(100 * (c - r) / d, 1), round(100 * (c + r) / d, 1)]
r1 = lambda x: None if x is None else round(x, 1)

# ------------------------------------------------------------------------------------------------ DLD readings (current + our dated versions + text)
CRC = lambda s: zlib.crc32(s.encode()) & 0xffffffff
def apply(base, ops):
    o = json.loads(json.dumps(base))
    for op in ops:
        s = [x.replace('~1', '/').replace('~0', '~') for x in op['path'].split('/')[1:]]
        if not s: o = op.get('value'); continue
        c = o
        for k in s[:-1]:
            if isinstance(c, list): c = c[int(k)]
            else:
                if c.get(k) is None: c[k] = {}
                c = c[k]
        k = s[-1]
        if op['op'] == 'remove':
            if isinstance(c, list): c.pop(int(k))
            else: c.pop(k, None)
        elif op['op'] == 'add' and isinstance(c, list): c.append(op['value']) if k == '-' else c.insert(int(k), op['value'])
        else:
            if isinstance(c, list): c[int(k)] = op['value']
            else: c[k] = op['value']
    return o
READ = defaultdict(dict)   # id -> {date: pct}
for i in range(32):
    sh = rj('n34a/history/%02d.json' % i, {}) or {}
    for pid, vs in (sh.get('p') or {}).items():
        cur = None
        for j, v in enumerate(vs):
            try: cur = v['base'] if j == 0 else apply(cur, v['ops'])
            except Exception: break
            x = ((cur or {}).get('fx') or {}).get('dld') or {}
            if x.get('pd') and x.get('pct') is not None: READ[pid][x['pd']] = float(x['pct'])
for p in P:
    x = p['fx'].get('dld')
    if not x: continue
    if x.get('pd') and x.get('pct') is not None: READ[p['id']][x['pd']] = float(x['pct'])
    t = ' '.join(p['dl']) + ' ' + ' '.join(str(v) for v in p['ev'].values())
    for m in re.finditer(r'(\d+(?:\.\d+)?)% \((\d{1,2} \w{3} \d{4})\)', t):
        d0 = dmy(m.group(2))
        if d0: READ[p['id']].setdefault(d0.isoformat(), float(m.group(1)))
    for m in re.finditer(r'(\d+(?:\.\d+)?)% built at (?:the )?DLD.s? inspection (?:on |of )?(\d{1,2} \w{3} \d{4})', t):
        d0 = dmy(m.group(2))
        if d0: READ[p['id']].setdefault(d0.isoformat(), float(m.group(1)))
REGL = (rj('register-changes.json') or {}).get('last', {})

# ------------------------------------------------------------------------------------------------ 1. construction pace vs promise (Dubai, DLD)
pace = []
for p in P:
    x = p['fx'].get('dld')
    if not x or p['mk'] != 'Dubai': continue
    st, rg, cp, pd_ = dd(x.get('start')), dd(x.get('reg')), dd(x.get('comp')), dd(x.get('pd'))
    pct = x.get('pct')
    row = {'id': p['id'], 's': p['s'], 'n': p['n'], 'dv': p['dv'], 'dvs': p['dvs'], 'ar': re.sub(r',\s*Dubai$', '', p.get('ar') or ''), 'pct': pct, 'pd': x.get('pd'), 'comp': x.get('comp'),
           'start': x.get('start'), 'reg': x.get('reg'), 'dst': x.get('st'), 'src': x.get('src'), 'no': x.get('no')}
    rd = sorted(READ.get(p['id'], {}).items())
    row['readings'] = [[a, b] for a, b in rd][-8:]
    t0 = st or rg
    if not (t0 and cp and pd_ and pct is not None) or cp <= t0 or pd_ < t0 or x.get('st') != 'Active':
        row['k'] = 'na'; pace.append(row); continue
    el = (pd_ - t0).days / (cp - t0).days
    row['el'] = round(100 * min(el, 9.99), 1); row['gap'] = round(pct - 100 * el, 1) if el <= 1 else None
    row['k'] = 'done' if pct >= 100 else 'past' if pd_ > cp else 'behind' if pct - 100 * el < -10 else 'on'
    if 10 <= pct < 100:
        rates = []
        for a in [st, rg]:
            if a and a < pd_: rates.append(('since_start' if a == st else 'since_reg', pct / (pd_ - a).days))
        if len(rd) >= 2:
            (da, pa), (db, pb) = rd[-2], rd[-1]
            da, db = dd(da), dd(db)
            if da and db and db > da and pb > pa: rates.append(('recent', (pb - pa) / (db - da).days))
        seen = set(); ests = []
        for k, r in rates:
            if r <= 0: continue
            dleft = (100 - pct) / r
            if dleft > 365 * 20: continue
            e = date.fromordinal(pd_.toordinal() + int(round(dleft)))
            if (k, e) in seen: continue
            seen.add((k, e)); ests.append([k, e.isoformat()])
        if ests:
            es = sorted(e for k, e in ests)
            row['proj'] = [es[0], es[-1]]; row['ests'] = ests
            row['late_m'] = round(((dd(es[0]) - cp).days) / 30.44, 1), round(((dd(es[-1]) - cp).days) / 30.44, 1)
    pace.append(row)
el_rows = [r for r in pace if r['k'] in ('on', 'behind', 'past', 'done')]
cmp_rows = [r for r in el_rows if r.get('gap') is not None]
proj_rows = [r for r in pace if r.get('proj')]
kc = Counter(r['k'] for r in pace)
gaps = [r['gap'] for r in cmp_rows]
both_late = [r for r in proj_rows if r['late_m'][0] > 0]
pace_sum = {'dld_records': len(pace), 'compared': len(cmp_rows), 'with_projection': len(proj_rows), 'counts': dict(kc),
            'median_gap_pts': r1(med(gaps)), 'median_gap_ci': [r1(x) for x in boot_med(gaps)] if len(gaps) > 1 else None,
            'behind_pct': round(100 * kc['behind'] / len(cmp_rows), 1) if cmp_rows else None, 'behind_ci': wilson(kc['behind'], len(cmp_rows)),
            'proj_after_comp': len(both_late), 'proj_after_comp_pct': round(100 * len(both_late) / len(proj_rows), 1) if proj_rows else None, 'proj_after_comp_ci': wilson(len(both_late), len(proj_rows)),
            'median_late_m': r1(med([(r['late_m'][0] + r['late_m'][1]) / 2 for r in proj_rows])),
            'multi_readings': sum(1 for r in pace if len(r['readings']) >= 2)}
hist = Counter()
for g in gaps: hist[max(-60, min(50, int(math.floor(g / 10) * 10)))] += 1
pace_sum['hist'] = sorted([k, v] for k, v in hist.items())
wj('pace.json', {'v': 'n35a-pace-1', 'built': BUILT, 'licence': LIC, 'market': 'Dubai', 'summary': pace_sum,
    'source': {'name': 'Dubai Land Department project register, as mirrored per project with its inspection history (dubairealestateiq.com), read by our register job', 'register_changes': '/registers/changes/'},
    'method': {'elapsed': 'time elapsed = (inspection date - construction start on the register) / (registered completion date - construction start); the registration date is used when no start date is printed',
               'gap': 'gap = % built at the inspection - % of time elapsed at the same date, in percentage points; behind = gap below -10 points; past = the inspection is after the registered completion date and the project is not at 100%',
               'projection': 'only for 10% to 99% built: remaining % / observed pace, where pace = % built per day since the start date, since the registration date, and between the last two inspections we hold (when it rose); the range is the earliest and latest of these estimates',
               'limits': 'Construction does not progress in a straight line (slow start, faster structure, slow finishing), so a linear pace from an early reading tends to give later dates than the work will need, and a late reading can give earlier ones. The register % is the DLD inspection figure, not ours. A projection, not a promise and not a finding about the developer.'},
    'rows': sorted(pace, key=lambda r: (r['k'] == 'na', r.get('gap') if r.get('gap') is not None else 999, r['id']))})

# ------------------------------------------------------------------------------------------------ 2. asking vs registered per m2 (Dubai, DLD area)
PR = rj('price-reality.json'); dub = next(m for m in PR['markets'] if m['market'] == 'Dubai'); PM = dub['per_m2']
def norm_area(a):
    a = re.sub(r',\s*Dubai$', '', a or '').strip(); a = re.sub(r'\s*\([^)]*\)', '', a).strip().lower()
    a = {'dubailand residence complex': 'dubai land residence complex', 'dubailand': 'dubai land residence complex', 'al jaddaf': 'al jadaf', 'dubai hills estate': 'dubai hills'}.get(a, a)
    return a
AREAS = {a['area'].lower(): a for a in PM['areas']}
grp = defaultdict(list); unmatched = Counter()
for p in P:
    if p['mk'] != 'Dubai': continue
    fx = p['fx']
    if not (fx.get('price_min') and fx.get('size_min_m2') and fx.get('currency') == 'AED'): continue
    if fx['size_min_m2'] < 20: continue
    a = norm_area(p.get('ar'))
    if a not in AREAS: unmatched[a] += 1; continue
    grp[a].append({'id': p['id'], 's': p['s'], 'n': p['n'], 'dv': p['dv'], 'ppm': round(fx['price_min'] / fx['size_min_m2']), 'pmin': fx['price_min'], 'smin': fx['size_min_m2']})
areas = []
for a, xs in sorted(grp.items()):
    R = AREAS[a]; v = [x['ppm'] for x in xs]; m = med(v); ci = boot_med(v)
    o = {'area': R['area'], 'slug': re.sub(r'[^a-z0-9]+', '-', a).strip('-'), 'n_ask': len(xs), 'ask_med': round(m), 'ask_ci': [round(c) for c in ci] if ci else None,
         'ask_q': [round(q(v, .25)), round(q(v, .75))], 'reg_n': R['n'], 'reg_med': R['median_local'], 'reg_q': [R['p25_local'], R['p75_local']],
         'gap_pct': round(100 * (m / R['median_local'] - 1), 1), 'gap_ci': [round(100 * (c / R['median_local'] - 1), 1) for c in ci] if ci else None,
         'page': len(xs) >= 5, 'rows': sorted(xs, key=lambda x: x['ppm'])}
    areas.append(o)
allv = [x['ppm'] for a in areas for x in a['rows']]
wj('asking.json', {'v': 'n35a-asking-1', 'built': BUILT, 'licence': LIC, 'market': 'Dubai', 'currency': 'AED',
    'registered': {'source': dub['official']['source'], 'url': dub['official']['url'], 'filter': dub['official']['filter'], 'period': dub['official']['period'], 'period_text': dub['official']['period_text'], 'n': PM['all']['n'], 'median': PM['all']['median_local'], 'what': PM['what'], 'from': '/data/price-reality.json'},
    'summary': {'areas': len(areas), 'area_pages': sum(1 for a in areas if a['page']), 'projects': len(allv), 'unmatched_projects': sum(unmatched.values()), 'unmatched_areas': len(unmatched)},
    'method': {'asking': 'advertised starting price divided by the smallest unit size, both as printed by the developer or a portal in our record (AED); per area the median with a bootstrap 95% interval (2,000 resamples, seed 35) and quartiles',
               'registered': 'median and quartiles of the price per m2 of registered off-plan residential sales in the same DLD area (Dubai Land Department open data); we hold only the summary, not single sales',
               'matching': 'a project counts for an area when the area in its record is the DLD area name, after removing ", Dubai" and brackets and fixing four spellings (Dubailand, DLRC, Al Jaddaf, Dubai Hills Estate); projects in other areas are left out',
               'gap': 'gap = median asking per m2 / median registered per m2 - 1; the interval applies the asking interval to the registered median',
               'limits': 'The starting price and the smallest size may not belong to the same unit; registered sales include every project in the area and every unit type; a positive gap is not proof of overpricing and a negative one is not a bargain.'},
    'areas': sorted(areas, key=lambda a: -a['n_ask'])})

# ------------------------------------------------------------------------------------------------ 3. escrow bank view (Dubai, DLD)
BANKFIX = {'emirates nbd bank': 'Emirates NBD', 'emirates nbd': 'Emirates NBD', 'emirates nbd bank pjsc': 'Emirates NBD'}
def bank_of(p):
    x = p['fx'].get('dld') or {}
    b = x.get('bank') or ((REGL.get(p['id'] + '|dld') or {}).get('v') or {}).get('bank')
    if not b:
        m = re.search(r'escrow account bank ([^()]+?)\s*(?:/\s*)?\(', p['ev'].get('escrow') or '')
        if m: b = m.group(1)
    if not b: return None
    b = re.sub(r'\s*/\s*$', '', b).strip(); b = re.sub(r'\s+', ' ', b)
    b = BANKFIX.get(b.lower(), b)
    if b.isupper() or b.islower(): b = b.title()
    b = re.sub(r'\bP S C\b', 'PSC', b); b = re.sub(r'\bOf\b', 'of', b); b = re.sub(r'\s+(?:PSC|Psc|PJSC|Pjsc|P\.J\.S\.C\.?)$', '', b)
    return b
banks = defaultdict(list)
prow = {r['id']: r for r in pace}
for p in P:
    if p['mk'] != 'Dubai' or not p['fx'].get('dld'): continue
    b = bank_of(p)
    if b: banks[b].append(p)
TODAY = dd(BUILT)
def ho_month(h):
    m = re.match(r'(\d{4})(?:-Q(\d)|-(\d{2}))?', str(h or ''))
    if not m: return None
    y = int(m.group(1)); mo = int(m.group(3) or (int(m.group(2)) * 3 if m.group(2) else 12)); return date(y, mo, 28)
bk = []
for b, ps in banks.items():
    rs = [prow.get(p['id']) for p in ps]
    pcts = [p['fx']['dld'].get('pct') for p in ps if p['fx']['dld'].get('pct') is not None]
    past = [p for p in ps if dd(p['fx']['dld'].get('comp')) and dd(p['fx']['dld']['comp']) < TODAY and (p['fx']['dld'].get('pct') or 0) < 100]
    moved = [p for p in ps if (p['fx'].get('delay_months') or 0) > 0]
    beh = [r for r in rs if r and r['k'] == 'behind']; cmpn = [r for r in rs if r and r.get('gap') is not None]
    bk.append({'bank': b, 'slug': re.sub(r'[^a-z0-9]+', '-', b.lower()).strip('-'), 'n': len(ps), 'developers': len({p['dvs'] for p in ps}), 'units': sum(int(p['fx']['dld'].get('units') or 0) for p in ps),
               'finished': sum(1 for p in ps if p['fx']['dld'].get('st') == 'Finished' or (p['fx']['dld'].get('pct') or 0) >= 100),
               'pct_med': r1(med(pcts)), 'pct_n': len(pcts), 'past_comp': len(past), 'moved': len(moved), 'behind': len(beh), 'compared': len(cmpn),
               'rows': sorted([{'id': p['id'], 's': p['s'], 'n': p['n'], 'dv': p['dv'], 'dvs': p['dvs'], 'pct': p['fx']['dld'].get('pct'), 'pd': p['fx']['dld'].get('pd'), 'comp': p['fx']['dld'].get('comp'), 'units': p['fx']['dld'].get('units'),
                                'k': (prow.get(p['id']) or {}).get('k'), 'moved': p['fx'].get('delay_months'), 'src': p['fx']['dld'].get('src')} for p in ps], key=lambda r: (r['dv'], r['n']))})
nb = sum(b['n'] for b in bk)
wj('escrow.json', {'v': 'n35a-escrow-1', 'built': BUILT, 'licence': LIC, 'market': 'Dubai',
    'summary': {'banks': len(bk), 'projects': nb, 'dld_records': len(pace), 'no_bank': len(pace) - nb},
    'method': {'bank': 'the escrow account bank printed on the DLD project register for the project (mirror read by our register job; the bank name as printed, with case and four spelling variants of Emirates NBD unified)',
               'past': 'registered completion date before ' + BUILT + ' and the last DLD inspection below 100%', 'moved': 'our record holds a promised handover later than the first one we recorded',
               'behind': 'see /construction-pace/: % built more than 10 points below the share of time elapsed', 'limits': 'Facts from the register about the projects each bank holds escrow for. The bank does not build the project; this is not a rating of any bank or developer.'},
    'banks': sorted(bk, key=lambda b: (-b['n'], b['bank']))})

# ------------------------------------------------------------------------------------------------ 4. developer signal timeline
TR = rj('n34a/track-record.json'); SH = rj('source-health.json'); CC = rj('court-cases.json'); DR = rj('promise-drift.json'); RC = rj('register-changes.json')
DEVN = {p['dvs']: p['dv'] for p in P}
ev = defaultdict(list)
def add(dv, d, k, txt, s=None, src=None, extra=None):
    if not dv or not d: return
    o = {'d': str(d)[:10], 'k': k, 't': txt}
    if s: o['s'] = s
    if src: o['u'] = src
    if extra: o.update(extra)
    ev[dv].append(o)
KMAP = {'add': 'added', 'later': 'moved_later', 'earlier': 'moved_earlier', 'permit': 'permit', 'contra': 'contradicted', 'verif': 'verified', 'done': 'completed'}
for dv, x in TR['d'].items():
    if COI.search(dv + ' ' + str(x.get('n') or '')): continue
    for e in x.get('ev', []):
        p = BYS.get(e[2])
        if e[2] and not p: continue
        add(dv, e[0], KMAP.get(e[1], e[1]), e[3] if len(e) > 3 else '', e[2])
for c in RC.get('changes', []):
    p = BY.get(c.get('id'))
    if p: add(p['dvs'], c.get('after_d'), 'register', c.get('register', ''), p['s'], c.get('url'), {'f': c.get('field'), 'a': c.get('before'), 'b': c.get('after')})
for c in CC.get('cases', []):
    if COI.search(str(c.get('dev') or '')): continue
    add(c.get('dev'), c.get('date'), 'court', c.get('court', '') + ' ' + c.get('no', ''), None, c.get('src'), {'w': c.get('what'), 'r': c.get('result')})
fields = SH['fields']; iu, ist, ich = fields.index('url'), fields.index('status'), fields.index('checked')
for row in SH['u']:
    stt = str(row[ist])
    if stt in ('404', '410') or stt[:1] == '5' or stt == 'e':
        for s in SH['cites'].get(row[iu], []):
            p = BYS.get(s)
            if p: add(p['dvs'], row[ich], 'source_gone', stt, s, row[iu])
for pid, x in DR['projects'].items():
    p = BY.get(pid)
    if not p: continue
    for c in x.get('changes', []):
        add(p['dvs'], c.get('first_seen'), 'page_change', c.get('label', c.get('f')), p['s'], None, {'a': c.get('from'), 'b': c.get('to')})
KINDS = ['added', 'moved_later', 'moved_earlier', 'permit', 'register', 'court', 'source_gone', 'page_change', 'verified', 'contradicted', 'completed']
idx = {'v': 'n35a-signals-1', 'built': BUILT, 'licence': LIC, 'kinds': KINDS, 'developers': {}, 'counts': Counter(), 'latest': []}
shards = defaultdict(dict); allev = []
for dv, es in ev.items():
    es = sorted(es, key=lambda e: (e['d'], e['k'], e.get('s', ''), e['t']), reverse=True)
    # one line per (day, kind, project, text): repeated rows collapse
    seen = set(); out = []
    for e in es:
        k = (e['d'], e['k'], e.get('s'), e['t'], e.get('u'), e.get('f'))
        if k in seen: continue
        seen.add(k); out.append(e)
    shards[CRC(dv) % 16][dv] = {'n': DEVN.get(dv) or (TR['d'].get(dv) or {}).get('n') or dv, 'e': out}
    c = Counter(e['k'] for e in out)
    idx['developers'][dv] = [DEVN.get(dv) or dv, len(out), out[0]['d'] if out else None]
    idx['counts'].update(c)
    for e in out:
        if e['k'] not in ('added', 'verified'): allev.append(dict(e, dv=dv))
wj('signals.json', {'v': 'n35a-signals-1', 'p': {k: v for i in range(16) for k, v in shards.get(i, {}).items()}})   # one file (the Pages deployment has a file count limit)
idx['counts'] = dict(idx['counts'])
idx['latest'] = sorted(allev, key=lambda e: (e['d'], e['dv'], e['k'], e.get('s', '')), reverse=True)[:150]
idx['sources'] = {'added|moved_later|moved_earlier|permit|verified|contradicted|completed': '/data/n34a/track-record.json (our dated snapshots)', 'register': '/data/register-changes.json',
                  'court': '/data/court-cases.json', 'source_gone': '/data/source-health.json (HTTP 4xx, 5xx or no answer at the last weekly read)', 'page_change': '/data/promise-drift.json (developer page text, daily fingerprints)'}
wj('signals-index.json', idx)

# ------------------------------------------------------------------------------------------------ 5. contradiction finder
SRCW = r'press|portal|agent|developer|broker|faq|brochure|register|profile|listing|mls|release|news|report|website|page|fact sheet|magazine|times|gazette|filing|prospectus|exchange|propsearch|bayut|property finder|a1 properties'
NOTSRC = r'updated|quota|approx|about|est\.?|projected|completed|calendar|phase|tower|block|unit mix|track record|sold|price|payment|total|net|gross|excl|incl'
def src_of(line):
    m = re.match(r'^([A-Za-z][\w .&/()-]{1,48}?):\s', line)
    if m and re.search(SRCW + r'|\.[a-z]{2,4}\b', m.group(1), re.I) and not re.search(NOTSRC, m.group(1), re.I): return re.sub(r'\s*\(.*?\)', '', m.group(1)).strip()
    m = re.search(r'\(([^()]{2,80})\)\s*$', line)
    if m:
        g = m.group(1).strip()
        if not re.match(r'^\d', g) and not re.search(NOTSRC, g, re.I) and (re.search(SRCW + r'|\.[a-z]{2,4}\b', g, re.I) or re.match(r'^[A-Z][A-Za-z0-9&]+(?:[ ,]+[A-Za-z0-9&]+){0,4}$', g)): return g
    m = re.match(r'^(Development profile|The brokerage update|trade press|press|portals?|agent listing)\b', line, re.I)
    if m: return m.group(1)
    return None
def rdate(line):
    m = re.search(r'\bread (\d{1,2} \w{3} \d{4})', line)
    if m and dmy(m.group(1)): return dmy(m.group(1)).isoformat()
    m = re.search(r'\bdated (\d{4}-\d{2}-\d{2})', line)
    return m.group(1) if m else None
QM = {'q1': 3, 'q2': 6, 'q3': 9, 'q4': 12}
MONTHS = 'january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec'
def ho_parse(s):
    """'Q2 2027' -> (2027-04, 2027-06); 'June 2027' -> month; '2027' -> year; returns (from_ym, to_ym, text)"""
    m = re.search(r'\b(Q[1-4])\s*(20\d\d)\b', s, re.I) or re.search(r'\b(20\d\d)[- ]?(Q[1-4])\b', s, re.I)
    if m:
        a, b = (m.group(1), m.group(2)) if m.group(1).upper().startswith('Q') else (m.group(2), m.group(1))
        y = int(b); e = QM[a.lower()]; return (y * 12 + e - 3, y * 12 + e - 1, m.group(0))
    m = re.search(r'\b(\d{1,2} )?(' + MONTHS + r')\.? (20\d\d)\b', s, re.I)
    if m:
        mo = MON[m.group(2).lower()[:3]]; y = int(m.group(3)); return (y * 12 + mo - 1, y * 12 + mo - 1, m.group(0))
    m = re.search(r'\b(20\d\d)\b', s)
    if m: y = int(m.group(1)); return (y * 12, y * 12 + 11, m.group(0))
    return None
HO_RE = re.compile(r'(?:handover|completion|complete[ds]?|delivery|ready|due)\b[^;,.]{0,30}?((?:Q[1-4]\s*20\d\d)|(?:20\d\d[- ]?Q[1-4])|(?:(?:\d{1,2} )?(?:' + MONTHS + r')\.? 20\d\d)|(?:20\d\d))', re.I)
UN_RE = re.compile(r'\b(\d{1,3}(?:,\d{3})*|\d+) (?:units|apartments|residences|homes)\b(?! (?:sold|reserved|left|remaining|available|per|in phase|phase))', re.I)
PR_RE = re.compile(r'\bfrom (?:about )?(AED|USD|EUR|GBP|THB|IDR|MYR|\$|€|£)\s?(\d[\d,.]*)\s*(k|m|million)?\b', re.I)
def money(cur, v, suf):
    try: x = float(v.replace(',', ''))
    except Exception: return None
    if suf: x *= 1e3 if suf.lower() == 'k' else 1e6
    return ({'$': 'USD', '€': 'EUR', '£': 'GBP'}.get(cur, cur.upper()), x)
contra = []
for p in P:
    obs = defaultdict(list)   # field -> [(value, source, date, text)]
    rec_d = (p.get('rvw') or {}).get('d') or p.get('ad')
    x = p['fx'].get('dld')
    if x and x.get('comp'):
        c = dd(x['comp']); obs['handover'].append(((c.year * 12 + c.month - 1, c.year * 12 + c.month - 1), 'DLD register', x.get('pd') or rec_d, 'registered completion ' + x['comp'], x.get('src')))
    if x and x.get('units'): obs['units'].append((int(x['units']), 'DLD register', x.get('pd') or rec_d, str(x['units']) + ' units on the register', x.get('src')))
    for line in p['dl']:
        sr = src_of(line)
        if not sr: continue
        if re.match(r'DLD', sr): continue   # the register line is the fx.dld record above
        d0 = rdate(line) or rec_d
        if not re.search(r'phase|tower [a-z0-9]\b|first|building \d|block|track record|portfolio|delivered|completed projects|earlier|previous|other project|sold|20\d\d\s*(?:to|-|–|and)\s*(?:[A-Za-z]+ )?20\d\d', line, re.I):
            for m in HO_RE.finditer(line):
                h = ho_parse(m.group(1))
                if h: obs['handover'].append(((h[0], h[1]), sr, d0, line[:160], None)); break
            m = UN_RE.search(line)
            if m and int(m.group(1).replace(',', '')) >= 8 and not re.search(r'bedroom and \d', line, re.I) and len(re.findall(r'\b\d[\d,]* (?:units|apartments|residences|homes|villas|townhouses|penthouses|duplexes|keys|shops)\b', line, re.I)) == 1: obs['units'].append((int(m.group(1).replace(',', '')), sr, d0, line[:160], None))
        m = PR_RE.search(line)
        if m:
            mv = money(m.group(1), m.group(2), m.group(3))
            if mv and mv[1] > 1000: obs['price'].append((mv, sr, d0, line[:160], None))
    found = []
    hs = obs['handover']
    for i in range(len(hs)):
        for j in range(i + 1, len(hs)):
            a, b = hs[i], hs[j]
            if a[1].lower() == b[1].lower(): continue
            if a[0][1] < b[0][0] or b[0][1] < a[0][0]:
                gapm = max(b[0][0] - a[0][1], a[0][0] - b[0][1])
                if gapm >= 3: found.append(('handover', a, b, gapm))
    us = obs['units']
    for i in range(len(us)):
        for j in range(i + 1, len(us)):
            a, b = us[i], us[j]
            if a[1].lower() == b[1].lower() or a[0] == b[0]: continue
            hi, lo = max(a[0], b[0]), min(a[0], b[0])
            if hi - lo >= 2 and (hi - lo) / hi >= .05: found.append(('units', a, b, round(100 * (hi - lo) / hi)))
    ps_ = obs['price']
    for i in range(len(ps_)):
        for j in range(i + 1, len(ps_)):
            a, b = ps_[i], ps_[j]
            if a[1].lower() == b[1].lower() or a[0][0] != b[0][0]: continue
            hi, lo = max(a[0][1], b[0][1]), min(a[0][1], b[0][1])
            if (hi - lo) / hi >= .1: found.append(('price', a, b, round(100 * (hi - lo) / hi)))
    best = {}
    for f, a, b, g in found:
        if f not in best or g > best[f][3]: best[f] = (f, a, b, g)
    for f, a, b, g in best.values():
        fmt = lambda o: {'v': (o[0][1] if f == 'price' else o[0]) if f != 'handover' else o[3][:160] if o[1] != 'DLD register' else o[3], 'src': o[1], 'd': o[2], 't': o[3], 'u': o[4]}
        A, B = fmt(a), fmt(b)
        if f == 'price': A['c'] = a[0][0]; B['c'] = b[0][0]
        if f == 'handover':
            A['h'] = '%d-%02d' % divmod(a[0][0], 12) if a[0][0] == a[0][1] else None; B['h'] = None
        contra.append({'id': p['id'], 's': p['s'], 'n': p['n'], 'dv': p['dv'], 'dvs': p['dvs'], 'mk': p['mk'], 'f': f, 'g': g, 'a': A, 'b': B})
cc = Counter(c['f'] for c in contra)
wj('contradictions.json', {'v': 'n35a-contradictions-1', 'built': BUILT, 'licence': LIC, 'projects_read': len(P), 'counts': dict(cc), 'projects': len({c['id'] for c in contra}),
    'method': {'sources': 'each fact line of a project record names its source (a bracket at the end, or a prefix such as "press:" or "portals:"); the DLD register record is one more source for Dubai',
               'handover': 'two sources disagree when their dates cannot both be true: a quarter covers 3 months, a month 1, a year 12; disagreements under 3 months apart are ignored; lines about one phase, tower or building are skipped',
               'units': 'two sources give unit counts that differ by 2 or more and by 5% or more; lines about one phase, tower or building are skipped',
               'price': 'two sources give a "from" price in the same currency that differs by 10% or more (prices change over time: the dates are shown)',
               'not_checked': 'permit numbers: our records keep one permit number per project, with the source that prints it, so no second value exists to compare yet',
               'limits': 'A disagreement between two sources is a reason to ask, not a finding: one source may be older, may describe one phase, or may round.'},
    'items': sorted(contra, key=lambda c: (c['f'], -c['g'], c['id']))})

# ------------------------------------------------------------------------------------------------ 6. cross-language entity resolution
SA = rj('search-aliases.json')
CYR = dict(zip('абвгдеёжзийклмнопрстуфхцчшщъыьэюя', ['a', 'b', 'v', 'g', 'd', 'e', 'e', 'zh', 'z', 'i', 'y', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'u', 'f', 'kh', 'ts', 'ch', 'sh', 'shch', '', 'y', '', 'e', 'yu', 'ya']))
GRK = dict(zip('αβγδεζηθικλμνξοπρστυφχψωάέήίόύώςϊϋ', ['a', 'v', 'g', 'd', 'e', 'z', 'i', 'th', 'i', 'k', 'l', 'm', 'n', 'x', 'o', 'p', 'r', 's', 't', 'y', 'f', 'ch', 'ps', 'o', 'a', 'e', 'i', 'i', 'o', 'y', 'o', 's', 'i', 'y']))
LEGAL = r'\b(l\.?l\.?c|pjsc|p\.?j\.?s\.?c|pcl|plc|bhd|berhad|sdn|s\.?a|s\.?l|s\.?p\.?a|ltd|limited|inc|corp|corporation|gmbh|ag|bv|nv|llp|co|company|group|holding|holdings|developments?|properties|property|real estate|development|investments?|tbk|pt|jsc|ooo|s\.?o\.?c|fzco|fze|dmcc|est|establishment)\b'
def key(s):
    s = unicodedata.normalize('NFKC', s or '').lower()
    s = ''.join(CYR.get(c, GRK.get(c, c)) for c in s)
    s = ''.join(c for c in unicodedata.normalize('NFKD', s) if not unicodedata.combining(c))
    s = s.replace('&', ' and ')
    s = re.sub(LEGAL, ' ', s); s = re.sub(r'[^\w]+', ' ', s, flags=re.U)
    return re.sub(r'\s+', ' ', s).strip()
al = []   # [canonical, kind, slug, alias, script, basis, source]
def script(s):
    for k, r in [('Arabic', '[؀-ۿ]'), ('Chinese', '[一-鿿]'), ('Cyrillic', '[Ѐ-ӿ]'), ('Thai', '[฀-๿]'), ('Greek', '[Ͱ-Ͽ]'), ('Japanese kana', '[぀-ヿ]')]:
        if re.search(r, s): return k
    return 'Latin'
for mk, tr in SA['markets'].items():
    for l, v in tr.items():
        if v and v != mk: al.append([mk, 'market', re.sub(r'\s+', '-', mk.lower()), v, script(v), 'place name in ' + l, '/data/search-aliases.json'])
seen_dev = set()
for p in P:
    fx = p['fx']; dc = fx.get('developer_company')
    if dc and p['dvs'] not in seen_dev:
        part = re.split(r'\s*[(,;]|\s/\s|\s(?:with|via|part of|subsidiary|controlled|owned)\b', dc)[0].strip()
        if 3 < len(part) < 80 and re.search(LEGAL, part.lower()) and key(part) != key(p['dv']) and (key(p['dv']) in key(part) or key(part) in key(p['dv']) or len(set(key(part).split()) & set(key(p['dv']).split()))):
            al.append([p['dv'], 'developer', p['dvs'], part, script(part), 'registered company name in the record', '/projects/' + p['s'] + '/']); seen_dev.add(p['dvs'])
        m = re.search(r'([\u0600-\u06ff][\u0600-\u06ff ]{3,80})', dc)
        if m: al.append([p['dv'], 'developer', p['dvs'], m.group(1).strip(), 'Arabic', 'registered company name in the record', '/projects/' + p['s'] + '/'])
    # native-script names printed in our sources
    # (the project name as printed in an official register in its own script, e.g. the Thai ONEP EIA register)
    for c in p['cl'] + [[s] for s in p['dl']] + [[v] for v in p['ev'].values()]:
        s = str(c[0] if c else '')
        for m in re.finditer(r"(?:EIA for|register(?:ed)? as|named) '([฀-๿一-鿿؀-ۿЀ-ӿ][^']{2,60})'", s):
            v = m.group(1).strip(); al.append([p['n'], 'project', p['s'], v, script(v), 'name printed in an official register cited by the record', '/projects/' + p['s'] + '/'])
    if script(p['n']) != 'Latin':
        m = re.match(r'^([^(]+?)\s*\(([^)]+)\)', p['n'])
        if m: al.append([p['n'], 'project', p['s'], m.group(2), 'Latin', 'English name printed with the project name', '/projects/' + p['s'] + '/']); al.append([p['n'], 'project', p['s'], m.group(1), script(m.group(1)), 'project name as marketed', '/projects/' + p['s'] + '/'])
for a, b in (N.get('aliases', {}).get('developers') or {}).items():
    al.append([DEVN.get(b, b), 'developer', b, a.replace('-', ' '), 'Latin', 'earlier slug of the developer page (redirects)', '/developers/' + b + '/'])
uniq = {}
for r in al:
    if r[0] and r[3]: uniq[(r[1], r[2], r[3])] = r
al = sorted(uniq.values(), key=lambda r: (r[1], (r[0] or '').lower(), r[3]))
coll = defaultdict(set)
for p in P: coll[key(p['dv'])].add(p['dvs'])
wj('aliases.json', {'v': 'n35a-aliases-1', 'built': BUILT, 'licence': LIC, 'columns': ['canonical', 'kind', 'slug', 'alias', 'script', 'basis', 'source'], 'rows': al,
    'counts': dict(Counter(r[4] for r in al)), 'kinds': dict(Counter(r[1] for r in al)),
    'rule': ['1. Exact alias: the query, in any script, equals an alias in this table (after Unicode NFKC and lower case) -> the canonical entity.',
             '2. Matching key: lower case, Cyrillic transliterated (GOST 7.79 system B, simplified), Greek transliterated (ELOT 743, simplified), accents removed, "&" read as "and", legal and generic words removed (LLC, PJSC, PCL, Bhd, S.A., Ltd, Group, Properties, Developments and similar), punctuation removed. Two names with the same key are the same entity.',
             '3. Arabic, Chinese, Japanese and Thai are never transliterated by rule: they match only through rule 1, with an alias printed in one of our sources.',
             '4. No fuzzy matching: a key that matches more than one developer is shown as ambiguous, never merged.'],
    'key_collisions': sorted([k, sorted(v)] for k, v in coll.items() if len(v) > 1)[:200],
    'cyr': ''.join(CYR.keys()), 'cyr_lat': list(CYR.values()), 'grk': ''.join(GRK.keys()), 'grk_lat': list(GRK.values()), 'legal': LEGAL})

def plainq(s): return re.sub(r'\s+', ' ', ''.join(c for c in unicodedata.normalize('NFKD', unicodedata.normalize('NFKC', s or '').lower()) if not unicodedata.combining(c))).strip()
aq = sorted({(plainq(r[3]), r[0]) for r in al if len(plainq(r[3])) >= 3 and plainq(r[3]) != plainq(r[0])})
dk = sorted({(key(p['dv']), p['dv']) for p in P if len(key(p['dv'])) >= 4})
wj('alias-q.json', {'v': 'n35a-alias-q-1', 'built': BUILT, 'about': 'compact alias table for the site search and the command palette (rule: /data/aliases/)', 'a': [list(x) for x in aq], 'd': [list(x) for x in dk],
    'cyr': ''.join(CYR.keys()), 'cyr_lat': list(CYR.values()), 'grk': ''.join(GRK.keys()), 'grk_lat': list(GRK.values()), 'legal': LEGAL})

# ------------------------------------------------------------------------------------------------ 7. data dictionary
DC = rj('sql/datacard.json')
rows = list(csv.DictReader(open(os.path.join(D, 'sql/projects.csv'), encoding='utf-8')))
mk_n = Counter(r['market'] for r in rows); top = [m for m, _ in mk_n.most_common(12)]
SRC_T = {'id': 'ours', 'slug': 'ours', 'name': 'developer, portals', 'developer': 'developer, registers', 'developer_slug': 'ours', 'market': 'ours', 'country': 'ours', 'area': 'developer, portals',
         'stage': 'developer, registers, satellite', 'sales_status': 'developer, portals', 'developer_page': 'developer', 'permit_number': 'registers, developer, portals', 'handover_on_record': 'developer, portals',
         'handover_month': 'ours (derived)', 'first_handover_on_record': 'ours (dated snapshots)', 'first_handover_month': 'ours (derived)', 'delay_months': 'ours (derived)', 'construction_start': 'developer, registers',
         'price_min': 'developer, portals', 'price_max': 'developer, portals', 'currency': 'developer, portals', 'size_min_m2': 'developer, portals', 'size_max_m2': 'developer, portals', 'price_per_m2_min': 'ours (derived)',
         'deposit_pct': 'developer', 'payment_plan': 'developer, portals', 'foreign_ownership': 'developer, law', 'permit_authority': 'registers, law', 'registered_company': 'registers', 'lat': 'developer, maps', 'lng': 'developer, maps',
         'dld_project_number': 'registers (DLD)', 'dld_status': 'registers (DLD)', 'dld_percent_built': 'registers (DLD)', 'dld_inspection_date': 'registers (DLD)', 'dld_completion_date': 'registers (DLD)', 'dld_units': 'registers (DLD)',
         'escrow_bank': 'registers (DLD)', 'dld_source': 'registers (DLD)', 'claims': 'ours', 'claims_verified': 'ours', 'claims_unverified': 'ours', 'claims_contradicted': 'ours', 'sources': 'ours', 'added': 'ours', 'reviewed': 'ours',
         'review_date': 'ours', 'record_sha256': 'ours (derived)', 'page': 'ours'}
cols = DC['files'][0]['columns']
dic = []
for c in cols:
    nm = c['name']; filled = [r for r in rows if (r.get(nm) or '').strip() not in ('', 'None', 'null')]
    per = {m: round(100 * sum(1 for r in filled if r['market'] == m) / mk_n[m]) for m in top}
    dic.append({'f': nm, 'type': c['type'], 'def': c['description'], 'cov': round(100 * len(filled) / len(rows), 1), 'n': len(filled), 'per': per, 'src': SRC_T.get(nm, 'ours'), 'code': '/open/n32x-build.py'})
wj('dictionary.json', {'v': 'n35a-dictionary-1', 'built': BUILT, 'licence': LIC, 'table': 'projects', 'rows': len(rows), 'markets': top, 'market_rows': {m: mk_n[m] for m in top}, 'dataset': DC['version'],
    'from': ['/data/sql/datacard.json (types and definitions)', '/data/sql/projects.csv (coverage)', '/open/n32x-build.py (the code that fills each column from /data/named.json)'], 'fields': dic,
    'source_types': {'developer': 'the developer website or brochure', 'portals': 'listing portals and agencies', 'registers': 'official registers (DLD, RERA, ONEP, TEDUH, Companies House and others)', 'satellite': 'Copernicus Sentinel-2', 'maps': 'map pins from the developer or OpenStreetMap', 'law': 'published law or regulator pages', 'ours': 'set by Kolaboro (ids, counts, dates of our own reads)', 'ours (derived)': 'computed by us from other fields', 'ours (dated snapshots)': 'from our dated daily copies of the dataset'}})

# ------------------------------------------------------------------------------------------------ 9. ask-the-data vocabulary (markets and developers the question parser can name)
mk_all = Counter(r['market'] for r in rows if r['market']); dv_all = Counter(r['developer'] for r in rows if r['developer'])
SAM = SA['markets']
tok = defaultdict(set)
for nm in dv_all:
    ws = [w for w in key(nm).split() if len(w) >= 4]
    if ws: tok[ws[0]].add(nm)
short = {w: next(iter(v)) for w, v in tok.items() if len(v) == 1 and dv_all[next(iter(v))] >= 3 and w not in {k.lower() for k in mk_all} and w not in ('dubai', 'bali', 'grand', 'royal', 'ocean', 'golden', 'green', 'city', 'park', 'palm', 'home', 'homes', 'living', 'land', 'casa', 'villa', 'villas')}
wj('ask-vocab.json', {'v': 'n35a-ask-vocab-1', 'built': BUILT, 'dataset': DC['version'], 'markets': [[m, n, SAM.get(m, {})] for m, n in mk_all.most_common()],
    'developers': [[d, n] for d, n in dv_all.most_common() if n >= 2], 'dev_short': short, 'cyr': ''.join(CYR.keys()), 'cyr_lat': list(CYR.values())})

# ------------------------------------------------------------------------------------------------ 10. satellite change feed
CI = rj('construction-index.json')
m0 = CI['projects'][0]['m0'] if CI['projects'] else '2017-01'
def mlab(i, m0):
    y, m = map(int, m0.split('-')); t = y * 12 + m - 1 + i; return '%d-%02d' % divmod(t, 12) if False else '%d-%02d' % (t // 12, t % 12 + 1)
feed = []
for x in CI['projects']:
    s = x.get('sm') or []; ii = [i for i, v in enumerate(s) if v is not None]
    if len(ii) < 2: continue
    a, b = ii[-2], ii[-1]
    feed.append({'id': x['id'], 's': x['s'], 'n': x['n'], 'mk': x['mk'], 'm_prev': mlab(a, x.get('m0', m0)), 'v_prev': s[a], 'm_last': mlab(b, x.get('m0', m0)), 'v_last': s[b], 'ch': s[b] - s[a],
                 'raw_prev': (x.get('i') or [None] * (a + 1))[a], 'raw_last': (x.get('i') or [None] * (b + 1))[b], 'up': x.get('up'), 'clear': x.get('clear')})
months = Counter(f['m_last'] for f in feed)
wj('satchange.json', {'v': 'n35a-satchange-1', 'built': CI.get('built'), 'licence': LIC, 'source': CI['source'], 'input': '/data/construction-index.json (built ' + str(CI.get('built')) + ', ' + str(len(CI['projects'])) + ' projects)',
    'method': 'For each project with a precise pin, the smoothed Sentinel-2 built-up index (median of the last 3 clear months, in percentage points against the ring 300 to 600 m away and the first clear months; see /satellite/construction-index/) at its last two clear months. Change = last minus previous. Grouped by the month of the last clear reading. A change of under 5 points is within month-to-month noise.',
    'limits': 'At 10 m a cleared plot and a concrete slab look alike, clouds leave gaps, and a change can come from the surroundings. A reading, not a verdict.',
    'months': sorted(months.items(), reverse=True), 'items': sorted(feed, key=lambda f: (-abs(f['ch']), f['id']))})

# ------------------------------------------------------------------------------------------------ build record
ins = {i: sha_file(os.path.join(D, i)) for i in INPUTS if os.path.exists(os.path.join(D, i))}
rec = {'v': 'n35a-build-1', 'built': BUILT, 'script': '/open/n35a-build.py', 'inputs': ins, 'outputs': dict(sorted(OUTS.items()))}
if CHECK:
    old = rj('n35a/build.json') or {}
    bad = [k for k, v in OUTS.items() if (old.get('outputs') or {}).get(k) != v]
    print('check:', 'ALL IDENTICAL' if not bad else 'DIFFERENT: ' + ', '.join(bad)); sys.exit(1 if bad else 0)
wj('build.json', rec)
print(json.dumps({'pace': pace_sum['compared'], 'proj': pace_sum['with_projection'], 'asking_areas': len(areas), 'banks': len(bk), 'bank_projects': nb,
                  'signals_devs': len(ev), 'signals': sum(len(v) for v in ev.values()), 'contradictions': len(contra), 'vocab_dev_short': len(short), 'aliases': len(al), 'dict': len(dic), 'sat': len(feed)}))
