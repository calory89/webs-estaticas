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
      return '<button class="ib-i' + (t.unread ? ' un' : '') + (SEL === t.c.id ? ' on' : '') + '" data-ib="' + t.c.id + '"><b><span>' + esc(t.u.name || t.u.email) + '</span>' + (t.wait ? '<span class="ib-wait ' + (hrs > 24 ? 'late' : hrs > 12 ? 'soon' : '') + '">waiting ' + ago(t.wait) + '</span>' : '<span class="muted" style="font-weight:400;font-size:.8rem">' + ago(t.last.at) + '</span>') + '</b><small>' + esc(t.c.project_name || t.c.code) + '</small><small>' + (t.last.admin ? 'You: ' : '') + esc(t.last.body) + '</small></button>'; }).join('') || '<div class="kc-empty" style="margin:12px;border:0"><b>' + (fl === 'waiting' ? 'Nobody is waiting' : 'No conversations yet') + '</b><span>' + (fl === 'waiting' ? 'Every client message has a reply.' : 'Client messages from the portal appear here.') + '</span></div>') + '</div><div class="card" style="margin-top:0" id="ib-d"><div class="kc-empty"><b>No conversation open</b><span>Pick one on the left. The longest wait is at the top.</span></div></div></div>';
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
    f.onsubmit = function(e){ e.preventDefault(); var v = ta.value.trim(), sb = f.querySelector('button'); if (!v || sb.disabled) return; sb.disabled = true;
      // keep the draft until the server confirms: a failed send used to drop the reply silently
      A.rpc('kolaboro_admin', { p_key: A.pw(), p_action: 'admin_message', p_payload: { case_id: c.id, body: v } }).then(function(d){
        if (d && d.error) { sb.disabled = false; if (d.error !== 'denied') (window.KBUI ? KBUI.toast : function(m){ alert(m); })('Reply not sent. ' + (A.err ? A.err(d) : d.error) + ' Your text is kept.', 'bad'); return; }
        try { localStorage.removeItem('kb-ib-draft-' + c.id); } catch (x) {} if (window.KBUI) KBUI.toast('Reply sent to ' + (u.name || u.email) + '.', 'ok'); A.reload(); }); };
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

  // ---------- Command palette (Ctrl/Cmd+K): commands, tabs, leads, customers, cases, plus whatever other modules register
  // through window.KBPAL.add(fn(q) -> [{t, s, k, go, cmd}]). Ranked: exact/prefix > word start > anywhere. ">" lists commands only.
  var pal = document.createElement('div'); pal.className = 'cmdk'; pal.hidden = true;
  pal.innerHTML = '<div class="box" role="dialog" aria-modal="true" aria-label="Search and commands"><input id="cmdk-q" role="combobox" aria-expanded="true" aria-controls="cmdk-l" aria-autocomplete="list" placeholder="Search leads, customers, cases, X-rays… or type > for commands" autocomplete="off" spellcheck="false"><ul id="cmdk-l" role="listbox" aria-label="Results"></ul><p class="cmdk-f"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span><span><kbd>&gt;</kbd> commands</span></p></div>'; document.body.appendChild(pal);
  var IDX = 0, ITEMS = [], PREV = null, PROV = [];
  window.KBPAL = { add: function(fn){ if (typeof fn === 'function') PROV.push(fn); }, open: function(q){ openPal(q); } };
  function tabBtn(t){ return document.querySelector('nav.tabs button[data-t="' + t + '"]'); }
  function goTab(t){ var b = tabBtn(t); if (b) { if (/^#c=/.test(location.hash)) history.pushState(null, '', location.pathname); b.click(); } }
  function cmds(){
    var c = [
      ['Go to Today', function(){ goTab('today'); }, 'home due tasks calls'],
      ['Refresh data', function(){ var r = $('rf'); if (r) r.click(); }, 'reload'],
      ['Record a payment', function(){ goTab('pay'); setTimeout(function(){ var f = document.querySelector('#pform input[name=amount]'); if (f) f.focus(); }, 60); }, 'add payment paypal'],
      ['Reply to clients waiting', function(){ st('kb-ib-f', 'waiting'); goTab('inbox'); inbox(); }, 'inbox messages'],
      ['CRM list view (inline editing and bulk actions)', function(){ goTab('crm'); if (window.KBCRM) KBCRM.list(); }, 'bulk edit table'],
      ['Undo last CRM change', function(){ if (window.KBCRM) KBCRM.undo(); }, 'revert'],
      ['Open X-rays', function(){ goTab('xrays'); }, 'xray sealed domains conversion'],
      ['Run health checks', function(){ goTab('tests'); }, 'tests status'],
      ['Compact or comfortable rows', function(){ if (window.KBUI) KBUI.toast(KBUI.density(document.body.classList.contains('kc-compact') ? 'comfortable' : 'compact') ? 'Compact rows' : 'Comfortable rows'); }, 'density'],
      ['Keyboard shortcuts', function(){ var h = $('kc-help'); if (h) h.click(); }, 'help keys'],
      ['Export leads as CSV', function(){ goTab('leads'); var x = $('csv'); if (x) x.click(); }, 'download spreadsheet']
    ];
    return c.map(function(x){ return { t: x[0], s: 'Command', k: x[2], go: x[1], cmd: 1 }; });
  }
  function score(x, q){ var t = x.t.toLowerCase(), all = (x.t + ' ' + (x.k || '') + ' ' + x.s).toLowerCase(), i = t.indexOf(q);
    if (t === q) return 100; if (i === 0) return 80; if (i > 0 && /[\s·.@\/-]/.test(t.charAt(i - 1))) return 60; if (i > 0) return 40;
    var j = all.indexOf(q); if (j < 0) { var w = q.split(/\s+/).filter(Boolean); return w.length > 1 && w.every(function(p){ return all.indexOf(p) >= 0; }) ? 15 : -1; } return j === 0 || /[\s·.@\/-]/.test(all.charAt(j - 1)) ? 30 : 20; }
  function items(q){
    q = q.toLowerCase().trim(); var cmdOnly = q.charAt(0) === '>'; if (cmdOnly) q = q.slice(1).trim();
    var out = cmds();
    if (!cmdOnly) {
      document.querySelectorAll('nav.tabs button[data-t]').forEach(function(b){ var n = (b.childNodes[0] ? b.childNodes[0].textContent : b.textContent).trim(); out.push({ t: n, s: 'Tab', k: b.dataset.t, go: function(){ goTab(b.dataset.t); } }); });
      (D && D.leads || []).forEach(function(l){ out.push({ t: (l.name || l.email || 'Lead'), s: 'Lead · ' + (l.email || '') + ' · ' + (l.plan || '') + ' · ' + (l.status || 'new'), k: [l.email, l.learn, l.country, (l.tags || []).join(' ')].join(' '), go: function(){ if (window.KBCRM) KBCRM.open(l.id); } }); });
      (D && D.users || []).forEach(function(u){ if (u.email) out.push({ t: (u.name || u.email), s: 'Customer · ' + u.email + ' · ' + (u.status || ''), k: (u.cases || []).map(function(c){ return c.code + ' ' + (c.project_name || ''); }).join(' '), go: function(){ goTab('cust'); location.hash = 'c=' + encodeURIComponent(u.id); } });
        (u.cases || []).forEach(function(c){ out.push({ t: (c.project_name || c.code) + ' · ' + (u.name || u.email), s: 'Case ' + c.code + ' · stage ' + c.stage + (c.paid ? '' : ' · unpaid'), k: [u.email, c.code, c.project_url].join(' '), go: function(){ SEL = c.id; goTab('inbox'); inbox(); } }); }); });
      PROV.forEach(function(fn){ try { (fn(q) || []).forEach(function(x){ if (x && x.t && x.go) out.push(x); }); } catch (e) {} });
    }
    if (!q) return out.filter(function(x){ return x.cmd || (!cmdOnly && x.s === 'Tab'); }).slice(0, 60);
    return out.map(function(x){ var n = score(x, q); return { x: x, n: n < 0 ? -1 : n + (x.cmd ? 5 : 0) }; }).filter(function(r){ return r.n >= 0; }).sort(function(a, b){ return b.n - a.n; }).slice(0, 50).map(function(r){ return r.x; });
  }
  function hl(t, q){ q = q.replace(/^>\s*/, '').trim().toLowerCase(); var i = q ? t.toLowerCase().indexOf(q) : -1; return i < 0 ? esc(t) : esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + q.length)) + '</mark>' + esc(t.slice(i + q.length)); }
  function drawPal(){ var q = $('cmdk-q').value; ITEMS = items(q); IDX = Math.min(IDX, Math.max(0, ITEMS.length - 1));
    $('cmdk-l').innerHTML = ITEMS.map(function(x, i){ return '<li role="option" id="cmdk-o' + i + '" data-i="' + i + '" aria-selected="' + (i === IDX) + '" class="' + (i === IDX ? 'on' : '') + '"><span>' + hl(x.t, q) + '</span><small>' + esc(x.s) + '</small></li>'; }).join('') || '<li class="cmdk-none" role="option" aria-disabled="true"><small>No match. Try an email, a case code or a domain.</small></li>';
    $('cmdk-q').setAttribute('aria-activedescendant', ITEMS.length ? 'cmdk-o' + IDX : '');
    var on = $('cmdk-o' + IDX); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest' }); }
  function openPal(q){ if ($('app').classList.contains('hide')) return; PREV = document.activeElement; pal.hidden = false; $('cmdk-q').value = q || ''; IDX = 0; drawPal(); $('cmdk-q').focus(); }
  function closePal(){ if (pal.hidden) return; pal.hidden = true; if (PREV && PREV.focus && document.contains(PREV)) try { PREV.focus(); } catch (e) {} }
  function pick(i){ var x = ITEMS[i]; closePal(); if (x) x.go(); }
  document.addEventListener('keydown', function(e){
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if ($('app').classList.contains('hide')) return; pal.hidden ? openPal() : closePal(); return; }
    if (pal.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closePal(); }
    else if (e.key === 'ArrowDown') { IDX = Math.min(IDX + 1, ITEMS.length - 1); drawPal(); e.preventDefault(); } else if (e.key === 'ArrowUp') { IDX = Math.max(IDX - 1, 0); drawPal(); e.preventDefault(); }
    else if (e.key === 'Home' && e.ctrlKey) { IDX = 0; drawPal(); e.preventDefault(); } else if (e.key === 'End' && e.ctrlKey) { IDX = Math.max(0, ITEMS.length - 1); drawPal(); e.preventDefault(); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(IDX); } else if (e.key === 'Tab') { e.preventDefault(); $('cmdk-q').focus(); }
  }, true);
  $('cmdk-q').addEventListener('input', function(){ IDX = 0; drawPal(); });
  pal.addEventListener('mousemove', function(e){ var li = e.target.closest('li[data-i]'); if (li && +li.dataset.i !== IDX) { IDX = +li.dataset.i; [].forEach.call($('cmdk-l').children, function(x, i){ x.classList.toggle('on', i === IDX); x.setAttribute('aria-selected', i === IDX); }); } });
  pal.addEventListener('click', function(e){ var li = e.target.closest('li[data-i]'); if (li) pick(+li.dataset.i); else if (e.target === pal) closePal(); });
  var hdr = document.querySelector('header .sp');
  if (hdr) { var kb = document.createElement('button'); kb.type = 'button'; kb.textContent = matchMedia('(max-width:700px)').matches ? 'Search' : 'Search  ⌘K'; kb.setAttribute('aria-keyshortcuts', 'Control+K'); kb.onclick = function(){ openPal(); }; hdr.parentNode.insertBefore(kb, hdr.nextSibling); var lv = document.createElement('span'); lv.className = 'live'; lv.innerHTML = '<i></i>Live'; lv.title = 'Refreshes every 60 seconds while this tab is open'; hdr.parentNode.insertBefore(lv, hdr); }

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
    box.querySelectorAll('[data-pe]').forEach(function(b){ b.onclick = function(){ var em = prompt('Email of the Kolaboro account this payment belongs to'); if (!em) return; A.rpc('kolaboro_admin', { p_key: A.pw(), p_action: 'assign_event', p_payload: { id: +b.dataset.pe, email: em } }).then(function(r){ if (r && r.error) (window.KBUI ? KBUI.toast : function(m){ alert(m); })('Not assigned: ' + (A.err ? A.err(r) : r.error), 'bad'); else if (window.KBUI) KBUI.toast('Payment assigned to ' + em + '.', 'ok'); A.reload(); }); }; });
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
        (h.audit ? '<h3 style="margin:16px 0 6px">Admin audit trail</h3><p class="muted" style="margin:0 0 6px;font-size:.85rem">Every action in this admin is appended to a hash-chained log; the chain head goes into the public log every morning. <b>' + (h.audit.intact ? '✓ Chain intact' : '✗ Chain broken at entry ' + esc(h.audit.first_broken)) + '</b> · ' + h.audit.entries + ' entries</p>' + ((h.audit_recent || []).length ? '<div class="tw"><table><tr><th>When</th><th>Action</th><th>Target</th><th>Hash</th></tr>' + h.audit_recent.map(function(x){ return '<tr><td>' + esc(String(x.at).slice(0, 16).replace('T', ' ')) + '</td><td>' + esc(x.action) + '</td><td>' + esc(x.target || '') + '</td><td><code>' + esc(x.hash) + '</code></td></tr>'; }).join('') + '</table></div>' : '') : '') +
        '<p class="muted" style="font-size:.85rem;margin-bottom:0">Last 14 days: ' + h.selftests.map(function(s){ return '<span class="dot ' + (s.ok ? 'g' : 'r') + '" style="display:inline-block" title="' + esc(String(s.at).slice(0, 10)) + '"></span>'; }).join(' ') + ' · Emails: ' + (o.sent_7d || 0) + ' sent in 7 days, ' + (o.queued || 0) + ' queued, ' + (o.failed_7d || 0) + ' failed · PayPal notifications in 7 days: ' + (h.pay_events_7d || 0) + '</p>';
    });
  }
  document.addEventListener('kbadm', draw); if (A.D) draw();
})();
// browser errors and CSP reports from visitors, last 14 days (Tests tab)
(function(){
  var A = window.KBADM; if (!A) return;
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  var done = false;
  function draw(){
    if (done) return; var sec = document.getElementById('t-tests'); if (!sec || !A.pw()) return; done = true;
    A.rpc('kolaboro_admin_errors', { p_key: A.pw() }).then(function(d){
      if (!d || d.error) return; var E = d.errors || [];
      var box = document.createElement('div'); box.className = 'card'; sec.appendChild(box);
      box.innerHTML = '<h2>Errors in visitors\' browsers</h2><p class="muted" style="margin-top:0">JavaScript errors and blocked scripts (CSP report-only) seen on kolaboro.com, last 14 days. Page path, message and script origin only. A digest is emailed every morning.</p>' +
        (E.length ? '<div class="tw"><table><tr><th>Day</th><th>Kind</th><th>Page</th><th>Message</th><th>Source</th><th>Times</th></tr>' + E.map(function(e){ return '<tr><td>' + esc(e.day) + '</td><td>' + esc(e.kind) + '</td><td>' + esc(e.page) + '</td><td>' + esc(e.msg) + '</td><td><small>' + esc(e.src) + (e.line ? ':' + e.line : '') + ' · ' + esc(e.ua) + '</small></td><td>' + e.n + '</td></tr>'; }).join('') + '</table></div>' : '<p><span class="st"><span class="dot g"></span><b>No errors reported</b></span></p>');
    });
  }
  document.addEventListener('kbadm', draw); if (A.D) draw();
})();
// founder co-signature: the daily public log line is also signed with Carlos's passkey (Face ID / fingerprint on his own device)
(function(){
  var A = window.KBADM; if (!A) return;
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function b64(u){ var s = ''; new Uint8Array(u).forEach(function(x){ s += String.fromCharCode(x); }); return btoa(s); }
  function b64u(u){ return b64(u).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unb64u(x){ x = x.replace(/-/g, '+').replace(/_/g, '/'); while (x.length % 4) x += '='; var s = atob(x), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
  function act(a, p){ return A.rpc('kolaboro_admin', { p_key: A.pw(), p_action: a, p_payload: p || {} }); }
  var box = null, done = false;
  function paint(){
    act('cosign_status').then(function(st){
      if (!st || st.error || !st.keys) { box.innerHTML = '<h2>Co-sign the public log</h2><p class="muted">Not available yet (database update pending).</p>'; return; }
      var keys = st.keys, heads = st.heads || [], ok = !!(window.PublicKeyCredential && navigator.credentials);
      box.innerHTML = '<h2>Co-sign the public log</h2><p class="muted" style="margin-top:0">Each daily log line is signed by the server. When you co-sign it with your passkey, a second signature that only your device can make is published next to it, so not even the server alone can rewrite history. Takes one tap a day.</p>' +
        (!ok ? '<p>This browser does not support passkeys.</p>' : !keys.length ? '<p><button class="btn" id="cs-reg">Register this device as co-signer</button></p>' :
        '<p class="muted" style="font-size:.85rem">' + keys.length + ' co-signing device' + (keys.length > 1 ? 's' : '') + ' registered. <button class="btn btn-line" id="cs-reg" style="padding:4px 10px;font-size:.8rem">Add another device</button></p><div class="tw"><table><tr><th>Day</th><th>Line</th><th></th></tr>' +
          heads.map(function(h){ return '<tr><td>' + esc(h.day) + '</td><td><code>' + esc(h.head.slice(0, 16)) + '…</code></td><td>' + (h.cosigned ? '<span class="st"><span class="dot g"></span>Co-signed</span>' : '<button class="btn" data-cs="' + esc(h.day) + '|' + esc(h.head) + '">Co-sign</button>') + '</td></tr>'; }).join('') + '</table></div>');
      var r = document.getElementById('cs-reg'); if (r) r.onclick = function(){
        navigator.credentials.create({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), rp: { id: 'kolaboro.com', name: 'Kolaboro log co-signer' }, user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'Kolaboro founder', displayName: 'Kolaboro founder' }, pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -8 }, { type: 'public-key', alg: -257 }], authenticatorSelection: { userVerification: 'required', residentKey: 'preferred' }, attestation: 'none' } })
          .then(function(c){ var res = c.response; if (!res.getPublicKey) throw new Error('browser cannot export the key'); return act('cosign_key_add', { cred_id: c.id, spki: b64(res.getPublicKey()), alg: res.getPublicKeyAlgorithm(), label: navigator.platform || 'device' }); })
          .then(function(d){ if (d && d.error) throw new Error(d.error); try { localStorage.setItem('kb-cosign-ids', JSON.stringify((JSON.parse(localStorage.getItem('kb-cosign-ids') || '[]')).concat([d && d.cred_id].filter(Boolean)))); } catch (e) {} paint(); })
          .catch(function(e){ (window.KBUI?KBUI.toast:function(m){alert(m)})('Not registered: ' + (e.message || e), 'bad'); });
      };
      box.querySelectorAll('[data-cs]').forEach(function(b){ b.onclick = function(){
        var p = b.dataset.cs.split('|'), day = p[0], head = p[1]; b.disabled = true;
        crypto.subtle.digest('SHA-256', new TextEncoder().encode('kolaboro-cosign-v1\n' + day + '\n' + head)).then(function(ch){
          return navigator.credentials.get({ publicKey: { challenge: ch, rpId: 'kolaboro.com', allowCredentials: keys.map(function(k){ return { type: 'public-key', id: unb64u(k.cred_id) }; }), userVerification: 'required' } });
        }).then(function(a){ var r2 = a.response; return act('cosign', { day: day, head: head, cred_id: a.id, authenticator_data: b64u(r2.authenticatorData), client_data_json: b64u(r2.clientDataJSON), signature: b64u(r2.signature) }); })
          .then(function(d){ if (d && d.error) throw new Error(d.error); paint(); }).catch(function(e){ b.disabled = false; (window.KBUI?KBUI.toast:function(m){alert(m)})('Not co-signed: ' + (e.message || e), 'bad'); });
      }; });
    });
  }
  function draw(){ if (done) return; var sec = document.getElementById('t-tests'); if (!sec || !A.pw()) return; done = true; box = document.createElement('div'); box.className = 'card'; sec.insertBefore(box, sec.firstChild); paint(); }
  document.addEventListener('kbadm', draw); if (A.D) draw();
})();

/* Developer replies moderation (block I, 3 Nov 2026): verified replies from /developers/reply/. Nothing is public until approved here.
   Before approving: re-check the DNS record live, confirm the domain is this project's domain in our private records, and match
   each document to its SHA-256 (drop the file you received onto its row). Needs kolaboro_devreply_admin (scratchpad m10/i.sql). */
(function(){
  var A = window.KBADM; if (!A) return;
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function hex(b){ return Array.prototype.map.call(new Uint8Array(b), function(x){ return ('0' + x.toString(16)).slice(-2); }).join(''); }
  var box = null, done = false, F = 'new', L = [];
  function act(a, p){ return A.rpc('kolaboro_devreply_admin', { p_key: A.pw(), p_action: a, p_payload: p || {} }); }
  function paint(){
    box.innerHTML = '<h3 style="margin:0">Developer replies</h3><p class="muted" style="margin:4px 0 0">Loading…</p>';
    act('list').then(function(d){
      if (!d || !d.items) { box.innerHTML = '<h3 style="margin:0">Developer replies</h3><p class="muted" style="margin:6px 0 0">Not switched on yet: apply scratchpad m10/i.sql (block I). Until then /developers/reply/ shows "opening soon" and the unverified note still arrives as a lead (plan developer-reply).</p>'; return; }
      L = d.items; draw2();
    }).catch(function(){ box.innerHTML = '<h3 style="margin:0">Developer replies</h3><p class="muted">Could not load.</p>'; });
  }
  function draw2(){
    var n = { new: 0, approved: 0, rejected: 0 }; L.forEach(function(x){ n[x.status]++; });
    var R = L.filter(function(x){ return !F || x.status === F; });
    box.innerHTML = '<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><h3 style="margin:0">Developer replies</h3><div class="ops-f">' +
      ['new', 'approved', 'rejected', ''].map(function(s){ return '<button class="btn-s" data-f="' + s + '"' + (F === s ? ' style="background:#17212B;color:#fff"' : '') + '>' + (s || 'all') + (s ? ' (' + n[s] + ')' : '') + '</button>'; }).join('') + '</div></div>' +
      '<p class="muted" style="margin:6px 0 10px">Approve only after: "Re-check live" shows the TXT record or meta tag still there, the domain is this project\'s domain, each document matches its fingerprint. Approving publishes the reply text, topic, document types and fingerprints on the named project page; the domain with the "Verified: controls" badge when it is the official domain; the company only if the developer opted in.</p>' +
      (R.length ? R.map(function(x){
        return '<div style="border:1px solid var(--line);border-radius:12px;padding:12px;margin-top:10px" data-id="' + x.id + '"><b>#' + x.id + ' ' + esc(x.project_id) + '</b> <span class="pill">' + esc(x.status) + '</span> <small class="muted">' + esc(new Date(x.created_at).toLocaleString()) + ' &middot; ' + esc(x.topic) + '</small>' +
          '<div style="margin-top:6px"><b>' + esc(x.company) + '</b> &middot; ' + esc(x.contact_name) + (x.contact_email ? ' &middot; <a href="mailto:' + esc(x.contact_email) + '">' + esc(x.contact_email) + '</a>' : '') + (x.publish_company ? ' &middot; <i>wants company name published</i>' : ' &middot; <i>publish anonymously</i>') + '</div>' +
          '<div style="margin-top:6px">Domain <b>' + esc(x.domain) + '</b>, proof <b>' + (x.verify_method === 'meta' ? 'homepage meta tag' : 'DNS TXT') + '</b> <code>' + esc(x.dns_token) + '</code>, DNS seen at submit: ' + (x.dns_seen_at_submit ? 'yes' : 'no') +
          ' &middot; ' + (x.official_domain ? '<b style="color:#0B7A55">official domain of the named page</b> (badge "Verified: controls ' + esc(x.domain) + '" on approval)' : '<b style="color:#B83A05">not the named page\'s domain</b> (no badge)') +
          ' <button class="btn-s" data-dns="' + esc(x.domain) + '|' + esc(x.dns_token) + '|' + esc(x.project_id) + '">Re-check live</button> <span data-dnsout></span></div>' +
          '<pre style="white-space:pre-wrap;font:inherit;background:#F6F6F3;border-radius:10px;padding:10px;margin:8px 0">' + esc(x.reply) + '</pre>' +
          ((x.docs || []).length ? '<table class="ops-t"><tr><th>Type</th><th>File</th><th>SHA-256</th><th>Match</th></tr>' + x.docs.map(function(k, i){ return '<tr><td>' + esc(k.kind) + '</td><td>' + esc(k.name) + ' <small class="muted">' + Math.round((k.bytes || 0) / 1024) + ' KB</small>' + (k.link ? '<br><a href="' + esc(k.link) + '" target="_blank" rel="noopener noreferrer">link</a>' : '') + '</td><td><code style="font-size:.72rem;word-break:break-all">' + esc(k.sha256) + '</code></td><td><label class="btn-s">Check file<input type="file" hidden data-sha="' + esc(k.sha256) + '"></label> <span data-shaout></span></td></tr>'; }).join('') + '</table>' : '<p class="muted">No documents attached.</p>') +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;align-items:center"><input data-note placeholder="Public note shown with the reply (optional)" maxlength="600" value="' + esc(x.public_note || '') + '" style="flex:1;min-width:200px;padding:7px;border:1px solid var(--line);border-radius:8px;font:inherit">' +
          (x.status !== 'approved' ? '<button class="btn-s" data-act="approve">Approve and publish</button>' : '') + (x.status !== 'rejected' ? '<button class="btn-s" data-act="reject">Reject</button>' : '') + (x.status !== 'new' ? '<button class="btn-s" data-act="reopen">Reopen</button>' : '') + '</div></div>';
      }).join('') : '<p class="muted">Nothing here.</p>');
    box.querySelectorAll('[data-f]').forEach(function(b){ b.onclick = function(){ F = b.dataset.f; draw2(); }; });
    box.querySelectorAll('[data-dns]').forEach(function(b){ b.onclick = function(){
      var p = b.dataset.dns.split('|'), o = b.parentNode.querySelector('[data-dnsout]'); o.textContent = 'checking…';
      fetch('/api/x/i/verify?id=' + encodeURIComponent(p[2]) + '&domain=' + encodeURIComponent(p[0]) + '&token=' + p[1]).then(function(r){ return r.json(); }).then(function(v){
        var d = v.dns || {}; o.innerHTML = (d.found ? '<b style="color:#0B7A55">TXT found on ' + esc(d.where) + '</b>' : 'TXT not found') + ' &middot; ' + (v.meta && v.meta.found ? '<b style="color:#0B7A55">meta tag found</b>' : 'meta tag not found') +
          ' &middot; official domain(s) on the named page: ' + esc(((v.official || {}).domains || []).join(', ') || 'none') + ((v.official || {}).match ? ' <b style="color:#0B7A55">(match)</b>' : ' <b style="color:#B83A05">(no match)</b>') + (!v.verified ? ' <b style="color:#B83A05">Do not approve: proof gone.</b>' : '');
      }).catch(function(){ o.textContent = 'error'; });
    }; });
    box.querySelectorAll('[data-sha]').forEach(function(inp){ inp.onchange = function(){
      var f = inp.files[0], o = inp.closest('td').querySelector('[data-shaout]'); if (!f) return; o.textContent = 'hashing…';
      f.arrayBuffer().then(function(b){ return crypto.subtle.digest('SHA-256', b); }).then(function(h){ o.innerHTML = hex(h) === inp.dataset.sha ? '<b style="color:#0B7A55">same file</b>' : '<b style="color:#B83A05">different file</b>'; });
    }; });
    box.querySelectorAll('[data-act]').forEach(function(b){ b.onclick = function(){
      var row = b.closest('[data-id]'), a = b.dataset.act;
      if (a === 'approve' && !confirm('Publish this reply next to ' + row.querySelector('b').textContent + '? Confirm the domain belongs to this project first.')) return;
      b.disabled = true; act(a, { id: +row.dataset.id, note: row.querySelector('[data-note]').value }).then(paint);
    }; });
  }
  function draw(){ if (done) return; var sec = document.getElementById('t-ops'); if (!sec || !A.pw()) return; done = true; box = document.createElement('div'); box.className = 'card'; box.style.marginBottom = '16px'; sec.insertBefore(box, sec.firstChild); paint(); }
  document.addEventListener('kbadm', draw); if (A.D) draw();
})();

/* Buyer reports moderation (block T, 4 Nov 2026): passkey-signed reports from /buyer-reports/. Nothing is public until approved here.
   The buyer uploads nothing: we hold only the SHA-256 of their contract or receipt. If they email the document, drop it on the row:
   a match ticks "document seen". Edit the public text to remove anything that could identify the buyer. Needs kolaboro_t_report_admin
   (scratchpad m11/t.sql). */
(function(){
  var A = window.KBADM; if (!A) return;
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function hex(b){ return Array.prototype.map.call(new Uint8Array(b), function(x){ return ('0' + x.toString(16)).slice(-2); }).join(''); }
  var box = null, done = false, F = 'new', L = [], T = 'Buyer reports';
  var KIND = { delay: 'Delay', payment: 'Payment problem', quality: 'Build quality', good: 'Good experience', other: 'Something else' };
  function act(a, p){ return A.rpc('kolaboro_t_report_admin', { p_key: A.pw(), p_action: a, p_payload: p || {} }); }
  function paint(){
    box.innerHTML = '<h3 style="margin:0">' + T + '</h3><p class="muted" style="margin:4px 0 0">Loading…</p>';
    act('list').then(function(d){
      if (!d || !d.items) { box.innerHTML = '<h3 style="margin:0">' + T + '</h3><p class="muted" style="margin:6px 0 0">Not switched on yet: apply scratchpad m11/t.sql (block T). Until then /buyer-reports/ shows "opens soon" and nothing is stored.</p>'; return; }
      L = d.items; draw2();
    }).catch(function(){ box.innerHTML = '<h3 style="margin:0">' + T + '</h3><p class="muted">Not switched on yet (m11/t.sql) or could not load.</p>'; });
  }
  function draw2(){
    var n = { new: 0, approved: 0, rejected: 0 }; L.forEach(function(x){ n[x.status]++; });
    var R = L.filter(function(x){ return !F || x.status === F; });
    box.innerHTML = '<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><h3 style="margin:0">' + T + '</h3><div class="ops-f">' +
      ['new', 'approved', 'rejected', ''].map(function(s){ return '<button class="btn-s" data-f="' + s + '"' + (F === s ? ' style="background:#17212B;color:#fff"' : '') + '>' + (s || 'all') + (s ? ' (' + n[s] + ')' : '') + '</button>'; }).join('') + '</div></div>' +
      '<p class="muted" style="margin:6px 0 10px">Signature already checked by the server. Before approving: the text is factual and names no private person; edit the public text to remove anything that identifies the buyer. If the buyer emailed the document, drop it on the row: a matching fingerprint marks it "document seen". The document fingerprint is never published.</p>' +
      (R.length ? R.map(function(x){
        return '<div style="border:1px solid var(--line);border-radius:12px;padding:12px;margin-top:10px" data-id="' + x.id + '"><b>#' + x.id + ' <a href="/p/' + esc(x.project_id) + '" target="_blank">' + esc(x.project_id) + '</a></b> <span class="pill">' + esc(x.status) + '</span> <span class="pill">' + esc(KIND[x.kind] || x.kind) + '</span> <small class="muted">' + esc(new Date(x.created_at).toLocaleString()) +
          (x.delay_months != null ? ' &middot; ' + x.delay_months + ' months late' : '') + (x.purchased ? ' &middot; bought ' + esc(x.purchased) : '') + ' &middot; passkey ' + esc(String(x.key_hash).slice(0, 12)) + ' (alg ' + x.key_alg + ')</small>' +
          '<pre style="white-space:pre-wrap;font:inherit;background:#F6F6F3;border-radius:10px;padding:10px;margin:8px 0">' + esc(x.body) + '</pre>' +
          '<div style="font-size:.85rem">' + esc(x.doc_kind) + ' fingerprint <code style="font-size:.72rem;word-break:break-all">' + esc(x.doc_sha256) + '</code> <label class="btn-s">Check emailed file<input type="file" hidden data-sha="' + esc(x.doc_sha256) + '"></label> <span data-shaout></span>' +
          ' <label style="white-space:nowrap"><input type="checkbox" data-doc' + (x.doc_checked ? ' checked' : '') + '> document seen and matched</label></div>' +
          '<textarea data-pub rows="3" maxlength="2000" style="width:100%;margin-top:8px;padding:7px;border:1px solid var(--line);border-radius:8px;font:inherit" placeholder="Public text (leave empty to publish the text as sent)">' + esc(x.public_text || '') + '</textarea>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;align-items:center"><input data-note placeholder="Moderator note shown with the report (optional)" maxlength="600" value="' + esc(x.public_note || '') + '" style="flex:1;min-width:200px;padding:7px;border:1px solid var(--line);border-radius:8px;font:inherit">' +
          (x.status !== 'approved' ? '<button class="btn-s" data-act="approve">Approve and publish</button>' : '') + (x.status !== 'rejected' ? '<button class="btn-s" data-act="reject">Reject</button>' : '') + (x.status !== 'new' ? '<button class="btn-s" data-act="reopen">Reopen</button>' : '') + '</div></div>';
      }).join('') : '<p class="muted">Nothing here.</p>');
    box.querySelectorAll('[data-f]').forEach(function(b){ b.onclick = function(){ F = b.dataset.f; draw2(); }; });
    box.querySelectorAll('[data-sha]').forEach(function(inp){ inp.onchange = function(){
      var f = inp.files[0], row = inp.closest('[data-id]'), o = row.querySelector('[data-shaout]'); if (!f) return; o.textContent = 'hashing…';
      f.arrayBuffer().then(function(b){ return crypto.subtle.digest('SHA-256', b); }).then(function(h){
        var same = hex(h) === inp.dataset.sha; o.innerHTML = same ? '<b style="color:#0B7A55">same file</b>' : '<b style="color:#B83A05">different file</b>';
        if (same) row.querySelector('[data-doc]').checked = true;
      });
    }; });
    box.querySelectorAll('[data-act]').forEach(function(b){ b.onclick = function(){
      var row = b.closest('[data-id]'), a = b.dataset.act;
      if (a === 'approve' && !confirm('Publish report #' + row.dataset.id + ' anonymously? Check the public text names no one.')) return;
      b.disabled = true;
      act(a, { id: +row.dataset.id, note: row.querySelector('[data-note]').value, public_text: row.querySelector('[data-pub]').value, doc_checked: row.querySelector('[data-doc]').checked }).then(paint);
    }; });
  }
  function draw(){ if (done) return; var sec = document.getElementById('t-ops'); if (!sec || !A.pw()) return; done = true; box = document.createElement('div'); box.className = 'card'; box.style.marginBottom = '16px'; sec.insertBefore(box, sec.firstChild); paint(); }
  document.addEventListener('kbadm', draw); if (A.D) draw();
})();
