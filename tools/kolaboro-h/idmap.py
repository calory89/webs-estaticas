# Map public project ids (DXB-001...) to research-record slugs, exactly as agent.py assigns them. Output stays private (runner temp).
import json, re, sys
AG, OUT = sys.argv[1], sys.argv[2]
src = open(AG + '/agent.py').read(); ns = {}; exec(re.search(r"PREFIX = \{.*?\}\n", src, re.S).group(0), ns); PREFIX = ns['PREFIX']
P = json.load(open(AG + '/projects.json'))['projects'] + json.load(open(AG + '/projects-world.json')).get('projects', [])
n, m = {}, {}
for p in sorted(P, key=lambda x: x.get('market', 'Bali') != 'Bali'):
    mk = p.get('market', 'Bali'); n[mk] = n.get(mk, 0) + 1
    m['%s-%03d' % (PREFIX.get(mk, mk[:3].upper()), n[mk])] = p['slug']
json.dump(m, open(OUT + '/idmap.json', 'w'))
json.dump({'projects': json.load(open(AG + '/projects.json'))['projects']}, open(OUT + '/pb.json', 'w'))
json.dump({'projects': json.load(open(AG + '/projects-world.json')).get('projects', [])}, open(OUT + '/pw.json', 'w'))
print(len(m), 'ids')
