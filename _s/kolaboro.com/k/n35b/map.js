/* kolaboro.com /map/ client v3 (n35b, batch 35, 22 Nov 2026). Static file (was served from the worker as /k/n30c-map.js).
   v2 (n30c): clusters, delay heat layer, filters in the URL. v3 adds: draw an area (drag a rectangle, or use the current view with the
   keyboard) to list the projects inside it, the area in the URL (?a=south,west,north,east), counts on every cluster for screen readers,
   keyboard focus on clusters and an Escape key to stop drawing. Leaflet still loads only after the first interaction. */
(function () {
  var MP = document.querySelector('[data-u27x]'); if (!MP) return;
  var M = JSON.parse(MP.getAttribute('data-u27x')), S = M.s, LG = (document.documentElement.lang || 'en').slice(0, 2), PRE = LG === 'en' ? '' : '/' + LG;
  var f = function (k, v) { var s = S[k] || k; return v ? s.replace(/\{(\w+)\}/g, function (m, x) { return v[x] != null ? v[x] : m; }) : s; };
  var nf = function (n) { try { return Number(n).toLocaleString(LG === 'zh' ? 'zh-CN' : LG, { numberingSystem: 'latn' }); } catch (e) { return String(n); } };
  var el = function (t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  var esc2 = function (s) { var x = document.createElement('i'); x.textContent = s; return x.innerHTML; };
  var mapEl = MP.querySelector('.kmp-m'), listEl = MP.querySelector('.kmp-l'), cnt = MP.querySelector('.kmp-n'), fm = MP.querySelector('form'), leg = MP.querySelector('.kmp-leg'), data = null, map = null, layer = null, heat = null, lim = 60, Lf = null, fit = true;
  var KEYS = ['co', 'yr', 'pm', 'sc', 'dl', 'rg', 'hm'];   // r10u (batch 37): rg = at least N key facts read in an official register
  var A3 = { en: ['Draw an area', 'Stop drawing', 'Use this view as the area', 'Clear the area', 'Drag on the map to draw a rectangle. Press Escape to stop.', '{k} projects inside the area', '{k} projects in this group'],
    es: ['Dibujar una zona', 'Dejar de dibujar', 'Usar esta vista como zona', 'Borrar la zona', 'Arrastre sobre el mapa para dibujar un rectángulo. Pulse Escape para parar.', '{k} proyectos dentro de la zona', '{k} proyectos en este grupo'],
    fr: ['Dessiner une zone', 'Arrêter de dessiner', 'Utiliser cette vue comme zone', 'Effacer la zone', 'Faites glisser sur la carte pour dessiner un rectangle. Échap pour arrêter.', '{k} projets dans la zone', '{k} projets dans ce groupe'],
    de: ['Gebiet zeichnen', 'Zeichnen beenden', 'Diese Ansicht als Gebiet nehmen', 'Gebiet löschen', 'Auf der Karte ziehen, um ein Rechteck zu zeichnen. Escape beendet.', '{k} Projekte im Gebiet', '{k} Projekte in dieser Gruppe'],
    nl: ['Gebied tekenen', 'Stoppen met tekenen', 'Deze weergave als gebied gebruiken', 'Gebied wissen', 'Sleep over de kaart om een rechthoek te tekenen. Escape stopt.', '{k} projecten in het gebied', '{k} projecten in deze groep'],
    ru: ['Выделить область', 'Закончить выделение', 'Взять этот вид как область', 'Сбросить область', 'Проведите по карте, чтобы нарисовать прямоугольник. Escape: отмена.', 'Проектов в области: {k}', 'Проектов в этой группе: {k}'],
    zh: ['框选区域', '停止框选', '以当前视图为区域', '清除区域', '在地图上拖动以画出矩形。按 Esc 停止。', '区域内 {k} 个项目', '此组 {k} 个项目'],
    ar: ['ارسم منطقة', 'أوقف الرسم', 'استخدم هذا العرض كمنطقة', 'امسح المنطقة', 'اسحب على الخريطة لرسم مستطيل. اضغط Escape للإيقاف.', 'عدد المشاريع داخل المنطقة: {k}', 'عدد المشاريع في هذه المجموعة: {k}'] };
  var T3 = A3[LG] || A3.en, f3 = function (i, v) { return T3[i].replace('{k}', v); };
  var area = null, rect = null, drawing = false;   // area = [south, west, north, east]
  (function () { var a = (new URLSearchParams(location.search).get('a') || '').split(',').map(Number); if (a.length === 4 && a.every(isFinite) && a[0] < a[2] && a[1] < a[3]) area = a; })();
  var inA = function (la, ln) { return !area || (la >= area[0] && la <= area[2] && ln >= area[1] && ln <= area[3]); };
  var q = function (n) { var e = fm.elements[n]; return !e ? '' : e.type === 'checkbox' ? (e.checked ? '1' : '') : e.value; };
  var params = new URLSearchParams(location.search); KEYS.forEach(function (k) { var e = fm.elements[k], v = params.get(k); if (!e || !v) return; if (e.type === 'checkbox') e.checked = v === '1'; else e.value = v; });
  var col = function (m) { return m >= 12 ? '#C2341B' : m >= 6 ? '#E8772E' : '#F2B544'; };
  var pass = function (p) { var co = q('co'), yr = q('yr'), pm = q('pm'), sc = q('sc'), dl = q('dl'), rg = q('rg');
    return (!co || p[3] === co) && (!yr || (yr === '0' ? !p[6] : String(p[6]) === yr)) && (!pm || String(p[7]) === pm) && (!sc || (p[8] != null && p[8] >= +sc)) && (!dl || (p[9] != null && p[9] >= +dl)) && (!rg || (p[10] || 0) >= +rg); };
  var R = [], pins = [], byMk = {};
  var cluster = function () {   // grid clustering in screen space: pins closer than about 48 px share one marker
    if (!map || !Lf) return; if (layer) layer.remove(); layer = Lf.layerGroup().addTo(map);
    var z = map.getZoom(), cells = {}, G = 48;
    pins.forEach(function (p) { var pt = map.project([p[4], p[5]], z), k = Math.floor(pt.x / G) + ':' + Math.floor(pt.y / G); (cells[k] = cells[k] || []).push(p); });
    // v3: groups whose markers would overlap on screen are merged, so every cluster keeps a clear 24 px target (WCAG 2.2 target size)
    var grp = Object.keys(cells).map(function (k) { var L = cells[k], x = 0, y = 0; L.forEach(function (p) { var pt = map.project([p[4], p[5]], z); x += pt.x; y += pt.y; }); return { L: L, x: x / L.length, y: y / L.length }; });
    var szOf = function (n) { return n === 1 && z < 15 ? 12 : n === 1 ? 12 : Math.min(54, 26 + Math.sqrt(n) * 4); };
    for (var pass = 0, moved = true; moved && pass < 6 && z < 15; pass++) { moved = false;
      for (var i = 0; i < grp.length; i++) for (var j = i + 1; j < grp.length; j++) { var A = grp[i], B = grp[j]; if (!A || !B || (A.L.length === 1 && B.L.length === 1)) continue;
        if (Math.hypot(A.x - B.x, A.y - B.y) < (szOf(A.L.length) + szOf(B.L.length)) / 2 + 6) { var n = A.L.length + B.L.length; A.x = (A.x * A.L.length + B.x * B.L.length) / n; A.y = (A.y * A.L.length + B.y * B.L.length) / n; A.L = A.L.concat(B.L); grp[j] = null; moved = true; } }
      grp = grp.filter(Boolean); }
    cells = {}; grp.forEach(function (g, i) { cells[i] = g.L; });
    Object.keys(cells).forEach(function (k) { var L = cells[k];
      if (L.length === 1 || z >= 15) { L.forEach(function (p) { var m = Lf.circleMarker([p[4], p[5]], { radius: 6, weight: 1.5, color: '#fff', fillColor: p[9] > 0 ? col(p[9]) : '#155C75', fillOpacity: .92 });
        m.bindPopup('<b>' + esc2(p[1]) + '</b><br>' + esc2(p[2]) + (p[6] ? ' · ' + p[6] : '') + (p[9] > 0 ? '<br>' + esc2(f('mh_late', { m: p[9] })) : '') + '<br><a href="' + PRE + '/projects/' + p[0] + '/">' + esc2(f('mpo')) + '</a>'); m.addTo(layer); }); return; }
      var la = 0, ln = 0, lt = L.filter(function (p) { return p[9] > 0; }).length; L.forEach(function (p) { la += p[4]; ln += p[5]; }); la /= L.length; ln /= L.length;
      var sz = Math.min(54, 26 + Math.sqrt(L.length) * 4), ic = Lf.divIcon({ className: 'kmp-cl', html: '<span style="width:' + sz + 'px;height:' + sz + 'px;line-height:' + sz + 'px' + (lt ? ';box-shadow:0 0 0 4px ' + col(12) + '55' : '') + '">' + nf(L.length) + '</span>', iconSize: [sz, sz] });
      var m = Lf.marker([la, ln], { icon: ic, keyboard: true, title: f('mh_cl', { k: L.length }), alt: f3(6, nf(L.length)) });
      m.on('add', function () { var e = m.getElement && m.getElement(); if (e) { e.setAttribute('role', 'button'); e.setAttribute('aria-label', f3(6, nf(L.length)) + '. ' + f('mh_cl', { k: L.length })); } });
      m.on('keypress', function (ev) { var k = ev.originalEvent && ev.originalEvent.key; if (k === 'Enter' || k === ' ') m.fire('click'); });
      m.on('click', function () { var B = Lf.latLngBounds(L.map(function (p) { return [p[4], p[5]]; })); map.fitBounds(B, { padding: [40, 40], maxZoom: Math.min(18, z + 4) }); }); m.addTo(layer); });
    Object.keys(byMk).forEach(function (k) { var c = data.mk[k], L2 = byMk[k], m = Lf.circleMarker([c[0], c[1]], { radius: Math.min(26, 7 + Math.sqrt(L2.length) * 2.4), weight: 1, color: '#B26A00', fillColor: '#F2B544', fillOpacity: .4, dashArray: '3' });
      m.bindPopup('<b>' + esc2(f('mpa', { k: L2.length, m: k })) + '</b><br>' + L2.slice(0, 12).map(function (p) { return '<a href="' + PRE + '/projects/' + p[0] + '/">' + esc2(p[1]) + '</a>' + (p[9] > 0 ? ' (' + p[9] + ')' : ''); }).join('<br>') + (L2.length > 12 ? '<br>…' : '')); m.addTo(layer); });
  };
  var drawHeat = function () {   // delay heat: one soft disc per project past its first handover date on record, colour by months past
    if (!map || !Lf) return; if (heat) { heat.remove(); heat = null; } if (leg) leg.hidden = q('hm') !== '1'; if (q('hm') !== '1') return;
    heat = Lf.layerGroup(); var rd = Lf.canvas ? Lf.canvas({ padding: .3 }) : undefined;
    R.forEach(function (p) { if (!(p[9] > 0)) return; var ll = p[4] != null ? [p[4], p[5]] : data.mk[p[2]]; if (!ll) return;
      Lf.circleMarker(ll, { renderer: rd, radius: 18 + Math.min(18, p[9]), stroke: false, fillColor: col(p[9]), fillOpacity: .22, interactive: false }).addTo(heat);
      Lf.circleMarker(ll, { renderer: rd, radius: 7, stroke: false, fillColor: col(p[9]), fillOpacity: .35, interactive: false }).addTo(heat); });
    heat.addTo(map); if (heat.bringToBack) heat.eachLayer(function (l) { l.bringToBack && l.bringToBack(); });
  };
  var draw = function () {
    if (!data) return; R = data.p.filter(pass).filter(function (p) { if (!area) return true; var ll = p[4] != null ? [p[4], p[5]] : data.mk[p[2]]; return !!ll && inA(ll[0], ll[1]); }); if (q('rg')) R = R.map(function (p, i) { return [p[10] || 0, i, p]; }).sort(function (a, b) { return b[0] - a[0] || a[1] - b[1]; }).map(function (x) { return x[2]; }); pins = R.filter(function (p) { return p[4] != null; }); byMk = {};
    R.forEach(function (p) { if (p[4] == null && data.mk[p[2]]) { (byMk[p[2]] = byMk[p[2]] || []).push(p); } });
    cnt.textContent = area ? f3(5, nf(R.length)) : f('mpk', { k: nf(R.length) }); e0.hidden = R.length > 0; rs.hidden = !area && !KEYS.some(function (k) { return q(k); }); if (ab) ab.clr.hidden = !area;
    var h = ''; R.slice(0, lim).forEach(function (p) { h += '<li><a href="' + PRE + '/projects/' + p[0] + '/">' + esc2(p[1]) + '</a> <small>' + esc2([p[2], p[3]].filter(function (v, i, a) { return v && a.indexOf(v) === i; }).join(', ')) + (p[6] ? ' · ' + p[6] : '') + (p[8] != null ? ' · ' + p[8] + '/100' : '') + (p[9] > 0 ? ' · ' + esc2(f('mh_late', { m: p[9] })) : '') + (p[10] > 0 && S.rg_b ? ' · ' + esc2(f('rg_b', { n: nf(p[10]) })) : '') + '</small></li>'; });
    listEl.innerHTML = h; var more = MP.querySelector('.kmp-more'); if (more) more.hidden = R.length <= lim;
    var u = new URL(location.href); KEYS.forEach(function (k) { if (q(k)) u.searchParams.set(k, q(k)); else u.searchParams.delete(k); }); if (area) u.searchParams.set('a', area.map(function (v) { return v.toFixed(4); }).join(',')); else u.searchParams.delete('a'); try { history.replaceState(null, '', u.pathname + u.search); } catch (e) {}
    if (!map || !Lf) return; cluster(); drawHeat(); drawRect();
    if (fit && area && !rect0) { map.fitBounds([[area[0], area[1]], [area[2], area[3]]], { padding: [16, 16] }); fit = false; rect0 = true; }
    if (fit) { var B = pins.map(function (p) { return [p[4], p[5]]; }).concat(Object.keys(byMk).map(function (k) { return data.mk[k]; })); if (B.length) map.fitBounds(B, { padding: [24, 24], maxZoom: 12, animate: !mapEl.classList.contains('kmp-ld') }); fit = false; }
    if (mapEl.classList.contains('kmp-ld')) setTimeout(function () { mapEl.classList.remove('kmp-ld'); }, 60);   // n32s: shown once in place (no layout shift)
  };
  var rs = el('button', 'kmp-r', f('mpr')); rs.type = 'button'; rs.hidden = true; fm.appendChild(rs);
  var rect0 = false, ab = (function () {   // area bar above the map: draw, use the view, clear; a live hint while drawing
    var bar = el('div', 'kmp-ab'), d = el('button', 'kmp-abb', T3[0]), v = el('button', 'kmp-abb', T3[2]), c = el('button', 'kmp-abb kmp-abx', T3[3]), h = el('p', 'kmp-abh', '');
    [d, v, c].forEach(function (b) { b.type = 'button'; bar.appendChild(b); }); d.setAttribute('aria-pressed', 'false'); c.hidden = !area; h.setAttribute('aria-live', 'polite'); bar.appendChild(h);
    mapEl.parentNode.insertBefore(bar, mapEl);
    var st = el('style'); st.textContent = '.kmp-ab{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 10px}.kmp-abb{min-height:44px;padding:0 12px;font-size:.92rem!important;border:1.5px solid var(--k-line-2,#BCC5C5);border-radius:10px;background:var(--k-surface,#fff);color:inherit;font:inherit;font-weight:600;cursor:pointer}.kmp-abb[aria-pressed=true]{border-color:var(--k-sea,#155C75);background:var(--k-sea-soft,#E2EEF2)}.kmp-abb:focus-visible{outline:3px solid var(--k-sea,#155C75);outline-offset:2px}.kmp-abh{flex-basis:100%;margin:0;font-size:.88rem;color:var(--k-muted,#56636F)}.kmp-abh:empty{display:none}.kmp-dr{touch-action:none}.kmp-dr,.kmp-dr .leaflet-interactive{cursor:crosshair!important}.kmp-cl:focus-visible span{outline:3px solid var(--k-sea,#155C75);outline-offset:2px}.kmp .leaflet-control-attribution a{display:inline-block;min-height:24px;line-height:24px}#kmp-hm{width:24px;height:24px}';
    document.head.appendChild(st);
    return { d: d, v: v, clr: c, h: h };
  })();
  var drawRect = function () { if (!map || !Lf) return; if (rect) { rect.remove(); rect = null; } if (area) rect = Lf.rectangle([[area[0], area[1]], [area[2], area[3]]], { color: '#155C75', weight: 2, fillOpacity: .06, dashArray: '6 4', interactive: false }).addTo(map); };
  var setDraw = function (on) { drawing = on; ab.d.setAttribute('aria-pressed', on ? 'true' : 'false'); ab.d.textContent = on ? T3[1] : T3[0]; ab.h.textContent = on ? T3[4] : ''; mapEl.classList.toggle('kmp-dr', on); if (map) { if (on) map.dragging.disable(); else map.dragging.enable(); } };
  var setArea = function (a) { area = a; lim = 60; draw(); };
  ab.d.addEventListener('click', function () { if (!map) { boot(); pendingDraw = true; return; } setDraw(!drawing); });
  ab.v.addEventListener('click', function () { var go = function () { var b = map.getBounds(); setArea([b.getSouth(), Math.max(-180, b.getWest()), b.getNorth(), Math.min(180, b.getEast())]); }; if (!map) { boot(); pendingView = go; } else go(); });
  ab.clr.addEventListener('click', function () { setArea(null); ab.d.focus(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawing) setDraw(false); });
  var pendingDraw = false, pendingView = null, p0 = null, ghost = null;
  var ll = function (e) { var r = mapEl.getBoundingClientRect(); return map.containerPointToLatLng([e.clientX - r.left, e.clientY - r.top]); };
  mapEl.addEventListener('pointerdown', function (e) { if (!drawing || !map) return; e.preventDefault(); e.stopPropagation(); try { mapEl.setPointerCapture(e.pointerId); } catch (x) {} p0 = ll(e); if (ghost) ghost.remove(); ghost = Lf.rectangle([p0, p0], { color: '#155C75', weight: 2, fillOpacity: .08, interactive: false }).addTo(map); }, true);
  mapEl.addEventListener('pointermove', function (e) { if (!drawing || !p0 || !ghost) return; ghost.setBounds([p0, ll(e)]); }, true);
  mapEl.addEventListener('pointerup', function (e) { if (!drawing || !p0) return; var p1 = ll(e), s = Math.min(p0.lat, p1.lat), n = Math.max(p0.lat, p1.lat), w = Math.min(p0.lng, p1.lng), ea = Math.max(p0.lng, p1.lng); p0 = null; if (ghost) { ghost.remove(); ghost = null; }
    if (n - s < 1e-4 || ea - w < 1e-4) return; setDraw(false); setArea([s, Math.max(-180, w), n, Math.min(180, ea)]); cnt.focus && cnt.setAttribute('tabindex', '-1'); }, true);
  var e0 = el('p', 'kmp-0'); e0.hidden = true; e0.setAttribute('role', 'status'); e0.appendChild(document.createTextNode(f('mp0') + ' ')); var e0b = el('button', 'kmp-r', f('mpr')); e0b.type = 'button'; e0.appendChild(e0b); if (S.mps) { var e0a = el('a', '', f('mps')); e0a.href = PRE + '/search/'; e0.appendChild(document.createTextNode(' ')); e0.appendChild(e0a); } listEl.parentNode.insertBefore(e0, listEl);
  var reset = function () { KEYS.forEach(function (k) { var e = fm.elements[k]; if (!e) return; if (e.type === 'checkbox') e.checked = false; else e.value = ''; }); area = null; lim = 60; fit = true; draw(); };
  rs.addEventListener('click', reset); e0b.addEventListener('click', function () { reset(); fm.elements.co && fm.elements.co.focus(); });
  fetch('/api/v1/map?lang=' + LG + '&v=3').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) { data = j; var sc2 = fm.elements.co; if (sc2 && sc2.options.length < 3) { j.co.forEach(function (c) { var o = el('option', null, c[1] + ' (' + c[2] + ')'); o.value = c[0]; sc2.appendChild(o); }); if (params.get('co')) sc2.value = params.get('co'); }
    var yy = fm.elements.yr; if (yy && yy.options.length < 3) { j.yr.forEach(function (y) { var o = el('option', null, y); o.value = y; yy.insertBefore(o, yy.lastElementChild); }); if (params.get('yr')) yy.value = params.get('yr'); }
    if (leg && j.delay) leg.querySelector('.kmp-legt').textContent = f('mh_leg', { n: nf(j.delay.n), d: j.delay.as_of }); draw(); }).catch(function () { cnt.textContent = f('mpe'); if (!map) mapEl.textContent = f('mpe'); });
  fm.addEventListener('change', function () { lim = 60; fit = true; draw(); }); fm.addEventListener('submit', function (e) { e.preventDefault(); });
  var mb = MP.querySelector('.kmp-more'); if (mb) mb.addEventListener('click', function () { lim += 120; draw(); });
  var boot = function () { if (map || booted) return; booted = true; var cs = el('link'); cs.rel = 'stylesheet'; cs.href = M.css; document.head.appendChild(cs); var hs = el('style'); hs.textContent = '.kmp-ld .leaflet-pane,.kmp-ld .leaflet-control-container{visibility:hidden}'; document.head.appendChild(hs); var s = el('script'); s.src = M.js; s.onload = function () { Lf = window.L; mapEl.textContent = ''; mapEl.classList.add('kmp-ld'); setTimeout(function () { mapEl.classList.remove('kmp-ld'); }, 4000); map = Lf.map(mapEl, { scrollWheelZoom: false, worldCopyJump: true, minZoom: innerWidth < 700 ? 1 : 2, preferCanvas: false }).setView([20, 20], 2);
    Lf.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map); map.on('zoomend', function () { cluster(); }); draw(); if (pendingDraw) { pendingDraw = false; setDraw(true); } if (pendingView) { var pv = pendingView; pendingView = null; setTimeout(pv, 50); } }; s.onerror = function () { mapEl.textContent = f('mpe'); }; document.head.appendChild(s); };
  // n32s (item 259): the map library (Leaflet, about 1.2 s of main-thread work on a phone) starts after the reader's first touch, scroll,
  // key or mouse move (window.kbLate, 8 s after load at the latest), or at once on a tap on the map; the list works before that
  var booted = false, late = function () { (window.kbLate || function (f) { f(); })(boot); };
  mapEl.addEventListener('pointerdown', boot, { once: true });
  if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { io.disconnect(); late(); } }, { rootMargin: '300px' }); io.observe(mapEl); } else late();
})();
