/* Kolaboro /graph/: anonymised company and director graph (UK, Companies House) and exact-name court search.
   Data: /data/company-graph.json (weekly batch) and /api/x/q/*. d3 v7 from cdnjs with SRI, loaded on demand. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fmt = function (n) { return n == null ? '-' : Number(n).toLocaleString('en-US'); };
  var D3 = 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js';
  var D3_SRI = 'sha384-su5kReKyYlIFrI62mbQRKXHzFobMa7BHp1cK6julLPbnYcCW9NIZKJiTODjLPeDh';
  var d3p = null;
  function loadD3() {
    if (window.d3) return Promise.resolve(window.d3);
    if (d3p) return d3p;
    d3p = new Promise(function (ok, no) {
      var s = document.createElement('script'); s.src = D3; s.integrity = D3_SRI; s.crossOrigin = 'anonymous';
      s.onload = function () { ok(window.d3); }; s.onerror = function () { d3p = null; no(new Error('d3 did not load')); };
      document.head.appendChild(s);
    });
    return d3p;
  }
  var COL = { project: '#17212B', named: '#FF5B14', director: '#2F5E8C', active: '#086146', dissolved: '#8A9199', insolvency: '#9A2412', 'strike-off proposed': '#B7791F', closed: '#8A9199', other: '#8A9199', unknown: '#8A9199' };
  function nodeColor(n) {
    if (n.type === 'project') return COL.project;
    if (n.type === 'director') return COL.director;
    if (n.type === 'group') return COL.active;
    if (n.role === 'named') return n.status === 'active' ? COL.named : (COL[n.status] || COL.other);
    return COL[n.status] || COL.other;
  }
  function radius(n) {
    if (n.type === 'project') return 15;
    if (n.type === 'group') return Math.min(22, 8 + Math.sqrt(n.count || 1) * 2);
    if (n.type === 'director') return 10;
    return n.role === 'named' ? 12 : 6;
  }
  function label(n) {
    if (n.type === 'project') return n.label;
    if (n.type === 'director') return n.label.replace('Director ', 'Dir. ');
    if (n.type === 'group') return String(n.count);
    return '';
  }
  function tip(n) {
    if (n.type === 'project') return 'Project ' + n.label;
    if (n.type === 'director') return n.label + (n.corporate ? ' (a company acting as director)' : '') + ': ' + fmt(n.appointments_total) + ' appointments on the register' + (n.truncated ? ', first ' + n.appointments_read + ' read' : '');
    if (n.type === 'group') return n.count + ' other companies, status active';
    var s = (n.role === 'named' ? 'Company named in our research record' : 'Other company') + ', status ' + n.status;
    if (n.short_lived) s += ', dissolved within 2 years of incorporation';
    if (n.inc_year) s += ', incorporated ' + n.inc_year;
    return s;
  }

  var DATA = null, sim = null;
  function draw(id) {
    var box = $('gq-svg'), info = $('gq-sum');
    var p = DATA && DATA.projects[id];
    history.replaceState(null, '', '?id=' + encodeURIComponent(id) + '#graph');
    if (!p) { info.innerHTML = '<p>No graph for this project.</p>'; box.innerHTML = ''; return; }
    info.innerHTML = '<h3>' + esc(id) + ' <span class="gq-mk">' + esc(p.market || '') + '</span></h3>' + (p.summary || []).map(function (s) { return '<p>' + esc(s) + '</p>'; }).join('') +
      '<p class="gq-api">Raw: <a href="/api/x/q/graph/' + esc(id) + '">/api/x/q/graph/' + esc(id) + '</a> &middot; <a href="/p/?id=' + esc(id) + '">project page</a></p>';
    box.innerHTML = '';
    if (!p.nodes || p.nodes.length < 2) { box.innerHTML = '<p class="gq-empty">Nothing to draw: no company of this project could be matched exactly on the register.</p>'; return; }
    loadD3().then(function (d3) {
      if (sim) sim.stop();
      var W = box.clientWidth || 600, H = Math.max(340, Math.min(560, W * 0.72));
      var nodes = p.nodes.map(function (n) { return Object.assign({}, n); });
      var links = p.edges.map(function (e) { return { source: e.s, target: e.t, type: e.type }; });
      var svg = d3.select(box).append('svg').attr('viewBox', [0, 0, W, H]).attr('width', '100%').attr('height', H)
        .attr('role', 'img').attr('aria-label', 'Anonymised graph for ' + id + ': ' + nodes.length + ' nodes. The same facts are listed in the summary.');
      var g = svg.append('g');
      var link = g.append('g').attr('stroke', '#C9C6BC').attr('stroke-width', 1.2).selectAll('line').data(links).join('line')
        .attr('stroke-dasharray', function (l) { return l.type === 'named in research record' ? '4 3' : null; });
      var node = g.append('g').selectAll('g').data(nodes).join('g').attr('class', 'gq-n').attr('tabindex', 0);
      node.append('circle').attr('r', radius).attr('fill', function (n) { return n.type === 'company' && n.role === 'other' && n.status === 'dissolved' && !n.short_lived ? '#fff' : nodeColor(n); })
        .attr('stroke', function (n) { return n.short_lived ? '#9A2412' : nodeColor(n); }).attr('stroke-width', function (n) { return n.short_lived ? 2.5 : 1.5; })
        .attr('stroke-dasharray', function (n) { return n.short_lived ? '2 2' : null; });
      node.append('text').text(label).attr('x', function (n) { return n.type === 'group' ? 0 : radius(n) + 4; }).attr('y', 4).attr('font-size', 11)
        .attr('text-anchor', function (n) { return n.type === 'group' ? 'middle' : 'start'; }).attr('font-weight', function (n) { return n.type === 'group' ? 800 : 400; })
        .attr('fill', function (n) { return n.type === 'group' ? '#fff' : '#17212B'; });
      node.append('title').text(tip);
      var tipEl = $('gq-tip');
      node.on('mouseenter focus', function (ev, n) { tipEl.textContent = tip(n); }).on('mouseleave blur', function () { tipEl.textContent = 'Point at or tab to a circle to see what it is.'; });
      sim = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(function (n) { return n.id; }).distance(function (l) { return l.target.type === 'company' && l.target.role === 'other' ? 40 : 75; }))
        .force('charge', d3.forceManyBody().strength(W < 500 ? -90 : -140))
        .force('center', d3.forceCenter(W / 2, H / 2))
        .force('collide', d3.forceCollide().radius(function (n) { return radius(n) + 3; }))
        .force('x', d3.forceX(W / 2).strength(0.06)).force('y', d3.forceY(H / 2).strength(0.08));
      var clamp = function (v, r, max) { return Math.max(r + 2, Math.min(max - r - 2, v)); };
      var room = function (n) { return label(n) && n.type !== 'group' ? (n.type === 'project' ? 62 : 40) : 0; };
      sim.on('tick', function () {
        nodes.forEach(function (n) { n.x = clamp(n.x, radius(n), W - room(n)); n.y = clamp(n.y, radius(n), H); });
        link.attr('x1', function (l) { return l.source.x; }).attr('y1', function (l) { return l.source.y; }).attr('x2', function (l) { return l.target.x; }).attr('y2', function (l) { return l.target.y; });
        node.attr('transform', function (n) { return 'translate(' + n.x + ',' + n.y + ')'; });
      });
      node.call(d3.drag().on('start', function (ev, n) { if (!ev.active) sim.alphaTarget(0.3).restart(); n.fx = n.x; n.fy = n.y; })
        .on('drag', function (ev, n) { n.fx = ev.x; n.fy = ev.y; }).on('end', function (ev, n) { if (!ev.active) sim.alphaTarget(0); n.fx = null; n.fy = null; }));
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { sim.stop(); for (var i = 0; i < 300; i++) sim.tick(); sim.on('tick')(); }
    }).catch(function () { box.innerHTML = '<p class="gq-empty">The drawing library did not load. The summary above has the same facts.</p>'; });
  }

  function renderIndex(d) {
    DATA = d;
    var c = d.coverage || {};
    $('k-uk').textContent = fmt(c.uk_projects);
    $('k-named').textContent = fmt(c.projects_naming_a_legal_entity);
    $('k-res').textContent = fmt(c.projects_with_graph);
    $('k-net').textContent = fmt(c.network_companies);
    $('gq-upd').textContent = 'Updated ' + d.updated + (d.complete ? '' : ' (partial run)') + '. ' + fmt(c.requests) + ' register pages read, ' + fmt(c.legal_names) + ' legal names looked up: ' + fmt(c.resolved) + ' matched exactly, ' + fmt(c.ambiguous) + ' ambiguous, ' + fmt(c.not_found) + ' not found. Archive root ' + (d.archive && d.archive.root ? d.archive.root.slice(0, 16) + '…' : '-') + ' over ' + fmt(d.archive && d.archive.lines) + ' responses.';
    $('gq-method').innerHTML = (d.method || []).map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('');
    $('gq-nc').innerHTML = (d.not_covered || []).map(function (m) { return '<li><b>' + esc(m.jurisdiction) + ':</b> ' + esc(m.reason) + '</li>'; }).join('');
    var ids = Object.keys(d.projects).sort();
    var rows = ids.map(function (id) {
      var p = d.projects[id], n = p.network || {};
      var has = p.nodes && p.nodes.length > 1;
      return '<tr><td><button type="button" class="gq-pick" data-id="' + esc(id) + '"' + (has ? '' : ' disabled') + '>' + esc(id) + '</button></td><td>' + esc(p.market || '') + '</td><td>' + (p.directors || 0) + '</td><td>' + (has ? fmt((n.active || 0) + (n.dissolved || 0) + (n.insolvency || 0) + (n['strike-off proposed'] || 0) + (n.other || 0)) : '-') + '</td><td>' + (has ? fmt(n.dissolved) : '-') + '</td><td>' + (has ? fmt(n.dissolved_within_2y) : '-') + '</td><td>' + (has ? fmt(n.insolvency) : '-') + '</td></tr>';
    }).join('');
    $('gq-rows').innerHTML = rows;
    $('gq-rows').addEventListener('click', function (e) { var b = e.target.closest('.gq-pick'); if (b) { draw(b.getAttribute('data-id')); $('graph').scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
    var want = (new URLSearchParams(location.search).get('id') || '').toUpperCase();
    var first = ids.filter(function (id) { return d.projects[id].nodes && d.projects[id].nodes.length > 1; });
    var sel = $('gq-sel');
    sel.innerHTML = first.map(function (id) { return '<option value="' + esc(id) + '">' + esc(id) + ' (' + esc(d.projects[id].market) + ')</option>'; }).join('');
    sel.addEventListener('change', function () { draw(sel.value); });
    var pick = d.projects[want] ? want : first[0];
    if (pick) {
      if (first.indexOf(pick) >= 0) sel.value = pick;
      var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); draw(pick); } }, { rootMargin: '300px' }) : null;
      if (io && !want) io.observe($('graph')); else draw(pick);
    }
  }
  fetch('/data/company-graph.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(renderIndex).catch(function () {
    $('gq-upd').textContent = 'The weekly batch has not published the graph yet. This page will fill in when it does.';
    $('gq-sum').innerHTML = '<p>Starting: no data published yet.</p>';
  });

  // ---- court records
  fetch('/api/x/q/court/sources').then(function (r) { return r.json(); }).then(function (d) {
    $('gq-src').innerHTML = (d.sources || []).map(function (s) {
      var cls = s.status === 'reachable' || s.status === 'connected' ? 'ok' : (s.status === 'not automated' ? '' : 'no');
      return '<tr><td>' + esc(s.market) + '</td><td><a href="' + esc(s.url) + '" rel="noopener nofollow" target="_blank">' + esc(s.name) + '</a></td><td class="' + cls + '">' + esc(s.status) + (s.http ? ' (HTTP ' + s.http + ')' : '') + '</td><td>' + esc(s.terms) + '</td></tr>';
    }).join('');
    $('gq-auto').textContent = d.why_no_automatic_checks || '';
  }).catch(function () { $('gq-src').innerHTML = '<tr><td colspan="4">Could not load the source list.</td></tr>'; });
  var f = $('gq-cf');
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('gq-cn').value.trim(), src = $('gq-cs').value, o = $('gq-cr');
    if (!name) return;
    o.innerHTML = '<p>Searching…</p>';
    fetch('/api/x/q/court?source=' + encodeURIComponent(src) + '&name=' + encodeURIComponent(name)).then(function (r) { return r.json(); }).then(function (d) {
      if (d.error) { o.innerHTML = '<p class="no">' + esc(d.error) + '</p>'; return; }
      if (d.status === 'not connected yet') { o.innerHTML = '<p>' + esc(d.note) + '</p>'; return; }
      var h = '<p class="gq-lab">' + esc(d.label) + '</p>';
      h += '<p><b>' + d.title_matches.length + '</b> case' + (d.title_matches.length === 1 ? '' : 's') + ' with the exact name <b>' + esc(d.query) + '</b> in the title' + (d.more_results ? ' among the first 50 results' : '') + '. ' + d.text_mentions_only + ' more only mention it in the text: <a href="' + esc(d.search_page) + '" rel="noopener nofollow" target="_blank">read them on ' + esc(d.source_name.split(',')[0]) + '</a>.</p>';
      if (d.title_matches.length) h += '<ul class="gq-cases">' + d.title_matches.map(function (c) { return '<li><a href="' + esc(c.url) + '" rel="noopener nofollow" target="_blank">' + esc(c.title) + '</a><span>' + esc([c.citation, c.court, c.date].filter(Boolean).join(' · ')) + '</span></li>'; }).join('') + '</ul>';
      if (d.licence) h += '<p class="gq-fine">' + esc(d.licence) + '</p>';
      o.innerHTML = h;
    }).catch(function () { o.innerHTML = '<p class="no">The search did not answer. Try again in a minute.</p>'; });
  });
})();
