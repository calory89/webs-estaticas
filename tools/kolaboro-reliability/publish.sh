#!/usr/bin/env bash
# Publish files to kolaboro.com (branch pub/_lovable) with git plumbing, without checking the branch out.
# Usage: publish.sh "<commit message>" <local file>=<path in repo> [...]
# Run from a checkout of this repository (actions/checkout has set up the token).
set -e
MSG="$1"; shift
git config user.name "kolaboro-agent"; git config user.email "agent@kolaboro.com"
git fetch -q --depth=1 --filter=blob:none origin pub/_lovable
for i in 1 2 3 4 5 6; do
  P=$(git rev-parse FETCH_HEAD)
  export GIT_INDEX_FILE=$RUNNER_TEMP/idx; rm -f $GIT_INDEX_FILE; git read-tree $P
  for pair in "$@"; do
    SRC="${pair%%=*}"; DST="${pair#*=}"
    H=$(git hash-object -w "$SRC")
    git update-index --add --cacheinfo 100644,$H,"$DST"
  done
  T=$(git write-tree); unset GIT_INDEX_FILE
  [ "$(git rev-parse $P^{tree})" = "$T" ] && { echo "no change"; exit 0; }
  C=$(git commit-tree $T -p $P -m "$MSG")
  git push -q origin $C:refs/heads/pub/_lovable && { echo "published $C"; exit 0; }
  sleep $((5 + i * 3)); git fetch -q --depth=1 --filter=blob:none origin pub/_lovable
done
exit 1
