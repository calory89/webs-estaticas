# Prueba directa de lo unico que importa: si la zona esta guardada, el mapa se
# pinta con la red cortada del todo.
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(); pg=await ctx.new_page()
        await pg.goto('http://127.0.0.1:8899/index.html?city=Madrid', wait_until='domcontentloaded')
        await pg.wait_for_selector('.card', timeout=20000); await pg.wait_for_timeout(3000)
        await pg.evaluate("navigator.serviceWorker.ready")
        for _ in range(10):
            if await pg.evaluate("!!navigator.serviceWorker.controller"): break
            await pg.reload(wait_until='domcontentloaded'); await pg.wait_for_timeout(2000)
        print('service worker:', await pg.evaluate("!!navigator.serviceWorker.controller"))
        await pg.wait_for_timeout(2500)

        # se mete en la cache de zonas guardadas un PNG real de 1x1, como si se
        # hubiera descargado, para las teselas que Leaflet va a pedir
        n = await pg.evaluate("""(async()=>{
          const px = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='), c=>c.charCodeAt(0));
          const c = await caches.open(SAVED_CACHE);
          const urls = tileUrls(40.4168,-3.7038,6,[12,13,14,15,16]);
          for(const u of urls) await c.put(u, new Response(px,{headers:{'content-type':'image/png'}}));
          return urls.length; })()""")
        print('teselas metidas en la cache guardada:', n)

        await ctx.set_offline(True)
        await pg.reload(wait_until='domcontentloaded')
        await pg.wait_for_timeout(4500)
        st = await pg.evaluate("""({
          sitios: PLACES.length, tarjetas: document.querySelectorAll('.card').length,
          teselas: document.querySelectorAll('.leaflet-tile').length,
          teselasPintadas: [...document.querySelectorAll('.leaflet-tile')].filter(i=>i.complete&&i.naturalWidth>0).length,
          zoom: map.getZoom()})""")
        print('CON LA RED CORTADA:', st)
        await b.close()
asyncio.run(main())
