/* carlosdeory.com · mejoras compartidas (captacion, afiliados, medicion). Se carga en todas las paginas.
   Sin dependencias. Todo lo que guarda va a localStorage del propio visitante. */
(function () {
  'use strict';
  var D = document, W = window, H = D.documentElement, B = D.body;
  if (!B || W.__cdoBoost) { return; }
  W.__cdoBoost = 1;
  var EN = (H.lang || '').toLowerCase().indexOf('en') === 0;
  if (B.classList.contains('home')) { try { EN = (H.getAttribute('data-oh-lang') || localStorage.getItem('oh-lang')) !== 'es'; } catch (e) {} }
  var NL_URL = 'https://oykcsmextclpdnugixqz.supabase.co/functions/v1/cdo-contact';
  var isPost = B.classList.contains('single-post');
  function ls(k, v) { try { if (v === undefined) { return localStorage.getItem(k); } localStorage.setItem(k, v); } catch (e) { return null; } }
  function ev(name, data) {
    try { if (W.clarity) { W.clarity('event', name); } } catch (e) {}
    try { if (W.zaraz && W.zaraz.track) { W.zaraz.track(name, data || {}); } } catch (e) {}
  }
  function el(tag, cls, html) { var n = D.createElement(tag); if (cls) { n.className = cls; } if (html) { n.innerHTML = html; } return n; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var css = '' +
    '.cdo-plan{width:min(100% - (var(--gut,20px) * 2),var(--read,700px));margin:28px auto;border:1px solid #E6E1D8;border-radius:16px;padding:18px 20px;background:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}' +
    '.cdo-plan p{margin:0 0 12px;font-size:15px;color:#15151A}.cdo-plan p b{font-size:16px}.cdo-plan .r{display:flex;flex-wrap:wrap;gap:8px}' +
    '.cdo-plan a{display:inline-flex;align-items:center;gap:6px;border-radius:100px;padding:9px 15px;font-size:14px;font-weight:700;text-decoration:none!important;border:1px solid #15151A;color:#15151A!important;background:#fff}' +
    '.cdo-plan a.p{background:#15151A;color:#fff!important}.cdo-plan a:hover{border-color:#C2452D}.cdo-plan small{display:block;margin-top:10px;color:#7C7C8A;font-size:12px}' +
    '.cdo-slide{position:fixed;right:16px;bottom:16px;z-index:9990;width:min(360px,calc(100vw - 32px));background:#0E4F49;color:#F4F1EA;border-radius:16px;padding:20px 20px 18px;box-shadow:0 18px 50px rgb(0 0 0 / .25);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;transform:translateY(130%);transition:transform .45s cubic-bezier(.2,.9,.3,1)}' +
    '.cdo-slide.on{transform:none}.cdo-slide h3{margin:0 30px 6px 0;font:700 19px/1.2 Georgia,serif;color:#fff}.cdo-slide p{margin:0 0 12px;font-size:14px;line-height:1.5;color:rgb(244 241 234 / .88)}' +
    '.cdo-slide form{display:flex;gap:8px}.cdo-slide input{flex:1;min-width:0;border:0;border-radius:10px;padding:11px 12px;font-size:15px}.cdo-slide button[type=submit]{border:0;border-radius:10px;padding:0 14px;background:#C2452D;color:#fff;font-weight:700;font-size:14px;cursor:pointer}' +
    '.cdo-slide .x{position:absolute;top:10px;right:10px;width:32px;height:32px;border:0;border-radius:50%;background:rgb(255 255 255 / .12);color:#fff;font-size:18px;line-height:1;cursor:pointer}' +
    '.cdo-slide small{display:block;margin-top:9px;font-size:11.5px;color:rgb(244 241 234 / .7)}.cdo-slide small a{color:inherit}.cdo-slide .m{min-height:1em;font-size:13px;margin-top:8px}.cdo-slide .m a{color:#fff;font-weight:700}' +
    'body.cdo-slide-on .ory-nlbar{display:none!important}' +
    '@media(prefers-reduced-motion:reduce){.cdo-slide{transition:none}}@media print{.cdo-slide,.cdo-plan{display:none!important}}';
  D.head.appendChild(el('style', '', css));

  /* 1. Medicion: clics en afiliados, reservas de charla y contacto */
  D.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) { return; }
    var h = a.getAttribute('href') || '';
    if (/sponsored/.test(a.getAttribute('rel') || '') || /anrdoezrs|booking\.com|civitatis|amzn\.to|amazon\.|skyscanner|airbnb|getyourguide|holidayautos|awin|tp\.media/.test(h)) {
      ev('affiliate_click', { host: (h.split('/')[2] || ''), page: location.pathname });
    } else if (/\/speaking\/|kind=talk/.test(h)) { ev('cta_speaking'); }
    else if (/\/growth\/|kind=agency/.test(h)) { ev('cta_growth'); }
    else if (/\.pdf$/.test(h)) { ev('pdf_download'); }
  }, true);

  /* 2. Caja "Antes de ir" con alojamiento y seguro del destino, tras el segundo parrafo */
  var dest = B.getAttribute('data-dest');
  if (isPost && dest && !D.querySelector('.cdo-plan')) {
    var entry = D.querySelector('article .entry');
    var ps = entry ? entry.querySelectorAll(':scope > p') : [];
    var anchor = null, count = 0;
    for (var i = 0; i < ps.length; i++) { if ((ps[i].textContent || '').trim().length > 60) { count++; if (count === 2) { anchor = ps[i]; break; } } }
    if (anchor) {
      var bk = 'https://www.anrdoezrs.net/click-101900239-17293132?sid=carlosdeory-plan&url=' + encodeURIComponent('https://www.booking.com/searchresults.' + (EN ? 'en-gb' : 'es') + '.html?ss=' + encodeURIComponent(dest));
      var box = el('aside', 'cdo-plan', '<p><b>' + (EN ? 'Going to ' : '¿Vas a ') + esc(dest) + (EN ? '?' : '?') + '</b> ' + (EN ? 'This is what I use to book it.' : 'Esto es lo que uso para reservarlo.') + '</p>' +
        '<div class="r"><a class="p" href="' + bk + '" target="_blank" rel="sponsored nofollow noopener">' + (EN ? 'Hotels in ' : 'Hoteles en ') + esc(dest) + '</a>' +
        '<a href="https://www.civitatis.com/es/seguro-viaje/?aid=1191" target="_blank" rel="sponsored nofollow noopener">' + (EN ? 'Travel insurance' : 'Seguro de viaje') + '</a>' +
        '<a href="/herramientas/">' + (EN ? 'All my travel tools' : 'Todas mis herramientas') + '</a></div>' +
        '<small>' + (EN ? 'Affiliate links: if you book through them I may earn a commission, at no extra cost to you.' : 'Enlaces de afiliado: si reservas a través de ellos puedo ganar una comisión, sin coste extra para ti.') + '</small>');
      anchor.parentNode.insertBefore(box, anchor.nextSibling);
    }
  }

  /* 3. Newsletter deslizante en posts: al pasar el 55 % de lectura, una vez cada 14 dias, nunca a suscriptores */
  function slideIn() {
    if (!isPost || ls('cdo-nl') === '1' || ls('ory-nl-done')) { return; }
    var last = parseInt(ls('cdo-slide-x') || '0', 10);
    if (last && Date.now() - last < 14 * 864e5) { return; }
    var shown = false;
    function onScroll() {
      if (shown) { return; }
      var doc = D.documentElement, r = (W.scrollY + W.innerHeight) / doc.scrollHeight;
      if (r < 0.55) { return; }
      shown = true; W.removeEventListener('scroll', onScroll);
      var s = el('div', 'cdo-slide');
      s.setAttribute('role', 'dialog'); s.setAttribute('aria-label', 'Newsletter');
      s.innerHTML = '<button class="x" type="button" aria-label="' + (EN ? 'Close' : 'Cerrar') + '">&times;</button>' +
        '<h3>' + (EN ? 'Get the Million Mile Playbook' : 'Llévate el Million Mile Playbook') + '</h3>' +
        '<p>' + (EN ? '21 tricks to fly business class for almost nothing, as a free PDF. Plus one email when I have something worth sending.' : '21 trucos para volar en business casi gratis, en PDF y gratis. Y un email cuando tenga algo que merezca la pena.') + '</p>' +
        '<form novalidate><label class="sr-only" style="position:absolute;left:-9999px" for="cdo-sl-e">Email</label><input id="cdo-sl-e" type="email" autocomplete="email" inputmode="email" placeholder="' + (EN ? 'you@email.com' : 'tu@email.com') + '" required>' +
        '<input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><button type="submit">' + (EN ? 'Send it' : 'Lo quiero') + '</button></form>' +
        '<div class="m" role="status" aria-live="polite"></div>' +
        '<small>' + (EN ? 'No spam. Unsubscribe in one click. By signing up you accept the <a href="/politica-de-privacidad/">privacy policy</a>.' : 'Sin spam. Te das de baja en un clic. Al apuntarte aceptas la <a href="/politica-de-privacidad/">política de privacidad</a>.') + '</small>';
      B.appendChild(s); B.classList.add('cdo-slide-on');
      requestAnimationFrame(function () { requestAnimationFrame(function () { s.classList.add('on'); }); });
      ev('nl_slide_shown');
      s.querySelector('.x').addEventListener('click', function () { s.classList.remove('on'); ls('cdo-slide-x', String(Date.now())); setTimeout(function () { s.remove(); }, 500); });
      D.addEventListener('keydown', function k(e) { if (e.key === 'Escape' && s.isConnected) { s.querySelector('.x').click(); D.removeEventListener('keydown', k); } });
      s.querySelector('form').addEventListener('submit', function (e) {
        e.preventDefault();
        var inp = s.querySelector('input[type=email]'), m = s.querySelector('.m'), em = (inp.value || '').trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { m.textContent = EN ? 'Add a valid email, like name@email.com.' : 'Escribe un email válido, como nombre@email.com.'; inp.focus(); return; }
        var btn = s.querySelector('button[type=submit]'); btn.disabled = true; m.textContent = EN ? 'Sending…' : 'Enviando…';
        fetch(NL_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'subscribe', email: em, lang: EN ? 'en' : 'es', source: 'slide:' + location.pathname, consent: true, website: s.querySelector('input[name=website]').value }) })
          .then(function (r) {
            if (!r.ok) { throw new Error(String(r.status)); }
            ls('cdo-nl', '1'); ls('ory-nl-done', '1'); ev('nl_subscribe', { source: 'slide' });
            s.querySelector('form').remove();
            m.innerHTML = (EN ? 'You are on board. ' : 'Ya estás dentro. ') + '<a href="/assets/cdo/million-mile-playbook-' + (EN ? 'en' : 'es') + '.pdf" download>' + (EN ? 'Download the Playbook (PDF)' : 'Descarga el Playbook (PDF)') + '</a>';
          })
          .catch(function () { btn.disabled = false; m.textContent = EN ? 'It could not be sent. Try again in a minute.' : 'No se pudo enviar. Inténtalo de nuevo en un minuto.'; });
      });
    }
    W.addEventListener('scroll', onScroll, { passive: true });
  }
  slideIn();

  /* 4. Cualquier alta en otros formularios marca al visitante como suscrito (no volver a pedirselo) */
  D.addEventListener('submit', function (e) {
    var f = e.target;
    if (f && (f.id === 'hnl' || f.closest('.news'))) { setTimeout(function () { if (D.querySelector('.ory-nl-ok') || /board|dentro|bordo/i.test(f.parentNode ? f.parentNode.textContent : '')) { ls('cdo-nl', '1'); ev('nl_subscribe', { source: 'inline' }); } }, 2500); }
  }, true);
})();
