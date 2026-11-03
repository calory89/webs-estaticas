/* Kolaboro developer reply portal (block I, 3 Nov 2026).
   Ownership: DNS TXT "kolaboro-verify=<random 128-bit code>" on the project's domain, checked by /api/x/i/dns.
   Documents: hashed here with WebCrypto SHA-256; the file itself is never uploaded. API: /api/x/i/* (see _worker.js/kbx_i.js). */
(function () {
  var $ = function (i) { return document.getElementById(i); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function st(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function kb(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function cleanDomain(raw) {
    var h = String(raw || '').trim().toLowerCase().replace(/^[a-z]+:\/\//, '').split(/[\/?#:]/)[0].replace(/\.$/, '').replace(/^www\./, '');
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(h) && h.length <= 253 ? h : null;
  }
  var f = $('drf'), READY = false, DOCS = [], DNS_OK = false;
  var KINDS = [['licence', 'Licence'], ['permit', 'Building permit'], ['land_title', 'Land title'], ['escrow', 'Escrow or guarantee'], ['progress', 'Progress report'], ['company', 'Company registry'], ['other', 'Other']];

  // ---- What is live
  fetch('/api/x/i/status').then(function (r) { return r.json(); }).then(function (s) {
    READY = !!(s.reply && s.reply.ready);
    var b = $('dr-st');
    if (READY) { b.innerHTML = '<b>The verified reply portal is open.</b>Replies are reviewed by a person within 10 working days. ' + (s.reply.published ? s.reply.published + ' replies published so far.' : 'No replies have been published yet.'); }
    else { b.className = 'dr-st soon'; b.innerHTML = '<b>Opening soon.</b>The DNS check below already works, so you can prepare the record now. Sending verified replies opens when our database table is switched on. Until then, please email <a href="mailto:hello@kolaboro.com">hello@kolaboro.com</a> with the project id, or use the unverified note at the bottom of this page.'; $('dr-send').disabled = true; $('dr-send').textContent = 'Opening soon'; }
  }).catch(function () { $('dr-st').innerHTML = '<b>Could not reach our server.</b>Please email <a href="mailto:hello@kolaboro.com">hello@kolaboro.com</a>.'; });

  // ---- Project context from the open data (public fields only)
  var q = new URLSearchParams(location.search).get('id');
  if (q && /^[A-Za-z]{2,5}-\d{3,4}$/.test(q)) {
    q = q.toUpperCase(); $('dr-id').value = q; if ($('rp-id')) $('rp-id').value = q;
    fetch('/data/bali-cases.json?t=' + Math.floor(Date.now() / 6e5)).then(function (r) { return r.json(); }).then(function (d) {
      var c = (d.cases || []).filter(function (x) { return x.id === q; })[0]; if (!c) return; var b = $('rp-case'); b.hidden = false;
      b.innerHTML = '<b>' + esc(c.id) + '</b>: ' + esc(c.region === c.market ? c.market : c.region + ', ' + c.market) + ', ' + esc(c.country) + '. Public checks ' + c.score + '/6, confirmed ' + (c.vscore || 0) + '/6' + (c.claims && c.claims.contradicted ? ', ' + c.claims.contradicted + ' contradicted claims' : '') + (c.invited ? '. Developer invited to verify on ' + esc(c.invited) : '') + '. <a href="/p/?id=' + encodeURIComponent(c.id) + '">Open the project file</a>.';
    }).catch(function () {});
  }

  // ---- Step 1: DNS record
  function token(dom) {
    var k = 'kb-dr-tok:' + dom, t = st(k);
    if (!t || !/^[0-9a-f]{32}$/.test(t)) { var a = new Uint8Array(16); crypto.getRandomValues(a); t = hex(a); st(k, t); }
    return t;
  }
  function showRec() {
    var dom = cleanDomain($('dr-dom').value); DNS_OK = false; $('dr-dnsres').textContent = '';
    if (!dom) { $('dr-recbox').hidden = true; return; }
    $('dr-recbox').hidden = false; $('dr-val').textContent = 'kolaboro-verify=' + token(dom);
  }
  $('dr-dom').addEventListener('input', showRec); $('dr-dom').addEventListener('change', showRec);
  $('dr-new').onclick = function () { var dom = cleanDomain($('dr-dom').value); if (!dom) return; try { localStorage.removeItem('kb-dr-tok:' + dom); } catch (e) {} showRec(); };
  $('dr-copy').onclick = function () { var v = $('dr-val').textContent; (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(function () { $('dr-copy').textContent = 'Copied'; setTimeout(function () { $('dr-copy').textContent = 'Copy value'; }, 1500); }).catch(function () { prompt('Copy this value', v); }); };
  function checkDns() {
    var dom = cleanDomain($('dr-dom').value); if (!dom) return Promise.resolve(false);
    var r = $('dr-dnsres'); r.textContent = 'Asking Cloudflare and Google DNS…';
    return fetch('/api/x/i/dns?domain=' + encodeURIComponent(dom) + '&token=' + token(dom)).then(function (x) { return x.json(); }).then(function (d) {
      if (d.error) { r.innerHTML = '<span class="dr-no">' + (d.error === 'rate' ? 'Too many checks from this network, try again later.' : 'That domain cannot be checked.') + '</span>'; return false; }
      var per = d.resolvers.map(function (x) { return x.resolver + ': ' + (!x.answered ? 'no answer' : x.found ? 'found' : 'not found'); }).join(', ');
      DNS_OK = d.found;
      r.innerHTML = d.found ? '<span class="dr-ok">Record found on ' + esc(d.where) + '.</span> ' + esc(per) + '.' : '<span class="dr-no">Not found yet.</span> ' + esc(per) + '. New records usually appear within minutes, sometimes up to an hour.';
      return d.found;
    }).catch(function () { r.textContent = 'Could not check right now.'; return false; });
  }
  $('dr-check').onclick = checkDns;

  // ---- Step 2: documents, hashed locally
  var drop = $('dr-drop'), inp = $('dr-file');
  drop.onclick = function () { inp.click(); };
  drop.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } };
  drop.ondragover = function (e) { e.preventDefault(); drop.classList.add('on'); };
  drop.ondragleave = function () { drop.classList.remove('on'); };
  drop.ondrop = function (e) { e.preventDefault(); drop.classList.remove('on'); add(e.dataTransfer.files); };
  inp.onchange = function () { add(inp.files); inp.value = ''; };
  function guess(n) { n = n.toLowerCase(); return /title|sertif|shm|hgb|deed|chanote|tapu/.test(n) ? 'land_title' : /permit|pbg|imb|build/.test(n) ? 'permit' : /licen|lisen|rera|license/.test(n) ? 'licence' : /escrow|guarant|bank/.test(n) ? 'escrow' : /progress|report/.test(n) ? 'progress' : /nib|company|akta|registr/.test(n) ? 'company' : 'other'; }
  function add(files) {
    Array.prototype.slice.call(files || []).forEach(function (file) {
      if (DOCS.length >= 12) return;
      var d = { name: file.name.slice(0, 120), bytes: file.size, type: (file.type || '').slice(0, 80), kind: guess(file.name), sha256: null, link: '' };
      if (file.size > 300 * 1048576) { d.err = 'Larger than 300 MB: please add a smaller copy.'; }
      DOCS.push(d); render();
      if (d.err) return;
      file.arrayBuffer().then(function (b) { return crypto.subtle.digest('SHA-256', b); }).then(function (h) { d.sha256 = hex(h); render(); }).catch(function () { d.err = 'Could not read this file.'; render(); });
    });
  }
  function render() {
    $('dr-docs').innerHTML = DOCS.map(function (d, i) {
      return '<li><b title="' + esc(d.name) + '">' + esc(d.name) + ' <small class="muted">' + kb(d.bytes) + '</small></b><select data-i="' + i + '" aria-label="Document type">' + KINDS.map(function (k) { return '<option value="' + k[0] + '"' + (d.kind === k[0] ? ' selected' : '') + '>' + k[1] + '</option>'; }).join('') + '</select><button class="dr-x" type="button" data-x="' + i + '" aria-label="Remove">&times;</button>' +
        '<span class="h">' + (d.err ? esc(d.err) : d.sha256 ? 'SHA-256 ' + d.sha256 : 'Computing fingerprint…') + '</span>' +
        '<input data-l="' + i + '" type="url" maxlength="400" placeholder="Optional https link where we can download it" value="' + esc(d.link) + '"></li>';
    }).join('');
    $('dr-docs').querySelectorAll('select').forEach(function (s) { s.onchange = function () { DOCS[+s.dataset.i].kind = s.value; }; });
    $('dr-docs').querySelectorAll('[data-x]').forEach(function (b) { b.onclick = function () { DOCS.splice(+b.dataset.x, 1); render(); }; });
    $('dr-docs').querySelectorAll('[data-l]').forEach(function (x) { x.oninput = function () { DOCS[+x.dataset.l].link = x.value.trim(); }; });
  }

  // ---- Step 3: submit
  f.addEventListener('submit', function (e) {
    e.preventDefault(); var m = $('dr-msg'); if (f.website.value) return;
    if (!READY) { m.innerHTML = 'Opening soon. Please email <a href="mailto:hello@kolaboro.com">hello@kolaboro.com</a>.'; return; }
    var id = f.id.value.trim().toUpperCase(), dom = cleanDomain(f.domain.value);
    if (!/^[A-Z]{2,5}-\d{3,4}$/.test(id)) { m.textContent = 'Please enter the project id, for example BALI-014.'; return; }
    if (!dom) { m.textContent = 'Please enter the project\'s own domain and add the DNS record.'; return; }
    if (DOCS.some(function (d) { return !d.sha256 && !d.err; })) { m.textContent = 'Wait a moment: fingerprints are still being computed.'; return; }
    if (f.reply.value.trim().length < 20) { m.textContent = 'Please write a reply of at least 20 characters.'; return; }
    if (!f.company.value.trim() || !f.name.value.trim()) { m.textContent = 'Please give the company and your name and role.'; return; }
    if (!f.ok.checked) { m.textContent = 'Please confirm you can speak for the developer.'; return; }
    var bad = DOCS.filter(function (d) { return d.link && !/^https:\/\//.test(d.link); }); if (bad.length) { m.textContent = 'Document links must start with https://'; return; }
    m.textContent = 'Checking DNS and sending…'; $('dr-send').disabled = true;
    fetch('/api/x/i/reply', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      id: id, domain: dom, token: token(dom), company: f.company.value, name: f.name.value, email: f.email.value, topic: f.topic.value, reply: f.reply.value,
      publish_company: f.publish_company.checked, ok: true, docs: DOCS.filter(function (d) { return d.sha256; }).map(function (d) { return { kind: d.kind, name: d.name, sha256: d.sha256, bytes: d.bytes, type: d.type, link: d.link || null }; })
    }) }).then(function (r) { return r.json(); }).then(function (d) {
      $('dr-send').disabled = false;
      if (d.ok) { m.innerHTML = '<span class="dr-ok">Received, reference #' + esc(d.ref) + '.</span> The DNS record was found on ' + esc(d.dns.where) + '. Keep it in place until your reply is published; a moderator re-checks it.'; DOCS = []; render(); f.reply.value = ''; if (window.kbEvent) kbEvent('developer_reply_verified'); }
      else m.innerHTML = '<span class="dr-no">' + esc(d.message || 'Could not send.') + '</span>' + (d.error === 'dns' ? ' Use "Check DNS now" above to watch for it.' : '');
    }).catch(function () { $('dr-send').disabled = false; m.innerHTML = 'Could not send. Please email <a href="mailto:hello@kolaboro.com">hello@kolaboro.com</a>.'; });
  });

  // ---- Published replies (approved by a moderator)
  fetch('/api/x/i/replies' + (q ? '?id=' + q : '')).then(function (r) { return r.json(); }).then(function (d) {
    var el = $('dr-pub'), L = d.replies || [];
    if (!d.ready) { el.innerHTML = '<p class="muted">None yet: the verified portal opens soon.</p>'; return; }
    if (!L.length) { el.innerHTML = '<p class="muted">No developer reply has been approved' + (q ? ' for ' + esc(q) : '') + ' yet.</p>'; return; }
    el.innerHTML = L.map(function (x) {
      return '<div class="dr-card"><small>' + esc(x.project_id) + ' &middot; ' + esc(x.topic) + ' &middot; approved ' + esc(x.approved) + (x.company ? ' &middot; ' + esc(x.company) + (x.domain ? ' (' + esc(x.domain) + ')' : '') : '') + '</small><pre>' + esc(x.reply) + '</pre>' +
        (x.note ? '<p><b>Kolaboro note:</b> ' + esc(x.note) + '</p>' : '') +
        (x.docs && x.docs.length ? '<p style="margin:6px 0 2px"><b>Documents</b> (SHA-256 fingerprints)</p>' + x.docs.map(function (k) { return '<div class="dr-h">' + esc(k.kind) + ' ' + esc(k.sha256) + '</div>'; }).join('') : '') +
        '<small>Ownership shown by: ' + esc(x.ownership) + '. <a href="/p/?id=' + encodeURIComponent(x.project_id) + '">Project file</a></small></div>';
    }).join('');
  }).catch(function () { $('dr-pub').innerHTML = '<p class="muted">Could not load replies.</p>'; });

  // ---- Unverified note (the original form, unchanged behaviour)
  var rf = $('rpf'), rm = $('rp-msg');
  if (rf) rf.addEventListener('submit', function (e) {
    e.preventDefault(); if (rf.website.value) return;
    var em = (rf.email.value || '').trim(); if (!rf.id.value.trim() || !rf.company.value.trim() || !rf.name.value.trim() || !rf.reply.value.trim()) { rm.textContent = 'Please fill in the project id, company, name and reply.'; return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { rm.textContent = 'Please use a valid work email.'; return; } if (!rf.ok.checked) { rm.textContent = 'Please confirm you can speak for the developer.'; return; }
    if (/\b\d{10,}\b/.test(rf.docs.value + rf.reply.value)) { rm.textContent = 'Please remove long numbers such as bank account numbers.'; return; }
    rm.textContent = 'Sending…';
    var K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw';
    fetch('https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/kolaboro_apply', { method: 'POST', headers: { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_name: rf.name.value.trim() + ' (' + rf.company.value.trim() + ')', p_email: em, p_country: '', p_phone: '', p_who: 'developer-reply | ' + rf.id.value.trim().toUpperCase() + ' | ' + rf.topic.value, p_bring: rf.reply.value.trim() + '\n\nDocuments:\n' + rf.docs.value.trim(), p_learn: '', p_week: '', p_lang: 'en', p_source: 'developer-reply', p_plan: 'developer-reply' }) })
      .then(function (r) { return r.json(); }).then(function (d) { if (d === 'ok' || d === 'too_many') { rm.textContent = 'Thank you. We received your note and will answer by email within 10 working days.'; rf.reset(); if (window.kbEvent) kbEvent('developer_reply'); } else throw 0; })
      .catch(function () { rm.textContent = 'Could not send. Please email hello@kolaboro.com with the project id.'; });
  });
})();
