import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page()
        await pg.route('**/d/*.json*', lambda r: r.abort())
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://127.0.0.1:8899/index.html?city=Nairobi', wait_until='load')
        await pg.wait_for_timeout(2500)
        st=await pg.evaluate("({places:PLACES.length, busy:chunkBusy, retryable:[...loadedChunks].length, list:document.querySelectorAll('.card,.result,.item').length})")
        print('OFFLINE places', st['places'], 'busy', st['busy'], 'loadedSet', st['retryable'])
        print('errors', errs[:3])
        # now allow and pan to trigger retry
        await pg.unroute('**/d/*.json*')
        await pg.evaluate("map.setView([-1.2921,36.8219],14)")
        await pg.wait_for_timeout(2500)
        st2=await pg.evaluate("({places:PLACES.length, chunks:[...loadedChunks].length})")
        print('AFTER RETRY places', st2['places'], 'chunks', st2['chunks'])
        await b.close()
asyncio.run(main())
