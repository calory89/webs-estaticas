# -*- coding: utf-8 -*-
"""R22f (11-nov-2026).

- Primera visita y sin cobertura: los datos de la ciudad se bajan ANTES de que el service
  worker tome el control, asi que no quedaban en su cache (solo en la del navegador, que se
  vacia sola). Al quedarse sin red, la app abria pero decia «aqui no hay nada mapeado». Ahora,
  en cuanto el service worker toma el control, la pagina le pasa lo que ya tiene cargado
  (trozos de datos, idioma, festivos) y el los guarda.
- La linea «120 sitios · el mas cercano, a 1,9 km» se cortaba en el movil justo en la
  distancia: si no cabe junto al titulo, baja a su propia linea.
"""
import io, sys
p = sys.argv[1] + '/index.template.html'
h = io.open(p, encoding='utf-8').read()
assert 'R22f' not in h, 'ya aplicado'


def sub1(old, new):
    global h
    assert h.count(old) == 1, (h.count(old), old[:90])
    h = h.replace(old, new)


sub1("""        const ready = ()=>{ if(navigator.serviceWorker.controller) offlineNote(); };""",
     """        const ready = ()=>{ if(navigator.serviceWorker.controller) offlineNote(); };
        // R22f: primera visita: lo que se cargo antes de que hubiera service worker, que lo guarde el
        const keep = ()=>{ try{ const c=navigator.serviceWorker.controller; if(!c) return;
          const urls=[...loadedChunks].slice(0,40).map(k=>'d/'+k+'.json'+(DATA_V?'?v='+DATA_V:''));
          if(LANG!=='en') urls.push('l/'+LANG+'.json'+((LANG_V||DATA_V)?'?v='+(LANG_V||DATA_V):''));
          urls.push('holidays.json?v='+DATA_V);
          c.postMessage({t:'keep', urls}); }catch(e){} };
        if(!navigator.serviceWorker.controller) navigator.serviceWorker.addEventListener('controllerchange', ()=>setTimeout(keep,1200), {once:true});""")
sub1("/* R22e: la fila de etiquetas", """/* R22f: la segunda linea de la cabecera baja entera si no cabe, en vez de cortarse en la distancia */
@media (max-width:640px){ .panel-head .sub{flex:1 1 auto} }
/* R22e: la fila de etiquetas""")
io.open(p, 'w', encoding='utf-8').write(h)
print('ok')
