import sys
from playwright.sync_api import sync_playwright
B=sys.argv[1]; bad=0
PAGES=['about','c/madrid','c/madrid-food','c/madrid.en','c/','t/madrid','es/','ar/','prensa','incrustar','instalar','cambios','huecos','impacto','actualizar','no-existe-404','c/paris','zh/']
with sync_playwright() as p:
    b=p.chromium.launch()
    for tz,loc in (('Europe/Madrid','es-ES'),('America/New_York','en-US')):
        c=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,locale=loc,timezone_id=tz,service_workers='block')
        for pgn in PAGES:
            pg=c.new_page(); errs=[]; reqs=[]
            pg.on('pageerror',lambda e: errs.append(str(e)[:120])); pg.on('console',lambda m: errs.append(m.text[:140]) if m.type=='error' and '__sb' not in m.text and '404' not in m.text and '501' not in m.text else None)
            pg.on('request',lambda r: reqs.append(r.url))
            pg.route('**/__sb/**',lambda r:r.fulfill(status=200,body='{}'))
            pg.goto(B+pgn,wait_until='load'); pg.wait_for_timeout(1900)
            info=pg.evaluate("()=>({main:!!document.querySelector('main,[role=main]'),ck:!!document.getElementById('sn-ck'),ckh:document.getElementById('sn-ck')?Math.round(document.getElementById('sn-ck').getBoundingClientRect().height):0,ckt:(document.getElementById('sn-ck')||{}).innerText||'',lang:document.documentElement.lang,ov:document.documentElement.scrollWidth>innerWidth+1,url:location.pathname+location.search})")
            pg.mouse.click(5,5); pg.wait_for_timeout(1500)
            ga=len([u for u in reqs if 'gtag/js' in u]); cl=len([u for u in reqs if 'clarity.ms/tag' in u])
            eu=tz.startswith('Europe')
            redirected = info['url'].rstrip('/')!=('/'+pgn).rstrip('/')
            ok = (redirected or info['main']) and not errs and not info['ov'] and ((ga==0 and cl==0 and (redirected or info['ck'])) if eu else (ga==1 and cl==1 and not info['ck']))
            if not ok: bad+=1
            print(('OK  ' if ok else 'MAL ')+tz[:6]+' '+pgn.ljust(16), 'main' if info['main'] else 'NOMAIN', 'ga%d cl%d'%(ga,cl), 'ck%d'%info['ckh'], info['lang'], ('-> '+info['url']) if redirected else '', errs[:2], info['ckt'][:40].replace('\n',' ') if eu and pgn in ('ar/','zh/','c/paris','about') else '')
            pg.close()
        c.close()
    b.close()
print('MAL:',bad)
