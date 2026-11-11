# -*- coding: utf-8 -*-
"""R22a (11-nov-2026): la portada pinta antes.

- Un script minimo en el <head> decide, antes de pintar: tema claro/oscuro, letra
  grande, idioma y direccion (RTL), si toca la bienvenida, y pide ya el fichero del
  idioma (preload) en paralelo con la app.
- La bienvenida sale escrita en el HTML, en el idioma de la persona, sin esperar al
  JavaScript (que ahora va en ficheros aparte, ver build.py). Los toques que llegan
  antes de que la app este lista se guardan y se atienden al arrancar.
- Con la bienvenida delante no se bajan teselas del mapa (350 KB de una ciudad
  adivinada que casi nunca es la de la persona).
- El idioma guardado en el movil se aplica en el acto (antes: ingles y, un instante
  despues, el suyo). La clave de esa copia va con la huella de las traducciones, no
  la de los datos (un cambio de textos sin cambio de datos no llegaba nunca).
- Lista con esqueleto desde el HTML; enlaces de ciudades sin «.html» (era un 308).
"""
import io, re, sys
p = sys.argv[1] + '/index.template.html'
h = io.open(p, encoding='utf-8').read()
assert '__BOOT_LANGS__' not in h, 'ya aplicado'


def sub1(old, new, cnt=1):
    global h
    assert h.count(old) == cnt, (h.count(old), old[:90])
    h = h.replace(old, new)


# ---------- 1. script de arranque en el <head>, antes del primer <style> ----------
BOOT = r"""<script>(function(w,d){var e=d.documentElement,q=location.search,s=w.__sn={},ls=null;
try{ls=w.localStorage}catch(x){}
function g(k){try{return JSON.parse(ls.getItem('sn.'+k))}catch(x){return null}}
function P(k){var m=new RegExp('[?&]'+k+'=([^&#]*)').exec(q);if(!m)return'';try{return decodeURIComponent(m[1].replace(/\+/g,' '))}catch(x){return m[1]}}
var th=g('theme');e.setAttribute('data-theme',th==='dark'||th==='light'?th:(w.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));
if(g('big'))e.classList.add('big');if(g('calm'))e.classList.add('calm');if(g('lite')===1)e.classList.add('lite');
var emb=P('embed')==='1',kio=P('kiosk')==='1';if(kio)e.classList.add('big','kiosk');
var LC=__BOOT_LANGS__,FB=__BOOT_FB__,RTL=__BOOT_RTL__;
function bl(){try{var l=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||'en'];for(var i=0;i<l.length;i++){var c=String(l[i]).toLowerCase().split('-')[0];if(LC.indexOf(c)>-1)return c;if(FB[c]&&LC.indexOf(FB[c])>-1)return FB[c]}}catch(x){}return'en'}
var ql=P('lang'),L=LC.indexOf(ql)>-1?ql:(g('langManual')?(g('lang')||'en'):bl());if(LC.indexOf(L)<0)L='en';s.lang=L;
if(L!=='en'){e.lang=L;if(RTL.indexOf(L)>-1)e.dir='rtl';e.classList.add('pre');setTimeout(function(){e.classList.remove('pre')},9000);
[L,FB[L]].forEach(function(c){if(!c||c==='en')return;var k=null;try{k=ls.getItem('sn.tr:'+c+':__BOOT_LANGV__')}catch(x){}
if(!k){var p=d.createElement('link');p.rel='preload';p.as='fetch';p.crossOrigin='anonymous';p.href='l/'+c+'.json?v=__BOOT_LANGV__';d.head.appendChild(p)}})}
s.wel=!emb&&!kio&&!P('city')&&location.hash.indexOf('#p=')!==0&&(P('welcome')==='1'||(!P('sos')&&!P('now')&&!P('need')&&!g('welcomed')&&!g('last')));
})(window,document);</script>
"""
i = h.index('<style')
h = h[:i] + BOOT + h[i:]

# ---------- 2. CSS ----------
CSS = """
/* R22: bienvenida pintada desde el HTML (clase «pre», antes de que arranque la app) */
.modal.pre{display:flex}
@media (max-width:640px){ .modal.pre .modal-box{transform:none} }
.btn.busy{position:relative;pointer-events:none;opacity:.8}
.btn.busy::after{content:"";width:16px;height:16px;border-radius:50%;border:2.5px solid currentColor;border-inline-end-color:transparent;animation:spin .7s linear infinite;margin-inline-start:10px;flex:none}
/* R22: hasta que llega su idioma no se ensena el ingles de la app (la bienvenida ya va traducida) */
html.pre #app [data-i18n],html.pre #panelTitle,html.pre #panelSub{visibility:hidden}
html.pre #q::placeholder{color:transparent}
"""
sub1('.modal.on{display:flex}\n', '.modal.on{display:flex}\n' + CSS)

# ---------- 3. la bienvenida, traducida y abierta sin esperar a la app ----------
WEL = r"""<script>(function(w,d){var s=w.__sn;if(!s||!s.wel)return;var m=d.getElementById('mWel');if(!m)return;
var K=__WEL_K__,W=__WEL_T__,N=__WEL_N__,L=s.lang,t=W[L];
if(t)[].forEach.call(m.querySelectorAll('[data-i18n]'),function(el){var i=K.indexOf(el.getAttribute('data-i18n'));if(i>-1&&t[i])el.textContent=t[i]});
var b=d.getElementById('welLangs'),top=[L].concat(['en','es','fr','ar','uk'].filter(function(x){return x!==L})).slice(0,5);
if(b)b.innerHTML=top.map(function(c){return'<button type="button" data-l="'+c+'" aria-pressed="'+(c===L)+'" lang="'+c+'">'+N[c]+'</button>'}).join('')+'<button type="button" data-l="*">…</button>';
m.classList.add('pre');
m.addEventListener('click',function(ev){if(w.__snReady)return;var x=ev.target.closest&&ev.target.closest('#welLoc,#welCity,[data-close],[data-l]');if(!x)return;
s.intent=x.id||(x.hasAttribute('data-close')?'close':'lang:'+x.getAttribute('data-l'));if(x.id)x.classList.add('busy')});
})(window,document);</script>
"""
old = """    </details>
  </div>
</div>

<div class="modal" id="mShow" """
sub1(old, """    </details>
  </div>
</div>
""" + WEL + """
<div class="modal" id="mShow" """)

# ---------- 4. esqueleto de la lista en el HTML ----------
sub1('<div class="list" id="list" tabindex="-1"></div>',
     '<div class="list" id="list" tabindex="-1"><div style="padding:8px" aria-hidden="true"><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div></div></div>')

# ---------- 5. idioma: clave de la copia, aplicar en el acto, sin parpadeo ----------
sub1("function langKey(c){ return 'tr:'+c+':'+DATA_V; }",
     "function langKey(c){ return 'tr:'+c+':'+(LANG_V||DATA_V); }   // R22: huella de las traducciones, no de los datos\n"
     "/* R22: lo que ya esta guardado en el movil se lee en el acto, sin esperar a nada */\n"
     "function primeLang(c){\n"
     "  try{\n"
     "    if(!c || c==='en' || T[c]) return;\n"
     "    const fb=FALLBACK[c];\n"
     "    if(fb && fb!=='en' && !T[fb]){ primeLang(fb); if(!T[fb]) return; }\n"
     "    const cached=store.get(langKey(c));\n"
     "    if(cached && typeof cached==='object' && (cached.t||cached)['wel.h']){\n"
     "      T[c]=LANG_MEM[c]=cached.t || cached;\n"
     "      if(cached.sub) SUB[c]=cached.sub;\n"
     "      if(cached.lbl) LBL[c]=cached.lbl;\n"
     "      if(cached['for']) FOR_LBL[c]=cached['for'];\n"
     "      if(cached.cities) CITY_L[c]=cached.cities;\n"
     "    }\n"
     "  }catch(e){}\n"
     "}")
sub1("""async function setLang(code, manual){
  await ensureLang(code);
  applyLang(code, manual);
}""", """async function setLang(code, manual){
  await ensureLang(code);
  if(S.langHold===code && !T[code]) S.langHold=null;   // R22: no llego su idioma: se queda el ingles, entero
  applyLang(code, manual);
}""")
sub1("""  LANG = T[code]?code:'en';
  store.set('lang',LANG);
  if(manual) store.set('langManual',1);
  const meta = LANGS.find(l=>l.code===LANG)||LANGS[0];
  document.documentElement.lang = LANG;
  document.documentElement.dir = meta.rtl?'rtl':'ltr';
""", """  LANG = T[code]?code:'en';
  store.set('lang',LANG);
  if(manual){ store.set('langManual',1); S.langHold=null; }
  // R22: mientras llega el idioma de la persona, la bienvenida (ya traducida en el HTML)
  // y la direccion de la pagina no pasan por el ingles
  if(S.langHold && LANG===S.langHold) S.langHold=null;
  const hold = !!S.langHold && LANG==='en';
  const meta = LANGS.find(l=>l.code===LANG)||LANGS[0];
  if(!hold){
    document.documentElement.lang = LANG;
    document.documentElement.dir = meta.rtl?'rtl':'ltr';
    document.documentElement.classList.remove('pre');
  }
""")
sub1("  $$('[data-i18n]').forEach(el=>{ el.textContent = t(el.dataset.i18n); });\n  if($('#mWel') && $('#mWel').classList.contains('on')",
     "  $$('[data-i18n]').forEach(el=>{ if(hold && el.closest('#mWel')) return; el.textContent = t(el.dataset.i18n); });\n  if(!hold && $('#mWel') && $('#mWel').classList.contains('on')")
sub1("""  const want0 = store.get('langManual') ? (store.get('lang')||'en') : browserLang();
  applyLang(T[want0] ? want0 : 'en');
  if(want0!=='en' && !T[want0]) setLang(want0);
""", """  const want0 = store.get('langManual') ? (store.get('lang')||'en') : browserLang();
  // R22: el idioma con el que se va a acabar (el del enlace ?lang= manda) se aplica ya si
  // esta guardado en el movil; si hay que pedirlo, la bienvenida no pasa por el ingles
  const qlang0 = (new URLSearchParams(location.search)).get('lang');
  const first0 = (qlang0 && LANGS.some(l=>l.code===qlang0)) ? qlang0 : want0;
  primeLang(first0);
  if(first0!=='en' && !T[first0]) S.langHold = first0;
  applyLang(T[first0] ? first0 : 'en');
  if(want0!=='en' && !T[want0] && first0===want0) setLang(want0);
""")

# ---------- 6. teselas: no con la bienvenida delante ----------
sub1("  if(!document.documentElement.classList.contains('lite')) layer.addTo(map);\n  // Leaflet dispara",
     "  // R22: con la bienvenida delante no se bajan teselas (350 KB de una ciudad adivinada)\n"
     "  S.holdTiles = !!(window.__sn && window.__sn.wel);\n"
     "  if(!document.documentElement.classList.contains('lite') && !S.holdTiles) layer.addTo(map);\n  // Leaflet dispara")
sub1("function closeWelcome(){ store.set('welcomed',1); $('#mWel').classList.remove('on'); document.body.style.overflow=''; }",
     "function closeWelcome(){ store.set('welcomed',1); $('#mWel').classList.remove('on','pre'); document.body.style.overflow=''; showTiles(); }\n"
     "function showTiles(){ if(!S.holdTiles) return; S.holdTiles=false;\n"
     "  try{ if(map && layer && !map.hasLayer(layer) && !document.documentElement.classList.contains('lite')) layer.addTo(map); }catch(e){} }")
sub1("    else { if(!map.hasLayer(layer)) layer.addTo(map); }\n    setTimeout(()=>map.invalidateSize(), 60);",
     "    else { if(!map.hasLayer(layer) && !S.holdTiles) layer.addTo(map); }\n    setTimeout(()=>map.invalidateSize(), 60);")
sub1("  $('#mWel').classList.add('on'); document.body.style.overflow='hidden';",
     "  $('#mWel').classList.remove('pre'); $('#mWel').classList.add('on'); document.body.style.overflow='hidden';")
sub1("        const href='c/'+slugCity(c[0])+'.html';", "        const href='c/'+slugCity(c[0]);")

# ---------- 7. arranque: lo que se toco antes de que la app estuviera lista ----------
sub1("""      $$('#mWel [data-close]').forEach(x=>x.addEventListener('click',()=>{ closeWelcome(); afterWelcome(); }));
    } else geolocate();
  }
})();""", """      $$('#mWel [data-close]').forEach(x=>x.addEventListener('click',()=>{ closeWelcome(); afterWelcome(); }));
      // R22: lo que se toco en la bienvenida antes de que la app estuviera lista
      const it = window.__sn && window.__sn.intent; window.__snReady = 1;
      $$('#mWel .busy').forEach(x=>x.classList.remove('busy'));
      if(it==='welLoc' || it==='welCity') setTimeout(()=>{ const b=$('#'+it); if(b) b.click(); }, 0);
      else if(it==='close') setTimeout(()=>{ closeWelcome(); afterWelcome(); }, 0);
      else if(it && it.indexOf('lang:')===0) setTimeout(()=>{ const b=$('#welLangs [data-l="'+it.slice(5).replace(/[^a-z*]/g,'')+'"]'); if(b) b.click(); }, 0);
    } else geolocate();
  }
  // R22: pase lo que pase, al acabar de arrancar no queda nada pintado «de antes»
  window.__snReady = 1;
  { const mw=$('#mWel'); if(mw && mw.classList.contains('pre')){ mw.classList.remove('pre'); S.holdTiles && showTiles(); } }
  if(!S.langHold) document.documentElement.classList.remove('pre');
})();""")

sub1("  $$('.modal').forEach(m=>m.classList.remove('on')); document.body.style.overflow='';\n  const ib=$('#menuBtn');",
     "  $$('.modal').forEach(m=>m.classList.remove('on','pre')); document.body.style.overflow=''; showTiles();\n  const ib=$('#menuBtn');")

io.open(p, 'w', encoding='utf-8').write(h)
print('ok')
