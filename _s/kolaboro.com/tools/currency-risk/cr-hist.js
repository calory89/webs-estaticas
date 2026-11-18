// Historical simulation for the currency risk tool (block X, 4 Nov 2026).
// Reads the plan from the form above (cr.js), fetches ECB daily reference rates through /api/x/x/fx,
// and replays the plan from every start date in the chosen window. Everything is computed here, in the browser.
(function(){
  'use strict';
  var $ = function(i){ return document.getElementById(i); };
  if (!$('crF') || !$('hsOut')) return;
  var ECB = ['EUR','USD','JPY','BGN','CZK','DKK','GBP','HUF','PLN','RON','SEK','CHF','ISK','NOK','TRY','AUD','BRL','CAD','CNY','HKD','IDR','ILS','INR','KRW','MXN','MYR','NZD','PHP','SGD','THB','ZAR','AED'];
  var cache = {}, seq = 0, win = 3, lastRes = null, applying = false;
  var DAY = 864e5;

  function num(v){ v = String(v == null ? '' : v).replace(/[\s,]/g, ''); if (v === '') return NaN; return parseFloat(v); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function money(v, c){ try { return new Intl.NumberFormat('en', { style:'currency', currency:c, maximumFractionDigits:0 }).format(v); } catch(e){ return c + ' ' + Math.round(v).toLocaleString('en'); } }
  function sgn(v, c){ return (v >= 0 ? '+' : '-') + money(Math.abs(v), c); }
  function pct(v){ return (v >= 0 ? '+' : '') + (Math.round(v * 10) / 10).toLocaleString('en') + '%'; }
  function iso(d){ return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function utc(s){ return Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)); }
  function fdate(s){ var d = new Date(utc(s)); return d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric', timeZone:'UTC' }); }
  var todayIso = iso(new Date()), today = utc(todayIso);

  function plan(){
    var P = num($('crP').value), pc = $('crPC').value, hc = $('crHC').value, R = num($('crR').value);
    var pays = [];
    Array.prototype.forEach.call($('crRows').children, function(r){
      var d = r.querySelector('.r-d').value, p = num(r.querySelector('.r-p').value);
      if (!isFinite(p) || p <= 0) return;
      pays.push({ d: d, p: p, off: d ? Math.round((utc(d) - today) / DAY) : 0, paid: !!(d && d < todayIso) });
    });
    return { P: P, pc: pc, hc: hc, R: R, pays: pays };
  }

  // ---------- data ----------
  function load(pc, hc){
    var need = [pc, hc].filter(function(c){ return c !== 'EUR'; }).sort();
    var key = need.join(',') || 'EUR';
    if (cache[key]) return cache[key];
    var p = fetch('/api/x/x/fx?c=' + encodeURIComponent(key) + '&from=2010-01-01').then(function(r){
      if (!r.ok) throw new Error('http ' + r.status); return r.json();
    }).then(function(j){
      if (!j || !j.dates || !j.dates.length) throw new Error('empty');
      j.via = 'kolaboro'; return j;
    }).catch(function(){
      // Fallback: Frankfurter, which republishes the same ECB reference rates.
      var sym = need.map(function(c){ return c === 'AED' ? 'USD' : c; }).filter(function(c, i, a){ return a.indexOf(c) === i; });
      var url = 'https://api.frankfurter.dev/v1/2010-01-01..?base=EUR' + (sym.length ? '&symbols=' + sym.join(',') : '');
      return fetch(url).then(function(r){ if (!r.ok) throw new Error('http'); return r.json(); }).then(function(f){
        var dates = Object.keys(f.rates || {}).sort(), rates = {};
        need.forEach(function(c){ rates[c] = dates.map(function(d){ var v = f.rates[d][c === 'AED' ? 'USD' : c]; return c === 'AED' ? v * 3.6725 : v; }); });
        return { source: 'European Central Bank reference rates, via Frankfurter (fallback)', query: url, dates: dates, rates: rates, first: dates[0], last: dates[dates.length - 1], n: dates.length, derived: need.indexOf('AED') >= 0 ? { AED: 'from USD with the fixed peg of 3.6725 AED per USD' } : {}, via: 'frankfurter' };
      });
    });
    cache[key] = p;
    p.catch(function(){ delete cache[key]; });
    return p;
  }

  // Home currency per 1 unit of property currency, on each ECB date.
  function cross(j, pc, hc){
    var a = pc === 'EUR' ? null : j.rates[pc], b = hc === 'EUR' ? null : j.rates[hc];
    return j.dates.map(function(_, i){ var x = a ? a[i] : 1, y = b ? b[i] : 1; return y / x; });
  }

  // ---------- simulation ----------
  function simulate(j, pl, years){
    var X = cross(j, pl.pc, pl.hc), T = j.dates.map(utc), n = T.length;
    var open = pl.pays.filter(function(p){ return !p.paid; });
    var paidAmt = pl.pays.filter(function(p){ return p.paid; }).reduce(function(a, p){ return a + pl.P * p.p / 100; }, 0);
    if (!open.length) return { err: 'Every payment in the schedule is dated before today, so there is nothing left to move.' };
    var H = Math.max.apply(null, open.map(function(p){ return Math.max(0, p.off); }));
    var lastT = T[n - 1], endS = lastT - H * DAY, startS = endS - years * 365.25 * DAY;
    if (startS < T[0]) return { err: 'The plan runs ' + Math.round(H / 30.44) + ' months. With ECB data from ' + fdate(j.first) + ', there is not enough history for a ' + years + '-year window of start dates. Try a shorter window.' };
    // index of last ECB date on or before t
    function at(t){ var lo = 0, hi = n - 1; if (t >= T[hi]) return hi; while (lo < hi) { var m = (lo + hi + 1) >> 1; if (T[m] <= t) lo = m; else hi = m - 1; } return lo; }
    var R = pl.R > 0 ? pl.R : X[n - 1], rateNote = pl.R > 0 ? 'your rate' : 'the latest ECB cross rate';
    var amts = open.map(function(p){ return pl.P * p.p / 100; }), openAmt = amts.reduce(function(a, b){ return a + b; }, 0);
    var base = (paidAmt + openAmt) * R;
    var runs = [];
    for (var i = at(startS); i < n && T[i] <= endS; i++) {
      if (T[i] < startS) continue;
      var x0 = X[i], tot = paidAmt * R;
      for (var k = 0; k < open.length; k++) tot += amts[k] * R * X[at(T[i] + Math.max(0, open[k].off) * DAY)] / x0;
      runs.push({ s: j.dates[i], tot: tot });
    }
    if (runs.length < 20) return { err: 'Too few start dates in this window to say anything.' };
    var sorted = runs.map(function(r){ return r.tot; }).sort(function(a, b){ return a - b; });
    function q(p){ var h = (sorted.length - 1) * p, l = Math.floor(h); return sorted[l] + (sorted[Math.min(l + 1, sorted.length - 1)] - sorted[l]) * (h - l); }
    var worst = runs.reduce(function(a, r){ return r.tot > a.tot ? r : a; }, runs[0]);
    var best = runs.reduce(function(a, r){ return r.tot < a.tot ? r : a; }, runs[0]);
    var over = runs.filter(function(r){ return r.tot > base; }).length;
    return { years: years, base: base, R: R, rateNote: rateNote, runs: runs, p5: q(0.05), p50: q(0.5), p95: q(0.95), worst: worst, best: best, over: over, H: H, first: runs[0].s, last: runs[runs.length - 1].s, paidAmt: paidAmt };
  }

  // ---------- render ----------
  function hist(res, hc){
    var box = $('hsChart'), W = Math.max(300, Math.min(960, box.clientWidth - 8)), small = W < 520;
    var H = small ? 230 : 260, padL = 10, padR = 10, top = 26, bot = 48;
    var vals = res.runs.map(function(r){ return (r.tot / res.base - 1) * 100; });
    var lo = Math.min.apply(null, vals.concat([0])), hi = Math.max.apply(null, vals.concat([0]));
    if (hi - lo < 1) { lo -= 0.5; hi += 0.5; }
    var B = small ? 24 : 40, w = (hi - lo) / B, bins = new Array(B).fill(0);
    vals.forEach(function(v){ bins[Math.min(B - 1, Math.floor((v - lo) / w))]++; });
    var mx = Math.max.apply(null, bins), X = function(v){ return padL + (W - padL - padR) * (v - lo) / (hi - lo); }, Y = function(c){ return top + (H - top - bot) * (1 - c / mx); };
    var o = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-labelledby="hsSvgT"><title id="hsSvgT">Distribution of the plan total across ' + res.runs.length + ' historical start dates</title>';
    bins.forEach(function(c, i){
      var x = X(lo + i * w), bw = Math.max(1, X(lo + (i + 1) * w) - x - 1), mid = lo + (i + .5) * w;
      o += '<rect x="' + x + '" y="' + Y(c) + '" width="' + bw + '" height="' + (H - bot - Y(c)) + '" fill="' + (mid > 0 ? '#FF5B14' : '#0B7A55') + '" opacity=".8"/>';
    });
    function mark(v, label, dash, anchor){
      var x = X(v);
      o += '<line x1="' + x + '" x2="' + x + '" y1="' + (top - 8) + '" y2="' + (H - bot) + '" stroke="#17212B" stroke-width="1.4"' + (dash ? ' stroke-dasharray="4 4"' : '') + '/>';
      o += '<text x="' + x + '" y="' + (top - 12) + '" text-anchor="' + (anchor || 'middle') + '" font-size="11" fill="#17212B">' + esc(label) + '</text>';
    }
    var p5 = (res.p5 / res.base - 1) * 100, p95 = (res.p95 / res.base - 1) * 100;
    mark(0, 'today\'s rate', false, X(0) < 70 ? 'start' : X(0) > W - 70 ? 'end' : 'middle');
    mark(p5, '5th', true, 'end'); mark(p95, '95th', true, 'start');
    o += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + (H - bot) + '" y2="' + (H - bot) + '" stroke="#17212B"/>';
    o += '<text x="' + padL + '" y="' + (H - bot + 18) + '" font-size="12" fill="#17212B">' + pct(lo) + '</text>';
    o += '<text x="' + (W - padR) + '" y="' + (H - bot + 18) + '" text-anchor="end" font-size="12" fill="#17212B">' + pct(hi) + '</text>';
    o += '<text x="' + (W / 2) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="12" fill="#59626B">Total versus paying everything at ' + esc(res.rateNote) + ', in %</text>';
    box.innerHTML = o + '</svg>';
  }

  function render(j, pl, res, all){
    var hc = pl.hc, out = $('hsOut');
    $('hsSrc').innerHTML = 'Data: ' + esc(j.source || 'European Central Bank reference rates') + ', ' + j.n.toLocaleString('en') + ' daily rates from ' + fdate(j.first) + ' to ' + fdate(j.last) + '. ' +
      (j.derived && Object.keys(j.derived).length ? 'AED ' + esc(j.derived.AED) + '. ' : '') +
      'Query: <a href="' + esc(j.query) + '" rel="noopener">' + esc(j.query.replace(/^https:\/\//, '')) + '</a>' + (j.via === 'kolaboro' ? ' (relayed and cached by kolaboro.com/api/x/x/fx)' : '') + '.';
    if (res.err) { out.innerHTML = '<p class="mx-empty">' + esc(res.err) + '</p>'; $('hsChart').innerHTML = ''; $('hsT').tBodies[0].innerHTML = rows(all, hc); return; }
    out.innerHTML =
      '<div class="mx-kv">' +
      '<div><span>At ' + esc(res.rateNote) + ' (' + res.R.toLocaleString('en', { maximumSignificantDigits: 6 }) + ')</span><b>' + money(res.base, hc) + '</b></div>' +
      '<div><span>Middle outcome (median)</span><b>' + money(res.p50, hc) + ' (' + sgn(res.p50 - res.base, hc) + ')</b></div>' +
      '<div><span>5th to 95th percentile</span><b>' + money(res.p5, hc) + ' to ' + money(res.p95, hc) + '</b></div>' +
      '<div><span>Worst start date, ' + fdate(res.worst.s) + '</span><b>' + money(res.worst.tot, hc) + ' (' + sgn(res.worst.tot - res.base, hc) + ', ' + pct((res.worst.tot / res.base - 1) * 100) + ')</b></div>' +
      '<div><span>Best start date, ' + fdate(res.best.s) + '</span><b>' + money(res.best.tot, hc) + ' (' + sgn(res.best.tot - res.base, hc) + ')</b></div>' +
      '<div><span>Start dates where you paid more</span><b>' + res.over.toLocaleString('en') + ' of ' + res.runs.length.toLocaleString('en') + ' (' + Math.round(res.over / res.runs.length * 100) + '%)</b></div>' +
      '</div>' +
      '<p class="mx-cap">' + res.runs.length.toLocaleString('en') + ' start dates, ' + fdate(res.first) + ' to ' + fdate(res.last) + '. Each one replays the remaining payments at the offsets in your schedule, using the rate actually published on each payment day. The last start date is the latest one whose whole plan (' + Math.round(res.H / 30.44) + ' months) is already in the data.</p>';
    hist(res, hc);
    $('hsT').tBodies[0].innerHTML = rows(all, hc);
  }
  function rows(all, hc){
    return all.map(function(r){
      if (r.err) return '<tr><td>' + r.y + ' year' + (r.y > 1 ? 's' : '') + '</td><td colspan="4">' + esc(r.err) + '</td></tr>';
      return '<tr' + (r.years === win ? ' class="mx-now"' : '') + '><td>' + r.years + ' year' + (r.years > 1 ? 's' : '') + ' (' + r.runs.length.toLocaleString('en') + ' start dates)</td><td>' + money(r.p50, hc) + '</td><td>' + money(r.p5, hc) + ' to ' + money(r.p95, hc) + '</td><td>' + money(r.worst.tot, hc) + ' (' + pct((r.worst.tot / r.base - 1) * 100) + ', ' + fdate(r.worst.s) + ')</td><td>' + pct((r.p95 / r.base - 1) * 100) + '</td></tr>';
    }).join('');
  }

  function run(){
    var pl = plan(), my = ++seq, out = $('hsOut');
    writeUrl(pl);
    if (!(pl.P > 0)) { out.innerHTML = '<p class="mx-empty">Enter the price above.</p>'; return; }
    if (pl.pc === pl.hc) { out.innerHTML = '<p class="mx-empty">Same currency: no exchange risk to replay.</p>'; $('hsChart').innerHTML = ''; return; }
    var miss = [pl.pc, pl.hc].filter(function(c){ return ECB.indexOf(c) < 0; });
    if (miss.length) { out.innerHTML = '<p class="mx-empty">The ECB does not publish a reference rate for ' + esc(miss.join(' and ')) + ', so there is no history to replay. We do not estimate one.</p>'; $('hsChart').innerHTML = ''; $('hsT').tBodies[0].innerHTML = ''; return; }
    out.innerHTML = '<p class="mx-empty">Loading ECB history for ' + esc(pl.pc) + ' and ' + esc(pl.hc) + '...</p>';
    load(pl.pc, pl.hc).then(function(j){
      if (my !== seq) return;
      var all = [1, 3, 5].map(function(y){ var r = simulate(j, pl, y); if (r.err) r.y = y; return r; });
      var res = all[[1, 3, 5].indexOf(win)];
      lastRes = res; render(j, pl, res, all);
    }).catch(function(){
      if (my !== seq) return;
      out.innerHTML = '<p class="mx-empty">The ECB history could not be loaded right now, from our relay or from Frankfurter. Nothing is shown rather than a guess. Try again later.</p>';
    });
  }

  // ---------- URL sharing and example plans ----------
  function writeUrl(pl){
    if (applying) return;
    try {
      var q = new URLSearchParams();
      if (pl.P > 0) q.set('p', String(pl.P));
      q.set('pc', pl.pc); q.set('hc', pl.hc);
      if (pl.R > 0) q.set('r', String(pl.R));
      var s = Array.prototype.map.call($('crRows').children, function(r){ return (r.querySelector('.r-d').value || '') + '_' + (r.querySelector('.r-p').value || '').replace(/[^\d.]/g, ''); }).join('~');
      q.set('s', s); q.set('w', String(win));
      history.replaceState(null, '', location.pathname + '?' + q.toString() + location.hash);
    } catch(e){}
  }
  function setRows(list){
    var rows = $('crRows');
    while (rows.children.length < list.length) $('crAdd').click();
    while (rows.children.length > list.length && rows.children.length > 1) rows.lastElementChild.remove();
    list.forEach(function(it, i){
      var r = rows.children[i];
      r.querySelector('.r-l').value = it.l || (i === 0 ? 'Deposit' : i === list.length - 1 ? 'Final payment' : 'Instalment');
      r.querySelector('.r-d').value = it.d; r.querySelector('.r-p').value = it.p;
    });
  }
  function addMonths(m){ var d = new Date(); var x = new Date(d.getFullYear(), d.getMonth() + m, Math.min(d.getDate(), 28)); return iso(x); }
  // Example shapes only. Replace them with the dates in your contract.
  var SHAPES = {
    '40-60': [[1, 10, 'Deposit'], [7, 10], [13, 10], [19, 10], [30, 60, 'Handover']],
    '60-40': [[1, 20, 'Deposit'], [7, 10], [13, 10], [19, 10], [25, 10], [36, 40, 'Handover']],
    'even-6m': [[1, 20, 'Deposit'], [7, 20], [13, 20], [19, 20], [25, 20, 'Handover']],
    'deposit-balance': [[1, 30, 'Deposit'], [24, 70, 'Handover']],
    'post-handover': [[1, 20, 'Deposit'], [12, 20], [24, 20, 'Handover'], [36, 20, 'After handover'], [48, 20, 'After handover']]
  };
  function applyShape(k){
    var s = SHAPES[k]; if (!s) return;
    setRows(s.map(function(x){ return { d: addMonths(x[0]), p: x[1], l: x[2] }; }));
    $('crF').dispatchEvent(new Event('input', { bubbles: true }));
  }
  function readUrl(){
    var q; try { q = new URLSearchParams(location.search); } catch(e){ return false; }
    if (!q.get('s') && !q.get('pc')) return false;
    applying = true;
    var okC = function(c){ return c && $('crPC').querySelector('option[value="' + c.replace(/[^A-Z]/g, '') + '"]'); };
    if (num(q.get('p')) > 0) $('crP').value = (+num(q.get('p'))).toLocaleString('en', { maximumFractionDigits: 2 });
    if (okC(q.get('pc'))) $('crPC').value = q.get('pc');
    if (okC(q.get('hc'))) $('crHC').value = q.get('hc');
    var list = String(q.get('s') || '').split('~').slice(0, 40).map(function(t){ var a = t.split('_'); return { d: /^\d{4}-\d{2}-\d{2}$/.test(a[0]) ? a[0] : '', p: isFinite(num(a[1])) ? String(num(a[1])) : '' }; }).filter(function(x){ return x.d || x.p; });
    if (list.length) setRows(list);
    var w = +q.get('w'); if ([1, 3, 5].indexOf(w) >= 0) { win = w; var el = document.querySelector('input[name="hsw"][value="' + w + '"]'); if (el) el.checked = true; }
    if (num(q.get('r')) > 0) { $('crR').value = q.get('r'); $('crR').dispatchEvent(new Event('input', { bubbles: true })); }
    else $('crPC').dispatchEvent(new Event('change', { bubbles: true }));
    $('crF').dispatchEvent(new Event('input', { bubbles: true }));
    applying = false;
    return true;
  }

  var t;
  function soon(){ clearTimeout(t); t = setTimeout(run, 400); }
  $('crF').addEventListener('input', soon);
  $('crF').addEventListener('change', soon);
  $('crRows').addEventListener('click', function(e){ if (e.target.closest('.mx-del')) soon(); });
  $('crAdd').addEventListener('click', soon);
  Array.prototype.forEach.call(document.querySelectorAll('input[name="hsw"]'), function(el){ el.addEventListener('change', function(){ win = +el.value; run(); }); });
  $('hsShape').addEventListener('change', function(){ if (this.value) applyShape(this.value); this.value = ''; });
  $('hsShare').addEventListener('click', function(){
    var m = $('hsShareMsg'); writeUrl(plan());
    try { navigator.clipboard.writeText(location.href).then(function(){ m.textContent = 'Link copied. It holds only the price, currencies, rate and schedule you typed.'; }, function(){ m.textContent = location.href; }); } catch(e){ m.textContent = location.href; }
  });
  var rt; window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(function(){ if (lastRes && !lastRes.err) hist(lastRes, plan().hc); }, 200); });
  try { new MutationObserver(soon).observe($('crRS'), { childList: true, characterData: true, subtree: true }); } catch(e){}
  readUrl();
  run();
})();
