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
        ctx=await br.new_context(viewport={'width':390,'height':780}, locale='en-GB', is_mobile=True, has_touch=True)
        await ctx.route('**basemaps.cartocdn.com**', tiles)
        pg=await ctx.new_page()
        await pg.goto('http://127.0.0.1:8899/index.html?city=Paris', wait_until='domcontentloaded')
        await pg.wait_for_selector('.card', timeout=20000); await pg.wait_for_timeout(3500)
        print('idioma tras ir a Paris (debe seguir en):', await pg.evaluate("LANG"))
        print('placeholder:', await pg.evaluate("document.querySelector('#q').placeholder.slice(0,25)"))
        await pg.evaluate("offerLang('fr')"); await pg.wait_for_timeout(500)
        print('ofrece frances:', await pg.evaluate("!!document.getElementById('langbar')"))
        # rechazar
        await pg.click('#langNo'); await pg.wait_for_timeout(600)
        print('tras rechazar, idioma:', await pg.evaluate("LANG"), '| recordado:', await pg.evaluate("localStorage.getItem('sn.langAsked')"))
        await pg.evaluate("offerLang('fr')"); await pg.wait_for_timeout(400)
        print('vuelve a ofrecer frances:', await pg.evaluate("!!document.getElementById('langbar')"))
        # aceptar otro
        await pg.evaluate("offerLang('es')"); await pg.wait_for_timeout(500)
        await pg.click('#langYes'); await pg.wait_for_timeout(700)
        print('tras aceptar espanol:', await pg.evaluate("LANG"), '| manual:', await pg.evaluate("localStorage.getItem('sn.langManual')"))
        await pg.goto('http://127.0.0.1:8899/index.html?city=Berlin', wait_until='domcontentloaded')
        await pg.wait_for_timeout(3000)
        print('en Berlin sigue en:', await pg.evaluate("LANG"))
        await br.close()
asyncio.run(main())
