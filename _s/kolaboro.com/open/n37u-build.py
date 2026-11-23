#!/usr/bin/env python3
# Kolaboro batch 37 round 1 (r1u, 23 Nov 2026): the project record, field by field.
# Reads only files already published under /data/ (no network, no model) and writes /data/n37u.json:
#   f    the 10 key fields we track per project, in a fixed order
#   p    per project: [id, slug, name, market, area, developer slug, developer, known mask, cells]
#        cell = [value, source url or "", source kind, date read] or 0 when we hold nothing for that field
#   mk   per market (5+ projects): projects, share of records holding each field (%), median fields held
#   rg   official registers per market or country, from /data/register-checks.json (the list on /registers/,
#        each probed by our checker), with the fields they can confirm
# Source kinds: reg = official register or its published mirror, dev = the developer's own site, portal = a listing
# portal, web = another web page we read, sat = our Sentinel-2 reading, rec = our record (sources listed on the project page).
# Sumba, Eco Beach City and Equinox are left out. Run: python3 open/n37u-build.py <site root, default .>
import json, sys, os, statistics, re
from urllib.parse import urlparse

ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
D = os.path.join(ROOT, '_s/kolaboro.com/data')
J = lambda p: json.load(open(os.path.join(D, p), encoding='utf-8'))
COI = re.compile(r'eco\s*beach|\bequinox\b|\bsumba\b', re.I)
F = ['ho', 'pn', 'un', 'pr', 'co', 'es', 'cp', 'sat', 'reg', 'ct']
PORTALS = {'propertyfinder.ae', 'a1properties.ae', 'condoblackbook.com', 'apartments.com.au', 'rumavi.com', 'apto.vc', 'fumbatown.agency',
           'emlakplatform.com.tr', 'lucasfox.com', 'palmera.realestate', 'off-planproperties.ae', 'bayut.com', 'fazwaz.com', 'hipflat.co.th',
           'ddproperty.com', 'propertyguru.com.sg', 'iproperty.com.my', 'idealista.com', 'rightmove.co.uk', 'zoopla.co.uk', 'thailand-property.com',
           'dotproperty.co.th', 'edgeprop.my', 'batdongsan.com.vn', 'lamudi.com.ph', 'realestate.com.au', 'domain.com.au', 'zillow.com', 'kyero.com'}
MIRRORS = {'dubairealestateiq.com'}   # published mirrors of an official register, labelled as such on the project page

named = J('named.json'); P = [x for x in named['projects'] if not COI.search(' '.join(str(x.get(k) or '') for k in ('n', 'dv', 'mk', 'ar', 's')))]
cp = J('construction-progress.json').get('projects', {})
cc = J('court-cases.json').get('cases', [])
cases_by_dev = {}
for c in cc:
    if c.get('dev'): cases_by_dev.setdefault(c['dev'], []).append(c)
regs = J('register-checks.json').get('registers', [])

def host(u):
    try: return (urlparse(u).hostname or '').replace('www.', '')
    except Exception: return ''
def kind(u, x):
    h = host(u)
    if not h: return 'rec'
    if h in MIRRORS: return 'reg'
    if h in PORTALS: return 'portal'
    if any(len(t) > 3 and t in h.replace('-', '') for t in (x.get('dvs') or '').split('-')): return 'dev'
    if x.get('du') and host(x['du']) == h: return 'dev'
    return 'web'
def read_date(x): return x.get('sealed') or x.get('ad') or ''
def num(v):
    return int(v) if isinstance(v, float) and v.is_integer() else v

rows = []
for x in P:
    fx = x.get('fx') or {}; dld = fx.get('dld') or {}; rw = x.get('rw') or {}; rv = x.get('rvw') or {}; ev = x.get('ev') or {}
    dsrc = dld.get('src') or ''; rwd = rw.get('checked') or ''
    c = {}
    if dld.get('comp'): c['ho'] = [dld['comp'], dsrc, 'reg', rwd or dld.get('pd') or '']
    elif fx.get('handover_promised'): c['ho'] = [fx['handover_promised'], x['url'], kind(x['url'], x), read_date(x)]
    if x.get('pn'): c['pn'] = [x['pn'], x['url'], kind(x['url'], x), read_date(x)]
    elif dld.get('no'): c['pn'] = ['DLD ' + str(dld['no']), dsrc, 'reg', rwd]
    elif rw.get('code'): c['pn'] = [str(rw['code']), (rv.get('reg') or [None, None, ''])[2] or '', 'reg', rwd]
    if dld.get('units'): c['un'] = [num(dld['units']), dsrc, 'reg', rwd]
    if fx.get('price_min'): c['pr'] = [(fx.get('currency') or '') + ' ' + format(num(fx['price_min']), ','), x['url'], kind(x['url'], x), read_date(x)]
    if fx.get('developer_company'):
        dc = fx['developer_company']
        c['co'] = [dc, dsrc, 'reg', rwd] if dld and 'DLD developer' in dc else [dc, '', 'rec', read_date(x)]
    if dld.get('bank'): c['es'] = [dld['bank'], dsrc, 'reg', rwd]
    elif ev.get('escrow'): c['es'] = [ev['escrow'][:140], '', 'rec', read_date(x)]
    if dld.get('pct') is not None and dld.get('pd'): c['cp'] = [str(num(dld['pct'])) + '%', dsrc, 'reg', dld['pd']]
    s = cp.get(x['id'])
    if s and s.get('status') == 'ok' and s.get('sum'):
        sm = s['sum']; c['sat'] = [str(sm.get('b_first')) + '% > ' + str(sm.get('b_last')) + '%', '/satellite/construction-index/', 'sat', (sm.get('last') or ['', ''])[1]]
    if rw.get('register'):
        u = (rv.get('reg') or [None, None, ''])[2] or dsrc
        c['reg'] = [rw['register'] + (': ' + rw['item'] if rw.get('item') else '') + (' (' + rw['status'] + ')' if rw.get('status') else ''), u or '', 'reg', rwd]
    dc = cases_by_dev.get(x.get('dvs') or '')
    if dc: c['ct'] = [len(dc), '/courts/', 'reg', max(k.get('date') or '' for k in dc)]
    mask = ''.join('1' if f in c else '0' for f in F)
    rows.append([x['id'], x['s'], x['n'], x['mk'], x.get('ar') or '', x.get('dvs') or '', x.get('dv') or '', mask, [c.get(f, 0) for f in F], x.get('co') or ''])

mk = {}
by = {}
for r in rows: by.setdefault(r[3], []).append(r)
for m, rs in by.items():
    if len(rs) < 5: continue
    mk[m] = {'n': len(rs), 'cov': [round(100 * sum(r[7][i] == '1' for r in rs) / len(rs)) for i in range(len(F))],
             'med': statistics.median([r[7].count('1') for r in rs]), 'co': rs[0][9]}
# official registers: what each one can confirm, mapped to our fields
CHK = {'permit': ['pn', 'reg'], 'escrow': ['es'], 'company': ['co'], 'title': ['reg'], 'env': ['pn']}
rg = {}
for r in regs:
    rg.setdefault(r['market'], []).append([r['register'], r.get('url') or '', sorted({f for k in r.get('checks', []) for f in CHK.get(k, [])}, key=F.index), r.get('result') or '', (r.get('probed_at') or '')[:10]])
CO = {'UAE': None, 'USA': 'United States', 'Indonesia': 'Indonesia'}
out = {'v': 'n37u-1', 'built': named.get('updated') or '', 'from': ['named.json', 'construction-progress.json', 'court-cases.json', 'register-checks.json'],
       'f': F, 'p': [r[:9] for r in rows], 'mk': mk, 'rg': rg, 'co': {r[0]: r[9] for r in rows},
       'n': len(rows), 'known': [sum(r[7][i] == '1' for r in rows) for i in range(len(F))]}
json.dump(out, open(os.path.join(D, 'n37u.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('n37u.json', len(rows), 'projects,', len(mk), 'markets,', sum(len(v) for v in rg.values()), 'registers; held per field:', dict(zip(F, out['known'])))
