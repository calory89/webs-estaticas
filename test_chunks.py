import asyncio, json, os, subprocess, time
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page()
        reqs=[]
        pg.on('request', lambda r: reqs.append(r.url))
        errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append('CONSOLE '+m.type+': '+m.text) if m.type=='error' else None)
        t0=time.time()
        await pg.goto('http://127.0.0.1:8899/index.html?city=Madrid', wait_until='load')
        load=time.time()-t0
        await pg.wait_for_timeout(3500)
        st = await pg.evaluate("({places: PLACES.length, chunks:[...loadedChunks], busy: chunkBusy, center: map.getCenter(), zoom: map.getZoom()})")
        print('load(s)', round(load,2))
        print('places', st['places'], 'chunksLoaded', len(st['chunks']), 'busy', st['busy'])
        print('center', st['center'], 'zoom', st['zoom'])
        print('chunk requests', len([r for r in reqs if '/d/' in r]))
        # click a marker
        pins = await pg.query_selector_all('.pin')
        print('pins', len(pins))
        if pins:
            before = await pg.evaluate("map.getZoom()")
            await pins[len(pins)//2].click()
            await pg.wait_for_timeout(1200)
            after = await pg.evaluate("({z:map.getZoom(), sheet: !!document.querySelector('#detail.on'), c:map.getCenter()})")
            print('click: zoom', before, '->', after['z'], 'sheet', after['sheet'])
        print('ERRORS:', errs[:8])
        await b.close()

asyncio.run(main())
