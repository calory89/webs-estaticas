/*! Kolaboro "verified in your browser": checks the Ed25519 signature of a signed answer with WebCrypto and shows the result inline.
 *  The message signed is 'kolaboro-sig-v1\n' + SHA-256 hex of the exact body (headers x-kolaboro-signature, x-kolaboro-key-id),
 *  public keys at /.well-known/kolaboro-keys.json. Same check as KV.verifySignature in /open/kolaboro-verify.js.
 *
 *  KBVerify.fetchSigned(url[, init]) -> Promise<{ ok, status, text, json, headers, check: Promise<Result> }>
 *  KBVerify.verifyText(text, sigB64, kid) -> Promise<Result>
 *  KBVerify.badge(el, resultOrPromise[, { label }]) -> el   (el: any element; it becomes the badge)
 *  Result: { state: 'ok'|'bad'|'unsigned'|'unsupported'|'error', kid, sha256, ms, why }
 *  A failed or impossible check is shown as such, never as a green tick.
 */
(function () {
  if (window.KBVerify) return;
  var te = new TextEncoder(), C = window.crypto && window.crypto.subtle;
  // the key published on 2 Nov 2026; used if the key file cannot be fetched, and to notice if a key id is ever re-bound to other bytes
  var PIN = { 'kb-f2e04da5878f8c51': 'rnY6UvDI+L6e8j3a+UPwmddQJFapkfmEXWwHuXzdmzw=' };
  function b64(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  var keysP = null;
  function keys() {
    if (keysP) return keysP;
    keysP = fetch('/.well-known/kolaboro-keys.json', { credentials: 'omit' }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { var m = {}; (j.keys || []).forEach(function (k) { if (k.alg === 'Ed25519' && k.kid && k.public_key_raw_b64) m[k.kid] = k; }); return { m: m, src: 'published' }; })
      .catch(function () { var m = {}; Object.keys(PIN).forEach(function (k) { m[k] = { kid: k, public_key_raw_b64: PIN[k], status: 'active' }; }); return { m: m, src: 'pinned' }; });
    return keysP;
  }
  var supP = null;
  function supported() {
    if (supP) return supP;
    supP = !C ? Promise.resolve(false) : C.importKey('raw', b64(PIN['kb-f2e04da5878f8c51']), { name: 'Ed25519' }, false, ['verify']).then(function () { return true; }, function () { return false; });
    return supP;
  }
  function verifyText(text, sig, kid) {
    var t0 = performance.now(), res = { state: 'error', kid: kid || null, sha256: null, ms: null, why: '' };
    function done(state, why) { res.state = state; res.why = why || ''; res.ms = Math.round((performance.now() - t0) * 10) / 10; return res; }
    if (!sig) return Promise.resolve(done('unsigned', 'This answer carries no x-kolaboro-signature header.'));
    if (!C) return Promise.resolve(done('unsupported', 'WebCrypto is not available on this page.'));
    return C.digest('SHA-256', te.encode(text)).then(function (d) {
      res.sha256 = hex(d);
      return Promise.all([supported(), keys()]);
    }).then(function (a) {
      if (!a[0]) return done('unsupported', 'This browser cannot check Ed25519 signatures (needs Chrome 137+, Safari 17+ or Firefox 129+).');
      var k = a[1].m[kid];
      if (!k) return done('bad', 'Signed with key "' + kid + '", which is not in the published key list.');
      if (k.status === 'revoked') return done('bad', 'Key ' + kid + ' is marked revoked in the published key list.');
      if (PIN[kid] && PIN[kid] !== k.public_key_raw_b64) return done('bad', 'Key ' + kid + ' no longer matches the bytes pinned in this script.');
      return C.importKey('raw', b64(k.public_key_raw_b64), { name: 'Ed25519' }, false, ['verify'])
        .then(function (key) { return C.verify({ name: 'Ed25519' }, key, b64(sig), te.encode('kolaboro-sig-v1\n' + res.sha256)); })
        .then(function (ok) { return ok ? done('ok', 'Ed25519 signature over SHA-256 of the body checked with key ' + kid + (a[1].src === 'pinned' ? ' (pinned copy; key file unreachable)' : ' from /.well-known/kolaboro-keys.json') + '.') : done('bad', 'The signature does not match this body and key.'); });
    }).catch(function (e) { return done('error', 'The check could not run: ' + ((e && e.message) || 'unknown error') + '.'); });
  }
  function fetchSigned(url, init) {
    return fetch(url, init).then(function (r) {
      return r.text().then(function (text) {
        var j = null; try { j = JSON.parse(text); } catch (e) {}
        var sig = r.headers.get('x-kolaboro-signature'), kid = r.headers.get('x-kolaboro-key-id');
        return { ok: r.ok, status: r.status, text: text, json: j, headers: r.headers, check: r.status === 304 ? Promise.resolve({ state: 'error', why: 'Not modified (304): no body to check.' }) : verifyText(text, sig, kid) };
      });
    });
  }
  var CSS = '.kvb{display:inline-block;position:relative;vertical-align:middle;font:600 .78rem/1.2 Archivo,system-ui,sans-serif;letter-spacing:0;color:#17212B}' +
    '.kvb>summary{list-style:none;display:inline-flex;align-items:center;gap:6px;min-height:26px;padding:3px 10px 3px 8px;border-radius:99px;background:#EEF0F2;border:1px solid #C9D0D6;cursor:pointer;white-space:nowrap}' +
    '.kvb>summary::-webkit-details-marker{display:none}.kvb>summary:focus-visible{outline:3px solid #FF5B14;outline-offset:2px}' +
    '.kvb i{width:14px;height:14px;flex:none;border-radius:50%;background:#AEB6BE;position:relative}' +
    '.kvb-ok>summary{background:#DDEFE7;border-color:#9CD3BC;color:#075E41}.kvb-ok i{background:#0B7A55}.kvb-ok i::after{content:"";position:absolute;left:4.5px;top:2px;width:3.5px;height:7px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg)}' +
    '.kvb-bad>summary{background:#FDE6DC;border-color:#F3A887;color:#8F2D04}.kvb-bad i{background:#B83A05}.kvb-bad i::after{content:"!";position:absolute;inset:0;color:#fff;font:800 10px/14px Archivo,system-ui,sans-serif;text-align:center}' +
    '.kvb-wait i{background:none;border:2px solid #AEB6BE;border-top-color:transparent;animation:kvbspin .9s linear infinite;box-sizing:border-box}@keyframes kvbspin{to{transform:rotate(360deg)}}' +
    '@media (prefers-reduced-motion:reduce){.kvb-wait i{animation:none}}' +
    '.kvb-p{position:absolute;z-index:40;top:calc(100% + 6px);left:0;width:min(340px,calc(100vw - 32px));padding:12px 14px;border-radius:12px;background:#fff;color:#17212B;border:1px solid rgba(23,33,43,.16);box-shadow:0 12px 30px rgba(23,33,43,.18);font:500 .8rem/1.45 Archivo,system-ui,sans-serif;white-space:normal;text-align:left}' +
    '.kvb-p code{font:500 .72rem/1.4 ui-monospace,Menlo,monospace;word-break:break-all;background:#F2F3F1;padding:1px 4px;border-radius:4px}.kvb-p a{color:#B83A05;font-weight:700;display:inline-block;padding:12px 0 4px;min-height:44px;box-sizing:border-box}' +
    '.kvb-r .kvb-p{left:auto;right:0}';
  function css() { if (document.getElementById('kvb-css')) return; var s = document.createElement('style'); s.id = 'kvb-css'; s.textContent = CSS; document.head.appendChild(s); }
  var LBL = { ok: 'Verified in your browser', bad: 'Signature check failed', unsigned: 'Not signed', unsupported: 'Browser cannot check signature', error: 'Signature not checked', wait: 'Checking signature' };
  // Spanish pages: the badge and its explanation in Spanish (the reasons come from fixed English templates)
  var ES = /^es/.test(document.documentElement.lang || ''), S = ES ? { dl: 'Descargando la clave pública y comprobando la firma Ed25519 de ', inb: ' en este navegador.', body: 'SHA-256 del cuerpo:', chk: 'Comprobado en ', on: ' ms, sobre ', ns: ', sin enviarnos nada.', how: 'Cómo comprobarlo tú mismo', data: 'estos datos' } : null;
  if (ES) LBL = { ok: 'Verificado en tu navegador', bad: 'La firma no es válida', unsigned: 'Sin firma', unsupported: 'El navegador no puede comprobar la firma', error: 'Firma no comprobada', wait: 'Comprobando la firma' };
  function whyEs(w) { var m; w = String(w || '');
    if ((m = w.match(/^Ed25519 signature over SHA-256 of the body checked with key (\S+?)( \(pinned copy; key file unreachable\))? from \/\.well-known\/kolaboro-keys\.json\.$/)) || (m = w.match(/^Ed25519 signature over SHA-256 of the body checked with key (\S+?)( \(pinned copy; key file unreachable\))\.$/))) return 'Firma Ed25519 sobre el SHA-256 del cuerpo comprobada con la clave ' + m[1] + (m[2] ? ' (copia fijada; archivo de claves inaccesible).' : ' de /.well-known/kolaboro-keys.json.');
    if (/^This answer carries no x-kolaboro-signature header\.$/.test(w)) return 'Esta respuesta no lleva la cabecera x-kolaboro-signature.';
    if (/^WebCrypto is not available/.test(w)) return 'WebCrypto no está disponible en esta página.';
    if (/^This browser cannot check Ed25519/.test(w)) return 'Este navegador no puede comprobar firmas Ed25519 (necesita Chrome 137+, Safari 17+ o Firefox 129+).';
    if ((m = w.match(/^Signed with key "(.+)", which is not in the published key list\.$/))) return 'Firmado con la clave «' + m[1] + '», que no está en la lista de claves publicada.';
    if ((m = w.match(/^Key (\S+) is marked revoked/))) return 'La clave ' + m[1] + ' figura como revocada en la lista de claves publicada.';
    if ((m = w.match(/^Key (\S+) no longer matches/))) return 'La clave ' + m[1] + ' ya no coincide con los bytes fijados en este script.';
    if (/^Not modified \(304\)/.test(w)) return 'Sin cambios (304): no hay cuerpo que comprobar.';
    if ((m = w.match(/^The check could not run(?:: (.+))?\.$/))) return 'La comprobación no pudo ejecutarse' + (m[1] ? ': ' + m[1] : '') + '.';
    if (/did not match|does not match|not valid/i.test(w)) return 'La firma no coincide con el contenido recibido.';
    return w; }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function paint(el, r, o) {
    var st = r ? r.state : 'wait', what = (o && o.what) || (S ? S.data : 'this data');
    el.className = (el.className || '').replace(/\bkvb(-\w+)?\b/g, '').trim() + ' kvb kvb-' + st;
    var p = S ? (st === 'wait' ? S.dl + esc(what) + S.inb
      : '<b>' + esc(LBL[st]) + '.</b> ' + esc(whyEs(r.why)) + (r.sha256 ? '<br>' + S.body + ' <code>' + r.sha256.slice(0, 32) + '…</code>' : '') + (r.ms != null ? '<br>' + S.chk + (+r.ms).toLocaleString('es-ES') + S.on + esc(what) + S.ns : '') + '<br><a href="/verify/#sig">' + S.how + '</a>')
      : st === 'wait' ? 'Downloading the public key and checking the Ed25519 signature of ' + esc(what) + ' in this browser.'
      : '<b>' + esc(LBL[st]) + '.</b> ' + esc(r.why) + (r.sha256 ? '<br>Body SHA-256: <code>' + r.sha256.slice(0, 32) + '…</code>' : '') + (r.ms != null ? '<br>Checked in ' + r.ms + ' ms, on ' + esc(what) + ', nothing sent to us.' : '') + '<br><a href="/verify/#sig">How to check it yourself</a>';
    el.innerHTML = '<summary aria-label="' + esc(LBL[st] + ': ' + what) + '"><i aria-hidden="true"></i>' + esc((o && o.label && st === 'ok') ? o.label : LBL[st]) + '</summary><div class="kvb-p" role="note">' + p + '</div>';
    el.setAttribute('data-kvb-state', st);
  }
  function badge(el, r, o) {
    css();
    if (!el) return null;
    if (el.tagName !== 'DETAILS') { var d = document.createElement('details'); d.className = el.className; if (el.id) d.id = el.id; Array.prototype.forEach.call(el.attributes, function (a) { if (/^data-/.test(a.name)) d.setAttribute(a.name, a.value); }); el.parentNode.replaceChild(d, el); el = d; }
    var el0 = el; requestAnimationFrame(function () { var rect = el0.getBoundingClientRect(); if (rect.left > innerWidth / 2) el0.classList.add('kvb-r'); });   // n27u: measured in the next frame (reading it here forced a layout of the whole page)
    if (r && typeof r.then === 'function') { paint(el, null, o); r.then(function (x) { paint(el, x, o); }, function () { paint(el, { state: 'error', why: 'The check could not run.' }, o); }); }
    else paint(el, r || null, o);
    return el;
  }
  // close an open badge panel when clicking elsewhere or pressing Escape
  document.addEventListener('click', function (e) { document.querySelectorAll('details.kvb[open]').forEach(function (d) { if (!d.contains(e.target)) d.open = false; }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') document.querySelectorAll('details.kvb[open]').forEach(function (d) { d.open = false; }); });
  window.KBVerify = { version: '1.0.0', keys: keys, verifyText: verifyText, fetchSigned: fetchSigned, badge: badge, supported: supported };
  try { document.dispatchEvent(new CustomEvent('kbverify:ready')); } catch (e) {}
})();
