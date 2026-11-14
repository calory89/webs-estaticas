import json, os, re, time, random, urllib.request, urllib.error, concurrent.futures as cf, hashlib, sys
from collections import Counter
D='/home/claude/sn/stage_r23/_s/supportnear.com/'
m1=json.load(open('pub/manifest.json')); m2={'changed':{}}
exp=dict(m1['changed']); exp.update(m2['changed'])
def blob(b): return hashlib.sha1(b'blob %d\0'%len(b)+b).hexdigest()
VP='verify_final.json'; V=json.load(open(VP)) if os.path.exists(VP) else {}
BEACON=re.compile(rb'<!-- Cloudflare Pages Analytics -->.*?<!-- Cloudflare Pages Analytics -->\n?|<script[^>]*src=[\'"]https://static\.cloudflareinsights\.com/beacon\.min\.js[^>]*></script>\n?', re.S)
def url(rel):
    u=rel[:-5] if rel.endswith('.html') else rel
    if u=='index': u=''
    elif u.endswith('/index'): u=u[:-5]
    return 'https://supportnear.com/'+u+'?cb=%d'%random.randint(1,10**9)
def chk(rel):
    b=None; err=''
    for k in range(4):
        try:
            req=urllib.request.Request(url(rel),headers={'User-Agent':'SupportNear-verify/1.0 (+https://supportnear.com/about)'})
            with urllib.request.urlopen(req,timeout=30) as r: b=r.read(); break
        except urllib.error.HTTPError as e:
            err='http %d'%e.code; time.sleep(4 if e.code==429 else 1)
        except Exception as e:
            err=type(e).__name__; time.sleep(1.5)
    if b is None: return rel,'error '+err
    loc=open(D+rel,'rb').read()
    if blob(loc)!=exp[rel]: return rel,'LOCAL_CAMBIADO'
    if b==loc: return rel,'identico'
    if rel.endswith('.html') and BEACON.sub(b'',b)==loc: return rel,'identico+beacon'
    return rel,'DISTINTO %d/%d'%(len(b),len(loc))
todo=[r for r in sorted(exp) if not V.get(r,'').startswith('identico')]
t0=time.time(); done=0
with cf.ThreadPoolExecutor(8) as ex:
    for i in range(0,len(todo),200):
        for rel,res in ex.map(chk, todo[i:i+200]): V[rel]=res; done+=1
        json.dump(V,open(VP,'w'))
        print(time.strftime('%X'),done,len(todo),dict(Counter(v.split(' ')[0] for v in V.values())),flush=True)
print('FIN',len(V),'/',len(exp),dict(Counter(v.split(' ')[0] for v in V.values())),[(k,v) for k,v in V.items() if not v.startswith('identico')][:8])
