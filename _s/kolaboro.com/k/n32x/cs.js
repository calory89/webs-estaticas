/* kolaboro.com /claims/search/ (n32x, batch 32): full-text search over every claim in the browser.
   /data/claims-index.json is prebuilt (terms -> claim postings, project terms -> project postings, delta + hex); words match by prefix,
   every word must match; a word can also match the source host. Filters: status, checked against, date read. */
(function () {
  'use strict';
  var A = document.getElementById('n32-app'); if (!A) return;
  var M = JSON.parse(document.getElementById('n32-t').textContent), L = M._loc || 'en-GB', l = M._l || 'en', P = l === 'en' ? '' : '/' + l;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var fill = function (s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); };
  var nf = function (n) { try { return new Intl.NumberFormat(L, { numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
  var fd = function (d) { try { return new Intl.DateTimeFormat(L, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(d + 'T12:00:00Z')); } catch (e) { return d; } };
  var fold = function (s) { return String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, ''); };
  var css = '<style>.cs-f{display:flex;flex-wrap:wrap;gap:8px;align-items:end;margin:8px 0}.cs-f label{display:grid;gap:2px;font-size:.85rem;color:var(--muted,#59626B)}.cs-q{width:100%;font-size:1.05rem}.cs-r{list-style:none;padding:0;margin:10px 0}.cs-r li{border-bottom:1px solid var(--line,#d5d3cc);padding:10px 0}.cs-r q{quotes:none}.cs-m{font-size:.86rem;color:var(--muted,#59626B);margin-top:3px}.cs-b{display:inline-block;font-size:.78rem;padding:1px 7px;border-radius:9px;border:1px solid currentColor;margin-inline-end:6px}.cs-b.s0{color:#0B7A55}.cs-b.s2{color:#B42318}.cs-r mark{background:#FFE7A3;color:inherit;padding:0 1px}:root[data-theme=dark] .cs-r mark{background:#6B5A1E}:root[data-theme=dark] .cs-b.s0{color:#4BE3A4}:root[data-theme=dark] .cs-b.s2{color:#FF8A80}</style>';
  var opt = function (a) { return '<option value="">' + esc(M.all) + '</option>' + a.map(function (x, i) { return '<option value="' + i + '">' + esc(x) + '</option>'; }).join(''); };
  A.innerHTML = css + '<input type="search" class="cs-q" id="cs-q" placeholder="' + esc(M.ph) + '" aria-label="' + esc(M.ph) + '" autocomplete="off" enterkeyhint="search">' +
    '<div class="cs-f"><label>' + esc(M.status) + '<select id="cs-s">' + opt(M.st) + '</select></label><label>' + esc(M.lv_l) + '<select id="cs-l">' + opt(M.lv) + '</select></label><label>' + esc(M.from) + '<input type="text" id="cs-d0" inputmode="numeric" placeholder="2026-10-01" size="10" dir="ltr"></label><label>' + esc(M.to) + '<input type="text" id="cs-d1" inputmode="numeric" placeholder="2026-12-31" size="10" dir="ltr"></label></div>' +
    '<p class="k-xs" id="cs-st" role="status" aria-live="polite">' + esc(M.load) + '</p><ol class="cs-r" id="cs-r"></ol><p><button type="button" class="kbtn" id="cs-more" hidden>' + esc(M.more) + '</button></p>';
  var $ = function (id) { return document.getElementById(id); }, X = null, shown = 0, hits = [], words = [];
  function dec(s) { var o = [], p = 0; if (!s) return o; s.split(',').forEach(function (x) { p += parseInt(x, 16); o.push(p); }); return o; }
  function lb(arr, w) { var lo = 0, hi = arr.length; while (lo < hi) { var m = (lo + hi) >> 1; if (arr[m] < w) lo = m + 1; else hi = m; } return lo; }
  function prefix(terms, post, w) { var s = new Set(), i = lb(terms, w); for (; i < terms.length && terms[i].lastIndexOf(w, 0) === 0; i++) dec(post[i]).forEach(function (x) { s.add(x); }); return s; }
  var t0 = performance.now();
  fetch('/data/claims-index.json').then(function (r) { return r.json(); }).then(function (x) {
    X = x; X.pr = []; var cur = -1; x.docs.forEach(function (d, i) { if (d[0] !== cur) { cur = d[0]; X.pr[cur] = [i, i]; } X.pr[cur][1] = i + 1; });
    X.host = x.sources.map(function (u) { return fold(u.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]); });
    $('cs-st').textContent = fill(M.ready, { n: nf(x.docs.length), w: nf(x.terms.length + x.pterms.length), ms: nf(Math.round(performance.now() - t0)) });
    var q = new URLSearchParams(location.search).get('q'); if (q) $('cs-q').value = q;
    search();
  }).catch(function (e) { $('cs-st').textContent = String(e); });
  function search() {
    if (!X) return; var t1 = performance.now();
    words = (fold($('cs-q').value).match(/[a-z0-9Ѐ-ӿ؀-ۿ一-鿿]+/g) || []).filter(function (w) { return w.length >= 2 || /\d/.test(w); });
    var fs = $('cs-s').value, fl = $('cs-l').value, d0 = $('cs-d0').value.trim(), d1 = $('cs-d1').value.trim(), cand = null;
    words.forEach(function (w) {
      var s = prefix(X.terms, X.postings, w);
      prefix(X.pterms, X.ppostings, w).forEach(function (p) { var r = X.pr[p]; if (r) for (var i = r[0]; i < r[1]; i++) s.add(i); });
      if (w.length >= 3) X.docs.forEach(function (d, i) { if (X.host[d[3]].indexOf(w) >= 0) s.add(i); });
      cand = cand ? new Set([].concat(Array.from(cand)).filter(function (i) { return s.has(i); })) : s;
    });
    var all = cand ? Array.from(cand).sort(function (a, b) { return a - b; }) : X.docs.map(function (d, i) { return i; });
    hits = all.filter(function (i) { var d = X.docs[i], dt = X.projects[d[0]][3]; return (fs === '' || d[1] === +fs) && (fl === '' || d[2] === +fl) && (!d0 || dt >= d0) && (!d1 || dt <= d1); });
    $('cs-st').textContent = fill(M.n, { n: nf(hits.length), t: nf(X.docs.length) }) + ' · ' + fill(M.ms, { ms: (performance.now() - t1).toFixed(1) });
    if (!hits.length && words.length) $('cs-st').textContent += ' · ' + M.none;
    shown = 0; $('cs-r').innerHTML = ''; more();
  }
  function mark(s) {
    var h = esc(s); if (!words.length) return h;
    var rx = new RegExp('(^|[^a-z0-9])(' + words.map(function (w) { return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')', 'gi');
    var f = fold(h); if (f.length !== h.length) return h;   // only mark when folding keeps positions
    var out = '', last = 0, m; while ((m = rx.exec(f))) { var a = m.index + m[1].length, b = a + m[2].length; out += h.slice(last, a) + '<mark>' + h.slice(a, b) + '</mark>'; last = b; } return out + h.slice(last);
  }
  function more() {
    var n = Math.min(hits.length, shown + 40), h = '';
    for (var k = shown; k < n; k++) { var d = X.docs[hits[k]], p = X.projects[d[0]], src = X.sources[d[3]];
      h += '<li><q>' + mark(d[4]) + '</q><div class="cs-m"><span class="cs-b s' + d[1] + '">' + esc(M.st[d[1]]) + '</span>' + esc(M.lv_l) + ': ' + esc(M.lv[d[2]]) + ' · <a href="' + P + '/projects/' + esc(p[0]) + '/">' + esc(p[1]) + '</a> · ' + esc(p[2]) + (src ? ' · <a href="' + esc(src) + '" rel="nofollow noopener" target="_blank">' + esc(M.src) + ': ' + esc(X.host[d[3]]) + '</a>' : '') + (p[3] ? ' · ' + esc(fill(M.read, { d: fd(p[3]) })) : '') + '</div></li>'; }
    $('cs-r').insertAdjacentHTML('beforeend', h); shown = n; $('cs-more').hidden = shown >= hits.length;
  }
  var tm = null; A.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(search, 60); });
  A.addEventListener('change', search);
  $('cs-more').addEventListener('click', more);
})();
