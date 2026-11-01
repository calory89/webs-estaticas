(function(){
  'use strict';
  var $ = function(i){ return document.getElementById(i); };
  var fmt = function(n){ return (n || 0).toLocaleString('en'); };
  var KEYS = ['permit', 'escrow', 'progress', 'plans', 'record', 'returns_ok'];
  var LV = [['registry', 'Registry', '#17212B'], ['independent', 'Independent', '#1E8A5A'], ['developer', 'Developer only', '#B9B4A8'], ['contradicted', 'Contradicted', '#C9461A'], ['none', 'None', '#D9D5CB']];

  // Publication rules of the standard: permit only with a number (2), escrow only when true, progress whenever it has a value.
  function pub(c, k){
    var x = c.checks || {};
    if (k === 'permit') return x.permit === 2;
    if (k === 'escrow') return x.escrow === true;
    if (k === 'progress') return x.progress !== null && x.progress !== undefined && x.progress !== '';
    return !!x[k];
  }
  function fmtDate(s){
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); if (!m) return s || '';
    var mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m[2] - 1];
    return (+m[3]) + ' ' + mo + ' ' + m[1];
  }

  fetch('/data/bali-cases.json?t=' + Math.floor(Date.now() / 6e5)).then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); }).then(function(d){
    var C = (d && d.cases) || [], n = C.length;
    if (!n) return;
    $('n-tracked').textContent = fmt(n);
    var all6 = C.filter(function(c){ return KEYS.every(function(k){ return pub(c, k); }); }).length;
    $('n-all6').textContent = fmt(all6);
    $('n-upd').textContent = fmtDate(d.updated || (d.db && d.db.updated));
    KEYS.forEach(function(k){
      var yes = C.filter(function(c){ return pub(c, k); }).length, p = Math.round(yes / n * 100) + '%';
      document.querySelectorAll('[data-stat="' + k + '"]').forEach(function(el){ el.textContent = p; });
      document.querySelectorAll('[data-statn="' + k + '"]').forEach(function(el){ el.textContent = fmt(yes) + ' of ' + fmt(n); });
      var bar = document.querySelector('[data-vbar="' + k + '"]'); if (!bar) return;
      var cnt = {}, tot = 0;
      C.forEach(function(c){ var v = (c.verified || {})[k]; if (!v) return; cnt[v] = (cnt[v] || 0) + 1; tot++; });
      if (!tot) { bar.hidden = true; return; }
      bar.innerHTML = LV.map(function(l){ var v = cnt[l[0]] || 0; return v ? '<i style="width:' + (v / tot * 100) + '%;background:' + l[2] + '" title="' + l[1] + ': ' + v + '"></i>' : ''; }).join('');
      bar.setAttribute('aria-label', 'Verification levels for this item: ' + LV.map(function(l){ return l[1] + ' ' + (cnt[l[0]] || 0); }).join(', '));
      var leg = document.createElement('p'); leg.className = 'vleg';
      leg.innerHTML = LV.filter(function(l){ return cnt[l[0]]; }).map(function(l){ return '<span style="--c:' + l[2] + '">' + l[1] + ' ' + Math.round(cnt[l[0]] / tot * 100) + '%</span>'; }).join('');
      bar.parentNode.insertBefore(leg, bar.nextSibling);
    });
  }).catch(function(){
    document.querySelectorAll('[data-stat],[data-statn],#n-tracked,#n-all6,#n-upd').forEach(function(el){ el.textContent = 'n/a'; });
  });

  // Self-assessment checklist
  var f = $('ckf'), SK = 'kb-std-v1';
  if (f) {
    var boxes = f.querySelectorAll('input[type=checkbox]');
    var saved = null; try { saved = JSON.parse(localStorage.getItem(SK) || 'null'); } catch (e) {}
    if (saved) boxes.forEach(function(b){ b.checked = !!saved[b.name]; });
    var upd = function(){
      var s = 0, st = {}, core = 0;
      boxes.forEach(function(b){ if (b.checked) { s += parseFloat(b.dataset.pts); st[b.name] = 1; if (b.name.charAt(0) === 'D') core++; } });
      s = Math.round(s * 2) / 2;
      $('ckscore').textContent = (s % 1 ? s.toFixed(1) : s);
      $('ckbar').style.width = s + '%';
      var msg = s === 0 ? 'Tick what you publish today.' : core === 6 ? (s === 100 ? 'You publish everything in the standard.' : 'All six core items: your project meets the standard. The recommended items add the rest.') : 'Core items published: ' + core + ' of 6. A project meets the standard when all six are public.';
      $('ckmsg').textContent = msg;
      try { localStorage.setItem(SK, JSON.stringify(st)); } catch (e) {}
    };
    f.addEventListener('change', upd); upd();
    $('ckreset').addEventListener('click', function(){ boxes.forEach(function(b){ b.checked = false; }); upd(); });
    $('ckprint').addEventListener('click', function(){
      document.body.classList.add('pc');
      var off = function(){ document.body.classList.remove('pc'); window.removeEventListener('afterprint', off); };
      window.addEventListener('afterprint', off);
      window.print();
      setTimeout(off, 1500);
    });
  }

  // Citation copy
  var cb = $('citecopy');
  if (cb) cb.addEventListener('click', function(){
    var t = $('citetxt').textContent, m = $('citemsg');
    var done = function(){ m.textContent = 'Copied.'; setTimeout(function(){ m.textContent = ''; }, 2500); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function(){ fallback(t); done(); });
    else { fallback(t); done(); }
  });
  function fallback(t){ var a = document.createElement('textarea'); a.value = t; a.setAttribute('readonly', ''); a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} a.remove(); }

  // Open "How Kolaboro checks it" when printing the whole page
  window.addEventListener('beforeprint', function(){ if (!document.body.classList.contains('pc')) document.querySelectorAll('details.chk').forEach(function(x){ x.dataset.wasOpen = x.open ? '1' : ''; x.open = true; }); });
  window.addEventListener('afterprint', function(){ document.querySelectorAll('details.chk').forEach(function(x){ if (x.dataset.wasOpen !== undefined) { x.open = x.dataset.wasOpen === '1'; delete x.dataset.wasOpen; } }); });
})();
