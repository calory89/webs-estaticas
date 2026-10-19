/* King of Streets v3 — lo que hace que se comparta:
   vídeo vertical, tu calle, avisos de robo, territorio, bandas, calle del día,
   temporada semanal, controles de móvil y pinturas. */
(function(){
'use strict';
var A = window.SK && SK.api; if (!A) return;
var S = A.S, NET = A.NET, $ = A.$, esc = A.esc, fmt = A.fmt, toast = A.toast;
function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch(e){ return null; } }
function topOrigin(){ try { var o = window.top.location.origin; if (o && o !== 'null' && !/localhost|127\.0\.0\.1/.test(o)) return o; } catch(e){} return 'https://kingofstreets.com'; }
function topSearch(){ try { return window.top.location.search; } catch(e){ return location.search; } }
var COARSE = matchMedia('(pointer:coarse)').matches;

// ============================================================== pinturas
var PAINTS = [
  { c: '#E23A16', n: 'Rojo',   need: 0 },
  { c: '#2F6BFF', n: 'Azul',   need: 1 },
  { c: '#16181C', n: 'Negro',  need: 3 },
  { c: '#F4F4F1', n: 'Blanco', need: 5 },
  { c: '#3FD08A', n: 'Verde',  need: 10 },
  { c: '#8A4DFF', n: 'Morado', need: 25 },
  { c: '#F2C14E', n: 'Oro',    need: 50 }
];
S.stats = { streets: 0, week: 0, crew: null };
function held(){ return Math.max(S.stats.streets || 0, +($('terr').textContent) || 0); }
function ownPaint(c){ try { return (JSON.parse(localStorage.getItem('sk_owned') || '{}'))['p' + c] === 1; } catch(e){ return false; } }
SK.PAINTS = PAINTS;
function renderPaints(){
  var box = $('paints'); if (!box) return;
  var have = held(), cur = S.paint || PAINTS[0].c, html = '';
  PAINTS.forEach(function(p, i){
    var ok = have >= p.need || ownPaint(p.c);
    html += '<button type="button" class="pt' + (cur === p.c ? ' on' : '') + (ok ? '' : ' lock') + '" data-i="' + i + '" title="' +
            esc(p.n + (ok ? '' : ' · ' + p.need + ' calles')) + '" style="--pc:' + p.c + '">' + (ok ? '' : '<span>' + p.need + '</span>') + '</button>';
  });
  box.innerHTML = html;
  box.querySelectorAll('.pt').forEach(function(b){
    b.onclick = function(){
      var p = PAINTS[+b.dataset.i];
      if (held() < p.need && !ownPaint(p.c)){ toast(p.shop ? '🪙 ' + p.n + ': cómprala en la tienda por ' + p.shop + ' monedas.' : '🔒 ' + p.n + ': necesitas ' + p.need + ' calles. Tienes ' + held() + '.'); return; }
      setPaint(p.c);
    };
  });
  var next = PAINTS.filter(function(p){ return p.need > have && !p.shop; })[0];
  $('paintHint').innerHTML = next ? 'Siguiente: <b>' + esc(next.n) + '</b> con ' + next.need + ' calles. ' +
    '<a href="/patrocina" target="_top">¿Eres una marca?</a>' : 'Todas desbloqueadas. Eres leyenda.';
}
SK.renderPaints = function(){ renderPaints(); };
function setPaint(c){
  var p = PAINTS.filter(function(x){ return x.c === c; })[0];
  if (!p || (held() < p.need && !ownPaint(p.c))) c = PAINTS[0].c;
  S.paint = c === PAINTS[0].c ? null : c;
  ls('sk_paint', c);
  renderPaints();
}

// ============================================================== stats + temporada
async function refreshStats(){
  if (!(await A.openDb())) return;
  var st = await NET.call('stats', { device: A.deviceId() }, 12000);
  if (!st) return;
  S.stats = st;
  $('wkN').textContent = st.week || 0;
  renderCrew(); renderPaints();
  var want = ls('sk_paint'); if (want && (S.paint || PAINTS[0].c) !== want) setPaint(want);
}
function weekEnd(){
  var now = new Date(), d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  var add = (8 - (d.getUTCDay() || 7)) % 7 || 7;      // próximo lunes 00:00 UTC
  d.setUTCDate(d.getUTCDate() + add);
  var ms = d - now, h = Math.floor(ms / 3600000), dd = Math.floor(h / 24);
  return dd > 0 ? 'termina en ' + dd + 'd ' + (h % 24) + 'h' : 'termina en ' + h + 'h ' + Math.floor(ms / 60000) % 60 + 'm';
}
function paintSeason(){
  $('wkEnd').textContent = weekEnd();
  var h = A.getHandle();
  $('lnkMap').href = h ? '/p/' + encodeURIComponent(h) : '/me';
}
setInterval(paintSeason, 30000);

// ============================================================== territorio en el plano
var terrCache = { city: null, map: {} };
SK.drawTerritory = function(ctx, sx, sy, z){
  var me = A.getHandle(); if (!me || !S.G) return;
  var tag = S.stats && S.stats.crew && S.stats.crew.tag;
  if (terrCache.city !== S.cityId){ terrCache = { city: S.cityId, map: {} }; }
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (var k in S.kings){
    var K = S.kings[k]; if (!K || !K.g) continue;
    var mine = K.h === me, mate = !mine && tag && K.c === tag;
    if (!mine && !mate) continue;
    var P = terrCache.map[k];
    if (!P || P.src !== K.g){
      var arr; try { arr = JSON.parse(K.g); } catch(e){ arr = null; }
      if (!arr || !arr.length) continue;
      P = { src: K.g, pts: arr.map(function(ll){ return A.proj(ll); }) };
      terrCache.map[k] = P;
    }
    ctx.beginPath();
    ctx.moveTo(sx(P.pts[0][0]), sy(P.pts[0][1]));
    for (var i = 1; i < P.pts.length; i++) ctx.lineTo(sx(P.pts[i][0]), sy(P.pts[i][1]));
    ctx.setLineDash(mine ? [] : [6 * S.dpr, 5 * S.dpr]);
    ctx.strokeStyle = 'rgba(242,193,78,.28)'; ctx.lineWidth = Math.max(6, 11 * z); ctx.stroke();
    ctx.strokeStyle = mine ? '#F2C14E' : 'rgba(242,193,78,.8)'; ctx.lineWidth = Math.max(2.5, 4.2 * z); ctx.stroke();
  }
  ctx.restore();
};

// ============================================================== te han quitado tu calle
var inboxSeen = ls('sk_inbox_at') || null, inboxFirst = true;
async function checkInbox(){
  if (!(await A.openDb())) return;
  var rows = await NET.call('inbox', { device: A.deviceId(), since: inboxSeen }, 12000);
  if (!rows || !rows.length){ inboxFirst = false; return; }
  var fresh = rows.filter(function(r){ return !inboxSeen || r.at > inboxSeen; });
  inboxSeen = rows[0].at; ls('sk_inbox_at', inboxSeen);
  if (!fresh.length){ inboxFirst = false; return; }
  if (inboxFirst) showInbox(fresh);
  else fresh.forEach(function(r){
    toast('🚨 <b>' + esc(r.thief) + '</b> te ha quitado <b>' + esc(r.street_name) + '</b>', true);
    notify('Te han quitado ' + r.street_name, r.thief + ' la ha hecho en ' + fmt(r.ms) + '. Entra y recupérala.');
  });
  inboxFirst = false;
  refreshStats();
}
function showInbox(rows){
  var html = rows.slice(0, 8).map(function(r, i){
    return '<div class="ib"><div><b>' + esc(r.street_name) + '</b><small>' + esc(r.city_name || '') + ' · ' + esc(r.thief) +
      (r.thief_crew ? ' [' + esc(r.thief_crew) + ']' : '') + ' · ' + fmt(r.ms) + '</small></div>' +
      (r.share ? '<button class="btn" data-i="' + i + '">Recuperar</button>' : '') + '</div>';
  }).join('');
  $('inboxList').innerHTML = html;
  $('inboxTitle').textContent = rows.length === 1 ? 'Te han quitado una calle' : 'Te han quitado ' + rows.length + ' calles';
  $('inbox').classList.add('on');
  $('inboxList').querySelectorAll('button').forEach(function(b){
    b.onclick = function(){
      var ch = A.readChallengeQ(rows[+b.dataset.i].share);
      $('inbox').classList.remove('on');
      if (ch){ ch.n = rows[+b.dataset.i].thief; ch.ms = 0; A.startChallenge(ch); }
    };
  });
}
$('inboxClose').onclick = function(){ $('inbox').classList.remove('on'); };
function notify(title, body){
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (!document.hidden) return;
    new Notification(title, { body: body, icon: '/icon-192.png', tag: 'kos-' + title });
  } catch(e){}
}
setInterval(checkInbox, 90000);

// ============================================================== tras la carrera
SK.onFinish = function(run, board){
  var box = $('after'), html = '';
  if (run.rec && run.rec.length > 30 && window.MediaRecorder && HTMLCanvasElement.prototype.captureStream)
    $('vid').hidden = false;
  if (run.won && run.won.length){
    var perm = ('Notification' in window) ? Notification.permission : 'denied';
    html += '<div class="guard"><div class="gt">🛡️ ¿Te aviso si te la quitan?</div><div class="gr">';
    if (perm === 'default') html += '<button type="button" class="btn ghost" id="askPush">🔔 Avisos en este móvil</button>';
    if (!ls('sk_optin')) html += '<input type="email" id="optMail" placeholder="o tu email" autocomplete="email"><button type="button" class="btn ghost" id="optGo">OK</button>';
    html += '</div></div>';
    if (perm !== 'default' && ls('sk_optin')) html = '';
  }
  box.innerHTML = html;
  var ap = $('askPush');
  if (ap) ap.onclick = function(){
    Notification.requestPermission().then(function(p){
      ap.textContent = p === 'granted' ? '🔔 Activado' : 'Sin permiso'; ap.disabled = true;
    });
  };
  var og = $('optGo');
  if (og) og.onclick = async function(){
    var m = $('optMail').value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m)){ $('optMail').focus(); return; }
    var ok = await NET.call('optin', { email: m, handle: A.getHandle(), device: A.deviceId() }, 12000);
    if (ok){ ls('sk_optin', '1'); og.textContent = '✓'; og.disabled = true; $('optMail').disabled = true; }
    else toast('No he podido guardar ese email.', true);
  };
  refreshStats();
};

// ============================================================== calle del día
// Una ruta mítica al día, la misma para todo el mundo (UTC). Cada día su propio ranking.
var DAILY = [
  { t: 'Gran Vía', p: 'Madrid', a: [40.42330, -3.71230], b: [40.41890, -3.69750] },
  { t: 'Champs-Élysées', p: 'París', a: [48.87380, 2.29500], b: [48.86560, 2.32120] },
  { t: 'The Mall', p: 'Londres', a: [51.50800, -0.12810], b: [51.50140, -0.14190] },
  { t: 'Times Square → Columbus Circle', p: 'Nueva York', a: [40.75800, -73.98550], b: [40.76810, -73.98190] },
  { t: 'Shibuya → Omotesando', p: 'Tokio', a: [35.65950, 139.70050], b: [35.66520, 139.71230] },
  { t: 'Torre del Oro → Plaza de España', p: 'Sevilla', a: [37.38240, -5.99630], b: [37.37720, -5.98690] },
  { t: 'La Rambla', p: 'Barcelona', a: [41.38700, 2.17010], b: [41.37580, 2.17780] },
  { t: 'Via dei Fori Imperiali', p: 'Roma', a: [41.89620, 12.48230], b: [41.89020, 12.49220] },
  { t: 'Unter den Linden', p: 'Berlín', a: [52.51630, 13.37770], b: [52.52190, 13.41320] },
  { t: 'Rua Augusta', p: 'Lisboa', a: [38.70750, -9.13640], b: [38.71390, -9.13940] },
  { t: 'Obelisco → Plaza de Mayo', p: 'Buenos Aires', a: [-34.60370, -58.38160], b: [-34.60830, -58.37120] },
  { t: 'Zócalo → Bellas Artes', p: 'Ciudad de México', a: [19.43260, -99.13320], b: [19.43520, -99.14120] },
  { t: 'Casino → Puerto', p: 'Mónaco', a: [43.73930, 7.42780], b: [43.73470, 7.42140] },
  { t: 'Hollywood Boulevard', p: 'Los Ángeles', a: [34.10160, -118.33870], b: [34.10160, -118.32670] },
  { t: 'The Strip', p: 'Las Vegas', a: [36.11260, -115.17670], b: [36.12650, -115.16570] },
  { t: 'Union Square → Lombard Street', p: 'San Francisco', a: [37.78800, -122.40750], b: [37.80210, -122.41870] },
  { t: 'Calle Larios', p: 'Málaga', a: [36.71870, -4.42140], b: [36.72290, -4.41740] },
  { t: 'İstiklal', p: 'Estambul', a: [41.03700, 28.98500], b: [41.02560, 28.97420] },
  { t: 'Dam → Rijksmuseum', p: 'Ámsterdam', a: [52.37310, 4.89260], b: [52.36000, 4.88520] },
  { t: 'Duomo → Castello', p: 'Milán', a: [45.46410, 9.19190], b: [45.47050, 9.17950] },
  { t: 'Ayuntamiento → Torres de Serranos', p: 'Valencia', a: [39.46990, -0.37630], b: [39.47920, -0.37590] }
];
function dayKey(d){ d = d || new Date(); return d.toISOString().slice(0, 10); }
function dailyToday(){
  var days = Math.floor(Date.now() / 86400000);
  var r = DAILY[((days * 8) % DAILY.length + DAILY.length) % DAILY.length];      // 8 y 21 son primos entre sí: pasan todas
  return { t: r.t, p: r.p, a: r.a, b: r.b, id: 'daily-' + dayKey() };
}
function dailyLeft(){
  var now = new Date(), end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  var m = Math.floor((end - now) / 60000);
  return Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
}
async function paintDaily(){
  var d = dailyToday();
  $('dailyName').textContent = d.t + ' · ' + d.p;
  var info = 'se acaba en ' + dailyLeft();
  if (await A.openDb()){
    var b = await NET.call('board', { route: d.id }, 12000);
    if (b && b.entries && b.entries.length) info = '👑 ' + b.entries[0].h + ' ' + fmt(b.entries[0].ms) + ' · ' + b.entries.length + ' pilotos · ' + info;
    else if (b) info = 'nadie la ha corrido hoy · ' + info;
  }
  $('dailyInfo').textContent = info;
}
function startDaily(){
  var d = dailyToday();
  A.startChallenge({ c: '', p: d.p, a: d.a, b: d.b, t: '🔥 ' + d.t, r: d.id, n: '', ms: 0 });
}
$('dailyBtn').onclick = startDaily;
setInterval(paintDaily, 120000);

// ============================================================== bandas
function renderCrew(){
  var box = $('crewBox'), c = S.stats && S.stats.crew;
  if (c){
    box.innerHTML = '<div class="crew"><div class="ct"><span class="tag">' + esc(c.tag) + '</span><b>' + esc(c.name) + '</b></div>' +
      '<small>' + c.members + ' ' + (c.members === 1 ? 'miembro' : 'miembros') + ' · ' + c.streets + ' calles · código <code>' + esc(c.code) + '</code></small>' +
      '<div class="row2"><button type="button" class="btn ghost" id="crewInv">Invitar</button><button type="button" class="btn ghost" id="crewOut">Salir</button></div>' +
      '<a class="hint" href="/crews" target="_top">Ranking de bandas →</a></div>';
    $('crewInv').onclick = function(){
      var url = topOrigin() + '/?crew=' + encodeURIComponent(c.code);
      var text = 'Únete a ' + c.name + ' [' + c.tag + '] en King of Streets. Vamos a por las calles del barrio.';
      if (navigator.share) navigator.share({ title: 'King of Streets', text: text, url: url }).catch(function(){});
      else if (navigator.clipboard) navigator.clipboard.writeText(text + ' ' + url).then(function(){ toast('Invitación copiada.'); });
    };
    $('crewOut').onclick = async function(){
      if (!confirm('¿Salir de ' + c.name + '? Tus calles dejarán de contar para la banda.')) return;
      await NET.call('crew_leave', { device: A.deviceId() }, 12000); refreshStats();
    };
    return;
  }
  box.innerHTML = '<div class="crewf"><input type="text" id="crewName" maxlength="32" placeholder="Nombre de la banda">' +
    '<div class="where"><input type="text" id="crewTag" maxlength="5" placeholder="TAG"><button type="button" class="btn" id="crewMake">Crear</button></div>' +
    '<div class="where"><input type="text" id="crewCode" maxlength="6" placeholder="Código de invitación"><button type="button" class="btn ghost" id="crewJoin">Unirme</button></div>' +
    '<p class="hint">Junta a tu barrio. Las calles de todos suman para la banda. <a href="/crews" target="_top">Ranking</a></p></div>';
  $('crewMake').onclick = async function(){
    if (!A.getHandle()){ toast('Pon antes tu nombre de piloto.', true); $('handle').focus(); return; }
    var r = await NET.call('crew_create', { name: $('crewName').value, tag: $('crewTag').value, device: A.deviceId(), handle: A.getHandle() }, 12000);
    if (!r) return toast('Ahora mismo no se puede crear. Prueba luego.', true);
    if (!r.ok) return toast({ tag: 'El TAG va de 2 a 5 letras o números.', name: 'Ponle un nombre.', tag_taken: 'Ese TAG ya lo tiene otra banda.' }[r.reason] || 'No se ha podido crear.', true);
    toast('Banda <b>' + esc(r.name) + '</b> creada. Invita a tu gente.'); refreshStats();
  };
  $('crewJoin').onclick = function(){ joinCrew($('crewCode').value); };
}
async function joinCrew(code){
  if (!code) return;
  if (!(await A.openDb())) return;
  var r = await NET.call('crew_join', { code: code, device: A.deviceId(), handle: A.getHandle() }, 12000);
  if (!r || !r.ok) return toast(r && r.reason === 'full' ? 'Esa banda está llena.' : 'Ese código no existe.', true);
  toast('Ya eres de <b>' + esc(r.name) + '</b> [' + esc(r.tag) + '].'); refreshStats();
}

// ============================================================== controles de móvil
S.autoGas = ls('sk_autogas') ? ls('sk_autogas') === '1' : COARSE;
S.tilt = 0;
var tiltOn = ls('sk_tilt') === '1', tiltBase = null;
function paintCtl(){
  $('cAuto').classList.toggle('on', !!S.autoGas);
  $('cTilt').classList.toggle('on', tiltOn);
  $('touch').classList.toggle('tilt', tiltOn);
  $('touch').classList.toggle('auto', !!S.autoGas);
}
$('cAuto').onclick = function(){ S.autoGas = !S.autoGas; ls('sk_autogas', S.autoGas ? '1' : '0'); paintCtl(); };
$('cTilt').onclick = function(){
  if (tiltOn){ tiltOn = false; S.tilt = 0; ls('sk_tilt', '0'); paintCtl(); return; }
  var D = window.DeviceOrientationEvent;
  var go = function(){ tiltOn = true; tiltBase = null; ls('sk_tilt', '1'); paintCtl(); toast('Inclina el móvil para girar.'); };
  if (D && typeof D.requestPermission === 'function')
    D.requestPermission().then(function(p){ if (p === 'granted') go(); else toast('Sin permiso para el giroscopio.', true); }).catch(function(){ toast('Sin permiso para el giroscopio.', true); });
  else if (D) go(); else toast('Este dispositivo no tiene giroscopio.', true);
};
SK.calibrateTilt = function(){ if (S.tiltRaw == null) return false; tiltBase = S.tiltRaw; ls('sk_tiltzero', String(Math.round(S.tiltRaw * 10) / 10)); return true; };
window.addEventListener('deviceorientation', function(e){
  if (!tiltOn || e.gamma == null) return;
  var ang = (screen.orientation && screen.orientation.angle) || window.orientation || 0, v;
  if (ang === 90) v = e.beta; else if (ang === -90 || ang === 270) v = -e.beta; else v = e.gamma;
  if (tiltBase === null) tiltBase = +(ls('sk_tiltzero') || 0);
  S.tiltRaw = v;
  v -= tiltBase;
  var dz = 3, sens = +(ls('sk_tiltsens') || 22), k = Math.abs(v) < dz ? 0 : (Math.abs(v) - dz) * Math.sign(v) / sens;
  S.tilt = -Math.max(-1, Math.min(1, k));
});

// ============================================================== tu calle (primera vez)
function showOnboarding(){
  $('onb').classList.add('on');
  var h = A.getHandle(); if (h) $('onbName').value = h;
  setTimeout(function(){ try { $('onbStreet').focus(); } catch(e){} }, 300);
}
function closeOnb(){ $('onb').classList.remove('on'); ls('sk_onb', '1'); }
async function goMyStreet(){
  var q = $('onbStreet').value.trim(), nm = $('onbName').value.trim();
  if (nm) { A.setHandle(nm); $('handle').value = S.handle; }
  if (!q){ $('onbStreet').focus(); return; }
  $('onbGo').disabled = true; $('onbMsg').textContent = 'Buscando ' + q + '…';
  var g = await A.geocode(q);
  $('onbGo').disabled = false;
  if (!g){ $('onbMsg').textContent = 'No la encuentro. Pon calle y ciudad, por ejemplo "Calle Feria, Sevilla".'; return; }
  $('onbMsg').textContent = 'Bajando las calles de ' + g.city + '…';
  closeOnb();
  S.pendingRoute = { fn: function(){ routeFromHere(g.lat, g.lon, g.label); } };
  A.openPlace(g.city, g.lat, g.lon, null);
}
// Desde tu calle hasta un punto a ~800 m: prueba varios destinos hasta que uno tenga ruta
SK.routeFromHere = function(lat, lon, label){ routeFromHere(lat, lon, label); };
function routeFromHere(lat, lon, label){
  var G = S.G, pa = A.proj([lat, lon]), a = A.snap(G, pa[0], pa[1]);
  if (a < 0) return;
  var cand = [];
  for (var n = 0; n < G.X.length; n += 2){
    if (G.comp[n] !== G.main) continue;
    var d = Math.hypot(G.X[n] - G.X[a], G.Y[n] - G.Y[a]);
    if (d > 550 && d < 1100) cand.push([Math.abs(d - 800) + Math.random() * 120, n]);
  }
  cand.sort(function(x, y){ return x[0] - y[0]; });
  var A0 = A.toLatLon(G.X[a], G.Y[a]), tries = 0;
  (function next(){
    var c = cand[tries++]; if (!c || tries > 6) return;
    var B0 = A.toLatLon(G.X[c[1]], G.Y[c[1]]);
    A.raceLatLon(A0, B0, 'Tu calle: ' + A.nearestName(a) + ' → ' + A.nearestName(c[1]), null).then(function(ok){
      if (!ok) next();
      else toast('👑 Esta es <b>tu</b> calle. Haz el mejor tiempo y ponle tu nombre.');
    });
  })();
}
$('onbGo').onclick = goMyStreet;
$('onbStreet').addEventListener('keydown', function(e){ if (e.key === 'Enter') goMyStreet(); });
$('onbSkip').onclick = closeOnb;
$('myStreet').onclick = function(e){ e.preventDefault(); showOnboarding(); };
$('onbDaily').onclick = function(){ var nm = $('onbName').value.trim(); if (nm){ A.setHandle(nm); $('handle').value = S.handle; } closeOnb(); startDaily(); };

// ============================================================== arranque
SK.bootHook = function(){
  var q = new URLSearchParams(topSearch() || '');
  var crew = q.get('crew');
  if (crew) setTimeout(function(){ joinCrew(crew.toUpperCase().slice(0, 8)); }, 2500);
  if (q.get('daily')){ startDaily(); return true; }
  if (!ls('sk_onb') && !crew){ showOnboarding(); }
  return false;
};
setTimeout(function(){ checkInbox(); refreshStats(); paintDaily(); }, 2500);
paintSeason(); paintCtl(); renderCrew(); renderPaints();

// ============================================================== vídeo vertical de 15 s
var VW = 720, VH = 1280, rec = null, LOGO = new Image(); LOGO.src = '/favicon.svg';
$('vid').onclick = function(){ if (!rec) makeVideo(); };
function sectorAt(splits, t){
  for (var i = 0; i < splits.length; i++) if (splits[i] != null && t <= splits[i]) return i;
  return splits.length - 1;
}
function makeVideo(){
  var run = S.lastRun; if (!run || !run.rec || !S.circuit) return;
  var d = run.rec, n = (d.length / 3) | 0, total = run.total;
  var CLIP = SK.clipLen || 0; SK.clipLen = 0;                       // clip corto de 10 s para TikTok/Reels
  var f = Math.max(1, total / (CLIP || 12000)), INTRO = CLIP ? 450 : 1100, PLAY = total / f, OUTRO = CLIP ? 1500 : 2300, END = INTRO + PLAY + OUTRO;
  var QRC = SK.qrCanvas ? SK.qrCanvas(A.shareUrl() || 'https://kingofstreets.com', 240) : null;
  var oc = document.createElement('canvas'); oc.width = VW; oc.height = VH;
  var g = oc.getContext('2d');
  var types = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  var mime = types.filter(function(t){ try { return MediaRecorder.isTypeSupported(t); } catch(e){ return false; } })[0];
  if (!mime){ toast('Este navegador no sabe grabar vídeo.', true); return; }
  var stream = oc.captureStream(30), chunks = [], mr;
  try { mr = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6000000 }); }
  catch(e){ toast('Este navegador no sabe grabar vídeo.', true); return; }
  mr.ondataavailable = function(e){ if (e.data && e.data.size) chunks.push(e.data); };

  var names = S.circuit.sect.map(function(s){ return s.name; });
  var wonSet = {}; (run.won || []).forEach(function(w){ wonSet[A.slug(w.name)] = w; });
  var save = { view: S.view, phase: S.phase, ghost: S.ghost, car: { x: S.car.x, y: S.car.y, h: S.car.h, speed: S.car.speed, vl: S.car.vl, prog: S.car.prog } };
  S.ghost = null; S.phase = 'replay'; S.car.vl = 0;
  if (S.view !== 'chase' && SK.setView) SK.setView('chase');
  if (SK.reset3d) SK.reset3d();
  SK.forceSize = [VW, VH];
  $('results').classList.remove('on');
  var wrap = $('vidwrap'); wrap.classList.add('on');
  var holder = $('vidbox'); holder.innerHTML = ''; oc.className = 'vidc'; holder.appendChild(oc);
  $('vidmsg').textContent = 'Grabando tu vídeo…'; $('vidbtns').hidden = true;
  var t0 = performance.now(), lastSect = -1, flash = null;
  rec = { run: run };

  function sample(tms){
    var fi = tms / 100, i = Math.min(n - 1, Math.floor(fi)), j = Math.min(n - 1, i + 1), u = Math.min(1, fi - i);
    var x = (d[i*3] + (d[j*3] - d[i*3]) * u) / 10, y = (d[i*3+1] + (d[j*3+1] - d[i*3+1]) * u) / 10;
    var h0 = d[i*3+2] / 100, h1 = d[j*3+2] / 100, dh = Math.atan2(Math.sin(h1 - h0), Math.cos(h1 - h0));
    var k = Math.max(0, i - 2), sp = Math.hypot(d[i*3] - d[k*3], d[i*3+1] - d[k*3+1]) / 10 / Math.max(0.1, (i - k) / 10);
    return { x: x, y: y, h: h0 + dh * u, sp: sp };
  }
  SK.beforeFrame = function(){
    var el = performance.now() - t0, lt = Math.max(0, Math.min(total, (el - INTRO) * f));
    var p = sample(lt); S.car.x = p.x; S.car.y = p.y; S.car.h = p.h; S.car.speed = p.sp; S.steerOut = 0; S.thrOut = 0.4;
  };
  SK.afterFrame = function(){
    var el = performance.now() - t0, lt = Math.max(0, Math.min(total, (el - INTRO) * f));
    var gl3 = $('gl3');
    try { g.drawImage(gl3, 0, 0, VW, VH); } catch(e){}
    // degradados para que el texto se lea
    var gr = g.createLinearGradient(0, 0, 0, 330); gr.addColorStop(0, 'rgba(6,9,13,.82)'); gr.addColorStop(1, 'rgba(6,9,13,0)');
    g.fillStyle = gr; g.fillRect(0, 0, VW, 330);
    var gb = g.createLinearGradient(0, VH - 360, 0, VH); gb.addColorStop(0, 'rgba(6,9,13,0)'); gb.addColorStop(1, 'rgba(6,9,13,.85)');
    g.fillStyle = gb; g.fillRect(0, VH - 360, VW, 360);
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.fillStyle = '#FF5B3D'; g.font = '700 30px "Barlow Condensed", Arial Narrow, sans-serif';
    g.fillText('KING OF STREETS', VW / 2 + 22, 58);
    if (LOGO.complete && LOGO.naturalWidth) g.drawImage(LOGO, VW / 2 - 124, 30, 38, 38);
    g.fillStyle = '#E8EFF5'; g.font = '700 40px "Barlow Condensed", Arial Narrow, sans-serif';
    wrapText(g, (run.title || '').replace(/^🔥 /, ''), VW / 2, 104, VW - 80, 44, 2);
    g.fillStyle = '#8296A8'; g.font = '500 26px Barlow, sans-serif'; g.fillText(run.city || '', VW / 2, 190);
    if (el < END - OUTRO){
      g.fillStyle = '#FFFFFF'; g.font = '700 92px "JetBrains Mono", monospace';
      g.fillText(fmt(lt), VW / 2, 300);
      if (f > 1.05){ g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '500 22px "JetBrains Mono", monospace'; g.fillText('×' + f.toFixed(1), VW - 60, 300); }
      var si = sectorAt(run.splits, lt), nm = names[si] || '';
      if (si !== lastSect){
        if (lastSect >= 0 && wonSet[A.slug(names[lastSect] || '')]) flash = { name: names[lastSect], at: el };
        lastSect = si;
      }
      plaque(g, nm, VH - 150);
      if (flash && el - flash.at < 1400){
        var a = Math.min(1, (el - flash.at) / 180) * Math.min(1, (1400 - (el - flash.at)) / 300);
        g.save(); g.globalAlpha = a;
        g.fillStyle = 'rgba(10,14,19,.86)'; roundRect(g, 60, VH / 2 - 110, VW - 120, 150, 18); g.fill();
        g.fillStyle = '#F2C14E'; g.font = '700 54px "Barlow Condensed", Arial Narrow, sans-serif'; g.fillText('👑 ES MÍA', VW / 2, VH / 2 - 40);
        g.fillStyle = '#E8EFF5'; g.font = '600 32px Barlow, sans-serif'; wrapText(g, flash.name, VW / 2, VH / 2 + 6, VW - 160, 34, 1);
        g.restore();
      }
      if (el < INTRO){
        g.save(); g.globalAlpha = 1 - el / INTRO;
        g.fillStyle = '#FF5B3D'; g.font = '700 120px "Barlow Condensed", Arial Narrow, sans-serif'; g.fillText('GO', VW / 2, VH / 2);
        g.restore();
      }
    } else {
      var o = Math.min(1, (el - (END - OUTRO)) / 350);
      g.save(); g.globalAlpha = o;
      g.fillStyle = 'rgba(6,9,13,.9)'; g.fillRect(0, 0, VW, VH);
      if (LOGO.complete && LOGO.naturalWidth) g.drawImage(LOGO, VW / 2 - 60, 150, 120, 120);
      g.fillStyle = '#FF5B3D'; g.font = '700 34px "Barlow Condensed", Arial Narrow, sans-serif'; g.fillText('KING OF STREETS', VW / 2, 310);
      g.fillStyle = '#FFFFFF'; g.font = '700 120px "JetBrains Mono", monospace'; g.fillText(fmt(total), VW / 2, 540);
      g.fillStyle = '#E8EFF5'; g.font = '700 44px "Barlow Condensed", Arial Narrow, sans-serif';
      wrapText(g, (run.title || '').replace(/^🔥 /, ''), VW / 2, 640, VW - 100, 48, 2);
      var nw = (run.won || []).length;
      g.fillStyle = '#F2C14E'; g.font = '700 46px "Barlow Condensed", Arial Narrow, sans-serif';
      g.fillText(nw ? '👑 ' + nw + (nw === 1 ? ' CALLE CONQUISTADA' : ' CALLES CONQUISTADAS') : '¿ME LA QUITAS?', VW / 2, 800);
      if (QRC){ g.fillStyle = '#FFFFFF'; roundRect(g, VW / 2 - 132, 850, 264, 264, 16); g.fill(); g.drawImage(QRC, VW / 2 - 120, 862, 240, 240); }
      g.fillStyle = '#FFFFFF'; g.font = '600 40px Barlow, sans-serif'; g.fillText('kingofstreets.com', VW / 2, QRC ? 1170 : 1010);
      g.fillStyle = '#8296A8'; g.font = '500 28px Barlow, sans-serif'; g.fillText(QRC ? 'Escanea y córrela' : 'Cada calle tiene un rey', VW / 2, QRC ? 1215 : 1060);
      g.restore();
    }
    if (el >= END && mr.state === 'recording') mr.stop();
  };
  mr.onstop = function(){
    SK.beforeFrame = null; SK.afterFrame = null; SK.forceSize = null;
    S.phase = save.phase === 'run' ? 'done' : save.phase; S.ghost = save.ghost;
    for (var k in save.car) S.car[k] = save.car[k];
    if (save.view !== 'chase' && SK.setView) SK.setView(save.view);
    var blob = new Blob(chunks, { type: mime.split(';')[0] });
    showVideo(blob, mime.indexOf('mp4') >= 0 ? 'mp4' : 'webm', run);
    rec = null;
  };
  mr.start(250);
}
function showVideo(blob, ext, run){
  var url = URL.createObjectURL(blob);
  var box = $('vidbox'); box.innerHTML = '';
  var v = document.createElement('video'); v.src = url; v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true; v.controls = true; v.className = 'vidc';
  box.appendChild(v);
  var name = 'kingofstreets-' + A.slug(run.title || 'vuelta').slice(0, 40) + '.' + ext;
  var file = null; try { file = new File([blob], name, { type: blob.type }); } catch(e){}
  $('vidmsg').textContent = 'Listo. Súbelo a TikTok, Reels o Shorts.';
  $('vidbtns').hidden = false;
  var canFiles = file && navigator.canShare && navigator.canShare({ files: [file] });
  $('vidShare').hidden = !canFiles;
  $('vidShare').onclick = function(){
    var link = A.shareUrl();
    navigator.share({ files: [file], title: 'King of Streets', text: fmt(run.total) + ' en ' + run.title + '. ¿Me la quitas? ' + (link || '') }).catch(function(){});
  };
  $('vidDown').onclick = function(){
    var a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  };
  $('vidClose').onclick = function(){ $('vidwrap').classList.remove('on'); box.innerHTML = ''; URL.revokeObjectURL(url); $('results').classList.add('on'); };
}
function roundRect(g, x, y, w, h, r){ g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function plaque(g, name, y){
  if (!name) return;
  g.font = '700 38px "Barlow Condensed", Arial Narrow, sans-serif';
  var w = Math.min(VW - 80, g.measureText(name.toUpperCase()).width + 60);
  g.fillStyle = '#F3F1E9'; roundRect(g, (VW - w) / 2, y - 50, w, 70, 4); g.fill();
  g.strokeStyle = '#C9D6E4'; g.lineWidth = 2; roundRect(g, (VW - w) / 2 + 5, y - 45, w - 10, 60, 3); g.stroke();
  g.fillStyle = '#123A6B'; g.fillText(name.toUpperCase(), VW / 2, y, VW - 110);
}
function wrapText(g, text, x, y, maxW, lh, maxLines){
  var words = String(text).split(' '), line = '', lines = [];
  for (var i = 0; i < words.length; i++){
    var t = line ? line + ' ' + words[i] : words[i];
    if (g.measureText(t).width > maxW && line){ lines.push(line); line = words[i]; } else line = t;
  }
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach(function(l, k){ g.fillText(l, x, y + k * lh, maxW); });
}
SK.boot && SK.boot();
})();
