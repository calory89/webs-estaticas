import os,re,html,json,collections
P=json.load(open('/home/claude/tools/data.json'))['posts']
st=collections.Counter()
for u in P:
    fp='.'+u+'index.html'; h=open(fp).read()
    i=h.find('<div class="entry'); j=h.find('<div class="share">',i)
    e=h[i:j]
    body=re.sub(r'<h[1-6][^>]*>.*?</h[1-6]>',' ',e,flags=re.S)
    text=html.unescape(re.sub(r'<[^>]+>',' ',re.sub(r'<(script|style)[^>]*>.*?</\1>','',body,flags=re.S)))
    proper=set(); acr=set()
    for m in re.finditer(r'(?<=[a-záéíóúñü,;]\s)([A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]{2,})',text): proper.add(m.group(1).lower())
    for m in re.finditer(r'\b([A-ZÁÉÍÓÚÑ]{2,5})\b',text): acr.add(m.group(1))
    def sentence(t):
        out=[]
        for w in t.split(' '):
            core=re.sub(r'[^\wÁÉÍÓÚÑÜáéíóúñü]','',w)
            if core in acr and core.isupper() and len(core)<=5 and core.lower() not in proper: out.append(w); continue
            lw=w.lower()
            if core and core.lower() in proper: lw=lw.replace(core.lower(),core.lower().capitalize(),1)
            out.append(lw)
        s=' '.join(out)
        m=re.search(r'[A-Za-zÁÉÍÓÚÑÜáéíóúñü]',s)
        if m and s[m.start()].islower(): s=s[:m.start()]+s[m.start()].upper()+s[m.start()+1:]
        return s
    def rep(m):
        inner=m.group(2)
        txt=html.unescape(re.sub(r'<[^>]+>','',inner)).strip()
        letters=[c for c in txt if c.isalpha()]
        if len(letters)<8 or sum(c.isupper() for c in letters)<0.75*len(letters): return m.group(0)
        st['heads']+=1
        new=html.escape(sentence(txt),quote=False)
        sid=re.search(r'<span id="[^"]+">',inner)
        return m.group(1)+((sid.group(0)+new+'</span>') if sid else new)+m.group(3)
    e2=re.sub(r'(<h[2-5][^>]*>)(.*?)(</h[2-5]>)',rep,e,flags=re.S)
    if e2!=e: open(fp,'w').write(h[:i]+e2+h[j:]); st['files']+=1
print(dict(st))
