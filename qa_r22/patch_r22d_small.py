# -*- coding: utf-8 -*-
"""R22d (11-nov-2026): sin saltos al cargar, y nada de pines detras de la bienvenida en el movil."""
import io, sys
p = sys.argv[1] + '/index.template.html'
h = io.open(p, encoding='utf-8').read()
assert 'R22d' not in h, 'ya aplicado'


def sub1(old, new):
    global h
    assert h.count(old) == 1, (h.count(old), old[:90])
    h = h.replace(old, new)


# el hueco de las pastillas y el de la segunda linea de la cabecera existen desde el primer
# pintado: antes el mapa bajaba 40 px cuando llegaban (salto de pagina, CLS)
sub1(".modal.pre{display:flex}\n", """/* R22d: sitio reservado para lo que pinta la app al arrancar */
.filterwrap{min-height:63px} html.big .filterwrap{min-height:71px} body.is-embed .filterwrap{min-height:0}
@media (min-width:641px){ .panel-head .sub{min-height:17px} }
.modal.pre{display:flex}
""")
# en el movil la bienvenida tapa el mapa: ni teselas ni pines hasta que se cierra.
# En pantallas anchas el mapa se ve alrededor del cuadro: ahi se carga como siempre.
sub1("  S.holdTiles = !!(window.__sn && window.__sn.wel);", "  S.holdTiles = !!(window.__sn && window.__sn.wel) && window.innerWidth<=640;   // R22d: solo en el movil")
sub1("""function renderMarkers(){
  if(!map||!mapReady()) return;
""", """function renderMarkers(){
  if(!map||!mapReady()) return;
  if(S.holdTiles) return;   // R22d: con la bienvenida delante (movil) no se pintan pines: se pintan al cerrarla
""")
sub1("  try{ if(map && layer && !map.hasLayer(layer) && !document.documentElement.classList.contains('lite')) layer.addTo(map); }catch(e){} }",
     "  try{ if(map && layer && !map.hasLayer(layer) && !document.documentElement.classList.contains('lite')) layer.addTo(map); }catch(e){}\n  try{ renderMarkers(); }catch(e){} }")
io.open(p, 'w', encoding='utf-8').write(h)
print('ok')
