# La prueba que importa: guardar una zona y comprobar que el mapa sigue
# funcionando con la red cortada del todo.
import asyncio, subprocess
from playwright.async_api import async_playwright
def fetch(u): return subprocess.run(['curl','-s','-m','20','-A','Mozilla/5.0',u],capture_output=True).stdout
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        ctx=await b.new_context(viewport={'width':1100,'height':850},service_workers='allow')
        pg=await ctx.new_page()
        async def tiles(route, request):
            body=fetch(request.url)
            if body: await route.fulfill(status=200, body=body, content_type='image/jpeg',
                                         headers={'content-length':str(len(body))})
            else: await route.abort()
        await ctx.route('**arcgisonline.com**', tiles)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://127.0.0.1:8951/index.html?city=Madrid', wait_until='domcontentloaded')
        await pg.wait_for_selector('.card', timeout=20000)
        await pg.wait_for_timeout(2500); await pg.evaluate("typeof closeWelcome==='function'&&closeWelcome()")
        await pg.evaluate("navigator.serviceWorker.ready")
        for _ in range(10):
            if await pg.evaluate("!!navigator.serviceWorker.controller"): break
            await pg.reload(wait_until='domcontentloaded'); await pg.wait_for_timeout(2000)
        print('service worker activo:', await pg.evaluate("!!navigator.serviceWorker.controller"))
        await pg.wait_for_timeout(2500)
        await pg.evaluate("openDl()"); await pg.wait_for_timeout(500)
        await pg.click('[data-z="z1"]'); await pg.wait_for_timeout(200)
        await pg.click('#dlGo')
        for _ in range(180):
            await pg.wait_for_timeout(1000)
            if not await pg.evaluate("dlBusy"): break
        print('guardado:', await pg.evaluate("savedList()"))
        await pg.evaluate("closeModals()")

        # ---- red cortada del todo ----
        await ctx.unroute('**arcgisonline.com**')
        await ctx.set_offline(True)
        print('--- SIN RED ---')
        await pg.reload(wait_until='domcontentloaded')
        await pg.wait_for_timeout(4000); await pg.evaluate("typeof closeWelcome==='function'&&closeWelcome()")
        st = await pg.evaluate("""({
           app: !!document.querySelector('#map'),
           sitios: typeof PLACES!=='undefined' ? PLACES.length : 0,
           tarjetas: document.querySelectorAll('.card').length,
           teselas: document.querySelectorAll('.leaflet-tile').length,
           teselasOK: [...document.querySelectorAll('.leaflet-tile')].filter(i=>i.complete&&i.naturalWidth>0).length
        })""")
        print('con la red cortada:', st)
        await pg.screenshot(path='p-offline.png', timeout=8000, animations='disabled') if False else None
        print('errores:', errs[:3])
        await b.close()
asyncio.run(main())
