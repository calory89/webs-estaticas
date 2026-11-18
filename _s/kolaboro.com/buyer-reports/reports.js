/* Kolaboro signed buyer reports (block T). The passkey signs SHA-256("kolaboro-report-v1\n" + SHA-256(canonical report)).
   The proof-of-purchase file is hashed here with WebCrypto and never leaves the device. API: /api/x/t/reports. */
(function(){
  var $ = function(i){ return document.getElementById(i); };
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function hex(b){ return Array.prototype.map.call(new Uint8Array(b), function(x){ return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function sha(t){ return crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)).then(hex); }
  function b64u(u){ var s = ''; new Uint8Array(u).forEach(function(x){ s += String.fromCharCode(x); }); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function b64(u){ var s = ''; new Uint8Array(u).forEach(function(x){ s += String.fromCharCode(x); }); return btoa(s); }
  function unb64u(x){ x = x.replace(/-/g, '+').replace(/_/g, '/'); while (x.length % 4) x += '='; var s = atob(x), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
  var PID = /^[A-Z]{2,5}-\d{3,4}$/, OPEN = false, DOC = null, PROJ = {};
  var KIND = { delay: 'Delay', payment: 'Payment problem', quality: 'Build quality', good: 'Good experience', other: 'Something else' };
  var PKS = !!(window.PublicKeyCredential && navigator.credentials && window.crypto && crypto.subtle);
  function store(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  // ---------- status
  fetch('/api/x/t/status').then(function(r){ return r.json(); }).then(function(s){
    OPEN = !!(s.reports && s.reports.open);
    $('rs').innerHTML = OPEN
      ? '<p style="margin:0"><span class="pill g">Open</span> ' + s.reports.approved + ' report' + (s.reports.approved === 1 ? '' : 's') + ' published, ' + s.reports.pending + ' waiting for a moderator.</p>'
      : '<p style="margin:0"><span class="pill o">Opens soon</span> The report database is being switched on. You can fill in the form and compute your document fingerprint now; sending opens shortly. Nothing is stored until then.</p>';
    if (!PKS) $('rs').insertAdjacentHTML('beforeend', '<p class="no" style="margin:8px 0 0">This browser cannot create passkeys, so it cannot sign a report. Use a recent Chrome, Safari, Edge or Firefox.</p>');
    check();
  }).catch(function(){ $('rs').innerHTML = '<p class="mut" style="margin:0">Could not reach the server.</p>'; });

  // ---------- form
  var q = new URLSearchParams(location.search), pre = (q.get('id') || q.get('project') || '').toUpperCase();
  if (PID.test(pre)) $('rp').value = pre;
  function check(){
    var p = $('rp').value.trim().toUpperCase(), t = $('rt').value.trim();
    $('rtn').textContent = t.length;
    $('rb').disabled = !(OPEN && PKS && PID.test(p) && PROJ[p] && t.length >= 30 && t.length <= 2000 && DOC);
    var miss = []; if (!PID.test(p) || !PROJ[p]) miss.push('a tracked project id'); if (t.length < 30) miss.push('at least 30 characters in your report (' + (30 - t.length) + ' more)'); if (!DOC) miss.push('the fingerprint of your proof of purchase (pick the file)');
    var mh = $('rmiss'); if (!mh) { mh = document.createElement('p'); mh.id = 'rmiss'; mh.className = 'mut'; mh.style.margin = '8px 0 0'; $('rb').insertAdjacentElement('afterend', mh); $('rb').setAttribute('aria-describedby', 'rmiss'); }
    mh.textContent = !OPEN ? 'Sending opens when the report database is switched on.' : !PKS ? 'This browser cannot sign with a passkey.' : miss.length ? 'To send, add: ' + miss.join('; ') + '.' : '';
  }
  function lookup(){
    var p = $('rp').value.trim().toUpperCase(), n = $('rpn');
    if (!PID.test(p)) { n.textContent = p ? 'Format: letters, a dash, 3 or 4 digits.' : ''; check(); return; }
    if (PROJ[p]) { n.textContent = PROJ[p]; check(); return; }
    n.textContent = 'Checking…';
    fetch('/api/open/projects/' + encodeURIComponent(p)).then(function(r){ return r.ok ? r.json() : null; }).then(function(d){
      if ($('rp').value.trim().toUpperCase() !== p) return;
      if (!d || !d.project) { n.textContent = 'Not a tracked project. Check the id on its page.'; PROJ[p] = null; }
      else { PROJ[p] = 'Tracked: ' + [d.project.market, d.project.region, d.project.stage].filter(Boolean).join(', '); n.textContent = PROJ[p]; }
      check();
    }).catch(function(){ n.textContent = 'Could not check.'; });
  }
  $('rp').addEventListener('input', lookup); if ($('rp').value) lookup();
  $('rt').addEventListener('input', check);
  $('rfile').addEventListener('change', function(){
    var f = this.files[0]; DOC = null; check(); if (!f) { $('rh').textContent = ''; return; }
    if (f.size > 200 * 1048576) { $('rh').textContent = 'File over 200 MB: pick the contract PDF itself.'; return; }
    $('rh').textContent = 'Computing the fingerprint on this device…';
    f.arrayBuffer().then(function(b){ return crypto.subtle.digest('SHA-256', b); }).then(function(h){
      DOC = hex(h); $('rh').innerHTML = 'SHA-256 of <b>' + esc(f.name) + '</b> (' + Math.round(f.size / 1024) + ' KB), computed here, file not uploaded:<br>' + DOC; check();
    }).catch(function(){ $('rh').textContent = 'Could not read the file.'; });
  });

  function canon(r){ return JSON.stringify(['kolaboro-report-v1', r.project, r.kind, r.text, r.delay_months, r.purchased, r.doc_sha256, r.doc_kind]); }
  function passkey(){   // reuse this browser's report passkey, or create one
    var saved = null; try { saved = JSON.parse(store('kb-report-pk') || 'null'); } catch (e) {}
    if (saved && saved.id && saved.spki) return Promise.resolve(saved);
    var uid = new Uint8Array(16); crypto.getRandomValues(uid);
    return navigator.credentials.create({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), rp: { id: 'kolaboro.com', name: 'Kolaboro' },
      user: { id: uid, name: 'Kolaboro buyer report', displayName: 'Kolaboro buyer report' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -8 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { userVerification: 'required', residentKey: 'discouraged' }, attestation: 'none', timeout: 90000 } }).then(function(c){
        var r = c.response; if (!r.getPublicKey) throw new Error('this browser cannot export the passkey public key; update it and try again');
        var k = { id: c.id, spki: b64(r.getPublicKey()), alg: r.getPublicKeyAlgorithm() }; store('kb-report-pk', JSON.stringify(k)); return k;
      });
  }
  $('rf').addEventListener('submit', function(e){
    e.preventDefault(); if ($('rb').disabled) return;
    var o = $('ro'), d = $('rd').value, m = $('rm').value;
    var r = { project: $('rp').value.trim().toUpperCase(), kind: $('rk').value, text: $('rt').value.trim(), delay_months: d === '' ? null : Math.max(0, Math.min(240, parseInt(d, 10) || 0)),
      purchased: /^20\d{2}-(0[1-9]|1[0-2])$/.test(m) ? m : null, doc_sha256: DOC, doc_kind: $('rdk').value };
    $('rb').disabled = true; o.className = ''; o.textContent = 'Your device will ask for Face ID, a fingerprint or your screen lock…';
    var key, bodySha;
    sha(canon(r)).then(function(h){ bodySha = h; return passkey(); }).then(function(k){
      key = k; return crypto.subtle.digest('SHA-256', new TextEncoder().encode('kolaboro-report-v1\n' + bodySha));
    }).then(function(ch){
      return navigator.credentials.get({ publicKey: { challenge: ch, rpId: 'kolaboro.com', allowCredentials: [{ type: 'public-key', id: unb64u(key.id) }], userVerification: 'required', timeout: 90000 } });
    }).then(function(a){
      var s = a.response;
      r.passkey = { cred_id: a.id, spki: key.spki, alg: key.alg, authenticator_data: b64u(s.authenticatorData), client_data_json: b64u(s.clientDataJSON), signature: b64u(s.signature) };
      r.website = $('rhp').value;
      o.textContent = 'Signature made on this device. Sending…';
      return fetch('/api/x/t/reports', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(r) }).then(function(x){ return x.json(); });
    }).then(function(j){
      if (j.ok) {
        o.className = 'rok';
        o.innerHTML = '<b>Report ' + j.ref + ' received and signature verified.</b> It is waiting for a moderator; nothing is public yet.<br>Report fingerprint <span class="hash">' + esc(j.body_sha256) + '</span><br>Passkey fingerprint ' + esc(j.key_fingerprint) + '.<br>' + esc(j.email_proof);
        $('rt').value = ''; DOC = null; $('rfile').value = ''; $('rh').textContent = '';
      } else { o.className = 'rerr'; o.textContent = 'Not sent: ' + (j.detail || j.error); $('rb').disabled = false; }
      check();
    }).catch(function(err){
      o.className = 'rerr'; o.textContent = (err && err.name === 'NotAllowedError') ? 'The passkey request was cancelled or timed out. Nothing was sent.' : 'Not sent: ' + ((err && err.message) || err);
      $('rb').disabled = false; check();
    });
  });

  // ---------- published list
  function list(p){
    var box = $('rl'); box.innerHTML = '<p class="mut">Loading…</p>';
    fetch('/api/x/t/reports' + (p ? '?project=' + encodeURIComponent(p) : '')).then(function(r){ return r.json(); }).then(function(d){
      if (!d.open) { box.innerHTML = '<p class="mut">No reports yet: buyer reports open soon.</p>'; return; }
      var L = d.reports || [];
      if (!L.length) { box.innerHTML = '<p class="mut">No approved reports' + (p ? ' for ' + esc(p) : '') + ' yet.' + (d.pending ? ' ' + d.pending + ' waiting for a moderator.' : '') + '</p>'; return; }
      box.innerHTML = '<p class="mut">' + L.length + ' approved report' + (L.length === 1 ? '' : 's') + (d.pending ? ', ' + d.pending + ' waiting for a moderator' : '') + '.</p>' + L.map(function(x){
        return '<article class="rp"><b><a href="/p/' + esc(x.project_id) + '">' + esc(x.project_id) + '</a></b> <span class="pill ' + (x.kind === 'good' ? 'g' : x.kind === 'other' ? '' : 'o') + '">' + esc(KIND[x.kind] || x.kind) + '</span>' +
          (x.delay_months ? ' <span class="pill">' + x.delay_months + ' months late</span>' : '') +
          '<p>' + esc(x.text) + '</p><small>Sent ' + esc(x.month) + (x.purchased_year ? ' · bought in ' + esc(x.purchased_year) : '') + ' · signed with a passkey · ' + esc(x.proof_of_purchase) + '</small>' +
          (x.note ? '<p class="mut"><b>Moderator:</b> ' + esc(x.note) + '</p>' : '') + '</article>';
      }).join('');
    }).catch(function(){ box.innerHTML = '<p class="mut">Could not load.</p>'; });
  }
  $('lf').addEventListener('submit', function(e){ e.preventDefault(); var p = $('lp').value.trim().toUpperCase(); list(PID.test(p) ? p : ''); });
  if (PID.test(pre)) $('lp').value = pre;
  list(PID.test(pre) ? pre : '');
})();
