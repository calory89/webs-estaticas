#!/usr/bin/env python3
"""Kolaboro AI due-diligence benchmark: run every case of kolaboro.com/open/evals with ONE model forced, through the production
desk review (POST /api/x/o/bench/case, authenticated with this workflow's GitHub OIDC token). Each answer comes back signed with
Kolaboro's Ed25519 key; the file keeps the exact signed text so anyone can re-check it.
Usage: run.py <haiku|sonnet> <output.json>"""
import json, os, sys, time, urllib.request, urllib.error

def oidc():
    u = os.environ['ACTIONS_ID_TOKEN_REQUEST_URL']
    r = urllib.request.urlopen(urllib.request.Request(u + '&audience=kolaboro.com', headers={'Authorization': 'Bearer ' + os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN']}), timeout=15)
    return json.load(r)['value']

model, out_path = sys.argv[1], sys.argv[2]
spec = json.load(urllib.request.urlopen(urllib.request.Request('https://kolaboro.com/open/evals/cases.json', headers={'user-agent': 'kolaboro-benchmark/1.0'}), timeout=30))
entries, t0 = [], time.time()
for c in spec['cases']:
    for attempt in range(2):
        req = urllib.request.Request('https://kolaboro.com/api/x/o/bench/case', data=json.dumps({'model': model, 'case': c['id']}).encode(), method='POST',
                                     headers={'content-type': 'application/json', 'authorization': 'Bearer ' + oidc(), 'user-agent': 'kolaboro-benchmark/1.0'})
        try:
            d = json.load(urllib.request.urlopen(req, timeout=300)); break
        except urllib.error.HTTPError as e:
            d = {'error': 'http %d' % e.code, 'detail': e.read()[:300].decode('utf-8', 'replace')}
        except Exception as e:
            d = {'error': str(e)[:200]}
        time.sleep(10)
    if 'body' not in d:
        print(c['id'], 'ERROR', d); entries.append({'case': c['id'], 'error': d}); continue
    b = json.loads(d['body'])
    print('%-22s %s %d/%d  %s  %s tokens in/out %d/%d' % (c['id'], 'PASS' if b['pass'] else 'FAIL', b['checks_passed'], b['checks_total'], ','.join(b['models_answered']) or '-', b.get('error') or '', b['tokens']['in'], b['tokens']['out']))
    entries.append({'case': c['id'], 'body': d['body'], 'signature': d['signature'], 'key_id': d.get('key_id')})
ok = [json.loads(e['body']) for e in entries if 'body' in e]
res = {'benchmark': 'kolaboro-desk-review', 'model': model, 'cases_version': spec.get('version'), 'github_run': os.environ.get('GITHUB_RUN_ID'),
       'run_url': '%s/%s/actions/runs/%s' % (os.environ.get('GITHUB_SERVER_URL', ''), os.environ.get('GITHUB_REPOSITORY', ''), os.environ.get('GITHUB_RUN_ID', '')),
       'started': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(t0)), 'seconds': round(time.time() - t0),
       'cases_total': len(spec['cases']), 'cases_answered': len(ok), 'cases_passed': sum(1 for b in ok if b['pass']),
       'checks_passed': sum(b['checks_passed'] for b in ok), 'checks_total': sum(b['checks_total'] for b in ok),
       'usd_estimated': round(sum(b['usd_estimated'] for b in ok), 4),
       'note': 'Each entry body is the exact text Kolaboro signed (Ed25519, message "kolaboro-sig-v1\\n" + SHA-256 hex of body); public key at kolaboro.com/.well-known/kolaboro-keys.json.',
       'cases': entries}
json.dump(res, open(out_path, 'w'), indent=1)
print(json.dumps({k: v for k, v in res.items() if k != 'cases'}, indent=1))
sys.exit(0 if len(ok) == len(spec['cases']) else 1)
