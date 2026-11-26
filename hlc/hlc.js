document.documentElement.classList.add('hlc-js');
/* Happy Low Cost — script global (marca 2026) */
(function(){
  'use strict';
  var d=document, w=window;
  var API='https://gmdalfsvtfhzepyrdmjj.supabase.co/functions/v1/hlc-deals';
  var EN=(d.documentElement.lang||'').slice(0,2)==='en';function T(es,en){return EN?en:es;}
  /* Solo enlaces de CJ (sitio Happy Low Cost, PID 101900924) */
  var CJ=function(aid,u){return 'https://www.kqzyfj.com/click-101900924-'+aid+'?sid=happylowcost&url='+encodeURIComponent(u);};
  var AID={hotel:'17288959',flight:'17288982',attr:'17288984',taxi:'17322565',car:'12506471',paris:'11585459'};
  var L={
    vuelos: CJ(AID.flight,'https://www.booking.com/flights/index.es.html'),
    hoteles: CJ(AID.hotel,'https://www.booking.com/index.es.html'),
    coches: 'https://www.discovercars.com/'+(EN?'':'es')+'?a_aid=happylowcost&data1=happylowcost-box',
    tours: CJ(EN?'15084019':'15084034',EN?'https://www.getyourguide.com/':'https://www.getyourguide.es/'),
    traslados: CJ(EN?'15084019':'15084034',EN?'https://www.getyourguide.com/s/?q=airport%20transfer':'https://www.getyourguide.es/s/?q=traslado%20aeropuerto'),
    paris: CJ(AID.paris,'https://www.pariscityvision.com/es')
  };
  w.HLC={API:API,CJ:CJ,AID:AID,L:L};
  function hotelsIn(city){return city?CJ(AID.hotel,'https://www.booking.com/searchresults.es.html?ss='+encodeURIComponent(city)):L.hoteles;}
  function a(href,txt,cls,ev){return '<a class="hlc-btn '+(cls||'')+'" href="'+href+'" target="_blank" rel="sponsored nofollow noopener" data-hlc="'+(ev||'')+'">'+txt+'</a>';}
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function track(name,label){try{(w.dataLayer=w.dataLayer||[]).push({event:'hlc_click',hlc_target:name,hlc_label:label||''});}catch(e){}try{w.gtag&&w.gtag('event','hlc_click',{hlc_target:name,hlc_label:String(label||'').slice(0,100),page_path:location.pathname});w.clarity&&w.clarity('event','click_'+name);}catch(e){}if(/^alerta/.test(name))logClick(name,'');}
  function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);}catch(e){return null;}}

  /* ---------- Región del visitante (zona horaria + idioma) ---------- */
  var REGIONS={
    es:{label:'España',cont:'Europa',cc:['ES'],chips:['Madrid','Barcelona','Málaga','Valencia','Sevilla','Bilbao','Canarias']},
    eu:{label:'Europa',cont:'Europa',cc:['PT','GB','IE','FR','NL','BE','DE','AT','CH','IT','DK','SE','NO','FI','PL','CZ','HU','GR','RO','IS','LU'],chips:['Londres','París','Ámsterdam','Berlín','Roma','Milán','Lisboa','Dublín','Copenhague']},
    na:{label:'Norteamérica',cont:'Norteamérica',cc:['US','CA'],chips:['Nueva York','Miami','Los Ángeles']},
    la:{label:'Latinoamérica',cont:'Sudamérica',cc:['MX','CO','AR','CL','PE','EC','VE','UY','BR','PA','CR','DO','CU','PR','GT'],chips:['Ciudad de México','Bogotá','Buenos Aires','Miami']},
    as:{label:'Asia',cont:'Asia',cc:['SG','TH','MY','ID','PH','VN','HK','CN','JP','KR','TW','IN','AE','QA','SA'],chips:['Singapur','Dubái']},
    oc:{label:'Oceanía',cont:'Oceanía',cc:['AU','NZ'],chips:['Sídney']}
  };
  function detectGeo(){
    var tz='',lang=(navigator.language||'es').toLowerCase();try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){}
    var T=[[/^(Europe\/Madrid|Africa\/Ceuta)$/,'es','Madrid'],[/^Atlantic\/Canary$/,'es','Canarias'],[/^Europe\/Lisbon|Atlantic\/(Madeira|Azores)/,'eu','Lisboa'],[/^Europe\/London/,'eu','Londres'],[/^Europe\/Dublin/,'eu','Dublín'],[/^Europe\/(Paris|Monaco|Luxembourg)/,'eu','París'],[/^Europe\/(Amsterdam|Brussels)/,'eu','Ámsterdam'],[/^Europe\/(Rome|Vatican|Malta)/,'eu','Roma'],[/^Europe\/(Copenhagen|Stockholm|Oslo|Helsinki)|Atlantic\/Reykjavik/,'eu','Copenhague'],[/^Europe\//,'eu','Berlín'],
      [/^America\/(Los_Angeles|Vancouver|Phoenix|Denver|Boise|Edmonton|Anchorage)|^Pacific\/Honolulu/,'na','Los Ángeles'],[/^America\/(New_York|Toronto|Chicago|Detroit|Montreal|Halifax|Indiana|Kentucky|Winnipeg)/,'na','Nueva York'],
      [/^America\/(Mexico_City|Monterrey|Cancun|Merida|Tijuana|Guatemala|El_Salvador|Tegucigalpa|Managua|Costa_Rica)/,'la','Ciudad de México'],[/^America\/(Puerto_Rico|Havana|Santo_Domingo|Panama|Jamaica)/,'la','Miami'],[/^America\/(Bogota|Lima|Guayaquil|Caracas|La_Paz)/,'la','Bogotá'],[/^America\/(Argentina|Buenos_Aires|Santiago|Montevideo|Sao_Paulo|Asuncion)/,'la','Buenos Aires'],
      [/^(Australia|Pacific\/Auckland)/,'oc','Sídney'],[/^Asia\/(Dubai|Qatar|Riyadh|Kuwait|Bahrain|Muscat|Tehran|Karachi|Kolkata|Calcutta|Colombo|Kathmandu|Dhaka)/,'as','Dubái'],[/^Asia\//,'as','Singapur'],[/^Africa\/(Casablanca|Algiers|Tunis)/,'es','Madrid']];
    for(var i=0;i<T.length;i++)if(T[i][0].test(tz))return {r:T[i][1],o:T[i][2],tz:tz};
    return {r:/^es/.test(lang)?'es':'eu',o:'Madrid',tz:tz};
  }
  var GEO=detectGeo();GEO.reg=REGIONS[GEO.r];
  if(!ls('hlc_origin')){ls('hlc_origin',GEO.o);ls('hlc_origin_auto','1');}
  w.HLC_GEO=GEO;w.HLC_REGIONS=REGIONS;
  function geoRank(x){var f=x.facts||{},o=ls('hlc_origin');if(o&&f.origen===o)return 0;if(GEO.reg.cc.indexOf(f.origen_cc)>=0)return 1;if(f.origen_continente===GEO.reg.cont)return 2;return (!EN&&f.origen_cc==='ES')?3:4;}

  /* ---------- Cookies (RGPD) + Consent Mode v2 ---------- */
  function store(v){ls('hlc_ck',v);try{d.cookie='hlc_ck='+v+';path=/;max-age=15552000;SameSite=Lax';}catch(e){}}
  function read(){var v=ls('hlc_ck');if(!v){var m=d.cookie.match(/(?:^|; )hlc_ck=(\w+)/);v=m&&m[1];}return v;}
  function consent(v){var g=v==='granted'?'granted':'denied',sg=(v==='granted'||v==='stats')?'granted':'denied';try{w.gtag&&w.gtag('consent','update',{ad_storage:g,analytics_storage:sg,ad_user_data:g,ad_personalization:g});}catch(e){}try{(w.dataLayer=w.dataLayer||[]).push({event:'hlc_consent',hlc_consent:g});}catch(e){}try{if(sg==='granted'){w.HLC_clarity&&w.HLC_clarity();}else if(w.clarity){w.clarity('consent',false);}}catch(e){}}
  function cookieBanner(force){
    if(read()&&force!==true)return;var old=d.querySelector('.hlc-ck');if(old)old.remove();
    var b=d.createElement('div');b.className='hlc-ck';b.setAttribute('role','dialog');b.setAttribute('aria-label','Cookies');
    b.innerHTML='<p>'+T('🍪 Usamos cookies para medir visitas. <a href="/aviso-legal-datos-cookies/#cookies">Más info</a> · ','🍪 We use cookies to measure visits. <a href="/en/legal/">More info</a> · ')+'<button type="button" class="ck-cfg" aria-expanded="false">'+T('Configurar','Settings')+'</button></p>'+
      '<div class="ck-opts" hidden><label><input type="checkbox" checked disabled> '+T('Necesarias (siempre)','Necessary (always)')+'</label><label><input type="checkbox" data-ck="stats" checked> '+T('Medición de visitas','Visit analytics')+'</label><label><input type="checkbox" data-ck="ads"> '+T('Publicidad personalizada','Personalised ads')+'</label></div>'+
      '<div class="hlc-row"><button type="button" class="hlc-btn o" data-v="denied">'+T('Rechazar','Reject')+'</button><button type="button" class="hlc-btn o" data-v="custom" hidden>'+T('Guardar','Save')+'</button><button type="button" class="hlc-btn" data-v="granted">'+T('Aceptar','Accept')+'</button></div>';
    b.addEventListener('click',function(e){var el=e.target;if(!el||!el.getAttribute)return;
      if(el.className==='ck-cfg'){var o=b.querySelector('.ck-opts');o.hidden=!o.hidden;el.setAttribute('aria-expanded',String(!o.hidden));b.querySelector('[data-v=custom]').hidden=o.hidden;return;}
      var v=el.getAttribute('data-v');if(!v)return;
      if(v==='custom'){var s=b.querySelector('[data-ck=stats]').checked,a=b.querySelector('[data-ck=ads]').checked;v=a&&s?'granted':s?'stats':'denied';}
      store(v);consent(v);b.remove();d.body.classList.remove('hlc-ck-open');});
    d.body.appendChild(b);d.body.classList.add('hlc-ck-open');
  }
  function cookieLink(){if(read()==='stats')consent('stats');var l=d.querySelector('.fx-legal');if(!l||l.querySelector('.ck-re'))return;var b=d.createElement('button');b.type='button';b.className='ck-re';b.textContent=T('Preferencias de cookies','Cookie settings');b.onclick=function(){cookieBanner(true);};l.appendChild(d.createTextNode(' · '));l.appendChild(b);}

  /* ---------- Destino a partir del título ---------- */
  function cityFromTitle(t){
    if(!t)return '';
    t=t.replace(/[‼!¡😍✨⭐🔥]+/g,' ');
    var m=t.match(/(?:d[ií]as|noches|semanas?|escapada|vuelos?(?: directos)? a|en)\s+(?:a\s+|en\s+)?([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ]{2,}(?:\s+[A-ZÁÉÍÓÚÑÜ]{2,}){0,2})/);
    if(!m)m=t.match(/(?:^|[^A-Za-zÀ-ÿ])([A-ZÁÉÍÓÚÑÜ]{4,}(?:\s+[A-ZÁÉÍÓÚÑÜ]{3,}){0,2})(?![A-Za-zÀ-ÿ])/);
    if(!m)return '';
    var c=m[1].replace(/\b(CHOLLO|CHOLLAZO|GANGA|OFERTA|SOLO|HOTEL|VUELOS|DIRECTOS|INCL|TODO|INCLUIDO|DESDE|POR)\b/g,'').trim();
    if(c.length<3)return '';
    return c.toLowerCase().replace(/(^|\s)\S/g,function(x){return x.toUpperCase();});
  }
  function fmtDate(iso){try{return new Date(iso).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'});}catch(e){return '';}}
  function ago(iso){var m=Math.max(1,Math.round((Date.now()-new Date(iso))/6e4));if(m<60)return m+' min';var h=Math.round(m/60);if(h<48)return h+' h';return Math.round(h/24)+' días';}

  /* ---------- Aviso en chollos antiguos ---------- */
  function oldDealNotice(){
    var body=d.body;if(!body.classList.contains('single')||d.querySelector('.hlc-old-ssr'))return;
    var meta=d.querySelector('meta[property="article:published_time"]');if(!meta)return;
    var pub=new Date(meta.getAttribute('content'));if(isNaN(pub))return;
    if((Date.now()-pub.getTime())/864e5<21)return;
    var h=d.querySelector('h1.post-title, h1.entry-title');var title=h?h.textContent:d.title;
    if(!/€|chollo|ganga|oferta|vuelos?|hotel|d[ií]as/i.test(title))return;
    var city=cityFromTitle(title);
    var box=d.createElement('div');box.className='hlc-old';
    box.innerHTML='🕒 <strong>Chollo publicado el '+fmtDate(pub)+'.</strong> Los precios cambian cada día y este puede haber caducado. Mira el precio de hoy o <a href="/chollos/">los chollos verificados de hoy</a>:'+
      '<div class="hlc-row">'+a(L.vuelos,'✈️ Vuelos de hoy','b','vuelos')+a(hotelsIn(city),'🏨 Hoteles'+(city?' en '+esc(city):''),'','hoteles')+a(L.tours,'🎟️ Excursiones','g','tours')+'</div>';
    var c=d.querySelector('.inner-post-entry, .post-entry, .entry-content');if(c)c.insertBefore(box,c.firstChild);
  }
  function toolsBox(){
    if(!d.body.classList.contains('single'))return;
    var c=d.querySelector('.inner-post-entry, .post-entry, .entry-content');if(!c)return;
    if(/Te ayudamos a ahorrar/.test(c.textContent))return;
    var box=d.createElement('div');box.className='hlc-tools';
    box.innerHTML='<h3>Organiza tu viaje y ahorra</h3><div class="hlc-grid">'+a(L.vuelos,'✈️ Vuelos','b','vuelos')+a(L.hoteles,'🏨 Hoteles','','hoteles')+a(L.tours,'🎟️ Excursiones','g','tours')+a(L.traslados,'🚕 Traslados','o','traslados')+a(L.coches,'🚗 Coches','o','coches')+(/par[ií]s/i.test(d.title)?a(L.paris,'🗼 Tours en París','o','paris'):'')+'</div>';
    c.appendChild(box);
  }

  /* ---------- Barra fija en móvil ---------- */
  var IC={
    plane:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>',
    bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
    bed:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M2 16h20M6 10V7a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3"/></svg>',
    map:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 6l7-3 6 3 7-3v15l-7 3-6-3-7 3z"/><path d="M9 3v15M15 6v15"/></svg>'
  };
  function mobileBar(){
    var p=location.pathname;
    var b=d.createElement('nav');b.className='hlc-bar';b.setAttribute('aria-label','Accesos rápidos');
    b.innerHTML='<a class="'+(p==='/'||p==='/en/'||p.indexOf('/chollos')===0||p.indexOf('/en/deals')===0?'on':'')+'" href="'+T('/chollos/','/en/deals/')+'">'+IC.plane+T('Chollos','Deals')+'</a>'+'<a class="'+(p.indexOf('/vuelos')===0||p.indexOf('/en/flights')===0?'on':'')+'" href="'+T('/vuelos/','/en/flights/')+'">'+IC.bed.replace(/<path[\s\S]*$/,'')+'<path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/><circle cx="12" cy="12" r="9"/></svg>'+T('Rutas','Routes')+'</a>'+(EN?'':'<a class="'+(p.indexOf('/alertas')===0?'on':'')+'" href="/alertas/">'+IC.bell+'Alertas</a>')+'<a class="'+(p.indexOf('/destinos')===0||p.indexOf('/en/destinations')===0?'on':'')+'" href="'+T('/destinos/','/en/destinations/')+'">'+IC.map+T('Destinos','Guides')+'</a>';
    d.body.appendChild(b);
  }

  /* ---------- Buscador (web estática) ---------- */
  function search(){
    d.addEventListener('submit',function(e){
      var f=e.target;if(!f||!f.querySelector)return;
      var i=f.querySelector('input[name="s"]');if(!i)return;
      e.preventDefault();var q=(i.value||'').trim();if(!q)return;track('buscar',q);
      w.location.href=T('/buscar/','/en/search/')+'?q='+encodeURIComponent(q);
    },true);
  }

  /* ---------- Chollos en vivo ---------- */
  var feedP=null;
  var NCITY={'Las Palmas de Gran Canaria':'Gran Canaria','Denpasar (Bali)':'Bali','Denpasar':'Bali','Abu Dhabi':'Abu Dabi','Port Louis':'Isla Mauricio'},NC={'EE. UU.':'Estados Unidos','EEUU':'Estados Unidos','EE.UU.':'Estados Unidos','Emiratos':'Emiratos Árabes Unidos','Rep. Dominicana':'República Dominicana','Escocia':'Reino Unido','Sicilia':'Italia'};function normDeal(x){var f=x&&x.facts;if(!f)return x;['origen','destino'].forEach(function(k){if(NCITY[f[k]])f[k]=NCITY[f[k]];});['origen_pais','pais'].forEach(function(k){if(NC[f[k]])f[k]=NC[f[k]];});if(typeof x.title==='string')Object.keys(NCITY).forEach(function(a){if(a!=='Denpasar')x.title=x.title.split(a).join(NCITY[a]);});return x;}function feed(){if(!feedP)feedP=Promise.all([fetch(API+'?action=feed').then(function(r){return r.json();}).then(function(l){return (l||[]).map(normDeal);}).catch(function(){return [];}),fetch('/hlc/destinos.json').then(function(r){return r.json();}).catch(function(){return [];}),fetch('/chollos/hechos.json',{cache:'no-cache'}).then(function(r){return r.json();}).catch(function(){return [];}),fetch('/hlc/fx.json').then(function(r){return r.json();}).catch(function(){return null;})]).then(function(a){DESTS=a[1];HECHOS=a[2];FX=a[3];return (a[0]||[]).filter(function(x){var p=(x.facts||{}).ahorro_pct;return (x.facts||{}).vuelta&&(!p||p>=40)&&(Date.now()-Date.parse(x.approved_at)<7*864e5);}).map(function(x){x.cta_flight=fixFl(x.cta_flight);return x;});});return feedP;}
  var DESTS=[],HECHOS=[],FX=null;var MET2=' LON MIL NYC PAR ROM STO BUE RIO TYO OSA YTO TCI WAS CHI SEL BJS SHA MOW BUH SAO YMQ JKT REK DTT QDF HOU YEA ';function fixFl(u){return String(u||'').replace(/\b([A-Z]{3})\.AIRPORT\b/g,function(m,c){return MET2.indexOf(' '+c+' ')>=0?c+'.CITY':m;}).replace(/([A-Z]{3})\.AIRPORT(?=%2F|%26|%3F|$)/g,function(m,c){return MET2.indexOf(' '+c+' ')>=0?c+'.CITY':m;});}function loc(eur,cc){try{var c=FX&&FX.cc[(cc||'').toUpperCase()];if(!c||!eur||!FX.rates[c[0]])return '';var v=eur*FX.rates[c[0]];v=Math.round(v/(v>=20000?100:v>=2000?10:1))*(v>=20000?100:v>=2000?10:1);var n=v.toLocaleString(EN?'en-GB':'es-ES');return EN?'≈ '+c[1]+n:'≈ '+n+' '+c[1];}catch(e){return '';}}w.HLC_feed=function(){return feed();};
  function sl(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
  w.HLC_photo=function(dest){var k=sl(dest);for(var i=0;i<DESTS.length;i++){var p=DESTS[i];if(p.s===k||sl(p.n)===k||(p.a||[]).indexOf(k)>=0){var n=Math.floor(Math.random()*((p.k||0)+1));return '/hlc/img/cities/'+p.s+(n?'-'+(n+1):'-800')+'.jpg';}}return null;};
  function dealUrl(x){return HECHOS.indexOf(x.slug)>=0?'/chollos/'+x.slug+'/':'/chollos/ver/?s='+encodeURIComponent(x.slug);}
  function flag(cc){cc=(cc||'').toUpperCase();return cc.length===2?String.fromCodePoint(127462+cc.charCodeAt(0)-65,127462+cc.charCodeAt(1)-65):'✈️';}
  var CONT={'Europa':['europa','🇪🇺','Europa'],'Asia':['asia','🌏','Asia'],'Oriente Medio':['oriente-medio','🕌','Oriente Medio'],'Norteamérica':['norteamerica','🗽','Norteamérica'],'Centroamérica y Caribe':['caribe','🏝️','Caribe'],'Sudamérica':['sudamerica','🌎','Sudamérica'],'África':['africa','🌍','África'],'Oceanía':['oceania','🦘','Oceanía']};
  function priceHtml(x){var f=x.facts||{};var l=loc(x.price,f.origen_cc);var lh=l?'<small class="dc-loc">'+esc(l)+'</small>':'';if(f.precio_normal&&f.precio_normal>x.price)return '<div class="dc-p"><s>'+esc(f.precio_normal)+' €</s>'+esc(x.price)+' €'+lh+'</div>';return '<div class="dc-p">'+esc(x.price)+' €'+lh+'</div>';}
  function card(x){
    var f=x.facts||{};var lib=w.HLC_photo(f.destino);var img=lib||(x.image_url||'');var c=CONT[f.continente]||null;var fresh=(Date.now()-Date.parse(x.approved_at))<12*36e5;var ck=f.checked_at&&f.checked_at>x.approved_at?f.checked_at:x.approved_at;
    var save=f.ahorro_pct?'<span class="dc-save">−'+esc(f.ahorro_pct)+' %</span>':'';
    return '<a class="dc" href="'+esc(dealUrl(x))+'" data-cont="'+(c?c[0]:'')+'" data-slug="'+esc(x.slug)+'"><div class="dc-img" style="background-image:url(\''+esc(img)+'\'),linear-gradient(135deg,#FF5A36,#2E6BF0)">'+save+'<span class="dc-ok">'+(fresh?'🔥 Nuevo':'✓ '+T('hace ','')+ago(ck)+T('',' ago'))+'</span><span class="dc-fav" role="button" tabindex="0" aria-label="Guardar en favoritos" data-fav="'+esc(x.slug)+'">♡</span><span class="dc-city">'+esc(f.destino||'')+'</span></div>'+
      '<div class="dc-b"><div><div class="dc-r"><span class="dc-flag">'+flag(f.origen_cc)+'</span> '+esc(f.origen||'')+' → '+esc(f.destino||'')+(f.destino_cc?' <span class="dc-flag">'+flag(f.destino_cc)+'</span>':'')+'</div><div class="dc-m">'+esc(f.tipo||'')+' · '+(f.escalas===0?'directo':(f.escalas>0?f.escalas+(f.escalas>1?' escalas':' escala'):'con escalas'))+(f.aerolinea?' · '+esc(f.aerolinea):'')+(f.ida?' · '+new Date(f.ida).toLocaleDateString('es-ES',{day:'numeric',month:'short'}):'')+'</div></div>'+priceHtml(x)+'</div></a>';
  }
  function renderDeals(){
    var boxes=d.querySelectorAll('[data-hlc-deals]');if(!boxes.length)return;
    feed().then(function(list){
      var td=new Date().toISOString().slice(0,10);list=(list||[]).filter(function(x){return x.slug&&x.price&&(!x.facts||!x.facts.ida||x.facts.ida>=td)&&(w.HLC_photo((x.facts||{}).destino)||x.image_url);});var now=Date.now();var age=function(x){var t=Date.parse(x.approved_at||'')||0;var h=(now-t)/36e5;return h<12?0:h<36?1:2;};list=list.map(function(x,i){return [age(x),geoRank(x),-(Date.parse(x.approved_at||'')||0),i,x];}).sort(function(a,b){return a[0]-b[0]||a[1]-b[1]||a[2]-b[2]||a[3]-b[3];}).map(function(a){return a[4];});
      boxes.forEach(function(box){
        var max=+box.getAttribute('data-max')||12;var o=ls('hlc_origin');
        var l=list;if(o&&box.hasAttribute('data-filter')&&!box.hasAttribute('data-savings')){var lo=list.filter(function(x){return (x.facts&&x.facts.origen)===o;});if(lo.length)l=lo;}
        if(!l.length){box.innerHTML='<div class="dc-empty"><b>Estamos cazando los próximos chollos.</b><span>Crea una alerta y te avisamos en cuanto salga uno desde tu aeropuerto.</span><a class="hlc-btn" href="/alertas/">Crear alerta gratis</a></div>';return;}
        var ds=box.getAttribute('data-dest');if(ds){var dc=box.getAttribute('data-dest-c')||'';var dsl=function(n){var k=sl(n);for(var i=0;i<DESTS.length;i++){var p=DESTS[i];if(p.s===k||sl(p.n)===k||(p.a||[]).indexOf(k)>=0)return p.s;}return k;};var ld=l.filter(function(x){return dsl((x.facts||{}).destino)===ds;});if(!ld.length&&dc)ld=l.filter(function(x){return sl((x.facts||{}).pais)===dc;});var rh=box.parentNode.querySelector('[data-rel-h]');if(ld.length){l=ld;if(rh&&!ld.some(function(x){return dsl((x.facts||{}).destino)===ds;}))rh.textContent=T('Chollos de hoy en la zona','Deals in the area today');}else if(rh)rh.textContent=T('Chollos verificados de hoy','Verified deals today');}
        var tab=box.getAttribute('data-tab')||'';if(tab){var lt=l.filter(function(x){var c=CONT[(x.facts||{}).continente];return c&&c[0]===tab;});l=lt;}
        if(!l.length){box.innerHTML='<div class="dc-empty"><b>Hoy no hay chollos en esta zona.</b><span>Mira otro continente o crea una alerta gratis.</span><a class="hlc-btn" href="/alertas/">Crear alerta gratis</a></div>';return;}
        box.innerHTML=l.slice(0,max).map(card).join('');
      });
      paintFavs();try{w.HLC_seen&&w.HLC_seen();}catch(e){}tabsCount(list);ticker(list);geoNote(list);heroDeal(list);
    });
  }
  function tabsCount(list){d.querySelectorAll('[data-hlc-tabs] [data-tab]').forEach(function(b){var t=b.getAttribute('data-tab');var n=t?list.filter(function(x){var c=CONT[(x.facts||{}).continente];return c&&c[0]===t;}).length:list.length;var sm=b.querySelector('small');if(sm)sm.textContent=n;if(t&&!n)b.hidden=true;});}
  function tabs(){d.querySelectorAll('[data-hlc-tabs]').forEach(function(g){var box=d.querySelector(g.getAttribute('data-hlc-tabs'));g.addEventListener('click',function(e){var b=e.target.closest('[data-tab]');if(!b||!box)return;g.querySelectorAll('[data-tab]').forEach(function(x){x.setAttribute('aria-pressed',x===b);});box.setAttribute('data-tab',b.getAttribute('data-tab'));renderDeals();track('tab_continente',b.getAttribute('data-tab'));});});}
  function ticker(list){var t=d.querySelector('[data-hlc-ticker]');if(!t||!list.length)return;var x=list[0],f=x.facts||{};t.innerHTML='<span class="tk-dot"></span>Último chollo: <a href="'+esc(dealUrl(x))+'">'+esc(f.origen)+' → '+esc(f.destino)+' por '+esc(x.price)+' €</a> · hace '+ago(x.approved_at);t.hidden=false;}

  /* ---------- Favoritos ---------- */
  function getFavs(){try{return JSON.parse(localStorage.getItem('hlc_favs')||'[]');}catch(e){return [];}}
  function paintFavs(){var f=getFavs();d.querySelectorAll('[data-fav]').forEach(function(el){var on=f.indexOf(el.getAttribute('data-fav'))>=0;el.textContent=on?'♥':'♡';el.classList.toggle('on',on);el.setAttribute('aria-pressed',on);});}
  function toast(m){var t=d.querySelector('.hlc-toast');if(!t){t=d.createElement('div');t.className='hlc-toast';t.setAttribute('role','status');d.body.appendChild(t);}t.textContent=m;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(function(){t.classList.remove('on');},2200);}
  w.HLC_toast=toast;
  function favs(){
    var h=function(e){var el=e.target.closest&&e.target.closest('[data-fav]');if(!el)return;if(e.type==='keydown'&&e.key!=='Enter'&&e.key!==' ')return;e.preventDefault();e.stopPropagation();var s=el.getAttribute('data-fav'),f=getFavs(),i=f.indexOf(s);if(i>=0){f.splice(i,1);toast(T('Quitado de favoritos','Removed from favourites'));}else{f.unshift(s);toast(T('♥ Guardado en favoritos','♥ Saved to favourites'));track('favorito',s);}try{localStorage.setItem('hlc_favs',JSON.stringify(f.slice(0,100)));}catch(er){}paintFavs();w.dispatchEvent(new CustomEvent('hlc:favs'));};
    d.addEventListener('click',h,true);d.addEventListener('keydown',h,true);paintFavs();
  }
  /* ---------- Compartir / copiar ---------- */
  function share(){
    d.addEventListener('click',function(e){
      var s=e.target.closest&&e.target.closest('[data-share]');
      if(s){e.preventDefault();var u=s.getAttribute('data-url')||location.href,t=s.getAttribute('data-title')||d.title;if(navigator.share){navigator.share({title:t,text:t,url:u}).catch(function(){});}else{navigator.clipboard&&navigator.clipboard.writeText(u);toast(T('Enlace copiado','Link copied'));}track('compartir',u);return;}
      var c=e.target.closest&&e.target.closest('[data-copy]');
      if(c){e.preventDefault();navigator.clipboard&&navigator.clipboard.writeText(c.getAttribute('data-copy'));toast(T('Enlace copiado ✓','Link copied ✓'));track('copiar',c.getAttribute('data-copy'));}
    });
  }
  /* ---------- Página de chollo: días que faltan y aviso si caducó ---------- */
  function dealState(){
    var m=d.querySelector('[data-deal-slug]');if(!m)return;
    var ida=m.getAttribute('data-deal-ida'),el=d.querySelector('[data-days]');
    if(ida&&el){var n=Math.ceil((Date.parse(ida)-Date.now())/864e5);if(n>=0)el.textContent=n===0?T('✈️ Sale hoy','✈️ Departs today'):n===1?T('✈️ Sale mañana','✈️ Departs tomorrow'):T('✈️ Sale dentro de '+n+' días','✈️ Departs in '+n+' days');}
    var pub=m.getAttribute('data-deal-pub');if(pub&&el){var left=7-Math.floor((Date.now()-Date.parse(pub))/864e5);if(left>0&&left<=3){var ce=d.createElement('div');ce.className='deal-exp';ce.textContent=left===1?T('⏳ Último día: mañana lo retiramos','⏳ Last day: we remove it tomorrow'):T('⏳ Lo retiramos en '+left+' días','⏳ We remove it in '+left+' days');el.parentNode.insertBefore(ce,el.nextSibling);}}
    feed().then(function(list){var s=m.getAttribute('data-deal-slug');if(!(list||[]).some(function(x){return x.slug===s;})||(ida&&ida<new Date().toISOString().slice(0,10))){var b=d.createElement('div');b.className='hlc-old';b.innerHTML=T('<b>⏰ Este chollo ya ha caducado.</b> Los precios cambian rápido. <a href="/chollos/">Mira los chollos de hoy</a> o <a href="/alertas/">crea una alerta</a> para el próximo.','<b>⏰ This deal has expired.</b> Prices move fast. <a href="/en/deals/">See today\'s deals</a>.');var t=d.querySelector('.deal-body');if(t)t.parentNode.insertBefore(b,t);d.body.classList.add('deal-gone');}});
  }
  /* ---------- Volver arriba ---------- */
  function toTop(){var b=d.createElement('button');b.className='hlc-top';b.type='button';b.setAttribute('aria-label',T('Volver arriba','Back to top'));b.textContent='↑';d.body.appendChild(b);b.onclick=function(){w.scrollTo({top:0,behavior:'smooth'});};w.addEventListener('scroll',function(){b.classList.toggle('on',w.scrollY>1200);},{passive:true});}

  /* ---------- Alertas ---------- */
  function alerts(){
    d.querySelectorAll('form[data-hlc-alert]').forEach(function(f){
      try{var qd=new URLSearchParams(location.search).get('d');var di=f.querySelector('[name=destination]');if(qd&&di)di.value=qd.slice(0,60);}catch(e){}
      f.querySelectorAll('[data-chip]').forEach(function(c){c.addEventListener('click',function(){var on=c.getAttribute('aria-pressed')==='true';c.setAttribute('aria-pressed',on?'false':'true');});});
      f.querySelectorAll('[data-pick]').forEach(function(c){c.addEventListener('click',function(){var g=c.getAttribute('data-pick');f.querySelectorAll('[data-pick="'+g+'"]').forEach(function(x){x.setAttribute('aria-pressed','false');});c.setAttribute('aria-pressed','true');var ch=f.querySelector('[name=contact]');if(g==='channel'&&ch){var wa=c.getAttribute('data-v')==='whatsapp';ch.type=wa?'tel':'email';ch.placeholder=wa?'+34 600 000 000':'tu@email.com';var lb=f.querySelector('[data-contact-label]');if(lb)lb.textContent=wa?'Tu número de WhatsApp':'Tu email';}});});
      var ci=f.querySelector('[name=contact]'),cm=f.querySelector('[data-msg]');
      var valid=function(){var v=(ci.value||'').trim();if(!v)return null;return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);};
      var check=function(final){if(!ci)return true;var ok=valid();if(ok===false||(final&&ok===null)){ci.setAttribute('aria-invalid','true');if(cm)cm.textContent=T('Revisa el email: debe parecerse a nombre@dominio.com. Si no quieres dar email, usa «Avísame en este navegador».','Check the email: it should look like name@domain.com.');return false;}ci.removeAttribute('aria-invalid');if(cm&&/^Revisa/.test(cm.textContent))cm.textContent='';return true;};
      if(ci){ci.addEventListener('blur',function(){check(false);});ci.addEventListener('input',function(){if(ci.getAttribute('aria-invalid'))check(false);});}
      f.addEventListener('submit',function(e){
        e.preventDefault();
        if(!check(true))return;
        var msg=f.querySelector('[data-msg]');var btn=f.querySelector('[type=submit]');
        var origins=[].map.call(f.querySelectorAll('[data-chip][aria-pressed=true]'),function(c){return c.getAttribute('data-v');});
        var pr=f.querySelector('[data-pick=price][aria-pressed=true]');
        var body={action:'alert',origins:origins,destination:(f.querySelector('[name=destination]')||{}).value||'',max_price:pr?+pr.getAttribute('data-v'):null,channel:'email',contact:(f.querySelector('[name=contact]')||{}).value||'',consent:!!(f.querySelector('[name=consent]')||{}).checked};
        btn.disabled=true;msg.textContent='Guardando…';
        fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json();}).then(function(j){
          if(j.ok){f.classList.add('done');msg.textContent='';track('alerta_creada','email');ls('hlc_alert','email');if(origins[0])ls('hlc_origin',origins[0]);var ok=f.querySelector('[data-ok]');if(ok){ok.hidden=false;ok.innerHTML=doneHtml((origins.length?origins.join(', '):T('cualquier aeropuerto de España','any airport in Spain'))+(body.max_price?T(' por menos de ',' under ')+body.max_price+' €':''),true);var pb=f.querySelector('.hlc-push'),al=ok.querySelector('.af-links');if(pb&&al)al.parentNode.insertBefore(pb,al);try{ok.scrollIntoView({behavior:'smooth',block:'center'});}catch(er){}}}
          else{msg.textContent=j.error||'No se ha podido guardar. Prueba otra vez.';btn.disabled=false;}
        }).catch(function(){msg.textContent='Sin conexión. Prueba otra vez.';btn.disabled=false;});
      });
    });
  }

  function geoNote(list){
    var box=d.querySelector('[data-hlc-deals]:not([data-dest])');if(!box||box.closest('.hlc-rel')||d.querySelector('.geo-note'))return;var o=ls('hlc_origin')||GEO.o;
    var mine=list.filter(function(x){return geoRank(x)<3;}).length;
    var n=d.createElement('div');n.className='geo-note';
    n.innerHTML='<span>'+(mine?'📍 Te enseñamos primero los chollos con salida desde <b>'+esc(GEO.r==='es'?o:GEO.reg.label)+'</b>.':'📍 Hoy no hay chollos con salida desde <b>'+esc(GEO.reg.label)+'</b>: te enseñamos primero los de España y después los mejores del mundo. <a href="/alertas/">Avísame cuando salga uno</a>.')+'</span><button type="button" class="geo-ch">Cambiar origen</button>';
    box.parentNode.insertBefore(n,box);
    n.querySelector('.geo-ch').addEventListener('click',function(){var t=d.querySelector('[data-origin]')||d.querySelector('[data-map-origin]');if(t){t.scrollIntoView({behavior:'smooth',block:'center'});try{t.focus();}catch(e){}}});
  }
  function regionChips(){
    if(GEO.r==='es')return;var chips=d.querySelectorAll('.chip[data-origin]');if(!chips.length)return;var par=chips[0].parentNode,list=GEO.reg.chips.concat(['Madrid','Barcelona']);
    chips.forEach(function(c){c.remove();});
    list.forEach(function(o){var b=d.createElement('button');b.type='button';b.className='chip';b.setAttribute('data-origin',o);b.setAttribute('aria-pressed','false');b.textContent=o;par.appendChild(b);});
  }

  /* ---------- Cabeceras con varias fotos del destino ---------- */
  function heroRotate(){
    d.querySelectorAll('[data-photos]').forEach(function(el){
      var L=el.getAttribute('data-photos').split('|').filter(Boolean);if(L.length<2||(w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches))return;
      for(var i=L.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));if(i>0&&j>0){var t=L[i];L[i]=L[j];L[j]=t;}}
      var n=0;el.classList.add('ph-rot');
      setInterval(function(){if(d.hidden)return;var nx=L[(n+1)%L.length],im=new Image();im.onload=function(){n=(n+1)%L.length;el.style.backgroundImage='url('+nx+')';};im.src=nx;},6000);
    });
  }

  /* ---------- Idioma: inglés por defecto si el visitante no habla español ---------- */
  function langSwitch(){
    var bot=/bot|crawl|spider|slurp|lighthouse|headless|preview/i.test(navigator.userAgent)||navigator.webdriver;
    var pref=ls('hlc_lang'),bl=(navigator.languages&&navigator.languages[0]||navigator.language||'es').toLowerCase();
    var spanishWorld=GEO.r==='es'||GEO.r==='la'||/^es/.test(bl);
    var alt=d.querySelector('link[rel=alternate][hreflang='+(EN?'es':'en')+']');
    // botón de idioma en la cabecera
    var nav=d.querySelector('.hx-nav');
    if(nav&&!nav.querySelector('.hx-lang')){var a=d.createElement('a');a.className='hx-lang';a.href=alt?alt.getAttribute('href'):(EN?'/':'/en/');a.textContent=EN?'🇪🇸 Español':'🇬🇧 English';a.setAttribute('hreflang',EN?'es':'en');a.addEventListener('click',function(){ls('hlc_lang',EN?'es':'en');});nav.insertBefore(a,nav.lastElementChild);}
    if(bot||EN)return;
    if(pref==='es'||(!pref&&spanishWorld))return;
    if(alt){location.replace(alt.getAttribute('href'));return;}
    if(d.querySelector('.lang-note'))return;
    var n=d.createElement('div');n.className='lang-note';n.innerHTML='🇬🇧 This page is in Spanish. <a href="/en/deals/">See today\'s flight deals in English →</a> <button type="button" aria-label="Close">✕</button>';
    n.querySelector('button').onclick=function(){ls('hlc_lang','es');n.remove();};
    n.querySelector('a').onclick=function(){ls('hlc_lang','en');};
    d.body.insertBefore(n,d.body.firstChild);
  }

  /* ---------- Portada: alerta rápida (aeropuerto + email) ---------- */
  /* ---------- Tras crear la alerta: qué pasa ahora (3 pasos) ---------- */
  var MAIL_LIVE=false; /* pasar a true cuando los emails de alerta salgan de verdad (falta el proveedor de envío) */
  function doneHtml(origin,mail){
    var o=esc(origin||T('tu aeropuerto','your airport'));
    return '<div class="qf-done af-next"><b>'+T('¡Alerta guardada! ✈️','Alert saved! ✈️')+'</b>'+
      '<ol class="af-steps"><li class="ok">'+T('Vigilamos los vuelos desde <strong>'+o+'</strong>.','We are watching flights from <strong>'+o+'</strong>.')+'</li>'+
      (mail?'<li>'+(MAIL_LIVE?T('Te escribiremos una vez para que confirmes tu email. Si no lo ves, mira en promociones o spam.','We will email you once to confirm it is yours. If you cannot see it, check promotions or spam.'):T('Guardamos tu email: los avisos por email empiezan muy pronto y te pediremos que lo confirmes.','We saved your email: email alerts start very soon and we will ask you to confirm it.'))+'</li>':'')+
      '<li>'+T('¿Lo quieres al instante? Activa el aviso en este móvil:','Want it instantly? Turn on alerts on this phone:')+'</li></ol>'+
      '<input type="hidden" name="origin" value="'+o+'"><div data-msg></div>'+
      '<p class="af-links"><a href="'+T('/chollos/','/en/deals/')+'">'+T('Ver los chollos de hoy →','See today\'s deals →')+'</a> · <a href="'+T('/videos/','/en/videos/')+'">'+T('Comparte el vídeo de tu viaje','Share your trip video')+'</a></p></div>';
  }

  function quick(){
    d.querySelectorAll('form[data-hlc-quick]').forEach(function(f){
      var sel=f.querySelector('[name=origin]'),o=ls('hlc_origin');
      if(sel&&o){for(var i=0;i<sel.options.length;i++)if(sel.options[i].text===o){sel.selectedIndex=i;break;}}
      if(sel)sel.addEventListener('change',function(){ls('hlc_origin',sel.value);try{w.dispatchEvent(new CustomEvent('hlc:origin',{detail:sel.value}));}catch(e){}});
      f.addEventListener('submit',function(e){
        e.preventDefault();var msg=f.querySelector('[data-msg]'),btn=f.querySelector('[type=submit]');
        var c=(f.querySelector('[name=contact]').value||'').trim();
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c)){msg.textContent=T('Escribe tu email (nombre@dominio.com). Si no quieres dar email, pulsa «Avísame en este navegador».','Enter your email (name@domain.com). If you prefer not to, tap «Alert me in this browser».');return;}
        if(!f.querySelector('[name=consent]').checked){msg.textContent=T('Marca la casilla para poder avisarte.','Tick the box so we can alert you.');return;}
        var body={action:'alert',origins:[sel?sel.value:''],destination:'',max_price:null,channel:'email',contact:c,consent:true,lang:EN?'en':'es'};
        btn.disabled=true;msg.textContent=T('Guardando…','Saving…');
        fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json();}).then(function(j){
          if(j.ok){f.classList.add('done');ls('hlc_origin',body.origins[0]);ls('hlc_alert','email');track('alerta_rapida','email');f.innerHTML=doneHtml(body.origins[0],true);try{pushUI();}catch(er){}}
          else{msg.textContent=j.error||T('No se ha podido guardar. Prueba otra vez.','Could not save. Try again.');btn.disabled=false;}
        }).catch(function(){msg.textContent=T('Sin conexión. Prueba otra vez.','No connection. Try again.');btn.disabled=false;});
      });
    });
  }
  function heroDeal(list){
    var a=d.querySelector('[data-hlc-hero-deal]');if(!a||a.dataset.done)return;a.dataset.done=1;
    var top=list.slice(0,8);var withSave=top.filter(function(x){return (x.facts||{}).precio_normal;});var pool=(withSave.length>=2?withSave:list);
    var put=function(el,x){if(!el||!x)return;var f=x.facts||{};var ph=w.HLC_photo(f.destino)||x.image_url||'';el.innerHTML='<a href="'+esc(dealUrl(x))+'"><span class="h2-ph" style="background-image:url('+esc(ph)+')"></span><span class="h2-t"><b>✈️ '+esc(f.origen)+' → '+esc(f.destino)+'</b><span>'+(f.precio_normal?'<s>'+esc(f.precio_normal)+' €</s> ':'')+'<em>'+esc(x.price)+' €</em>'+(f.ahorro_pct?' <i>−'+esc(f.ahorro_pct)+' %</i>':'')+'</span><small>'+esc(f.tipo||'')+(f.escalas===0?' · directo':'')+'</small></span></a>';};
    put(a,pool[0]);put(d.querySelector('[data-hlc-hero-deal2]'),pool[1]);
  }

  /* ---------- Origen preferido (chips de la portada) ---------- */
  function origins(){
    d.querySelectorAll('[data-origin]').forEach(function(c){
      var cur=ls('hlc_origin')||'';if((c.getAttribute('data-origin')||'')===cur)c.setAttribute('aria-pressed','true');
      c.addEventListener('click',function(){d.querySelectorAll('[data-origin]').forEach(function(x){x.setAttribute('aria-pressed','false');});c.setAttribute('aria-pressed','true');ls('hlc_origin',c.getAttribute('data-origin'));renderDeals();try{w.dispatchEvent(new CustomEvent('hlc:origin',{detail:c.getAttribute('data-origin')}));}catch(er){}track('origen',c.getAttribute('data-origin'));});
    });
  }

  /* ---------- Animaciones al hacer scroll ---------- */
  function reveal(){
    var els=d.querySelectorAll('.reveal');if(!els.length)return;
    if(!('IntersectionObserver' in w)){els.forEach(function(e){e.classList.add('in');});return;}
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{rootMargin:'0px 0px -10% 0px'});
    els.forEach(function(e){io.observe(e);});
    var path=d.querySelector('[data-journey-path]'),plane=d.querySelector('[data-journey-plane]'),sec=d.querySelector('[data-journey]');
    if(path&&plane&&sec&&path.getTotalLength){
      var len=path.getTotalLength();path.style.strokeDasharray=len;path.style.strokeDashoffset=len;
      var tick=function(){var r=sec.getBoundingClientRect();var p=Math.min(1,Math.max(0,(innerHeight*0.6-r.top)/(r.height)));path.style.strokeDashoffset=len*(1-p);var pt=path.getPointAtLength(len*p),pt2=path.getPointAtLength(Math.min(len,len*p+1));var ang=Math.atan2(pt2.y-pt.y,pt2.x-pt.x)*180/Math.PI;plane.setAttribute('transform','translate('+pt.x+' '+pt.y+') rotate('+ang+')');};
      w.addEventListener('scroll',tick,{passive:true});tick();
    }
    var hero=d.querySelectorAll('[data-hero-img]');if(hero.length>1){var i=0;setInterval(function(){hero[i].classList.remove('on');i=(i+1)%hero.length;hero[i].classList.add('on');},5200);}
  }

  /* ---------- Booking: añadir dest_id a las búsquedas (solo ?ss= da error a muchos usuarios) ---------- */
  var BKM={"abu dabi":"-782066|city","abu dhabi":"-782066|city","agadir":"-20029|city","amsterdam":"-2140479|city","atenas":"-814876|city","athens":"-814876|city","azores":"1530|region","bali":"835|region","bangkok":"-3414440|city","barcelona":"-372490|city","belgrade":"-74897|city","belgrado":"-74897|city","berlin":"-1746443|city","bogota":"-578472|city","bologna":"-111742|city","bolonia":"-111742|city","boston":"20061717|city","bruges":"-1955473|city","brujas":"-1955473|city","bruselas":"-1955538|city","brussels":"-1955538|city","bucarest":"-1153951|city","bucharest":"-1153951|city","budapest":"-850553|city","buenos aires":"-979186|city","burbank":"20011868|city","cabo verde":"39|country","cairo":"-290692|city","cancun":"-1655011|city","cape town":"-1217214|city","cape verde":"39|country","cartagena":"-579943|city","casablanca":"-28159|city","cerdena":"908|region","charleston":"20115955|city","chipre":"55|country","chongqing":"-1900774|city","ciudad ho chi minh":"-3730078|city","ciudad de mexico":"-1658079|city","ciudad del cabo":"-1217214|city","copenhagen":"-2745636|city","copenhague":"-2745636|city","cracovia":"-510625|city","creta":"811|region","crete":"811|region","cuba":"20072483|city","cyprus":"55|country","denpasar":"-2676772|city","denpasar bali":"-2676772|city","dubai":"-782831|city","dublin":"-1502554|city","dublin irlanda":"-1502554|city","dubrovnik":"-79996|city","edimburgo":"-2595386|city","edinburgh":"-2595386|city","el cairo":"-290692|city","estambul":"-755070|city","estocolmo":"-2524279|city","fez":"-32910|city","florence":"-117543|city","florencia":"-117543|city","fort lauderdale":"20022339|city","funchal":"-2166199|city","hamburg":"-1785434|city","hamburgo":"-1785434|city","helsinki":"-1364995|city","ho chi minh city":"-3730078|city","hong kong":"-1353149|city","iceland":"97|country","isla mauricio":"135|country","isla de sal":"-1313583|city","isla de sal cabo verde":"-1313583|city","islandia":"20087302|city","istanbul":"-755070|city","jacksonville":"20022757|city","jakarta":"-2679652|city","kioto":"-235402|city","krakow":"-510625|city","kuala lumpur":"-2403010|city","kyoto":"-235402|city","las vegas":"20079110|city","lihue":"20031085|city","lima":"-352647|city","lisboa":"-2167973|city","lisbon":"-2167973|city","london":"-2601889|city","londres":"-2601889|city","los angeles":"20014181|city","luxembourg":"-1736191|city","luxemburgo":"-1736191|city","macao":"-1204094|city","macau":"-1204094|city","madeira":"2254|region","malaga":"-390787|city","maldivas":"129|country","malta":"3939|region","manila":"-2437894|city","marrakech":"-38833|city","marrakesh":"-38833|city","maui":"3183|region","mauricio":"135|country","mauritius":"135|country","mexico city":"-1658079|city","miami":"20023182|city","milan":"-121726|city","montreal":"-569541|city","munich":"-1829149|city","mykonos":"2813|region","nairobi":"-2258072|city","naples":"20023293|city","nashville":"20123908|city","nassau":"-1543832|city","new york":"20088325|city","nueva york":"20088325|city","napoles":"-122902|city","oporto":"-2173088|city","orlando":"20023488|city","oslo":"-273837|city","palermo":"-123798|city","paris":"-1456928|city","peru":"-124324|city","phoenix":"20006890|city","phu quoc":"-3726177|city","phuket":"-3253342|city","port louis":"-1355419|city","portland":"20104927|city","porto":"-2173088|city","praga":"-553173|city","prague":"-553173|city","punta cana":"-3364907|city","reno":"20079268|city","riga":"-3212216|city","rio de janeiro":"-666610|city","roma":"-126693|city","rome":"-126693|city","salzburg":"-1989985|city","salzburgo":"-1989985|city","san antonio":"20131185|city","san diego":"20015725|city","san francisco":"20015732|city","san jose":"20015742|city","san jose california":"20015742|city","san juan":"20154335|city","san martin sint maarten":"253|country","santa maria cabo verde":"-1313583|city","santiago de los caballeros":"-3366236|city","santorini":"1513|region","sardinia":"908|region","seoul":"-716583|city","sevilla":"-402849|city","seville":"-402849|city","seul":"-716583|city","singapore":"-73635|city","singapur":"-73635|city","sint maarten":"253|country","sofia":"-838489|city","sri lanka":"198|country","stockholm":"-2524279|city","sao paulo":"-671824|city","taipei":"-2637882|city","tallin":"-2625660|city","tallinn":"-2625660|city","tampa":"20024246|city","tenerife":"777|region","the azores":"1530|region","the maldives":"129|country","tokio":"-246227|city","tokyo":"-246227|city","vancouver":"-575268|city","varsovia":"-534433|city","venecia":"-132007|city","venice":"-132007|city","viena":"-1995499|city","vienna":"-1995499|city","vietnam":"230|country","vilna":"-2620663|city","vilnius":"-2620663|city","warsaw":"-534433|city","washington":"20021296|city","washington d c":"20021296|city","willemstad":"-1710886|city","yakarta":"-2679652|city","zanzibar":"5140|region","zurich":"-2554935|city"};
  function bkKey(t){try{t=decodeURIComponent(String(t).replace(/\+/g,' '));}catch(e){}return t.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
  function bkFix(u){if(!u||u.indexOf('searchresults')<0||/dest_id/.test(u))return u;
    var m=u.match(/^(https:\/\/www\.[a-z]+\.com\/click-\d+-\d+\?.*?url=)([^&]+)(.*)$/);
    if(m){var inner=decodeURIComponent(m[2]),f=bkFix(inner);return f===inner?u:m[1]+encodeURIComponent(f)+m[3];}
    var s=(u.match(/[?&]ss=([^&]+)/)||[])[1];if(!s)return u;var d=BKM[bkKey(s)];if(!d)return u;d=d.split('|');return u+'&dest_id='+d[0]+'&dest_type='+d[1];}
  /* ---------- trivago (paga por clic) para visitantes de países con programa aprobado; el resto, Booking ---------- */
  var TVL={AT:['17237092','https://www.trivago.at/de-AT'],BR:['17238100','https://www.trivago.com.br/pt-BR'],CH:['17240544','https://www.trivago.ch/de-CH'],FR:['17237072','https://www.trivago.fr/fr'],JP:['17240417','https://www.trivago.jp/ja'],MX:['17239818','https://www.trivago.com.mx/es-MX'],TR:['17268564','https://www.trivago.com.tr/tr']};
  var TVM={"abu dabi":15074,"abu dhabi":15074,"agadir":65935,"alghero":25078,"alicante":13413,"amsterdam":27561,"atenas":13914,"athens":13914,"azores":31525,"bali":72435,"bangkok":15893,"barcelona":13437,"belgrade":23419,"belgrado":23419,"berlin":3848,"bogota":65528,"bologna":26105,"bolonia":26105,"bonaire":15637,"boston":14535,"brisbane":25058,"bruges":25179,"brugge":25179,"brujas":25179,"bruselas":25118,"brussels":25118,"bruxelles":25118,"bucarest":439258,"bucharest":439258,"budapest":61949,"buenos aires":73256,"burbank":41029,"cagliari":25078,"cairo":15716,"cancun":32189,"cape town":31399,"cartagena":65529,"casablanca":65922,"catania":26567,"cdmx":31974,"cerdena":25078,"chania":13853,"charleston":14866,"chennai":64991,"chipre":221,"chongqing":31502,"ciudad de mexico":31974,"ciudad del cabo":31399,"ciudad ho chi minh":68089,"colombo":16098,"copenhagen":25816,"copenhague":25816,"cracovia":66674,"cracow":66674,"creta":13853,"crete":13853,"cusco":155,"cuzco":155,"cyprus":221,"denpasar":72435,"dubai":15068,"dublin":20262,"dubrovnik":26879,"edimburgo":20533,"edinburgh":20533,"el cairo":15716,"estambul":15288,"estocolmo":33024,"fes":65918,"fez":65918,"firenze":26611,"florence":26611,"florencia":26611,"fort lauderdale":14328,"fortaleza":56989,"funchal":31531,"guayaquil":63912,"ha long":217,"hamburg":4291,"hamburgo":4291,"hanoi":68088,"helsinki":62244,"heraklion":13853,"ho chi minh":68089,"hong kong":31497,"hongkong":31497,"houston":14930,"iceland":81,"isla de sal":74753,"isla mauricio":127,"islandia":81,"islas azores":31525,"istanbul":15288,"jacksonville":14334,"kauai":14390,"kioto":71539,"krakow":66674,"kuala lumpur":56340,"kyoto":71539,"la":14257,"la valeta":27492,"larnaca":52566,"las vegas":14667,"lihue":42947,"lima":155,"lisboa":31720,"lisbon":31720,"london":17399,"londres":17399,"los angeles":14257,"luxemburgo":52449,"macao":31480,"machu picchu":155,"madeira":31524,"malaga":13633,"maldivas":121,"maldives":121,"male":121,"malta":27429,"manila":128351,"marrakech":65925,"marrakesh":65925,"maui":14395,"mauricio":127,"mauritius":127,"mexico city":31974,"mexico df":31974,"miami":14337,"miconos":14047,"milan":26352,"milano":26352,"montreal":53807,"munchen":1803,"munich":1803,"mykonos":14047,"nairobi":65433,"naples":26246,"napoles":26246,"napoli":26246,"nashville":14914,"nassau":72570,"new york":14734,"nueva york":14734,"nyc":14734,"olbia":25078,"oporto":31823,"orlando":14340,"oslo":25029,"pafos":221,"palermo":26567,"paphos":221,"paris":22235,"penang":74533,"peru":155,"phoenix":14224,"phu quoc":99336,"phuket":16019,"ponta delgada":31525,"portland":14828,"porto":31823,"praga":23442,"prague":23442,"praha":23442,"puerto plata":15484,"punta cana":73652,"reikiavic":81,"reikiavik":81,"reno":14669,"reykjavik":81,"riga":65655,"rio":59182,"rio de janeiro":59182,"roma":25084,"rome":25084,"sal":74753,"sal island":74753,"salzburg":24437,"salzburgo":24437,"san antonio":14942,"san antonio texas":14942,"san diego":14266,"san francisco":14267,"san jose california":14268,"san juan":15591,"san martin sint maarten":15663,"santa maria":74753,"santiago de los caballeros":15491,"santorini":389397,"sao paulo":60123,"sardinia":25078,"seoul":81393,"seul":81393,"sevilla":13764,"sicilia":26567,"sidney":25057,"singapore":25025,"singapur":25025,"sint maarten":15663,"sofia":15136,"sri lanka":16098,"stockholm":33024,"taipei":72526,"tallin":64008,"tallinn":64008,"tampa":14351,"taskent":67506,"tenerife":13849,"the azores":31525,"the maldives":121,"tokio":71462,"tokyo":71462,"valletta":27429,"vancouver":34603,"varsovia":66685,"venecia":26802,"venezia":26802,"venice":26802,"viena":24979,"vienna":24979,"vietnam":217,"vilna":65776,"vilnius":65776,"warsaw":66685,"warszawa":66685,"washington d c":15032,"wien":24979,"willemstad":15563,"yakarta":72399,"zanzibar":67254,"zurich":31357};
  var TVC=null;try{TVC=sessionStorage.getItem('hlc_cc');}catch(e){}
  if(!TVC){try{fetch('/cdn-cgi/trace').then(function(r){return r.text();}).then(function(t){var m=t.match(/loc=([A-Z]{2})/);if(m){TVC=m[1];try{sessionStorage.setItem('hlc_cc',TVC);}catch(e){}}}).catch(function(){});}catch(e){}}
  function tvFix(a,u){if(!TVC||!TVL[TVC]||!/click-101900924-17288959/.test(u))return u;
    var inner='';try{inner=decodeURIComponent((u.match(/url=([^&]+)/)||[])[1]||'');}catch(e){}
    var city=a.getAttribute('data-tvcity')||((inner.match(/[?&]ss=([^&]+)/)||[])[1]||'');
    var id=city?TVM[bkKey(city)]:null;var ci=(inner.match(/checkin=(\d{4}-\d\d-\d\d)/)||[])[1],co=(inner.match(/checkout=(\d{4}-\d\d-\d\d)/)||[])[1];
    var t=TVL[TVC],dest=t[1]+(id?'/srl?search=200-'+id+(ci&&co?';dr-'+ci.replace(/-/g,'')+'-'+co.replace(/-/g,''):'')+';rc-1-2':'/');
    return 'https://www.kqzyfj.com/click-101900924-'+t[0]+'?sid=happylowcost-trivago&url='+encodeURIComponent(dest);}
  w.HLC_bk=bkFix;
  function bkLinks(){var h=function(e){var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(!a)return;var u=a.getAttribute('href'),f=tvFix(a,bkFix(u));if(f!==u)a.setAttribute('href',f);};
    ['mousedown','touchstart','click','auxclick','keydown'].forEach(function(t){d.addEventListener(t,h,{capture:true,passive:true});});}
  /* ---------- Medición de clics de afiliado ---------- */
  function logClick(kind,slug){try{fetch('https://gmdalfsvtfhzepyrdmjj.supabase.co/rest/v1/hlc_clicks',{method:'POST',keepalive:true,headers:{'apikey':'sb_publishable_Eh-sCyaGiw6AVE910v_mqA_WsW63Bdz','content-type':'application/json','prefer':'return=minimal'},body:JSON.stringify({kind:String(kind).slice(0,40),slug:slug?String(slug).slice(0,120):null,lang:EN?'en':'es',path:location.pathname.slice(0,200)})}).catch(function(){});}catch(e){}}
  function clicks(){
    d.addEventListener('click',function(e){
      var el=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!el)return;
      var h=el.getAttribute('href')||'';
      var t=el.getAttribute('data-hlc')||(/click-101900924-/.test(h)?'cj_'+(h.match(/click-101900924-(\d+)/)||[])[1]:/ecobeachcity/.test(h)?'ecobeachcity':'');
      if(t)track(t,location.pathname);
      var ds=d.querySelector('[data-deal-slug]');var slug=ds?ds.getAttribute('data-deal-slug'):'';
      if(/click-101900924-/.test(h)&&slug){el.href=h.replace(/([?&]sid=)[^&]*/,'$1'+((EN?'hlcen-':'hlc-')+slug).slice(0,64));}
      if(t)logClick(t,slug);
    },true);
  }

  function okStamps(){d.querySelectorAll('.dc[data-ts] [data-ok-ts]').forEach(function(el){var ts=el.closest('.dc').getAttribute('data-ts');if(!ts)return;var t=Date.parse(ts+(/Z|[+-]\d\d:?\d\d$/.test(ts)?'':'Z'));if(!t)return;var m=Math.max(1,Math.round((Date.now()-t)/6e4)),h=Math.round(m/60),dd=Math.round(h/24);var txt=m<60?(EN?m+' min ago':'hace '+m+' min'):h<48?(EN?h+' h ago':'hace '+h+' h'):(EN?dd+' days ago':'hace '+dd+' días');el.textContent=(EN?'✓ Verified ':'✓ Verificado ')+txt;el.title=new Date(t).toLocaleString(EN?'en-GB':'es-ES');});}
  function geoAirport(){try{if(ls('hlc_origin_auto')!=='1'||ls('hlc_geo'))return;ls('hlc_geo','1');var A=[["Madrid", "Madrid", 40.47, -3.56], ["Barcelona", "Barcelona", 41.3, 2.08], ["Málaga", "Málaga", 36.67, -4.5], ["Valencia", "Valencia", 39.49, -0.48], ["Sevilla", "Seville", 37.42, -5.89], ["Bilbao", "Bilbao", 43.3, -2.91], ["Alicante", "Alicante", 38.28, -0.56], ["Canarias", "Canarias", 28.05, -15.5], ["Palma", "Palma", 39.55, 2.74], ["Santiago", "Santiago", 42.9, -8.42], ["Zaragoza", "Zaragoza", 41.66, -1.04], ["Ibiza", "Ibiza", 38.87, 1.37], ["Lisboa", "Lisbon", 38.77, -9.13], ["Oporto", "Porto", 41.24, -8.68], ["Londres", "London", 51.47, -0.45], ["París", "Paris", 49.01, 2.55], ["Ámsterdam", "Amsterdam", 52.31, 4.76], ["Berlín", "Berlin", 52.36, 13.5], ["Roma", "Rome", 41.8, 12.25], ["Milán", "Milan", 45.63, 8.72], ["Dublín", "Dublin", 53.42, -6.27], ["Copenhague", "Copenhagen", 55.62, 12.65], ["Nueva York", "New York", 40.64, -73.78], ["Miami", "Miami", 25.79, -80.29], ["Los Ángeles", "Los Angeles", 33.94, -118.41], ["Toronto", "Toronto", 43.68, -79.63], ["Vancouver", "Vancouver", 49.19, -123.18], ["Ciudad de México", "Mexico City", 19.44, -99.07], ["Bogotá", "Bogotá", 4.7, -74.14], ["Buenos Aires", "Buenos Aires", -34.82, -58.54], ["Dubái", "Dubai", 25.25, 55.36], ["Singapur", "Singapore", 1.36, 103.99], ["Hong Kong", "Hong Kong", 22.31, 113.91], ["Seúl", "Seoul", 37.46, 126.44], ["Tokio", "Tokyo", 35.55, 139.78], ["Bangkok", "Bangkok", 13.69, 100.75], ["Sídney", "Sydney", -33.94, 151.18]];fetch('/api/geo').then(function(r){return r.json();}).then(function(g){if(!g||g.lat==null)return;var opts=[].map.call(d.querySelectorAll('select[name=origin] option,select[data-map-origin] option'),function(o){return o.text;});var best=null,bd=1e9;A.forEach(function(a){var nm=EN?a[1]:a[0];if(opts.length&&opts.indexOf(nm)<0)return;var dl=(a[2]-g.lat)*Math.PI/180,dn=(a[3]-g.lon)*Math.PI/180;var h=Math.sin(dl/2)*Math.sin(dl/2)+Math.cos(g.lat*Math.PI/180)*Math.cos(a[2]*Math.PI/180)*Math.sin(dn/2)*Math.sin(dn/2);var km=12742*Math.asin(Math.sqrt(h));if(km<bd){bd=km;best=nm;}});if(!best||bd>450)return;ls('hlc_origin',best);d.querySelectorAll('select[name=origin],select[data-map-origin]').forEach(function(sel){for(var i=0;i<sel.options.length;i++)if(sel.options[i].text===best){sel.selectedIndex=i;break;}});try{w.dispatchEvent(new CustomEvent('hlc:origin',{detail:best}));}catch(e){}renderDeals();track('origen_geo',best);}).catch(function(){});}catch(e){}}
  function routeCal(){
    var box=d.querySelector('[data-route-cal]');if(!box)return;
    var slug=box.getAttribute('data-slug'),o=box.getAttribute('data-o'),de=box.getAttribute('data-d'),bars=box.querySelector('[data-rcal-bars]');
    var want=new URLSearchParams(location.search).get('mes')||'';
    var MON=EN?['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']:['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    var MET=' LON MIL NYC PAR ROM STO BUE RIO TYO OSA YTO TCI WAS CHI SEL BJS SHA MOW BUH SAO YMQ JKT REK DTT QDF HOU YEA ',pl=function(c){return c+(MET.indexOf(' '+c+' ')>=0?'.CITY':'.AIRPORT');};var link=function(m){var u='https://flights.booking.com/flights/'+pl(o)+'-'+pl(de)+'/?type=ROUNDTRIP&adults=1&cabinClass=ECONOMY&from='+pl(o)+'&to='+pl(de)+'&depart='+m.depart+'&return='+m.ret+'&sort=CHEAPEST&locale='+(EN?'en-gb':'es')+'&salesCurrency=EUR';return CJ(AID.flight,u).replace('sid=happylowcost','sid='+(EN?'hlcen-':'hlc-')+'ruta-'+slug).slice(0,2000);};
    var io=('IntersectionObserver' in w)?new IntersectionObserver(function(es){if(es[0].isIntersecting){io.disconnect();go();}},{rootMargin:'400px'}):null;
    function go(){fetch('https://gmdalfsvtfhzepyrdmjj.supabase.co/functions/v1/hlc-alerts?action=calendar&slug='+encodeURIComponent(slug)).then(function(r){return r.json();}).then(function(j){
      var ms=(j.months||[]).filter(function(m){return m.price;});
      if(!ms.length){bars.innerHTML='<div class="dc-empty"><b>'+T('No hemos podido consultar los precios ahora.','We could not check prices right now.')+'</b><span>'+T('Prueba en un rato o mira el precio de hoy arriba.','Try again later or see today’s price above.')+'</span></div>';return;}
      var mx=Math.max.apply(null,ms.map(function(m){return m.price;})),mn=Math.min.apply(null,ms.map(function(m){return m.price;}));
      bars.innerHTML='<div class="rcal-g">'+ms.map(function(m){var y=+m.month.slice(0,4),mo=+m.month.slice(5,7);var h=Math.max(18,Math.round(m.price/mx*100));var best=m.price===mn,sel=m.month===want;
        return '<a class="rcal-b'+(best?' best':'')+(sel?' sel':'')+'" href="'+esc(link(m))+'" target="_blank" rel="sponsored nofollow noopener" data-hlc="ruta_calendario" aria-label="'+esc(MON[mo-1]+' '+y+': '+m.price+' €')+'"><span class="rcal-p">'+(EN?'€'+m.price:m.price+' €')+'</span><span class="rcal-bar" style="height:'+h+'%"></span><span class="rcal-m">'+MON[mo-1]+'<small>'+y+'</small></span>'+(best?'<em>'+T('el más barato','cheapest')+'</em>':'')+'</a>';}).join('')+'</div>'+
        '<p class="rcal-note">'+T('Mes más barato: ','Cheapest month: ')+'<b>'+(function(){var b=ms.filter(function(m){return m.price===mn;})[0];return MON[+b.month.slice(5,7)-1]+' '+b.month.slice(0,4)+' · '+(EN?'€'+mn:mn+' €')+(b.airline?' · '+esc(b.airline):'')+(b.stops===0?T(' · directo',' · nonstop'):'');})()+'</b></p>';
      var hs=(j.hist||[]).filter(function(x){return x.price;});var hb=box.querySelector('[data-rcal-hist]');
      if(hb&&hs.length>=3){var a=Math.min.apply(null,hs.map(function(x){return x.price;})),b=Math.max.apply(null,hs.map(function(x){return x.price;}))||1;var W=600,Hh=80;var pts=hs.map(function(x,i){return (i/(hs.length-1)*W).toFixed(1)+','+(Hh-((x.price-a)/((b-a)||1))*(Hh-10)-5).toFixed(1);}).join(' ');
        hb.innerHTML='<h3>'+T('Cómo ha cambiado el precio desde','How the price has changed since')+' '+esc(hs[0].day)+'</h3><svg viewBox="0 0 '+W+' '+Hh+'" class="rcal-spark" role="img" aria-label="'+T('Evolución del precio','Price history')+'"><polyline fill="none" stroke="#FF5A36" stroke-width="3" points="'+pts+'"/></svg><p class="rcal-note">'+T('Mínimo','Low')+' '+a+' € · '+T('máximo','high')+' '+b+' €</p>';}
    }).catch(function(){bars.innerHTML='<div class="dc-empty"><b>'+T('Sin conexión con el buscador de precios.','Could not reach the price search.')+'</b></div>';});}
    if(io)io.observe(box);else go();
  }
  function reportUI(){
    var AP='https://gmdalfsvtfhzepyrdmjj.supabase.co/functions/v1/hlc-alerts';
    d.querySelectorAll('[data-hlc-report]').forEach(function(b){b.addEventListener('click',function(){
      var m=b.parentNode.querySelector('[data-report-msg]');b.disabled=true;if(m)m.textContent=T('Comprobando el precio ahora…','Checking the price now…');
      fetch(AP,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'report',slug:b.getAttribute('data-hlc-report'),page:location.pathname,lang:EN?'en':'es'})}).then(function(r){return r.json();}).then(function(j){
        var r=(j&&j.result)||'';var t=/retirado/.test(r)?T('Gracias: ya no está a ese precio y lo hemos retirado.','Thanks: it is no longer at that price and we have pulled it.'):/sigue a/.test(r)?T('Gracias. Lo acabamos de comprobar y sigue disponible ('+r.replace('sigue a ','')+'). Prueba fechas cercanas si no te sale.','Thanks. We just checked and it is still available ('+r.replace('sigue a ','')+'). Try nearby dates if you do not see it.'):/hace poco/.test(r)?T('Gracias. Lo comprobamos hace menos de 2 horas; lo revisaremos de nuevo.','Thanks. It was checked less than 2 hours ago; we will review it again.'):(j&&j.error)||T('Gracias por avisar.','Thanks for letting us know.');
        if(m)m.textContent=t;track('aviso_precio',r);}).catch(function(){if(m)m.textContent=T('Sin conexión. Prueba otra vez.','No connection. Try again.');b.disabled=false;});
    });});
    d.querySelectorAll('form[data-hlc-contact]').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();var m=f.querySelector('[data-msg]'),btn=f.querySelector('[type=submit]');btn.disabled=true;m.textContent=T('Enviando…','Sending…');
      fetch(AP,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'contact',email:f.email.value,message:f.message.value,page:location.pathname,lang:EN?'en':'es'})}).then(function(r){return r.json();}).then(function(j){
        if(j.ok){f.innerHTML='<div class="dc-empty"><b>'+T('Mensaje recibido. Gracias.','Message received. Thank you.')+'</b><span>'+T('Si nos has dejado tu email, te contestamos allí.','If you left your email, we will reply there.')+'</span></div>';track('contacto','');}
        else{m.textContent=j.error||T('No se ha podido enviar.','Could not send.');btn.disabled=false;}}).catch(function(){m.textContent=T('Sin conexión. Prueba otra vez.','No connection. Try again.');btn.disabled=false;});});});
  }
  function pushUI(){
    var AP='https://gmdalfsvtfhzepyrdmjj.supabase.co/functions/v1/hlc-alerts';
    var ok=('serviceWorker' in navigator)&&('PushManager' in w)&&('Notification' in w);
    if('serviceWorker' in navigator){try{navigator.serviceWorker.register('/sw.js').catch(function(){});}catch(e){}}
    var forms=d.querySelectorAll('form[data-hlc-quick],form[data-hlc-alert]');if(!forms.length)return;
    function b64(s){var p='='.repeat((4-s.length%4)%4),r=atob((s+p).replace(/-/g,'+').replace(/_/g,'/')),a=new Uint8Array(r.length);for(var i=0;i<r.length;i++)a[i]=r.charCodeAt(i);return a;}
    forms.forEach(function(f){
      if(f.querySelector('[data-hlc-push]'))return;
      var box=d.createElement('div');box.className='hlc-push';
      if(!ok){return;}
      var already=ls('hlc_push')==='1'&&Notification.permission==='granted';
      box.innerHTML='<button type="button" class="hlc-btn o" data-hlc-push>'+(already?T('🔔 Avisos activados en este navegador','🔔 Alerts on in this browser'):T('🔔 Avísame en este navegador (sin email)','🔔 Alert me in this browser (no email)'))+'</button><small data-push-msg role="status" aria-live="polite"></small>';
      var anchor=f.querySelector('.qf-ok')||f.querySelector('[data-msg]');if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(box,anchor.nextSibling);else f.appendChild(box);
      var btn=box.querySelector('button'),msg=box.querySelector('[data-push-msg]');
      btn.addEventListener('click',function(){
        var origins=[];var sel=f.querySelector('[name=origin]');if(sel)origins=[sel.value];
        f.querySelectorAll('[data-chip][aria-pressed=true]').forEach(function(c){origins.push(c.getAttribute('data-v'));});
        var pr=f.querySelector('[data-pick=price][aria-pressed=true]');
        btn.disabled=true;msg.textContent=T('Pidiendo permiso…','Asking for permission…');
        Notification.requestPermission().then(function(p){
          if(p!=='granted')throw new Error(T('Has bloqueado las notificaciones. Puedes activarlas en los ajustes del navegador.','Notifications are blocked. You can allow them in your browser settings.'));
          return navigator.serviceWorker.register('/sw.js').then(function(){return navigator.serviceWorker.ready;});
        }).then(function(reg){
          return fetch(AP+'?action=vapid').then(function(r){return r.json();}).then(function(k){
            return reg.pushManager.getSubscription().then(function(s){return s||reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(k.key)});});
          });
        }).then(function(sub){
          var j=sub.toJSON();
          return fetch(AP,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'subscribe',sub:j,origins:origins,destination:((f.querySelector('[name=destination]')||{}).value||'').slice(0,60),max_price:pr?+pr.getAttribute('data-v'):null,lang:EN?'en':'es'})}).then(function(r){return r.json();}).then(function(x){
            if(!x.ok)throw new Error(x.error||'error');
            ls('hlc_push','1');if(origins[0])ls('hlc_origin',origins[0]);track('alerta_push',origins.join(','));
            fetch(AP,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'test',endpoint:j.endpoint})}).catch(function(){});
            btn.textContent=T('🔔 Avisos activados en este navegador','🔔 Alerts on in this browser');
            msg.textContent=T('Listo: te llegará un aviso de prueba. Máximo uno al día, desde ','Done: a test alert is on its way. Max one a day, from ')+(origins.join(', ')||T('España','Spain'))+'.';
          });
        }).catch(function(e){msg.textContent=(e&&e.message)||T('No se ha podido activar.','Could not turn it on.');btn.disabled=false;});
      });
    });
  }
  /* ---------- Hora relativa (hoy / ayer) ---------- */
  function relTimes(){d.querySelectorAll('[data-rel]').forEach(function(el){var t=Date.parse(el.getAttribute('data-rel'));if(!t)return;var now=new Date(),dt=new Date(t);
    var hm=dt.toLocaleTimeString(EN?'en-GB':'es-ES',{hour:'2-digit',minute:'2-digit'});var day=function(x){return new Date(x.getFullYear(),x.getMonth(),x.getDate()).getTime();};var n=Math.round((day(now)-day(dt))/864e5);
    if(n===0)el.textContent=T('hoy a las ','today at ')+hm;else if(n===1)el.textContent=T('ayer a las ','yesterday at ')+hm;else if(n>1&&n<8)el.textContent=T('hace '+n+' días',n+' days ago');el.title=dt.toLocaleString(EN?'en-GB':'es-ES');});}
  /* ---------- Rutas: antigüedad del precio ---------- */
  function routeAge(){var k=d.querySelector('[data-checked]');if(!k)return;var t=Date.parse(k.getAttribute('data-checked'));if(!t)return;var n=Math.floor((Date.now()-t)/864e5);
    var s=d.createElement('span');s.className='age '+(n<=7?'ok':n<=30?'mid':'old');s.textContent=n<=0?T('hoy','today'):n===1?T('ayer','yesterday'):T('hace '+n+' días',n+' days ago');k.appendChild(d.createTextNode(' · '));k.appendChild(s);
    if(n>30){var c=d.querySelector('.deal-hero .deal-cta');if(c){var note=d.createElement('p');note.className='stale-note';note.innerHTML=T('Precio de hace '+n+' días: puede haber cambiado. <a href="#calendario">Mira el calendario, que se consulta en vivo ↓</a>','This price is '+n+' days old and may have changed. <a href="#calendario">See the live price calendar ↓</a>');c.parentNode.insertBefore(note,c.nextSibling);}}}
  /* ---------- Botón de compra fijo en móvil (ficha y ruta) ---------- */
  function buyBar(){if(!w.matchMedia||!w.matchMedia('(max-width:767px)').matches||!('IntersectionObserver' in w))return;var p=d.querySelector('.deal-hero a.price-tag[href]');if(!p||d.querySelector('[data-ver]'))return;
    var b=d.createElement('a');b.className='hlc-buy';b.href=p.getAttribute('href');b.target='_blank';b.rel='sponsored nofollow noopener';b.setAttribute('data-hlc','barra_vuelo');
    if(p.getAttribute('data-tvcity'))b.setAttribute('data-tvcity',p.getAttribute('data-tvcity'));
    b.innerHTML='<span>'+T('Ver vuelo y fechas','See flight & dates')+'</span><b>'+esc((p.textContent||'').replace(/\s+/g,' ').trim())+'</b>';d.body.appendChild(b);
    new IntersectionObserver(function(es){var on=!es[0].isIntersecting;b.classList.toggle('on',on);d.body.classList.toggle('hlc-buy-on',on);}).observe(p);}
  /* ---------- Chollos ya vistos ---------- */
  function seen(){var L=[];try{L=JSON.parse(ls('hlc_seen')||'[]');}catch(e){}var m=d.querySelector('[data-deal-slug]');
    w.HLC_seen=function(){d.querySelectorAll('a.dc[data-slug]').forEach(function(a){if(L.indexOf(a.getAttribute('data-slug'))>=0)a.classList.add('seen');});};w.HLC_seen();
    if(m){var s=m.getAttribute('data-deal-slug');if(L.indexOf(s)<0){L.unshift(s);ls('hlc_seen',JSON.stringify(L.slice(0,80)));}}}
  /* ---------- Tablas anchas: aviso de que se pueden deslizar ---------- */
  function wideTables(){d.querySelectorAll('table.pm-t,table.bagt,.inner-post-entry table').forEach(function(tb){if(tb.parentNode.classList.contains('tb-x'))return;var x=d.createElement('div');x.className='tb-x';x.setAttribute('tabindex','0');x.setAttribute('role','region');x.setAttribute('aria-label',T('Tabla: desliza para ver más','Table: swipe to see more'));tb.parentNode.insertBefore(x,tb);x.appendChild(tb);if(x.scrollWidth>x.clientWidth+4)x.classList.add('more');x.addEventListener('scroll',function(){x.classList.toggle('more',x.scrollLeft+x.clientWidth<x.scrollWidth-4);},{passive:true});});}
  /* ---------- Avisos tras confirmar o darse de baja (enlaces de los emails) ---------- */
  function alertNotice(){try{var q=new URLSearchParams(location.search),c=q.get('confirmada'),b=q.get('baja');if(!c&&!b)return;
    var m=c==='ok'?T('✅ Alerta confirmada. Te avisaremos cuando salga un chollo desde tu aeropuerto.','✅ Alert confirmed. We will let you know when a deal leaves from your airport.'):c?T('Ese enlace de confirmación no es válido o ha caducado. Vuelve a crear la alerta.','That confirmation link is not valid. Please create the alert again.'):b==='ok'?T('Te has dado de baja. No recibirás más avisos.','You have unsubscribed. No more alerts.'):T('No hemos podido darte de baja con ese enlace. Escríbenos desde Contacto.','We could not unsubscribe you with that link. Write to us via Contact.');
    var n=d.createElement('div');n.className='hlc-old';n.setAttribute('role','status');n.style.margin='16px auto';n.style.maxWidth='760px';n.textContent=m;var mn=d.querySelector('main')||d.body;mn.insertBefore(n,mn.firstChild);}catch(e){}}
  function lazyBg(){var l=d.querySelectorAll('[data-bg]');if(!l.length)return;var set=function(el){if(!el.getAttribute('data-bg'))return;el.style.backgroundImage='url('+el.getAttribute('data-bg')+')';el.removeAttribute('data-bg');};if(!('IntersectionObserver' in w)){l.forEach(set);return;}var o=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){set(en.target);o.unobserve(en.target);}});},{rootMargin:'300px'});l.forEach(function(el){o.observe(el);});}

  /* ---------- Vídeos de viajeros: enviar (enlace o archivo) y muro ---------- */
  var VAPI='https://gmdalfsvtfhzepyrdmjj.supabase.co/functions/v1/hlc-videos';
  function vEmbed(v){
    if(v.kind==='file'&&v.public_url)return '<video src="'+esc(v.public_url)+'#t=0.5" controls playsinline preload="none"></video>';
    var u=v.url||'',m;
    if(v.platform==='youtube'&&(m=u.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/)))return '<button type="button" class="vw-yt" data-yt="'+m[1]+'" style="background-image:url(https://i.ytimg.com/vi/'+m[1]+'/hqdefault.jpg)" aria-label="'+T('Ver vídeo','Play video')+'"><span>▶</span></button>';
    var lab={tiktok:'TikTok',instagram:'Instagram',youtube:'YouTube'}[v.platform]||T('vídeo','video');
    return '<a class="vw-link" href="'+esc(u)+'" target="_blank" rel="noopener nofollow ugc"><span>▶</span>'+T('Ver en ','Watch on ')+lab+'</a>';
  }
  function vCard(v){return '<figure class="vw-card">'+vEmbed(v)+'<figcaption><b>📍 '+esc(v.dest||'')+'</b>'+(v.caption?'<span>'+esc(v.caption)+'</span>':'')+(v.handle?'<small>'+esc(v.handle)+'</small>':'')+'</figcaption></figure>';}
  function videoWalls(){
    d.querySelectorAll('[data-hlc-videos]').forEach(function(box){
      var dest=box.getAttribute('data-dest')||'';
      fetch(VAPI+'?action=list'+(dest?'&dest='+encodeURIComponent(dest):'')).then(function(r){return r.json();}).then(function(j){
        var L=(j&&j.videos)||[];var grid=box.querySelector('.vw-grid')||box;
        if(!L.length){var h=box.querySelector('h2'),nm=h?h.textContent.replace(/\s+(en v\u00eddeo|on video)$/i,'').trim():'';grid.innerHTML='<p class="vw-empty">'+(nm?T('\u00bfHas estado en '+nm+'? Comparte tu v\u00eddeo y lo publicamos con tu nombre.','Been to '+nm+'? Share your video and we will publish it with your name.'):T('A\u00fan no hay v\u00eddeos publicados. \u00a1El tuyo puede ser el primero!','No videos yet. Yours could be the first!'))+'</p>';box.hidden=false;return;}
        grid.innerHTML=L.map(vCard).join('');box.hidden=false;
        grid.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.vw-yt');if(!b)return;var f=d.createElement('iframe');f.src='https://www.youtube-nocookie.com/embed/'+b.getAttribute('data-yt')+'?autoplay=1';f.allow='autoplay; encrypted-media; picture-in-picture';f.allowFullscreen=true;f.title='YouTube';b.replaceWith(f);});
      }).catch(function(){});
    });
  }
  function videoForm(){
    d.querySelectorAll('form[data-hlc-video]').forEach(function(f){
      var msg=f.querySelector('[data-msg]'),btn=f.querySelector('[type=submit]'),tabs=f.querySelectorAll('[data-vk]'),kind='link';
      var setKind=function(k){kind=k;tabs.forEach(function(t){t.setAttribute('aria-pressed',String(t.getAttribute('data-vk')===k));});f.querySelectorAll('[data-vpane]').forEach(function(p){p.hidden=p.getAttribute('data-vpane')!==k;});};
      tabs.forEach(function(t){t.addEventListener('click',function(){setKind(t.getAttribute('data-vk'));});});
      fetch(VAPI+'?action=quota').then(function(r){return r.json();}).then(function(q){if(q&&q.file_ok===false){var t=f.querySelector('[data-vk=file]');if(t){t.disabled=true;t.title=T('La subida directa está llena: usa un enlace','Direct upload is full: use a link');}}}).catch(function(){});
      var fi=f.querySelector('[name=file]'),fn=f.querySelector('[data-fname]');
      if(fi)fi.addEventListener('change',function(){var x=fi.files&&fi.files[0];if(fn)fn.textContent=x?(x.name+' · '+(x.size/1048576).toFixed(1)+' MB'):'';});
      var dl=f.querySelector('#vf-dests');if(dl&&!dl.children.length){fetch('/hlc/destinos.json').then(function(r){return r.json();}).then(function(L){dl.innerHTML=L.slice(0,400).map(function(p){return '<option value="'+esc(p.n)+'">';}).join('');}).catch(function(){});}
      f.addEventListener('submit',function(e){
        e.preventDefault();
        var g=function(n){return ((f.querySelector('[name='+n+']')||{}).value||'').trim();};
        var base={action:'start',kind:kind,dest:g('dest'),caption:g('caption'),handle:g('handle'),email:g('email'),consent:!!(f.querySelector('[name=consent]')||{}).checked,lang:EN?'en':'es'};
        if(base.dest.length<2){msg.textContent=T('Dinos dónde lo grabaste.','Tell us where you filmed it.');return;}
        if(!base.consent){msg.textContent=T('Marca la casilla para que podamos publicarlo.','Tick the box so we can publish it.');return;}
        var file=null;
        if(kind==='link'){base.url=g('url');if(!/^https:\/\//.test(base.url)){msg.textContent=T('Pega el enlace completo (empieza por https://).','Paste the full link (starting with https://).');return;}}
        else{file=fi&&fi.files&&fi.files[0];if(!file){msg.textContent=T('Elige el vídeo.','Choose the video.');return;}
          var mt=file.type||(/\.mov$/i.test(file.name)?'video/quicktime':/\.webm$/i.test(file.name)?'video/webm':'video/mp4');
          if(!/^video\/(mp4|quicktime|webm)$/.test(mt)){msg.textContent=T('Formato no válido: sube MP4, MOV o WebM.','Invalid format: upload MP4, MOV or WebM.');return;}
          if(file.size>50*1048576){msg.textContent=T('Pesa más de 50 MB. Recórtalo o pega el enlace de TikTok, Reel o YouTube.','It is over 50 MB. Trim it or paste a TikTok, Reel or YouTube link.');return;}
          base.size=file.size;base.mime=mt;}
        btn.disabled=true;msg.textContent=T('Enviando…','Sending…');
        var fail=function(t){msg.textContent=t||T('No se ha podido enviar. Prueba otra vez.','Could not send. Try again.');btn.disabled=false;};
        fetch(VAPI,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(base)}).then(function(r){return r.json();}).then(function(j){
          if(!j.ok)return fail(j.error);
          if(kind==='link')return finish();
          return new Promise(function(res,rej){var x=new XMLHttpRequest();x.open('PUT',j.upload);x.setRequestHeader('content-type',base.mime);x.setRequestHeader('x-upsert','false');
            x.upload.onprogress=function(ev){if(ev.lengthComputable)msg.textContent=T('Subiendo… ','Uploading… ')+Math.round(ev.loaded/ev.total*100)+' %';};
            x.onload=function(){x.status<300?res():rej();};x.onerror=rej;x.send(file);}).then(function(){
            return fetch(VAPI,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'done',id:j.id,lang:base.lang})}).then(function(r){return r.json();});
          }).then(function(k){if(k&&k.ok)finish();else fail(k&&k.error);},function(){fail(T('La subida se ha cortado. Prueba con wifi o pega el enlace.','The upload stopped. Try on wifi or paste a link.'));});
        }).catch(function(){fail();});
        function finish(){track('video_enviado',kind);f.innerHTML='<div class="qf-done af-next"><b>'+T('¡Gracias! 🎬','Thanks! 🎬')+'</b><span>'+T('Lo revisamos y, si encaja, lo publicamos en la web con tu nombre en uno o dos días. Los mejores salen también en nuestra página de Facebook.','We will review it and, if it fits, publish it on the site with your name within a day or two. The best ones also go on our Facebook page.')+'</span><p class="af-links"><a href="'+T('/chollos/','/en/deals/')+'">'+T('Ver los chollos de hoy →','See today\'s deals →')+'</a></p></div>';}
      });
    });
  }
  function init(){try{okStamps();}catch(e){}try{lazyBg();}catch(e){}
    [bkLinks,langSwitch,quick,geoAirport,pushUI,reportUI,routeCal,search,clicks,oldDealNotice,toolsBox,mobileBar,regionChips,origins,tabs,renderDeals,alerts,reveal,cookieBanner,cookieLink,favs,share,dealState,toTop,heroRotate,relTimes,routeAge,buyBar,seen,wideTables,alertNotice,videoWalls,videoForm].forEach(function(f){try{f();}catch(e){}});
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init);else init();
})();

/* ───── 404 con memoria (26-nov-2026) ─────────────────────────────────────────
   Nueve anos de chollos publicados en Facebook dejan miles de enlaces que ya no
   existen: 1.115 URLs de los sitemaps antiguos daban 404 y la mitad seguian
   recibiendo visitas. Si la direccion que falla nombra un destino del indice,
   la pagina de 404 lo ofrece en vez de dejar al visitante sin salida. */
(function(){
  var b=document.body; if(!b||!/(^|\s)e404(\s|$)/.test(b.className))return;
  var raw=location.pathname||'';
  var p=raw; try{p=decodeURIComponent(raw);}catch(e){}
  function fold(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-');}
  var f='-'+fold(p)+'-';
  if(f.length<7)return;
  var en=/^\/en\//.test(raw);
  fetch('/hlc/destinos.json').then(function(r){return r.json();}).then(function(L){
    var best=null;
    (L||[]).forEach(function(x){
      [x.s].concat(x.a||[]).concat([x.n]).forEach(function(n){
        n=fold(n); if(n.length<4)return;
        var i=f.indexOf('-'+n+'-'); if(i<0)i=f.indexOf('-'+n);
        if(i<0)return;
        if(!best||i<best.i||(i===best.i&&n.length>best.len))best={i:i,len:n.length,x:x};
      });
    });
    if(!best)return;
    var x=best.x, wrap=document.querySelector('main .wrap'); if(!wrap)return;
    var guide=x.g?(en?('/en/destinations/'+x.s+'/'):('/destinos/'+x.s+'/')):'';
    var srch=(en?'/en/search/?q=':'/buscar/?q=')+encodeURIComponent(x.n);
    var alert_=en?'/en/deals/':('/alertas/?d='+encodeURIComponent(x.n));
    var box=document.createElement('div');
    box.setAttribute('data-sug','');
    box.style.cssText='margin:18px auto 6px;max-width:560px;border:1.5px solid #EADCC4;background:#fff;border-radius:16px;padding:16px 18px';
    box.innerHTML='<p style="margin:0 0 10px;font-size:17px">'+(en?'Were you looking for <strong>':'¿Buscabas <strong>')+x.n+'</strong>?</p>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">'+
      (guide?'<a class="hlc-btn" href="'+guide+'">'+(en?'Guide: ':'Guía de ')+x.n+'</a>':'')+
      '<a class="hlc-btn'+(guide?' o':'')+'" href="'+alert_+'">'+(en?"Today's deals":'Avísame de un chollo a '+x.n)+'</a>'+
      '<a class="hlc-btn o" href="'+srch+'">'+(en?'Search '+x.n:'Buscar '+x.n)+'</a></div>';
    var h1=wrap.querySelector('h1');
    var after=h1&&h1.parentNode===wrap?h1.nextElementSibling:null;
    if(after&&after.nextSibling)wrap.insertBefore(box,after.nextSibling);
    else if(after)wrap.appendChild(box);
    else wrap.insertBefore(box,wrap.firstChild);
    try{if(window.dataLayer)window.dataLayer.push({event:'hlc_404_sug',dest:x.s});}catch(e){}
  }).catch(function(){});
})();

/* ───── Enlace de salto al contenido (26-nov-2026) ───────────────────────────
   El CSS trae la clase .skip desde hace meses y ninguna pagina la usaba: quien
   navega con teclado tenia que pasar por la cabecera entera en cada pagina. Se
   pone aqui, en vez de en cada generador, para que lo tengan todas. */
(function(){
  try{
    var b=document.body; if(!b||document.querySelector('a.skip'))return;
    var m=document.querySelector('main'); if(!m)return;
    if(!m.id)m.id='main';
    var en=/^\/en(\/|$)/.test(location.pathname);
    var a=document.createElement('a');
    a.className='skip'; a.href='#'+m.id; a.textContent=en?'Skip to content':'Saltar al contenido';
    b.insertBefore(a,b.firstChild);
  }catch(e){}
})();
