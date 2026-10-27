import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page()
        await pg.route('**/*.png', lambda r: r.abort())
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append('CONSOLE '+m.text) if m.type=='error' else None)
        await pg.goto('http://127.0.0.1:8899/index.html?city=Madrid', wait_until='domcontentloaded')
        await pg.wait_for_selector('.card', timeout=15000)
        await pg.wait_for_timeout(1800)
        st = await pg.evaluate("""({
          horarioTag: document.body.innerText.includes('Horario sin confirmar') || document.body.innerText.includes('Hours unknown'),
          gapAdd: !!document.querySelector('#gapAdd'),
          shareCard: !!document.querySelector('#shareCard'),
          linea: (typeof shareLine==='function' ? shareLine(visible()).txt : null),
          emgES: JSON.stringify(emgFor('ES')), emgGB: JSON.stringify(emgFor('GB')), emgKE: JSON.stringify(emgFor('KE'))
        })""")
        for k,v in st.items(): print(f'{k}: {v}')
        # abrir una ficha y comprobar el boton
        await pg.click('.card')
        await pg.wait_for_timeout(900)
        d = await pg.evaluate("""({
          abierto: !!document.querySelector('#detail.on'),
          yaNoExiste: !!([...document.querySelectorAll('#detail a.btn--warn')].length),
          texto: (document.querySelector('#detail a.btn--warn')||{}).textContent
        })""")
        print('ficha:', d)
        # modal de informacion -> autoria
        await pg.evaluate("buildPriv(); document.querySelector('#mPriv').classList.add('on')")
        await pg.wait_for_timeout(400)
        a = await pg.evaluate("""({
          mail: (document.querySelector('#byMail')||{}).textContent,
          copiar: !!document.querySelector('#byCopy'),
          nombre: document.querySelector('#privBody').innerText.includes('Carlos de Ory'),
          handle: document.querySelector('#privBody').innerText.includes('@mrstartups'),
          paises: document.querySelector('#privBody').innerText.match(/\\d+\\s*(países|countries)/)
        })""")
        print('autoria:', a)
        # tarjeta compartible
        img = await pg.evaluate("""(async()=>{ const cv=document.createElement('canvas');
            window.__blob=null;
            const orig = navigator.share; navigator.share=undefined; navigator.canShare=undefined;
            await makeShareCard(visible());
            return 'ok'; })()""")
        print('tarjeta:', img)
        print('errores:', errs[:5])
        await b.close()
asyncio.run(main())
