/* Kolaboro field tool: assigned site visits, guided checklist, signed photos (SHA-256 + GPS + time), automatic quality checks, earnings */
(function(){
  var TOKEN = null, D = null, OPEN = null, POS = null, WATCH = null;
  function $(i){ return document.getElementById(i); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function call(a, p){ return KB.rpc('kolaboro_field', { p_token: TOKEN, p_action: a, p_payload: p || {} }); }
  function hex(b){ return [].map.call(new Uint8Array(b), function(x){ return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function b64bytes(u){ var s = atob(u.split(',')[1]), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
  var ST = { assigned: ['New','#2E6BE6'], in_progress: ['In progress','#B7791F'], submitted: ['Sent for review','#6B4FBB'], approved: ['Approved','#1F8A5B'], paid: ['Paid','#1F8A5B'] };

  // sharpness (variance of the Laplacian on a 320 px grey copy) and mean brightness
  function quality(canvas){
    var w = 320, h = Math.round(canvas.height * w / canvas.width), c = document.createElement('canvas'); c.width = w; c.height = h;
    var x = c.getContext('2d'); x.drawImage(canvas, 0, 0, w, h); var d = x.getImageData(0, 0, w, h).data, g = new Float32Array(w * h), sum = 0;
    for (var i = 0; i < w * h; i++){ g[i] = .299 * d[i*4] + .587 * d[i*4+1] + .114 * d[i*4+2]; sum += g[i]; }
    var n = 0, m = 0, m2 = 0;
    for (var yy = 1; yy < h - 1; yy++) for (var xx = 1; xx < w - 1; xx++){ var k = yy * w + xx, l = 4 * g[k] - g[k-1] - g[k+1] - g[k-w] - g[k+w]; n++; var dl = l - m; m += dl / n; m2 += dl * (l - m); }
    return { blur: Math.round(m2 / n), light: Math.round(sum / (w * h)) };
  }
  function prep(file){
    return new Promise(function(res, rej){
      var r = new FileReader(); r.onload = function(){ var im = new Image(); im.onload = function(){ var s = Math.min(1, 1600 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); var q = quality(c), u = c.toDataURL('image/jpeg', .82); res({ url: u, w: c.width, h: c.height, blur: q.blur, light: q.light }); }; im.onerror = rej; im.src = r.result; }; r.onerror = rej; r.readAsDataURL(file);
    });
  }
  function gps(){
    if (!navigator.geolocation) return;
    if (WATCH == null) WATCH = navigator.geolocation.watchPosition(function(p){ POS = p; var g = $('fgps'); if (g) g.innerHTML = '📡 GPS ±' + Math.round(p.coords.accuracy) + ' m' + (p.coords.accuracy > 150 ? ' · wait for a better fix' : ' · ready'); }, function(){ var g = $('fgps'); if (g) g.innerHTML = '⚠ Turn on location for kolaboro.com'; }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 });
  }

  function earnings(){
    var e = D.earnings || {}, q = D.quality || {};
    return '<div class="f-kpis"><div><span>To be paid</span><b>€' + (+e.approved_unpaid || 0) + '</b></div><div><span>In review</span><b>€' + (+e.pending_review || 0) + '</b></div><div><span>Paid so far</span><b>€' + (+e.paid || 0) + '</b></div><div><span>Quality score</span><b>' + (q.score == null ? '—' : q.score + '/100') + '</b></div></div>' +
      (q.score != null ? '<p class="ap-small ap-muted" style="margin:6px 0 0">' + q.photos_ok + ' of ' + q.photos + ' photos accepted' + (q.tasks_submitted ? ' · ' + q.on_time + ' of ' + q.tasks_submitted + ' visits on time · ' + q.approved + ' approved' + (q.returned ? ', ' + q.returned + ' returned' : '') : '') + '. Agents with higher scores get visits first.</p>' : '');
  }
  function list(){
    if (!D.tasks.length) return '<div class="ap-empty">No visits assigned yet. When the team assigns you a visit you get an email and it appears here, with the address, the checklist and the questions to ask.</div>';
    return D.tasks.map(function(t){
      var st = ST[t.status] || [t.status, '#888'], cl = t.checklist || [], done = cl.filter(function(s){ return (t.evidence || []).some(function(e){ return e.step === s.id && e.status === 'accepted'; }); }).length;
      return '<button class="f-task" data-t="' + t.id + '"><span class="f-st" style="background:' + st[1] + '">' + st[0] + '</span><b>Case ' + esc(t.case.code) + (t.case.project ? ' · ' + esc(t.case.project) : '') + '</b><small>' + esc(t.case.location || '') + (t.due ? ' · due ' + new Date(t.due).toLocaleDateString(undefined, { day:'numeric', month:'short' }) : '') + ' · €' + (+t.fee || 0) + '</small><i class="f-bar"><em style="width:' + (cl.length ? done / cl.length * 100 : 0) + '%"></em></i><small>' + done + ' of ' + cl.length + ' steps done</small></button>';
    }).join('');
  }
  function visit(t){
    var cl = t.checklist || [], ev = t.evidence || [], closed = ['submitted','approved','paid'].indexOf(t.status) >= 0, c = t.case;
    var h = '<button class="f-back" id="fback">← All visits</button><h2 style="margin:6px 0 2px">Case ' + esc(c.code) + (c.project ? ' · ' + esc(c.project) : '') + '</h2><p class="ap-small ap-muted" style="margin:0">' + esc([c.developer, c.location].filter(Boolean).join(' · ')) + (c.url ? ' · <a href="' + esc(c.url) + '" target="_blank" rel="noopener">website</a>' : '') + '</p>';
    if (c.lat) h += '<p style="margin:8px 0"><a class="ap-btn x-sm" href="https://www.google.com/maps/dir/?api=1&destination=' + c.lat + ',' + c.lng + '" target="_blank" rel="noopener">🧭 Directions to the plot</a></p>';
    if (t.admin_note) h += '<div class="ap-banner warn">' + esc(t.admin_note) + '</div>';
    if (c.notes) h += '<div class="f-box"><b>What the buyer told us</b><p>' + esc(c.notes) + '</p></div>';
    if (c.questions && c.questions.length) h += '<div class="f-box"><b>Questions to get answered on this visit</b><ol>' + c.questions.map(function(q){ return '<li>' + esc(q.q || q.question || q) + '</li>'; }).join('') + '</ol></div>';
    h += '<p id="fgps" class="f-gps">📡 Waiting for GPS…</p><ol class="f-steps">';
    cl.forEach(function(s, i){
      var mine = ev.filter(function(e){ return e.step === s.id; }), ok = mine.filter(function(e){ return e.status === 'accepted'; }).length, last = mine[mine.length - 1];
      h += '<li class="' + (ok ? 'ok' : '') + '"><div class="f-sh"><span class="f-n">' + (ok ? '✓' : i + 1) + '</span><div><b>' + esc(s.title) + '</b><small>' + esc(s.tip) + '</small></div></div>';
      if (last && last.status === 'rejected') h += '<p class="f-rej">✗ Last photo rejected: ' + esc(last.reason) + '</p>';
      if (ok) h += '<p class="f-okm">' + ok + (s.kind === 'note' ? ' note' : ' photo') + (ok > 1 ? 's' : '') + ' saved and sealed' + (s.kind === 'note' && last && last.text ? ': “' + esc(last.text.slice(0, 120)) + '”' : '') + '</p>';
      if (!closed) h += s.kind === 'note'
        ? '<div class="f-note"><textarea data-n="' + s.id + '" rows="3" placeholder="Write what they said…"></textarea><button class="ap-btn x-sm" data-ns="' + s.id + '">Save note</button></div>'
        : '<label class="ap-btn x-sm f-cam"><input type="file" accept="image/*" capture="environment" data-p="' + s.id + '">📷 ' + (ok ? 'Add another photo' : 'Take photo') + '</label>';
      h += '</li>';
    });
    h += '</ol>';
    if (!closed) h += '<label class="ap-small" style="display:block;margin:10px 0 4px"><b>Anything else the buyer should know?</b></label><textarea id="fnote" rows="3" style="width:100%"></textarea><button class="ap-btn" id="fsub" style="margin-top:8px">Send the visit for review</button><p class="cp-err" id="ferr"></p>';
    else h += '<div class="ap-banner ok">' + (ST[t.status] || [t.status])[0] + '. ' + (t.status === 'submitted' ? 'The team reviews it within one working day.' : '') + '</div>';
    return h;
  }
  function render(){
    var box = $('visits'); if (!box) return;
    var t = OPEN && D.tasks.filter(function(x){ return x.id === OPEN; })[0];
    box.innerHTML = '<h2>Site visits</h2>' + earnings() + '<div style="margin-top:12px">' + (t ? visit(t) : list()) + '</div>';
    box.querySelectorAll('[data-t]').forEach(function(b){ b.onclick = function(){ OPEN = +b.dataset.t; if (window.history) history.replaceState(null, '', '#visits'); render(); box.scrollIntoView(); gps(); var tt = D.tasks.filter(function(x){ return x.id === OPEN; })[0]; if (tt && tt.status === 'assigned') call('start', { task_id: OPEN }); }; });
    if ($('fback')) $('fback').onclick = function(){ OPEN = null; render(); };
    if (t) {
      gps(); if (POS) $('fgps').innerHTML = '📡 GPS ±' + Math.round(POS.coords.accuracy) + ' m';
      box.querySelectorAll('[data-p]').forEach(function(inp){ inp.onchange = function(){ if (this.files[0]) photo(t, inp.dataset.p, this.files[0], inp.parentNode); }; });
      box.querySelectorAll('[data-ns]').forEach(function(b){ b.onclick = function(){ var ta = box.querySelector('[data-n="' + b.dataset.ns + '"]'); if (ta.value.trim().length < 5) return KB.toast('Write a bit more'); b.disabled = true; var p = POS ? POS.coords : {}; call('note', { task_id: t.id, step: b.dataset.ns, text: ta.value.trim(), lat: p.latitude, lng: p.longitude, acc: p.accuracy, taken_at: new Date().toISOString() }).then(after); }; });
      if ($('fsub')) $('fsub').onclick = function(){ this.disabled = true; call('submit', { task_id: t.id, note: $('fnote').value }).then(function(d){ if (d.error === 'missing') { $('fsub').disabled = false; $('ferr').textContent = 'Still missing: ' + d.missing.join(', '); return; } after(d); KB.toast('Sent for review'); }); };
    }
  }
  function after(d){ if (d.error) { KB.toast(d.error === 'closed' ? 'This visit is already sent' : 'Could not save: ' + d.error); return; } D = d; render(); if (d.last) KB.toast(d.last.status === 'accepted' ? 'Saved and sealed ✓' : 'Rejected: ' + d.last.reason); }
  function photo(t, step, file, label){
    var old = label.innerHTML; label.classList.add('busy'); label.firstChild && (label.lastChild.textContent = ' Checking…');
    var taken = new Date().toISOString();
    prep(file).then(function(p){
      return crypto.subtle.digest('SHA-256', b64bytes(p.url)).then(function(h){
        var c = POS ? POS.coords : {}, age = POS ? (Date.now() - POS.timestamp) / 1000 : null;
        return call('photo', { task_id: t.id, step: step, file: p.url, sha256: hex(h), lat: c.latitude, lng: c.longitude, acc: age != null && age < 120 ? c.accuracy : (c.accuracy ? c.accuracy + 500 : null), taken_at: (file.lastModified && Math.abs(Date.now() - file.lastModified) < 20 * 60000) ? new Date(file.lastModified).toISOString() : taken, blur: p.blur, light: p.light, w: p.w, h: p.h, device: navigator.userAgent.slice(0, 110) });
      });
    }).then(after).catch(function(e){ label.innerHTML = old; KB.toast('Could not upload: ' + (e.message || e)); });
  }
  window.KBF = function(token, app){
    TOKEN = token;
    call('tasks').then(function(d){
      if (d.error) return; D = d;
      if (!d.tasks.length && !(d.quality && d.quality.score != null)) { var cur = $('visits'); if (cur) cur.remove(); return; }
      var s = $('visits'); if (!s) { s = document.createElement('section'); s.className = 'ap-card'; s.id = 'visits'; var col = app.querySelector('.ap-col'); col.insertBefore(s, col.children[1] || null); }
      if (location.hash === '#visits' && !OPEN && d.tasks.length === 1) OPEN = d.tasks[0].id;
      render(); if (location.hash === '#visits') s.scrollIntoView();
    });
  };
})();
