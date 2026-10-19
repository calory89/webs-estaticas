/* King of Streets v5 — realismo en 3D.
   · Los edificios nunca te tapan: se abre un hueco entre la cámara y el coche, y si te sales del
     trazado la ciudad se hunde y aparece un carril luminoso y una flecha para volver.
   · Marcas de frenada y derrape en el asfalto, chispas al chocar, llamarada del escape.
   · Faros que iluminan de verdad de noche, semáforos reales de OpenStreetMap que cambian de color.
   · Lluvia (o nieve) con asfalto mojado y agua que salpica. */
(function(){
'use strict';
var A = window.SK && SK.api; if (!A || !window.THREE) return;
var S = A.S, MOBILE = matchMedia('(pointer:coarse)').matches;

// ============================================================== uniformes compartidos
var U = {
  uSkCar: { value: new THREE.Vector3() },
  uSkCam: { value: new THREE.Vector3() },
  uSkHole: { value: 1 },
  uSkFlat: { value: 0 }
};
SK.real3d = { U: U, emit: function(){ return emit.apply(null, arguments); } };
var VERT = [
  'vec4 skP = vec4(transformed, 1.0);',
  '#ifdef USE_INSTANCING',
  'skP = instanceMatrix * skP;',
  '#endif',
  'skP = modelMatrix * skP;',
  'skP.y *= mix(1.0, 0.035, uSkFlat);',
  'vSkW = skP.xyz;',
  'vec4 mvPosition = viewMatrix * skP;',
  'gl_Position = projectionMatrix * mvPosition;'
].join('\n');
var FRAG = [
  '{',
  '  vec3 skD = uSkCar - uSkCam; float skL = dot(skD, skD);',
  '  if (uSkHole > 0.0 && skL > 1.0){',
  '    float skT = dot(vSkW - uSkCam, skD) / skL;',
  '    if (skT > 0.0 && skT < 0.97){',
  '      float skR = length(vSkW - (uSkCam + skD * skT));',
  '      float skMax = mix(1.4, 4.6, skT) * uSkHole;',
  '      if (skR < skMax){',
  '        float skE = smoothstep(skMax * 0.55, skMax, skR);',
  '        float skN = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453);',
  '        if (skN > skE) discard;',
  '      }',
  '    }',
  '  }',
  '}'
].join('\n');
function patch(mat){
  if (!mat || mat.userData.sk5) return;
  mat.userData.sk5 = true;
  var prev = mat.onBeforeCompile;
  mat.onBeforeCompile = function(sh, r){
    if (prev) prev(sh, r);
    sh.uniforms.uSkCar = U.uSkCar; sh.uniforms.uSkCam = U.uSkCam; sh.uniforms.uSkHole = U.uSkHole; sh.uniforms.uSkFlat = U.uSkFlat;
    sh.vertexShader = 'uniform float uSkFlat;\nvarying vec3 vSkW;\n' + sh.vertexShader.replace('#include <project_vertex>', VERT);
    sh.fragmentShader = 'uniform vec3 uSkCar;\nuniform vec3 uSkCam;\nuniform float uSkHole;\nvarying vec3 vSkW;\n' +
      sh.fragmentShader.replace(/void main\(\)\s*\{/, 'void main() {\n' + FRAG);
  };
  mat.customProgramCacheKey = function(){ return 'sk5' + (mat.type || ''); };
  mat.needsUpdate = true;
}

// ============================================================== al construir la ciudad
var W = { scene: null, lk: null, spot: null, road: [], pave: [], sun: null, hemi: null, base: null, signals: null };
var prevCity = SK.onCity3d;
SK.onCity3d = function(o){
  if (prevCity) try { prevCity(o); } catch(e){}
  W.scene = o.scene; W.lk = o.lk; W.sun = o.sun; W.hemi = o.hemi; W.road = []; W.pave = [];
  W.base = { fog: o.scene.fog ? [o.scene.fog.color.clone(), o.scene.fog.near, o.scene.fog.far] : null, bg: o.scene.background ? o.scene.background.clone() : null,
             sunI: o.sun ? o.sun.intensity : 1, hemiI: o.hemi ? o.hemi.intensity : 1 };
  o.city.traverse(function(m){
    if (m.userData.road) W.road.push(m);
    if (m.userData.pave) W.pave.push(m);
  });
  o.city.children.forEach(function(ch){
    if (!ch.userData.bld) return;
    ch.traverse(function(m){ if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach(function(mt){
      patch(mt);
      // ventanas encendidas de noche: luz cálida, no focos blancos
      if (mt.emissiveMap && (o.lk.night || o.lk.dusk)){ mt.emissiveIntensity = o.lk.night ? 0.55 : 0.4; mt.emissive = new THREE.Color(0xFFD9A0); }
    }); });
  });
  // faros de verdad por la noche (una sola luz, sin sombras)
  W.spot = null;
  if (o.lk.night || S.weather && S.weather.rain > 0.3){
    var sp = new THREE.SpotLight(0xFFF0D6, o.lk.night ? 2.4 : 1.2, 70, 0.5, 0.55, 1.2);
    sp.castShadow = !MOBILE && (!SK.getGfx || SK.getGfx() === 'alto');
    if (sp.castShadow){ sp.shadow.mapSize.set(1024, 1024); sp.shadow.camera.near = 1; sp.shadow.camera.far = 70; sp.shadow.bias = -0.0008; }
    o.scene.add(sp); o.scene.add(sp.target); W.spot = sp;
  }
  // farolas que iluminan de verdad (las 6 más cercanas al coche)
  W.lampL = [];
  if (o.lk.night){
    for (var li = 0; li < (MOBILE ? 3 : 6); li++){ var pl = new THREE.PointLight(0xFFC98A, 1.5, 26, 1.6); pl.position.set(0, -50, 0); o.scene.add(pl); W.lampL.push(pl); }
  }
  buildSignals(o.scene, o.lk);
  skid.mesh = null; buildSkids(o.scene);
  sparks.pts = null; buildSparks(o.scene);
  rain.mesh = null; buildRain(o.scene);
  puddles.mesh = null; refl.list = [];
  arrow.mesh = null; buildArrow(o.scene);
  ret.mesh = null; ret.for = -1;
  flame.spr = null;
  wet.applied = -1;
};

// ============================================================== semáforos de OpenStreetMap
function buildSignals(scene, lk){
  W.signals = null;
  var D = S.decor, G = S.G, R = S.circuit;
  if (!D || !D.signals || !D.signals.length || !G || !R) return;
  var list = [];
  for (var i = 0; i < D.signals.length / 2 && list.length < (MOBILE ? 40 : 90); i++){
    var x = D.signals[i*2], y = D.signals[i*2+1];
    // solo cerca del recorrido (lo demás no se ve)
    var near = false;
    for (var k = 0; k < R.P.length / 2; k += 3){ var dx = R.P[k*2] - x, dy = R.P[k*2+1] - y; if (dx*dx + dy*dy < 160*160){ near = true; break; } }
    if (!near) continue;
    // la calle más cercana: el semáforo va en la acera derecha, mirando al tráfico
    var best = null, bd = 1e9, C = G.CELL, gx = Math.floor(x / C), gy = Math.floor(y / C);
    for (var a = gx - 1; a <= gx + 1; a++) for (var b = gy - 1; b <= gy + 1; b++){
      var arr = G.grid.get(a*100000 + b); if (!arr) continue;
      for (var q = 0; q < arr.length; q++){
        var g = G.segs[arr[q]], ex = g[2]-g[0], ey = g[3]-g[1], ee = ex*ex + ey*ey, t = ee ? ((x-g[0])*ex + (y-g[1])*ey) / ee : 0;
        t = Math.max(0, Math.min(1, t));
        var d = Math.hypot(g[0] + ex*t - x, g[1] + ey*t - y);
        if (d < bd){ bd = d; best = g; }
      }
    }
    if (!best || bd > 12) continue;
    var ux = best[2]-best[0], uy = best[3]-best[1], L = Math.hypot(ux, uy) || 1; ux /= L; uy /= L;
    var half = A.HALF[best[4]] + 0.7;
    list.push([x - uy * half, y + ux * half, Math.atan2(uy, ux), (Math.abs((x * 13.1 + y * 7.7) | 0) % 24)]);
  }
  if (!list.length) return;
  var n = list.length;
  var poleG = new THREE.CylinderGeometry(0.07, 0.09, 3.6, 6); poleG.translate(0, 1.8, 0);
  var headG = new THREE.BoxGeometry(0.34, 1.0, 0.3); headG.translate(0, 3.45, 0);
  var lampG = new THREE.SphereGeometry(0.1, 8, 6);
  var poles = new THREE.InstancedMesh(poleG, new THREE.MeshLambertMaterial({ color: 0x2B3036 }), n);
  var heads = new THREE.InstancedMesh(headG, new THREE.MeshLambertMaterial({ color: 0x181B1F }), n);
  var lamps = [0, 1, 2].map(function(){ var m = new THREE.InstancedMesh(lampG, new THREE.MeshBasicMaterial({ color: 0xFFFFFF, toneMapped: false }), n); m.instanceMatrix.setUsage(THREE.StaticDrawUsage); return m; });
  var m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), ax = new THREE.Vector3(0, 1, 0), p3 = new THREE.Vector3(), s3 = new THREE.Vector3(1, 1, 1), off = new THREE.Vector3();
  list.forEach(function(it, i){
    q4.setFromAxisAngle(ax, it[2] + Math.PI / 2);
    m4.compose(p3.set(it[0], 0.15, -it[1]), q4, s3); poles.setMatrixAt(i, m4); heads.setMatrixAt(i, m4);
    for (var c = 0; c < 3; c++){
      off.set(0, 3.77 - c * 0.31, 0.17).applyQuaternion(q4);
      m4.compose(p3.set(it[0] + off.x, 0.15 + off.y, -it[1] + off.z), q4, s3); lamps[c].setMatrixAt(i, m4);
    }
  });
  [poles, heads].forEach(function(m){ m.castShadow = true; scene.add(m); });
  lamps.forEach(function(m){ scene.add(m); });
  W.signals = { list: list, lamps: lamps, last: -1 };
  paintSignals(true);
}
var ON = [new THREE.Color(3.2, 0.25, 0.2), new THREE.Color(3.0, 1.9, 0.2), new THREE.Color(0.3, 2.8, 0.9)];
var OFF = [new THREE.Color(0.18, 0.03, 0.03), new THREE.Color(0.17, 0.12, 0.02), new THREE.Color(0.02, 0.14, 0.06)];
function sigState(it, t){ var ph = (t + it[3]) % 24; return ph < 10 ? 2 : ph < 13 ? 1 : 0; }
// ¿hay un semáforo delante de este coche? (x, y, dirección ux, uy): estado y distancia
SK.signalAhead = function(x, y, ux, uy){
  var sg = W.signals; if (!sg) return null;
  var t = performance.now() / 1000, best = null;
  for (var i = 0; i < sg.list.length; i++){
    var it = sg.list[i], dx = it[0] - x, dy = it[1] - y, along = dx * ux + dy * uy;
    if (along < 1 || along > 22) continue;
    var side = Math.abs(dx * uy - dy * ux); if (side > 9) continue;
    // solo los que miran a este sentido de la calle
    if (Math.cos(it[2]) * ux + Math.sin(it[2]) * uy < 0.5 && Math.cos(it[2]) * ux + Math.sin(it[2]) * uy > -0.5) continue;
    if (!best || along < best.d) best = { d: along, state: sigState(it, t) };
  }
  return best;
};
function paintSignals(force){
  var sg = W.signals; if (!sg) return;
  var sec = Math.floor(performance.now() / 500);
  if (!force && sec === sg.last) return; sg.last = sec;
  var t = performance.now() / 1000;
  sg.list.forEach(function(it, i){
    var st = sigState(it, t);     // verde 10 s, ámbar 3 s, rojo 11 s
    for (var c = 0; c < 3; c++) sg.lamps[c].setColorAt(i, c === st ? ON[c] : OFF[c]);
  });
  sg.lamps.forEach(function(m){ if (m.instanceColor) m.instanceColor.needsUpdate = true; });
}

// ============================================================== marcas de neumático
var skid = { mesh: null, n: 0, max: 1600, last: null, pos: null };
function buildSkids(scene){
  var g = new THREE.BufferGeometry(), pos = new Float32Array(skid.max * 6 * 3);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setDrawRange(0, 0);
  var m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x0A0A0A, transparent: true, opacity: 0.42, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.frustumCulled = false; m.renderOrder = 2; scene.add(m);
  skid.mesh = m; skid.pos = pos; skid.n = 0; skid.last = null;
}
function addSkid(ax, ay, bx, by, w){
  var dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy); if (L < 0.05) return;
  var nx = -dy / L * w, ny = dx / L * w, i = (skid.n % skid.max) * 18, p = skid.pos, y = 0.04;
  var v = [ax+nx, y, -(ay+ny), bx+nx, y, -(by+ny), bx-nx, y, -(by-ny), ax+nx, y, -(ay+ny), bx-nx, y, -(by-ny), ax-nx, y, -(ay-ny)];
  for (var k = 0; k < 18; k++) p[i + k] = v[k];
  skid.n++;
  var g = skid.mesh.geometry; g.setDrawRange(0, Math.min(skid.n, skid.max) * 6); g.attributes.position.needsUpdate = true;
}
function stepSkids(car){
  if (!skid.mesh) return;
  var hard = S.phase === 'run' && car.speed > 7 && (Math.abs(car.vl || 0) > 2.6 || (S.thrOut < -0.75 && car.speed > 16) || (S.hbOut && car.speed > 6));
  var cx = Math.cos(car.h), cy = Math.sin(car.h), wheels = [];
  for (var s = -1; s <= 1; s += 2) wheels.push([car.x - cx * 1.35 - cy * 0.78 * s, car.y - cy * 1.35 + cx * 0.78 * s]);
  if (hard && !car.off && !car.kerb){
    if (skid.last){ for (var i = 0; i < 2; i++) addSkid(skid.last[i][0], skid.last[i][1], wheels[i][0], wheels[i][1], 0.13); }
    skid.last = wheels;
  } else skid.last = null;
}

// ============================================================== chispas y agua
var sparks = { pts: null, n: 160, p: null, v: null, life: null, col: null, lastHit: 0 };
function buildSparks(scene){
  var g = new THREE.BufferGeometry(), N = sparks.n;
  sparks.p = new Float32Array(N * 3); sparks.v = new Float32Array(N * 3); sparks.life = new Float32Array(N); sparks.col = new Float32Array(N * 3);
  for (var i = 0; i < N; i++) sparks.p[i*3+1] = -50;
  g.setAttribute('position', new THREE.BufferAttribute(sparks.p, 3));
  g.setAttribute('color', new THREE.BufferAttribute(sparks.col, 3));
  var m = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.16, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  m.frustumCulled = false; scene.add(m); sparks.pts = m;
}
var spI = 0;
function emit(x, y, z, vx, vy, vz, life, r, g, b){
  var i = spI++ % sparks.n;
  sparks.p[i*3] = x; sparks.p[i*3+1] = y; sparks.p[i*3+2] = z;
  sparks.v[i*3] = vx; sparks.v[i*3+1] = vy; sparks.v[i*3+2] = vz; sparks.life[i] = life;
  sparks.col[i*3] = r; sparks.col[i*3+1] = g; sparks.col[i*3+2] = b;
}
function stepSparks(dt, car){
  if (!sparks.pts) return;
  var h = S.hit;
  if (h && h.t !== sparks.lastHit){
    sparks.lastHit = h.t;
    var n = Math.min(40, Math.round(h.mag * 3));
    for (var k = 0; k < n; k++){
      var sp = 3 + Math.random() * 7, a = Math.random() * 6.283;
      emit(h.x, 0.4 + Math.random() * 0.5, -h.y, h.nx * sp + Math.cos(a) * 3, 1.5 + Math.random() * 4, -(h.ny * sp + Math.sin(a) * 3), 0.35 + Math.random() * 0.4,
           h.kind === 1 ? 3.0 : 2.2, h.kind === 1 ? 1.9 : 2.2, h.kind === 1 ? 0.6 : 2.4);
    }
  }
  // roce contra la pared: chispas continuas
  if (S.scrape && performance.now() - S.scrape.t < 60 && S.scrape.v > 4 && Math.random() < 0.8)
    emit(car.x, 0.35, -car.y, (Math.random() - 0.5) * 3, 1 + Math.random() * 2, (Math.random() - 0.5) * 3, 0.3, 3, 1.8, 0.5);
  // agua que levantan las ruedas con lluvia
  if (S.weather && S.weather.rain > 0.3 && car.speed > 8 && !S.weather.snow){
    var cx = Math.cos(car.h), cy = Math.sin(car.h);
    for (var w = 0; w < 2; w++){
      var s = w ? 1 : -1;
      emit(car.x - cx * 1.5 - cy * 0.8 * s, 0.2, -(car.y - cy * 1.5 + cx * 0.8 * s), -cx * car.speed * 0.25 + (Math.random() - 0.5), 1 + Math.random() * 1.5, (cy * car.speed * 0.25) + (Math.random() - 0.5), 0.45, 0.55, 0.6, 0.66);
    }
  }
  // humo del motor si el coche está muy tocado
  if (S.damage > 45 && Math.random() < S.damage / 160){
    var hx = Math.cos(car.h), hy = Math.sin(car.h);
    emit(car.x + hx * 1.7, 0.9, -(car.y + hy * 1.7), (Math.random() - 0.5) * 0.6, 1.4 + Math.random(), (Math.random() - 0.5) * 0.6, 0.9, 0.28, 0.28, 0.3);
  }
  var P = sparks.p, V = sparks.v, Lf = sparks.life;
  for (var i = 0; i < sparks.n; i++){
    if (Lf[i] <= 0){ P[i*3+1] = -50; continue; }
    Lf[i] -= dt; V[i*3+1] -= (sparks.col[i*3] < 0.4 ? -1 : 14) * dt;
    P[i*3] += V[i*3] * dt; P[i*3+1] += V[i*3+1] * dt; P[i*3+2] += V[i*3+2] * dt;
    if (P[i*3+1] < 0.05){ P[i*3+1] = 0.05; V[i*3+1] *= -0.3; V[i*3] *= 0.6; V[i*3+2] *= 0.6; }
  }
  sparks.pts.geometry.attributes.position.needsUpdate = true; sparks.pts.geometry.attributes.color.needsUpdate = true;
}

// ============================================================== lluvia / nieve
var rain = { mesh: null, n: MOBILE ? 900 : 2200, p: null, snow: false };
function buildRain(scene){
  var N = rain.n, g = new THREE.BufferGeometry(); rain.p = new Float32Array(N * 6);
  for (var i = 0; i < N; i++){ var x = (Math.random() - 0.5) * 70, y = Math.random() * 26, z = (Math.random() - 0.5) * 70; rain.p.set([x, y, z, x, y - 0.6, z], i * 6); }
  g.setAttribute('position', new THREE.BufferAttribute(rain.p, 3));
  var m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xB8C6D4, transparent: true, opacity: 0.38, depthWrite: false }));
  m.frustumCulled = false; m.visible = false; scene.add(m); rain.mesh = m;
}
function stepRain(dt, cam){
  var wx = S.weather, on = wx && wx.rain > 0.12;
  if (!rain.mesh) return;
  rain.mesh.visible = !!on; if (!on) return;
  var snow = !!wx.snow, fall = snow ? 2.2 : 24, len = snow ? 0.08 : 0.55 + wx.rain * 0.4, wind = (wx.wind || 3) * 0.25;
  rain.mesh.material.opacity = snow ? 0.9 : 0.18 + wx.rain * 0.3;
  rain.mesh.material.color.set(snow ? 0xFFFFFF : 0xB8C6D4);
  var P = rain.p, cx = cam.position.x, cz = cam.position.z, cnt = Math.round(rain.n * Math.min(1, 0.25 + wx.rain));
  for (var i = 0; i < rain.n; i++){
    var o = i * 6;
    if (i >= cnt){ P[o+1] = -80; P[o+4] = -81; continue; }
    var y = P[o+1] - fall * dt, x = P[o] + wind * dt + (snow ? Math.sin(y + i) * 0.02 : 0), z = P[o+2];
    if (y < 0 || x - cx > 35 || x - cx < -35 || z - cz > 35 || z - cz < -35){
      x = cx + (Math.random() - 0.5) * 70; z = cz + (Math.random() - 0.5) * 70; y = 14 + Math.random() * 14;
    }
    P[o] = x; P[o+1] = y; P[o+2] = z; P[o+3] = x - wind * 0.03; P[o+4] = y + len; P[o+5] = z;
  }
  rain.mesh.geometry.attributes.position.needsUpdate = true;
}
// asfalto mojado: más oscuro y con brillos (Phong) mientras llueve
var wet = { applied: -1, orig: new Map() };
function stepWet(o){
  var w = S.weather && S.weather.rain > 0.3 && !S.weather.snow ? 1 : 0;
  var snow = S.weather && S.weather.snow && S.weather.rain > 0.3 ? 1 : 0;
  var night = W.lk && W.lk.night ? 1 : 0;
  // de noche el asfalto se ilumina por píxel: los faros dibujan su haz de verdad (y el charco falso se apaga)
  if (o && o.beam) o.beam.visible = !!(W.lk && W.lk.night) && !W.spot;
  var key = w + snow * 2 + night * 4 + (S.dawn ? 8 : 0);
  if (key === wet.applied) return; wet.applied = key;
  W.road.concat(W.pave).forEach(function(m){
    if (!wet.orig.has(m.uuid)) wet.orig.set(m.uuid, m.material);
    var o2 = wet.orig.get(m.uuid);
    if (key === 0){ m.material = o2; return; }
    var isRoad = !!m.userData.road, dry = !w && !snow;
    var col = snow ? (isRoad ? 0xCFD6DC : 0xF2F5F7) : dry ? 0xFFFFFF : (isRoad ? 0x8A9098 : 0xA4A9B0);
    // conserva el color de cada vértice (el asfalto y las aceras lo llevan) y el tono base del material
    var base = (o2.color ? o2.color.clone() : new THREE.Color(0xFFFFFF)).multiply(new THREE.Color(col));
    if (snow) base = new THREE.Color(col);
    var nm = new THREE.MeshPhongMaterial({ map: o2.map, color: base, vertexColors: !!o2.vertexColors && !snow, side: o2.side,
      specular: snow ? 0x222222 : dry ? 0x0A0A0A : new THREE.Color(isRoad ? 0x5A6470 : 0x2E3438), shininess: snow ? 8 : dry ? 6 : (isRoad ? 90 : 40),
      polygonOffset: o2.polygonOffset, polygonOffsetFactor: o2.polygonOffsetFactor, polygonOffsetUnits: o2.polygonOffsetUnits });
    m.material = nm;
  });
  // cielo y luz más grises con lluvia
  var B = W.base; if (!B || !W.scene) return;
  var k = (w || snow) ? 1 : 0;
  if (W.sun) W.sun.intensity = B.sunI * (k ? 0.45 : 1);
  if (W.hemi) W.hemi.intensity = B.hemiI * (k ? 0.9 : 1);
  var dawn = S.dawn ? 1 : 0;
  if (W.scene.fog && B.fog && dawn && !k){
    // niebla de amanecer: baja, lechosa y cálida
    W.scene.fog.color.copy(B.fog[0]).lerp(new THREE.Color(0xD8C8B8), 0.55); W.scene.fog.near = B.fog[1] * 0.35; W.scene.fog.far = B.fog[2] * 0.45; return;
  }
  if (W.scene.fog && B.fog){
    var grey = new THREE.Color(snow ? 0xC9D0D6 : 0x8E969E);
    W.scene.fog.color.copy(B.fog[0]).lerp(grey, k ? 0.6 : 0); W.scene.fog.near = B.fog[1] * (k ? 0.5 : 1); W.scene.fog.far = B.fog[2] * (k ? 0.6 : 1);
  }
  if (B.bg && W.scene.background && W.scene.background.isColor){ W.scene.background.copy(B.bg).lerp(new THREE.Color(snow ? 0xC9D0D6 : 0x8E969E), k ? 0.55 : 0); }
}

// ============================================================== charcos y reflejos de luces en el asfalto mojado
var puddles = { mesh: null, on: false };
function stepPuddles(o){
  var wetNow = S.weather && S.weather.rain > 0.3 && !S.weather.snow, R = S.circuit;
  if (wetNow && !puddles.mesh && R && W.scene){
    var n = MOBILE ? 30 : 70, g = new THREE.CircleGeometry(1, 20); g.rotateX(-Math.PI / 2);
    var m = new THREE.InstancedMesh(g, new THREE.MeshPhongMaterial({ color: 0x0E1216, specular: 0xB8C4D0, shininess: 180, transparent: true, opacity: 0.85, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), n);
    var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), ax = new THREE.Vector3(0, 1, 0), p3 = new THREE.Vector3(), s3 = new THREE.Vector3();
    for (var i = 0; i < n; i++){
      var d = Math.random() * R.total, p = A.pointAt(R, d), lat = (Math.random() - 0.5) * 6;
      q.setFromAxisAngle(ax, p.h + Math.random()); m4.compose(p3.set(p.x - Math.sin(p.h) * lat, 0.035, -(p.y + Math.cos(p.h) * lat)), q, s3.set(0.7 + Math.random() * 1.6, 1, 0.4 + Math.random() * 0.9));
      m.setMatrixAt(i, m4);
    }
    m.renderOrder = 2; W.scene.add(m); puddles.mesh = m;
  }
  if (puddles.mesh) puddles.mesh.visible = !!wetNow;
}
// reflejos alargados de farolas y semáforos sobre el suelo mojado (como en las calles de verdad)
var refl = { list: [], tex: null };
function stepRefl(o){
  var wetNow = S.weather && S.weather.rain > 0.3 && !S.weather.snow && W.lampL && W.lampL.length;
  if (!refl.tex){
    var c = document.createElement('canvas'); c.width = 32; c.height = 128; var g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.35, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 32, 128); var g2 = g.createLinearGradient(0, 0, 32, 0); refl.tex = new THREE.CanvasTexture(c);
  }
  if (!wetNow){ refl.list.forEach(function(m){ m.visible = false; }); return; }
  while (refl.list.length < W.lampL.length){
    var m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 7), new THREE.MeshBasicMaterial({ map: refl.tex, color: new THREE.Color(1.6, 1.1, 0.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 4; W.scene.add(m); refl.list.push(m);
  }
  var cam = o.cam.position;
  W.lampL.forEach(function(pl, i){
    var m = refl.list[i]; if (pl.position.y < 0){ m.visible = false; return; }
    var dx = pl.position.x - cam.x, dz = pl.position.z - cam.z, a = Math.atan2(dx, dz);
    m.position.set(pl.position.x - Math.sin(a) * 3.2, 0.04, pl.position.z - Math.cos(a) * 3.2);
    m.rotation.set(-Math.PI / 2, 0, -a); m.visible = true;
  });
}

// ============================================================== fuera del trazado: la ciudad se hunde, carril y flecha para volver
var arrow = { mesh: null };
function buildArrow(scene){
  var sh = new THREE.Shape();
  sh.moveTo(0, 1.6); sh.lineTo(1.2, 0.2); sh.lineTo(0.45, 0.2); sh.lineTo(0.45, -1.3); sh.lineTo(-0.45, -1.3); sh.lineTo(-0.45, 0.2); sh.lineTo(-1.2, 0.2); sh.closePath();
  var g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2);
  var m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color(3.0, 1.2, 0.5), transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  m.renderOrder = 20; m.frustumCulled = false; scene.add(m); arrow.mesh = m;
}
var ret = { mesh: null, for: -1 };
function buildReturn(scene, R, p0){
  if (ret.mesh){ scene.remove(ret.mesh); ret.mesh.geometry.dispose(); ret.mesh = null; }
  var pos = [], w = 1.1, y = 0.25;
  for (var d = Math.max(0, p0 - 40); d < Math.min(R.total, p0 + 320); d += 3){
    var a = A.pointAt(R, d), b = A.pointAt(R, Math.min(R.total, d + 3));
    var nx = -Math.sin(a.h) * w, ny = Math.cos(a.h) * w, mx = -Math.sin(b.h) * w, my = Math.cos(b.h) * w;
    pos.push(a.x+nx, y, -(a.y+ny), b.x+mx, y, -(b.y+my), b.x-mx, y, -(b.y-my), a.x+nx, y, -(a.y+ny), b.x-mx, y, -(b.y-my), a.x-nx, y, -(a.y-ny));
  }
  var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  var m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 0.9, 0.35), transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false }));
  m.renderOrder = 19; m.frustumCulled = false; scene.add(m); ret.mesh = m; ret.for = p0;
}
var offLvl = 0;
function stepOffTrack(dt, car, o){
  var R = S.circuit; if (!R) return;
  var lat = S.lateral || 0, running = S.phase === 'run' && !S.mode;
  var want = running && (lat > 22 || car.rw) ? 1 : (lat < 14 || !running ? 0 : offLvl > 0.5 ? 1 : 0);
  offLvl += (want - offLvl) * Math.min(1, dt * (want > offLvl ? 2.4 : 3.2));
  if (offLvl < 0.002) offLvl = 0;
  U.uSkFlat.value = offLvl;
  S.offTrack = offLvl;
  if (o.sun) o.sun.castShadow = offLvl < 0.3 && (!SK.getGfx || SK.getGfx() !== 'bajo');
  // flecha sobre el coche que apunta al trazado
  var show = running && (lat > 12 || car.rw);
  var target = A.pointAt(R, Math.min(R.total, car.prog + 12));
  if (arrow.mesh){
    var aOp = show ? Math.min(0.95, (lat - 10) / 10) : 0;
    arrow.mesh.material.opacity += (aOp - arrow.mesh.material.opacity) * Math.min(1, dt * 6);
    var ang = Math.atan2(target.y - car.y, target.x - car.x);
    arrow.mesh.position.set(car.x, 3.4 + Math.sin(performance.now() / 260) * 0.18, -car.y);
    arrow.mesh.rotation.set(0, ang - Math.PI / 2, 0);
    arrow.mesh.visible = arrow.mesh.material.opacity > 0.02;
  }
  if (offLvl > 0.05){
    if (!ret.mesh || Math.abs(ret.for - car.prog) > 60) buildReturn(o.scene, R, car.prog);
    ret.mesh.material.opacity = Math.min(0.85, offLvl);
    ret.mesh.visible = true;
  } else if (ret.mesh) ret.mesh.visible = false;
}

// ============================================================== llamarada del escape
var flame = { spr: null };
function stepFlame(car, carGrp){
  if (!flame.spr){
    var c = document.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    gr.addColorStop(0, 'rgba(255,255,230,1)'); gr.addColorStop(0.3, 'rgba(255,170,60,.9)'); gr.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    flame.spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    W.scene.add(flame.spr);
  }
  var age = S.popT ? performance.now() - S.popT : 9999, on = age < 110;
  flame.spr.visible = on;
  if (on){
    var cx = Math.cos(car.h), cy = Math.sin(car.h), s = 0.5 + Math.random() * 0.5;
    flame.spr.position.set(car.x - cx * 2.35 + cy * 0.45, 0.42, -(car.y - cy * 2.35 - cx * 0.45));
    flame.spr.scale.set(s, s, 1);
  }
}

// ============================================================== cada fotograma
var prevFrame = SK.frame3d;
SK.frame3d = function(dt, o){
  if (prevFrame) try { prevFrame(dt, o); } catch(e){}
  var car = o.car;
  U.uSkCar.value.set(car.x, 1.1, -car.y);
  U.uSkCam.value.copy(o.cam.position);
  U.uSkHole.value = S.view === 'hood' ? 0 : 1;
  stepOffTrack(dt, car, o);
  stepSkids(car);
  stepSparks(dt, car);
  stepRain(dt, o.cam);
  stepWet(o);
  try { stepPuddles(o); stepRefl(o); } catch(e){}
  paintSignals(false);
  if (W.lampL && W.lampL.length && SK.lampsXY){
    var now = performance.now();
    if (!W.lampT || now - W.lampT > 400){
      W.lampT = now;
      var LP = SK.lampsXY(), best = [];
      if (LP) for (var q = 0; q < LP.length; q += 2){
        var dx = LP[q] - car.x, dy = LP[q+1] - car.y, d2 = dx*dx + dy*dy;
        if (d2 < 90*90) best.push([d2, LP[q], LP[q+1]]);
      }
      best.sort(function(a, b){ return a[0] - b[0]; });
      W.lampL.forEach(function(pl, i){ var b = best[i]; if (b) pl.position.set(b[1], 5.4, -b[2]); else pl.position.set(0, -50, 0); });
    }
  }
  if (W.spot){
    var cx = Math.cos(car.h), cy = Math.sin(car.h);
    W.spot.position.set(car.x + cx * 1.8, 1.0, -(car.y + cy * 1.8));
    W.spot.target.position.set(car.x + cx * 26, 0, -(car.y + cy * 26));
    W.spot.target.updateMatrixWorld();
  }
  try { stepFlame(car, o.carGrp); } catch(e){}
};
})();
