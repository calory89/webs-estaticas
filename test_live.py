import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page()
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        chunks=[]
        pg.on('response', lambda r: chunks.append((r.url.split('/')[-1], r.status)) if '/d/' in r.url else None)
        await pg.goto('https://supportnear.com/?city=Madrid', wait_until='domcontentloaded')
        await pg.wait_for_selector('.pin', timeout=20000)
        t=await pg.evaluate("Math.round(performance.now())")
        await pg.wait_for_timeout(3000)
        st=await pg.evaluate("({places:PLACES.length, chunks:[...loadedChunks], stats:STATS, pins:document.querySelectorAll('.pin,.clus').length})")
        print('primer icono:',t,'ms')
        print('STATS:',st['stats'])
        print('sitios en memoria:',st['places'],'| trozos:',st['chunks'],'| iconos:',st['pins'])
        print('respuestas d/:',chunks)
        # clic en un icono
        pins=await pg.query_selector_all('.pin')
        if pins:
            await pins[len(pins)//2].click(); await pg.wait_for_timeout(1200)
            r=await pg.evaluate("({z:map.getZoom(), abierto:!!document.querySelector('#detail.on'), titulo:(document.querySelector('#dTitle')||{}).textContent})")
            print('clic:', r)
        print('errores JS:', errs[:3])
        await b.close()
asyncio.run(main())
