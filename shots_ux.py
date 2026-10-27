import asyncio, subprocess
from playwright.async_api import async_playwright
def fetch(u): return subprocess.run(['curl','-s','-m','20','-A','Mozilla/5.0',u],capture_output=True).stdout
async def tiles(route, request):
    b=fetch(request.url.split('?')[0])
    if b: await route.fulfill(status=200, body=b, content_type='image/png')
    else: await route.abort()
UA='Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch()
        ctx=await br.new_context(viewport={'width':375,'height':667}, device_scale_factor=2,
                                 is_mobile=True, has_touch=True, user_agent=UA, locale='es-ES')
        await ctx.route('**basemaps.cartocdn.com**', tiles)
        pg=await ctx.new_page()
        await pg.goto('http://127.0.0.1:8899/index.html?city=Madrid', wait_until='domcontentloaded')
        await pg.wait_for_selector('.card', timeout=20000); await pg.wait_for_timeout(3000)
        await pg.screenshot(path='u1-home.png')
        # ficha
        await pg.evaluate("document.querySelector('.panel').classList.add('up')")
        await pg.wait_for_timeout(400)
        await pg.click('.card'); await pg.wait_for_timeout(900)
        d = await pg.evaluate("""(()=>{const e=document.querySelector('#detail').getBoundingClientRect();
           return {top:Math.round(e.top),bottom:Math.round(e.bottom),vh:innerHeight,seSale:e.bottom>innerHeight+1};})()""")
        print('ficha:', d)
        await pg.screenshot(path='u2-ficha.png')
        await pg.evaluate("closeDetail()"); await pg.wait_for_timeout(400)
        # descarga
        await pg.evaluate("openDl()"); await pg.wait_for_timeout(700)
        await pg.screenshot(path='u3-dl.png')
        dd = await pg.evaluate("""(()=>{const b=document.querySelector('#mDl .modal-box').getBoundingClientRect();
           return {alto:Math.round(b.height),vh:innerHeight,seSale:b.bottom>innerHeight+1};})()""")
        print('descarga:', dd)
        await pg.evaluate("closeModals()"); await pg.wait_for_timeout(300)
        await pg.evaluate("geoHelp('d')"); await pg.wait_for_timeout(600)
        await pg.screenshot(path='u4-geo.png')
        await ctx.close()
        # escritorio
        ctx2=await br.new_context(viewport={'width':1440,'height':900}, locale='es-ES')
        await ctx2.route('**basemaps.cartocdn.com**', tiles)
        pg2=await ctx2.new_page()
        errs=[]; pg2.on('pageerror', lambda e: errs.append(str(e)))
        await pg2.goto('http://127.0.0.1:8899/index.html?city=Madrid', wait_until='domcontentloaded')
        await pg2.wait_for_selector('.card', timeout=20000); await pg2.wait_for_timeout(3500)
        d2 = await pg2.evaluate("""(()=>{const vis=e=>e&&e.offsetParent!==null;
          return {now:vis(document.getElementById('nowBtn')), lang:vis(document.getElementById('langBtn')),
                  tema:vis(document.getElementById('themeBtn')), chipAhora:!!document.getElementById('nowChip'),
                  buscador:Math.round(document.querySelector('#q').getBoundingClientRect().width)};})()""")
        print('ESCRITORIO:', d2, 'errores:', errs[:2])
        await pg2.screenshot(path='u5-desktop.png')
        await br.close()
asyncio.run(main())
