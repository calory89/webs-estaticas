/* Kolaboro design system helpers (d12a, 7 Nov 2026). Optional: load with <script src="/k/ds.js?v=1" defer> on pages that use
   toasts, tabs, copy buttons or modals. No dependencies, no network. API: window.kDS.toast(text, kind, opts), kDS.modal(el|id).open()/close(). */
(function (w, d) {
  if (w.kDS) return;
  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function host() {
    var h = d.querySelector('.k-toasts');
    if (!h) { h = d.createElement('div'); h.className = 'k-toasts'; h.setAttribute('role', 'status'); h.setAttribute('aria-live', 'polite'); d.body.appendChild(h); }
    return h;
  }
  // kind: 'ok' | 'bad' | 'info'; opts: { action: 'Undo', onAction: fn, ms: 5000 }
  function toast(text, kind, opts) {
    opts = opts || {};
    var t = d.createElement('div'); t.className = 'k-toast' + (kind ? ' k-toast--' + kind : '');
    var s = d.createElement('span'); s.textContent = text; t.appendChild(s);
    if (opts.action) { var b = d.createElement('button'); b.type = 'button'; b.textContent = opts.action; b.addEventListener('click', function () { try { opts.onAction && opts.onAction(); } finally { t.remove(); } }); t.appendChild(b); }
    host().appendChild(t);
    setTimeout(function () { t.remove(); }, opts.ms || (kind === 'bad' ? 8000 : 5000));
    return t;
  }
  function modal(el) {
    if (typeof el === 'string') el = d.getElementById(el);
    var last = null;
    return {
      el: el,
      open: function () { last = d.activeElement; if (el.showModal) el.showModal(); else el.setAttribute('open', ''); },
      close: function () { if (el.close) el.close(); else el.removeAttribute('open'); if (last && last.focus) last.focus(); }
    };
  }
  // close buttons inside k-modal, click on backdrop closes
  d.addEventListener('click', function (e) {
    var x = e.target.closest && e.target.closest('[data-k-close]');
    if (x) { var m = x.closest('dialog'); if (m) m.close(); return; }
    if (e.target.tagName === 'DIALOG' && e.target.classList.contains('k-modal')) { var r = e.target.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.target.close(); }
    var c = e.target.closest && e.target.closest('.k-hash>button,[data-k-copy]');
    if (c) {
      var v = c.getAttribute('data-k-copy') || (c.parentNode.querySelector('code,span') || {}).textContent || '';
      (navigator.clipboard ? navigator.clipboard.writeText(v.trim()) : Promise.reject()).then(function () {
        var o = c.textContent; c.textContent = 'Copied'; setTimeout(function () { c.textContent = o; }, 1500);
      }, function () { toast('Copy did not work here. Select the text and copy it by hand.', 'bad'); });
    }
  });
  // tabs: [role=tablist] with [role=tab][aria-controls]; arrow keys, Home, End
  function selectTab(tab) {
    var list = tab.closest('[role=tablist]'); if (!list) return;
    list.querySelectorAll('[role=tab]').forEach(function (t) {
      var on = t === tab; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1;
      var p = d.getElementById(t.getAttribute('aria-controls')); if (p) p.hidden = !on;
    });
  }
  d.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('.k-tabs [role=tab]'); if (t) selectTab(t); });
  d.addEventListener('keydown', function (e) {
    var t = e.target.closest && e.target.closest('.k-tabs [role=tab]'); if (!t) return;
    var all = Array.prototype.slice.call(t.closest('[role=tablist]').querySelectorAll('[role=tab]')), i = all.indexOf(t), n = null;
    var rtl = d.documentElement.dir === 'rtl', fwd = rtl ? 'ArrowLeft' : 'ArrowRight', back = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === fwd) n = all[(i + 1) % all.length]; else if (e.key === back) n = all[(i - 1 + all.length) % all.length];
    else if (e.key === 'Home') n = all[0]; else if (e.key === 'End') n = all[all.length - 1];
    if (n) { e.preventDefault(); selectTab(n); n.focus(); }
  });
  w.kDS = { toast: toast, modal: modal, selectTab: selectTab, reduceMotion: reduce };
})(window, document);
