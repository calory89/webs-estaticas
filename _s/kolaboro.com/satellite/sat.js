(function(){
  'use strict';
  var $ = function(id){ return document.getElementById(id); };
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var S = [], cur = null, pi = 0, showOv = true, timer = null, filt = { q: '', act: 'all', sort: 'cleared' };

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function num(v){ return typeof v === 'number' && isFinite(v); }
  function pct(v){ return num(v) ? (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, '') + '%' : 'n/a'; }
  function fdate(s){ var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? (+m[3]) + ' ' + MON[+m[2] - 1] + ' ' + m[1] : (s || ''); }
  function img(id, key){ return '/k/sat/' + encodeURIComponent(id) + '/' + encodeURIComponent(key) + '.jpg'; }
  function ovImg(id, key){ return '/k/sat/' + encodeURIComponent(id) + '/' + encodeURIComponent(key) + '-change.png'; }
  function hasChange(p){ return num(p.cleared_since_first_pct); }
  // Last period that carries a "cleared since first" figure.
  function latestCleared(s){ for (var i = s.periods.length - 1; i >= 0; i--) if (hasChange(s.periods[i])) return s.periods[i]; return null; }
  function thumbPeriod(s){ return latestCleared(s) || s.periods[s.periods.length - 1]; }
  function osm(s){ return 'https://www.openstreetmap.org/?mlat=' + s.lat + '&mlon=' + s.lng + '#map=16/' + s.lat + '/' + s.lng; }

  /* ---------- load ---------- */
  fetch('/data/satellite.json?t=' + Math.floor(Date.now() / 6e5)).then(function(r){
    if (!r.ok) throw new Error('HTTP ' + r.status); return r.json();
  }).then(init).catch(function(){
    $('stgrid').innerHTML = '<p class="st-empty">The satellite data could not be loaded right now. Please try again in a few minutes.</p>';
    $('stviewer').innerHTML = '<p class="st-err">The viewer needs the live satellite data, which did not load. Reload the page to try again.</p>';
  });

  function init(d){
    S = (d.sites || []).filter(function(s){ return s && s.kind === 'area' && s.id && Array.isArray(s.periods) && s.periods.length; });
    S.forEach(function(s){ s._lc = latestCleared(s); s._lcv = s._lc ? s._lc.cleared_since_first_pct : null; });
    var act = S.filter(function(s){ return s.activity === 'active'; }).length;
    $('n-areas').textContent = S.length;
    $('n-active').textContent = act;
    $('n-updated').textContent = fdate(d.updated);
    var km = S.length ? S[0].box_km : null, same = S.every(function(s){ return s.box_km === km; });
    $('n-box').textContent = same && num(km) ? km + ' km' : 'varies';
    if (d.source) $('stsource').textContent = d.source;
    var b = S[0] && S[0].periods; if (b) { $('n-first').textContent = b[0].label; }

    var sel = $('starea');
    sel.innerHTML = S.slice().sort(function(a, b){ return a.label.localeCompare(b.label); }).map(function(s){ return '<option value="' + esc(s.id) + '">' + esc(s.label) + '</option>'; }).join('');
    sel.addEventListener('change', function(){ pick(sel.value, true); });

    bindFilters();
    renderCards();
    var h = decodeURIComponent((location.hash || '').slice(1));
    var start = S.filter(function(s){ return s.id === h; })[0] || S.slice().sort(function(a, b){ return (b._lcv || 0) - (a._lcv || 0); })[0];
    if (start) pick(start.id, false);
    if (S.filter(function(s){ return s.id === h; })[0]) setTimeout(function(){ $('viewer').scrollIntoView(); }, 50);
    window.addEventListener('hashchange', function(){ var id = decodeURIComponent(location.hash.slice(1)); if (S.some(function(s){ return s.id === id; }) && (!cur || cur.id !== id)) pick(id, false); });
  }

  /* ---------- filters + cards ---------- */
  function bindFilters(){
    $('stq').addEventListener('input', function(){ filt.q = this.value.trim().toLowerCase(); renderCards(); });
    Array.prototype.forEach.call(document.querySelectorAll('#stact button'), function(btn){
      btn.addEventListener('click', function(){
        filt.act = btn.dataset.act;
        Array.prototype.forEach.call(document.querySelectorAll('#stact button'), function(x){ x.setAttribute('aria-pressed', x === btn ? 'true' : 'false'); });
        renderCards();
      });
    });
    $('stsort').addEventListener('change', function(){ filt.sort = this.value; renderCards(); });
  }

  function renderCards(){
    var list = S.filter(function(s){
      if (filt.act !== 'all' && s.activity !== filt.act) return false;
      return !filt.q || s.label.toLowerCase().indexOf(filt.q) >= 0 || s.id.indexOf(filt.q) >= 0;
    });
    list.sort(function(a, b){
      if (filt.sort === 'name') return a.label.localeCompare(b.label);
      if (filt.sort === 'activity') return (a.activity === b.activity ? 0 : a.activity === 'active' ? -1 : 1) || (b._lcv || 0) - (a._lcv || 0);
      return (b._lcv || 0) - (a._lcv || 0) || a.label.localeCompare(b.label);
    });
    $('stcount').textContent = list.length === S.length ? 'Showing all ' + S.length + ' areas' : 'Showing ' + list.length + ' of ' + S.length + ' areas';
    if (!list.length) { $('stgrid').innerHTML = '<p class="st-empty">No area matches that search. Try another name or clear the filter.</p>'; return; }
    $('stgrid').innerHTML = list.map(function(s){
      var tp = thumbPeriod(s), on = s.activity === 'active';
      return '<button type="button" class="st-card" data-id="' + esc(s.id) + '"' + (cur && cur.id === s.id ? ' aria-current="true"' : '') + ' aria-label="' + esc(s.label + ', ' + (on ? 'active' : 'quiet') + ', ' + (s._lc ? pct(s._lcv) + ' cleared by ' + s._lc.label : 'no cleared figure yet') + '. Open in viewer') + '">' +
        '<span class="st-th"><img src="' + img(s.id, tp.key) + '" alt="" loading="lazy" width="240" height="240" onerror="this.remove()"><span class="st-miss" aria-hidden="true">No image</span><span class="st-tag' + (on ? ' on' : '') + '">' + (on ? 'Active' : 'Quiet') + '</span></span>' +
        '<span class="st-cb"><b>' + esc(s.label) + '</b>' +
        (s._lc ? '<span><em>' + pct(s._lcv) + '</em> cleared since ' + esc(s.periods[0].label.replace(/ dry season$/, '')) + '</span>' : '<span>No cleared figure yet</span>') +
        '</span></button>';
    }).join('');
  }

  $('stgrid').addEventListener('click', function(e){
    var c = e.target.closest('.st-card'); if (!c) return;
    pick(c.dataset.id, true);
    $('viewer').scrollIntoView({ behavior: RM && RM.matches ? 'auto' : 'smooth', block: 'start' });
  });

  /* ---------- viewer ---------- */
  function pick(id, push){
    var s = S.filter(function(x){ return x.id === id; })[0]; if (!s) return;
    stop();
    cur = s;
    pi = s.periods.length - 1;
    // start on the latest period that has a change layer, so the overlay is visible straight away
    for (var i = s.periods.length - 1; i >= 0; i--) if (hasChange(s.periods[i])) { pi = i; break; }
    $('starea').value = id;
    if (push && history.replaceState) history.replaceState(null, '', '#' + encodeURIComponent(id));
    Array.prototype.forEach.call($('stgrid').querySelectorAll('.st-card'), function(c){ if (c.dataset.id === id) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current'); });
    var r = $('strange'); r.max = s.periods.length - 1; r.value = pi;
    $('stticks').innerHTML = s.periods.map(function(p){ return '<span>' + esc(p.key === 'latest' ? 'Latest' : p.label.replace(/ dry season$/, '')) + '</span>'; }).join('');
    $('stname').textContent = s.label;
    $('stmeta').innerHTML = (s.activity === 'active' ? 'Active' : 'Quiet') + ' &middot; box about ' + esc(s.box_km) + ' km across, centred on ' + esc(s.lat) + ', ' + esc(s.lng) + ' &middot; <a href="' + osm(s) + '" target="_blank" rel="noopener">map</a>';
    $('stplist').innerHTML = s.periods.map(function(p, i){
      return '<li><button type="button" data-i="' + i + '"><span>' + esc(p.label) + '</span><span>' + (hasChange(p) ? pct(p.cleared_since_first_pct) + ' cleared' : (i === 0 ? 'Baseline' : 'No change layer')) + '</span></button></li>';
    }).join('');
    // warm the cache so the timelapse does not stutter
    s.periods.forEach(function(p){ var a = new Image(); a.src = img(s.id, p.key); if (hasChange(p)) { var b = new Image(); b.src = ovImg(s.id, p.key); } });
    show();
  }

  function show(){
    var s = cur; if (!s) return;
    var p = s.periods[pi], base = $('stbase'), ov = $('stov'), miss = $('stmiss');
    $('strange').value = pi;
    $('strange').setAttribute('aria-valuetext', p.label);
    miss.hidden = true;
    base.hidden = false;
    base.alt = 'Sentinel-2 composite of ' + s.label + ', ' + p.label + ' (' + fdate(p.from) + ' to ' + fdate(p.to) + ')';
    if (base.getAttribute('src') !== img(s.id, p.key)) base.src = img(s.id, p.key);
    var can = hasChange(p);
    ov.hidden = !(can && showOv);
    if (can) { if (ov.getAttribute('src') !== ovImg(s.id, p.key)) ov.src = ovImg(s.id, p.key); }
    else { ov.removeAttribute('src'); }
    var tog = $('sttog'); tog.disabled = !can; tog.checked = showOv && can;
    $('sttogw').classList.toggle('off', !can);
    $('sttogw').title = can ? '' : (pi === 0 ? 'This is the baseline period, so there is nothing to compare it with' : 'This window is not compared with the baseline');
    $('stcapl').textContent = p.label;
    $('stcapr').textContent = (can && showOv) ? 'Orange: cleared since ' + s.periods[0].label.replace(/ dry season$/, '') : fdate(p.from) + ' to ' + fdate(p.to);
    $('stprev').disabled = pi <= 0;
    $('stnext').disabled = pi >= s.periods.length - 1;
    Array.prototype.forEach.call($('stplist').querySelectorAll('button'), function(b){ if (+b.dataset.i === pi) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    stats(p);
    chart();
    $('stlive').textContent = s.label + ', ' + p.label + (can ? ', ' + pct(p.cleared_since_first_pct) + ' cleared since the first period' : '');
  }

  function stats(p){
    var first = cur.periods[0].label.replace(/ dry season$/, '');
    var cells = [
      [hasChange(p) ? pct(p.cleared_since_first_pct) : (pi === 0 ? 'Base' : 'n/a'), 'Land cleared since ' + first + (pi === 0 ? ' (this is the baseline)' : hasChange(p) ? '' : ' (not compared for this window)'), 'hi'],
      [num(p.changed_since_previous_pct) ? pct(p.changed_since_previous_pct) : 'n/a', 'Land that changed since the previous period'],
      [pct(p.vegetation_pct), 'Covered by green vegetation'],
      [pct(p.clear_pct), 'Of the box seen without cloud']
    ];
    $('ststats').innerHTML = cells.map(function(c){ return '<div' + (c[2] ? ' class="' + c[2] + '"' : '') + '><b>' + c[0] + '</b><span>' + esc(c[1]) + '</span></div>'; }).join('');
    $('stdates').textContent = p.label + ': median of the images from ' + fdate(p.from) + ' to ' + fdate(p.to) + '.';
  }

  function chart(){
    var s = cur, pts = [];
    s.periods.forEach(function(p, i){
      if (i === 0) pts.push({ i: i, v: 0, base: true, l: p.label });
      else if (hasChange(p)) pts.push({ i: i, v: p.cleared_since_first_pct, l: p.label });
    });
    var W = 360, H = 176, L = 44, R = 14, T = 22, B = 30;
    if (pts.length < 2) { $('stchart').innerHTML = '<p>Not enough periods to draw a trend yet.</p>'; return; }
    var max = Math.max.apply(null, pts.map(function(p){ return p.v; }));
    var top = max <= 5 ? 5 : max <= 10 ? 10 : max <= 20 ? 20 : Math.ceil(max / 10) * 10;
    var x = function(k){ return L + (W - L - R) * (k / (pts.length - 1)); };
    var y = function(v){ return T + (H - T - B) * (1 - v / top); };
    var g = '';
    [0, top / 2, top].forEach(function(v){ g += '<line class="ax" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (L - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + v + '%</text>'; });
    var d = pts.map(function(p, k){ return (k ? 'L' : 'M') + x(k).toFixed(1) + ' ' + y(p.v).toFixed(1); }).join(' ');
    g += '<path class="ln" d="' + d + '"/>';
    pts.forEach(function(p, k){
      var c = p.i === pi;
      g += '<circle class="' + (p.base ? 'base' : 'pt') + (c ? ' cur' : '') + '" cx="' + x(k) + '" cy="' + y(p.v) + '" r="' + (c ? 6 : 4.5) + '"/>';
      if (!p.base) g += '<text class="v" x="' + x(k) + '" y="' + (y(p.v) - 10) + '" text-anchor="middle">' + pct(p.v) + '</text>';
      g += '<text x="' + x(k) + '" y="' + (H - 10) + '" text-anchor="middle">' + esc(p.l.replace(/ dry season$/, '')) + (p.base ? ' (base)' : '') + '</text>';
      g += '<rect class="hit" data-i="' + p.i + '" x="' + (x(k) - 22) + '" y="0" width="44" height="' + H + '"><title>' + esc(p.l + ': ' + (p.base ? 'baseline' : pct(p.v) + ' cleared')) + '</title></rect>';
    });
    var desc = 'Land cleared since ' + pts[0].l + ' in ' + s.label + ': ' + pts.filter(function(p){ return !p.base; }).map(function(p){ return p.l + ' ' + pct(p.v); }).join(', ');
    $('stchart').innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(desc) + '">' + g + '</svg>';
  }

  function go(i){ if (!cur) return; pi = Math.max(0, Math.min(cur.periods.length - 1, i)); show(); }
  function step(){ if (!cur) return; pi = pi >= cur.periods.length - 1 ? 0 : pi + 1; show(); }
  function play(){
    if (!cur || cur.periods.length < 2) return;
    var b = $('stplay'); b.setAttribute('aria-pressed', 'true'); b.setAttribute('aria-label', 'Pause timelapse'); b.innerHTML = ICON.pause;
    var reduce = RM && RM.matches;
    if (pi >= cur.periods.length - 1) { pi = 0; show(); }
    timer = setInterval(step, reduce ? 2600 : 1300);
  }
  function stop(){
    if (timer) clearInterval(timer); timer = null;
    var b = $('stplay'); if (!b) return; b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', 'Play timelapse'); b.innerHTML = ICON.play;
  }
  var ICON = {
    play: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4l10 6-10 6z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 4h3.5v12H5zM11.5 4H15v12h-3.5z" fill="currentColor"/></svg>'
  };

  $('stplay').innerHTML = ICON.play;
  $('stplay').addEventListener('click', function(){ if (timer) stop(); else play(); });
  $('stprev').addEventListener('click', function(){ stop(); go(pi - 1); });
  $('stnext').addEventListener('click', function(){ stop(); go(pi + 1); });
  $('strange').addEventListener('input', function(){ stop(); go(+this.value); });
  $('sttog').addEventListener('change', function(){ showOv = this.checked; show(); });
  $('stplist').addEventListener('click', function(e){ var b = e.target.closest('button'); if (b) { stop(); go(+b.dataset.i); } });
  $('stchart').addEventListener('click', function(e){ var r = e.target.closest('.hit'); if (r) { stop(); go(+r.getAttribute('data-i')); } });
  document.addEventListener('visibilitychange', function(){ if (document.hidden) stop(); });
  if (RM && RM.addEventListener) RM.addEventListener('change', function(){ if (timer) { stop(); play(); } });

  $('stbase').addEventListener('error', function(){
    this.hidden = true; $('stov').hidden = true;
    var m = $('stmiss'); m.hidden = false;
    m.textContent = 'No satellite image is available for ' + (cur ? cur.label + ', ' + cur.periods[pi].label : 'this period') + ' yet. The figures on the right still come from the analysis.';
  });
  $('stov').addEventListener('error', function(){
    this.hidden = true; var t = $('sttog'); t.disabled = true; t.checked = false; $('sttogw').classList.add('off');
    $('stcapr').textContent = 'Change layer not available';
  });
})();
