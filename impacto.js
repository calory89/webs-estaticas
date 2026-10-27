// Pagina publica de impacto: solo recuentos agregados (sin cookies ni datos
// personales). Nunca el texto que la gente escribe en el buscador.
(function(){
  var es = /[?&]lang=es\b/.test(location.search) || (!/[?&]lang=/.test(location.search) && /^es\b/i.test(navigator.language||''));
  var L = es ? {h:'A cuánta gente ayuda SupportNear',p:'Recuentos agregados, sin cookies ni datos personales: no sabemos quién entra, solo cuántas veces y en qué idioma.',m:'Últimos 3 meses',views:'Visitas',langs:'Idiomas',cc:'Países (código)',need:'Lo que se busca',sos:'Veces que se abrió Emergencias',off:'Usos sin conexión',inst:'Instalaciones',share:'Veces compartido',empty:'Búsquedas sin nada cerca (falta en el mapa)',back:'Volver al mapa',none:'Todavía no hay datos.',err:'No se han podido cargar los datos. Prueba más tarde.',other:'English',note:'Los datos del mapa son de OpenStreetMap. Desde el 27 de octubre de 2026 el contador está en Supabase; lo anterior se perdió con el cambio de servidor.'}
         : {h:'How many people SupportNear helps',p:'Aggregate counts, no cookies and no personal data: we do not know who visits, only how often and in which language.',m:'Last 3 months',views:'Visits',langs:'Languages',cc:'Countries (code)',need:'What people look for',sos:'Times Emergency was opened',off:'Uses with no connection',inst:'Installs',share:'Times shared',empty:'Searches with nothing nearby (missing on the map)',back:'Back to the map',none:'No data yet.',err:'Could not load the data. Try again later.',other:'Español',note:'Map data from OpenStreetMap. Since 27 October 2026 the counter runs on Supabase; earlier counts were lost when the server changed.'};
  document.documentElement.lang = es ? 'es' : 'en';
  document.title = L.h + ' · SupportNear';
  var w = document.getElementById('w');
  function el(tag, txt, cls){ var e=document.createElement(tag); if(txt!=null) e.textContent=txt; if(cls) e.className=cls; return e; }
  function big(n){ return Number(n||0).toLocaleString(es?'es-ES':'en-GB'); }
  function head(){
    w.textContent='';
    var p=el('p'); var a=el('a','← '+L.back); a.href='./'; p.appendChild(a); p.appendChild(document.createTextNode(' · '));
    var b=el('a',L.other); b.href='?lang='+(es?'en':'es'); p.appendChild(b); w.appendChild(p);
    w.appendChild(el('h1',L.h)); w.appendChild(el('p',L.p));
  }
  function tbl(vals){
    var rows=Object.keys(vals||{}).filter(function(k){return k!=='_all'&&k!=='_other'&&k!=='_';}).sort(function(a,b){return vals[b]-vals[a];}).slice(0,12);
    if(!rows.length) return null;
    var t=el('table'); rows.forEach(function(k){ var tr=el('tr'); tr.appendChild(el('td',k)); tr.appendChild(el('td',big(vals[k]))); t.appendChild(tr); }); return t;
  }
  head();
  fetch('/__sb/public/rest/v1/rpc/sn_impact',{method:'POST',credentials:'omit',headers:{'content-type':'application/json','apikey':'sb_publishable_WWMM9pbZfP4hJosLJlTobg_lWFGoJ3X'},body:'{}'})
   .then(function(r){ if(!r.ok) throw 0; return r.json(); })
   .then(function(j){
     var tot=(j&&j.tot)||{};
     if(j && j.from) w.appendChild(el('p')).appendChild(el('small',L.m+': '+j.from+' → '+j.to));
     if(!Object.keys(tot).length){ w.appendChild(el('p',L.none)); return; }
     var k=el('div',null,'k');
     [['views','view'],['sos','sos'],['off','offline'],['share','share'],['inst','install']].forEach(function(c){
       var d=el('div'); d.appendChild(el('b',big(tot[c[1]]&&tot[c[1]]._all))); d.appendChild(el('span',L[c[0]])); k.appendChild(d); });
     w.appendChild(k);
     var g=el('div',null,'g');
     [['langs','lang'],['cc','cc'],['need','need'],['empty','empty']].forEach(function(c){ var t=tbl(tot[c[1]]); if(!t) return; var d=el('div'); d.appendChild(el('h2',L[c[0]])); d.appendChild(t); g.appendChild(d); });
     w.appendChild(g);
   })
   .catch(function(){ w.appendChild(el('p',L.err)); })
   .then(function(){ w.appendChild(el('p')).appendChild(el('small',L.note)); });
})();
