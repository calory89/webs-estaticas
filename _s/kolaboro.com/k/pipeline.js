// The machine behind the data: last run of each automated job, from the published data.
(function () {
  var el = document.getElementById('pipe-live'); if (!el) return;
  fetch('/data/bali-cases.json?t=' + Math.floor(Date.now() / 6e5)).then(function (r) { return r.json(); }).then(function (d) {
    var C = d.cases || [], db = d.db || {}, ships = d.ships || [];
    var last = function (re) { var x = ships.filter(function (s) { return s.k === 'auto' && re.test(s.t); })[0]; return x ? x.d : null; };
    var maxd = function (f) { var v = C.map(f).filter(Boolean).sort(); return v.length ? v[v.length - 1] : null; };
    var J = [
      ['Daily research agent', 'Finds new off-plan and under-construction projects with web search, checks each on six points and rates every claim.', last(/new project/), 'Every day', (C.length).toLocaleString('en') + ' projects'],
      ['Page reader', 'Reads every developer page again and records what changed.', d.updated, 'Every day', (db.changes_detected || 0).toLocaleString('en') + ' changes recorded'],
      ['Evidence seal', 'Fingerprints every page read and timestamps one daily seal in Bitcoin.', d.seal ? d.seal.date : null, 'Every day', d.seal ? d.seal.count + ' pages sealed' : 'starting'],
      ['Registry watch', 'Re-checks official registers (Thailand environmental approvals first).', maxd(function (c) { return c.register && c.register.checked; }), 'Every week', (db.register_watched || 0) + ' projects watched'],
      ['Satellite watch', 'Sentinel-2 images of 27 market areas and a yearly change check for project sites.', maxd(function (c) { return c.sat && c.sat.date; }), 'Every week', (db.sat_watched || 0) + ' project sites'],
      ['Overdue watcher', 'Months past the promised handover on every case.', d.updated, 'Every day', (db.overdue || 0) + ' projects overdue'],
      ['Quality check', 'Every page on mobile and desktop: broken links, errors, layout.', null, 'Every day', 'all pages']
    ];
    el.innerHTML = J.map(function (j) {
      return '<li><div><b>' + j[0] + '</b><p>' + j[1] + '</p></div><div class="pl-m"><span class="pl-dot' + (j[2] ? '' : ' w') + '"></span>' + (j[2] ? 'Last run ' + j[2] : j[3]) + '<small>' + j[3] + ' · ' + j[4] + '</small></div></li>';
    }).join('');
  }).catch(function () {});
})();
