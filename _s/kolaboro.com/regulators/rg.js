/* Kolaboro for regulators: live country view computed from /data/bali-cases.json */
(function () {
  var $ = function (i) { return document.getElementById(i); };
  var fmt = function (n) { return (n || 0).toLocaleString('en'); };
  var pct = function (a, b) { return b ? Math.round(a / b * 100) + '%' : '0%'; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var LV = [['registry', 'Registry', '#17212B'], ['independent', 'Independent source', '#0B7A55'], ['developer', 'Developer only', '#B9B4A8'], ['contradicted', 'Contradicted', '#C9461A'], ['none', 'Not published', '#E7E4DC']];
  var C = [], sel = $('rgC');

  function stats(list) {
    var s = { n: list.length, permit: 0, escrow: 0, prog: 0, contra: 0, claims: 0, cproj: 0, over: 0, overM: 0, flags: 0, live: 0, lv: {} };
    list.forEach(function (c) {
      var k = c.checks || {}, cl = c.claims || {};
      if (k.permit === 2) s.permit++;
      if (k.escrow === true) s.escrow++;
      if (k.progress != null) s.prog++;
      var x = cl.contradicted || 0; s.contra += x; s.claims += x + (cl.verified || 0) + (cl.unverified || 0); if (x) s.cproj++;
      if (c.overdue) { s.over++; s.overM += +c.overdue || 0; }
      if ((c.flags || []).length) s.flags++;
      if (c.stage === 'off-plan' || c.stage === 'under construction') s.live++;
      var v = c.verified || {}; Object.keys(v).forEach(function (f) { s.lv[v[f]] = (s.lv[v[f]] || 0) + 1; });
    });
    return s;
  }

  function draw() {
    var cn = sel.value, list = cn ? C.filter(function (c) { return c.country === cn; }) : C, s = stats(list);
    $('rg-n').textContent = fmt(s.n);
    $('rg-permit').textContent = pct(s.permit, s.n);
    $('rg-escrow').textContent = pct(s.escrow, s.n);
    $('rg-prog').textContent = pct(s.prog, s.n);
    $('rg-contra').textContent = fmt(s.contra);
    $('rg-contra-l').textContent = 'developer claims contradicted, ' + pct(s.contra, s.claims) + ' of ' + fmt(s.claims) + ' tested';
    $('rg-over').textContent = fmt(s.over);
    $('rg-over-l').textContent = s.over ? 'projects past their completion date, ' + (s.overM / s.over).toFixed(1) + ' months late on average' : 'projects past their completion date';
    $('rg-flags').textContent = fmt(s.flags);
    $('rg-stage').textContent = fmt(s.live);
    var tot = 0; LV.forEach(function (l) { tot += s.lv[l[0]] || 0; });
    $('rgS').innerHTML = tot ? LV.map(function (l) { var v = s.lv[l[0]] || 0; return v ? '<i style="width:' + (v / tot * 100) + '%;background:' + l[2] + '" title="' + l[1] + ': ' + v + '"></i>' : ''; }).join('') : '';
    $('rgS').setAttribute('aria-label', 'Share of ' + fmt(tot) + ' checks by verification level: ' + LV.map(function (l) { return l[1] + ' ' + pct(s.lv[l[0]] || 0, tot); }).join(', '));
    $('rgL').innerHTML = LV.map(function (l) { return '<span style="--c:' + l[2] + '">' + l[1] + ' <b>' + pct(s.lv[l[0]] || 0, tot) + '</b></span>'; }).join('');

    var M = {}; list.forEach(function (c) { (M[c.market] = M[c.market] || []).push(c); });
    var rows = Object.keys(M).map(function (k) { return { m: k, s: stats(M[k]) }; }).sort(function (a, b) { return b.s.n - a.s.n || (a.m < b.m ? -1 : 1); });
    $('rgT').innerHTML = rows.length ? rows.map(function (r) {
      var t = r.s;
      return '<tr><td><a href="/m/?market=' + encodeURIComponent(r.m) + '">' + esc(r.m) + '</a></td><td>' + t.n + '</td><td>' + pct(t.permit, t.n) + '</td><td>' + pct(t.escrow, t.n) + '</td><td>' + pct(t.prog, t.n) + '</td><td>' + fmt(t.contra) + '</td><td>' + t.over + '</td><td>' + t.flags + '</td></tr>';
    }).join('') : '<tr><td colspan="8">No projects tracked here yet.</td></tr>';

    var dl = $('rgDl');
    dl.href = '/api/open/projects.csv' + (cn ? '?country=' + encodeURIComponent(cn) : '');
    dl.textContent = 'Projects CSV: ' + (cn || 'all countries');
    try { var u = new URL(location.href); if (cn) u.searchParams.set('country', cn); else u.searchParams.delete('country'); history.replaceState(null, '', u.pathname + u.search + u.hash); } catch (e) {}
  }

  fetch('/data/bali-cases.json?t=' + Math.floor(Date.now() / 6e5)).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
    C = d.cases || [];
    var K = {}; C.forEach(function (c) { if (c.country) K[c.country] = (K[c.country] || 0) + 1; });
    Object.keys(K).sort(function (a, b) { return K[b] - K[a] || (a < b ? -1 : 1); }).forEach(function (k) {
      var o = document.createElement('option'); o.value = k; o.textContent = k + ' (' + K[k] + ')'; sel.appendChild(o);
    });
    $('rgU').textContent = fmt(C.length) + ' projects in ' + Object.keys(K).length + ' countries. Updated ' + (d.updated || '') + '.';
    var q = ''; try { q = new URLSearchParams(location.search).get('country') || ''; } catch (e) {}
    if (q && K[q]) sel.value = q;
    sel.addEventListener('change', draw);
    draw();
  }).catch(function () {
    $('rgU').textContent = 'The data could not load. Try again, or download the CSV below.';
    $('rgT').innerHTML = '<tr><td colspan="8">Data unavailable right now.</td></tr>';
  });
})();
