/* Satellite watch: monthly optical progress (Sentinel-2, cloud-masked) per watched area. Data: /data/satellite-optical.json */
(function(){
  'use strict';
  var $ = function(id){ return document.getElementById(id); };
  if (!$('opsec')) return;
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var D = null, cur = null, mi = -1, timer = null;
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function ml(m){ var x = /^(\d{4})-(\d{2})$/.exec(m || ''); return x ? MON[+x[2] - 1] + ' ' + x[1] : m; }
  function fdate(s){ var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? (+m[3]) + ' ' + MON[+m[2] - 1] + ' ' + m[1] : (s || ''); }
  function frame(id, m){ return '/k/sat/' + encodeURIComponent(id) + '/opt/' + m + '.jpg'; }
  function sg(v){ return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v); }

  fetch('/data/satellite-optical.json?t=' + Math.floor(Date.now() / 6e5)).then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); }).then(init).catch(function(){
    $('opbody').innerHTML = '<p class="st-empty">The monthly optical series is being built by the weekly pipeline and is not published yet. The yearly composites and radar above are live.</p>';
  });

  function init(d){
    D = d; var S = (d.sites || []).filter(function(s){ return s.months && s.months.length; });
    if (!S.length) { $('opbody').innerHTML = '<p class="st-empty">No monthly series yet.</p>'; return; }
    var nm = S.reduce(function(a, s){ return a + s.months.length; }, 0), nc = S.reduce(function(a, s){ return a + s.summary.months_clear; }, 0);
    $('opn').innerHTML = '<div><b>' + S.length + '</b><span>areas with a monthly series</span></div><div><b>' + ml(d.from) + '</b><span>first month</span></div><div><b>' + Math.round(nc / nm * 100) + '%</b><span>of area-months clear enough to measure</span></div><div><b>' + fdate(d.updated) + '</b><span>last updated</span></div>';
    $('opmethod').textContent = d.method + ' Source: ' + d.source;
    $('oppick').innerHTML = S.map(function(s){ return '<option value="' + esc(s.id) + '">' + esc(s.label) + '</option>'; }).join('');
    $('oppick').addEventListener('change', function(){ pick(this.value); });
    document.addEventListener('kb-sat-area', function(e){ if (e.detail && D) { var ok = S.some(function(s){ return s.id === e.detail; }); if (ok) { $('oppick').value = e.detail; pick(e.detail); } } });
    var h = ''; try { h = decodeURIComponent(location.hash.slice(1)); } catch (e) {}
    pick(h && S.some(function(s){ return s.id === h; }) ? h : S[0].id);
  }

  function pick(id){
    stop();
    cur = (D.sites || []).filter(function(s){ return s.id === id; })[0]; if (!cur) return;
    $('oppick').value = id;
    var ok = cur.months.filter(function(m){ return m.status === 'ok'; }), fr = cur.months.filter(function(m){ return m.frame; }), sm = cur.summary || {};
    var cloudy = cur.months.filter(function(m){ return m.status === 'cloudy'; }).length;
    var cells = [];
    cells.push([sm.new_built_since_baseline_pct != null ? sm.new_built_since_baseline_pct + '%' : 'n/a', 'of clear pixels turned built-up or bare since ' + ml(cur.baseline_month || sm.from)]);
    cells.push([sm.built_change_pts != null ? sg(sm.built_change_pts) + ' pts' : 'n/a', 'change in the built-up or bare share, ' + ml(sm.from) + ' to ' + ml(sm.to)]);
    cells.push([ok.length + ' of ' + cur.months.length, 'months clear enough to measure (' + cloudy + ' too cloudy)']);
    $('opstats').innerHTML = cells.map(function(c, i){ return '<div' + (i ? '' : ' class="hi"') + '><b>' + esc(c[0]) + '</b><span>' + esc(c[1]) + '</span></div>'; }).join('');
    $('optl').hidden = !cur.timelapse;
    if (cur.timelapse) { $('optlimg').src = '/k/sat/' + encodeURIComponent(cur.id) + '/opt/timelapse.webp?u=' + encodeURIComponent(D.updated); $('optlimg').alt = 'Timelapse of ' + cur.label + ', ' + fr.length + ' clear months from ' + ml(fr[0] && fr[0].month) + ' to ' + ml(fr[fr.length - 1] && fr[fr.length - 1].month); }
    $('opcap').textContent = fr.length + ' clear months, ' + (cur.area || 'box') + ', 10 m pixels';
    mi = fr.length ? cur.months.indexOf(fr[fr.length - 1]) : -1;
    chart(); showMonth();
  }

  function showMonth(){
    var m = cur.months[mi], img = $('opimg');
    if (!m || !m.frame) { img.hidden = true; $('opmcap').textContent = 'No clear frame'; $('opminfo').textContent = ''; return; }
    img.hidden = false; img.src = frame(cur.id, m.month); img.alt = 'Sentinel-2 true colour of ' + cur.label + ', ' + ml(m.month);
    $('opmcap').textContent = ml(m.month);
    $('opminfo').textContent = ml(m.month) + ': ' + m.scenes_used + ' scene' + (m.scenes_used > 1 ? 's' : '') + ' (' + (m.dates || []).map(fdate).join(', ') + '), ' + m.clear_pct + '% of the area seen clear, built-up or bare ' + m.built_pct + '%' + (m.new_built_since_baseline_pct != null ? ', new since baseline ' + m.new_built_since_baseline_pct + '%' : '') + '.';
    var fr = frameIdx(); $('opprev').disabled = fr.indexOf(mi) <= 0; $('opnext').disabled = fr.indexOf(mi) >= fr.length - 1;
    Array.prototype.forEach.call(document.querySelectorAll('#opchart .bar'), function(b){ b.classList.toggle('cur', +b.getAttribute('data-i') === mi); });
  }
  function frameIdx(){ var a = []; cur.months.forEach(function(m, i){ if (m.frame) a.push(i); }); return a; }
  function step(d){ var fr = frameIdx(), k = fr.indexOf(mi) + d; if (k >= fr.length) k = 0; if (k < 0) k = 0; mi = fr[k]; showMonth(); }
  function stop(){ if (timer) clearInterval(timer); timer = null; var b = $('opplay'); if (b) { b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', 'Play months'); } }

  function chart(){
    var M = cur.months, n = M.length, W = 640, H = 200, L = 40, R = 10, T = 16, B = 34, bw = (W - L - R) / n;
    var vals = M.filter(function(m){ return m.status === 'ok'; }).map(function(m){ return Math.max(m.built_pct, m.new_built_since_baseline_pct || 0); });
    var mx = Math.max.apply(null, vals.concat([5])), top = mx <= 10 ? 10 : mx <= 25 ? 25 : mx <= 50 ? 50 : 100;
    var y = function(v){ return T + (H - T - B) * (1 - v / top); };
    var g = '';
    [0, top / 2, top].forEach(function(v){ g += '<line class="ax" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (L - 5) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + v + '%</text>'; });
    M.forEach(function(m, i){
      var x = L + i * bw;
      if (m.status === 'ok') {
        g += '<rect class="bar' + (m.frame ? '' : ' nf') + '" data-i="' + i + '" x="' + (x + 1).toFixed(1) + '" y="' + y(m.built_pct).toFixed(1) + '" width="' + Math.max(1, bw - 2).toFixed(1) + '" height="' + (y(0) - y(m.built_pct)).toFixed(1) + '"><title>' + esc(ml(m.month) + ': built-up or bare ' + m.built_pct + '%' + (m.new_built_since_baseline_pct != null ? ', new since baseline ' + m.new_built_since_baseline_pct + '%' : '') + ', ' + m.clear_pct + '% clear') + '</title></rect>';
      } else {
        g += '<rect class="cl" x="' + (x + 1).toFixed(1) + '" y="' + (y(0) - 4) + '" width="' + Math.max(1, bw - 2).toFixed(1) + '" height="4"><title>' + esc(ml(m.month) + ': ' + (m.status || 'no data') + (m.clear_pct != null ? ' (' + m.clear_pct + '% clear)' : '')) + '</title></rect>';
      }
      if (/-01$/.test(m.month) || i === 0) g += '<text x="' + (x + 1) + '" y="' + (H - 14) + '">' + m.month.slice(0, 4) + '</text>';
    });
    var pts = M.map(function(m, i){ return m.status === 'ok' && m.new_built_since_baseline_pct != null ? (L + (i + .5) * bw).toFixed(1) + ' ' + y(m.new_built_since_baseline_pct).toFixed(1) : null; }).filter(Boolean);
    if (pts.length > 1) g += '<path class="nl" d="M' + pts.join(' L') + '"/>';
    var desc = 'Monthly share of clear pixels that look built-up or bare in ' + cur.label + '. ' + M.filter(function(m){ return m.status === 'ok'; }).map(function(m){ return ml(m.month) + ' ' + m.built_pct + '%'; }).join(', ');
    $('opchart').innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(desc) + '">' + g + '</svg>';
  }

  $('opchart').addEventListener('click', function(e){ var b = e.target.closest('.bar'); if (b && cur.months[+b.getAttribute('data-i')].frame) { stop(); mi = +b.getAttribute('data-i'); showMonth(); } });
  $('opprev').addEventListener('click', function(){ stop(); step(-1); });
  $('opnext').addEventListener('click', function(){ stop(); step(1); });
  $('opplay').addEventListener('click', function(){
    if (timer) return stop();
    var fr = frameIdx(); if (fr.length < 2) return;
    this.setAttribute('aria-pressed', 'true'); this.setAttribute('aria-label', 'Pause');
    if (fr.indexOf(mi) === fr.length - 1) { mi = fr[0]; showMonth(); }
    timer = setInterval(function(){ step(1); }, (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) ? 2200 : 800);
  });
  $('opimg').addEventListener('error', function(){ this.hidden = true; $('opmcap').textContent = 'Frame not published yet'; });
  document.addEventListener('visibilitychange', function(){ if (document.hidden) stop(); });
})();
