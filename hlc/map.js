/* Happy Low Cost — mapa interactivo de chollos y destinos (d3 v7 + topojson) */
(function () {
  'use strict';
  var d = document, w = window;
  var BOX = d.querySelector('[data-hlc-map]');
  if (!BOX) return;
  var API_URL = 'https://gmdalfsvtfhzepyrdmjj.supabase.co/functions/v1/hlc-deals?action=feed';
  var ORIG = {
    'Madrid': ['MAD', 40.47, -3.56], 'Barcelona': ['BCN', 41.30, 2.08], 'Málaga': ['AGP', 36.67, -4.50], 'Valencia': ['VLC', 39.49, -0.47], 'Sevilla': ['SVQ', 37.42, -5.90],
    'Bilbao': ['BIO', 43.30, -2.91], 'Alicante': ['ALC', 38.28, -0.56], 'Canarias': ['LPA', 27.93, -15.39], 'Palma': ['PMI', 39.55, 2.73],
    'Lisboa': ['LIS', 38.77, -9.13], 'Oporto': ['OPO', 41.24, -8.68], 'Londres': ['LON', 51.47, -0.45], 'París': ['PAR', 49.01, 2.55], 'Ámsterdam': ['AMS', 52.31, 4.76],
    'Berlín': ['BER', 52.37, 13.50], 'Roma': ['ROM', 41.80, 12.25], 'Milán': ['MIL', 45.63, 8.72], 'Dublín': ['DUB', 53.42, -6.27], 'Copenhague': ['CPH', 55.62, 12.65],
    'Nueva York': ['NYC', 40.64, -73.78], 'Miami': ['MIA', 25.79, -80.29], 'Los Ángeles': ['LAX', 33.94, -118.41], 'Ciudad de México': ['MEX', 19.44, -99.07],
    'Bogotá': ['BOG', 4.70, -74.15], 'Buenos Aires': ['BUE', -34.82, -58.54], 'Sídney': ['SYD', -33.95, 151.18], 'Dubái': ['DXB', 25.25, 55.36], 'Singapur': ['SIN', 1.36, 103.99]
  };
  var OCC = { 'Lisboa': 'PT', 'Oporto': 'PT', 'Londres': 'GB', 'París': 'FR', 'Ámsterdam': 'NL', 'Berlín': 'DE', 'Roma': 'IT', 'Milán': 'IT', 'Dublín': 'IE', 'Copenhague': 'DK', 'Nueva York': 'US', 'Miami': 'US', 'Los Ángeles': 'US', 'Ciudad de México': 'MX', 'Bogotá': 'CO', 'Buenos Aires': 'AR', 'Sídney': 'AU', 'Dubái': 'AE', 'Singapur': 'SG' };
  var occ = function (o) { return OCC[o] || 'ES'; };
  var RSLUG = { 'Canarias': 'gran-canaria' };
  var ROUTES = {};
  fetch('/vuelos/rutas.json').then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) { ROUTES = j || {}; }).catch(function () {});
  var CITY = { LON: 1, PAR: 1, ROM: 1, MIL: 1, NYC: 1, TYO: 1, STO: 1, BUE: 1, RIO: 1, OSA: 1 };
  var REG = { mundo: [[-125, -40], [150, 66]], europa: [[-12, 34], [32, 61]], mediterraneo: [[-10, 33], [36, 46]], america: [[-125, -38], [-35, 47]], asia: [[50, -10], [142, 45]], africa: [[-18, -36], [52, 36]], oceania: [[110, -47], [180, -8]] };
  var CONT = { 'Europa': 'europa', 'Asia': 'asia', 'Oriente Medio': 'asia', 'Norteamérica': 'america', 'Centroamérica y Caribe': 'america', 'Sudamérica': 'america', 'África': 'africa', 'Oceanía': 'oceania' };
  var ls = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var slug = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); };
  var CJ = function (aid, url) { return 'https://www.kqzyfj.com/click-101900924-' + aid + '?sid=happylowcost-mapa&url=' + encodeURIComponent(url); };
  function iso(dd) { return new Date(Date.now() + dd * 864e5).toISOString().slice(0, 10); }
  function flights(o, dst) {
    var a = o + (CITY[o] ? '.CITY' : '.AIRPORT'), b = dst + (CITY[dst] ? '.CITY' : '.AIRPORT');
    return CJ('17288982', 'https://flights.booking.com/flights/' + a + '-' + b + '/?type=ROUNDTRIP&adults=1&cabinClass=ECONOMY&from=' + a + '&to=' + b + '&depart=' + iso(30) + '&return=' + iso(37) + '&sort=CHEAPEST&locale=es&salesCurrency=EUR');
  }
  function hotels(n) { return CJ('17288959', 'https://www.booking.com/searchresults.es.html?ss=' + encodeURIComponent(n)); }
  // foto al azar entre la principal y las extra: el mapa no se ve siempre igual
  function libPh(p) { var n = Math.floor(Math.random() * ((p.k || 0) + 1)); return '/hlc/img/cities/' + p.s + (n ? '-' + (n + 1) : '-800') + '.jpg'; }
  function fdate(s) { try { return new Date(s).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }); } catch (e) { return ''; } }

  var svgEl = BOX.querySelector('svg'), card = BOX.querySelector('.mapx-card'), sel = BOX.querySelector('[data-map-origin]');
  var strip = d.querySelector('[data-map-strip]'), filt = d.querySelector('[data-map-filters]');
  var origin = ls('hlc_origin'); if (!ORIG[origin]) origin = 'Madrid';
  if (sel) sel.value = origin;
  var API = {};

  function setOrigin(o, fromSelect) {
    if (!ORIG[o]) return;
    origin = o; ls('hlc_origin', o);
    if (sel && !fromSelect) sel.value = o;
    if (API.originChanged) API.originChanged();
  }
  if (sel) sel.addEventListener('change', function () { setOrigin(sel.value, true); });
  // hlc.js (que carga después) fija el origen según la región del visitante: lo recogemos aquí
  d.addEventListener('DOMContentLoaded', function () { var o = ls('hlc_origin'); if (ORIG[o] && o !== origin) setOrigin(o); });
  w.addEventListener('hlc:origin', function (e) { if (e.detail && ORIG[e.detail]) setOrigin(e.detail); });

  function start() {
    if (BOX.dataset.ready) return; BOX.dataset.ready = 1;
    var need = [];
    if (!w.d3) need.push('https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js');
    if (!w.topojson) need.push('https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js');
    var j = function (u) { return fetch(u).then(function (r) { return r.json(); }); };
    var n = need.length, go = function () {
      Promise.all([j('/hlc/world-50m.json'), j('/hlc/destinos.json').then(function (l) { return (l || []).filter(function (p) { return !p.auto || p.g; }); }), j(API_URL).catch(function () { return []; }), j('/hlc/airports.json').catch(function () { return {}; })]).then(draw).catch(function () { BOX.classList.add('mapx-err'); });
    };
    if (!n) return go();
    need.forEach(function (u) { var s = d.createElement('script'); s.src = u; s.onload = function () { if (--n === 0) go(); }; d.head.appendChild(s); });
  }

  function draw(res) {
    var world = res[0], LIB = res[1], feed = (res[2] || []).filter(function (x) { return x.slug && x.facts; }), AP = res[3] || {};
    var d3 = w.d3;
    var today = new Date().toISOString().slice(0, 10);
    feed = feed.filter(function (x) { var sv = x.facts.ahorro_pct; return (!x.facts.ida || x.facts.ida >= today) && (!sv || sv >= 25); });
    // puntos: destinos de la biblioteca + destinos de chollos que no están en ella
    var P = LIB.filter(function (p) { return p.x != null && p.y != null; }).map(function (p) { return { s: p.s, n: p.n, c: p.c, i: p.i, x: p.x, y: p.y, r: p.r, t: p.t, a: p.a || [], g: p.g, k: p.k || 0, lib: true, deals: [] }; });
    function find(f) {
      var k = slug(f.destino);
      for (var i = 0; i < P.length; i++) { var p = P[i]; if (p.s === k || slug(p.n) === k || p.a.indexOf(k) >= 0 || (f.destino_iata && p.i === f.destino_iata)) return p; }
      return null;
    }
    feed.forEach(function (x) {
      var f = x.facts, p = find(f);
      if (!p) {
        // sin destino propio en el mapa: lo agrupamos en la ciudad grande más cercana (Burbank -> Los Ángeles); si no hay ninguna a menos de 250 km, no se pinta
        var ap = AP[f.destino_iata];
        if (!ap) return;
        var best = null, bd = 250;
        P.forEach(function (q) { if (!q.lib) return; var r = Math.PI / 180, dl = (q.y - ap[0]) * r, dn = (q.x - ap[1]) * r, h = Math.sin(dl / 2) * Math.sin(dl / 2) + Math.cos(ap[0] * r) * Math.cos(q.y * r) * Math.sin(dn / 2) * Math.sin(dn / 2), km = 12742 * Math.asin(Math.sqrt(h)); if (km < bd) { bd = km; best = q; } });
        if (!best) return;
        p = best;
      }
      p.deals.push(x);
    });
    P.forEach(function (p) { p.deals.sort(function (a, b) { return a.price - b.price; }); });
    function rel(p) {
      var o = ORIG[origin][0], cc = occ(origin);
      var mine = p.deals.filter(function (x) { return x.facts.origen_iata === o || slug(x.facts.origen) === slug(origin); });
      var near = p.deals.filter(function (x) { return mine.indexOf(x) < 0 && (x.facts.origen_cc || '').toUpperCase() === cc; });
      return { mine: mine, near: near, all: mine.concat(near) };
    }
    function setBest() { P.forEach(function (p) { var r = rel(p); p.best = r.all[0] || null; }); }
    setBest();

    var W = Math.max(320, BOX.clientWidth), H = Math.max(400, BOX.clientHeight);
    var svg = d3.select(svgEl).attr('viewBox', '0 0 ' + W + ' ' + H).attr('preserveAspectRatio', 'xMidYMid slice');
    var proj = d3.geoMercator().fitExtent([[0, 0], [W, H]], { type: 'MultiPoint', coordinates: [[-170, -56], [180, 74]] });
    var path = d3.geoPath(proj);
    var root = svg.append('g');
    root.append('rect').attr('x', -5000).attr('y', -5000).attr('width', 10000).attr('height', 10000).attr('class', 'mx-sea');
    var countries = topojson.feature(world, world.objects.countries);
    root.append('g').selectAll('path').data(countries.features).join('path').attr('class', 'mx-land').attr('d', path);
    root.append('path').datum(topojson.mesh(world, world.objects.countries, function (a, b) { return a !== b; })).attr('class', 'mx-border').attr('d', path);
    var arcG = root.append('g'), oG = root.append('g'), pinG = root.append('g');
    var k = 1, cur = null, T = d3.zoomIdentity, filterFn = function () { return true; };

    var pins = pinG.selectAll('g').data(P).join('g')
      .attr('class', function (p) { return 'mx-pin' + (p.best ? ' deal' : '') + (p.lib ? '' : ' xd'); })
      .attr('tabindex', 0).attr('role', 'button')
      .attr('aria-label', function (p) { return p.n + (p.best ? ', chollo desde ' + p.best.price + ' €' : ''); })
      .on('click', function (e, p) { e.stopPropagation(); pick(p, false); })
      .on('keydown', function (e, p) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(p, false); } });
    pins.append('circle').attr('class', 'mx-halo').attr('r', 14);
    pins.append('circle').attr('class', 'mx-dot').attr('r', function (p) { return p.best ? 7 : 5.5; });
    var lab = pins.append('g').attr('class', 'mx-lab');
    lab.append('rect').attr('rx', 9).attr('ry', 9).attr('height', 19).attr('y', -30);
    lab.append('text').attr('y', -16.5).text(function (p) { return p.best ? p.n + ' · ' + p.best.price + ' €' : p.n; });
    lab.each(function (p) { var t = this.querySelector('text'), r = this.querySelector('rect'); var bw = t.getComputedTextLength ? t.getComputedTextLength() + 16 : 60; p._bw = bw; r.setAttribute('width', bw); r.setAttribute('x', -bw / 2); t.setAttribute('x', 0); });

    function repaint() {
      setBest();
      pins.attr('class', function (p) { return 'mx-pin' + (p.best ? ' deal' : '') + (p.lib ? '' : ' xd') + (p === cur ? ' on' : ''); })
        .attr('aria-label', function (p) { return p.n + (p.best ? ', chollo desde ' + p.best.price + ' €' : ''); });
      lab.select('text').text(function (p) { return p.best ? p.n + ' · ' + p.best.price + ' €' : p.n; });
      lab.each(function (p) { var t = this.querySelector('text'), r = this.querySelector('rect'); var bw = t.getComputedTextLength ? t.getComputedTextLength() + 16 : 60; p._bw = bw; r.setAttribute('width', bw); r.setAttribute('x', -bw / 2); });
    }
    var TOP = ['londres', 'paris', 'roma', 'lisboa', 'nueva-york', 'amsterdam', 'berlin', 'praga', 'atenas', 'estambul', 'marrakech', 'tokio', 'bangkok', 'cancun', 'dubai', 'bali', 'venecia', 'budapest', 'viena', 'santorini'];
    var rank = function (p) { return (p.best ? -100 : 0) + (p === cur ? -300 : 0) + (TOP.indexOf(p.s) >= 0 ? TOP.indexOf(p.s) - 50 : 0); };
    function labels() {
      var r0 = BOX.getBoundingClientRect(), f = W / r0.width;
      var ex = function (el) { if (!el || !el.offsetParent) return null; var r = el.getBoundingClientRect(); return [(r.left - r0.left) * f, (r.top - r0.top) * f, (r.right - r0.left) * f, (r.bottom - r0.top) * f]; };
      var oo = T.apply(proj([ORIG[origin][2], ORIG[origin][1]]));
      var boxes = [ex(BOX.querySelector('.mapx-o')), ex(BOX.querySelector('.mapx-reg')), ex(BOX.querySelector('.mapx-zoom')), card && !card.hidden ? ex(card) : null, [oo[0] - 36, oo[1] - 12, oo[0] + 36, oo[1] + 32]].filter(Boolean);
      var vis = {};
      P.filter(filterFn).sort(function (a, b) { return rank(a) - rank(b); }).forEach(function (p) {
        var xy = T.apply(proj([p.x, p.y])), bw = p._bw || 60;
        if (xy[0] < -40 || xy[0] > W + 40 || xy[1] < -40 || xy[1] > H + 40) return;
        var b = [xy[0] - bw / 2 - 2, xy[1] - 32, xy[0] + bw / 2 + 2, xy[1] + 8];
        for (var i = 0; i < boxes.length; i++) { var q = boxes[i]; if (b[0] < q[2] && b[2] > q[0] && b[1] < q[3] && b[3] > q[1]) return; }
        boxes.push(b); vis[p.s] = 1;
      });
      pins.classed('lv', function (p) { return !!vis[p.s]; });
    }
    var lt;
    function place() {
      pins.attr('transform', function (p) { var xy = proj([p.x, p.y]); return 'translate(' + xy[0] + ',' + xy[1] + ') scale(' + (1 / k) + ')'; });
      arcG.selectAll('.mx-arc').attr('stroke-width', 2.6 / k);
      arcG.selectAll('.mx-plane').attr('data-k', k);
      drawOrigin();
      clearTimeout(lt); lt = setTimeout(labels, 60);
    }
    function drawOrigin() {
      var o = ORIG[origin]; var xy = proj([o[2], o[1]]);
      oG.selectAll('*').remove();
      var g = oG.append('g').attr('class', 'mx-orig').attr('transform', 'translate(' + xy[0] + ',' + xy[1] + ') scale(' + (1 / k) + ')');
      g.append('circle').attr('r', 16).attr('class', 'mx-orig-halo'); g.append('circle').attr('r', 7);
      g.append('text').attr('y', 26).text('✈ ' + origin);
    }

    var zoom = d3.zoom().clickDistance(10).tapDistance(14).scaleExtent([1, 60]).translateExtent([[-200, -100], [W + 200, H + 100]])
      .filter(function (e) { if (e.type === 'wheel') return e.ctrlKey || BOX.classList.contains('live'); return !e.button; })
      .on('zoom', function (e) { T = e.transform; k = T.k; root.attr('transform', T); place(); });
    svg.call(zoom).on('dblclick.zoom', null);
    svg.on('click', function () { BOX.classList.add('live'); closeCard(); });

    function bboxT(b) {
      var p0 = proj([b[0][0], b[1][1]]), p1 = proj([b[1][0], b[0][1]]);
      var bw = Math.max(1, p1[0] - p0[0]), bh = Math.max(1, p1[1] - p0[1]), s = Math.min(14, 0.92 / Math.max(bw / W, bh / H));
      return d3.zoomIdentity.translate(W / 2, H / 2).scale(s).translate(-(p0[0] + p1[0]) / 2, -(p0[1] + p1[1]) / 2);
    }
    function region(r, inst) {
      svg.transition().duration(inst ? 0 : 900).call(zoom.transform, bboxT(REG[r]));
      BOX.querySelectorAll('[data-region]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-region') === r); });
    }
    BOX.querySelectorAll('[data-region]').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); region(b.getAttribute('data-region')); }); });
    BOX.querySelectorAll('[data-zoom]').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); svg.transition().duration(350).call(zoom.scaleBy, +b.getAttribute('data-zoom') > 0 ? 1.8 : 1 / 1.8); }); });

    function arcFrom(o, p) {
      arcG.selectAll('*').remove();
      var interp = d3.geoInterpolate([o[2], o[1]], [p.x, p.y]);
      var pts = d3.range(0, 1.0001, 1 / 64).map(function (t) { return proj(interp(t)); });
      var a = pts[0], b = pts[pts.length - 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx0 = dy / L, ny0 = -dx / L; if (ny0 > 0) { nx0 = -nx0; ny0 = -ny0; }
      pts = pts.map(function (q, i) { var t = i / (pts.length - 1), h = Math.sin(Math.PI * t) * Math.min(120 / k, L * 0.22); return [q[0] + nx0 * h, q[1] + ny0 * h]; });
      var pa = arcG.append('path').attr('class', 'mx-arc').attr('d', d3.line().curve(d3.curveCatmullRom)(pts)).attr('stroke-width', 2.6 / k);
      var len = pa.node().getTotalLength();
      pa.attr('stroke-dasharray', len + ' ' + len).attr('stroke-dashoffset', len).transition().duration(1100).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0);
      var pl = arcG.append('path').attr('class', 'mx-plane').attr('d', 'M-14 0 L14 -1 L18 0 L14 1 Z M2 -1 L-4 -12 L0 -12 L8 -1 Z M2 1 L-4 12 L0 12 L8 1 Z M-14 -1 L-18 -6 L-15 -6 L-10 -1 Z M-14 1 L-18 6 L-15 6 L-10 1 Z');
      var t0 = performance.now();
      (function step(now) {
        var t = Math.min(1, (now - t0) / 1100), e = 1 - Math.pow(1 - t, 3), at = pa.node().getPointAtLength(e * len), nx = pa.node().getPointAtLength(Math.min(len, e * len + 1));
        pl.attr('transform', 'translate(' + at.x + ',' + at.y + ') rotate(' + (Math.atan2(nx.y - at.y, nx.x - at.x) * 180 / Math.PI) + ') scale(' + (0.9 / k) + ')');
        if (t < 1 && arcG.node().contains(pl.node())) requestAnimationFrame(step);
      })(t0);
    }

    function closeCard() { if (!card) return; card.hidden = true; pins.classed('on', false); arcG.selectAll('*').remove(); cur = null; clearTimeout(lt); lt = setTimeout(labels, 60); }
    function fly(p) {
      var o2 = ORIG[origin], pad = 6, b = [[Math.min(o2[2], p.x) - pad, Math.min(o2[1], p.y) - pad], [Math.max(o2[2], p.x) + pad, Math.max(o2[1], p.y) + pad * 1.6]];
      var tt = bboxT(b), bw = BOX.clientWidth, mob = bw < 700;
      var sh = mob || card.hidden ? 0 : (card.offsetWidth + 28) / bw * W / 2, sv = mob && !card.hidden ? -(card.offsetHeight / BOX.clientHeight) * H / 2 : 0;
      var sc = tt.k * (mob ? 0.8 : 0.72), cx = (tt.x - W / 2) / tt.k, cy = (tt.y - H / 2) / tt.k;
      svg.transition().duration(900).call(zoom.transform, d3.zoomIdentity.translate(W / 2 - sh, H / 2 + sv).scale(sc).translate(cx, cy));
    }
    function pick(p, doFly) {
      cur = p; pins.classed('on', function (q) { return q === p; });
      var o = ORIG[origin][0], R = rel(p), mine = R.mine;
      var list = R.all.slice(0, 4);
      var rs = (RSLUG[origin] || slug(origin)) + '-' + p.s, rp = ROUTES[rs];
      var top = list[0];
      var main = top ? '<a class="mx-main" href="/chollos/' + esc(top.slug) + '/"><span>Ver el chollo<small>' + esc(top.facts.origen) + ' → ' + esc(top.facts.destino) + (top.facts.ida ? ' · ' + fdate(top.facts.ida) : '') + '</small></span><i>' + esc(top.price) + ' €</i></a>'
        : (rp ? '<a class="mx-main" href="/vuelos/' + esc(rs) + '/"><span>Vuelos ' + esc(origin) + ' → ' + esc(p.n) + '<small>precio real de ida y vuelta, fechas y consejos</small></span><i>desde ' + esc(rp) + ' €</i></a>' : '');
      var mainHref = top ? '/chollos/' + top.slug + '/' : (rp ? '/vuelos/' + rs + '/' : '');
      var ph = p.lib ? libPh(p) : (w.HLC_photo && w.HLC_photo(p.n)) || '';
      var dealsHtml = list.length > 1 ? '<div class="mx-oth">Más chollos</div><div class="mx-deals">' + list.slice(1).map(function (x) {
        var f = x.facts, m = mine.indexOf(x) >= 0;
        return '<a class="mx-dl' + (m ? ' me' : '') + '" href="/chollos/' + esc(x.slug) + '/"><span><b>' + esc(f.origen) + ' → ' + esc(f.destino) + '</b><small>' + esc(f.tipo || '') + (f.ida ? ' · ' + fdate(f.ida) : '') + (f.escalas === 0 ? ' · directo' : '') + '</small></span><i>' + esc(x.price) + ' €</i></a>';
      }).join('') + '</div>' : (top ? '' : '<p class="mx-none">Hoy no hay chollo a ' + esc(p.n) + ' desde ' + esc(origin) + '. ' + (rp ? '' : 'Crea una alerta y te avisamos cuando salga.') + '</p>');
      card.innerHTML = '<button type="button" class="mx-x" aria-label="Cerrar">×</button>' +
        '<div class="mx-ph" style="' + (ph ? 'background-image:url(' + esc(ph) + ')' : 'background:linear-gradient(135deg,#FF5A36,#2E6BF0)') + '">' + (p.best ? '<span class="mx-badge">🔥 ' + R.all.length + ' chollo' + (R.all.length > 1 ? 's' : '') + ' · desde ' + esc(p.best.price) + ' €</span>' : '') + '</div>' +
        '<div class="mx-bd"><div class="mx-n">' + esc(p.n) + '</div><div class="mx-c">' + esc(p.c) + ' · desde ' + esc(origin) + '</div>' + main + dealsHtml +
        '<div class="mx-btns">' +
        '<a class="hlc-btn" rel="sponsored nofollow noopener" target="_blank" href="' + flights(o, p.i) + '">✈️ <span class="mx-l">Vuelos ' + esc(o) + ' → ' + esc(p.i) + '</span><span class="mx-s">Vuelos</span></a>' +
        '<a class="hlc-btn t" rel="sponsored nofollow noopener" target="_blank" href="' + hotels(p.n) + '">🏨 <span class="mx-l">Hoteles en ' + esc(p.n) + '</span><span class="mx-s">Hoteles</span></a>' +
        (p.g ? '<a class="hlc-btn o" href="/destinos/' + esc(p.s) + '/">📖 <span class="mx-l">Guía de ' + esc(p.n) + '</span><span class="mx-s">Guía</span></a>' : '<a class="hlc-btn o" href="/alertas/?d=' + encodeURIComponent(p.n) + '">🔔 <span class="mx-l">Avísame si baja</span><span class="mx-s">Alerta</span></a>') +
        '</div></div>';
      card.hidden = false;
      card.querySelector('.mx-x').onclick = function (e) { e.stopPropagation(); closeCard(); };
      card.onclick = function (e) { e.stopPropagation(); };
      var phEl = card.querySelector('.mx-ph'); if (phEl && mainHref) phEl.onclick = function () { location.href = mainHref; };
      arcFrom(ORIG[origin], p);
      if (doFly) fly(p);
      clearTimeout(lt); lt = setTimeout(labels, 60);
      try { (w.dataLayer = w.dataLayer || []).push({ event: 'hlc_map_pick', destino: p.n }); } catch (e) {}
      if (strip) strip.querySelectorAll('[data-s]').forEach(function (c) { c.classList.toggle('on', c.getAttribute('data-s') === p.s); });
    }

    API.originChanged = function () {
      repaint();
      BOX.querySelectorAll('[data-region]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      place();
      if (cur) { pick(cur, true); }
      else { var o = ORIG[origin]; svg.transition().duration(800).call(zoom.transform, bboxT([[o[2] - 14, o[1] - 9], [o[2] + 14, o[1] + 9]])); }
      var lazyObs = ('IntersectionObserver' in w) ? new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { var el = en.target; el.style.backgroundImage = 'url(' + el.getAttribute('data-bg') + ')'; el.removeAttribute('data-bg'); lazyObs.unobserve(el); } }); }, { root: strip, rootMargin: '0px 400px' }) : null;
    function lazyStrip() { strip.querySelectorAll('[data-bg]').forEach(function (el) { if (lazyObs) lazyObs.observe(el); else { el.style.backgroundImage = 'url(' + el.getAttribute('data-bg') + ')'; el.removeAttribute('data-bg'); } }); }
    var _rs = renderStrip; renderStrip = function () { _rs(); lazyStrip(); };
    if (strip) renderStrip();
    };

    function renderStrip() {
      var o = ORIG[origin][0];
      var order = P.slice().sort(function (a, b) {
        var am = a.deals.some(function (x) { return x.facts.origen_iata === o; }) ? 2 : (a.best ? 1 : 0), bm = b.deals.some(function (x) { return x.facts.origen_iata === o; }) ? 2 : (b.best ? 1 : 0);
        return bm - am || (a.best && b.best ? a.best.price - b.best.price : 0);
      });
      strip.innerHTML = order.map(function (p) {
        var ph = p.lib ? libPh(p) : '';
        return '<button type="button" class="mx-cd" data-s="' + esc(p.s) + '"' + (p.best ? ' data-deal="1"' : '') + (filterFn(p) ? '' : ' hidden') + '><span class="mx-cd-ph" ' + (ph ? 'data-bg="' + ph + '" style="background:#EADCC4"' : 'style="background:linear-gradient(135deg,#FF5A36,#2E6BF0)"') + '>' + (p.best ? '<i>' + p.best.price + ' €</i>' : '') + '</span><b>' + esc(p.n) + '</b><small>' + esc(p.c) + (p.best ? ' · ' + rel(p).all.length + ' chollo' + (rel(p).all.length > 1 ? 's' : '') : '') + '</small></button>';
      }).join('');
    }
    if (strip) renderStrip();
    if (filt) filt.addEventListener('click', function (e) {
      var b = e.target.closest('[data-f]'); if (!b) return; var f = b.getAttribute('data-f');
      filt.querySelectorAll('[data-f]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      var o = ORIG[origin][0];
      filterFn = function (p) { return f === 'todos' || (f === 'deal' ? !!p.best : f === 'mine' ? p.deals.some(function (x) { return x.facts.origen_iata === o; }) : (p.t === f || p.r === f)); };
      pins.classed('dim', function (p) { return !filterFn(p); });
      if (strip) strip.querySelectorAll('[data-s]').forEach(function (c) { var p = P.filter(function (q) { return q.s === c.getAttribute('data-s'); })[0]; c.hidden = !(p && filterFn(p)); });
      if (REG[f]) region(f); else if (f === 'deal') region('mundo');
      clearTimeout(lt); lt = setTimeout(labels, 60);
    });
    var nd = P.filter(function (p) { return p.best; }).length, cnt = d.querySelector('[data-map-count]');
    if (cnt) cnt.textContent = P.length + ' destinos · ' + feed.length + ' chollos activos en ' + nd + ' destinos';
    API.pick = function (sl) { var p = P.filter(function (q) { return q.s === sl; })[0]; if (p) pick(p, true); };
    region(w.innerWidth < 700 ? 'mediterraneo' : 'europa', true);
    place();
    if (API.pending) { var pp = API.pending; API.pending = null; setTimeout(function () { API.pick(pp); }, 300); }
    BOX.classList.add('ready');
  }

  if (strip) strip.addEventListener('click', function (e) {
    var b = e.target.closest('[data-s]'); if (!b) return;
    BOX.scrollIntoView({ behavior: 'smooth', block: w.innerWidth < 700 ? 'start' : 'center' });
    if (API.pick) API.pick(b.getAttribute('data-s')); else { API.pending = b.getAttribute('data-s'); start(); }
  });
  if ('IntersectionObserver' in w) {
    var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); start(); } }, { rootMargin: '600px' });
    io.observe(BOX);
  } else start();
})();
