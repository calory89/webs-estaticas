/* Kolaboro admin, part 3 (CRM for running the business daily):
   Pipeline (visited check -> lookup done -> signed up -> paid -> visit ordered -> agent assigned -> report delivered),
   Customers (search, filters, sort, CSV) with one record page per customer (#c=<id>), Cases board (stage, agent, SLA),
   and a monthly ledger on the Payments tab. Uses only the existing admin RPCs, all behind the admin key:
   kolaboro_admin (payload + audited actions), kolaboro_ops (tasks, agents, assign, evidence, files),
   kolaboro_traffic (visit counts), kolaboro_admin_health (recent audit log). Actions that go through an RPC that does
   not write the audit log itself are followed by a kolaboro_admin call with a 'log_*' action: kolaboro_admin records
   every non-'all' action in the hash-chained audit log and has no handler for 'log_*', so it changes no data. */
(function(){
  var A = window.KBADM; if (!A || window.__kbbiz) return; window.__kbbiz = 1;
  var $ = function(i){ return document.getElementById(i); };
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function surl(u){ u = String(u == null ? '' : u).trim(); return /^https?:\/\//i.test(u) ? esc(u) : '#'; }
  function day(t){ return t ? String(t).slice(0, 10) : ''; }
  function today(){ return new Date().toISOString().slice(0, 10); }
  function daysSince(t){ return t ? Math.max(0, Math.floor((Date.now() - new Date(t)) / 864e5)) : null; }
  function ago(t){ if (!t) return ''; var s = (Date.now() - new Date(t)) / 1000; if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min ago'; if (s < 86400) return Math.round(s / 3600) + ' h ago'; return Math.round(s / 86400) + ' d ago'; }
  function num(n){ return (+n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 }); }
  function pct(a, b){ return b ? Math.round(100 * a / b) + '%' : '-'; }
  function key(){ return A.pw(); }
  function adm(action, payload){ return A.rpc('kolaboro_admin', { p_key: key(), p_action: action, p_payload: payload || {} }); }
  function ops(action, payload){ return A.rpc('kolaboro_ops', { p_key: key(), p_action: action, p_payload: payload || {} }); }
  function logAudit(action, payload){ return adm('log_' + action, payload); }   // audit-only, see header
  function csv(name, cols, rows){
    var t = cols.map(function(c){ return c[0]; }).join(',') + '\n' + rows.map(function(r){ return cols.map(function(c){ var v = c[1](r); v = String(v == null ? '' : v); if (/^[\s]*[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/csv' })); a.download = name + '-' + today() + '.csv'; document.body.appendChild(a); a.click(); a.remove();
  }
  function fail(d){ if (d && d.error) { alert('Not saved: ' + d.error); return true; } return false; }

  var STG = ['Case opened', 'Documents', 'Land & title', 'Building permit', 'Site visit', 'Report'];
  var PIPE = [['visit', 'Visited check'], ['lookup', 'Lookup done'], ['signup', 'Signed up'], ['paid', 'Paid'], ['ordered', 'Visit ordered'], ['agent', 'Agent assigned'], ['report', 'Report delivered']];
  var PIDX = {}; PIPE.forEach(function(p, i){ PIDX[p[0]] = i; });
  var LOOKUP_KINDS = ['desk_done', 'cert_run', 'doc_run', 'price_check', 'image_check', 'register_lookup', 'check_lookup', 'lookup_done'];
  var D = null, X = { ops: null, traffic: null, health: null, at: 0, ev: {} }, DAYS = 30, SORT = { k: 'created', dir: -1 }, CUR = null;

  // ---------- styles, tabs, sections
  var css = document.createElement('style'); css.textContent =
    ':focus-visible{outline:3px solid #FF5B14;outline-offset:2px}' +
    '.bz-f{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:14px}.bz-f input,.bz-f select{min-width:130px}.bz-f input[type=checkbox]{min-width:0}.bz-f label{font-size:.85rem;color:var(--muted);display:flex;gap:6px;align-items:center}' +
    '.bz-fun{display:grid;grid-template-columns:repeat(7,minmax(118px,1fr));gap:6px;overflow:auto;padding-bottom:4px}.bz-fun>div{background:#F2F1EC;border-radius:12px;padding:10px;position:relative}.bz-fun b{display:block;font-size:1.5rem}.bz-fun small{color:var(--muted);display:block}.bz-fun .cv{font-size:.75rem;font-weight:800;color:#0f5f43}' +
    '.bz-fun .bar{height:6px;border-radius:3px;background:var(--hi);margin-top:6px}.bz-fun .anon{background:#E3E8FF}' +
    '.bz-board{display:grid;grid-template-columns:repeat(var(--n),minmax(170px,1fr));gap:8px;overflow:auto;margin-top:10px;padding-bottom:6px}.bz-col{background:#EFEDE6;border-radius:14px;padding:8px;min-height:120px}.bz-col h3{margin:2px 4px 8px;font-size:.76rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);display:flex;justify-content:space-between;gap:6px}' +
    '.bz-card{display:block;text-decoration:none;width:100%;text-align:left;background:#fff;border:1px solid var(--line);border-radius:12px;padding:9px 10px;margin-bottom:7px;font:inherit;font-size:.85rem;color:inherit;cursor:pointer}.bz-card:hover{border-color:var(--ink)}.bz-card b{display:block}.bz-card small{color:var(--muted);display:block}' +
    '.bz-sla{display:inline-block;border-radius:999px;padding:0 7px;font-size:.72rem;font-weight:800;background:#DDEFE7}.bz-sla.w{background:#FFF0C7}.bz-sla.b{background:#FDE2D6;color:#8a1f0c}' +
    '.bz-t th button{all:unset;cursor:pointer;font:inherit;text-transform:uppercase}.bz-t th button:focus-visible{outline:3px solid #FF5B14}.bz-t td{font-size:.86rem}.bz-t tr.cl{cursor:pointer}.bz-t tr.cl:hover td{background:#FBFAF6}' +
    '.bz-chip{display:inline-block;border-radius:999px;padding:1px 8px;font-size:.72rem;font-weight:800;background:#EEE}.bz-chip.s3,.bz-chip.s4{background:#DDEFE7}.bz-chip.s5{background:#E3E8FF}.bz-chip.s6{background:#1E9E6A;color:#fff}' +
    '.bz-rec{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:14px;align-items:start}.bz-kv{display:grid;grid-template-columns:130px 1fr;gap:4px 10px;font-size:.88rem}.bz-kv span{color:var(--muted)}' +
    '.bz-steps{display:flex;gap:4px;flex-wrap:wrap;margin-top:10px}.bz-steps span{border-radius:999px;padding:3px 9px;font-size:.75rem;background:#E6E4DD;color:var(--muted)}.bz-steps span.on{background:#1E9E6A;color:#fff}' +
    '.bz-tl{list-style:none;padding:0;margin:8px 0 0}.bz-tl li{border-left:2px solid var(--line);padding:2px 0 10px 12px;position:relative;font-size:.86rem;white-space:pre-wrap;word-break:break-word}.bz-tl li::before{content:"";position:absolute;left:-6px;top:6px;width:10px;height:10px;border-radius:50%;background:var(--line)}' +
    '.bz-tl li.k-pay::before{background:#1E9E6A}.bz-tl li.k-msg::before{background:#3B6FD8}.bz-tl li.k-log::before{background:#FF5B14}.bz-tl li.k-note::before{background:#B7791F}.bz-tl li.k-audit::before{background:#17212B}.bz-tl small{color:var(--muted);display:block}' +
    '.bz-form label{display:block;font-size:.8rem;font-weight:700;margin-top:8px}.bz-form input,.bz-form select,.bz-form textarea{width:100%;margin-top:3px}.bz-g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
    '.bz-note{background:#FFF4E5;border:1px solid #F5C98B;border-radius:12px;padding:8px 12px;font-size:.85rem;margin-top:10px}.bz-sr{position:absolute;left:-9999px}' +
    '.bz-case{border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin-top:8px}.bz-case h4{margin:0 0 4px}' +
    '@media(max-width:900px){.bz-rec{grid-template-columns:1fr}}@media(max-width:640px){.bz-kv{grid-template-columns:1fr}.bz-g2{grid-template-columns:1fr}.bz-f input:not([type=checkbox]),.bz-f select{min-width:0;flex:1 1 140px}.bz-t th:nth-child(n+5),.bz-t td:nth-child(n+5){display:table-cell}}';
  document.head.appendChild(css);
  var nav = document.querySelector('nav.tabs'), main = document.querySelector('main');
  if (!nav || !main) return;
  var TABS = [['pipe', 'Pipeline'], ['cust', 'Customers'], ['board', 'Cases board']];
  TABS.forEach(function(t, i){
    var b = document.createElement('button'); b.dataset.t = t[0]; b.type = 'button'; b.textContent = t[1];
    nav.insertBefore(b, nav.children[1 + i] || null);
    var s = document.createElement('section'); s.id = 't-' + t[0]; s.className = 'hide'; s.setAttribute('aria-label', t[1]); s.innerHTML = '<p class="muted">Loading…</p>'; main.insertBefore(s, main.children[1 + i] || null);
  });
  nav.setAttribute('aria-label', 'Admin sections');
  nav.addEventListener('click', function(e){
    var b = e.target.closest('button[data-t]'); if (!b) return;
    document.querySelectorAll('nav.tabs button').forEach(function(x){ x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    document.querySelectorAll('main > section').forEach(function(s){ s.classList.toggle('hide', s.id !== 't-' + b.dataset.t); });
    if (b.dataset.t === 'cust' && !/^#c=/.test(location.hash)) CUR = null;
    if (['pipe', 'cust', 'board', 'pay'].indexOf(b.dataset.t) >= 0) more().then(renderAll);
  });
  function show(t){ var b = nav.querySelector('button[data-t="' + t + '"]'); if (b && !b.classList.contains('on')) b.click(); }
  function visible(t){ var s = $('t-' + t); return s && !s.classList.contains('hide'); }

  // ---------- extra data (loaded when a CRM tab is open, at most once a minute unless forced)
  function more(force){
    if (!force && X.at && Date.now() - X.at < 60000) return Promise.resolve();
    X.at = Date.now();
    var safe = function(p){ return p.then(function(d){ return d && !d.error ? d : null; }, function(){ return null; }); };
    return Promise.all([safe(ops('overview')), safe(A.rpc('kolaboro_traffic', { p_key: key(), p_days: DAYS })), safe(A.rpc('kolaboro_admin_health', { p_key: key() }))]).then(function(r){
      X.ops = r[0] || X.ops; X.traffic = r[1] || X.traffic; X.trafficDays = r[1] ? DAYS : X.trafficDays; X.health = r[2] || X.health;
    });
  }

  // ---------- people model: one record per email (account, leads, payments, PayPal events)
  function isTest(email, status){ return status === 'test' || /(^|@|\.)(test|example)\b|@example\.com$|@kolaboro\.test$|^demo@kolaboro\.com$/i.test(email || ''); }
  function people(){
    var by = {}, list = [];
    function get(em){ em = String(em || '').toLowerCase().trim(); if (!em) return null; if (!by[em]) { by[em] = { email: em, leads: [], payments: [], pev: [], user: null, notes: [] }; list.push(by[em]); } return by[em]; }
    (D.users || []).forEach(function(u){ var p = get(u.email); if (p) p.user = u; });
    (D.leads || []).forEach(function(l){ var p = get(l.email); if (p) p.leads.push(l); });
    (D.payments || []).forEach(function(x){ var p = get(x.email); if (p) p.payments.push(x); });
    (D.pay_events || []).forEach(function(e){ var p = e.email && by[String(e.email).toLowerCase()]; if (p) p.pev.push(e); });
    var tasks = (X.ops && X.ops.tasks) || [], byCode = {};
    tasks.forEach(function(t){ (byCode[t.case] = byCode[t.case] || []).push(t); });
    var notes = D.notes || [];
    list.forEach(function(p){
      var u = p.user, cases = u ? (u.cases || []) : [], leadIds = p.leads.map(function(l){ return l.id; });
      p.id = u ? u.id : p.leads.length ? 'l-' + p.leads[p.leads.length - 1].id : 'p-' + (p.payments[0] || {}).id;
      p.cases = cases; p.tasks = []; cases.forEach(function(c){ c._tasks = byCode[c.code] || []; p.tasks = p.tasks.concat(c._tasks); });
      p.name = (u && u.name) || (p.leads[0] || {}).name || (p.payments[0] || {}).name || '';
      p.country = (u && u.country) || (p.leads[0] || {}).country || '';
      var dates = [u && u.created_at].concat(p.leads.map(function(l){ return l.created_at; }), p.payments.map(function(x){ return x.paid_at; })).filter(Boolean).sort();
      p.created = dates[0] || ''; p.test = isTest(p.email, (p.leads[0] || {}).status) && !(u && u.status === 'active' && p.payments.length);
      p.notes = notes.filter(function(n){ return (u && n.user_id === u.id) || (n.lead_id && leadIds.indexOf(n.lead_id) >= 0); });
      p.paidTotal = {}; p.payments.forEach(function(x){ var c = x.currency || 'EUR'; p.paidTotal[c] = (p.paidTotal[c] || 0) + (+x.amount || 0); });
      p.next = (u && u.next_action) || p.leads.map(function(l){ return l.next_action; }).filter(Boolean).sort()[0] || '';
      p.tags = (u && u.tags) || []; p.leads.forEach(function(l){ (l.tags || []).forEach(function(t){ if (p.tags.indexOf(t) < 0) p.tags = p.tags.concat([t]); }); });
      // stage flags with the date the stage was first reached (from real rows only)
      var f = {};
      var lk = p.leads.filter(function(l){ return /yc-desk|check-request|desk/.test(l.plan || '') || /^https?:\/\//.test(l.learn || ''); }).map(function(l){ return l.created_at; }).concat(cases.map(function(c){ return c.created_at; })).sort();
      if (lk.length) f.lookup = lk[0];
      if (u) f.signup = u.created_at;
      var pd = p.payments.map(function(x){ return x.paid_at || x.created_at; }).concat(cases.filter(function(c){ return c.paid; }).map(function(c){ var e = (c.log || []).filter(function(l){ return /payment confirmed/i.test(l.note || ''); })[0]; return e ? e.at : c.created_at; })).filter(Boolean).sort();
      if (pd.length || (u && u.status === 'active' && cases.some(function(c){ return c.paid; }))) f.paid = pd[0] || (u && u.created_at);
      var od = cases.filter(function(c){ return c.paid; }).map(function(c){ var e = (c.log || []).filter(function(l){ return /payment confirmed/i.test(l.note || ''); })[0]; return e ? e.at : c.created_at; }).sort();
      if (od.length) f.ordered = od[0];
      var ad = p.tasks.map(function(t){ return t.created_at || ''; }).filter(Boolean).sort();   // overview tasks carry no creation date
      if (p.tasks.length) f.agent = ad[0] || 'yes';
      var rd = cases.filter(function(c){ return c.report_url || (c.stage === 5 && c.verdict && c.verdict !== 'pending'); }).map(function(c){ var e = (c.log || []).filter(function(l){ return l.stage === 5; }).slice(-1)[0]; return e ? e.at : c.created_at; }).sort();
      if (rd.length) f.report = rd[0];
      p.flags = f; p.stage = 1; PIPE.forEach(function(s, i){ if (f[s[0]]) p.stage = i; });
      if (!f.lookup && !f.signup && !f.paid) p.stage = -1;   // a lead that never looked a project up (newsletter, partner form)
      p.lastAt = [p.created].concat(cases.map(function(c){ return (c.log || []).concat(c.messages || []).map(function(x){ return x.at; }).sort().slice(-1)[0]; }), p.notes.map(function(n){ return n.created_at; }), u ? [u.last_login] : []).filter(Boolean).sort().slice(-1)[0];
    });
    return list;
  }
  function stageLabel(i){ return i < 0 ? 'Lead (no lookup)' : PIPE[i][1]; }
  function find(id){ return people().filter(function(p){ return p.id === id; })[0]; }

  // ---------- Pipeline
  function events(kinds, since){ return (D.events || []).filter(function(e){ return kinds.indexOf(e.kind) >= 0 && (!since || e.created_at >= since); }); }
  function evCoverage(){ var E = D.events || []; return E.length >= 300 ? E[E.length - 1].created_at : null; }
  function renderPipe(){
    var sec = $('t-pipe'); if (!sec) return;
    var since = DAYS ? new Date(Date.now() - DAYS * 864e5).toISOString() : '', hide = !$('bz-pt') || $('bz-pt').checked;
    var P = people().filter(function(p){ return !(hide && p.test); }), inP = function(p){ return !since || (p.created >= since); };
    var cohort = P.filter(inP);
    // stage 1: visits to /check from kolaboro_traffic (counts per period); stage 2: lookup events
    var tr = X.traffic, visits = null, vNote = '';
    if (tr && tr.landing && X.trafficDays === (DAYS || 365)) { visits = 0; tr.landing.forEach(function(x){ if (/^\/([a-z]{2}\/)?check\/?$/.test(String(x.page || '').split('?')[0])) visits += +x.n || 0; }); vNote = 'visits to /check (all languages), kolaboro_traffic'; }
    else { visits = events(['visit'], since).filter(function(e){ return /^\/([a-z]{2}\/)?check\/?$/.test(String(e.page || '').split('?')[0]); }).length; vNote = 'visits to /check in the latest events'; }
    var cov = evCoverage(), lookEv = events(LOOKUP_KINDS, since), lookPeople = cohort.filter(function(p){ return p.flags.lookup; }).length;
    var lookups = Math.max(lookEv.length, lookPeople);
    var byKind = {}; lookEv.forEach(function(e){ byKind[e.kind] = (byKind[e.kind] || 0) + 1; });
    var reach = PIPE.map(function(s, i){ return i < 2 ? 0 : cohort.filter(function(p){ return p.flags[s[0]]; }).length; });
    reach[0] = visits; reach[1] = lookups;
    var src = ['From ' + vNote, 'Desk reviews and register lookups logged by the site' + (Object.keys(byKind).length ? ' (' + Object.keys(byKind).map(function(k){ return k.replace(/_/g, ' ') + ' ' + byKind[k]; }).join(', ') + ')' : '') + ', or leads who gave a project', 'Accounts created (kolaboro_users)', 'Payment recorded or case marked paid', 'A paid case exists (the full check includes the site visit)', 'A field task exists for the case', 'Report URL set or verdict published'];
    var mx = Math.max.apply(null, reach.concat([1]));
    var fun = PIPE.map(function(s, i){
      return '<div><small>' + (i + 1) + '. ' + s[1] + '</small><b>' + reach[i] + '</b>' + (i ? '<span class="cv" title="Conversion from the previous stage">' + pct(reach[i], reach[i - 1]) + ' from ' + PIPE[i - 1][1].toLowerCase() + '</span>' : '<span class="cv">&nbsp;</span>') +
        '<div class="bar' + (i < 2 ? ' anon' : '') + '" style="width:' + Math.max(3, Math.round(100 * reach[i] / mx)) + '%"></div><small style="font-size:.72rem;margin-top:4px">' + esc(src[i]) + '</small></div>';
    }).join('');
    var cols = PIPE.slice(1).map(function(s, j){ var i = j + 1; return { i: i, name: s[1], list: cohort.filter(function(p){ return p.stage === i; }).sort(function(a, b){ return (b.lastAt || '') < (a.lastAt || '') ? -1 : 1; }) }; });
    var leadOnly = cohort.filter(function(p){ return p.stage < 0; }).length;
    // stuck: what needs a push today
    var stuck = [];
    P.forEach(function(p){
      if (p.flags.lookup && !p.flags.signup && daysSince(p.flags.lookup) >= 2 && daysSince(p.flags.lookup) <= 60) stuck.push([p, 'Looked a project up ' + daysSince(p.flags.lookup) + ' d ago, no account yet']);
      if (p.flags.signup && !p.flags.paid && daysSince(p.flags.signup) >= 2 && daysSince(p.flags.signup) <= 60) stuck.push([p, 'Account ' + daysSince(p.flags.signup) + ' d old, not paid']);
      if (p.flags.paid && !p.flags.ordered) stuck.push([p, 'Paid but no paid case yet (payment not attached: check email confirmation or assign the payment)']);
      p.cases.forEach(function(c){ if (c.paid && !c._tasks.length && !c.report_url) stuck.push([p, 'Case ' + c.code + ' paid ' + (daysSince(c.created_at) || 0) + ' d ago, no agent assigned']); if (c.eta && c.eta < today() && !c.report_url) stuck.push([p, 'Case ' + c.code + ' report overdue since ' + c.eta]); });
      if (p.next && p.next <= today()) stuck.push([p, 'Next action due ' + p.next]);
    });
    var keepHide = hide;
    sec.innerHTML = '<div class="bz-f"><label>Period <select id="bz-pd">' + [[7, '7 days'], [30, '30 days'], [90, '90 days'], [365, '12 months']].map(function(x){ return '<option value="' + x[0] + '"' + (x[0] === DAYS ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></label><label><input type="checkbox" id="bz-pt"' + (keepHide ? ' checked' : '') + '> hide tests</label><span class="sp" style="flex:1"></span><button class="btn2" id="bz-pcsv" type="button">Export pipeline CSV</button></div>' +
      '<div class="card"><h2>Pipeline, last ' + DAYS + ' days</h2><div class="bz-fun">' + fun + '</div>' +
      '<p class="muted" style="font-size:.8rem;margin:8px 0 0">Stages 1 and 2 are anonymous counts (blue bars). Stages 3 to 7 count the people who arrived in this period and reached that stage so far. Every number comes from the database; nothing is estimated.' + (cov && (!since || cov > since) ? ' Lookup events are counted from the latest 300 site events, which go back to ' + esc(day(cov)) + '.' : '') + (leadOnly ? ' ' + leadOnly + ' lead(s) left an email without looking a project up (newsletter, partner forms): see Customers.' : '') + '</p></div>' +
      '<div class="card"><h2>Needs a push today <span class="pill">' + stuck.length + '</span></h2>' + (stuck.length ? '<ul style="margin:0;padding-left:18px">' + stuck.slice(0, 40).map(function(x){ return '<li><a href="#c=' + encodeURIComponent(x[0].id) + '">' + esc(x[0].name || x[0].email) + '</a> · ' + esc(x[1]) + '</li>'; }).join('') + '</ul>' : '<p class="muted" style="margin:0">Nothing stuck.</p>') + '</div>' +
      '<div class="card"><h2>Who is where</h2><div class="bz-board" style="--n:' + cols.length + '">' + cols.map(function(c){ return '<div class="bz-col"><h3><span>' + esc(c.name) + '</span><span>' + c.list.length + '</span></h3>' + c.list.slice(0, 60).map(pcard).join('') + (c.list.length > 60 ? '<p class="muted">+' + (c.list.length - 60) + ' more in Customers</p>' : '') + '</div>'; }).join('') + '</div></div>';
    $('bz-pd').onchange = function(){ DAYS = +this.value; X.at = 0; more(true).then(renderPipe); };
    $('bz-pt').onchange = renderPipe;
    $('bz-pcsv').onclick = function(){ csv('kolaboro-pipeline', [['stage', function(p){ return stageLabel(p.stage); }]].concat(PIPE.slice(1).map(function(s){ return [s[0] + '_at', function(p){ return day(p.flags[s[0]]); }]; }), [['email', function(p){ return p.email; }], ['name', function(p){ return p.name; }], ['first_seen', function(p){ return day(p.created); }]]), cohort); };
  }
  function pcard(p){
    var c = p.cases[0], d = p.flags[PIPE[p.stage] ? PIPE[p.stage][0] : ''];
    return '<a class="bz-card" href="#c=' + encodeURIComponent(p.id) + '"><b>' + esc(p.name || p.email) + '</b><small>' + esc(p.email) + '</small>' + (c ? '<small>' + esc(c.project_name || c.code) + '</small>' : '') + '<small>' + (d && d !== 'yes' ? 'since ' + esc(day(d)) + ' · ' + daysSince(d) + ' d' : '') + (p.next ? ' · next ' + esc(p.next.slice(5)) : '') + '</small></a>';
  }

  // ---------- Customers list
  function custFilters(){ var g = function(i){ var e = $(i); return e ? (e.type === 'checkbox' ? e.checked : e.value) : undefined; }; return { q: g('bz-cq') || '', st: g('bz-cs') || '', us: g('bz-cu') || '', from: g('bz-cf') || '', to: g('bz-ct') || '', hide: g('bz-ch') !== false }; }
  var COLS = [['name', 'Customer'], ['stage', 'Stage'], ['created', 'First seen'], ['status', 'Account'], ['cases', 'Projects'], ['paid', 'Paid'], ['last', 'Last activity'], ['next', 'Next action']];
  function sortVal(p, k){ return k === 'name' ? (p.name || p.email).toLowerCase() : k === 'stage' ? p.stage : k === 'created' ? p.created : k === 'status' ? (p.user ? p.user.status : '') : k === 'cases' ? p.cases.length + p.leads.length / 100 : k === 'paid' ? (p.paidTotal.EUR || 0) + (p.paidTotal.USD || 0) : k === 'last' ? p.lastAt || '' : k === 'next' ? p.next || '9999' : ''; }
  function custRows(){
    var f = custFilters(), q = f.q.toLowerCase();
    return people().filter(function(p){
      if (f.hide && p.test) return false;
      if (f.st !== '' && String(p.stage) !== f.st) return false;
      if (f.us === 'account' && !p.user) return false; if (f.us === 'lead' && p.user) return false;
      if (f.us && ['active', 'pending', 'free'].indexOf(f.us) >= 0 && (!p.user || p.user.status !== f.us)) return false;
      if (f.from && day(p.created) < f.from) return false; if (f.to && day(p.created) > f.to) return false;
      if (!q) return true;
      return JSON.stringify([p.email, p.name, p.country, p.tags, p.cases.map(function(c){ return [c.code, c.project_name, c.project_url, c.developer, c.location]; }), p.leads.map(function(l){ return [l.learn, l.plan]; }), p.payments.map(function(x){ return x.ref; })]).toLowerCase().indexOf(q) >= 0;
    }).sort(function(a, b){ var x = sortVal(a, SORT.k), y = sortVal(b, SORT.k); return (x < y ? -1 : x > y ? 1 : 0) * SORT.dir; });
  }
  function renderCust(){
    var sec = $('t-cust'); if (!sec) return;
    var m = /^#c=([^&]+)/.exec(location.hash);
    if (m) { var p = find(decodeURIComponent(m[1])); if (p) return record(p); }
    var f = custFilters();
    if (!$('bz-cq')) {
      sec.innerHTML = '<div class="bz-f" role="search"><label class="bz-sr" for="bz-cq">Search customers</label><input id="bz-cq" type="search" placeholder="Search email, name, project, PayPal ID…" style="flex:2;min-width:200px">' +
        '<label>Stage <select id="bz-cs"><option value="">Any</option><option value="-1">Lead (no lookup)</option>' + PIPE.slice(1).map(function(s, i){ return '<option value="' + (i + 1) + '">' + s[1] + '</option>'; }).join('') + '</select></label>' +
        '<label>Status <select id="bz-cu"><option value="">Any</option><option value="account">Has an account</option><option value="lead">Lead only</option><option value="active">Account active</option><option value="pending">Account pending</option></select></label>' +
        '<label>From <input id="bz-cf" type="date"></label><label>To <input id="bz-ct" type="date"></label><label><input id="bz-ch" type="checkbox" checked> hide tests</label><button class="btn2" id="bz-ccsv" type="button">Export CSV</button></div>' +
        '<div class="card"><p class="muted" id="bz-cn" style="margin:0 0 6px" aria-live="polite"></p><div class="tw"><table class="bz-t" id="bz-ctab"></table></div></div>';
      ['bz-cq', 'bz-cs', 'bz-cu', 'bz-cf', 'bz-ct', 'bz-ch'].forEach(function(i){ $(i).addEventListener('input', custTable); $(i).addEventListener('change', custTable); });
      $('bz-ccsv').onclick = function(){ csv('kolaboro-customers', [['email', function(p){ return p.email; }], ['name', function(p){ return p.name; }], ['country', function(p){ return p.country; }], ['first_seen', function(p){ return day(p.created); }], ['stage', function(p){ return stageLabel(p.stage); }], ['account', function(p){ return p.user ? p.user.status : 'lead'; }], ['projects', function(p){ return p.cases.map(function(c){ return c.code + ' ' + (c.project_name || ''); }).concat(p.leads.map(function(l){ return l.learn; }).filter(Boolean)).join(' | '); }], ['paid', function(p){ return Object.keys(p.paidTotal).map(function(c){ return c + ' ' + p.paidTotal[c]; }).join(' '); }], ['last_activity', function(p){ return day(p.lastAt); }], ['next_action', function(p){ return p.next; }], ['tags', function(p){ return p.tags.join('|'); }]], custRows()); };
    }
    custTable();
  }
  function custTable(){
    var R = custRows(), t = $('bz-ctab'); if (!t) return;
    $('bz-cn').textContent = R.length + ' customer' + (R.length === 1 ? '' : 's') + ' (one row per email: accounts, leads and payers)';
    t.innerHTML = '<thead><tr>' + COLS.map(function(c){ var on = SORT.k === c[0]; return '<th aria-sort="' + (on ? (SORT.dir > 0 ? 'ascending' : 'descending') : 'none') + '"><button type="button" data-sort="' + c[0] + '">' + c[1] + (on ? (SORT.dir > 0 ? ' ▲' : ' ▼') : '') + '</button></th>'; }).join('') + '</tr></thead><tbody>' +
      (R.map(function(p){ var t0 = today();
        return '<tr class="cl" data-go="' + esc(p.id) + '"><td><a href="#c=' + encodeURIComponent(p.id) + '"><b>' + esc(p.name || p.email) + '</b></a><br><small class="muted">' + esc(p.email) + (p.country ? ' · ' + esc(p.country) : '') + '</small></td><td><span class="bz-chip s' + p.stage + '">' + esc(stageLabel(p.stage)) + '</span></td><td>' + esc(day(p.created)) + '</td><td>' + (p.user ? esc(p.user.status) : '<span class="muted">lead</span>') + '</td>' +
          '<td>' + (p.cases.map(function(c){ return esc(c.project_name || c.code); }).concat(p.leads.filter(function(l){ return l.learn; }).slice(0, 1).map(function(l){ return '<span class="muted">' + esc(String(l.learn).replace(/^https?:\/\/(www\.)?/, '').slice(0, 40)) + '</span>'; })).join('<br>') || '-') + '</td>' +
          '<td>' + (Object.keys(p.paidTotal).map(function(c){ return esc(c) + ' ' + num(p.paidTotal[c]); }).join('<br>') || '-') + '</td><td>' + esc(p.lastAt ? ago(p.lastAt) : '') + '</td><td>' + (p.next ? '<span' + (p.next <= t0 ? ' style="color:var(--bad);font-weight:700"' : '') + '>' + esc(p.next) + '</span>' : '') + '</td></tr>'; }).join('') || '<tr><td colspan="8" class="muted">No customer matches these filters.</td></tr>') + '</tbody>';
    t.querySelectorAll('[data-sort]').forEach(function(b){ b.onclick = function(){ var k = b.dataset.sort; SORT = { k: k, dir: SORT.k === k ? -SORT.dir : (k === 'name' || k === 'next' ? 1 : -1) }; custTable(); var nb = t.querySelector('[data-sort="' + k + '"]'); if (nb) nb.focus(); }; });
    t.querySelectorAll('tr[data-go]').forEach(function(r){ r.onclick = function(e){ if (e.target.closest('a,button')) return; location.hash = 'c=' + encodeURIComponent(r.dataset.go); }; });
  }

  // ---------- Customer record (one page per customer: #c=<id>)
  function auditFor(ids){ var A2 = (X.health && X.health.audit_recent) || []; return A2.filter(function(a){ return a.target && ids.indexOf(a.target) >= 0; }); }
  function record(p){
    var sec = $('t-cust'), u = p.user, ids = [p.email].concat(u ? [u.id] : [], p.cases.map(function(c){ return c.id; }), p.leads.map(function(l){ return l.id; }), p.payments.map(function(x){ return String(x.id); }));
    var tl = [];
    p.leads.forEach(function(l){ tl.push({ at: l.created_at, k: 'lead', t: 'Form: ' + (l.plan || 'lead') + (l.learn ? ' · ' + l.learn : '') + (l.bring ? '\n' + l.bring : '') }); });
    if (u) { tl.push({ at: u.created_at, k: 'sys', t: 'Created an account' }); if (u.last_login) tl.push({ at: u.last_login, k: 'sys', t: 'Last login' }); }
    p.cases.forEach(function(c){
      tl.push({ at: c.created_at, k: 'sys', t: 'Opened case ' + c.code + (c.project_name ? ' · ' + c.project_name : '') + (c.paid ? '' : ' (unpaid)') });
      (c.log || []).forEach(function(l){ tl.push({ at: l.at, k: 'log', t: c.code + ' · ' + (STG[l.stage] || 'stage ' + l.stage) + (l.note ? ' · ' + l.note : '') }); });
      (c.messages || []).forEach(function(m){ tl.push({ at: m.at, k: 'msg', t: (m.admin ? 'Kolaboro → client' : 'Client → Kolaboro') + ' (' + c.code + '): ' + m.body }); });
      (c._tasks || []).forEach(function(t){ tl.push({ at: t.submitted_at || t.approved_at || t.due || c.created_at, k: 'log', t: 'Field task ' + (t.kind || '') + ' for ' + c.code + ' · ' + (t.agent_name || t.agent || '') + ' · ' + t.status }); });
    });
    p.payments.forEach(function(x){ tl.push({ at: x.paid_at, k: 'pay', t: 'Payment ' + (x.currency || '') + ' ' + num(x.amount) + (x.product ? ' · ' + x.product : '') + (x.source ? ' · ' + x.source : ' · recorded by hand') }); });
    p.pev.forEach(function(e){ if (!e.matched) tl.push({ at: e.created_at, k: 'pay', t: 'PayPal event not yet matched: ' + (e.status || '') + ' ' + (e.currency || '') + ' ' + num(e.amount) }); });
    p.notes.forEach(function(n){ tl.push({ at: n.created_at, k: 'note', t: (n.kind || 'note') + (n.due ? ' (due ' + n.due + (n.done ? ', done' : '') + ')' : '') + ': ' + n.body, id: n.id, done: n.done }); });
    auditFor(ids).forEach(function(a){ tl.push({ at: a.at, k: 'audit', t: 'Admin action: ' + a.action.replace(/_/g, ' ') + ' · audit #' + a.hash }); });
    tl.sort(function(a, b){ return (b.at || '') < (a.at || '') ? -1 : 1; });
    var lastLead = p.leads[0];
    var h = '<div class="bz-f"><a class="btn2" href="#" id="bz-back">← All customers</a><span class="muted">Customer record</span></div>' +
      '<div class="card"><div class="row"><div style="flex:1;min-width:220px"><h2 style="margin:0">' + esc(p.name || p.email) + '</h2><span class="muted"><a href="mailto:' + esc(p.email) + '">' + esc(p.email) + '</a>' + (p.country ? ' · ' + esc(p.country) : '') + ' · first seen ' + esc(day(p.created)) + '</span></div>' +
      '<span class="bz-chip s' + p.stage + '">' + esc(stageLabel(p.stage)) + '</span>' + (u ? '<button class="btn2" type="button" id="bz-as">Open their portal ↗</button>' : '') + '</div>' +
      '<div class="bz-steps" aria-label="Pipeline stages reached">' + PIPE.slice(1).map(function(s){ var d = p.flags[s[0]]; return '<span class="' + (d ? 'on' : '') + '">' + s[1] + (d && d !== 'yes' ? ' · ' + esc(day(d)) : '') + '</span>'; }).join('') + '</div></div>' +
      '<div class="bz-rec"><div>' +
      '<div class="card"><h2>Projects and checks</h2>' + (p.cases.length ? p.cases.map(caseBox).join('') : '<p class="muted" style="margin:0">No case yet.</p>') +
        (p.leads.filter(function(l){ return l.learn; }).length ? '<h3 style="font-size:.95rem;margin:12px 0 4px">Projects from forms</h3><ul style="margin:0;padding-left:18px">' + p.leads.filter(function(l){ return l.learn; }).map(function(l){ return '<li>' + (/^https?:\/\//.test(l.learn) ? '<a href="' + surl(l.learn) + '" target="_blank" rel="noopener noreferrer">' + esc(l.learn) + '</a>' : esc(l.learn)) + ' <small class="muted">' + esc(l.plan || '') + ' · ' + esc(day(l.created_at)) + '</small></li>'; }).join('') + '</ul>' : '') +
        (u && u.saved ? '<p class="muted" style="margin:8px 0 0">' + u.saved + ' project(s) saved in their watchlist.</p>' : '') + '</div>' +
      '<div class="card"><h2>Payments</h2>' + (p.payments.length || p.pev.length ? '<div class="tw"><table><tr><th>Date</th><th>Amount</th><th>Product</th><th>Source</th><th>PayPal ID</th></tr>' + p.payments.map(function(x){ return '<tr><td>' + esc(x.paid_at) + '</td><td><b>' + esc(x.currency) + ' ' + num(x.amount) + '</b></td><td>' + esc(x.product || '') + '</td><td>' + esc(x.source || 'manual') + '</td><td>' + esc(x.ref || '') + '</td></tr>'; }).join('') + p.pev.filter(function(e){ return !e.matched; }).map(function(e){ return '<tr><td>' + esc(day(e.created_at)) + '</td><td>' + esc(e.currency) + ' ' + num(e.amount) + '</td><td>' + esc(e.item || '') + '</td><td>' + esc(e.source || '') + ' · <b>not matched</b></td><td>' + esc(e.txn || '') + '</td></tr>'; }).join('') + '</table></div>' : '<p class="muted" style="margin:0">No payment recorded.</p>') + '</div>' +
      '<div class="card"><h2>Messages</h2>' + (p.cases.length ? p.cases.map(function(c){ return '<h3 style="font-size:.9rem;margin:8px 0 0">' + esc(c.code) + '</h3><div class="chat">' + ((c.messages || []).map(function(m){ return '<div class="' + (m.admin ? 'a' : 'u') + '">' + esc(m.body) + '<small>' + (m.admin ? 'Kolaboro' : esc(p.name || 'Client')) + ' · ' + esc(ago(m.at)) + '</small></div>'; }).join('') || '<p class="muted">No messages.</p>') + '</div><form class="row bz-msg" data-case="' + esc(c.id) + '"><label class="bz-sr" for="bz-m-' + esc(c.id) + '">Reply</label><textarea id="bz-m-' + esc(c.id) + '" name="body" rows="2" style="flex:1;min-width:180px" placeholder="Reply on case ' + esc(c.code) + '…"></textarea><button class="btn">Send</button></form>'; }).join('') : '<p class="muted" style="margin:0">Messages need a case.</p>') + '</div>' +
      '<div class="card"><h2>Files and evidence</h2><div id="bz-files">' + (p.cases.length ? '<button class="btn2" type="button" id="bz-lf">Load files for ' + p.cases.length + ' case(s)</button>' : '<p class="muted" style="margin:0">No case, so no files.</p>') + '</div></div>' +
      '</div><div>' +
      '<div class="card"><h2>Next action and notes</h2><form id="bz-nf" class="bz-form"><div class="bz-g2"><label>Next action date<input type="date" name="next" value="' + esc(p.next) + '"></label><label>Tags<input name="tags" value="' + esc(p.tags.join(', ')) + '" placeholder="hot, bali"></label></div>' + (u || lastLead ? '<button class="btn2" style="margin-top:8px">Save</button>' : '') + '</form>' +
        '<form id="bz-an" class="bz-form" style="margin-top:10px"><div class="bz-g2"><label>Type<select name="kind"><option value="note">Note</option><option value="call">Call</option><option value="email">Email</option><option value="meeting">Meeting</option><option value="task">Task (next step)</option></select></label><label>Due<input type="date" name="due"></label></div><label>Note<textarea name="body" rows="3" required placeholder="What happened, what is next"></textarea></label><button class="btn" style="margin-top:8px">Add note</button></form>' +
        (D.kpi === undefined ? '<div class="bz-note">Notes need the CRM notes table, which is not in this database yet.</div>' : '') + '</div>' +
      '<div class="card"><h2>Timeline</h2><ul class="bz-tl">' + tl.map(function(x){ return '<li class="k-' + x.k + '"><small>' + esc(day(x.at)) + ' ' + esc(String(x.at || '').slice(11, 16)) + '</small>' + esc(x.t) + (x.id ? ' <button class="btn-s" type="button" data-nd="' + x.id + '" data-v="' + (!x.done) + '">' + (x.done ? 'Reopen' : 'Done') + '</button>' : '') + '</li>'; }).join('') + '</ul><p class="muted" style="font-size:.78rem;margin:6px 0 0">Admin actions shown are the ones among the latest 40 entries of the audit log.</p></div>' +
      '</div></div>';
    sec.innerHTML = h;
    $('bz-back').onclick = function(e){ e.preventDefault(); history.pushState(null, '', location.pathname); renderCust(); };
    var as = $('bz-as'); if (as) as.onclick = function(){ adm('impersonate', { user_id: u.id }).then(function(d){ if (d && d.token) window.open('/portal#as=' + d.token, '_blank', 'noopener'); }); };
    $('bz-nf').onsubmit = function(e){ e.preventDefault(); var f = e.target, tags = f.tags.value.split(',').map(function(x){ return x.trim(); }).filter(Boolean);
      var jobs = []; if (u) jobs.push(adm('user_update', { id: u.id, next_action: f.next.value, tags: tags })); if (lastLead) jobs.push(adm('lead_update', { id: lastLead.id, next_action: f.next.value, tags: tags }));
      Promise.all(jobs).then(function(r){ if (!r.some(fail)) A.reload(); }); };
    $('bz-an').onsubmit = function(e){ e.preventDefault(); var f = e.target, b = f.body.value.trim(); if (!b) return;
      adm('add_note', { user_id: u ? u.id : '', lead_id: lastLead ? lastLead.id : '', kind: f.kind.value, body: b, due: f.due.value }).then(function(d){ if (!fail(d)) A.reload(); }); };
    sec.querySelectorAll('[data-nd]').forEach(function(b){ b.onclick = function(){ adm('note_done', { id: +b.dataset.nd, done: b.dataset.v === 'true' }).then(function(d){ if (!fail(d)) A.reload(); }); }; });
    sec.querySelectorAll('form.bz-msg').forEach(function(f){ f.onsubmit = function(e){ e.preventDefault(); var t = f.body.value.trim(); if (!t) return; adm('admin_message', { case_id: f.dataset.case, body: t }).then(function(d){ if (!fail(d)) A.reload(); }); }; });
    sec.querySelectorAll('[data-cstage]').forEach(function(s){ s.onchange = function(){ moveCase(s.dataset.cstage, +s.value); }; });
    var lf = $('bz-lf'); if (lf) lf.onclick = function(){ loadFiles(p); };
    window.scrollTo(0, 0);
  }
  function caseBox(c){
    var dd = daysInStage(c);
    return '<div class="bz-case"><h4>' + esc(c.project_name || c.code) + ' <small class="muted">' + esc(c.code) + '</small></h4>' +
      '<div class="bz-kv"><span>Stage</span><span style="color:inherit"><select data-cstage="' + esc(c.id) + '" aria-label="Stage of case ' + esc(c.code) + '">' + STG.map(function(s, i){ return '<option value="' + i + '"' + (i === c.stage ? ' selected' : '') + '>' + i + '. ' + s + '</option>'; }).join('') + '</select> <span class="bz-sla ' + sla(dd, c) + '">' + dd + ' d in stage</span></span>' +
      '<span>Paid</span><b>' + (c.paid ? 'yes' : 'no') + '</b><span>Verdict</span><b>' + esc(c.verdict || 'pending') + '</b>' + (c.eta ? '<span>Report due</span><b>' + esc(c.eta) + '</b>' : '') +
      (c.project_url ? '<span>URL</span><b style="word-break:break-all"><a href="' + surl(c.project_url) + '" target="_blank" rel="noopener noreferrer">' + esc(c.project_url) + '</a></b>' : '') +
      ([c.developer, c.location, c.price_text].filter(Boolean).length ? '<span>Details</span><b>' + esc([c.developer, c.location, c.price_text].filter(Boolean).join(' · ')) + '</b>' : '') +
      ((c._tasks || []).length ? '<span>Agent</span><b>' + c._tasks.map(function(t){ return esc((t.agent_name || t.agent) + ' · ' + t.status + (t.due ? ' · due ' + t.due : '')); }).join('<br>') + '</b>' : '') +
      (c.report_url ? '<span>Report</span><b><a href="' + surl(c.report_url) + '" target="_blank" rel="noopener">Open report ↗</a></b>' : '') +
      (c.desk && c.desk.report ? '<span>Desk review</span><b style="font-weight:400">' + esc(c.desk.report.attention || '') + ' attention · ' + esc(String(c.desk.report.summary || '').slice(0, 220)) + '</b>' : '') +
      ((c.schedule || []).length ? '<span>Payment plan</span><b style="font-weight:400">' + c.schedule.map(function(s){ return esc((s.label || '') + ' ' + (s.amount || '') + (s.due ? ' on ' + s.due : '') + (s.paid ? ' (paid)' : '')); }).join('<br>') + '</b>' : '') +
      '</div></div>';
  }
  function loadFiles(p){
    var box = $('bz-files'); box.innerHTML = '<p class="muted">Loading…</p>';
    Promise.all(p.cases.map(function(c){ return ops('evidence', { case_code: c.code }).then(function(d){ return { c: c, d: d }; }, function(){ return { c: c, d: null }; }); })).then(function(R){
      var rows = []; R.forEach(function(r){ ((r.d && r.d.evidence) || []).forEach(function(e){ rows.push({ c: r.c, e: e }); }); });
      box.innerHTML = rows.length ? '<div class="tw"><table><tr><th>Case</th><th>When</th><th>What</th><th>By</th><th>Status</th><th></th></tr>' + rows.map(function(x){ var e = x.e; return '<tr><td>' + esc(x.c.code) + '</td><td>' + esc(day(e.at || e.taken_at)) + '</td><td>' + esc(e.title || e.kind) + (e.sha256 ? '<br><small class="muted">sha256 ' + esc(String(e.sha256).slice(0, 12)) + '…</small>' : '') + '</td><td>' + esc(e.by || '') + '</td><td>' + esc(e.status || '') + '</td><td>' + (e.file ? '<button class="btn-s" type="button" data-file="' + e.id + '">Open file</button>' : '') + '</td></tr>'; }).join('') + '</table></div>' : '<p class="muted" style="margin:0">No files or evidence on these cases yet.</p>';
      box.querySelectorAll('[data-file]').forEach(function(b){ b.onclick = function(){ var w = window.open('', '_blank'); ops('file', { id: +b.dataset.file }).then(function(d){ if (!d || !d.url || !/^data:[a-z]+\/[a-z0-9.+-]+;base64,/i.test(d.url)) { if (w) w.close(); alert('File not available'); return; } var m = d.url.match(/^data:([^;]+);base64,(.*)$/), bin = atob(m[2]), arr = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); var url = URL.createObjectURL(new Blob([arr], { type: m[1] })); if (w) { w.opener = null; w.location = url; } else location.href = url; }); }; });
    });
  }
  function sla(d, c){ if (c && c.eta && c.eta < today() && !c.report_url) return 'b'; return d >= 14 ? 'b' : d >= 7 ? 'w' : ''; }
  function moveCase(id, stage){
    return adm('case_update', { id: id, stage: stage, log_note: 'Moved to ' + STG[stage] + ' from the admin' }).then(function(d){ if (!fail(d)) A.reload(); });
  }

  // ---------- Cases board
  function renderBoard(){
    var sec = $('t-board'); if (!sec) return;
    var P = people(), all = []; P.forEach(function(p){ p.cases.forEach(function(c){ all.push({ p: p, c: c }); }); });
    var agents = ((X.ops && X.ops.agents) || []).filter(function(a){ return a.status === 'active'; });
    var q = (($('bz-bq') || {}).value || '').toLowerCase(), only = ($('bz-bo') || {}).value || '';
    var F = all.filter(function(x){ var c = x.c; if (only === 'paid' && !c.paid) return false; if (only === 'unpaid' && c.paid) return false; if (only === 'noagent' && (c._tasks.length || !c.paid)) return false; if (only === 'late' && !(c.eta && c.eta < today() && !c.report_url)) return false; return !q || JSON.stringify([c.code, c.project_name, c.project_url, x.p.email, x.p.name]).toLowerCase().indexOf(q) >= 0; });
    var late = all.filter(function(x){ return x.c.eta && x.c.eta < today() && !x.c.report_url; }).length, noag = all.filter(function(x){ return x.c.paid && !x.c._tasks.length && !x.c.report_url; }).length;
    var aud = ((X.health && X.health.audit_recent) || []).slice(0, 12);
    var keepQ = q, keepO = only;
    sec.innerHTML = '<div class="kpis" style="margin-top:14px">' + [['Cases', all.length], ['Paid', all.filter(function(x){ return x.c.paid; }).length], ['Paid, no agent', noag], ['Report overdue', late], ['Active agents', agents.length]].map(function(k){ return '<div class="kpi"><span>' + k[0] + '</span><b>' + k[1] + '</b></div>'; }).join('') + '</div>' +
      '<div class="bz-f"><label class="bz-sr" for="bz-bq">Search cases</label><input id="bz-bq" type="search" placeholder="Search case, project, client…" style="flex:1;min-width:200px" value="' + esc(keepQ) + '"><label>Show <select id="bz-bo">' + [['', 'All cases'], ['paid', 'Paid'], ['unpaid', 'Unpaid'], ['noagent', 'Paid, no agent'], ['late', 'Report overdue']].map(function(o){ return '<option value="' + o[0] + '"' + (o[0] === keepO ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label><button class="btn2" type="button" id="bz-bcsv">Export CSV</button></div>' +
      (!agents.length ? '<div class="bz-note">No active field agent yet, so cases cannot be assigned. Approve applicants in the Agents tab first.</div>' : '') +
      '<div class="bz-board" style="--n:' + STG.length + '">' + STG.map(function(s, i){ var L = F.filter(function(x){ return x.c.stage === i; }); return '<div class="bz-col"><h3><span>' + i + '. ' + esc(s) + '</span><span>' + L.length + '</span></h3>' + L.map(function(x){ return boardCard(x, agents); }).join('') + '</div>'; }).join('') + '</div>' +
      '<div class="card"><h2>Latest admin actions (audit log)</h2>' + (X.health ? (aud.length ? '<div class="tw"><table><tr><th>When</th><th>Action</th><th>Target</th><th>Hash</th></tr>' + aud.map(function(a){ return '<tr><td>' + esc(ago(a.at)) + '</td><td>' + esc(String(a.action).replace(/_/g, ' ')) + '</td><td><small>' + esc(String(a.target || '').slice(0, 8)) + '</small></td><td><code>' + esc(a.hash) + '</code></td></tr>'; }).join('') + '</table></div>' : '<p class="muted" style="margin:0">No admin action recorded yet.</p>') + (X.health.audit ? '<p class="muted" style="font-size:.8rem;margin:8px 0 0">Chain check: ' + esc(typeof X.health.audit === 'object' ? JSON.stringify(X.health.audit) : X.health.audit) + '</p>' : '') : '<p class="muted" style="margin:0">Audit log not loaded.</p>') + '</div>';
    $('bz-bq').addEventListener('input', function(){ var pos = this.selectionStart; renderBoard(); var n = $('bz-bq'); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} });
    $('bz-bo').onchange = function(){ renderBoard(); $('bz-bo').focus(); };
    $('bz-bcsv').onclick = function(){ csv('kolaboro-cases', [['code', function(x){ return x.c.code; }], ['project', function(x){ return x.c.project_name; }], ['client_email', function(x){ return x.p.email; }], ['stage', function(x){ return STG[x.c.stage]; }], ['days_in_stage', function(x){ return daysInStage(x.c); }], ['paid', function(x){ return x.c.paid; }], ['verdict', function(x){ return x.c.verdict; }], ['eta', function(x){ return x.c.eta; }], ['agent', function(x){ return x.c._tasks.map(function(t){ return t.agent + ' ' + t.status; }).join(' | '); }], ['report_url', function(x){ return x.c.report_url; }]], F); };
    sec.querySelectorAll('[data-bstage]').forEach(function(s){ s.onchange = function(){ moveCase(s.dataset.bstage, +s.value); }; });
    sec.querySelectorAll('form.bz-asg').forEach(function(f){ f.onsubmit = function(e){ e.preventDefault(); var em = f.agent.value; if (!em) return; var o = { case_code: f.dataset.code, agent_email: em, due: f.due.value, fee: f.fee.value, kind: 'site_visit' };
      f.querySelector('button').disabled = true;
      ops('assign', o).then(function(d){ if (fail(d)) { f.querySelector('button').disabled = false; return; } return logAudit('agent_assign', { case_id: f.dataset.case, task_id: d.task }).then(function(){ X.at = 0; return more(true); }).then(function(){ A.reload(); }); }); }; });
  }
  function daysInStage(c){ var last = (c.log || []).filter(function(l){ return l.stage === c.stage; }).slice(-1)[0]; return daysSince(last ? last.at : c.created_at); }
  function boardCard(x, agents){
    var c = x.c, dd = daysInStage(c), t = c._tasks || [];
    return '<div class="bz-card" style="cursor:default"><a href="#c=' + encodeURIComponent(x.p.id) + '"><b>' + esc(c.project_name || c.code) + '</b></a><small>' + esc(c.code) + ' · ' + esc(x.p.name || x.p.email) + '</small>' +
      '<small><span class="bz-sla ' + sla(dd, c) + '" title="Days since the case entered this stage">' + dd + ' d in stage</span>' + (c.paid ? '' : ' <span class="pill" style="background:#FFF0C7">unpaid</span>') + (c.eta ? ' · due ' + esc(c.eta) : '') + '</small>' +
      (t.length ? '<small>Agent: ' + t.map(function(k){ return esc((k.agent_name || k.agent) + ' (' + k.status + ')'); }).join(', ') + '</small>' : '') +
      '<label class="bz-sr" for="bz-st-' + esc(c.id) + '">Stage</label><select id="bz-st-' + esc(c.id) + '" data-bstage="' + esc(c.id) + '" style="width:100%;margin-top:6px;font-size:.82rem">' + STG.map(function(s, i){ return '<option value="' + i + '"' + (i === c.stage ? ' selected' : '') + '>Move to ' + i + '. ' + s + '</option>'; }).join('') + '</select>' +
      (agents.length && c.paid && !c.report_url ? '<details style="margin-top:6px"><summary style="font-size:.82rem">' + (t.length ? 'Assign another agent' : 'Assign agent') + '</summary><form class="bz-asg bz-form" data-code="' + esc(c.code) + '" data-case="' + esc(c.id) + '"><label>Agent<select name="agent" required><option value="">Choose…</option>' + agents.map(function(a){ return '<option value="' + esc(a.email) + '">' + esc((a.name || a.email) + (a.city ? ' · ' + a.city : '')) + '</option>'; }).join('') + '</select></label><div class="bz-g2"><label>Due<input type="date" name="due"></label><label>Fee (EUR)<input type="number" name="fee" min="0" step="1"></label></div><button class="btn" style="margin-top:6px;width:100%">Assign and email agent</button></form></details>' : '') + '</div>';
  }

  // ---------- Ledger on the Payments tab
  function renderLedger(){
    var sec = $('t-pay'); if (!sec) return;
    var box = $('bz-led'); if (!box) { box = document.createElement('div'); box.className = 'card'; box.id = 'bz-led'; var k = $('pk'); if (k && k.nextSibling) sec.insertBefore(box, k.nextSibling); else sec.appendChild(box); }
    var Pm = D.payments || [], E = D.pay_events || [], src = ($('bz-ls') || {}).value || '';
    var rows = Pm.filter(function(p){ return !src || (p.source || 'manual') === src; });
    var g = {}, cur = {}; rows.forEach(function(p){ var m = String(p.paid_at || p.created_at || '').slice(0, 7) || '?', c = p.currency || 'EUR'; cur[c] = 1; var r = g[m] = g[m] || {}; r[c] = r[c] || { n: 0, s: 0 }; r[c].n++; r[c].s += +p.amount || 0; });
    var months = Object.keys(g).sort().reverse(), C = Object.keys(cur).sort(), tot = {}; C.forEach(function(c){ tot[c] = { n: 0, s: 0 }; months.forEach(function(m){ if (g[m][c]) { tot[c].n += g[m][c].n; tot[c].s += g[m][c].s; } }); });
    var srcs = {}; Pm.forEach(function(p){ srcs[p.source || 'manual'] = 1; });
    var ok = E.filter(function(e){ return /complet/i.test(e.status || ''); }), un = ok.filter(function(e){ return !e.matched; }), ref = E.filter(function(e){ return /refund|revers|denied/i.test(e.status || ''); });
    box.innerHTML = '<div class="row"><h2 style="margin:0;flex:1">Ledger by month</h2><label class="muted" style="font-size:.85rem">Source <select id="bz-ls"><option value="">All</option>' + Object.keys(srcs).sort().map(function(s){ return '<option' + (s === src ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select></label><button class="btn2" type="button" id="bz-lcsv">Export ledger CSV</button></div>' +
      (months.length ? '<div class="tw" style="margin-top:8px"><table><tr><th>Month</th>' + C.map(function(c){ return '<th>' + esc(c) + '</th>'; }).join('') + '</tr>' + months.map(function(m){ return '<tr><td>' + esc(m) + '</td>' + C.map(function(c){ var x = g[m][c]; return '<td>' + (x ? '<b>' + num(x.s) + '</b> <small class="muted">' + x.n + ' payment' + (x.n > 1 ? 's' : '') + '</small>' : '-') + '</td>'; }).join('') + '</tr>'; }).join('') + '<tr><td><b>Total</b></td>' + C.map(function(c){ return '<td><b>' + num(tot[c].s) + '</b> <small class="muted">' + tot[c].n + '</small></td>'; }).join('') + '</tr></table></div>' : '<p class="muted">No payments recorded yet.</p>') +
      '<p class="muted" style="font-size:.84rem;margin:8px 0 0">Amounts are the rows in kolaboro_payments: PayPal webhook and IPN payments are written there automatically when they match a buyer email; the others were recorded by hand. PayPal events received: ' + E.length + ' (' + ok.length + ' completed, ' + un.length + ' completed but not matched to a buyer' + (ref.length ? ', ' + ref.length + ' refunds or reversals' : '') + '). Unmatched ones are listed below and can be assigned.</p>';
    $('bz-ls').onchange = renderLedger;
    $('bz-lcsv').onclick = function(){ csv('kolaboro-ledger', [['paid_at', function(p){ return p.paid_at; }], ['month', function(p){ return String(p.paid_at || '').slice(0, 7); }], ['currency', function(p){ return p.currency; }], ['amount', function(p){ return p.amount; }], ['product', function(p){ return p.product; }], ['source', function(p){ return p.source || 'manual'; }], ['paypal_id', function(p){ return p.ref; }], ['email', function(p){ return p.email; }], ['case_id', function(p){ return p.case_id; }]], rows); };
  }

  // ---------- wiring
  function renderAll(){ if (!D) return; try { renderPipe(); renderCust(); renderBoard(); renderLedger(); } catch (e) { if (window.console) console.warn('kolaboro admin crm', e); } }
  window.addEventListener('hashchange', function(){ if (/^#c=/.test(location.hash)) { show('cust'); renderCust(); } });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && /^#c=/.test(location.hash) && visible('cust') && !e.target.closest('input,textarea,select')) { history.pushState(null, '', location.pathname); renderCust(); } });
  document.addEventListener('kbadm', function(e){ D = e.detail; if (/^#c=/.test(location.hash)) show('cust'); if (['pipe', 'cust', 'board', 'pay'].some(visible)) more().then(renderAll); else renderAll(); });
  // agent applications: every approve / reject / new test goes to the audit log too (kolaboro_admin_agents does not log)
  document.addEventListener('click', function(e){ var b = e.target.closest && e.target.closest('[data-ag][data-s]'); if (b) logAudit('agent_' + b.dataset.s, { user_id: b.dataset.ag }); }, true);
  if (A.D) { D = A.D; renderAll(); }
})();
