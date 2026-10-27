import re, threading, http.server, socketserver, functools, os
from playwright.sync_api import sync_playwright
os.chdir('/home/claude/supportnear')
H = functools.partial(http.server.SimpleHTTPRequestHandler)
class T(socketserver.ThreadingTCPServer): allow_reuse_address=True
srv=T(('127.0.0.1',8907),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page()
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('http://127.0.0.1:8907/index.html'); pg.wait_for_timeout(2500)
    pg.click('#infoBtn'); pg.wait_for_timeout(600)
    hrefs=pg.eval_on_selector_all('#panel a, [role=dialog] a, a', 'a=>a.map(x=>x.getAttribute("href")).filter(h=>h&&h.indexOf(".html")>=0)')
    print('links app:', sorted(set(hrefs)))
    # navegar a prensa y comprobar idioma
    for L in ['fr','ar','uk','sw','es']:
        pg.evaluate("l=>localStorage.setItem('sn.lang', JSON.stringify(l))", L)
        for f in ['prensa.html','incrustar.html','instalar.html']:
            pg.goto('http://127.0.0.1:8907/'+f+'?v=x'); pg.wait_for_timeout(500)
            print(L, f, '| lang=', pg.eval_on_selector('html','e=>e.lang'),
                  '| dir=', pg.eval_on_selector('html','e=>e.dir'),
                  '| h1=', pg.inner_text('h1')[:45])
    print('errores:', errs[:3])
    b.close()
srv.shutdown()
