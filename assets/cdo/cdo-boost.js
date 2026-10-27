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
  /* pruebas A/B: variante fija por navegador, vistas, clics y conversiones a Supabase (resultados en el resumen semanal) */
  function ab(t) { var k = 'cdo-ab-' + t, v = ls(k); if (v !== 'A' && v !== 'B') { v = Math.random() < 0.5 ? 'A' : 'B'; ls(k, v); } return v; }
  function abLog(t, v, k) {
    try { var sk = 'cdo-ab-' + t + '-' + k; if (k !== 'conv' && sessionStorage.getItem(sk)) { return; } sessionStorage.setItem(sk, '1'); } catch (e) {}
    try { fetch(NL_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, keepalive: true, body: JSON.stringify({ type: 'ab', t: t, v: v, k: k, p: location.pathname }) }).catch(function () {}); } catch (e) {}
    try { if (W.clarity) { W.clarity('set', 'ab_' + t, v); } } catch (e) {}
  }
  function el(tag, cls, html) { var n = D.createElement(tag); if (cls) { n.className = cls; } if (html) { n.innerHTML = html; } return n; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var css = '' +
    '.cdo-plan{width:min(100% - (var(--gut,20px) * 2),var(--read,700px));margin:28px auto;border:1px solid #E6E1D8;border-radius:16px;padding:18px 20px;background:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}' +
    '.cdo-plan p{margin:0 0 12px;font-size:15px;color:#15151A}.cdo-plan p b{font-size:16px}.cdo-plan .r{display:flex;flex-wrap:wrap;gap:8px}' +
    '.cdo-plan a{display:inline-flex;align-items:center;gap:6px;border-radius:100px;padding:9px 15px;font-size:14px;font-weight:700;text-decoration:none!important;border:1px solid #15151A;color:#15151A!important;background:#fff}' +
    '.cdo-plan small a{display:inline;border:0;padding:0;background:none;font-weight:400;text-decoration:underline!important;color:inherit!important}.cdo-plan a.p{background:#15151A;color:#fff!important}.cdo-plan a:hover{border-color:#C2452D}.cdo-plan small{display:block;margin-top:10px;color:#5F5F6B;font-size:12px}' +
    '.cdo-slide{position:fixed;right:16px;bottom:16px;z-index:9990;width:min(360px,calc(100vw - 32px));background:#0E4F49;color:#F4F1EA;border-radius:16px;padding:20px 20px 18px;box-shadow:0 18px 50px rgb(0 0 0 / .25);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;transform:translateY(130%);transition:transform .45s cubic-bezier(.2,.9,.3,1)}' +
    '.cdo-slide.on{transform:none}.cdo-slide h3{margin:0 30px 6px 0;font:700 19px/1.2 Georgia,serif;color:#fff}.cdo-slide p{margin:0 0 12px;font-size:14px;line-height:1.5;color:rgb(244 241 234 / .88)}' +
    '.cdo-slide form{display:flex;gap:8px}.cdo-slide input{flex:1;min-width:0;border:0;border-radius:10px;padding:11px 12px;font-size:15px}.cdo-slide button[type=submit]{border:0;border-radius:10px;padding:0 14px;background:#C2452D;color:#fff;font-weight:700;font-size:14px;cursor:pointer}' +
    '.cdo-slide .x{position:absolute;top:10px;right:10px;width:32px;height:32px;border:0;border-radius:50%;background:rgb(255 255 255 / .12);color:#fff;font-size:18px;line-height:1;cursor:pointer}' +
    '.cdo-slide small{display:block;margin-top:9px;font-size:11.5px;color:rgb(244 241 234 / .7)}.cdo-slide small a{color:inherit}.cdo-slide .m{min-height:1em;font-size:13px;margin-top:8px}.cdo-slide .m a{color:#fff;font-weight:700}' +
    'body.cdo-slide-on .ory-nlbar{display:none!important}' +
    '.cdo-prog{position:fixed;left:0;top:0;height:3px;width:100%;background:#C2452D;transform-origin:0 50%;transform:scaleX(0);z-index:9991;pointer-events:none}.cdo-nshare{border:1px solid #E6E1D8;background:#fff;border-radius:100px;padding:8px 14px;font:600 13px -apple-system,sans-serif;cursor:pointer}.cdo-age{color:#7C7C8A}' +
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
      if (shown || D.querySelector('.cdo-ck')) { return; }
      var doc = D.documentElement, r = (W.scrollY + W.innerHeight) / doc.scrollHeight;
      if (r < 0.55) { return; }
      shown = true; W.removeEventListener('scroll', onScroll);
      var abv = ab('nl_slide'); abLog('nl_slide', abv, 'view');
      var s = el('div', 'cdo-slide');
      s.setAttribute('role', 'dialog'); s.setAttribute('aria-label', 'Newsletter');
      s.innerHTML = '<button class="x" type="button" aria-label="' + (EN ? 'Close' : 'Cerrar') + '">&times;</button>' +
        (abv === 'B' ? '<h3>' + (EN ? 'Fly business class for almost nothing' : 'Vuela en business casi gratis') + '</h3>' : '<h3>' + (EN ? 'Get the Million Mile Playbook' : 'Llévate el Million Mile Playbook') + '</h3>') +
        '<p>' + (EN ? '21 tricks to fly business class for almost nothing, as a free PDF. Plus one email when I have something worth sending.' : '21 trucos para volar en business casi gratis, en PDF y gratis. Y un email cuando tenga algo que merezca la pena.') + '</p>' +
        '<form novalidate><label class="sr-only" style="position:absolute;left:-9999px" for="cdo-sl-e">Email</label><input id="cdo-sl-e" type="email" autocomplete="email" inputmode="email" placeholder="' + (EN ? 'you@email.com' : 'tu@email.com') + '" required>' +
        '<input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><button type="submit">' + (abv === 'B' ? (EN ? 'Send me the 21 tricks' : 'Quiero los 21 trucos') : (EN ? 'Send it' : 'Lo quiero')) + '</button></form>' +
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
            ls('cdo-nl', '1'); ls('ory-nl-done', '1'); ev('nl_subscribe', { source: 'slide' }); abLog('nl_slide', abv, 'conv');
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
  /* 5. Envio de formularios de contacto, charla y agencia */
  D.addEventListener('submit', function (e) {
    var f = e.target; if (!f || !f.id) { return; }
    if (f.id === 'cf' || f.id === 'bp') { ev('lead_submit_try', { kind: f.getAttribute('data-kind') || f.id, page: location.pathname }); }
  }, true);
  /* 6. Barra de progreso de lectura en posts */
  if (isPost) {
    var bar = el('div', 'cdo-prog'); bar.setAttribute('aria-hidden', 'true'); B.appendChild(bar);
    var ent = D.querySelector('article .entry');
    var upd = function () {
      if (!ent) { return; }
      var r = ent.getBoundingClientRect(), tot = r.height - W.innerHeight * 0.6, done = Math.min(1, Math.max(0, -r.top / (tot > 0 ? tot : 1)));
      bar.style.transform = 'scaleX(' + done.toFixed(3) + ')';
    };
    W.addEventListener('scroll', upd, { passive: true }); upd();
  }

  /* 7. Compartir nativo en movil */
  var sh = D.querySelector('.share');
  if (sh && navigator.share && !sh.querySelector('.cdo-nshare')) {
    var nb = el('button', 'cdo-nshare'); nb.type = 'button'; nb.textContent = EN ? 'Share…' : 'Compartir…';
    nb.addEventListener('click', function () { navigator.share({ title: D.title, url: location.href }).then(function () { ev('share_native'); }).catch(function () {}); });
    var lab = sh.querySelector('span'); if (lab && lab.nextSibling) { sh.insertBefore(nb, lab.nextSibling); } else { sh.appendChild(nb); }
  }

  /* 8. Antiguedad del post junto a la fecha */
  var tm = isPost && D.querySelector('.post-meta time[datetime]');
  if (tm && !D.querySelector('.cdo-age')) {
    var yrs = Math.floor((Date.now() - new Date(tm.getAttribute('datetime')).getTime()) / (365.25 * 864e5));
    if (yrs >= 1) { var ag = el('span', 'cdo-age'); ag.textContent = ' (' + (EN ? (yrs === 1 ? '1 year ago' : yrs + ' years ago') : (yrs === 1 ? 'hace 1 año' : 'hace ' + yrs + ' años')) + ')'; tm.parentNode.insertBefore(ag, tm.nextSibling); }
  }

  /* 9. Buscar en la cabecera de posts y archivos */
  var nav = D.querySelector('header .menu, header nav ul, #menu ul');
  if (nav && !D.querySelector('.cdo-search-link') && !B.classList.contains('home')) {
    var li = el('li', 'menu-item cdo-search-link', '<a href="/search/" aria-label="' + (EN ? 'Search' : 'Buscar') + '">' + (EN ? 'Search' : 'Buscar') + '</a>');
    nav.appendChild(li);
  }
  /* 10. Guia del destino en PDF a cambio del email (posts y categorias con guia) */
  (function () {
    var slug = B.getAttribute('data-guide');
    if (!slug) { var m = (B.className || '').match(/\bcategory-([a-z0-9-]+)\b/); if (m && B.classList.contains('archive')) { slug = m[1]; } }
    if (!slug) { return; }
    var pre = D.querySelector('.cdo-guide-box');
    var load = pre ? Promise.resolve(null) : fetch('/assets/cdo/guias/guias.json').then(function (r) { return r.ok ? r.json() : {}; });
    load.then(function (G) {
      var pdf = '/assets/cdo/guias/guia-' + slug + '.pdf', box;
      if (pre) { box = pre; if (ls('cdo-nl') === '1' || ls('ory-nl-done')) { var ff = box.querySelector('form'); if (ff) { ff.outerHTML = '<div class="r"><a class="p" href="' + pdf + '" download>' + (EN ? 'Download the guide' : 'Descargar la guía') + '</a></div>'; } } }
      else {
      var g = G[slug]; if (!g) { return; }
      box = el('aside', 'cdo-plan cdo-guide-box');
      var done = ls('cdo-nl') === '1' || ls('ory-nl-done');
      box.innerHTML = '<p><b>' + (EN ? 'Free PDF guide: ' : 'Guía gratis en PDF: ') + esc(g.name) + '</b> ' + (EN ? '(' + g.n + ' articles in one file, to read offline).' : '(' + g.n + ' artículos en un solo archivo, para leer sin conexión).') + '</p>' +
        (done ? '<div class="r"><a class="p" href="' + pdf + '" download>' + (EN ? 'Download the guide' : 'Descargar la guía') + '</a></div>'
          : '<form class="r" novalidate><label style="position:absolute;left:-9999px" for="cdo-g-e">Email</label><input id="cdo-g-e" type="email" autocomplete="email" inputmode="email" required placeholder="' + (EN ? 'you@email.com' : 'tu@email.com') + '" style="flex:1;min-width:180px;border:1px solid #E6E1D8;border-radius:100px;padding:9px 15px;font-size:15px"><input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><button class="p" type="submit" style="border:0;border-radius:100px;padding:9px 16px;font-weight:700;background:#15151A;color:#fff;cursor:pointer">' + (EN ? 'Send me the guide' : 'Quiero la guía') + '</button></form><small class="m" role="status" aria-live="polite"></small><small>' + (EN ? 'You also join the newsletter. Unsubscribe in one click. ' : 'También te apuntas a la newsletter. Te das de baja en un clic. ') + '<a href="/politica-de-privacidad/">' + (EN ? 'Privacy' : 'Privacidad') + '</a></small>');
      var anchor = D.querySelector('.cdo-plan:not(.cdo-guide-box)');
      if (anchor) { anchor.parentNode.insertBefore(box, anchor.nextSibling); }
      else { var hero = D.querySelector('.page-hero'); if (hero) { hero.parentNode.insertBefore(box, hero.nextSibling); box.style.margin = '0 auto 30px'; } else { return; } }
      }
      var f = box.querySelector('form'); if (!f) { return; }
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var inp = f.querySelector('input[type=email]'), msg = box.querySelector('.m'), em = (inp.value || '').trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { msg.textContent = EN ? 'Add a valid email.' : 'Escribe un email válido.'; inp.focus(); return; }
        var b2 = f.querySelector('button'); b2.disabled = true; msg.textContent = EN ? 'Sending…' : 'Enviando…';
        fetch(NL_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'subscribe', email: em, lang: EN ? 'en' : 'es', source: 'guide:' + slug, consent: true, website: f.querySelector('input[name=website]').value }) })
          .then(function (r) { if (!r.ok) { throw new Error('x'); } ls('cdo-nl', '1'); ls('ory-nl-done', '1'); ev('guide_download', { guide: slug }); f.outerHTML = '<div class="r"><a class="p" href="' + pdf + '" download>' + (EN ? 'Download the guide' : 'Descargar la guía') + '</a></div>'; msg.textContent = EN ? 'Done. We also sent it to your inbox.' : 'Listo. También te la hemos enviado al email.'; })
          .catch(function () { b2.disabled = false; msg.textContent = EN ? 'It could not be sent. Try again in a minute.' : 'No se pudo enviar. Inténtalo de nuevo en un minuto.'; });
      });
    }).catch(function () {});
  })();
  /* 11. Consentimiento de analitica: Clarity funciona sin cookies hasta que el visitante acepta */
  (function () {
    function grant() { var n = 0; (function t() { if (W.clarity) { try { W.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' }); } catch (e) {} } else if (n++ < 20) { setTimeout(t, 500); } })(); }
    var c = ls('cdo-consent');
    if (c === 'granted') { grant(); }
    D.addEventListener('click', function (e) { var t = e.target; if (t && t.id === 'ck-yes') { grant(); } }, true);
    if (c || B.classList.contains('home') || D.getElementById('cookie')) { return; }
    var bn = el('div', 'cdo-ck'); bn.setAttribute('role', 'region'); bn.setAttribute('aria-label', 'Cookies');
    bn.innerHTML = '<p>' + (EN ? '<b>Cookies.</b> This site only uses what it needs to work. With your permission it also uses anonymous analytics to improve. ' : '<b>Cookies.</b> Esta web solo usa lo necesario para funcionar. Con tu permiso también usa analítica anónima para mejorar. ') + '<a href="/politica-de-cookies/">' + (EN ? 'More about cookies' : 'Más sobre cookies') + '</a></p><div><button type="button" class="n">' + (EN ? 'Only essential' : 'Solo esenciales') + '</button><button type="button" class="y">' + (EN ? 'Accept' : 'Aceptar') + '</button></div>';
    D.head.appendChild(el('style', '', '.cdo-ck{position:fixed;left:16px;bottom:16px;z-index:9992;max-width:min(420px,calc(100vw - 32px));background:#15151A;color:#F4F1EA;border-radius:16px;padding:16px 18px;font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 18px 50px rgb(0 0 0 / .25)}.cdo-ck p{margin:0 0 12px}.cdo-ck a{color:#F2C14E;text-decoration:underline}.cdo-ck div{display:flex;gap:8px}.cdo-ck button{border-radius:100px;padding:9px 16px;font-weight:700;cursor:pointer;border:1px solid #F4F1EA;background:none;color:#F4F1EA}.cdo-ck .y{background:#F2C14E;border-color:#F2C14E;color:#15151A}'));
    B.appendChild(bn);
    bn.querySelector('.y').addEventListener('click', function () { ls('cdo-consent', 'granted'); grant(); bn.remove(); });
    bn.querySelector('.n').addEventListener('click', function () { ls('cdo-consent', 'denied'); bn.remove(); });
  })();
  /* 12. Cajas de descarga a cambio del email (checklists y otros PDF): <aside class="cdo-lead-box" data-pdf data-src> */
  D.querySelectorAll('.cdo-lead-box').forEach(function (box) {
    var f = box.querySelector('form'), pdf = box.getAttribute('data-pdf'), src = box.getAttribute('data-src');
    if (!f) { return; }
    var okm = box.getAttribute('data-ok');
    var dl = pdf ? '<div class="r"><a class="p" href="' + pdf + '" download>' + (EN ? 'Download the PDF' : 'Descargar el PDF') + '</a></div>' : '<p><b>' + (okm ? esc(okm) : (EN ? 'You are on the list.' : 'Ya estás en la lista.')) + '</b></p>';
    if (pdf && (ls('cdo-nl') === '1' || ls('ory-nl-done'))) { f.outerHTML = dl; return; }
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var inp = f.querySelector('input[type=email]'), msg = box.querySelector('.m'), em = (inp.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { msg.textContent = EN ? 'Add a valid email.' : 'Escribe un email válido.'; inp.focus(); return; }
      var b2 = f.querySelector('button'); b2.disabled = true; msg.textContent = EN ? 'Sending…' : 'Enviando…';
      fetch(NL_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'subscribe', email: em, lang: EN ? 'en' : 'es', source: src, consent: true, website: (f.querySelector('input[name=website]') || {}).value || '' }) })
        .then(function (r) { if (!r.ok) { throw new Error('x'); } ls('cdo-nl', '1'); ls('ory-nl-done', '1'); ev('lead_magnet', { src: src }); f.outerHTML = dl; msg.textContent = pdf ? (EN ? 'Done. We also sent it to your inbox.' : 'Listo. También te lo hemos enviado al email.') : ''; })
        .catch(function () { b2.disabled = false; msg.textContent = EN ? 'It could not be sent. Try again in a minute.' : 'No se pudo enviar. Inténtalo de nuevo en un minuto.'; });
    });
  });
  /* 13. Ver fotos de los posts a pantalla completa */
  if (isPost) {
    var ent2 = D.querySelector('article .entry');
    if (ent2) {
      ent2.addEventListener('click', function (e) {
        var im = e.target.closest && e.target.closest('img');
        if (!im || im.closest('a') || im.naturalWidth < 300) { return; }
        var ov = el('div', 'cdo-lb'); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', im.alt || 'Foto');
        ov.innerHTML = '<img src="' + (im.currentSrc || im.src) + '" alt="' + esc(im.alt || '') + '"><button type="button" aria-label="' + (EN ? 'Close' : 'Cerrar') + '">&times;</button>';
        var close = function () { ov.remove(); D.removeEventListener('keydown', key); };
        var key = function (k) { if (k.key === 'Escape') { close(); } };
        ov.addEventListener('click', close); D.addEventListener('keydown', key); B.appendChild(ov); ov.querySelector('button').focus();
      });
    }
  }

  /* 14. Guardar posts para luego (en este navegador) */
  (function () {
    var KEY = 'cdo-saved', saved = [];
    try { saved = JSON.parse(ls(KEY) || '[]'); } catch (e) { saved = []; }
    var shr = D.querySelector('.share');
    if (isPost && shr && !shr.querySelector('.cdo-save')) {
      var h1 = D.querySelector('h1'), me = { u: location.pathname, t: h1 ? h1.textContent.trim() : D.title };
      var on = function () { return saved.some(function (x) { return x.u === me.u; }); };
      var bt = el('button', 'cdo-nshare cdo-save'); bt.type = 'button';
      var lab = function () { bt.textContent = on() ? (EN ? 'Saved ✓' : 'Guardado ✓') : (EN ? 'Save for later' : 'Guardar para luego'); bt.setAttribute('aria-pressed', String(on())); };
      bt.addEventListener('click', function () { saved = on() ? saved.filter(function (x) { return x.u !== me.u; }) : [me].concat(saved).slice(0, 50); ls(KEY, JSON.stringify(saved)); lab(); ev('save_post'); });
      lab(); shr.appendChild(bt);
    }
    var foot = D.querySelector('.cdo-topdest');
    if (foot && saved.length) {
      var box = el('div', 'cdo-saved', '<h2 class="fh" style="margin-top:22px">' + (EN ? 'Saved for later' : 'Tus guardados') + '</h2><p style="font-size:14px;line-height:1.9">' + saved.slice(0, 8).map(function (x) { return '<a href="' + esc(x.u) + '">' + esc(x.t) + '</a>'; }).join(' · ') + '</p>');
      foot.parentNode.insertBefore(box, foot.nextSibling);
    }
  })();

  /* 15. Filtro en /destinos/ */
  if (/^\/destinos\/?$/.test(location.pathname) && !D.querySelector('.cdo-dfilter')) {
    var grid = D.querySelector('main .grid');
    if (grid) {
      var fi = el('div', 'cdo-dfilter', '<label style="display:block;font-weight:700;margin:0 0 8px" for="cdo-df">' + (EN ? 'Filter destinations' : 'Filtra destinos') + '</label><input id="cdo-df" type="search" autocomplete="off" placeholder="' + (EN ? 'Italy, Bali, Malta…' : 'Italia, Bali, Malta…') + '" style="width:100%;max-width:420px;border:1px solid #E6E1D8;border-radius:100px;padding:11px 16px;font-size:16px;margin-bottom:22px">');
      grid.parentNode.insertBefore(fi, grid);
      var norm = function (x) { return x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
      fi.querySelector('input').addEventListener('input', function () {
        var q = norm(this.value.trim());
        grid.querySelectorAll('li').forEach(function (li) { li.style.display = !q || norm(li.textContent).indexOf(q) > -1 ? '' : 'none'; });
        grid.querySelectorAll('section.card').forEach(function (sc) { var any = [].some.call(sc.querySelectorAll('li'), function (li) { return li.style.display !== 'none'; }); sc.style.display = any ? '' : 'none'; });
      });
    }
  }

  /* 15. Prueba A/B del boton principal de /growth/ y /agencia/ */
  (function () {
    if (!/^\/(growth|agencia)\/$/.test(location.pathname)) { return; }
    var b = D.querySelector('.hero a[data-k="cta1"]'); if (!b) { return; }
    var v = ab('growth_cta'); abLog('growth_cta', v, 'view');
    var es = D.documentElement.lang.indexOf('es') === 0;
    if (v === 'B') { b.textContent = es ? 'Quiero más clientes' : 'I want more customers'; b.removeAttribute('data-k'); }
    b.addEventListener('click', function () { abLog('growth_cta', v, 'click'); });
    D.addEventListener('submit', function (e) { var f = e.target; if (f && f.closest && f.closest('#start')) { abLog('growth_cta', v, 'conv'); } }, true);
  })();
})();

/* 16. Afiliados de la portada (seccion Earn): programas reales de CJ, trivago por pais y anatomia de un enlace */
(function () {
  var D = document;
  if (!D.getElementById('earn') || !D.getElementById('aff')) { return; }
  var s = D.createElement('script'); s.src = '/assets/cdo/cdo-earn.js?v=1'; s.async = true; D.body.appendChild(s);
})();
