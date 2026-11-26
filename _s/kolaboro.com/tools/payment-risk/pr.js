/* Kolaboro payment plan risk score: risk from the plan structure, money-at-risk curve (inline SVG), changes to ask for */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(v) { var s = String(v == null ? '' : v).replace(/[\s,%]/g, ''); return s === '' ? NaN : parseFloat(s); }
  function n0(v) { var x = num(v); return isFinite(x) ? x : 0; }
  function clamp(x) { return Math.max(0, Math.min(1, x)); }
  var MS = 864e5, MO = 30.4375;
  function iso(d) { return d.toISOString().slice(0, 10); }
  function addMo(d, m) { var x = new Date(d.getTime()); x.setUTCMonth(x.getUTCMonth() + m); return x; }
  function parse(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null; }
  function mon(a, b) { return (b - a) / MS / MO; }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtD(d) { return MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }
  function fmtP(x) { return (Math.round(x * 10) / 10) + '%'; }

  var TRIG = [['signing', 'At signing'], ['date', 'Calendar date'], ['found', 'Foundations'], ['struct', 'Structure complete'], ['finish', 'Finishing'], ['hand', 'Handover'], ['post', 'After handover']];
  var TN = {}; TRIG.forEach(function (t) { TN[t[0]] = t[1]; });
  var today = new Date(); today = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  var rows = [
    { l: 'Reservation and down payment', p: 10, t: 'signing' },
    { l: 'Instalment 1', p: 10, t: 'date', d: iso(addMo(today, 2)) },
    { l: 'Instalment 2', p: 10, t: 'date', d: iso(addMo(today, 6)) },
    { l: 'Instalment 3', p: 10, t: 'date', d: iso(addMo(today, 12)) },
    { l: 'Structure complete', p: 20, t: 'struct' },
    { l: 'Handover', p: 40, t: 'hand' }
  ];

  function draw() {
    $('prRows').innerHTML = rows.map(function (r, i) {
      var extra = r.t === 'date' ? '<label class="tl-in">Due date<input type="date" data-i="' + i + '" data-k="d" value="' + esc(r.d || '') + '"></label>'
        : r.t === 'post' ? '<label class="tl-in">Months after keys<input inputmode="numeric" data-i="' + i + '" data-k="m" value="' + esc(r.m != null ? r.m : 12) + '"></label>'
        : '<div class="pr-ph" aria-hidden="true"></div>';
      return '<div class="pr-row"><label class="tl-in pr-l">Payment<input data-i="' + i + '" data-k="l" value="' + esc(r.l) + '"></label>' +
        '<label class="tl-in pr-p">% of price<input inputmode="decimal" data-i="' + i + '" data-k="p" value="' + esc(r.p) + '"></label>' +
        '<label class="tl-in pr-t">Due when<select data-i="' + i + '" data-k="t">' + TRIG.map(function (t) { return '<option value="' + t[0] + '"' + (t[0] === r.t ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select></label>' +
        extra + '<button type="button" class="pr-del" data-del="' + i + '" aria-label="Remove ' + esc(r.l || 'payment') + '">&times;</button></div>';
    }).join('');
    calc();
  }

  function timeline(delay) {
    var S = parse($('prS').value) || today, T = parse($('prT').value), H = parse($('prH').value);
    if (!H || H <= S) H = addMo(S, 30);
    if (!T || T <= S || T > H) T = new Date(S.getTime() + (H - S) * 0.6);
    var tS = mon(S, T), tH = mon(S, H), k = tH > 0 ? (tH + delay) / tH : 1;
    var ms = { signing: 0, found: tS * 0.25 * k, struct: tS * k, finish: (tS + (tH - tS) / 2) * k, hand: tH * k };
    return { S: S, T: T, H: H, tS: tS * k, tH: tH * k, ms: ms };
  }
  function when(r, tl) {
    if (r.t === 'date') { var d = parse(r.d); return d ? Math.max(0, mon(tl.S, d)) : 0; }
    if (r.t === 'post') return tl.ms.hand + Math.max(0, n0(r.m != null ? r.m : 12));
    return tl.ms[r.t] || 0;
  }

  function score(tl) {
    var tot = 0, sign = 0, pre = 0, dated = 0, held = 0, post = 0;
    rows.forEach(function (r) {
      var p = Math.max(0, n0(r.p)), w = when(r, tl); tot += p;
      if (r.t === 'signing') sign += p;
      if (r.t === 'date') dated += p;
      if (r.t === 'hand' || r.t === 'post') held += p;
      if (r.t === 'post') post += p;
      if (r.t !== 'struct' && r.t !== 'finish' && r.t !== 'hand' && r.t !== 'post' && w < tl.tS - 1e-6) pre += p;
    });
    var after = Math.max(0, tot - sign), ev = ($('prF').querySelector('input[name=esc]:checked') || {}).value || 'unsure';
    var A = 35 * clamp((pre - 20) / 40), B = 25 * (after > 0 ? clamp(dated / after) : 0), Cc = 20 * clamp((20 - held) / 15), Dd = ev === 'yes' ? 0 : ev === 'no' ? 20 : 15;
    return { tot: tot, sign: sign, pre: pre, dated: dated, after: after, held: held, post: post, esc: ev, A: A, B: B, C: Cc, D: Dd, s: Math.round(A + B + Cc + Dd) };
  }

  function curve(tl) {
    var ev = rows.map(function (r) { return { t: when(r, tl), p: Math.max(0, n0(r.p)), r: r }; }).sort(function (a, b) { return a.t - b.t; });
    var end = Math.max(tl.tH, ev.length ? ev[ev.length - 1].t : 0) + 2;
    function paid(t) { var s = 0; ev.forEach(function (e) { if (e.t <= t + 1e-9) s += e.p; }); return s; }
    function built(t) { return tl.tH > 0 ? 100 * clamp(t / tl.tH) : 100; }
    var peak = 0, peakT = 0, N = 240;
    for (var i = 0; i <= N; i++) { var t = end * i / N, r = paid(t) - built(t); if (r > peak) { peak = r; peakT = t; } }
    ev.forEach(function (e) { var r = paid(e.t) - built(e.t); if (r > peak) { peak = r; peakT = e.t; } });
    return { ev: ev, end: end, paid: paid, built: built, peak: peak, peakT: peakT };
  }

  function svg(tl, cv) {
    var box = $('prChart'), Wd = Math.max(300, box.clientWidth || 600), Hd = Wd < 560 ? 240 : 300;
    var L = 44, R = 14, T = 16, B = 40, w = Wd - L - R, h = Hd - T - B;
    var ymax = Math.max(100, Math.ceil(cv.paid(cv.end) / 10) * 10);
    var x = function (t) { return L + w * t / cv.end; }, y = function (v) { return T + h * (1 - v / ymax); };
    var s = '<svg width="' + Wd + '" height="' + Hd + '" viewBox="0 0 ' + Wd + ' ' + Hd + '" role="img" aria-labelledby="prChT"><title id="prChT">' +
      esc('Money at risk over time. Peak ' + fmtP(cv.peak) + ' of the price, about ' + Math.round(cv.peakT) + ' months after signing.') + '</title>';
    [0, 25, 50, 75, 100].forEach(function (v) { if (v > ymax) return; s += '<line x1="' + L + '" x2="' + (L + w) + '" y1="' + y(v) + '" y2="' + y(v) + '" class="g"/><text x="' + (L - 8) + '" y="' + (y(v) + 4) + '" class="ax" text-anchor="end">' + v + '%</text>'; });
    var step = cv.end > 48 ? 12 : cv.end > 24 ? 6 : 3;
    for (var m = 0; m <= cv.end; m += step) s += '<text x="' + x(m) + '" y="' + (T + h + 18) + '" class="ax" text-anchor="middle">' + m + '</text>';
    s += '<text x="' + (L + w) + '" y="' + (Hd - 4) + '" class="ax" text-anchor="end">months after signing</text>';
    // risk area: sample paid minus built
    var N = 300, top = [], bot = [];
    for (var i = 0; i <= N; i++) { var t = cv.end * i / N, p = cv.paid(t), b = cv.built(t); top.push([x(t), y(Math.max(p, b))]); bot.push([x(t), y(b)]); }
    s += '<path class="risk" d="M' + top.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join('L') + 'L' + bot.reverse().map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join('L') + 'Z"/>';
    s += '<polyline class="built" points="' + x(0) + ',' + y(0) + ' ' + x(tl.tH) + ',' + y(100) + ' ' + x(cv.end) + ',' + y(100) + '"/>';
    var pts = [[x(0), y(0)]], acc = 0;
    cv.ev.forEach(function (e) { pts.push([x(e.t), y(acc)]); acc += e.p; pts.push([x(e.t), y(acc)]); });
    pts.push([x(cv.end), y(acc)]);
    s += '<polyline class="paid" points="' + pts.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' ') + '"/>';
    var close = x(tl.tH) - x(tl.tS) < 150;
    [[tl.tS, 'Structure'], [tl.tH, 'Handover']].forEach(function (m, j) {
      var ty = close && j ? T + h - 8 : T + 12;
      s += '<line class="mk" x1="' + x(m[0]) + '" x2="' + x(m[0]) + '" y1="' + T + '" y2="' + (T + h) + '"/><text class="mkt" x="' + (x(m[0]) + (j ? -5 : 5)) + '" y="' + ty + '" text-anchor="' + (j ? 'end' : 'start') + '">' + m[1] + '</text>';
    });
    if (cv.peak > 0.05) s += '<circle class="pk" cx="' + x(cv.peakT) + '" cy="' + y(cv.paid(cv.peakT)) + '" r="5"/>';
    return s + '</svg>';
  }

  function money(pct) { var P = num($('prP').value); return isFinite(P) && P > 0 ? ' (' + Math.round(P * pct / 100).toLocaleString('en') + ')' : ''; }

  function calc() {
    var delay = +$('prD').value, tl0 = timeline(0), tl = timeline(delay), sc = score(tl0), cv = curve(tl);
    $('prSum').textContent = 'Total: ' + fmtP(sc.tot) + (Math.abs(sc.tot - 100) > 0.05 ? ' (should be 100%)' : '');
    $('prSum').className = 'pr-sumtxt' + (Math.abs(sc.tot - 100) > 0.05 ? ' bad' : '');
    $('oS').textContent = sc.s;
    var band = sc.s >= 60 ? ['High risk', 'hi'] : sc.s >= 30 ? ['Medium risk', 'md'] : ['Lower risk', 'lo'];
    $('oB').textContent = band[0]; $('oB').className = 'pr-band ' + band[1];
    $('oM').style.width = sc.s + '%'; $('oM').className = band[1];
    var parts = [
      ['Paid before the structure exists', fmtP(sc.pre) + money(sc.pre), sc.A, 35],
      ['Due on dates, not milestones', fmtP(sc.after ? 100 * sc.dated / sc.after : 0) + ' of money after signing', sc.B, 25],
      ['Held back until handover or later', fmtP(sc.held) + money(sc.held), sc.C, 20],
      ['Deposit protection', sc.esc === 'yes' ? 'Yes' : sc.esc === 'no' ? 'No' : 'Not sure', sc.D, 20]
    ];
    $('oParts').innerHTML = parts.map(function (p) { return '<div class="row2 pr-pt"><span>' + p[0] + '<small>' + esc(p[1]) + '</small></span><b>+' + Math.round(p[2]) + '<small>/' + p[3] + '</small></b></div>'; }).join('');
    $('prDv').textContent = delay ? delay + ' month' + (delay > 1 ? 's' : '') + ' late: milestone payments move, date payments do not' : 'On time';
    $('prChart').innerHTML = svg(tl, cv);
    var pd = new Date(tl.S.getTime() + cv.peakT * MO * MS);
    $('prPeak').innerHTML = cv.peak > 0.05 ? 'Peak money at risk: <b>' + fmtP(cv.peak) + ' of the price' + esc(money(cv.peak)) + '</b> around ' + fmtD(pd) + (delay ? ', with construction ' + delay + ' months late' : '') + '.' + (sc.esc === 'yes' ? ' Escrow lowers this risk only if releases are tied to verified progress.' : '')
      : 'At no point have you paid more than what has been built, on this timeline.';
    asks(sc, tl0, timeline(delay || 6));
  }

  function asks(sc, tl0, tlLate) {
    var A = [];
    var rS = parse($('prS').value), rT = parse($('prT').value), rH = parse($('prH').value);
    if (rS && rH && rH <= rS) A.push('Your handover date is not after the signing date, so this page assumed handover 30 months after signing. Check the dates in the timeline above.');
    else if (rT && rH && rT > rH) A.push('Your structure date is after your handover date, so this page placed the structure 60% of the way to handover. Check the dates in the timeline above.');
    if (Math.abs(sc.tot - 100) > 0.05) A.push('Your payments add up to ' + fmtP(sc.tot) + '. Check the plan against the contract before reading the rest.');
    if (sc.pre > 30) A.push('Lower what you pay before the structure is complete. Today it is ' + fmtP(sc.pre) + ' of the price; ask to move payments to structure and handover until it is about 30% or less.');
    if (sc.sign > 20) A.push('The payment at signing is ' + fmtP(sc.sign) + '. Ask for a smaller reservation and down payment, since nothing is built yet when you pay it.');
    var lateDates = [];
    rows.forEach(function (r) {
      if (r.t !== 'date') return;
      var d = parse(r.d), w = when(r, tlLate);
      A.push('Change "' + (r.l || 'payment') + '" (' + fmtP(n0(r.p)) + (d ? ', due ' + fmtD(d) : '') + ') from a calendar date to a construction milestone, confirmed by an independent engineer or the regulator before you pay.');
      if (w < tlLate.tS) lateDates.push(r);
    });
    if (lateDates.length && sc.dated) A.push('If construction runs 6 months late, ' + lateDates.length + ' date payment' + (lateDates.length > 1 ? 's' : '') + ' would still fall due before the structure is complete. Ask for a clause that pauses date payments while the project is behind schedule.');
    if (sc.held < 10) A.push('Keep at least 10% until handover, paid after a snagging inspection and the title transfer, so you have leverage to get defects fixed. Today it is ' + fmtP(sc.held) + '.');
    if (sc.esc !== 'yes') A.push('Ask for every payment to go to a project escrow or trust account, with the account number written into the contract, and check it in the official register where one exists.');
    if (sc.post > 0) A.push('You pay ' + fmtP(sc.post) + ' after handover. Ask what happens if you miss one: penalties, interest, and whether the title is held back until the last payment.');
    A.push('Ask for a late-delivery penalty and a final cut-off date after which you can cancel and get your payments back.');
    $('prAsk').innerHTML = A.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('prS').value = iso(today); $('prT').value = iso(addMo(today, 18)); $('prH').value = iso(addMo(today, 30));
    var box = $('prRows');
    box.addEventListener('input', function (e) { var i = e.target.dataset.i; if (i === undefined) return; rows[i][e.target.dataset.k] = e.target.value; calc(); });
    box.addEventListener('change', function (e) {
      var i = e.target.dataset.i; if (i === undefined) return; rows[i][e.target.dataset.k] = e.target.value;
      if (e.target.dataset.k === 't') { if (e.target.value === 'date' && !rows[i].d) rows[i].d = iso(addMo(today, 3)); draw(); var s = box.querySelector('select[data-i="' + i + '"]'); if (s) s.focus(); } else calc();
    });
    box.addEventListener('click', function (e) { var b = e.target.closest('[data-del]'); if (!b) return; rows.splice(+b.dataset.del, 1); draw(); var a = $('prAdd'); if (a) a.focus(); });
    $('prAdd').addEventListener('click', function () { rows.push({ l: 'New payment', p: 0, t: 'found' }); draw(); var inp = box.querySelectorAll('.pr-row')[rows.length - 1]; if (inp) inp.querySelector('input').focus(); });
    ['prS', 'prT', 'prH', 'prP', 'prD'].forEach(function (id) { $(id).addEventListener('input', calc); $(id).addEventListener('change', calc); });
    $('prF').addEventListener('change', function (e) { if (e.target.name === 'esc') calc(); });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(calc, 120); });
    draw();
  });
})();
