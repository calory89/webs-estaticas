"""Reproducibility check: recompute every published Trust Score from the open dataset with the open-source scoring code
(kolaboro.com/open/scoring.py) and compare. Adds the result to the QA report shown on kolaboro.com/status."""
import json, sys, os, urllib.request, types, hashlib
B = 'https://kolaboro.com'
def get(p): return urllib.request.urlopen(urllib.request.Request(B + p, headers={'user-agent': 'kolaboro-qa'}), timeout=60).read()
code = get('/open/scoring.py').decode(); raw = get('/data/bali-cases.json'); data = json.loads(raw)
mod = types.ModuleType('scoring'); exec(code, mod.__dict__)
ok = bad = 0; diffs = []
for c in data.get('cases', []):
    k = c.get('checks') or {}
    ck = {'permit': k.get('permit', 0), 'escrow': k.get('escrow'), 'progress': k.get('progress'), 'plans': k.get('plans'), 'record': k.get('record'), 'returns_ok': k.get('returns_ok')}
    s = mod.score(ck); vs = mod.confirmed_score(c.get('verified')); t = mod.tier(s, c.get('flags'), len(k.get('researched') or []) or 6)
    if (s, vs, t) == (c.get('score'), c.get('vscore'), c.get('tier')): ok += 1
    else: bad += 1; diffs.append('%s score %s/%s vscore %s/%s tier %s/%s' % (c['id'], s, c.get('score'), vs, c.get('vscore'), t, c.get('tier')))
check = {'name': 'Trust Scores reproduced from open code and data', 'ok': bad == 0,
         'detail': '%d of %d projects recomputed with /open/scoring.py match the published score, confirmed score and tier%s (dataset sha256 %s…, scoring code sha256 %s…)' % (ok, ok + bad, '' if not bad else '; mismatches: ' + ', '.join(diffs[:5]), hashlib.sha256(raw).hexdigest()[:12], hashlib.sha256(code.encode()).hexdigest()[:12])}
out = os.environ.get('KB_QA_OUT', 'qa.json')
try: q = json.load(open(out))
except Exception: q = {'date': None, 'checks': []}
q.setdefault('checks', []).insert(1, check); q['ok'] = all(c.get('ok') for c in q['checks'])
json.dump(q, open(out, 'w'), indent=1); print(check['detail']); sys.exit(0 if bad == 0 else 1)
