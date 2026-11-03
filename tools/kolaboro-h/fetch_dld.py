# Fetch Dubai Land Department open transactions (residential off-plan sales) month by month.
# Source: POST https://gateway.dubailand.gov.ae/open-data/transactions (the API behind dubailand.gov.ae > Open Data > Real Estate Data; no account).
# Output: one compact JSON-lines file per month in OUT dir, plus raw-response SHA-256 per page in a manifest.
import json, sys, time, hashlib, urllib.request, calendar, os
OUT = sys.argv[1]
months = sys.argv[2:]  # YYYY-MM
URL = 'https://gateway.dubailand.gov.ae/open-data/transactions'
HDR = {'content-type': 'application/json', 'origin': 'https://dubailand.gov.ae', 'referer': 'https://dubailand.gov.ae/', 'user-agent': 'KolaboroResearch/1.0 (+https://kolaboro.com/prices/)'}
man = []
for ym in months:
    y, m = map(int, ym.split('-'))
    last = calendar.monthrange(y, m)[1]
    fn = os.path.join(OUT, ym + '.jsonl')
    if os.path.exists(fn):
        continue
    rows, skip, total = [], 0, None
    while True:
        body = {"P_FROM_DATE": f"{m:02d}/01/{y}", "P_TO_DATE": f"{m:02d}/{last:02d}/{y}", "P_GROUP_ID": "1", "P_IS_OFFPLAN": "1", "P_IS_FREE_HOLD": "", "P_AREA_ID": "", "P_USAGE_ID": "1", "P_PROP_TYPE_ID": "", "P_TAKE": "2000", "P_SKIP": str(skip), "P_SORT": "TRANSACTION_NUMBER_ASC"}
        for attempt in range(4):
            try:
                req = urllib.request.Request(URL, data=json.dumps(body).encode(), headers=HDR, method='POST')
                raw = urllib.request.urlopen(req, timeout=120).read()
                d = json.loads(raw)
                break
            except Exception as e:
                print('retry', ym, skip, e, file=sys.stderr); time.sleep(5 * (attempt + 1))
        else:
            raise SystemExit('failed ' + ym)
        man.append({'month': ym, 'skip': skip, 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest(), 'at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())})
        res = d['response']['result'] or []
        if total is None and res: total = res[0]['TOTAL']
        for r in res:
            rows.append({'d': r['INSTANCE_DATE'][:10], 'a': r['AREA_EN'], 'v': r['TRANS_VALUE'], 'm2': r['ACTUAL_AREA'] or r['PROCEDURE_AREA'], 'p': r['PROCEDURE_EN'], 't': r['PROP_SB_TYPE_EN'] or r['PROP_TYPE_EN'], 'fh': r['IS_FREE_HOLD']})
        skip += 2000
        if not res or skip >= (total or 0): break
        time.sleep(1.5)
    with open(fn, 'w') as f:
        for r in rows: f.write(json.dumps(r) + '\n')
    print(ym, total, len(rows), file=sys.stderr)
with open(os.path.join(OUT, 'manifest-%d.json' % int(time.time())), 'w') as f: json.dump(man, f)
