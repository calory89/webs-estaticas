/* /registers/ map click lookup (batch 10, b10a). Click a point in Spain to get the Catastro parcel nearest to it, or in New York
   City to get the tax lot (PLUTO) and building permits (DOB). Uses the public lookup (/api/kb/lookup?lat=&lng=, registers only,
   ai=0) and shows the sealed result: every official answer hashed, the set sealed into one root hash with a Bitcoin timestamp.
   A result can be reopened at /registers/?seal=<root>#map-lookup. Nothing is invented: a register with no data says so. */
(function () {
  'use strict';
  var box = document.getElementById('mlMap'); if (!box) return;
  var out = document.getElementById('mlOut'), st = document.getElementById('mlStatus'), form = document.getElementById('mlForm');
  var MAP = null, MK = null, busy = false, loading = null;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function inES(a, o) { return (a > 35.9 && a < 43.9 && o > -9.4 && o < 3.4) || (a > 38.6 && a < 40.1 && o > 1.1 && o < 4.4) || (a > 27.5 && a < 29.5 && o > -18.3 && o < -13.3); }
  function inNYC(a, o) { return a > 40.476 && a < 40.918 && o > -74.26 && o < -73.70; }
  var JUMP = { marbella: [36.5097, -4.8853, 17], madrid: [40.4169, -3.7035, 17], manhattan: [40.7484, -73.9857, 17], brooklyn: [40.6928, -73.9903, 17], spain: [40.0, -3.7, 6], nyc: [40.70, -73.95, 11] };

  function loadLeaflet() {
    if (window.L) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise(function (res, rej) {
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/satellite/plot/vendor/leaflet-1.9.4.css?v=b8273795a6'; document.head.appendChild(l);
      var s = document.createElement('script'); s.src = '/satellite/plot/vendor/leaflet-1.9.4.js?v=dc452946ac'; s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
    return loading;
  }
  function init() {
    return loadLeaflet().then(function () {
      if (MAP) return;
      box.textContent = '';
      MAP = L.map(box, { center: [40.0, -3.7], zoom: 6, scrollWheelZoom: false, worldCopyJump: true });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(MAP);
      MAP.on('click', function (e) { look(e.latlng.lat, e.latlng.lng); });
      MAP.on('focus', function () { MAP.scrollWheelZoom.enable(); });
      MAP.on('blur', function () { MAP.scrollWheelZoom.disable(); });
    }).catch(function () { box.innerHTML = '<p class="ml-fail">The map could not load. You can still type coordinates below.</p>'; });
  }
  function pin(a, o) { if (!MAP) return; if (MK) MK.setLatLng([a, o]); else MK = L.circleMarker([a, o], { radius: 9, color: '#0b0b0b', weight: 3, fillColor: '#e4ff3a', fillOpacity: 1 }).addTo(MAP); }

  var LBL = { parcel_reference: 'Parcel reference', reference: 'Cadastral reference', address: 'Address', distance_m: 'Distance from the point (m)', use: 'Use', built_area_m2: 'Built area (m²)', plot_area_m2: 'Plot area (m²)',
    year_built: 'Year built', units_on_parcel: 'Units on the parcel', borough: 'Borough', bbl: 'Tax lot (BBL)', bin: 'Building (BIN)', owner: 'Owner (companies only)', building_class: 'Building class', land_use: 'Land use',
    building_area_sqft: 'Building area (sq ft)', building_area_m2: 'Building area (m²)', lot_area_sqft: 'Lot area (sq ft)', floors: 'Floors', units_total: 'Units', units_residential: 'Residential units', zoning: 'Zoning',
    landmark: 'Landmark', dataset_version: 'Dataset version', permits_returned: 'Permits returned', nearest_address: 'Nearest address', class: 'Class', municipality: 'Municipality', province: 'Province' };
  function label(k) { return LBL[k] || k.replace(/_/g, ' ').replace(/^./, function (c) { return c.toUpperCase(); }); }
  var STAT = { found: ['Found', 'ok'], not_found: ['Not found', 'nf'], not_published: ['Not published', 'nf'], unavailable: ['Unavailable', 'un'], needs_key: ['Needs a key', 'un'] };
  function fieldRows(f) {
    var h = '';
    Object.keys(f || {}).forEach(function (k) {
      var v = f[k];
      if (v == null || v === '' || k === 'latest' || k === 'units' || k === 'status') return;
      if (typeof v === 'object') return;
      h += '<div><dt>' + esc(label(k)) + '</dt><dd>' + esc(v) + '</dd></div>';
    });
    return h ? '<dl class="ml-dl">' + h + '</dl>' : '';
  }
  function permits(list) {
    if (!list || !list.length) return '';
    return '<details class="ml-perm"><summary>Latest permits (' + list.length + ')</summary><ul>' + list.map(function (p) {
      return '<li><b>' + esc(p.job || p.permit || '') + '</b> ' + esc([p.job_type || p.type, p.work_type, p.permit_status].filter(Boolean).join(', ')) + (p.issued ? ', issued ' + esc(p.issued) : '') + (p.filed ? ', filed ' + esc(p.filed) : '') + (p.permittee_business ? '. Permittee: ' + esc(p.permittee_business) : '') + (p.description ? '<br><span>' + esc(p.description) + '</span>' : '') + '</li>';
    }).join('') + '</ul></details>';
  }
  function units(list) {
    if (!list || !list.length) return '';
    return '<details class="ml-perm"><summary>Units on this parcel (' + list.length + ' shown)</summary><ul>' + list.map(function (u) { return '<li><b>' + esc(u.reference) + '</b> ' + esc(u.address || '') + '</li>'; }).join('') + '</ul></details>';
  }
  function render(d, a, o) {
    var checks = (d.checks || []).filter(function (c) { return c.id !== 'es_company'; });
    var h = '<p class="ml-pt">Point ' + esc((+a).toFixed(6)) + ', ' + esc((+o).toFixed(6)) + (d.started_at ? ' · checked ' + esc(d.started_at.replace('T', ' ').slice(0, 16)) + ' UTC' : '') + (d.cached ? ' (recent result, from cache)' : '') + '</p>';
    checks.forEach(function (c) {
      var s = STAT[c.status] || [c.status, 'un'];
      h += '<article class="ml-c"><header><span class="ml-st ' + s[1] + '">' + esc(s[0]) + '</span><h3>' + esc(c.source) + '</h3></header>' + fieldRows(c.fields) + units(c.fields && c.fields.units) + permits(c.fields && c.fields.latest) +
        (c.note ? '<p class="ml-note">' + esc(c.note) + '</p>' : '') + '<p class="ml-src">' +
        (c.official_page ? '<a href="' + esc(c.official_page) + '" rel="noopener" target="_blank">Official page</a> · ' : '') +
        (c.query && c.query.url ? '<a href="' + esc(c.query.url) + '" rel="noopener nofollow" target="_blank">Query sent</a>' : '<a href="' + esc(c.source_url) + '" rel="noopener" target="_blank">Source</a>') +
        (c.snapshot ? ' · <a href="' + esc(c.snapshot.raw_url) + '" rel="nofollow" target="_blank">Exact answer kept</a> <code title="SHA-256 of the exact bytes">' + esc(c.snapshot.sha256.slice(0, 12)) + '…</code>' : '') + '</p></article>';
    });
    if (d.seal) {
      var share = location.origin + '/registers/?seal=' + d.seal.root_sha256 + '#map-lookup';
      h += '<div class="ml-seal"><h3>Sealed result</h3><p>Every answer above is hashed (SHA-256) and the set is sealed into one root hash' + (d.seal.stamp_status === 'submitted' ? ', submitted for a Bitcoin timestamp (OpenTimestamps)' : '') + '. Anyone can check later what the registers said.</p>' +
        '<p><code class="ml-root">' + esc(d.seal.root_sha256) + '</code></p><p class="ml-links"><a class="btn btn-line btn-sm" href="' + esc(share) + '">Link to this result</a> <button type="button" class="btn btn-line btn-sm" id="mlCopy" data-u="' + esc(share) + '">Copy link</button> <a href="' + esc(d.seal.result_url) + '" rel="nofollow" target="_blank">Sealed JSON</a> · <a href="' + esc(d.seal.verify) + '" rel="nofollow" target="_blank">Timestamp status</a></p></div>';
    }
    h += '<p class="ml-disc">' + esc(d.disclaimer || '') + '</p>';
    out.innerHTML = h; out.hidden = false;
    var cp = document.getElementById('mlCopy');
    if (cp) cp.addEventListener('click', function () { var u = cp.getAttribute('data-u'); (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { cp.textContent = 'Copied'; }, function () { prompt('Copy this link', u); }); });
  }
  function look(a, o) {
    if (busy) return;
    a = Math.round(a * 1e6) / 1e6; o = Math.round(o * 1e6) / 1e6;
    var es = inES(a, o), ny = inNYC(a, o);
    pin(a, o);
    if (!es && !ny) { st.textContent = 'This point is outside Spain and New York City. The map lookup covers the Spanish Catastro and New York City tax lots and permits.'; return; }
    busy = true; st.textContent = es ? 'Asking the Catastro for the parcel at this point...' : 'Asking NYC GeoSearch, PLUTO and DOB about this point...';
    out.setAttribute('aria-busy', 'true');
    fetch('/api/kb/lookup?lat=' + a + '&lng=' + o + '&country=' + (es ? 'ES' : 'US') + '&ai=0', { headers: { accept: 'application/json' } })
      .then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); })
      .then(function (x) {
        busy = false; out.removeAttribute('aria-busy');
        if (x.s === 429) { st.textContent = 'Limit reached: ' + (x.j.limit || '20 lookups an hour') + '. Try again later.'; return; }
        if (!x.j || !x.j.checks) { st.textContent = 'The lookup could not run just now. Try again in a minute.'; return; }
        var f = x.j.summary ? x.j.summary.found : 0;
        st.textContent = 'Done: ' + f + ' source' + (f === 1 ? '' : 's') + ' returned data for this point.';
        render(x.j, a, o);
        try { history.replaceState(null, '', '/registers/?seal=' + (x.j.seal ? x.j.seal.root_sha256 : '') + '#map-lookup'); } catch (e) {}
      })
      .catch(function () { busy = false; out.removeAttribute('aria-busy'); st.textContent = 'The lookup could not run just now. Try again in a minute.'; });
  }

  // lazy start: load the map when the section comes near the viewport (or right away for a shared result)
  var seal = null; try { seal = new URLSearchParams(location.search).get('seal'); } catch (e) {}
  if (seal && /^[0-9a-f]{64}$/.test(seal)) {
    init();
    st.textContent = 'Opening the sealed result...';
    fetch('/api/kb/lookup/r/' + seal).then(function (r) { return r.json(); }).then(function (d) {
      if (!d || !d.checks) { st.textContent = 'This sealed result is no longer in the edge cache (results are kept 30 days). The root hash stays verifiable with its timestamp.'; return; }
      var a = d.input && d.input.lat, o = d.input && d.input.lng;
      st.textContent = 'Sealed result ' + seal.slice(0, 12) + '…';
      render(d, a, o);
      if (a != null) init().then(function () { if (MAP) { MAP.setView([a, o], 17); pin(a, o); } });
    }).catch(function () { st.textContent = 'The sealed result could not be loaded.'; });
  } else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); init(); } }, { rootMargin: '400px' });
    io.observe(box);
  } else init();

  [].forEach.call(document.querySelectorAll('[data-ml-jump]'), function (b) {
    b.addEventListener('click', function () { var j = JUMP[b.getAttribute('data-ml-jump')]; init().then(function () { if (MAP && j) MAP.setView([j[0], j[1]], j[2]); }); });
  });
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var m = String(form.elements.ll.value).match(/(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)/);
    if (!m) { st.textContent = 'Type the coordinates as latitude, longitude, for example 36.5097, -4.8853.'; return; }
    var a = +m[1], o = +m[2];
    init().then(function () { if (MAP) MAP.setView([a, o], 17); look(a, o); });
  });
})();
