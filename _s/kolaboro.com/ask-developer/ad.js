/* Ask the developer: six standard questions tailored to the project's gaps, sent from the buyer's own email; anonymous report-back */
(function(){
  function $(i){ return document.getElementById(i); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function post(p, b){ return fetch('/api/x/y/' + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }).then(function(r){ return r.json().catch(function(){ return { error: 'http ' + r.status }; }); }); }
  var LS = 'kb-ask-dev', Q = null, STARTED = false;
  function mine(){ try { return JSON.parse(localStorage.getItem(LS) || '[]'); } catch (e) { return []; } }
  function keep(x){ try { var L = mine().filter(function(y){ return y.t !== x.t; }); L.unshift(x); localStorage.setItem(LS, JSON.stringify(L.slice(0, 20))); } catch (e) {} }
  function sel(){ return Array.prototype.map.call(document.querySelectorAll('#adlist input:checked'), function(i){ return i.value; }); }
  function text(){ var ids = sel(), qs = Q.questions.filter(function(q){ return ids.indexOf(q.id) >= 0; });
    return 'Hello,\n\nI am interested in buying a unit in [project name]. Before I pay any deposit, could you please answer these questions in writing?\n\n' + qs.map(function(q, i){ return (i + 1) + '. ' + q.topic + ': ' + q.question; }).join('\n\n') + '\n\nThank you. I will keep your written answers with my purchase documents.\n'; }
  function refresh(){ var t = text(); $('adpre').textContent = t; $('admail').href = 'mailto:?subject=' + encodeURIComponent(Q.subject) + '&body=' + encodeURIComponent(t); $('admail').classList.toggle('y-hidden', !sel().length); }
  function load(id){
    id = String(id || '').trim().toUpperCase(); var o = $('adout');
    if (!/^[A-Z]{2,5}-\d{3,4}$/.test(id)) { o.innerHTML = '<span class="y-err">Enter an id like BALI-014.</span>'; return; }
    o.textContent = 'Loading…';
    fetch('/api/x/y/asks/questions?id=' + encodeURIComponent(id)).then(function(r){ return r.json(); }).then(function(d){
      if (d.error) { o.innerHTML = '<span class="y-err">' + (d.error === 'not_found' ? 'No tracked project has this id.' : 'Could not load the questions.') + '</span>'; return; }
      Q = d; STARTED = false; o.innerHTML = '<a href="/p/?id=' + encodeURIComponent(id) + '">' + esc(id) + '</a>: ' + esc(d.region === d.market ? d.market : d.region + ', ' + d.market) + (d.stage ? ', ' + esc(d.stage) : '') + '.';
      $('adlead').textContent = d.missing + ' of 6 topics are not covered by what this project publishes; they come first. Untick any question you do not want to send.';
      $('adlist').innerHTML = d.questions.map(function(q){ return '<li><label><input type="checkbox" value="' + esc(q.id) + '" checked><span><b>' + esc(q.topic) + '.</b> ' + esc(q.question) + '<span class="why' + (q.missing ? ' miss' : '') + '">' + esc(q.why) + '</span><span class="ck">A checkable answer: ' + esc(q.checkable_answer) + '</span></span></label></li>'; }).join('');
      $('adq').classList.remove('y-hidden'); $('adsent').classList.add('y-hidden'); refresh(); stats(id);
      try { history.replaceState(null, '', location.pathname + '?id=' + encodeURIComponent(id)); } catch (x) {}
    }).catch(function(){ o.innerHTML = '<span class="y-err">Network error.</span>'; });
  }
  function started(){
    if (STARTED || !Q) return; STARTED = true; var box = $('adsent'), ids = sel();
    post('asks/start', { id: Q.id, questions: ids }).then(function(d){
      box.classList.remove('y-hidden');
      if (d.ok && d.token) {
        keep({ t: d.token, id: Q.id, d: new Date().toISOString().slice(0, 10) });
        box.innerHTML = '<h3>When the developer replies, or does not</h3><p>Come back to this private link and tell us in one click. It is saved in this browser too.</p><p><a href="' + esc(d.report_url) + '">' + esc(d.report_url) + '</a></p><p class="y-small">The link is the only way to report on this email. We stored the project id and which questions you asked, nothing else.</p>';
      } else box.innerHTML = '<p>' + esc(d.message || 'Reporting back is not available right now.') + '</p>';
    }).catch(function(){});
  }
  $('adf').addEventListener('submit', function(e){ e.preventDefault(); load($('adid').value); });
  $('adlist').addEventListener('change', function(){ refresh(); });
  $('admail').addEventListener('click', function(){ started(); });
  $('adcopy').addEventListener('click', function(){ var t = text(); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function(){ $('adcopy').textContent = 'Copied'; }).catch(function(){ $('adcopy').textContent = 'Select the text below to copy'; }); started(); });
  function report(t){
    var sec = $('adrep'), box = $('adrepbox'); sec.classList.remove('y-hidden'); box.textContent = 'Loading…';
    Promise.all([post('asks/get', { t: t }), fetch('/data/mystery-shopper.json').then(function(r){ return r.json(); }).catch(function(){ return {}; })]).then(function(a){
      var d = a[0], ms = a[1], topic = {}; ((ms || {}).questionnaire || []).forEach(function(q){ topic[q.id] = q.topic; });
      if (!d.ok) { box.innerHTML = '<span class="y-err">' + (d.error === 'not_open' ? 'Reporting back opens soon.' : 'This link is not valid.') + '</span>'; return; }
      var sent = String(d.sent || '').slice(0, 10), today = new Date().toISOString().slice(0, 10);
      box.innerHTML = '<p>You asked about <a href="/p/?id=' + encodeURIComponent(d.project) + '">' + esc(d.project) + '</a> on ' + esc(sent) + '.' + (d.reported_at ? ' Your last report: ' + (d.answered ? 'answered on ' + esc(d.answered_on) : 'no answer yet') + '. You can change it.' : '') + '</p>' +
        '<div class="y-acts"><button type="button" class="btn btn-line btn-sm" id="adno">No answer yet</button><button type="button" class="btn btn-hi btn-sm" id="adyes">They answered</button></div>' +
        '<form id="adyesf" class="y-hidden"><div class="y-row"><label for="adon">Answer date</label><input type="date" id="adon" min="' + esc(sent) + '" max="' + today + '" value="' + esc(d.answered_on || today) + '"></div>' +
        '<p><b>Which questions got a checkable answer?</b> (a number, a document or a named bank you can verify, not a promise)</p><ul class="y-q">' + (d.questions || []).map(function(q){ return '<li><label><input type="checkbox" value="' + esc(q) + '"' + ((d.checkable || []).indexOf(q) >= 0 ? ' checked' : '') + '><span>' + esc(topic[q] || q) + '</span></label></li>'; }).join('') + '</ul>' +
        '<div class="y-acts"><button class="btn btn-hi btn-sm" type="submit">Save my report</button></div></form><p id="adrepout" class="y-out" aria-live="polite"></p>';
      function save(b){ b.t = t; $('adrepout').textContent = 'Saving…'; post('asks/report', b).then(function(r){ $('adrepout').innerHTML = r.ok ? '<span class="y-ok">Saved. Thank you: this is how other buyers learn which developers answer.</span>' : '<span class="y-err">' + esc(r.message || 'Could not save.') + '</span>'; }); }
      $('adno').addEventListener('click', function(){ save({ answered: false }); });
      $('adyes').addEventListener('click', function(){ $('adyesf').classList.remove('y-hidden'); });
      $('adyesf').addEventListener('submit', function(e){ e.preventDefault(); save({ answered: true, answered_on: $('adon').value, checkable: Array.prototype.map.call(document.querySelectorAll('#adyesf input[type=checkbox]:checked'), function(i){ return i.value; }) }); });
    }).catch(function(){ box.innerHTML = '<span class="y-err">Network error.</span>'; });
  }
  function fmt(x, label){ if (!x) return ''; return '<tr><td>' + esc(label) + '</td><td class="n">' + x.reports + '</td><td class="n">' + x.answer_rate_pct + '%</td><td class="n">' + (x.median_days_to_answer == null ? '' : x.median_days_to_answer) + '</td><td class="n">' + (x.checkable_answers_pct == null ? '' : x.checkable_answers_pct + '%') + '</td></tr>'; }
  function stats(id){
    fetch('/api/x/y/asks/stats' + (id ? '?id=' + encodeURIComponent(id) : '')).then(function(r){ return r.json(); }).then(function(s){
      var box = $('adstats');
      if (!s.open) { box.innerHTML = '<p><b>Opens soon.</b> The table that keeps anonymous outcomes is not installed yet. You can still prepare and send your questions.</p>'; return; }
      var rows = fmt(s.project, id || '') + fmt(s.market, id ? id.split('-')[0] + ' projects' : '') + fmt(s.all, 'All projects') + (s.markets || []).filter(function(m){ return !id || m.prefix !== id.split('-')[0]; }).map(function(m){ return fmt(m, m.prefix + ' projects'); }).join('');
      box.innerHTML = '<p>' + s.opened + ' email' + (s.opened === 1 ? '' : 's') + ' prepared, ' + s.reported + ' report' + (s.reported === 1 ? '' : 's') + ' back so far. Minimum ' + s.min_sample + ' reports per group.</p>' +
        (rows ? '<div class="y-scroll"><table class="y-tbl"><thead><tr><th>Group</th><th class="n">Reports</th><th class="n">Answered</th><th class="n">Median days to answer</th><th class="n">Checkable answers</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p>No group has 5 reports yet, so no figures are shown.</p>') +
        (id && !s.project ? '<p class="y-small">' + esc(id) + ': fewer than 5 reports, no figures yet.</p>' : '');
    }).catch(function(){ $('adstats').textContent = 'Could not load the figures.'; });
  }
  var L = mine(); if (L.length) { var m = $('admine'); m.classList.remove('y-hidden'); m.innerHTML = '<h3>Your questions in this browser</h3><ul>' + L.map(function(x){ return '<li>' + esc(x.id) + ', ' + esc(x.d) + ': <a href="/ask-developer/?r=' + esc(x.t) + '">report back</a></li>'; }).join('') + '</ul>'; }
  var q = new URLSearchParams(location.search);
  if (q.get('r') && /^[0-9a-f]{48}$/.test(q.get('r'))) report(q.get('r'));
  if (q.get('id')) { $('adid').value = q.get('id'); load(q.get('id')); } else stats('');
})();
