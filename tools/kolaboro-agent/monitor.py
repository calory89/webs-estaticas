#!/usr/bin/env python3
"""Kolaboro uptime monitor: key pages load and contain what they should, the API and the database answer.
On failure: emails hello@kolaboro.com (through the database outbox) and exits 1 so GitHub also notifies.
Env: KB_MACHINE_KEY"""
import json, os, sys, time, urllib.request
SB = 'https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/'
AK = 'sb_publishable_WWMM9pbZfP4hJosLJlTobg_lWFGoJ3X'
UA = {'User-Agent': 'Mozilla/5.0 (kolaboro-monitor)'}
PAGES = [('/', 'Protect my purchase'), ('/technology/', 'id="certificate"'), ('/check/', 'kolaboro'), ('/cases/', 'id="cgrid"'), ('/portal/demo/', 'kolaboro'),
         ('/login/', 'kolaboro'), ('/agents/', 'kolaboro'), ('/verify/', 'id="chain"'), ('/status/', 'kolaboro'), ('/k/site.css', '.x-ev'), ('/k/case.js', 'KBX'), ('/data/image-index.json', '"items"')]
def get(u, t=25):
    t0 = time.time(); r = urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t); b = r.read().decode('utf8', 'ignore'); return r.status, b, round((time.time() - t0) * 1000)
def rpc(fn, body):
    r = urllib.request.Request(SB + fn, json.dumps(body).encode(), {'apikey': AK, 'Authorization': 'Bearer ' + AK, 'Content-Type': 'application/json'})
    return json.load(urllib.request.urlopen(r, timeout=30))
fails, report = [], []
for path, marker in PAGES:
    for attempt in (1, 2):
        try:
            st, b, ms = get('https://kolaboro.com' + path)
            if st == 200 and marker in b: report.append(f'ok   {path} {ms} ms'); break
            err = f'{path}: status {st}, marker {"missing" if marker not in b else "ok"}'
        except Exception as e: err = f'{path}: {e}'
        if attempt == 2: fails.append(err); report.append('FAIL ' + err)
        time.sleep(5)
try:
    st, b, ms = get('https://kolaboro.com/api/kb/health'); h = json.loads(b)
    if not (h.get('ok') and h.get('database') == 'up' and h.get('models_configured')): fails.append('api health: ' + b[:200])
    report.append(f'api  health {ms} ms {b[:120]}')
except Exception as e: fails.append(f'api health: {e}')
try:
    s = rpc('kolaboro_public_stats', {}); report.append('db   stats ok ' + json.dumps(s)[:120])
except Exception as e: fails.append(f'database: {e}')
print('\n'.join(report))
if fails:
    body = 'Failed checks:\n' + '\n'.join(fails) + '\n\nFull report:\n' + '\n'.join(report)
    try: rpc('kolaboro_machine', {'p_key': os.environ.get('KB_MACHINE_KEY', ''), 'p_action': 'alert', 'p_payload': {'title': fails[0][:120], 'body': body}})
    except Exception as e: print('alert failed', e)
    sys.exit(1)
