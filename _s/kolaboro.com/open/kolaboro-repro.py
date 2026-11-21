#!/usr/bin/env python3
"""kolaboro.com reproducible data build (n34a, batch 34, 21 Nov 2026). One command:

  python3 kolaboro-repro.py --repo <clone of webs-estaticas> [--ref origin/main] [--site <_s/kolaboro.com>] [--write]

Step 1 (needs read access to the research repository): takes the pipeline at <ref> (tools/kolaboro-agent: named.py, validate.py,
agent.py, projects.json, projects-world.json, aliases.json, data/latest.json, data/registry-watch.json), rebuilds /data/named.json
from the published /data/bali-cases.json with the validation date set to the one printed in the published file, and compares the
SHA-256 of the result with the published /data/named.json, byte for byte.
Step 2 (anyone, public files only): runs n34a-build.py --check, which rebuilds the history, track record, duplicates, intervals,
pin check and open data files from the published files and compares every output hash with /data/n34a/build.json.
With --write the result is saved to <site>/data/n34a/repro.json (shown on /engineering/reproducible/). Python 3.8+, stdlib only.
"""
import datetime as _dt, hashlib, json, os, runpy, subprocess, sys, tempfile
ARGS = sys.argv[1:]
def opt(k, d=None):
    if k in ARGS:
        i = ARGS.index(k); v = ARGS[i + 1]; del ARGS[i:i + 2]; return v
    return d
REPO, REF, SITE = opt('--repo'), opt('--ref', 'origin/main'), opt('--site', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
WRITE = '--write' in ARGS
DATA = os.path.join(os.path.abspath(SITE), 'data')
FILES = ['named.py', 'validate.py', 'agent.py', 'projects.json', 'projects-world.json', 'aliases.json', 'data/latest.json', 'data/registry-watch.json']
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
res = {'v': 'kolaboro-repro-1', 'run_at': _dt.datetime.now(_dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'steps': []}
pub = json.load(open(os.path.join(DATA, 'named.json')))
if REPO:
    commit = subprocess.run(['git', '-C', REPO, 'rev-parse', REF], capture_output=True, text=True, check=True).stdout.strip()
    tmp = tempfile.mkdtemp(prefix='kolaboro-repro-'); src = os.path.join(tmp, 'tools/kolaboro-agent'); os.makedirs(os.path.join(src, 'data'))
    inputs = {}
    for f in FILES:
        b = subprocess.run(['git', '-C', REPO, 'show', commit + ':tools/kolaboro-agent/' + f], capture_output=True).stdout
        open(os.path.join(src, f), 'wb').write(b); inputs[f] = hashlib.sha256(b).hexdigest()
    day = (pub.get('qa') or {}).get('checked') or pub.get('updated')
    y, m, d = [int(x) for x in day.split('-')]
    class FixedDate(_dt.date):
        @classmethod
        def today(cls): return cls(y, m, d)
    _dt.date = FixedDate                          # validate.py stamps the day it ran; the published file says which day that was
    out = os.path.join(tmp, 'named.json')
    sys.argv = ['named.py', os.path.join(DATA, 'bali-cases.json'), out]; sys.path.insert(0, src)
    import io, contextlib
    with contextlib.redirect_stdout(io.StringIO()): runpy.run_path(os.path.join(src, 'named.py'), run_name='__main__')
    a, b = sha(out), sha(os.path.join(DATA, 'named.json'))
    res['steps'].append({'step': 'named.json from the research files', 'commit': commit[:12], 'validation_day': day, 'inputs': inputs, 'bali_cases_sha256': sha(os.path.join(DATA, 'bali-cases.json')),
                         'rebuilt_sha256': a, 'published_sha256': b, 'match': a == b})
    _dt.date = FixedDate.__mro__[1]
r = subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'n34a-build.py'), DATA, '--check'], capture_output=True, text=True)
pb = json.load(open(os.path.join(DATA, 'n34a/build.json')))
res['steps'].append({'step': 'derived files from public files (n34a-build.py --check)', 'outputs': len(pb['outputs']), 'published_outputs_sha256': pb['outputs_sha256'], 'match': r.returncode == 0, 'log': r.stdout.strip().split('\n')[-3:]})
res['match'] = all(s['match'] for s in res['steps'])
print(json.dumps(res, indent=1))
if WRITE: json.dump(res, open(os.path.join(DATA, 'n34a/repro.json'), 'w'), ensure_ascii=False, indent=1)
sys.exit(0 if res['match'] else 1)
