/* kolaboro.com (n35a, batch 35): cross-language names. window.kbAlias(q) returns q with any known alias (another script, a registered
   company name, an older name) replaced by the name our pages use, or null when nothing matched; the alias table is fetched once
   (/data/n35a/alias-q.json, rule on /data/aliases/). Used by the command palette and /search/. On /data/aliases/ it also runs the tester. */
(function () {
  'use strict';
  var D = null, busy = null;
  function plain(s) { return String(s || '').normalize('NFKC').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
  function tr(s) { if (!D) return s; var o = ''; for (var i = 0; i < s.length; i++) { var c = s[i], k = D.cyr.indexOf(c), g = D.grk.indexOf(c); o += k >= 0 ? D.cyr_lat[k] : g >= 0 ? D.grk_lat[g] : c; } return o; }
  var LEG = null;
  function key(s) { var x = tr(String(s || '').normalize('NFKC').toLowerCase()); x = x.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and '); if (LEG) x = x.replace(LEG, ' '); return x.replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim(); }
  function load() { if (D || busy) return busy; busy = fetch('/data/n35a/alias-q.json').then(function (r) { return r.json(); }).then(function (d) { D = d; try { LEG = new RegExp(d.legal, 'g'); } catch (e) {} return d; }).catch(function () { busy = null; }); return busy; }
  function resolve(q) {
    if (!D) { load(); return null; }
    var x = plain(q), hit = [];
    for (var i = 0; i < D.a.length; i++) { var a = D.a[i][0]; if (a.length >= 3 && x.indexOf(a) >= 0) hit.push({ a: a, c: D.a[i][1], r: 1 }); }
    hit.sort(function (p, q2) { return q2.a.length - p.a.length; });
    var out = x, used = false;
    hit.forEach(function (h) { if (out.indexOf(h.a) >= 0) { out = out.split(h.a).join(' ' + h.c + ' '); used = true; } });
    if (/[Ͱ-ϿЀ-ӿ]/.test(out)) {   // Cyrillic or Greek: transliterate and look for a developer name key
      var k = ' ' + key(out) + ' ', best = null;
      for (var j = 0; j < D.d.length; j++) { var dk = D.d[j][0]; if (k.indexOf(' ' + dk + ' ') >= 0 && (!best || dk.length > best[0].length)) best = D.d[j]; }
      if (best) { out = best[1]; used = true; }
    }
    return used ? out.replace(/\s+/g, ' ').trim() : null;
  }
  window.kbAlias = function (q) { try { return resolve(q); } catch (e) { return null; } };
  window.kbAliasKey = key;
  load();
  // ------------------------------------------------------------------------------------------- tester on /data/aliases/
  var A = document.getElementById('n35-al'); if (!A) return;
  var inp = document.getElementById('n35-alq'), out = document.getElementById('n35-alo'), full = null, L = A.getAttribute('data-l') || 'en', P = L === 'en' ? '' : '/' + L;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  fetch('/data/n35a/aliases.json').then(function (r) { return r.json(); }).then(function (d) { full = d; run(); });
  function link(r) { return r[1] === 'developer' ? P + '/developers/' + r[2] + '/' : r[1] === 'project' ? P + '/projects/' + r[2] + '/' : P + '/m/' + r[2] + '/'; }
  function run() {
    var q = inp.value.trim(); if (!q || !full || !D) { out.innerHTML = ''; return; }
    var x = plain(q), k = key(q), rows = full.rows.filter(function (r) { return plain(r[3]) === x || plain(r[0]) === x || (x.length >= 3 && plain(r[3]).indexOf(x) >= 0); }).slice(0, 12);
    var devs = D.d.filter(function (d) { return k.length >= 3 && d[0] === k; });
    var h = '<p class="k-xs">' + esc(A.getAttribute('data-key')) + ' <code>' + esc(k) + '</code></p>';
    if (rows.length) h += '<ul>' + rows.map(function (r) { return '<li><a href="' + esc(link(r)) + '">' + esc(r[0]) + '</a> ← <span dir="auto">' + esc(r[3]) + '</span> <span class="k-xs">(' + esc(r[4]) + ', ' + esc(r[1]) + ')</span></li>'; }).join('') + '</ul>';
    if (devs.length) h += (devs.length > 1 ? '<p class="k-xs">' + esc(A.getAttribute('data-amb')) + '</p>' : '') + '<ul>' + devs.map(function (d) { return '<li>' + esc(d[1]) + '</li>'; }).join('') + '</ul>';
    if (!rows.length && !devs.length) h += '<p>' + esc(A.getAttribute('data-none')) + '</p>';
    out.innerHTML = h;
  }
  inp.addEventListener('input', run);
  A.addEventListener('submit', function (e) { e.preventDefault(); run(); });
  busy && busy.then(run);
})();
