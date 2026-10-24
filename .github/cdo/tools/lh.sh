#!/bin/bash
# uso: lh.sh URL salida.json
export CHROME_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome
cd /tmp && timeout 200 npx -y lighthouse "$1" --only-categories=performance --chrome-flags="--headless --no-sandbox" --output=json --output-path="$2" --quiet >/dev/null 2>&1
python3 - "$2" <<'P'
import json,sys;d=json.load(open(sys.argv[1]));a=d['audits']
print('score',d['categories']['performance']['score'])
for k in ['first-contentful-paint','largest-contentful-paint','total-blocking-time','cumulative-layout-shift','speed-index','total-byte-weight']: print(k,a[k].get('displayValue'))
for o in sorted([x for x in a.values() if x.get('details',{}).get('type')=='opportunity' and (x.get('numericValue') or 0)>0],key=lambda x:-x['numericValue'])[:6]: print(' opp',o['id'],o.get('displayValue'))
try: print(' lcp', a['largest-contentful-paint-element']['details']['items'][0]['items'][0]['node']['snippet'][:160])
except Exception as e: pass
P
