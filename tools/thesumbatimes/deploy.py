# -*- coding: utf-8 -*-
# Builds the Cloudflare Worker module for thesumbatimes.com from out/ (run build.py first).
# python3 deploy.py -> worker/index.js + worker/metadata.json
# Upload (Composio workbench): PUT /accounts/<acct>/workers/scripts/thesumbatimes as multipart (index.js + metadata), see README.md.
import os, json, base64
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "out"); W = os.path.join(HERE, "worker")
KV_NAMESPACE_ID = "f0aa5acc53a44f3194e7e428071161e2"   # Workers KV "thesumbatimes-img": img/<slug>-640.webp, img/<slug>-1280.webp, og/<slug>.jpg
TEXT = (".html", ".xml", ".txt", ".svg", ".json", ".webmanifest")
F = {}
for root, _, files in os.walk(OUT):
    for f in files:
        fp = os.path.join(root, f); p = "/" + os.path.relpath(fp, OUT).replace(os.sep, "/")
        if p.startswith("/img/"): continue
        if f.endswith(TEXT): F[p] = {"t": open(fp, encoding="utf-8").read()}
        else: F[p] = {"b64": base64.b64encode(open(fp, "rb").read()).decode()}
JS = "const F=" + json.dumps(F, ensure_ascii=False) + r""";
const CT={html:'text/html; charset=utf-8',xml:'application/xml; charset=utf-8',txt:'text/plain; charset=utf-8',svg:'image/svg+xml',png:'image/png',json:'application/json; charset=utf-8',webmanifest:'application/manifest+json',webp:'image/webp',jpg:'image/jpeg'};
const SEC={'x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','strict-transport-security':'max-age=31536000; includeSubDomains','permissions-policy':'camera=(), microphone=(), geolocation=()','x-frame-options':'SAMEORIGIN'};
function hdr(ext,cache){return Object.assign({'content-type':CT[ext]||'application/octet-stream','cache-control':cache},SEC);}
function resp(p,status){const f=F[p];const ext=p.split('.').pop();const cache=ext==='html'?'public, max-age=300, stale-while-revalidate=600':(ext==='xml'||ext==='json')?'public, max-age=600':'public, max-age=86400';
 const h=hdr(ext,cache);if(f.b64){const b=Uint8Array.from(atob(f.b64),c=>c.charCodeAt(0));return new Response(b,{status,headers:h});}return new Response(f.t,{status,headers:h});}
export default{async fetch(req,env){const u=new URL(req.url);
 if(u.hostname.startsWith('www.')){u.hostname=u.hostname.slice(4);return Response.redirect(u.toString(),301);}
 let p=decodeURIComponent(u.pathname);
 if(p.startsWith('/img/')||p.startsWith('/og/')){const k=p.slice(1);const v=env.IMG?await env.IMG.get(k,{type:'arrayBuffer'}):null;if(v){return new Response(v,{headers:hdr(k.split('.').pop(),'public, max-age=2592000')});}return new Response('Not found',{status:404,headers:hdr('txt','public, max-age=60')});}
 if(p.endsWith('/'))p+='index.html';
 if(F[p])return resp(p,200);
 if(!/\.[a-z0-9]{2,12}$/i.test(p)&&F[p+'/index.html']){return Response.redirect(u.origin+u.pathname+'/'+u.search,301);}
 const m=p.match(/^\/(en|es|id)\//);return resp(m&&F['/'+m[1]+'/404.html']?'/'+m[1]+'/404.html':'/404.html',404);}};
"""
os.makedirs(W, exist_ok=True)
open(os.path.join(W, "index.js"), "w", encoding="utf-8").write(JS)
META = {"main_module": "index.js", "compatibility_date": "2026-11-01", "bindings": [{"type": "kv_namespace", "name": "IMG", "namespace_id": KV_NAMESPACE_ID}]}
open(os.path.join(W, "metadata.json"), "w").write(json.dumps(META))
print("worker bytes", len(JS.encode()), "files", len(F))
