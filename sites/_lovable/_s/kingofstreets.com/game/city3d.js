/* King of Streets — ciudad 3D propia. Sale de OpenStreetMap, se ilumina y texturiza en el navegador.
   No necesita ninguna clave: es la vista por defecto. */
(function(){
'use strict';
var A = window.SK && SK.api; if (!A || typeof THREE === 'undefined') return;
var S = A.S, $ = A.$;

var gl = document.getElementById('gl3');
var renderer = null, scene = null, cam = null, sun = null, hemi = null;
var city = null, builtFor = null, routeMesh = null, routeFor = null, beam = null;
var carGrp = null, ghostGrp = null, failed = false, building = false, progress = 0, skyMesh = null;
var MOBILE = matchMedia('(pointer:coarse)').matches;

var LOOK = {
  day: {
    skyTop:'#2E7FD6', skyLow:'#DCEBF6', fog:'#D2E2EE', fogNear:140, fogFar:760,
    sun:0xFFE9CC, sunI:1.02, ambSky:0xC4DAF0, ambGround:0x857C70, ambI:0.50,
    ground:'#9A958C', pavement:'#BDB8AE', kerb:'#9C968B', asphalt:'#5A5D62',
    mark:'#F4F3EE', water:'#4F8FC2', green:'#86B267', plaza:'#C98A68', trunk:'#5B4A38', leaf:'#6F9F4E',
    trace:'#FF5A2A', night:false,
    tint:[[1.00,0.98,0.94],[1.00,0.96,0.92],[0.97,0.97,0.96],[0.96,0.98,1.00],[1.00,0.99,0.95],[1.00,0.96,0.90]]
  },
  dusk: {
    skyTop:'#2E3F78', skyLow:'#F4A262', fog:'#E7A57A', fogNear:120, fogFar:720,
    sun:0xFFB273, sunI:1.15, ambSky:0xF2B48C, ambGround:0x5E4636, ambI:0.52, sunH:70,
    ground:'#8C7C70', pavement:'#B9A493', kerb:'#94826F', asphalt:'#4C4B52',
    mark:'#F6E6D2', water:'#C98B67', green:'#76954F', plaza:'#C67E5C', trunk:'#4A3A2C', leaf:'#658843',
    trace:'#FF5A2A', night:false, dusk:true,
    tint:[[1.00,0.88,0.76],[1.00,0.86,0.74],[0.98,0.86,0.78],[0.96,0.86,0.80],[1.00,0.88,0.76],[1.00,0.85,0.72]]
  },
  night: {
    skyTop:'#040710', skyLow:'#12202E', fog:'#0A121B', fogNear:35, fogFar:360,
    sun:0x9FB6D2, sunI:0.26, ambSky:0x3A4E68, ambGround:0x241E14, ambI:0.95,
    ground:'#262C33', pavement:'#4A5158', kerb:'#363D45', asphalt:'#454B52',
    mark:'#8A949C', water:'#0E2236', green:'#1B2E20', plaza:'#3E332D', trunk:'#2A241C', leaf:'#22341F',
    trace:'#FF5B3D', night:true,
    tint:[[0.40,0.42,0.48],[0.40,0.38,0.40],[0.38,0.40,0.45],[0.34,0.40,0.48],[0.42,0.43,0.46],[0.38,0.36,0.36]]
  }
};
function L(){ return LOOK[S.skin] || LOOK.day; }

// ---------------------------------------------------------------- textures
var TEX = {};
function px(w, h){ var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function tex(canvas, rx, ry){
  var t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (rx) t.repeat.set(rx, ry);
  return t;
}
// Six facade families, one per OSM building:material / building:colour.
// A tile is one window bay (3.4 m) by one storey (3.1 m).
var MATS = [
  { wall:'#E8E0D0', trim:'#FFFFFF', glass:'#4E6273', balcony:true,  band:'#D8CEBA' },  // 0 revoco
  { wall:'#9E5B44', trim:'#E8DCCB', glass:'#42525F', balcony:false, band:'#8A4C38' },  // 1 ladrillo
  { wall:'#B9B9B6', trim:'#D6D6D2', glass:'#55636D', balcony:false, band:'#A6A6A3' },  // 2 hormigon
  { wall:'#6E7E8C', trim:'#9FB0BC', glass:'#8FB6D2', balcony:false, band:'#5E6E7C' },  // 3 vidrio
  { wall:'#D8CFBB', trim:'#F0E9D8', glass:'#4A5A66', balcony:true,  band:'#C4BAA4' },  // 4 piedra
  { wall:'#A98A63', trim:'#E6D8C0', glass:'#46545E', balcony:false, band:'#93764F' }   // 5 madera
];
// Cada textura de fachada son 4 vanos por 3 plantas, cada uno con su variación
// (persiana, cortina, luz encendida o no), para que la fachada no sea un sello repetido.
var BAYX = 4, BAYY = 3;
function floorTile(v, night){
  var c = px(128*BAYX, 128*BAYY), g = c.getContext('2d');
  var em = night ? px(128*BAYX, 128*BAYY) : null, eg = em && em.getContext('2d');
  if (eg){ eg.fillStyle = '#000000'; eg.fillRect(0, 0, 128*BAYX, 128*BAYY); }
  for (var by = 0; by < BAYY; by++) for (var bx = 0; bx < BAYX; bx++){
    g.save(); g.translate(bx*128, by*128);
    if (eg){ eg.save(); eg.translate(bx*128, by*128); }
    bay(g, eg, v, night);
    g.restore(); if (eg) eg.restore();
  }
  return { base:c, emis:em };
}
function bay(g, eg, v, night){
  var M = MATS[v % MATS.length];
  g.fillStyle = M.wall; g.fillRect(0, 0, 128, 128);
  if (v === 1){                       // brick courses
    g.fillStyle = 'rgba(255,255,255,.10)';
    for (var r = 0; r < 16; r++) g.fillRect(0, r*8+6, 128, 1.5);
    g.fillStyle = 'rgba(0,0,0,.07)';
    for (var r2 = 0; r2 < 16; r2++) g.fillRect((r2%2)*16, r2*8, 2, 8);
  } else if (v === 4){                // ashlar
    g.fillStyle = 'rgba(0,0,0,.09)';
    for (var a2 = 0; a2 < 5; a2++) g.fillRect(0, a2*26+22, 128, 2);
  } else if (v === 3){                // curtain wall: mullion grid, no storey band
    g.fillStyle = 'rgba(255,255,255,.13)';
    for (var m2 = 0; m2 < 4; m2++) g.fillRect(m2*32, 0, 2, 128);
  }
  if (v !== 3){
    g.fillStyle = M.band; g.fillRect(0, 120, 128, 8);
    g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(0, 116, 128, 4);
  }
  var wx = v === 3 ? 8 : [26,24,22,6,20,28][v], ww = v === 3 ? 112 : [76,80,84,116,88,72][v];
  var wy = v === 3 ? 6 : 22, wh = v === 3 ? 108 : 74;
  if (v !== 3){
    g.fillStyle = 'rgba(0,0,0,.20)'; g.fillRect(wx-4, wy-4, ww+8, wh+8);
    g.fillStyle = M.trim; g.fillRect(wx-3, wy-3, ww+6, wh+6);
  }
  if (night){
    var on = Math.random() < (v === 3 ? 0.55 : 0.36);
    g.fillStyle = on ? '#FFE0A2' : '#0E141C';
    g.fillRect(wx, wy, ww, wh);
    if (on){
      eg.fillStyle = '#FFD892'; eg.fillRect(wx, wy, ww, wh);
      eg.fillStyle = 'rgba(255,255,255,.45)'; eg.fillRect(wx, wy, ww, wh*0.32);
    }
  } else {
    var gr = g.createLinearGradient(wx, wy, wx+ww, wy+wh);
    gr.addColorStop(0, '#B7C8D6'); gr.addColorStop(0.42, M.glass); gr.addColorStop(1, '#394A57');
    g.fillStyle = gr; g.fillRect(wx, wy, ww, wh);
  }
  g.fillStyle = night ? 'rgba(0,0,0,.5)' : M.trim;
  g.fillRect(wx + ww/2 - 2, wy, 4, wh);
  if (v !== 1 && v !== 3) g.fillRect(wx, wy + wh*0.42, ww, 3);
  if (v !== 3){
    g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(wx-6, wy+wh, ww+12, 5);
    g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(wx-6, wy+wh+5, ww+12, 3);
  }
  if (M.balcony){
    g.fillStyle = night ? 'rgba(18,22,28,.9)' : 'rgba(56,56,58,.85)';
    for (var i = 0; i < 11; i++) g.fillRect(wx-6 + i*(ww+12)/11, wy+wh-16, 2, 22);
    g.fillRect(wx-7, wy+wh-18, ww+14, 3);
    g.fillRect(wx-7, wy+wh+1, ww+14, 3);
  }
  // persianas y cortinas a medio bajar, distintas en cada ventana
  if (!night && v !== 3 && Math.random() < 0.45){
    var drop = wh * (0.2 + Math.random()*0.6);
    g.fillStyle = ['rgba(236,228,210,.92)','rgba(120,96,70,.85)','rgba(208,200,186,.9)','rgba(92,120,98,.85)'][(Math.random()*4)|0];
    g.fillRect(wx, wy, ww, drop);
    g.fillStyle = 'rgba(0,0,0,.12)';
    for (var sl = wy + 4; sl < wy + drop; sl += 5) g.fillRect(wx, sl, ww, 1);
  }
}
// one tile = one bay by the 4.2 m ground floor
function plinthTile(v, night){
  var M = MATS[v % MATS.length];
  var c = px(128, 160), g = c.getContext('2d');
  var em = night ? px(128, 160) : null, eg = em && em.getContext('2d');
  if (eg){ eg.fillStyle = '#000000'; eg.fillRect(0, 0, 128, 160); }
  g.fillStyle = M.band; g.fillRect(0, 0, 128, 160);
  g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, 128, 128, 32);
  g.fillStyle = night ? '#33291A' : '#2B3740'; g.fillRect(10, 34, 108, 96);
  if (night){
    var lit = Math.random() < 0.58;
    g.fillStyle = lit ? '#FFD98A' : '#171A20';
    g.fillRect(14, 38, 100, 88);
    if (lit){
      eg.fillStyle = '#FFCE7A'; eg.fillRect(14, 38, 100, 88);
      eg.fillStyle = '#FFF0C8'; eg.fillRect(6, 8, 116, 22);
    }
  } else {
    var gr2 = g.createLinearGradient(14, 38, 114, 126);
    gr2.addColorStop(0, '#8296A6'); gr2.addColorStop(0.5, '#32434E'); gr2.addColorStop(1, '#5C6E7A');
    g.fillStyle = gr2; g.fillRect(14, 38, 100, 88);
  }
  g.fillStyle = night ? 'rgba(26,22,16,.9)' : 'rgba(46,44,42,.9)';
  g.fillRect(84, 46, 26, 80); g.fillRect(10, 30, 108, 6);
  g.fillStyle = ['#7A4B3A','#2F4F58','#5B4A6E','#2E5E72','#6B5A3A','#4A5F3A'][v % 6];
  g.fillRect(6, 8, 116, 22);
  g.fillStyle = 'rgba(255,255,255,' + (night ? .55 : .35) + ')';
  for (var s2 = 0; s2 < 5; s2++) g.fillRect(18 + s2*19, 16, 11, 6);
  g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(0, 150, 128, 10);
  return { base:c, emis:em };
}
function asphaltTile(night){
  var c = px(128, 128), g = c.getContext('2d');
  g.fillStyle = night ? '#9AA0A6' : '#C4C4C4'; g.fillRect(0, 0, 128, 128);
  var d = g.getImageData(0, 0, 128, 128), p = d.data;
  for (var i = 0; i < p.length; i += 4){
    var n = (Math.random() - 0.5) * 12 + (Math.random() < 0.015 ? 14 : 0);
    p[i] += n; p[i+1] += n; p[i+2] += n;
  }
  g.putImageData(d, 0, 0);
  return c;
}
// adoquín de plaza: hiladas de ladrillo a matajuntas, cada pieza con su tono
function plazaTile(){
  var c = px(256, 256), g = c.getContext('2d');
  g.fillStyle = '#8E8680'; g.fillRect(0, 0, 256, 256);
  var bw = 32, bh = 16;
  for (var r = 0; r < 256/bh; r++){
    var off = (r % 2) * bw/2;
    for (var k = -1; k < 256/bw + 1; k++){
      var v = 0.86 + Math.random()*0.22;
      g.fillStyle = 'rgb(' + Math.round(236*v) + ',' + Math.round(226*v) + ',' + Math.round(214*v) + ')';
      g.fillRect(k*bw + off + 1, r*bh + 1, bw - 2, bh - 2);
    }
  }
  return c;
}
function grassTile(){
  var c = px(128, 128), g = c.getContext('2d');
  g.fillStyle = '#D0D0D0'; g.fillRect(0, 0, 128, 128);
  var d = g.getImageData(0, 0, 128, 128), p = d.data;
  for (var i = 0; i < p.length; i += 4){
    var n = (Math.random() - 0.5) * 46;
    p[i] += n; p[i+1] += n; p[i+2] += n;
  }
  g.putImageData(d, 0, 0);
  return c;
}
function paveTile(){
  var c = px(128, 128), g = c.getContext('2d');
  g.fillStyle = '#D6D6D6'; g.fillRect(0, 0, 128, 128);
  for (var y = 0; y < 128; y += 32) for (var x = 0; x < 128; x += 32){
    var v = 208 + Math.floor(Math.random()*26);
    g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
    g.fillRect(x + 1, y + 1, 30, 30);
  }
  return c;
}
function buildTextures(){
  var night = L().night, key = S.skin;
  if (TEX.key === key) return;
  TEX.key = key; TEX.floor = []; TEX.plinth = []; TEX.floorE = []; TEX.plinthE = [];
  for (var v = 0; v < 6; v++){
    var f = floorTile(v, night), pl = plinthTile(v, night);
    TEX.floor.push(tex(f.base)); TEX.floorE.push(f.emis ? tex(f.emis) : null);
    TEX.plinth.push(tex(pl.base)); TEX.plinthE.push(pl.emis ? tex(pl.emis) : null);
  }
  TEX.asphalt = tex(asphaltTile(night), 1, 1);
  TEX.plaza = tex(plazaTile(), 1, 1);
  TEX.grass = tex(grassTile(), 1, 1);
  TEX.pave = tex(paveTile(), 1, 1);
}

// ---------------------------------------------------------------- geometry helpers
function signedArea(p, idx){
  var s = 0;
  for (var i = 0; i < idx.length; i++){
    var a = idx[i]*2, b = idx[(i+1)%idx.length]*2;
    s += p[a]*p[b+1] - p[b]*p[a+1];
  }
  return s/2;
}
function cr(p, a, b, c){
  return (p[b*2]-p[a*2])*(p[c*2+1]-p[a*2+1]) - (p[b*2+1]-p[a*2+1])*(p[c*2]-p[a*2]);
}
function inTri(p, q, a, b, c){
  var d1 = cr(p,a,b,q), d2 = cr(p,b,c,q), d3 = cr(p,c,a,q);
  return !(((d1<0)||(d2<0)||(d3<0)) && ((d1>0)||(d2>0)||(d3>0)));
}
function convexFan(p){
  var n = p.length/2, sign = 0;
  for (var i = 0; i < n; i++){
    var c = cr(p, i, (i+1)%n, (i+2)%n);
    if (c > 1e-7){ if (sign < 0) return null; sign = 1; }
    else if (c < -1e-7){ if (sign > 0) return null; sign = -1; }
  }
  var out = [];
  for (var k = 1; k < n-1; k++) out.push(0, k, k+1);
  return out;
}
function triangulate(p){
  var n = p.length/2; if (n < 3) return [];
  var fan = convexFan(p); if (fan) return fan;
  var idx = []; for (var i = 0; i < n; i++) idx.push(i);
  if (signedArea(p, idx) < 0) idx.reverse();
  var out = [], guard = 0;
  while (idx.length > 3 && guard++ < 600){
    var cut = -1;
    for (var k = 0; k < idx.length; k++){
      var a = idx[(k-1+idx.length)%idx.length], b = idx[k], c = idx[(k+1)%idx.length];
      if (cr(p, a, b, c) <= 0) continue;
      var clean = true;
      for (var j = 0; j < idx.length; j++){
        var q = idx[j];
        if (q === a || q === b || q === c) continue;
        if (inTri(p, q, a, b, c)){ clean = false; break; }
      }
      if (!clean) continue;
      out.push(a, b, c); idx.splice(k, 1); cut = k; break;
    }
    if (cut < 0) break;
  }
  if (idx.length === 3) out.push(idx[0], idx[1], idx[2]);
  else for (var m = 1; m < idx.length-1; m++) out.push(idx[0], idx[m], idx[m+1]);
  return out;
}

function B(){
  this.cap = 8192; this.i = 0; this.hasUV = false;
  this.p = new Float32Array(this.cap*3);
  this.n = new Float32Array(this.cap*3);
  this.c = new Float32Array(this.cap*3);
  this.u = new Float32Array(this.cap*2);
}
B.prototype.need = function(k){
  if (this.i + k <= this.cap) return;
  var cap = this.cap; while (this.i + k > cap) cap *= 2;
  var p = new Float32Array(cap*3); p.set(this.p); this.p = p;
  var n = new Float32Array(cap*3); n.set(this.n); this.n = n;
  var c = new Float32Array(cap*3); c.set(this.c); this.c = c;
  var u = new Float32Array(cap*2); u.set(this.u); this.u = u;
  this.cap = cap;
};
B.prototype.tri = function(x1,y1,z1,x2,y2,z2,x3,y3,z3, col, uvs){
  this.need(3);
  var ux = x2-x1, uy = y2-y1, uz = z2-z1, vx = x3-x1, vy = y3-y1, vz = z3-z1;
  var nx = uy*vz - uz*vy, ny = uz*vx - ux*vz, nz = ux*vy - uy*vx;
  var l = Math.sqrt(nx*nx + ny*ny + nz*nz) || 1; nx /= l; ny /= l; nz /= l;
  var i = this.i, p = this.p, n = this.n, c = this.c, u = this.u;
  var o = i*3;
  p[o]=x1; p[o+1]=y1; p[o+2]=z1; p[o+3]=x2; p[o+4]=y2; p[o+5]=z2; p[o+6]=x3; p[o+7]=y3; p[o+8]=z3;
  for (var k = 0; k < 3; k++){
    n[o+k*3]=nx; n[o+k*3+1]=ny; n[o+k*3+2]=nz;
    c[o+k*3]=col[0]; c[o+k*3+1]=col[1]; c[o+k*3+2]=col[2];
  }
  if (uvs){
    this.hasUV = true; var q = i*2;
    u[q]=uvs[0]; u[q+1]=uvs[1]; u[q+2]=uvs[2]; u[q+3]=uvs[3]; u[q+4]=uvs[4]; u[q+5]=uvs[5];
  }
  this.i = i + 3;
};
B.prototype.quad = function(a, b, c, d, col, uvs){
  this.tri(a[0],a[1],a[2], b[0],b[1],b[2], c[0],c[1],c[2], col, uvs && [uvs[0],uvs[1], uvs[2],uvs[3], uvs[4],uvs[5]]);
  this.tri(a[0],a[1],a[2], c[0],c[1],c[2], d[0],d[1],d[2], col, uvs && [uvs[0],uvs[1], uvs[4],uvs[5], uvs[6],uvs[7]]);
};
// vertical face with a colour gradient bottom to top
B.prototype.face = function(ax, az, bx, bz, y0, y1, lo, hi, uvs){
  this.need(6);
  var ux = bx-ax, uz = bz-az;
  var nx = -uz, nz = ux, l = Math.sqrt(nx*nx + nz*nz) || 1; nx /= l; nz /= l;
  var i = this.i, o = i*3, p = this.p, n = this.n, c = this.c, u = this.u;
  var V = [ax,y0,az, bx,y0,bz, bx,y1,bz, ax,y0,az, bx,y1,bz, ax,y1,az];
  for (var k = 0; k < 18; k++) p[o+k] = V[k];
  for (var j = 0; j < 6; j++){ n[o+j*3]=nx; n[o+j*3+1]=0; n[o+j*3+2]=nz; }
  var C = [lo,lo,hi, lo,hi,hi];
  for (var m = 0; m < 6; m++){ c[o+m*3]=C[m][0]; c[o+m*3+1]=C[m][1]; c[o+m*3+2]=C[m][2]; }
  if (uvs){
    this.hasUV = true; var q = i*2, U = [0,0, uvs[0],0, uvs[0],uvs[1], 0,0, uvs[0],uvs[1], 0,uvs[1]];
    for (var z = 0; z < 12; z++) u[q+z] = U[z];
  }
  this.i = i + 6;
};
B.prototype.mesh = function(opts){
  var g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(this.p.subarray(0, this.i*3), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(this.n.subarray(0, this.i*3), 3));
  g.setAttribute('color', new THREE.BufferAttribute(this.c.subarray(0, this.i*3), 3));
  if (this.hasUV) g.setAttribute('uv', new THREE.BufferAttribute(this.u.subarray(0, this.i*2), 2));
  var def = { vertexColors: true, side: THREE.DoubleSide };
  if (opts) for (var k in opts) def[k] = opts[k];
  var m = new THREE.Mesh(g, new THREE.MeshLambertMaterial(def));
  m.castShadow = true; m.receiveShadow = true;
  return m;
};
B.prototype.empty = function(){ return this.i === 0; };
function hx(h){ var c = new THREE.Color(h); return [c.r, c.g, c.b]; }

// ---------------------------------------------------------------- corridor
// Only build what you can drive to see: everything within CORR metres of the route.
var CORR = MOBILE ? 440 : 600;
function corridor(){
  var R = S.circuit;
  if (!R) return null;
  var cell = 200, set = new Set(), P = R.P;
  var reach = Math.ceil(CORR / cell);
  function mark(x, y){
    var cx = Math.floor(x/cell), cy = Math.floor(y/cell);
    for (var i = cx-reach; i <= cx+reach; i++)
      for (var j = cy-reach; j <= cy+reach; j++) set.add(i*100000 + j);
  }
  for (var i = 0; i < P.length/2; i++) mark(P[i*2], P[i*2+1]);
  return { set:set, cell:cell,
    has: function(x, y){ return set.has(Math.floor(x/cell)*100000 + Math.floor(y/cell)); } };
}

// ---------------------------------------------------------------- city
var SUNDIR = [0.48, 0.78];      // map-space direction the sun comes from
SK.sunDir = SUNDIR;
function buildCity(){
  var G = S.G, D = S.decor, lk = L(), cor = corridor();
  buildTextures();
  var flat = new B(), walls = [], plinth = [];
  for (var mi = 0; mi < 6; mi++){ walls.push(new B()); plinth.push(new B()); }
  var road = new B();
  var grp = new THREE.Group();

  var gc = hx(lk.ground), pv = hx(lk.pavement), kb = hx(lk.kerb),
      asf = hx(lk.asphalt), mk = hx(lk.mark), wat = hx(lk.water), grn = hx(lk.green);

  // ground: its own mesh, tiled so depth interpolates cleanly, and offset behind the street
  var bb = G.bounds, pad = 900, gb = new B(), TILE = 150;
  for (var gx = bb[0]-pad; gx < bb[2]+pad; gx += TILE)
    for (var gy = bb[1]-pad; gy < bb[3]+pad; gy += TILE)
      gb.quad([gx,0,-gy], [gx+TILE,0,-gy], [gx+TILE,0,-(gy+TILE)], [gx,0,-(gy+TILE)], gc,
              [gx/3.6, gy/3.6, (gx+TILE)/3.6, gy/3.6, (gx+TILE)/3.6, (gy+TILE)/3.6, gx/3.6, (gy+TILE)/3.6]);

  // agua, zonas verdes, plazas y aparcamientos: cada uno con su superficie
  var trees = [], greenB = new B(), plazaB = new B(), parkB = new B(), waterB = new B();
  // un polígono grande (un río, un parque) entra si algún vértice cae en el corredor,
  // no solo su centro: el centro de un canal de 4 km puede quedar lejísimos del puente
  function landInCorridor(P0){
    if (!cor || cor.has(P0.cx, P0.cy)) return true;
    var f = P0.f, step = Math.max(1, Math.floor(f.length/2/60));
    for (var v = 0; v < f.length/2; v += step) if (cor.has(f[v*2], f[v*2+1])) return true;
    return false;
  }
  var plz = hx(lk.plaza || '#C98A68'), pitchCol = hx('#6E9F50'), prk = hx('#B3AFA8');
  if (D){
    for (var i = 0; i < D.polys.length; i++){
      var P0 = D.polys[i];
      if (P0.k === 1) continue;
      if (!landInCorridor(P0)) continue;
      var f = P0.f, t = triangulate(f), dst, col, yy, us = 0;
      if (P0.k === 2){ dst = waterB; col = wat; yy = 0.004; }
      else if (P0.k === 6){ dst = plazaB; col = plz; yy = 0.13; us = 1/4.2; }
      else if (P0.k === 4){ dst = parkB; col = prk; yy = 0.10; us = 1/2.6; }
      else { dst = greenB; col = P0.k === 5 ? pitchCol : grn; yy = 0.09; us = 1/7; }
      for (var k = 0; k < t.length; k += 3){
        var a = t[k]*2, b2 = t[k+1]*2, c2 = t[k+2]*2;
        dst.tri(f[a],yy,-f[a+1], f[b2],yy,-f[b2+1], f[c2],yy,-f[c2+1], col,
                us ? [f[a]*us, f[a+1]*us, f[b2]*us, f[b2+1]*us, f[c2]*us, f[c2+1]*us] : null);
      }
    }
  }

  // cruces: extremos de tramo que comparten tres o más tramos
  var ends = new Map();
  function ek(x, y){ return Math.round(x*2) + ',' + Math.round(y*2); }
  for (var s0 = 0; s0 < G.segs.length; s0++){
    var q0 = G.segs[s0];
    var k1 = ek(q0[0], q0[1]), k2 = ek(q0[2], q0[3]);
    ends.set(k1, (ends.get(k1) || 0) + 1); ends.set(k2, (ends.get(k2) || 0) + 1);
  }
  function isJunction(x, y){ return (ends.get(ek(x, y)) || 0) >= 3; }
  var paveB = new B();
  function bar(bx0, by0, ux, uy, nx, ny, along0, along1, lat, half, y){
    var ax = bx0 + ux*along0 + nx*lat, ay = by0 + uy*along0 + ny*lat;
    var cx = bx0 + ux*along1 + nx*lat, cy = by0 + uy*along1 + ny*lat;
    road.quad([ax+nx*half, y, -(ay+ny*half)], [cx+nx*half, y, -(cy+ny*half)],
              [cx-nx*half, y, -(cy-ny*half)], [ax-nx*half, y, -(ay-ny*half)], mk,
              [0.02,0.02, 0.05,0.02, 0.05,0.05, 0.02,0.05]);
  }

  for (var s = 0; s < G.segs.length; s++){
    var sg = G.segs[s], cls = sg[4];
    var mx = (sg[0]+sg[2])/2, my = (sg[1]+sg[3])/2;
    if (cor && !cor.has(mx, my)) continue;
    var dx = sg[2]-sg[0], dy = sg[3]-sg[1], len = Math.hypot(dx, dy);
    if (len < 0.2) continue;
    var ux = dx/len, uy = dy/len, w = A.HALF[cls];
    var nx = -uy, ny = ux;
    var ex = ux*w, ey = uy*w;
    var x0 = sg[0]-ex, y0 = sg[1]-ey, x1 = sg[2]+ex, y1 = sg[3]+ey;
    var yA = 0.015 + (8-cls)*0.004;
    var ped = cls >= 8;                       // calle peatonal: suelo de plaza, sin bordillo
    if (ped){
      plazaB.quad([x0+nx*w, 0.125, -(y0+ny*w)], [x1+nx*w, 0.125, -(y1+ny*w)],
                  [x1-nx*w, 0.125, -(y1-ny*w)], [x0-nx*w, 0.125, -(y0-ny*w)], plz,
                  [(x0+nx*w)/4.2,(y0+ny*w)/4.2, (x1+nx*w)/4.2,(y1+ny*w)/4.2,
                   (x1-nx*w)/4.2,(y1-ny*w)/4.2, (x0-nx*w)/4.2,(y0-ny*w)/4.2]);
      continue;
    }
    // calzada
    road.quad([x0+nx*w, yA, -(y0+ny*w)], [x1+nx*w, yA, -(y1+ny*w)],
              [x1-nx*w, yA, -(y1-ny*w)], [x0-nx*w, yA, -(y0-ny*w)], asf,
              [0,0, len/5,0, len/5,w/2.5, 0,w/2.5]);
    // aceras con baldosa y bordillo; en los cruces se cortan para no atravesar la otra calle
    var pw = cls <= 3 ? 3.4 : 2.4, ph = 0.15;
    var jA0 = isJunction(sg[0], sg[1]), jB0 = isJunction(sg[2], sg[3]);
    var cutA = jA0 ? Math.min(len*0.45, 7.5) : -w, cutB = jB0 ? Math.min(len*0.45, 7.5) : -w;
    var sx0 = sg[0] + ux*cutA, sy0 = sg[1] + uy*cutA, sx1 = sg[2] - ux*cutB, sy1 = sg[3] - uy*cutB;
    for (var side = -1; side <= 1 && len - Math.max(0,cutA) - Math.max(0,cutB) > 0.5; side += 2){
      var i0x = sx0 + nx*w*side, i0y = sy0 + ny*w*side;
      var i1x = sx1 + nx*w*side, i1y = sy1 + ny*w*side;
      var o0x = i0x + nx*pw*side, o0y = i0y + ny*pw*side;
      var o1x = i1x + nx*pw*side, o1y = i1y + ny*pw*side;
      paveB.quad([i0x, ph, -i0y], [i1x, ph, -i1y], [o1x, ph, -o1y], [o0x, ph, -o0y], pv,
                 [i0x/2.4, i0y/2.4, i1x/2.4, i1y/2.4, o1x/2.4, o1y/2.4, o0x/2.4, o0y/2.4]);
      flat.face(i0x, -i0y, i1x, -i1y, yA, ph, [kb[0]*0.72, kb[1]*0.72, kb[2]*0.74], kb);
    }
    var jA = isJunction(sg[0], sg[1]), jB = isJunction(sg[2], sg[3]);
    var trimA = jA ? w + 3.5 : 0, trimB = jB ? w + 3.5 : 0;
    var yM = yA + 0.012;
    // líneas de borde continuas
    if (cls <= 6 && w >= 2.6 && len - trimA - trimB > 2){
      for (var sd = -1; sd <= 1; sd += 2)
        bar(sg[0], sg[1], ux, uy, nx, ny, trimA, len - trimB, sd*(w - 0.45), 0.07, yM);
    }
    // eje discontinuo
    if (cls <= 5 && w >= 3 && len - trimA - trimB > 6){
      for (var dd = trimA + 1; dd + 3 < len - trimB; dd += 9)
        bar(sg[0], sg[1], ux, uy, nx, ny, dd, dd + 3, 0, 0.075, yM);
    }
    // pasos de cebra en los extremos que dan a un cruce
    if (cls >= 1 && cls <= 7 && len > 14){
      var zebra = function(from, dir){
        for (var lat = -w + 0.7; lat <= w - 0.6; lat += 1.1)
          bar(sg[0], sg[1], ux, uy, nx, ny, from, from + 3.2*dir, lat, 0.26, yM);
      };
      if (jA) zebra(w + 1.2, 1);
      if (jB) zebra(len - w - 1.2, -1);
    }
  }

  // ¿cae este punto encima de la calzada? (para no plantar árboles en mitad de la calle)
  function onRoad(x, y){
    var C = G.CELL, gi = Math.floor(x/C), gj = Math.floor(y/C);
    for (var i = gi-1; i <= gi+1; i++) for (var j = gj-1; j <= gj+1; j++){
      var arr = G.grid.get(i*100000 + j); if (!arr) continue;
      for (var k = 0; k < arr.length; k++){
        var g = G.segs[arr[k]], ddx = g[2]-g[0], ddy = g[3]-g[1], L2 = ddx*ddx + ddy*ddy;
        var tt = L2 > 0 ? ((x-g[0])*ddx + (y-g[1])*ddy)/L2 : 0; tt = tt < 0 ? 0 : tt > 1 ? 1 : tt;
        var qx = g[0] + ddx*tt - x, qy = g[1] + ddy*tt - y;
        if (qx*qx + qy*qy < Math.pow(A.HALF[g[4]] + 0.8, 2)) return true;
      }
    }
    return false;
  }

  // real street furniture, straight from OSM node positions
  var TCAP = MOBILE ? 650 : 1700;
  if (D && D.trees){
    for (var t3 = 0; t3 < D.trees.length/2 && trees.length/3 < TCAP; t3++){
      var tx = D.trees[t3*2], tz = D.trees[t3*2+1];
      if (cor && !cor.has(tx, tz)) continue;
      if (onRoad(tx, tz)) continue;
      var hsh = Math.abs((tx*37.1 + tz*17.7) | 0) % 100;
      trees.push(tx, tz, 0.82 + hsh/100 * 0.5);
    }
  }
  var lamps = [];
  if (D && D.lamps){
    for (var l3 = 0; l3 < D.lamps.length/2 && lamps.length/2 < 900; l3++){
      var lx = D.lamps[l3*2], lz = D.lamps[l3*2+1];
      if (cor && !cor.has(lx, lz)) continue;
      lamps.push(lx, lz);
    }
  }
  // OSM maps only a fraction of the street trees, so fill the pavements where none is mapped
  var TGRID = new Set(), TC = 13;
  for (var tg2 = 0; tg2 < trees.length/3; tg2++)
    TGRID.add(Math.floor(trees[tg2*3]/TC)*100000 + Math.floor(trees[tg2*3+1]/TC));
  function treeFree(x, y){
    var cx2 = Math.floor(x/TC), cy2 = Math.floor(y/TC);
    for (var i = -1; i <= 1; i++) for (var j = -1; j <= 1; j++)
      if (TGRID.has((cx2+i)*100000 + (cy2+j))) return false;
    return true;
  }
  for (var fs = 0; fs < G.segs.length && trees.length/3 < TCAP; fs++){
    var fg = G.segs[fs], fc = fg[4];
    if (fc < 2 || fc > 7) continue;
    var fmx = (fg[0]+fg[2])/2, fmy = (fg[1]+fg[3])/2;
    if (cor && !cor.has(fmx, fmy)) continue;
    var fdx = fg[2]-fg[0], fdy = fg[3]-fg[1], flen = Math.hypot(fdx, fdy);
    if (flen < 22) continue;
    var fux = fdx/flen, fuy = fdy/flen, fnx = -fuy, fny = fux;
    var foff = A.HALF[fc] + (fc <= 3 ? 1.7 : 1.2);
    for (var fd = 10; fd < flen - 10; fd += 14){
      for (var fsd = -1; fsd <= 1; fsd += 2){
        var px3 = fg[0] + fux*fd + fnx*foff*fsd, py3 = fg[1] + fuy*fd + fny*foff*fsd;
        var fh = Math.abs(((px3*71.3) + (py3*29.7)) | 0);
        if (fh % 10 < 5) continue;
        if (!treeFree(px3, py3) || onRoad(px3, py3)) continue;
        TGRID.add(Math.floor(px3/TC)*100000 + Math.floor(py3/TC));
        trees.push(px3, py3, 0.80 + (fh % 40)/100);
        if (trees.length/3 >= TCAP) break;
      }
      if (trees.length/3 >= TCAP) break;
    }
    if (lamps.length/2 < 380 && flen > 30){
      for (var ld = 14; ld < flen - 10; ld += 27){
        var sdl = ((ld | 0) % 2) ? 1 : -1;
        lamps.push(fg[0] + fux*ld + fnx*(A.HALF[fc]+0.9)*sdl, fg[1] + fuy*ld + fny*(A.HALF[fc]+0.9)*sdl);
      }
    }
  }

  // parked cars along the kerb of the quieter streets
  var parked = [];
  var PCAP = 480;
  // en las calles estrechas del propio circuito no se aparca: el trazado queda limpio para todos
  var onRoute = (function(){
    var RR = S.circuit, cell = new Set(); if (!RR) return function(){ return false; };
    for (var ri = 0; ri < RR.P.length / 2; ri++) cell.add(Math.round(RR.P[ri*2] / 6) + ',' + Math.round(RR.P[ri*2+1] / 6));
    for (var rd = 0; rd < RR.total; rd += 4){ var rp = A.pointAt(RR, rd); cell.add(Math.round(rp.x / 6) + ',' + Math.round(rp.y / 6)); }
    return function(x, y){ return cell.has(Math.round(x / 6) + ',' + Math.round(y / 6)); };
  })();                     // igual en móvil y ordenador: los aparcados son obstáculos y deben ser los mismos
  for (var ps = 0; ps < G.segs.length && parked.length/3 < PCAP; ps++){
    var pg = G.segs[ps], pc = pg[4];
    if (pc < 4 || pc > 7) continue;
    var pmx = (pg[0]+pg[2])/2, pmy = (pg[1]+pg[3])/2;
    if (cor && !cor.has(pmx, pmy)) continue;
    var pdx = pg[2]-pg[0], pdy = pg[3]-pg[1], plen = Math.hypot(pdx, pdy);
    if (plen < 18) continue;
    if (A.HALF[pc] < 6 && (onRoute(pmx, pmy) || onRoute(pg[0]*0.75 + pg[2]*0.25, pg[1]*0.75 + pg[3]*0.25) || onRoute(pg[0]*0.25 + pg[2]*0.75, pg[1]*0.25 + pg[3]*0.75))) continue;
    var pux = pdx/plen, puy = pdy/plen, pnx = -puy, pny = pux;
    var off = A.HALF[pc] - 1.15, head = Math.atan2(pdy, pdx);
    for (var d4 = 7; d4 < plen - 7; d4 += 5.6){
      for (var sd = -1; sd <= 1; sd += 2){
        var hh = Math.abs(((pg[0]+d4)*91.7 + (pg[1]+sd*13)*53.3) | 0);
        if (hh % 10 < 3) continue;
        parked.push(pg[0] + pux*d4 + pnx*off*sd, pg[1] + puy*d4 + pny*off*sd, head + (hh % 7 - 3) * 0.004);
        if (parked.length/3 >= PCAP) break;
      }
      if (parked.length/3 >= PCAP) break;
    }
  }

  // buildings
  var count = 0, cap = MOBILE ? 2400 : 5200, lms = landmarkList();
  var BGEN = (SK.bgen || 0) + 1;
  // detalles de fachada y azotea: balcones con barandilla, toldos en los bajos, máquinas y depósitos arriba
  var balc = [], awn = [], roofBits = [], BCAP = MOBILE ? 1400 : 4200, ACAP = MOBILE ? 500 : 1500, RCAP = MOBILE ? 700 : 2200;
  if (D){
    for (var q2 = 0; q2 < D.polys.length && count < cap; q2++){
      var Bl = D.polys[q2]; if (Bl.k !== 1) continue;
      if (cor && !cor.has(Bl.cx, Bl.cy)) continue;
      if (lms.length && hiddenByLandmark(Bl.cx, Bl.cy, lms)) continue;
      var pf = Bl.f, np = pf.length/2; if (np < 3) continue;
      Bl.r3 = BGEN;
      if (Bl.roof === 9){
        var tw = pzTower(lk.night, Math.min(80, Bl.hm || 74));
        tw.position.set(Bl.cx, 0.02, -Bl.cy);
        tw.rotation.y = Math.atan2(pf[3]-pf[1], pf[2]-pf[0]);
        tw.userData.bld = true; grp.add(tw); continue;
      }
      count++;
      var seed = Math.abs((Bl.cx*131.7 + Bl.cy*57.3) | 0);
      var vr = Math.min(5, Bl.mat || 0);
      var hgt = Math.max(4.2, Math.min(180, Bl.hm || 9.5));
      var tintArr = buildingTint(lk, vr, seed);
      var GF = Math.min(4.2, hgt * 0.45), CORN = hgt > 9 ? 0.75 : 0.35;
      var top = Math.max(GF + 0.2, hgt - CORN);
      var wallB = walls[vr], plB = plinth[vr];
      var lo = [tintArr[0]*0.82, tintArr[1]*0.82, tintArr[2]*0.84];
      var hi = [tintArr[0], tintArr[1], tintArr[2]];
      var ccx = 0, ccy = 0;
      for (var ce = 0; ce < np; ce++){ ccx += pf[ce*2]; ccy += pf[ce*2+1]; }
      ccx /= np; ccy /= np;
      for (var e = 0; e < np; e++){
        var i0 = e*2, i1 = ((e+1)%np)*2;
        var ax = pf[i0], ay = pf[i0+1], bx4 = pf[i1], by4 = pf[i1+1];
        var el = Math.hypot(bx4-ax, by4-ay);
        if (el < 0.5) continue;
        var bays = Math.max(1, Math.round(el/3.4));
        var storeys = Math.max(1, Math.round((top - GF)/3.1));
        if (el > 4.5 && hgt < 42 && !lk.night){
          var ex4 = (bx4-ax)/el, ey4 = (by4-ay)/el, onx = -ey4, ony = ex4;
          if ((ax + bx4)/2*onx + (ay + by4)/2*ony < ccx*onx + ccy*ony){ onx = -onx; ony = -ony; }   // normal hacia fuera
          var ang = Math.atan2(onx, -ony), hb = seed + e*7;      // la z local de la pieza mira hacia la calle
          var balcOn = (vr === 0 || vr === 4 || vr === 1) && (hb % 3) !== 0;
          for (var bb2 = 0; bb2 < bays; bb2++){
            var along = (bb2 + 0.5) * el / bays, bxp = ax + ex4*along, byp = ay + ey4*along;
            if (balcOn && ((bb2 + hb) % 2 === 0)){
              for (var st2 = 1; st2 < storeys && balc.length/4 < BCAP; st2++)
                balc.push(bxp + onx*0.36, byp + ony*0.36, GF + (st2 - 1)*3.1 + 0.05, ang);
            }
            if (awn.length/5 < ACAP && GF > 3 && ((hb + bb2*3) % 5 === 0))
              awn.push(bxp + onx*0.62, byp + ony*0.62, GF - 0.75, ang, (hb + bb2) % 6);
          }
        }
        plB.face(ax, -ay, bx4, -by4, 0.15, GF, lo, hi, [bays, 1]);
        if (top > GF + 0.6) wallB.face(ax, -ay, bx4, -by4, GF, top, hi, hi, [bays/BAYX, storeys/BAYY]);
        var ox = -(by4-ay)/el*0.28, oy = (bx4-ax)/el*0.28;
        var cc = [tintArr[0]*1.06, tintArr[1]*1.05, tintArr[2]*1.02];
        flat.face(ax+ox, -(ay+oy), bx4+ox, -(by4+oy), top, hgt, cc, cc);
        flat.quad([ax, hgt, -ay], [bx4, hgt, -by4], [bx4+ox, hgt, -(by4+oy)], [ax+ox, hgt, -(ay+oy)], cc);
      }
      if (!(Bl.roof > 0) && roofBits.length/5 < RCAP && np >= 4){
        var nb = 1 + (seed % 3);
        for (var rb = 0; rb < nb; rb++){
          var fx4 = ((seed >> (rb*3)) % 7 - 3) * 0.9, fy4 = ((seed >> (rb*3 + 2)) % 7 - 3) * 0.9;
          roofBits.push(ccx + fx4, ccy + fy4, hgt, (seed + rb) % 3, (seed % 90) * 0.035);
        }
      }
      roofOf(flat, pf, np, hgt, Bl.roof || 0,
             [tintArr[0]*0.58, tintArr[1]*0.55, tintArr[2]*0.52],
             [tintArr[0]*0.74, tintArr[1]*0.70, tintArr[2]*0.66]);
    }
  }

  var nBefore = grp.children.length;
  addFacadeBits(grp, balc, awn, roofBits, lk);
  for (var nb0 = nBefore; nb0 < grp.children.length; nb0++) grp.children[nb0].userData.bld = true;

  // el suelo de la ciudad: pavimento urbano, detrás de todo lo demás en profundidad
  var gm = gb.mesh({ map: TEX.pave, polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 12 });
  gm.castShadow = false; gm.userData.pave = true; grp.add(gm);
  var flatM = flat.mesh(); flatM.userData.bld = true; grp.add(flatM);
  var nLm = grp.children.length;
  addLandmarks(grp, lk);
  for (var nl0 = nLm; nl0 < grp.children.length; nl0++) grp.children[nl0].userData.bld = true;
  if (!waterB.empty()){
    var wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.BufferAttribute(waterB.p.subarray(0, waterB.i*3), 3));
    wg.setAttribute('normal', new THREE.BufferAttribute(waterB.n.subarray(0, waterB.i*3), 3));
    var wm = new THREE.Mesh(wg, new THREE.MeshPhongMaterial({
      color: new THREE.Color(lk.water), specular: lk.night ? 0x223344 : 0x9FC2DE, shininess: 60,
      side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 6 }));
    wm.receiveShadow = true; grp.add(wm);
  }
  if (!greenB.empty()) grp.add(greenB.mesh({ map: TEX.grass }));
  if (!plazaB.empty()) grp.add(plazaB.mesh({ map: TEX.plaza }));
  if (!parkB.empty()) grp.add(parkB.mesh({ map: TEX.pave }));
  if (!paveB.empty()){ var pvM = paveB.mesh({ map: TEX.pave }); pvM.userData.pave = true; grp.add(pvM); }
  var rm = road.mesh({ map: TEX.asphalt }); rm.userData.road = true; grp.add(rm);
  for (var v2 = 0; v2 < 6; v2++){
    var wOpt = { map: TEX.floor[v2] }, pOpt = { map: TEX.plinth[v2] };
    if (TEX.floorE[v2]){ wOpt.emissiveMap = TEX.floorE[v2]; wOpt.emissive = new THREE.Color(0xFFFFFF); }
    if (TEX.plinthE[v2]){ pOpt.emissiveMap = TEX.plinthE[v2]; pOpt.emissive = new THREE.Color(0xFFFFFF); }
    if (!walls[v2].empty()){ var wM = walls[v2].mesh(wOpt); wM.userData.bld = true; grp.add(wM); }
    if (!plinth[v2].empty()){ var pM = plinth[v2].mesh(pOpt); pM.userData.bld = true; grp.add(pM); }
  }
  var m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), ax = new THREE.Vector3(0,1,0),
      sc3 = new THREE.Vector3(1,1,1), pos3 = new THREE.Vector3();
  if (trees.length && PALM_CITY[S.cityId]){
    // palmeras de verdad donde las hay (Sevilla): una de cada dos, el resto árboles de sombra
    var palms = [], rest = [];
    for (var pt0 = 0; pt0 < trees.length/3; pt0++) (pt0 % 2 ? rest : palms).push(trees[pt0*3], trees[pt0*3+1], trees[pt0*3+2]);
    trees = rest;
    var pgm = palmGeometry(lk), pin = new THREE.InstancedMesh(pgm.geometry, pgm.material, palms.length/3);
    for (var pj0 = 0; pj0 < palms.length/3; pj0++){
      qt.setFromAxisAngle(ax, pj0 * 1.7); var ps0 = 0.9 + (pj0 % 5) * 0.08;
      m4.compose(pos3.set(palms[pj0*3], 0.15, -palms[pj0*3+1]), qt, sc3.set(ps0, ps0 * (1 + (pj0 % 3) * 0.12), ps0)); pin.setMatrixAt(pj0, m4);
    }
    pin.castShadow = true; pin.userData.bld = true; pin.userData.tree = true; grp.add(pin);
  }
  if (trees.length){
    var tg = treeGeometry(lk), inst = new THREE.InstancedMesh(tg.geometry, tg.material, trees.length/3);
    for (var ti = 0; ti < trees.length/3; ti++){
      var sc = trees[ti*3+2];
      qt.setFromAxisAngle(ax, (ti % 9) * 0.7);
      m4.compose(pos3.set(trees[ti*3], 0.15, -trees[ti*3+1]), qt, sc3.set(sc, sc + (ti%5)*0.05, sc));
      inst.setMatrixAt(ti, m4);
    }
    inst.castShadow = true; inst.receiveShadow = false; inst.userData.bld = true; inst.userData.tree = true;
    grp.add(inst);
  }
  LAMPS = new Float32Array(lamps);
  if (lamps.length){
    var lg = lampGeometry(lk), li = new THREE.InstancedMesh(lg.geometry, lg.material, lamps.length/2);
    for (var lj = 0; lj < lamps.length/2; lj++){
      m4.identity(); m4.setPosition(lamps[lj*2], 0.15, -lamps[lj*2+1]);
      li.setMatrixAt(lj, m4);
    }
    li.castShadow = true; grp.add(li);
  }
  if (parked.length){
    var PAINT = lk.night
      ? [0x5A5E63,0x63686D,0x6A6F75,0x5E6A72,0x70645E,0x68686C,0x5C6460]
      : [0xE4E4E2,0xB4BAC0,0x3A3F44,0xC04A36,0x345A86,0x7E8B96,0xDCC24E,0x6A7E62,0xF2F2EF,0x8C2A2A];
    var pf = carFleet(parked.length/3, PAINT, false);
    for (var pj = 0; pj < parked.length/3; pj++){
      qt.setFromAxisAngle(ax, parked[pj*3+2]);
      m4.compose(pos3.set(parked[pj*3], 0.02, -parked[pj*3+1]), qt, sc3.set(1, 1, 0.94 + (pj%5)*0.03));
      pf.set(pj, m4);
    }
    pf.done(); pf.addTo(grp);
  }
  PARKED = new Float32Array(parked);
  SK.bgen = BGEN;
  return grp;
}

// Une varias BoxGeometry (ya colocadas) en una sola geometría para instanciarla.
function mergeBoxes(list){
  var pos = [], nor = [];
  list.forEach(function(b){
    var g = new THREE.BoxGeometry(b[0], b[1], b[2]); g.translate(b[3], b[4], b[5]);
    if (b[6]) g.rotateX(b[6]);
    g = g.toNonIndexed();
    pos.push.apply(pos, g.attributes.position.array); nor.push.apply(nor, g.attributes.normal.array);
  });
  var out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return out;
}
// x = a lo largo de la fachada, z = hacia fuera, y = arriba
function addFacadeBits(grp, balc, awn, roofBits, lk){
  var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), p = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1);
  if (balc.length){
    var bg = mergeBoxes([[1.7, 0.12, 0.72, 0, 0, 0.36], [1.7, 0.05, 0.05, 0, 1.0, 0.7], [0.05, 1.0, 0.05, -0.83, 0.5, 0.7], [0.05, 1.0, 0.05, 0.83, 0.5, 0.7],
                          [0.03, 0.95, 0.03, -0.4, 0.5, 0.7], [0.03, 0.95, 0.03, 0, 0.5, 0.7], [0.03, 0.95, 0.03, 0.4, 0.5, 0.7]]);
    var bm = new THREE.InstancedMesh(bg, new THREE.MeshLambertMaterial({ color: lk.dusk ? 0x3A3230 : 0x2E3236 }), balc.length/4);
    for (var i = 0; i < balc.length/4; i++){
      q.setFromAxisAngle(up, balc[i*4+3]);
      m4.compose(p.set(balc[i*4], balc[i*4+2], -balc[i*4+1]), q, sc); bm.setMatrixAt(i, m4);
    }
    bm.castShadow = true; bm.receiveShadow = true; grp.add(bm);
  }
  if (awn.length){
    var ag = mergeBoxes([[2.4, 0.05, 1.25, 0, 0, 0, 0.32]]);
    var AC = [0xB8322A, 0x2E6B45, 0x23456E, 0xE9E1CF, 0xD98A2B, 0x6A3A5E];
    var am = new THREE.InstancedMesh(ag, new THREE.MeshLambertMaterial({ color: 0xFFFFFF }), awn.length/5);
    var cc = new THREE.Color();
    for (var j = 0; j < awn.length/5; j++){
      q.setFromAxisAngle(up, awn[j*5+3]);
      m4.compose(p.set(awn[j*5], awn[j*5+2], -awn[j*5+1]), q, sc); am.setMatrixAt(j, m4);
      if (am.setColorAt){ cc.setHex(AC[awn[j*5+4]]); am.setColorAt(j, cc); }
    }
    am.castShadow = true; grp.add(am);
  }
  if (roofBits.length){
    var kinds = [mergeBoxes([[1.2, 0.8, 0.9, 0, 0.4, 0], [0.5, 0.1, 0.5, 0, 0.85, 0]]),                 // máquina de aire
                 mergeBoxes([[1.1, 1.3, 1.1, 0, 0.95, 0], [0.12, 0.3, 0.12, -0.4, 0.15, -0.4], [0.12, 0.3, 0.12, 0.4, 0.15, 0.4], [0.12, 0.3, 0.12, -0.4, 0.15, 0.4], [0.12, 0.3, 0.12, 0.4, 0.15, -0.4]]),   // depósito
                 mergeBoxes([[0.5, 1.4, 0.5, 0, 0.7, 0]])];                                                 // chimenea
    var cols = [0xB9BCBF, 0xD8D4CC, 0x8A6A58];
    for (var k = 0; k < 3; k++){
      var idx = []; for (var r = 0; r < roofBits.length/5; r++) if (roofBits[r*5+3] === k) idx.push(r);
      if (!idx.length) continue;
      var rm = new THREE.InstancedMesh(kinds[k], new THREE.MeshLambertMaterial({ color: lk.night ? 0x3A3E44 : cols[k] }), idx.length);
      idx.forEach(function(r, n){
        q.setFromAxisAngle(up, roofBits[r*5+4]);
        m4.compose(p.set(roofBits[r*5], roofBits[r*5+2], -roofBits[r*5+1]), q, sc); rm.setMatrixAt(n, m4);
      });
      rm.castShadow = true; grp.add(rm);
    }
  }
}

// Color de fachada por edificio. El revoco en una ciudad del sur no es un solo blanco:
// hay cal, crema, albero, almagra suave. El resto de familias varía poco alrededor de su tono.
var PLASTER = ['#FFFFFF', '#FBF3E3', '#F6E2B5', '#F2D39A', '#F7E9D8', '#EFD9C2', '#FFFFFF', '#F4E6CC'];
// cada ciudad con su piedra y su color: albero en Sevilla, ladrillo en Londres, piedra crema en París…
var CITY_TINT = { sevilla: [1.07, 1.02, 0.9], madrid: [1.05, 0.95, 0.86], paris: [1.05, 1.02, 0.94], london: [0.97, 0.84, 0.77], newyork: [0.92, 0.86, 0.82], tokyo: [0.95, 0.97, 1.0] };
function buildingTint(lk, vr, seed){
  var t0 = buildingTint0(lk, vr, seed), ct = CITY_TINT[S.cityId]; if (!ct || lk.night) return t0;
  return [Math.min(1.2, t0[0] * ct[0]), Math.min(1.2, t0[1] * ct[1]), Math.min(1.2, t0[2] * ct[2])];
}
function buildingTint0(lk, vr, seed){
  var base = lk.tint[vr % lk.tint.length];
  if (lk.night) return base;
  if (vr === 0 || vr === 4){
    var c = new THREE.Color(PLASTER[seed % PLASTER.length]);
    return [base[0]*c.r, base[1]*c.g, base[2]*c.b];
  }
  var j = 0.92 + (seed % 17) / 100;
  return [base[0]*j, base[1]*j, base[2]*j];
}

// 0 flat, 1 gabled/hipped (ridge over the oriented box), 3 pyramidal/dome (apex)
function roofOf(b, pf, np, hgt, shape, dark, light){
  var tr = triangulate(pf), i;
  if (shape === 3){
    var cx = 0, cy = 0;
    for (i = 0; i < np; i++){ cx += pf[i*2]; cy += pf[i*2+1]; }
    cx /= np; cy /= np;
    var rad = 0;
    for (i = 0; i < np; i++) rad = Math.max(rad, Math.hypot(pf[i*2]-cx, pf[i*2+1]-cy));
    var apex = hgt + Math.min(9, rad * 0.85);
    for (i = 0; i < np; i++){
      var j = (i+1)%np;
      b.tri(pf[i*2], hgt, -pf[i*2+1], pf[j*2], hgt, -pf[j*2+1], cx, apex, -cy,
            (i % 2) ? dark : light);
    }
    return;
  }
  if (shape === 1 || shape === 2){
    // longest edge sets the ridge direction
    var bi = 0, bl = -1;
    for (i = 0; i < np; i++){
      var j2 = (i+1)%np, L = Math.hypot(pf[j2*2]-pf[i*2], pf[j2*2+1]-pf[i*2+1]);
      if (L > bl){ bl = L; bi = i; }
    }
    var j3 = (bi+1)%np;
    var ux = (pf[j3*2]-pf[bi*2])/bl, uy = (pf[j3*2+1]-pf[bi*2+1])/bl;
    var vx = -uy, vy = ux;
    var u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (i = 0; i < np; i++){
      var uu = pf[i*2]*ux + pf[i*2+1]*uy, vv = pf[i*2]*vx + pf[i*2+1]*vy;
      if (uu<u0)u0=uu; if (uu>u1)u1=uu; if (vv<v0)v0=vv; if (vv>v1)v1=vv;
    }
    var vm = (v0+v1)/2, rise = Math.min(7, (v1-v0)*0.45), ridge = hgt + rise;
    function P(u, v, y){ return [ux*u + vx*v, y, -(uy*u + vy*v)]; }
    b.quad(P(u0,v0,hgt), P(u1,v0,hgt), P(u1,vm,ridge), P(u0,vm,ridge), light);
    b.quad(P(u0,v1,hgt), P(u0,vm,ridge), P(u1,vm,ridge), P(u1,v1,hgt), dark);
    b.tri(P(u0,v0,hgt)[0],hgt,P(u0,v0,hgt)[2], P(u0,v1,hgt)[0],hgt,P(u0,v1,hgt)[2],
          P(u0,vm,ridge)[0],ridge,P(u0,vm,ridge)[2], dark);
    b.tri(P(u1,v0,hgt)[0],hgt,P(u1,v0,hgt)[2], P(u1,vm,ridge)[0],ridge,P(u1,vm,ridge)[2],
          P(u1,v1,hgt)[0],hgt,P(u1,v1,hgt)[2], dark);
    return;
  }
  for (i = 0; i < tr.length; i += 3){
    var ra = tr[i]*2, rb = tr[i+1]*2, rc = tr[i+2]*2;
    b.tri(pf[ra],hgt,-pf[ra+1], pf[rb],hgt,-pf[rb+1], pf[rc],hgt,-pf[rc+1], dark);
  }
}

function blob(b, cx, cy, cz, r, ry, col, col2){
  var SEG = 6, RING = 3;
  for (var j = 0; j < RING; j++){
    var p0 = Math.PI*(j/RING - 0.5), p1 = Math.PI*((j+1)/RING - 0.5);
    var y0 = cy + Math.sin(p0)*ry, y1 = cy + Math.sin(p1)*ry;
    var r0 = Math.cos(p0)*r, r1 = Math.cos(p1)*r;
    for (var i = 0; i < SEG; i++){
      var a0 = i/SEG*6.283, a1 = (i+1)/SEG*6.283;
      var c = (i + j) % 2 ? col : col2;
      b.quad([cx+Math.cos(a0)*r0, y0, cz+Math.sin(a0)*r0], [cx+Math.cos(a1)*r0, y0, cz+Math.sin(a1)*r0],
             [cx+Math.cos(a1)*r1, y1, cz+Math.sin(a1)*r1], [cx+Math.cos(a0)*r1, y1, cz+Math.sin(a0)*r1], c);
    }
  }
}
var PALM_CITY = { sevilla: 1 };
function palmGeometry(lk){
  var P = [], N = [], C = [];
  var tr = hx(lk.trunk), lf = hx(lk.leaf);
  function add(geo, m, col){
    var g = geo.index ? geo.toNonIndexed() : geo; g.applyMatrix4(m); g.computeVertexNormals();
    var pos = g.attributes.position, nor = g.attributes.normal;
    for (var i = 0; i < pos.count; i++){ P.push(pos.getX(i), pos.getY(i), pos.getZ(i)); N.push(nor.getX(i), nor.getY(i), nor.getZ(i)); C.push(col[0], col[1], col[2]); }
  }
  var M = new THREE.Matrix4();
  // tronco alto y algo curvado, anillado
  for (var s = 0; s < 6; s++){
    var cy = new THREE.CylinderGeometry(0.15 - s*0.008, 0.17 - s*0.008, 1.25, 7, 1, true);
    M.makeTranslation(Math.sin(s * 0.35) * 0.18, 0.62 + s * 1.2, 0); add(cy, M, s % 2 ? tr : [tr[0]*0.85, tr[1]*0.85, tr[2]*0.85]);
  }
  var top = new THREE.Vector3(Math.sin(5 * 0.35) * 0.18, 7.4, 0);
  // hojas: 9 palmas largas y caídas
  for (var k = 0; k < 9; k++){
    var leaf = new THREE.PlaneGeometry(3.2, 0.55, 6, 1), pa = leaf.attributes.position;
    for (var v = 0; v < pa.count; v++){ var x = pa.getX(v) + 1.6; pa.setX(v, x); pa.setY(v, pa.getY(v)); pa.setZ(v, -0.12 * x * x + 0.35 * x); }
    var R = new THREE.Matrix4().makeRotationX(-Math.PI / 2 + 0.1);
    var Y = new THREE.Matrix4().makeRotationY(k / 9 * Math.PI * 2 + (k % 2) * 0.2);
    var T = new THREE.Matrix4().makeTranslation(top.x, top.y, top.z);
    var MM = new THREE.Matrix4().multiply(T).multiply(Y).multiply(R);
    var col = k % 2 ? lf : [lf[0]*0.8, lf[1]*0.9, lf[2]*0.75];
    add(leaf, MM, col);
  }
  var g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  return { geometry: g, material: new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }) };
}
function treeGeometry(lk){
  var P = [], N = [], C = [];
  var tr = hx(lk.trunk), lf = hx(lk.leaf);
  function add(geo, sx, sy, sz, ox, oy, oz, col, round){
    var g = geo.index ? geo.toNonIndexed() : geo, pos = g.attributes.position, nor = g.attributes.normal;
    for (var i = 0; i < pos.count; i++){
      var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      var wob = round ? 1 + 0.10*Math.sin(x*6.1 + z*4.3)*Math.cos(y*5.2) : 1;
      P.push(ox + x*sx*wob, oy + y*sy*wob, oz + z*sz*wob);
      if (round){ var l = Math.hypot(x, y, z) || 1; N.push(x/l, y/l, z/l); }
      else N.push(nor.getX(i), nor.getY(i), nor.getZ(i));
      var sh = round ? 0.78 + 0.34*(y + 1)/2 : 1;
      C.push(col[0]*sh, col[1]*sh, col[2]*sh);
    }
  }
  add(new THREE.CylinderGeometry(0.13, 0.19, 2.9, 7, 1, true), 1, 1, 1, 0, 1.45, 0, tr, false);
  var ico = new THREE.IcosahedronGeometry(1, 2);
  var lf2 = [lf[0]*0.86, lf[1]*0.92, lf[2]*0.82], lf3 = [lf[0]*1.08, lf[1]*1.06, lf[2]*0.96];
  add(ico, 1.75, 1.45, 1.75, 0, 3.95, 0, lf, true);
  add(ico, 1.15, 1.00, 1.15, 0.95, 3.45, 0.55, lf2, true);
  add(ico, 1.10, 0.95, 1.10, -0.85, 3.60, -0.60, lf3, true);
  add(ico, 1.00, 0.90, 1.00, 0.20, 4.75, -0.35, lf3, true);
  var g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  return { geometry: g, material: new THREE.MeshLambertMaterial({ vertexColors: true }) };
}
function geomOf(b, opts){
  var g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(b.p.subarray(0, b.i*3), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(b.n.subarray(0, b.i*3), 3));
  g.setAttribute('color', new THREE.BufferAttribute(b.c.subarray(0, b.i*3), 3));
  var def = { vertexColors: true };
  if (opts) for (var k in opts) def[k] = opts[k];
  return { geometry: g, material: new THREE.MeshLambertMaterial(def) };
}
// globe street lamp, the kind on Sevillian streets
function lampGeometry(lk){
  var b = new B(), pole = lk.night ? [0.16,0.17,0.19] : [0.42,0.44,0.46];
  var glass = lk.night ? [1.0,0.94,0.74] : [0.90,0.91,0.90];
  for (var i = 0; i < 6; i++){
    var a0 = i/6*6.283, a1 = (i+1)/6*6.283, r = 0.09;
    b.quad([Math.cos(a0)*r, 0, Math.sin(a0)*r], [Math.cos(a1)*r, 0, Math.sin(a1)*r],
           [Math.cos(a1)*r*0.7, 4.3, Math.sin(a1)*r*0.7], [Math.cos(a0)*r*0.7, 4.3, Math.sin(a0)*r*0.7], pole);
  }
  blob(b, 0, 4.62, 0, 0.30, 0.30, glass, glass);
  return geomOf(b, lk.night ? { emissive: new THREE.Color(0xFFE7B0), emissiveIntensity: 0.9 } : null);
}
// Coche genérico en dos piezas: la carrocería toma el color de cada instancia;
// cristales, ruedas y luces no, para que un coche amarillo no tenga los cristales amarillos.
function carGeometries(){
  var body = new B(), det = new B(), W = [1,1,1];
  var glass = [0.16,0.20,0.25], tyre = [0.07,0.07,0.07], rim = [0.55,0.57,0.60], trim = [0.18,0.18,0.19];
  function box(b, x0,y0,z0,x1,y1,z1,col){
    b.quad([x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1],col);
    b.quad([x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],col);
    b.quad([x0,y0,z1],[x0,y1,z1],[x1,y1,z1],[x1,y0,z1],col);
    b.quad([x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1],col);
    b.quad([x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0],col);
  }
  // carrocería con capó y maletero algo más bajos que la cintura
  box(body, -2.12, 0.36, -0.89, 2.12, 0.78, 0.89, W);
  box(body, -1.25, 0.78, -0.86, 1.05, 0.88, 0.86, W);
  box(body, -0.80, 1.34, -0.72, 0.52, 1.40, 0.72, W);                 // techo
  // habitáculo de cristal en trapecio
  var zb = 0.84, zt = 0.72, y0 = 0.88, y1 = 1.34, xb0 = -1.18, xb1 = 1.00, xt0 = -0.80, xt1 = 0.52;
  det.quad([xb1,y0,-zb],[xb1,y0,zb],[xt1,y1,zt],[xt1,y1,-zt], glass);   // parabrisas
  det.quad([xb0,y0,zb],[xb0,y0,-zb],[xt0,y1,-zt],[xt0,y1,zt], glass);   // luna trasera
  det.quad([xb0,y0,zb],[xt0,y1,zt],[xt1,y1,zt],[xb1,y0,zb], glass);     // laterales
  det.quad([xb0,y0,-zb],[xb1,y0,-zb],[xt1,y1,-zt],[xt0,y1,-zt], glass);
  // ruedas octogonales
  [[1.36, 0.80], [1.36, -0.80], [-1.36, 0.80], [-1.36, -0.80]].forEach(function(wp){
    var cx = wp[0], cz = wp[1], r = 0.35, hw = 0.13, n = 8;
    for (var i = 0; i < n; i++){
      var a0 = i/n*6.283, a1 = (i+1)/n*6.283;
      var p0 = [cx + Math.cos(a0)*r, 0.35 + Math.sin(a0)*r], p1 = [cx + Math.cos(a1)*r, 0.35 + Math.sin(a1)*r];
      det.quad([p0[0],p0[1],cz-hw],[p1[0],p1[1],cz-hw],[p1[0],p1[1],cz+hw],[p0[0],p0[1],cz+hw], tyre);
      var zo = cz + (cz > 0 ? hw : -hw);
      det.tri(cx, 0.35, zo, p0[0], p0[1], zo, p1[0], p1[1], zo, (i % 2) ? rim : tyre);
    }
  });
  box(det, 2.10, 0.36, -0.90, 2.16, 0.50, 0.90, trim);                  // paragolpes
  box(det, -2.16, 0.36, -0.90, -2.10, 0.50, 0.90, trim);
  box(det, 2.10, 0.60, 0.46, 2.15, 0.72, 0.80, [1.0, 0.95, 0.80]);      // faros
  box(det, 2.10, 0.60, -0.80, 2.15, 0.72, -0.46, [1.0, 0.95, 0.80]);
  box(det, -2.15, 0.60, 0.50, -2.10, 0.72, 0.82, [0.75, 0.08, 0.06]);   // pilotos
  box(det, -2.15, 0.60, -0.82, -2.10, 0.72, -0.50, [0.75, 0.08, 0.06]);
  return { body: geomOf(body, { vertexColors: true }), detail: geomOf(det, { vertexColors: true }) };
}
function carFleet(n, paint, dynamic){
  var models = SK.trafficModels ? SK.trafficModels() : [];
  if (models.length >= 4) return kenneyFleet(n, models, dynamic);
  var g = carGeometries();
  var body = new THREE.InstancedMesh(g.body.geometry, g.body.material, n);
  var det = new THREE.InstancedMesh(g.detail.geometry, g.detail.material, n);
  [body, det].forEach(function(m){
    m.castShadow = true; m.receiveShadow = false;
    if (dynamic) m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  });
  for (var i = 0; i < n; i++) body.setColorAt(i, new THREE.Color(paint[i % paint.length]));
  return {
    body: body, detail: det,
    set: function(i, m){ body.setMatrixAt(i, m); det.setMatrixAt(i, m); },
    done: function(){ body.instanceMatrix.needsUpdate = true; det.instanceMatrix.needsUpdate = true; },
    addTo: function(grp){ grp.add(body); grp.add(det); }
  };
}

// tráfico y aparcados con modelos 3D de verdad: un InstancedMesh por modelo, repartidos por turnos
var HIDE4 = new THREE.Matrix4().makeScale(0, 0, 0);
function kenneyFleet(n, models, dynamic){
  var K = models.length, per = Math.ceil(n / K), mat = new THREE.MeshLambertMaterial({ map: models[0].map });
  var meshes = models.map(function(t){
    var im = new THREE.InstancedMesh(t.merged, mat, per);
    im.castShadow = true; im.receiveShadow = false;
    if (dynamic) im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (var j = 0; j < per; j++) im.setMatrixAt(j, HIDE4);
    return im;
  });
  return {
    set: function(i, m){ meshes[i % K].setMatrixAt((i / K) | 0, m); },
    done: function(){ meshes.forEach(function(im){ im.instanceMatrix.needsUpdate = true; }); },
    addTo: function(grp){ meshes.forEach(function(im){ grp.add(im); }); }
  };
}

// ---------------------------------------------------------------- route + cars
function buildRoute(){
  var R = S.circuit; if (!R) return null;
  var b = new B(), col = hx(L().trace), P = R.P, w = 0.17, y = 0.17;
  // guía discreta: trazos de 3 m cada 6 m por el centro del recorrido
  var DASH = 3.0, PERIOD = 6.0, walked = 0;
  for (var i = 0; i < P.length/2 - 1; i++){
    var ax = P[i*2], ay = P[i*2+1], bx = P[i*2+2], by = P[i*2+3];
    var dx = bx-ax, dy = by-ay, len = Math.hypot(dx, dy); if (len < 0.05) continue;
    var ux = dx/len, uy = dy/len, nx = -uy*w, ny = ux*w;
    var t = 0;
    while (t < len){
      var phase = (walked + t) % PERIOD;
      if (phase < DASH){
        var t1 = Math.min(len, t + (DASH - phase));
        var x0 = ax + ux*t, y0 = ay + uy*t, x1 = ax + ux*t1, y1 = ay + uy*t1;
        b.quad([x0+nx,y,-(y0+ny)], [x1+nx,y,-(y1+ny)], [x1-nx,y,-(y1-ny)], [x0-nx,y,-(y0-ny)], col);
        t = t1;
      } else t += PERIOD - phase;
    }
    walked += len;
  }
  var end = A.pointAt(R, R.total), nx2 = -Math.sin(end.h)*8.5, ny2 = Math.cos(end.h)*8.5;
  var fx = Math.cos(end.h)*2.2, fy = Math.sin(end.h)*2.2;
  for (var c = 0; c < 6; c++){
    var t0 = -1 + c*2/6, t1 = -1 + (c+1)*2/6;
    var sh = (c % 2) ? [0.06,0.06,0.06] : [0.95,0.95,0.95];
    b.quad([end.x+nx2*t0, 0.10, -(end.y+ny2*t0)], [end.x+nx2*t1, 0.10, -(end.y+ny2*t1)],
           [end.x+nx2*t1+fx, 0.10, -(end.y+ny2*t1+fy)], [end.x+nx2*t0+fx, 0.10, -(end.y+ny2*t0+fy)], sh);
  }
  var m = b.mesh({ transparent: true, opacity: 0.9, depthWrite: false });
  m.castShadow = false; m.receiveShadow = false;
  return m;
}

function boxM(w, h, d, color, x, y, z, shiny){
  var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color: color, emissive: shiny ? color : 0x000000,
      emissiveIntensity: shiny ? 0.55 : 0 }));
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = false;
  return m;
}
function makeCar(body, glass, alpha){
  var g = new THREE.Group();
  var b1 = boxM(4.25, 0.52, 1.86, body, 0, 0.55, 0), b2 = boxM(3.6, 0.42, 1.74, body, 0.05, 0.95, 0);
  g.add(b1); g.add(b2);
  var cabinA = boxM(1.85, 0.50, 1.56, glass, -0.22, 1.30, 0);
  var cabinB = boxM(1.30, 0.30, 1.48, 0x1A2026, 0.16, 1.34, 0);
  var wing = boxM(0.9, 0.16, 1.8, body, -2.0, 1.16, 0);
  g.add(cabinA); g.add(cabinB); g.add(wing);
  g.userData.paint = [b1.material, b2.material, wing.material];
  g.userData.cabin = [cabinA, cabinB, wing];
  g.add(boxM(1.25, 0.07, 0.16, 0x8E2410, 1.30, 1.18, 0.62));
  g.add(boxM(1.25, 0.07, 0.16, 0x8E2410, 1.30, 1.18, -0.62));
  g.add(boxM(1.05, 0.05, 0.5, 0xF06A46, 1.35, 1.18, 0));
  var wheels = [];
  [[1.32, 0.95], [1.32, -0.95], [-1.32, 0.95], [-1.32, -0.95]].forEach(function(w){
    var t = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 12),
      new THREE.MeshLambertMaterial({ color: 0x15120F }));
    t.rotation.x = Math.PI/2; t.position.set(0, 0.36, 0);
    t.castShadow = true;
    var hub = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.30, 0.52),
      new THREE.MeshLambertMaterial({ color: 0x8A8F96 }));
    hub.rotation.x = -Math.PI/2; t.add(hub);
    var holder = new THREE.Group(); holder.position.set(w[0], 0, w[1]); holder.add(t); g.add(holder); wheels.push(t);
  });
  g.userData.wheels = wheels;
  g.userData.holders = wheels.map(function(w){ return w.parent; });
  g.userData.brake = boxM(0.1, 0.16, 1.5, 0xD01A1A, -2.14, 0.78, 0, true);
  g.add(g.userData.brake);
  g.add(boxM(0.1, 0.14, 0.5, 0xFFF0D0, 2.12, 0.72, 0.58, true));
  g.add(boxM(0.1, 0.14, 0.5, 0xFFF0D0, 2.12, 0.72, -0.58, true));
  if (alpha) g.traverse(function(o){ if (o.material){ o.material.transparent = true; o.material.opacity = alpha; o.castShadow = false; } });
  return g;
}

function headlightPool(){
  var c = px(128, 128), g = c.getContext('2d');
  g.fillStyle = '#000000'; g.fillRect(0, 0, 128, 128);
  var gr = g.createLinearGradient(0, 128, 0, 0);
  gr.addColorStop(0, 'rgba(255,236,190,0.32)');
  gr.addColorStop(0.45, 'rgba(255,230,175,0.13)');
  gr.addColorStop(1, 'rgba(255,225,165,0)');
  g.fillStyle = gr;
  g.beginPath(); g.moveTo(54, 128); g.lineTo(74, 128); g.lineTo(108, 0); g.lineTo(20, 0);
  g.closePath(); g.fill();
  var t = new THREE.CanvasTexture(c);
  var m = new THREE.Mesh(new THREE.PlaneGeometry(17, 30),
    new THREE.MeshBasicMaterial({ map: t, transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, fog: true }));
  m.rotation.x = -Math.PI/2;
  m.position.set(0, 0.06, -15.5);
  return m;
}

// ---------------------------------------------------------------- monumentos
// Los que OSM no puede describir con una caja: modelo propio en su posición y orientación reales.
// Posición y giro salen de la huella de OSM (Giralda: way 310065910; Torre del Oro: way 28112279).
var LANDMARKS = {
  sevilla: [
    { id: 'giralda',   lat: 37.3861704, lon: -5.9925518, rot: 6.0, clear: 10.5, make: giralda },
    { id: 'torreoro',  lat: 37.3824026, lon: -5.9963156, rot: 4.7, clear: 9.5,  make: torreDelOro }
  ]
};
function canvasTex(w, h, paint){
  var c = px(w, h), g = c.getContext('2d'); paint(g, w, h);
  var t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t;
}
function brickNoise(g, w, h, base, amp){
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  var d = g.getImageData(0, 0, w, h), p = d.data;
  for (var i = 0; i < p.length; i += 4){ var n = (Math.random() - 0.5) * amp; p[i] += n; p[i+1] += n*0.9; p[i+2] += n*0.8; }
  g.putImageData(d, 0, 0);
  g.fillStyle = 'rgba(0,0,0,.06)';
  for (var y = 0; y < h; y += 4) g.fillRect(0, y, w, 1);
}
function arch(g, x, y, w, h, fill){
  g.fillStyle = fill; g.beginPath();
  g.moveTo(x, y + h); g.lineTo(x, y + w/2); g.arc(x + w/2, y + w/2, w/2, Math.PI, 0); g.lineTo(x + w, y + h);
  g.closePath(); g.fill();
}
function lamMat(tex, col){ return new THREE.MeshLambertMaterial({ map: tex || null, color: col || 0xFFFFFF }); }
function part(geo, mat, y, grp){ var m = new THREE.Mesh(geo, mat); m.position.y = y; m.castShadow = true; m.receiveShadow = true; grp.add(m); return m; }

// La Giralda: fuste almohade de ladrillo con paños de sebka, campanario renacentista,
// cuerpos del reloj, estrellas y azucenas, cupulín y el Giraldillo. 97 m hasta la veleta.
function giralda(night){
  var grp = new THREE.Group();
  var brick = night ? '#5A4636' : '#C88E5E', cream = night ? '#6E665A' : '#EEE0C2', dark = night ? '#1A1512' : '#3A2A20';
  var shaftTex = canvasTex(256, 1024, function(g, w, h){
    brickNoise(g, w, h, brick, 26);
    // ajimeces centrales: ventanas geminadas cada ~6 m
    for (var k = 0; k < 7; k++){
      var yy = 110 + k * 130;
      arch(g, w/2 - 22, yy, 20, 44, dark); arch(g, w/2 + 2, yy, 20, 44, dark);
      g.fillStyle = 'rgba(255,240,215,.35)'; g.fillRect(w/2 - 26, yy - 6, 52, 3);
    }
    // paños de sebka (rombos en relieve) en el tercio alto, a los dos lados
    function sebka(x0, y0, pw, ph){
      g.strokeStyle = 'rgba(70,40,20,.55)'; g.lineWidth = 3;
      for (var r = 0; r < ph; r += 24) for (var q = 0; q < pw; q += 24){
        g.beginPath(); g.moveTo(x0+q+12, y0+r); g.lineTo(x0+q+24, y0+r+12); g.lineTo(x0+q+12, y0+r+24); g.lineTo(x0+q, y0+r+12); g.closePath(); g.stroke();
      }
      g.strokeStyle = 'rgba(255,230,190,.25)'; g.lineWidth = 1; g.strokeRect(x0, y0, pw, ph);
    }
    sebka(18, 90, 60, 330); sebka(w - 78, 90, 60, 330);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 0, w, 10);
  });
  var bellTex = canvasTex(256, 256, function(g, w, h){
    brickNoise(g, w, h, cream, 12);
    arch(g, 38, 40, 76, 180, dark); arch(g, 142, 40, 76, 180, dark);
    g.fillStyle = night ? '#6A5A30' : '#8E6E2E'; g.beginPath(); g.arc(76, 120, 16, 0, Math.PI*2); g.arc(180, 120, 16, 0, Math.PI*2); g.fill();
    g.fillStyle = 'rgba(160,90,50,.55)'; g.fillRect(0, 0, w, 14); g.fillRect(0, h-14, w, 14);
  });
  var bandTex = canvasTex(256, 128, function(g, w, h){
    brickNoise(g, w, h, cream, 10);
    for (var i = 0; i < 4; i++) arch(g, 18 + i*58, 30, 34, 76, dark);
    g.fillStyle = 'rgba(170,100,55,.6)'; g.fillRect(0, 0, w, 10);
  });
  var mShaft = lamMat(shaftTex), mBell = lamMat(bellTex), mBand = lamMat(bandTex);
  var mCream = lamMat(null, new THREE.Color(cream)), mBronze = new THREE.MeshLambertMaterial({ color: night ? 0x3A3020 : 0x8A6A2A });
  var mTile = new THREE.MeshLambertMaterial({ color: night ? 0x2E3A2E : 0x5E8A6A });
  // fuste 0-51 m y remate de merlones
  part(new THREE.BoxGeometry(13.6, 51, 13.6), [mShaft, mShaft, mCream, mCream, mShaft, mShaft], 25.5, grp);
  for (var i = 0; i < 16; i++){
    var side = i / 4 | 0, k = i % 4, off = -5.1 + k * 3.4;
    var mx = side === 0 ? off : side === 1 ? 6.4 : side === 2 ? -off : -6.4;
    var mz = side === 0 ? 6.4 : side === 1 ? off : side === 2 ? -6.4 : -off;
    var mer = part(new THREE.BoxGeometry(1.2, 1.4, 1.2), mCream, 51.7, grp); mer.position.x = mx; mer.position.z = mz;
  }
  // campanario 51-64, reloj 64-71, estrellas 71-78, azucenas 78-84, cupulín y Giraldillo
  part(new THREE.BoxGeometry(11.6, 13, 11.6), [mBell, mBell, mCream, mCream, mBell, mBell], 57.5, grp);
  part(new THREE.BoxGeometry(12.4, 0.8, 12.4), mCream, 64.4, grp);
  part(new THREE.BoxGeometry(9.2, 7, 9.2), [mBand, mBand, mCream, mCream, mBand, mBand], 68.3, grp);
  part(new THREE.BoxGeometry(7.4, 6.4, 7.4), [mBand, mBand, mCream, mCream, mBand, mBand], 75, grp);
  part(new THREE.CylinderGeometry(2.9, 3.3, 6, 8), mBand, 81.2, grp);
  part(new THREE.SphereGeometry(2.9, 16, 8, 0, Math.PI*2, 0, Math.PI/2), mTile, 84.2, grp);
  part(new THREE.CylinderGeometry(0.18, 0.25, 6, 6), mBronze, 89.5, grp);
  var fig = part(new THREE.CylinderGeometry(0.35, 0.6, 3.2, 6), mBronze, 93.5, grp);
  var shield = part(new THREE.BoxGeometry(0.15, 2.2, 2.6), mBronze, 94, grp); shield.position.x = 0.7;
  return grp;
}

// Torre del Oro: dodecágono almohade de sillería dorada (0-17 m), segundo cuerpo (17-25 m),
// linterna cilíndrica (25-31 m) y cúpula de azulejo dorado.
function torreDelOro(night){
  var grp = new THREE.Group();
  var gold = night ? '#5E5236' : '#D8B478', cream = night ? '#6A6250' : '#EBDDB9', dark = night ? '#15120E' : '#3A2E22';
  var stoneTex = canvasTex(512, 256, function(g, w, h){
    brickNoise(g, w, h, gold, 22);
    g.strokeStyle = 'rgba(90,60,30,.28)'; g.lineWidth = 1.5;
    for (var y = 0; y < h; y += 16){ g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
      for (var x = (y/16 % 2) * 20; x < w; x += 40){ g.beginPath(); g.moveTo(x, y); g.lineTo(x, y+16); g.stroke(); } }
    for (var i = 0; i < 6; i++) arch(g, 30 + i * 84, 120, 14, 34, dark);   // saeteras
  });
  var upTex = canvasTex(512, 128, function(g, w, h){
    brickNoise(g, w, h, cream, 14);
    for (var i = 0; i < 6; i++) arch(g, 26 + i * 84, 28, 34, 80, dark);
    g.fillStyle = 'rgba(180,120,60,.45)'; g.fillRect(0, 0, w, 8);
  });
  stoneTex.wrapS = upTex.wrapS = THREE.RepeatWrapping; stoneTex.repeat.set(2, 1); upTex.repeat.set(2, 1);
  var mStone = lamMat(stoneTex), mUp = lamMat(upTex), mCream = lamMat(null, new THREE.Color(cream));
  var mGold = new THREE.MeshPhongMaterial({ color: night ? 0x6A5520 : 0xE3B23C, specular: 0xFFE7A0, shininess: 40 });
  function crenels(r, y, n){
    for (var i = 0; i < n; i++){
      var a = (i + 0.5) / n * Math.PI * 2;
      var m = part(new THREE.BoxGeometry(1.1, 1.3, 0.8), mCream, y, grp);
      m.position.x = Math.cos(a) * r; m.position.z = Math.sin(a) * r; m.rotation.y = -a;
    }
  }
  part(new THREE.CylinderGeometry(7.9, 8.1, 17, 12, 1), mStone, 8.5, grp);
  part(new THREE.CylinderGeometry(8.3, 8.3, 0.6, 12), mCream, 17.2, grp);
  crenels(7.7, 18.1, 24);
  part(new THREE.CylinderGeometry(4.8, 5.0, 8, 12, 1), mUp, 21.5, grp);
  crenels(4.7, 26.1, 12);
  part(new THREE.CylinderGeometry(2.5, 2.6, 6, 12, 1), mUp, 28.5, grp);
  part(new THREE.SphereGeometry(2.7, 18, 9, 0, Math.PI*2, 0, Math.PI/2), mGold, 31.4, grp);
  part(new THREE.CylinderGeometry(0.12, 0.12, 2.2, 6), mGold, 35, grp);
  var ball = part(new THREE.SphereGeometry(0.35, 10, 8), mGold, 36.2, grp);
  return grp;
}

// Torres de la Plaza de España (Aníbal González): fuste de ladrillo con esquinas de piedra,
// dos cuerpos de campanas y chapitel. La posición sale de la huella real del edificio.
function pzTower(night, H){
  var grp = new THREE.Group();
  var brick = night ? '#4E3428' : '#B8663F', stone = night ? '#6A6254' : '#E8DCC0', dark = night ? '#140F0C' : '#2E231C';
  var sH = H * 0.62;
  var shaftTex = canvasTex(256, 1024, function(g, w, h){
    brickNoise(g, w, h, brick, 24);
    g.fillStyle = stone; g.fillRect(0, 0, 16, h); g.fillRect(w - 16, 0, 16, h);
    for (var k = 0; k < 9; k++){ var yy = 70 + k * 105; arch(g, w/2 - 16, yy, 32, 60, dark); g.fillStyle = stone; g.fillRect(w/2 - 22, yy + 60, 44, 6); }
  });
  var bellTex = canvasTex(256, 256, function(g, w, h){
    brickNoise(g, w, h, stone, 10);
    arch(g, 54, 46, 64, 160, dark); arch(g, 138, 46, 64, 160, dark);
    g.fillStyle = 'rgba(180,110,60,.5)'; g.fillRect(0, 0, w, 12); g.fillRect(0, h - 12, w, 12);
  });
  var mS = lamMat(shaftTex), mB = lamMat(bellTex), mSt = lamMat(null, new THREE.Color(stone));
  var mRoof = new THREE.MeshLambertMaterial({ color: night ? 0x2A3A34 : 0x4E7E6A });
  part(new THREE.BoxGeometry(9.6, sH, 9.6), [mS, mS, mSt, mSt, mS, mS], sH/2, grp);
  part(new THREE.BoxGeometry(10.6, 0.9, 10.6), mSt, sH + 0.45, grp);
  var b1 = H * 0.14, b2 = H * 0.09;
  part(new THREE.BoxGeometry(8.2, b1, 8.2), [mB, mB, mSt, mSt, mB, mB], sH + 0.9 + b1/2, grp);
  part(new THREE.CylinderGeometry(3.2, 3.8, b2, 8), mB, sH + 0.9 + b1 + b2/2, grp);
  var top = sH + 0.9 + b1 + b2;
  part(new THREE.SphereGeometry(3.3, 16, 8, 0, Math.PI*2, 0, Math.PI/2), mRoof, top, grp);
  part(new THREE.ConeGeometry(0.9, Math.max(2, H - top - 3.3), 8), mRoof, top + 3.3 + Math.max(2, H - top - 3.3)/2 - 0.5, grp);
  return grp;
}
function landmarkList(){
  var L = LANDMARKS[S.cityId]; if (!L) return [];
  var d = A.CITIES[S.cityId]; if (!d) return [];
  var clat = d.c[0], clon = d.c[1], MLON = 111320 * Math.cos(clat * Math.PI/180);
  return L.map(function(m){ return { m: m, x: (m.lon - clon) * MLON, y: (m.lat - clat) * 111320 }; });
}
function addLandmarks(grp, lk){
  landmarkList().forEach(function(p){
    var g = p.m.make(lk.night);
    g.position.set(p.x, 0.02, -p.y);
    g.rotation.y = p.m.rot * Math.PI / 180;
    grp.add(g);
  });
}
function hiddenByLandmark(cx, cy, lms){
  for (var i = 0; i < lms.length; i++){
    var dx = cx - lms[i].x, dy = cy - lms[i].y;
    if (dx*dx + dy*dy < lms[i].m.clear * lms[i].m.clear) return true;
  }
  return false;
}

// ---------------------------------------------------------------- vida: tráfico y peatones
// Coches que circulan por su carril siguiendo el callejero y gente por las aceras.
// Es decorado: nunca frena ni empuja al jugador, así los tiempos siguen siendo limpios.
// Si un coche del tráfico se le cruza muy cerca, se aparta de la escena y reaparece en otra calle.
var LIFE = null, PARKED = null, SOLID = [], LAMPS = null;
SK.lampsXY = function(){ return LAMPS; };
var LEFT_HAND = { london: 1, tokyo: 1 };
function junctionEnds(G){
  var m = new Map(), k = function(x, y){ return Math.round(x*2) + ',' + Math.round(y*2); };
  for (var i = 0; i < G.segs.length; i++){
    var g = G.segs[i], a = k(g[0], g[1]), b = k(g[2], g[3]);
    m.set(a, (m.get(a) || 0) + 1); m.set(b, (m.get(b) || 0) + 1);
  }
  return function(x, y){ return (m.get(k(x, y)) || 0) >= 3; };
}
function buildLife(lk){
  var G = S.G, segs = G.segs, cor = corridor(), isJ = junctionEnds(G);
  var nodes = new Map(), drive = [], walk = [];
  function ek(x, y){ return Math.round(x*2) + ',' + Math.round(y*2); }
  for (var i = 0; i < segs.length; i++){
    var g = segs[i], cls = g[4], len = Math.hypot(g[2]-g[0], g[3]-g[1]);
    if (len < 1.5) continue;
    if (cor && !cor.has((g[0]+g[2])/2, (g[1]+g[3])/2)) continue;
    if (cls >= 1 && cls <= 7){
      drive.push(i);
      var ka = ek(g[0], g[1]), kb = ek(g[2], g[3]);
      if (!nodes.has(ka)) nodes.set(ka, []); nodes.get(ka).push([i, 0]);
      if (!nodes.has(kb)) nodes.set(kb, []); nodes.get(kb).push([i, 1]);
    }
    if (cls >= 3 && len > 6) walk.push(i);
  }
  var NC = MOBILE ? 26 : 64, NP = MOBILE ? 60 : 170;
  var PAINT = lk.night
    ? [0x5A5E63, 0x63686D, 0x6A6F75, 0x5E6A72, 0x70645E, 0x68686C]
    : [0xEDEDEA, 0xBFC3C8, 0x3A3F44, 0xC23E2C, 0x3A5E8C, 0x7E8B96, 0xE0C650, 0x5E7A62, 0xF4F4F1, 0x2A2E33];
  var cars = carFleet(NC, PAINT, true);
  var pg = personGeometry(lk), people = new THREE.InstancedMesh(pg.geometry, pg.material, NP);
  people.castShadow = true; people.receiveShadow = false;
  people.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  var lgm = legGeometry(lk), legs = new THREE.InstancedMesh(lgm.geometry, lgm.material, NP * 2);
  legs.instanceMatrix.setUsage(THREE.DynamicDrawUsage); legs.castShadow = true;
  var SHIRT = lk.night
    ? [0x3A3A40, 0x2F343C, 0x40383A, 0x2E3A34]
    : [0xE2E2DE, 0x2F4F7A, 0xB84A3A, 0x3C6E4E, 0xD9B84A, 0x5A4A6E, 0x1E2226, 0xC77A9A, 0x8FB3D1, 0xE87B2E];
  for (var q = 0; q < NP; q++) people.setColorAt(q, new THREE.Color(SHIRT[(q*7) % SHIRT.length]));
  var side = LEFT_HAND[S.cityId] ? -1 : 1;
  LIFE = { nodes: nodes, drive: drive, walk: walk, ek: ek, side: side, isJ: isJ,
           cars: cars, people: people, legs: legs, cs: [], ps: [], hide: new THREE.Matrix4().makeScale(0, 0, 0) };
  for (var a = 0; a < NC; a++) LIFE.cs.push({ on: false });
  for (var b = 0; b < NP; b++) LIFE.ps.push({ on: false });
  return LIFE;
}
function legGeometry(lk){
  var g = new THREE.CylinderGeometry(0.075, 0.06, 0.88, 6); g.translate(0, -0.44, 0);
  return { geometry: g, material: new THREE.MeshLambertMaterial({ color: lk.night ? 0x1E2126 : 0x333842 }) };
}
function personGeometry(lk){
  var P = [], N = [], C = [];
  var skin = lk.night ? [0.35,0.30,0.27] : [0.86,0.70,0.58], legs = lk.night ? [0.12,0.13,0.15] : [0.20,0.22,0.27];
  function add(geo, sx, sy, sz, ox, oy, oz, col){
    var g = geo.index ? geo.toNonIndexed() : geo, pos = g.attributes.position, nor = g.attributes.normal;
    for (var i = 0; i < pos.count; i++){
      P.push(ox + pos.getX(i)*sx, oy + pos.getY(i)*sy, oz + pos.getZ(i)*sz);
      N.push(nor.getX(i), nor.getY(i), nor.getZ(i));
      C.push(col[0], col[1], col[2]);
    }
  }
  // camiseta en blanco: el color de cada persona va por instancia y multiplica este
  add(new THREE.CylinderGeometry(0.19, 0.16, 0.66, 8), 1, 1, 1, 0, 1.23, 0, [1, 1, 1]);
  // (las piernas van aparte para poder andar)
  add(new THREE.SphereGeometry(0.12, 10, 8), 1, 1.1, 1, 0, 1.70, 0, skin);
  var g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  return { geometry: g, material: new THREE.MeshLambertMaterial({ vertexColors: true }) };
}
function spawnCar(o, px, py, near){
  var L = LIFE, tries = 0;
  while (tries++ < 30){
    var si = L.drive[(Math.random() * L.drive.length) | 0], g = S.G.segs[si];
    var mx = (g[0]+g[2])/2 - px, my = (g[1]+g[3])/2 - py, d2 = mx*mx + my*my;
    if (d2 > 260*260 || d2 < (near ? 0 : 45*45)) continue;
    o.on = true; o.seg = si; o.dir = Math.random() < 0.5 ? 1 : -1;
    o.len = Math.hypot(g[2]-g[0], g[3]-g[1]); o.t = Math.random() * o.len;
    o.v = o.max = 8 + Math.random() * 6; return true;
  }
  o.on = false; return false;
}
function nextSeg(o){
  var L = LIFE, g = S.G.segs[o.seg];
  var ex = o.dir > 0 ? g[2] : g[0], ey = o.dir > 0 ? g[3] : g[1];
  var ux = (g[2]-g[0]) / o.len * o.dir, uy = (g[3]-g[1]) / o.len * o.dir;
  var opts = (L.nodes.get(L.ek(ex, ey)) || []).filter(function(p){ return p[0] !== o.seg; });
  if (!opts.length){ o.dir = -o.dir; o.t = 0; return; }       // calle sin salida: media vuelta
  var best = null, bestScore = -1e9;
  opts.forEach(function(p){
    var h = S.G.segs[p[0]], L2 = Math.hypot(h[2]-h[0], h[3]-h[1]) || 1;
    var d = p[1] === 0 ? 1 : -1, vx = (h[2]-h[0]) / L2 * d, vy = (h[3]-h[1]) / L2 * d;
    var score = (ux*vx + uy*vy) + Math.random() * 1.3;           // casi siempre sigue recto
    if (score > bestScore){ bestScore = score; best = [p[0], d, L2]; }
  });
  o.seg = best[0]; o.dir = best[1]; o.len = best[2]; o.t = 0;
}
function spawnPerson(o, px, py){
  var L = LIFE, tries = 0;
  while (tries++ < 30){
    var si = L.walk[(Math.random() * L.walk.length) | 0], g = S.G.segs[si];
    var mx = (g[0]+g[2])/2 - px, my = (g[1]+g[3])/2 - py;
    if (mx*mx + my*my > 200*200) continue;
    var len = Math.hypot(g[2]-g[0], g[3]-g[1]), cls = g[4];
    var t0 = L.isJ(g[0], g[1]) ? Math.min(len*0.45, 8) : 0, t1 = len - (L.isJ(g[2], g[3]) ? Math.min(len*0.45, 8) : 0);
    if (t1 - t0 < 3) continue;
    o.on = true; o.seg = si; o.len = len; o.t0 = t0; o.t1 = t1; o.t = t0 + Math.random() * (t1 - t0);
    o.dir = Math.random() < 0.5 ? 1 : -1;
    o.lat = cls >= 8 ? (Math.random()*2 - 1) * A.HALF[cls] * 0.8
                     : (Math.random() < 0.5 ? -1 : 1) * (A.HALF[cls] + (cls <= 3 ? 1.7 : 1.2) + (Math.random()-0.5)*0.8);
    o.v = 1.0 + Math.random() * 0.6; o.ph = Math.random() * 6.28;
    return true;
  }
  o.on = false; return false;
}
var lifeM = null, lifeQ = null, lifeV = null, lifeS = null, lifeAx = null, lifeQ2 = null, lifeQ3 = null, lifeZ = null;
function stepLife(dt){
  var L = LIFE; if (!L) return;
  if (!lifeM){ lifeM = new THREE.Matrix4(); lifeQ = new THREE.Quaternion(); lifeV = new THREE.Vector3();
               lifeS = new THREE.Vector3(1, 1, 1); lifeAx = new THREE.Vector3(0, 1, 0); lifeQ2 = new THREE.Quaternion(); lifeQ3 = new THREE.Quaternion(); lifeZ = new THREE.Vector3(0, 0, 1); }
  var car = S.car, px = car.x, py = car.y, running = S.phase === 'run' || S.phase === 'done';
  SOLID.length = 0;
  if (PARKED) for (var pk = 0; pk < PARKED.length; pk += 3){
    var qx0 = PARKED[pk] - px, qy0 = PARKED[pk+1] - py;
    if (qx0*qx0 + qy0*qy0 < 40*40) SOLID.push(PARKED[pk], PARKED[pk+1], PARKED[pk+2], -1 - pk/3);
  }
  for (var i = 0; i < L.cs.length; i++){
    var o = L.cs[i];
    if (!o.on){ if (!spawnCar(o, px, py, !running)) { L.cars.set(i, L.hide); continue; } }
    var g = S.G.segs[o.seg];
    var ux = (g[2]-g[0]) / o.len * o.dir, uy = (g[3]-g[1]) / o.len * o.dir;
    var sx = o.dir > 0 ? g[0] : g[2], sy = o.dir > 0 ? g[1] : g[3];
    var lane = A.HALF[g[4]] * 0.48 * L.side;
    var x = sx + ux*o.t + uy*lane, y = sy + uy*o.t - ux*lane;
    var dx = x - px, dy = y - py, d2 = dx*dx + dy*dy;
    // si el jugador está delante en su carril, frena; si se le echa encima, se aparta
    var ahead = dx*(-ux) + dy*(-uy);
    if (d2 > 320*320){ o.on = false; L.cars.set(i, L.hide); continue; }
    var want = (ahead > 0 && ahead < 16 && Math.abs(dx*uy - dy*ux) < 2.2) ? 0 : o.max;
    // semáforo en rojo (o ámbar cerca) delante: se para en la línea
    if (SK.signalAhead){ var sg = SK.signalAhead(x, y, ux, uy); if (sg && (sg.state === 0 || (sg.state === 1 && sg.d > 8))) want = Math.min(want, Math.max(0, (sg.d - 6) * 0.9)); }
    if (o.stun > 0){ o.stun -= dt; want = 0; }
    o.v += (want - o.v) * Math.min(1, dt * (want < o.v ? 3 : 0.8));
    o.t += o.v * dt;
    o.x = x; o.y = y; o.h = Math.atan2(uy, ux);
    if (d2 < 40*40) SOLID.push(x, y, o.h, i);
    if (o.t >= o.len){ var over = o.t - o.len; nextSeg(o); o.t = Math.min(over, o.len); }
    lifeQ.setFromAxisAngle(lifeAx, Math.atan2(uy, ux));
    lifeM.compose(lifeV.set(x, 0.02, -y), lifeQ, lifeS.set(1, 1, 1));
    L.cars.set(i, lifeM);
  }
  L.cars.done();
  for (var j = 0; j < L.ps.length; j++){
    var p = L.ps[j];
    if (!p.on){ if (!spawnPerson(p, px, py)){ L.people.setMatrixAt(j, L.hide); L.legs.setMatrixAt(j*2, L.hide); L.legs.setMatrixAt(j*2+1, L.hide); continue; } }
    var h = S.G.segs[p.seg];
    p.t += p.v * dt * p.dir;
    if (p.t < p.t0 || p.t > p.t1){ p.dir = -p.dir; p.t = Math.max(p.t0, Math.min(p.t1, p.t)); }
    var vx = (h[2]-h[0]) / p.len, vy = (h[3]-h[1]) / p.len;
    // si el coche se les echa encima, se apartan de un salto (nadie sale herido)
    var X0 = h[0] + vx*p.t + vy*p.lat, Y0 = h[1] + vy*p.t - vx*p.lat, cdx = X0 - px, cdy = Y0 - py;
    if (car.speed > 2.5 && cdx*cdx + cdy*cdy < 49){
      var sgn = (cdx*vy - cdy*vx) * 1 >= 0 ? 1 : -1;
      p.dodge = (p.dodge || 0) + sgn * dt * 9; p.dodge = Math.max(-4.5, Math.min(4.5, p.dodge)); p.scared = 1.5;
    } else if (p.scared > 0){ p.scared -= dt; } else if (p.dodge){ p.dodge *= Math.exp(-dt * 0.8); if (Math.abs(p.dodge) < 0.05) p.dodge = 0; }
    var lat2 = p.lat + (p.dodge || 0);
    var X = h[0] + vx*p.t + vy*lat2, Y = h[1] + vy*p.t - vx*lat2;
    var qx = X - px, qy = Y - py;
    if (qx*qx + qy*qy > 240*240){ p.on = false; L.people.setMatrixAt(j, L.hide); L.legs.setMatrixAt(j*2, L.hide); L.legs.setMatrixAt(j*2+1, L.hide); continue; }
    p.ph += dt * p.v * 5.5 * (p.scared > 0 ? 3 : 1);
    var bob = Math.abs(Math.sin(p.ph)) * 0.04;
    lifeQ.setFromAxisAngle(lifeAx, Math.atan2(vy*p.dir, vx*p.dir));
    lifeM.compose(lifeV.set(X, 0.15 + bob, -Y), lifeQ, lifeS.set(1, 1, 1));
    L.people.setMatrixAt(j, lifeM);
    // piernas: cada una oscila desde la cadera, en contrafase
    var yaw = Math.atan2(vy*p.dir, vx*p.dir), swing = Math.sin(p.ph) * 0.5, sx2 = Math.sin(yaw), cx2 = Math.cos(yaw);
    for (var lg = 0; lg < 2; lg++){
      var sd2 = lg ? 1 : -1, ox2 = -sx2 * 0.1 * sd2, oz2 = -cx2 * 0.1 * sd2;
      lifeQ2.setFromAxisAngle(lifeAx, yaw); lifeQ3.setFromAxisAngle(lifeZ, swing * sd2); lifeQ2.multiply(lifeQ3);
      lifeM.compose(lifeV.set(X + ox2, 0.15 + 0.9 + bob, -Y + oz2), lifeQ2, lifeS.set(1, 1, 1));
      L.legs.setMatrixAt(j*2 + lg, lifeM);
    }
  }
  L.people.instanceMatrix.needsUpdate = true; L.legs.instanceMatrix.needsUpdate = true;
}

SK.solidCars = function(){ return SOLID; };
SK.traffic = function(){ return LIFE ? LIFE.cs : []; };
SK.composer3d = function(){ return composer; };
SK.bumpCar = function(id, ix, iy){
  if (id >= 0 && LIFE && LIFE.cs[id]){ var o = LIFE.cs[id]; o.v = 0; o.stun = 2.5; }
};

// ---------------------------------------------------------------- lifecycle
function ensure(){
  if (failed) return false;
  if (!renderer){
    try { renderer = new THREE.WebGLRenderer({ canvas: gl, antialias: !MOBILE, powerPreference: 'high-performance' }); }
    catch(e){ failed = true; return false; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MOBILE ? 1.6 : 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    applyGfx();
    cam = new THREE.PerspectiveCamera(60, 1, 0.18, 2200);
    ghostGrp = makeCar(0xE8B93F, 0x2A2416, 0.42); ghostGrp.visible = false;
  }
  var wantKind = SK.carId ? SK.carId(S.carKind || 'sedan') : (S.carKind || 'hatch');
  if (!carGrp || carGrp.userData.kind !== wantKind || (!carGrp.userData.kenney && SK.carReady && SK.carReady(wantKind))){
    if (carGrp && carGrp.parent) carGrp.parent.remove(carGrp);
    carGrp = SK.buildCar ? SK.buildCar(wantKind, null) : makeCar(0xE23A16, 0x20262C);
    carGrp.userData.kind = wantKind;
    glossCar(carGrp); paintedWith = null;
    if (SK.decorateCar) try { SK.decorateCar(carGrp); } catch(e){ console.warn(e); }
  }
  var pkey = wantKind + '|' + (S.paint || '') + '|' + !!carGrp.userData.kenney;
  if (pkey !== paintedWith){
    if (carGrp.userData.kenney){ if (S.paint) SK.setCarPaint(carGrp, S.paint); else SK.resetCarPaint(carGrp); }
    else {
      var cdef = SK.carById ? SK.carById(wantKind).paint : null;
      var col = new THREE.Color(S.paint || cdef || '#E23A16');
      carGrp.userData.paint.forEach(function(m){ m.color.copy(col); });
    }
    paintedWith = pkey;
  }
  var key = S.cityId + '|' + S.skin + '|' + (S.decor ? 'd' : 'n') + '|' + (S.routeId || '') + '|' + (SK.trafficReady && SK.trafficReady() ? 'k' : 'b');
  if (builtFor !== key){
    var lk = L();
    if (scene){
      if (city){ scene.remove(city); city.traverse(function(o){ if (o.geometry) o.geometry.dispose(); }); }
      if (routeMesh){ scene.remove(routeMesh); routeMesh.geometry.dispose(); routeMesh = null; }
    }
    scene = new THREE.Scene();
    scene.background = new THREE.Color(lk.skyLow);
    scene.fog = new THREE.Fog(new THREE.Color(lk.fog), lk.fogNear, lk.fogFar);

    // sky dome
    var sg = new THREE.SphereGeometry(1600, 22, 14);
    var top = new THREE.Color(lk.skyTop), low = new THREE.Color(lk.skyLow);
    var pos = sg.attributes.position, cols = new Float32Array(pos.count*3);
    for (var v = 0; v < pos.count; v++){
      var t = Math.max(0, Math.min(1, Math.pow(Math.max(0, pos.getY(v)/1600), 0.55)));
      cols[v*3] = low.r + (top.r-low.r)*t;
      cols[v*3+1] = low.g + (top.g-low.g)*t;
      cols[v*3+2] = low.b + (top.b-low.b)*t;
    }
    sg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    skyMesh = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors:true, side:THREE.BackSide, fog:false, depthWrite:false }));
    skyMesh.renderOrder = -1;
    addSkyDressing(skyMesh, lk);
    scene.add(skyMesh);

    hemi = new THREE.HemisphereLight(lk.ambSky, lk.ambGround, lk.ambI);
    scene.add(hemi);
    sun = new THREE.DirectionalLight(lk.sun, lk.sunI);
    sun.castShadow = true;
    var sm = MOBILE ? 1024 : 2048;
    sun.shadow.mapSize.set(sm, sm);
    var ext = 110;
    sun.shadow.camera.left = -ext; sun.shadow.camera.right = ext;
    sun.shadow.camera.top = ext; sun.shadow.camera.bottom = -ext;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 760;
    sun.shadow.bias = -0.0009; sun.shadow.normalBias = 0.5;
    scene.add(sun); scene.add(sun.target);

    city = buildCity();
    var life = buildLife(lk);
    life.cars.addTo(city); city.add(life.people); city.add(life.legs);
    scene.add(city);
    if (beam){ scene.remove(beam); }
    beam = headlightPool();
    beam.visible = lk.night;
    scene.add(beam);
    scene.add(ghostGrp);
    routeMesh = buildRoute();
    if (routeMesh) scene.add(routeMesh);
    builtFor = key;
    if (SK.onCity3d) try { SK.onCity3d({ scene: scene, city: city, route: routeMesh, lk: lk, sun: sun, hemi: hemi, renderer: renderer, cam: cam }); } catch(e){ console.warn(e); }
  }
  if (carGrp.parent !== scene) scene.add(carGrp);
  return true;
}

var smooth = null, roll = 0, pitch = 0, spin = 0, pending = false, paintedWith, camH = null, lift = 0;

// ---------------------------------------------------------------- calidad gráfica y brillo (bloom)
var GFX = (function(){ try { return localStorage.getItem('sk_gfx'); } catch(e){ return null; } })() || (MOBILE ? 'medio' : 'alto');
var composer = null, rpass = null, bloom = null, fpsWin = { t: 0, n: 0, low: 0 };
function gfxPR(){ var d = window.devicePixelRatio || 1; return GFX === 'alto' ? Math.min(d, MOBILE ? 1.8 : 2) : GFX === 'medio' ? Math.min(d, 1.4) : 1; }
function applyGfx(){
  if (!renderer) return;
  var shadows = GFX !== 'bajo';
  if (renderer.shadowMap.enabled !== shadows){
    renderer.shadowMap.enabled = shadows;
    if (scene) scene.traverse(function(o){ if (o.material){ (Array.isArray(o.material) ? o.material : [o.material]).forEach(function(m){ m.needsUpdate = true; }); } });
  }
  if (sun) sun.castShadow = shadows;
  if (GFX !== 'bajo' && THREE.EffectComposer && THREE.UnrealBloomPass && !composer){
    try {
      composer = new THREE.EffectComposer(renderer);
      rpass = new THREE.RenderPass(new THREE.Scene(), cam || new THREE.PerspectiveCamera());
      bloom = new THREE.UnrealBloomPass(new THREE.Vector2(512, 512), 0.4, 0.4, 0.88);
      composer.addPass(rpass); composer.addPass(bloom);
    } catch(e){ composer = null; }
  }
  gl.width = 0;                                                  // fuerza el redimensionado con la nueva resolución
}
SK.setGfx = function(q){ GFX = q; try { localStorage.setItem('sk_gfx', q); } catch(e){} applyGfx(); };
SK.getGfx = function(){ return GFX; };
SK.dbg3 = function(){ var o = { car: null, cam: cam ? [cam.position.x, cam.position.y, cam.position.z].map(Math.round) : null, gfx: GFX, gl: [gl.width, gl.height], comp: composer ? [composer.renderTarget1.width, composer.renderTarget1.height] : null, bloomRT: bloom && bloom.renderTargetsHorizontal ? bloom.renderTargetsHorizontal.map(function(t){ return t.width + 'x' + t.height; }).join(',') : null };
  if (carGrp){ var bb = new THREE.Box3().setFromObject(carGrp); o.car = { kenney: !!carGrp.userData.kenney, kind: carGrp.userData.kind, vis: carGrp.visible, inScene: carGrp.parent === scene,
    pos: [carGrp.position.x, carGrp.position.y, carGrp.position.z].map(Math.round), size: [bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z].map(function(v){ return +v.toFixed(2); }) }; }
  return o; };
function bloomFor(lk){ return lk.night ? [0.9, 0.5, 0.64] : lk.dusk ? [0.6, 0.5, 0.78] : [0.32, 0.4, 0.9]; }
function drawFrame(dt){
  if (SK.fpsGate && !SK.fpsGate()) return;
  if (composer && GFX !== 'bajo' && !composer.renderTarget1.width && gl.width){
    // el compositor se creó con el lienzo aún oculto (0×0): se ajusta antes de usarlo
    var sz = renderer.getSize(new THREE.Vector2());
    composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(sz.x, sz.y);
  }
  if (composer && GFX !== 'bajo' && composer.renderTarget1.width){
    var b = bloomFor(L()); bloom.strength = b[0]; bloom.radius = b[1]; bloom.threshold = b[2];
    rpass.scene = scene; rpass.camera = cam;
    composer.render(dt);
  } else renderer.render(scene, cam);
  // si el móvil no llega, baja la calidad un escalón (solo hacia abajo y solo corriendo)
  if (S.phase === 'run' && !SK.forceSize){
    fpsWin.t += dt; fpsWin.n++;
    if (fpsWin.t >= 3){
      var fps = fpsWin.n / fpsWin.t; fpsWin.t = 0; fpsWin.n = 0;
      if (fps < 30 && GFX !== 'bajo'){ if (++fpsWin.low >= 2){ fpsWin.low = 0; SK.setGfx(GFX === 'alto' ? 'medio' : 'bajo'); if (SK.api && SK.api.toast) SK.api.toast('Gráficos en ' + SK.getGfx() + ' para ir más fluido.'); } }
      else fpsWin.low = 0;
    }
  }
}
if (SK.loadTraffic) setTimeout(function(){ SK.loadTraffic(); }, 400);

// ---------------------------------------------------------------- estandartes de los reyes sobre cada calle del recorrido
var bannerGrp = null, bannerKey = '';
function bannerTex(text, sub, gold, motto){
  var H = motto ? 214 : 160, c = document.createElement('canvas'); c.width = 512; c.height = H;
  var g = c.getContext('2d');
  g.fillStyle = gold ? 'rgba(40,28,6,.9)' : 'rgba(10,14,19,.86)';
  if (g.roundRect){ g.beginPath(); g.roundRect(6, 6, 500, H - 12, 22); g.fill(); } else g.fillRect(6, 6, 500, H - 12);
  g.lineWidth = 6; g.strokeStyle = gold ? '#F2C14E' : '#3FD08A'; if (g.roundRect){ g.beginPath(); g.roundRect(6, 6, 500, H - 12, 22); g.stroke(); }
  g.fillStyle = '#FFFFFF'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '700 58px "Barlow Condensed", Arial Narrow, sans-serif'; g.fillText(String(text).slice(0, 22), 256, 62, 470);
  g.fillStyle = gold ? '#F2C14E' : '#9FE6C0'; g.font = '600 34px "Barlow Condensed", Arial Narrow, sans-serif'; g.fillText(String(sub).slice(0, 34), 256, 118, 470);
  if (motto){ g.fillStyle = '#FFFFFF'; g.font = 'italic 600 32px "Barlow Condensed", Arial Narrow, sans-serif'; g.fillText('«' + String(motto).slice(0, 30) + '»', 256, 168, 460); }
  return new THREE.CanvasTexture(c);
}
function buildBanners(){
  var R = S.circuit; if (!R || !scene) return;
  var me = SK.api && SK.api.getHandle ? SK.api.getHandle() : '';
  var sig = S.routeId + '|' + R.sect.map(function(sc){ var k = S.kings[SK.api.slug(sc.name)]; return k ? k.h + k.t + (k.m || '') : '-'; }).join(',');
  if (sig === bannerKey && bannerGrp && bannerGrp.parent === scene) return;
  bannerKey = sig;
  if (bannerGrp){ if (bannerGrp.parent) bannerGrp.parent.remove(bannerGrp); bannerGrp.traverse(function(o){ if (o.material && o.material.map) o.material.map.dispose(); }); }
  bannerGrp = new THREE.Group();
  var poleM = new THREE.MeshLambertMaterial({ color: 0x2A3038 });
  R.sect.forEach(function(sc){
    var k = S.kings[SK.api.slug(sc.name)], mine = k && me && k.h === me;
    var d = Math.min(R.total - 1, sc.d0 + 14), p = SK.api && SK.dbg ? SK.dbg.pointAt(R, d) : null; if (!p) return;
    var nx = -Math.sin(p.h), ny = Math.cos(p.h), off = -6.2;
    var x = p.x + nx * off, y = p.y + ny * off;
    var txt = k ? (mine ? '👑 TÚ · ' + k.h : '👑 ' + k.h) : (SK.t ? SK.t('👑 SIN REY') : '👑 SIN REY'), sub = k ? (sc.name + ' · ' + SK.api.fmt(k.t)) : (sc.name + ' · ' + (SK.t ? SK.t('¡es tuya!') : '¡es tuya!'));
    var mo = k && k.m ? k.m : null;
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: bannerTex(txt, sub, !!k, mo), depthWrite: false }));
    sp.scale.set(8.4, mo ? 3.51 : 2.6, 1); sp.position.set(x, mo ? 7.05 : 6.6, -y); bannerGrp.add(sp);
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 5.3, 6), poleM); pole.position.set(x, 2.65, -y); pole.castShadow = true; bannerGrp.add(pole);
  });
  scene.add(bannerGrp);
}

// ---------------------------------------------------------------- cielo: sol (o luna) y nubes
function softTex(draw){ var c = document.createElement('canvas'); c.width = c.height = 128; draw(c.getContext('2d')); return new THREE.CanvasTexture(c); }
function addSkyDressing(sky, lk){
  var sunT = softTex(function(g){
    var gr = g.createRadialGradient(64, 64, 2, 64, 64, 63);
    gr.addColorStop(0, 'rgba(255,255,250,1)'); gr.addColorStop(0.12, 'rgba(255,248,225,.95)'); gr.addColorStop(0.3, 'rgba(255,225,170,.35)'); gr.addColorStop(1, 'rgba(255,210,150,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  });
  var sunS = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunT, transparent: true, depthWrite: false, fog: false,
    color: lk.night ? 0xB8C8E0 : lk.dusk ? 0xFFB070 : 0xFFFFFF }));
  var el = lk.dusk ? 0.09 : lk.night ? 0.5 : 0.62, az = Math.atan2(SUNDIR[1], SUNDIR[0]), R = 1400;
  sunS.position.set(Math.cos(az) * Math.cos(el) * R, Math.sin(el) * R, -Math.sin(az) * Math.cos(el) * R);
  var sz = lk.dusk ? 520 : lk.night ? 140 : 360; sunS.scale.set(sz, sz, 1); sky.add(sunS);
  var cloudT = softTex(function(g){
    for (var i = 0; i < 14; i++){
      var x = 22 + Math.random() * 84, y = 50 + Math.random() * 30, r = 14 + Math.random() * 22;
      var gr = g.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill();
    }
  });
  var cc = lk.night ? 0x2A3444 : lk.dusk ? 0xFFC39A : 0xFFFFFF, n = MOBILE ? 10 : 18;
  for (var k = 0; k < n; k++){
    var a = k / n * 6.283 + Math.random() * 0.3, e = 0.07 + Math.random() * 0.16, d = 1250;
    var cl = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudT, transparent: true, depthWrite: false, fog: false, color: cc, opacity: lk.night ? 0.35 : 0.85 }));
    cl.position.set(Math.cos(a) * Math.cos(e) * d, Math.sin(e) * d, Math.sin(a) * Math.cos(e) * d);
    var w = 380 + Math.random() * 420; cl.scale.set(w, w * 0.42, 1); sky.add(cl);
  }
}

// ---------------------------------------------------------------- coches de los rivales (fantasmas) con su nombre
var ghostPool = [];
var GHOST_COL = ['#F2C14E', '#4FC3F7', '#B388FF', '#69F0AE', '#FF8A80'];
function labelSprite(text, col){
  var c = document.createElement('canvas'); c.width = 256; c.height = 64;
  var g = c.getContext('2d');
  g.fillStyle = 'rgba(10,14,19,.82)'; g.beginPath();
  if (g.roundRect) g.roundRect(4, 8, 248, 48, 24); else g.rect(4, 8, 248, 48); g.fill();
  g.fillStyle = col; g.beginPath(); g.arc(30, 32, 9, 0, 6.283); g.fill();
  g.fillStyle = '#FFFFFF'; g.font = '700 28px "Barlow Condensed", Arial, sans-serif'; g.textBaseline = 'middle';
  g.fillText(String(text).slice(0, 16), 48, 33);
  var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  s.scale.set(4.6, 1.15, 1); s.position.y = 3.2;
  return s;
}
function ghostCar(i, g){
  var kind = g.car || 'hatch', col = g.paint || GHOST_COL[i % GHOST_COL.length], name = g.h || 'Fantasma';
  var P = ghostPool[i];
  var ready = !!(SK.carReady && SK.carReady(kind));
  if (!P || P.kind !== kind || P.col !== col || P.name !== name || P.ready !== ready){
    if (P){ if (P.grp.parent) P.grp.parent.remove(P.grp); }
    var grp = SK.buildCar ? SK.buildCar(kind, col, 0.5) : makeCar(0xE8B93F, 0x2A2416, 0.42);
    grp.add(labelSprite(name, col));
    P = ghostPool[i] = { grp: grp, kind: kind, col: col, name: name, ready: ready };
  }
  if (P.grp.parent !== scene) scene.add(P.grp);
  return P.grp;
}
function placeGhosts(){
  var list = [];
  if (S.ghost && S.ghost.pt) list.push(S.ghost);
  (S.ghosts || []).forEach(function(g){ if (g && g.pt && list.length < 5) list.push(g); });
  for (var i = 0; i < Math.max(list.length, ghostPool.length); i++){
    if (i >= list.length){ if (ghostPool[i]) ghostPool[i].grp.visible = false; continue; }
    var gr = ghostCar(i, list[i]);
    gr.visible = true; gr.position.set(list[i].pt[0], 0, -list[i].pt[1]); gr.rotation.set(0, list[i].pt[2], 0);
  }
}

// ---------------------------------------------------------------- coche con reflejos
// Mapa de entorno sacado de un cielo pintado en un canvas: la carrocería y los cristales
// reflejan cielo y suelo, sin descargar ninguna imagen.
var envTex = null;
function makeEnv(){
  if (envTex) return envTex;
  try {
    var c = document.createElement('canvas'); c.width = 512; c.height = 256;
    var g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#5E8FD0'); gr.addColorStop(0.42, '#CFE3F5'); gr.addColorStop(0.5, '#FFFFFF');
    gr.addColorStop(0.52, '#8A8C8E'); gr.addColorStop(1, '#2A2C2E');
    g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
    g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(380, 60, 18, 0, 6.283); g.fill();       // el sol
    for (var i = 0; i < 26; i++){                                                                           // fachadas en el horizonte
      g.fillStyle = 'rgba(' + (120 + (i*37)%80) + ',' + (110 + (i*53)%70) + ',' + (100 + (i*29)%60) + ',.55)';
      var w = 10 + (i*13)%24, h = 14 + (i*17)%40; g.fillRect((i*23)%512, 128 - h, w, h);
    }
    var t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping;
    var pm = new THREE.PMREMGenerator(renderer); envTex = pm.fromEquirectangular(t).texture; pm.dispose(); t.dispose();
  } catch(e){ envTex = null; }
  return envTex;
}
function glossCar(grp){
  var env = makeEnv(); if (!env) return;
  grp.userData.paint = grp.userData.paint.map(function(m){
    var n = m.map
      ? new THREE.MeshStandardMaterial({ map: m.map, metalness: 0.06, roughness: 0.42, envMap: env, envMapIntensity: 0.32 })
      : new THREE.MeshStandardMaterial({ color: m.color.clone(), metalness: 0.5, roughness: 0.22, envMap: env, envMapIntensity: 1.15 });
    grp.traverse(function(o){ if (o.material === m) o.material = n; });
    return n;
  });
  var gm = new THREE.MeshStandardMaterial({ color: 0x10161C, metalness: 0.9, roughness: 0.06, envMap: env, envMapIntensity: 1.35 });
  if (grp.userData.glass) grp.traverse(function(o){ if (o.material === grp.userData.glass) o.material = gm; });
  else grp.userData.cabin.slice(0, 2).forEach(function(o){ o.material = gm; });
}

// ---------------------------------------------------------------- humo de ruedas
var smoke = null;
function smokeTex(){
  var c = document.createElement('canvas'); c.width = c.height = 64;
  var g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  gr.addColorStop(0, 'rgba(235,235,235,.85)'); gr.addColorStop(0.5, 'rgba(210,210,210,.35)'); gr.addColorStop(1, 'rgba(200,200,200,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
function stepSmoke(dt, car, fx, fy){
  if (!smoke){
    var tex = smokeTex(); smoke = { list: [], i: 0, acc: 0 };
    for (var k = 0; k < (MOBILE ? 36 : 70); k++){
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 }));
      sp.visible = false; sp.userData = { life: 0 }; smoke.list.push(sp);
    }
  }
  if (smoke.list[0].parent !== scene) smoke.list.forEach(function(sp){ scene.add(sp); });
  var slide = Math.abs(car.vl), hardBrake = (S.thrOut || 0) < -0.6 && car.speed > 14;
  var rate = (slide > 2.6 && car.speed > 8) ? Math.min(40, slide * 7) : hardBrake ? 12 : 0;
  smoke.acc += rate * dt;
  while (smoke.acc >= 1){
    smoke.acc -= 1;
    var p = smoke.list[smoke.i++ % smoke.list.length], side = (smoke.i % 2) ? 0.95 : -0.95;
    var rx = car.x - fx * 1.35 - fy * side, ry = car.y - fy * 1.35 + fx * side;
    p.position.set(rx, 0.35, -ry); p.scale.set(0.9, 0.9, 0.9);
    p.userData.life = 1; p.userData.vx = (Math.random() - 0.5) * 0.8; p.userData.vz = (Math.random() - 0.5) * 0.8;
    p.visible = true;
  }
  for (var j = 0; j < smoke.list.length; j++){
    var q = smoke.list[j]; if (!q.visible) continue;
    q.userData.life -= dt / 1.3;
    if (q.userData.life <= 0){ q.visible = false; continue; }
    var a = 1 - q.userData.life, s0 = 0.9 + a * 4.2;
    q.scale.set(s0, s0, s0); q.position.y += dt * 0.9; q.position.x += q.userData.vx * dt; q.position.z += q.userData.vz * dt;
    q.material.opacity = 0.42 * q.userData.life * (L().night ? 0.5 : 1);
  }
}
SK.render3dCity = function(dt){
  if (!S.G || !S.car || !S.circuit) return false;
  var key0 = S.cityId + '|' + S.skin + '|' + (S.decor ? 'd' : 'n') + '|' + (S.routeId || '') + '|' + (SK.trafficReady && SK.trafficReady() ? 'k' : 'b');
  if (builtFor !== key0 && !pending){
    pending = true;
    var el = $('loading');
    el.textContent = 'Levantando la ciudad…';
    el.classList.remove('off');
    return false;                      // one frame to paint the message
  }
  if (!ensure()){ pending = false; $('loading').classList.add('off'); return false; }
  if (pending){ pending = false; $('loading').classList.add('off'); }

  var fs = SK.forceSize;                 // vídeo vertical: se pinta a 9:16 aunque la pantalla sea apaisada
  if (fs){
    if (gl.width !== fs[0] || gl.height !== fs[1]){
      renderer.setPixelRatio(1); renderer.setSize(fs[0], fs[1], false);
      if (composer){ composer.setPixelRatio(1); composer.setSize(fs[0], fs[1]); }
      cam.aspect = fs[0] / fs[1]; cam.updateProjectionMatrix();
    }
  } else {
    var r = gl.getBoundingClientRect(), pr = gfxPR();
    var want = Math.round(r.width * pr);
    if (gl.width !== want || renderer.getPixelRatio() !== pr){
      renderer.setPixelRatio(pr);
      renderer.setSize(r.width, r.height, false);
      if (composer){ composer.setPixelRatio(GFX === 'alto' ? pr : Math.min(pr, 1)); composer.setSize(r.width, r.height); }
      cam.aspect = r.width / Math.max(1, r.height); cam.updateProjectionMatrix();
    }
  }

  var car = S.car, hood = S.view === 'hood';
  var fx = Math.cos(car.h), fy = Math.sin(car.h);

  // body attitude
  var steerIn = S.steerOut || 0;
  var targetRoll = -steerIn * Math.min(0.09, car.speed * 0.0028) - car.vl * 0.006;
  var thrIn = S.thrOut || 0;
  var targetPitch = thrIn < 0 ? 0.045 * -thrIn : -0.022 * thrIn;
  roll += (targetRoll - roll) * Math.min(1, dt*7);
  pitch += (targetPitch - pitch) * Math.min(1, dt*6);
  spin += car.speed * dt / 0.36;

  carGrp.visible = true;
  var cab = carGrp.userData.cabin;
  for (var ci = 0; ci < cab.length; ci++) cab[ci].visible = !hood;
  lift += ((car.kerb ? 0.15 : 0) - lift) * Math.min(1, dt * 14);
  var hitA = S.hit ? (performance.now() - S.hit.t) / 1000 : 9;
  if (hitA < 0.35) pitch += Math.sin(hitA * 40) * Math.min(0.06, S.hit.mag * 0.004) * (1 - hitA / 0.35);
  carGrp.position.set(car.x, lift, -car.y);
  carGrp.rotation.set(0, car.h, 0);
  carGrp.rotateZ(pitch); carGrp.rotateX(roll);
  var wh = carGrp.userData.wheels, hol = carGrp.userData.holders;
  if (carGrp.userData.kenney){
    for (var i = 0; i < wh.length; i++){
      wh[i].rotation.x = spin; wh[i].rotation.y = 0;
      // suspensión rueda a rueda: la del lado de fuera se comprime en curva, las de delante al frenar, y el bordillo sacude
      var wy0 = wh[i].userData.y0; if (wy0 == null) wy0 = wh[i].userData.y0 = wh[i].position.y;
      var side = wh[i].position.x > 0 ? 1 : -1, fr = wh[i].position.z > 0 ? 1 : -1;
      var comp = -roll * side * 0.9 + pitch * fr * 1.2 + (car.kerb && car.speed > 3 ? Math.sin(performance.now() / 45 + i) * 0.03 : 0);
      wh[i].position.y = wy0 + Math.max(-0.05, Math.min(0.05, comp));
    }
    for (var fi = 0; fi < hol.length; fi++) hol[fi].rotation.y = steerIn * 0.42;
  } else {
    for (var i2 = 0; i2 < wh.length; i2++) wh[i2].rotation.y = -spin;
    hol[0].rotation.y = hol[1].rotation.y = steerIn * 0.42;          // las ruedas delanteras giran con el volante
  }
  carGrp.userData.brake.material.emissiveIntensity = thrIn < -0.05 ? 0.5 + 1.6 * -thrIn : 0.35;

  ghostGrp.visible = false;
  placeGhosts();

  var vert = !!SK.forceSize && !SK.forceSize[2];   // vídeo vertical: cámara de dron, más alta, para que se vea la calle entera
  if (vert) hood = false;
  // v5: la cámara sigue hacia donde va el coche (en un derrape se ve el coche cruzado), no se mete en
  // las fachadas, tiembla al chocar, gira alrededor del coche en la salida y en la meta, y mira atrás.
  var vxw = fx * car.vf - fy * (car.vl || 0), vyw = fy * car.vf + fx * (car.vl || 0);
  var velH = car.speed > 4 && car.vf > 0 ? car.h + Math.max(-0.7, Math.min(0.7, Math.atan2(Math.sin(Math.atan2(vyw, vxw) - car.h), Math.cos(Math.atan2(vyw, vxw) - car.h)))) * 0.6 : car.h;
  if (camH == null || S.phase === 'ready') camH = car.h;
  var dH = Math.atan2(Math.sin(velH - camH), Math.cos(velH - camH));
  camH += dH * (1 - Math.pow(0.004, Math.min(0.05, dt)));
  var look = S.lookBack && !hood ? Math.PI : 0, ch = camH + look, bfx = Math.cos(ch), bfy = Math.sin(ch);
  var back = hood ? -1.34 : vert ? 10.5 : (12.5 + Math.min(4.5, car.speed*0.12));
  var up   = hood ? 1.48  : vert ? 13.5 : (5.8 + Math.min(2.0, car.speed*0.05));
  if (!hood && !vert && SK.camRay){
    var hitT = SK.camRay(car.x, car.y, car.x - bfx*back, car.y - bfy*back);
    if (hitT < 1){ var kk = Math.max(0.3, hitT - 0.06); up += (1 - kk) * 5.5; back *= kk; }
  }
  var shake = hood ? Math.min(0.035, car.speed*0.0011) : Math.min(0.05, car.speed*0.0009) * (S.phase === 'run' ? 1 : 0);
  var hitAge = S.hit ? (performance.now() - S.hit.t) / 1000 : 9;
  if (hitAge < 0.5) shake += Math.min(0.9, S.hit.mag * 0.045) * (1 - hitAge / 0.5);
  if (car.kerb && car.speed > 6) shake += 0.05;
  if (S.calm) shake *= 0.15;
  var want3, orbit = 0, now3 = performance.now();
  if (!vert && !hood && S.phase === 'count'){ orbit = 1 - Math.min(1, (now3 - S.started) / 2600); }
  if (!vert && S.phase === 'done' && !SK.forceSize) orbit = -1;
  if (orbit > 0){
    var oa = car.h + Math.PI * orbit * 1.1 + Math.PI, od = 8 + 6 * (1 - orbit);
    want3 = new THREE.Vector3(car.x + Math.cos(oa) * od, 2.2 + 3.6 * (1 - orbit), -(car.y + Math.sin(oa) * od));
  } else if (orbit < 0){
    var ob = car.h + Math.PI + now3 / 1000 * 0.32;
    want3 = new THREE.Vector3(car.x + Math.cos(ob) * 11, 4.2, -(car.y + Math.sin(ob) * 11));
  } else {
    want3 = new THREE.Vector3(
      car.x - bfx*back + (Math.random()-0.5)*shake,
      up + (Math.random()-0.5)*shake,
      -(car.y - bfy*back) + (Math.random()-0.5)*shake);
  }
  if (SK.camOverride){ var co = null; try { co = SK.camOverride(car, dt, cam); } catch(e){} if (co){ cam.position.copy(co.pos); cam.up.set(0, 1, 0); cam.lookAt(co.look); if (co.fov && Math.abs(cam.fov - co.fov) > 0.3){ cam.fov = co.fov; cam.updateProjectionMatrix(); } smooth = co.pos.clone(); want3 = null; } }
  if (want3){
  if (!smooth) smooth = want3.clone();
  smooth.lerp(want3, hood ? 0.75 : orbit !== 0 ? 0.12 : (1 - Math.pow(0.0006, Math.min(0.05, dt))));
  cam.position.copy(smooth);
  cam.up.set(Math.sin(car.h)*roll*1.1, 1, Math.cos(car.h)*roll*1.1);
  var ahead = hood ? 46 : vert ? 9 : 15 + car.speed*0.45;
  if (orbit !== 0) cam.lookAt(car.x, 1.0, -car.y);
  else if (look) cam.lookAt(car.x - bfx*20, 1.2, -(car.y - bfy*20));
  else cam.lookAt(car.x + bfx*ahead, hood ? (0.88 - pitch*9) : 0.6, -(car.y + bfy*ahead));
  var wantFov = vert ? 72 : 58 + Math.min(14, car.speed*0.32) + (hitAge < 0.25 ? 3 : 0);
  if (Math.abs(cam.fov - wantFov) > 0.25){ cam.fov = wantFov; cam.updateProjectionMatrix(); }
  }

  // the sun follows the car so the shadow map stays tight
  if (beam){
    beam.visible = L().night;
    beam.position.set(car.x + fx*15.5, 0.06, -(car.y + fy*15.5));
    beam.rotation.set(-Math.PI/2, 0, car.h - Math.PI/2);
  }
  sun.position.set(car.x + SUNDIR[0]*230, L().sunH || 190, -(car.y + SUNDIR[1]*230));
  sun.target.position.set(car.x, 0, -car.y);
  sun.target.updateMatrixWorld();

  if (skyMesh) skyMesh.position.copy(cam.position);
  try { stepSmoke(Math.min(0.1, dt), car, fx, fy); } catch(e){}
  try { stepLife(Math.min(0.1, dt)); } catch(e){}
  try { buildBanners(); } catch(e){}
  if (SK.frame3d) try { SK.frame3d(dt, { scene: scene, cam: cam, car: car, carGrp: carGrp, route: routeMesh, city: city, sun: sun, lk: L(), fx: fx, fy: fy, beam: beam }); } catch(e){ if (!SK._f3w){ SK._f3w = 1; console.warn(e); } }
  drawFrame(dt);
  return true;
};
SK.playerCar = function(){ return carGrp; };
SK.rebuildPlayerCar = function(){ if (carGrp) carGrp.userData.kind = '__rebuild'; };
SK.reset3dCity = function(){ smooth = null; roll = 0; pitch = 0; spin = 0; camH = null; };

})();
