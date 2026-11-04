/* Search alerts in plain language: parse -> confirm -> double opt-in. API: /api/x/y/alerts/* */
(function(){
  function $(i){ return document.getElementById(i); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function post(p, b){ return fetch('/api/x/y/' + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }).then(function(r){ return r.json().catch(function(){ return { error: 'http ' + r.status }; }); }); }
  var CUR = null, OPEN = false;
  fetch('/api/x/y/status').then(function(r){ return r.json(); }).then(function(s){
    var a = s.alerts || {}; OPEN = !!a.open;
    $('saopentxt').innerHTML = OPEN ? '<b>Email alerts are open.</b> At most one email a day, a stop link in every email.' :
      '<b>Email alerts open soon.</b> You can already write and check an alert below; saving it needs ' + (!a.table && !a.email_sender ? 'the alerts table and the email sender, which are not connected yet.' : !a.table ? 'the alerts table, which is not installed yet.' : 'the email sender, which is not connected yet.') + ' Nothing is stored until then.';
    if (!OPEN) { $('sasavebtn').disabled = true; $('saemail').disabled = true; }
  }).catch(function(){ $('saopentxt').textContent = 'Could not check whether alerts are open.'; });
  Array.prototype.forEach.call(document.querySelectorAll('[data-ex]'), function(b){ b.addEventListener('click', function(){ $('satext').value = b.getAttribute('data-ex'); $('satext').focus(); }); });
  $('saf').addEventListener('submit', function(e){
    e.preventDefault(); var t = $('satext').value.trim(), o = $('saout');
    if (t.length < 6) { o.innerHTML = '<span class="y-err">Write a little more: a place, a budget, what must be published.</span>'; return; }
    $('sago').disabled = true; o.textContent = 'Reading your alert…';
    post('alerts/parse', { text: t }).then(function(d){
      $('sago').disabled = false;
      if (d.error) { o.innerHTML = '<span class="y-err">' + esc(d.message || 'Could not read it. Try again.') + '</span>' + (d.not_used && d.not_used.length ? '<p class="y-small">Not understood: ' + d.not_used.map(esc).join(', ') + '</p>' : ''); $('sastep2').classList.add('y-hidden'); return; }
      CUR = d; o.innerHTML = '<span class="y-ok">Read.</span> Check the filter below.';
      $('salabels').innerHTML = d.labels.map(function(l){ return '<li>' + esc(l.t) + '</li>'; }).join('');
      $('sanote').textContent = d.labels.filter(function(l){ return l.note; }).map(function(l){ return l.note; }).join(' ');
      $('sanot').innerHTML = d.not_used && d.not_used.length ? 'Not part of the filter (our data cannot check it, or the place is not in the database): <ul class="y-chips">' + d.not_used.map(function(x){ return '<li class="no">' + esc(x) + '</li>'; }).join('') + '</ul>' : '';
      $('sacount').innerHTML = '<b>' + d.matching_today + '</b> project' + (d.matching_today === 1 ? '' : 's') + ' match today (data of ' + esc(d.data_updated) + ')' + (d.examples && d.examples.length ? ': ' + d.examples.map(function(c){ return '<a href="/p/?id=' + encodeURIComponent(c.id) + '">' + esc(c.id) + '</a>'; }).join(', ') + (d.matching_today > d.examples.length ? ' and more.' : '.') : '. None yet: that is what the alert is for.');
      $('sastep2').classList.remove('y-hidden'); $('saok').checked = false; $('sasaveout').textContent = '';
      $('sastep2').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }).catch(function(){ $('sago').disabled = false; o.innerHTML = '<span class="y-err">Network error. Try again.</span>'; });
  });
  $('sasave').addEventListener('submit', function(e){
    e.preventDefault(); var o = $('sasaveout');
    if (!OPEN) { o.textContent = 'Email alerts open soon. Nothing was saved.'; return; }
    if (!CUR) return; if (!$('saok').checked) { o.innerHTML = '<span class="y-err">Tick the box to confirm the filter is what you want.</span>'; return; }
    var em = $('saemail').value.trim(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { o.innerHTML = '<span class="y-err">That email does not look right.</span>'; return; }
    $('sasavebtn').disabled = true; o.textContent = 'Saving…';
    post('alerts/save', { email: em, text: CUR.text, filter: CUR.filter }).then(function(d){
      $('sasavebtn').disabled = false;
      o.innerHTML = d.ok ? '<span class="y-ok">' + esc(d.message) + '</span>' : '<span class="y-err">' + esc(d.message || 'Could not save.') + '</span>';
    }).catch(function(){ $('sasavebtn').disabled = false; o.innerHTML = '<span class="y-err">Network error.</span>'; });
  });
  var q = new URLSearchParams(location.search), ct = q.get('confirm'), st = q.get('stop');
  if (ct || st) {
    var box = $('satok'); box.classList.remove('y-hidden'); box.textContent = ct ? 'Confirming your alert…' : 'Stopping…';
    (ct ? post('alerts/confirm', { t: ct }) : post('alerts/stop', { t: st })).then(function(d){
      if (!d.ok) { box.innerHTML = '<span class="y-err">' + esc(d.message || (d.error === 'not_open' ? 'Alerts are not open yet.' : 'This link is not valid.')) + '</span>'; return; }
      box.innerHTML = ct ? '<p class="y-ok">' + (d.already ? 'This alert was already confirmed.' : 'Your alert is on.') + '</p><p>"' + esc(d.sentence) + '"</p>' + (d.labels ? '<ul class="y-chips">' + d.labels.map(function(l){ return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' : '') + '<p class="y-small">To stop it, use the stop link in the confirmation email.</p>'
        : '<p class="y-ok">' + (d.all ? 'Stopped ' + d.stopped + ' alert' + (d.stopped === 1 ? '' : 's') + ' for your address.' : 'This alert is stopped.') + '</p>';
      try { history.replaceState(null, '', location.pathname + '#stop'); } catch (x) {}
      box.scrollIntoView({ block: 'center' });
    }).catch(function(){ box.innerHTML = '<span class="y-err">Network error. Reload the page to try again.</span>'; });
  }
  fetch('/api/x/y/alerts/stats').then(function(r){ return r.json(); }).then(function(s){
    if (!s.open) return; $('sastats').textContent = s.live + ' alert' + (s.live === 1 ? '' : 's') + ' on, ' + s.digests_sent + ' alert email' + (s.digests_sent === 1 ? '' : 's') + ' sent so far' + (s.last_run && s.last_run.at ? ', last check ' + String(s.last_run.at).slice(0, 10) : '') + '.';
  }).catch(function(){});
})();
