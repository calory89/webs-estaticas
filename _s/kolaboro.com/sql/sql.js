/* kolaboro.com/sql: SQL over the whole open database, in the browser.
   DuckDB-WASM (pinned, from jsDelivr) loads only when the visitor asks for it. The Parquet files are fetched once; the same bytes are
   hashed for "verify this file" and handed to DuckDB, so what you query is what you verified. */
(function () {
  'use strict';
  var DUCKDB = '1.32.0';
  var DUCKDB_ESM = 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@' + DUCKDB + '/+esm';
  var MANIFEST = '/data/kolaboro.parquet.json', SIGNED = '/api/x/e/parquet-manifest', KEYS = '/.well-known/kolaboro-keys.json';
  var SHOW_ROWS = 500, CSV_ROWS = 100000;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var fmt = function (n) { return Number(n).toLocaleString('en-US'); };
  var man = null, bufs = {}, db = null, conn = null, last = null;

  var EX = [
    ['Projects per market', "SELECT market, country, count(*) AS projects\nFROM projects\nGROUP BY ALL\nORDER BY projects DESC\nLIMIT 20;"],
    ['Share with escrow, by country', "-- deposit_protection: the project publishes an escrow or trust account for buyers' payments\nSELECT country,\n       count(*) AS projects,\n       round(100 * avg(CASE WHEN deposit_protection THEN 1 ELSE 0 END), 1) AS escrow_pct\nFROM projects\nGROUP BY country\nHAVING count(*) >= 5\nORDER BY escrow_pct DESC;"],
    ['Average checks public, by country', "-- six checks: permit, deposit protection, progress, plans, track record, no guaranteed returns\nSELECT country,\n       count(*) AS projects,\n       round(avg(checks_public), 2) AS avg_public,\n       round(avg(checks_confirmed), 2) AS avg_confirmed\nFROM projects\nGROUP BY country\nHAVING count(*) >= 5\nORDER BY avg_public DESC;"],
    ['Most overdue projects', "SELECT id, market, stage, completion_year, overdue_months\nFROM projects\nWHERE overdue_months IS NOT NULL\nORDER BY overdue_months DESC\nLIMIT 20;"],
    ['Developer claims contradicted', "SELECT market,\n       sum(claims_verified) AS verified,\n       sum(claims_unverified) AS unverified,\n       sum(claims_contradicted) AS contradicted,\n       round(100.0 * sum(claims_contradicted) / nullif(sum(claims_verified + claims_unverified + claims_contradicted), 0), 1) AS contradicted_pct\nFROM projects\nGROUP BY market\nHAVING count(*) >= 10\nORDER BY contradicted_pct DESC;"],
    ['Transparency index', "SELECT market, country, projects, transparency_index,\n       permit_public_pct, deposit_protection_pct\nFROM markets\nWHERE transparency_index IS NOT NULL\nORDER BY transparency_index DESC\nLIMIT 25;"],
    ['Verification level per check', "-- how each permit claim was checked: registry, independent, developer (self-declared), contradicted, none\nSELECT level_permit AS level, count(*) AS projects\nFROM projects\nGROUP BY ALL\nORDER BY projects DESC;"]
  ];

  function status(t, cls) { var s = $('sq-status'); s.textContent = t; s.className = 'sq-status' + (cls ? ' sq-' + cls : ''); }

  // ---------- manifest and files
  function loadManifest() {
    return fetch(MANIFEST, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('manifest ' + r.status); return r.json(); }).then(function (m) {
      man = m;
      var p = m.files[0], mk = m.files[1] || { rows: 0, bytes: 0 };
      $('k-rows').textContent = fmt(p.rows); $('k-mk').textContent = fmt(mk.rows);
      $('k-size').textContent = ((p.bytes + mk.bytes) / 1024).toFixed(0) + ' KB';
      $('k-gen').textContent = m.generated.replace('T', ' ').slice(0, 16) + ' UTC';
      var sc = '';
      m.files.forEach(function (f) {
        sc += '<details><summary><b>' + esc(f.table) + '</b> <span class="muted">' + fmt(f.rows) + ' rows, ' + f.columns.length + ' columns, ' + esc(f.description) + '</span></summary><table class="sq-cols"><tbody>' +
          f.columns.map(function (c) { return '<tr><td><code>' + esc(c.name) + '</code></td><td class="muted">' + esc(c.type) + '</td></tr>'; }).join('') + '</tbody></table></details>';
      });
      $('sq-schema').innerHTML = sc;
      return m;
    });
  }
  function file(path) {
    if (bufs[path]) return Promise.resolve(bufs[path]);
    return fetch(path, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(path + ' ' + r.status); return r.arrayBuffer(); }).then(function (b) { bufs[path] = new Uint8Array(b); return bufs[path]; });
  }

  // ---------- DuckDB, lazily
  function start() {
    if (db) return Promise.resolve();
    var t0 = performance.now(), btn = $('sq-load');
    btn.disabled = true; status('Loading DuckDB ' + DUCKDB + ' from jsDelivr…');
    var mod;
    return import(DUCKDB_ESM).then(function (m) {
      mod = m;
      return mod.selectBundle(mod.getJsDelivrBundles());
    }).then(function (bundle) {
      var wurl = URL.createObjectURL(new Blob(['importScripts("' + bundle.mainWorker + '");'], { type: 'text/javascript' }));
      var w = new Worker(wurl), d = new mod.AsyncDuckDB(new mod.VoidLogger(), w);
      return d.instantiate(bundle.mainModule, bundle.pthreadWorker).then(function () { URL.revokeObjectURL(wurl); db = d; });
    }).then(function () {
      status('Downloading the data…');
      return (man ? Promise.resolve(man) : loadManifest());
    }).then(function () {
      return Promise.all(man.files.map(function (f) { return file(f.path).then(function (b) { return db.registerFileBuffer(f.path.split('/').pop(), b.slice()); /* a copy: DuckDB takes ownership of the buffer it gets, ours stays for hashing */ }); }));
    }).then(function () { return db.connect(); }).then(function (c) {
      conn = c;
      return Promise.all(man.files.map(function (f) { return conn.query('CREATE OR REPLACE VIEW ' + f.table + " AS SELECT * FROM read_parquet('" + f.path.split('/').pop() + "')"); }));
    }).then(function () {
      var ms = Math.round(performance.now() - t0);
      status('Ready in ' + fmt(ms) + ' ms. Tables: ' + man.files.map(function (f) { return f.table + ' (' + fmt(f.rows) + ' rows)'; }).join(', ') + '.', 'ok');
      $('sq-load').hidden = true; $('sq-run').disabled = false; $('sq-run').hidden = false;
      $('sq-ed').classList.add('ready');
      return run();
    }).catch(function (e) {
      btn.disabled = false; db = null;
      status('Could not start DuckDB: ' + (e && e.message ? e.message : e) + '. The files are still downloadable below.', 'no');
    });
  }

  function cell(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === 'bigint') return (v <= 9007199254740991n && v >= -9007199254740991n) ? Number(v) : v.toString();
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'object' && typeof v.toJSON === 'function') return v.toJSON();
    if (typeof v === 'object') return JSON.stringify(v, function (k, x) { return typeof x === 'bigint' ? x.toString() : x; });
    return v;
  }
  function run() {
    if (!conn) return start();
    var sql = $('sq-sql').value.trim(); if (!sql) return;
    var btn = $('sq-run'); btn.disabled = true; status('Running…');
    var t0 = performance.now();
    return conn.query(sql).then(function (t) {
      var ms = performance.now() - t0;
      var cols = t.schema.fields.map(function (f) { return f.name; }), n = t.numRows, rows = [];
      var lim = Math.min(n, CSV_ROWS);
      for (var i = 0; i < lim; i++) { var r = t.get(i), o = []; for (var j = 0; j < cols.length; j++) o.push(cell(r ? r[cols[j]] : null)); rows.push(o); }
      last = { cols: cols, rows: rows, total: n };
      render(cols, rows, n);
      status(fmt(n) + ' row' + (n === 1 ? '' : 's') + ' in ' + (ms < 10 ? ms.toFixed(1) : fmt(Math.round(ms))) + ' ms, computed in your browser' + (n > SHOW_ROWS ? ' (first ' + SHOW_ROWS + ' shown, CSV has ' + fmt(lim) + ')' : '') + '.', 'ok');
      $('sq-csv').hidden = !n;
    }).catch(function (e) {
      last = null; $('sq-out').innerHTML = ''; $('sq-csv').hidden = true;
      status(String(e && e.message ? e.message : e).slice(0, 600), 'no');
    }).then(function () { btn.disabled = false; });
  }
  function render(cols, rows, n) {
    var num = cols.map(function (c, j) { return rows.length && rows.slice(0, 50).every(function (r) { return r[j] === null || typeof r[j] === 'number'; }); });
    var h = '<table class="sq-t"><thead><tr>' + cols.map(function (c, j) { return '<th' + (num[j] ? ' class="n"' : '') + '>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
    rows.slice(0, SHOW_ROWS).forEach(function (r) {
      h += '<tr>' + r.map(function (v, j) {
        if (v === null) return '<td class="nul">null</td>';
        var s = typeof v === 'number' && !Number.isInteger(v) ? String(Math.round(v * 10000) / 10000) : String(v);
        if (/^https:\/\/kolaboro\.com\/p\/\?id=[A-Za-z0-9-]+$/.test(s)) return '<td><a href="' + esc(s) + '">' + esc(s.split('=')[1]) + '</a></td>';
        if (cols[j] === 'id' && /^[A-Z]+-\d+$/.test(s)) return '<td><a href="/p/?id=' + esc(s) + '">' + esc(s) + '</a></td>';
        return '<td' + (num[j] ? ' class="n"' : '') + '>' + esc(s) + '</td>';
      }).join('') + '</tr>';
    });
    $('sq-out').innerHTML = n ? h + '</tbody></table>' : '<p class="muted" style="padding:14px">No rows.</p>';
  }
  function csv() {
    if (!last) return;
    var q = function (v) { v = v === null || v === undefined ? '' : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var txt = [last.cols.map(q).join(',')].concat(last.rows.map(function (r) { return r.map(q).join(','); })).join('\r\n') + '\r\n';
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' }));
    a.download = 'kolaboro-query-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-') + '.csv';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  // ---------- verify this file: hash in the browser, check the server's signed manifest
  function step(ul, ok, text) { var li = document.createElement('li'); li.innerHTML = '<span class="' + (ok ? 'sq-ok' : 'sq-no') + '">' + (ok ? 'OK' : 'FAILED') + '</span> ' + text; ul.appendChild(li); return ok; }
  function verify() {
    var btn = $('sq-verify'), ul = $('sq-vsteps'); btn.disabled = true; ul.innerHTML = ''; $('sq-vres').textContent = 'Checking…'; $('sq-vres').className = 'sq-vres';
    var t0 = performance.now(), hashes = {}, signedTxt, sig, kid, sm, all = true;
    (man ? Promise.resolve(man) : loadManifest()).then(function () {
      return Promise.all(man.files.map(function (f) { return file(f.path).then(function (b) { return KV.sha256Hex(b).then(function (h) { hashes[f.path] = h; }); }); }));
    }).then(function () {
      man.files.forEach(function (f) { all = step(ul, true, 'Hashed <code>' + esc(f.path) + '</code> in your browser (' + fmt(bufs[f.path].length) + ' bytes): <code class="h">' + hashes[f.path] + '</code>') && all; });
      return fetch(SIGNED, { cache: 'no-store' });
    }).then(function (r) {
      sig = r.headers.get('x-kolaboro-signature'); kid = r.headers.get('x-kolaboro-key-id');
      return r.text();
    }).then(function (t) {
      signedTxt = t; sm = JSON.parse(t);
      all = step(ul, !!sig, 'The server re-hashed the published files at ' + esc(sm.checked_at || '?') + ' and signed its answer (key <code>' + esc(kid || 'none') + '</code>)') && all;
      return fetch(KEYS).then(function (r) { return r.json(); });
    }).then(function (keys) {
      var k = (keys.keys || []).filter(function (x) { return x.kid === kid; })[0];
      if (!k) { all = step(ul, false, 'Key ' + esc(kid) + ' is not in /.well-known/kolaboro-keys.json'); return false; }
      if (k.status === 'revoked') all = step(ul, false, 'Key ' + esc(kid) + ' is marked revoked') && all;
      return KV.verifySignature(signedTxt, sig, k.public_key_raw_b64).then(function (ok) {
        all = step(ul, ok, 'Ed25519 signature checked in your browser with the published public key (message: <code>kolaboro-sig-v1</code> + SHA-256 of the answer)') && all;
      });
    }).then(function () {
      man.files.forEach(function (f) {
        var s = (sm.files || []).filter(function (x) { return x.path === f.path; })[0] || {};
        all = step(ul, s.sha256_served === hashes[f.path] && s.sha256_expected === hashes[f.path], 'Your hash of <code>' + esc(f.path) + '</code> equals the signed hash' + (s.sha256_served === hashes[f.path] ? '' : ' (signed: <code class="h">' + esc(s.sha256_served || 'missing') + '</code>)')) && all;
      });
      var ms = Math.round(performance.now() - t0);
      $('sq-vres').textContent = all ? 'Verified in ' + fmt(ms) + ' ms: the files you query are byte for byte the ones Kolaboro signed.' : 'Not verified: see the failed step. Do not rely on these files until it passes.';
      $('sq-vres').className = 'sq-vres ' + (all ? 'sq-ok' : 'sq-no');
    }).catch(function (e) {
      $('sq-vres').textContent = 'Could not complete the check: ' + (e && e.message ? e.message : e); $('sq-vres').className = 'sq-vres sq-no';
    }).then(function () { btn.disabled = false; });
  }

  // ---------- wire up
  var ex = $('sq-ex');
  EX.forEach(function (e, i) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'sq-chip'; b.textContent = e[0];
    b.addEventListener('click', function () { $('sq-sql').value = e[1]; if (conn) run(); else if (!$('sq-load').disabled) start().catch(function () {}); });
    ex.appendChild(b);
  });
  $('sq-sql').value = EX[0][1];
  $('sq-load').addEventListener('click', start);
  $('sq-run').addEventListener('click', run);
  $('sq-csv').addEventListener('click', csv);
  $('sq-verify').addEventListener('click', verify);
  $('sq-sql').addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
  });
  loadManifest().catch(function () { status('The dataset manifest could not be loaded. Try again in a minute.', 'no'); });
})();
