/* kolaboro.com /tools/vault/ (n35b, batch 35, item 16): a private document vault that lives only in this browser.
   Files and their names are encrypted with AES-GCM (256-bit key from the passphrase: PBKDF2, SHA-256, 310,000 rounds, 16-byte random salt;
   12-byte random IV per record) and kept in IndexedDB "kb-vault". The key is never stored; nothing is sent to any server.
   Export = the encrypted records as JSON (still unreadable without the passphrase). "Contract reader" hands one decrypted copy to
   /tools/contract-reader/ through IndexedDB "kb-vault-x" (same origin, deleted by the reader as soon as it reads it, and here after 5 minutes). */
(function () {
  'use strict';
  var R = document.getElementById('n35v'), TS = document.getElementById('n35v-t'); if (!R || !TS) return;
  var S = JSON.parse(TS.textContent), LOC = S._loc || 'en-GB', PRE = S._p || '';
  var f = function (k, v) { var s = S[k] || k; if (v) Object.keys(v).forEach(function (x) { s = s.split('{' + x + '}').join(v[x]); }); return s; };
  var C = window.crypto && crypto.subtle, IDB = window.indexedDB, TE = new TextEncoder(), TD = new TextDecoder();
  var ITER = 310000, MAX = 50 * 1024 * 1024, CHECK = 'kolaboro-vault-v1';
  var key = null, salt = null, db = null;
  function el(t, a, kids) { var e = document.createElement(t); if (a) Object.keys(a).forEach(function (k) { if (k === 'text') e.textContent = a[k]; else if (k === 'cls') e.className = a[k]; else e.setAttribute(k, a[k]); }); (kids || []).forEach(function (c) { if (c) e.appendChild(c); }); return e; }
  function btn(txt, cls, fn) { var b = el('button', { type: 'button', cls: cls || 'n35-b2', text: txt }); b.addEventListener('click', fn); return b; }
  function msg(t, bad) { var m = R.querySelector('.n35v-m'); if (m) { m.textContent = t || ''; m.setAttribute('role', bad ? 'alert' : 'status'); } }
  function size(n) { try { return n < 1024 ? n + ' B' : n < 1048576 ? new Intl.NumberFormat(LOC, { maximumFractionDigits: 0 }).format(n / 1024) + ' KB' : new Intl.NumberFormat(LOC, { maximumFractionDigits: 1 }).format(n / 1048576) + ' MB'; } catch (e) { return n + ' B'; } }
  function day(s) { try { return new Intl.DateTimeFormat(LOC, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(s)); } catch (e) { return String(s).slice(0, 10); } }
  function b64(buf) { var u = new Uint8Array(buf), s = '', i; for (i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return btoa(s); }
  function ub64(s) { var b = atob(s), u = new Uint8Array(b.length), i; for (i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function rnd(n) { return crypto.getRandomValues(new Uint8Array(n)); }
  // ---------- IndexedDB ----------
  function open(name, stores) { return new Promise(function (ok, no) { var r = IDB.open(name, 1); r.onupgradeneeded = function () { stores.forEach(function (s) { if (!r.result.objectStoreNames.contains(s[0])) r.result.createObjectStore(s[0], s[1] ? { keyPath: s[1] } : undefined); }); }; r.onsuccess = function () { ok(r.result); }; r.onerror = function () { no(r.error); }; }); }
  function tx(store, mode, fn) { return new Promise(function (ok, no) { var t = db.transaction(store, mode), s = t.objectStore(store), out; var r = fn(s); if (r) r.onsuccess = function () { out = r.result; }; t.oncomplete = function () { ok(out); }; t.onerror = t.onabort = function () { no(t.error); }; }); }
  var get = function (st, k) { return tx(st, 'readonly', function (s) { return s.get(k); }); };
  var put = function (st, v, k) { return tx(st, 'readwrite', function (s) { return k === undefined ? s.put(v) : s.put(v, k); }); };
  var all = function (st) { return tx(st, 'readonly', function (s) { return s.getAll(); }); };
  var del = function (st, k) { return tx(st, 'readwrite', function (s) { return s.delete(k); }); };
  // ---------- crypto ----------
  function derive(pass, sl) { return C.importKey('raw', TE.encode(pass), 'PBKDF2', false, ['deriveKey']).then(function (b) { return C.deriveKey({ name: 'PBKDF2', salt: sl, iterations: ITER, hash: 'SHA-256' }, b, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); }); }
  function enc(k, data) { var iv = rnd(12); return C.encrypt({ name: 'AES-GCM', iv: iv }, k, data).then(function (ct) { return { iv: iv, ct: ct }; }); }
  function dec(k, iv, ct) { return C.decrypt({ name: 'AES-GCM', iv: iv }, k, ct); }
  function encMeta(k, m) { return enc(k, TE.encode(JSON.stringify(m))); }
  function decMeta(k, r) { return dec(k, r.miv, r.mct).then(function (b) { return JSON.parse(TD.decode(b)); }); }
  // ---------- screens ----------
  function screen(kids) { R.textContent = ''; kids.concat([el('p', { cls: 'n35v-m', role: 'status' })]).forEach(function (k) { if (k) R.appendChild(k); }); }
  function passField(id, lbl, ac) { return el('label', { 'for': id }, [document.createTextNode(lbl), el('input', { id: id, type: 'password', autocomplete: ac, minlength: '10', required: '' })]); }
  function busy(on) { R.setAttribute('aria-busy', on ? 'true' : 'false'); if (on) msg(f('c_busy')); }
  function create() {
    var fm = el('form', { cls: 'n35-f' }, [passField('n35v-p1', f('c_pp'), 'new-password'), passField('n35v-p2', f('c_pp2'), 'new-password'), el('button', { cls: 'n35-b', type: 'submit', text: f('c_new') })]);
    screen([el('h2', { text: f('c_new') }), el('p', { cls: 'k-xs', text: f('c_ppw') }), fm]);
    fm.addEventListener('submit', function (e) { e.preventDefault(); var a = fm.querySelector('#n35v-p1').value, b = fm.querySelector('#n35v-p2').value;
      if (a.length < 10) return msg(f('c_short'), 1); if (a !== b) return msg(f('c_mis'), 1); busy(1);
      salt = rnd(16); derive(a, salt).then(function (k) { key = k; return enc(k, TE.encode(CHECK)); }).then(function (c) { return put('meta', { salt: salt, iv: c.iv, ct: c.ct, created: new Date().toISOString(), iter: ITER }, 'v'); })
        .then(function () { busy(0); vault(); }).catch(function () { busy(0); msg(f('c_nosup'), 1); }); });
    fm.querySelector('input').focus();
  }
  function locked(meta) {
    var fm = el('form', { cls: 'n35-f' }, [passField('n35v-p', f('c_pp'), 'current-password'), el('button', { cls: 'n35-b', type: 'submit', text: f('c_open') })]);
    screen([el('h2', { text: f('c_locked') }), fm, el('p', null, [btn(f('c_wipe'), 'n35-b2', wipe)])]);
    fm.addEventListener('submit', function (e) { e.preventDefault(); var p = fm.querySelector('#n35v-p').value; busy(1);
      derive(p, meta.salt).then(function (k) { return dec(k, meta.iv, meta.ct).then(function (b) { if (TD.decode(b) !== CHECK) throw 0; key = k; salt = meta.salt; busy(0); vault(); }); }).catch(function () { busy(0); msg(f('c_bad'), 1); fm.querySelector('input').select(); }); });
    fm.querySelector('input').focus();
  }
  function wipe() { if (!confirm(f('c_wipeq'))) return; db.close(); var r = IDB.deleteDatabase('kb-vault'); r.onsuccess = r.onerror = function () { key = null; start(); }; }
  function addFiles(list) {
    var L = Array.prototype.slice.call(list || []), done = 0; if (!L.length) return; busy(1);
    var next = function () { var fl = L.shift(); if (!fl) { busy(0); return vault(); }
      if (fl.size > MAX) { msg(f('c_big', { n: fl.name }), 1); return next(); }
      fl.arrayBuffer().then(function (buf) { return Promise.all([enc(key, buf), encMeta(key, { n: fl.name, t: fl.type || 'application/octet-stream', s: fl.size, a: new Date().toISOString() })]); })
        .then(function (r) { return put('docs', { id: Date.now().toString(36) + b64(rnd(6)).replace(/[^a-z0-9]/gi, ''), iv: r[0].iv, ct: r[0].ct, miv: r[1].iv, mct: r[1].ct }); }).then(function () { done++; next(); }).catch(function () { msg(f('c_nosup'), 1); next(); }); };
    next();
  }
  function blobOf(r, m) { return dec(key, r.iv, r.ct).then(function (b) { return new Blob([b], { type: m.t }); }); }
  function act(r, m, kind) {
    blobOf(r, m).then(function (bl) {
      if (kind === 'cr') return open('kb-vault-x', [['x']]).then(function (x) { return new Promise(function (ok) { var t = x.transaction('x', 'readwrite'); t.objectStore('x').put({ b: bl, n: m.n, t: m.t, at: Date.now() }, 'f'); t.oncomplete = function () { x.close(); ok(); }; }); }).then(function () { location.href = PRE + '/tools/contract-reader/#vault'; });
      var u = URL.createObjectURL(bl); setTimeout(function () { URL.revokeObjectURL(u); }, 60000);
      if (kind === 'dl') { var a = el('a', { href: u, download: m.n }); document.body.appendChild(a); a.click(); a.remove(); } else window.open(u, '_blank', 'noopener');
    }).catch(function () { msg(f('c_bad'), 1); });
  }
  function exportAll() { busy(1); Promise.all([get('meta', 'v'), all('docs')]).then(function (r) { var m = r[0];
      var o = { kolaboro_vault: 1, made: new Date().toISOString(), kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: m.iter || ITER, salt: b64(m.salt) }, cipher: 'AES-GCM-256', check: { iv: b64(m.iv), ct: b64(m.ct) },
        docs: r[1].map(function (d) { return { id: d.id, iv: b64(d.iv), ct: b64(d.ct), miv: b64(d.miv), mct: b64(d.mct) }; }) };
      var u = URL.createObjectURL(new Blob([JSON.stringify(o)], { type: 'application/json' })), a = el('a', { href: u, download: 'kolaboro-vault-' + new Date().toISOString().slice(0, 10) + '.json' }); document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 60000); busy(0); msg('');
    }).catch(function () { busy(0); msg(f('c_nosup'), 1); }); }
  function importFile(fl) { if (!fl) return; busy(1); var o;
    fl.text().then(function (s) { o = JSON.parse(s); if (!o || o.kolaboro_vault !== 1 || !o.kdf || !o.check) throw 0;
      var sl = ub64(o.kdf.salt), same = salt && b64(sl) === b64(salt);
      if (same) return key; var p = prompt(f('c_pp')); if (!p) throw 0; return derive(p, sl); })
      .then(function (k) { return dec(k, ub64(o.check.iv), ub64(o.check.ct)).then(function (b) { if (TD.decode(b) !== CHECK) throw 0; return k; }); })
      .then(function (k) { var n = 0; return o.docs.reduce(function (pr, d) { return pr.then(function () { return Promise.all([dec(k, ub64(d.iv), ub64(d.ct)), dec(k, ub64(d.miv), ub64(d.mct))]); })
        .then(function (x) { return Promise.all([enc(key, x[0]), enc(key, x[1])]); }).then(function (e) { n++; return put('docs', { id: d.id, iv: e[0].iv, ct: e[0].ct, miv: e[1].iv, mct: e[1].ct }); }); }, Promise.resolve()).then(function () { return n; }); })
      .then(function (n) { busy(0); vault(f('c_impok', { k: n })); }).catch(function () { busy(0); msg(f('c_impbad'), 1); }); }
  function vault(note) {
    all('docs').then(function (D) { return Promise.all(D.map(function (d) { return decMeta(key, d).then(function (m) { return { r: d, m: m }; }, function () { return null; }); })); }).then(function (L) {
      L = L.filter(Boolean).sort(function (a, b) { return a.m.a < b.m.a ? 1 : -1; });
      var fi = el('input', { type: 'file', multiple: '', id: 'n35v-f', cls: 'n35v-fi' }), dz = el('label', { 'for': 'n35v-f', cls: 'n35v-dz' }, [el('b', { text: f('c_add') }), el('span', { text: f('c_drop') })]);
      fi.addEventListener('change', function () { addFiles(fi.files); });
      ['dragenter', 'dragover'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('on'); }); });
      ['dragleave', 'drop'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('on'); }); });
      dz.addEventListener('drop', function (e) { addFiles(e.dataTransfer && e.dataTransfer.files); });
      var tot = L.reduce(function (a, x) { return a + (x.m.s || 0); }, 0), body;
      if (!L.length) body = el('p', { text: f('c_empty') });
      else { var tb = el('tbody'); L.forEach(function (x) { var isPdf = /pdf/i.test(x.m.t) || /\.(pdf|txt)$/i.test(x.m.n);
          tb.appendChild(el('tr', null, [el('td', null, [el('bdi', { text: x.m.n })]), el('td', { cls: 'n', text: size(x.m.s) }), el('td', { text: day(x.m.a) }),
            el('td', { cls: 'n35v-a' }, [btn(f('c_view'), 'n35-b2', function () { act(x.r, x.m, 'view'); }), btn(f('c_dl'), 'n35-b2', function () { act(x.r, x.m, 'dl'); }), isPdf ? btn(f('c_cr'), 'n35-b2', function () { act(x.r, x.m, 'cr'); }) : null,
              btn(f('c_del'), 'n35-b2', function () { if (confirm(f('c_delq', { n: x.m.n }))) del('docs', x.r.id).then(function () { vault(); }); })])])); });
        body = el('div', { cls: 'n35-tw', tabindex: '0', role: 'region', 'aria-label': f('c_n', { k: L.length, s: size(tot) }) }, [el('table', null, [el('thead', null, [el('tr', null, [el('th', { scope: 'col', text: f('c_name') }), el('th', { scope: 'col', text: f('c_size') }), el('th', { scope: 'col', text: f('c_added') }), el('th', { scope: 'col', text: f('c_act') })])]), tb])]); }
      var im = el('input', { type: 'file', accept: 'application/json,.json', id: 'n35v-i', cls: 'n35v-fi' }); im.addEventListener('change', function () { importFile(im.files[0]); });
      screen([fi, dz, el('p', { cls: 'n35v-n', text: f('c_n', { k: L.length, s: size(tot) }) }), body,
        el('p', { cls: 'n35v-bar' }, [btn(f('c_lock'), 'n35-b', function () { key = null; start(); }), btn(f('c_exp'), 'n35-b2', exportAll), im, el('label', { 'for': 'n35v-i', cls: 'n35-b2 n35v-il', text: f('c_imp') }), btn(f('c_wipe'), 'n35-b2', wipe)])]);
      if (note) msg(note);
    });
  }
  function start() {
    if (!C || !IDB || !window.TextEncoder) { screen([el('p', { text: f('c_nosup') })]); return; }
    var go = function () { get('meta', 'v').then(function (m) { if (!m) create(); else if (key) vault(); else locked(m); }).catch(function () { screen([el('p', { text: f('c_nosup') })]); }); };
    if (db) return go();
    open('kb-vault', [['meta'], ['docs', 'id']]).then(function (d) { db = d; go(); }).catch(function () { screen([el('p', { text: f('c_nosup') })]); });
    // a hand-off copy for the contract reader that was never picked up is removed after 5 minutes
    open('kb-vault-x', [['x']]).then(function (x) { var t = x.transaction('x', 'readwrite'), s = t.objectStore('x'), g = s.get('f'); g.onsuccess = function () { if (g.result && Date.now() - g.result.at > 300000) s.delete('f'); }; t.oncomplete = function () { x.close(); }; }).catch(function () {});
  }
  var st = el('style'); st.textContent = '.n35v-fi{position:absolute;width:1px;height:1px;opacity:0;overflow:hidden}.n35v-dz{display:flex;flex-direction:column;gap:4px;align-items:center;justify-content:center;min-height:120px;padding:18px;border:2px dashed var(--k-line-2,#BCC5C5);border-radius:14px;text-align:center;cursor:pointer}.n35v-dz.on,.n35v-fi:focus-visible+.n35v-dz{border-color:var(--k-sea,#155C75);background:var(--k-sea-soft,#E2EEF2)}.n35v-dz span{font-size:.9rem;color:var(--k-muted,#56636F)}.n35v-a{display:flex;flex-wrap:wrap;gap:6px}.n35v-a .n35-b2{min-height:40px;padding:0 10px}.n35v-bar{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.n35v-il{display:inline-flex;align-items:center;cursor:pointer}.n35v-fi:focus-visible+.n35v-il{outline:3px solid var(--k-sea,#155C75)}.n35v-m:empty{display:none}.n35v-m[role=alert]{color:var(--k-bad,#A8261B);font-weight:600}';
  document.head.appendChild(st);
  start();
})();
