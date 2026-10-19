#!/bin/bash
# Uso: crawl.sh dominio -> /home/claude/static/out/dominio (copia estática completa: enlaces + sitemaps)
d=$1; out=/home/claude/static/out/$d; mkdir -p $out; cd $out
start=$(curl -s -m 30 -L -o /dev/null -w '%{url_effective}' -A 'Mozilla/5.0' https://$d/)
base=$(echo "$start" | grep -oE '^https?://[^/]+')
python3 - "$base" > /tmp/seeds_$d.txt <<'PY'
import sys,re,urllib.request,ssl
base=sys.argv[1]; seen=set(); urls=set([base+'/'])
def get(u):
    try: return urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'}),timeout=30).read().decode('utf8','ignore')
    except Exception: return ''
todo=[base+'/wp-sitemap.xml',base+'/sitemap_index.xml',base+'/sitemap.xml']
while todo and len(seen)<400:
    u=todo.pop(); 
    if u in seen: continue
    seen.add(u); x=get(u)
    for loc in re.findall(r'<loc>\s*([^<\s]+)\s*</loc>',x):
        loc=loc.replace('&amp;','&')
        (todo if loc.endswith('.xml') or 'sitemap' in loc.split('/')[-1] else urls).append(loc) if not isinstance(urls,set) else (todo.append(loc) if (loc.endswith('.xml') or 'sitemap' in loc.split('/')[-1]) else urls.add(loc))
print('\n'.join(sorted(urls)))
PY
timeout ${T:-3000} wget -q -e robots=off --mirror --page-requisites --adjust-extension --convert-links \
  -H -D "$d,www.$d" -nH -U 'Mozilla/5.0 (StaticExport)' --tries=2 --timeout=30 \
  --reject-regex '(/feed/?$|/feed/|/wp-json|xmlrpc|wp-login|wp-admin|replytocom|/embed/?$|\?s=|/trackback/?$|\?share=|\?print|add-to-cart|/cart/|/checkout/|/my-account/|/carrito/|/finalizar-compra/|/mi-cuenta/)' \
  -i /tmp/seeds_$d.txt 2>/dev/null
echo "$d start=$start seeds=$(wc -l < /tmp/seeds_$d.txt) files=$(find . -type f | wc -l) html=$(find . -name '*.html' | wc -l) size=$(du -sh . | cut -f1)"
