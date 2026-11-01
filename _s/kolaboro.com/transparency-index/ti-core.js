/* Off-plan Transparency Index: shared computation (used by /transparency-index/ and /embed/) */
(function (g) {
  var MIN = 3, W_D = 0.6, W_V = 0.3, W_F = 0.1;
  function dataUrl() { return '/data/bali-cases.json?t=' + Math.floor(Date.now() / 6e5); }
  function compute(d) {
    var C = (d && d.cases) || [], M = {};
    C.forEach(function (c) {
      if (!c || !c.market) return;
      var mx = c.max || 6, k = c.checks || {};
      var m = M[c.market] = M[c.market] || { market: c.market, country: c.country || '', n: 0, d: 0, v: 0, clean: 0, flagged: 0, permit: 0, escrow: 0, conf4: 0, checks: 0 };
      m.n++;
      m.d += Math.min(1, (c.score || 0) / mx);
      m.v += Math.min(1, (c.vscore || 0) / mx);
      m.checks += c.score || 0;
      if ((c.flags || []).length) m.flagged++; else m.clean++;
      if (k.permit === 2) m.permit++;
      if (k.escrow === true) m.escrow++;
      if ((c.vscore || 0) >= 4) m.conf4++;
    });
    var rows = Object.keys(M).map(function (key) { return M[key]; }).filter(function (m) { return m.n >= MIN; }).map(function (m) {
      var D = m.d / m.n, V = m.v / m.n, F = m.clean / m.n;
      return {
        market: m.market, country: m.country, projects: m.n,
        disclosure: D, confirmed: V, noflags: F,
        pD: 100 * W_D * D, pV: 100 * W_V * V, pF: 100 * W_F * F,
        index: Math.round(1000 * (W_D * D + W_V * V + W_F * F)) / 10,
        avgChecks: m.checks / m.n,
        permitP: m.permit / m.n, escrowP: m.escrow / m.n, conf4P: m.conf4 / m.n,
        flagged: m.flagged
      };
    });
    rows.sort(function (a, b) { return b.index - a.index || b.projects - a.projects || (a.market < b.market ? -1 : 1); });
    rows.forEach(function (r, i) { r.rank = i && rows[i - 1].index === r.index ? rows[i - 1].rank : i + 1; });
    var covered = rows.reduce(function (s, r) { return s + r.projects; }, 0);
    return { rows: rows, updated: d.updated || '', total: C.length, covered: covered, allMarkets: Object.keys(M).length };
  }
  function fmtDate(s) {
    var p = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); if (!p) return s || '';
    var mo = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return (+p[3]) + ' ' + mo[+p[2] - 1] + ' ' + p[1];
  }
  function pct(x) { return Math.round(x * 100) + '%'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); }
  g.KTI = { MIN: MIN, W: { D: W_D, V: W_V, F: W_F }, dataUrl: dataUrl, compute: compute, fmtDate: fmtDate, pct: pct, esc: esc };
})(window);
