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
        # 1) el idioma elegido en la app manda en las paginas
        ctx=await br.new_context(locale='en-GB', viewport={'width':900,'height':1000})
        await ctx.route('**basemaps.cartocdn.com**', tiles)
        pg=await ctx.new_page()
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://127.0.0.1:8899/index.html?city=Madrid', wait_until='domcontentloaded')
        await pg.wait_for_selector('.card', timeout=20000); await pg.wait_for_timeout(1500)
        for code in ['ar','fr','uk','pt','ur','ro','ru','pl','fa','es','en']:
            await pg.evaluate(f"applyLang('{code}'); store.set('langManual',1); store.set('lang','{code}')")
            await pg.wait_for_timeout(120)
            await pg.goto('http://127.0.0.1:8899/prensa.html', wait_until='load')
            await pg.wait_for_timeout(350)
            r = await pg.evaluate("""({lang:document.documentElement.lang, dir:document.documentElement.dir,
                 h1:document.querySelector('h1').textContent.trim().slice(0,34),
                 ingles: document.body.innerText.includes('Press kit') && document.documentElement.lang!=='en'})""")
            print(f"{code}: lang={r['lang']} dir={r['dir']} h1=\"{r['h1']}\" resto-en-ingles={r['ingles']}")
            await pg.goto('http://127.0.0.1:8899/index.html?city=Madrid', wait_until='domcontentloaded')
            await pg.wait_for_timeout(700)
        print('errores:', errs[:3])
        # 2) sin nada elegido, manda el navegador; si no lo tenemos, ingles
        for loc,exp in [('fr-FR','fr'),('ar-EG','ar'),('sw-KE','en'),('pt-BR','pt')]:
            c2=await br.new_context(locale=loc); p2=await c2.new_page()
            await p2.goto('http://127.0.0.1:8899/instalar.html', wait_until='load'); await p2.wait_for_timeout(350)
            got=await p2.evaluate("document.documentElement.lang")
            print(f'navegador {loc} -> {got} (esperado {exp})', 'OK' if got==exp else 'MAL')
            await c2.close()
        await br.close()
asyncio.run(main())
