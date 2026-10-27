import sys, json, re, os
from playwright.sync_api import sync_playwright
B=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8899/'
S=__import__('os').environ.get('AXE_DIR','.')  # carpeta con node_modules/axe-core
AXE=open(S+'/node_modules/axe-core/axe.min.js').read()
fails=[]; 
def ok(c,m,extra=''):
    print(('  OK  ' if c else '  FAIL ')+m, extra if not c else '', flush=True)
    if not c: fails.append(m)
def ctx_(p,lang='es-ES',tz='Europe/Madrid',vp=(390,844),geo=None,mobile=True):
    b=p.chromium.launch()
    c=b.new_context(viewport={'width':vp[0],'height':vp[1]},is_mobile=mobile,has_touch=mobile,locale=lang,timezone_id=tz,
        geolocation=geo,permissions=['geolocation'] if geo else [],accept_downloads=True)
    return b,c
def page(c,url):
    pg=c.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
    pg.goto(url,wait_until='networkidle',timeout=90000); pg.wait_for_timeout(1500)
    return pg,errs
with sync_playwright() as p:
    # 1-3 bienvenida, ciudad adivinada, filtros
    b,c=ctx_(p)
    pg,errs=page(c,B)
    ok(pg.evaluate("document.querySelector('#mWel details.wel-more') && !document.querySelector('#mWel details.wel-more').open"),'bienvenida: extra plegado')
    ok(pg.evaluate("!!document.querySelector('#mWel .wel-langs button')"),'bienvenida: idiomas visibles')
    first=pg.evaluate("[...document.querySelectorAll('#mWel .wel-cities a')].slice(0,3).map(a=>a.textContent)")
    ok(len(first)>0 and first[0] in ('Madrid','Barcelona','Valencia','Sevilla','Zaragoza'),'bienvenida: ciudades de España primero',first)
    pg.locator('#mWel .modal-x').click(); pg.wait_for_timeout(2500)
    st=pg.evaluate("[document.querySelectorAll('#list .card').length, !!document.querySelector('.tip--guess'), document.getElementById('panelSub').innerText]")
    ok(st[0]>0 and st[1],'tras cerrar: Madrid con tarjetas y aviso «¿no es aquí?»',st)
    ok('·' in st[2] and 'Mostrando' not in st[2],'cabecera corta',st[2])
    # filtros recordados
    pg.evaluate("S.filters=new Set(['food']); buildFilters(); render();"); pg.wait_for_timeout(300)
    pg.reload(wait_until='networkidle'); pg.wait_for_timeout(1500)
    ok(pg.evaluate("[...S.filters].join()")=='food','filtros recordados tras recargar',pg.evaluate("[...S.filters].join()"))
    pg.evaluate("S.filters=new Set(DEFAULT_FILTERS); buildFilters(); render();")
    # menu
    pg.click('#menuBtn'); pg.wait_for_timeout(500)
    ks=pg.evaluate("[...document.querySelectorAll('#menuBody .menu-k')].map(e=>e.innerText)")
    ok(len(ks)==4,'menú en 4 grupos',ks)
    pg.locator('#menuBody [data-act="calm"]').click(); pg.wait_for_timeout(300)
    ok(pg.evaluate("document.documentElement.classList.contains('calm')"),'menos movimiento')
    pg.click('#menuBtn'); pg.wait_for_timeout(400); pg.locator('#menuBody [data-act="calm"]').click(); pg.wait_for_timeout(200)
    # bolsillo
    pg.click('#menuBtn'); pg.wait_for_timeout(400); pg.locator('#menuBody [data-act="pocket"]').click(); pg.wait_for_timeout(500)
    ok(pg.evaluate("document.querySelectorAll('#sheet .pk').length")==8,'tarjetas de bolsillo x8')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    # datos
    pg.click('#menuBtn'); pg.wait_for_timeout(400); pg.locator('#menuBody [data-act="data"]').click(); pg.wait_for_timeout(400)
    with pg.expect_download() as dl: pg.click('#dCsv')
    d=dl.value; path=d.path(); txt=open(path,encoding='utf-8-sig').read()
    ok(txt.startswith('name,type') and txt.count('\n')>20,'exportar CSV',txt[:80])
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    # ficha: nota, imagen, deshacer
    pg.locator('#list .card .card-t').first.click(); pg.wait_for_timeout(1500)
    ok(pg.evaluate("!!document.getElementById('shareImg')"),'botón compartir como imagen')
    with pg.expect_download(timeout=20000) as dl: pg.click('#shareImg')
    ok(dl.value.suggested_filename.endswith('.png'),'imagen del sitio generada',dl.value.suggested_filename)
    pg.evaluate("document.querySelector('.mynote').open=true")
    pg.fill('#myNote','preguntar por Ana'); pg.wait_for_timeout(700)
    pid=pg.evaluate("S.sel")
    ok(pg.evaluate("store.get('note:'+S.sel)")=='preguntar por Ana','nota privada guardada')
    pg.click('#favBtn'); pg.wait_for_timeout(300); pg.click('#favBtn'); pg.wait_for_timeout(300)
    ok(pg.evaluate("!!document.querySelector('#toast .toast-act')"),'deshacer al quitar de mis sitios')
    pg.click('#toast .toast-act'); pg.wait_for_timeout(300)
    ok(pg.evaluate("isFav(S.sel)"),'deshacer vuelve a guardarlo')
    pg.evaluate("toggleFav(S.selPlace)")
    # festivos
    r=pg.evaluate("""(()=>{ HOL={ES:'2026:1225,0101|2027:0101'}; const RD=Date; const fake=new RD('2026-12-25T11:00:00'); 
       window.Date=class extends RD{constructor(...a){ if(a.length) super(...a); else super(fake.getTime()); } static now(){return fake.getTime();}};
       S.country='ES'; OH_MEM_CLEAR(); const a=ohStatus('Mo-Su 09:00-18:00; PH off'), b=ohStatus('Mo-Fr 09:00-17:00'), c2=ohStatus('Mo-Su 09:00-18:00; PH 10:00-12:00');
       window.Date=RD; return [a.s,b.s,!!b.hol,c2.s]; })()""")
    ok(r[0]=='closed' and r[2] and r[3]=='open','festivos: PH off cerrado, aviso si no dice nada, PH con horario',r)
    ok(not errs,'sin errores JS (es)',errs[:3])
    c.close(); b.close()
    # brujula + otra app (con GPS)
    b,c=ctx_(p,geo={'latitude':40.4168,'longitude':-3.7038})
    pg,errs=page(c,B+'?city=Madrid')
    pg.evaluate("geolocate(true)"); pg.wait_for_timeout(3000)
    pg.locator('#list .card .card-t').first.click(); pg.wait_for_timeout(1500)
    ok(pg.evaluate("!!document.getElementById('cmpBtn')"),'brújula disponible con GPS')
    pg.click('#cmpBtn'); pg.wait_for_timeout(500)
    ok(pg.evaluate("!document.getElementById('cmpBox').hidden && document.getElementById('cmpD').innerText.length>0"),'brújula muestra distancia',pg.evaluate("document.getElementById('cmpD').innerText"))
    ok(not errs,'sin errores JS (gps)',errs[:3]); c.close(); b.close()
    # quiosco
    b,c=ctx_(p,vp=(1280,900),mobile=False)
    pg,errs=page(c,B+'?kiosk=1&city=Madrid')
    ok(pg.evaluate("!document.getElementById('mWel').classList.contains('on') && document.documentElement.classList.contains('kiosk')"),'quiosco: sin bienvenida y modo quiosco')
    ok(pg.evaluate("toggleFav(S.places[0])===false && favs().length===0"),'quiosco: no guarda favoritos')
    ok(not errs,'sin errores JS (quiosco)',errs[:3]); c.close(); b.close()
    # idiomas nuevos
    for lang,rtl in [('ti',False),('ps',True),('so',False),('am',False),('tr',False),('bn',False),('zh',False),('fa',True)]:
        b,c=ctx_(p,lang=lang,tz='UTC')
        pg,errs=page(c,B+'?lang='+lang+'&city=Madrid')
        pg.evaluate("closeWelcome()"); pg.wait_for_timeout(800)
        txt=pg.evaluate("document.body.innerText")
        keys=sorted(set(re.findall(r'\b(?:ui|wel|menu|cat|plan|who|fav|grp|now|share)\.[a-z0-9.#]+\b',txt)))
        info=pg.evaluate("[document.documentElement.lang, document.documentElement.dir, document.getElementById('panelTitle').innerText, document.querySelectorAll('#list .card').length]")
        ok(info[0]==lang and (info[1]=='rtl')==rtl and info[3]>0 and not keys,'idioma '+lang+' '+str(info[2]),[info,keys[:5]])
        if lang=='fa': ok(re.search('[۰-۹]',pg.evaluate("document.getElementById('list').innerText")) is not None,'persa: cifras persas por defecto')
        if lang=='ps':
            pg.locator('#list .card .card-t').first.click(); pg.wait_for_timeout(1200)
            ok(pg.evaluate("getComputedStyle(document.getElementById('detail')).transform")=='none','pastún: ficha visible (RTL)')
            res=pg.evaluate(AXE+";axe.run(document,{runOnly:['wcag2a','wcag2aa']}).then(r=>r.violations.filter(v=>v.impact=='serious'||v.impact=='critical').map(v=>v.id+':'+v.nodes.length))")
            ok(not res,'axe sin fallos graves (pastún, ficha)',res)
        ok(not errs,'sin errores JS ('+lang+')',errs[:3]); c.close(); b.close()
print('\nFALLOS:',len(fails),fails)
