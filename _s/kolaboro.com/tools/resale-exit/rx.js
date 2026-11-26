(function(){
  'use strict';
  var $ = function(i){ return document.getElementById(i); };
  function num(v){ v = String(v == null ? '' : v).replace(/[\s,%]/g, ''); if (v === '') return NaN; return parseFloat(v); }
  function r1(v){ return (Math.round(v * 10) / 10).toLocaleString('en'); }
  function amt(v){ return Math.round(v).toLocaleString('en'); }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function val(n){ var r = document.querySelector('input[name=' + n + ']:checked'); return r ? r.value : ''; }
  var F = $('rxF');

  function calc(){
    var a = {}; for (var i = 1; i <= 8; i++) a['q' + i] = val('q' + i);
    var P = num($('rxP').value), paid = num($('rxPd').value), mkt = $('rxM').value;
    var fee = num($('rxFee').value), feeA = num($('rxFeeA').value), min = num($('rxMin').value);
    $('rxFeeP').hidden = a.q3 !== 'pct'; $('rxFeeF').hidden = a.q3 !== 'flat'; $('rxMinW').hidden = a.q4 !== 'pct';
    var feePct = a.q3 === 'pct' ? fee : a.q3 === 'flat' && P > 0 && feeA >= 0 ? feeA / P * 100 : a.q3 === 'zero' ? 0 : NaN;
    var s = 0, answered = 0, kv = [], ask = [];
    // 1 assignment
    if (a.q1) answered++;
    s += { yes: 25, silent: 8, no: 0 }[a.q1] || 0;
    // 2 consent
    if (a.q2) answered++;
    s += { none: 15, criteria: 10, discretion: 4, unknown: 3 }[a.q2] || 0;
    // 3 fee
    if (a.q3) answered++;
    if (a.q3 === 'zero') s += 15;
    else if (a.q3 === 'unknown') s += 3;
    else if (a.q3 && isFinite(feePct)) s += feePct <= 1 ? 12 : feePct <= 2 ? 9 : feePct <= 4 ? 5 : 2;
    else if (a.q3) s += 5;
    // 4 min paid
    if (a.q4) answered++;
    if (a.q4 === 'none') s += 15;
    else if (a.q4 === 'unknown') s += 3;
    else if (a.q4 === 'pct') s += !isFinite(min) ? 6 : min <= 20 ? 12 : min <= 40 ? 8 : 4;
    // 5 lock-in
    if (a.q5) answered++;
    s += { none: 10, '6': 7, '12': 4, '13': 1, unknown: 2 }[a.q5] || 0;
    // 6 registration
    if (a.q6) answered++;
    s += { registry: 10, dev: 5, unknown: 1 }[a.q6] || 0;
    // 7 taxes
    if (a.q7) answered++;
    s += { yes: 5, rough: 3, no: 0 }[a.q7] || 0;
    // 8 last resort
    if (a.q8) answered++;
    s += { written: 5, verbal: 2, none: 0 }[a.q8] || 0;
    if (a.q1 === 'no') s = Math.min(s, 20);

    var band = $('rxB'), mtr = $('rxMtr');
    $('rxS').textContent = answered ? s : 0;
    band.className = 'mx-band'; mtr.className = '';
    if (!answered) { band.textContent = 'Answer the questions to see your score'; mtr.style.width = '0'; }
    else {
      var cls = a.q1 === 'no' || s < 40 ? 'hi' : s < 70 ? 'md' : 'lo';
      band.textContent = a.q1 === 'no' ? 'Locked in: no resale before handover unless the developer agrees' : s >= 70 ? 'Flexible exit, on paper' : s >= 40 ? 'Possible, with conditions and costs' : 'Hard to exit before handover';
      band.classList.add(cls); if (cls !== 'lo') mtr.classList.add(cls); mtr.style.width = s + '%';
    }
    $('rxDone').textContent = answered + ' of 8 answered' + (answered < 8 ? '. Unanswered questions score 0.' : '.');

    // facts panel
    if (isFinite(feePct) && a.q3 !== 'zero') kv.push(['Assignment fee', r1(feePct) + '% of price' + (P > 0 ? ' = ' + amt(P * feePct / 100) : '')]);
    if (a.q3 === 'zero') kv.push(['Assignment fee', 'None']);
    if (a.q4 === 'pct' && isFinite(min)) {
      if (isFinite(paid)) kv.push(['Minimum paid before resale', r1(min) + '%: ' + (paid >= min ? 'you have paid enough' : 'pay ' + r1(min - paid) + '% of the price more' + (P > 0 ? ' (' + amt(P * (min - paid) / 100) + ')' : ''))]);
      else kv.push(['Minimum paid before resale', r1(min) + '% of price']);
    }
    if (isFinite(paid) && P > 0) kv.push(['Your money in the deal', amt(P * paid / 100)]);
    $('rxKV').innerHTML = kv.map(function(r){ return '<div><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>'; }).join('');

    // questions
    if (a.q1 !== 'yes') ask.push([a.q1 === 'no' ? 'Would you agree to a one-off assignment?' : 'Will you add a written assignment clause?', a.q1 === 'no' ? 'The contract forbids resale before handover. Ask whether the developer has ever allowed one, on what terms, and get any yes in writing before you rely on it.' : 'If the contract is silent, the developer can refuse later. Ask for a clause that allows assignment and states the conditions and the fee.', true]);
    if (a.q2 !== 'none') ask.push(['What are the exact conditions for consent?', a.q2 === 'discretion' ? 'Consent at the developer\'s discretion means they can say no for any reason. Ask for written criteria and a deadline to answer.' : 'Ask for the list of documents, the time it takes, and whether the new buyer must be approved.', a.q2 === 'discretion' || a.q2 === 'unknown' || !a.q2]);
    if (a.q3 !== 'zero') ask.push(['How much is the assignment fee, and who pays it?', a.q3 === 'unknown' || !a.q3 ? 'The fee is not stated. Ask for it in writing, as a % of the price or a fixed amount, and whether it can change.' : 'Ask whether the fee is charged on your price or the resale price, whether it is negotiable, and whether there are admin or certificate fees on top.']);
    if (a.q4 !== 'none') ask.push(['What share must be paid before you can assign?', a.q4 === 'pct' && isFinite(min) && isFinite(paid) && paid < min ? 'You still need to pay ' + r1(min - paid) + '% of the price more before you can sell. Ask whether a buyer can pay that share at the time of the assignment.' : 'Ask for the minimum in writing, and whether the new buyer can pay part of it at the time of the assignment.']);
    if (a.q5 && a.q5 !== 'none') ask.push(['When does the lock-in end?', a.q5 === 'unknown' ? 'Ask whether there is any period after signing during which you cannot resell.' : 'Ask for the exact end date, and whether it is extended if construction is delayed.']);
    if (a.q6 !== 'registry') ask.push(['Where is the new buyer recorded?', 'Ask whether the assignment is registered with an official registry or only in the developer\'s files. A public record protects both you and the next buyer.', a.q6 === 'unknown' || !a.q6]);
    if (a.q7 !== 'yes') ask.push(['Which taxes apply on an assignment?', 'Ask a local tax adviser, not the sales team: transfer tax, tax on your profit, registration fees, and who pays each. These can turn a profit into a loss.']);
    if (a.q8 !== 'written') ask.push(['Is there a way out if no one buys?', a.q8 === 'verbal' ? 'A promised buy-back or resale programme is worth only what is in writing. Ask for it in the contract, with the price or formula.' : 'Ask whether the developer runs a resale programme or will buy back, and on what terms.']);
    ask.push(['Can you show me past assignments in this project?', 'Ask how many units have been resold before handover and at what prices compared with launch. If there are none, plan to hold until handover.']);
    $('rxAsk').innerHTML = ask.map(function(x){ return '<li' + (x[2] ? ' class="mx-hot"' : '') + '><b>' + esc(x[0]) + '</b>' + esc(x[1]) + '</li>'; }).join('');

    // market note
    var n = $('rxNote');
    if (mkt === 'dubai') {
      n.innerHTML = '<h3>Dubai: typical practice to verify</h3><p>This is what buyers commonly report, not legal advice. Check every point with the developer and an independent adviser for your project.</p><ul>' +
        '<li>Developers usually allow resale before handover only once a set share of the price has been paid. The share is set by the developer and differs between projects, so read your contract.</li>' +
        '<li>A transfer usually needs a No Objection Certificate (NOC) from the developer, which typically carries a fee.</li>' +
        '<li>Off-plan sales are typically registered with the Dubai Land Department, so the transfer to a new buyer is usually recorded there too. Ask what Land Department fees apply on the transfer and who pays them.</li>' +
        '<li>Check that the project is registered and that your payments go to its escrow account. You can look a project up on the <a href="/dubai">Kolaboro Dubai page</a>.</li></ul>';
    } else {
      n.innerHTML = '<h3>Somewhere else: it depends on the contract</h3><p>Whether you can resell before handover, and on what terms, depends on your contract and on local rules we cannot confirm for every market. Some places require registration of the transfer, some charge transfer tax again, some do not allow foreigners to hold certain titles. Ask an independent local lawyer, and see what Kolaboro has found for your market in the <a href="/database/">database</a>.</p>';
    }
  }

  F.addEventListener('change', calc);
  F.addEventListener('input', calc);
  $('rxReset').addEventListener('click', function(){
    Array.prototype.forEach.call(F.querySelectorAll('input[type=radio]'), function(r){ r.checked = false; });
    ['rxFee', 'rxFeeA', 'rxMin'].forEach(function(id){ $(id).value = ''; });
    calc();
  });
  calc();
})();
