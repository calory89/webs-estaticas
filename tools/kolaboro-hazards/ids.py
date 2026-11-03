#!/usr/bin/env python3
"""Private step: case id and coordinates for every tracked project that has them.
Same id rule as tools/kolaboro-agent/agent.py public_cases(): projects.json then projects-world.json, Bali first,
numbered per market. Writes to a temp file only (never published: coordinates would identify a project)."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); AG = os.path.join(HERE, '..', 'kolaboro-agent')
sys.path.insert(0, AG)
import agent  # constants only at import time
P = json.load(open(os.path.join(AG, 'projects.json')))['projects'] + json.load(open(os.path.join(AG, 'projects-world.json'))).get('projects', [])
n, out = {}, []
for p in sorted(P, key=lambda x: x.get('market', 'Bali') != 'Bali'):
    mk = p.get('market', 'Bali'); n[mk] = n.get(mk, 0) + 1
    cid = '%s-%03d' % (agent.PREFIX.get(mk, mk[:3].upper()), n[mk])
    fx = p.get('facts') or {}
    try: lat, lng = float(fx.get('lat')), float(fx.get('lng'))
    except (TypeError, ValueError): continue
    if not (-60 <= lat <= 75 and -180 <= lng <= 180): continue
    out.append({'id': cid, 'market': mk, 'lat': lat, 'lng': lng})
json.dump(out, open(sys.argv[1], 'w'))
print('projects with coordinates:', len(out))
