/* Kolaboro project timeline (/timeline/?id=BALI-014), block U6 batch 6.
   Events: /api/x/disc/timeline (reads every public data file for the id) plus approved developer replies from /api/x/i/replies. */
(function () {
  var $ = function (i) { return document.getElementById(i); };
  var COL = { seen: '#17212B', page: '#6D28D9', promise: '#B7791F', register: '#0B7A55', satellite: '#0369A1', delay: '#B42318', hazard: '#9A3412', reply: '#FF5B14' };
  var KINDS = [['seen', 'First seen and checked'], ['page', 'Developer page changes'], ['promise', 'Promises and their status'], ['register', 'Register checks'], ['satellite', 'Satellite readings'], ['delay', 'Delay moves'], ['hazard', 'Hazards read'], ['reply', 'Developer replies']];
  var EMPTY = { seen: 'No first-seen record for this id yet.', page: 'No change to the developer page recorded yet.', promise: 'No dated promise read for this project yet.', register: 'No official register check for this project yet.', satellite: 'No satellite reading for this project yet (only projects with public coordinates are read).', delay: 'No delay move recorded yet.', hazard: 'No hazard reading at this site yet.', reply: 'No developer reply published yet.' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? +m[3] + ' ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][+m[2] - 1] + ' ' + m[1] : esc(s); }
  function iso(s) { var m = /^(\d{4}-\d{2}-\d{2})/.exec(String(s || '')); return m ? m[1] : null; }
  var id = ''; try { id = (new URLSearchParams(location.search).get('id') || '').trim().toUpperCase(); } catch (e) {}
  $('tl-form').addEventListener('submit', function (e) {
    e.preventDefault(); var v = $('tl-id').value.trim().toUpperCase();
    if (!/^[A-Z]{2,5}-\d{3,4}$/.test(v)) { $('tl-err').textContent = 'Type a project id like BALI-014. Ids are on every project file.'; $('tl-id').focus(); return; }
    location.search = '?id=' + encodeURIComponent(v);
  });
  if (!id) { $('tl-id').focus(); $('tl-out').innerHTML = '<p class="muted">Type a project id above, or open one from <a href="/cases">Live cases</a> or the <a href="/map/">world map</a>.</p>'; return; }
  $('tl-id').value = id;
  if (!/^[A-Z]{2,5}-\d{3,4}$/.test(id)) { $('tl-err').textContent = 'That does not look like a project id. Ids look like BALI-014.'; return; }
  $('tl-out').innerHTML = '<p class="muted">Reading every public data file for ' + esc(id) + '.</p>';
  var main = fetch('/api/x/disc/timeline?id=' + encodeURIComponent(id)).then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); });
  var reps = fetch('/api/x/i/replies?id=' + encodeURIComponent(id)).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  Promise.all([main, reps]).then(function (x) {
    var r = x[0];
    if (r.s === 404) { $('tl-out').innerHTML = '<p>No public project with the id ' + esc(id) + '. Check the id on <a href="/cases">Live cases</a>.</p>'; return; }
    if (r.s !== 200) throw new Error('api');
    var j = r.j, E = (j.events || []).slice();
    var R = x[1], replyNote = '';
    if (R && R.ready === false) replyNote = ' Developer replies are not switched on yet.';
    ((R && R.replies) || []).forEach(function (p) {
      if (!p || !p.reply) return;
      var d = iso(p.approved) || iso(p.submitted); if (!d) return;
      E.push({ kind: 'reply', date: d, text: 'Developer reply' + (p.topic ? ' on ' + p.topic : '') + ' published after moderation' + (p.submitted ? ' (sent ' + p.submitted + ')' : ''), src: '/api/x/i/replies?id=' + id, link: '/p/?id=' + id + '#pf-replies' });
    });
    E.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    document.title = 'Timeline of ' + id + ' | Kolaboro';
    $('tl-h').textContent = 'Timeline of ' + id;
    $('tl-lead').innerHTML = 'Anonymous project in ' + esc(j.market) + ', ' + esc(j.country) + '. ' + E.length + ' dated public event' + (E.length === 1 ? '' : 's') + ', newest first. <a href="/p/?id=' + encodeURIComponent(id) + '">Open the project file</a>.';
    var cnt = {}; KINDS.forEach(function (k) { cnt[k[0]] = 0; }); E.forEach(function (e) { cnt[e.kind] = (cnt[e.kind] || 0) + 1; });
    $('tl-sum').innerHTML = KINDS.map(function (k) { return '<a href="#k-' + k[0] + '"' + (cnt[k[0]] ? '' : ' class="z"') + '><i aria-hidden="true" style="width:10px;height:10px;border-radius:50%;background:' + COL[k[0]] + '"></i>' + esc(k[1]) + ' <b>' + cnt[k[0]] + '</b></a>'; }).join('');
    var seenKind = {};
    $('tl-out').innerHTML = E.length ? '<ol class="tl">' + E.map(function (e) {
      var anchor = seenKind[e.kind] ? '' : ' id="k-' + e.kind + '"'; seenKind[e.kind] = 1;
      var k = KINDS.filter(function (x) { return x[0] === e.kind; })[0];
      return '<li' + anchor + ' style="--k:' + COL[e.kind] + '"><time datetime="' + esc(e.date) + '">' + fmt(e.date) + '</time><span class="kd">' + esc(k ? k[1] : e.kind) + '</span>' +
        '<p>' + esc(e.text) + (e.status ? ' <b>Current status: ' + esc(e.status) + '</b>' + (e.status_note ? ' <small>(' + esc(e.status_note) + ')</small>' : '') : '') + '</p>' +
        '<small>Source: <a href="' + esc(e.src) + '">' + esc(e.src) + '</a>' + (e.link ? ' · <a href="' + esc(e.link) + '">details</a>' : '') + '</small></li>';
    }).join('') + '</ol>' : '<p>No dated public event for this project yet.</p>';
    var empty = KINDS.filter(function (k) { return !cnt[k[0]]; });
    $('tl-empty').innerHTML = empty.length ? '<h3>No event of this kind yet</h3><ul>' + empty.map(function (k) { return '<li id="k-' + k[0] + '"><b>' + esc(k[1]) + ':</b> ' + esc(EMPTY[k[0]]) + (k[0] === 'reply' ? esc(replyNote) : '') + '</li>'; }).join('') + '</ul>' : '';
  }).catch(function () {
    $('tl-out').innerHTML = '<p>The timeline could not load just now. Try again in a moment.</p>';
  });
})();
