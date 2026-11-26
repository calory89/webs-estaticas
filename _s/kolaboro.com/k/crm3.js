/* Kolaboro admin, part 4 (crm14, 7 Nov 2026):
   - Today: one screen with who to reply to, who to call or email, cases due, visits to review and payments to match, with
     one-click actions (contacted, snooze, done) that can be undone. j / k move between items, Enter runs the first action.
   - X-ray log on the X-rays tab: the sealed X-rays table (kolaboro_xrays) through RPC kolaboro_xray_admin (admin key): recent
     X-rays, per-domain conversion (checkout, PayPal, leads, cases, paid), daily counts. Anonymous runs: domain and query only.
   - Saved views: name and keep the current filters of the CRM, Customers and Leads tabs (this device only, localStorage).
   - Palette providers: saved views, X-ray domains and Today items in Ctrl/Cmd+K.
   Everything uses the existing admin RPCs (kolaboro_admin, kolaboro_ops) plus kolaboro_xray_admin; nothing runs before sign-in. */
(function(){
  var A = window.KBADM; if (!A || window.__kbcrm3) return; window.__kbcrm3 = 1;
  var $ = function(i){ return document.getElementById(i); };
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  function ymd(d){ return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today(){ return ymd(new Date()); }
  function plus(n){ var d = new Date(); d.setDate(d.getDate() + n); return ymd(d); }
  function utc(n){ return new Date(Date.now() + (n || 0) * 864e5).toISOString().slice(0, 10); }   // X-ray days are UTC days (database)
  function hrs(t){ return t ? (Date.now() - new Date(t)) / 36e5 : 0; }
  function ago(t){ if (!t) return ''; var s = (Date.now() - new Date(t)) / 1000; if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min'; if (s < 86400) return Math.round(s / 3600) + ' h'; return Math.round(s / 86400) + ' d'; }
  function when(t){ if (!t) return ''; var d = new Date(t); if (isNaN(d)) return ''; var s = (Date.now() - d) / 1000; if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min ago'; if (s < 86400) return Math.round(s / 3600) + ' h ago'; return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ' ' + d.toTimeString().slice(0, 5); }
  function st(k, v){ try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function toast(m, k, o){ if (window.KBUI) return KBUI.toast(m, k, o); if (k === 'bad') alert(m); }
  function adm(a, p){ return A.rpc('kolaboro_admin', { p_key: A.pw(), p_action: a, p_payload: p || {} }); }
  function isTest(e){ return /(^|@|\.)(test|example)\b|@example\.com$|@kolaboro\.test$|^demo@kolaboro\.com$/i.test(e || ''); }
  function goTab(t){ var b = document.querySelector('nav.tabs button[data-t="' + t + '"]'); if (!b) return false; if (/^#c=/.test(location.hash)) history.pushState(null, '', location.pathname); if (!b.classList.contains('on')) b.click(); return true; }
  var D = null, OPS = null, OPSAT = 0, XR = {}, XRAT = {};

  // ---------- tab + section
  var nav = document.querySelector('nav.tabs'), main = document.querySelector('main'); if (!nav || !main) return;
  var tb = document.createElement('button'); tb.type = 'button'; tb.dataset.t = 'today'; tb.innerHTML = 'Today <span id="kt-n" class="pill" style="display:none"></span>';
  nav.insertBefore(tb, nav.firstChild);
  var sec = document.createElement('section'); sec.id = 't-today'; sec.className = 'hide'; sec.setAttribute('aria-label', 'Today'); sec.innerHTML = '<div class="kc-skel" aria-label="Loading"><i></i><i></i><i></i></div>';
  main.insertBefore(sec, main.firstChild);
  nav.addEventListener('click', function(e){ var b = e.target.closest('button[data-t]'); if (!b) return;
    sec.classList.toggle('hide', b !== tb); if (b === tb) { tb.classList.add('on'); nav.querySelectorAll('button[data-t]').forEach(function(x){ if (x !== tb) x.classList.remove('on'); }); main.querySelectorAll(':scope > section').forEach(function(s){ s.classList.toggle('hide', s !== sec); }); renderToday(); extra(); } else tb.classList.remove('on'); });

  // ---------- extra data for Today (visits from kolaboro_ops, X-ray counts), at most once a minute
  function extra(force){
    if (!D || !A.pw()) return;
    var now = Date.now(), jobs = [];
    if (force || now - OPSAT > 60000) { OPSAT = now; jobs.push(A.rpc('kolaboro_ops', { p_key: A.pw(), p_action: 'overview', p_payload: {} }).then(function(r){ if (r && !r.error) OPS = r; }, function(){})); }
    jobs.push(xray(7));
    Promise.all(jobs).then(function(){ if (!sec.classList.contains('hide')) renderToday(); });
  }
  function xray(days, force){
    if (!A.pw()) return Promise.resolve(null);
    if (!force && XR[days] && Date.now() - (XRAT[days] || 0) < 60000) return Promise.resolve(XR[days]);
    XRAT[days] = Date.now();
    return A.rpc('kolaboro_xray_admin', { p_key: A.pw(), p_days: days }).then(function(d){ XR[days] = d && !d.error && d.totals ? d : { error: (d && (d.error || d.message)) || 'unexpected answer', missing: !!(d && (d.http === 404 || /could not find|does not exist|PGRST202/i.test(String(d.error || d.message || '')))) }; return XR[days]; }, function(){ XR[days] = { error: 'network' }; return XR[days]; });
  }

  // ---------- Today model
  var STALL = 7;
  function model(){
    var t = today(), L = (D.leads || []).filter(function(l){ return !isTest(l.email); }), N = D.notes || [], U = D.users || [];
    var stOf = window.KBCRM ? KBCRM.stOf : function(l){ return ({ paid: 'won', no: 'lost' })[l.status] || l.status || 'new'; };
    var byLead = {}; L.forEach(function(l){ byLead[l.id] = l; });
    var noted = {}; N.forEach(function(n){ if (n.lead_id) noted[n.lead_id] = 1; });
    var M = { reply: [], call: [], cases: [], pay: [] };
    // reply: last client messages with no answer after them
    U.forEach(function(u){ (u.cases || []).forEach(function(c){ var ms = c.messages || [], w = null; for (var i = ms.length - 1; i >= 0; i--) { if (ms[i].admin) break; w = ms[i].at; }
      if (w) M.reply.push({ k: 'reply', id: 'r' + c.id, at: w, late: hrs(w) > 24, u: u, c: c, t: (u.name || u.email) + ' is waiting ' + ago(w), s: (c.project_name || c.code) + ': "' + String(ms[ms.length - 1].body || '').slice(0, 90) + '"' }); }); });
    M.reply.sort(function(a, b){ return a.at < b.at ? -1 : 1; });
    // call or email: next actions due, CRM tasks due, fresh leads nobody has contacted
    L.forEach(function(l){ var s = stOf(l); if (s === 'won' || s === 'lost') return;
      if (l.next_action && l.next_action <= t) M.call.push({ k: 'next', id: 'n' + l.id, l: l, d: l.next_action, late: l.next_action < t, t: (l.name || l.email), s: 'Next action ' + (l.next_action < t ? 'overdue since ' + l.next_action : 'today') + ' · ' + s + ' · ' + (l.plan || 'lead') });
      else if (s === 'new' && !noted[l.id] && !l.next_action && hrs(l.created_at) < 72 && (l.phone || /^https?:\/\//.test(l.learn || '') || /check-request|yc-buyer|yc-desk|account/.test(l.plan || '')))
        M.call.push({ k: 'fresh', id: 'f' + l.id, l: l, d: String(l.created_at).slice(0, 10), t: (l.name || l.email), s: 'New ' + ago(l.created_at) + ' ago, not contacted yet · ' + (l.plan || 'lead') + (l.learn ? ' · ' + String(l.learn).replace(/^https?:\/\/(www\.)?/, '').slice(0, 50) : '') }); });
    N.forEach(function(n){ if (n.done || !n.due || n.due > t) return; var l = byLead[n.lead_id];
      M.call.push({ k: 'task', id: 'k' + n.id, n: n, l: l, d: n.due, late: n.due < t, t: String(n.body || '').slice(0, 90), s: (n.kind || 'task') + ' due ' + (n.due < t ? n.due + ' (overdue)' : 'today') + (l ? ' · ' + (l.name || l.email) : '') }); });
    M.call.sort(function(a, b){ return (b.late ? 1 : 0) - (a.late ? 1 : 0) || (a.d < b.d ? -1 : a.d > b.d ? 1 : 0); });
    // cases due: paid, no report yet; overdue or due in 3 days, or no stage change for 7+ days
    U.forEach(function(u){ (u.cases || []).forEach(function(c){ if (!c.paid || c.report_url) return;
      var last = (c.log || []).filter(function(x){ return x.stage === c.stage; }).slice(-1)[0], since = last ? last.at : c.created_at, dd = Math.floor(hrs(since) / 24);
      var why = c.eta && c.eta < t ? 'report overdue since ' + c.eta : c.eta && c.eta <= plus(3) ? 'report due ' + c.eta : dd >= STALL ? dd + ' days in this stage' : '';
      if (why) M.cases.push({ k: 'case', id: 'c' + c.id, u: u, c: c, late: !!(c.eta && c.eta < t) || dd >= 14, d: c.eta || '9999', t: (c.project_name || c.code) + ' · ' + (u.name || u.email), s: c.code + ' · stage ' + c.stage + ' · ' + why }); }); });
    ((OPS && OPS.tasks) || []).forEach(function(k){ if (k.status === 'submitted') M.cases.push({ k: 'visit', id: 'v' + k.id, task: k, d: '0000', t: 'Site visit to review' + (k.case ? ' · ' + k.case : ''), s: (k.agent_name ? 'Agent ' + k.agent_name + ' · ' : '') + (k.project || k.summary || 'submitted by the agent') }); });
    M.cases.sort(function(a, b){ return (b.late ? 1 : 0) - (a.late ? 1 : 0) || (a.d < b.d ? -1 : 1); });
    // payments to match
    (D.pay_events || []).forEach(function(e){ if (!e.matched && /completed/i.test(e.status || '')) M.pay.push({ k: 'pev', id: 'e' + e.id, e: e, late: hrs(e.created_at) > 48, t: (e.currency || '') + ' ' + (e.amount == null ? '' : e.amount) + ' from ' + (e.email || 'unknown payer'), s: 'PayPal ' + ago(e.created_at) + ' ago, not matched to a buyer' + (e.item ? ' · ' + e.item : '') }); });
    var unpaidBy = {}; U.forEach(function(u){ (u.cases || []).forEach(function(c){ if (!c.paid) (unpaidBy[String(u.email || '').toLowerCase()] = unpaidBy[String(u.email || '').toLowerCase()] || []).push({ u: u, c: c }); }); });
    (D.payments || []).forEach(function(p){ if (p.case_id) return; var em = String(p.email || '').toLowerCase(), un = unpaidBy[em];
      if (un && un.length) M.pay.push({ k: 'pnc', id: 'p' + p.id, p: p, u: un[0].u, late: true, t: (p.currency || '') + ' ' + p.amount + ' from ' + (p.name || p.email), s: 'Payment recorded, not attached to a case, and this buyer has ' + un.length + ' unpaid case' + (un.length > 1 ? 's' : '') + ' (' + un.map(function(x){ return x.c.code; }).join(', ') + ')' });
      else if (/paypal/.test(p.source || '')) M.pay.push({ k: 'pna', id: 'p' + p.id, p: p, t: (p.currency || '') + ' ' + p.amount + ' from ' + (p.name || p.email), s: 'PayPal payment not attached to a case yet · ' + (p.paid_at || '') }); });
    U.forEach(function(u){ (u.cases || []).forEach(function(c){ if (c.report_url || !c.next_payment_date || c.next_payment_date < t || c.next_payment_date > plus(14)) return;
      M.pay.push({ k: 'due', id: 'd' + c.id, u: u, c: c, d: c.next_payment_date, late: c.next_payment_date <= plus(3), t: (u.name || u.email) + ' pays the developer on ' + c.next_payment_date, s: (c.project_name || c.code) + (c.next_payment_amount ? ' · ' + c.next_payment_amount : '') + ' · stage ' + c.stage + (c.paid ? '' : ' · our case is unpaid') }); }); });
    return M;
  }
  var LAST = [];
  function acts(x){
    var l = x.l, b = function(a, label, extra){ return '<button type="button" class="btn2 kt-a" data-a="' + a + '" data-id="' + esc(x.id) + '"' + (extra || '') + '>' + label + '</button>'; };
    if (x.k === 'reply') return b('reply', 'Reply', ' data-primary');
    if (x.k === 'next' || x.k === 'fresh' || (x.k === 'task' && l)) {
      var wa = String(l.phone || '').replace(/[^\d]/g, ''), h = '<a class="btn2 kt-a" data-primary href="mailto:' + esc(l.email) + '">Email</a>' + (wa ? '<a class="btn2 kt-a" href="https://wa.me/' + wa + '" target="_blank" rel="noopener">WhatsApp</a>' : '');
      if (x.k === 'task') return h + b('done', 'Done') + b('open', 'Open lead');
      return h + (window.KBCRM && KBCRM.has() ? b('contacted', 'Contacted') + b('snooze1', 'Tomorrow') + b('snooze3', 'In 3 days') : b('contacted', 'Contacted')) + b('open', 'Open');
    }
    if (x.k === 'task') return b('done', 'Done', ' data-primary');
    if (x.k === 'case' || x.k === 'due') return b('case', 'Open case', ' data-primary') + (x.k === 'case' ? b('board', 'Board') : b('inbox', 'Message'));
    if (x.k === 'visit') return b('ops', 'Review visit', ' data-primary');
    if (x.k === 'pev' || x.k === 'pna' || x.k === 'pnc') return b('pay', 'Match payment', ' data-primary') + (x.u ? b('cust', 'Customer') : '');
    return '';
  }
  function list(title, hint, arr, empty){
    var late = arr.filter(function(x){ return x.late; }).length;
    return '<div class="card kt-sec"><h2>' + title + ' <span class="kt-c">' + arr.length + '</span>' + (late ? ' <span class="kt-late">' + late + ' late</span>' : '') + '</h2><p class="muted kt-hint">' + hint + '</p>' +
      (arr.length ? '<ul class="kt-list">' + arr.slice(0, 40).map(function(x){ return '<li class="kt-item' + (x.late ? ' late' : '') + '" tabindex="-1" data-k="' + esc(x.id) + '"><div class="kt-t"><b>' + esc(x.t) + '</b><small>' + esc(x.s) + '</small></div><div class="kt-acts">' + acts(x) + '</div></li>'; }).join('') + '</ul>' + (arr.length > 40 ? '<p class="muted kt-hint">+' + (arr.length - 40) + ' more in the tabs.</p>' : '')
        : '<p class="kt-none">' + empty + '</p>') + '</div>';
  }
  function renderToday(){
    if (!D) return; var M = model(), n = M.reply.length + M.call.length + M.cases.length + M.pay.filter(function(x){ return x.k !== 'due'; }).length;
    var badge = $('kt-n'); badge.style.display = n ? 'inline-block' : 'none'; badge.textContent = n;
    if (sec.classList.contains('hide')) return;
    LAST = [].concat(M.reply, M.call, M.cases, M.pay);
    var xr = XR[7], tx = '';
    if (xr && xr.totals) { var d0 = utc(0), tdn = (xr.daily || []).filter(function(x){ return x.d === d0; })[0];
      tx = '<p class="kt-x">X-rays: <b>' + (tdn ? tdn.n : 0) + '</b> sealed today, <b>' + xr.totals.xrays + '</b> in 7 days, ' + xr.totals.checkout + ' opened the checkout, ' + xr.totals.paid + ' became paid cases. <button type="button" class="btn2 kt-a" data-a="xrays">X-ray log</button></p>'; }
    var a = document.activeElement, keep = a && a.closest && a.closest('#t-today .kt-item'); keep = keep && keep.dataset.k;
    sec.innerHTML = '<div class="kt-head"><div><h2 class="kt-h">' + new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) + '</h2><p class="muted" style="margin:2px 0 0">' + (n ? n + ' thing' + (n > 1 ? 's' : '') + ' to do. Late items first.' : 'Nothing waiting. Good moment for outreach.') + ' <span class="kt-keys"><kbd>j</kbd> <kbd>k</kbd> move, <kbd>Enter</kbd> first action</span></p></div></div>' + tx +
      '<div class="kt-grid">' +
      list('Reply to clients', 'Client messages with no answer yet. The portal promises a reply within one working day.', M.reply, 'Nobody is waiting for a reply.') +
      list('Call or email', 'Next actions due, tasks due and fresh leads nobody has contacted (last 72 h, with a phone, a project link or a check request).', M.call, 'No calls or emails due.') +
      list('Cases due', 'Paid cases without a report: overdue, due in 3 days, or ' + STALL + '+ days in the same stage. Site visits the agent submitted.', M.cases, 'No case is due or stuck.') +
      list('Payments to match', 'PayPal payments not matched to a buyer, payments not attached to a case, and client payments to the developer in the next 14 days.', M.pay, 'Every payment is matched.') +
      '</div>';
    if (keep) { var k = sec.querySelector('[data-k="' + keep + '"]'); if (k) k.focus(); }
  }
  function byId(id){ return LAST.filter(function(x){ return x.id === id; })[0]; }
  sec.addEventListener('click', function(e){
    var b = e.target.closest('[data-a]'); if (!b) return; var a = b.dataset.a, x = byId(b.dataset.id) || {};
    if (a === 'xrays') { goTab('xrays'); return; }
    if (a === 'reply' || a === 'inbox') { goTab('inbox'); setTimeout(function(){ var t = document.querySelector('[data-ib="' + x.c.id + '"]'); if (t) { t.click(); setTimeout(function(){ var ta = document.querySelector('#ib-f textarea'); if (ta) ta.focus(); }, 30); } }, 30); return; }
    if (a === 'open' && x.l && window.KBCRM) { KBCRM.open(x.l.id); return; }
    if (a === 'contacted' && x.l && window.KBCRM) { KBCRM.edit([x.l.id], KBCRM.has() ? { status: 'contacted', next_action: '' } : { status: 'contacted' }, 'inline').then(renderToday); return; }
    if ((a === 'snooze1' || a === 'snooze3') && x.l && window.KBCRM) { KBCRM.edit([x.l.id], { next_action: plus(a === 'snooze1' ? 1 : 3) }, 'inline').then(renderToday); return; }
    if (a === 'done' && x.n) { b.disabled = true; var nid = x.n.id;
      adm('note_done', { id: nid, done: true }).then(function(d){ if (d && d.error) { b.disabled = false; toast('Not saved. ' + (A.err ? A.err(d) : d.error), 'bad'); return; }
        x.n.done = true; renderToday(); toast('Task done.', 'ok', { action: 'Undo', onAction: function(){ adm('note_done', { id: nid, done: false }).then(function(r){ if (r && r.error) toast('Undo failed. ' + (A.err ? A.err(r) : r.error), 'bad'); else { x.n.done = false; renderToday(); toast('Task reopened.', 'ok'); } }); } }); }); return; }
    if (a === 'case') { goTab('clients'); setTimeout(function(){ var c = document.querySelector('[data-cs="' + x.c.id + '"]'); if (c) { c.click(); c.scrollIntoView({ block: 'nearest' }); } }, 30); return; }
    if (a === 'board') { goTab('board'); return; }
    if (a === 'ops') { goTab('ops'); return; }
    if (a === 'pay') { goTab('pay'); setTimeout(function(){ var c = $('pe-card') || $('ptab'); if (c) c.scrollIntoView({ block: 'start' }); }, 60); return; }
    if (a === 'cust' && x.u) { goTab('cust'); location.hash = 'c=' + encodeURIComponent(x.u.id); return; }
  });
  document.addEventListener('keydown', function(e){
    if (sec.classList.contains('hide') || e.metaKey || e.ctrlKey || e.altKey || (e.target.closest && e.target.closest('input,textarea,select,[contenteditable="true"]')) || document.querySelector('.kc-modal,.cmdk:not([hidden])')) return;
    var it = [].slice.call(sec.querySelectorAll('.kt-item')); if (!it.length) return;
    var cur = document.activeElement && document.activeElement.closest ? document.activeElement.closest('.kt-item') : null, i = it.indexOf(cur);
    if (e.key === 'j' || e.key === 'k') { e.preventDefault(); var n = e.key === 'j' ? Math.min(it.length - 1, i + 1) : Math.max(0, i < 0 ? 0 : i - 1); it[n].focus(); it[n].scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'Enter' && cur && document.activeElement === cur) { var p = cur.querySelector('[data-primary]'); if (p) { e.preventDefault(); p.click(); } }
  });

  // ---------- X-ray log (panel on the X-rays tab)
  var XD = 30, XQ = '';
  function xpanel(){
    var s = $('t-xrays'); if (!s) return null; var p = $('kt-xr');
    if (!p) { p = document.createElement('div'); p.id = 'kt-xr'; p.className = 'kt-xr'; var body = $('t-xrays-body'); s.insertBefore(p, body || null); }
    return p;
  }
  function yes(v, w){ return v ? '<span class="kt-y">' + w + '</span>' : ''; }
  function xrender(){
    var p = xpanel(); if (!p) return; var d = XR[XD];
    var head = '<div class="kt-xh"><h2>Sealed X-rays</h2><div class="kt-seg" role="group" aria-label="Period">' + [7, 30, 90].map(function(n){ return '<button type="button" data-xd="' + n + '" aria-pressed="' + (n === XD) + '">' + n + ' days</button>'; }).join('') + '</div></div>' +
      '<p class="muted kt-hint">One row per sealed X-ray in kolaboro_xrays. Anonymous: we store the domain and what was pasted, never who ran it. Steps come from the X-ray page (checkout, PayPal, email, watch) and from case notes that link the X-ray.</p>';
    if (!d) { p.innerHTML = head + '<p class="muted" aria-busy="true">Loading…</p>'; return; }
    if (d.error) { p.innerHTML = head + '<div class="kc-empty"><b>' + (d.missing ? 'Needs the database function kolaboro_xray_admin' : 'Could not load the X-ray log') + '</b><span>' + esc(d.missing ? 'Apply claude-ops jobs/crm14_xray_admin.sql. The rest of the admin keeps working.' : (A.err ? A.err(d) : d.error)) + '</span></div>'; return; }
    var T = d.totals || {}, R = d.recent || [], DM = d.domains || [], q = XQ.toLowerCase();
    var pc = function(a, b){ return b ? Math.round(100 * a / b) + '%' : '-'; };
    var k = [['X-rays', T.xrays, 'last ' + XD + ' days, ' + (T.all_time || 0) + ' all time'], ['Domains', T.domains, (T.cards_avg || 0) + ' checks per X-ray on average'], ['Matched a named project', T.named, pc(T.named, T.xrays) + ' of X-rays'], ['Checkout opened', T.checkout, pc(T.checkout, T.xrays) + ' of X-rays'], ['Went to PayPal', T.paypal, pc(T.paypal, T.checkout) + ' of checkouts'], ['Case opened', T.case_opened, 'case notes link the X-ray'], ['Paid case', T.paid, pc(T.paid, T.xrays) + ' of X-rays']];
    var days = {}; (d.daily || []).forEach(function(x){ days[x.d] = x.n; }); var bars = [], mx = 1;
    for (var i = Math.min(XD, 60) - 1; i >= 0; i--) { var dd = utc(-i); bars.push([dd, days[dd] || 0]); mx = Math.max(mx, days[dd] || 0); }
    var dm = DM.filter(function(x){ return !q || (x.domain + ' ' + (x.named || '')).indexOf(q) >= 0; }), rc = R.filter(function(x){ return !q || (x.domain + ' ' + x.q + ' ' + (x.named || '')).toLowerCase().indexOf(q) >= 0; });
    p.innerHTML = head + '<div class="kpis">' + k.map(function(x){ return '<div class="kpi"><span>' + x[0] + '</span><b>' + (x[1] || 0) + '</b><small>' + esc(x[2]) + '</small></div>'; }).join('') + '</div>' +
      '<div class="kt-bars" role="img" aria-label="Sealed X-rays per day">' + bars.map(function(b){ return '<i style="height:' + Math.max(2, Math.round(100 * b[1] / mx)) + '%" title="' + b[0] + ': ' + b[1] + '"></i>'; }).join('') + '</div><p class="muted kt-hint">' + esc(bars[0][0]) + ' to ' + esc(bars[bars.length - 1][0]) + ' (UTC days), ' + mx + ' at most per day</p>' +
      '<div class="row" style="margin:12px 0 4px"><input id="kt-xq" type="search" placeholder="Filter by domain, project or pasted text" value="' + esc(XQ) + '" style="flex:1;min-width:200px" aria-label="Filter X-rays"><button class="btn2" type="button" id="kt-xcsv">Export domains CSV</button></div>' +
      '<h3>Per domain: from X-ray to paid case</h3><div class="tw"><table class="kt-t"><thead><tr><th>Domain</th><th>X-rays</th><th>Last</th><th>Named project</th><th>Checkout</th><th>PayPal</th><th>Leads after</th><th>Cases</th><th>Paid</th><th>X-ray to lead</th><th><span class="bz-sr" style="position:absolute;left:-9999px">Actions</span></th></tr></thead><tbody>' +
      (dm.map(function(x){ return '<tr><td><b>' + esc(x.domain) + '</b></td><td>' + x.n + '</td><td>' + esc(when(x.last)) + '</td><td>' + (x.named ? '<a href="/projects/' + esc(x.named) + '/" target="_blank" rel="noopener">' + esc(x.named) + '</a>' : '<span class="muted">Not in our data</span>') + '</td><td>' + x.checkout + '</td><td>' + x.paypal + '</td><td>' + x.leads + '</td><td>' + x.cases + '</td><td>' + x.paid + '</td><td>' + pc(x.leads, x.n) + '</td><td>' + (x.leads ? '<button type="button" class="btn2 kt-a" data-xl="' + esc(x.domain) + '">Leads</button>' : '') + '</td></tr>'; }).join('') || '<tr><td colspan="11" class="muted">No X-ray in this period' + (q ? ' matches the filter' : '') + '.</td></tr>') + '</tbody></table></div>' +
      '<p class="muted kt-hint">Leads after: forms whose project link contains the domain, sent after its first X-ray (tests excluded). Cases: cases whose project link contains the domain or whose notes link one of its X-rays.</p>' +
      '<h3>Latest X-rays</h3><div class="tw"><table class="kt-t"><thead><tr><th>When</th><th>Domain</th><th>Pasted</th><th>Checks</th><th>Named project</th><th>Steps</th><th>X-ray</th></tr></thead><tbody>' +
      (rc.slice(0, 150).map(function(x){ var stp = yes(x.checkout, 'checkout') + yes(x.paypal, 'PayPal') + yes(x.email_req, 'email') + yes(x.watch, 'watch') + yes(x.case_opened, 'case') + yes(x.paid, 'paid');
        return '<tr><td>' + esc(when(x.at)) + '</td><td>' + esc(x.domain || '-') + '</td><td class="kt-q">' + esc(String(x.q || '').replace(/^https?:\/\/(www\.)?/, '')) + '</td><td>' + x.cards + '</td><td>' + (x.named ? '<a href="/projects/' + esc(x.named) + '/" target="_blank" rel="noopener">' + esc(x.named) + '</a>' : '<span class="muted">-</span>') + '</td><td>' + (stp || '<span class="muted">viewed only</span>') + '</td><td><a href="/x/' + esc(x.root) + '/" target="_blank" rel="noopener">Open</a></td></tr>'; }).join('') || '<tr><td colspan="7" class="muted">No X-ray in this period' + (q ? ' matches the filter' : '') + '.</td></tr>') + '</tbody></table></div>';
    var xq = $('kt-xq'); xq.addEventListener('input', function(){ XQ = xq.value; var pos = xq.selectionStart; xrender(); var n = $('kt-xq'); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} });
    $('kt-xcsv').onclick = function(){ var c = ['domain', 'n', 'first', 'last', 'named', 'cards_avg', 'checkout', 'paypal', 'leads', 'cases', 'paid'], cell = A.csvCell || function(v){ return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; };
      var t = c.join(',') + '\r\n' + dm.map(function(x){ return c.map(function(k){ return cell(x[k]); }).join(','); }).join('\r\n'); if (A.csvSave) A.csvSave('kolaboro-xray-domains', t); };
  }
  function xload(force){ var p = xpanel(); if (!p) return; xrender(); xray(XD, force).then(xrender); }
  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('[data-xd]'); if (b) { XD = +b.dataset.xd; xload(); return; }
    var l = e.target.closest && e.target.closest('[data-xl]'); if (l) { var dom = l.dataset.xl; goTab('crm'); setTimeout(function(){ var q = $('crm-q'); if (q) { q.value = dom; q.dispatchEvent(new Event('input', { bubbles: true })); q.focus(); } }, 40); return; }
    var t = e.target.closest && e.target.closest('nav.tabs button[data-t="xrays"]'); if (t) setTimeout(function(){ xload(); }, 0);
  });

  // ---------- Saved views (filters), per device
  var AREAS = [
    { k: 'crm', name: 'CRM', root: 't-crm', bar: '.crm-top', ids: ['crm-q', 'crm-p', 'crm-s', 'crm-t', 'crm-h'] },
    { k: 'cust', name: 'Customers', root: 't-cust', bar: '.bz-f', ids: ['bz-cq', 'bz-cs', 'bz-cu', 'bz-cf', 'bz-ct', 'bz-ch'] },
    { k: 'leads', name: 'Leads', root: 't-leads', bar: '.card > .row', ids: ['q', 'pf', 'sf'] }
  ];
  function vget(a){ try { var v = JSON.parse(st('kb-views-' + a.k) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function vput(a, v){ st('kb-views-' + a.k, JSON.stringify(v.slice(0, 12))); }
  function vread(a){ var o = {}; a.ids.forEach(function(i){ var e = $(i); if (e) o[i] = e.type === 'checkbox' ? !!e.checked : e.value; }); return o; }
  function vsame(a, o){ var c = vread(a); return a.ids.every(function(i){ return !(i in o) || !(i in c) || String(c[i]) === String(o[i]); }); }
  function vapply(a, o){ a.ids.forEach(function(i){ var e = $(i); if (!e || !(i in o)) return; if (e.type === 'checkbox') e.checked = !!o[i]; else { e.value = o[i]; if (e.tagName === 'SELECT' && e.value !== String(o[i])) e.value = ''; } });
    a.ids.forEach(function(i){ var e = $(i); if (e) { e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); } }); vdraw(a); }
  function vdraw(a){
    var root = $(a.root), bar = root && root.querySelector(a.bar); if (!bar) return;
    var box = root.querySelector('.kt-views[data-v="' + a.k + '"]');
    if (!box) { box = document.createElement('div'); box.className = 'kt-views'; box.dataset.v = a.k; bar.parentNode.insertBefore(box, bar.nextSibling); }
    var V = vget(a);
    box.innerHTML = '<span class="muted">Saved views</span>' + V.map(function(v, i){ var on = vsame(a, v.f); return '<span class="kt-chip' + (on ? ' on' : '') + '"><button type="button" data-va="' + i + '" aria-pressed="' + on + '">' + esc(v.n) + '</button><button type="button" class="kt-cx" data-vd="' + i + '" aria-label="Delete view ' + esc(v.n) + '">×</button></span>'; }).join('') +
      '<button type="button" class="btn2 kt-vs" data-vs="1">Save current filters</button><button type="button" class="btn2 kt-vs" data-vr="1">Clear filters</button>' +
      '<form class="kt-vf" hidden><label class="bz-sr" for="kt-vn-' + a.k + '" style="position:absolute;left:-9999px">View name</label><input id="kt-vn-' + a.k + '" maxlength="40" placeholder="Name, e.g. Bali buyers to call" required><button class="btn2" type="submit">Save</button><button class="btn2" type="button" data-vc="1">Cancel</button></form>';
  }
  function areaOf(el){ var b = el.closest('.kt-views'); return b && AREAS.filter(function(a){ return a.k === b.dataset.v; })[0]; }
  document.addEventListener('click', function(e){
    var t = e.target; if (!t.closest || !t.closest('.kt-views')) return; var a = areaOf(t); if (!a) return; var box = t.closest('.kt-views'), V = vget(a);
    var x = t.closest('[data-va]'); if (x) { var v = V[+x.dataset.va]; if (v) { vapply(a, v.f); toast('View "' + v.n + '" applied.'); } return; }
    x = t.closest('[data-vd]'); if (x) { var i = +x.dataset.vd, gone = V[i]; if (!gone) return; V.splice(i, 1); vput(a, V); vdraw(a); toast('View "' + gone.n + '" deleted.', 'ok', { action: 'Undo', onAction: function(){ var W = vget(a); W.splice(Math.min(i, W.length), 0, gone); vput(a, W); vdraw(a); } }); return; }
    if (t.closest('[data-vs]')) { var f = box.querySelector('.kt-vf'); f.hidden = false; f.querySelector('input').focus(); return; }
    if (t.closest('[data-vc]')) { box.querySelector('.kt-vf').hidden = true; return; }
    if (t.closest('[data-vr]')) { var o = {}; a.ids.forEach(function(i){ var el = $(i); if (el) o[i] = el.type === 'checkbox' ? (/-h$|bz-ch/.test(i) ? true : false) : ''; }); vapply(a, o); return; }
  });
  document.addEventListener('submit', function(e){ var f = e.target; if (!f.classList || !f.classList.contains('kt-vf')) return; e.preventDefault(); var a = areaOf(f); if (!a) return;
    var n = f.querySelector('input').value.trim().slice(0, 40); if (!n) return; var V = vget(a).filter(function(v){ return v.n.toLowerCase() !== n.toLowerCase(); }); V.unshift({ n: n, f: vread(a) }); vput(a, V); vdraw(a); toast('View "' + n + '" saved on this device.', 'ok'); });
  document.addEventListener('input', function(e){ var a = AREAS.filter(function(x){ return x.ids.indexOf(e.target.id) >= 0; })[0]; if (a) { clearTimeout(a.tm); a.tm = setTimeout(function(){ vdraw(a); }, 150); } }, true);
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && e.target.closest && e.target.closest('.kt-vf')) { e.stopPropagation(); e.target.closest('.kt-vf').hidden = true; } }, true);
  var vt = 0; function vsync(){ clearTimeout(vt); vt = setTimeout(function(){ AREAS.forEach(function(a){ var r = $(a.root); if (r && r.querySelector(a.bar) && !r.querySelector('.kt-views[data-v="' + a.k + '"]')) vdraw(a); }); }, 60); }
  if ('MutationObserver' in window) new MutationObserver(vsync).observe(main, { childList: true, subtree: true });

  // ---------- palette providers
  if (window.KBPAL) {
    KBPAL.add(function(){ var out = []; AREAS.forEach(function(a){ vget(a).forEach(function(v){ out.push({ t: 'View: ' + v.n, s: 'Saved view · ' + a.name, k: 'filter saved', go: function(){ goTab(a.k); setTimeout(function(){ vapply(a, v.f); }, 60); } }); }); }); return out; });
    KBPAL.add(function(q){ var d = XR[XD] || XR[7] || XR[30]; if (!q || !d || !d.domains) return []; return d.domains.slice(0, 100).map(function(x){ return { t: x.domain, s: 'X-ray domain · ' + x.n + ' X-ray' + (x.n > 1 ? 's' : '') + (x.named ? ' · ' + x.named : ''), k: 'xray ' + (x.named || ''), go: function(){ goTab('xrays'); XQ = x.domain; setTimeout(xload, 30); } }; }); });
    KBPAL.add(function(q){ if (!q || !D) return []; return model().call.concat(model().cases).slice(0, 30).map(function(x){ return { t: x.t, s: 'Today · ' + x.s, k: 'today due', go: function(){ goTab('today'); setTimeout(function(){ var el = sec.querySelector('[data-k="' + x.id + '"]'); if (el) el.focus(); }, 40); } }; }); });
  }

  // ---------- wiring
  document.addEventListener('kbadm', function(e){ D = e.detail; renderToday(); if (!sec.classList.contains('hide')) extra(); if ($('t-xrays') && !$('t-xrays').classList.contains('hide')) xload(); vsync(); });
  if (A.D) { D = A.D; renderToday(); }
  // open Today first unless another tab was remembered
  setTimeout(function(){ var t = null; try { t = localStorage.getItem('kb-adm-tab'); } catch (e) {} if (!t || t === 'today') { tb.click(); } }, 30);
  tb.addEventListener('click', function(){ try { localStorage.setItem('kb-adm-tab', 'today'); } catch (e) {} });
  var hash = location.hash; if (hash === '#today') setTimeout(function(){ tb.click(); }, 40);
})();
