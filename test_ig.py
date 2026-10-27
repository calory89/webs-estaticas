# El navegador dentro de Instagram: menos alto util y sin barra de direcciones.
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
        for w,h,tag in [(375,600,'iPhone SE en Instagram'),(390,620,'iPhone 14 en Instagram'),(360,640,'Android pequeño')]:
            ctx=await br.new_context(viewport={'width':w,'height':h}, device_scale_factor=2,
                                     is_mobile=True, has_touch=True, user_agent=UA, locale='en-GB')
            await ctx.route('**basemaps.cartocdn.com**', tiles)
            pg=await ctx.new_page()
            errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
            # Aalborg, Dinamarca: lejos de cualquier ciudad del mapa
            await pg.goto('http://127.0.0.1:8899/index.html', wait_until='domcontentloaded')
            await pg.wait_for_timeout(1200)
            await pg.evaluate("setCenter(57.0488,9.9217); if(map) map.setView([57.0488,9.9217],7)")
            await pg.wait_for_timeout(2600)
            r = await pg.evaluate("""(()=>{
              const cut = e=>{const b=e.getBoundingClientRect();
                 return b.right>innerWidth+0.5 || b.left<-0.5 || b.bottom>innerHeight+0.5;};
              const bad=[...document.querySelectorAll('.topbar > *')]
                 .filter(e=>e.offsetParent&&cut(e)).map(e=>e.id||e.className.split(' ')[0]);
              const p=document.querySelector('.panel').getBoundingClientRect();
              return {cortados:bad, sub:document.querySelector('#panelSub').textContent.trim(),
                      lista:document.querySelectorAll('#list .card').length,
                      tarjetaLejos:!!document.querySelector('.tip--far'),
                      peek: Math.round(innerHeight - p.top)};})()""")
            print(f'{tag} ({w}x{h}):')
            print('   cortados:', r['cortados'] or 'ninguno')
            print('   subtitulo:', r['sub'])
            print('   fichas en lista:', r['lista'], '| aviso de lejos:', r['tarjetaLejos'], '| asoma:', r['peek'],'px')
            print('   errores:', errs[:2])
            await pg.screenshot(path=f'ig-{w}.png')
            await ctx.close()
        await br.close()
asyncio.run(main())
