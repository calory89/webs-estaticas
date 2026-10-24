import os,re,html,collections,sys
from urllib.parse import unquote,urlparse
root='.'
files=set()
for d,_,fs in os.walk(root):
    if '/.git' in d or d.startswith('./.git'): continue
    for f in fs: files.add('/'+os.path.relpath(os.path.join(d,f),root))
redir={}
for l in open('_redirects'):
    l=l.split('#')[0].split()
    if len(l)>=2: redir[l[0]]=l[1]
def exists(u):
    u=unquote(html.unescape(u)).split('#')[0].split('?')[0]
    if not u or u=='/': return True
    if u in redir or u.rstrip('/') in redir or any(k.endswith('*') and u.startswith(k[:-1]) for k in redir): return True
    if u in files: return True
    if u.endswith('/') and (u+'index.html') in files: return True
    if (u.rstrip('/')+'/index.html') in files or (u.rstrip('/')+'.html') in files: return True
    return False
broken=collections.Counter(); bpages=collections.defaultdict(set)
for f in files:
    if not f.endswith('.html'): continue
    h=open('.'+f,errors='ignore').read()
    for a in re.findall(r'(?:href|src)=["\']([^"\']+)["\']',h):
        if a.startswith('https://www.carlosdeory.com') or a.startswith('https://carlosdeory.com') or a.startswith('http://www.carlosdeory.com') or a.startswith('http://carlosdeory.com'):
            path=urlparse(html.unescape(a)).path or '/'
        elif a.startswith('/') and not a.startswith('//'): path=a
        else: continue
        if not exists(path): broken[path]+=1; bpages[path].add(f)
print('broken unique',len(broken),'total',sum(broken.values()),'pages',len(set().union(*bpages.values())) if bpages else 0)
pref=collections.Counter()
for b,c in broken.items():
    k=re.sub(r'/page/\d+/?','/page/N/',b); k=re.sub(r'/wp-content/.*','/wp-content/...',k); pref[k if k.count('/')<4 else '/'.join(k.split('/')[:3])+'/…']+=c
for k,c in pref.most_common(45): print(c,k)
import json; json.dump({k:sorted(v)[:5] for k,v in bpages.items()},open('/home/claude/tools/broken.json','w'),indent=0)
