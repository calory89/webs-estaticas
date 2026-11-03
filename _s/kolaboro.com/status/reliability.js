/* Status page: reliability sections (real-user web vitals, hourly user journeys, weekly chaos drill, nightly accessibility audit).
   Every number below is read live from the published JSON or the API; nothing is typed in. */
(function () {
  function e(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function put(id, h) { var x = document.getElementById(id); if (x) x.innerHTML = h; }
  function ago(t) { if (!t) return ''; var s = (Date.now() - new Date(t)) / 1000; if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min ago'; if (s < 86400) return Math.round(s / 3600) + ' h ago'; return Math.round(s / 86400) + ' d ago'; }
  function utc(t) { return e(String(t || '').slice(0, 16).replace('T', ' ')) + ' UTC'; }
  function sec(ms) { return ms == null ? '' : ms < 1000 ? ms + ' ms' : (ms / 1000).toFixed(1) + ' s'; }
  function dot(c) { return '<i class="st-dot ' + c + '"></i>'; }
  function table(label, head, rows) { return '<div class="rl-scroll" role="region" aria-label="' + e(label) + '" tabindex="0"><table class="st-t"><thead><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  function getJ(u) { return fetch(u + (u.indexOf('?') < 0 ? '?' : '&') + 't=' + Math.floor(Date.now() / 3e5), { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }

  // ---------- 16. Real-user web vitals ----------
  var TH = { LCP: [2500, 4000], INP: [200, 500], CLS: [0.1, 0.25], TTFB: [800, 1800] };
  function grade(m, v) { var t = TH[m]; return v == null ? '' : v <= t[0] ? 'g' : v <= t[1] ? 'y' : 'r'; }
  function fmt(m, v) { return v == null ? '' : m === 'CLS' ? (+v).toFixed(3) : Math.round(v) + ' ms'; }
  getJ('/api/x/f/vitals').then(function (d) {
    if (d.state === 'setup') { put('st-vit', '<p>' + dot('y') + '<b>Collecting starts after setup.</b> The browser script and the endpoint are live; samples are accepted and dropped until the storage table is created. No figure is shown until real visits are measured.</p><p class="muted rl-s">' + e(d.method) + '</p>'); return; }
    var o = d.overall_28d || [];
    if (!o.length) { put('st-vit', '<p>' + dot('y') + '<b>Collecting.</b> No visit has been measured yet. Figures appear here after the first real visits.</p><p class="muted rl-s">' + e(d.method) + '</p>'); return; }
    var pages = []; o.forEach(function (r) { if (pages.indexOf(r.page) < 0) pages.push(r.page); });
    var M = ['LCP', 'INP', 'CLS', 'TTFB'];
    var rows = pages.map(function (p) { return '<tr><td>' + (p === 'all' ? '<b>All pages</b>' : e(p)) + '</td>' + M.map(function (m) { var r = o.filter(function (x) { return x.page === p && x.metric === m; })[0]; return '<td>' + (r ? dot(grade(m, r.p75)) + fmt(m, r.p75) + ' <small class="muted">n=' + r.n + '</small>' : '<small class="muted">no data</small>') + '</td>'; }).join('') + '</tr>'; });
    var days = {}; (d.daily || []).forEach(function (r) { days[r.day] = 1; });
    put('st-vit', '<p>75th percentile over the last 28 days from <b>' + e(d.samples_28d) + '</b> measurements in visitors\' browsers, ' + Object.keys(days).length + ' day' + (Object.keys(days).length === 1 ? '' : 's') + ' with data. Green is within Google\'s "good" threshold (LCP 2.5 s, INP 200 ms, CLS 0.1, TTFB 0.8 s).' + (d.samples_28d < 200 ? ' <b>Few samples so far: treat these as early indications.</b>' : '') + '</p>' + table('Web vitals by page type', ['Page type', 'LCP', 'INP', 'CLS', 'TTFB'], rows) + '<p class="muted rl-s">' + e(d.method) + '</p>');
  }).catch(function () { put('st-vit', '<p>Not available just now.</p>'); });

  // ---------- 18. Hourly user journeys ----------
  getJ('/data/journeys.json').then(function (j) {
    var runs = j.runs || [], last = runs[0];
    if (!last) { put('st-jr', '<p>The first run appears here within the hour.</p>'); return; }
    var pass = runs.filter(function (r) { return r.ok; }).length, max = Math.max.apply(null, runs.map(function (r) { return r.total_ms || 0; }).concat([1]));
    var h = '<p>' + dot(last.ok ? 'g' : 'r') + '<b>' + (last.ok ? 'Last run passed' : 'Last run failed') + '</b> ' + ago(last.at) + ' in ' + sec(last.total_ms) + ' · <b>' + pass + ' of ' + runs.length + '</b> recent runs passed. A real Chrome on a GitHub runner, outside Cloudflare, does what a buyer does: ' + e((j.journey || []).join(' → ')) + '.</p>';
    h += '<div class="rl-hist" aria-label="Total journey time, last ' + runs.length + ' runs, oldest left">' + runs.slice().reverse().map(function (r) { return '<i class="' + (r.ok ? 'g' : 'r') + '" style="height:' + Math.max(6, Math.round((r.total_ms || 0) / max * 100)) + '%" title="' + e(String(r.at).slice(0, 16).replace('T', ' ')) + ' UTC · ' + sec(r.total_ms) + (r.ok ? '' : ' · failed') + '"></i>'; }).join('') + '</div><p class="muted rl-s">Bar height: total journey time per run, oldest on the left. Red: a step failed.</p>';
    var med = j.median_ms_by_step || {};
    h += table('Last journey, step by step', ['Step', 'Result', 'Time', 'Median (' + runs.length + ' runs)', 'Detail'], (last.steps || []).map(function (s) { return '<tr><td>' + s.n + '. ' + e(s.name) + '</td><td>' + (s.skipped ? dot('y') + 'Not run' : s.ok ? dot('g') + 'Passed' : dot('r') + 'Failed') + '</td><td>' + sec(s.ms) + '</td><td>' + sec(med[s.n]) + '</td><td>' + e(s.detail) + (s.console_errors ? ' <small class="muted">(' + s.console_errors + ' console error' + (s.console_errors === 1 ? '' : 's') + ')</small>' : '') + '</td></tr>'; }));
    var v = encodeURIComponent(last.at);
    h += '<div class="rl-shots">' + (last.steps || []).filter(function (s) { return s.shot; }).map(function (s) { return '<figure><a href="/data/journeys/' + s.n + '.webp?t=' + v + '" target="_blank" rel="noopener"><img src="/data/journeys/' + s.n + '.webp?t=' + v + '" width="640" height="400" loading="lazy" decoding="async" alt="Screenshot of step ' + s.n + ', ' + e(s.name) + ', ' + utc(last.at) + '"></a><figcaption>' + s.n + '. ' + e(s.name) + '</figcaption></figure>'; }).join('') + '</div>';
    put('st-jr', h);
  }).catch(function () { put('st-jr', '<p>The first run appears here within the hour.</p>'); });

  // ---------- 17. Weekly chaos drill ----------
  getJ('/data/chaos.json').then(function (c) {
    var r = (c.runs || [])[0];
    if (!r) { put('st-ch', '<p>The first drill result appears here after it runs.</p>'); return; }
    var sc = r.scenarios || [], ok = sc.filter(function (s) { return s.pass === true; }).length, ran = sc.filter(function (s) { return s.pass !== null; }).length;
    var h = '<p>' + dot(ok === ran ? 'g' : 'r') + '<b>' + ok + ' of ' + ran + '</b> forced failures handled as designed on ' + utc(r.at) + '. Against production, every week: we break things on purpose and check that the site degrades honestly instead of inventing an answer or hanging.' + ((c.runs || []).length > 1 ? ' Previous runs: ' + c.runs.slice(1, 7).map(function (x) { return e(String(x.at).slice(0, 10)) + ' ' + x.passed + '/' + x.ran; }).join(', ') + '.' : '') + '</p>';
    h += table('Chaos drill scenarios', ['Scenario', 'Expected', 'Observed', 'Result', 'Time'], sc.map(function (s) { return '<tr><td><b>' + e(s.title || s.id) + '</b><br><small class="muted">' + e(s.forced || '') + '</small></td><td>' + e(s.expected) + '</td><td>' + e(s.observed_text || '') + '</td><td>' + (s.pass === true ? dot('g') + 'Pass' : s.pass === false ? dot('r') + 'Fail' : dot('y') + 'Skipped') + '</td><td>' + sec(s.ms) + '</td></tr>'; }));
    if ((c.not_covered || []).length) h += '<p class="rl-s"><b>Not covered yet:</b> ' + c.not_covered.map(e).join(' · ') + '</p>';
    put('st-ch', h);
  }).catch(function () { put('st-ch', '<p>The first drill result appears here after it runs.</p>'); });

  // ---------- 19. Nightly accessibility ----------
  getJ('/data/a11y.json').then(function (a) {
    var s = a.summary || {}, b = s.nodes_by_impact || {}, sc = (b.serious || 0) + (b.critical || 0);
    var h = '<p>' + dot(sc ? 'r' : 'g') + '<b>' + sc + '</b> serious or critical issues (goal: 0) on ' + utc(a.updated) + '. ' + e(s.pages) + ' pages from the sitemap checked with ' + e(a.tool) + '; <b>' + e(s.pages_clean) + '</b> have no issue at all, ' + e(s.pages_with_serious_or_critical) + ' have a serious or critical one. Moderate ' + (b.moderate || 0) + ', minor ' + (b.minor || 0) + (s.errors ? ', ' + s.errors + ' pages could not be loaded' : '') + '.</p>';
    var hist = (a.history || []).slice(0, 30).reverse();
    if (hist.length > 1) { var mx = Math.max.apply(null, hist.map(function (x) { var k = x.nodes_by_impact || {}; return (k.serious || 0) + (k.critical || 0); }).concat([1])); h += '<div class="rl-hist" aria-label="Serious and critical issues per night, oldest left">' + hist.map(function (x) { var k = x.nodes_by_impact || {}, n = (k.serious || 0) + (k.critical || 0); return '<i class="' + (n ? 'r' : 'g') + '" style="height:' + Math.max(6, Math.round(n / mx * 100)) + '%" title="' + e(String(x.at).slice(0, 10)) + ': ' + n + '"></i>'; }).join('') + '</div><p class="muted rl-s">Serious and critical issues per night, oldest on the left.</p>'; }
    var rules = a.rules || [];
    h += rules.length ? table('Accessibility issues by rule', ['Rule', 'Impact', 'Pages', 'Elements', 'Examples'], rules.map(function (r) { return '<tr><td><a href="' + e(r.helpUrl) + '" target="_blank" rel="noopener">' + e(r.id) + '</a><br><small class="muted">' + e(r.help) + '</small></td><td>' + dot(r.impact === 'critical' || r.impact === 'serious' ? 'r' : 'y') + e(r.impact) + '</td><td>' + r.pages + '</td><td>' + r.nodes + '</td><td>' + r.examples.map(function (u) { return '<a href="' + e(u) + '">' + e(u) + '</a>'; }).join(' ') + '</td></tr>'; })) : '<p>No violation found on any page.</p>';
    h += '<p class="muted rl-s">Automated rules catch only part of accessibility problems; keyboard and screen-reader checks by people are still needed. Full list per page: <a href="/data/a11y.json">a11y.json</a>.</p>';
    put('st-a11y', h);
  }).catch(function () { put('st-a11y', '<p>The first audit result appears here after it runs.</p>'); });
})();
