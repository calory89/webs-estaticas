# Automated Companies House checks for UK-tracked projects: every company named in the private research record
# (developer, SPV or site owner) is searched by exact name, then its public page is read. Each response is archived
# (time, URL, SHA-256 of the bytes). The public output carries the status only: no company names or numbers.
import json, sys, re, time, hashlib, urllib.request, urllib.parse, html, os
AG, OUT = sys.argv[1], sys.argv[2]
UA = 'KolaboroRegisterCheck/1.0 (+https://kolaboro.com/registers/checks/)'
idm = json.load(open(AG + '/idmap.json'))
PJ = {p['slug']: p for p in json.load(open(AG + '/pb.json'))['projects'] + json.load(open(AG + '/pw.json'))['projects']}
UK = {'London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool', 'Edinburgh', 'Glasgow'}
arch = []
def get(url):
    r = urllib.request.urlopen(urllib.request.Request(url, headers={'user-agent': UA}), timeout=30); b = r.read()
    arch.append({'url': url, 'fetched_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'http': r.status, 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest()})
    time.sleep(1.2); return b.decode('utf-8', 'replace')
norm = lambda s: re.sub(r'[^A-Z0-9]', '', re.sub(r'\b(LIMITED|LTD)\b\.?', 'LTD', s.upper().replace('&', 'AND')))
def clean(t): return html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', t))).strip()
res = {}
for pid, slug in sorted(idm.items()):
    p = PJ[slug]
    if p.get('market') not in UK: continue
    names = [m for seg in re.split(r'[();,]| with | and |; ', p.get('developer') or '') for m in re.findall(r"([A-Z][A-Za-z0-9&.' -]*?\b(?:Limited|Ltd|PLC))\b", seg)]
    names = [re.sub(r'^(?:SPV|site owner|seller|site company|planning applicant|freehold held by|with landowner)\s+', '', n.strip(), flags=re.I) for n in names]
    found = []
    for n in dict.fromkeys(names):
        s = get('https://find-and-update.company-information.service.gov.uk/search/companies?q=' + urllib.parse.quote(n))
        hits = [m.group(1) for m in re.finditer(r'href="/company/([A-Z0-9]{8})"[^>]*>(.*?)</a>', s, re.S) if norm(clean(m.group(2))) == norm(n)]
        hit = None; dissolved = '<span>Dissolved' in s or 'Dissolved' in s
        for h in hits:   # same name can exist twice (an old dissolved company and a new one): prefer the live one
            ctx = s[s.find('/company/' + h):][:1500]
            if 'Dissolved' not in ctx: hit = h; break
        if not hit and hits: hit = hits[0]
        if not hit: found.append({'role': 'named company', 'status': 'no exact match on the UK register (it may be registered abroad)'}); continue
        c = get('https://find-and-update.company-information.service.gov.uk/company/' + hit)
        dd = lambda i: (lambda m: clean(m.group(1)) if m else None)(re.search(r'id="' + i + r'"[^>]*>([\s\S]*?)</(?:dd|p)>', c))
        inc = dd('company-creation-date') or ''
        found.append({'role': 'named company', 'status': (dd('company-status') or 'unknown').lower(), 'incorporated_year': (re.search(r'\d{4}', inc) or [None])[0], 'type': dd('company-type')})
    if found: res[pid] = {'market': p['market'], 'register': 'Companies House (UK)', 'item': 'companies named as developer, project company or site owner', 'checked': time.strftime('%Y-%m-%d'), 'archived': True, 'companies': found}
    print(pid, found, file=sys.stderr)
json.dump({'projects': res, 'archive': arch}, open(OUT, 'w'))
