import os,re,json,html,collections
P={}
cards={}
catname={}; tagname={}
def clean(s): return html.unescape(re.sub(r'<[^>]+>','',s)).strip()
for d,_,fs in os.walk('.'):
    if '.git' in d or 'index.html' not in fs: continue
    h=open(os.path.join(d,'index.html'),errors='ignore').read()
    for a in re.finditer(r'<article class="card[^"]*".*?</article>',h,re.S):
        c=a.group(0); m=re.search(r'class="stretch" href="https://www\.carlosdeory\.com(/[^"]*)"',c)
        if m: cards.setdefault(m.group(1),c)
    for m in re.finditer(r'href="https://www\.carlosdeory\.com/tag/([^/"]+)/">\s*([^<]+?)\s*</a>',h): tagname.setdefault(m.group(1),html.unescape(m.group(2)))
    m=re.search(r'<h1>Categoría: <span>(.*?)</span></h1>',h)
    if m: catname[os.path.relpath(d,'.').split('/page/')[0]]=html.unescape(m.group(1))
    m=re.search(r'<h1>Etiqueta: <span>(.*?)</span></h1>',h)
    if m: tagname.setdefault(os.path.relpath(d,'.').split('/page/')[0].replace('tag/',''),html.unescape(m.group(1)))
    b=re.search(r'<body[^>]*class="([^"]*)"',h)
    if not b or 'single-post' not in b.group(1): continue
    url='/'+os.path.relpath(d,'.')+'/'
    pid=re.search(r'postid-(\d+)',b.group(1)).group(1)
    art=re.search(r'<article class="([^"]*post-%s[^"]*)"'%pid,h)
    cl=art.group(1) if art else ''
    rec={'url':url,'cats':re.findall(r'category-([\w-]+)',cl),'tags':re.findall(r'tag-([\w-]+)',cl)}
    rec['h1']=clean(re.search(r'<h1[^>]*>(.*?)</h1>',h,re.S).group(1))
    m=re.search(r'<time datetime="([^"]+)">([^<]+)</time>',h); rec['date'],rec['datefmt']=(m.group(1),m.group(2)) if m else ('','')
    m=re.search(r'(\d+) min (?:de lectura|read)',h); rec['mins']=int(m.group(1)) if m else 5
    m=re.search(r'<meta name="description" content="([^"]*)"',h); rec['desc']=html.unescape(m.group(1)) if m else ''
    m=re.search(r'property="og:image" content="([^"]+)"',h); rec['og']=m.group(1) if m else ''
    e=h[h.find('<div class="entry'):]
    m=re.search(r'<img\b[^>]*\ssrc="(/wp-content/uploads/[^"]+)"',e); rec['img']=m.group(1) if m else ''
    rec['lang']=re.search(r'<html lang="([^"]+)"',h).group(1)
    m=re.search(r'<a class="chip" href="https://www\.carlosdeory\.com/([^"]+)/">\s*([^<]+?)\s*</a>',h)
    if m: catname.setdefault(m.group(1),html.unescape(m.group(2)))
    P[url]=rec
for u,r in P.items(): r['card']=cards.get(u,'')
json.dump({'posts':P,'catname':catname,'tagname':tagname},open('/home/claude/tools/data.json','w'),ensure_ascii=False)
print(len(P),'with card',sum(1 for r in P.values() if r['card']),'catnames',len(catname),'tagnames',len(tagname))
allcats=collections.Counter(c for r in P.values() for c in r['cats']); print('cats',len(allcats),'missing names',[c for c in allcats if c not in catname and 'category/'+c not in catname])
alltags=collections.Counter(t for r in P.values() for t in r['tags']); print('tags',len(alltags),'missing names',sum(1 for t in alltags if t not in tagname), 'tags>=3',sum(1 for t,c in alltags.items() if c>=3))
