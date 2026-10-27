import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page()
        await pg.route('**/*.png', lambda r: r.abort())   # los tiles no salen del contenedor
        await pg.goto('http://127.0.0.1:8899/index.html?city=Dhaka', wait_until='domcontentloaded')
        await pg.wait_for_selector('.pin', timeout=15000)
        m=await pg.evaluate("""(()=>{const n=performance.getEntriesByType('navigation')[0];
          return {dcl:Math.round(n.domContentLoadedEventEnd), firstPin:Math.round(performance.now()),
                  bytes:Math.round(n.transferSize/1024)};})()""")
        print('DOMContentLoaded', m['dcl'],'ms | primer icono', m['firstPin'],'ms | html', m['bytes'],'KB')
        await pg.wait_for_timeout(2000)
        st=await pg.evaluate("({places:PLACES.length, chunks:[...loadedChunks].length})")
        print('tras 2s:', st)
        await b.close()
asyncio.run(main())
