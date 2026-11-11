# -*- coding: utf-8 -*-
"""R22b (11-nov-2026): el arranque ya no bloquea el movil de un tiron.

- init() va por fases y entre fase y fase cede el paso (pintar, atender un toque):
  antes era una sola tarea de ~300 ms en un movil lento.
- Si el idioma de la persona esta a punto de llegar (lo pidio el <head>), se espera
  hasta 600 ms antes de pintar la app: se pinta una vez, en su idioma, en vez de
  dos (ingles y luego el suyo).
- Las medidas de pantalla (hueco del buscador, altura de barras) se hacen juntas en
  el siguiente fotograma, no una por una obligando a recalcular la pagina entera.
- El service worker se registra aunque «load» ya haya pasado.
"""
import io, sys
p = sys.argv[1] + '/index.template.html'
h = io.open(p, encoding='utf-8').read()
assert 'R22b' not in h, 'ya aplicado'


def sub1(old, new):
    global h
    assert h.count(old) == 1, (h.count(old), old[:90])
    h = h.replace(old, new)


sub1("""function fitQ(){
  const q=$('#q'); if(!q) return;""", """// R22b: se mide en el siguiente fotograma (y una sola vez aunque se pida diez)
function fitQ(){ if(fitQ.raf) return; fitQ.raf=requestAnimationFrame(()=>{ fitQ.raf=0; fitQNow(); }); }
function fitQNow(){
  const q=$('#q'); if(!q) return;""")
sub1("""function topStack(){
  try{""", """function topStack(){ if(topStack.raf) return; topStack.raf=requestAnimationFrame(()=>{ topStack.raf=0; topStackNow(); }); }   // R22b
function topStackNow(){
  try{""")
sub1("(function init(){\n  if(store.get('big'))", "(async function init(){\n  // R22b: entre fase y fase se cede el paso, para pintar y atender un toque\n  const pause = ()=>new Promise(r=>setTimeout(r,0));\n  if(store.get('big'))")
sub1("""  primeLang(first0);
  if(first0!=='en' && !T[first0]) S.langHold = first0;
  applyLang(T[first0] ? first0 : 'en');""", """  primeLang(first0);
  if(first0!=='en' && !T[first0]){
    S.langHold = first0;
    // R22b: su idioma lo pidio ya el <head>: casi siempre esta aqui en unos milisegundos
    try{ await Promise.race([ensureLang(first0), new Promise(r=>setTimeout(r,600))]); }catch(e){}
    if(T[first0]) S.langHold = null;
  }
  applyLang(T[first0] ? first0 : 'en');""")
sub1("""  if('serviceWorker' in navigator && window.isSecureContext){
    window.addEventListener('load',()=>{
      navigator.serviceWorker.register('sw.js').then(reg=>{""", """  if('serviceWorker' in navigator && window.isSecureContext){
    const swGo = ()=>{
      navigator.serviceWorker.register('sw.js').then(reg=>{""")
sub1("""        if(reg && reg.active) setTimeout(ready, 3000);
      }).catch(()=>{});
    });
  }""", """        if(reg && reg.active) setTimeout(ready, 3000);
      }).catch(()=>{});
    };
    // R22b: init() ahora cede el paso; «load» puede haber pasado ya
    if(document.readyState==='complete') setTimeout(swGo,0); else window.addEventListener('load',swGo);
  }""")
sub1("""  try{ if(!sessionStorage.getItem('sn_v')){ sessionStorage.setItem('sn_v','1'); tally('view', (window.innerWidth<=640?'mobile':'desktop')+(isStandalone()?'/app':'')); S.tallyLang=1; } }catch(e){}
  initMap();""", """  try{ if(!sessionStorage.getItem('sn_v')){ sessionStorage.setItem('sn_v','1'); tally('view', (window.innerWidth<=640?'mobile':'desktop')+(isStandalone()?'/app':'')); S.tallyLang=1; } }catch(e){}
  await pause();
  initMap();""")
sub1("""  if(!S.country) detectCountry(start.lat,start.lon);
  sortPlaces();
  if(map){ map.setView([start.lat,start.lon],(last&&last.lat)?13:11); renderMe(); }
  render();""", """  if(!S.country) detectCountry(start.lat,start.lon);
  await pause();
  sortPlaces();
  if(map){ map.setView([start.lat,start.lon],(last&&last.lat)?13:11); renderMe(); }
  render();
  await pause();""")
# la visita se cuenta antes del idioma, y el ingles «de espera» no se cuenta como idioma
line = """  try{ if(!sessionStorage.getItem('sn_v')){ sessionStorage.setItem('sn_v','1'); tally('view', (window.innerWidth<=640?'mobile':'desktop')+(isStandalone()?'/app':'')); S.tallyLang=1; } }catch(e){}\n"""
sub1(line + "  await pause();\n  initMap();", "  await pause();\n  initMap();")
sub1("  const want0 = store.get('langManual') ? (store.get('lang')||'en') : browserLang();\n",
     "  // R22b: la visita se cuenta antes de aplicar el idioma (ahora se aplica una sola vez, el de verdad)\n" + line + "  const want0 = store.get('langManual') ? (store.get('lang')||'en') : browserLang();\n")
sub1("  if(S.tallyLang && T[code]){ S.tallyLang=0;", "  if(S.tallyLang && T[code] && !(S.langHold && code==='en')){ S.tallyLang=0;")
io.open(p, 'w', encoding='utf-8').write(h)
print('ok')
