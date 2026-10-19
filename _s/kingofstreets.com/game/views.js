/* King of Streets — qué vista se ve y quién la pinta.
   Tras el coche / Capó: ciudad 3D propia (city3d.js), sin claves.
   Plano: mapa 2D (game.js).
   Google 3D: opcional, CesiumJS + Google Photorealistic 3D Tiles, solo con clave. */
(function(){
'use strict';
var A = window.SK && SK.api; if (!A) return;
var S = A.S, $ = A.$;
var cv = $('cv'), gl3 = $('gl3'), gg = $('gl');

function hasKey(){ return !!(SK.googleKey && SK.googleKey()); }

function show(which){
  cv.hidden = which !== 'top';
  if (gl3) gl3.hidden = which !== 'city';
  if (gg) gg.style.display = which === 'google' ? 'block' : 'none';
  if (SK.pauseGoogle) SK.pauseGoogle(which !== 'google');
}

SK.render3d = function(dt){
  if (S.view === 'google'){
    if (SK.render3dGoogle && SK.render3dGoogle(dt)){ show('google'); return true; }
    show('top'); return false;
  }
  if (S.view === 'chase' || S.view === 'hood'){
    if (SK.render3dCity && SK.render3dCity(dt)){ show('city'); return true; }
    show('top'); return false;
  }
  show('top');
  return false;
};
SK.reset3d = function(){
  if (SK.reset3dCity) SK.reset3dCity();
  if (SK.reset3dGoogle) SK.reset3dGoogle();
};

function setView(v){
  if (v === 'google' && !hasKey()){
    if (window.SK_askKey) SK_askKey();
    return;
  }
  S.view = v;
  ['vChase', 'vHood', 'vTop', 'vGoogle'].forEach(function(id){
    var el = $(id); if (el) el.classList.toggle('on', el.dataset.view === v);
  });
  // el bucle del juego no llama al 3D en vista Plano, así que la visibilidad se fija aquí
  show(v === 'top' ? 'top' : v === 'google' ? 'google' : 'city');
  if (SK.reset3d) SK.reset3d();
  try { localStorage.setItem('sk_view2', v); } catch(e){}
}
SK.setView = setView;

[['vChase', 'chase'], ['vHood', 'hood'], ['vTop', 'top'], ['vGoogle', 'google']].forEach(function(p){
  var el = $(p[0]); if (!el) return;
  el.dataset.view = p[1];
  el.onclick = function(){ setView(p[1]); };
});

window.addEventListener('keydown', function(e){
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (e.key !== 'c' && e.key !== 'C') return;
  var order = hasKey() ? ['chase', 'hood', 'top', 'google'] : ['chase', 'hood', 'top'];
  setView(order[(order.indexOf(S.view) + 1) % order.length]);
});

var saved = 'chase';
// clave nueva: la versión anterior dejó a mucha gente guardada en Plano por no tener clave de Google
try { saved = localStorage.getItem('sk_view2') || 'chase'; } catch(e){}
if (saved === 'google' && !hasKey()) saved = 'chase';
if (['chase', 'hood', 'top', 'google'].indexOf(saved) < 0) saved = 'chase';
setView(saved);
})();
