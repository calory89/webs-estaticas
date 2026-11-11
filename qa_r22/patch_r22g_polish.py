# -*- coding: utf-8 -*-
"""R22g (11-nov-2026): acabado en el movil.

- Fila de etiquetas de las tarjetas: se cortaba a 26 px fijos. Con «Cerrado ahora» (21 px)
  asomaba el borde de la segunda fila como una raya; en arabe, bengali o con letra grande
  (27-28 px) se comia el borde de abajo. Ahora la segunda fila queda 20 px mas abajo y
  nunca asoma, y la primera cabe entera hasta 30 px (34 con letra grande).
- Sin desenfoque detras de los cuadros en el movil (es caro en moviles baratos y la hoja
  tapa casi toda la pantalla); el oscurecido se queda.
- Los botones responden al dedo (se hunden un pelo) en vez del destello gris del navegador,
  sin la espera de doble toque, y el texto no se agranda solo al girar un iPhone.
"""
import io, sys
p = sys.argv[1] + '/index.template.html'
h = io.open(p, encoding='utf-8').read()
assert 'R22g' not in h, 'ya aplicado'
old = "/* R22f: la segunda linea de la cabecera"
assert h.count(old) == 1
h = h.replace(old, """/* R22g: acabado en el movil */
html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
a,button,input,select,summary,[role="button"],.card,.chip{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.btn:active,.chip:active,.iconbtn:active,.callbtn:active,.fab:active,.plan-r:active{transform:scale(.97)}
.card:active{transform:scale(.992)}
html.calm .btn:active,html.calm .chip:active,html.calm .iconbtn:active,html.calm .callbtn:active,html.calm .fab:active,html.calm .plan-r:active,html.calm .card:active{transform:none}
@media (prefers-reduced-motion:reduce){ .btn:active,.chip:active,.iconbtn:active,.callbtn:active,.fab:active,.plan-r:active,.card:active{transform:none} }
@media (max-width:640px){
  .modal-bg{backdrop-filter:none;-webkit-backdrop-filter:none}
  .tags{row-gap:20px;max-height:30px} html.big .tags{max-height:34px}
}
""" + old)
io.open(p, 'w', encoding='utf-8').write(h)
print('ok')
