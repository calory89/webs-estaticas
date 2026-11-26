#!/bin/sh
# Kolaboro worker size guard (n32w, 19 Nov 2026). Cloudflare Pages refuses to build the branch pub/_lovable (about 60 sites, all of
# them) when the _worker.js directory passes 25 MiB; that happened on 18 Nov 2026 and blocked every site for about an hour.
# This guard sums the git blob sizes of _worker.js/ in a commit and FAILS (exit 1) above the limit, 24.6 MiB by default, so a push
# never reaches the Pages limit. Big string tables and data belong in /_s/kolaboro.com/data/ (static files, not counted), loaded
# with env.ASSETS.fetch once per isolate (see _worker.js/kbx_strings.js).
#   usage:   sh worker-size-guard.sh [commit]            (default HEAD; KB_WORKER_MAX_MIB=24.6 to change the limit)
#   prints:  worker size in MiB and bytes, the limit, the 10 largest modules when it fails
#   hook:    open/pre-push.sh runs it for every push to pub/_lovable and stops the push when it fails
# Same number as `git ls-tree -r -l HEAD _worker.js | awk '{s+=$4} END {print s/1048576}'`. Published at kolaboro.com/open/worker-size-guard.sh.
rev="${1:-HEAD}"
max="${KB_WORKER_MAX_MIB:-24.6}"
top=$(git rev-parse --show-toplevel 2>/dev/null) || { echo "worker size guard: not inside a git checkout"; exit 2; }
list=$(git -C "$top" ls-tree -r -l "$rev" -- _worker.js 2>/dev/null) || { echo "worker size guard: cannot read $rev"; exit 2; }
[ -n "$list" ] || { echo "worker size guard: no _worker.js in $rev, nothing to check"; exit 0; }
bytes=$(printf '%s\n' "$list" | awk '{s+=$4} END {printf "%d", s}')
mib=$(awk -v b="$bytes" 'BEGIN {printf "%.2f", b/1048576}')
if awk -v b="$bytes" -v m="$max" 'BEGIN {exit !(b/1048576 > m)}'; then
  echo "worker size guard: FAILED. _worker.js is $mib MiB ($bytes bytes) in $(git -C "$top" rev-parse --short "$rev"), limit $max MiB (Pages refuses above 25 MiB)."
  echo "Largest modules:"; printf '%s\n' "$list" | sort -k4 -n -r | head -n 10 | awk '{printf "  %8.1f KB  %s\n", $4/1024, $5}'
  echo "Move string tables or data to /_s/kolaboro.com/data/ (see _worker.js/kbx_strings.js) and try again."
  exit 1
fi
echo "worker size guard: OK. _worker.js is $mib MiB ($bytes bytes), limit $max MiB."
exit 0
