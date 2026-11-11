#!/bin/bash
# uso: lh.sh URL nombre
export CHROME_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome
lighthouse "$1" --quiet --chrome-flags="--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage" --only-categories=performance,accessibility,best-practices,seo --output=json --output-path="lh_$2.json" --max-wait-for-load=60000 2>/dev/null
python3 - "$2" <<'P'
import json,sys
d=json.load(open('lh_%s.json'%sys.argv[1])); a=d['audits']
print(sys.argv[1], {k:round(v['score']*100) if v['score'] is not None else None for k,v in d['categories'].items()})
for k in ['first-contentful-paint','largest-contentful-paint','total-blocking-time','speed-index','cumulative-layout-shift','interactive','max-potential-fid','server-response-time','total-byte-weight','bootup-time','mainthread-work-breakdown','dom-size']:
    if k in a: print('  ',k, a[k].get('displayValue'))
bad=[(k,v.get('displayValue') or '', v['title']) for k,v in a.items() if v.get('score') is not None and v['score']<0.9 and v.get('scoreDisplayMode') in ('binary','numeric','metricSavings')]
for b in bad: print('   !',b)
P
