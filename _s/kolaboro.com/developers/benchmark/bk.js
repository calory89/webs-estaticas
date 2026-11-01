/* Developer benchmark: compares ticked checks with the live distribution in /data/bali-cases.json. Nothing is stored or sent. */
(function(){
  var $ = function(i){ return document.getElementById(i); };
  var CK = [
    ['permit', 'Building permit or licence number', 'd1', 'A number and issuing authority turn "approved" into something a buyer can check in minutes.', 'Publish your permit or licence number', 'Get your permit confirmed on the official register'],
    ['escrow', 'Deposit protection', 'd2', 'Protected deposits can be returned to buyers if a project stops.', 'Publish how buyer deposits are protected', 'Get your deposit protection confirmed by the regulator or the bank'],
    ['progress', 'Construction progress', 'd3', 'Dated progress lets buyers compare the site with the schedule before each payment.', 'Publish dated construction progress', 'Get progress confirmed by the regulator or an independent engineer'],
    ['plans', 'Plans and specification', 'd4', 'Plans with areas and a specification define what the buyer is paying for.', 'Publish plans and a specification', 'Get your plans confirmed against the approved plans'],
    ['record', 'Developer track record', 'd5', 'A company number and delivered projects with addresses show who is behind the brand.', 'Publish your company number and delivered projects', 'Get your company and deliveries confirmed by a registry or the press'],
    ['returns_ok', 'No guaranteed returns language', 'd6', 'Estimates with their assumptions, instead of guarantees, keep you clear of a claim regulators restrict.', 'Remove guaranteed returns language', 'Have an independent source confirm you make no return guarantees']
  ];
  var C = [], st = { m: '', pub: {}, conf: {} };
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(ch){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }
  function ok(c, k){ var x = c.checks || {}; return k === 'permit' ? x.permit === 2 : k === 'escrow' ? x.escrow === true : k === 'progress' ? x.progress != null : !!x[k]; }
  function cf(c, k){ var v = (c.verified || {})[k]; return v === 'registry' || v === 'independent'; }
  function sc(c){ return c.score || 0; }
  function vs(c){ return c.vscore || 0; }
  function pctile(list, f, x){ if (!list.length) return null; var b = 0, e = 0; list.forEach(function(c){ var y = f(c); if (y < x) b++; else if (y === x) e++; }); return { p: Math.round((b + e / 2) / list.length * 100), below: b, eq: e, n: list.length }; }
  function pc(n, d){ return d ? Math.round(n / d * 100) : 0; }
  function ord(n){ var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  function mine(){ var s = 0, v = 0; CK.forEach(function(k){ if (st.pub[k[0]]) s++; if (st.conf[k[0]]) v++; }); return { s: s, v: v }; }
  function mkt(){ return C.filter(function(c){ return c.market === st.m; }); }

  function rows(){
    $('bkRows').innerHTML = CK.map(function(k){
      return '<div class="bk-row"><p class="bk-nm"><a href="/standard/#' + k[2] + '">' + k[2].toUpperCase() + '</a> ' + esc(k[1]) + '</p><div class="tq-chips">' +
        '<label class="tq-chip"><input type="checkbox" data-k="' + k[0] + '" data-t="pub"><span>Published<span class="sr-only">: ' + esc(k[1]) + '</span></span></label>' +
        '<label class="tq-chip"><input type="checkbox" data-k="' + k[0] + '" data-t="conf"><span>Confirmed<span class="sr-only">: ' + esc(k[1]) + '</span></span></label></div></div>';
    }).join('');
  }
  function hist(list, f, x, title){
    var d = [0, 0, 0, 0, 0, 0, 0]; list.forEach(function(c){ d[Math.min(6, f(c))]++; }); var mx = Math.max.apply(null, d) || 1;
    return '<figure class="bk-h"><figcaption>' + esc(title) + ' <span class="tq-small">(' + list.length + ')</span></figcaption><div class="bk-bars" role="img" aria-label="' + esc(title + ': ' + d.map(function(n, i){ return i + ' of 6: ' + n; }).join(', ') + '. You: ' + x) + '">' +
      d.map(function(n, i){ return '<div class="' + (i === x ? 'is-you' : '') + '"><b>' + n + '</b><i style="height:' + Math.max(2, n / mx * 100) + '%"></i><span>' + i + '</span></div>'; }).join('') + '</div></figure>';
  }
  function candidates(M, me){
    var out = [], base = { sm: pctile(M, sc, me.s), sa: pctile(C, sc, me.s), vm: pctile(M, vs, me.v), va: pctile(C, vs, me.v) };
    CK.forEach(function(k){
      var share = M.length ? M.filter(function(c){ return ok(c, k[0]); }).length / M.length : 0;
      if (!st.pub[k[0]]) { var a = pctile(M, sc, me.s + 1), b = pctile(C, sc, me.s + 1); out.push({ k: k, kind: 'pub', what: k[4], metric: 'published', fm: base.sm, tm: a, fa: base.sa, ta: b, g: (a ? a.p - base.sm.p : 0), ga: b.p - base.sa.p, share: share }); }
      if (st.pub[k[0]] && !st.conf[k[0]]) { var cs = M.length ? M.filter(function(x){ return cf(x, k[0]); }).length / M.length : 0; var c = pctile(M, vs, me.v + 1), d = pctile(C, vs, me.v + 1); out.push({ k: k, kind: 'conf', what: k[5], metric: 'confirmed', fm: base.vm, tm: c, fa: base.va, ta: d, g: (c ? c.p - base.vm.p : 0), ga: d.p - base.va.p, share: cs }); }
    });
    out.sort(function(x, y){ return (y.g - x.g) || (y.ga - x.ga) || (x.share - y.share); });
    return out;
  }
  function render(){
    if (!C.length) return;
    var M = mkt(), me = mine(), name = st.m || 'your market';
    $('bkS').textContent = me.s; $('bkV').textContent = me.v;
    function line(list, f, x, label){ var r = pctile(list, f, x); if (!r) return ''; return '<span><b>' + ord(r.p) + '</b> percentile ' + esc(label) + '</span>'; }
    var small = M.length && M.length < 5 ? '<span class="tq-small">Only ' + M.length + ' project' + (M.length === 1 ? '' : 's') + ' tracked in ' + esc(name) + ': a rough signal.</span>' : '';
    $('bkSp').innerHTML = line(M, sc, me.s, 'in ' + name) + line(C, sc, me.s, 'in all markets') + small;
    $('bkVp').innerHTML = line(M, vs, me.v, 'in ' + name) + line(C, vs, me.v, 'in all markets');
    var cand = candidates(M, me), b = cand[0], h = '<h2>The change that moves you most</h2>';
    if (!b) h += '<p class="bk-what">Nothing left to add</p><p>You publish all six core items and each is confirmed by a registry or an independent source. Keep them current: progress and permits go out of date fastest.</p>';
    else {
      h += '<p class="bk-what">' + esc(b.what) + '</p><p>Your ' + b.metric + ' percentile in ' + esc(name) + ' goes from <b>' + b.fm.p + '</b> to <b>' + b.tm.p + '</b>' + (b.g > 0 ? ' (+' + b.g + ')' : '') + ', and in all markets from <b>' + b.fa.p + '</b> to <b>' + b.ta.p + '</b>' + (b.ga > 0 ? ' (+' + b.ga + ')' : '') + '. ' +
        pc(Math.round(b.share * M.length), M.length) + '% of tracked projects in ' + esc(name) + (b.kind === 'conf' ? ' have this confirmed today.' : ' publish this today.') + '</p><p class="tq-small" style="margin-top:8px">' + esc(b.k[3]) + '</p>' +
        '<p class="tq-acts"><a class="btn btn-hi btn-sm" href="/developers/templates/">Template for this</a><a class="btn btn-line btn-sm" href="/standard/#' + b.k[2] + '">What to publish (' + b.k[2].toUpperCase() + ')</a></p>';
      if (cand.length > 1) h += '<h3 class="bk-oh">Other changes, ranked</h3><ol class="bk-ol">' + cand.slice(1, 6).map(function(c){ return '<li><span>' + esc(c.what) + '</span><b>' + (c.g > 0 ? '+' + c.g : '0') + '</b></li>'; }).join('') + '</ol><p class="tq-small">Percentile points gained in ' + esc(name) + ' on the published or confirmed score.</p>';
    }
    $('bkBest').innerHTML = h;
    $('bkDist').innerHTML = '<div class="bk-hs">' + hist(M, sc, me.s, 'Published, ' + name) + hist(C, sc, me.s, 'Published, all markets') + hist(M, vs, me.v, 'Confirmed, ' + name) + hist(C, vs, me.v, 'Confirmed, all markets') + '</div>';
    $('bkShare').innerHTML = '<div class="tq-tw"><table class="tq-t"><thead><tr><th scope="col">Check</th><th scope="col">Publish, ' + esc(name) + '</th><th scope="col">Confirmed, ' + esc(name) + '</th><th scope="col">Publish, all</th><th scope="col">You</th></tr></thead><tbody>' +
      CK.map(function(k){ var p = M.filter(function(c){ return ok(c, k[0]); }).length, v = M.filter(function(c){ return cf(c, k[0]); }).length, a = C.filter(function(c){ return ok(c, k[0]); }).length;
        var you = st.conf[k[0]] ? 'Confirmed' : st.pub[k[0]] ? 'Published' : 'No';
        return '<tr><td><a href="/standard/#' + k[2] + '">' + esc(k[1]) + '</a></td><td>' + pc(p, M.length) + '%</td><td>' + pc(v, M.length) + '%</td><td>' + pc(a, C.length) + '%</td><td>' + you + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  rows();
  $('bkForm').addEventListener('change', function(e){
    var t = e.target;
    if (t.id === 'bkMarket') st.m = t.value;
    else if (t.getAttribute('data-k')) st[t.getAttribute('data-t')][t.getAttribute('data-k')] = t.checked;
    render();
  });
  $('bkReset').addEventListener('click', function(){ st.pub = {}; st.conf = {}; Array.prototype.forEach.call(document.querySelectorAll('#bkRows input'), function(i){ i.checked = false; }); render(); });
  fetch('/data/bali-cases.json?t=' + Math.floor(Date.now() / 6e5)).then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); }).then(function(d){
    C = d.cases || [];
    var G = {}; C.forEach(function(c){ var g = G[c.country] = G[c.country] || {}; g[c.market] = (g[c.market] || 0) + 1; });
    var top = null, tn = 0, h = '';
    Object.keys(G).sort(function(a, b){ return a.localeCompare(b); }).forEach(function(k){ h += '<optgroup label="' + esc(k) + '">' + Object.keys(G[k]).sort(function(a, b){ return a.localeCompare(b); }).map(function(m){ if (G[k][m] > tn) { tn = G[k][m]; top = m; } return '<option value="' + esc(m) + '">' + esc(m) + ' (' + G[k][m] + ')</option>'; }).join('') + '</optgroup>'; });
    var sel = $('bkMarket'); sel.innerHTML = h; sel.disabled = false; sel.value = st.m = top;
    $('bkUpd').textContent = 'Live data updated ' + (d.updated || '') + ': ' + C.length.toLocaleString('en') + ' projects in ' + Object.keys(G).length + ' countries.';
    render();
  }).catch(function(){ $('bkUpd').textContent = 'Live data unavailable right now. Please refresh in a moment.'; $('bkBest').innerHTML = '<h2>The change that moves you most</h2><p class="tq-err">The live data did not load.</p>'; });
})();
