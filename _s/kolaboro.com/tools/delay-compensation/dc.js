(function(){
  'use strict';
  var $ = function(i){ return document.getElementById(i); };
  var CUR = ['USD','EUR','GBP','AED','IDR','THB','MXN','PHP','MYR','SGD','AUD','CAD','CHF','HKD','INR','JPY','ZAR','TRY','SAR','QAR'];
  var MD = 365.25 / 12, DAY = 864e5;
  function num(v){ v = String(v == null ? '' : v).replace(/[\s,%]/g, ''); if (v === '') return NaN; return parseFloat(v); }
  function money(v, c){ try { return new Intl.NumberFormat('en', { style:'currency', currency:c, maximumFractionDigits:0 }).format(v); } catch(e){ return c + ' ' + Math.round(v).toLocaleString('en'); } }
  function r1(v){ return (Math.round(v * 10) / 10).toLocaleString('en'); }
  function iso(d){ return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function pd(s){ if (!s) return null; var d = new Date(s + 'T00:00:00'); return isNaN(d) ? null : d; }
  function fdate(d){ return d ? d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : ''; }
  function addM(d, m){ var w = Math.floor(m), f = m - w, x = new Date(d.getFullYear(), d.getMonth() + w, d.getDate()); if (x.getDate() !== d.getDate()) x.setDate(0); return f ? new Date(x.getTime() + f * MD * DAY) : x; }
  function mBetween(a, b){
    if (b <= a) return -mBetween(b, a);
    var m = (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth();
    var x = addM(a, m); if (x > b) { m--; x = addM(a, m); }
    return m + (b - x) / DAY / MD;
  }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }

  var sel = $('dcC'); CUR.forEach(function(c){ var o = document.createElement('option'); o.value = o.textContent = c; sel.appendChild(o); }); sel.value = 'USD';
  var today = new Date(); today.setHours(0, 0, 0, 0);
  $('dcD1').value = iso(addM(today, -4)); $('dcD2').value = iso(addM(today, 8));

  var LABEL = { none: 'No payment for delay', day: 'Amount per day', month: 'Amount per month', ppm: 'Rate, % of price per month', ppy: 'Rate, % of amount paid per year' };
  var DEF = { day: '50', month: '1,000', ppm: '0.5', ppy: '6' };
  var lastType = 'ppm';
  function type(){ var r = document.querySelector('input[name=dct]:checked'); return r ? r.value : 'none'; }

  function calc(){
    var t = type(), c = sel.value;
    if (t !== lastType) {
      if (t !== 'none') $('dcV').value = DEF[t];
      lastType = t;
    }
    $('dcVT').textContent = LABEL[t];
    $('dcV').disabled = t === 'none';
    var P = num($('dcP').value), Pd = num($('dcPd').value), V = num($('dcV').value), G = Math.max(0, num($('dcG').value) || 0);
    var capP = num($('dcCap').value), capB = $('dcCapB').value, full = $('dcFull').value === 'yes', rent = num($('dcRent').value), can = num($('dcCan').value);
    var d1 = pd($('dcD1').value), d2 = pd($('dcD2').value);
    var o1 = $('dcO1'), o2 = $('dcO2'), kv = $('dcKV');
    o2.className = 'mx-band';
    if (!d1 || !d2) { o1.textContent = 'Enter both dates'; o2.textContent = ''; kv.innerHTML = ''; $('dcChart').innerHTML = ''; $('dcCapTxt').textContent = ''; asks(null); return; }
    if (!(P > 0)) P = NaN; if (!(Pd >= 0)) Pd = NaN;
    var days = Math.round((d2 - d1) / DAY), months = mBetween(d1, d2);
    var gEnd = addM(d1, G), dAfter = Math.max(0, Math.round((d2 - gEnd) / DAY)), mAfter = Math.max(0, mBetween(gEnd, d2));
    var mPay = full ? Math.floor(mAfter + 1e-9) : mAfter;
    var perMonth = 0, raw = 0, needs = '';
    if (t === 'day') { if (V >= 0) { raw = V * dAfter; perMonth = V * MD; } else needs = 'the amount per day'; }
    else if (t === 'month') { if (V >= 0) { raw = V * mPay; perMonth = V; } else needs = 'the amount per month'; }
    else if (t === 'ppm') { if (V >= 0 && P > 0) { raw = P * V / 100 * mPay; perMonth = P * V / 100; } else needs = !(P > 0) ? 'the price' : 'the rate'; }
    else if (t === 'ppy') { if (V >= 0 && Pd >= 0) { raw = Pd * V / 100 * dAfter / 365; perMonth = Pd * V / 100 / 12; } else needs = !(Pd >= 0) ? 'the amount paid' : 'the rate'; }
    var capBase = capB === 'paid' ? Pd : P, cap = capP >= 0 && capBase >= 0 ? capBase * capP / 100 : Infinity;
    var owed = Math.min(raw, cap), capped = raw > cap;
    var capMonth = perMonth > 0 && isFinite(cap) ? G + cap / perMonth : null;
    var rentLost = rent > 0 ? rent * Math.max(0, months) : null;

    if (days <= 0) {
      o1.textContent = 'Not late';
      o2.textContent = days === 0 ? 'Handover on the promised date.' : 'Handover ' + r1(-months) + ' months before the promised date.';
      o2.classList.add('lo');
    } else if (needs) {
      o1.textContent = 'Enter ' + needs; o2.textContent = '';
    } else if (t === 'none') {
      o1.textContent = money(0, c); o2.textContent = 'Your contract pays nothing for delay. Check local law and the right to cancel.'; o2.classList.add('hi');
    } else {
      o1.textContent = money(owed, c);
      o2.textContent = mAfter <= 0 ? 'Still inside the ' + r1(G) + ' month grace period: nothing owed yet.' : capped ? 'Cap reached: the clause stops paying after about ' + r1(capMonth) + ' months late.' : 'For ' + r1(full ? mPay : mAfter) + ' months after the grace period.';
      o2.classList.add(mAfter <= 0 || capped ? 'hi' : rentLost != null && owed < rentLost * .5 ? 'md' : 'lo');
    }
    var rows = [];
    rows.push(['Months late', days > 0 ? r1(months) + ' (' + days.toLocaleString('en') + ' days)' : '0']);
    rows.push(['Grace period', r1(G) + ' months, to ' + fdate(gEnd)]);
    rows.push(['Months that count', days > 0 ? r1(full ? mPay : mAfter) + (full ? ' full months' : '') : '0']);
    if (t !== 'none' && !needs) {
      rows.push(['Clause before cap', money(raw, c)]);
      rows.push(['Cap', isFinite(cap) ? money(cap, c) + ' (' + r1(capP) + '% of ' + (capB === 'paid' ? 'paid' : 'price') + ')' : 'No cap']);
      rows.push(['Owed under the clause', money(owed, c)]);
      if (Pd > 0 && days > 0) rows.push(['As a yearly return on what you paid', r1(owed / Pd * 100 / (months / 12)) + '% a year']);
    }
    if (rentLost != null && days > 0) {
      rows.push(['Rent missed', money(rentLost, c)]);
      if (!needs) rows.push([owed >= rentLost ? 'Clause covers the rent, surplus' : 'Rent the clause does not cover', money(Math.abs(rentLost - (t === 'none' ? 0 : owed)), c)]);
    }
    if (can > 0) rows.push(['Right to cancel', days > 0 && months >= can ? 'Reached at ' + r1(can) + ' months late, ' + fdate(addM(d1, can)) : 'At ' + r1(can) + ' months late, ' + fdate(addM(d1, can))]);
    kv.innerHTML = rows.map(function(r){ return '<div><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>'; }).join('');
    chart({ d1: d1, d2: d2, gEnd: gEnd, G: G, months: months, capMonth: t === 'none' || needs ? null : capMonth, can: can > 0 ? can : null, t: t });
    asks({ t: t, G: G, months: months, mAfter: mAfter, capped: capped, cap: cap, owed: owed, rentLost: rentLost, can: can, full: full, days: days, c: c });
  }

  function chart(s){
    var box = $('dcChart'), W = Math.max(300, Math.min(1100, box.clientWidth - 8)), small = W < 560;
    var end = Math.max(s.months, s.G, s.can || 0, s.capMonth && s.capMonth < s.months * 1.6 ? s.capMonth : 0, 1) * 1.08;
    var pl = 10, pr = 10, by = small ? 70 : 64, bh = 28, H = small ? 170 : 160, fs = small ? 11 : 13;
    var x = function(m){ return pl + (W - pl - pr) * Math.max(0, Math.min(m, end)) / end; };
    var late = Math.max(0, s.months), g = Math.min(s.G, late), cm = s.capMonth != null ? Math.min(Math.max(s.capMonth, g), late) : late;
    var o = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-labelledby="dcSvgT"><title id="dcSvgT">Delay timeline: grace period, months that pay compensation, and months after the cap</title>';
    o += '<rect x="' + x(0) + '" y="' + by + '" width="' + (x(end) - x(0)) + '" height="' + bh + '" rx="6" fill="#ECEAE4"/>';
    if (g > 0) o += '<rect x="' + x(0) + '" y="' + by + '" width="' + (x(g) - x(0)) + '" height="' + bh + '" fill="#9AA3AB"/>';
    if (s.t !== 'none' && cm > g) o += '<rect x="' + x(g) + '" y="' + by + '" width="' + (x(cm) - x(g)) + '" height="' + bh + '" fill="#0B7A55"/>';
    var unpaidFrom = s.t === 'none' ? g : cm;
    if (late > unpaidFrom) o += '<rect x="' + x(unpaidFrom) + '" y="' + by + '" width="' + (x(late) - x(unpaidFrom)) + '" height="' + bh + '" fill="#FF5B14"/>';
    function mark(m, txt, up, col){
      var xx = x(m), anchor = xx < W * .15 ? 'start' : xx > W * .85 ? 'end' : 'middle';
      o += '<line x1="' + xx + '" x2="' + xx + '" y1="' + (up ? by - 14 : by + bh) + '" y2="' + (up ? by : by + bh + 14) + '" stroke="' + (col || '#17212B') + '" stroke-width="2"/>';
      o += '<text x="' + xx + '" y="' + (up ? by - 20 : by + bh + 30) + '" text-anchor="' + anchor + '" font-size="' + fs + '" font-weight="700" fill="' + (col || '#17212B') + '">' + esc(txt) + '</text>';
    }
    mark(0, 'Promised ' + fdate(s.d1), true);
    if (late > 0) mark(late, (s.d2 <= new Date() ? 'Handover ' : 'Expected ') + fdate(s.d2), true);
    var lowSeen = [];
    function low(m, txt, col){ if (lowSeen.some(function(v){ return Math.abs(x(v) - x(m)) < (small ? 90 : 130); })) return; lowSeen.push(m); mark(m, txt, false, col); }
    if (s.G > 0) low(s.G, 'Grace ends', '#59626B');
    if (s.capMonth != null && s.capMonth <= end) low(s.capMonth, 'Cap reached', '#B83A05');
    if (s.can) low(s.can, 'Can cancel', '#17212B');
    o += '</svg>';
    box.innerHTML = o;
    var leg = [];
    if (g > 0) leg.push('grey: grace, nothing paid');
    if (s.t !== 'none' && cm > g) leg.push('green: months the clause pays');
    if (late > unpaidFrom) leg.push('orange: months late with no compensation' + (s.t !== 'none' && s.capMonth != null && cm < late ? ' (cap reached)' : ''));
    $('dcCapTxt').textContent = late > 0 ? 'Bar shows ' + r1(late) + ' months late: ' + leg.join('; ') + '.' : 'Not late on these dates.';
  }

  function asks(s){
    var L = [];
    if (!s) { $('dcAsk').innerHTML = '<li><b>Enter the dates</b>The questions adapt to your clause and your delay.</li>'; return; }
    L.push(['What is the new handover date, in writing?', 'Ask for a dated construction schedule and the reason for the delay. A verbal "a few more months" changes nothing in the contract.', true]);
    L.push(['Does the clock stop for force majeure?', 'Ask which events the developer claims and the evidence for each. Many contracts extend the promised date for listed events, which shrinks the months that count.']);
    if (s.t === 'none') L.push(['Is there any remedy at all?', 'The contract pays nothing for delay. Ask your lawyer whether local law gives buyers a right to compensation, interest or cancellation anyway.', true]);
    if (s.G > 0) L.push(['When exactly does the grace period start and end?', 'Your contract allows ' + r1(s.G) + ' months of delay for free. Check whether it runs from the promised date, and whether the developer had to notify you to use it.']);
    if (s.capped) L.push(['Can the cap be lifted for a delay this long?', 'The cap of ' + money(s.cap, s.c) + ' is reached before handover, so every month after that is unpaid. Ask whether the cap still applies once you could cancel.', true]);
    if (s.t !== 'none') L.push(['How and when is compensation paid?', 'Ask whether it is paid in cash, deducted from your final payment, or only credited at handover. Deducting it from the next payment protects you best.']);
    if (s.full) L.push(['Are part months really ignored?', 'Your clause counts full months only. Check the exact wording: a day count or pro rata wording pays more.']);
    if (s.rentLost != null && s.owed < s.rentLost) L.push(['Will they cover the rent you are missing?', 'The clause pays ' + money(s.owed, s.c) + ' against about ' + money(s.rentLost, s.c) + ' of missed rent on your estimate. Use that gap when you negotiate a new date.']);
    if (s.can > 0) L.push(['What happens to your money if you cancel?', 'Ask whether you get everything back, with interest, within how many days, and whether payments are held in escrow. A right to cancel is worth little if the developer cannot pay.']);
    else L.push(['Can you cancel if the delay keeps growing?', 'Ask whether the contract gives you a right to cancel after a set delay, and on what terms.']);
    L.push(['Should you keep paying by date?', 'If your plan has payments on calendar dates, ask your lawyer whether you must keep paying while building is late, or whether payments can follow verified progress.']);
    $('dcAsk').innerHTML = L.map(function(x){ return '<li' + (x[2] ? ' class="mx-hot"' : '') + '><b>' + esc(x[0]) + '</b>' + x[1] + '</li>'; }).join('');
  }

  $('dcF').addEventListener('input', calc);
  $('dcF').addEventListener('change', calc);
  ['dcP', 'dcPd', 'dcV', 'dcRent'].forEach(function(id){ $(id).addEventListener('blur', function(){ var v = num(this.value); if (v >= 1000) this.value = v.toLocaleString('en', { maximumFractionDigits: 2 }); }); });
  var rt; window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(calc, 150); });
  calc();
})();
