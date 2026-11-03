/* Kolaboro deal room (block I, 3 Nov 2026). End-to-end encrypted: everything below runs in the browser.
   Link secret S (32 random bytes) lives only in the URL fragment (#w=...), which browsers never send to a server.
     Kenc  = HKDF-SHA256(S, salt "kolaboro-room-v1", info "enc")    AES-256-GCM content key
     wtok  = HKDF-SHA256(S, salt "kolaboro-room-v1", info "write")  write token (server stores only its SHA-256)
     id    = SHA-256("kolaboro-room-id-v1" || Kenc)                 room id the server sees (one-way: no key from it)
   A read-only link carries Kenc instead of S (#r=...): it can read and verify but cannot write.
   Every entry: record = {v,room,seq,prev,t,a:{x,y},n,k,b}; sig = ECDSA P-256/SHA-256 by the author's device key over the record;
   h = SHA-256(record + "." + sig); next record's prev = h (hash chain). Plaintext {r: record, s: sig} is encrypted with
   AES-GCM, AAD "kolaboro-room-v1|<id>|<seq>", and sent as "1.<iv>.<ciphertext>" (base64url). */
(function () {
  'use strict';
  var $ = function (i) { return document.getElementById(i); };
  var te = new TextEncoder(), td = new TextDecoder(), C = crypto.subtle;
  var API = '/api/x/i/room', FILE_MAX = 200 * 1024;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function b64u(u8) { var s = ''; u8 = new Uint8Array(u8); for (var i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unb64u(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function hex(b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function cat(a, b) { var u = new Uint8Array(a.length + b.length); u.set(a); u.set(b, a.length); return u; }
  function sha(u8) { return C.digest('SHA-256', u8); }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  var ZERO = new Array(65).join('0');

  // ---------- tiny IndexedDB store (device key, local-only entries); falls back to memory ----------
  var MEM = {};
  function idb() { return new Promise(function (ok, no) { try { var r = indexedDB.open('kolaboro-room', 1); r.onupgradeneeded = function () { r.result.createObjectStore('kv'); }; r.onsuccess = function () { ok(r.result); }; r.onerror = function () { no(r.error); }; } catch (e) { no(e); } }); }
  function dbGet(k) { return idb().then(function (db) { return new Promise(function (ok) { var q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = function () { ok(q.result); }; q.onerror = function () { ok(MEM[k]); }; }); }).catch(function () { return MEM[k]; }); }
  function dbPut(k, v) { MEM[k] = v; return idb().then(function (db) { return new Promise(function (ok) { var t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = function () { ok(true); }; t.onerror = function () { ok(false); }; }); }).catch(function () { return false; }); }
  function dbDel(k) { delete MEM[k]; return idb().then(function (db) { return new Promise(function (ok) { var t = db.transaction('kv', 'readwrite'); t.objectStore('kv').delete(k); t.oncomplete = function () { ok(true); }; }); }).catch(function () { return false; }); }

  // ---------- device identity: ECDSA P-256, private key non-extractable, kept in IndexedDB ----------
  var ME = null;
  function myKey() {
    return dbGet('device-key').then(function (k) {
      if (k && k.priv && k.pub) return k;
      return C.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign', 'verify']).then(function (p) {
        return C.exportKey('jwk', p.publicKey).then(function (j) { var k2 = { priv: p.privateKey, pub: { x: j.x, y: j.y } }; return dbPut('device-key', k2).then(function () { return k2; }); });
      });
    }).then(function (k) { return fp(k.pub).then(function (f) { ME = { priv: k.priv, pub: k.pub, fp: f }; return ME; }); });
  }
  function fp(pub) { return sha(te.encode(pub.x + '.' + pub.y)).then(function (h) { return hex(h).slice(0, 16).replace(/(.{4})(?=.)/g, '$1 '); }); }
  var PUBS = {};
  function importPub(a) { var k = a.x + '.' + a.y; if (!PUBS[k]) PUBS[k] = C.importKey('jwk', { kty: 'EC', crv: 'P-256', x: a.x, y: a.y, ext: true }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']); return PUBS[k]; }

  // ---------- room keys from the fragment ----------
  var R = null; // {id, kenc, wtok, canWrite, link, roLink}
  function hkdf(raw, info) { return C.importKey('raw', raw, 'HKDF', false, ['deriveBits']).then(function (k) { return C.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: te.encode('kolaboro-room-v1'), info: te.encode(info) }, k, 256); }).then(function (b) { return new Uint8Array(b); }); }
  function openRoom(frag) {
    var m = /^#?(w|r)=([A-Za-z0-9_-]{43})$/.exec(frag || ''); if (!m) return Promise.resolve(null);
    var raw = unb64u(m[2]); if (raw.length !== 32) return Promise.resolve(null);
    var write = m[1] === 'w', kraw;
    return (write ? hkdf(raw, 'enc') : Promise.resolve(raw)).then(function (k) { kraw = k; return write ? hkdf(raw, 'write') : null; }).then(function (w) {
      return Promise.all([C.importKey('raw', kraw, 'AES-GCM', false, ['encrypt', 'decrypt']), sha(cat(te.encode('kolaboro-room-id-v1'), kraw))]).then(function (x) {
        var base = location.origin + location.pathname;
        return { id: b64u(x[1]), kenc: x[0], wtok: w ? b64u(w) : null, canWrite: write, link: write ? base + '#w=' + m[2] : null, roLink: base + '#r=' + b64u(kraw) };
      });
    });
  }

  // ---------- envelopes ----------
  function aad(seq) { return te.encode('kolaboro-room-v1|' + R.id + '|' + seq); }
  function seal(seq, plain) { var iv = crypto.getRandomValues(new Uint8Array(12)); return C.encrypt({ name: 'AES-GCM', iv: iv, additionalData: aad(seq) }, R.kenc, te.encode(plain)).then(function (ct) { return '1.' + b64u(iv) + '.' + b64u(ct); }); }
  function unseal(seq, env) { var p = String(env).split('.'); if (p.length !== 3 || p[0] !== '1') return Promise.reject(new Error('format')); return C.decrypt({ name: 'AES-GCM', iv: unb64u(p[1]), additionalData: aad(seq) }, R.kenc, unb64u(p[2])).then(function (b) { return td.decode(b); }); }

  // ---------- timeline state ----------
  var MODE = 'local', ENV = [], LOG = [], HEAD = ZERO, BROKEN = null, POLL = null, BUSY = false;
  // verify the chain from scratch; ENV = [{seq, env}] in order
  function rebuild() {
    var out = [], prev = ZERO, broken = null;
    return ENV.reduce(function (p, e, i) {
      return p.then(function () {
        if (broken) return;
        if (e.seq !== i + 1) { broken = { seq: e.seq, why: 'a gap in the sequence' }; return; }
        return unseal(e.seq, e.env).then(function (txt) {
          var o = JSON.parse(txt), rec = JSON.parse(o.r);
          if (rec.room !== R.id || rec.seq !== e.seq) throw new Error('entry moved from another room or position');
          if (rec.prev !== prev) throw new Error('the hash chain does not link to the previous entry');
          return importPub(rec.a).then(function (k) { return C.verify({ name: 'ECDSA', hash: 'SHA-256' }, k, unb64u(o.s), te.encode(o.r)); }).then(function (ok) {
            if (!ok) throw new Error('signature does not verify');
            return Promise.all([sha(te.encode(o.r + '.' + o.s)), fp(rec.a)]).then(function (x) { prev = hex(x[0]); out.push({ rec: rec, h: prev, fp: x[1], at: e.at }); });
          });
        }).catch(function (err) { broken = { seq: e.seq, why: err && err.name === 'OperationError' ? 'it cannot be decrypted with this key (altered or wrong room)' : String(err && err.message || err) }; });
      });
    }, Promise.resolve()).then(function () { LOG = out; HEAD = prev; BROKEN = broken; checkRollback(); render(); });
  }
  var ROLLBACK = null;
  function checkRollback() {
    ROLLBACK = null;
    var saved = null; try { saved = JSON.parse(ls('kb-room-head:' + R.id) || 'null'); } catch (e) {}
    if (saved && saved.seq > LOG.length && !BROKEN) ROLLBACK = 'This device has already seen ' + saved.seq + ' entries, but only ' + LOG.length + ' were returned. Entries may have been removed.';
    else if (saved && saved.seq <= LOG.length && saved.seq > 0 && LOG[saved.seq - 1].h !== saved.h) ROLLBACK = 'Entry ' + saved.seq + ' differs from the one this device saw before. The history was rewritten.';
    if (!ROLLBACK && !BROKEN && LOG.length) ls('kb-room-head:' + R.id, JSON.stringify({ seq: LOG.length, h: HEAD }));
  }

  // ---------- storage: server (ciphertext only) or this device ----------
  function localKey() { return 'room:' + R.id; }
  function load() {
    if (MODE === 'server') {
      var after = ENV.length;
      return fetch(API + '/' + R.id + '?after=' + after, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
        if (d.error === 'not_ready') { MODE = 'local'; return load(); }
        if (!d.exists) { if (R.canWrite && !ENV.length) return createRemote(); return; }
        var add = (d.entries || []).filter(function (e) { return e.seq > ENV.length; });
        if (add.length) { ENV = ENV.concat(add.map(function (e) { return { seq: e.seq, env: e.env, at: e.at }; })); return rebuild(); }
      });
    }
    return dbGet(localKey()).then(function (v) { ENV = (v && v.entries) || []; return rebuild(); });
  }
  function createRemote() { return sha(te.encode(R.wtok)).then(function (h) { return fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: R.id, wtok_hash: hex(h) }) }); }).then(function (r) { return r.json(); }); }
  function saveLocal() { return dbPut(localKey(), { entries: ENV, saved: new Date().toISOString() }); }

  function append(k, body, tries) {
    if (!R.canWrite) return Promise.reject(new Error('read-only link'));
    if (BROKEN) return Promise.reject(new Error('the timeline failed verification; export it before adding more'));
    tries = tries || 0;
    var seq = ENV.length + 1, rec = JSON.stringify({ v: 1, room: R.id, seq: seq, prev: HEAD, t: new Date().toISOString(), a: ME.pub, n: name(), k: k, b: body });
    return C.sign({ name: 'ECDSA', hash: 'SHA-256' }, ME.priv, te.encode(rec)).then(function (sig) {
      return seal(seq, JSON.stringify({ r: rec, s: b64u(sig) }));
    }).then(function (env) {
      if (MODE !== 'server') { ENV.push({ seq: seq, env: env, at: new Date().toISOString() }); return saveLocal().then(rebuild); }
      return fetch(API + '/' + R.id, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ wtok: R.wtok, seq: seq, env: env }) }).then(function (r) { return r.json().then(function (d) { return { s: r.status, d: d }; }); }).then(function (x) {
        if (x.d.ok) { ENV.push({ seq: seq, env: env, at: new Date().toISOString() }); return rebuild(); }
        if (x.s === 409 && tries < 3) return load().then(function () { return append(k, body, tries + 1); });
        if (x.d.error === 'no_room' && tries < 2) return createRemote().then(function () { return append(k, body, tries + 1); });
        throw new Error(x.d.message || x.d.error || 'server');
      });
    });
  }

  // ---------- UI ----------
  function name() { return (ls('kb-room-name') || '').slice(0, 40) || 'Anonymous'; }
  function when(t) { try { return new Date(t).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return t; } }
  function msg(t, bad) { var m = $('rm-msg'); m.textContent = t; m.className = 'rm-msg' + (bad ? ' bad' : ''); if (t) setTimeout(function () { if (m.textContent === t) m.textContent = ''; }, 6000); }
  function render() {
    var items = {}, order = [], files = [], notes = [];
    LOG.forEach(function (e) {
      var r = e.rec;
      if (r.k === 'item') { items[r.seq] = { text: r.b.text, done: false, by: r.n, fp: e.fp }; order.push(r.seq); }
      else if (r.k === 'tick' && items[r.b.item]) { items[r.b.item].done = !!r.b.done; items[r.b.item].tick = r.n; }
      else if (r.k === 'file') files.push(e); else if (r.k === 'note') notes.push(e);
    });
    var done = order.filter(function (s) { return items[s].done; }).length;
    $('rm-check').innerHTML = order.length ? order.map(function (s) { var it = items[s]; return '<li><label><input type="checkbox" data-item="' + s + '"' + (it.done ? ' checked' : '') + (R.canWrite ? '' : ' disabled') + '> <span>' + esc(it.text) + '</span></label><small>' + (it.done ? 'ticked by ' + esc(it.tick) : 'added by ' + esc(it.by)) + '</small></li>'; }).join('') : '<li class="rm-empty">No items yet.' + (R.canWrite ? ' Add your own or start from the buyer\'s list.' : '') + '</li>';
    $('rm-ckn').textContent = order.length ? done + ' of ' + order.length + ' done' : '';
    $('rm-files').innerHTML = files.length ? files.map(function (e, i) { var b = e.rec.b; return '<li><button class="rm-b" type="button" data-file="' + e.rec.seq + '">Download</button> <b>' + esc(b.name) + '</b> <small>' + Math.max(1, Math.round(b.size / 1024)) + ' KB, from ' + esc(e.rec.n) + ', SHA-256 ' + esc(b.sha256.slice(0, 16)) + '…</small></li>'; }).join('') : '<li class="rm-empty">No files yet.</li>';
    $('rm-tl').innerHTML = LOG.length ? LOG.slice().reverse().map(function (e) {
      var r = e.rec, what = r.k === 'note' ? esc(r.b.text) : r.k === 'item' ? 'Added to checklist: ' + esc(r.b.text) : r.k === 'tick' ? (r.b.done ? 'Ticked' : 'Unticked') + ' checklist item #' + r.b.item : r.k === 'file' ? 'Added file ' + esc(r.b.name) : r.k === 'hello' ? 'Opened the room' : esc(r.k);
      return '<li><div class="rm-tlh"><b>' + esc(r.n) + '</b><small>#' + r.seq + ' &middot; ' + when(r.t) + ' &middot; key ' + esc(e.fp) + '</small></div><div class="rm-tlb' + (r.k === 'note' ? ' note' : '') + '">' + what + '</div><div class="rm-hash">signed &#10003; &middot; hash ' + e.h.slice(0, 24) + '… &larr; ' + r.prev.slice(0, 12) + '…</div></li>';
    }).join('') : '<li class="rm-empty">Nothing here yet.</li>';
    var c = $('rm-chain');
    if (BROKEN) { c.className = 'rm-chain bad'; c.innerHTML = '<b>Tampering detected at entry #' + BROKEN.seq + ':</b> ' + esc(BROKEN.why) + '. Entries before it verified. Do not rely on anything after it.'; }
    else if (ROLLBACK) { c.className = 'rm-chain bad'; c.innerHTML = '<b>Rollback warning:</b> ' + esc(ROLLBACK); }
    else { c.className = 'rm-chain ok'; c.innerHTML = '<b>' + LOG.length + ' entr' + (LOG.length === 1 ? 'y' : 'ies') + ' verified in this browser</b>: decrypted, every signature checked, every entry linked to the one before. Head ' + HEAD.slice(0, 16) + '…'; }
    var authors = {}; LOG.forEach(function (e) { authors[e.fp] = e.rec.n; });
    $('rm-who').innerHTML = Object.keys(authors).map(function (f) { return '<li><b>' + esc(authors[f]) + '</b> <code>' + esc(f) + '</code>' + (ME && f === ME.fp ? ' <small>(this device)</small>' : '') + '</li>'; }).join('') || '<li class="rm-empty">No one has written yet.</li>';
    $('rm-mode').innerHTML = MODE === 'server' ? '<b>Synced.</b> Our server stores the encrypted entries only; everyone with the link sees the same timeline.' : '<b>Local-only mode.</b> Server storage for rooms is not switched on yet, so entries are kept encrypted in this browser only. Use Export to move them to another device or to send them with the link; Import merges an export.';
    document.querySelectorAll('[data-write]').forEach(function (el) { el.hidden = !R.canWrite; });
    $('rm-ro').hidden = R.canWrite;
  }

  function startRoom() {
    $('rm-start').hidden = true; $('rm-room').hidden = false;
    $('rm-link').value = R.link || ''; $('rm-rolink').value = R.roLink; $('rm-linkrow').hidden = !R.canWrite;
    $('rm-me').textContent = ME.fp; $('rm-name').value = ls('kb-room-name') || '';
    return fetch('/api/x/i/status', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (s) { MODE = s.room && s.room.ready ? 'server' : 'local'; }).catch(function () { MODE = 'local'; })
      .then(load).then(function () {
        if (R.canWrite && !ENV.length && !BROKEN && JUST === R.id) { JUST = null; return append('hello', {}); }
      }).then(function () { if (MODE === 'server') { clearInterval(POLL); POLL = setInterval(function () { if (!BUSY && document.visibilityState === 'visible') load().catch(function () {}); }, 10000); } })
      .catch(function (e) { msg('Could not open the room: ' + (e && e.message || e), true); });
  }

  function go() {
    return myKey().then(function () { return openRoom(location.hash); }).then(function (r) {
      R = r;
      if (!R) { $('rm-start').hidden = false; $('rm-room').hidden = true; if (location.hash) msg('That link is not a valid room link.', true); return; }
      return startRoom();
    }).catch(function (e) { $('rm-start').hidden = false; msg('This browser cannot run the room (WebCrypto unavailable): ' + (e && e.message || e), true); });
  }

  // ---------- events ----------
  var JUST = null;
  $('rm-new').onclick = function () { var s = crypto.getRandomValues(new Uint8Array(32)); openRoom('#w=' + b64u(s)).then(function (r) { JUST = r.id; location.hash = 'w=' + b64u(s); }); };
  window.addEventListener('hashchange', function () { ENV = []; LOG = []; HEAD = ZERO; BROKEN = null; clearInterval(POLL); go(); });
  function guard(p) { BUSY = true; return p.catch(function (e) { msg(String(e && e.message || e), true); }).then(function () { BUSY = false; }); }
  $('rm-noteform').onsubmit = function (e) { e.preventDefault(); var t = $('rm-note').value.trim(); if (!t) return; guard(append('note', { text: t.slice(0, 4000) }).then(function () { $('rm-note').value = ''; msg('Note encrypted, signed and added.'); })); };
  $('rm-itemform').onsubmit = function (e) { e.preventDefault(); var t = $('rm-item').value.trim(); if (!t) return; guard(append('item', { text: t.slice(0, 200) }).then(function () { $('rm-item').value = ''; })); };
  $('rm-tpl').onclick = function () {
    var L = ['Land title checked at the land office, in the seller\'s name', 'Building permit found in the official register for this plot', 'Developer licence or registration confirmed', 'Payments go to an escrow or trust account in my name', 'Contract reviewed by my own lawyer', 'Completion date and delay penalty written in the contract', 'Site visit or photos confirm progress before each payment'];
    guard(L.reduce(function (p, t) { return p.then(function () { return append('item', { text: t }); }); }, Promise.resolve()));
  };
  $('rm-check').addEventListener('change', function (e) { var c = e.target; if (!c.dataset.item) return; guard(append('tick', { item: +c.dataset.item, done: c.checked })); });
  $('rm-file').onchange = function () {
    var f = this.files[0]; this.value = ''; if (!f) return;
    if (f.size > FILE_MAX) { msg('Files up to 200 KB in a room (photos of a page, a short PDF). For bigger documents share the file by other means and add its SHA-256 here as a note.', true); return; }
    guard(f.arrayBuffer().then(function (b) { return sha(b).then(function (h) { return append('file', { name: f.name.slice(0, 120), type: (f.type || 'application/octet-stream').slice(0, 80), size: f.size, sha256: hex(h), data: b64u(b) }); }); }).then(function () { msg('File encrypted in your browser and added.'); }));
  };
  $('rm-files').addEventListener('click', function (e) {
    var b = e.target.closest('[data-file]'); if (!b) return; var en = LOG.filter(function (x) { return x.rec.seq === +b.dataset.file; })[0]; if (!en) return;
    var data = unb64u(en.rec.b.data);
    sha(data).then(function (h) { if (hex(h) !== en.rec.b.sha256) return msg('File fingerprint mismatch.', true); var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: en.rec.b.type })); a.download = en.rec.b.name; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000); });
  });
  $('rm-name').onchange = function () { ls('kb-room-name', this.value.trim().slice(0, 40)); msg('Name saved on this device. It goes inside your encrypted entries.'); };
  function copy(id, btn) { var v = $(id).value; (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(function () { var o = btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = o; }, 1500); }).catch(function () { $(id).select(); }); }
  $('rm-copy').onclick = function () { copy('rm-link', this); }; $('rm-rocopy').onclick = function () { copy('rm-rolink', this); };
  $('rm-export').onclick = function () {
    var blob = new Blob([JSON.stringify({ format: 'kolaboro-room-v1', room: R.id, exported: new Date().toISOString(), note: 'Encrypted entries only. Useless without the room link.', entries: ENV })], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'kolaboro-room-' + R.id.slice(0, 8) + '.json'; a.click();
  };
  $('rm-import').onchange = function () {
    var f = this.files[0]; this.value = ''; if (!f) return;
    f.text().then(function (t) {
      var d = JSON.parse(t); if (d.format !== 'kolaboro-room-v1' || d.room !== R.id) throw new Error('This export belongs to another room (or is not a Kolaboro room export).');
      var all = (d.entries || []).filter(function (e) { return e && typeof e.env === 'string'; }).sort(function (a, b) { return a.seq - b.seq; });
      var clash = all.filter(function (e) { return e.seq <= ENV.length && ENV[e.seq - 1].env !== e.env; });
      if (clash.length) throw new Error('This export and this device disagree from entry #' + clash[0].seq + ' (two people wrote offline at the same time). Open the export in a private window to read it.');
      var inc = all.filter(function (e) { return e.seq > ENV.length; });
      if (!inc.length) return msg('Nothing new in that export.');
      if (MODE === 'server') return msg('This room is synced through the server; import is for local-only rooms.', true);
      ENV = ENV.concat(inc.map(function (e) { return { seq: e.seq, env: e.env, at: e.at }; })); return saveLocal().then(rebuild).then(function () { msg('Imported ' + inc.length + ' entries. Verification result is shown above.'); });
    }).catch(function (e) { msg(String(e && e.message || e), true); });
  };
  $('rm-forget').onclick = function () {
    if (!confirm(MODE === 'server' ? 'Delete this room from the server for everyone, and from this device? This cannot be undone.' : 'Delete this room from this device? Export first if you need it.')) return;
    var p = MODE === 'server' && R.canWrite ? fetch(API + '/' + R.id + '/delete', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ wtok: R.wtok }) }) : Promise.resolve();
    p.then(function () { return dbDel(localKey()); }).then(function () { ls('kb-room-head:' + R.id, null); location.hash = ''; location.reload(); });
  };
  window.KBROOM = { state: function () { return { mode: MODE, id: R && R.id, entries: LOG.length, broken: BROKEN, rollback: ROLLBACK, head: HEAD }; }, _env: function () { return ENV; } };
  go();
})();
