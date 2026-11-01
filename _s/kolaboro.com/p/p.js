/* Kolaboro project file: /p/?id=BALI-014. Renders one anonymous project from /data/bali-cases.json */
(function(){
  var CK = [
    ['permit', 'Permit or licence number', 'An official permit or sales licence number a buyer can look up.'],
    ['escrow', 'Deposit protection', 'Escrow, a bank guarantee or a trust account for buyer payments.'],
    ['progress', 'Construction progress', 'A percentage built or dated progress updates.'],
    ['plans', 'Site or floor plans', 'Plans a buyer can compare with the contract.'],
    ['record', 'Developer track record', 'Past projects delivered, stated in public.'],
    ['returns_ok', 'No guaranteed returns', 'No "guaranteed" rental return language in the marketing.']
  ];
  var LV = {
    registry: ['Registry', 'Confirmed on an official register'],
    independent: ['Confirmed', 'Confirmed by an independent source'],
    developer: ['Not confirmed', 'Only the developer or its agents say so'],
    contradicted: ['Contradicted', 'Sources disagree with the developer'],
    none: ['No source', 'Nothing published to confirm']
  };
  var TIER = { clear: ['Strong public disclosure', '#0B7A55'], mixed: ['Some gaps', '#8A5A0F'], caution: ['Check carefully', '#B42318'] };
  var root = document.getElementById('pf');
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pub(c, k){ var x = c.checks || {}, v = x[k]; if (k === 'permit') return v === 2 ? 'y' : v === 1 ? 'p' : 'n'; if (k === 'escrow') return v === true ? 'y' : 'n'; if (k === 'progress') return v != null ? 'y' : 'n'; return v ? 'y' : 'n'; }
  function stage(s){ return s === 'under construction' ? 'Under construction' : s === 'completed' ? 'Completed, still selling' : s === 'off-plan' ? 'Off-plan' : 'Not stated'; }
  function title(c){ if (!c.title) return 'Not stated'; var t = String(c.title).replace(/_/g, ' '); t = t.charAt(0).toUpperCase() + t.slice(1); return c.lease ? t + ', ' + c.lease + ' years' : t; }
  function place(c){ return c.region && c.region !== c.market ? c.region + ', ' + c.market : c.market; }
  function num(x){ return +(+x).toFixed(1); }
  function lvBadge(l){ l = LV[l] ? l : 'none'; return '<span class="lv ' + l + '" title="' + esc(LV[l][1]) + '">' + LV[l][0] + '</span>'; }
  function setMeta(t, d, url){
    document.title = t;
    var m = document.querySelector('meta[name="description"]'); if (m) m.setAttribute('content', d);
    var a = document.querySelector('meta[property="og:title"]'); if (a) a.setAttribute('content', t);
    var b = document.querySelector('meta[property="og:description"]'); if (b) b.setAttribute('content', d);
    var l = document.querySelector('link[rel="canonical"]'); if (l && url) l.setAttribute('href', url);
    var o = document.querySelector('meta[property="og:url"]'); if (o && url) o.setAttribute('content', url);
  }
  var id = '';
  try { id = (new URLSearchParams(location.search).get('id') || '').trim().toUpperCase(); } catch (e) {}

  function notFound(msg){
    setMeta('Project not found | Kolaboro', 'This project file could not be found. Search every off-plan project Kolaboro tracks.', 'https://kolaboro.com/p/');
    var m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex'; document.head.appendChild(m);
    root.innerHTML = '<section class="pf-hero"><div class="wrap"><p class="crumb"><a href="/">Kolaboro</a> / <a href="/cases">Live cases</a> / Project file</p>' +
      '<h1>' + (id ? 'We could not find ' + esc(id) : 'Which project are you looking for?') + '</h1>' +
      '<p class="lead">' + esc(msg || (id ? 'The id may be mistyped, or the project may have been merged or removed after a correction.' : 'Every project has a short id such as BALI-014. Search by id, market or country.')) + '</p>' +
      '<form class="pf-srch" action="/cases" method="get" role="search"><label for="pf-q">Search the projects</label><input id="pf-q" name="q" type="search" placeholder="An id, market or country" value="' + esc(id) + '" autocomplete="off"><button class="btn btn-hi" type="submit">Search</button></form>' +
      '<div class="pf-act"><a class="btn btn-line" href="/cases">Browse all projects</a><a class="btn btn-line" href="/check">Check your own project</a></div></div></section>';
  }

  function similar(C, c){
    var d = function(x){ return Math.abs((x.score || 0) - (c.score || 0)) + Math.abs((x.vscore || 0) - (c.vscore || 0)); };
    var pick = function(f){ return C.filter(function(x){ return x.id !== c.id && f(x); }).sort(function(a, b){ return d(a) - d(b) || (a.id < b.id ? -1 : 1); }); };
    var out = pick(function(x){ return x.market === c.market; }).slice(0, 3), same = out.length;
    if (out.length < 3) out = out.concat(pick(function(x){ return x.market !== c.market && x.country === c.country; }).slice(0, 3 - out.length));
    return { list: out, sameMarket: same };
  }

  function simCard(x){
    return '<a class="pf-card" href="/p/?id=' + encodeURIComponent(x.id) + '"><span class="ci">' + esc(x.id) + '</span>' +
      '<p class="cm">' + (x.stage ? esc(stage(x.stage)) : 'Stage not stated') + ', ' + esc(place(x)) + '<br>' + esc(x.band || 'Price not stated') + (x.done ? ', completion ' + esc(x.done) : '') + '</p>' +
      '<div class="cs"><span><b>' + (x.score || 0) + '/' + (x.max || 6) + '</b>published</span><span><b>' + (x.vscore || 0) + '/6</b>confirmed</span><span><b>' + (x.flags || []).length + '</b>problem' + ((x.flags || []).length === 1 ? '' : 's') + '</span></div></a>';
  }

  function render(D){
    var C = D.cases || [], c = null;
    for (var i = 0; i < C.length; i++) if (String(C[i].id).toUpperCase() === id) { c = C[i]; break; }
    if (!c) return notFound();
    var mx = c.max || 6, sc = c.score || 0, vs = c.vscore || 0, V = c.verified || {}, t = TIER[c.tier] || TIER.mixed, flags = c.flags || [], notes = c.notes || [], q = c.q || [];
    var cl = c.claims || { verified: 0, unverified: 0, contradicted: 0 }, ct = (cl.verified || 0) + (cl.unverified || 0) + (cl.contradicted || 0);
    var mk = C.filter(function(x){ return x.market === c.market; }).sort(function(a, b){ return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; }), pos = mk.indexOf(c);
    var prev = pos > 0 ? mk[pos - 1] : null, next = pos < mk.length - 1 ? mk[pos + 1] : null;
    var sim = similar(C, c), ids = [c.id].concat(sim.list.map(function(x){ return x.id; }));
    var h1 = (c.stage ? stage(c.stage) + ' project' : 'Project') + ' in ' + place(c);
    setMeta(c.id + ': ' + h1 + ' | Kolaboro', c.id + ' in ' + place(c) + ', ' + c.country + ': ' + sc + ' of ' + mx + ' buyer checks published by the developer, ' + vs + ' confirmed by a registry or independent source.', 'https://kolaboro.com/p/?id=' + encodeURIComponent(c.id));

    var facts = [['Market', c.market], ['Country', c.country], ['Region', c.region || c.market], ['Stage', stage(c.stage)], ['Price band', c.band || 'Not stated'], ['Completion', c.done ? 'Advertised for ' + c.done : 'No date published'], ['Title', title(c)], ['Advertised yield', c.yield ? c.yield + '% a year' : 'None advertised']];

    var rows = CK.map(function(k){
      var p = pub(c, k[0]), x = (c.checks || {})[k[0]], label = p === 'y' ? 'Published' : p === 'p' ? 'Claimed only' : 'Not published';
      var detail = k[2];
      if (k[0] === 'permit' && p === 'p') detail = 'A permit is claimed but no number is published.';
      if (k[0] === 'progress' && x != null) detail = typeof x === 'number' ? 'Published as ' + x + '% built.' : 'Published as dated updates.';
      return '<div class="pf-row" role="row"><div class="t" role="cell"><b>' + esc(k[1]) + '</b><small>' + esc(detail) + '</small></div>' +
        '<div role="cell"><span class="pf-pub ' + p + '"><i aria-hidden="true">' + (p === 'y' ? '✓' : p === 'p' ? '~' : '✗') + '</i>' + label + '</span></div>' +
        '<div role="cell">' + lvBadge(V[k[0]]) + '</div></div>';
    }).join('');

    var seg = function(n, cls){ var s = '<div class="pf-seg ' + (cls || '') + '" aria-hidden="true">'; for (var j = 0; j < 6; j++) s += '<i class="' + (j < n ? 'on' : '') + '"></i>'; return s + '</div>'; };
    var pct = function(n){ return ct ? (n / ct * 100) : 0; };

    var html = '<section class="pf-hero"><div class="wrap">' +
      '<p class="crumb"><a href="/">Kolaboro</a> / <a href="/cases">Live cases</a> / <a href="/cases?q=' + encodeURIComponent(c.market) + '">' + esc(c.market) + '</a> / ' + esc(c.id) + '</p>' +
      '<div class="pf-top"><span class="pf-id">' + esc(c.id) + '</span><span class="pf-tier" style="color:' + t[1] + '">' + t[0] + '</span></div>' +
      '<h1>' + esc(h1) + '</h1>' +
      '<p class="lead">An anonymous project file. We publish what the developer says in public and what an official register or an independent source confirms. Names stay hidden until a verification is finished and the developer has had time to reply.</p>' +
      '<dl class="pf-facts">' + facts.map(function(f){ return '<div><dt>' + f[0] + '</dt><dd>' + esc(f[1]) + '</dd></div>'; }).join('') + '</dl>' +
      '<div class="pf-act"><a class="btn btn-hi" href="/compare/?ids=' + ids.map(encodeURIComponent).join(',') + '">Compare with similar projects</a><a class="btn btn-line" href="/follow?id=' + encodeURIComponent(c.id) + '">Follow this project</a></div>' +
      '</div></section>' +

      '<section class="pf-sec"><div class="wrap"><h2>Public disclosure and what is confirmed</h2>' +
      '<p class="sub">Six things a careful buyer needs. First, does the developer publish it? Second, has a registry or an independent source confirmed it?</p>' +
      '<div class="pf-scores">' +
        '<div class="pf-sc"><div class="n"><b>' + sc + '</b><span>/ ' + mx + '</span></div><h3>Published by the developer</h3>' + seg(sc) + '<p>' + (sc === mx ? 'All six are published.' : (mx - sc) + ' of the six are missing or only claimed.') + '</p></div>' +
        '<div class="pf-sc"><div class="n"><b>' + vs + '</b><span>/ 6</span></div><h3>Confirmed by a registry or independent source</h3>' + seg(vs, 'v') + '<p>' + (vs ? vs + ' check' + (vs === 1 ? ' is' : 's are') + ' backed by a source other than the developer.' : 'Nothing is confirmed by a source other than the developer yet.') + '</p></div>' +
      '</div>' +
      '<div class="pf-checks" role="table" aria-label="Six checks: published and verification level"><div class="pf-row h" role="row"><span role="columnheader">Check</span><span role="columnheader">Developer publishes</span><span role="columnheader">Verification level</span></div>' + rows + '</div>' +
      '<div class="pf-key">' + Object.keys(LV).map(function(k){ return '<span>' + lvBadge(k) + esc(LV[k][1]) + '</span>'; }).join('') + '</div>' +
      '</div></section>' +

      '<section class="pf-sec"><div class="wrap"><h2>Developer claims tested</h2>' +
      (ct ? '<p class="sub">We tested ' + ct + ' claim' + (ct === 1 ? '' : 's') + ' from the developer\'s own marketing against registers, courts and press.</p>' +
        '<div class="pf-claims" role="img" aria-label="' + cl.verified + ' verified, ' + cl.unverified + ' unverified, ' + cl.contradicted + ' contradicted"><i style="width:' + pct(cl.verified) + '%;background:#0B7A55"></i><i style="width:' + pct(cl.unverified) + '%;background:#B9B4A8"></i><i style="width:' + pct(cl.contradicted) + '%;background:#C9461A"></i></div>' +
        '<div class="pf-cl"><span style="--c:#0B7A55">Verified <b>' + cl.verified + '</b></span><span style="--c:#B9B4A8">Unverified <b>' + cl.unverified + '</b></span><span style="--c:#C9461A">Contradicted <b>' + cl.contradicted + '</b></span></div>'
        : '<p class="sub">No developer claims have been tested on this project yet.</p>') +
      (c.delay ? '<p class="pf-call"><b>Handover moved ' + num(c.delay) + ' month' + (num(c.delay) === 1 ? '' : 's') + '.</b> Public sources show the completion date has slipped. Ask for the current schedule in writing and what happens to your payments if it moves again.</p>' : '<p class="pf-call ok">No delay to handover found in public sources.</p>') +
      (c.overdue ? '<p class="pf-call"><b>' + num(c.overdue) + ' month' + (num(c.overdue) === 1 ? '' : 's') + ' past the promised handover</b> and not marked completed.</p>' : '') +
      (c.register ? '<p class="pf-call' + (c.register.status === 'approved' ? ' ok' : '') + '"><b>Official register, re-checked weekly:</b> ' + esc(c.register.register) + ', ' + esc(c.register.item) + ': <b>' + esc(c.register.status) + '</b>' + (c.register.detail ? ' (' + esc(c.register.detail) + ')' : '') + '. Last checked ' + esc(c.register.checked) + '.</p>' : '') +
      (c.sat ? '<p class="pf-call' + (c.sat.status === 'visible change' ? ' ok' : '') + '"><b>From space:</b> ' + (c.sat.status === 'visible change' ? 'visible change on the site compared with a year ago (' + esc(c.sat.changed_pct) + '% of the area), Sentinel-2, checked ' + esc(c.sat.date) + '.' : 'no visible change on the site compared with a year ago (Sentinel-2, checked ' + esc(c.sat.date) + '). If works are meant to be under way, ask why.') + '</p>' : '') +
      ((c.history || []).length ? '<div class="pf-hist"><h3>What changed on the developer\'s page</h3><p class="muted">Our research agent reads the page every week and records every change.</p><ol>' + c.history.map(function(h){ var f = function(v){ return v === null || v === undefined ? 'not stated' : v === true ? 'yes' : v === false ? 'no' : String(v); }; return '<li><time>' + esc(h.d) + '</time><span>' + esc(h.f) + ': <s>' + esc(f(h.from)) + '</s> → <b>' + esc(f(h.to)) + '</b></span></li>'; }).join('') + '</ol></div>' : '') +
      '</div></section>' +

      '<section class="pf-sec"><div class="wrap"><h2>Problems in public reports</h2>' +
      (flags.length ? '<p class="sub">Listed only from news, courts and regulators.</p><ul class="pf-list fl">' + flags.map(function(f){ return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' : '<p class="sub">None found in news, courts or regulator notices. That is not a guarantee: it means nothing public turned up.</p>') +
      (notes.length ? '<h3 style="margin-top:26px;font-size:1.1rem">Notes</h3><ul class="pf-list no">' + notes.map(function(f){ return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' : '') +
      '</div></section>' +

      (q.length ? '<section class="pf-sec"><div class="wrap"><h2>What to ask the developer</h2><p class="sub">Ask in writing and keep the answers. A good developer can answer each one with a document.</p><ol class="pf-q">' + q.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ol></div></section>' : '') +

      '<section class="pf-sec"><div class="wrap"><h2>Compare with similar projects</h2>' +
      '<p class="sub">' + (sim.sameMarket >= 3 ? 'Three other projects in ' + esc(c.market) + ' with the closest scores.' : sim.list.length ? 'The closest projects in ' + esc(c.market) + (sim.sameMarket < sim.list.length ? ' and elsewhere in ' + esc(c.country) : '') + '.' : 'No other project is tracked in this market yet.') + '</p>' +
      (sim.list.length ? '<div class="pf-sim">' + sim.list.map(simCard).join('') + '</div><div class="pf-act"><a class="btn btn-line" href="/compare/?ids=' + ids.map(encodeURIComponent).join(',') + '">Compare side by side</a></div>' : '') +
      '</div></section>' +

      '<section class="pf-sec"><div class="wrap"><nav class="pf-nav" aria-label="Other projects in ' + esc(c.market) + '">' +
      (prev ? '<a href="/p/?id=' + encodeURIComponent(prev.id) + '" rel="prev"><small>Previous in ' + esc(c.market) + '</small><b>&larr; ' + esc(prev.id) + '</b></a>' : '') +
      (next ? '<a class="nx" href="/p/?id=' + encodeURIComponent(next.id) + '" rel="next"><small>Next in ' + esc(c.market) + '</small><b>' + esc(next.id) + ' &rarr;</b></a>' : '') +
      '</nav><p class="pf-fine">Project ' + (pos + 1) + ' of ' + mk.length + ' in ' + esc(c.market) + '. ' + (c.checked ? 'Last checked ' + esc(c.checked) + '. ' : '') + (c.invited ? 'Developer invited to reply on ' + esc(c.invited) + '. ' : '') + 'A published document is not proof that it is genuine; that is what our local agents check on site and at the registry. <a href="/how-we-score">How we score</a> · <a href="/corrections">Corrections</a> · <a href="/developers">Developers can reply</a>.</p></div></section>' +

      '<div class="wrap"><div class="pf-cta"><h2>Buying a project that is not on this list?</h2><p>Send us the link. We read what the developer publishes, check it against registers and tell you what is missing before you pay.</p><div class="pf-act"><a class="btn btn-hi" href="/check">Check your own project</a><a class="btn btn-line" href="/follow?id=' + encodeURIComponent(c.id) + '">Follow ' + esc(c.id) + '</a></div></div></div>';
    root.innerHTML = html;
  }

  if (!id) { notFound(); return; }
  fetch('/data/bali-cases.json?t=' + Math.floor(Date.now() / 6e5)).then(function(r){ if (!r.ok) throw new Error('http'); return r.json(); })
    .then(render)
    .catch(function(){ notFound('We could not load the database just now. Try again in a moment, or search below.'); });
})();
