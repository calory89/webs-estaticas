/* King of Streets v3.2 — elegir coche y retar a los amigos.
   Un reto es un enlace (?g=código) con la misma ruta: entra quien quiera, cada uno corre,
   y todos ven el ranking del grupo y los coches de los demás compitiendo a la vez. */
(function(){
'use strict';
var A = window.SK && SK.api; if (!A) return;
var S = A.S, NET = A.NET, $ = A.$, esc = A.esc, fmt = A.fmt, toast = A.toast;
function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch(e){ return null; } }
function topOrigin(){ try { var o = window.top.location.origin; if (o && o !== 'null' && !/localhost|127\.0\.0\.1/.test(o)) return o; } catch(e){} return 'https://kingofstreets.com'; }
function topSearch(){ try { return window.top.location.search; } catch(e){ return location.search; } }
var GCOL = ['#4FC3F7', '#B388FF', '#69F0AE', '#FF8A80', '#FFD54F'];

var css = `
.cars{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}
.car{background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:4px 4px 5px;display:flex;flex-direction:column;align-items:center;gap:1px}
.car svg,.car img{width:100%;height:auto;display:block;aspect-ratio:12/7;object-fit:contain}
.car{position:relative}.car .pdot{position:absolute;top:5px;right:5px;width:11px;height:11px;border-radius:50%;border:2px solid #fff}
.car span{font-family:var(--cond);text-transform:uppercase;letter-spacing:.1em;font-size:11px;color:var(--muted)}
.car.on{border-color:var(--trace);background:var(--surface2)} .car.on span{color:var(--fg)}
#shareSheet .card{width:min(460px,100%)}
.shr{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:6px 22px 4px}
.shr a,.shr button{display:flex;flex-direction:column;align-items:center;gap:5px;text-decoration:none;color:var(--fg);background:var(--surface);
  border:1px solid var(--line);border-radius:10px;padding:10px 4px;font:600 11px var(--cond);letter-spacing:.08em;text-transform:uppercase}
.shr i{font-style:normal;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff}
.lnk{margin:8px 22px 0;display:flex;gap:6px}
.lnk input{flex:1;font-family:var(--mono);font-size:12px}
.lnk .btn{width:auto;padding:8px 12px;font-size:12px}
.gb{padding:8px 22px 0}
.gb .row{display:grid;grid-template-columns:22px 26px 1fr auto;gap:8px;align-items:center;font-family:var(--mono);font-size:12.5px;padding:5px 0;color:var(--muted);border-top:1px solid var(--line)}
.gb .row.me{color:var(--fg)} .gb .row b{color:var(--gold)}
.gb .dot{width:12px;height:12px;border-radius:50%}
.gb svg{width:26px;height:auto}
.grp{background:linear-gradient(135deg,#0E2A3A,#1A2530 70%);border:1px solid #1E5A7A;border-radius:6px;padding:10px 12px}
.grp .gt{font-family:var(--cond);text-transform:uppercase;letter-spacing:.14em;font-size:11px;color:#7FD3FF;font-weight:700}
.grp b{font-family:var(--cond);font-size:17px;display:block;margin:2px 0 4px}
.grp .row{display:flex;justify-content:space-between;font-family:var(--mono);font-size:11.5px;color:var(--muted);padding:2px 0}
.grp .row.me{color:var(--fg)}
.myg{display:flex;flex-direction:column;gap:5px}
.myg button{display:flex;justify-content:space-between;gap:8px;background:var(--surface);border:1px solid var(--line);border-left:2px solid #4FC3F7;border-radius:0 4px 4px 0;
  padding:7px 10px;text-align:left;color:var(--fg);font-size:12.5px}
.myg small{font-family:var(--mono);color:var(--muted);font-size:10.5px;white-space:nowrap}
#share2{background:var(--trace);color:#180703;border:0}
`;
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
function el(html){ var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

// ============================================================== coche
S.carKind = ls('sk_car') || 'hatch';
var rail = document.querySelector('.railscroll');
var paintsBlock = $('paints') && $('paints').closest('.block');
var carBlock = el('<div class="block"><div class="eyebrow">Tu coche · todos corren igual</div><div class="cars" id="cars"></div></div>');
var groupBlock = el('<div class="block" id="grpBlock" hidden><div class="grp" id="grpBox"></div></div>');
var myBlock = el('<div class="block" id="myBlock" hidden><div class="eyebrow">Tus retos</div><div class="myg" id="myg"></div></div>');
if (paintsBlock) rail.insertBefore(carBlock, paintsBlock); else rail.appendChild(carBlock);
var firstBlock = rail.querySelector('.block');
rail.insertBefore(groupBlock, firstBlock.nextSibling);
rail.insertBefore(myBlock, carBlock);
function renderCars(){
  var box = $('cars'); if (!box || !SK.CARS) return;
  var cur = SK.carId ? SK.carId(S.carKind) : S.carKind;
  box.innerHTML = SK.CARS.map(function(c){
    return '<button type="button" class="car' + (cur === c.id ? ' on' : '') + '" data-id="' + c.id + '">' +
      (SK.carThumb ? '<img src="' + SK.carThumb(c.id) + '" alt="" loading="lazy">' : SK.carSvg(c.id, S.paint || c.paint)) +
      (S.paint && cur === c.id ? '<i class="pdot" style="background:' + S.paint + '"></i>' : '') + '<span>' + esc(c.name) + (SK.engineLabel ? ' · ' + esc(SK.engineLabel(c.id)) : '') + '</span></button>';
  }).join('');
  box.querySelectorAll('.car').forEach(function(b){ b.onclick = function(){ S.carKind = b.dataset.id; ls('sk_car', S.carKind); renderCars(); }; });
}
renderCars();
if ($('paints') && window.MutationObserver) new MutationObserver(renderCars).observe($('paints'), { childList: true });

// ============================================================== retos de grupo
S.group = null;
function myGroups(){ try { return JSON.parse(ls('sk_groups') || '[]'); } catch(e){ return []; } }
function rememberGroup(g){
  var L = myGroups().filter(function(x){ return x.code !== g.code; });
  L.unshift({ code: g.code, title: g.title, city: g.city, share: g.share });
  ls('sk_groups', JSON.stringify(L.slice(0, 8)));
}
function groupUrl(code){
  var u = A.shareUrl(); if (!u) return null;
  var q = u.split('?')[1] || '';
  return topOrigin() + '/?g=' + code + (q ? '&' + q : '');
}
function cityName(){ var m = A.cityMeta(S.cityId); return m.name || (A.S && S.cityId) || ''; }
async function loadGroup(code, quiet){
  if (!(await A.openDb())) return null;
  var g = await NET.call('ch_get', { code: code, device: A.deviceId() }, 15000);
  if (!g){ if (!quiet) toast('Ese reto ya no existe.', true); return null; }
  S.group = g; rememberGroup(g);
  applyGroupGhosts(); renderGroup();
  return g;
}
function applyGroupGhosts(){
  var g = S.group;
  if (!g || !S.circuit || S.routeId !== g.route){ return; }
  S.ghosts = (g.ghosts || []).slice(0, 4).map(function(x, i){
    var data = Array.isArray(x.data) ? x.data : null; if (!data) return null;
    var pg = A.prepGhost({ data: data, ms: x.ms, h: x.h }); if (!pg) return null;
    pg.car = x.car || 'hatch'; pg.paint = x.paint || GCOL[i % GCOL.length]; pg.col2d = pg.paint; return pg;
  }).filter(Boolean);
}
SK.onRoute = function(routeId){ if (S.group && S.group.route === routeId) applyGroupGhosts(); };
function rowsHtml(entries, cls, max){
  return (entries || []).slice(0, max || 10).map(function(e, i){
    return '<div class="' + cls + (e.me ? ' me' : '') + '"><span>' + (i + 1) + '</span>' +
      (cls === 'row' && max > 6 ? '<span>' + (SK.carThumb ? '<img src="' + SK.carThumb(e.car || 'sedan') + '" alt="" style="width:26px">' : '') + '</span>' : '') +
      '<span>' + (i === 0 ? '👑 ' : '') + esc(e.h) + (e.me ? ' (tú)' : '') + '</span><b>' + fmt(e.ms) + '</b></div>';
  }).join('');
}
function renderGroup(){
  var g = S.group, box = $('grpBox');
  if (!g){ $('grpBlock').hidden = true; return; }
  $('grpBlock').hidden = false;
  var n = (g.entries || []).length;
  box.innerHTML = '<div class="gt">🏁 Reto de ' + esc(g.creator || 'alguien') + ' · ' + n + (n === 1 ? ' piloto' : ' pilotos') + '</div>' +
    '<b>' + esc((g.title || '').replace(/^🔥 /, '')) + '</b>' +
    ((g.entries || []).slice(0, 5).map(function(e, i){ return '<div class="row' + (e.me ? ' me' : '') + '"><span>' + (i + 1) + '. ' + esc(e.h) + (e.me ? ' (tú)' : '') + '</span><span>' + fmt(e.ms) + '</span></div>'; }).join('') ||
      '<div class="row"><span>Nadie ha terminado aún. Sé el primero.</span></div>') +
    '<div class="row2" style="margin-top:8px"><button type="button" class="btn" id="grpGo">Correr</button><button type="button" class="btn ghost" id="grpShare">Invitar</button></div>';
  $('grpGo').onclick = function(){
    if (S.routeId === g.route && S.circuit){ A.startCountdown(); return; }
    var ch = A.readChallengeQ(g.share); if (ch) A.startChallenge(ch);
  };
  $('grpShare').onclick = function(){ openShare(g.code); };
}
async function renderMyGroups(){
  var L = myGroups(); if (!L.length) return;
  if (!(await A.openDb())) return;
  var rows = [];
  for (var i = 0; i < Math.min(5, L.length); i++){
    var g = await NET.call('ch_get', { code: L[i].code, device: A.deviceId(), ghosts: 0 }, 12000);
    if (!g) continue;
    var pos = -1; (g.entries || []).forEach(function(e, k){ if (e.me) pos = k + 1; });
    rows.push({ g: g, pos: pos, n: (g.entries || []).length });
  }
  if (!rows.length) return;
  $('myBlock').hidden = false;
  $('myg').innerHTML = rows.map(function(r, i){
    return '<button type="button" data-i="' + i + '"><span>' + esc((r.g.title || '').replace(/^🔥 /, '').slice(0, 40)) + '</span><small>' +
      (r.pos > 0 ? (r.pos === 1 ? '👑 1º' : r.pos + 'º') + ' de ' + r.n : r.n + ' pilotos') + '</small></button>';
  }).join('');
  $('myg').querySelectorAll('button').forEach(function(b){
    b.onclick = function(){
      var g = rows[+b.dataset.i].g; S.group = g; renderGroup();
      var ch = A.readChallengeQ(g.share); if (ch) A.startChallenge(ch);
    };
  });
}

// ============================================================== compartir
var sheet = el('<div class="overlay" id="shareSheet"><div class="card">' +
  '<header><div class="lab">Reto entre amigos</div><h2 id="shTitle">Reta a tus amigos</h2></header>' +
  '<p class="hint" style="padding:10px 22px 0;margin:0" id="shSub">Todos corren la misma ruta. El enlace sirve para cuantos quieras: cada uno ve el ranking del grupo y los coches de los demás.</p>' +
  '<div class="shr" style="margin-top:12px">' +
    '<a id="shWa" target="_blank" rel="noopener"><i style="background:#25D366">✆</i>WhatsApp</a>' +
    '<a id="shTg" target="_blank" rel="noopener"><i style="background:#2AABEE">✈</i>Telegram</a>' +
    '<a id="shX" target="_blank" rel="noopener"><i style="background:#111;border:1px solid #333">𝕏</i>X</a>' +
    '<button type="button" id="shMore"><i style="background:var(--trace)">⋯</i>Más</button></div>' +
  '<div class="lnk"><input type="text" id="shLink" readonly><button type="button" class="btn" id="shCopy">Copiar</button></div>' +
  '<div class="gb" id="shBoard"></div>' +
  '<footer><button type="button" class="btn ghost" id="shClose">Cerrar</button></footer></div></div>');
$('stage').appendChild(sheet);
$('shClose').onclick = function(){ sheet.classList.remove('on'); };
function shareText(){
  var me = A.getHandle() || 'Alguien', where = cityName(), t = (S.routeTitle || '').replace(/^🔥 /, '');
  return S.best
    ? '👑 He hecho ' + fmt(S.best) + ' en ' + t + (where ? ' (' + where + ')' : '') + '. ¿Me superas? Misma calle, mismo coche, a ver quién gana 🏁'
    : '🏁 ' + me + ' te reta en ' + t + (where ? ' (' + where + ')' : '') + '. Calles reales, un rey por calle. ¿Te atreves?';
}
async function openShare(code){
  if (!A.getHandle()){
    var h = window.prompt('¿Con qué nombre retas? Es el que verán tus amigos.');
    if (h && h.trim()){ A.setHandle(h); $('handle').value = S.handle; }
  }
  if (!S.circuit) return;
  var url = null;
  if (!code && (await A.openDb())){
    var sq = (A.shareUrl() || '').split('?')[1];
    code = await NET.call('ch_create', { route: S.routeId, share: sq, title: S.routeTitle, city: cityName(), handle: A.getHandle(), device: A.deviceId() }, 15000);
    var run = S.lastRun;
    if (code && run && run.lapOk && run.routeId === S.routeId && run.rec)
      await NET.call('ch_submit', { code: code, ms: Math.round(run.total), handle: A.getHandle(), device: A.deviceId(), car: S.carKind, paint: S.paint || null, ghost: JSON.stringify(run.rec.slice(0, 18000)) }, 20000);
    if (code) await loadGroup(code, true);
  }
  url = code ? groupUrl(code) : A.shareUrl();
  if (!url) return;
  var text = shareText(), enc = encodeURIComponent;
  $('shLink').value = url;
  $('shWa').href = 'https://wa.me/?text=' + enc(text + '\n' + url);
  $('shTg').href = 'https://t.me/share/url?url=' + enc(url) + '&text=' + enc(text);
  $('shX').href = 'https://twitter.com/intent/tweet?text=' + enc(text) + '&url=' + enc(url);
  $('shMore').style.display = navigator.share ? '' : 'none';
  $('shMore').onclick = function(){ navigator.share({ title: 'King of Streets', text: text, url: url }).catch(function(){}); };
  $('shCopy').onclick = function(){
    var done = function(){ $('shCopy').textContent = '✓ Copiado'; setTimeout(function(){ $('shCopy').textContent = 'Copiar'; }, 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText(text + ' ' + url).then(done, function(){ $('shLink').select(); document.execCommand('copy'); done(); });
    else { $('shLink').select(); document.execCommand('copy'); done(); }
  };
  $('shBoard').innerHTML = S.group && S.group.entries && S.group.entries.length
    ? '<div class="eyebrow" style="margin-bottom:4px">Ranking del reto</div>' + rowsHtml(S.group.entries, 'row', 8) : '';
  sheet.classList.add('on');
}
$('shareRoute').onclick = function(){ openShare(S.group && S.group.route === S.routeId ? S.group.code : null); };
$('share2').onclick = function(){ openShare(S.group && S.group.route === S.routeId ? S.group.code : null); };
$('share2').textContent = '🏁 Retar amigos';

// ============================================================== al terminar: el reto del grupo
var pollT = null;
var prevFinish = SK.onFinish;
SK.onFinish = function(run, board){
  if (prevFinish) try { prevFinish(run, board); } catch(e){}
  var g = S.group;
  if (!g || run.routeId !== g.route || !run.lapOk) return;
  var before = -1; (g.entries || []).forEach(function(e, k){ if (e.me) before = k; });
  NET.call('ch_submit', { code: g.code, ms: Math.round(run.total), handle: A.getHandle(), device: A.deviceId(), car: S.carKind, paint: S.paint || null,
                          ghost: run.rec ? JSON.stringify(run.rec.slice(0, 18000)) : null }, 20000)
    .then(function(){ return loadGroup(g.code, true); })
    .then(function(ng){
      if (!ng) return;
      var pos = -1; (ng.entries || []).forEach(function(e, k){ if (e.me) pos = k; });
      var beat = (ng.entries || []).slice(pos + 1, before < 0 ? undefined : before + 1).filter(function(e){ return !e.me; }).map(function(e){ return e.h; });
      showGroupResult(ng, pos, beat);
    });
};
function showGroupResult(g, pos, beat){
  var box = $('after'); if (!box) return;
  var old = $('grpRes'); if (old) old.remove();
  var msg = pos === 0 ? '👑 Vas primero en el reto' : 'Vas ' + (pos + 1) + 'º de ' + g.entries.length + ' en el reto';
  if (beat.length) msg += ' · has adelantado a ' + beat.slice(0, 3).map(esc).join(', ');
  var d = el('<div class="gb" id="grpRes"><div class="eyebrow" style="margin-bottom:4px">' + msg + '</div>' + rowsHtml(g.entries, 'row', 8) + '</div>');
  box.insertBefore(d, box.firstChild);
  if (pollT) clearInterval(pollT);
  pollT = setInterval(function(){
    if (!$('results').classList.contains('on')){ clearInterval(pollT); pollT = null; return; }
    loadGroup(g.code, true).then(function(ng){ var r = $('grpRes'); if (ng && r) r.innerHTML = '<div class="eyebrow" style="margin-bottom:4px">Ranking del reto · en directo</div>' + rowsHtml(ng.entries, 'row', 8); });
  }, 15000);
}

// ============================================================== arranque: ¿venimos de un enlace de reto?
(function(){
  var q = new URLSearchParams(topSearch() || ''), code = (q.get('g') || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
  if (code) setTimeout(function(){ loadGroup(code).then(function(g){
    if (g && S.routeId !== g.route && !q.get('a')){ var ch = A.readChallengeQ(g.share); if (ch) A.startChallenge(ch); }
  }); }, 1200);
  setTimeout(renderMyGroups, 3500);
})();
})();
