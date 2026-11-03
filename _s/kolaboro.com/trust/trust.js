// Trust center: renders /api/x/l/trust (controls with live evidence) and /data/deploys.json (post-deploy guard record).
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (t) { var x = document.createElement('i'); x.textContent = t == null ? '' : String(t); return x.innerHTML; };
  var LBL = { pass: 'Passing', warn: 'Known gap', fail: 'Failing', stale: 'Stale evidence', unknown: 'No evidence' };
  var ICO = { pass: '✓', warn: '!', fail: '✕', stale: '⌛', unknown: '?' };
  function age(h) { if (h == null) return 'no timestamp'; if (h < 1) return Math.max(1, Math.round(h * 60)) + ' min old'; if (h < 48) return Math.round(h) + ' h old'; return Math.round(h / 24) + ' days old'; }
  function when(t) { if (!t) return ''; var d = new Date(t); return isNaN(d) ? '' : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'; }
  function link(u) { var abs = /^https?:/.test(u); return '<a href="' + esc(u) + '"' + (abs ? ' rel="noopener"' : '') + '>' + esc(abs ? u.replace(/^https:\/\/(www\.)?/, '').split('/')[0] : u) + '</a>'; }
  function maxAge(h) { return h >= 48 ? Math.round(h / 24) + ' days' : h + ' h'; }

  fetch('/api/x/l/trust').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
    var s = d.summary || {};
    $('tc-sum').innerHTML = ['pass', 'warn', 'fail', 'stale', 'unknown'].map(function (k) {
      return '<div class="tc-n tc-' + k + '"><b>' + (s[k] || 0) + '</b><span><i aria-hidden="true">' + ICO[k] + '</i> ' + LBL[k] + '</span></div>';
    }).join('');
    $('tc-meta').innerHTML = 'Checked ' + esc(when(d.generated_at)) + ' by commit <code>' + esc(String(d.build || 'unknown').slice(0, 12)) + '</code>. ' + esc(s.controls) + ' controls. Raw, signed: <a href="/api/x/l/trust">/api/x/l/trust</a>';
    $('tc-list').innerHTML = (d.controls || []).map(function (c) {
      return '<article class="tc-c" id="c-' + esc(c.id) + '"><header><span class="tc-pill tc-' + esc(c.status) + '"><i aria-hidden="true">' + ICO[c.status] + '</i> ' + esc(LBL[c.status] || c.status) + '</span>' +
        '<span class="tc-tsc" title="SOC 2 Trust Services Criteria this control maps to (our mapping, not audited)">' + (c.tsc || []).map(esc).join(' · ') + '</span></header>' +
        '<h3>' + esc(c.name) + '</h3><p>' + esc(c.detail) + '</p>' +
        (c.missing && c.missing.length ? '<p class="tc-miss">Without SRI: ' + c.missing.map(esc).join(', ') + '</p>' : '') +
        '<p class="tc-how">' + esc(c.how || '') + '</p>' +
        '<footer><span class="tc-age' + (c.status === 'stale' ? ' tc-old' : '') + '">Evidence ' + esc(age(c.evidence_age_h)) + (c.evidence_at ? ' (' + esc(when(c.evidence_at)) + ')' : '') + ', counts as stale after ' + esc(maxAge(c.max_age_h)) + '</span>' +
        '<span class="tc-ev">Raw evidence: ' + (c.evidence || []).map(link).join(' ') + '</span></footer></article>';
    }).join('');
  }).catch(function () {
    $('tc-meta').textContent = 'The evidence service did not answer just now, so no status is shown. Nothing on this page is cached from an earlier visit. Try again in a minute, or read the raw sources below.';
    $('tc-list').innerHTML = '<ul class="tc-raw"><li><a href="/data/restore.json">/data/restore.json</a></li><li><a href="/api/open/uptime">/api/open/uptime</a></li><li><a href="/api/open/evals">/api/open/evals</a></li><li><a href="/api/open/security">/api/open/security</a></li><li><a href="/data/verifiers.json">/data/verifiers.json</a></li><li><a href="/api/open/checkpoint">/api/open/checkpoint</a></li><li><a href="/data/deploys.json">/data/deploys.json</a></li></ul>';
  });

  fetch('/data/deploys.json', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
    var rows = (d.deploys || []).slice(0, 12), dr = (d.drills || []).slice(0, 5);
    var R = { pass: 'Passed', rolled_back: 'Rolled back', failed: 'Failed, not rolled back', rollback_failed: 'Rollback did not fix it', not_deployed: 'Never went live' };
    $('dp-body').innerHTML = rows.length ? rows.map(function (x) {
      return '<tr><td>' + esc(when(x.at)) + '</td><td><code>' + esc(String(x.commit).slice(0, 12)) + '</code></td><td class="dp-' + esc(x.result) + '">' + esc(R[x.result] || x.result) + '</td><td>' + esc(x.checks_passed) + ' / ' + esc(x.checks_total) + (x.failed && x.failed.length ? '<br><small>' + x.failed.slice(0, 4).map(esc).join(', ') + '</small>' : '') + '</td><td>' + (x.wait_s != null ? esc(x.wait_s) + ' s' : '') + '</td><td>' + (x.run ? '<a href="' + esc(x.run) + '" rel="noopener">run</a>' : '') + '</td></tr>';
    }).join('') : '<tr><td colspan="6">No guarded production deploy recorded yet.</td></tr>';
    $('dp-drills').innerHTML = dr.length ? dr.map(function (x) {
      return '<li><b>' + esc(when(x.at)) + ':</b> ' + esc(x.summary || x.result) + '</li>';
    }).join('') : '<li>No rollback drill recorded yet.</li>';
    $('dp-mode').textContent = d.rollback_mode || '';
  }).catch(function () {
    $('dp-body').innerHTML = '<tr><td colspan="6">Starting: the deploy guard has not published its first record yet.</td></tr>';
    $('dp-drills').innerHTML = '<li>No rollback drill recorded yet.</li>';
  });
})();
