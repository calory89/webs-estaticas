(function(){
  'use strict';
  function txt(id){ var el = document.getElementById('t-' + id); return el ? el.textContent.replace(/\n?$/, '\n') : ''; }
  function say(id, m){ var el = document.getElementById('m-' + id); if (!el) return; el.textContent = m; clearTimeout(el._t); el._t = setTimeout(function(){ el.textContent = ''; }, 2500); }
  function fallback(t){
    var a = document.createElement('textarea'); a.value = t; a.setAttribute('readonly', ''); a.style.position = 'fixed'; a.style.top = '0'; a.style.opacity = '0';
    document.body.appendChild(a); a.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} a.remove(); return ok;
  }
  document.addEventListener('click', function(e){
    var b = e.target.closest('[data-copy],[data-dl]'); if (!b) return;
    var id = b.getAttribute('data-copy') || b.getAttribute('data-dl'), t = txt(id);
    if (b.hasAttribute('data-copy')) {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function(){ say(id, 'Copied to clipboard.'); }, function(){ say(id, fallback(t) ? 'Copied to clipboard.' : 'Select the text and copy it.'); });
      else say(id, fallback(t) ? 'Copied to clipboard.' : 'Select the text and copy it.');
      if (window.gtag) gtag('event', 'template_copy', { template: id });
    } else {
      var url = URL.createObjectURL(new Blob([t.replace(/\n/g, '\r\n')], { type: 'text/plain;charset=utf-8' }));
      var a = document.createElement('a'); a.href = url; a.download = b.getAttribute('data-file') || (id + '.txt');
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
      say(id, 'Download started.');
      if (window.gtag) gtag('event', 'template_download', { template: id });
    }
  });
})();
