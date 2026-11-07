/* Kolaboro admin CRM tab: pipeline, lead drawer with notes and tasks, today list, conversion by source.
   Reads the payload kolaboro_admin returns (window.KBADM.D, event 'kbadm'). Works before and after the CRM
   database update: tags, notes, next action and value need it, the rest does not. */
(function(){
  var A = window.KBADM; if (!A) return;
  var $ = function(i){ return document.getElementById(i); };
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  var ST = [['new','New'],['contacted','Contacted'],['qualified','Qualified'],['proposal','Proposal sent'],['won','Won'],['lost','Lost']];
  var LEGACY = { paid:'won', no:'lost' };
  var KIND = [['note','Note'],['call','Call'],['email','Email'],['meeting','Meeting'],['task','Task']];
  var D = null, SEL = null, VIEW = 'board';
  function stOf(l){ var s = l.status || 'new'; return LEGACY[s] || (ST.some(function(x){ return x[0] === s; }) ? s : 'new'); }
  function isTest(l){ return /(^|@)(test|example)\b|@example\.com$/i.test(l.email || ''); }
  function day(t){ return t ? String(t).slice(0, 10) : ''; }
  function today(){ return new Date().toISOString().slice(0, 10); }
  function ago(t){ if (!t) return ''; var s = (Date.now() - new Date(t)) / 1000; if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min'; if (s < 86400) return Math.round(s / 3600) + ' h'; return Math.round(s / 86400) + ' d'; }
  function src(l){ return l.src || l.source || 'direct'; }
  function has(){ return D && D.kpi !== undefined; }
  // Priority: transparent sum of facts about the lead, shown on hover. Not a prediction.
  function prio(l){
    var f = [], u = userFor(l), age = (Date.now() - new Date(l.created_at)) / 864e5;
    if (u) f.push([3, 'has a portal account']);
    if (u && (u.cases || []).length) f.push([3, 'opened a case']);
    if (l.paid) f.push([2, 'has paid before']);
    if (l.phone) f.push([2, 'left a phone number']);
    if (/^https?:\/\//.test(l.learn || '')) f.push([2, 'gave a project URL']);
    if (/check-request|yc-buyer|account/.test(l.plan || '')) f.push([2, 'asked for a check or opened an account']);
    if (age < 2) f.push([2, 'arrived in the last 48 h']);
    else if (age > 30 && !notesFor(l).length) f.push([-2, 'older than 30 days, never contacted']);
    if (DUP[(l.email || '').toLowerCase()] > 1) f.push([1, 'came back more than once']);
    var n = f.reduce(function(a, x){ return a + x[0]; }, 0);
    return { n: n, lvl: n >= 7 ? 'hot' : n >= 4 ? 'warm' : 'cold', why: f.map(function(x){ return (x[0] > 0 ? '+' : '') + x[0] + ' ' + x[1]; }).join('\n') || 'no signals yet' };
  }
  var DUP = {};
  var TPL = [
    ['Desk review follow-up', 'Your desk review of {project}', 'Hi {first},\n\nThanks for running a desk review on Kolaboro. A few of the points it raised can only be answered on the ground (land title, building permit, the site itself).\n\nIf you are about to make a payment, we can have someone who lives there check the project first. It takes about 7 days and costs EUR 490, refunded in full if we cannot take the case.\n\nAny questions, just reply to this email.\n\nCarlos\nKolaboro'],
    ['Next step on your check', 'Next step on your Kolaboro check', 'Hi {first},\n\nTo start the check we only need the project website and, if you have it, the contract or reservation form. You can add both in your portal: https://kolaboro.com/portal\n\nCarlos\nKolaboro'],
    ['Payment received', 'Your Kolaboro check has started', 'Hi {first},\n\nWe received your payment and your check has started. You will see every step, with dates, in your portal: https://kolaboro.com/portal\n\nCarlos\nKolaboro'],
    ['Checking in', 'Still looking at {project}?', 'Hi {first},\n\nJust checking in. Are you still considering {project}? If a payment date is coming up, tell me and we will see if we can check it before then.\n\nCarlos\nKolaboro']
  ];
  function tpl(t, l){ var first = (l.name || '').split(' ')[0] || 'there', project = (l.learn || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '') || 'the project'; return t.replace(/\{first\}/g, first).replace(/\{project\}/g, project); }
  var PICK = {};
  function act(action, payload){ return A.rpc('kolaboro_admin', { p_key: A.pw(), p_action: action, p_payload: payload }).then(function(d){ if (d && d.error) { (window.KBUI?KBUI.toast:function(m){alert(m)})('Not saved. ' + (A.err ? A.err(d) : d.error), 'bad'); return; } A.reload(); }); }

  // tab + section
  var nav = document.querySelector('nav.tabs'), main = document.querySelector('main');
  var tb = document.createElement('button'); tb.dataset.t = 'crm'; tb.innerHTML = 'CRM <span id="crm-due" class="pill" style="background:#FF5B14;color:#111;display:none"></span>';
  nav.insertBefore(tb, nav.children[1]);
  var sec = document.createElement('section'); sec.id = 't-crm'; sec.className = 'hide'; main.insertBefore(sec, main.children[1]);
  nav.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return; document.querySelectorAll('nav.tabs button').forEach(function(x){ x.classList.toggle('on', x === b); }); document.querySelectorAll('main > section').forEach(function(s){ s.classList.toggle('hide', s.id !== 't-' + b.dataset.t); }); try { localStorage.setItem('kb-adm-tab', b.dataset.t); } catch (x) {} });

  var css = document.createElement('style'); css.textContent =
    '.crm-top{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:14px}.crm-top input,.crm-top select{min-width:150px}' +
    '.crm-board{display:grid;grid-template-columns:repeat(6,minmax(210px,1fr));gap:10px;overflow:auto;margin-top:12px;padding-bottom:6px}' +
    '.crm-col{background:#EFEDE6;border-radius:14px;padding:8px;min-height:160px}.crm-col.drop{outline:2px dashed var(--hi)}.crm-col h3{margin:2px 4px 8px;font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);display:flex;justify-content:space-between}' +
    '.crm-card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:9px 10px;margin-bottom:7px;cursor:pointer;font-size:.85rem}.crm-card:hover{border-color:var(--ink)}.crm-card b{display:block}.crm-card small{color:var(--muted)}' +
    '.crm-card .tg{display:inline-block;background:#F2F1EC;border-radius:6px;padding:0 6px;margin:3px 3px 0 0;font-size:.72rem}.crm-card .due{color:var(--bad);font-weight:700}' +
    '.crm-drawer{position:fixed;top:0;right:0;bottom:0;width:min(560px,100%);background:#fff;border-left:1px solid var(--line);box-shadow:-20px 0 40px -20px rgba(0,0,0,.3);z-index:20;overflow:auto;padding:18px 20px 40px;transform:translateX(105%);transition:transform .2s}.crm-drawer.on{transform:none}' +
    '.crm-drawer h2{margin:0 0 2px}.crm-drawer label{font-size:.78rem;font-weight:700;display:block;margin-top:10px}.crm-drawer input,.crm-drawer select,.crm-drawer textarea{width:100%;margin-top:3px}' +
    '.crm-g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.crm-kv{display:grid;grid-template-columns:120px 1fr;gap:4px 10px;font-size:.86rem;margin-top:10px}.crm-kv span{color:var(--muted)}' +
    '.crm-tl{list-style:none;padding:0;margin:10px 0 0}.crm-tl li{border-left:2px solid var(--line);padding:2px 0 10px 12px;position:relative;font-size:.88rem;white-space:pre-wrap}.crm-tl li::before{content:"";position:absolute;left:-6px;top:6px;width:10px;height:10px;border-radius:50%;background:var(--line)}.crm-tl li.k-call::before{background:#3B6FD8}.crm-tl li.k-email::before{background:#1E9E6A}.crm-tl li.k-meeting::before{background:#8A4FD8}.crm-tl li.k-task::before{background:var(--hi)}.crm-tl li.k-sys::before{background:#bbb}.crm-tl li small{display:block;color:var(--muted)}.crm-tl li.done{opacity:.55}' +
    '.crm-today li{margin:4px 0}.crm-x{position:sticky;top:0;float:right;border:0;background:#F2F1EC;border-radius:10px;padding:6px 10px;cursor:pointer}.crm-warn{background:#FFF4E5;border:1px solid #F5C98B;border-radius:12px;padding:10px 12px;font-size:.88rem;margin-top:12px}' +
    '.crm-pr{float:right;min-width:24px;text-align:center;border-radius:999px;font-size:.72rem;font-weight:800;padding:1px 6px;background:#E6E4DD;cursor:help}.crm-pr.hot{background:#FF5B14;color:#111}.crm-pr.warm{background:#FFE6D9}' +
    '.crm-src td,.crm-src th{padding:6px}.crm-bar{height:8px;background:var(--hi);border-radius:4px}' +
    '@media(max-width:700px){.crm-g2{grid-template-columns:1fr}.crm-kv{grid-template-columns:1fr}}';
  document.head.appendChild(css);
  var dr = document.createElement('aside'); dr.className = 'crm-drawer'; dr.setAttribute('aria-label', 'Lead'); document.body.appendChild(dr);
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !sec.classList.contains('hide')) { e.preventDefault(); var q = $('crm-q'); if (q) q.focus(); } });
  function close(){ dr.classList.remove('on'); SEL = null; }

  function leads(){ return (D.leads || []).slice(); }
  function filtered(){
    var q = (($('crm-q') || {}).value || '').toLowerCase(), p = ($('crm-p') || {}).value, s = ($('crm-s') || {}).value, t = ($('crm-t') || {}).value, hide = ($('crm-h') || {}).checked;
    return leads().filter(function(l){
      if (hide && isTest(l)) return false;
      if (p && (l.plan || 'other') !== p) return false;
      if (s && src(l) !== s) return false;
      if (t && (l.tags || []).indexOf(t) < 0) return false;
      return !q || JSON.stringify([l.name, l.email, l.country, l.learn, l.who, l.bring, l.tags, l.phone]).toLowerCase().indexOf(q) >= 0;
    });
  }
  function notesFor(l){ return (D.notes || []).filter(function(n){ return n.lead_id === l.id || (l.user_id && n.user_id === l.user_id); }); }
  function userFor(l){ return (D.users || []).filter(function(u){ return u.id === l.user_id || (u.email || '').toLowerCase() === (l.email || '').toLowerCase(); })[0]; }
  function dueItems(){
    var t = today(), out = [];
    leads().forEach(function(l){ if (l.next_action && l.next_action <= t && ['won','lost'].indexOf(stOf(l)) < 0) out.push({ l: l, what: 'Next action on ' + esc(l.name || l.email), d: l.next_action }); });
    (D.notes || []).forEach(function(n){ if (!n.done && n.due && n.due <= t) { var l = leads().filter(function(x){ return x.id === n.lead_id; })[0]; out.push({ l: l, n: n, what: esc(n.body.slice(0, 90)) + (l ? ' · ' + esc(l.name || l.email) : ''), d: n.due }); } });
    var unread = 0; (D.users || []).forEach(function(u){ (u.cases || []).forEach(function(c){ unread += (c.messages || []).filter(function(m){ return !m.admin && !m.read; }).length; }); });
    return { list: out.sort(function(a, b){ return a.d < b.d ? -1 : 1; }), unread: unread };
  }

  function render(){
    DUP = {}; leads().forEach(function(l){ var e = (l.email || '').toLowerCase(); DUP[e] = (DUP[e] || 0) + 1; });
    var L = leads().filter(function(l){ return !isTest(l); }), k = D.kpi || {}, due = dueItems(), wk = Date.now() - 7 * 864e5;
    var users = (D.users || []).filter(function(u){ return u.email !== 'demo@kolaboro.com' && (u.role || 'buyer') === 'buyer'; });
    var paying = {}; (D.payments || []).forEach(function(p){ if (p.email) paying[p.email.toLowerCase()] = 1; });
    var rev = (D.payments || []).filter(function(p){ return (p.currency || 'EUR') === 'EUR'; }).reduce(function(a, p){ return a + (+p.amount || 0); }, 0);
    var pipe = L.filter(function(l){ return ['won','lost'].indexOf(stOf(l)) < 0; }).reduce(function(a, l){ return a + (+l.value_eur || 0); }, 0);
    var nDue = due.list.length; $('crm-due').style.display = nDue ? 'inline-block' : 'none'; $('crm-due').textContent = nDue;
    var kp = [
      ['Leads this week', L.filter(function(l){ return new Date(l.created_at) > wk; }).length, L.length + ' in total, tests hidden'],
      ['Accounts', users.length, users.filter(function(u){ return new Date(u.created_at) > wk; }).length + ' new this week'],
      ['Paying clients', Object.keys(paying).length, users.length ? Math.round(100 * Object.keys(paying).length / users.length) + '% of accounts' : 'none yet'],
      ['Revenue recorded', '€' + rev.toLocaleString(), (D.payments || []).length + ' payments'],
      ['Open pipeline', has() ? '€' + pipe.toLocaleString() : '-', has() ? 'sum of values you set' : 'needs the CRM database update'],
      ['To do today', nDue, due.unread + ' unread client messages']
    ];
    var plans = {}, srcs = {}, tags = {}; leads().forEach(function(l){ plans[l.plan || 'other'] = 1; srcs[src(l)] = 1; (l.tags || []).forEach(function(t){ tags[t] = 1; }); });
    var keep = { q: ($('crm-q') || {}).value || '', p: ($('crm-p') || {}).value || '', s: ($('crm-s') || {}).value || '', t: ($('crm-t') || {}).value || '', h: $('crm-h') ? $('crm-h').checked : true };
    function opts(o, cur, all){ return '<option value="">' + all + '</option>' + Object.keys(o).sort().map(function(x){ return '<option' + (x === cur ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join(''); }
    var h = (has() ? '' : '<div class="crm-warn"><b>CRM database update not applied yet.</b> Pipeline, search and export work now. Tags, notes, tasks, next action and deal value appear once the update runs.</div>') +
      '<div class="kpis" style="margin-top:14px">' + kp.map(function(x){ return '<div class="kpi"><span>' + x[0] + '</span><b>' + x[1] + '</b><small>' + x[2] + '</small></div>'; }).join('') + '</div>' +
      '<div class="card"><h2>Today</h2>' + (due.list.length ? '<ul class="crm-today">' + due.list.slice(0, 12).map(function(x){ return '<li>' + (x.d < today() ? '<span class="pill" style="background:#FDE2D6">overdue ' + esc(x.d.slice(5)) + '</span> ' : '<span class="pill">today</span> ') + (x.l ? '<a href="#" data-open="' + x.l.id + '">' + x.what + '</a>' : x.what) + (x.n ? ' <button class="btn-s" data-done="' + x.n.id + '">Done</button>' : '') + '</li>'; }).join('') + '</ul>' : '<p class="muted" style="margin:0">Nothing due. ' + (due.unread ? '<b>' + due.unread + ' unread client message' + (due.unread > 1 ? 's' : '') + '</b> in the Clients tab.' : 'Inbox clear.') + '</p>') + '</div>' +
      '<div class="crm-top"><input id="crm-q" placeholder="Search name, email, project, tag…  ( / )" style="flex:1;min-width:220px" value="' + esc(keep.q) + '"><select id="crm-p">' + opts(plans, keep.p, 'All types') + '</select><select id="crm-s">' + opts(srcs, keep.s, 'All sources') + '</select>' + (has() ? '<select id="crm-t">' + opts(tags, keep.t, 'All tags') + '</select>' : '') +
      '<label class="muted" style="font-size:.85rem"><input type="checkbox" id="crm-h"' + (keep.h ? ' checked' : '') + '> hide tests</label><button class="btn2" id="crm-v">' + (VIEW === 'board' ? 'List view' : 'Board view') + '</button><button class="btn2" id="crm-csv">Export CSV</button></div>' +
      '<div id="crm-body"></div>' +
      '<div class="card"><h2>Conversion by source</h2><div class="tw"><table class="crm-src" id="crm-src"></table></div><p class="muted" style="font-size:.82rem;margin:8px 0 0">Source is the UTM source the visitor arrived with, or the form they used. An account is a lead whose email later created a portal login. Paying means a payment you recorded with that email.</p></div>';
    sec.innerHTML = h;
    body();
    // conversion by source
    var bys = {}; L.forEach(function(l){ var s = src(l), b = bys[s] = bys[s] || { n: 0, acc: 0, pay: 0, won: 0 }; b.n++; if (userFor(l)) b.acc++; if (paying[(l.email || '').toLowerCase()]) b.pay++; if (stOf(l) === 'won') b.won++; });
    var mx = Math.max.apply(null, Object.keys(bys).map(function(s){ return bys[s].n; }).concat([1]));
    $('crm-src').innerHTML = '<tr><th>Source</th><th>Leads</th><th></th><th>Accounts</th><th>Paying</th><th>Won</th></tr>' + Object.keys(bys).sort(function(a, b){ return bys[b].n - bys[a].n; }).map(function(s){ var b = bys[s]; return '<tr><td>' + esc(s) + '</td><td>' + b.n + '</td><td style="width:30%"><div class="crm-bar" style="width:' + (100 * b.n / mx) + '%"></div></td><td>' + b.acc + '</td><td>' + b.pay + '</td><td>' + b.won + '</td></tr>'; }).join('');
    ['crm-q','crm-p','crm-s','crm-t','crm-h'].forEach(function(i){ var e = $(i); if (e) e.addEventListener('input', body); });
    $('crm-v').onclick = function(){ VIEW = VIEW === 'board' ? 'list' : 'board'; render(); };
    $('crm-csv').onclick = csv;
    sec.querySelectorAll('[data-done]').forEach(function(b){ b.onclick = function(){ act('note_done', { id: +b.dataset.done, done: true }); }; });
    if (SEL) open(SEL, true);
  }
  function card(l){
    var t = today(), nd = l.next_action, u = userFor(l);
    var pr = prio(l);
    return '<div class="crm-card" draggable="true" data-open="' + l.id + '"><span class="crm-pr ' + pr.lvl + '" title="' + esc(pr.why) + '">' + pr.n + '</span><b>' + esc(l.name || l.email) + '</b><small>' + esc(l.plan || 'other') + ' · ' + esc(src(l)) + ' · ' + ago(l.created_at) + '</small>' +
      (l.learn ? '<small style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(String(l.learn).replace(/^https?:\/\/(www\.)?/, '')) + '</small>' : '') +
      ((l.tags || []).length ? '<div>' + l.tags.map(function(x){ return '<span class="tg">' + esc(x) + '</span>'; }).join('') + '</div>' : '') +
      '<small>' + (l.value_eur ? '€' + (+l.value_eur).toLocaleString() + ' · ' : '') + (nd ? '<span class="' + (nd <= t ? 'due' : '') + '">next ' + esc(nd.slice(5)) + '</span>' : '') + (u ? ' · account' : '') + (l.paid ? ' · paid' : '') + '</small></div>';
  }
  function body(){
    var F = filtered(), el = $('crm-body'); if (!el) return;
    if (VIEW === 'board') {
      el.innerHTML = '<div class="crm-board">' + ST.map(function(s){ var c = F.filter(function(l){ return stOf(l) === s[0]; }).sort(function(a, b){ return prio(b).n - prio(a).n || (a.created_at < b.created_at ? 1 : -1); }); return '<div class="crm-col" data-st="' + s[0] + '"><h3><span>' + s[1] + '</span><span>' + c.length + '</span></h3>' + c.slice(0, 80).map(card).join('') + (c.length > 80 ? '<p class="muted" style="font-size:.8rem">+' + (c.length - 80) + ' more, use search</p>' : '') + '</div>'; }).join('') + '</div>';
      el.querySelectorAll('.crm-card').forEach(function(c){ c.addEventListener('dragstart', function(e){ e.dataTransfer.setData('text/plain', c.dataset.open); }); });
      el.querySelectorAll('.crm-col').forEach(function(col){
        col.addEventListener('dragover', function(e){ e.preventDefault(); col.classList.add('drop'); });
        col.addEventListener('dragleave', function(){ col.classList.remove('drop'); });
        col.addEventListener('drop', function(e){ e.preventDefault(); col.classList.remove('drop'); var id = e.dataTransfer.getData('text/plain'); if (id) setStatus(id, col.dataset.st); });
      });
    } else {
      el.innerHTML = '<div class="card"><div class="row" id="crm-bulk" style="margin-bottom:8px"><span class="muted" id="crm-bn">0 selected</span><select id="crm-bs"><option value="">Move selected to…</option>' + ST.map(function(s){ return '<option value="' + s[0] + '">' + s[1] + '</option>'; }).join('') + '</select><button class="btn2" id="crm-bx">Export selected</button><button class="btn2" id="crm-bm">Email selected (BCC)</button></div><div class="tw"><table><tr><th><input type="checkbox" id="crm-ba" aria-label="Select all"></th><th>Priority</th><th>When</th><th>Name</th><th>Stage</th><th>Type</th><th>Source</th><th>Next</th><th>Value</th></tr>' + F.sort(function(a, b){ return prio(b).n - prio(a).n; }).map(function(l){ var pr = prio(l); return '<tr data-open="' + l.id + '" style="cursor:pointer"><td><input type="checkbox" data-pick="' + l.id + '"' + (PICK[l.id] ? ' checked' : '') + '></td><td><span class="crm-pr ' + pr.lvl + '" style="float:none" title="' + esc(pr.why) + '">' + pr.n + '</span></td><td>' + esc(day(l.created_at)) + '</td><td><b>' + esc(l.name) + '</b><br><small class="muted">' + esc(l.email) + '</small></td><td>' + esc(stOf(l)) + '</td><td>' + esc(l.plan || 'other') + '</td><td>' + esc(src(l)) + '</td><td>' + esc(l.next_action || '') + '</td><td>' + (l.value_eur ? '€' + esc(l.value_eur) : '') + '</td></tr>'; }).join('') + '</table></div></div>';
      var upd = function(){ $('crm-bn').textContent = Object.keys(PICK).length + ' selected'; };
      el.querySelectorAll('[data-pick]').forEach(function(c){ c.onclick = function(e){ e.stopPropagation(); if (c.checked) PICK[c.dataset.pick] = 1; else delete PICK[c.dataset.pick]; upd(); }; });
      $('crm-ba').onclick = function(e){ e.stopPropagation(); F.forEach(function(l){ if (e.target.checked) PICK[l.id] = 1; else delete PICK[l.id]; }); body(); };
      $('crm-bs').onchange = function(){ var v = this.value, ids = Object.keys(PICK); if (!v || !ids.length) return; if (!confirm('Move ' + ids.length + ' lead(s) to ' + v + '?')) return; Promise.all(ids.map(function(id){ return A.rpc('kolaboro_admin', { p_key: A.pw(), p_action: has() ? 'lead_update' : 'set_status', p_payload: { id: id, status: v } }); })).then(function(){ PICK = {}; A.reload(); }); };
      $('crm-bx').onclick = function(){ csv(leads().filter(function(l){ return PICK[l.id]; })); };
      $('crm-bm').onclick = function(){ var em = leads().filter(function(l){ return PICK[l.id] && l.email; }).map(function(l){ return l.email; }); if (em.length) location.href = 'mailto:?bcc=' + encodeURIComponent(em.join(',')); };
      upd();
    }
  }
  sec.addEventListener('click', function(e){ var o = e.target.closest('[data-open]'); if (o) { e.preventDefault(); open(o.dataset.open); } });
  function setStatus(id, s){ return act(has() ? 'lead_update' : 'set_status', { id: id, status: s }); }

  function open(id, keep){
    var l = leads().filter(function(x){ return x.id === id; })[0]; if (!l) { close(); return; }
    SEL = id; var u = userFor(l), N = notesFor(l), wa = String(l.phone || '').replace(/[^\d]/g, '');
    var sys = [{ at: l.created_at, kind: 'sys', body: 'Lead created from ' + (l.plan || 'a form') + (l.landing ? ' on ' + l.landing : '') }];
    if (u) sys.push({ at: u.created_at, kind: 'sys', body: 'Created a portal account (' + (u.status || '') + ')' });
    (u && u.cases || []).forEach(function(c){ sys.push({ at: c.created_at, kind: 'sys', body: 'Opened case ' + c.code + (c.project_name ? ' · ' + c.project_name : '') + (c.paid ? ' · paid' : ' · unpaid') }); });
    (D.payments || []).filter(function(p){ return (p.email || '').toLowerCase() === (l.email || '').toLowerCase(); }).forEach(function(p){ sys.push({ at: p.paid_at, kind: 'sys', body: 'Payment ' + (p.currency || '') + ' ' + p.amount + (p.product ? ' · ' + p.product : '') }); });
    var tl = N.map(function(n){ return { at: n.created_at, kind: n.kind, body: n.body, id: n.id, due: n.due, done: n.done }; }).concat(sys).sort(function(a, b){ return a.at < b.at ? 1 : -1; });
    var subj = encodeURIComponent('Kolaboro: your ' + (l.plan === 'yc-desk' ? 'desk review' : 'request'));
    dr.innerHTML = '<button class="crm-x" id="crm-close" aria-label="Close">Close ✕</button><p class="muted" style="margin:0">' + esc(l.plan || 'lead') + ' · ' + esc(day(l.created_at)) + '</p><h2>' + esc(l.name || l.email) + '</h2>' +
      '<div class="row" style="margin-top:6px"><a class="btn2" href="mailto:' + esc(l.email) + '?subject=' + subj + '">Email</a>' + (wa ? '<a class="btn2" target="_blank" rel="noopener" href="https://wa.me/' + wa + '">WhatsApp</a>' : '') + (u ? '<button class="btn2" id="crm-as">Open their portal ↗</button>' : '') + '<select id="crm-tpl" style="max-width:200px"><option value="">Email template…</option>' + TPL.map(function(t, i){ return '<option value="' + i + '">' + esc(t[0]) + '</option>'; }).join('') + '</select></div>' + (function(){ var pr = prio(l); return '<p style="margin:10px 0 0;font-size:.85rem"><span class="crm-pr ' + pr.lvl + '" style="float:none">' + pr.n + '</span> <b>' + pr.lvl + '</b> <span class="muted">' + esc(pr.why.replace(/\n/g, ' · ')) + '</span></p>'; })() + (DUP[(l.email || '').toLowerCase()] > 1 ? '<p class="muted" style="margin:4px 0 0;font-size:.85rem">This email sent ' + DUP[(l.email || '').toLowerCase()] + ' forms. Search it to see all of them.</p>' : '') +
      '<div class="crm-kv"><span>Email</span><b>' + esc(l.email) + '</b>' + (l.phone ? '<span>Phone</span><b>' + esc(l.phone) + '</b>' : '') + '<span>Country</span><b>' + esc(l.country || '-') + '</b>' +
      (l.learn ? '<span>Project / URL</span><b style="word-break:break-all">' + (/^https?:\/\//.test(l.learn) ? '<a href="' + esc(l.learn) + '" target="_blank" rel="noopener">' + esc(l.learn) + '</a>' : esc(l.learn)) + '</b>' : '') +
      (l.who ? '<span>Who</span><b>' + esc(l.who) + '</b>' : '') + (l.bring ? '<span>Message</span><b style="font-weight:400;white-space:pre-wrap">' + esc(l.bring) + '</b>' : '') +
      '<span>Source</span><b>' + esc([l.src, l.medium, l.campaign].filter(Boolean).join(' / ') || l.source || 'direct') + '</b>' + (l.referrer ? '<span>Referrer</span><b style="word-break:break-all">' + esc(l.referrer) + '</b>' : '') + (l.landing ? '<span>Landing</span><b>' + esc(l.landing) + '</b>' : '') + (l.lang ? '<span>Language</span><b>' + esc(l.lang) + '</b>' : '') +
      (u ? '<span>Account</span><b>' + esc(u.status) + ' · ' + (u.cases || []).length + ' case(s)' + (u.saved != null ? ' · ' + u.saved + ' saved' : '') + (u.last_login ? ' · last login ' + esc(day(u.last_login)) : '') + '</b>' : '') + '</div>' +
      '<form id="crm-f"><div class="crm-g2"><label>Stage<select name="status">' + ST.map(function(s){ return '<option value="' + s[0] + '"' + (stOf(l) === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></label>' +
      (has() ? '<label>Deal value (€)<input name="value_eur" type="number" step="1" min="0" value="' + esc(l.value_eur || '') + '"></label><label>Next action<input name="next_action" type="date" value="' + esc(l.next_action || '') + '"></label><label>Tags (comma separated)<input name="tags" value="' + esc((l.tags || []).join(', ')) + '" placeholder="buyer, bali, hot"></label>' : '') +
      '</div><button class="btn" style="margin-top:10px">Save</button></form>' +
      (has() ? '<h3 style="margin:18px 0 0">Log activity</h3><form id="crm-n"><div class="crm-g2"><label>Type<select name="kind">' + KIND.map(function(k){ return '<option value="' + k[0] + '">' + k[1] + '</option>'; }).join('') + '</select></label><label>Due (for tasks)<input type="date" name="due"></label></div><label>What happened / what to do<textarea name="body" rows="3" required></textarea></label><button class="btn2" style="margin-top:8px">Add to timeline</button></form>' : '') +
      '<h3 style="margin:18px 0 0">Timeline</h3><ul class="crm-tl">' + tl.map(function(n){ return '<li class="k-' + esc(n.kind) + (n.done ? ' done' : '') + '"><small>' + esc((KIND.filter(function(k){ return k[0] === n.kind; })[0] || ['', n.kind === 'sys' ? 'System' : n.kind])[1]) + ' · ' + esc(day(n.at)) + (n.due ? ' · due ' + esc(n.due) : '') + '</small>' + esc(n.body) + (n.id ? ' <button class="btn-s" data-nd="' + n.id + '" data-v="' + (!n.done) + '">' + (n.done ? 'Reopen' : (n.kind === 'task' || n.due ? 'Done' : 'Mark done')) + '</button> <button class="btn-s" data-ndel="' + n.id + '">Delete</button>' : '') + '</li>'; }).join('') + '</ul>';
    if (!keep) dr.scrollTop = 0; dr.classList.add('on');
    $('crm-close').onclick = close;
    $('crm-f').onsubmit = function(e){ e.preventDefault(); var f = e.target, o = { id: l.id, status: f.status.value };
      if (!has()) { setStatus(l.id, o.status); return; }
      o.value_eur = f.value_eur.value; o.next_action = f.next_action.value; o.tags = f.tags.value.split(',').map(function(x){ return x.trim(); }).filter(Boolean);
      act('lead_update', o); };
    var nf = $('crm-n'); if (nf) nf.onsubmit = function(e){ e.preventDefault(); var f = e.target, b = f.body.value.trim(); if (!b) return; act('add_note', { lead_id: l.id, user_id: u ? u.id : '', kind: f.kind.value, body: b, due: f.due.value }); };
    dr.querySelectorAll('[data-nd]').forEach(function(b){ b.onclick = function(){ act('note_done', { id: +b.dataset.nd, done: b.dataset.v === 'true' }); }; });
    dr.querySelectorAll('[data-ndel]').forEach(function(b){ b.onclick = function(){ if (confirm('Delete this note?')) act('del_note', { id: +b.dataset.ndel }); }; });
    $('crm-tpl').onchange = function(){ var t = TPL[+this.value]; if (!t || this.value === '') return; location.href = 'mailto:' + encodeURIComponent(l.email) + '?subject=' + encodeURIComponent(tpl(t[1], l)) + '&body=' + encodeURIComponent(tpl(t[2], l)); if (has()) act('add_note', { lead_id: l.id, user_id: u ? u.id : '', kind: 'email', body: 'Sent template: ' + t[0] }); this.value = ''; };
    var as = $('crm-as'); if (as) as.onclick = function(){ A.rpc('kolaboro_admin', { p_key: A.pw(), p_action: 'impersonate', p_payload: { user_id: u.id } }).then(function(d){ if (d.token) window.open('/portal#as=' + d.token, '_blank', 'noopener'); }); };
  }
  function csv(rows){
    var F = Array.isArray(rows) ? rows : filtered(), c = ['created_at','name','email','phone','country','plan','status','src','medium','campaign','referrer','landing','learn','who','bring','tags','next_action','value_eur'];
    var t = c.join(',') + '\n' + F.map(function(l){ return c.map(function(k){ var v = k === 'status' ? stOf(l) : k === 'tags' ? (l.tags || []).join('|') : l[k]; v = String(v == null ? '' : v); if (/^[\s]*[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/csv' })); a.download = 'kolaboro-crm-' + today() + '.csv'; a.click();
  }
  document.addEventListener('kbadm', function(e){ D = e.detail; render(); });
  if (A.D) { D = A.D; render(); }
  setTimeout(function(){ try { var t = localStorage.getItem('kb-adm-tab'), b = t && document.querySelector('nav.tabs button[data-t="' + t + '"]'); if (b) b.click(); } catch (x) {} }, 0);
})();
