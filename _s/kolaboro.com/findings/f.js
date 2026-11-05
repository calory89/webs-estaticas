/* Live findings page: renders /data/live-findings.json (hourly developer page check). No quotes, no names: ids and markets only. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var N = $('fdn'), L = $('fdl'), C = $('fdc'), MORE = $('fdmore'), SM = $('fdm'), SK = $('fdk'), SF = $('fdf'), R = $('fdr'), TOT = $('fdtot'), ST = $('fdst');
  if (!L) return;
  var all = [], shown = 40;
  var KIND = { changed: 'Changed', 'new': 'Newly published', removed: 'Removed', missing: 'Permit claimed, no number', first: 'First reading' };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }
  function utc(iso) { return String(iso || '').slice(0, 16).replace('T', ' '); }
  function dm(iso) { try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }); } catch (e) { return String(iso).slice(0, 10); } }
  function hm(iso) { return String(iso || '').slice(11, 16) + ' UTC'; }
  function ago(iso) { var m = Math.floor((Date.now() - Date.parse(iso)) / 60000); if (!(m >= 0)) return ''; if (m < 60) return m + ' min ago'; var h = Math.floor(m / 60); if (h < 48) return h + ' h ago'; return Math.floor(h / 24) + ' days ago'; }
  var idOk = function (x) { return /^[A-Z]{2,5}-\d{3,4}$/.test(String(x || '')); };
  function qs(k) { try { return new URLSearchParams(location.search).get(k) || ''; } catch (e) { return ''; } }
  function setQs() {
    try { var p = new URLSearchParams(); if (SM.value) p.set('market', SM.value); if (SK.value) p.set('kind', SK.value); if (SF.value) p.set('fact', SF.value);
      var s = p.toString(); history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash); } catch (e) {}
  }
  function list() {
    var m = SM.value, k = SK.value, f = SF.value;
    var rows = all.filter(function (x) { return (!m || x.market === m) && (!k || x.kind === k) && (!f || x.fact === f); });
    C.textContent = rows.length ? fmt(rows.length) + ' finding' + (rows.length === 1 ? '' : 's') + (m || k || f ? ' match these filters' : ' in the rolling file (last 500)') : '';
    if (!rows.length) { L.innerHTML = '<li class="fd-none">' + (all.length ? 'No findings match these filters yet. Each hourly run adds more.' : 'No findings yet. The first hourly runs are reading pages now; this page shows only real ones.') + '</li>'; MORE.hidden = true; return; }
    L.innerHTML = rows.slice(0, shown).map(function (x) {
      var href = idOk(x.project) ? '/p/' + x.project + '/' : '/cases';
      return '<li><a href="' + href + '"><span class="fd-t"><b>' + esc(dm(x.at)) + '</b>' + esc(hm(x.at)) + '</span><p class="fd-x">' + esc(x.text) + '</p>' +
        '<span class="fd-m"><em class="k-' + esc(x.kind) + '">' + esc(KIND[x.kind] || x.kind) + '</em><em>' + esc(x.fact) + '</em><span>' + esc(x.market) + '</span>' +
        (x.q ? '<span>quote <code>' + esc(x.q) + '</code></span>' : '') + (x.fp ? '<span>page <code>' + esc(x.fp) + '</code></span>' : '') + '</span></a></li>';
    }).join('');
    MORE.hidden = rows.length <= shown;
    MORE.textContent = 'Show more (' + fmt(rows.length - shown) + ' left)';
  }
  function opts(sel, vals, cur) {
    vals.forEach(function (v) { var o = document.createElement('option'); o.value = v[0]; o.textContent = v[1]; sel.appendChild(o); });
    if (cur && vals.some(function (v) { return v[0] === cur; })) sel.value = cur;
  }
  function render(j) {
    all = (j.findings || []).filter(function (x) { return x && x.at && x.text; });
    var runs = (j.runs || []).slice().reverse(), t = j.totals || {}, last = runs[0];
    var mk = {}, fa = {};
    all.forEach(function (x) { mk[x.market] = (mk[x.market] || 0) + 1; fa[x.fact] = (fa[x.fact] || 0) + 1; });
    opts(SM, Object.keys(mk).sort().map(function (m) { return [m, m + ' (' + mk[m] + ')']; }), qs('market'));
    opts(SF, Object.keys(fa).sort().map(function (m) { return [m, m.charAt(0).toUpperCase() + m.slice(1) + ' (' + fa[m] + ')']; }), qs('fact'));
    if (qs('kind')) SK.value = qs('kind');
    var cov = j.coverage || {};
    N.innerHTML = '<div><b>' + fmt(t.findings) + '</b><span>findings published since ' + esc(t.since ? dm(t.since) : 'the first run') + '</span></div>' +
      '<div><b>' + fmt(t.pages_fetched) + '</b><span>developer pages read in ' + fmt(t.runs) + ' hourly run' + (t.runs === 1 ? '' : 's') + '</span></div>' +
      '<div><b>' + fmt(cov.projects_read_by_hourly_check) + ' of ' + fmt(cov.projects_tracked) + '</b><span>projects read by the hourly check so far</span></div>' +
      '<div><b>' + (last ? Number(last.usd || 0).toFixed(3) : '0') + ' USD</b><span>cost of the last run (budget 0.25)</span></div>';
    if (last) ST.textContent = 'Last run ' + utc(last.at) + ' UTC, ' + ago(last.at) + ': ' + fmt(last.pages_fetched) + ' pages read, ' + fmt(last.findings) + ' findings, ' + fmt(last.no_change) + ' facts unchanged, ' + fmt(last.rejected_quote_not_found) + ' quotes rejected. Next run at about minute 34 of every hour.';
    R.querySelector('tbody').innerHTML = runs.slice(0, 48).map(function (r) {
      return '<tr><td>' + esc(utc(r.at)) + '</td><td class="n">' + fmt(r.projects_read) + '</td><td class="n">' + fmt(r.pages_fetched) + '</td><td class="n">' + fmt(r.unchanged_pages) + '</td><td class="n">' + fmt(r.pages_read_by_model) +
        '</td><td class="n">' + fmt(r.findings) + '</td><td class="n">' + fmt(r.no_change) + '</td><td class="n">' + fmt((r.rejected_quote_not_found || 0) + (r.rejected_value_not_in_quote || 0)) +
        '</td><td class="n">' + fmt(r.tokens_in) + ' / ' + fmt(r.tokens_out) + '</td><td class="n">' + Number(r.usd || 0).toFixed(4) + '</td></tr>';
    }).join('') || '<tr><td colspan="10">No runs yet.</td></tr>';
    TOT.textContent = 'All runs: ' + fmt(t.runs) + ' runs, ' + fmt(t.pages_read_by_model) + ' pages read by the model, ' + fmt(t.tokens_in) + ' tokens in and ' + fmt(t.tokens_out) + ' out, ' + Number(t.usd || 0).toFixed(3) + ' USD in total. Rejected quote = not found word for word on the page, or not containing the value.';
    list();
  }
  [SM, SK, SF].forEach(function (s) { s.addEventListener('change', function () { shown = 40; setQs(); list(); }); });
  MORE.addEventListener('click', function () { shown += 60; list(); });
  fetch('/data/live-findings.json?t=' + Math.floor(Date.now() / 3e5), { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(render).catch(function () {
    N.innerHTML = '<div><b>Starting</b><span>The first hourly run has not been published yet</span></div>';
    L.innerHTML = '<li class="fd-none">The findings file is not published yet. The first hourly runs are reading pages now; this page shows only real findings.</li>';
    R.querySelector('tbody').innerHTML = '<tr><td colspan="10">No runs published yet.</td></tr>';
  });
})();
