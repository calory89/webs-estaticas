# Una foto de verdad del producto: el mapa vivo con sus pines, sin la interfaz.
from playwright.sync_api import sync_playwright
import sys
city, lat, lon, z, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
with sync_playwright() as p:
    b = p.chromium.launch()
    c = b.new_context(viewport={'width': 1200, 'height': 630}, device_scale_factor=2, locale='en-GB', color_scheme='light')
    pg = c.new_page()
    import os
    pg.goto(os.environ.get('SN_BASE', 'https://supportnear.com/') + '?city=' + city, wait_until='domcontentloaded')
    pg.wait_for_timeout(5000)
    pg.evaluate("""()=>{ try{closeWelcome()}catch(e){}
      // el mapa pasa a ser lo unico que hay en la pagina: todo lo demas fuera
      const m=document.getElementById('map');
      document.body.appendChild(m);
      [...document.body.children].forEach(e=>{ if(e!==m && e.tagName!=='SCRIPT') e.style.setProperty('display','none','important'); });
      const st=document.createElement('style');
      st.textContent=`#map{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:1!important}
        .leaflet-control-container{display:none!important} body{overflow:hidden!important;margin:0!important}`;
      document.head.appendChild(st);
      if(window.map) map.invalidateSize(); }""")
    pg.wait_for_timeout(600)
    pg.evaluate("map.setView([%f,%f],%d,{animate:false})" % (lat, lon, z))
    pg.wait_for_timeout(6000)
    pg.screenshot(path=out, type='png')
    # que tapa la vista, por si queda algo de interfaz
    vis = pg.evaluate("""[...document.body.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);
      return r.width>200&&r.height>40&&s.position==='fixed'&&s.display!=='none'&&s.visibility!=='hidden'&&!e.closest('#map')&&e.id!=='map'}).map(e=>(e.id||e.className||e.tagName)+'').slice(0,8)""")
    print('fixed visibles:', vis, '| pines:', pg.evaluate("document.querySelectorAll('.pin,.clus').length"))
    b.close()
