/* Kolaboro /tools/insolvency-check/: live exact-name insolvency lookup (The Gazette UK, BORME Spain) and the daily watch.
   Data: /api/x/w/insolvency?name= (live, rate-limited) and /api/x/w/insolvency/watch (daily batch, anonymised). */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fmt = function (n) { return n == null ? '-' : Number(n).toLocaleString('en-US'); };
  var safe = function (u) { return /^https:\/\/(www\.thegazette\.co\.uk|www\.boe\.es|www\.publicidadconcursal\.es)\//.test(u || '') ? u : null; };
  var FORM = /(\b(limited|ltd\.?|plc|llp|llc|l\.l\.c\.|inc\.?|corp\.?|corporation|gmbh|s\.?a\.?u?|s\.?l\.?u?|sociedad limitada( unipersonal)?|sociedad an[oó]nima( unipersonal)?|b\.?v\.?|pty\.? ltd\.?|sdn\.? bhd\.?|co\.?,? ltd\.?|company limited|pcl|pjsc|fze|fzco|fz-llc|dmcc|lda)\.?\s*$)|^pt\.?\s+\S/i;

  function ukBlock(uk) {
    if (!uk) return '';
    if (uk.error) return '<h3>United Kingdom: The Gazette</h3><p class="wq-lab">The Gazette did not answer just now (' + esc(uk.detail || uk.error) + '). Try again in a minute.</p>';
    var h = '<h3>United Kingdom: The Gazette, corporate insolvency notices</h3>';
    if (!uk.notices.length) h += '<p class="wq-okb">No corporate insolvency notice for exactly this name.' + (uk.other_corporate_notices_mentioning_the_words ? ' ' + fmt(uk.other_corporate_notices_mentioning_the_words) + ' notice(s) mention the same words but name a different company, so they are not listed.' : '') + '</p>';
    else {
      h += '<p class="wq-lab"><b>' + fmt(uk.exact_notices) + ' notice(s) for a company with exactly this name.</b> Check it is the same company: open the notice and compare the company number with your contract.</p><ul class="wq-list">';
      uk.notices.forEach(function (n) { var u = safe(n.url); h += '<li>' + (u ? '<a href="' + esc(u) + '" rel="noopener">' + esc(n.type) + '</a>' : esc(n.type)) + '<span>' + esc(n.date) + ' · notice code ' + esc(n.notice_code) + '</span></li>'; });
      h += '</ul>';
    }
    var sp = safe(uk.search_page);
    h += '<p class="wq-fine">' + esc(uk.licence) + (sp ? ' <a href="' + esc(sp) + '" rel="noopener">Same search on The Gazette</a>.' : '') + (uk.more_results ? ' More than 100 notices matched the words: open the search to see them all.' : '') + '</p>';
    return h;
  }
  function esBlock(es) {
    if (!es) return '';
    var h = '<h3>Spain: BORME, insolvency acts of companies</h3>';
    if (es.status === 'starting') return h + '<p class="wq-lab">The daily BORME index is starting: its first run has not been published yet. Check by hand on the <a href="https://www.publicidadconcursal.es/consulta-publicidad-concursal-new" rel="noopener">Registro Publico Concursal</a>.</p>';
    if (es.error) return h + '<p class="wq-lab">The index could not be read just now. Try again in a minute.</p>';
    if (!es.acts.length) h += '<p class="wq-okb">No insolvency act for exactly this name in BORME between ' + esc(es.index_from) + ' and ' + esc(es.index_to) + ' (' + fmt(es.days_indexed) + ' publication days).</p>';
    else {
      h += '<p class="wq-lab"><b>' + fmt(es.acts.length) + ' insolvency act(s) for a company with exactly this name.</b> Spain does not allow two companies with the same name, but check the company tax id (NIF) on the BORME page against your contract.</p><ul class="wq-list">';
      es.acts.forEach(function (a) { var u = safe(a.url); h += '<li>' + esc(a.act) + '<span>Procedure ' + esc(a.procedure) + ', resolution of ' + esc(a.resolution_date) + (a.final === 'SI' ? ' (final)' : a.final === 'NO' ? ' (not final)' : '') + ' · published ' + (u ? '<a href="' + esc(u) + '" rel="noopener">BORME ' + esc(a.borme_date) + '</a>' : esc(a.borme_date)) + '</span></li>'; });
      h += '</ul>';
    }
    h += '<p class="wq-fine">' + esc(es.licence) + ' Older cases, and individuals, are on the <a href="https://www.publicidadconcursal.es/consulta-publicidad-concursal-new" rel="noopener">Registro Publico Concursal</a> (check by hand: it asks for a captcha and the tax id).</p>';
    return h;
  }
  var f = $('ic-f');
  if (f) f.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('ic-n').value.replace(/\s+/g, ' ').trim(), r = $('ic-r');
    if (!FORM.test(name) || name.length < 5) { r.innerHTML = '<p class="wq-lab">Add the legal form at the end, for example Limited, Ltd, PLC, LLP, S.L. or S.A. That makes it the name of one company, and it is how we make sure we never search a person.</p>'; return; }
    r.innerHTML = '<p>Asking The Gazette and the BORME index…</p>';
    var btn = f.querySelector('button'); btn.disabled = true;
    fetch('/api/x/w/insolvency?name=' + encodeURIComponent(name)).then(function (x) { return x.json().then(function (d) { return { s: x.status, d: d }; }); }).then(function (o) {
      btn.disabled = false;
      if (o.s !== 200) { r.innerHTML = '<p class="wq-lab">' + esc(o.d.error || 'Something went wrong') + '</p>'; return; }
      var d = o.d;
      r.innerHTML = '<p class="wq-fine">Searched for <b>' + esc(name) + '</b> (compared as ' + esc(d.normalised) + ') at ' + esc((d.fetched_at || '').replace('T', ' ').slice(0, 16)) + ' UTC' + (d.cached ? ', from the answer kept for a day' : '') + '.</p>' + ukBlock(d.uk) + esBlock(d.es) + '<p class="wq-fine" style="margin-top:12px">' + esc(d.rule) + ' ' + esc(d.not_covered) + '</p>';
    }).catch(function () { btn.disabled = false; r.innerHTML = '<p class="wq-lab">The lookup did not answer. Check your connection and try again.</p>'; });
  });

  fetch('/api/x/w/insolvency/watch').then(function (r) { return r.json(); }).then(function (d) {
    if (d.status === 'starting') {
      ['k-p', 'k-n', 'k-h', 'k-es'].forEach(function (k) { $(k).textContent = '-'; });
      $('ic-upd').textContent = 'Starting: the daily job has not published its first run yet. The lookup above already works.';
      $('ic-m').innerHTML = '<tr><td colspan="6">Starting.</td></tr>'; $('ic-hits').innerHTML = '<li>Starting.</li>';
      $('ic-cov').innerHTML = '<li>The Gazette (United Kingdom), live</li><li>BORME (Spain), once the first index is published</li>';
      $('ic-hand').innerHTML = '<li><a href="https://www.publicidadconcursal.es/consulta-publicidad-concursal-new" rel="noopener">Registro Publico Concursal</a> (Spain)</li>';
      $('ic-method').innerHTML = '<li>Exact legal company names only, apart from capitals, accents, punctuation and the legal form.</li>';
      return;
    }
    var t = d.totals || {}, es = d.spain_index || {};
    $('k-p').textContent = fmt(t.projects_checked); $('k-n').textContent = fmt(t.names_checked); $('k-h').textContent = fmt(t.projects_with_notice); $('k-es').textContent = fmt(es.acts);
    $('ic-upd').textContent = 'Updated ' + (d.updated || '').replace('T', ' ').slice(0, 16) + ' UTC. Spanish index: ' + fmt(es.days) + ' BORME publication days, ' + esc(es.from || '-') + ' to ' + esc(es.to || '-') + ', ' + fmt(es.companies) + ' companies with an insolvency act.';
    var rows = Object.keys(d.markets || {}).map(function (k) { var m = d.markets[k]; return '<tr><td>' + esc(k) + '</td><td>' + esc(m.source) + '</td><td class="n">' + fmt(m.projects) + '</td><td class="n">' + fmt(m.projects_with_names) + '</td><td class="n">' + fmt(m.names_checked) + '</td><td class="n">' + (m.projects_with_notice ? '<span class="wq-pill no">' + fmt(m.projects_with_notice) + '</span>' : '0') + '</td></tr>'; });
    $('ic-m').innerHTML = rows.join('') || '<tr><td colspan="6">No market.</td></tr>';
    var hits = Object.keys(d.projects || {}).filter(function (k) { return d.projects[k].notices; }).sort();
    $('ic-hits').innerHTML = hits.length ? hits.map(function (k) { var p = d.projects[k]; return '<li><a href="/p/?id=' + esc(k) + '">' + esc(k) + '</a> · ' + esc(p.market) + '<span>' + p.found.map(function (x) { return esc(x.text) + ' (' + esc(x.type) + ')'; }).join('<br>') + '</span></li>'; }).join('') : '<li>None today.</li>';
    var c = d.coverage || {};
    $('ic-cov').innerHTML = (c.covered || []).map(function (x) { return '<li><b>' + esc(x.country) + '</b>: <a href="' + esc(x.url) + '" rel="noopener">' + esc(x.source) + '</a><span>' + esc(x.how) + ' From ' + esc(x.from) + '. ' + esc(x.licence) + '.</span></li>'; }).join('');
    $('ic-hand').innerHTML = (c.partial_or_by_hand || []).map(function (x) { return '<li><b>' + esc(x.country) + '</b>: <a href="' + esc(x.url) + '" rel="noopener">' + esc(x.source) + '</a><span>' + esc(x.why) + '</span></li>'; }).join('') + '<li><b>Everywhere else</b><span>' + esc(c.not_covered || '') + '</span></li>';
    $('ic-method').innerHTML = (d.method || []).concat([d.privacy]).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
  }).catch(function () { $('ic-upd').textContent = 'The watch data did not load. The lookup above still works.'; });
})();
