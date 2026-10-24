
(function(){
function boot(){
if(!document.body||!document.body.classList.contains('home')||document.body.classList.contains('page')) return;
var main=document.querySelector('main'), hero=document.querySelector('.hero');
if(!main) return;
/* ---------- diccionario EN ---------- */
var EN={
"Lo ultimo":"Latest writing","Lo último":"Latest writing","Destinos":"Destinations",
"Ver todo →":"See all →","Recien salido":"Fresh out","Recién salido":"Fresh out",
"Por donde empezar":"Where to start","Por dónde empezar":"Where to start",
"Inicio":"Home","Europa":"Europe","Asia":"Asia","África":"Africa","America":"Americas","América":"Americas",
"Oceanía":"Oceania","Consejos":"Tips","Ofertas de Viaje":"Travel deals","¿Quién soy?":"About me","Contacto":"Contact",
"España":"Spain","Reino Unido":"United Kingdom","Italia":"Italy","Alemania":"Germany","Brasil":"Brazil",
"Escocia":"Scotland","Londres":"London","Holanda":"Netherlands","Edimburgo":"Edinburgh","Florencia":"Florence",
"Sin categoría":"Uncategorised","Explorar":"Explore","Buscar":"Search","Leer más":"Read more"
};
var TITLES={
"/el-festival-de-la-luz-de-amsterdam/":["The Amsterdam Light Festival","Twenty light installations along the canals of the coldest, most electric city in northern Europe."],
"/moda-sostenible-un-museo-en-amsterdam/":["Sustainable fashion, a museum in Amsterdam","The Dutch turned recycling into an art form. There is a museum to prove it."],
"/san-nicolas/":["Sinterklaas, the Dutch Saint Nicholas","Every 5 December the Netherlands stops for a saint. What it is and why it matters there."],
"/maison-amsterdam/":["Maison Amsterdam","A city with an infinite number of ways to spend an afternoon. Here is one of the best."],
"/5-ferias-de-buenos-aires-que-tienes-que-conocer/":["5 Buenos Aires markets you have to see","The open-air markets are back. This city has more going on than almost any other."],
"/el-barrio-chino-de-buenos-aires/":["Inside the Chinatown of Buenos Aires","One of the largest and most important communities in the city, in a handful of streets."],
"/descubriendo-tenerife/":["Discovering Tenerife","Where to go when travel starts again and you have a list to work through."],
"/pueblos-cerca-de-lisboa/":["4 towns near Lisbon worth falling for","Lisbon is wonderful. Just outside it there are four places that are better."],
"/las-8-mejores-cafeterias-con-encanto-de-buenos-aires/":["The 8 loveliest cafes in Buenos Aires","Everyone thinks mate and asado. The coffee is the part nobody tells you about."],
"/el-tango-en-los-paises-bajos/":["Tango in the Netherlands","A dance from the Rio de la Plata that somehow took root 11,000 km away."],
"/parcela-sumba-curso-sevilla-venture-builder/":["A plot, two days with me, and a share of what we launch","Two places. Land in Sumba, two days building with me in Seville, and a percentage of the venture builder we plan to launch 100 projects a year from."],
"/beachfront-town-sumba/":["Why we are building a beachfront town","Sumba is 400 km east of Bali and almost nobody has been. Why I stopped writing and started building."]
};
/* ---------- guardar originales ---------- */
var NODES=[];
function collect(sel){ document.querySelectorAll(sel).forEach(function(e){
var i=e.querySelector('i');
var t=i? (e.childNodes[0]?e.childNodes[0].textContent.trim():'') : e.textContent.trim();
if(!t) return; NODES.push({e:e,es:e.textContent,key:t,txt:i?e.childNodes[0]:null}); }); }
collect('.nav a');
collect('.sec-head h2');
collect('.eyebrow');
collect('.more');
collect('.foot-grid h4');
collect('.foot-grid a');
collect('.destinos a');
var CARDS=[];
document.querySelectorAll('.card').forEach(function(c){
var a=c.querySelector('a[href]'); if(!a) return;
var q=a.getAttribute('href').split('://').pop(); var p=q.substring(q.indexOf('/'));
var h=c.querySelector('h3'), x=c.querySelector('.ex');
if(TITLES[p]) CARDS.push({h:h,x:x,es:[h?h.textContent:'',x?x.textContent:''],en:TITLES[p]});
});
(function(){var c=document.querySelector('.hero-card'); if(!c) return; var a=c.querySelector('h1 a[href]'); if(!a) return; var q=a.getAttribute('href').split('://').pop(); var p=q.substring(q.indexOf('/')); var h=c.querySelector('h1 a'), x=c.querySelector('.dek'); if(TITLES[p]) CARDS.push({h:h,x:x,es:[h?h.textContent:'',x?x.textContent:''],en:TITLES[p]});})();
function setLang(l){
NODES.forEach(function(n){
if(l==='es'){ if(n.txt){ n.txt.textContent=n.key+' '; } else { n.e.textContent=n.es; } return; }
var t=n.key, tr=EN[t];
if(!tr){ /* destinos llevan el numero dentro de un <i> */ }
if(tr){ if(n.txt){ n.txt.textContent=tr+' '; } else { n.e.textContent=tr; } }
});
CARDS.forEach(function(c){
if(c.h) c.h.textContent = l==='es'? c.es[0] : c.en[0];
if(c.x) c.x.textContent = l==='es'? c.es[1] : c.en[1];
});
document.querySelectorAll('.oh [data-en]').forEach(function(e){ e.textContent=e.getAttribute('data-'+l); });
document.querySelectorAll('.oh [data-en-html]').forEach(function(e){ e.innerHTML=e.getAttribute('data-'+l+'-html'); });
document.querySelectorAll('.oh-lang button').forEach(function(b){ b.classList.toggle('on',b.getAttribute('data-lang')===l); });
document.documentElement.setAttribute('data-oh-lang',l);
try{ localStorage.setItem('oh-lang',l); }catch(e){}
}
/* ---------- barra de idioma ---------- */
var lang=document.createElement('div');
lang.className='oh oh-lang';
lang.innerHTML='<div class="oh-lang-in"><button type="button" data-lang="en" class="on">EN</button><button type="button" data-lang="es">ES</button></div>';
main.insertBefore(lang,main.firstChild);
lang.querySelectorAll('button').forEach(function(b){ b.addEventListener('click',function(){ setLang(b.getAttribute('data-lang')); }); });
/* ---------- bloques nuevos ---------- */
var wrap2=document.createElement('div');
wrap2.className='oh'; wrap2.id='oh-inject2';
wrap2.innerHTML=
'<section class="oh-sec"><div class="oh-w"><div class="oh-pod"><div>'
+'<span class="oh-eye" data-en="The podcast" data-es="El podcast"></span>'
+'<h2 data-en="Come and record with me" data-es="Ven a grabar conmigo"></h2>'
+'<p data-en="Long, unhurried conversations. No script, no promo, no thirty-second answers." data-es="Conversaciones largas y sin prisa. Sin guion, sin promo, sin respuestas de treinta segundos."></p>'
+'<ul class="oh-pod-list">'
+'<li><span data-en="People who build things nobody asked them to build" data-es="Gente que construye cosas que nadie le ha pedido"></span></li>'
+'<li><span data-en="Points and miles obsessives with a better trick than mine" data-es="Obsesos de los puntos con un truco mejor que el mío"></span></li>'
+'<li><span data-en="Anyone who moved somewhere unreasonable and made it work" data-es="Cualquiera que se haya mudado a un sitio poco razonable y le haya salido bien"></span></li></ul>'
+'<a class="oh-btn" href="https://cal.com/team/luxury-beach-residence/podcast" target="_blank" rel="noopener"><span data-en="Book time for the podcast" data-es="Reserva hora para el podcast"></span></a>'
+'</div><div class="oh-pod-media"><a href="https://www.youtube.com/@CarlosDeOry" target="_blank" rel="noopener"><div>'
+'<div class="pl"></div>'
+'<strong data-en="Watch on YouTube" data-es="Ver en YouTube"></strong><span>@CarlosDeOry</span>'
+'</div></a></div></div></div></section>'
+'<section class="oh-sec oh-band"><div class="oh-w"><div class="oh-head">'
+'<h2 data-en="I stopped writing about nice places" data-es="Dejé de escribir sobre sitios bonitos"></h2>'
+'<a class="oh-more" href="/beachfront-town-sumba/"><span data-en="Read the story →" data-es="Leer la historia →"></span></a></div>'
+'<p class="oh-lead" data-en="Sumba is 400 km east of Bali and almost nobody has been. We are building a town there: villas, a coworking space in front of the sea, Starlink that holds a video call. These are the first people who came and stayed." data-es="Sumba está 400 km al este de Bali y casi nadie ha estado. Estamos construyendo un pueblo allí: villas, un coworking frente al mar y Starlink que aguanta una videollamada. Estos son los primeros que vinieron y se quedaron."></p>'
+'<div class="oh-revs">'
+'<div class="oh-rev"><q data-en="One of the best places I have ever stayed. The enormous private beach and the feeling of being on a deserted island. The Starlink worked really well, even for video calls." data-es="Uno de los mejores sitios en los que he estado. La playa privada enorme y la sensación de estar en una isla desierta. El Starlink funcionó muy bien, incluso para videollamadas."></q><cite><b>Ignacio</b> &middot; Booking.com <s>10/10</s></cite></div>'
+'<div class="oh-rev"><q data-en="A little piece of paradise. It felt like a luxury safari camp in Africa, with a padel court right by the ocean. For less than $100 I got five-star service." data-es="Un pedacito de paraíso. Parecía un campamento de safari de lujo en África, con una pista de pádel junto al océano. Por menos de 100 dólares tuve un servicio de cinco estrellas."></q><cite><b>Xiaoli</b> &middot; Booking.com <s>10/10</s></cite></div>'
+'<div class="oh-rev"><q data-en="The beach is enormous and wonderfully peaceful. Above all, the team is the best part of this place." data-es="La playa es enorme y maravillosamente tranquila. Y por encima de todo, el equipo es lo mejor de este sitio."></q><cite><b>Luis</b> &middot; Booking.com <s>10/10</s></cite></div>'
+'</div></div></section>'
+'<section class="oh-sec"><div class="oh-w"><div class="oh-head"><h2 data-en="What I am building" data-es="Lo que estoy construyendo"></h2></div>'
+'<div class="oh-projs">'
+'<a class="oh-proj give" href="https://supportnear.com" target="_blank" rel="noopener"><span class="k" data-en="Non-profit · the one I am proudest of" data-es="Sin ánimo de lucro · de lo que más orgulloso estoy"></span><h3>SupportNear</h3><p data-en="Free food, shelter, showers and clothes on one live map. 37,000+ places in 147 countries. No account, no tracking, no cost." data-es="Comida, refugio, duchas y ropa gratis en un mapa. Más de 37.000 sitios en 147 países. Sin cuenta, sin rastreo, sin coste."></p><span class="go" data-en="Open the map →" data-es="Abrir el mapa →"></span></a>'
+'<a class="oh-proj" href="https://ecobeachcity.com" target="_blank" rel="noopener"><span class="k">Sumba, Indonesia</span><h3>Eco Beach City</h3><p data-en="A beachfront town from scratch. Land, villas and a coworking space in front of the sea." data-es="Un pueblo frente al mar desde cero. Terreno, villas y un coworking delante del agua."></p><span class="go" data-en="See it →" data-es="Verlo →"></span></a>'
+'<a class="oh-proj" href="https://happylowcost.com" target="_blank" rel="noopener"><span class="k" data-en="Where it started" data-es="Donde empezó todo"></span><h3>Happy Low Cost</h3><p data-en="The travel deals project that taught me everything about flying for less." data-es="El proyecto de ofertas de viaje que me enseñó todo sobre volar por menos."></p><span class="go" data-en="Visit →" data-es="Visitar →"></span></a>'
+'</div></div></section>';
var dest=null;
document.querySelectorAll('.sec').forEach(function(s){ if(s.querySelector('.destinos')) dest=s; });
if(dest?dest.parentNode:null) dest.parentNode.insertBefore(wrap2,dest); else main.appendChild(wrap2);
var saved='en'; try{ saved=localStorage.getItem('oh-lang')||'en'; }catch(e){}
setLang(saved==='es'?'es':'en');
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
