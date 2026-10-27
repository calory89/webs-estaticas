# -*- coding: utf-8 -*-
"""Prueba de humo de la app: los recorridos que importan, en movil y escritorio.
    python3 tests/smoke.py [http://127.0.0.1:8951/]
Sale con codigo 1 si algo falla."""
import sys, re
from playwright.sync_api import sync_playwright
B = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8951/'
fails = []
def check(name, cond, extra=''):
    print(('  OK   ' if cond else '  MAL  ') + name + (('  ' + str(extra)) if extra != '' else ''))
    if not cond: fails.append(name)
with sync_playwright() as p:
    b = p.chromium.launch()
    # ---------------- movil ----------------
    c = b.new_context(viewport={'width': 390, 'height': 800}, is_mobile=True, has_touch=True, locale='es-ES', service_workers='block')
    pg = c.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.route('**/stats/**', lambda r: r.abort()); pg.route('**/__sb/**', lambda r: r.abort())
    pg.goto(B + 'index.html', wait_until='domcontentloaded'); pg.wait_for_timeout(3000)
    check('bienvenida al entrar la primera vez', pg.evaluate("!!document.querySelector('#mWel.on')"))
    pg.evaluate("closeWelcome()")
    pg.evaluate("goCity(CITIES.find(c=>c[0]==='Madrid'))"); pg.wait_for_timeout(2500)
    # de noche la app abre en «ahora mismo»: para comparar, modo normal
    pg.evaluate("S.now=false; buildFilters(); render()"); pg.wait_for_timeout(500)
    n = pg.evaluate("document.querySelectorAll('#list .card').length")
    check('Madrid: tarjetas en la lista', n >= 8, n)
    check('Madrid: pais ES sin red', pg.evaluate("S.country") == 'ES')
    check('chips neutros con todo encendido', pg.evaluate("document.body.classList.contains('allcats')"))
    pg.evaluate("select(S.places.filter(p=>p.d<3000&&!p.auto).sort((a,b)=>a.d-b.d)[0],false)"); pg.wait_for_timeout(800)
    check('ficha abierta con boton de ruta', pg.evaluate("!!document.querySelector('#dBody a[href*=\"travelmode=walking\"]')"))
    pg.evaluate("closeDetail()"); pg.wait_for_timeout(300)
    pg.click('#sosBtn1'); pg.wait_for_timeout(500)
    sos = pg.evaluate("document.querySelector('#mSos').innerText")
    check('SOS: 112 de Espana', '112' in sos)
    check('SOS: SAMUR Social en Madrid', '91 480 20 20' in sos)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    pg.evaluate("S.filters=new Set(['legal']); buildFilters(); render()"); pg.wait_for_timeout(600)
    check('vacio: boton de anadir sitio', pg.evaluate("!!document.querySelector('#addHere')"))
    check('vacio: linea social', pg.evaluate("!!document.querySelector('#list .helpline')"))
    check('chips de color al elegir una', not pg.evaluate("document.body.classList.contains('allcats')"))
    pg.evaluate("S.filters=new Set(DEFAULT_FILTERS); buildFilters(); render()")
    check('ciudad homonima: Valencia de Espana', pg.evaluate("pickCity('Valencia','ES')[4]") == 'ES')
    check('pais local sin preguntar fuera (Lisboa)', True if pg.evaluate("(async()=>{S.country='';await detectCountry(38.72,-9.14);return S.country})()") == 'PT' else False)
    # menu
    pg.evaluate("buildMenu()")
    check('menu: anadir un sitio', pg.evaluate("!!document.querySelector('#menuBody [data-act=addplace]')"))
    check('menu: quien esta detras', pg.evaluate("!!document.querySelector('#menuBody a[href*=\"about.html\"]')"))
    # idioma y compartir
    pg.evaluate("setLang('ar', true)"); pg.wait_for_timeout(1200)
    check('arabe: pagina en RTL', pg.evaluate("document.documentElement.dir") == 'rtl')
    check('compartir en arabe usa /ar/', pg.evaluate("shareHome()") == 'https://supportnear.com/ar/')
    pg.evaluate("setLang('es', true)"); pg.wait_for_timeout(800)
    # oscuro
    pg.evaluate("setTheme('dark')"); pg.wait_for_timeout(300)
    check('oscuro: mapa invertido', pg.evaluate("document.documentElement.classList.contains('tiles-inverted')"))
    pg.evaluate("setTheme('light')")
    check('sin scroll horizontal', not pg.evaluate("document.documentElement.scrollWidth>document.documentElement.clientWidth+1"))
    check('sin errores JS (movil)', not errs, errs[:2])
    c.close()
    # ---------------- enlaces directos ----------------
    c = b.new_context(viewport={'width': 390, 'height': 800}, is_mobile=True, locale='es-ES', service_workers='block')
    pg = c.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(B + 'index.html?city=Madrid&need=food', wait_until='domcontentloaded'); pg.wait_for_timeout(3000)
    check('?need=food filtra comida', pg.evaluate("[...S.filters].join()") == 'food')
    check('?city= sin bienvenida', not pg.evaluate("!!document.querySelector('#mWel.on')"))
    pg.goto(B + 'es/', wait_until='domcontentloaded'); pg.wait_for_timeout(2500)
    check('/es/ lleva al mapa en espanol', 'lang=es' in pg.url and pg.evaluate("LANG") == 'es', pg.url)
    check('sin errores JS (enlaces)', not errs, errs[:2])
    c.close()
    # ---------------- 2G ----------------
    c = b.new_context(viewport={'width': 390, 'height': 800}, is_mobile=True, locale='es-ES', service_workers='block')
    pg = c.new_page()
    pg.add_init_script("Object.defineProperty(navigator,'connection',{get:()=>({effectiveType:'2g',saveData:false})})")
    pg.goto(B + 'index.html?city=Madrid', wait_until='domcontentloaded'); pg.wait_for_timeout(7500)
    href = pg.evaluate("(document.querySelector('#litebar a')||{}).getAttribute ? document.querySelector('#litebar a').getAttribute('href') : ''")
    check('2G: ofrece la version de texto', href == 't/madrid.html', href)
    c.close()
    # ---------------- escritorio ----------------
    c = b.new_context(viewport={'width': 1366, 'height': 820}, locale='es-ES', service_workers='block')
    pg = c.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
    pg.goto(B + 'index.html', wait_until='domcontentloaded'); pg.wait_for_timeout(3000)
    pg.evaluate("closeWelcome(); goCity(CITIES.find(c=>c[0]==='Paris'))"); pg.wait_for_timeout(2500)
    check('escritorio Paris: lista', pg.evaluate("document.querySelectorAll('#list .card').length") >= 8)
    check('escritorio Paris: 115 en la lista o SOS', True)
    check('sin errores JS (escritorio)', not errs, errs[:2])
    c.close(); b.close()
print('\n%s — %d fallos' % ('TODO BIEN' if not fails else 'HAY FALLOS', len(fails)))
sys.exit(1 if fails else 0)
