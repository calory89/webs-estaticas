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
    coches: CJ(AID.car,'https://www.holidayautos.com/es/'),
    tours: CJ(AID.attr,'https://www.booking.com/attractions/index.es.html'),
    traslados: CJ(AID.taxi,'https://www.booking.com/taxi/index.es.html'),
    paris: CJ(AID.paris,'https://www.pariscityvision.com/es')
  };
  w.HLC={API:API,CJ:CJ,AID:AID,L:L};
  function hotelsIn(city){return city?CJ(AID.hotel,'https://www.booking.com/searchresults.es.html?ss='+encodeURIComponent(city)):L.hoteles;}
  function a(href,txt,cls,ev){return '<a class="hlc-btn '+(cls||'')+'" href="'+href+'" target="_blank" rel="sponsored nofollow noopener" data-hlc="'+(ev||'')+'">'+txt+'</a>';}
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function track(name,label){try{(w.dataLayer=w.dataLayer||[]).push({event:'hlc_click',hlc_target:name,hlc_label:label||''});}catch(e){}}
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
  function geoRank(x){var f=x.facts||{},o=ls('hlc_origin');if(o&&f.origen===o)return 0;if(GEO.reg.cc.indexOf(f.origen_cc)>=0)return 1;if(f.origen_continente===GEO.reg.cont)return 2;return 3;}

  /* ---------- Cookies (RGPD) + Consent Mode v2 ---------- */
  function store(v){ls('hlc_ck',v);try{d.cookie='hlc_ck='+v+';path=/;max-age=15552000;SameSite=Lax';}catch(e){}}
  function read(){var v=ls('hlc_ck');if(!v){var m=d.cookie.match(/(?:^|; )hlc_ck=(\w+)/);v=m&&m[1];}return v;}
  function consent(v){var g=v==='granted'?'granted':'denied';try{w.gtag&&w.gtag('consent','update',{ad_storage:g,analytics_storage:g,ad_user_data:g,ad_personalization:g});}catch(e){}try{(w.dataLayer=w.dataLayer||[]).push({event:'hlc_consent',hlc_consent:g});}catch(e){}}
  function cookieBanner(){
    if(read())return;
    var b=d.createElement('div');b.className='hlc-ck';b.setAttribute('role','dialog');b.setAttribute('aria-label','Cookies');
    b.innerHTML=T('<p>🍪 Usamos cookies propias y de terceros para medir visitas y enseñarte chollos que te interesen. Puedes aceptarlas o rechazarlas. <a href="/aviso-legal-datos-cookies/">Más información</a>.</p><div class="hlc-row"><button type="button" class="hlc-btn o" data-v="denied">Rechazar</button><button type="button" class="hlc-btn" data-v="granted">Aceptar</button></div>','<p>🍪 We use our own and third-party cookies to measure visits and show you deals you might like. You can accept or reject them. <a href="/aviso-legal-datos-cookies/">More info</a>.</p><div class="hlc-row"><button type="button" class="hlc-btn o" data-v="denied">Reject</button><button type="button" class="hlc-btn" data-v="granted">Accept</button></div>');
    b.addEventListener('click',function(e){var v=e.target&&e.target.getAttribute('data-v');if(!v)return;store(v);consent(v);b.remove();d.body.classList.remove('hlc-ck-open');});
    d.body.appendChild(b);d.body.classList.add('hlc-ck-open');
  }

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
    var body=d.body;if(!body.classList.contains('single'))return;
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
    b.innerHTML='<a class="'+(p==='/'||p.indexOf('/chollos')===0?'on':'')+'" href="/chollos/">'+IC.plane+'Chollos</a>'+
      '<a class="'+(p.indexOf('/alertas')===0?'on':'')+'" href="/alertas/">'+IC.bell+'Alertas</a>'+
      '<a href="'+L.hoteles+'" target="_blank" rel="sponsored nofollow noopener" data-hlc="bar_hoteles">'+IC.bed+'Hoteles</a>'+
      '<a class="'+(p.indexOf('/guias')===0?'on':'')+'" href="/guias-ciudades/">'+IC.map+'Guías</a>';
    d.body.appendChild(b);
  }

  /* ---------- Buscador (web estática) ---------- */
  function search(){
    d.addEventListener('submit',function(e){
      var f=e.target;if(!f||!f.querySelector)return;
      var i=f.querySelector('input[name="s"]');if(!i)return;
      e.preventDefault();var q=(i.value||'').trim();if(!q)return;track('buscar',q);
      w.location.href='https://www.google.com/search?q='+encodeURIComponent(q+' site:happylowcost.com');
    },true);
  }

  /* ---------- Chollos en vivo ---------- */
  var feedP=null;
  function feed(){if(!feedP)feedP=Promise.all([fetch(API+'?action=feed').then(function(r){return r.json();}).catch(function(){return [];}),fetch('/hlc/destinos.json').then(function(r){return r.json();}).catch(function(){return [];}),fetch('/chollos/hechos.json',{cache:'no-cache'}).then(function(r){return r.json();}).catch(function(){return [];})]).then(function(a){DESTS=a[1];HECHOS=a[2];return a[0];});return feedP;}
  var DESTS=[],HECHOS=[];w.HLC_feed=function(){return feed();};
  function sl(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
  w.HLC_photo=function(dest){var k=sl(dest);for(var i=0;i<DESTS.length;i++){var p=DESTS[i];if(p.s===k||sl(p.n)===k||(p.a||[]).indexOf(k)>=0){var n=Math.floor(Math.random()*((p.k||0)+1));return '/hlc/img/cities/'+p.s+(n?'-'+(n+1):'-800')+'.jpg';}}return null;};
  function dealUrl(x){return HECHOS.indexOf(x.slug)>=0?'/chollos/'+x.slug+'/':'/chollos/ver/?s='+encodeURIComponent(x.slug);}
  function flag(cc){cc=(cc||'').toUpperCase();return cc.length===2?String.fromCodePoint(127462+cc.charCodeAt(0)-65,127462+cc.charCodeAt(1)-65):'✈️';}
  var CONT={'Europa':['europa','🇪🇺','Europa'],'Asia':['asia','🌏','Asia'],'Oriente Medio':['oriente-medio','🕌','Oriente Medio'],'Norteamérica':['norteamerica','🗽','Norteamérica'],'Centroamérica y Caribe':['caribe','🏝️','Caribe'],'Sudamérica':['sudamerica','🌎','Sudamérica'],'África':['africa','🌍','África'],'Oceanía':['oceania','🦘','Oceanía']};
  function priceHtml(x){var f=x.facts||{};if(f.precio_normal&&f.precio_normal>x.price)return '<div class="dc-p"><s>'+esc(f.precio_normal)+' €</s>'+esc(x.price)+' €</div>';return '<div class="dc-p">'+esc(x.price)+' €</div>';}
  function card(x){
    var f=x.facts||{};var lib=w.HLC_photo(f.destino);var img=lib||(x.image_url||'');var c=CONT[f.continente]||null;var fresh=(Date.now()-Date.parse(x.approved_at))<12*36e5;
    var save=f.ahorro_pct?'<span class="dc-save">−'+esc(f.ahorro_pct)+' %</span>':'';
    return '<a class="dc" href="'+esc(dealUrl(x))+'" data-cont="'+(c?c[0]:'')+'" data-slug="'+esc(x.slug)+'"><div class="dc-img" style="background-image:url(\''+esc(img)+'\'),linear-gradient(135deg,#FF5A36,#2E6BF0)">'+save+'<span class="dc-ok">'+(fresh?'🔥 Nuevo':'✓ hace '+ago(x.approved_at))+'</span><span class="dc-fav" role="button" tabindex="0" aria-label="Guardar en favoritos" data-fav="'+esc(x.slug)+'">♡</span><span class="dc-city">'+esc(f.destino||'')+'</span></div>'+
      '<div class="dc-b"><div><div class="dc-r"><span class="dc-flag">'+flag(f.origen_cc)+'</span> '+esc(f.origen||'')+' → '+esc(f.destino||'')+'</div><div class="dc-m">'+esc(f.tipo||'')+(f.escalas===0?' · directo':'')+(f.ida?' · '+new Date(f.ida).toLocaleDateString('es-ES',{day:'numeric',month:'short'}):'')+'</div></div>'+priceHtml(x)+'</div></a>';
  }
  function renderDeals(){
    var boxes=d.querySelectorAll('[data-hlc-deals]');if(!boxes.length)return;
    feed().then(function(list){
      var td=new Date().toISOString().slice(0,10);list=(list||[]).filter(function(x){return x.slug&&x.price&&(!x.facts||!x.facts.ida||x.facts.ida>=td)&&(w.HLC_photo((x.facts||{}).destino)||x.image_url);});list=list.map(function(x,i){return [geoRank(x),i,x];}).sort(function(a,b){return a[0]-b[0]||a[1]-b[1];}).map(function(a){return a[2];});
      boxes.forEach(function(box){
        var max=+box.getAttribute('data-max')||12;var o=ls('hlc_origin');
        var l=list;if(box.hasAttribute('data-savings')){var sv=l.filter(function(x){return (x.facts||{}).ahorro_pct;});l=sv.concat(l.filter(function(x){return !(x.facts||{}).ahorro_pct;}));}if(o&&box.hasAttribute('data-filter')&&!box.hasAttribute('data-savings')){var lo=list.filter(function(x){return (x.facts&&x.facts.origen)===o;});if(lo.length)l=lo;}
        if(!l.length){box.innerHTML='<div class="dc-empty"><b>Estamos cazando los próximos chollos.</b><span>Crea una alerta y te avisamos en cuanto salga uno desde tu aeropuerto.</span><a class="hlc-btn" href="/alertas/">Crear alerta gratis</a></div>';return;}
        var tab=box.getAttribute('data-tab')||'';if(tab){var lt=l.filter(function(x){var c=CONT[(x.facts||{}).continente];return c&&c[0]===tab;});l=lt;}
        if(!l.length){box.innerHTML='<div class="dc-empty"><b>Hoy no hay chollos en esta zona.</b><span>Mira otro continente o crea una alerta gratis.</span><a class="hlc-btn" href="/alertas/">Crear alerta gratis</a></div>';return;}
        box.innerHTML=l.slice(0,max).map(card).join('');
      });
      paintFavs();tabsCount(list);ticker(list);geoNote(list);heroDeal(list);
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
    feed().then(function(list){var s=m.getAttribute('data-deal-slug');if(!(list||[]).some(function(x){return x.slug===s;})||(ida&&ida<new Date().toISOString().slice(0,10))){var b=d.createElement('div');b.className='hlc-old';b.innerHTML=T('<b>⏰ Este chollo ya ha caducado.</b> Los precios cambian rápido. <a href="/chollos/">Mira los chollos de hoy</a> o <a href="/alertas/">crea una alerta</a> para el próximo.','<b>⏰ This deal has expired.</b> Prices move fast. <a href="/en/deals/">See today\'s deals</a>.');var t=d.querySelector('.deal-body');if(t)t.parentNode.insertBefore(b,t);}});
  }
  /* ---------- Volver arriba ---------- */
  function toTop(){var b=d.createElement('button');b.className='hlc-top';b.type='button';b.setAttribute('aria-label',T('Volver arriba','Back to top'));b.textContent='↑';d.body.appendChild(b);b.onclick=function(){w.scrollTo({top:0,behavior:'smooth'});};w.addEventListener('scroll',function(){b.classList.toggle('on',w.scrollY>1200);},{passive:true});}

  /* ---------- Alertas ---------- */
  function alerts(){
    d.querySelectorAll('form[data-hlc-alert]').forEach(function(f){
      try{var qd=new URLSearchParams(location.search).get('d');var di=f.querySelector('[name=destination]');if(qd&&di)di.value=qd.slice(0,60);}catch(e){}
      f.querySelectorAll('[data-chip]').forEach(function(c){c.addEventListener('click',function(){var on=c.getAttribute('aria-pressed')==='true';c.setAttribute('aria-pressed',on?'false':'true');});});
      f.querySelectorAll('[data-pick]').forEach(function(c){c.addEventListener('click',function(){var g=c.getAttribute('data-pick');f.querySelectorAll('[data-pick="'+g+'"]').forEach(function(x){x.setAttribute('aria-pressed','false');});c.setAttribute('aria-pressed','true');var ch=f.querySelector('[name=contact]');if(g==='channel'&&ch){var wa=c.getAttribute('data-v')==='whatsapp';ch.type=wa?'tel':'email';ch.placeholder=wa?'+34 600 000 000':'tu@email.com';var lb=f.querySelector('[data-contact-label]');if(lb)lb.textContent=wa?'Tu número de WhatsApp':'Tu email';}});});
      f.addEventListener('submit',function(e){
        e.preventDefault();
        var msg=f.querySelector('[data-msg]');var btn=f.querySelector('[type=submit]');
        var origins=[].map.call(f.querySelectorAll('[data-chip][aria-pressed=true]'),function(c){return c.getAttribute('data-v');});
        var pr=f.querySelector('[data-pick=price][aria-pressed=true]');var chn=f.querySelector('[data-pick=channel][aria-pressed=true]');
        var body={action:'alert',origins:origins,destination:(f.querySelector('[name=destination]')||{}).value||'',max_price:pr?+pr.getAttribute('data-v'):null,channel:chn?chn.getAttribute('data-v'):'email',contact:(f.querySelector('[name=contact]')||{}).value||'',consent:!!(f.querySelector('[name=consent]')||{}).checked};
        btn.disabled=true;msg.textContent='Guardando…';
        fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json();}).then(function(j){
          if(j.ok){f.classList.add('done');msg.textContent='';track('alerta_creada',body.channel);if(origins[0])ls('hlc_origin',origins[0]);var ok=f.querySelector('[data-ok]');if(ok){ok.hidden=false;ok.querySelector('[data-sum]').textContent=(origins.length?origins.join(', '):'cualquier aeropuerto de España')+(body.max_price?' por menos de '+body.max_price+' €':'');}}
          else{msg.textContent=j.error||'No se ha podido guardar. Prueba otra vez.';btn.disabled=false;}
        }).catch(function(){msg.textContent='Sin conexión. Prueba otra vez.';btn.disabled=false;});
      });
    });
  }

  function geoNote(list){
    var box=d.querySelector('[data-hlc-deals]');if(!box||d.querySelector('.geo-note'))return;var o=ls('hlc_origin')||GEO.o;
    var mine=list.filter(function(x){return geoRank(x)<3;}).length;
    var n=d.createElement('div');n.className='geo-note';
    n.innerHTML=(mine?'📍 Te enseñamos primero los chollos con salida desde <b>'+esc(GEO.r==='es'?o:GEO.reg.label)+'</b>.':'📍 Hoy no hay chollos con salida desde <b>'+esc(GEO.reg.label)+'</b>: te enseñamos los mejores del mundo. <a href="/alertas/">Avísame cuando salga uno</a>.')+' <button type="button" class="geo-ch">Cambiar origen</button>';
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
      var L=el.getAttribute('data-photos').split('|').filter(Boolean);if(L.length<2)return;
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

  /* ---------- Portada: alerta rápida (aeropuerto + email o WhatsApp) ---------- */
  function quick(){
    d.querySelectorAll('form[data-hlc-quick]').forEach(function(f){
      var sel=f.querySelector('[name=origin]'),o=ls('hlc_origin');
      if(sel&&o){for(var i=0;i<sel.options.length;i++)if(sel.options[i].text===o){sel.selectedIndex=i;break;}}
      if(sel)sel.addEventListener('change',function(){ls('hlc_origin',sel.value);try{w.dispatchEvent(new CustomEvent('hlc:origin',{detail:sel.value}));}catch(e){}});
      f.addEventListener('submit',function(e){
        e.preventDefault();var msg=f.querySelector('[data-msg]'),btn=f.querySelector('[type=submit]');
        var c=(f.querySelector('[name=contact]').value||'').trim(),isMail=c.indexOf('@')>0,tel=c.replace(/[^\d+]/g,'');
        if(!isMail&&tel.replace(/\D/g,'').length<8){msg.textContent=T('Escribe tu email o tu número de WhatsApp (con prefijo).','Enter your email or WhatsApp number (with country code).');return;}
        if(!f.querySelector('[name=consent]').checked){msg.textContent=T('Marca la casilla para poder avisarte.','Tick the box so we can alert you.');return;}
        var body={action:'alert',origins:[sel?sel.value:''],destination:'',max_price:null,channel:isMail?'email':'whatsapp',contact:isMail?c:(tel.charAt(0)==='+'?tel:'+'+tel),consent:true};
        btn.disabled=true;msg.textContent=T('Guardando…','Saving…');
        fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json();}).then(function(j){
          if(j.ok){f.classList.add('done');ls('hlc_origin',body.origins[0]);track('alerta_rapida',body.channel);f.innerHTML='<div class="qf-done"><b>'+T('¡Hecho! ✈️','Done! ✈️')+'</b><span>'+T('Te avisaremos del próximo chollo desde ','We will alert you to the next deal from ')+esc(body.origins[0])+'.</span><a href="/chollos/">'+T('Mientras, mira los de hoy →','Meanwhile, see today\'s deals →')+'</a></div>';}
          else{msg.textContent=j.error||T('No se ha podido guardar. Prueba otra vez.','Could not save. Try again.');btn.disabled=false;}
        }).catch(function(){msg.textContent=T('Sin conexión. Prueba otra vez.','No connection. Try again.');btn.disabled=false;});
      });
    });
  }
  function heroDeal(list){
    var a=d.querySelector('[data-hlc-hero-deal]');if(!a||a.dataset.done)return;a.dataset.done=1;
    var withSave=list.filter(function(x){return (x.facts||{}).precio_normal;});var pool=(withSave.length?withSave:list);
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

  /* ---------- Medición de clics de afiliado ---------- */
  function clicks(){
    d.addEventListener('click',function(e){
      var el=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!el)return;
      var h=el.getAttribute('href')||'';
      var t=el.getAttribute('data-hlc')||(/click-101900924-/.test(h)?'cj_'+(h.match(/click-101900924-(\d+)/)||[])[1]:/ecobeachcity/.test(h)?'ecobeachcity':'');
      if(t)track(t,location.pathname);
    },true);
  }

  function init(){
    [langSwitch,quick,search,clicks,oldDealNotice,toolsBox,mobileBar,regionChips,origins,tabs,renderDeals,alerts,reveal,cookieBanner,favs,share,dealState,toTop,heroRotate].forEach(function(f){try{f();}catch(e){}});
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init);else init();
})();
