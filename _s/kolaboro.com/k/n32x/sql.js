/* kolaboro.com /data/sql/ (n32x, batch 32): SQL over the open dataset in the browser. DuckDB-WASM (pinned, jsDelivr) loads only on click;
   the three Parquet files are fetched once, hashed with SHA-256 and compared with the data card, then registered with DuckDB.
   A query is shareable: #q=<base64url of the SQL> (the URL fragment never reaches a server). */
(function () {
  'use strict';
  var DUCKDB = '1.32.0', ESM = 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@' + DUCKDB + '/+esm', SHOW = 500, CSVMAX = 100000;
  var A = document.getElementById('n32-app'); if (!A) return;
  var M = JSON.parse(document.getElementById('n32-t').textContent), L = M._loc || 'en-GB';
  var EX = [
    "SELECT market, country, count(*) AS projects,\n       count(*) FILTER (WHERE handover_month < strftime(current_date, '%Y-%m') AND stage <> 'completed') AS overdue\nFROM projects\nGROUP BY ALL ORDER BY projects DESC LIMIT 20;",
    "SELECT market, sum(claims) AS claims, sum(claims_contradicted) AS contradicted,\n       round(100.0 * sum(claims_contradicted) / nullif(sum(claims), 0), 1) AS pct\nFROM projects GROUP BY market HAVING sum(claims) >= 50\nORDER BY pct DESC LIMIT 20;",
    "SELECT name, developer, handover_on_record, dld_completion_date, dld_percent_built,\n       date_diff('month', strptime(handover_month || '-01', '%Y-%m-%d'), CAST(dld_completion_date AS DATE)) AS months_apart\nFROM projects\nWHERE dld_completion_date IS NOT NULL AND handover_month IS NOT NULL\nORDER BY abs(months_apart) DESC LIMIT 25;",
    "SELECT escrow_bank, count(*) AS projects, round(avg(dld_percent_built), 1) AS avg_pct_built\nFROM projects WHERE escrow_bank IS NOT NULL\nGROUP BY ALL ORDER BY projects DESC;",
    "SELECT market, count(*) AS n, round(median(price_per_m2_min)) AS median_usd_per_m2\nFROM projects WHERE currency = 'USD' AND price_per_m2_min IS NOT NULL\nGROUP BY market HAVING count(*) >= 5 ORDER BY median_usd_per_m2 DESC;",
    "SELECT p.name, p.market, c.status, c.claim, c.source\nFROM claims c JOIN projects p ON p.id = c.project_id\nWHERE c.claim ILIKE '%guarantee%'\nORDER BY c.status, p.market LIMIT 50;"
  ];
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var fill = function (s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); };
  var nf = function (n) { try { return new Intl.NumberFormat(L, { numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
  var b64 = function (s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  var unb64 = function (s) { try { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return decodeURIComponent(escape(atob(s))); } catch (e) { return null; } };
  var css = '<style>.sq-ed{display:grid;gap:8px}.sq-ed textarea{width:100%;min-height:150px;font:13px/1.45 ui-monospace,Menlo,monospace;direction:ltr;text-align:left}.sq-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.sq-ex{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px;padding:0;list-style:none}.sq-ex button{font-size:.9rem}.sq-st{font-size:.92rem;color:var(--muted,#59626B);margin:6px 0}.sq-st.ok{color:#0B7A55}.sq-st.no{color:#B42318}.sq-out{overflow:auto;max-height:520px;border:1px solid var(--line,#d5d3cc);border-radius:10px;margin-top:8px}.sq-out table{font-size:.85rem;min-width:0;direction:ltr}.sq-out td.n{text-align:right;font-variant-numeric:tabular-nums}.sq-out td.nul{color:var(--muted,#888)}:root[data-theme=dark] .sq-st.ok{color:#4BE3A4}</style>';
  var h = css + '<p class="k-xs">' + esc(M.local) + '</p><p><b>' + esc(M.ex) + '</b></p><ul class="sq-ex">' + M.exs.map(function (x, i) { return '<li><button type="button" class="kbtn" data-ex="' + i + '">' + esc(x) + '</button></li>'; }).join('') + '</ul>' +
    '<div class="sq-ed"><label for="sq-sql" class="k-xs">' + esc(M.q) + '</label><textarea id="sq-sql" spellcheck="false" dir="ltr"></textarea><div class="sq-bar"><button type="button" class="btn" id="sq-go">' + esc(M.load) + '</button><button type="button" class="kbtn" id="sq-share">' + esc(M.share) + '</button><button type="button" class="kbtn" id="sq-csv" hidden>' + esc(M.csv) + '</button></div></div><p class="sq-st" id="sq-st" role="status" aria-live="polite"></p><p class="k-xs" id="sq-ok" hidden></p><div class="sq-out" id="sq-out" tabindex="0" hidden></div>';
  A.innerHTML = h;
  var ta = $('sq-sql'), st = $('sq-st'), out = $('sq-out'), db = null, conn = null, card = null, last = null, busy = false;
  var m = /[#&]q=([A-Za-z0-9_-]+)/.exec(location.hash), shared = m && unb64(m[1]);
  ta.value = shared || EX[0];
  function status(t, c) { st.textContent = t; st.className = 'sq-st' + (c ? ' ' + c : ''); }
  A.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-ex')) { ta.value = EX[+b.getAttribute('data-ex')]; if (db) run(); return; }
    if (b.id === 'sq-go') { db ? run() : start(); }
    if (b.id === 'sq-share') { var u = location.origin + location.pathname + '#q=' + b64(ta.value.trim()); try { history.replaceState(null, '', u); } catch (x) {} if (navigator.clipboard) navigator.clipboard.writeText(u).then(function () { status(M.copied, 'ok'); }, function () { status(u); }); else status(u); }
    if (b.id === 'sq-csv') csv();
  });
  ta.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); db ? run() : start(); } });
  function hex(buf) { return crypto.subtle.digest('SHA-256', buf).then(function (d) { return Array.prototype.map.call(new Uint8Array(d), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }); }
  function start() {
    if (busy) return; busy = true; var t0 = performance.now(), mod, bufs = {};
    $('sq-go').disabled = true; status(fill(M.loading, { v: DUCKDB }));
    fetch('/data/sql/datacard.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (c) {
      card = c;
      return Promise.all(c.files.map(function (f) { return fetch(f.parquet.path).then(function (r) { if (!r.ok) throw new Error(f.parquet.path + ' ' + r.status); return r.arrayBuffer(); }).then(function (b) { bufs[f.table] = new Uint8Array(b); return hex(b); }).then(function (hh) { if (hh !== f.parquet.sha256) throw new Error(M.hash_bad + ' ' + f.parquet.path); }); }));
    }).then(function () { return import(ESM); }).then(function (x) { mod = x; return mod.selectBundle(mod.getJsDelivrBundles()); }).then(function (bundle) {
      var wu = URL.createObjectURL(new Blob(['importScripts("' + bundle.mainWorker + '");'], { type: 'text/javascript' }));
      var d = new mod.AsyncDuckDB(new mod.VoidLogger(), new Worker(wu));
      return d.instantiate(bundle.mainModule, bundle.pthreadWorker).then(function () { URL.revokeObjectURL(wu); db = d; });
    }).then(function () {
      return Promise.all(card.files.map(function (f) { return db.registerFileBuffer(f.table + '.parquet', bufs[f.table]); }));
    }).then(function () { return db.connect(); }).then(function (c) {
      conn = c; return Promise.all(card.files.map(function (f) { return conn.query('CREATE OR REPLACE VIEW ' + f.table + " AS SELECT * FROM read_parquet('" + f.table + ".parquet')"); }));
    }).then(function () {
      var ok = $('sq-ok'); ok.textContent = fill(M.ready, { ms: nf(Math.round(performance.now() - t0)) }) + ' · ' + M.hash_ok; ok.hidden = false; $('sq-go').textContent = M.run; $('sq-go').disabled = false; busy = false; return run();
    }).catch(function (e) { busy = false; db = null; $('sq-go').disabled = false; status(M.err + ': ' + (e && e.message ? e.message : e), 'no'); });
  }
  function cell(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === 'bigint') return (v <= 9007199254740991n && v >= -9007199254740991n) ? Number(v) : v.toString();
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    if (typeof v === 'object') return JSON.stringify(v, function (k, x) { return typeof x === 'bigint' ? x.toString() : x; });
    return v;
  }
  function run() {
    if (!conn || busy) return; var q = ta.value.trim(); if (!q) return;
    busy = true; $('sq-go').disabled = true; var t0 = performance.now();
    conn.query(q).then(function (t) {
      var ms = performance.now() - t0, cols = t.schema.fields.map(function (f) { return f.name; }), n = t.numRows, rows = [], lim = Math.min(n, CSVMAX);
      for (var i = 0; i < lim; i++) { var r = t.get(i), o = []; for (var j = 0; j < cols.length; j++) o.push(cell(r ? r[cols[j]] : null)); rows.push(o); }
      last = { cols: cols, rows: rows };
      var num = cols.map(function (c, j) { return rows.slice(0, 50).every(function (r) { return r[j] === null || typeof r[j] === 'number'; }); });
      var hh = '<table><thead><tr>' + cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.slice(0, SHOW).map(function (r) {
        return '<tr>' + r.map(function (v, j) { if (v === null) return '<td class="nul">null</td>'; var s = typeof v === 'number' && !Number.isInteger(v) ? String(Math.round(v * 1000) / 1000) : String(v);
          if (/^https:\/\/kolaboro\.com\/projects\/[a-z0-9-]+\/$/.test(s)) return '<td><a href="' + esc(s.replace('https://kolaboro.com', '')) + '">' + esc(s.split('/')[4]) + '</a></td>';
          return '<td' + (num[j] ? ' class="n"' : '') + '>' + esc(s.length > 220 ? s.slice(0, 220) + '…' : s) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
      out.innerHTML = hh; out.hidden = false; $('sq-csv').hidden = !n;
      status(fill(M.rows, { n: nf(n), ms: ms < 10 ? ms.toFixed(1) : nf(Math.round(ms)) }) + (n > SHOW ? ' · ' + fill(M.shown, { n: SHOW }) : ''), 'ok');
    }).catch(function (e) { last = null; out.hidden = true; $('sq-csv').hidden = true; status(M.err + ': ' + String(e && e.message ? e.message : e).slice(0, 500), 'no'); })
      .then(function () { busy = false; $('sq-go').disabled = false; });
  }
  function csv() {
    if (!last) return; var q = function (v) { v = v == null ? '' : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([[last.cols.map(q).join(',')].concat(last.rows.map(function (r) { return r.map(q).join(','); })).join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' }));
    a.download = 'kolaboro-query.csv'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  if (shared) status(M.q + ': #q=');
})();
