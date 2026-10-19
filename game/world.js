/* King of Streets v7 — el mundo vivo.
   Sol en su sitio real (azimut calculado para esa ciudad y esa hora) y estrellas de noche · estaciones ·
   placas con el nombre real de cada calle · rótulos de tiendas, bancos y papeleras reales (OpenStreetMap) ·
   autobuses con los colores de cada ciudad · motos y bicis · ambulancias · luces de todo el tráfico de noche ·
   vaho del escape con frío · trozos que saltan al chocar · salpicadero en la vista capó ·
   decoración de Navidad y de Feria · desenfoque de movimiento en repeticiones · sombras de contacto (SSAO). */
(function(){
'use strict';
var A = window.SK && SK.api; if (!A || !window.THREE) return;
var S = A.S, $ = A.$, MOBILE = matchMedia('(pointer:coarse)').matches;
function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch(e){ return null; } }
function wrap(a){ return Math.atan2(Math.sin(a), Math.cos(a)); }
var W = { scene: null, lk: null, stars: null, props: [], movers: [], plates: null, pois: null, poiFor: null, dash: null };

// ============================================================== posición real del sol (NOAA simplificado)
function sunPos(lat, lon, date){
  var rad = Math.PI / 180, d = date / 86400000 - 10957.5;            // días desde J2000
  var g = (357.529 + 0.98560028 * d) * rad, q = 280.459 + 0.98564736 * d;
  var L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * rad, e = (23.439 - 0.00000036 * d) * rad;
  var ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)), dec = Math.asin(Math.sin(e) * Math.sin(L));
  var gmst = (18.697374558 + 24.06570982441908 * d) % 24, lst = (gmst * 15 + lon) * rad, ha = lst - ra;
  var alt = Math.asin(Math.sin(lat * rad) * Math.sin(dec) + Math.cos(lat * rad) * Math.cos(dec) * Math.cos(ha));
  var az = Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(lat * rad) - Math.sin(lat * rad) * Math.cos(ha));   // desde el norte, horario
  return { alt: alt, az: az };
}
function applySun(){
  var c = (A.CITIES[S.cityId] || {}).c; if (!c || !SK.sunDir) return;
  var p = sunPos(c[0], c[1], Date.now()), az = p.alt > -0.1 ? p.az : p.az + Math.PI;   // de noche, la luna al otro lado
  SK.sunDir[0] = Math.sin(az); SK.sunDir[1] = Math.cos(az);
  S.sunAlt = p.alt;
}
setInterval(applySun, 60000); setTimeout(applySun, 500);

// ============================================================== al construir la ciudad
var prevCity = SK.onCity3d;
SK.onCity3d = function(o){
  if (prevCity) try { prevCity(o); } catch(e){}
  W.scene = o.scene; W.lk = o.lk; W.props = []; W.movers.forEach(function(m){ m.grp = null; }); W.plates = null; W.stars = null; W.dash && W.dash.classList.toggle('on', false);
  applySun();
  try { if (o.lk.night) buildStars(o.scene); } catch(e){}
  try { seasons(o.city); } catch(e){}
  try { buildPlates(o.scene, o.lk); } catch(e){}
  try { buildEvents(o.scene, o.lk); } catch(e){}
  try { if (W.pois && W.poiFor === S.routeId) placePois(); else fetchPois(); } catch(e){}
  lights.mesh = null;
};

// ============================================================== estrellas
function buildStars(scene){
  var n = MOBILE ? 700 : 1600, pos = new Float32Array(n * 3);
  for (var i = 0; i < n; i++){
    var u = Math.random() * 2 - 1, t = Math.random() * 6.283, el = Math.abs(u) * 0.95 + 0.05, r = 1450;
    pos[i*3] = Math.cos(t) * Math.sqrt(1 - el * el) * r; pos[i*3+1] = el * r; pos[i*3+2] = Math.sin(t) * Math.sqrt(1 - el * el) * r;
  }
  var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var m = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xFFFFFF, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0.85, fog: false, depthWrite: false }));
  m.renderOrder = -0.5; m.frustumCulled = false; scene.add(m); W.stars = m;
}

// ============================================================== estaciones del año
function seasons(city){
  var c = (A.CITIES[S.cityId] || {}).c; if (!c) return;
  var m = new Date().getMonth(), south = c[0] < 0; if (south) m = (m + 6) % 12;
  var mild = S.cityId === 'sevilla';
  var tint = null;
  if (m === 9 || m === 10) tint = mild ? [1.08, 0.98, 0.8] : [1.35, 0.85, 0.42];            // otoño
  else if (m === 11 || m === 0 || m === 1) tint = mild ? [0.95, 0.97, 0.92] : [0.78, 0.74, 0.66];   // invierno
  else if (m >= 2 && m <= 4) tint = [1.0, 1.08, 0.95];                                      // primavera
  if (!tint) return;
  city.traverse(function(o){
    if (!o.userData || !o.userData.tree || !o.material || o._seasoned) return;
    o._seasoned = true; o.material = o.material.clone(); o.material.color = new THREE.Color(tint[0], tint[1], tint[2]);
  });
}

// ============================================================== placas con el nombre real de la calle
var PLATE = {
  sevilla: { bg: '#FFFFFF', fg: '#1C3F8C', border: '#1C3F8C', tile: true }, madrid: { bg: '#1D3E7A', fg: '#FFFFFF', border: '#FFFFFF' },
  paris: { bg: '#1B3F8F', fg: '#FFFFFF', border: '#E8F0FF' }, london: { bg: '#FFFFFF', fg: '#111111', border: '#111111', red: true },
  newyork: { bg: '#1E6B3A', fg: '#FFFFFF', border: '#FFFFFF' }, tokyo: { bg: '#1E4E8C', fg: '#FFFFFF', border: '#FFFFFF' }
};
function plateTex(name){
  var st = PLATE[S.cityId] || { bg: '#1E4E8C', fg: '#FFFFFF', border: '#FFFFFF' };
  var c = document.createElement('canvas'); c.width = 512; c.height = 128; var g = c.getContext('2d');
  g.fillStyle = st.bg; g.fillRect(0, 0, 512, 128);
  if (st.tile){ g.strokeStyle = 'rgba(28,63,140,.25)'; for (var x = 0; x < 512; x += 64){ g.strokeRect(x + 2, 2, 60, 124); } }
  g.strokeStyle = st.border; g.lineWidth = 8; g.strokeRect(6, 6, 500, 116);
  g.fillStyle = st.fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  var nm = String(name).toUpperCase(), fs = 58; g.font = '700 ' + fs + 'px "Barlow Condensed", Arial Narrow, sans-serif';
  while (g.measureText(nm).width > 470 && fs > 28){ fs -= 4; g.font = '700 ' + fs + 'px "Barlow Condensed", Arial Narrow, sans-serif'; }
  g.fillText(nm, 256, 68, 480);
  if (st.red){ g.fillStyle = '#C8102E'; g.font = '700 24px Arial'; g.fillText('SW1', 460, 30); }
  var t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}
function buildPlates(scene){
  var R = S.circuit; if (!R || !R.sect) return;
  var grp = new THREE.Group(), seen = {}, poleM = new THREE.MeshLambertMaterial({ color: 0x2A2F35 });
  R.sect.slice(0, 16).forEach(function(sc, i){
    if (seen[sc.name]) return; seen[sc.name] = 1;
    var d = Math.min(R.total - 1, sc.d0 + 8), p = A.pointAt(R, d), nx = -Math.sin(p.h), ny = Math.cos(p.h);
    var off = 5.4, x = p.x - nx * off, y = p.y - ny * off;
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.1, 6), poleM); pole.position.set(x, 1.55, -y); grp.add(pole);
    var pl = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.48), new THREE.MeshBasicMaterial({ map: plateTex(sc.name), side: THREE.DoubleSide }));
    pl.position.set(x, 3.0, -y); pl.rotation.y = p.h + Math.PI / 2; grp.add(pl);
  });
  scene.add(grp); W.plates = grp;
}

// ============================================================== tiendas, bancos y papeleras reales (OpenStreetMap)
var EP = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
function fetchPois(){
  var R = S.circuit; if (!R || !S.decor) return;
  var key = S.routeId; W.poiFor = key; W.pois = null;
  var bb = R.bb; if (!bb) return;
  var a = A.toLatLon(bb[0] - 60, bb[1] - 60), b = A.toLatLon(bb[2] + 60, bb[3] + 60);
  var box = a[0].toFixed(5) + ',' + a[1].toFixed(5) + ',' + b[0].toFixed(5) + ',' + b[1].toFixed(5);
  var cacheK = 'skpoi1:' + box; try { var cc = sessionStorage.getItem(cacheK); if (cc){ W.pois = JSON.parse(cc); placePois(); return; } } catch(e){}
  var q = '[out:json][timeout:20];(node["shop"]["name"](' + box + ');node["amenity"~"^(cafe|restaurant|bar|pharmacy|bank|fast_food|ice_cream)$"]["name"](' + box + ');' +
          'node["amenity"="bench"](' + box + ');node["amenity"="waste_basket"](' + box + ');node["amenity"="bicycle_parking"](' + box + '););out 400;';
  var i = 0;
  (function next(){
    var ep = EP[i++]; if (!ep) return;
    fetch(ep, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
      .then(function(r){ if (!r.ok) throw 0; return r.json(); })
      .then(function(j){
        if (W.poiFor !== key) return;
        W.pois = (j.elements || []).map(function(e){ var p = A.proj([e.lat, e.lon]); var t = e.tags || {}; return { x: p[0], y: p[1], n: t.name || '', k: t.shop ? 'shop' : t.amenity }; });
        try { sessionStorage.setItem(cacheK, JSON.stringify(W.pois)); } catch(e){}
        placePois();
      }).catch(next);
  })();
}
var SIGN_COL = { shop: '#2B2F36', cafe: '#6B3E1E', restaurant: '#7A1E22', bar: '#1E3A6B', pharmacy: '#0E8A4A', bank: '#12355C', fast_food: '#C8401E', ice_cream: '#D05C8A' };
function signTex(txt, kind){
  var c = document.createElement('canvas'); c.width = 512; c.height = 96; var g = c.getContext('2d');
  g.fillStyle = SIGN_COL[kind] || '#2B2F36'; g.fillRect(0, 0, 512, 96);
  g.fillStyle = kind === 'pharmacy' ? '#FFFFFF' : '#F4E9D0'; g.textAlign = 'center'; g.textBaseline = 'middle';
  var fs = 54; g.font = '700 ' + fs + 'px "Barlow Condensed", Georgia, serif';
  while (g.measureText(txt).width > 480 && fs > 24){ fs -= 4; g.font = '700 ' + fs + 'px "Barlow Condensed", Georgia, serif'; }
  g.fillText(kind === 'pharmacy' ? '✚ ' + txt : txt, 256, 52, 490);
  return new THREE.CanvasTexture(c);
}
function placePois(){
  if (!W.scene || !W.pois || !S.decor) return;
  if (W.poiGrp && W.poiGrp.parent) W.poiGrp.parent.remove(W.poiGrp);
  var grp = new THREE.Group(), D = S.decor, gen = SK.bgen, nSign = 0, benches = [], bins = [], racks = [];
  W.pois.forEach(function(p){
    if (p.k === 'bench'){ benches.push(p); return; } if (p.k === 'waste_basket'){ bins.push(p); return; } if (p.k === 'bicycle_parking'){ racks.push(p); return; }
    if (!p.n || nSign > (MOBILE ? 30 : 70)) return;
    // la fachada más cercana: el rótulo va pegado a ella, mirando a la calle
    var C = D.CELL, arr = D.grid.get(Math.floor(p.x / C) * 100000 + Math.floor(p.y / C)), best = null, bd = 26;
    if (arr) arr.forEach(function(id){
      var P = D.polys[id]; if (P.k !== 1 || P.r3 !== gen) return;
      var f = P.f, n = f.length / 2;
      for (var i = 0, j = n - 1; i < n; j = i++){
        var ax = f[j*2], ay = f[j*2+1], bx = f[i*2], by = f[i*2+1], dx = bx - ax, dy = by - ay, dd = dx*dx + dy*dy; if (dd < 9) continue;
        var t = Math.max(0.15, Math.min(0.85, ((p.x - ax) * dx + (p.y - ay) * dy) / dd)), qx = ax + dx * t, qy = ay + dy * t, d = Math.hypot(p.x - qx, p.y - qy);
        if (d < bd){ bd = d; best = { x: qx, y: qy, dx: dx, dy: dy, L: Math.sqrt(dd), cx: P.cx, cy: P.cy }; }
      }
    });
    if (!best) return;
    var nx = -best.dy / best.L, ny = best.dx / best.L;
    if ((best.x - best.cx) * nx + (best.y - best.cy) * ny < 0){ nx = -nx; ny = -ny; }
    var w = Math.min(4.2, Math.max(2.2, best.L * 0.6));
    var sg = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.19), new THREE.MeshLambertMaterial({ map: signTex(p.n, p.k), emissive: new THREE.Color(W.lk && W.lk.night ? 0x555555 : 0x000000), emissiveMap: null }));
    if (W.lk && W.lk.night){ sg.material.emissiveMap = sg.material.map; sg.material.emissive = new THREE.Color(0xCCCCCC); }
    sg.position.set(best.x + nx * 0.12, 3.3, -(best.y + ny * 0.12)); sg.rotation.y = Math.atan2(nx, ny);
    grp.add(sg); nSign++;
  });
  var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), ax = new THREE.Vector3(0, 1, 0), p3 = new THREE.Vector3(), s3 = new THREE.Vector3(1, 1, 1);
  function inst(list, geo, mat){
    if (!list.length) return; var im = new THREE.InstancedMesh(geo, mat, Math.min(200, list.length));
    list.slice(0, 200).forEach(function(p, i){ q.setFromAxisAngle(ax, (i * 1.3) % 6.28); m4.compose(p3.set(p.x, 0.15, -p.y), q, s3); im.setMatrixAt(i, m4); });
    im.castShadow = true; grp.add(im);
  }
  var bench = new THREE.BoxGeometry(1.6, 0.08, 0.45); bench.translate(0, 0.45, 0);
  var back = new THREE.BoxGeometry(1.6, 0.4, 0.06); back.translate(0, 0.7, -0.2);
  inst(benches, mergeGeo([bench, back]), new THREE.MeshLambertMaterial({ color: 0x6B4A2E }));
  var bin = new THREE.CylinderGeometry(0.22, 0.2, 0.8, 10); bin.translate(0, 0.4, 0);
  inst(bins, bin, new THREE.MeshLambertMaterial({ color: S.cityId === 'london' ? 0x1E1E1E : 0x2E6B3A }));
  var rack = new THREE.TorusGeometry(0.35, 0.03, 6, 16, Math.PI); rack.translate(0, 0.35, 0);
  inst(racks, rack, new THREE.MeshLambertMaterial({ color: 0x8A9098 }));
  W.scene.add(grp); W.poiGrp = grp;
}
function mergeGeo(list){
  var pos = [], nor = [];
  list.forEach(function(g){ g = g.index ? g.toNonIndexed() : g; pos.push.apply(pos, g.attributes.position.array); nor.push.apply(nor, g.attributes.normal.array); });
  var o = new THREE.BufferGeometry(); o.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); o.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return o;
}

// ============================================================== autobuses, motos, bicis y ambulancias por el callejero
var BUS_COL = { sevilla: [0xC8102E, 0xFFFFFF], madrid: [0x1D4E9E, 0xFFFFFF], paris: [0x2E8B57, 0xFFFFFF], london: [0xD6001C, 0xD6001C], newyork: [0x1D5AA8, 0xFFFFFF], tokyo: [0x2E9E5B, 0xF4F4F4] };
function busMesh(){
  var col = BUS_COL[S.cityId] || [0x1D5AA8, 0xFFFFFF], g = new THREE.Group(), dd = S.cityId === 'london';
  var body = new THREE.Mesh(new THREE.BoxGeometry(11.5, dd ? 4.2 : 2.9, 2.5), new THREE.MeshLambertMaterial({ color: col[0] })); body.position.y = (dd ? 4.2 : 2.9) / 2 + 0.35; g.add(body);
  var win = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.85, 2.54), new THREE.MeshLambertMaterial({ color: 0x1A232C, emissive: 0x000000 })); win.position.y = 2.2; g.add(win);
  if (dd){ var w2 = win.clone(); w2.position.y = 4.0; g.add(w2); }
  var stripe = new THREE.Mesh(new THREE.BoxGeometry(11.52, 0.3, 2.52), new THREE.MeshLambertMaterial({ color: col[1] })); stripe.position.y = 1.2; g.add(stripe);
  var wm = new THREE.MeshLambertMaterial({ color: 0x15181C });
  [[-3.9, 1], [-3.9, -1], [3.6, 1], [3.6, -1]].forEach(function(w){ var wh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12), wm); wh.rotation.x = Math.PI / 2; wh.position.set(w[0], 0.5, w[1] * 1.12); g.add(wh); });
  g.traverse(function(o){ if (o.isMesh) o.castShadow = true; });
  g.userData.len = 11.5; return g;
}
function bikeMesh(moto){
  var g = new THREE.Group(), dark = new THREE.MeshLambertMaterial({ color: 0x15181C });
  var col = new THREE.MeshLambertMaterial({ color: moto ? [0xC8102E, 0x1D4E9E, 0x111111, 0xF2C14E][(Math.random() * 4) | 0] : 0x2E6B3A });
  [-0.55, 0.55].forEach(function(x){ var w = new THREE.Mesh(new THREE.TorusGeometry(moto ? 0.3 : 0.33, moto ? 0.09 : 0.03, 6, 14), dark); w.position.set(x, moto ? 0.38 : 0.36, 0); g.add(w); });
  var fr = new THREE.Mesh(new THREE.BoxGeometry(1.0, moto ? 0.35 : 0.06, moto ? 0.3 : 0.06), col); fr.position.set(0, moto ? 0.7 : 0.62, 0); g.add(fr);
  var rider = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.7, 7), new THREE.MeshLambertMaterial({ color: [0x2F4F7A, 0xB84A3A, 0xE2E2DE, 0x3C6E4E][(Math.random() * 4) | 0] }));
  rider.position.set(-0.05, 1.15, 0); rider.rotation.z = -0.25; g.add(rider);
  var head = new THREE.Mesh(new THREE.SphereGeometry(moto ? 0.17 : 0.13, 10, 8), new THREE.MeshLambertMaterial({ color: moto ? 0x111111 : 0xD9B090 })); head.position.set(0.1, 1.6, 0); g.add(head);
  g.traverse(function(o){ if (o.isMesh) o.castShadow = true; });
  g.userData.len = 1.8; return g;
}
function spawnMover(kind){
  var G = S.G, car = S.car; if (!G || !car) return null;
  for (var tries = 0; tries < 40; tries++){
    var si = (Math.random() * G.segs.length) | 0, g = G.segs[si], cls = g[4];
    if (kind === 'bus' && cls > 4) continue; if (kind === 'bike' && cls < 4) continue; if (cls > 7) continue;
    var mx = (g[0] + g[2]) / 2 - car.x, my = (g[1] + g[3]) / 2 - car.y, d = Math.hypot(mx, my);
    if (d < 60 || d > 280) continue;
    var len = Math.hypot(g[2] - g[0], g[3] - g[1]); if (len < 8) continue;
    return { kind: kind, seg: si, t: Math.random() * len, len: len, dir: Math.random() < 0.5 ? 1 : -1, v: 0,
             max: kind === 'bus' ? 9 : kind === 'moto' ? 14 : kind === 'amb' ? 16 : 5, stopT: 0, grp: null, x: 0, y: 0, h: 0, stun: 0 };
  }
  return null;
}
function nextSeg(o){
  var G = S.G, g = G.segs[o.seg], ex = o.dir > 0 ? g[2] : g[0], ey = o.dir > 0 ? g[3] : g[1], best = null, bs = -1e9;
  var C = G.CELL, arr = G.grid.get(Math.floor(ex / C) * 100000 + Math.floor(ey / C)) || [];
  var ux = (g[2] - g[0]) / o.len * o.dir, uy = (g[3] - g[1]) / o.len * o.dir;
  arr.forEach(function(si){
    if (si === o.seg) return; var h = G.segs[si];
    if (o.kind === 'bus' && h[4] > 4) return; if (h[4] > 7) return;
    var d0 = Math.hypot(h[0] - ex, h[1] - ey), d1 = Math.hypot(h[2] - ex, h[3] - ey); if (Math.min(d0, d1) > 1) return;
    var dir = d0 < d1 ? 1 : -1, L = Math.hypot(h[2] - h[0], h[3] - h[1]) || 1, vx = (h[2] - h[0]) / L * dir, vy = (h[3] - h[1]) / L * dir;
    var sc = ux * vx + uy * vy + Math.random() * 1.2; if (sc > bs){ bs = sc; best = [si, dir, L]; }
  });
  if (!best){ o.dir = -o.dir; o.t = 0; return; }
  o.seg = best[0]; o.dir = best[1]; o.len = best[2]; o.t = 0;
}
var MIX = MOBILE ? { bus: 2, moto: 3, bike: 3, amb: 1 } : { bus: 4, moto: 5, bike: 6, amb: 1 };
function stepMovers(dt){
  var G = S.G, car = S.car; if (!G || !car || !W.scene) return;
  var want = []; for (var k in MIX) for (var i = 0; i < MIX[k]; i++) want.push(k);
  while (W.movers.length < want.length){ var m = spawnMover(want[W.movers.length]); if (!m) break; W.movers.push(m); }
  W.movers.forEach(function(o, idx){
    var g = G.segs[o.seg]; if (!g){ W.movers[idx] = spawnMover(o.kind) || o; return; }
    var ux = (g[2] - g[0]) / o.len * o.dir, uy = (g[3] - g[1]) / o.len * o.dir, sx = o.dir > 0 ? g[0] : g[2], sy = o.dir > 0 ? g[1] : g[3];
    var lane = A.HALF[g[4]] * (o.kind === 'bike' ? 0.8 : 0.45) * (S.cityId === 'london' || S.cityId === 'tokyo' ? -1 : 1);
    var x = sx + ux * o.t + uy * lane, y = sy + uy * o.t - ux * lane;
    var dx = x - car.x, dy = y - car.y, d = Math.hypot(dx, dy);
    if (d > 330){ var nm = spawnMover(o.kind); if (nm){ if (o.grp && o.grp.parent) o.grp.parent.remove(o.grp); W.movers[idx] = nm; } return; }
    var target = o.max;
    var ahead = -(dx * ux + dy * uy); if (ahead > 0 && ahead < 14 && Math.abs(dx * uy - dy * ux) < 2.5) target = 0;
    if (SK.signalAhead){ var sg = SK.signalAhead(x, y, ux, uy); if (sg && sg.state !== 2 && o.kind !== 'amb') target = Math.min(target, Math.max(0, sg.d - 5)); }
    if (o.kind === 'bus'){ o.stopT -= dt; if (o.stopT < -25 && Math.random() < dt * 0.1){ o.stopT = 6; } if (o.stopT > 0) target = 0; }
    if (o.stun > 0){ o.stun -= dt; target = 0; }
    o.v += (target - o.v) * Math.min(1, dt * (target < o.v ? 2.5 : 0.8));
    o.t += o.v * dt; if (o.t >= o.len){ var over = o.t - o.len; nextSeg(o); o.t = Math.min(over, o.len); }
    o.x = x; o.y = y; o.h = Math.atan2(uy, ux);
    if (!o.grp){ o.grp = o.kind === 'bus' ? busMesh() : o.kind === 'amb' ? null : bikeMesh(o.kind === 'moto');
      if (o.kind === 'amb' && SK.buildCar){ o.grp = SK.buildCar('sedan', '#FFFFFF'); ambLights(o.grp); if (SK.loadCar) SK.loadCar('ambulance'); } }
    if (o.grp && o.grp.parent !== W.scene) W.scene.add(o.grp);
    if (o.grp){ o.grp.position.set(x, 0.02, -y); o.grp.rotation.set(0, o.h, 0); if (o.grp.userData.flash){ var ph = Math.floor(performance.now() / 160) % 2; o.grp.userData.flash[0].visible = !!ph; o.grp.userData.flash[1].visible = !ph; } }
  });
}
function ambLights(grp){
  var mk = function(c){ var cv = document.createElement('canvas'); cv.width = cv.height = 64; var g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 1, 32, 32, 31); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), color: c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); s.scale.set(1.2, 1.2, 1); return s; };
  var a = mk(new THREE.Color(0.3, 0.6, 3)), b = mk(new THREE.Color(3, 0.3, 0.3)); a.position.set(0, 2.3, 0.4); b.position.set(0, 2.3, -0.4); grp.add(a); grp.add(b); grp.userData.flash = [a, b];
}
// también se puede chocar con ellos
var baseSolid = SK.solidCars;
SK.solidCars = function(){
  var L = baseSolid ? baseSolid() : []; if (!W.movers.length) return L;
  var out = L.slice(), car = S.car;
  W.movers.forEach(function(o, i){
    if (!car || Math.abs(o.x - car.x) > 30 || Math.abs(o.y - car.y) > 30) return;
    if (o.kind === 'bus'){ var ux = Math.cos(o.h), uy = Math.sin(o.h); for (var k = -2; k <= 2; k++) out.push(o.x + ux * k * 2.3, o.y + uy * k * 2.3, o.h, 3000 + i); }
    else out.push(o.x, o.y, o.h, 3000 + i);
  });
  return out;
};
var baseBump = SK.bumpCar;
SK.bumpCar = function(id, ix, iy){ if (id >= 3000 && id < 4000){ var o = W.movers[id - 3000]; if (o){ o.stun = 2; o.v = 0; } return; } if (baseBump) baseBump(id, ix, iy); };

// ============================================================== luces del tráfico de noche
var lights = { mesh: null };
function stepTrafficLights(){
  var night = W.lk && (W.lk.night || W.lk.dusk); if (!night || !SK.traffic || !W.scene) { if (lights.mesh) lights.mesh.visible = false; return; }
  var cs = SK.traffic(); if (!cs) return;
  if (!lights.mesh){
    var n = 80 * 4, g = new THREE.SphereGeometry(0.11, 6, 4);
    var m = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({ color: 0xFFFFFF, toneMapped: false }), n);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; W.scene.add(m); lights.mesh = m;
    lights.m4 = new THREE.Matrix4(); lights.hide = new THREE.Matrix4().makeScale(0, 0, 0);
    var cw = new THREE.Color(2.6, 2.4, 2.0), cr = new THREE.Color(2.4, 0.15, 0.1);
    for (var i = 0; i < n; i++) m.setColorAt(i, (i % 4) < 2 ? cw : cr);
  }
  var M = lights.mesh, m4 = lights.m4, k = 0;
  for (var i2 = 0; i2 < cs.length && k < 320; i2++){
    var o = cs[i2];
    if (!o.on || o.x == null){ for (var z = 0; z < 4; z++) M.setMatrixAt(k++, lights.hide); continue; }
    var ux = Math.cos(o.h), uy = Math.sin(o.h), nx = -uy, ny = ux;
    [[2.25, 0.65], [2.25, -0.65], [-2.3, 0.62], [-2.3, -0.62]].forEach(function(p){
      m4.makeTranslation(o.x + ux * p[0] + nx * p[1], 0.62, -(o.y + uy * p[0] + ny * p[1])); M.setMatrixAt(k++, m4);
    });
  }
  while (k < 320) M.setMatrixAt(k++, lights.hide);
  M.instanceMatrix.needsUpdate = true; M.visible = true;
}

// ============================================================== vaho del escape con frío
var vapT = 0;
function stepVapor(dt){
  var t = S.weather && S.weather.temp; if (t == null || t > 10 || !SK.real3d || !SK.real3d.emit || !S.car) return;
  vapT -= dt; if (vapT > 0) return; vapT = 0.06;
  var c = S.car, cx = Math.cos(c.h), cy = Math.sin(c.h), k = Math.max(0.2, 1 - (t + 5) / 15);
  if (Math.random() < k) SK.real3d.emit(c.x - cx * 2.3 + cy * 0.45, 0.35, -(c.y - cy * 2.3 - cx * 0.45), -cx * 0.8 + (Math.random() - 0.5) * 0.4, 0.6 + Math.random() * 0.4, cy * 0.8 + (Math.random() - 0.5) * 0.4, 1.1, 0.22, 0.22, 0.24);
}

// ============================================================== trozos que saltan al chocar
var DEBRIS = ['debris-bumper', 'debris-tire', 'debris-door', 'debris-plate-a', 'debris-bolt'], debMod = {}, debList = [], lastHitT = 0;
function loadProp(id){
  if (debMod[id] !== undefined || !THREE.GLTFLoader) return; debMod[id] = null;
  new THREE.GLTFLoader().load('cars/' + id + '.glb', function(gl){
    var inner = gl.scene; inner.scale.setScalar(1.4);
    inner.traverse(function(o){ if (o.isMesh){ o.material = new THREE.MeshLambertMaterial({ map: o.material.map }); o.castShadow = true; } });
    debMod[id] = inner;
  });
}
DEBRIS.forEach(loadProp);
function stepDebris(dt){
  var h = S.hit;
  if (h && h.t !== lastHitT && h.mag > 9 && W.scene){
    lastHitT = h.t;
    var n = Math.min(3, Math.round(h.mag / 7));
    for (var i = 0; i < n; i++){
      var src = debMod[DEBRIS[(Math.random() * DEBRIS.length) | 0]]; if (!src) continue;
      var o = src.clone(); o.position.set(h.x, 0.8, -h.y); W.scene.add(o);
      debList.push({ o: o, vx: (h.nx || 0) * 5 + (Math.random() - 0.5) * 6, vy: 4 + Math.random() * 4, vz: -(h.ny || 0) * 5 + (Math.random() - 0.5) * 6, rx: Math.random() * 8, ry: Math.random() * 8, rest: false });
      if (debList.length > 18){ var old = debList.shift(); if (old.o.parent) old.o.parent.remove(old.o); }
    }
  } else if (h) lastHitT = lastHitT || h.t;
  debList.forEach(function(d){
    if (d.rest) return;
    d.vy -= 16 * dt; d.o.position.x += d.vx * dt; d.o.position.y += d.vy * dt; d.o.position.z += d.vz * dt;
    d.o.rotation.x += d.rx * dt; d.o.rotation.y += d.ry * dt;
    if (d.o.position.y < 0.08){ d.o.position.y = 0.08; d.vy *= -0.3; d.vx *= 0.6; d.vz *= 0.6; d.rx *= 0.5; d.ry *= 0.5; if (Math.abs(d.vy) < 0.6 && Math.hypot(d.vx, d.vz) < 0.4) d.rest = true; }
  });
  if (S.phase === 'count' && debList.length){ debList.forEach(function(d){ if (d.o.parent) d.o.parent.remove(d.o); }); debList = []; }
}

// ============================================================== Navidad y Feria
function buildEvents(scene, lk){
  var q = (location.search + (function(){ try { return top.location.search; } catch(e){ return ''; } })()).match(/evento=(\w+)/);
  var now = new Date(), m = now.getMonth() + 1, d = now.getDate(), ev = q ? q[1] : null;
  if (!ev){ if ((m === 12) || (m === 1 && d <= 6) || (m === 11 && d >= 28)) ev = 'navidad'; else if (S.cityId === 'sevilla' && (m === 4 || (m === 5 && d <= 10))) ev = 'feria'; }
  if (!ev) return;
  var R = S.circuit; if (!R) return;
  var n = Math.min(MOBILE ? 60 : 140, Math.floor(R.total / 22)), per = ev === 'feria' ? 9 : 14;
  var g = ev === 'feria' ? new THREE.SphereGeometry(0.28, 10, 8) : new THREE.SphereGeometry(0.09, 6, 4);
  var im = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({ color: 0xFFFFFF, toneMapped: false }), n * per);
  var wireM = new THREE.LineBasicMaterial({ color: 0x222222 }), wires = [];
  var m4 = new THREE.Matrix4(), k = 0, cols = ev === 'feria' ? [new THREE.Color(2.4, 0.3, 0.3), new THREE.Color(2.5, 2.2, 1.6), new THREE.Color(0.4, 1.8, 0.6)] : [new THREE.Color(2.6, 2.2, 1.2), new THREE.Color(2.4, 0.5, 0.4)];
  for (var i = 0; i < n; i++){
    var p = A.pointAt(R, (i + 0.5) * R.total / n), nx = -Math.sin(p.h), ny = Math.cos(p.h), half = 6.5;
    var ax = p.x - nx * half, ay = p.y - ny * half, bx = p.x + nx * half, by = p.y + ny * half;
    var pts = [];
    for (var s = 0; s < per; s++){
      var u = s / (per - 1), x = ax + (bx - ax) * u, y = ay + (by - ay) * u, h = 6.8 - Math.sin(u * Math.PI) * 1.1;
      m4.makeTranslation(x, h - (ev === 'feria' ? 0.3 : 0), -y); im.setMatrixAt(k, m4); im.setColorAt(k, cols[(s + i) % cols.length]); k++;
      pts.push(new THREE.Vector3(x, h, -y));
    }
    wires.push(new THREE.BufferGeometry().setFromPoints(pts));
  }
  im.count = k; scene.add(im);
  wires.forEach(function(wg){ scene.add(new THREE.Line(wg, wireM)); });
  if (SK.tip) setTimeout(function(){ SK.tip(ev === 'feria' ? '🏮 ¡Es Feria!' : '🎄 Navidad en ' + ((A.CITIES[S.cityId] || {}).name || 'la ciudad'), ev === 'feria' ? 'Farolillos por todo el recorrido.' : 'Las calles se han iluminado.', 4000); }, 3000);
}

// ============================================================== salpicadero en la vista capó
var dash = document.createElement('div'); dash.id = 'dash';
dash.innerHTML = '<svg viewBox="0 0 1000 260" preserveAspectRatio="xMidYMax slice"><path d="M0 120 Q500 40 1000 120 L1000 260 L0 260Z" fill="#101316"/><path d="M0 120 Q500 40 1000 120" stroke="#2A3036" stroke-width="6" fill="none"/>' +
  '<g id="dashWheel" transform="translate(500 250)"><circle r="150" fill="none" stroke="#1C2126" stroke-width="30"/><rect x="-150" y="-14" width="300" height="28" rx="12" fill="#1C2126"/><circle r="36" fill="#23292F"/><circle r="12" fill="#FF5B3D"/></g>' +
  '<text id="dashSpd" x="500" y="190" text-anchor="middle" fill="#9FE6C0" font-family="JetBrains Mono, monospace" font-size="34" font-weight="700">0</text></svg>';
W.dash = dash; $('stage').appendChild(dash);
var dcss = document.createElement('style');
dcss.textContent = '#dash{position:absolute;left:0;right:0;bottom:0;height:25%;pointer-events:none;z-index:6;display:none} #dash.on{display:block} #dash svg{width:100%;height:100%} body.touchui #dash{height:19%}';
document.head.appendChild(dcss);
function stepDash(){
  var on = S.view === 'hood' && S.car && (S.phase === 'run' || S.phase === 'count' || S.phase === 'ready');
  dash.classList.toggle('on', !!on); if (!on) return;
  var w = document.getElementById('dashWheel'); if (w) w.setAttribute('transform', 'translate(500 250) rotate(' + (-(S.steerOut || 0) * 110).toFixed(1) + ')');
  var sp = document.getElementById('dashSpd'); if (sp) sp.textContent = Math.round(S.car.speed * 3.6);
}

// ============================================================== desenfoque en repeticiones y sombras de contacto
var post = { after: null, ssao: null, loading: false };
function loadPost(cb){
  if (THREE.AfterimagePass && THREE.SSAOPass) return cb();
  if (post.loading) return; post.loading = true;
  var sc = document.createElement('script'); sc.src = 'three-post2.js'; sc.onload = function(){ post.loading = false; cb(); }; document.head.appendChild(sc);
}
var SSAO_ON = ls('sk_ssao') === '1';
SK.setSSAO = function(v){ SSAO_ON = !!v; ls('sk_ssao', v ? '1' : '0'); };
function stepPost(o){
  var comp = SK.composer3d && SK.composer3d(); if (!comp) return;
  var replay = S.phase === 'replay' || !!S.tvReplay;
  if (replay && !post.after){ loadPost(function(){ if (!post.after && THREE.AfterimagePass){ post.after = new THREE.AfterimagePass(0.72); } }); }
  if (post.after){
    var has = comp.passes.indexOf(post.after) >= 0;
    if (replay && !has) comp.addPass(post.after); else if (!replay && has) comp.removePass(post.after);
  }
  var wantSSAO = SSAO_ON && !MOBILE && SK.getGfx && SK.getGfx() === 'alto' && !replay;
  if (wantSSAO && !post.ssao){ loadPost(function(){ if (!post.ssao && THREE.SSAOPass && W.scene){ try { var sz = new THREE.Vector2(); comp.renderer.getSize(sz); post.ssao = new THREE.SSAOPass(W.scene, o.cam, sz.x, sz.y); post.ssao.kernelRadius = 6; post.ssao.minDistance = 0.002; post.ssao.maxDistance = 0.06; } catch(e){ post.ssao = false; } } }); }
  if (post.ssao){
    post.ssao.scene = W.scene; post.ssao.camera = o.cam;
    var hasS = comp.passes.indexOf(post.ssao) >= 0;
    if (wantSSAO && !hasS) comp.insertPass(post.ssao, 1); else if (!wantSSAO && hasS) comp.removePass(post.ssao);
  }
}

// ============================================================== cada fotograma
var prevFrame = SK.frame3d;
SK.frame3d = function(dt, o){
  if (prevFrame) try { prevFrame(dt, o); } catch(e){}
  if (W.stars) W.stars.position.copy(o.cam.position);
  try { stepMovers(Math.min(0.1, dt)); } catch(e){ if (!W.e1){ W.e1 = 1; console.warn(e); } }
  try { stepTrafficLights(); } catch(e){}
  try { stepVapor(dt); } catch(e){}
  try { stepDebris(Math.min(0.05, dt)); } catch(e){}
  try { stepDash(); } catch(e){}
  try { stepPost(o); } catch(e){}
};
SK.world = { W: W, sunPos: sunPos };
})();
