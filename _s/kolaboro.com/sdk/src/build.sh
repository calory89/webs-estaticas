#!/bin/sh
# Builds the published SDK files from these sources (run from sdk/src). Needs node 20+, tsc and python3.
#   ../kolaboro.mjs (+ kolaboro-0.1.0.mjs, kolaboro.d.ts)  ES module: kolaboro-verify.js unchanged + compiled kolaboro.ts
#   ../kolaboro-0.1.0-py3-none-any.whl                   Python wheel (kolaboro_verify.py unchanged as kolaboro/_verify.py)
#   ../SHA256SUMS, ../manifest.json                       hashes, SRI
set -e
cd "$(dirname "$0")"
V=0.1.0
T=$(mktemp -d)
cp ../../open/kolaboro_verify.py python/kolaboro/_verify.py
tsc --target es2020 --module es2020 --lib es2020,dom --strict --declaration --skipLibCheck --outDir "$T" js/kolaboro.ts
KEYS=$(python3 -c "import json;d=json.load(open('../../.well-known/kolaboro-keys.json'));print(json.dumps([{k:x[k] for k in ('kid','alg','public_key_raw_b64','status')} for x in d['keys']]))")
{
  echo "/*! kolaboro $V | MIT | https://kolaboro.com/docs/sdk/ | bundles kolaboro-verify.js unchanged (https://kolaboro.com/open/kolaboro-verify.js) */"
  echo "const __KV__ = (function () { var module = { exports: {} };"
  cat ../../open/kolaboro-verify.js
  echo "; return module.exports; })();"
  echo "const __KEYS__ = $KEYS;"
  cat "$T/kolaboro.js"
} > ../kolaboro.mjs
cp ../kolaboro.mjs ../kolaboro-$V.mjs
cp "$T/kolaboro.d.ts" ../kolaboro.d.ts
cp README.md python/README.md
rm -rf "$T"
PYTHONDONTWRITEBYTECODE=1 python3 python/make_wheel.py ..
cd ..
sha256sum kolaboro.mjs kolaboro-$V.mjs kolaboro.d.ts kolaboro-$V-py3-none-any.whl > SHA256SUMS
python3 - <<P
import base64, hashlib, json
f = lambda n: open(n, 'rb').read()
m = {'version': '$V', 'files': {}}
for n in ['kolaboro.mjs', 'kolaboro-$V.mjs', 'kolaboro.d.ts', 'kolaboro-$V-py3-none-any.whl']:
    b = f(n); m['files'][n] = {'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest(), 'sri': 'sha384-' + base64.b64encode(hashlib.sha384(b).digest()).decode()}
json.dump(m, open('manifest.json', 'w'), indent=1)
P
cat SHA256SUMS
