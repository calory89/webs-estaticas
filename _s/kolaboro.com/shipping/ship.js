/* Kolaboro shipping log page. Reads /data/shipping.json (built hourly by GitHub Actions from the git history of the live branch),
   /data/roadmap-sync.json and the live uptime figure. Everything shown is computed from those files in this browser. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var e = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  function d0(s) { var p = s.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  function ds(d) { return d.toISOString().slice(0, 10); }
  function hd(s) { var d = d0(s); return d.getUTCDate() + ' ' + MONL[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }
  function sd(s) { var d = d0(s); return d.getUTCDate() + ' ' + MON[d.getUTCMonth()]; }
  function n(x) { return x == null ? 'n/a' : Number(x).toLocaleString('en-GB'); }
  function dur(s) { if (s == null) return 'n/a'; s = Math.round(s); return s < 120 ? s + ' s' : (Math.round(s / 6) / 10) + ' min'; }
  function lvl(c) { return !c ? 0 : c < 5 ? 1 : c < 20 ? 2 : c < 80 ? 3 : 4; }
  var LVL = ['0', '1 to 4', '5 to 19', '20 to 79', '80 or more'];
  var METH = { 'ai-checked': 'Written by AI from the day’s commits, checked by code', 'deterministic': 'Taken from the day’s commit subjects', 'so-far': 'Day in progress: commit subjects so far', 'none': '' };
  var D, byDate = {}, sel = null;

  function kpis() {
    var s = D.streak, t = D.totals;
    $('sh-k').innerHTML =
      '<div><b>' + n(s.current) + ' day' + (s.current === 1 ? '' : 's') + '</b><span>current daily streak' + (s.current_from ? ', since ' + e(sd(s.current_from)) : '') + (s.counts_today ? '' : ' (nothing shipped yet today)') + '</span></div>' +
      '<div><b>' + n(s.longest) + ' day' + (s.longest === 1 ? '' : 's') + '</b><span>longest streak' + (s.longest_from ? ', ' + e(sd(s.longest_from)) + ' to ' + e(sd(s.longest_to)) : '') + '</span></div>' +
      '<div><b>' + n(t.ships_today) + '</b><span>changes shipped today (UTC)</span></div>' +
      '<div><b>' + n(t.ships) + '</b><span>changes in ' + n(t.calendar_days) + ' days, ' + n(t.days_with_ships) + ' of them with a ship</span></div>';
    $('sh-gen').textContent = 'Data built ' + D.generated_at.replace('T', ' ').slice(0, 16) + ' UTC from the git history; first commit day ' + hd(D.first_day) + '.';
  }

  function calendar() {
    var first = d0(D.first_day), last = d0(D.today);
    var start = new Date(first); start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
    var cols = [], d = new Date(start);
    while (d <= last) { var col = []; for (var i = 0; i < 7; i++) { col.push(new Date(d)); d.setUTCDate(d.getUTCDate() + 1); } cols.push(col); }
    var h = '<div class="sh-cal" role="grid" aria-label="Changes shipped per day"><div class="sh-wd" aria-hidden="true">' + WD.map(function (w, i) { return '<span>' + (i % 2 ? '' : w) + '</span>'; }).join('') + '</div>';
    cols.forEach(function (col) {
      var m = col[0].getUTCDate() <= 7 || col === cols[0] ? MON[col[0].getUTCMonth()] : '';
      h += '<div class="sh-col" role="row"><span class="sh-mo" aria-hidden="true">' + m + '</span>';
      col.forEach(function (x) {
        var k = ds(x);
        if (x < first || x > last) { h += '<span class="sh-c sh-out" aria-hidden="true"></span>'; return; }
        var r = byDate[k], c = r ? r.ships : 0;
        h += '<button type="button" role="gridcell" class="sh-c l' + lvl(c) + '" data-d="' + k + '" aria-label="' + e(hd(k)) + ': ' + c + ' change' + (c === 1 ? '' : 's') + ' shipped' + (r && r.data_updates ? ', ' + r.data_updates + ' data updates' : '') + '"></button>';
      });
      h += '</div>';
    });
    h += '</div>';
    $('sh-cal').innerHTML = h;
    $('sh-leg').innerHTML = 'Changes shipped per UTC day: ' + LVL.map(function (l, i) { return '<span><i class="sh-c l' + i + '"></i>' + l + '</span>'; }).join('');
    var tip = $('sh-tip');
    $('sh-cal').addEventListener('click', function (ev) { var b = ev.target.closest('[data-d]'); if (b) pick(b.dataset.d, true); });
    $('sh-cal').addEventListener('mouseover', function (ev) {
      var b = ev.target.closest('[data-d]'); if (!b) { tip.hidden = true; return; }
      var r = byDate[b.dataset.d];
      tip.innerHTML = '<b>' + e(hd(b.dataset.d)) + '</b><br>' + (r ? r.ships : 0) + ' shipped' + (r && r.data_updates ? ' &middot; ' + r.data_updates + ' data updates' : '');
      var a = b.getBoundingClientRect(), p = $('sh-calw').getBoundingClientRect();
      tip.hidden = false;
      var x = a.left - p.left + a.width / 2 - tip.offsetWidth / 2; x = Math.max(0, Math.min(x, p.width - tip.offsetWidth));
      tip.style.left = x + 'px'; tip.style.top = (a.top - p.top - tip.offsetHeight - 8) + 'px';
    });
    $('sh-cal').addEventListener('mouseleave', function () { tip.hidden = true; });
  }

  function lines(r) {
    if (!r || !r.summary || !r.summary.lines.length) return '<p class="muted">Nothing shipped this day.</p>';
    return '<ul class="sh-sum">' + r.summary.lines.map(function (l) {
      return '<li>' + e(l.text) + ' <span class="sh-ids">' + l.commits.map(function (c) { return '<code>' + e(c) + '</code>'; }).join(' ') + '</span></li>';
    }).join('') + '</ul><p class="sh-m">' + e(METH[r.summary.method] || '') + (r.summary.fallback_reason ? '. The AI version was rejected by the code check (' + e(r.summary.fallback_reason) + ').' : '') + '</p>';
  }
  function commits(r) {
    if (!r || !r.commits.length) return '';
    return '<details class="sh-det"><summary>All ' + r.commits.length + ' commit subject' + (r.commits.length === 1 ? '' : 's') + ' (privacy-filtered)</summary><ul>' +
      r.commits.map(function (c) { return '<li><code>' + e(c.id) + '</code> <span class="muted">' + e(c.time) + '</span> ' + e(c.s) + '</li>'; }).join('') + '</ul></details>';
  }
  function dataKinds(r) {
    if (!r || !r.data_updates) return '';
    var k = Object.keys(r.data_kinds || {}).sort(function (a, b) { return r.data_kinds[b] - r.data_kinds[a]; });
    return '<p class="sh-m">Automatic data updates (not counted as ships): ' + k.map(function (x) { return e(x) + ' ' + r.data_kinds[x]; }).join(', ') + '.</p>';
  }
  function pageLink(r, k) {
    if (r && r.page) return '<a href="' + e(r.page) + '">Day page' + (r.page_by === 'auto' ? ' (written automatically)' : '') + '</a>';
    return k === D.today ? '<span class="muted">Day page appears after midnight UTC</span>' : '';
  }

  function pick(k, scroll) {
    sel = k;
    [].forEach.call(document.querySelectorAll('.sh-c[aria-selected]'), function (b) { b.removeAttribute('aria-selected'); });
    var b = document.querySelector('.sh-c[data-d="' + k + '"]'); if (b) b.setAttribute('aria-selected', 'true');
    var r = byDate[k];
    $('sh-day').innerHTML = '<h3>' + e(hd(k)) + ': ' + (r ? r.ships : 0) + ' change' + (r && r.ships === 1 ? '' : 's') + ' shipped</h3>' + lines(r) + dataKinds(r) + commits(r) +
      '<p class="sh-m">' + pageLink(r, k) + (r && r.ships ? ' &middot; <a href="#d-' + k + '">In the list below</a>' : '') + '</p>';
    if (scroll && innerWidth < 760) $('sh-day').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function list() {
    var h = '';
    D.days.slice().reverse().forEach(function (r) {
      if (!r.ships) return;
      h += '<article class="sh-d" id="d-' + r.date + '"><h3><a href="#d-' + r.date + '">' + e(hd(r.date)) + '</a> <small>' + r.ships + ' shipped' + (r.data_updates ? ' &middot; ' + r.data_updates + ' data updates' : '') + '</small></h3>' +
        lines(r) + commits(r) + '<p class="sh-m">' + pageLink(r, r.date) + '</p></article>';
    });
    $('sh-list').innerHTML = h;
  }

  function src(o) { return o ? '<p class="sh-src"><b>Source:</b> ' + e(o.source) + '. <b>How:</b> ' + e(o.method) + '</p>' : ''; }

  function metrics() {
    var m = D.metrics || {}, dp = m.deploys || {}, cl = m.commit_to_live || {}, rb = m.rollbacks || {}, wr = m.workflow_runs || {}, jb = m.jobs || {};
    var today = (wr.per_day || {})[D.today];
    $('sh-ek').innerHTML =
      '<div><b>' + dur(cl.median_s) + '</b><span>median commit to live, ' + n(cl.samples) + ' deploys</span></div>' +
      '<div><b>' + n(rb.automatic_rollbacks) + '</b><span>automatic rollbacks by the deploy guard</span></div>' +
      '<div><b>' + (today ? n(today.runs) : 'n/a') + '</b><span>workflow runs today (checks and jobs)</span></div>' +
      '<div id="sh-up"><b>' + (m.uptime_snapshot && m.uptime_snapshot.data ? e(m.uptime_snapshot.data.uptime_7d) + '%' : 'n/a') + '</b><span>uptime over 7 days</span></div>';
    var days = D.days.map(function (r) { return r.date; });
    var all = {}; days.forEach(function (k) { all[k] = 1; }); Object.keys(dp.per_day || {}).forEach(function (k) { all[k] = 1; }); Object.keys(wr.per_day || {}).forEach(function (k) { all[k] = 1; });
    var keys = Object.keys(all).sort().reverse().slice(0, 14);
    var rows = keys.map(function (k) {
      var r = byDate[k] || {}, p = (dp.per_day || {})[k] || {}, w = (wr.per_day || {})[k];
      return '<tr><th scope="row">' + e(sd(k)) + '</th><td>' + n(r.ships || 0) + '</td><td>' + n(r.data_updates || 0) + '</td><td>' + n(p.checked_live || 0) + (p.not_deployed ? ' <span class="muted">(+' + p.not_deployed + ' not live in 12 min)</span>' : '') + '</td><td>' + n((p.rolled_back || 0) + (p.rollback_failed || 0)) + '</td><td>' + n(p.smoke_checks_run || 0) + '</td><td>' + (w ? n(w.runs) + ' <span class="muted">(' + n(w.success) + ' ok, ' + n(w.failure) + ' failed)</span>' : 'n/a') + '</td></tr>';
    }).join('');
    $('sh-et').innerHTML = '<div class="sh-tw"><table class="eg-t"><caption class="sr">Engineering numbers per UTC day, last 14 days</caption><thead><tr><th scope="col">Day</th><th scope="col">Ships</th><th scope="col">Data updates</th><th scope="col">Deploys checked live</th><th scope="col">Rollbacks</th><th scope="col">Smoke checks run</th><th scope="col">Workflow runs</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    $('sh-es').innerHTML =
      '<p class="sh-src"><b>Ships and data updates:</b> ' + e(D.definitions.ship) + ' ' + e(D.definitions.data_update) + '</p>' +
      src(dp) + '<p class="sh-src"><b>Commit to live.</b> ' + e(cl.source) + '. ' + e(cl.method) + ' 90th percentile ' + dur(cl.p90_s) + '.</p>' + src(rb) + src(wr) +
      '<p class="sh-src"><b>Uptime:</b> read live from <a href="/api/open/uptime">/api/open/uptime</a>, the figure on <a href="/status/">/status</a>: probes of the home page and the API from outside Cloudflare.</p>';
    var it = (jb.items || []).slice().sort(function (a, b) { return String(b.last_run_at).localeCompare(String(a.last_run_at)); });
    var bad = it.filter(function (j) { return j.last_result && j.last_result !== 'success' && j.last_status === 'completed'; }).length;
    $('sh-jobs').innerHTML = it.length ? '<details class="sh-det"><summary>' + it.length + ' scheduled jobs: ' + (it.length - bad) + ' with a successful or running last run, ' + bad + ' not</summary><div class="sh-tw"><table class="eg-t"><thead><tr><th scope="col">Job</th><th scope="col">Schedule (cron, UTC)</th><th scope="col">Last run (UTC)</th><th scope="col">Result</th></tr></thead><tbody>' +
      it.map(function (j) { var ok = j.last_result === 'success'; return '<tr><td>' + e(j.name.replace(/^Kolaboro /, '')) + '</td><td><code>' + e((j.schedule_utc || []).join(', ') || (j.on_push ? 'on push' : 'manual')) + '</code></td><td>' + e(j.last_run_at ? j.last_run_at.slice(0, 16).replace('T', ' ') : 'never') + (j.last_event ? ' <span class="muted">' + e(j.last_event) + '</span>' : '') + '</td><td class="' + (ok ? 'ok' : j.last_result ? 'no' : '') + '">' + e(j.last_result || 'n/a') + '</td></tr>'; }).join('') +
      '</tbody></table></div></details>' + src(jb) : '<p class="muted">Job status not available in this build.</p>';
    fetch('/api/open/uptime').then(function (r) { return r.json(); }).then(function (u) {
      if (u && u.uptime_7d != null) $('sh-up').innerHTML = '<b>' + e(u.uptime_7d) + '%</b><span>uptime over 7 days, ' + n(u.probes_30d) + ' probes in 30 days (live)</span>';
    }).catch(function () {});
  }

  function roadmap() {
    fetch('/data/roadmap-sync.json', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (R) {
      var it = R.items || [];
      $('sh-rm').innerHTML = '<p>' + n(R.verified_live) + ' of ' + n(R.linked) + ' linked roadmap items answered the nightly check on ' + e(String(R.generated_at).slice(0, 16).replace('T', ' ')) + ' UTC. ' + e(R.marker_rule) + '.</p><ul class="sh-rml">' +
        it.map(function (i) { return '<li><span class="' + (i.shipped ? 'ok' : 'no') + '">' + (i.shipped ? 'Live' : 'Check failed') + '</span> #' + i.n + ' ' + e(i.title) + ': <a href="' + e(i.page) + '">' + e(i.page) + '</a>' + (i.shipped ? '' : ' <span class="muted">(HTTP ' + e(i.http) + (i.marker_found ? '' : ', marker missing') + ')</span>') + '</li>'; }).join('') + '</ul>';
    }).catch(function () { $('sh-rm').innerHTML = '<p class="muted">The first roadmap check has not run yet.</p>'; });
  }

  fetch('/data/shipping.json', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) {
    D = d; d.days.forEach(function (r) { byDate[r.date] = r; });
    kpis(); calendar(); list(); metrics();
    var h = location.hash.match(/^#d-(\d{4}-\d{2}-\d{2})$/);
    var lastShip = d.days.slice().reverse().filter(function (r) { return r.ships; })[0];
    pick(h && byDate[h[1]] ? h[1] : (lastShip ? lastShip.date : d.today));
    if (h) { var t = $('d-' + h[1]); if (t) t.scrollIntoView(); }
  }).catch(function () {
    ['sh-k', 'sh-cal', 'sh-list', 'sh-ek'].forEach(function (id) { $(id).innerHTML = '<p class="muted">The shipping log is starting: its first build has not been published yet. Try again in an hour.</p>'; });
  });
  roadmap();
  var bc = $('sh-bc'); if (bc) bc.addEventListener('click', function () {
    var t = $('sh-emb').textContent;
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { bc.textContent = 'Copied'; setTimeout(function () { bc.textContent = 'Copy embed code'; }, 1800); }, function () { bc.textContent = 'Select the code above to copy'; });
  });
})();
