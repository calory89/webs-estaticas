/* Kolaboro market comparison (/compare/markets/?m=Bali,Dubai), block U6 batch 6.
   Reads the public data files in the browser and computes every figure here; nothing is precomputed for this page.
   Transparency index: the shared KTI.compute() from /transparency-index/ti-core.js, so the numbers match that page exactly. */
(function () {
  var MAX = 4, $ = function (i) { return document.getElementById(i); };
  var FILES = { cases: '/data/bali-cases.json', delay: '/data/delay-index.json', price: '/data/price-index.json', haz: '/data/hazards.json', prom: '/data/promises.json', reg: '/data/register-checks.json' };
  var D = {}, MK = [], sel = [], TI = {}, TIN = 0;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function norm(s) { return String(s || '').toLowerCase().normalize ? String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') : String(s || '').toLowerCase(); }
  function pct(x, d) { return x == null ? null : (Math.round(x * Math.pow(10, d || 0)) / Math.pow(10, d || 0)) + '%'; }
  function a(href, txt) { return '<a href="' + esc(href) + '">' + txt + '</a>'; }
  function na(t) { return { na: true, h: esc(t) }; }
  function nv(x) { return x == null ? 'n/a ' : x; }
  function med(xs) { xs = xs.filter(function (x) { return typeof x === 'number'; }).sort(function (a, b) { return a - b; }); if (!xs.length) return null; var m = xs.length >> 1; return xs.length % 2 ? xs[m] : (xs[m - 1] + xs[m]) / 2; }
  var CK = [['permit', 'permit number'], ['escrow', 'deposit protection'], ['progress', 'progress'], ['plans', 'plans'], ['record', 'track record'], ['returns_ok', 'no guaranteed returns']];
  function pub(c, k) { var v = (c.checks || {})[k]; if (k === 'permit') return v === 2; if (k === 'escrow') return v === true; if (k === 'progress') return v != null; return !!v; }

  function readSel() { try { var s = new URLSearchParams(location.search).get('m') || ''; return s.split(',').map(function (x) { return x.trim(); }).filter(Boolean); } catch (e) { return []; } }
  function canon(name) { var n = norm(name); for (var i = 0; i < MK.length; i++) if (norm(MK[i]) === n) return MK[i]; return null; }
  function writeSel() {
    var q = sel.length ? '?m=' + sel.map(encodeURIComponent).join(',') : '';
    try { history.replaceState(null, '', location.pathname + q); } catch (e) {}
    $('cm-url').value = location.origin + location.pathname + q;
    document.title = (sel.length ? 'Compare ' + sel.join(', ') : 'Compare off-plan markets side by side') + ' | Kolaboro';
  }
  function chips() {
    $('cm-pick').innerHTML = sel.map(function (m) { return '<span class="cm-chip">' + esc(m) + '<button type="button" data-rm="' + esc(m) + '" aria-label="Remove ' + esc(m) + '">×</button></span>'; }).join('') || '<span class="dc-note">No market picked yet. Try ' + ['Bali', 'Dubai', 'Phuket', 'Costa del Sol'].filter(canon).map(function (m) { return '<button type="button" class="dc-btn" data-add="' + esc(m) + '" style="min-height:34px;margin:2px">' + esc(m) + '</button>'; }).join(' ') + '</span>';
  }

  // ---------- figures per market ----------
  function figures(m) {
    var C = D.cases.cases.filter(function (c) { return c.market === m; });
    var country = C.length ? C[0].country : '';
    var F = {};
    // projects and checks
    var n = C.length, sum = 0, mx = 0, conf = 0, perCk = {};
    C.forEach(function (c) { sum += c.score || 0; mx += c.max || 6; conf += c.vscore || 0; CK.forEach(function (k) { if (pub(c, k[0])) perCk[k[0]] = (perCk[k[0]] || 0) + 1; }); });
    F.projects = { h: '<span class="big">' + n + '</span><small>' + esc(country) + ' · ' + a('/cases?market=' + encodeURIComponent(m), 'see them on Live cases') + '</small>' };
    F.checks = n ? { h: '<span class="big">' + (sum / n).toFixed(1) + '</span> of 6 on average<small>' + sum + ' checks published in total, ' + conf + ' confirmed by a registry or independent source. ' + a('/how-we-score', 'How we score') + '</small>' } : na('No projects');
    F.ckmix = n ? { h: CK.map(function (k) { return esc(k[1]) + ': ' + Math.round(100 * (perCk[k[0]] || 0) / n) + '%'; }).join('<br>') } : na('No projects');
    // transparency index
    var t = TI[m];
    F.ti = t ? { h: '<span class="big">' + t.index.toFixed(1) + '</span> / 100<small>Rank ' + t.rank + ' of ' + TIN + ' markets · disclosure ' + pct(100 * t.disclosure) + ', confirmed ' + pct(100 * t.confirmed) + ' · ' + a('/transparency-index/?m=' + encodeURIComponent(m), 'index page') + '</small>' }
      : na('Not ranked: fewer than ' + window.KTI.MIN + ' projects');
    // delay index
    var dl = (D.delay.markets || []).filter(function (x) { return x.market === m; })[0];
    F.delay = dl ? (dl.share_past_first == null ? { na: true, h: 'Too few dated projects (' + dl.with_date + ', minimum ' + D.delay.rules.min_sample + ')<small>' + a('/index/delays/', 'delay index') + '</small>' }
      : { h: '<span class="big">' + dl.share_past_first + '%</span> past the first handover<small>' + dl.past_first + ' of ' + (dl.with_date - dl.completed) + ' dated projects not completed. Median ' + (dl.median_late == null ? 'n/a' : dl.median_late + ' months') + ' late, 90th percentile ' + (dl.p90_late == null ? 'n/a' : dl.p90_late + ' months') + '. ' + dl.moved + ' moved their date · ' + a('/index/delays/', 'delay index') + '</small>' }) : na('Not in the delay index');
    // price index
    var pi = (D.price.markets || []).filter(function (x) { return x.market === m; })[0], last = pi && pi.index && pi.index[pi.index.length - 1], first = pi && pi.index && pi.index[0];
    F.price = last ? { h: '<span class="big">' + last.index.toFixed(1) + '</span> on ' + esc(last.date) + '<small>Base 100 on ' + esc(first.date) + ', ' + pi.pairs_total + ' price pairs, ' + pi.changes_total + ' changes seen, ' + pi.projects_last + ' projects in the last snapshot. A few days of history only · ' + a('/index/prices/?market=' + encodeURIComponent(m), 'price index') + '</small>' } : na('No price series for this market yet');
    // hazards
    var areas = (D.haz.areas || []).filter(function (x) { var parts = String(x.label).split(',').map(function (t) { return norm(t.trim()); }), tail = parts.slice(1); return tail.indexOf(norm(m)) >= 0 || (country && parts.length > 1 && parts[parts.length - 1] === norm(country)); });
    var hp = Object.keys(D.haz.projects || {}).filter(function (id) { var c = BY[id]; return c && c.market === m; }).map(function (id) { return D.haz.projects[id]; });
    var hh = [];
    areas.forEach(function (x) {
      hh.push('<b>' + esc(x.label) + '</b>: height ' + nv(x.elev_m) + ' m, 100-year flood ' + nv(x.flood_river_m) + ' m river / ' + nv(x.flood_coast_m) + ' m coast, ' + (x.quakes ? x.quakes.m6 + ' quakes M6+ within 100 km since 1900' : 'quakes n/a') + ', ' + (x.tsunami ? x.tsunami.runups + ' tsunami run-ups within 50 km' : 'tsunami n/a') + (x.volcano && x.volcano.name ? ', volcano ' + esc(x.volcano.name) + ' at ' + x.volcano.dist_km + ' km' : ', no Holocene volcano within 100 km') + ' · ' + a('/hazards/?lat=' + x.lat + '&lng=' + x.lng, 'open'));
    });
    if (hp.length) {
      var fl = hp.filter(function (h) { return (h.flood_river_m || 0) > 0 || (h.flood_coast_m || 0) > 0; }).length;
      hh.push(hp.length + ' tracked project' + (hp.length === 1 ? '' : 's') + ' read at the site: median height ' + med(hp.map(function (h) { return h.elev_m; })) + ' m, ' + fl + ' with a 100-year flood depth above 0 m, median ' + med(hp.map(function (h) { return h.quakes && h.quakes.m6; })) + ' quakes M6+ nearby');
    }
    F.haz = hh.length ? { h: hh.join('<br>') + '<small>' + a('/data/hazards.json', 'hazards.json') + ', read ' + esc(D.haz.updated) + '</small>' } : na('No hazard survey area or project reading for this market yet');
    // promises
    var pr = (D.prom.markets || []).filter(function (x) { return x.market === m; })[0];
    F.prom = pr ? { h: '<span class="big">' + pr.kept + '</span> kept, <span class="big">' + pr.broken + '</span> broken<small>' + pr.promises + ' dated promises from ' + pr.projects + ' projects: ' + pr.moved + ' moved, ' + pr.pending + ' pending, ' + pr.unknown + ' unknown' + (pr.months_moved_median != null ? '. Median move ' + pr.months_moved_median + ' months' : '') + ' · ' + a('/promises/', 'promise tracker') + '</small>' } : na('No dated promises read yet');
    // registers
    var rg = (D.reg.registers || []).filter(function (r) { return r.market === m; });
    var how = 'market';
    if (!rg.length) { var rc = { 'USA': 'United States' }[country] || country; rg = (D.reg.registers || []).filter(function (r) { return rc && r.market === rc; }); how = 'country'; }
    var rp = Object.keys(D.reg.projects || {}).filter(function (id) { return D.reg.projects[id].market === m; }).length;
    F.reg = rg.length ? { h: rg.map(function (r) { return '<b>' + esc(r.register) + '</b>: ' + esc(r.result) + ' (' + esc(r.automation) + ', checked ' + esc(String(r.probed_at || '').slice(0, 10)) + ')'; }).join('<br>') + '<small>' + (how === 'country' ? 'Registers for ' + esc(country) + '. ' : '') + rp + ' project' + (rp === 1 ? '' : 's') + ' in this market with a register result · ' + a('/registers/checks/', 'register checks') + '</small>' } : na('No official register listed for this market or country yet');
    return F;
  }
  var BY = {};
  var ROWS = [
    ['g', 'Projects'], ['projects', 'Projects tracked'], ['checks', 'Checks published'], ['ckmix', 'Share publishing each check'],
    ['g', 'Indices'], ['ti', 'Transparency index'], ['delay', 'Delay index'], ['price', 'Price index (asking prices)'],
    ['g', 'Track record and risk'], ['prom', 'Promises kept and broken'], ['haz', 'Natural hazards'], ['reg', 'Official register reachability']
  ];
  function render() {
    chips(); writeSel();
    if (!sel.length) { $('cm-out').innerHTML = '<p class="muted">Pick at least one market above. Two to four make a comparison.</p>'; return; }
    var F = sel.map(figures);
    var h = '<div class="dc-tw"><table class="cm-t"><caption class="sr-only">Markets compared</caption><thead><tr><th scope="col"><span class="sr-only">Figure</span></th>' + sel.map(function (m) { return '<th scope="col">' + esc(m) + '</th>'; }).join('') + '</tr></thead><tbody>';
    ROWS.forEach(function (r) {
      if (r[0] === 'g') { h += '<tr class="g"><th scope="rowgroup" colspan="' + (sel.length + 1) + '">' + esc(r[1]) + '</th></tr>'; return; }
      h += '<tr><th scope="row">' + esc(r[1]) + '</th>' + F.map(function (f) { var c = f[r[0]]; return '<td' + (c.na ? ' class="na"' : '') + '>' + c.h + '</td>'; }).join('') + '</tr>';
    });
    h += '</tbody></table></div><p class="dc-note" style="margin-top:10px">Data as of: dataset ' + esc(D.cases.updated) + ', delay index ' + esc(D.delay.generated) + ', price index ' + esc(D.price.generated) + ', hazards ' + esc(D.haz.updated) + ', promises ' + esc(D.prom.updated) + ', registers ' + esc(D.reg.updated) + '. Tracked projects are the ones being marketed now, not every project in a market.</p>';
    $('cm-out').innerHTML = h;
  }
  function add(name) {
    var m = canon(name);
    if (!m) { $('cm-msg').textContent = name ? 'No tracked market called "' + name + '". Pick one from the list.' : 'Type a market name.'; return false; }
    if (sel.indexOf(m) >= 0) { $('cm-msg').textContent = m + ' is already in the comparison.'; return false; }
    if (sel.length >= MAX) { $('cm-msg').textContent = 'Up to ' + MAX + ' markets. Remove one first.'; return false; }
    sel.push(m); $('cm-msg').textContent = ''; render(); return true;
  }
  function bind() {
    $('cm-form').addEventListener('submit', function (e) { e.preventDefault(); if (add($('cm-q').value.trim())) $('cm-q').value = ''; });
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-rm],[data-add]'); if (!t) return;
      if (t.hasAttribute('data-rm')) { sel = sel.filter(function (m) { return m !== t.getAttribute('data-rm'); }); render(); }
      else add(t.getAttribute('data-add'));
    });
    $('cm-copy').addEventListener('click', function () {
      var i = $('cm-url'), b = this; i.select();
      var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy link'; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(i.value).then(done, function () { try { document.execCommand('copy'); done(); } catch (e) {} });
      else { try { document.execCommand('copy'); done(); } catch (e) {} }
    });
  }
  var keys = Object.keys(FILES);
  Promise.all(keys.map(function (k) { return fetch(FILES[k] + (k === 'cases' ? '?t=' + Math.floor(Date.now() / 6e5) : '')).then(function (r) { if (!r.ok) throw new Error(FILES[k]); return r.json(); }); })).then(function (L) {
    keys.forEach(function (k, i) { D[k] = L[i]; });
    D.cases.cases.forEach(function (c) { BY[c.id] = c; });
    var cnt = {}; D.cases.cases.forEach(function (c) { cnt[c.market] = (cnt[c.market] || 0) + 1; });
    MK = Object.keys(cnt).sort();
    $('cm-dl').innerHTML = MK.map(function (m) { return '<option value="' + esc(m) + '">' + cnt[m] + ' projects</option>'; }).join('');
    var T = window.KTI.compute(D.cases); TIN = T.rows.length; T.rows.forEach(function (r) { TI[r.market] = r; });
    var want = readSel(), bad = [];
    want.forEach(function (w) { var m = canon(w); if (m && sel.indexOf(m) < 0 && sel.length < MAX) sel.push(m); else if (!m) bad.push(w); });
    if (bad.length) $('cm-msg').textContent = 'Not a tracked market: ' + bad.join(', ') + '.';
    bind(); render();
  }).catch(function (e) {
    $('cm-out').innerHTML = '<p>A public data file could not load (' + esc(e && e.message || 'network') + '). Try again in a moment.</p>';
  });
})();
