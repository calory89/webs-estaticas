/* Kolaboro Trust Score badge. Usage: <script src="https://kolaboro.com/badge.js" data-project="your-slug" async></script> */
(function(){
  var s = document.currentScript; if (!s) return; var slug = s.getAttribute('data-project');
  var box = document.createElement('a'); box.target = '_blank'; box.rel = 'noopener';
  box.style.cssText = 'display:inline-flex;align-items:center;gap:10px;font:600 13px/1.2 system-ui,sans-serif;color:#17212B;background:#fff;border:2px solid #17212B;border-radius:12px;padding:8px 12px;text-decoration:none';
  s.parentNode.insertBefore(box, s);
  fetch('https://kolaboro.com/data/projects.json').then(function(r){ return r.json(); }).then(function(d){
    var p = (d.projects || []).filter(function(x){ return x.slug === slug; })[0];
    if (!p) { box.textContent = 'Not yet verified by Kolaboro'; box.href = 'https://kolaboro.com/check'; return; }
    box.href = p.url;
    box.innerHTML = '<b style="font-size:22px">' + p.score + '</b><span>Kolaboro Trust Score<br><span style="font-weight:400;color:#59626B">verified ' + p.verified + '</span></span>';
  }).catch(function(){ box.textContent = 'Kolaboro Trust Score'; box.href = 'https://kolaboro.com/how-we-score'; });
})();
