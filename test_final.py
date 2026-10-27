import threading, http.server, socketserver, os, socket
from playwright.sync_api import sync_playwright
os.chdir('/home/claude/supportnear')
class H(http.server.SimpleHTTPRequestHandler):
    protocol_version='HTTP/1.1'
    def log_message(self,*a): pass
class T(socketserver.ThreadingTCPServer):
    allow_reuse_address=True; daemon_threads=True; request_queue_size=200
srv=T(('127.0.0.1',8921),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
B='http://127.0.0.1:8921/'
ok=True
with sync_playwright() as p:
    b=p.chromium.launch(); c=b.new_context(); pg=c.new_page()
    pg.goto(B+'index.html'); pg.wait_for_timeout(3500)
    links=pg.evaluate("()=>{document.getElementById('infoBtn').click();return 0}")
    pg.wait_for_timeout(500)
    hrefs=sorted(set(pg.eval_on_selector_all('a','a=>a.map(x=>x.getAttribute("href")).filter(h=>h&&h.indexOf(".html")>=0)')))
    print('enlaces del menu:', hrefs)
    for L in ['en','es','fr','ar','uk','ro','pl','ru','pt','ur','fa','wo','bm']:
        pg.evaluate("l=>localStorage.setItem('sn.lang', JSON.stringify(l))", L)
        row=[]
        for f in ['prensa.html','incrustar.html','instalar.html']:
            pg.goto(B+f+'?v=c8bccf5c'); pg.wait_for_timeout(700)
            got=pg.eval_on_selector('html','e=>e.lang')
            h1=pg.inner_text('h1')[:28]
            exp = {'wo':'fr','bm':'fr'}.get(L,L)
            if got!=exp: ok=False; row.append('FALLO %s->%s'%(f,got))
            else: row.append('%s=%s'%(f.split('.')[0][:4],h1))
        print('%-3s %s'%(L,' | '.join(row)))
    # sin red, con la huella en la URL
    pg.goto(B+'index.html'); pg.wait_for_timeout(2500)
    pg.goto(B+'instalar.html?v=c8bccf5c'); pg.wait_for_timeout(700)
    c.set_offline(True)
    pg.goto(B+'instalar.html?v=c8bccf5c'); pg.wait_for_timeout(900)
    h1=pg.inner_text('h1')[:40]
    print('SIN RED instalar.html?v= ->', h1)
    if 'signal' not in h1 and 'sans' not in h1 and 'sin' not in h1.lower(): ok=False
    c.set_offline(False)
    b.close()
srv.shutdown()
print('RESULTADO:', 'OK' if ok else 'HAY FALLOS')
