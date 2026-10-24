import os,re,html,json,urllib.request,urllib.error,socket,concurrent.futures as cf
from urllib.parse import urlparse
SKIP=r'anrdoezrs|booking\.com|civitatis|amzn|amazon\.|skyscanner|airbnb|twitter|facebook|linkedin|whatsapp|wa\.me|x\.com|instagram|youtube|youtu\.be|google|carlosdeory|bit\.ly|getyourguide|holidayautos|tp\.media|awin|tripadvisor|pinterest'
links={}
for d,_,fs in os.walk('.'):
    if '.git' in d or 'index.html' not in fs or d.startswith('./tag'): continue
    h=open(os.path.join(d,'index.html'),errors='ignore').read()
    i=h.find('<div class="entry'); j=h.find('<div class="share">',i)
    if i<0: continue
    for a in re.findall(r'<a\b[^>]*href="(https?://[^"]+)"',h[i:j]):
        a=html.unescape(a)
        if re.search(SKIP,a): continue
        links.setdefault(a,[]).append(d)
print('unique',len(links))
UA={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36','Accept':'text/html,*/*'}
def chk(u):
    host=urlparse(u).hostname or ''
    try: socket.getaddrinfo(host,443)
    except Exception: return u,'dns'
    for m in ('HEAD','GET'):
        try:
            r=urllib.request.urlopen(urllib.request.Request(u,headers=UA,method=m),timeout=20); return u,r.status
        except urllib.error.HTTPError as e:
            if m=='HEAD' and e.code in (403,405,400,501,429): continue
            return u,e.code
        except Exception as e:
            if m=='GET': return u,'err:'+type(e).__name__
    return u,'?'
res={}
with cf.ThreadPoolExecutor(24) as ex:
    for u,s in ex.map(chk,list(links)): res[u]=s
json.dump({'res':res,'pages':links},open('/home/claude/tools/ext.json','w'))
import collections
print(collections.Counter(str(v) if not isinstance(v,int) else str(v//100)+'xx' if v not in(404,410) else str(v) for v in res.values()).most_common())
