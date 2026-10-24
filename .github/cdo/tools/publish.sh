#!/bin/bash
# Uso: CF=<token> publish.sh "mensaje del commit"
# Commit + push a pub/carlosdeory.com, espera al despliegue de Pages, purga cache, IndexNow de lo cambiado, comprobacion.
set -e
cd /home/claude/cdo
MSG="$1"
ACC=d275d2609c10aa655477fd7a47e9b443; ZONE=0f632ee6cd9e19dee524c7a2b793c64c
git fetch -q origin pub/carlosdeory.com
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/pub/carlosdeory.com)" ] && ! git merge-base --is-ancestor origin/pub/carlosdeory.com HEAD; then
  echo "AVISO: la rama remota tiene commits nuevos de otra sesion"; git log --oneline HEAD..origin/pub/carlosdeory.com | head; exit 3
fi
git add -A
CHANGED=$(git diff --cached --name-only | grep -E '\.html$' | grep -v -E '^(tag/|\.github/)' || true)
git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -q -m "$MSG

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_016rX4Csi38ZMgkf5ZeKssU7"
SHA=$(git rev-parse HEAD)
git push -q origin HEAD:pub/carlosdeory.com
echo "commit ${SHA:0:8}"
# esperar despliegue
for i in $(seq 1 60); do
  st=$(curl -s -H "Authorization: Bearer $CF" "https://api.cloudflare.com/client/v4/accounts/$ACC/pages/projects/web-carlosdeory/deployments?per_page=5" | python3 -c "
import json,sys
d=json.load(sys.stdin)
for x in d.get('result',[]):
  if x.get('deployment_trigger',{}).get('metadata',{}).get('commit_hash','').startswith('$SHA'[:12]):
    print(x['latest_stage']['name']+':'+x['latest_stage']['status']); break
else: print('pending')")
  case "$st" in deploy:success) break;; *failure*) echo "DESPLIEGUE FALLIDO $st"; exit 4;; esac
  sleep 10
done
echo "deploy $st"
curl -s -X POST -H "Authorization: Bearer $CF" -H "Content-Type: application/json" "https://api.cloudflare.com/client/v4/zones/$ZONE/purge_cache" -d '{"purge_everything":true}' | python3 -c "import json,sys;print('purge',json.load(sys.stdin)['success'])"
# IndexNow
python3 - "$CHANGED" <<'EOF'
import sys,json,urllib.request
key=open('/home/claude/cdo/'+[l for l in __import__('os').listdir('/home/claude/cdo') if len(l)==36 and l.endswith('.txt')][0]).read().strip()
fs=[f for f in sys.argv[1].split() if f and f!='404.html' and '/page/' not in f]
urls=sorted({'https://www.carlosdeory.com/'+(f[:-10] if f.endswith('index.html') else f) for f in fs})[:10000]
if not urls: print('indexnow 0'); sys.exit()
b=json.dumps({'host':'www.carlosdeory.com','key':key,'keyLocation':f'https://www.carlosdeory.com/{key}.txt','urlList':urls}).encode()
try: r=urllib.request.urlopen(urllib.request.Request('https://api.indexnow.org/indexnow',data=b,headers={'Content-Type':'application/json; charset=utf-8'}),timeout=60); print('indexnow',len(urls),r.status)
except urllib.error.HTTPError as e: print('indexnow',len(urls),e.code)
EOF
python3 .github/cdo/check.py
