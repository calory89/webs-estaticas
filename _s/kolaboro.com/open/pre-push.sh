#!/bin/sh
# Kolaboro push check (13 Nov 2026). Written to be installed as the git pre-push hook of the repository that publishes kolaboro.com
# (cp to .git/hooks/pre-push), so it runs on every push to pub/_lovable without using any CI minutes; run it by hand until then. It REPORTS and never blocks: the branch also deploys about 60 other sites.
# The one exception (n32w, 19 Nov 2026): 0. worker size guard (open/worker-size-guard.sh) STOPS the push when _worker.js passes 24.6 MiB,
# because Cloudflare Pages refuses every build of the branch above 25 MiB (18 Nov 2026: about 60 sites blocked for an hour).
#   1. bundle check of the edge worker (esbuild, the same command the publishers run by hand), result printed with its exit code
#   2. bundle size: a warning when the bundle is more than 5% bigger than the last published build (/data/builds.json)
#   4. performance budget per template and 5. search ranking test in 8 languages (n34c, 21 Nov 2026), both report only
#   3. after the push, the live site runs its own smoke test of 20 key pages on the first request for the new commit:
#      https://kolaboro.com/status/#keypages (raw: /api/x/status/pages), every 5 minutes after that.
# Each result is appended to .git/kolaboro-push-checks.log (time, branch, commit, exit code).
remote="$1"
want=0
while read -r lref lsha rref rsha; do
  case "$rref" in refs/heads/pub/_lovable) want=1; sha="$lsha";; esac
done
[ "$want" = 1 ] || exit 0
top=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
# 0. worker size guard (n32w): read from the pushed commit itself, so it works in sparse checkouts too
if git cat-file -e "$sha:_s/kolaboro.com/open/worker-size-guard.sh" 2>/dev/null; then
  git show "$sha:_s/kolaboro.com/open/worker-size-guard.sh" | (cd "$top" && sh -s "$sha") || { echo "kolaboro push check: PUSH STOPPED by the worker size guard (see above)."; exit 1; }
fi
[ -f "$top/_worker.js/index.js" ] || { echo "kolaboro push check: _worker.js not in this checkout, skipped"; exit 0; }
tmp=$(mktemp -d 2>/dev/null || echo /tmp/kbpp$$); mkdir -p "$tmp"
out=$(cd "$top" && timeout 120 npx -y esbuild _worker.js/index.js --bundle --format=esm --platform=neutral --external:'node:*' --log-level=error --legal-comments=none --charset=utf8 --outfile="$tmp/worker.js" 2>&1); code=$?
echo "$out" | tail -n 5
# 3. bundle size control (n31t, 18 Nov 2026): warn when the bundle is more than 5% bigger than the last published build
#    (/data/builds.json, same esbuild options). Reports only, like the rest of this hook.
if [ "$code" = 0 ] && [ -f "$tmp/worker.js" ]; then
  now=$(wc -c < "$tmp/worker.js" | tr -d ' ')
  last=$(python3 -c "import json,sys;b=sorted(json.load(open(sys.argv[1]))['builds'],key=lambda x:x.get('built_at') or '');print(b[-1]['bytes'] if b else 0)" "$top/_s/kolaboro.com/data/builds.json" 2>/dev/null || echo 0)
  if [ -n "$last" ] && [ "$last" -gt 0 ] 2>/dev/null; then
    pct=$(python3 -c "print(round(($now-$last)*100/$last,1))")
    echo "kolaboro push check: bundle $now bytes, last published build $last bytes ($pct%)"
    python3 -c "import sys;sys.exit(0 if ($now-$last)*100/$last<=5 else 1)" || echo "kolaboro push check: WARNING bundle grew more than 5% since the last published build. Load new code lazily (import() in the route) or justify it in the commit message."
  fi
fi
rm -rf "$tmp" 2>/dev/null
# 4. performance budget per template (n34c, 21 Nov 2026): raw bytes of the static scripts each template loads, read from the pushed commit,
#    against /open/perf-budget.json; and 5. the search ranking regression test in 8 languages (/open/search-tests.json). Both report only.
if git cat-file -e "$sha:_s/kolaboro.com/open/n34c-build.py" 2>/dev/null; then
  git show "$sha:_s/kolaboro.com/open/n34c-build.py" > "${TMPDIR:-/tmp}/kb-n34c-build.py" && (cd "$top" && python3 "${TMPDIR:-/tmp}/kb-n34c-build.py" budget "$sha") || echo "kolaboro push check: WARNING a template is over its performance budget (see above, /engineering/performance/)"
fi
if [ -f "$top/_s/kolaboro.com/open/search-quality.mjs" ] && [ -f "$top/_worker.js/kbx_n31e.js" ]; then
  (cd "$top" && timeout 120 node _s/kolaboro.com/open/search-quality.mjs . | tail -n 9) || echo "kolaboro push check: WARNING search ranking regression (see above, /engineering/search-quality/)"
fi
if [ "$code" = 0 ]; then echo "kolaboro push check: bundle OK (exit=0). After the deploy see https://kolaboro.com/status/#keypages"
else echo "kolaboro push check: BUNDLE FAILED (exit=$code). The push goes ahead (report only); fix it now: a broken bundle breaks every site on this branch."; fi
log="$(git rev-parse --git-common-dir)/kolaboro-push-checks.log"
printf '%s %s %s bundle_exit=%s\n' "$(date -u +%FT%TZ)" "$remote" "$(echo "$sha" | cut -c1-12)" "$code" >> "$log" 2>/dev/null
exit 0
