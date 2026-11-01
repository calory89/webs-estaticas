/* Kolaboro total cost of ownership calculator. Country defaults are typical figures with the source we opened; users must verify them. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(v) { if (v == null) return NaN; var s = String(v).replace(/[\s,]/g, ''); return s === '' ? NaN : parseFloat(s); }
  function n0(v) { var x = num(v); return isFinite(x) ? x : 0; }

  var SRC = {
    dubaiHH: ['haus & haus: Dubai Land Department fees', 'https://www.hausandhaus.com/resources/latest-news-and-insights/dubai-property-registration-fees/'],
    dubaiPF: ['Property Finder: cost to buy in Dubai', 'https://help.propertyfinder.ae/hc/en-us/articles/37816732289042-How-much-does-it-actually-cost-to-buy-property-in-Dubai'],
    esAnd: ['Interforo Abogados: taxes on buying a home in Andalucía 2026', 'https://interforoabogados.com/contenido-legal/impuestos-compra-vivienda-andalucia-2026/'],
    ptIMT: ['Portal das Finanças: IMT code, article 17', 'https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cimt/Pages/cimt17.aspx'],
    ptIS: ['Portal das Finanças: stamp duty table, item 1.1', 'https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/selo/Pages/ccod-selo-tabgiselo.aspx'],
    th: ['Thailand.go.th: fees and taxes on property transfer', 'https://www.thailand.go.th/event-detail/010_009'],
    id: ['Hukumonline: how BPHTB is calculated (Law 1/2022)', 'https://www.hukumonline.com/klinik/a/cara-menghitung-bphtb-dalam-jual-beli-tanah-lt60109bb92a261/'],
    mx: ['BBVA México: acquisition tax (ISAI)', 'https://www.bbva.mx/educacion-financiera/creditos/credito-hipotecario-impuesto-adquisicion-inmuebles.html'],
    uk: ['GOV.UK: SDLT residential rates', 'https://www.gov.uk/stamp-duty-land-tax/residential-property-rates'],
    tr: ['Turkish Ministry of Justice: title deed fee in sales (Law 492)', 'https://iidb.adalet.gov.tr/Resimler/SayfaDokuman/' + encodeURIComponent('10012024135523Satış İşlemlerinde Tapu Harcının Alınması.pdf')]
  };

  // Portugal IMT, mainland, homes that are not your own permanent home (art. 17, n.1 c), values from Lei 73-A/2025)
  function imtPT(v) {
    if (v <= 0) return 0;
    if (v > 1150853) return v * 0.075;
    if (v > 633931) return v * 0.06;
    var B = [[106346, 0.01], [145470, 0.02], [198347, 0.05], [330539, 0.07], [633931, 0.08]], t = 0, lo = 0;
    for (var i = 0; i < B.length; i++) { var hi = B[i][0]; if (v > lo) t += (Math.min(v, hi) - lo) * B[i][1]; lo = hi; }
    return t;
  }
  // England and Northern Ireland SDLT bands from GOV.UK, plus optional surcharges added to every band
  function sdltUK(v, extra) {
    var B = [[125000, 0], [250000, 0.02], [925000, 0.05], [1500000, 0.10], [Infinity, 0.12]], t = 0, lo = 0;
    for (var i = 0; i < B.length; i++) { var hi = B[i][0]; if (v > lo) t += (Math.min(v, hi) - lo) * (B[i][1] + extra); lo = hi; }
    return t;
  }

  var C = {
    ae: { name: 'UAE: Dubai', cur: 'AED', note: 'Off-plan sales are registered on the Dubai Land Department Oqood system.', items: [
      { id: 'dld', label: 'DLD transfer fee', kind: 'pct', v: 4, note: 'The DLD schedule splits 4% as 2% seller and 2% buyer, but buyers usually pay all 4% by contract. Check who pays in your contract.', src: ['dubaiHH', 'dubaiPF'] },
      { id: 'trustee', label: 'Registration trustee fee', kind: 'amt', v: function (p) { return p >= 500000 ? 4200 : 2100; }, note: 'About AED 4,200 with VAT at AED 500,000 or more, about AED 2,100 below. Fixed amount in AED.', src: ['dubaiPF'] },
      { id: 'deed', label: 'Title deed and admin fees', kind: 'amt', v: 270, note: 'AED 250 title deed plus AED 10 knowledge and AED 10 innovation fees. Fixed amount in AED.', src: ['dubaiHH'] }
    ] },
    es: { name: 'Spain: new build', cur: 'EUR', note: 'New builds pay VAT plus stamp duty (AJD). AJD shown is the Andalucía rate (Costa del Sol); other regions set their own. Resales pay transfer tax (ITP) instead: 7% in Andalucía. The Canary Islands use IGIC, not VAT.', items: [
      { id: 'iva', label: 'VAT (IVA) on new homes', kind: 'pct', v: 10, note: '10% on the sale price for new homes.', src: ['esAnd'] },
      { id: 'ajd', label: 'Stamp duty (AJD), Andalucía', kind: 'pct', v: 1.2, note: 'General Andalucía rate. Check your region.', src: ['esAnd'] }
    ] },
    pt: { name: 'Portugal: mainland', cur: 'EUR', note: 'IMT uses the mainland table for homes that are not your own permanent home (2026 values). Madeira and the Azores use different tables.', items: [
      { id: 'imt', label: 'Property transfer tax (IMT)', kind: 'calc', f: function (p) { return imtPT(p); }, note: 'Progressive up to 8%, then a flat 6% above EUR 633,931 and 7.5% above EUR 1,150,853.', src: ['ptIMT'] },
      { id: 'is', label: 'Stamp duty (Imposto do Selo)', kind: 'pct', v: 0.8, note: '0.8% of the value.', src: ['ptIS'] }
    ] },
    th: { name: 'Thailand', cur: 'THB', note: 'The seller normally pays specific business tax (3.3%) or stamp duty (0.5%) and withholding tax, so they are not included here.', items: [
      { id: 'tf', label: 'Land Office transfer fee', kind: 'pct', v: 2, note: '2% of the appraised value, which can be lower than the price. Often split with the seller by contract: set 1% if you split it.', src: ['th'] }
    ] },
    id: { name: 'Indonesia', cur: 'IDR', note: 'BPHTB applies to title transfers such as HGB or Hak Milik. Leasehold deals are taxed differently: ask your notary.', items: [
      { id: 'bphtb', label: 'Land and building acquisition duty (BPHTB)', kind: 'pct', v: 5, ded: 80000000, note: 'Maximum 5% set by the regency, on the price minus a tax-free amount of at least Rp 80 million (set locally).', src: ['id'] }
    ] },
    mx: { name: 'Mexico', cur: 'MXN', note: 'The acquisition tax is set by each state and municipality. The notary calculates it at the deed. In the coastal restricted zone foreigners also pay for a bank trust (fideicomiso).', items: [
      { id: 'isai', label: 'Acquisition tax (ISAI)', kind: 'pct', v: null, note: 'Left empty: rates vary, roughly 2% to 5% of the value depending on the state. Ask the notary for your municipality.', src: ['mx'] }
    ] },
    uk: { name: 'United Kingdom: England and NI', cur: 'GBP', note: 'Stamp Duty Land Tax bands for England and Northern Ireland. Scotland and Wales have their own taxes.', items: [
      { id: 'sdlt', label: 'Stamp Duty Land Tax', kind: 'calc', f: function (p, o) { return sdltUK(p, (o.add ? 0.05 : 0) + (o.nonres ? 0.02 : 0)); }, note: '0% to £125,000, 2% to £250,000, 5% to £925,000, 10% to £1.5 million, 12% above.', src: ['uk'],
        opts: [['add', 'I will own more than one home (adds 5%)', true], ['nonres', 'I am not UK resident (adds 2%)', true]] }
    ] },
    tr: { name: 'Turkey', cur: 'TRY', note: 'The fee is charged on the declared price, but not less than the property tax value.', items: [
      { id: 'tapu', label: 'Title deed fee (tapu harcı)', kind: 'pct', v: 4, note: '4% in total: by law 2% from the buyer and 2% from the seller, but the contract can put all of it on the buyer. Set 2% if you split it.', src: ['tr'] }
    ] },
    xx: { name: 'Another country', cur: 'USD', note: 'Add the purchase taxes and fees your lawyer quotes.', items: [
      { id: 'tax1', label: 'Purchase tax', kind: 'pct', v: null, note: 'Percent of the price.', src: [] },
      { id: 'fee1', label: 'Registration and other fees', kind: 'amt', v: null, note: 'Amount.', src: [] }
    ] }
  };
  var CURS = ['AED', 'EUR', 'GBP', 'USD', 'THB', 'IDR', 'MXN', 'TRY', 'AUD', 'SGD', 'CHF', 'CAD'];
  var ST = { c: 'ae', vals: {}, opts: {} };

  function money(v) {
    var cur = $('tcCur').value;
    try { return new Intl.NumberFormat('en', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(Math.round(v)); }
    catch (e) { return cur + ' ' + Math.round(v).toLocaleString('en'); }
  }

  function drawItems() {
    var c = C[ST.c];
    $('tcCN').textContent = c.note;
    $('tcItems').innerHTML = c.items.map(function (it) {
      var dv = ST.vals[it.id], h = '';
      var src = it.src.map(function (k) { return '<a href="' + esc(SRC[k][1]) + '" target="_blank" rel="noopener">' + esc(SRC[k][0]) + '</a>'; }).join(' · ');
      var field;
      if (it.kind === 'pct') field = '<label class="tl-in">Rate (%)<input data-it="' + it.id + '" inputmode="decimal" value="' + (dv != null ? esc(dv) : it.v != null ? it.v : '') + '" placeholder="Fill in"></label>';
      else if (it.kind === 'amt') { var ad = amtDef(it, Math.max(0, n0($('tcP').value))); field = '<label class="tl-in">Amount<input data-it="' + it.id + '" inputmode="decimal" value="' + (dv != null ? esc(dv) : ad != null ? ad : '') + '" placeholder="Fill in"></label>'; }
      else field = '<label class="tl-in">Your own figure<input data-it="' + it.id + '" inputmode="decimal" value="' + (dv != null ? esc(dv) : '') + '" placeholder="Leave empty to use ours"></label>';
      if (it.ded != null) field += '<label class="tl-in">Tax-free amount<input data-ded="' + it.id + '" inputmode="decimal" value="' + esc(ST.vals[it.id + '_ded'] != null ? ST.vals[it.id + '_ded'] : it.ded) + '"></label>';
      if (it.opts) h = '<div class="tc-opts">' + it.opts.map(function (o) { var on = ST.opts[o[0]] != null ? ST.opts[o[0]] : o[2]; return '<label class="tc-tg sm"><input type="checkbox" data-opt="' + o[0] + '"' + (on ? ' checked' : '') + '><span>' + esc(o[1]) + '</span></label>'; }).join('') + '</div>';
      return '<div class="tc-it"><div class="tc-ih"><b>' + esc(it.label) + '</b><span class="tc-amt" data-amt="' + it.id + '"></span></div>' +
        '<div class="tc-if">' + field + '</div>' + h + '<p class="tc-in">' + esc(it.note) + '</p>' + (src ? '<p class="tc-src">Source: ' + src + '</p>' : '') + '</div>';
    }).join('');
  }

  function itemAmt(it, p) {
    var raw = ST.vals[it.id], x = num(raw);
    if (it.kind === 'pct') { var r = raw != null ? x : (it.v != null ? it.v : NaN); if (!isFinite(r)) return null; var ded = it.ded != null ? n0(ST.vals[it.id + '_ded'] != null ? ST.vals[it.id + '_ded'] : it.ded) : 0; return Math.max(0, p - ded) * r / 100; }
    if (it.kind === 'amt') { if (raw != null) return isFinite(x) ? x : null; return amtDef(it, p); }
    if (isFinite(x)) return x;
    var o = {}; (it.opts || []).forEach(function (q) { o[q[0]] = ST.opts[q[0]] != null ? ST.opts[q[0]] : q[2]; });
    return it.f(p, o);
  }

  function amtDef(it, p) { return typeof it.v === 'function' ? it.v(p) : it.v; }
  function interest(L, rate, termY, months) {
    if (L <= 0 || termY <= 0 || months <= 0) return 0;
    var r = rate / 1200, n = termY * 12, pay = r ? L * r / (1 - Math.pow(1 + r, -n)) : L / n, bal = L, tot = 0;
    for (var m = 0; m < Math.min(months, n); m++) { var i = bal * r; tot += i; bal -= (pay - i); }
    return tot;
  }

  function chart(parts, rent) {
    var tot = parts.reduce(function (s, x) { return s + x[1]; }, 0), max = Math.max(tot, rent, 1), W = 600, X = 0;
    var lab = esc('Costs: ' + parts.map(function (x) { return x[0] + ' ' + money(x[1]); }).join(', ') + (rent ? '. Net rent received: ' + money(rent) : ''));
    var h = '<div role="img" aria-label="' + lab + '"><p class="tc-lab">Costs over the period</p><svg viewBox="0 0 ' + W + ' 28" preserveAspectRatio="none" class="tc-svg" aria-hidden="true">';
    parts.forEach(function (x) { var w = W * x[1] / max; if (w > 0) h += '<rect x="' + X.toFixed(1) + '" y="0" width="' + Math.max(w - 2, 1).toFixed(1) + '" height="28" fill="' + x[2] + '"></rect>'; X += w; });
    h += '</svg>';
    if (rent > 0) h += '<p class="tc-lab">Net rent received</p><svg viewBox="0 0 ' + W + ' 18" preserveAspectRatio="none" class="tc-svg sm" aria-hidden="true"><rect x="0" y="0" width="' + (W * rent / max).toFixed(1) + '" height="18" fill="#7FC8A9"></rect></svg>';
    h += '</div><ul class="tc-leg">' + parts.map(function (x) { return '<li><i style="background:' + x[2] + '"></i>' + esc(x[0]) + ' <b>' + money(x[1]) + '</b></li>'; }).join('') + (rent > 0 ? '<li><i style="background:#7FC8A9"></i>Net rent <b>&minus;' + money(rent) + '</b></li>' : '') + '</ul>';
    return h;
  }

  function calc() {
    var c = C[ST.c], p = Math.max(0, n0($('tcP').value)), years = Math.max(0, n0($('tcY').value)), mo = Math.max(0, n0($('tcMo').value));
    var pur = 0, missing = 0;
    c.items.forEach(function (it) {
      if (it.kind === 'amt' && typeof it.v === 'function' && ST.vals[it.id] == null) { var inp = document.querySelector('[data-it="' + it.id + '"]'); if (inp && document.activeElement !== inp) inp.value = amtDef(it, p); }
      var a = itemAmt(it, p), el = document.querySelector('[data-amt="' + it.id + '"]'); if (a == null) { missing++; if (el) el.textContent = 'not set'; } else { pur += a; if (el) el.textContent = money(a); } });
    var legal = n0($('tcLegal').value), other = n0($('tcOther').value), one = legal + other;
    var own = Math.max(0, years - mo / 12);
    var sc = n0($('tcSc').value) * n0($('tcSz').value), yr = sc + n0($('tcTax').value) + n0($('tcIns').value) + p * n0($('tcMt').value) / 100;
    var rentOn = $('tcRentOn').checked, loanOn = $('tcLoanOn').checked;
    var rentY = rentOn ? n0($('tcRent1').value) * 12 * Math.min(100, n0($('tcOcc').value)) / 100 * (1 - Math.min(100, n0($('tcMg').value)) / 100) : 0;
    var L = loanOn ? p * Math.min(100, n0($('tcLv').value)) / 100 : 0;
    var intT = loanOn ? interest(L, n0($('tcLr').value), n0($('tcLt').value), Math.round(own * 12)) : 0;
    var run = yr * own, rentT = rentY * own;
    var total = pur + one + run + intT - rentT;
    var pre = Math.min(100, Math.max(0, n0($('tcPre').value)));
    $('oY').textContent = years;
    var gain = total < 0;
    $('oLbl').textContent = gain ? 'Net rent is higher than your costs over ' : 'Total cost of owning it' + (rentOn ? ' after rent' : '') + ', over ';
    $('oTot').textContent = (gain ? '+' : '') + money(Math.abs(total));
    $('oPy').textContent = gain ? 'You come out ahead by ' + money(-total / Math.max(years, 1)) + ' per year on average, before income tax on rent and before any change in the property value.' : years > 0 ? money(total / years) + ' per year on average' + (p > 0 ? ', or ' + (total / p * 100).toFixed(1) + '% of the price over the period' : '') + '.' : 'Enter the years you plan to hold it.';
    var up = p - L + pur + one;
    $('oUp').textContent = money(up);
    $('oUpB').innerHTML = '<div><span>Before handover (' + pre + '% of price)</span><span>' + money(p * pre / 100) + '</span></div><div><span>At handover, less any loan</span><span>' + money(Math.max(0, p * (100 - pre) / 100 - L)) + '</span></div><div><span>Taxes, fees, one-off costs</span><span>' + money(pur + one) + '</span></div>';
    $('oYr').textContent = money(yr);
    $('oPur').textContent = money(pur);
    $('oRentR').hidden = !rentOn; $('oRent').textContent = money(rentY);
    $('oIntR').hidden = !loanOn; $('oInt').textContent = money(intT);
    $('tcRent').hidden = !rentOn; $('tcLoan').hidden = !loanOn; $('tcLoanH').hidden = !loanOn;
    var parts = [['Purchase taxes and fees', pur, '#FF5B14'], ['One-off costs', one, '#FFB48F'], ['Running costs', run, '#C2C9D0'], ['Mortgage interest', intT, '#8FA3B5']].filter(function (x) { return x[1] > 0; });
    $('oChart').innerHTML = parts.length || rentT ? chart(parts, rentT) : '';
    var w = [];
    if (missing) w.push(missing + ' tax or fee field' + (missing > 1 ? 's are' : ' is') + ' empty, so the total leaves ' + (missing > 1 ? 'them' : 'it') + ' out.');
    if ($('tcCur').value !== c.cur && c.items.some(function (it) { return it.kind === 'amt' || it.ded != null; })) w.push('Fixed fees and thresholds above are in ' + c.cur + '. Convert them to ' + $('tcCur').value + ' or switch the currency back.');
    if ((c.items.some(function (it) { return it.kind === 'calc'; })) && $('tcCur').value !== c.cur) w.push('The tax bands are in ' + c.cur + ': enter the price in ' + c.cur + ' for the right result.');
    if (own <= 0 && years > 0) w.push('You plan to sell before handover, so no running costs or rent are counted.');
    $('oWarn').hidden = !w.length; $('oWarn').innerHTML = w.map(esc).join('<br>');
  }

  function setCountry(k) {
    ST.c = k; ST.vals = {}; ST.opts = {};
    $('tcCur').value = C[k].cur;
    drawItems(); calc();
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('tcC').innerHTML = Object.keys(C).map(function (k) { return '<option value="' + k + '">' + esc(C[k].name) + '</option>'; }).join('');
    $('tcCur').innerHTML = CURS.map(function (c) { return '<option>' + c + '</option>'; }).join('');
    var q = ''; try { q = new URLSearchParams(location.search).get('country') || ''; } catch (e) {}
    var k = C[q] ? q : 'ae'; $('tcC').value = k;
    $('tcC').addEventListener('change', function () { setCountry(this.value); });
    $('tcItems').addEventListener('input', function (e) {
      var t = e.target;
      if (t.dataset.it) ST.vals[t.dataset.it] = t.value;
      if (t.dataset.ded) ST.vals[t.dataset.ded + '_ded'] = t.value;
      calc();
    });
    $('tcItems').addEventListener('change', function (e) { var t = e.target; if (t.dataset.opt) { ST.opts[t.dataset.opt] = t.checked; calc(); } });
    $('tcF').addEventListener('input', function (e) { if (!e.target.closest('#tcItems')) calc(); });
    $('tcF').addEventListener('change', function (e) { if (e.target.id === 'tcCur' || e.target.type === 'checkbox') calc(); });
    setCountry(k);
  });
})();
