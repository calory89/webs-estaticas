// comments: _notes/kolaboro-worker-comments.txt
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const ML = '4.7.1', ML_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/' + ML + '/';
let MEMO = {};
async function loadOne(env, name) {
const m = MEMO[name]; if (m && (m.a || Date.now() - m.t < 600000)) return m.v;
let r = null, a = false;
try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); a = !!(r && r.ok); } catch (e) { r = null; }
if (!r || !r.ok) { try { r = await fetch(ORIGIN + '/data/' + name + '?w=1', { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
const v = r && r.ok ? await r.json().catch(() => null) : null;
MEMO[name] = { t: Date.now(), v, a: a && v != null }; return v;
}
export async function seeData(env) {
const [ph, d3, si] = await Promise.all([loadOne(env, 'street-photos.json'), loadOne(env, 'site-3d.json'), loadOne(env, 'media-i18n.json')]);
if (si && si.see) S = si.see;
return { ph, d3, v: ((ph && ph.updated) || '') + '/' + ((d3 && d3.updated) || '') };
}
export const accM = dec => dec >= 5 ? 15 : dec === 4 ? 30 : 100;
let S = { en: {} };
const t = (lang, k, v) => { const s = (S[lang] && S[lang][k]) || S.en[k] || ''; return v && typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const phk = (l, n) => { const a = n % 10, b = n % 100; return n === 1 ? 'ph1' : l === 'ru' && a === 1 && b !== 11 ? 'phr' : l === 'ar' ? (n === 2 ? 'ph2' : b >= 3 && b <= 10 ? 'phn' : 'ph11') : 'phn'; };
export const seeToc = lang => t(lang, 'toc');
export const seeHeading = lang => t(lang, 'h');
const SRCN = { panoramax: 'Panoramax', kartaview: 'KartaView', commons: 'Wikimedia Commons' };
const adiff = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
const dtf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'd' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.DateTimeFormat(L, o)); };
const nmf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'n' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.NumberFormat(L, o)); };
export function seeHtml(sd, id, lang, fd, name) {
if (!sd) return '';
const php = sd.ph && sd.ph.projects && sd.ph.projects[id], d3 = sd.d3 && sd.d3.projects && sd.d3.projects[id];
if (!php && !d3) return '';
const num = v => { try { return nmf(lang === 'en' ? 'en-GB' : lang).format(v); } catch (e) { return String(v); } };
const lat = d3 ? d3.lat : null, lng = d3 ? d3.lng : null, dec = d3 ? d3.dec : 3, acc = accM(dec);
let h = TB.kbx_see__s.CSS + '<div class="ksee">';
if (php) {
h += '<h3>' + esc(t(lang, 'ph')) + '</h3>';
const L = php.ph || [];
if (!L.length) { const ok = ['panoramax', 'kartaview', 'commons'].filter(k => !(php.errors || []).includes(k)).map(k => SRCN[k]); if (ok.length) h += '<p>' + esc(t(lang, 'ph0', { d: fd(php.checked), s: ok.join(', ') })) + '</p>'; }
else {
h += '<p class="ki">' + esc(t(lang, phk(lang, L.length), { n: num(L.length) })) + '</p><ul class="ksee-ph">' + L.map((x, i) => {
const sn = SRCN[x.src] || x.src, alt = sn + (x.date ? ', ' + fd(x.date) : '') + ', ' + num(x.d) + ' m' + (name ? ', ' + name : '');
const ex = [x.az != null && x.to != null && adiff(x.az, x.to) <= 60 ? t(lang, 'face') : '', x.pano ? t(lang, 'pano') : '', x.src === 'commons' ? t(lang, 'commons') : ''].filter(Boolean).join(', ');
return '<li><a class="im" href="' + esc(x.page) + TB.kbx_see__t.k0 + encodeURIComponent(id) + '/' + i + '.jpg?v=' + encodeURIComponent(sd.ph.updated || '') + '" alt="' + esc(alt) + TB.kbx_see__t.k1 +
'<div class="tx"><b>' + esc(x.date ? t(lang, 'cap', { d: fd(x.date), m: num(x.d) }) : t(lang, 'nod', { m: num(x.d) })) + '</b>' + (ex ? '<span>' + esc(ex) + '</span>' : '') +
'<span>' + esc(t(lang, 'lic', { l: x.lic })) + (x.lic_url ? ' <a href="' + esc(x.lic_url) + TB.kbx_see__t.k2 + esc(x.lic) + '</a>' : '') + '</span>' +
'<a class="k-src" href="' + esc(x.page) + TB.kbx_see__t.k3 + esc(t(lang, 'open', { s: sn })) + '</a></div></li>';
}).join('') + '</ul>';
}
h += '<p class="ksat-lim">' + esc(t(lang, 'phlim', { a: acc })) + '</p>';
if (lat != null) h += '<p class="ksat-lim">' + esc(t(lang, 'other')) + TB.kbx_see__s.k0 + lat + ',' + lng + TB.kbx_see__t.k4 + esc(t(lang, 'gsv')) + TB.kbx_see__t.k5 + lat + '&amp;lng=' + lng + TB.kbx_see__t.k6 + esc(t(lang, 'mpl')) + '</a></li></ul>';
h += '<p class="ksat-src">' + ['panoramax', 'kartaview', 'commons'].map(k => { const s = sd.ph.sources[k]; return '<a class="src" href="' + esc(s.url) + '" rel="noopener" target="_blank">' + esc(s.name) + '</a>'; }).join(' ') +
TB.kbx_see__t.k7 + esc(t(lang, 'method')) + ', ' + esc(t(lang, 'upd', { d: fd(php.checked || sd.ph.updated) })) + '</a></p>';
}
if (d3) {
const rel = String(sd.d3.release || '').replace(/\.\d+$/, '');
h += '<h3>' + esc(t(lang, 'd3')) + '</h3><p>' + esc(d3.n ? t(lang, 'd3i', { n: num(d3.n), k: num(d3.n_in) }) : t(lang, 'd3i0', { rel: fd(rel) })) + '</p>' +
'<div class="ksee-3d" data-id="' + esc(id) + '" data-lat="' + d3.lat + '" data-lng="' + d3.lng + '" data-acc="' + acc + '" data-v="' + esc(sd.d3.updated || '') + '" data-l="' + esc(t(lang, 'd3l')) + '" data-e="' + esc(t(lang, 'd3e')) + '" data-r="' + esc(t(lang, 'reset')) + '">' +
TB.kbx_see__t.k8 + esc(t(lang, 'd3b')) + TB.kbx_see__t.k9 + esc(t(lang, 'd3s')) + '</span></div>' +
TB.kbx_see__t.k10 + esc(t(lang, 'd3') + (name ? ': ' + name : '')) + TB.kbx_see__t.k11 + esc(t(lang, 'd3help')) + '</p>' +
TB.kbx_see__t.k12 + esc(t(lang, 'lgp')) + '</li><li><i class="a"></i>' + esc(t(lang, 'lga', { a: acc, dec })) + '</li><li><i class="c"></i>' + esc(t(lang, 'lgc')) + '</li>' +
(d3.n ? '<li><i class="k"></i>' + esc(t(lang, 'lgk')) + '</li><li><i class="u"></i>' + esc(t(lang, 'lgu')) + '</li>' : '') + '</ul></div>' +
'<p class="ksat-lim">' + esc(t(lang, 'd3lim')) + '</p>' +
'<p class="ksat-src">' + esc(sd.d3.source.attribution) + '. <a class="src" href="' + esc(sd.d3.source.url) + TB.kbx_see__t.k13 + esc(sd.d3.release) + '</a> <a class="src" href="' + esc(sd.d3.source.licence_url) + TB.kbx_see__t.k14 +
TB.kbx_see__s.k1 +
TB.kbx_see__s.k2 + ML + '</a>' +
TB.kbx_see__t.k15 + esc(t(lang, 'method')) + ', ' + esc(t(lang, 'upd', { d: fd(sd.d3.updated) })) + '</a></p>' +
TB.kbx_see__s.k3 +
TB.kbx_see__s.k4 +
TB.kbx_see__s.k5 + ML + TB.kbx_see__s.k6;
}
return h + '</div>';
}
const VIEWER = `(function(){
var ML="${ML_CDN}";
function css(){if(document.getElementById("ksee-ml-css"))return;var l=document.createElement("link");l.id="ksee-ml-css";l.rel="stylesheet";l.href=ML+"maplibre-gl.min.css";l.integrity="sha384-K282sW/zFjTkrjR/+yr1H+gCukuy4OEYrkXRybV88g7pk+kZZYpNV6SAV59NcgFg";l.crossOrigin="anonymous";document.head.appendChild(l);}
function lib(){return new Promise(function(ok,no){if(window.maplibregl)return ok();var s=document.createElement("script");s.src=ML+"maplibre-gl.min.js";s.integrity="sha384-KKgyz2mG25bKJ1O2PyqTJPlAF8Kw2BpDmsLTNBXslICOBvhTAyF5F0XhLWF2ZovY";s.crossOrigin="anonymous";s.onload=function(){ok()};s.onerror=no;document.head.appendChild(s);});}
function gl(){try{var c=document.createElement("canvas");return !!(c.getContext("webgl2")||c.getContext("webgl"));}catch(e){return false}}
function circle(lat,lng,r,n){var k=Math.cos(lat*Math.PI/180),o=[];for(var i=0;i<=n;i++){var a=i/n*2*Math.PI;o.push([lng+Math.cos(a)*r/(111320*k),lat+Math.sin(a)*r/110540]);}return o;}
window.kSee3D=function(r){
 var m=r.querySelector(".ksee-map"),lat=+r.dataset.lat,lng=+r.dataset.lng,acc=+r.dataset.acc,err=function(){m.innerHTML='<div class="msg">'+r.dataset.e.replace(/</g,"&lt;")+'</div>'};
 if(!gl())return err();
 css();
 Promise.all([lib(),fetch("/api/x/see/3d/"+encodeURIComponent(r.dataset.id)+"?v="+encodeURIComponent(r.dataset.v)).then(function(x){if(!x.ok)throw 0;return x.json()})]).then(function(a){
  var d=a[1],k=Math.cos(lat*Math.PI/180),F=[];
  (d.b||[]).forEach(function(b){var c=b.c,ring=[];for(var i=0;i<c.length;i+=2)ring.push([lng+c[i]/2/(111320*k),lat+c[i+1]/2/110540]);ring.push(ring[0]);
   var h=b.h||(b.f?b.f*3.2:null);F.push({type:"Feature",properties:{h:h||3,mh:b.mh||0,k:h?1:0,i:b.i||0},geometry:{type:"Polygon",coordinates:[ring]}});});
  m.innerHTML="";
  var dark=document.documentElement.getAttribute("data-theme")==="dark",phone=matchMedia("(pointer:coarse)").matches;
  var map=new maplibregl.Map({container:m,center:[lng,lat],zoom:16.2,pitch:58,bearing:-24,maxPitch:78,minZoom:13,maxZoom:19,attributionControl:false,cooperativeGestures:phone,
   style:{version:8,sources:{
    osm:{type:"raster",tiles:["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],tileSize:256,maxzoom:19,attribution:'<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a>'},
    dem:{type:"raster-dem",tiles:["https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png"],tileSize:256,maxzoom:13,encoding:"terrarium",attribution:'<a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank" rel="noopener">Terrain Tiles (Mapzen, AWS Open Data)</a>'},
    b:{type:"geojson",data:{type:"FeatureCollection",features:F},attribution:'<a href="https://docs.overturemaps.org/attribution/" target="_blank" rel="noopener">Overture Maps (ODbL)</a>'},
    c:{type:"geojson",data:{type:"FeatureCollection",features:[{type:"Feature",properties:{t:"c"},geometry:{type:"LineString",coordinates:circle(lat,lng,150,96)}},{type:"Feature",properties:{t:"a"},geometry:{type:"LineString",coordinates:circle(lat,lng,acc,72)}}]}},
    p:{type:"geojson",data:{type:"Feature",properties:{},geometry:{type:"Point",coordinates:[lng,lat]}}}},
   layers:[{id:"bg",type:"background",paint:{"background-color":dark?"#1B2731":"#E8ECEA"}},
    {id:"osm",type:"raster",source:"osm",paint:{"raster-saturation":-0.55,"raster-opacity":dark?0.55:0.9,"raster-brightness-max":dark?0.75:1}},
    {id:"hs",type:"hillshade",source:"dem",paint:{"hillshade-exaggeration":0.35,"hillshade-shadow-color":"#13222E"}},
    {id:"acc",type:"line",source:"c",filter:["==",["get","t"],"a"],paint:{"line-color":dark?"#E6ECEF":"#13222E","line-width":2,"line-dasharray":[2,2]}},
    {id:"circ",type:"line",source:"c",filter:["==",["get","t"],"c"],paint:{"line-color":"#FF5B14","line-width":3}},
    {id:"bx",type:"fill-extrusion",source:"b",paint:{"fill-extrusion-color":["case",["==",["get","k"],1],["case",["==",["get","i"],1],"#155C75","#4C7C8F"],"#9FB4BF"],"fill-extrusion-height":["get","h"],"fill-extrusion-base":["get","mh"],"fill-extrusion-opacity":0.88,"fill-extrusion-vertical-gradient":true}},
    {id:"pin",type:"circle",source:"p",paint:{"circle-radius":7,"circle-color":"#FF5B14","circle-stroke-color":"#fff","circle-stroke-width":2}}]}});
  map.addControl(new maplibregl.AttributionControl({compact:true}));
  map.addControl(new maplibregl.NavigationControl({visualizePitch:true}),"top-right");
  map.addControl(new maplibregl.FullscreenControl(),"top-right");
  map.on("load",function(){try{map.setTerrain({source:"dem",exaggeration:1})}catch(e){}if(phone){var at=m.querySelector(".maplibregl-ctrl-attrib");if(at){at.classList.remove("maplibregl-compact-show");at.removeAttribute("open");}}});
  map.on("error",function(e){if(window.console&&e&&e.error&&!/tile|Failed to fetch|AJAXError/i.test(String(e.error.message||"")))console.warn("3D view",e.error.message);});
  var bt=document.createElement("button");bt.type="button";bt.className="k-btn k-btn--sm";bt.textContent=r.dataset.r;bt.addEventListener("click",function(){map.easeTo({center:[lng,lat],zoom:16.2,pitch:58,bearing:-24})});
  var bar=r.querySelector(".ksee-bar");if(bar){var g=r.querySelector(".ksee-go");if(g)g.remove();bar.prepend(bt);}
  var hp=r.querySelector(".ksee-help");if(hp)hp.hidden=false;
 }).catch(err);
};
})();`;
export const PATHS = /^\/api\/x\/see\//;
const H = { 'content-type': 'application/json; charset=utf-8', 'x-content-type-options': 'nosniff', 'access-control-allow-origin': '*' };
const out = (o, st, cc) => new Response(JSON.stringify(o), { status: st || 200, headers: Object.assign({ 'cache-control': cc || 'no-store' }, H) });
async function thumb(req, sd, id, n, ctx) {
const rec = sd.ph && sd.ph.projects && sd.ph.projects[id], x = rec && rec.ph && rec.ph[n];
if (!x || !/^https:\/\//.test(x.thumb || '')) return new Response('not found', { status: 404, headers: { 'cache-control': 'public, max-age=3600' } });
const ck = new Request(ORIGIN + '/__see_ph/' + encodeURIComponent(id) + '/' + n + '/' + encodeURIComponent(x.src + ':' + x.id + ':' + x.thumb.slice(-48)));
try { const hit = await caches.default.match(ck); if (hit) return hit; } catch (e) {}
const sk = new Request(ck.url + '/stale');
let r = null, ct = '', buf = null;
for (let a = 0; a < 2 && !buf; a++) {
if (a) await new Promise(ok => setTimeout(ok, 600));
try { r = await fetch(x.thumb, { headers: { 'user-agent': TB.kbx_see__t.UA, accept: TB.kbx_see__t.k16 }, cf: { cacheTtl: 604800, cacheEverything: true }, redirect: 'follow', signal: AbortSignal.timeout(12000) }); } catch (e) { r = null; }
ct = r && r.headers.get('content-type') || '';
if (r && r.ok && /^image\/(jpeg|png|webp)/.test(ct)) { const b = await r.arrayBuffer(); if (b.byteLength <= 2500000) buf = b; }
}
if (!buf) {
try { const st = await caches.default.match(sk); if (st) { const h = new Headers(st.headers); h.set('x-kb-fallback', 'stale'); h.set('cache-control', 'public, max-age=600'); return new Response(st.body, { status: 200, headers: h }); } } catch (e) {}
return new Response(TB.kbx_see__s.k7, { status: 200, headers: { 'content-type': 'image/svg+xml', 'cache-control': 'no-store', 'x-kb-fallback': 'placeholder', 'x-content-type-options': 'nosniff', 'content-security-policy': TB.kbx_see__t.k17 } });
}
const res = new Response(buf, { status: 200, headers: { 'content-type': ct.split(';')[0], 'cache-control': 'public, max-age=604800', 'x-content-type-options': 'nosniff', 'access-control-allow-origin': '*',
'x-photo-source': x.page, 'x-photo-licence': x.lic, 'content-security-policy': "default-src 'none'" } });
try { ctx && ctx.waitUntil && ctx.waitUntil(Promise.all([caches.default.put(ck, res.clone()), caches.default.put(sk, new Response(buf.slice(0), { headers: { 'content-type': ct.split(';')[0], 'cache-control': 'public, max-age=2592000', 'x-photo-source': x.page, 'x-photo-licence': x.lic, 'x-content-type-options': 'nosniff', 'access-control-allow-origin': '*', 'content-security-policy': "default-src 'none'" } }))])); } catch (e) {}
return res;
}
export async function handle(req, u, env, ctx) {
const p = u.pathname;
if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: 'method' }, 405);
try {
if (p === '/api/x/see/3d.js') return new Response(VIEWER, { status: 200, headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'public, max-age=86400', 'x-content-type-options': 'nosniff' } });
const sd = await seeData(env);
let m = p.match(/^\/api\/x\/see\/ph\/([A-Za-z0-9-]{3,20})\/([0-9])\.jpg$/);
if (m) return thumb(req, sd, m[1].toUpperCase(), +m[2], ctx);
m = p.match(/^\/api\/x\/see\/3d\/([A-Za-z0-9-]{3,20})\/?$/);
if (m) {
const id = m[1].toUpperCase(), r = sd.d3 && sd.d3.projects && sd.d3.projects[id];
if (!r) return out({ id, error: 'no_pin', note: TB.kbx_see__t.k18 }, 404, 'public, max-age=600');
return out(Object.assign({ id, release: sd.d3.release, updated: sd.d3.updated, radius_m: sd.d3.radius_m, circle_m: sd.d3.circle_m, acc_m: accM(r.dec), unit: sd.d3.unit, source: sd.d3.source }, r), 200, 'public, max-age=3600');
}
m = p.match(/^\/api\/x\/see\/([A-Za-z0-9-]{3,20})\/?$/);
if (m) {
const id = m[1].toUpperCase(), ph = sd.ph && sd.ph.projects && sd.ph.projects[id], r = sd.d3 && sd.d3.projects && sd.d3.projects[id];
if (!ph && !r) return out({ id, error: 'no_pin', note: TB.kbx_see__t.k19 }, 404, 'public, max-age=600');
const { data } = await import('./kbx_named.js'); const ix = await data(env).catch(() => null); const x = ix && ix.byId.get(id);
return out({ id, name: x ? x.n : null, url: x ? ORIGIN + '/projects/' + x.s + '/#ground' : null,
photos: ph ? { checked: ph.checked, radius_m: sd.ph.radius_m, found: ph.found, newest: ph.newest || null,
items: (ph.ph || []).map((y, i) => ({ source: SRCN[y.src] || y.src, date: y.date, distance_m: y.d, camera_heading: y.az, licence: y.lic, licence_url: y.lic_url, page: y.page, thumbnail: ORIGIN + '/api/x/see/ph/' + id + '/' + i + '.jpg' })),
sources: sd.ph.sources, method: '/data/street-photos.json' } : null,
model3d: r ? { pin: { lat: r.lat, lng: r.lng, decimals: r.dec, accuracy_m: accM(r.dec) }, buildings: r.n, touching_150m_circle: r.n_in, release: sd.d3.release, data: ORIGIN + '/api/x/see/3d/' + id } : null }, 200, 'public, max-age=600');
}
return out({ error: 'not_found', see: ['/api/x/see/<ID>', '/api/x/see/3d/<ID>', '/api/x/see/ph/<ID>/<n>.jpg', '/api/x/see/3d.js'] }, 404);
} catch (e) { return out({ error: 'server' }, 500); }
}
