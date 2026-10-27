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
        for w,h,tag in [(393,852,'iPhone 17 Pro'),(393,720,'…con barra de Chrome'),
                        (375,667,'iPhone SE'),(360,640,'Android chico'),(430,932,'iPhone Max')]:
            ctx=await br.new_context(viewport={'width':w,'height':h}, device_scale_factor=2,
                                     is_mobile=True, has_touch=True, locale='es-ES')
            await ctx.route('**basemaps.cartocdn.com**', tiles)
            pg=await ctx.new_page()
            await pg.goto('http://127.0.0.1:8899/index.html?city=Madrid', wait_until='domcontentloaded')
            await pg.wait_for_selector('.card', timeout=20000); await pg.wait_for_timeout(2200)
            r = await pg.evaluate("""(()=>{
              const app=document.getElementById('app').getBoundingClientRect();
              const pan=document.querySelector('.panel').getBoundingClientRect();
              const head=document.querySelector('.panel-head').getBoundingClientRect();
              const card=document.querySelector('#list .card');
              const cb= card? card.getBoundingClientRect() : null;
              return {app:Math.round(app.height), vh:innerHeight,
                      asoma:Math.round(innerHeight-pan.top),
                      cabeceraDentro: head.bottom <= innerHeight,
                      margenCabecera: Math.round(innerHeight-head.bottom),
                      primeraFichaVisible: cb ? cb.top < innerHeight : false};})()""")
            print(f'{tag} ({w}x{h}): app={r["app"]} de {r["vh"]} | asoma={r["asoma"]}px | '
                  f'cabecera dentro={r["cabeceraDentro"]} (+{r["margenCabecera"]}px) | 1a ficha visible={r["primeraFichaVisible"]}')
            await ctx.close()
        await br.close()
asyncio.run(main())
