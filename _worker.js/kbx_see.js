// kolaboro.com batch 18 (n18c): see the site. Open street-level photos near the pin and a 3D view of the plot. No model calls, no keys.
// Data (built on main by .github/workflows/kolaboro-see-site.yml, tools/kolaboro-agent/see_site.py; same projects and pins as
// /data/construction-progress.json):
//   /data/street-photos.json  Panoramax (CC BY-SA 4.0 / Licence Ouverte 2.0), KartaView (CC BY-SA 4.0) and Wikimedia Commons
//                             (street-level files imported from Mapillary, CC0 to CC BY-SA 4.0) photos within 200 m of the pin, newest first
//   /data/site-3d.json        Overture Maps building footprints (ODbL) within 250 m of the pin, in half-metres from the pin
// Shown in the "street level and 3D" section of named project pages (kbx_named.js calls seeHtml). The 3D view loads only on a tap:
// MapLibre GL JS 4.7.1 (cdnjs), OpenStreetMap raster tiles, AWS Terrain Tiles (terrarium) and our footprints.
// Routes:
//   GET /api/x/see/<ID>             photos and 3D summary of one project (public, cacheable)
//   GET /api/x/see/3d/<ID>          footprints, pin and accuracy for the 3D view
//   GET /api/x/see/ph/<ID>/<n>.jpg  the source's own thumbnail of photo n, unchanged (only URLs from our data file; cached a week),
//                                   so a page view sends nothing about the viewer to the photo hosts
//   GET /api/x/see/3d.js            the 3D viewer script
const ORIGIN = 'https://kolaboro.com';
const ML = '4.7.1', ML_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/' + ML + '/';
let MEMO = {};
async function loadOne(env, name) {
  const m = MEMO[name]; if (m && (m.a || Date.now() - m.t < 600000)) return m.v;   // n20p: a file read from this deployment's assets (a) does not expire
  let r = null, a = false;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); a = !!(r && r.ok); } catch (e) { r = null; }
  if (!r || !r.ok) { try { r = await fetch(ORIGIN + '/data/' + name + '?w=1', { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
  const v = r && r.ok ? await r.json().catch(() => null) : null;
  MEMO[name] = { t: Date.now(), v, a: a && v != null }; return v;
}
export async function seeData(env) {
  const [ph, d3, si] = await Promise.all([loadOne(env, 'street-photos.json'), loadOne(env, 'site-3d.json'), loadOne(env, 'media-i18n.json')]);
  if (si && si.see) S = si.see;   // n40 k4
  return { ph, d3, v: ((ph && ph.updated) || '') + '/' + ((d3 && d3.updated) || '') };
}
// pin accuracy ring: the pin comes from public sources; given to 3 decimals we draw about 100 m (as the satellite sections say)
export const accM = dec => dec >= 5 ? 15 : dec === 4 ? 30 : 100;

// ------------------------------------------------------------------------------------------------ strings (8 languages)
let S = { en: {} };   // n40 k4: strings in 8 languages live in /data/media-i18n.json (see)

const t = (lang, k, v) => { const s = (S[lang] && S[lang][k]) || S.en[k] || ''; return v && typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const seeToc = lang => t(lang, 'toc');
export const seeHeading = lang => t(lang, 'h');
const SRCN = { panoramax: 'Panoramax', kartaview: 'KartaView', commons: 'Wikimedia Commons' };
const adiff = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

const CSS = '<style id="ksee-css">.ksee h3{margin:20px 0 6px;font-size:var(--k-fs-lg,1.2rem)}.ksee-ph{list-style:none;margin:12px 0;padding:0;display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(min(100%,150px),1fr))}@media (min-width:700px){.ksee-ph{grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}}' +
  '.ksee-ph li{margin:0;border:1px solid var(--k-line,var(--line));border-radius:var(--k-r-md,10px);overflow:hidden;background:var(--k-surface,#fff);display:flex;flex-direction:column}' +
  '.ksee-ph a.im{display:block;aspect-ratio:4/3;background:var(--k-sunken,#E8ECEA)}.ksee-ph img{display:block;width:100%;height:100%;object-fit:cover}.ksee-ph .tx{padding:10px 12px 12px;font-size:var(--k-fs-xs,.82rem);color:var(--k-ink-2,inherit);display:flex;flex-direction:column;gap:4px}' +
  '.ksee-ph .tx b{font-size:var(--k-fs-sm,.92rem);color:var(--k-ink,inherit)}.ksee-ph .tx a{color:var(--k-sea,#155C75)}.ksee-lnk{display:flex;flex-wrap:wrap;gap:8px 16px;margin:6px 0 0;padding:0;list-style:none}.ksee-lnk a{color:var(--k-sea,#155C75);display:inline-block;min-height:24px;line-height:24px}.ksee a.src,.ksee .k-xs a,.ksat-lim a{display:inline-block;min-height:24px;line-height:24px}' +
  '.ksee-3d{margin:10px 0 0}.ksee-map{position:relative;width:100%;height:min(72vh,560px);min-height:340px;border:1px solid var(--k-line,var(--line));border-radius:var(--k-r-md,10px);overflow:hidden;background:var(--k-sunken,#E8ECEA)}' +
  '.ksee-map[hidden]{display:none}.ksee-map .msg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;text-align:center;color:var(--k-muted,#56636F)}' +
  '.ksee-lg{list-style:none;margin:10px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:6px 18px;font-size:var(--k-fs-xs,.82rem);color:var(--k-ink-2,inherit)}.ksee-lg li{display:flex;align-items:center;gap:6px}' +
  '.ksee-lg i{display:inline-block;width:16px;height:12px;border-radius:2px;flex:none}.ksee-lg .k{background:#155C75}.ksee-lg .u{background:#9FB4BF}.ksee-lg .c{border:2px solid #FF5B14;border-radius:50%;width:12px}.ksee-lg .a{border:2px dashed #13222E;border-radius:50%;width:12px}' +
  '.ksee-lg .p{background:#FF5B14;border:2px solid #fff;border-radius:50%;width:10px;height:10px;box-shadow:0 0 0 1px #13222E}.ksee .k-btn{min-height:44px}.ksee-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin:8px 0}' +
  ':root[data-theme=dark] .ksee-lg .a{border-color:#E6ECEF}.ksee-map summary{list-style:none}.ksee-map summary::-webkit-details-marker{display:none}.ksee-map summary::after,.ksee-map summary::before{content:none!important;display:none!important}</style>';

// n20p: one formatter per locale and options for the life of the isolate (building one per call cost most of the render time)
const dtf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'd' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.DateTimeFormat(L, o)); };
const nmf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'n' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.NumberFormat(L, o)); };
// inside the named project page: section "street level and 3D"
export function seeHtml(sd, id, lang, fd, name) {
  if (!sd) return '';
  const php = sd.ph && sd.ph.projects && sd.ph.projects[id], d3 = sd.d3 && sd.d3.projects && sd.d3.projects[id];
  if (!php && !d3) return '';
  const num = v => { try { return nmf(lang === 'en' ? 'en-GB' : lang).format(v); } catch (e) { return String(v); } };
  const lat = d3 ? d3.lat : null, lng = d3 ? d3.lng : null, dec = d3 ? d3.dec : 3, acc = accM(dec);
  let h = CSS + '<div class="ksee">';
  if (php) {
    h += '<h3>' + esc(t(lang, 'ph')) + '</h3>';
    const L = php.ph || [];
    if (!L.length) { const ok = ['panoramax', 'kartaview', 'commons'].filter(k => !(php.errors || []).includes(k)).map(k => SRCN[k]); if (ok.length) h += '<p>' + esc(t(lang, 'ph0', { d: fd(php.checked), s: ok.join(', ') })) + '</p>'; }
    else {
      h += '<p class="ki">' + esc(t(lang, 'phn', { n: num(L.length) })) + '</p><ul class="ksee-ph">' + L.map((x, i) => {
        const sn = SRCN[x.src] || x.src, alt = sn + (x.date ? ', ' + fd(x.date) : '') + ', ' + num(x.d) + ' m' + (name ? ', ' + name : '');
        const ex = [x.az != null && x.to != null && adiff(x.az, x.to) <= 60 ? t(lang, 'face') : '', x.pano ? t(lang, 'pano') : '', x.src === 'commons' ? t(lang, 'commons') : ''].filter(Boolean).join(', ');
        return '<li><a class="im" href="' + esc(x.page) + '" rel="noopener nofollow" target="_blank"><img src="/api/x/see/ph/' + encodeURIComponent(id) + '/' + i + '.jpg?v=' + encodeURIComponent(sd.ph.updated || '') + '" alt="' + esc(alt) + '" loading="lazy" decoding="async" width="500" height="375" referrerpolicy="no-referrer"></a>' +
          '<div class="tx"><b>' + esc(x.date ? t(lang, 'cap', { d: fd(x.date), m: num(x.d) }) : t(lang, 'nod', { m: num(x.d) })) + '</b>' + (ex ? '<span>' + esc(ex) + '</span>' : '') +
          '<span>' + esc(t(lang, 'lic', { l: x.lic })) + (x.lic_url ? ' <a href="' + esc(x.lic_url) + '" rel="noopener license" target="_blank">' + esc(x.lic) + '</a>' : '') + '</span>' +
          '<a class="k-src" href="' + esc(x.page) + '" rel="noopener nofollow" target="_blank">' + esc(t(lang, 'open', { s: sn })) + '</a></div></li>';
      }).join('') + '</ul>';
    }
    h += '<p class="ksat-lim">' + esc(t(lang, 'phlim', { a: acc })) + '</p>';
    if (lat != null) h += '<p class="ksat-lim">' + esc(t(lang, 'other')) + '</p><ul class="ksee-lnk"><li><a href="https://www.google.com/maps/@?api=1&amp;map_action=pano&amp;viewpoint=' + lat + ',' + lng + '" rel="noopener nofollow" target="_blank">' + esc(t(lang, 'gsv')) + '</a></li><li><a href="https://www.mapillary.com/app/?lat=' + lat + '&amp;lng=' + lng + '&amp;z=17" rel="noopener nofollow" target="_blank">' + esc(t(lang, 'mpl')) + '</a></li></ul>';
    h += '<p class="ksat-src">' + ['panoramax', 'kartaview', 'commons'].map(k => { const s = sd.ph.sources[k]; return '<a class="src" href="' + esc(s.url) + '" rel="noopener" target="_blank">' + esc(s.name) + '</a>'; }).join(' ') +
      ' <a class="src" href="/data/street-photos.json">' + esc(t(lang, 'method')) + ', ' + esc(t(lang, 'upd', { d: fd(php.checked || sd.ph.updated) })) + '</a></p>';
  }
  if (d3) {
    const rel = String(sd.d3.release || '').replace(/\.\d+$/, '');
    h += '<h3>' + esc(t(lang, 'd3')) + '</h3><p>' + esc(d3.n ? t(lang, 'd3i', { n: num(d3.n), k: num(d3.n_in) }) : t(lang, 'd3i0', { rel: fd(rel) })) + '</p>' +
      '<div class="ksee-3d" data-id="' + esc(id) + '" data-lat="' + d3.lat + '" data-lng="' + d3.lng + '" data-acc="' + acc + '" data-v="' + esc(sd.d3.updated || '') + '" data-l="' + esc(t(lang, 'd3l')) + '" data-e="' + esc(t(lang, 'd3e')) + '" data-r="' + esc(t(lang, 'reset')) + '">' +
      '<div class="ksee-bar"><button type="button" class="k-btn ksee-go" aria-expanded="false">' + esc(t(lang, 'd3b')) + '</button><span class="k-small k-muted">' + esc(t(lang, 'd3s')) + '</span></div>' +
      '<div class="ksee-map" hidden role="region" aria-label="' + esc(t(lang, 'd3') + (name ? ': ' + name : '')) + '"></div><p class="k-small k-muted ksee-help" hidden>' + esc(t(lang, 'd3help')) + '</p>' +
      '<ul class="ksee-lg"><li><i class="p"></i>' + esc(t(lang, 'lgp')) + '</li><li><i class="a"></i>' + esc(t(lang, 'lga', { a: acc, dec })) + '</li><li><i class="c"></i>' + esc(t(lang, 'lgc')) + '</li>' +
      (d3.n ? '<li><i class="k"></i>' + esc(t(lang, 'lgk')) + '</li><li><i class="u"></i>' + esc(t(lang, 'lgu')) + '</li>' : '') + '</ul></div>' +
      '<p class="ksat-lim">' + esc(t(lang, 'd3lim')) + '</p>' +
      '<p class="ksat-src">' + esc(sd.d3.source.attribution) + '. <a class="src" href="' + esc(sd.d3.source.url) + '" rel="noopener" target="_blank">Overture Maps buildings, ' + esc(sd.d3.release) + '</a> <a class="src" href="' + esc(sd.d3.source.licence_url) + '" rel="noopener" target="_blank">ODbL 1.0</a>' +
      ' <a class="src" href="https://registry.opendata.aws/terrain-tiles/" rel="noopener" target="_blank">Terrain Tiles, AWS Open Data (Mapzen)</a> <a class="src" href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" rel="noopener" target="_blank">terrain attribution</a>' +
      ' <a class="src" href="https://www.openstreetmap.org/copyright" rel="noopener" target="_blank">© OpenStreetMap contributors</a> <a class="src" href="https://maplibre.org/" rel="noopener" target="_blank">MapLibre GL JS ' + ML + '</a>' +
      ' <a class="src" href="/data/site-3d.json">' + esc(t(lang, 'method')) + ', ' + esc(t(lang, 'upd', { d: fd(sd.d3.updated) })) + '</a></p>' +
      '<script>(function(){var b=document.querySelectorAll(".ksee-go");b.forEach(function(x){x.addEventListener("click",function(){var r=x.closest(".ksee-3d");if(!r||r.dataset.on)return;r.dataset.on="1";x.setAttribute("aria-expanded","true");x.disabled=true;' +
      'var m=r.querySelector(".ksee-map");m.hidden=false;m.innerHTML="<div class=\\"msg\\" role=\\"status\\"><span class=\\"k-spin\\"></span>&nbsp;"+r.dataset.l.replace(/</g,"&lt;")+"</div>";' +
      'if(window.kSee3D){window.kSee3D(r);return;}var s=document.createElement("script");s.src="/api/x/see/3d.js?v=' + ML + '-4";s.onload=function(){window.kSee3D(r)};s.onerror=function(){m.innerHTML="<div class=\\"msg\\">"+r.dataset.e.replace(/</g,"&lt;")+"</div>"};document.head.appendChild(s);});});})();</script>';
  }
  return h + '</div>';
}

// ------------------------------------------------------------------------------------------------ 3D viewer (browser)
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

// ------------------------------------------------------------------------------------------------ routes
export const PATHS = /^\/api\/x\/see\//;
const H = { 'content-type': 'application/json; charset=utf-8', 'x-content-type-options': 'nosniff', 'access-control-allow-origin': '*' };
const out = (o, st, cc) => new Response(JSON.stringify(o), { status: st || 200, headers: Object.assign({ 'cache-control': cc || 'no-store' }, H) });
const UA = 'Kolaboro-see-site/1.0 (+https://kolaboro.com/data/; agent@kolaboro.com)';

async function thumb(req, sd, id, n, ctx) {
  const rec = sd.ph && sd.ph.projects && sd.ph.projects[id], x = rec && rec.ph && rec.ph[n];
  if (!x || !/^https:\/\//.test(x.thumb || '')) return new Response('not found', { status: 404, headers: { 'cache-control': 'public, max-age=3600' } });
  const ck = new Request(ORIGIN + '/__see_ph/' + encodeURIComponent(id) + '/' + n + '/' + encodeURIComponent(x.src + ':' + x.id + ':' + x.thumb.slice(-48)));
  try { const hit = await caches.default.match(ck); if (hit) return hit; } catch (e) {}
  // n26u (13 Nov 2026): the photo source answered 502 now and then. Two tries (12 s each, short pause), then the last good copy this
  // edge kept (30 days, marked x-kb-fallback: stale), then a plain grey placeholder (not cached) instead of a broken image.
  const sk = new Request(ck.url + '/stale');
  let r = null, ct = '', buf = null;
  for (let a = 0; a < 2 && !buf; a++) {
    if (a) await new Promise(ok => setTimeout(ok, 600));
    try { r = await fetch(x.thumb, { headers: { 'user-agent': UA, accept: 'image/jpeg,image/webp,image/png,image/*' }, cf: { cacheTtl: 604800, cacheEverything: true }, redirect: 'follow', signal: AbortSignal.timeout(12000) }); } catch (e) { r = null; }
    ct = r && r.headers.get('content-type') || '';
    if (r && r.ok && /^image\/(jpeg|png|webp)/.test(ct)) { const b = await r.arrayBuffer(); if (b.byteLength <= 2500000) buf = b; }
  }
  if (!buf) {
    try { const st = await caches.default.match(sk); if (st) { const h = new Headers(st.headers); h.set('x-kb-fallback', 'stale'); h.set('cache-control', 'public, max-age=600'); return new Response(st.body, { status: 200, headers: h }); } } catch (e) {}
    return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="375" viewBox="0 0 500 375"><rect width="500" height="375" fill="#E3E2DD"/></svg>', { status: 200, headers: { 'content-type': 'image/svg+xml', 'cache-control': 'no-store', 'x-kb-fallback': 'placeholder', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'" } });
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
      if (!r) return out({ id, error: 'no_pin', note: 'Only projects with a plot-level pin have a 3D view.' }, 404, 'public, max-age=600');
      return out(Object.assign({ id, release: sd.d3.release, updated: sd.d3.updated, radius_m: sd.d3.radius_m, circle_m: sd.d3.circle_m, acc_m: accM(r.dec), unit: sd.d3.unit, source: sd.d3.source }, r), 200, 'public, max-age=3600');
    }
    m = p.match(/^\/api\/x\/see\/([A-Za-z0-9-]{3,20})\/?$/);
    if (m) {
      const id = m[1].toUpperCase(), ph = sd.ph && sd.ph.projects && sd.ph.projects[id], r = sd.d3 && sd.d3.projects && sd.d3.projects[id];
      if (!ph && !r) return out({ id, error: 'no_pin', note: 'Only projects with a plot-level pin are covered.' }, 404, 'public, max-age=600');
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
