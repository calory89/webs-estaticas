/* kolaboro.com "Is this project late?" box (home and /check/). The browser loads the public bulk index (/api/x/bulkix, CC BY 4.0)
   once and matches the name or link here; nothing typed is sent. Row fields: see "fields.p" in the index. */
(function () {
  var f = document.getElementById('n40-late-f'), q = document.getElementById('n40-late-q'), o = document.getElementById('n40-late-o'), sj = document.getElementById('n40-late-s');
  if (!f || !q || !o || !sj) return;
  var S = {}; try { S = JSON.parse(sj.textContent); } catch (e) { return; }
  var IX = null, LOAD = null;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function tf(k, v) { return String(S[k] || '').replace(/\{(\w+)\}/g, function (m, x) { return v && v[x] != null ? v[x] : m; }); }
  function th(k, v) { return esc(S[k] || '').replace(/\{(\w+)\}/g, function (m, x) { return v && v[x] != null ? esc(v[x]) : m; }); }
  function nf(n) { try { return new Intl.NumberFormat(S.loc, { numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } }
  function fd(d) { if (!/^\d{4}-\d{2}-\d{2}/.test(d || '')) return d || ''; try { return new Intl.DateTimeFormat(S.loc, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(d.slice(0, 10) + 'T12:00:00Z')); } catch (e) { return d; } }
  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9Ѐ-ӿ؀-ۿ一-鿿]+/g, ' ').trim(); }
  function load() {
    if (LOAD) return LOAD;
    LOAD = fetch('/api/x/bulkix', { headers: { accept: 'application/json' } }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
      d.p.forEach(function (p) { p.nn = norm(p[1]); }); IX = d; return d;
    });
    LOAD.catch(function () { LOAD = null; });
    return LOAD;
  }
  function find(raw) {
    var s = String(raw || '').trim(), P = IX.p, m = /\/projects\/([a-z0-9-]+)/i.exec(s), out = [];
    if (m) { var sl = m[1].toLowerCase(); out = P.filter(function (p) { return p[0] === sl; }); if (out.length) return out; }
    var hm = /^(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)(\/[^?#]*)?/i.exec(s);
    if (hm && /\./.test(hm[1]) && !/\s/.test(s)) {
      var hp = (hm[1] + (hm[2] || '')).toLowerCase().replace(/\/+$/, '');
      out = P.filter(function (p) { return (p[7] || []).indexOf(hp) >= 0; });
      if (!out.length) out = P.filter(function (p) { return (p[8] || []).indexOf(hm[1].toLowerCase()) >= 0; });
      if (out.length) return out;
    }
    var id = s.toUpperCase(); out = P.filter(function (p) { return p[2] === id; }); if (out.length) return out;
    var n = norm(s); if (n.length < 2) return [];
    out = P.filter(function (p) { return p.nn === n || p[0] === n.replace(/ /g, '-'); }); if (out.length) return out;
    var tk = n.split(' ');
    out = P.filter(function (p) { var h = ' ' + p.nn + ' '; for (var i = 0; i < tk.length; i++) if (h.indexOf(tk[i].length > 2 ? tk[i] : ' ' + tk[i] + ' ') < 0) return false; return true; });
    out.sort(function (a, b) { return (a.nn.indexOf(n) === 0 ? 0 : 1) - (b.nn.indexOf(n) === 0 ? 0 : 1) || a.nn.length - b.nn.length; });
    return out;
  }
  function answer(p) {
    var ho = p[9], done = p[13] === 1, late = +p[14] || 0, d0 = p[15], mv = +p[10] || 0, v;
    if (done) v = ['ok', tf('done')];
    else if (late > 0) v = ['late', late === 1 ? tf('late1') : tf('late', { m: nf(late) })];
    else if (!ho) v = ['', tf('unk')];
    else if (d0 || mv > 0) v = ['mv', tf('okmv')];
    else v = ['ok', tf('ok')];
    var L = [];
    L.push(ho ? th('ho', { d: ho }) : th('nho'));
    if (d0) L.push(th('mv', { d: d0 }));
    if (mv > 0) L.push(th('mvn', { n: nf(mv) }));
    L.push(p[16] ? th('rg', { r: p[16], d: fd(p[17]) }) : th('nrg'));
    L.push(th('pn', { v: p[11] ? S.y : S.n }));
    var meta = [p[3], p[5], p[6]].filter(Boolean).map(esc).join(', ');
    return '<p><b><bdi>' + esc(p[1]) + '</bdi></b>' + (meta ? ' <small>' + meta + '</small>' : '') + '</p>' + (v[1] ? '<p class="v ' + v[0] + '">' + esc(v[1]) + '</p>' : '') +
      '<ul>' + L.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul><p><a href="' + S.pre + '/projects/' + encodeURIComponent(p[0]) + '/">' + esc(S.open) + '</a></p><p><small>' + esc(tf('src', { d: fd(IX.updated) })) + '</small></p>';
  }
  function show(R) {
    if (!R.length) { o.innerHTML = '<p>' + esc(S.nf) + '</p>'; return; }
    if (R.length === 1) { o.innerHTML = answer(R[0]); return; }
    var top = R.slice(0, 8);
    o.innerHTML = '<p>' + esc(tf('mn', { n: nf(R.length) })) + '</p><ul>' + top.map(function (p, i) { return '<li><button type="button" class="lk" data-i="' + i + '"><bdi>' + esc(p[1]) + '</bdi></button> <small>' + esc([p[3], p[5]].filter(Boolean).join(', ')) + '</small></li>'; }).join('') + '</ul>' + (R.length > 8 ? '<p><small>' + esc(S.mx) + '</small></p>' : '');
    o.querySelectorAll('button.lk').forEach(function (b) { b.addEventListener('click', function () { o.innerHTML = answer(top[+b.getAttribute('data-i')]); o.focus && o.setAttribute('tabindex', '-1'); o.focus(); }); });
  }
  f.addEventListener('submit', function (e) {
    e.preventDefault(); var v = q.value.trim(); if (v.length < 2) { q.focus(); return; }
    if (!IX) o.innerHTML = '<p>' + esc(S.ld) + '</p>';
    load().then(function () { show(find(v)); }, function () { o.innerHTML = '<p>' + esc(S.er) + '</p>'; });
  });
  q.addEventListener('focus', function () { load(); }, { once: true });
  window.kbLate41 = { find: function (s) { return load().then(function () { return find(s).map(function (p) { return p[0]; }); }); } };
})();
