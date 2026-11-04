/* /satellite/night/: night lights at projects that should be finished, and visible change on site for every project with coordinates (block U). */
(function(){
  'use strict';
  var $ = function(id){ return document.getElementById(id); };
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function n(x, d){ return x == null ? '' : Number(x).toLocaleString('en-US', { maximumFractionDigits: d == null ? 1 : d }); }
  function j(u){ return fetch(u, { cache: 'no-cache' }).then(function(r){ if (!r.ok) throw r.status; return r.json(); }); }
  function idl(i){ return '<a href="/p/?id=' + encodeURIComponent(i) + '">' + esc(i) + '</a>'; }
  function spark(q){
    var v = (q || []).map(function(x){ return x == null ? null : +x; }), ok = v.filter(function(x){ return x != null; });
    if (ok.length < 2) return '';
    var W = 120, H = 30, mx = Math.max.apply(null, ok.concat([1])), step = W / (v.length - 1), pts = [];
    v.forEach(function(x, i){ if (x != null) pts.push((i * step).toFixed(1) + ',' + (H - 2 - (x / mx) * (H - 4)).toFixed(1)); });
    return '<svg class="nl-sp" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Quarterly median radiance, oldest to newest: ' + v.map(function(x){ return x == null ? 'no data' : n(x, 1); }).join(', ') + '"><polyline fill="none" stroke="currentColor" stroke-width="2" points="' + pts.join(' ') + '"/></svg>';
  }
  function stat(i, b, s){ var d = $('nlstats').children[i]; if (d) d.innerHTML = '<b>' + b + '</b><span>' + s + '</span>'; }

  function night(d){
    var P = d.projects || {}, ids = Object.keys(P).sort();
    if (!ids.length) { $('nl').innerHTML = '<p class="pl-small">No tracked project with coordinates is marked completed or past its handover year yet.</p>'; return; }
    var rows = ids.map(function(i){
      var o = P[i], ch = o.change_pct == null ? 'n/a' : (o.change_pct > 0 ? '+' : '') + n(o.change_pct, 0) + '%';
      var vr = o.pin_vs_ring != null ? n(o.pin_vs_ring, 1) + 'x' : o.ring_last12 != null && o.ring_last12 < 0.3 ? 'dark around' : 'n/a';
      return '<tr><th scope="row">' + idl(i) + '<small>' + esc(o.group) + '</small></th><td>' + esc(o.reading) + '</td><td>' + (o.pin_last12 == null ? 'n/a' : n(o.pin_last12)) + '</td><td>' + (o.pin_prev12 == null ? 'n/a' : n(o.pin_prev12)) + '</td><td>' + ch + '</td><td>' + (o.ring_last12 == null ? 'n/a' : n(o.ring_last12)) + '</td><td>' + vr + '</td><td>' + spark(o.quarters) + '</td></tr>';
    }).join('');
    var dark = ids.filter(function(i){ return /^dark|darker/.test(P[i].reading); }).length;
    $('nl').innerHTML = '<p class="hz-sum"><b>' + ids.length + '</b> project' + (ids.length === 1 ? '' : 's') + ' qualify: ' + esc(d.selection) + ' Window ' + esc(d.from) + ' to ' + esc(d.to) + ', run on ' + esc(d.updated) + '.</p>' +
      (ids.length < 10 ? '<p class="pl-small">That is a small set: most tracked projects are still off-plan or under construction. The list grows as handover dates pass.</p>' : '') +
      '<div class="hz-tw"><table class="hz-t nl-t"><thead><tr><th scope="col">Case</th><th scope="col">Reading</th><th scope="col">Pin, last 12 months</th><th scope="col">Pin, 12 before</th><th scope="col">Change</th><th scope="col">Surroundings</th><th scope="col">Pin vs surroundings</th><th scope="col">Quarterly, 3 years</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="pl-small">Radiance in nW/(cm&sup2; sr), median of the months. The surroundings column gives the scale for each place. ' + esc(d.limits) + '</p>';
    stat(0, n(ids.length, 0), 'projects past handover checked at night');
    stat(1, n(dark, 0), 'dark, or darker than their surroundings');
  }
  function stalled(d, cases){
    var P = d.projects || {}, ids = Object.keys(P).sort(), C = {};
    (cases || []).forEach(function(c){ C[c.id] = c; });
    var ok = ids.filter(function(i){ return P[i].status === 'ok'; });
    var long = ok.filter(function(i){ return P[i].no_visible_change_months >= 9 && (C[i] && C[i].stage === 'under construction'); });
    stat(2, n(ok.length, 0) + ' of ' + n(ids.length, 0), 'projects with a comparable pair of clear quarters');
    stat(3, n(long.length, 0), 'under construction, no visible change for 9 months or more');
    var mk = {}; ids.forEach(function(i){ var m = i.split('-')[0]; mk[m] = (mk[m] || 0) + 1; });
    var sc = d.status_counts || {};
    var h = '<p class="hz-sum"><b>' + n(ids.length, 0) + '</b> projects with coordinates, quarters ' + esc((d.quarters || [])[0]) + ' to ' + esc((d.quarters || []).slice(-1)[0]) + ', run on ' + esc(d.updated) + '. ' +
      Object.keys(sc).map(function(k){ return n(sc[k], 0) + ' ' + esc(k); }).join(', ') + '. Threshold: ' + n(d.threshold_pct, 0) + '% of pixels.</p>' +
      '<div class="st-f"><label class="st-sort">Market <select id="stmk"><option value="">All</option>' + Object.keys(mk).sort().map(function(m){ return '<option>' + esc(m) + '</option>'; }).join('') + '</select></label>' +
      '<label class="st-sort"><input type="checkbox" id="stuc"> Under construction only</label><label class="st-sort">Sort <select id="stso"><option value="m">Longest without change</option><option value="c">Most change last pair</option><option value="i">Case id</option></select></label></div>' +
      '<p class="st-count" id="stcnt"></p><div class="hz-tw"><table class="hz-t" id="stt"><thead><tr><th scope="col">Case</th><th scope="col">Public stage</th><th scope="col">Clear quarters</th><th scope="col">Newest pair</th><th scope="col">Changed pixels</th><th scope="col">No visible change for</th></tr></thead><tbody></tbody></table></div>';
    $('stl').innerHTML = h;
    function draw(){
      var m = $('stmk').value, uc = $('stuc').checked, so = $('stso').value;
      var L = ids.filter(function(i){ return (!m || i.split('-')[0] === m) && (!uc || (C[i] && C[i].stage === 'under construction')); });
      L.sort(function(a, b){
        var A = P[a], B = P[b];
        if (so === 'i') return a < b ? -1 : 1;
        if (so === 'c') return (B.change_pct_last == null ? -1 : B.change_pct_last) - (A.change_pct_last == null ? -1 : A.change_pct_last);
        return (B.no_visible_change_months == null ? -1 : B.no_visible_change_months) - (A.no_visible_change_months == null ? -1 : A.no_visible_change_months) || (a < b ? -1 : 1);
      });
      $('stcnt').textContent = L.length + ' shown';
      $('stt').tBodies[0].innerHTML = L.map(function(i){
        var o = P[i], st = C[i] && C[i].stage ? C[i].stage : 'not stated';
        if (o.status !== 'ok') return '<tr><th scope="row">' + idl(i) + '</th><td>' + esc(st) + '</td><td>' + esc((o.clear_quarters || []).length) + '</td><td colspan="3" class="muted">' + esc(o.status || 'no result') + '</td></tr>';
        var mo = o.no_visible_change_months, flag = mo >= 9 && st === 'under construction';
        return '<tr' + (flag ? ' class="st-flag"' : '') + '><th scope="row">' + idl(i) + '</th><td>' + esc(st) + '</td><td>' + esc(o.clear_quarters.length) + '</td><td>' + esc(o.last_pair.join(' to ')) + '</td><td>' + (o.change_pct_last == null ? 'n/a' : n(o.change_pct_last, 0) + '%') + '</td><td>' + (mo ? '<b>' + n(mo, 0) + ' months</b>' : 'changed in the newest pair') + '</td></tr>';
      }).join('');
    }
    ['stmk', 'stuc', 'stso'].forEach(function(k){ $(k).addEventListener('change', draw); });
    draw();
  }
  j('/data/night-lights.json').then(night).catch(function(){ $('nl').innerHTML = '<p class="pl-small">The weekly job has not published its first night-light results yet. This page fills in automatically when it does.</p>'; stat(0, 'n/a', 'night-light results not published yet'); stat(1, 'n/a', ''); });
  Promise.all([j('/data/stalled-sites.json'), j('/data/bali-cases.json').then(function(d){ return d.cases; }).catch(function(){ return []; })]).then(function(x){ stalled(x[0], x[1]); })
    .catch(function(){ $('stl').innerHTML = '<p class="pl-small">The weekly job has not published its first stalled-site results yet. This page fills in automatically when it does.</p>'; stat(2, 'n/a', 'stalled-site results not published yet'); stat(3, 'n/a', ''); });
})();
