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
const RD=F['/_redirects.json']?JSON.parse(F['/_redirects.json'].t):{};
const ES=new Set(['ES','MX','AR','CO','CL','PE','VE','EC','GT','CU','BO','DO','HN','PY','SV','NI','CR','PA','UY','PR','GQ']);
const BOT=/bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|whatsapp|telegram|lighthouse|headless|gptbot|claude|anthropic|perplexity|google-extended|ccbot|bytespider|applebot|bingpreview/i;
const CT={html:'text/html; charset=utf-8',xml:'application/xml; charset=utf-8',txt:'text/plain; charset=utf-8',md:'text/markdown; charset=utf-8',svg:'image/svg+xml',png:'image/png',json:'application/json; charset=utf-8',webmanifest:'application/manifest+json',webp:'image/webp',jpg:'image/jpeg'};
const SEC={'x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','strict-transport-security':'max-age=31536000; includeSubDomains','permissions-policy':'camera=(), microphone=(), geolocation=()','x-frame-options':'SAMEORIGIN'};
function hdr(ext,cache){return Object.assign({'content-type':CT[ext]||'application/octet-stream','cache-control':cache},SEC);}
function resp(p,status){const f=F[p];const ext=p.split('.').pop();const cache=ext==='html'?'public, max-age=300, stale-while-revalidate=600':(ext==='xml'||ext==='json')?'public, max-age=600':'public, max-age=86400';
 const h=hdr(ext,cache);if(f.b64){const b=Uint8Array.from(atob(f.b64),c=>c.charCodeAt(0));return new Response(b,{status,headers:h});}return new Response(f.t,{status,headers:h});}

const AI_URL='https://gmdalfsvtfhzepyrdmjj.supabase.co/functions/v1/sumba-ai';
const AI_PER_IP=20, AI_PER_DAY=600;
let IDX={};
function idx(l){if(!IDX[l]){try{IDX[l]=JSON.parse(F['/'+l+'/search.json'].t)}catch(e){IDX[l]=[]}}return IDX[l]}
function norm(s){return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}
const STOP=new Set('the a an of to in on and or for is are what how when where which with sumba di ke dan yang apa bagaimana kapan el la los las de del en y o que como cuando donde para por con es un una'.split(' '));
function ctxFor(q,l,page){const ws=norm(q).split(/[^a-z0-9]+/).filter(w=>w.length>2&&!STOP.has(w));const ix=idx(l);
 const sc=ix.map(a=>{const h=norm(a.t+' '+a.d+' '+a.x),t=norm(a.t);let s=0;ws.forEach(w=>{if(h.indexOf(w)>-1)s+=t.indexOf(w)>-1?4:1});if(page&&a.u===page)s+=3;return [s,a]}).filter(z=>z[0]>0).sort((a,b)=>b[0]-a[0]).slice(0,4);
 const pick=sc.length?sc.map(z=>z[1]):ix.filter(a=>/plan|itiner|best-time|mejor-epoca|waktu-terbaik|how-to-get|como-llegar|cara-ke/.test(a.u)).slice(0,3);
 return pick.map(a=>{const x=a.x;let i=0;for(const w of ws){const k=norm(x).indexOf(w);if(k>0){i=Math.max(0,k-300);break}}return a.t+' | https://thesumbatimes.com'+a.u+' | '+a.d+' '+x.slice(i,i+1700)}).join('\n\n')}
async function ask(req,env){const H=Object.assign({'content-type':'application/json; charset=utf-8','cache-control':'no-store'},SEC);
 if(req.method==='GET')return new Response(JSON.stringify({on:!!env.TST_SECRET}),{headers:H});
 if(req.method!=='POST')return new Response('{}',{status:405,headers:H});
 const o=req.headers.get('origin')||'';if(o&&!/^https:\/\/(www\.)?thesumbatimes\.com$/.test(o))return new Response('{"error":"origin"}',{status:403,headers:H});
 if(!env.TST_SECRET)return new Response('{"error":"off"}',{status:503,headers:H});
 let b={};try{b=await req.json()}catch(e){return new Response('{"error":"json"}',{status:400,headers:H})}
 const q=String(b.q||'').slice(0,600).trim();const l=['en','es','id'].includes(b.lang)?b.lang:'en';if(q.length<2)return new Response('{"error":"empty"}',{status:400,headers:H});
 const ip=req.headers.get('cf-connecting-ip')||'x',d=new Date().toISOString().slice(0,10);
 if(env.IMG){const ki='ai/'+d+'/'+ip,kg='ai/'+d+'/all';const [ci,cg]=await Promise.all([env.IMG.get(ki),env.IMG.get(kg)]);
  if(+ci>=AI_PER_IP)return new Response('{"error":"limit"}',{status:429,headers:H});if(+cg>=AI_PER_DAY)return new Response('{"error":"busy"}',{status:429,headers:H});
  await Promise.all([env.IMG.put(ki,String((+ci||0)+1),{expirationTtl:172800}),env.IMG.put(kg,String((+cg||0)+1),{expirationTtl:172800})]);}
 const page=String(b.page||'').slice(0,200);
 const hist=(Array.isArray(b.history)?b.history:[]).slice(-6).map(m=>({role:m.role==='assistant'?'assistant':'user',content:String(m.content||'').slice(0,700)}));
 try{const r=await fetch(AI_URL,{method:'POST',headers:{'content-type':'application/json','x-tst-secret':env.TST_SECRET},body:JSON.stringify({q,lang:l,page,history:hist,ctx:ctxFor(q+' '+hist.filter(m=>m.role==='user').map(m=>m.content).join(' '),l,page)})});
  const j=await r.json();return new Response(JSON.stringify({text:j.text||'',error:j.error||null}),{status:r.ok?200:502,headers:H})}catch(e){return new Response('{"error":"upstream"}',{status:502,headers:H})}}
export default{async fetch(req,env){const u=new URL(req.url);
 if(u.pathname==='/api/ask')return ask(req,env);
 if(u.hostname.startsWith('www.')){u.hostname=u.hostname.slice(4);return Response.redirect(u.toString(),301);}
 let p=decodeURIComponent(u.pathname);
 if(p==='/'||p==='/index.html'){const ua=req.headers.get('user-agent')||'';
  if(!BOT.test(ua)){const ck=(req.headers.get('cookie')||'').match(/(?:^|;\s*)st_lang=(en|es|id)/);
   let l=ck?ck[1]:null;if(!l){const c=(req.cf&&req.cf.country)||req.headers.get('cf-ipcountry')||'';l=ES.has(c)?'es':(c==='ID'?'id':null);}
   if(!l){const al=(req.headers.get('accept-language')||'').toLowerCase().slice(0,2);l=al==='es'?'es':(al==='id'||al==='ms')?'id':'en';}
   return new Response(null,{status:302,headers:Object.assign({'location':'/'+l+'/'+u.search,'cache-control':'private, no-store','vary':'Cookie, Accept-Language'},SEC)});}}
 if(RD[p]||RD[p+'/']){return Response.redirect(u.origin+(RD[p]||RD[p+'/'])+u.search,301);}
 if(p.startsWith('/img/')||p.startsWith('/og/')){const k=p.slice(1);const v=env.IMG?await env.IMG.get(k,{type:'arrayBuffer'}):null;if(v){return new Response(v,{headers:hdr(k.split('.').pop(),'public, max-age=2592000')});}return new Response('Not found',{status:404,headers:hdr('txt','public, max-age=60')});}
 if(p.endsWith('/'))p+='index.html';
 if(F[p])return resp(p,200);
 if(!/\.[a-z0-9]{2,12}$/i.test(p)&&F[p+'/index.html']){return Response.redirect(u.origin+u.pathname+'/'+u.search,301);}
 const m=p.match(/^\/(en|es|id)\//);return resp(m&&F['/'+m[1]+'/404.html']?'/'+m[1]+'/404.html':'/404.html',404);}};
"""
os.makedirs(W, exist_ok=True)
open(os.path.join(W, "index.js"), "w", encoding="utf-8").write(JS)
META = {"main_module": "index.js", "compatibility_date": "2026-11-01", "keep_bindings": ["secret_text"], "bindings": [{"type": "kv_namespace", "name": "IMG", "namespace_id": KV_NAMESPACE_ID}]}
open(os.path.join(W, "metadata.json"), "w").write(json.dumps(META))
print("worker bytes", len(JS.encode()), "files", len(F))
