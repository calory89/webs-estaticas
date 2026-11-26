// /benchmark/: leaderboard built in your browser from the published runs. Nothing is typed in by hand: each model row is read
// from /data/benchmark/<model>.json (one signed answer per case, re-verified here with Ed25519), the production row from
// /api/open/evals (the latest daily evaluation). A model we did not run has no row.
(function () {
  var KEY = 'rnY6UvDI+L6e8j3a+UPwmddQJFapkfmEXWwHuXzdmzw=';
  var RUNS = [{ id: 'haiku', name: 'Claude Haiku 5.5 alone', model: 'claude-haiku-5-5' }, { id: 'sonnet', name: 'Claude Sonnet 5.5 alone', model: 'claude-sonnet-5-5' }];
  var KINDS = { extraction: 'Extraction', injection: 'Injection', not_property: 'Not property', false_positive: 'False alarm' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function put(id, h) { var e = document.getElementById(id); if (e) e.innerHTML = h; }
  function getJ(u) { return fetch(u, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function day(t) { return String(t || '').slice(0, 10); }
  function byKind(rows) { var k = {}; rows.forEach(function (r) { var x = k[r.kind] || (k[r.kind] = { passed: 0, total: 0 }); x.total++; if (r.pass) x.passed++; }); return k; }
  Promise.all([getJ('/open/evals/cases.json'), getJ('/api/open/evals')].concat(RUNS.map(function (r) { return getJ('/data/benchmark/' + r.id + '.json'); }))).then(function (a) {
    var spec = a[0] || { cases: [] }, ev = a[1], runs = a.slice(2), systems = [], kindsOf = {};
    spec.cases.forEach(function (c) { kindsOf[c.id] = c.kind; });
    var sigChecks = [];
    RUNS.forEach(function (R, i) {
      var d = runs[i]; if (!d || !Array.isArray(d.cases)) { systems.push({ name: R.name, missing: true }); return; }
      var rows = [], sigs = [];
      d.cases.forEach(function (e) {
        if (!e.body) { rows.push({ id: e.case, kind: kindsOf[e.case], pass: false, error: 'no answer' }); return; }
        var b = JSON.parse(e.body); rows.push({ id: b.case, kind: b.kind, pass: b.pass, checks_passed: b.checks_passed, checks_total: b.checks_total, failed: b.checks.filter(function (k) { return !k.ok; }).map(function (k) { return k.field + ' ' + k.op; }), error: b.error, models: b.models_answered, usd: b.usd_estimated, tokens: b.tokens });
        if (window.KV && e.signature) sigs.push(KV.verifySignature(e.body, e.signature, KEY));
      });
      var S = { id: R.id, name: R.name, kind: 'One model, forced through the production desk review', rows: rows, run: d, date: day(d.started), usd: d.usd_estimated, sig: Promise.all(sigs).then(function (v) { return { ok: v.filter(Boolean).length, total: d.cases.length }; }) };
      systems.push(S);
    });
    var L = ev && ev.latest;
    if (L && Array.isArray(L.results)) systems.push({ id: 'prod', name: 'Production pipeline', kind: (L.models || []).join(' + ') + ': two readers, consensus, quote check (daily run)', rows: L.results.map(function (r) { return { id: r.id, kind: r.kind, pass: r.pass, checks_passed: r.checks.filter(function (k) { return k.ok; }).length, checks_total: r.checks.length, failed: r.checks.filter(function (k) { return !k.ok; }).map(function (k) { return k.field + ' ' + k.op; }), error: r.error }; }), date: day(L.run_at), usd: null, prod: true });
    var ran = systems.filter(function (s) { return !s.missing; });
    ran.forEach(function (s) {
      s.cp = s.rows.filter(function (r) { return r.pass; }).length; s.ct = s.rows.length;
      s.kp = s.rows.reduce(function (x, r) { return x + (r.checks_passed || 0); }, 0); s.kt = s.rows.reduce(function (x, r) { return x + (r.checks_total || 0); }, 0);
      s.k = byKind(s.rows);
    });
    ran.sort(function (x, y) { return (y.cp / y.ct) - (x.cp / x.ct) || (y.kp / y.kt) - (x.kp / x.kt); });
    var kinds = Object.keys(KINDS);
    put('bm-board', '<div class="bm-scroll" tabindex="0" role="region" aria-label="Leaderboard"><table class="bm-t"><thead><tr><th>#</th><th>System</th><th>Cases passed</th><th>Checks passed</th>' + kinds.map(function (k) { return '<th>' + KINDS[k] + '</th>'; }).join('') + '<th>Cost (est.)</th><th>Run</th><th>Evidence</th></tr></thead><tbody>' +
      ran.map(function (s, i) {
        return '<tr><td>' + (i + 1) + '</td><td><b>' + esc(s.name) + '</b><br><small>' + esc(s.kind) + '</small></td><td><b>' + s.cp + '/' + s.ct + '</b></td><td>' + s.kp + '/' + s.kt + ' <small>(' + (s.kt ? Math.round(s.kp / s.kt * 1000) / 10 : 0) + '%)</small></td>' +
          kinds.map(function (k) { var x = s.k[k]; return '<td>' + (x ? x.passed + '/' + x.total : '') + '</td>'; }).join('') +
          '<td>' + (s.usd != null ? 'US$' + s.usd.toFixed(2) : '<small>not split out</small>') + '</td><td>' + esc(s.date) + '</td><td id="bm-ev-' + (s.id || i) + '">' + (s.prod ? '<a href="/api/open/evals">daily evaluation</a>' : (s.run && s.run.run_url ? '<small>signed answers, checking…</small>' : '')) + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      (systems.some(function (s) { return s.missing; }) ? '<p class="bm-note">Not run yet: ' + systems.filter(function (s) { return s.missing; }).map(function (s) { return esc(s.name); }).join(', ') + '. A model gets a row only after we actually run it.</p>' : ''));
    ran.forEach(function (s) {
      if (!s.sig) return;
      s.sig.then(function (v) { put('bm-ev-' + s.id, '<span class="bm-ok' + (v.ok === v.total ? '' : ' bm-bad') + '">' + v.ok + '/' + v.total + ' signatures valid</span><br><a href="/data/benchmark/' + s.id + '.json">raw answers</a>'); });
    });
    // per case matrix
    put('bm-cases', '<div class="bm-scroll" tabindex="0" role="region" aria-label="Results per case"><table class="bm-t"><thead><tr><th>Case</th><th>Kind</th>' + ran.map(function (s) { return '<th>' + esc(s.name.replace(' alone', '').replace('Claude ', '')) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      spec.cases.map(function (c) {
        return '<tr><td><a href="/open/evals/fixtures/' + esc(c.id) + '.html">' + esc(c.id) + '</a></td><td>' + esc(KINDS[c.kind] || c.kind) + '</td>' + ran.map(function (s) {
          var r = s.rows.filter(function (x) { return x.id === c.id; })[0];
          if (!r) return '<td>no answer</td>';
          return '<td><span class="bm-ok' + (r.pass ? '' : ' bm-bad') + '">' + (r.pass ? 'pass' : 'fail') + '</span> <small>' + (r.checks_total ? r.checks_passed + '/' + r.checks_total : '') + '</small>' + (!r.pass && (r.failed || []).length ? '<br><small>failed: ' + esc(r.failed.slice(0, 3).join(', ')) + '</small>' : '') + (r.error ? '<br><small>' + esc(String(r.error).slice(0, 80)) + '</small>' : '') + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>');
    var fx = ran.filter(function (s) { return s.run; }).map(function (s) { var b = s.run.cases && s.run.cases[0] && s.run.cases[0].body ? JSON.parse(s.run.cases[0].body) : null; return b ? esc(s.name) + ': cases file SHA-256 <span class="bm-h">' + esc(b.cases_sha256.slice(0, 16)) + '…</span>, code ' + esc(String(b.code_commit || '').slice(0, 8)) : ''; }).filter(Boolean);
    var bn = document.getElementById('bm-n'); if (bn) bn.textContent = spec.cases.length;
    put('bm-meta', 'Evaluation set version ' + esc(spec.version) + ', ' + spec.cases.length + ' cases' + (fx.length ? '. ' + fx.join('; ') : '') + (L ? '. Production row: daily run of ' + esc(day(L.run_at)) + '.' : '.'));
  });
})();
