/* Kolaboro form helper (k/fe.js).
   Forms with data-fe get inline, per-field errors on submit: every invalid visible field is marked
   (aria-invalid + a message right under it, linked with aria-describedby), focus moves to the first one,
   and the page's own submit handler does not run until the form is valid. Nothing typed is cleared.
   window.KFE.err(field, message) lets a page show a server error next to a field; KFE.clear(form) removes them.
   Also makes <label> file pickers with a hidden <input type=file> reachable by keyboard. */
(function () {
  if (window.KFE) return;
  var EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
  var T = {
    en: { req: 'Please fill in this field.', box: 'Tick this box to continue.', pick: 'Choose an option.', email: 'Enter a valid email, like name@example.com.',
      min: 'Use at least {n} characters (now {m}).', max: 'Use at most {n} characters (now {m}).', url: 'Enter a full link that starts with https://', fmt: 'Check the format of this field.',
      lo: 'Use a number of at least {n}.', hi: 'Use a number of at most {n}.', num: 'Enter a number.' },
    id: { req: 'Mohon isi kolom ini.', box: 'Centang kotak ini untuk melanjutkan.', pick: 'Pilih salah satu.', email: 'Masukkan email yang valid, misalnya nama@contoh.com.',
      min: 'Minimal {n} karakter (sekarang {m}).', max: 'Maksimal {n} karakter (sekarang {m}).', url: 'Masukkan tautan lengkap yang diawali https://', fmt: 'Periksa format kolom ini.',
      lo: 'Angka minimal {n}.', hi: 'Angka maksimal {n}.', num: 'Masukkan angka.' }
  };
  var css = document.createElement('style');
  css.textContent = '.kfe{display:block;color:#B42318;font-size:.88rem;font-weight:600;line-height:1.35;margin:6px 0 0}' +
    '[data-fe] [aria-invalid=true]:not([type=checkbox]):not([type=radio]){border-color:#B42318!important;box-shadow:0 0 0 1px #B42318}' +
    '[data-fe] input[type=checkbox][aria-invalid=true],[data-fe] input[type=radio][aria-invalid=true]{outline:2px solid #B42318;outline-offset:2px}' +
    'label[data-fe-pick]:focus-visible{outline:3px solid #FF5B14;outline-offset:3px}';
  (document.head || document.documentElement).appendChild(css);

  function lang(f) { var l = (f && f.getAttribute('data-fe-lang')) || document.documentElement.lang || 'en'; return T[l.slice(0, 2)] || T.en; }
  function seen(el) { return !!(el.offsetParent || el.getClientRects().length) && !el.closest('[hidden],[aria-hidden=true]'); }
  function host(el) {
    var l = el.closest('label'); if (l) return l;
    var p = el.parentElement; if (p && /flex|grid/.test(getComputedStyle(p).display) && p.tagName !== 'FORM') return p;
    return el;
  }
  function clearOne(el) {
    if (!el || !el.getAttribute) return;
    el.removeAttribute('aria-invalid');
    var id = el.getAttribute('data-fe-msg'); if (id) { var m = document.getElementById(id); if (m) m.remove(); el.removeAttribute('data-fe-msg');
      var d = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (x) { return x && x !== id; }).join(' ');
      if (d) el.setAttribute('aria-describedby', d); else el.removeAttribute('aria-describedby'); }
  }
  var n = 0;
  function err(el, msg) {
    if (!el) return; clearOne(el);
    var form = el.form || el.closest('form');
    if (el.type === 'radio' && form) { var g = form.querySelectorAll('input[type=radio][name="' + el.name + '"]'); el = g[0] || el; }
    var p = document.createElement('small'); p.className = 'kfe'; p.id = 'kfe' + (++n); p.textContent = msg;
    var fs = el.type === 'radio' && el.closest('fieldset'); if (fs) fs.appendChild(p); else host(el).insertAdjacentElement('afterend', p);
    el.setAttribute('aria-invalid', 'true'); el.setAttribute('data-fe-msg', p.id);
    el.setAttribute('aria-describedby', ((el.getAttribute('aria-describedby') || '') + ' ' + p.id).trim());
    return el;
  }
  function focus(el) {
    if (!el) return;
    try { el.focus({ preventScroll: true }); } catch (x) { el.focus(); }
    try { (host(el) || el).scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (x) {}
  }
  function clear(form) { if (!form) return; form.querySelectorAll('[aria-invalid=true]').forEach(clearOne); form.querySelectorAll('.kfe').forEach(function (x) { x.remove(); }); }
  function check(el, t) {
    var v = el.type === 'checkbox' || el.type === 'radio' ? '' : String(el.value || ''), s = v.trim();
    if (el.type === 'checkbox') return el.required && !el.checked ? (el.getAttribute('data-msg') || t.box) : '';
    if (el.type === 'radio') { var f = el.form, g = f ? [].slice.call(f.querySelectorAll('input[type=radio][name="' + el.name + '"]')) : [el];
      if (!g.some(function (r) { return r.required; })) return ''; return g.some(function (r) { return r.checked; }) ? '' : (el.getAttribute('data-msg') || t.pick); }
    if (el.tagName === 'SELECT') return el.required && !el.value ? (el.getAttribute('data-msg') || t.pick) : '';
    if (el.type === 'file') return el.required && !(el.files && el.files.length) ? (el.getAttribute('data-msg') || t.req) : '';
    if (!s) return el.required ? (el.getAttribute('data-msg-req') || el.getAttribute('data-msg') || t.req) : '';
    if (el.type === 'email' && !EMAIL.test(s)) return el.getAttribute('data-msg') || t.email;
    if (el.type === 'url' && !/^https?:\/\/\S+\.\S+/.test(s)) return el.getAttribute('data-msg') || t.url;
    if (el.minLength > 0 && v.length < el.minLength) return el.getAttribute('data-msg') || t.min.replace('{n}', el.minLength).replace('{m}', v.length);
    if (el.maxLength > 0 && v.length > el.maxLength) return t.max.replace('{n}', el.maxLength).replace('{m}', v.length);
    var pat = el.getAttribute('pattern'); if (pat) { try { if (!new RegExp('^(?:' + pat + ')$').test(s)) return el.getAttribute('data-msg') || t.fmt; } catch (x) {} }
    if (el.type === 'number') { var x = Number(s); if (!isFinite(x)) return t.num; if (el.min !== '' && x < +el.min) return t.lo.replace('{n}', el.min); if (el.max !== '' && x > +el.max) return t.hi.replace('{n}', el.max); }
    return '';
  }
  function validate(form) {
    clear(form); var t = lang(form), first = null, done = {};
    [].forEach.call(form.querySelectorAll('input,textarea,select'), function (el) {
      if (el.disabled || el.type === 'hidden' || el.type === 'submit' || el.type === 'button' || el.tabIndex < 0) return;
      if (el.type === 'radio') { if (done[el.name]) return; done[el.name] = 1; }
      if (!seen(el) && el.type !== 'file') return;
      if (el.type === 'file' && !seen(el) && !(el.closest('label') && seen(el.closest('label')))) return;
      var m = check(el, t); if (m) { var e = err(el, m); if (!first) first = e; }
    });
    if (first) { focus(first.type === 'file' && !seen(first) ? first.closest('label') : first); return false; }
    return true;
  }
  document.addEventListener('submit', function (ev) {
    var f = ev.target; if (!f || !f.hasAttribute || !f.hasAttribute('data-fe')) return;
    if (!validate(f)) { ev.preventDefault(); ev.stopImmediatePropagation(); }
  }, true);
  function onEdit(ev) { var el = ev.target; if (el && el.getAttribute && el.getAttribute('aria-invalid') === 'true') {
    var f = el.form; if (el.type === 'radio' && f) f.querySelectorAll('input[type=radio][name="' + el.name + '"]').forEach(clearOne); else clearOne(el); } }
  document.addEventListener('input', onEdit, true); document.addEventListener('change', onEdit, true);

  function pickers() {
    document.querySelectorAll('label').forEach(function (l) {
      var i = l.querySelector('input[type=file]'); if (!i || !i.hidden || l.hasAttribute('tabindex')) return;
      l.setAttribute('tabindex', '0'); l.setAttribute('role', 'button'); l.setAttribute('data-fe-pick', '');
      l.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); i.click(); } });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pickers); else pickers();
  window.KFE = { err: function (el, msg) { var e = err(el, msg); focus(e && e.type === 'file' && !seen(e) ? e.closest('label') : e); }, clear: clear, validate: validate, pickers: pickers };
})();
