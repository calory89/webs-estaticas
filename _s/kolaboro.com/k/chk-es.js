(function(){
  var $ = function(i){ return document.getElementById(i); };
  var SB = 'https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/kolaboro_apply';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw';
  var PAY = 'https://www.paypal.com/ncp/payment/32ENX4QK833GE';
  var url = '';
  function show(n){ ['az-1','az-2','az-3','az-4'].forEach(function(id, i){ $(id).classList.toggle('on', i === n - 1); }); $('az').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function ev(n, p){ if (window.kbEvent) kbEvent(n, p || {}); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function knownEmail(){ var e = ($('az-email') && $('az-email').value.trim()) || ($('az-cpe') && $('az-cpe').value.trim()) || ''; if (!e) try { e = localStorage.getItem('kb-desk-email') || ''; } catch (x) {} return e; }
  function norm(v){ v = v.trim(); if (!v) return ''; if (!/^https?:\/\//i.test(v)) v = 'https://' + v; try { var u = new URL(v); return /\./.test(u.hostname) ? u.toString() : ''; } catch (e) { return ''; } }
  function step1(){ var raw = $('az-url').value.trim(), v = norm(raw), hs = /^#kxc-(buy|mon)$/.test(location.hash) ? location.hash : '#analyze';
    // a project name (not a website) is looked up by the X-ray (the worker adds it to every /check/ page), so it is not an error; the address bar keeps the query so a reload, the back button or a return from sign-up shows the same check
    if (!v) { if (raw.length >= 3 && !window.KBX_OFF) { $('az-e1').textContent = ''; try { history.replaceState(null, '', location.pathname + '?q=' + encodeURIComponent(raw) + hs); } catch (x) {} return; } $('az-e1').textContent = 'Paste the full website address of the project.'; return; }
    try { history.replaceState(null, '', location.pathname + '?url=' + encodeURIComponent(v) + hs); } catch (x) {}
    url = v; try { localStorage.setItem('kb-desk-url', v); } catch(x){} $('az-e1').textContent = ''; $('az-host').textContent = new URL(url).hostname.replace(/^www\./, ''); ev('desk_url'); run(''); }
  $('az-f1').addEventListener('submit', step1);
  $('az-url').addEventListener('input', function(){ if ($('az-e1').textContent && !$('az-e1').querySelector('a')) $('az-e1').textContent = ''; });
  document.addEventListener('click', function(e){ if (e.target.closest && e.target.closest('[data-show-start]')) $('start').hidden = false; });
  var qs = new URLSearchParams(location.search); if (qs.get('url')) { $('az-url').value = qs.get('url'); step1(); } else if (qs.get('q') && !window.KBX_OFF) { $('az-url').value = qs.get('q').slice(0, 300); } else if (qs.get('q')) { $('az-url').value = ''; $('az-url').placeholder = 'Website of ' + qs.get('q').slice(0, 40); $('az-e1').innerHTML = 'We read the developer\'s own website, so paste its address above. Only have the name? <a href="#start" data-show-start>Send it to us</a> and we find it for you.'; $('az-url').focus(); }
  function save(email, note){ if (!email) return; try { fetch(SB, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_name: 'Desk review request', p_email: email, p_country: '', p_phone: '', p_who: 'buyer | desk review', p_bring: note.slice(0, 4000), p_learn: url.slice(0, 300), p_week: '', p_lang: 'en', p_source: 'yc-desk | ' + location.pathname, p_plan: 'yc-desk' }) }); } catch (e) {} }
  // live desk review: /api/x/b/review streams one event per real step (Server-Sent Events over a POST); /api/kb/analyze is the fallback
  function LVS(){ return [['fetch', 'Fetch the page'], ['strip', 'Strip text a visitor cannot see'], ['scan', 'Scan for instructions aimed at automated readers'], ['model_a', 'Model A reads the page'], ['model_b', 'Model B reads it independently'], ['consensus', 'Compare the critical fields'], ['quotes', 'Check every quote against the page'], ['sign', 'Sign the result']]; }
  function fms(ms){ return ms >= 10000 ? (ms / 1000).toFixed(1) + ' s' : ms + ' ms'; }
  function kb(n){ return n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function lvInit(){ $('az-prog').innerHTML = LVS().map(function(s){ return '<li id="lv-' + s[0] + '"><div><b>' + s[1] + '</b><small></small></div><code></code></li>'; }).join(''); $('az-lvf').textContent = ''; lvRun('fetch'); }
  function lvRun(k){ var li = $('lv-' + k); if (li && !/ok|bad|skip/.test(li.className)) li.className = 'run'; }
  function lvDetail(e){
    var n = function(x){ return Number(x || 0).toLocaleString('en'); };
    switch (e.step) {
      case 'fetch': return e.ok ? 'HTTP ' + e.status + ' · ' + kb(e.bytes) + (e.redirects ? ' · ' + e.redirects + ' redirect' + (e.redirects > 1 ? 's' : '') : '') : e.blocked ? 'The website refused our automated reader' + (e.status ? ' (HTTP ' + e.status + ')' : '') : e.status ? 'The website answered with an error (HTTP ' + e.status + ')' : e.detail === 'timeout' ? 'The website did not answer within 15 seconds' : 'The website could not be reached';
      case 'strip': return (e.embedded_chars ? 'Page built in the browser: ' + n(e.embedded_chars) + ' characters taken from its built-in data · ' : '') + (e.hidden_chars ? n(e.hidden_chars) + ' characters in ' + e.hidden_blocks + ' hidden block' + (e.hidden_blocks === 1 ? '' : 's') + ' removed · ' + n(e.read_chars) + ' characters read' : 'No hidden text found · ' + n(e.read_chars) + ' characters read');
      case 'scan': return e.hits ? e.hits + ' match' + (e.hits > 1 ? 'es' : '') + ' against ' + e.patterns + ' patterns' : 'No matches against ' + e.patterns + ' patterns';
      case 'model_a': case 'model_b': return (e.ok ? '' : 'Failed: ') + e.model + (e.fallback_from ? ' (first choice gave no usable answer: ' + e.fallback_from + ')' : '');
      case 'consensus': return e.skipped ? 'Skipped: only one model answered' : e.agreed + ' of ' + e.fields + ' fields agree' + (e.disagreed && e.disagreed.length ? ' · differ: ' + e.disagreed.join(', ') : '');
      case 'quotes': return e.checked + ' claims checked, ' + e.removed + ' removed · ' + e.fields_with_quote + ' of ' + e.fields_stated + ' facts quoted';
      case 'sign': return e.signed ? 'Ed25519 · SHA-256 ' + String(e.sha256 || '').slice(0, 16) + '…' : 'Not signed (no key configured)';
    } return '';
  }
  var lvZero = false;
  function lvStep(e){
    if (e.step === 'explore') {
      var xl = document.createElement('li'); xl.className = e.chosen ? 'ok' : 'skip';
      xl.innerHTML = '<div><b>Looking for where this site sells</b><small></small></div><code></code>';
      xl.querySelector('small').textContent = !e.candidates ? 'No other page on this site looks like a property offer' : e.candidates + ' page' + (e.candidates > 1 ? 's' : '') + ' on this site look like the offer; ' + (e.read || []).length + ' read' + (e.chosen ? ', the one with the most offer details (prices, sizes, payment terms) is ' + String(e.chosen).replace(/^https?:\/\//, '') : ', none of them clearly lists an offer (prices, sizes, payment terms)');
      xl.querySelector('code').textContent = fms(e.ms); $('az-prog').insertBefore(xl, $('lv-sign') || $('az-prog').querySelector('li.tot') || null); return;
    }
    if (e.step === 'follow_kept') {
      var kl = document.createElement('li'); kl.className = 'skip'; kl.innerHTML = '<div><b>Kept the page you pasted</b><small></small></div><code></code>';
      kl.querySelector('small').textContent = String(e.url || '').replace(/^https?:\/\//, '') + ' was read, but your page states more of the offer, so the review below is of your page.'; $('az-prog').appendChild(kl); return;
    }
    if (e.step === 'follow') {
      var fl = document.createElement('li'); fl.className = e.ok ? 'ok' : 'bad';
      fl.innerHTML = '<div><b>Reading the page where the site sells</b><small></small></div><code></code>';
      fl.querySelector('small').textContent = String(e.url || '').replace(/^https?:\/\//, '') + (e.ok ? '' : ' (could not be read)');
      fl.querySelector('code').textContent = fms(e.ms); $('az-prog').insertBefore(fl, $('lv-fetch'));
      if (e.ok) LVS().forEach(function(x){ var r = $('lv-' + x[0]); if (r) { r.className = ''; r.querySelector('small').textContent = ''; r.querySelector('code').textContent = ''; } });
      lvRun('fetch'); return;
    }
    var li = $('lv-' + e.step); if (!li) return;
    li.className = e.skipped ? 'skip' : e.ok === false ? 'bad' : 'ok';
    li.querySelector('small').textContent = lvDetail(e);
    li.querySelector('code').textContent = e.skipped ? '' : fms(e.ms) + (e.ms === 0 ? '*' : '');
    if (e.ms === 0 && !e.skipped) lvZero = true;
    var nx = { fetch: ['strip'], strip: ['scan'], scan: ['model_a', 'model_b'], consensus: ['quotes'], quotes: ['sign'] }[e.step] || [];
    if ((e.step === 'model_a' || e.step === 'model_b') && /ok|bad/.test(($('lv-model_a') || {}).className) && /ok|bad/.test(($('lv-model_b') || {}).className)) nx = ['consensus'];
    nx.forEach(lvRun);
  }
  function lvTotal(ms){
    var o = $('az-prog'); var li = document.createElement('li'); li.className = 'tot'; li.innerHTML = '<div><b>Total, measured on our server</b></div><code>' + fms(ms) + '</code>'; o.appendChild(li);
    if (lvZero) $('az-lvf').textContent = '* Our server is a Cloudflare Worker, whose clock only moves while it waits for the network. Steps that are pure computation therefore measure 0 ms: they took less time than the clock can see.';
  }
  function streamReview(email){
    return fetch('/api/x/b/review', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: url, email: email || '', company: $('az-co').value, lang: document.documentElement.lang || 'en' }) }).then(function(r){
      if (!/event-stream/.test(r.headers.get('content-type') || '')) return r.json().catch(function(){ return {}; }).then(function(d){ if (r.status === 404 || r.status === 405 || r.status >= 500 && !d.error) throw new Error('nostream'); return { status: r.status, d: d }; });
      if (!r.body || !r.body.getReader) throw new Error('nostream');
      var rd = r.body.getReader(), dec = new TextDecoder(), buf = '', res = null, err = null, errE = null;
      function pump(){ return rd.read().then(function(x){
        if (x.done) return res ? { status: 200, d: res } : { status: 503, d: Object.assign({}, errE || {}, { error: err || 'network' }) };
        buf += dec.decode(x.value, { stream: true }); var parts = buf.split('\n\n'); buf = parts.pop();
        parts.forEach(function(p){ var line = p.split('\n').filter(function(l){ return l.indexOf('data: ') === 0; }).map(function(l){ return l.slice(6); }).join(''); if (!line) return; var e; try { e = JSON.parse(line); } catch (x) { return; }
          if (e.type === 'step') lvStep(e);
          else if (e.type === 'cached') { $('az-prog').innerHTML = '<li class="ok"><div><b>Stored result</b><small>This page was reviewed on ' + esc(new Date(e.analysed).toUTCString().slice(5, 22)) + ' UTC, so you see that review. Nothing was run now, so no step timings are shown.</small></div><code></code></li>'; }
          else if (e.type === 'result') res = Object.assign({}, e.data, { cached: e.cached, first: e.first, tracked: e.tracked });
          else if (e.type === 'error') { err = e.error; errE = e; LVS().forEach(function(s){ var li = $('lv-' + s[0]); if (li && li.className === 'run') li.className = 'bad'; }); }
          else if (e.type === 'done' && res && !res.cached) lvTotal(e.total_ms);
        }); return pump(); }); }
      return pump();
    });
  }
  function legacyReview(email){
    $('az-prog').innerHTML = '<li class="run"><div><b>Reading the website</b><small>Live steps are not available right now, so this review runs without them.</small></div><code></code></li>';
    return fetch('/api/kb/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: url, email: email || '', company: $('az-co').value, lang: document.documentElement.lang || 'en' }) })
      .then(function(r){ return r.json().then(function(d){ return { status: r.status, d: d }; }); });
  }
  function run(email){
    show(3); lvZero = false; lvInit();
    $('az-first').textContent = 'Starting…'; var t0 = Date.now(), el = setInterval(function(){ var f = $('az-first'); if (f) f.textContent = 'Reviewing ' + new URL(url).hostname.replace(/^www\./, '') + ' · ' + Math.round((Date.now() - t0) / 1000) + ' s'; }, 1000);
    streamReview(email).catch(function(e){ if (e && e.message === 'nostream') return legacyReview(email); throw e; })
      .then(function(x){ clearInterval(el); var s = x.status, d = x.d;
        if (s !== 200 || !d.report) { render_err(d.error, d); save(email, 'Desk review failed: ' + (d.error || s)); if (!email) { copyBox('Desk review not read automatically (' + (d.error || s) + '): ' + url); r29pos(); } return; }
        save(email, 'Desk review: ' + (d.report.summary || '') + ' | attention: ' + (d.report.attention || ''));
        setTimeout(function(){ render(d); if (d.not_property || d.report.page_kind === 'not_real_estate') return; tools(); if (!email) copyBox(d.report.summary); }, 900);
      }).catch(function(){ clearInterval(el); render_err('network'); save(email, 'Desk review failed: network'); if (!email) { copyBox('Desk review failed (network): ' + url); r29pos(); } });
   }
  $('az-f2').addEventListener('submit', function(){ var em = $('az-email').value.trim(); if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) run(em); });
  function copyBox(sum){
    var box = $('az-4'); if (!box || $('az-cp')) return; var known = ''; try { known = localStorage.getItem('kb-desk-email') || ''; } catch (e) {}
    var f = document.createElement('form'); f.id = 'az-cp'; f.className = 'az-cp'; f.setAttribute('novalidate', '');
    f.innerHTML = '<label for="az-cpe"><b>Want us to follow up?</b> <span>Leave your email and a person on our team replies within one working day.</span></label><div><input type="email" id="az-cpe" autocomplete="email" placeholder="you@email.com" value="' + esc(known) + '"><button class="btn btn-line" type="submit">Send</button></div><p class="fe" id="az-cpx" role="alert"></p>';
    var rq = document.getElementById('azreq'); box.insertBefore(f, rq || null);
    f.addEventListener('submit', function(e){ e.preventDefault(); var em = $('az-cpe').value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { $('az-cpx').textContent = 'Add a valid email address.'; return; }
      try { localStorage.setItem('kb-desk-email', em); } catch (x) {} save(em, 'Desk review copy requested: ' + (sum || '')); ev('generate_lead', { role: 'desk' });
      f.innerHTML = '<p style="margin:0"><b>✓ Thanks.</b> We reply to ' + esc(em) + ' within one working day.</p>'; });
  }

  function tools(){
    var box = $('az-4'); if (!box || $('az-tools')) return;
    var link = location.origin + '/check?url=' + encodeURIComponent(url) + '#analyze';
    var t = document.createElement('div'); t.id = 'az-tools'; t.className = 'az-tools';
    t.innerHTML = '<button type="button" class="btn btn-line btn-sm" id="az-share">Share this review</button><button type="button" class="btn btn-line btn-sm" id="az-pdf">Save as PDF</button><span class="muted" id="az-shx" style="font-size:.85rem"></span>';
    box.insertBefore(t, box.children[2] || null);
    $('az-share').onclick = function(){ ev('desk_share'); if (navigator.share) { navigator.share({ title: 'Kolaboro desk review', text: 'What to check before paying for this project', url: link }).catch(function(){}); return; }
      try { navigator.clipboard.writeText(link); $('az-shx').textContent = 'Link copied. Send it to your partner or lawyer.'; } catch (e) { $('az-shx').textContent = link; } };
    $('az-pdf').onclick = function(){ ev('desk_pdf'); window.print(); };
  }
  function pagesFound(list, lead){
    list = (list || []).filter(function(x){ return /^https?:\/\//.test(x); }).slice(0, 6); if (!list.length) return '';
    return '<div class="az-found"><p style="margin:14px 0 6px"><b>' + esc(lead) + '</b></p><ul style="margin:0 0 8px">' + list.map(function(x){ return '<li><a href="/check?url=' + encodeURIComponent(x) + '#analyze">Check ' + esc(x.replace(/^https?:\/\/(www\.)?/, '')) + '</a></li>'; }).join('') + '</ul></div>';
  }
  function render_err(e, d){
    d = d || {}; var st = d.status ? ' (HTTP ' + d.status + ')' : '';
    var m = e === 'rate' ? 'You have run several reviews in the last hour. Try again later, or book a full check below.'
      : e === 'blocked' ? 'The website refused our automated reader' + st + '. Many sites use bot protection that turns away any program, including ours, and we do not disguise our reader as a person. This says nothing about the project. A person on our team can read it for you and reply by email within one working day.'
      : e === 'fetch' ? (d.status ? 'The website answered with an error' + st + ' when we tried to read it. It may be down for a moment: try again later.' : 'We could not reach the website: it did not answer in time. It may be down for a moment: try again later.') + ' A person on our team can also read it for you and reply by email within one working day.'
      : e === 'empty' ? 'Only ' + (d.read_chars != null ? Number(d.read_chars).toLocaleString('en') + ' characters' : 'a few words') + ' of text reached us. The page is probably built in the browser with JavaScript, and we found no other page on the site that we could read instead. Paste the exact page of the project or listing, or a person on our team can read it for you.'
      : 'Something went wrong on our side. A person on our team will look at it and reply by email within one working day.';
    $('az-4').innerHTML = '<p class="az-k">Desk review</p><h2>' + (e === 'blocked' ? 'This website blocked our reader' : e === 'empty' ? 'We could not read enough of this page' : 'We will take it from here') + '</h2><p class="lead">' + m + '</p>' + (e === 'empty' ? pagesFound(d.pages_found, 'Pages on this site that may hold the offer:') : '') + cta();
    show(4); ev('desk_error', { e: e || '' }); if (window.kbLog) kbLog('desk_error', url + ' | ' + (e || ''));
  }
  function cta(){ setTimeout(bindReq, 0); return '<div class="az-cta" id="azreq"><div><b>Get the full check: €490</b><p>Land certificate checked at the land office, building permit confirmed in the official system, a site visit with GPS-stamped photos (on request) and a contract review. Written report in 7 days. Full refund if we can\'t take your case.</p></div><button class="btn btn-hi" type="button" id="azreq-go" data-ev="req_open">Request this check</button></div>'; }
  function bindReq(){ var b = $('azreq-go'); if (!b) return; b.onclick = function(){
    var box = $('azreq'); box.classList.add('open');
    box.innerHTML = '<form class="az-reqf" id="azreqf"><b>Request a full check of ' + esc(new URL(url).hostname.replace(/^www\./, '')) + '</b>' +
      '<label>Your name<input name="n" autocomplete="name" required></label>' +
      '<label>Your email<input name="e" type="email" autocomplete="email" required value="' + esc(knownEmail()) + '"></label>' +
      '<label>When is your next payment or signing? <small>(optional)</small><input name="d" type="date"></label>' +
      '<label>Anything we should know? <small>(optional)</small><textarea name="m" rows="3" placeholder="Unit number, what worries you, the developer\'s answers so far…"></textarea></label>' +
      '<button class="btn btn-hi" type="submit">Send request</button><p class="muted" style="font-size:.82rem;margin:8px 0 0">No payment yet. We confirm we can take the case first, by email, usually the same day.</p></form>';
    ev('req_open');
    $('azreqf').setAttribute('novalidate', '');
    $('azreqf').onsubmit = function(e){ e.preventDefault(); var f = this, n = f.n.value.trim(), em = f.e.value.trim(), sb = f.querySelector('button[type=submit]'), er = f.querySelector('.fe');
      if (!er) { er = document.createElement('p'); er.className = 'fe'; er.setAttribute('role', 'alert'); sb.parentNode.insertBefore(er, sb.nextSibling); }
      f.n.removeAttribute('aria-invalid'); f.e.removeAttribute('aria-invalid');
      if (!n) { er.textContent = 'Add your name.'; f.n.setAttribute('aria-invalid', 'true'); f.n.focus(); return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { er.textContent = 'Add a valid email address, so we can reply.'; f.e.setAttribute('aria-invalid', 'true'); f.e.focus(); return; }
      er.textContent = ''; sb.disabled = true; var lb = sb.textContent; sb.textContent = 'Sending…';
      try { localStorage.setItem('kb-desk-email', em); } catch (x) {}
      var ref = 'KB-' + Date.now().toString(36).slice(-5).toUpperCase();
      fetch(SB, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_name: n, p_email: em, p_country: '', p_phone: '', p_who: 'buyer | check request ' + ref, p_bring: ('Next payment: ' + (f.d.value || 'n/a') + ' | ' + f.m.value).slice(0, 4000), p_learn: url.slice(0, 300), p_week: f.d.value || '', p_lang: 'en', p_source: 'check-request | ' + location.pathname, p_plan: 'check-request' }) })
      .then(function(r){ return r.json().catch(function(){ return null; }).then(function(d){ if (!r.ok) throw new Error('http'); return d; }); })
      .then(function(d){ if (d === 'too_many') { sb.disabled = false; sb.textContent = lb; er.textContent = 'We already have a request from this email. We will reply soon.'; return; } done(); })
      .catch(function(){ sb.disabled = false; sb.textContent = lb; er.innerHTML = 'Your request could not be sent. Check your connection and try again, or write to <a href="mailto:carlos@kolaboro.com?subject=' + encodeURIComponent('Full check: ' + url) + '">carlos@kolaboro.com</a>.'; });
      function done(){
      ev('generate_lead', { role: 'check_request' });
      box.innerHTML = '<div class="az-done"><p class="az-k">Request received · ' + ref + '</p><b>Thanks, ' + esc(n.split(' ')[0]) + '. We have your request.</b>' +
        '<ol><li>We check that we can cover this project and reply to <b>' + esc(em) + '</b>, usually the same day.</li><li>Once you pay, the check starts with the land office and the permit; site visits are on request, so we first confirm a local agent for your location before you pay.</li><li>You get a login to follow the case, and the written report within 7 days.</li></ol>' +
        '<div class="row"><a class="btn btn-hi" href="/es/pricing/?s=check#kreq" data-ev="req_check_desk">Solicitar la comprobación de 490 €</a><a class="btn btn-line" href="/report/sample/">See a sample report</a></div>' +
        '<p class="muted" style="font-size:.82rem;margin:10px 0 0">PayPal or card. Full refund if we can\'t take your case. Keep your reference: ' + ref + '.</p></div>';
      }
    };
  }; }

  function bench(r){
    var el = $('az-bench'); if (!el) return;
    var pc = String(r.permit_claim || ''), ok = [
      ['Permit or registration number', /\d{3,}/.test(pc)], ['Title type stated', !!r.title_type], ['Completion date stated', !!r.completion],
      ['Payment plan stated', !!r.payment_plan], ['No "guaranteed" returns', r.guaranteed_language === false || r.guaranteed_language === 'false'],
      ['Deposit protection mentioned', /escrow|trust|fideicomiso|guarantee|garant/i.test(JSON.stringify(r.promises || []) + ' ' + (r.payment_plan || '')) && !/escrow/i.test(JSON.stringify(r.missing || []))]];
    var sc = ok.filter(function(x){ return x[1]; }).length;
    el.innerHTML = '<div class="az-bx"><div><h3>' + sc + ' of 6 things a buyer needs are on this page</h3><ul class="k6">' + ok.map(function(x){ return '<li class="' + (x[1] ? 'y' : 'n') + '"><i>' + (x[1] ? '✓' : '✗') + '</i>' + x[0] + '</li>'; }).join('') + '</ul></div><div id="az-mk"></div></div>';
    fetch('/data/bali-cases.json?t=' + Math.floor(Date.now() / 6e5)).then(function(x){ return x.json(); }).then(function(d){
      var C = (d && d.cases) || [], loc = ((r.location || '') + ' ' + (r.country || '')).toLowerCase();
      var mk = null; C.forEach(function(c){ if (!mk && (loc.indexOf(c.market.toLowerCase()) >= 0 || (c.region && loc.indexOf(String(c.region).toLowerCase()) >= 0))) mk = c.market; });
      if (!mk) C.forEach(function(c){ if (!mk && loc.indexOf(String(c.country).toLowerCase()) >= 0) mk = c.market; });
      var L = C.filter(function(c){ return mk ? c.market === mk : true; }); if (!L.length) return;
      function pct(f){ return Math.round(L.filter(f).length / L.length * 100) + '%'; }
      $('az-mk').innerHTML = '<h3>Compared with ' + L.length + ' projects we track' + (mk ? ' in ' + esc(mk) : ' worldwide') + '</h3><ul class="az-cmp"><li><b>' + pct(function(c){ return c.docs; }) + '</b> publish a permit or licence number</li>' +
        (L[0].checks ? '<li><b>' + pct(function(c){ return c.checks && c.checks.escrow === true; }) + '</b> say how deposits are protected</li><li><b>' + pct(function(c){ return (c.flags || []).length; }) + '</b> have problems in public reports</li>' : '') +
        '<li><b>' + pct(function(c){ return c.plans; }) + '</b> publish plans</li>' + (L[0].claims !== undefined ? '<li><b>' + pct(function(c){ return c.claims && c.claims.contradicted > 0; }) + '</b> have at least one developer claim contradicted by another source</li>' : '') + '</ul>' +
        (function(){ var ctry = (L[0].country || '').toLowerCase(), RG = { 'uae': mk === 'Abu Dhabi' ? 'abu-dhabi' : mk === 'Ras Al Khaimah' ? 'ras-al-khaimah' : 'dubai', 'oman': 'oman', 'egypt': 'egypt', 'thailand': 'thailand', 'malaysia': 'malaysia', 'philippines': 'philippines', 'indonesia': 'indonesia', 'turkey': 'turkey', 'portugal': 'portugal', 'spain': 'spain', 'greece': 'greece', 'united kingdom': 'uk', 'usa': 'usa', 'mexico': 'mexico', 'dominican republic': 'dominican-republic', 'costa rica': 'costa-rica', 'australia': 'australia' }, a = mk ? RG[ctry] : null;
          return '<p class="az-next"><b>Check it further:</b> ' + (mk ? '<a href="/m/?market=' + encodeURIComponent(mk) + '">' + esc(mk) + ' market data</a> · ' : '') + (a ? '<a href="/registers/#' + a + '">official registers you can search</a> · ' : '<a href="/registers/">official registers by country</a> · ') + '<a href="/tools/deposit-protection/' + (mk ? '?market=' + encodeURIComponent(mk) : '') + '">deposit protection here</a> · <a href="/tools/payment-risk/">score your payment plan</a> · <a href="/cases' + (mk ? '?q=' + encodeURIComponent(mk) : '') + '">projects we track' + (mk ? ' in ' + esc(mk) : '') + '</a></p>'; })();
    }).catch(function(){});
  }

  function isResale(r){
    var t = [r.summary, r.project, r.title_type, r.completion].join(' ');
    var src = ''; try { src = (JSON.parse(localStorage.getItem('kb-attr') || '{}').src || ''); } catch (e) {}
    if (/off-?plan|under construction|pre-?sale|handover|completion in|launch/i.test(t)) return false;
    return /resale|second-hand|secondhand|existing (home|house|apartment|flat|villa)|pre-owned|built in (1[89]|20)\d\d|renovat/i.test(t) || (src === 'realhunt' && !r.completion && !r.payment_plan);
  }

  function r29pos(){ var c = $('az-cp'), l = $('az-4') && $('az-4').querySelector('.lead'); if (c && l) l.parentNode.insertBefore(c, l.nextSibling); var b = c && c.querySelector('label'); if (b) b.innerHTML = '<b>Where should we send it?</b> <span>Your email, and we reply within one working day.</span>'; }
  function sigBind(d){ var b = $('az-sigv'); if (!b) return; b.onclick = function(){
    var S = d.signature, out = $('az-sigr'), C = window.crypto && crypto.subtle, te = new TextEncoder();
    function b64(x){ return Uint8Array.from(atob(x), function(c){ return c.charCodeAt(0); }); }
    if (!C) { out.textContent = 'Your browser has no WebCrypto.'; return; }
    C.digest('SHA-256', te.encode(S.signed_json)).then(function(h){ var hex = Array.prototype.map.call(new Uint8Array(h), function(x){ return ('0' + x.toString(16)).slice(-2); }).join('');
      var same = (function(){ try { var a = JSON.parse(S.signed_json); return a.report && JSON.stringify(a.report) === JSON.stringify(d.report); } catch (e) { return false; } })();
      return C.importKey('raw', b64(S.public_key), { name: 'Ed25519' }, false, ['verify']).then(function(k){ return C.verify({ name: 'Ed25519' }, k, b64(S.sig), te.encode('kolaboro-sig-v1\n' + hex)); })
        .then(function(ok){ out.textContent = ok && same ? '✓ Valid: this review is exactly what our server signed.' : ok ? 'Signature valid, but the review shown differs from the signed text.' : '✗ Signature does not match.'; });
    }).catch(function(){ out.textContent = 'Your browser cannot check Ed25519 signatures yet. The signed text and key are in the response; see /verify.'; });
  }; }
  function render(d){
    var r = d.report || {}, att = (r.attention || 'medium').toLowerCase();
    if ((d.not_property || r.page_kind === 'not_real_estate') && (d.thin_text || r.thin_text)) {
      $('az-4').innerHTML = '<p class="az-k">Desk review</p><h2>We could not read enough of ' + esc(d.host) + '</h2>' +
        '<p class="lead">Only ' + esc(String(r.read_chars || 'a few hundred')) + ' characters of text reached us. Many sites build the page in the browser with JavaScript, so this says nothing about whether the site sells property.</p>' +
        '<p>Paste the exact page of the project or the listing you are looking at (for example the "Invest" or "Residences" page), and we will read that one.</p>' + pagesFound(r.pages_found, 'Pages on this site that may hold the offer:') +
        '<p><button class="btn btn-hi" type="button" id="az-again">Check another link</button></p>';
      show(4); var ag0 = $('az-again'); if (ag0) ag0.onclick = function(){ $('az-url').value = ''; show(1); setTimeout(function(){ $('az-url').focus(); }, 300); };
      ev('desk_thin_text', {}); return;
    }
    if (d.not_property || r.page_kind === 'not_real_estate') {
      $('az-4').innerHTML = '<p class="az-k">Desk review</p><h2>' + esc(d.host) + ' is not a property project</h2>' +
        '<p class="lead">' + esc(r.site_about ? 'It looks like ' + (d.lang && d.lang !== 'en' ? r.site_about : /^(a|an|the)\s/i.test(r.site_about) ? r.site_about.charAt(0).toLowerCase() + r.site_about.slice(1) : (/^[aeiou]/i.test(r.site_about) ? 'an ' : 'a ') + (/^[A-Z][a-z]+\s+[a-z]/.test(r.site_about) && !/^(Spanish|English|French|German|Italian|Danish|American|British|Indonesian|Mexican|Portuguese|Thai|Dutch)/.test(r.site_about) ? r.site_about.charAt(0).toLowerCase() + r.site_about.slice(1) : r.site_about)).replace(/\.$/, '') + '.' : 'We could not find anything about a property for sale on this page.') + ' There is nothing for us to check here.</p>' +
        '<p>Kolaboro reviews the website of an <b>off-plan project</b>, a <b>developer</b> or a <b>property listing</b>. Paste the page of the home you want to buy, for example the project page on the developer\'s site or the listing on a portal.</p>' + pagesFound(r.pages_found, 'Other pages on this site you could check:') +
        '<p><button class="btn btn-hi" type="button" id="az-again">Check another link</button></p>';
      show(4); var ag = $('az-again'); if (ag) ag.onclick = function(){ $('az-url').value = ''; show(1); setTimeout(function(){ $('az-url').focus(); }, 300); };
      ev('desk_not_property', {}); if (window.kbLog) kbLog('desk_not_property', url); return;
    }
    var portal = r.page_kind === 'agency_or_portal';
    var facts = [['Project', r.project], ['Developer', r.developer], ['Location', r.location], ['Price from', r.price_from, 'price_from'], ['Title', r.title_type, 'title_type'], ['Lease', r.lease_years, 'lease_years'], ['Completion', r.completion, 'completion'], ['Return advertised', r.advertised_return, 'advertised_return'], ['Permit claim', r.permit_claim, 'permit_claim']].filter(function(f){ return f[1]; });
    var ci = r.citations || null, qc = r.quote_check || null;
    function fq(f){ if (!ci || !f[2]) return ''; var q = (ci.fields || {})[f[2]]; return q ? '<span class="fq"><i class="kq">' + esc(q) + '</i></span>' : '<span class="fq no">no exact quote found on the page</span>'; }
    var promList = ci ? (ci.promises || []).map(function(c){ return '<li>' + esc(c.claim) + '<span><i class="kq">' + esc(c.quote) + '</i></span></li>'; }).join('') : (r.promises || []).map(function(q){ return '<li>' + esc(q) + '</li>'; }).join('');
    var qline = qc ? '<div class="qline"><b>✓ ' + qc.checked + ' claim' + (qc.checked === 1 ? '' : 's') + ' checked against the page, ' + qc.removed + ' removed</b><span>' + qc.fields_with_quote + ' of ' + qc.fields_stated + ' facts above are backed by an exact quote. A claim stays only if its quote is found word for word in the page text.</span>' +
      ((qc.removed_items || []).length ? '<details><summary>What was removed and why</summary><ul>' + qc.removed_items.map(function(x){ return '<li>' + esc(x.text) + ' <span class="muted">(' + esc(x.reason || 'quote not found on the page') + ')</span></li>'; }).join('') + '</ul></details>' : '') + '</div>' : '';
    var sig = d.signature && d.signature.sig ? '<p class="muted sigl">Signed with Ed25519 · SHA-256 ' + esc(String(d.signature.sha256).slice(0, 16)) + '… · <button type="button" id="az-sigv">Verify the signature in your browser</button> <span id="az-sigr"></span></p>' : '';
    var first = portal ? 'Desk review of a portal or agency page' : d.first ? 'Nobody had asked us about this project before. Your review is the first one.' : (d.tracked ? 'Our agent already follows this project.' : 'Desk review');
    $('az-4').innerHTML = '<p class="az-k">' + esc(first) + '</p><h2>Desk review: ' + esc(r.project || d.host) + '</h2>' +
      ((d.read_url || r.read_url) ? '<p class="muted" style="font-size:.92rem">The page you pasted does not state the offer itself, so we read the page on the same site where it is sold: <a href="' + esc(d.read_url || r.read_url) + '" rel="nofollow noopener" target="_blank">' + esc((d.read_url || r.read_url).replace(/^https?:\/\//, '')) + '</a>.' + ((r.pages_found || []).length ? ' Other pages we found: ' + r.pages_found.slice(0, 5).map(function(x){ return '<a href="/check?url=' + encodeURIComponent(x) + '#analyze">' + esc(x.replace(/^https?:\/\/(www\.)?/, '')) + '</a>'; }).join(', ') + '.' : '') + '</p>' : '') +
      (r.read_chars != null && r.read_chars < 1500 && !(d.read_url || r.read_url) ? '<p class="az-note" style="background:#fff4ec;border-radius:12px;padding:12px 14px">We could read only ' + Number(r.read_chars).toLocaleString('en') + ' characters of this page: most of it is built in the browser, so the review below is based on very little. Paste the page of the one project or home you want to buy for a fuller answer.</p>' : '') +
      '<p><span class="az-att ' + esc(att) + '">' + (att === 'high' ? 'High attention needed' : att === 'low' ? 'Low attention needed' : 'Medium attention needed') + '</span></p>' +
      '<p class="lead" style="margin-top:12px">' + esc(r.summary) + '</p>' +
      (ci && (ci.summary || []).length ? '<p class="sq"><span class="muted">From the page: </span>' + ci.summary.map(function(q){ return '<i class="kq">' + esc(q) + '</i>'; }).join(' ') + '</p>' : '') + qline +
      (r.ai_manipulation && r.ai_manipulation.detected ? '<div class="az-note" role="alert" style="background:#FDECEC;border:1px solid #F3B4B4;border-radius:12px;padding:12px 14px;margin-top:12px"><b>Warning: this website contains text aimed at automated reviewers.</b> ' + ((r.ai_manipulation.evidence || []).some(function(x){ return x.where === 'hidden'; }) ? 'Part of it is hidden from visitors. ' : '') + 'We did not follow it, and it raised the attention level. What we found:<ul style="margin:8px 0 0">' + (r.ai_manipulation.evidence || []).map(function(x){ return '<li><i>' + esc(x.where === 'hidden' ? 'Hidden text' : x.where === 'model' ? 'Flagged by the model' : 'Visible text') + ':</i> "' + esc(x.text) + '"</li>'; }).join('') + '</ul><p style="margin:8px 0 0;font-size:.85rem">How we handle this: <a href="/engineering/ai-safety/">our defences against manipulated pages</a>.</p></div>' : '') +
      (portal ? '<p class="az-note" style="background:#fff4ec;border-radius:12px;padding:12px 14px">This page lists many properties, so the review is general. For a precise answer, paste the page of the <b>one project or home</b> you want to buy.</p>' : '') +
      (facts.length ? '<div class="az-facts">' + facts.map(function(f){ return '<div><span>' + f[0] + '</span><b>' + esc(f[1]) + fq(f) + '</b></div>'; }).join('') + '</div>' : '') +
      '<div id="az-bench"></div>' + '<div class="az-res"><div class="az-box"><h3>Ask these before you pay</h3><ol>' + (r.questions || []).map(function(q){ return '<li>' + esc(q) + '</li>'; }).join('') + '</ol></div>' +
      '<div class="az-box"><h3>What the website promises</h3><ul class="cl">' + promList + '</ul>' + (ci && !(ci.promises || []).length ? '<p class="muted" style="font-size:.86rem">No claim could be matched to an exact quote on the page.</p>' : '') +
      ((r.missing || []).length ? '<h3 style="margin-top:14px">What it doesn\'t say</h3><ul>' + r.missing.map(function(q){ return '<li>' + esc(q) + '</li>'; }).join('') + '</ul>' : '') + '</div></div>' +
      cta() + '<p class="muted" style="font-size:.82rem;margin-top:12px">Automated desk review of what the website itself says, on ' + new Date(d.analysed).toUTCString().slice(5, 16) + '. Advertised claims, not verified facts, and not a judgement of the developer. The questions and the gaps are ours, not quotes. <a href="/check/red-team/">Intenta engañar a esta comprobación</a>.</p>' + sig;
    show(4); sigBind(d); if (!isResale(r) && !portal) bench(r); ev('desk_done', { att: att, first: !!d.first }); if (window.kbLog) kbLog('desk_done', url);
  }
})();
