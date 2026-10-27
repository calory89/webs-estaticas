import sys
from playwright.sync_api import sync_playwright
B=sys.argv[1]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1300,'height':900}); pg.route('**/__sb/**',lambda r:r.abort())
    pg.goto(B); pg.wait_for_timeout(2000); pg.evaluate("closeWelcome()")
    pg.evaluate("S.gps=true; setCenter(57.03,9.2); map.setView([57.03,9.2],12)"); pg.wait_for_timeout(3000)
    pg.evaluate("(async()=>{await ensureChunks(58.1,7.5,250); await ensureChunks(56.5,9,250);})()"); pg.wait_for_timeout(4000)
    # zoom out animado y render a mitad de animacion (como cuando llegan datos)
    pg.evaluate("map.setZoom(7,{animate:true}); setTimeout(()=>render(),60); setTimeout(()=>render(),150)"); pg.wait_for_timeout(2500)
    r=pg.evaluate("""(()=>{const out=[];const mc=map.getContainer().getBoundingClientRect();
      cluster.eachLayer(m=>{const el=m.getElement(); if(!el) return; const r=el.getBoundingClientRect();
        const cp=[r.x+r.width/2-mc.x, r.y+r.height/2-mc.y]; const real=map.latLngToContainerPoint(m.getLatLng());
        out.push(Math.round(Math.hypot(cp[0]-real.x,cp[1]-real.y)));});
      return {n:out.length,maxOff:Math.max(...out),off:out.filter(x=>x>30).length}})()""")
    print('desfase de iconos (px):', r)
    pg.screenshot(path='/home/claude/sn/sea2.png')
