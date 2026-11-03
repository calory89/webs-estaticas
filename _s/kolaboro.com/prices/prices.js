(function(){
  var root = document.getElementById('hRoot'); if (!root) return;
  var COL = ['#C9D3DB', '#8FA1B0', '#4E6273', '#17212B'];
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ord(n){ var s = (n % 100 >= 11 && n % 100 <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' })[n % 10] || 'th'; return n + s; }
  function fmt(n){ return Number(n).toLocaleString('en-US'); }
  function money(n, c){ return (c === 'USD' ? '$' : c + ' ') + fmt(Math.round(n)); }
  function set(id, v){ var e = document.getElementById(id); if (e) e.textContent = v; }
  function mcard(m){
    var o = m.official, a = m.advertised, bands = Object.keys(o.band_share_pct);
    var h = '<article class="h-card" id="m-' + esc(m.market.toLowerCase().replace(/[^a-z]+/g, '-')) + '"><h3>' + esc(m.market) + '</h3>' +
      '<p class="h-src">' + esc(o.source) + '. ' + esc(o.filter) + '. Area: ' + esc(o.area) + '. Period: ' + esc(o.period_text) + '.</p>';
    h += m.comparison ? '<p class="h-claim">' + esc(m.comparison.text) + ' The median starting price sits at the ' + ord(Math.round(m.comparison.advertised_percentile)) + ' percentile of registered prices.</p>'
      : '<p class="h-claim h-none">No market comparison: ' + esc(m.comparison_withheld) + '</p>';
    h += '<dl class="h-stats"><div><dt>Registered sales</dt><dd>' + fmt(o.n) + '</dd></div><div><dt>Median</dt><dd>' + money(o.median_local, o.currency) + ' (' + money(o.median_usd, 'USD') + ')</dd></div>' +
      '<div><dt>Middle half</dt><dd>' + money(o.p25_usd, 'USD') + ' to ' + money(o.p75_usd, 'USD') + '</dd></div>' +
      '<div><dt>Advertised median</dt><dd>' + (a.median_usd ? money(a.median_usd, 'USD') + ' (' + a.n_known + ' of ' + a.projects + ' projects)' : 'none') + '</dd></div></dl>';
    h += '<p class="h-note" style="margin:10px 0 0">Registered sales by our price bands (USD)</p><div class="h-bar" role="img" aria-label="' + esc(bands.map(function(b){ return b + ' ' + o.band_share_pct[b] + '%'; }).join(', ')) + '">' +
      bands.map(function(b, i){ return '<i style="width:' + o.band_share_pct[b] + '%;background:' + COL[i] + '" title="' + esc(b + ': ' + o.band_share_pct[b] + '%') + '"></i>'; }).join('') + '</div>';
    if (m.comparison) h += '<div class="h-adv" aria-hidden="true"><b style="left:' + Math.min(96, Math.max(4, m.comparison.advertised_percentile)) + '%">&#9650; advertised median</b></div>';
    h += '<ul class="h-leg">' + bands.map(function(b, i){ return '<li><s style="background:' + COL[i] + '"></s>' + esc(b) + ': ' + o.band_share_pct[b] + '%</li>'; }).join('') + '</ul>';
    if (o.monthly) {
      var mx = Math.max.apply(null, o.monthly.map(function(x){ return x.median_local; }));
      h += '<p class="h-note" style="margin:16px 0 0">Median registered price by month, ' + esc(o.currency) + '</p><div class="h-mon" role="img" aria-label="Monthly medians">' + o.monthly.map(function(x){ return '<i style="height:' + (100 * x.median_local / mx).toFixed(1) + '%" title="' + esc(x.month + ': ' + money(x.median_local, o.currency) + ', ' + fmt(x.n) + ' sales') + '"></i>'; }).join('') + '</div>' +
        '<div class="h-monl">' + o.monthly.map(function(x){ return '<span>' + esc(x.month.slice(5)) + '</span>'; }).join('') + '</div>';
    }
    if (m.per_m2) {
      var pm = m.per_m2;
      if (pm.projects_compared) h += '<p class="h-claim">Price per m2: ' + pm.projects_compared + ' tracked projects advertise a price per m2 that we can hold against their own DLD area. The median project is ' + Math.abs(pm.median_pct_vs_area) + '% ' + (pm.median_pct_vs_area < 0 ? 'below' : 'above') + ' its area\'s registered median; ' + pm.above_area_median + ' of ' + pm.projects_compared + ' are above it. Same currency on both sides (AED).</p>';
      h += '<details class="h-d"><summary>Official price per m2 by area (' + pm.areas.length + ' areas, all areas median ' + money(pm.all.median_local, pm.currency) + ')</summary><p class="h-note">' + esc(pm.advertised_side) + '</p>' +
        '<div class="h-tw"><table class="h-t"><thead><tr><th>DLD area</th><th class="n">Sales</th><th class="n">Median per m2</th><th class="n">Middle half</th><th class="n">USD per m2</th></tr></thead><tbody>' +
        pm.areas.map(function(r){ return '<tr><td>' + esc(r.area) + '</td><td class="n">' + fmt(r.n) + '</td><td class="n">' + fmt(r.median_local) + '</td><td class="n">' + fmt(r.p25_local) + ' to ' + fmt(r.p75_local) + '</td><td class="n">' + fmt(r.median_usd) + '</td></tr>'; }).join('') +
        '</tbody></table></div></details>';
    }
    var pr = m.projects;
    h += '<details class="h-d"><summary>Where each tracked project\'s price band sits (' + pr.length + ' projects)</summary><p class="h-note">Projects are public only as a price band, so this shows which slice of registered sales the band covers. It is a position, not a valuation.</p>' +
      '<div class="h-tw"><table class="h-t"><thead><tr><th>Project</th><th>Advertised band</th><th>Percentiles of registered sales</th><th class="n">Share</th>' + (m.per_m2 ? '<th>Price per m2 versus its area</th>' : '') + '</tr></thead><tbody>' +
      pr.map(function(p){ return '<tr><td><a href="/p/?id=' + encodeURIComponent(p.id) + '">' + esc(p.id) + '</a></td><td>' + esc(p.band) + '</td><td>' + (p.percentile_from == null ? esc(p.text) :
        '<span class="h-pr" title="' + esc(p.text) + '"><i style="left:' + p.percentile_from + '%;width:' + Math.max(1, p.percentile_to - p.percentile_from) + '%"></i></span><span class="h-note">' + Math.round(p.percentile_from) + ' to ' + Math.round(p.percentile_to) + '</span>') +
        '</td><td class="n">' + (p.share_of_registered_in_band_pct == null ? '' : p.share_of_registered_in_band_pct + '%') + '</td>' + (m.per_m2 ? '<td>' + (p.per_m2 ? (p.per_m2.status === 'compared' ? '<b>' + (Math.abs(p.per_m2.pct_vs_area_median) < 1 ? 'in line' : (p.per_m2.pct_vs_area_median > 0 ? '+' : '') + Math.round(p.per_m2.pct_vs_area_median) + '%') + '</b> <span class="h-note">' + esc(ord(Math.round(p.per_m2.percentile_in_area))) + ' percentile, ' + esc(p.per_m2.area_sales) + ' sales</span>' : '<span class="h-note">not compared</span>') : '<span class="h-note">no price per m2 advertised</span>') + '</td>' : '') + '</tr>'; }).join('') + '</tbody></table></div></details>';
    h += '<p class="h-note">Licence and access: ' + esc(o.access) + '. ' + esc(o.licence) + ' <a href="' + esc(o.url) + '" rel="noopener" target="_blank">Source</a>.</p></article>';
    return h;
  }
  fetch('/data/price-reality.json?t=' + Math.floor(Date.now() / 6e5)).then(function(r){ if (!r.ok) throw 0; return r.json(); }).then(function(d){
    var s = d.summary;
    set('k-sales', fmt(s.registered_sales_used)); set('k-mk', s.markets_with_official_data); set('k-pr', fmt(s.projects_positioned) + ' of ' + fmt(s.projects_total)); set('k-cmp', s.market_comparisons);
    set('h-upd', d.updated);
    document.getElementById('hMarkets').innerHTML = d.markets.map(mcard).join('');
    document.getElementById('hMethod').innerHTML = d.method.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('');
    document.getElementById('hFx').innerHTML = Object.keys(d.fx).map(function(k){ var f = d.fx[k]; return '<li><b>' + esc(k) + '</b>: 1 ' + esc(k) + ' = ' + f.usd_per_unit + ' USD. ' + esc(f.basis) + '. <a href="' + esc(f.source) + '" rel="noopener" target="_blank">Source</a></li>'; }).join('');
    document.getElementById('hInputs').innerHTML = '<p class="h-note">' + d.inputs.length + ' downloads. Hash of this list: <span class="h-code">' + esc(d.inputs_sha256) + '</span> (<a href="/api/kb/stamp?hash=' + esc(d.inputs_sha256) + '">Bitcoin timestamp</a>)</p><div class="h-tw"><table class="h-t"><thead><tr><th>Source</th><th>Request</th><th>Fetched (UTC)</th><th>SHA-256 of the bytes</th></tr></thead><tbody>' +
      d.inputs.map(function(i){ return '<tr><td>' + esc(i.source) + '</td><td>' + esc(i.request) + '</td><td>' + esc(i.fetched_at) + '</td><td class="h-code">' + esc(i.sha256) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    document.getElementById('hNot').innerHTML = '<div class="h-tw"><table class="h-t"><thead><tr><th>Market</th><th class="n">Projects</th><th>Official sales data</th></tr></thead><tbody>' +
      d.not_covered.map(function(n){ return '<tr><td>' + esc(n.market) + '</td><td class="n">' + n.projects + '</td><td>' + esc(n.note) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    set('h-notn', d.not_covered.length);
    if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
  }).catch(function(){ document.getElementById('hMarkets').innerHTML = '<p class="h-claim h-none">The comparison data could not be loaded. Try again in a minute, or read <a href="/data/price-reality.json">/data/price-reality.json</a> directly.</p>'; });
})();
