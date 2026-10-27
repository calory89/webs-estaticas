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
        for loc,exp in [('en-US','en'),('es-ES','es'),('fr-FR','en'),('sw-KE','en')]:
            ctx=await br.new_context(locale=loc, viewport={'width':900,'height':1000})
            pg=await ctx.new_page(); await ctx.route('**basemaps.cartocdn.com**', tiles)
            errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto('http://127.0.0.1:8899/prensa.html', wait_until='load')
            await pg.wait_for_timeout(900)
            got = await pg.evaluate("document.documentElement.getAttribute('data-l')")
            h1  = await pg.evaluate("document.querySelector('h1').innerText.trim()")
            vis = await pg.evaluate("[...document.querySelectorAll('[lang]')].filter(e=>e.offsetParent!==null).map(e=>e.getAttribute('lang')).filter((v,i,a)=>a.indexOf(v)===i)")
            print(f'{loc}: data-l={got} (esperado {exp}) | h1="{h1}" | visibles={vis} | errores={errs[:1]}')
            await ctx.close()
        ctx=await br.new_context(locale='en-US'); pg=await ctx.new_page()
        await pg.goto('http://127.0.0.1:8899/instalar.html', wait_until='load'); await pg.wait_for_timeout(600)
        print('instalar EN:', await pg.evaluate("document.querySelector('h1').innerText.trim()"))
        await pg.click('[data-lang-btn="es"]'); await pg.wait_for_timeout(300)
        print('tras pulsar ES:', await pg.evaluate("document.querySelector('h1').innerText.trim()"))
        print('recordado:', await pg.evaluate("localStorage.getItem('sn.lang')"))
        await pg.goto('http://127.0.0.1:8899/prensa.html', wait_until='load'); await pg.wait_for_timeout(600)
        print('prensa recuerda ES:', await pg.evaluate("document.documentElement.getAttribute('data-l')"))
        print('direccion pegada:', await pg.evaluate("document.documentElement.outerHTML.includes('carlos@equinoxinvestmentgroup.com')"))
        await br.close()
asyncio.run(main())
