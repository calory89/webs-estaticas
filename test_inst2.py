import threading, http.server, socketserver, os
from playwright.sync_api import sync_playwright
os.chdir('/home/claude/supportnear')
class T(socketserver.ThreadingTCPServer): allow_reuse_address=True
srv=T(('127.0.0.1',8913),http.server.SimpleHTTPRequestHandler)
threading.Thread(target=srv.serve_forever,daemon=True).start()
with sync_playwright() as p:
    b=p.chromium.launch(); c=b.new_context(); pg=c.new_page()
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.on('console', lambda m: errs.append('console:'+m.type+':'+m.text[:120]) if m.type=='error' else None)
    pg.goto('http://127.0.0.1:8913/index.html'); pg.wait_for_timeout(3000)
    pg.evaluate("localStorage.setItem('sn.lang', JSON.stringify('fr'))")
    for u in ['prensa.html?v=x','instalar.html?v=x','instalar.html']:
        pg.goto('http://127.0.0.1:8913/'+u); pg.wait_for_timeout(900)
        info=pg.evaluate("""()=>({lang:document.documentElement.lang,
          h1:document.querySelector('h1').textContent.slice(0,40),
          hasT: typeof T !== 'undefined',
          trLangs: (typeof T!=='undefined')?Object.keys(T).length:0,
          pick: (typeof pick!=='undefined')?pick():'n/a',
          ls: localStorage.getItem('sn.lang'),
          n: document.querySelectorAll('[data-t]').length,
          bytes: document.documentElement.outerHTML.length})""")
        print(u, info)
    print('ERR', errs[:5])
    b.close()
srv.shutdown()
