import json, os, hashlib, tarfile, subprocess
S='/home/claude/sn/stage_blog/_s/supportnear.com/'
ls=subprocess.run(['git','-C','/home/claude/sn/pub','ls-tree','-r','HEAD','_s/supportnear.com/'],capture_output=True,text=True).stdout
live={}
for l in ls.splitlines():
    meta,path=l.split('\t',1); live[path[len('_s/supportnear.com/'):]]=meta.split()[2]
print('live files',len(live))
def blob(b): return hashlib.sha1(b'blob %d\0'%len(b)+b).hexdigest()
changed={}
for root,_,files in os.walk(S):
    for f in files:
        p=os.path.join(root,f); rel=os.path.relpath(p,S); s=blob(open(p,'rb').read())
        if live.get(rel)!=s: changed[rel]=s
print('changed',len(changed),'new',sum(1 for r in changed if r not in live),'total after',len(set(live)|set(changed)))
out='pub'; os.makedirs(out,exist_ok=True)
for f in os.listdir(out): os.remove(os.path.join(out,f))
name='r27_00.tgz'
with tarfile.open(os.path.join(out,name),'w:gz',compresslevel=9) as t:
    for r in sorted(changed): t.add(S+r,arcname=r)
meta=[{'name':name,'sha256':hashlib.sha256(open(os.path.join(out,name),'rb').read()).hexdigest(),'n':len(changed),'bytes':os.path.getsize(os.path.join(out,name))}]
json.dump({'changed':changed,'chunks':meta},open(os.path.join(out,'manifest.json'),'w'))
print(meta); print('manifest_sha256',hashlib.sha256(open(os.path.join(out,'manifest.json'),'rb').read()).hexdigest())
