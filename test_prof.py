import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page()
        await pg.goto('http://127.0.0.1:8899/index.html?city=Dhaka', wait_until='domcontentloaded')
        m=await pg.evaluate("""(()=>{const n=performance.getEntriesByType('navigation')[0];
          const r=performance.getEntriesByType('resource').map(e=>[e.name.split('/').pop().slice(0,28), Math.round(e.startTime), Math.round(e.duration)]);
          return {req:Math.round(n.requestStart), resp0:Math.round(n.responseStart), resp1:Math.round(n.responseEnd),
                  domInt:Math.round(n.domInteractive), dcl:Math.round(n.domContentLoadedEventEnd),
                  res:r.sort((a,b)=>b[2]-a[2]).slice(0,8)};})()""")
        for k,v in m.items():
            if k!='res': print(k,v)
        for x in m['res']: print('  ',x)
        await b.close()
asyncio.run(main())
