/* Kolaboro /graph/global/: anonymised global company graph from GLEIF (LEI records and level 2 parent relationships).
   Data: /data/company-graph-global.json (weekly batch, tools/kolaboro-w/gleif_graph.py). */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fmt = function (n) { return n == null ? '-' : Number(n).toLocaleString('en-US'); };
  var pct = function (x) { return x == null ? '-' : Math.round(x * 100) + '%'; };
  // Hand check of a sample of matches, done once when the feature shipped. Updated by hand, never by the batch job.
  var PRECISION = { n: 20, correct: 20, date: '4 November 2026', note: 'The sample was drawn at random from the 43 distinct name and LEI pairs matched in the first run. In every case the LEI holder is the company our research names. Two of them are a group or partner named next to a local project company, so a match tells you about the named company, not always about the company on your contract.' };
  var D = null;

  function markets() {
    var sort = $('gg-sort').value, all = $('gg-show').value === 'all';
    var m = D.markets;
    var ks = Object.keys(m || {}).filter(function (k) { return all || m[k].developers_with_lei; });
    ks.sort(function (a, b) {
      if (sort === 'name') return a.localeCompare(b);
      if (sort === 'share') return (m[b].share_developers_with_lei || 0) - (m[a].share_developers_with_lei || 0) || m[b].projects - m[a].projects;
      if (sort === 'foreign') return m[b].developers_foreign_parent - m[a].developers_foreign_parent || m[b].projects - m[a].projects;
      return m[b].projects - m[a].projects || a.localeCompare(b);
    });
    $('gg-m').innerHTML = ks.map(function (k) {
      var x = m[k], s = x.share_developers_with_lei, lap = (x.lei_status.lapsed || 0) + (x.lei_status.retired || 0) + (x.lei_status.merged || 0) + (x.lei_status.annulled || 0);
      return '<tr><td>' + esc(k) + '</td><td class="n">' + fmt(x.projects) + '</td><td class="n">' + fmt(x.developers) + '</td><td class="n">' + fmt(x.developers_with_lei) + '</td><td><div class="wq-bar" title="' + pct(s) + '"><i style="width:' + Math.round((s || 0) * 100) + '%"></i></div><span class="wq-fine">' + pct(s) + '</span></td><td class="n">' + fmt(x.developers_foreign_parent) + '</td><td class="n">' + fmt(lap) + '</td></tr>';
    }).join('') + (all ? '' : '<tr><td colspan="7" class="wq-fine">' + fmt(Object.keys(m).length - ks.length) + ' more markets have no developer with an LEI. Choose "all markets" to list them.</td></tr>');
  }
  function project(id) {
    var p = (D.projects || {})[id], el = $('gg-p');
    if (!p) { el.innerHTML = '<p>Unknown project.</p>'; return; }
    if (!p.checked) { el.innerHTML = '<p>' + esc(p.note || 'Not checked in this run.') + '</p>'; return; }
    var h = '<p><a href="/p/?id=' + esc(id) + '">' + esc(id) + '</a> · ' + esc(p.market) + '</p>';
    if (!p.names_checked) h += '<p>Our research record names no company we could look up for this project (no name, or only a brand or a person).</p>';
    else if (!p.lei_entities) h += '<p>' + fmt(p.names_checked) + ' company name(s) looked up. <b>No exact match in GLEIF</b> in the project\'s country. That is normal for small and private developers.</p>';
    else {
      h += '<p>' + fmt(p.names_checked) + ' company name(s) looked up, <b>' + fmt(p.lei_entities) + ' matched an LEI exactly</b>.</p><ul class="wq-list">';
      h += '<li>Registration: ' + p.statuses.map(function (s) { return '<span class="wq-pill ' + (s === 'issued' ? 'ok' : 'mid') + '" style="display:inline-block">' + esc(s.toUpperCase()) + '</span>'; }).join(' ') + (p.lei_not_issued ? '<span>' + fmt(p.lei_not_issued) + ' of them not kept up to date (lapsed, retired or merged).</span>' : '') + '</li>';
      h += '<li>Parent company: ' + (p.foreign_parent ? '<b>reported, in another country</b>' : p.parent_reported ? 'reported, in the same country' : p.parent_exception_only ? 'not reported: the company filed an exception (for example, no consolidating parent, or the parent declined to be named)' : 'nothing on file') + '</li>';
      if (p.oldest_lei_year) h += '<li>First LEI registered in ' + esc(p.oldest_lei_year) + '</li>';
      h += '</ul>';
    }
    h += '<p class="wq-fine">API: <a href="/api/x/w/graph-global/' + esc(id) + '">/api/x/w/graph-global/' + esc(id) + '</a></p>';
    el.innerHTML = h;
  }
  function table(el, obj, label) {
    var ks = Object.keys(obj || {}).sort(function (a, b) { return obj[b] - obj[a]; });
    $(el).innerHTML = ks.length ? ks.slice(0, 12).map(function (k) { return '<tr><td>' + esc(label ? label(k) : k) + '</td><td class="n">' + fmt(obj[k]) + '</td></tr>'; }).join('') : '<tr><td>None yet.</td></tr>';
  }
  var CN = { US: 'United States', GB: 'United Kingdom', AE: 'United Arab Emirates', SA: 'Saudi Arabia', NL: 'Netherlands', LU: 'Luxembourg', JP: 'Japan', SG: 'Singapore', HK: 'Hong Kong', CN: 'China', DE: 'Germany', FR: 'France', ES: 'Spain', CH: 'Switzerland', IE: 'Ireland', KY: 'Cayman Islands', VG: 'British Virgin Islands', TH: 'Thailand', MY: 'Malaysia', CY: 'Cyprus', IT: 'Italy', IN: 'India', QA: 'Qatar', BH: 'Bahrain', KW: 'Kuwait', OM: 'Oman', TR: 'Turkey', BE: 'Belgium', SE: 'Sweden', AU: 'Australia', CA: 'Canada', MX: 'Mexico', JE: 'Jersey', GG: 'Guernsey', IM: 'Isle of Man', MT: 'Malta', PT: 'Portugal', GR: 'Greece', EG: 'Egypt', ID: 'Indonesia', PH: 'Philippines', VN: 'Vietnam', KR: 'South Korea', ZA: 'South Africa', BM: 'Bermuda' };

  fetch('/api/x/w/graph-global?full=1').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) {
    if (d.status === 'starting' || !d.markets) throw new Error('starting');
    D = d;
    var c = d.coverage || {}, t = d.totals || {}, s = d.shares || {};
    $('k-c').textContent = fmt(t.checked); $('k-n').textContent = fmt(c.candidate_names);
    $('k-l').textContent = fmt(t.projects_with_lei) + ' (' + pct(s.projects_with_lei) + ')';
    $('k-f').textContent = pct(s.lei_developers_foreign_parent) + (t.developers_with_lei ? ' (' + fmt(t.developers_foreign_parent) + ' of ' + fmt(t.developers_with_lei) + ')' : '');
    $('gg-upd').textContent = 'Updated ' + (d.updated || '').replace('T', ' ').slice(0, 16) + ' UTC from the GLEIF API. ' + fmt(c.matched_names) + ' names matched exactly, ' + fmt(c.ambiguous_names) + ' ambiguous (left unmatched), ' + fmt(c.unmatched_names) + ' with no exact match. ' + fmt(t.developers_with_lei) + ' of ' + fmt(t.developers) + ' developers (' + pct(s.developers_with_lei) + ') have an LEI; of those, ' + pct(s.lei_developers_not_issued) + ' have one that is not kept up to date.' + (c.stopped_early ? ' This run stopped early (request budget), so some projects were not checked.' : '');
    markets();
    $('gg-sort').addEventListener('change', markets); $('gg-show').addEventListener('change', markets);
    table('gg-st', (d.totals || {}).lei_status, function (k) { return k.toUpperCase(); });
    table('gg-ex', (d.totals || {}).parent_exceptions);
    var pc = {}; Object.keys(d.markets).forEach(function (k) { var x = d.markets[k].parent_countries || {}; Object.keys(x).forEach(function (cc) { pc[cc] = (pc[cc] || 0) + x[cc]; }); });
    table('gg-pc', pc, function (k) { return (CN[k] || k) + ' (' + k + ')'; });
    var ids = Object.keys(d.projects || {}).sort(), sel = $('gg-sel');
    var withLei = ids.filter(function (k) { return d.projects[k].lei_entities; });
    sel.innerHTML = '<optgroup label="With an LEI match">' + withLei.map(function (k) { return '<option value="' + esc(k) + '">' + esc(k) + ' · ' + esc(d.projects[k].market) + '</option>'; }).join('') + '</optgroup><optgroup label="All projects">' + ids.map(function (k) { return '<option value="' + esc(k) + '">' + esc(k) + ' · ' + esc(d.projects[k].market) + '</option>'; }).join('') + '</optgroup>';
    var want = (location.hash.match(/^#([A-Z]{2,5}-\d{3,4})$/) || [])[1];
    var first = want && d.projects[want] ? want : (withLei[0] || ids[0]);
    sel.value = first; project(first);
    sel.addEventListener('change', function () { project(this.value); try { history.replaceState(null, '', '#' + this.value); } catch (e) {} });
    $('gg-method').innerHTML = (d.method || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
    $('gg-priv').textContent = d.privacy || '';
    var so = d.source || {};
    $('gg-src').innerHTML = 'Source: ' + esc(so.name) + ', <a href="https://www.gleif.org/en/lei-data/gleif-api" rel="noopener">GLEIF API</a>, licence ' + esc(so.licence) + '. Exact queries: ' + (so.queries || []).map(function (q) { return '<code>' + esc(q) + '</code>'; }).join(', ') + '. ' + fmt(c.requests) + ' requests in this run; archive root (SHA-256 over every response): <code>' + esc((d.archive || {}).root_sha256) + '</code>.';
    var P = PRECISION;
    $('gg-prec').innerHTML = P ? '<p>We checked a random sample of ' + fmt(P.n) + ' matches by hand on ' + esc(P.date) + ', comparing the GLEIF record (legal name, address, registration authority) with the developer named in our research and its website. <b>' + fmt(P.correct) + ' of ' + fmt(P.n) + ' were the right company.</b> ' + esc(P.note || '') + '</p>' : '<p>The hand check of a sample has not been published yet.</p>';
  }).catch(function () {
    ['k-c', 'k-n', 'k-l', 'k-f'].forEach(function (k) { $(k).textContent = '-'; });
    $('gg-upd').textContent = 'Starting: the weekly job has not published its first run yet.';
    $('gg-m').innerHTML = '<tr><td colspan="7">Starting.</td></tr>'; $('gg-p').innerHTML = '<p>Starting.</p>'; $('gg-st').innerHTML = $('gg-pc').innerHTML = $('gg-ex').innerHTML = '<tr><td>Starting.</td></tr>';
    $('gg-prec').innerHTML = '<p>Starting.</p>'; $('gg-method').innerHTML = '<li>Starting.</li>';
  });
})();
