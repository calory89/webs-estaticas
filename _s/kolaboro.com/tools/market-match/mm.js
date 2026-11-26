/* Kolaboro market match: ranks markets for a buyer from /data/bali-cases.json, with the transparency index from /transparency-index/ti-core.js */
(function () {
  'use strict';
  var K = window.KTI;
  var $ = function (id) { return document.getElementById(id); };
  var esc = K ? K.esc : function (s) { return String(s); };
  var MINP = 3, YEAR = new Date().getFullYear();
  var BAND_ORDER = ['Under $100k', '$100k to $200k', '$200k to $400k', '$400k and up'];
  var NOPRICE = 'Price not stated';
  var REG = {
    'Southeast Asia': ['Indonesia', 'Thailand', 'Malaysia', 'Vietnam', 'Philippines', 'Cambodia', 'Laos', 'Singapore'],
    'Rest of Asia': ['Japan', 'India', 'Sri Lanka', 'Maldives', 'China', 'South Korea', 'Taiwan', 'Nepal'],
    'Australia and Pacific': ['Australia', 'New Zealand', 'Fiji', 'Vanuatu', 'Samoa'],
    'Middle East and North Africa': ['UAE', 'Oman', 'Bahrain', 'Qatar', 'Saudi Arabia', 'Kuwait', 'Jordan', 'Egypt', 'Morocco', 'Tunisia'],
    'Europe': ['Spain', 'Portugal', 'United Kingdom', 'Ireland', 'France', 'Italy', 'Malta', 'Greece', 'Cyprus', 'Northern Cyprus', 'Turkey', 'Croatia', 'Montenegro', 'Albania', 'Bulgaria', 'Georgia', 'Germany', 'Netherlands', 'Austria', 'Switzerland', 'Romania', 'Serbia', 'Hungary', 'Poland'],
    'Africa and Indian Ocean': ['Mauritius', 'Seychelles', 'Kenya', 'Tanzania', 'South Africa', 'Namibia', 'Ghana', 'Rwanda', 'Senegal', 'Cape Verde', 'Nigeria', 'Uganda', 'Madagascar'],
    'North America': ['USA', 'Canada', 'Mexico'],
    'Caribbean and Central America': ['Antigua and Barbuda', 'Aruba', 'Bahamas', 'Barbados', 'Belize', 'Cayman Islands', 'Costa Rica', 'Curacao', 'Dominican Republic', 'El Salvador', 'Grenada', 'Jamaica', 'Nicaragua', 'Panama', 'Puerto Rico', 'Saint Lucia', 'St Lucia', 'St Kitts and Nevis', 'Turks and Caicos Islands', 'Honduras', 'Guatemala'],
    'South America': ['Argentina', 'Brazil', 'Colombia', 'Ecuador', 'Uruguay', 'Peru', 'Chile', 'Paraguay']
  };
  var C2R = {}; Object.keys(REG).forEach(function (r) { REG[r].forEach(function (c) { C2R[c] = r; }); });
  function region(c) { return C2R[c] || 'Other'; }

  var W = {
    live: { match: 0.35, ti: 0.25, ontime: 0.25, clean: 0.15 },
    holiday: { match: 0.35, ti: 0.30, ontime: 0.15, clean: 0.20 },
    rental: { match: 0.30, ti: 0.25, ontime: 0.10, clean: 0.20, returns: 0.15 }
  };
  var GOALN = { live: 'live in it', holiday: 'holiday home', rental: 'rental income' };
  var MUST = {
    escrow: { label: 'deposit protection', q: 'escrow', test: function (c) { return (c.checks || {}).escrow === true; } },
    permit: { label: 'permit number public', q: 'permit', test: function (c) { return (c.checks || {}).permit === 2; } },
    freehold: { label: 'freehold title', q: 'freehold', test: function (c) { var t = c.title || ''; return /freehold|fee simple/i.test(t) && !/lease/i.test(t); } },
    soon: { label: 'completion within 2 years', q: '', test: function (c) { return c.stage === 'completed' || (c.done != null && +c.done >= YEAR && +c.done <= YEAR + 2 && !(c.overdue > 0)); } }
  };
  var BANDQ = { 'Under $100k': 'under 100k', '$100k to $200k': 'under 200k', '$200k to $400k': 'under 400k' };

  var D = null, TI = null, TIM = {};

  function pct(x) { return Math.round(x * 100) + '%'; }
  function of(a, b) { return a + ' of ' + b + ' (' + pct(b ? a / b : 0) + ')'; }

  function state() {
    var f = $('mmF');
    var band = (f.querySelector('input[name=band]:checked') || {}).value || 'any';
    var goal = (f.querySelector('input[name=goal]:checked') || {}).value || 'live';
    var must = [].map.call(f.querySelectorAll('input[name=must]:checked'), function (i) { return i.value; });
    var regs = [].map.call(f.querySelectorAll('input[name=reg]:checked'), function (i) { return i.value; });
    return { band: band, goal: goal, must: must, regs: regs };
  }

  function rank(S) {
    var by = {};
    D.cases.forEach(function (c) {
      if (!c || !c.market || !TIM[c.market]) return;
      if (S.regs.indexOf(region(c.country)) < 0) return;
      if (S.band !== 'any' && c.band !== S.band) return;
      (by[c.market] = by[c.market] || []).push(c);
    });
    var w = W[S.goal];
    var rows = Object.keys(by).filter(function (m) { return by[m].length >= MINP; }).map(function (m) {
      var P = by[m], n = P.length, t = TIM[m];
      var match = P.filter(function (c) { return S.must.every(function (k) { return MUST[k].test(c); }); }).length;
      var over = P.filter(function (c) { return c.overdue > 0; }).length;
      var prob = P.filter(function (c) { return (c.flags || []).length > 0; }).length;
      var ret = P.filter(function (c) { return (c.checks || {}).returns_ok === true; }).length;
      var f = { match: S.must.length ? match / n : null, ti: t.index / 100, ontime: 1 - over / n, clean: 1 - prob / n, returns: ret / n };
      var sw = 0, s = 0;
      Object.keys(w).forEach(function (k) { if (f[k] == null) return; sw += w[k]; s += w[k] * f[k]; });
      return { market: m, country: t.country, n: n, match: match, over: over, prob: prob, ret: ret, ti: t, f: f, fit: Math.round(100 * s / sw) };
    });
    rows.sort(function (a, b) { return b.fit - a.fit || b.match - a.match || b.ti.index - a.ti.index || (a.market < b.market ? -1 : 1); });
    return rows;
  }

  function casesQ(r, S) {
    var q = [r.market];
    S.must.forEach(function (k) { if (MUST[k].q) q.push(MUST[k].q); });
    if (BANDQ[S.band]) q.push(BANDQ[S.band]);
    return '/cases?q=' + encodeURIComponent(q.join(' '));
  }

  function bar(label, val, txt, bad) {
    return '<li><span class="mm-l">' + label + '</span><span class="mm-bar' + (bad ? ' bad' : '') + '" role="img" aria-label="' + esc(label + ': ' + txt) + '"><i style="width:' + Math.max(0, Math.min(100, val * 100)).toFixed(1) + '%"></i></span><b>' + txt + '</b></li>';
  }

  function card(r, i, S) {
    var t = r.ti, why = '';
    if (S.must.length) why += bar('Meet all your must-haves', r.f.match, of(r.match, r.n));
    why += bar('Transparency index', t.index / 100, t.index.toFixed(1) + ' / 100, rank ' + t.rank + ' of ' + TI.rows.length);
    why += bar('Overdue', r.over / r.n, of(r.over, r.n), true);
    why += bar('Public problems', r.prob / r.n, of(r.prob, r.n), true);
    if (S.goal === 'rental') why += bar('Return claims look realistic', r.ret / r.n, of(r.ret, r.n));
    var bandTxt = S.band === 'any' ? 'all budgets' : S.band;
    return '<li class="mm-card"><div class="mm-h"><span class="mm-rank" aria-hidden="true">' + (i + 1) + '</span><div class="mm-t"><h3>' + esc(r.market) + '</h3><p>' + esc(r.country) + ' · ' + r.n + ' projects tracked in ' + esc(bandTxt) + '</p></div>' +
      '<div class="mm-fit"><b>' + r.fit + '</b><span>fit for you</span></div></div><ul class="mm-why">' + why + '</ul>' +
      '<div class="mm-links"><a class="btn btn-line btn-sm" href="/m/?market=' + encodeURIComponent(r.market) + '">' + esc(r.market) + ' market file</a>' +
      '<a class="btn btn-hi btn-sm" href="' + casesQ(r, S) + '">' + (S.must.length ? 'See matching projects' : 'See projects') + '</a></div></li>';
  }

  function render() {
    if (!D) return;
    var S = state(), rows = rank(S), top = rows.slice(0, 5);
    var mustTxt = S.must.length ? S.must.map(function (k) { return MUST[k].label; }).join(', ') : 'no must-haves';
    var bandTxt = S.band === 'any' ? 'any budget' : S.band;
    var sum = '';
    if (!S.regs.length) sum = '<p class="mm-empty">Pick at least one region to see a ranking.</p>';
    else if (!rows.length) sum = '<p class="mm-empty">No market has ' + MINP + ' or more tracked projects in ' + esc(bandTxt) + ' in the regions you picked. <button type="button" class="tl-link" data-widen>Try any budget</button></p>';
    else sum = '<p><b>' + rows.length + ' market' + (rows.length > 1 ? 's' : '') + '</b> compared for a ' + esc(GOALN[S.goal]) + ', ' + esc(bandTxt) + ', with ' + esc(mustTxt) + '.' +
      (rows.length < 5 ? ' Only ' + rows.length + ' qualif' + (rows.length > 1 ? 'y' : 'ies') + ' with at least ' + MINP + ' projects in your band.' : ' Top 5 below.') + '</p>' +
      (S.must.indexOf('soon') >= 0 ? '<p class="tl-hint">The project list links filter by market, must-haves and price, but not by completion date.</p>' : '') +
      (BANDQ[S.band] ? '<p class="tl-hint">On the project list the price filter shows everything up to the top of your band.</p>' : '');
    $('mmSum').innerHTML = sum;
    $('mmOut').innerHTML = top.map(function (r, i) { return card(r, i, S); }).join('');
    var mw = $('mmMoreW');
    if (rows.length > 5) {
      mw.hidden = false;
      $('mmMore').innerHTML = '<caption class="sr-only">Every qualifying market, ranked</caption><thead><tr><th scope="col">#</th><th scope="col">Market</th><th scope="col">Fit</th>' + (S.must.length ? '<th scope="col">Must-haves met</th>' : '') + '<th scope="col">Index</th><th scope="col">Overdue</th><th scope="col">Problems</th></tr></thead><tbody>' +
        rows.map(function (r, i) { return '<tr><td>' + (i + 1) + '</td><td><a href="/m/?market=' + encodeURIComponent(r.market) + '">' + esc(r.market) + '</a></td><td>' + r.fit + '</td>' + (S.must.length ? '<td>' + r.match + '/' + r.n + '</td>' : '') + '<td>' + r.ti.index.toFixed(1) + '</td><td>' + r.over + '/' + r.n + '</td><td>' + r.prob + '/' + r.n + '</td></tr>'; }).join('') + '</tbody>';
    } else mw.hidden = true;
    var w = W[S.goal], names = { match: 'must-have match', ti: 'transparency index', ontime: 'not overdue', clean: 'no public problems', returns: 'realistic return claims' };
    $('mmW').innerHTML = 'Weights for a <b>' + esc(GOALN[S.goal]) + '</b>: ' + Object.keys(w).filter(function (k) { return k !== 'match' || S.must.length; }).map(function (k) { return names[k] + ' ' + Math.round(w[k] * 100) + '%'; }).join(', ') +
      (S.must.length ? '' : ' (with no must-haves ticked, the other weights are scaled up to 100%)') + '. The fit score is the weighted average, from 0 to 100.';
    try { history.replaceState(null, '', '?' + new URLSearchParams({ band: S.band, goal: S.goal, must: S.must.join(','), reg: S.regs.length === Object.keys(REGS_PRESENT).length ? 'all' : S.regs.join('|') }).toString()); } catch (e) {}
  }

  var REGS_PRESENT = {};
  function init(d) {
    D = d; TI = K.compute(d); TI.rows.forEach(function (r) { TIM[r.market] = r; });
    var qs; try { qs = new URLSearchParams(location.search); } catch (e) { qs = { get: function () { return null; } }; }
    var present = {}; d.cases.forEach(function (c) { if (c && c.band) present[c.band] = 1; });
    var bands = BAND_ORDER.filter(function (b) { return present[b]; }).concat(Object.keys(present).filter(function (b) { return BAND_ORDER.indexOf(b) < 0 && b !== NOPRICE; }).sort());
    var qb = qs.get('band'); if (bands.indexOf(qb) < 0) qb = 'any';
    $('mmBand').innerHTML = ['any'].concat(bands).map(function (b) {
      return '<label class="tl-chip"><input type="radio" name="band" value="' + esc(b) + '"' + (b === qb ? ' checked' : '') + '><span>' + esc(b === 'any' ? 'Any budget' : b) + '</span></label>';
    }).join('');
    d.cases.forEach(function (c) { if (c && TIM[c.market]) REGS_PRESENT[region(c.country)] = (REGS_PRESENT[region(c.country)] || 0) + 1; });
    var qr = qs.get('reg'), sel = qr && qr !== 'all' ? qr.split('|') : null;
    var order = Object.keys(REG).concat(['Other']).filter(function (r) { return REGS_PRESENT[r]; });
    $('mmReg').innerHTML = order.map(function (r) {
      return '<label class="tl-chip"><input type="checkbox" name="reg" value="' + esc(r) + '"' + (!sel || sel.indexOf(r) >= 0 ? ' checked' : '') + '><span>' + esc(r) + '</span></label>';
    }).join('');
    var g = qs.get('goal'); if (W[g]) $('mmF').querySelector('input[name=goal][value=' + g + ']').checked = true;
    var mu = qs.get('must'); if (mu !== null) { var ms = mu.split(','); [].forEach.call($('mmF').querySelectorAll('input[name=must]'), function (i) { i.checked = ms.indexOf(i.value) >= 0; }); }
    $('mmUpd').textContent = d.cases.length + ' projects in ' + TI.rows.length + ' markets with 3 or more projects. Data updated ' + K.fmtDate(d.updated) + '.';
    render();
  }

  function setAll(v) { [].forEach.call($('mmF').querySelectorAll('input[name=reg]'), function (i) { i.checked = v; }); render(); }
  document.addEventListener('DOMContentLoaded', function () {
    if (!K) { $('mmUpd').textContent = 'The ranking could not load. Please refresh the page.'; return; }
    $('mmF').addEventListener('change', render);
    $('mmAll').addEventListener('click', function () { setAll(true); });
    $('mmNone').addEventListener('click', function () { setAll(false); });
    $('mmSum').addEventListener('click', function (e) { if (e.target.closest('[data-widen]')) { var a = $('mmF').querySelector('input[name=band][value=any]'); if (a) { a.checked = true; render(); } } });
    fetch(K.dataUrl()).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(init).catch(function () {
      $('mmUpd').textContent = 'The database could not load right now. Please refresh the page in a minute.';
    });
  });
})();
