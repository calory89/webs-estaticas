#!/usr/bin/env python3
"""Kolaboro registry watch: re-checks official registers every week and records what they say per project.
Thailand: ONEP EIA open register (eia.onep.go.th). A report code that is filed but has no approval number = not approved.
Writes data/registry-watch.json (private; the agent publishes only the status per anonymous case)."""
import json, os, re, sys, time, datetime, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__)); DATA = os.path.join(HERE, 'data')
MANUAL = {'the-title-coralina-kamala': '256909-43', 'vibe-town-karon': '256909-55', 'still-sukhumvit-20-sc-asset': '256810-25', 'aquarous-jomtien-pattaya-assetwise': '256707-6'}  # filed reports found on the register by researchers (n27: STILL Sukhumvit 20, Aquarous Jomtien)
THAI = {'Phuket', 'Pattaya', 'Bangkok', 'Koh Samui', 'Chiang Mai', 'Hua Hin', 'Thailand', 'Krabi', 'Koh Phangan'}

def onep_all(max_pages=200):
    out = {}
    for page in range(1, max_pages + 1):
        try:
            d = json.load(urllib.request.urlopen(urllib.request.Request('https://eia.onep.go.th/services/web/open-api/eia-list?page=%d' % page, headers={'user-agent': 'KolaboroRegistryWatch/1.0 (+https://kolaboro.com/research)'}), timeout=60))
        except Exception as e:
            print('page fail', page, e); time.sleep(3); continue
        rows = d.get('dataList') or []
        if not rows: break
        for r in rows:
            if r.get('code'): out[str(r['code']).strip()] = r
        time.sleep(0.4)
    return out

def main():
    P = json.load(open(os.path.join(HERE, 'projects.json')))['projects'] + json.load(open(os.path.join(HERE, 'projects-world.json')))['projects']
    watch = {}
    for p in P:
        if p.get('market') not in THAI and p.get('country') != 'Thailand': continue
        m = re.search(r'report (\d{6}-\d+|\d{4,5})\b', str(p.get('permit_number') or ''))
        code = MANUAL.get(p['slug']) or (m.group(1) if m else None)
        if code: watch[p['slug']] = code
    reg = onep_all()
    today = datetime.date.today().isoformat(); res = {}
    for slug, code in watch.items():
        r = reg.get(code)
        if r and r.get('approve_number'):
            res[slug] = {'register': 'Thailand ONEP EIA register', 'item': 'environmental approval', 'status': 'approved', 'detail': 'approval ' + r['approve_number'] + ' dated ' + str(r.get('approve_date')) + ' (Thai calendar)', 'code': code, 'checked': today}
        elif r:
            res[slug] = {'register': 'Thailand ONEP EIA register', 'item': 'environmental approval', 'status': 'filed, not approved', 'code': code, 'checked': today}
        else:
            res[slug] = {'register': 'Thailand ONEP EIA register', 'item': 'environmental approval', 'status': 'not in the approved list', 'code': code, 'checked': today}
        print(slug, res[slug]['status'])
    # n27 (13 Nov 2026): records from other official registers checked by hand (Malaysia KPKT TEDUH, Florida DBPR condominium filings)
    # are kept as they are; this job only refreshes the Thai ONEP rows
    try:
        prev = json.load(open(os.path.join(DATA, 'registry-watch.json'))).get('projects', {})
    except Exception:
        prev = {}
    for slug, r in prev.items():
        if slug not in res and r.get('register') != 'Thailand ONEP EIA register': res[slug] = r
    json.dump({'updated': today, 'records_scanned': len(reg), 'projects': res}, open(os.path.join(DATA, 'registry-watch.json'), 'w'), ensure_ascii=False, indent=1)
    print('scanned', len(reg), 'watched', len(res))

if __name__ == '__main__': main()
