/* Deposit protection finder: live data from /data/bali-cases.json, register facts from /registers/ (window.KREG) */
(function(){
  var KT = window.KT, R = window.KREG, $ = function(i){ return document.getElementById(i); }, esc = KT.esc, fmt = KT.fmt;
  var LV = [['registry','Registry','#17212B'],['independent','Confirmed','#0B7A55'],['developer','Developer only','#B9B4A8'],['contradicted','Contradicted','#C9461A'],['none','Not published','#E7E4DC']];
  var KIND = { law: 'is-ok', list: 'is-ok', state: 'is-mid', trust: 'is-mid', optional: '', none: '' };
  var BASEQ = [
    'Who holds my money? Please name the bank and the account holder: a licensed escrow agent, a notary, a trustee or your own company.',
    'In whose name is the account: the project, an escrow agent or trustee, or the developer company? Will the account be named in my signed contract?',
    'On what construction milestone is money released to you, and who certifies that the milestone has been reached?',
    'What happens to my money if the project stops? Is it refunded from the account or under a guarantee, how do I claim it, and how long does that take?',
    'Does the booking fee or reservation deposit go into the same protected account?',
    'Will I get a receipt or certificate in my name for every payment?',
    'If your payment details ever change, how will you confirm it? I will pay only into the account named in the contract.'
  ];
  var C = [], ALL = null, S = null, lim = 15;
  function pct(n, d){ return d ? Math.round(n / d * 100) : 0; }
  function stats(list){
    var s = { n: list.length, pub: 0, lv: { registry: 0, independent: 0, developer: 0, contradicted: 0, none: 0 } };
    list.forEach(function(c){ if (c.checks && c.checks.escrow === true) s.pub++; var v = (c.verified || {}).escrow || 'none'; if (!(v in s.lv)) v = 'none'; s.lv[v]++; });
    s.conf = s.lv.registry + s.lv.independent; return s;
  }
  function label(s){ return s.type === 'country' ? s.name : s.name; }
  function mlink(m){ return '/m/?market=' + encodeURIComponent(m); }
  function stack(s){
    return '<div class="dp-stack" role="img" aria-label="' + esc(LV.map(function(l){ return l[1] + ' ' + s.lv[l[0]]; }).join(', ')) + '">' + LV.map(function(l){ var n = s.lv[l[0]]; return n ? '<i style="width:' + (n / s.n * 100) + '%;background:' + l[2] + '"></i>' : ''; }).join('') + '</div>' +
      '<ul class="dp-leg">' + LV.map(function(l){ return '<li style="--c:' + l[2] + '">' + l[1] + ' <b>' + s.lv[l[0]] + '</b></li>'; }).join('') + '</ul>';
  }
  function drawData(){
    var el = $('dpData');
    if (!S) {
      el.innerHTML = '<h2>What the data shows</h2><p class="dp-big"><b>' + pct(ALL.pub, ALL.n) + '%</b><span>of all ' + fmt(ALL.n) + ' tracked projects publish deposit protection</span></p>' +
        '<p class="tq-small">How the deposit claims check out, across every market:</p>' + stack(ALL) + '<p class="tq-small" style="margin-top:12px">Pick a country or market above to see it there.</p>';
      return;
    }
    var list = KT.subset(C, S), s = stats(list), name = label(S);
    var h = '<h2>What the data shows in ' + esc(name) + '</h2>';
    h += '<p class="dp-big"><b>' + pct(s.pub, s.n) + '%</b><span>' + s.pub + ' of ' + s.n + ' tracked project' + (s.n === 1 ? '' : 's') + ' publish deposit protection. All markets: ' + pct(ALL.pub, ALL.n) + '%.</span></p>';
    h += '<p class="tq-small">How the deposit claims check out (strongest source we found for each project):</p>' + stack(s);
    if (s.n < 5) h += '<p class="tq-small" style="margin-top:10px">Few projects tracked here, so treat the share as a rough signal.</p>';
    if (S.type === 'country') {
      var M = {}; list.forEach(function(c){ (M[c.market] = M[c.market] || []).push(c); });
      h += '<div class="tq-tw"><table class="tq-t"><thead><tr><th scope="col">Market</th><th scope="col">Projects</th><th scope="col">Publish</th><th scope="col">Confirmed</th></tr></thead><tbody>' +
        Object.keys(M).sort(function(a, b){ return M[b].length - M[a].length; }).map(function(m){ var x = stats(M[m]); return '<tr><td><a href="' + mlink(m) + '">' + esc(m) + '</a></td><td>' + x.n + '</td><td>' + pct(x.pub, x.n) + '%</td><td>' + x.conf + '</td></tr>'; }).join('') + '</tbody></table></div>';
      h += '<p style="margin-top:14px"><a class="btn btn-line btn-sm" href="/m/?country=' + encodeURIComponent(S.name) + '">Open the ' + esc(S.name) + ' market file</a></p>';
    } else {
      h += '<p style="margin-top:14px"><a class="btn btn-line btn-sm" href="' + mlink(S.name) + '">Open the ' + esc(S.name) + ' market file</a></p>';
    }
    el.innerHTML = h;
  }
  function regsFor(a){
    var c = R.get(a); if (!c) return [];
    return c.regs.filter(function(r){ if (a === 'usa' && /Florida/.test(r.name) && !KT.isFlorida(S) && !(S && S.type === 'country')) return false; return r.checks.indexOf('escrow') >= 0 || r.checks.indexOf('permit') >= 0 || r.checks.indexOf('title') >= 0; });
  }
  function drawLaw(){
    var el = $('dpLaw'), h = '<h2>What protection exists and where to check it</h2>';
    if (!S) { el.innerHTML = h + '<p class="tq-small">Pick a country or market to see what the law requires and which official register to open.</p>'; return; }
    var an = KT.anchors(C, S), name = label(S);
    if (!an.length) {
      var country = (KT.subset(C, S)[0] || {}).country || name;
      h += '<p><span class="tq-tag">Not in the guide yet</span></p><p style="margin-top:10px">Our <a href="/registers/">registers guide</a> does not cover ' + esc(country === 'UAE' ? name : country) + ' yet, so we cannot tell you what protection the law gives here.</p>' +
        '<p style="margin-top:10px">Ask the developer which law, bank or regulator protects buyer payments, get the answer in writing, and confirm it with that bank or regulator yourself, not through a link the seller sent.</p>';
      if (country === 'UAE') h += '<p class="tq-small" style="margin-top:10px">The guide covers <a href="/registers/#dubai">Dubai</a>, <a href="/registers/#abu-dhabi">Abu Dhabi</a> and <a href="/registers/#ras-al-khaimah">Ras Al Khaimah</a>.</p>';
      el.innerHTML = h; return;
    }
    an.forEach(function(a){
      var c = R.get(a), d = R.DEP[a]; if (!c || !d) return;
      h += '<div class="dp-law">' + (an.length > 1 ? '<h3>' + esc(c.name) + '</h3>' : '') + '<p><span class="tq-tag ' + (KIND[d.kind] || '') + '">' + esc(d.head) + '</span></p>' +
        '<p style="margin-top:10px">' + esc(d.text) + '</p>' +
        '<p style="margin-top:10px"><b>Where to check.</b> ' + esc(d.where) + '</p>' +
        '<p style="margin-top:10px" class="tq-small"><b>Keep in mind.</b> ' + esc(d.limit) + '</p>';
      var rs = regsFor(a);
      if (rs.length) h += '<ul class="dp-regs">' + rs.map(function(r){ return '<li><b>' + esc(r.name) + '</b> <span class="tq-small">' + esc(r.checks.map(function(k){ return { permit: 'permit', escrow: 'deposit protection', title: 'land title', company: 'company', env: 'environment' }[k]; }).join(', ')) + '</span><br>' +
        (r.url ? '<a href="' + esc(r.url) + '" target="_blank" rel="noopener">Open the official site<span class="sr-only"> (opens in a new tab)</span></a>' : '<span class="tq-small">Official site, no public link we could confirm</span>') + '</li>'; }).join('') + '</ul>';
      h += '<p style="margin-top:12px"><a href="/registers/#' + a + '">Read the full ' + esc(c.name) + ' entry in the registers guide</a></p></div>';
    });
    el.innerHTML = h;
  }
  function questions(){
    var q = BASEQ.slice();
    if (S) KT.anchors(C, S).forEach(function(a){ var d = R.DEP[a]; if (!d) return; d.qs.forEach(function(x){ if (a === 'usa' && S.type === 'market' && !KT.isFlorida(S)) return; q.push(x); }); });
    return q;
  }
  function drawAsk(){
    var q = questions();
    $('dpQs').innerHTML = q.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('');
    $('dpCheck').href = '/tools/my-checklist/' + (S ? '?' + (S.type === 'country' ? 'country=' : 'market=') + encodeURIComponent(S.name) : '');
  }
  function drawAll(){ drawData(); drawLaw(); drawAsk(); }
  function setSel(s, push){
    S = s; var v = KT.value(s), sel = $('dpSel');
    if (s && !Array.prototype.some.call(sel.options, function(o){ return o.value === v; })) { S = s = KT.find(C, s.name); v = KT.value(s); }
    sel.value = v || '';
    if (push) { try { var u = new URL(location.href); u.searchParams.delete('market'); u.searchParams.delete('country'); if (s) u.searchParams.set(s.type, s.name); history.replaceState(null, '', u.pathname + u.search + u.hash); } catch (e) {} }
    drawAll();
  }
  function lookup(){
    var q = $('dpQ').value.trim(), msg = $('dpMsg'); if (!q) { $('dpQ').focus(); return; }
    var hit = KT.find(C, q);
    if (hit) { $('dpQ').value = ''; setSel(hit, true); $('dpData').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    S = null; $('dpSel').value = '';
    $('dpData').innerHTML = '<h2>No data for ' + esc(q) + '</h2><p>We do not track any off-plan projects in ' + esc(q) + ' yet, so we have no figures to show. The share across all ' + fmt(ALL.n) + ' tracked projects is ' + pct(ALL.pub, ALL.n) + '%.</p><p style="margin-top:10px"><a href="/check">Tell us about a project there</a>: demand decides where our research goes next.</p>';
    $('dpLaw').innerHTML = '<h2>What protection exists and where to check it</h2><p><span class="tq-tag">No data</span></p><p style="margin-top:10px">Our <a href="/registers/">registers guide</a> does not cover ' + esc(q) + '. Ask the developer which law, bank or regulator protects buyer payments, get it in writing, and confirm it with that bank or regulator yourself.</p>';
    drawAsk();
    msg.textContent = '';
  }
  function table(){
    var M = {}; C.forEach(function(c){ (M[c.market] = M[c.market] || []).push(c); });
    var rows = Object.keys(M).filter(function(m){ return M[m].length >= 5; }).map(function(m){ var s = stats(M[m]); s.m = m; s.p = s.pub / s.n; return s; }).sort(function(a, b){ return b.p - a.p || b.n - a.n; });
    function draw(){
      $('dpT').querySelector('tbody').innerHTML = rows.slice(0, lim).map(function(s){ return '<tr><td><button type="button" class="tq-link dp-pickm" data-m="' + esc(s.m) + '">' + esc(s.m) + '</button></td><td>' + s.n + '</td><td><span class="dp-mini" aria-hidden="true"><i style="width:' + Math.round(s.p * 100) + '%"></i></span>' + Math.round(s.p * 100) + '%</td><td>' + s.conf + '</td></tr>'; }).join('');
      var b = $('dpMore'); b.hidden = rows.length <= lim; b.textContent = 'Show all ' + rows.length + ' markets';
    }
    $('dpMore').onclick = function(){ lim = 1000; draw(); };
    $('dpT').addEventListener('click', function(e){ var b = e.target.closest('.dp-pickm'); if (!b) return; setSel({ type: 'market', name: b.getAttribute('data-m') }, true); $('dpForm').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    draw();
  }
  function copy(){
    var name = S ? label(S) : 'any market';
    var txt = 'Questions about deposit protection (' + name + ')\n\n' + questions().map(function(x, i){ return (i + 1) + '. ' + x; }).join('\n') + '\n\nFrom kolaboro.com/tools/deposit-protection/';
    var msg = $('dpMsg');
    function done(){ msg.textContent = 'Copied. Paste them into an email so you have the answers in writing.'; }
    function fallback(){ var t = document.createElement('textarea'); t.value = txt; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { msg.textContent = 'Copy did not work here: select the questions and copy them by hand.'; } document.body.removeChild(t); }
    try { if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(done, fallback); else fallback(); } catch (e) { fallback(); }
  }
  $('dpCopy').addEventListener('click', copy);
  $('dpGo').addEventListener('click', lookup);
  $('dpQ').addEventListener('keydown', function(e){ if (e.key === 'Enter') { e.preventDefault(); lookup(); } });
  drawAsk();
  KT.load().then(function(d){
    C = d.cases || []; ALL = stats(C);
    var sel = $('dpSel'); KT.fillSelect(sel, C, { placeholder: 'Choose a country or market' }); sel.disabled = false;
    sel.addEventListener('change', function(){ setSel(KT.parse(sel.value), true); });
    $('dpUpd').textContent = 'Live data updated ' + (d.updated || '') + ': ' + fmt(C.length) + ' projects in ' + fmt(KT.groups(C).length) + ' countries.';
    var p = {}; try { var u = new URLSearchParams(location.search); p.m = u.get('market'); p.c = u.get('country'); } catch (e) {}
    var s = p.m ? KT.find(C, p.m) : p.c ? KT.find(C, p.c) : null;
    if ((p.m || p.c) && !s) { $('dpQ').value = p.m || p.c; table(); lookup(); return; }
    table(); setSel(s, false);
  }).catch(function(){
    $('dpData').innerHTML = '<h2>What the data shows</h2><p class="tq-err">The live data did not load. Please refresh the page in a moment.</p>';
    $('dpUpd').textContent = 'Live data unavailable right now.';
  });
})();
