import asyncio, subprocess
from playwright.async_api import async_playwright
def fetch(u):
    return subprocess.run(['curl','-s','-m','20','-A','Mozilla/5.0',u],capture_output=True).stdout
async def tiles(route, request):
    b=fetch(request.url)
    if b: await route.fulfill(status=200, body=b, content_type='image/png',
                              headers={'content-length':str(len(b))})
    else: await route.abort()
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':1200,'height':950})
        await pg.route('**basemaps.cartocdn.com**', tiles)
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append('C:'+m.text) if m.type=='error' else None)
        await pg.goto('http://127.0.0.1:8899/index.html?city=Madrid', wait_until='domcontentloaded')
        await pg.wait_for_selector('.card', timeout=20000); await pg.wait_for_timeout(1500)
        await pg.evaluate("openDl()"); await pg.wait_for_timeout(600)
        st=await pg.evaluate("""({abierto:!!document.querySelector('#mDl.on'),
           opciones:[...document.querySelectorAll('.zopt')].map(x=>x.innerText.replace(/\\n/g,' | ')),
           nota:(document.querySelector('.dlnote')||{}).textContent})""")
        print('MODAL:', st['abierto']); [print('  ', o) for o in st['opciones']]
        print('  nota:', st['nota'])
        n=await pg.evaluate("tileUrls(40.4168,-3.7038,2).length + ' teselas z1, ' + tileUrls(40.4168,-3.7038,6).length + ' z2'")
        print('  ', n)
        # elegir la mas pequena y guardar
        await pg.click('[data-z="z1"]'); await pg.wait_for_timeout(200)
        await pg.click('#dlGo')
        for _ in range(40):
            await pg.wait_for_timeout(1000)
            done=await pg.evaluate("!document.querySelector('#dlStop') || (document.querySelector('#dlTxt')||{}).textContent")
            if done is True or (isinstance(done,str) and 'de' not in done and 'of' not in done): break
            if not await pg.evaluate("dlBusy"): break
        await pg.wait_for_timeout(1200)
        r=await pg.evaluate("""(async()=>{
           const c=await caches.open(SAVED_CACHE); const k=await c.keys();
           return {guardadas:k.length, lista:savedList(), teselas:k.filter(x=>x.url.includes('cartocdn')).length,
                   datos:k.filter(x=>x.url.includes('/d/')).length}; })()""")
        print('RESULTADO:', r)
        print('errores:', errs[:4])
        await pg.screenshot(path='p-dl.png')
        await b.close()
asyncio.run(main())
