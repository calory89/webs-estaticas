/* Kolaboro quality pages (block W6, 5 Nov 2026): renders /engineering/visual-tests/, /engineering/page-weight/ and
   /engineering/speed/ from the files the daily quality job publishes and from /api/x/qa/speed. No library. */
(function () {
  var root = document.querySelector('[data-qa]'); if (!root || !window.fetch) return;
  var kind = root.getAttribute('data-qa');
  function e(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function when(iso) { var d = new Date(iso); return isNaN(d) ? '' : d.toISOString().slice(0, 16).replace('T', ' ') + ' UTC'; }
  function kb(b) { return b == null ? '' : b === 0 ? '0' : (b / 1024 < 10 ? (b / 1024).toFixed(1) : Math.round(b / 1024)) + ' KB'; }
  function fail(msg) { root.innerHTML = '<p class="qa-empty">' + e(msg) + '</p>'; }
  function tiles(a) { return '<div class="eg-k">' + a.map(function (x) { return '<div><b' + (x[2] ? ' class="' + x[2] + '"' : '') + '>' + e(x[0]) + '</b><span>' + e(x[1]) + '</span></div>'; }).join('') + '</div>'; }
  function scroller(label, html) { return '<div class="qa-scroll" tabindex="0" role="region" aria-label="' + e(label) + '">' + html + '</div>'; }
  function get(u) { return fetch(u, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }

  if (kind === 'visual') get('/data/visual-tests.json').then(function (d) {
    var s = d.summary || {}, by = {}, h = '';
    h += '<p class="qa-when">Latest run: <b>' + e(when(d.updated)) + '</b>, ' + e(s.checks) + ' screenshots in ' + e(d.seconds) + ' s. Source: <a href="/data/visual-tests.json">/data/visual-tests.json</a>.</p>';
    h += tiles([[s.pass, 'unchanged since the previous run', 'ok'], [s.changed, 'changed (more than ' + d.changed_threshold_pct + '% of pixels)', s.changed ? 'no' : 'ok'], [s.new_baseline, 'first capture (no previous run to compare)'], [s.errors, 'could not load', s.errors ? 'no' : '']]);
    if (s.new_baseline && !s.pass && !s.changed) h += '<p>This was the first run, so every page became a baseline. From the next run on, each page is compared with the one before.</p>';
    (d.results || []).forEach(function (r) { (by[r.page] = by[r.page] || {})[r.width] = r; });
    function st(r) {
      if (!r) return '<td>-</td>';
      var lab = { pass: '<span class="ok">pass</span>', changed: '<span class="no">changed</span>', baseline: 'baseline', error: '<span class="no">error</span>' }[r.status] || e(r.status);
      return '<td>' + lab + (r.diff_pct != null ? ' <small>' + e(r.diff_pct) + '%</small>' : '') + (r.prev_height && r.height !== r.prev_height ? '<br><small>height ' + e(r.prev_height) + ' to ' + e(r.height) + ' px</small>' : '') + (r.error ? '<br><small>' + e(r.error) + '</small>' : '') + '</td>';
    }
    var rows = Object.keys(by).map(function (p) { return '<tr><td><a href="' + e(p) + '">' + e(p) + '</a></td>' + st(by[p][390]) + st(by[p][1440]) + '</tr>'; }).join('');
    h += '<h2>Every page</h2>' + scroller('Visual test results', '<table class="eg-t"><thead><tr><th scope="col">Page</th><th scope="col">Phone 390 px</th><th scope="col">Desktop 1440 px</th></tr></thead><tbody>' + rows + '</tbody></table>');
    var ch = (d.results || []).filter(function (r) { return r.status === 'changed'; });
    h += '<h2>What changed</h2>';
    if (!ch.length) h += '<p>No page changed in the latest run.</p>';
    ch.forEach(function (r) {
      h += '<figure class="qa-fig"><figcaption><b>' + e(r.page) + '</b> at ' + e(r.width) + ' px: ' + e(r.diff_pct) + '% of pixels differ. Left: previous run. Middle: latest. Right: differences in red.</figcaption>' +
        (r.image ? '<img src="/engineering/visual-tests/img/' + e(r.image) + '?r=' + e(String(d.updated).slice(0, 10)) + '" alt="Previous, latest and difference screenshots of ' + e(r.page) + ' at ' + e(r.width) + ' px" loading="lazy" decoding="async">' : '<p><small>No image kept for this one (at most 16 images per run, largest changes first).</small></p>') + '</figure>';
    });
    root.innerHTML = h;
  }).catch(function () { fail('The first visual test run has not been published yet. It appears here after the daily quality job runs.'); });

  if (kind === 'weight') get('/data/page-weight.json').then(function (d) {
    var pages = d.pages || [], h = '';
    var over = d.breaches || [];
    h += '<p class="qa-when">Latest run: <b>' + e(when(d.updated)) + '</b>, ' + e(pages.length) + ' page loads. Source: <a href="/data/page-weight.json">/data/page-weight.json</a>.</p>';
    var avgTP = 0, avgT = 0; pages.forEach(function (p) { avgTP += p.by_type.third_party; avgT += p.total; });
    h += tiles([[pages.length ? kb(avgT / pages.length) : '-', 'average page, all bytes'], [pages.length ? Math.round(100 * avgTP / avgT) + '%' : '-', 'of those bytes are third party'], [over.length, 'page loads over budget', over.length ? 'no' : 'ok'], [(d.errors || []).length, 'pages that failed to load', (d.errors || []).length ? 'no' : '']]);
    if (over.length) h += '<p><span class="no">Over budget:</span> ' + over.map(function (b) { return e(b.page) + ' (' + e(b.view) + ': ' + b.over.map(function (o) { return e(o.metric) + ' ' + kb(o.value) + ' &gt; ' + kb(o.budget); }).join(', ') + ')'; }).join('; ') + '. The daily job is marked failed until this is fixed or the budget is changed on purpose. Deploys are not blocked.</p>';
    else h += '<p><span class="ok">Every page is within its budget.</span></p>';
    var cols = ['html', 'css', 'js', 'images', 'fonts', 'other', 'third_party'];
    var head = '<tr><th scope="col">Page</th><th scope="col">View</th><th scope="col">Type</th>' + cols.map(function (c) { return '<th scope="col">' + e(c.replace('_', ' ')) + '</th>'; }).join('') + '<th scope="col">Total</th><th scope="col">Budget</th><th scope="col">Requests</th></tr>';
    var rows = pages.map(function (p) {
      var bad = {}; (p.over || []).forEach(function (o) { bad[o.metric] = 1; });
      return '<tr><td><a href="' + e(p.page) + '">' + e(p.page) + '</a></td><td>' + e(p.view) + '</td><td>' + e(p.type) + '</td>' + cols.map(function (c) { return '<td' + (bad[c] ? ' class="no"' : '') + '>' + kb(p.by_type[c]) + '</td>'; }).join('') + '<td' + (bad.total ? ' class="no"' : '') + '><b>' + kb(p.total) + '</b></td><td>' + (p.budget ? kb(p.budget.total) : '-') + '</td><td>' + e(p.requests) + '</td></tr>';
    }).join('');
    h += '<h2>Every page</h2>' + scroller('Page weight by resource type', '<table class="eg-t qa-num"><thead>' + head + '</thead><tbody>' + rows + '</tbody></table>');
    var hosts = {}; pages.forEach(function (p) { Object.keys(p.third_party_hosts || {}).forEach(function (k) { hosts[k] = (hosts[k] || 0) + p.third_party_hosts[k]; }); });
    var hl = Object.keys(hosts).sort(function (a, b) { return hosts[b] - hosts[a]; }).filter(function (k) { return hosts[k] / pages.length >= 512; });
    h += '<h2>Where third-party bytes come from</h2><p>Average per page load, hosts with at least 0.5 KB.</p>' + scroller('Third-party bytes by host', '<table class="eg-t qa-num"><thead><tr><th scope="col">Host</th><th scope="col">Average per page</th></tr></thead><tbody>' + hl.map(function (k) { return '<tr><td>' + e(k) + '</td><td>' + kb(hosts[k] / pages.length) + '</td></tr>'; }).join('') + '</tbody></table>');
    var B = (d.budgets && d.budgets.budgets) || {};
    h += '<h2>Budgets</h2><p>' + e(d.budgets && d.budgets.note) + '</p>' + scroller('Budgets by page type', '<table class="eg-t qa-num"><thead><tr><th scope="col">Page type</th><th scope="col">View</th><th scope="col">Total</th><th scope="col">JS</th><th scope="col">CSS</th><th scope="col">Images</th><th scope="col">Fonts</th><th scope="col">Third party</th></tr></thead><tbody>' +
      Object.keys(B).map(function (t) { return Object.keys(B[t]).map(function (v) { var b = B[t][v]; return '<tr><td>' + e(t) + '</td><td>' + e(v) + '</td><td>' + kb(b.total) + '</td><td>' + kb(b.js) + '</td><td>' + kb(b.css) + '</td><td>' + kb(b.images) + '</td><td>' + kb(b.fonts) + '</td><td>' + kb(b.third_party) + '</td></tr>'; }).join(''); }).join('') + '</tbody></table>');
    root.innerHTML = h;
  }).catch(function () { fail('The first page-weight run has not been published yet. It appears here after the daily quality job runs.'); });

  if (kind === 'speed') get('/api/x/qa/speed').then(function (d) {
    var h = '', M = ['LCP', 'INP', 'CLS', 'TTFB'], T = d.thresholds || {};
    h += '<p class="qa-when">Computed <b>' + e(when(d.updated)) + '</b> from the live table (cached 10 minutes). First day with data: ' + e(d.first_day || 'none yet') + '. Source: <a href="/api/x/qa/speed">/api/x/qa/speed</a>.</p>';
    if (d.note) h += '<p class="qa-note">' + e(d.note) + '</p>';
    function fmt(m, v) { return v == null ? '' : m === 'CLS' ? (+v).toFixed(3) : Math.round(v) + ' ms'; }
    function table(w, label) {
      if (!w) return '<h2>' + e(label) + '</h2><p>Not available yet (see the note above).</p>';
      var rows = {}, devs = w.device_split ? ['mobile', 'desktop'] : ['all'];
      (w.rows || []).forEach(function (r) { if (devs.indexOf(r.device) >= 0 || (!w.device_split && r.device === 'all')) ((rows[r.page] = rows[r.page] || {})[r.device] = rows[r.page][r.device] || {})[r.metric] = r; });
      var order = (d.pages || []).filter(function (p) { return rows[p]; });
      var head = '<tr><th scope="col" rowspan="2">Page type</th>' + devs.map(function (dv) { return '<th scope="colgroup" colspan="4">' + e(dv === 'all' ? 'all devices' : dv) + '</th>'; }).join('') + '</tr><tr>' + devs.map(function () { return M.map(function (m) { return '<th scope="col">' + m + ' p75</th>'; }).join(''); }).join('') + '</tr>';
      var body = order.map(function (p) {
        return '<tr><th scope="row">' + e(p === 'all' ? 'all pages' : p) + '</th>' + devs.map(function (dv) {
          return M.map(function (m) {
            var c = rows[p][dv] && rows[p][dv][m]; if (!c) return '<td><small>no samples</small></td>';
            if (!c.enough) return '<td><small>n=' + e(c.n) + ', needs ' + e(d.min_samples) + '</small></td>';
            var cls = c.rating === 'good' ? 'ok' : c.rating === 'poor' ? 'no' : 'qa-mid';
            return '<td><span class="' + cls + '">' + fmt(m, c.p75) + '</span><br><small>n=' + e(c.n) + '</small></td>';
          }).join('');
        }).join('') + '</tr>';
      }).join('');
      return '<h2>' + e(label) + '</h2><p>' + e(w.samples) + ' samples' + (w.device_split ? '' : ', phones and desktops combined') + '.</p>' + (order.length ? scroller(label, '<table class="eg-t qa-num"><thead>' + head + '</thead><tbody>' + body + '</tbody></table>') : '<p>No samples in this window yet.</p>');
    }
    if (d.state === 'unavailable') { root.innerHTML = h; return; }
    h += table(d.windows && d.windows['7d'], 'Last 7 days') + table(d.windows && d.windows['28d'], 'Last 28 days');
    h += '<p><small>Colours use the web.dev boundaries: good up to ' + M.map(function (m) { return m + ' ' + fmt(m, T[m] && T[m][0]); }).join(', ') + '; poor above ' + M.map(function (m) { return m + ' ' + fmt(m, T[m] && T[m][1]); }).join(', ') + '. A cell with fewer than ' + e(d.min_samples) + ' samples shows only its sample count.</small></p>';
    root.innerHTML = h;
  }).catch(function () { fail('The real-user speed data could not be loaded just now. Nothing is estimated in its place.'); });
})();
