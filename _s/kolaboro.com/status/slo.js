// /status/ service level objectives: every figure comes from /api/x/o/slo, which computes them at request time from the
// uptime probes (/api/open/uptime), the API log and real-user vitals (/api/x/f/vitals). Nothing here is typed in by hand.
(function () {
  var o = document.getElementById('st-slo'); if (!o) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pct(x, d) { return x == null ? '' : (Math.round(x * Math.pow(10, d + 2)) / Math.pow(10, d)) + '%'; }
  function bar(rem) { var v = Math.max(0, Math.min(100, rem)); return '<span class="slo-bar" role="img" aria-label="' + v + '% of the error budget left"><i style="width:' + v + '%" class="' + (rem <= 0 ? 'r' : rem < 25 ? 'y' : 'g') + '"></i></span>'; }
  var NAME = { availability: 'Availability', desk_review: 'Desk review success', lcp_p75: 'Page speed (LCP, p75)' };
  fetch('/api/x/o/slo', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
    var rows = (d.slos || []).map(function (s) {
      var target = s.target != null ? pct(s.target, 1) : s.target_ms != null ? '≤ ' + (s.target_ms / 1000) + ' s' : '', now = '', budget = '', dot = 'y';
      if (s.state === 'measuring') {
        if (s.id === 'lcp_p75') { now = (s.p75_ms / 1000).toFixed(2) + ' s <small>(' + s.samples + ' samples, 28 days)</small>'; budget = s.met ? (s.headroom_ms / 1000).toFixed(2) + ' s of headroom' : 'Over target by ' + (-s.headroom_ms / 1000).toFixed(2) + ' s'; dot = s.met ? 'g' : 'r'; }
        else {
          now = pct(s.measured, 2) + ' <small>(' + (s.id === 'availability' ? s.probes + ' probes, ' + s.failed + ' failed' : s.requests + ' requests, ' + s.failed + ' failed') + ')</small>';
          budget = bar(s.budget_remaining_pct) + ' <b>' + s.budget_remaining_pct + '%</b> left' + (s.id === 'availability' ? '<br><small>month budget ' + s.budget_failed_probes_month + ' failed probes, about ' + s.budget_minutes_month + ' minutes</small>' : '<br><small>budget so far ' + s.budget_failed_requests + ' failed requests</small>');
          dot = s.budget_remaining_pct <= 0 ? 'r' : s.met ? 'g' : 'y';
        }
      } else if (s.state === 'setup') { now = 'Not measured yet'; budget = '<small>' + esc(s.note) + '</small>'; }
      else if (s.state === 'no_data') { now = 'No data yet'; budget = '<small>' + esc(s.note || 'no measurements in this window yet') + '</small>'; }
      else { now = 'Unavailable'; budget = '<small>' + esc(s.note || '') + '</small>'; }
      return '<div class="slo-i"><p class="slo-h"><i class="st-dot ' + dot + '"></i><b>' + esc(NAME[s.id] || s.id) + '</b> <small>' + esc(s.objective) + '</small></p><div class="slo-g"><div><span>Target</span>' + esc(target) + '</div><div><span>This month</span>' + now + '</div><div><span>Error budget</span>' + budget + '</div></div></div>';
    });
    var av = (d.slos || []).filter(function (s) { return s.id === 'availability'; })[0];
    o.innerHTML = rows.join('') +
      '<p class="rl-s">Window: calendar month ' + esc(d.window && d.window.month) + ' (UTC), ' + esc(d.window && d.window.days_elapsed) + ' of ' + esc(d.window && d.window.days_in_month) + ' days elapsed. Computed ' + esc(String(d.computed_at || '').slice(0, 16).replace('T', ' ')) + ' UTC from <a href="/api/open/uptime">/api/open/uptime</a>, the API log and <a href="/api/x/f/vitals">/api/x/f/vitals</a>. Raw: <a href="/api/x/o/slo">/api/x/o/slo</a>.' + (av && av.note ? ' ' + esc(av.note) : '') + '</p>';
  }).catch(function () { o.innerHTML = '<p>The objectives could not be computed just now.</p>'; });
})();
