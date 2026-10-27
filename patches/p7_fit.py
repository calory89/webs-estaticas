# -*- coding: utf-8 -*-
"""Ronda 17: las pastillas del cajon caben siempre (idiomas con palabras largas:
wolof, bambara, ruso, polaco...). Si la fila no cabe, los iconos pasan a ser un
punto de color; si aun asi no cabe, la fila pasa a dos lineas (nunca se corta una palabra)."""
import io, sys
F='index.template.html'; s=io.open(F,encoding='utf-8').read()
def rep(a,b):
    global s
    if s.count(a)!=1: sys.exit('NO ENCONTRADO: '+a[:100])
    s=s.replace(a,b)
rep("""function wireNeed(){""","""function fitNeed(){
  const g=$('#list .need-g'); if(!g) return;
  g.classList.remove('tight','tight2');
  if(g.scrollWidth>g.clientWidth+1){ g.classList.add('tight'); if(g.scrollWidth>g.clientWidth+1) g.classList.add('tight2'); }
}
addEventListener('resize',()=>{ clearTimeout(fitNeed.t); fitNeed.t=setTimeout(fitNeed,150); });
function wireNeed(){
  fitNeed();""")
rep("""/* el cajon de la lista no asoma""","""/* pastillas que no caben: punto de color en vez de icono, y si hace falta «…» */
.need-g.tight .need-b:not(.need-b--plan){padding-inline-start:10px;gap:7px}
.need-g.tight .need-b:not(.need-b--plan) .need-ic{width:9px;height:9px}
.need-g.tight .need-b:not(.need-b--plan) .need-ic .icon{display:none}
.need-g.tight2{flex-wrap:wrap;overflow:visible;row-gap:6px}
.need-g.tight2 .need-b:not(.need-b--plan){flex:1 1 auto}
/* el cajon de la lista no asoma""")
io.open(F,'w',encoding='utf-8').write(s); print('p7 ok')
