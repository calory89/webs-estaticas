import sys
from playwright.sync_api import sync_playwright
B=sys.argv[1]
with sync_playwright() as p:
    b=p.chromium.launch(); out=[]
    for vp in [(390,844,True),(1366,860,False)]:
        c=b.new_context(viewport={'width':vp[0],'height':vp[1]},is_mobile=vp[2],has_touch=vp[2],locale='es-ES',service_workers='block',geolocation={'latitude':40.4168,'longitude':-3.7038},permissions=['geolocation'])
        c.add_init_script("window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.violatedDirective+' '+e.blockedURI))")
        pg=c.new_page(); pg.on('console',lambda m: out.append(m.text[:160]) if 'Content Security Policy' in m.text else None)
        pg.goto(B+'index.html'); pg.wait_for_timeout(2500)
        pg.evaluate("closeWelcome()"); pg.evaluate("goCity(CITIES.find(c=>c[0]==='Madrid'))"); pg.wait_for_timeout(2000)
        pg.evaluate("S.now=false;render()"); pg.evaluate("select(S.places.filter(p=>p.d<3000&&!p.auto).sort((a,b)=>a.d-b.d)[0],false)"); pg.wait_for_timeout(800)
        pg.evaluate("try{openPocket()}catch(e){}"); pg.wait_for_timeout(800)
        pg.evaluate("try{closeModals();openSheet()}catch(e){}"); pg.wait_for_timeout(500)
        pg.evaluate("try{closeModals();buildMenu()}catch(e){}"); pg.wait_for_timeout(300)
        pg.evaluate("geolocate(true)"); pg.wait_for_timeout(3500)
        pg.evaluate("setLang('ar',true)"); pg.wait_for_timeout(1500)
        out += pg.evaluate("window.__csp")
        c.close()
    print('CSP violations:', sorted(set(out)))
