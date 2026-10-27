import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':900,'height':600})
        await pg.route('**/*.png', lambda r: r.abort())
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://127.0.0.1:8899/index.html?embed=1&city=Sevilla', wait_until='domcontentloaded')
        await pg.wait_for_selector('.pin,.clus', timeout=15000)
        await pg.wait_for_timeout(1500)
        st=await pg.evaluate("""({
           embed: document.body.classList.contains('is-embed'),
           back: (document.querySelector('.embed-back')||{}).textContent,
           mapaVisible: !!document.querySelector('#map') && getComputedStyle(document.querySelector('#map')).display!=='none',
           iconos: document.querySelectorAll('.pin,.clus').length,
           ciudad: S.placeName })""")
        print('embed:', st)
        print('errores:', errs[:3])
        await pg.screenshot(path='embed.png')
        await b.close()
asyncio.run(main())
