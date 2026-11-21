import json, os, hashlib, tarfile, collections
S='/home/claude/sn/stage_r24'; D=S+'/_s/supportnear.com/'
live=json.load(open('live_r23.json'))
def blob(b): return hashlib.sha1(b'blob %d\0'%len(b)+b).hexdigest()
changed={}; sizes={}
for root,_,files in os.walk(D):
    for f in files:
        p=os.path.join(root,f); rel=os.path.relpath(p,D); b=open(p,'rb').read(); s=blob(b)
        if live.get(rel)!=s: changed[rel]=s; sizes[rel]=len(b)
kinds=collections.Counter(r.split('/')[0] if '/' in r else r for r in changed)
print('cambiados',len(changed),'MB',round(sum(sizes.values())/1e6,1),'nuevos',len([r for r in changed if r not in live]),dict(kinds))
out='pub'; os.makedirs(out,exist_ok=True)
for f in os.listdir(out): os.remove(os.path.join(out,f))
rels=sorted(changed); chunks=[]; cur=[]; cb=0
for r in rels:
    if cur and cb+sizes[r]>60_000_000: chunks.append(cur); cur=[]; cb=0
    cur.append(r); cb+=sizes[r]
if cur: chunks.append(cur)
meta=[]
for i,ch in enumerate(chunks):
    name='r24_%02d.tgz'%i
    with tarfile.open(os.path.join(out,name),'w:gz',compresslevel=9) as t:
        for r in ch: t.add(D+r,arcname=r)
    meta.append({'name':name,'sha256':hashlib.sha256(open(os.path.join(out,name),'rb').read()).hexdigest(),'n':len(ch),'bytes':os.path.getsize(os.path.join(out,name))})
m={'changed':changed,'chunks':meta}
json.dump(m,open(os.path.join(out,'manifest.json'),'w'))
print('trozos',meta,'manifest',os.path.getsize(os.path.join(out,'manifest.json')))
print('manifest_sha256',hashlib.sha256(open(os.path.join(out,'manifest.json'),'rb').read()).hexdigest())
