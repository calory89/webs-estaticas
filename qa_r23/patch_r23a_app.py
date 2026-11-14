# -*- coding: utf-8 -*-
"""Ronda 23 (14-nov-2026): fallos de la app.
 1. Teselas: no se piden hasta saber que zona se va a ensenar (antes: 16 del mundo entero a zoom 2 y, con
    ?city= o #p=, 16 mas de la ciudad adivinada por la zona horaria; luego se cancelaban).
 2. Horarios: el texto entre comillas que pone el sitio se ensena tal cual (antes «open» pasaba a «open now»
    y los guiones a guion largo); la palabra suelta «open» de OSM no se traduce por «Abierto ahora».
 3. Sitios con horario «closed»/«off» sin ninguna hora (cerrados o no abiertos al publico): no se ensenan.
 4. Correo de contacto: partners@ no existe (rebota); se usa hello@.
    python3 patch_r23a_app.py index.template.html"""
import io, sys
F = sys.argv[1]
s = io.open(F, encoding='utf-8').read()
def sub(old, new, n=1):
    global s
    c = s.count(old)
    assert c == n, (c, n, old[:90])
    s = s.replace(old, new)

# 1. teselas
sub("""  if(!document.documentElement.classList.contains('lite') && !S.holdTiles) layer.addTo(map);""",
"""  // R23: tampoco antes de la primera vista de verdad. El mapa nace en el mundo entero (zoom 2) y a los pocos
  // milisegundos salta a la ciudad: esas 16 teselas se pedian y se cancelaban. Con ?city= o #p= se pedian
  // ademas las de la ciudad adivinada por la zona horaria (en un mapa incrustado de Sevilla, Nueva York).
  S.viewWait = true;
  if(!document.documentElement.classList.contains('lite') && !S.holdTiles && !S.viewWait) layer.addTo(map);""")
sub("""function showTiles(){ if(!S.holdTiles) return; S.holdTiles=false;
  try{ if(map && layer && !map.hasLayer(layer) && !document.documentElement.classList.contains('lite')) layer.addTo(map); }catch(e){}""",
"""function showTiles(){ if(!S.holdTiles) return; S.holdTiles=false;
  try{ if(map && layer && !S.viewWait && !map.hasLayer(layer) && !document.documentElement.classList.contains('lite')) layer.addTo(map); }catch(e){}""")
sub("""    else { if(!map.hasLayer(layer) && !S.holdTiles) layer.addTo(map); }""",
"""    else { if(!map.hasLayer(layer) && !S.holdTiles && !S.viewWait) layer.addTo(map); }""")
# la funcion que suelta las teselas, junto a showTiles
sub("""function showTiles(){ if(!S.holdTiles) return; S.holdTiles=false;""",
"""/* R23: la primera vista de verdad ya esta puesta: ahora si se piden teselas (si nada mas las retiene). */
function firstView(){ if(!S.viewWait) return; S.viewWait=false;
  try{ if(map && layer && !S.holdTiles && !map.hasLayer(layer) && !document.documentElement.classList.contains('lite')) layer.addTo(map); }catch(e){} }
function showTiles(){ if(!S.holdTiles) return; S.holdTiles=false;""")
sub("""  if(map){ map.setView([start.lat,start.lon],(last&&last.lat)?13:11); renderMe(); }""",
"""  if(map){ map.setView([start.lat,start.lon],(last&&last.lat)?13:11); renderMe(); }
  // R23: con ?city= o #p= la vista buena llega un poco mas abajo; si no, es esta
  const DEEP = !!(new URLSearchParams(location.search).get('city')) || location.hash.indexOf('#p=')===0;
  if(!DEEP) firstView();""")
sub("""  if(qcity){
    // ?city=London&cc=GB&ll=51.507,-0.128""",
"""  // R23: las teselas se piden al terminar el salto a la ciudad o al sitio del enlace (y, si no hay salto, al
  // segundo y medio, en la vista que haya)
  if(DEEP){ if(map) map.once('moveend', ()=>setTimeout(firstView, 0)); setTimeout(firstView, 1500); }
  if(qcity){
    // ?city=London&cc=GB&ll=51.507,-0.128""")

# 2. horarios en texto
sub("""  const L=OH_LOC[loc], DN={su:0,mo:1,tu:2,we:3,th:4,fr:5,sa:6}, MN={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
  return v.replace(/\\b(Mo|Tu|We|Th|Fr|Sa|Su)\\b/g,(a)=>L.d[DN[a.toLowerCase()]])""",
"""  const L=OH_LOC[loc], DN={su:0,mo:1,tu:2,we:3,th:4,fr:5,sa:6}, MN={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
  // R23: lo que va entre comillas lo escribio el sitio («Not open to the public», «Sur rendez-vous»): se guarda
  // aparte y vuelve tal cual. Antes pasaba por las sustituciones y salia «Not open now to the public».
  const QT=[];
  return v.replace(/"([^"]*)"/g,(a,x)=>{ QT.push(x.trim()); return '\\u0000'+(QT.length-1)+'\\u0000'; })
          // «open» suelto en OSM solo dice «abierto en ese rato»: no se traduce por «Abierto ahora»
          .replace(/\\s*\\bopen\\b/g,'')
          .replace(/\\b(Mo|Tu|We|Th|Fr|Sa|Su)\\b/g,(a)=>L.d[DN[a.toLowerCase()]])""")
sub("""          .replace(/\\bopen\\b/g,t('ui.open').toLowerCase()).replace(/\\bunknown\\b/g,'?')""",
"""          .replace(/\\bunknown\\b/g,'?')""")
sub("""          .replace(/"([^"]*)"/g,(a,x)=>x.trim()?'('+x.trim()+')':'')
          .replace(/\\s*\\|\\|\\s*/g,' · ').replace(/\\s*,\\s*(?=\\S)/g,', ')
          .replace(/\\s*;\\s*/g,' · ').replace(/(\\s·)+\\s*$/,'').trim();""",
"""          .replace(/\\s*\\|\\|\\s*/g,' · ').replace(/\\s*,\\s*(?=\\S)/g,', ')
          .replace(/\\s*;\\s*/g,' · ').replace(/(\\s·)+\\s*$/,'')
          .replace(/\\u0000(\\d+)\\u0000/g,(a,i)=>QT[+i]?'('+esc(QT[+i])+')':'')
          .replace(/^\\s*·\\s*|\\s*·\\s*$/g,'').replace(/\\s{2,}/g,' ').trim();""")

# 3. sitios cerrados del todo
sub("""function decodeRows(rows){
  let la=0, lo=0;
  const out=new Array(rows.length);""",
"""/* R23: «closed» u «off» sin ninguna hora (41 sitios: cerrados, «no abierto al publico», «solo socios»). No son
   un sitio al que ir: no se ensenan. */
const OH_SHUT=/^\\s*(closed|off)\\b(?![^"]*\\d{1,2}:\\d{2})/i;
function shutForGood(oh){ if(!oh || !OH_SHUT.test(oh)) return false; return !/\\d{1,2}:\\d{2}|24\\/7/.test(String(oh).replace(/"[^"]*"/g,'')); }
function decodeRows(rows){
  let la=0, lo=0;
  const out=new Array(rows.length);""")

# 4. correo
c = s.count('partners@supportnear.com')
assert c >= 20, c
s = s.replace('partners@supportnear.com', 'hello@supportnear.com')
io.open(F, 'w', encoding='utf-8').write(s)
print('ok, correos cambiados:', c)
