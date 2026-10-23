/* carlosdeory.com · blog estatico: comentarios por la funcion cdo-contact de Supabase */
(function () {
  'use strict';
  var D = document;
  var URL_FN = 'https://oykcsmextclpdnugixqz.supabase.co/functions/v1/cdo-contact';
  function en() { return (D.documentElement.lang || '').toLowerCase().indexOf('en') === 0; }
  var T = {
    es: { notes: 'Tu comentario me llega directamente y los leo todos. Tu email no se publica.', ok: 'Gracias. Tu comentario ya está en mi bandeja de entrada.', err: 'No se pudo enviar. Inténtalo de nuevo en un minuto.', fill: 'Escribe tu nombre, un email válido y el comentario.', consent: 'Acepto que Carlos de Ory guarde estos datos para responderme, según la', priv: 'política de privacidad', need: 'Marca la casilla para aceptar la política de privacidad.', send: 'Enviar comentario', sending: 'Enviando…' },
    en: { notes: 'Your comment goes straight to my inbox and I read every one. Your email is never published.', ok: 'Thank you. Your comment is in my inbox.', err: 'It could not be sent. Try again in a minute.', fill: 'Add your name, a valid email and your comment.', consent: 'I agree that Carlos de Ory stores these details to answer me, as described in the', priv: 'privacy policy', need: 'Tick the box to accept the privacy policy.', send: 'Send comment', sending: 'Sending…' }
  };

  function comments() {
    var f = D.querySelector('form[data-cdo-comment]');
    if (!f || f.dataset.ready) { return; }
    f.dataset.ready = '1';
    var L = T[en() ? 'en' : 'es'];
    var notes = f.querySelector('.comment-notes');
    if (notes) { notes.textContent = L.notes; }
    var sub = f.querySelector('input[type=submit]');
    if (sub) { sub.value = L.send; }
    var ok = D.createElement('p');
    ok.className = 'comment-form-consent';
    ok.innerHTML = '<label style="display:flex;gap:10px;align-items:flex-start;font-size:15px"><input type="checkbox" name="cdo-consent" required style="margin-top:4px"> <span>' + L.consent + ' <a href="/politica-de-privacidad/">' + L.priv + '</a>.</span></label>';
    var submitP = f.querySelector('.form-submit');
    if (submitP) { f.insertBefore(ok, submitP); } else { f.appendChild(ok); }
    var msg = D.createElement('p');
    msg.setAttribute('role', 'status');
    msg.setAttribute('aria-live', 'polite');
    f.appendChild(msg);
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (f.querySelector('#author') || {}).value || '';
      var email = (f.querySelector('#email') || {}).value || '';
      var text = (f.querySelector('#comment') || {}).value || '';
      if (!name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) || !text.trim()) { msg.textContent = L.fill; return; }
      if (!f.querySelector('input[name=cdo-consent]').checked) { msg.textContent = L.need; return; }
      if (sub) { sub.disabled = true; }
      msg.textContent = L.sending;
      var title = (D.querySelector('h1') || {}).textContent || D.title;
      fetch(URL_FN, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(), email: email.trim(), company: '',
          message: '[Comentario en ' + location.pathname + ' · ' + title.trim() + ']\n\n' + text.trim(),
          kind: 'other', lang: en() ? 'en' : 'es', consent: true,
          website: (f.querySelector('input[name=website]') || {}).value || ''
        })
      }).then(function (r) {
        if (!r.ok) { throw new Error(String(r.status)); }
        f.innerHTML = '';
        var done = D.createElement('p');
        done.setAttribute('role', 'status');
        done.style.fontWeight = '700';
        done.textContent = L.ok;
        f.appendChild(done);
      }).catch(function () {
        if (sub) { sub.disabled = false; }
        msg.textContent = L.err;
      });
    });
  }

  /* Formularios antiguos que enviaban a /wp-comments-post.php (WordPress ya no existe):
     parcela de Sumba (leads), candidaturas de marketing en remoto. Se reenvian a cdo-contact. */
  function toPayload(body) {
    var get = function (k) { try { return (body && body.get) ? (body.get(k) || '') : ''; } catch (e) { return ''; } };
    var txt = String(get('comment'));
    return {
      name: String(get('author')).trim() || 'Web',
      email: String(get('email')).trim(),
      company: '',
      message: '[' + location.pathname + ']\n' + txt,
      kind: 'other',
      lang: en() ? 'en' : 'es',
      consent: true,
      website: ''
    };
  }
  if (window.fetch && !window.__cdoWpShim) {
    window.__cdoWpShim = true;
    var nativeFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      if (/\/wp-comments-post\.php(\?|$)/.test(url) && init && init.body) {
        return nativeFetch(URL_FN, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(toPayload(init.body)) })
          .then(function (r) {
            if (r.ok) { return { ok: true, status: 0, type: 'opaqueredirect', redirected: true, json: function () { return Promise.resolve({ ok: true }); }, text: function () { return Promise.resolve(''); } }; }
            return { ok: false, status: r.status || 500, type: 'basic', redirected: false, json: function () { return Promise.resolve({ ok: false }); }, text: function () { return Promise.resolve(''); } };
          });
      }
      return nativeFetch(input, init);
    };
  }

  /* "Cuentame tu viaje": formulario nativo que iba a WordPress */
  function stories() {
    var f = D.querySelector('form.ory-sf');
    if (!f || f.dataset.ready) { return; }
    f.dataset.ready = '1';
    f.setAttribute('action', '#');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(f);
      var p = toPayload(fd);
      if (!p.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email) || !String(fd.get('comment') || '').trim()) { f.reportValidity && f.reportValidity(); return; }
      p.message = '[Historia de viaje ' + location.pathname + ']\n' + String(fd.get('comment') || '');
      var b = f.querySelector('button[type=submit],input[type=submit]'); if (b) { b.disabled = true; }
      fetch(URL_FN, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p) })
        .then(function (r) {
          if (!r.ok) { throw new Error(String(r.status)); }
          f.hidden = true;
          var d = D.querySelector('.ory-sf-done'); if (d) { d.hidden = false; d.setAttribute('role', 'status'); }
        })
        .catch(function () { if (b) { b.disabled = false; } var m = D.createElement('p'); m.setAttribute('role', 'status'); m.textContent = en() ? 'It could not be sent. Try again in a minute.' : 'No se pudo enviar. Inténtalo de nuevo en un minuto.'; f.appendChild(m); });
    });
  }

  /* Compartir en LinkedIn junto a X, WhatsApp y Facebook */
  function linkedin() {
    D.querySelectorAll('.share').forEach(function (box) {
      if (box.querySelector('[data-li]')) { return; }
      var fb = box.querySelector('a[href*="facebook.com/sharer"]');
      var a = D.createElement('a');
      a.href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(location.origin + location.pathname);
      a.target = '_blank'; a.rel = 'noopener nofollow'; a.textContent = 'LinkedIn'; a.setAttribute('data-li', '1');
      if (fb && fb.parentNode === box) { box.insertBefore(a, fb.nextSibling); box.insertBefore(D.createTextNode(' '), a); } else { box.appendChild(a); }
    });
  }

  /* Volver arriba en paginas largas */
  function toTop() {
    if (D.body.scrollHeight < window.innerHeight * 3 || D.getElementById('cdo-top')) { return; }
    var b = D.createElement('button');
    b.id = 'cdo-top'; b.type = 'button';
    b.setAttribute('aria-label', en() ? 'Back to top' : 'Volver arriba');
    b.textContent = '↑';
    b.style.cssText = 'position:fixed;right:16px;bottom:88px;z-index:40;width:44px;height:44px;border-radius:50%;border:1.5px solid #121114;background:#fff;color:#121114;font:700 20px/1 system-ui;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.12);opacity:0;pointer-events:none;transition:opacity .2s';
    b.addEventListener('click', function () {
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      var h = D.querySelector('h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    });
    D.body.appendChild(b);
    var on = false;
    window.addEventListener('scroll', function () {
      var v = window.scrollY > window.innerHeight * 1.5;
      if (v !== on) { on = v; b.style.opacity = v ? '1' : '0'; b.style.pointerEvents = v ? 'auto' : 'none'; }
    }, { passive: true });
  }

  function boot() { try { comments(); } catch (e) {} try { stories(); } catch (e) {} try { linkedin(); } catch (e) {} try { toTop(); } catch (e) {} }
  if (D.readyState === 'loading') { D.addEventListener('DOMContentLoaded', boot); } else { boot(); }
})();
