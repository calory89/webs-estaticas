/* Happy Low Cost — mejoras globales (oct-2026) */
(function(){
  'use strict';
  var d=document, w=window;
  /* Solo enlaces de CJ (sitio Happy Low Cost, PID 101900924) */
  var CJ=function(aid,u){return 'https://www.kqzyfj.com/click-101900924-'+aid+'?sid=happylowcost&url='+encodeURIComponent(u);};
  var AID={hotel:'17288959',flight:'17288982',attr:'17288984',taxi:'17322565',car:'12506471',paris:'11585459'};
  var L={
    vuelos: CJ(AID.flight,'https://www.booking.com/flights/index.es.html'),
    hoteles: CJ(AID.hotel,'https://www.booking.com/index.es.html'),
    coches: CJ(AID.car,'https://www.holidayautos.com/es/'),
    tours: CJ(AID.attr,'https://www.booking.com/attractions/index.es.html'),
    traslados: CJ(AID.taxi,'https://www.booking.com/taxi/index.es.html'),
    paris: CJ(AID.paris,'https://www.pariscityvision.com/es'),
    fb: 'https://www.facebook.com/happylowcostofficialpage/'
  };
  function hotelsIn(city){return city?CJ(AID.hotel,'https://www.booking.com/searchresults.es.html?ss='+encodeURIComponent(city)):L.hoteles;}
  function a(href,txt,cls,ev){return '<a class="hlc-btn '+(cls||'')+'" href="'+href+'" target="_blank" rel="sponsored nofollow noopener" data-hlc="'+(ev||'')+'">'+txt+'</a>';}
  function track(name,label){try{(w.dataLayer=w.dataLayer||[]).push({event:'hlc_click',hlc_target:name,hlc_label:label||''});}catch(e){}}

  /* ---------- Cookies (RGPD) + Consent Mode v2 ---------- */
  function store(v){try{localStorage.setItem('hlc_ck',v);}catch(e){} try{d.cookie='hlc_ck='+v+';path=/;max-age=15552000;SameSite=Lax';}catch(e){}}
  function read(){var v=null;try{v=localStorage.getItem('hlc_ck');}catch(e){} if(!v){var m=d.cookie.match(/(?:^|; )hlc_ck=(\w+)/);v=m&&m[1];}return v;}
  function consent(v){
    var g=v==='granted'?'granted':'denied';
    try{w.gtag&&w.gtag('consent','update',{ad_storage:g,analytics_storage:g,ad_user_data:g,ad_personalization:g});}catch(e){}
    try{(w.dataLayer=w.dataLayer||[]).push({event:'hlc_consent',hlc_consent:g});}catch(e){}
  }
  function cookieBanner(){
    if(read())return;
    var b=d.createElement('div');b.className='hlc-ck';b.setAttribute('role','dialog');b.setAttribute('aria-label','Cookies');
    b.innerHTML='<p>🍪 Usamos cookies propias y de terceros para medir visitas y mostrarte ofertas de viaje relevantes. Puedes aceptarlas o rechazarlas. Más info en nuestra <a href="/aviso-legal-datos-cookies/">política de cookies</a>.</p><div class="hlc-row"><button type="button" class="hlc-btn o" data-v="denied">Rechazar</button><button type="button" class="hlc-btn" data-v="granted">Aceptar</button></div>';
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

  /* ---------- Aviso en chollos antiguos ---------- */
  function oldDealNotice(){
    var body=d.body; if(!body.classList.contains('single')&&!body.classList.contains('single-post'))return;
    var meta=d.querySelector('meta[property="article:published_time"]'); if(!meta)return;
    var pub=new Date(meta.getAttribute('content')); if(isNaN(pub))return;
    var days=(Date.now()-pub.getTime())/864e5; if(days<21)return;
    var h=d.querySelector('h1.post-title, h1.entry-title, .header-standard h1'); var title=h?h.textContent:d.title;
    var isDeal=/€|chollo|ganga|oferta|vuelos?|hotel|d[ií]as/i.test(title); if(!isDeal)return;
    var city=cityFromTitle(title);
    var box=d.createElement('div');box.className='hlc-old';
    box.innerHTML='🕒 <strong>Chollo publicado el '+fmtDate(pub)+'.</strong> Los precios de vuelos y hoteles cambian cada día, así que este precio puede ya no estar disponible. Comprueba cuánto cuesta hoy:'+
      '<div class="hlc-row">'+a(L.vuelos,'✈️ Vuelos baratos hoy','b','vuelos')+a(hotelsIn(city),'🏨 Hoteles'+(city?' en '+city:''),'','hoteles')+a(L.tours,'🎟️ Excursiones','g','tours')+'</div>';
    var c=d.querySelector('.inner-post-entry, .post-entry, .entry-content');
    if(c)c.insertBefore(box,c.firstChild);
  }

  /* ---------- Caja de herramientas si el artículo no la tiene ---------- */
  function toolsBox(){
    if(!d.body.classList.contains('single'))return;
    var c=d.querySelector('.inner-post-entry, .post-entry, .entry-content'); if(!c)return;
    if(/Te ayudamos a ahorrar/.test(c.textContent))return;
    var box=d.createElement('div');box.className='hlc-tools';
    box.innerHTML='<h3>Organiza tu viaje y ahorra</h3><div class="hlc-grid">'+a(L.vuelos,'✈️ Vuelos','b','vuelos')+a(L.hoteles,'🏨 Hoteles','','hoteles')+a(L.tours,'🎟️ Excursiones','g','tours')+a(L.traslados,'🚐 Traslados','o','traslados')+a(L.coches,'🚗 Coches','o','coches')+(/par[ií]s/i.test(d.title)?a(L.paris,'🗼 Tours en París','o','paris'):'')+'</div>';
    c.appendChild(box);
  }

  /* ---------- Barra fija en móvil ---------- */
  function mobileBar(){
    var b=d.createElement('nav');b.className='hlc-bar';b.setAttribute('aria-label','Reservar');
    b.innerHTML='<a class="hot" href="'+L.vuelos+'" target="_blank" rel="sponsored nofollow noopener" data-hlc="bar_vuelos"><i>✈️</i>Vuelos</a>'+
      '<a href="'+L.hoteles+'" target="_blank" rel="sponsored nofollow noopener" data-hlc="bar_hoteles"><i>🏨</i>Hoteles</a>'+
      '<a href="'+L.tours+'" target="_blank" rel="sponsored nofollow noopener" data-hlc="bar_tours"><i>🎟️</i>Excursiones</a>'+
      '<a href="'+L.fb+'" target="_blank" rel="noopener" data-hlc="bar_fb"><i>🔔</i>Chollos</a>';
    d.body.appendChild(b);
  }

  /* ---------- Buscador (la web ya no es WordPress) ---------- */
  function search(){
    d.addEventListener('submit',function(e){
      var f=e.target; if(!f||!f.querySelector)return;
      var i=f.querySelector('input[name="s"]'); if(!i)return;
      e.preventDefault();
      var q=(i.value||'').trim(); if(!q)return;
      track('buscar',q);
      w.location.href='https://www.google.com/search?q='+encodeURIComponent(q+' site:happylowcost.com');
    },true);
  }

  /* ---------- Medición de clics de afiliado ---------- */
  function clicks(){
    d.addEventListener('click',function(e){
      var el=e.target&&e.target.closest?e.target.closest('a[href]'):null; if(!el)return;
      var h=el.getAttribute('href')||'';
      var t=el.getAttribute('data-hlc')||(/click-101900924-/.test(h)?'cj_'+(h.match(/click-101900924-(\d+)/)||[])[1]:/ecobeachcity/.test(h)?'ecobeachcity':'');
      if(t)track(t,location.pathname);
    },true);
  }

  function init(){
    try{search();}catch(e){}
    try{clicks();}catch(e){}
    try{oldDealNotice();}catch(e){}
    try{toolsBox();}catch(e){}
    try{mobileBar();}catch(e){}
    try{cookieBanner();}catch(e){}
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init);else init();
})();
