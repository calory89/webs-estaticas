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
        for w,tag in [(375,'iPhone SE'),(393,'iPhone 17 Pro'),(360,'Android')]:
            ctx=await br.new_context(viewport={'width':w,'height':780}, device_scale_factor=3,
                                     is_mobile=True, has_touch=True, locale='es-ES')
            await ctx.route('**basemaps.cartocdn.com**', tiles)
            pg=await ctx.new_page()
            await pg.goto('http://127.0.0.1:8899/index.html?city=Madrid', wait_until='domcontentloaded')
            await pg.wait_for_selector('.chip', timeout=20000); await pg.wait_for_timeout(1500)
            r = await pg.evaluate("""(()=>{
              const out=[];
              document.querySelectorAll('#filters .chip').forEach(c=>{
                if(c.scrollWidth > c.clientWidth + 1)
                  out.push({t:c.textContent.trim(), caja:Math.round(c.clientWidth), texto:Math.round(c.scrollWidth)});
              });
              return {desbordan:out, total:document.querySelectorAll('#filters .chip').length};})()""")
            print(f'{tag} ({w}px): pastillas={r["total"]} desbordan={r["desbordan"] or "ninguna"}')
            await pg.screenshot(path=f'chip-{w}.png', clip={'x':0,'y':0,'width':w,'height':140})
            await ctx.close()
        await br.close()
asyncio.run(main())
