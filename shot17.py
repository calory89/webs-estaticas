import asyncio, subprocess
from playwright.async_api import async_playwright
def fetch(u): return subprocess.run(['curl','-s','-m','20','-A','Mozilla/5.0',u],capture_output=True).stdout
async def tiles(route, request):
    b=fetch(request.url.split('?')[0])
    if b: await route.fulfill(status=200, body=b, content_type='image/png')
    else: await route.abort()
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch()
        # iPhone 17 Pro con la barra de Chrome puesta: alto util reducido
        ctx=await br.new_context(viewport={'width':393,'height':720}, device_scale_factor=3,
                                 is_mobile=True, has_touch=True, locale='es-ES')
        await ctx.route('**basemaps.cartocdn.com**', tiles)
        pg=await ctx.new_page()
        await pg.goto('http://127.0.0.1:8899/index.html?city=Madrid', wait_until='domcontentloaded')
        await pg.wait_for_selector('.card', timeout=20000); await pg.wait_for_timeout(3000)
        await pg.screenshot(path='p17-a.png')
        await pg.evaluate("document.querySelector('.panel').classList.add('up')"); await pg.wait_for_timeout(600)
        await pg.screenshot(path='p17-b.png')
        r = await pg.evaluate("""(()=>{const p=document.querySelector('.panel').getBoundingClientRect();
          const l=document.querySelector('#list').getBoundingClientRect();
          return {panelArriba:Math.round(p.top), panelAbajo:Math.round(p.bottom), vh:innerHeight,
                  listaAbajo:Math.round(l.bottom), margen: Math.round(innerHeight - l.bottom)};})()""")
        print('panel abierto:', r)
        await br.close()
asyncio.run(main())
