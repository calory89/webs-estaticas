#!/usr/bin/env python3
"""Kolaboro company and director graph (UK, Companies House public pages).

Usage: company_graph.py AGENT_DIR OUT_JSON [MAX_REQUESTS]
  AGENT_DIR  folder with agent.py, projects.json and projects-world.json (the private research records)
  OUT_JSON   the public file, normally _s/kolaboro.com/data/company-graph.json

For every UK-tracked project, each company the research record names with a legal form (Limited, Ltd, PLC, LLP) is
searched on Companies House by exact name. When exactly one live or one dissolved company has that exact name, its
officers page is read, and for each current director the public list of their other appointments. Companies in that
network that are dissolved, in liquidation, administration or receivership, or proposed for strike-off are counted,
and for dissolved ones the company page gives incorporation and dissolution dates.

Privacy: projects are anonymous on kolaboro.com, so the output has no company names, numbers, officer names, dates of
birth or addresses. Officers become "Director A, B...", companies become counts and anonymous nodes with a status.
Officer names and birth dates are never read into memory beyond the HTML that is hashed and discarded.
Every response is archived as (time, SHA-256, size); the archive root over those lines is published.
"""
import hashlib, html, json, os, re, sys, time, urllib.parse, urllib.request
from datetime import datetime, timezone

AG, OUT = sys.argv[1], sys.argv[2]
MAX_REQ = int(sys.argv[3]) if len(sys.argv) > 3 else 1200
BASE = 'https://find-and-update.company-information.service.gov.uk'
UA = 'KolaboroRegisterCheck/1.0 (+https://kolaboro.com/graph/)'
PAUSE = 2.0          # seconds between requests: far under the register's published 600 requests / 5 minutes
APPT_PAGES = 3       # at most 3 pages (about 105 appointments) per officer; truncation is reported
UK = {'London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool', 'Edinburgh', 'Glasgow', 'Bristol', 'Belfast', 'Cardiff'}
NOW = datetime.now(timezone.utc)

src = open(os.path.join(AG, 'agent.py')).read(); ns = {}
exec(re.search(r"PREFIX = \{.*?\}\n", src, re.S).group(0), ns); PREFIX = ns['PREFIX']
P = json.load(open(os.path.join(AG, 'projects.json')))['projects'] + json.load(open(os.path.join(AG, 'projects-world.json'))).get('projects', [])
IDS, n = {}, {}
for p in sorted(P, key=lambda x: x.get('market', 'Bali') != 'Bali'):   # same order and numbering as agent.py
    mk = p.get('market', 'Bali'); n[mk] = n.get(mk, 0) + 1
    IDS[p['slug']] = '%s-%03d' % (PREFIX.get(mk, mk[:3].upper()), n[mk])

arch, nreq, fails, consec = [], [0], [0], [0]
class Budget(Exception): pass
def get(path, label):
    if nreq[0] >= MAX_REQ: raise Budget()
    nreq[0] += 1
    url = BASE + path
    b, st = b'', 0
    for attempt in range(4):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers={'user-agent': UA, 'accept': 'text/html'}), timeout=40)
            b, st = r.read(), r.status
        except urllib.error.HTTPError as e:
            b, st = e.read(), e.code
        except Exception:
            b, st = b'', 0
        if st == 200 or st == 404: consec[0] = 0; break
        fails[0] += 1; consec[0] += 1
        print('  retry', st, label, file=sys.stderr, flush=True)
        if consec[0] >= 8: raise Budget()   # the register keeps refusing: stop politely, publish what we have
        time.sleep(60 * (attempt + 1))
    arch.append('%s %s %s' % (hashlib.sha256(b).hexdigest(), time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), label))
    time.sleep(PAUSE)
    return st, b.decode('utf-8', 'replace')

def clean(t): return html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', t or ''))).strip()
def norm(s): return re.sub(r'[^A-Z0-9]', '', re.sub(r'\b(LIMITED|LTD)\b\.?', 'LTD', (s or '').upper().replace('&', 'AND')))
def pdate(s):
    try: return datetime.strptime(clean(s), '%d %B %Y').replace(tzinfo=timezone.utc)
    except Exception: return None

LEGAL = re.compile(r"((?:[A-Z0-9][A-Za-z0-9&.'\-]*|\([A-Za-z0-9 &.'\-]+\)|No\.\d+)(?:\s+(?:[A-Z0-9][A-Za-z0-9&.'\-]*|\([A-Za-z0-9 &.'\-]+\)|No\.\d+))*\s+(?:Limited|Ltd|PLC|LLP))\b\.?")
ROLE = re.compile(r'^(?:SPV|site owner|seller|site company|planning applicant|freehold held by|with landowner|development manager|IEE owner on file:?)\s+', re.I)
def legal_names(dev):
    out = []
    for m in LEGAL.finditer(dev or ''):
        s = ROLE.sub('', m.group(1).strip())
        if len(s.split()) >= 2: out.append(s)
    return list(dict.fromkeys(out))

STATUS = [('liquidation', 'insolvency'), ('administration', 'insolvency'), ('receiver', 'insolvency'), ('voluntary arrangement', 'insolvency'),
          ('proposal to strike off', 'strike-off proposed'), ('dissolved', 'dissolved'), ('converted', 'closed'), ('closed', 'closed'), ('active', 'active')]
def status_cat(s):
    s = (s or '').lower()
    for k, v in STATUS:
        if k in s: return v
    return 'other' if s else 'unknown'

def search(name):
    st, s = get('/search/companies?q=' + urllib.parse.quote(name), 'search')
    hits = []
    for m in re.finditer(r'<li class="type-company">(.*?)</li>', s, re.S):
        a = re.search(r'href="/company/([A-Z0-9]{8})"[^>]*>(.*?)</a>', m.group(1), re.S)
        if a and norm(clean(a.group(2))) == norm(name):
            hits.append((a.group(1), 'Dissolved on' in m.group(1)))
    live = [h for h, d in hits if not d]
    if len(live) == 1: return live[0], 'exact name, one live company'
    if len(live) > 1: return None, 'ambiguous: %d live companies with this exact name' % len(live)
    if len(hits) == 1: return hits[0][0], 'exact name, one dissolved company'
    if hits: return None, 'ambiguous: %d dissolved companies with this exact name' % len(hits)
    return None, 'no exact match on the UK register (it may be registered abroad or under another name)'

def company(num):
    st, c = get('/company/' + num, 'company')
    dd = lambda i: (lambda m: clean(m.group(1)) if m else None)(re.search(r'id="' + i + r'"[^>]*>([\s\S]*?)</(?:dd|p)>', c))
    return {'status': dd('company-status'), 'inc': pdate(dd('company-creation-date') or ''), 'end': pdate(dd('cessation-date') or '')}

def officers(num):
    """Current directors (persons or corporate) of a company: officer ids only."""
    out, page = [], 1
    while page <= 4:
        st, t = get('/company/%s/officers%s' % (num, '' if page == 1 else '?page=%d' % page), 'officers')
        if st != 200: raise Budget()
        blocks = re.split(r'<div class="appointment-\d+">', t)[1:]
        for b in blocks:
            oid = re.search(r'href="/officers/([A-Za-z0-9_\-]+)/appointments"', b)
            tag = re.search(r'status-tag[^>]*>\s*([A-Za-z]+)', b)
            role = re.search(r'id="officer-role-\d+"[^>]*>([\s\S]*?)</dd>', b)
            role = clean(role.group(1)).lower() if role else ''
            if oid and tag and tag.group(1).lower() == 'active' and ('director' in role or 'member' in role):
                out.append({'id': oid.group(1), 'corporate': 'corporate' in role})
        if not re.search(r'href="[^"]*officers\?page=%d"' % (page + 1), t): break
        page += 1
    return list({o['id']: o for o in out}.values())

def appointments(oid):
    rows, page, total, truncated = [], 1, None, False
    while True:
        st, t = get('/officers/%s/appointments%s' % (oid, '' if page == 1 else '?page=%d' % page), 'appointments')
        m = re.search(r'Total number of appointments\s*(\d+)', t)
        if m: total = int(m.group(1))
        for b in re.split(r'<div class="appointment-\d+">', t)[1:]:
            c = re.search(r'href="/company/([A-Z0-9]{8})"', b)
            s = re.search(r'id="company-status-value-\d+"[^>]*>([\s\S]*?)</dd>', b)
            ro = re.search(r'id="appointment-type-value\d+"[^>]*>([\s\S]*?)</dd>', b)
            ro = clean(ro.group(1)).lower() if ro else ''
            if c and ('director' in ro or 'member' in ro): rows.append({'num': c.group(1), 'status': clean(s.group(1)) if s else ''})
        if not re.search(r'href="[^"]*appointments\?page=%d"' % (page + 1), t): break
        if page >= APPT_PAGES: truncated = True; break
        page += 1
    return rows, total, truncated

LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
cache_co, cache_app = {}, {}
projects, cov = {}, {'uk_projects': 0, 'projects_naming_a_legal_entity': 0, 'legal_names': 0, 'resolved': 0, 'ambiguous': 0, 'not_found': 0,
                     'directors': 0, 'appointments_read': 0, 'officers_truncated': 0, 'network_companies': 0, 'projects_with_graph': 0}
stopped = False
uk = [p for p in P if p.get('market') in UK or p.get('country') == 'United Kingdom']
cov['uk_projects'] = len(uk)
for p in sorted(uk, key=lambda x: IDS[x['slug']]):
    pid = IDS[p['slug']]
    if stopped:
        projects[pid] = {'market': p.get('market'), 'checked': False, 'summary': ['Not checked in this run: the request budget ran out first.'], 'nodes': [], 'edges': []}
        continue
    names = legal_names(p.get('developer'))
    rec = {'market': p.get('market'), 'named_companies': len(names), 'resolved': 0, 'unresolved_reasons': [], 'nodes': [{'id': 'P', 'type': 'project', 'label': pid}], 'edges': []}
    if names: cov['projects_naming_a_legal_entity'] += 1
    cov['legal_names'] += len(names)
    dirs = {}
    try:
        for i, nm in enumerate(names):
            num, why = search(nm)
            if not num:
                rec['unresolved_reasons'].append(why); cov['ambiguous' if why.startswith('ambiguous') else 'not_found'] += 1; continue
            cov['resolved'] += 1; rec['resolved'] += 1
            if num not in cache_co: cache_co[num] = company(num)
            co = cache_co[num]
            cid = 'N%d' % (i + 1)
            life = (co['end'] - co['inc']).days if co['end'] and co['inc'] else None
            rec['nodes'].append({'id': cid, 'type': 'company', 'role': 'named', 'status': status_cat(co['status']), 'inc_year': co['inc'].year if co['inc'] else None,
                                 'short_lived': bool(life is not None and life <= 730)})
            rec['edges'].append({'s': 'P', 't': cid, 'type': 'named in research record'})
            for o in officers(num):
                if o['id'] not in dirs: dirs[o['id']] = {'label': 'Director ' + LETTERS[len(dirs) % 26], 'corporate': o['corporate'], 'of': set()}
                dirs[o['id']]['of'].add(cid)
            rec['_nums'] = rec.get('_nums', set()) | {num}
    except Budget:
        stopped = True
    # each director's other companies
    net = {}
    for oid, d in dirs.items():
        if stopped: break
        try:
            if oid not in cache_app: cache_app[oid] = appointments(oid)
        except Budget:
            stopped = True; break
        rows, total, trunc = cache_app[oid]
        cov['directors'] += 1; cov['appointments_read'] += len(rows); cov['officers_truncated'] += int(trunc)
        did = 'D' + d['label'][-1]
        rec['nodes'].append({'id': did, 'type': 'director', 'label': d['label'], 'corporate': d['corporate'], 'appointments_total': total, 'appointments_read': len(rows), 'truncated': trunc})
        for cid in sorted(d['of']): rec['edges'].append({'s': did, 't': cid, 'type': 'current director'})
        for r in rows:
            if r['num'] in rec.get('_nums', set()): continue
            net.setdefault(r['num'], {'status': r['status'], 'dirs': set()})['dirs'].add(did)
    # dates for non-active companies in the network (dissolved ones need incorporation and dissolution dates)
    k = 0
    for num, x in sorted(net.items()):
        cat = status_cat(x['status']); x['cat'] = cat
        if cat in ('dissolved', 'insolvency') and not stopped:
            try:
                if num not in cache_co: cache_co[num] = company(num)
                co = cache_co[num]
                x['life'] = (co['end'] - co['inc']).days if co['end'] and co['inc'] else None
                x['recent'] = bool(co['end'] and (NOW - co['end']).days <= 5 * 365)
            except Budget:
                stopped = True
    cnt = {'active': 0, 'dissolved': 0, 'dissolved_within_2y': 0, 'dissolved_last_5y': 0, 'insolvency': 0, 'strike-off proposed': 0, 'other': 0}
    for num, x in sorted(net.items()):
        cat = x['cat']
        if cat == 'active': cnt['active'] += 1
        elif cat == 'dissolved':
            cnt['dissolved'] += 1
            if x.get('life') is not None and x['life'] <= 730: cnt['dissolved_within_2y'] += 1
            if x.get('recent'): cnt['dissolved_last_5y'] += 1
        elif cat in cnt: cnt[cat] += 1
        else: cnt['other'] += 1
    # graph: non-active companies as single nodes, active ones folded into one node per director
    j = 0
    for num, x in sorted(net.items(), key=lambda kv: (kv[1]['cat'] == 'active', kv[0])):
        if x['cat'] == 'active': continue
        j += 1; cid = 'X%d' % j
        rec['nodes'].append({'id': cid, 'type': 'company', 'role': 'other', 'status': x['cat'], 'short_lived': bool(x.get('life') is not None and x['life'] <= 730)})
        for did in sorted(x['dirs']): rec['edges'].append({'s': did, 't': cid, 'type': 'director (current or past)'})
    for n_ in [z for z in rec['nodes'] if z['type'] == 'director']:
        a = sum(1 for num, x in net.items() if x['cat'] == 'active' and n_['id'] in x['dirs'])
        if a:
            rec['nodes'].append({'id': 'A' + n_['id'], 'type': 'group', 'status': 'active', 'count': a, 'label': '%d active companies' % a})
            rec['edges'].append({'s': n_['id'], 't': 'A' + n_['id'], 'type': 'director (current or past)'})
    cov['network_companies'] += len(net)
    rec['network'] = cnt
    rec['directors'] = len(dirs)
    named_bad = [z for z in rec['nodes'] if z['type'] == 'company' and z.get('role') == 'named' and z['status'] != 'active']
    S = []
    if not names:
        S.append('The research record names this project\'s companies by brand only, without a legal entity, so there is nothing exact to look up on the register.')
    elif not rec['resolved']:
        S.append('%d named compan%s could not be matched to exactly one UK company: %s.' % (len(names), 'y' if len(names) == 1 else 'ies', '; '.join(sorted(set(rec['unresolved_reasons']))) or 'not checked'))
    else:
        S.append('%d of %d named compan%s matched exactly one company on Companies House.' % (rec['resolved'], len(names), 'y' if len(names) == 1 else 'ies'))
        for z in named_bad: S.append('A named project company is listed as %s on the register.' % z['status'])
        if dirs:
            S.append('Its %d current director%s %s been directors (now or in the past) of %d other UK compan%s: %d active, %d dissolved (%d of them within 2 years of incorporation), %d in liquidation, administration or receivership.' % (
                len(dirs), '' if len(dirs) == 1 else 's', 'has' if len(dirs) == 1 else 'have', len(net), 'y' if len(net) == 1 else 'ies', cnt['active'], cnt['dissolved'], cnt['dissolved_within_2y'], cnt['insolvency']))
            worst = None
            for d in [z for z in rec['nodes'] if z['type'] == 'director']:
                short = sum(1 for x in net.values() if d['id'] in x['dirs'] and x['cat'] == 'dissolved' and x.get('life') is not None and x['life'] <= 730)
                ins = sum(1 for x in net.values() if d['id'] in x['dirs'] and x['cat'] == 'insolvency')
                if short or ins:
                    if not worst or (short + ins) > worst[1] + worst[2]: worst = (d['label'], short, ins)
            if worst:
                parts = []
                if worst[1]: parts.append('%d compan%s dissolved within 2 years of incorporation' % (worst[1], 'y' if worst[1] == 1 else 'ies'))
                if worst[2]: parts.append('%d in an insolvency procedure' % worst[2])
                S.append('%s of the developing company has been a director of %s.' % (worst[0], ' and '.join(parts)))
            if any(z.get('truncated') for z in rec['nodes'] if z['type'] == 'director'):
                S.append('At least one director holds more than %d appointments; only the first %d per director were read.' % (APPT_PAGES * 35, APPT_PAGES * 35))
        else:
            S.append('No current directors were listed for the matched compan%s.' % ('y' if rec['resolved'] == 1 else 'ies'))
    if stopped: S.append('The request budget for this run ran out before this project was finished; numbers are partial.')
    rec['summary'] = S
    rec['partial'] = stopped
    rec['checked'] = True
    rec.pop('_nums', None)
    if rec['resolved']: cov['projects_with_graph'] += 1
    projects[pid] = rec
    print(pid, len(names), rec['resolved'], len(dirs), len(net), nreq[0], file=sys.stderr, flush=True)

arch.sort()
root = hashlib.sha256('\n'.join(arch).encode()).hexdigest()
cov['requests'] = nreq[0]; cov['retries'] = fails[0]
out = {
    'version': 'company-graph-1', 'updated': NOW.strftime('%Y-%m-%d'), 'generated_at': NOW.strftime('%Y-%m-%dT%H:%M:%SZ'),
    'register': {'name': 'Companies House (United Kingdom)', 'url': BASE, 'access': 'public web pages, no API key (the free REST API needs a key the owner has not created yet)',
                 'user_agent': UA, 'pause_seconds': PAUSE},
    'coverage': cov, 'complete': not stopped,
    'archive': {'lines': len(arch), 'root': root, 'line_format': 'sha256 time kind (kind replaces the URL, which would identify a company)'},
    'method': [
        'Only companies the private research record names with a legal form (Limited, Ltd, PLC, LLP) are looked up. Brand names are not guessed into companies.',
        'A company counts as matched only when exactly one company on Companies House has the same name after normalising punctuation and Limited/Ltd. Two or more candidates are reported as ambiguous and not used.',
        'For each matched company we read its current directors, then each director\'s list of appointments (up to %d per director), then the company page of every dissolved or insolvent company in that list for its dates.' % (APPT_PAGES * 35),
        '"Dissolved within 2 years" means the company page shows a dissolution date at most 730 days after incorporation.',
        'Dissolution is common and lawful, for example when a single-project company is closed after completion. It is a question to ask, not a finding. Liquidation, administration and receivership are insolvency procedures.',
        'Nothing personal is published: no names, company numbers, dates of birth or addresses. Directors are labelled A, B, C within each project only.'],
    'not_covered': [
        {'jurisdiction': 'All markets outside the UK', 'reason': 'No official register with free, open officer data was found that works without an account, captcha or paid API. OpenCorporates needs an API key and its free tier is for public-benefit projects only, so it is not used.'},
        {'jurisdiction': 'Australia', 'reason': 'ABN Lookup is open but lists no directors; ASIC officer extracts are paid.'},
        {'jurisdiction': 'Ireland', 'reason': 'CRO officer data is behind a paid extract.'}],
    'projects': projects,
}
json.dump(out, open(OUT, 'w'), indent=1, sort_keys=False)
print('done', nreq[0], 'requests, complete' if not stopped else 'PARTIAL', file=sys.stderr)
