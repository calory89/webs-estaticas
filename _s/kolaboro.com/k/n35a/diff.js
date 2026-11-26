/* kolaboro.com /data/diff/ (n35a, batch 35): dataset diff between any two snapshot dates, in the browser. It fetches the daily delta
   files between the two dates (/data/delta/<day>.json, listed in /data/delta/index.json) and composes them: a record added then changed
   stays "added", added then removed disappears, removed then added again counts as changed. Nothing is sent anywhere. */
(function () {
  'use strict';
  var A = document.getElementById('n35-df'); if (!A) return;
  var M = JSON.parse(document.getElementById('n35-dft').textContent), L = M._loc || 'en-GB', P = M._l === 'en' ? '' : '/' + M._l;
  var $ = function (id) { return document.getElementById(id); }, st = $('n35-dfs'), out = $('n35-dfo'), IX = null, CACHE = {};
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var fill = function (s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); };
  var nf = function (n) { try { return new Intl.NumberFormat(L, { numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
  var SEAL = { sha: 1, sealed: 1 };
  function get(f) { if (!CACHE[f]) CACHE[f] = fetch(f).then(function (r) { if (!r.ok) throw new Error(f + ' ' + r.status); return r.json(); }); return CACHE[f]; }
  function go() {
    var a = $('n35-dfa').value, b = $('n35-dfb').value;
    if (a === b) { st.textContent = M.f_same; out.innerHTML = ''; return; }
    if (a > b) { var x = a; a = b; b = x; }
    var es = IX.entries.filter(function (e) { return e.from >= a && e.to <= b; });
    st.textContent = fill(M.f_load, { n: es.length }); out.innerHTML = '';
    Promise.all(es.map(function (e) { return get(e.file); })).then(function (ds) {
      var S = {};
      ds.forEach(function (d) {
        (d.removed || []).forEach(function (s) { s = typeof s === 'string' ? s : s.s; if (S[s] && S[s].k === 'added') delete S[s]; else S[s] = { k: 'removed', f: {} }; });
        (d.added || []).forEach(function (r) { var s = r.s, o = S[s]; if (o && o.k === 'removed') { S[s] = { k: 'changed', f: { '*': 1 }, n: r.n }; } else S[s] = { k: 'added', f: {}, n: r.n }; });
        Object.keys(d.changed || {}).forEach(function (s) { var c = d.changed[s], o = S[s] || (S[s] = { k: 'changed', f: {} }); if (c.set && c.set.n) o.n = c.set.n; Object.keys(c.set || {}).concat(c.unset || []).forEach(function (k) { o.f[k] = 1; }); });
      });
      render(S, a, b);
    }).catch(function (e) { st.textContent = M.f_err + ': ' + (e && e.message || e); });
  }
  function render(S, a, b) {
    var hide = $('n35-dfh') ? $('n35-dfh').checked : true, cnt = { added: 0, removed: 0, changed: 0 }, fc = {}, rows = [];
    Object.keys(S).sort().forEach(function (s) {
      var o = S[s], fs = Object.keys(o.f).filter(function (k) { return !(hide && SEAL[k]); });
      if (o.k === 'changed' && !fs.length) return;
      cnt[o.k]++; fs.forEach(function (k) { fc[k] = (fc[k] || 0) + 1; }); rows.push([s, o, fs]);
    });
    st.textContent = fill(M.f_res, { a: a, b: b });
    var h = '<div class="n35-k"><div><b>' + nf(cnt.added) + '</b>' + esc(M.f_add) + '</div><div><b>' + nf(cnt.removed) + '</b>' + esc(M.f_rem) + '</div><div><b>' + nf(cnt.changed) + '</b>' + esc(M.f_chg) + '</div></div>' +
      '<p><label><input type="checkbox" id="n35-dfh"' + (hide ? ' checked' : '') + '> ' + esc(M.f_seal || 'sha, sealed') + '</label></p>';
    var fk = Object.keys(fc).sort(function (x, y) { return fc[y] - fc[x] || (x < y ? -1 : 1); });
    if (fk.length) h += '<h3>' + esc(M.f_fields) + '</h3><div class="n35-tw" tabindex="0"><table><thead><tr><th scope="col">' + esc(M.f_fth[0]) + '</th><th scope="col">' + esc(M.f_fth[1]) + '</th></tr></thead><tbody>' + fk.map(function (k) { return '<tr><td><code>' + esc(k === '*' ? '(all)' : k) + '</code></td><td class="n">' + nf(fc[k]) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    if (!rows.length) h += '<p>' + esc(M.f_none) + '</p>';
    else h += '<h3>' + esc(M.f_rec) + '</h3><div class="n35-tw" tabindex="0"><table><thead><tr>' + M.f_th.map(function (x) { return '<th scope="col">' + esc(x) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.slice(0, 400).map(function (r) {
      var lab = { added: M.f_add, removed: M.f_rem, changed: M.f_chg }[r[1].k];
      return '<tr><th scope="row">' + (r[1].k === 'removed' ? esc(r[0]) : '<a href="' + P + '/projects/' + esc(r[0]) + '/">' + esc(r[1].n || r[0]) + '</a>') + '</th><td>' + esc(lab) + '</td><td>' + r[2].map(function (k) { return '<code>' + esc(k) + '</code>'; }).join(' ') + '</td><td><a rel="nofollow" href="/api/v1/projects/' + esc(r[0]) + '/history">' + esc(M.f_hist) + '</a></td></tr>';
    }).join('') + '</tbody></table></div>' + (rows.length > 400 ? '<p class="k-xs">' + esc(fill(M.f_more, { n: nf(rows.length - 400) })) + '</p>' : '');
    out.innerHTML = h;
    $('n35-dfh').addEventListener('change', function () { render(S, a, b); });
    try { history.replaceState(null, '', location.pathname + '#' + a + '..' + b); } catch (e) {}
  }
  fetch('/data/delta/index.json').then(function (r) { return r.json(); }).then(function (d) {
    IX = d; var m = /^#(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})$/.exec(location.hash);
    if (m) { $('n35-dfa').value = m[1]; $('n35-dfb').value = m[2]; }
    go();
  }).catch(function (e) { st.textContent = M.f_err + ': ' + e; });
  A.addEventListener('click', function (e) { if (e.target.id === 'n35-dfg') go(); });
  A.addEventListener('submit', function (e) { e.preventDefault(); go(); });
})();
