"""Paginas de autor /autor/<slug>/ con sus articulos y enlace desde la caja de autor de cada post."""
import os,re,json,html,unicodedata,collections
P=json.load(open('/home/claude/tools/data.json'))['posts']
SITE='https://www.carlosdeory.com'
def slug(s):
    s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+','-',s).strip('-')
by=collections.defaultdict(list); bio={}
for u in P:
    h=open('.'+u+'index.html').read()
    m=re.search(r'<div class="author-box">(.*?)</div>\s*</div>',h,re.S)
    if not m: continue
    n=re.search(r'<h4>(.*?)</h4>',m.group(1)); p=re.search(r'<p>\s*(.*?)\s*</p>',m.group(1),re.S)
    if not n: continue
    name=html.unescape(re.sub('<[^>]+>','',n.group(1))).strip()
    by[name].append(u)
    if p: bio.setdefault(name,html.unescape(re.sub('<[^>]+>','',p.group(1))).strip())
TPL=open('europa/index.html').read()
hs=TPL.find('<main id="main">'); he=TPL.find('</main>')+7
cards_src={}
def card(u):
    c=re.sub(r'\s+',' ',P[u].get('card') or '')
    return c.replace(' fetchpriority="high"','').replace('loading="eager"','loading="lazy"')
made={}
for name,urls in by.items():
    if name=='Carlos de Ory': continue
    s=slug(name); path=f'/autor/{s}/'
    urls=sorted(urls,key=lambda u:P[u]['date'],reverse=True)
    n=len(urls)
    desc=f'Artículos de {name} en carlosdeory.com: {n} guía{"s" if n!=1 else ""} de viaje.'
    head=TPL[:TPL.find('</head>')]
    head=re.sub(r"<meta name='robots'[^>]*>",f"<meta name='robots' content='{'index, follow' if n>=3 else 'noindex, follow'}' />",head)
    head=re.sub(r'<title>.*?</title>',f'<title>{html.escape(name)}, autor - Carlos de Ory</title>',head,flags=re.S)
    for k in ('name="description"','property="og:description"'):
        head=re.sub(r'<meta '+re.escape(k)+r' content="[^"]*" />',f'<meta {k} content="{html.escape(desc)}" />',head)
    head=re.sub(r'<link rel="canonical" href="[^"]*" />',f'<link rel="canonical" href="{SITE}{path}" />',head)
    head=re.sub(r'<link rel="(?:next|prev)" href="[^"]*" />\s*','',head)
    head=re.sub(r'<meta property="og:title" content="[^"]*" />',f'<meta property="og:title" content="{html.escape(name)}" />',head)
    head=re.sub(r'<meta property="og:url" content="[^"]*" />',f'<meta property="og:url" content="{SITE}{path}" />',head)
    head=re.sub(r'<script type="application/ld\+json">.*?</script>','',head,flags=re.S)
    ld={'@context':'https://schema.org','@type':'ProfilePage','url':SITE+path,'mainEntity':{'@type':'Person','name':name,'url':SITE+path,'description':bio.get(name,'')},
        'hasPart':[{'@type':'Article','url':SITE+u,'headline':P[u]['h1']} for u in urls]}
    head+='<script type="application/ld+json">'+json.dumps(ld,ensure_ascii=False)+'</script>\n'
    rest=TPL[TPL.find('</head>'):hs]
    rest=re.sub(r'<body class="[^"]*">','<body class="archive author wp-embed-responsive wp-theme-ory-theme">',rest)
    b=f'<p>{html.escape(bio[name])}</p>' if bio.get(name) else ''
    main=(f'<main id="main"> <div class="wrap"> <div class="page-hero"> <span class="eyebrow"><a href="/">Inicio</a> &rsaquo; Autores</span> '
          f'<h1>{html.escape(name)}</h1> {b}<p>{n} artículo{"s" if n!=1 else ""} en esta web.</p> </div> <div class="sec tight"> <div class="grid g3"> '
          +' '.join(card(u) for u in urls)+' </div> </div> </div> </main>')
    os.makedirs('.'+path,exist_ok=True); open('.'+path+'index.html','w').write(head+rest+main+TPL[he:])
    made[name]=(path,n)
# enlazar el nombre en la caja de autor
k=0
for name,urls in by.items():
    if name not in made: continue
    for u in urls:
        fp='.'+u+'index.html'; h=open(fp).read()
        h2=re.sub(r'(<div class="author-box">.*?)<h4>([^<]*)</h4>',lambda m: m.group(1)+f'<h4><a href="{made[name][0]}" style="color:inherit">{m.group(2)}</a></h4>' if '<a ' not in m.group(0)[-200:] else m.group(0),h,count=1,flags=re.S)
        if h2!=h: open(fp,'w').write(h2); k+=1
json.dump(made,open('/home/claude/tools/authors.json','w'),ensure_ascii=False)
print(len(made),'autores',sum(1 for v in made.values() if v[1]>=3),'indexables',k,'cajas enlazadas')
