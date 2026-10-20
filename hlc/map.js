/* Happy Low Cost — mapa interactivo de destinos (d3 v7 + topojson) */
(function () {
  'use strict';
  var d = document, w = window;
  var BOX = d.querySelector('[data-hlc-map]');
  if (!BOX) return;
  var ORIG = { 'Madrid': ['MAD', 40.47, -3.56], 'Barcelona': ['BCN', 41.30, 2.08], 'Málaga': ['AGP', 36.67, -4.50], 'Valencia': ['VLC', 39.49, -0.47], 'Sevilla': ['SVQ', 37.42, -5.90], 'Bilbao': ['BIO', 43.30, -2.91], 'Alicante': ['ALC', 38.28, -0.56], 'Canarias': ['LPA', 27.93, -15.39], 'Palma': ['PMI', 39.55, 2.73] };
  var CITY = { LON: 1, PAR: 1, ROM: 1, MIL: 1, NYC: 1, TYO: 1, STO: 1, BUE: 1, RIO: 1, OSA: 1 };
  var REG = { mundo: [[-125, -40], [150, 66]], europa: [[-12, 34], [32, 61]], mediterraneo: [[-10, 33], [36, 46]], america: [[-125, -38], [-35, 47]], asia: [[50, -10], [142, 45]], africa: [[-18, -36], [52, 36]] };
  var ls = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var slug = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); };
  var CJ = function (aid, url) { return 'https://www.kqzyfj.com/click-101900924-' + aid + '?sid=happylowcost-mapa&url=' + encodeURIComponent(url); };
  function iso(dd) { var t = new Date(Date.now() + dd * 864e5); return t.toISOString().slice(0, 10); }
  function flights(o, dst) {
    var a = o + '.AIRPORT', b = dst + (CITY[dst] ? '.CITY' : '.AIRPORT');
    return CJ('17288982', 'https://flights.booking.com/flights/' + a + '-' + b + '/?type=ROUNDTRIP&adults=1&cabinClass=ECONOMY&from=' + a + '&to=' + b + '&depart=' + iso(30) + '&return=' + iso(37) + '&sort=CHEAPEST&locale=es&salesCurrency=EUR');
  }
  function hotels(n) { return CJ('17288959', 'https://www.booking.com/searchresults.es.html?ss=' + encodeURIComponent(n)); }

  var svgEl = BOX.querySelector('svg'), card = BOX.querySelector('.mapx-card'), sel = BOX.querySelector('[data-map-origin]');
  var strip = d.querySelector('[data-map-strip]'), filt = d.querySelector('[data-map-filters]');
  var origin = ls('hlc_origin'); if (!ORIG[origin]) origin = 'Madrid';
  if (sel) { sel.value = origin; }

  function start() {
    if (BOX.dataset.ready) return; BOX.dataset.ready = 1;
    var need = [];
    if (!w.d3) need.push('https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js');
    if (!w.topojson) need.push('https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js');
    var n = need.length, go = function () { Promise.all([fetch('/hlc/world-50m.json').then(function (r) { return r.json(); }), fetch('/hlc/destinos.json').then(function (r) { return r.json(); }), fetch('https://gmdalfsvtfhzepyrdmjj.supabase.co/functions/v1/hlc-deals?action=feed').then(function (r) { return r.json(); }).catch(function () { return []; })]).then(draw).catch(function () { BOX.classList.add('mapx-err'); }); };
    if (!n) return go();
    need.forEach(function (u) { var s = d.createElement('script'); s.src = u; s.onload = function () { if (--n === 0) go(); }; d.head.appendChild(s); });
  }

  function draw(res) {
    var world = res[0], DEST = res[1], feed = res[2] || [];
    var d3 = w.d3;
    var deals = {};
    feed.forEach(function (x) {
      var f = x.facts || {}; var k = slug(f.destino);
      DEST.forEach(function (p) { if (p.s === k || slug(p.n) === k || (p.a || []).indexOf(k) >= 0) { if (!deals[p.s] || x.price < deals[p.s].price) deals[p.s] = { price: x.price, slug: x.slug, o: f.origen }; } });
    });
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
    var k = 1, cur = null;

    function pinSize() { return 1 / k; }
    var pins = pinG.selectAll('g').data(DEST).join('g')
      .attr('class', function (p) { return 'mx-pin' + (deals[p.s] ? ' deal' : ''); })
      .attr('tabindex', 0).attr('role', 'button')
      .attr('aria-label', function (p) { return p.n + (deals[p.s] ? ', chollo desde ' + deals[p.s].price + ' €' : ''); })
      .on('click', function (e, p) { e.stopPropagation(); pick(p, false); })
      .on('keydown', function (e, p) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(p, false); } });
    pins.append('circle').attr('class', 'mx-halo').attr('r', 14);
    pins.append('circle').attr('class', 'mx-dot').attr('r', function (p) { return deals[p.s] ? 7 : 5.5; });
    var lab = pins.append('g').attr('class', 'mx-lab');
    lab.append('rect').attr('rx', 9).attr('ry', 9).attr('height', 19).attr('y', -30);
    lab.append('text').attr('y', -16.5).text(function (p) { return deals[p.s] ? p.n + ' · ' + deals[p.s].price + ' €' : p.n; });
    lab.each(function (p) { var t = this.querySelector('text'), r = this.querySelector('rect'); var bw = t.getComputedTextLength ? t.getComputedTextLength() + 16 : 60; p._bw = bw; r.setAttribute('width', bw); r.setAttribute('x', -bw / 2); t.setAttribute('x', 0); });

    var T = d3.zoomIdentity, TOP = ['londres', 'paris', 'roma', 'lisboa', 'nueva-york', 'amsterdam', 'berlin', 'praga', 'atenas', 'estambul', 'marrakech', 'tokio', 'bangkok', 'cancun', 'dubai', 'bali', 'venecia', 'budapest', 'viena', 'santorini'];
    var rank = function (p) { return (deals[p.s] ? -100 : 0) + (p === cur ? -200 : 0) + (TOP.indexOf(p.s) >= 0 ? TOP.indexOf(p.s) - 50 : 0); };
    function labels() {
      var top = BOX.querySelector('.mapx-o'), rg = BOX.querySelector('.mapx-reg'), zb = BOX.querySelector('.mapx-zoom'), r0 = BOX.getBoundingClientRect(), f = W / r0.width;
      var ex = function (el) { if (!el) return null; var r = el.getBoundingClientRect(); return [(r.left - r0.left) * f, (r.top - r0.top) * f, (r.right - r0.left) * f, (r.bottom - r0.top) * f]; };
      var oo = T.apply(proj([ORIG[origin][2], ORIG[origin][1]]));
      var boxes = [ex(top), ex(rg), ex(zb), [oo[0] - 30, oo[1] - 12, oo[0] + 30, oo[1] + 32]].filter(Boolean), ordered = DEST.slice().sort(function (a, b) { return rank(a) - rank(b); });
      var vis = {};
      ordered.forEach(function (p) {
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
      pins.attr('transform', function (p) { var xy = proj([p.x, p.y]); return 'translate(' + xy[0] + ',' + xy[1] + ') scale(' + pinSize() + ')'; });
      arcG.selectAll('.mx-arc').attr('stroke-width', 2.6 / k);
      drawOrigin();
      clearTimeout(lt); lt = setTimeout(labels, 60);
    }
    function drawOrigin() {
      var o = ORIG[origin]; var xy = proj([o[2], o[1]]);
      oG.selectAll('*').remove();
      var g = oG.append('g').attr('class', 'mx-orig').attr('transform', 'translate(' + xy[0] + ',' + xy[1] + ') scale(' + (1 / k) + ')');
      g.append('circle').attr('r', 16).attr('class', 'mx-orig-halo'); g.append('circle').attr('r', 7);
      g.append('text').attr('y', 26).text(origin);
    }

    var zoom = d3.zoom().scaleExtent([1, 60]).translateExtent([[-200, -100], [W + 200, H + 100]])
      .filter(function (e) { if (e.type === 'wheel') return e.ctrlKey || BOX.classList.contains('live'); return !e.button; })
      .on('zoom', function (e) { T = e.transform; k = T.k; root.attr('transform', T); place(); });
    svg.call(zoom).on('dblclick.zoom', null);
    svg.on('click', function () { BOX.classList.add('live'); closeCard(); });

    function bboxT(b) {
      var p0 = proj([b[0][0], b[1][1]]), p1 = proj([b[1][0], b[0][1]]);
      var bw = p1[0] - p0[0], bh = p1[1] - p0[1], s = Math.min(60, 0.92 / Math.max(bw / W, bh / H));
      return d3.zoomIdentity.translate(W / 2, H / 2).scale(s).translate(-(p0[0] + p1[0]) / 2, -(p0[1] + p1[1]) / 2);
    }
    function region(r, inst) { svg.transition().duration(inst ? 0 : 900).call(zoom.transform, bboxT(REG[r])); BOX.querySelectorAll('[data-region]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-region') === r); }); }
    BOX.querySelectorAll('[data-region]').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); region(b.getAttribute('data-region')); }); });
    BOX.querySelectorAll('[data-zoom]').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); svg.transition().duration(350).call(zoom.scaleBy, +b.getAttribute('data-zoom') > 0 ? 1.8 : 1 / 1.8); }); });

    function arc(p) {
      arcG.selectAll('*').remove();
      var o = ORIG[origin]; var interp = d3.geoInterpolate([o[2], o[1]], [p.x, p.y]);
      var pts = d3.range(0, 1.0001, 1 / 64).map(function (t) { return proj(interp(t)); });
      // eleva el arco para que parezca una ruta de vuelo
      var a = pts[0], b = pts[pts.length - 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx0 = dy / L, ny0 = -dx / L; if (ny0 > 0) { nx0 = -nx0; ny0 = -ny0; }
      pts = pts.map(function (q, i) { var t = i / (pts.length - 1), h = Math.sin(Math.PI * t) * Math.min(120 / k, L * 0.22); return [q[0] + nx0 * h, q[1] + ny0 * h]; });
      var line = d3.line().curve(d3.curveCatmullRom)(pts);
      var pa = arcG.append('path').attr('class', 'mx-arc').attr('d', line).attr('stroke-width', 2.6 / k);
      var len = pa.node().getTotalLength();
      pa.attr('stroke-dasharray', len + ' ' + len).attr('stroke-dashoffset', len).transition().duration(1100).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0);
      var pl = arcG.append('path').attr('class', 'mx-plane').attr('d', 'M-14 0 L14 -1 L18 0 L14 1 Z M2 -1 L-4 -12 L0 -12 L8 -1 Z M2 1 L-4 12 L0 12 L8 1 Z M-14 -1 L-18 -6 L-15 -6 L-10 -1 Z M-14 1 L-18 6 L-15 6 L-10 1 Z');
      var t0 = performance.now(); pl.attr('opacity', 1);
      (function step(now) {
        var t = Math.min(1, (now - t0) / 1100), e = 1 - Math.pow(1 - t, 3), at = pa.node().getPointAtLength(e * len), nx = pa.node().getPointAtLength(Math.min(len, e * len + 1));
        pl.attr('transform', 'translate(' + at.x + ',' + at.y + ') rotate(' + (Math.atan2(nx.y - at.y, nx.x - at.x) * 180 / Math.PI) + ') scale(' + (0.9 / k) + ')');
        if (t < 1 && arcG.node().contains(pl.node())) requestAnimationFrame(step);
      })(t0);
    }

    function closeCard() { if (!card) return; card.hidden = true; pins.classed('on', false); arcG.selectAll('*').remove(); cur = null; }
    function pick(p, fly) {
      cur = p; pins.classed('on', function (q) { return q === p; });
      var dl = deals[p.s], o = ORIG[origin][0];
      card.innerHTML = '<button type="button" class="mx-x" aria-label="Cerrar">×</button>' +
        '<div class="mx-ph" style="background-image:url(/hlc/img/cities/' + esc(p.s) + '-800.jpg)">' + (dl ? '<span class="mx-badge">🔥 Chollo hoy · ' + esc(dl.price) + ' €</span>' : '') + '</div>' +
        '<div class="mx-bd"><div class="mx-n">' + esc(p.n) + '</div><div class="mx-c">' + esc(p.c) + ' · desde ' + esc(origin) + '</div>' +
        '<div class="mx-btns">' + (dl ? '<a class="hlc-btn s" href="/chollos/' + esc(dl.slug) + '/">Ver el chollo de ' + esc(dl.price) + ' €</a>' : '') +
        '<a class="hlc-btn" rel="sponsored nofollow noopener" target="_blank" href="' + flights(o, p.i) + '">✈️ <span class="mx-l">Vuelos ' + esc(o) + ' → ' + esc(p.i) + '</span><span class="mx-s">Vuelos</span></a>' +
        '<a class="hlc-btn t" rel="sponsored nofollow noopener" target="_blank" href="' + hotels(p.n) + '">🏨 <span class="mx-l">Hoteles en ' + esc(p.n) + '</span><span class="mx-s">Hoteles</span></a>' +
        '<a class="hlc-btn o" href="/alertas/?d=' + encodeURIComponent(p.n) + '">🔔 <span class="mx-l">Avísame si baja</span><span class="mx-s">Alerta</span></a></div></div>';
      card.hidden = false;
      card.querySelector('.mx-x').onclick = function (e) { e.stopPropagation(); closeCard(); };
      card.onclick = function (e) { e.stopPropagation(); };
      arc(p);
      if (fly) {
        var o2 = ORIG[origin], pad = 6, b = [[Math.min(o2[2], p.x) - pad, Math.min(o2[1], p.y) - pad], [Math.max(o2[2], p.x) + pad, Math.max(o2[1], p.y) + pad * 1.6]];
        var tt = bboxT(b), bw = BOX.clientWidth, mob = bw < 700;
        var sh = mob ? 0 : (card.offsetWidth + 28) / bw * W / 2, sv = mob ? -(card.offsetHeight / BOX.clientHeight) * H / 2 : 0;
        var sc = tt.k * (mob ? 0.8 : 0.72);
        var cx = (tt.x - W / 2) / tt.k, cy = (tt.y - H / 2) / tt.k;
        tt = d3.zoomIdentity.translate(W / 2 - sh, H / 2 + sv).scale(sc).translate(cx, cy);
        svg.transition().duration(900).call(zoom.transform, tt);
      }
      try { (w.dataLayer = w.dataLayer || []).push({ event: 'hlc_map_pick', destino: p.n }); } catch (e) {}
      if (strip) strip.querySelectorAll('[data-s]').forEach(function (c) { c.classList.toggle('on', c.getAttribute('data-s') === p.s); });
    }

    if (sel) sel.addEventListener('change', function () { origin = sel.value; ls('hlc_origin', origin); place(); if (cur) pick(cur, false); });
    // tira de destinos
    if (strip) {
      var order = DEST.slice().sort(function (a, b) { return (deals[b.s] ? 1 : 0) - (deals[a.s] ? 1 : 0); });
      strip.innerHTML = order.map(function (p) {
        var dl = deals[p.s];
        return '<button type="button" class="mx-cd" data-s="' + p.s + '" data-r="' + p.r + '" data-t="' + p.t + '"' + (dl ? ' data-deal="1"' : '') + '><span class="mx-cd-ph" style="background-image:url(/hlc/img/cities/' + p.s + '-800.jpg)">' + (dl ? '<i>' + dl.price + ' €</i>' : '') + '</span><b>' + esc(p.n) + '</b><small>' + esc(p.c) + '</small></button>';
      }).join('');

    }
    if (filt) filt.addEventListener('click', function (e) {
      var b = e.target.closest('[data-f]'); if (!b) return; var f = b.getAttribute('data-f');
      filt.querySelectorAll('[data-f]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      var ok = function (p) { return f === 'todos' || (f === 'deal' ? !!deals[p.s] : (p.t === f || p.r === f)); };
      pins.classed('dim', function (p) { return !ok(p); });
      if (strip) strip.querySelectorAll('[data-s]').forEach(function (c) { var p = DEST.filter(function (q) { return q.s === c.getAttribute('data-s'); })[0]; c.hidden = !ok(p); });
      if (f === 'europa' || f === 'america' || f === 'asia' || f === 'africa') region(f);
    });
    var nd = Object.keys(deals).length, cnt = d.querySelector('[data-map-count]');
    if (cnt) cnt.textContent = DEST.length + ' destinos' + (nd ? ' · ' + nd + ' con chollo hoy' : '');
    API.pick = function (sl) { var p = DEST.filter(function (q) { return q.s === sl; })[0]; if (p) pick(p, true); };
    region(w.innerWidth < 700 ? 'mediterraneo' : 'europa', true);
    place();
    if (API.pending) { var pp = API.pending; API.pending = null; setTimeout(function () { API.pick(pp); }, 300); }
    BOX.classList.add('ready');
  }

  var API = {};
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
