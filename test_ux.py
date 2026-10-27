import asyncio, subprocess
from playwright.async_api import async_playwright
def fetch(u): return subprocess.run(['curl','-s','-m','20','-A','Mozilla/5.0',u],capture_output=True).stdout
async def tiles(route, request):
    b=fetch(request.url.split('?')[0])
    if b: await route.fulfill(status=200, body=b, content_type='image/png')
    else: await route.abort()
UA='Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch()
        ctx=await br.new_context(viewport={'width':375,'height':667}, device_scale_factor=2,
                                 is_mobile=True, has_touch=True, user_agent=UA, locale='es-ES')
        await ctx.route('**basemaps.cartocdn.com**', tiles)
        pg=await ctx.new_page()
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://127.0.0.1:8899/index.html?city=Madrid', wait_until='domcontentloaded')
        await pg.wait_for_selector('.card', timeout=20000); await pg.wait_for_timeout(2500)

        top = await pg.evaluate("""(()=>{
          const vis = e=>e.offsetParent!==null;
          const ids=['homeBtn','infoBtn','geoBtn','nowBtn','sosBtn1','langBtn','themeBtn'];
          const o={};
          ids.forEach(i=>{const e=document.getElementById(i); o[i]= e? (vis(e)?'visible':'oculto') : 'no existe';});
          const q=document.querySelector('#q').getBoundingClientRect();
          o.buscador = Math.round(q.width)+'px';
          o.chipAhora = !!document.querySelector('#nowChip');
          return o;})()""")
        print('TOPBAR MOVIL:'); [print(f'   {k}: {v}') for k,v in top.items()]

        # el panel de abajo no debe pasarse de la pantalla
        pan = await pg.evaluate("""(()=>{const p=document.querySelector('.panel').getBoundingClientRect();
           return {bottom:Math.round(p.bottom), vh:innerHeight, seSale:p.bottom>innerHeight+1};})()""")
        print('PANEL:', pan)

        # aviso sin conexion
        await pg.evaluate("showOffline()"); await pg.wait_for_timeout(400)
        off = await pg.evaluate("""(()=>{const b=document.getElementById('offbadge');
           if(!b) return null; const r=b.getBoundingClientRect();
           return {ancho:Math.round(r.width), vw:innerWidth, seSale:r.right>innerWidth+1,
                   botones:[...b.querySelectorAll('button')].map(x=>x.textContent.trim()||x.id),
                   texto:b.querySelector('span').textContent.slice(0,50)};})()""")
        print('AVISO SIN CONEXION:', off)
        await pg.screenshot(path='m3-off.png')
        await pg.evaluate("hideOffline()"); await pg.wait_for_timeout(400)
        print('se quita:', await pg.evaluate("!document.getElementById('offbadge')"))

        # menu
        await pg.click('#infoBtn'); await pg.wait_for_timeout(500)
        mn = await pg.evaluate("""(()=>{const b=document.querySelector('#mMenu .modal-box').getBoundingClientRect();
          return {alto:Math.round(b.height), vh:innerHeight, seSale:b.bottom>innerHeight+1,
                  opciones:[...document.querySelectorAll('#menuBody a,#menuBody button')].map(x=>x.textContent.trim()),
                  xVisible: document.querySelector('#mMenu .modal-x').offsetParent!==null};})()""")
        print('MENU:', mn['alto'],'px de', mn['vh'],'| se sale:', mn['seSale'], '| X visible:', mn['xVisible'])
        [print('   -', o) for o in mn['opciones']]
        await pg.screenshot(path='m4-menu.png')
        await pg.evaluate("closeModals()"); await pg.wait_for_timeout(300)

        await pg.evaluate("geoHelp('d')"); await pg.wait_for_timeout(500)
        g = await pg.evaluate("""(()=>{const b=document.querySelector('#mGeo .modal-box');
          const h2=b.querySelector('h2').getBoundingClientRect();
          const x=b.querySelector('.modal-x').getBoundingClientRect();
          return {tituloTapado: h2.right>x.left && h2.top<x.bottom,
                  reintentarVisible: !!document.querySelector('#geoRetry'),
                  alto:Math.round(b.getBoundingClientRect().height), vh:innerHeight};})()""")
        print('MODAL UBICACION:', g)
        await pg.screenshot(path='m5-geo.png')
        print('errores:', errs[:3])
        await br.close()
asyncio.run(main())
