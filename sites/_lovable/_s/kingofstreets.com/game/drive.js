/* King of Streets v3.1 — conducir de verdad.
   Móvil en horizontal a pantalla completa, volante y pedales analógicos, ayuda en curvas,
   navegador de giros, sonido de motor con marchas, vibración, semáforo de salida,
   velocímetro de aguja y efectos de velocidad. */
(function(){
'use strict';
var A = window.SK && SK.api; if (!A) return;
var S = A.S, $ = A.$;
function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch(e){ return null; } }
var COARSE = matchMedia('(pointer:coarse)').matches;
var LAND = matchMedia('(orientation: landscape)');
var body = document.body, stage = $('stage');
SK.pre = SK.pre || []; SK.post = SK.post || [];
SK.newControls = true;
S.pad = { gas: 0, brk: 0, steer: 0 };
function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
function wrap(a){ return Math.atan2(Math.sin(a), Math.cos(a)); }
function racing(){ return S.phase === 'run' || S.phase === 'count'; }

// ============================================================== estilos
var css = `
#ctl{position:absolute;inset:0;pointer-events:none;z-index:8;display:none}
body.touchui #ctl{display:block}
body.touchui #touch{display:none!important}
#wheel{position:absolute;left:max(14px,env(safe-area-inset-left));bottom:14px;width:var(--wh,150px);height:var(--wh,150px);pointer-events:auto;touch-action:none}
#wheel svg{width:100%;height:100%;display:block;filter:drop-shadow(0 6px 14px rgba(0,0,0,.45));transition:transform .06s linear}
#wheel.on svg{transition:none}
body.tilt #wheel{display:none}
.pedal{position:absolute;bottom:14px;pointer-events:auto;touch-action:none;border-radius:12px;
  background:linear-gradient(180deg,#3A4450,#1C232B);border:1px solid #56626E;box-shadow:0 6px 16px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.12);
  display:flex;align-items:flex-end;justify-content:center;overflow:hidden;user-select:none;-webkit-user-select:none}
.pedal::before{content:'';position:absolute;inset:8px 10px;background:repeating-linear-gradient(180deg,rgba(255,255,255,.14) 0 3px,transparent 3px 11px);border-radius:6px}
.pedal i{position:absolute;left:0;right:0;bottom:0;height:calc(var(--v,0)*100%);opacity:.55;transition:height .04s linear}
.pedal b{position:relative;font:700 12px var(--cond);letter-spacing:.16em;color:#E8EFF5;margin-bottom:8px;text-shadow:0 1px 3px #000}
#pedGas{right:max(14px,env(safe-area-inset-right));width:var(--gw,78px);height:var(--gh,150px)}
#pedGas i{background:linear-gradient(0deg,#3FD08A,#2A9E68)}
#pedBrk{right:calc(max(14px,env(safe-area-inset-right)) + var(--gw,78px) + 12px);width:var(--bw,96px);height:var(--bh,92px)}
#pedBrk i{background:linear-gradient(0deg,#FF4D6A,#C4203E)}
.pedal.on{transform:translateY(3px) scale(.98);border-color:#fff}
body.autogas #pedGas{opacity:.55}
body.autogas #pedGas b::after{content:' AUTO'}
#hudBtns{position:absolute;top:8px;left:max(8px,env(safe-area-inset-left));z-index:12;display:none;gap:6px}
body.touchui #hudBtns{display:flex}
#hudBtns button{width:40px;height:40px;border-radius:10px;border:1px solid var(--line);background:rgba(11,15,20,.8);color:var(--fg);font-size:17px;display:flex;align-items:center;justify-content:center;padding:0}
#bMenu{display:none!important}
body.land #bMenu{display:flex!important}
#gps{position:absolute;left:50%;top:84px;transform:translateX(-50%);z-index:9;display:none;align-items:center;gap:10px;
  background:rgba(11,15,20,.84);border:1px solid var(--line);border-radius:999px;padding:5px 14px 5px 6px;pointer-events:none;backdrop-filter:blur(6px);
  font-family:var(--cond);letter-spacing:.04em;color:var(--fg);white-space:nowrap;max-width:min(92vw,560px)}
#gps.on{display:flex}
#gps .ar{width:34px;height:34px;border-radius:50%;background:var(--trace);display:flex;align-items:center;justify-content:center;flex:none}
#gps .ar svg{width:24px;height:24px;transition:transform .2s}
#gps .ds{font:700 18px var(--mono)}
#gps .nm{font-size:15px;font-weight:600;overflow:hidden;text-overflow:ellipsis;text-transform:uppercase;color:var(--muted)}
#gps.soon .ar{background:#FFB020;animation:gpsPulse .5s ease-in-out infinite alternate}
@keyframes gpsPulse{to{transform:scale(1.12)}}
#gantry{position:absolute;left:50%;top:32%;transform:translate(-50%,-50%);display:none;gap:10px;padding:12px 16px;border-radius:12px;
  background:rgba(8,10,13,.9);border:2px solid #2A333D;z-index:11;box-shadow:0 10px 30px rgba(0,0,0,.5);pointer-events:none}
#gantry.on{display:flex}
#gantry span{width:clamp(26px,5vw,44px);height:clamp(26px,5vw,44px);border-radius:50%;background:#2A1216;box-shadow:inset 0 2px 6px rgba(0,0,0,.7)}
#gantry span.r{background:radial-gradient(circle at 40% 35%,#FF8A8A,#E0102A 55%,#7A0612);box-shadow:0 0 18px #FF2040}
#gantry.go span{background:radial-gradient(circle at 40% 35%,#B8FFD8,#1EC873 55%,#0A6A3A);box-shadow:0 0 18px #3FD08A}
body.counting #lights{visibility:hidden}
#speedo.gauge{padding:0!important;background:none!important;box-shadow:none!important;backdrop-filter:none!important}
#speedo.gauge .n,#speedo.gauge .u{display:none}
#gauge{display:block;width:var(--gz,132px);height:var(--gz,132px)}
#fx{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2}
#rotHint{position:absolute;left:50%;top:60px;transform:translateX(-50%);z-index:13;display:none;align-items:center;gap:10px;
  background:rgba(11,15,20,.92);border:1px solid var(--trace);border-radius:12px;padding:8px 10px 8px 12px;font-family:var(--cond);
  letter-spacing:.05em;text-transform:uppercase;font-size:13px;color:var(--fg);white-space:nowrap}
#rotHint .ic{font-size:22px;display:inline-block;animation:rot 1.6s ease-in-out infinite}
@keyframes rot{0%,30%{transform:rotate(0)}60%,100%{transform:rotate(-90deg)}}
#rotHint button{background:var(--trace);border:0;border-radius:8px;padding:7px 10px;font:700 12px var(--cond);letter-spacing:.1em;color:#180703}
body.touchui.portrait.racing #rotHint{display:flex}
/* ---------- móvil en horizontal: pantalla entera para conducir ---------- */
body.land #app{grid-template-columns:1fr;grid-template-rows:100%}
body.land #rail{position:fixed;left:0;top:0;bottom:0;width:min(360px,86vw);max-height:none;z-index:70;transform:translateX(-102%);
  transition:transform .22s ease;border-right:1px solid var(--line);border-top:0;box-shadow:12px 0 40px rgba(0,0,0,.5)}
body.land.menu #rail{transform:none}
body.land #scrim{display:block}
#scrim{display:none;position:fixed;inset:0;z-index:65;background:rgba(0,0,0,.45);opacity:0;pointer-events:none;transition:opacity .2s}
body.land.menu #scrim{opacity:1;pointer-events:auto}
body.land{--wh:min(40vh,168px);--gw:min(22vh,86px);--gh:min(44vh,168px);--bw:min(27vh,104px);--bh:min(27vh,100px);--gz:min(30vh,118px)}
body.land #clock{top:6px;padding:4px 14px 6px} body.land #clock .t{font-size:30px} body.land #clock .d{font-size:12px}
body.land #gps{top:66px}
body.land #plaque{display:none}
body.land #speedo{top:auto;left:50%;right:auto;bottom:8px;transform:translateX(-50%)}
body.land #mini{top:8px;right:max(8px,env(safe-area-inset-right));left:auto;bottom:auto;width:84px;height:84px}
body.land #timing{top:56px;left:max(8px,env(safe-area-inset-left));right:auto;width:150px}
body.land .sect:nth-child(n+4){display:none}
body.land .sect{font-size:10px;padding:3px 6px}
body.land #toasts{top:110px;bottom:auto;left:50%;right:auto;transform:translateX(-50%);width:min(46vw,380px)}
body.land #warn{top:112px;bottom:auto}
body.land #results{align-items:flex-start;padding:10px}
body.land #results .card{margin:auto}
body.land #challenge{top:112px}
body.land #pickbar{top:56px}
body.touchui.portrait{--wh:118px;--gw:66px;--gh:120px;--bw:80px;--bh:76px;--gz:92px}
body.touchui.portrait #plaque{bottom:150px}
body.touchui.portrait #toasts{bottom:150px}
body.touchui.portrait #gps{top:108px}
body.touchui.portrait #timing{display:none}
body.touchui.portrait #hudBtns{top:auto;bottom:calc(var(--gh) + 26px);left:auto;right:10px}
body.touchui.portrait #hudBtns button{width:36px;height:36px;font-size:15px}
body.touchui.portrait #rotHint{top:152px;font-size:11px;padding:5px 6px 5px 10px;gap:8px}
body.touchui.portrait #rotHint .ic{font-size:17px}
body.touchui.portrait #gps .ds{font-size:15px} body.touchui.portrait #gps .nm{font-size:12px}
body.touchui.portrait #gps .ar{width:28px;height:28px}
`;
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

// ============================================================== elementos
function el(html){ var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
var WHEEL_SVG = '<svg viewBox="0 0 200 200"><defs><radialGradient id="wg" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#3A4450"/><stop offset="1" stop-color="#11161B"/></radialGradient></defs>' +
  '<circle cx="100" cy="100" r="88" fill="none" stroke="#0B0F13" stroke-width="22"/><circle cx="100" cy="100" r="88" fill="none" stroke="url(#wg)" stroke-width="18"/>' +
  '<circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="2"/>' +
  '<path d="M100 100 L22 92 M100 100 L178 92 M100 100 L100 186" stroke="#1C232B" stroke-width="20" stroke-linecap="round"/>' +
  '<path d="M100 100 L22 92 M100 100 L178 92 M100 100 L100 186" stroke="#2E3842" stroke-width="12" stroke-linecap="round"/>' +
  '<circle cx="100" cy="100" r="26" fill="#1C232B" stroke="#56626E" stroke-width="2"/><text x="100" y="107" text-anchor="middle" font-size="20" fill="#F2C14E">👑</text>' +
  '<rect x="94" y="6" width="12" height="18" rx="3" fill="#FF5B3D"/></svg>';
var ctl = el('<div id="ctl"><div id="wheel" aria-label="Volante">' + WHEEL_SVG + '</div>' +
  '<div class="pedal" id="pedBrk" aria-label="Freno"><i></i><b>FRENO</b></div>' +
  '<div class="pedal" id="pedGas" aria-label="Acelerador"><i></i><b>GAS</b></div></div>');
stage.appendChild(ctl);
var hud = el('<div id="hudBtns"><button type="button" id="bMenu" aria-label="Menú">☰</button><button type="button" id="bMute" aria-label="Sonido">🔊</button>' +
  '<button type="button" id="bFull" aria-label="Pantalla completa">⛶</button></div>');
stage.appendChild(hud);
var gps = el('<div id="gps"><div class="ar"><svg viewBox="0 0 24 24"><path d="M12 3 L19 11 H14 V21 H10 V11 H5 Z" fill="#fff"/></svg></div><span class="ds"></span><span class="nm"></span></div>');
stage.appendChild(gps);
var gantry = el('<div id="gantry"><span></span><span></span><span></span><span></span><span></span></div>');
stage.appendChild(gantry);
var fx = el('<canvas id="fx"></canvas>'); stage.insertBefore(fx, $('mini'));
var rot = el('<div id="rotHint"><span class="ic">📱</span><span>Gira el móvil para conducir</span><button type="button" id="rotGo">Horizontal</button></div>');
stage.appendChild(rot);
var scrim = el('<div id="scrim"></div>'); $('app').appendChild(scrim);
var spd = $('speedo'); spd.classList.add('gauge');
var gcv = document.createElement('canvas'); gcv.id = 'gauge'; spd.appendChild(gcv);

// ============================================================== modos de pantalla
function layout(){
  body.classList.toggle('touchui', COARSE);
  body.classList.toggle('land', COARSE && LAND.matches);
  body.classList.toggle('portrait', COARSE && !LAND.matches);
  if (!(COARSE && LAND.matches)) body.classList.remove('menu');
  try { $('touch').classList.remove('on'); } catch(e){}
}
layout();
if (LAND.addEventListener) LAND.addEventListener('change', layout); else LAND.addListener(layout);
window.addEventListener('resize', layout);
$('bMenu').onclick = function(){ body.classList.toggle('menu'); };
scrim.onclick = function(){ body.classList.remove('menu'); };
function goFull(){
  var d = document.documentElement, p = null;
  try { p = (d.requestFullscreen ? d.requestFullscreen({ navigationUI: 'hide' }) : d.webkitRequestFullscreen && d.webkitRequestFullscreen()); } catch(e){}
  Promise.resolve(p).then(function(){ try { return screen.orientation.lock('landscape'); } catch(e){} }).catch(function(){});
  unlockAudio();
}
$('bFull').onclick = goFull;
$('rotGo').onclick = goFull;
// en móvil, al elegir carrera el menú se cierra solo
['gen', 'races', 'dailyBtn'].forEach(function(id){ var e = $(id); if (e) e.addEventListener('click', function(){ setTimeout(function(){ body.classList.remove('menu'); }, 60); }); });

// pantalla siempre encendida mientras corres
var wake = null;
function wakeOn(){
  if (wake || !navigator.wakeLock || document.hidden) return;
  navigator.wakeLock.request('screen').then(function(w){ wake = w; w.addEventListener('release', function(){ wake = null; }); }).catch(function(){});
}
function wakeOff(){ if (wake){ try { wake.release(); } catch(e){} wake = null; } }

// ============================================================== volante y pedales
var W = { id: null, x0: 0, v: 0 }, gasT = 0, brkT = 0, gasId = null, brkId = null;
var wheelEl = $('wheel'), gasEl = $('pedGas'), brkEl = $('pedBrk'), wsvg = wheelEl.querySelector('svg');
wheelEl.addEventListener('pointerdown', function(e){
  e.preventDefault(); unlockAudio();
  try { wheelEl.setPointerCapture(e.pointerId); } catch(err){}
  var r = wheelEl.getBoundingClientRect();
  W.id = e.pointerId; W.cx = r.left + r.width / 2; W.r = r.width / 2; wheelEl.classList.add('on'); move(e);
});
function move(e){
  if (e.pointerId !== W.id) return;
  W.v = clamp((e.clientX - W.cx) / (W.r * 0.85), -1, 1);          // derecha = gira a la derecha
}
wheelEl.addEventListener('pointermove', move);
function wheelUp(e){ if (e.pointerId !== W.id) return; W.id = null; W.v = 0; wheelEl.classList.remove('on'); }
wheelEl.addEventListener('pointerup', wheelUp); wheelEl.addEventListener('pointercancel', wheelUp);
function pedal(elm, set){
  elm.addEventListener('pointerdown', function(e){ e.preventDefault(); unlockAudio(); try { elm.setPointerCapture(e.pointerId); } catch(err){} set(1, e.pointerId); elm.classList.add('on'); buzz(8); });
  function up(e){ set(0, e.pointerId, true); elm.classList.remove('on'); }
  elm.addEventListener('pointerup', up); elm.addEventListener('pointercancel', up);
}
pedal(gasEl, function(v, id, up){ if (up && id !== gasId) return; gasT = v; gasId = v ? id : null; });
pedal(brkEl, function(v, id, up){ if (up && id !== brkId) return; brkT = v; brkId = v ? id : null; });
document.addEventListener('contextmenu', function(e){ if (e.target.closest && e.target.closest('#ctl')) e.preventDefault(); });

var shown = { steer: 0 };
SK.pre.push(function(dt){
  // el pedal no salta de 0 a 1: baja en ~0,2 s, como uno de verdad; el volante vuelve solo al centro
  var P = S.pad;
  P.gas += (gasT - P.gas) * Math.min(1, dt * (gasT > P.gas ? 9 : 14));
  P.brk += (brkT - P.brk) * Math.min(1, dt * (brkT > P.brk ? 12 : 16));
  var want = W.id !== null ? W.v : 0;
  shown.steer += (want - shown.steer) * Math.min(1, dt * (W.id !== null ? 30 : 10));
  P.steer = -shown.steer;
  if (Math.abs(P.steer) < 0.01) P.steer = 0;
  wsvg.style.transform = 'rotate(' + (shown.steer * 135).toFixed(1) + 'deg)';
  gasEl.style.setProperty('--v', (S.autoGas && P.brk < 0.05 ? 1 : P.gas).toFixed(3));
  brkEl.style.setProperty('--v', P.brk.toFixed(3));
  var cT = $('cTilt'); body.classList.toggle('tilt', !!(cT && cT.classList.contains('on')));
  body.classList.toggle('autogas', !!S.autoGas);
  body.classList.toggle('racing', racing());
  if (racing()) wakeOn(); else if (S.phase === 'done' || S.phase === 'idle') wakeOff();
  if (S.phase === 'count' && body.classList.contains('menu')) body.classList.remove('menu');
});

// ============================================================== ayuda en curvas
var assist = ls('sk_assist') ? ls('sk_assist') === '1' : COARSE;
SK.steerAssist = function(car, R, str){
  if (!assist || car.speed < 3) return str;
  var p = SK.dbg.pointAt(R, Math.min(R.total, car.prog + 9 + car.speed * 0.45));
  var err = wrap(Math.atan2(p.y - car.y, p.x - car.x) - car.h);
  if (Math.abs(err) < 0.1) return str;                         // en recta no toca nada: la dirección es tuya
  return clamp(str + clamp(err * 1.5, -1, 1) * 0.5, -1, 1);
};
(function(){
  var seg = document.querySelector('#ctlBlock .seg');
  if (!seg) return;
  var b = document.createElement('button'); b.type = 'button'; b.id = 'cAssist'; b.textContent = 'Ayuda en curvas';
  seg.appendChild(b);
  function paint(){ b.classList.toggle('on', assist); }
  b.onclick = function(){ assist = !assist; ls('sk_assist', assist ? '1' : '0'); paint(); };
  paint();
})();

// ============================================================== navegador de giros
var turns = null, turnsFor = null;
function buildTurns(R){
  var out = [], step = 5, prev = null;
  for (var d = 14; d < R.total - 14; d += step){
    var a = SK.dbg.pointAt(R, d - 12).h, b = SK.dbg.pointAt(R, d + 12).h, dh = wrap(b - a);
    if (Math.abs(dh) > 0.62){
      if (prev && d - prev.d2 <= step * 2){ prev.d2 = d; if (Math.abs(dh) > Math.abs(prev.ang)){ prev.ang = dh; prev.d = d; } }
      else { prev = { d: d, d2: d, ang: dh }; out.push(prev); }
    }
  }
  return out;
}
function sectAt(R, d){
  for (var i = 0; i < R.sect.length; i++) if (d < R.sect[i].d1) return R.sect[i];
  return R.sect[R.sect.length - 1];
}
var gpsAr = gps.querySelector('svg'), gpsDs = gps.querySelector('.ds'), gpsNm = gps.querySelector('.nm'), lastTurnWarn = -1;
function paintGps(){
  var R = S.circuit;
  if (!R || !S.car || !(racing() || S.phase === 'ready')){ gps.classList.remove('on'); return; }
  if (turnsFor !== R){ turns = buildTurns(R); turnsFor = R; lastTurnWarn = -1; }
  var p = S.car.prog, left = R.total - p, t = null;
  for (var i = 0; i < turns.length; i++) if (turns[i].d > p + 4){ t = turns[i]; break; }
  var ang = 0, dist, name, soon = false;
  if (t && t.d - p < 420){
    dist = t.d - p; ang = clamp(t.ang, -2.2, 2.2);
    var nx = sectAt(R, Math.min(R.total - 1, t.d + 25));
    name = nx ? nx.name : '';
    soon = dist < 70;
    if (soon && lastTurnWarn !== i && S.phase === 'run'){ lastTurnWarn = i; buzz(12); sfx.tick(); }
  } else if (left < 420){ dist = left; name = '🏁 Meta'; }
  else { dist = null; var cs = sectAt(R, p); name = cs ? cs.name : ''; }
  gpsAr.style.transform = 'rotate(' + (-ang * 57.3 * 0.85).toFixed(0) + 'deg)';
  gpsDs.textContent = dist == null ? '' : (dist > 95 ? Math.round(dist / 10) * 10 : Math.round(dist)) + ' m';
  gpsNm.textContent = name || '';
  gps.classList.toggle('soon', soon);
  gps.classList.add('on');
}

// ============================================================== vibración
function buzz(p){ try { if (COARSE && navigator.vibrate && localStorage.getItem('sk_vib') !== '0' && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(p); } catch(e){} }

// ============================================================== sonido
// Todo sintetizado en el navegador (nada que descargar): motor de 4 cilindros con varias capas,
// turbo, válvula de descarga, petardeo al soltar, cambio de marcha, derrape, grava, viento,
// ambiente de ciudad con cláxones y pájaros, y reverb de calle para que suene "entre edificios".
var AC = null, snd = null, muted = ls('sk_mute') === '1';
function paintMute(){ $('bMute').textContent = muted ? '🔇' : '🔊'; }
paintMute();
$('bMute').onclick = function(){ muted = !muted; ls('sk_mute', muted ? '1' : '0'); paintMute(); unlockAudio(); if (snd) snd.master.gain.setTargetAtTime(muted ? 0 : 0.9, AC.currentTime, 0.05); };
window.addEventListener('keydown', function(e){ if (e.key === 'm' || e.key === 'M'){ if (e.target.tagName !== 'INPUT') $('bMute').onclick(); } else unlockAudio(); });
window.addEventListener('pointerdown', unlockAudio, { passive: true });
function unlockAudio(){
  try {
    if (!AC){ var C = window.AudioContext || window.webkitAudioContext; if (!C) return; AC = new C(); buildSound(); }
    if (AC.state === 'suspended') AC.resume();
  } catch(e){}
}
function noiseBuf(brown){
  var b = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate), d = b.getChannelData(0), last = 0;
  for (var i = 0; i < d.length; i++){ var w = Math.random() * 2 - 1; if (brown){ last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
  return b;
}
function impulse(sec, decay){
  var n = Math.floor(AC.sampleRate * sec), b = AC.createBuffer(2, n, AC.sampleRate);
  for (var ch = 0; ch < 2; ch++){
    var d = b.getChannelData(ch);
    for (var i = 0; i < n; i++){ var t = i / n; d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * (i < 90 ? 0 : 1); }
  }
  return b;
}
function loopNoise(buf, rate){ var s = AC.createBufferSource(); s.buffer = buf; s.loop = true; if (rate) s.playbackRate.value = rate; s.start(); return s; }
function buildSound(){
  var m = AC.createGain(); m.gain.value = muted ? 0 : 0.9; m.connect(AC.destination);
  var comp = AC.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.connect(m);
  var rev = AC.createConvolver(); rev.buffer = impulse(1.6, 3.2);
  var wet = AC.createGain(); wet.gain.value = 0.2; rev.connect(wet); wet.connect(comp);
  var bus = AC.createGain(); bus.connect(comp); bus.connect(rev);            // todo lo que suena pasa por aquí: seco + reverb
  // --- motor
  var eg = AC.createGain(); eg.gain.value = 0;
  var lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; lp.Q.value = 4;
  var ws = AC.createWaveShaper(), curve = new Float32Array(512);
  for (var i = 0; i < 512; i++){ var x = i / 256 - 1; curve[i] = Math.tanh(x * 2.6) * 0.9; }
  ws.curve = curve; ws.oversample = '2x';
  var o1 = AC.createOscillator(); o1.type = 'sawtooth';
  var o2 = AC.createOscillator(); o2.type = 'sawtooth'; o2.detune.value = 7;
  var o3 = AC.createOscillator(); o3.type = 'sine';
  var g1 = AC.createGain(); g1.gain.value = 0.55; var g2 = AC.createGain(); g2.gain.value = 0.22; var g3 = AC.createGain(); g3.gain.value = 0.7;
  o1.connect(g1); g1.connect(ws); o2.connect(g2); g2.connect(ws); o3.connect(g3); g3.connect(lp);
  ws.connect(lp); lp.connect(eg); eg.connect(bus);
  // pulso del ralentí: una modulación lenta del volumen del motor
  var lfo = AC.createOscillator(); lfo.type = 'sine'; var lfoG = AC.createGain(); lfoG.gain.value = 0; lfo.connect(lfoG); lfoG.connect(eg.gain);
  // retumbe grave del escape
  var nb = noiseBuf(false), bb = noiseBuf(true);
  var rum = loopNoise(bb), rl = AC.createBiquadFilter(); rl.type = 'lowpass'; rl.frequency.value = 160;
  var rg = AC.createGain(); rg.gain.value = 0; rum.connect(rl); rl.connect(rg); rg.connect(bus);
  // turbo
  var tu = AC.createOscillator(); tu.type = 'sine'; var tg = AC.createGain(); tg.gain.value = 0; tu.connect(tg); tg.connect(bus);
  o1.start(); o2.start(); o3.start(); lfo.start(); tu.start();
  // derrape: dos bandas que tiemblan
  var sq = loopNoise(nb), b1 = AC.createBiquadFilter(); b1.type = 'bandpass'; b1.frequency.value = 1700; b1.Q.value = 9;
  var b2 = AC.createBiquadFilter(); b2.type = 'bandpass'; b2.frequency.value = 2500; b2.Q.value = 7;
  var sg = AC.createGain(); sg.gain.value = 0; sq.connect(b1); sq.connect(b2); b1.connect(sg); b2.connect(sg); sg.connect(bus);
  // viento y rodadura
  var wn = loopNoise(nb, 0.7), wl = AC.createBiquadFilter(); wl.type = 'lowpass'; wl.frequency.value = 520;
  var wg = AC.createGain(); wg.gain.value = 0; wn.connect(wl); wl.connect(wg); wg.connect(comp);
  // grava al salirse de la calzada
  var gv = loopNoise(nb, 0.45), gl = AC.createBiquadFilter(); gl.type = 'bandpass'; gl.frequency.value = 900; gl.Q.value = 0.8;
  var gg = AC.createGain(); gg.gain.value = 0; gv.connect(gl); gl.connect(gg); gg.connect(bus);
  // ambiente de ciudad
  var am = loopNoise(bb, 0.6), al = AC.createBiquadFilter(); al.type = 'lowpass'; al.frequency.value = 420;
  var ag = AC.createGain(); ag.gain.value = 0; am.connect(al); al.connect(ag); ag.connect(comp);
  // v5: rodadura de neumáticos, roce contra la pared y lluvia
  var ro = loopNoise(bb, 1.3), rlp = AC.createBiquadFilter(); rlp.type = 'lowpass'; rlp.frequency.value = 300;
  var rog = AC.createGain(); rog.gain.value = 0; ro.connect(rlp); rlp.connect(rog); rog.connect(bus);
  var scr = loopNoise(nb, 0.9), sb1 = AC.createBiquadFilter(); sb1.type = 'bandpass'; sb1.frequency.value = 2600; sb1.Q.value = 1.4;
  var scg = AC.createGain(); scg.gain.value = 0; scr.connect(sb1); sb1.connect(scg); scg.connect(bus);
  var rn = loopNoise(nb, 1), rh = AC.createBiquadFilter(); rh.type = 'highpass'; rh.frequency.value = 1100;
  var rlo = AC.createBiquadFilter(); rlo.type = 'lowpass'; rlo.frequency.value = 7500;
  var rng = AC.createGain(); rng.gain.value = 0; rn.connect(rh); rh.connect(rlo); rlo.connect(rng); rng.connect(comp);
  snd = { master: m, bus: bus, comp: comp, eg: eg, lp: lp, o1: o1, o2: o2, o3: o3, lfo: lfo, lfoG: lfoG, rg: rg, tu: tu, tg: tg,
          sg: sg, b1: b1, b2: b2, wg: wg, wl: wl, gg: gg, ag: ag, nb: nb, rog: rog, rlp: rlp, scg: scg, sb1: sb1, rng: rng, wet: wet, wk: null };
  // motor de combustión de verdad (AudioWorklet); si el navegador no lo tiene, queda el de osciladores
  try {
    if (AC.audioWorklet && window.AudioWorkletNode){
      AC.audioWorklet.addModule('engine-worklet.js').then(function(){
        var wk = new AudioWorkletNode(AC, 'sk-engine', { numberOfInputs: 0, outputChannelCount: [2], processorOptions: { profile: engineName() } }); eng.prof = engineName();
        var wg2 = AC.createGain(); wg2.gain.value = 0.55; var wlp = AC.createBiquadFilter(); wlp.type = 'lowpass'; wlp.frequency.value = 6000; wlp.Q.value = 0.5;
        wk.connect(wlp); wlp.connect(wg2); wg2.connect(bus); snd.wlp = wlp; snd.wg2 = wg2;
        snd.wk = wk; snd.wkP = { rpm: wk.parameters.get('rpm'), load: wk.parameters.get('load'), vol: wk.parameters.get('vol'), crackle: wk.parameters.get('crackle') };
      }).catch(function(){});
    }
  } catch(e){}
}
function env(node, t, a, peak, d){ node.gain.setValueAtTime(0.0001, t); node.gain.exponentialRampToValueAtTime(peak, t + a); node.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
function beep(f, dur, vol, type, pan){
  if (!AC || !snd || muted) return;
  var o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
  o.type = type || 'square'; o.frequency.value = f;
  env(g, t, 0.01, vol || 0.18, dur);
  o.connect(g);
  if (pan && AC.createStereoPanner){ var p = AC.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(snd.bus); } else g.connect(snd.bus);
  o.start(t); o.stop(t + dur + 0.08);
}
function burst(filterType, freq, q, vol, dur, when){
  if (!AC || !snd || muted) return;
  var s = AC.createBufferSource(); s.buffer = snd.nb; s.playbackRate.value = 0.8 + Math.random() * 0.4;
  var f = AC.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q;
  var g = AC.createGain(), t = AC.currentTime + (when || 0);
  env(g, t, 0.004, vol, dur);
  s.connect(f); f.connect(g); g.connect(snd.bus); s.start(t, Math.random()); s.stop(t + dur + 0.05);
}
function thump(f, vol, dur, when){
  if (!AC || !snd || muted) return;
  var o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + (when || 0);
  o.type = 'sine'; o.frequency.setValueAtTime(f * 1.6, t); o.frequency.exponentialRampToValueAtTime(f, t + dur);
  env(g, t, 0.005, vol, dur); o.connect(g); g.connect(snd.bus); o.start(t); o.stop(t + dur + 0.05);
}
var sfx = {
  light: function(){ beep(440, 0.16, 0.16); },
  go: function(){ beep(880, 0.42, 0.22); },
  tick: function(){ beep(1320, 0.05, 0.06, 'sine'); },
  shift: function(){ thump(95, 0.12, 0.07); burst('highpass', 3000, 0.7, 0.03, 0.04); },
  pops: function(){ var n = 3 + Math.floor(Math.random() * 4); for (var i = 0; i < n; i++){ var w = 0.05 + i * (0.06 + Math.random() * 0.07); burst('bandpass', 700 + Math.random() * 600, 1.2, 0.22, 0.05, w); thump(70, 0.16, 0.06, w); } },
  blowoff: function(){ burst('highpass', 1600, 0.5, 0.09, 0.38); },
  hit: function(){ thump(55, 0.35, 0.22); burst('lowpass', 500, 0.7, 0.2, 0.18); },
  horn: function(){ var p = Math.random() * 1.6 - 0.8; beep(415, 0.34, 0.03, 'square', p); beep(520, 0.34, 0.025, 'square', p); },
  bird: function(){
    if (!AC || !snd || muted) return;
    var o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime, f = 3200 + Math.random() * 1800;
    o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.35, t + 0.08); o.frequency.exponentialRampToValueAtTime(f * 0.9, t + 0.16);
    env(g, t, 0.01, 0.012, 0.16); o.connect(g); g.connect(snd.bus); o.start(t); o.stop(t + 0.25);
  },
  cheer: function(){
    if (!AC || !snd || muted) return;
    var s = AC.createBufferSource(); s.buffer = snd.nb; var f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 0.6;
    var g = AC.createGain(), t = AC.currentTime; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.13, t + 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
    s.connect(f); f.connect(g); g.connect(snd.bus); s.start(t); s.stop(t + 3);
  },
  crown: function(){ sfx.cheer(); [784, 988, 1175, 1568].forEach(function(f, i){ setTimeout(function(){ beep(f, 0.24, 0.12, 'triangle'); }, i * 110); }); },
  finish: function(){ [523, 659, 784].forEach(function(f, i){ setTimeout(function(){ beep(f, 0.3, 0.12, 'triangle'); }, i * 90); }); }
};
sfx.horn2 = function(){
  if (!AC || !snd || muted) return;
  var t = AC.currentTime, g = AC.createGain(); env(g, t, 0.02, 0.2, 0.5); g.connect(snd.bus);
  [392, 494].forEach(function(f){ var o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; var l = AC.createBiquadFilter(); l.type = 'lowpass'; l.frequency.value = 1800; o.connect(l); l.connect(g); o.start(t); o.stop(t + 0.55); });
};
SK.sfx = sfx; SK.buzz = buzz; SK.unlockAudio = unlockAudio; SK.crashSfx = function(m, k){ crash(m, k); }; SK.audioCtx = function(){ return AC && snd && !muted ? AC : null; }; SK.audioBus = function(){ return snd ? snd.bus : null; };
SK.sndState = function(){ return { ctx: AC ? AC.state : null, wk: !!(snd && snd.wk), rpm: Math.round(eng.rpm), gear: eng.gear }; };
window.addEventListener('keydown', function(e){ if ((e.key === 'h' || e.key === 'H') && e.target.tagName !== 'INPUT'){ unlockAudio(); sfx.horn2(); } });
var GEARS = [0, 11, 19, 27, 35, 52];
function gearOf(v){ for (var g = 1; g < GEARS.length - 1; g++) if (v < GEARS[g]) return g; return GEARS.length - 1; }
// cada coche su motor (mismo rendimiento, distinto sonido)
var ENGINES = {
  i4:  { idle: 850, max: 8000 }, i4t: { idle: 850, max: 7000 }, i3: { idle: 900, max: 7200 }, dsl: { idle: 760, max: 4700 },
  v6:  { idle: 780, max: 7200 }, v8: { idle: 700, max: 6800 }, v8r: { idle: 900, max: 8800 }, ev: { idle: 0, max: 11000, ev: 1 }
};
var ENGINE_OF = { sedan: 'i4', 'sedan-sports': 'i4t', 'hatchback-sports': 'i3', suv: 'v6', 'suv-luxury': 'v8', taxi: 'dsl',
  police: 'v8', race: 'v8r', 'race-future': 'ev', van: 'dsl' };
function engineName(){ var k = SK.carId ? SK.carId(S.carKind || 'sedan') : S.carKind; return ENGINE_OF[k] || 'i4'; }
SK.engineName = engineName;
var ENG_LABEL = { i4: '4 cil.', i4t: '4 turbo', i3: '3 cil. turbo', dsl: 'diésel', v6: 'V6', v8: 'V8', v8r: 'V8 carreras', ev: 'eléctrico' };
SK.engineLabel = function(id){ return ENG_LABEL[ENGINE_OF[SK.carId ? SK.carId(id) : id] || 'i4']; };
var eng = { rpm: 900, gear: 1, thr: 0, prof: null, ambT: 4, wasOff: false, blip: 0, lim: 0, crk: 0, dens: 0.3, densT: 0, lastHit: 0, kerb: false, pass: {} };
function crash(mag, kind){
  if (!AC || !snd || muted) return;
  var v = Math.min(1, mag / 14);
  thump(kind === 1 ? 48 : 70, 0.18 + v * 0.3, 0.28 + v * 0.2);
  var fr = kind === 1 ? [170, 410, 960, 2300] : [260, 620, 1500, 3300];
  fr.forEach(function(f, i){ burst('bandpass', f * (0.9 + Math.random() * 0.2), 7 + i * 2, (0.1 + v * 0.22) / (1 + i * 0.4), 0.18 + v * 0.35 - i * 0.03, i * 0.006); });
  burst('lowpass', 900, 0.7, 0.12 + v * 0.2, 0.12);
  if (mag > 9){ for (var k = 0; k < 7; k++) burst('highpass', 4200 + Math.random() * 3000, 3, 0.05 + Math.random() * 0.05, 0.05, 0.03 + Math.random() * 0.25); }
  buzz(kind === 1 ? [40 + Math.round(v * 60)] : [30]);
}
function whoosh(){
  if (!AC || !snd || muted) return;
  var s2 = AC.createBufferSource(); s2.buffer = snd.nb; var f = AC.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
  var g = AC.createGain(), t = AC.currentTime;
  f.frequency.setValueAtTime(1500, t); f.frequency.exponentialRampToValueAtTime(380, t + 0.6);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.14, t + 0.18); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
  s2.connect(f); f.connect(g); g.connect(snd.bus); s2.start(t, Math.random()); s2.stop(t + 0.75);
}
function density(){
  // cuántos edificios hay a menos de 35 m: calle estrecha = mucho eco; plaza abierta = poco
  var D = S.decor, car = S.car; if (!D || !D.grid || !car) return 0.3;
  var C = D.CELL, arr = D.grid.get(Math.floor(car.x / C) * 100000 + Math.floor(car.y / C)), n = 0;
  if (arr) for (var i = 0; i < arr.length; i++){ var P = D.polys[arr[i]]; if (P.k === 1 && Math.abs(P.cx - car.x) < 35 && Math.abs(P.cy - car.y) < 35) n++; }
  return clamp(n / 14, 0, 1);
}
function engineStep(dt){
  var car = S.car, on = !!car && (racing() || S.phase === 'ready' || S.phase === 'replay');
  var v = car ? Math.abs(car.vf != null ? car.vf : car.speed) : 0, thr = Math.max(0, S.thrOut || 0);
  if (S.phase === 'count') thr = Math.max(thr, (S.pad.gas || (S.gp && S.gp.gas) || (S.keys.up ? 1 : 0)) * 0.9);   // acelerar en parado en la salida
  if (car && car.rw) thr = 0;
  var pn = engineName(), E = ENGINES[pn];
  if (snd && snd.wk && eng.prof !== pn){ snd.wk.port.postMessage({ profile: pn }); eng.prof = pn; }
  eng.max = E.max;
  var g = gearOf(v), lo = GEARS[g - 1], hi = GEARS[g], span = E.max - 400 - 1400 * E.max / 8200;
  var target = E.ev ? 300 + v / 46 * E.max * 0.95 + thr * 200
    : v < 1 ? E.idle + thr * (E.max * 0.55) : 1400 * E.max / 8200 + clamp((v - lo) / (hi - lo), 0, 1) * span + thr * 300;
  if (E.ev) g = 1;
  if (g !== eng.gear){
    if (g > eng.gear){ eng.shift = 0.12; sfx.shift(); }
    else if (v > 5){ eng.blip = 0.16; }                                           // punta-tacón al reducir
    eng.gear = g;
  }
  if (eng.blip > 0){ eng.blip -= dt; target += 1100; }
  eng.rpm += (target - eng.rpm) * Math.min(1, dt * (target > eng.rpm ? 6 : 4));
  if (eng.shift > 0){ eng.shift -= dt; eng.rpm -= 1800 * dt * 6; }
  eng.rpm = clamp(eng.rpm, E.ev ? 0 : E.idle * 0.9, E.max + 200);
  // corte de inyección al tope de vueltas
  var load = thr;
  if (!E.ev && eng.rpm > E.max - 350 && thr > 0.8){ eng.lim += dt; if ((eng.lim % 0.11) < 0.05) load = 0; } else eng.lim = 0;
  if (eng.shift > 0) load = 0.05;
  if (eng.blip > 0) load = Math.max(load, 0.55);
  // soltar el gas arriba de vueltas: válvula y petardeo (y llamarada del escape)
  if (S.phase === 'run' && !E.ev && eng.thr > 0.7 && thr < 0.2 && eng.rpm > E.max * 0.52){
    if (pn === 'i4t' || pn === 'i3' || pn === 'dsl') sfx.blowoff(); eng.crk = 1.4;
    if (eng.rpm > E.max * 0.64 && pn !== 'dsl' && Math.random() < 0.8){ if (snd && snd.wk) snd.wk.port.postMessage({ pop: 1 }); else sfx.pops(); S.popT = performance.now(); }
  }
  if (eng.crk > 0) eng.crk -= dt;
  eng.thr = thr;
  if (!snd) return;
  var t = AC.currentTime, f = eng.rpm / 60 * 2;                                   // 4 cilindros: dos explosiones por vuelta
  var vol = on ? (0.05 + 0.1 * thr + eng.rpm / 8200 * 0.06) * (eng.shift > 0 ? 0.45 : 1) : 0;
  if (snd.wk){
    snd.eg.gain.setTargetAtTime(0, t, 0.05); snd.lfoG.gain.setTargetAtTime(0, t, 0.05);
    snd.wkP.rpm.setTargetAtTime(eng.rpm, t, 0.02);
    snd.wkP.load.setTargetAtTime(on ? load : 0, t, 0.015);
    snd.wkP.vol.setTargetAtTime(on ? 0.9 : 0, t, 0.08);
    snd.wkP.crackle.setTargetAtTime(eng.crk > 0 ? 0.7 : 0, t, 0.05);
    // perspectiva: desde el capó se oye más motor y admisión; desde fuera, el escape algo apagado; en plano, lejos
    if (snd.wlp){ snd.wlp.frequency.setTargetAtTime(S.view === 'hood' ? 11000 : S.view === 'top' ? 2200 : 6500, t, 0.2);
                  snd.wg2.gain.setTargetAtTime(S.view === 'top' ? 0.3 : S.lookBack ? 0.75 : 0.55, t, 0.2); }
    snd.rg.gain.setTargetAtTime(on ? 0.015 + load * 0.04 : 0, t, 0.08);
  } else {
    snd.o1.frequency.setTargetAtTime(f, t, 0.03); snd.o2.frequency.setTargetAtTime(f * 2, t, 0.03); snd.o3.frequency.setTargetAtTime(f * 0.5, t, 0.03);
    snd.lfo.frequency.setTargetAtTime(f * 0.25, t, 0.05);
    snd.lp.frequency.setTargetAtTime(420 + eng.rpm * 0.34 + thr * 1100, t, 0.05);
    snd.eg.gain.setTargetAtTime(vol, t, 0.06);
    snd.lfoG.gain.setTargetAtTime(on ? vol * clamp((2200 - eng.rpm) / 1300, 0, 1) * 0.5 : 0, t, 0.1);
    snd.rg.gain.setTargetAtTime(on ? 0.05 + thr * 0.16 * clamp(eng.rpm / 5000, 0.3, 1) : 0, t, 0.08);
  }
  snd.tu.frequency.setTargetAtTime(1500 + eng.rpm * 0.42, t, 0.1);
  snd.tg.gain.setTargetAtTime(on ? load * clamp((eng.rpm - 2500) / 5000, 0, 1) * 0.018 : 0, t, 0.15);
  var slide = car ? Math.abs(car.vl || 0) : 0, squeal = on && S.phase === 'run' ? clamp((slide - 2.4) / 5, 0, 1) : 0;
  if (S.hbOut && v > 6) squeal = Math.max(squeal, 0.5);
  if (S.thrOut < -0.8 && v > 18) squeal = Math.max(squeal, 0.25);            // frenazo fuerte
  if (S.wet) squeal *= 0.5;
  snd.sg.gain.setTargetAtTime(squeal * 0.16, t, 0.05);
  snd.b1.frequency.setTargetAtTime(1500 + Math.random() * 400, t, 0.02); snd.b2.frequency.setTargetAtTime(2300 + Math.random() * 500, t, 0.02);
  // viento: crece con el cuadrado de la velocidad y se vuelve más agudo
  var vk = clamp(v / 46, 0, 1);
  snd.wg.gain.setTargetAtTime(on ? vk * vk * 0.14 : 0, t, 0.1);
  snd.wl.frequency.setTargetAtTime(280 + v * 26, t, 0.1);
  // neumáticos sobre el asfalto (más ruido en mojado, retumbe en bordillo y adoquín)
  var rough = car && (car.kerb || car.off > 0) ? 1 : S.cobble ? 0.55 : 0;
  snd.rog.gain.setTargetAtTime(on ? clamp(v / 30, 0, 1) * (0.05 + rough * 0.08 + (S.wet ? 0.04 : 0)) : 0, t, 0.06);
  snd.rlp.frequency.setTargetAtTime(160 + v * 10 + rough * 500 + (S.wet ? 1400 : 0), t, 0.08);
  var off = car && car.off > 0 && S.phase === 'run';
  snd.gg.gain.setTargetAtTime(off ? clamp(v / 20, 0, 1) * 0.12 : 0, t, 0.05);
  if (off && !eng.wasOff && v > 14) sfx.hit();
  eng.wasOff = off;
  var kerb = !!(car && car.kerb);
  if (kerb && !eng.kerb && v > 5 && S.phase === 'run'){ thump(95, 0.16, 0.1); buzz(12); }
  eng.kerb = kerb;
  // choques y roce
  if (S.hit && S.hit.t !== eng.lastHit){ eng.lastHit = S.hit.t; crash(S.hit.mag, S.hit.kind); }
  var scraping = S.scrape && performance.now() - S.scrape.t < 90 && S.scrape.v > 2;
  snd.scg.gain.setTargetAtTime(scraping ? clamp(S.scrape.v / 20, 0.1, 1) * 0.12 : 0, t, 0.04);
  snd.sb1.frequency.setTargetAtTime(1800 + Math.random() * 1600, t, 0.02);
  // lluvia
  var rainK = S.weather && S.weather.rain > 0.12 && !S.weather.snow ? S.weather.rain : 0;
  snd.rng.gain.setTargetAtTime(rainK * 0.07, t, 0.4);
  // eco según lo estrecha que sea la calle
  eng.densT -= dt;
  if (eng.densT <= 0){ eng.densT = 0.5; eng.dens = density(); snd.wet.gain.setTargetAtTime(0.06 + eng.dens * 0.3, t, 0.4); }
  // coches que te pasan cerca
  var L = SK.solidCars ? SK.solidCars() : null;
  if (L && car && on && S.phase === 'run'){
    for (var i = 0; i < L.length; i += 4){
      if (L[i+3] < 0) continue;
      var d = Math.hypot(L[i] - car.x, L[i+1] - car.y), id = L[i+3];
      if (d < 7 && car.speed > 9 && !eng.pass[id]){ eng.pass[id] = 1; whoosh(); }
      else if (d > 20) eng.pass[id] = 0;
    }
  }
  // ciudad: rumor de fondo, cláxones lejanos y pájaros de día
  var city = S.view !== 'top' && !!S.G;
  snd.ag.gain.setTargetAtTime(city ? 0.035 : 0, t, 0.5);
  eng.ambT -= dt;
  if (city && eng.ambT <= 0){
    eng.ambT = 6 + Math.random() * 14;
    if (Math.random() < 0.45) sfx.horn();
    else if (S.skin !== 'night' && !rainK){ sfx.bird(); setTimeout(sfx.bird, 180); }
  }
}

// ============================================================== semáforo de salida
var litShown = -1, wasPhase = null, offT = 0, wasOff = false, wasSlide = false;
function paintLights(){
  var spans = gantry.children;
  if (S.phase === 'count'){
    body.classList.add('counting');
    var el = performance.now() - S.started, n = Math.min(5, Math.floor(el / 480) + (el > 120 ? 1 : 0));
    gantry.classList.add('on'); gantry.classList.remove('go');
    for (var i = 0; i < 5; i++) spans[i].classList.toggle('r', i < n);
    if (n !== litShown && n > 0){ litShown = n; sfx.light(); buzz(14); }
  } else {
    body.classList.remove('counting');
    if (wasPhase === 'count' && S.phase === 'run'){
      gantry.classList.add('go'); for (var j = 0; j < 5; j++) spans[j].classList.remove('r');
      sfx.go(); buzz(70);
      setTimeout(function(){ gantry.classList.remove('on', 'go'); }, 650);
    } else if (S.phase !== 'run') gantry.classList.remove('on', 'go');
    litShown = -1;
  }
  if (wasPhase === 'run' && S.phase === 'done'){ sfx.finish(); buzz([40, 60, 40]); }
  wasPhase = S.phase;
}
function hapticsStep(dt){
  if (S.phase !== 'run' || !S.car) return;
  var off = S.car.off > 0;
  if (off){ offT -= dt; if (!wasOff || offT <= 0){ buzz(off && !wasOff ? 30 : 8); offT = 0.35; } }
  wasOff = off;
  var slide = Math.abs(S.car.vl || 0) > 3.2 && S.car.speed > 10;
  if (slide && !wasSlide) buzz(15);
  wasSlide = slide;
}

// ============================================================== velocímetro de aguja
function paintGauge(){
  var r = gcv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
  var W2 = Math.round(r.width * d); if (!W2) return;
  if (gcv.width !== W2){ gcv.width = W2; gcv.height = W2; }
  var g = gcv.getContext('2d'), c = W2 / 2, R2 = c * 0.9;
  g.clearRect(0, 0, W2, W2);
  g.fillStyle = 'rgba(11,15,20,.84)'; g.beginPath(); g.arc(c, c, c * 0.98, 0, 6.283); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = d; g.stroke();
  var MX = (eng.max || 8200) + 300, a0 = Math.PI * 0.75, a1 = Math.PI * 2.25, rpm = eng.rpm, frac = (rpm - 0) / MX;
  g.lineCap = 'butt'; g.lineWidth = c * 0.1;
  g.strokeStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.arc(c, c, R2 - c * 0.06, a0, a1); g.stroke();
  g.strokeStyle = '#C4203E'; g.beginPath(); g.arc(c, c, R2 - c * 0.06, a0 + (a1 - a0) * ((MX - 1500) / MX), a1); g.stroke();
  var grd = g.createLinearGradient(0, W2, W2, 0); grd.addColorStop(0, '#3FD08A'); grd.addColorStop(0.7, '#F2C14E'); grd.addColorStop(1, '#FF5B3D');
  g.strokeStyle = grd; g.beginPath(); g.arc(c, c, R2 - c * 0.06, a0, a0 + (a1 - a0) * clamp(frac, 0, 1)); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = Math.max(1, d);
  for (var k = 0; k * 1000 <= MX; k++){
    var a = a0 + (a1 - a0) * (k * 1000 / MX), i0 = R2 - c * 0.2, i1 = R2 - c * 0.12;
    g.beginPath(); g.moveTo(c + Math.cos(a) * i0, c + Math.sin(a) * i0); g.lineTo(c + Math.cos(a) * i1, c + Math.sin(a) * i1); g.stroke();
  }
  var an = a0 + (a1 - a0) * clamp(frac, 0, 1);
  g.strokeStyle = '#FF5B3D'; g.lineWidth = c * 0.045; g.lineCap = 'round';
  g.beginPath(); g.moveTo(c - Math.cos(an) * c * 0.12, c - Math.sin(an) * c * 0.12); g.lineTo(c + Math.cos(an) * (R2 - c * 0.16), c + Math.sin(an) * (R2 - c * 0.16)); g.stroke();
  g.fillStyle = '#1C232B'; g.beginPath(); g.arc(c, c, c * 0.08, 0, 6.283); g.fill();
  var kmh = S.car ? Math.round(S.car.speed * 3.6) : 0;
  g.fillStyle = '#F2F6FA'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '700 ' + Math.round(c * 0.42) + 'px "JetBrains Mono", monospace'; g.fillText(kmh, c, c + c * 0.3);
  g.fillStyle = '#8296A8'; g.font = '600 ' + Math.round(c * 0.14) + 'px "JetBrains Mono", monospace'; g.fillText('KM/H', c, c + c * 0.58);
  g.fillStyle = '#F2C14E'; g.font = '700 ' + Math.round(c * 0.24) + 'px "Barlow Condensed", sans-serif';
  g.fillText(S.car && S.car.vf < -0.5 ? 'R' : kmh < 2 && !(S.thrOut > 0) ? 'N' : (ENGINES[engineName()].ev ? 'E' : String(eng.gear)), c, c - c * 0.3);
}

// ============================================================== efectos de velocidad
var fxc = fx.getContext('2d'), streaks = [];
for (var q = 0; q < 46; q++) streaks.push({ a: Math.random() * 6.283, r: Math.random(), l: 0.3 + Math.random() * 0.5, w: 0.5 + Math.random() * 1.6 });
function paintFx(dt){
  var r = stage.getBoundingClientRect(), Wd = Math.round(r.width / 2), Hd = Math.round(r.height / 2);
  if (fx.width !== Wd || fx.height !== Hd){ fx.width = Wd; fx.height = Hd; }
  fxc.clearRect(0, 0, Wd, Hd);
  if (S.view === 'top' || !S.car || !(racing() || S.phase === 'replay')) return;
  var k = clamp((S.car.speed - 24) / 20, 0, 1);
  if (k <= 0) return;
  var cx = Wd / 2, cy = Hd * 0.46, R0 = Math.hypot(Wd, Hd) * 0.5;
  fxc.lineCap = 'round';
  for (var i = 0; i < streaks.length; i++){
    var s = streaks[i];
    s.r += dt * (0.9 + k * 2.2) * (0.6 + s.l);
    if (s.r > 1){ s.r = 0.25 + Math.random() * 0.2; s.a = Math.random() * 6.283; }
    var ca = Math.cos(s.a), sa = Math.sin(s.a) * 0.62, r1 = R0 * s.r, r2 = R0 * (s.r + s.l * 0.35 * k);
    fxc.strokeStyle = 'rgba(255,255,255,' + (0.22 * k * s.r).toFixed(3) + ')'; fxc.lineWidth = s.w;
    fxc.beginPath(); fxc.moveTo(cx + ca * r1, cy + sa * r1); fxc.lineTo(cx + ca * r2, cy + sa * r2); fxc.stroke();
  }
  var vg = fxc.createRadialGradient(cx, cy, R0 * 0.45, cx, cy, R0 * 1.05);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,' + (0.45 * k).toFixed(3) + ')');
  fxc.fillStyle = vg; fxc.fillRect(0, 0, Wd, Hd);
}

// ============================================================== bucle
SK.post.push(function(dt){
  paintLights(); hapticsStep(dt); engineStep(dt); paintGps(); paintGauge(); paintFx(dt);
});
// coronas: música y vibración cuando las ganas
var prevFinish = SK.onFinish;
SK.onFinish = function(run, board){
  if (prevFinish) prevFinish(run, board);
  if (run && run.won && run.won.length){ setTimeout(function(){ sfx.crown(); buzz([30, 40, 30, 40, 140]); }, 350); }
};
document.addEventListener('visibilitychange', function(){ if (AC){ if (document.hidden) AC.suspend(); else AC.resume(); } });
})();
