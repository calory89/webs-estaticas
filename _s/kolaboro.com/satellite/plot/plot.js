(function(){
  'use strict';
  var $ = function(id){ return document.getElementById(id); };
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var map, mark, box, years = 3, ctl = null, Q = [], sel = -1, timer = null, runId = 0;
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function fdate(s){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? (+m[3]) + ' ' + MON[+m[2] - 1] + ' ' + m[1] : ''; }
  function qlabel(q){ var m = /^(\d{4})-Q(\d)$/.exec(q); return m ? 'Q' + m[2] + ' ' + m[1] : q; }
  function err(t){ var e = $('plerr'); if (!t) { e.hidden = true; return; } e.hidden = false; e.textContent = t; }

  /* ---------- input ---------- */
  function parse(t){
    t = String(t || '').trim(); if (!t) return null;
    var m = /@(-?\d+\.\d+),\s*(-?\d+\.\d+)/.exec(t) || /[?&](?:q|ll|query)=(-?\d+\.\d+)(?:,|%2C)\s*(-?\d+\.\d+)/i.exec(t) || /mlat=(-?\d+\.\d+)&mlon=(-?\d+\.\d+)/.exec(t) || /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/.exec(t) || /^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/.exec(t);
    if (!m) return null;
    var lat = +m[1], lng = +m[2];
    if (!(lat >= -80 && lat <= 84 && lng >= -180 && lng <= 180)) return null;
    return [lat, lng];
  }

  /* ---------- map ---------- */
  function initMap(lat, lng, z){
    map = L.map('plmap', { zoomControl: true, worldCopyJump: true }).setView([lat, lng], z);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
    map.on('click', function(e){ pin(e.latlng.lat, e.latlng.lng, true); });
  }
  function pin(lat, lng, fromMap){
    lat = Math.round(lat * 1e5) / 1e5; lng = Math.round((((lng + 540) % 360) - 180) * 1e5) / 1e5;
    if (!mark) mark = L.circleMarker([lat, lng], { radius: 8, color: '#17212B', weight: 3, fillColor: '#FF5B14', fillOpacity: 1 }).addTo(map);
    else mark.setLatLng([lat, lng]);
    var dLat = 640 / 111320, dLng = 640 / (111320 * Math.cos(lat * Math.PI / 180));   // the 1.28 km box the pictures cover
    var b = [[lat - dLat, lng - dLng], [lat + dLat, lng + dLng]];
    if (!box) box = L.rectangle(b, { color: '#FF5B14', weight: 1.5, fill: false, dashArray: '5 4', interactive: false }).addTo(map); else box.setBounds(b);
    if (!fromMap) map.setView([lat, lng], Math.max(map.getZoom(), 15));
    $('plin').value = lat.toFixed(5) + ', ' + lng.toFixed(5);
    try { history.replaceState(null, '', '?lat=' + lat.toFixed(5) + '&lng=' + lng.toFixed(5) + '&y=' + years); } catch (e) {}
    $('plms').href = '/milestones/?lat=' + lat.toFixed(5) + '&lng=' + lng.toFixed(5);
    go(lat, lng);
  }

  /* ---------- run ---------- */
  function go(lat, lng){
    if (ctl) ctl.abort();
    stop(); err('');
    var my = ++runId; ctl = window.AbortController ? new AbortController() : null;
    Q = []; sel = -1; $('plv').hidden = true; $('plgrid').innerHTML = ''; $('plsrc').textContent = '';
    $('plread').textContent = 'Waiting for at least two clear quarters.'; $('plchart').innerHTML = '';
    status('Looking up Sentinel-2 scenes over your pin…', 4);
    var total = 0, done = 0, t0 = Date.now();
    KSatPoint.run(lat, lng, years, {
      signal: ctl && ctl.signal,
      onScenes: function(d, ms){
        if (my !== runId) return;
        total = d.quarters.length;
        var n = d.quarters.reduce(function(a, q){ return a + (q.listed || 0); }, 0);
        Q = d.quarters.map(function(q){ return { q: q.q, from: q.from, to: q.to, status: 'wait' }; });
        grid();
        status('Found ' + n + ' candidate scenes for ' + total + ' quarters in ' + (ms / 1000).toFixed(1) + ' s. Checking the cloud mask at your pin, newest first…', 10);
        $('plsrc').textContent = d.source + '.';
      },
      onQuarter: function(r, ms){
        if (my !== runId) return;
        done++;
        var i = -1; Q.forEach(function(x, k){ if (x.q === r.q) i = k; }); if (i >= 0) Q[i] = r;
        cell(i);
        var ok = Q.filter(function(x){ return x.status === 'ok'; }).length;
        status(done + ' of ' + total + ' quarters checked, ' + ok + ' clear so far, ' + (ms / 1000).toFixed(0) + ' s.', 10 + 90 * done / total);
        if (r.status === 'ok' && (sel < 0 || r.q > Q[sel].q)) { $('plv').hidden = false; show(i); }
      }
    }).then(function(res){
      if (my !== runId) return;
      Q = res.quarters; grid();
      var ok = Q.filter(function(x){ return x.status === 'ok'; });
      status(ok.length + ' of ' + Q.length + ' quarters have a clear picture at your pin. Done in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s.', 100);
      if (!ok.length) { $('plv').hidden = true; err('No quarter had a clear view of this point. In very cloudy places (wet seasons in the tropics) this happens; try 3 years, or check again next quarter.'); return; }
      $('plv').hidden = false;
      show(Q.indexOf(ok[ok.length - 1]));
      reading(res);
    }).catch(function(e){
      if (my !== runId || (e && /abort/i.test(String(e.name) + String(e.message)))) return;
      status('', 0);
      err(e && e.status === 429 ? 'Too many new points from your connection in the last few minutes. Wait a moment and try again.' : 'The images could not be loaded (' + (e && e.message || 'network error') + '). The public archive or our scene finder may be busy; please try again.');
    });
  }
  function status(t, p){ $('plstatus').textContent = t; $('plbar').style.width = Math.max(0, Math.min(100, p || 0)) + '%'; }

  /* ---------- drawing ---------- */
  function paint(cv, img){
    cv.width = img.size; cv.height = img.size;
    cv.getContext('2d').putImageData(new ImageData(img.rgba, img.size, img.size), 0, 0);
  }
  function grid(){
    $('plgrid').innerHTML = Q.map(function(q, i){ return '<li id="plq' + i + '"></li>'; }).join('');
    Q.forEach(function(q, i){ cell(i); });
  }
  function cell(i){
    var q = Q[i], li = $('plq' + i); if (!li) return;
    var tried = q.tried ? q.tried.length : 0, head = '<b>' + esc(qlabel(q.q)) + '</b>';
    if (q.status === 'ok') {
      li.innerHTML = '<button type="button" data-i="' + i + '" aria-label="Show ' + esc(qlabel(q.q)) + ', ' + esc(fdate(q.scene.date)) + '"><canvas></canvas></button><div class="m">' + head +
        '<span>' + esc(fdate(q.scene.date)) + '</span><span>' + q.clear_at_pin + '% clear at pin, scene ' + Math.round(q.scene.cloud) + '% cloud</span><a href="' + esc(q.scene.tci) + '" rel="noopener">source image</a></div>';
      paint(li.querySelector('canvas'), q.image);
    } else if (q.status === 'wait') {
      li.innerHTML = '<button type="button" disabled aria-label="' + esc(qlabel(q.q)) + ' loading"><span class="pl-wait">Checking…</span></button><div class="m">' + head + '<span>' + esc(fdate(q.from)) + ' to ' + esc(fdate(q.to)) + '</span></div>';
    } else {
      li.innerHTML = '<button type="button" disabled aria-label="' + esc(qlabel(q.q)) + ': ' + esc(q.status) + '"><span class="pl-none">' + (q.status === 'no image' ? 'No scene listed' : q.status === 'search failed' ? 'Search failed' : 'Cloud at the pin in every scene checked') + '</span></button><div class="m">' + head +
        '<span>' + (tried ? tried + ' scene' + (tried > 1 ? 's' : '') + ' checked' : (q.listed || 0) + ' listed') + '</span></div>';
    }
    li.classList.toggle('sel', i === sel);
  }
  function show(i){
    if (i < 0 || !Q[i] || Q[i].status !== 'ok') return;
    sel = i; var q = Q[i];
    paint($('plbig'), q.image);
    var sb = document.querySelector('.pl-scale i'); if (sb) sb.style.width = Math.round($('plbig').clientWidth * 200 / (q.image.size * 10)) + 'px';
    $('plbig').setAttribute('aria-label', 'Sentinel-2 true colour around your pin, ' + fdate(q.scene.date));
    $('plcap').textContent = qlabel(q.q) + ' · ' + fdate(q.scene.date);
    $('plsel').textContent = q.clear_at_pin + '% clear within 150 m of the pin. Scene ' + q.scene.id + '.';
    Array.prototype.forEach.call($('plgrid').children, function(li, k){ li.classList.toggle('sel', k === i); });
    var ok = okIdx(); $('plprev').disabled = ok.indexOf(i) <= 0; $('plnext').disabled = ok.indexOf(i) >= ok.length - 1;
  }
  function okIdx(){ var a = []; Q.forEach(function(q, k){ if (q.status === 'ok') a.push(k); }); return a; }
  function stepBy(d){ var ok = okIdx(), k = ok.indexOf(sel); if (!ok.length) return; k += d; if (k >= ok.length) k = 0; if (k < 0) k = 0; show(ok[k]); }
  function play(){
    if (timer) return stop();
    var b = $('plplay'); b.setAttribute('aria-pressed', 'true'); b.setAttribute('aria-label', 'Pause');
    var ok = okIdx(); if (ok.indexOf(sel) === ok.length - 1) show(ok[0]);
    timer = setInterval(function(){ stepBy(1); }, 1100);
  }
  function stop(){ if (timer) clearInterval(timer); timer = null; var b = $('plplay'); if (b) { b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', 'Play'); } }

  function reading(res){
    var c = KSatPoint.change(res);
    if (!c.enough) { $('plread').textContent = 'Only ' + c.clear + ' clear quarter' + (c.clear === 1 ? '' : 's') + ': not enough to compare.'; return; }
    $('plread').innerHTML = esc(c.reading) + ' <span class="muted">(Median of the ' + (c.quarters_compared === 2 ? 'first two and the last two' : 'first and the last') + ' clear quarters, ' + esc(qlabel(c.first.q)) + ' to ' + esc(qlabel(c.last.q)) + ': brightness ' + (c.d_brightness > 0 ? '+' : '') + c.d_brightness + ', greenness ' + (c.d_greenness > 0 ? '+' : '') + c.d_greenness + ', on a 0 to 255 scale.)</span>';
    var pts = Q.map(function(q, i){ return q.status === 'ok' ? { i: i, b: q.image.brightness, g: q.image.greenness, l: qlabel(q.q) } : null; }).filter(Boolean);
    var W = 360, H = 170, Lm = 34, R = 10, T = 18, B = 30, n = Q.length;
    var vals = pts.reduce(function(a, p){ return a.concat([p.b, p.g]); }, []);
    var lo = Math.min(0, Math.floor(Math.min.apply(null, vals) / 20) * 20), hi = Math.max(60, Math.ceil(Math.max.apply(null, vals) / 20) * 20);
    var x = function(i){ return Lm + (W - Lm - R) * (n > 1 ? i / (n - 1) : .5); }, y = function(v){ return T + (H - T - B) * (1 - (v - lo) / (hi - lo)); };
    var g = '';
    [lo, (lo + hi) / 2, hi].forEach(function(v){ g += '<line class="ax" x1="' + Lm + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (Lm - 5) + '" y="' + (y(v) + 3) + '" text-anchor="end">' + Math.round(v) + '</text>'; });
    var path = function(k){ return pts.map(function(p, j){ return (j ? 'L' : 'M') + x(p.i).toFixed(1) + ' ' + y(p[k]).toFixed(1); }).join(' '); };
    g += '<path class="lb" d="' + path('b') + '"/><path class="lg" d="' + path('g') + '"/>';
    pts.forEach(function(p){ g += '<circle cx="' + x(p.i) + '" cy="' + y(p.b) + '" r="3" fill="#17212B"/><circle cx="' + x(p.i) + '" cy="' + y(p.g) + '" r="3" fill="#0B7A55"/>'; });
    [0, n - 1].forEach(function(i){ g += '<text x="' + x(i) + '" y="' + (H - 12) + '" text-anchor="' + (i ? 'end' : 'start') + '">' + esc(qlabel(Q[i].q)) + '</text>'; });
    g += '<text class="k" x="' + Lm + '" y="11">─ brightness</text><text class="k" x="' + (Lm + 100) + '" y="11" style="fill:#0B7A55">- - greenness</text>';
    var desc = 'At the pin, per clear quarter: ' + pts.map(function(p){ return p.l + ' brightness ' + p.b + ', greenness ' + p.g; }).join('; ');
    $('plchart').innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(desc) + '">' + g + '</svg>';
  }

  /* ---------- wiring ---------- */
  function boot(){
    if (!window.L || !window.GeoTIFF || !window.KSatPoint) { err('The map could not start in this browser.'); return; }
    var sp = new URLSearchParams(location.search), lat = +sp.get('lat'), lng = +sp.get('lng'), y = +sp.get('y');
    if (y === 2 || y === 3) years = y;
    Array.prototype.forEach.call($('plyears').querySelectorAll('button'), function(b){ b.setAttribute('aria-pressed', +b.dataset.y === years ? 'true' : 'false'); });
    var has = sp.get('lat') && lat >= -80 && lat <= 84 && lng >= -180 && lng <= 180;
    initMap(has ? lat : -8.65, has ? lng : 115.13, has ? 16 : 11);
    if (has) pin(lat, lng, false);
    fetch('/data/satellite.json').then(function(r){ return r.json(); }).then(function(d){
      var s = (d.sites || []).slice(0, 5);
      if (!s.length) return;
      $('pltry').innerHTML = '<span>Try a watched area:</span>' + s.map(function(x){ return '<button type="button" data-lat="' + x.lat + '" data-lng="' + x.lng + '">' + esc(x.label) + '</button>'; }).join('');
    }).catch(function(){});
  }
  $('pltry').addEventListener('click', function(e){ var b = e.target.closest('button'); if (b) pin(+b.dataset.lat, +b.dataset.lng, false); });
  $('plform').addEventListener('submit', function(e){ e.preventDefault(); var p = parse($('plin').value); if (!p) { err('Paste coordinates like -8.6380, 115.1150 or a map link that contains them.'); return; } pin(p[0], p[1], false); });
  $('plyears').addEventListener('click', function(e){
    var b = e.target.closest('button'); if (!b) return; years = +b.dataset.y;
    Array.prototype.forEach.call(this.querySelectorAll('button'), function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    if (mark) { var ll = mark.getLatLng(); pin(ll.lat, ll.lng, true); }
  });
  $('plgrid').addEventListener('click', function(e){ var b = e.target.closest('button[data-i]'); if (b) { stop(); show(+b.dataset.i); } });
  $('plprev').addEventListener('click', function(){ stop(); stepBy(-1); });
  $('plnext').addEventListener('click', function(){ stop(); stepBy(1); });
  $('plplay').addEventListener('click', play);
  document.addEventListener('visibilitychange', function(){ if (document.hidden) stop(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
