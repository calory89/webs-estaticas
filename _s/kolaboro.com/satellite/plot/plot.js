/* Kolaboro: any plot from space (/satellite/plot/, 8 languages). Batch 9 tool, extended in batch 19 (n19d): one clear Sentinel-2
   picture per quarter back to 2017, each made on demand by /api/x/g/frame (cached per point and quarter, rate limited), the
   brightness/greenness reading of KSatPoint.change (plot-core.js), and a time-lapse GIF made in the browser (/k/tlgif.js).
   The pin lives only in the page address; nothing about the person is stored. */
(function(){
  'use strict';
  var $ = function(id){ return document.getElementById(id); };
  var D = { q: 'Q{n} {y}', look: 'Looking up {n} quarters over your pin, newest first…', prog: '{d} of {n} quarters checked, {ok} clear so far.', done: '{ok} of {n} quarters have a clear picture at your pin. Done in {s} s.',
    none: 'No quarter had a clear view of this point. In very cloudy places (wet seasons in the tropics) this happens.', rate: 'Too many new points from your connection in the last few minutes. Wait a moment and try again; pictures already made still load.',
    load: 'Some images could not be made. The public archive or our server may be busy; please try again.', parse: 'Paste coordinates like -8.6380, 115.1150 or a map link that contains them.', map: 'The map could not start in this browser.',
    wait: 'Checking…', noimg: 'No scene listed', fail: 'Search failed', cloud: 'Cloud at the pin in every scene checked', clear: '{c}% clear at pin, scene {s}% cloud', src: 'source image', tried: '{n} scenes checked',
    show: 'Show {q}, {d}', big: 'Sentinel-2 true colour around your pin, {d}', sel: '{c}% clear within 150 m of the pin. Scene {id}.', prev: 'Previous quarter', next: 'Next quarter', play: 'Play', pause: 'Pause', tryw: 'Try a watched area:',
    few: 'Only {n} clear quarters: not enough to compare.', r_none: 'No large change in brightness or greenness at the pin between the start and the end of the period.',
    r_clear: 'The ground at the pin got brighter or less green: consistent with clearing, earthworks or new roofs. It does not show which stage a building has reached.', r_green: 'The pin got greener: vegetation grew, or the season changed. That is not a sign of construction.',
    r_other: 'The ground at the pin looks different from the start of the period. Look at the pictures to see why.', r_how: '(Median of the first two and the last two clear quarters, {a} to {b}: brightness {db}, greenness {dg}, on a 0 to 255 scale.)',
    lb: 'brightness', lg: 'greenness', chart: 'At the pin, per clear quarter: {x}', g_making: 'Making the GIF in your browser: {p}%', g_ready: 'GIF ready: {n} real images, {kb} KB.', g_share: 'Share', g_dl: 'Download GIF',
    g_copy: 'Copy link', g_copied: 'Link copied', g_note: 'Made in your browser from the real quarterly images above. Nothing is uploaded or stored.', g_fail: 'This browser could not make the GIF. The images above stay available.', locale: 'en-GB' };
  var S = D;
  try { var tj = $('kpl-t'); if (tj) { var o = JSON.parse(tj.textContent); S = {}; for (var k in D) S[k] = o[k] != null ? o[k] : D[k]; S.lang = o.lang; } } catch (e) { S = D; }
  function f(k, v){ return String(S[k] || D[k] || k).replace(/\{(\w+)\}/g, function(m, x){ return v && v[x] != null ? v[x] : m; }); }
  var map, mark, box, span = '3', ctl = null, Q = [], sel = -1, timer = null, runId = 0, PIN = null;
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  var DF = null; try { DF = new Intl.DateTimeFormat(S.locale || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) {}
  function fdate(s){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); if (!m) return ''; var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); return DF ? DF.format(d) : s.slice(0, 10); }
  function qlabel(q){ var m = /^(\d{4})-Q(\d)$/.exec(q); return m ? f('q', { n: m[2], y: m[1] }) : q; }
  function sg(v){ return (v > 0 ? '+' : '') + v; }
  function err(t){ var e = $('plerr'); if (!t) { e.hidden = true; return; } e.hidden = false; e.textContent = t; }

  /* ---------- input ---------- */
  function parse(t){
    t = String(t || '').trim(); if (!t) return null;
    var m = /@(-?\d+\.\d+),\s*(-?\d+\.\d+)/.exec(t) || /[?&](?:q|ll|query|center)=(-?\d+\.\d+)(?:,|%2C)\s*(-?\d+\.\d+)/i.exec(t) || /mlat=(-?\d+\.\d+)&mlon=(-?\d+\.\d+)/.exec(t) || /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/.exec(t) || /^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/.exec(t);
    if (!m) return null;
    var lat = +m[1], lng = +m[2];
    if (!(lat >= -80 && lat <= 84 && lng >= -180 && lng <= 180)) return null;
    return [lat, lng];
  }
  function quarters(){
    var now = new Date(), cy = now.getUTCFullYear(), cq = Math.floor(now.getUTCMonth() / 3), out = [];
    var n = span === 'all' ? (cy - 2017) * 4 + cq + 1 : (+span || 3) * 4;
    for (var i = n - 1; i >= 0; i--) { var y = cy, k = cq - i; while (k < 0) { k += 4; y--; } if (y >= 2017) out.push(y + '-Q' + (k + 1)); }
    return out;
  }

  /* ---------- map ---------- */
  function initMap(lat, lng, z){
    map = L.map('plmap', { zoomControl: true, worldCopyJump: true }).setView([lat, lng], z);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
    map.on('click', function(e){ pin(e.latlng.lat, e.latlng.lng, true); });
  }
  function shareUrl(){ return location.origin + location.pathname + '?lat=' + PIN[0].toFixed(5) + '&lng=' + PIN[1].toFixed(5) + '&y=' + span; }
  function pin(lat, lng, fromMap){
    lat = Math.round(lat * 1e5) / 1e5; lng = Math.round((((lng + 540) % 360) - 180) * 1e5) / 1e5; PIN = [lat, lng];
    if (!mark) mark = L.circleMarker([lat, lng], { radius: 8, color: '#17212B', weight: 3, fillColor: '#FF5B14', fillOpacity: 1 }).addTo(map);
    else mark.setLatLng([lat, lng]);
    var dLat = 640 / 111320, dLng = 640 / (111320 * Math.cos(lat * Math.PI / 180));   // the 1.28 km box the pictures cover
    var b = [[lat - dLat, lng - dLng], [lat + dLat, lng + dLng]];
    if (!box) box = L.rectangle(b, { color: '#FF5B14', weight: 1.5, fill: false, dashArray: '5 4', interactive: false }).addTo(map); else box.setBounds(b);
    if (!fromMap) map.setView([lat, lng], Math.max(map.getZoom(), 15));
    $('plin').value = lat.toFixed(5) + ', ' + lng.toFixed(5);
    try { history.replaceState(null, '', '?lat=' + lat.toFixed(5) + '&lng=' + lng.toFixed(5) + '&y=' + span); } catch (e) {}
    $('plms').href = '/milestones/?lat=' + lat.toFixed(5) + '&lng=' + lng.toFixed(5);
    go(lat, lng);
  }

  /* ---------- run: one request per quarter, newest first, four at a time ---------- */
  function go(lat, lng){
    if (ctl) ctl.abort();
    stop(); err(''); gifReset();
    var my = ++runId; ctl = window.AbortController ? new AbortController() : null;
    var qs = quarters(), total = qs.length, done = 0, t0 = Date.now(), rate = false, failed = 0;
    Q = qs.map(function(q){ return { q: q, status: 'wait' }; }); sel = -1;
    $('plv').hidden = true; $('plsrc').textContent = ''; $('plread').textContent = ''; $('plchart').innerHTML = '';
    grid(); status(f('look', { n: total }), 3);
    var order = Q.map(function(x, i){ return i; }).reverse(), p = 0;
    function one(){
      if (my !== runId || p >= order.length) return Promise.resolve();
      var i = order[p++], q = Q[i];
      return fetch('/api/x/g/frame?lat=' + lat.toFixed(5) + '&lng=' + lng.toFixed(5) + '&q=' + q.q, { signal: ctl && ctl.signal }).then(function(r){
        if (r.status === 429) { rate = true; return { q: q.q, status: 'rate' }; }
        return r.json().then(function(d){ return d; }, function(){ return { q: q.q, status: 'search failed' }; });
      }).then(function(d){
        if (my !== runId) return;
        if (d.status === 'ok' && d.png) {
          return new Promise(function(res){
            var im = new Image(); im.onload = function(){ res(im); }; im.onerror = function(){ res(null); }; im.src = d.png;
          }).then(function(im){
            if (my !== runId) return;
            if (!im) { failed++; Q[i] = { q: q.q, status: 'search failed' }; }
            else { d.image = { img: im, size: d.size || 128, brightness: d.brightness, greenness: d.greenness }; delete d.png; Q[i] = d; }
            after(i);
          });
        }
        if (d.status !== 'no image' && d.status !== 'no clear image' && d.status !== 'rate') failed++;
        Q[i] = d; after(i);
      }, function(e){
        if (my !== runId || (e && /abort/i.test(String(e.name) + String(e.message)))) return;
        failed++; Q[i] = { q: q.q, status: 'search failed' }; after(i);
      }).then(one);
    }
    function after(i){
      done++; cell(i);
      var ok = okIdx().length;
      status(f('prog', { d: done, n: total, ok: ok }), 3 + 97 * done / total);
      if (Q[i].status === 'ok' && (sel < 0 || i > sel)) { $('plv').hidden = false; show(i); }
      if (ok >= 2) gifReady();
    }
    Promise.all([one(), one(), one(), one()]).then(function(){
      if (my !== runId) return;
      var ok = okIdx();
      status(f('done', { ok: ok.length, n: total, s: ((Date.now() - t0) / 1000).toFixed(1) }), 100);
      $('plsrc').textContent = 'Contains modified Copernicus Sentinel data. Copernicus Sentinel-2 L2A, found with Element84 Earth Search, read from the Sentinel-2 COGs on AWS Open Data.';
      if (rate) err(f('rate')); else if (failed) err(f('load'));
      if (!ok.length) { $('plv').hidden = true; if (!rate && !failed) err(f('none')); return; }
      $('plv').hidden = false; show(ok[ok.length - 1]); reading();
    });
  }
  function status(t, p){ $('plstatus').textContent = t; $('plbar').style.width = Math.max(0, Math.min(100, p || 0)) + '%'; }

  /* ---------- drawing ---------- */
  function paint(cv, img){ cv.width = img.size; cv.height = img.size; cv.getContext('2d').drawImage(img.img, 0, 0, img.size, img.size); }
  function grid(){ $('plgrid').innerHTML = Q.map(function(q, i){ return '<li id="plq' + i + '"></li>'; }).join(''); Q.forEach(function(q, i){ cell(i); }); }
  function cell(i){
    var q = Q[i], li = $('plq' + i); if (!li) return;
    var tried = q.tried ? q.tried.length : 0, head = '<b>' + esc(qlabel(q.q)) + '</b>';
    if (q.status === 'ok') {
      li.innerHTML = '<button type="button" data-i="' + i + '" aria-label="' + esc(f('show', { q: qlabel(q.q), d: fdate(q.scene.date) })) + '"><canvas></canvas></button><div class="m">' + head +
        '<span>' + esc(fdate(q.scene.date)) + '</span><span>' + esc(f('clear', { c: q.clear_at_pin, s: Math.round(q.scene.cloud) })) + '</span><a href="' + esc(q.scene.stac) + '" rel="noopener">' + esc(f('src')) + '</a></div>';
      paint(li.querySelector('canvas'), q.image);
    } else if (q.status === 'wait') {
      li.innerHTML = '<button type="button" disabled aria-label="' + esc(qlabel(q.q) + ': ' + f('wait')) + '"><span class="pl-wait">' + esc(f('wait')) + '</span></button><div class="m">' + head + '</div>';
    } else {
      var why = q.status === 'no image' ? f('noimg') : q.status === 'no clear image' ? f('cloud') : f('fail');
      li.innerHTML = '<button type="button" disabled aria-label="' + esc(qlabel(q.q) + ': ' + why) + '"><span class="pl-none">' + esc(why) + '</span></button><div class="m">' + head +
        (tried ? '<span>' + esc(f('tried', { n: tried })) + '</span>' : '') + '</div>';
    }
    li.classList.toggle('sel', i === sel);
  }
  function show(i){
    if (i < 0 || !Q[i] || Q[i].status !== 'ok') return;
    sel = i; var q = Q[i];
    paint($('plbig'), q.image);
    var sb = document.querySelector('.pl-scale i'); if (sb) sb.style.width = Math.round($('plbig').clientWidth * 200 / (q.image.size * 10)) + 'px';
    $('plbig').setAttribute('aria-label', f('big', { d: fdate(q.scene.date) }));
    $('plcap').textContent = qlabel(q.q) + ', ' + fdate(q.scene.date);
    $('plsel').textContent = f('sel', { c: q.clear_at_pin, id: q.scene.id });
    Array.prototype.forEach.call($('plgrid').children, function(li, k){ li.classList.toggle('sel', k === i); });
    var ok = okIdx(); $('plprev').disabled = ok.indexOf(i) <= 0; $('plnext').disabled = ok.indexOf(i) >= ok.length - 1;
  }
  function okIdx(){ var a = []; Q.forEach(function(q, k){ if (q.status === 'ok') a.push(k); }); return a; }
  function stepBy(d){ var ok = okIdx(), k = ok.indexOf(sel); if (!ok.length) return; k += d; if (k >= ok.length) k = 0; if (k < 0) k = 0; show(ok[k]); }
  function play(){
    if (timer) return stop();
    var b = $('plplay'); b.setAttribute('aria-pressed', 'true'); b.setAttribute('aria-label', f('pause'));
    var ok = okIdx(); if (ok.indexOf(sel) === ok.length - 1) show(ok[0]);
    timer = setInterval(function(){ var ok2 = okIdx(); if (ok2.indexOf(sel) >= ok2.length - 1) { stop(); return; } stepBy(1); }, 900);
  }
  function stop(){ if (timer) clearInterval(timer); timer = null; var b = $('plplay'); if (b) { b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', f('play')); } }

  function reading(){
    if (!window.KSatPoint) return;
    var c = KSatPoint.change({ quarters: Q });
    if (!c.enough) { $('plread').textContent = f('few', { n: c.clear }); return; }
    var key = !c.visible ? 'r_none' : c.cleared ? 'r_clear' : c.d_greenness >= 20 ? 'r_green' : 'r_other';
    $('plread').innerHTML = esc(f(key)) + ' <span class="muted">' + esc(f('r_how', { a: qlabel(c.first.q), b: qlabel(c.last.q), db: sg(c.d_brightness), dg: sg(c.d_greenness) })) + '</span>';
    var pts = Q.map(function(q, i){ return q.status === 'ok' && q.image.brightness != null ? { i: i, b: q.image.brightness, g: q.image.greenness, l: qlabel(q.q) } : null; }).filter(Boolean);
    var W = 360, H = 170, Lm = 34, R = 10, T = 18, B = 30, n = Q.length;
    var vals = pts.reduce(function(a, p){ return a.concat([p.b, p.g]); }, []);
    var lo = Math.min(0, Math.floor(Math.min.apply(null, vals) / 20) * 20), hi = Math.max(60, Math.ceil(Math.max.apply(null, vals) / 20) * 20);
    var x = function(i){ return Lm + (W - Lm - R) * (n > 1 ? i / (n - 1) : .5); }, y = function(v){ return T + (H - T - B) * (1 - (v - lo) / (hi - lo)); };
    var g = '';
    [lo, (lo + hi) / 2, hi].forEach(function(v){ g += '<line class="ax" x1="' + Lm + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (Lm - 5) + '" y="' + (y(v) + 3) + '" text-anchor="end">' + Math.round(v) + '</text>'; });
    var path = function(k){ return pts.map(function(p, j){ return (j ? 'L' : 'M') + x(p.i).toFixed(1) + ' ' + y(p[k]).toFixed(1); }).join(' '); };
    g += '<path class="lb" d="' + path('b') + '"/><path class="lg" d="' + path('g') + '"/>';
    var r = n > 20 ? 2 : 3;
    pts.forEach(function(p){ g += '<circle cx="' + x(p.i) + '" cy="' + y(p.b) + '" r="' + r + '" fill="#17212B"/><circle cx="' + x(p.i) + '" cy="' + y(p.g) + '" r="' + r + '" fill="#0B7A55"/>'; });
    [0, n - 1].forEach(function(i){ g += '<text x="' + x(i) + '" y="' + (H - 12) + '" text-anchor="' + (i ? 'end' : 'start') + '">' + esc(qlabel(Q[i].q)) + '</text>'; });
    g += '<text class="k" x="' + Lm + '" y="11">─ ' + esc(f('lb')) + '</text><text class="k" x="' + (Lm + 130) + '" y="11" style="fill:#0B7A55">- - ' + esc(f('lg')) + '</text>';
    var desc = f('chart', { x: pts.map(function(p){ return p.l + ' ' + f('lb') + ' ' + p.b + ', ' + f('lg') + ' ' + p.g; }).join('; ') });
    $('plchart').innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(desc) + '">' + g + '</svg>';
  }

  /* ---------- time-lapse GIF (n19d) ---------- */
  function gifReset(){ var b = $('plgif'); if (!b) return; b.disabled = true; var n = $('plgifn'); if (n) n.hidden = false; var o = $('plgout'); if (o) o.innerHTML = ''; }
  function gifReady(){ var b = $('plgif'); if (!b) return; b.disabled = false; var n = $('plgifn'); if (n) n.hidden = true; }
  function gif(){
    var b = $('plgif'), ok = okIdx(); if (ok.length < 2 || !PIN) return;
    stop(); b.disabled = true;
    function run(){
      var fr = ok.map(function(i){ var q = Q[i]; return { img: q.image.img, date: fdate(q.scene.date) }; });
      var y0 = Q[ok[0]].scene.date.slice(0, 4), y1 = Q[ok[ok.length - 1]].scene.date.slice(0, 4);
      window.KTL.make($('plgout'), { frames: fr, ring: 15 / 128, credit: 'Contains modified Copernicus Sentinel data ' + (y0 === y1 ? y0 : y0 + '-' + y1), url: shareUrl(),
        filename: 'plot-' + PIN[0].toFixed(4) + '_' + PIN[1].toFixed(4) + '-from-space.gif', title: document.title.split(' | ')[0],
        L: { making: S.g_making, ready: S.g_ready, share: S.g_share, dl: S.g_dl, copy: S.g_copy, copied: S.g_copied, note: S.g_note, fail: S.g_fail } }).then(function(){ b.disabled = false; });
    }
    if (window.KTL) run(); else { var s = document.createElement('script'); s.src = '/k/tlgif.js?v=1'; s.onload = run; s.onerror = function(){ b.disabled = false; }; document.head.appendChild(s); }
  }

  /* ---------- wiring ---------- */
  function boot(){
    if (!window.L) { err(f('map')); return; }
    var pressed = $('plyears').querySelector('[aria-pressed="true"]'); if (pressed) span = pressed.getAttribute('data-y');
    var sp = new URLSearchParams(location.search), lat = +sp.get('lat'), lng = +sp.get('lng'), y = sp.get('y');
    if (y && $('plyears').querySelector('[data-y="' + y.replace(/[^a-z0-9]/g, '') + '"]')) span = y;
    Array.prototype.forEach.call($('plyears').querySelectorAll('button'), function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-y') === span ? 'true' : 'false'); });
    var has = sp.get('lat') && lat >= -80 && lat <= 84 && lng >= -180 && lng <= 180;
    initMap(has ? lat : -8.65, has ? lng : 115.13, has ? 16 : 11);
    if (has) pin(lat, lng, false);
    fetch('/data/satellite.json').then(function(r){ return r.json(); }).then(function(d){
      var s = (d.sites || []).slice(0, 5);
      if (!s.length) return;
      $('pltry').innerHTML = '<span>' + esc(f('tryw')) + '</span>' + s.map(function(x){ return '<button type="button" data-lat="' + x.lat + '" data-lng="' + x.lng + '">' + esc(x.label) + '</button>'; }).join('');
    }).catch(function(){});
  }
  $('pltry').addEventListener('click', function(e){ var b = e.target.closest('button'); if (b) pin(+b.dataset.lat, +b.dataset.lng, false); });
  $('plform').addEventListener('submit', function(e){ e.preventDefault(); var p = parse($('plin').value); if (!p) { err(f('parse')); return; } pin(p[0], p[1], false); });
  $('plyears').addEventListener('click', function(e){
    var b = e.target.closest('button'); if (!b) return; span = b.getAttribute('data-y');
    Array.prototype.forEach.call(this.querySelectorAll('button'), function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    if (mark) { var ll = mark.getLatLng(); pin(ll.lat, ll.lng, true); }
  });
  $('plgrid').addEventListener('click', function(e){ var b = e.target.closest('button[data-i]'); if (b) { stop(); show(+b.dataset.i); } });
  $('plprev').addEventListener('click', function(){ stop(); stepBy(-1); });
  $('plnext').addEventListener('click', function(){ stop(); stepBy(1); });
  $('plplay').addEventListener('click', play);
  if ($('plgif')) $('plgif').addEventListener('click', gif);
  document.addEventListener('visibilitychange', function(){ if (document.hidden) stop(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
