/* Street Kings — el callejero se baja de OpenStreetMap en vivo y se cachea en el navegador.
   Misma simplificación que usa la versión empaquetada: se conservan los cruces. */
(function(){
'use strict';
var CLASSES = ['motorway','trunk','primary','secondary','tertiary','unclassified','residential','living_street','pedestrian'];
var ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
];
var EP_TIMEOUT = 28000;
var CACHE_V = 'skosm3';

function encodePoly(points){
  var out = [], plat = 0, plon = 0;
  for (var i = 0; i < points.length; i++){
    var ilat = Math.round(points[i][0] * 1e5), ilon = Math.round(points[i][1] * 1e5);
    var d = [ilat - plat, ilon - plon];
    for (var k = 0; k < 2; k++){
      var v = d[k] < 0 ? ~(d[k] << 1) : (d[k] << 1);
      while (v >= 0x20){ out.push(String.fromCharCode((0x20 | (v & 0x1f)) + 63)); v >>= 5; }
      out.push(String.fromCharCode(v + 63));
    }
    plat = ilat; plon = ilon;
  }
  return out.join('');
}
// Douglas-Peucker sobre metros, devuelve índices
function rdp(pts, eps){
  var n = pts.length; if (n < 3) return pts.map(function(_, i){ return i; });
  var keep = [0, n-1], stack = [[0, n-1]];
  while (stack.length){
    var seg = stack.pop(), a = seg[0], b = seg[1];
    if (b - a < 2) continue;
    var x1 = pts[a][0], y1 = pts[a][1], dx = pts[b][0]-x1, dy = pts[b][1]-y1, dd = dx*dx + dy*dy;
    var dmax = -1, idx = -1;
    for (var i = a+1; i < b; i++){
      var x = pts[i][0], y = pts[i][1], d;
      if (dd === 0) d = Math.hypot(x-x1, y-y1);
      else {
        var t = ((x-x1)*dx + (y-y1)*dy)/dd; t = t < 0 ? 0 : t > 1 ? 1 : t;
        d = Math.hypot(x - (x1 + t*dx), y - (y1 + t*dy));
      }
      if (d > dmax){ dmax = d; idx = i; }
    }
    if (dmax > eps){ keep.push(idx); stack.push([a, idx]); stack.push([idx, b]); }
  }
  keep.sort(function(p, q){ return p - q; });
  return keep;
}

function compile(json, city){
  var clat = city.c[0], clon = city.c[1];
  var MLAT = 111320, MLON = 111320 * Math.cos(clat * Math.PI/180);
  var els = json.elements.filter(function(e){
    return e.type === 'way' && e.geometry && e.tags &&
           CLASSES.indexOf(e.tags.highway) >= 0 && e.tags.area !== 'yes';
  });
  var count = Object.create(null);
  function q(p){ return p.lat.toFixed(5) + ',' + p.lon.toFixed(5); }
  els.forEach(function(e){ e.geometry.forEach(function(p){ var k = q(p); count[k] = (count[k]||0)+1; }); });
  var names = [], nameIdx = Object.create(null), ways = [];
  els.forEach(function(e){
    var g = [], last = null;
    e.geometry.forEach(function(p){
      var k = q(p); if (k === last) return; last = k;
      g.push([+p.lat.toFixed(5), +p.lon.toFixed(5), k]);
    });
    if (g.length < 2) return;
    var m = g.map(function(p){ return [(p[1]-clon)*MLON, (p[0]-clat)*MLAT]; });
    var anchors = [0];
    for (var i = 1; i < g.length-1; i++) if (count[g[i][2]] > 1) anchors.push(i);
    anchors.push(g.length-1);
    var keep = [];
    for (var a = 0; a < anchors.length-1; a++){
      var s = anchors[a], t = anchors[a+1];
      rdp(m.slice(s, t+1), 2.0).forEach(function(i2){ keep.push(s + i2); });
    }
    keep = keep.filter(function(v, i, arr){ return arr.indexOf(v) === i; }).sort(function(p, r){ return p - r; });
    if (keep.length < 2) return;
    var nm = e.tags.name || '';
    if (!(nm in nameIdx)){ nameIdx[nm] = names.length; names.push(nm); }
    ways.push([nameIdx[nm], CLASSES.indexOf(e.tags.highway),
               (e.tags.oneway === 'yes' || e.tags.oneway === '1' || e.tags.oneway === 'true') ? 1 : 0,
               encodePoly(keep.map(function(i3){ return [g[i3][0], g[i3][1]]; }))]);
  });
  return { id: city.id, name: city.name, c: city.c, n: names, w: ways, r: city.r };
}

function query(bbox){
  return '[out:json][timeout:90];way["highway"~"^(motorway|trunk|primary|secondary|tertiary|' +
         'residential|living_street|pedestrian|unclassified)$"](' + bbox + ');out geom;';
}

function askOverpass(ep, body, ms){
  // Un servidor de Overpass saturado puede quedarse colgado sin responder nunca.
  // Sin este corte, la partida se queda en "bajando el callejero" para siempre.
  var ctl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
  var timer = setTimeout(function(){ if (ctl) ctl.abort(); }, ms || EP_TIMEOUT);
  var opt = { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body };
  if (ctl) opt.signal = ctl.signal;
  return fetch(ep, opt).then(function(r){
    clearTimeout(timer);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }, function(e){ clearTimeout(timer); throw e; });
}

function staticJSON(url){
  if (!window.fetch) return Promise.resolve(null);
  return fetch(url, { cache: 'force-cache' }).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; });
}
function fetchCity(city, onStatus){
  var body = 'data=' + encodeURIComponent(query(city.bbox));
  var plan = ENDPOINTS.concat(ENDPOINTS);   // dos vueltas: los 504 suelen ser pasajeros
  var i = 0;
  function attempt(){
    if (i >= plan.length) return Promise.reject(new Error('Overpass no responde'));
    var ep = plan[i++];
    onStatus('Bajando el callejero de ' + city.name + '…' + (i > 1 ? ' (intento ' + i + ' de ' + plan.length + ')' : ''));
    return askOverpass(ep, body).catch(function(){
      var wait = (i % ENDPOINTS.length === 0) ? 2500 : 400;
      return new Promise(function(r){ setTimeout(r, wait); }).then(attempt);
    });
  }
  return attempt();
}

// ------------------------------------------------------------------ decorado
// Edificios, agua, zonas verdes, aparcamientos, pistas, árboles, farolas y
// semáforos. Se baja en segundo plano DESPUÉS de que la ciudad ya se juega,
// se compila a poco menos de medio mega y se cachea en el navegador.
var DECOR_V = 'skdec3';

function decorQuery(b){
  var q = function(s){ return s + '(' + b + ');'; };
  return '[out:json][timeout:120];(' +
    q('way["building"]') + q('relation["building"]') +
    q('way["natural"="water"]') + q('relation["natural"="water"]') +
    q('way["waterway"="riverbank"]') + q('relation["waterway"="riverbank"]') +
    q('way["leisure"~"^(park|garden)$"]') + q('relation["leisure"~"^(park|garden)$"]') +
    q('way["landuse"~"^(grass|forest|meadow|village_green|recreation_ground|cemetery)$"]') +
    q('way["natural"="wood"]') +
    q('way["amenity"="parking"]') +
    q('way["leisure"="pitch"]') +
    q('way["highway"="pedestrian"]["area"="yes"]') +
    q('way["place"="square"]') + q('relation["place"="square"]') +
    q('way["area:highway"~"^(pedestrian|footway)$"]') +
    q('node["natural"="tree"]') +
    q('node["highway"~"^(street_lamp|traffic_signals)$"]') +
    ');out geom;';
}

// Fachada: 0 revoco, 1 ladrillo, 2 hormigón, 3 vidrio, 4 piedra, 5 madera. -1 = no se sabe.
function matOf(t){
  var m = (t['building:material'] || '').toLowerCase(), c = (t['building:colour'] || '').toLowerCase();
  if (/^(brick|brick_block)$/.test(m)) return 1;
  if (/^(concrete|cement|reinforced_concrete)$/.test(m)) return 2;
  if (/^(glass|metal|steel)$/.test(m)) return 3;
  if (/^(stone|sandstone|limestone|granite|marble)$/.test(m)) return 4;
  if (/^(wood|timber_framing)$/.test(m)) return 5;
  if (/^(plaster|render|stucco|cement_block)$/.test(m)) return 0;
  if (/^(cathedral|church|chapel|basilica|castle|palace)$/.test(t.building || '')) return 4;
  if (c){
    if (/red|brown|brick/.test(c)) return 1;
    if (/grey|gray|black/.test(c)) return 2;
    if (/white|cream|beige|yellow|ivory/.test(c)) return 0;
  }
  return -1;
}
// Qué fachada domina en cada ciudad cuando OSM no lo dice (repetir un valor le da más peso).
var PALETTE = {
  sevilla: [0, 0, 0, 0, 4, 1],      // revoco blanco y albero, algo de piedra y ladrillo
  madrid:  [0, 0, 1, 1, 4, 2],
  paris:   [4, 4, 4, 0, 0],         // piedra caliza haussmanniana
  london:  [1, 1, 1, 4, 0, 2],
  newyork: [1, 1, 4, 2, 2, 3],
  tokyo:   [2, 2, 2, 0, 3]
};
// Edificios famosos que OSM describe mal para esto: altura del cuerpo real y torres.
var LANDMARK_FIX = {
  sevilla: { 'Plaza de España': { body: 19, mat: 1, tower: 10, towerH: 74, inset: 7 } }
};
var ROOFS = { flat:0, gabled:1, hipped:2, pyramidal:3, gambrel:1, 'half-hipped':2, round:3, dome:3, skillion:1, mansard:2 };
function roofOf(t){ return ROOFS[(t['roof:shape'] || '').toLowerCase()] || 0; }
function num(v){ if (v == null) return NaN; return parseFloat(String(v).split(';')[0].replace(',', '.').replace('m', '')); }
function heightOf(t){
  var h = num(t.height);
  if (h >= 2 && h <= 450) return h;
  var lv = num(t['building:levels']);
  if (lv >= 0.5 && lv <= 130){
    var rl = num(t['roof:levels']);
    return lv * 3.1 + 0.9 + (rl > 0 ? rl * 2.2 : 0);
  }
  return 0;
}

// Une los tramos "outer" de una relación en anillos cerrados.
function outerRings(e){
  if (e.type === 'way') return e.geometry ? [e.geometry] : [];
  var segs = [];
  (e.members || []).forEach(function(m){
    if (m.role === 'outer' && m.geometry && m.geometry.length > 1) segs.push(m.geometry.slice());
  });
  var rings = [], key = function(p){ return p.lat.toFixed(6) + ',' + p.lon.toFixed(6); };
  while (segs.length){
    var ring = segs.shift(), guard = 0;
    while (key(ring[0]) !== key(ring[ring.length-1]) && guard++ < 400){
      var end = key(ring[ring.length-1]), hit = -1, rev = false;
      for (var i = 0; i < segs.length; i++){
        if (key(segs[i][0]) === end){ hit = i; break; }
        if (key(segs[i][segs[i].length-1]) === end){ hit = i; rev = true; break; }
      }
      if (hit < 0) break;
      var s = segs.splice(hit, 1)[0]; if (rev) s.reverse();
      ring = ring.concat(s.slice(1));
    }
    if (ring.length > 3) rings.push(ring);
  }
  return rings;
}

function compileDecor(json, city){
  var clat = city.c[0], clon = city.c[1];
  var MLAT = 111320, MLON = 111320 * Math.cos(clat * Math.PI/180);
  var out = { b: [], w: [], g: [], p: [], s: [], q: [], tr: '', lm: '', sg: '' };
  var builds = [];

  // anillo -> [polilínea codificada, centro x, centro y, área]
  function ring(g, eps, minArea, maxPts){
    if (!g || g.length < 4) return null;
    if (g[0].lat === g[g.length-1].lat && g[0].lon === g[g.length-1].lon) g = g.slice(0, -1);
    if (g.length < 3) return null;
    var m = [], a = 0;
    for (var i = 0; i < g.length; i++) m.push([(g[i].lon - clon) * MLON, (g[i].lat - clat) * MLAT]);
    for (var j = 0; j < m.length; j++){ var k = (j+1) % m.length; a += m[j][0]*m[k][1] - m[k][0]*m[j][1]; }
    a = Math.abs(a) / 2;
    if (a < minArea) return null;
    var keep = rdp(m.concat([m[0]]), eps).filter(function(v){ return v < m.length; });
    if (keep.length > maxPts){
      var st = keep.length / maxPts, k2 = [];
      for (var z = 0; z < maxPts; z++) k2.push(keep[Math.floor(z * st)]);
      keep = k2;
    }
    if (keep.length < 3) return null;
    var cx = 0, cy = 0, pts = [];
    for (var q = 0; q < keep.length; q++){
      cx += m[keep[q]][0]; cy += m[keep[q]][1];
      pts.push([+g[keep[q]].lat.toFixed(5), +g[keep[q]].lon.toFixed(5)]);
    }
    return [encodePoly(pts), cx / keep.length, cy / keep.length, a];
  }

  var tr = [], lm = [], sg = [];
  var els = json.elements;
  for (var n = 0; n < els.length; n++){
    var e = els[n], t = e.tags || {};
    if (e.type === 'node'){
      var pt = [+e.lat.toFixed(5), +e.lon.toFixed(5)];
      if (t.natural === 'tree') tr.push(pt);
      else if (t.highway === 'street_lamp') lm.push(pt);
      else if (t.highway === 'traffic_signals') sg.push(pt);
      continue;
    }
    var rs = outerRings(e);
    for (var r = 0; r < rs.length; r++){
      if (t.building){
        if (/^(roof|no|ruins|construction)$/.test(t.building) || t.location === 'underground' || num(t.layer) < 0) continue;
        var fix = LANDMARK_FIX[city.id] && LANDMARK_FIX[city.id][t.name];
        var rb = ring(rs[r], 1.2, 28, fix ? 180 : 26); if (!rb) continue;
        var h = heightOf(t);
        if (fix){
          // OSM le pone al edificio entero la altura de las torres. El cuerpo es mucho más bajo
          // y las torres están en los extremos del semicírculo: los dos vértices más alejados.
          h = fix.body;
          var g0 = rs[r], far = [0, 0, 0];
          for (var fa = 0; fa < g0.length; fa += 2) for (var fb = fa + 1; fb < g0.length; fb += 2){
            var ddx = (g0[fa].lon - g0[fb].lon) * MLON, ddy = (g0[fa].lat - g0[fb].lat) * MLAT, dd = ddx*ddx + ddy*ddy;
            if (dd > far[0]) far = [dd, fa, fb];
          }
          var mcx = rb[1], mcy = rb[2];
          [far[1], far[2]].forEach(function(ix){
            var tx = (g0[ix].lon - clon) * MLON, ty = (g0[ix].lat - clat) * MLAT;
            var vx = mcx - tx, vy = mcy - ty, vl = Math.hypot(vx, vy) || 1;
            tx += vx / vl * fix.inset; ty += vy / vl * fix.inset;
            var hw = fix.tower / 2, sq = [[tx-hw, ty-hw], [tx+hw, ty-hw], [tx+hw, ty+hw], [tx-hw, ty+hw]].map(function(q){
              return [+(clat + q[1] / MLAT).toFixed(6), +(clon + q[0] / MLON).toFixed(6)];
            });
            builds.push([encodePoly(sq), tx, ty, fix.towerH, 1, fix.mat, 9]);   // 9 = torre de la Plaza de España, modelo propio
          });
        }
        builds.push([rb[0], rb[1], rb[2], h, h ? 1 : 0, fix ? fix.mat : matOf(t), roofOf(t)]);
      } else if (t.natural === 'water' || t.waterway === 'riverbank'){
        var rw = ring(rs[r], 2.5, 120, 400); if (rw) out.w.push([rw[0]]);
      } else if (t.place === 'square' || t.highway === 'pedestrian' || t['area:highway']){
        var rq = ring(rs[r], 1.5, 60, 120); if (rq) out.q.push([rq[0]]);
      } else if (t.amenity === 'parking'){
        var rp = ring(rs[r], 2.0, 80, 60); if (rp) out.p.push([rp[0]]);
      } else if (t.leisure === 'pitch'){
        var rsp = ring(rs[r], 2.0, 80, 60); if (rsp) out.s.push([rsp[0]]);
      } else {
        var rg = ring(rs[r], 2.5, 120, 200); if (rg) out.g.push([rg[0]]);
      }
    }
  }

  // Alturas que OSM no tiene: mediana de los vecinos conocidos, no un número inventado.
  var CELL = 150, grid = {}, known = [];
  builds.forEach(function(b){
    if (!b[3]) return;
    var k = Math.floor(b[1]/CELL) + ',' + Math.floor(b[2]/CELL);
    (grid[k] = grid[k] || []).push(b[3]); known.push(b[3]);
  });
  known.sort(function(a, b){ return a - b; });
  var cityMed = known.length ? known[known.length >> 1] : 9.5;
  builds.forEach(function(b){
    if (b[3]) return;
    var kx = Math.floor(b[1]/CELL), ky = Math.floor(b[2]/CELL), pool = [];
    for (var rr = 1; rr <= 3; rr++){
      pool = [];
      for (var i = kx-rr; i <= kx+rr; i++) for (var j = ky-rr; j <= ky+rr; j++){
        var arr = grid[i + ',' + j]; if (arr) pool = pool.concat(arr);
      }
      if (pool.length >= 4) break;
    }
    pool.sort(function(a, b){ return a - b; });
    b[3] = pool.length ? pool[pool.length >> 1] : cityMed;
  });
  // Material que no se sabe: el dominante de la manzana, para que una calle se lea como una calle.
  var mg = {};
  builds.forEach(function(b){
    if (b[5] < 0) return;
    var k = Math.floor(b[1]/CELL) + ',' + Math.floor(b[2]/CELL);
    (mg[k] = mg[k] || []).push(b[5]);
  });
  builds.forEach(function(b){
    if (b[5] >= 0) return;
    var kx = Math.floor(b[1]/CELL), ky = Math.floor(b[2]/CELL), pool = mg[kx + ',' + ky];
    if (pool && pool.length){
      var cnt = {}, best = -1, bc = 0;
      pool.forEach(function(v){ cnt[v] = (cnt[v] || 0) + 1; if (cnt[v] > bc){ bc = cnt[v]; best = v; } });
      b[5] = best;
    } else {
      // Sin dato en la manzana: paleta propia de cada ciudad. Las torres altas, vidrio u hormigón.
      var h = Math.abs(kx * 73 + ky * 131 + Math.round(b[1] * 0.37 + b[2] * 0.11));
      if (b[3] > 45) b[5] = 3;
      else if (b[3] > 24) b[5] = (h % 3) ? 2 : 3;
      else { var pal = PALETTE[city.id] || [0, 1, 2]; b[5] = pal[h % pal.length]; }
    }
  });

  out.b = builds.map(function(b){ return [b[0], Math.round(b[3] * 10), b[4], b[5], b[6]]; });
  out.tr = encodePoly(tr); out.lm = encodePoly(lm); out.sg = encodePoly(sg);
  return out;
}

function findCity(cityId){
  for (var i = 0; i < window.SK_CITIES.length; i++)
    if (SK_CITIES[i].id === cityId) return SK_CITIES[i];
  return null;
}

window.SK_OSM = {
  _compileDecor: function(j, c){ return compileDecor(j, c); },
  _compile: function(j, c){ return compile(j, c); }, _query: function(b){ return query(b); }, _decorQuery: function(b){ return decorQuery(b); },
  load: function(cityId, onStatus){
    var city = findCity(cityId);
    if (!city) return Promise.reject(new Error('ciudad desconocida'));
    var ck = CACHE_V + ':' + cityId;
    try {
      var hit = localStorage.getItem(ck);
      if (hit){
        var obj = JSON.parse(hit);
        obj.r = city.r;
        onStatus('');
        return Promise.resolve(obj);
      }
    } catch(e){}
    // Las ciudades de serie vienen ya compiladas con el juego (carga en 1 s, sin Overpass).
    onStatus('Cargando ' + city.name + '…');
    return staticJSON('data/' + cityId + '.roads.json').then(function(pre){
      if (pre && pre.w && pre.n){ pre.r = city.r; try { localStorage.setItem(ck, JSON.stringify({ id:pre.id, name:pre.name, c:pre.c, n:pre.n, w:pre.w })); } catch(e){} onStatus(''); return pre; }
      return fetchCity(city, onStatus).then(function(json){
        onStatus('Preparando el trazado…');
        var compiled = compile(json, city);
        try { localStorage.setItem(ck, JSON.stringify({ id:compiled.id, name:compiled.name, c:compiled.c, n:compiled.n, w:compiled.w })); } catch(e){}
        onStatus('');
        return compiled;
      });
    });
  },

  decor: function(cityId){
    var city = findCity(cityId);
    if (!city) return Promise.resolve(null);
    // El decorado son unos 15 MB de OpenStreetMap por ciudad. No se lo metemos
    // a nadie que esté con datos contados o con una conexión lenta: el juego
    // funciona igual sin él.
    try {
      var nc = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (nc && (nc.saveData === true || /(^|-)(2g|slow-2g)$/.test(nc.effectiveType || '')))
        return Promise.resolve(null);
    } catch(e){}
    var ck = DECOR_V + ':' + cityId;
    try {
      var hit = localStorage.getItem(ck);
      if (hit) return Promise.resolve(JSON.parse(hit));
    } catch(e){}
    var body = 'data=' + encodeURIComponent(decorQuery(city.bbox));
    var plan = ENDPOINTS.concat(ENDPOINTS), i = 0, pre = null;
    function attempt(){
      if (pre) return pre;
      if (i >= plan.length) return null;
      return askOverpass(plan[i++], body, 120000).catch(function(){
        return new Promise(function(r){ setTimeout(r, 400); }).then(attempt);
      });
    }
    return staticJSON('data/' + cityId + '.decor.json').then(function(p){ pre = p && p.b ? p : null; return attempt(); }).then(function(json){
      if (!json) return null;
      var raw = json === pre ? pre : compileDecor(json, city);
      var blob = JSON.stringify(raw);
      try { localStorage.setItem(ck, blob); }
      catch(e){
        // Sin sitio: tiramos el decorado de las otras ciudades y probamos una vez.
        try {
          for (var q = localStorage.length - 1; q >= 0; q--){
            var kk = localStorage.key(q);
            if (kk && kk.indexOf(DECOR_V + ':') === 0 && kk !== ck) localStorage.removeItem(kk);
          }
          localStorage.setItem(ck, blob);
        } catch(e2){}
      }
      return raw;
    }).catch(function(){ return null; });
  }
};
})();
