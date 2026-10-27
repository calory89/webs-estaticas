import asyncio, subprocess
from playwright.async_api import async_playwright
def fetch(u): return subprocess.run(['curl','-s','-m','20','-A','Mozilla/5.0',u],capture_output=True).stdout
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(); pg=await ctx.new_page()
        async def tiles(route, request):
            body=fetch(request.url.split('?')[0])
            if body: await route.fulfill(status=200, body=body, content_type='image/png',
                     headers={'content-length':str(len(body)),'access-control-allow-origin':'*'})
            else: await route.abort()
        await ctx.route('**basemaps.cartocdn.com**', tiles)
        await pg.goto('http://127.0.0.1:8899/index.html?city=Madrid', wait_until='domcontentloaded')
        await pg.wait_for_selector('.card', timeout=20000); await pg.wait_for_timeout(2500)
        await pg.evaluate("navigator.serviceWorker.ready")
        for _ in range(8):
            if await pg.evaluate("!!navigator.serviceWorker.controller"): break
            await pg.reload(wait_until='domcontentloaded'); await pg.wait_for_timeout(2000)
        await pg.wait_for_timeout(2000)
        r = await pg.evaluate("""(async()=>{
          const c = await caches.open(SAVED_CACHE);
          const urls = tileUrls(40.4168,-3.7038,1,[15]).slice(0,6);
          const out={n:urls.length, ok:0, fail:[], bytes:0};
          for(const u of urls){
            try{
              const req = u + '?dl=1';
              const res = await fetch(req,{cache:'reload'});
              if(res && res.ok){ out.ok++; out.bytes += +(res.headers.get('content-length')||0);
                                 await c.put(u,res.clone()); }
              else out.fail.push(res? res.status+'/'+res.type : 'null');
            }catch(e){ out.fail.push(e.name+': '+e.message); }
          }
          out.enCache = (await c.keys()).length;
          out.guardadas = savedList();
          return out; })()""")
        print(r)
        await b.close()
asyncio.run(main())
