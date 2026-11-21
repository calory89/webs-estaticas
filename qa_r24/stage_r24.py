# -*- coding: utf-8 -*-
"""Arbol R24 = arbol en vivo de la R23 (stage_r23, verificado byte a byte) + paginas nuevas de work_osm."""
import json, os, shutil, subprocess, hashlib
SN='/home/claude/sn'; W=SN+'/work_osm'; OLD=SN+'/stage_r23'; S=SN+'/stage_r24'; D=S+'/_s/supportnear.com/'
def blob(b): return hashlib.sha1(b'blob %d\0'%len(b)+b).hexdigest()
# foto de lo que hay en vivo (R23)
live={}
OD=OLD+'/_s/supportnear.com/'
for root,_,files in os.walk(OD):
    for f in files:
        p=os.path.join(root,f); live[os.path.relpath(p,OD)]=blob(open(p,'rb').read())
json.dump(live,open('live_r23.json','w'))
shutil.rmtree(S,ignore_errors=True); shutil.copytree(OLD,S)
dele=[]
for top in ('c','t','s','country'):
    os.makedirs(D+top,exist_ok=True)
    new=set(f for f in os.listdir(W+'/'+top) if os.path.isfile(W+'/'+top+'/'+f))
    for f in os.listdir(D+top):
        if f not in new and os.path.isfile(D+top+'/'+f): os.remove(D+top+'/'+f); dele.append(top+'/'+f)
    for f in new: shutil.copyfile(W+'/'+top+'/'+f, D+top+'/'+f)
for f in ('sitemap.xml','sitemap-main.xml','sitemap-needs.xml','sitemap-en.xml','sitemap-places.xml','huecos.html'):
    shutil.copyfile(W+'/'+f, D+f)
# paginas viejas que ya no se generan (ropa con pocos sitios, de rondas anteriores):
# en vez de un 404, una pagina minima que manda a la ciudad y que Google no indexa
stubs=[]
MOVES=json.load(open(W+'/r24_slug_moves.json'))
def stub(rel, href, canon):
    open(D+rel,'w',encoding='utf-8').write('<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="robots" content="noindex,follow">'
        '<link rel="canonical" href="%s"><meta http-equiv="refresh" content="0; url=%s"><title>SupportNear</title></head>'
        '<body><p><a href="%s">SupportNear</a></p></body></html>' % (canon, href, href))
for rel in list(dele):
    top, f = rel.split('/', 1); name = f[:-5]
    tgt = None
    for old, new in MOVES.items():
        if old != new and (name == old or name.startswith(old + '.') or name.startswith(old + '-')):
            cand = new + name[len(old):]
            if top == 'c' and os.path.exists(D + 'c/' + cand + '.html'): tgt = ('c', cand)
            elif top == 'c' and os.path.exists(D + 'c/' + new + '.html'): tgt = ('c', new)
            elif top == 't' and os.path.exists(D + 'c/' + new + '.html'): tgt = ('t', new)
            break
    if not tgt and top == 'c':
        city = name.rsplit('-', 1)[0]
        if os.path.exists(D + 'c/' + city + '.html'): tgt = ('c', city)
    if not tgt: continue
    if tgt[0] == 'c': stub(rel, tgt[1], 'https://supportnear.com/c/' + tgt[1])
    else: stub(rel, '../c/' + tgt[1], 'https://supportnear.com/c/' + tgt[1])
    stubs.append(rel); dele.remove(rel)
json.dump(stubs,open(W+'/r24_stubs.json','w'))
json.dump(dele,open('delete_r24.json','w'))
print('stubs',len(stubs))
print('en vivo',len(live),'| borrados',len(dele),dele[:10])
for k in (1,2):
    r=subprocess.run(['python3',SN+'/qa/live_fix/patch_live.py',S],capture_output=True,text=True)
    print('pasada',k,[l for l in r.stdout.splitlines() if 'files changed' in l or 'worker' in l], r.stderr[-400:])
r=subprocess.run(['python3',SN+'/tools/finish_sw.py',D],capture_output=True,text=True); print(r.stdout.strip()[-300:], r.stderr[-300:])
