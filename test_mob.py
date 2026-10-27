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
        # iPhone SE, el movil pequeno de verdad
        ctx=await br.new_context(viewport={'width':375,'height':667}, device_scale_factor=2,
                                 is_mobile=True, has_touch=True,
                                 user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1')
        await ctx.route('**basemaps.cartocdn.com**', tiles)
        pg=await ctx.new_page()
        await pg.goto('http://127.0.0.1:8899/index.html?city=Madrid', wait_until='domcontentloaded')
        await pg.wait_for_selector('.card', timeout=20000); await pg.wait_for_timeout(2500)
        await pg.screenshot(path='m1-home.png')
        # el modal de ubicacion
        await pg.evaluate("geoHelp('d')"); await pg.wait_for_timeout(500)
        box = await pg.evaluate("""(()=>{const b=document.querySelector('#mGeo .modal-box');
           const r=b.getBoundingClientRect();
           return {top:Math.round(r.top),bottom:Math.round(r.bottom),h:Math.round(r.height),
                   vh:innerHeight, seCorta: r.bottom>innerHeight||r.top<0,
                   scroll:getComputedStyle(b).overflowY};})()""")
        print('modal ubicacion en movil:', box)
        await pg.screenshot(path='m2-geo.png')
        await br.close()
asyncio.run(main())
