# -*- coding: utf-8 -*-
# Builds the Cloudflare Worker module for thesumbatimes.com from out/ (run build.py first).
# python3 deploy.py -> worker/index.js + worker/metadata.json
# Upload (Composio workbench): PUT /accounts/<acct>/workers/scripts/thesumbatimes as multipart (index.js + metadata), see README.md.
import os, json, base64
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "out"); W = os.path.join(HERE, "worker")
KV_NAMESPACE_ID = "f0aa5acc53a44f3194e7e428071161e2"   # Workers KV "thesumbatimes-img": img/<slug>-640.webp, img/<slug>-1280.webp, og/<slug>.jpg
TEXT = (".html", ".xml", ".txt", ".svg", ".json", ".webmanifest", ".js", ".css")
F = {}
for root, _, files in os.walk(OUT):
    for f in files:
        fp = os.path.join(root, f); p = "/" + os.path.relpath(fp, OUT).replace(os.sep, "/")
        if p.startswith("/img/"): continue
        if f.endswith(TEXT): F[p] = {"t": open(fp, encoding="utf-8").read()}
        else: F[p] = {"b64": base64.b64encode(open(fp, "rb").read()).decode()}
OGF = {}
if "/_og.json" in F:
    for j in json.loads(F.pop("/_og.json")["t"]): OGF[j["k"][3:]] = j["fb"]
JS = "const F=" + json.dumps(F, ensure_ascii=False) + ";\nconst OGF=" + json.dumps(OGF) + r""";
const RD=F['/_redirects.json']?JSON.parse(F['/_redirects.json'].t):{};
const ES=new Set(['ES','MX','AR','CO','CL','PE','VE','EC','GT','CU','BO','DO','HN','PY','SV','NI','CR','PA','UY','PR','GQ']);
const BOT=/bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|whatsapp|telegram|lighthouse|headless|gptbot|claude|anthropic|perplexity|google-extended|ccbot|bytespider|applebot|bingpreview/i;
const CT={html:'text/html; charset=utf-8',xml:'application/xml; charset=utf-8',txt:'text/plain; charset=utf-8',md:'text/markdown; charset=utf-8',svg:'image/svg+xml',png:'image/png',woff2:'font/woff2',json:'application/json; charset=utf-8',webmanifest:'application/manifest+json',webp:'image/webp',jpg:'image/jpeg',js:'application/javascript; charset=utf-8',css:'text/css; charset=utf-8'};
const SEC={'x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','strict-transport-security':'max-age=31536000; includeSubDomains','permissions-policy':'camera=(), microphone=(), geolocation=()','x-frame-options':'SAMEORIGIN'};
function hdr(ext,cache){return Object.assign({'content-type':CT[ext]||'application/octet-stream','cache-control':cache},SEC);}
function resp(p,status){const f=F[p];const ext=p.split('.').pop();const cache=(ext==='woff2'||ext==='css'||p.startsWith('/j.'))?'public, max-age=31536000, immutable':ext==='html'?'public, max-age=300, stale-while-revalidate=600':(ext==='xml'||ext==='json')?'public, max-age=600':'public, max-age=86400';
 const h=hdr(ext,cache);if(p.startsWith('/widget/')){delete h['x-frame-options'];h['content-security-policy']='frame-ancestors *';}if(f.b64){const b=Uint8Array.from(atob(f.b64),c=>c.charCodeAt(0));return new Response(b,{status,headers:h});}return new Response(f.t,{status,headers:h});}

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

async function question(req,env){const H=Object.assign({'content-type':'application/json'},SEC);
 if(req.method!=='POST')return new Response('{}',{status:405,headers:H});
 const o=req.headers.get('origin')||'';if(o&&!/^https:\/\/(www\.)?thesumbatimes\.com$/.test(o))return new Response('{}',{status:403,headers:H});
 let b={};try{b=await req.json()}catch(e){return new Response('{}',{status:400,headers:H})}
 if(b.w)return new Response('{"ok":true}',{headers:H});
 const q=String(b.q||'').trim().slice(0,1500),e=String(b.e||'').trim().slice(0,200);if(q.length<5)return new Response('{}',{status:400,headers:H});
 if(e&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))return new Response('{}',{status:400,headers:H});
 const ip=req.headers.get('cf-connecting-ip')||'x',d=new Date().toISOString().slice(0,10),kl='qlim/'+d+'/'+ip,c=+(await env.IMG.get(kl))||0;if(c>=5)return new Response('{}',{status:429,headers:H});
 await env.IMG.put(kl,String(c+1),{expirationTtl:172800});
 const k='q/'+new Date().toISOString()+'-'+Math.random().toString(36).slice(2,8);
 await env.IMG.put(k,JSON.stringify({q,e,lang:['en','es','id'].includes(b.lang)?b.lang:'en',page:String(b.page||'').slice(0,200),country:(req.cf&&req.cf.country)||'',at:new Date().toISOString()}));
 return new Response('{"ok":true}',{headers:H})}
const NL_URL='https://oykcsmextclpdnugixqz.supabase.co/functions/v1/tst-newsletter';
async function nlCall(env,op,qs,body){const r=await fetch(NL_URL+'?op='+op+(qs||''),{method:body?'POST':'GET',headers:{'content-type':'application/json','x-tst-nl':env.TST_NL_SECRET},body:body?JSON.stringify(body):undefined});let j={};try{j=await r.json()}catch(e){}return{ok:r.ok,j}}
async function nl(req,env,u){const H=Object.assign({'content-type':'application/json; charset=utf-8','cache-control':'no-store'},SEC);const op=u.pathname.slice(8);
 const L=x=>['en','es','id'].includes(x)?x:'en';const go=(to)=>new Response(null,{status:302,headers:Object.assign({'location':to,'cache-control':'no-store'},SEC)});
 if(!env.TST_NL_SECRET)return new Response('{"error":"off"}',{status:503,headers:H});
 const t=(u.searchParams.get('t')||'').slice(0,40);
 try{
 if(op==='subscribe'){if(req.method!=='POST')return new Response('{}',{status:405,headers:H});
  const o=req.headers.get('origin')||'';if(o&&!/^https:\/\/(www\.)?thesumbatimes\.com$/.test(o))return new Response('{}',{status:403,headers:H});
  let b={};try{b=await req.json()}catch(e){return new Response('{}',{status:400,headers:H})}
  if(b.w)return new Response('{"ok":true}',{headers:H});
  const ip=req.headers.get('cf-connecting-ip')||'x',d=new Date().toISOString().slice(0,10),kl='nllim/'+d+'/'+ip,c=+(await env.IMG.get(kl))||0;if(c>=6)return new Response('{"error":"limit"}',{status:429,headers:H});
  await env.IMG.put(kl,String(c+1),{expirationTtl:172800});
  const r=await nlCall(env,'subscribe','',{email:String(b.email||'').slice(0,200),lang:L(b.lang),topics:Array.isArray(b.topics)?b.topics.slice(0,6):[],src:String(b.src||'').slice(0,80),ref:String(b.ref||'').slice(0,16)});
  return new Response(JSON.stringify(r.j),{status:r.ok?200:400,headers:H})}
 if(op==='confirm'){const r=await nlCall(env,'confirm','&t='+t);return go(r.ok?'/'+L(r.j.lang)+'/newsletter/welcome/?ref='+(r.j.ref||''):'/en/newsletter/?e=token')}
 if(op==='unsub'){const r=await nlCall(env,'unsub','&t='+t,req.method==='POST'?{t}:null);if(req.method==='POST')return new Response('{"ok":true}',{headers:H});return go(r.ok?'/'+L(r.j.lang)+'/newsletter/bye/':'/en/newsletter/?e=token')}
 if(op==='prefs'){let b=null;if(req.method==='POST'){try{b=await req.json()}catch(e){b={}}b={t,topics:Array.isArray(b.topics)?b.topics.slice(0,6):[],lang:L(b.lang)}}
  const r=await nlCall(env,'prefs','&t='+t,b);return new Response(JSON.stringify(r.j),{status:r.ok?200:404,headers:H})}
 if(op==='vote'){const r=await nlCall(env,'vote','&t='+t+'&p='+encodeURIComponent((u.searchParams.get('p')||'').slice(0,40))+'&o='+(parseInt(u.searchParams.get('o'),10)||0));return go('/'+L(r.j.lang)+'/newsletter/?voted=1')}
 if(op==='results'||op==='count'){const ck='nlc/'+op+'/'+(u.searchParams.get('p')||'').slice(0,40);let v=await env.IMG.get(ck);
  if(!v){const r=await nlCall(env,op,'&p='+encodeURIComponent((u.searchParams.get('p')||'').slice(0,40)));v=JSON.stringify(r.j);await env.IMG.put(ck,v,{expirationTtl:3600})}
  return new Response(v,{headers:Object.assign({},H,{'cache-control':'public, max-age=600'})})}
 }catch(e){return new Response('{"error":"upstream"}',{status:502,headers:H})}
 return new Response('{}',{status:404,headers:H})}
// Own first-party page counter (no cookies, no IPs stored): one KV record per UTC day with totals by language, page,
// country and referrer host. Bots are skipped. Read by claude-ops jobs/tst_metrics.py for the weekly panel.
const AIB=[['gptbot','GPTBot'],['oai-searchbot','OAI-SearchBot'],['chatgpt-user','ChatGPT-User'],['claudebot','ClaudeBot'],['claude-user','Claude-User'],['claude-searchbot','Claude-SearchBot'],['perplexitybot','PerplexityBot'],['perplexity-user','Perplexity-User'],['google-extended','Google-Extended'],['googlebot','Googlebot'],['bingbot','bingbot'],['applebot','Applebot'],['bytespider','Bytespider'],['ccbot','CCBot'],['amazonbot','Amazonbot'],['meta-externalagent','Meta-ExternalAgent'],['duckduckbot','DuckDuckBot'],['yandex','Yandex']];
function refGroup(h){if(!h)return'';if(/(^|\.)google\./.test(h))return'google';if(/bing\.com$/.test(h))return'bing';if(/chatgpt\.com$|openai\.com$/.test(h))return'chatgpt';if(/perplexity\.ai$/.test(h))return'perplexity';if(/copilot\.microsoft\.com$/.test(h))return'copilot';if(/gemini\.google\.com$/.test(h))return'gemini';if(/claude\.ai$/.test(h))return'claude';if(/duckduckgo\.com$|yandex\.|yahoo\.|ecosia\.org$|brave\.com$/.test(h))return'other-search';if(/facebook\.com$|instagram\.com$|t\.co$|x\.com$|tiktok\.com$|pinterest\.|youtube\.com$|linkedin\.com$|reddit\.com$|wa\.me$|whatsapp\.com$|t\.me$/.test(h))return'social';return'other-site'}
async function hit(req,env,u,p){try{const ua=(req.headers.get('user-agent')||'').toLowerCase();if(!ua||req.method!=='GET')return;
 if(BOT.test(ua)){const b=AIB.find(x=>ua.includes(x[0]));if(!b)return;const kb='sb/'+new Date().toISOString().slice(0,10);let o={b:{},p:{}};const vb=await env.IMG.get(kb);if(vb){try{o=JSON.parse(vb)}catch(e){}}
  o.b[b[1]]=(o.b[b[1]]||0)+1;if(/gpt|oai|claude|perplexity/.test(b[0])){const pp=p.replace(/index\.html$/,'');if(o.p[pp]||Object.keys(o.p).length<300)o.p[pp]=(o.p[pp]||0)+1}
  if(Math.random()<0.34||!vb)await env.IMG.put(kb,JSON.stringify(o),{expirationTtl:86400*120});return}
 if(req.headers.get('sec-fetch-mode')!=='navigate'||!req.headers.get('accept-language')||(req.headers.get('sec-fetch-dest')||'document')!=='document'||(req.headers.get('purpose')||req.headers.get('sec-purpose')||'').includes('prefetch'))return;
 const k='st/'+new Date().toISOString().slice(0,10);let d={pv:0,l:{},p:{},c:{},r:{},s:{}};const v=await env.IMG.get(k);if(v){try{d=JSON.parse(v)}catch(e){}}
 if(d.pv>20000&&Math.random()>0.1)return;const w=d.pv>20000?10:1;const inc=(o,key)=>{if(o[key]||Object.keys(o).length<400)o[key]=(o[key]||0)+w};
 d.pv+=w;const m=p.match(/^\/(en|es|id)\//);inc(d.l,m?m[1]:'-');inc(d.p,p.replace(/index\.html$/,''));inc(d.c,(req.cf&&req.cf.country)||'-');
 const us_=u.searchParams.get('utm_source');let rh='';try{rh=new URL(req.headers.get('referer')||'').hostname.replace(/^www\./,'')}catch(e){}if(rh&&rh!=='thesumbatimes.com'){inc(d.r,rh);d.g=d.g||{};inc(d.g,refGroup(rh))}else if(!rh){d.g=d.g||{};inc(d.g,us_?'campaign':'direct')}
 if(us_)inc(d.s,us_.slice(0,30).toLowerCase());
 await env.IMG.put(k,JSON.stringify(d),{expirationTtl:86400*120})}catch(e){}}
export default{async fetch(req,env,ctx){const u=new URL(req.url);
 if(u.pathname.startsWith('/api/nl/'))return nl(req,env,u);
 if(u.pathname==='/api/ask')return ask(req,env);
 if(u.pathname==='/api/question')return question(req,env);
 if(u.hostname.startsWith('www.')){u.hostname=u.hostname.slice(4);return Response.redirect(u.toString(),301);}
 let p=decodeURIComponent(u.pathname);
 if(p==='/'||p==='/index.html'){const ua=req.headers.get('user-agent')||'';
  if(!BOT.test(ua)){const ck=(req.headers.get('cookie')||'').match(/(?:^|;\s*)st_lang=(en|es|id)/);
   let l=ck?ck[1]:null;if(!l){const c=(req.cf&&req.cf.country)||req.headers.get('cf-ipcountry')||'';l=ES.has(c)?'es':(c==='ID'?'id':null);}
   if(!l){const al=(req.headers.get('accept-language')||'').toLowerCase().slice(0,2);l=al==='es'?'es':(al==='id'||al==='ms')?'id':'en';}
   return new Response(null,{status:302,headers:Object.assign({'location':'/'+l+'/'+u.search,'cache-control':'private, no-store','vary':'Cookie, Accept-Language'},SEC)});}}
 if(RD[p]||RD[p+'/']){return Response.redirect(u.origin+(RD[p]||RD[p+'/'])+u.search,301);}
 if(p.startsWith('/pdf/')){const k=p.slice(1);const v=env.IMG?await env.IMG.get(k,{type:'arrayBuffer'}):null;if(v){return new Response(v,{headers:Object.assign({'content-type':'application/pdf','cache-control':'public, max-age=86400','x-robots-tag':'noindex'},SEC)});}const m=p.match(/-(en|es|id)\.pdf$/);return Response.redirect(u.origin+'/'+(m?m[1]:'en')+'/guide/sumba-7-days/',302);}
 if(p.startsWith('/img/')||p.startsWith('/og/')){const k=p.slice(1);const v=env.IMG?await env.IMG.get(k,{type:'arrayBuffer'}):null;if(v){return new Response(v,{headers:hdr(k.split('.').pop(),p.startsWith('/og/')?'public, max-age=86400':'public, max-age=2592000')});}const fb=OGF[p.slice(4)];if(fb){const v2=await env.IMG.get('og/'+fb+'.jpg',{type:'arrayBuffer'});if(v2)return new Response(v2,{headers:hdr('jpg','public, max-age=3600')});}return new Response('Not found',{status:404,headers:hdr('txt','public, max-age=60')});}
 if(p.endsWith('/'))p+='index.html';
 if(F[p]){if(p.endsWith('.html')&&env.IMG&&ctx)ctx.waitUntil(hit(req,env,u,p));return resp(p,200);}
 if(!/\.[a-z0-9]{2,12}$/i.test(p)&&F[p+'/index.html']){return Response.redirect(u.origin+u.pathname+'/'+u.search,301);}
 const m=p.match(/^\/(en|es|id)\//);return resp(m&&F['/'+m[1]+'/404.html']?'/'+m[1]+'/404.html':'/404.html',404);}};
"""
os.makedirs(W, exist_ok=True)
open(os.path.join(W, "index.js"), "w", encoding="utf-8").write(JS)
META = {"main_module": "index.js", "compatibility_date": "2026-11-01", "keep_bindings": ["secret_text"], "bindings": [{"type": "kv_namespace", "name": "IMG", "namespace_id": KV_NAMESPACE_ID}]}
open(os.path.join(W, "metadata.json"), "w").write(json.dumps(META))
print("worker bytes", len(JS.encode()), "files", len(F))
