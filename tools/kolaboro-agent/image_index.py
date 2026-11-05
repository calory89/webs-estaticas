"""Kolaboro render/photo reuse index: perceptual hashes of every image on the project websites we track. Usage: image_index.py OUT.json"""
import json, re, os, sys, io, urllib.request, urllib.parse, concurrent.futures as cf, hashlib
from PIL import Image
import imagehash
A=os.path.dirname(os.path.abspath(__file__))+'/'
projs=json.load(open(A+'projects.json'))['projects']+json.load(open(A+'projects-world.json'))['projects']
UA={'User-Agent':'Mozilla/5.0 (compatible; KolaboroResearchAgent/1.0; +https://kolaboro.com/research)'}
def get(u,n=6_000_000):
    r=urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=15); return r.read(n), r.geturl()
def dom(u):
    h=urllib.parse.urlparse(u).hostname or ''; h=h[4:] if h.startswith('www.') else h; return '.'.join(h.split('.')[-2:])
def imgs_of(p):
    try: html,final=get(p['url'],3_000_000); html=html.decode('utf8','ignore')
    except Exception as e: return p,[],str(e)[:60]
    c=re.findall(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)',html)
    c+=re.findall(r'<img[^>]+(?:data-src|src)=["\']([^"\']+\.(?:jpe?g|png|webp)(?:\?[^"\']*)?)["\']',html,re.I)
    c+=re.findall(r'url\(["\']?([^"\')]+\.(?:jpe?g|webp))',html,re.I)
    out=[];seen=set()
    for x in c:
        u=urllib.parse.urljoin(final,x.strip())
        if u in seen or any(k in u.lower() for k in ('logo','icon','favicon','avatar','flag','sprite')): continue
        seen.add(u); out.append(u)
    return p,out[:14],None
def hashimg(u):
    try:
        b,_=get(u); im=Image.open(io.BytesIO(b)).convert('RGB')
        if min(im.size)<250: return None
        return {'u':u,'w':im.size[0],'h':im.size[1],'ph':str(imagehash.phash(im)),'dh':str(imagehash.dhash(im)),'sha':hashlib.sha256(b).hexdigest()[:16]}
    except Exception: return None
res=[]
with cf.ThreadPoolExecutor(12) as ex:
    pages=list(ex.map(imgs_of,projs))
jobs=[]
for p,ims,err in pages:
    for u in ims: jobs.append((p,u))
print('projects',len(projs),'with images',sum(1 for x in pages if x[1]),'images',len(jobs),flush=True)
with cf.ThreadPoolExecutor(16) as ex:
    for (p,u),h in zip(jobs,ex.map(lambda j:hashimg(j[1]),jobs)):
        if h: h.update({'slug':p.get('slug'),'name':p.get('name'),'dev':p.get('developer'),'market':p.get('market','Bali'),'site':dom(p['url'])}); res.append(h)
import datetime
# Anonymity rule: developer domains and project names are never published; fields 2 and 3 stay empty for format compatibility.
# /tools/image-check/ uses the anonymised /data/image-hashes.json (project ids) to name matches.
items=[[h['ph'],h['dh'],'','',h['market']] for h in res]
out={'updated':datetime.date.today().isoformat(),'images':len(items),'sites':len(set(h['site'] for h in res)),'items':items}
if len(items)<200: raise SystemExit('too few images (%d): keeping the old index'%len(items))
json.dump(out,open(sys.argv[1],'w'),separators=(',',':'))
print('hashed',len(res),'sites',out['sites'])
