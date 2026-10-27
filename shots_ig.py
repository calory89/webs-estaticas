import asyncio, subprocess
from playwright.async_api import async_playwright
def fetch(u): return subprocess.run(['curl','-s','-m','20','-A','Mozilla/5.0',u],capture_output=True).stdout
async def tiles(route, request):
    b=fetch(request.url.split('?')[0])
    if b: await route.fulfill(status=200, body=b, content_type='image/png')
    else: await route.abort()
UA='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0'
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch()
        ctx=await br.new_context(viewport={'width':375,'height':600}, device_scale_factor=2,
                                 is_mobile=True, has_touch=True, user_agent=UA, locale='en-GB')
        await ctx.route('**basemaps.cartocdn.com**', tiles)
        pg=await ctx.new_page()
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://127.0.0.1:8899/index.html', wait_until='domcontentloaded')
        await pg.wait_for_timeout(3000)
        print('cuadro al abrir:', await pg.evaluate("!!document.querySelector('#mGeo.on')"))
        await pg.evaluate("setCenter(57.0488,9.9217); if(map) map.setView([57.0488,9.9217],7)")
        await pg.wait_for_timeout(2500)
        await pg.screenshot(path='ig-a.png')
        await pg.evaluate("document.querySelector('.panel').classList.add('up')")
        await pg.wait_for_timeout(500)
        await pg.screenshot(path='ig-b.png')
        # la barra de idioma
        await pg.evaluate("offerLang('fr')"); await pg.wait_for_timeout(600)
        lb = await pg.evaluate("""(()=>{const b=document.getElementById('langbar');
           if(!b) return null; const r=b.getBoundingClientRect();
           return {texto:b.querySelector('span').textContent, seSale:r.right>innerWidth+1||r.bottom>innerHeight+1,
                   botones:[...b.querySelectorAll('button')].map(x=>x.textContent.trim()||x.id)};})()""")
        print('barra de idioma:', lb)
        await pg.screenshot(path='ig-c.png')
        print('errores:', errs[:3])
        await br.close()
asyncio.run(main())
