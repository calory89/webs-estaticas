/* Kolaboro /tools/agent-check/: is this agent licensed? Dubai broker or office lookup (only when an official open dataset is
   reachable from our servers), live status of the official registers, and by-hand links elsewhere.
   Data: /api/x/w/agent?brn= or ?office= (rate-limited) and /api/x/w/agent/sources (probed from Cloudflare). */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var safe = function (u) { return /^https:\/\/[a-z0-9.-]+\.(gov\.ae|gov\.ph|gov\.in|ae)\//.test(u || '') ? u : null; };
  var PILL = { reachable: 'ok', 'blocked from our servers': 'no', 'did not answer': 'no' };

  function row(k, v) { return v == null || v === '' ? '' : '<tr><th>' + esc(k) + '</th><td>' + esc(v) + '</td></tr>'; }
  function result(d) {
    if (d.status === 'not connected' || !d.results) {
      return '<p class="wq-lab"><b>We cannot look this up for you yet.</b> ' + esc(d.note || '') + '</p>' +
        (d.by_hand && d.by_hand.length ? '<ul class="wq-list">' + d.by_hand.map(function (x) { var u = safe(x.url); return '<li>' + (u ? '<a href="' + esc(u) + '" rel="noopener">' + esc(x.name) + '</a>' : esc(x.name)) + '</li>'; }).join('') + '</ul>' : '');
    }
    if (!d.results.length) return '<p class="wq-lab"><b>Not found in the official dataset.</b> Dataset date: ' + esc(d.dataset_date || '-') + '. Check the number with the broker, then check by hand on the Dubai Land Department page; a licence issued after the dataset date will not be in it yet.</p>';
    return '<p class="wq-okb"><b>' + d.results.length + ' record(s) in the official dataset</b> (dataset date ' + esc(d.dataset_date || '-') + '). Compare the name and office with the person selling to you.</p>' +
      d.results.map(function (r) { return '<table class="wq-t" style="margin-top:10px"><tbody>' + Object.keys(r).map(function (k) { return row(k, r[k]); }).join('') + '</tbody></table>'; }).join('') +
      '<p class="wq-fine">' + esc(d.source || '') + ' ' + esc(d.licence || '') + '</p>';
  }
  var f = $('ac-f');
  if (f) f.addEventListener('submit', function (e) {
    e.preventDefault();
    var b = $('ac-b').value.replace(/\D/g, ''), o = $('ac-o').value.replace(/\s+/g, ' ').trim(), r = $('ac-r');
    if (!b && o.length < 3) { r.innerHTML = '<p class="wq-lab">Type the BRN (digits only) or at least 3 letters of the office name.</p>'; return; }
    r.innerHTML = '<p>Checking…</p>';
    var btn = f.querySelector('button'); btn.disabled = true;
    fetch('/api/x/w/agent?market=dubai&' + (b ? 'brn=' + encodeURIComponent(b) : 'office=' + encodeURIComponent(o))).then(function (x) { return x.json().then(function (d) { return { s: x.status, d: d }; }); }).then(function (x) {
      btn.disabled = false;
      r.innerHTML = x.s === 200 ? result(x.d) : '<p class="wq-lab">' + esc(x.d.error || 'Something went wrong') + '</p>';
    }).catch(function () { btn.disabled = false; r.innerHTML = '<p class="wq-lab">The lookup did not answer. Try again.</p>'; });
  });
  fetch('/api/x/w/agent/sources').then(function (r) { return r.json(); }).then(function (d) {
    $('ac-src').innerHTML = (d.sources || []).map(function (s) {
      var u = safe(s.url);
      return '<tr><td>' + esc(s.market) + '</td><td>' + (u ? '<a href="' + esc(u) + '" rel="noopener">' + esc(s.name) + '</a>' : esc(s.name)) + '</td><td><span class="wq-pill ' + (PILL[s.status] || 'mid') + '">' + esc(s.status) + (s.http ? ' (HTTP ' + esc(s.http) + ')' : '') + '</span><span class="wq-fine" style="display:block">' + esc((s.probed_at || '').replace('T', ' ').slice(0, 16)) + ' UTC</span></td><td>' + esc(s.terms) + '</td></tr>';
    }).join('') || '<tr><td colspan="4">No sources.</td></tr>';
  }).catch(function () { $('ac-src').innerHTML = '<tr><td colspan="4">The status check did not load.</td></tr>'; });
})();
