(function(){
  if (!document.getElementById('cRoot')) return;
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function set(id, v){ var e = document.getElementById(id); if (e) e.textContent = v; }
  var LAB = { automated: ['a', 'Automated'], 'manual search form': ['s', 'Form, not automated'], 'browser only': ['u', 'Browser only'], 'no official online register': ['', 'No online register'], 'robots.txt disallows': ['u', 'robots.txt says no'], 'not reachable': ['u', 'Not reachable'] };
  fetch('/data/register-checks.json?t=' + Math.floor(Date.now() / 6e5)).then(function(r){ if (!r.ok) throw 0; return r.json(); }).then(function(d){
    var b = d.summary.by_automation;
    set('c-n', d.summary.registers); set('c-a', b.automated || 0); set('c-f', (b['manual search form'] || 0)); set('c-b', (b['browser only'] || 0) + (b['robots.txt disallows'] || 0) + (b['not reachable'] || 0)); set('c-root', d.archive_root); var vl = document.getElementById('c-ver'); if (vl) vl.href = '/api/kb/stamp?hash=' + d.archive_root; set('c-lines', d.archive_lines); set('c-upd', d.updated);
    document.getElementById('cMethod').innerHTML = d.method.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('');
    document.getElementById('cRegs').innerHTML = d.registers.map(function(r){ var l = LAB[r.automation] || ['', r.automation];
      return '<tr><td>' + esc(r.market) + '</td><td>' + (r.url ? '<a href="' + esc(r.url) + '" rel="noopener" target="_blank">' + esc(r.register) + '</a>' : esc(r.register)) + '</td><td><span class="h-tag ' + l[0] + '">' + esc(l[1]) + '</span>' +
        (r.lookup ? '<div class="h-note">by ' + esc(r.lookup.by) + '</div>' : '') + '</td><td>' + esc(r.result || '') + (r.robots ? '<div class="h-note">robots.txt: ' + esc(r.robots) + '</div>' : '') + '</td><td class="h-code">' + (r.sha256 ? esc(r.probed_at) + '<br>' + esc(r.sha256) : '') + '</td></tr>'; }).join('');
    var ids = Object.keys(d.projects).sort();
    document.getElementById('cProj').innerHTML = ids.map(function(id){ var p = d.projects[id];
      return '<tr><td><a href="/p/?id=' + encodeURIComponent(id) + '">' + esc(id) + '</a></td><td>' + esc(p.market) + '</td><td>' + esc(p.register) + '</td><td>' + esc(p.item) + '</td><td><span class="h-tag ' + (/not/.test(p.status) ? 'u' : 'a') + '">' + esc(p.status) + '</span></td><td>' + esc(p.checked) + '</td></tr>'; }).join('');
  }).catch(function(){ document.getElementById('cRegs').innerHTML = '<tr><td colspan="5">Could not load /data/register-checks.json.</td></tr>'; });
  var f = document.getElementById('cForm');
  f.addEventListener('submit', function(e){
    e.preventDefault(); var o = document.getElementById('cOut'), reg = f.register.value, q = f.q.value.trim();
    if (!q) return; o.innerHTML = '<p class="h-note">Asking the register&hellip;</p>';
    fetch('/api/x/h/lookup?register=' + encodeURIComponent(reg) + '&q=' + encodeURIComponent(q)).then(function(r){ return r.json(); }).then(function(x){
      if (x.error) { o.innerHTML = '<p class="h-claim h-none">' + esc(x.error) + '</p>'; return; }
      var res = x.result || {}, rows = Object.keys(res).filter(function(k){ return k !== 'found'; }).map(function(k){ var v = res[k]; return '<tr><th>' + esc(k.replace(/_/g, ' ')) + '</th><td>' + esc(Array.isArray(v) ? v.join('; ') : v) + '</td></tr>'; }).join('');
      o.innerHTML = '<div class="h-card"><h3>' + esc(x.register_name) + ': ' + esc(x.query) + ' <span class="h-tag ' + (res.found ? 'a' : 'u') + '">' + (res.found ? 'found' : res.found === false ? 'not found' : 'no answer') + '</span></h3>' +
        '<div class="h-tw"><table class="h-t"><tbody>' + rows + '</tbody></table></div>' +
        '<p class="h-note">Fetched ' + esc(x.fetched_at) + ' from <a href="' + esc(x.url) + '" rel="noopener" target="_blank">the register</a>, HTTP ' + x.http_status + ', ' + x.bytes + ' bytes.</p>' +
        '<p class="h-note">SHA-256 of the exact response: <span class="h-code">' + esc(x.sha256) + '</span><br><a href="/api/x/h/archive/' + esc(x.sha256) + '">Archived record</a> &middot; <a href="/api/x/h/archive/' + esc(x.sha256) + '?raw=1">raw bytes</a>. ' + esc(x.archive.durable_note) + '</p></div>';
    }).catch(function(){ o.innerHTML = '<p class="h-claim h-none">The lookup did not complete. Try again in a minute.</p>'; });
  });
})();
