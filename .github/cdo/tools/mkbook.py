import asyncio,re,html
from playwright.async_api import async_playwright
ROOT='/home/claude/cdo'
SETS={'es':(['el-dia-que-dejas-de-esperar','de-5-a-8-o-de-9-a-12'],'El libro, capítulo a capítulo','Episodios 1 y 2. Gratis, de carlosdeory.com.'),
      'en':(['the-day-you-stop-waiting','5-to-8-or-9-to-12'],'The book, one chapter at a time','Episodes 1 and 2. Free, from carlosdeory.com.')}
def entry(slug):
    h=open(f'{ROOT}/{slug}/index.html').read()
    t=re.search(r'<h1[^>]*>(.*?)</h1>',h,re.S).group(1)
    i=h.find('<div class="entry'); j=h.find('<div class="share">',i); e=h[i:j]
    e=re.sub(r'<(script|style|iframe)[^>]*>.*?</\1>','',e,flags=re.S)
    e=re.sub(r'<aside.*?</aside>|<nav id="toc_container".*?</nav>','',e,flags=re.S)
    e=re.sub(r'<div class="read" style="display:flex.*$','',e,flags=re.S)
    e=re.sub(r'<img\b[^>]*>','',e)
    e=re.sub(r'<p[^>]*>(?:(?!</p>).)*?(?:Read in English|Leer en español|Lee en español)(?:(?!</p>).)*?</p>','',e,flags=re.S)
    e=re.sub(r'<div[^>]*class="[^"]*ep-(?:hero|cover)[^"]*"[^>]*>.*?</div>','',e,flags=re.S)
    e=re.sub(r'<a\b[^>]*>(.*?)</a>',r'\1',e,flags=re.S)
    return f'<section class="chap"><h2>{t}</h2>{e}</section>'
CSS='''@page{size:A5;margin:16mm 14mm}body{font:11pt/1.6 Georgia,serif;color:#15151A}.cover{height:170mm;display:flex;flex-direction:column;justify-content:center;page-break-after:always}
.k{font:700 8pt monospace;letter-spacing:.2em;text-transform:uppercase;color:#C2452D}h1{font:800 26pt/1.05 -apple-system,Helvetica,sans-serif;margin:4mm 0}.chap{page-break-before:always}.chap h2{font:800 18pt/1.1 -apple-system,Helvetica,sans-serif}
blockquote{border-left:3px solid #C2452D;margin:4mm 0;padding-left:4mm;font-style:italic}.ep-next,.ory-old,.ep-switch{display:none}'''
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for lang,(slugs,t,sub) in SETS.items():
            doc=f'<!doctype html><html lang="{lang}"><meta charset="utf-8"><style>{CSS}</style><div class="cover"><div class="k">Carlos de Ory</div><h1>{t}</h1><p>{sub}</p></div>'+''.join(entry(s) for s in slugs)+'</html>'
            fn=f'/home/claude/book/{lang}.html'; open(fn,'w').write(doc)
            pg=await b.new_page(); await pg.goto('file://'+fn); await pg.pdf(path=f'/home/claude/book/libro-episodios-{lang}.pdf',format='A5',print_background=True)
        await b.close()
asyncio.run(main())
