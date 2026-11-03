#!/bin/bash
# Kolaboro market truth batch: official sales, register checks, risk patterns. Usage: run.sh <site dir with data/> <work dir>
# Writes <site>/data/price-reality.json, risk.json, register-checks.json. Downloads stay in <work>, scripts here.
set -euo pipefail
H=$(cd "$(dirname "$0")" && pwd); SITE=$1; W=$2; AG=$H/../kolaboro-agent
mkdir -p "$W/dl/dld" "$W/dl/ppd" "$W/dl/ppr" "$W/dl/agent"
python3 -I "$H/idmap.py" "$AG" "$W/dl/agent"
curl -sS -m 60 https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml -o "$W/dl/ecb.xml"
Y=$(date -u +%Y); M=$(date -u +%-m)
MONTHS=$(python3 -c "import datetime as d;t=d.date.today().replace(day=1);o=[]
for i in range(1,11):
  m=(t.month-i-1)%12+1;y=t.year+((t.month-i-1)//12);o.append('%d-%02d'%(y,m))
print(' '.join(sorted(o)))")
python3 -I "$H/fetch_dld.py" "$W/dl/dld" $MONTHS
python3 -I "$H/fetch_ppd.py" "$W/dl/ppd/rows.jsonl" $((Y-1)) $Y
for y in $((Y-1)) $Y; do curl -sS -m 120 -A 'KolaboroResearch/1.0' "https://www.propertypriceregister.ie/website/npsra/ppr/npsra-ppr.nsf/Downloads/PPR-$y-Dublin.csv/\$FILE/PPR-$y-Dublin.csv" -o "$W/dl/ppr/ppr-$y.csv"; done
python3 -I "$H/price_reality.py" "$W/dl" "$SITE" "$W/dl/ecb.xml"
python3 -I "$H/risk.py" "$SITE" "$W/dl/agent"
python3 -I "$H/registers_list.py" "$SITE/registers/index.html" > "$W/dl/registers.json"
python3 -I "$H/probe_registers.py" "$W/dl/registers.json" "$W/dl/probe.json"
python3 -I "$H/ch_batch.py" "$W/dl/agent" "$W/dl/ch.json"
python3 -I "$H/register_checks.py" "$W/dl/probe.json" "$SITE" "$W/dl/ch.json"
# timestamp the archive roots in Bitcoin through the site's own OpenTimestamps endpoint (best effort)
for h in $(python3 -c "import json;print(json.load(open('$SITE/data/register-checks.json'))['archive_root'], json.load(open('$SITE/data/price-reality.json'))['inputs_sha256'])"); do
  curl -sS -m 60 -X POST https://kolaboro.com/api/kb/stamp -H 'content-type: application/json' -d "{\"hash\":\"$h\",\"source\":\"kbx-h\"}" -o /dev/null || true
done
