// /forward/: the Telegram "forward and check" result viewer. The result is inside the link's #fragment, which browsers never send
// to a server: we do not store what a buyer forwards. The signature is checked here, in your browser, with Kolaboro's public key.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function b64(s, url) { s = String(s); if (url) s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }

  fetch('/api/x/j/tg/status').then(function (r) { return r.json(); }).then(function (s) {
    var el = $('fw-bot');
    if (s.configured && s.bot) el.innerHTML = '<a class="btn btn-hi" href="https://t.me/' + esc(s.bot) + '" rel="noopener">Open @' + esc(s.bot) + ' in Telegram</a>';
    else el.innerHTML = '<p class="fw-soon"><b>Opens soon.</b> The bot is built and tested; its Telegram account is not connected yet.</p>';
  }).catch(function () {});

  var h = new URLSearchParams(location.hash.slice(1)), r = h.get('r');
  if (!r) return;
  var box = $('fw-result'); box.hidden = false; $('fw-intro').hidden = true;
  if (!('DecompressionStream' in window)) { box.innerHTML = '<p>This browser is too old to open the result. Try a current Chrome, Safari, Firefox or Edge.</p>'; return; }
  var bytes; try { bytes = b64(r, true); } catch (e) { box.innerHTML = '<p>This link is damaged. Copy it again from Telegram.</p>'; return; }
  new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text().then(function (body) {
    var o = JSON.parse(body);
    render(o);
    var sig = h.get('s'), kid = h.get('k'), sv = $('fw-sig');
    if (!sig) { sv.className = 'fw-sig no'; sv.textContent = 'Not signed: the signing key was not available when this result was made.'; return; }
    return Promise.all([fetch('/.well-known/kolaboro-keys.json').then(function (x) { return x.json(); }), crypto.subtle.digest('SHA-256', new TextEncoder().encode(body))]).then(function (a) {
      var key = (a[0].keys || []).filter(function (k) { return k.kid === kid; })[0] || (a[0].keys || [])[0];
      var msg = new TextEncoder().encode('kolaboro-sig-v1\n' + hex(a[1]));
      return crypto.subtle.importKey('raw', b64(key.public_key_raw_b64), { name: 'Ed25519' }, false, ['verify']).then(function (pk) {
        return crypto.subtle.verify({ name: 'Ed25519' }, pk, b64(sig), msg);
      }).then(function (ok) {
        sv.className = 'fw-sig ' + (ok ? 'ok' : 'no');
        sv.innerHTML = ok ? '<b>Signature valid.</b> Kolaboro signed exactly this result (Ed25519, key ' + esc(key.kid) + ', checked in your browser just now). Body SHA-256 <code>' + hex(a[1]).slice(0, 16) + '…</code>'
          : '<b>Signature does not match.</b> This result was changed after Kolaboro signed it. Do not rely on it.';
      });
    }).catch(function () { sv.className = 'fw-sig no'; sv.textContent = 'Your browser could not check the Ed25519 signature. The result is shown, unverified.'; });
  }).catch(function () { box.innerHTML = '<p>This link is damaged or incomplete. Copy the whole link from Telegram.</p>'; });

  function li(a) { return a && a.length ? '<ul>' + a.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '<p class="muted">None.</p>'; }
  function render(o) {
    var r = o.report || {}, i = o.input || {}, q = o.quotes || [];
    var facts = [['Price from', r.price_from], ['Title', r.title_type], ['Lease', r.lease_years], ['Completion', r.completion], ['Advertised return', r.advertised_return], ['Permit claim', r.permit_claim], ['Payment plan', r.payment_plan]].filter(function (x) { return x[1]; });
    var att = { low: 'Low', medium: 'Medium', high: 'High' }[r.attention] || 'Unknown';
    $('fw-out').innerHTML =
      '<p class="eyebrow">Forward and check · ' + esc(i.label || i.kind) + ' · ' + esc(new Date(o.at).toUTCString().slice(5, 22)) + ' UTC</p>' +
      '<h2>' + esc(r.project || 'What you forwarded') + (r.location ? ' <span class="muted">· ' + esc(r.location) + '</span>' : '') + '</h2>' +
      '<p class="fw-att fw-' + esc(r.attention) + '">Needs checking before you pay: <b>' + att + '</b></p>' +
      (o.not_property ? '<p>This does not look like a property offer.</p>' : '') +
      (r.summary ? '<p class="lead">' + esc(r.summary) + '</p>' : '') +
      (o.tracked ? '<p class="fw-track">Tracked by Kolaboro as <a href="' + esc(o.tracked.url) + '">' + esc(o.tracked.id) + '</a>: ' + esc(o.tracked.score) + ' of ' + esc(o.tracked.max) + ' buyer checks public.</p>' : '') +
      (o.ai_manipulation ? '<p class="fw-warn">It contains text aimed at automated reviewers. Treat that as a red flag.</p>' : '') +
      (r.guaranteed_language ? '<p class="fw-warn">It uses "guaranteed" return language.</p>' : '') +
      '<div class="fw-grid"><section><h3>What it promises</h3>' + (q.length ? '<ul class="fw-q">' + q.map(function (x) {
        return '<li class="' + (x.verbatim ? 'v' : 'p') + '"><span class="fw-tag">' + (x.verbatim ? 'Word for word' : 'Reworded') + '</span>' + (x.verbatim ? '“' + esc(x.t) + '”' : esc(x.t)) + '</li>';
      }).join('') + '</ul>' : '<p class="muted">No promises found.</p>') +
      '<p class="fw-note">"Word for word" means the quote was found in ' + (i.transcribed ? 'our transcription of your file' : 'the text') + ', ignoring case, spacing and quote marks. "Reworded" means the AI reader paraphrased it: check the original.</p></section>' +
      '<section><h3>Not stated</h3>' + li(r.missing) + '<h3>Ask before you pay</h3>' + (r.questions && r.questions.length ? '<ol>' + r.questions.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' : '<p class="muted">None.</p>') + '</section></div>' +
      (facts.length ? '<h3>What it says, in short</h3><dl class="fw-facts">' + facts.map(function (x) { return '<div><dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd></div>'; }).join('') + '</dl>' : '') +
      (o.consensus ? '<p class="fw-note">Two AI readers read it; they agreed on ' + esc(o.consensus.agreed) + ' of ' + esc(o.consensus.fields) + ' key fields.' + (o.consensus.disagreements && o.consensus.disagreements.length ? ' They disagreed on: ' + esc(o.consensus.disagreements.map(function (d) { return d.label; }).join(', ')) + '.' : '') + '</p>' : '') +
      '<p class="fw-note">Input fingerprint SHA-256 <code>' + esc(String(i.sha256 || '').slice(0, 16)) + '…</code>' + (i.url ? ' · page <code>' + esc(i.url) + '</code>' : '') + ' · reviewer prompt <code>' + esc(String((o.method || {}).prompt_sha256 || '').slice(0, 12)) + '…</code>. AI readings are a starting point, not a verdict: get documents and check them.</p>';
  }
})();
