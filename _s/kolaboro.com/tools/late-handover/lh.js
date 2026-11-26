(function(){
  'use strict';
  var $ = function(i){ return document.getElementById(i); };
  var DAY = 864e5, MD = 30.44;
  var L = null, LAW = null;
  var CURS = ['EUR','USD','GBP','AED','IDR','THB','AUD','CHF','SGD','MYR','PHP','MXN','TRY','ZAR'];
  var MK = ['ES','PT','AE-DU','ID','TH','OTHER'];
  var LABEL = { none: 'No payment', day: 'Amount per day', month: 'Amount per month', ppm: 'Rate, % of price per month', ppy: 'Rate, % of amount paid per year' };
  var DEF = { day: '50', month: '1,500', ppm: '0.5', ppy: '8' };
  var lastType = 'ppm';

  function num(v){ v = String(v == null ? '' : v).replace(/[\s,]/g, ''); if (v === '') return NaN; return parseFloat(v); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function money(v, c){ try { return new Intl.NumberFormat('en', { style:'currency', currency:c, maximumFractionDigits:0 }).format(v); } catch(e){ return c + ' ' + Math.round(v).toLocaleString('en'); } }
  function r1(v){ return (Math.round(v * 10) / 10).toLocaleString('en'); }
  function pd(s){ if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return null; return Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)); }
  function iso(t){ var d = new Date(t); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0'); }
  function fdate(t){ return new Date(t).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric', timeZone:'UTC' }); }
  function addM(t, m){ var d = new Date(t), whole = Math.floor(m), x = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + whole, d.getUTCDate()); return x + (m - whole) * MD * DAY; }
  function mBetween(a, b){ if (b <= a) return -mBetween(b, a); var m = 0; while (addM(a, m + 1) <= b) m++; return m + (b - addM(a, m)) / DAY / MD; }
  var now = new Date(), today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  // ---------- form setup ----------
  var rows = $('lhRows');
  function addRow(d, a){
    var r = document.createElement('div'); r.className = 'mx-row';
    r.innerHTML = '<label class="tl-in">Date paid<input type="date" class="r-d" value="' + (d || '') + '"></label>' +
      '<label class="tl-in mx-lab">Amount<input class="r-a" inputmode="decimal" autocomplete="off" value="' + (a == null ? '' : a) + '"></label>' +
      '<button type="button" class="mx-del" aria-label="Remove this payment">&times;</button>';
    r.querySelector('.mx-del').addEventListener('click', function(){ if (rows.children.length > 1) { r.remove(); calc(); } });
    rows.appendChild(r); return r;
  }
  function readRows(){
    return Array.prototype.map.call(rows.children, function(r){ return { d: pd(r.querySelector('.r-d').value), ds: r.querySelector('.r-d').value, a: num(r.querySelector('.r-a').value) }; }).filter(function(p){ return p.a > 0; });
  }
  function type(){ var t = $('lhTypes').querySelector('input:checked'); return t ? t.value : 'none'; }

  // ---------- contract side ----------
  function contract(st){
    var t = st.t, out = { rows: [] }, c = st.c;
    if (!st.d1 || !st.d2) { out.big = 'Enter both dates'; return out; }
    var days = Math.round((st.d2 - st.d1) / DAY), months = mBetween(st.d1, st.d2);
    var gEnd = addM(st.d1, st.G), dAfter = Math.max(0, Math.round((st.d2 - gEnd) / DAY)), mAfter = Math.max(0, mBetween(gEnd, st.d2));
    var raw = 0, needs = '';
    if (t === 'day') { if (st.V >= 0) raw = st.V * dAfter; else needs = 'the amount per day'; }
    else if (t === 'month') { if (st.V >= 0) raw = st.V * mAfter; else needs = 'the amount per month'; }
    else if (t === 'ppm') { if (st.V >= 0 && st.P > 0) raw = st.P * st.V / 100 * mAfter; else needs = !(st.P > 0) ? 'the price' : 'the rate'; }
    else if (t === 'ppy') { if (st.V >= 0 && st.paid > 0) raw = st.paid * st.V / 100 * dAfter / 365; else needs = !(st.paid > 0) ? 'the payments made' : 'the rate'; }
    var cap = st.cap >= 0 && st.P > 0 ? st.P * st.cap / 100 : Infinity, owed = Math.min(raw, cap);
    out.days = days; out.months = months;
    if (days <= 0) { out.big = 'Not late'; out.band = 'Handover on or before the promised date.'; out.cls = 'lo'; }
    else if (needs) { out.big = 'Enter ' + needs; }
    else if (t === 'none') { out.big = money(0, c); out.band = 'The contract pays nothing for delay. The law section below may still give you rights.'; out.cls = 'hi'; out.owed = 0; }
    else { out.big = money(owed, c); out.owed = owed; out.band = mAfter <= 0 ? 'Still inside the ' + r1(st.G) + ' month grace period: the clause pays nothing yet.' : raw > cap ? 'The cap is reached: the clause pays no more than ' + money(cap, c) + '.' : 'For ' + r1(mAfter) + ' months after the grace period.'; out.cls = mAfter <= 0 || raw > cap ? 'hi' : 'lo'; }
    out.rows.push(['Months late', days > 0 ? r1(months) + ' (' + days.toLocaleString('en') + ' days)' : '0']);
    out.rows.push(['Grace period', r1(st.G) + ' months, to ' + fdate(gEnd)]);
    out.rows.push(['Months that count', days > 0 ? r1(mAfter) : '0']);
    if (t !== 'none' && !needs && days > 0) {
      out.rows.push(['Clause before cap', money(raw, c)]);
      out.rows.push(['Cap', isFinite(cap) ? money(cap, c) + ' (' + r1(st.cap) + '% of price)' : 'No cap']);
    }
    return out;
  }

  // ---------- law side ----------
  function yearsRate(y){ var r = L.legal_interest_es.rates[String(y)]; return r == null ? null : r; }
  function legalInterest(pays, to){
    var lines = [], tot = 0, missing = [];
    pays.forEach(function(p){
      if (!p.d || p.d >= to) { lines.push({ p: p, i: 0, days: 0 }); return; }
      var t = p.d, i = 0, days = Math.round((to - p.d) / DAY);
      while (t < to) {
        var y = new Date(t).getUTCFullYear(), yEnd = Date.UTC(y + 1, 0, 1), end = Math.min(yEnd, to);
        var r = yearsRate(y), yl = (Date.UTC(y + 1, 0, 1) - Date.UTC(y, 0, 1)) / DAY;
        if (r == null) { if (missing.indexOf(y) < 0) missing.push(y); }
        else i += p.a * r / 100 * ((end - t) / DAY) / yl;
        t = end;
      }
      tot += i; lines.push({ p: p, i: i, days: days });
    });
    return { lines: lines, tot: tot, missing: missing };
  }

  function quoteBlock(r, src){
    return '<div class="mx-note"><h3>' + esc(r.title) + '</h3>' +
      '<p>' + esc(r.plain) + '</p>' +
      '<blockquote class="lh-q" lang="' + esc(src.language || '') + '">' + esc(r.quote) + '</blockquote>' +
      (r.translation ? '<p class="mx-cap">Our translation: ' + esc(r.translation) + '</p>' : '') +
      '<p class="mx-cap">' + esc(src.law) + ', ' + esc(r.cite) + '. <a href="' + esc(src.url) + '" rel="noopener">Official text</a> (' + esc(src.publisher) + '), checked ' + esc(r.checked || src.checked || '') + '.</p></div>';
  }

  function law(st, k){
    var m = L.markets[st.m], c = st.c;
    $('lhLawH').textContent = 'What the law says: ' + m.name;
    $('lhLawSum').textContent = m.summary;
    var calcH = '', blocks = '';
    var mine = L.rules.filter(function(r){ return r.market === m.law_market; });
    var theirs = (LAW && m.law_market ? LAW.rules.filter(function(r){ return r.market === m.law_market && r.topics.some(function(t){ return ['delay','termination','escrow','completion'].indexOf(t) >= 0; }); }) : []);
    if (st.m === 'ES') {
      var to = st.refund || today, li = legalInterest(st.pays, to), paid = st.paid;
      var late = st.d1 && st.d2 && st.d2 > st.d1 && st.d1 < today, future = st.d1 && st.d1 >= today;
      calcH += '<div class="out mx-out" style="margin-top:16px"><p>If you choose to cancel: refund with legal interest to ' + fdate(to) + '</p><span class="num mx-big">' + (paid > 0 ? money(paid + li.tot, c) : 'Enter your payments') + '</span>' +
        '<p class="mx-band ' + (late ? 'md' : 'lo') + '">' + (late ? 'The home was not delivered on the promised date. The article lets you choose between this refund and a written extension.' : future ? 'The promised date has not passed yet. If it is missed, the article gives you this choice.' : 'Not late on the dates entered, so this right is not triggered.') + '</p>' +
        '<div class="mx-kv"><div><span>Amounts paid on account</span><b>' + money(paid, c) + '</b></div><div><span>Legal interest</span><b>' + money(li.tot, c) + '</b></div>' +
        li.lines.map(function(l){ return '<div><span>' + (l.p.d ? fdate(l.p.d) : 'No date') + ', ' + money(l.p.a, c) + '</span><b>' + (l.days > 0 ? '+' + money(l.i, c) + ' over ' + l.days.toLocaleString('en') + ' days' : 'no interest yet') + '</b></div>'; }).join('') +
        '</div><p class="mx-fine">Legal interest rates by year from the Banco de España table: ' + Object.keys(L.legal_interest_es.rates).filter(function(y){ return +y >= 2016; }).map(function(y){ return y + ' ' + L.legal_interest_es.rates[y] + '%'; }).join(', ') + '. ' + (li.missing.length ? 'No published rate for ' + li.missing.join(', ') + ', so those days earn nothing here. ' : '') + 'Taxes paid with each instalment are included if you entered them in the amounts. The developer has 30 days to refund after your formal demand, then you can claim from the insurer or bank guarantee.</p></div>';
    } else if (st.m === 'PT') {
      var dep = st.dep > 0 ? st.dep : NaN;
      calcH += '<div class="out mx-out" style="margin-top:16px"><p>If the seller fails to perform: double the deposit (sinal)</p><span class="num mx-big">' + (dep > 0 ? money(dep * 2, c) : 'Enter the deposit') + '</span>' +
        '<p class="mx-band md">Article 442(2) of the Civil Code: double what you paid as sinal, if the failure is attributable to the seller. A late handover alone may not be a failure to perform; ask a lawyer.</p>' +
        (dep > 0 ? '<div class="mx-kv"><div><span>Deposit (sinal) you typed</span><b>' + money(dep, c) + '</b></div><div><span>Two times the deposit</span><b>' + money(dep * 2, c) + '</b></div></div>' : '') + '</div>';
    }
    mine.forEach(function(r){ blocks += quoteBlock(r, L.sources[r.source]); });
    theirs.forEach(function(r){ blocks += quoteBlock(r, LAW.sources[r.source]); });
    if (!mine.length && !theirs.length) blocks = '<p class="mx-empty" style="color:var(--ink)">No verified law notes for this market yet. We would rather show nothing than a rule we have not read in the official text.</p>';
    else blocks = '<h3 style="margin-top:22px">Articles quoted</h3>' + blocks + '<p class="mx-cap">More notes for ' + esc(m.name) + ': <a href="/tools/law/">law notes for off-plan buyers</a>.</p>';
    $('lhCalc').innerHTML = calcH; $('lhLaw').innerHTML = blocks;
  }

  // ---------- main ----------
  function state(){
    var pays = readRows();
    return { m: $('lhM').value, c: $('lhC').value, P: num($('lhP').value), d1: pd($('lhD1').value), d2: pd($('lhD2').value), t: type(), V: num($('lhV').value), G: Math.max(0, num($('lhG').value) || 0), cap: num($('lhCap').value), pays: pays, paid: pays.reduce(function(a, p){ return a + p.a; }, 0), dep: num($('lhDep').value), refund: pd($('lhR').value) };
  }
  function calc(){
    var t = type();
    if (t !== lastType) { if (t !== 'none') $('lhV').value = DEF[t]; lastType = t; }
    $('lhVT').textContent = LABEL[t]; $('lhV').disabled = t === 'none';
    var st = state(), k = contract(st);
    $('lhSum').textContent = 'Paid so far: ' + money(st.paid, st.c) + (st.P > 0 ? ' (' + r1(st.paid / st.P * 100) + '% of price)' : '');
    $('lhO1').textContent = k.big || '';
    var o2 = $('lhO2'); o2.className = 'mx-band' + (k.cls ? ' ' + k.cls : ''); o2.textContent = k.band || '';
    $('lhKV').innerHTML = k.rows.map(function(r){ return '<div><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>'; }).join('');
    if (L) law(st, k);
    writeUrl(st);
  }

  function writeUrl(st){
    try {
      var q = new URLSearchParams();
      q.set('m', st.m); q.set('c', st.c); if (st.P > 0) q.set('p', String(st.P));
      if (st.d1) q.set('d1', iso(st.d1)); if (st.d2) q.set('d2', iso(st.d2));
      q.set('t', st.t); if (isFinite(st.V)) q.set('v', String(st.V)); q.set('g', String(st.G)); if (isFinite(st.cap)) q.set('cap', String(st.cap));
      q.set('pay', st.pays.map(function(p){ return (p.ds || '') + '_' + p.a; }).join('~'));
      if (st.dep > 0) q.set('dep', String(st.dep)); if (st.refund) q.set('r', iso(st.refund));
      history.replaceState(null, '', location.pathname + '?' + q.toString());
    } catch(e){}
  }
  function fmt(v){ return (+v).toLocaleString('en', { maximumFractionDigits: 2 }); }
  function readUrl(){
    var q; try { q = new URLSearchParams(location.search); } catch(e){ return false; }
    if (!q.get('m')) return false;
    if (MK.indexOf(q.get('m')) >= 0) $('lhM').value = q.get('m');
    if (CURS.indexOf(q.get('c')) >= 0) $('lhC').value = q.get('c');
    if (num(q.get('p')) > 0) $('lhP').value = fmt(num(q.get('p')));
    ['d1', 'd2'].forEach(function(k){ if (pd(q.get(k))) $('lh' + k.toUpperCase()).value = q.get(k); });
    var t = q.get('t'); if (LABEL[t]) { var el = $('lhTypes').querySelector('input[value="' + t + '"]'); if (el) { el.checked = true; lastType = t; } }
    if (isFinite(num(q.get('v')))) $('lhV').value = fmt(num(q.get('v')));
    if (isFinite(num(q.get('g')))) $('lhG').value = fmt(num(q.get('g')));
    $('lhCap').value = isFinite(num(q.get('cap'))) ? fmt(num(q.get('cap'))) : '';
    var list = String(q.get('pay') || '').split('~').slice(0, 30).map(function(s){ var a = s.split('_'); return { d: pd(a[0]) ? a[0] : '', a: num(a[1]) }; }).filter(function(p){ return p.a > 0; });
    if (list.length) { rows.innerHTML = ''; list.forEach(function(p){ addRow(p.d, fmt(p.a)); }); }
    if (num(q.get('dep')) > 0) $('lhDep').value = fmt(num(q.get('dep')));
    if (pd(q.get('r'))) $('lhR').value = q.get('r');
    return true;
  }

  function init(){
    var s = $('lhM');
    MK.forEach(function(k){ var o = document.createElement('option'); o.value = k; o.textContent = L.markets[k].name; s.appendChild(o); });
    var c = $('lhC'); CURS.forEach(function(k){ var o = document.createElement('option'); o.value = k; o.textContent = k; c.appendChild(o); });
    s.value = 'ES'; c.value = 'EUR';
    // Example: promised 14 months ago, expected 4 months from now; three payments.
    $('lhD1').value = iso(addM(today, -14)); $('lhD2').value = iso(addM(today, 4));
    addRow(iso(addM(today, -40)), '40,000'); addRow(iso(addM(today, -28)), '40,000'); addRow(iso(addM(today, -16)), '40,000');
    readUrl();
    calc();
    $('lhF').addEventListener('input', calc); $('lhF').addEventListener('change', calc);
    $('lhAdd').addEventListener('click', function(){ addRow(iso(today), ''); calc(); });
    ['lhP', 'lhDep'].forEach(function(id){ $(id).addEventListener('blur', function(){ var v = num(this.value); if (v > 0) this.value = fmt(v); }); });
    $('lhShare').addEventListener('click', function(){
      var m = $('lhShareMsg');
      try { navigator.clipboard.writeText(location.href).then(function(){ m.textContent = 'Link copied. It holds only the numbers and dates you typed.'; }, function(){ m.textContent = location.href; }); } catch(e){ m.textContent = location.href; }
    });
  }

  Promise.all([
    fetch('/tools/late-handover/lh.json?v=3e475018ca').then(function(r){ if (!r.ok) throw new Error('http'); return r.json(); }),
    fetch('/tools/law/law.json').then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; })
  ]).then(function(a){ L = a[0]; LAW = a[1]; init(); }).catch(function(){
    $('lhO1').textContent = 'Data not loaded'; $('lhO2').textContent = 'Reload the page. The rules are in lh.json.';
  });
})();
