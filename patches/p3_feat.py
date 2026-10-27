import io
p='/home/claude/supportnear/index.template.html'; s=io.open(p,encoding='utf-8').read()
def R(a,b,cnt=1):
    global s
    n=s.count(a); assert n==cnt,(n,a[:90]); s=s.replace(a,b)

# ===== F1/F3: cargar el movil, lavanderia gratis, taquillas, oficinas de extranjeria =====
R('''    +'nwr["amenity"="toilets"]["fee"="no"]'+b+';'
    +');out center tags 300;';''','''    +'nwr["amenity"="toilets"]["fee"="no"]'+b+';'
    +'nwr["amenity"="device_charging_station"]'+b+';'
    +'nwr["amenity"="locker"]["fee"="no"]'+b+';'
    +'nwr["shop"="laundry"]["fee"="no"]'+a+';'
    +'nwr["office"="government"]["government"~"^(immigration|migration)$"]'+a+';'
    +');out center tags 320;';''')
R('''  if(am==='toilets') return 'hygiene';''','''  if(am==='toilets') return 'hygiene';
  if(am==='device_charging_station') return 'warm';
  if(sh==='laundry' && g.fee==='no') return 'hygiene';
  if(am==='locker' && g.fee==='no') return 'social';
  if(of==='government' && /^(immigration|migration)$/.test(g.government||'')) return 'legal';''')
R('''function subKey(g){
  return g.social_facility || (g.shop==='charity'?'charity':'') || g.office || g.amenity || 'social_facility';''','''function subKey(g){
  if(g.office==='government' && /^(immigration|migration)$/.test(g.government||'')) return 'immigration';
  if(g.shop==='laundry') return 'laundry';
  return g.social_facility || (g.shop==='charity'?'charity':'') || g.office || g.amenity || 'social_facility';''')
R('''   social_facility:'Social services'},''','''   social_facility:'Social services',device_charging_station:'Phone charging point',laundry:'Free laundry',locker:'Free lockers',immigration:'Immigration & asylum office'},''')
R('''   social_facility:'Servicios sociales'},''','''   social_facility:'Servicios sociales',device_charging_station:'Punto para cargar el móvil',laundry:'Lavandería gratuita',locker:'Taquillas gratuitas',immigration:'Oficina de extranjería y asilo'},''')

# ===== F4: mas «para quien» =====
R('''  homeless:['homeless','homless','underprivileged','unemployed']
};''','''  homeless:['homeless','homless','underprivileged','unemployed'],
  youth:['juvenile','young','youth','teenager'],
  lgbtq:['lgbtq','lgbt','lgbtq+','queer'],
  senior:['senior','elderly'],
  disabled:['disabled','disability']
};''')
R('''const WHO_KEYS=['women','family','migrant','homeless'];''','''const WHO_KEYS=['women','family','migrant','homeless','youth','lgbtq','senior','disabled'];''')

# ===== F5: festivos =====
R('''function ohStatus(str){
  if(!str) return {s:'unknown'};''','''/* Festivos nacionales (holidays.json, un fichero pequeno que se pide una vez):
   con eso «PH off» deja de ser una duda. Si hoy es fiesta y el sitio no dice
   nada de festivos, se avisa de que el horario puede cambiar. */
let HOL=null, holLoading=false;
function loadHol(){ if(HOL||holLoading) return; holLoading=true;
  fetch('holidays.json?v='+DATA_V).then(r=>r.ok?r.json():{}).then(j=>{ HOL=j||{}; if(S.places.length && phToday()){ OH_MEM_CLEAR(); render(); } }).catch(()=>{ holLoading=false; }); }
function phToday(){
  const cc=S.country||S.guessCC||''; if(!HOL || !cc || !HOL[cc]) return false;
  const d=new Date(), y=d.getFullYear(), md=String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');
  const part=HOL[cc].split('|').find(x=>x.indexOf(y+':')===0); return !!(part && part.slice(5).split(',').includes(md));
}
function OH_MEM_CLEAR(){ for(const k in OH_MEM) delete OH_MEM[k]; }
function ohStatus(str){
  if(!str) return {s:'unknown'};
  const PH=phToday();''')
R('''    // reglas de dias festivos, semanas concretas o pascua: no sabemos si hoy toca
    if(/\\b(ph|sh|easter)\\b/.test(rule) || /\\bweek\\b/.test(rule) || /\\[/.test(rule)) { fuzzy=true; continue; }''','''    // «PH off» / «PH 10:00-14:00»: si sabemos que hoy es festivo, la regla manda;
    // si hoy no lo es, no aplica. Vacaciones escolares, semanas o pascua: duda.
    let phRule=false;
    if(/^ph\\b/.test(rule) && !/\\b(sh|easter)\\b/.test(rule) && !/\\bweek\\b/.test(rule) && !/\\[/.test(rule) && HOL){
      if(!PH) continue;
      phRule=true; rule=rule.replace(/^ph\\b\\s*,?\\s*/,'');
    }
    else if(/\\b(ph|sh|easter)\\b/.test(rule) || /\\bweek\\b/.test(rule) || /\\[/.test(rule)) { fuzzy=true; continue; }''')
R('''    const dayPart=(m[1]||'').replace(/\\s/g,''), timePart=(m[2]||'').replace(/\\s/g,''), flag=m[3]||'';
    let days=[], bad=false;
    if(!dayPart){ days=[0,1,2,3,4,5,6]; }''','''    const dayPart=phRule?'':(m[1]||'').replace(/\\s/g,''), timePart=(m[2]||'').replace(/\\s/g,''), flag=m[3]||'';
    let days=[], bad=false;
    if(phRule){ open=false; }
    if(!dayPart){ days=[0,1,2,3,4,5,6]; }''')
R('''  if(known) return {s:open?'open':'closed'};''','''  if(known) return {s:open?'open':'closed', hol:PH && !/\\bph\\b/.test(v)};''')
R('''function statusTag(p){
  const st=ohStatus(p.oh).s;''','''function statusTag(p){
  const os=ohStatus(p.oh), st=os.s;
  if(os.hol && (st==='open'||st==='closed')) return '<span class="tag tag--soon" title="'+esc(t('hol.p'))+'">'+esc(t('hol.tag'))+'</span>';''')

# ===== F13: modo quiosco (bibliotecas, albergues) =====
R('''const EMBED = (()=>{''','''/* ?kiosk=1: pantalla de biblioteca o de albergue. Letra grande, nada se guarda
   (ni favoritos ni busquedas), sin bienvenida ni instalar, y a los 3 minutos sin
   tocar vuelve sola al principio para la siguiente persona. */
const KIOSK = (()=>{ try{ return new URLSearchParams(location.search).get('kiosk')==='1'; }catch(e){ return false; } })();
const EMBED = (()=>{''')
R('''function shouldWelcome(){
  if(EMBED) return false;''','''function shouldWelcome(){
  if(EMBED || KIOSK) return false;''')
R('''function recentAdd(c){
  if(RO) return;''','''function recentAdd(c){
  if(RO || KIOSK) return;''')
R('''  if(store.get('calm')) document.documentElement.classList.add('calm');''','''  if(store.get('calm')) document.documentElement.classList.add('calm');
  if(KIOSK){
    document.documentElement.classList.add('big','kiosk');
    let kt=null; const reset=()=>{ clearTimeout(kt); kt=setTimeout(()=>{
      try{ closeModals(); closeDetail(); $('#q').value=''; $('#ac').classList.remove('on'); S.filters=new Set(DEFAULT_FILTERS); S.openOnly=false; S.who.clear(); S.now=false; S.prefSub='';
        buildFilters(); render(); $('#list').scrollTop=0; if(window.speechSynthesis) speechSynthesis.cancel(); }catch(e){}
    },180000); };
    ['pointerdown','keydown','touchstart'].forEach(ev=>document.addEventListener(ev,reset,{passive:true,capture:true})); reset();
  }''')
R('''function toggleFav(p){
  buzz(20);''','''function toggleFav(p){
  if(KIOSK){ toast(t('kiosk.nosave')); return false; }
  buzz(20);''')
R('''.toast .toast-act{''','''html.kiosk .menubtn,html.kiosk #themeBtn{display:none}
.toast .toast-act{''')

# ===== F14: nota privada por sitio + F26: exportar datos =====
R('''    +'<div class="note">'+t('ui.note')+'</div>\'''','''    +(KIOSK?'':'<details class="mynote"'+(store.get('note:'+p.id)?' open':'')+'><summary>'+esc(t('mynote.h'))+'</summary>'
      +'<textarea id="myNote" rows="3" maxlength="600" placeholder="'+esc(t('mynote.ph'))+'">'+esc(store.get('note:'+p.id)||'')+'</textarea>'
      +'<p class="mynote-p">'+esc(t('mynote.p'))+'</p></details>')
    +'<div class="note">'+t('ui.note')+'</div>\'''')
R('''  const sp=$('#speakBtn'); if(sp) sp.onclick=()=>speakPlace(p);''','''  const sp=$('#speakBtn'); if(sp) sp.onclick=()=>speakPlace(p);
  const mn=$('#myNote'); if(mn){ let nt=null; mn.oninput=()=>{ clearTimeout(nt); nt=setTimeout(()=>{ const v=mn.value.trim(); if(v) store.set('note:'+p.id,v); else store.del?store.del('note:'+p.id):store.set('note:'+p.id,''); },400); }; }''')

R('''function mi(icon){''','''/* Datos abiertos: lo que hay cargado alrededor, en CSV (para una hoja de
   calculo) o GeoJSON (para un mapa), con la licencia de OpenStreetMap. Lo
   piden trabajadores sociales, periodistas e investigadores. Sin servidor. */
function exportRows(){
  const v=S.places.filter(p=>p.d!=null && p.d<=MAXD && S.filters.has(p.cat));
  return v.slice(0,3000);
}
function exportData(){
  const rows=exportRows(); if(!rows.length){ toast(t('ui.none')); return; }
  $('#sheetBody').innerHTML='<p>'+esc(t('data.p',{n:rows.length}))+'</p>'
    +'<div class="verbtns" id="sheetBtns"><button type="button" class="btn btn--primary" id="dCsv">CSV</button><button type="button" class="btn btn--ghost" id="dGeo">GeoJSON</button></div>'
    +'<p style="font-size:12.5px;color:var(--ink-3);margin-top:12px">'+esc(t('data.lic'))+'</p>';
  $('#sheetT').textContent=t('data.menu');
  const save=(txt,name,type)=>{ const b=new Blob([txt],{type}); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),4000); toast(t('share.made')); };
  const slug=(S.placeName||'supportnear').split(',')[0].toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'supportnear';
  $('#dCsv').onclick=()=>{
    const q=x=>'"'+String(x==null?'':x).replace(/"/g,'""')+'"';
    const head=['name','type','category','lat','lon','address','phone','opening_hours','website','distance_m','osm_id'];
    const lines=[head.join(',')].concat(rows.map(p=>[pname(p),subLabel(p.sub)||'',p.cat,p.lat.toFixed(6),p.lon.toFixed(6),p.addr||'',p.phone||'',p.oh||'',p.web||'',Math.round(p.d||0),p.id].map(q).join(',')));
    save('\\ufeff'+lines.join('\\n')+'\\n',slug+'.csv','text/csv;charset=utf-8'); };
  $('#dGeo').onclick=()=>{
    const fc={type:'FeatureCollection',license:'ODbL 1.0 — © OpenStreetMap contributors',features:rows.map(p=>({type:'Feature',geometry:{type:'Point',coordinates:[+p.lon.toFixed(6),+p.lat.toFixed(6)]},
      properties:{name:pname(p),type:p.sub||'',category:p.cat,address:p.addr||'',phone:p.phone||'',opening_hours:p.oh||'',website:p.web||'',osm_id:p.id}}))};
    save(JSON.stringify(fc),slug+'.geojson','application/geo+json'); };
  $('#mSheet').classList.add('on'); document.body.style.overflow='hidden';
}
/* Tarjeta de bolsillo: los cinco sitios basicos mas cercanos y el numero de
   emergencias, ocho veces en un folio para recortar y repartir. */
function openPocket(){
  const pickOne=cat=>S.places.filter(p=>p.cat===cat && p.d!=null && p.d<=MAXD && !p.auto).sort((a,b)=>a.d-b.d)[0];
  const list=['food','shelter','hygiene','health','social'].map(pickOne).filter(Boolean);
  if(!list.length){ toast(t('ui.none')); return; }
  const cc=S.country||S.guessCC||''; const e=emgFor(cc);
  const one='<div class="pk"><div class="pk-h"><b>SupportNear</b><span>'+esc((S.placeName||'').split(',')[0])+'</span></div><ul>'
    +list.map(p=>'<li><b>'+esc(t('cat.'+p.cat+'.n'))+':</b> '+esc(pname(p))+(p.addr?' — '+esc(p.addr.split(',')[0]):'')+(p.phone?' · '+esc(fmtPhone(p.phone)):'')+'</li>').join('')
    +'</ul><div class="pk-f">'+esc(t('sos.gen'))+': <b>'+esc(e.gen)+'</b> · supportnear.com</div></div>';
  $('#sheetT').textContent=t('pocket.menu');
  $('#sheetBody').innerHTML='<p style="font-size:14px;color:var(--ink-2)">'+esc(t('pocket.p'))+'</p><div class="pocket" id="sheet">'+Array(8).fill(one).join('')+'</div>'
    +'<div class="verbtns" id="sheetBtns"><button type="button" class="btn btn--primary" id="pkPrint">'+esc(t('ui.print'))+'</button></div>';
  $('#pkPrint').onclick=()=>{ document.body.classList.add('printsheet'); setTimeout(()=>{ window.print(); setTimeout(()=>document.body.classList.remove('printsheet'),800); },60); };
  $('#mSheet').classList.add('on'); document.body.style.overflow='hidden';
}
function mi(icon){''')
R('''.toast .toast-act{''','''.mynote{margin:14px 0 4px;border:1px dashed var(--line-2);border-radius:var(--r-s);padding:4px 12px 10px}
.mynote summary{cursor:pointer;padding:10px 0;font-weight:600;font-size:14px;min-height:44px;display:flex;align-items:center}
.mynote textarea{width:100%;font:inherit;font-size:15px;border:1px solid var(--line-2);border-radius:8px;padding:8px;background:var(--paper);color:var(--ink);resize:vertical}
.mynote-p{font-size:12px;color:var(--ink-3);margin-top:6px}
.pocket{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}
.pk{border:1px dashed #999;padding:8px 10px;font-size:11px;line-height:1.35;color:#111;background:#fff;break-inside:avoid}
.pk-h{display:flex;justify-content:space-between;gap:6px;margin-bottom:4px}.pk-h b{color:#0B7A63}
.pk ul{margin:0;padding-inline-start:14px}.pk li{margin:0 0 2px}.pk-f{margin-top:5px;font-size:10.5px}
@media print{ .pocket{gap:0} .pk{height:62mm;overflow:hidden} }
.compass{display:flex;align-items:center;gap:14px;border:1px solid var(--line);border-radius:var(--r-m);padding:12px 14px;margin:6px 0 12px;background:var(--paper-3)}
.cmp-ar{width:56px;height:56px;border-radius:50%;background:var(--brand);display:grid;place-items:center;flex:none;transition:transform .25s}
.cmp-ar svg{width:30px;height:30px;stroke:#fff;fill:none;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
.compass b{font-size:20px;display:block}.compass span{font-size:12.5px;color:var(--ink-3)}
.toast .toast-act{''')

# ===== F9: brujula sin datos =====
R('''    +'<div id="stepsBox"></div>\'''','''    +(S.gps?'<div class="compass" id="cmpBox" hidden><div class="cmp-ar" id="cmpAr"><svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg></div><div><b id="cmpD"></b><span>'+esc(t('cmp.p'))+'</span></div></div>'
      +'<button type="button" class="btn btn--ghost btn--block" id="cmpBtn" style="margin-bottom:8px">'+esc(t('cmp.btn'))+'</button>':'')
    +'<div id="stepsBox"></div>\'''')
R('''  const fw=$('#followBtn'); if(fw) fw.onclick=()=>{ if(followId===p.id) stopFollow(); else startFollow(p); select(p,true); };''','''  const fw=$('#followBtn'); if(fw) fw.onclick=()=>{ if(followId===p.id) stopFollow(); else startFollow(p); select(p,true); };
  const cb=$('#cmpBtn'); if(cb) cb.onclick=()=>{ cmpFor=p; startCompass(); $('#cmpBox').hidden=false; cb.hidden=true; cmpDraw();
    if(navigator.geolocation && followId!==p.id) startFollow(p); };
  if(cmpFor && cmpFor.id===p.id && $('#cmpBox')){ $('#cmpBox').hidden=false; if(cb) cb.hidden=true; cmpDraw(); }''')
R('''let compassH=null;
function onCompass(e){''','''/* Brujula: una flecha grande que apunta al sitio y los metros que faltan. El
   GPS y la brujula del movil funcionan sin datos, asi que sirve aunque el mapa
   no cargue. */
let cmpFor=null;
function bearingDeg(a,b){ const toR=Math.PI/180, la1=a.lat*toR, la2=b.lat*toR, dl=(b.lon-a.lon)*toR;
  const y=Math.sin(dl)*Math.cos(la2), x=Math.cos(la1)*Math.sin(la2)-Math.sin(la1)*Math.cos(la2)*Math.cos(dl);
  return (Math.atan2(y,x)*180/Math.PI+360)%360; }
function cmpDraw(){
  if(!cmpFor || !S.center) return; const ar=$('#cmpAr'), d=$('#cmpD'); if(!ar||!d) return;
  const br=bearingDeg(S.center,cmpFor), rot=compassH!=null ? br-compassH : br;
  ar.style.transform='rotate('+Math.round(rot)+'deg)';
  d.textContent=km(dist(S.center.lat,S.center.lon,cmpFor.lat,cmpFor.lon))+(compassH==null?' · '+t('cmp.north'):'');
}
let compassH=null;
function onCompass(e){''')
R('''  if(compassH!=null && Math.abs(h-compassH)<4) return; compassH=h;''','''  if(compassH!=null && Math.abs(h-compassH)<4) return; compassH=h; cmpDraw();''')
R('''    drawRoute(p);
    try{ if(!map.getBounds().contains([la,lo])) map.panTo([la,lo],{animate:true}); }catch(e){}''','''    drawRoute(p); cmpDraw();
    try{ if(!map.getBounds().contains([la,lo])) map.panTo([la,lo],{animate:true}); }catch(e){}''')

# ===== F10: avisame cuando abra =====
R('''  stepsBox(p);
  armAlarm(p);''','''  stepsBox(p);
  armAlarm(p);
  { const st2=ohStatus(p.oh); const nx=p.oh?ohNext(p.oh):null;
    if(st2.s==='closed' && nx && nx.open && !KIOSK){
      const mins=nx.day*1440+nx.at-(new Date().getHours()*60+new Date().getMinutes());
      if(mins>0 && mins<=16*60){
        const box=document.createElement('button'); box.type='button'; box.className='btn btn--ghost btn--block'; box.id='openAlarm'; box.style.marginBottom='8px';
        box.textContent=t('openalarm.btn'); const acts=$('#dBody .actions'); if(acts) acts.after(box);
        box.onclick=async()=>{ try{ if('Notification' in window && Notification.permission==='default') await Notification.requestPermission(); }catch(e){}
          clearTimeout(window.__oa); window.__oa=setTimeout(()=>{ const msg=t('openalarm.now',{p:pname(p)}); toast(msg); buzz([200,100,200]);
            try{ if('Notification' in window && Notification.permission==='granted') new Notification('SupportNear',{body:msg}); }catch(e){} }, mins*60000);
          box.disabled=true; box.textContent=t('openalarm.set'); toast(t('openalarm.note')); };
      }
    } }''')

# ===== F11: compartir un sitio como imagen (con QR) =====
R('''      +'<button class="btn btn--ghost" id="shareBtn">'+t('ui.share')+'</button>\'''','''      +'<button class="btn btn--ghost" id="shareBtn">'+t('ui.share')+'</button>'
      +(KIOSK?'':'<button class="btn btn--ghost" id="shareImg">'+esc(t('share.img'))+'</button>')''')
R('''  const shb=$('#showBtn'); if(shb) shb.onclick=()=>openShow(p);''','''  const shb=$('#showBtn'); if(shb) shb.onclick=()=>openShow(p);
  const si=$('#shareImg'); if(si) si.onclick=()=>{ tally('share','img'); makePlaceCard(p); };''')
R('''const FONT_UI = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';''','''const FONT_UI = 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
/* La ficha de un sitio en una imagen: nombre, tipo, calle, horario de hoy,
   telefono y un QR que abre la ficha. En WhatsApp se lee sin abrir nada, y se
   puede ensenar en el movil a un conductor o a un policia. */
let QRLIB=null;
function loadQR(){ if(QRLIB) return Promise.resolve(QRLIB); return new Promise(res=>{ const sc=document.createElement('script'); sc.src='qr.js?v='+DATA_V; sc.onload=()=>{ QRLIB=window.qrcode||null; res(QRLIB); }; sc.onerror=()=>res(null); document.head.appendChild(sc); }); }
async function makePlaceCard(p){
  const W=1080, H=1350, cv=document.createElement('canvas'); cv.width=W; cv.height=H;
  const g=cv.getContext('2d'); const rtl=document.documentElement.dir==='rtl';
  const paper='#FAF7F2', ink='#14110E', green='#0D6B57', col=CATMAP[p.cat].color;
  g.fillStyle=paper; g.fillRect(0,0,W,H);
  g.fillStyle=col; g.fillRect(0,0,W,22);
  g.fillStyle=green; roundRect(g,80,90,72,72,20); g.fill();
  g.fillStyle=ink; g.font='700 40px '+FONT_UI; g.textBaseline='alphabetic'; g.direction=rtl?'rtl':'ltr';
  g.textAlign='left'; g.fillText('SupportNear',172,140);
  g.fillStyle=ink; g.font='800 76px '+FONT_UI;
  let y=wrapText(g,pname(p),80,320,W-160,88);
  const typ=p.auto?'':(subLabel(p.sub)||t('cat.'+p.cat+'.n'));
  g.fillStyle=col; g.font='600 40px '+FONT_UI; if(typ){ y=wrapText(g,typ,80,y+30,W-160,50); }
  g.fillStyle=ink; g.font='400 40px '+FONT_UI;
  const addr=p.addr||ADDR_MEM['addr:'+p.id]||'';
  const lines=[];
  if(addr) lines.push('📍 '+addr);
  if(p.oh){ const td=p.oh.trim()==='24/7'?'24/7':ohToday(p.oh); lines.push('🕒 '+(td?t('ui.today')+': '+td:ohHuman(p.oh))); }
  if(p.phone) lines.push('📞 '+fmtPhone(p.phone));
  lines.forEach(l=>{ y=wrapText(g,l,80,y+40,W-160,52); });
  const url=shareHome()+'#p='+encodeURIComponent(p.id)+'@'+p.lat.toFixed(5)+','+p.lon.toFixed(5);
  const Q=await loadQR();
  if(Q){ try{ const qr=Q(0,'M'); qr.addData(url); qr.make(); const n=qr.getModuleCount(), size=300, cell=size/n, x0=W-80-size, y0=H-80-size;
      g.fillStyle='#fff'; g.fillRect(x0-16,y0-16,size+32,size+32); g.fillStyle='#000';
      for(let r=0;r<n;r++) for(let c=0;c<n;c++) if(qr.isDark(r,c)) g.fillRect(x0+c*cell,y0+r*cell,Math.ceil(cell),Math.ceil(cell)); }catch(e){} }
  g.fillStyle=green; g.font='600 38px '+FONT_UI; g.fillText('supportnear.com',80,H-110);
  g.fillStyle=ink; g.globalAlpha=.55; g.font='400 30px '+FONT_UI; g.fillText(t('foot.tag').split('.')[0]+'.',80,H-160); g.globalAlpha=1;
  const blob=await new Promise(r=>cv.toBlob(r,'image/png')); if(!blob) return;
  const file=new File([blob],'supportnear-'+(p.id||'').replace(/\\W/g,'')+'.png',{type:'image/png'});
  try{ if(navigator.canShare && navigator.canShare({files:[file]})){ await navigator.share({files:[file],text:pname(p)+' — '+url}); return; } }catch(e){ if(e && e.name==='AbortError') return; }
  const u=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=u; a.download=file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),4000); toast(t('share.made'));
}''')

# ===== F8: guardar tu zona sola con wifi =====
R('''async function delSaved(i, redraw){''','''/* Con la app instalada y en wifi, la zona de 2 km alrededor se guarda sola una
   vez por semana, sin preguntar: asi la noche que se acaban los datos ya esta.
   Nunca con datos moviles, ni con «ahorrar datos», ni si ya esta guardada. */
async function autoSave(){
  try{
    if(KIOSK || EMBED || dlBusy || !S.center || !isStandalone() || !('caches' in window)) return;
    const cn=navigator.connection; if(!cn || cn.type!=='wifi' || cn.saveData) return;
    const wk=Math.floor(Date.now()/(7*864e5)); if(store.get('autodl')===wk) return;
    if(savedList().some(z=>dist(z.lat,z.lon,S.center.lat,S.center.lon)<1500 && Date.now()-z.t<14*864e5)) return;
    store.set('autodl',wk); dlBusy=true;
    const c={lat:S.center.lat,lon:S.center.lon};
    const urls=dataUrls(c.lat,c.lon,dlZones.z1.km).concat(tileUrls(c.lat,c.lon,dlZones.z1.km,dlZones.z1.z));
    const cache=await caches.open(SAVED_CACHE); let bytes=0, ok=0;
    for(const u of urls){ if(navigator.connection && navigator.connection.type!=='wifi') break;
      try{ const isTile=/arcgisonline\\.com|tile\\.openstreetmap\\.org/.test(u); const r=await fetch(isTile?u+(u.indexOf('?')>-1?'&':'?')+'dl=1':u,{cache:'reload'});
        if(r&&r.ok){ const cl=r.headers.get('content-length'); bytes+=cl?+cl:20000; await cache.put(u,r.clone()); ok++; } }catch(e){ break; } }
    dlBusy=false;
    if(ok>20){ const list=savedList(); const name=(S.placeName||'').split(',')[0]||t('ui.nearby');
      list.unshift({n:name,s:mb(bytes/1024),t:Date.now(),lat:+c.lat.toFixed(4),lon:+c.lon.toFixed(4),z:'z1',auto:1});
      savedSave(list.filter((z,i,a)=>a.findIndex(y=>y.n===z.n&&y.z===z.z)===i)); toast(t('dl.auto',{p:name})); }
  }catch(e){ dlBusy=false; }
}
async function delSaved(i, redraw){''')

# ===== F24: widget con el color de quien lo pone =====
R('''function applyEmbed(){
  if(!EMBED) return;
  document.body.classList.add('is-embed');''','''function applyEmbed(){
  if(!EMBED) return;
  document.body.classList.add('is-embed');
  // ?color=0B7A63: el color de la web que lo inserta (solo un hex, nada mas)
  try{ const col=(new URLSearchParams(location.search).get('color')||'').replace(/^#/,'');
    if(/^[0-9a-fA-F]{6}$/.test(col)){ document.documentElement.style.setProperty('--brand','#'+col); document.documentElement.style.setProperty('--brand-ink','#'+col); } }catch(e){}''')

io.open(p,'w',encoding='utf-8').write(s); print('p3 ok')
