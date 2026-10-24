"""Version en espanol con URL propia: /speaking/ -> /charlas/, /growth/ -> /agencia/. El idioma lo decide la URL."""
import re,json,html,os
SITE='https://www.carlosdeory.com'
PAIRS=[('speaking','charlas'),('growth','agencia')]
def load_T(h):
    a=h.find('var T=')+6; b=h.find(';var D=document,lang=',a)
    return a,b,json.loads(h[a:b])
for en,es in PAIRS:
    src=open(f'{en}/index.html').read()
    a,b,T=load_T(src)
    # 1) EN: idioma fijo por URL, botones navegan a la otra URL, hreflang a /es/
    def fix_js(h,lang,other):
        h=h.replace('var D=document,lang="en";\ntry{var s=localStorage.getItem("cdo-lang");if(s==="es"||s==="en")lang=s;}catch(e){}\ntry{var q=new URLSearchParams(location.search).get("lang");if(q==="es"||q==="en")lang=q;}catch(e){}',
                    f'var D=document,lang="{lang}";')
        h=h.replace('D.querySelectorAll(".lang button").forEach(function(b){b.addEventListener("click",function(){lang=b.getAttribute("data-lang");try{localStorage.setItem("cdo-lang",lang);}catch(e){}apply();});});',
                    'D.querySelectorAll(".lang button").forEach(function(b){b.addEventListener("click",function(){var l=b.getAttribute("data-lang");if(l!==lang){try{localStorage.setItem("cdo-lang",l);}catch(e){}location.href="'+other+'"+location.hash;}});});')
        h=h.replace('var D=document,lang="en";',f'var D=document,lang="{lang}";',1)
        h=re.sub(r'location\.href="/[a-z]+/"\+location\.hash',f'location.href="{other}"+location.hash',h)
        return h
    def fix_head(h,lang,self_,other):
        h=re.sub(r'<link rel="alternate" hreflang="[^"]+" href="[^"]*">\s*','',h)
        tags=f'<link rel="alternate" hreflang="en" href="{SITE}/{en}/">\n<link rel="alternate" hreflang="es" href="{SITE}/{es}/">\n<link rel="alternate" hreflang="x-default" href="{SITE}/{en}/">\n'
        h=re.sub(r'(<link rel="canonical" href=")[^"]*(">)',lambda m:m.group(1)+f'{SITE}/{self_}/'+m.group(2)+'\n'+tags,h,count=1)
        return h
    enh=fix_head(fix_js(src,'en',f'/{es}/'),'en',en,es)
    assert 'location.href="/' in enh, en
    # 2) ES: textos estaticos en espanol
    esh=fix_head(fix_js(src,'es',f'/{en}/'),'es',es,en)
    E=T['es']
    def rep(m):
        k=m.group(3); v=E.get(k)
        if v is None: return m.group(0)
        if 'data-ph' in m.group(1): return m.group(0)
        body=v if 'data-html' in m.group(1) else html.escape(v,quote=False)
        return m.group(1)+body+m.group(4)
    esh=re.sub(r'(<(\w+)\b[^>]*\bdata-k="([^"]+)"[^>]*>)(?:(?!<\2\b).)*?(</\2>)',rep,esh,flags=re.S)
    esh=re.sub(r'(<[^>]*\bdata-k="([^"]+)"[^>]*\bdata-ph[^>]*\bplaceholder=")[^"]*(")',lambda m:m.group(1)+html.escape(E.get(m.group(2),''))+m.group(3),esh)
    esh=esh.replace('href="/press/"','href="/prensa/"')
    esh=re.sub(r'<html lang="[^"]*"','<html lang="es"',esh,count=1)
    esh=re.sub(r'<title>[^<]*</title>',f'<title>{html.escape(E["_title"])} · Carlos de Ory</title>',esh,count=1)
    for k in ('name="description"','property="og:description"'):
        esh=re.sub(r'<meta '+re.escape(k)+r' content="[^"]*"',f'<meta {k} content="{html.escape(E["_desc"])}"',esh,count=1)
    esh=re.sub(r'<meta property="og:title" content="[^"]*"',f'<meta property="og:title" content="{html.escape(E["_title"])}"',esh,count=1)
    esh=re.sub(r'<meta property="og:url" content="[^"]*"',f'<meta property="og:url" content="{SITE}/{es}/"',esh,count=1)
    esh=re.sub(r'<meta property="og:locale" content="[^"]*"','<meta property="og:locale" content="es_ES"',esh,count=1)
    # FAQ schema en espanol
    fq=[(E[f'fq{i}'],E[f'fa{i}']) for i in range(10) if f'fq{i}' in E]
    if fq:
        ld={'@context':'https://schema.org','@type':'FAQPage','mainEntity':[{'@type':'Question','name':q,'acceptedAnswer':{'@type':'Answer','text':a_}} for q,a_ in fq]}
        esh=re.sub(r'<script type="application/ld\+json">\{"@context": "https://schema.org", "@type": "FAQPage".*?</script>','<script type="application/ld+json">'+json.dumps(ld,ensure_ascii=False)+'</script>',esh,count=1,flags=re.S)
    esh=esh.replace(f'"@id": "{SITE}/{en}/',f'"@id": "{SITE}/{es}/').replace(f'"url": "{SITE}/{en}/"',f'"url": "{SITE}/{es}/"')
    os.makedirs(es,exist_ok=True)
    open(f'{en}/index.html','w').write(enh); open(f'{es}/index.html','w').write(esh)
    print(en,es,'ok')
