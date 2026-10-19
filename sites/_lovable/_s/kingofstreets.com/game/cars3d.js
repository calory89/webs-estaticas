/* King of Streets — los coches. Todos corren igual: mismo motor, mismo agarre, mismo peso.
   Solo cambia la carrocería. Cada modelo es una silueta lateral extruida a lo ancho,
   con cristales, ruedas con llanta, faros, pilotos y sombra bajo el coche. */
(function(){
'use strict';
window.SK = window.SK || {};

// x hacia delante, y hacia arriba, en metros. body = carrocería, glass = cabina, roof = [x0, x1, y] techo del color del coche
var CARS = [
  { id: 'hatch', name: 'Urbano', L: 3.9, W: 1.74, wr: 0.33, wb: 1.24, tr: 0.76,
    body: [[-1.95,0.28],[-1.95,0.92],[-1.82,1.0],[1.15,0.98],[1.82,0.8],[1.95,0.56],[1.95,0.28]],
    glass: [[-1.8,0.97],[-1.6,1.5],[0.22,1.53],[1.12,0.97]], roof: [-1.58, 0.2, 1.5] },
  { id: 'gt', name: 'GT', L: 4.5, W: 1.95, wr: 0.36, wb: 1.44, tr: 0.86,
    body: [[-2.25,0.26],[-2.25,0.8],[-2.02,0.9],[-0.9,0.92],[1.2,0.8],[2.08,0.6],[2.25,0.44],[2.25,0.26]],
    glass: [[-1.55,0.9],[-0.55,1.22],[0.32,1.22],[1.25,0.8]], roof: [-0.52, 0.3, 1.2], spoiler: true },
  { id: 'muscle', name: 'Muscle', L: 4.8, W: 1.95, wr: 0.37, wb: 1.5, tr: 0.86,
    body: [[-2.4,0.3],[-2.4,0.96],[-2.22,1.02],[-1.3,1.02],[2.18,0.98],[2.4,0.88],[2.4,0.3]],
    glass: [[-1.25,1.0],[-0.75,1.4],[0.45,1.4],[1.05,1.0]], roof: [-0.72, 0.42, 1.38], stripes: true },
  { id: 'suv', name: 'SUV', L: 4.7, W: 1.96, wr: 0.42, wb: 1.44, tr: 0.88,
    body: [[-2.35,0.44],[-2.35,1.16],[-2.2,1.24],[1.3,1.22],[2.2,1.02],[2.35,0.8],[2.35,0.44]],
    glass: [[-2.18,1.22],[-2.04,1.8],[0.6,1.82],[1.35,1.22]], roof: [-2.02, 0.58, 1.8], rails: true },
  { id: 'rally', name: 'Rally', L: 4.0, W: 1.84, wr: 0.35, wb: 1.26, tr: 0.84,
    body: [[-2.0,0.34],[-2.0,0.94],[-1.86,1.02],[1.15,1.0],[1.86,0.82],[2.0,0.58],[2.0,0.34]],
    glass: [[-1.84,0.99],[-1.62,1.5],[0.2,1.53],[1.12,0.99]], roof: [-1.6, 0.18, 1.5], spoiler: true, lightbar: true, stripes: true },
  { id: 'taxi', name: 'Taxi', L: 4.6, W: 1.82, wr: 0.34, wb: 1.4, tr: 0.8,
    body: [[-2.3,0.3],[-2.3,0.9],[-1.42,0.95],[1.3,0.95],[2.18,0.8],[2.3,0.56],[2.3,0.3]],
    glass: [[-1.45,0.93],[-0.9,1.44],[0.55,1.44],[1.3,0.93]], roof: [-0.86, 0.5, 1.42], sign: true, paint: '#F4F4F1' }
];
SK.CARS = CARS;
SK.carById = function(id){ for (var i = 0; i < CARS.length; i++) if (CARS[i].id === id) return CARS[i]; return CARS[0]; };

// silueta en SVG para el selector (misma geometría que el 3D)
SK.carSvg = function(id, color){
  var c = SK.carById(id), sx = 22, sy = 22, ox = 50, oy = 44;
  function pts(a){ return a.map(function(p){ return (ox + p[0]*sx).toFixed(1) + ',' + (oy - p[1]*sy).toFixed(1); }).join(' '); }
  var wr = c.wr * sy, w1 = ox + c.wb*sx, w0 = ox - c.wb*sx, wy = oy - c.wr*sy;
  return '<svg viewBox="0 0 100 52" xmlns="http://www.w3.org/2000/svg">' +
    '<ellipse cx="50" cy="46" rx="44" ry="3" fill="rgba(0,0,0,.35)"/>' +
    '<polygon points="' + pts(c.body) + '" fill="' + (color || c.paint || '#E23A16') + '"/>' +
    '<polygon points="' + pts(c.glass) + '" fill="#1B2630"/>' +
    '<rect x="' + (ox + c.roof[0]*sx).toFixed(1) + '" y="' + (oy - c.roof[2]*sy - 1.5).toFixed(1) + '" width="' + ((c.roof[1]-c.roof[0])*sx).toFixed(1) + '" height="2" fill="' + (color || c.paint || '#E23A16') + '"/>' +
    (c.sign ? '<rect x="' + (ox - 0.2*sx) + '" y="' + (oy - c.roof[2]*sy - 6) + '" width="' + (0.4*sx) + '" height="4" rx="1" fill="#F2C14E"/>' : '') +
    (c.spoiler ? '<rect x="' + (ox + (c.body[0][0]+0.05)*sx) + '" y="' + (oy - (c.body[1][1]+0.28)*sy) + '" width="' + (0.5*sx) + '" height="2" fill="#11161B"/>' : '') +
    '<circle cx="' + w0 + '" cy="' + wy + '" r="' + wr + '" fill="#111"/><circle cx="' + w0 + '" cy="' + wy + '" r="' + (wr*0.55) + '" fill="#B8BEC6"/>' +
    '<circle cx="' + w1 + '" cy="' + wy + '" r="' + wr + '" fill="#111"/><circle cx="' + w1 + '" cy="' + wy + '" r="' + (wr*0.55) + '" fill="#B8BEC6"/>' +
    '</svg>';
};

var rimTex = null, shadowTex = null;
function makeRimTex(){
  var c = document.createElement('canvas'); c.width = c.height = 128;
  var g = c.getContext('2d');
  g.fillStyle = '#1A1C1F'; g.fillRect(0, 0, 128, 128);
  g.translate(64, 64);
  var gr = g.createRadialGradient(0, 0, 4, 0, 0, 60); gr.addColorStop(0, '#E8ECF0'); gr.addColorStop(1, '#8C949C');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 58, 0, 6.283); g.fill();
  g.fillStyle = '#2A2E33';
  for (var i = 0; i < 5; i++){                          // cinco radios
    g.rotate(6.283 / 5);
    g.beginPath(); g.moveTo(10, 18); g.quadraticCurveTo(26, 30, 22, 50); g.lineTo(38, 44); g.quadraticCurveTo(34, 22, 18, 12); g.closePath(); g.fill();
  }
  g.fillStyle = '#5A6068'; g.beginPath(); g.arc(0, 0, 11, 0, 6.283); g.fill();
  var t = new THREE.CanvasTexture(c); return t;
}
function makeShadowTex(){
  var c = document.createElement('canvas'); c.width = 128; c.height = 64;
  var g = c.getContext('2d'), gr = g.createRadialGradient(64, 32, 4, 64, 32, 60);
  gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(0.6, 'rgba(0,0,0,.28)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 64);
  return new THREE.CanvasTexture(c);
}
function shapeOf(pts){
  var s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (var i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  return s;
}
function extrude(pts, width, bevel){
  var bt = bevel ? 0.06 : 0, g = new THREE.ExtrudeGeometry(shapeOf(pts), {
    depth: Math.max(0.1, width - bt*2), bevelEnabled: !!bevel, bevelThickness: bt, bevelSize: bevel ? 0.05 : 0, bevelSegments: 2, steps: 1, curveSegments: 1 });
  g.translate(0, 0, -(width - bt*2) / 2);
  g.computeVertexNormals();
  return g;
}
function box(w, h, d, mat, x, y, z){
  var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; return m;
}

// kind: id del modelo; color: pintura; alpha: <1 para los fantasmas
SK.buildCar = function(kind, color, alpha){
  var c = SK.carById(kind), g = new THREE.Group(), ghost = alpha && alpha < 1;
  if (!rimTex){ rimTex = makeRimTex(); shadowTex = makeShadowTex(); }
  var col = new THREE.Color(color || c.paint || '#E23A16');
  var paint = new THREE.MeshLambertMaterial({ color: col });
  var glass = new THREE.MeshLambertMaterial({ color: 0x1A232C });
  var dark = new THREE.MeshLambertMaterial({ color: 0x15181C });
  var chrome = new THREE.MeshLambertMaterial({ color: 0xB9C0C8 });
  var body = new THREE.Mesh(extrude(c.body, c.W, true), paint); body.castShadow = true;
  var cab = new THREE.Mesh(extrude(c.glass, c.W - 0.24, false), glass); cab.castShadow = true;
  var roof = box(c.roof[1] - c.roof[0], 0.07, c.W - 0.26, paint, (c.roof[0] + c.roof[1]) / 2, c.roof[2] + 0.02, 0);
  g.add(body); g.add(cab); g.add(roof);
  var cabin = [cab, roof];
  // parachoques y bajos oscuros
  var front = c.body[c.body.length - 1][0], back = c.body[0][0];
  g.add(box(0.12, 0.22, c.W - 0.1, dark, front + 0.02, 0.36, 0));
  g.add(box(0.12, 0.22, c.W - 0.1, dark, back - 0.02, 0.38, 0));
  g.add(box(c.L - 0.6, 0.12, c.W - 0.2, dark, 0, c.body[0][1] + 0.02, 0));
  // faros y pilotos
  var headM = new THREE.MeshLambertMaterial({ color: 0xFFF6E0, emissive: 0xFFF1D0, emissiveIntensity: 0.9 });
  var tailM = new THREE.MeshLambertMaterial({ color: 0xB0101A, emissive: 0xD01A1A, emissiveIntensity: 0.35 });
  var yh = c.body[c.body.length - 2][1] - 0.02, yt = c.body[1][1] - 0.12;
  [-1, 1].forEach(function(s){
    g.add(box(0.06, 0.12, 0.42, headM, front + 0.03, Math.max(0.5, yh - 0.1), s * (c.W/2 - 0.3)));
    g.add(box(0.06, 0.12, 0.46, tailM, back - 0.03, yt, s * (c.W/2 - 0.3)));
  });
  var brake = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, c.W - 0.9), tailM); brake.position.set(back - 0.03, yt, 0); g.add(brake);
  // extras por modelo
  if (c.spoiler){
    var sy0 = c.body[1][1] + 0.26, sx0 = back + 0.28;
    g.add(box(0.36, 0.05, c.W - 0.1, ghost ? paint : dark, sx0, sy0, 0));
    g.add(box(0.06, 0.26, 0.06, dark, sx0, sy0 - 0.14, c.W/2 - 0.35)); g.add(box(0.06, 0.26, 0.06, dark, sx0, sy0 - 0.14, -(c.W/2 - 0.35)));
    cabin.push(g.children[g.children.length - 3]);
  }
  if (c.stripes && !ghost){
    var wm = new THREE.MeshLambertMaterial({ color: 0xF4F4F1 });
    [-0.22, 0.22].forEach(function(z){
      g.add(box(1.25, 0.012, 0.16, wm, front - 0.8, c.body[c.body.length - 3][1] + 0.03, z));
      g.add(box(c.roof[1] - c.roof[0] - 0.05, 0.012, 0.16, wm, (c.roof[0] + c.roof[1]) / 2, c.roof[2] + 0.065, z));
    });
  }
  if (c.rails){ [-1, 1].forEach(function(s){ var r = box(c.roof[1] - c.roof[0] - 0.3, 0.06, 0.05, chrome, (c.roof[0] + c.roof[1]) / 2, c.roof[2] + 0.1, s * (c.W/2 - 0.2)); g.add(r); cabin.push(r); }); }
  if (c.lightbar){ var lb = box(0.14, 0.1, 1.1, new THREE.MeshLambertMaterial({ color: 0xFFFFF0, emissive: 0xFFFFE8, emissiveIntensity: 0.7 }), c.roof[0] + 1.1, c.roof[2] + 0.1, 0); g.add(lb); cabin.push(lb); }
  if (c.sign){ var sg = box(0.28, 0.2, 0.62, new THREE.MeshLambertMaterial({ color: 0xF2C14E, emissive: 0xF2B030, emissiveIntensity: 0.6 }), (c.roof[0] + c.roof[1]) / 2, c.roof[2] + 0.16, 0); g.add(sg); cabin.push(sg); }
  // retrovisores
  [-1, 1].forEach(function(s){ g.add(box(0.14, 0.1, 0.16, paint, c.glass[c.glass.length - 1][0] - 0.12, c.glass[0][1] + 0.08, s * (c.W/2 + 0.04))); });
  // ruedas: neumático + llanta con radios
  var wheels = [], tireM = new THREE.MeshLambertMaterial({ color: 0x141414 }), rimM = new THREE.MeshLambertMaterial({ map: rimTex });
  [[c.wb, c.tr], [c.wb, -c.tr], [-c.wb, c.tr], [-c.wb, -c.tr]].forEach(function(w){
    var t = new THREE.Mesh(new THREE.CylinderGeometry(c.wr, c.wr, 0.3, 18, 1), [tireM, rimM, rimM]);
    t.rotation.x = Math.PI / 2; t.position.set(0, c.wr, 0); t.castShadow = true;
    var holder = new THREE.Group(); holder.position.set(w[0], 0, w[1]); holder.add(t); g.add(holder); wheels.push(t);
  });
  // sombra suave bajo el coche (asienta el coche en el asfalto)
  var sh = new THREE.Mesh(new THREE.PlaneGeometry(c.L + 0.8, c.W + 0.9),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: ghost ? 0.3 : 1 }));
  sh.rotation.x = -Math.PI / 2; sh.position.y = 0.035; sh.renderOrder = 1; g.add(sh);
  g.userData = { kind: c.id, paint: [paint], cabin: cabin, wheels: wheels, holders: wheels.map(function(w){ return w.parent; }),
                 brake: brake, glass: glass, bodyMesh: body };
  if (ghost) g.traverse(function(o){ if (o.material && o !== sh){ (Array.isArray(o.material) ? o.material : [o.material]).forEach(function(m){ m.transparent = true; m.opacity = alpha; m.depthWrite = false; }); o.castShadow = false; } });
  return g;
};

// ============================================================== coches 3D de verdad (Kenney Car Kit, CC0)
// Modelos GLB con ruedas separadas. Se cargan bajo demanda; mientras tanto se ve la silueta de arriba.
var KM = [
  { id: 'sedan', name: 'Urbano' }, { id: 'sedan-sports', name: 'Deportivo' }, { id: 'hatchback-sports', name: 'Hot hatch' },
  { id: 'suv', name: 'SUV' }, { id: 'suv-luxury', name: 'Lujo' }, { id: 'taxi', name: 'Taxi' }, { id: 'police', name: 'Policía' },
  { id: 'race', name: 'Carreras' }, { id: 'race-future', name: 'Futuro' }, { id: 'van', name: 'Furgo' }
];
var LEGACY = { hatch: 'sedan', gt: 'sedan-sports', muscle: 'race', rally: 'hatchback-sports' };
var TRAFFIC = ['sedan', 'suv', 'van', 'taxi', 'hatchback-sports', 'delivery', 'truck', 'sedan-sports'];
var FALLBACK = { sedan: 'hatch', 'sedan-sports': 'gt', 'hatchback-sports': 'rally', suv: 'suv', 'suv-luxury': 'suv', taxi: 'taxi', police: 'hatch', race: 'gt', 'race-future': 'gt', van: 'suv', delivery: 'suv', truck: 'suv' };
var BASE = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/[^\/]*$/, '') : '';
var tmpl = {}, loading = {}, atlas = null, atlasData = null;
SK.CARS = KM;
SK.carId = function(id){ id = LEGACY[id] || id; for (var i = 0; i < KM.length; i++) if (KM[i].id === id) return id; return 'sedan'; };
SK.carName = function(id){ id = SK.carId(id); for (var i = 0; i < KM.length; i++) if (KM[i].id === id) return KM[i].name; return 'Urbano'; };
SK.carThumb = function(id){ return BASE + 'cars/thumbs/' + SK.carId(id) + '.png'; };
SK.carReady = function(id){ return !!tmpl[SK.carId(id)]; };
var oldBuild = SK.buildCar;

function loadAtlas(){
  if (atlas) return atlas;
  atlas = new Promise(function(res){
    var im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = function(){ var c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
      var g = c.getContext('2d'); g.drawImage(im, 0, 0); atlasData = { img: im, w: im.width, h: im.height, px: g.getImageData(0, 0, im.width, im.height) }; res(atlasData); };
    im.onerror = function(){ res(null); };
    im.src = BASE + 'cars/Textures/colormap.png';
  });
  return atlas;
}
function rgb2hsl(r, g, b){
  r /= 255; g /= 255; b /= 255;
  var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
  if (d > 0.0001){ s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? ((b - r) / d + 2) : ((r - g) / d + 4); h /= 6; }
  return [h, s, l];
}
function hsl2rgb(h, s, l){
  function f(p, q, t){ if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1/6) return p + (q - p) * 6 * t; if (t < 1/2) return q; if (t < 2/3) return p + (q - p) * (2/3 - t) * 6; return p; }
  if (s === 0) return [l*255, l*255, l*255];
  var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  return [f(p, q, h + 1/3) * 255, f(p, q, h) * 255, f(p, q, h - 1/3) * 255];
}
// Los píxeles de la paleta que usa la carrocería (el color más repetido y saturado de la malla "body")
function paintPixels(body){
  var A = atlasData, uv = body.geometry.attributes.uv; if (!A || !uv) return null;
  var buckets = {}, D = A.px.data;
  for (var i = 0; i < uv.count; i++){
    var x = Math.min(A.w - 1, Math.max(0, Math.floor(uv.getX(i) * A.w))), y = Math.min(A.h - 1, Math.max(0, Math.floor(uv.getY(i) * A.h)));
    var o = (y * A.w + x) * 4, hsl = rgb2hsl(D[o], D[o+1], D[o+2]);
    if (hsl[1] < 0.3 || hsl[2] < 0.18 || hsl[2] > 0.88) continue;
    var k = Math.round(hsl[0] * 12) % 12; (buckets[k] = buckets[k] || []).push([x, y, hsl[0]]);
  }
  var best = null; for (var b in buckets) if (!best || buckets[b].length > best.length) best = buckets[b];
  if (!best) return null;
  var hue = best[0][2], seen = new Uint8Array(A.w * A.h), out = [], stack = best.map(function(p){ return [p[0], p[1], p[0], p[1]]; });
  while (stack.length){
    var q = stack.pop(), px = q[0], py = q[1]; if (px < 0 || py < 0 || px >= A.w || py >= A.h) continue;
    var idx = py * A.w + px; if (seen[idx]) continue; seen[idx] = 1;
    if (Math.abs(px - q[2]) > 40 || Math.abs(py - q[3]) > 70) continue;
    var o2 = idx * 4, h2 = rgb2hsl(D[o2], D[o2+1], D[o2+2]), dh = Math.abs(h2[0] - hue); dh = Math.min(dh, 1 - dh);
    if (h2[1] < 0.22 || dh > 0.06) continue;
    out.push(idx);
    stack.push([px+1, py, q[2], q[3]], [px-1, py, q[2], q[3]], [px, py+1, q[2], q[3]], [px, py-1, q[2], q[3]]);
  }
  return out;
}
var texCache = {};
function paintTexture(id, color){
  var t = tmpl[id], key = id + '|' + color; if (!t || !atlasData) return null;
  if (texCache[key]) return texCache[key];
  if (!t.paintPx) return null;
  var A = atlasData, c = document.createElement('canvas'); c.width = A.w; c.height = A.h;
  var g = c.getContext('2d'), img = g.createImageData(A.w, A.h); img.data.set(A.px.data);
  var pc = new THREE.Color(color), ph = rgb2hsl(pc.r * 255, pc.g * 255, pc.b * 255), D = img.data, sumL = 0;
  t.paintPx.forEach(function(i){ sumL += rgb2hsl(D[i*4], D[i*4+1], D[i*4+2])[2]; });
  var mL = sumL / Math.max(1, t.paintPx.length);
  t.paintPx.forEach(function(i){
    var o = i * 4, l = rgb2hsl(D[o], D[o+1], D[o+2])[2], nl = Math.max(0.04, Math.min(0.96, ph[2] + (l - mL) * 0.9));
    var r = hsl2rgb(ph[0], ph[1], nl); D[o] = r[0]; D[o+1] = r[1]; D[o+2] = r[2];
  });
  g.putImageData(img, 0, 0);
  var tx = new THREE.CanvasTexture(c); tx.flipY = false; tx.encoding = THREE.LinearEncoding;
  tx.magFilter = THREE.NearestFilter; tx.minFilter = THREE.LinearMipmapLinearFilter;
  texCache[key] = tx; return tx;
}
SK.loadCar = function(id){
  id = TRAFFIC.indexOf(id) >= 0 ? id : SK.carId(id);
  if (tmpl[id]) return Promise.resolve(tmpl[id]);
  if (loading[id]) return loading[id];
  if (!THREE.GLTFLoader) return Promise.resolve(null);
  loading[id] = Promise.all([loadAtlas(), new Promise(function(res){
    new THREE.GLTFLoader().load(BASE + 'cars/' + id + '.glb', function(gl){ res(gl); }, undefined, function(){ res(null); });
  })]).then(function(r){
    var gl = r[1]; if (!gl) return null;
    var inner = gl.scene; inner.scale.set(1.3, 1.55, 1.55); inner.rotation.y = Math.PI / 2;
    var root = new THREE.Group(); root.add(inner); root.updateMatrixWorld(true);
    var body = null, map = null;
    var first = null;
    inner.traverse(function(o){
      if (!o.isMesh) return;
      if (o.name === 'body' || (o.parent && o.parent.name === 'body')) body = body || o;
      if (!first && !/wheel/.test(o.name) && !(o.parent && /wheel/.test(o.parent.name))) first = o;
      if (o.material && o.material.map){ map = o.material.map; map.encoding = THREE.LinearEncoding; }
    });
    body = body || first;
    var box = new THREE.Box3().setFromObject(root);
    var t = { id: id, root: root, body: body, map: map, box: box, paintPx: body ? paintPixels(body) : null };
    // geometría fundida para el tráfico instanciado
    var pos = [], nor = [], uvs = [];
    root.traverse(function(o){
      if (!o.isMesh) return;
      var g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
      pos.push.apply(pos, g.attributes.position.array); nor.push.apply(nor, g.attributes.normal.array);
      if (g.attributes.uv) uvs.push.apply(uvs, g.attributes.uv.array); else for (var k = 0; k < g.attributes.position.count; k++) uvs.push(0, 0);
    });
    var mg = new THREE.BufferGeometry();
    mg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); mg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    mg.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    t.merged = mg;
    tmpl[id] = t;
    if (SK.onCarLoaded) try { SK.onCarLoaded(id); } catch(e){}
    return t;
  });
  return loading[id];
};
SK.trafficReady = function(){ return TRAFFIC.every(function(id){ return !!tmpl[id]; }); };
SK.trafficModels = function(){ return TRAFFIC.map(function(id){ return tmpl[id]; }).filter(Boolean); };
SK.loadTraffic = function(){ return Promise.all(TRAFFIC.map(SK.loadCar)); };

function glow(color, size){
  var c = document.createElement('canvas'); c.width = c.height = 64;
  var g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 1, 32, 32, 31);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), color: color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.set(size, size, 1); return s;
}
SK.buildCar = function(kind, color, alpha){
  var id = SK.carId(kind), t = tmpl[id], ghost = alpha && alpha < 1;
  if (!t){
    SK.loadCar(id);
    var fb = oldBuild(FALLBACK[id] || 'hatch', color, alpha); fb.userData.kind = id; fb.userData.kenney = false; return fb;
  }
  var root = t.root.clone(true), inner = root.children[0], mat = null;
  var tex = color ? paintTexture(id, color) : null;
  var bodyMat = new THREE.MeshLambertMaterial({ map: tex || t.map });
  root.traverse(function(o){
    if (!o.isMesh) return;
    o.material = bodyMat; o.castShadow = !ghost; o.receiveShadow = false;
  });
  var wheels = [], front = [];
  inner.traverse(function(o){
    if (!/^wheel/.test(o.name) || Math.abs(o.position.x) < 0.05) return;
    o.rotation.order = 'YXZ'; wheels.push(o); if (/front/.test(o.name)) front.push(o);
  });
  var b = t.box, L0 = b.min.x, L1 = b.max.x, H = b.max.y, Wd = b.max.z;
  var brakeM = new THREE.MeshLambertMaterial({ color: 0xA01018, emissive: 0xFF2030, emissiveIntensity: 0.35 });
  var brake = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, Wd * 1.1), brakeM); brake.position.set(L0 + 0.02, H * 0.42, 0); root.add(brake);
  if (!ghost){
    var headM = new THREE.MeshLambertMaterial({ color: 0xFFF6E0, emissive: 0xFFF1D0, emissiveIntensity: 1.0 });
    [-1, 1].forEach(function(sd){
      var hb = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.34), headM); hb.position.set(L1 + 0.01, H * 0.32, sd * Wd * 0.62); root.add(hb);
      var hg = glow(0xFFF3D6, 0.9); hg.position.set(L1 + 0.12, H * 0.32, sd * Wd * 0.62); root.add(hg);
      var tg = glow(0xFF2A2A, 0.55); tg.position.set(L0 - 0.08, H * 0.42, sd * Wd * 0.62); root.add(tg);
    });
  }
  var sh = new THREE.Mesh(new THREE.PlaneGeometry(L1 - L0 + 0.9, Wd * 2 + 0.9),
    new THREE.MeshBasicMaterial({ map: shadowTex || (shadowTex = makeShadowTex()), transparent: true, depthWrite: false, opacity: ghost ? 0.3 : 0.95 }));
  sh.rotation.x = -Math.PI / 2; sh.position.y = 0.035; sh.renderOrder = 1; root.add(sh);
  root.userData = { kind: id, kenney: true, paint: [bodyMat], cabin: [], wheels: wheels, front: front, holders: front, brake: brake, glass: null };
  if (ghost) root.traverse(function(o){ if (o.material && o !== sh){ o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = alpha; o.material.depthWrite = false; } });
  return root;
};
SK.resetCarPaint = function(grp){
  if (!grp || !grp.userData.kenney) return false;
  var t = tmpl[grp.userData.kind]; if (!t) return false;
  grp.userData.paint.forEach(function(m){ m.map = t.map; m.needsUpdate = true; });
  return true;
};
SK.setCarPaint = function(grp, color){
  if (!grp || !grp.userData.kenney) return false;
  var tex = paintTexture(grp.userData.kind, color); if (!tex) return false;
  grp.userData.paint.forEach(function(m){ m.map = tex; m.needsUpdate = true; if (m.color) m.color.setRGB(1, 1, 1); });
  return true;
};
})();
