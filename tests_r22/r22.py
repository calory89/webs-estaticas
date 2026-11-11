# -*- coding: utf-8 -*-
"""Pruebas de la R22: bienvenida desde el HTML, toques antes de que arranque la app, idioma sin
parpadeo, teselas, pueblos por letra, aviso de cookies y funcionamiento sin red.
    python3 tests_r22/r22.py [http://127.0.0.1:8972/]"""
import sys, re, time
from playwright.sync_api import sync_playwright
B = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8972/'
LIVE = B.startswith('https://')
fails = []
def check(name, cond, extra=''):
    print(('  OK   ' if cond else '  MAL  ') + name + (('  ' + str(extra)[:160]) if extra != '' else ''))
    if not cond: fails.append(name)
RET = "try{localStorage.setItem('sn.welcomed','1');localStorage.setItem('sn.last',JSON.stringify({lat:40.4168,lon:-3.7038,name:'Madrid'}))}catch(e){}"
with sync_playwright() as p:
    b = p.chromium.launch()
    def ctx(locale='es-ES', tz='Europe/Madrid', w=390, h=844, mob=True, sw='block', geo=True, **kw):
        return b.new_context(viewport={'width': w, 'height': h}, is_mobile=mob, has_touch=mob, locale=locale, timezone_id=tz, service_workers=sw,
                             geolocation={'latitude': 40.4168, 'longitude': -3.7038} if geo else None, permissions=['geolocation'] if geo else [], **kw)
    def page(c, init=None, slow_app=0):
        pg = c.new_page(); pg.errs = []; pg.reqs = []
        pg.on('pageerror', lambda e: pg.errs.append(str(e)[:200]))
        pg.on('console', lambda m: pg.errs.append('CSP ' + m.text[:160]) if 'Content Security Policy' in m.text else None)
        pg.on('request', lambda r: pg.reqs.append(r.url))
        pg.route('**/__sb/**', lambda r: r.fulfill(status=200, body='{}'))   # las pruebas no cuentan como visitas
        pg.held = []
        if slow_app:      # la app no llega hasta que la prueba la suelta (pg.release())
            pg.route('**/a/app-*.js', lambda route: pg.held.append(route))
        pg.release = lambda: [r.continue_() for r in pg.held]
        if init: pg.add_init_script(init)
        return pg
    n = lambda pg, s: len([u for u in pg.reqs if s in u])
    def wait(pg, expr, timeout=20000):
        t0 = time.time()
        while time.time() - t0 < timeout / 1000:
            try:
                if pg.evaluate(expr): return True
            except Exception: pass
            pg.wait_for_timeout(120)
        raise AssertionError('no llego: ' + expr[:80])
    ready = lambda pg: wait(pg, "!!window.__snReady")

    # 1. primera visita, en espanol, con la app tardando 3 s en llegar
    c = ctx(); pg = page(c, slow_app=3)
    pg.goto(B, wait_until='commit')
    pg.wait_for_selector('#mWel.pre', timeout=2500)
    check('bienvenida pintada antes de que llegue la app', pg.evaluate("typeof S==='undefined' && !!document.querySelector('#mWel.pre')"))
    check('bienvenida en espanol desde el HTML', pg.evaluate("document.querySelector('#welH').textContent") == 'Ayuda gratis cerca de ti', pg.evaluate("document.querySelector('#welH').textContent"))
    check('html lang=es antes de la app', pg.evaluate("document.documentElement.lang") == 'es')
    check('botones de idioma ya pintados', pg.evaluate("document.querySelectorAll('#welLangs button').length") == 6)
    check('sin teselas con la bienvenida delante', n(pg, 'arcgisonline') == 0, n(pg, 'arcgisonline'))
    pg.click('#welLoc')
    check('toque antes de tiempo: el boton avisa', pg.evaluate("document.querySelector('#welLoc').classList.contains('busy') && typeof S==='undefined'"))
    pg.release()
    wait(pg, "typeof S!=='undefined' && !!window.__snReady && !document.querySelector('#mWel.on') && !document.querySelector('#mWel.pre')")
    wait(pg, "!!S.me && Math.abs(S.me.lat-40.4168)<0.01", 15000)
    check('el toque guardado pide la ubicacion al arrancar', True)
    pg.wait_for_timeout(2500)
    check('al cerrar la bienvenida llegan teselas', n(pg, 'arcgisonline') > 0, n(pg, 'arcgisonline'))
    check('y pines', pg.evaluate("document.querySelectorAll('.leaflet-marker-icon').length") > 0)
    check('el idioma se pide una sola vez', n(pg, '/l/es.json') == 1, n(pg, '/l/es.json'))
    check('app en espanol y sin clase pre', pg.evaluate("LANG==='es' && !document.documentElement.classList.contains('pre')"))
    check('sin errores JS ni de CSP (1)', not pg.errs, pg.errs[:3])
    c.close()

    # 2. arabe: de derecha a izquierda desde el primer pintado; tema oscuro guardado
    c = ctx(locale='ar-EG', tz='Africa/Cairo'); pg = page(c, init="try{localStorage.setItem('sn.theme','\"dark\"')}catch(e){}", slow_app=2)
    pg.goto(B, wait_until='commit'); pg.wait_for_selector('#mWel.pre', timeout=2500)
    check('arabe: RTL antes de la app', pg.evaluate("document.documentElement.dir==='rtl' && typeof S==='undefined'"))
    check('tema oscuro antes de la app', pg.evaluate("document.documentElement.getAttribute('data-theme')") == 'dark')
    pg.release(); ready(pg); pg.wait_for_timeout(600)
    check('arabe: sigue en RTL y en arabe con la app', pg.evaluate("document.documentElement.dir==='rtl' && LANG==='ar' && !!document.querySelector('#mWel.on')"))
    check('sin errores (2)', not pg.errs, pg.errs[:3]); c.close()

    # 3. ingles: nada que pedir ni que esconder
    c = ctx(locale='en-GB', tz='Europe/London'); pg = page(c)
    pg.goto(B, wait_until='load'); ready(pg)
    check('ingles: no pide fichero de idioma', n(pg, '/l/') == 0, [u for u in pg.reqs if '/l/' in u][:2])
    # una necesidad de la bienvenida
    pg.click('#mWel .wel-needs [data-need="food"]'); pg.wait_for_timeout(1500)
    check('«Eat» en la bienvenida: filtro de comida y bienvenida cerrada', pg.evaluate("S.filters.size===1 && S.filters.has('food') && !document.querySelector('#mWel.on')"))
    check('sin errores (3)', not pg.errs, pg.errs[:3]); c.close()

    # 4. quien vuelve: sin bienvenida, con teselas, y el idioma guardado se aplica en el acto
    c = ctx(); pg = page(c, init=RET)
    pg.goto(B, wait_until='load'); ready(pg); pg.wait_for_timeout(2500)
    check('vuelve: sin bienvenida y con mapa', pg.evaluate("!document.querySelector('#mWel.on,#mWel.pre')") and n(pg, 'arcgisonline') > 0)
    check('vuelve: idioma guardado en el movil', pg.evaluate("!!localStorage.getItem('sn.tr:es:'+LANG_V)"))
    pg.reqs.clear(); pg.reload(wait_until='load'); ready(pg); pg.wait_for_timeout(800)
    check('segunda carga: el idioma no se vuelve a pedir', n(pg, '/l/es.json') == 0)
    check('segunda carga: en espanol', pg.evaluate("LANG==='es' && document.querySelector('#panelTitle').textContent.length>0"))
    # el boton «Llamar» de las tarjetas, entero
    pg.evaluate("S.now=false; buildFilters(); render()"); pg.wait_for_timeout(700)
    cut = pg.evaluate("""()=>[...document.querySelectorAll('#list .card .callbtn')].filter(e=>{const r=e.getBoundingClientRect(),t=e.closest('.tags').getBoundingClientRect();return r.height>0&&r.bottom>t.bottom+1}).length""")
    ncall = pg.evaluate("document.querySelectorAll('#list .card .callbtn').length")
    check('boton «Llamar» sin cortar', cut == 0 and ncall > 0, (cut, ncall))
    # pueblos por letra
    pg.reqs.clear(); pg.click('#q'); pg.keyboard.type('getaf', delay=70); pg.wait_for_timeout(2500)
    check('buscar un pueblo pide solo su letra', n(pg, '/tw/g.json') == 1 and n(pg, 'towns.json') == 0, [u for u in pg.reqs if 'tw/' in u or 'towns' in u])
    check('Getafe sale entre las sugerencias', 'Getafe' in pg.evaluate("document.querySelector('#ac').innerText"))
    check('sin errores (4)', not pg.errs, pg.errs[:3]); c.close()

    # 5. aviso de cookies y medicion
    def track(pg): return {'ga': n(pg, 'googletagmanager.com/gtag'), 'cl': n(pg, 'clarity.ms/tag')}
    c = ctx(); pg = page(c, init=RET)
    pg.goto(B, wait_until='load'); ready(pg)
    pg.mouse.click(200, 300); pg.wait_for_timeout(6500)
    check('Europa sin contestar: ni Analytics ni Clarity', track(pg) == {'ga': 0, 'cl': 0}, track(pg))
    bar = pg.evaluate("(()=>{const b=document.getElementById('sn-ck');return b?Math.round(b.getBoundingClientRect().height):0})()")
    check('aviso de cookies visible y bajo (<=125 px)', 0 < bar <= 125, bar)
    check('aviso: nombra las dos herramientas', 'Clarity' in pg.evaluate("document.getElementById('sn-ck').innerText") and 'Analytics' in pg.evaluate("document.getElementById('sn-ck').innerText"))
    pg.click('#sn-ck button >> nth=0'); pg.wait_for_timeout(2500)
    check('Europa tras «Aceptar»: los dos', track(pg)['ga'] >= 1 and track(pg)['cl'] >= 1, track(pg))
    c.close()
    c = ctx(); pg = page(c, init=RET)
    pg.goto(B, wait_until='load'); ready(pg); pg.wait_for_selector('#sn-ck', timeout=8000)
    pg.click('#sn-ck button >> nth=1'); pg.wait_for_timeout(6500)
    check('Europa tras «Rechazar»: ninguno, y sin cookies', track(pg) == {'ga': 0, 'cl': 0} and not c.cookies(), (track(pg), [k['name'] for k in c.cookies()]))
    c.close()
    c = ctx(locale='en-US', tz='America/New_York'); pg = page(c, init=RET)
    pg.goto(B, wait_until='load'); ready(pg); pg.wait_for_timeout(1200)
    check('fuera de Europa: nada antes del primer toque', track(pg) == {'ga': 0, 'cl': 0}, track(pg))
    pg.mouse.click(200, 300); pg.wait_for_timeout(2500)
    check('fuera de Europa: los dos tras el primer toque, sin aviso', track(pg)['ga'] >= 1 and track(pg)['cl'] >= 1 and not pg.query_selector('#sn-ck'), track(pg))
    c.close()

    # 6. sin red: la portada y su codigo salen del movil
    c = ctx(sw='allow'); pg = page(c, init=RET)
    pg.goto(B, wait_until='load'); ready(pg)
    wait(pg, "navigator.serviceWorker.controller!==null"); pg.wait_for_timeout(3500)
    keys = pg.evaluate("caches.open('sn-v16-app').then(c=>c.keys()).then(k=>k.map(r=>new URL(r.url).pathname))")
    check('guardados la portada y sus dos ficheros', '/' in keys and len([k for k in keys if k.startswith('/a/')]) == 2, [k for k in keys if k == '/' or k.startswith('/a/')])
    check('primera visita: los datos ya cargados quedan guardados', len([k for k in keys if k.startswith('/d/')]) >= 1 and '/l/es.json' in keys, [k for k in keys if not k.startswith('/a/')][:6])
    c.set_offline(True)
    pg.reload(wait_until='domcontentloaded'); ready(pg); pg.wait_for_timeout(1200)
    check('sin red: la app arranca y pinta la lista', pg.evaluate("typeof S!=='undefined' && document.querySelectorAll('#list .card').length") > 0)
    pg.goto(B + '?city=Paris&cc=FR', wait_until='domcontentloaded'); ready(pg)
    check('sin red: un enlace a otra ciudad tambien abre', pg.evaluate("typeof S!=='undefined' && !!document.querySelector('#app')"))
    c.set_offline(False); c.close()
    b.close()
print('\nFALLOS R22:', len(fails), fails)
sys.exit(1 if fails else 0)
