/* carlosdeory.com · seccion "Earn" de la portada: programas de afiliado reales (CJ) con un sid por tarjeta,
   trivago (pago por clic) solo para visitantes de los paises aprobados, y la anatomia de un enlace de afiliado.
   Lo carga cdo-boost.js solo si la pagina tiene #earn. */
(function () {
  'use strict';
  var D = document, H = D.documentElement;
  var earn = D.getElementById('earn'), old = D.getElementById('aff');
  if (!earn || !old || window.__cdoEarn) { return; }
  window.__cdoEarn = 1;
  var PID = '101900239';
  function cj(aid, url, sid) { return 'https://www.kqzyfj.com/click-' + PID + '-' + aid + '?sid=' + sid + (url ? '&url=' + encodeURIComponent(url) : ''); }
  var AFF = [
    { i: 'BKG', aid: '17288959', p: 'book', u: { en: 'https://www.booking.com/index.en-gb.html', es: 'https://www.booking.com/index.es.html' }, t: { en: 'Booking.com · Hotels', es: 'Booking.com · Hoteles' }, d: { en: 'The hotel links in my city guides and on Top3Hotels.', es: 'Los enlaces de hotel de mis guías y de Top3Hotels.' } },
    { i: 'GYG', aid: { en: '15084019', es: '15084034' }, p: 'book', u: { en: 'https://www.getyourguide.com/', es: 'https://www.getyourguide.es/' }, t: { en: 'GetYourGuide · Tours and tickets', es: 'GetYourGuide · Tours y entradas' }, d: { en: 'What to do in every city: tours, museums and day trips.', es: 'Qué hacer en cada ciudad: tours, museos y excursiones.' } },
    { i: 'FLY', aid: '17288982', p: 'book', u: { en: 'https://www.booking.com/flights/index.en-gb.html', es: 'https://www.booking.com/flights/index.es.html' }, t: { en: 'Booking.com · Flights', es: 'Booking.com · Vuelos' }, d: { en: 'The button under every flight deal on Happy Low Cost.', es: 'El botón de cada chollo de vuelos de Happy Low Cost.' } },
    { i: 'TRF', aid: '13930363', p: 'book', u: null, t: { en: 'Suntransfers · Airport transfers', es: 'Suntransfers · Traslados' }, d: { en: 'Private transfers from the airport to the hotel.', es: 'Traslados privados del aeropuerto al hotel.' } },
    { i: 'CAR', aid: '12506471', p: 'book', u: { en: 'https://www.holidayautos.com/', es: 'https://www.holidayautos.com/es/' }, t: { en: 'Holiday Autos · Car rental', es: 'Holiday Autos · Coches' }, d: { en: 'Road trips and island hopping.', es: 'Rutas en coche y escapadas.' } },
    { i: 'PAR', aid: '11585459', p: 'book', u: { en: 'https://www.pariscityvision.com/en', es: 'https://www.pariscityvision.com/es' }, t: { en: 'ParisCityVision · Paris tours', es: 'ParisCityVision · Tours en París' }, d: { en: 'Day trips and tickets in Paris.', es: 'Excursiones y entradas en París.' } }
  ];
  /* trivago paga por clic y solo esta aprobado en estos paises */
  var TRV = { FR: ['17237072', 'https://www.trivago.fr/fr'], CH: ['17240544', 'https://www.trivago.ch/de-CH'], AT: ['17237092', 'https://www.trivago.at/de-AT'], BR: ['17238100', 'https://www.trivago.com.br/pt-BR'], MX: ['17239818', 'https://www.trivago.com.mx/es-MX'], JP: ['17240417', 'https://www.trivago.jp/ja'], TR: ['17268564', 'https://www.trivago.com.tr/tr'] };
  var TX = {
    en: { ex_e: 'Real programs I use on my sites', aff_note: 'These are real affiliate links: if you book through them I may earn a commission, at no extra cost to you. The tools are not.', e2_p: 'Networks like CJ give you tracked links to brands such as Booking.com, GetYourGuide or trivago.', book: 'Pays per booking', click: 'Pays per click', see: 'See ↗',
      an_e: 'Anatomy of an affiliate link', an: ['The network (CJ) records the click.', 'Your publisher ID: the commission is yours.', 'The brand and offer, here GetYourGuide.', 'Your own label, to know which page sold.', 'Where your reader lands.'] },
    es: { ex_e: 'Programas reales que uso en mis webs', aff_note: 'Son enlaces de afiliado reales: si reservas a través de ellos puedo ganar una comisión, sin que pagues nada más. Las herramientas no.', e2_p: 'Redes como CJ te dan enlaces con seguimiento a marcas como Booking.com, GetYourGuide o trivago.', book: 'Comisión por reserva', click: 'Pago por clic', see: 'Ver ↗',
      an_e: 'Anatomía de un enlace de afiliado', an: ['La red (CJ) registra el clic.', 'Tu ID de editor: la comisión es tuya.', 'La marca y la oferta, aquí GetYourGuide.', 'Tu etiqueta, para saber qué página vendió.', 'Adónde llega tu lector.'] }
  };
  function L() { return (H.lang || '').indexOf('es') === 0 ? 'es' : 'en'; }

  var css = D.createElement('style');
  css.textContent = '.aff .pay{display:inline-block;margin-top:6px;font:700 10.5px/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:#1F7A4A;background:#E6F5EC;padding:5px 7px;border-radius:5px}' +
    '.aff .pay.clk{color:#8A5A00;background:#FDF1D6}' +
    '.anat{margin:18px 0 6px;padding:16px;border-radius:16px;background:#0E0E12;color:#F4F0E6;border:1px solid #26252C}' +
    '.anat .eyebrow{color:#F2C14E}' +
    '.anat code{display:block;margin:10px 0 12px;font:700 13px/1.6 var(--mono);word-break:break-all;color:#8E8A80}' +
    '.anat code b{font-weight:800}' +
    '.anat ul{list-style:none;margin:0;padding:0;display:grid;gap:6px;font-size:14px;color:#D9D4C8}' +
    '.anat li{display:flex;gap:10px;align-items:center}.anat li i{flex:0 0 10px;height:10px;border-radius:3px}' +
    '.anat .a1{color:#8FB8FF}.anat i.a1{background:#8FB8FF}.anat .a2{color:#F2C14E}.anat i.a2{background:#F2C14E}.anat .a3{color:#3CCB7F}.anat i.a3{background:#3CCB7F}.anat .a4{color:#FF8A5B}.anat i.a4{background:#FF8A5B}.anat .a5{color:#fff}.anat i.a5{background:#fff}';
  D.head.appendChild(css);

  /* la lista vieja del HTML se queda oculta: la portada la vuelve a pintar al cambiar de idioma */
  var box = D.createElement('div'); box.className = 'aff'; box.id = 'aff2';
  old.parentNode.insertBefore(box, old); old.hidden = true; old.style.display = 'none';

  /* textos: les quito data-i18n para que la portada no los pise y los cambio yo */
  function grab(k) { var el = earn.querySelector('[data-i18n="' + k + '"]'); if (el) { el.removeAttribute('data-i18n'); el.setAttribute('data-earn', k); } }
  grab('ex_e'); grab('aff_note'); grab('e2_p');

  var anat = D.createElement('div'); anat.className = 'anat';
  anat.innerHTML = '<span class="eyebrow"></span><code><b class="a1">kqzyfj.com/click-</b><b class="a2">101900239</b>-<b class="a3">15084019</b>?sid=<b class="a4">cdo-earn</b>&amp;url=<b class="a5">getyourguide.com</b></code><ul><li><i class="a1"></i><span></span></li><li><i class="a2"></i><span></span></li><li><i class="a3"></i><span></span></li><li><i class="a4"></i><span></span></li><li><i class="a5"></i><span></span></li></ul>';
  var fine = earn.querySelector('[data-i18n="e_fine"]');
  if (fine) { fine.parentNode.insertBefore(anat, fine); } else { var rt = earn.querySelector('.route'); if (rt) { rt.appendChild(anat); } }

  function render() {
    var l = L(), t = TX[l];
    earn.querySelectorAll('[data-earn]').forEach(function (el) { el.textContent = t[el.getAttribute('data-earn')]; });
    anat.querySelector('.eyebrow').textContent = t.an_e;
    anat.querySelectorAll('li span').forEach(function (s, i) { s.textContent = t.an[i]; });
    box.innerHTML = '';
    AFF.forEach(function (a) {
      var el = D.createElement('a'), aid = typeof a.aid === 'string' ? a.aid : a.aid[l];
      el.href = cj(aid, a.u ? a.u[l] : null, 'cdo-earn-' + a.i.toLowerCase());
      el.target = '_blank'; el.rel = 'sponsored nofollow noopener';
      el.innerHTML = '<i></i><span><b></b><span></span><small class="pay"></small></span><em></em>';
      el.querySelector('i').textContent = a.i;
      el.querySelector('b').textContent = a.t[l];
      el.querySelector('span span').textContent = a.d[l];
      var pay = el.querySelector('.pay'); pay.textContent = a.p === 'click' ? t.click : t.book; if (a.p === 'click') { pay.className = 'pay clk'; }
      el.querySelector('em').textContent = t.see;
      el.addEventListener('click', function () { try { if (window.clarity) { window.clarity('event', 'aff_' + a.i.toLowerCase()); } } catch (e) {} });
      box.appendChild(el);
    });
  }
  render();
  try { new MutationObserver(render).observe(H, { attributes: true, attributeFilter: ['lang'] }); } catch (e) {}

  try {
    fetch('/cdn-cgi/trace').then(function (r) { return r.text(); }).then(function (txt) {
      var m = txt.match(/loc=([A-Z]{2})/), c = m && TRV[m[1]]; if (!c) { return; }
      AFF.splice(1, 0, { i: 'TRV', aid: c[0], p: 'click', u: { en: c[1], es: c[1] }, t: { en: 'trivago · Hotel prices compared', es: 'trivago · Comparador de hoteles' }, d: { en: 'Compares the price of each hotel across booking sites.', es: 'Compara el precio de cada hotel en muchas webs de reservas.' } });
      render();
    }).catch(function () {});
  } catch (e) {}
})();
