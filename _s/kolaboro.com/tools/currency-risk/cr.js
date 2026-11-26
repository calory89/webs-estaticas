(function(){
  'use strict';
  var $ = function(i){ return document.getElementById(i); };
  var CUR = [['USD','US dollar'],['EUR','Euro'],['GBP','British pound'],['AED','UAE dirham'],['IDR','Indonesian rupiah'],['THB','Thai baht'],['MXN','Mexican peso'],['PHP','Philippine peso'],['MYR','Malaysian ringgit'],['SGD','Singapore dollar'],['HKD','Hong Kong dollar'],['CNY','Chinese yuan'],['JPY','Japanese yen'],['KRW','South Korean won'],['INR','Indian rupee'],['AUD','Australian dollar'],['NZD','New Zealand dollar'],['CAD','Canadian dollar'],['CHF','Swiss franc'],['SEK','Swedish krona'],['NOK','Norwegian krone'],['DKK','Danish krone'],['PLN','Polish zloty'],['CZK','Czech koruna'],['HUF','Hungarian forint'],['TRY','Turkish lira'],['ZAR','South African rand'],['BRL','Brazilian real'],['SAR','Saudi riyal'],['QAR','Qatari riyal'],['ILS','Israeli shekel']];
  var MOVES = [-20, -10, 0, 10, 20];
  var autoRate = false, fetchSeq = 0;

  function num(v){ v = String(v == null ? '' : v).replace(/[\s,]/g, ''); if (v === '') return NaN; return parseFloat(v); }
  function money(v, c){
    try { return new Intl.NumberFormat('en', { style:'currency', currency:c, maximumFractionDigits:0, minimumFractionDigits:0 }).format(v); }
    catch(e){ return c + ' ' + Math.round(v).toLocaleString('en'); }
  }
  function rateFmt(r){
    if (!isFinite(r)) return '';
    var d = r >= 100 ? 2 : r >= 1 ? 4 : 6;
    return (+r.toFixed(d)).toLocaleString('en', { maximumFractionDigits: d });
  }
  function pct(v){ return (v > 0 ? '+' : '') + (Math.round(v * 10) / 10).toLocaleString('en') + '%'; }
  function iso(d){ return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function addM(d, m){ var x = new Date(d.getFullYear(), d.getMonth() + m, Math.min(d.getDate(), 28)); return x; }
  function fdate(s){ if (!s) return ''; var d = new Date(s + 'T00:00:00'); return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }); }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }

  var today = new Date(); today.setHours(0, 0, 0, 0);
  var todayIso = iso(today);

  ['crPC', 'crHC'].forEach(function(id){
    var s = $(id);
    CUR.forEach(function(c){ var o = document.createElement('option'); o.value = c[0]; o.textContent = c[0] + ' · ' + c[1]; s.appendChild(o); });
  });
  $('crPC').value = 'USD'; $('crHC').value = 'EUR';

  var rows = $('crRows'), rid = 0;
  function addRow(label, date, p){
    rid++;
    var d = document.createElement('div'); d.className = 'mx-row';
    d.innerHTML = '<label class="tl-in mx-lab">Payment<input class="r-l" value="' + esc(label || '') + '" autocomplete="off"></label>' +
      '<label class="tl-in">Date<input type="date" class="r-d" value="' + (date || '') + '"></label>' +
      '<label class="tl-in">% of price<input class="r-p" inputmode="decimal" autocomplete="off" value="' + (p == null ? '' : p) + '"></label>' +
      '<button type="button" class="mx-del" aria-label="Remove this payment">&times;</button>';
    d.querySelector('.mx-del').addEventListener('click', function(){ if (rows.children.length > 1) { d.remove(); calc(); } });
    rows.appendChild(d);
    return d;
  }
  addRow('Deposit on signing', iso(addM(today, 1)), 20);
  addRow('Construction milestone', iso(addM(today, 7)), 10);
  addRow('Construction milestone', iso(addM(today, 13)), 10);
  addRow('Construction milestone', iso(addM(today, 19)), 10);
  addRow('Handover', iso(addM(today, 30)), 50);
  $('crAdd').addEventListener('click', function(){
    var last = rows.lastElementChild, ld = last && last.querySelector('.r-d').value;
    var r = addRow('Payment', ld ? iso(addM(new Date(ld + 'T00:00:00'), 6)) : todayIso, '');
    r.querySelector('.r-l').focus(); calc();
  });

  function readRows(){
    return Array.prototype.map.call(rows.children, function(r){
      return { label: r.querySelector('.r-l').value.trim() || 'Payment', date: r.querySelector('.r-d').value, p: num(r.querySelector('.r-p').value) };
    });
  }

  function setSrc(t, bad){ var s = $('crRS'); s.textContent = t; s.classList.toggle('bad', !!bad); }
  function rateHint(){
    var pc = $('crPC').value, hc = $('crHC').value;
    $('crRH').textContent = '1 ' + pc + ' = how many ' + hc + '?';
  }

  function fetchRate(force){
    var pc = $('crPC').value, hc = $('crHC').value, seq = ++fetchSeq;
    if (pc === hc) { $('crR').value = '1'; autoRate = true; setSrc('Same currency: no exchange risk.'); calc(); return; }
    if (!force && $('crR').value && !autoRate) return;
    if (!window.fetch) { setSrc('Type today\'s rate from your bank.'); return; }
    setSrc('Asking for the ' + pc + ' to ' + hc + ' reference rate...');
    var urls = ['https://api.frankfurter.dev/v1/latest?from=' + pc + '&to=' + hc, 'https://api.frankfurter.app/latest?from=' + pc + '&to=' + hc];
    var via = 'Frankfurter';
    function ours(){   // our own ECB relay first (it also covers AED through the USD peg); Frankfurter only if it fails
      var cs = [pc, hc].filter(function(c){ return c !== 'EUR'; }).join(','), from = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);
      return fetch('/api/x/x/fx?c=' + cs + '&from=' + from).then(function(r){ if (!r.ok) throw new Error('http'); return r.json(); }).then(function(j){
        var n = j.dates.length - 1, per = function(c){ return c === 'EUR' ? 1 : (j.rates[c] || [])[n]; }, a = per(pc), b = per(hc);
        if (!(a > 0 && b > 0)) throw new Error('missing');
        via = 'our ECB relay'; return { v: b / a, date: j.dates[n] };
      });
    }
    function attempt(i){
      if (i === -1) return ours().catch(function(){ return attempt(0); });
      if (i >= urls.length) return Promise.reject(new Error('none'));
      var ctl = window.AbortController ? new AbortController() : null, t = ctl ? setTimeout(function(){ ctl.abort(); }, 6000) : 0;
      return fetch(urls[i], ctl ? { signal: ctl.signal } : {}).then(function(r){
        clearTimeout(t); if (!r.ok) throw new Error('http'); return r.json();
      }).then(function(j){
        var v = j && j.rates && j.rates[hc];
        if (!(v > 0)) throw new Error('missing');
        return { v: v, date: j.date };
      }).catch(function(e){ clearTimeout(t); if (e && e.message === 'missing') throw e; return attempt(i + 1); });
    }
    attempt(-1).then(function(res){
      if (seq !== fetchSeq) return;
      if ($('crPC').value !== pc || $('crHC').value !== hc) return;
      if ($('crR').value && !autoRate && !force) return;
      $('crR').value = rateFmt(res.v); autoRate = true;
      setSrc('Filled from the European Central Bank reference rate of ' + fdate(res.date) + ' via ' + via + '. Check it against your bank and edit if needed.');
      calc();
    }).catch(function(){
      if (seq !== fetchSeq) return;
      if (autoRate) { $('crR').value = ''; autoRate = false; }
      setSrc('No reference rate available for ' + pc + ' to ' + hc + ' right now. Type today\'s rate from your bank or transfer service.', true);
      calc();
    });
  }

  function svgChart(sc, hc, base){
    var box = $('crChart'), W = Math.max(300, Math.min(960, box.clientWidth - 8)), small = W < 520;
    var H = small ? 260 : 300, padL = small ? 8 : 16, padR = small ? 8 : 16, top = 34, bot = 46;
    var max = Math.max.apply(null, sc.map(function(s){ return s.total; })) * 1.08 || 1;
    var n = sc.length, gw = (W - padL - padR) / n, bw = Math.min(small ? 46 : 76, gw * .62);
    var y = function(v){ return top + (H - top - bot) * (1 - v / max); };
    var fs = small ? 11 : 13;
    var o = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-labelledby="crSvgT"><title id="crSvgT">Total paid in ' + hc + ' under each exchange rate scenario</title>';
    o += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y(0) + '" y2="' + y(0) + '" stroke="#17212B" stroke-width="1.5"/>';
    o += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y(base) + '" y2="' + y(base) + '" stroke="#17212B" stroke-width="1.2" stroke-dasharray="5 5" opacity=".55"/>';
    sc.forEach(function(s, i){
      var cx = padL + gw * i + gw / 2, yy = y(s.total), col = s.m === 0 ? '#17212B' : s.m > 0 ? '#FF5B14' : '#0B7A55';
      o += '<rect x="' + (cx - bw / 2) + '" y="' + yy + '" width="' + bw + '" height="' + Math.max(1, y(0) - yy) + '" rx="5" fill="' + col + '"' + (s.m === 0 ? '' : ' opacity="' + (Math.abs(s.m) >= 20 ? 1 : .72) + '"') + '/>';
      var lbl = compact(s.total, hc);
      o += '<text x="' + cx + '" y="' + (yy - 8) + '" text-anchor="middle" font-size="' + fs + '" font-weight="700" fill="#17212B">' + esc(lbl) + '</text>';
      o += '<text x="' + cx + '" y="' + (H - bot + 20) + '" text-anchor="middle" font-size="' + fs + '" font-weight="700" fill="#17212B">' + (s.m === 0 ? 'Today' : pct(s.m)) + '</text>';
      if (gw >= 84) o += '<text x="' + cx + '" y="' + (H - bot + 37) + '" text-anchor="middle" font-size="' + (fs - 1) + '" fill="#59626B">' + (s.m === 0 ? 'rate' : s.m > 0 ? 'you pay more' : 'you pay less') + '</text>';
    });
    o += '</svg>';
    box.innerHTML = o;
  }
  function compact(v, c){
    var a = Math.abs(v), s, d;
    if (a >= 1e9) { s = 'B'; d = v / 1e9; } else if (a >= 1e6) { s = 'M'; d = v / 1e6; } else if (a >= 1e4) { s = 'k'; d = v / 1e3; } else { return money(v, c); }
    var sym = money(0, c).replace(/[\d.,\s]/g, '') || c + ' ';
    var digits = Math.abs(d) >= 100 ? 0 : Math.abs(d) >= 10 ? 1 : 2;
    return sym + (+d.toFixed(digits)).toLocaleString('en') + s;
  }

  var last = null;
  function calc(){
    rateHint();
    var P = num($('crP').value), pc = $('crPC').value, hc = $('crHC').value, R = num($('crR').value), X = num($('crX').value);
    var rs = readRows(), sum = rs.reduce(function(a, r){ return a + (isFinite(r.p) ? r.p : 0); }, 0);
    var sumEl = $('crSum');
    sumEl.textContent = 'Total: ' + (Math.round(sum * 100) / 100) + '% of price' + (Math.abs(sum - 100) > .01 ? ' (should be 100%)' : '');
    sumEl.classList.toggle('bad', Math.abs(sum - 100) > .01);
    var kv = $('crKV'), o1 = $('crO1'), o2 = $('crO2');
    o2.className = 'mx-band';
    if (!(P > 0) || !(R > 0)) {
      o1.textContent = !(P > 0) ? 'Enter the price' : 'Enter today\'s rate';
      o2.textContent = !(P > 0) ? '' : 'Type the rate for 1 ' + pc + ' in ' + hc + ', or use Fetch rate.';
      kv.innerHTML = ''; $('crChart').innerHTML = '<p class="mx-cap">The chart appears once there is a price and a rate.</p>';
      $('crT').tBodies[0].innerHTML = ''; $('crPT').tBodies[0].innerHTML = ''; renderAdvice(null); last = null; return;
    }
    var paidP = 0, openP = 0;
    rs.forEach(function(r){ if (!isFinite(r.p)) return; if (r.date && r.date < todayIso) paidP += r.p; else openP += r.p; });
    var paidAmt = P * paidP / 100, openAmt = P * openP / 100;
    var moves = MOVES.slice();
    if (isFinite(X) && X !== 0 && X > -100 && moves.indexOf(X) < 0) { moves.push(X); moves.sort(function(a, b){ return a - b; }); }
    var sc = moves.map(function(m){ return { m: m, rate: R * (1 + m / 100), total: paidAmt * R + openAmt * R * (1 + m / 100) }; });
    var base = (paidAmt + openAmt) * R;
    var worst = sc.reduce(function(a, s){ return s.total > a.total ? s : a; }, sc[0]);
    var best = sc.reduce(function(a, s){ return s.total < a.total ? s : a; }, sc[0]);
    var extra = worst.total - base;
    if (pc === hc) {
      o1.textContent = money(base, hc); o2.textContent = 'Same currency: no exchange risk.'; o2.classList.add('lo');
    } else {
      o1.textContent = '+' + money(extra, hc);
      var share = base > 0 ? extra / base * 100 : 0;
      o2.textContent = 'more than at today\'s rate if ' + pc + ' gets ' + Math.round(worst.m) + '% stronger before you finish paying.';
      o2.classList.add(share >= 15 ? 'hi' : share >= 5 ? 'md' : 'lo');
    }
    var lastOpen = rs.filter(function(r){ return isFinite(r.p) && !(r.date && r.date < todayIso); }).sort(function(a, b){ return (a.date || '').localeCompare(b.date || ''); });
    var lastDate = lastOpen.length ? lastOpen[lastOpen.length - 1].date : '';
    kv.innerHTML =
      '<div><span>Total at today\'s rate</span><b>' + money(base, hc) + '</b></div>' +
      '<div><span>Range, ' + pct(best.m) + ' to ' + pct(worst.m) + '</span><b>' + money(best.total, hc) + ' to ' + money(worst.total, hc) + '</b></div>' +
      '<div><span>Still exposed (not yet paid)</span><b>' + money(openAmt, pc) + '</b></div>' +
      (paidP > 0 ? '<div><span>Already paid, not moved</span><b>' + (Math.round(paidP * 10) / 10) + '% of price</b></div>' : '') +
      (lastDate ? '<div><span>Exposed until</span><b>' + fdate(lastDate) + '</b></div>' : '');
    svgChart(sc, hc, base);
    $('crT').tBodies[0].innerHTML = sc.map(function(s){
      var cls = s.m === 0 ? ' class="mx-now"' : s === worst && s.m > 0 ? ' class="mx-worst"' : '';
      var name = s.m === 0 ? 'Today\'s rate' : pc + ' ' + Math.abs(s.m) + '% ' + (s.m > 0 ? 'stronger' : 'weaker');
      return '<tr' + cls + '><td>' + esc(name) + '</td><td>' + rateFmt(s.rate) + '</td><td>' + money(s.total, hc) + '</td><td>' + (s.m === 0 ? '' : (s.total - base >= 0 ? '+' : '') + money(s.total - base, hc)) + '</td></tr>';
    }).join('');
    $('crPT').tBodies[0].innerHTML = rs.map(function(r){
      if (!isFinite(r.p)) return '';
      var a = P * r.p / 100, paid = r.date && r.date < todayIso;
      return '<tr><td>' + esc(r.label) + (paid ? ' <span class="tl-tag">Paid</span>' : '') + '</td><td>' + (fdate(r.date) || 'No date') + '</td><td>' + money(a, pc) + '</td><td>' + money(a * R, hc) + '</td><td>' + (paid ? 'Already paid' : money(a * R * 1.2, hc)) + '</td></tr>';
    }).join('');
    var bigOne = lastOpen.reduce(function(a, r){ return r.p > a.p ? r : a; }, { p: 0 });
    last = { pc: pc, hc: hc, extra: extra, base: base, openAmt: openAmt, openP: openP, bigOne: bigOne, worst: worst, same: pc === hc };
    renderAdvice(last);
  }

  function renderAdvice(s){
    var L = [], el = $('crAdv');
    if (!s) {
      L.push(['Start with the numbers', 'Enter the price, the two currencies and today\'s rate. The advice below adapts to your plan.']);
    } else if (s.same) {
      L.push(['No exchange risk on this plan', 'You pay in the currency you earn. The remaining risks are the developer and the timeline: check them with the payment plan risk score.']);
    } else {
      var pair = [s.pc, s.hc].sort().join('/');
      L.push(['Know your worst case and keep a buffer', 'If ' + s.pc + ' gets ' + Math.round(s.worst.m) + '% stronger, the plan costs you ' + money(s.extra, s.hc) + ' more. Keep that amount available, or decide now which of the steps below you will use.', true]);
      L.push(['Stage your conversions', 'Change money in steps that follow the payment dates instead of all on the last day. You will not get the best rate, but you will not get the worst one on everything either. If you already hold the cash, converting part of it now fixes the cost of that part.']);
      L.push(['Lock the rate for known dates', 'Many banks and currency brokers sell forward contracts that fix today\'s rate, plus a cost, for a payment on a future date. Your payment dates are in the contract, so ask for quotes on the biggest ones and compare the cost with the worst case above.']);
      if (s.bigOne && s.bigOne.p >= 30 && s.openP > 0) L.push(['One date carries most of the risk', esc(s.bigOne.label) + ' is ' + (Math.round(s.bigOne.p * 10) / 10) + '% of the price on ' + (fdate(s.bigOne.date) || 'one date') + '. That single conversion matters most: plan it early, and remember a late handover moves it to a rate nobody knows yet.']);
      L.push(['Pay in the property currency if you can', 'If you earn, save or will collect rent in ' + s.pc + ', paying from that money removes the exchange step. Ask the developer which currency the contract is priced in, and whether you may pay in ' + s.hc + ' at a rate fixed in writing.']);
      L.push(['Compare the spread, not just the rate', 'The rate used here is a mid-market reference. Your bank or transfer service adds a margin and fees on every payment. Ask each provider what they would charge on your largest payment and compare.']);
      if (pair === 'AED/USD') L.push(['A pegged pair', 'The UAE dirham has been pegged to the US dollar for decades, so day to day moves between them are tiny. A peg can still change, so the scenarios are worth a look, but the realistic range is much narrower than for floating currencies.']);
    }
    el.innerHTML = L.map(function(x){ return '<li' + (x[2] ? ' class="mx-hot"' : '') + '><b>' + x[0] + '</b>' + x[1] + '</li>'; }).join('');
  }

  $('crF').addEventListener('input', function(e){
    if (e.target.id === 'crR') { autoRate = false; setSrc($('crR').value ? 'Your rate.' : ''); }
    calc();
  });
  $('crF').addEventListener('change', function(e){
    if (e.target.id === 'crPC' || e.target.id === 'crHC') {
      if (autoRate || !$('crR').value) { $('crR').value = ''; autoRate = true; fetchRate(true); }
      else setSrc('Currencies changed: update your rate, or use Fetch rate.', true);
      calc();
    }
  });
  $('crP').addEventListener('blur', function(){ var v = num(this.value); if (v > 0) this.value = v.toLocaleString('en', { maximumFractionDigits: 2 }); });
  $('crFetch').addEventListener('click', function(){ fetchRate(true); });
  var rt; window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(calc, 150); });
  calc();
  autoRate = true; fetchRate(true);
})();
