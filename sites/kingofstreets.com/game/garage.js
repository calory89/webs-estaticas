/* King of Streets v7 — el taller.
   Coches que se desbloquean con coronas (todos rinden igual), acabados de pintura (brillo,
   metalizado, perla, mate), llantas, vinilos laterales, número de carreras, neón de bajos y
   matrícula con tu nombre. Todo es estético: nadie gana por pagar ni por desbloquear. */
(function(){
'use strict';
var A = window.SK && SK.api; if (!A || !window.THREE) return;
var S = A.S, $ = A.$, esc = A.esc, toast = A.toast;
function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch(e){ return null; } }
function lj(k, d){ try { return JSON.parse(ls(k) || 'null') || d; } catch(e){ return d; } }
function el(html){ var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

// ============================================================== qué se desbloquea con cuántas coronas
var CAR_NEED = { sedan: 0, 'hatchback-sports': 0, taxi: 0, van: 0, suv: 1, 'sedan-sports': 3, police: 5, 'suv-luxury': 10, race: 20, 'race-future': 35 };
var FIN = [ { id: 'brillo', n: 'Brillo', need: 0, m: 0.06, r: 0.42, e: 0.32 }, { id: 'metal', n: 'Metalizado', need: 2, m: 0.55, r: 0.28, e: 0.9 },
            { id: 'mate', n: 'Mate', need: 4, m: 0.0, r: 0.95, e: 0.05 }, { id: 'perla', n: 'Perla', need: 8, m: 0.35, r: 0.18, e: 1.3 } ];
var RIMS = [ { id: 'plata', n: 'Plata', c: '#FFFFFF', need: 0 }, { id: 'negro', n: 'Negro', c: '#4A4F55', need: 0 }, { id: 'blanco', n: 'Blanco', c: '#F4F4F4', need: 1 },
             { id: 'bronce', n: 'Bronce', c: '#C98B4A', need: 3 }, { id: 'oro', n: 'Oro', c: '#F2C14E', need: 5 } ];
var VINYL = [ { id: 'no', n: 'Sin vinilo', need: 0 }, { id: 'num', n: 'Número', need: 1 }, { id: 'franja', n: 'Franja', need: 3 }, { id: 'doble', n: 'Doble franja', need: 6 } ];
var NEON = [ { id: 'no', n: 'Sin neón', c: null, need: 0 }, { id: 'rojo', n: 'Rojo', c: '#FF2A3A', need: 6 }, { id: 'azul', n: 'Azul', c: '#2A7BFF', need: 6 },
             { id: 'verde', n: 'Verde', c: '#2AFF8A', need: 6 }, { id: 'morado', n: 'Morado', c: '#B04AFF', need: 6 }, { id: 'naranja', n: 'Naranja', c: '#FF7A1A', need: 6 } ];
var G = lj('sk_garage', { fin: 'brillo', rim: 'plata', vinyl: 'no', vcol: '#FFFFFF', neon: 'no', plate: '', num: 7 });
function crowns(){ var s = lj('sk_statsx', {}); return Math.max((S.stats && S.stats.streets) || 0, s.crowns || 0, +(($('terr') || {}).textContent) || 0); }
SK.crownsTotal = crowns;
function ok(need){ return crowns() >= need; }
function save(){ ls('sk_garage', JSON.stringify(G)); if (SK.rebuildPlayerCar) SK.rebuildPlayerCar(); }

// ============================================================== coches bloqueados en el selector
function lockCars(){
  var box = $('cars'); if (!box) return;
  var have = crowns();
  box.querySelectorAll('.car').forEach(function(b){
    var need = CAR_NEED[b.dataset.id] || 0, locked = have < need;
    b.classList.toggle('lock', locked);
    var tag = b.querySelector('.lk');
    if (locked && !tag) b.insertAdjacentHTML('beforeend', '<em class="lk">🔒 ' + need + '👑</em>');
    if (!locked && tag) tag.remove();
  });
}
document.addEventListener('click', function(e){
  var b = e.target.closest && e.target.closest('#cars .car'); if (!b) return;
  var need = CAR_NEED[b.dataset.id] || 0;
  if (crowns() < need){ e.stopPropagation(); e.preventDefault(); toast('🔒 Este coche se desbloquea con ' + need + ' coronas. Tienes ' + crowns() + '. (Todos corren igual.)'); }
}, true);
if ($('cars') && window.MutationObserver) new MutationObserver(lockCars).observe($('cars'), { childList: true });
setInterval(lockCars, 4000); lockCars();
// si tenías elegido uno bloqueado, vuelves al Urbano
setTimeout(function(){ var id = SK.carId ? SK.carId(S.carKind) : S.carKind; if (crowns() < (CAR_NEED[id] || 0)){ S.carKind = 'sedan'; } }, 8000);

var css = `
.car.lock{opacity:.55} .car .lk{position:absolute;left:5px;top:5px;font:700 10px var(--mono);font-style:normal;background:rgba(0,0,0,.6);color:#fff;padding:1px 5px;border-radius:4px}
#garage .card{width:min(520px,100%)} #garage .inner{padding:12px 20px 18px;display:flex;flex-direction:column;gap:12px}
.gsec b{display:block;font:700 12px var(--cond);letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
.gopts{display:flex;flex-wrap:wrap;gap:6px}
.gopts button{background:var(--surface);border:1px solid var(--line);color:var(--fg);border-radius:999px;padding:6px 11px;font-size:12px;display:flex;align-items:center;gap:6px}
.gopts button.on{border-color:var(--gold);background:#2E2408}
.gopts button.lock{opacity:.45}
.gopts i{width:12px;height:12px;border-radius:50%;display:inline-block;border:1px solid rgba(255,255,255,.4)}
#gPlate{font:700 16px var(--mono);letter-spacing:.14em;text-transform:uppercase;max-width:200px}
`;
var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

// ============================================================== la ventana del taller
var ov = el('<div class="overlay" id="garage"><div class="card"><header><div class="lab">Taller · todo es estético</div><h2>Tu coche</h2></header><div class="inner" id="gIn"></div>' +
  '<footer><button type="button" class="btn" id="gOk">Listo</button></footer></div></div>');
$('stage').appendChild(ov);
$('gOk').onclick = function(){ ov.classList.remove('on'); };
function row(title, list, key, colorKey){
  return '<div class="gsec"><b>' + title + '</b><div class="gopts">' + list.map(function(o){
    var locked = !ok(o.need || 0);
    return '<button type="button" data-k="' + key + '" data-v="' + o.id + '" class="' + (G[key] === o.id ? 'on' : '') + (locked ? ' lock' : '') + '">' +
      (o.c ? '<i style="background:' + o.c + '"></i>' : '') + esc(o.n) + (locked ? ' · 🔒' + o.need + '👑' : '') + '</button>';
  }).join('') + '</div></div>';
}
function render(){
  $('gIn').innerHTML =
    '<p class="hint" style="margin:0">Tienes <b>' + crowns() + ' coronas</b>. Cuantas más calles ganes, más cosas desbloqueas.</p>' +
    row('Acabado de la pintura', FIN, 'fin') + row('Llantas', RIMS, 'rim') + row('Vinilo', VINYL, 'vinyl') + row('Neón de bajos', NEON, 'neon') +
    '<div class="gsec"><b>Matrícula</b><div class="gopts"><input id="gPlate" maxlength="8" placeholder="' + esc((A.getHandle() || 'KING').toUpperCase().slice(0, 8)) + '" value="' + esc(G.plate || '') + '">' +
    '<input id="gNum" type="number" min="0" max="99" value="' + (G.num || 7) + '" style="width:70px" title="Número de carreras"></div></div>';
  $('gIn').querySelectorAll('button[data-k]').forEach(function(b){
    b.onclick = function(){
      var list = { fin: FIN, rim: RIMS, vinyl: VINYL, neon: NEON }[b.dataset.k], o = list.filter(function(x){ return x.id === b.dataset.v; })[0];
      if (!ok(o.need || 0)){ toast('🔒 ' + o.n + ': ' + o.need + ' coronas.'); return; }
      G[b.dataset.k] = o.id; save(); render();
    };
  });
  $('gPlate').oninput = function(){ G.plate = this.value.toUpperCase().replace(/[^A-Z0-9 ÑÇ-]/g, '').slice(0, 8); save(); };
  $('gNum').oninput = function(){ G.num = Math.max(0, Math.min(99, +this.value || 0)); save(); };
}
SK.openGarage = function(){ render(); ov.classList.add('on'); };
(function(){
  var cars = $('cars'); if (!cars) return;
  var b = el('<button type="button" class="btn ghost" style="margin-top:6px">🔧 Taller: pintura, llantas, vinilos, neón, matrícula</button>');
  cars.parentNode.appendChild(b); b.onclick = SK.openGarage;
})();

// ============================================================== aplicar al coche 3D
function tex(draw, w, h){ var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; }
function localBox(grp){
  var sp = grp.position.clone(), sr = grp.rotation.clone(); grp.position.set(0, 0, 0); grp.rotation.set(0, 0, 0); grp.updateMatrixWorld(true);
  var b = new THREE.Box3();
  grp.traverse(function(o){ if (o.isMesh && !o.isSprite && o.geometry && !/shadow/i.test(o.name) && o.material && !o.material.transparent) b.expandByObject(o); });
  grp.position.copy(sp); grp.rotation.copy(sr); grp.updateMatrixWorld(true);
  return b;
}
SK.decorateCar = function(grp){
  if (!grp || !grp.userData.kenney) return;
  var fin = FIN.filter(function(f){ return f.id === G.fin && ok(f.need); })[0] || FIN[0];
  (grp.userData.paint || []).forEach(function(m){ if ('metalness' in m){ m.metalness = fin.m; m.roughness = fin.r; m.envMapIntensity = fin.e; m.needsUpdate = true; } });
  var rim = RIMS.filter(function(r){ return r.id === G.rim && ok(r.need); })[0] || RIMS[0];
  (grp.userData.wheels || []).forEach(function(w){
    w.traverse(function(o){ if (o.isMesh && o.material){ o.material = o.material.clone(); o.material.color = new THREE.Color(rim.c); } });
  });
  var b = localBox(grp), size = b.getSize(new THREE.Vector3()), z = b.max.z, H = size.y;
  // vinilos laterales y número
  var vy = VINYL.filter(function(v){ return v.id === G.vinyl && ok(v.need); })[0] || VINYL[0];
  if (vy.id === 'franja' || vy.id === 'doble'){
    var sm = new THREE.MeshBasicMaterial({ color: new THREE.Color(G.vcol || '#FFFFFF') });
    [-1, 1].forEach(function(sd){
      var lines = vy.id === 'doble' ? [0.40, 0.47] : [0.44];
      lines.forEach(function(yy){ var s = new THREE.Mesh(new THREE.BoxGeometry(size.x * 0.82, 0.05, 0.01), sm); s.position.set((b.min.x + b.max.x) / 2, b.min.y + H * yy, sd * (z + 0.006)); s.userData.noDent = true; grp.add(s); });
    });
  }
  if (vy.id === 'num'){
    var nt = tex(function(g, w, h){ g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 64, 60, 0, 6.283); g.fill(); g.fillStyle = '#111'; g.font = '700 70px "Barlow Condensed", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(G.num || 7), 64, 68); }, 128, 128);
    [-1, 1].forEach(function(sd){ var p = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ map: nt, transparent: true })); p.position.set((b.min.x + b.max.x) / 2, b.min.y + H * 0.46, sd * (z + 0.008)); p.rotation.y = sd > 0 ? 0 : Math.PI; p.userData.noDent = true; grp.add(p); });
  }
  // neón de bajos
  var ne = NEON.filter(function(n){ return n.id === G.neon && ok(n.need); })[0];
  if (ne && ne.c){
    var gt = tex(function(g, w, h){ var gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, 128, 128);
    var nm = new THREE.Mesh(new THREE.PlaneGeometry(size.x + 1.6, size.z + 1.8), new THREE.MeshBasicMaterial({ map: gt, color: new THREE.Color(ne.c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    nm.rotation.x = -Math.PI / 2; nm.position.set((b.min.x + b.max.x) / 2, 0.045, 0); nm.renderOrder = 3; nm.userData.noDent = true; grp.add(nm);
  }
  // matrícula con tu nombre (delante y detrás)
  var txt = (G.plate || (A.getHandle() || 'KING')).toUpperCase().slice(0, 8);
  var pt = tex(function(g, w, h){
    g.fillStyle = '#F4F4F0'; g.fillRect(0, 0, w, h); g.fillStyle = '#1E3FA8'; g.fillRect(0, 0, 34, h);
    g.fillStyle = '#FFD84A'; g.beginPath(); g.arc(17, 18, 8, 0, 6.283); g.fill();
    g.fillStyle = '#fff'; g.font = '700 22px Arial'; g.textAlign = 'center'; g.fillText('K', 17, 52);
    g.fillStyle = '#111'; g.font = '700 42px "JetBrains Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, (w + 34) / 2, h / 2 + 2, w - 46);
    g.strokeStyle = '#111'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3);
  }, 256, 64);
  var pm = new THREE.MeshBasicMaterial({ map: pt });
  var rear = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.14), pm); rear.position.set(b.min.x - 0.012, b.min.y + H * 0.3, 0); rear.rotation.y = -Math.PI / 2; rear.userData.noDent = true; grp.add(rear);
  var front = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.14), pm); front.position.set(b.max.x + 0.012, b.min.y + H * 0.26, 0); front.rotation.y = Math.PI / 2; front.userData.noDent = true; grp.add(front);
};
SK.garage = function(){ return G; };
})();
