/* Kolaboro admin: "Requests" tab (n34r, 21 Nov 2026). Service requests from the request form on /book/ and /<lang>/pricing/,
   and field-agent sign-ups from /agents/apply/. Data: rpc kolaboro_admin_requests (same admin key and 2FA check as kolaboro_admin).
   Pipeline: new > contacted > payment sent > paid (manual) > agent assigned > in progress > delivered, or cancelled. */
(function () {
  var A = window.KBADM; if (!A) return;
  var nav = document.querySelector('nav.tabs'), main = document.querySelector('main'); if (!nav || !main) return;
  var ST = [['new', 'New'], ['contacted', 'Contacted'], ['payment_sent', 'Payment sent'], ['paid', 'Paid (manual)'], ['agent_assigned', 'Agent assigned'], ['in_progress', 'In progress'], ['delivered', 'Delivered'], ['cancelled', 'Cancelled']];
  var SV = { check: 'Pre-purchase check €490', visit: 'Site visit', monitoring: 'Monitoring €99/mo', handover: 'Handover inspection', add: 'Add and check a project (free)' };
  var SL = {}; ST.forEach(function (s) { SL[s[0]] = s[1]; });
  var R = [], AG = [], SEL = null, loaded = false, busy = false;
  function $(i) { return document.getElementById(i); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function when(t) { if (!t) return ''; var d = new Date(t); return isNaN(d) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + d.toTimeString().slice(0, 5); }
  function toast(m, bad) { if (window.KBUI && KBUI.toast) KBUI.toast(m, bad ? 'bad' : 'ok'); else if (bad) alert(m); }
  var css = document.createElement('style');
  css.textContent = '.rq-f{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.rq-f input[type=search]{flex:1;min-width:200px}.rq-f label{display:flex;gap:6px;align-items:center;font-size:.9rem}' +
    '.rq-wrap{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:14px;align-items:start}@media(max-width:900px){.rq-wrap{grid-template-columns:minmax(0,1fr)}}' +
    '.rq-i{display:block;width:100%;text-align:left;border:1px solid var(--line);background:#fff;border-radius:12px;padding:10px 12px;margin-top:8px;cursor:pointer;font:inherit;color:inherit}.rq-i.on{border-color:var(--ink);box-shadow:inset 0 0 0 1px var(--ink)}.rq-i small{color:var(--muted)}' +
    '.rq-s{display:inline-block;border-radius:999px;padding:2px 8px;font-size:.72rem;font-weight:800;text-transform:uppercase;background:#EEE}.rq-s.new{background:#FF5B14;color:#111}.rq-s.paid,.rq-s.delivered{background:#1E9E6A;color:#fff}.rq-s.cancelled{background:#FDE2D6}.rq-s.payment_sent{background:#FFF0C7}.rq-s.agent_assigned,.rq-s.in_progress{background:#E3E8FF}.rq-t{background:#FFF0C7;border-radius:999px;padding:2px 8px;font-size:.72rem;font-weight:800}' +
    '.rq-pipe{display:flex;gap:3px;margin-top:6px}.rq-pipe i{flex:1;height:4px;border-radius:3px;background:#E6E4DD}.rq-pipe i.d{background:#1E9E6A}.rq-pipe i.n{background:#FF5B14}.rq-pipe.x i{background:#E9B9A9}' +
    '.rq-kv{display:grid;grid-template-columns:150px minmax(0,1fr);gap:4px 10px;font-size:.92rem;margin:10px 0}.rq-kv b{color:var(--muted);font-weight:700}.rq-kv span{overflow-wrap:anywhere}' +
    '.rq-g{display:grid;grid-template-columns:1fr 1fr;gap:10px}.rq-g label{font-size:.8rem;font-weight:700;display:block}.rq-g input,.rq-g select,.rq-g textarea{width:100%;margin-top:3px}@media(max-width:640px){.rq-g,.rq-kv{grid-template-columns:minmax(0,1fr)}}' +
    '.rq-msg{background:#F2F1EC;border-radius:10px;padding:10px;white-space:pre-wrap;overflow-wrap:anywhere}.rq-h{font-size:.85rem;padding-left:18px}.rq-h li{margin:2px 0}';
  document.head.appendChild(css);
  var b = document.createElement('button'); b.type = 'button'; b.dataset.t = 'requests'; b.innerHTML = 'Requests <span id="rqn" class="pill" style="background:#FF5B14;color:#111;display:none"></span>';
  nav.insertBefore(b, nav.children[1] || null);
  var s = document.createElement('section'); s.id = 't-requests'; s.className = 'hide'; s.setAttribute('aria-label', 'Requests');
  s.innerHTML = '<div class="kpis" id="rqk"></div>' +
    '<div class="card"><div class="rq-f"><input type="search" id="rqq" placeholder="Search name, email, project, reference…" aria-label="Search requests">' +
    '<select id="rqs" aria-label="Status"><option value="">All statuses</option><option value="open">Open (not delivered or cancelled)</option>' + ST.map(function (x) { return '<option value="' + x[0] + '">' + x[1] + '</option>'; }).join('') + '</select>' +
    '<select id="rqv" aria-label="Service"><option value="">All services</option>' + Object.keys(SV).map(function (k) { return '<option value="' + k + '">' + SV[k] + '</option>'; }).join('') + '</select>' +
    '<label><input type="checkbox" id="rqt"> Show tests</label><button class="btn2" id="rqcsv" type="button">Export CSV</button><button class="btn2" id="rqr" type="button">Refresh</button></div>' +
    '<p class="muted" style="margin:8px 0 0;font-size:.85rem">Every request also arrives by email at <b id="rqto">carlos@kolaboro.com</b>. Payment is manual: send the PayPal link by email once an agent is confirmed, then set "Paid (manual)".</p></div>' +
    '<div class="rq-wrap"><div class="card" style="margin-top:14px"><h2>Service requests</h2><div id="rql"><p class="muted">Loading…</p></div></div>' +
    '<div class="card" style="margin-top:14px" id="rqd"><div class="kc-empty"><b>No request selected</b><span>Pick a request on the left.</span></div></div></div>' +
    '<div class="card"><h2>Field agent sign-ups (/agents/apply/)</h2><p class="muted" style="margin-top:0;font-size:.85rem">Each new sign-up also sends an email. Review photos, exam and test visit in the Agents tab.</p><div class="tw"><table id="rqa"></table></div></div>';
  main.insertBefore(s, main.children[1] || null);
  nav.addEventListener('click', function (e) {
    var t = e.target.closest('button[data-t]'); if (!t) return;
    if (t.dataset.t === 'requests') {
      document.querySelectorAll('nav.tabs button').forEach(function (x) { x.classList.toggle('on', x === t); });
      document.querySelectorAll('main > section').forEach(function (x) { x.classList.toggle('hide', x.id !== 't-requests'); });
      if (location.hash !== '#requests') history.replaceState(null, '', '#requests');
      load();
    } else { s.classList.add('hide'); }
  });
  function call(action, payload) { return A.rpc('kolaboro_admin_requests', { p_key: A.pw(), p_action: action || 'list', p_payload: payload || {} }); }
  function load(force) {
    if (!A.pw() || busy || (loaded && !force && Date.now() - loaded < 20000)) { render(); return Promise.resolve(); }
    busy = true;
    return call('list').then(function (d) { busy = false; if (!d || d.error) { $('rql').innerHTML = '<p class="muted">' + esc(A.err(d) || 'Could not load requests.') + '</p>'; return; } take(d); });
  }
  function take(d) { R = d.requests || []; AG = d.agents || []; loaded = Date.now(); if (d.notify_to) $('rqto').textContent = d.notify_to; render(); }
  function act(action, payload, okMsg) {
    return call(action, payload).then(function (d) { if (!d || d.error) { toast('Not saved. ' + (A.err(d) || ''), true); return; } take(d); toast(okMsg || 'Saved'); });
  }
  function rows() {
    var q = ($('rqq').value || '').toLowerCase(), st = $('rqs').value, sv = $('rqv').value, tests = $('rqt').checked;
    return R.filter(function (r) {
      return (tests || !r.is_test) && (!sv || r.service === sv) && (!st || (st === 'open' ? ['delivered', 'cancelled'].indexOf(r.status) < 0 : r.status === st)) &&
        (!q || [r.ref, r.name, r.email, r.phone, r.project, r.project_slug, r.country, r.message, r.agent].join(' ').toLowerCase().indexOf(q) >= 0);
    });
  }
  function pipe(st) { var i = ST.map(function (x) { return x[0]; }).indexOf(st), x = st === 'cancelled'; return '<div class="rq-pipe' + (x ? ' x' : '') + '">' + ST.slice(0, 7).map(function (_, k) { return '<i class="' + (x ? '' : k < i ? 'd' : k === i ? 'n' : '') + '"></i>'; }).join('') + '</div>'; }
  function render() {
    if (!$('rql')) return;
    var real = R.filter(function (r) { return !r.is_test; }), n = function (f) { return real.filter(f).length; };
    var nw = n(function (r) { return r.status === 'new'; });
    $('rqn').style.display = nw ? 'inline-block' : 'none'; $('rqn').textContent = nw;
    $('rqk').innerHTML = [['New', nw], ['Open', n(function (r) { return ['delivered', 'cancelled'].indexOf(r.status) < 0; })], ['Waiting for payment', n(function (r) { return r.status === 'payment_sent'; })], ['Paid', n(function (r) { return r.paid; })], ['Delivered', n(function (r) { return r.status === 'delivered'; })], ['Agent sign-ups', AG.length]]
      .map(function (k) { return '<div class="kpi"><span>' + k[0] + '</span><b>' + k[1] + '</b></div>'; }).join('');
    var L = rows();
    $('rql').innerHTML = L.map(function (r) {
      return '<button type="button" class="rq-i' + (SEL === r.id ? ' on' : '') + '" data-rq="' + esc(r.id) + '"><span class="rq-s ' + esc(r.status) + '">' + esc(SL[r.status] || r.status) + '</span> ' + (r.is_test ? '<span class="rq-t">TEST</span> ' : '') + '<b>' + esc(r.project || r.project_slug || r.country || r.ref) + '</b><br><small>' + esc(r.ref) + ' · ' + esc(SV[r.service] || r.service) + ' · ' + esc(r.name) + ' · ' + esc(when(r.created_at)) + (r.agent ? ' · agent: ' + esc(r.agent) : '') + '</small>' + pipe(r.status) + '</button>';
    }).join('') || '<p class="muted">' + (R.length ? 'No request matches the filters.' : 'No requests yet. They arrive from the request form on kolaboro.com/book/ and the pricing pages.') + '</p>';
    $('rql').querySelectorAll('[data-rq]').forEach(function (x) { x.onclick = function () { SEL = x.dataset.rq; render(); var d = $('rqd'); if (d && window.innerWidth < 900) d.scrollIntoView({ block: 'start' }); }; });
    $('rqa').innerHTML = '<tr><th>Joined</th><th>Name / email</th><th>City</th><th>Status</th><th>Languages</th><th>Phone</th></tr>' + (AG.map(function (a) {
      var wa = String(a.phone || '').replace(/[^\d]/g, '');
      return '<tr><td>' + esc(when(a.since)) + '</td><td><b>' + esc(a.name) + '</b><br><a href="mailto:' + esc(a.email) + '">' + esc(a.email) + '</a></td><td>' + esc([a.city, a.area].filter(Boolean).join(' · ')) + '</td><td>' + esc(a.status) + '</td><td>' + esc(a.languages) + '</td><td>' + (wa ? '<a target="_blank" rel="noopener" href="https://wa.me/' + wa + '">' + esc(a.phone) + '</a>' : '') + '</td></tr>';
    }).join('') || '<tr><td colspan="6" class="muted">No agent sign-ups yet. They arrive from kolaboro.com/agents/apply/.</td></tr>');
    detail();
  }
  function detail() {
    var r = R.filter(function (x) { return x.id === SEL; })[0], D = $('rqd'); if (!r) return;
    var agl = '<datalist id="rqagl">' + AG.map(function (a) { return '<option value="' + esc(a.name + ' (' + (a.city || '') + ')') + '">'; }).join('') + '</datalist>';
    D.innerHTML = '<div class="row"><div style="flex:1"><span class="muted">' + esc(r.ref) + ' · received ' + esc(when(r.created_at)) + '</span><h2 style="margin:2px 0">' + esc(r.project || r.project_slug || r.ref) + '</h2>' +
      '<span class="rq-s ' + esc(r.status) + '">' + esc(SL[r.status]) + '</span> ' + (r.is_test ? '<span class="rq-t">TEST</span>' : '') + (r.paid ? ' <span class="rq-s paid">paid</span>' : '') + '</div>' +
      '<a class="btn2" href="mailto:' + esc(r.email) + '?subject=' + encodeURIComponent('Your Kolaboro request ' + r.ref) + '">Email buyer</a></div>' +
      '<div class="rq-kv"><b>Service</b><span>' + esc(SV[r.service] || r.service) + '</span><b>Project</b><span>' + esc(r.project || '-') + (r.project_slug ? ' · <a target="_blank" rel="noopener" href="/projects/' + encodeURIComponent(r.project_slug) + '/">project page</a>' : '') + '</span>' +
      '<b>Country / market</b><span>' + esc(r.country || '-') + '</span><b>Buyer</b><span>' + esc(r.name) + ' · <a href="mailto:' + esc(r.email) + '">' + esc(r.email) + '</a>' + (r.phone ? ' · ' + esc(r.phone) + (String(r.phone).replace(/[^\d]/g, '').length > 6 ? ' (<a target="_blank" rel="noopener" href="https://wa.me/' + String(r.phone).replace(/[^\d]/g, '') + '">WhatsApp</a>)' : '') : '') + '</span>' +
      '<b>Language</b><span>' + esc(r.lang) + '</span><b>From page</b><span>' + esc(r.page || '-') + '</span><b>Consent</b><span>' + esc(when(r.consent_at)) + '</span>' +
      (r.paid ? '<b>Payment</b><span>' + esc([r.paid_currency, r.paid_amount].filter(Boolean).join(' ') || 'received') + (r.paid_ref ? ' · ' + esc(r.paid_ref) : '') + ' · ' + esc(when(r.paid_at)) + '</span>' : '') + '</div>' +
      (r.message ? '<div class="rq-msg">' + esc(r.message) + '</div>' : '') +
      '<form id="rqfs" class="rq-g" style="margin-top:12px"><label>Status<select name="status">' + ST.map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === r.status ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></label>' +
      '<label>Agent (free text or pick a signed-up agent)<input name="agent" list="rqagl" value="' + esc(r.agent || '') + '" maxlength="200"></label>' + agl +
      '<label><span style="display:flex;gap:6px;align-items:center"><input type="checkbox" name="is_test" style="width:auto"' + (r.is_test ? ' checked' : '') + '> Test request (hidden from counts)</span></label><div style="align-self:end"><button class="btn">Save</button></div></form>' +
      '<details style="margin-top:12px"' + (r.paid ? '' : ' open') + '><summary><b>' + (r.paid ? 'Payment received (manual)' : 'Mark payment received (manual)') + '</b></summary><form id="rqfp" class="rq-g" style="margin-top:8px">' +
      '<label>Amount<input name="paid_amount" type="number" step="0.01" min="0" value="' + esc(r.paid_amount != null ? r.paid_amount : (r.service === 'check' ? 490 : r.service === 'monitoring' ? 99 : '')) + '"></label>' +
      '<label>Currency<select name="paid_currency">' + ['EUR', 'USD'].map(function (c) { return '<option' + (c === (r.paid_currency || 'EUR') ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></label>' +
      '<label style="grid-column:1/-1">PayPal transaction ID or note<input name="paid_ref" maxlength="120" value="' + esc(r.paid_ref || '') + '"></label>' +
      '<div style="grid-column:1/-1" class="row"><button class="btn">' + (r.paid ? 'Update payment' : 'Payment received') + '</button>' + (r.paid ? '<button class="btn2" type="button" id="rqunpay">Undo: not paid</button>' : '') + '</div></form></details>' +
      '<h3 style="margin:16px 0 4px">Notes</h3>' + ((r.notes || []).length ? '<ul class="rq-h">' + r.notes.map(function (n) { return '<li><small class="muted">' + esc(when(n.at)) + '</small> ' + esc(n.text) + '</li>'; }).join('') + '</ul>' : '<p class="muted" style="margin:0">No notes yet.</p>') +
      '<form id="rqfn" class="row" style="margin-top:6px"><textarea name="text" rows="2" style="flex:1;min-width:200px" placeholder="e.g. Agent in Canggu confirmed by WhatsApp; PayPal link sent" maxlength="2000"></textarea><button class="btn">Add note</button></form>' +
      '<details style="margin-top:12px"><summary>History (' + (r.history || []).length + ')</summary><ul class="rq-h">' + (r.history || []).map(function (h) { return '<li>' + esc(when(h.at)) + ' · ' + esc(SL[h.status] || h.status) + ' · ' + esc(h.by) + '</li>'; }).join('') + '</ul></details>';
    $('rqfs').onsubmit = function (e) { e.preventDefault(); var f = e.target.elements; act('set', { id: r.id, status: f.status.value, agent: f.agent.value, is_test: f.is_test.checked }); };
    $('rqfp').onsubmit = function (e) { e.preventDefault(); var f = e.target.elements; act('set', { id: r.id, paid: true, status: ['new', 'contacted', 'payment_sent'].indexOf(r.status) >= 0 ? 'paid' : r.status, paid_amount: f.paid_amount.value, paid_currency: f.paid_currency.value, paid_ref: f.paid_ref.value }, 'Payment recorded'); };
    if ($('rqunpay')) $('rqunpay').onclick = function () { if (confirm('Mark this request as not paid?')) act('set', { id: r.id, paid: false, status: r.status === 'paid' ? 'payment_sent' : r.status }); };
    $('rqfn').onsubmit = function (e) { e.preventDefault(); var t = e.target.elements.text.value.trim(); if (t) act('note', { id: r.id, text: t }, 'Note added'); };
  }
  ['rqq', 'rqs', 'rqv', 'rqt'].forEach(function (i) { $(i).addEventListener('input', render); $(i).addEventListener('change', render); });
  $('rqr').onclick = function () { load(true); };
  $('rqcsv').onclick = function () {
    var c = ['ref', 'created_at', 'status', 'service', 'project', 'project_slug', 'country', 'name', 'email', 'phone', 'lang', 'message', 'agent', 'paid', 'paid_at', 'paid_amount', 'paid_currency', 'paid_ref', 'is_test', 'page', 'consent_at', 'updated_at'];
    var cell = A.csvCell || function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; };
    var t = c.join(',') + '\r\n' + rows().map(function (r) { return c.map(function (k) { return cell(r[k]); }).join(','); }).join('\r\n');
    if (A.csvSave) A.csvSave('kolaboro-requests', t);
  };
  document.addEventListener('kbadm', function () { load(true).then(function () { if (location.hash === '#requests') b.click(); }); });
  if (A.D && A.pw()) load(true);
})();
