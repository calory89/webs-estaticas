/* Promise tracker: reads /data/promises.json (built daily by tools/kolaboro-agent/promises.py) */
(function(){
  function $(i){ return document.getElementById(i); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function n(x){ return (+x || 0).toLocaleString('en'); }
  var ST = ['kept', 'broken', 'moved', 'pending', 'unknown'], NAME = { kept: 'Kept', broken: 'Broken', moved: 'Moved, still ahead', pending: 'Pending', unknown: 'Unknown' };
  var COL = { kept: '#0A704E', broken: '#B42318', moved: '#C26A0A', pending: '#6B7A88', unknown: '#8D949A' };
  var D = null;
  function bar(t){ var tot = t.promises || 0; if (!tot) return ''; return '<div class="y-bar" role="img" aria-label="' + ST.map(function(s){ return NAME[s] + ' ' + (t[s] || 0); }).join(', ') + '">' + ST.map(function(s){ return t[s] ? '<i class="st-' + s + '" style="width:' + (t[s] / tot * 100).toFixed(2) + '%"></i>' : ''; }).join('') + '</div>'; }
  function dt(d){ if (!d) return 'no date'; var m = String(d).match(/^(\d{4})(?:-(Q\d|H\d|\d\d))?$/); if (!m) return d; if (!m[2]) return m[1]; if (/^\d\d$/.test(m[2])) return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m[2] - 1] + ' ' + m[1]; return m[2] + ' ' + m[1]; }
  function day(s){ if (!s) return ''; var d = new Date(s + 'T00:00:00Z'); return isNaN(d) ? s : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); }
  function render(){
    var c = D.counts || {};
    $('prn').innerHTML = [[n(c.promises), 'dated promises in ' + n(c.projects) + ' of ' + n(c.projects_tracked) + ' projects'], [n(c.moved_ever), 'promises moved later at least once' + (c.months_moved_median != null ? ' (median ' + c.months_moved_median + ' months)' : '')], [n(c.broken), 'broken: date passed, evidence it did not happen'], [n(c.kept), 'kept on time']]
      .map(function(x){ return '<div><b>' + x[0] + '</b><span>' + esc(x[1]) + '</span></div>'; }).join('');
    var mk = (D.markets || []).slice(), big = mk.filter(function(m){ return m.promises >= 5; }), small = mk.filter(function(m){ return m.promises < 5; });
    if (small.length) { var o = { market: 'Other markets (' + small.length + ')', projects: 0, promises: 0, moved_ever: 0, months_moved_median: null }; ST.forEach(function(s){ o[s] = 0; }); small.forEach(function(m){ o.projects += m.projects; o.promises += m.promises; o.moved_ever += m.moved_ever; ST.forEach(function(s){ o[s] += m[s] || 0; }); }); big.push(o); }
    $('prmk').querySelector('tbody').innerHTML = big.map(function(m){ return '<tr><td>' + esc(m.market) + '</td><td class="n">' + n(m.projects) + '</td><td class="n">' + n(m.promises) + '</td><td>' + bar(m) + '</td><td class="n">' + n(m.kept) + '</td><td class="n">' + n(m.broken) + '</td><td class="n">' + n(m.moved_ever) + '</td><td class="n">' + (m.months_moved_median == null ? '' : m.months_moved_median) + '</td></tr>'; }).join('') || '<tr><td colspan="8">No promises published yet.</td></tr>';
    var K = D.kinds || {}, KT = D.kinds_totals || {};
    $('prkind').querySelector('tbody').innerHTML = Object.keys(K).filter(function(k){ return KT[k] && KT[k].promises; }).map(function(k){ var t = KT[k]; return '<tr><td>' + esc(K[k]) + '</td><td class="n">' + n(t.promises) + '</td>' + ST.map(function(s){ return '<td class="n">' + n(t[s]) + '</td>'; }).join('') + '<td class="n">' + n(t.moved_ever) + '</td></tr>'; }).join('') || '<tr><td colspan="8">No promises published yet.</td></tr>';
    var r = (D.checks || {}).rejected || {}, sp = D.spend || {}, so = D.sources || {};
    $('prchecks').innerHTML = '<p>Updated ' + esc(day(D.updated)) + '. Read: ' + n(so.research_records) + ' research records and ' + n(so.page_copies) + ' daily page copies (' + n(so.texts_read) + ' texts read' + (so.texts_not_read_yet ? ', ' + n(so.texts_not_read_yet) + ' not read yet, budget for the day reached' : '') + ').</p>' +
      '<p>Rejected by the quote check: <b>' + n(r.quote_not_found) + '</b> quotes not found in the stored text, ' + n(r.year_not_in_quote) + ' quotes without the year, ' + n(r.no_quote) + ' items without a quote, ' + n((r.bad_date || 0) + (r.bad_kind || 0)) + ' items with an invalid date or kind. Date conflicts sent for a second reading: ' + n((D.checks || {}).date_conflicts) + '.</p>' +
      '<p>Model spend: ' + (sp.this_run_usd != null ? '$' + (+sp.this_run_usd).toFixed(2) + ' this run, ' : '') + '$' + (+(sp.total_usd || 0)).toFixed(2) + ' in total across ' + n(sp.runs) + ' run' + (sp.runs === 1 ? '' : 's') + ', cap $' + esc(sp.cap_usd) + '. ' + esc(sp.note || '') + '</p>';
    var q = new URLSearchParams(location.search).get('id'); if (q) { $('prid').value = q; look(q); }
  }
  function look(id){
    id = String(id || '').trim().toUpperCase(); var o = $('prout');
    if (!/^[A-Z]{2,5}-\d{3,4}$/.test(id)) { o.innerHTML = '<span class="y-err">Enter an id like BALI-014.</span>'; return; }
    if (!D) { o.textContent = 'The data has not loaded.'; return; }
    var L = (D.projects || {})[id];
    if (!L || !L.length) { o.innerHTML = 'No dated promise with a checked quote for <b>' + esc(id) + '</b> yet. That can mean the developer publishes no dates, or that we have not read this project\'s texts yet. <a href="/p/?id=' + encodeURIComponent(id) + '">Open the project file</a>.'; return; }
    o.innerHTML = '<p><a href="/p/?id=' + encodeURIComponent(id) + '">Open the project file for ' + esc(id) + '</a> · <a href="/ask-developer/?id=' + encodeURIComponent(id) + '">Ask the developer about it</a></p>' + L.map(function(p){
      var hist = (p.hist || []).map(function(h){ return '<li>' + esc(dt(h.d)) + ' · ' + (h.src === 'page' ? 'page copy' : 'research record') + ' · seen ' + esc(day(h.seen)) + (h.last && h.last !== h.seen ? ' to ' + esc(day(h.last)) : '') + (h.note ? ' · ' + esc(h.note) : '') + (h.sha ? ' · page <code>' + esc(h.sha) + '</code>' : '') + '</li>'; }).join('');
      var ev = p.ev ? '<p class="y-small">Evidence: ' + (p.ev.what === 'done' ? 'shown done' : 'shown not done') + ' in the ' + (p.ev.src === 'page' ? 'developer page copy' : 'research record') + ' of ' + esc(day(p.ev.seen)) + '.</p>' : '';
      return '<div class="y-pr"><h4><span class="y-pill" style="background:' + COL[p.st] + '">' + esc(NAME[p.st] || p.st) + '</span>' + esc((D.kinds || {})[p.k] || p.k) + ': ' + esc(dt(p.d)) + '</h4>' +
        (p.mv ? '<p><b>Moved ' + p.mv + ' time' + (p.mv === 1 ? '' : 's') + ', ' + p.mm + ' month' + (p.mm === 1 ? '' : 's') + ' later in total.</b></p>' : '') + (p.rd ? '<p class="y-small">The newest page copy says ' + esc(dt(p.d)) + '; our research record gives ' + esc(dt(p.rd)) + '. Sources disagree: ask the developer which date the contract states.</p>' : '') + (p.earlier ? '<p class="y-small">Brought forward ' + p.earlier + ' time' + (p.earlier === 1 ? '' : 's') + '.</p>' : '') + ev +
        '<p class="y-small">Current date from the ' + (p.src === 'page' ? 'page copy' : 'research record') + ' of ' + esc(day(p.seen)) + '. Quote fingerprint <code>' + esc(p.q) + '</code>' + (p.sha ? ', page fingerprint <code>' + esc(p.sha) + '</code>' : '') + '.</p>' + (hist ? '<ol>' + hist + '</ol>' : '') + '</div>'; }).join('');
  }
  $('prf').addEventListener('submit', function(e){ e.preventDefault(); look($('prid').value); });
  fetch('/data/promises.json', { cache: 'no-cache' }).then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); }).then(function(d){ D = d; render(); }).catch(function(){
    $('prn').innerHTML = '<div><b>Starting</b><span>The first reading of developer promises is running. This page fills in when it is published.</span></div>';
    $('prchecks').textContent = 'Not published yet.'; $('prmk').querySelector('tbody').innerHTML = '<tr><td colspan="8">Not published yet.</td></tr>'; $('prkind').querySelector('tbody').innerHTML = '<tr><td colspan="8">Not published yet.</td></tr>';
  });
})();
