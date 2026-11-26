(function(){
  var $=function(id){return document.getElementById(id)};
  var LS={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
  // nav + sticky
  var nav=$('nav'),st=$('sticky');
  function onScroll(){var y=window.scrollY;nav.classList.toggle('solid',y>60);var r=$('reserve').getBoundingClientRect();st.classList.toggle('on',y>innerHeight*0.8&&!(r.top<innerHeight&&r.bottom>0));}
  addEventListener('scroll',onScroll,{passive:true});onScroll();
  // reveal
  var io='IntersectionObserver' in window?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'}):null;
  document.querySelectorAll('.rv').forEach(function(el){io?io.observe(el):el.classList.add('in')});
  // attribution
  try{var q=new URLSearchParams(location.search),a=JSON.parse(LS.get('lik_attr')||'null');if(q.get('utm_source')||q.get('fbclid')||!a){a={utm_source:q.get('utm_source'),utm_campaign:q.get('utm_campaign'),utm_content:q.get('utm_content'),fbclid:q.get('fbclid'),ref:document.referrer||null,landed_at:new Date().toISOString()};LS.set('lik_attr',JSON.stringify(a))}}catch(e){var a={}}
  // countries
  var C=['United Kingdom','Australia','Singapore','Netherlands','Germany','Switzerland','Austria','Ireland','United States','Canada','New Zealand','Hong Kong','United Arab Emirates','Saudi Arabia','Qatar','South Korea','Japan','Taiwan','China','Malaysia','Indonesia','Thailand','Philippines','India','France','Belgium','Luxembourg','Denmark','Sweden','Norway','Finland','Spain','Portugal','Italy','Poland','Czechia','Greece','Israel','Turkey','Mexico','Brazil','Argentina','Chile','Colombia','Other'];
  var co=$('co');co.innerHTML='<option value="">Select</option>'+C.map(function(x){return '<option>'+x+'</option>'}).join('');
  try{var lm={'en-gb':'United Kingdom','en-au':'Australia','en-sg':'Singapore','nl':'Netherlands','nl-nl':'Netherlands','de':'Germany','de-de':'Germany','de-ch':'Switzerland','de-at':'Austria','en-ie':'Ireland','en-us':'United States','en-ca':'Canada','en-nz':'New Zealand','es':'Spain','es-es':'Spain','fr':'France','fr-fr':'France','it':'Italy','id':'Indonesia','ja':'Japan','ko':'South Korea','zh-hk':'Hong Kong','zh-tw':'Taiwan'};var g=lm[(navigator.language||'').toLowerCase()];if(g)co.value=g}catch(e){}
  // total
  function radio(n){var x=document.querySelector('input[name="'+n+'"]:checked');return x?x.value:''}
  document.querySelectorAll('input[name="wk"]').forEach(function(r){r.addEventListener('change',function(){$('tot').textContent='€'+(6500*+radio('wk')).toLocaleString('en-GB')})});
  // calculator
  var yr=$('yrs');function calc(){var y=+yr.value,n=y*6,p=Math.round(6500/n);$('yrsn').textContent=y;$('nights').textContent=n;$('ppn').textContent='€'+p;$('pppn').textContent='€'+Math.round(p/2)}
  if(yr){yr.addEventListener('input',calc);calc()}
  // summary
  function sum(){var w=+radio('wk'),se=radio('se');$('sum').textContent=w+(w>1?' weeks':' week')+' a year · '+(se==='Flexible'?'flexible season':se.replace('-','–'))+' · for 2 people'}
  document.querySelectorAll('#rf input[type=radio]').forEach(function(r){r.addEventListener('change',sum)});
  // draft
  var F=['fn','em','co','wa'];try{var d=JSON.parse(LS.get('lik_draft')||'null');if(d)F.forEach(function(k){if(d[k])$(k).value=d[k]})}catch(e){}
  $('rf').addEventListener('input',function(){var d={};F.forEach(function(k){d[k]=$(k).value});LS.set('lik_draft',JSON.stringify(d))});
  // inline validation
  $('em').addEventListener('blur',function(){this.classList.toggle('bad',!!this.value&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.value))});
  $('fn').addEventListener('blur',function(){this.classList.toggle('bad',!!this.value&&this.value.trim().length<2)});
  // lightbox
  var lb=$('lb'),lbFrom=null;function lbOpen(i){lbFrom=i;lb.querySelector('img').src=i.src;lb.querySelector('img').alt=i.alt;lb.hidden=false;lb.querySelector('button').focus()}function lbClose(){if(lb.hidden)return;lb.hidden=true;if(lbFrom)lbFrom.focus()}
  document.querySelectorAll('#gal img,img.zoom,.realgal img,.built img').forEach(function(i){i.tabIndex=0;i.addEventListener('click',function(){lbOpen(i)});i.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();lbOpen(i)}})});
  lb.addEventListener('click',lbClose);addEventListener('keydown',function(e){if(e.key==='Escape')lbClose()});
  // active nav
  var links=[].slice.call(document.querySelectorAll('.nav ul a'));var secs=links.map(function(a){return document.querySelector(a.getAttribute('href'))});
  addEventListener('scroll',function(){var y=scrollY+120,cur=-1;secs.forEach(function(s,i){if(s&&s.offsetTop<=y)cur=i});links.forEach(function(a,i){a.classList.toggle('on',i===cur)})},{passive:true});
  // real drone video, loads only on click
  var v=$('video');if(v)v.addEventListener('click',function(){v.outerHTML='<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/b6SvJJgZedk?autoplay=1&rel=0" title="Karimunjawa drone video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>'});
  // print / save as PDF: open all answers first
  var pr=$('print');if(pr)pr.addEventListener('click',function(){document.querySelectorAll('details').forEach(function(d){d.open=true});document.querySelectorAll('.rv').forEach(function(e){e.classList.add('in')});setTimeout(function(){window.print()},50)});
  // copy ref
  $('copy').addEventListener('click',function(){try{navigator.clipboard.writeText($('refno').textContent);this.textContent='Copied'}catch(e){}});
  // submit
  var LIVE=/(^|\.)longevityisland\.(org|com)$/.test(location.hostname);
  var SB={url:location.origin+'/__sb/lacliniqueswiss',key:'sb_publishable_WWMM9pbZfP4hJosLJlTobg_lWFGoJ3X'};
  function err(t){var o=$('out');o.hidden=false;o.className='msg err';o.textContent=t}
  $('rf').addEventListener('submit',function(e){
    e.preventDefault();$('out').hidden=true;
    var name=$('fn').value.trim(),em=$('em').value.trim(),c=co.value;
    if(name.length<2)return err('Please add your full name.');
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em))return err('Please check your email, it should look like name@example.com.');
    if(!c){$('co').classList.add('bad');return err('Please choose your country.')}
    if(!$('ok').checked)return err('Please tick the box so we can email you about your reservation.');
    if($('website').value)return;
    var ref='LI-K-'+Math.random().toString(36).slice(2,6).toUpperCase();
    var row={name:name,email:em,phone:$('wa').value.trim()||null,consent:true,source:'karimunjawa/reserve',message:JSON.stringify({ref:ref,country:c,weeks:+radio('wk'),season:radio('se'),price_eur:6500*+radio('wk'),attr:a||{}})};
    var b=$('sb');b.disabled=true;b.textContent='Reserving your week…';
    (LIVE?fetch(SB.url+'/rest/v1/dossier_leads',{method:'POST',headers:{apikey:SB.key,Authorization:'Bearer '+SB.key,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(row)}).then(function(r){if(!r.ok)throw 0}):Promise.resolve()).then(function(){
      $('rf').hidden=true;$('done').hidden=false;$('refno').textContent=ref;LS.set('lik_ref',ref);LS.set('lik_draft','');var ce=new Date(Date.now()+14*864e5);$('coolend').textContent=ce.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
      $('share').href='https://wa.me/?text='+encodeURIComponent('I just reserved a week at Longevity Island in Karimunjawa: one week a year for 50 years, €6,500 for two. Take a look: '+location.origin+location.pathname);
      try{if(window.fbq)fbq('track','Lead')}catch(e){}
    }).catch(function(){b.disabled=false;b.textContent='Reserve my week, free →';err('Something went wrong. Please try again in a minute.')});
  });
})();
