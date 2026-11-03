/* /visual/: renders /data/visual-diff.json. Only page geometry is published: no screenshots, no URLs, no names. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function d(s) { if (!s) return 'n/a'; var p = String(s).split('-'); return +p[2] + ' ' + MON[+p[1] - 1] + ' ' + p[0]; }
  function n(x) { return (x || 0).toLocaleString('en-US'); }
  // schematic page map: the page as a grey column, changed regions in orange, removed content as a dashed line
  function map(c) {
    var W = 76, ph = Math.max(900, c.page_h || 3000), H = Math.round(Math.min(220, Math.max(70, W * ph / 1280)));
    var h = '<svg class="vd-map" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Page map: ' + (c.regions || []).length + ' changed regions covering ' + c.area_pct + '% of the page"><rect class="pg" x="0" y="0" width="' + W + '" height="' + H + '"/>';
    (c.regions || []).forEach(function (r) {
      h += '<rect class="ch" x="' + (r[0] * W).toFixed(1) + '" y="' + (r[1] * H).toFixed(1) + '" width="' + Math.max(2, r[2] * W).toFixed(1) + '" height="' + Math.max(1.5, r[3] * H).toFixed(1) + '"/>';
    });
    return h + '</svg>';
  }
  var D, shown = 60;
  function list() {
    var mode = $('vdSel').value, mk = $('vdMk').value;
    var P = D.projects.filter(function (p) { return (mode === 'all' || p.changes.length) && (!mk || p.market === mk); });
    if (!P.length) {
      $('vdList').innerHTML = '<div class="vd-empty">' + (mode === 'changes' ? 'No visible change listed yet' + (mk ? ' in ' + esc(mk) : '') + '. A first capture is only a baseline, so a change can show from a project\'s second capture on. Baselines so far: ' + n(D.totals.projects_with_baseline) + '.' : 'No project captured yet' + (mk ? ' in ' + esc(mk) : '') + '.') + '</div>';
      return;
    }
    var h = P.slice(0, shown).map(function (p) {
      var c = p.changes[p.changes.length - 1];
      if (!c) return '<article class="vd-c"><div class="vd-map" style="height:70px" aria-hidden="true"></div><div><h3><a href="/p/?id=' + encodeURIComponent(p.id) + '">' + esc(p.id) + '</a></h3><p>' + esc(p.market || '') + '</p><p>Baseline captured ' + esc(d(p.baseline)) + '. No visible change since.</p></div></article>';
      return '<article class="vd-c">' + map(c) + '<div><h3><a href="/p/?id=' + encodeURIComponent(p.id) + '">' + esc(p.id) + '</a></h3><p>' + esc(p.market || '') + '</p>' +
        '<p class="vd-big">' + c.area_pct.toFixed(1) + '%</p><p>of the page changed between ' + esc(d(c.before_date)) + ' and ' + esc(d(c.date)) + ' (' + c.regions.length + ' region' + (c.regions.length === 1 ? '' : 's') + ')</p>' +
        (c.masked_pct >= 5 ? '<p class="vd-fine">' + Math.round(c.masked_pct) + '% of the page moved on its own while we looked (carousels, animation) and was not compared.</p>' : '') +
        (p.changes.length > 1 ? '<div class="vd-tl" title="Earlier visible changes">' + p.changes.slice(0, -1).reverse().map(function (x) { return '<span>' + esc(d(x.date)) + ': ' + x.area_pct.toFixed(1) + '%</span>'; }).join('') + '</div>' : '') +
        '</div></article>';
    }).join('');
    if (P.length > shown) h += '<button type="button" class="btn btn-line btn-sm vd-more" id="vdMore">Show ' + Math.min(60, P.length - shown) + ' more of ' + n(P.length - shown) + '</button>';
    $('vdList').innerHTML = h;
    var b = $('vdMore'); if (b) b.addEventListener('click', function () { shown += 60; list(); });
  }
  function boot(j) {
    D = j; D.projects = D.projects || [];
    $('vdK1').textContent = n(D.totals.projects_with_baseline);
    $('vdK2').textContent = n(D.totals.changes_listed);
    $('vdK3').textContent = n(D.run.captured);
    $('vdK4').textContent = n(D.run.eligible);
    $('vdUpd').textContent = 'Last run ' + d(D.generated) + ': ' + n(D.run.captured) + ' pages captured (' + n(D.run.baselines_new) + ' first baselines, ' + n(D.run.changes_visible) + ' visible changes, ' + n(D.run.changes_invisible) + ' text changes too small to see), ' + n(D.run.failed) + ' pages failed to load' + (D.run.skipped_budget ? ', ' + n(D.run.skipped_budget) + ' left for the next run (time budget)' : '') + '. ' + n(D.run.without_baseline) + ' watched sites still have no baseline; up to ' + 150 + ' are added per daily run.';
    var mks = {}; D.projects.forEach(function (p) { if (p.market) mks[p.market] = 1; });
    Object.keys(mks).sort().forEach(function (m) { var o = document.createElement('option'); o.value = m; o.textContent = m; $('vdMk').appendChild(o); });
    if (!D.totals.changes_listed) $('vdSel').value = 'all';
    $('vdSel').addEventListener('change', function () { shown = 60; list(); });
    $('vdMk').addEventListener('change', function () { shown = 60; list(); });
    $('vdMethod').innerHTML = (D.method || []).map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '<li>' + esc(D.trigger || '') + '</li>';
    var L = D.limits || {};
    $('vdCav').innerHTML = (D.caveats || []).map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') +
      '<li>Runtime and storage are capped: a daily time budget of ' + Math.round((L.time_budget_s || 0) / 60) + ' minutes, pages cut at ' + n(L.max_page_height_px) + ' px, at most ' + n(L.baseline_cap_mb) + ' MB of compressed baselines and ' + n(L.artifact_cap_mb) + ' MB of private images per run, kept ' + n(L.artifact_retention_days) + ' days.</li>';
    list();
  }
  fetch('/data/visual-diff.json?d=' + new Date().toISOString().slice(0, 10), { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(boot).catch(function () {
      ['vdK1', 'vdK2', 'vdK3', 'vdK4'].forEach(function (k) { $(k).textContent = '0'; });
      $('vdList').innerHTML = '<div class="vd-empty">Starting: the first daily capture run has not published its results yet. This page fills in automatically.</div>';
    });
})();
