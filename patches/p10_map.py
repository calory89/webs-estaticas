# -*- coding: utf-8 -*-
"""Ronda 18: puntos «en el mar».
CAUSA REAL: `.clus{position:relative}` pisaba el `position:absolute` que Leaflet
necesita en cada icono; los grupos quedaban apilados unos debajo de otros y
cuanto mas abajo en la lista, mas desplazados (cientos de pixeles: al mar).

Causa: si llegaban datos (o se redibujaba la lista) mientras el mapa hacia la
animacion de zoom, Leaflet colocaba los marcadores nuevos con la escala vieja y
se quedaban desplazados cientos de pixeles (agua entre Noruega y Dinamarca).
Arreglo: no se pintan marcadores durante la animacion; se pintan al acabar.
Ademas, el circulo de un grupo se pone en el sitio real mas centrado del grupo,
no en la media: la media de dos orillas puede caer en el agua."""
import io, sys
F='index.template.html'; s=io.open(F,encoding='utf-8').read()
def rep(a,b):
    global s
    if s.count(a)!=1: sys.exit('NO ENCONTRADO: '+a[:90])
    s=s.replace(a,b)
rep("""function renderMarkers(){
  if(!map||!mapReady()) return;
  if(!cluster) cluster = L.layerGroup().addTo(map);""","""function renderMarkers(){
  if(!map||!mapReady()) return;
  // durante la animacion de zoom Leaflet coloca mal lo que se anade: se espera
  if(map._animatingZoom){ if(!renderMarkers._wait){ renderMarkers._wait=1; map.once('zoomend',()=>{ renderMarkers._wait=0; renderMarkers(); }); } return; }
  if(!cluster) cluster = L.layerGroup().addTo(map);""")
rep("""    let la=0,lo=0; g.forEach(p=>{la+=p.lat;lo+=p.lon;});
    const m=L.marker([la/g.length,lo/g.length],{""","""    // el circulo va encima de un sitio real (el mas centrado del grupo)
    let la=0,lo=0; g.forEach(p=>{la+=p.lat;lo+=p.lon;}); la/=g.length; lo/=g.length;
    let ctr=g[0], cd=1e18; for(const p of g){ const d=(p.lat-la)*(p.lat-la)+(p.lon-lo)*(p.lon-lo); if(d<cd){cd=d;ctr=p;} }
    const m=L.marker([ctr.lat,ctr.lon],{""")
rep(".clus{position:relative}", ".clus{position:absolute}")
io.open(F,'w',encoding='utf-8').write(s); print('p10 ok')
