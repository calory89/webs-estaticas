import os,re,json,html,collections
P=json.load(open('/home/claude/tools/data.json'))['posts']; st=collections.Counter()
for u,r in P.items():
    fp='.'+u+'index.html'; h=open(fp).read()
    m=re.search(r'<div id="toc_container"[^>]*>.*?</div>',h,re.S)
    if not m: continue
    after=h[m.end():h.find('<div class="share">',m.end())]
    heads=[]
    for hm in re.finditer(r'<h([23])[^>]*>\s*<span id="([^"]+)">(.*?)</span>\s*</h\1>',after,re.S):
        t=html.unescape(re.sub(r'<[^>]+>','',hm.group(3))).strip().rstrip(':')
        if t: heads.append((hm.group(1),hm.group(2),t))
    if len(heads)<3:
        h=h[:m.start()]+h[m.end():]; st['removed']+=1
    else:
        es=r['lang'].startswith('es'); out=[]; open_sub=False
        items=''
        for lvl,i,t in heads:
            a=f'<a href="#{i}">{html.escape(t,quote=False)}</a>'
            if lvl=='2':
                if open_sub: items+='</ul></li>'; open_sub=False
                elif items: items+='</li>'
                items+=f'<li>{a}'
            else:
                if not items: items+=f'<li>{a}</li>'; continue
                if not open_sub: items+='<ul>'; open_sub=True
                items+=f'<li>{a}</li>'
        items+='</ul></li>' if open_sub else ('</li>' if items and not items.endswith('</li>') else '')
        new=(f'<nav id="toc_container" class="no_bullets toc_numbered toc_title_center" aria-label="{"Índice" if es else "Contents"}" data-nosnippet>'
             f'<p class="toc_title">{"Índice" if es else "Contents"}</p><ul class="toc_list">{items}</ul></nav>')
        h=h[:m.start()]+new+h[m.end():]; st['rebuilt']+=1
    open(fp,'w').write(h)
print(dict(st))
