/* Street Kings — real streets, real routes, one king per street. */
(function(){
'use strict';

// ---------------------------------------------------------------- data
var CITIES = {}, ORDER = [];
window.SK = { city: function(d){ if(!CITIES[d.id]) ORDER.push(d.id); CITIES[d.id] = d; if (SK._on && SK._on[d.id]) { SK._on[d.id](); delete SK._on[d.id]; } } };
SK._on = {};
var CITY_LIST = (window.SK_CITIES || []).map(function(c){ return [c.id, c.name]; });
var CLASSES = ['motorway','trunk','primary','secondary','tertiary','unclassified','residential','living_street','pedestrian'];
var HALF = [11,10,8.5,7.5,6.5,5,4.5,4,3.5];      // half road width, metres
var GRIP = [1,1,1,1,1,.97,.95,.92,.86];          // surface grip per class

// El callejero se baja de OpenStreetMap en vivo (ver osm.js) y se cachea en el navegador.
function loadCity(id){
  if (CITIES[id]) return Promise.resolve(CITIES[id]);
  return SK_OSM.load(id, function(msg){
    var el = document.getElementById('loading');
    if (!el) return;
    if (msg){ el.textContent = msg; el.classList.remove('off'); }
  }).then(function(obj){
    SK.city(obj);
    return CITIES[id];
  });
}

function decodePoly(str){
  var pts = [], i = 0, lat = 0, lon = 0, n = str.length;
  while (i < n) {
    var shift = 0, result = 0, b;
    do { b = str.charCodeAt(i++) - 63; result |= (b & 31) << shift; shift += 5; } while (b >= 32);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { b = str.charCodeAt(i++) - 63; result |= (b & 31) << shift; shift += 5; } while (b >= 32);
    lon += (result & 1) ? ~(result >> 1) : (result >> 1);
    pts.push([lat / 1e5, lon / 1e5]);
  }
  return pts;
}

// ---------------------------------------------------------------- graph
function buildGraph(d){
  var clat = d.c[0], clon = d.c[1];
  var MLAT = 111320, MLON = 111320 * Math.cos(clat * Math.PI / 180);
  var idx = new Map(), X = [], Y = [], adj = [], nameNode = {}, nameNodes = {};
  var segs = [];                    // [ax,ay,bx,by,cls,nameId]
  function node(la, lo){
    var k = la.toFixed(5) + ',' + lo.toFixed(5);
    var v = idx.get(k);
    if (v === undefined){
      v = X.length;
      X.push((lo - clon) * MLON); Y.push((la - clat) * MLAT);
      adj.push([]); idx.set(k, v);
    }
    return v;
  }
  for (var w = 0; w < d.w.length; w++){
    var way = d.w[w], nameId = way[0], cls = way[1], pts = decodePoly(way[3]);
    var prev = -1;
    for (var p = 0; p < pts.length; p++){
      var cur = node(pts[p][0], pts[p][1]);
      if (nameId > 0){
        if (nameNode[nameId] === undefined){ nameNode[nameId] = cur; nameNodes[nameId] = [cur]; }
        else if (nameNodes[nameId].length < 400 && nameNodes[nameId][nameNodes[nameId].length-1] !== cur) nameNodes[nameId].push(cur);
      }
      if (prev >= 0 && prev !== cur){
        var dx = X[cur] - X[prev], dy = Y[cur] - Y[prev];
        var len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0.2){
          var cost = len * (cls === 8 ? 1.6 : cls <= 1 ? 1.15 : 1);
          adj[prev].push(cur, cost, nameId, cls);
          adj[cur].push(prev, cost, nameId, cls);
          segs.push([X[prev], Y[prev], X[cur], Y[cur], cls, nameId]);
        }
      }
      prev = cur;
    }
  }
  // largest connected component
  var comp = new Int32Array(X.length).fill(-1), best = -1, bestN = 0, c = 0;
  for (var i = 0; i < X.length; i++){
    if (comp[i] >= 0) continue;
    var stack = [i], n = 0; comp[i] = c;
    while (stack.length){
      var u = stack.pop(); n++;
      var a = adj[u];
      for (var k = 0; k < a.length; k += 4){ var v = a[k]; if (comp[v] < 0){ comp[v] = c; stack.push(v); } }
    }
    if (n > bestN){ bestN = n; best = c; }
    c++;
  }
  // spatial grid over segments (for rendering + road contact)
  var CELL = 45, grid = new Map();
  function cellKey(cx, cy){ return cx * 100000 + cy; }
  var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  for (var s = 0; s < segs.length; s++){
    var g = segs[s];
    var x0 = Math.min(g[0], g[2]), x1 = Math.max(g[0], g[2]);
    var y0 = Math.min(g[1], g[3]), y1 = Math.max(g[1], g[3]);
    if (x0 < minX) minX = x0; if (y0 < minY) minY = y0;
    if (x1 > maxX) maxX = x1; if (y1 > maxY) maxY = y1;
    for (var cx = Math.floor(x0 / CELL); cx <= Math.floor(x1 / CELL); cx++)
      for (var cy = Math.floor(y0 / CELL); cy <= Math.floor(y1 / CELL); cy++){
        var kk = cellKey(cx, cy), arr = grid.get(kk);
        if (!arr) grid.set(kk, [s]); else arr.push(s);
      }
  }
  // node grid, restricted to main component, for snapping
  var NCELL = 120, ngrid = new Map();
  for (var i2 = 0; i2 < X.length; i2++){
    if (comp[i2] !== best) continue;
    var kk2 = cellKey(Math.floor(X[i2] / NCELL), Math.floor(Y[i2] / NCELL));
    var a2 = ngrid.get(kk2); if (!a2) ngrid.set(kk2, [i2]); else a2.push(i2);
  }
  return { d:d, X:X, Y:Y, adj:adj, segs:segs, grid:grid, CELL:CELL, ngrid:ngrid, NCELL:NCELL,
           comp:comp, main:best, names:d.n, nameNode:nameNode, nameNodes:nameNodes, bounds:[minX,minY,maxX,maxY] };
}

function snap(G, x, y){
  for (var r = 1; r <= 14; r++){
    var cx = Math.floor(x / G.NCELL), cy = Math.floor(y / G.NCELL), best = -1, bd = Infinity;
    for (var i = cx - r; i <= cx + r; i++) for (var j = cy - r; j <= cy + r; j++){
      var arr = G.ngrid.get(i * 100000 + j); if (!arr) continue;
      for (var k = 0; k < arr.length; k++){
        var n = arr[k], dx = G.X[n] - x, dy = G.Y[n] - y, dd = dx * dx + dy * dy;
        if (dd < bd){ bd = dd; best = n; }
      }
    }
    if (best >= 0) return best;
  }
  return -1;
}

// binary min-heap
function Heap(){ this.a = []; }
Heap.prototype.push = function(cost, node){
  var a = this.a; a.push(cost, node);
  var i = (a.length >> 1) - 1;
  while (i > 0){
    var p = (i - 1) >> 1;
    if (a[p*2] <= a[i*2]) break;
    var t0 = a[p*2], t1 = a[p*2+1];
    a[p*2] = a[i*2]; a[p*2+1] = a[i*2+1]; a[i*2] = t0; a[i*2+1] = t1;
    i = p;
  }
};
Heap.prototype.pop = function(){
  var a = this.a, n = a.length / 2;
  if (!n) return null;
  var rc = a[0], rn = a[1];
  a[0] = a[(n-1)*2]; a[1] = a[(n-1)*2+1]; a.length -= 2; n--;
  var i = 0;
  while (true){ var l = i*2+1, r = l+1, m = i;
    if (l < n && a[l*2] < a[m*2]) m = l;
    if (r < n && a[r*2] < a[m*2]) m = r;
    if (m === i) break;
    var t0=a[i*2],t1=a[i*2+1]; a[i*2]=a[m*2]; a[i*2+1]=a[m*2+1]; a[m*2]=t0; a[m*2+1]=t1; i = m; }
  return [rc, rn];
};

function route(G, a, b){
  var N = G.X.length;
  var dist = new Float64Array(N).fill(Infinity);
  var prev = new Int32Array(N).fill(-1), pname = new Int32Array(N).fill(-1), pcls = new Int32Array(N).fill(-1);
  var done = new Uint8Array(N), h = new Heap();
  var bx = G.X[b], by = G.Y[b];
  dist[a] = 0; h.push(0, a);
  var guard = 0;
  while (true){
    var top = h.pop(); if (!top) break;
    var u = top[1]; if (done[u]) continue; done[u] = 1;
    if (u === b) break;
    if (++guard > 400000) break;
    var adj = G.adj[u], du = dist[u];
    for (var k = 0; k < adj.length; k += 4){
      var v = adj[k], nd = du + adj[k+1];
      if (nd < dist[v]){
        dist[v] = nd; prev[v] = u; pname[v] = adj[k+2]; pcls[v] = adj[k+3];
        var dx = G.X[v] - bx, dy = G.Y[v] - by;
        h.push(nd + Math.sqrt(dx*dx + dy*dy) * 0.92, v);
      }
    }
  }
  if (!done[b] && prev[b] < 0) return null;
  var path = [], cur = b;
  while (cur !== a && cur >= 0){ path.push([cur, pname[cur], pcls[cur]]); cur = prev[cur]; }
  if (cur !== a) return null;
  path.push([a, -1, -1]); path.reverse();
  return path;
}

// turn a node path into a racing circuit: points, cumulative distance, sectors
function makeCircuit(G, path, meta){
  var P = [], cum = [0], names = [], cls = [];
  for (var i = 0; i < path.length; i++){
    P.push(G.X[path[i][0]], G.Y[path[i][0]]);
    if (i > 0){
      var dx = P[i*2] - P[(i-1)*2], dy = P[i*2+1] - P[(i-1)*2+1];
      cum.push(cum[i-1] + Math.sqrt(dx*dx + dy*dy));
      names.push(path[i][1]); cls.push(path[i][2]);
    }
  }
  // sectors = consecutive runs of the same street name (unnamed folded into previous)
  var sect = [], curName = -1, curSlug = '', start = 0;
  for (var j = 0; j < names.length; j++){
    var nm = names[j];
    var label = G.names[nm] || '';
    if (label === ''){ continue; }
    var sg = slug(label);
    if (sg !== curSlug){
      if (curName >= 0) sect.push({ name: G.names[curName], id: curName, from: start, to: j });
      curName = nm; curSlug = sg; start = j;
    }
  }
  if (curName >= 0) sect.push({ name: G.names[curName], id: curName, from: start, to: names.length });
  // merge micro-sectors (< 55 m) into the neighbour
  var merged = [];
  for (var s = 0; s < sect.length; s++){
    var L = cum[sect[s].to] - cum[sect[s].from];
    if (L < 55 && merged.length){ merged[merged.length-1].to = sect[s].to; }
    else if (L < 55 && s + 1 < sect.length){ sect[s+1].from = sect[s].from; }
    else merged.push(sect[s]);
  }
  // fold neighbours that are the same street after normalisation
  var fold = [];
  for (var f = 0; f < merged.length; f++){
    if (fold.length && slug(fold[fold.length-1].name) === slug(merged[f].name)) fold[fold.length-1].to = merged[f].to;
    else fold.push(merged[f]);
  }
  merged = fold;
  for (var m = 0; m < merged.length; m++){
    merged[m].d0 = cum[merged[m].from];
    merged[m].d1 = cum[merged[m].to];
    merged[m].len = merged[m].d1 - merged[m].d0;
  }
  var bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
  for (var q = 0; q < P.length; q += 2){
    if (P[q] < bx0) bx0 = P[q]; if (P[q] > bx1) bx1 = P[q];
    if (P[q+1] < by0) by0 = P[q+1]; if (P[q+1] > by1) by1 = P[q+1];
  }
  return { P:P, cum:cum, names:names, cls:cls, sect:merged, total:cum[cum.length-1],
           bb:[bx0,by0,bx1,by1], meta:meta };
}

// ---------------------------------------------------------------- state
var S = {
  cityId: 'sevilla', G: null, circuit: null, routeId: null, routeTitle: '',
  car: null, phase: 'idle', t: 0, started: 0, sectorTimes: [], curSector: -1,
  best: null, ghost: null, ghostRec: null, kings: {}, handle: '', db: undefined,
  cam: { x:0, y:0, z:3.1 }, keys: {}, touch: { l:0, r:0, g:0, b:0 }, dpr: 1, lastW: 0, lastH: 0,
  skin: 'day', decor: null, skids: [], narrow: false, view: 'top', decorRaw: null
};
var cv = document.getElementById('cv'), ctx = cv.getContext('2d');

function slug(name){
  var a = name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  if (a.length < 2){ var h = 0; for (var i=0;i<name.length;i++){ h = (h*31 + name.charCodeAt(i))|0; } a = 'h' + (h>>>0).toString(36); }
  return a.slice(0, 60);
}
function fmt(ms){
  if (ms == null || !isFinite(ms)) return '--.--';
  var s = ms / 1000;
  if (s < 60) return s.toFixed(2);
  return Math.floor(s/60) + ':' + (s%60 < 10 ? '0' : '') + (s%60).toFixed(2);
}
function fmtd(ms){ return (ms > 0 ? '+' : '') + (ms/1000).toFixed(2); }

// ---------------------------------------------------------------- render
function resize(){
  var r = cv.getBoundingClientRect();
  S.dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.max(1, Math.round(r.width * S.dpr));
  cv.height = Math.max(1, Math.round(r.height * S.dpr));
  S.lastW = r.width; S.lastH = r.height;
  S.narrow = r.width < 560;
}
window.addEventListener('resize', resize);

var SKINS = {
  day: {
    ground:'#F2EFE7', water:'#A3C9E8', waterEdge:'#8CB6DA',
    green:'#C6E0BA', pitch:'#B4D7A6', parking:'#E7E3D8', parkEdge:'#D5D0C2',
    bldg:'#CFC7B4', bldgTop:'#E4DFD2', bldgEdge:'#B6AD98',
    fill:  ['#FFB870','#FFC98A','#FFE9A8','#FFF6D4','#FFFFFF','#FFFFFF','#FFFFFF','#FAF8F2','#F1EEE4'],
    casing:['#EDA155','#EDAE68','#E8CE86','#E2D9B6','#DCD6C6','#DCD6C6','#DCD6C6','#DCD6C6','#DFDACB'],
    label:'#5C5749', halo:'rgba(255,255,255,.92)',
    trace:'#FF3B1F', glow:'rgba(255,59,31,.20)',
    skid:'rgba(58,52,44,.26)', shadow:'rgba(40,36,30,.22)',
    gate:'#2B2622', mini:'rgba(255,255,255,.92)', miniEdge:'rgba(0,0,0,.12)',
    puckIn:'rgba(255,59,31,.30)', puckOut:'rgba(255,59,31,0)'
  },
  night: {
    ground:'#0A0E13', water:'#0D2233', waterEdge:'#12304A',
    green:'#13251C', pitch:'#17301F', parking:'#161E26', parkEdge:'#1E2833',
    bldg:'#0F171F', bldgTop:'#1C2833', bldgEdge:'#2A3846',
    fill:  ['#4A6075','#44596D','#3D5164','#37485A','#324150','#2C3A47','#2A3743','#283441','#243039'],
    casing:['#22303C','#22303C','#202C37','#1D2833','#1B2530','#19222C','#18212A','#17202A','#161E26'],
    label:'#93A7B8', halo:'rgba(10,14,19,.9)',
    trace:'#FF5B3D', glow:'rgba(255,91,61,.22)',
    skid:'rgba(0,0,0,.35)', shadow:'rgba(0,0,0,.45)',
    gate:'#E8EFF5', mini:'rgba(13,19,26,.92)', miniEdge:'rgba(255,255,255,.14)',
    puckIn:'rgba(255,91,61,.34)', puckOut:'rgba(255,91,61,0)'
  }
};
function sk(){ return SKINS[S.skin] || SKINS.day; }

// ------------------------------------------------ decor (buildings, water, green)
var DECOR = {};
SK.decor = function(d){ DECOR[d.id] = d; if (SK._dec && SK._dec[d.id]){ SK._dec[d.id](); delete SK._dec[d.id]; } };
SK._dec = {};
// En esta versión la ciudad la pone Google, así que no hay capa propia de edificios.
function loadDecor(id){ return (window.SK_OSM && SK_OSM.decor) ? SK_OSM.decor(id) : Promise.resolve(null); }
function buildDecor(raw, center){
  if (!raw) return null;
  var clat = center[0], clon = center[1];
  var MLAT = 111320, MLON = 111320 * Math.cos(clat * Math.PI / 180);
  var polys = [], grid = new Map(), CELL = 140;
  function add(list, kind){
    for (var i = 0; i < list.length; i++){
      var pts = decodePoly(list[i][0]);
      if (pts.length < 3) continue;
      var f = new Float32Array(pts.length * 2);
      var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (var p = 0; p < pts.length; p++){
        var x = (pts[p][1] - clon) * MLON, y = (pts[p][0] - clat) * MLAT;
        f[p*2] = x; f[p*2+1] = y;
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      var id = polys.length;
      polys.push({ f:f, k:kind,
        hm: kind === 1 ? (list[i][1] || 95) / 10 : 0,
        real: kind === 1 ? (list[i][2] || 0) : 0,
        mat: kind === 1 ? (list[i][3] || 0) : 0,
        roof: kind === 1 ? (list[i][4] || 0) : 0,
        cx:(x0+x1)/2, cy:(y0+y1)/2 });
      for (var cx = Math.floor(x0/CELL); cx <= Math.floor(x1/CELL); cx++)
        for (var cy = Math.floor(y0/CELL); cy <= Math.floor(y1/CELL); cy++){
          var kk = cx*100000 + cy, arr = grid.get(kk);
          if (!arr) grid.set(kk, [id]); else arr.push(id);
        }
    }
  }
  add(raw.g || [], 3); add(raw.s || [], 5); add(raw.p || [], 4); add(raw.q || [], 6);
  add(raw.w || [], 2); add(raw.b || [], 1);
  function pts(str){
    if (!str) return new Float32Array(0);
    var ll = decodePoly(str), out = new Float32Array(ll.length*2);
    for (var i = 0; i < ll.length; i++){
      out[i*2] = (ll[i][1] - clon) * MLON;
      out[i*2+1] = (ll[i][0] - clat) * MLAT;
    }
    return out;
  }
  return { polys:polys, grid:grid, CELL:CELL,
           trees: pts(raw.tr), lamps: pts(raw.lm), signals: pts(raw.sg) };
}

// ------------------------------------------------ draw
function ring(f, sx, sy, off){
  ctx.beginPath();
  if (off){
    ctx.moveTo(sx(f[0] + off[0]), sy(f[1] + off[1]));
    for (var i = 1; i < f.length/2; i++) ctx.lineTo(sx(f[i*2] + off[0]), sy(f[i*2+1] + off[1]));
  } else {
    ctx.moveTo(sx(f[0]), sy(f[1]));
    for (var j = 1; j < f.length/2; j++) ctx.lineTo(sx(f[j*2]), sy(f[j*2+1]));
  }
  ctx.closePath();
}

function draw(){
  var G = S.G, W = cv.width, H = cv.height, z = S.cam.z * S.dpr, T = sk();
  ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle = T.ground; ctx.fillRect(0,0,W,H);
  if (!G) return;
  var cxw = S.cam.x, cyw = S.cam.y;
  function sx(x){ return (x - cxw) * z + W/2; }
  function sy(y){ return H/2 - (y - cyw) * z; }
  var halfW = W/(2*z), halfH = H/(2*z);
  var x0 = cxw - halfW - 40, x1 = cxw + halfW + 40, y0 = cyw - halfH - 40, y1 = cyw + halfH + 40;

  // --- land cover
  var D = S.decor;
  if (D){
    var seenP = new Set(), C2 = D.CELL, land = [], build = [];
    for (var i2 = Math.floor(x0/C2); i2 <= Math.floor(x1/C2); i2++)
      for (var j2 = Math.floor(y0/C2); j2 <= Math.floor(y1/C2); j2++){
        var ar = D.grid.get(i2*100000 + j2); if (!ar) continue;
        for (var k2 = 0; k2 < ar.length; k2++){
          var pid = ar[k2]; if (seenP.has(pid)) continue; seenP.add(pid);
          (D.polys[pid].k === 1 ? build : land).push(D.polys[pid]);
        }
      }
    var COL = { 2:T.water, 3:T.green, 4:T.parking, 5:T.pitch, 6:(T.plaza || (S.skin === 'night' ? '#3A3632' : '#E6D8C4')) };
    for (var g2 = 0; g2 < land.length; g2++){
      var pl = land[g2];
      ctx.fillStyle = COL[pl.k] || T.green;
      ring(pl.f, sx, sy); ctx.fill();
    }
    S._build = build;
  } else S._build = null;

  // --- roads: casing then fill
  var seen = new Set(), C = G.CELL, byCls = [[],[],[],[],[],[],[],[],[]], labels = {};
  for (var i = Math.floor(x0/C); i <= Math.floor(x1/C); i++)
    for (var j = Math.floor(y0/C); j <= Math.floor(y1/C); j++){
      var arr = G.grid.get(i*100000 + j); if (!arr) continue;
      for (var k = 0; k < arr.length; k++){
        var id = arr[k]; if (seen.has(id)) continue; seen.add(id);
        var sg = G.segs[id];
        byCls[sg[4]].push(id);
        if (sg[5] > 0 && z > 1.1){
          var dxl = sg[2]-sg[0], dyl = sg[3]-sg[1], L2 = dxl*dxl + dyl*dyl;
          var prevL = labels[sg[5]];
          if (!prevL || prevL.L < L2) labels[sg[5]] = { L:L2, s:sg };
        }
      }
    }
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (var pass = 0; pass < 2; pass++){
    for (var c = 8; c >= 0; c--){
      var list = byCls[c]; if (!list.length) continue;
      var wpx = HALF[c] * 2 * z;
      ctx.strokeStyle = pass === 0 ? T.casing[c] : T.fill[c];
      ctx.lineWidth = pass === 0 ? Math.max(2.2, wpx + 2.4) : Math.max(1.2, wpx);
      ctx.beginPath();
      for (var s = 0; s < list.length; s++){
        var g = G.segs[list[s]];
        ctx.moveTo(sx(g[0]), sy(g[1])); ctx.lineTo(sx(g[2]), sy(g[3]));
      }
      ctx.stroke();
    }
  }

  // --- buildings, faux 2.5D away from the centre of the view
  if (S._build && S._build.length){
    var bl = S._build, hf = Math.min(0.16, 0.030 * Math.max(1, z));
    ctx.lineWidth = Math.max(0.6, 0.35 * z);
    for (var b = 0; b < bl.length; b++){
      var P = bl[b], h = Math.min(34, P.hm || 9.5) * hf;
      var ox = (P.cx - cxw) * h / 34, oy = (P.cy - cyw) * h / 34;
      ctx.fillStyle = T.bldg;
      ring(P.f, sx, sy); ctx.fill();
      ctx.fillStyle = T.bldgTop; ctx.strokeStyle = T.bldgEdge;
      ring(P.f, sx, sy, [ox, oy]); ctx.fill();
      if (z > 1.6) ctx.stroke();
    }
  }

  // --- skid marks
  var sm = S.skids;
  if (sm && sm.length > 3){
    ctx.strokeStyle = T.skid; ctx.lineWidth = Math.max(1, 0.9 * z); ctx.beginPath();
    for (var q = 0; q < sm.length - 2; q += 2){
      if (sm[q] === null){ q -= 1; continue; }
      if (sm[q+2] === null) continue;
      ctx.moveTo(sx(sm[q]), sy(sm[q+1])); ctx.lineTo(sx(sm[q+2]), sy(sm[q+3]));
    }
    ctx.stroke();
  }

  if (SK.drawTerritory) try { SK.drawTerritory(ctx, sx, sy, z); } catch(e){}

  // --- route trace
  var R = S.circuit;
  if (R){
    var Pp = R.P;
    ctx.lineWidth = Math.max(2.5, 6.2 * z); ctx.strokeStyle = T.glow;
    ctx.beginPath(); ctx.moveTo(sx(Pp[0]), sy(Pp[1]));
    for (var p2 = 1; p2 < Pp.length/2; p2++) ctx.lineTo(sx(Pp[p2*2]), sy(Pp[p2*2+1]));
    ctx.stroke();
    ctx.lineWidth = Math.max(1.6, 2.6 * z); ctx.strokeStyle = T.trace; ctx.stroke();
    for (var q2 = 0; q2 < R.sect.length; q2++)
      gate(R, R.sect[q2].d1, q2 === R.sect.length-1 ? null : T.trace, sx, sy, z);
    gate(R, 0, T.gate, sx, sy, z);
  }

  // --- street labels
  if (z > 1.1){
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '600 ' + Math.round(Math.max(10, Math.min(15, 4.2 * z))) * S.dpr + 'px Barlow, system-ui, sans-serif';
    ctx.lineJoin = 'round';
    var done = 0;
    for (var nid in labels){
      if (done++ > 18) break;
      var sgL = labels[nid].s, name = G.names[nid];
      if (!name) continue;
      var ax = sx(sgL[0]), ay = sy(sgL[1]), bx2 = sx(sgL[2]), by2 = sy(sgL[3]);
      var len = Math.hypot(bx2-ax, by2-ay);
      var w = ctx.measureText(name).width;
      if (len < w + 22 * S.dpr) continue;
      var ang = Math.atan2(by2-ay, bx2-ax);
      if (ang > Math.PI/2) ang -= Math.PI; else if (ang < -Math.PI/2) ang += Math.PI;
      ctx.save(); ctx.translate((ax+bx2)/2, (ay+by2)/2); ctx.rotate(ang);
      ctx.strokeStyle = T.halo; ctx.lineWidth = 3.4 * S.dpr; ctx.strokeText(name, 0, 0);
      ctx.fillStyle = T.label; ctx.fillText(name, 0, 0);
      ctx.restore();
    }
  }

  // --- ghost + car
  if (S.ghost && S.ghost.pt) drawCar(sx(S.ghost.pt[0]), sy(S.ghost.pt[1]), S.ghost.pt[2], z, 'rgba(242,193,78,.55)', 'rgba(255,255,255,.6)', T);
  if (S.ghosts) S.ghosts.forEach(function(g, gi){
    if (!g.pt) return;
    var gx = sx(g.pt[0]), gy = sy(g.pt[1]);
    drawCar(gx, gy, g.pt[2], z, g.col2d || 'rgba(79,195,247,.6)', 'rgba(255,255,255,.6)', T);
    ctx.font = '700 ' + (11 * S.dpr) + 'px system-ui'; ctx.textAlign = 'center'; ctx.lineWidth = 3 * S.dpr;
    ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(g.h || '', gx, gy - 16 * S.dpr); ctx.fillStyle = '#FFFFFF'; ctx.fillText(g.h || '', gx, gy - 16 * S.dpr);
  });
  var car = S.car;
  if (car) drawCar(sx(car.x), sy(car.y), car.h, z, S.paint || T.trace, '#FFF1EC', T, true);
  if (S.pick) drawPick(sx, sy, z);
}

function gate(R, d, col, sx, sy, z){
  var pt = pointAt(R, d); if (!pt) return;
  var nx = -Math.sin(pt.h), ny = Math.cos(pt.h), L = 10;
  if (col){
    ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.2, 1.8*z); ctx.setLineDash([4*z, 4*z]);
    ctx.beginPath();
    ctx.moveTo(sx(pt.x - nx*L), sy(pt.y - ny*L));
    ctx.lineTo(sx(pt.x + nx*L), sy(pt.y + ny*L));
    ctx.stroke(); ctx.setLineDash([]);
    return;
  }
  // chequered finish band
  var n = 8, w = 2*L/n;
  for (var i = 0; i < n; i++){
    for (var r = 0; r < 2; r++){
      ctx.fillStyle = ((i + r) % 2) ? '#15110E' : '#FFFFFF';
      var a = -L + i*w, bq = a + w, o1 = r*2.2, o2 = o1 + 2.2;
      ctx.beginPath();
      ctx.moveTo(sx(pt.x + nx*a + Math.cos(pt.h)*o1), sy(pt.y + ny*a + Math.sin(pt.h)*o1));
      ctx.lineTo(sx(pt.x + nx*bq + Math.cos(pt.h)*o1), sy(pt.y + ny*bq + Math.sin(pt.h)*o1));
      ctx.lineTo(sx(pt.x + nx*bq + Math.cos(pt.h)*o2), sy(pt.y + ny*bq + Math.sin(pt.h)*o2));
      ctx.lineTo(sx(pt.x + nx*a + Math.cos(pt.h)*o2), sy(pt.y + ny*a + Math.sin(pt.h)*o2));
      ctx.closePath(); ctx.fill();
    }
  }
}

function drawCar(px, py, h, z, body, glass, T, puck){
  var L = Math.max(17, 5.6 * z), Wd = Math.max(8, 2.7 * z);
  if (puck){
    var rr = L * 1.45;
    var grd = ctx.createRadialGradient(px, py, rr*0.25, px, py, rr);
    grd.addColorStop(0, T.puckIn); grd.addColorStop(1, T.puckOut);
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(px, py, rr, 0, 6.283); ctx.fill();
  }
  ctx.save(); ctx.translate(px, py); ctx.rotate(-h);
  ctx.fillStyle = T.shadow;
  ctx.beginPath(); ctx.ellipse(-1.5, 2.5, L*0.58, Wd*0.68, 0, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#17130F';
  var tw = Math.max(2, Wd*0.3), tl = Math.max(3, L*0.2);
  ctx.fillRect(-L*0.34, -Wd/2 - tw*0.45, tl, tw);
  ctx.fillRect(-L*0.34,  Wd/2 - tw*0.55, tl, tw);
  ctx.fillRect( L*0.16, -Wd/2 - tw*0.45, tl, tw);
  ctx.fillRect( L*0.16,  Wd/2 - tw*0.55, tl, tw);
  ctx.fillStyle = body;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-L/2, -Wd/2, L, Wd, Math.min(4, Wd/2.6));
  else ctx.rect(-L/2, -Wd/2, L, Wd);
  ctx.fill();
  ctx.fillStyle = glass;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(L*0.02, -Wd*0.32, L*0.27, Wd*0.64, 1.5);
  else ctx.rect(L*0.02, -Wd*0.32, L*0.27, Wd*0.64);
  ctx.fill();
  ctx.restore();
}

// --- minimap of the whole circuit, on its own canvas
var mcv = document.getElementById('mini'), mctx = mcv.getContext('2d');
function drawMini(){
  var T = sk(), R = S.circuit;
  var r = mcv.getBoundingClientRect(), d = S.dpr;
  if (mcv.width !== Math.round(r.width*d)){ mcv.width = Math.round(r.width*d); mcv.height = Math.round(r.height*d); }
  var ctx = mctx, W = mcv.width, H = mcv.height, size = Math.min(W, H), mx = 0, my = 0;
  ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,W,H);
  if (!R || !R.bb) return;
  ctx.save();
  ctx.fillStyle = T.mini; ctx.strokeStyle = T.miniEdge; ctx.lineWidth = 1.5*d;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(0.8, 0.8, size-1.6, size-1.6, 6*d); else ctx.rect(0,0,size,size);
  ctx.fill(); ctx.stroke();
  var bb = R.bb, sp = 10*d;
  var sc = Math.min((size-2*sp)/Math.max(1, bb[2]-bb[0]), (size-2*sp)/Math.max(1, bb[3]-bb[1]));
  var ox = mx + size/2 - ((bb[0]+bb[2])/2)*sc, oy = my + size/2 + ((bb[1]+bb[3])/2)*sc;
  function mX(x){ return ox + x*sc; } function mY(y){ return oy - y*sc; }
  if (S.miniRotate && S.car){
    // minimapa estilo GTA: redondo, gira con el coche y muestra ~300 m alrededor, con las calles
    ctx.restore(); ctx.save(); ctx.clearRect(0, 0, W, H);
    var cxm = size/2, cym = size/2, rad = size/2 - 1;
    ctx.beginPath(); ctx.arc(cxm, cym, rad, 0, 6.283); ctx.fillStyle = T.mini; ctx.fill(); ctx.lineWidth = 2*d; ctx.strokeStyle = T.miniEdge; ctx.stroke(); ctx.clip();
    var zs = rad / 150;
    ctx.translate(cxm, cym); ctx.rotate(S.car.h - Math.PI/2); ctx.scale(zs, -zs); ctx.translate(-S.car.x, -S.car.y);
    var G = S.G;
    if (G){ ctx.strokeStyle = T.miniRoad || 'rgba(160,170,180,.55)'; ctx.lineWidth = 7 / zs * 0.35; ctx.beginPath();
      var gcx = Math.floor(S.car.x / G.CELL), gcy = Math.floor(S.car.y / G.CELL), seen = {};
      for (var gi = gcx - 2; gi <= gcx + 2; gi++) for (var gj = gcy - 2; gj <= gcy + 2; gj++){
        var arr = G.grid.get(gi*100000 + gj); if (!arr) continue;
        for (var gk = 0; gk < arr.length; gk++){ if (seen[arr[gk]]) continue; seen[arr[gk]] = 1; var sg = G.segs[arr[gk]]; ctx.moveTo(sg[0], sg[1]); ctx.lineTo(sg[2], sg[3]); }
      }
      ctx.stroke(); }
    ctx.strokeStyle = T.trace; ctx.lineWidth = 3.4 / zs; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(R.P[0], R.P[1]);
    for (var ri = 1; ri < R.P.length/2; ri++) ctx.lineTo(R.P[ri*2], R.P[ri*2+1]);
    ctx.stroke();
    var re = R.P.length - 2; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(R.P[re], R.P[re+1], 5 / zs, 0, 6.283); ctx.fill();
    if (SK.miniExtra) try { SK.miniExtra(ctx, zs); } catch(e){}
    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle = T.trace; ctx.beginPath(); ctx.moveTo(cxm, cym - 7*d); ctx.lineTo(cxm + 5*d, cym + 5*d); ctx.lineTo(cxm - 5*d, cym + 5*d); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = (9*d) + 'px sans-serif'; ctx.textAlign = 'center';
    var nx = cxm + Math.cos(-S.car.h + Math.PI/2 + Math.PI/2) * 0, ny2 = cym - rad + 10*d;
    ctx.save(); ctx.translate(cxm, cym); ctx.rotate(S.car.h - Math.PI/2); ctx.fillText('N', 0, -rad + 11*d); ctx.restore();
    ctx.restore();
    return;
  }
  ctx.strokeStyle = T.trace; ctx.lineWidth = 1.8*d; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(mX(R.P[0]), mY(R.P[1]));
  for (var i = 1; i < R.P.length/2; i++) ctx.lineTo(mX(R.P[i*2]), mY(R.P[i*2+1]));
  ctx.stroke();
  var e = R.P.length - 2;
  ctx.fillStyle = T.label;
  ctx.beginPath(); ctx.arc(mX(R.P[0]), mY(R.P[1]), 2.6*d, 0, 6.283); ctx.fill();
  ctx.fillStyle = '#15110E'; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.4*d;
  ctx.beginPath(); ctx.arc(mX(R.P[e]), mY(R.P[e+1]), 3.4*d, 0, 6.283); ctx.fill(); ctx.stroke();
  if (S.car){
    ctx.fillStyle = T.trace; ctx.strokeStyle = T.mini; ctx.lineWidth = 1.6*d;
    ctx.beginPath(); ctx.arc(mX(S.car.x), mY(S.car.y), 3.4*d, 0, 6.283); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

// position + heading at distance d along circuit
function pointAt(R, d){
  var cum = R.cum, lo = 0, hi = cum.length - 1;
  if (d <= 0) d = 0; if (d >= R.total) d = R.total;
  while (lo < hi - 1){ var mid = (lo + hi) >> 1; if (cum[mid] <= d) lo = mid; else hi = mid; }
  var seg = cum[hi] - cum[lo], t = seg > 0 ? (d - cum[lo]) / seg : 0;
  var ax = R.P[lo*2], ay = R.P[lo*2+1], bx = R.P[hi*2], by = R.P[hi*2+1];
  return { x: ax + (bx-ax)*t, y: ay + (by-ay)*t, h: Math.atan2(by-ay, bx-ax), i: lo };
}

// ---------------------------------------------------------------- surface
function surfaceAt(G, x, y){
  var C = G.CELL, cx = Math.floor(x/C), cy = Math.floor(y/C), bd = 1e9, bcls = -1;
  for (var i = cx-1; i <= cx+1; i++) for (var j = cy-1; j <= cy+1; j++){
    var arr = G.grid.get(i*100000 + j); if (!arr) continue;
    for (var k = 0; k < arr.length; k++){
      var g = G.segs[arr[k]];
      var dx = g[2]-g[0], dy = g[3]-g[1], dd = dx*dx + dy*dy, t = 0;
      if (dd > 0){ t = ((x-g[0])*dx + (y-g[1])*dy) / dd; t = t < 0 ? 0 : t > 1 ? 1 : t; }
      var px = g[0] + dx*t - x, py = g[1] + dy*t - y, d = Math.sqrt(px*px + py*py) - HALF[g[4]];
      if (d < bd){ bd = d; bcls = g[4]; }
    }
  }
  return bcls < 0 ? 0 : (bd <= 0 ? GRIP[bcls] : (bd < 2.5 ? GRIP[bcls]*0.55 : 0));
}

// ---------------------------------------------------------------- v5: calles sólidas
// Los edificios que se ven en 3D, los coches aparcados y el tráfico son sólidos: si te sales,
// chocas y rebotas en vez de atravesar la fachada. Sobre la calzada nunca se choca con edificios
// (así un pasaje bajo un edificio o un mapa algo desalineado no bloquea una carrera).
function wrapA(a){ return Math.atan2(Math.sin(a), Math.cos(a)); }
function roadGap(G, x, y){
  var C = G.CELL, cx = Math.floor(x/C), cy = Math.floor(y/C), bd = 1e9;
  for (var i = cx-1; i <= cx+1; i++) for (var j = cy-1; j <= cy+1; j++){
    var arr = G.grid.get(i*100000 + j); if (!arr) continue;
    for (var k = 0; k < arr.length; k++){
      var g = G.segs[arr[k]], dx = g[2]-g[0], dy = g[3]-g[1], dd = dx*dx + dy*dy, t = 0;
      if (dd > 0){ t = ((x-g[0])*dx + (y-g[1])*dy) / dd; t = t < 0 ? 0 : t > 1 ? 1 : t; }
      var px = g[0] + dx*t - x, py = g[1] + dy*t - y, d = Math.sqrt(px*px + py*py) - HALF[g[4]];
      if (d < bd) bd = d;
    }
  }
  return bd;
}
function polyBB(P){
  if (P.bb) return P.bb;
  var f = P.f, a = 1e9, b = 1e9, c = -1e9, d = -1e9;
  for (var i = 0; i < f.length; i += 2){ if (f[i] < a) a = f[i]; if (f[i] > c) c = f[i]; if (f[i+1] < b) b = f[i+1]; if (f[i+1] > d) d = f[i+1]; }
  return (P.bb = [a, b, c, d]);
}
// empuje para sacar un círculo (x, y, r) de un polígono: [nx, ny, profundidad] o null
function pushOut(f, x, y, r){
  var n = f.length / 2, inside = false, bd = 1e9, bx = 0, by = 0;
  for (var i = 0, j = n - 1; i < n; j = i++){
    var ax = f[j*2], ay = f[j*2+1], cx = f[i*2], cy = f[i*2+1];
    if (((cy > y) !== (ay > y)) && (x < (ax - cx) * (y - cy) / (ay - cy) + cx)) inside = !inside;
    var dx = cx - ax, dy = cy - ay, dd = dx*dx + dy*dy, t = dd > 0 ? ((x-ax)*dx + (y-ay)*dy) / dd : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    var qx = ax + dx*t, qy = ay + dy*t, d = Math.hypot(x - qx, y - qy);
    if (d < bd){ bd = d; bx = qx; by = qy; }
  }
  if (!inside && bd >= r) return null;
  var nx = x - bx, ny = y - by, L = Math.hypot(nx, ny) || 1;
  nx /= L; ny /= L;
  if (inside){ nx = -nx; ny = -ny; }
  return [nx, ny, inside ? bd + r : r - bd];
}
function hitResolve(car, nx, ny, pen, kind, sx, sy){
  car.x += nx * pen; car.y += ny * pen;
  var cx = Math.cos(car.h), cy = Math.sin(car.h);
  var vx = cx * car.vf - cy * car.vl, vy = cy * car.vf + cx * car.vl, vn = vx*nx + vy*ny;
  if (vn >= 0) return 0;
  var e = kind === 1 ? 0.22 : 0.12, fr = kind === 1 ? 0.86 : 0.7;
  var tx = vx - vn*nx, ty = vy - vn*ny;
  vx = tx * fr - vn * e * nx; vy = ty * fr - vn * e * ny;
  car.vf = vx*cx + vy*cy; car.vl = -vx*cy + vy*cx;
  // el morro se alinea un poco con la pared, como al rozar de verdad
  var th = Math.atan2(ty, tx);
  if (Math.hypot(tx, ty) > 2 && -vn < 12){ var dh = wrapA(th - car.h); if (Math.abs(dh) < 1.2) car.h += dh * 0.18; }
  var mag = -vn;
  if (mag > 1.2){
    var now = performance.now();
    if (!S.hit || now - S.hit.t > 140 || mag > S.hit.mag + 3){ S.hit = { t: now, mag: mag, kind: kind, x: sx, y: sy, nx: nx, ny: ny }; if (mag > 2.5) S.hitsLap = (S.hitsLap || 0) + 1; }
  }
  S.scrape = { t: performance.now(), v: Math.hypot(tx, ty) };
  return mag;
}
function collide(car, dt){
  var cx = Math.cos(car.h), cy = Math.sin(car.h), probes = [[1.45, 0.95], [-1.35, 0.95]];
  var D = S.decor, gen = SK.bgen || 0, G = S.G;
  for (var q = 0; q < probes.length; q++){
    var px = car.x + cx * probes[q][0], py = car.y + cy * probes[q][0], r = probes[q][1];
    // edificios (solo fuera de la calzada)
    if (D && D.grid && gen && roadGap(G, px, py) > 0.4){
      var C = D.CELL, gx = Math.floor(px / C), gy = Math.floor(py / C), arr = D.grid.get(gx*100000 + gy);
      if (arr) for (var k = 0; k < arr.length; k++){
        var P = D.polys[arr[k]]; if (P.k !== 1 || P.r3 !== gen) continue;
        var bb = polyBB(P); if (px < bb[0] - r || px > bb[2] + r || py < bb[1] - r || py > bb[3] + r) continue;
        var o = pushOut(P.f, px, py, r);
        if (o){ hitResolve(car, o[0], o[1], o[2], 1, px, py); px = car.x + cx * probes[q][0]; py = car.y + cy * probes[q][0]; }
      }
    }
    // coches aparcados y tráfico: dos círculos por coche
    var L = SK.solidCars ? SK.solidCars() : null;
    if (L) for (var i = 0; i < L.length; i += 4){
      var ox = L[i], oy = L[i+1], oh = L[i+2], ux = Math.cos(oh), uy = Math.sin(oh);
      if (Math.abs(ox - px) > 5 || Math.abs(oy - py) > 5) continue;
      for (var s2 = -1; s2 <= 1; s2 += 2){
        var qx = ox + ux * 1.15 * s2, qy = oy + uy * 1.15 * s2, dx = px - qx, dy = py - qy, d = Math.hypot(dx, dy), rr = r + 0.95;
        if (d < rr && d > 0.001){
          var m = hitResolve(car, dx / d, dy / d, rr - d, 2, qx, qy);
          if (m > 0 && SK.bumpCar) SK.bumpCar(L[i+3], -dx / d * m, -dy / d * m);
          px = car.x + cx * probes[q][0]; py = car.y + cy * probes[q][0];
        }
      }
    }
  }
}

// primer edificio (de los que se ven en 3D) que corta el segmento a→b: fracción 0..1 (1 = libre)
SK.camRay = function(ax, ay, bx, by){
  var D = S.decor, gen = SK.bgen || 0; if (!D || !D.grid || !gen) return 1;
  var C = D.CELL, best = 1, seen = {};
  var cells = [[ax, ay], [bx, by], [(ax + bx) / 2, (ay + by) / 2]];
  for (var c = 0; c < cells.length; c++){
    var arr = D.grid.get(Math.floor(cells[c][0] / C) * 100000 + Math.floor(cells[c][1] / C)); if (!arr) continue;
    for (var k = 0; k < arr.length; k++){
      var id = arr[k]; if (seen[id]) continue; seen[id] = 1;
      var P = D.polys[id]; if (P.k !== 1 || P.r3 !== gen || (P.hm || 9) < 3) continue;
      var bb = polyBB(P);
      if (Math.max(ax, bx) < bb[0] || Math.min(ax, bx) > bb[2] || Math.max(ay, by) < bb[1] || Math.min(ay, by) > bb[3]) continue;
      var f = P.f, n = f.length / 2;
      for (var i = 0, j = n - 1; i < n; j = i++){
        var x1 = f[j*2], y1 = f[j*2+1], x2 = f[i*2], y2 = f[i*2+1];
        var dx = bx - ax, dy = by - ay, ex = x2 - x1, ey = y2 - y1, den = dx * ey - dy * ex;
        if (Math.abs(den) < 1e-9) continue;
        var t = ((x1 - ax) * ey - (y1 - ay) * ex) / den, u = ((x1 - ax) * dy - (y1 - ay) * dx) / den;
        if (t > 0.02 && t < best && u >= 0 && u <= 1) best = t;
      }
    }
  }
  return best;
};

// ---------------------------------------------------------------- physics
function newCar(R){
  var p = pointAt(R, 0);
  return { x:p.x, y:p.y, h:p.h, vf:0, vl:0, speed:0, prog:0, off:0 };
}
function step(dt){
  var car = S.car, R = S.circuit, G = S.G;
  if (!car || !R) return;
  // v5: "volver a la pista": el coche vuelve solo al último punto del trazado, a velocidad legal
  if (car.rw){
    var rw = car.rw, rdx = rw.x - car.x, rdy = rw.y - car.y, rd = Math.sqrt(rdx*rdx + rdy*rdy), rs = 38 * dt;
    if (rd <= rs){ car.x = rw.x; car.y = rw.y; car.h = rw.h; car.vf = 0; car.vl = 0; car.speed = 0; car.rw = null; car.off = 0; S.lateral = 0; if (SK.onRespawned) try { SK.onRespawned(); } catch(e){} }
    else { car.x += rdx / rd * rs; car.y += rdy / rd * rs; car.h += wrapA(rw.h - car.h) * Math.min(1, dt * 4); car.speed = 38; car.vf = 0; car.vl = 0; }
    S.steerOut = 0; S.thrOut = 0;
    return;
  }
  var thr = 0, str = 0, hb = 0, P = S.pad || {};
  if (S.phase === 'run'){
    // entradas analógicas: teclado 0/1, pedales y volante táctiles de 0 a 1 (drive.js)
    var GP = S.gp || {};
    var brk = Math.max(S.keys.down || S.touch.b ? 1 : 0, P.brk || 0, GP.brk || 0);
    var gas = Math.max(S.keys.up || S.touch.g ? 1 : 0, P.gas || 0, GP.gas || 0, S.autoGas && brk < 0.05 ? 1 : 0);
    thr = brk > 0.05 ? -brk : gas;
    if (S.keys.left || S.touch.l) str += 1;
    if (S.keys.right || S.touch.r) str -= 1;
    if (P.steer) str += P.steer;
    if (S.tilt) str += S.tilt;
    if (GP.steer) str += GP.steer;
    str = Math.max(-1, Math.min(1, str));
    if (SK.steerAssist) str = SK.steerAssist(car, R, str);
    hb = (S.keys.hb || P.hb || GP.hb) ? 1 : 0;
  }
  S.steerOut = str; S.thrOut = thr; S.hbOut = hb;
  var grip = surfaceAt(G, car.x, car.y) * (S.wet ? 0.86 : 1);
  var onRoad = grip > 0;
  car.off = onRoad ? 0 : car.off + dt;
  car.kerb = grip > 0 && grip < 0.7;           // pisando acera o bordillo

  var ACC = 15.5, BRK = 26, VMAX = 46;
  if (thr > 0) car.vf += ACC * thr * (1 - Math.min(1, car.vf / VMAX) * 0.72) * dt * (onRoad ? 1 : 0.35);
  else if (thr < 0) car.vf -= (car.vf > 0 ? BRK : 9) * (-thr) * dt;
  else car.vf -= car.vf * 0.55 * dt;
  if (hb) car.vf -= Math.sign(car.vf) * Math.min(Math.abs(car.vf), 7 * dt);
  car.vf -= car.vf * Math.abs(car.vf) * (onRoad ? 0.0021 : 0.02) * dt;
  if (!onRoad && car.vf > 9) car.vf -= (car.vf - 9) * 2.6 * dt;
  if (car.vf < -9) car.vf = -9;

  var vabs = Math.abs(car.vf);
  var steerAuth = Math.min(1, vabs / 7) * (1 - Math.min(0.55, vabs / 120)) * (hb ? 1.35 : 1);
  car.h += str * 2.45 * steerAuth * dt * (car.vf < 0 ? -1 : 1);

  var gripK = onRoad ? (5.2 * grip) : 2.4;
  if (hb) gripK *= 0.28;                        // freno de mano: la trasera se suelta
  car.vl *= Math.exp(-gripK * dt);
  car.vl -= str * vabs * 2.1 * dt * (onRoad ? 1 : 1.7) * (hb ? 1.25 : 1);

  var cx = Math.cos(car.h), cy = Math.sin(car.h);
  var vx = cx * car.vf - cy * car.vl, vy = cy * car.vf + cx * car.vl;
  car.x += vx * dt; car.y += vy * dt;
  collide(car, dt);
  cx = Math.cos(car.h); cy = Math.sin(car.h);
  vx = cx * car.vf - cy * car.vl; vy = cy * car.vf + cx * car.vl;
  car.speed = Math.sqrt(vx*vx + vy*vy);

  // skid marks while the back end steps out
  var sl = S.skids;
  if (onRoad && Math.abs(car.vl) > 3.0 && car.speed > 9){
    if (sl.length > 3000) sl.splice(0, 600);
    sl.push(car.x - Math.cos(car.h)*1.6, car.y - Math.sin(car.h)*1.6);
    S._skidding = true;
  } else if (S._skidding){
    sl.push(null, null); S._skidding = false;
  }

  // progress along the route (Strava-style projection, forward-biased window)
  var from = Math.max(0, car.prog - 45), to = Math.min(R.total, car.prog + 160);
  var bestD = Infinity, bestProg = car.prog;
  var cum = R.cum, i0 = pointAt(R, from).i, i1 = pointAt(R, to).i;
  for (var i = i0; i <= i1; i++){
    var ax = R.P[i*2], ay = R.P[i*2+1], bx = R.P[i*2+2], by = R.P[i*2+3];
    if (bx === undefined) break;
    var dx = bx-ax, dy = by-ay, dd = dx*dx + dy*dy, t = 0;
    if (dd > 0){ t = ((car.x-ax)*dx + (car.y-ay)*dy)/dd; t = t < 0 ? 0 : t > 1 ? 1 : t; }
    var px = ax + dx*t - car.x, py = ay + dy*t - car.y, d = px*px + py*py;
    if (d < bestD){ bestD = d; bestProg = cum[i] + Math.sqrt(dd)*t; }
  }
  var lateral = Math.sqrt(bestD);
  if ((lateral < 38 || S.mode) && bestProg > car.prog && (!S.mode || lateral < 20)) car.prog = bestProg;
  S.lateral = lateral;
}

// ---------------------------------------------------------------- loop
var lastT = 0, acc = 0;
function frame(now){
  requestAnimationFrame(frame);
  if (!lastT) lastT = now;
  var dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
  if (SK.beforeFrame) try { SK.beforeFrame(dt); } catch(e){}
  if (SK.pre) for (var hk = 0; hk < SK.pre.length; hk++) try { SK.pre[hk](dt); } catch(e){}
  var rect = cv.getBoundingClientRect();
  if (S.lastW !== rect.width || S.lastH !== rect.height) resize();

  if (S.phase === 'count'){
    var left = 3 - (now - S.started) / 1000;
    var el = document.getElementById('lights');
    if (left > 0){ var n = Math.ceil(left); el.textContent = n; el.style.color = n === 1 ? '#F2C14E' : '#E8EFF5'; }
    else { el.textContent = 'GO'; el.style.color = '#3FD08A'; S.phase = 'run'; S.started = now; S.t = 0;
           setTimeout(function(){ el.textContent = ''; }, 700); }
  }
  if (S.phase === 'run' && S.paused){
    // pausa de verdad: el reloj no corre (se desplaza la salida lo mismo que dura la pausa)
    S.started += dt * 1000; acc = 0;
  } else if (S.phase === 'run'){
    acc += dt;
    var guard = 0;
    while (acc >= 1/120 && guard++ < 20){ step(1/120); acc -= 1/120; }
    S.t = now - S.started;
    recordGhost();
    playGhost();
    checkSectors();
    if (S.circuit && S.car.prog >= S.circuit.total - 1.5) finish();
  } else if (S.phase === 'ready' || S.phase === 'count'){
    acc = 0;
  }

  // camera
  if (S.car && !S.pick){
    var lead = Math.min(38, S.car.speed * 1.15);
    var tx = S.car.x + Math.cos(S.car.h) * lead, ty = S.car.y + Math.sin(S.car.h) * lead;
    var k = 1 - Math.pow(0.0015, dt);
    S.cam.x += (tx - S.cam.x) * k; S.cam.y += (ty - S.cam.y) * k;
    var tz = 3.5 - Math.min(1.55, S.car.speed / 30);
    S.cam.z += (tz - S.cam.z) * (1 - Math.pow(0.2, dt));
  }
  if (S.view === 'top' || !SK.render3d || !SK.render3d(dt)) draw();
  drawMini();
  paintHud();
  if (SK.post) for (var hq = 0; hq < SK.post.length; hq++) try { SK.post[hq](dt); } catch(e){}
  if (SK.afterFrame) try { SK.afterFrame(dt); } catch(e){}
}

// una muestra cada 100 ms; si un fotograma llega tarde, las muestras que faltan se interpolan
// entre la posición anterior y la actual (antes se repetía la actual y el coche parecía saltar)
function recordGhost(){
  if (!S.ghostRec) return;
  var n = Math.floor(S.t / 100), c = S.car, L = S._recLast;
  if (!L) L = { t: 0, x: c.x, y: c.y, h: c.h };
  while (S.ghostRec.length / 3 <= n && S.ghostRec.length < 18000){
    var ts = (S.ghostRec.length / 3) * 100, u = S.t > L.t ? Math.max(0, Math.min(1, (ts - L.t) / (S.t - L.t))) : 1;
    var dh = Math.atan2(Math.sin(c.h - L.h), Math.cos(c.h - L.h));
    S.ghostRec.push(Math.round((L.x + (c.x - L.x) * u) * 10), Math.round((L.y + (c.y - L.y) * u) * 10), Math.round((L.h + dh * u) * 100));
  }
  S._recLast = { t: S.t, x: c.x, y: c.y, h: c.h };
}
function playGhost(){
  playOne(S.ghost);
  if (S.ghosts) for (var k = 0; k < S.ghosts.length; k++) playOne(S.ghosts[k]);
}
function playOne(g){
  if (!g || !g.data) return;
  var i = Math.floor(S.t / 100), d = g.data;
  if (i*3+2 >= d.length){ g.pt = null; return; }
  var t = (S.t % 100) / 100, j = Math.min(i+1, (d.length/3|0) - 1);
  var h0 = d[i*3+2]/100, h1 = d[j*3+2]/100, dh = Math.atan2(Math.sin(h1-h0), Math.cos(h1-h0));
  g.pt = [ (d[i*3] + (d[j*3]-d[i*3])*t)/10, (d[i*3+1] + (d[j*3+1]-d[i*3+1])*t)/10, h0 + dh*t ];
}

// ---------------------------------------------------------------- timing
function checkSectors(){
  var R = S.circuit;
  for (var i = S.curSector + 1; i < R.sect.length; i++){
    if (S.car.prog >= R.sect[i].d1 - 0.5){
      S.sectorTimes[i] = S.t;
      S.curSector = i;
    } else break;
  }
}
function sectorSplit(i){
  var prev = i === 0 ? 0 : (S.sectorTimes[i-1] || 0);
  return S.sectorTimes[i] != null ? S.sectorTimes[i] - prev : null;
}
function finish(){
  if (S.phase !== 'run') return;
  if (S.mode && SK.modeFinish){ S.phase = 'done'; try { SK.modeFinish(S.t); } catch(e){ console.warn(e); } return; }
  S.phase = 'done';
  var R = S.circuit, total = S.t;
  if (S.sectorTimes[R.sect.length-1] == null) S.sectorTimes[R.sect.length-1] = total;
  showResults(total);
}

// ---------------------------------------------------------------- HUD
var $ = function(id){ return document.getElementById(id); };
function paintHud(){
  var R = S.circuit;
  $('ct').textContent = S.phase === 'idle' ? '--.--' : fmt(S.t);
  var cd = $('cd');
  if (S.phase === 'run' && S.ghost && S.ghost.prog){
    var idx = binSearchProg(S.ghost.prog, S.car.prog);
    if (idx != null){ var delta = S.t - idx*100; cd.textContent = fmtd(delta); cd.className = 'd ' + (delta > 0 ? 'up' : 'dn'); }
    else { cd.textContent = ''; cd.className = 'd'; }
  } else if (S.phase === 'idle' || !R){ cd.textContent = ''; cd.className = 'd'; }
  else { cd.textContent = R ? Math.round(Math.max(0, R.total - (S.car?S.car.prog:0))) + ' m' : ''; cd.className = 'd'; }

  $('spd').textContent = S.car ? Math.round(S.car.speed * 3.6) : '0';
  $('warn').style.display = (S.phase === 'run' && S.lateral > 40) ? 'block' : 'none';

  if (R){
    var si = Math.max(0, Math.min(R.sect.length-1, S.curSector + 1));
    var sc = R.sect[si];
    if (sc){
      $('pst').textContent = sc.name;
      var k = S.kings[slug(sc.name)];
      $('pkn').textContent = k ? '👑 ' + k.h + ' · ' + fmt(k.t) : 'sin rey · córrela y es tuya';
    }
    var html = '';
    for (var i = 0; i < R.sect.length && i < 9; i++){
      var s = R.sect[i], sl = slug(s.name), king = S.kings[sl];
      var split = sectorSplit(i);
      var cls = 'sect' + (i === si ? ' cur' : '');
      if (split != null && king && split < king.t) cls += ' won';
      html += '<div class="' + cls + '"><span class="nm">' + esc(s.name) + '</span>' +
              '<span class="ms">' + (split != null ? fmt(split) : '·') + '</span>' +
              '<span class="kg">' + (king && king.h ? '\u{1F451}' + esc(String(king.h).slice(0,7)) : '\u2014') + '</span></div>';
    }
    $('timing').innerHTML = html;
  }
}
function binSearchProg(arr, p){
  for (var i = 0; i < arr.length; i++) if (arr[i] >= p) return i;
  return null;
}
function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }

function toast(msg, bad){
  var t = document.createElement('div');
  t.className = 'toast' + (bad ? ' lose' : '');
  t.innerHTML = msg;
  $('toasts').appendChild(t);
  setTimeout(function(){ t.style.transition = 'opacity .4s'; t.style.opacity = 0;
    setTimeout(function(){ t.remove(); }, 420); }, 5200);
}

// ---------------------------------------------------------------- persistence
function getHandle(){
  if (S.handle) return S.handle;
  var h = '';
  try { h = localStorage.getItem('sk_handle') || ''; } catch(e){}
  S.handle = h; return h;
}
function setHandle(h){
  S.handle = h.trim().slice(0,14);
  try { localStorage.setItem('sk_handle', S.handle); } catch(e){}
  updateTerritory();
}
// ---------------------------------------------------------------- net bridge
// El juego no tiene claves. Habla con la pagina que lo embebe por postMessage
// y es ella la que llama a Supabase con la sesion del jugador.
var kingsUnsub = null;
var NET = (function(){
  var pend = {}, seq = 0, up = (window.parent && window.parent !== window);
  window.addEventListener('message', function(ev){
    var d = ev.data;
    if (!d || d.__sk !== 'res') return;
    var cb = pend[d.id];
    if (cb){ delete pend[d.id]; cb(d.ok ? d.data : null); }
  });
  function call(op, args, ms){
    return new Promise(function(res){
      if (!up) return res(null);
      var id = ++seq;
      pend[id] = res;
      setTimeout(function(){ if (pend[id]){ delete pend[id]; res(null); } }, ms || 9000);
      try { window.parent.postMessage({ __sk:'req', id:id, op:op, args:args||{} }, '*'); }
      catch(e){ delete pend[id]; res(null); }
    });
  }
  return { call: call, up: up };
})();
function deviceId(){
  var k = '';
  try { k = localStorage.getItem('sk_dev') || ''; } catch(e){}
  if (!k){
    k = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    try { localStorage.setItem('sk_dev', k); } catch(e){}
  }
  return k;
}
async function openDb(){
  if (S.db !== undefined) return S.db;
  if (!NET.up){ S.db = null; return null; }
  var ping = await NET.call('ping', {}, 12000);
  S.db = ping ? true : null;
  return S.db;
}
function kingsFromRows(rows){
  var out = {};
  for (var i = 0; i < (rows || []).length; i++){
    var r = rows[i];
    out[r.street_slug] = { h: r.holder_handle || '—', t: r.ms, n: r.street_name, c: r.holder_crew || null, g: r.geom || null, m: r.motto || null, s: r.since || null };
  }
  return out;
}
function mergeKings(data){
  var mine = getHandle();
  if (mine && Object.keys(S.kings).length){
    for (var k in S.kings){
      if (S.kings[k].h === mine && data[k] && data[k].h !== mine)
        toast('🚨 Has perdido <b>' + esc(S.kings[k].n || k) + '</b> contra ' + esc(data[k].h), true);
    }
  }
  S.kings = data || {};
  updateTerritory(); renderRaces();
}
async function watchKings(cityId){
  if (!(await openDb())) return;
  if (kingsUnsub){ clearInterval(kingsUnsub); kingsUnsub = null; }
  async function pull(){
    if (S.cityId !== cityId) return;
    var rows = await NET.call('kings', { city: kingKey(cityId) });
    if (rows) mergeKings(kingsFromRows(rows));
  }
  await pull();
  kingsUnsub = setInterval(pull, 25000);
}
function updateTerritory(){
  var me = getHandle(), n = 0;
  for (var k in S.kings) if (S.kings[k] && S.kings[k].h === me) n++;
  $('terr').textContent = n;
  var cname = (CITIES[S.cityId] || {}).name || '';
  $('terrtxt').textContent = me ? 'calles que ' + me + ' controla en ' + cname
                                : 'pon tu nombre y empieza a conquistar';
}
async function claimStreets(){
  if (!(await openDb())) return [];
  var R = S.circuit, me = getHandle() || 'anon', best = {}, items = [];
  for (var i = 0; i < R.sect.length; i++){
    var split = sectorSplit(i); if (split == null) continue;
    var s = R.sect[i], sl = slug(s.name), t = Math.round(split);
    if (best[sl] == null || t < best[sl].ms) best[sl] = { slug: sl, name: s.name, ms: t, len: Math.round(s.len), geom: sectGeom(s) };
  }
  for (var key in best) items.push(best[key]);
  if (!items.length) return [];
  var res = await NET.call('claim', {
    city: kingKey(S.cityId), route: S.routeId, handle: me, device: deviceId(), items: items,
    cityName: cityMeta(S.cityId).name || (CITIES[S.cityId] || {}).name || ''
  }, 20000);
  if (!res) return [];
  var won = [];
  for (var j = 0; j < res.length; j++){
    var r = res[j];
    if (!r || !r.claimed) continue;
    var it = best[r.slug];
    S.kings[r.slug] = { h: me, t: it.ms, n: it.name, g: it.geom };
    won.push({ name: it.name, ms: it.ms, from: r.previous_handle || null });
  }
  if (won.length) updateTerritory();
  return won;
}
async function saveBoard(total){
  if (!(await openDb())) return null;
  var me = getHandle() || 'anon';
  var res = await NET.call('lap', {
    route: S.routeId, city: kingKey(S.cityId), ms: Math.round(total), handle: me, device: deviceId(),
    ghost: S.ghostRec ? JSON.stringify(S.ghostRec.slice(0, 18000)) : null,
    len: Math.round(S.circuit.total), crow: crowDist(), title: S.routeTitle, share: shareQuery(),
    car: S.carKind || 'hatch', paint: S.paint || null
  }, 20000);
  return res || null;
}
async function loadBoard(routeId){
  if (!(await openDb())) return null;
  return await NET.call('board', { route: routeId }, 15000);
}

function sectGeom(s){
  var R = S.circuit, out = [], n = s.to - s.from, step = Math.max(1, Math.ceil(n / 24));
  for (var k = s.from; k <= s.to; k += step){ var ll = toLatLon(R.P[k*2], R.P[k*2+1]); out.push([+ll[0].toFixed(5), +ll[1].toFixed(5)]); }
  if ((s.to - s.from) % step){ var le = toLatLon(R.P[s.to*2], R.P[s.to*2+1]); out.push([+le[0].toFixed(5), +le[1].toFixed(5)]); }
  return JSON.stringify(out);
}
function crowDist(){
  var R = S.circuit, e = R.P.length - 2;
  return Math.round(Math.hypot(R.P[e] - R.P[0], R.P[e+1] - R.P[1]));
}
function shareQuery(){ var u = shareUrl(); return u ? u.split('?')[1] : null; }

function prepGhost(g){
  if (!g || !g.data || !g.data.length || !S.circuit) return null;
  var R = S.circuit, n = g.data.length / 3 | 0, prog = new Float64Array(n), p = 0;
  for (var i = 0; i < n; i++){
    var x = g.data[i*3]/10, y = g.data[i*3+1]/10;
    var from = Math.max(0, p - 20), to = Math.min(R.total, p + 200);
    var i0 = pointAt(R, from).i, i1 = pointAt(R, to).i, bd = Infinity, bp = p;
    for (var k = i0; k <= i1; k++){
      var ax = R.P[k*2], ay = R.P[k*2+1], bx = R.P[k*2+2], by = R.P[k*2+3];
      if (bx === undefined) break;
      var dx = bx-ax, dy = by-ay, dd = dx*dx+dy*dy, t = 0;
      if (dd > 0){ t = ((x-ax)*dx + (y-ay)*dy)/dd; t = t<0?0:t>1?1:t; }
      var px = ax+dx*t-x, py = ay+dy*t-y, d = px*px+py*py;
      if (d < bd){ bd = d; bp = R.cum[k] + Math.sqrt(dd)*t; }
    }
    p = Math.max(p, bp); prog[i] = p;
  }
  return { data: g.data, ms: g.ms, h: g.h, prog: prog, pt: null };
}

var LAP_WHY = { rate: 'demasiadas vueltas seguidas, espera un par de minutos', too_fast: 'tiempo imposible para ese coche',
  too_fast_1s: 'velocidad imposible en un tramo', teleport: 'el coche ha saltado de sitio', short_path: 'te has saltado parte del trazado',
  not_arrived: 'no has llegado a la meta', ghost_len: 'la grabacion de la vuelta no cuadra', no_ghost: 'falta la grabacion de la vuelta',
  route_mismatch: 'tu mapa de esta ruta no coincide con el de los demas, recarga la pagina', len: 'ruta demasiado corta o larga' };

// ---------------------------------------------------------------- results
async function showResults(total){
  var R = S.circuit;
  $('rlab').textContent = (CITIES[S.cityId]||{}).name + ' · ' + Math.round(R.total) + ' m';
  $('rtitle').textContent = S.routeTitle;
  $('rtime').textContent = fmt(total);
  var prevBest = S.best;
  $('rtime').style.color = (!prevBest || total < prevBest) ? 'var(--good)' : 'var(--fg)';
  $('results').classList.add('on');
  $('rverdict').textContent = 'Guardando…';
  $('rsect').innerHTML = ''; $('rboard').innerHTML = '';

  // vuelta casual (has rebobinado): se ve el tiempo pero no se sube ni gana calles
  var board = S.casual ? await loadBoard(S.routeId) : await saveBoard(total);
  var lapOk = !S.casual && (!board || !board.lap || board.lap.ok);
  var won = lapOk ? await claimStreets() : [];
  S.lastRun = { total: total, won: won, rec: S.ghostRec ? S.ghostRec.slice() : null, splits: S.sectorTimes.slice(),
                title: S.routeTitle, city: (CITIES[S.cityId]||{}).name || '', routeId: S.routeId, lapOk: lapOk,
                reason: board && board.lap ? board.lap.reason : null };

  var rows = '';
  for (var i = 0; i < R.sect.length; i++){
    var s = R.sect[i], split = sectorSplit(i), sl = slug(s.name), k = S.kings[sl];
    var isMine = k && k.h === (getHandle() || 'anon') && Math.round(split) === k.t;
    var badge = isMine ? '<span class="b crown">👑 tuya</span>' : '<span class="b keep">👑 ' + esc(k ? k.h : '—') + ' ' + fmt(k?k.t:null) + '</span>';
    rows += '<div class="sl"><span class="n">' + esc(s.name) + '</span><span class="m">' + fmt(split) + '</span>' + badge + '</div>';
  }
  $('rsect').innerHTML = rows;

  var me = getHandle() || 'anon';
  if (board && board.entries){
    var b = '';
    for (var j = 0; j < Math.min(8, board.entries.length); j++){
      var e = board.entries[j];
      b += '<div class="row' + (e.h === me ? ' me' : '') + '"><span>' + (j+1) + '</span><span>' + esc(e.h) + '</span><span>' + fmt(e.ms) + '</span></div>';
    }
    $('rboard').innerHTML = b || '<div class="row"><span>—</span><span>nadie más ha corrido esto</span><span></span></div>';
    if (board.ghost) S.ghost = prepGhost(board.ghost);
  } else {
    $('rboard').innerHTML = '<div class="row"><span>—</span><span>los tiempos compartidos no están disponibles aquí</span><span></span></div>';
  }
  if (lapOk && (!S.best || total < S.best)) S.best = total;
  S.lastRun.casual = !!S.casual; S.lastRun.hits = S.hitsLap || 0;
  if (SK.onFinish) try { SK.onFinish(S.lastRun, board); } catch(e){}

  if (S.casual){
    $('rverdict').innerHTML = 'Vuelta casual (has rebobinado): el tiempo no cuenta para las coronas. Haz una sin rebobinar para ganarlas.';
  } else if (!lapOk){
    $('rverdict').innerHTML = 'Esta vuelta no cuenta: ' + esc(LAP_WHY[S.lastRun.reason] || 'el servidor no la ha validado') + '.';
  } else if (S.db === null){
    $('rverdict').innerHTML = 'Tiempo guardado solo en esta sesion: los reyes compartidos no estan disponibles en esta vista.';
  } else if (won.length){
    var stolen = won.filter(function(w){ return w.from; });
    $('rverdict').innerHTML = '👑 Has conquistado <b>' + won.length + '</b> ' + (won.length === 1 ? 'calle' : 'calles') +
      (stolen.length ? ' — se las has quitado a ' + esc(stolen.map(function(w){ return w.from; }).filter(function(v,i,a){ return a.indexOf(v)===i; }).join(', ')) : '') + '.';
  } else {
    $('rverdict').textContent = 'Ni una calle esta vez. Los reyes aguantan.';
  }
}

// ---------------------------------------------------------------- race setup
function setCircuit(circuit, routeId, title){
  S.circuit = circuit; S.routeId = routeId; S.routeTitle = title;
  S.car = newCar(circuit); S.sectorTimes = []; S.curSector = -1; S.t = 0;
  S.phase = 'ready'; S.ghostRec = null; S.ghost = null; S.best = null; S.skids = []; S._skidding = false;
  if (!S.group || S.group.route !== routeId) S.ghosts = [];
  if (SK.onRoute) try { SK.onRoute(routeId); } catch(e){}
  var p = pointAt(circuit, 0);
  S.cam.x = p.x; S.cam.y = p.y; S.cam.z = 3.1; S.hit = null;
  $('lights').textContent = '';
  $('results').classList.remove('on');
  loadBoard(routeId).then(function(b){
    if (b){
      if (b.ghost) S.ghost = prepGhost(b.ghost);
      var me = getHandle();
      var mine = (b.entries||[]).filter(function(e){ return e.h === me; })[0];
      if (mine) S.best = mine.ms;
    }
    startCountdown();
  });
}
function startCountdown(){
  if (!S.circuit) return;
  S.car = newCar(S.circuit); S.sectorTimes = []; S.curSector = -1; S.t = 0;
  S.ghostRec = []; S._recLast = { t: 0, x: S.car.x, y: S.car.y, h: S.car.h }; S.skids = []; S._skidding = false; S.phase = 'count'; S.started = performance.now();
  S.casual = false; S.hitsLap = 0; S.paused = false; S.hit = null;
  if (SK.onCountdown) try { SK.onCountdown(); } catch(e){}
  if (SK.reset3d) SK.reset3d();
  $('results').classList.remove('on');
}

async function buildRaceFromNodes(a, b, title, routeId){
  var path = route(S.G, a, b);
  if (!path || path.length < 3) return false;
  var c = makeCircuit(S.G, path, {});
  if (c.total < 120 || !c.sect.length) return false;
  setCircuit(c, routeId, title);
  return true;
}
function racePreset(r){
  var pair = resolvePair({ label:r.a.n, pt:r.a.p }, { label:r.b.n, pt:r.b.p });
  var a = pair[0], b = pair[1];
  if (a < 0 || b < 0 || a === b) return;
  buildRaceFromNodes(a, b, r.t, r.id).then(function(ok){
    if (!ok) toast('No se puede trazar esa ruta.', true);
    else renderRaces();
  });
}
function proj(p){
  var d = CITIES[S.cityId], MLON = 111320 * Math.cos(d.c[0] * Math.PI/180);
  return [ (p[1] - d.c[1]) * MLON, (p[0] - d.c[0]) * 111320 ];
}

// ---------------------------------------------------------------- search
function searchIndex(){
  var G = S.G, d = CITIES[S.cityId], out = [];
  for (var i = 0; i < d.r.length; i++){
    out.push({ label: d.r[i].a.n, pt: d.r[i].a.p, mark: true });
    out.push({ label: d.r[i].b.n, pt: d.r[i].b.p, mark: true });
  }
  for (var n = 1; n < G.names.length; n++){
    if (!G.names[n]) continue;
    out.push({ label: G.names[n], node: G.nameNode[n] });
  }
  S.nameByNorm = {};
  for (var m = 1; m < G.names.length; m++) if (G.names[m]) S.nameByNorm[norm(G.names[m])] = m;
  var seen = {}, uniq = [];
  for (var k = 0; k < out.length; k++){
    var key = out[k].label.toLowerCase();
    if (seen[key]) continue; seen[key] = 1; uniq.push(out[k]);
  }
  return uniq;
}
function norm(s){ return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
function findMatches(q, n){
  if (!q) return [];
  var nq = norm(q), starts = [], has = [];
  for (var i = 0; i < S.index.length && (starts.length + has.length) < 60; i++){
    var e = S.index[i], nl = norm(e.label);
    var p = nl.indexOf(nq);
    if (p === 0) starts.push(e); else if (p > 0) has.push(e);
  }
  return starts.concat(has).slice(0, n || 7);
}
function nameIdOf(label){
  if (!S.nameByNorm) return undefined;
  return S.nameByNorm[norm(label)];
}
// pick the node of this street that is FURTHEST from the other end, so the race runs the street
function endpointNode(label, pt, ox, oy){
  var id = nameIdOf(label), G = S.G;
  if (id !== undefined && G.nameNodes[id]){
    var list = G.nameNodes[id], best = -1, bd = -1;
    for (var i = 0; i < list.length; i++){
      var n = list[i]; if (G.comp[n] !== G.main) continue;
      var dx = G.X[n] - ox, dy = G.Y[n] - oy, d = dx*dx + dy*dy;
      if (d > bd){ bd = d; best = n; }
    }
    if (best >= 0) return best;
  }
  if (pt) return snap(G, proj(pt)[0], proj(pt)[1]);
  return -1;
}
function resolvePair(ea, eb){
  var a0 = resolveEntry(ea), b0 = resolveEntry(eb);
  if (a0 < 0 || b0 < 0) return [a0, b0];
  var a = endpointNode(ea.label, ea.pt, S.G.X[b0], S.G.Y[b0]);
  var b = endpointNode(eb.label, eb.pt, S.G.X[a >= 0 ? a : a0], S.G.Y[a >= 0 ? a : a0]);
  return [a >= 0 ? a : a0, b >= 0 ? b : b0];
}
function resolveEntry(e){
  if (!e) return -1;
  if (e.pt){ var q = proj(e.pt); return snap(S.G, q[0], q[1]); }
  if (e.node !== undefined){
    if (S.G.comp[e.node] === S.G.main) return e.node;
    return snap(S.G, S.G.X[e.node], S.G.Y[e.node]);
  }
  return -1;
}
function attachAutocomplete(input){
  var box = null, sel = -1, cur = [];
  function close(){ if (box){ box.remove(); box = null; } sel = -1; }
  function open(){
    close();
    cur = findMatches(input.value, 7);
    if (!cur.length) return;
    box = document.createElement('div'); box.className = 'sug';
    cur.forEach(function(e, i){
      var b = document.createElement('button'); b.type = 'button';
      b.textContent = e.label + (e.mark ? '  ★' : '');
      b.onmousedown = function(ev){ ev.preventDefault(); input.value = e.label; input._entry = e; close(); };
      box.appendChild(b);
    });
    input.parentNode.appendChild(box);
    box.style.top = (input.offsetTop + input.offsetHeight + 2) + 'px';
  }
  input.addEventListener('input', function(){ input._entry = null; open(); });
  input.addEventListener('blur', function(){ setTimeout(close, 120); });
  input.addEventListener('keydown', function(e){
    if (!box) return;
    var btns = box.querySelectorAll('button');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){
      e.preventDefault();
      sel = Math.max(0, Math.min(btns.length-1, sel + (e.key === 'ArrowDown' ? 1 : -1)));
      btns.forEach(function(b,i){ b.classList.toggle('hl', i === sel); });
    } else if (e.key === 'Enter' && sel >= 0){
      e.preventDefault(); input.value = cur[sel].label; input._entry = cur[sel]; close();
    } else if (e.key === 'Escape') close();
  });
}

// ---------------------------------------------------------------- UI
function renderRaces(){
  var d = CITIES[S.cityId]; if (!d) return;
  var html = '';
  for (var i = 0; i < d.r.length; i++){
    var r = d.r[i];
    html += '<button class="race' + (S.routeId === r.id ? ' on' : '') + '" data-i="' + i + '">' +
            '<span><b>' + esc(r.t) + '</b><small>' + esc(r.a.n) + ' → ' + esc(r.b.n) + '</small></span>' +
            '<span class="king">' + '★'.repeat(r.tier) + '</span></button>';
  }
  if (!html) html = '<p class="hint">Aquí aún no hay carreras oficiales. Márcate una en el mapa y reta a alguien: la primera corona es tuya.</p>';
  var box = $('races'); box.innerHTML = html;
  box.querySelectorAll('.race').forEach(function(b){
    b.onclick = function(){ racePreset(d.r[+b.dataset.i]); };
  });
}

async function selectCity(id){
  S.cityId = id;
  $('loading').classList.remove('off');
  S.phase = 'idle'; S.circuit = null; S.car = null; S.routeId = null;
  var d;
  try { d = await loadCity(id); } catch(e){ $('loading').textContent = 'OpenStreetMap no responde ahora mismo. Vuelve a tocar la ciudad para reintentar.'; $('loading').classList.remove('off'); return; }
  S.G = buildGraph(d);
  S.index = searchIndex();
  S.kings = {};
  renderRaces(); updateTerritory();
  if (d.r && d.r.length){
    $('from').value = d.r[0].a.n; $('from')._entry = { label: d.r[0].a.n, pt: d.r[0].a.p, mark: true };
    $('to').value = d.r[0].b.n;   $('to')._entry   = { label: d.r[0].b.n, pt: d.r[0].b.p, mark: true };
  }
  $('loading').classList.add('off');
  watchKings(id);
  if (S.pendingRoute && S.pendingRoute.fn){
    var pf = S.pendingRoute.fn; S.pendingRoute = null; pf();
  } else if (S.pendingRoute){
    var pr = S.pendingRoute; S.pendingRoute = null;
    raceLatLon(pr.a, pr.b, pr.title, pr.id).then(function(ok){ if (ok && pr.ch) showChallenge(pr.ch); });
  } else if (d.r && d.r.length) racePreset(d.r[0]);
  else autoRoute();
  S.decor = null;
  loadDecor(id).then(function(raw){
    if (S.cityId === id) S.decor = buildDecor(raw, d.c);
  });
}

function generate(){
  var fi = $('from'), ti = $('to');
  var fe = fi._entry || findMatches(fi.value, 1)[0];
  var te = ti._entry || findMatches(ti.value, 1)[0];
  if (!fe || !te){
    if (fi.value.trim() && ti.value.trim()) return generateWorld(fi.value.trim(), ti.value.trim());
    $('genhint').textContent = 'Escribe la salida y la meta.'; return;
  }
  var pr = resolvePair(fe, te), a = pr[0], b = pr[1];
  if (a < 0 || b < 0 || a === b){ $('genhint').textContent = 'Elige dos puntos distintos.'; return; }
  var id = S.cityId + '_' + slug(fe.label).slice(0,40) + '__' + slug(te.label).slice(0,40);
  $('genhint').textContent = 'Trazando…';
  buildRaceFromNodes(a, b, fe.label + ' → ' + te.label, id).then(function(ok){
    $('genhint').textContent = ok
      ? 'Circuito generado: ' + Math.round(S.circuit.total) + ' m, ' + S.circuit.sect.length + ' calles en juego.'
      : 'No hay ruta entre esos dos puntos dentro del mapa cargado.';
    renderRaces();
  });
}

// input
var KEYMAP = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right',
               w:'up', s:'down', a:'left', d:'right', W:'up', S:'down', A:'left', D:'right' };
window.addEventListener('keydown', function(e){
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  var k = KEYMAP[e.key];
  if (k){ S.keys[k] = 1; e.preventDefault(); }
  if (e.key === 'r' || e.key === 'R') startCountdown();
  if (e.key === ' '){ e.preventDefault(); S.keys.up = 1; }
  if (e.key === 'Shift') S.keys.hb = 1;
  if ((e.key === 't' || e.key === 'T') && SK.respawn) SK.respawn();
});
window.addEventListener('keyup', function(e){
  var k = KEYMAP[e.key]; if (k) S.keys[k] = 0;
  if (e.key === ' ') S.keys.up = 0;
  if (e.key === 'Shift') S.keys.hb = 0;
});
['tL','tR','tG','tB'].forEach(function(id){
  var el = $(id), key = { tL:'l', tR:'r', tG:'g', tB:'b' }[id];
  function on(e){ e.preventDefault(); S.touch[key] = 1; el.classList.add('down'); }
  function off(e){ e.preventDefault(); S.touch[key] = 0; el.classList.remove('down'); }
  el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off);
  el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off);
});
if (matchMedia('(pointer:coarse)').matches && !SK.newControls) $('touch').classList.add('on');

function setSkin(k){
  S.skin = k;
  $('skinDay').classList.toggle('on', k === 'day');
  $('skinNight').classList.toggle('on', k === 'night');
  if ($('skinDusk')) $('skinDusk').classList.toggle('on', k === 'dusk');
  try { localStorage.setItem('sk_skin', k); } catch(e){}
}
$('skinDay').onclick = function(){ setSkin('day'); };
$('skinNight').onclick = function(){ setSkin('night'); };
if ($('skinDusk')) $('skinDusk').onclick = function(){ setSkin('dusk'); };
try { var sk0 = localStorage.getItem('sk_skin'); setSkin(sk0 === 'night' || sk0 === 'dusk' ? sk0 : 'day'); } catch(e){ setSkin('day'); }

// ---------------------------------------------------------------- cualquier sitio del mundo, marcar en el mapa, retos
// La ciudad no tiene que estar en la lista: se busca el sitio en OpenStreetMap (Nominatim),
// se baja el callejero de una caja de unos 4 km alrededor y se corre ahí.
var GEO = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&accept-language=es&q=';
var geoLast = 0;
function geocode(q){
  var wait = Math.max(0, geoLast + 1100 - Date.now());      // Nominatim pide como mucho 1 consulta por segundo
  geoLast = Date.now() + wait;
  return new Promise(function(res){ setTimeout(res, wait); }).then(function(){
    return fetch(GEO + encodeURIComponent(q), { headers: { 'Accept': 'application/json' } });
  }).then(function(r){ return r.ok ? r.json() : []; }).then(function(a){
    if (!a || !a.length) return null;
    var x = a[0], ad = x.address || {};
    return { lat: +x.lat, lon: +x.lon,
             city: ad.city || ad.town || ad.village || ad.municipality || ad.county || ad.state || x.name || q,
             label: x.name || String(x.display_name || q).split(',')[0] };
  }).catch(function(){ return null; });
}
function kmBetween(a, b){
  var dy = (a[0] - b[0]) * 111.32, dx = (a[1] - b[1]) * 111.32 * Math.cos(a[0] * Math.PI/180);
  return Math.hypot(dx, dy);
}
function builtinAt(lat, lon){
  var L = window.SK_CITIES || [];
  for (var i = 0; i < L.length; i++){
    var c = L[i]; if (c.world) continue;
    var b = c.bbox.split(',').map(Number);
    if (lat >= b[0] && lat <= b[2] && lon >= b[1] && lon <= b[3]) return c.id;
  }
  return null;
}
function cityMeta(id){ return findSkCity(id) || CITIES[id] || {}; }
function kingKey(id){ return cityMeta(id).king || id; }
function findSkCity(id){ var L = window.SK_CITIES || []; for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; }
// Caja de ~4,4 km alrededor del centro, ampliada para que quepan salida y meta.
function worldCity(name, lat, lon, pts){
  var dLat = 0.02, dLon = 0.02 / Math.cos(lat * Math.PI/180);
  var b = [lat - dLat, lon - dLon, lat + dLat, lon + dLon];
  (pts || []).forEach(function(p){
    b[0] = Math.min(b[0], p[0] - 0.005); b[2] = Math.max(b[2], p[0] + 0.005);
    b[1] = Math.min(b[1], p[1] - 0.006); b[3] = Math.max(b[3], p[1] + 0.006);
  });
  var id = 'w-' + slug(name).slice(0, 24) + '-' + lat.toFixed(3) + '_' + lon.toFixed(3);
  var c = findSkCity(id);
  if (!c){
    c = { id: id, name: name, c: [+lat.toFixed(5), +lon.toFixed(5)], world: true, king: 'w-' + slug(name).slice(0, 30),
          bbox: b.map(function(v){ return v.toFixed(4); }).join(','), r: [] };
    window.SK_CITIES.push(c);
  }
  if (!Array.prototype.some.call(citySel.options, function(o){ return o.value === id; })){
    var o = document.createElement('option'); o.value = id; o.textContent = name;
    citySel.insertBefore(o, citySel.querySelector('option[value="__world"]'));
  }
  return c;
}
function openPlace(name, lat, lon, pts){
  var bi = builtinAt(lat, lon);
  if (bi && (!pts || pts.every(function(p){ return builtinAt(p[0], p[1]) === bi; }))){ citySel.value = bi; return selectCity(bi); }
  var c = worldCity(name, lat, lon, pts);
  citySel.value = c.id;
  return selectCity(c.id);
}
function toLatLon(x, y){
  var d = CITIES[S.cityId], MLON = 111320 * Math.cos(d.c[0] * Math.PI/180);
  return [d.c[0] + y / 111320, d.c[1] + x / MLON];
}
function nearestName(n){
  var G = S.G, x = G.X[n], y = G.Y[n], C = G.CELL, gi = Math.floor(x/C), gj = Math.floor(y/C), best = null, bd = Infinity;
  for (var i = gi-1; i <= gi+1; i++) for (var j = gj-1; j <= gj+1; j++){
    var arr = G.grid.get(i*100000 + j); if (!arr) continue;
    for (var k = 0; k < arr.length; k++){
      var g = G.segs[arr[k]]; if (!G.names[g[5]]) continue;
      var dx = g[2]-g[0], dy = g[3]-g[1], L2 = dx*dx + dy*dy, t = L2 ? ((x-g[0])*dx + (y-g[1])*dy)/L2 : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      var qx = g[0] + dx*t - x, qy = g[1] + dy*t - y, d = qx*qx + qy*qy;
      if (d < bd){ bd = d; best = G.names[g[5]]; }
    }
  }
  return best || 'Calle sin nombre';
}
function routeIdFor(a, b){
  return 'p_' + kingKey(S.cityId).slice(0, 28) + '_' + a[0].toFixed(4) + '_' + a[1].toFixed(4) + '_' + b[0].toFixed(4) + '_' + b[1].toFixed(4);
}
function raceLatLon(a, b, title, id){
  var pa = proj(a), pb = proj(b), na = snap(S.G, pa[0], pa[1]), nb = snap(S.G, pb[0], pb[1]);
  if (na < 0 || nb < 0 || na === nb){ toast('No encuentro calles para esos dos puntos.', true); return Promise.resolve(false); }
  var t = title || (nearestName(na) + ' → ' + nearestName(nb));
  return buildRaceFromNodes(na, nb, t, id || routeIdFor(a, b)).then(function(ok){
    if (!ok) toast('No hay ruta entre esos dos puntos.', true);
    else {
      $('from').value = nearestName(na); $('to').value = nearestName(nb); $('from')._entry = null; $('to')._entry = null; renderRaces();
      $('genhint').textContent = 'Circuito: ' + Math.round(S.circuit.total) + ' m y ' + S.circuit.sect.length + ' calles en juego. Retar a alguien le manda esta misma ruta.';
      lastCity = S.cityId;
    }
    return ok;
  });
}
// ciudad sin carreras oficiales: una primera de ~1 km desde el centro, para que se pueda jugar ya
function autoRoute(){
  var d = CITIES[S.cityId], G = S.G, c = proj(d.c), a = snap(G, c[0], c[1]); if (a < 0) return;
  var best = -1, bd = Infinity;
  for (var n = 0; n < G.X.length; n += 3){
    if (G.comp[n] !== G.main) continue;
    var dd = Math.abs(Math.hypot(G.X[n] - G.X[a], G.Y[n] - G.Y[a]) - 1000);
    if (dd < bd){ bd = dd; best = n; }
  }
  if (best < 0) return;
  var A0 = toLatLon(G.X[a], G.Y[a]), B0 = toLatLon(G.X[best], G.Y[best]);
  raceLatLon(A0, B0, null, null);
}

// --- elegir salida y meta tocando el mapa
function startPick(){
  if (!S.G) return;
  S.pick = { step: 0, a: -1, b: -1 };
  S.phase = 'idle';
  $('results').classList.remove('on');
  if (SK.setView) SK.setView('top');
  if (S.car){ S.cam.x = S.car.x; S.cam.y = S.car.y; }
  S.cam.z = 0.55;
  $('pickbar').hidden = false; pickText();
}
function endPick(){ S.pick = null; $('pickbar').hidden = true; }
function pickText(){
  $('picktxt').innerHTML = S.pick.step === 0 ? 'Toca la <b>salida</b> · arrastra y haz zoom para moverte'
                                            : 'Ahora toca la <b>meta</b>';
}
function pickAt(ox, oy){
  var r = cv.getBoundingClientRect();
  var x = S.cam.x + (ox - r.width/2) / S.cam.z, y = S.cam.y - (oy - r.height/2) / S.cam.z;
  var n = snap(S.G, x, y); if (n < 0) return;
  if (S.pick.step === 0){ S.pick.a = n; S.pick.step = 1; pickText(); return; }
  if (n === S.pick.a) return;
  S.pick.b = n;
  var a = S.pick.a, b = n;
  raceLatLon(toLatLon(S.G.X[a], S.G.Y[a]), toLatLon(S.G.X[b], S.G.Y[b]), null, null).then(function(ok){
    if (ok){ endPick(); if (SK.setView) SK.setView('chase'); }
    else { S.pick.step = 0; S.pick.a = S.pick.b = -1; pickText(); }
  });
}
function drawPick(sx, sy, z){
  if (!S.pick) return;
  [[S.pick.a, 'SALIDA', '#3FD08A'], [S.pick.b, 'META', '#FF5B3D']].forEach(function(m){
    if (m[0] < 0) return;
    var X = sx(S.G.X[m[0]]), Y = sy(S.G.Y[m[0]]);
    ctx.fillStyle = m[2]; ctx.beginPath(); ctx.arc(X, Y, 9 * S.dpr, 0, 6.283); ctx.fill();
    ctx.lineWidth = 3 * S.dpr; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
    ctx.font = '700 ' + (12 * S.dpr) + 'px system-ui'; ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center';
    ctx.fillText(m[1], X, Y - 16 * S.dpr);
  });
}
(function(){
  var pts = new Map(), down = null;
  cv.addEventListener('pointerdown', function(e){
    if (!S.pick) return;
    try { cv.setPointerCapture(e.pointerId); } catch(err){}
    pts.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
    if (pts.size === 1) down = { moved: 0 };
  });
  cv.addEventListener('pointermove', function(e){
    if (!S.pick || !pts.has(e.pointerId)) return;
    var prev = pts.get(e.pointerId);
    if (pts.size === 1){
      var dx = e.offsetX - prev.x, dy = e.offsetY - prev.y;
      S.cam.x -= dx / S.cam.z; S.cam.y += dy / S.cam.z;
      if (down) down.moved += Math.abs(dx) + Math.abs(dy);
    } else if (pts.size === 2){
      var other = null; pts.forEach(function(v, k){ if (k !== e.pointerId) other = v; });
      var d0 = Math.hypot(prev.x - other.x, prev.y - other.y), d1 = Math.hypot(e.offsetX - other.x, e.offsetY - other.y);
      if (d0 > 0) S.cam.z = Math.max(0.08, Math.min(6, S.cam.z * d1 / d0));
      if (down) down.moved += 99;
    }
    pts.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
  });
  function up(e){
    if (!S.pick) return;
    var was = pts.has(e.pointerId); pts.delete(e.pointerId);
    if (was && down && down.moved < 8 && pts.size === 0) pickAt(e.offsetX, e.offsetY);
    if (pts.size === 0) down = null;
  }
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', function(e){ pts.delete(e.pointerId); down = null; });
  cv.addEventListener('wheel', function(e){
    if (!S.pick) return; e.preventDefault();
    var r = cv.getBoundingClientRect(), ox = e.offsetX - r.width/2, oy = e.offsetY - r.height/2;
    var wx = S.cam.x + ox / S.cam.z, wy = S.cam.y - oy / S.cam.z;
    S.cam.z = Math.max(0.08, Math.min(6, S.cam.z * Math.pow(1.0018, -e.deltaY)));
    S.cam.x = wx - ox / S.cam.z; S.cam.y = wy + oy / S.cam.z;      // zoom hacia donde apunta el ratón
  }, { passive: false });
})();

// --- retos por enlace: la misma ruta, con el tiempo de quien reta
function topLoc(){ try { return window.top.location; } catch(e){ return location; } }
function shareUrl(){
  var R = S.circuit, d = cityMeta(S.cityId); if (!R || !d.id) return null;
  var a = toLatLon(R.P[0], R.P[1]), b = toLatLon(R.P[R.P.length-2], R.P[R.P.length-1]);
  var q = new URLSearchParams();
  q.set('c', d.world ? 'w' : d.id);
  if (d.world) q.set('p', d.name);
  q.set('a', a[0].toFixed(5) + ',' + a[1].toFixed(5));
  q.set('b', b[0].toFixed(5) + ',' + b[1].toFixed(5));
  q.set('r', S.routeId); q.set('t', S.routeTitle);
  var me = getHandle(); if (me) q.set('n', me);
  if (S.best) q.set('ms', Math.round(S.best));
  var L = topLoc(), origin = (L.origin && L.origin !== 'null') ? L.origin : 'https://kingofstreets.com';
  if (/localhost|127\.0\.0\.1/.test(origin)) origin = 'https://kingofstreets.com';
  return origin + '/?' + q.toString();
}
function doShare(){
  if (!getHandle()){
    var h = window.prompt('¿Con qué nombre retas? Es el que verá tu rival.');
    if (h && h.trim()){ setHandle(h); $('handle').value = S.handle; }
  }
  var url = shareUrl(); if (!url) return;
  var me = getHandle() || 'Alguien', d = CITIES[S.cityId];
  var text = S.best
    ? me + ' ha hecho ' + fmt(S.best) + ' en ' + S.routeTitle + ' (' + d.name + '). ¿Se lo quitas?'
    : 'Te reto en ' + S.routeTitle + ' (' + d.name + '). Calles reales, un rey por calle.';
  function copy(){
    if (navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard.writeText(text + ' ' + url).then(function(){ toast('Reto copiado. Pégalo en WhatsApp, Instagram o donde quieras.'); },
        function(){ window.prompt('Copia este enlace', url); });
    else window.prompt('Copia este enlace', url);
  }
  if (navigator.share) navigator.share({ title: 'King of Streets', text: text, url: url }).catch(function(err){ if (!err || err.name !== 'AbortError') copy(); });
  else copy();
}
function readChallenge(){
  var q = null;
  [topLoc().search, location.search].some(function(s){ var u = new URLSearchParams(s || ''); if (u.get('a') && u.get('b')){ q = u; return true; } return false; });
  return readChallengeQ(q);
}
function readChallengeQ(q){
  if (typeof q === 'string') q = new URLSearchParams(q);
  if (!q || !q.get('a') || !q.get('b')) return null;
  var a = q.get('a').split(',').map(Number), b = q.get('b').split(',').map(Number);
  if (a.length !== 2 || b.length !== 2 || a.concat(b).some(isNaN) || kmBetween(a, b) > 12) return null;
  return { c: q.get('c') || '', p: (q.get('p') || '').slice(0, 60), a: a, b: b,
           t: (q.get('t') || '').slice(0, 120), r: (q.get('r') || '').slice(0, 120),
           n: (q.get('n') || '').slice(0, 14), ms: +q.get('ms') || 0 };
}
function showChallenge(ch){
  if (!ch || !ch.n) return;
  var el = $('challenge');
  el.innerHTML = '<b>' + esc(ch.n) + '</b> te reta' + (ch.ms ? ': <b>' + fmt(ch.ms) + '</b>' : '') + ' · ¿se lo quitas?';
  el.hidden = false;
  setTimeout(function(){ el.hidden = true; }, 9000);
}
function startChallenge(ch){
  var mid = [(ch.a[0] + ch.b[0]) / 2, (ch.a[1] + ch.b[1]) / 2];
  S.pendingRoute = { a: ch.a, b: ch.b, title: ch.t || null, id: ch.r || null, ch: ch };
  if (ch.c && ch.c !== 'w' && findSkCity(ch.c) && !findSkCity(ch.c).world){ citySel.value = ch.c; return selectCity(ch.c); }
  return openPlace(ch.p || 'Reto', mid[0], mid[1], [ch.a, ch.b]);
}

// --- "RACE THIS ROUTE" con calles de cualquier sitio: si no están en la ciudad cargada, se buscan en el mundo
function generateWorld(fromText, toText){
  $('genhint').textContent = 'Buscando esas calles en el mapa del mundo…';
  return geocode(fromText).then(function(A){
    if (!A) throw new Error('No encuentro "' + fromText + '". Prueba añadiendo la ciudad: "' + fromText + ', Málaga".');
    return geocode(toText).then(function(B){
      if (!B) throw new Error('No encuentro "' + toText + '". Prueba añadiendo la ciudad.');
      var a = [A.lat, A.lon], b = [B.lat, B.lon], km = kmBetween(a, b);
      if (km > 9) throw new Error('Están a ' + km.toFixed(1) + ' km. Elige dos puntos a menos de 9 km.');
      if (km < 0.12) throw new Error('Están demasiado cerca. Separa más la salida y la meta.');
      S.pendingRoute = { a: a, b: b, title: A.label + ' → ' + B.label, id: null };
      $('genhint').textContent = 'Bajando el callejero de ' + A.city + '…';
      return openPlace(A.city, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, [a, b]);
    });
  }).catch(function(e){ $('genhint').textContent = e.message || 'No he podido buscar esas calles ahora.'; });
}

$('gen').onclick = generate;
$('again').onclick = function(){ $('results').classList.remove('on'); startCountdown(); };
$('close').onclick = function(){ $('results').classList.remove('on'); S.phase = 'ready'; };
$('handle').addEventListener('change', function(){ setHandle(this.value); });
$('handle').addEventListener('blur', function(){ setHandle(this.value); });
attachAutocomplete($('from')); attachAutocomplete($('to'));

var citySel = $('city');
CITY_LIST.forEach(function(c){
  var o = document.createElement('option'); o.value = c[0]; o.textContent = c[1]; citySel.appendChild(o);
});
var wOpt = document.createElement('option'); wOpt.value = '__world'; wOpt.textContent = 'Cualquier sitio del mundo…';
citySel.appendChild(wOpt);
citySel.value = 'sevilla';
var lastCity = 'sevilla';
citySel.onchange = function(){
  if (this.value === '__world'){ $('where').focus(); this.value = lastCity; return; }
  lastCity = this.value; selectCity(this.value);
};
function goWhere(){
  var q = $('where').value.trim(); if (!q) return;
  $('whereGo').disabled = true; $('genhint').textContent = 'Buscando ' + q + '…';
  geocode(q).then(function(g){
    $('whereGo').disabled = false;
    if (!g){ $('genhint').textContent = 'No encuentro "' + q + '". Prueba con ciudad y país.'; return; }
    $('where').value = ''; $('genhint').textContent = 'Bajando el callejero de ' + g.city + '…';
    openPlace(g.city, g.lat, g.lon, null);
  });
}
$('whereGo').onclick = goWhere;
$('where').addEventListener('keydown', function(e){ if (e.key === 'Enter') goWhere(); });
$('pickMap').onclick = startPick;
$('pickCancel').onclick = function(){ endPick(); if (SK.setView) SK.setView('chase'); if (S.circuit) startCountdown(); };
$('shareRoute').onclick = doShare;
$('share2').onclick = doShare;

// la pagina que embebe el juego nos dice quien ha iniciado sesion
window.addEventListener('message', function(ev){
  var d = ev.data;
  if (!d || d.__sk !== 'auth') return;
  var h = (d.handle || '').trim().slice(0, 14);
  S.signed = !!d.signedIn;
  if (h && h !== S.handle){
    S.handle = h;
    try { localStorage.setItem('sk_handle', h); } catch(e){}
    var el = $('handle'); if (el) el.value = h;
    updateTerritory();
  }
  var el2 = $('handle');
  if (el2){
    el2.readOnly = !!d.signedIn;
    el2.title = d.signedIn ? 'Tu nombre viene de tu cuenta' : 'Elige tu nombre de piloto';
  }
});

// boot
resize();
$('handle').value = getHandle();
updateTerritory();
try { if (window.parent !== window) window.parent.postMessage({ __sk:'hello' }, '*'); } catch(e){}
requestAnimationFrame(frame);
// arranca cuando están cargados todos los scripts (extras.js decide: reto, calle del día, primera vez…)
// primera visita: la ciudad de serie más cercana a tu zona horaria; luego, la última que jugaste
function guessCity(){
  var has = function(id){ return (window.SK_CITIES || []).some(function(c){ return c.id === id && !c.world; }); };
  try { var last = localStorage.getItem('sk_lastcity'); if (last && has(last)) return last; } catch(e){}
  var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch(e){}
  var TZ = { 'Europe/Madrid': 'sevilla', 'Atlantic/Canary': 'sevilla', 'Europe/Lisbon': 'sevilla', 'Europe/Paris': 'paris', 'Europe/Brussels': 'paris', 'Europe/London': 'london', 'Europe/Dublin': 'london',
    'America/New_York': 'newyork', 'America/Toronto': 'newyork', 'Asia/Tokyo': 'tokyo', 'Asia/Seoul': 'tokyo' };
  var id = TZ[tz] || (/^America\//.test(tz) ? 'newyork' : /^Asia\//.test(tz) ? 'tokyo' : 'sevilla');
  return has(id) ? id : 'sevilla';
}
SK.guessCity = guessCity;
SK.boot = function(){
  if (SK._booted) return; SK._booted = true;
  var CH = readChallenge();
  if (CH) startChallenge(CH);
  else if (!(SK.bootHook && SK.bootHook())){ var gc = guessCity(); if (citySel) citySel.value = gc; selectCity(gc); }
};
window.addEventListener('load', function(){ SK.boot(); });
SK.api = { S:S, NET:NET, deviceId:deviceId, getHandle:getHandle, setHandle:setHandle, toast:toast, fmt:fmt, esc:esc,
  startChallenge:startChallenge, prepGhost:prepGhost, sectorSplit:sectorSplit, openPlace:openPlace, raceLatLon:raceLatLon, selectCity:selectCity, geocode:geocode,
  kmBetween:kmBetween, toLatLon:toLatLon, proj:proj, cityMeta:cityMeta, kingKey:kingKey, shareUrl:shareUrl, doShare:doShare,
  startCountdown:startCountdown, snap:snap, nearestName:nearestName, slug:slug, openDb:openDb, readChallengeQ:readChallengeQ,
  SKINS:SKINS, sk:sk, HALF:HALF, decodePoly:decodePoly, pointAt:pointAt, CITIES:CITIES, DECOR:DECOR, loadDecor:loadDecor, $:$ };
SK.dbg = { S:S, searchIndex:searchIndex, resolvePair:resolvePair, norm:norm, buildGraph:buildGraph, route:route, makeCircuit:makeCircuit, step:step, snap:snap, proj:proj, pointAt:pointAt, surfaceAt:surfaceAt, newCar:newCar, slug:slug, setCircuit:setCircuit, CITIES:CITIES };
})();
