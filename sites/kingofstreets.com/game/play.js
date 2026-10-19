/* King of Streets v7 — el juego por dentro.
   Medallas por calle, vuelta limpia, rebobinar 5 s (vuelta casual), pausa de verdad, copiloto por voz,
   revancha en un toque, minimapa que gira, pantalla minimalista, fantasma del rey opcional,
   tutorial con primera corona, carreras largas, logros y daños (abolladuras, cristal roto). */
(function(){
'use strict';
var A = window.SK && SK.api; if (!A) return;
var S = A.S, $ = A.$, esc = A.esc, fmt = A.fmt, toast = A.toast;
var COARSE = matchMedia('(pointer:coarse)').matches;
function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch(e){ return null; } }
function lj(k, d){ try { return JSON.parse(ls(k) || 'null') || d; } catch(e){ return d; } }
function el(html){ var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
function wrap(a){ return Math.atan2(Math.sin(a), Math.cos(a)); }
SK.pre = SK.pre || []; SK.post = SK.post || [];

var css = `
#pauseOv .card{width:min(360px,100%)} #pauseOv .inner{display:flex;flex-direction:column;gap:8px;padding:16px 22px 20px}
.medal{font-style:normal;margin-left:6px}
.optrow{display:flex;flex-wrap:wrap;gap:6px}
.optrow button{flex:1 1 45%;background:var(--surface);border:1px solid var(--line);color:var(--muted);border-radius:4px;padding:7px 6px;font:600 11px var(--cond);letter-spacing:.08em;text-transform:uppercase}
.optrow button.on{border-color:var(--trace);color:var(--fg);background:var(--surface2)}
.ach{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}
.ach i{font-style:normal;display:flex;align-items:center;justify-content:center;aspect-ratio:1;border-radius:8px;background:var(--surface);border:1px solid var(--line);font-size:18px;filter:grayscale(1);opacity:.35}
.ach i.on{filter:none;opacity:1;border-color:var(--gold)}
body.minimal #timing, body.minimal #plaque, body.minimal #gps, body.minimal #fx, body.minimal #wxChip, body.minimal #credits{display:none!important}
#mini.rot{border-radius:50%!important;background:transparent!important;box-shadow:0 4px 14px rgba(0,0,0,.4)}
#tutOv{position:absolute;left:50%;bottom:120px;transform:translateX(-50%);z-index:25;display:none;background:rgba(10,14,19,.9);border:1px solid var(--gold);border-radius:12px;padding:10px 16px;max-width:min(92%,420px);text-align:center}
#tutOv.on{display:block} #tutOv b{display:block;font:700 18px var(--cond);color:var(--gold);letter-spacing:.06em;text-transform:uppercase} #tutOv span{font-size:13px;color:#dfe6ec}
.clean{color:#7FF0C0}
`;
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

// ============================================================== opciones en el panel
var OPT = {
  voice: ls('sk_voice') === '1', minirot: ls('sk_minirot') !== '0', minimal: ls('sk_minimal') === '1',
  kingghost: ls('sk_kingghost') !== '0', rewind: ls('sk_rewind') !== '0', ssao: ls('sk_ssao') === '1', dj: ls('sk_dj') !== '0', vib: ls('sk_vib') !== '0'
};
S.miniRotate = OPT.minirot;
document.body.classList.toggle('minimal', OPT.minimal);
var rail = document.querySelector('.railscroll');
var optBlock = el('<div class="block"><div class="eyebrow">Opciones de juego</div><div class="optrow" id="optRow">' +
  '<button type="button" data-o="voice">🗣️ Copiloto voz</button><button type="button" data-o="minirot">🧭 Minimapa GTA</button>' +
  '<button type="button" data-o="kingghost">👻 Fantasma del rey</button><button type="button" data-o="rewind">⏪ Rebobinar</button>' +
  '<button type="button" data-o="minimal">▫️ Pantalla limpia</button><button type="button" data-o="ssao">🌑 Sombras de contacto</button><button type="button" data-o="dj">🎙️ Locutor de radio</button><button type="button" data-o="vib">📳 Vibración</button></div></div>');
var ctlB = $('ctlBlock'); if (ctlB) ctlB.parentNode.insertBefore(optBlock, ctlB); else rail.appendChild(optBlock);
function paintOpt(){
  optBlock.querySelectorAll('button').forEach(function(b){ b.classList.toggle('on', !!OPT[b.dataset.o]); });
  S.miniRotate = OPT.minirot; $('mini').classList.toggle('rot', OPT.minirot);
  document.body.classList.toggle('minimal', OPT.minimal);
  var rb = $('bRewind'); if (rb) rb.style.display = OPT.rewind ? '' : 'none';
}
optBlock.querySelectorAll('button').forEach(function(b){ b.onclick = function(){ var k = b.dataset.o; OPT[k] = !OPT[k]; ls('sk_' + k, OPT[k] ? '1' : '0'); paintOpt(); if (k === 'voice' && OPT.voice) say('Copiloto listo.'); if (k === 'ssao' && SK.setSSAO) SK.setSSAO(OPT.ssao); }; });

// ============================================================== botones de pausa y rebobinar
var hb = $('hudBtns');
if (hb){
  var bp = el('<button type="button" id="bPause" aria-label="Pausa" title="Pausa (P / Esc)">⏸</button>');
  var br = el('<button type="button" id="bRewind" aria-label="Rebobinar 5 segundos" title="Rebobinar 5 s (Z)">⏪</button>');
  hb.insertBefore(bp, hb.children[1] || null); hb.appendChild(br);
  bp.onclick = function(){ togglePause(); bp.blur(); };
  br.onclick = function(){ rewind(); br.blur(); };
}
paintOpt();

// ============================================================== pausa de verdad
var pov = el('<div class="overlay" id="pauseOv"><div class="card"><header><div class="lab">Pausa</div><h2>El reloj está parado</h2></header>' +
  '<div class="inner"><button type="button" class="btn" id="pzGo">▶ Seguir</button><button type="button" class="btn ghost" id="pzRe">↺ Empezar de nuevo</button>' +
  '<button type="button" class="btn ghost" id="pzOut">Salir de la carrera</button></div></div></div>');
$('stage').appendChild(pov);
function togglePause(force){
  if (S.phase !== 'run' && !S.paused) return;
  S.paused = force != null ? force : !S.paused;
  pov.classList.toggle('on', !!S.paused);
}
SK.togglePause = togglePause;
$('pzGo').onclick = function(){ togglePause(false); };
$('pzRe').onclick = function(){ togglePause(false); A.startCountdown(); };
$('pzOut').onclick = function(){ togglePause(false); S.phase = 'ready'; if (SK.bots) SK.bots.clear(); };
window.addEventListener('keydown', function(e){
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape'){ if (S.phase === 'run' || S.paused) togglePause(); }
  if (e.key === 'z' || e.key === 'Z') rewind();
});
document.addEventListener('visibilitychange', function(){ if (document.hidden && S.phase === 'run' && !S.mode) togglePause(true); });

// ============================================================== rebobinar 5 s (la vuelta pasa a casual)
var ring = [], lastSnap = -1;
SK.post.push(function(){
  if (S.phase !== 'run' || S.paused || !S.car) return;
  var slot = Math.floor(S.t / 100);
  if (slot === lastSnap) return; lastSnap = slot;
  var c = S.car;
  ring.push({ t: S.t, x: c.x, y: c.y, h: c.h, vf: c.vf, vl: c.vl, prog: c.prog, sect: S.sectorTimes.slice(), cur: S.curSector });
  if (ring.length > 120) ring.shift();
});
function rewind(){
  if (!OPT.rewind || S.phase !== 'run' || S.mode || !S.car || S.car.rw) return;
  var target = S.t - 5000, st = null;
  for (var i = ring.length - 1; i >= 0; i--) if (ring[i].t <= target){ st = ring[i]; break; }
  if (!st) st = ring[0]; if (!st) return;
  var c = S.car;
  c.x = st.x; c.y = st.y; c.h = st.h; c.vf = st.vf; c.vl = st.vl; c.prog = st.prog; c.off = 0;
  S.sectorTimes = st.sect.slice(); S.curSector = st.cur;
  S.started = performance.now() - st.t; S.t = st.t;
  if (S.ghostRec){ S.ghostRec.length = Math.min(S.ghostRec.length, (Math.floor(st.t / 100) + 1) * 3); S._recLast = { t: st.t, x: st.x, y: st.y, h: st.h }; }
  while (ring.length && ring[ring.length - 1].t > st.t) ring.pop();
  if (!S.casual) toast('⏪ Rebobinado. Esta vuelta ya es casual: no cuenta para coronas.');
  S.casual = true;
  if (SK.reset3d) SK.reset3d();
}
SK.rewind = rewind;

// ============================================================== copiloto por voz
var voice = null;
function pickVoice(){
  if (!('speechSynthesis' in window)) return null;
  var vs = speechSynthesis.getVoices(), lang = (document.documentElement.lang || 'es').slice(0, 2);
  return vs.filter(function(v){ return v.lang && v.lang.slice(0, 2) === lang; })[0] || vs.filter(function(v){ return /^es/.test(v.lang); })[0] || null;
}
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = function(){ voice = pickVoice(); };
function say(txt){
  if (!('speechSynthesis' in window)) return;
  try {
    var u = new SpeechSynthesisUtterance(txt); voice = voice || pickVoice(); if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : 'es-ES'; u.rate = 1.12; u.pitch = 1; u.volume = 1;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch(e){}
}
SK.say = say;
var turns = null, turnsFor = null, spoken = {};
function buildTurns(R){
  var out = [], prev = null;
  for (var d = 14; d < R.total - 14; d += 5){
    var a = A.pointAt(R, d - 12).h, b = A.pointAt(R, d + 12).h, dh = wrap(b - a);
    if (Math.abs(dh) > 0.5){
      if (prev && d - prev.d2 <= 10){ prev.d2 = d; if (Math.abs(dh) > Math.abs(prev.ang)){ prev.ang = dh; prev.d = d; } }
      else { prev = { d: d, d2: d, ang: dh }; out.push(prev); }
    }
  }
  return out;
}
function callTurn(t){
  var side = t.ang > 0 ? 'izquierda' : 'derecha', a = Math.abs(t.ang);
  var sev = a > 2.1 ? 'horquilla' : a > 1.35 ? 'cerrada' : a > 0.85 ? 'media' : 'abierta';
  return side + ' ' + sev;
}
SK.post.push(function(){
  var R = S.circuit; if (!OPT.voice || !R || !S.car || S.phase !== 'run' || S.mode) return;
  if (turnsFor !== R){ turns = buildTurns(R); turnsFor = R; spoken = {}; }
  var p = S.car.prog, sp = Math.max(12, S.car.speed);
  var lead = Math.max(60, sp * 3.2);
  for (var i = 0; i < turns.length; i++){
    var t = turns[i];
    if (t.d > p && t.d - p < lead && !spoken[i]){
      spoken[i] = 1;
      var nx = turns[i + 1], txt = callTurn(t);
      if (nx && nx.d - t.d < 40){ txt += ', y ' + callTurn(nx); spoken[i + 1] = 1; }
      else txt += ' en ' + (Math.round((t.d - p) / 10) * 10);
      say(txt); break;
    }
  }
  if (R.total - p < 150 && !spoken.fin){ spoken.fin = 1; say('última recta, a fondo'); }
});
SK.onCountdown = (function(prev){ return function(){ if (prev) prev(); spoken = {}; ring = []; lastSnap = -1; kingsAtStart = snapshotKings(); if (OPT.voice && !S.mode) setTimeout(function(){ say('Tres, dos, uno'); }, 400); }; })(SK.onCountdown);

// ============================================================== fantasma del rey (opcional)
SK.post.push(function(){
  if (OPT.kingghost){ if (!S.ghost && S._kg && S._kgRoute === S.routeId){ S.ghost = S._kg; } }
  else if (S.ghost){ S._kg = S.ghost; S._kgRoute = S.routeId; S.ghost = null; }
});

// ============================================================== medallas por calle y vuelta limpia
var kingsAtStart = {};
function snapshotKings(){ var o = {}; for (var k in S.kings) if (S.kings[k]) o[k] = { h: S.kings[k].h, t: S.kings[k].t }; return o; }
function medalOf(split, king){
  if (split == null || !king || !king.t) return null;
  var r = split / king.t;
  return r <= 1.03 ? 3 : r <= 1.06 ? 2 : r <= 1.12 ? 1 : 0;
}
var MED = ['', '🥉', '🥈', '🥇'];
var prevFinish = SK.onFinish;
SK.onFinish = function(run, board){
  if (prevFinish) try { prevFinish(run, board); } catch(e){}
  try { afterRace(run, board); } catch(e){ console.warn(e); }
};
function afterRace(run){
  var R = S.circuit; if (!R || !run) return;
  var best = lj('sk_medals', {}), rows = $('rsect').querySelectorAll('.sl'), got = [0, 0, 0, 0], me = A.getHandle() || 'anon';
  R.sect.forEach(function(s, i){
    var sl = A.slug(s.name), split = A.sectorSplit(i), k = kingsAtStart[sl];
    var m = (run.won || []).some(function(w){ return w.name === s.name; }) || (k && k.h === me) ? 3 : medalOf(split, k);
    if (!k && split != null && run.lapOk && !run.casual) m = 3;
    if (!m) return; got[m]++;
    if (!run.casual && (!best[sl] || best[sl] < m)) best[sl] = m;
    var n = rows[i] && rows[i].querySelector('.n'); if (n && !n.querySelector('.medal')) n.insertAdjacentHTML('beforeend', '<i class="medal">' + MED[m] + '</i>');
  });
  ls('sk_medals', JSON.stringify(best));
  var clean = run.lapOk && !run.casual && !(run.hits > 0);
  var box = $('after');
  if (box){
    var msg = [];
    if (got[3] + got[2] + got[1]) msg.push('Medallas: ' + (got[3] ? '🥇×' + got[3] + ' ' : '') + (got[2] ? '🥈×' + got[2] + ' ' : '') + (got[1] ? '🥉×' + got[1] : ''));
    if (clean) msg.push('<span class="clean">✨ Vuelta limpia: ni un roce</span>');
    if (msg.length){ var old = $('medRes'); if (old) old.remove(); box.insertBefore(el('<div class="gb" id="medRes" style="padding:8px 0 2px"><div class="eyebrow" style="margin:0">' + msg.join(' · ') + '</div></div>'), box.firstChild); }
  }
  // estadística para los logros
  var stt = lj('sk_statsx', {});
  stt.laps = (stt.laps || 0) + (run.lapOk ? 1 : 0);
  stt.clean = (stt.clean || 0) + (clean ? 1 : 0);
  stt.crowns = (stt.crowns || 0) + (run.won ? run.won.length : 0);
  stt.gold = (stt.gold || 0) + got[3];
  stt.km = (stt.km || 0) + (R.total / 1000);
  if (S.skin === 'night') stt.night = (stt.night || 0) + 1;
  if (S.weather && S.weather.rain > 0.3) stt.rain = (stt.rain || 0) + 1;
  var botWin = $('botRes') && /ganado/.test($('botRes').textContent); if (botWin) stt.botwins = (stt.botwins || 0) + 1;
  if (R.total > 4500) stt.long = (stt.long || 0) + 1;
  var cities = stt.cities || []; if (cities.indexOf(S.cityId) < 0) cities.push(S.cityId); stt.cities = cities;
  ls('sk_statsx', JSON.stringify(stt));
  checkAch();
  // revancha en un toque
  var again = $('again'); if (again) again.innerHTML = '⚡ Revancha';
}

// ============================================================== logros
var ACH = [
  ['first', '🏁', 'Primera vuelta', function(s){ return s.laps >= 1; }],
  ['crown1', '👑', 'Primera corona', function(s){ return s.crowns >= 1; }],
  ['crown10', '🎖️', '10 coronas', function(s){ return s.crowns >= 10; }],
  ['crown50', '⚜️', '50 coronas', function(s){ return s.crowns >= 50; }],
  ['crown200', '🤴', '200 coronas', function(s){ return s.crowns >= 200; }],
  ['clean', '✨', 'Vuelta limpia', function(s){ return s.clean >= 1; }],
  ['clean10', '💎', '10 vueltas limpias', function(s){ return s.clean >= 10; }],
  ['gold10', '🥇', '10 medallas de oro', function(s){ return s.gold >= 10; }],
  ['night', '🌙', 'Carrera de noche', function(s){ return s.night >= 1; }],
  ['rain', '🌧️', 'Carrera bajo la lluvia', function(s){ return s.rain >= 1; }],
  ['bots', '🏆', 'Ganar a los rivales', function(s){ return s.botwins >= 1; }],
  ['bots10', '🔥', 'Ganar 10 carreras', function(s){ return s.botwins >= 10; }],
  ['cities3', '🌍', '3 ciudades', function(s){ return (s.cities || []).length >= 3; }],
  ['km100', '🛣️', '100 km al volante', function(s){ return s.km >= 100; }],
  ['long', '🗺️', 'Carrera larga', function(s){ return s.long >= 1; }],
  ['taxi', '🚕', '10 carreras de taxi', function(s){ return s.taxi >= 10; }],
  ['cops', '🚓', 'Escapar de la policía', function(s){ return s.escapes >= 1; }],
  ['drift', '💨', '10.000 puntos de drift', function(s){ return s.driftBest >= 10000; }],
  ['deliver', '📦', 'Reparto perfecto', function(s){ return s.deliverAll >= 1; }],
  ['share', '📣', 'Compartir un reto', function(s){ return s.shares >= 1; }]
];
function checkAch(){
  var s = lj('sk_statsx', {}), have = lj('sk_ach', {}), nuevos = [];
  ACH.forEach(function(a){ if (!have[a[0]] && a[3](s)){ have[a[0]] = Date.now(); nuevos.push(a); } });
  if (nuevos.length){
    ls('sk_ach', JSON.stringify(have));
    nuevos.forEach(function(a, i){ setTimeout(function(){ toast('🏆 Logro: <b>' + a[1] + ' ' + esc(a[2]) + '</b>'); if (SK.sfx && SK.sfx.crown) SK.sfx.crown(); }, 900 + i * 1400); });
    if (A.NET && A.openDb) A.openDb().then(function(ok){ if (ok) A.NET.call('ach', { device: A.deviceId(), handle: A.getHandle(), ids: nuevos.map(function(a){ return a[0]; }) }, 12000); });
  }
  paintAch();
}
SK.stat = function(k, v, max){ var s = lj('sk_statsx', {}); s[k] = max ? Math.max(s[k] || 0, v) : (s[k] || 0) + (v == null ? 1 : v); ls('sk_statsx', JSON.stringify(s)); checkAch(); };
SK.achList = function(){ var have = lj('sk_ach', {}); return ACH.map(function(a){ return { id: a[0], icon: a[1], name: a[2], on: !!have[a[0]] }; }); };
var achBlock = el('<div class="block"><div class="eyebrow" id="achTitle">Logros</div><div class="ach" id="achGrid"></div></div>');
rail.insertBefore(achBlock, optBlock);
function paintAch(){
  var L = SK.achList(), n = L.filter(function(a){ return a.on; }).length;
  $('achTitle').textContent = 'Logros · ' + n + '/' + L.length;
  $('achGrid').innerHTML = L.map(function(a){ return '<i class="' + (a.on ? 'on' : '') + '" title="' + esc(a.name) + '">' + a.icon + '</i>'; }).join('');
}
paintAch();

// ============================================================== tutorial: 30 s y tu primera corona
var tut = el('<div id="tutOv"><b></b><span></span></div>'); $('stage').appendChild(tut);
function tip(t, s, ms){ tut.querySelector('b').textContent = t; tut.querySelector('span').textContent = s; tut.classList.add('on'); clearTimeout(tip.tm); tip.tm = setTimeout(function(){ tut.classList.remove('on'); }, ms || 4000); }
SK.tip = tip;
function startTutorial(){
  if (ls('sk_tut') || !S.G || !S.circuit) return false;
  // una calle sin rey cerca de la salida: la primera vuelta buena es tuya seguro
  var R = S.circuit, G = S.G, p0 = A.pointAt(R, 0), best = null;
  var C = G.CELL, gx = Math.floor(p0.x / C), gy = Math.floor(p0.y / C);
  for (var a = gx - 3; a <= gx + 3 && !best; a++) for (var b = gy - 3; b <= gy + 3 && !best; b++){
    var arr = G.grid.get(a*100000 + b); if (!arr) continue;
    for (var k = 0; k < arr.length; k++){
      var g = G.segs[arr[k]], nm = G.names[g[5]]; if (!nm) continue;
      if (S.kings[A.slug(nm)]) continue;
      var L = Math.hypot(g[2] - g[0], g[3] - g[1]); if (L < 60 || g[4] > 7) continue;
      best = g; break;
    }
  }
  if (!best) return false;
  ls('sk_tut', '1');
  var ux = (best[2] - best[0]), uy = (best[3] - best[1]), L2 = Math.hypot(ux, uy); ux /= L2; uy /= L2;
  var ax = best[0] - ux * 60, ay = best[1] - uy * 60, bx = best[2] + ux * 120, by = best[3] + uy * 120;
  S._tut = true; if (SK.bots) SK.bots.clear();
  A.raceLatLon(A.toLatLon(ax, ay), A.toLatLon(bx, by), '🎓 Tu primera corona', null).then(function(ok){
    if (!ok){ S._tut = false; return; }
    tip('Tu primera corona', COARSE ? 'Mantén GAS a la derecha y gira con el volante.' : 'Mantén ↑ para acelerar y gira con ← →.', 6000);
  });
  return true;
}
SK.startTutorial = startTutorial;
var tutPhase = null;
SK.post.push(function(){
  if (!S._tut) return;
  if (S.phase === 'run' && tutPhase !== 'run'){ tip('¡Ahora!', 'Sigue la línea naranja hasta la meta. La calle es tuya si llegas.', 5000); }
  if (S.phase === 'done' && tutPhase === 'run'){ S._tut = false; setTimeout(function(){ tip('👑 ¡Ya eres rey!', 'Esa calle lleva tu nombre. Ahora ve a por las de tus vecinos.', 7000); }, 2500); }
  tutPhase = S.phase;
});
setTimeout(function(){ if (!ls('sk_tut') && !ls('sk_laps_any') && !/[?&](g|a|daily|crew)=/.test(location.search + (function(){ try { return top.location.search; } catch(e){ return ''; } })())) startTutorial(); }, 6000);
SK.post.push(function(){ if (S.phase === 'done' && !ls('sk_laps_any')) ls('sk_laps_any', '1'); });

// ============================================================== carrera larga (5-8 km por varios barrios)
(function(){
  var gen = $('gen'); if (!gen) return;
  var b = el('<button class="btn ghost" id="genLong" type="button" style="margin-top:6px">🛣️ Carrera larga · 5-8 km por varios barrios</button>');
  gen.parentNode.insertBefore(b, gen.nextSibling);
  b.onclick = function(){
    var G = S.G; if (!G){ toast('Espera a que cargue la ciudad.', true); return; }
    var c = (A.CITIES[S.cityId] || {}).c; if (!c) return;
    var pc = A.proj(c), a = A.snap(G, pc[0] + (Math.random() - 0.5) * 900, pc[1] + (Math.random() - 0.5) * 900);
    if (a < 0) return;
    var cand = [];
    for (var n = 0; n < G.X.length; n += 3){
      if (G.comp && G.comp[n] !== G.main) continue;
      var d = Math.hypot(G.X[n] - G.X[a], G.Y[n] - G.Y[a]);
      if (d > 3200 && d < 5200) cand.push(n);
    }
    if (!cand.length){ toast('Esta zona no da para una carrera tan larga. Prueba en otra ciudad.', true); return; }
    var tries = 0;
    (function next(){
      var nb = cand[(Math.random() * cand.length) | 0]; if (tries++ > 5) return;
      A.raceLatLon(A.toLatLon(G.X[a], G.Y[a]), A.toLatLon(G.X[nb], G.Y[nb]), '🛣️ Gran recorrido: ' + A.nearestName(a) + ' → ' + A.nearestName(nb), null).then(function(ok){
        if (!ok) next(); else toast('🛣️ Gran recorrido de ' + (S.circuit.total / 1000).toFixed(1) + ' km. Muchas calles en juego.');
      });
    })();
  };
})();

// ============================================================== daños: abolladuras y cristal roto
var dmg = { n: 0, glass: null, lastHit: 0 };
function crackTex(){
  var c = document.createElement('canvas'); c.width = c.height = 256; var g = c.getContext('2d');
  g.strokeStyle = 'rgba(235,245,255,.85)'; g.lineWidth = 2;
  for (var i = 0; i < 16; i++){
    var a = Math.random() * 6.283, x = 128, y = 128; g.beginPath(); g.moveTo(x, y);
    for (var k = 0; k < 6; k++){ a += (Math.random() - 0.5) * 0.7; x += Math.cos(a) * 20; y += Math.sin(a) * 20; g.lineTo(x, y); }
    g.stroke();
  }
  g.strokeStyle = 'rgba(235,245,255,.5)'; g.lineWidth = 1;
  for (var r = 18; r < 110; r += 22){ g.beginPath(); g.arc(128, 128, r + Math.random() * 6, 0, 6.283); g.stroke(); }
  return new THREE.CanvasTexture(c);
}
SK.post.push(function(){
  if (!window.THREE || !SK.playerCar) return;
  var grp = SK.playerCar(); if (!grp) return;
  if (S.phase === 'count' && dmg.n){ SK.rebuildPlayerCar(); dmg.n = 0; dmg.glass = null; }
  var h = S.hit; if (!h || h.t === dmg.lastHit || S.phase !== 'run') return;
  dmg.lastHit = h.t; if (h.mag < 5 || !grp.userData.kenney) return;
  // abolladura: se hunde la chapa alrededor del punto del golpe
  var wp = new THREE.Vector3(h.x, 0.6, -h.y);
  grp.updateMatrixWorld(true);
  grp.traverse(function(o){
    if (!o.isMesh || !o.geometry || !o.geometry.attributes.position || /wheel/.test(o.name) || o.userData.noDent || o.isSprite) return;
    if (!o.userData.ownGeo){ o.geometry = o.geometry.clone(); o.userData.ownGeo = true; }
    var pos = o.geometry.attributes.position, v = new THREE.Vector3(), lp = o.worldToLocal(wp.clone());
    var sc = new THREE.Vector3(); o.getWorldScale(sc); var R2 = 0.9 / Math.max(0.2, sc.x), depth = Math.min(0.22, h.mag * 0.012) / Math.max(0.2, sc.x), moved = false;
    for (var i = 0; i < pos.count; i++){
      v.fromBufferAttribute(pos, i); var d = v.distanceTo(lp);
      if (d < R2){ var k = (1 - d / R2) * depth, dir = new THREE.Vector3(-v.x, 0, -v.z); if (dir.lengthSq() > 1e-6){ dir.normalize(); v.addScaledVector(dir, k); pos.setXYZ(i, v.x, v.y, v.z); moved = true; } }
    }
    if (moved){ pos.needsUpdate = true; o.geometry.computeVertexNormals(); }
  });
  dmg.n++;
  // luna trasera rota a partir del tercer golpe fuerte
  if (dmg.n >= 3 && !dmg.glass){
    var sp = grp.position.clone(), sr = grp.rotation.clone(); grp.position.set(0, 0, 0); grp.rotation.set(0, 0, 0); grp.updateMatrixWorld(true);
    var box = new THREE.Box3().setFromObject(grp), size = box.getSize(new THREE.Vector3()); grp.position.copy(sp); grp.rotation.copy(sr); grp.updateMatrixWorld(true);
    var pl = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.55), new THREE.MeshBasicMaterial({ map: crackTex(), transparent: true, depthWrite: false }));
    pl.userData.noDent = true;
    var L0 = box.min.x + 0.05;
    pl.position.set(L0 + size.x * 0.2, size.y * 0.8, 0); pl.rotation.set(0, -Math.PI / 2, 0); pl.rotateX(-0.5);
    grp.add(pl); dmg.glass = pl;
  }
});

// en la salida, todo limpio
SK.post.push(function(){ if (S.phase === 'ready' && S.paused){ S.paused = false; pov.classList.remove('on'); } });
})();
