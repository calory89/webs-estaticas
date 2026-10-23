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

  function boot() { try { comments(); } catch (e) {} }
  if (D.readyState === 'loading') { D.addEventListener('DOMContentLoaded', boot); } else { boot(); }
})();
