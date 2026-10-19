/* King of Streets v4 — ser el nº1 de tu calle, que se sepa y que tus vecinos lo vean.
   Escalera por calle, "te faltó esto", lema del rey, días de reinado, títulos, alcalde,
   reyes cerca de ti, némesis, mi calle por GPS, tarjeta para stories y gráficos. */
(function(){
'use strict';
var A = window.SK && SK.api; if (!A) return;
var S = A.S, NET = A.NET, $ = A.$, esc = A.esc, fmt = A.fmt, toast = A.toast;
function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch(e){ return null; } }
function topOrigin(){ try { var o = window.top.location.origin; if (o && o !== 'null' && !/localhost|127\.0\.0\.1/.test(o)) return o; } catch(e){} return 'https://kingofstreets.com'; }
function el(html){ var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
function me(){ return A.getHandle() || 'anon'; }
function cityKey(){ return A.kingKey(S.cityId); }
function cityName(){ var m = A.cityMeta(S.cityId); return m.name || ''; }
function streetUrl(slug, city){ return topOrigin() + '/s/' + encodeURIComponent(city || cityKey()) + '/' + encodeURIComponent(slug); }
function secs(ms){ return (Math.abs(ms) / 1000).toFixed(2).replace('.', ',') + ' s'; }
function daysSince(iso){ var t = Date.parse(iso || ''); return isNaN(t) ? null : Math.max(0, Math.floor((Date.now() - t) / 86400000)); }
function reignTxt(iso){ var d = daysSince(iso); if (d == null) return ''; return d === 0 ? 'reina desde hoy' : d === 1 ? 'reina desde ayer' : 'reina hace ' + d + ' días'; }
function geomPts(g){ try { var a = typeof g === 'string' ? JSON.parse(g) : g; return Array.isArray(a) && a.length > 1 ? a : null; } catch(e){ return null; } }

var MOTTOS = ['Aquí mando yo 😎', 'Ven a por ella', 'Esta calle tiene dueño', 'Ni lo intentes', 'Te espero en la meta',
  'Calle de mi barrio, calle mía', 'Gánamela si puedes', 'El asfalto es mío', 'Saludos a mi vecino 👋', 'Vuelve cuando entrenes'];

// ============================================================== títulos
// Rey de 1-2 calles, Barón 3+, Conde 10+, Duque 25+, Príncipe 50+ y el nº1 de la ciudad es Alcalde.
var TITLES = [[50, 'Príncipe', '🤴'], [25, 'Duque', '⚜️'], [10, 'Conde', '🛡️'], [3, 'Barón', '🎖️'], [1, 'Rey de calle', '👑'], [0, 'Piloto', '🏁']];
function titleOf(n, alcalde){
  if (alcalde) return { name: 'Alcalde', icon: '🏛️' };
  for (var i = 0; i < TITLES.length; i++) if ((n || 0) >= TITLES[i][0]) return { name: TITLES[i][1], icon: TITLES[i][2] };
  return { name: 'Piloto', icon: '🏁' };
}
var titleCache = {}, mayor = { city: null, h: null, n: 0, top: [] };
async function loadTitles(handles){
  var need = handles.filter(function(h){ return h && h !== '—' && titleCache[h] == null; });
  need = need.filter(function(h, i){ return need.indexOf(h) === i; }).slice(0, 60);
  if (!need.length) return;
  need.forEach(function(h){ titleCache[h] = 0; });
  var rows = await NET.call('titles', { handles: need }, 12000);
  (rows || []).forEach(function(r){ titleCache[r.handle] = +r.streets || 0; });
}
function titleFor(h){ if (!h || h === 'anon') return { name: 'Rey de calle', icon: '👑' }; return titleOf(titleCache[h] || 0, mayor.city === cityKey() && mayor.h === h && h !== 'anon'); }
function tagHtml(h){ if (!h || h === 'anon') return ''; var t = titleFor(h); return t.name === 'Piloto' ? '' : '<i class="ttl">' + t.icon + ' ' + esc(t.name) + '</i>'; }

// ============================================================== estilos
var css = `
.block[hidden]{display:none!important}
#hudBtns{display:flex}
@media (pointer:fine){ #hudBtns #bFull{display:none} }
.rk{display:block;font-family:var(--mono);font-size:10.5px;color:var(--muted);margin-top:1px}
.rk.k{color:var(--gold)} .rk.c{color:#FFB020}
.ttl{font-style:normal;font-family:var(--cond);font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--gold);margin-left:6px;white-space:nowrap}
.miss{margin:0 22px 12px;padding:12px 14px;border-radius:8px;background:linear-gradient(135deg,#3A1D0C,#2A1508);border:1px solid #FF8A3D;display:flex;gap:10px;align-items:center}
.miss .t{flex:1;font-size:14px;line-height:1.3} .miss b{color:#FFB070}
.miss .btn{width:auto;padding:9px 14px;font-size:13px;white-space:nowrap}
.crownbox{border-top:1px solid var(--line);padding:12px 0 4px}
.crownbox .gt{font-family:var(--cond);letter-spacing:.06em;text-transform:uppercase;font-size:14px;margin-bottom:8px;color:var(--gold)}
.chips{display:flex;flex-wrap:wrap;gap:5px}
.chips button{background:var(--surface);border:1px solid var(--line);color:var(--fg);border-radius:999px;padding:6px 10px;font-size:12px}
.chips button.on{border-color:var(--gold);background:#3A2C08;color:#FFE7A6}
.crownbox .row2{margin-top:10px}
.kl{display:flex;flex-direction:column;gap:5px}
.kl .it{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;background:var(--surface);border:1px solid var(--line);border-left:2px solid var(--gold);border-radius:0 4px 4px 0;padding:6px 8px}
.kl .it b{display:block;font-family:var(--cond);font-size:14.5px;line-height:1.1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.kl .it small{display:block;font-family:var(--mono);font-size:10.5px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.kl .it .btn{width:auto;padding:6px 10px;font-size:11.5px}
.kl .it.mine{border-left-color:var(--good)}
.mayor{display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,#2E2408,#1A1606 70%);border:1px solid #6B5316;border-radius:6px;padding:10px 12px}
.mayor .ic{font-size:26px} .mayor b{font-family:var(--cond);font-size:18px;display:block;line-height:1.05} .mayor small{font-family:var(--mono);font-size:10.5px;color:#D8C07A}
.ctop{margin-top:6px;display:flex;flex-direction:column}
.ctop div{display:flex;justify-content:space-between;font-family:var(--mono);font-size:11.5px;color:var(--muted);padding:3px 0;border-top:1px solid var(--line)}
.ctop div.me{color:var(--fg)}
.nem{background:linear-gradient(135deg,#2A0E14,#1A0B0E 70%);border:1px solid #6B1E2C;border-radius:6px;padding:10px 12px}
.nem b{font-family:var(--cond);font-size:18px;color:#FF8A9A} .nem p{margin:3px 0 8px;font-size:12.5px;color:var(--muted)}
.homebtn{display:flex;justify-content:space-between;align-items:center;gap:8px;width:100%;background:linear-gradient(135deg,#0E2A1C,#10201A 70%);border:1px solid #1F6B45;border-radius:6px;padding:9px 12px;color:var(--fg);text-align:left}
.homebtn b{font-family:var(--cond);font-size:16px;display:block} .homebtn small{font-family:var(--mono);font-size:10.5px;color:#8FD8B0}
.mytitle{font-family:var(--cond);text-transform:uppercase;letter-spacing:.1em;font-size:12px;color:var(--gold);margin-top:2px}
#storyWrap .card{width:min(420px,100%)}
#storyWrap canvas{display:block;width:100%;height:auto;border-radius:6px}
#storyWrap .inner{padding:12px 16px}
`;
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

// ============================================================== HUD: reiniciar y bocina
(function(){
  var hb = $('hudBtns'); if (!hb) return;
  var r = el('<button type="button" id="bRestart" aria-label="Reiniciar" title="Reiniciar (R)">↺</button>');
  var h = el('<button type="button" id="bHorn" aria-label="Bocina" title="Bocina (H)">📯</button>');
  hb.appendChild(r); hb.appendChild(h);
  r.onclick = function(){ if (S.circuit){ A.startCountdown(); r.blur(); } };
  h.onclick = function(){ if (SK.unlockAudio) SK.unlockAudio(); if (SK.sfx && SK.sfx.horn2) SK.sfx.horn2(); if (SK.buzz) SK.buzz(20); h.blur(); };
})();

// ============================================================== placa: título, días de reinado y lema
if (!SK.post) SK.post = [];
var plq = { t: 0 };
SK.post.push(function(){
  var R = S.circuit, pk = $('pkn'); if (!R || !pk) return;
  var si = Math.max(0, Math.min(R.sect.length - 1, S.curSector + 1)), sc = R.sect[si]; if (!sc) return;
  var k = S.kings[A.slug(sc.name)];
  if (!k || !k.h) return;
  var key = sc.name + k.h + k.t + k.m + (titleCache[k.h] || 0);
  if (plq.key !== key){ plq.key = key; var t = titleFor(k.h), rg = reignTxt(k.s);
    plq.txt = t.icon + ' ' + (t.name !== 'Piloto' && t.name !== 'Rey de calle' ? t.name + ' ' : '') + k.h + ' · ' + fmt(k.t) + (rg ? ' · ' + rg : '') + (k.m ? ' · «' + k.m + '»' : ''); }
  pk.textContent = plq.txt;
});

// ============================================================== al terminar: escalera, "te faltó", corona
var prevFinish = SK.onFinish;
SK.onFinish = function(run, board){
  if (prevFinish) try { prevFinish(run, board); } catch(e){}
  try { afterRace(run, board); } catch(e){ console.warn(e); }
};
async function afterRace(run, board){
  var R = S.circuit; if (!R || !run) return;
  var box = $('after'), mine = me();
  // 1) casi: calle que no es tuya y que se te ha escapado por poco
  var best = null;
  if (run.lapOk){
    R.sect.forEach(function(s, i){
      var sl = A.slug(s.name), k = S.kings[sl], sp = A.sectorSplit(i);
      if (!k || sp == null || k.h === mine) return;
      var gap = Math.round(sp) - k.t, lim = Math.max(1200, k.t * 0.12);
      if (gap > 0 && gap < lim && (!best || gap < best.gap)) best = { gap: gap, name: s.name, h: k.h };
    });
  }
  var old = $('missBox'); if (old) old.remove();
  if (best){
    var mb = el('<div class="miss" id="missBox"><div class="t">😤 Te faltaron <b>' + secs(best.gap) + '</b> para ser rey de <b>' + esc(best.name) + '</b>. Se la queda ' + esc(best.h) + '… por ahora.</div>' +
      '<button type="button" class="btn" id="missGo">↺ A por ella</button></div>');
    var card = $('results').querySelector('.card'); card.insertBefore(mb, $('rsect'));
    $('missGo').onclick = function(){ A.startCountdown(); };
  }
  // 2) la corona recién ganada: lema, story y presumir
  if (run.won && run.won.length){
    var w = run.won[0], sl = A.slug(w.name);
    var cb = el('<div class="crownbox" id="crownBox"><div class="gt">👑 Eres el rey de ' + esc(w.name) + (run.won.length > 1 ? ' y ' + (run.won.length - 1) + ' más' : '') + '</div>' +
      '<div class="hint" style="margin:0 0 6px">Tu lema, lo verá todo el que corra tu calle:</div>' +
      '<div class="chips" id="mottoChips">' + MOTTOS.map(function(m, i){ return '<button type="button" data-i="' + i + '">' + esc(m) + '</button>'; }).join('') + '</div>' +
      '<div class="row2"><button type="button" class="btn" id="storyGo">📸 Tarjeta para stories</button><button type="button" class="btn ghost" id="brag">📣 Presumir</button></div></div>');
    box.appendChild(cb);
    var cur = S.kings[sl] && S.kings[sl].m;
    cb.querySelectorAll('#mottoChips button').forEach(function(b){
      if (cur && MOTTOS[+b.dataset.i] === cur) b.classList.add('on');
      b.onclick = async function(){
        var m = MOTTOS[+b.dataset.i];
        var ok = await Promise.all(run.won.map(function(x){ return NET.call('motto', { city: cityKey(), slug: A.slug(x.name), motto: m, device: A.deviceId() }, 12000); }));
        if (ok.some(Boolean)){
          run.won.forEach(function(x){ var k = S.kings[A.slug(x.name)]; if (k) k.m = m; });
          cb.querySelectorAll('#mottoChips button').forEach(function(o){ o.classList.toggle('on', o === b); });
          toast('Lema puesto: «' + esc(m) + '»');
        } else toast('No he podido guardar el lema.', true);
      };
    });
    $('storyGo').onclick = function(){ openStory({ name: w.name, slug: sl, ms: w.ms, city: cityName(), cityKey: cityKey(), h: mine, motto: S.kings[sl] && S.kings[sl].m, geom: S.kings[sl] && S.kings[sl].g, n: run.won.length }); };
    $('brag').onclick = function(){ bragStreet(w.name, sl, w.ms); };
  }
  // 3) escalera por calle: tu puesto en cada una y lo que te separa del rey
  if (!(await A.openDb())) return;
  var slugs = []; R.sect.forEach(function(s){ var x = A.slug(s.name); if (slugs.indexOf(x) < 0) slugs.push(x); });
  var rows = await NET.call('ranks', { city: cityKey(), slugs: slugs, device: A.deviceId() }, 15000);
  var by = {}; (rows || []).forEach(function(r){ by[r.slug] = r; });
  var lines = $('rsect').querySelectorAll('.sl');
  R.sect.forEach(function(s, i){
    var r = by[A.slug(s.name)], ln = lines[i]; if (!r || !ln || r.my_ms == null) return;
    var n = ln.querySelector('.n'); if (!n || n.querySelector('.rk')) return;
    var txt, cls = 'rk';
    if (r.pos === 1 && r.king_ms != null && r.my_ms <= r.king_ms){ txt = '👑 1º de ' + r.total + (r.since ? ' · ' + reignTxt(r.since) : ''); cls += ' k'; }
    else { txt = r.pos + 'º de ' + r.total + (r.king_ms != null ? ' · a ' + secs(r.my_ms - r.king_ms) + ' del rey' : ''); if (r.pos <= 3) cls += ' c'; }
    n.insertAdjacentHTML('beforeend', '<small class="' + cls + '">' + txt + '</small>');
  });
  // 4) títulos junto a los nombres del ranking
  if (board && board.entries && board.entries.length){
    await loadTitles(board.entries.map(function(e){ return e.h; }));
    $('rboard').querySelectorAll('.row').forEach(function(rw, j){
      var e = board.entries[j]; if (!e) return; var sp = rw.children[1];
      if (sp && !sp.querySelector('.ttl')) sp.insertAdjacentHTML('beforeend', tagHtml(e.h));
    });
  }
  refreshRail();
}
function bragStreet(name, slug, ms){
  var url = streetUrl(slug), where = cityName();
  var text = '👑 Soy el rey de ' + name + (where ? ' (' + where + ')' : '') + ' con ' + fmt(ms) + '. ¿Me la quitas?';
  if (navigator.share) navigator.share({ title: 'King of Streets', text: text, url: url }).catch(function(){});
  else window.open('https://wa.me/?text=' + encodeURIComponent(text + '\n' + url), '_blank', 'noopener');
}

// ============================================================== tarjeta 1080x1920 para stories
var LOGO = new Image(); LOGO.src = '/favicon.svg';
var story = el('<div class="overlay" id="storyWrap"><div class="card"><header><div class="lab">Para tus stories</div><h2>Tu corona</h2></header>' +
  '<div class="inner"><canvas id="storyCv" width="1080" height="1920"></canvas></div>' +
  '<footer><button type="button" class="btn" id="storyShare">Compartir</button><button type="button" class="btn ghost" id="storyDl">Descargar</button><button type="button" class="btn ghost" id="storyClose">Cerrar</button></footer></div></div>');
$('stage').appendChild(story);
$('storyClose').onclick = function(){ story.classList.remove('on'); };
async function drawStory(d){
  try { await Promise.all(['700 150px "Barlow Condensed"', '600 50px "Barlow Condensed"', '700 120px "JetBrains Mono"'].map(function(f){ return document.fonts.load(f); })); } catch(e){}
  var c = $('storyCv'), g = c.getContext('2d'), W = 1080, H = 1920;
  var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#16100A'); bg.addColorStop(0.45, '#0B0F14'); bg.addColorStop(1, '#070A0E');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  var glow = g.createRadialGradient(W / 2, 700, 40, W / 2, 700, 720); glow.addColorStop(0, 'rgba(242,193,78,.34)'); glow.addColorStop(1, 'rgba(242,193,78,0)');
  g.fillStyle = glow; g.fillRect(0, 0, W, H);
  // rayos
  g.save(); g.translate(W / 2, 700); g.globalAlpha = 0.06; g.fillStyle = '#F2C14E';
  for (var r = 0; r < 18; r++){ g.rotate(Math.PI / 9); g.beginPath(); g.moveTo(0, 0); g.lineTo(-60, -1100); g.lineTo(60, -1100); g.closePath(); g.fill(); }
  g.restore();
  // cabecera
  try { if (LOGO.complete && LOGO.naturalWidth) g.drawImage(LOGO, 90, 96, 92, 92); } catch(e){}
  g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = '#F2F6FA'; g.font = '700 50px "Barlow Condensed", Arial Narrow, sans-serif';
  g.fillText('KING OF STREETS', 206, 142);
  // QR a la calle: escanear desde otra pantalla abre la carrera
  var qr = SK.qrCanvas ? SK.qrCanvas(streetUrl(d.slug, d.cityKey), 150) : null;
  if (qr){ g.fillStyle = '#FFFFFF'; if (g.roundRect){ g.beginPath(); g.roundRect(W - 90 - 170, 60, 170, 170, 14); g.fill(); } else g.fillRect(W - 260, 60, 170, 170); g.drawImage(qr, W - 90 - 160, 70, 150, 150); }
  // corona y calle: el nombre cabe en dos líneas como mucho
  g.textAlign = 'center'; g.font = '170px serif'; g.fillText('👑', W / 2, 380);
  g.fillStyle = '#F2C14E'; g.font = '600 56px "Barlow Condensed", Arial Narrow, sans-serif'; g.fillText('REY DE', W / 2, 540);
  var name = String(d.name).toUpperCase(), fs = 150, L = [];
  function split(){ var w = name.split(/\s+/), out = [], ln = ''; w.forEach(function(x){ var t = ln ? ln + ' ' + x : x; if (g.measureText(t).width > 950 && ln){ out.push(ln); ln = x; } else ln = t; }); if (ln) out.push(ln); return out; }
  for (; fs >= 70; fs -= 8){ g.font = '700 ' + fs + 'px "Barlow Condensed", Arial Narrow, sans-serif'; L = split(); if (L.length <= 2 && L.every(function(x){ return g.measureText(x).width <= 990; })) break; }
  g.fillStyle = '#FFFFFF'; var lh = fs * 0.98;
  L.slice(0, 2).forEach(function(x, i){ g.fillText(x, W / 2, 650 + i * lh, 1000); });
  var y = 650 + (Math.min(2, L.length) - 1) * lh + fs * 0.5 + 40;
  g.fillStyle = '#9AA7B4'; g.font = '600 50px "Barlow Condensed", Arial Narrow, sans-serif'; g.fillText((d.city || '').toUpperCase(), W / 2, y);
  // trazado de la calle
  var pts = geomPts(d.geom), mapEnd = y + 30;
  if (pts){
    var minA = Infinity, maxA = -Infinity, minO = Infinity, maxO = -Infinity, kx = Math.cos(pts[0][0] * Math.PI / 180);
    pts.forEach(function(p){ minA = Math.min(minA, p[0]); maxA = Math.max(maxA, p[0]); minO = Math.min(minO, p[1]); maxO = Math.max(maxO, p[1]); });
    var bw = 620, bh = 220, sx = (maxO - minO) * kx, sy = (maxA - minA), s = Math.min(bw / (sx || 1e-9), bh / (sy || 1e-9));
    var top = y + 50, ox = W / 2 - sx * s / 2, oy = top + bh / 2 + sy * s / 2;
    g.lineCap = g.lineJoin = 'round';
    [[34, 'rgba(242,193,78,.18)'], [18, 'rgba(242,193,78,.45)'], [8, '#FFE7A6']].forEach(function(st){
      g.strokeStyle = st[1]; g.lineWidth = st[0]; g.beginPath();
      pts.forEach(function(p, i){ var X = ox + (p[1] - minO) * kx * s, Y = oy - (p[0] - minA) * s; if (i) g.lineTo(X, Y); else g.moveTo(X, Y); });
      g.stroke();
    });
    mapEnd = top + bh;
  }
  // tiempo, piloto, título y lema
  var ty = mapEnd + 100;
  g.fillStyle = '#3FD08A'; g.font = '700 124px "JetBrains Mono", monospace'; g.fillText(fmt(d.ms) + ' s', W / 2, ty);
  var t = titleOf(d.n || 1, false);
  g.fillStyle = '#FFFFFF'; g.font = '700 84px "Barlow Condensed", Arial Narrow, sans-serif'; g.fillText(String(d.h || 'anon').toUpperCase(), W / 2, ty + 120, 960);
  g.fillStyle = '#F2C14E'; g.font = '600 46px "Barlow Condensed", Arial Narrow, sans-serif'; g.fillText(t.icon + ' ' + t.name.toUpperCase(), W / 2, ty + 192);
  if (d.motto){ g.fillStyle = '#E8EFF5'; g.font = 'italic 600 54px "Barlow Condensed", Arial Narrow, sans-serif'; g.fillText('«' + d.motto + '»', W / 2, ty + 272, 960); }
  // pie
  g.fillStyle = 'rgba(255,91,61,.95)'; if (g.roundRect){ g.beginPath(); g.roundRect(120, H - 280, W - 240, 128, 64); g.fill(); } else g.fillRect(120, H - 280, W - 240, 128);
  g.fillStyle = '#180703'; g.font = '700 60px "Barlow Condensed", Arial Narrow, sans-serif'; g.fillText('¿ME LA QUITAS?', W / 2, H - 216);
  g.fillStyle = '#9AA7B4'; g.font = '600 34px "JetBrains Mono", monospace';
  var u = 'kingofstreets.com/s/' + d.cityKey + '/' + d.slug; if (u.length > 48) u = u.slice(0, 47) + '…';
  g.fillText(u, W / 2, H - 90, 1000);
  return c;
}
async function openStory(d){
  story.classList.add('on');
  var c = await drawStory(d);
  var file = 'rey-' + d.slug + '.png';
  function blob(){ return new Promise(function(res){ c.toBlob(res, 'image/png'); }); }
  $('storyDl').onclick = async function(){
    var b = await blob(); if (!b) return; var u = URL.createObjectURL(b), a = document.createElement('a');
    a.href = u; a.download = file; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(u); }, 4000);
  };
  var text = '👑 Soy el rey de ' + d.name + '. ¿Me la quitas? ' + streetUrl(d.slug, d.cityKey);
  $('storyShare').onclick = async function(){
    var b = await blob(); if (!b) return;
    var f = new File([b], file, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [f] })) navigator.share({ files: [f], text: text }).catch(function(){});
    else if (navigator.share) navigator.share({ title: 'King of Streets', text: text }).catch(function(){});
    else $('storyDl').onclick();
  };
}
SK.openStory = openStory;

// ============================================================== rail: alcalde, cerca de ti, némesis, mi calle, gráficos
var rail = document.querySelector('.railscroll');
var terrBlock = $('terr') && $('terr').closest('.block');
$('terrtxt').insertAdjacentHTML('afterend', '<div class="mytitle" id="myTitle"></div>');
var homeBlock = el('<div class="block" id="homeBlock"></div>');
var mayorBlock = el('<div class="block" id="mayorBlock" hidden><div class="eyebrow">Alcalde de la ciudad</div><div id="mayorBox"></div></div>');
var nearBlock = el('<div class="block" id="nearBlock" hidden><div class="eyebrow">Reyes cerca de ti · rétalos</div><div class="kl" id="nearList"></div></div>');
var nemBlock = el('<div class="block" id="nemBlock" hidden><div class="nem" id="nemBox"></div></div>');
rail.insertBefore(homeBlock, rail.querySelector('.block').nextSibling);
if (terrBlock){ terrBlock.parentNode.insertBefore(nemBlock, terrBlock.nextSibling); terrBlock.parentNode.insertBefore(nearBlock, nemBlock.nextSibling); terrBlock.parentNode.insertBefore(mayorBlock, nearBlock.nextSibling); }

// --- gráficos
(function(){
  var views = $('vChase') && $('vChase').closest('.seg'); if (!views || !SK.setGfx) return;
  var seg = el('<div class="seg" role="group" aria-label="Gráficos"><button type="button" data-q="alto">Gráficos altos</button><button type="button" data-q="medio">Medios</button><button type="button" data-q="bajo">Bajos</button></div>');
  views.parentNode.insertBefore(seg, views.nextSibling);
  function paint(){ var q = SK.getGfx ? SK.getGfx() : 'medio'; seg.querySelectorAll('button').forEach(function(b){ b.classList.toggle('on', b.dataset.q === q); }); }
  seg.querySelectorAll('button').forEach(function(b){ b.onclick = function(){ SK.setGfx(b.dataset.q); paint(); }; });
  paint(); setInterval(paint, 4000);
})();

// --- mi calle por GPS (y recordada para un toque)
function home(){ try { return JSON.parse(ls('sk_home') || 'null'); } catch(e){ return null; } }
function paintHome(){
  var h = home();
  homeBlock.innerHTML = h
    ? '<button type="button" class="homebtn" id="homeGo"><span><b>🏠 ' + esc(h.label) + '</b><small>' + esc(h.city) + ' · tu calle, un toque y a correr</small></span><span>▶</span></button>'
    : '<button type="button" class="homebtn" id="homeGps"><span><b>📍 Correr MI calle</b><small>usa tu ubicación y te montamos la carrera</small></span><span>▶</span></button>';
  var g = $('homeGo'), p = $('homeGps');
  if (g) g.onclick = function(){ goHome(h); };
  if (p) p.onclick = gpsHome;
}
function goHome(h){
  if (!h) return;
  S.pendingRoute = { fn: function(){ SK.routeFromHere(h.lat, h.lon, h.label); } };
  var c = (A.CITIES[S.cityId] || {}).c;
  if (S.G && c && A.kmBetween([h.lat, h.lon], c) < 2.5){ var pr = S.pendingRoute; S.pendingRoute = null; pr.fn(); }
  else A.openPlace(h.city, h.lat, h.lon, null);
  document.body.classList.remove('menu');
}
function gpsHome(){
  if (!navigator.geolocation){ toast('Este navegador no da la ubicación. Escribe tu calle.', true); return; }
  toast('📍 Buscando dónde estás…');
  navigator.geolocation.getCurrentPosition(function(pos){
    var lat = pos.coords.latitude, lon = pos.coords.longitude;
    fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&accept-language=es&lat=' + lat.toFixed(5) + '&lon=' + lon.toFixed(5), { headers: { 'Accept': 'application/json' } })
      .then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; })
      .then(function(x){
        var ad = (x && x.address) || {};
        var h = { lat: +lat.toFixed(5), lon: +lon.toFixed(5), label: ad.road || ad.pedestrian || (x && x.name) || 'Tu calle',
                  city: ad.city || ad.town || ad.village || ad.municipality || ad.county || 'Tu ciudad' };
        ls('sk_home', JSON.stringify(h)); paintHome();
        var onb = $('onb'); if (onb && onb.classList.contains('on')){ onb.classList.remove('on'); ls('sk_onb', '1'); var nm = $('onbName').value.trim(); if (nm){ A.setHandle(nm); $('handle').value = S.handle; } }
        goHome(h);
      });
  }, function(){ toast('Sin permiso de ubicación. Escribe tu calle y ciudad.', true); }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 600000 });
}
(function(){
  var go = $('onbGo'); if (!go) return;
  var b = el('<button class="btn ghost" id="onbGps" type="button" style="margin-top:6px">📍 Usar mi ubicación</button>');
  go.parentNode.insertBefore(b, go.nextSibling); b.onclick = gpsHome;
})();
paintHome();
SK.gpsHome = gpsHome;

// --- retar una calle concreta (la de un vecino o la de tu némesis)
async function raceStreet(o){
  // o: { city, slug, name, geom, lat, lon, cityName }
  var pts = geomPts(o.geom);
  if (!pts && (await A.openDb())){
    var sp = await NET.call('street', { city: o.city, slug: o.slug, device: A.deviceId() }, 12000);
    if (sp && sp.king){ pts = geomPts(sp.king.geom); if (!pts && sp.king.share){ var ch = A.readChallengeQ(sp.king.share); if (ch){ A.startChallenge(ch); return; } } }
  }
  if (!pts){ toast('No tengo el trazado de ' + esc(o.name) + ' todavía.', true); return; }
  var a = pts[0], b = pts[pts.length - 1];
  document.body.classList.remove('menu');
  var title = '👑 ' + o.name;
  if (o.city === cityKey() && S.G){
    var ok = await A.raceLatLon(a, b, title, null);
    if (ok) toast('Carrera por <b>' + esc(o.name) + '</b>. Bate a ' + esc(o.h || 'su rey') + '.');
    return;
  }
  S.pendingRoute = { a: a, b: b, title: title, id: null };
  A.openPlace(o.cityName || o.name, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, [a, b]);
}
SK.raceStreet = raceStreet;

// --- alcalde + top de la ciudad
async function paintMayor(){
  var ck = cityKey(); if (!ck) return;
  var rows = await NET.call('citytop', { city: ck }, 12000);
  rows = (rows || []).filter(function(r){ return r.handle && r.handle !== 'anon'; });
  mayor = { city: ck, h: rows[0] ? rows[0].handle : null, n: rows[0] ? +rows[0].streets : 0, top: rows };
  if (!rows.length){ mayorBlock.hidden = false; $('mayorBox').innerHTML = '<div class="mayor"><span class="ic">🏛️</span><span><b>Sin alcalde</b><small>quien tenga más calles en ' + esc(cityName()) + ' se lleva el título</small></span></div>'; return; }
  var mine = me();
  mayorBlock.hidden = false;
  $('mayorBox').innerHTML = '<div class="mayor"><span class="ic">🏛️</span><span><b>' + esc(mayor.h) + (mayor.h === mine ? ' (tú)' : '') + '</b><small>Alcalde de ' + esc(cityName()) + ' · ' + mayor.n + ' calles</small></span></div>' +
    '<div class="ctop">' + rows.slice(0, 5).map(function(r, i){ return '<div class="' + (r.handle === mine ? 'me' : '') + '"><span>' + (i + 1) + '. ' + esc(r.handle) + '</span><span>' + r.streets + ' calles</span></div>'; }).join('') + '</div>';
  var mr = rows.filter(function(r){ return r.handle === mine; })[0];
  if (!mr && mine !== 'anon' && rows.length) $('mayorBox').insertAdjacentHTML('beforeend', '<p class="hint" style="margin:6px 0 0">Te faltan ' + (mayor.n + 1 - (+$('terr').textContent || 0)) + ' calles para ser alcalde.</p>');
}

// --- reyes cerca
async function paintNear(){
  var h = home(), c = A.CITIES[S.cityId], at = null;
  if (h && c && c.c && A.kmBetween([h.lat, h.lon], c.c) < 6) at = [h.lat, h.lon];
  else if (S.circuit){ at = A.toLatLon(S.circuit.P[0], S.circuit.P[1]); }
  else if (c && c.c) at = c.c;
  if (!at) return;
  var rows = await NET.call('near', { lat: at[0], lon: at[1], km: 2 }, 12000);
  var mine = me();
  rows = (rows || []).filter(function(r){ return r.handle; }).slice(0, 6);
  if (!rows.length){ nearBlock.hidden = true; return; }
  await loadTitles(rows.map(function(r){ return r.handle; }));
  nearBlock.hidden = false;
  $('nearList').innerHTML = rows.map(function(r, i){
    var its = r.handle === mine, rg = reignTxt(r.since);
    return '<div class="it' + (its ? ' mine' : '') + '"><span><b>' + esc(r.name) + '</b><small>👑 ' + esc(r.handle) + (its ? ' (tú)' : '') + ' · ' + fmt(r.ms) + ' · ' +
      (r.dist_m < 1000 ? r.dist_m + ' m' : (r.dist_m / 1000).toFixed(1) + ' km') + (rg ? ' · ' + rg : '') + '</small></span>' +
      (its ? '<button type="button" class="btn ghost" data-i="' + i + '" data-k="1">📸</button>' : '<button type="button" class="btn" data-i="' + i + '">Retar</button>') + '</div>';
  }).join('');
  $('nearList').querySelectorAll('button').forEach(function(b){
    b.onclick = function(){
      var r = rows[+b.dataset.i], k = S.kings[r.slug];
      if (b.dataset.k) openStory({ name: r.name, slug: r.slug, ms: r.ms, city: r.city_name || cityName(), cityKey: r.city, h: r.handle, motto: r.motto, geom: k && k.g, n: titleCache[r.handle] || 1 });
      else raceStreet({ city: r.city, slug: r.slug, name: r.name, h: r.handle, geom: k && k.g, cityName: r.city_name });
    };
  });
}

// --- némesis
async function paintNemesis(){
  var rows = await NET.call('nemesis', { device: A.deviceId() }, 12000);
  var n = (rows || [])[0];
  if (!n || !n.thief){ nemBlock.hidden = true; return; }
  nemBlock.hidden = false;
  var inCity = [];
  for (var s in S.kings) if (S.kings[s] && S.kings[s].h === n.thief) inCity.push({ slug: s, k: S.kings[s] });
  $('nemBox').innerHTML = '<div class="eyebrow" style="color:#FF8A9A">Tu némesis</div><b>😈 ' + esc(n.thief) + '</b>' +
    '<p>Te ha quitado ' + n.n + (n.n == 1 ? ' calle' : ' calles') + (inCity.length ? '. Tiene ' + inCity.length + ' aquí.' : '.') + '</p>' +
    '<div class="row2">' + (inCity.length ? '<button type="button" class="btn" id="nemGo">⚔️ Venganza</button>' : '') +
    '<a class="btn ghost" href="/p/' + encodeURIComponent(n.thief) + '" target="_top">Ver su mapa</a></div>';
  var g = $('nemGo');
  if (g) g.onclick = function(){ var x = inCity[Math.floor(Math.random() * inCity.length)]; raceStreet({ city: cityKey(), slug: x.slug, name: x.k.n || x.slug, h: n.thief, geom: x.k.g }); };
}

// --- mi título
async function paintMyTitle(){
  var mine = A.getHandle(); if (!mine){ $('myTitle').textContent = ''; return; }
  titleCache[mine] = null; await loadTitles([mine]);
  var t = titleFor(mine), n = titleCache[mine] || 0, nx = null;
  for (var i = TITLES.length - 1; i >= 0; i--) if (TITLES[i][0] > n){ nx = TITLES[i]; break; }
  $('myTitle').textContent = t.icon + ' ' + t.name + (nx && t.name !== 'Alcalde' ? ' · ' + (nx[0] - n) + ' para ' + nx[1] : '');
}

var railT = 0, lastCity = null, lastKingsSig = '';
async function refreshRail(){
  if (!(await A.openDb())) return;
  railT = Date.now();
  try { await paintMayor(); } catch(e){}
  try { await paintMyTitle(); } catch(e){}
  try { await paintNear(); } catch(e){}
  try { await paintNemesis(); } catch(e){}
  // títulos de todos los reyes de la ciudad para la placa
  var hs = []; for (var s in S.kings) if (S.kings[s] && S.kings[s].h) hs.push(S.kings[s].h);
  loadTitles(hs);
}
setInterval(function(){
  var sig = Object.keys(S.kings || {}).length + '|' + S.routeId;
  if (S.cityId && (S.cityId !== lastCity || sig !== lastKingsSig) && Date.now() - railT > 3000){ lastCity = S.cityId; lastKingsSig = sig; refreshRail(); }
  else if (Date.now() - railT > 60000) refreshRail();
}, 2500);
})();
