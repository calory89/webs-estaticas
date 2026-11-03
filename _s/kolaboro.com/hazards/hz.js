(function(){
  'use strict';
  var $ = function(id){ return document.getElementById(id); };
  var map, mark, ring, runId = 0;
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function err(t){ var e = $('hzerr'); if (!t) { e.hidden = true; return; } e.hidden = false; e.textContent = t; }
  function n(x, d){ return x == null ? '' : Number(x).toLocaleString('en-US', { maximumFractionDigits: d == null ? 1 : d }); }
  function dist(m){ return m == null ? '' : m < 1000 ? n(m, 0) + ' m' : n(m / 1000, 1) + ' km'; }
  function parse(t){
    t = String(t || '').trim(); if (!t) return null;
    var m = /@(-?\d+\.\d+),\s*(-?\d+\.\d+)/.exec(t) || /[?&](?:q|ll|query)=(-?\d+\.\d+)(?:,|%2C)\s*(-?\d+\.\d+)/i.exec(t) || /mlat=(-?\d+\.\d+)&mlon=(-?\d+\.\d+)/.exec(t) || /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/.exec(t) || /^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/.exec(t);
    if (!m) return null;
    var lat = +m[1], lng = +m[2];
    if (!(lat >= -60 && lat <= 75 && lng >= -180 && lng <= 180)) return null;
    return [lat, lng];
  }

  /* ---------- map ---------- */
  function initMap(lat, lng, z){
    map = L.map('hzmap', { zoomControl: true, worldCopyJump: true }).setView([lat, lng], z);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
    map.on('click', function(e){ pin(e.latlng.lat, e.latlng.lng, true); });
  }
  function pin(lat, lng, fromMap){
    lat = Math.round(lat * 1e4) / 1e4; lng = Math.round((((lng + 540) % 360) - 180) * 1e4) / 1e4;
    if (!mark) mark = L.circleMarker([lat, lng], { radius: 8, color: '#17212B', weight: 3, fillColor: '#FF5B14', fillOpacity: 1 }).addTo(map);
    else mark.setLatLng([lat, lng]);
    if (!fromMap) map.setView([lat, lng], Math.max(map.getZoom(), 13));
    $('hzin').value = lat.toFixed(4) + ', ' + lng.toFixed(4);
    try { history.replaceState(null, '', '?lat=' + lat.toFixed(4) + '&lng=' + lng.toFixed(4)); } catch (e) {}
    go(lat, lng);
  }

  /* ---------- result cards ---------- */
  function foot(s, extra){
    if (!s) return '';
    var q = s.query, qs = Array.isArray(q) ? q : q ? [q] : [];
    return '<div class="hz-src"><span>Source: <a href="' + esc(s.source && s.source.url) + '" rel="noopener">' + esc(s.source && s.source.name) + '</a>' + (s.source && s.source.license ? '. ' + esc(s.source.license) : '') + '</span>' +
      (qs.length ? '<span>Exact query: ' + qs.map(function(u, i){ return '<a href="' + esc(u) + '" rel="noopener nofollow">' + (qs.length > 1 ? 'file ' + (i + 1) : 'open') + '</a>'; }).join(', ') + '</span>' : '') + (extra || '') + '</div>' +
      (s.limits ? '<details class="hz-lim"><summary>Limits</summary><p>' + esc(s.limits) + '</p></details>' : '');
  }
  function card(title, body, s, cls){
    return '<article class="hz-card' + (cls ? ' ' + cls : '') + '"><h3>' + title + '</h3>' + body + foot(s) + '</article>';
  }
  function down(s, what){
    return card(what, '<p class="hz-big hz-na">Unavailable</p><p class="hz-read">The source did not answer just now' + (s && s.why ? ' (' + esc(s.why) + ')' : '') + '. Nothing is shown in its place. Try again in a few minutes.</p>', s, 'na');
  }
  function render(d){
    var h = [], e = d.elevation, f = d.flood, q = d.quakes, t = d.tsunami, v = d.volcano, c = d.coast;
    // height
    if (e && e.ok) {
      if (e.metres == null) h.push(card('Height above sea level', '<p class="hz-big">No land cell</p><p class="hz-read">' + esc(e.note || 'The DEM has no value here.') + '</p>', e));
      else h.push(card('Height above sea level', '<p class="hz-big">' + n(e.metres, 1) + ' m</p><p class="hz-read">Height of the 30 m cell at your pin, measured on top of whatever covered it in 2011 to 2015: ground, roofs or trees.' +
        (e.metres < 10 ? ' <b>Under 10 m:</b> ask the developer and the local disaster agency about storm surge, tsunami evacuation routes and how the site drains.' : '') + '</p>', e));
    } else h.push(down(e, 'Height above sea level'));
    // flood
    if (f && f.ok) {
      var fv = function(x){ return x == null ? '<span class="hz-na">no value</span>' : x === 0 ? '0 m' : n(x, 2) + ' m'; };
      h.push(card('Flood model, 1 in 100 years', '<div class="hz-two"><p><span class="hz-k">River flooding</span><span class="hz-big">' + fv(f.river_depth_m) + '</span></p><p><span class="hz-k">Coastal flooding</span><span class="hz-big">' + fv(f.coast_depth_m) + '</span></p></div>' +
        '<p class="hz-read">Modelled water depth in the 1 km cell around your pin, for a flood with a 1% chance in any year. 0 m means the model has the cell and finds it dry; no value means the model has no river or coast there.' +
        ((f.river_depth_m || 0) > 0 || (f.coast_depth_m || 0) > 0 ? ' <b>Part of this cell floods in the model:</b> ask for the local flood map and the finished floor level relative to the street.' : '') + '</p>', f));
    } else h.push(down(f, 'Flood model, 1 in 100 years'));
    // earthquakes
    if (q && q.ok) {
      var big = (q.largest || []).slice(0, 3).map(function(x){ return '<li><a href="' + esc(x.url) + '" rel="noopener">M' + n(x.mag, 1) + '</a> ' + esc(x.date) + ', ' + n(x.dist_km, 0) + ' km away, ' + n(x.depth_km, 0) + ' km deep</li>'; }).join('');
      h.push(card('Earthquakes since 1900, within ' + q.radius_km + ' km', '<div class="hz-three"><p><span class="hz-k">M5 and above</span><span class="hz-big">' + n(q.m5, 0) + '</span></p><p><span class="hz-k">M6+</span><span class="hz-big">' + n(q.m6, 0) + '</span></p><p><span class="hz-k">M7+</span><span class="hz-big">' + n(q.m7, 0) + '</span></p></div>' +
        (big ? '<p class="hz-read">Largest recorded:</p><ul class="hz-list">' + big + '</ul>' : '<p class="hz-read">No M5+ event recorded within ' + q.radius_km + ' km since 1900.</p>') +
        '<p class="hz-read">' + n(q.m5_since_1973, 0) + ' of the M5+ events are from 1973 or later. Older records are less complete, so the recent count is the fairer one to compare between places.</p>', q));
    } else h.push(down(q, 'Earthquakes'));
    // tsunami
    if (t && t.ok) {
      var tl = (t.top || []).slice(0, 3).map(function(x){ return '<li>' + (x.height_m != null ? n(x.height_m, 1) + ' m' : 'height not recorded') + ' in ' + esc(x.year) + ' at ' + esc(x.place) + ', ' + n(x.dist_km, 1) + ' km away' + (x.deaths ? ', ' + n(x.deaths, 0) + ' deaths recorded at that spot' : '') + '</li>'; }).join('');
      h.push(card('Tsunami run-ups within ' + t.radius_km + ' km', t.runups ? '<div class="hz-two"><p><span class="hz-k">Recorded run-ups</span><span class="hz-big">' + n(t.runups, 0) + '</span></p><p><span class="hz-k">Highest</span><span class="hz-big">' + (t.max_height_m != null ? n(t.max_height_m, 1) + ' m' : 'n/a') + '</span></p></div>' +
        '<p class="hz-read">From ' + n(t.events, 0) + ' tsunami' + (t.events === 1 ? '' : 's') + ', the latest in ' + esc(t.latest_year) + '. Highest records:</p><ul class="hz-list">' + tl + '</ul>' :
        '<p class="hz-big">None recorded</p><p class="hz-read">No run-up in the NOAA database within ' + t.radius_km + ' km. That is not the same as no risk: see the limits.</p>', t));
    } else h.push(down(t, 'Tsunami run-ups'));
    // volcanoes
    if (v && v.ok) {
      var vl = (v.nearest || []).slice(0, 3).map(function(x){ return '<li><a href="' + esc(x.url) + '" rel="noopener">' + esc(x.name) + '</a>, ' + n(x.dist_km, 1) + ' km, ' + (x.last_eruption_year != null ? 'last eruption ' + (x.last_eruption_year < 0 ? n(-x.last_eruption_year, 0) + ' BCE' : esc(x.last_eruption_year)) : 'no dated eruption in the record') + '</li>'; }).join('');
      h.push(card('Volcanoes within ' + v.radius_km + ' km', v.count ? '<p class="hz-big">' + n(v.nearest[0].dist_km, 1) + ' km</p><p class="hz-read">to the nearest of ' + n(v.count, 0) + ' volcano' + (v.count === 1 ? '' : 'es') + ' active in the last 11,700 years:</p><ul class="hz-list">' + vl + '</ul>' :
        '<p class="hz-big">None</p><p class="hz-read">No Holocene volcano within ' + v.radius_km + ' km.</p>', v));
    } else h.push(down(v, 'Volcanoes'));
    // coast
    if (c && c.ok) {
      h.push(card('Distance to the coastline', c.beyond ? '<p class="hz-big">Over ' + c.within_km + ' km</p><p class="hz-read">No mapped coastline within ' + c.within_km + ' km.</p>' :
        '<p class="hz-big">' + dist(c.distance_m) + '</p><p class="hz-read">Straight line from your pin to the nearest mapped high-water line.' + (c.distance_m < 200 ? ' <b>Under 200 m:</b> ask whether a coastal setback line applies to this plot; many countries, Indonesia included, restrict building close to the shore.' : '') + '</p>', c));
    } else h.push(down(c, 'Distance to the coastline'));
    $('hzgrid').innerHTML = h.join('');
    $('hzgrid').hidden = false;
  }
  function go(lat, lng){
    var my = ++runId; err('');
    $('hzstatus').textContent = 'Asking six public sources about ' + lat.toFixed(4) + ', ' + lng.toFixed(4) + '. A new point takes 5 to 40 seconds.';
    $('hzgrid').setAttribute('aria-busy', 'true');
    var t0 = Date.now();
    fetch('/api/x/p/hazards?lat=' + lat + '&lng=' + lng).then(function(r){ return r.json().then(function(j){ return { s: r.status, j: j, c: r.headers.get('x-cache') }; }); }).then(function(x){
      if (my !== runId) return;
      $('hzgrid').removeAttribute('aria-busy');
      if (x.s === 429) { $('hzstatus').textContent = x.j.note || 'Too many new pins from your address. Try again in a few minutes.'; return; }
      if (x.s !== 200) { $('hzstatus').textContent = 'The lookup failed (' + (x.j.error || x.s) + '). Try again.'; return; }
      var d = x.j, ok = ['elevation','flood','quakes','tsunami','volcano','coast'].filter(function(k){ return d[k] && d[k].ok; }).length;
      $('hzstatus').textContent = ok + ' of 6 sources answered for ' + d.lat.toFixed(4) + ', ' + d.lng.toFixed(4) + (x.c === 'hit' ? ' (from the edge cache).' : ' in ' + Math.round((Date.now() - t0) / 100) / 10 + ' s.');
      render(d);
      $('hzmeta').textContent = 'Read on ' + String(d.generated || '').replace('T', ' ').slice(0, 16) + ' UTC. Raw answer: /api/x/p/hazards?lat=' + d.lat + '&lng=' + d.lng;
    }).catch(function(){ if (my === runId) { $('hzgrid').removeAttribute('aria-busy'); $('hzstatus').textContent = 'The lookup did not complete. Check your connection and try again.'; } });
  }

  /* ---------- zoning probe ---------- */
  function zoning(){
    fetch('/api/x/p/zoning').then(function(r){ return r.json(); }).then(function(d){
      if (!d || !d.probes) throw 0;
      $('hzprobe').innerHTML = d.probes.map(function(p){
        var okish = p.status && p.status < 400;
        return '<li class="' + (okish ? 'ok' : 'bad') + '"><b>' + esc(p.name) + '</b>: ' + (p.status ? 'answered HTTP ' + p.status : 'no answer (' + esc(p.error || 'failed') + ')') + '</li>';
      }).join('') + '<li class="when">Checked from our Cloudflare worker on ' + esc(String(d.checked || '').replace('T', ' ').slice(0, 16)) + ' UTC.</li>';
    }).catch(function(){ $('hzprobe').innerHTML = '<li>The live check could not run just now.</li>'; });
  }

  /* ---------- tracked projects ---------- */
  function tracked(){
    fetch('/data/hazards.json', { cache: 'no-cache' }).then(function(r){ if (!r.ok) throw r.status; return r.json(); }).then(function(d){
      var A = d.areas || [], P = d.projects || {}, ids = Object.keys(P).sort();
      var fl = function(x){ return x == null ? 'n/a' : n(x, 2) + ' m'; };
      var vol = function(v){ return !v ? 'n/a' : v.name ? esc(v.name) + ', ' + n(v.dist_km, 0) + ' km' : 'none in ' + v.none_within_km + ' km'; };
      var row = function(lbl, o, btn){
        return '<tr>' + lbl + '<td>' + (o.elev_m == null ? 'n/a' : n(o.elev_m, 0) + ' m') + '</td><td>' + fl(o.flood_river_m) + ' / ' + fl(o.flood_coast_m) + '</td><td>' + (o.quakes ? n(o.quakes.m5, 0) + ' / ' + n(o.quakes.m6, 0) + ' / ' + n(o.quakes.m7, 0) : 'n/a') +
          '</td><td>' + (o.tsunami ? n(o.tsunami.runups, 0) + (o.tsunami.max_m != null ? ', max ' + n(o.tsunami.max_m, 1) + ' m' : '') : 'n/a') + '</td><td>' + vol(o.volcano) + '</td><td>' + (o.coast == null ? 'n/a' : typeof o.coast === 'number' ? dist(o.coast) : esc(o.coast)) + '</td></tr>';
      };
      var head = '<thead><tr><th scope="col">%s</th><th scope="col">Height</th><th scope="col">Flood 100y river / coast</th><th scope="col">Quakes M5 / M6 / M7</th><th scope="col">Tsunami run-ups</th><th scope="col">Nearest volcano</th><th scope="col">Coast</th></tr></thead>';
      var mk = {}; ids.forEach(function(i){ var m = i.split('-')[0]; mk[m] = (mk[m] || 0) + 1; });
      var h = '<p class="hz-sum"><b>' + n(ids.length, 0) + '</b> tracked projects and <b>' + n(A.length, 0) + '</b> watched areas, run on ' + esc(d.updated) + '. Project coordinates come from public sources (about 100 m) and are not published; their figures are rounded.</p>';
      h += '<h3 class="hz-h3">Watched areas</h3><div class="hz-tw"><table class="hz-t">' + head.replace('%s', 'Area') + '<tbody>' +
        A.map(function(a){ return row('<th scope="row"><button type="button" class="hz-go" data-lat="' + a.lat + '" data-lng="' + a.lng + '">' + esc(a.label) + '</button></th>', a); }).join('') + '</tbody></table></div>';
      if (ids.length) {
        h += '<h3 class="hz-h3">Tracked projects</h3><p class="pl-small"><label for="hzmk">Market prefix</label> <select id="hzmk"><option value="">All (' + ids.length + ')</option>' + Object.keys(mk).sort().map(function(m){ return '<option>' + esc(m) + '</option>'; }).join('') + '</select></p>' +
          '<div class="hz-tw"><table class="hz-t" id="hzpt">' + head.replace('%s', 'Project') + '<tbody>' + ids.map(function(i){ return row('<th scope="row" data-m="' + esc(i.split('-')[0]) + '"><a href="/p/?id=' + encodeURIComponent(i) + '">' + esc(i) + '</a></th>', P[i]); }).join('') + '</tbody></table></div>';
      }
      var fails = d.counts && d.counts.source_failures ? Object.keys(d.counts.source_failures) : [];
      if (fails.length) h += '<p class="pl-small">Sources that did not answer for some points in this run (shown as n/a, never estimated): ' + fails.map(function(k){ return esc(k) + ' (' + d.counts.source_failures[k] + ')'; }).join(', ') + '.</p>';
      $('hztr').innerHTML = h;
      var sel = $('hzmk'); if (sel) sel.addEventListener('change', function(){ var v = sel.value; Array.prototype.forEach.call(document.querySelectorAll('#hzpt tbody tr'), function(tr){ tr.hidden = v && tr.firstChild.getAttribute('data-m') !== v; }); });
    }).catch(function(){
      $('hztr').innerHTML = '<p class="pl-small">The monthly run has not published its first results yet. The live lookup above already works for any point.</p>';
    });
  }

  function boot(){
    if (!window.L) { err('The map could not load. You can still paste coordinates above.'); }
    var sp = new URLSearchParams(location.search), lat = +sp.get('lat'), lng = +sp.get('lng'), has = sp.get('lat') && lat >= -60 && lat <= 75 && lng >= -180 && lng <= 180;
    if (window.L) initMap(has ? lat : -8.7, has ? lng : 115.17, has ? 13 : 9);
    if (has && window.L) pin(lat, lng, false);
    fetch('/data/satellite.json').then(function(r){ return r.json(); }).then(function(d){
      var s = (d.sites || []).filter(function(x){ return /bali|lombok|phuket|dubai/i.test(x.id); }).slice(0, 5);
      if (!s.length) return;
      $('hztry').innerHTML = '<span>Try a watched area:</span>' + s.map(function(x){ return '<button type="button" data-lat="' + x.lat + '" data-lng="' + x.lng + '">' + esc(x.label) + '</button>'; }).join('');
    }).catch(function(){});
    zoning(); tracked();
  }
  function goBtn(e){ var b = e.target.closest('button[data-lat]'); if (b && map) { pin(+b.dataset.lat, +b.dataset.lng, false); var r = $('result'); if (r && r.scrollIntoView) r.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }
  $('hztry').addEventListener('click', goBtn);
  $('hztr').addEventListener('click', goBtn);
  $('hzform').addEventListener('submit', function(e){ e.preventDefault(); var p = parse($('hzin').value); if (!p) { err('Paste coordinates like -8.6380, 115.1150 or a map link that contains them.'); return; } if (!map) { go(p[0], p[1]); return; } pin(p[0], p[1], false); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
