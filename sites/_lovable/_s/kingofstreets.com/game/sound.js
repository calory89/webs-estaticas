/* King of Streets v7 — sonido de ciudad.
   Radio con 4 emisoras generadas en directo y locutor por voz, música que sube con la carrera,
   motores de rivales en 3D (panorama + Doppler), campanas, sirenas lejanas, grillos y pájaros,
   claxon de cada país, cambio de marcha distinto por coche, adoquín que suena y vibra. */
(function(){
'use strict';
var A = window.SK && SK.api; if (!A) return;
var S = A.S, $ = A.$;
var COARSE = matchMedia('(pointer:coarse)').matches;
function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch(e){ return null; } }
function el(html){ var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
function AC(){ return SK.audioCtx ? SK.audioCtx() : null; }
function BUS(){ return SK.audioBus ? SK.audioBus() : null; }
function vib(p){ try { if (COARSE && navigator.vibrate && ls('sk_vib') !== '0' && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(p); } catch(e){} }
SK.vib = vib;

// ============================================================== posición relativa al coche (izquierda / derecha / detrás)
SK.pan3 = function(x, y){
  var c = S.car; if (!c) return { pan: 0, dist: 1e9, behind: false };
  var dx = x - c.x, dy = y - c.y, d = Math.hypot(dx, dy) || 1;
  var rx = Math.sin(c.h), ry = -Math.cos(c.h), fx = Math.cos(c.h), fy = Math.sin(c.h);
  return { pan: clamp((dx * rx + dy * ry) / d, -1, 1), dist: d, behind: (dx * fx + dy * fy) < 0 };
};

// ============================================================== utilidades de síntesis
var NB = null;
function noise(ac){
  if (NB && NB.sampleRate === ac.sampleRate) return NB;
  NB = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); var d = NB.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return NB;
}
function envG(ac, t, a, peak, dec, dest){ var g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); g.connect(dest); return g; }
function tone(ac, dest, t, f, dur, vol, type, glideTo){
  var o = ac.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
  var g = envG(ac, t, 0.005, vol, dur, dest); o.connect(g); o.start(t); o.stop(t + dur + 0.05);
}
function hit(ac, dest, t, type, f, q, vol, dur){
  var s = ac.createBufferSource(); s.buffer = noise(ac); var fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q || 0.7;
  var g = envG(ac, t, 0.002, vol, dur, dest); s.connect(fl); fl.connect(g); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
}
function kick(ac, d, t, v){ tone(ac, d, t, 150, 0.28, v || 0.5, 'sine', 42); }
function snare(ac, d, t, v){ hit(ac, d, t, 'bandpass', 1800, 0.6, v || 0.22, 0.16); tone(ac, d, t, 190, 0.08, (v || 0.22) * 0.6, 'triangle'); }
function hat(ac, d, t, v, open){ hit(ac, d, t, 'highpass', 7500, 0.7, v || 0.07, open ? 0.2 : 0.04); }
function clap(ac, d, t, v){ for (var i = 0; i < 3; i++) hit(ac, d, t + i * 0.011, 'bandpass', 1400, 1.1, (v || 0.2) * (1 - i * 0.2), 0.06); }
function pluck(ac, d, t, f, v, dur){      // cuerda pulsada (Karplus-Strong corto con filtro)
  var o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
  var fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = 2; fl.frequency.setValueAtTime(f * 7, t); fl.frequency.exponentialRampToValueAtTime(f * 1.3, t + (dur || 0.5));
  var g = envG(ac, t, 0.003, v || 0.08, dur || 0.5, d); o.connect(fl); fl.connect(g); o.start(t); o.stop(t + (dur || 0.5) + 0.05);
}
function pad(ac, d, t, fs, dur, v){
  fs.forEach(function(f){ [0, 5].forEach(function(det){ var o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det ? 9 : -9;
    var fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 900; var g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v || 0.025, t + dur * 0.3); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(fl); fl.connect(g); g.connect(d); o.start(t); o.stop(t + dur + 0.05); }); });
}
function bass(ac, d, t, f, dur, v, type){
  var o = ac.createOscillator(); o.type = type || 'sawtooth'; o.frequency.value = f; var fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.Q.value = 6;
  fl.frequency.setValueAtTime(900, t); fl.frequency.exponentialRampToValueAtTime(160, t + dur); var g = envG(ac, t, 0.005, v || 0.12, dur, d); o.connect(fl); fl.connect(g); o.start(t); o.stop(t + dur + 0.05);
}
function hz(m){ return 440 * Math.pow(2, (m - 69) / 12); }

// ============================================================== radio: emisoras y música dinámica
// La intensidad sube con la velocidad, con la policía detrás, con rivales cerca y en el último tramo.
var RADIO = { on: false, st: ls('sk_radio') || 'off', next: 0, step: 0, bar: 0, song: 0, bus: null, duck: 1, songT: 0, int: 0 };
var STATIONS = {
  triana: { name: 'Radio Triana', tag: 'rumba y guitarra', bpm: 104,
    prog: [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 56, 59]],       // cadencia andaluza La-Sol-Fa-Mi
    play: function(ac, d, t, st, bar, I, sp){
      var ch = this.prog[bar % 4], k = st % 16;
      if (k % 4 === 0) pluck(ac, d, t, hz(ch[0] - 12), 0.22, 0.6);
      if (k % 2 === 0) ch.forEach(function(n, i){ pluck(ac, d, t + i * 0.012, hz(n), 0.08, 0.28); });
      if ([3, 6, 8, 10, 11, 14].indexOf(k) >= 0) clap(ac, d, t, 0.2 + I * 0.12);           // palmas
      if (k === 0 || k === 10) hit(ac, d, t, 'lowpass', 180, 1, 0.6, 0.2); kick(ac, d, t, 0.25);               // cajón grave
      if (k === 4 || k === 12) hit(ac, d, t, 'bandpass', 900, 1, 0.3, 0.08);           // cajón seco
      if (I > 0.45 && k % 2 === 1) pluck(ac, d, t, hz(ch[(k >> 1) % 3] + 12), 0.08 * I, 0.18);   // picado
    } },
  neon: { name: 'Neón FM', tag: 'synthwave nocturno', bpm: 112,
    prog: [[45, 57, 60, 64], [41, 53, 57, 60], [43, 55, 59, 62], [40, 52, 55, 59]],
    play: function(ac, d, t, st, bar, I, sp){
      var ch = this.prog[bar % 4], k = st % 16;
      if (k === 0) pad(ac, d, t, ch.slice(1).map(hz), sp * 16, 0.018);
      if (k % 4 === 0) kick(ac, d, t, 0.42);
      if (k === 4 || k === 12) snare(ac, d, t, 0.18);
      bass(ac, d, t, hz(ch[0] + (k % 2 ? 12 : 0)), sp * 0.9, 0.08, 'sawtooth');
      if (I > 0.3 && k % 2 === 0) hat(ac, d, t, 0.035 + I * 0.03);
      if (I > 0.6){ var arp = [ch[1] + 12, ch[2] + 12, ch[3] + 12, ch[2] + 24]; tone(ac, d, t, hz(arp[k % 4]), sp * 0.8, 0.028 * I, 'square'); }
    } },
  calle: { name: 'Calle 140', tag: 'breaks y bajo', bpm: 140,
    prog: [[38], [38], [41], [36]],
    play: function(ac, d, t, st, bar, I, sp){
      var k = st % 16, r = this.prog[bar % 4][0];
      if (k === 0 || k === 10) kick(ac, d, t, 0.5);
      if (k === 4 || k === 12) snare(ac, d, t, 0.24);
      if (k === 7 || k === 15) snare(ac, d, t, 0.06);
      hat(ac, d, t, k % 2 ? 0.03 : 0.05, k === 14);
      if (k % 8 === 0) bass(ac, d, t, hz(r), sp * 6, 0.16, 'sine');
      if (I > 0.5 && (k === 3 || k === 11)) tone(ac, d, t, hz(r + 31), sp * 2, 0.025 * I, 'square', hz(r + 24));
    } },
  lofi: { name: 'Barrio Lo-Fi', tag: 'para pasear', bpm: 82,
    prog: [[50, 53, 57, 60], [55, 59, 62, 65], [48, 52, 55, 59], [45, 48, 52, 55]],
    play: function(ac, d, t, st, bar, I, sp){
      var ch = this.prog[bar % 4], k = st % 16;
      if (k === 0) ch.forEach(function(n, i){ pluck(ac, d, t + i * 0.03, hz(n + 12), 0.03, 1.4); });
      if (k === 0 || k === 7 || k === 10) kick(ac, d, t, 0.3);
      if (k === 4 || k === 12) hit(ac, d, t, 'bandpass', 1300, 0.8, 0.1, 0.12);
      if (k % 2 === 0) hat(ac, d, t + (k % 4 ? sp * 0.18 : 0), 0.025);
      if (k === 0 || k === 8) bass(ac, d, t, hz(ch[0] - 12), sp * 6, 0.1, 'triangle');
      if (I > 0.5 && k % 4 === 2) pluck(ac, d, t, hz(ch[(k >> 2) % 4] + 24), 0.02 * I, 0.4);
    } }
};
var ORDER = ['off', 'triana', 'neon', 'calle', 'lofi'];
function intensity(){
  var c = S.car; if (!c || S.phase !== 'run') return S.phase === 'count' ? 0.35 : 0.15;
  var v = clamp(c.speed / 30, 0, 1), I = 0.2 + v * 0.45;
  if (S.mode === 'cops') I += 0.3;
  if (S.circuit && c.prog > S.circuit.total * 0.8) I += 0.15;
  var bl = SK.bots && SK.bots.list ? SK.bots.list() : [];
  bl.forEach(function(b){ if (Math.hypot(b.x - c.x, b.y - c.y) < 25) I += 0.1; });
  return clamp(I, 0, 1);
}
function radioTick(){
  var ac = AC(); var st = STATIONS[RADIO.st];
  if (!ac || !st || document.hidden || S.paused){ if (RADIO.bus && ac) RADIO.bus.gain.setTargetAtTime(0, ac.currentTime, 0.1); RADIO.next = 0; return; }
  if (!RADIO.bus){ RADIO.bus = ac.createGain(); RADIO.bus.gain.value = 0; var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9000; RADIO.lp = lp; RADIO.bus.connect(lp); lp.connect(BUS() || ac.destination); }
  var view = S.view, inside = view === 'hood';
  RADIO.lp.frequency.setTargetAtTime((inside ? 12000 : 3800) * (0.45 + RADIO.int * 0.55), ac.currentTime, 0.3);               // fuera del coche suena "desde dentro"
  RADIO.int += (intensity() - RADIO.int) * 0.08;
  RADIO.bus.gain.setTargetAtTime(0.55 * RADIO.duck * (ls('sk_radiovol') ? +ls('sk_radiovol') : 1), ac.currentTime, 0.2);
  var sp = 60 / st.bpm / 4, now = ac.currentTime;
  if (!RADIO.next || RADIO.next < now - 0.3) RADIO.next = now + 0.06;
  while (RADIO.next < now + 0.25){
    try { st.play(ac, RADIO.bus, RADIO.next, RADIO.step, RADIO.bar, RADIO.int, sp); } catch(e){}
    RADIO.step++; if (RADIO.step % 16 === 0){ RADIO.bar++; if (RADIO.bar % 32 === 0) dj(); }
    RADIO.next += sp;
  }
}
setInterval(radioTick, 60);

// ============================================================== locutor
var djVoice = null;
function pickDJ(){
  var vs = speechSynthesis.getVoices() || []; var es = vs.filter(function(v){ return /^es/i.test(v.lang); });
  return es.filter(function(v){ return /male|jorge|pablo|diego|carlos|enrique/i.test(v.name); })[0] || es[1] || es[0] || null;
}
function djLine(){
  var st = STATIONS[RADIO.st], city = (A.cityMeta ? A.cityMeta(S.cityId).name : '') || 'la ciudad', h = new Date().getHours();
  var w = S.weather || {}, temp = typeof w.temp === 'number' ? Math.round(w.temp) + ' grados' : '';
  var street = S.routeTitle || '', lines = [
    'Estás escuchando ' + st.name + ', ' + st.tag + ' desde ' + city + '.',
    temp ? 'En ' + city + ' ahora mismo ' + temp + (S.wet ? ', y el asfalto mojado. Cuidado en las curvas.' : '. Buen día para coronarse.') : 'Buenas ' + (h < 14 ? 'días' : h < 21 ? 'tardes' : 'noches') + ', ' + city + '.',
    street ? 'Me cuentan que en ' + street + ' hay movimiento. Alguien va a por la corona.' : 'Cada calle tiene su rey. ¿Cuál es la tuya?',
    S.mode === 'cops' ? 'Aviso de tráfico: patrullas por el centro. Si os persiguen, a la casa segura.' : 'Aviso de tráfico: autobuses y motos por el centro, ojo en los cruces.',
    'Seguimos con más música en ' + st.name + '. No toques el claxon sin motivo.'
  ];
  return lines[(RADIO.song++) % lines.length];
}
function dj(){
  if (ls('sk_dj') === '0' || !('speechSynthesis' in window) || speechSynthesis.speaking) return;
  if (S.phase === 'run' && ls('sk_voice') === '1') return;              // el copiloto manda en carrera
  try {
    var u = new SpeechSynthesisUtterance(djLine()); djVoice = djVoice || pickDJ(); if (djVoice) u.voice = djVoice;
    u.lang = djVoice ? djVoice.lang : 'es-ES'; u.rate = 1.05; u.pitch = 0.85;
    u.onstart = function(){ RADIO.duck = 0.35; }; u.onend = u.onerror = function(){ RADIO.duck = 1; };
    speechSynthesis.speak(u);
  } catch(e){}
}

// botón de radio en el HUD + tecla B
var rChip = el('<div id="radioChip"></div>');
var rcss = document.createElement('style');
rcss.textContent = '#radioChip{position:absolute;left:50%;top:150px;transform:translateX(-50%);z-index:12;display:none;background:rgba(11,15,20,.86);border:1px solid var(--line);border-radius:999px;padding:6px 14px;font:600 12px var(--cond);letter-spacing:.08em;text-transform:uppercase;color:#E8EEF2;pointer-events:none}#radioChip.on{display:block}#radioChip b{color:var(--gold)}';
document.head.appendChild(rcss); if ($('stage')) $('stage').appendChild(rChip);
var chipT = 0;
function showStation(){
  var st = STATIONS[RADIO.st]; rChip.innerHTML = st ? '📻 <b>' + st.name + '</b> · ' + st.tag : '📻 Radio apagada';
  rChip.classList.add('on'); clearTimeout(chipT); chipT = setTimeout(function(){ rChip.classList.remove('on'); }, 2200);
  var b = $('bRadio'); if (b) b.classList.toggle('on', !!st);
}
function cycleRadio(){
  if (SK.unlockAudio) SK.unlockAudio();
  var i = ORDER.indexOf(RADIO.st); RADIO.st = ORDER[(i + 1) % ORDER.length]; ls('sk_radio', RADIO.st); RADIO.bar = 0; RADIO.step = 0; RADIO.next = 0;
  showStation(); vib(12);
  if (STATIONS[RADIO.st]) setTimeout(dj, 900);
}
SK.radio = { _st: STATIONS, cycle: cycleRadio, state: function(){ return { st: RADIO.st, int: +RADIO.int.toFixed(2) }; }, stations: ORDER };
var hb = $('hudBtns');
if (hb){ var rb = el('<button type="button" id="bRadio" aria-label="Radio" title="Radio (B)">📻</button>'); hb.appendChild(rb); rb.onclick = function(){ cycleRadio(); rb.blur(); }; }
rcss.textContent += ' body.touchui #bRadio{display:none}';
// en móvil la radio va en el menú de pausa (la barra de arriba ya va llena)
setTimeout(function(){ var inner = document.querySelector('#pauseOv .inner'); if (!inner) return; var pb = el('<button type="button" class="btn ghost" id="pzRadio">📻 Radio</button>'); inner.insertBefore(pb, inner.children[1] || null); pb.onclick = function(){ cycleRadio(); var st = STATIONS[RADIO.st]; pb.textContent = '📻 ' + (st ? st.name : 'Radio'); }; }, 500);
window.addEventListener('keydown', function(e){ if ((e.key === 'b' || e.key === 'B') && e.target.tagName !== 'INPUT' && !e.ctrlKey && !e.metaKey) cycleRadio(); });

// ============================================================== motores de rivales en 3D
var VO = [];
function voice(ac){
  var o1 = ac.createOscillator(), o2 = ac.createOscillator(); o1.type = 'sawtooth'; o2.type = 'square';
  var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 3;
  var g = ac.createGain(); g.gain.value = 0; var pn = ac.createStereoPanner ? ac.createStereoPanner() : null;
  var g2 = ac.createGain(); g2.gain.value = 0.35; o1.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g);
  if (pn){ g.connect(pn); pn.connect(BUS() || ac.destination); } else g.connect(BUS() || ac.destination);
  o1.start(); o2.start(); return { o1: o1, o2: o2, lp: lp, g: g, pn: pn, last: 0, gear: 1 };
}
function stepVoices(dt){
  var ac = AC(); if (!ac || !BUS()) return;
  var list = [];
  if (SK.bots && SK.bots.list && S.phase !== 'done') SK.bots.list().forEach(function(b){ if (b.grp || b.x) list.push({ x: b.x, y: b.y, v: b.v || 0, id: 'b' }); });
  if (S.mode === 'cops' && SK.modes && SK.modes.cops) SK.modes.cops().forEach(function(c){ list.push({ x: c.x, y: c.y, v: c.v || 0, id: 'c', heavy: 1 }); });
  var t = ac.currentTime;
  while (VO.length < Math.min(list.length, 4)) VO.push(voice(ac));
  VO.forEach(function(vo, i){
    var s = list[i];
    if (!s || S.paused){ vo.g.gain.setTargetAtTime(0, t, 0.1); return; }
    var p = SK.pan3(s.x, s.y), d = p.dist;
    var rel = vo.last ? (d - vo.last) / Math.max(0.016, dt) : 0; vo.last = d;           // Doppler: se acerca, más agudo
    var dop = clamp(343 / (343 + clamp(rel, -60, 60)), 0.8, 1.25);
    var v = Math.abs(s.v), GR = [0, 9, 16, 24, 33, 44, 99], g = 1; while (g < 6 && v > GR[g]) g++;
    var lo = GR[g - 1], hi = GR[g], rpm = 1400 + (v - lo) / (hi - lo) * 4600;
    var f = rpm / 60 * (s.heavy ? 3 : 2) * 0.5 * dop;
    vo.o1.frequency.setTargetAtTime(f, t, 0.05); vo.o2.frequency.setTargetAtTime(f * 0.5, t, 0.05);
    vo.lp.frequency.setTargetAtTime(p.behind ? 380 + rpm * 0.05 : 600 + rpm * 0.12, t, 0.08);
    var vol = d > 160 ? 0 : clamp(4 / Math.max(4, d), 0, 1) * 0.12 * (0.4 + v / 50);
    vo.g.gain.setTargetAtTime(vol, t, 0.08); if (vo.pn) vo.pn.pan.setTargetAtTime(p.pan * 0.9, t, 0.05);
  });
}

// ============================================================== adoquín, arcén y vibración
var COB = { g: null, am: null, lfo: null, hapT: 0 };
function roadClassAt(x, y){
  var G = S.G; if (!G || !G.grid) return -1;
  var C = G.CELL, arr = G.grid.get(Math.floor(x / C) * 100000 + Math.floor(y / C)); if (!arr) return -1;
  var best = -1, bd = 1e9;
  for (var i = 0; i < arr.length; i++){
    var s = G.segs[arr[i]], ax = s[0], ay = s[1], bx = s[2], by = s[3], dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1;
    var u = clamp(((x - ax) * dx + (y - ay) * dy) / L, 0, 1), px = ax + dx * u - x, py = ay + dy * u - y, dd = px * px + py * py;
    if (dd < bd){ bd = dd; best = s[4]; }
  }
  return bd < 144 ? best : -1;
}
SK.roadClassAt = roadClassAt;
var cobT = 0;
function stepCobble(dt){
  var c = S.car; if (!c) return;
  cobT -= dt; if (cobT <= 0){ cobT = 0.25; S.roadCls = roadClassAt(c.x, c.y); S.cobble = S.roadCls >= 7 || (S.cityId === 'sevilla' && S.roadCls === 6 && ((Math.floor(c.x / 60) + Math.floor(c.y / 60)) % 5 === 0)); }
  var ac = AC(); if (!ac || !BUS()) return;
  if (!COB.g){
    var s = ac.createBufferSource(); s.buffer = noise(ac); s.loop = true;
    var bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 140; bp.Q.value = 1.4;
    var am = ac.createGain(); am.gain.value = 0; var g = ac.createGain(); g.gain.value = 0;
    var lfo = ac.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 20; var lg = ac.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain);
    s.connect(bp); bp.connect(am); am.connect(g); g.connect(BUS()); s.start(); lfo.start(); COB = { g: g, am: am, lfo: lfo, bp: bp, hapT: 0 };
  }
  var v = S.phase === 'run' || S.phase === 'ready' || S.phase === 'count' ? c.speed : 0, on = S.cobble && v > 1.5;
  var t = ac.currentTime;
  COB.g.gain.setTargetAtTime(on ? clamp(v / 20, 0.2, 1) * 0.22 : 0, t, 0.08);
  COB.lfo.frequency.setTargetAtTime(clamp(v / 0.22, 4, 90), t, 0.05);            // un golpe por adoquín (≈22 cm)
  COB.bp.frequency.setTargetAtTime(110 + v * 4, t, 0.1);
  COB.hapT -= dt;
  if (COARSE && COB.hapT <= 0 && S.phase === 'run'){
    if (on){ vib([8, 30, 8]); COB.hapT = clamp(0.5 - v / 60, 0.14, 0.5); }
    else if (c.kerb && v > 4){ vib(18); COB.hapT = 0.18; }
    else if (c.off > 0 && v > 4){ vib([6, 14, 6, 14]); COB.hapT = 0.3; }
  }
}

// ============================================================== claxon de cada país (el tuyo y el del tráfico)
var HORNS = {
  es: { f: [415, 520], type: 'square', dur: 0.36, vol: 0.05 },
  fr: { f: [440, 554], type: 'square', dur: 0.2, vol: 0.05, twice: 1 },
  uk: { f: [466, 587], type: 'sawtooth', dur: 0.26, vol: 0.04 },
  us: { f: [349, 440], type: 'sawtooth', dur: 0.7, vol: 0.06, grit: 1 },
  jp: { f: [523, 659], type: 'triangle', dur: 0.18, vol: 0.045 },
  it: { f: [392, 494, 587], type: 'square', dur: 0.3, vol: 0.05, twice: 1 },
  de: { f: [370, 466], type: 'sawtooth', dur: 0.32, vol: 0.05 }
};
var CITY_CC = { sevilla: 'es', madrid: 'es', barcelona: 'es', malaga: 'es', valencia: 'es', paris: 'fr', london: 'uk', newyork: 'us', tokyo: 'jp', roma: 'it', rome: 'it', milan: 'it', berlin: 'de', munich: 'de' };
function cc(){
  var id = S.cityId || '', m = A.cityMeta ? A.cityMeta(id) : {};
  if (CITY_CC[id]) return CITY_CC[id];
  var c = (m && (m.cc || m.country) || '').toLowerCase(); if (HORNS[c]) return c;
  if (c === 'gb') return 'uk'; if (c === 'ja') return 'jp';
  return 'es';
}
SK.hornCC = cc;
function playHorn(pan, dist, mine){
  var ac = AC(); if (!ac || !BUS()) return; var H = HORNS[cc()], t = ac.currentTime;
  var out = ac.createGain(); out.gain.value = mine ? 1 : clamp(30 / Math.max(15, dist || 40), 0.15, 1);
  var pn = ac.createStereoPanner ? ac.createStereoPanner() : null; if (pn){ pn.pan.value = pan || 0; out.connect(pn); pn.connect(BUS()); } else out.connect(BUS());
  var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = mine ? 2400 : 1500; lp.connect(out);
  var reps = H.twice ? 2 : 1;
  for (var r = 0; r < reps; r++){
    var t0 = t + r * (H.dur + 0.08), g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(H.vol * (mine ? 1.6 : 1), t0 + 0.02); g.gain.setValueAtTime(H.vol * (mine ? 1.6 : 1), t0 + H.dur - 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t0 + H.dur); g.connect(lp);
    H.f.forEach(function(f){ var o = ac.createOscillator(); o.type = H.type; o.frequency.value = f; if (H.grit){ o.detune.value = Math.random() * 20 - 10; } o.connect(g); o.start(t0); o.stop(t0 + H.dur + 0.05); });
  }
}
if (SK.sfx){
  SK.sfx.horn2 = function(){ playHorn(0, 0, true); vib(30); };
  SK.sfx.horn = function(){ playHorn(Math.random() * 1.6 - 0.8, 25 + Math.random() * 60, false); };
}

// ============================================================== cambio de marcha según el coche
if (SK.sfx){
  var baseShift = SK.sfx.shift;
  SK.sfx.shift = function(){
    var ac = AC(); if (!ac || !BUS()){ return; }
    var e = SK.engineName ? SK.engineName() : 'i4', t = ac.currentTime, d = BUS();
    if (e === 'ev') return;                                                   // eléctrico: sin cambio
    if (e === 'v8' || e === 'v8r'){ tone(ac, d, t, 80, 0.14, 0.12, 'sine', 45); hit(ac, d, t + 0.01, 'bandpass', 900, 1.5, 0.05, 0.05); if (e === 'v8r') hit(ac, d, t + 0.03, 'lowpass', 400, 1, 0.12, 0.08); }
    else if (e === 'i4t'){ tone(ac, d, t, 110, 0.08, 0.06, 'sine', 60); hit(ac, d, t, 'highpass', 2800, 0.8, 0.05, 0.12); }
    else if (e === 'dsl'){ tone(ac, d, t, 65, 0.2, 0.1, 'sine', 40); hit(ac, d, t + 0.05, 'bandpass', 600, 1.2, 0.04, 0.08); }
    else if (e === 'i3'){ tone(ac, d, t, 120, 0.07, 0.05, 'sine', 70); hit(ac, d, t, 'bandpass', 2400, 2, 0.03, 0.03); }
    else if (baseShift) baseShift();
    vib(8);
  };
}

// ============================================================== ambiente de ciudad
function bell(ac, d, t, f, vol, pan){
  var out = ac.createGain(); out.gain.value = vol; var pn = ac.createStereoPanner ? ac.createStereoPanner() : null;
  if (pn){ pn.pan.value = pan; out.connect(pn); pn.connect(d); } else out.connect(d);
  [[1, 1], [2.0, 0.5], [2.76, 0.4], [5.4, 0.25], [8.93, 0.12]].forEach(function(p){ var o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f * p[0];
    var g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(p[1], t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5 / Math.sqrt(p[0])); o.connect(g); g.connect(out); o.start(t); o.stop(t + 5); });
}
function farSiren(ac, d){
  var t = ac.currentTime, o = ac.createOscillator(); o.type = 'triangle'; var lfo = ac.createOscillator(); lfo.frequency.value = 0.35; var lg = ac.createGain(); lg.gain.value = 220; lfo.connect(lg); lg.connect(o.frequency); o.frequency.value = 820;
  var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200; var g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.012, t + 3); g.gain.linearRampToValueAtTime(0.0001, t + 9);
  var pn = ac.createStereoPanner ? ac.createStereoPanner() : null; o.connect(lp); lp.connect(g); if (pn){ pn.pan.value = Math.random() * 2 - 1; g.connect(pn); pn.connect(d); } else g.connect(d);
  o.start(t); lfo.start(t); o.stop(t + 9.2); lfo.stop(t + 9.2);
}
function cricket(ac, d){
  var t = ac.currentTime, pan = Math.random() * 2 - 1;
  for (var i = 0; i < 3; i++){ var o = ac.createOscillator(); o.frequency.value = 4400 + Math.random() * 300; var g = envG(ac, t + i * 0.06, 0.004, 0.006, 0.04, d); o.connect(g); o.start(t + i * 0.06); o.stop(t + i * 0.06 + 0.06); }
}
var AMB = { lastHour: -1, bellT: 60 + Math.random() * 90, sirT: 40 + Math.random() * 80, crT: 0, birdT: 5 };
var OLD_TOWN = { sevilla: 1, madrid: 1, paris: 1, london: 1, roma: 1, barcelona: 1, malaga: 1, valencia: 1 };
function stepAmbience(dt){
  var ac = AC(), d = BUS(); if (!ac || !d || document.hidden || S.paused) return;
  var night = S.skin === 'night' || (S.sunAlt != null && S.sunAlt < -0.05), now = new Date();
  if (now.getMinutes() === 0 && AMB.lastHour !== now.getHours() && OLD_TOWN[S.cityId]){         // campanadas a la hora en punto
    AMB.lastHour = now.getHours(); var n = now.getHours() % 12 || 12, pan = Math.random() * 1.4 - 0.7;
    for (var i = 0; i < n; i++) bell(ac, d, ac.currentTime + 0.5 + i * 1.6, 262, 0.035, pan);
  }
  AMB.bellT -= dt; if (AMB.bellT <= 0){ AMB.bellT = 120 + Math.random() * 120; if (OLD_TOWN[S.cityId]){ var p = Math.random() * 1.6 - 0.8; bell(ac, d, ac.currentTime, 392, 0.02, p); bell(ac, d, ac.currentTime + 0.9, 330, 0.02, p); } }
  AMB.sirT -= dt; if (AMB.sirT <= 0){ AMB.sirT = 70 + Math.random() * 110; if (S.mode !== 'cops') farSiren(ac, d); }
  if (night && (now.getMonth() >= 4 && now.getMonth() <= 8)){ AMB.crT -= dt; if (AMB.crT <= 0){ AMB.crT = 0.6 + Math.random() * 1.4; cricket(ac, d); } }
}

// ============================================================== bucle
var lastT = performance.now();
(function loop(){
  requestAnimationFrame(loop);
  var n = performance.now(), dt = Math.min(0.1, (n - lastT) / 1000); lastT = n;
  try { stepVoices(dt); } catch(e){}
  try { stepCobble(dt); } catch(e){}
  try { stepAmbience(dt); } catch(e){}
})();
if (STATIONS[RADIO.st]) setTimeout(showStation, 1500);
})();
