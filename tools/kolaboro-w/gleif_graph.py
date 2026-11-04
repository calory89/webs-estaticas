#!/usr/bin/env python3
"""Kolaboro global company graph through GLEIF (Legal Entity Identifier records, CC0, no key).

Usage: gleif_graph.py AGENT_DIR OUT_JSON PRIVATE_JSON [MAX_REQUESTS]
  AGENT_DIR     folder with agent.py, projects.json, projects-world.json and research/ (the private research records)
  OUT_JSON      the public, anonymised file (normally _s/kolaboro.com/data/company-graph-global.json)
  PRIVATE_JSON  per-company match reasons with names and LEIs. Never published: kept as a private workflow artifact.

Matching rule (precision first). For each company name in a project's research record:
  1. candidate LEI records come from the GLEIF full-text search (api.gleif.org, page of 50);
  2. a record matches only if its legal name, or one of its registered other names, is EXACTLY the candidate name after
     normalising case, accents, punctuation, "&"/"and" and the legal-form words at the end (Ltd, LLC, PJSC, S.L., PT...),
     AND the country of its legal address or headquarters equals the project's country (the second matching field);
  3. if two or more different LEIs pass both tests, the name is ambiguous and nothing is matched.
No fuzzy matching, no similarity scores, no guesses.

For each matched LEI, the level 2 relationship data gives the direct and ultimate accounting parents (or the reporting
exception the entity filed instead). A parent counts as foreign when its legal address country differs from the entity's.
Registration status (ISSUED, LAPSED, RETIRED, MERGED, ANNULLED...) and entity status (ACTIVE, INACTIVE) come from the record.

Privacy: the public file holds only per-project and per-market counts and booleans under the anonymous project ids.
No company names, LEIs, parent names or addresses. Parent countries appear only as per-market counts.
"""
import hashlib, json, os, re, sys, time, urllib.parse, urllib.request
from datetime import datetime, timezone

AG, OUT, PRIV = sys.argv[1], sys.argv[2], sys.argv[3]
MAX_REQ = int(sys.argv[4]) if len(sys.argv) > 4 else 4000
API = 'https://api.gleif.org/api/v1'
UA = 'KolaboroCompanyGraph/1.0 (+https://kolaboro.com/graph/global/)'
PAUSE = 1.05   # GLEIF asks for at most 60 requests a minute
NOW = datetime.now(timezone.utc)

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from wcommon import ISO, ISO_ALT, norm, candidates, load
P, IDS, EXTRA = load(AG)

# ---- GLEIF
nreq, arch = [0], []
class Budget(Exception): pass
def get(path):
    if nreq[0] >= MAX_REQ: raise Budget()
    nreq[0] += 1
    url = API + path
    for attempt in range(4):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers={'user-agent': UA, 'accept': 'application/vnd.api+json'}), timeout=40)
            b = r.read(); arch.append(hashlib.sha256(b).hexdigest()); time.sleep(PAUSE)
            return json.loads(b)
        except urllib.error.HTTPError as e:
            if e.code == 404: time.sleep(PAUSE); return None
            if e.code == 429: time.sleep(65); continue
            time.sleep(10 * (attempt + 1))
        except Exception:
            time.sleep(10 * (attempt + 1))
    return None

def names_of(rec):
    e = rec['attributes']['entity']
    ns = [e['legalName']['name']] + [o['name'] for o in (e.get('otherNames') or []) + (e.get('transliteratedOtherNames') or [])]
    return ns
def countries_of(rec):
    e = rec['attributes']['entity']
    return {(e.get('legalAddress') or {}).get('country'), (e.get('headquartersAddress') or {}).get('country')} - {None}

SEARCH_CACHE, REC_CACHE = {}, {}
def match(name, isos):
    want = norm(name)
    key = want
    if key not in SEARCH_CACHE:
        q = urllib.parse.urlencode({'filter[fulltext]': name, 'page[size]': 50})
        d = get('/lei-records?' + q)
        SEARCH_CACHE[key] = (d or {}).get('data') or []
    hits = {}
    for rec in SEARCH_CACHE[key]:
        if not (countries_of(rec) & set(isos)): continue
        if any(norm(x) == want for x in names_of(rec)): hits[rec['id']] = rec
    if len(hits) == 1:
        rec = list(hits.values())[0]; REC_CACHE[rec['id']] = rec
        return rec, 'exact name and country'
    if len(hits) > 1: return None, 'ambiguous: %d LEIs with this exact name in this country' % len(hits)
    return None, 'no LEI with this exact name in this country'

def parent(lei, kind):
    """kind: direct-parent or ultimate-parent. Returns (status, parent record or None)."""
    d = get('/lei-records/%s/%s' % (lei, kind))
    if d and d.get('data'): return 'reported', d['data']
    x = get('/lei-records/%s/%s-reporting-exception' % (lei, kind))
    if x and x.get('data'):
        reason = (x['data'].get('attributes') or {}).get('reason') or 'exception'
        return 'exception: ' + reason, None
    return 'none on file', None

def lapsed_cat(rs):
    rs = (rs or '').upper()
    return {'ISSUED': 'issued', 'LAPSED': 'lapsed', 'RETIRED': 'retired', 'MERGED': 'merged', 'ANNULLED': 'annulled', 'DUPLICATE': 'duplicate',
            'PENDING_TRANSFER': 'issued', 'PENDING_ARCHIVAL': 'issued'}.get(rs, rs.lower() or 'unknown')

# ---- run
projects, private, devseen = {}, [], {}
cov = {'projects': len(P), 'projects_with_candidate_names': 0, 'candidate_names': 0, 'matched_names': 0, 'ambiguous_names': 0, 'unmatched_names': 0,
       'projects_with_lei': 0, 'requests': 0, 'stopped_early': False}
markets = {}
stopped = False
for p in sorted(P, key=lambda x: IDS[x['slug']]):
    pid, mk, ctry = IDS[p['slug']], p.get('market', 'Bali'), p.get('country')
    isos = ISO_ALT.get(ctry) or ([ISO[ctry]] if ctry in ISO else [])
    devs = [p.get('developer') or ''] + sorted(EXTRA.get(p['slug'], set()) - {p.get('developer')})
    cands = []
    for d in devs: cands += candidates(d)
    cands = list(dict.fromkeys(cands))[:6]
    m = markets.setdefault(mk, {'country_iso': isos[0] if isos else None, 'projects': 0, 'projects_with_lei': 0, 'projects_lei_not_issued': 0,
                                'projects_foreign_parent': 0, 'developers': 0, 'developers_with_lei': 0, 'developers_foreign_parent': 0,
                                'developers_lei_not_issued': 0, 'lei_status': {}, 'parent_countries': {}, 'checked': 0})
    m['projects'] += 1
    rec = {'market': mk, 'checked': False}
    if stopped or not isos:
        rec['note'] = 'not checked: request budget ran out' if stopped else 'not checked: no ISO country for this market'
        projects[pid] = rec; continue
    if cands: cov['projects_with_candidate_names'] += 1
    cov['candidate_names'] += len(cands)
    found = []
    try:
        for c in cands:
            r, why = match(c, isos)
            private.append({'project': pid, 'market': mk, 'name': c, 'result': why, 'lei': r['id'] if r else None,
                            'legal_name': r['attributes']['entity']['legalName']['name'] if r else None})
            if not r:
                cov['ambiguous_names' if why.startswith('ambiguous') else 'unmatched_names'] += 1; continue
            cov['matched_names'] += 1
            found.append(r)
        ents = []
        for r in {x['id']: x for x in found}.values():
            a = r['attributes']; ec = a['entity']['legalAddress']['country']
            if 'par' not in r:
                dst, dp = parent(r['id'], 'direct-parent')
                ust, up = parent(r['id'], 'ultimate-parent')
                r['par'] = {'direct': dst, 'direct_country': dp['attributes']['entity']['legalAddress']['country'] if dp else None,
                            'ultimate': ust, 'ultimate_country': up['attributes']['entity']['legalAddress']['country'] if up else None}
            pr = r['par']
            foreign = any(c and c != ec for c in (pr['direct_country'], pr['ultimate_country']))
            ents.append({'reg': lapsed_cat(a['registration']['status']), 'entity_status': (a['entity'].get('status') or '').lower(),
                         'foreign_parent': foreign, 'parent_reported': pr['direct'] == 'reported' or pr['ultimate'] == 'reported',
                         'parent_exception': pr['direct'].startswith('exception') or pr['ultimate'].startswith('exception'),
                         'parent_countries': sorted({c for c in (pr['direct_country'], pr['ultimate_country']) if c and c != ec}),
                         'initial_year': int(a['registration']['initialRegistrationDate'][:4]) if a['registration'].get('initialRegistrationDate') else None,
                         'id': r['id']})
            for x in private:
                if x['lei'] == r['id'] and x['project'] == pid: x.update({'registration': a['registration']['status'], 'parents': pr})
    except Budget:
        stopped = True; cov['stopped_early'] = True
        rec['note'] = 'not checked: request budget ran out'; projects[pid] = rec; continue
    m['checked'] += 1
    rec.update({'checked': True, 'names_checked': len(cands), 'lei_entities': len(ents),
                'lei_not_issued': sum(1 for e in ents if e['reg'] != 'issued'),
                'statuses': sorted({e['reg'] for e in ents}),
                'foreign_parent': any(e['foreign_parent'] for e in ents),
                'parent_reported': any(e['parent_reported'] for e in ents),
                'parent_exception_only': bool(ents) and not any(e['parent_reported'] for e in ents) and any(e['parent_exception'] for e in ents),
                'oldest_lei_year': min([e['initial_year'] for e in ents if e['initial_year']] or [None]) if ents else None})
    projects[pid] = rec
    if ents:
        cov['projects_with_lei'] += 1; m['projects_with_lei'] += 1
        if rec['lei_not_issued']: m['projects_lei_not_issued'] += 1
        if rec['foreign_parent']: m['projects_foreign_parent'] += 1
    # per developer (unique developer string per market)
    dk = (mk, norm(p.get('developer') or ''))
    if dk not in devseen:
        devseen[dk] = 1; m['developers'] += 1
        if ents:
            m['developers_with_lei'] += 1
            if any(e['foreign_parent'] for e in ents): m['developers_foreign_parent'] += 1
            if any(e['reg'] != 'issued' for e in ents): m['developers_lei_not_issued'] += 1
    for e in ents:
        m['lei_status'][e['reg']] = m['lei_status'].get(e['reg'], 0) + 1
        for c in e['parent_countries']: m['parent_countries'][c] = m['parent_countries'].get(c, 0) + 1
    print(pid, len(cands), len(ents), file=sys.stderr, flush=True)

cov['requests'] = nreq[0]
def share(a, b): return round(a / b, 3) if b else None
for mk, m in markets.items():
    m['share_projects_with_lei'] = share(m['projects_with_lei'], m['checked'])
    m['share_developers_with_lei'] = share(m['developers_with_lei'], m['developers'])
    m['share_lei_developers_foreign_parent'] = share(m['developers_foreign_parent'], m['developers_with_lei'])
    m['share_lei_developers_not_issued'] = share(m['developers_lei_not_issued'], m['developers_with_lei'])
tot = {k: sum(m[k] for m in markets.values()) for k in ('projects', 'checked', 'projects_with_lei', 'projects_foreign_parent', 'projects_lei_not_issued',
                                                         'developers', 'developers_with_lei', 'developers_foreign_parent', 'developers_lei_not_issued')}
status_tot = {}
for m in markets.values():
    for k, v in m['lei_status'].items(): status_tot[k] = status_tot.get(k, 0) + v
tot['lei_status'] = status_tot
root = hashlib.sha256('\n'.join(arch).encode()).hexdigest()
out = {
    'updated': NOW.strftime('%Y-%m-%dT%H:%M:%SZ'),
    'source': {'name': 'GLEIF, Global Legal Entity Identifier Foundation', 'api': API, 'licence': 'CC0 1.0 (LEI data is public domain)',
               'golden_copy_note': 'LEI records and level 2 relationship records as served by the GLEIF API on the date above.',
               'queries': ['GET /lei-records?filter[fulltext]={name}&page[size]=50', 'GET /lei-records/{LEI}/direct-parent', 'GET /lei-records/{LEI}/ultimate-parent',
                           'GET /lei-records/{LEI}/direct-parent-reporting-exception', 'GET /lei-records/{LEI}/ultimate-parent-reporting-exception']},
    'method': ['Company names come from the private research record of each tracked project (the developer field, split into the companies it names).',
               'A name matches an LEI only when the legal name or a registered other name is exactly the same after normalising case, accents, punctuation and the legal-form words at the end, AND the legal or headquarters address is in the project\'s country.',
               'If two or more LEIs pass both tests the name counts as ambiguous and is not matched. There is no fuzzy matching.',
               'Parents are the accounting-consolidation parents reported to GLEIF (level 2 data). A parent is foreign when its legal address country differs from the entity\'s.',
               'A registration that is not ISSUED (for example LAPSED, meaning the entity stopped renewing its LEI) is not proof of a problem: many small companies let an LEI lapse when they stop needing one for financial transactions.'],
    'privacy': 'Projects are anonymous. This file holds counts and booleans only: no company names, LEIs, parent names or addresses. Parent countries appear only as per-market counts.',
    'coverage': cov, 'totals': tot,
    'shares': {'projects_with_lei': share(tot['projects_with_lei'], tot['checked']), 'developers_with_lei': share(tot['developers_with_lei'], tot['developers']),
               'lei_developers_foreign_parent': share(tot['developers_foreign_parent'], tot['developers_with_lei']),
               'lei_developers_not_issued': share(tot['developers_lei_not_issued'], tot['developers_with_lei'])},
    'markets': dict(sorted(markets.items())),
    'projects': projects,
    'archive': {'responses': len(arch), 'root_sha256': root, 'note': 'SHA-256 over the SHA-256 of every API response body, one per line, in request order.'},
}
for r in out['projects'].values(): r.pop('id', None)
json.dump(out, open(OUT, 'w'), separators=(',', ':'), ensure_ascii=False)
json.dump(private, open(PRIV, 'w'), indent=1, ensure_ascii=False)
print(json.dumps(cov), file=sys.stderr)
