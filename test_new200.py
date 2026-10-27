import asyncio, subprocess
from playwright.async_api import async_playwright
def fetch(u): return subprocess.run(['curl','-s','-m','20','-A','Mozilla/5.0',u],capture_output=True).stdout
async def tiles(route, request):
    b=fetch(request.url.split('?')[0])
    if b: await route.fulfill(status=200, body=b, content_type='image/png')
    else: await route.abort()
CITIES=['Baidoa','Zahle','Pokhara','Gonaives','Daloa','Zwedru','Juba','Goma','Kabul','Sanaa']
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':1100,'height':850})
        await ctx.route('**basemaps.cartocdn.com**', tiles)
        pg=await ctx.new_page()
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        for c in CITIES:
            await pg.goto(f'http://127.0.0.1:8899/index.html?city={c}', wait_until='domcontentloaded')
            try: await pg.wait_for_selector('.card', timeout=9000)
            except Exception: print(f'{c:14} sin resultados'); continue
            await pg.wait_for_timeout(1400)
            st=await pg.evaluate("""({cerca:(S.places||[]).filter(p=>dist(S.center.lat,S.center.lon,p.lat,p.lon)<12000).length,
               fichas:document.querySelectorAll('#list .card').length, ciudad:S.placeName,
               lejos:!!document.querySelector('.tip--far')})""")
            print(f"{c:14} a 12 km: {st['cerca']:4} | fichas: {st['fichas']:3} | {st['ciudad'] or '-'} {'(lejos)' if st['lejos'] else ''}")
        print('errores:', errs[:3])
        await b.close()
asyncio.run(main())
