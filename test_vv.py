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
        ctx=await br.new_context(viewport={'width':393,'height':852}, device_scale_factor=3,
                                 is_mobile=True, has_touch=True, locale='es-ES')
        await ctx.route('**basemaps.cartocdn.com**', tiles)
        pg=await ctx.new_page()
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://127.0.0.1:8899/index.html?city=Madrid', wait_until='domcontentloaded')
        await pg.wait_for_selector('.card', timeout=20000); await pg.wait_for_timeout(2500)
        r = await pg.evaluate("""(()=>{
          const app=document.getElementById('app').getBoundingClientRect();
          const pan=document.querySelector('.panel').getBoundingClientRect();
          return {vv: window.visualViewport ? Math.round(window.visualViewport.height) : null,
                  varVh: getComputedStyle(document.documentElement).getPropertyValue('--vh').trim(),
                  appAlto: Math.round(app.height), inner: innerHeight,
                  panelAbajo: Math.round(pan.bottom), appAbajo: Math.round(app.bottom),
                  fuera: pan.bottom > app.bottom + 1};})()""")
        print('viewport:', r)
        # simular la barra de Chrome iOS apareciendo: el viewport se encoge
        await pg.set_viewport_size({'width':393,'height':760})
        await pg.wait_for_timeout(600)
        r2 = await pg.evaluate("""(()=>{const app=document.getElementById('app').getBoundingClientRect();
           return {varVh:getComputedStyle(document.documentElement).getPropertyValue('--vh').trim(),
                   appAlto:Math.round(app.height), inner:innerHeight,
                   cabe: Math.abs(app.height - innerHeight) < 2};})()""")
        print('tras encoger la ventana:', r2)
        # desbordes de pastillas
        ch = await pg.evaluate("""[...document.querySelectorAll('#filters .chip')]
             .filter(c=>c.scrollWidth>c.clientWidth+1).map(c=>c.textContent.trim())""")
        print('pastillas que desbordan:', ch or 'ninguna')
        sh = await pg.evaluate("""[...document.querySelectorAll('#filters .chip')].map(c=>getComputedStyle(c).flexShrink)""")
        print('flex-shrink de las pastillas:', sorted(set(sh)))
        print('errores:', errs[:3])
        await br.close()
asyncio.run(main())
