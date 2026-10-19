/* King of Streets v5 — calles de verdad.
   · Hora y clima reales de la ciudad (Open-Meteo, sin clave): de noche es de noche, si llueve, llueve.
   · Volver a la pista: botón y tecla T. El coche vuelve solo al último punto del trazado a velocidad
     legal (la vuelta sigue contando y el antitrampas no la rechaza).
   · Móvil: sin acelerador automático por defecto, freno de mano, mirar atrás y una guía la primera vez.
   · Daño: si te das muchos golpes el motor echa humo (solo estético). */
(function(){
'use strict';
var A = window.SK && SK.api; if (!A) return;
var S = A.S, $ = A.$, toast = A.toast, esc = A.esc;
var COARSE = matchMedia('(pointer:coarse)').matches;
function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch(e){ return null; } }
function el(html){ var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }

var css = `
#bBack{position:absolute;left:50%;top:128px;transform:translateX(-50%);z-index:14;display:none;align-items:center;gap:8px;
  background:linear-gradient(180deg,#FF6B45,#E0431F);color:#fff;border:0;border-radius:999px;padding:10px 18px;font:700 15px var(--cond);letter-spacing:.08em;text-transform:uppercase;
  box-shadow:0 8px 22px rgba(255,91,61,.45);animation:bbPulse .9s ease-in-out infinite alternate}
#bBack.on{display:flex} #bBack small{font:600 11px var(--mono);opacity:.8;letter-spacing:0}
@keyframes bbPulse{from{transform:translateX(-50%) scale(1)}to{transform:translateX(-50%) scale(1.06)}}
body.land #bBack{top:96px}
#pedHb{right:calc(max(14px,env(safe-area-inset-right)) + var(--gw,78px) + var(--bw,96px) + 24px);width:min(15vh,66px);height:min(15vh,66px);border-radius:50%}
#pedHb i{background:linear-gradient(0deg,#FFB020,#D98A00)} #pedHb b{margin-bottom:auto;margin-top:auto;font-size:10px;letter-spacing:.1em}
#wxChip{position:absolute;top:8px;right:max(8px,env(safe-area-inset-right));z-index:11;display:none;align-items:center;gap:6px;background:rgba(11,15,20,.8);
  border:1px solid var(--line);border-radius:999px;padding:5px 11px;font:600 12px var(--mono);color:var(--fg);pointer-events:none}
#wxChip.on{display:flex}
body.touchui #wxChip{top:56px}
body.land #wxChip{top:100px;right:max(8px,env(safe-area-inset-right))}
@media (pointer:fine){ #wxChip{top:auto;bottom:146px;right:18px} }
#coach{position:absolute;inset:0;z-index:30;display:none;pointer-events:auto;background:rgba(5,8,12,.55)}
#coach.on{display:block}
#coach .tip{position:absolute;background:#0F151C;border:1px solid var(--trace);border-radius:10px;padding:8px 12px;font:600 13px var(--body,system-ui);color:#fff;max-width:220px;box-shadow:0 8px 20px rgba(0,0,0,.4)}
#coach .tip b{display:block;font:700 15px var(--cond);letter-spacing:.06em;text-transform:uppercase;color:var(--trace)}
#coach .ok{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:var(--trace);color:#180703;border:0;border-radius:999px;padding:12px 26px;font:700 16px var(--cond);letter-spacing:.1em;text-transform:uppercase}
.wxseg button{padding:8px 4px}
`;
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

// ============================================================== móvil: sin acelerador automático por defecto
// (antes venía activado en el móvil y el coche arrancaba solo: confundía)
S.autoGas = ls('sk_autogas2') === '1';
(function(){
  var b = $('cAuto'); if (!b) return;
  b.onclick = function(){ S.autoGas = !S.autoGas; ls('sk_autogas2', S.autoGas ? '1' : '0'); b.classList.toggle('on', S.autoGas); $('touch').classList.toggle('auto', S.autoGas); };
  b.classList.toggle('on', S.autoGas); $('touch').classList.toggle('auto', S.autoGas);
})();

// ============================================================== volver a la pista
var back = el('<button type="button" id="bBack">↩ Volver a la pista <small>' + (COARSE ? '' : '(T)') + '</small></button>');
$('stage').appendChild(back);
SK.respawn = function(){
  var car = S.car, R = S.circuit;
  if (!car || !R || S.phase !== 'run' || car.rw) return;
  var p = A.pointAt(R, Math.max(0, car.prog - 3));
  car.rw = { x: p.x, y: p.y, h: p.h };
  if (SK.buzz) SK.buzz(20);
};
SK.onRespawned = function(){ stuckT = 0; };
back.addEventListener('pointerdown', function(e){ e.preventDefault(); SK.respawn(); });
var stuckT = 0;
SK.pre.push(function(dt){
  var car = S.car, show = false;
  if (car && S.phase === 'run' && !car.rw){
    var lat = S.lateral || 0;
    if (car.speed < 1.6 && S.t > 3000) stuckT += dt; else stuckT = Math.max(0, stuckT - dt * 2);
    var recentHit = S.hit && performance.now() - S.hit.t < 5000;
    show = S.mode ? (stuckT > 2.5 && recentHit) : (lat > 14 || car.off > 1.5 || (stuckT > 1.8 && (lat > 5 || recentHit)));
  }
  back.classList.toggle('on', show);
});

// ============================================================== freno de mano y mirar atrás
(function(){
  var ctl = $('ctl');
  if (ctl){
    var hb = el('<div class="pedal" id="pedHb" aria-label="Freno de mano"><i></i><b>MANO</b></div>');
    ctl.appendChild(hb);
    hb.addEventListener('pointerdown', function(e){ e.preventDefault(); S.pad.hb = 1; hb.classList.add('on'); hb.style.setProperty('--v', 1); if (SK.buzz) SK.buzz(10); });
    var up = function(){ S.pad.hb = 0; hb.classList.remove('on'); hb.style.setProperty('--v', 0); };
    hb.addEventListener('pointerup', up); hb.addEventListener('pointercancel', up);
  }
  var hbtns = $('hudBtns');
  if (hbtns){
    var lb = el('<button type="button" id="bLook" aria-label="Mirar atrás" title="Mirar atrás (C)">👀</button>');
    hbtns.appendChild(lb);
    lb.addEventListener('pointerdown', function(e){ e.preventDefault(); S.lookBack = 1; });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function(ev){ lb.addEventListener(ev, function(){ S.lookBack = 0; }); });
  }
  window.addEventListener('keydown', function(e){ if ((e.key === 'c' || e.key === 'C') && e.target.tagName !== 'INPUT') S.lookBack = 1; });
  window.addEventListener('keyup', function(e){ if (e.key === 'c' || e.key === 'C') S.lookBack = 0; });
})();

// ============================================================== teclas (ordenador)
(function(){
  var cb = $('ctlBlock'); if (!cb || COARSE) return;
  var k = el('<div class="block"><div class="eyebrow">Teclas</div><p class="hint" style="margin:0;line-height:1.7">' +
    '<b>↑ ↓ ← →</b> o <b>WASD</b> conducir · <b>Shift</b> freno de mano · <b>T</b> volver a la pista · <b>C</b> mirar atrás · <b>H</b> bocina · <b>R</b> reiniciar · <b>M</b> sonido</p></div>');
  cb.parentNode.insertBefore(k, cb);
})();

// ============================================================== guía de controles (móvil, las dos primeras carreras)
var coach = el('<div id="coach"></div>');
$('stage').appendChild(coach);
function showCoach(){
  var n = +(ls('sk_coach') || 0); if (!COARSE || n >= 2) return;
  ls('sk_coach', String(n + 1));
  var land = document.body.classList.contains('land');
  coach.innerHTML =
    '<div class="tip" style="left:14px;bottom:' + (land ? 'min(44vh,190px)' : '190px') + '"><b>Volante</b>Arrastra a los lados para girar.</div>' +
    '<div class="tip" style="right:14px;bottom:' + (land ? 'min(48vh,200px)' : '190px') + '"><b>Gas y freno</b>Mantén GAS para acelerar. FRENO frena y, parado, da marcha atrás. MANO derrapa.</div>' +
    '<div class="tip" style="left:50%;transform:translateX(-50%);top:' + (land ? '70px' : '110px') + '"><b>¿Te has salido?</b>Pulsa ↩ Volver a la pista y el coche vuelve solo.</div>' +
    '<button type="button" class="ok">Entendido</button>';
  coach.classList.add('on');
  var close = function(){ coach.classList.remove('on'); };
  coach.querySelector('.ok').onclick = close;
  setTimeout(close, 9000);
}
var lastPhase = null;
SK.post.push(function(){
  if (S.phase === 'count' && lastPhase !== 'count') showCoach();
  lastPhase = S.phase;
});

// ============================================================== daño estético: humo si te has dado muchos golpes
S.damage = 0; var lastHitT = 0;
SK.post.push(function(dt){
  if (S.phase === 'count' || S.phase === 'ready') S.damage = 0;
  if (S.hit && S.hit.t !== lastHitT){ lastHitT = S.hit.t; if (S.hit.mag > 3) S.damage = Math.min(100, S.damage + S.hit.mag * 2.2); }
});

// ============================================================== hora y clima reales
var applying = false;
var WX = { mode: ls('sk_wx') || 'real', data: null, at: 0, city: null };
var SKIN_REAL = ls('sk_skinmode') !== 'manual';
S.weather = { rain: 0, snow: false, wind: 3 };
var chip = el('<div id="wxChip"></div>'); $('stage').appendChild(chip);
// botón "Real" junto a Día / Atardecer / Noche
(function(){
  var seg = $('skinDay') && $('skinDay').parentNode; if (!seg) return;
  var b = el('<button type="button" id="skinReal" title="La hora y la luz de ahora mismo en esa ciudad">Real</button>');
  seg.insertBefore(b, seg.firstChild);
  b.onclick = function(){ SKIN_REAL = true; ls('sk_skinmode', 'real'); paintSkinBtns(); applyWeather(); };
  ['skinDay', 'skinDusk', 'skinNight'].forEach(function(id){
    var x = $(id); if (!x) return;
    x.addEventListener('click', function(e){ if (!e.isTrusted && applying) return; SKIN_REAL = false; ls('sk_skinmode', 'manual'); paintSkinBtns(); });
  });
  // selector de clima
  var box = seg.parentNode;
  var ws = el('<div class="seg wxseg" role="group" aria-label="Clima"><button type="button" data-w="real">Clima real</button><button type="button" data-w="sol">Sol</button><button type="button" data-w="lluvia">Lluvia</button><button type="button" data-w="nieve">Nieve</button></div>');
  box.insertBefore(ws, seg.nextSibling);
  ws.querySelectorAll('button').forEach(function(x){ x.onclick = function(){ WX.mode = x.dataset.w; ls('sk_wx', WX.mode); paintWxBtns(); applyWeather(); }; });
  paintSkinBtns(); paintWxBtns();
})();
function paintSkinBtns(){
  var r = $('skinReal'); if (r) r.classList.toggle('on', SKIN_REAL);
  if (SKIN_REAL) ['skinDay', 'skinDusk', 'skinNight'].forEach(function(id){ var x = $(id); if (x) x.classList.remove('on'); });
}
function paintWxBtns(){ document.querySelectorAll('.wxseg button').forEach(function(x){ x.classList.toggle('on', x.dataset.w === WX.mode); }); }
var CODES = { 0: ['☀️', 'despejado'], 1: ['🌤️', 'casi despejado'], 2: ['⛅', 'nubes y claros'], 3: ['☁️', 'nublado'], 45: ['🌫️', 'niebla'], 48: ['🌫️', 'niebla'],
  51: ['🌦️', 'llovizna'], 53: ['🌦️', 'llovizna'], 55: ['🌧️', 'llovizna fuerte'], 56: ['🌧️', 'llovizna helada'], 57: ['🌧️', 'llovizna helada'],
  61: ['🌧️', 'lluvia débil'], 63: ['🌧️', 'lluvia'], 65: ['🌧️', 'lluvia fuerte'], 66: ['🌧️', 'lluvia helada'], 67: ['🌧️', 'lluvia helada'],
  71: ['🌨️', 'nieve débil'], 73: ['🌨️', 'nieve'], 75: ['❄️', 'nieve fuerte'], 77: ['🌨️', 'granizo fino'], 80: ['🌦️', 'chubascos'], 81: ['🌧️', 'chubascos'], 82: ['⛈️', 'chubascos fuertes'],
  85: ['🌨️', 'chubascos de nieve'], 86: ['❄️', 'chubascos de nieve'], 95: ['⛈️', 'tormenta'], 96: ['⛈️', 'tormenta con granizo'], 99: ['⛈️', 'tormenta con granizo'] };
function rainOf(c){
  if ([51, 56].indexOf(c) >= 0) return 0.25; if ([53, 61, 80].indexOf(c) >= 0) return 0.45; if ([55, 57, 63, 66, 81].indexOf(c) >= 0) return 0.7;
  if ([65, 67, 82, 95, 96, 99].indexOf(c) >= 0) return 1; if ([71, 77, 85].indexOf(c) >= 0) return 0.45; if ([73].indexOf(c) >= 0) return 0.7; if ([75, 86].indexOf(c) >= 0) return 1;
  return 0;
}
function cityLatLon(){ var c = (A.CITIES[S.cityId] || {}).c; return c ? [c[0], c[1]] : null; }
function fetchWeather(){
  var ll = cityLatLon(); if (!ll) return;
  var key = S.cityId;
  if (WX.city === key && Date.now() - WX.at < 15 * 60000) return;
  WX.city = key; WX.at = Date.now();
  var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + ll[0].toFixed(3) + '&longitude=' + ll[1].toFixed(3) +
    '&current=temperature_2m,weather_code,is_day,wind_speed_10m,cloud_cover&daily=sunrise,sunset&timezone=auto&forecast_days=1';
  fetch(url).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; }).then(function(j){
    if (!j || !j.current || S.cityId !== key) return;
    WX.data = j; applyWeather();
  });
}
function mins(s){ var m = /T(\d\d):(\d\d)/.exec(s || ''); return m ? (+m[1]) * 60 + (+m[2]) : null; }
function applyWeather(){
  var j = WX.data, cur = j && j.current;
  var code = cur ? cur.weather_code : 0;
  var r = 0, snow = false;
  if (WX.mode === 'real' && cur){ r = rainOf(code); snow = [71, 73, 75, 77, 85, 86].indexOf(code) >= 0; }
  else if (WX.mode === 'lluvia'){ r = 0.8; }
  else if (WX.mode === 'nieve'){ r = 0.8; snow = true; }
  S.weather = { rain: r, snow: snow, wind: cur ? cur.wind_speed_10m / 3.6 : 3, code: code, temp: cur ? cur.temperature_2m : 20 };
  // amanecer: la primera hora tras salir el sol (niebla baja si hay humedad)
  var tnow = cur ? mins(cur.time) : null, trise = j && j.daily && j.daily.sunrise ? mins(j.daily.sunrise[0]) : null;
  S.dawn = !!(SKIN_REAL && tnow != null && trise != null && tnow >= trise - 20 && tnow <= trise + 60 && [0, 1, 2, 3, 45, 48].indexOf(code) >= 0);
  S.sunTimes = j && j.daily ? { rise: trise, set: mins(j.daily.sunset && j.daily.sunset[0]), now: tnow } : null;
  S.wet = r > 0.3;
  // la luz: la de ahora mismo en esa ciudad
  if (SKIN_REAL && cur){
    var now = mins(cur.time), sr = mins(j.daily && j.daily.sunrise && j.daily.sunrise[0]), ss = mins(j.daily && j.daily.sunset && j.daily.sunset[0]), sk = 'day';
    if (now != null && sr != null && ss != null){
      if (now < sr - 25 || now > ss + 25) sk = 'night';
      else if (Math.abs(now - ss) <= 50 || Math.abs(now - sr) <= 40) sk = 'dusk';
    } else sk = cur.is_day ? 'day' : 'night';
    if (S.skin !== sk){ var b = $(sk === 'night' ? 'skinNight' : sk === 'dusk' ? 'skinDusk' : 'skinDay'); if (b){ applying = true; b.click(); applying = false; } }
    paintSkinBtns();
  }
  if (cur){
    var ic = CODES[code] || ['🌡️', ''];
    var tn = mins(cur.time), tr = mins(j.daily && j.daily.sunrise && j.daily.sunrise[0]), ts = mins(j.daily && j.daily.sunset && j.daily.sunset[0]);
    var dark = (tn != null && tr != null && ts != null) ? (tn < tr || tn > ts) : !cur.is_day;
    if (dark && code <= 2) ic = [code === 0 ? '🌙' : '☁️', code === 0 ? 'despejado' : ic[1]];
    if (WX.mode === 'lluvia') ic = ['🌧️', 'lluvia']; else if (WX.mode === 'nieve') ic = ['❄️', 'nieve']; else if (WX.mode === 'sol') ic = ['☀️', 'sol'];
    var hh = cur.time ? cur.time.slice(11, 16) : '';
    chip.innerHTML = ic[0] + ' ' + Math.round(cur.temperature_2m) + '° · ' + esc(ic[1]) + (hh ? ' · ' + hh : '');
    chip.classList.add('on');
  }
  if (SK.onWeather) try { SK.onWeather(S.weather); } catch(e){}
}
setInterval(fetchWeather, 5000);
setTimeout(fetchWeather, 1500);
setInterval(function(){ WX.at = 0; }, 20 * 60000);
SK.applyWeather = applyWeather;
})();
