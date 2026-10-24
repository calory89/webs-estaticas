import asyncio,re,sys,json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for f in sys.argv[1:]:
            pg=await b.new_page()
            await pg.goto(f'http://localhost:8811/{f}?lang=en',wait_until='networkidle')
            m=await pg.evaluate("Object.fromEntries([...document.querySelectorAll('[data-k]')].map(e=>[e.getAttribute('data-k'),e.innerHTML]))")
            src=f+'index.html'; h=open(src).read(); n=0
            def rep(mm):
                nonlocal n
                k=mm.group(2)
                if k in m and m[k].strip(): n+=1; return mm.group(1)+m[k]+mm.group(3)
                return mm.group(0)
            h=re.sub(r'(<(\w+)\b[^>]*\bdata-k="([^"]+)"[^>]*>)\s*(</\2>)',lambda mm: rep2(mm),h) if False else h
            out=[];last=0
            for mm in re.finditer(r'(<(\w+)\b[^>]*\bdata-k="([^"]+)"[^>]*>)\s*(</\2>)',h):
                k=mm.group(3); v=m.get(k,'')
                out.append(h[last:mm.start()]); out.append(mm.group(1)+(v if v.strip() else '')+mm.group(4)); last=mm.end()
                if v.strip(): n+=1
            out.append(h[last:]); open(src,'w').write(''.join(out)); print(f,n)
        await b.close()
asyncio.run(main())
