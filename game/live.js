/* King of Streets v7 — en directo.
   Ves a quien está corriendo tu misma carrera ahora mismo (coches reales, no fantasmas),
   duelo en directo con enlace (salís a la vez), y modo espectador para mirar a otro piloto.
   Todo va por mensajes efímeros de Supabase Realtime a través del puente: no se guarda nada. */
(function(){
'use strict';
var A = window.SK && SK.api; if (!A) return;
var S = A.S, $ = A.$, esc = A.esc, toast = A.toast, fmt = A.fmt, NET = A.NET;
function el(html){ var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
function topSearch(){ try { return window.top.location.search; } catch(e){ return location.search; } }
if (!NET || !NET.up) { SK.live = { off: true }; return; }

var ME = (A.deviceId() || 'x').slice(-10);
var L = { key: null, peers: {}, cars: {}, sendT: 0, duel: null, spec: null, status: '', finishes: {} };
var COLORS = ['#35C2FF', '#FF4FB8', '#7CFF6B', '#FFB020', '#B38CFF', '#FF6B4A'];
function colorOf(id){ var h = 0; for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0; return COLORS[Math.abs(h) % COLORS.length]; }

var css = `
#liveBlock .lv{display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--line);font-size:13px}
#liveBlock .lv b{flex:1;color:var(--fg)} #liveBlock .lv small{color:var(--muted);font-family:var(--mono)}
#liveBlock .dot{width:9px;height:9px;border-radius:50%;background:#FF3B3B;box-shadow:0 0 8px #FF3B3B;animation:lvp 1.2s infinite}
@keyframes lvp{50%{opacity:.35}}
#liveChip{position:absolute;right:12px;top:64px;z-index:9;display:none;background:rgba(11,15,20,.82);border:1px solid var(--line);border-radius:999px;padding:5px 11px;font:600 12px var(--cond);letter-spacing:.06em;color:#fff;text-transform:uppercase}
#liveChip.on{display:block} #liveChip i{display:inline-block;width:8px;height:8px;border-radius:50%;background:#FF3B3B;margin-right:6px;vertical-align:1px}
#specBar{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);z-index:30;display:none;gap:8px;align-items:center;background:rgba(10,14,19,.9);border:1px solid var(--line);border-radius:999px;padding:6px 8px 6px 14px;font:600 13px var(--cond);color:#fff;letter-spacing:.05em;text-transform:uppercase}
#specBar.on{display:flex} #specBar button{background:var(--surface2);border:1px solid var(--line);color:#fff;border-radius:999px;padding:5px 12px;font:600 12px var(--cond)}
`;
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
var block = el('<div class="block" id="liveBlock"><div class="eyebrow">🔴 En directo en esta carrera</div><div id="liveList"><p class="hint" style="margin:0">Nadie más corriendo esta ruta ahora mismo.</p></div>' +
  '<div class="row2" style="margin-top:8px"><button type="button" class="btn" id="duelGo">⚔️ Duelo en directo</button></div></div>');
var mb = $('modesBox') && $('modesBox').closest('.block');
if (mb) mb.parentNode.insertBefore(block, mb); else { var rail = document.querySelector('.railscroll'); if (rail) rail.appendChild(block); }
var chip = el('<div id="liveChip"></div>'); $('stage').appendChild(chip);
var spec = el('<div id="specBar"><span id="specName"></span><button type="button" id="specNext">Siguiente</button><button type="button" id="specExit">Salir</button></div>'); $('stage').appendChild(spec);

// ------------------------------------------------------------- mensajes del puente
window.addEventListener('message', function(ev){
  var d = ev.data; if (!d || d.__sk !== 'rt') return;
  if (d.t === 'status'){
    L.status = d.data;
    if (d.data === 'CHANNEL_ERROR' || d.data === 'TIMED_OUT'){      // sin directo (red o servidor): no insistir en bucle
      L.errs = (L.errs || 0) + 1;
      if (L.errs >= 2){ NET.call('rt_leave', {}); L.pauseUntil = Date.now() + 180000 * Math.min(4, L.errs - 1); L.key = null; }
    } else if (d.data === 'SUBSCRIBED') L.errs = 0;
  }
  else if (d.t === 'peers'){ var ids = {}; (d.data || []).forEach(function(p){ if (p && p.id && p.id !== ME){ ids[p.id] = 1; var q = L.peers[p.id] || (L.peers[p.id] = { id: p.id }); q.h = p.h || 'anon'; q.role = p.role; q.car = p.car; q.paint = p.paint; q.seen = performance.now(); } });
    Object.keys(L.peers).forEach(function(id){ if (!ids[id]) dropPeer(id); }); paintList(); }
  else if (d.t === 'm') onMsg(d.data || {});
});
function onMsg(m){
  if (!m.id || m.id === ME) return;
  var p = L.peers[m.id] || (L.peers[m.id] = { id: m.id, h: m.h || 'anon' });
  p.seen = performance.now(); if (m.h) p.h = m.h;
  if (m.k === 'p'){
    p.px = p.x == null ? m.x : p.x; p.py = p.y == null ? m.y : p.y; p.pa = p.a == null ? m.a : p.a;
    p.tx = m.x; p.ty = m.y; p.ta = m.a; p.v = m.v; p.ph = m.ph; p.t = m.t; p.lt = performance.now(); p.prog = m.pr;
    if (p.x == null){ p.x = m.x; p.y = m.y; p.a = m.a; }
    if (m.car) p.car = m.car; if (m.paint) p.paint = m.paint;
  } else if (m.k === 'go' && L.duel && !L.duel.started){
    var wait = Math.max(0, Math.min(4000, m.at - Date.now()));
    L.duel.started = true; setTimeout(function(){ startRace(); }, wait); toast('⚔️ ¡Duelo! Salís a la vez.');
  } else if (m.k === 'rdy' && L.duel && L.duel.host && !L.duel.started){
    var at = Date.now() + 2500; send({ k: 'go', at: at }, true); L.duel.started = true; setTimeout(startRace, 2500); toast('⚔️ ' + esc(p.h) + ' está listo. ¡Salís en 2 s!');
  } else if (m.k === 'fin'){
    L.finishes[m.id] = { h: p.h, ms: m.ms }; if (L.duel) duelResult();
    else toast('🔴 ' + esc(p.h) + ' acaba de terminar en ' + fmt(m.ms));
  }
  paintList();
}
function dropPeer(id){ var c = L.cars[id]; if (c && c.parent) c.parent.remove(c); delete L.cars[id]; delete L.peers[id]; if (L.spec === id) stopSpec(); }
function send(m, force){ m.id = ME; m.h = A.getHandle() || 'anon'; return NET.call('rt_send', { payload: m }, 3000); }

// ------------------------------------------------------------- unirse al canal de la carrera (o del duelo)
function wantKey(){ return L.duel ? 'd:' + L.duel.code : (S.routeId ? 'r:' + S.routeId : null); }
function join(){
  if (L.pauseUntil && Date.now() < L.pauseUntil) return;
  var k = wantKey(); if (k === L.key) return;
  Object.keys(L.peers).forEach(dropPeer); L.finishes = {};
  L.key = k; if (!k){ NET.call('rt_leave', {}); paintList(); return; }
  NET.call('rt_join', { key: k, me: { id: ME, h: A.getHandle() || 'anon', role: 'race', car: S.carKind || null, paint: S.paint || null } }, 6000);
  paintList();
}
setInterval(join, 1500);
document.addEventListener('visibilitychange', function(){ if (document.hidden && !L.duel){ NET.call('rt_leave', {}); L.key = null; } });

// posición: 5 veces por segundo cuando hay alguien mirando
SK.pre = SK.pre || [];
SK.pre.push(function(dt){
  var n = Object.keys(L.peers).length; L.sendT -= dt;
  if (!n || !S.car || L.sendT > 0 || !L.key) return;
  var racing = S.phase === 'run' || S.phase === 'count' || S.phase === 'ready';
  if (!racing) return;
  L.sendT = S.phase === 'run' ? 0.2 : 1;
  send({ k: 'p', x: Math.round(S.car.x * 10) / 10, y: Math.round(S.car.y * 10) / 10, a: Math.round(S.car.h * 100) / 100, v: Math.round(S.car.speed * 10) / 10, ph: S.phase, t: Math.round(S.t || 0), pr: Math.round(S.car.prog || 0), car: S.carKind, paint: S.paint });
});
var prevFinish = SK.onFinish;
SK.onFinish = function(run, board){
  if (prevFinish) try { prevFinish(run, board); } catch(e){}
  if (L.key && run && !S.mode) send({ k: 'fin', ms: Math.round(run.total) });
  if (L.duel && run){ L.finishes[ME] = { h: A.getHandle() || 'Tú', ms: run.total, me: true }; duelResult(); }
};

// ------------------------------------------------------------- lista y chip
function peersArr(){ return Object.keys(L.peers).map(function(k){ return L.peers[k]; }).filter(function(p){ return performance.now() - (p.seen || 0) < 20000; }); }
function paintList(){
  var P = peersArr(), box = $('liveList');
  if (box) box.innerHTML = P.length ? P.map(function(p){
    var where = p.ph === 'run' ? (p.prog && S.circuit ? Math.round(p.prog / S.circuit.total * 100) + '%' : 'corriendo') : p.ph === 'count' ? 'saliendo' : 'en la salida';
    return '<div class="lv"><span class="dot"></span><b>' + esc(p.h) + '</b><small>' + where + '</small><button type="button" class="btn ghost" data-spec="' + esc(p.id) + '" style="padding:4px 10px">👀 Mirar</button></div>';
  }).join('') : '<p class="hint" style="margin:0">' + (L.duel ? 'Esperando a tu rival… comparte el enlace.' : 'Nadie más corriendo esta ruta ahora mismo.') + '</p>';
  if (box) box.querySelectorAll('[data-spec]').forEach(function(b){ b.onclick = function(){ startSpec(b.dataset.spec); document.body.classList.remove('menu'); }; });
  chip.innerHTML = '<i></i>' + (P.length + 1) + ' en directo'; chip.classList.toggle('on', P.length > 0 && S.phase !== 'idle');
}
setInterval(paintList, 2500);

// ------------------------------------------------------------- coches de los demás en 3D
var prevFrame = SK.frame3d;
SK.frame3d = function(dt, o){
  if (prevFrame) try { prevFrame(dt, o); } catch(e){}
  if (!SK.buildCar) return;
  peersArr().forEach(function(p){
    if (p.x == null) return;
    var c = L.cars[p.id];
    if (!c || (c.userData.kenney === false && SK.carReady && SK.carReady(SK.carId(p.car || 'sedan')))){
      if (c && c.parent) c.parent.remove(c);
      c = SK.buildCar(p.car || 'sedan', p.paint || colorOf(p.id)); c.add(nameTag(p.h, colorOf(p.id))); L.cars[p.id] = c;
    }
    if (c.parent !== o.scene) o.scene.add(c);
    // interpolación suave entre mensajes (llegan cada 200 ms)
    var u = Math.min(1, (performance.now() - (p.lt || 0)) / 220);
    if (p.tx != null){ p.x = p.px + (p.tx - p.px) * u; p.y = p.py + (p.ty - p.py) * u; var da = Math.atan2(Math.sin(p.ta - p.pa), Math.cos(p.ta - p.pa)); p.a = p.pa + da * u; }
    c.position.set(p.x, 0, -p.y); c.rotation.set(0, p.a || 0, 0);
    c.visible = !S.car || Math.hypot(p.x - S.car.x, p.y - S.car.y) > 2.5 || L.spec === p.id;
  });
  Object.keys(L.cars).forEach(function(id){ if (!L.peers[id]){ var c = L.cars[id]; if (c.parent) c.parent.remove(c); delete L.cars[id]; } });
};
function nameTag(name, color){
  var c = document.createElement('canvas'); c.width = 256; c.height = 64; var g = c.getContext('2d');
  g.fillStyle = 'rgba(10,14,19,.82)'; if (g.roundRect){ g.beginPath(); g.roundRect(4, 8, 248, 48, 22); g.fill(); } else g.fillRect(4, 8, 248, 48);
  g.fillStyle = '#FF3B3B'; g.beginPath(); g.arc(30, 32, 9, 0, 6.283); g.fill();
  g.fillStyle = color; g.font = '700 30px "Barlow Condensed", Arial Narrow, sans-serif'; g.textBaseline = 'middle'; g.fillText(String(name).toUpperCase().slice(0, 13), 50, 33);
  var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false, transparent: true }));
  s.scale.set(2.5, 0.62, 1); s.position.y = 2.8; return s;
}

// ------------------------------------------------------------- espectador
var prevCam = SK.camOverride, specSm = null;
SK.camOverride = function(car, dt, cam){
  if (L.spec){
    var p = L.peers[L.spec];
    if (p && p.x != null){
      var fx = Math.cos(p.a || 0), fy = Math.sin(p.a || 0), back = 9;
      var pos = new THREE.Vector3(p.x - fx * back, 3.6, -(p.y - fy * back));
      specSm = specSm ? specSm.lerp(pos, Math.min(1, dt * 5)) : pos;
      return { pos: specSm.clone(), look: new THREE.Vector3(p.x + fx * 12, 1, -(p.y + fy * 12)), fov: 62 };
    }
  }
  return prevCam ? prevCam(car, dt, cam) : null;
};
function startSpec(id){
  if (!L.peers[id]) return; L.spec = id; specSm = null; $('specName').textContent = '👀 ' + (L.peers[id].h || 'piloto');
  spec.classList.add('on'); if (SK.setView && S.view === 'top') SK.setView('chase');
  if (SK.track) SK.track('spectate', {});
}
function stopSpec(){ L.spec = null; spec.classList.remove('on'); }
$('specExit').onclick = stopSpec;
$('specNext').onclick = function(){ var P = peersArr(); if (!P.length) return stopSpec(); var i = P.findIndex(function(p){ return p.id === L.spec; }); startSpec(P[(i + 1) % P.length].id); };
SK.live = { peers: peersArr, spectate: startSpec, state: function(){ return { key: L.key, status: L.status, peers: peersArr().length, duel: L.duel }; } };

// ------------------------------------------------------------- duelo en directo
function code(){ var c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = ''; for (var i = 0; i < 5; i++) s += c[(Math.random() * c.length) | 0]; return s; }
function startRace(){
  if (S.phase === 'run' || S.phase === 'count') return;
  document.body.classList.remove('menu'); if ($('results')) $('results').classList.remove('on');
  if (A.startCountdown) A.startCountdown();
}
$('duelGo').onclick = function(){
  if (!S.circuit || !A.shareUrl){ toast('Elige primero una carrera.', true); return; }
  var c = code(); L.duel = { code: c, host: true, started: false }; join();
  var url = A.shareUrl() + '&duel=' + c, text = '⚔️ Duelo en directo en King of Streets: ' + (S.routeTitle || '') + '. Entra y salimos a la vez: ' + url;
  if (navigator.share) navigator.share({ text: text }).catch(function(){});
  else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function(){ toast('Enlace del duelo copiado. Cuando tu rival entre, salís a la vez.'); });
  paintList(); if (SK.track) SK.track('duel_create', {});
};
function duelResult(){
  var arr = Object.keys(L.finishes).map(function(k){ return L.finishes[k]; }).sort(function(a, b){ return a.ms - b.ms; });
  if (arr.length < 2) return;
  var win = arr[0]; toast(win.me ? '⚔️ ¡Has ganado el duelo! ' + fmt(win.ms) + ' contra ' + fmt(arr[1].ms) : '⚔️ ' + esc(win.h) + ' gana el duelo por ' + ((arr[1].ms - win.ms) / 1000).toFixed(2) + ' s');
  if (SK.stat && win.me) SK.stat('duels');
  L.duel.started = false; L.finishes = {};
}
// entrar por enlace de duelo: la ruta la carga el reto (?r=…), aquí solo nos unimos y avisamos de que estamos listos
(function(){
  var q = new URLSearchParams(topSearch() || ''), c = (q.get('duel') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  if (!c) return;
  L.duel = { code: c, host: false, started: false };
  var tries = 0, iv = setInterval(function(){
    tries++; join();
    if (S.circuit && L.status === 'SUBSCRIBED' && peersArr().length){ send({ k: 'rdy' }); toast('⚔️ Duelo listo. Salís en cuanto el anfitrión confirme.'); clearInterval(iv); }
    if (tries > 120) clearInterval(iv);
  }, 1000);
})();
})();
