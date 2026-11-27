(function(){
var R={comer:['Comer hoy: comedores sociales','comedores-sociales-abiertos-hoy'],dormir:['Dormir esta noche: albergues y urgencias sociales','donde-dormir-esta-noche-albergues'],
medico:['Médico gratis','medico-gratis-sin-papeles'],ducha:['Duchas y lavar la ropa','duchas-gratis'],nopadron:['Empadronarte sin domicilio','empadronarse-sin-domicilio'],
nopapeles:['Sanidad sin residencia legal','medico-gratis-sin-papeles'],sinrenta:['Ingreso Mínimo Vital','ingreso-minimo-vital-como-pedirlo'],
hijos:['Cosas para bebés y prioridad para familias','ropa-y-panales-para-bebes-gratis'],mayor:['Ayuda para mayores y discapacidad','ayuda-mayores-y-discapacidad']};
var b=document.getElementById('orient-go'),o=document.getElementById('orient-out');if(!b||!o)return;
var f=document.getElementById('orient');f&&f.addEventListener('submit',function(e){e.preventDefault()});b.addEventListener('click',function(){var v=[].slice.call(document.querySelectorAll('#orient input:checked')).map(function(x){return x.value});
var seen={},li=[];v.forEach(function(k){var r=R[k];if(r&&!seen[r[1]]){seen[r[1]]=1;li.push('<li><a href="'+r[1]+'">'+r[0]+'</a></li>')}});
var first=v.indexOf('dormir')>=0||v.indexOf('comer')>=0?'<p><strong>Empieza hoy por aquí:</strong> llama a servicios sociales de urgencia de tu ciudad (o al 112 si hay peligro).</p>':'<p><strong>Empieza por aquí:</strong> pide cita en servicios sociales de tu ayuntamiento.</p>';
o.innerHTML=li.length?first+'<ol>'+li.join('')+'</ol>':'<p>Marca al menos una casilla.</p>';o.focus&&o.focus();});})();
