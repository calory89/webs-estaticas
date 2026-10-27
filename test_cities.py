import asyncio, sys
from playwright.async_api import async_playwright
CITIES=['Dhaka','Lagos','Kinshasa','Lima','Manila','Kabul','Bogota','Sanaa','Port-au-Prince','Caracas','Karachi','Nairobi']
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page()
        await pg.route('**/*.png', lambda r: r.abort())
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        for c in CITIES:
            await pg.goto(f'http://127.0.0.1:8899/index.html?city={c}', wait_until='domcontentloaded')
            try: await pg.wait_for_selector('.pin', timeout=8000)
            except Exception: print(c,'SIN ICONOS'); continue
            await pg.wait_for_timeout(1400)
            st=await pg.evaluate("""({near:(S.places||[]).filter(p=>dist(S.center.lat,S.center.lon,p.lat,p.lon)<12000).length,
                                     far:!!S.far, pins:document.querySelectorAll('.pin,.clus').length})""")
            print(f"{c:16} a menos de 12 km: {st['near']:5}  iconos: {st['pins']:3}  {'LEJOS' if st['far'] else ''}")
        print('errores JS:', errs[:3])
        await b.close()
asyncio.run(main())
