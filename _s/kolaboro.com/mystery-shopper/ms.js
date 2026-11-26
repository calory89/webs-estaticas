/* Kolaboro /mystery-shopper/: renders the questionnaire, measurement and status from /data/mystery-shopper.json. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  fetch('/data/mystery-shopper.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
    $('ms-state').textContent = d.status === 'not started' ? 'Not started yet' : d.status;
    $('ms-sent').textContent = d.enquiries_sent; $('ms-rep').textContent = d.replies_received;
    $('ms-why').innerHTML = (d.why_not_started || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
    $('ms-q').innerHTML = d.questionnaire.map(function (q) { return '<li><b>' + esc(q.topic) + '</b>' + esc(q.question) + '<em>A checkable answer: ' + esc(q.checkable_answer) + '</em></li>'; }).join('');
    $('ms-m').innerHTML = d.measurement.map(function (m) { return '<tr><td><b>' + esc(m.metric.replace(/_/g, ' ')) + '</b></td><td>' + esc(m.definition) + '</td></tr>'; }).join('');
    $('ms-sender').textContent = d.sender_policy; $('ms-pub').textContent = d.publication; $('ms-plan').textContent = d.plan;
    $('ms-need').innerHTML = d.needed_to_start.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
  }).catch(function () { $('ms-why').innerHTML = '<li>The programme description did not load. It is also at /data/mystery-shopper.json.</li>'; });
})();
