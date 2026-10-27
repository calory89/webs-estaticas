import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':1200,'height':900})
        await pg.route('**/*.png', lambda r: r.abort())
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append('C:'+m.text) if m.type=='error' else None)
        await pg.goto('http://127.0.0.1:8899/index.html?city=Madrid', wait_until='domcontentloaded')
        await pg.wait_for_selector('.card', timeout=15000)
        await pg.wait_for_timeout(1200)

        await pg.click('#infoBtn'); await pg.wait_for_timeout(400)
        m = await pg.evaluate("""({abierto:!!document.querySelector('#mMenu.on'),
            opciones:[...document.querySelectorAll('#menuBody a,#menuBody button')].map(x=>x.textContent.trim()),
            enlaces:[...document.querySelectorAll('#menuBody a')].map(x=>x.getAttribute('href'))})""")
        print('MENU abierto:', m['abierto'])
        for o in m['opciones']: print('   -', o)
        print('   enlaces:', m['enlaces'])

        await pg.click('#menuBody [data-act="contact"]'); await pg.wait_for_timeout(500)
        c = await pg.evaluate("""({abierto:!!document.querySelector('#mContact.on'),
            menuCerrado:!document.querySelector('#mMenu.on'),
            asuntos:[...document.querySelectorAll('#ctSubj option')].map(o=>o.textContent),
            mail:(document.querySelector('.ctmail span')||{}).textContent,
            foco:document.activeElement.id})""")
        print('CONTACTO:', c)

        # el mailto se monta bien y no esta escrito en el HTML
        await pg.select_option('#ctSubj','s1')
        await pg.fill('#ctMsg','Hola, escribo desde El País.')
        url = await pg.evaluate("""(()=>{ let cap=null;
            const d=Object.getOwnPropertyDescriptor(window.location,'href');
            window.__go=(u)=>cap=u;
            const btn=document.querySelector('#ctGo');
            const orig=btn.onclick;
            btn.onclick=function(){ const s=window.location; 
              try{ Object.defineProperty(window,'location',{value:{set href(v){cap=v}},configurable:true}); }catch(e){}
              orig.call(this);
              try{ Object.defineProperty(window,'location',{value:s,configurable:true}); }catch(e){}
            };
            btn.click(); return cap; })()""")
        print('mailto generado:', url)
        html = await pg.content()
        print('la direccion aparece pegada en el HTML:', 'carlos@equinoxinvestmentgroup.com' in html)
        print('errores:', errs[:4])
        await pg.screenshot(path='p-menu.png')
        await b.close()
asyncio.run(main())
