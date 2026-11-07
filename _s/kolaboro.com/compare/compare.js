/* Kolaboro compare: /compare/?ids=A,B,C. Puts 2 to 4 projects side by side from /data/bali-cases.json */
(function(){
  var CK = [['permit', 'Permit or licence number'], ['escrow', 'Deposit protection'], ['progress', 'Construction progress'], ['plans', 'Site or floor plans'], ['record', 'Developer track record'], ['returns_ok', 'No guaranteed returns']];
  var LV = { registry: ['Registry', 4], independent: ['Confirmed', 3], developer: ['Not confirmed', 2], none: ['No source', 1], contradicted: ['Contradicted', 0] };
  var MAX = 4, C = [], BY = {}, ids = [];
  var $ = function(i){ return document.getElementById(i); }, box = $('cp'), qi = $('cp-q'), res = $('cp-res');
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pub(c, k){ var x = c.checks || {}, v = x[k]; if (k === 'permit') return v === 2 ? 'y' : v === 1 ? 'p' : 'n'; if (k === 'escrow') return v === true ? 'y' : 'n'; if (k === 'progress') return v != null ? 'y' : 'n'; return v ? 'y' : 'n'; }
  function stage(s){ return s === 'under construction' ? 'Under construction' : s === 'completed' ? 'Completed, still selling' : s === 'off-plan' ? 'Off-plan' : 'Not stated'; }
  function title(c){ if (!c.title) return 'Not stated'; var t = String(c.title).replace(/_/g, ' '); t = t.charAt(0).toUpperCase() + t.slice(1); return c.lease ? t + ', ' + c.lease + ' yrs' : t; }
  function place(c){ return c.region && c.region !== c.market ? c.region + ', ' + c.market : c.market; }
  function lvl(c, k){ var l = (c.verified || {})[k]; return LV[l] ? l : 'none'; }
  function cl(c){ var x = c.claims || {}; return { v: x.verified || 0, u: x.unverified || 0, x: x.contradicted || 0 }; }
  function num(x){ return +(+x).toFixed(1); }

  function readIds(){
    var s = ''; try { s = new URLSearchParams(location.search).get('ids') || ''; } catch (e) {}
    var seen = {}; return s.split(',').map(function(x){ return x.trim().toUpperCase(); }).filter(function(x){ if (!x || seen[x]) return false; seen[x] = 1; return true; }).slice(0, MAX);
  }
  function writeIds(){
    var u = location.pathname + (ids.length ? '?ids=' + ids.map(encodeURIComponent).join(',') : '');
    try { history.replaceState(null, '', u); } catch (e) {}
    var pr = ids.map(function(i){ return BY[i]; }).filter(Boolean);
    document.title = pr.length ? 'Compare ' + pr.map(function(c){ return c.id; }).join(', ') + ' | Kolaboro' : 'Compare off-plan projects side by side | Kolaboro';
  }

  // Each row: label, cell html, numeric value for "best" (higher is better) or null for no highlight
  function rows(){
    var R = [
      ['g', 'The project'],
      ['Market', function(c){ return esc(c.market) + '<br><small class="muted">' + esc(c.country) + '</small>'; }, null],
      ['Stage', function(c){ return esc(stage(c.stage)); }, null],
      ['Price band', function(c){ return esc(c.band || 'Not stated'); }, null],
      ['Completion', function(c){ return c.done ? esc(c.done) : 'No date published'; }, null],
      ['Title', function(c){ return esc(title(c)); }, null],
      ['g', 'Six checks: published and verification level']
    ];
    CK.forEach(function(k){
      R.push([k[1], function(c){ var p = pub(c, k[0]), l = lvl(c, k[0]); return '<span class="cp-pub ' + p + '">' + (p === 'y' ? '✓ Yes' : p === 'p' ? '~ Claimed' : '✗ No') + '</span> <span class="lv ' + l + '">' + LV[l][0] + '</span>'; },
        function(c){ var p = pub(c, k[0]); return (p === 'y' ? 10 : p === 'p' ? 5 : 0) + LV[lvl(c, k[0])][1]; }]);
    });
    R.push(['g', 'Result']);
    R.push(['Published (score)', function(c){ return '<span class="cp-big">' + (c.score || 0) + '</span> / ' + (c.max || 6); }, function(c){ return (c.score || 0) / (c.max || 6); }]);
    R.push(['Confirmed (vscore)', function(c){ return '<span class="cp-big">' + (c.vscore || 0) + '</span> / 6'; }, function(c){ return c.vscore || 0; }]);
    R.push(['Claims tested', function(c){ var x = cl(c); return x.v + ' verified<br>' + x.u + ' unverified<br>' + (x.x ? '<b style="color:#9A2A14">' + x.x + ' contradicted</b>' : '0 contradicted'); }, function(c){ var x = cl(c), t = x.v + x.u + x.x; return t ? (x.v - 2 * x.x) / t : 0; }]);
    R.push(['Delay to handover', function(c){ return c.delay ? num(c.delay) + ' month' + (num(c.delay) === 1 ? '' : 's') : 'None reported'; }, function(c){ return -(c.delay || 0); }]);
    R.push(['Problems in public reports', function(c){ var n = (c.flags || []).length; return n ? '<b style="color:#9A2A14">' + n + '</b>' : '0'; }, function(c){ return -(c.flags || []).length; }]);
    return R;
  }

  function table(P){
    var head = '<tr><th scope="col"><span class="sr-only">Project</span></th>' + P.map(function(c){
      return '<th scope="col" class="cp-h"><a href="/p/?id=' + encodeURIComponent(c.id) + '">' + esc(c.id) + '</a><small>' + esc(place(c)) + '</small><button type="button" class="cp-x" data-rm="' + esc(c.id) + '" aria-label="Remove ' + esc(c.id) + ' from the comparison">Remove</button></th>';
    }).join('') + '</tr>';
    var body = rows().map(function(r){
      if (r[0] === 'g') return '<tr class="g"><th scope="rowgroup" colspan="1">' + esc(r[1]) + '</th>' + P.map(function(){ return '<td></td>'; }).join('') + '</tr>';
      var best = -1, vals = null;
      if (r[2] && P.length > 1) {
        vals = P.map(r[2]); var mx = Math.max.apply(null, vals), mn = Math.min.apply(null, vals);
        if (mx !== mn) best = mx;
      }
      return '<tr><th scope="row">' + esc(r[0]) + '</th>' + P.map(function(c, i){ var b = vals && best !== -1 && vals[i] === best; return '<td' + (b ? ' class="best"' : '') + '>' + r[1](c) + (b ? '<span class="sr-only"> (best in this row)</span>' : '') + '</td>'; }).join('') + '</tr>';
    }).join('');
    return '<p class="cp-swipe">Swipe the table sideways to see every project.</p><div class="cp-tw" tabindex="0" role="region" aria-label="Comparison table"><table class="cp-t"><caption class="sr-only">Side by side comparison of ' + P.length + ' projects</caption><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>';
  }

  function strongWeak(){
    var nf = function(c){ return !(c.flags || []).length && !cl(c).x; };
    var strong = C.filter(nf).sort(function(a, b){ return (b.vscore || 0) - (a.vscore || 0) || (b.score || 0) - (a.score || 0) || (a.id < b.id ? -1 : 1); }).slice(0, 3);
    var weak = C.filter(function(c){ return (c.flags || []).length || cl(c).x; }).sort(function(a, b){ return ((b.flags || []).length + cl(b).x) - ((a.flags || []).length + cl(a).x) || (a.score || 0) - (b.score || 0) || (a.id < b.id ? -1 : 1); }).slice(0, 3);
    return [strong, weak];
  }
  function setCard(t, s, L, one){
    if (one) L = L.filter(function(c){ return c.id !== one.id; }).slice(0, 3);
    if (!L.length) return '';
    var set = (one ? [one] : []).concat(L).slice(0, MAX);
    return '<div class="cp-set"><h3>' + t + '</h3><p>' + s + '</p><ul>' + L.map(function(c){ return '<li><a href="/p/?id=' + encodeURIComponent(c.id) + '"><b>' + esc(c.id) + '</b><small>' + esc(c.market) + ', ' + (c.score || 0) + '/6 published, ' + (c.vscore || 0) + '/6 confirmed, ' + (c.flags || []).length + ' problems</small></a></li>'; }).join('') +
      '</ul><a class="btn btn-line" href="?ids=' + set.map(function(c){ return encodeURIComponent(c.id); }).join(',') + '" data-set="' + set.map(function(c){ return esc(c.id); }).join(',') + '">' + (one ? 'Compare ' + esc(one.id) + ' with these' : 'Compare these three') + '</a></div>';
  }

  function render(){
    var P = ids.map(function(i){ return BY[i]; }).filter(Boolean), miss = ids.filter(function(i){ return !BY[i]; });
    writeIds();
    var sw = strongWeak(), html = '';
    if (miss.length) html += '<p class="cp-note" role="status">Not found: ' + miss.map(esc).join(', ') + '. Check the id or search above.</p>';
    if (P.length >= 2) {
      html += table(P);
      html += '<div class="cp-act">' + (P.length < MAX ? '<button type="button" class="btn btn-line" data-focus>Add another project</button>' : '') + '<a class="btn btn-hi" href="/check">Check your own project</a><a class="btn btn-line" href="/cases">Browse all projects</a></div>';
      html += '<p class="cp-note">Published: the developer says it in public. Verification level: the strongest source we found. Registry means an official register; Confirmed means an independent source such as a regulator, court or major newspaper; Not confirmed means only the developer or its agents say so. Best is computed per row from these data only. <a href="/how-we-score">How we score</a>.</p>';
    } else {
      var one = P[0];
      html += '<div class="cp-empty"><h2>' + (one ? 'Add at least one more project' : 'Pick projects to compare') + '</h2>' +
        (one ? '<p class="cp-chip"><a href="/p/?id=' + encodeURIComponent(one.id) + '"><b>' + esc(one.id) + '</b> ' + esc(place(one)) + ', ' + (one.score || 0) + '/6 published, ' + (one.vscore || 0) + '/6 confirmed</a><button type="button" class="cp-x" data-rm="' + esc(one.id) + '" aria-label="Remove ' + esc(one.id) + ' from the comparison">Remove</button></p>' : '') +
        '<p class="sub">' + (one ? 'Search above by id or market, or add one of these sets.' : 'Search above by id or market, or start from three projects with strong public evidence and three with problems in public reports.') + '</p>' +
        '<div class="cp-sets">' + setCard('Strong public evidence', 'Most checks confirmed by a registry or independent source, no problems found.', sw[0], one) + setCard('Problems found', 'Problems in public reports or claims contradicted by another source.', sw[1], one) + '</div></div>';
    }
    box.innerHTML = html;
  }

  function search(q){
    q = q.trim().toLowerCase();
    if (!q) { res.hidden = true; res.innerHTML = ''; qi.setAttribute('aria-expanded', 'false'); return; }
    var L = C.filter(function(c){ return ids.indexOf(c.id) < 0 && (c.id.toLowerCase().indexOf(q) >= 0 || String(c.market).toLowerCase().indexOf(q) >= 0 || String(c.country).toLowerCase().indexOf(q) >= 0); })
      .sort(function(a, b){ var ai = a.id.toLowerCase().indexOf(q) === 0 ? 0 : 1, bi = b.id.toLowerCase().indexOf(q) === 0 ? 0 : 1; return ai - bi || (a.id < b.id ? -1 : 1); }).slice(0, 8);
    res.innerHTML = ids.length >= MAX ? '<li class="e">You already have 4 projects. Remove one to add another.</li>' : L.length ? L.map(function(c){ return '<li><button type="button" data-add="' + esc(c.id) + '"><b>' + esc(c.id) + '</b><small>' + esc(place(c)) + ', ' + (c.score || 0) + '/6, ' + (c.vscore || 0) + '/6 confirmed</small></button></li>'; }).join('') : '<li class="e">No project matches. Try an id like BALI-014 or a market like Dubai.</li>';
    res.hidden = false; qi.setAttribute('aria-expanded', 'true');
  }

  function add(id){ if (ids.length >= MAX || ids.indexOf(id) >= 0) return; ids.push(id); qi.value = ''; search(''); render(); }

  qi.addEventListener('input', function(){ search(qi.value); });
  qi.addEventListener('keydown', function(e){
    if (e.key === 'Enter') { e.preventDefault(); var v = qi.value.trim().toUpperCase(); if (BY[v]) return add(v); var f = res.querySelector('[data-add]'); if (f) add(f.getAttribute('data-add')); }
    if (e.key === 'ArrowDown') { var b = res.querySelector('button'); if (b) { e.preventDefault(); b.focus(); } }
    if (e.key === 'Escape') search('');
  });
  res.addEventListener('keydown', function(e){
    var bs = [].slice.call(res.querySelectorAll('button')), i = bs.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' && i < bs.length - 1) { e.preventDefault(); bs[i + 1].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); (i > 0 ? bs[i - 1] : qi).focus(); }
    if (e.key === 'Escape') { search(''); qi.focus(); }
  });
  res.addEventListener('click', function(e){ var b = e.target.closest('[data-add]'); if (b) { add(b.getAttribute('data-add')); qi.focus(); } });
  document.addEventListener('click', function(e){ if (!e.target.closest('.cp-add')) { res.hidden = true; qi.setAttribute('aria-expanded', 'false'); } });
  box.addEventListener('click', function(e){
    var r = e.target.closest('[data-rm]'); if (r) { var id = r.getAttribute('data-rm'); ids = ids.filter(function(x){ return x !== id; }); render(); if (!matchMedia('(pointer: coarse)').matches) qi.focus(); return; }
    var s = e.target.closest('[data-set]'); if (s) { e.preventDefault(); ids = s.getAttribute('data-set').split(','); render(); box.scrollIntoView({ block: 'start' }); return; }
    if (e.target.closest('[data-focus]')) qi.focus();
  });

  ids = readIds();
  fetch('/data/bali-cases.json?t=' + Math.floor(Date.now() / 6e5)).then(function(r){ if (!r.ok) throw new Error('http'); return r.json(); }).then(function(D){
    C = D.cases || []; C.forEach(function(c){ BY[String(c.id).toUpperCase()] = c; });
    ids = ids.map(function(i){ return BY[i] ? BY[i].id : i; });
    render();
  }).catch(function(){ box.innerHTML = '<p class="cp-note">We could not load the projects just now. Try again in a moment, or <a href="/cases">browse the projects</a>.</p>'; });
})();
