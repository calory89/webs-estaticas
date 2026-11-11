# -*- coding: utf-8 -*-
"""R22e (11-nov-2026): uso.

- Tarjetas en el movil: el boton «Llamar» (36 px) iba dentro de la fila de etiquetas,
  que se corta a 26 px: salia con el borde de abajo comido. La fila con boton mide 36.
- Bienvenida: las cinco necesidades (Comer, Dormir, Ducha, Medico, Papeles) eran un
  dibujo. Ahora son botones: se toca una y el mapa abre ya con ese filtro puesto.
- Al pedir la ubicacion se abre ya la conexion con el servidor de datos en directo
  (Overpass): la respuesta llega unos 300 ms antes en un movil.
"""
import io, sys
p = sys.argv[1] + '/index.template.html'
h = io.open(p, encoding='utf-8').read()
assert 'R22e' not in h, 'ya aplicado'


def sub1(old, new, cnt=1):
    global h
    assert h.count(old) == cnt, (h.count(old), old[:90])
    h = h.replace(old, new)


# ---- 1. «Llamar» cortado ----
sub1("""      +'<span class="tags">'+statusTag(p)+hrs+repTag(p)+verTag(p)+ageTag(p)+forTags(p)""",
     """      +'<span class="tags'+(call?' tags--call':'')+'">'+statusTag(p)+hrs+repTag(p)+verTag(p)+ageTag(p)+forTags(p)""")
sub1("/* R22d: sitio reservado", """/* R22e: la fila de etiquetas con boton «Llamar» mide lo que el boton (antes lo cortaba) */
@media (max-width:640px){ .tags.tags--call{max-height:36px;align-items:center} html.big .tags.tags--call{max-height:42px} }
/* R22e: las necesidades de la bienvenida son botones */
.wel-needs button{display:flex;flex-direction:column;align-items:center;gap:5px;font:inherit;font-size:11.5px;color:var(--ink-2);text-align:center;padding:9px 2px;border-radius:10px;background:var(--paper-3);border:1px solid transparent;cursor:pointer;min-height:44px;-webkit-tap-highlight-color:transparent}
.wel-needs button:hover{border-color:var(--line-2)} .wel-needs button:active{transform:scale(.97)}
.wel-needs button.busy{border-color:var(--brand);opacity:.8}
@media (max-width:480px){ .wel-needs button{font-size:10.5px} }
@media (max-width:640px){ .wel-needs button{padding:7px 2px;font-size:10px} }
/* R22d: sitio reservado""")
# el marcado: <span class="wnN">…</span> -> <button type="button" class="wnN" data-need="…">…</button>
NEED = {'wn1': 'food', 'wn2': 'shelter', 'wn3': 'hygiene', 'wn4': 'health', 'wn5': 'legal,social'}
a = h.index('<div class="wel-needs" aria-hidden="true">'); b = h.index('</div>', a)
blk = h[a:b]
assert blk.count('<span class="wn') == 5 and blk.count('</em></span>') == 5, blk[:200]
blk = blk.replace('<div class="wel-needs" aria-hidden="true">', '<div class="wel-needs">')
for k, v in NEED.items():
    blk = blk.replace('<span class="%s">' % k, '<button type="button" class="%s" data-need="%s">' % (k, v))
blk = blk.replace('</em></span>', '</em></button>').replace('<svg viewBox', '<svg aria-hidden="true" viewBox')
h = h[:a] + blk + h[b:]
# antes de que la app este lista, el toque se guarda como los demas
sub1("ev.target.closest('#welLoc,#welCity,[data-close],[data-l]');if(!x)return;\ns.intent=x.id||(x.hasAttribute('data-close')?'close':'lang:'+x.getAttribute('data-l'));if(x.id)x.classList.add('busy')});",
     "ev.target.closest('#welLoc,#welCity,[data-close],[data-l],[data-need]');if(!x)return;\ns.intent=x.id||(x.hasAttribute('data-close')?'close':x.hasAttribute('data-need')?'need:'+x.getAttribute('data-need'):'lang:'+x.getAttribute('data-l'));if(x.id||x.hasAttribute('data-need'))x.classList.add('busy')});")
# la app: tocar una necesidad = ese filtro + pedir la ubicacion
sub1("""      $$('#mWel [data-close]').forEach(x=>x.addEventListener('click',()=>{ closeWelcome(); afterWelcome(); }));
      // R22: lo que se toco""", """      $$('#mWel [data-close]').forEach(x=>x.addEventListener('click',()=>{ closeWelcome(); afterWelcome(); }));
      wireWelNeeds();
      // R22: lo que se toco""")
sub1("""      else if(it==='close') setTimeout(()=>{ closeWelcome(); afterWelcome(); }, 0);""",
     """      else if(it==='close') setTimeout(()=>{ closeWelcome(); afterWelcome(); }, 0);
      else if(it && it.indexOf('need:')===0) setTimeout(()=>{ const b=$('#mWel .wel-needs [data-need="'+it.slice(5).replace(/[^a-z,]/g,'')+'"]'); if(b) b.click(); }, 0);""")
sub1("function closeWelcome(){ store.set('welcomed',1);", """/* R22e: «Comer», «Dormir»… en la bienvenida: el mapa abre con ese filtro y pide la ubicacion */
function wireWelNeeds(){
  $$('#mWel .wel-needs [data-need]').forEach(b=>{ b.onclick=()=>{
    const ids=String(b.dataset.need||'').split(',').filter(x=>CATIDS.includes(x));
    if(ids.length){ S.filters=new Set(ids); S.limit=(window.innerWidth<=640?12:24); try{ saveFlt(); }catch(e){} try{ buildFilters(); }catch(e){} tally('need', ids[0]); }
    closeWelcome(); geolocate(true);
  }; });
}
function closeWelcome(){ store.set('welcomed',1);""")
# el menu «Que es esto» vuelve a abrir la bienvenida: tambien ahi
sub1("    if(a==='what'){ openWelcome(); ", "    if(a==='what'){ openWelcome(); wireWelNeeds(); ")
# ---- 3. conexion abierta con Overpass al pedir la ubicacion ----
sub1("""  setSub(t('ui.locating'));
  $$('#geoBtn,#locate').forEach(b=>b.classList.add('busy'));""", """  setSub(t('ui.locating'));
  // R22e: mientras la persona contesta al permiso, se abre la conexion con el servidor de datos en directo
  try{ if(!geolocate.pc){ geolocate.pc=1; ['https://overpass-api.de','https://server.arcgisonline.com'].forEach(u=>{ const l=document.createElement('link'); l.rel='preconnect'; l.href=u; l.crossOrigin='anonymous'; document.head.appendChild(l); }); } }catch(e){}
  $$('#geoBtn,#locate').forEach(b=>b.classList.add('busy'));""")
io.open(p, 'w', encoding='utf-8').write(h)
print('ok')
