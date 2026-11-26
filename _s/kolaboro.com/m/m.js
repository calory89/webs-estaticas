/* Kolaboro market file: /m/?market=Bali or /m/?market=Indonesia (country). Everything computed from /data/bali-cases.json */
(function(){
  var CK = [['permit','Permit or licence number'],['escrow','Deposit protection'],['progress','Construction progress'],['plans','Site or floor plans'],['record','Developer track record'],['returns_ok','No guaranteed returns']];
  var LV = [['registry','Registry','var(--k-viz-reg,#155C75)'],['independent','Confirmed','var(--k-viz-ok,#2F8A5B)'],['developer','Not confirmed','var(--k-viz-dev,#AEB8BC)'],['contradicted','Contradicted','var(--k-viz-bad,#C2410C)'],['none','Not published','var(--k-viz-track,#E3E8E7)']];
  var ST = [['off-plan','off-plan'],['under construction','under construction'],['completed','completed, still selling']];
  var BASE = 'https://kolaboro.com/m/';
  var ssrEl = document.getElementById('ssr'); if (ssrEl) ssrEl.remove();
  // r4u: styles of the key-facts section (#n37-facts, kbx_n37u.js), moved out of the HTML to keep market pages under their weight budget
  if (document.getElementById('n37-facts')) { var n37s = document.createElement('style'); n37s.textContent = '.n37-tw{overflow-x:auto;border:1px solid var(--k-line,#D5DCDB);border-radius:12px;margin:10px 0 18px}.n37 table{width:100%;border-collapse:collapse;font-size:.93rem}.n37 th,.n37 td{padding:8px 12px;border-bottom:1px solid var(--k-line,#D5DCDB);text-align:start;vertical-align:top}.n37 td.n{font-variant-numeric:tabular-nums;white-space:nowrap}.n37 tbody th a{color:inherit;text-decoration-style:dotted}.n37-rel{display:flex;flex-wrap:wrap;gap:4px 18px;list-style:none;padding:0}.n37-rel a{display:inline-flex;align-items:center;min-height:44px}.n37 .k-xs{font-size:.9rem}'; document.head.appendChild(n37s); }
  var $ = function(i){ return document.getElementById(i); };
  var K = window.KTI || {};
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s){ s = String(s || '').toLowerCase().trim(); try { s = s.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) {} return s.replace(/[-_+]+/g, ' ').replace(/\s+/g, ' '); }
  function pct(x){ return Math.round(x * 100) + '%'; }
  function fmt(n){ return (n || 0).toLocaleString('en'); }
  function ok(c, k){ var x = c.checks || {}; return k === 'permit' ? x.permit === 2 : k === 'escrow' ? x.escrow === true : k === 'progress' ? x.progress != null : !!x[k]; }
  function share(C, k){ return C.length ? C.filter(function(c){ return ok(c, k); }).length / C.length : 0; }
  function mlink(m){ return '/m/' + encodeURIComponent(String(m).toLowerCase().replace(/\s+/g, '-')) + '/'; }   // n33a: clean market path (the ?market= form answers 301 to it)
  function clink(c){ return '/m/?country=' + encodeURIComponent(c); }
  function overdue(c){ return (c.overdue || 0) > 0 || (c.delay || 0) > 0; }
  function contra(c){ return ((c.claims || {}).contradicted || 0) > 0; }
  function flagged(c){ return (c.flags || []).length > 0; }
  function setMeta(t, d, url){
    var q = function(s){ return document.querySelector(s); };
    var l0 = q('link[rel="canonical"]'); if (l0 && l0.getAttribute('href') === url) return;   // n40 k20: the server already wrote this market's title and description (the title test in /data/ctr-changes.tsv); keep them
    document.title = t;
    var md = q('meta[name="description"]'); if (md) md.setAttribute('content', d);
    var a = q('meta[property="og:title"]'); if (a) a.setAttribute('content', t);
    var b = q('meta[property="og:description"]'); if (b) b.setAttribute('content', d);
    var l = q('link[rel="canonical"]'); if (l) l.setAttribute('href', url);
    var o = q('meta[property="og:url"]'); if (o) o.setAttribute('content', url);
  }
  function params(){ var p; try { p = new URLSearchParams(location.search); } catch (e) { return { m: '', c: '' }; } var pm = (location.pathname.match(/^\/m\/([^\/]{2,60})\/?$/) || [])[1]; return { m: p.get('market') || (pm ? decodeURIComponent(pm).replace(/-/g, ' ') : ''), c: p.get('country') || '' }; }

  function stageTags(C){
    var n = {}; C.forEach(function(c){ n[c.stage] = (n[c.stage] || 0) + 1; });
    var t = ST.filter(function(s){ return n[s[0]]; }).map(function(s){ return '<span class="mk-tag"><b>' + fmt(n[s[0]]) + '</b> ' + s[1] + '</span>'; });
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
      [pct(share(C, 'progress')), 'publish construction progress'],   // n40 d9: the delay counts now sit in the key figures at the top (named.json definitions)
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
    }).join('') + '</div><div class="mk-leg"><span style="--c:var(--k-viz-reg,#155C75)">' + esc(label) + '</span><span style="--c:var(--k-viz-ref,#8A949C)">All ' + fmt(ALL.length) + ' projects, every market</span></div>';
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
  // r4u: the map is fetched next to the project data (data-src), so it no longer weighs on every market page
  var SLE = document.getElementById('kb-slugs'), SLP = (SLE && SLE.getAttribute('data-src') && window.fetch) ? fetch(SLE.getAttribute('data-src')).then(function(r){ return r.ok ? r.json() : {}; }).then(function(o){ for (var k in o) SLUGS[k] = o[k]; }).catch(function(){}) : null;
  function byScore(a, b){ return (b.score || 0) / (b.max || 6) - (a.score || 0) / (a.max || 6) || (b.vscore || 0) - (a.vscore || 0) || (a.id < b.id ? -1 : 1); }
  var STB = { 'off-plan': ['Off-plan', 'op'], 'under construction': ['Under construction', 'uc'], 'completed': ['Completed, still selling', 'cp'] };
  function nm(c){ var n = SLUGS._n && SLUGS._n[c.id]; return n ? n[0] : ''; }
  function row(c, showMarket){
    var bd = [];
    if (overdue(c)) bd.push((c.overdue ? '<span class="mk-b od">Overdue ' + c.overdue + ' mo</span>' : '<span class="mk-b od">Delayed ' + c.delay + ' mo</span>'));
    if (contra(c)) bd.push('<span class="mk-b ct">Contradicted</span>');
    if (flagged(c)) bd.push('<span class="mk-b fl">' + (c.flags.length === 1 ? '1 flag' : c.flags.length + ' flags') + '</span>');
    var n = SLUGS._n && SLUGS._n[c.id], sg = STB[c.stage] || ['Stage not stated', 'ns'];
    var meta = [showMarket ? c.market : '', c.band || 'Price not stated'].filter(Boolean).join(', ');
    var pub = c.score || 0, mx = c.max || 6, cf = c.vscore || 0;
    return '<li><a class="mk-row" href="' + (SLUGS[c.id] ? '/projects/' + SLUGS[c.id] + '/' : '/p/' + encodeURIComponent(c.id) + '/') + '"><span class="id">' + (n ? '<span class="nm">' + esc(n[0]) + '</span><span class="dv">' + esc(n[1] ? n[1] + ', ' : '') + esc(c.id) + '</span>' : esc(c.id)) + '</span>' +
      '<span class="meta"><span class="mk-st ' + sg[1] + '">' + sg[0] + '</span> ' + esc(meta) + '</span>' +
      '<span class="sc"><span class="mk-col">Published </span><b>' + pub + '</b>/' + mx + '<i class="mk-m" aria-hidden="true"><i style="width:' + Math.round(100 * pub / mx) + '%"></i></i></span>' +
      '<span class="cf"><span class="mk-col">Confirmed </span><b>' + cf + '</b>/' + mx + '<i class="mk-m cf" aria-hidden="true"><i style="width:' + Math.round(100 * cf / mx) + '%"></i></i></span>' +
      '<span class="bd">' + bd.join('') + '</span></a></li>';
  }
  var SORTS = [['desc', 'Published, high to low'], ['asc', 'Published, low to high'], ['conf', 'Confirmed, high to low'], ['name', 'Name, A to Z']];
  function listSec(C, label, showMarket){
    var top = C.slice().sort(byScore).slice(0, 4).map(function(c){ return c.id; });
    var h = '<section class="mk-sec" id="projects"><div class="wrap"><p class="eyebrow">Projects</p><h2>All ' + fmt(C.length) + ' project' + (C.length === 1 ? '' : 's') + ' tracked in ' + esc(label) + '</h2>' +
      '<p class="sub">Published is how many of the 6 buyer checks the developer makes public; confirmed is how many an official or independent source backs. Open a project for its sourced facts.</p>' +
      '<div class="mk-tools mk-sorts" role="group" aria-label="Sort projects"><span class="lbl">Sort</span>' +
      SORTS.map(function(x, i){ return '<button type="button" class="mk-sort" data-s="' + x[0] + '" aria-pressed="' + (i ? 'false' : 'true') + '">' + x[1] + '</button>'; }).join('') + '</div>' + filt(C) +
      '<ol class="mk-list" id="mk-list"></ol><div class="mk-more" id="mk-more"></div><div class="mk-acts">';
    if (top.length >= 2) h += '<a class="btn btn-hi" href="/compare/?ids=' + top.map(encodeURIComponent).join(',') + '">Compare the top ' + top.length + '</a>';
    h += '<a class="btn btn-line" href="/database#ask">Ask about this market</a></div></div></section>';
    var hs = function(k, t, m){ var on = m === k || (k === 'desc' && m === 'asc'); return '<span' + (on ? ' class="on"' : '') + '><button type="button" class="mk-hs" data-s="' + (k === 'desc' && m === 'desc' ? 'asc' : k) + '" aria-label="Sort by ' + t.toLowerCase() + '">' + t + '<i aria-hidden="true">' + (on ? (m === 'asc' ? '↑' : '↓') : '↕') + '</i></button></span>'; };
    var R = [], shown = 0, PAGE = 50;
    function more(n){ var el = $('mk-list'), add = R.slice(shown, shown + n); if (add.length) el.insertAdjacentHTML('beforeend', add.join('')); shown += add.length; bar(); }
    function bar(){ var mb = $('mk-more'); if (!mb) return; var left = R.length - shown;
      mb.innerHTML = R.length ? '<p class="mk-cnt" role="status">Showing ' + fmt(shown) + ' of ' + fmt(R.length) + ' project' + (R.length === 1 ? '' : 's') + '</p>' + (left > 0 ? '<button type="button" class="btn btn-line" id="mk-mb">Show ' + Math.min(PAGE, left) + ' more</button>' + (left > PAGE ? '<button type="button" class="btn btn-line" id="mk-all">Show all ' + fmt(R.length) + '</button>' : '') : '') : '';
      var b1 = $('mk-mb'), b2 = $('mk-all'); if (b1) b1.onclick = function(){ var f = shown; more(PAGE); focusRow(f); }; if (b2) b2.onclick = function(){ var f = shown; more(R.length); focusRow(f); }; }
    function focusRow(i){ var a = document.querySelectorAll('#mk-list .mk-row')[i]; if (a) a.focus({ preventScroll: false }); }
    return { html: h, draw: function(mode){
      var s = C.filter(pass).sort(byScore); if (mode === 'asc') s.reverse();
      if (mode === 'conf') s.sort(function(a, b){ return (b.vscore || 0) - (a.vscore || 0) || byScore(a, b); });
      if (mode === 'name') s.sort(function(a, b){ var x = nm(a) || a.id, y = nm(b) || b.id; return x.localeCompare(y, 'en', { sensitivity: 'base' }); });
      R = s.map(function(c){ return row(c, showMarket); }); shown = 0;
      var el = $('mk-list');
      // n40 d9: 50 rows at first and on each "Show more" (Dubai rendered all 1,154 rows, 62,000 px); the header row stays on screen while the list scrolls
      el.innerHTML = '<li class="mk-hd">' + hs('name', 'Project', mode) + '<span>' + (showMarket ? 'Market, stage, price' : 'Stage, price') + '</span>' + hs('desc', 'Published', mode) + hs('conf', 'Confirmed', mode) + '<span>Signals</span></li>' +
        (R.length ? '' : '<li class="mk-none"><p><b>No project matches these filters.</b> ' + fmt(C.length) + ' projects are tracked here; try another handover year or permit option.</p><button type="button" class="btn btn-line" id="mk-clr">Clear filters</button></li>');
      more(PAGE);
      var st = $('mk-fn'); if (st) st.textContent = (FIL.hy || FIL.pn) ? fmt(R.length) + ' of ' + fmt(C.length) + ' projects match' : '';
      var clr = $('mk-clr'); if (clr) clr.onclick = function(){ ['mk-hy', 'mk-pn'].forEach(function(id){ var x = $(id); if (x) { x.value = ''; x.dispatchEvent(new Event('change')); } }); };
      el.querySelectorAll('.mk-hs').forEach(function(b){ b.onclick = function(){ setMode(b.dataset.s); }; });
    } };
  }
  // n40 k4 (R02-41): filter by handover year and permit number without a reload; the state lives in the URL (?hy=2027&pn=yes), so a filtered list can be shared
  var FIL = (function(){ var q = new URLSearchParams(location.search), hy = q.get('hy') || '', pn = q.get('pn') || ''; return { hy: /^(\d{4}|none)$/.test(hy) ? hy : '', pn: /^(yes|no)$/.test(pn) ? pn : '' }; })();
  function pass(c){ var y = c.done ? String(c.done) : 'none'; return (!FIL.hy || FIL.hy === y) && (!FIL.pn || (FIL.pn === 'yes') === ok(c, 'permit')); }
  function filt(C){
    var Y = {}, none = 0; C.forEach(function(c){ if (c.done) Y[c.done] = (Y[c.done] || 0) + 1; else none++; });
    var o = function(v, t, cur){ return '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + esc(t) + '</option>'; };
    return '<div class="mk-tools mk-filt" role="group" aria-label="Filter projects"><span class="lbl">Filter</span>' +
      '<label>Handover year <select id="mk-hy">' + o('', 'Any year', FIL.hy) + Object.keys(Y).sort().map(function(y){ return o(y, y + ' (' + Y[y] + ')', FIL.hy); }).join('') + (none ? o('none', 'Not stated (' + none + ')', FIL.hy) : '') + '</select></label>' +
      '<label>Permit number <select id="mk-pn">' + o('', 'Any', FIL.pn) + o('yes', 'Published', FIL.pn) + o('no', 'Not published', FIL.pn) + '</select></label>' +
      '<span class="mk-fn" id="mk-fn" role="status" aria-live="polite"></span></div>';
  }
  var setMode = function(){};
  function wireSort(draw){
    var mode = 'desc';
    setMode = function(m){ mode = m; document.querySelectorAll('.mk-sort').forEach(function(x){ x.setAttribute('aria-pressed', x.dataset.s === m ? 'true' : 'false'); }); draw(mode); };
    draw(mode);
    ['mk-hy', 'mk-pn'].forEach(function(id){ var el = $(id); if (el) el.addEventListener('change', function(){
      FIL[id === 'mk-hy' ? 'hy' : 'pn'] = el.value;
      var q = new URLSearchParams(location.search); ['hy', 'pn'].forEach(function(k){ if (FIL[k]) q.set(k, FIL[k]); else q.delete(k); });
      try { history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash); } catch (e) {}
      draw(mode);
    }); });
    document.querySelectorAll('.mk-sort').forEach(function(b){ b.addEventListener('click', function(){ setMode(b.dataset.s); }); });
  }
  function chips(list, cur){ return '<ul class="mk-mk">' + list.map(function(x){ return '<li><a href="' + x.href + '"' + (x.name === cur ? ' aria-current="page"' : '') + '>' + esc(x.name) + ' <small>' + x.n + '</small></a></li>'; }).join('') + '</ul>'; }
  function cta(){ return '<section class="mk-sec mk-cta"><div class="wrap"><p class="eyebrow">Buying here?</p><h2>Check the project you are looking at</h2><p class="sub">Paste a listing and see what the developer publishes and what nobody has confirmed yet.</p><div class="mk-acts"><a class="btn btn-hi" href="/check">Check a project</a><a class="btn btn-line" href="/transparency-index/">Transparency index</a></div></div></section>'; }
  function tiBlock(r, minN, total){
    if (!r) return '<div class="mk-ti"><div class="big">n/a</div><div><h2>Transparency index</h2><p>Not ranked yet: the index needs at least ' + minN + ' tracked projects in a market. <a href="/transparency-index/">How the index works</a>.</p></div></div>';
    return '<div class="mk-ti"><div class="big">' + r.index.toFixed(1) + '<small>/100</small></div><div><h2>Off-plan Transparency Index</h2><p>60% disclosure, 30% confirmed by a registry or independent source, 10% free of public problems. <a href="/transparency-index/">Full ranking and method</a>.</p><span class="rk">Rank ' + r.rank + ' of ' + total + '</span></div>' +
      '<div class="mk-parts"><div><b>' + pct(r.disclosure) + '</b>average disclosure</div><div><b>' + pct(r.confirmed) + '</b>average confirmed</div><div><b>' + pct(r.noflags) + '</b>projects with no flags</div></div></div>';
  }

  function renderIndex(d, miss){
    var C = (d.cases || []).filter(function(c){ return !/sumba|eco\s*beach|equinox/i.test(String(c.market) + ' ' + String(c.name || '')); }), G = {};   // n33a: Sumba only in the transparency ranking
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
      '<p class="lead">' + fmt(C.length) + ' project' + (C.length === 1 ? '' : 's') + ' tracked in ' + esc(place) + '. What developers publish, what an official or independent source confirms, and what is contradicted. Data updated ' + esc(K.fmtDate ? K.fmtDate(d.updated) : d.updated) + '.</p>' +
      '<div class="mk-tags"><span class="mk-tag">' + esc(country) + '</span><span class="mk-tag"><b>' + fmt(C.length) + '</b> project' + (C.length === 1 ? '' : 's') + ' tracked</span>' + stageTags(C) + '</div>' + tiBlock(r, K.MIN || 3, R.rows.length);
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
      '<div class="mk-tags"><span class="mk-tag"><b>' + ms.length + '</b> market' + (ms.length === 1 ? '' : 's') + '</span><span class="mk-tag"><b>' + fmt(C.length) + '</b> project' + (C.length === 1 ? '' : 's') + ' tracked</span>' + stageTags(C) + '</div>';
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
  fetch(url).then(function(r){ if (!r.ok) throw new Error('data ' + r.status); return r.json(); }).then(function(d){ return SLP ? SLP.then(function(){ return d; }) : d; }).then(function(d){
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
