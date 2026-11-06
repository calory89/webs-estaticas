/* kolaboro.com accounts and trust (batch 10, b10b, 6 Nov 2026). One file, four pages:
   /login   "Sign in with a passkey" next to the password (WebAuthn, discoverable credential; the worker checks the signature)
   /portal  "Sign-in and credentials" card: add or remove passkeys, and download each delivered report as a signed W3C VC
   /admin   optional two-factor sign-in (TOTP). The admin key alone works until the admin turns 2FA on; then key + 6-digit code.
            At enrolment the seed is shown once (QR + text) and a one-time recovery code is shown once.
   /verify  in-browser verifier for Kolaboro verifiable credentials (eddsa-jcs-2022, did:web), section #vc */
(function () {
  'use strict';
  var D = document, P = location.pathname.replace(/\/+$/, '') || '/';
  var SB = 'https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/';
  var AK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw';
  var te = new TextEncoder();
  function $(i) { return D.getElementById(i); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function el(tag, attrs, html) { var e = D.createElement(tag); for (var k in attrs || {}) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function store(k) { try { return sessionStorage.getItem(k) || localStorage.getItem(k); } catch (e) { return null; } }
  function post(path, body) {
    return fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) })
      .then(function (r) { return r.json().catch(function () { return { error: 'http_' + r.status }; }); }, function () { return { error: 'network', message: 'Could not reach the server. Check your connection.' }; });
  }
  function rpc(fn, body) {
    return fetch(SB + fn, { method: 'POST', headers: { apikey: AK, Authorization: 'Bearer ' + AK, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return { error: 'http_' + r.status }; }); }, function () { return { error: 'network' }; });
  }
  function u8(b) { return b instanceof Uint8Array ? b : new Uint8Array(b); }
  function b64(b) { var s = '', a = u8(b); for (var i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s); }
  function b64u(b) { return b64(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unb64u(s) { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var r = atob(s), o = new Uint8Array(r.length); for (var i = 0; i < r.length; i++) o[i] = r.charCodeAt(i); return o; }
  function hex(b) { return [].map.call(u8(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function unhex(h) { var o = new Uint8Array(h.length / 2); for (var i = 0; i < o.length; i++) o[i] = parseInt(h.substr(i * 2, 2), 16); return o; }
  var hasPK = !!(window.PublicKeyCredential && navigator.credentials && navigator.credentials.get);
  var CSS = '.kpk-or{display:flex;align-items:center;gap:10px;color:#5E6B76;font-size:.85rem;margin:14px 0 10px}.kpk-or:before,.kpk-or:after{content:"";flex:1;height:1px;background:#E3E2DD}' +
    '.kpk-b{width:100%;min-height:48px;border:1px solid #17212B;background:#fff;color:#17212B;border-radius:12px;font:inherit;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px}.kpk-b:hover{background:#F6F5F0}.kpk-b:focus-visible,.kac button:focus-visible,.k2f button:focus-visible{outline:3px solid #FF5B14;outline-offset:2px}.kpk-b svg{width:20px;height:20px}' +
    '.kac ul{list-style:none;padding:0;margin:8px 0}.kac li{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 10px;padding:10px 0;border-bottom:1px solid #ECEAE3}.kac li:last-child{border-bottom:0}.kac .kac-m{color:#5E6B76;font-size:.85rem}.kac h3{font-size:1rem;margin:16px 0 4px}' +
    '.k2f{background:#fff;border:1px solid #E2E0D8;border-radius:16px;padding:14px 16px;margin:12px 0}.k2f.warn{border-color:#F3C8A8;background:#FFF7F1}.k2f h3{margin:0 0 6px;font-size:1rem}.k2f p{margin:6px 0}.k2f input{min-height:44px;border:1px solid #D8D6CE;border-radius:10px;padding:0 12px;font:inherit;font-size:1.1rem;letter-spacing:.15em;width:9.5em;max-width:100%}' +
    '.k2f .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px}.k2f code,.kac code{word-break:break-all;background:#F2F1EC;border-radius:6px;padding:2px 6px}.k2f .rc{font:700 1.15rem/1.4 ui-monospace,Menlo,monospace;background:#17212B;color:#fff;border-radius:10px;padding:10px 12px;display:inline-block;word-break:break-all}' +
    '.k2f .qr{background:#fff;padding:8px;display:inline-block;border:1px solid #E2E0D8;border-radius:10px}.k2f .err{color:#B42318;min-height:1.2em}.k2f .ok{color:#0B7A55}' +
    '.kvc{border:1px solid #E2E0D8;border-radius:14px;padding:12px 14px;margin-top:10px;background:#fff}.kvc ol{margin:6px 0 0;padding-left:20px}.kvc li{margin:3px 0}.kvc .y{color:#0B7A55;font-weight:700}.kvc .n{color:#B42318;font-weight:700}.kvc pre{white-space:pre-wrap;word-break:break-all;font-size:.78rem;max-height:260px;overflow:auto;background:#F6F5F0;border-radius:10px;padding:8px}';
  D.head.appendChild(el('style', {}, CSS));
  var KEYSVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 12h9M18 12v3M21 12v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  // ------------------------------------------------------------------ passkeys: browser side of the WebAuthn ceremonies
  function pkLogin() {
    return post('/api/x/acct/pk/login/options', {}).then(function (o) {
      if (!o || !o.publicKey) throw new Error((o && o.message) || 'Passkey sign-in is not available right now.');
      var pk = o.publicKey;
      return navigator.credentials.get({ publicKey: { challenge: unb64u(pk.challenge), rpId: pk.rpId, userVerification: 'required', timeout: pk.timeout, allowCredentials: [] } }).then(function (c) {
        if (!c) throw new Error('No passkey was chosen.');
        var r = c.response;
        return post('/api/x/acct/pk/login', { chal: o.chal, id: b64u(c.rawId), client_data_json: b64u(r.clientDataJSON), authenticator_data: b64u(r.authenticatorData), signature: b64u(r.signature) });
      });
    });
  }
  function pkRegister(token, label) {
    return post('/api/x/acct/pk/reg/options', { token: token }).then(function (o) {
      if (!o || !o.publicKey) throw new Error((o && o.message) || 'Could not start. Sign in again and retry.');
      var pk = o.publicKey;
      var opts = { challenge: unb64u(pk.challenge), rp: pk.rp, user: { id: unb64u(pk.user.id), name: pk.user.name, displayName: pk.user.displayName }, pubKeyCredParams: pk.pubKeyCredParams,
        authenticatorSelection: pk.authenticatorSelection, attestation: 'none', timeout: pk.timeout, excludeCredentials: (pk.excludeCredentials || []).map(function (x) { return { type: 'public-key', id: unb64u(x.id) }; }) };
      return navigator.credentials.create({ publicKey: opts }).then(function (c) {
        var r = c.response;
        if (!r.getPublicKey || !r.getAuthenticatorData) throw new Error('This browser cannot add passkeys here yet. Update it, or use another browser.');
        var spki = r.getPublicKey(); if (!spki) throw new Error('This passkey type is not supported. Try your phone or another device.');
        return post('/api/x/acct/pk/reg', { token: token, chal: o.chal, id: b64u(c.rawId), client_data_json: b64u(r.clientDataJSON), authenticator_data: b64u(r.getAuthenticatorData()), spki: b64(spki), alg: r.getPublicKeyAlgorithm(), label: label });
      });
    });
  }
  function pkErr(e) { var m = e && (e.message || e.name) || 'Something went wrong.'; if (e && e.name === 'NotAllowedError') m = 'Cancelled, or no passkey for kolaboro.com on this device.'; if (e && e.name === 'InvalidStateError') m = 'This device already has a passkey for your account.'; return m; }

  // ------------------------------------------------------------------ /login
  if (P === '/login') {
    var lf = $('lf'); if (!lf || !hasPK) return;
    var NEXT = (function () { var n = new URLSearchParams(location.search).get('next') || ''; return /^\/(?!\/)[^\s\\]*$/.test(n) && n.length < 600 ? n : ''; })();
    var box = el('div', { id: 'kpk' }, '<div class="kpk-or">or</div><button type="button" class="kpk-b" id="kpk-go">' + KEYSVG + 'Sign in with a passkey</button><p class="ap-small ap-muted" style="margin:6px 0 0">Face, fingerprint or device PIN. Add one in your portal after you sign in with your password.</p><p class="ap-err" id="kpk-e" role="alert"></p>');
    var le = $('le'); if (le && le.parentNode === lf) lf.insertBefore(box, le.nextSibling); else lf.appendChild(box);
    $('kpk-go').onclick = function () {
      var b = this, e = $('kpk-e'); b.disabled = true; e.textContent = ''; b.lastChild.textContent = 'Waiting for your passkey…';
      pkLogin().then(function (d) {
        if (d && d.token) {
          try { localStorage.removeItem('kb-token-as'); sessionStorage.removeItem('kb-token-as'); localStorage.setItem('kb-token', d.token); localStorage.setItem('kb-role', d.role || 'buyer'); } catch (x) {}
          try { if (window.gtag) gtag('event', 'login', { method: 'passkey' }); } catch (x) {}
          b.lastChild.textContent = 'Opening your portal…'; location.href = d.role === 'agent' ? '/agents/me' : (NEXT || '/portal'); return;
        }
        throw new Error((d && d.message) || 'Passkey sign-in failed.');
      }).catch(function (x) { e.textContent = pkErr(x); b.disabled = false; b.lastChild.textContent = 'Sign in with a passkey'; });
    };
    return;
  }

  // ------------------------------------------------------------------ /portal
  if (P === '/portal') {
    var app = $('app'); if (!app) return;
    var token = function () { return store('kb-token-as') || store('kb-token'); };
    var ME = null, PKS = null, busy = false;
    var card = el('section', { class: 'ap-card kac', id: 'kac' });
    function when(t) { if (!t) return 'never'; var d = new Date(t); return isNaN(d) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); }
    function draw() {
      var demo = ME && ME.user && ME.user.demo, admin = ME && ME.user && ME.user.admin_view;
      var reps = ((ME && ME.cases) || []).filter(function (c) { return c.report_url || c.verdict; });
      var h = '<h2>Sign-in and credentials</h2>';
      h += '<h3>Passkeys</h3><p class="ap-small ap-muted" style="margin:0">Sign in with your face, fingerprint or device PIN instead of typing your password. The key stays on your device; we only keep its public half.</p>';
      if (!hasPK) h += '<p class="ap-small">This browser does not support passkeys.</p>';
      else if (PKS === null) h += '<p class="ap-small ap-muted">Loading…</p>';
      else {
        h += PKS.length ? '<ul>' + PKS.map(function (k) { return '<li><span><b>' + esc(k.label) + '</b><br><span class="kac-m">Added ' + esc(when(k.created_at)) + ' · last used ' + esc(when(k.last_used)) + '</span></span><button type="button" class="ap-chip" data-pkdel="' + esc(k.id) + '">Remove</button></li>'; }).join('') + '</ul>' : '<p class="ap-small">No passkey yet.</p>';
        h += admin ? '<p class="ap-small ap-muted">Not available in admin view.</p>' : '<button type="button" class="ap-chip" id="kac-add" style="background:#17212B">' + 'Add a passkey' + '</button>';
      }
      h += '<p class="ap-small" id="kac-e" role="status" style="min-height:1.2em"></p>';
      h += '<h3>Signed credentials</h3><p class="ap-small ap-muted" style="margin:0">Each delivered report can be downloaded as a W3C Verifiable Credential signed by Kolaboro (issuer <code>did:web:kolaboro.com</code>). Banks, lawyers or anyone you send it to can check it at <a href="/verify/#vc">kolaboro.com/verify</a> or with any VC tool.</p>';
      h += reps.length ? '<ul>' + reps.map(function (c) { return '<li><span><b>' + esc(c.project_name || c.code) + '</b><br><span class="kac-m">' + esc(c.code) + (c.verdict ? ' · verdict: ' + esc(c.verdict) : '') + '</span></span><button type="button" class="ap-chip" data-vc="' + esc(c.id) + '">Download credential</button></li>'; }).join('') + '</ul>' : '<p class="ap-small">No delivered report yet. When we publish your report, its credential appears here.</p>';
      if (demo) h += '<p class="ap-small ap-muted">Demo account: the credential is real and signed, and marked as demo.</p>';
      card.innerHTML = h;
    }
    function msg(t, ok) { var e = $('kac-e'); if (e) { e.textContent = t || ''; e.style.color = ok ? '#0B7A55' : '#B42318'; } }
    function loadPk() { if (!hasPK) { draw(); return; } post('/api/x/acct/pk/list', { token: token() }).then(function (d) { PKS = (d && d.passkeys) || []; draw(); }); }
    function place() {
      var anchor = $('mydata'); if (!anchor || anchor.nextSibling === card) return;
      anchor.parentNode.insertBefore(card, anchor.nextSibling);
      if (!ME) { ME = {}; rpc('kolaboro_portal', { p_token: token() }).then(function (d) { ME = d && d.user ? d : {}; draw(); loadPk(); }); } else draw();
    }
    card.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t || busy) return;
      if (t.id === 'kac-add') {
        var label = (navigator.userAgent.match(/iPhone|iPad|Android|Mac|Windows|Linux|CrOS/) || ['This device'])[0];
        label = { Mac: 'Mac', Windows: 'Windows PC', Linux: 'Linux', CrOS: 'Chromebook' }[label] || label;
        busy = true; t.disabled = true; msg('Follow your device prompt…', true);
        pkRegister(token(), label + ' passkey').then(function (d) { busy = false; if (d && d.ok) { msg('Passkey added. Next time, choose "Sign in with a passkey".', true); loadPk(); } else { msg((d && d.message) || 'Could not add the passkey.'); t.disabled = false; } })
          .catch(function (x) { busy = false; t.disabled = false; msg(pkErr(x)); });
      } else if (t.dataset.pkdel) {
        if (!confirm('Remove this passkey? You can still sign in with your password.')) return;
        busy = true; post('/api/x/acct/pk/delete', { token: token(), id: t.dataset.pkdel }).then(function (d) { busy = false; if (d && d.ok) { msg('Passkey removed.', true); loadPk(); } else msg((d && d.message) || 'Could not remove it.'); });
      } else if (t.dataset.vc) {
        busy = true; t.disabled = true; var lbl = t.textContent; t.textContent = 'Signing…';
        post('/api/x/acct/vc/report', { token: token(), case_id: t.dataset.vc }).then(function (vc) {
          busy = false; t.disabled = false; t.textContent = lbl;
          if (!vc || !vc.proof) { msg((vc && vc.message) || 'Could not issue the credential.'); return; }
          var blob = new Blob([JSON.stringify(vc, null, 2)], { type: 'application/json' }), a = el('a', { href: URL.createObjectURL(blob), download: 'kolaboro-report-' + ((vc.credentialSubject && vc.credentialSubject.caseCode) || 'case') + '.vc.json' });
          D.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
          msg('Downloaded. Check it any time at kolaboro.com/verify.', true);
        });
      }
    });
    new MutationObserver(function () { place(); }).observe(app, { childList: true, subtree: true });
    place();
    return;
  }

  // ------------------------------------------------------------------ /admin: optional TOTP two-factor
  if (P === '/admin') {
    var lfa = $('lf'), pw = $('pw'); if (!lfa || !pw) return;
    var PASS = false, AUTH_KEY = '';
    function adm(key, action, payload) { return rpc('kolaboro_admin_2fa', { p_key: key, p_action: action, p_payload: payload || {} }); }
    var step = el('div', { class: 'k2f', id: 'k2f-login', hidden: '' }, '<h3>Two-factor code</h3><p>Open your authenticator app and type the 6-digit code for <b>Kolaboro admin</b>.</p>' +
      '<div class="row"><input id="k2f-code" inputmode="numeric" autocomplete="one-time-code" maxlength="7" pattern="[0-9 ]*" aria-label="6-digit code" aria-describedby="k2f-err"><button type="button" class="btn" id="k2f-go">Verify</button></div>' +
      '<p class="err" id="k2f-err" role="alert"></p><details><summary>Lost your phone?</summary><p>Enter the recovery code you saved when you turned on two-factor. It turns two-factor off; the admin key alone works again and you can enrol a new phone.</p><div class="row"><input id="k2f-rc" style="width:16em;letter-spacing:0;font-size:1rem" autocomplete="off" aria-label="Recovery code" placeholder="KBRC-XXXXX-XXXXX-XXXXX-XXXXX"><button type="button" id="k2f-rcgo">Use recovery code</button></div></details>');
    lfa.parentNode.insertBefore(step, lfa.nextSibling);
    function finish(tok) { PASS = true; step.hidden = true; lfa.hidden = false; pw.value = tok; if (lfa.requestSubmit) lfa.requestSubmit(); else lfa.dispatchEvent(new Event('submit', { cancelable: true })); }
    D.addEventListener('submit', function (e) {
      if (e.target !== lfa) return;
      if (PASS) { PASS = false; return; }
      var k = pw.value.trim(); if (!k || /^kbas_/.test(k)) return;
      e.preventDefault(); e.stopImmediatePropagation();
      var go = $('lgo'); if (go) { go.disabled = true; go.textContent = 'Checking the key…'; }
      adm(k, 'status').then(function (s) {
        if (go) { go.disabled = false; go.textContent = 'Open dashboard'; }
        if (s && s.enrolled) { AUTH_KEY = k; lfa.hidden = true; step.hidden = false; $('k2f-err').textContent = ''; $('k2f-code').value = ''; $('k2f-code').focus(); return; }
        PASS = true; if (lfa.requestSubmit) lfa.requestSubmit(); else lfa.dispatchEvent(new Event('submit', { cancelable: true }));   // not enrolled (or wrong key): the normal flow handles it
      });
    }, true);
    function codeGo() {
      var c = $('k2f-code').value.replace(/\D/g, ''), er = $('k2f-err'), rem = $('rem');
      if (c.length !== 6) { er.textContent = 'Type the 6 digits from the app.'; return; }
      $('k2f-go').disabled = true; er.textContent = '';
      adm(AUTH_KEY, 'login', { code: c, remember: !!(rem && rem.checked), label: navigator.platform || '' }).then(function (d) {
        $('k2f-go').disabled = false;
        if (d && d.token) { AUTH_KEY = ''; finish(d.token); return; }
        er.textContent = d && d.error === 'locked' ? 'Too many wrong codes. Try again in ' + Math.ceil((d.retry_after_s || 900) / 60) + ' min.' : d && d.error === 'code' ? 'That code did not match (codes change every 30 s and each works once). Check the time on your phone.' : 'Could not check the code. Try again.';
      });
    }
    $('k2f-go').onclick = codeGo; $('k2f-code').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); codeGo(); } });
    $('k2f-rcgo').onclick = function () {
      var er = $('k2f-err'); adm(AUTH_KEY, 'recover', { recovery_code: $('k2f-rc').value }).then(function (d) {
        if (d && d.ok) { er.className = 'ok'; er.textContent = 'Two-factor is off. Opening the dashboard with the key…'; pw.value = AUTH_KEY; setTimeout(function () { er.className = 'err'; finish(AUTH_KEY); }, 600); return; }
        er.textContent = d && d.error === 'locked' ? 'Too many attempts. Try again in 15 min.' : 'That recovery code is not right.';
      });
    };
    // banner inside the dashboard
    var ban = el('div', { class: 'k2f', id: 'k2f-ban', hidden: '' });
    function key() { return window.KBADM && window.KBADM.pw ? window.KBADM.pw() : ''; }
    function b32(bytes) { var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567', bits = 0, v = 0, o = ''; for (var i = 0; i < bytes.length; i++) { v = (v << 8) | bytes[i]; bits += 8; while (bits >= 5) { o += A[(v >>> (bits - 5)) & 31]; bits -= 5; } } if (bits > 0) o += A[(v << (5 - bits)) & 31]; return o; }
    function qrLib() { if (window.QRCode) return Promise.resolve(window.QRCode); return new Promise(function (ok, no) { var s = D.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'; s.integrity = 'sha384-3zSEDfvllQohrq0PHL1fOXJuC/jSOO34H46t6UQfobFOmxE5BpjjaIJY5F2/bMnU'; s.crossOrigin = 'anonymous'; s.onload = function () { window.QRCode ? ok(window.QRCode) : no(); }; s.onerror = no; D.head.appendChild(s); setTimeout(no, 5000); }); }
    var ST = null;
    function drawBan() {
      if (!ST || ST.error) { ban.hidden = true; return; }
      ban.hidden = false;
      if (ST.enrolled) { ban.className = 'k2f'; ban.innerHTML = '<h3>Two-factor sign-in is on</h3><p class="kac-m">Since ' + esc(new Date(ST.enrolled_at).toLocaleString()) + ' · signed-in devices: ' + esc(ST.sessions) + '. Signing in needs the admin key and a code from your authenticator app.</p><div class="row"><button type="button" id="k2f-off">Turn two-factor off…</button></div><p class="err" id="k2f-be" role="status"></p>'; return; }
      ban.className = 'k2f warn';
      ban.innerHTML = '<h3>Enable two-factor sign-in</h3><p>Right now the admin key alone opens this dashboard. Add a second step: a 6-digit code from an authenticator app on your phone (Google Authenticator, Microsoft Authenticator, 1Password, Authy…).</p><div class="row"><button type="button" class="btn" id="k2f-start">Enable 2FA</button></div><div id="k2f-enrol"></div>';
    }
    function refresh() { var k = key(); if (!k) return; adm(k, 'status').then(function (s) { ST = s; drawBan(); }); }
    ban.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.id === 'k2f-start') {
        var box = $('k2f-enrol'); t.disabled = true; box.innerHTML = '<p>Preparing…</p>';
        adm(key(), 'enrol_start').then(function (d) {
          if (!d || !d.secret_hex) { t.disabled = false; box.innerHTML = '<p class="err">' + (d && d.error === 'key_needed' ? 'Sign out and sign in again with the admin key, then retry.' : 'Could not start enrolment.') + '</p>'; return; }
          var sec = b32(unhex(d.secret_hex)), uri = 'otpauth://totp/' + encodeURIComponent('Kolaboro:admin') + '?secret=' + sec + '&issuer=Kolaboro&algorithm=SHA1&digits=6&period=30';
          box.innerHTML = '<p><b>1.</b> Scan this QR code with your authenticator app. It is shown only now; if you leave, start again and a new one is made.</p><div class="qr" id="k2f-qr" aria-label="QR code for the authenticator app"></div>' +
            '<p class="kac-m">Cannot scan? Type this key in the app (time-based, 6 digits, 30 s): <code>' + esc(sec.replace(/(.{4})/g, '$1 ').trim()) + '</code></p>' +
            '<p><b>2.</b> Type the 6-digit code the app shows now.</p><div class="row"><input id="k2f-c1" inputmode="numeric" autocomplete="one-time-code" maxlength="7" aria-label="6-digit code from the app"><button type="button" class="btn" id="k2f-conf">Turn on 2FA</button></div><p class="err" id="k2f-ce" role="alert"></p>';
          qrLib().then(function (Q) { new Q($('k2f-qr'), { text: uri, width: 200, height: 200, correctLevel: Q.CorrectLevel.M }); }).catch(function () { $('k2f-qr').textContent = 'The QR library did not load; use the key below.'; });
          sec = null; d.secret_hex = null;
        });
      } else if (t.id === 'k2f-conf') {
        var c = $('k2f-c1').value.replace(/\D/g, ''), er = $('k2f-ce'), rem = $('rem');
        if (c.length !== 6) { er.textContent = 'Type the 6 digits from the app.'; return; }
        t.disabled = true;
        adm(key(), 'enrol_confirm', { code: c, remember: true, label: navigator.platform || '' }).then(function (d) {
          if (!d || !d.ok) { t.disabled = false; er.textContent = d && d.error === 'expired' ? 'This QR code expired (15 minutes). Reload and start again.' : 'That code did not match. Wait for the next code and try again.'; return; }
          // keep this device signed in with the new 2FA session, the same way the login form stores the key
          try { if (localStorage.getItem('kb-admin')) localStorage.setItem('kb-admin', JSON.stringify({ k: d.token, exp: Date.now() + 30 * 864e5 })); else sessionStorage.setItem('kb-admin-s', d.token); } catch (x) {}
          ban.className = 'k2f'; ban.innerHTML = '<h3>Two-factor sign-in is on</h3><p><b>Save this recovery code now.</b> It is shown only once. If you lose your phone, the admin key plus this code turns two-factor off.</p><p><span class="rc" id="k2f-rcv">' + esc(d.recovery_code) + '</span></p><div class="row"><button type="button" id="k2f-copy">Copy</button><button type="button" class="btn" id="k2f-done">I saved it, reload</button></div>';
          d.recovery_code = null;
        });
      } else if (t.id === 'k2f-copy') { try { navigator.clipboard.writeText($('k2f-rcv').textContent); t.textContent = 'Copied'; } catch (x) {} }
      else if (t.id === 'k2f-done') { location.reload(); }
      else if (t.id === 'k2f-off') {
        var code = prompt('Type a current 6-digit code from your authenticator app to turn two-factor off.'); if (!code) return;
        adm(key(), 'disable', { code: code }).then(function (d) {
          if (d && d.ok) { alert('Two-factor is off. Sign in again with the admin key.'); try { localStorage.removeItem('kb-admin'); sessionStorage.removeItem('kb-admin-s'); } catch (x) {} location.reload(); }
          else $('k2f-be').textContent = d && d.error === 'session_needed' ? 'Sign in with key and code first.' : 'That code did not match.';
        });
      }
    });
    D.addEventListener('kbadm', function () { var a = $('app'); if (a && !ban.parentNode) a.insertBefore(ban, a.firstChild); if (!ST) refresh(); });
    var lo = $('lo'); if (lo) lo.addEventListener('click', function () { var k = key(); if (/^kbas_/.test(k)) adm(k, 'logout'); }, true);
    return;
  }

  // ------------------------------------------------------------------ /verify: W3C verifiable credentials (eddsa-jcs-2022)
  if (P === '/verify') {
    var sec = $('vc'); if (!sec) return;
    var B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    function unb58(s) { var b = []; for (var i = 0; i < s.length; i++) { var c = B58.indexOf(s[i]); if (c < 0) throw new Error('not base58'); for (var j = 0; j < b.length; j++) { c += b[j] * 58; b[j] = c & 255; c >>= 8; } while (c) { b.push(c & 255); c >>= 8; } } var z = 0; while (z < s.length && s[z] === '1') z++; var o = new Uint8Array(z + b.length); o.set(b.reverse(), z); return o; }
    function jcs(v) { if (v === null || typeof v !== 'object') return JSON.stringify(v); if (Array.isArray(v)) return '[' + v.map(function (x) { return jcs(x === undefined ? null : x); }).join(',') + ']'; return '{' + Object.keys(v).filter(function (k) { return v[k] !== undefined; }).sort().map(function (k) { return JSON.stringify(k) + ':' + jcs(v[k]); }).join(',') + '}'; }
    function sha(s) { return crypto.subtle.digest('SHA-256', typeof s === 'string' ? te.encode(s) : s).then(u8); }
    function didUrl(did) { var m = /^did:web:([^:#?]+)((?::[^:#?]+)*)$/.exec(did); if (!m) return null; var host = decodeURIComponent(m[1]); return 'https://' + host + (m[2] ? m[2].split(':').map(decodeURIComponent).join('/') + '/did.json' : '/.well-known/did.json'); }
    var ta = $('vc-in'), outb = $('vc-o');
    function row(ok, t) { return '<li><span class="' + (ok ? 'y' : 'n') + '">' + (ok ? 'Yes' : 'No') + '</span> ' + t + '</li>'; }
    function verify(text) {
      var vc, steps = [];
      outb.innerHTML = '<div class="kvc">Checking in your browser…</div>';
      try { vc = JSON.parse(text); } catch (e) { outb.innerHTML = '<div class="kvc"><span class="n">Not valid JSON.</span> Paste the whole credential file.</div>'; return; }
      var p = vc && vc.proof, iss = vc && (typeof vc.issuer === 'string' ? vc.issuer : vc.issuer && vc.issuer.id);
      if (!p || p.type !== 'DataIntegrityProof' || p.cryptosuite !== 'eddsa-jcs-2022') { outb.innerHTML = '<div class="kvc"><span class="n">No eddsa-jcs-2022 proof found.</span> This checker reads Data Integrity proofs with the eddsa-jcs-2022 cryptosuite, the kind Kolaboro issues.</div>'; return; }
      var url = didUrl(iss || '');
      steps.push(row(!!url, 'Issuer is a did:web identifier: <code>' + esc(iss) + '</code>' + (iss === 'did:web:kolaboro.com' ? ' (Kolaboro)' : ' (<b>not Kolaboro</b>)')));
      if (!url) { outb.innerHTML = '<div class="kvc"><ol>' + steps.join('') + '</ol></div>'; return; }
      fetch(url, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (dd) {
        var vm = (dd.verificationMethod || []).filter(function (m) { return m.id === p.verificationMethod; })[0];
        var asr = (dd.assertionMethod || []).some(function (a) { return (typeof a === 'string' ? a : a.id) === p.verificationMethod; });
        steps.push(row(!!vm && asr && String(p.verificationMethod).indexOf(iss + '#') === 0, 'Key <code>' + esc(p.verificationMethod) + '</code> is published for assertions in <a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(url.replace('https://', '')) + '</a>'));
        if (!vm || !asr) throw new Error('key');
        var mk = unb58(String(vm.publicKeyMultibase || '').replace(/^z/, ''));
        if (mk[0] !== 0xed || mk[1] !== 0x01) throw new Error('not an Ed25519 key');
        var doc = Object.assign({}, vc); delete doc.proof; var cfg = Object.assign({}, p); delete cfg.proofValue;
        var ctxOk = jcs(cfg['@context']) === jcs(doc['@context']);
        steps.push(row(ctxOk, 'Proof and credential use the same @context'));
        return Promise.all([sha(jcs(cfg)), sha(jcs(doc))]).then(function (hs) {
          var data = new Uint8Array(64); data.set(hs[0], 0); data.set(hs[1], 32);
          return crypto.subtle.importKey('raw', mk.slice(2), { name: 'Ed25519' }, false, ['verify']).then(function (k) { return crypto.subtle.verify({ name: 'Ed25519' }, k, unb58(String(p.proofValue).replace(/^z/, '')), data); });
        }).then(function (ok) {
          steps.push(row(ok && ctxOk, 'Ed25519 signature over SHA-256(JCS(proof options)) followed by SHA-256(JCS(credential)) is valid'));
          var s = vc.credentialSubject || {}, now = Date.now(), vf = vc.validFrom ? Date.parse(vc.validFrom) : null, vu = vc.validUntil ? Date.parse(vc.validUntil) : null;
          if (vf) steps.push(row(vf <= now + 3e5, 'Valid from ' + esc(new Date(vf).toLocaleString())));
          if (vu) steps.push(row(vu > now, 'Valid until ' + esc(new Date(vu).toLocaleString())));
          var good = ok && ctxOk && iss === 'did:web:kolaboro.com';
          var sum = '<p style="margin:0 0 6px;font-size:1.05rem">' + (good ? '<span class="y">Genuine.</span> Kolaboro signed this credential and nothing in it was changed.' : ok && ctxOk ? '<span class="y">Signature valid</span>, but the issuer is not Kolaboro.' : '<span class="n">Not valid.</span> The credential was changed after signing, or was not signed with this key.') + '</p>';
          var extra = '';
          if (s.type === 'SealedRegisterLookup') extra = '<p class="kac-m">Sealed register lookup · root <code>' + esc(s.rootSha256) + '</code> · <a href="' + esc(s.id) + '" target="_blank" rel="noopener">sealed result</a>' + (s.timestamp ? ' · <a href="' + esc(s.timestamp) + '" target="_blank" rel="noopener">Bitcoin timestamp</a>' : '') + '</p>';
          if (s.type === 'DueDiligenceReport') extra = '<p class="kac-m">Due diligence report · case <b>' + esc(s.caseCode) + '</b>' + (s.verdict ? ' · verdict ' + esc(s.verdict) : '') + (s.demo ? ' · <b>demo account</b>' : '') + (s.reportUrl ? ' · <a href="' + esc(s.reportUrl) + '" target="_blank" rel="noopener">report</a>' : '') + '</p>' + (s.reportSha256 ? '<p class="kac-m" id="vc-rh">Report fingerprint at issue: <code>' + esc(s.reportSha256) + '</code></p>' : '');
          outb.innerHTML = '<div class="kvc">' + sum + extra + '<ol>' + steps.join('') + '</ol><details><summary>Credential</summary><pre>' + esc(JSON.stringify(vc, null, 2)) + '</pre></details></div>';
          if (s.type === 'DueDiligenceReport' && s.reportSha256 && s.reportUrl && s.reportUrl.indexOf(location.origin + '/') === 0) {
            fetch(s.reportUrl, { cache: 'no-store' }).then(function (r) { return r.arrayBuffer(); }).then(sha).then(function (h) { var e = $('vc-rh'); if (e) e.innerHTML += h === undefined ? '' : ' · today: ' + (hex(h) === s.reportSha256 ? '<span class="y">same file</span>' : '<span class="n">the published file has changed since</span>'); }).catch(function () {});
          }
        });
      }).catch(function (e) {
        var m = String(e && e.message || e);
        if (/Ed25519|NotSupported|Unrecognized|algorithm/i.test(m)) steps.push(row(false, 'This browser cannot check Ed25519 signatures yet. Use a current Chrome, Edge, Firefox or Safari, or POST the credential to <code>/api/x/acct/vc/verify</code>.'));
        else if (m !== 'key') steps.push(row(false, 'Could not finish: ' + esc(m.slice(0, 120))));
        outb.innerHTML = '<div class="kvc"><p style="margin:0 0 6px"><span class="n">Not verified.</span></p><ol>' + steps.join('') + '</ol></div>';
      });
    }
    $('vc-f').addEventListener('submit', function (e) { e.preventDefault(); if (ta.value.trim()) verify(ta.value.trim()); });
    $('vc-file').addEventListener('change', function () { var f = this.files[0]; if (!f) return; f.text().then(function (t) { ta.value = t; verify(t); }); });
    var src = new URLSearchParams(location.search).get('vc');
    if (src && /^\/api\/x\/acct\/vc\/lookup\/[0-9a-f]{64}$/.test(src)) {
      outb.innerHTML = '<div class="kvc">Fetching the credential…</div>';
      fetch(src).then(function (r) { return r.text(); }).then(function (t) {
        var j; try { j = JSON.parse(t); } catch (x) {}
        if (!j || !j.proof) { outb.innerHTML = '<div class="kvc"><span class="n">Not available.</span> ' + esc((j && j.note) || 'The sealed result is no longer in the cache.') + '</div>'; return; }
        ta.value = JSON.stringify(j, null, 2); verify(ta.value);
        var a = el('a', { href: URL.createObjectURL(new Blob([ta.value], { type: 'application/json' })), download: 'kolaboro-lookup-' + src.slice(-64, -52) + '.vc.json', class: 'btn', style: 'display:inline-block;margin-top:8px' }, 'Download this credential');
        $('vc-f').appendChild(a);
      });
      setTimeout(function () { sec.scrollIntoView({ block: 'start' }); }, 300);
    }
  }
})();
