document.documentElement.classList.add('hlc-js');
/* Happy Low Cost — script global (marca 2026) */
(function(){
  'use strict';
  var d=document, w=window;
  var API='https://gmdalfsvtfhzepyrdmjj.supabase.co/functions/v1/hlc-deals';
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

  /* ---------- Cookies (RGPD) + Consent Mode v2 ---------- */
  function store(v){ls('hlc_ck',v);try{d.cookie='hlc_ck='+v+';path=/;max-age=15552000;SameSite=Lax';}catch(e){}}
  function read(){var v=ls('hlc_ck');if(!v){var m=d.cookie.match(/(?:^|; )hlc_ck=(\w+)/);v=m&&m[1];}return v;}
  function consent(v){var g=v==='granted'?'granted':'denied';try{w.gtag&&w.gtag('consent','update',{ad_storage:g,analytics_storage:g,ad_user_data:g,ad_personalization:g});}catch(e){}try{(w.dataLayer=w.dataLayer||[]).push({event:'hlc_consent',hlc_consent:g});}catch(e){}}
  function cookieBanner(){
    if(read())return;
    var b=d.createElement('div');b.className='hlc-ck';b.setAttribute('role','dialog');b.setAttribute('aria-label','Cookies');
    b.innerHTML='<p>🍪 Usamos cookies propias y de terceros para medir visitas y enseñarte chollos que te interesen. Puedes aceptarlas o rechazarlas. <a href="/aviso-legal-datos-cookies/">Más información</a>.</p><div class="hlc-row"><button type="button" class="hlc-btn o" data-v="denied">Rechazar</button><button type="button" class="hlc-btn" data-v="granted">Aceptar</button></div>';
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
  function feed(){if(!feedP)feedP=fetch(API+'?action=feed').then(function(r){return r.json();}).catch(function(){return [];});return feedP;}
  function card(x){
    var f=x.facts||{};var img=x.image||('/chollos/'+x.slug+'/foto.jpg');
    return '<a class="dc" href="/chollos/'+esc(x.slug)+'/"><div class="dc-img" style="background-image:url(\''+esc(img)+'\'),linear-gradient(135deg,#FF5A36,#2E6BF0)"><span class="dc-ok">✓ Verificado hace '+ago(x.approved_at)+'</span><span class="dc-city">'+esc(f.destino||'')+'</span></div>'+
      '<div class="dc-b"><div><div class="dc-r">'+esc(f.origen||'')+' → '+esc(f.destino||'')+'</div><div class="dc-m">'+esc(f.tipo||'')+(f.escalas===0?' · directo':'')+(f.ida?' · '+new Date(f.ida).toLocaleDateString('es-ES',{day:'numeric',month:'short'}):'')+'</div></div><div class="dc-p">'+esc(x.price)+' €</div></div></a>';
  }
  function renderDeals(){
    var boxes=d.querySelectorAll('[data-hlc-deals]');if(!boxes.length)return;
    feed().then(function(list){
      list=(list||[]).filter(function(x){return x.slug&&x.price;});
      boxes.forEach(function(box){
        var max=+box.getAttribute('data-max')||12;var o=ls('hlc_origin');
        var l=list;if(o&&box.hasAttribute('data-filter')){var lo=list.filter(function(x){return (x.facts&&x.facts.origen)===o;});if(lo.length)l=lo;}
        if(!l.length){box.innerHTML='<div class="dc-empty"><b>Estamos cazando los próximos chollos.</b><span>Crea una alerta y te avisamos en cuanto salga uno desde tu aeropuerto.</span><a class="hlc-btn" href="/alertas/">Crear alerta gratis</a></div>';return;}
        box.innerHTML=l.slice(0,max).map(card).join('');
      });
    });
  }

  /* ---------- Alertas ---------- */
  function alerts(){
    d.querySelectorAll('form[data-hlc-alert]').forEach(function(f){
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

  /* ---------- Origen preferido (chips de la portada) ---------- */
  function origins(){
    d.querySelectorAll('[data-origin]').forEach(function(c){
      var cur=ls('hlc_origin')||'';if((c.getAttribute('data-origin')||'')===cur)c.setAttribute('aria-pressed','true');
      c.addEventListener('click',function(){d.querySelectorAll('[data-origin]').forEach(function(x){x.setAttribute('aria-pressed','false');});c.setAttribute('aria-pressed','true');ls('hlc_origin',c.getAttribute('data-origin'));feedP=null;renderDeals();track('origen',c.getAttribute('data-origin'));});
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
    [search,clicks,oldDealNotice,toolsBox,mobileBar,origins,renderDeals,alerts,reveal,cookieBanner].forEach(function(f){try{f();}catch(e){}});
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init);else init();
})();
