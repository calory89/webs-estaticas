/* Kolaboro market file: /m/?market=Bali or /m/?market=Indonesia (country). Everything computed from /data/bali-cases.json */
(function(){
  var CK = [['permit','Permit or licence number'],['escrow','Deposit protection'],['progress','Construction progress'],['plans','Site or floor plans'],['record','Developer track record'],['returns_ok','No guaranteed returns']];
  var LV = [['registry','Registry','#17212B'],['independent','Confirmed','#1E8A5A'],['developer','Not confirmed','#B9B4A8'],['contradicted','Contradicted','#C9461A'],['none','Not published','#E7E4DC']];
  var ST = [['off-plan','off-plan'],['under construction','under construction'],['completed','completed, still selling']];
  var BASE = 'https://kolaboro.com/m/';
  var ssrEl = document.getElementById('ssr'); if (ssrEl) ssrEl.remove();
  var $ = function(i){ return document.getElementById(i); };
  var K = window.KTI || {};
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s){ s = String(s || '').toLowerCase().trim(); try { s = s.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) {} return s.replace(/[-_+]+/g, ' ').replace(/\s+/g, ' '); }
  function pct(x){ return Math.round(x * 100) + '%'; }
  function fmt(n){ return (n || 0).toLocaleString('en'); }
  function ok(c, k){ var x = c.checks || {}; return k === 'permit' ? x.permit === 2 : k === 'escrow' ? x.escrow === true : k === 'progress' ? x.progress != null : !!x[k]; }
  function share(C, k){ return C.length ? C.filter(function(c){ return ok(c, k); }).length / C.length : 0; }
  function mlink(m){ return '/m/?market=' + encodeURIComponent(m); }
  function clink(c){ return '/m/?country=' + encodeURIComponent(c); }
  function overdue(c){ return (c.overdue || 0) > 0 || (c.delay || 0) > 0; }
  function contra(c){ return ((c.claims || {}).contradicted || 0) > 0; }
  function flagged(c){ return (c.flags || []).length > 0; }
  function setMeta(t, d, url){
    document.title = t;
    var q = function(s){ return document.querySelector(s); };
    var md = q('meta[name="description"]'); if (md) md.setAttribute('content', d);
    var a = q('meta[property="og:title"]'); if (a) a.setAttribute('content', t);
    var b = q('meta[property="og:description"]'); if (b) b.setAttribute('content', d);
    var l = q('link[rel="canonical"]'); if (l) l.setAttribute('href', url);
    var o = q('meta[property="og:url"]'); if (o) o.setAttribute('content', url);
  }
  function params(){ var p; try { p = new URLSearchParams(location.search); } catch (e) { return { m: '', c: '' }; } var pm = (location.pathname.match(/^\/m\/([^\/]{2,60})\/?$/) || [])[1]; return { m: p.get('market') || (pm ? decodeURIComponent(pm).replace(/-/g, ' ') : ''), c: p.get('country') || '' }; }

  function stageTags(C){
    var n = {}; C.forEach(function(c){ n[c.stage] = (n[c.stage] || 0) + 1; });
    var t = ST.filter(function(s){ return n[s[0]]; }).map(function(s){ return '<span class="mk-tag"><b>' + n[s[0]] + '</b> ' + s[1] + '</span>'; });
    var other = C.length - ST.reduce(function(s, x){ return s + (n[x[0]] || 0); }, 0);
    if (other > 0) t.push('<span class="mk-tag"><b>' + other + '</b> stage not stated</span>');
    return t.join('');
  }
  function kpis(C){
    var n = C.length || 1, cl = { verified: 0, unverified: 0, contradicted: 0 }, s = 0;
    C.forEach(function(c){ s += c.score || 0; var x = c.claims || {}; cl.verified += x.verified || 0; cl.unverified += x.unverified || 0; cl.contradicted += x.contradicted || 0; });
    var c4 = C.filter(function(c){ return (c.vscore || 0) >= 4; }).length;
    var tiles = [
      [(s / n).toFixed(1) + '<small style="font-size:.5em;color:var(--muted)"> of 6</small>', 'average checks published'],
      [pct(share(C, 'permit')), 'publish a permit or licence number'],
      [pct(share(C, 'escrow')), 'publish deposit protection'],
      [pct(c4 / n), 'have 4 or more checks confirmed (' + c4 + ')'],
      [fmt(cl.verified) + ' / ' + fmt(cl.unverified) + ' / <em>' + fmt(cl.contradicted) + '</em>', 'developer claims verified / unverified / contradicted', 'cl'],
      [fmt(C.filter(overdue).length), 'projects past their advertised completion'],
      [fmt(C.filter(flagged).length), 'projects with problems in news, courts or regulators'],
      [fmt(C.filter(contra).length), 'projects with at least one contradicted claim']
    ];
    return '<div class="mk-kpi">' + tiles.map(function(t){ return '<div' + (t[2] ? ' class="' + t[2] + '"' : '') + '><b>' + t[0] + '</b><span>' + t[1] + '</span></div>'; }).join('') + '</div>';
  }
  function bars(C, ALL, label){
    return '<div class="mk-bars">' + CK.map(function(k){
      var a = share(C, k[0]), b = share(ALL, k[0]);
      return '<div class="mk-bar"><span class="nm">' + k[1] + '</span><div class="tr">' +
        '<div class="ln"><span class="t" role="img" aria-label="' + esc(label) + ': ' + pct(a) + '"><i style="width:' + (a * 100) + '%"></i></span><span>' + pct(a) + ' here</span></div>' +
        '<div class="ln all"><span class="t" role="img" aria-label="All markets: ' + pct(b) + '"><i style="width:' + (b * 100) + '%"></i></span><span>' + pct(b) + ' all</span></div></div></div>';
    }).join('') + '</div><div class="mk-leg"><span style="--c:var(--hivis)">' + esc(label) + '</span><span style="--c:#9AA1A8">All ' + fmt(ALL.length) + ' projects, every market</span></div>';
  }
  function levels(C){
    var n = {}, tot = 0; C.forEach(function(c){ var v = c.verified || {}; CK.forEach(function(k){ var l = v[k[0]] || 'none'; n[l] = (n[l] || 0) + 1; tot++; }); });
    if (!tot) return '';
    return '<div class="mk-stack" role="img" aria-label="' + LV.map(function(l){ return l[1] + ' ' + Math.round((n[l[0]] || 0) / tot * 100) + '%'; }).join(', ') + '">' +
      LV.map(function(l){ return '<i style="width:' + ((n[l[0]] || 0) / tot * 100) + '%;background:' + l[2] + '" title="' + l[1] + ': ' + (n[l[0]] || 0) + '"></i>'; }).join('') + '</div>' +
      '<div class="mk-leg">' + LV.map(function(l){ return '<span style="--c:' + l[2] + '">' + l[1] + ' <b>' + Math.round((n[l[0]] || 0) / tot * 100) + '%</b> (' + fmt(n[l[0]] || 0) + ')</span>'; }).join('') + '</div>' +
      '<p class="mk-note">' + fmt(tot) + ' checks in total: 6 per project. Registry and Confirmed mean an official register or an independent source backs what the developer says.</p>';
  }
  // n25e: named projects link to their page directly (/p/<id>/ is a 301); the map comes from the server (#kb-slugs), Sumba ids are not in it
  var SLUGS = {}; try { SLUGS = JSON.parse((document.getElementById('kb-slugs') || {}).textContent || '{}') || {}; } catch (e) {}
  function byScore(a, b){ return (b.score || 0) / (b.max || 6) - (a.score || 0) / (a.max || 6) || (b.vscore || 0) - (a.vscore || 0) || (a.id < b.id ? -1 : 1); }
  function row(c, showMarket){
    var bd = [];
    if (overdue(c)) bd.push((c.overdue ? '<span class="mk-b od">Overdue ' + c.overdue + ' mo</span>' : '<span class="mk-b od">Delayed ' + c.delay + ' mo</span>'));
    if (contra(c)) bd.push('<span class="mk-b ct">Contradicted</span>');
    if (flagged(c)) bd.push('<span class="mk-b fl">' + (c.flags.length === 1 ? '1 flag' : c.flags.length + ' flags') + '</span>');
    var meta = [showMarket ? c.market : '', c.stage ? c.stage.charAt(0).toUpperCase() + c.stage.slice(1) : 'Stage not stated', c.band || 'Price not stated'].filter(Boolean).join(' · ');
    return '<li><a class="mk-row" href="' + (SLUGS[c.id] ? '/projects/' + SLUGS[c.id] + '/' : '/p/' + encodeURIComponent(c.id) + '/') + '"><span class="id">' + esc(c.id) + '</span><span class="meta">' + esc(meta) + '</span>' +
      '<span class="sc"><span class="mk-col">Published </span><b>' + (c.score || 0) + '</b>/' + (c.max || 6) + '</span>' +
      '<span class="cf"><span class="mk-col">Confirmed </span><b>' + (c.vscore || 0) + '</b>/' + (c.max || 6) + '</span>' +
      '<span class="bd">' + bd.join('') + '</span></a></li>';
  }
  function listSec(C, label, showMarket){
    var top = C.slice().sort(byScore).slice(0, 4).map(function(c){ return c.id; });
    var h = '<section class="mk-sec" id="projects"><div class="wrap"><p class="eyebrow">Projects</p><h2>All ' + C.length + ' project' + (C.length === 1 ? '' : 's') + ' tracked in ' + esc(label) + '</h2>' +
      '<p class="sub">Each project also has its own page with its name and sourced facts. Published is how many of the 6 checks the developer makes public; confirmed is how many an official or independent source backs.</p>' +
      '<div class="mk-tools" role="group" aria-label="Sort projects"><span class="lbl">Sort</span>' +
      '<button type="button" class="mk-sort" data-s="desc" aria-pressed="true">Score, high to low</button><button type="button" class="mk-sort" data-s="asc" aria-pressed="false">Score, low to high</button><button type="button" class="mk-sort" data-s="id" aria-pressed="false">ID</button></div>' +
      '<ol class="mk-list" id="mk-list"></ol><div class="mk-acts">';
    if (top.length >= 2) h += '<a class="btn btn-hi" href="/compare/?ids=' + top.map(encodeURIComponent).join(',') + '">Compare the top ' + top.length + '</a>';
    h += '<a class="btn btn-line" href="/database#ask">Ask about this market</a></div></div></section>';
    return { html: h, draw: function(mode){
      var s = C.slice().sort(byScore); if (mode === 'asc') s.reverse(); if (mode === 'id') s.sort(function(a, b){ return a.id < b.id ? -1 : 1; });
      $('mk-list').innerHTML = '<li class="mk-hd" aria-hidden="true"><span>Project</span><span>' + (showMarket ? 'Market, stage, price' : 'Stage, price') + '</span><span>Published</span><span>Confirmed</span><span>Signals</span></li>' + s.map(function(c){ return row(c, showMarket); }).join('');
    } };
  }
  function wireSort(draw){
    draw('desc');
    document.querySelectorAll('.mk-sort').forEach(function(b){ b.addEventListener('click', function(){
      document.querySelectorAll('.mk-sort').forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); draw(b.dataset.s);
    }); });
  }
  function chips(list, cur){ return '<ul class="mk-mk">' + list.map(function(x){ return '<li><a href="' + x.href + '"' + (x.name === cur ? ' aria-current="page"' : '') + '>' + esc(x.name) + ' <small>' + x.n + '</small></a></li>'; }).join('') + '</ul>'; }
  function cta(){ return '<section class="mk-sec mk-cta"><div class="wrap"><p class="eyebrow">Buying here?</p><h2>Check the project you are looking at</h2><p class="sub">Paste a listing and see what the developer publishes and what nobody has confirmed yet.</p><div class="mk-acts"><a class="btn btn-hi" href="/check">Check a project</a><a class="btn btn-line" href="/transparency-index/">Transparency index</a></div></div></section>'; }
  function tiBlock(r, minN, total){
    if (!r) return '<div class="mk-ti"><div class="big">n/a</div><div><h2>Transparency index</h2><p>Not ranked yet: the index needs at least ' + minN + ' tracked projects in a market. <a href="/transparency-index/">How the index works</a>.</p></div></div>';
    return '<div class="mk-ti"><div class="big">' + r.index.toFixed(1) + '<small>/100</small></div><div><h2>Off-plan Transparency Index</h2><p>60% disclosure, 30% confirmed by a registry or independent source, 10% free of public problems. <a href="/transparency-index/">Full ranking and method</a>.</p><span class="rk">Rank ' + r.rank + ' of ' + total + '</span></div>' +
      '<div class="mk-parts"><div><b>' + pct(r.disclosure) + '</b>average disclosure</div><div><b>' + pct(r.confirmed) + '</b>average confirmed</div><div><b>' + pct(r.noflags) + '</b>projects with no flags</div></div></div>';
  }

  function renderIndex(d, miss){
    var C = d.cases || [], G = {};
    C.forEach(function(c){ var g = G[c.country] = G[c.country] || {}; g[c.market] = (g[c.market] || 0) + 1; });
    var cs = Object.keys(G).sort();
    var nm = 0; cs.forEach(function(c){ nm += Object.keys(G[c]).length; });
    $('mk-root').innerHTML = '<p class="eyebrow">Market files</p><h1 id="mk-h1">Every off-plan market we track</h1>' +
      (miss ? '<p class="lead">We have no market or country called "' + esc(miss) + '" yet. Pick one below, or <a href="/check">tell us about your project</a>.</p>' : '<p class="lead">' + fmt(C.length) + ' projects in ' + nm + ' markets and ' + cs.length + ' countries. Pick a market for its disclosure numbers, transparency index and project list.</p>');
    $('mk-body').innerHTML = '<section class="mk-sec"><div class="wrap"><h2>Markets by country</h2><div class="mk-grp">' + cs.map(function(c){
      var ms = Object.keys(G[c]).sort(), tot = ms.reduce(function(s, m){ return s + G[c][m]; }, 0);
      return '<section><h3>' + (ms.length > 1 ? '<a href="' + clink(c) + '">' + esc(c) + '</a>' : esc(c)) + ' <small style="color:var(--muted);font-weight:600">' + tot + '</small></h3>' + chips(ms.map(function(m){ return { name: m, n: G[c][m], href: mlink(m) }; })) + '</section>';
    }).join('') + '</div></div></section>' + cta();
    setMeta(miss ? 'Market not found: all off-plan markets | Kolaboro' : 'Off-plan market files: ' + nm + ' markets, ' + cs.length + ' countries | Kolaboro',
      'Disclosure, verification and transparency index for every off-plan property market Kolaboro tracks: ' + fmt(C.length) + ' projects in ' + nm + ' markets.', BASE);
  }

  function renderMarket(d, market, R){
    var ALL = d.cases || [], C = ALL.filter(function(c){ return c.market === market; }), country = C[0].country;
    var r = R.rows.filter(function(x){ return x.market === market; })[0], place = market === country ? market : market + ', ' + country, pl = C.length === 1 ? '' : 's';
    var sib = {}; ALL.forEach(function(c){ if (c.country === country && c.market !== market) sib[c.market] = (sib[c.market] || 0) + 1; });
    var sibs = Object.keys(sib).sort();
    $('mk-crumb').innerHTML = ' / ' + esc(market);
    $('mk-root').innerHTML = '<p class="eyebrow">Market file · ' + esc(country) + '</p><h1 id="mk-h1">Off-plan in ' + esc(market) + '</h1>' +
      '<p class="lead">' + C.length + ' project' + (C.length === 1 ? '' : 's') + ' tracked in ' + esc(place) + '. What developers publish, what an official or independent source confirms, and what is contradicted. Data updated ' + esc(K.fmtDate ? K.fmtDate(d.updated) : d.updated) + '.</p>' +
      '<div class="mk-tags"><span class="mk-tag">' + esc(country) + '</span><span class="mk-tag"><b>' + C.length + '</b> project' + (C.length === 1 ? '' : 's') + ' tracked</span>' + stageTags(C) + '</div>' + tiBlock(r, K.MIN || 3, R.rows.length);
    var L = listSec(C, market, false);
    $('mk-body').innerHTML =
      '<section class="mk-sec"><div class="wrap"><p class="eyebrow">Key numbers</p><h2>What ' + esc(market) + ' developers publish</h2>' + kpis(C) + '</div></section>' +
      '<section class="mk-sec"><div class="wrap"><p class="eyebrow">The six checks</p><h2>' + esc(market) + ' against every market</h2><p class="sub">Share of projects that publish each thing a buyer needs, here and across all ' + fmt(ALL.length) + ' projects.</p>' + bars(C, ALL, market) + '</div></section>' +
      '<section class="mk-sec"><div class="wrap"><p class="eyebrow">Verification</p><h2>Who backs what developers say</h2><p class="sub">Every check on every ' + esc(market) + ' project, by the strongest source we found.</p>' + levels(C) + '</div></section>' +
      '<section class="mk-sec" id="indices"><div class="wrap"><p class="eyebrow">Indices</p><h2>' + esc(market) + ' on our six indices</h2><p class="sub">Delay, promises, hazards, company records, insolvency notices and asking prices for this market, each from the public file behind its page.</p><div id="mk-ind" class="mk-ind" aria-live="polite"><p class="sub">Loading the indices.</p></div></div></section>' +
      L.html +
      '<section class="mk-sec"><div class="wrap"><p class="eyebrow">More</p><h2>' + (sibs.length ? 'Other markets in ' + esc(country) : 'Other markets') + '</h2>' +
      (sibs.length ? chips(sibs.map(function(m){ return { name: m, n: sib[m], href: mlink(m) }; })) + '<div class="mk-acts"><a class="btn btn-line" href="' + clink(country) + '">All of ' + esc(country) + '</a>' : '<p class="sub">' + esc(market) + ' is the only market we track in ' + esc(country) + ' so far.</p><div class="mk-acts">') +
      '<a class="btn btn-line" href="/transparency-index/">Transparency index</a><a class="btn btn-line" href="/m/">All markets</a></div></div></section>' + cta();
    wireSort(L.draw); indices(market);
    var t = 'Off-plan in ' + place + ': ' + C.length + ' project' + pl + ' checked | Kolaboro';
    var desc = C.length + ' off-plan project' + pl + ' in ' + market + ': ' + pct(share(C, 'permit')) + ' publish a permit number, ' + pct(share(C, 'escrow')) + ' publish deposit protection' + (r ? ', transparency index ' + r.index.toFixed(1) + ' (rank ' + r.rank + ' of ' + R.rows.length + ')' : '') + '.';
    setMeta(t, desc, BASE + encodeURIComponent(market.toLowerCase().replace(/\s+/g, '-')) + '/');
  }

  /* Indices block: /api/x/ins/indices (block X6) reads delay-index, promises, hazards, company graph, insolvency watch and price index */
  function indices(market){
    var box = $('mk-ind'); if (!box || !window.fetch) return;
    fetch('/api/x/ins/indices?market=' + encodeURIComponent(market)).then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); }).then(function(o){
      box.innerHTML = '<ul class="mk-ix">' + (o.indices || []).map(function(x){
        return '<li class="' + (x.status === 'ok' ? 'ix-ok' : 'ix-thin') + '"><a href="' + esc(x.href) + '"><span class="k">' + esc(x.label) + '</span><b>' + (x.status === 'ok' || x.value ? esc(x.value || '') : 'Not enough data') + '</b><span class="t">' + esc(x.text) + '</span>' + (x.as_of ? '<span class="d">Data ' + esc(x.as_of) + '. Source page &rarr;</span>' : '<span class="d">Source page &rarr;</span>') + '</a></li>';
      }).join('') + '</ul><p class="sub" style="margin-top:12px">' + esc(o.note || '') + ' JSON: <a href="/api/x/ins/indices?market=' + encodeURIComponent(market) + '">/api/x/ins/indices</a>.</p>';
    }).catch(function(){ box.innerHTML = '<p class="sub">The indices could not load right now. Open them directly: <a href="/index/delays/">delay index</a>, <a href="/promises/">promises</a>, <a href="/hazards/">hazards</a>, <a href="/graph/global/">company graph</a>, <a href="/tools/insolvency-check/">insolvency</a>, <a href="/index/prices/">price index</a>.</p>'; });
  }

  function renderCountry(d, country, R){
    var ALL = d.cases || [], C = ALL.filter(function(c){ return c.country === country; }), M = {};
    C.forEach(function(c){ M[c.market] = (M[c.market] || 0) + 1; });
    var ms = Object.keys(M).sort(function(a, b){ return M[b] - M[a] || (a < b ? -1 : 1); });
    var RI = {}; R.rows.forEach(function(r){ RI[r.market] = r; });
    $('mk-crumb').innerHTML = ' / ' + esc(country);
    $('mk-root').innerHTML = '<p class="eyebrow">Country file</p><h1 id="mk-h1">Off-plan in ' + esc(country) + '</h1>' +
      '<p class="lead">' + C.length + ' projects tracked across ' + ms.length + ' market' + (ms.length === 1 ? '' : 's') + ' in ' + esc(country) + '. Data updated ' + esc(K.fmtDate ? K.fmtDate(d.updated) : d.updated) + '.</p>' +
      '<div class="mk-tags"><span class="mk-tag"><b>' + ms.length + '</b> market' + (ms.length === 1 ? '' : 's') + '</span><span class="mk-tag"><b>' + C.length + '</b> project' + (C.length === 1 ? '' : 's') + ' tracked</span>' + stageTags(C) + '</div>';
    var L = listSec(C, country, true);
    $('mk-body').innerHTML =
      '<section class="mk-sec"><div class="wrap"><p class="eyebrow">Markets</p><h2>Markets in ' + esc(country) + '</h2><p class="sub">Transparency index and rank of ' + R.rows.length + ' where a market has at least ' + (K.MIN || 3) + ' projects.</p><div class="mk-cards">' + ms.map(function(m){
        var r = RI[m]; return '<a class="mk-card" href="' + mlink(m) + '"><b>' + esc(m) + '</b><span>' + M[m] + ' project' + (M[m] === 1 ? '' : 's') + '</span><strong>' + (r ? r.index.toFixed(1) : 'n/a') + '</strong><span>' + (r ? 'Index, rank ' + r.rank + ' of ' + R.rows.length : 'Not ranked yet') + '</span></a>';
      }).join('') + '</div></div></section>' +
      '<section class="mk-sec"><div class="wrap"><p class="eyebrow">Key numbers</p><h2>What developers in ' + esc(country) + ' publish</h2>' + kpis(C) + '</div></section>' +
      '<section class="mk-sec"><div class="wrap"><p class="eyebrow">The six checks</p><h2>' + esc(country) + ' against every market</h2>' + bars(C, ALL, country) + '</div></section>' +
      '<section class="mk-sec"><div class="wrap"><p class="eyebrow">Verification</p><h2>Who backs what developers say</h2>' + levels(C) + '</div></section>' +
      L.html +
      '<section class="mk-sec"><div class="wrap"><div class="mk-acts" style="margin-top:0"><a class="btn btn-line" href="/transparency-index/">Transparency index</a><a class="btn btn-line" href="/m/">All markets</a></div></div></section>' + cta();
    wireSort(L.draw);
    setMeta('Off-plan in ' + country + ': ' + C.length + ' projects in ' + ms.length + ' markets | Kolaboro',
      C.length + ' off-plan projects across ' + ms.length + ' markets in ' + country + ': ' + pct(share(C, 'permit')) + ' publish a permit number, ' + pct(share(C, 'escrow')) + ' publish deposit protection.', BASE + '?country=' + encodeURIComponent(country));
  }

  var url = (K.dataUrl ? K.dataUrl() : '/data/bali-cases.json?t=' + Math.floor(Date.now() / 6e5));
  fetch(url).then(function(r){ if (!r.ok) throw new Error('data ' + r.status); return r.json(); }).then(function(d){
    var C = d.cases || [], p = params(), mk = {}, co = {};
    C.forEach(function(c){ if (c.market) mk[norm(c.market)] = c.market; if (c.country) co[norm(c.country)] = c.country; });
    var R = K.compute ? K.compute(d) : { rows: [] };
    var qm = norm(p.m), qc = norm(p.c);
    if (qc && co[qc]) return renderCountry(d, co[qc], R);
    if (qm && mk[qm]) return renderMarket(d, mk[qm], R);
    if (qm && co[qm]) return renderCountry(d, co[qm], R);
    renderIndex(d, p.m || p.c);
  }).catch(function(){
    $('mk-root').innerHTML = '<p class="eyebrow">Market file</p><h1 id="mk-h1">Off-plan market file</h1><p class="lead">The data could not load right now. Try again in a minute, or open the <a href="/database">database</a>.</p>';
  });
})();
