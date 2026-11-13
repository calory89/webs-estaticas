#!/usr/bin/env python3
"""Kolaboro daily backup: every client, case, message, visit, evidence record and timestamp (no password hashes or session tokens),
plus every evidence file (photos, documents, satellite images) stored once by its SHA-256. Usage: backup.py OUTDIR   Env: KB_MACHINE_KEY"""
import json, os, sys, gzip, base64, datetime, urllib.request
SB = 'https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/'
AK = 'sb_publishable_WWMM9pbZfP4hJosLJlTobg_lWFGoJ3X'
KEY = os.environ['KB_MACHINE_KEY']; out = sys.argv[1]
def rpc(action, payload):
    r = urllib.request.Request(SB + 'kolaboro_machine', json.dumps({'p_key': KEY, 'p_action': action, 'p_payload': payload}).encode(), {'apikey': AK, 'Authorization': 'Bearer ' + AK, 'Content-Type': 'application/json'})
    return json.load(urllib.request.urlopen(r, timeout=180))
d = rpc('backup', {})
if 'error' in d: raise SystemExit(d)
os.makedirs(os.path.join(out, 'files'), exist_ok=True)
day = datetime.date.today().isoformat()
with gzip.open(os.path.join(out, day + '.json.gz'), 'wt') as f: json.dump(d, f)
EXT = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf'}
have = set(os.listdir(os.path.join(out, 'files'))); new = 0; after = 0
while True:
    rows = rpc('files', {'after': after})
    if not rows: break
    for r in rows:
        fn = r['sha256'] + '.' + EXT.get(r['mime'], 'bin')
        if fn not in have: open(os.path.join(out, 'files', fn), 'wb').write(base64.b64decode(r['b64'])); have.add(fn); new += 1
        after = max(after, r['id'])
# keep 30 daily snapshots
snaps = sorted(x for x in os.listdir(out) if x.endswith('.json.gz'))
for x in snaps[:-30]: os.remove(os.path.join(out, x))
print('backup', day, {k: len(v or []) for k, v in d.items() if isinstance(v, list)}, 'new files', new)
