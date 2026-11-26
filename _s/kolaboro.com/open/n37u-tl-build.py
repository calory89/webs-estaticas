#!/usr/bin/env python3
# Kolaboro batch 37 round 4 (r4u, 23 Nov 2026): fact timeline per project.
# Reads the daily copies of /data/named.json listed in /data/snapshots/index.json (hash-chained, CC BY 4.0) and, for the
# key facts that named.json carries (handover, permit or registration, units, starting price, legal entity, escrow,
# construction %, official register entry), records each day the value we held changed: first seen, changed, dropped.
# Facts are derived with the same rules as /open/n37u-build.py. Satellite readings and court cases are not in named.json,
# so they have no timeline here. No network, no model. Writes /data/n37u-tl.json:
#   days   snapshot days, oldest first (with the SHA-256 of each copy)
#   p      slug -> {field: [[day index, value or null], ...]}  (null = we no longer held a value that day)
# The record page adds today's value from /data/n37u.json when it differs from the last snapshot.
# Run: python3 open/n37u-tl-build.py <branch root, default .>
import json, sys, os, gzip, re, hashlib

ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
D = os.path.join(ROOT, '_s/kolaboro.com/data')
COI = re.compile(r'eco\s*beach|\bequinox\b|\bsumba\b', re.I)
F = ['ho', 'pn', 'un', 'pr', 'co', 'es', 'cp', 'reg']
num = lambda v: int(v) if isinstance(v, float) and v.is_integer() else v

def facts(x):
    fx = x.get('fx') or {}; dld = fx.get('dld') or {}; rw = x.get('rw') or {}; ev = x.get('ev') or {}; c = {}
    if dld.get('comp'): c['ho'] = str(dld['comp'])
    elif fx.get('handover_promised'): c['ho'] = str(fx['handover_promised'])
    if x.get('pn'): c['pn'] = str(x['pn'])
    elif dld.get('no'): c['pn'] = 'DLD ' + str(dld['no'])
    elif rw.get('code'): c['pn'] = str(rw['code'])
    if dld.get('units'): c['un'] = str(num(dld['units']))
    if fx.get('price_min'):
        try: c['pr'] = (fx.get('currency') or '') + ' ' + format(num(fx['price_min']), ',')
        except Exception: c['pr'] = str(fx['price_min'])
    if fx.get('developer_company'): c['co'] = str(fx['developer_company'])
    if dld.get('bank'): c['es'] = str(dld['bank'])
    elif ev.get('escrow'): c['es'] = str(ev['escrow'])[:140]
    if dld.get('pct') is not None and dld.get('pd'): c['cp'] = str(num(dld['pct'])) + '%'
    if rw.get('register'): c['reg'] = rw['register'] + (': ' + rw['item'] if rw.get('item') else '') + (' (' + rw['status'] + ')' if rw.get('status') else '')
    return {k: v.strip() for k, v in c.items()}

idx = json.load(open(os.path.join(D, 'snapshots/index.json'), encoding='utf-8'))
days, P = [], {}
for e in sorted(idx['entries'], key=lambda e: e['day']):
    p = os.path.join(ROOT, '_s/kolaboro.com' + e['copy'])
    if not os.path.isfile(p): continue
    b = gzip.decompress(open(p, 'rb').read())
    if hashlib.sha256(b).hexdigest() != e['sha256']: print('hash mismatch, skipped', e['day']); continue
    i = len(days); days.append([e['day'], e['sha256']])
    seen = set()
    for x in json.loads(b).get('projects', []):
        s = x.get('s')
        if not s or COI.search(' '.join(str(x.get(k) or '') for k in ('n', 'dv', 'mk', 'ar', 's'))): continue
        seen.add(s); c = facts(x); h = P.setdefault(s, {})
        for f in F:
            v = c.get(f); t = h.get(f)
            if t is None:
                if v is not None: h[f] = [[i, v]]
            elif t[-1][1] != v: t.append([i, v])
    for s, h in P.items():           # a project missing from a later copy: its facts were not held that day
        if s in seen: continue
        for f, t in h.items():
            if t[-1][1] is not None: t.append([i, None])
out = {'v': 'n37u-tl-1', 'from': '/data/snapshots/index.json', 'fields': F, 'days': days, 'p': {s: h for s, h in P.items() if h}}
json.dump(out, open(os.path.join(D, 'n37u-tl.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
ch = sum(len(t) for h in out['p'].values() for t in h.values())
mv = sum(1 for h in out['p'].values() for t in h.values() if len(t) > 1)
print('n37u-tl.json', len(days), 'days,', len(out['p']), 'projects,', ch, 'dated values,', mv, 'facts that changed at least once')
