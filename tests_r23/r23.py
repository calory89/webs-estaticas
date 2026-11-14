# -*- coding: utf-8 -*-
"""Pruebas de la R23: teselas solo de la vista buena, horarios con comentario, sitios cerrados, correo de
contacto, contraste en oscuro, cabecera/pie fuera de la zona principal, titulo en /t/.
    python3 r23.py http://127.0.0.1:8993/   (o https://supportnear.com/)"""
import sys, re, json, time
from playwright.sync_api import sync_playwright
B = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8993/'
B = B.rstrip('/') + '/'
AXE = open('/home/claude/sn/axe/node_modules/axe-core/axe.min.js').read()
fails = []
def check(name, cond, extra=''):
    print(('  OK   ' if cond else '  MAL  ') + name + (('  ' + str(extra)[:180]) if extra != '' else ''))
    if not cond: fails.append(name)
def where(u):
    m = re.search(r'tile/(\d+)/(\d+)/(\d+)', u)
    if not m: return None
    z, y, x = map(int, m.groups()); return z, x / 2**z * 360 - 180, 180/3.14159*__import__('math').atan(__import__('math').sinh(3.14159*(1-2*y/2**z)))
with sync_playwright() as p:
    b = p.chromium.launch()
    def run(url, w=1280, h=800, tz='America/New_York', loc='en-US', init=None, mob=False, wait=5000):
        c = b.new_context(viewport={'width': w, 'height': h}, is_mobile=mob, has_touch=mob, locale=loc, timezone_id=tz, service_workers='block')
        c.route('**/__sb/**', lambda r: r.fulfill(status=204, body=''))
        c.route(re.compile(r'googletagmanager|google-analytics|clarity\.ms'), lambda r: r.abort())
        pg = c.new_page(); tiles = []; errs = []
        pg.on('request', lambda r: tiles.append(where(r.url)) if ('arcgisonline' in r.url or 'tile.openstreetmap' in r.url) else None)
        pg.on('pageerror', lambda e: errs.append(str(e)[:120]))
        if init: pg.add_init_script(init)
        pg.goto(url, wait_until='load'); pg.wait_for_timeout(wait)
        return c, pg, [t for t in tiles if t], errs
    near = lambda ts, lon, lat, tol=1.5: [t for t in ts if abs(t[1] - lon) < tol and abs(t[2] - lat) < tol]
    # 1. portada de escritorio, primera visita
    c, pg, ts, errs = run(B)
    check('escritorio: ninguna tesela del mundo entero (zoom < 6)', not [t for t in ts if t[0] < 6], len([t for t in ts if t[0] < 6]))
    check('escritorio: si llegan teselas de la ciudad adivinada', len(near(ts, -74.0, 40.7)) >= 4, len(ts))
    check('escritorio: sin errores JS', not errs, errs); c.close()
    # 2. mapa incrustado de Sevilla visto desde Nueva York
    c, pg, ts, errs = run(B + '?embed=1&city=Sevilla')
    check('incrustado Sevilla: ninguna tesela de Nueva York', not near(ts, -74.0, 40.7, 5), len(near(ts, -74.0, 40.7, 5)))
    check('incrustado Sevilla: ninguna del mundo entero', not [t for t in ts if t[0] < 6])
    check('incrustado Sevilla: llegan las de Sevilla', len(near(ts, -5.98, 37.39)) >= 4, len(ts))
    check('incrustado Sevilla: centrado en Sevilla', pg.evaluate("(()=>{const c=map.getCenter(); return Math.abs(c.lat-37.39)<0.2 && Math.abs(c.lng+5.98)<0.2})()"))
    check('incrustado: sin errores JS', not errs, errs); c.close()
    # 3. enlace de ciudad desde una pagina de ciudad (?city=&cc=&ll=)
    c, pg, ts, errs = run(B + '?city=London&cc=GB&ll=51.507,-0.128', tz='Europe/Madrid', loc='es-ES')
    check('?city=London: ninguna tesela de Madrid', not near(ts, -3.7, 40.4, 3))
    check('?city=London: llegan las de Londres', len(near(ts, -0.13, 51.5)) >= 4, len(ts)); c.close()
    # 4. enlace a un sitio compartido (#p=...@lat,lon)
    c, pg, ts, errs = run(B + '#p=node/1@48.8566,2.3522', tz='America/New_York')
    check('#p= en Paris: ninguna de Nueva York', not near(ts, -74.0, 40.7, 5))
    check('#p= en Paris: llegan las de Paris', len(near(ts, 2.35, 48.86)) >= 4, len(ts)); c.close()
    # 5. movil que vuelve (sin bienvenida): nada del mundo entero
    c, pg, ts, errs = run(B, w=390, h=844, mob=True, tz='Europe/Madrid', loc='es-ES',
                          init="try{localStorage.setItem('sn.welcomed','1');localStorage.setItem('sn.last',JSON.stringify({lat:41.3874,lon:2.1686,name:'Barcelona'}))}catch(e){}")
    check('movil que vuelve: ninguna del mundo entero', not [t for t in ts if t[0] < 6])
    check('movil que vuelve: llegan las de su ultima ciudad', len(near(ts, 2.17, 41.39)) >= 3, len(ts))
    # modo ligero y vuelta: las teselas se quitan y vuelven
    pg.evaluate("setLite(true,true)"); pg.wait_for_timeout(300); n1 = pg.evaluate("map.hasLayer(layer)")
    pg.evaluate("setLite(false,true)"); pg.wait_for_timeout(300); n2 = pg.evaluate("map.hasLayer(layer)")
    check('modo ligero quita y devuelve el mapa', (not n1) and n2, (n1, n2))
    # 6. horarios en texto
    H = pg.evaluate("""() => { const o={}; for (const s of ['off "Not open to the public"','Mo-Fr 09:00-11:30; PH off || "Sur rendez-vous"','We-Sa 22:00-16:00 open "offseason hours"','Mo-Fr 07:00-18:00 open','Mo-Fr 09:00-17:00','24/7','closed']) o[s]=ohHuman(s); return o; }""")
    print('     ', json.dumps(H, ensure_ascii=False)[:400])
    check('comentario del sitio tal cual', '(Not open to the public)' in H['off "Not open to the public"'] and 'now' not in H['off "Not open to the public"'].lower().replace('not', ''), H['off "Not open to the public"'])
    check('guion del comentario intacto', '(Sur rendez-vous)' in H['Mo-Fr 09:00-11:30; PH off || "Sur rendez-vous"'])
    check('«open» de OSM no dice «abierto ahora»', 'ahora' not in H['Mo-Fr 07:00-18:00 open'] and 'ahora' not in H['We-Sa 22:00-16:00 open "offseason hours"'], H['Mo-Fr 07:00-18:00 open'])
    check('horario normal igual que antes', H['Mo-Fr 09:00-17:00'].replace(' ', '') in ('lun–vie09:00–17:00', 'lun.–vie.09:00–17:00'), H['Mo-Fr 09:00-17:00'])
    S = pg.evaluate("[shutForGood('closed'), shutForGood('off \"Not open to the public\"'), shutForGood('closed \"acceso restringido a socios\"'), shutForGood('Mo-Fr 09:00-12:00; Sa off'), shutForGood('off; Mo 10:00-12:00'), shutForGood(''), shutForGood('24/7')]")
    check('cerrados del todo fuera, el resto dentro', S == [True, True, True, False, False, False, False], S)
    faq = pg.evaluate("t('faq.a6')")
    check('preguntas frecuentes: correo hello@', 'hello@supportnear.com' in faq and 'partners@' not in faq, faq[:120])
    c.close()
    # 7. paginas sueltas: oscuro, zonas, titulo
    c = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, color_scheme='dark', service_workers='block', bypass_csp=True)
    c.route('**/__sb/**', lambda r: r.abort()); c.route(re.compile(r'googletagmanager|google-analytics|clarity\.ms|arcgisonline'), lambda r: r.abort())
    for path in ('c/madrid', 'c/madrid-food', 'c/', 't/', 'about', 'prensa', 'incrustar', 'instalar', 'cambios', 'huecos'):
        pg = c.new_page(); pg.goto(B + path, wait_until='load'); pg.add_script_tag(content=AXE)
        v = pg.evaluate("async () => (await axe.run(document, {runOnly:{type:'tag', values:['wcag2a','wcag2aa','wcag21aa','best-practice']}})).violations.map(v => v.id+':'+v.nodes.length)")
        st = pg.evaluate("(()=>{const m=document.querySelector('main,[role=main]'); const f=document.querySelector('footer'), h=document.querySelector('header'); return {main:!!m, footerIn: !!(f && m && m.contains(f)), headerIn: !!(h && m && m.contains(h)), h1: document.querySelectorAll('h1').length, sameParent: !!(m && f && m.tagName==='MAIN' ? m.parentElement===f.parentElement : true)}})()")
        check('oscuro %s: sin fallos de accesibilidad' % path, not v, v)
        check('%s: zona principal sin cabecera ni pie dentro, un h1' % path, st['main'] and not st['footerIn'] and not st['headerIn'] and st['h1'] == 1 and st['sameParent'], st)
        pg.close()
    c.close()
    b.close()
print('\nFALLOS:', len(fails), fails)
