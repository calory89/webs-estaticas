#!/usr/bin/env python3
"""kolaboro.com tamper-evident daily dataset (n30b, 17 Nov 2026).
For every UTC day on which /data/named.json was published, take the last published version of that day, record its SHA-256 and size,
link it to the previous day's entry (hash chain) and publish a gzip copy of the exact bytes at /data/snapshots/<day>/named.json.gz.
head = SHA-256 hex of "kolaboro-snapshot-v1|<day>|/data/named.json|<sha256>|<bytes>|<previous head or genesis>".
Run from a clone of webs-estaticas on branch pub/_lovable after named.json is published (read-only git commands; writes only
_s/kolaboro.com/data/snapshots/). Existing entries are never rewritten: a day already in the chain keeps its entry.

n31c (18 Nov 2026, item 105): runs by itself every day inside the existing daily shipping job (kolaboro-shipping.yml, right after
the UTC day ends), on the job's history-only clone of pub/_lovable, so no new workflow and no extra checkout:
  snapshots.py <git dir> pub/_lovable --out <dir> [--files <list>]
With --out the files are written under <dir>/_s/kolaboro.com/data/snapshots/ and the index of the published branch is read from git
when it is not on disk; --files appends the written paths (relative to <dir>) to the publish list of that job. Only finished UTC days
are added (a day still running can get a later version).
"""
import gzip, hashlib, json, os, subprocess, sys
from datetime import datetime, timezone
ARGS = sys.argv[1:]
def _opt(k):
    if k in ARGS:
        i = ARGS.index(k); v = ARGS[i + 1]; del ARGS[i:i + 2]; return v
    return None
OUT_ROOT, FILES = _opt('--out'), _opt('--files')
REPO = ARGS[0] if len(ARGS) > 0 else '.'
REF = ARGS[1] if len(ARGS) > 1 else 'HEAD'
F = '_s/kolaboro.com/data/named.json'
OUT = os.path.join(OUT_ROOT or REPO, '_s/kolaboro.com/data/snapshots')
TODAY = datetime.now(timezone.utc).strftime('%Y-%m-%d')
written = []
def git(*a): return subprocess.run(['git', '-C', REPO] + list(a), check=True, capture_output=True).stdout
log = git('log', '--format=%H %cI', REF, '--', F).decode().split('\n')
last = {}
for line in reversed([l for l in log if l.strip()]):          # oldest first, so the last version of a day wins
    h, t = line.split(' ', 1)
    dt = datetime.fromisoformat(t).astimezone(timezone.utc)
    last[dt.strftime('%Y-%m-%d')] = (h, dt.strftime('%Y-%m-%dT%H:%M:%SZ'))
idx_path = os.path.join(OUT, 'index.json')
if os.path.exists(idx_path):
    old = json.load(open(idx_path))
else:
    try: old = json.loads(git('show', REF + ':_s/kolaboro.com/data/snapshots/index.json'))
    except Exception: old = {'entries': []}
E = {e['day']: e for e in old['entries']}
prev = 'genesis'
entries = []
for day in sorted(set(last) | set(E)):
    if day in E:
        e = E[day]
        if e['prev'] != prev: sys.exit('chain broken at ' + day)
        entries.append(e); prev = e['head']; continue
    if day >= TODAY: continue                                   # n31c: the UTC day is not over yet
    h, t = last[day]
    b = git('show', h + ':' + F)
    sha = hashlib.sha256(b).hexdigest()
    if entries and entries[-1]['sha256'] == sha: continue      # same bytes as the day before: nothing new to fix
    try: n = len(json.loads(b).get('projects') or [])
    except Exception: n = None
    os.makedirs(os.path.join(OUT, day), exist_ok=True)
    gz = gzip.compress(b, compresslevel=9, mtime=0)
    open(os.path.join(OUT, day, 'named.json.gz'), 'wb').write(gz); written.append('_s/kolaboro.com/data/snapshots/%s/named.json.gz' % day)
    head = hashlib.sha256(('kolaboro-snapshot-v1|%s|/data/named.json|%s|%d|%s' % (day, sha, len(b), prev)).encode()).hexdigest()
    entries.append({'day': day, 'published_at': t, 'commit': h[:12], 'bytes': len(b), 'sha256': sha, 'projects': n, 'prev': prev, 'head': head,
                    'copy': '/data/snapshots/%s/named.json.gz' % day, 'copy_sha256': hashlib.sha256(gz).hexdigest(), 'copy_bytes': len(gz),
                    'added': datetime.now(timezone.utc).strftime('%Y-%m-%d')})
    prev = head
idx = {'version': 'kolaboro-snapshots-v1', 'file': '/data/named.json', 'licence': 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)',
       'head_rule': 'head = SHA-256 hex of the UTF-8 text "kolaboro-snapshot-v1|" + day + "|/data/named.json|" + sha256 + "|" + bytes + "|" + prev, where prev is the head of the entry before (the first entry uses "genesis")',
       'day_rule': 'one entry per UTC day on which the file was published: the last version published that day; a day whose file is byte-identical to the day before gets no entry',
       'copies': 'each copy is the gzip (RFC 1952, mtime 0) of the exact bytes; gunzip it and its SHA-256 equals sha256',
       'note': 'Entries up to 2026-11-16 were rebuilt on 2026-11-17 from the version history of the published file. From 18 Nov 2026 each finished UTC day is added automatically by the daily publishing job, shortly after the day ends; until then /api/v1/snapshots shows a newer live file as a provisional tip.',
       'updated': entries[-1]['day'] if entries else None, 'count': len(entries), 'tip': entries[-1]['head'] if entries else None, 'entries': entries}
os.makedirs(OUT, exist_ok=True)
if written or (not OUT_ROOT and not os.path.exists(idx_path)):
    json.dump(idx, open(idx_path, 'w'), indent=1); written.append('_s/kolaboro.com/data/snapshots/index.json')
if FILES and written:
    with open(FILES, 'a') as fh: fh.write(''.join(w + '\n' for w in written))
print(len(entries), 'entries, tip', idx['tip'], '| new files', len(written))
