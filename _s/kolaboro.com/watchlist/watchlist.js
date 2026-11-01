/* Kolaboro watchlist page: lists projects saved with KBWatch and what changed since each snapshot. */
(function(){
  var W = window.KBWatch, $ = function(i){ return document.getElementById(i); };
  var listEl = $('wllist'), emptyEl = $('wlempty'), bar = $('wlbar'), msg = $('wlmsg');
  var BY = null, loadFailed = false;
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function stage(s){ return s === 'under construction' ? 'Under construction' : s === 'completed' ? 'Completed, still selling' : s === 'off-plan' ? 'Off-plan' : 'Stage not stated'; }
  function place(c){ return c.region && c.region !== c.market ? c.region + ', ' + c.market : c.market; }
  function pl(n, w){ return n + ' ' + w + (n === 1 ? '' : 's'); }
  function num(x){ return +(+x || 0).toFixed(1); }
  function say(t){ msg.textContent = t; }
  if (!W) { listEl.innerHTML = '<p>Your browser blocked the watchlist script. Try reloading the page.</p>'; return; }

  /* Each change: [kind 'up'|'down'|'info', text] */
  function changes(c, s){
    var out = [];
    if (!s) return out;
    var cl = c.claims || {}, sc = s.claims || {};
    if ((c.score || 0) !== (s.score || 0)) out.push([(c.score || 0) > (s.score || 0) ? 'up' : 'down', 'Published by the developer ' + ((c.score || 0) > (s.score || 0) ? 'up' : 'down') + ' from ' + (s.score || 0) + ' to ' + (c.score || 0) + ' of ' + (c.max || 6)]);
    if ((c.vscore || 0) !== (s.vscore || 0)) out.push([(c.vscore || 0) > (s.vscore || 0) ? 'up' : 'down', 'Confirmed by a registry or independent source ' + ((c.vscore || 0) > (s.vscore || 0) ? 'up' : 'down') + ' from ' + (s.vscore || 0) + ' to ' + (c.vscore || 0) + ' of 6']);
    if ((c.stage || null) !== (s.stage || null)) out.push(['info', 'Stage changed from ' + stage(s.stage).replace('Stage not stated', 'not stated') + ' to ' + stage(c.stage).replace('Stage not stated', 'not stated')]);
    var od = num(c.overdue) - num(s.overdue);
    if (od > 0) out.push(['down', pl(num(od), 'more month') + ' past the promised handover (now ' + num(c.overdue) + ')']);
    else if (od < 0 && !num(c.overdue)) out.push(['up', 'No longer listed as past the promised handover']);
    var cd = (cl.contradicted || 0) - (sc.contradicted || 0);
    if (cd > 0) out.push(['down', pl(cd, 'new contradicted claim') + ' (now ' + (cl.contradicted || 0) + ')']);
    var tested = (cl.verified || 0) + (cl.unverified || 0) + (cl.contradicted || 0), was = (sc.verified || 0) + (sc.unverified || 0) + (sc.contradicted || 0);
    if (tested > was && cd <= 0) out.push(['info', pl(tested - was, 'more claim') + ' tested (now ' + tested + ')']);
    var hd = (c.history || []).length - (s.history || 0);
    if (hd > 0) out.push(['info', pl(hd, 'new change') + ' recorded on the developer\'s page']);
    var fd = (c.flags || []).length - (s.flags || 0);
    if (fd > 0) out.push(['down', pl(fd, 'new problem') + ' in public reports']);
    else if (fd < 0) out.push(['up', pl(-fd, 'problem') + ' fewer in public reports']);
    return out;
  }

  function card(it){
    var c = BY && BY[it.id], s = it.snap, saved = (s && s.date) || it.added || 'an earlier date';
    var head = '<div class="wl-h"><a class="wl-id" href="/p/?id=' + encodeURIComponent(it.id) + '">' + esc(it.id) + '</a>';
    var rm = '<button type="button" class="btn btn-line btn-sm wl-rm" data-rm="' + esc(it.id) + '" aria-label="Remove ' + esc(it.id) + ' from your watchlist">Remove</button>';
    if (!BY) return '<article class="wl-card">' + head + '</div><p class="wl-meta">Loading the latest data. Saved ' + esc(saved) + '.</p><div class="wl-b">' + rm + '</div></article>';
    if (!c) {
      return '<article class="wl-card gone">' + head + '<span class="wl-tag">' + (loadFailed ? 'Not loaded' : 'Not found') + '</span></div>' +
        '<p class="wl-meta">' + (loadFailed ? 'We could not load the database just now. Your saved project is safe; try again in a moment.' : 'This project is no longer in the database. It may have been merged or removed after a correction.') + ' Saved ' + esc(saved) + '.</p><div class="wl-b">' + rm + '</div></article>';
    }
    var ch = changes(c, s), fl = (c.flags || []).length;
    var body = !s ? '<p class="wl-none">Saved without a snapshot, so we cannot show changes yet. Press "Mark as seen" to start tracking from today.</p>'
      : ch.length ? '<ul class="wl-ch">' + ch.map(function(x){ return '<li class="' + x[0] + '"><i aria-hidden="true">' + (x[0] === 'up' ? '&uarr;' : x[0] === 'down' ? '&darr;' : '&bull;') + '</i><span>' + esc(x[1]) + '</span></li>'; }).join('') + '</ul>'
      : '<p class="wl-none">No changes since you saved it on ' + esc(saved) + '.</p>';
    return '<article class="wl-card' + (ch.length ? ' changed' : '') + '">' + head + (ch.length ? '<span class="wl-tag hot">' + pl(ch.length, 'change') + '</span>' : '') + '</div>' +
      '<p class="wl-meta">' + esc(stage(c.stage)) + ', ' + esc(place(c)) + ', ' + esc(c.country) + '. Saved ' + esc(saved) + '.</p>' +
      '<div class="wl-s"><span><b>' + (c.score || 0) + '/' + (c.max || 6) + '</b>published</span><span><b>' + (c.vscore || 0) + '/6</b>confirmed</span><span><b>' + fl + '</b>' + (fl === 1 ? 'problem' : 'problems') + '</span>' + (c.overdue ? '<span><b>' + num(c.overdue) + '</b>months overdue</span>' : '') + '</div>' +
      body +
      '<div class="wl-b"><a class="btn btn-line btn-sm" href="/p/?id=' + encodeURIComponent(c.id) + '">Open project file</a>' +
      (ch.length || !s ? '<button type="button" class="btn btn-line btn-sm" data-seen="' + esc(c.id) + '" aria-label="Mark ' + esc(c.id) + ' as seen and start tracking from today">Mark as seen</button>' : '') + rm + '</div></article>';
  }

  function draw(){
    var L = W.list();
    listEl.setAttribute('aria-busy', 'false');
    if (!L.length) { listEl.innerHTML = ''; listEl.hidden = true; emptyEl.hidden = false; bar.hidden = true; return; }
    listEl.hidden = false; emptyEl.hidden = true; bar.hidden = false;
    var withCh = L.map(function(it){ var c = BY && BY[it.id]; return { it: it, n: c ? changes(c, it.snap).length : 0 }; });
    withCh.sort(function(a, b){ return b.n - a.n; });
    var nCh = withCh.filter(function(x){ return x.n; }).length;
    $('wlcount').innerHTML = '<b>' + pl(L.length, 'saved project') + '</b>' + (BY ? (nCh ? ', ' + nCh + ' with changes since you saved ' + (nCh === 1 ? 'it' : 'them') + '.' : ', no changes since you saved them.') : '.');
    var ids = L.filter(function(it){ return BY && BY[it.id]; }).map(function(it){ return it.id; }).slice(0, 4), cmp = $('wlcmp');
    cmp.hidden = ids.length < 2;
    cmp.href = '/compare/?ids=' + ids.map(encodeURIComponent).join(',');
    cmp.textContent = L.length > 4 && ids.length === 4 ? 'Compare the first 4' : 'Compare these';
    listEl.innerHTML = withCh.map(function(x){ return card(x.it); }).join('');
  }

  listEl.addEventListener('click', function(e){
    var b = e.target.closest('button'); if (!b) return;
    var rm = b.getAttribute('data-rm'), seen = b.getAttribute('data-seen');
    if (rm) { W.remove(rm); say(rm + ' removed from your watchlist.'); draw(); }
    if (seen && BY && BY[seen]) {
      var L = W.list(); L.forEach(function(it){ if (it.id === seen) it.snap = W.snap(BY[seen]); });
      W.save(L); say(seen + ' marked as seen. Changes are tracked from today.'); draw();
    }
  });

  function today(){ var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  $('wlexp').addEventListener('click', function(){
    var data = JSON.stringify({ type: 'kolaboro-watchlist', version: 1, exported: today(), items: W.list() }, null, 1);
    try {
      var a = document.createElement('a'), u = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
      a.href = u; a.download = 'kolaboro-watchlist-' + today() + '.json'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){ URL.revokeObjectURL(u); }, 1000);
      say('Exported ' + pl(W.list().length, 'project') + ' to a JSON file.');
    } catch (e) { say('Your browser blocked the download.'); }
  });
  function onFile(e){
    var f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f) return;
    if (f.size > 200000) { say('That file is too large to be a watchlist.'); return; }
    var r = new FileReader();
    r.onload = function(){
      var d; try { d = JSON.parse(r.result); } catch (x) { say('That file is not valid JSON.'); return; }
      var items = Array.isArray(d) ? d : d && Array.isArray(d.items) ? d.items : null;
      if (!items) { say('That file is not a Kolaboro watchlist.'); return; }
      var L = W.list(), have = {}, added = 0; L.forEach(function(it){ have[it.id] = 1; });
      items.forEach(function(x){ if (typeof x === 'string') x = { id: x }; var id = x && String(x.id || '').trim().toUpperCase(); if (id && !have[id]) { have[id] = 1; L.push(x); added++; } });
      var before = W.list().length; W.save(L); var n = W.list().length - before;
      say(n ? 'Imported ' + pl(n, 'project') + '.' : added ? 'No valid project ids found in that file.' : 'Every project in that file was already saved.');
      draw();
    };
    r.onerror = function(){ say('Could not read that file.'); };
    r.readAsText(f);
  }
  $('wlfile').addEventListener('change', onFile);
  $('wlfile2').addEventListener('change', onFile);

  draw();
  fetch('/data/bali-cases.json?t=' + Math.floor(Date.now() / 6e5)).then(function(r){ if (!r.ok) throw new Error('http'); return r.json(); })
    .then(function(d){ BY = {}; (d.cases || []).forEach(function(c){ BY[String(c.id).toUpperCase()] = c; }); draw(); })
    .catch(function(){ loadFailed = true; BY = {}; draw(); say('We could not load the latest data, so changes cannot be shown right now.'); });
})();
