import io,re,sys
p='/home/claude/supportnear/index.template.html'; s=io.open(p,encoding='utf-8').read()
def R(a,b,cnt=1):
    global s
    n=s.count(a)
    assert n==cnt, (n, a[:90])
    s=s.replace(a,b)

# ---------- UX1: bienvenida corta ----------
R('''    <div class="wel-steps">''','''    <details class="wel-more"><summary data-i18n="wel.more">More about SupportNear</summary>
    <div class="wel-steps">''')
R('''    <p class="wel-foot"><a href="prensa.html" data-i18n="press.link">''','''    <p class="wel-foot"><a href="prensa.html" data-i18n="press.link">''')
# cerrar el details despues del pie
i=s.find('<p class="wel-foot">'); j=s.find('</p>',i)+4
s=s[:j]+'\n    </details>'+s[j:]
# los idiomas fuera del plegable, que quien no lee el idioma los necesita a la vista
R('''    <div class="wel-langs" id="welLangs" aria-label="Language"></div>
''','')
R('''    <button type="button" class="btn btn--ghost wel-city" id="welCity" data-i18n="wel.city">Type my city instead</button>
''','''    <button type="button" class="btn btn--ghost wel-city" id="welCity" data-i18n="wel.city">Type my city instead</button>
    <div class="wel-langs" id="welLangs" aria-label="Language"></div>
''')
R('''.wel-cities{font-size:12px;''','''.wel-more{margin-top:14px;border-top:1px solid var(--line);padding-top:6px}
.wel-more summary{cursor:pointer;list-style:none;font-size:13.5px;color:var(--ink-2);padding:10px 0;min-height:44px;display:flex;align-items:center;gap:6px}
.wel-more summary::-webkit-details-marker{display:none}
.wel-more summary::after{content:"";width:8px;height:8px;border:solid currentColor;border-width:0 2px 2px 0;transform:rotate(45deg);margin-inline-start:4px;transition:transform .2s}
.wel-more[open] summary::after{transform:rotate(-135deg)}
.wel .lede{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.wel-cities{font-size:12px;''')

# ---------- UX3: ciudades de tu pais primero en la bienvenida ----------
R('''  $('#mWel').classList.add('on'); document.body.style.overflow='hidden';
  setTimeout(()=>{ try{ $('#welLoc').focus({preventScroll:true}); }catch(e){} },50);''','''  // Las ciudades del pie, primero las de tu pais (por el idioma o la zona
  // horaria del movil): a quien esta en Espana, Madrid antes que London.
  try{
    const nav=document.querySelector('#mWel .wel-cities'), cc=guessCC();
    if(nav && cc && !nav.dataset.cc){
      nav.dataset.cc=cc;
      const mine=CITIES.filter(c=>c[4]===cc).slice(0,5);
      const b=nav.querySelector('b');
      mine.slice().reverse().forEach(c=>{
        const href='c/'+slugCity(c)+'.html';
        const old=nav.querySelector('a[href="'+href+'"]'); if(old) old.remove();
        const a=document.createElement('a'); a.href=href; a.textContent=cityName(c);
        if(b) b.after(document.createTextNode(' '),a); else nav.prepend(a);
      });
    }
  }catch(e){}
  $('#mWel').classList.add('on'); document.body.style.overflow='hidden';
  setTimeout(()=>{ try{ $('#welLoc').focus({preventScroll:true}); }catch(e){} },50);''')

# ---------- UX2: cerrar la bienvenida no deja la lista vacia ----------
R('''function askState(){''','''/* Cerrar la bienvenida con la X dejaba la lista vacia preguntando otra vez.
   Si el movil dice en que pais esta (idioma o zona horaria), se ensena ya su
   ciudad principal con una linea arriba: «¿No es aqui? Usa tu ubicacion». */
function afterWelcome(){
  if(store.get('last')) return;
  const g=cityForCC(guessCC());
  if(g){ S.guessed=g; S.far=false; if(!S.center || dist(S.center.lat,S.center.lon,g[1],g[2])>20000) goCity(g); else render(); }
  else askState();
}
function guessHTML(){
  const g=S.guessed;
  if(!g || S.gps || !S.center || dist(S.center.lat,S.center.lon,g[1],g[2])>15000) return '';
  return '<div class="tip tip--guess"><p>'+esc(t('guess.p',{c:cityName(g)}))+'</p><div class="verbtns">'
    +'<button type="button" class="btn btn--primary" id="guessLoc">'+esc(t('wel.loc'))+'</button>'
    +'<button type="button" class="btn btn--ghost" id="guessCity">'+esc(t('guess.other'))+'</button></div></div>';
}
function wireGuess(){
  const a=$('#guessLoc'); if(a) a.onclick=()=>{ S.guessed=null; geolocate(true); };
  const b=$('#guessCity'); if(b) b.onclick=()=>{ S.guessed=null; render(); $('#q').focus(); showCities(); };
}
function askState(){''')
R('''    if($('#mWel') && $('#mWel').classList.contains('on')){ closeWelcome(); if(!store.get('last')) askState(); return; }''',
  '''    if($('#mWel') && $('#mWel').classList.contains('on')){ closeWelcome(); afterWelcome(); return; }''')
R('''      $$('#mWel [data-close]').forEach(x=>x.addEventListener('click',()=>{ closeWelcome(); if(!store.get('last')) askState(); }));''',
  '''      $$('#mWel [data-close]').forEach(x=>x.addEventListener('click',()=>{ closeWelcome(); afterWelcome(); }));''')
R('''  el.innerHTML = needHTML() + nowCard + wxHTML()''','''  el.innerHTML = guessHTML() + needHTML() + nowCard + wxHTML()''')
R('''  wireNeed(); wireFav(); wirePlan(); wireCatTip(); wireWx(); wireHelpLine();''','''  wireNeed(); wireFav(); wirePlan(); wireCatTip(); wireWx(); wireHelpLine(); wireGuess();''')

# ---------- UX4: nombre de la ciudad en tu idioma ----------
R('''function cityForCC(cc){''','''/* «London» para quien lee espanol es «Londres». Los nombres vienen de
   OpenStreetMap (name:xx) y viajan en el fichero del idioma. */
const CITY_L = {};
function cityName(c){ if(!c) return ''; const m=CITY_L[LANG]; return (m && m[c[0]]) || c[0]; }
function cityForCC(cc){''')
R('''    if(j['for']) FOR_LBL[c]=j['for'];
    try{''','''    if(j['for']) FOR_LBL[c]=j['for'];
    if(j.cities) CITY_L[c]=j.cities;
    try{''')
R('''    if(cached['for']) FOR_LBL[c]=cached['for'];
    return;''','''    if(cached['for']) FOR_LBL[c]=cached['for'];
    if(cached.cities) CITY_L[c]=cached.cities;
    return;''')
R('''  setCenter(c[1],c[2],c[0]);
  if(map) map.setView([c[1],c[2]],14,{animate:true});''','''  setCenter(c[1],c[2],cityName(c));
  if(map) map.setView([c[1],c[2]],14,{animate:true});''')
R('''            '<button class="btn btn--ghost" data-city="'+CITIES.indexOf(c)+'">'+esc(c[0])+(S.center?''','''            '<button class="btn btn--ghost" data-city="'+CITIES.indexOf(c)+'">'+esc(cityName(c))+(S.center?''')
R('''         '<button class="btn btn--ghost" data-city="'+i+'">'+esc(c[0])+'</button>').join('')+'</div></div>\'''','''         '<button class="btn btn--ghost" data-city="'+i+'">'+esc(cityName(c))+'</button>').join('')+'</div></div>\'''')
R('''    +'<div class="citybtns">'+picks.map(c=>'<button class="btn btn--ghost" data-cityn="'+esc(c[0])+'">'+esc(c[0])+'</button>').join('')+'</div>';''',
  '''    +'<div class="citybtns">'+picks.map(c=>'<button class="btn btn--ghost" data-cityn="'+esc(c[0])+'">'+esc(cityName(c))+'</button>').join('')+'</div>';''')

# ---------- UX5: el aviso «funciona sin cobertura», no en la primera visita ----------
R('''  if(!offlineNote._ok && !store.get('visited')){
    if(!offlineNote._armed){
      offlineNote._armed=1;
      const go=()=>{ offlineNote._ok=1; document.removeEventListener('pointerup',go,true); setTimeout(offlineNote, 2500); };
      document.addEventListener('pointerup',go,true);
      setTimeout(()=>{ if(!offlineNote._ok){ offlineNote._ok=1; offlineNote(); } }, 40000);
    }
    return;
  }''','''  // La primera visita es para encontrar comida o cama, no para leer sobre la
  // app: el aviso sale a partir de la segunda vez que se abre.
  if(!store.get('visited')) return;''')

# ---------- UX6 y F28: lo urgente segun la hora (y el frio o el calor), dentro de cada franja ----------
R('''function sortPlaces(){
  if(!S.center) return;
  S.places.forEach(p=>{ p.d = dist(S.center.lat,S.center.lon,p.lat,p.lon); p.rk = p.d + (officeLike(p)?900:0) + confBoost(p); });
  S.places.sort((a,b)=>a.rk-b.rk);
}''','''/* Dentro de cada franja de distancia (menos de 10 min, 10-30 min, mas lejos)
   va primero lo que hace falta a esta hora: de noche una cama, a la hora de
   comer un comedor; con frio extremo un sitio caliente y con calor, agua. Los
   grupos de sitios sin nombre (aseos, fuentes) ceden ante los servicios con
   nombre. Nunca se salta de franja: la distancia sigue mandando. */
function urgencyBoost(p){
  const h=new Date().getHours(); let b=0;
  if(h>=19 || h<8){ if(p.cat==='shelter') b-=500; }
  if((h>=12 && h<15) || (h>=19 && h<22)){ if(p.cat==='food') b-=350; }
  if(h>=7 && h<11){ if(p.cat==='food') b-=200; if(p.cat==='hygiene' && !p.auto) b-=200; }
  if(WX && WX.a!=null){
    if(WX.a<=3 && p.cat==='warm') b-=450;
    if(WX.a<=3 && p.cat==='shelter') b-=250;
    if(WX.a>=33 && (p.cat==='water' || p.cat==='warm')) b-=350;
  }
  if(p.auto) b+=250;
  return b;
}
function bandIdx(d){ return d==null?0 : d<800?0 : d<2400?1 : 2; }
function sortPlaces(){
  if(!S.center) return;
  S.places.forEach(p=>{ p.d = dist(S.center.lat,S.center.lon,p.lat,p.lon); p.rk = bandIdx(p.d)*1e7 + p.d + (officeLike(p)?900:0) + confBoost(p) + urgencyBoost(p); });
  S.places.sort((a,b)=>a.rk-b.rk);
}''')

# ---------- UX8: la calle tambien para los sitios sin nombre ----------
R('''  if(!p.addr && !p.auto) fillAddr(p);
  else if(!p.addr){ const da=$('#dAddr'); if(da){ da.textContent=p.lat.toFixed(5)+', '+p.lon.toFixed(5); da.style.color=''; } }''',
  '''  // Antes los sitios sin nombre (aseos, fuentes) ensenaban unas coordenadas como
  // direccion. Ahora tambien se pregunta la calle al abrir la ficha.
  if(!p.addr) fillAddr(p);''')

# ---------- UX9: cabecera corta ----------
R('''    + (S.placeName ? t('ui.usingcity',{p:S.placeName}) : t('ui.found',{n:v.length,d:km(v[0].d||0)})));''',
  '''    + (S.placeName ? S.placeName.split(',')[0]+' · '+t('ui.results',{n:v.length}) : t('ui.found',{n:v.length,d:km(v[0].d||0)})));''')

# ---------- UX11: estado vacio con «ver todo» ----------
R('''      + (narrowed?'<button class="btn btn--ghost" id="clearWho">'+esc(t('ui.clearwho'))+'</button>':'')''',
  '''      + (narrowed?'<button class="btn btn--ghost" id="clearWho">'+esc(t('ui.clearwho'))+'</button>':'')
      + ((S.filters.size<DEFAULT_FILTERS.length || S.openOnly)?'<button class="btn btn--primary" id="allCats" style="margin-inline-start:6px">'+esc(t('ui.allcats'))+'</button>':'')''')
R('''    const cw=$('#clearWho'); if(cw) cw.onclick=()=>{ S.who.clear(); buildFilters(); render(); };
    return;''','''    const cw=$('#clearWho'); if(cw) cw.onclick=()=>{ S.who.clear(); buildFilters(); render(); };
    const ac=$('#allCats'); if(ac) ac.onclick=()=>{ S.filters=new Set(DEFAULT_FILTERS); S.openOnly=false; S.prefSub=''; buildFilters(); render(); };
    return;''')

# ---------- UX13: pastillas de 44 px en pantallas tactiles ----------
R('''.chip{flex:0 0 auto}''','''.chip{flex:0 0 auto}
@media (pointer:coarse){ .chip{min-height:44px} }''')

# ---------- UX14: recordar los filtros ----------
R('''function render(){
  renderMarkers();''','''function saveFlt(){
  if(!S.fltReady || EMBED || KIOSK) return;
  try{ store.set('flt',{c:[...S.filters],o:!!S.openOnly,w:[...S.who]}); }catch(e){}
}
function render(){
  saveFlt();
  renderMarkers();''')
R('''  decodeAll();
  S.places = PLACES;
  const last = store.get('last');''','''  decodeAll();
  S.places = PLACES;
  // los filtros de la ultima vez (si no se llega con uno puesto en el enlace)
  try{
    const qq=new URLSearchParams(location.search), f=store.get('flt');
    if(f && !qq.get('need') && !qq.get('now') && !EMBED && !KIOSK && Array.isArray(f.c) && f.c.length){
      const ok=f.c.filter(x=>CATIDS.includes(x)); if(ok.length) S.filters=new Set(ok);
      S.openOnly=!!f.o; S.who=new Set((f.w||[]).filter(x=>WHO[x]));
    }
  }catch(e){}
  S.fltReady=true;
  const last = store.get('last');''')

# ---------- UX16: en el buscador, «usar mi ubicacion» lo primero ----------
R('''function showCities(){
  const ac=$('#ac');''','''function showCities(){
  const ac=$('#ac');
  setTimeout(()=>{ const ac2=$('#ac'); if(!ac2 || ac2.querySelector('[data-me]')) return;
    const b=document.createElement('button'); b.setAttribute('role','option'); b.dataset.me='1'; b.className='ac-me';
    b.innerHTML='<svg class="icon icon--s" viewBox="0 0 24 24" style="float:inline-start;margin-inline-end:9px"><circle cx="12" cy="12" r="3.2"/><path d="M12 2v3.2M12 18.8V22M22 12h-3.2M5.2 12H2"/><circle cx="12" cy="12" r="8"/></svg>'+esc(t('wel.loc'));
    b.onclick=()=>{ ac2.classList.remove('on'); $('#q').blur(); document.body.classList.remove('qfocus'); S.guessed=null; geolocate(true); };
    ac2.prepend(b); },0);''')
R('''    + CITIES.slice(0,12).map((c,i)=>'<button role="option" data-city="'+i+'">'+esc(c[0])''','''    + CITIES.slice(0,12).map((c,i)=>'<button role="option" data-city="'+i+'">'+esc(cityName(c))''')
R('''rec.map(i=>'<button role="option" data-city="'+i+'">'+esc(CITIES[i][0])''','''rec.map(i=>'<button role="option" data-city="'+i+'">'+esc(cityName(CITIES[i]))''')

io.open(p,'w',encoding='utf-8').write(s); print('p1 ok')
