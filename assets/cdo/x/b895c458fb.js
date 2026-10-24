
(function () {
'use strict';
var D = document, H = D.documentElement;
/* ---------- Booking.com por CJ (enlace de top3hotels) ---------- */
var CJ = 'https://www.anrdoezrs.net/click-101900239-17293132?sid=carlosdeory&url=';
function isBk(h) { return h === 'booking.com' || h.slice(-12) === '.booking.com'; }
function toCJ(a) {
try {
var u = new URL(a.href);
if (!isBk(u.hostname)) { return; }
u.searchParams.delete('aid'); u.searchParams.delete('label');
a.href = CJ + encodeURIComponent(u.toString());
a.rel = 'sponsored noopener';
} catch (e) {}
}
function cjAll() { D.querySelectorAll('a[href*="booking.com"]').forEach(toCJ); }
['mousedown', 'touchstart', 'keydown', 'click'].forEach(function (t) {
D.addEventListener(t, function (e) { var a = e.target && e.target.closest ? e.target.closest('a[href]') : null; if (a) { toCJ(a); } }, true);
});
/* ---------- idioma ---------- */
function lang() {
if (D.body && D.body.classList.contains('home')) {
var l = H.getAttribute('data-oh-lang');
if (!l) { try { l = localStorage.getItem('oh-lang'); } catch (e) {} }
return l === 'es' ? 'es' : 'en';
}
return (H.lang || '').toLowerCase().indexOf('en') === 0 ? 'en' : 'es';
}
var ES2EN = {
'Explorar': 'Explore', 'Buscar': 'Search', 'Compartir': 'Share', 'Copiar enlace': 'Copy link',
'Sigue leyendo': 'Keep reading', 'Deja un comentario': 'Leave a comment', 'Publicar el comentario': 'Post comment',
'Algunos enlaces son de afiliado. No cambian el precio que pagas.': 'Some links are affiliate links. They never change the price you pay.',
'Aviso legal': 'Legal notice', 'Privacidad': 'Privacy', 'Cookies': 'Cookies', 'Términos': 'Terms', 'Transparencia': 'Transparency',
'Leer la guia': 'Read it', 'Leer la guía': 'Read it', 'Ver todo': 'See all', 'Viajes': 'Travel',
'Europa': 'Europe', 'España': 'Spain', 'Emprender': 'Building', 'Puntos y millas': 'Points and miles', 'Reino Unido': 'United Kingdom', 'América': 'Americas', 'Asia': 'Asia', 'Italia': 'Italy'
};
var MES = { enero: 'January', febrero: 'February', marzo: 'March', abril: 'April', mayo: 'May', junio: 'June', julio: 'July', agosto: 'August', septiembre: 'September', octubre: 'October', noviembre: 'November', diciembre: 'December' };
var ORIG = [];
function swapText(el, en) {
if (!el) { return; }
var rec = null;
ORIG.forEach(function (r) { if (r.el === el) { rec = r; } });
if (!rec) { rec = { el: el, es: el.textContent }; ORIG.push(rec); }
el.textContent = lang() === 'en' ? en : rec.es;
}
function trSimple() {
D.querySelectorAll('.foot-grid h4, .foot-grid li a, .chip, .share span, .sec-head h2, .comment-reply-title, .ory-legal a, .foot-bar span, .hero-meta .btn, .more, #toc_container .toc_title').forEach(function (el) {
var t = el.textContent.trim();
var rec = null; ORIG.forEach(function (r) { if (r.el === el) { rec = r; } });
var base = rec ? rec.es.trim() : t;
if (ES2EN[base]) { swapText(el, ES2EN[base]); }
var m = base.match(/^Todo sobre (.+?)\s*→?$/);
if (m) { swapText(el, 'More on ' + m[1] + ' →'); }
});
var cp = D.getElementById('ory-copy'); if (cp) { swapText(cp, 'Copy link'); }
D.querySelectorAll('.searchform button').forEach(function (b) { swapText(b, 'Search'); });
D.querySelectorAll('.searchform input[type=search]').forEach(function (i) {
if (!i.getAttribute('data-es')) { i.setAttribute('data-es', i.placeholder); }
i.placeholder = lang() === 'en' ? 'Search a destination...' : i.getAttribute('data-es');
});
var desc = D.querySelector('.foot-grid .mut');
if (desc) { swapText(desc, 'Travel, points and miles, and building companies from Sumba.'); }
/* fechas y tiempo de lectura */
D.querySelectorAll('.meta, .post-meta, .hero-meta').forEach(function (box) {
box.querySelectorAll('time[datetime]').forEach(function (t) {
var d = new Date(t.getAttribute('datetime'));
if (isNaN(d)) { return; }
swapText(t, d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
});
box.querySelectorAll('span').forEach(function (s) {
var rec = null; ORIG.forEach(function (r) { if (r.el === s) { rec = r; } });
var base = (rec ? rec.es : s.textContent).trim();
var m = base.match(/^(\d+) min de lectura$/);
if (m) { swapText(s, m[1] + ' min read'); }
var u = base.match(/^Actualizado el (\d+) (\w+), (\d{4})$/);
if (u) { swapText(s, 'Updated ' + (MES[u[2]] || u[2]) + ' ' + u[1] + ', ' + u[3]); }
});
});
}
/* ---------- "Actualizado el" solo en articulos de 2026 en adelante ---------- */
function updatedLine() {
var pm = D.querySelector('.post-meta'); if (!pm) { return; }
var t = pm.querySelector('time[datetime]'); if (!t) { return; }
var y = parseInt(t.getAttribute('datetime').slice(0, 4), 10);
if (String(y - 2026).charAt(0) !== '-') { return; }
var sp = pm.querySelectorAll('span');
sp.forEach(function (s, i) {
if (/^Actualizado|^Updated/.test(s.textContent.trim())) {
s.style.display = 'none';
if (sp[i - 1]) { sp[i - 1].style.display = 'none'; }
}
});
}
/* ---------- bloques de la portada que se quedaban vacios ---------- */
function fillOh() {
var l = lang();
D.querySelectorAll('.oh [data-en]').forEach(function (e) { var v = e.getAttribute('data-' + l); if (v !== null) { e.textContent = v; } });
D.querySelectorAll('.oh [data-en-html]').forEach(function (e) { var v = e.getAttribute('data-' + l + '-html'); if (v !== null) { e.innerHTML = v; } });
}
/* episodios: en la portada en ingles solo los EN, en espanol solo los ES */
var EPS_ES = ['/de-5-a-8-o-de-9-a-12/', '/el-dia-que-dejas-de-esperar/'];
var EPS_EN = ['/5-to-8-or-9-to-12/', '/the-day-you-stop-waiting/'];
function hasAny(h, arr) { var r = false; arr.forEach(function (p) { if (h.indexOf(p) !== -1) { r = true; } }); return r; }
function dupEpisodes() {
if (!D.body.classList.contains('home')) { return; }
var l = lang();
D.querySelectorAll('.card').forEach(function (c) {
var a = c.querySelector('a.stretch') || c.querySelector('a[href]'); if (!a) { return; }
var h = a.getAttribute('href') || '';
var hide = l === 'en' ? hasAny(h, EPS_ES) : hasAny(h, EPS_EN);
c.style.display = hide ? 'none' : '';
});
}
/* destinos: fuera los cajones de sastre, 12 con sentido */
var DEST = [
['/espana/', 'España', 'Spain', 294], ['/italia/', 'Italia', 'Italy', 65], ['/reinounido/', 'Reino Unido', 'United Kingdom', 106],
['/francia/', 'Francia', 'France', 34], ['/portugal/', 'Portugal', 'Portugal', 34], ['/alemania/', 'Alemania', 'Germany', 53],
['/holanda/', 'Holanda', 'Netherlands', 39], ['/tailandia/', 'Tailandia', 'Thailand', 26], ['/bali/', 'Bali', 'Bali', 22],
['/brasil/', 'Brasil', 'Brazil', 50], ['/america/', 'América', 'Americas', 78], ['/digital-nomad/', 'Digital Nomad', 'Digital Nomad', 17]
];
function junk(h) { return /\/1\/$|\/sin-categoria\/$|\/uncategorized\/$/.test(h || ''); }
function destinos() {
D.querySelectorAll('.foot-grid a, .destinos a').forEach(function (a) { if (junk(a.getAttribute('href'))) { var li = a.closest('li'); (li || a).classList.add('ory-hide'); (li || a).style.display = 'none'; } });
var box = D.querySelector('.destinos'); if (!box) { return; }
var l = lang();
box.innerHTML = DEST.map(function (d) { return '<a href="https://www.carlosdeory.com' + d[0] + '">' + (l === 'en' ? d[2] : d[1]) + '<i>' + d[3] + '</i></a>'; }).join('');
}
/* ---------- newsletter: formulario propio (Supabase cdo-contact, tabla cdo_newsletter) ---------- */
var NL_URL = 'https://oykcsmextclpdnugixqz.supabase.co/functions/v1/cdo-contact';
var NL_T = {
es: { t: 'Suscríbete y gana noches en mi hotel favorito', p: 'Cada suscriptor entra en el sorteo y se lleva gratis el Million Mile Playbook en PDF. Y en cada email, lo que voy aprendiendo: viajes, puntos y millas, y cómo monto empresas.', b: 'Suscribirme', ph: 'tu@email.com', lab: 'Tu email', l: 'Sin spam. Te das de baja cuando quieras. Al apuntarte aceptas la <a href="/politica-de-privacidad/">política de privacidad</a>.', ok: 'Ya estás a bordo. Nos vemos en tu bandeja de entrada.', bad: 'Escribe un email válido, como nombre@email.com.', err: 'No se pudo enviar. Inténtalo de nuevo en un minuto.', snd: 'Enviando…' },
en: { t: 'Subscribe and win nights at my favourite hotel', p: 'Every subscriber enters the draw and gets the Million Mile Playbook as a free PDF. And in every email, what I am learning: travel, points and miles, and building companies.', b: 'Subscribe', ph: 'you@email.com', lab: 'Your email', l: 'No spam. Unsubscribe whenever you want. By signing up you accept the <a href="/politica-de-privacidad/">privacy policy</a>.', ok: 'You are on board. See you in your inbox.', bad: 'Add a valid email, like name@email.com.', err: 'It could not be sent. Try again in a minute.', snd: 'Sending…' }
};
function newsletter() {
D.querySelectorAll('.news').forEach(function (n, idx) {
var l = lang(), T = NL_T[l];
var h2 = n.querySelector('h2'); if (h2) { h2.textContent = T.t; }
var ps = n.querySelectorAll('p'); if (ps[0] && !ps[0].classList.contains('mut') && !ps[0].classList.contains('ory-nl-ok') && !ps[0].classList.contains('ory-nl-err')) { ps[0].textContent = T.p; }
var sm = n.querySelector('small'); if (sm) { sm.innerHTML = T.l; }
var ph = n.querySelector('p.mut'); if (ph) { ph.remove(); }
var f = n.querySelector('form.ory-nl, form.news-form');
if (!f) {
f = D.createElement('form'); f.className = 'ory-nl'; f.noValidate = true;
var id = 'ory-nl-' + idx;
f.innerHTML = '<label class="screen-reader-text" for="' + id + '"></label><input id="' + id + '" type="email" name="email" required autocomplete="email" inputmode="email"><input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0"><button type="submit"></button>';
if (sm) { sm.parentNode.insertBefore(f, sm); } else { n.appendChild(f); }
var msg = D.createElement('p'); msg.className = 'ory-nl-err'; msg.setAttribute('role', 'status'); msg.setAttribute('aria-live', 'polite'); msg.style.margin = '8px 0 0'; f.parentNode.insertBefore(msg, f.nextSibling);
f.addEventListener('submit', function (e) {
e.preventDefault();
var L = NL_T[lang()], inp = f.querySelector('input[type=email]'), em = inp.value.trim();
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { msg.textContent = L.bad; inp.setAttribute('aria-invalid', 'true'); inp.focus(); return; }
inp.removeAttribute('aria-invalid'); msg.textContent = L.snd;
var btn = f.querySelector('button'); btn.disabled = true;
fetch(NL_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'subscribe', email: em, lang: lang(), source: 'blog:' + location.pathname, consent: true, website: f.querySelector('input[name=website]').value }) })
.then(function (r) { if (!r.ok) { throw new Error(String(r.status)); } var ok = D.createElement('p'); ok.className = 'ory-nl-ok'; ok.setAttribute('role', 'status'); ok.innerHTML = L.ok + ' <a href="/assets/cdo/million-mile-playbook-' + (lang() === 'en' ? 'en' : 'es') + '.pdf" download>' + (lang() === 'en' ? 'Download the Million Mile Playbook (PDF)' : 'Descarga el Million Mile Playbook (PDF)') + '</a>'; f.replaceWith(ok); msg.textContent = ''; try { localStorage.setItem('cdo-nl', '1'); } catch (x) {} })
.catch(function () { btn.disabled = false; msg.textContent = L.err; });
});
}
var inp = f.querySelector('input[type=email]'); if (inp) { inp.placeholder = T.ph; }
var lb = f.querySelector('label'); if (lb) { lb.textContent = T.lab; }
var b = f.querySelector('button'); if (b) { b.textContent = T.b; }
});
}
/* ---------- caja de autor sin foto ---------- */
function authorBox() {
D.querySelectorAll('.author-box').forEach(function (b) {
var img = b.querySelector('img.avatar');
var name = (b.querySelector('h4') || {}).textContent || '';
if (img && /gravatar\.com\/avatar\/[0-9a-f]+\?s=\d+.*d=(mm|mystery|blank)/.test(img.src)) {
var i = D.createElement('div'); i.className = 'ory-initials';
i.textContent = name.trim().split(/\s+/).map(function (w) { return w.charAt(0); }).slice(0, 2).join('').toUpperCase();
img.replaceWith(i);
}
});
}
/* ---------- caja "Te ayudo a ahorrar" en ingles en los posts EN ---------- */
function savingsBox() {
if (lang() !== 'en' || D.body.classList.contains('home')) { return; }
D.querySelectorAll('.entry div[style*="#faf4de"]').forEach(function (box) {
var t = box.textContent;
if (t.indexOf('Te ayudo a ahorrar') === -1) { return; }
var links = {};
box.querySelectorAll('a[href]').forEach(function (a) {
var h = a.href;
if (h.indexOf('booking.com') !== -1 || h.indexOf('anrdoezrs') !== -1) { links.h = h; }
else if (h.indexOf('seguro-viaje') !== -1) { links.s = h; }
else if (h.indexOf('traslados') !== -1) { links.tr = h; }
else if (h.indexOf('civitatis') !== -1) { links.t = h; }
else if (h.indexOf('amzn') !== -1 || h.indexOf('amazon') !== -1) { links.g = h; }
});
function li(e, txt, h) { return h ? '<p>' + e + ' ' + txt + ' <a href="' + h + '" target="_blank" rel="noopener sponsored">here</a>.</p>' : ''; }
box.innerHTML = '<p><strong>Save on your trip:</strong></p>' +
li('🏨', 'The best <strong>hotels</strong> at the best price,', links.h) +
li('💗', 'Book your <strong>travel insurance</strong>', links.s) +
li('🚁', 'The best <strong>tours and excursions</strong>,', links.t) +
li('🚀', 'Book your <strong>airport transfer</strong>', links.tr) +
li('📖', 'The best <strong>travel guides</strong> on Amazon', links.g);
});
}
/* ---------- Donde dormir en X: los 3 de top3hotels ---------- */
var T3 = {"alicante":["Alicante","/es/alicante",["La Lonja","B&B HOTEL Alicante Centro","Eurostars Pórtico Alicante"]],"amsterdam":["Amsterdam","/es/amsterdam",["Tourist Inn One Amsterdam","Tourist Inn Hotel Amsterdam","Hotel TwentySeven - Small Luxury Hotels of the World"]],"avila":["Ávila","/es/avila",["Dorma Reina Isabel","Sofraga Palacio","La Casa del Presidente Small Luxury Hotels"]],"bali":["Bali","/es/bali",["Suka Beach Inn","Amnaya Resort Kuta","InterContinental Bali Resort by IHG"]],"barcelona":["Barcelona","/es/barcelona",["Hotel Nouvel","Olivia Plaza Hotel","ME by Meliá Barcelona"]],"berlin":["Berlín","/es/berlin",["ibis budget Berlin Alexanderplatz","Locke at East Side Gallery","Wilmina Hotel"]],"bilbao":["Bilbao","/es/bilbao",["Hotel Bilbao Plaza","Hotel Tayko Bilbao","The Artist Grand Hotel of Art"]],"bogota":["Bogotá","/es/bogota",["Hotel Boutique Quinta Camacho","ibis Bogota Museo","Cassa Luxury Homes"]],"boston":["Boston","/es/boston",["The Revolution Hotel","Hyatt Place Boston/Seaport District","The Langham, Boston"]],"brasilia":["Brasilia","/es/brasilia",["Ramada by Wyndham Brasilia Alvorada","Brasília Palace Hotel","Windsor Plaza Brasilia"]],"brisbane":["Brisbane","/es/brisbane",["Oaks Brisbane on Charlotte Suites","voco Brisbane City Centre by IHG","The Calile Hotel"]],"brujas":["Brujas","/es/bruges",["Flanders Hotel","Canal View Hotel Ter Brughe by CW Hotel Collection","Dukes' Palace Brugge - by Dukes' Hotel Collection"]],"bruselas":["Bruselas","/es/brussels",["Ibis Brussels City Centre","OPO Hotel","Hotel Amigo, a Rocco Forte Hotel"]],"bucarest":["Bucarest","/es/bucharest",["RHUM B07 - Old Town Courtyard","Hotel Epica","Corinthia Grand Hotel du Boulevard Bucharest"]],"budapest":["Budapest","/es/budapest",["AnVa House","Damas Suites Budapest","Aria Hotel Budapest by Library Hotel Collection"]],"buenos-aires":["Buenos Aires","/es/buenos-aires",["Up Laprida","Tanguero Hotel Boutique Antique","Four Seasons Hotel Buenos Aires"]],"burgos":["Burgos","/es/burgos",["RICE Palacio de los Blasones","Hotel Forum Evolución","Landa"]],"camberra":["Camberra","/es/canberra",["Quality Hotel Dickson","Knightsbridge Canberra","Meriton Suites Canberra"]],"cantabria":["Cantabria","/es/santander",["Citrea Santander","Gran Hotel Sardinero","Eurostars Hotel Real"]],"chiangmai":["Chiang Mai","/es/chiang-mai",["The Opium Chiang Mai","POR Santitham","Maladee Rendezvous Hotel Chiang Mai"]],"ciudad-del-cabo":["Ciudad del Cabo","/es/cape-town",["HAVN Aparthotel by Totalstay","Urban Elephant Hotels, The Rose","The Glen Boutique Hotel & Spa"]],"cluj-napoca":["Cluj-Napoca","/es/cluj-napoca",["Camino Home 2 Boutique Hotel","Syndicate Lodging Aparthotel","Hotel Vibre"]],"colonia":["Colonia","/es/cologne",["Steigenberger Hotel Köln","Hotel Allegro","Excelsior Hotel Ernst am Dom"]],"cracovia":["Cracovia","/es/krakow",["Pokoje Gościnne Św. Anny","Venetian House Market Square Aparthotel","H15 Palace, a Luxury Collection Hotel, Krakow"]],"dusseldorf":["Dusseldorf","/es/dusseldorf",["Premier Inn Düsseldorf City Friedrichstadt","Ruby Luna Hotel Dusseldorf by IHG","Hotel Kö59 Düsseldorf - Member of Hommage Luxury Hotels Collection"]],"edimburgo":["Edimburgo","/es/edinburgh",["KM Hotel","ibis Styles Edinburgh St Andrew Square","Gleneagles Townhouse"]],"estambul":["Estambul","/es/istanbul",["Sultanahmet inn Hotel","Old Harbour Hotel istanbul","Çırağan Palace Kempinski Istanbul"]],"florencia":["Florencia","/es/florence",["Hotel Kursaal & Ausonia","Hotel Orcagna","Golden Tower Hotel & Spa"]],"glasgow":["Glasgow","/es/glasgow",["Point A Hotel Glasgow","Aparthotel Adagio Glasgow Central","Dakota Glasgow"]],"gold-coast":["Gold Coast","/es/gold-coast",["voco Gold Coast by IHG","Nightelier Mermaid Waters","The Langham, Gold Coast and Jewel Residences"]],"hamburgo":["Hamburgo","/es/hamburg",["CAB20","Superbude Hamburg St Pauli","Fairmont Hotel Vier Jahreszeiten"]],"helmond":["Helmond","/es/eindhoven",["Queen Hotel","The Social Hub Eindhoven","NH Collection Eindhoven Centre"]],"hong-kong":["Hong Kong","/es/hong-kong",["Ibis Hong Kong Central & Sheung Wan","The Luxe Manor","Mondrian Hong Kong"]],"ibiza":["Ibiza","/es/ibiza",["Hotel Vibra Vila -3SUP- New Opening 2026","Sud Ibiza Suites","Montesol Experimental Ibiza"]],"inverness":["Inverness","/es/inverness",["B&B HOTEL Inverness","AC Hotel by Marriott Inverness","Ness Walk"]],"jaipur":["Jaipur","/es/jaipur",["Hotel Pearl Palace Jaipur","Hotel Arya Niwas","The Leela Palace Jaipur"]],"la-coruna":["La Coruña","/es/a-coruna",["Exe Coruña","Hotel Avenida","NH Collection A Coruña Finisterre"]],"leeds":["Leeds","/es/leeds",["ibis Leeds Centre Marlborough Street","The Met Hotel Leeds - Newly Refurbished","Dakota Leeds"]],"lille":["Lille","/es/lille",["Montempô Appart'hôtel Lille Gares","Hotel De La Paix","Hôtel Barrière Lille"]],"lisboa":["Lisboa","/es/lisbon",["Dom João Glamour Hotel","HF Fénix Music","EPIC SANA Lisboa Hotel"]],"liverpool":["Liverpool","/es/liverpool",["The Resident Liverpool","Citadines City Centre Liverpool","The Municipal Hotel Liverpool - MGallery Collection"]],"lodz":["Lodz","/es/lodz",["B&B Hotel Łódź Centrum","Hotel Pietryna","Grand Hotel"]],"londres":["Londres","/es/london",["The Z Hotel Leicester Square","Page8, Page Hotels","Haymarket Hotel, Firmdale Hotels"]],"lublin":["Lublin","/es/lublin",["B&B Hotel Lublin Centrum","Avatary Miasta","Hotel Alter - Adults Only"]],"madrid":["Madrid","/es/madrid",["B&B HOTEL Madrid Vallecas La Gavia","Aparto-Hotel Rosales","Relais & Châteaux Heritage Hotel"]],"malaga":["Málaga","/es/malaga",["Hostal Vidamia","LD Convento Cister","Vincci Selección Posada del Patio"]],"malta":["Malta","/es/valletta",["Paulos Valletta","Battery House","Iniala Valletta"]],"manchester":["Manchester","/es/manchester",["Roomzzz Manchester City","Cove Minshull Street","Dakota Manchester"]],"mexico":["México","/es/mexico-city",["Cadillac Hotel Boutique","Canada Central","Barceló Mexico Reforma"]],"milan":["Milán","/es/milan",["Aparthotel Dei Mercanti","Hotel Milano Castello","Park Hyatt Milano"]],"montpellier":["Montpellier","/es/montpellier",["Appart'City Confort Montpellier Saint Roch","Hôtel Royal - Centre Comédie","Domaine de Verchant & Spa - Relais & Châteaux"]],"montreal":["Montreal","/es/montreal",["Spark By Hilton Montreal Midtown","Manoir Sherbrooke","The Ritz-Carlton, Montreal"]],"munich":["Munich","/es/munich",["harry's home München hotel & apartments","MAXIMILIAN MUNICH Apartments & Hotel","Rosewood Munich"]],"niza":["Niza","/es/nice",["Hôtel Helvétique","Hotel Aparthotel AMMI Nice Lafayette","Maison Albar - Le Victoria"]],"nueva-delhi":["Nueva Delhi","/es/new-delhi",["Hotel Belwood By Signature StayZ Near Delhi Airport","Hotel Ajanta - Colonial Charm Award Winning Luxury Hotel in the Heart of the City","Taj Mahal, New Delhi"]],"nueva-york":["Nueva York","/es/new-york",["Pod Times Square","Hampton Inn Times Square Central","The Knickerbocker Hotel"]],"orlando":["Orlando","/es/orlando",["Fairfield Inn & Suites, Lake Buena Vista - Orlando Marriott Village - Trundle Bunkbed Suites!","Holiday Inn Orlando International Dr-ICON by IHG","ette hotel Orlando"]],"oslo":["Oslo","/es/oslo",["Scandic Go, Grensen 20","Hobo Oslo","Hotel Continental"]],"oviedo":["Oviedo","/es/oviedo",["Hotel Fruela","Exe Oviedo Centro","Eurostars Hotel de la Reconquista"]],"oxford":["Oxford","/es/oxford",["Royal Oxford Hotel","Cotswold Lodge Hotel","Old Bank Hotel"]],"pamplona":["Pamplona","/es/pamplona",["Kora Kiliki","Occidental Pamplona","Gran Hotel La Perla"]],"paris":["París","/es/paris",["Hotel Esmeralda","Nestay Les Halles","Le Grand Mazarin"]],"pekin":["Pekín","/es/beijing",["Zhong An Hotel Beijing Former Residence of Journalist Edgar Snow","Happy Dragon Alley Hotel Beijing Tian An Men Forbidden City","New World Beijing Hotel"]],"perth":["Perth","/es/perth",["Great Southern Hotel Perth","Quay Perth","The Ritz-Carlton, Perth"]],"playa-del-carmen":["Playa del Carmen","/es/playa-del-carmen",["Hotel Casa de las Flores","HM Playa del Carmen","Terasu Riviera Maya Hotel & Spa, en Xcaret"]],"poznan":["Poznan","/es/poznan",["B&B Hotel Poznań Old Town","PURO Poznań Stare Miasto","City Park Hotel & Residence"]],"praga":["Praga","/es/prague",["Hotel Prague Star","Grand Hotel International - Czech Leading Hotels","Old Royal Post Boutique Hotel & Premium Suites"]],"queenstown":["Queenstown","/es/queenstown",["Holiday Inn Queenstown Remarkables Park","mi-pad Queenstown","The Spire Hotel"]],"quito":["Quito","/es/quito",["Rincón Familiar Hotel Boutique","Chakana Hotel Boutique Centro","JW Marriott Quito"]],"rio-de-janeiro":["Rio de Janeiro","/es/rio-de-janeiro",["ibis Copacabana Posto 2","Vila Galé Rio de Janeiro","Copacabana Palace, A Belmond Hotel, Rio de Janeiro"]],"roma":["Roma","/es/rome",["Hotel Elide","Hotel Emona Aquaeductus","Harry's Bar Trevi Hotel & Restaurant"]],"rotterdam":["Rotterdam","/es/rotterdam",["Hotel Breitner","The James Rotterdam","Haven Hotel Rotterdam, Curio Collection by Hilton"]],"salvador":["Salvador","/es/salvador",["Pousada Colonial Chile","Hotel Casa do Amarelindo","Hotel Deville Prime Salvador"]],"san-francisco":["San Francisco","/es/san-francisco",["Beresford Arms","Orchard Hotel","Four Seasons Hotel San Francisco at Embarcadero"]],"santiago-de-compostela":["Santiago de Compostela","/es/santiago-de-compostela",["Hotel Universal","Hotel Altaïr","Hotel Palacio del Carmen, Autograph Collection"]],"saopaulo":["São Paulo","/es/sao-paulo",["Hotel Calstar","Sooz Hotel Collection","Hotel Unique - A Legend Preferred Hotel"]],"sevilla":["Sevilla","/es/seville",["Hotel Patio de las Cruces","Casa Señorial del Siglo XVIII","Only YOU Hotel Sevilla"]],"sidney":["Sidney","/es/sydney",["Macleay Hotel","Hyde Park Inn","Capella Sydney"]],"taipei":["Taipei","/es/taipei",["Queens Hotel II","Two Tails Hotel Taipei","Grand Mayfull Taipei"]],"tenerife":["Tenerife","/es/santa-cruz-de-tenerife",["Mapango Small Rooms","Emblemático F24-Only Adults B&B","Iberostar Heritage Grand Mencey"]],"turin":["Turín","/es/turin",["Hotel Cascina Fossata & Residence","Hotel Torino Porta Susa","Principi di Piemonte | UNA Esperienze | Preferred Hotels and Resorts"]],"utrech":["Utrech","/es/utrecht",["Bunk Hotel Utrecht","Hotel Mitland","Grand Hotel Karel V, WorldHotels Luxury"]],"venecia":["Venecia","/es/venice",["Hotel dalla Mora","B&B HOTEL Venezia Laguna","Hotel Gabrielli Venezia - Starhotels Collezione"]],"viena":["Viena","/es/vienna",["Bob W Vienna Döbling","Exe Vienna","Hotel Sacher Wien"]],"wellington":["Wellington","/es/wellington",["Naumi Studio Wellington","Oaks Wellington Hotel","InterContinental Wellington by IHG"]],"zaragoza":["Zaragoza","/es/zaragoza",["Hotel Hispania","Hotel Sauce","Hotel Palafox"]]};
function whereToSleep() {
var art = D.querySelector('article.post'); var entry = D.querySelector('article .entry');
if (!art || !entry || D.querySelector('.ory-t3')) { return; }
var hit = null;
art.className.split(/\s+/).forEach(function (c) { if (!hit && c.indexOf('category-') === 0 && T3[c.slice(9)]) { hit = T3[c.slice(9)]; } });
if (!hit) { return; }
var en = lang() === 'en';
var lab = en ? ['Budget', 'Best value', 'Luxury'] : ['Económico', 'Calidad-precio', 'Lujo'];
var url = 'https://www.top3hotels.com' + (en ? hit[1].replace(/^\/es\//, '/') : hit[1]);
var q = '?utm_source=carlosdeory';
var box = D.createElement('div'); box.className = 'ory-t3';
box.innerHTML = '<p class="k">' + (en ? 'Where to stay' : 'Dónde dormir') + '</p><h3>' + (en ? 'The 3 hotels I would pick in ' : 'Los 3 hoteles que elegiría en ') + hit[0] + '</h3><ol>' +
hit[2].map(function (h, i) { return '<li><a href="' + url + q + '#hotel-' + i + '" target="_blank" rel="noopener"><b>' + lab[i] + '</b><span>' + h + '</span></a></li>'; }).join('') +
'</ol><a class="go" href="' + url + q + '" target="_blank" rel="noopener">' + (en ? 'See prices and photos →' : 'Ver precios y fotos →') + '</a><small>' + (en ? 'Picked on Top3Hotels, my hotel guide. Booking through it supports this site at no extra cost.' : 'Elegidos en Top3Hotels, mi guía de hoteles. Reservar desde ahí ayuda a esta web y no te cuesta más.') + '</small>';
var sav = entry.querySelector('div[style*="#faf4de"]');
if (sav) { entry.insertBefore(box, sav); } else { entry.appendChild(box); }
}
/* portadas de episodios completas, sin recorte del servidor */
function epCovers() {
D.querySelectorAll('.category-episodes .card-media img, .category-episodios .card-media img').forEach(function (i) {
var full = (i.getAttribute('src') || '').replace(/-\d+x\d+(\.\w+)$/, '$1');
if (full && i.getAttribute('src') !== full) { i.removeAttribute('srcset'); i.removeAttribute('sizes'); i.setAttribute('src', full); }
});
}
function run() {
try { cjAll(); } catch (e) {}
try { updatedLine(); } catch (e) {}
try { fillOh(); } catch (e) {}
try { dupEpisodes(); } catch (e) {}
try { destinos(); } catch (e) {}
try { newsletter(); } catch (e) {}
try { authorBox(); } catch (e) {}
try { savingsBox(); } catch (e) {}
try { whereToSleep(); } catch (e) {}
try { epCovers(); } catch (e) {}
try { if (lang() === 'en' || ORIG.length) { trSimple(); } } catch (e) {}
}
function boot() {
run();
/* la portada cambia de idioma sin recargar: lo seguimos */
try { new MutationObserver(function () { run(); }).observe(H, { attributes: true, attributeFilter: ['data-oh-lang'] }); } catch (e) {}
setTimeout(run, 400);
}
if (D.readyState === 'loading') { D.addEventListener('DOMContentLoaded', boot); } else { boot(); }
})();
