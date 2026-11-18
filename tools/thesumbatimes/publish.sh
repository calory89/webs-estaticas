#!/usr/bin/env bash
# One safe publish of thesumbatimes.com: build, check (0 errors or stop), bundle, syntax check, commit both repos, trigger the deploy job.
# Usage: bash publish.sh "what changed"     (needs calory89/claude-ops checked out beside webs-estaticas, or TST_OPS=<path to its data/thesumbatimes>)
set -euo pipefail
cd "$(dirname "$0")"; MSG="${1:-update}"
OPS="$(cd "${TST_OPS:-../../../claude-ops/data/thesumbatimes}" && pwd)"; OPSROOT="$(cd "$OPS/../.." && pwd)"
python3 build.py > /tmp/tst_build.log 2>&1 || { tail -20 /tmp/tst_build.log; echo "BUILD FAILED"; exit 1; }
python3 check.py > /tmp/tst_check.log 2>&1 || { grep '^error' /tmp/tst_check.log | head -40; echo "CHECK FAILED"; exit 1; }
tail -1 /tmp/tst_check.log
grep -q '^0 errors' /tmp/tst_check.log || { grep '^error' /tmp/tst_check.log | head -40; echo "CHECK HAS ERRORS"; exit 1; }
TST_OPS="$OPS" python3 deploy.py | tail -3
node --check worker/index.js
git add -A . && git commit -qm "thesumbatimes: $MSG" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>" || echo "(nothing new to commit in webs-estaticas)"
git pull -q --rebase && git push -q
H=$(git rev-parse --short HEAD); NOW=$(date -u +%FT%TZ)
cd "$OPSROOT"
echo "webs-estaticas $H $NOW" > data/thesumbatimes/BUILD
echo "# deploy $H $MSG $NOW" >> jobs/tst_deploy.sh
git add data/thesumbatimes/index.js.gz data/thesumbatimes/pages.json.gz data/thesumbatimes/metadata.json data/thesumbatimes/og.json data/thesumbatimes/BUILD jobs/tst_deploy.sh
git commit -qm "thesumbatimes deploy $H: $MSG" -m "Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"
git pull -q --rebase && git push -q
echo "pushed $H. Result in a couple of minutes: claude-ops out/tst_deploy.txt (expect: pages uploaded, upload http 200, success True, # exit=0)"
