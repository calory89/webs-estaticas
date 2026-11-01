/* Kolaboro admin, part 2: Inbox (all client conversations in one place), command palette (Ctrl/Cmd+K),
   live refresh with desktop notifications, and a 12-week funnel on the Overview tab. */
(function(){
  var A = window.KBADM; if (!A) return;
  var $ = function(i){ return document.getElementById(i); };
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function ago(t){ var s = (Date.now() - new Date(t)) / 1000; if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min'; if (s < 86400) return Math.round(s / 3600) + ' h'; return Math.round(s / 86400) + ' d'; }
  function st(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var D = null, SEL = null;
  var css = document.createElement('style'); css.textContent =
    '.ib{display:grid;grid-template-columns:360px 1fr;gap:14px;align-items:start;margin-top:14px}.ib-l{background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden}' +
    '.ib-i{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid var(--line);background:#fff;padding:12px 14px;cursor:pointer;font:inherit}.ib-i.on{background:#F2F1EC}.ib-i b{display:flex;justify-content:space-between;gap:8px}.ib-i small{color:var(--muted);display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ib-i.un b::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--hi);align-self:center;margin-right:-2px}' +
    '.ib-wait{font-size:.72rem;font-weight:800;border-radius:999px;padding:1px 7px;background:#E6E4DD;white-space:nowrap}.ib-wait.late{background:#C9341A;color:#fff}.ib-wait.soon{background:#FFE6D9}' +
    '.ib-snip{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}.ib-snip button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:4px 10px;font:inherit;font-size:.8rem;cursor:pointer}' +
    '.cmdk{position:fixed;inset:0;background:rgba(23,33,43,.45);z-index:50;display:flex;justify-content:center;align-items:flex-start;padding-top:12vh}.cmdk[hidden]{display:none}.cmdk div.box{background:#fff;border-radius:16px;width:min(640px,94vw);box-shadow:0 30px 60px -20px rgba(0,0,0,.5);overflow:hidden}' +
    '.cmdk input{width:100%;border:0;border-bottom:1px solid var(--line);border-radius:0;padding:16px 18px;font-size:1.05rem;outline:none}.cmdk ul{list-style:none;margin:0;padding:6px;max-height:52vh;overflow:auto}.cmdk li{padding:9px 12px;border-radius:10px;cursor:pointer;display:flex;justify-content:space-between;gap:10px}.cmdk li.on{background:#F2F1EC}.cmdk li small{color:var(--muted)}' +
    '.wk{display:flex;align-items:flex-end;gap:6px;height:150px;margin-top:10px}.wk div{flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:2px;position:relative}.wk i{display:block;border-radius:3px 3px 0 0;min-height:1px}.wk i.a{background:#F6B08F}.wk i.b{background:#3B6FD8}.wk i.c{background:var(--ok)}.wk span{font-size:.65rem;color:var(--muted);text-align:center}' +
    '.live{display:inline-flex;align-items:center;gap:6px;font-size:.8rem;color:#9fb0bf}.live i{width:8px;height:8px;border-radius:50%;background:var(--ok);animation:lv 2s infinite}@keyframes lv{50%{opacity:.3}}' +
    '@media(max-width:900px){.ib{grid-template-columns:1fr}}' +
    'a.btn2{text-decoration:none;color:inherit;display:inline-block}.ib-i.un b::before{content:none}.ib-i.un b span:first-child::before{content:"";display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--hi);margin-right:6px;vertical-align:middle}' +
    '@media(max-width:700px){header{padding:10px 12px;gap:8px}header #upd,header .live,header a[target=_blank]{display:none}header button,header a{padding:6px 10px;font-size:.85rem}nav.tabs{flex-wrap:nowrap;overflow-x:auto;padding:10px 12px 6px;scrollbar-width:none;position:sticky;top:52px;background:var(--paper);z-index:4}nav.tabs::-webkit-scrollbar{display:none}nav.tabs button{flex:0 0 auto}main{padding-top:6px}}';
  document.head.appendChild(css);

  // ---------- Inbox tab
  var nav = document.querySelector('nav.tabs'), main = document.querySelector('main');
  var tb = document.createElement('button'); tb.dataset.t = 'inbox'; tb.innerHTML = 'Inbox <span id="ib-n" class="pill" style="background:#FF5B14;color:#111;display:none"></span>';
  nav.insertBefore(tb, nav.children[2] || null);
  var sec = document.createElement('section'); sec.id = 't-inbox'; sec.className = 'hide'; main.insertBefore(sec, main.children[2] || null);
  var SNIP = [['Got it', 'Thanks, got it. I will come back to you today.'], ['Agent update', 'Quick update: your local agent is on it. You will see the next step in your case timeline as soon as it is done.'], ['Need contract', 'To move faster, could you share the contract or reservation form? A Google Drive or Dropbox link in "Project details" is perfect.'], ['Hold payment', 'Our advice for now: hold the next payment until we finish this step. If the developer insists, ask them for a few extra days in writing.']];
  function threads(){
    var out = [];
    (D.users || []).forEach(function(u){ (u.cases || []).forEach(function(c){
      var M = c.messages || [], last = M[M.length - 1], un = M.filter(function(m){ return !m.admin && !m.read; });
      var waitFrom = null; for (var i = M.length - 1; i >= 0; i--) { if (M[i].admin) break; waitFrom = M[i].at; }
      if (M.length) out.push({ u: u, c: c, last: last, unread: un.length, wait: waitFrom });
    }); });
    return out.sort(function(a, b){ return (b.wait ? 1 : 0) - (a.wait ? 1 : 0) || (a.wait && b.wait ? (a.wait < b.wait ? -1 : 1) : (a.last.at < b.last.at ? 1 : -1)); });
  }
  function inbox(){
    var T = threads(), waiting = T.filter(function(t){ return t.wait; }).length;
    $('ib-n').style.display = waiting ? 'inline-block' : 'none'; $('ib-n').textContent = waiting;
    var fl = (st('kb-ib-f') || 'all');
    var L = T.filter(function(t){ return fl === 'all' || (fl === 'waiting' && t.wait); });
    var h = '<div class="row" style="margin-top:14px"><button class="btn2" data-f="all"' + (fl === 'all' ? ' style="background:var(--ink);color:#fff"' : '') + '>All (' + T.length + ')</button><button class="btn2" data-f="waiting"' + (fl === 'waiting' ? ' style="background:var(--ink);color:#fff"' : '') + '>Waiting for us (' + waiting + ')</button><span class="muted" style="font-size:.85rem">Sorted by who has waited longest. The portal promises a reply within one working day.</span></div>';
    h += '<div class="ib"><div class="ib-l">' + (L.map(function(t){ var hrs = t.wait ? (Date.now() - new Date(t.wait)) / 36e5 : 0;
      return '<button class="ib-i' + (t.unread ? ' un' : '') + (SEL === t.c.id ? ' on' : '') + '" data-ib="' + t.c.id + '"><b><span>' + esc(t.u.name || t.u.email) + '</span>' + (t.wait ? '<span class="ib-wait ' + (hrs > 24 ? 'late' : hrs > 12 ? 'soon' : '') + '">waiting ' + ago(t.wait) + '</span>' : '<span class="muted" style="font-weight:400;font-size:.8rem">' + ago(t.last.at) + '</span>') + '</b><small>' + esc(t.c.project_name || t.c.code) + '</small><small>' + (t.last.admin ? 'You: ' : '') + esc(t.last.body) + '</small></button>'; }).join('') || '<p class="muted" style="padding:14px">No conversations' + (fl === 'waiting' ? ' waiting. Inbox zero.' : ' yet.') + '</p>') + '</div><div class="card" style="margin-top:0" id="ib-d"><p class="muted">Select a conversation.</p></div></div>';
    sec.innerHTML = h;
    sec.querySelectorAll('[data-f]').forEach(function(b){ b.onclick = function(){ st('kb-ib-f', b.dataset.f); inbox(); }; });
    sec.querySelectorAll('[data-ib]').forEach(function(b){ b.onclick = function(){ SEL = b.dataset.ib; inbox(); }; });
    var t = T.filter(function(x){ return x.c.id === SEL; })[0]; if (t) thread(t);
  }
  function thread(t){
    var c = t.c, u = t.u, d = $('ib-d'), draft = st('kb-ib-draft-' + c.id) || '';
    d.innerHTML = '<div class="row"><div style="flex:1"><b>' + esc(u.name) + '</b> <span class="muted">· ' + esc(u.email) + ' · ' + esc(c.code) + (c.paid ? '' : ' · unpaid') + '</span><br><span class="muted" style="font-size:.85rem">' + esc(c.project_name || c.project_url || '') + ' · stage ' + c.stage + '</span></div><button class="btn2" id="ib-case">Open case</button></div>' +
      '<div class="chat" id="ib-chat" style="max-height:52vh">' + c.messages.map(function(m){ return '<div class="' + (m.admin ? 'a' : 'u') + '">' + esc(m.body) + '<small>' + (m.admin ? 'Kolaboro' : esc(u.name)) + ' · ' + new Date(m.at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</small></div>'; }).join('') + '</div>' +
      '<div class="ib-snip">' + SNIP.map(function(s, i){ return '<button type="button" data-sn="' + i + '">' + esc(s[0]) + '</button>'; }).join('') + '</div>' +
      '<form id="ib-f" class="row"><textarea name="body" rows="3" style="flex:1" placeholder="Reply to ' + esc(u.name) + '…  (Ctrl/Cmd+Enter to send)">' + esc(draft) + '</textarea><button class="btn">Send</button></form>';
    var ch = $('ib-chat'); ch.scrollTop = ch.scrollHeight;
    var f = $('ib-f'), ta = f.body;
    ta.addEventListener('input', function(){ st('kb-ib-draft-' + c.id, ta.value); });
    ta.addEventListener('keydown', function(e){ if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) f.requestSubmit(); });
    d.querySelectorAll('[data-sn]').forEach(function(b){ b.onclick = function(){ ta.value = (ta.value ? ta.value + '\n\n' : '') + SNIP[+b.dataset.sn][1]; ta.focus(); st('kb-ib-draft-' + c.id, ta.value); }; });
    f.onsubmit = function(e){ e.preventDefault(); var v = ta.value.trim(); if (!v) return; f.querySelector('button').disabled = true;
      A.rpc('kolaboro_admin', { p_key: A.pw(), p_action: 'admin_message', p_payload: { case_id: c.id, body: v } }).then(function(){ try { localStorage.removeItem('kb-ib-draft-' + c.id); } catch (x) {} A.reload(); }); };
    $('ib-case').onclick = function(){ var b = document.querySelector('nav.tabs button[data-t=clients]'); if (b) b.click(); var x = document.querySelector('[data-cs="' + c.id + '"]'); if (x) x.click(); };
    if (t.unread) A.rpc('kolaboro_admin', { p_key: A.pw(), p_action: 'mark_read', p_payload: { case_id: c.id } });
  }

  // ---------- 12-week funnel on Overview
  function weekly(){
    var ov = $('t-ov'); if (!ov) return; var box = $('wk-card');
    if (!box) { box = document.createElement('div'); box.className = 'card'; box.id = 'wk-card'; var after = ov.children[1]; ov.insertBefore(box, after ? after.nextSibling : null); }
    function wkStart(t){ var d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toISOString().slice(0, 10); }
    var W = [], m = {}; for (var i = 11; i >= 0; i--) { var k = wkStart(Date.now() - i * 7 * 864e5); W.push(k); m[k] = { a: 0, b: 0, c: 0 }; }
    var test = function(e){ return /test|example/i.test(e || ''); };
    (D.leads || []).forEach(function(l){ var k = wkStart(l.created_at); if (m[k] && !test(l.email)) m[k].a++; });
    (D.users || []).forEach(function(u){ var k = wkStart(u.created_at); if (m[k] && u.email !== 'demo@kolaboro.com' && (u.role || 'buyer') === 'buyer') m[k].b++; });
    (D.payments || []).forEach(function(p){ var k = wkStart(p.paid_at); if (m[k]) m[k].c++; });
    var mx = Math.max.apply(null, W.map(function(k){ return m[k].a; }).concat([1]));
    box.innerHTML = '<h2>Last 12 weeks</h2><div class="g-leg"><span><i style="background:#F6B08F"></i>Leads</span><span><i style="background:#3B6FD8"></i>Accounts</span><span><i style="background:var(--ok)"></i>Payments</span></div><div class="wk">' + W.map(function(k){ var x = m[k]; return '<div title="Week of ' + k + ': ' + x.a + ' leads, ' + x.b + ' accounts, ' + x.c + ' payments"><div style="display:flex;gap:2px;align-items:flex-end;height:130px"><i class="a" style="flex:1;height:' + (100 * x.a / mx) + '%"></i><i class="b" style="flex:1;height:' + (100 * x.b / mx) + '%"></i><i class="c" style="flex:1;height:' + (100 * x.c / mx) + '%"></i></div><span>' + k.slice(5) + '</span></div>'; }).join('') + '</div>';
  }

  // ---------- Command palette
  var pal = document.createElement('div'); pal.className = 'cmdk'; pal.hidden = true; pal.innerHTML = '<div class="box" role="dialog" aria-label="Search everything"><input id="cmdk-q" placeholder="Search leads, clients, cases, tabs…" autocomplete="off"><ul id="cmdk-l"></ul></div>'; document.body.appendChild(pal);
  var IDX = 0, ITEMS = [];
  function items(q){
    q = q.toLowerCase(); var out = [];
    document.querySelectorAll('nav.tabs button').forEach(function(b){ var n = b.textContent.replace(/\d+/g, '').trim(); out.push({ t: n, s: 'Tab', go: function(){ b.click(); } }); });
    (D && D.leads || []).forEach(function(l){ out.push({ t: (l.name || '') + ' · ' + (l.email || ''), s: 'Lead · ' + (l.plan || '') + ' · ' + (l.status || 'new'), k: [l.name, l.email, l.learn, l.country, (l.tags || []).join(' ')].join(' '), go: function(){ var b = document.querySelector('nav.tabs button[data-t=crm]'); if (b) b.click(); setTimeout(function(){ var c = document.querySelector('[data-open="' + l.id + '"]'); if (c) c.click(); }, 50); } }); });
    (D && D.users || []).forEach(function(u){ (u.cases || []).forEach(function(c){ out.push({ t: (c.project_name || c.code) + ' · ' + (u.name || u.email), s: 'Case ' + c.code + ' · stage ' + c.stage, k: [u.name, u.email, c.code, c.project_name, c.project_url].join(' '), go: function(){ SEL = c.id; tb.click(); inbox(); } }); }); });
    [['New payment', 'pay'], ['Run health checks', 'tests']].forEach(function(x){ out.push({ t: x[0], s: 'Action', go: function(){ var b = document.querySelector('nav.tabs button[data-t=' + x[1] + ']'); if (b) b.click(); } }); });
    if (!q) return out.filter(function(x){ return x.s === 'Tab'; });
    return out.filter(function(x){ return (x.t + ' ' + (x.k || '') + ' ' + x.s).toLowerCase().indexOf(q) >= 0; }).slice(0, 40);
  }
  function drawPal(){ ITEMS = items($('cmdk-q').value); IDX = Math.min(IDX, Math.max(0, ITEMS.length - 1)); $('cmdk-l').innerHTML = ITEMS.map(function(x, i){ return '<li data-i="' + i + '" class="' + (i === IDX ? 'on' : '') + '"><span>' + esc(x.t) + '</span><small>' + esc(x.s) + '</small></li>'; }).join('') || '<li><small>No match</small></li>'; }
  function openPal(){ pal.hidden = false; $('cmdk-q').value = ''; IDX = 0; drawPal(); $('cmdk-q').focus(); }
  function closePal(){ pal.hidden = true; }
  function pick(i){ var x = ITEMS[i]; closePal(); if (x) x.go(); }
  document.addEventListener('keydown', function(e){
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if ($('app').classList.contains('hide')) return; pal.hidden ? openPal() : closePal(); return; }
    if (pal.hidden) return;
    if (e.key === 'Escape') closePal(); else if (e.key === 'ArrowDown') { IDX = Math.min(IDX + 1, ITEMS.length - 1); drawPal(); e.preventDefault(); } else if (e.key === 'ArrowUp') { IDX = Math.max(IDX - 1, 0); drawPal(); e.preventDefault(); } else if (e.key === 'Enter') { e.preventDefault(); pick(IDX); }
  });
  $('cmdk-q').addEventListener('input', function(){ IDX = 0; drawPal(); });
  pal.addEventListener('click', function(e){ var li = e.target.closest('li[data-i]'); if (li) pick(+li.dataset.i); else if (e.target === pal) closePal(); });
  var hdr = document.querySelector('header .sp');
  if (hdr) { var kb = document.createElement('button'); kb.type = 'button'; kb.textContent = matchMedia('(max-width:700px)').matches ? 'Search' : 'Search  ⌘K'; kb.onclick = openPal; hdr.parentNode.insertBefore(kb, hdr.nextSibling); var lv = document.createElement('span'); lv.className = 'live'; lv.innerHTML = '<i></i>Live'; lv.title = 'Refreshes every 60 seconds while this tab is open'; hdr.parentNode.insertBefore(lv, hdr); }

  // ---------- Live refresh + notifications
  var seen = null, baseTitle = document.title;
  function sig(d){ var leads = (d.leads || []).filter(function(l){ return !/test|example/i.test(l.email || ''); }).map(function(l){ return l.id; }), msgs = 0;
    (d.users || []).forEach(function(u){ (u.cases || []).forEach(function(c){ msgs += (c.messages || []).filter(function(m){ return !m.admin; }).length; }); });
    return { leads: leads, msgs: msgs, unread: threads().filter(function(t){ return t.wait; }).length }; }
  function notify(t, b){ try { if (window.Notification && Notification.permission === 'granted' && document.hidden) new Notification(t, { body: b, icon: '/k/favicon.svg', tag: 'kb-adm' }); } catch (e) {} }
  function onData(d){
    D = d; inbox(); weekly();
    var s = sig(d);
    if (seen) { var nl = s.leads.filter(function(id){ return seen.leads.indexOf(id) < 0; }); if (nl.length) { var l = d.leads.filter(function(x){ return x.id === nl[0]; })[0]; notify(nl.length + ' new lead' + (nl.length > 1 ? 's' : ''), l ? (l.name || '') + ' · ' + (l.plan || '') : ''); }
      if (s.msgs > seen.msgs) notify('New client message', 'Open the Inbox to reply'); }
    seen = s; document.title = (s.unread ? '(' + s.unread + ') ' : '') + baseTitle;
  }
  document.addEventListener('kbadm', function(e){ onData(e.detail); });
  if (A.D) onData(A.D);
  setInterval(function(){ if (!document.hidden && A.D && !document.activeElement.closest('form,textarea,input,select') && pal.hidden) A.reload(); }, 60000);
  document.addEventListener('visibilitychange', function(){ if (!document.hidden && A.D) A.reload(); });
  document.addEventListener('click', function once(){ try { if (window.Notification && Notification.permission === 'default') Notification.requestPermission(); } catch (e) {} document.removeEventListener('click', once); });
})();
/* Automatic payments (PayPal IPN and webhooks): shown on the Payments tab, unmatched ones can be assigned to a buyer. */
(function(){
  var A = window.KBADM; if (!A) return;
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function draw(d){
    var sec = document.getElementById('t-pay'); if (!sec || !d.pay_events) return;
    var box = document.getElementById('pe-card'); if (!box) { box = document.createElement('div'); box.className = 'card'; box.id = 'pe-card'; sec.insertBefore(box, sec.children[1] || null); }
    var E = d.pay_events, un = E.filter(function(e){ return !e.matched && /completed/i.test(e.status || ''); });
    box.innerHTML = '<h2>Automatic confirmation</h2><p class="muted" style="margin-top:0">PayPal tells the site about every payment. Payments from a Kolaboro buyer (same email as their account or lead, or "Kolaboro" in the item name) are recorded and their case is marked paid automatically. Others wait here so you can assign them.</p>' +
      (E.length ? '<div class="tw"><table><tr><th>When</th><th>Source</th><th>Status</th><th>Payer</th><th>Amount</th><th>Item</th><th></th></tr>' + E.slice(0, 50).map(function(e){ return '<tr><td>' + esc(String(e.created_at).slice(0, 16).replace('T', ' ')) + '</td><td>' + esc(e.source) + '</td><td>' + esc(e.status) + '</td><td>' + esc(e.email || '-') + '</td><td>' + esc((e.currency || '') + ' ' + (e.amount == null ? '' : e.amount)) + '</td><td>' + esc(e.item || '') + '</td><td>' + (e.matched ? '<span class="pill" style="background:#DDEFE7">recorded</span>' : (/completed/i.test(e.status || '') ? '<button class="btn2" data-pe="' + e.id + '">Assign to buyer</button>' : '')) + '</td></tr>'; }).join('') + '</table></div>' : '<p class="muted">No PayPal notifications received yet.</p>') +
      (un.length ? '<p style="margin-bottom:0"><b>' + un.length + ' payment' + (un.length > 1 ? 's' : '') + ' not matched to a buyer.</b> If one is for Kolaboro, assign it with the buyer\'s account email.</p>' : '');
    box.querySelectorAll('[data-pe]').forEach(function(b){ b.onclick = function(){ var em = prompt('Email of the Kolaboro account this payment belongs to'); if (!em) return; A.rpc('kolaboro_admin', { p_key: A.pw(), p_action: 'assign_event', p_payload: { id: +b.dataset.pe, email: em } }).then(function(r){ if (r && r.error) alert('Not assigned: ' + r.error); A.reload(); }); }; });
  }
  document.addEventListener('kbadm', function(e){ draw(e.detail); });
  if (A.D) draw(A.D);
})();
/* Daily self-test and email health, shown on the Tests & health tab. */
(function(){
  var A = window.KBADM; if (!A) return;
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  var LBL = { signup: 'Free sign-up', save_project: 'Save a project', open_case_unpaid: 'Open a case', message: 'Send a message', payment_schedule: 'Payment schedule', share_link: 'Share link (no messages)', auto_payment_confirms_case: 'PayPal payment confirms the case', unrelated_payment_ignored: 'Other businesses\' payments ignored', login: 'Log in', password_reset_request: 'Password reset email' };
  var done = false;
  function draw(){
    if (done) return; var sec = document.getElementById('t-tests'); if (!sec || !A.pw()) return; done = true;
    A.rpc('kolaboro_admin_health', { p_key: A.pw() }).then(function(h){
      if (!h || h.error || !h.selftests) return;
      var box = document.createElement('div'); box.className = 'card'; sec.insertBefore(box, sec.firstChild);
      var last = h.selftests[0], o = h.outbox || {};
      box.innerHTML = '<h2>Daily self-test</h2><p class="muted" style="margin-top:0">Every morning at 06:23 UTC the database runs the whole buyer journey with a throwaway account and rolls everything back. If a step fails you get an email.</p>' +
        (last ? '<p><span class="st"><span class="dot ' + (last.ok ? 'g' : 'r') + '"></span><b>' + (last.ok ? 'All steps passed' : 'A step failed') + '</b></span> <span class="muted">· ' + esc(String(last.at).slice(0, 16).replace('T', ' ')) + ' UTC</span></p><div class="tw"><table>' + Object.keys(last.result || {}).map(function(k){ var v = last.result[k]; return '<tr><td><span class="st"><span class="dot ' + (v === true ? 'g' : 'r') + '"></span>' + esc(LBL[k] || k) + '</span></td><td>' + (v === true ? 'OK' : esc(JSON.stringify(v))) + '</td></tr>'; }).join('') + '</table></div>' : '<p class="muted">No run yet.</p>') +
        '<p class="muted" style="font-size:.85rem;margin-bottom:0">Last 14 days: ' + h.selftests.map(function(s){ return '<span class="dot ' + (s.ok ? 'g' : 'r') + '" style="display:inline-block" title="' + esc(String(s.at).slice(0, 10)) + '"></span>'; }).join(' ') + ' · Emails: ' + (o.sent_7d || 0) + ' sent in 7 days, ' + (o.queued || 0) + ' queued, ' + (o.failed_7d || 0) + ' failed · PayPal notifications in 7 days: ' + (h.pay_events_7d || 0) + '</p>';
    });
  }
  document.addEventListener('kbadm', draw); if (A.D) draw();
})();
