#!/usr/bin/env python3
"""Kolaboro corporate family per named developer, from GLEIF level 2 relationship data (CC0, no key).

Usage: gleif_family.py NAMED_JSON OUT_JSON [PREV_JSON] [MAX_REQUESTS]
  NAMED_JSON  the public file kolaboro.com/data/named.json (developer name, slug, country, published company names)
  OUT_JSON    the public file _s/kolaboro.com/data/gleif-family.json (written only when something changed; exit code 3 = no change)
  PREV_JSON   the file as published now: the run is incremental. New developers and names checked more than 60 days ago are
              searched first, then the relationships of LEIs read more than 28 days ago, within MAX_REQUESTS (default 400, a few
              minutes), so the weekly job stays light. A full rebuild is a run without PREV_JSON and a large MAX_REQUESTS.

Matching (same precision-first rule as gleif_graph.py): for each company name a developer's tracked projects publish
(the developer name, and names in the "developer_company" field that share a distinctive word with the developer name), the GLEIF full-text search gives candidates; a record matches only if its
legal name or a registered other name is EXACTLY the name after normalising case, accents, punctuation and legal-form words, AND
its legal or headquarters address is in the project's country. Two or more LEIs passing both tests: ambiguous, nothing matched.
No fuzzy matching.

For each matched LEI: direct parent and ultimate parent (or the reporting exception filed instead), and direct children
(first 25, plus the total), as GLEIF serves them on the run date. Companies only: GLEIF holds legal entities, never people.
"""
import hashlib, json, os, re, sys, time, urllib.parse, urllib.request
from datetime import datetime, timezone

NAMED, OUT = sys.argv[1], sys.argv[2]
PREV = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] not in ('', '-') else None
MAX_REQ = int(sys.argv[4]) if len(sys.argv) > 4 else 400
TODAY = datetime.now(timezone.utc).strftime('%Y-%m-%d')
def age(d):
    try: return (datetime.strptime(TODAY, '%Y-%m-%d') - datetime.strptime(d[:10], '%Y-%m-%d')).days
    except Exception: return 10 ** 6
API = 'https://api.gleif.org/api/v1'
UA = 'KolaboroCorporateFamily/1.0 (+https://kolaboro.com/graph/developers/)'
PAUSE = 0.7    # GLEIF asks for at most 60 requests a minute; each answer takes about a second on top
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from wcommon import ISO, ISO_ALT, norm, candidates
ISO = dict(ISO, **{'Canada': 'CA', 'Nigeria': 'NG', 'South Korea': 'KR', 'Azerbaijan': 'AZ', 'Armenia': 'AM', 'Hungary': 'HU', 'Latvia': 'LV',
                   'Estonia': 'EE', 'Paraguay': 'PY', 'Mozambique': 'MZ', 'Romania': 'RO', 'Czechia': 'CZ', 'Peru': 'PE', 'Chile': 'CL',
                   'Poland': 'PL', 'Lithuania': 'LT', 'Slovenia': 'SI', 'Slovakia': 'SK', 'Austria': 'AT', 'Germany': 'DE', 'Netherlands': 'NL',
                   'Belgium': 'BE', 'Switzerland': 'CH', 'Kazakhstan': 'KZ', 'Uzbekistan': 'UZ', 'Kuwait': 'KW', 'Jordan': 'JO', 'Tunisia': 'TN',
                   'Uganda': 'UG', 'Zanzibar': 'TZ', 'Bosnia and Herzegovina': 'BA', 'North Macedonia': 'MK', 'Singapore': 'SG', 'Hong Kong': 'HK',
                   'Taiwan': 'TW', 'China': 'CN', 'Bermuda': 'BM', 'Bonaire': 'BQ', 'Sint Maarten': 'SX', 'Honduras': 'HN', 'Guatemala': 'GT', 'Bolivia': 'BO'})

nreq, arch = [0], []
class Budget(Exception): pass
def get(path):
    if nreq[0] >= MAX_REQ: raise Budget()
    nreq[0] += 1
    for attempt in range(4):
        try:
            r = urllib.request.urlopen(urllib.request.Request(API + path, headers={'user-agent': UA, 'accept': 'application/vnd.api+json'}), timeout=40)
            b = r.read(); arch.append(hashlib.sha256(b).hexdigest()); time.sleep(PAUSE)
            return json.loads(b)
        except urllib.error.HTTPError as e:
            if e.code == 404: time.sleep(PAUSE); return None
            if e.code == 429: time.sleep(65); continue
            time.sleep(10 * (attempt + 1))
        except Exception:
            time.sleep(10 * (attempt + 1))
    raise IOError('GLEIF did not answer ' + path)

def ent(rec):
    if not rec: return None
    a = rec['attributes']; e = a['entity']
    return {'lei': rec['id'], 'legal': e['legalName']['name'], 'country': (e.get('legalAddress') or {}).get('country') or '',
            'reg': (a.get('registration') or {}).get('status') or '', 'st': e.get('status') or '', 'jur': e.get('jurisdiction') or '',
            'since': ((a.get('registration') or {}).get('initialRegistrationDate') or '')[:10]}
def names_of(rec):
    e = rec['attributes']['entity']
    return [e['legalName']['name']] + [o['name'] for o in (e.get('otherNames') or []) + (e.get('transliteratedOtherNames') or [])]
def countries_of(rec):
    e = rec['attributes']['entity']
    return {(e.get('legalAddress') or {}).get('country'), (e.get('headquartersAddress') or {}).get('country')} - {None}

SEARCH = {}
def match(name, isos):
    want = norm(name)
    if not want: return None, 'empty'
    if want not in SEARCH:
        d = get('/lei-records?' + urllib.parse.urlencode({'filter[fulltext]': name, 'page[size]': 50}))
        SEARCH[want] = (d or {}).get('data') or []
    hits = {r['id']: r for r in SEARCH[want] if (countries_of(r) & set(isos)) and any(norm(x) == want for x in names_of(r))}
    if len(hits) == 1: return list(hits.values())[0], 'exact'
    return None, 'ambiguous' if hits else 'none'

def rel(lei, kind):
    d = get('/lei-records/%s/%s' % (lei, kind))
    if d and d.get('data'): return ent(d['data']), None
    x = get('/lei-records/%s/%s-reporting-exception' % (lei, kind))
    if x and x.get('data'): return None, (x['data'].get('attributes') or {}).get('reason') or 'EXCEPTION'
    return None, None

GENERIC = {'GROUP', 'HOLDING', 'HOLDINGS', 'PROPERTIES', 'PROPERTY', 'DEVELOPMENT', 'DEVELOPMENTS', 'DEVELOPERS', 'REAL', 'ESTATE', 'INVESTMENT',
           'INVESTMENTS', 'HOMES', 'CONSTRUCTION', 'REALTY', 'LAND', 'CAPITAL', 'INTERNATIONAL', 'GLOBAL', 'RESIDENCES', 'RESIDENCE', 'BUILDERS'}
named = json.load(open(NAMED))
devs = {}
for p in named['projects']:
    s = p.get('dvs'); 
    if not s or not p.get('dv'): continue
    d = devs.setdefault(s, {'n': p['dv'], 'names': [], 'isos': set()})
    co = p.get('co') or ''
    d['isos'].update(ISO_ALT.get(co) or ([ISO[co]] if co in ISO else []))
    # names from the developer field, plus company names from "developer_company" that share a distinctive word with the developer's
    # name (that field also names landowners, partners and project companies of other groups, which are not this developer)
    own = {w for w in norm(p['dv']).split() if len(w) >= 4 and w not in GENERIC}
    for i, src in enumerate((p['dv'], (p.get('fx') or {}).get('developer_company'))):
        if isinstance(src, str):
            for c in candidates(src):
                if i and not (own & set(norm(c).split())): continue
                if c not in d['names']: d['names'].append(c)

prev = None
if PREV and os.path.exists(PREV):
    try: prev = json.load(open(PREV))
    except Exception: prev = None
pdate = str((prev or {}).get('updated') or '')[:10]
checked = dict((prev or {}).get('checked') or {})
if prev and not checked and not (prev.get('coverage') or {}).get('stopped_early'):
    checked = {s: pdate for s in devs}      # first incremental run after a full build: everything was checked on that date
out = {s: o for s, o in ((prev or {}).get('devs') or {}).items() if s in devs}
cov = {'developers': len(devs), 'searched_this_run': 0, 'relations_refreshed_this_run': 0, 'names_checked': 0, 'ambiguous_names': 0, 'stopped_early': False}
RELC = {}
def relations(lei):
    if lei not in RELC:
        dp, dx = rel(lei, 'direct-parent'); up, ux = rel(lei, 'ultimate-parent')
        ch = get('/lei-records/%s/direct-children?page%%5Bsize%%5D=25' % lei)
        RELC[lei] = {'parent': dp, 'parent_x': dx, 'ultimate': up, 'ultimate_x': ux,
                     'children': [ent(x) for x in ((ch or {}).get('data') or [])],
                     'children_total': (((ch or {}).get('meta') or {}).get('pagination') or {}).get('total') or 0, 'rel_at': TODAY}
    return RELC[lei]
todo = sorted([s for s in devs if devs[s]['isos'] and devs[s]['names'] and age(checked.get(s, '')) > 60], key=lambda s: (s in checked, checked.get(s, ''), s))
try:
    for s in todo:
        d = devs[s]; found = {}
        for c in d['names'][:6]:
            r, why = match(c, sorted(d['isos'])); cov['names_checked'] += 1
            if why == 'ambiguous': cov['ambiguous_names'] += 1
            if r: found[r['id']] = r; via = c
        if len(found) != 1:                 # none, or the developer's names point to two different companies: not shown as one family
            out.pop(s, None)
        else:
            r = list(found.values())[0]
            o = dict(ent(r), **relations(r['id'])); o['name'] = d['n']; o['via'] = via; out[s] = o
        checked[s] = TODAY; cov['searched_this_run'] += 1
        print(s, len(out), nreq[0], file=sys.stderr)
    for s in sorted(out, key=lambda s: out[s].get('rel_at') or ''):
        if age(out[s].get('rel_at') or '') <= 28: continue
        o = out[s]; o.update(relations(o['lei'])); o['name'] = devs[s]['n']; cov['relations_refreshed_this_run'] += 1
except (Budget, IOError):
    cov['stopped_early'] = True
for s, o in out.items(): o['name'] = devs[s]['n']
cov['checked'] = sum(1 for s in devs if s in checked); cov['with_lei'] = len(out)
cov['with_parent'] = sum(1 for o in out.values() if o.get('parent') or o.get('ultimate'))
cov['with_children'] = sum(1 for o in out.values() if o.get('children_total'))

# links between developers we track: one is the other's parent or child, or both report the same parent
by_lei = {o['lei']: s for s, o in out.items()}
links = {}
def lk(a, b, why):
    if a == b: return
    k = tuple(sorted((a, b))); links.setdefault(k, set()).add(why)
for s, o in out.items():
    for kind in ('parent', 'ultimate'):
        p = o.get(kind)
        if p and p['lei'] in by_lei: lk(s, by_lei[p['lei']], kind)
    for c in o.get('children') or []:
        if c['lei'] in by_lei: lk(s, by_lei[c['lei']], 'child')
    for t, o2 in out.items():
        if t <= s: continue
        for kind in ('parent', 'ultimate'):
            a, b = o.get(kind), o2.get(kind)
            if a and b and a['lei'] == b['lei']: lk(s, t, 'same_' + kind)
cov['links'] = len(links); cov['requests'] = nreq[0]
checked = {k: v for k, v in sorted(checked.items()) if k in devs}
res = {'version': 1, 'updated': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
       'source': {'name': 'GLEIF, Global Legal Entity Identifier Foundation: LEI records and level 2 relationship records', 'api': API,
                  'licence': 'CC0 1.0', 'licence_url': 'https://www.gleif.org/en/meta/lei-data-terms-of-use',
                  'record': 'https://search.gleif.org/#/record/{lei}'},
       'method': ['A developer gets an LEI only when a company name its tracked projects publish is exactly the legal name (or a registered other name) of one LEI record, after normalising case, accents, punctuation and legal-form words, and that record is in the project\'s country. No fuzzy matching.',
                  'If the names of one developer match two different LEIs, nothing is shown.',
                  'Parents and children are the accounting-consolidation relationships the companies reported to GLEIF (level 2 data), as served on the date above. A reporting exception is the reason a company gave for not reporting a parent.',
                  'Two tracked developers are linked when one is the other\'s direct or ultimate parent or direct child, or both report the same direct or ultimate parent.',
                  'GLEIF holds legal entities only. No private individuals.'],
       'coverage': cov, 'devs': dict(sorted(out.items())), 'checked': checked,
       'links': [{'a': a, 'b': b, 'why': sorted(w)} for (a, b), w in sorted(links.items())],
       'archive': {'responses': len(arch), 'root_sha256': hashlib.sha256('\n'.join(arch).encode()).hexdigest()}}
same = prev is not None and all(prev.get(k) == json.loads(json.dumps(res[k])) for k in ('devs', 'links', 'checked'))
print('done', json.dumps(cov), file=sys.stderr)
if same and not os.environ.get('FORCE'):
    print('no change', file=sys.stderr); sys.exit(3)
json.dump(res, open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
