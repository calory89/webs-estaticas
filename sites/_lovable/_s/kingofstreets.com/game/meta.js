/* King of Streets v7 — la parte social y de negocio del juego.
   Barrios (liga, ruta del día de tu barrio), reacciones y muro de cada calle, amigos, temporada mensual,
   torneos, monedas + tienda + pase de temporada gratis, invitaciones con pintura exclusiva, importar GPX,
   patrocinios, repetición TV, clip de 10 s, QR, logros en la nube y analítica con test A/B. */
(function(){
'use strict';
var A = window.SK && SK.api; if (!A) return;
var S = A.S, $ = A.$, esc = A.esc, toast = A.toast, fmt = A.fmt, NET = A.NET;
function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch(e){ return null; } }
function lj(k, d){ try { return JSON.parse(ls(k) || 'null') || d; } catch(e){ return d; } }
function el(html){ var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
function topSearch(){ try { return window.top.location.search; } catch(e){ return location.search; } }
function topOrigin(){ try { var o = window.top.location.origin; return /localhost|127\.0\.0\.1|^null$/.test(o) ? 'https://kingofstreets.com' : o; } catch(e){ return 'https://kingofstreets.com'; } }
function call(op, args, ms){ if (!NET || !NET.up) return Promise.resolve(null); args = args || {}; args.device = args.device || A.deviceId(); return NET.call(op, args, ms || 9000); }
function T(s){ return SK.t ? SK.t(s) : s; }
var rail = document.querySelector('.railscroll');
function addBlock(html, beforeId){ var b = el(html); var ref = beforeId && $(beforeId) && $(beforeId).closest('.block'); if (ref) ref.parentNode.insertBefore(b, ref.nextSibling); else if (rail) rail.appendChild(b); return b; }

var css = `
.mt{display:grid;grid-template-columns:22px 1fr auto;gap:8px;align-items:center;font-size:13px;padding:5px 0;border-top:1px solid var(--line)}
.mt b{color:var(--fg);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap} .mt small{font-family:var(--mono);color:var(--muted)}
.mt.me b{color:var(--gold)}
.coinbar{display:flex;align-items:center;justify-content:space-between;gap:8px;font:600 14px var(--cond);letter-spacing:.04em}
.coinbar b{color:var(--gold);font-size:20px}
.shop{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-top:8px}
.shop button{display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:7px 8px;color:var(--fg);font:600 12px var(--cond);text-align:left}
.shop button i{width:18px;height:18px;border-radius:50%;flex:none;background:var(--pc);box-shadow:0 0 0 2px rgba(255,255,255,.2)}
.shop button.own{border-color:var(--gold)} .shop button small{display:block;color:var(--muted);font-weight:500}
.pass{display:flex;gap:4px;margin-top:8px;overflow-x:auto;padding-bottom:4px}
.pass div{flex:0 0 58px;border:1px solid var(--line);border-radius:8px;padding:6px 4px;text-align:center;font:600 11px var(--cond);color:var(--muted);background:var(--surface)}
.pass div.on{border-color:var(--gold);color:var(--fg);background:var(--surface2)} .pass div b{display:block;font-size:17px}
.pass .bar{height:6px;border-radius:3px;background:var(--line);margin-top:6px;overflow:hidden} .pass .bar i{display:block;height:100%;background:var(--gold)}
.rx{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}
.rx button{background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:5px 10px;font-size:15px;color:var(--fg)}
.rx button.on{border-color:var(--gold);background:var(--surface2)} .rx button small{font:600 11px var(--mono);margin-left:4px;color:var(--muted)}
.wall{max-height:140px;overflow:auto;font-size:13px} .wall p{margin:4px 0;color:#DDE5EA} .wall p b{color:var(--gold)}
.wallsel{width:100%;margin-top:6px}
.spons{margin-top:8px;padding:8px 10px;border:1px dashed var(--gold);border-radius:8px;font-size:12.5px;color:#EBDDB0}
#tvBar{position:absolute;left:0;right:0;top:0;z-index:40;display:none;justify-content:space-between;align-items:center;padding:12px 16px;background:linear-gradient(180deg,rgba(0,0,0,.7),rgba(0,0,0,0));font:700 16px var(--cond);letter-spacing:.1em;color:#fff;text-transform:uppercase}
#tvBar.on{display:flex} #tvBar i{color:#FF3B3B;font-style:normal;margin-right:6px} #tvBar button{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.3);color:#fff;border-radius:999px;padding:6px 14px;font:600 13px var(--cond)}
`;
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

// ============================================================== QR
SK.qrCanvas = function(text, size){
  if (typeof window.qrcode !== 'function') return null;
  try {
    var q = window.qrcode(0, 'M'); q.addData(String(text)); q.make();
    var n = q.getModuleCount(), c = document.createElement('canvas'); c.width = c.height = size; var g = c.getContext('2d'), m = size / n;
    g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, size, size); g.fillStyle = '#0A0E13';
    for (var r = 0; r < n; r++) for (var k = 0; k < n; k++) if (q.isDark(r, k)) g.fillRect(Math.floor(k * m), Math.floor(r * m), Math.ceil(m), Math.ceil(m));
    return c;
  } catch(e){ return null; }
};

// ============================================================== analítica y test A/B
var AB = ls('sk_ab'); if (AB !== 'A' && AB !== 'B'){ AB = Math.random() < 0.5 ? 'A' : 'B'; ls('sk_ab', AB); }
S.ab = AB;
var evQ = [], evT = 0;
SK.track = function(name, props){
  if (ls('sk_noanalytics') === '1') return;
  evQ.push([name, props || null]); if (evQ.length > 30) evQ.shift();
};
setInterval(function(){ var e = evQ.shift(); if (e) call('ev', { name: e[0], props: e[1], variant: AB }, 6000); }, 1500);
SK.track('session', { city: S.cityId || null, lang: S.lang || 'es', touch: matchMedia('(pointer:coarse)').matches, pwa: /pwa=1/.test(topSearch()) || matchMedia('(display-mode: standalone)').matches });
// A/B: texto del botón para retar tras la carrera (qué mueve más a compartir)
function abShare(){ var b = $('share2'); if (b) b.textContent = AB === 'B' ? '⚔️ Reta a un amigo' : T('Retar'); }
setTimeout(abShare, 1500);
document.addEventListener('click', function(e){
  var t = e.target.closest && e.target.closest('#share2,#storyShare,#brag,#vid,#duelGo,#clip10,#tvGo'); if (t) SK.track('share_click', { id: t.id, ab: AB });
}, true);
var lastPhase = null;
setInterval(function(){ if (S.phase !== lastPhase){ if (S.phase === 'count') SK.track('race_start', { route: S.routeId ? String(S.routeId).slice(0, 60) : null, mode: S.mode || null }); lastPhase = S.phase; } }, 500);

// ============================================================== monedas, tienda y pase de temporada
var W = lj('sk_wallet', { coins: 0, xp: 0, day: '' });
function saveW(){ ls('sk_wallet', JSON.stringify(W)); paintShop(); }
function earn(n, why, xp, quiet){ W.coins += n; W.xp += (xp == null ? n : xp); saveW(); if (n > 0 && !quiet) toast('🪙 +' + n + ' ' + why); }
SK.earn = earn;
(function daily(){ var d = new Date().toISOString().slice(0, 10); if (W.day !== d){ W.day = d; setTimeout(function(){ earn(20, 'por venir hoy', 20); }, 4000); } })();
var SHOP = [
  { id: 'p#D4AF37', n: 'Oro líquido', c: '#D4AF37', price: 300 }, { id: 'p#C0C6CC', n: 'Cromo', c: '#C0C6CC', price: 250 },
  { id: 'p#FF2BD6', n: 'Rosa neón', c: '#FF2BD6', price: 200 }, { id: 'p#9DFF00', n: 'Verde ácido', c: '#9DFF00', price: 200 },
  { id: 'p#00E5FF', n: 'Cian eléctrico', c: '#00E5FF', price: 200 }, { id: 'p#FF7A00', n: 'Naranja Sevilla', c: '#FF7A00', price: 150 }
];
var EXCL = { id: 'p#1DE9B6', n: 'Embajador', c: '#1DE9B6' };               // 3 amigos invitados que corren
var SEASON_P = { id: 'p#B388FF', n: 'Lila de temporada', c: '#B388FF' };  // pase gratis, nivel 8
function owned(){ return lj('sk_owned', {}); }
function own(id){ var o = owned(); o[id] = 1; ls('sk_owned', JSON.stringify(o)); addPaints(); }
function addPaints(){
  if (!SK.PAINTS) return;
  SHOP.concat([EXCL, SEASON_P]).forEach(function(it){ if (!SK.PAINTS.some(function(p){ return p.c === it.c; })) SK.PAINTS.push({ c: it.c, n: it.n, need: 99999, shop: it.price || 0 }); });
  if (SK.renderPaints) SK.renderPaints();
}
setTimeout(addPaints, 600);
var TIERS = [ { xp: 50, r: '🪙 50', f: function(){ W.coins += 50; } }, { xp: 150, r: '🪙 80', f: function(){ W.coins += 80; } },
  { xp: 300, r: '🎨 Rosa', f: function(){ own('p#FF2BD6'); } }, { xp: 500, r: '🪙 120', f: function(){ W.coins += 120; } },
  { xp: 750, r: '🎨 Cian', f: function(){ own('p#00E5FF'); } }, { xp: 1050, r: '🪙 200', f: function(){ W.coins += 200; } },
  { xp: 1400, r: '🎨 Naranja', f: function(){ own('p#FF7A00'); } }, { xp: 1800, r: '💜 Lila', f: function(){ own(SEASON_P.id); } },
  { xp: 2300, r: '🪙 400', f: function(){ W.coins += 400; } }, { xp: 3000, r: '🎨 Oro', f: function(){ own('p#D4AF37'); } } ];
function passKey(){ return new Date().toISOString().slice(0, 7); }
function passState(){ var p = lj('sk_pass', {}); if (p.m !== passKey()){ p = { m: passKey(), xp: 0, got: 0 }; ls('sk_pass', JSON.stringify(p)); } return p; }
function passAdd(xp){
  var p = passState(); p.xp += xp;
  while (p.got < TIERS.length && p.xp >= TIERS[p.got].xp){ try { TIERS[p.got].f(); } catch(e){} toast('🎟️ Pase de temporada: nivel ' + (p.got + 1) + ' · ' + TIERS[p.got].r); p.got++; }
  ls('sk_pass', JSON.stringify(p)); saveW();
}
var shopB = addBlock('<div class="block" id="shopBlock"><div class="eyebrow">🪙 Monedas, tienda y pase de temporada</div><div id="shopBox"></div></div>', 'paints');
function paintShop(){
  var box = $('shopBox'); if (!box) return; var o = owned(), p = passState();
  var html = '<div class="coinbar"><span>Tus monedas</span><b>🪙 ' + W.coins + '</b></div><div class="shop">' +
    SHOP.map(function(it){ var has = !!o[it.id]; return '<button type="button" data-buy="' + it.id + '" class="' + (has ? 'own' : '') + '" style="--pc:' + it.c + '"><i></i><span>' + esc(it.n) + '<small>' + (has ? 'Tuya · toca para usar' : '🪙 ' + it.price) + '</small></span></button>'; }).join('') + '</div>';
  var cur = p.got < TIERS.length ? TIERS[p.got] : null, prev = p.got ? TIERS[p.got - 1].xp : 0;
  html += '<div class="eyebrow" style="margin-top:12px">🎟️ Pase de ' + new Date().toLocaleDateString('es-ES', { month: 'long' }) + ' · gratis</div><div class="pass">' +
    TIERS.map(function(t, i){ return '<div class="' + (i < p.got ? 'on' : '') + '"><b>' + (i + 1) + '</b>' + t.r + '</div>'; }).join('') + '</div>' +
    '<div class="pass" style="display:block"><div class="bar"><i style="width:' + (cur ? Math.min(100, (p.xp - prev) / (cur.xp - prev) * 100) : 100).toFixed(0) + '%"></i></div></div>' +
    '<p class="hint" style="margin:4px 0 0">XP: vueltas, coronas, modos y duelos. Se reinicia cada mes. Pronto: pase premium.</p>';
  box.innerHTML = html;
  box.querySelectorAll('[data-buy]').forEach(function(b){ b.onclick = function(){
    var it = SHOP.filter(function(x){ return x.id === b.dataset.buy; })[0], o2 = owned();
    if (o2[it.id]){ ls('sk_paint', it.c); S.paint = it.c; if (SK.renderPaints) SK.renderPaints(); if (SK.rebuildPlayerCar) SK.rebuildPlayerCar(); toast('🎨 ' + it.n + ' puesta.'); return; }
    if (W.coins < it.price){ toast('Te faltan ' + (it.price - W.coins) + ' monedas. Corre y conquista calles.', true); return; }
    W.coins -= it.price; own(it.id); saveW(); SK.track('shop_buy', { item: it.id }); toast('🛍️ ¡' + it.n + ' es tuya!');
  }; });
}
paintShop();

// ============================================================== al terminar: monedas, barrios, social, patrocinio, TV y clip
var prevFinish = SK.onFinish;
SK.onFinish = function(run, board){
  if (prevFinish) try { prevFinish(run, board); } catch(e){}
  try { afterRace(run, board); } catch(e){ console.warn(e); }
};
function afterRace(run){
  if (!run) return;
  var won = run.won || [];
  SK.track('lap_finish', { ok: !!run.lapOk, won: won.length, casual: !!run.casual, ms: Math.round(run.total || 0) });
  if (won.length) SK.track('crown', { n: won.length });
  var c = (run.lapOk ? 10 : 3) + won.length * 50; earn(c, won.length ? 'y ' + won.length + ' corona' + (won.length > 1 ? 's' : '') : 'por la vuelta'); passAdd(c + 10);
  if (run.lapOk && !ls('sk_refdone') && ls('sk_ref')) call('ref', { ref: ls('sk_ref'), handle: A.getHandle() }).then(function(ok){ ls('sk_refdone', '1'); });
  won.forEach(function(w, i){ setTimeout(function(){ tagBarrio(w.name); }, 1200 * i + 800); });
  var box = $('after'); if (!box) return;
  var tools = el('<div class="block" id="metaAfter" style="margin-top:10px"><div class="row2"><button type="button" class="btn ghost" id="tvGo">📺 Repetición TV</button><button type="button" class="btn ghost" id="clip10">⚡ Clip 10 s</button></div><div id="socBox"></div></div>');
  var old = $('metaAfter'); if (old) old.remove(); box.appendChild(tools);
  $('tvGo').onclick = function(){ startTV(run); };
  $('clip10').onclick = function(){ SK.clipLen = 8000; var v = $('vid'); if (v) v.click(); };
  if (!(run.rec && run.rec.length > 30)) { $('tvGo').hidden = true; $('clip10').hidden = !(window.MediaRecorder); }
  var main = S.circuit && S.circuit.sect && S.circuit.sect.length ? (won[0] ? won[0].name : S.circuit.sect.reduce(function(a, b){ return (b.to - b.from) > (a.to - a.from) ? b : a; }).name) : null;
  if (main) social(A.slug(main), main);
  var seenF = {}; won.forEach(function(w){ if (w.from && w.from !== 'anon' && !seenF[w.from] && w.from !== A.getHandle()){ seenF[w.from] = 1; followOffer(w.from); } });
}

// ---------------------------------------------------------------- reacciones y muro de la calle
var WALL = ['¡Voy a por ti! 🏁', 'Qué tiempazo 👏', 'Esta calle será mía 😈', 'Revancha mañana', 'GG 🤝', 'Imposible bajar de ahí 😱', 'Me la has quitado… volveré', 'Hoy entreno aquí', '¿Quién se apunta?', 'Rey legítimo 👑'];
function social(slug, name, data){
  var city = A.kingKey(S.cityId);
  var p = data ? Promise.resolve(data) : call('social', { city: city, slug: slug });
  p.then(function(d){
    var box = $('socBox'); if (!box || !d) return;
    var R = d.reactions || {}, mine = d.mine || [];
    var html = '<div class="eyebrow" style="margin-top:10px">' + esc(name) + ' · reacciones y muro</div><div class="rx">' +
      ['👑', '🔥', '😂', '😱', '👏', '💀'].map(function(e){ return '<button type="button" data-rx="' + e + '" class="' + (mine.indexOf(e) >= 0 ? 'on' : '') + '">' + e + '<small>' + (R[e] || 0) + '</small></button>'; }).join('') + '</div>' +
      '<div class="wall">' + ((d.wall || []).map(function(w){ return '<p><b>' + esc(w.h || 'anon') + '</b> ' + esc(w.msg) + '</p>'; }).join('') || '<p class="hint">Nadie ha escrito aún. Estrena el muro.</p>') + '</div>' +
      '<select class="wallsel" id="wallSel"><option value="">✍️ Escribe en el muro de la calle…</option>' + WALL.map(function(m){ return '<option>' + esc(m) + '</option>'; }).join('') + '</select>' +
      (d.barrio && d.barrio.barrio ? '<p class="hint" style="margin:6px 0 0">🏘️ Barrio: <b>' + esc(d.barrio.barrio) + '</b></p>' : '') +
      (d.sponsor ? '<div class="spons">🤝 Calle patrocinada por <b>' + esc(d.sponsor.name) + '</b>' + (d.sponsor.tagline ? ' · ' + esc(d.sponsor.tagline) : '') + (d.sponsor.url ? ' · <a href="' + esc(d.sponsor.url) + '" target="_blank" rel="noopener sponsored">ver</a>' : '') + '</div>' : '');
    box.innerHTML = html;
    box.querySelectorAll('[data-rx]').forEach(function(b){ b.onclick = function(){ call('react', { city: city, slug: slug, emoji: b.dataset.rx }).then(function(n){ if (n) social(slug, name, n); }); SK.track('react', {}); }; });
    $('wallSel').onchange = function(){ var m = this.value; if (!m) return; call('wall', { city: city, slug: slug, msg: m, handle: A.getHandle() }).then(function(n){ if (n) social(slug, name, n); }); SK.track('wall', {}); };
  });
}

// ---------------------------------------------------------------- barrios
function midOf(g){ try { var a = typeof g === 'string' ? JSON.parse(g) : g; if (a && a.length) return a[(a.length / 2) | 0]; } catch(e){} return null; }
var nomQ = Promise.resolve(), nomT = 0;
function tagBarrio(name){
  var slug = A.slug(name), k = S.kings && S.kings[slug], cache = lj('sk_barrios', {}), city = A.kingKey(S.cityId), ck = city + '/' + slug;
  var mid = k && midOf(k.g); if (!mid) return;
  if (cache[ck]){ call('barrio', { city: city, slug: slug, barrio: cache[ck][0], postcode: cache[ck][1] }); return; }
  nomQ = nomQ.then(function(){
    var wait = Math.max(0, nomT + 1100 - Date.now()); return new Promise(function(r){ setTimeout(r, wait); });
  }).then(function(){
    nomT = Date.now();
    return fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&accept-language=es&lat=' + (+mid[0]).toFixed(5) + '&lon=' + (+mid[1]).toFixed(5), { headers: { 'Accept': 'application/json' } }).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; });
  }).then(function(x){
    var ad = (x && x.address) || {}, b = ad.neighbourhood || ad.quarter || ad.suburb || ad.city_district || null, pc = ad.postcode || null;
    if (!b && !pc) return;
    cache[ck] = [b, pc]; var keys = Object.keys(cache); if (keys.length > 300) delete cache[keys[0]]; ls('sk_barrios', JSON.stringify(cache));
    call('barrio', { city: city, slug: slug, barrio: b, postcode: pc });
  });
}
var barB = addBlock('<div class="block" id="barBlock"><div class="eyebrow">🏘️ Liga de barrios</div><div id="barBox"><p class="hint" style="margin:0">Conquista calles y tu barrio sube en la liga.</p></div>' +
  '<div class="row2" style="margin-top:8px"><button type="button" class="btn ghost" id="barDaily">🏘️ Ruta del día de mi barrio</button></div></div>', 'modesBox');
var lastBarCity = null;
function paintBarrios(){
  var city = A.kingKey(S.cityId); if (!city || city === lastBarCity) return; lastBarCity = city;
  call('barrio_top', { city: city }).then(function(L){
    var box = $('barBox'); if (!box) return;
    if (!L || !L.length){ box.innerHTML = '<p class="hint" style="margin:0">Aún no hay barrios en la liga de esta ciudad. La primera corona pone el tuyo en el mapa.</p>'; return; }
    box.innerHTML = L.slice(0, 8).map(function(b, i){ return '<div class="mt"><span>' + (i + 1) + '</span><b>' + esc(b.barrio) + '</b><small>' + b.streets + ' 👑 · ' + esc(b.crew ? '[' + b.crew + ']' : (b.leader || '')) + '</small></div>'; }).join('') +
      '<a class="hint" href="/barrios/' + encodeURIComponent(city) + '" target="_top">Ver todos los barrios →</a>';
  });
}
setInterval(paintBarrios, 4000);
function hash(s){ var h = 2166136261; for (var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
$('barDaily').onclick = function(){
  var h = lj('sk_home', null);
  if (!h || h.lat == null){ toast('Primero dinos tu calle: toca "📍 Correr MI calle".', true); return; }
  var cx = Math.round(h.lat * 100) / 100, cy = Math.round(h.lon * 100) / 100, d = new Date().toISOString().slice(0, 10);
  var r = hash(d + cx + ',' + cy), ang = (r % 360) * Math.PI / 180, km = 0.7 + ((r >> 9) % 60) / 100;
  var b = [cx + Math.cos(ang) * km / 111.3, cy + Math.sin(ang) * km / (111.3 * Math.cos(cx * Math.PI / 180))];
  var a = [cx - Math.cos(ang) * 0.25 / 111.3, cy - Math.sin(ang) * 0.25 / (111.3 * Math.cos(cx * Math.PI / 180))];
  A.startChallenge({ c: '', p: h.city || 'Mi barrio', a: a, b: b, t: '🏘️ Ruta del día del barrio', r: 'bd-' + d + '-' + cx.toFixed(2) + ',' + cy.toFixed(2), n: '', ms: 0 });
  document.body.classList.remove('menu'); SK.track('barrio_daily', {});
};

// ---------------------------------------------------------------- amigos
var friB = addBlock('<div class="block" id="friBlock"><div class="eyebrow">👥 Amigos</div><div class="row2"><input type="text" id="friIn" maxlength="14" placeholder="Nombre de piloto" style="flex:1"><button type="button" class="btn ghost" id="friAdd">Seguir</button></div><div id="friBox" style="margin-top:6px"></div></div>', 'barBox');
function paintFriends(list){
  Promise.all([list ? Promise.resolve(list) : call('follows', {}), call('feed', {})]).then(function(r){
    var f = r[0] || [], feed = r[1] || [], box = $('friBox'); if (!box) return;
    box.innerHTML = (f.length ? '<p class="hint" style="margin:0 0 4px">Sigues a ' + f.slice(0, 8).map(function(h){ return '<a href="/p/' + encodeURIComponent(h) + '" target="_top">' + esc(h) + '</a>'; }).join(', ') + (f.length > 8 ? '…' : '') + '</p>' : '<p class="hint" style="margin:0">Sigue a tus amigos y verás aquí cada calle que conquistan.</p>') +
      feed.slice(0, 6).map(function(x){ return '<div class="mt"><span>👑</span><b>' + esc(x.h) + ' · ' + esc(x.street || '') + '</b><small>' + (x.from ? 'a ' + esc(x.from) : fmt(x.ms)) + '</small></div>'; }).join('');
  });
}
$('friAdd').onclick = function(){ var h = $('friIn').value.trim(); if (!h) return; call('follow', { handle: h, on: true }).then(function(l){ $('friIn').value = ''; toast('👥 Ahora sigues a ' + esc(h)); paintFriends(l); }); SK.track('follow', {}); };
setTimeout(function(){ paintFriends(); }, 3500);
function followOffer(h){
  var box = $('socBox'); if (!box) return;
  var b = el('<button type="button" class="btn ghost" style="margin-top:8px;width:100%">👥 Seguir a ' + esc(h) + ' (a quien has destronado)</button>');
  box.parentNode.insertBefore(b, box); b.onclick = function(){ call('follow', { handle: h, on: true }).then(function(l){ toast('👥 Sigues a ' + esc(h) + '. Te enterarás de su revancha.'); b.remove(); paintFriends(l); }); };
}

// ---------------------------------------------------------------- temporada mensual y torneos
var seaB = addBlock('<div class="block" id="seaBlock"><div class="eyebrow" id="seaTitle">📅 Temporada del mes</div><div id="seaBox"></div><div id="tourBox"></div></div>', 'friBox');
function paintSeason(){
  call('season', {}).then(function(d){
    var box = $('seaBox'); if (!box || !d) return;
    var m = new Date(), name = m.toLocaleDateString('es-ES', { month: 'long' }), me = (A.getHandle() || '').toLowerCase();
    var days = Math.max(0, Math.ceil((new Date(d.ends) - Date.now()) / 86400000));
    $('seaTitle').textContent = '📅 Temporada de ' + name + ' · quedan ' + days + ' días';
    var P = d.players || [];
    box.innerHTML = (P.length ? P.slice(0, 5).map(function(p, i){ return '<div class="mt' + (p.h.toLowerCase() === me ? ' me' : '') + '"><span>' + ['🥇', '🥈', '🥉', '4', '5'][i] + '</span><b>' + esc(p.h) + '</b><small>' + p.n + ' 👑</small></div>'; }).join('') : '<p class="hint" style="margin:0">Nadie ha coronado aún este mes. Empieza tú.</p>') +
      '<p class="hint" style="margin:6px 0 0">El top 3 del mes se lleva el título de temporada en su perfil.</p>';
  });
  call('tourneys', {}).then(function(L){
    var box = $('tourBox'); if (!box || !L || !L.length) return;
    box.innerHTML = '<div class="eyebrow" style="margin-top:10px">🏆 Torneos</div>' + L.slice(0, 3).map(function(t){
      return '<div class="mt"><span>' + (t.live ? '🔴' : '🗓️') + '</span><b>' + esc(t.title) + '</b><button type="button" class="btn ghost" data-tour="' + t.id + '" style="padding:4px 10px">' + (t.live ? 'Correr' : 'Ver') + '</button></div>' + (t.prize ? '<p class="hint" style="margin:0 0 4px 30px">Premio: ' + esc(t.prize) + '</p>' : '');
    }).join('');
    box.querySelectorAll('[data-tour]').forEach(function(b){ b.onclick = function(){
      var t = L.filter(function(x){ return String(x.id) === b.dataset.tour; })[0]; if (!t) return;
      if (t.share){ try { var q = new URLSearchParams(t.share.split('?')[1] || t.share); var a = (q.get('a') || '').split(',').map(Number), bb = (q.get('b') || '').split(',').map(Number);
        if (a.length === 2 && bb.length === 2){ A.startChallenge({ c: q.get('c') || t.city, p: q.get('p') || '', a: a, b: bb, t: '🏆 ' + t.title, r: t.route, n: '', ms: 0 }); document.body.classList.remove('menu'); return; } } catch(e){} }
      window.top.location.href = '/torneos';
    }; });
  });
}
setTimeout(paintSeason, 3000); setInterval(paintSeason, 300000);

// ---------------------------------------------------------------- invitar amigos (referidos)
var refB = addBlock('<div class="block" id="refBlock"><div class="eyebrow">🎁 Invita y gana</div><p class="hint" style="margin:0 0 8px">Cuando 3 amigos que invites terminen su primera vuelta, desbloqueas la pintura exclusiva <b style="color:#1DE9B6">Embajador</b> y 🪙 300.</p>' +
  '<div class="row2"><button type="button" class="btn ghost" id="refGo">🎁 Invitar</button><span class="hint" id="refN" style="align-self:center"></span></div></div>', 'seaBox');
(function(){ var q = new URLSearchParams(topSearch() || ''), r = q.get('ref'); if (r && !ls('sk_ref')) ls('sk_ref', r.slice(0, 14)); })();
function paintRef(){
  var h = A.getHandle(); if (!h || h === 'anon'){ $('refN').textContent = 'Ponte un nombre para invitar.'; return; }
  call('refstats', { handle: h }).then(function(n){
    n = n || 0; $('refN').textContent = n + '/3 amigos';
    if (n >= 3 && !owned()[EXCL.id]){ own(EXCL.id); W.coins += 300; saveW(); toast('🎁 ¡3 amigos corriendo! Pintura Embajador desbloqueada.'); }
  });
}
$('refGo').onclick = function(){
  var h = A.getHandle(); if (!h || h === 'anon'){ toast('Ponte un nombre de piloto primero.', true); return; }
  var url = topOrigin() + '/?ref=' + encodeURIComponent(h), text = '👑 Te invito a King of Streets: carreras en las calles reales de tu ciudad. Conquista tu calle: ' + url;
  if (navigator.share) navigator.share({ text: text }).catch(function(){}); else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function(){ toast('Enlace de invitación copiado.'); });
  SK.track('invite', {});
};
setTimeout(paintRef, 4500);

// ---------------------------------------------------------------- importar una ruta GPX (Strava, Garmin, Wikiloc…)
(function(){
  var gen = $('genhint'), host = gen ? gen.parentNode : null; if (!host) return;
  var b = el('<label class="btn ghost" style="display:block;text-align:center;margin-top:6px;cursor:pointer">📂 Importar ruta GPX (Strava, Garmin…)<input type="file" accept=".gpx,application/gpx+xml" id="gpxIn" hidden></label>');
  host.appendChild(b);
  $('gpxIn').onchange = function(){
    var f = this.files && this.files[0]; if (!f) return;
    if (f.size > 8e6){ toast('El GPX es demasiado grande.', true); return; }
    var rd = new FileReader();
    rd.onload = function(){
      try {
        var x = new DOMParser().parseFromString(String(rd.result), 'application/xml'), pts = x.querySelectorAll('trkpt,rtept,wpt');
        if (pts.length < 2){ toast('Ese GPX no tiene recorrido.', true); return; }
        var P = [].map.call(pts, function(p){ return [+p.getAttribute('lat'), +p.getAttribute('lon')]; }).filter(function(p){ return isFinite(p[0]) && isFinite(p[1]); });
        var a = P[0], z = P[P.length - 1], km = A.kmBetween(a, z);
        if (km < 0.25){ var far = 0, fi = 0; P.forEach(function(p, i){ var d = A.kmBetween(a, p); if (d > far){ far = d; fi = i; } }); z = P[fi]; km = far; }  // ruta circular: hasta el punto más lejano
        if (km > 6){ var s = 0; for (var i = 1; i < P.length; i++){ s = A.kmBetween(a, P[i]); if (s > 5.5){ z = P[i]; break; } } toast('Ruta larga: corremos los primeros 5,5 km.'); }
        var nm = (x.querySelector('trk > name, metadata > name') || {}).textContent || f.name.replace(/\.gpx$/i, '');
        A.startChallenge({ c: '', p: 'GPX', a: [+a[0].toFixed(5), +a[1].toFixed(5)], b: [+z[0].toFixed(5), +z[1].toFixed(5)], t: '📂 ' + String(nm).slice(0, 40), r: null, n: '', ms: 0 });
        document.body.classList.remove('menu'); SK.track('gpx', {});
      } catch(e){ toast('No he podido leer ese GPX.', true); }
    };
    rd.readAsText(f);
  };
})();

// ---------------------------------------------------------------- repetición TV (cámaras de retransmisión)
var tvBar = el('<div id="tvBar"><span><i>●</i>Repetición</span><span id="tvCam"></span><button type="button" id="tvExit">Salir</button></div>'); $('stage').appendChild(tvBar);
var TV = null;
function startTV(run){
  var d = run.rec; if (!d || d.length < 30 || !S.car) return;
  var n = (d.length / 3) | 0, total = run.total;
  // cámaras fijas a pie de calle cada ~110 m a un lado del trazado, más una de helicóptero
  var cams = [], acc = 0;
  for (var i = 1; i < n; i++){
    acc += Math.hypot(d[i*3] - d[(i-1)*3], d[i*3+1] - d[(i-1)*3+1]) / 10;
    if (acc > 110 || i === 1){ acc = 0; var h = d[i*3+2] / 100, side = cams.length % 2 ? 1 : -1;
      cams.push({ i: i, x: d[i*3] / 10 + Math.cos(h) * 30 - Math.sin(h) * 9 * side, y: d[i*3+1] / 10 + Math.sin(h) * 30 + Math.cos(h) * 9 * side, z: 1.4 + (cams.length % 3) * 1.2 }); }
  }
  var save = { view: S.view, phase: S.phase, ghost: S.ghost, car: { x: S.car.x, y: S.car.y, h: S.car.h, speed: S.car.speed, prog: S.car.prog } };
  TV = { t0: performance.now(), n: n, d: d, total: total, cams: cams, save: save, cam: 0 };
  S.ghost = null; S.phase = 'replay'; S.tvReplay = true; if (S.view !== 'chase' && SK.setView) SK.setView('chase');
  $('results').classList.remove('on'); tvBar.classList.add('on');
  SK.beforeFrame = function(){
    var el = (performance.now() - TV.t0) * 1.0, lt = Math.min(TV.total, el);
    var fi = lt / 100, i = Math.min(TV.n - 1, Math.floor(fi)), j = Math.min(TV.n - 1, i + 1), u = Math.min(1, fi - i);
    S.car.x = (d[i*3] + (d[j*3] - d[i*3]) * u) / 10; S.car.y = (d[i*3+1] + (d[j*3+1] - d[i*3+1]) * u) / 10;
    var h0 = d[i*3+2] / 100, h1 = d[j*3+2] / 100; S.car.h = h0 + Math.atan2(Math.sin(h1 - h0), Math.cos(h1 - h0)) * u;
    var k = Math.max(0, i - 2); S.car.speed = Math.hypot(d[i*3] - d[k*3], d[i*3+1] - d[k*3+1]) / 10 / Math.max(0.1, (i - k) / 10); S.steerOut = 0; S.thrOut = 0.5;
    TV.i = i;
    if (lt >= TV.total && el > TV.total + 1500) stopTV();
  };
}
var prevCam = SK.camOverride;
SK.camOverride = function(car, dt, cam){
  if (TV && S.tvReplay){
    var i = TV.i || 0, best = TV.cams[0], mode = Math.floor((performance.now() - TV.t0) / 6000) % 4;
    for (var k = 0; k < TV.cams.length; k++){ if (TV.cams[k].i <= i + 12) best = TV.cams[k]; }
    var look = new THREE.Vector3(car.x, 0.9, -car.y);
    if (mode === 3){                                    // helicóptero
      $('tvCam').textContent = 'CAM HELI';
      return { pos: new THREE.Vector3(car.x - Math.cos(car.h) * 28, 26, -(car.y - Math.sin(car.h) * 28) + 6), look: look, fov: 46 };
    }
    if (mode === 1){                                    // a ras de suelo, al lado de la rueda
      $('tvCam').textContent = 'CAM ONBOARD';
      return { pos: new THREE.Vector3(car.x - Math.cos(car.h) * 3.5 + Math.sin(car.h) * 2.2, 0.55, -(car.y - Math.sin(car.h) * 3.5 - Math.cos(car.h) * 2.2)), look: new THREE.Vector3(car.x + Math.cos(car.h) * 10, 0.8, -(car.y + Math.sin(car.h) * 10)), fov: 70 };
    }
    var dist = Math.hypot(best.x - car.x, best.y - car.y);
    $('tvCam').textContent = 'CAM ' + (TV.cams.indexOf(best) + 1);
    return { pos: new THREE.Vector3(best.x, best.z, -best.y), look: look, fov: Math.max(14, Math.min(60, 900 / Math.max(10, dist))) };
  }
  return prevCam ? prevCam(car, dt, cam) : null;
};
function stopTV(){
  if (!TV) return; var s = TV.save; TV = null; S.tvReplay = false; SK.beforeFrame = null; tvBar.classList.remove('on');
  S.car.x = s.car.x; S.car.y = s.car.y; S.car.h = s.car.h; S.car.speed = 0; S.phase = s.phase; S.ghost = s.ghost;
  if (s.view !== 'chase' && SK.setView) SK.setView(s.view); $('results').classList.add('on');
}
$('tvExit').onclick = stopTV;
window.addEventListener('keydown', function(e){ if (e.key === 'Escape' && TV) stopTV(); });
SK.tv = { start: function(){ if (S.lastRun) startTV(S.lastRun); }, stop: stopTV };

// ---------------------------------------------------------------- logros en la nube (vitrina del perfil)
setTimeout(function(){
  var have = lj('sk_ach', {}), ids = Object.keys(have).filter(function(k){ return have[k]; }), d = new Date().toISOString().slice(0, 10);
  if (ids.length && ls('sk_achsync') !== d && A.getHandle()){ call('ach', { ids: ids, handle: A.getHandle() }, 12000).then(function(){ ls('sk_achsync', d); }); }
}, 6000);

// XP por modos y duelos
var prevMode = SK.modeFinish;
if (prevMode) SK.modeFinish = function(){ var r = prevMode.apply(this, arguments); try { earn(5, '', 10, true); passAdd(10); SK.track('mode_finish', { mode: S.mode || null }); } catch(e){} return r; };
})();
