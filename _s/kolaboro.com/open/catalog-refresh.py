#!/usr/bin/env python3
# Kolaboro batch 37 round 4 (r4u, 23 Nov 2026): refresh /data/catalog.json and /data/catalog.jsonld between runs of the
# catalog workflow, from the files as published on this branch. No network, no model.
# For every dataset whose file is on the branch and whose bytes changed: new bytes, SHA-256, row count, stamp and
# data_as_of. Row count rule: the length of the top-level list named by rows_unit, else of the largest top-level list or
# object (the rule reproduces the stored row count of every unchanged file it applies to; files where it does not are
# left with their stored count). Contracts, HTTP probes and freshness status are left as the workflow wrote them.
# Run: python3 open/catalog-refresh.py <branch root, default .>
import json, sys, os, hashlib, datetime

ROOT = os.path.join(sys.argv[1] if len(sys.argv) > 1 else '.', '_s/kolaboro.com')
P = os.path.join(ROOT, 'data/catalog.json'); PL = os.path.join(ROOT, 'data/catalog.jsonld')
import re as _re
# n40 k10: heal a merge left with conflict markers by two agents refreshing at once (keep the first side; this script rewrites the values anyway)
def _heal(t): return _re.sub(r'<<<<<<< [^\n]*\n(.*?)=======\n.*?>>>>>>> [^\n]*\n', r'\1', t, flags=_re.S)
raw = _heal(open(P, encoding='utf-8').read()); c = json.loads(raw)
SKIP = {'seal', 'ships', 'db', 'meta', 'schema', 'links'}

def rows_of(j, unit):
    if isinstance(j, list): return len(j)
    if not isinstance(j, dict): return None
    if unit and isinstance(j.get(unit), (list, dict)): return len(j[unit])
    best = None
    for k, v in j.items():
        if k in SKIP or not isinstance(v, (list, dict)): continue
        if best is None or len(v) > best: best = len(v)
    return best

def local(d):
    u = d.get('url') or ''
    if not u.startswith('https://kolaboro.com/data/') or d.get('file_count'): return None
    p = ROOT + u[len('https://kolaboro.com'):]
    return p if os.path.isfile(p) else None

# 1. which datasets the rule reproduces
ok_rule = set(); changed = []
for d in c['datasets']:
    p = local(d)
    if not p: continue
    b = open(p, 'rb').read(); h = hashlib.sha256(b).hexdigest()
    j = None
    if p.endswith('.json'):
        try: j = json.loads(b)
        except Exception: j = None
    if h == d.get('sha256'):
        if j is not None and d.get('rows') is not None and rows_of(j, d.get('rows_unit')) == d['rows']: ok_rule.add(d['id'])
        continue
    changed.append((d, b, h, j))
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
by_url = {}; log = []
for d, b, h, j in changed:
    old = (d.get('bytes'), d.get('rows'))
    d['bytes'] = len(b); d['sha256'] = h
    if j is not None and d.get('rows') is not None:
        r = rows_of(j, d.get('rows_unit'))
        if r is not None: d['rows'] = r
    elif d.get('rows') is not None and d['url'].endswith('.parquet'):
        try:
            import pyarrow.parquet as pq; d['rows'] = pq.ParquetFile(ROOT + d['url'][len('https://kolaboro.com'):]).metadata.num_rows
        except Exception: pass
    fr = d.get('freshness') or {}
    k = fr.get('stamp_key')
    if k and isinstance(j, dict) and isinstance(j.get(k), str):
        st = j[k]; fr['stamp'] = st; fr['date_only'] = len(st) == 10
        fr['data_as_of'] = (st + 'T00:00:00Z') if len(st) == 10 else st[:19] + 'Z'
        d['last_updated'] = fr['data_as_of']
    by_url[d['url']] = d
    log.append([d['id'], old[0], d['bytes'], old[1], d.get('rows')])
c['summary']['bytes'] = sum(x.get('bytes') or 0 for x in c['datasets'])
c['refreshed'] = {'at': now, 'by': 'https://kolaboro.com/open/catalog-refresh.py', 'datasets_changed': len(log),
                  'note': 'Sizes, hashes, row counts and stamps of files changed since generated_at, read from the published files. Contracts, probes and freshness status are from generated_at.'}
open(P, 'w', encoding='utf-8').write(json.dumps(c, ensure_ascii=False, indent=1 if raw.startswith('{\n') else None) + ('\n' if raw.endswith('\n') else ''))
# 2. the DCAT copy
if os.path.isfile(PL):
    rl = _heal(open(PL, encoding='utf-8').read()); L = json.loads(rl); n = 0
    for ds in L.get('dcat:dataset', []):
        for di in ds.get('dcat:distribution', []) or []:
            d = by_url.get(((di.get('dcat:downloadURL') or {}).get('@id')) or '')
            if not d: continue
            di['dcat:byteSize'] = {'@value': str(d['bytes']), '@type': 'xsd:nonNegativeInteger'}
            ck = di.get('spdx:checksum')
            if isinstance(ck, dict) and 'spdx:checksumValue' in ck: ck['spdx:checksumValue'] = d['sha256']
            if d.get('last_updated'): ds['dct:modified'] = {'@value': d['last_updated'], '@type': 'xsd:dateTime'}
            n += 1
    L['dct:modified'] = {'@value': now, '@type': 'xsd:dateTime'}
    open(PL, 'w', encoding='utf-8').write(json.dumps(L, ensure_ascii=False, indent=1 if rl.startswith('{\n') else None) + ('\n' if rl.endswith('\n') else ''))
    print('jsonld distributions updated', n)
print('rule reproduces', len(ok_rule), 'unchanged files; changed', len(log))
for x in log: print(' ', x)
# 3. n40 k49: the per-market slices of /data/bali-cases.json (/data/m/, open/market-slices.py) follow the file when a hand-made
#    data commit changed it; nothing is written when they are current. Messages go to stderr, so the last stdout line stays the same.
try:
    MS = os.path.join(ROOT, 'data', 'm', 'index.json'); BC = os.path.join(ROOT, 'data', 'bali-cases.json')
    if os.path.isfile(MS) and os.path.isfile(BC) and json.load(open(MS)).get('sha') != hashlib.sha256(open(BC, 'rb').read()).hexdigest()[:16]:
        import subprocess
        r = subprocess.run([sys.executable, os.path.join(ROOT, 'open', 'market-slices.py'), BC], capture_output=True, text=True, timeout=120)
        sys.stderr.write((r.stdout or r.stderr).strip()[-300:] + '\n')
except Exception as e:
    sys.stderr.write('market slices not refreshed: %s\n' % e)
# 4. n40 k61: the developer buckets of /data/dv/ (open/dev-slices.mjs, needs node and npx esbuild) follow named.json and bali-cases.json the
#    same way; when they cannot be rebuilt here the worker sees the old hashes and builds developer pages from the full files.
try:
    DI = os.path.join(ROOT, 'data', 'dv', 'index.json'); NJ = os.path.join(ROOT, 'data', 'named.json')
    if os.path.isfile(DI) and os.path.isfile(BC) and os.path.isfile(NJ):
        h = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()[:16]
        if json.load(open(DI)).get('sha') != h(NJ) + h(BC):
            import subprocess
            r = subprocess.run(['node', os.path.join(ROOT, 'open', 'dev-slices.mjs'), ROOT], capture_output=True, text=True, timeout=300)
            sys.stderr.write((r.stdout or r.stderr).strip()[-300:] + '\n')
except Exception as e:
    sys.stderr.write('developer slices not refreshed: %s\n' % e)
