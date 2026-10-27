import asyncio, subprocess
from playwright.async_api import async_playwright
def fetch(u):
    return subprocess.run(['curl','-s','-m','20','-A','Mozilla/5.0',u],capture_output=True).stdout
async def tiles(route, request):
    b=fetch(request.url)
    if b: await route.fulfill(status=200, body=b, content_type='image/png')
    else: await route.abort()
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for f,shot in [('prensa.html','p-prensa.png'),('incrustar.html','p-incrustar.png'),('instalar.html','p-instalar.png')]:
            pg=await b.new_page(viewport={'width':900,'height':1100})
            await pg.route('**basemaps.cartocdn.com**', tiles)
            errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
            r=await pg.goto(f'http://127.0.0.1:8899/{f}', wait_until='load')
            await pg.wait_for_timeout(4000)
            broken=await pg.evaluate("[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.getAttribute('src'))")
            links=await pg.evaluate("[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(h=>!h.startsWith('http')&&!h.startsWith('#'))")
            print(f, '| http', r.status, '| imagenes rotas:', broken, '| errores:', errs[:2])
            print('   enlaces locales:', links)
            await pg.screenshot(path=shot, full_page=(f!='prensa.html'))
            await pg.close()
        await b.close()
asyncio.run(main())
