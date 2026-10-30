"""Developer risk graph: projects, developers, web domains, listing agencies, permits and markets, with cross-links.
Internal only (anonymity policy: no per-project data is published before verification).
Usage: python3 graph.py [--upload]  (needs KB_MACHINE_KEY env or ../machine_key.txt)"""
import json, os, re, sys, collections, urllib.request, datetime
from urllib.parse import urlparse

HERE = os.path.dirname(os.path.abspath(__file__))
A = json.load(open(os.path.join(HERE, 'projects.json')))['projects']
B = json.load(open(os.path.join(HERE, 'projects-world.json')))['projects']
LATEST = {}
try: LATEST = json.load(open(os.path.join(HERE, 'data', 'latest.json')))
except Exception: pass
LISTING = {'offplan.so', 'propertyfinder.ae', 'bayut.com', 'a1properties.ae', 'idealista.com', 'kyero.com', 'fazwaz.com', 'dotproperty.co.th', 'hipflat.co.th', 'thailand-property.com', 'rumah123.com', 'lamudi.co.id', 'balirealty.com', 'kibarer.com', 'remax.com', 'century21.com'}

def host(u):
    try: h = urlparse(u if '://' in (u or '') else 'https://' + (u or '')).hostname or ''
    except Exception: return ''
    return re.sub(r'^www\.', '', h.lower())

def norm(s): return re.sub(r'[^a-z0-9]+', ' ', (s or '').lower()).strip()

nodes, edges, seen = {}, [], set()
def node(i, t, label, **kw):
    if i not in nodes: nodes[i] = dict(id=i, type=t, label=label, **kw)
    return i
def edge(a, b, t):
    k = (a, b, t)
    if k not in seen: seen.add(k); edges.append(dict(s=a, t=b, type=t))

projects = []
for p in A + B:
    s = p.get('seed') or {}
    lt = LATEST.get(p['slug'], {}).get('claims', {})
    mk = p.get('market') or 'Bali'
    sig = []
    if s.get('guaranteed_language') or lt.get('guaranteed_language'): sig.append('guaranteed returns language')
    if s.get('extension') or lt.get('extension_promised'): sig.append('lease extension promised')
    if not (s.get('permit_claim') or s.get('permit_number') or p.get('permit_number')) and mk in ('Bali', 'Lombok'): sig.append('no permit number published')
    y = lt.get('advertised_yield_pct')
    if y and y >= 12: sig.append('advertised yield %s%%' % y)
    if s.get('escrow') is False: sig.append('no escrow mentioned')
    if (s.get('title') or lt.get('title_type')) == 'leasehold' and (s.get('lease_base') or lt.get('lease_years_base') or 99) < 25: sig.append('short lease')
    pid = node('p:' + p['slug'], 'project', p['name'], market=mk, area=p.get('area'), url=p.get('url'), signals=sig, price=s.get('price'), currency=s.get('currency'), completion=s.get('completion') or lt.get('completion_year'))
    dv = p.get('developer') or ''; dv = dv if dv and not re.search(r'not named|unknown|not stated|unnamed|not disclosed|not identified|^n/?a$', dv, re.I) else 'Unnamed developer (' + p['name'] + ')'; did = node('d:' + norm(dv), 'developer', dv)
    edge(pid, did, 'built by')
    mid = node('m:' + mk, 'market', mk); edge(pid, mid, 'in')
    for u, kind in ((p.get('url'), 'site'), (p.get('docs_url'), 'docs')):
        h = host(u)
        if not h: continue
        if h in LISTING or any(h.endswith('.' + x) for x in LISTING):
            edge(pid, node('a:' + h, 'agency', h), 'listed by')
        else:
            edge(pid, node('w:' + h, 'domain', h), 'website')
            edge(did, 'w:' + h, 'uses')
    pn = p.get('permit_number') or s.get('permit_number')
    if pn: edge(pid, node('n:' + str(pn), 'permit', str(pn)), 'permit')
    projects.append((pid, did, mk, sig))

# cross-links and risk
deg = collections.Counter()
for e in edges: deg[e['s']] += 1; deg[e['t']] += 1
by_dev = collections.defaultdict(list)
for pid, did, mk, sig in projects: by_dev[did].append((pid, mk, sig))
dom_devs = collections.defaultdict(set)
for e in edges:
    if e['type'] == 'uses': dom_devs[e['t']].add(e['s'])
permit_projects = collections.defaultdict(set)
for e in edges:
    if e['type'] == 'permit': permit_projects[e['t']].add(e['s'])
alerts = []
STOP = {'group','development','developments','properties','property','realty','living','bali','with','limited','company','holding','unnamed','developer','real','estate','the'}
def toks(i): return {t for t in re.findall(r'[a-z]{4,}', nodes[i]['label'].lower()) if t not in STOP}
for w, ds in list(dom_devs.items()):
    ds = list(ds)
    if len(ds) > 1 and (any(nodes[d]['label'].startswith('Unnamed developer') for d in ds) or not all(toks(ds[0]) & toks(d) for d in ds[1:])):
        nodes[w]['type'] = 'agency'; continue   # a portal or news site listing several developers, not a shared identity
    if len(ds) > 1: alerts.append(dict(kind='shared domain', what=nodes[w]['label'], detail='%d developers use the same website: %s' % (len(ds), ', '.join(nodes[d]['label'] for d in ds))))
for n, ps in permit_projects.items():
    if len(ps) > 1: alerts.append(dict(kind='permit reused', what=nodes[n]['label'], detail='the same permit number is shown for %d projects: %s' % (len(ps), ', '.join(nodes[x]['label'] for x in ps))))
names = collections.defaultdict(list)
for i, v in nodes.items():
    if v['type'] == 'developer':
        k = norm(re.sub(r'\b(group|development|developments|properties|property|realty|living|bali|pt|ltd|llc)\b', ' ', v['label'].lower()))
        if k: names[k].append(i)
for k, ids in names.items():
    if len(ids) > 1: alerts.append(dict(kind='similar names', what=k, detail='possibly the same company under different names: ' + ', '.join(nodes[x]['label'] for x in ids)))
table = []
for did, ps in by_dev.items():
    sigs = collections.Counter(s for _, _, ss in ps for s in ss)
    mk = sorted(set(m for _, m, _ in ps))
    score = min(100, sum(sigs.values()) * 12 + (15 if any(did in ds for ds in dom_devs.values() if len(ds) > 1) else 0) + (10 if len(mk) > 1 else 0))
    nodes[did]['risk'] = score
    table.append(dict(id=did, developer=nodes[did]['label'], projects=len(ps), markets=mk, signals=dict(sigs), score=score))
table.sort(key=lambda r: (-r['score'], -r['projects']))
for pid, did, mk, sig in projects: nodes[pid]['risk'] = min(100, len(sig) * 25)
G = dict(generated=datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'), counts=dict(collections.Counter(v['type'] for v in nodes.values())), nodes=list(nodes.values()), edges=edges, developers=table, alerts=alerts,
         note='Signals come from what developers advertise, not verified facts. Internal tool: never publish per-project or per-developer data before a verification and the developer\'s reply.')
out = os.path.join(HERE, 'data', 'graph.json'); json.dump(G, open(out, 'w'), indent=0)
print('nodes', len(nodes), 'edges', len(edges), G['counts'], 'alerts', len(alerts))
if '--upload' in sys.argv:
    key = os.environ.get('KB_MACHINE_KEY') or open(os.path.join(HERE, '..', 'machine_key.txt')).read().strip()
    AK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw'
    r = urllib.request.Request('https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/kolaboro_machine', data=json.dumps(dict(p_key=key, p_action='graph_put', p_payload=dict(graph=G))).encode(), headers={'apikey': AK, 'Authorization': 'Bearer ' + AK, 'content-type': 'application/json'})
    print(urllib.request.urlopen(r, timeout=60).read().decode()[:200])
