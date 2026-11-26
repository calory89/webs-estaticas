(function(){
  var $ = function(i){ return document.getElementById(i); };
  var fmt = function(n){ return (n || 0).toLocaleString('en'); };
  var MO = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  function day(s){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? (+m[3]) + ' ' + MO[+m[2] - 1] + ' ' + m[1] : ''; }
  addEventListener('beforeprint', function(){ document.querySelectorAll('.sop details').forEach(function(x){ x.open = true; }); });
  var p = $('sopPrint'); if (p) p.addEventListener('click', function(){ window.print(); });
  var c = $('sopCopy');
  if (c) c.addEventListener('click', function(){
    var t = c.getAttribute('data-cite'), msg = $('sopCopyMsg');
    function done(ok){ if (msg) msg.textContent = ok ? 'Copied.' : 'Select the text above to copy it.'; }
    try { navigator.clipboard.writeText(t).then(function(){ done(true); }, function(){ done(false); }); } catch (e) { done(false); }
  });
  if (!window.fetch) return;
  fetch('/data/bali-cases.json?t=' + Math.floor(Date.now() / 6e5)).then(function(r){ if (!r.ok) throw 0; return r.json(); }).then(function(d){
    var C = d.cases || [], db = d.db || {}, cl = db.claims || {}, mk = {}, n6 = 0;
    C.forEach(function(x){ mk[x.market] = 1; });
    var claims = db.claims_total || ((cl.verified || 0) + (cl.unverified || 0) + (cl.contradicted || 0));
    var t = fmt(C.length) + ' projects in ' + fmt(Object.keys(mk).length) + ' markets, ' + fmt(claims) + ' claims tested, ' + fmt(cl.contradicted) + ' contradicted';
    if (db.all_six_public != null) t += ', ' + fmt(db.all_six_public) + ' publish all six with no reported problems';
    var u = day(d.updated || db.updated); if (u) t += '. Database updated ' + u + '.'; else t += '.';
    $('sopLiveT').textContent = t + ' The report above stays fixed at 1 November 2026.';
  }).catch(function(){});
})();
