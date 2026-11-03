# Build data/register-checks.json from the probe archive, the live-lookup registry and existing per-project register results.
import json, sys, hashlib, datetime
probe = json.load(open(sys.argv[1])); SITE = sys.argv[2]
CH = json.load(open(sys.argv[3])) if len(sys.argv) > 3 else {'projects': {}, 'archive': []}
cases = json.load(open(SITE + '/data/bali-cases.json'))['cases']
LIVE = {
  'Companies House': {'id': 'uk-companies-house', 'by': 'company number (8 characters)', 'how': 'plain HTTP GET of the public company page; we read name, status, incorporation date and SIC codes'},
}
EXTRA = []
LIVE_EXTRA = {'Australian Business Register (ABN Lookup)': {'id': 'au-abn', 'by': 'ABN (11 digits)', 'how': 'plain HTTP GET of the public ABN page; we read entity name, ABN status and entity type'}}
regs = []
for x in probe + EXTRA:
    r = dict(x)
    live = LIVE.get(x['register']) or LIVE_EXTRA.get(x['register'])
    res = x.get('result', 'reachable')
    if live: status = 'automated'
    elif not x.get('url'): status = 'no official online register'
    elif 'disallow' in res: status = 'robots.txt disallows'
    elif res.startswith('not reachable'): status = 'not reachable'
    elif 'captcha' in res or 'JavaScript' in res: status = 'browser only'
    else: status = 'manual search form'
    r['automation'] = status
    if live: r['lookup'] = live
    regs.append(r)
lines = sorted(['%s %s %s' % (r.get('sha256'), r.get('probed_at'), r.get('url')) for r in regs if r.get('sha256')] + ['%s %s %s' % (a['sha256'], a['fetched_at'], 'companies-house-lookup') for a in CH['archive']])
root = hashlib.sha256(''.join(l + '\n' for l in lines).encode()).hexdigest()
per = {}
for c in cases:
    g = c.get('register')
    if g: per[c['id']] = {'market': c['market'], 'register': g.get('register'), 'item': g.get('item'), 'status': g.get('status'), 'checked': g.get('checked'), 'archived': False,
                          'note': 'Looked up by our research agent; the register response was not archived at the time. New lookups are archived with SHA-256.'}
for pid, x in CH['projects'].items():
    x = dict(x); x['status'] = ', '.join(sorted(set(c['status'] for c in x['companies'])))
    x['note'] = 'Automated: each company named for this project in our research record was searched by exact name on Companies House and its public page read. Names and company numbers are not published while the project is anonymous.'
    per[pid] = x
cnt = {}
for r in regs: cnt[r['automation']] = cnt.get(r['automation'], 0) + 1
out = {'version': 'register-checks-1', 'updated': datetime.date.today().isoformat(),
       'summary': {'registers': len(regs), 'by_automation': cnt, 'projects_with_register_result': len(per), 'automated_project_checks': len(CH['projects']), 'archived_responses': len(lines)},
       'method': ['Every register linked on /registers/ was requested once by our checker (user agent KolaboroRegisterCheck/1.0), after reading the site\'s robots.txt. We store the time, HTTP status, content type, size and SHA-256 of the exact bytes received.',
                  'A register counts as automated only when a lookup by number works over plain HTTP, without a login, captcha or JavaScript, and robots.txt does not forbid it. Everything else is listed as browser only or manual, which is the honest state today.',
                  'The archive root is the SHA-256 of the sorted lines "sha256 time source", one per response (register probes and project lookups; lookup URLs are replaced by a label so they cannot identify a project). It is timestamped in Bitcoin through OpenTimestamps.'],
       'archive_root': root, 'archive_lines': len(lines), 'registers': regs, 'projects': per, 'lookup_archive': [{'register': 'Companies House', 'fetched_at': a['fetched_at'], 'http': a['http'], 'bytes': a['bytes'], 'sha256': a['sha256']} for a in CH['archive']]}
json.dump(out, open(SITE + '/data/register-checks.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(out['summary'], root)
