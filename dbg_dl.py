import asyncio, subprocess
from playwright.async_api import async_playwright
def fetch(u): return subprocess.run(['curl','-s','-m','20','-A','Mozilla/5.0',u],capture_output=True).stdout
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(service_workers='allow'); pg=await ctx.new_page()
        async def tiles(route, request):
            body=fetch(request.url)
            if body: await route.fulfill(status=200, body=body, content_type='image/png',
                                         headers={'content-length':str(len(body)),'access-control-allow-origin':'*'})
            else: await route.abort()
        await ctx.route('**basemaps.cartocdn.com**', tiles)
        msgs=[]; pg.on('console', lambda m: msgs.append(m.type+': '+m.text))
        pg.on('pageerror', lambda e: msgs.append('ERR '+str(e)))
        await pg.goto('http://127.0.0.1:8899/index.html?city=Madrid', wait_until='domcontentloaded')
        await pg.wait_for_selector('.card', timeout=20000); await pg.wait_for_timeout(3000)
        print('sw:', await pg.evaluate("!!navigator.serviceWorker.controller"))
        r = await pg.evaluate("""(async()=>{
          const u = tileUrls(40.4168,-3.7038,2,[15])[0];
          const out = {url:u};
          try{
            const res = await fetch(u,{mode:'no-cors',cache:'reload'});
            out.ok=res.ok; out.status=res.status; out.type=res.type;
            out.len=res.headers.get('content-length');
            const c = await caches.open(SAVED_CACHE);
            await c.put(u, res.clone());
            out.put='ok';
            out.back = !!(await c.match(u));
          }catch(e){ out.error = e.name+': '+e.message; }
          return out; })()""")
        print('prueba de una tesela:', r)
        print('consola:', msgs[:6])
        await b.close()
asyncio.run(main())
