/* Kolaboro console layer (batch 12, d12c): shared behaviour for the buyer portal (/portal/) and the admin CRM (/admin/).
   Toasts, a confirm-free undo-less notice system, keyboard shortcuts with a help sheet, density control,
   responsive tables (rows become labelled cards on phones) and, on /admin/, the grouped side navigation.
   It never touches auth: it only reads the DOM the pages already render. Styles: /k/console.css. */
(function () {
  'use strict';
  if (window.KBUI) return;
  var D = document, H = D.documentElement, ADMIN = /^\/admin/.test(location.pathname), B = null;
  // theme: the same choice as on the public site (localStorage kb-theme), otherwise the system setting; set before first paint
  var mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  function theme() { var t = null; try { t = localStorage.getItem('kb-theme'); } catch (e) {} var dark = t ? t === 'dark' : !!(mq && mq.matches);
    if (dark) H.setAttribute('data-theme', 'dark'); else H.removeAttribute('data-theme');
    var m = D.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', dark ? '#0B1117' : '#13222E'); }
  theme(); if (mq) { if (mq.addEventListener) mq.addEventListener('change', theme); else if (mq.addListener) mq.addListener(theme); }
  function st(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function typing(t) { return t && t.closest && t.closest('input,textarea,select,[contenteditable="true"]'); }

  // ---------- toasts: one live region, stacked, dismissable, errors stay longer
  var tz = D.createElement('div'); tz.className = 'kc-toasts'; tz.setAttribute('role', 'status'); tz.setAttribute('aria-live', 'polite');
  function toast(msg, kind) {
    if (!tz.isConnected) D.body.appendChild(tz);
    var t = D.createElement('div'); t.className = 'kc-toast' + (kind ? ' ' + kind : '');
    var s = D.createElement('span'); s.textContent = String(msg == null ? '' : msg); t.appendChild(s);
    var x = D.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'Dismiss'); x.textContent = '×'; x.onclick = function () { t.remove(); }; t.appendChild(x);
    tz.appendChild(t); while (tz.children.length > 4) tz.firstChild.remove();
    requestAnimationFrame(function () { t.classList.add('on'); });
    setTimeout(function () { t.classList.remove('on'); setTimeout(function () { t.remove(); }, 300); }, kind === 'bad' ? 7000 : 3200);
    return t;
  }

  // ---------- modal (used for the shortcut sheet)
  function modal(title, html) {
    var m = D.createElement('div'); m.className = 'kc-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', title);
    m.innerHTML = '<div class="kc-modal-box"><div class="kc-modal-h"><h2>' + title + '</h2><button type="button" class="kc-x" aria-label="Close">×</button></div>' + html + '</div>';
    var prev = D.activeElement;
    function close() { m.remove(); D.removeEventListener('keydown', esc, true); if (prev && prev.focus) prev.focus(); }
    function esc(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }
    m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('.kc-x')) close(); });
    D.addEventListener('keydown', esc, true); D.body.appendChild(m); m.querySelector('.kc-x').focus();
    return { close: close, el: m };
  }

  // ---------- density (comfortable / compact), remembered on this device
  function density(v) { if (v) st('kc-density', v); var c = (v || st('kc-density')) === 'compact'; D.body.classList.toggle('kc-compact', c); var b = D.getElementById('kc-dens'); if (b) { b.setAttribute('aria-pressed', c ? 'true' : 'false'); b.title = c ? 'Comfortable rows (d)' : 'Compact rows (d)'; } return c; }

  // ---------- responsive tables: on phones every row becomes a card with labelled cells
  function labelTables(root) {
    (root || D).querySelectorAll('main table, #app table').forEach(function (t) {
      if (t.dataset.kcNo != null) return;
      var head = t.tHead ? t.tHead.rows[0] : null;
      if (!head) { var r0 = t.rows[0]; if (r0 && r0.cells.length && [].every.call(r0.cells, function (c) { return c.tagName === 'TH'; })) head = r0; }
      if (!head || head.cells.length < 2) return;
      var names = [].map.call(head.cells, function (c) { return c.textContent.replace(/[▲▼↑↓]/g, '').trim(); });
      head.classList.add('kc-th');
      [].forEach.call(t.rows, function (r) {
        if (r === head) return; var i = 0;
        [].forEach.call(r.cells, function (c) { if (c.tagName === 'TD' && !c.hasAttribute('data-l')) c.setAttribute('data-l', names[i] || ''); i += c.colSpan || 1; });
      });
      // numeric columns are right-aligned so figures line up (tabular numerals are on)
      var rows = [].filter.call(t.rows, function (r) { return r !== head; }), NUM = /^[\s\u20ac$]*(EUR|USD|IDR|AED)?\s?-?[\d.,]+\s?(%|s|ms)?$/;
      if (rows.length) names.forEach(function (n, i) {
        var cells = rows.map(function (r) { return r.cells[i]; }).filter(function (c) { return c && c.colSpan === 1 && c.textContent.trim() && c.textContent.trim() !== '-'; });
        if (cells.length && cells.filter(function (c) { return NUM.test(c.textContent.trim()); }).length / cells.length >= 0.8) { cells.forEach(function (c) { c.classList.add('kc-n'); }); if (head.cells[i]) head.cells[i].classList.add('kc-n'); }
      });
      t.classList.add('kc-rt');
    });
  }
  var lt = 0; function soon() { clearTimeout(lt); lt = setTimeout(function () { labelTables(); if (ADMIN) groupNav(); }, 120); }

  // ---------- admin side navigation, grouped by job
  var GROUPS = [['Today', ['ov', 'inbox', 'crm']], ['Sales', ['pipe', 'cust', 'leads']], ['Delivery', ['board', 'clients', 'ops', 'agents']], ['Money', ['pay']], ['Insight', ['growth', 'reports', 'audits', 'graph', 'tools']], ['System', ['tests']]];
  var KEYS = { o: 'ov', i: 'inbox', c: 'crm', p: 'pipe', u: 'cust', l: 'leads', b: 'board', k: 'clients', e: 'ops', a: 'agents', m: 'pay', g: 'growth', r: 'reports', t: 'tests', y: 'tools' };
  var grouped = '';
  function groupNav() {
    var nav = D.querySelector('nav.tabs'); if (!nav) return;
    var btns = [].slice.call(nav.querySelectorAll('button[data-t]')), sig = btns.map(function (b) { return b.dataset.t; }).join(',');
    if (sig === grouped) return; grouped = sig;
    nav.setAttribute('aria-label', 'Admin sections');
    nav.querySelectorAll('.kc-ng').forEach(function (x) { x.remove(); });
    var used = {}, frag = D.createDocumentFragment();
    GROUPS.concat([['More', btns.map(function (b) { return b.dataset.t; })]]).forEach(function (g) {
      var list = g[1].map(function (t) { return btns.filter(function (b) { return b.dataset.t === t && !used[t]; })[0]; }).filter(Boolean);
      if (!list.length) return;
      var h = D.createElement('span'); h.className = 'kc-ng'; h.setAttribute('aria-hidden', 'true'); h.textContent = g[0]; frag.appendChild(h);
      list.forEach(function (b) { used[b.dataset.t] = 1; b.type = 'button'; frag.appendChild(b);
        var k = Object.keys(KEYS).filter(function (x) { return KEYS[x] === b.dataset.t; })[0]; if (k) b.setAttribute('aria-keyshortcuts', 'g ' + k); });
    });
    nav.appendChild(frag);
  }
  function current() { var b = D.querySelector('nav.tabs button.on'); return b ? b.dataset.t : ''; }
  function syncTitle() { var b = D.querySelector('nav.tabs button.on'); if (!b) return; var n = b.childNodes[0] ? b.childNodes[0].textContent.trim() : b.textContent.trim(); D.title = n + ' | Kolaboro admin'; if (innerWidth < 1100 && b.scrollIntoView) try { b.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) {} }

  // ---------- keyboard: g + letter jumps (admin), / search, ? help, d density, r refresh
  var pending = 0;
  function help() {
    var rows = ADMIN ? [['/', 'Search in this section'], ['Ctrl K', 'Search everything'], ['g then o', 'Overview'], ['g then i', 'Inbox'], ['g then c', 'CRM'], ['g then p', 'Pipeline'], ['g then u', 'Customers'], ['g then l', 'Leads and emails'], ['g then b', 'Cases board'], ['g then k', 'Clients'], ['g then e', 'Operations'], ['g then a', 'Agents'], ['g then m', 'Payments'], ['g then t', 'Tests and health'], ['r', 'Refresh the data'], ['d', 'Compact or comfortable rows'], ['Esc', 'Close a customer record or this sheet'], ['?', 'Show this sheet']]
      : [['n', 'Open a new case'], ['m', 'Go to messages'], ['d', 'Compact or comfortable layout'], ['Ctrl Enter', 'Send a message'], ['?', 'Show this sheet']];
    modal('Keyboard shortcuts', '<dl class="kc-keys">' + rows.map(function (r) { return '<dt>' + r[0].split(' ').map(function (k) { return k === 'then' ? '<span>then</span>' : '<kbd>' + k + '</kbd>'; }).join(' ') + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl>');
  }
  D.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || typing(e.target) || D.querySelector('.kc-modal,.cmdk:not([hidden])')) return;
    var k = e.key;
    if (pending && ADMIN) { pending = 0; var t = KEYS[k.toLowerCase()], b = t && D.querySelector('nav.tabs button[data-t="' + t + '"]'); if (b) { e.preventDefault(); if (/^#c=/.test(location.hash)) history.pushState(null, '', location.pathname); b.click(); b.focus(); } return; }
    if (k === '?') { e.preventDefault(); help(); return; }
    if (k === 'd') { e.preventDefault(); toast(density(D.body.classList.contains('kc-compact') ? 'comfortable' : 'compact') ? 'Compact rows' : 'Comfortable rows'); return; }
    if (ADMIN) {
      if (k === 'g') { pending = 1; setTimeout(function () { pending = 0; }, 1200); return; }
      if (k === '/') { var sec = D.querySelector('main > section:not(.hide)'), inp = sec && [].filter.call(sec.querySelectorAll('input[type=search],input:not([type]),input[type=text]'), function (x) { return x.offsetParent; })[0]; if (inp) { e.preventDefault(); inp.focus(); inp.select && inp.select(); } return; }
      if (k === 'r') { var rf = D.getElementById('rf'); if (rf && !D.getElementById('app').classList.contains('hide')) { e.preventDefault(); rf.click(); toast('Refreshing'); } return; }
    } else {
      if (k === 'n') { var nc = D.getElementById('newc'); if (nc) { e.preventDefault(); nc.click(); } return; }
      if (k === 'm') { var ms = D.getElementById('msgs'); if (ms) { e.preventDefault(); ms.scrollIntoView({ block: 'start' }); var ta = ms.querySelector('textarea'); if (ta) ta.focus({ preventScroll: true }); } return; }
    }
  });

  function boot() {
    B = D.body;
    D.body.classList.add('kc', ADMIN ? 'kc-admin' : 'kc-portal');
    density();
    var top = ADMIN && D.querySelector('#app > header');
    if (top && !D.getElementById('kc-dens')) {
      var hb = D.createElement('button'); hb.type = 'button'; hb.id = 'kc-help'; hb.className = ADMIN ? 'kc-hbtn' : 'ap-chip kc-hbtn'; hb.setAttribute('aria-label', 'Keyboard shortcuts'); hb.title = 'Keyboard shortcuts (?)'; hb.textContent = '?'; hb.onclick = help;
      var db = D.createElement('button'); db.type = 'button'; db.id = 'kc-dens'; db.className = ADMIN ? 'kc-hbtn' : 'ap-chip kc-hbtn'; db.setAttribute('aria-label', 'Compact rows');
      db.innerHTML = '<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
      db.onclick = function () { toast(density(D.body.classList.contains('kc-compact') ? 'comfortable' : 'compact') ? 'Compact rows' : 'Comfortable rows'); };
      var anchor = ADMIN ? D.getElementById('rf') : D.getElementById('lng');
      if (anchor) { anchor.parentNode.insertBefore(db, anchor); anchor.parentNode.insertBefore(hb, anchor); }
      density();
    }
    var kb = D.getElementById('kc-keys-b'); if (kb) kb.onclick = function () { var m = kb.closest('details'); if (m) m.open = false; help(); };
    // pop-over menus (account menu, the More menu on each check): one open at a time, close on outside click, Esc or a choice
    D.addEventListener('click', function (e) {
      D.querySelectorAll('details.kc-menu[open], details.c7-more[open]').forEach(function (m) {
        if (!m.contains(e.target) || (e.target.closest('div > button, div > a') && m.contains(e.target))) setTimeout(function () { m.open = false; }, 0);
      });
    });
    D.addEventListener('keydown', function (e) { if (e.key !== 'Escape') return; var m = e.target.closest && e.target.closest('details[open].kc-menu, details[open].c7-more'); if (m) { m.open = false; m.querySelector('summary').focus(); } });
    var root = D.getElementById('app') || B;
    if ('MutationObserver' in window) new MutationObserver(soon).observe(root, { childList: true, subtree: true });
    if (ADMIN) {
      D.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('nav.tabs button')) setTimeout(syncTitle, 0); });
      D.addEventListener('kbadm', function () { setTimeout(function () { groupNav(); syncTitle(); }, 0); });
    }
    soon();
  }
  window.KBUI = { toast: toast, modal: modal, density: density, tables: labelTables };
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot); else boot();
})();
