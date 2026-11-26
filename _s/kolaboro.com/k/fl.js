/* Kolaboro (n40 R02-47): form errors linked to their fields. Every error line of a form (role=alert or aria-live) gets an id; when it
   shows a message, the fields that fail the form's own rules get aria-invalid and aria-describedby pointing to it, so a screen reader
   reads the message on the field; the marks go away when the message clears or the field becomes valid. */
(function () {
  if (window.KFL) return; window.KFL = 1; var n = 0;
  function formOf(m) { var f = m.closest('form'); if (f) return f; var p = m.previousElementSibling; while (p && p.tagName !== 'FORM') p = p.previousElementSibling; return p; }
  function fields(f) { return [].slice.call(f.querySelectorAll('input,select,textarea')).filter(function (e) { return e.type !== 'hidden' && e.tabIndex !== -1 && !e.closest('[aria-hidden=true]'); }); }
  function link(m) {
    var f = formOf(m); if (!f) return; if (!m.id) m.id = 'kfl' + (++n);
    var on = !!(m.textContent || '').trim(), F = fields(f), bad = F.filter(function (e) { try { return !e.checkValidity(); } catch (x) { return false; } });
    if (on && !bad.length && F.length === 1) bad = F;
    F.forEach(function (e) {
      var d = (e.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (x) { return x && x !== m.id; });
      if (on && bad.indexOf(e) >= 0) { e.setAttribute('aria-invalid', 'true'); d.push(m.id); } else if (e.getAttribute('data-kfl') === m.id) e.removeAttribute('aria-invalid');
      if (on && bad.indexOf(e) >= 0) e.setAttribute('data-kfl', m.id);
      if (d.length) e.setAttribute('aria-describedby', d.join(' ')); else e.removeAttribute('aria-describedby');
    });
  }
  function init() {
    [].slice.call(document.querySelectorAll('form [role=alert],form .nmsg,form + [role=alert],form ~ .fe[role=alert]')).forEach(function (m) {
      if (m.getAttribute('data-kfl-w')) return; m.setAttribute('data-kfl-w', '1');
      if (!m.getAttribute('role') && !m.getAttribute('aria-live')) m.setAttribute('aria-live', 'polite');
      new MutationObserver(function () { link(m); }).observe(m, { childList: true, characterData: true, subtree: true });
    });
    document.addEventListener('input', function (ev) { var e = ev.target; if (e && e.getAttribute && e.getAttribute('data-kfl')) { try { if (e.checkValidity()) e.removeAttribute('aria-invalid'); } catch (x) {} } }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
