/* Kolaboro webhooks page (block T): status, a live signed sample verified in the browser, code samples, register/ping/log. */
(function(){
  var $ = function(i){ return document.getElementById(i); };
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function hex(b){ return Array.prototype.map.call(new Uint8Array(b), function(x){ return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function unb64(s){ var t = atob(s), a = new Uint8Array(t.length); for (var i = 0; i < t.length; i++) a[i] = t.charCodeAt(i); return a; }
  var te = new TextEncoder();

  fetch('/api/x/t/status').then(function(r){ return r.json(); }).then(function(s){
    var w = s.webhooks || {};
    $('ws').innerHTML = w.open
      ? '<p style="margin:0"><span class="pill g">Open</span> ' + w.active + ' active webhook' + (w.active === 1 ? '' : 's') + '. Signing key ' + (w.signing ? 'installed' : '<b>missing</b>') + '.</p>'
      : '<p style="margin:0"><span class="pill o">Registration opens soon</span> The webhook tables are being switched on. Today you can already send a signed ping to your endpoint with your API key and test your verification code against the live sample below.</p>';
  }).catch(function(){ $('ws').innerHTML = '<p class="mut" style="margin:0">Status unavailable.</p>'; });

  // live sample: fetched, then verified here with the published public key
  Promise.all([fetch('/api/x/t/hooks/sample').then(function(r){ return r.json(); }), fetch('/.well-known/kolaboro-keys.json').then(function(r){ return r.json(); })]).then(function(x){
    var s = x[0], keys = x[1].keys || [], box = $('wsample');
    if (!s.body) { box.innerHTML = '<p class="mut" style="margin:0">Sample unavailable right now.</p>'; return; }
    var kid = s.headers['x-kolaboro-key-id'], k = keys.filter(function(y){ return y.kid === kid; })[0];
    box.innerHTML = '<div class="eg-code" style="margin-top:0">' + Object.keys(s.headers).map(function(h){ return esc(h + ': ' + s.headers[h]); }).join('\n') + '\n\n' + esc(JSON.stringify(JSON.parse(s.body), null, 1)) + '</div><p id="wsv" class="mut">Verifying…</p>';
    if (!k) { $('wsv').innerHTML = '<span class="no">Key ' + esc(kid) + ' is not in the published key list.</span>'; return; }
    crypto.subtle.digest('SHA-256', te.encode(s.body)).then(function(d){
      var msg = 'kolaboro-sig-v1\n' + hex(d);
      return crypto.subtle.importKey('raw', unb64(k.public_key_raw_b64), { name: 'Ed25519' }, false, ['verify']).then(function(pk){ return crypto.subtle.verify({ name: 'Ed25519' }, pk, unb64(s.headers['x-kolaboro-signature']), te.encode(msg)); }).then(function(ok){
        var age = Math.round(Date.now() / 1000 - JSON.parse(s.body).timestamp);
        $('wsv').innerHTML = ok ? '<span class="ok">Signature valid</span> with key ' + esc(kid) + ' over SHA-256 ' + hex(d).slice(0, 16) + '…, timestamp ' + age + ' s old. Change one character of the body and it fails.' : '<span class="no">Signature does not verify.</span>';
      });
    }).catch(function(){ $('wsv').innerHTML = 'This browser cannot verify Ed25519 with WebCrypto (Chrome 137+, Safari 17+, Firefox 129+ can). Use the code below on your server.'; });
  }).catch(function(){ $('wsample').innerHTML = '<p class="mut" style="margin:0">Sample unavailable right now.</p>'; });

  // code samples are the downloadable files themselves
  [['cjs', '/docs/webhooks/verify.mjs'], ['cpy', '/docs/webhooks/verify.py']].forEach(function(p){
    fetch(p[1]).then(function(r){ return r.text(); }).then(function(t){ $(p[0]).textContent = t.trim(); }).catch(function(){ $(p[0]).textContent = 'Download the file above.'; });
  });

  // register, ping, list
  function key(){ return $('wk').value.trim(); }
  function call(method, path, body){
    return fetch(path, { method: method, headers: Object.assign({ 'x-api-key': key() }, body ? { 'content-type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined }).then(function(r){ return r.json(); });
  }
  function need(){ if (!/^kb_live_[0-9a-f]{40}$/.test(key())) { $('wout').innerHTML = '<p class="no">Enter your API key (kb_live_ followed by 40 characters).</p>'; return false; } return true; }
  function err(d){ return '<p class="no">' + esc(d.detail || d.note || d.error || 'error') + (d.unknown ? ': ' + esc(d.unknown.join(', ')) : '') + '</p>'; }
  $('wf').addEventListener('submit', function(e){
    e.preventDefault(); if (!need()) return;
    var projects = $('wp').value.toUpperCase().split(/[\s,;]+/).filter(Boolean);
    $('wout').innerHTML = '<p class="mut">Registering…</p>';
    call('POST', '/api/x/t/hooks', { url: $('wu').value.trim(), projects: projects }).then(function(d){
      if (!d.ok) { $('wout').innerHTML = err(d); return; }
      $('wout').innerHTML = '<div class="eg-live"><p style="margin:0"><span class="ok">Registered.</span> Webhook id <b>' + d.webhook.id + '</b> (check <code>webhook_id</code> against it) for ' + d.webhook.projects.length + ' project' + (d.webhook.projects.length === 1 ? '' : 's') + '. Ping: ' + (d.ping.ok ? '<span class="ok">delivered, HTTP ' + d.ping.status + ' in ' + d.ping.ms + ' ms</span>' : '<span class="no">' + esc(d.ping.error) + '</span>') + '.</p></div>';
    }).catch(function(){ $('wout').innerHTML = '<p class="no">Network error.</p>'; });
  });
  $('wping').addEventListener('click', function(){
    if (!need()) return; $('wout').innerHTML = '<p class="mut">Sending a signed ping…</p>';
    call('POST', '/api/x/t/hooks/ping', { url: $('wu').value.trim() }).then(function(d){
      if (!d.response) { $('wout').innerHTML = err(d); return; }
      $('wout').innerHTML = '<div class="eg-live"><p style="margin:0">' + (d.ok ? '<span class="ok">Delivered</span>' : '<span class="no">Not delivered</span>') + ': ' + (d.response.status ? 'HTTP ' + d.response.status : esc(d.response.error)) + ' in ' + d.response.ms + ' ms. This is exactly what we sent:</p><div class="eg-code">' + esc('POST ' + d.sent.url + '\n' + Object.keys(d.sent.headers).map(function(h){ return h + ': ' + d.sent.headers[h]; }).join('\n') + '\n\n' + d.sent.body) + '</div></div>';
    }).catch(function(){ $('wout').innerHTML = '<p class="no">Network error.</p>'; });
  });
  $('wlist').addEventListener('click', function(){
    if (!need()) return; $('wout').innerHTML = '<p class="mut">Loading…</p>';
    call('GET', '/api/x/t/hooks').then(function(d){
      if (!d.ok) { $('wout').innerHTML = err(d); return; }
      var h = '<div class="eg-tw"><table class="eg-t"><thead><tr><th>Id</th><th>URL</th><th>Projects</th><th>State</th><th></th></tr></thead><tbody>' + (d.hooks.length ? d.hooks.map(function(x){
        return '<tr><td>' + x.id + '</td><td style="overflow-wrap:anywhere">' + esc(x.url) + '</td><td>' + esc(x.projects.join(', ')) + '</td><td>' + (x.disabled_at ? '<span class="no">off</span> ' + esc(x.disabled_why || '') : '<span class="ok">on</span>' + (x.fails_in_row ? ', ' + x.fails_in_row + ' failures in a row' : '')) + '</td><td>' + (x.disabled_at ? '' : '<button class="btn btn-line btn-sm" data-off="' + x.id + '" style="margin-top:0;color:var(--ink);border-color:var(--ink)">Switch off</button>') + '</td></tr>';
      }).join('') : '<tr><td colspan="5">No webhooks.</td></tr>') + '</tbody></table></div>';
      h += '<h3>Last deliveries</h3><div class="eg-tw"><table class="eg-t"><thead><tr><th>When (UTC)</th><th>Webhook</th><th>Event</th><th>Attempt</th><th>Result</th></tr></thead><tbody>' + (d.deliveries.length ? d.deliveries.map(function(x){
        return '<tr><td>' + esc(String(x.at).slice(0, 19).replace('T', ' ')) + '</td><td>' + x.hook_id + '</td><td>' + esc(x.type) + (x.project_id ? ' ' + esc(x.project_id) : '') + '<br><span class="hash">' + esc(x.event_id) + '</span></td><td>' + x.attempt + '</td><td>' + (x.ok ? '<span class="ok">' + x.status + '</span>' : '<span class="no">' + esc(x.error || x.status) + '</span>') + (x.ms != null ? ' · ' + x.ms + ' ms' : '') + '</td></tr>';
      }).join('') : '<tr><td colspan="5">No deliveries yet. Events go out once a day when a watched project changes.</td></tr>') + '</tbody></table></div>';
      $('wout').innerHTML = h;
      $('wout').querySelectorAll('[data-off]').forEach(function(b){ b.onclick = function(){ b.disabled = true; call('POST', '/api/x/t/hooks/disable', { id: +b.dataset.off }).then(function(){ $('wlist').click(); }); }; });
    }).catch(function(){ $('wout').innerHTML = '<p class="no">Network error.</p>'; });
  });
})();
