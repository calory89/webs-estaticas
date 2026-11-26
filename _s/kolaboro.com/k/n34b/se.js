/* Kolaboro /search/ (n34b, 21 Nov 2026): instant results and facet counts in the browser from the same static index the page was
   rendered from (/data/n34b-search.json, loaded once on the first interaction). The address bar keeps every filter (replaceState),
   so a copied link opens the same results; without JavaScript the form works as a normal GET. Nothing is sent anywhere. */
(function () {
  var F = document.getElementById('n34-se'), O = document.getElementById('n34-out'), TT = document.getElementById('n34-t');
  if (!F || !O || !TT) return;
  var T = JSON.parse(TT.textContent), L = T._l, P = T._p, PER = 25, X = null, busy = null, tm = 0;
  var N7 = null, N7G = null, N7T = null; try { N7T = JSON.parse(O.getAttribute('data-n37') || 'null'); } catch (e) {}   // r5u (batch 37): completeness and latest change per result, /data/n37u-se.json
  var n7d = function (d) { try { return new Intl.DateTimeFormat(T._loc, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(d + 'T12:00:00Z')); } catch (e) { return d; } };
  var nf = function (n) { try { return new Intl.NumberFormat(T._loc, { numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
  var fill = function (s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var bd = function (h) { return L === 'ar' ? '<bdi>' + h + '</bdi>' : h; };
  var norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); };
  function load() {
    if (X) return Promise.resolve(X); if (busy) return busy;
    busy = fetch('/data/n34b-search.json').then(function (r) { return r.json(); }).then(function (d) {
      X = d.p.filter(function (r) { return !/eco\s*beach|\bequinox\b|\bsumba\b/i.test(r[1] + ' ' + r[3] + ' ' + r[5] + ' ' + r[7]); }).map(function (r) { return { s: r[0], n: r[1], id: r[2], dv: r[3], mk: r[5], co: r[6], ar: r[7], st: r[8], pm: r[9], hy: r[10], ov: r[11], h: norm([r[1], r[2], r[3], r[5], r[6], r[7]].join(' ')), hn: norm(r[1]) }; });
      if (!N7T) return X;
      return fetch('/data/n37u-se.json').then(function (r) { return r.json(); }).then(function (j) { N7 = j.p; N7G = j.g || {}; return X; }).catch(function () { return X; });
    }).catch(function () { busy = null; return null; });
    return busy;
  }
  function match(rows, q) {
    var qa = window.kbAlias ? window.kbAlias(q) : null; if (qa) q = qa;   // n35a: alias table (/data/aliases/)
    var qs = norm(q).split(' ').filter(Boolean); if (!qs.length) return rows.slice();
    var out = [];
    rows.forEach(function (r) { var s = 0; for (var i = 0; i < qs.length; i++) { var w = qs[i], k = r.h.indexOf(w); if (k < 0) return; s += (r.hn.indexOf(w) === 0 ? 6 : r.hn.indexOf(w) >= 0 ? 4 : 1) + (k === 0 || r.h[k - 1] === ' ' ? 1 : 0); } out.push([s, r]); });
    out.sort(function (a, b) { return b[0] - a[0] || a[1].n.localeCompare(b[1].n); }); return out.map(function (x) { return x[1]; });
  }
  function ff(rows, f, skip) {
    return rows.filter(function (r) { return (skip === 'co' || !f.co || r.co === f.co) && (skip === 'st' || !f.st || r.st === f.st) && (skip === 'pm' || f.pm === '' || String(r.pm) === f.pm) && (skip === 'hy' || !f.hy || (f.hy === 'none' ? !r.hy : f.hy === 'past' ? r.ov > 0 : String(r.hy) === f.hy)); });
  }
  var gOf = function (r) { return (N7G && N7G[r.s]) || 0; };   // r10u (batch 37): key facts read in an official register
  function count(rows, key) { var m = {}; rows.forEach(function (r) { var k = key(r); m[k] = (m[k] || 0) + 1; }); return m; }
  function state() { var g = function (n) { var e = F.elements[n]; return e ? String(e.value || '') : ''; }; return { q: g('q'), co: g('co'), st: g('st'), pm: g('pm'), hy: g('hy'), rg: N7G ? g('rg') : '', so: N7G ? g('so') : '' }; }
  function setOpts(sel, opts, cur) {
    var first = sel.options[0] ? sel.options[0].textContent : T.all;
    sel.innerHTML = '<option value="">' + esc(first) + '</option>' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === cur ? ' selected' : '') + '>' + esc(o[1]) + ' (' + nf(o[2]) + ')</option>'; }).join('');
  }
  var ST = { o: T.st_o, u: T.st_u, c: T.st_c };
  function item(r) {
    var place = [r.dv, r.ar && r.ar !== r.mk ? r.ar : '', r.mk, r.co].filter(Boolean).join(' · ');
    var meta = [ST[r.st] || '', r.hy ? fill(T.r_hy, { y: r.hy }) : T.hy_none, r.ov > 0 ? fill(T.r_ov, { m: nf(r.ov) }) : '', r.pm ? T.pm_1 : T.pm_0].filter(Boolean).join(' · ');
    var z = N7 && N7[r.s], n7 = z ? ' <span class="k-xs n37-se">' + esc(fill(N7T.k, { k: nf(z[0]) }) + (z[1] ? ' · ' + fill(N7T.c, { f: N7T.f[z[1]] || z[1], d: n7d(z[2]) }) : '') + (gOf(r) && N7T.b ? ' · ' + fill(N7T.b, { n: nf(gOf(r)) }) : '')) + '</span>' : '';
    return '<li><a href="' + P + '/projects/' + esc(r.s) + '/">' + bd(esc(r.n)) + '</a>' + n7 + ' <span class="k-xs">' + bd(esc(place)) + '</span><br><span class="k-xs">' + esc(meta) + '</span></li>';
  }
  function url(f, pg) { var p = new URLSearchParams(); ['q', 'co', 'st', 'pm', 'hy', 'rg', 'so'].forEach(function (k) { if (f[k]) p.set(k, f[k]); }); if (pg > 1) p.set('pg', pg); var s = p.toString(); return P + '/search/' + (s ? '?' + s : ''); }
  function run(pg) {
    if (!X) return;
    var f = state(), base0 = match(X, f.q), base = f.rg ? base0.filter(function (r) { return gOf(r) >= +f.rg; }) : base0, res = ff(base, f), pages = Math.max(1, Math.ceil(res.length / PER)); pg = Math.min(Math.max(1, pg || 1), pages);
    if (f.so === 'reg') res = res.map(function (r, i) { return [gOf(r), i, r]; }).sort(function (a, b) { return b[0] - a[0] || a[1] - b[1]; }).map(function (x) { return x[2]; });
    if (F.elements.rg && N7G) { var rA = ff(base0, f); setOpts(F.elements.rg, [['1', F.elements.rg.options[1] ? F.elements.rg.options[1].textContent.replace(/ \([^)]*\)$/, '') : '1', rA.filter(function (r) { return gOf(r) >= 1; }).length], ['3', F.elements.rg.options[2] ? F.elements.rg.options[2].textContent.replace(/ \([^)]*\)$/, '') : '3', rA.filter(function (r) { return gOf(r) >= 3; }).length]], f.rg); }
    var co = count(ff(base, f, 'co'), function (r) { return r.co; }), st = count(ff(base, f, 'st'), function (r) { return r.st; }), pm = count(ff(base, f, 'pm'), function (r) { return r.pm; }), hyR = ff(base, f, 'hy'), hy = count(hyR, function (r) { return r.hy || 'none'; });
    var coO = Object.keys(co).sort(function (a, b) { return co[b] - co[a] || a.localeCompare(b); }).map(function (k) { return [k, k, co[k]]; }); if (f.co && !co[f.co]) coO.unshift([f.co, f.co, 0]);
    setOpts(F.elements.co, coO, f.co);
    setOpts(F.elements.st, ['o', 'u', 'c'].map(function (k) { return [k, ST[k], st[k] || 0]; }), f.st);
    setOpts(F.elements.pm, [['1', T.pm_1, pm[1] || 0], ['0', T.pm_0, pm[0] || 0]], f.pm);
    setOpts(F.elements.hy, Object.keys(hy).filter(function (k) { return k !== 'none'; }).sort().map(function (y) { return [y, y, hy[y]]; }).concat([['past', T.hy_past, hyR.filter(function (r) { return r.ov > 0; }).length], ['none', T.hy_none, hy.none || 0]]), f.hy);
    var sl = res.slice((pg - 1) * PER, pg * PER), h = '<p class="k-xs" id="n34-n">' + esc(fill(T.se_n, { k: nf(res.length), t: nf(X.length) })) + '</p>';
    h += sl.length ? '<ol class="n34-res" start="' + ((pg - 1) * PER + 1) + '">' + sl.map(item).join('') + '</ol>' : '<p class="mut">' + esc(T.se_empty) + ' <a href="' + P + '/request-project/?q=' + encodeURIComponent(f.q) + '">' + esc(T.se_req) + '</a></p>';
    if (pages > 1) h += '<nav class="n34-pg" aria-label="' + esc(T.pages) + '">' + (pg > 1 ? '<a href="' + esc(url(f, pg - 1)) + '" data-pg="' + (pg - 1) + '" rel="prev">‹</a>' : '') + '<span>' + nf(pg) + ' / ' + nf(pages) + '</span>' + (pg < pages ? '<a href="' + esc(url(f, pg + 1)) + '" data-pg="' + (pg + 1) + '" rel="next">›</a>' : '') + '</nav>';
    O.innerHTML = h;
    try { history.replaceState(null, '', url(f, pg)); } catch (e) {}
  }
  function soon() { clearTimeout(tm); tm = setTimeout(function () { load().then(function () { run(1); }); }, 120); }
  F.addEventListener('input', soon);
  F.addEventListener('change', soon);
  F.addEventListener('submit', function (e) { if (!X) return; e.preventDefault(); run(1); });
  O.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[data-pg]'); if (!a || !X) return; e.preventDefault(); run(+a.getAttribute('data-pg')); O.scrollIntoView({ block: 'start' }); });
  F.addEventListener('focusin', function () { load(); }, { once: true });
  // n35a (22 Nov 2026): names in another script resolve through the public alias table (/data/aliases/); a shared link reruns once it loads
  (function () { if (window.kbAlias) return; var sa = document.createElement('script'); sa.src = '/k/n35a/alias.js?v=a2'; sa.async = true; sa.onload = function () { var q = F.elements.q && F.elements.q.value, n = 0; if (!q) return; var tq = setInterval(function () { var a = window.kbAlias(q); if (a !== null || ++n > 20) { clearInterval(tq); if (a) load().then(function () { run(1); }); } }, 150); }; document.head.appendChild(sa); })();
})();
