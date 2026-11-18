// /security/: hall of fame and response time, read from /security/hall-of-fame.json. The median is computed here, and only
// from reports that exist: with no reports, the page says so instead of showing a number.
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function put(id, h) { var e = document.getElementById(id); if (e) e.innerHTML = h; }
  fetch('/security/hall-of-fame.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
    var R = (d && d.reports) || [], named = R.filter(function (x) { return x.name && x.credit !== false; });
    var hrs = R.filter(function (x) { return x.received && x.first_reply; }).map(function (x) { return (new Date(x.first_reply) - new Date(x.received)) / 36e5; }).filter(function (h) { return h >= 0; }).sort(function (a, b) { return a - b; });
    var med = hrs.length ? (hrs.length % 2 ? hrs[(hrs.length - 1) / 2] : (hrs[hrs.length / 2 - 1] + hrs[hrs.length / 2]) / 2) : null;
    put('bb-rt', med == null ? '<b>No reports yet</b>, so there is no response time to show. Our commitment is a first reply within two working days.' : '<b>' + (med < 48 ? Math.round(med * 10) / 10 + ' hours' : Math.round(med / 2.4) / 10 + ' days') + '</b> median time to first reply, over ' + hrs.length + ' report' + (hrs.length === 1 ? '' : 's') + '.');
    put('bb-hof', named.length ? '<table class="bb-t"><thead><tr><th>Researcher</th><th>Severity</th><th>Fixed</th><th>Summary</th></tr></thead><tbody>' + named.map(function (x) { return '<tr><td>' + (x.url ? '<a href="' + esc(x.url) + '" rel="nofollow noopener" target="_blank">' + esc(x.name) + '</a>' : esc(x.name)) + '</td><td>' + esc(x.severity) + '</td><td>' + esc(String(x.fixed || '').slice(0, 10)) + '</td><td>' + esc(x.summary) + '</td></tr>'; }).join('') + '</tbody></table>' : '<p style="margin:0">Empty so far: no valid reports yet. The first researcher to report a valid issue is listed here, with their permission.</p>');
  }).catch(function () { put('bb-rt', 'The report record could not be loaded just now.'); });
})();
