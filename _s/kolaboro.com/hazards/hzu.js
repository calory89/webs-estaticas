/* /hazards/: climate scenarios (2030, 2050) and protected land for the same pin. Block U. Reads /api/x/u/climate and /api/x/u/protected.
   Listens for the pin the main script (hz.js) has just answered for, via the "Raw answer" line it writes into #hzmeta. */
(function(){
  'use strict';
  var $ = function(id){ return document.getElementById(id); };
  var box = $('hzu'), meta = $('hzmeta'), last = '', run = 0;
  if (!box || !meta) return;
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function n(x, d){ return Number(x).toLocaleString('en-US', { maximumFractionDigits: d == null ? 2 : d }); }
  function m(x){ return x === 'unavailable' || x === undefined ? '<span class="hz-na">unavailable</span>' : x == null ? '<span class="hz-na">no value</span>' : x === 0 ? '0 m' : n(x) + ' m'; }
  function src(list, limits){
    return '<div class="hz-src">' + list.map(function(s){ return '<span>Source: <a href="' + esc(s.url) + '" rel="noopener">' + esc(s.name) + '</a>' + (s.license ? '. ' + esc(s.license) : '') + '</span>'; }).join('') + '</div>' +
      (limits ? '<details class="hz-lim"><summary>Limits</summary>' + limits.map(function(l){ return '<p>' + esc(l) + '</p>'; }).join('') + '</details>' : '');
  }
  function slot(id, title, msg){ return '<article class="hz-card" id="' + id + '"><h3>' + title + '</h3><p class="hz-read">' + msg + '</p></article>'; }

  /* ---------- climate ---------- */
  function climate(d){
    var b = d.baseline || {}, S = d.scenarios || [];
    var riv = function(r){
      if (!r || !r.models_answered) return '<span class="hz-na">unavailable</span>';
      if (!r.models_with_value) return '<span class="hz-na">no value</span>';
      var range = r.min_m === r.max_m ? '' : '<small>' + n(r.min_m) + ' to ' + n(r.max_m) + ' m across ' + r.models_with_value + ' models</small>';
      return '<b>' + (r.median_m === 0 ? '0 m' : n(r.median_m) + ' m') + '</b>' + range + (r.models_answered < r.models_total ? '<small>' + r.models_answered + ' of ' + r.models_total + ' models answered</small>' : '');
    };
    var coast = function(c){ return '<b>' + m(c.sea_level_50th_m) + '</b><small>' + m(c.sea_level_95th_m) + ' at the 95th percentile of sea level</small>'; };
    var rows = '<tr><th scope="row">Today<small>river 1960 to 1999, coast 2010</small></th><td><b>' + m(b.river_m) + '</b></td><td><b>' + m(b.coast_m) + '</b></td></tr>';
    S.forEach(function(s){ rows += '<tr><th scope="row">' + s.year + ', ' + esc(s.scenario === 'rcp8p5' ? 'RCP8.5' : 'RCP4.5') + '<small>' + esc(String(s.scenario_name || '').replace(/^RCP[0-9.]+ \(|\)$/g, '')) + '</small></th><td>' + riv(s.river) + '</td><td>' + coast(s.coast) + '</td></tr>'; });
    var any = function(f){ return S.some(function(s){ return f(s) > 0; }); };
    var up = S.filter(function(s){ return s.year === 2050 && s.scenario === 'rcp8p5'; })[0];
    var note = '';
    if (up) {
      var c0 = typeof b.coast_m === 'number' ? b.coast_m : null, c1 = typeof up.coast.sea_level_50th_m === 'number' ? up.coast.sea_level_50th_m : null;
      var r0 = typeof b.river_m === 'number' ? b.river_m : null, r1 = up.river && typeof up.river.median_m === 'number' ? up.river.median_m : null;
      if (c0 != null && c1 != null && c1 > c0) note += ' Coastal depth in this cell goes from ' + n(c0) + ' m today to ' + n(c1) + ' m in 2050 under RCP8.5 (median sea level).';
      if (r0 != null && r1 != null && r1 !== r0) note += ' River depth, median of five models: ' + n(r0) + ' m today, ' + n(r1) + ' m in 2050 under RCP8.5.';
      if (any(function(s){ return s.river && s.river.max_m; }) && up.river && up.river.min_m !== up.river.max_m) note += ' The models disagree, so read the range, not one number.';
    }
    if (!note) note = ' No modelled flooding in this cell today or in any scenario.';
    var html = '<h3>Flood depth in 2030 and 2050, 1 in 100 years</h3>' +
      '<div class="hzu-tw"><table class="hzu-t"><thead><tr><th scope="col">When and scenario</th><th scope="col">River</th><th scope="col">Coast</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="hz-read">Same 1 km cell and same model as the card above, run forward under two emission paths. River: median of five climate models. Coast: storm surge plus sea level rise, median sea level, no land subsidence.' + note + '</p>' +
      (d.files_failed ? '<p class="hz-read"><b>' + d.files_failed + ' of ' + d.files_read + ' files did not answer</b> and are shown as unavailable, never filled in.</p>' : '') +
      src([d.source], [d.limits, d.reading]) + '<p class="pl-small hzu-q">Exact files: <a href="/api/x/u/climate?lat=' + d.lat + '&amp;lng=' + d.lng + '">raw answer</a> lists each model, scenario and year; file pattern ' + esc(d.query) + '</p>';
    var el = $('hzu-cl'); el.innerHTML = html; el.className = 'hz-card hzu-wide';
  }

  /* ---------- protected land ---------- */
  function prot(d){
    var o = d.osm || {}, g = d.mangroves || {}, h = '<h3>Protected land and mangroves within 1 km</h3>', big;
    if (o.ok) {
      var mg = g.ok && (g.in_cell || g.nearest_m != null);
      big = o.inside.length ? 'Inside ' + (o.inside.length === 1 ? 'a mapped area' : o.inside.length + ' mapped areas') : o.near.length ? 'Boundary within 1 km' : mg ? 'Mangroves within 1 km' : 'None mapped within 1 km';
      h += '<p class="hz-big' + (o.inside.length || mg ? ' hzu-warn' : '') + '">' + big + '</p>';
      var li = o.inside.concat(o.near).map(function(x){ return '<li><b>' + esc(x.name || 'Unnamed area') + '</b>, ' + esc(x.kind) + ': ' + (x.inside ? 'contains your pin' + (x.boundary_m != null ? ', boundary ' + n(x.boundary_m, 0) + ' m away' : '') : 'boundary ' + n(x.boundary_m, 0) + ' m away') + '</li>'; }).join('');
      h += li ? '<ul class="hz-list">' + li + '</ul>' : '';
      h += '<p class="hz-read">OpenStreetMap: ' + esc(o.note) + (o.inside.length || o.near.length ? ' <b>Ask</b> the seller for the official land-use status and whether building is allowed this close to the area.' : '') + '</p>';
    } else h += '<p class="hz-big hz-na">Map data unavailable</p><p class="hz-read">OpenStreetMap tiles did not answer (' + esc(o.why || 'failed') + '). Nothing is shown in their place.</p>';
    if (g.ok) {
      h += '<p class="hz-read"><b>Mangroves, Global Mangrove Watch 2020:</b> ' + (g.in_cell ? 'mapped mangrove in the 220 m cell that contains your pin.' : g.nearest_m != null ? 'nearest mapped mangrove about ' + n(g.nearest_m, 0) + ' m away (' + g.cells_within + ' cells of 220 m within 1 km).' : 'none mapped within 1 km.') +
        (g.in_cell || (g.nearest_m != null && g.nearest_m <= 500) ? ' Mangroves are protected in many countries (in Indonesia, clearing them needs a permit), so ask whether any were cleared for this site.' : '') + '</p>';
    } else h += '<p class="hz-read"><b>Mangroves:</b> the index did not load (' + esc(g.why || 'failed') + '). Nothing is shown in its place.</p>';
    var nu = d.not_used || {};
    h += '<p class="pl-small"><b>Not used:</b> <a href="' + esc(nu.url) + '" rel="noopener">' + esc(nu.name) + '</a>. ' + esc(nu.why) + '</p>';
    h += src([o.source, g.source].filter(Boolean), [o.limits, g.limits].filter(Boolean));
    var el = $('hzu-pa'); el.innerHTML = h; el.className = 'hz-card';
  }

  function ask(path, lat, lng, my, done, what){
    return fetch('/api/x/u/' + path + '?lat=' + lat + '&lng=' + lng).then(function(r){ return r.json().then(function(j){ return { s: r.status, j: j }; }); }).then(function(x){
      if (my !== run) return;
      if (x.s === 429) { $('hzu-' + what).innerHTML = '<h3>' + (what === 'cl' ? 'Flood depth in 2030 and 2050' : 'Protected land and mangroves') + '</h3><p class="hz-read">' + esc(x.j.note || 'Too many new pins from your address. Try again in a few minutes.') + '</p>'; return; }
      if (x.s !== 200) throw x.s;
      done(x.j);
    }).catch(function(){ if (my === run) $('hzu-' + what).innerHTML = '<h3>' + (what === 'cl' ? 'Flood depth in 2030 and 2050' : 'Protected land and mangroves') + '</h3><p class="hz-read">The lookup did not complete. Try the pin again.</p>'; });
  }
  function go(lat, lng){
    var my = ++run;
    box.hidden = false; $('hzuh').hidden = false;
    box.innerHTML = slot('hzu-cl', 'Flood depth in 2030 and 2050, 1 in 100 years', 'Reading 30 flood model files for this cell (5 climate models, 2 emission paths, 2 years, river and coast)&hellip;') +
      slot('hzu-pa', 'Protected land and mangroves within 1 km', 'Reading OpenStreetMap tiles and the mangrove index&hellip;');
    $('hzu-cl').className = 'hz-card hzu-wide';
    ask('climate', lat, lng, my, climate, 'cl');
    ask('protected', lat, lng, my, prot, 'pa');
  }
  function check(){
    var t = meta.textContent || '', x = /lat=(-?\d+(?:\.\d+)?)&lng=(-?\d+(?:\.\d+)?)/.exec(t);
    if (!x) return;
    var k = x[1] + ',' + x[2]; if (k === last) return; last = k;
    go(+x[1], +x[2]);
  }
  new MutationObserver(check).observe(meta, { childList: true, characterData: true, subtree: true });
  check();
})();
