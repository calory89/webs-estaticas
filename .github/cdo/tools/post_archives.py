import os,re,json,html
P=json.load(open('/home/claude/tools/data.json'))['posts']; A=json.load(open('/home/claude/tools/archives.json'))
n=0
for c,v in A['cat'].items():
    urls=sorted([u for u,r in P.items() if c in r['cats'] and r.get('img')],key=lambda u:P[u]['date'],reverse=True)
    if not urls: continue
    img='https://www.carlosdeory.com'+P[urls[0]]['img']
    for pth in v['pages']:
        fp='.'+pth+'index.html'; h=open(fp).read()
        h2=re.sub(r'<meta property="og:image" content="[^"]*" />','<meta property="og:image" content="'+html.escape(img)+'" />',h,count=1)
        h2=re.sub(r'<meta property="og:image:(?:width|height|type)" content="[^"]*" />\s*','',h2)
        if h2!=h: open(fp,'w').write(h2); n+=1
print('og categorias',n)
