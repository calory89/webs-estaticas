/* King of Streets v7 — modos de juego en calles reales.
   🚓 Persecución: tres patrullas te persiguen por el callejero real; llega al escondite o te pillan.
   🚕 Taxi: recoge pasajeros y llévalos a su destino antes de que se enfaden (turno de 3 min).
   📦 Reparto: tres entregas contra reloj, cada una con su plazo.
   💨 Drift: puntos por derrapar en el circuito elegido (derrape × velocidad × combo).
   🌙 Monumentos de noche: recorre los monumentos de la ciudad con la ciudad iluminada.
   Ningún modo sube tiempos ni gana coronas: son para jugar. */
(function(){
'use strict';
var A = window.SK && SK.api; if (!A) return;
var S = A.S, $ = A.$, esc = A.esc, fmt = A.fmt, toast = A.toast;
function el(html){ var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
function wrap(a){ return Math.atan2(Math.sin(a), Math.cos(a)); }
function rnd(a, b){ return a + Math.random() * (b - a); }

var css = `
.modes{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}
.modes button{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:9px 6px;color:var(--fg);text-align:left;display:flex;flex-direction:column;gap:2px}
.modes button b{font:700 14px var(--cond);letter-spacing:.04em} .modes button small{font-size:10.5px;color:var(--muted);line-height:1.2}
.modes button.on{border-color:var(--trace);background:var(--surface2)}
#modeHud{position:absolute;left:50%;top:128px;transform:translateX(-50%);z-index:12;display:none;background:rgba(10,14,19,.86);border:1px solid var(--line);border-radius:10px;padding:6px 14px;text-align:center;min-width:180px;pointer-events:none}
#modeHud.on{display:block} #modeHud b{display:block;font:700 20px var(--cond);letter-spacing:.06em;color:#fff} #modeHud span{font:600 12px var(--mono);color:var(--muted)}
#modeHud.warn b{color:#FF6B6B} #modeHud .stars{color:#FFD84A;letter-spacing:.2em;font-size:16px}
body.land #modeHud{top:96px}
#modeRes .card{width:min(440px,100%)} #modeRes .big{font:700 46px var(--mono);padding:10px 22px 0} #modeRes .inner{padding:8px 22px 16px;color:var(--muted);font-size:14px}
`;
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
var hud = el('<div id="modeHud"><b></b><span class="sub"></span></div>'); $('stage').appendChild(hud);
var res = el('<div class="overlay" id="modeRes"><div class="card"><header><div class="lab" id="mrLab"></div><h2 id="mrTitle"></h2></header><div class="big" id="mrBig"></div><div class="inner" id="mrTxt"></div>' +
  '<footer><button type="button" class="btn" id="mrAgain">Otra vez</button><button type="button" class="btn ghost" id="mrOut">Volver a las carreras</button></footer></div></div>');
$('stage').appendChild(res);

// ============================================================== panel de modos
var MODES = [
  ['cops', '🚓 Persecución', 'Escapa de la policía hasta el escondite'],
  ['taxi', '🚕 Taxi', '3 minutos, todos los clientes que puedas'],
  ['deliver', '📦 Reparto', '3 entregas contra reloj'],
  ['drift', '💨 Drift', 'Puntos por derrapar en este circuito'],
  ['monu', '🌙 Monumentos', 'La ciudad de noche, monumento a monumento']
];
var block = el('<div class="block"><div class="eyebrow">Modos de juego · no cuentan para coronas</div><div class="modes" id="modesBox">' +
  MODES.map(function(m){ return '<button type="button" data-m="' + m[0] + '"><b>' + m[1] + '</b><small>' + m[2] + '</small></button>'; }).join('') + '</div></div>');
var races = $('races') && $('races').closest('.block');
if (races) races.parentNode.insertBefore(block, races.nextSibling);
block.querySelectorAll('button').forEach(function(b){ b.onclick = function(){ start(b.dataset.m); document.body.classList.remove('menu'); }; });

// ============================================================== utilidades del callejero
function carNode(){ var c = S.car; var p = [c.x, c.y]; return A.snap(S.G, p[0], p[1]); }
function nodeAtDist(from, dmin, dmax){
  var G = S.G, cand = [];
  for (var n = 0; n < G.X.length; n += 2){
    if (G.comp && G.comp[n] !== G.main) continue;
    var d = Math.hypot(G.X[n] - G.X[from], G.Y[n] - G.Y[from]);
    if (d > dmin && d < dmax) cand.push(n);
  }
  return cand.length ? cand[(Math.random() * cand.length) | 0] : -1;
}
function legTo(fromNode, toNode, title){
  var G = S.G, path = SK.dbg.route(G, fromNode, toNode); if (!path || path.length < 3) return false;
  var c = SK.dbg.makeCircuit(G, path, {}); if (!c || c.total < 60) return false;
  M.leg++;
  S.circuit = c; S.routeId = 'm_' + M.id + '_' + M.leg + '_' + Date.now().toString(36); S.routeTitle = title;
  S.car.prog = 0; S.sectorTimes = []; S.curSector = -1; S.ghost = null; S.ghosts = []; S.ghostRec = null;
  M.end = [G.X[toNode], G.Y[toNode]];
  return true;
}
function firstLeg(toNode, title){
  var a = A.toLatLon(S.car ? S.car.x : 0, S.car ? S.car.y : 0), G = S.G;
  var from = S.car ? carNode() : -1;
  if (from < 0){ var c = (A.CITIES[S.cityId] || {}).c, pc = A.proj(c); from = A.snap(G, pc[0], pc[1]); }
  var aLL = A.toLatLon(G.X[from], G.Y[from]), bLL = A.toLatLon(G.X[toNode], G.Y[toNode]);
  M.end = [G.X[toNode], G.Y[toNode]];
  return A.raceLatLon(aLL, bLL, title, 'm_' + M.id + '_0_' + Date.now().toString(36));
}

// ============================================================== estado del modo
var M = { id: null, leg: 0, t0: 0, score: 0, n: 0, data: {} };
S.mode = null;
function start(id){
  if (!S.G){ toast('Espera a que cargue la ciudad.', true); return; }
  stop(true);
  M = { id: id, leg: 0, score: 0, n: 0, data: {}, end: null };
  S.mode = id; S.casual = true;
  block.querySelectorAll('button').forEach(function(b){ b.classList.toggle('on', b.dataset.m === id); });
  if (SK.bots) SK.bots.clear();
  var from = S.car ? carNode() : -1; if (from < 0) from = 0;
  if (id === 'cops'){
    var safe = nodeAtDist(from, 1100, 1900); if (safe < 0){ stop(); return; }
    firstLeg(safe, '🚓 Escapa hasta el escondite').then(function(ok){ if (!ok) return stop(); spawnCops(); tipM('¡La policía te busca!', 'Llega al escondite 🏠 sin que te paren.'); });
  } else if (id === 'taxi'){
    var p = nodeAtDist(from, 250, 650); if (p < 0){ stop(); return; }
    M.data = { stage: 'pick', limit: 180000, fares: 0, cash: 0 };
    firstLeg(p, '🚕 Recoge a ' + pax()).then(function(ok){ if (!ok) stop(); else tipM('Turno de taxi', 'Recoge al cliente: sigue la línea y para a su lado.'); });
  } else if (id === 'deliver'){
    var d1 = nodeAtDist(from, 450, 900); if (d1 < 0){ stop(); return; }
    M.data = { drops: 0, total: 3 };
    firstLeg(d1, '📦 Entrega 1 de 3').then(function(ok){ if (!ok) stop(); else { M.deadline = null; tipM('Reparto', 'Tres paquetes, cada uno con su plazo. ¡Rápido!'); } });
  } else if (id === 'drift'){
    if (!S.circuit){ stop(); return; }
    M.data = { pts: 0, combo: 1, chain: 0, best: 0, quiet: 0 };
    S.routeId = 'm_drift_' + Date.now().toString(36); S.ghost = null;
    A.startCountdown(); tipM('Drift', 'Freno de mano (Shift o MANO) y gira: cuanto más cruzado y rápido, más puntos.');
  } else if (id === 'monu'){
    var list = monuments(); if (list.length < 3){ toast('Esta ciudad no tiene monumentos en el mapa todavía.', true); stop(); return; }
    M.data = { list: list, i: 0, prevSkin: S.skin };
    var nb = $('skinNight'); if (nb && S.skin !== 'night'){ M.data.forced = true; nb.click(); }
    firstLeg(list[0].node, '🌙 ' + list[0].n).then(function(ok){ if (!ok) stop(); else tipM('Monumentos de noche', list.length + ' monumentos. Disfruta la ciudad iluminada.'); });
  }
}
function stop(silent){
  if (M.data && M.data.forced){ var b = $(M.data.prevSkin === 'dusk' ? 'skinDusk' : 'skinDay'); if (b) b.click(); }
  clearCops();
  S.mode = null; M.id = null; hud.classList.remove('on');
  block.querySelectorAll('button').forEach(function(b){ b.classList.remove('on'); });
  if (!silent) res.classList.remove('on');
}
SK.modeStop = stop;
function tipM(t, s){ if (SK.tip) SK.tip(t, s, 5000); else toast('<b>' + esc(t) + '</b> ' + esc(s)); }
var NAMES = ['Laura', 'Manolo', 'Carmen', 'Javi', 'Lucía', 'Paco', 'Marta', 'Toni', 'Rocío', 'Andrés', 'Nerea', 'Julián'];
function pax(){ return NAMES[(Math.random() * NAMES.length) | 0]; }
function monuments(){
  var d = (window.SK_CITIES || []).filter(function(c){ return c.id === S.cityId; })[0], G = S.G, out = [], seen = {};
  if (!d || !G) return out;
  (d.r || []).forEach(function(r){ [r.a, r.b].forEach(function(p){
    if (seen[p.n] || /^(calle|avenida|av\.|paseo|carrer|rue|street|road)\b/i.test(p.n)) return; seen[p.n] = 1;
    var pp = A.proj(p.p), n = A.snap(G, pp[0], pp[1]); if (n < 0) return;
    if (Math.hypot(G.X[n] - pp[0], G.Y[n] - pp[1]) > 160) return;
    out.push({ n: p.n, node: n, x: G.X[n], y: G.Y[n] });
  }); });
  // tour del vecino más cercano desde el coche, 5 paradas como mucho
  var tour = [], cx = S.car ? S.car.x : 0, cy = S.car ? S.car.y : 0;
  while (out.length && tour.length < 5){
    out.sort(function(a, b){ return Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy); });
    var nx = out.shift(); if (Math.hypot(nx.x - cx, nx.y - cy) < 150 && tour.length === 0 && out.length) { continue; }
    tour.push(nx); cx = nx.x; cy = nx.y;
  }
  return tour;
}

// ============================================================== policía
var COPS = [], sirenT = 0;
function spawnCops(){
  clearCops();
  var G = S.G, from = carNode(), R = S.circuit;
  for (var i = 0; i < 3; i++){
    var n = nodeAtDist(from, 90 + i * 40, 170 + i * 50); if (n < 0) continue;
    COPS.push({ x: G.X[n], y: G.Y[n], h: 0, v: 0, node: n, path: null, pi: 0, t: 0, vmax: [41, 42.5, 40][i], stun: 0, grp: null, spin: 0, lights: 0 });
  }
  M.data = { busted: 0, heat: 1 };
}
function clearCops(){ COPS.forEach(function(c){ if (c.grp && c.grp.parent) c.grp.parent.remove(c.grp); }); COPS = []; }
function copStep(c, dt){
  var G = S.G, car = S.car;
  var dx = car.x - c.x, dy = car.y - c.y, dist = Math.hypot(dx, dy);
  c.t -= dt;
  if (c.t <= 0 && dist > 28){
    c.t = 1.1 + Math.random() * 0.4;
    var a = A.snap(G, c.x, c.y), b = carNode();
    var p = a >= 0 && b >= 0 ? SK.dbg.route(G, a, b) : null;
    c.path = p ? p.map(function(q){ return [G.X[q[0]], G.Y[q[0]]]; }) : null; c.pi = 1;
  }
  var tx, ty;
  if (dist < 28 || !c.path || c.pi >= c.path.length){ tx = car.x; ty = car.y; }
  else {
    var q = c.path[c.pi]; tx = q[0]; ty = q[1];
    if (Math.hypot(tx - c.x, ty - c.y) < 6){ c.pi++; if (c.path[c.pi]){ tx = c.path[c.pi][0]; ty = c.path[c.pi][1]; } }
  }
  var want = Math.atan2(ty - c.y, tx - c.x), turn = wrap(want - c.h);
  // curva por delante: frena lo que haga falta
  var target = c.vmax * (dist < 20 ? 0.85 : 1);
  if (c.path && c.pi + 1 < c.path.length){
    var n1 = c.path[c.pi], n2 = c.path[c.pi + 1];
    var a2 = Math.atan2(n2[1] - n1[1], n2[0] - n1[0]), bend = Math.abs(wrap(a2 - want)), dd = Math.hypot(n1[0] - c.x, n1[1] - c.y);
    if (bend > 0.4){ var vc = Math.max(8, 26 - bend * 9); target = Math.min(target, Math.sqrt(vc * vc + 2 * 20 * dd)); }
  }
  if (c.stun > 0){ c.stun -= dt; target = 0; }
  c.h += Math.max(-2.6 * dt, Math.min(2.6 * dt, turn)) * Math.min(1, c.v / 6 + 0.3);
  if (Math.abs(turn) > 1.2) target = Math.min(target, 9);
  c.v += (target > c.v ? 13 : -24) * dt; if (c.v < 0) c.v = 0; if (target > c.v && c.v > target) c.v = target;
  c.x += Math.cos(c.h) * c.v * dt; c.y += Math.sin(c.h) * c.v * dt;
  c.spin += c.v * dt / 0.36;
  return dist;
}
// los patrulleros son sólidos
var baseSolid = SK.solidCars;
SK.solidCars = function(){
  var L = baseSolid ? baseSolid() : [];
  if (!COPS.length) return L;
  var out = L.slice(); COPS.forEach(function(c, i){ out.push(c.x, c.y, c.h, 2000 + i); }); return out;
};
var baseBump = SK.bumpCar;
SK.bumpCar = function(id, ix, iy){ if (id >= 2000 && id < 3000){ var c = COPS[id - 2000]; if (c){ c.stun = 1.2; c.v *= 0.4; } return; } if (baseBump) baseBump(id, ix, iy); };

// ============================================================== cada fotograma
SK.pre.push(function(dt){
  if (!S.mode || !S.car) return;
  var car = S.car;
  // en los modos vale cualquier calle: se llega cuando estás cerca del destino
  if (S.phase === 'run' && M.end && S.circuit){
    var de = Math.hypot(car.x - M.end[0], car.y - M.end[1]);
    var needStop = M.id === 'taxi';
    if (de < 16 && (!needStop || car.speed < 4)) arrive();
  }
  if (S.phase !== 'run') return;
  var el2 = S.t;
  if (M.id === 'cops'){
    var near = 1e9, nearC = null;
    COPS.forEach(function(c){ var rest = Math.min(0.2, dt), d = 1e9; while (rest > 0){ var h = Math.min(0.05, rest); d = copStep(c, h); rest -= h; } if (d < near){ near = d; nearC = c; } });
    if (near < 6 && car.speed < 4) M.data.busted += dt; else M.data.busted = Math.max(0, M.data.busted - dt * 0.5);
    M.data.heat = near < 60 ? 3 : near < 180 ? 2 : 1;
    hudSet('🚓 ' + (near < 1e8 ? Math.round(near) + ' m' : ''), (M.data.busted > 0.2 ? '¡TE ESTÁN PARANDO! ' : '') + '🏠 ' + Math.round(Math.hypot(car.x - M.end[0], car.y - M.end[1])) + ' m', M.data.busted > 0.2, '★★★★★'.slice(0, M.data.heat + 2));
    siren(near, nearC);
    if (M.data.busted > 2.5) finishMode(false, 'Te han pillado', 'Las patrullas te han cerrado el paso.');
  } else if (M.id === 'taxi'){
    var left = M.data.limit - el2;
    hudSet('🚕 ' + fmt(Math.max(0, left)), (M.data.stage === 'pick' ? 'Recoge al cliente' : 'Lleva a tu cliente') + ' · ' + M.data.fares + ' carreras · ' + M.data.cash + ' €', left < 20000);
    if (left <= 0) finishMode(true, 'Fin del turno', M.data.fares + ' carreras y ' + M.data.cash + ' € de caja.');
  } else if (M.id === 'deliver'){
    if (M.deadline == null && S.circuit) M.deadline = el2 + (S.circuit.total / 11.5 + 10) * 1000;
    var l2 = M.deadline - el2;
    hudSet('📦 ' + fmt(Math.max(0, l2)), 'Entrega ' + (M.data.drops + 1) + ' de ' + M.data.total, l2 < 8000);
    if (l2 <= 0) finishMode(false, 'Paquete tarde', 'Entregaste ' + M.data.drops + ' de ' + M.data.total + '.');
  } else if (M.id === 'drift'){
    var D = M.data, cx = Math.cos(car.h), cy = Math.sin(car.h);
    var vx = cx * car.vf - cy * car.vl, vy = cy * car.vf + cx * car.vl, sp = Math.hypot(vx, vy);
    var slip = sp > 5 ? Math.abs(wrap(Math.atan2(vy, vx) - car.h)) : 0;
    if (slip > 0.2 && slip < 1.6 && sp > 8){ D.chain += sp * slip * 12 * dt * D.combo; D.quiet = 0; if (D.chain > 1500 * D.combo) D.combo = Math.min(8, D.combo + 1); }
    else { D.quiet += dt; if (D.quiet > 1.2 && D.chain){ D.pts += Math.round(D.chain); D.chain = 0; D.combo = 1; } }
    if (S.hit && S.hit.t > (D.lastHit || 0)){ D.lastHit = S.hit.t; if (D.chain){ D.chain = 0; D.combo = 1; toast('💥 Drift perdido por el golpe'); } }
    hudSet('💨 ' + (D.pts + Math.round(D.chain)).toLocaleString('es-ES'), D.chain ? 'x' + D.combo + ' · +' + Math.round(D.chain) : 'derrapa para sumar', false);
  } else if (M.id === 'monu'){
    hudSet('🌙 ' + (M.data.i + 1) + '/' + M.data.list.length, M.data.list[M.data.i].n, false);
  }
});
function hudSet(b, s, warn, stars){
  hud.querySelector('b').innerHTML = esc(b) + (stars ? ' <span class="stars">' + stars + '</span>' : '');
  hud.querySelector('.sub').textContent = s; hud.classList.add('on'); hud.classList.toggle('warn', !!warn);
}
function arrive(){
  var G = S.G, from = carNode();
  if (M.id === 'cops'){ finishMode(true, '¡Has escapado!', 'Llegaste al escondite en ' + fmt(S.t) + '.'); if (SK.stat) SK.stat('escapes'); return; }
  if (M.id === 'taxi'){
    if (M.data.stage === 'pick'){
      var dest = nodeAtDist(from, 600, 1400); if (dest < 0) return finishMode(true, 'Fin del turno', 'No hay más clientes por aquí.');
      M.data.stage = 'drop'; M.data.legStart = S.t;
      legTo(from, dest, '🚕 Lleva al cliente a ' + (A.nearestName(dest) || 'su destino'));
      M.data.expect = S.circuit.total / 10 * 1000;
      toast('🚕 Sube. "Lléveme a ' + esc(A.nearestName(dest) || 'mi casa') + ', por favor."');
    } else {
      var took = S.t - M.data.legStart, base = Math.round(4 + S.circuit.total / 150), tip = took < M.data.expect ? Math.round((M.data.expect - took) / 1000) : 0;
      var dent = (S.hitsLap || 0) > 2 ? -3 : 0;
      M.data.fares++; M.data.cash += Math.max(2, base + tip + dent);
      toast('💶 +' + Math.max(2, base + tip + dent) + ' € ' + (tip ? '(propina ' + tip + ' €)' : '') + (dent ? ' · el cliente se ha mareado' : ''));
      S.hitsLap = 0;
      var p = nodeAtDist(from, 250, 650); if (p < 0) return finishMode(true, 'Fin del turno', M.data.fares + ' carreras.');
      M.data.stage = 'pick'; legTo(from, p, '🚕 Recoge a ' + pax());
      if (SK.stat) SK.stat('taxi');
    }
    return;
  }
  if (M.id === 'deliver'){
    M.data.drops++;
    toast('📦 Entregado ' + M.data.drops + '/' + M.data.total);
    if (M.data.drops >= M.data.total){ finishMode(true, '¡Reparto perfecto!', 'Tres entregas a tiempo en ' + fmt(S.t) + '.'); if (SK.stat) SK.stat('deliverAll'); return; }
    var n = nodeAtDist(from, 450, 950); if (n < 0) return finishMode(true, 'Reparto', M.data.drops + ' entregas.');
    legTo(from, n, '📦 Entrega ' + (M.data.drops + 1) + ' de 3'); M.deadline = S.t + (S.circuit.total / 11.5 + 10) * 1000;
    return;
  }
  if (M.id === 'monu'){
    toast('📍 ' + esc(M.data.list[M.data.i].n));
    if (SK.say) SK.say(M.data.list[M.data.i].n);
    M.data.i++;
    if (M.data.i >= M.data.list.length){ finishMode(true, 'Ruta completada', M.data.list.length + ' monumentos en ' + fmt(S.t) + '.'); return; }
    legTo(from, M.data.list[M.data.i].node, '🌙 ' + M.data.list[M.data.i].n);
  }
}
// meta del circuito (drift, o si se llega justo por la línea)
SK.modeFinish = function(total){
  if (M.id === 'drift'){
    var D = M.data; D.pts += Math.round(D.chain); D.chain = 0;
    var best = +(localStorage.getItem('sk_driftbest') || 0); if (D.pts > best) localStorage.setItem('sk_driftbest', D.pts);
    if (SK.stat) SK.stat('driftBest', D.pts, true);
    return finishMode(true, D.pts > best ? '¡Récord de drift!' : 'Drift', D.pts.toLocaleString('es-ES') + ' puntos · récord ' + Math.max(best, D.pts).toLocaleString('es-ES'), D.pts.toLocaleString('es-ES'));
  }
  S.phase = 'run'; arrive();
};
function finishMode(ok, title, txt, big){
  if (S.phase === 'done' && res.classList.contains('on')) return;
  S.phase = 'done'; clearCops(); siren(1e9);
  $('mrLab').textContent = MODES.filter(function(m){ return m[0] === M.id; })[0][1];
  $('mrTitle').textContent = title; $('mrBig').textContent = big || fmt(S.t); $('mrTxt').textContent = txt;
  $('mrBig').style.color = ok ? 'var(--good)' : 'var(--bad)';
  res.classList.add('on'); hud.classList.remove('on');
  if (SK.sfx) try { ok ? SK.sfx.finish() : SK.sfx.hit(); } catch(e){}
  var id = M.id;
  $('mrAgain').onclick = function(){ res.classList.remove('on'); start(id); };
  $('mrOut').onclick = function(){ res.classList.remove('on'); stop(); var r = document.querySelector('#races .race'); if (r) r.click(); };
}

// ============================================================== sirena y luces
var sir = null;
function siren(dist, cop){
  var AC = SK.audioCtx && SK.audioCtx();
  if (!AC){ return; }
  if (!sir){
    var o = AC.createOscillator(), g = AC.createGain(), f = AC.createBiquadFilter(), pn = AC.createStereoPanner ? AC.createStereoPanner() : null; o.type = 'sawtooth'; f.type = 'lowpass'; f.frequency.value = 2400;
    g.gain.value = 0; o.connect(f); f.connect(g); if (pn){ g.connect(pn); pn.connect(SK.audioBus ? SK.audioBus() : AC.destination); } else g.connect(SK.audioBus ? SK.audioBus() : AC.destination); o.start(); sir = { o: o, g: g, pn: pn, f: f };
  }
  if (cop && sir.pn && SK.pan3){ var pp = SK.pan3(cop.x, cop.y); sir.pn.pan.setTargetAtTime(pp.pan * 0.85, AC.currentTime, 0.05); sir.f.frequency.setTargetAtTime(pp.behind ? 1300 : 2400, AC.currentTime, 0.1); }
  var on = dist < 400 && S.mode === 'cops' && S.phase === 'run', t = AC.currentTime;
  sir.g.gain.setTargetAtTime(on ? Math.min(0.09, 6 / Math.max(20, dist)) : 0, t, 0.1);
  sir.o.frequency.setTargetAtTime((Math.floor(t * 1.6) % 2) ? 960 : 720, t, 0.02);
}
function lightSprite(color){
  var c = document.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 1, 32, 32, 31);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), color: color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  s.scale.set(1.4, 1.4, 1); return s;
}
var prevFrame = SK.frame3d;
SK.frame3d = function(dt, o){
  if (prevFrame) try { prevFrame(dt, o); } catch(e){}
  if (!window.THREE || !SK.buildCar) return;
  var now = performance.now();
  COPS.forEach(function(c){
    if (!c.grp || (c.grp.userData.kenney === false && SK.carReady && SK.carReady('police'))){
      if (c.grp && c.grp.parent) c.grp.parent.remove(c.grp);
      c.grp = SK.buildCar('police', null);
      c.red = lightSprite(new THREE.Color(3, 0.2, 0.2)); c.blue = lightSprite(new THREE.Color(0.3, 0.6, 3));
      c.red.position.set(0, 2.2, 0.45); c.blue.position.set(0, 2.2, -0.45); c.grp.add(c.red); c.grp.add(c.blue);
    }
    if (c.grp.parent !== o.scene) o.scene.add(c.grp);
    c.grp.position.set(c.x, 0, -c.y); c.grp.rotation.set(0, c.h, 0);
    var ph = Math.floor(now / 140) % 4; c.red.visible = ph < 2; c.blue.visible = ph >= 2;
    var wh = c.grp.userData.wheels || []; for (var i = 0; i < wh.length; i++) wh[i].rotation.x = c.spin;
  });
};
// en el minimapa también se ven
SK.miniExtra = (function(prev){ return function(ctx, zs){ if (prev) prev(ctx, zs);
  COPS.forEach(function(c){ ctx.fillStyle = (Math.floor(performance.now() / 250) % 2) ? '#FF3B3B' : '#3B7BFF'; ctx.beginPath(); ctx.arc(c.x, c.y, 6 / zs, 0, 6.283); ctx.fill(); });
  if (M.end && S.mode){ ctx.fillStyle = '#FFD84A'; ctx.beginPath(); ctx.arc(M.end[0], M.end[1], 7 / zs, 0, 6.283); ctx.fill(); }
}; })(SK.miniExtra);
SK.modes = { current: function(){ return S.mode; }, start: start, stop: stop, cops: function(){ return COPS; }, state: function(){ return M; } };
// si el jugador elige una carrera normal, se acaba el modo
document.addEventListener('click', function(e){ if (S.mode && e.target.closest && (e.target.closest('#races .race') || e.target.closest('#gen') || e.target.closest('#dailyBtn'))) stop(); }, true);
})();
