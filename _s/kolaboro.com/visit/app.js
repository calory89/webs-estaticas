/* Kolaboro offline site visit (block T). Everything stays in IndexedDB on this device. Each entry is hashed into a chain:
   hash_n = SHA-256(JSON ["kolaboro-visit-entry-v1", visit, n, at, kind, step, value, text, lat, lng, acc, photo_sha256, hash_(n-1)]),
   hash_0 = SHA-256("kolaboro-visit-v1\n" + JSON [visit, created, project, place, milestone]).
   The export is signed over "kolaboro-visit-v1\n" + head + "\n" + entry count: with a passkey (WebAuthn, rp kolaboro.com) or with a
   P-256 key generated on this device (private key not extractable). The JSON export carries everything needed to verify offline. */
(function(){
  'use strict';
  var $ = function(i){ return document.getElementById(i); };
  var te = new TextEncoder();
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function hex(b){ return Array.prototype.map.call(new Uint8Array(b), function(x){ return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function sha(x){ return crypto.subtle.digest('SHA-256', typeof x === 'string' ? te.encode(x) : x).then(hex); }
  function b64(u){ u = new Uint8Array(u); var s = ''; for (var i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return btoa(s); }
  function b64u(u){ return b64(u).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unb64(x){ x = String(x).replace(/-/g, '+').replace(/_/g, '/'); while (x.length % 4) x += '='; var s = atob(x), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
  function short(h){ return h ? h.slice(0, 10) + '…' : ''; }
  var CL = null, V = null, ENTRIES = [], PHOTO_URLS = [];

  // ---------- service worker (scope /visit/ only) and connection badge
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/visit/sw.js?v=1ff4e2f50a', { scope: '/visit/' }).catch(function(){});
  function net(){ var n = $('net'); n.textContent = navigator.onLine ? 'Online' : 'Offline: everything still works'; n.className = 'net' + (navigator.onLine ? '' : ' off'); }
  addEventListener('online', net); addEventListener('offline', net); net();

  // ---------- IndexedDB
  var DBP = null;
  function db(){ if (DBP) return DBP; DBP = new Promise(function(res, rej){ var r = indexedDB.open('kb-visit', 1);
    r.onupgradeneeded = function(){ var d = r.result; d.createObjectStore('visits', { keyPath: 'id' }); var e = d.createObjectStore('entries', { keyPath: ['visit', 'n'] }); e.createIndex('visit', 'visit'); d.createObjectStore('keys', { keyPath: 'id' }); };
    r.onsuccess = function(){ res(r.result); }; r.onerror = function(){ rej(r.error); }; }); return DBP; }
  function tx(store, mode, fn){ return db().then(function(d){ return new Promise(function(res, rej){ var t = d.transaction(store, mode), out; out = fn(t.objectStore(store)); t.oncomplete = function(){ res(out instanceof IDBRequest ? out.result : out); }; t.onerror = function(){ rej(t.error); }; t.onabort = function(){ rej(t.error); }; }); }); }
  function all(store){ return tx(store, 'readonly', function(s){ return s.getAll(); }); }
  function get(store, k){ return tx(store, 'readonly', function(s){ return s.get(k); }); }
  function put(store, v){ return tx(store, 'readwrite', function(s){ s.put(v); }); }
  function entriesOf(id){ return tx('entries', 'readonly', function(s){ return s.index('visit').getAll(id); }).then(function(L){ return L.sort(function(a, b){ return a.n - b.n; }); }); }

  // ---------- the chain
  function genesis(v){ return sha('kolaboro-visit-v1\n' + JSON.stringify([v.id, v.created, v.project || null, v.place || null, v.milestone || null])); }
  function canon(v, e){ return JSON.stringify(['kolaboro-visit-entry-v1', v.id, e.n, e.at, e.kind, e.step == null ? null : e.step, e.value == null ? null : e.value, e.text == null ? null : e.text, e.lat == null ? null : e.lat, e.lng == null ? null : e.lng, e.acc == null ? null : e.acc, e.photo_sha256 || null, e.prev]); }
  function add(e){   // append one entry: n, prev and hash are computed here, in order
    var v = V; var last = ENTRIES[ENTRIES.length - 1];
    return (last ? Promise.resolve(last.hash) : genesis(v)).then(function(prev){
      e.visit = v.id; e.n = (last ? last.n : 0) + 1; e.at = new Date().toISOString(); e.prev = prev;
      return sha(canon(v, e));
    }).then(function(h){ e.hash = h; return put('entries', e); }).then(function(){ ENTRIES.push(e); v.head = e.hash; v.count = e.n; v.updated = e.at; return put('visits', v); }).then(function(){ return e; });
  }
  function verifyChain(v, L){
    return genesis(v).then(function(prev){
      var i = 0, bad = null;
      function next(){
        if (i >= L.length || bad) return { ok: !bad, bad: bad, head: L.length ? L[L.length - 1].hash : prev, n: L.length };
        var e = L[i];
        if (e.n !== i + 1) { bad = { n: e.n, why: 'entry number out of order' }; return next(); }
        if (e.prev !== prev) { bad = { n: e.n, why: 'link to the previous entry broken' }; return next(); }
        return sha(canon(v, e)).then(function(h){ if (h !== e.hash) bad = { n: e.n, why: 'entry changed after it was recorded' }; prev = e.hash; i++; return next(); });
      }
      return next();
    });
  }

  // ---------- GPS (works without network)
  var POS = null;
  function locate(){
    return new Promise(function(res){
      if (!navigator.geolocation) return res(null);
      navigator.geolocation.getCurrentPosition(function(p){ POS = p; res(p); }, function(){ res(POS && Date.now() - POS.timestamp < 120000 ? POS : null); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
    });
  }
  function geo(e, p){ if (p) { e.lat = +p.coords.latitude.toFixed(6); e.lng = +p.coords.longitude.toFixed(6); e.acc = Math.round(p.coords.accuracy); } return e; }

  // ---------- photos: downscale to 1600 px JPEG on the device, fingerprint the stored bytes
  function photoBlob(file){
    return new Promise(function(res, rej){
      var u = URL.createObjectURL(file), im = new Image();
      im.onload = function(){ var s = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
        c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
        c.toBlob(function(b){ b ? res({ blob: b, w: c.width, h: c.height }) : rej(new Error('could not encode the photo')); }, 'image/jpeg', 0.85); };
      im.onerror = function(){ URL.revokeObjectURL(u); rej(new Error('not an image this browser can read')); };
      im.src = u;
    });
  }

  // ---------- views
  function home(){
    V = null; ENTRIES = [];
    all('visits').then(function(L){
      L.sort(function(a, b){ return a.updated < b.updated ? 1 : -1; });
      var ms = CL.milestones.map(function(m, i){ return '<option value="' + m.id + '">' + (i + 1) + ' · ' + esc(m.title) + '</option>'; }).join('');
      $('app').innerHTML = '<div class="card"><h2 style="margin-top:0">Start a visit</h2><form id="nf" class="grid" autocomplete="off">' +
        '<label class="f">Project id (optional)<input type="text" id="np" maxlength="10" placeholder="e.g. BALI-014" spellcheck="false"></label>' +
        '<label class="f">Place or name<input type="text" id="nl" maxlength="80" placeholder="e.g. Villa 3, Uluwatu"></label>' +
        '<label class="f">Construction stage<select id="nm">' + ms + '</select></label>' +
        '<div><button class="btn h" type="submit">Start visit</button></div></form></div>' +
        '<div class="card"><h2 style="margin-top:0">Visits on this device</h2><div class="vlist">' + (L.length ? L.map(function(v){
          return '<button data-v="' + esc(v.id) + '"><b>' + esc(v.place || v.project || 'Visit') + '</b> ' + (v.project ? '<span class="pill">' + esc(v.project) + '</span> ' : '') + '<span class="mut">' + esc(new Date(v.created).toLocaleString()) + ' · ' + (v.count || 0) + ' entries' + (v.head ? ' · head ' + esc(short(v.head)) : '') + '</span></button>';
        }).join('') : '<p class="mut" style="margin:0">None yet.</p>') + '</div></div>';
      $('nf').onsubmit = function(ev){ ev.preventDefault();
        var p = $('np').value.trim().toUpperCase(), rnd = new Uint8Array(8); crypto.getRandomValues(rnd);
        var v = { id: 'v_' + hex(rnd), created: new Date().toISOString(), project: /^[A-Z]{2,5}-\d{3,4}$/.test(p) ? p : null, place: $('nl').value.trim().slice(0, 80) || null, milestone: $('nm').value, count: 0, head: null };
        v.updated = v.created; put('visits', v).then(function(){ open(v.id); });
      };
      $('app').querySelectorAll('[data-v]').forEach(function(b){ b.onclick = function(){ open(b.dataset.v); }; });
    });
  }
  function open(id){
    Promise.all([get('visits', id), entriesOf(id)]).then(function(r){ V = r[0]; ENTRIES = r[1]; if (!V) return home(); try { history.replaceState(null, '', '#' + id); } catch (e) {} draw(); locate(); });
  }
  function latest(step){ var x = null; ENTRIES.forEach(function(e){ if (e.step === step && e.kind === 'check') x = e; }); return x; }
  function photosOf(step){ return ENTRIES.filter(function(e){ return e.kind === 'photo' && e.step === step; }); }
  function itemHtml(step, title, tip){
    var c = latest(step), ph = photosOf(step);
    return '<div class="it" data-s="' + esc(step) + '"><div><b>' + esc(title) + '</b>' + (tip ? '<small>' + esc(tip) + '</small>' : '') + '</div>' +
      '<div class="seg">' + [['ok', 'Seen, OK'], ['issue', 'Problem'], ['na', 'Could not see']].map(function(o){ return '<button type="button" data-v="' + o[0] + '"' + (c && c.value === o[0] ? ' class="on"' : '') + '>' + o[1] + '</button>'; }).join('') +
      '<span class="btn l s cam">Photo<input type="file" accept="image/*" capture="environment" data-ph aria-label="Photo for: ' + esc(title) + '"></span></div>' +
      (ph.length ? '<div class="thumbs" data-th></div>' : '') + '</div>';
  }
  function draw(){
    PHOTO_URLS.forEach(function(u){ URL.revokeObjectURL(u); }); PHOTO_URLS = [];
    var m = CL.milestones.filter(function(x){ return x.id === V.milestone; })[0] || CL.milestones[0];
    var h = '<div class="row" style="margin-top:8px"><button class="btn l s" id="back">← All visits</button><span class="mut">' + esc(V.place || '') + (V.project ? ' · <a href="/p/' + esc(V.project) + '">' + esc(V.project) + '</a>' : '') + ' · started ' + esc(new Date(V.created).toLocaleString()) + '</span></div>';
    h += '<div class="card" id="chain"></div>';
    h += '<div class="card"><h2 style="margin-top:0">' + esc(m.title) + ': what to look at</h2>' + m.items.map(function(t, i){ return itemHtml(m.id + '.' + (i + 1), t, ''); }).join('') + '</div>';
    h += '<div class="card"><details><summary>Paperwork to ask about while you are there (' + CL.paperwork.reduce(function(n, g){ return n + g.items.length; }, 0) + ' points)</summary>' +
      CL.paperwork.map(function(g, gi){ return '<h3 style="margin:14px 0 4px;font-size:1rem">' + esc(g.title) + '</h3>' + g.items.map(function(x, i){ return itemHtml('p' + (gi + 1) + '.' + (i + 1), x.t, x.tip); }).join(''); }).join('') + '</details></div>';
    h += '<div class="card"><h2 style="margin-top:0">Notes and extra photos</h2><textarea id="nt" rows="3" maxlength="2000" placeholder="What you saw, what people told you, with names of roles not people."></textarea><div class="row" style="margin-top:8px"><button class="btn s" id="ns">Add note</button><span class="btn l s cam">Extra photo<input type="file" accept="image/*" capture="environment" id="xp" aria-label="Extra photo"></span></div><div class="thumbs" id="xth" style="margin-top:8px"></div></div>';
    h += '<div class="card"><h2 style="margin-top:0">Sign and export</h2><p class="mut" style="margin-top:0">Signs the last fingerprint, then saves a JSON file (verifiable, with photos) and a PDF (readable). Nothing is uploaded.</p><div class="row"><button class="btn h" id="exk"' + (window.PublicKeyCredential ? '' : ' disabled') + '>Sign with passkey</button><button class="btn" id="exd">Sign with this device\'s key</button></div><div id="exo" class="mut" aria-live="polite" style="margin-top:8px"></div></div>';
    h += '<div class="card"><h2 style="margin-top:0">Record</h2><div class="log" id="log"></div><div class="row" style="margin-top:10px"><button class="btn l s" id="del">Delete this visit from the device</button></div></div>';
    $('app').innerHTML = h;
    $('back').onclick = function(){ try { history.replaceState(null, '', location.pathname); } catch (e) {} home(); };
    $('app').querySelectorAll('.it').forEach(function(row){
      var step = row.dataset.s, title = row.querySelector('b').textContent;
      row.querySelectorAll('.seg button').forEach(function(b){ b.onclick = function(){ check(step, b.dataset.v, title); }; });
      row.querySelector('[data-ph]').onchange = function(){ if (this.files[0]) photo(this.files[0], step, title); };
      var th = row.querySelector('[data-th]'); if (th) thumbs(th, photosOf(step));
    });
    thumbs($('xth'), ENTRIES.filter(function(e){ return e.kind === 'photo' && !e.step; }));
    $('ns').onclick = function(){ var t = $('nt').value.trim(); if (t.length < 2) return; this.disabled = true; locate().then(function(p){ return add(geo({ kind: 'note', text: t.slice(0, 2000) }, p)); }).then(function(){ $('nt').value = ''; draw(); }); };
    $('xp').onchange = function(){ if (this.files[0]) photo(this.files[0], null, 'Extra photo'); };
    $('exk').onclick = function(){ exportVisit('passkey'); };
    $('exd').onclick = function(){ exportVisit('device'); };
    $('del').onclick = function(){ if (!confirm('Delete this visit and its photos from this device? Export it first if you need it.')) return;
      tx('entries', 'readwrite', function(s){ ENTRIES.forEach(function(e){ s.delete([e.visit, e.n]); }); }).then(function(){ return tx('visits', 'readwrite', function(s){ s.delete(V.id); }); }).then(home); };
    chainBox(); logBox();
  }
  function thumbs(box, L){ L.forEach(function(e){ if (!e.photo) return; var u = URL.createObjectURL(e.photo); PHOTO_URLS.push(u); var i = document.createElement('img'); i.src = u; i.alt = 'Photo ' + e.n + ', fingerprint ' + short(e.photo_sha256); box.appendChild(i); }); }
  function chainBox(){
    verifyChain(V, ENTRIES).then(function(r){
      $('chain').innerHTML = '<div class="row"><span class="pill ' + (r.ok ? 'g' : 'r') + '">' + (r.ok ? 'Chain intact' : 'Chain broken') + '</span><b>' + r.n + ' entr' + (r.n === 1 ? 'y' : 'ies') + '</b><span class="mut">' + (r.ok ? 'every fingerprint recomputed just now' : 'entry ' + r.bad.n + ': ' + esc(r.bad.why)) + '</span></div><p class="hash" style="margin:8px 0 0">Head ' + esc(r.head) + '</p><p class="mut" id="gps" style="margin:6px 0 0">' + (POS ? 'GPS ±' + Math.round(POS.coords.accuracy) + ' m' : 'Location: allow it for GPS on each entry (works without signal).') + '</p>';
    });
  }
  function logBox(){
    var K = { check: 'Tick', photo: 'Photo', note: 'Note', export: 'Signed' };
    $('log').innerHTML = ENTRIES.length ? ENTRIES.slice().reverse().map(function(e){
      return '<div><span class="hash">#' + e.n + ' ' + esc(short(e.hash)) + '</span><span>' + esc(K[e.kind] || e.kind) + (e.step ? ' · ' + esc(e.step) : '') + (e.value ? ' · ' + esc(e.value) : '') + (e.text ? ' · ' + esc(e.text.slice(0, 80)) : '') + ' <span class="mut">' + esc(e.at.slice(11, 19)) + ' UTC' + (e.lat != null ? ' · ' + e.lat + ', ' + e.lng + ' ±' + e.acc + ' m' : ' · no GPS') + '</span></span></div>';
    }).join('') : '<p class="mut" style="margin:0">Nothing recorded yet.</p>';
  }
  function check(step, value, title){
    locate().then(function(p){ return add(geo({ kind: 'check', step: step, value: value, text: title.slice(0, 200) }, p)); }).then(draw);
  }
  function photo(file, step, title){
    var o = $('chain'); o.insertAdjacentHTML('beforeend', '<p class="mut" id="busy">Saving the photo on this device…</p>');
    Promise.all([photoBlob(file), locate()]).then(function(r){
      return r[0].blob.arrayBuffer().then(sha).then(function(h){ return add(geo({ kind: 'photo', step: step, text: title ? title.slice(0, 200) : null, photo_sha256: h, photo: r[0].blob, w: r[0].w, h: r[0].h }, r[1])); });
    }).then(draw).catch(function(e){ var b = $('busy'); if (b) b.textContent = 'Photo not saved: ' + (e.message || e); });
  }

  // ---------- signing
  function deviceKey(){
    return get('keys', 'device').then(function(k){
      if (k) return k;
      return crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign', 'verify']).then(function(kp){
        return crypto.subtle.exportKey('jwk', kp.publicKey).then(function(jwk){ var rec = { id: 'device', priv: kp.privateKey, jwk: { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y }, created: new Date().toISOString() }; return put('keys', rec).then(function(){ return rec; }); });
      });
    });
  }
  function passkey(){
    return get('keys', 'passkey').then(function(k){
      if (k) return k;
      var uid = new Uint8Array(16); crypto.getRandomValues(uid);
      return navigator.credentials.create({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), rp: { id: 'kolaboro.com', name: 'Kolaboro' }, user: { id: uid, name: 'Kolaboro site visit', displayName: 'Kolaboro site visit' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -8 }, { type: 'public-key', alg: -257 }], authenticatorSelection: { userVerification: 'required', residentKey: 'discouraged' }, attestation: 'none', timeout: 90000 } })
        .then(function(c){ var r = c.response; if (!r.getPublicKey) throw new Error('this browser cannot export the passkey public key'); var rec = { id: 'passkey', cred_id: c.id, spki: b64(r.getPublicKey()), alg: r.getPublicKeyAlgorithm(), created: new Date().toISOString() }; return put('keys', rec).then(function(){ return rec; }); });
    });
  }
  function message(head, n){ return 'kolaboro-visit-v1\n' + head + '\n' + n; }
  function sign(kind, head, n){
    var msg = message(head, n);
    if (kind === 'device') return deviceKey().then(function(k){ return crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, k.priv, te.encode(msg)).then(function(s){ return { type: 'device-p256', alg: 'ECDSA P-256 SHA-256', public_key_jwk: k.jwk, key_id: null, signature: b64(s), signed: msg }; }); }).then(function(s){ return crypto.subtle.digest('SHA-256', te.encode(JSON.stringify(s.public_key_jwk))).then(function(h){ s.key_id = hex(h).slice(0, 16); return s; }); });
    return passkey().then(function(k){
      return crypto.subtle.digest('SHA-256', te.encode(msg)).then(function(ch){ return navigator.credentials.get({ publicKey: { challenge: ch, rpId: 'kolaboro.com', allowCredentials: [{ type: 'public-key', id: unb64(k.cred_id) }], userVerification: 'required', timeout: 90000 } }); })
        .then(function(a){ var r = a.response; return { type: 'passkey', alg: k.alg, spki: k.spki, cred_id: a.id, authenticator_data: b64u(r.authenticatorData), client_data_json: b64u(r.clientDataJSON), signature: b64u(r.signature), signed: msg }; });
    });
  }
  function exportVisit(kind){
    var o = $('exo'); o.textContent = kind === 'passkey' ? 'Your device will ask for Face ID, a fingerprint or the screen lock…' : 'Signing…';
    verifyChain(V, ENTRIES).then(function(r){
      if (!r.ok) throw new Error('the chain is broken at entry ' + r.bad.n + ', not signing');
      return sign(kind, r.head, r.n).then(function(sig){ return add({ kind: 'export', text: (sig.type === 'passkey' ? 'Signed with passkey' : 'Signed with device key ' + sig.key_id) + ' over ' + r.n + ' entries' }).then(function(){ return { sig: sig, head: r.head, n: r.n }; }); });
    }).then(function(x){
      var signedEntries = ENTRIES.slice(0, x.n);
      return Promise.all(signedEntries.map(function(e){ return e.photo ? e.photo.arrayBuffer().then(function(b){ return b64(b); }) : null; })).then(function(photos){
        var out = { format: 'kolaboro-visit-v1', exported: new Date().toISOString(), app: 'https://kolaboro.com/visit/', checklist_built: CL.built,
          visit: { id: V.id, created: V.created, project: V.project || null, place: V.place || null, milestone: V.milestone || null },
          entries: signedEntries.map(function(e, i){ var y = {}; ['n', 'at', 'kind', 'step', 'value', 'text', 'lat', 'lng', 'acc', 'photo_sha256', 'prev', 'hash', 'w', 'h'].forEach(function(k){ if (e[k] !== undefined) y[k] = e[k]; }); if (photos[i]) y.photo_jpeg_b64 = photos[i]; return y; }),
          head: x.head, count: x.n, signature: x.sig,
          how_to_verify: 'Open https://kolaboro.com/visit/ and pick this file under "Check an exported visit", or recompute: hash_0 = SHA-256("kolaboro-visit-v1\\n" + JSON [visit.id, visit.created, project, place, milestone]); hash_n = SHA-256(JSON ["kolaboro-visit-entry-v1", visit.id, n, at, kind, step, value, text, lat, lng, acc, photo_sha256, hash_(n-1)]); photo_sha256 = SHA-256 of the JPEG bytes; the signature covers signature.signed.' };
        var name = 'kolaboro-visit-' + (V.project || 'site') + '-' + V.created.slice(0, 10) + '-' + x.head.slice(0, 8);
        save(new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' }), name + '.json');
        return pdf(out, signedEntries).then(function(b){ save(b, name + '.pdf'); draw(); $('exo').innerHTML = '<span class="ok">Signed and saved.</span> ' + esc(name) + '.json and .pdf. Head <span class="hash">' + esc(x.head) + '</span>'; });
      });
    }).catch(function(e){ o.innerHTML = '<span class="no">Not exported:</span> ' + esc(e && e.name === 'NotAllowedError' ? 'the passkey request was cancelled or timed out' : (e.message || e)); });
  }
  function save(blob, name){ var a = document.createElement('a'), u = URL.createObjectURL(blob); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(u); }, 4000); }

  // ---------- a small PDF writer: Helvetica text and the JPEG photos as they are (DCTDecode), A4
  function pdf(out, L){
    var W = 595, H = 842, M = 40, pages = [], cur = null, y = 0, images = [];
    function ascii(s){ return String(s == null ? '' : s).replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014]/g, '-').replace(/\u2026/g, '...').replace(/\u00B1/g, '+/-').replace(/[^\x20-\x7E]/g, '?'); }
    function pe(s){ return ascii(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
    function page(){ cur = { ops: [], imgs: [] }; pages.push(cur); y = H - M; }
    function text(s, size, bold){ size = size || 10; var max = Math.floor((W - 2 * M) / (size * 0.5)), words = ascii(s).split(' '), line = '';
      function emit(l){ if (y < M + size) page(); cur.ops.push('BT /' + (bold ? 'F2' : 'F1') + ' ' + size + ' Tf ' + M + ' ' + y.toFixed(1) + ' Td (' + pe(l) + ') Tj ET'); y -= size * 1.35; }
      words.forEach(function(w){ while (w.length > max) { if (line) { emit(line); line = ''; } emit(w.slice(0, max)); w = w.slice(max); } if ((line + ' ' + w).trim().length > max) { emit(line); line = w; } else line = (line ? line + ' ' : '') + w; });
      if (line) emit(line); }
    function image(e){ var bw = Math.min(W - 2 * M, 360), bh = bw * e.h / e.w; if (bh > 300) { bh = 300; bw = bh * e.w / e.h; } if (y - bh < M) page(); var id = 'Im' + images.length; images.push(e); cur.imgs.push(id); y -= bh; cur.ops.push('q ' + bw.toFixed(1) + ' 0 0 ' + bh.toFixed(1) + ' ' + M + ' ' + y.toFixed(1) + ' cm /' + id + ' Do Q'); y -= 8; }
    page();
    text('Kolaboro site visit record', 18, true); y -= 4;
    text('Visit ' + out.visit.id + (out.visit.project ? ' - project ' + out.visit.project : '') + (out.visit.place ? ' - ' + out.visit.place : ''), 10);
    text('Stage: ' + out.visit.milestone + '. Started ' + out.visit.created + '. Exported ' + out.exported + '.', 10);
    text(out.count + ' entries. Head fingerprint (SHA-256): ' + out.head, 9);
    text('Signed with ' + (out.signature.type === 'passkey' ? 'a passkey (WebAuthn, user verified, rp kolaboro.com)' : 'a P-256 key made on the device, key id ' + out.signature.key_id) + '. Signature: ' + out.signature.signature, 8);
    text('This PDF is the readable copy. The JSON file exported with it carries the photos and everything needed to check the chain and the signature at kolaboro.com/visit/. Times are from the phone clock and positions from its GPS.', 9);
    y -= 6;
    L.forEach(function(e){
      var k = { check: 'Tick', photo: 'Photo', note: 'Note', export: 'Signed' }[e.kind] || e.kind;
      text('#' + e.n + '  ' + e.at.replace('T', ' ').slice(0, 19) + ' UTC  ' + k + (e.step ? ' ' + e.step : '') + (e.value ? ': ' + { ok: 'seen, OK', issue: 'PROBLEM', na: 'could not see' }[e.value] : '') + (e.lat != null ? '  GPS ' + e.lat + ', ' + e.lng + ' +/-' + e.acc + ' m' : '  no GPS'), 9, true);
      if (e.text) text(e.text, 9);
      if (e.photo_sha256) text('Photo SHA-256 ' + e.photo_sha256, 7);
      text('Entry fingerprint ' + e.hash, 7);
      if (e.photo && e.w && e.h) image(e);
      y -= 4;
    });
    return Promise.all(images.map(function(e){ return e.photo.arrayBuffer(); })).then(function(bufs){
      var parts = [], off = 0, xref = [], n = 0;
      function w(s){ parts.push(s); off += typeof s === 'string' ? s.length : s.byteLength; }
      function obj(body){ n++; xref[n] = off; w(n + ' 0 obj\n'); body(); w('\nendobj\n'); }
      w('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'.replace(/[^\x00-\x7F]/g, 'x'));
      var font1 = 1, font2 = 2, pagesId = 3, firstImg = 4, firstPage = 4 + images.length;
      obj(function(){ w('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'); });
      obj(function(){ w('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'); });
      obj(function(){ w('<< /Type /Pages /Count ' + pages.length + ' /Kids [' + pages.map(function(p, i){ return (firstPage + i * 2) + ' 0 R'; }).join(' ') + '] >>'); });
      images.forEach(function(e, i){ obj(function(){ w('<< /Type /XObject /Subtype /Image /Width ' + e.w + ' /Height ' + e.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + bufs[i].byteLength + ' >>\nstream\n'); w(new Uint8Array(bufs[i])); w('\nendstream'); }); });
      pages.forEach(function(p, i){
        var content = p.ops.join('\n');
        obj(function(){ w('<< /Type /Page /Parent ' + pagesId + ' 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << /Font << /F1 ' + font1 + ' 0 R /F2 ' + font2 + ' 0 R >> /XObject << ' + p.imgs.map(function(id){ return '/' + id + ' ' + (firstImg + +id.slice(2)) + ' 0 R'; }).join(' ') + ' >> >> /Contents ' + (n + 1) + ' 0 R >>'); });
        obj(function(){ w('<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream'); });
      });
      obj(function(){ w('<< /Type /Catalog /Pages ' + pagesId + ' 0 R >>'); });
      var cat = n, xo = off;
      w('xref\n0 ' + (n + 1) + '\n0000000000 65535 f \n'); for (var i = 1; i <= n; i++) w(('000000000' + xref[i]).slice(-10) + ' 00000 n \n');
      w('trailer\n<< /Size ' + (n + 1) + ' /Root ' + cat + ' 0 R /Info << /Producer (kolaboro.com/visit) /Title (Kolaboro site visit ' + pe(out.visit.id) + ') >> >>\nstartxref\n' + xo + '\n%%EOF\n');
      return new Blob(parts.map(function(s){ return typeof s === 'string' ? te.encode(s) : s; }), { type: 'application/pdf' });
    });
  }

  // ---------- verify an export (offline)
  function derToRaw(der, len){ if (der[0] !== 0x30 || der[2] !== 0x02) throw new Error('signature is not DER'); var o = 2; if (der[1] & 0x80) o += der[1] & 0x7f; function rd(){ o++; var l = der[o++], v = der.slice(o, o + l); o += l; while (v.length > len && v[0] === 0) v = v.slice(1); var r = new Uint8Array(len); r.set(v, len - v.length); return r; } var r = rd(), s = rd(), out = new Uint8Array(2 * len); out.set(r, 0); out.set(s, len); return out; }
  function verifySig(s, msg){
    if (s.signed !== msg) return Promise.resolve({ ok: false, why: 'the signature covers a different head or count' });
    if (s.type === 'device-p256') return crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: s.public_key_jwk.x, y: s.public_key_jwk.y, ext: true }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
      .then(function(k){ return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, k, unb64(s.signature), te.encode(msg)); }).then(function(ok){ return { ok: ok, why: ok ? 'device key ' + s.key_id : 'signature does not verify' }; });
    if (s.type !== 'passkey') return Promise.resolve({ ok: false, why: 'unknown signature type' });
    var ad = unb64(s.authenticator_data), cj = unb64(s.client_data_json), cd;
    try { cd = JSON.parse(new TextDecoder().decode(cj)); } catch (e) { return Promise.resolve({ ok: false, why: 'malformed' }); }
    return Promise.all([crypto.subtle.digest('SHA-256', te.encode(msg)), crypto.subtle.digest('SHA-256', te.encode('kolaboro.com')), crypto.subtle.digest('SHA-256', cj)]).then(function(h){
      if (cd.type !== 'webauthn.get' || cd.challenge !== b64u(h[0])) return { ok: false, why: 'challenge does not match' };
      if (cd.origin !== 'https://kolaboro.com') return { ok: false, why: 'wrong origin' };
      if (hex(ad.slice(0, 32)) !== hex(h[1])) return { ok: false, why: 'wrong relying party' };
      if (!(ad[32] & 1) || !(ad[32] & 4)) return { ok: false, why: 'user not verified' };
      var signed = new Uint8Array(ad.length + 32); signed.set(ad, 0); signed.set(new Uint8Array(h[2]), ad.length);
      var spki = unb64(s.spki), sig = unb64(s.signature), p;
      if (s.alg === -7) p = crypto.subtle.importKey('spki', spki, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']).then(function(k){ return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, k, derToRaw(sig, 32), signed); }).catch(function(){ return false; });
      else if (s.alg === -8) p = crypto.subtle.importKey('spki', spki, { name: 'Ed25519' }, false, ['verify']).then(function(k){ return crypto.subtle.verify({ name: 'Ed25519' }, k, sig, signed); });
      else if (s.alg === -257) p = crypto.subtle.importKey('spki', spki, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']).then(function(k){ return crypto.subtle.verify('RSASSA-PKCS1-v1_5', k, sig, signed); });
      else return { ok: false, why: 'unknown algorithm' };
      return p.then(function(ok){ return { ok: ok, why: ok ? 'passkey, user verified' : 'signature does not verify' }; });
    });
  }
  function verifyExport(d){
    if (!d || d.format !== 'kolaboro-visit-v1' || !d.visit || !Array.isArray(d.entries)) return Promise.resolve({ html: '<p class="no">Not a Kolaboro visit export.</p>' });
    var photoChecks = d.entries.filter(function(e){ return e.photo_jpeg_b64; }).map(function(e){ return sha(unb64(e.photo_jpeg_b64)).then(function(h){ return h === e.photo_sha256; }); });
    return Promise.all([verifyChain(d.visit, d.entries), Promise.all(photoChecks)]).then(function(r){
      var c = r[0], ph = r[1], pOk = ph.every(Boolean);
      var headOk = c.ok && c.head === d.head && c.n === d.count;
      return verifySig(d.signature || {}, message(d.head, d.count)).then(function(s){
        var good = headOk && pOk && s.ok;
        return { html: '<p><span class="pill ' + (good ? 'g' : 'r') + '">' + (good ? 'Verified' : 'Does not verify') + '</span></p><ul style="padding-left:1.2em">' +
          '<li class="' + (c.ok ? 'ok' : 'no') + '">Chain of ' + c.n + ' entries: ' + (c.ok ? 'every fingerprint recomputed and linked' : 'broken at entry ' + c.bad.n + ' (' + esc(c.bad.why) + ')') + '</li>' +
          '<li class="' + (headOk ? 'ok' : 'no') + '">Head ' + esc(short(d.head)) + (headOk ? ' matches' : ' does not match the entries') + '</li>' +
          '<li class="' + (pOk ? 'ok' : 'no') + '">' + ph.length + ' photo' + (ph.length === 1 ? '' : 's') + ': ' + (pOk ? 'each matches its fingerprint' : ph.filter(function(x){ return !x; }).length + ' changed') + '</li>' +
          '<li class="' + (s.ok ? 'ok' : 'no') + '">Signature: ' + esc(s.why) + '</li></ul><p class="mut">Visit ' + esc(d.visit.id) + (d.visit.project ? ', project ' + esc(d.visit.project) : '') + ', started ' + esc(d.visit.created) + '. Times and positions come from the phone that made it.</p>', ok: good };
      });
    });
  }
  $('vf').onchange = function(){
    var f = this.files[0]; if (!f) return; $('vo').innerHTML = '<p class="mut">Checking…</p>';
    f.text().then(function(t){ return verifyExport(JSON.parse(t)); }).then(function(r){ $('vo').innerHTML = r.html; $('vo').dataset.ok = r.ok ? '1' : '0'; }).catch(function(){ $('vo').innerHTML = '<p class="no">Could not read this file as a visit export.</p>'; });
  };

  // ---------- start
  fetch('/visit/checklist.json?v=131e7cbf4f').then(function(r){ return r.json(); }).then(function(c){ CL = c; var id = location.hash.slice(1); if (/^v_[0-9a-f]{16}$/.test(id)) open(id); else home(); })
    .catch(function(){ $('app').innerHTML = '<div class="card"><p class="no">The checklist could not load. Open this page once with signal so it can work offline.</p></div>'; });
  window.KBVisit = { verifyExport: verifyExport, verifyChain: verifyChain };
})();
