/* Kolaboro "explain this score" and "ask about this project" (block X6). /explain/?id=BALI-014
   The explanation comes from /api/x/ins/explain (code only, no AI). The question box posts to /api/x/ins/ask, which answers from
   this project's public evidence only and shows each citation with the evidence line it quotes. */
(function(){
  var $ = function(i){ return document.getElementById(i); };
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var ID_RE = /^[A-Z]{2,5}-\d{3,4}$/, id = '';
  try { id = (new URLSearchParams(location.search).get('id') || '').trim().toUpperCase(); } catch (e) {}
  var form = $('exf'), inp = $('exid'), out = $('exout'), askSec = $('exask');
  var ST = { published_confirmed: ['Published and confirmed', 'ok'], published: ['Published, not confirmed', 'pub'], published_contradicted: ['Published, contradicted', 'bad'], claimed: ['Claimed, no number', 'miss'], missing: ['Missing', 'miss'], not_researched: ['Not researched yet', 'na'] };
  function setMeta(t, d){
    document.title = t;
    var m = document.querySelector('meta[name="description"]'); if (m) m.setAttribute('content', d);
    var a = document.querySelector('meta[property="og:title"]'); if (a) a.setAttribute('content', t);
    var b = document.querySelector('meta[property="og:description"]'); if (b) b.setAttribute('content', d);
  }
  function render(o){
    var rows = o.checks.map(function(r){ var s = ST[r.state] || ['', 'na']; return '<li class="ex-' + s[1] + '"><span class="ex-st">' + esc(s[0]) + '</span><b>' + esc(r.name) + '</b><span>' + esc(r.text.replace(r.name + ': ', '')) + '</span></li>'; }).join('');
    var raise = (o.raise || []).map(function(r){ return '<li>' + esc(r.text) + '</li>'; }).join('');
    $('exh').textContent = 'Why ' + o.id + ' scores ' + o.score + ' of ' + o.max;
    out.innerHTML =
      '<div class="y-n"><div><b>' + o.score + '/' + o.max + '</b><span>checks published</span></div><div><b>' + o.vscore + '/6</b><span>confirmed by a register or independent source</span></div><div><b>' + esc(o.tier_name) + '</b><span>tier</span></div><div><b>' + (o.flags || []).length + '</b><span>problem' + ((o.flags || []).length === 1 ? '' : 's') + ' in public reports</span></div></div>' +
      '<p class="lead ex-sum">' + esc(o.summary) + '</p>' +
      '<h3 class="ex-h3">Check by check</h3><ul class="ex-ck">' + rows + '</ul>' +
      ((o.flags || []).length ? '<h3 class="ex-h3">Problems in public reports</h3><ul class="ex-list">' + o.flags.map(function(f){ return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' : '') +
      (o.claims && o.claims.text ? '<p class="y-small" style="margin-top:14px">' + esc(o.claims.text) + '</p>' : '') +
      '<h3 class="ex-h3">What would raise the score</h3>' + (raise ? '<ul class="ex-list">' + raise + '</ul>' : '<p>Every check is published and confirmed. Nothing in the public record would raise it further.</p>') +
      '<p class="y-small" style="margin-top:14px"><b>The rules.</b> ' + esc(o.rules) + ' ' + esc(o.caveat) + '</p>' +
      '<p class="y-small">Method: <a href="/how-we-score">how we score</a>, <a href="/database">what each source level means</a>, <a href="/open/scoring.py">scoring.py</a> (open source). ' +
      (o.matches_published ? 'Recomputed here from the public record: matches the published score.' : '<b>Recomputed here, this differs from the published score; please <a href="/corrections">report it</a>.</b>') + ' Data updated ' + esc(o.updated) + '. ' + esc(o.language_note) + '</p>' +
      '<div class="ex-acts"><a class="btn btn-line btn-sm" href="/p/' + encodeURIComponent(o.id) + '/">Open the project file</a><a class="btn btn-line btn-sm" href="/m/' + encodeURIComponent(String(o.market).toLowerCase().replace(/\s+/g, '-')) + '/">' + esc(o.market) + ' market file</a><a class="btn btn-line btn-sm" href="/api/x/ins/explain?id=' + encodeURIComponent(o.id) + '">JSON</a></div>';
    askSec.hidden = false; $('askid').textContent = o.id;
    setMeta('Why ' + o.id + ' scores ' + o.score + ' of ' + o.max + ': score explained | Kolaboro', o.summary.slice(0, 300));
  }
  function load(x){
    id = x; out.innerHTML = '<p class="y-small">Loading the explanation for ' + esc(x) + '.</p>';
    fetch('/api/x/ins/explain?id=' + encodeURIComponent(x)).then(function(r){ return r.json().then(function(j){ return { s: r.status, j: j }; }); }).then(function(r){
      if (r.s !== 200) { out.innerHTML = '<p class="y-err">' + esc(r.j.message || 'No tracked project has that id.') + ' Browse the <a href="/database">database</a>.</p>'; askSec.hidden = true; return; }
      render(r.j);
    }).catch(function(){ out.innerHTML = '<p class="y-err">The explanation could not load. Try again in a minute.</p>'; });
  }
  if (form) form.addEventListener('submit', function(e){
    e.preventDefault(); var v = (inp.value || '').trim().toUpperCase();
    if (!ID_RE.test(v)) { out.innerHTML = '<p class="y-err">Enter a project id like BALI-014.</p>'; inp.focus(); return; }
    try { history.replaceState(null, '', '/explain/?id=' + encodeURIComponent(v)); } catch (x) {}
    load(v);
  });
  /* ---- ask about this project ---- */
  var af = $('askf'), aq = $('askq'), ao = $('asko'), ab = af ? af.querySelector('button[type=submit]') : null;
  function answer(o){
    var c = (o.citations || []).map(function(x){ return '<li><code>' + esc(x.e) + '</code> <span class="y-small">' + esc(x.field) + ':</span> ' + esc(x.value) + '</li>'; }).join('');
    ao.innerHTML = '<div class="ex-ans ' + (o.answerable ? 'yes' : 'no') + '"><p>' + esc(o.answer) + '</p>' +
      (c ? '<p class="y-small"><b>Evidence cited</b> (each quote was found in the line by code):</p><ol class="ex-cite">' + c + '</ol>' : '') +
      '<p class="y-small">' + esc(o.note || '') + (o.model ? ' Model: ' + esc(o.model) + '.' : '') + (o.cached ? ' Cached answer.' : '') + ' <a href="/api/x/ins/evidence?id=' + encodeURIComponent(o.id) + '">All evidence lines</a>.</p></div>';
  }
  if (af) af.addEventListener('submit', function(e){
    e.preventDefault(); var q = (aq.value || '').trim();
    if (q.length < 6) { ao.innerHTML = '<p class="y-err">Write a question of at least 6 characters.</p>'; aq.focus(); return; }
    if (!ID_RE.test(id)) { ao.innerHTML = '<p class="y-err">Choose a project first.</p>'; return; }
    ab.disabled = true; ao.innerHTML = '<p class="y-small">Reading this project\'s evidence and checking the citations. This takes a few seconds.</p>';
    fetch('/api/x/ins/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: id, q: q }) }).then(function(r){ return r.json().then(function(j){ return { s: r.status, j: j }; }); }).then(function(r){
      ab.disabled = false;
      if (r.s === 200) return answer(r.j);
      ao.innerHTML = '<p class="y-err">' + esc(r.j.message || (r.s === 429 ? 'Too many questions from your network this hour. Try again later.' : 'The question could not be answered right now.')) + '</p>';
    }).catch(function(){ ab.disabled = false; ao.innerHTML = '<p class="y-err">The question could not be sent. Check your connection and try again.</p>'; });
  });
  document.querySelectorAll('[data-q]').forEach(function(b){ b.addEventListener('click', function(){ aq.value = b.getAttribute('data-q'); aq.focus(); }); });
  if (ID_RE.test(id)) { if (inp) inp.value = id; load(id); }
})();
