# -*- coding: utf-8 -*-
"""R22c (11-nov-2026): los pueblos, por letra.

Buscar un pueblo («Getafe») bajaba towns.json entero: 1,3 MB (520 KB por el cable)
antes de ensenar una sola sugerencia. Ahora build.py lo parte por la primera letra
(tw/g.json, ~20 KB) y el buscador pide solo la letra que se esta escribiendo.
"""
import io, sys
p = sys.argv[1] + '/index.template.html'
h = io.open(p, encoding='utf-8').read()
assert 'TOWN_B' not in h, 'ya aplicado'


def sub1(old, new):
    global h
    assert h.count(old) == 1, (h.count(old), old[:90])
    h = h.replace(old, new)


sub1("""  if(TOWNS && cities.length<3 && n.length>=3){
    const tn=""", """  if(cities.length<3 && n.length>=3 && TOWN_B[townKey(n)]!==2) loadTowns(n);
  if(TOWNS && cities.length<3 && n.length>=3){
    const tn=""")
sub1("""  } else if(!TOWNS && cities.length<3 && n.length>=3) loadTowns();
  return {needs:""", """  }
  return {needs:""")
sub1("""let TOWNS=null, townsLoading=false;
function loadTowns(){
  if(TOWNS || townsLoading) return; townsLoading=true;
  fetch('towns.json?v='+DATA_V).then(r=>r.ok?r.json():[]).then(j=>{ TOWNS=j; const v=$('#q').value.trim(); if(v.length>=3 && document.activeElement===$('#q')) showAc(null, v); }).catch(()=>{ townsLoading=false; });
}""", """// R22c: los pueblos van partidos por la primera letra (tw/g.json): se pide solo la que se escribe.
// TOWNS solo crece por el final: el indice de un pueblo no cambia (lo usan las sugerencias).
let TOWNS=null; const TOWN_B={}, TOWN_SEEN=new Set();
function townKey(n){ const c=String(n||'').charAt(0); if(/[a-z0-9]/.test(c)) return c; const cp=c?String(n).codePointAt(0):0; if(cp<0x80) return '_'; return cp<0x3000 ? 'u'+(cp>>8).toString(16) : 'ucjk'; }
function loadTowns(n){
  const k=townKey(n); if(TOWN_B[k]) return; TOWN_B[k]=1;
  fetch('tw/'+k+'.json?v='+DATA_V).then(r=>r.ok?r.json():[]).then(j=>{
    const add=[]; for(const tw of j){ const id=tw[0]+'|'+tw[2]+'|'+tw[3]; if(!TOWN_SEEN.has(id)){ TOWN_SEEN.add(id); add.push(tw); } }
    TOWNS=(TOWNS||[]).concat(add); TOWN_B[k]=2;
    const v=$('#q').value.trim(); if(v.length>=3 && document.activeElement===$('#q')) showAc(null, v);
  }).catch(()=>{ TOWN_B[k]=0; });
}""")
io.open(p, 'w', encoding='utf-8').write(h)
print('ok')
