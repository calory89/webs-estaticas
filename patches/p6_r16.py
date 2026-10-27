# -*- coding: utf-8 -*-
"""Ronda 16 (rehecha el 27-oct tras perder el contenedor): cajon minimo en movil,
30 arreglos, endurecimiento de seguridad y contador en Supabase.
    python3 patches/p6_r16.py      (sobre index.template.html, sw.js, manifest)
Cada cambio comprueba que el texto original sigue ahi: si no, para."""
import io, re, sys
F = 'index.template.html'
s = io.open(F, encoding='utf-8').read()
n_ok = 0
def rep(old, new, count=1):
    global s, n_ok
    c = s.count(old)
    if c < 1 or (count == 1 and c != 1):
        sys.exit('NO ENCONTRADO (%d): %s' % (c, old[:120]))
    s = s.replace(old, new) if count != 1 else s.replace(old, new, 1)
    n_ok += 1

# ---------- 1. Cajon minimo: una fila de pastillas + boton redondo del plan ----------
rep("""function needHTML(){
  if(!needShown()) return '';
  return '<div class="need"><div class="need-h">'+esc(t('need.h'))+'</div><div class="need-g">'
    + NEED.map(n=>'<button type="button" class="need-b'+(n.cat==='sos'?' need-b--sos':'')+'" data-need="'+n.cat+'"'
        +(n.cat!=='sos'?' style="--cc:'+CATMAP[n.cat].color+'"':'')+'>'
        +(n.cat==='sos'
          ? '<svg class="icon" viewBox="0 0 24 24"><path d="M12 9v5M12 17.5v.01"/><path d="M10.3 3.9L2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>'
          : '<span class="need-ic">'+svg(n.cat)+'</span>')
        +'<span>'+esc(t(n.key))+'</span></button>').join('')
    + '</div><button type="button" class="planbtn" id="planBtn"><svg class="icon icon--s" viewBox="0 0 24 24"><path d="M4 6h16M4 12h10M4 18h7"/><path d="M17 15l2 2 4-4"/></svg>'+esc(t(new Date().getHours()>=7&&new Date().getHours()<18?'plan.dh':'plan.h'))+'</button></div>';
}""",
"""// Ronda 16: el cajon asomaba con un titulo, cuatro botones altos y una tira
// discontinua: ocupaba media pantalla antes de enseñar un solo sitio. Ahora es
// una fila de pastillas (Comer, Dormir, Ducharme) y un boton redondo para el
// plan. Emergencias ya esta arriba, siempre visible: no hace falta repetirlo.
function needHTML(){
  if(!needShown()) return '';
  const day=new Date().getHours()>=7&&new Date().getHours()<18, pl=esc(t(day?'plan.dh':'plan.h'));
  return '<div class="need" role="group" aria-label="'+esc(t('need.h'))+'"><div class="need-g">'
    + NEED.filter(n=>n.cat!=='sos').map(n=>'<button type="button" class="need-b" data-need="'+n.cat+'" style="--cc:'+CATMAP[n.cat].color+'">'
        +'<span class="need-ic">'+svg(n.cat)+'</span><span class="need-l">'+esc(t(n.key))+'</span></button>').join('')
    + '<button type="button" class="need-b need-b--plan" id="planBtn" aria-pressed="'+(S.plan?'true':'false')+'" aria-label="'+pl+'" title="'+pl+'"><span class="need-ic"><svg class="icon" viewBox="0 0 24 24"><path d="M4 6h16M4 12h10M4 18h7"/><path d="M17 15l2 2 4-4"/></svg></span><span class="need-l">'+esc(t('plan.short'))+'</span></button>'
    + '</div></div>';
}""")
rep("$$('#list .need-b').forEach(b=>b.onclick=()=>{", "$$('#list .need-b[data-need]').forEach(b=>b.onclick=()=>{")

rep(""".need{margin:2px 0 12px}
.need-h{font-size:15px;font-weight:700;margin:2px 2px 9px;letter-spacing:-.01em}
.need-g{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.need-b{display:flex;align-items:center;gap:11px;min-height:58px;padding:10px 12px;
  border-radius:var(--r-m);border:1.5px solid var(--line-2);background:var(--paper-2);
  font:inherit;font-size:15.5px;font-weight:700;color:var(--ink);cursor:pointer;text-align:start;
  transition:transform .12s,border-color .15s,background .15s}""",
""".need{margin:0 0 10px}
.need-h{font-size:15px;font-weight:700;margin:2px 2px 9px;letter-spacing:-.01em}
.need-g{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding:1px 1px 3px;margin:0 -1px}
.need-g::-webkit-scrollbar{display:none}
.need-b{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:5px 15px 5px 6px;flex:1 0 auto;justify-content:center;
  border-radius:99px;border:1.5px solid var(--line-2);background:var(--paper-2);white-space:nowrap;
  font:inherit;font-size:14.5px;font-weight:650;color:var(--ink);cursor:pointer;text-align:start;
  transition:transform .12s,border-color .15s,background .15s}
.need-b--plan{flex:0 0 auto;padding:5px 14px 5px 6px;border-style:dashed;color:var(--ink-2)}
.need-b--plan .need-ic{background:var(--paper-3);color:var(--ink)}
.need-b--plan[aria-pressed="true"]{border-style:solid;border-color:var(--ink);background:var(--ink);color:var(--paper)}
.need-b--plan[aria-pressed="true"] .need-ic{background:var(--paper);color:var(--ink)}""")
rep(""".need-ic{width:34px;height:34px;border-radius:10px;background:var(--cc);color:#fff;
  display:grid;place-items:center;flex:none}""",
""".need-ic{width:32px;height:32px;border-radius:50%;background:var(--cc);color:#fff;
  display:grid;place-items:center;flex:none}""")
rep(""".need-ic .icon{width:19px;height:19px;stroke-width:2.1}""", """.need-ic .icon{width:17px;height:17px;stroke-width:2.1}""")
rep("""@media (max-width:480px){
  .need-g{grid-template-columns:repeat(4,1fr);gap:6px}
  .need-b{flex-direction:column;justify-content:center;gap:4px;min-height:56px;padding:6px 3px;
    font-size:12px;text-align:center;line-height:1.1}
  .need-ic{width:26px;height:26px;border-radius:8px}
  .need-ic .icon{width:15px;height:15px}
  .need-b--sos .icon{width:20px;height:20px}
  .need{margin:0 0 8px}
  .need-h{font-size:13.5px;margin:0 2px 6px}
}""",
"""@media (max-width:480px){
  .need-g{gap:6px}
  .need-b{min-height:40px;padding:4px 12px 4px 4px;gap:7px;font-size:13.5px}
  .need-ic{width:30px;height:30px}
  .need-ic .icon{width:15px;height:15px}
  .need{margin:0 0 8px}
  /* el plan, solo el icono: la etiqueta la lee el lector de pantalla */
  .need-b--plan{padding:4px;min-width:40px}
  .need-b--plan .need-l{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
}
@media (max-width:420px){
  .need-b{padding:3px 10px 3px 3px;gap:6px;font-size:13px;min-height:38px}
  .need-ic{width:28px;height:28px}
  .need-b--plan{padding:3px;min-width:38px}
}
@media (max-width:379px){
  .need-g{gap:5px}
  .need-b{padding:2px 9px 2px 2px;gap:5px;font-size:12.5px;min-height:36px}
  .need-ic{width:26px;height:26px}
  .need-ic .icon{width:14px;height:14px}
  .need-b--plan{padding:2px;min-width:32px}
}""")
# la tarjeta del plan, compacta en movil
rep(""".nowcard p{font-size:13.5px;line-height:1.55;opacity:.82}""",
""".nowcard p{font-size:13.5px;line-height:1.55;opacity:.82}
@media (max-width:480px){
  .nowcard{padding:12px 13px}
  .nowcard>p{display:none}
  .nowcard .plan-r{padding-block:7px}
  .nowcard .plan-r.none{display:flex;align-items:center;gap:8px}
  .nowcard .plan-r.none > span:last-child{display:flex;gap:6px;flex-wrap:wrap;align-items:baseline}
}""")
# texto corto del boton del plan en los 20 idiomas (cae al ingles si falta)
PLAN_SHORT = {'en':'Plan','es':'Plan','fr':'Plan','ar':'الخطة','uk':'План','ro':'Plan','pl':'Plan','ru':'План','pt':'Plano','ur':'منصوبہ',
              'fa':'برنامه','wo':'Plan','bm':'Labɛn','ti':'መደብ','ps':'پلان','so':'Qorshe','am':'እቅድ','tr':'Plan','bn':'পরিকল্পনা','zh':'计划'}
for code, txt in PLAN_SHORT.items():
    rep('T.%s = {\n' % code, 'T.%s = {\n  "plan.short":"%s",\n' % (code, txt))

# ---------- 2. setNow redibuja los filtros ----------
rep("""  $('#panelTitle').textContent = on ? t('now.title') : t('ui.near');
  render();""", """  $('#panelTitle').textContent = on ? t('now.title') : t('ui.near');
  buildFilters(); render();""")

# ---------- 3. direccion de la tarjeta en su propia linea, sin «·» colgando ----------
rep("""+((!p.auto && (p.addr||p.near))?'<span>·</span><span class="card-a">'""", """+((!p.auto && (p.addr||p.near))?'<span class="card-a">'""")
rep(""".card-a{max-width:55%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}""",
    """.card-a{flex-basis:100%;max-width:100%;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}""")
# ---------- 4. etiquetas: nunca cortadas a media palabra ----------
rep("""  .tags{margin-top:5px;flex-wrap:nowrap;overflow:hidden;gap:4px}""", """  .tags{margin-top:5px;flex-wrap:wrap;overflow:hidden;gap:4px;max-height:26px}""")

# ---------- 5. ubicacion: se recoloca cuando llegan los datos ----------
rep("""  S.center={lat,lon}; S.placeName=name||'';
  ensureChunks(lat,lon);""", """  S.center={lat,lon}; S.placeName=name||'';
  S.chunkP = ensureChunks(lat,lon);""")
rep("""    setCenter(la,lo);
    if(map) map.setView([la,lo], S.far?12:15, {animate:true});
    loadLive(la,lo, !S.far);""", """    setCenter(la,lo);
    if(map) map.setView([la,lo], S.far?12:15, {animate:true});
    loadLive(la,lo, !S.far);
    // «Lejos» se decidia antes de que llegaran los trozos del sitio: en una
    // ciudad sin nucleo (Aalborg) salia «lo mas cercano a 180 km» y el mapa
    // vacio. Cuando llegan los datos se vuelve a mirar y se encuadra a la
    // persona con los tres sitios mas cercanos, una sola vez.
    let fitted=false;
    const refit=()=>{
      if(!S.center || dist(S.center.lat,S.center.lon,la,lo)>50) return;
      let b2=1e12; for(const p of S.places){ const d=dist(la,lo,p.lat,p.lon); if(d<b2) b2=d; }
      const wasFar=S.far; S.far=b2>40000; S.farDist=b2;
      if(wasFar!==S.far){ sortPlaces(); render(); }
      if(fitted || S.far || !map) return;
      const near=S.places.filter(p=>p.d!=null).sort((a,b)=>a.d-b.d).slice(0,3);
      if(!near.length) return;
      fitted=true;
      const go=()=>{ try{ map.fitBounds(L.latLngBounds([[la,lo]].concat(near.map(p=>[p.lat,p.lon]))).pad(0.3),{maxZoom:16,animate:true}); }catch(e){} };
      if(map._animatingZoom) map.once('moveend',go); else go();
    };
    Promise.resolve(S.chunkP).then(()=>setTimeout(refit,300)).catch(()=>{});
    setTimeout(refit,3000);""")

# ---------- 6. «Emergencia» → «SOS» por debajo de 360 px ----------
rep("""<button class="sos" id="sosBtn1"><svg class="icon icon--s" viewBox="0 0 24 24"><path d="M12 9v5M12 17.5v.01"/><path d="M10.3 3.9L2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg><span data-i18n="ui.sos">Emergency</span></button>""",
"""<button class="sos" id="sosBtn1"><svg class="icon icon--s" viewBox="0 0 24 24"><path d="M12 9v5M12 17.5v.01"/><path d="M10.3 3.9L2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg><span class="sos-l" data-i18n="ui.sos">Emergency</span><span class="sos-s" aria-hidden="true">SOS</span></button>""")

# ---------- CSS de los arreglos (un bloque, al final de los estilos) ----------
CSS_R16 = """
/* ===================== Ronda 16 ===================== */
.sos .sos-s{display:none}
@media (max-width:400px){ html.mic #micBtn{display:none} html.mic body.qfocus #micBtn{display:inline-flex} }
@media (max-width:379px){ .sos .sos-l{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap} .sos .sos-s{display:inline} .sos{padding:0 9px} }
/* paneles de escritorio: la regla general iba despues y ganaba siempre */
@media (min-width:901px) and (max-width:1180px){ :root{--panel-w:352px} html .panel{width:352px} }
@media (min-width:1600px){ html .panel{width:440px} }
/* movil apaisado: lista a un lado, mapa al otro */
@media (max-width:900px) and (max-height:520px) and (orientation:landscape){
  .panel{top:0;bottom:0;height:auto;inset-inline-start:auto;inset-inline-end:0;width:min(360px,46vw);border-radius:0;transform:none!important;box-shadow:var(--shadow-2)}
  .grab{display:none}
  .detail{top:0;bottom:0;inset-inline-start:auto;inset-inline-end:0;width:min(400px,52vw);height:auto;min-height:0;max-height:none;border-radius:0}
  .mapfx--br,body.bars-1 .mapfx--br,body.bars-2 .mapfx--br{bottom:14px;inset-inline-end:calc(min(360px,46vw) + 14px)}
  .wel-needs{display:none}
  .need-b{padding:3px 10px 3px 3px;gap:6px;font-size:13px;min-height:38px}
  .need-ic{width:28px;height:28px}
  .need-b--plan{padding:3px;min-width:38px}
  .need-b--plan .need-l{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
}
/* escritorio: las pastillas caben en la columna de la lista */
@media (min-width:901px){
  .need-b{padding:3px 10px 3px 3px;gap:6px;font-size:13px;min-height:38px}
  .need-ic{width:28px;height:28px}
  .need-b--plan{padding:3px;min-width:38px}
  .need-b--plan .need-l{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
}
@media (min-width:901px) and (max-width:1180px){
  .need-g{gap:5px}
  .need-b{padding:2px 9px 2px 2px;gap:5px;font-size:12.5px;min-height:36px}
  .need-ic{width:26px;height:26px}
  .need-ic .icon{width:14px;height:14px}
}
/* el cajon de la lista no asoma por debajo de la ficha abierta */
@media (max-width:900px){ .main:has(#detail.on) .panel{visibility:hidden} .grab{height:28px} }
/* dedos: enlaces de la ficha con sitio de sobra */
.verlink{min-height:44px;display:inline-flex;align-items:center}
.detail-body .kv a{display:inline-block;padding-block:6px}
/* iOS amplia la pagina si un campo tiene letra de menos de 16 px */
@media (pointer:coarse){ input,textarea,select,.search input{font-size:16px!important} .search input::placeholder{font-size:15px} }
/* en el movil las cajas no se encogen: antes Emergencias tenia dos barras */
@media (max-width:640px){ .modal-box > *{flex-shrink:0} }
.statbar{grid-template-columns:repeat(5,1fr)}
@media (max-width:520px){ .statbar{grid-template-columns:repeat(2,1fr)} .statbar div:last-child:nth-child(odd){grid-column:span 2} }
@media (max-height:700px){ .wel-needs{display:none} }
/* RTL: nombres y direcciones mezclan alfabetos; cada uno decide su sentido */
html[dir="rtl"] .card-t,html[dir="rtl"] .card-s,html[dir="rtl"] .card-a,html[dir="rtl"] .detail h3,html[dir="rtl"] .kv-v{unicode-bidi:plaintext}
"""
rep(""".wel-langs button{border:1px solid var(--line-2);color:var(--ink-2)}
</style>""", """.wel-langs button{border:1px solid var(--line-2);color:var(--ink-2)}""" + CSS_R16 + """</style>""")

# ---------- 8. el texto del buscador, segun el hueco real de la caja ----------
rep("""  const narrow = window.matchMedia && window.matchMedia('(max-width:620px)').matches;
  $('#q').placeholder = narrow ? t('ui.searchshort') : t('ui.search');""", """  fitQ();""")
rep("""function setCenter(lat,lon,name){""", """// El texto largo («Busca una ciudad, calle o estacion…») solo si cabe entero
// en la caja tal como esta ahora; si no, el corto. Antes se miraba el ancho de
// la ventana y en tablets y en arabe salia cortado igual.
function fitQ(){
  const q=$('#q'); if(!q) return;
  const w=q.clientWidth||0, long=t('ui.search');
  let fits=w>0;
  try{ const cv=fitQ.c||(fitQ.c=document.createElement('canvas')).getContext('2d'); const cs=getComputedStyle(q); cv.font=cs.fontSize+' '+cs.fontFamily; fits = w>0 && cv.measureText(long).width < w-8; }catch(e){ fits = w>260; }
  q.placeholder = fits ? long : t('ui.searchshort');
}
addEventListener('resize',()=>{ clearTimeout(fitQ.t); fitQ.t=setTimeout(fitQ,150); });
function setCenter(lat,lon,name){""")

# ---------- 11. horarios: «;» de OpenStreetMap → « · » ----------
rep("""          .replace(/(\\d)-(\\d)/g,'$1\\u2013$2').replace(/([^\\d\\s])-([^\\d\\s])/g,'$1\\u2013$2');
}""", """          .replace(/(\\d)-(\\d)/g,'$1\\u2013$2').replace(/([^\\d\\s])-([^\\d\\s])/g,'$1\\u2013$2')
          .replace(/\\s*;\\s*/g,' · ');
}""")

# ---------- 12. distancias aisladas en RTL ----------
rep("""function km(m){
  if(MILES_CC.includes(S.country)){""", """function km(m){
  const r=km0(m);
  return document.documentElement.dir==='rtl' ? '\\u2066'+r+'\\u2069' : r;
}
function km0(m){
  if(MILES_CC.includes(S.country)){""")

# ---------- 14. ciudades por su nombre en el idioma de la persona ----------
rep("""  const all=CITIES.filter(x=>norm(x[0])===n || norm(x[0]).indexOf(n)===0);
  if(all.length<2) return all[0] || CITIES.find(x=>norm(x[0]).indexOf(n)>=0);""",
"""  const nm=x=>[norm(x[0]),norm(cityName(x))];
  const all=CITIES.filter(x=>nm(x).some(v=>v===n || v.indexOf(n)===0));
  if(all.length<2) return all[0] || CITIES.find(x=>nm(x).some(v=>v.indexOf(n)>=0));""")
rep("""  if(qcity){
    const c=pickCity(qcity);
    if(c){ goCity(c); }
  }""", """  if(qcity){
    const c=pickCity(qcity);
    if(c){ goCity(c); }
    // «?city=Мадрид»: los nombres traducidos llegan con el idioma
    else Promise.resolve(typeof ensureLang==='function' ? ensureLang(LANG) : 0).then(()=>{ const c2=pickCity(qcity); if(c2) goCity(c2); }).catch(()=>{});
  }""")

# ---------- 18. brujula solo si el sitio esta a menos de 30 km ----------
rep("""    +(S.gps?'<div class="compass" id="cmpBox" hidden>""", """    +(S.gps && p.d!=null && p.d<30000?'<div class="compass" id="cmpBox" hidden>""")

# ---------- 19. festivo: la etiqueta acompaña al estado, no lo sustituye ----------
rep("""  if(os.hol && (st==='open'||st==='closed')) return '<span class="tag tag--soon" title="'+esc(t('hol.p'))+'">'+esc(t('hol.tag'))+'</span>';
  if(st==='always')""", """  const hol = os.hol && (st==='open'||st==='closed') ? '<span class="tag tag--soon" title="'+esc(t('hol.p'))+'">'+esc(t('hol.tag'))+'</span>' : '';
  if(hol) return (st==='open' ? '<span class="tag tag--open"><span class="sr">'+t('sr.status')+' </span>'+t('ui.open')+'</span>' : '<span class="tag tag--shut">'+t('ui.closed')+'</span>') + hol;
  if(st==='always')""")

# ---------- 20. la hoja imprimible vuelve a su titulo ----------
rep("""function openSheet(){
  tally('sheet','');""", """function openSheet(){
  tally('sheet','');
  const st=$('#sheetT'); if(st) st.textContent=t('sheet.h');""")

# ---------- seguridad: datos de los trozos con la misma limpieza que los de directo ----------
rep("""phone:okPhone(r[8]||''), web:r[9]||'',""", """phone:okPhone(r[8]||''), web:okWeb(r[9]||''),""")
# sin manejadores en linea (la CSP los bloquea): la foto de Wikimedia se oculta desde JS
rep(""" onerror="this.parentNode.style.display=\\'none\\';this.parentNode.nextSibling.style.display=\\'none\\'"></a>'""", """></a>'""")
rep("""  $('#dIcon').innerHTML = svg(p.cat);""", """  $('#dIcon').innerHTML = svg(p.cat);
  setTimeout(()=>$$('#dBody img.dphoto').forEach(i=>{ const hide=()=>{ const a=i.parentNode; if(a){ a.style.display='none'; if(a.nextSibling&&a.nextSibling.style) a.nextSibling.style.display='none'; } }; if(i.complete && !i.naturalWidth) hide(); else i.addEventListener('error',hide,{once:true}); }),0);""")
rep("""href="'+osmEdit""", """href="'+esc(osmEdit)""")

# ---------- contador: de stats/s.php (PHP, ya no existe) a Supabase ----------
rep("""    const body=new URLSearchParams({e:e, v:String(v||'').slice(0,40)});
    if(navigator.sendBeacon) navigator.sendBeacon('stats/s.php', body); else fetch('stats/s.php',{method:'POST',body,keepalive:true}).catch(()=>{});""",
"""    // misma web (/__sb/ lo pasa a Supabase): sin cookies, sin IP, sin terceros
    fetch('/__sb/public/rest/v1/rpc/sn_tally',{method:'POST',keepalive:true,credentials:'omit',
      headers:{'content-type':'application/json','apikey':SN_KEY},body:JSON.stringify({e:e, v:String(v||'').slice(0,40)})}).catch(()=>{});""")
rep("""function tally(e, v){""", """const SN_KEY='sb_publishable_WWMM9pbZfP4hJosLJlTobg_lWFGoJ3X';   // clave publica (solo puede sumar uno)
function tally(e, v){""")
rep("""'<a href="stats/impacto.php?lang='+LANG+'">'""", """'<a href="'+pg('impacto.html')+(LANG==='es'?(PAGES_V?'&':'?')+'lang=es':'')+'">'""")

io.open(F, 'w', encoding='utf-8').write(s)

# ---------- sw.js y manifest ----------
sw = io.open('sw.js', encoding='utf-8').read()
assert "const V = 'sn-v15';" in sw
sw = sw.replace("const V = 'sn-v15';", "const V = 'sn-v16';")
# Con Cloudflare, /index.html responde 301 a / y /instalar.html 308 a /instalar.
# Una respuesta redirigida guardada en cache no se puede usar para abrir una
# pagina: sin red, la app salia en blanco. Se guarda / y se limpia la marca.
for a, b in [("c.addAll(['./', './index.html', './instalar.html', './emergency-numbers.csv'])", "c.addAll(['./', './instalar', './emergency-numbers.csv'])"),
             ("c.addAll(['./', './index.html'])", "c.addAll(['./'])"),
             (".then(r => r || caches.match('./index.html')))", ".then(r => r || caches.match('./')).then(r => (r && r.redirected) ? new Response(r.body, {status: r.status, statusText: r.statusText, headers: r.headers}) : r))")]:
    assert a in sw, a
    sw = sw.replace(a, b)
io.open('sw.js', 'w', encoding='utf-8').write(sw)
mf = io.open('manifest.webmanifest', encoding='utf-8').read()
mf = mf.replace('13 languages', '20 languages')
io.open('manifest.webmanifest', 'w', encoding='utf-8').write(mf)
print('ronda 16: %d cambios aplicados' % n_ok)
