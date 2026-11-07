#!/bin/sh
# Package the Kolaboro X-ray extension: ./build.sh <out.zip>
# The zip holds one folder, kolaboro-x-ray/, ready for "Load unpacked" and for the Chrome Web Store / Edge Add-ons upload
# (the stores accept the same zip). Tests and store material are left out.
set -e
cd "$(dirname "$0")"
OUT="${1:-/tmp/kolaboro-x-ray.zip}"
case "$OUT" in /*) ;; *) OUT="$OLDPWD/$OUT";; esac
TMP=$(mktemp -d); mkdir "$TMP/kolaboro-x-ray"
cp -r manifest.json background.js content.js kx.js i18n.js popup.html popup.css popup.js icons _locales "$TMP/kolaboro-x-ray/"
node -e "JSON.parse(require('fs').readFileSync('$TMP/kolaboro-x-ray/manifest.json','utf8'))"
for f in "$TMP"/kolaboro-x-ray/*.js; do node --check "$f"; done
rm -f "$OUT"; (cd "$TMP" && TZ=UTC find kolaboro-x-ray -exec touch -t 202611070000 {} + && zip -qrX "$OUT" kolaboro-x-ray)
rm -rf "$TMP"; echo "$OUT"; unzip -l "$OUT" | tail -1
