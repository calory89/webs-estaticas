/* Kolaboro world map (/map/), block U6 batch 6. Every public project, placed at its MARKET's public point
   (/data/market-points.json, from Natural Earth and GeoNames), never at the plot. Markets near each other are clustered on screen.
   Data: /api/x/disc/points (compact rows from /data/bali-cases.json plus the market points). */
(function () {
  var $ = function (i) { return document.getElementById(i); };
  var TIER = { clear: ['Strong public disclosure', '#0B7A55'], mixed: ['Some gaps', '#B7791F'], caution: ['Check carefully', '#B42318'] };
  var STAGE = { 'off-plan': 'Off-plan', 'under construction': 'Under construction', 'completed': 'Completed, still selling', '': 'Stage not stated' };
  var BANDS = ['Under $100k', '$100k to $200k', '$200k to $400k', '$400k and up', 'Price not stated'];
  var R = [], P = {}, S = { country: '', stage: '', tier: '', band: '', market: '' }, MAP = null, LAYER = null, LIM = 60;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function row(r) { return { id: r[0], market: r[1], country: r[2], stage: r[3], tier: r[4], band: r[5] || 'Price not stated', score: r[6], max: r[7], area: r[8] }; }
  function readUrl() { try { var q = new URLSearchParams(location.search); Object.keys(S).forEach(function (k) { S[k] = q.get(k) || ''; }); } catch (e) {} }
  function writeUrl() {
    try { var q = new URLSearchParams(); Object.keys(S).forEach(function (k) { if (S[k]) q.set(k, S[k]); }); var u = location.pathname + (q.toString() ? '?' + q.toString() : ''); history.replaceState(null, '', u); } catch (e) {}
  }
  function ok(c, skipMarket) {
    return (!S.country || c.country === S.country) && (!S.stage || (S.stage === 'none' ? !c.stage : c.stage === S.stage)) && (!S.tier || c.tier === S.tier) && (!S.band || c.band === S.band) && (skipMarket || !S.market || c.market === S.market);
  }
  function opts(sel, vals, label, cur) {
    sel.innerHTML = '<option value="">' + esc(label) + '</option>' + vals.map(function (v) { return '<option value="' + esc(v[0]) + '"' + (v[0] === cur ? ' selected' : '') + '>' + esc(v[1]) + '</option>'; }).join('');
  }
  function filters() {
    var cs = {}; R.forEach(function (c) { cs[c.country] = (cs[c.country] || 0) + 1; });
    opts($('f-country'), Object.keys(cs).sort().map(function (k) { return [k, k + ' (' + cs[k] + ')']; }), 'All countries', S.country);
    opts($('f-stage'), [['off-plan', 'Off-plan'], ['under construction', 'Under construction'], ['completed', 'Completed, still selling'], ['none', 'Stage not stated']], 'All stages', S.stage);
    opts($('f-tier'), Object.keys(TIER).map(function (k) { return [k, TIER[k][0]]; }), 'All score tiers', S.tier);
    opts($('f-band'), BANDS.map(function (b) { return [b, b]; }), 'All price bands', S.band);
    ['country', 'stage', 'tier', 'band'].forEach(function (k) { $('f-' + k).onchange = function () { S[k] = this.value; if (k === 'country') S.market = ''; LIM = 60; render(true); }; });
    $('f-reset').onclick = function () { Object.keys(S).forEach(function (k) { S[k] = ''; }); filters(); LIM = 60; render(true); };
  }

  function groups() {
    var g = {};
    R.forEach(function (c) { if (!ok(c, true) || !P[c.market]) return; var m = g[c.market] || (g[c.market] = { market: c.market, country: c.country, n: 0, clear: 0, mixed: 0, caution: 0, ll: P[c.market] }); m.n++; m[c.tier] = (m[c.tier] || 0) + 1; });
    return Object.keys(g).map(function (k) { return g[k]; });
  }
  function pin(n, cls) { var s = Math.round(22 + Math.min(26, Math.sqrt(n) * 3.2)); return L.divIcon({ className: '', html: '<div class="mp-pin ' + cls + '" style="width:' + s + 'px;height:' + s + 'px">' + n + '</div>', iconSize: [s, s], iconAnchor: [s / 2, s / 2] }); }
  function colour(m) { return m.caution / m.n > 0.5 ? TIER.caution[1] : m.clear / m.n > 0.3 ? TIER.clear[1] : TIER.mixed[1]; }
  function popup(m) {
    var w = function (k) { return (100 * (m[k] || 0) / m.n).toFixed(1) + '%'; };
    return '<div class="mp-pop"><b>' + esc(m.market) + '</b> <small>' + esc(m.country) + '</small><p>' + m.n + ' project' + (m.n === 1 ? '' : 's') + ' with these filters</p>' +
      '<div class="bar" aria-hidden="true"><i style="width:' + w('clear') + ';background:' + TIER.clear[1] + '"></i><i style="width:' + w('mixed') + ';background:' + TIER.mixed[1] + '"></i><i style="width:' + w('caution') + ';background:' + TIER.caution[1] + '"></i></div>' +
      '<p>' + (m.clear || 0) + ' strong disclosure, ' + (m.mixed || 0) + ' some gaps, ' + (m.caution || 0) + ' check carefully</p>' +
      '<p><small>Placed at ' + esc(m.ll.place) + ' (' + (m.ll.how === 'country' ? 'country label point' : m.ll.how === 'anchor' ? 'anchor town for this region' : 'city') + '), not at any plot.</small></p>' +
      '<p><a href="/cases?market=' + encodeURIComponent(m.market) + '">Live cases</a> · <a href="/compare/markets/?m=' + encodeURIComponent(m.market) + '">Compare market</a></p></div>';
  }
  function draw() {
    if (!MAP) return;
    LAYER.clearLayers();
    var G = groups(), z = MAP.getZoom(), px = G.map(function (m) { return { m: m, p: MAP.project([m.ll.lat, m.ll.lng], z) }; }), used = [], R0 = 44;
    px.sort(function (a, b) { return b.m.n - a.m.n; });
    var clusters = [];
    px.forEach(function (a, i) {
      if (used[i]) return; used[i] = 1; var c = [a];
      px.forEach(function (b, j) { if (!used[j] && Math.abs(a.p.x - b.p.x) < R0 && Math.abs(a.p.y - b.p.y) < R0) { used[j] = 1; c.push(b); } });
      clusters.push(c);
    });
    clusters.forEach(function (c) {
      if (c.length === 1) {
        var m = c[0].m, mk = L.marker([m.ll.lat, m.ll.lng], { icon: pin(m.n, S.market === m.market ? 'on' : ''), title: m.market + ': ' + m.n + ' projects', keyboard: true, riseOnHover: true });
        mk.on('add', function () { var el = mk.getElement(); if (el) { el.firstChild.style.background = colour(m); el.setAttribute('aria-label', m.market + ', ' + m.n + ' projects'); } });
        mk.bindPopup(popup(m), { maxWidth: 260 });
        mk.on('click', function () { S.market = m.market; LIM = 60; render(false); });
        mk.addTo(LAYER);
      } else {
        var n = 0, la = 0, ln = 0, names = [];
        c.forEach(function (x) { n += x.m.n; la += x.m.ll.lat * x.m.n; ln += x.m.ll.lng * x.m.n; names.push(x.m.market); });
        var b = L.latLngBounds(c.map(function (x) { return [x.m.ll.lat, x.m.ll.lng]; }));
        var ck = L.marker([la / n, ln / n], { icon: pin(n, 'c'), title: names.length + ' markets: ' + names.slice(0, 6).join(', ') + (names.length > 6 ? '...' : '') + ' (' + n + ' projects). Click to zoom in.', keyboard: true });
        ck.on('add', function () { var el = ck.getElement(); if (el) el.setAttribute('aria-label', names.length + ' markets, ' + n + ' projects, zoom in'); });
        ck.on('click', function () { MAP.fitBounds(b.pad(0.6), { maxZoom: Math.min(MAP.getZoom() + 3, 9) }); });
        ck.addTo(LAYER);
      }
    });
  }
  function list() {
    var L0 = R.filter(function (c) { return ok(c, false); });
    L0.sort(function (a, b) { return a.market < b.market ? -1 : a.market > b.market ? 1 : a.id < b.id ? -1 : 1; });
    var noPt = L0.filter(function (c) { return !P[c.market]; }).length;
    $('mp-head').innerHTML = '<b>' + L0.length + '</b> project' + (L0.length === 1 ? '' : 's') + (S.market ? ' in <b>' + esc(S.market) + '</b> <button type="button" class="dc-btn" id="mp-all" style="min-height:32px;padding:2px 10px;margin-left:6px">All markets</button>' : '') + (noPt ? '<br><small class="muted">' + noPt + ' in markets without a public point yet (listed, not on the map)</small>' : '');
    if ($('mp-all')) $('mp-all').onclick = function () { S.market = ''; render(false); };
    $('mp-list').innerHTML = L0.length ? L0.slice(0, LIM).map(function (c) {
      var t = TIER[c.tier] || TIER.mixed;
      return '<li data-kid="' + esc(c.id) + '"><a class="id" href="/p/?id=' + encodeURIComponent(c.id) + '">' + esc(c.id) + '</a><span class="tier ' + esc(c.tier) + '">' + esc(t[0]) + '</span>' +
        '<small>' + esc((c.area ? c.area + ', ' : '') + c.market + ', ' + c.country) + '</small>' +
        '<small>' + esc(STAGE[c.stage] || STAGE['']) + ' · ' + esc(c.band) + ' · ' + c.score + ' of ' + c.max + ' checks published</small>' +
        '<span class="lk"><a href="/p/?id=' + encodeURIComponent(c.id) + '">Project file</a><a href="/timeline/?id=' + encodeURIComponent(c.id) + '">Timeline</a><a href="/compare/?ids=' + encodeURIComponent(c.id) + '">Compare</a></span></li>';
    }).join('') + (L0.length > LIM ? '<li class="more"><button type="button" class="dc-btn" id="mp-more">Show more (' + (L0.length - LIM) + ' left)</button></li>' : '') : '<li>No project matches these filters. <button type="button" class="dc-btn" id="mp-clear">Clear filters</button></li>';
    if ($('mp-more')) $('mp-more').onclick = function () { LIM += 120; list(); };
    if ($('mp-clear')) $('mp-clear').onclick = function () { $('f-reset').click(); };
    $('mp-n').textContent = L0.length + ' of ' + R.length + ' projects shown';
  }
  function render(fit) {
    writeUrl(); list(); draw();
    if (fit && MAP) { var G = groups(); if (G.length) MAP.fitBounds(L.latLngBounds(G.map(function (m) { return [m.ll.lat, m.ll.lng]; })).pad(0.15), { maxZoom: 6 }); }
  }
  function method(pt) {
    var c = pt.counts || {}, M = pt.markets || {}, by = c.by_how || {};
    var anchors = Object.keys(M).filter(function (k) { return M[k].how === 'anchor'; }).sort();
    $('mp-method').innerHTML = '<p class="dc-note">' + (c.placed || 0) + ' of ' + (c.markets || 0) + ' markets have a public point (' + (by.place || 0) + ' cities, ' + (by.country || 0) + ' whole countries, ' + (by.anchor || 0) + ' regions placed at an anchor town), covering ' + (c.projects_placed || 0) + ' of ' + (c.projects || 0) + ' projects. Points built on ' + esc(pt.generated || '') + ' by a nightly job from the public dataset only.</p>' +
      '<ul class="dc-note">' + (pt.method || []).map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>' +
      '<p class="dc-note"><b>Sources:</b> ' + (pt.sources || []).map(function (s) { return '<a href="' + esc(s.url) + '" rel="noopener">' + esc(s.name) + '</a> (' + esc(s.licence) + ', file: <code>' + esc(s.query) + '</code>)'; }).join('; ') + '. Map tiles: Esri World Light Gray Canvas.</p>' +
      (anchors.length ? '<details class="dc-note"><summary>Regions placed at an anchor town (' + anchors.length + ')</summary><p>' + anchors.map(function (k) { return esc(k) + ': ' + esc(M[k].place); }).join(' · ') + '</p></details>' : '') +
      ((pt.unplaced || []).length ? '<p class="dc-note"><b>Not on the map yet:</b> ' + pt.unplaced.map(function (u) { return esc(u.market) + ' (' + u.projects + ')'; }).join(', ') + '. They are still in the list.</p>' : '');
  }
  function initMap() {
    if (!window.L) { $('mp-map').innerHTML = '<p style="padding:16px">The map library did not load. The list on the right still works.</p>'; return; }
    MAP = L.map('mp-map', { worldCopyJump: true, scrollWheelZoom: true, minZoom: 1, maxZoom: 10, zoomSnap: 0.5 }).setView([18, 30], 2);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri. Points: Natural Earth, GeoNames', maxZoom: 10 }).addTo(MAP);
    LAYER = L.layerGroup().addTo(MAP);
    MAP.on('zoomend', draw);
  }
  readUrl();
  fetch('/api/x/disc/points').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
    R = (j.rows || []).map(row);
    var pt = j.points || {};
    if (pt.status === 'ready') { P = pt.markets || {}; method(pt); }
    else $('mp-method').innerHTML = '<p class="dc-note">The market points are being built by the nightly job and are not published yet. The list works; the map fills in once /data/market-points.json is live.</p>';
    $('mp-upd').textContent = j.updated || '';
    filters(); initMap(); render(!S.market);
    if (S.market && MAP && P[S.market]) MAP.setView([P[S.market].lat, P[S.market].lng], 6);
  }).catch(function () {
    $('mp-list').innerHTML = '<li>The project list could not load. Try again in a moment, or open the <a href="/data/bali-cases.json">raw dataset</a>.</li>';
  });
})();
