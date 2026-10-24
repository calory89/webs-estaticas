import asyncio,json,re,html,os,sys
from playwright.async_api import async_playwright
A=json.load(open('/home/claude/tools/archives.json')); P=json.load(open('/home/claude/tools/data.json'))['posts']
REG={'europa','asia','america','africa','oceania'}; NT={'emprender','digital-nomad','puntos-y-millas','episodios','episodes','consejos','1'}
L=sorted([(v['n'],c) for c,v in A['cat'].items() if c not in REG and c not in NT and v['n']>=7],reverse=True)[:30]
ROOT='/home/claude/cdo'
def clean_entry(h):
    i=h.find('<div class="entry'); j=h.find('<div class="share">',i); e=h[i:j]
    e=re.sub(r'<(script|style|iframe|noscript)[^>]*>.*?</\1>','',e,flags=re.S)
    e=re.sub(r'<nav id="toc_container".*?</nav>','',e,flags=re.S)
    e=re.sub(r'<div style="border: 3px solid #fce9a5[^"]*">(?:(?!<div).)*?</div>','',e,flags=re.S)
    e=re.sub(r'<aside class="cdo-[a-z]+".*?</aside>','',e,flags=re.S)
    e=re.sub(r'<div class="read" style="display:flex.*$','',e,flags=re.S)
    imgs=0
    def im(m):
        nonlocal imgs
        imgs+=1
        if imgs>2: return ''
        t=m.group(0)
        t=re.sub(r'\s(srcset|sizes|loading|style|class|width|height)="[^"]*"','',t)
        t=re.sub(r'src="(/[^"]+)"',lambda x:'src="file://'+ROOT+html.unescape(x.group(1))+'"',t)
        return t
    e=re.sub(r'<img\b[^>]*>',im,e)
    e=re.sub(r'<a\b[^>]*>(.*?)</a>',r'\1',e,flags=re.S)
    return e
CSS='''@page{size:A4;margin:16mm 15mm}body{font:11pt/1.55 Georgia,serif;color:#15151A}h1{font:800 34pt/1 -apple-system,Helvetica,sans-serif;letter-spacing:-.02em;margin:0}
.cover{height:250mm;display:flex;flex-direction:column;justify-content:space-between;page-break-after:always}.k{font:700 9pt monospace;letter-spacing:.2em;text-transform:uppercase;color:#C2452D}
.cover img{width:100%;height:140mm;object-fit:cover;border-radius:4mm}.post{page-break-before:always}.post h2.t{font:800 20pt/1.1 -apple-system,Helvetica,sans-serif;margin:0 0 2mm}
.meta{font:9pt -apple-system,sans-serif;color:#777;margin-bottom:5mm}img{max-width:100%;max-height:95mm;object-fit:cover;border-radius:3mm;display:block;margin:4mm 0}
h2,h3,h4{font-family:-apple-system,Helvetica,sans-serif;break-after:avoid}p{margin:0 0 3mm}figure{margin:0}figcaption,.wp-caption-text{font:8.5pt sans-serif;color:#777}
.toc li{margin:1.5mm 0}.end{page-break-before:always;font:12pt/1.6 -apple-system,sans-serif}'''
async def main():
    os.makedirs('/home/claude/guides',exist_ok=True)
    async with async_playwright() as p:
        b=await p.chromium.launch(); out={}
        for n,c in L:
            v=A['cat'][c]; name=v['name']
            urls=sorted([u for u,r in P.items() if c in r['cats']],key=lambda u:P[u]['date'],reverse=True)
            cover=next((P[u]['img'] for u in urls if P[u].get('img')),'')
            toc=''.join(f'<li>{html.escape(P[u]["h1"])}</li>' for u in urls)
            posts=''
            for u in urls:
                h=open(ROOT+u+'index.html').read()
                au=re.search(r'<div class="author-box">.*?<h4>(?:<a[^>]*>)?([^<]*)',h,re.S)
                posts+=f'<section class="post"><h2 class="t">{html.escape(P[u]["h1"])}</h2><div class="meta">{html.escape(P[u]["datefmt"])}{" · "+html.escape(html.unescape(au.group(1))) if au else ""} · carlosdeory.com{u}</div>{clean_entry(h)}</section>'
            doc=(f'<!doctype html><html lang="es"><meta charset="utf-8"><style>{CSS}</style><div class="cover"><div><div class="k">Guía gratis · carlosdeory.com</div><h1>Guía de viaje de {html.escape(name)}</h1>'
                 f'<p style="font:13pt -apple-system,sans-serif;color:#555">{len(urls)} artículos para preparar tu viaje, reunidos en un solo PDF.</p></div>'
                 + (f'<img src="file://{ROOT}{html.escape(cover)}">' if cover else '') +
                 f'<div style="font:10pt -apple-system,sans-serif;color:#777">Algunos datos (precios, horarios) pueden haber cambiado desde que se escribieron. Fechas de cada artículo en su cabecera.</div></div>'
                 f'<h2 style="font-family:-apple-system,sans-serif">Contenido</h2><ol class="toc">{toc}</ol>{posts}'
                 f'<div class="end"><p><b>Más guías en carlosdeory.com/destinos</b></p><p>Hoteles, seguro y herramientas que uso: carlosdeory.com/herramientas</p><p>Carlos de Ory · Equinox Investment Group LLC</p></div></html>')
            fn=f'/home/claude/guides/{c}.html'; open(fn,'w').write(doc)
            pg=await b.new_page(); await pg.goto('file://'+fn,wait_until='load'); await pg.wait_for_timeout(300)
            pdf=f'/home/claude/guides/guia-{c}.pdf'
            await pg.pdf(path=pdf,format='A4',print_background=True,margin={'top':'16mm','bottom':'16mm','left':'15mm','right':'15mm'})
            await pg.close(); out[c]=os.path.getsize(pdf); print(c,len(urls),out[c]//1024,'KB',flush=True)
        await b.close()
asyncio.run(main())
