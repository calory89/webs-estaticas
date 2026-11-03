/* Kolaboro live cases: every tracked off-plan project worldwide, with a public-transparency scorecard, map and filters */
(function(){
  var D = window.KB_CASES || { cases: [] }, C = D.cases;
  var CENT = { 'Izmir':[38.42,27.14], 'Bacalar':[18.68,-88.39], 'Gili Islands':[-8.35,116.04], 'Koh Phangan':[9.73,100.01], 'Naples':[26.14,-81.79], 'Riviera Nayarit':[20.87,-105.44], 'Serbia':[44.8,20.46], 'Vanuatu':[-17.73,168.32], 'Aruba':[12.52,-70.03], 'Curacao':[12.17,-68.98], 'Laos':[17.97,102.6], 'Accra':[5.6,-0.19], 'Kigali':[-1.95,30.06], 'Nicaragua':[11.5,-86.4], 'Saint Lucia':[13.9,-60.98], 'Cartagena':[10.39,-75.51], 'Da Nang':[16.05,108.22], 'Diani':[-4.32,39.58], 'Ecuador':[-0.95,-80.73], 'El Salvador':[13.49,-89.38], 'French Alps':[45.92,6.87], 'Ho Chi Minh City':[10.78,106.7], 'Jamaica':[18.41,-77.1], 'Japan':[36.2,138.25], 'Medellín':[6.24,-75.58], 'Palm Beach County':[26.7,-80.06], 'Panama City':[8.98,-79.52], 'Porto de Galinhas':[-8.5,-35.0], 'Punta Cana':[18.58,-68.4], 'Bali':[-8.65,115.2], 'Lombok':[-8.65,116.3], 'Labuan Bajo':[-8.5,119.9], 'Phuket':[7.88,98.39], 'Koh Samui':[9.5,100.0], 'Pattaya':[12.93,100.88], 'Bangkok':[13.75,100.5], 'Hua Hin':[12.57,99.96], 'Krabi':[8.09,98.9], 'Chiang Mai':[18.79,98.98],
    'Dubai':[25.2,55.27], 'Abu Dhabi':[24.45,54.38], 'Ras Al Khaimah':[25.79,55.94], 'Oman':[23.59,58.41], 'Istanbul':[41.01,28.98], 'Antalya':[36.9,30.7], 'Egypt':[30.0,31.2], 'Cyprus':[34.7,33.0], 'Northern Cyprus':[35.33,33.32],
    'Greece':[37.98,23.73], 'Montenegro':[42.29,18.84], 'Croatia':[45.1,13.9], 'Georgia':[41.64,41.63], 'Spain':[38.35,-0.48], 'Costa del Sol':[36.51,-4.88], 'Portugal':[38.72,-9.14], 'Algarve':[37.09,-8.25],
    'Riviera Maya':[20.63,-87.07], 'Los Cabos':[22.89,-109.92], 'Puerto Vallarta':[20.65,-105.23], 'Mérida':[20.97,-89.62], 'Costa Rica':[10.6,-85.6], 'Panama':[8.98,-79.52], 'Dominican Republic':[18.58,-68.4], 'Colombia':[6.24,-75.58],
    'Brazil':[-3.73,-38.52], 'Miami':[25.76,-80.19], 'Vietnam':[16.05,108.2], 'Philippines':[10.32,123.89], 'Malaysia':[3.14,101.69], 'Cambodia':[11.56,104.92], 'Sri Lanka':[6.93,79.85], 'Niseko':[42.8,140.69], 'Albania':[41.3,19.6], 'Antigua':[17.07,-61.8], 'Austin':[30.27,-97.74], 'Bahrain':[26.2,50.58], 'Belize':[17.5,-88.2], 'Bodrum':[37.04,27.43], 'Buenos Aires':[-34.6,-58.38], 'Bulgaria':[41.84,23.49], 'Cape Town':[-33.92,18.42], 'Fiji':[-17.8,177.4], 'Goa':[15.5,73.83], 'Gold Coast':[-28.0,153.43], 'Grenada':[12.05,-61.75], 'London':[51.5,-0.12], 'Manchester':[53.48,-2.24], 'Marrakech':[31.63,-8.0], 'Mauritius':[-20.2,57.5], 'Nairobi':[-1.29,36.82], 'New Zealand':[-45.03,168.66], 'Okinawa':[26.5,127.9], 'Orlando':[28.54,-81.38], 'Puerto Rico':[18.4,-66.0], 'Qatar':[25.29,51.53], 'Saudi Arabia':[21.54,39.17], 'Seychelles':[-4.62,55.45], 'St Kitts and Nevis':[17.3,-62.73], 'Sydney':[-33.87,151.21], 'Turks and Caicos':[21.79,-72.2], 'Uruguay':[-34.96,-54.95], 'Zanzibar':[-6.16,39.2], 'Ajman':[25.41,55.45], 'Birmingham':[52.48,-1.9], 'Sharjah':[25.35,55.4], 'Costa Blanca':[38.35,-0.48], 'Balearics':[39.57,2.65], 'Canary Islands':[28.29,-16.63], 'Lisbon':[38.72,-9.14], 'Madeira':[32.65,-16.91], 'Italy':[41.9,12.5], 'French Riviera':[43.7,7.27], 'Malta':[35.9,14.51], 'Dublin':[53.35,-6.26], 'Maldives':[4.18,73.51], 'Melbourne':[-37.81,144.96], 'St Lucia':[13.91,-60.98], 'Cape Verde':[16.0,-24.0], 'Umm Al Quwain':[25.56,55.55], 'Jakarta':[-6.21,106.85], 'Sumba':[-9.65,119.4], 'Mexico City':[19.43,-99.13], 'Porto':[41.15,-8.61], 'Comporta':[38.38,-8.78], 'Alanya':[36.54,32.0], 'Barcelona':[41.39,2.17], 'Namibia':[-22.56,17.08], 'Senegal':[14.69,-17.44], 'Cayman Islands':[19.31,-81.25], 'Bahamas':[25.03,-77.4], 'Barbados':[13.1,-59.61], 'Hawaii':[21.3,-157.86], 'Fort Lauderdale':[26.12,-80.14], 'Tampa':[27.95,-82.46], 'New York':[40.71,-74.0], 'Nashville':[36.16,-86.78], 'Las Vegas':[36.17,-115.14], 'Houston':[29.76,-95.37], 'Liverpool':[53.41,-2.98], 'Leeds':[53.8,-1.55], 'Glasgow':[55.86,-4.25], 'Edinburgh':[55.95,-3.19], 'Hakuba':[36.7,137.86], 'Tokyo':[35.68,139.69], 'Kyoto':[35.01,135.77], 'Brisbane':[-27.47,153.03], 'Perth':[-31.95,115.86] };
  var TIER = { clear: ['Strong public disclosure','#0B7A55'], mixed: ['Some gaps','#8A5A0F'], caution: ['Check carefully','#B42318'] };
  var CK = [['permit','Permit or licence number published'],['escrow','Deposit protection (escrow, bank guarantee or trust)'],['progress','Construction progress published'],['plans','Site or floor plans published'],['record','Developer track record stated'],['returns_ok','No "guaranteed" return language']];
  function $(i){ return document.getElementById(i); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function n(x){ return (+x || 0).toLocaleString('en'); }
  var S = { m: '', t: '', q: '', sort: 'best', lim: 24, st: '' };
  function full(c){ return (c.max || 0) === 6 && (c.score || 0) === 6 && !(c.flags || []).length; }
  function okk(c, k){ var ck = c.checks || {}; return k === 'permit' ? ck.permit === 2 : k === 'escrow' ? ck.escrow === true : k === 'progress' ? ck.progress != null : !!ck[k]; }
  function tierOk(c){ if (S.st && c.stage !== S.st) return false; return !S.t || (S.t === 'full' ? full(c) : S.t === 'verified' ? (c.vscore || 0) >= 4 : c.tier === S.t); }
  function stat(){
    var mk = {}, ct = {}; C.forEach(function(c){ mk[c.market] = 1; ct[c.country] = 1; });
    var permit = C.filter(function(c){ return c.checks && c.checks.permit === 2; }).length, escw = C.filter(function(c){ return c.checks && c.checks.escrow === true; }).length,
        fl = C.filter(function(c){ return (c.flags || []).length; }).length, inv = C.filter(function(c){ return c.invited; }).length, clear = C.filter(function(c){ return c.tier === 'clear'; }).length;
    $('kst').innerHTML = [[n(C.length),'off-plan projects tracked'],[Object.keys(mk).length + ' · ' + Object.keys(ct).length,'markets · countries'],[Math.round(permit / C.length * 100) + '%','publish a permit or licence number'],[escw + ' of ' + C.filter(function(c){ return c.checks && (c.checks.researched || []).indexOf('escrow') >= 0; }).length,'researched in depth say how your deposit is protected'],[n(fl),'with problems reported in public sources'],[n(C.filter(full).length) + ' of ' + n(C.filter(function(c){ return c.max === 6; }).length),'researched in depth publish all 6 (100%)'],[n(C.filter(function(c){ return (c.vscore || 0) >= 4; }).length),'with 4+ checks confirmed by a registry or independent source'],[n(C.filter(function(c){ return c.claims && c.claims.contradicted; }).length),'with at least one contradicted claim']]
      .map(function(x){ return '<div><b>' + x[0] + '</b><span>' + x[1] + '</span></div>'; }).join('');
    var opts = Object.keys(mk).sort().map(function(m){ return '<option value="' + esc(m) + '">' + esc(m) + ' (' + C.filter(function(c){ return c.market === m; }).length + ')</option>'; }).join('');
    $('kmk').innerHTML = '<option value="">All markets (' + C.length + ')</option>' + opts;
  }
  // plain-language search: "bali under construction with permit and escrow under 400k", "late dubai", "contradicted freehold 2027"
  var STOP = /^(and|with|the|a|an|in|of|for|projects?|that|have|has|show|me|which|are|is|where|no|not|without|public|published|only)$/;
  function priceTop(b){ var m = String(b || '').match(/(\d+(?:\.\d+)?)\s*([km])\b(?!.*\d+\s*[km]\b)/i); if (!m) return null; return +m[1] * (m[2].toLowerCase() === 'm' ? 1000 : 1); }
  function parseQ(raw){
    var q = ' ' + String(raw || '').toLowerCase().replace(/[,;]/g, ' ') + ' ', T = [], L = [];
    var add = function(re, label, fn){ if (re.test(q)) { q = q.replace(re, ' '); T.push(fn); L.push(label); } };
    add(/\bno (flags?|problems?|red flags?)\b|\bclean\b/, 'no public problems', function(c){ return !(c.flags || []).length; });
    add(/\b(red )?flags?\b|\bproblems?\b|\bwarnings?\b/, 'public problems', function(c){ return (c.flags || []).length > 0; });
    add(/\bno (escrow|deposit protection)\b|\bwithout (escrow|deposit protection)\b/, 'no deposit protection', function(c){ return (c.checks || {}).escrow !== true; });
    add(/\bescrow\b|\bdeposit protect(ion|ed)\b|\btrust account\b/, 'deposit protection', function(c){ return (c.checks || {}).escrow === true; });
    add(/\bno permit\b|\bwithout (a )?permit\b/, 'no permit number', function(c){ return (c.checks || {}).permit !== 2; });
    add(/\bpermits?\b|\blicen[cs]es?\b/, 'permit number public', function(c){ return (c.checks || {}).permit === 2; });
    add(/\b100 ?%|\ball (6|six)\b|\bfully public\b/, '100% public', function(c){ return full(c); });
    add(/\bcontradict(ed|ions?)?\b|\bfalse\b|\bmisleading\b/, 'contradicted claims', function(c){ return c.claims && c.claims.contradicted > 0; });
    add(/\bconfirmed\b|\bverified\b|\bregistry\b/, 'confirmed 4+ of 6', function(c){ return (c.vscore || 0) >= 4; });
    add(/\b(late|delayed|delays?|overdue|behind)\b/, 'late', function(c){ return !!(c.overdue || c.delay); });
    add(/\bguaranteed?( returns?| rental| income)?\b/, 'guaranteed-return language', function(c){ return (c.checks || {}).returns_ok === false; });
    add(/\bunder construction\b|\bbuilding\b/, 'under construction', function(c){ return c.stage === 'under construction'; });
    add(/\boff[- ]?plan\b|\bpre[- ]?sale\b/, 'off-plan', function(c){ return c.stage === 'off-plan'; });
    add(/\bcompleted?\b|\bready\b|\bfinished\b/, 'completed', function(c){ return c.stage === 'completed'; });
    add(/\bfreehold\b/, 'freehold', function(c){ return /free/.test(c.title || ''); });
    add(/\bleasehold\b|\blease\b/, 'leasehold', function(c){ return /lease/.test(c.title || ''); });
    var pm = q.match(/\b(under|below|less than|max|<)\s*\$?\s*(\d+(?:\.\d+)?)\s*(k|m|million)?\b/);
    if (pm) { var cap = +pm[2] * (/m/.test(pm[3] || '') ? 1000 : (pm[3] ? 1 : (+pm[2] > 5000 ? 0.001 : 1))); q = q.replace(pm[0], ' '); L.push('under $' + (cap >= 1000 ? cap / 1000 + 'M' : cap + 'k')); T.push(function(c){ var t = priceTop(c.band); return t != null && t <= cap; }); }
    var ym = q.match(/\b(20[2-3]\d)\b/); if (ym) { var y = +ym[1]; q = q.replace(ym[0], ' '); L.push('completion ' + y); T.push(function(c){ return +c.done === y; }); }
    var words = q.split(/\s+/).filter(function(w){ return w && !STOP.test(w); });
    var places = {}; C.forEach(function(c){ [c.market, c.country, c.region].forEach(function(x){ if (x) places[x.toLowerCase()] = 1; }); });
    var rest = [];
    for (var i = 0; i < words.length; i++) { var two = words[i] + ' ' + (words[i + 1] || ''), three = two + ' ' + (words[i + 2] || '');
      if (places[three.trim()]) { rest.push(three.trim()); i += 2; } else if (places[two.trim()]) { rest.push(two.trim()); i += 1; } else rest.push(words[i]); }
    rest.forEach(function(w){ L.push('"' + w + '"'); T.push(function(c){ return [c.market, c.country, c.region, c.id, c.band, c.title, c.stage].concat(c.flags || [], c.notes || [], c.q || []).join(' ').toLowerCase().indexOf(w) >= 0; }); });
    return { labels: raw && raw.trim() ? L : [], test: function(c){ for (var j = 0; j < T.length; j++) if (!T[j](c)) return false; return true; } };
  }
  function showQ(P){ var el = $('kqi'); if (!el) { var kn = $('kn'); if (!kn) return; el = document.createElement('p'); el.id = 'kqi'; el.className = 'kqi'; kn.parentNode.insertBefore(el, kn); }
    el.innerHTML = P.labels.length ? 'Showing projects with: ' + P.labels.map(function(l){ return '<b>' + esc(l) + '</b>'; }).join(' ') : ''; }
  function list(){
    var P = parseQ(S.q); showQ(P);
    var L = C.filter(function(c){ return (!S.m || c.market === S.m) && tierOk(c) && P.test(c); });
    var ord = { clear: 0, mixed: 1, caution: 2 };
    if (S.sort === 'best') L.sort(function(a, b){ return (b.score || 0) / (b.max || 6) - (a.score || 0) / (a.max || 6) || (a.flags || []).length - (b.flags || []).length; });
    if (S.sort === 'worst') L.sort(function(a, b){ return ord[b.tier] - ord[a.tier] || (a.score || 0) / (a.max || 6) - (b.score || 0) / (b.max || 6); });
    if (S.sort === 'market') L.sort(function(a, b){ return a.market < b.market ? -1 : a.market > b.market ? 1 : a.id < b.id ? -1 : 1; });
    return L;
  }
  function card(c){
    var t = TIER[c.tier] || TIER.mixed, ck = c.checks || {};
    var meta = [c.stage ? (c.stage === 'under construction' ? 'Under construction' : c.stage === 'completed' ? 'Completed, still selling' : 'Off-plan') : null, c.band, c.title ? c.title.replace('_', ' ') + (c.lease ? ' ' + c.lease + ' yrs' : '') : null, c.done ? 'completion ' + c.done : 'no completion date', c.yield ? c.yield + '% yield advertised' : null].filter(Boolean).join(' · ');
    var R = ck.researched || CK.map(function(k){ return k[0]; }), mx = c.max || R.length;
    var ticks = CK.map(function(k){ if (R.indexOf(k[0]) < 0) return ''; var v = ck[k[0]], ok = k[0] === 'permit' ? v === 2 : k[0] === 'progress' ? v != null : v === true;
      var half = k[0] === 'permit' && v === 1, txt = k[0] === 'progress' && v != null ? (typeof v === 'number' ? 'Construction progress published (' + v + '%)' : 'Construction progress published (dated updates)') : half ? 'Permit claimed, number not published' : k[1];
      var lv = c.verified && c.verified[k[0]], vb = !lv ? '' : lv === 'registry' ? '<b class="kv r" title="Confirmed in an official registry">registry</b>' : lv === 'independent' ? '<b class="kv i" title="Confirmed by an independent source">confirmed</b>' : lv === 'contradicted' ? '<b class="kv x" title="Sources disagree">contradicted</b>' : (ok && lv === 'developer') ? '<b class="kv d" title="Only the developer or its agents say so">not confirmed</b>' : '';
      return '<li class="' + (ok ? 'y' : half ? 'h' : 'n') + '"><i aria-hidden="true">' + (ok ? '✓' : half ? '~' : '✗') + '</i>' + esc(txt) + vb + '</li>'; }).join('') + (R.length < 6 ? '<li class="u"><i aria-hidden="true">·</i><em>Deposit protection, progress and track record: being researched</em></li>' : '');
    var steps = [['Promises read by AI', c.read, c.read ? c.checked : 'Queued'], ['Developer invited', !!c.invited, c.invited || 'Next'], ['Registry check', false, 'Pending'], ['Site visit with GPS video', false, 'Pending'], ['Verified and published', false, 'Pending']];
    return '<article class="case kc t-' + esc(c.tier || 'mixed') + '"><header><span class="cid">' + esc(c.id) + '</span><span class="kt" style="color:' + t[1] + ';border-color:' + t[1] + '">' + t[0] + '</span></header>' +
      '<h3>Off-plan project · ' + esc(c.region === c.market ? c.market : c.region + ', ' + c.market) + '<small> · ' + esc(c.country) + '</small></h3><p class="cmeta">' + esc(meta) + '</p>' + (c.sat && c.sat.status === 'no visible change' && c.stage === 'under construction' ? '<p class="kod">🛰 Almost no change visible from space in a year</p>' : '') + (c.overdue ? '<p class="kod">⏱ ' + c.overdue + ' month' + (c.overdue === 1 ? '' : 's') + ' past the promised handover</p>' : '') +
      (mx === 6 ? (full(c) ? '<p class="k100 y">✓ 100% public: all 6 checks published</p>' : '<p class="k100 n">Not 100%: missing ' + esc(CK.filter(function(k){ return !okk(c, k[0]); }).map(function(k){ return k[1].split(' (')[0].toLowerCase(); }).join(', ')) + '</p>') : '') + '<div class="ksc"><b>' + (c.score || 0) + '/' + mx + '</b><span>public checks' + (mx < 6 ? ' (deeper research pending)' : '') + (c.vscore != null ? ' · <strong class="kcf">' + c.vscore + '/6 confirmed</strong>' : '') + '</span><i style="width:' + ((c.score || 0) / mx * 100) + '%;background:' + t[1] + '"></i></div><ul class="k6">' + ticks + '</ul>' +
      (c.vscore != null ? '<p class="kvs"><b>' + c.vscore + '/6</b> confirmed by a registry or independent source' + (c.claims ? ' · ' + (c.claims.verified + c.claims.unverified + c.claims.contradicted) + ' claims checked: ' + c.claims.verified + ' verified, ' + c.claims.unverified + ' unverified' + (c.claims.contradicted ? ', <b class="kv x">' + c.claims.contradicted + ' contradicted</b>' : '') : '') + (c.delay ? ' · handover moved ' + c.delay + ' months' : '') + '</p>' : '') +
      ((c.flags || []).length ? '<p class="kfl">' + c.flags.map(function(f){ return '<span>⚠ ' + esc(f) + '</span>'; }).join('') + '</p>' : '') +
      ((c.notes || []).length ? '<p class="kfl kno">' + c.notes.map(function(f){ return '<span>ℹ ' + esc(f) + '</span>'; }).join('') + '</p>' : '') +
      '<p class="kopen"><a href="/p/?id=' + encodeURIComponent(c.id) + '">Open project file →</a><a href="/compare/?ids=' + encodeURIComponent(c.id) + '">Compare</a></p>' + '<details><summary>What our agent asks on site</summary>' + ((c.q || []).length ? '<ul class="cq">' + c.q.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
      '<ol class="csteps">' + steps.map(function(x){ return '<li class="' + (x[1] ? 'ok1' : '') + '"><span>' + x[0] + '</span><small>' + esc(x[2]) + '</small></li>'; }).join('') + '</ol>' +
      '<p class="kfoll"><a href="/check#analyze">Buying here? Get a free desk review →</a></p></details></article>';
  }
  function render(){
    var L = list(); $('kn').textContent = L.length + ' project' + (L.length === 1 ? '' : 's');
    $('cgrid').innerHTML = (L.length ? L.slice(0, S.lim).map(card).join('') : '<p class="muted">No project matches. Try another market or clear the search.</p>') + (L.length > S.lim ? '<button class="btn btn-line cmore" type="button">Show more (' + (L.length - S.lim) + ' left)</button>' : '');
    mapDots();
  }
  var MAP = null, LAYER = null;
  function mapInit(){
    if (!window.L || MAP) return;
    MAP = L.map('kmap', { scrollWheelZoom: false, worldCopyJump: true, attributionControl: true }).setView([18, 40], 2);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles © Esri', maxZoom: 8 }).addTo(MAP);
    LAYER = L.layerGroup().addTo(MAP); mapDots();
  }
  function mapDots(){
    if (!MAP) return; LAYER.clearLayers(); var g = {};
    C.forEach(function(c){ if (!tierOk(c)) return; (g[c.market] = g[c.market] || []).push(c); });
    Object.keys(g).forEach(function(m){ var ll = CENT[m]; if (!ll) return; var a = g[m], bad = a.filter(function(c){ return c.tier === 'caution'; }).length, good = a.filter(function(c){ return c.tier === 'clear'; }).length;
      var col = bad / a.length > .5 ? '#B42318' : good / a.length > .3 ? '#0B7A55' : '#FF5B14';
      L.circleMarker(ll, { radius: 6 + Math.sqrt(a.length) * 3, color: S.m === m ? '#17212B' : '#fff', weight: S.m === m ? 3 : 1.5, fillColor: col, fillOpacity: .85 })
        .bindTooltip('<b>' + esc(m) + '</b><br>' + a.length + ' projects · ' + good + ' with strong disclosure · ' + bad + ' to check carefully')
        .on('click', function(){ S.m = S.m === m ? '' : m; $('kmk').value = S.m; S.lim = 24; render(); $('kfil').scrollIntoView({ behavior: 'smooth', block: 'start' }); }).addTo(LAYER); });
  }
  function bind(){
    $('kmk').onchange = function(){ S.m = this.value; S.lim = 24; render(); };
    $('ksort').onchange = function(){ S.sort = this.value; render(); };
    if ($('kst2')) $('kst2').onchange = function(){ S.st = this.value; S.lim = 24; render(); };
    $('kq').oninput = function(){ S.q = this.value.trim(); S.lim = 24; render(); };
    $('ktier').onclick = function(e){ var b = e.target.closest('button'); if (!b) return; S.t = b.dataset.t; S.lim = 24; this.querySelectorAll('button').forEach(function(x){ x.classList.toggle('on', x === b); }); render(); };
    $('cgrid').addEventListener('click', function(e){
      if (e.target.closest('.cmore')) { S.lim += 24; render(); return; }
    });
  }
  function start(){
    stat(); bind(); try { var qs = new URLSearchParams(location.search).get('q'); if (qs) { $('kq').value = qs; S.q = qs.trim(); } } catch (e) {} render();
    var s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'; s.integrity = 'sha384-NElt3Op+9NBMCYaef5HxeJmU4Xeard/Lku8ek6hoPTvYkQPh3zLIrJP7KiRocsxO'; s.crossOrigin = 'anonymous'; s.onload = mapInit; document.head.appendChild(s);
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'; l.integrity = 'sha384-c6Rcwz4e4CITMbu/NBmnNS8yN2sC3cUElMEMfP3vqqKFp7GOYaaBBCqmaWBjmkjb'; l.crossOrigin = 'anonymous'; document.head.appendChild(l);
  }
  start();
  // the research agent republishes the data every week: use the newest copy if it has the scorecard
  fetch('/data/bali-cases.json?t=' + Math.floor(Date.now() / 6e5), { cache: 'no-store' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(d){
    if (!d || !d.cases || !d.cases.length || !d.cases[0].checks || d.cases.length < C.length) return; D = d; C = d.cases; stat(); render();
  }).catch(function(){});
})();
