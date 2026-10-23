const C="rh-v2";
self.addEventListener("install",e=>{self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);if(e.request.method!=="GET"||u.origin!==location.origin)return;
if(/^\/(finds|images)\//.test(u.pathname)||/^\/assets\//.test(u.pathname)||/\.(png|svg|webp|jpg|woff2?)$/.test(u.pathname)){
e.respondWith(caches.open(C).then(async c=>{const h=await c.match(e.request);if(h)return h;const r=await fetch(e.request);if(r.ok)c.put(e.request,r.clone());return r}).catch(()=>fetch(e.request)))}});
