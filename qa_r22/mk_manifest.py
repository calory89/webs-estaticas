import json, os, hashlib, tarfile, io, sys, collections
S='/home/claude/sn/stage_r22'; D=S+'/_s/supportnear.com/'
live=json.load(open('live_r22.json'))
def blob(b): return hashlib.sha1(b'blob %d\0'%len(b)+b).hexdigest()
changed={}; sizes={}; binary=[]
for root,_,files in os.walk(D):
    for f in files:
        p=os.path.join(root,f); rel=os.path.relpath(p,D)
        b=open(p,'rb').read(); s=blob(b)
        if live.get(rel)!=s:
            changed[rel]=s; sizes[rel]=len(b)
            try: b.decode('utf-8')
            except UnicodeDecodeError: binary.append(rel)
w=open(S+'/_worker.js/index.js','rb').read()
kinds=collections.Counter((r.split('/')[0] if '/' in r else r.rsplit('.',1)[-1]) for r in changed)
print('cambiados',len(changed),'bytes',sum(sizes.values()),'binarios',binary[:5],'nuevos',len([r for r in changed if r not in live]))
print(dict(kinds))
print('no html:',[r for r in changed if not r.endswith('.html')][:80])
# trozos de ~6 MB sin comprimir como mucho 600 ficheros
out='/tmp/claude-0/-home-claude/c68e587c-e18a-57a7-a2c7-85e43169e67c/scratchpad/r22/pubb'; os.makedirs(out,exist_ok=True)
for f in os.listdir(out): os.remove(os.path.join(out,f))
rels=sorted(changed); chunks=[]; cur=[]; cb=0
for r in rels:
    if cur and (len(cur)>=600 or cb+sizes[r]>9_000_000): chunks.append(cur); cur=[]; cb=0
    cur.append(r); cb+=sizes[r]
if cur: chunks.append(cur)
meta=[]
for i,ch in enumerate(chunks):
    name='r22b_%02d.tgz'%i
    with tarfile.open(os.path.join(out,name),'w:gz',compresslevel=6) as t:
        for r in ch: t.add(D+r,arcname=r)
    meta.append({'name':name,'sha256':hashlib.sha256(open(os.path.join(out,name),'rb').read()).hexdigest(),'n':len(ch),'bytes':os.path.getsize(os.path.join(out,name))})
m={'base_commit':'37207f7678f8a7e38bea1899ed0e1922874ecbf6','changed':changed,'binary':binary,'delete':[],'chunks':meta,'worker_old':blob(w),'worker_new':blob(w),'worker':w.decode('utf-8'),
   'live_fp':hashlib.sha256(json.dumps(sorted(live.items())).encode()).hexdigest()}
json.dump(m,open(os.path.join(out,'manifest.json'),'w'))
print('trozos',len(meta),'total tgz',sum(x['bytes'] for x in meta),'manifest',os.path.getsize(os.path.join(out,'manifest.json')), 'live_fp', m['live_fp'][:16])
