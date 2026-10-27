import io
p='/home/claude/supportnear/index.template.html'; s=io.open(p,encoding='utf-8').read()
def R(a,b,cnt=1):
    global s
    n=s.count(a); assert n==cnt,(n,a[:90]); s=s.replace(a,b)

# UX17: botones de la ficha en dos columnas tambien en el movil
R('''  .actions{grid-template-columns:1fr}''','''  .actions{grid-template-columns:1fr 1fr}
  .actions .btn{min-height:48px;font-size:14.5px;padding-inline:10px}''')

# UX18: abrir en otra app de mapas (Organic Maps, OsmAnd... que navegan sin datos)
R('''      +(isIOS()?'<a class="btn btn--ghost" href="https://maps.apple.com/?daddr='+p.lat+','+p.lon+'&dirflg=w" target="_blank" rel="noopener">'+esc(t('ui.applemaps'))+'</a>':'')''',
  '''      +(isIOS()?'<a class="btn btn--ghost" href="https://maps.apple.com/?daddr='+p.lat+','+p.lon+'&dirflg=w" target="_blank" rel="noopener">'+esc(t('ui.applemaps'))+'</a>':'')
      // Organic Maps y OsmAnd navegan sin datos con el mapa descargado. En Android
      // un enlace geo: deja elegir cualquier app de mapas instalada.
      +(/Android/i.test(navigator.userAgent)?'<a class="btn btn--ghost" href="geo:'+p.lat+','+p.lon+'?q='+p.lat+','+p.lon+'('+encodeURIComponent(pname(p))+')">'+esc(t('ui.otherapp'))+'</a>'
        :isIOS()?'<a class="btn btn--ghost" href="om://map?v=1&ll='+p.lat+','+p.lon+'&n='+encodeURIComponent(pname(p))+'">Organic Maps</a>':'')''')

# UX21/22/23/24: menu agrupado, icono propio para el modo sencillo, menos movimiento, cifras propias
R('''  x:'<path d="M4 3.5l16 17M20 3.5l-16 17"/>',''','''  x:'<path d="M4 3.5l16 17M20 3.5l-16 17"/>',
  grid:'<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  calm:'<path d="M3 12h4l2-5 4 10 2-5h6"/>',
  num:'<path d="M6 4v16M12 8h6M12 16h6M18 8l-6 8"/>',
  card:'<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h6M7 14h4"/>',
  kiosk:'<rect x="4" y="3" width="16" height="12" rx="1.5"/><path d="M9 21h6M12 15v6"/>',
  data:'<path d="M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  gap:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M8 11h6"/>',''')
old_start = s.index("function buildMenu(){")
old_end = s.index("  $$('#menuBody [data-act]').forEach(b=> b.onclick=()=>{", old_start)
new_menu = r'''function buildMenu(){
  // Veintiseis opciones seguidas no se leen. Cuatro grupos, con lo que mas se
  // usa arriba: tus sitios, guardar sin conexion y ensenarselo a alguien.
  const ndOk = !!NDIG[LANG];
  $('#menuBody').innerHTML =
     '<div class="menu-k">'+esc(t('menu.g.use'))+'</div>'
    +'<button type="button" data-act="close">'+mi('map')+esc(t('menu.back'))+'</button>'
    +'<button type="button" data-act="fav">'+mi('heart')+esc(t('fav.h'))+(favs().length?' <span class="cnt">'+favs().length+'</span>':'')+'</button>'
    +'<button type="button" data-act="dl">'+mi('down')+esc(t('dl.btn'))+'</button>'
    +'<button type="button" data-act="show">'+mi('show')+esc(t('show.h'))+'</button>'
    +'<button type="button" data-act="me">'+mi('pin')+esc(t('me.share'))+'</button>'
    +'<button type="button" data-act="sheet">'+mi('press')+esc(t('sheet.menu'))+'</button>'
    +'<button type="button" data-act="pocket">'+mi('card')+esc(t('pocket.menu'))+'</button>'
    +'<div class="menu-k">'+esc(t('menu.g.set'))+'</div>'
    +'<button type="button" data-act="lang">'+mi('globe')+esc(t('lang.h'))+'</button>'
    +'<button type="button" data-act="theme">'+mi('moon')+esc(t('menu.theme'))+'</button>'
    +'<button type="button" data-act="big" aria-pressed="'+!!store.get('big')+'">'+mi('big')+esc(t('menu.big'))+'</button>'
    +'<button type="button" data-act="simple" aria-pressed="'+!!store.get('simple')+'">'+mi('grid')+esc(t('simple.menu'))+'</button>'
    +'<button type="button" data-act="calm" aria-pressed="'+!!store.get('calm')+'">'+mi('calm')+esc(t('menu.calm'))+'</button>'
    +(ndOk?'<button type="button" data-act="nd" aria-pressed="'+ndOn()+'">'+mi('num')+esc(t('menu.nd'))+' <span class="cnt" lang="'+LANG+'">'+NDIG[LANG].slice(1,4)+'</span></button>':'')
    +'<button type="button" data-act="lite" aria-pressed="'+!!store.get('lite')+'">'+mi('lite')+esc(t('menu.lite'))+'</button>'
    +(isStandalone()?'':'<button type="button" data-act="install">'+mi('down')+esc(t('inst.h'))+'</button>')
    +'<a href="'+pg('t/index.html')+'">'+mi('press')+esc(t('menu.lite2'))+EXT+'</a>'
    +'<div class="menu-k">'+esc(t('menu.g.help'))+'</div>'
    +'<button type="button" data-act="addplace">'+mi('plus')+esc(t('add.menu'))+'</button>'
    +'<button type="button" data-act="pass">'+mi('pass')+esc(t('menu.pass'))+'</button>'
    +'<button type="button" data-act="data">'+mi('data')+esc(t('data.menu'))+'</button>'
    +'<a href="'+pg('?kiosk=1')+'">'+mi('kiosk')+esc(t('kiosk.menu'))+EXT+'</a>'
    +'<a href="'+pg('huecos.html')+'">'+mi('gap')+esc(t('gaps.menu'))+EXT+'</a>'
    +'<a href="'+pg('incrustar.html')+'">'+mi('embed')+esc(t('emb.link'))+EXT+'</a>'
    +'<a href="https://www.openstreetmap.org" target="_blank" rel="noopener">'+mi('fix')+esc(t('menu.fix'))+EXT+'</a>'
    +'<div class="menu-k">'+esc(t('menu.g.about'))+'</div>'
    +'<button type="button" data-act="what">'+mi('info')+esc(t('menu.what'))+'</button>'
    +'<button type="button" data-act="priv">'+mi('shield')+esc(t('menu.priv'))+'</button>'
    +'<a href="'+pg('instalar.html')+'">'+mi('wifi')+esc(t('menu.off'))+EXT+'</a>'
    +'<a href="'+pg('stats/impacto.php?lang='+LANG)+'">'+mi('chart')+esc(t('impact.menu'))+EXT+'</a>'
    +'<a href="'+pg('cambios.html')+'">'+mi('info')+esc(t('menu.news'))+EXT+'</a>'
    +'<a href="'+pg('c/index.html')+'">'+mi('map')+esc(t('menu.cities'))+EXT+'</a>'
    +'<a href="'+pg('prensa.html')+'">'+mi('press')+esc(t('press.link'))+EXT+'</a>'
    +'<a href="'+pg('about.html')+'">'+mi('info')+esc(t('menu.who'))+EXT+'</a>'
    +(WA_NUM?'<a href="https://wa.me/'+WA_NUM+'?text='+encodeURIComponent(t('wa.msg'))+'" target="_blank" rel="noopener">'+mi('phone')+esc(t('wa.btn'))+EXT+'</a>':'')
    +'<a href="'+X_URL+'" target="_blank" rel="noopener">'+mi('x')+esc(t('by.x'))+EXT+'</a>';
'''
s = s[:old_start] + new_menu + s[old_end:]
R('''    if(a==='simple') setSimple(!store.get('simple'));''','''    if(a==='simple') setSimple(!store.get('simple'));
    if(a==='calm') setCalm(!store.get('calm'));
    if(a==='nd'){ store.set('nd', ndOn()?'off':'on'); applyNd(); render(); if(S.sel) select(S.sel,true); toast(t('menu.nd')); }
    if(a==='pocket') openPocket();
    if(a==='data') exportData();''')

# funciones nuevas: menos movimiento, cifras propias
R('''function mi(icon){''','''/* Menos movimiento: para quien se marea, y de paso menos bateria. El sistema
   ya lo puede pedir (prefers-reduced-motion); esto es para quien no sabe donde. */
function setCalm(on){ store.set('calm', on?1:0); document.documentElement.classList.toggle('calm', !!on); }
/* Cifras de cada escritura: ۳۲۰ m en persa, ৩২০ m en bengali. En persa, pastun y
   bengali es lo normal y va por defecto; en arabe y urdu se usa mucho la cifra
   latina, asi que alli se elige en el menu. */
const NDIG = {ar:'٠١٢٣٤٥٦٧٨٩', fa:'۰۱۲۳۴۵۶۷۸۹', ps:'۰۱۲۳۴۵۶۷۸۹', ur:'۰۱۲۳۴۵۶۷۸۹', bn:'০১২৩৪৫৬৭৮৯'};
const ND_DEFAULT = {fa:1, ps:1, bn:1};
function ndOn(){ if(!NDIG[LANG]) return false; const v=store.get('nd'); return v==='on' || (v!=='off' && !!ND_DEFAULT[LANG]); }
function nd(x){ const d=ndOn() && NDIG[LANG]; return d ? String(x).replace(/[0-9]/g, c=>d[+c]) : String(x); }
function applyNd(){ document.documentElement.classList.toggle('nd', ndOn()); }
function mi(icon){''')
R('''  if(m<1000) return Math.round(m/10)*10+' m';
  return (m/1000).toFixed(m<10000?1:0).replace('.',LANG==='en'?'.':',')+' km';''','''  if(m<1000) return nd(Math.round(m/10)*10)+' m';
  return nd((m/1000).toFixed(m<10000?1:0).replace('.',LANG==='en'?'.':','))+' km';''')
R('''  if(vars) for(const v in vars) s = s.split('{'+v+'}').join(vars[v]);''','''  if(vars) for(const v in vars){ const x=vars[v]; s = s.split('{'+v+'}').join((typeof x==='number' || /^[0-9][0-9.,:]*$/.test(String(x))) ? nd(x) : x); }''')
R('''@media (prefers-reduced-motion:reduce){ *,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important} }''',
  '''@media (prefers-reduced-motion:reduce){ *,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important} }
html.calm *,html.calm *::before,html.calm *::after{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}''')

# UX26: un poco mas de contraste en el gris
R('''--ink-3:#6E665B;''','''--ink-3:#645C51;''')

# UX28/29: vibracion y deshacer
R('''function toast(msg){
  const el=$('#toast'); el.textContent=msg; el.classList.add('on');''','''function toast(msg, act, fn){
  const el=$('#toast'); el.textContent=msg;
  if(act && fn){ const b=document.createElement('button'); b.type='button'; b.className='toast-act'; b.textContent=act;
    b.onclick=()=>{ el.classList.remove('on'); fn(); }; el.appendChild(b); }
  el.classList.add('on');''')
R('''  text-align:center;opacity:0;visibility:hidden;pointer-events:none}''','''  text-align:center;opacity:0;visibility:hidden;pointer-events:none}
.toast .toast-act{pointer-events:auto;margin-inline-start:12px;background:transparent;border:0;color:var(--brand-soft);font:inherit;font-weight:700;text-decoration:underline;cursor:pointer;padding:6px 4px;min-height:36px}''')
R('''function toggleFav(p){
  let f=favs();''','''function buzz(ms){ try{ if(navigator.vibrate && !document.documentElement.classList.contains('calm')) navigator.vibrate(ms||25); }catch(e){} }
function toggleFav(p){
  buzz(20);
  let f=favs();''')
R('''function buildSos(){''','''function buildSos(){
  buzz([40,60,40]);''')
R('''  const fb=$('#favBtn'); if(fb) fb.onclick=()=>{ const on=toggleFav(p); fb.setAttribute('aria-pressed',on); fb.lastChild.textContent=on?t('fav.on'):t('fav.add'); toast(on?t('fav.on'):t('fav.clear')); render(); };''',
  '''  const fb=$('#favBtn'); if(fb) fb.onclick=()=>{ const on=toggleFav(p); fb.setAttribute('aria-pressed',on); fb.lastChild.textContent=on?t('fav.on'):t('fav.add');
    if(on) toast(t('fav.on')); else toast(t('fav.clear'), t('ui.undo'), ()=>{ toggleFav(p); render(); if(S.sel===p.id) select(p,true); });
    render(); };''')

io.open(p,'w',encoding='utf-8').write(s); print('p2 ok')
