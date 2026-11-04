(function(){
  'use strict';
  var $ = function(i){ return document.getElementById(i); };
  var D = null, ready = false;
  var CURS = ['USD','EUR','GBP','AUD','AED','IDR','THB','MYR','PHP','SGD','HKD','VND','CNY','JPY','CHF','INR'];
  var ORDER = ['apt','apt_hi','house','house_mid','house_hi'];

  function num(v){ v = String(v == null ? '' : v).replace(/[\s,]/g, ''); if (v === '') return NaN; return parseFloat(v); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function money(v, c){
    if (!isFinite(v)) return '';
    if (Math.abs(v) >= 1e5) v = +v.toPrecision(3);
    try { return new Intl.NumberFormat('en', { style:'currency', currency:c, maximumFractionDigits:0 }).format(v); }
    catch(e){ return c + ' ' + Math.round(v).toLocaleString('en'); }
  }
  function compact(v, c){
    var a = Math.abs(v), s = '', d = v;
    if (a >= 1e9) { s = 'B'; d = v / 1e9; } else if (a >= 1e6) { s = 'M'; d = v / 1e6; } else if (a >= 1e4) { s = 'k'; d = v / 1e3; } else return money(v, c);
    var sym = money(0, c).replace(/[\d.,\s]/g, '') || c + ' ';
    return sym + (+d.toFixed(Math.abs(d) >= 100 ? 0 : Math.abs(d) >= 10 ? 1 : 2)).toLocaleString('en') + s;
  }
  function ratioTxt(r){ return (Math.round(r * 100) / 100).toLocaleString('en') + ' times'; }

  // Rate: units of currency c per 1 EUR, from the ECB reference rates stored with the data.
  function perEur(c){ return c === 'EUR' ? 1 : (D.fx.per_eur[c] || NaN); }

  function cityOf(market){
    for (var i = 0; i < D.all_markets.length; i++) if (D.all_markets[i][0] === market) return D.all_markets[i];
    return null;
  }

  function fillMarkets(){
    var s = $('bcM'), cov = document.createElement('optgroup'), un = document.createElement('optgroup');
    cov.label = 'Published costs available'; un.label = 'No published costs yet';
    D.all_markets.forEach(function(m){
      var o = document.createElement('option'); o.value = m[0]; o.textContent = m[0] + (m[0] !== m[1] ? ' · ' + m[1] : '');
      (m[2] ? cov : un).appendChild(o);
    });
    s.appendChild(cov); s.appendChild(un);
    s.value = 'Bali';
    var c = $('bcC');
    CURS.forEach(function(k){ var o = document.createElement('option'); o.value = k; o.textContent = k; c.appendChild(o); });
    c.value = 'USD';
  }

  function fillTypes(keep){
    var m = cityOf($('bcM').value), box = $('bcT'), city = m && m[2] ? D.cities[m[2]] : null;
    var cur = keep || (box.querySelector('input:checked') || {}).value || 'apt';
    box.innerHTML = '';
    if (!city) { box.innerHTML = '<span class="tl-hint">No published cost figures for this market yet.</span>'; return; }
    var keys = ORDER.filter(function(k){ return city.types[k]; });
    if (keys.indexOf(cur) < 0) cur = keys[0];
    keys.forEach(function(k){
      var l = document.createElement('label'); l.className = 'tl-chip';
      l.innerHTML = '<input type="radio" name="bct" value="' + k + '"' + (k === cur ? ' checked' : '') + '><span>' + esc(D.types[k]) + '</span>';
      box.appendChild(l);
    });
  }

  // Range for one type in the comparison currency.
  function rangeLocal(city, k){
    var r = city.types[k]; if (!r) return null;
    var f = city.usd_rate || 1;
    return [r[0] * f, r[1] == null ? null : r[1] * f];
  }

  function state(){
    var t = $('bcT').querySelector('input:checked');
    return { m: $('bcM').value, t: t ? t.value : '', s: num($('bcS').value), p: num($('bcP').value), c: $('bcC').value };
  }

  function writeUrl(st){
    try {
      var q = new URLSearchParams();
      q.set('m', st.m); if (st.t) q.set('t', st.t);
      if (st.s > 0) q.set('s', String(st.s)); if (st.p > 0) q.set('p', String(st.p)); q.set('c', st.c);
      history.replaceState(null, '', location.pathname + '?' + q.toString());
    } catch(e){}
  }
  function readUrl(){
    var q; try { q = new URLSearchParams(location.search); } catch(e){ return; }
    if (q.get('m') && cityOf(q.get('m'))) $('bcM').value = q.get('m');
    if (q.get('c') && CURS.indexOf(q.get('c')) >= 0) $('bcC').value = q.get('c');
    if (num(q.get('s')) > 0) $('bcS').value = (+num(q.get('s'))).toLocaleString('en', { maximumFractionDigits: 2 });
    if (num(q.get('p')) > 0) $('bcP').value = (+num(q.get('p'))).toLocaleString('en', { maximumFractionDigits: 2 });
    fillTypes(q.get('t') || '');
  }

  function calc(){
    if (!ready) return;
    var st = state(), m = cityOf(st.m), city = m && m[2] ? D.cities[m[2]] : null;
    var o1 = $('bcO1'), o2 = $('bcO2'), kv = $('bcKV'), fx = $('bcFX');
    o2.className = 'mx-band';
    writeUrl(st);
    $('bcMH').textContent = city ? 'Costs from ' + m[2] + (m[2] === st.m ? '' : ', the nearest city with published figures') + '.' : 'No published construction cost survey we could cite for ' + (m ? m[1] : 'this market') + ' yet.';
    if (!(st.s > 0) || !(st.p > 0)) {
      o1.textContent = !(st.p > 0) ? 'Enter the price' : 'Enter the size';
      o2.textContent = ''; kv.innerHTML = ''; fx.textContent = ''; chart(null); return;
    }
    if (!city) {
      o1.textContent = money(st.p / st.s, st.c);
      o2.textContent = 'No comparison: we have not found a published per m² construction cost survey for ' + m[1] + ' that we could read and cite.';
      kv.innerHTML = ''; fx.textContent = ''; chart(null); return;
    }
    // Comparison currency: the city's currency when we can reach it with ECB rates, else the source currency (USD).
    var loc = city.local, cmp, factor, rateNote = '';
    var canLocal = st.c === loc || (isFinite(perEur(st.c)) && isFinite(perEur(loc)));
    if (city.usd_rate == null) { cmp = loc; factor = 1; }
    else if (canLocal) { cmp = loc; factor = city.usd_rate; }
    else { cmp = 'USD'; factor = 1; }
    var ppm = st.p / st.s, ppmCmp = ppm;
    if (st.c !== cmp) {
      if (!isFinite(perEur(st.c)) || !isFinite(perEur(cmp))) {
        o1.textContent = money(ppm, st.c); o2.textContent = 'We have no ECB reference rate to convert ' + st.c + ' to ' + cmp + '. Enter the price in ' + cmp + '.'; kv.innerHTML = ''; chart(null); return;
      }
      ppmCmp = ppm / perEur(st.c) * perEur(cmp);
      rateNote = 'Converted at the ECB reference rate of ' + D.fx.date + ': 1 ' + st.c + ' = ' + (+(perEur(cmp) / perEur(st.c)).toPrecision(5)).toLocaleString('en') + ' ' + cmp + (st.c === 'AED' || cmp === 'AED' ? ' (AED from the USD peg)' : '') + '.';
    }
    fx.textContent = rateNote;
    var r = city.types[st.t]; if (!r) { fillTypes(); return calc(); }
    var lo = r[0] * factor, hi = r[1] == null ? null : r[1] * factor;
    var src = D.sources[city.source];
    o1.textContent = money(ppmCmp, cmp);
    var ratio = ppmCmp / lo;
    if (ppmCmp < lo) {
      o2.textContent = 'Below the low end of the published cost just to build this type (' + D.types[st.t] + ') in ' + m[2] + ': ' + money(lo, cmp) + ' per m², before land. Ask the questions below before you pay.';
      o2.classList.add('hi');
    } else {
      o2.textContent = ratioTxt(ratio) + ' the low end of the build cost range. Not below build cost. This does not say the price is fair: land, fees and profit come on top.';
      o2.classList.add(ratio < 1.5 ? 'md' : 'lo');
    }
    var pubName = (city.published_names && city.published_names[st.t]) || D.types[st.t];
    kv.innerHTML =
      '<div><span>Build cost, ' + esc(pubName) + '</span><b>' + money(lo, cmp) + (hi ? ' to ' + money(hi, cmp) : ' and up') + ' per m²' + (city.usd_rate && cmp !== 'USD' ? ' (US$' + r[0].toLocaleString('en') + (r[1] == null ? ' and up' : ' to ' + r[1].toLocaleString('en')) + ' as published)' : '') + '</b></div>' +
      '<div><span>Your price per m²</span><b>' + money(ppmCmp, cmp) + (st.c !== cmp ? ' (' + money(ppm, st.c) + ')' : '') + '</b></div>' +
      '<div><span>Price per m² divided by the low end</span><b>' + ratioTxt(ratio) + '</b></div>' +
      '<div><span>Building alone at the low end, for ' + (+st.s).toLocaleString('en') + ' m²</span><b>' + money(lo * st.s, cmp) + '</b></div>' +
      '<div><span>Source</span><b>' + esc(src.publisher) + ', ' + esc(src.edition) + ', ' + (city.source === 'tt-uae-2024' ? 'page ' : 'p. ') + esc(city.page) + '</b></div>';
    $('bcFine').textContent = 'Build cost is for the building only. Land, permits, design fees, marketing, finance, tax and the developer\'s margin come on top. ' + (city.usd_rate ? 'Arcadis converted ' + loc + ' to US dollars at ' + loc + ' ' + city.usd_rate.toLocaleString('en') + ' per US$1; ' + (cmp === loc ? 'we use the same rate back, so this is the local figure. ' : '') : '') + 'Taxes: ' + city.tax + '.' + (city.note ? ' ' + city.note : '');
    chart({ city: city, cmp: cmp, factor: factor, ppm: ppmCmp, sel: st.t, name: m[2] });
  }

  function chart(c){
    var box = $('bcChart'), cap = $('bcCap');
    if (!c) { box.innerHTML = '<p class="mx-cap">The picture appears once there is a covered market, a size and a price.</p>'; cap.textContent = ''; return; }
    var keys = ORDER.filter(function(k){ return c.city.types[k]; });
    var rows = keys.map(function(k){ var r = c.city.types[k]; return { k: k, lo: r[0] * c.factor, hi: r[1] == null ? r[0] * c.factor * 1.15 : r[1] * c.factor, open: r[1] == null }; });
    var max = Math.max(c.ppm, Math.max.apply(null, rows.map(function(r){ return r.hi; }))) * 1.08;
    var W = Math.max(300, Math.min(960, box.clientWidth - 8)), small = W < 560;
    var labW = small ? 0 : 230, rowH = small ? 52 : 40, top = 14, H = top + rows.length * rowH + 40, x0 = labW + 8, x1 = W - 12;
    var X = function(v){ return x0 + (x1 - x0) * v / max; };
    var o = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-labelledby="bcSvgT"><title id="bcSvgT">Price per m2 against published build cost ranges in ' + esc(c.name) + '</title>';
    rows.forEach(function(r, i){
      var y = top + i * rowH, by = small ? y + 18 : y + 8, sel = r.k === c.sel;
      if (small) o += '<text x="' + x0 + '" y="' + (y + 12) + '" font-size="12" fill="#17212B"' + (sel ? ' font-weight="700"' : '') + '>' + esc(D.types[r.k]) + '</text>';
      else o += '<text x="' + labW + '" y="' + (by + 15) + '" text-anchor="end" font-size="13" fill="#17212B"' + (sel ? ' font-weight="700"' : '') + '>' + esc(D.types[r.k]) + '</text>';
      o += '<rect x="' + X(r.lo) + '" y="' + by + '" width="' + Math.max(2, X(r.hi) - X(r.lo)) + '" height="22" rx="5" fill="' + (sel ? '#17212B' : '#9AA4AE') + '"' + (r.open ? ' opacity=".55"' : '') + '/>';
      o += '<text x="' + (X(r.lo) - 4) + '" y="' + (by + 15) + '" text-anchor="end" font-size="11" fill="#59626B">' + esc(compact(r.lo, c.cmp)) + '</text>';
    });
    var px = X(c.ppm), below = c.ppm < c.city.types[c.sel][0] * c.factor;
    o += '<line x1="' + px + '" x2="' + px + '" y1="' + (top - 6) + '" y2="' + (H - 30) + '" stroke="' + (below ? '#C2410C' : '#0B7A55') + '" stroke-width="3"/>';
    var lx = Math.min(Math.max(px, x0 + 60), x1 - 60);
    o += '<text x="' + lx + '" y="' + (H - 10) + '" text-anchor="middle" font-size="13" font-weight="700" fill="' + (below ? '#C2410C' : '#0B7A55') + '">Your price: ' + esc(compact(c.ppm, c.cmp)) + ' per m²</text>';
    o += '<line x1="' + x0 + '" x2="' + x1 + '" y1="' + (H - 30) + '" y2="' + (H - 30) + '" stroke="#17212B" stroke-width="1"/>';
    o += '</svg>';
    box.innerHTML = o;
    cap.textContent = 'Bars: published low to high construction cost per m² in ' + c.name + ', in ' + c.cmp + '. Dark bar: the type you chose. Line: your price per m². A faded bar has no published upper end.';
  }

  function tracked(){
    var T = D.tracked, tb = $('bcTr').tBodies[0];
    var tot = T.markets.reduce(function(a, m){ a.c += m.compared; a.b += m.below; a.u += m.under_1_5x; return a; }, { c: 0, b: 0, u: 0 });
    $('bcTrIntro').textContent = T.what + ' Result on ' + T.computed + ': ' + tot.b + ' of ' + tot.c + ' compared projects are priced below that line; ' + tot.u + ' are under 1.5 times it.';
    tb.innerHTML = T.markets.map(function(m){
      return '<tr><td>' + esc(m.market) + '</td><td>' + esc(m.city) + '</td><td>' + m.tracked + '</td><td>' + m.compared + '</td><td>' + m.below + '</td><td>' + m.under_1_5x + '</td><td>' + (m.median_ratio == null ? 'too few' : m.median_ratio.toLocaleString('en') + ' times') + '</td></tr>';
    }).join('');
    $('bcTrCav').textContent = T.caveats.join(' ') + ' ' + D.not_covered;
  }

  function sources(){
    var h = '';
    Object.keys(D.sources).forEach(function(k){
      var s = D.sources[k];
      h += '<h3>' + esc(s.publisher) + ': ' + esc(s.title) + '</h3><ul>' +
        '<li>Edition: ' + esc(s.edition) + '. ' + esc(s.pages) + '. <a href="' + esc(s.url) + '" rel="noopener">Open the PDF</a></li>' +
        (s.basis || []).map(function(b){ return '<li>' + esc(b) + '</li>'; }).join('') +
        (s.city_sources ? '<li>Local data by city: ' + esc(s.city_sources) + '</li>' : '') +
        (s.later ? '<li>Newer figure, shown for context only: ' + esc(s.later) + '</li>' : '') +
        '<li>Terms: ' + esc(s.terms) + '</li></ul>';
    });
    h += '<h3>Market matching</h3><ul><li>' + esc(D.markets_note) + '</li><li>Exchange rates: ' + esc(D.fx.source) + ' of ' + esc(D.fx.date) + '; ' + esc(D.fx.aed) + '.</li><li>The data file: <a href="/tools/build-cost/build-cost.json">build-cost.json</a></li></ul>';
    $('bcSrc').innerHTML = h;
  }

  function init(){
    fillMarkets(); fillTypes(); readUrl(); ready = true;
    tracked(); sources(); calc();
    $('bcF').addEventListener('input', calc);
    $('bcF').addEventListener('change', function(e){ if (e.target.id === 'bcM') fillTypes(); calc(); });
    ['bcP', 'bcS'].forEach(function(id){ $(id).addEventListener('blur', function(){ var v = num(this.value); if (v > 0) this.value = v.toLocaleString('en', { maximumFractionDigits: 2 }); }); });
    $('bcShare').addEventListener('click', function(){
      var msg = $('bcShareMsg');
      try { navigator.clipboard.writeText(location.href).then(function(){ msg.textContent = 'Link copied. It holds only the numbers you typed.'; }, function(){ msg.textContent = location.href; }); }
      catch(e){ msg.textContent = location.href; }
    });
    var rt; window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(calc, 150); });
  }

  fetch('/tools/build-cost/build-cost.json?v=c261e7213e').then(function(r){ if (!r.ok) throw new Error('http'); return r.json(); }).then(function(j){ D = j; init(); }).catch(function(){
    $('bcO1').textContent = 'Data not loaded';
    $('bcO2').textContent = 'The cost data file did not load. Reload the page; if it persists, the figures are in build-cost.json.';
  });
})();
