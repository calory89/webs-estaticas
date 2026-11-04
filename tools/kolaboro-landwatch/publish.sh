#!/usr/bin/env bash
# Publish $RUNNER_TEMP/$F to _s/kolaboro.com/data/$F on pub/_lovable (git plumbing, same pattern as kolaboro-images.yml). Retries on a race.
set -e
git config user.name "kolaboro-agent"; git config user.email "agent@kolaboro.com"
python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$RUNNER_TEMP/$F"
git fetch -q --depth=1 --filter=blob:none origin pub/_lovable
for i in 1 2 3 4 5; do
  P=$(git rev-parse FETCH_HEAD)
  export GIT_INDEX_FILE=$RUNNER_TEMP/idx-$F; rm -f $GIT_INDEX_FILE; git read-tree $P
  H=$(git hash-object -w "$RUNNER_TEMP/$F")
  git update-index --add --cacheinfo 100644,$H,_s/kolaboro.com/data/$F
  T=$(git write-tree); unset GIT_INDEX_FILE
  [ "$(git rev-parse $P^{tree})" = "$T" ] && { echo "no change"; exit 0; }
  C=$(git commit-tree $T -p $P -m "kolaboro.com: $MSG $(date -u +%F)")
  git push -q origin $C:refs/heads/pub/_lovable && exit 0
  sleep $((5 + RANDOM % 10)); git fetch -q --depth=1 --filter=blob:none origin pub/_lovable
done; exit 1
