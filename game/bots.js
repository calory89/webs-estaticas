/* King of Streets v6 — rivales en la parrilla.
   Tres coches controlados por la máquina salen contigo: frenan antes de cada curva según lo cerrada
   que sea, aceleran en recta, te adelantan por el otro lado si les cortas el paso y se pueden
   empujar. No cuentan para las coronas: son para que cada vuelta sea una carrera. */
(function(){
'use strict';
var A = window.SK && SK.api; if (!A) return;
var S = A.S, $ = A.$, esc = A.esc;
function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch(e){ return null; } }
function el(html){ var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
function wrap(a){ return Math.atan2(Math.sin(a), Math.cos(a)); }

var ON = ls('sk_rivals') !== '0';
var CAST = [
  { name: 'Rayo', kind: 'race', color: '#E53935', vmax: 43.5, alat: 8.8, acc: 14.8 },
  { name: 'Vero', kind: 'hatchback-sports', color: '#1E88E5', vmax: 41.5, alat: 8.2, acc: 14.2 },
  { name: 'Nico', kind: 'suv', color: '#43A047', vmax: 39, alat: 7.4, acc: 13.2 }
];
var B = { list: [], route: null, started: 0, cache: null, cacheF: -1, frame: 0 };

var css = `
#posChip{position:absolute;left:50%;top:92px;transform:translateX(-50%);z-index:9;display:none;background:rgba(11,15,20,.82);border:1px solid var(--line);
  border-radius:999px;padding:3px 12px;font:700 13px var(--mono);color:#fff;letter-spacing:.04em;pointer-events:none}
#posChip.on{display:block} #posChip b{color:var(--gold)}
body.land #posChip{top:62px;left:auto;right:calc(max(8px,env(safe-area-inset-right)) + 96px);transform:none}
@media (pointer:fine){ #posChip{top:auto;bottom:24px;left:auto;right:170px;transform:none} }
`;
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
var chip = el('<div id="posChip"></div>'); $('stage').appendChild(chip);

// interruptor en el panel
(function(){
  var views = $('vChase') && $('vChase').closest('.seg'); if (!views) return;
  var seg = el('<div class="seg" role="group" aria-label="Rivales"><button type="button" data-r="1">Con rivales</button><button type="button" data-r="0">Contrarreloj</button></div>');
  views.parentNode.insertBefore(seg, views.nextSibling);
  function paint(){ seg.querySelectorAll('button').forEach(function(b){ b.classList.toggle('on', (b.dataset.r === '1') === ON); }); }
  seg.querySelectorAll('button').forEach(function(b){ b.onclick = function(){ ON = b.dataset.r === '1'; ls('sk_rivals', ON ? '1' : '0'); if (!ON) clear(); paint(); }; });
  paint();
})();

function active(){ return ON && !S.mode && S.circuit && !(S.ghosts && S.ghosts.length) && !SK.forceSize && S.view !== 'top'; }
function posAt(R, d, lat){
  var p;
  if (d < 0){ var p0 = A.pointAt(R, 0); p = { x: p0.x + Math.cos(p0.h) * d, y: p0.y + Math.sin(p0.h) * d, h: p0.h }; }
  else if (d > R.total){ var p1 = A.pointAt(R, R.total); var e = d - R.total; p = { x: p1.x + Math.cos(p1.h) * e, y: p1.y + Math.sin(p1.h) * e, h: p1.h }; }
  else p = A.pointAt(R, d);
  return { x: p.x - Math.sin(p.h) * lat, y: p.y + Math.cos(p.h) * lat, h: p.h };
}
function curv(R, d){
  var a = A.pointAt(R, Math.max(0, d - 6)).h, b = A.pointAt(R, Math.min(R.total, d + 6)).h;
  return Math.abs(wrap(b - a)) / 12;
}
function spawn(){
  clear(); var R = S.circuit; if (!R) return;
  B.route = S.routeId;
  var grid = [[-8, 1.7], [-8, -1.7], [-15, 0]];
  CAST.forEach(function(c, i){
    B.list.push({ c: c, d: grid[i][0], lat: grid[i][1], latT: grid[i][1], v: 0, done: false, t: 0, x: 0, y: 0, h: 0, spin: 0, mistake: 0, grp: null, label: null });
  });
  place();
}
function clear(){
  B.list.forEach(function(b){ if (b.grp && b.grp.parent) b.grp.parent.remove(b.grp); });
  B.list = []; B.route = null; chip.classList.remove('on');
}
function place(){
  var R = S.circuit;
  B.list.forEach(function(b){ var p = posAt(R, b.d, b.lat); b.x = p.x; b.y = p.y; b.h = p.h; });
}
function step(dt){
  var R = S.circuit, car = S.car; if (!R || !car) return;
  var HALFW = 3.2;
  B.list.forEach(function(b, i){
    if (b.done){ b.v = Math.max(0, b.v - 12 * dt); b.d += b.v * dt; var pf = posAt(R, b.d, b.lat); b.x = pf.x; b.y = pf.y; b.h = pf.h; return; }
    var c = b.c, target = c.vmax;
    // frena antes de las curvas: v permitida = √(v_curva² + 2·freno·distancia)
    for (var s = 0; s <= 90; s += 10){
      var k = curv(R, Math.min(R.total, Math.max(0, b.d) + s));
      if (k > 0.002){ var vc = Math.sqrt(c.alat / k), allow = Math.sqrt(vc * vc + 2 * 18 * s); if (allow < target) target = allow; }
    }
    if (b.mistake > 0){ b.mistake -= dt; target *= 0.55; }
    else if (Math.random() < dt * 0.012) b.mistake = 0.6 + Math.random() * 0.8;           // algún error humano
    // tráfico: el jugador y los otros rivales
    var others = [{ x: car.x, y: car.y, v: car.speed, me: true }];
    B.list.forEach(function(o, j){ if (j !== i) others.push({ x: o.x, y: o.y, v: o.v }); });
    var hx = Math.cos(b.h), hy = Math.sin(b.h);
    others.forEach(function(o){
      var dx = o.x - b.x, dy = o.y - b.y, ahead = dx * hx + dy * hy, side = -dx * hy + dy * hx;
      if (ahead > 0 && ahead < 14 && Math.abs(side - 0) < 2.4){
        // alguien delante en su línea: se abre para adelantar y, si no cabe, levanta
        b.latT = side > 0 ? -HALFW * 0.6 : HALFW * 0.6;
        if (ahead < 7) target = Math.min(target, o.v * 0.95);
      }
    });
    if (Math.random() < dt * 0.08) b.latT *= 0.5;                                          // vuelve poco a poco al centro
    b.lat += (b.latT - b.lat) * Math.min(1, dt * 1.6);
    if (b.v < target) b.v += c.acc * (1 - Math.min(1, b.v / c.vmax) * 0.72) * dt;
    else b.v = Math.max(target, b.v - 24 * dt);
    b.d += b.v * dt;
    var p = posAt(R, b.d, b.lat);
    var dh = Math.atan2(p.y - b.y, p.x - b.x);
    b.h = b.v > 1 ? dh : p.h; b.x = p.x; b.y = p.y;
    b.spin += b.v * dt / 0.36;
    if (b.d >= R.total && !b.done){ b.done = true; b.t = S.t; }
  });
}
// para las colisiones del juego: los rivales son sólidos como el tráfico
var baseSolid = SK.solidCars;
SK.solidCars = function(){
  var L = baseSolid ? baseSolid() : [];
  if (!B.list.length) return L;
  if (B.cacheF !== B.frame){
    B.cache = L.slice();
    B.list.forEach(function(b, i){ B.cache.push(b.x, b.y, b.h, 1000 + i); });
    B.cacheF = B.frame;
  }
  return B.cache;
};
var baseBump = SK.bumpCar;
SK.bumpCar = function(id, ix, iy){
  if (id >= 1000){ var b = B.list[id - 1000]; if (b){ b.v *= 0.7; b.latT += (ix * -Math.sin(b.h) + iy * Math.cos(b.h)) > 0 ? 1.2 : -1.2; } return; }
  if (baseBump) baseBump(id, ix, iy);
};
function position(){
  var car = S.car, n = 1;
  B.list.forEach(function(b){ if (b.done ? true : b.d > car.prog) n++; });
  if (S.phase === 'done') { n = 1; B.list.forEach(function(b){ if (b.done && b.t < S.lastRun.total) n++; }); }
  return n;
}
SK.pre.push(function(dt){
  B.frame++;
  if (!active()){ if (B.list.length) clear(); return; }
  if (!B.list.length || B.route !== S.routeId || (S.phase === 'count' && B.started !== S.started)){
    if (S.phase === 'count') B.started = S.started;
    spawn();
  }
  if (S.phase === 'run' || S.phase === 'done'){ var rest = Math.min(0.15, dt); while (rest > 0){ var h = Math.min(0.05, rest); step(h); rest -= h; } }
  if (S.phase === 'run'){ chip.innerHTML = 'POS <b>' + position() + '</b>/' + (B.list.length + 1); chip.classList.add('on'); }
  else if (S.phase !== 'done') chip.classList.remove('on');
});
// dibujo 3D
function label(name, color){
  var c = document.createElement('canvas'); c.width = 256; c.height = 64; var g = c.getContext('2d');
  g.fillStyle = 'rgba(10,14,19,.8)'; if (g.roundRect){ g.beginPath(); g.roundRect(4, 8, 248, 48, 22); g.fill(); } else g.fillRect(4, 8, 248, 48);
  g.fillStyle = color; g.beginPath(); g.arc(34, 32, 10, 0, 6.283); g.fill();
  g.fillStyle = '#fff'; g.font = '700 30px "Barlow Condensed", Arial Narrow, sans-serif'; g.textBaseline = 'middle'; g.fillText(name.toUpperCase() + ' · IA', 54, 33);
  var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false, transparent: true }));
  s.scale.set(2.5, 0.62, 1); s.position.y = 2.7; return s;
}
var prevFrame = SK.frame3d;
SK.frame3d = function(dt, o){
  if (prevFrame) try { prevFrame(dt, o); } catch(e){}
  if (!window.THREE || !SK.buildCar) return;
  B.list.forEach(function(b){
    if (!b.grp || (b.grp.userData.kenney === false && SK.carReady && SK.carReady(SK.carId(b.c.kind)))){
      if (b.grp && b.grp.parent) b.grp.parent.remove(b.grp);
      b.grp = SK.buildCar(b.c.kind, b.c.color); b.grp.add(label(b.c.name, b.c.color));
    }
    if (b.grp.parent !== o.scene) o.scene.add(b.grp);
    b.grp.position.set(b.x, 0, -b.y); b.grp.rotation.set(0, b.h, 0);
    var wh = b.grp.userData.wheels || [];
    for (var i = 0; i < wh.length; i++){ if (b.grp.userData.kenney) wh[i].rotation.x = b.spin; else wh[i].rotation.y = -b.spin; }
    if (b.grp.userData.brake) b.grp.userData.brake.material.emissiveIntensity = b.v > 2 && b.mistake > 0 ? 2 : 0.35;
  });
};
// resultado de la carrera
var prevFinish = SK.onFinish;
SK.onFinish = function(run, board){
  if (prevFinish) try { prevFinish(run, board); } catch(e){}
  if (!B.list.length || !run) return;
  var ahead = B.list.filter(function(b){ return b.done && b.t < run.total; }).map(function(b){ return b.c.name; });
  var pos = ahead.length + 1, n = B.list.length + 1;
  var box = $('after'); if (!box) return;
  var old = $('botRes'); if (old) old.remove();
  var msg = pos === 1 ? '🏆 Has ganado la carrera a los ' + (n - 1) + ' rivales' : '🏁 Has quedado ' + pos + 'º de ' + n + ' · te ganó ' + ahead.map(esc).join(' y ');
  var d = el('<div class="gb" id="botRes" style="padding:10px 0 2px"><div class="eyebrow" style="margin:0;color:' + (pos === 1 ? 'var(--gold)' : 'var(--muted)') + '">' + msg + '</div></div>');
  box.insertBefore(d, box.firstChild);
  chip.innerHTML = 'POS <b>' + pos + '</b>/' + n;
};
var LEVELS = { facil: 0.88, normal: 1, dificil: 1.05, pro: 1.1 }, LEVEL = ls('sk_botlvl') || 'normal';
function applyLevel(){ var k = LEVELS[LEVEL] || 1; CAST.forEach(function(c){ if (!c.base) c.base = { vmax: c.vmax, alat: c.alat, acc: c.acc }; c.vmax = Math.min(45.5, c.base.vmax * k); c.alat = c.base.alat * k; c.acc = c.base.acc * (0.5 + k / 2); }); }
applyLevel();
(function(){
  var views = document.querySelector('.seg [data-r]'); if (!views) return;
  var seg = el('<div class="seg" role="group" aria-label="Dificultad"><button type="button" data-l="facil">Fácil</button><button type="button" data-l="normal">Normal</button><button type="button" data-l="dificil">Difícil</button><button type="button" data-l="pro">Pro</button></div>');
  views.parentNode.parentNode.insertBefore(seg, views.parentNode.nextSibling);
  function paint(){ seg.querySelectorAll('button').forEach(function(b){ b.classList.toggle('on', b.dataset.l === LEVEL); }); }
  seg.querySelectorAll('button').forEach(function(b){ b.onclick = function(){ LEVEL = b.dataset.l; ls('sk_botlvl', LEVEL); applyLevel(); paint(); }; });
  paint();
})();
SK.bots = { list: function(){ return B.list; }, on: function(){ return ON; }, level: function(){ return LEVEL; }, clear: function(){ clear(); } };
})();
