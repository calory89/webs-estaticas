#!/bin/sh
# Kolaboro push check (13 Nov 2026). Written to be installed as the git pre-push hook of the repository that publishes kolaboro.com
# (cp to .git/hooks/pre-push), so it runs on every push to pub/_lovable without using any CI minutes; run it by hand until then. It REPORTS and never blocks: the branch also deploys about 60 other sites.
#   1. bundle check of the edge worker (esbuild, the same command the publishers run by hand), result printed with its exit code
#   2. after the push, the live site runs its own smoke test of 20 key pages on the first request for the new commit:
#      https://kolaboro.com/status/#keypages (raw: /api/x/status/pages), every 5 minutes after that.
# Each result is appended to .git/kolaboro-push-checks.log (time, branch, commit, exit code).
remote="$1"
want=0
while read -r lref lsha rref rsha; do
  case "$rref" in refs/heads/pub/_lovable) want=1; sha="$lsha";; esac
done
[ "$want" = 1 ] || exit 0
top=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
[ -f "$top/_worker.js/index.js" ] || { echo "kolaboro push check: _worker.js not in this checkout, skipped"; exit 0; }
out=$(cd "$top" && timeout 120 npx -y esbuild _worker.js/index.js --bundle --format=esm --platform=neutral --external:'node:*' --outfile=/dev/null 2>&1); code=$?
echo "$out" | tail -n 5
if [ "$code" = 0 ]; then echo "kolaboro push check: bundle OK (exit=0). After the deploy see https://kolaboro.com/status/#keypages"
else echo "kolaboro push check: BUNDLE FAILED (exit=$code). The push goes ahead (report only); fix it now: a broken bundle breaks every site on this branch."; fi
log="$(git rev-parse --git-common-dir)/kolaboro-push-checks.log"
printf '%s %s %s bundle_exit=%s\n' "$(date -u +%FT%TZ)" "$remote" "$(echo "$sha" | cut -c1-12)" "$code" >> "$log" 2>/dev/null
exit 0
