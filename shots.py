# Capturas para el kit de prensa, del sitio real.
# Chromium no llega al CDN de teselas desde este contenedor pero curl si, asi que
# las peticiones de tesela se sirven por ahi. La imagen es la que ve un visitante.
import asyncio, subprocess
from playwright.async_api import async_playwright

SHOTS = [('Madrid', 'shot-madrid.png', 1440, 900),
         ('Nairobi', 'shot-nairobi.png', 1440, 900),
         ('Manila', 'shot-movil.png', 430, 880)]

def fetch(url):
    r = subprocess.run(['curl', '-s', '-m', '20', '-A', 'Mozilla/5.0', url], capture_output=True)
    return r.stdout

async def tiles(route, request):
    try:
        body = fetch(request.url)
        if body:
            await route.fulfill(status=200, body=body, content_type='image/jpeg')
            return
    except Exception:
        pass
    await route.abort()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for city, out, w, h in SHOTS:
            pg = await b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=2)
            await pg.route('**arcgisonline.com**', tiles)
            await pg.goto(f'http://127.0.0.1:8951/index.html?city={city}', wait_until='domcontentloaded')
            await pg.wait_for_selector('.card', timeout=25000)
            await pg.wait_for_timeout(6000)
            await pg.screenshot(path=out)
            n = await pg.evaluate("document.querySelectorAll('.leaflet-tile-loaded').length")
            print(out, '| teselas cargadas:', n)
            await pg.close()
        await b.close()

asyncio.run(main())
