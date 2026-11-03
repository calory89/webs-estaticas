/* Kolaboro admin: growth (lead origin and conversion by channel, referrals, API pilot keys), report drafts, random agent audits, developer risk graph */
(function(){
  function $(i){ return document.getElementById(i); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function ops2(a, p){ return KBADM.rpc('kolaboro_ops2', { p_key: KBADM.pw(), p_action: a, p_payload: p || {} }); }
  function d(t){ return t ? new Date(t).toLocaleString(undefined, { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : '—'; }
  function toast(t){ var x = document.createElement('div'); x.textContent = t; x.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#17212B;color:#fff;padding:10px 16px;border-radius:10px;z-index:99'; document.body.appendChild(x); setTimeout(function(){ x.remove(); }, 2600); }
  function pct(a, b){ return b ? Math.round(a / b * 100) + '%' : '—'; }

  // ---------- growth ----------
  function growth(){
    var s = $('t-growth'); s.innerHTML = '<p class="muted">Loading…</p>';
    Promise.all([ops2('channels'), ops2('referrals'), ops2('api_keys')]).then(function(r){
      var ch = r[0], rf = r[1], ak = r[2]; if (ch.error) { s.innerHTML = '<p>Error: ' + esc(ch.error) + '</p>'; return; }
      var vis = {}; (ch.visits || []).forEach(function(v){ vis[v.src + '/' + v.medium] = v; });
      var h = '<div class="card"><h2>Leads by channel</h2><p class="muted" style="font-size:.85rem;margin-top:0">First touch per person (UTM, ad click id or referring site), saved in the browser on the first visit. Paid = the same email appears in payments. Test and team addresses excluded.</p>' +
        '<table class="ops-t"><tr><th>Source</th><th>Medium</th><th>Campaign</th><th>Visits</th><th>Leads</th><th>Lead rate</th><th>Paid</th><th>Conversion</th><th>Revenue</th></tr>' +
        (ch.leads || []).map(function(l){ var v = vis[l.src + '/' + l.medium] || {}; return '<tr><td><b>' + esc(l.src) + '</b></td><td>' + esc(l.medium) + '</td><td>' + esc(l.campaign) + '</td><td>' + (v.visits || 0) + '</td><td>' + l.leads + ' <small>(' + l.leads_7d + ' this week)</small></td><td>' + pct(l.leads, v.visits) + '</td><td>' + l.paid + '</td><td>' + pct(l.paid, l.leads) + '</td><td>€' + (+l.revenue || 0) + '</td></tr>'; }).join('') + '</table></div>';
      h += '<div class="card"><h2>Visits by channel</h2>' + ((ch.visits || []).length ? '<table class="ops-t"><tr><th>Source</th><th>Medium</th><th>Visits</th><th>Last 7 days</th></tr>' + ch.visits.map(function(v){ return '<tr><td>' + esc(v.src) + '</td><td>' + esc(v.medium) + '</td><td>' + v.visits + '</td><td>' + v.visits_7d + '</td></tr>'; }).join('') + '</table>' : '<p class="muted">Visits are counted from now on, one per browser session.</p>') + '</div>';
      h += '<div class="card"><h2>Latest leads</h2><table class="ops-t"><tr><th>When</th><th>Who</th><th>Form</th><th>Channel</th><th>Landing</th><th>Referrer</th></tr>' + (ch.recent || []).map(function(l){ return '<tr><td>' + d(l.created_at) + '</td><td>' + esc(l.name) + '<br><small>' + esc(l.email) + '</small></td><td>' + esc((l.source || '').split(' | ')[0]) + '</td><td>' + esc([l.src, l.medium, l.campaign].filter(Boolean).join(' / ')) + (l.ref_code ? '<br><small>ref ' + esc(l.ref_code) + '</small>' : '') + '</td><td>' + esc(l.landing || '') + '</td><td>' + esc(l.referrer || '') + '</td></tr>'; }).join('') + '</table></div>';
      h += '<div class="card"><h2>Referrals</h2>' + ((rf.codes || []).length ? '<table class="ops-t"><tr><th>Code</th><th>Client</th><th>Friends who came</th><th>Paid</th><th>Owed (€50 each)</th></tr>' + rf.codes.map(function(c){ return '<tr><td><b>' + esc(c.code) + '</b></td><td>' + esc(c.email) + '</td><td>' + c.leads + '</td><td>' + c.paid + '</td><td>€' + c.paid * 50 + '</td></tr>'; }).join('') + '</table>' : '<p class="muted">No client has created a referral link yet. They get one from "Share your case" in the portal.</p>') +
        '<h3 style="margin-top:16px">Shared cases</h3>' + ((rf.shares || []).length ? '<table class="ops-t"><tr><th>Case</th><th>Created</th><th>Views</th><th>Project shown</th></tr>' + rf.shares.map(function(x){ return '<tr><td>' + esc(x.case_code) + '</td><td>' + d(x.created_at) + '</td><td>' + x.views + '</td><td>' + (x.show_project ? 'yes' : 'no') + '</td></tr>'; }).join('') + '</table>' : '<p class="muted">None yet.</p>') + '</div>';
      h += '<div class="card"><h2>API pilot keys</h2>' + ((ak || []).length ? '<table class="ops-t"><tr><th>Who</th><th>Use</th><th>Created</th><th>Calls</th><th>Last 7 days</th><th>Last used</th><th></th></tr>' + ak.map(function(k){ return '<tr><td><b>' + esc(k.company || k.name) + '</b><br><small>' + esc(k.name) + ' · ' + esc(k.email) + ' · ' + esc(k.prefix) + '…</small></td><td><small>' + esc(k.use_case || '') + '</small></td><td>' + d(k.created_at) + '</td><td>' + k.calls + '</td><td>' + k.calls_7d + '</td><td>' + d(k.last_used) + '</td><td><button class="btn-s" data-ak="' + k.id + '">' + (k.active ? 'Disable' : 'Enable') + '</button></td></tr>'; }).join('') + '</table>' : '<p class="muted">No keys yet. Agencies, lenders and lawyers sign up at <a href="/api-pilot" target="_blank">/api-pilot</a>.</p>') + '</div>';
      s.innerHTML = h;
      s.querySelectorAll('[data-ak]').forEach(function(b){ b.onclick = function(){ ops2('api_toggle', { id: +b.dataset.ak }).then(growth); }; });
    });
  }

  // ---------- report drafts ----------
  var REP = null, CASES = [];
  var AREAS = ['title','permit','developer','progress','payments','contract','returns','other'], STS = ['ok','concern','red_flag','not_checked'];
  function reports(){
    var s = $('t-reports');
    KBADM.rpc('kolaboro_ops', { p_key: KBADM.pw(), p_action: 'overview', p_payload: {} }).then(function(o){
      CASES = (o && o.cases) || [];
      s.innerHTML = '<div class="card"><h2>Report draft from the evidence</h2><p class="muted" style="font-size:.85rem;margin-top:0">The model reads everything in the case (documents read, GPS photos, agent notes, satellite) and writes a draft with a verdict and findings that cite evidence ids. You edit it; every change is counted and published with the report. Publishing seals the final text into the evidence chain, moves the case to "Report" and emails the client.</p>' +
        '<div class="ops-f"><select id="rcase"><option value="">Case…</option>' + CASES.map(function(c){ return '<option value="' + esc(c.code) + '">' + esc(c.code) + ' · ' + esc(c.project || c.email) + '</option>'; }).join('') + '</select><button class="btn" id="rgen">Write a draft</button><button class="btn-s" id="rload">Open saved drafts</button></div><div id="rout" style="margin-top:14px"></div></div>';
      $('rgen').onclick = function(){ var cc = $('rcase').value; if (!cc) return; var b = this; b.disabled = true; $('rout').innerHTML = '<p class="muted">Reading the evidence and writing… about 30 seconds.</p>';
        fetch('/api/kb/report-draft', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: KBADM.pw(), case_code: cc }) }).then(function(r){ return r.json(); }).then(function(r){ b.disabled = false; if (r.error) { $('rout').innerHTML = '<p>Error: ' + esc(r.error) + '</p>'; return; } REP = { id: r.id, code: cc, draft: r.draft, final: JSON.parse(JSON.stringify(r.draft)) }; editor(); }).catch(function(){ b.disabled = false; $('rout').innerHTML = '<p>Network error</p>'; }); };
      $('rload').onclick = function(){ var cc = $('rcase').value; if (!cc) return; ops2('report_input', { case_code: cc }).then(function(x){ var rs = x.reports || []; if (!rs.length) { $('rout').innerHTML = '<p class="muted">No drafts for this case yet.</p>'; return; }
        $('rout').innerHTML = '<table class="ops-t"><tr><th>#</th><th>Created</th><th>Verdict</th><th>Changes</th><th>Published</th><th></th></tr>' + rs.map(function(r){ return '<tr><td>' + r.id + '</td><td>' + d(r.created_at) + '</td><td>' + esc(r.verdict || '') + '</td><td>' + (r.changes || 0) + '</td><td>' + d(r.published_at) + '</td><td><button class="btn-s" data-ro="' + r.id + '">Open</button></td></tr>'; }).join('') + '</table>';
        $('rout').querySelectorAll('[data-ro]').forEach(function(b){ b.onclick = function(){ var r = rs.filter(function(z){ return z.id === +b.dataset.ro; })[0]; REP = { id: r.id, code: cc, draft: r.draft, final: r.final || r.draft, published: r.published_at }; editor(); }; }); }); };
    });
  }
  function diffCount(a, b){
    var n = 0;
    ['verdict','headline','summary','limits'].forEach(function(k){ if ((a[k] || '') !== (b[k] || '')) n++; });
    ['before_next_payment','questions_for_developer'].forEach(function(k){ var x = a[k] || [], y = b[k] || []; for (var i = 0; i < Math.max(x.length, y.length); i++) if (x[i] !== y[i]) n++; });
    var fa = a.findings || [], fb = b.findings || [];
    for (var i = 0; i < Math.max(fa.length, fb.length); i++) { var p = fa[i] || {}, q = fb[i] || {}; if (p.text !== q.text || p.status !== q.status || p.area !== q.area) n++; }
    return n;
  }
  function read(){
    var f = REP.final, o = $('rout');
    f.verdict = $('rv').value; f.headline = $('rh').value; f.summary = $('rs').value; f.limits = $('rl').value;
    f.findings = [].map.call(o.querySelectorAll('.rf'), function(r){ return { area: r.querySelector('.ra').value, status: r.querySelector('.rst').value, text: r.querySelector('textarea').value, evidence: (r.dataset.ev || '').split(',').filter(Boolean).map(Number) }; }).filter(function(x){ return x.text.trim(); });
    f.before_next_payment = $('rb').value.split('\n').map(function(x){ return x.trim(); }).filter(Boolean);
    f.questions_for_developer = $('rq').value.split('\n').map(function(x){ return x.trim(); }).filter(Boolean);
    return f;
  }
  function editor(){
    var f = REP.final, o = $('rout'), ro = REP.published ? ' disabled' : '';
    o.innerHTML = '<div class="rep-ed"><p class="muted" style="margin:0 0 8px">Draft #' + (REP.id || '?') + ' · case ' + esc(REP.code) + (REP.published ? ' · <b>published ' + d(REP.published) + '</b>' : '') + ' · <span id="rchg"></span></p>' +
      '<label>Verdict<select id="rv"' + ro + '>' + [['safe','No red flags'],['hold','Hold payments'],['stop','Don\'t pay yet']].map(function(v){ return '<option value="' + v[0] + '"' + (f.verdict === v[0] ? ' selected' : '') + '>' + v[1] + '</option>'; }).join('') + '</select></label>' +
      '<label>Headline<input id="rh" value="' + esc(f.headline) + '"' + ro + '></label><label>Summary<textarea id="rs" rows="4"' + ro + '>' + esc(f.summary) + '</textarea></label><h3>Findings</h3>' +
      (f.findings || []).map(function(x){ return '<div class="rf" data-ev="' + esc((x.evidence || []).join(',')) + '"><select class="ra"' + ro + '>' + AREAS.map(function(a){ return '<option' + (a === x.area ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select><select class="rst"' + ro + '>' + STS.map(function(a){ return '<option' + (a === x.status ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select><textarea rows="2"' + ro + '>' + esc(x.text) + '</textarea><small>evidence ' + esc((x.evidence || []).map(function(e){ return '#' + e; }).join(' ') || 'none cited') + '</small></div>'; }).join('') +
      '<label>Before the next payment (one per line)<textarea id="rb" rows="4"' + ro + '>' + esc((f.before_next_payment || []).join('\n')) + '</textarea></label><label>Questions for the developer (one per line)<textarea id="rq" rows="4"' + ro + '>' + esc((f.questions_for_developer || []).join('\n')) + '</textarea></label><label>Limits<input id="rl" value="' + esc(f.limits) + '"' + ro + '></label>' +
      (REP.published ? '' : '<div class="ops-f" style="margin-top:10px"><button class="btn-s" id="rsave">Save edits</button><button class="btn" id="rpub">Publish to the client</button></div>') + '</div>';
    function upd(){ $('rchg').textContent = diffCount(REP.draft, read()) + ' changes from the model draft'; }
    upd(); o.querySelectorAll('input,textarea,select').forEach(function(e){ e.oninput = upd; });
    if (REP.published) return;
    function save(){ var f2 = read(); return ops2('report_save', { case_code: REP.code, id: REP.id, final: f2, changes: diffCount(REP.draft, f2), verdict: f2.verdict }); }
    $('rsave').onclick = function(){ save().then(function(r){ toast(r.error ? 'Error: ' + r.error : 'Saved'); }); };
    $('rpub').onclick = function(){ if (!confirm('Publish this report to the client, seal it and email them?')) return; save().then(function(){ return ops2('report_publish', { id: REP.id }); }).then(function(r){ if (r.error) return toast('Error: ' + r.error); toast('Published and sealed as evidence #' + r.evidence); REP.published = new Date().toISOString(); editor(); }); };
  }

  // ---------- audits ----------
  function audits(){
    var s = $('t-audits');
    Promise.all([ops2('audits'), KBADM.rpc('kolaboro_ops', { p_key: KBADM.pw(), p_action: 'overview', p_payload: {} })]).then(function(r){
      var A = r[0] || [], ag = (r[1] && r[1].agents) || [];
      var h = '<div class="card"><h2>Random audits</h2><p class="muted" style="font-size:.85rem;margin-top:0">One visit in ten is picked at random when the agent sends it. Another agent repeats it without knowing it is a check. If the two don\'t match, the first agent loses 30 points of quality score per failed audit, and agents with higher scores get visits first.</p>' +
        '<div class="kpis">' + [['Audits', A.length], ['Waiting for a second agent', A.filter(function(a){ return a.status === 'open'; }).length], ['Consistent', A.filter(function(a){ return a.result === 'consistent'; }).length], ['Inconsistent', A.filter(function(a){ return a.result === 'inconsistent'; }).length]].map(function(k){ return '<div class="kpi"><span>' + k[0] + '</span><b>' + k[1] + '</b></div>'; }).join('') + '</div>' +
        (A.length ? '<table class="ops-t"><tr><th>Picked</th><th>Case</th><th>Visit by</th><th>Second check</th><th>Result</th><th></th></tr>' + A.map(function(a){
          var act = a.status === 'open' ? '<select data-ag="' + a.id + '"><option value="">Second agent…</option>' + ag.filter(function(x){ return x.email !== a.agent; }).map(function(x){ return '<option value="' + esc(x.email) + '">' + esc(x.name) + '</option>'; }).join('') + '</select> <button class="btn-s" data-as="' + a.id + '">Assign</button>'
            : a.status === 'assigned' ? '<button class="btn-s" data-ok="' + a.id + '">Consistent</button> <button class="btn-s" data-bad="' + a.id + '">Inconsistent</button>' : '';
          return '<tr><td>' + d(a.created_at) + '</td><td><b>' + esc(a.case_code) + '</b><br><small>' + esc(a.project || '') + '</small></td><td>' + esc(a.agent_name || a.agent) + '</td><td>' + esc(a.audit_agent || '-') + (a.audit_status ? '<br><small>' + esc(a.audit_status) + '</small>' : '') + '</td><td>' + esc(a.result || a.status) + (a.note ? '<br><small>' + esc(a.note) + '</small>' : '') + '</td><td>' + act + '</td></tr>'; }).join('') + '</table>' : '<p class="muted">No visit has been picked yet. The first one will appear here with an email to hello@kolaboro.com.</p>') + '</div>';
      s.innerHTML = h;
      s.querySelectorAll('[data-as]').forEach(function(b){ b.onclick = function(){ var e = s.querySelector('[data-ag="' + b.dataset.as + '"]').value; if (!e) return; ops2('audit_assign', { id: +b.dataset.as, agent_email: e, fee: 40 }).then(function(r){ toast(r.error ? 'Error: ' + r.error : 'Assigned: the agent got an email'); audits(); }); }; });
      function dec(id, res){ var n = prompt(res === 'consistent' ? 'Note (optional)' : 'What did not match?'); if (res === 'inconsistent' && !n) return; ops2('audit_decide', { id: id, result: res, note: n || '' }).then(function(r){ toast(r.error ? 'Error: ' + r.error : 'Saved. Agent score now ' + (r.quality && r.quality.score)); audits(); }); }
      s.querySelectorAll('[data-ok]').forEach(function(b){ b.onclick = function(){ dec(+b.dataset.ok, 'consistent'); }; });
      s.querySelectorAll('[data-bad]').forEach(function(b){ b.onclick = function(){ dec(+b.dataset.bad, 'inconsistent'); }; });
    });
  }

  // ---------- risk graph ----------
  var COL = { project: '#2E6BE6', developer: '#FF5B14', domain: '#1F8A5B', agency: '#6B4FBB', permit: '#B7791F', market: '#17212B' };
  function graph(){
    var s = $('t-graph'); s.innerHTML = '<p class="muted">Loading…</p>';
    ops2('graph').then(function(G){
      if (!G || !G.nodes) { s.innerHTML = '<p class="muted">No graph yet.</p>'; return; }
      s.innerHTML = '<div class="card"><h2>Developer risk graph <small class="muted" style="font-weight:400">internal · ' + d(G.generated) + '</small></h2><p class="muted" style="font-size:.85rem;margin-top:0">' + G.nodes.length + ' nodes, ' + G.edges.length + ' links: ' + Object.keys(G.counts).map(function(k){ return G.counts[k] + ' ' + (G.counts[k] > 1 ? k.replace(/y$/, 'ie') + 's' : k); }).join(', ') + '. Built from what developers advertise across the ' + (G.counts.project || 0) + ' projects the research agent tracks. ' + esc(G.note) + '</p>' +
        '<div class="g-leg">' + Object.keys(COL).map(function(k){ return '<span><i style="background:' + COL[k] + '"></i>' + k + '</span>'; }).join('') + '<span>size = risk signals</span></div><div id="gsvg" class="g-svg"></div><p id="ginfo" class="muted" style="font-size:.85rem">Click a node to see its links. Drag to rearrange, scroll to zoom.</p></div>' +
        '<div class="card"><h2>Cross-links found</h2>' + ((G.alerts || []).length ? '<ul>' + G.alerts.map(function(a){ return '<li><b>' + esc(a.kind) + '</b> · ' + esc(a.what) + ': ' + esc(a.detail) + '</li>'; }).join('') + '</ul>' : '<p class="muted">None.</p>') + '</div>' +
        '<div class="card"><h2>Developers by risk signals</h2><table class="ops-t"><tr><th>Developer</th><th>Projects</th><th>Markets</th><th>Signals in their advertising</th><th>Score</th></tr>' + G.developers.slice(0, 60).map(function(r){ return '<tr><td><b>' + esc(r.developer) + '</b></td><td>' + r.projects + '</td><td>' + esc(r.markets.join(', ')) + '</td><td><small>' + esc(Object.keys(r.signals).map(function(k){ return k + (r.signals[k] > 1 ? ' ×' + r.signals[k] : ''); }).join(' · ') || '-') + '</small></td><td><b>' + r.score + '</b></td></tr>'; }).join('') + '</table></div>';
      var sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js'; sc.integrity = 'sha384-su5kReKyYlIFrI62mbQRKXHzFobMa7BHp1cK6julLPbnYcCW9NIZKJiTODjLPeDh'; sc.crossOrigin = 'anonymous'; sc.onload = function(){ draw(G); }; document.head.appendChild(sc);
    });
  }
  function draw(G){
    var el = $('gsvg'), W = el.clientWidth || 900, H = 620;
    var nodes = G.nodes.map(function(n){ return Object.assign({}, n); }), byId = {}; nodes.forEach(function(n){ byId[n.id] = n; });
    var links = G.edges.filter(function(e){ return byId[e.s] && byId[e.t]; }).map(function(e){ return { source: e.s, target: e.t, type: e.type }; });
    var svg = d3.select(el).append('svg').attr('viewBox', [0, 0, W, H]).attr('width', '100%').attr('height', H), g = svg.append('g');
    svg.call(d3.zoom().scaleExtent([.2, 6]).on('zoom', function(ev){ g.attr('transform', ev.transform); }));
    var r = function(n){ return n.type === 'market' ? 12 : n.type === 'developer' ? 5 + (n.risk || 0) / 10 : n.type === 'project' ? 3 + (n.risk || 0) / 20 : 3.5; };
    var sim = d3.forceSimulation(nodes).force('link', d3.forceLink(links).id(function(n){ return n.id; }).distance(function(l){ return l.type === 'in' ? 70 : 24; }).strength(function(l){ return l.type === 'in' ? .05 : .6; })).force('charge', d3.forceManyBody().strength(-22)).force('center', d3.forceCenter(W / 2, H / 2)).force('x', d3.forceX(W / 2).strength(.07)).force('y', d3.forceY(H / 2).strength(.1)).force('collide', d3.forceCollide(function(n){ return r(n) + 1.5; }));
    var L = g.append('g').attr('stroke', '#C9CED3').attr('stroke-opacity', .7).selectAll('line').data(links).join('line').attr('stroke-width', function(l){ return l.type === 'in' ? .4 : 1; });
    var N = g.append('g').selectAll('circle').data(nodes).join('circle').attr('r', r).attr('fill', function(n){ return COL[n.type] || '#999'; }).attr('stroke', '#fff').attr('stroke-width', .8).style('cursor', 'pointer')
      .call(d3.drag().on('start', function(ev, n){ if (!ev.active) sim.alphaTarget(.2).restart(); n.fx = n.x; n.fy = n.y; }).on('drag', function(ev, n){ n.fx = ev.x; n.fy = ev.y; }).on('end', function(ev, n){ if (!ev.active) sim.alphaTarget(0); n.fx = null; n.fy = null; }));
    N.append('title').text(function(n){ return n.type + ': ' + n.label + (n.risk ? ' · risk ' + n.risk : ''); });
    var T = g.append('g').selectAll('text').data(nodes.filter(function(n){ return n.type === 'market' || (n.type === 'developer' && n.risk >= 45); })).join('text').text(function(n){ return n.label; }).attr('font-size', function(n){ return n.type === 'market' ? 12 : 9; }).attr('font-weight', 700).attr('fill', '#17212B').attr('pointer-events', 'none');
    N.on('click', function(ev, n){
      var nb = {}; nb[n.id] = 1; links.forEach(function(l){ if (l.source.id === n.id) nb[l.target.id] = 1; if (l.target.id === n.id) nb[l.source.id] = 1; });
      N.attr('opacity', function(x){ return nb[x.id] ? 1 : .12; }); L.attr('stroke-opacity', function(l){ return l.source.id === n.id || l.target.id === n.id ? 1 : .05; });
      $('ginfo').innerHTML = '<b>' + esc(n.label) + '</b> (' + n.type + ')' + (n.signals && n.signals.length ? ' · ' + esc(n.signals.join(' · ')) : '') + ' · linked to ' + Object.keys(nb).filter(function(k){ return k !== n.id; }).map(function(k){ return esc(byId[k].label); }).slice(0, 14).join(', ') + ' <button class="btn-s" id="gall">Show all</button>';
      $('gall').onclick = function(){ N.attr('opacity', 1); L.attr('stroke-opacity', .7); };
    });
    sim.on('tick', function(){ L.attr('x1', function(l){ return l.source.x; }).attr('y1', function(l){ return l.source.y; }).attr('x2', function(l){ return l.target.x; }).attr('y2', function(l){ return l.target.y; }); N.attr('cx', function(n){ return n.x; }).attr('cy', function(n){ return n.y; }); T.attr('x', function(n){ return n.x + r(n) + 2; }).attr('y', function(n){ return n.y + 3; }); });
  }

  var LOAD = { growth: growth, reports: reports, audits: audits, graph: graph };
  document.addEventListener('click', function(e){ var b = e.target.closest && e.target.closest('nav.tabs button[data-t]'); if (b && LOAD[b.dataset.t]) LOAD[b.dataset.t](); });
})();
