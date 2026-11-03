// /alerts/: watch a project with Web Push. No account: your browser's push subscription is the only identifier, and it is used only
// to send the alerts you asked for. The message is encrypted for your browser (RFC 8291) before it leaves our server.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var API = '/api/x/j/push/';
  var PID = /^[A-Z]{2,5}-\d{3}$/;
  var state = { open: false, key: null, sub: null };
  function b64uToU8(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function post(path, body) { return fetch(API + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) { return r.json().then(function (j) { j._status = r.status; return j; }); }); }
  function say(t, cls) { var m = $('al-msg'); m.textContent = t; m.className = 'al-msg' + (cls ? ' ' + cls : ''); }
  var supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  var ios = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream, standalone = window.matchMedia && matchMedia('(display-mode: standalone)').matches;

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function preview(id) {
    var box = $('al-proj'); if (!PID.test(id)) { box.hidden = true; return; }
    fetch('/api/open/projects/' + encodeURIComponent(id)).then(function (r) { return r.ok ? r.json() : null; }).then(function (p) {
      p = p && (p.project || p);
      if (!p || !p.id) { box.hidden = false; box.innerHTML = '<p>No tracked project has the id <b>' + esc(id) + '</b>. Ids look like BALI-014 or DXB-041: find them in <a href="/database">the database</a>.</p>'; return; }
      box.hidden = false;
      box.innerHTML = '<p class="al-pid">' + esc(p.id) + '</p><p><b>' + esc(p.market) + (p.region && p.region !== p.market ? ', ' + esc(p.region) : '') + '</b> · ' + esc(p.stage || 'stage not stated') +
        '</p><p>Today: <b>' + esc(p.score) + ' of ' + esc(p.max) + '</b> buyer checks public' + (p.flags ? ', <b class="al-bad">' + esc(p.flags) + ' risk report' + (p.flags > 1 ? 's' : '') + '</b>' : '') + '. <a href="/p/' + esc(p.id) + '">Open the record</a></p>';
    }).catch(function () { box.hidden = true; });
  }

  function subscription() {
    return navigator.serviceWorker.register('/alerts/sw.js', { scope: '/alerts/' }).then(function (reg) {
      return navigator.serviceWorker.ready.then(function () { return reg.pushManager.getSubscription(); }).then(function (s) {
        return s || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uToU8(state.key) });
      });
    });
  }
  function existing() {
    if (!supported) return Promise.resolve(null);
    return navigator.serviceWorker.getRegistration('/alerts/').then(function (reg) { return reg ? reg.pushManager.getSubscription() : null; }).catch(function () { return null; });
  }
  function renderMine(list) {
    var ul = $('al-mine'), wrap = $('al-minewrap');
    wrap.hidden = !list || !list.length; ul.innerHTML = '';
    (list || []).forEach(function (id) {
      var li = document.createElement('li');
      li.innerHTML = '<a href="/p/' + esc(id) + '">' + esc(id) + '</a> <button type="button" class="btn btn-line btn-sm" data-un="' + esc(id) + '">Stop</button>';
      ul.appendChild(li);
    });
  }
  function loadMine() {
    existing().then(function (s) {
      state.sub = s; if (!s || !state.open) return renderMine([]);
      post('mine', { subscription: s.toJSON() }).then(function (j) { renderMine(j.watching || []); }).catch(function () {});
    });
  }

  $('al-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var id = $('al-id').value.trim().toUpperCase();
    if (!PID.test(id)) { say('Enter a project id such as BALI-014.', 'bad'); $('al-id').focus(); return; }
    if (!state.open) { say('Alerts open soon. The sending key is not installed yet, so nothing can be saved today.', 'bad'); return; }
    if (!supported) { say(ios && !standalone ? 'On iPhone and iPad, add kolaboro.com to your Home Screen first (Share, then Add to Home Screen), open it from there, and try again.' : 'This browser cannot receive web push alerts.', 'bad'); return; }
    $('al-go').disabled = true; say('Asking your browser for permission…');
    Notification.requestPermission().then(function (perm) {
      if (perm !== 'granted') throw { msg: 'Notifications are blocked for kolaboro.com. Allow them in the site settings of your browser and try again.' };
      say('Subscribing this device…');
      return subscription();
    }).then(function (s) {
      state.sub = s;
      return post('watch', { subscription: s.toJSON(), project: id });
    }).then(function (j) {
      if (j.error === 'starting' || j.error === 'not_open') throw { msg: 'Alerts open soon: the alerts store is being installed. Nothing was saved.' };
      if (j.error === 'project') throw { msg: 'No tracked project has that id.' };
      if (j.error) throw { msg: 'Could not save the alert (' + j.error + '). Try again later.' };
      say('Done. You are watching ' + id + (j.push_status >= 200 && j.push_status < 300 ? '. A confirmation alert was just sent to this device.' : '.'), 'ok');
      renderMine(j.watching || [id]);
    }).catch(function (x) { say((x && x.msg) || 'Something went wrong. Try again.', 'bad'); }).then(function () { $('al-go').disabled = false; });
  });
  $('al-mine').addEventListener('click', function (e) {
    var id = e.target.getAttribute('data-un'); if (!id || !state.sub) return;
    e.target.disabled = true;
    post('unwatch', { subscription: state.sub.toJSON(), project: id }).then(function (j) { renderMine(j.watching || []); say('Stopped alerts for ' + id + '.', 'ok'); }).catch(function () { e.target.disabled = false; });
  });
  $('al-id').addEventListener('input', function () { var v = this.value.trim().toUpperCase(); if (PID.test(v)) preview(v); else $('al-proj').hidden = true; });

  var q = (new URLSearchParams(location.search).get('id') || '').toUpperCase();
  if (PID.test(q)) { $('al-id').value = q; preview(q); }

  Promise.all([fetch(API + 'key').then(function (r) { return r.json(); }), fetch(API + 'status').then(function (r) { return r.json(); }).catch(function () { return null; })]).then(function (a) {
    var k = a[0], st = a[1];
    state.open = !!k.open; state.key = k.public_key;
    var s = $('al-state');
    if (!state.open) { s.className = 'al-state soon'; s.innerHTML = '<b>Opens soon.</b> Everything is built and tested; the sending key is not installed yet. You can try the form, but nothing is saved until then.'; }
    else if (st && !st.table) { state.open = false; s.className = 'al-state soon'; s.innerHTML = '<b>Opens soon.</b> The sending key is installed; the alerts store is being set up. Nothing is saved until then.'; }
    else { s.className = 'al-state ok'; var x = st && st.stats; s.innerHTML = '<b>Open.</b> ' + (x ? x.devices + ' device' + (x.devices === 1 ? '' : 's') + ' watching ' + x.projects_watched + ' project' + (x.projects_watched === 1 ? '' : 's') + (x.last_run ? '. Last daily check ' + new Date(x.last_run.at).toUTCString().slice(5, 22) + ' UTC: ' + x.last_run.changed + ' changed, ' + x.last_run.sent + ' alert' + (x.last_run.sent === 1 ? '' : 's') + ' sent.' : '. The first daily check has not run yet.') : ''); }
    loadMine();
  }).catch(function () { $('al-state').textContent = 'Could not reach the alerts service.'; });

  fetch(API + 'selftest').then(function (r) { return r.json(); }).then(function (t) {
    $('al-test').innerHTML = (t.rfc8291_appendix_a ? '<b class="al-good">Passes</b>' : '<b class="al-bad">Fails</b>') + ': the server just encrypted the RFC 8291 Appendix A example and got the published ' + t.bytes + ' bytes, byte for byte, in ' + t.ms + ' ms.' +
      (t.vapid_signature_verifies === true ? ' Its VAPID signature verifies with the public key above.' : '');
  }).catch(function () {});
})();
