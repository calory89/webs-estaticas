// kolaboro.com bulk check against the public index (batch 21, n21d).
//   GET /tools/bulk-check/ (8 languages)   paste or upload up to 100 project names, developer names or links; the browser matches
//                                          them against our public index and shows, per row: tracked or not, link, handover date on
//                                          record, moved dates, permit number published, website health, lookalike websites; CSV export
//   GET /api/x/bulkix                      the compact index the page downloads once (public data only, CC BY 4.0)
// Nothing typed or uploaded leaves the browser: the page fetches the index and matches locally. No AI. This is not the bulk REGISTER
// check at /bulk-check/ (kbx_bulk.js: cadastral references, permit and company numbers looked up in official registers); the two link
// to each other.
import { TB } from './kbx_strings.js';   // n32w: string tables loaded as static JSON (worker size limit)
export const PATHS = /^\/api\/x\/bulkix\/?$/;
export const PAGE = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?tools\/bulk-check\/?$/;
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MAX = 100, V = 'n40k11-1';

// ------------------------------------------------------------------------------------------------ index
const MEMO = {};
async function file(env, name) {
  const m = MEMO[name]; if (m && Date.now() - m.t < 600000) return m.v;
  let r = null;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); } catch (e) { r = null; }
  if (!r || !r.ok) r = await fetch(ORIGIN + '/data/' + name, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!r.ok) throw new Error(name + ' ' + r.status);
  const v = await r.json(); MEMO[name] = { t: Date.now(), v }; return v;
}
const pathOf = u => { try { const x = new URL(u); return (x.hostname.replace(/^www\./, '') + x.pathname).toLowerCase().replace(/\/+$/, ''); } catch (e) { return ''; } };
let NM = null, BUILT = null;
export async function buildIndex(env) {
  if (!NM) NM = await import('./kbx_named.js');
  const ix = await NM.data(env);
  const [web, look, u37] = await Promise.all([file(env, 'web-health.json').catch(() => null), file(env, 'lookalikes.json').catch(() => null), file(env, 'n37u.json').catch(() => null)]);
  if (BUILT && BUILT.ix === ix && BUILT.web === web && BUILT.look === look) return BUILT.v;
  const rgOf = new Map(); for (const r of (u37 && u37.p) || []) { const g = r[8] && r[8][8]; if (g && g[2] === 'reg') rgOf.set(r[0], [String(g[0]).slice(0, 110), g[3] || '']); }   // n40 k11 (R01-41): register entry per project, for the 'is this project late?' box
  const wd = (web && web.d) || {}, w = {}, l = {};
  for (const it of (look && look.items) || []) { const m = String(it.url || '').match(/^\/developers\/([a-z0-9-]+)\/$/); if (m) l[m[1]] = (l[m[1]] || 0) + 1; }
  const health = h => { const d = wd[h]; if (!d) return false; if (!w[h]) w[h] = [String(d.h || '-').slice(-1), d.s || 0, d.ck || (web && web.updated) || '']; return true; };
  const hostsOf = x => [...new Set([x.url, x.du].filter(u => NM.okHttp(u) && !NM.isListing(u)).map(NM.host).filter(Boolean))];
  const p = ix.P.map(x => {
    const hs = hostsOf(x), ho = NM.handoverOf(ix, x), pr = ix.prom[x.id] || [];
    const dvs = x.dvs && ix.devs.has(x.dvs) ? x.dvs : '';
    return [x.s, x.n, x.id, x.dv || '', dvs, x.mk || '', x.co || '', [...new Set([x.url, x.du].filter(NM.okHttp).map(pathOf).filter(Boolean))], hs,
      ho ? String(ho.d) : '', pr.reduce((a, q) => a + (q.mv || 0), 0), x.pn ? 1 : 0, hs.find(health) || '',
      ((ix.caseBy.get(x.id) || {}).stage || x.st) === 'completed' ? 1 : 0, (NM.overdueOf(ix, x) || {}).m || 0, ho && ho.p && ho.p.ph ? String(ho.p.d0) : '', ...(rgOf.get(x.id) || ['', ''])];
  });
  // a website that carries projects of several developers (a marketplace we do not list as a portal) is not any one developer's website
  const hostDevs = {}; for (const x of ix.P) for (const h of hostsOf(x)) (hostDevs[h] = hostDevs[h] || new Set()).add(x.dvs || x.dv || x.id);
  const d = [...ix.devs.values()].map(v => {
    const xs = v.ids.map(i => ix.byId.get(i)).filter(Boolean), hs = [...new Set(xs.flatMap(hostsOf))].filter(h => hostDevs[h].size === 1);
    const cnt = {}; for (const x of xs) for (const h of hostsOf(x)) cnt[h] = (cnt[h] || 0) + 1;
    hs.sort((a, b) => cnt[b] - cnt[a]);
    return [v.s, v.n, xs.length, [...new Set(xs.map(x => x.mk).filter(Boolean))].slice(0, 4).join(', '), hs.slice(0, 12),
      xs.reduce((a, x) => a + (ix.prom[x.id] || []).reduce((b, q) => b + (q.mv || 0), 0), 0), xs.filter(x => x.pn).length, hs.find(health) || ''];
  });
  const v = { version: 'bulk-index-1', updated: NM.iso(ix.updated) || ix.updated, licence: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)', counts: { projects: p.length, developers: d.length },
    sources: { projects: ORIGIN + '/api/v1/projects', promises: ORIGIN + '/data/promises.json', website_health: { url: ORIGIN + '/data/web-health.json', updated: (web && web.updated) || null }, lookalikes: { url: ORIGIN + '/data/lookalikes.json', updated: (look && look.updated) || null, window_days: (look && look.window_days) || null } },
    fields: { p: ['slug', 'name', 'id', 'developer', 'developer_slug', 'market', 'country', 'tracked_pages (host and path)', 'official_hosts', 'handover_on_record', 'times_dates_moved', 'permit_number_published (1 or 0)', 'health_host', 'completed (1 or 0)', 'months past the handover date on record (0: not past)', 'first published handover date when a later one is on record', 'register entry', 'register entry read on'],
      d: ['slug', 'name', 'projects', 'markets', 'official_hosts', 'times_dates_moved', 'projects_with_permit_number', 'health_host'],
      w: TB.kbx_bulkix__s.k0, l: 'developer_slug -> lookalike websites recorded' },
    p, d, w, l };
  BUILT = { ix, web, look, v }; return v;
}
export async function handle(req, u, env, ctx) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('{"error":"method"}', { status: 405, headers: { 'content-type': 'application/json' } });
  const ck = new Request(ORIGIN + '/__bulkix/' + V);
  try { const hit = await caches.default.match(ck); if (hit) return hit; } catch (e) {}
  let v; try { v = await buildIndex(env); } catch (e) { return new Response('{"error":"unavailable"}', { status: 503, headers: { 'content-type': 'application/json', 'retry-after': '60', 'cache-control': 'no-store' } }); }
  const r = new Response(JSON.stringify(v), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=900', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' } });
  if (ctx && ctx.waitUntil) ctx.waitUntil(caches.default.put(ck, r.clone()).catch(() => {}));
  return r;
}

// ------------------------------------------------------------------------------------------------ page
const T = TB.kbx_bulkix_T /* n32w (19 Nov 2026): table moved to /data/i18n/kbx_bulkix.json, filled by kbx_strings.js before any kolaboro.com request is handled */;
const t = (lang, k) => (T[lang] && T[lang][k] != null ? T[lang][k] : T.en[k]);

/* CSS: n40 k17, in /data/i18n/k17s.json */
const LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="9.5" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

function body(lang) {
  const L = k => esc(t(lang, k)), p = pre(lang);
  return '<div class="bk21" data-clarity-mask="true"><section class="bk-hero"><div class="wrap"><p class="crumb"><a href="' + p + '/">Kolaboro</a> / <a href="/tools/">' + L('tools') + '</a> / ' + L('crumb') + '</p><h1>' + L('h1') + '</h1><p class="lead">' + L('lead') + '</p>' +
    '<p class="bk-priv">' + LOCK + '<span><b>' + L('priv_b') + '</b> ' + L('priv') + '</span></p></div></section>' +
    '<section class="bk-sec" aria-labelledby="bk-h-in"><div class="wrap"><h2 id="bk-h-in">' + L('h_in') + '</h2><form class="bk-in" id="bkform" novalidate><div class="k-field"><label class="k-label" for="bkin">' + L('in_label') + '</label>' +
    '<textarea class="k-textarea" id="bkin" data-clarity-mask="true" dir="auto" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="' + L('ph') + '"></textarea></div>' +
    '<div class="bk-row"><button class="btn btn-hi" type="submit" id="bkrun">' + L('run') + '</button><label class="k-btn bk-file"><span>' + L('file') + '</span><input type="file" id="bkfile" accept=".csv,.tsv,.txt,text/csv,text/plain"></label><button class="k-btn k-btn--ghost" type="button" id="bksample">' + L('sample') + '</button><button class="k-btn k-btn--ghost" type="button" id="bkclear">' + L('clear') + '</button><span class="bk-drop">' + L('drop') + '</span></div>' +
    '<p class="bk-status" id="bkstatus" role="status" aria-live="polite"></p></form></div></section>' +
    '<section class="bk-sec" id="bkres" aria-labelledby="bk-h-res" hidden><div class="wrap"><h2 id="bk-h-res" tabindex="-1">' + L('h_res') + '</h2><div class="bk-stats" id="bkstats"></div><div class="bk-tools"><button class="k-btn" type="button" id="bkexp">' + L('exp') + '</button></div>' +
    '<div class="k-table-wrap"><table class="k-table k-table--dense k-table--stack" id="bktable"><thead><tr>' + t(lang, 'j').th.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody></tbody></table></div><p class="bk-src" id="bkdates"></p></div></section>' +
    '<section class="bk-sec" aria-labelledby="bk-h-how"><div class="wrap"><h2 id="bk-h-how">' + L('h_how') + '</h2><ul class="bk-how">' + t(lang, 'how').map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
    '<p class="bk-src">' + L('src') + ' <a class="k-src" href="https://creativecommons.org/licenses/by/4.0/" rel="license noopener">CC BY 4.0</a> <a class="k-src" href="/api/x/bulkix">' + L('src_a') + '</a> <a class="k-src" href="/data/web-health.json">web-health.json</a> <a class="k-src" href="' + p + '/watch/lookalikes/">lookalikes</a></p>' +
    '<p class="bk-src">' + L('reg') + ' <a href="/bulk-check/">' + L('reg_a') + '</a></p></div></section></div>';
}

// the page script: index download, parsing, matching, table and CSV, all on the visitor's device
const JS = `(function(){
var D=document,T=JSON.parse(D.getElementById('kbk-t').textContent),MAX=${MAX},$=function(i){return D.getElementById(i)};
var IX=null,LOAD=null,OUT=[],M={};
function f(s,v){return String(s).replace(/\\{(\\w+)\\}/g,function(m,k){return v&&v[k]!=null?v[k]:m})}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function norm(s){return String(s||'').toLowerCase().normalize('NFKD').replace(/[\\u0300-\\u036f]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9\\u0400-\\u04ff\\u0600-\\u06ff\\u0e00-\\u0e7f\\u3040-\\u30ff\\u4e00-\\u9fff]+/g,' ').replace(/\\s+/g,' ').trim()}
var SUF=/\\b(llc|l l c|ltd|limited|inc|incorporated|pjsc|psc|sa|slu|sl|plc|bhd|berhad|sdn|co|company|corp|corporation|pt|tbk|jsc|gmbh|ag|bv|nv|srl|spa|sas|sarl|doo|group|holding|holdings|properties|property|developments|development|developers|developer|real estate|realty)\\b/g;
function dnorm(s){return norm(s).replace(SUF,' ').replace(/\\s+/g,' ').trim()}
function toks(s){return s.split(' ').filter(function(w){return w.length>1})}
function asUrl(s){s=String(s).trim();if(/\\s/.test(s))return null;if(!/^https?:\\/\\//i.test(s)){if(!/^[a-z0-9-]+(\\.[a-z0-9-]+)+(\\/\\S*)?$/i.test(s))return null;s='https://'+s}
  try{var u=new URL(s),h=u.hostname.toLowerCase().replace(/^www\\./,'');return{host:h,path:(h+u.pathname).toLowerCase().replace(/\\/+$/,''),href:u.href}}catch(e){return null}}
function add(m,k,v){if(!k)return;(m[k]=m[k]||[]).push(v)}
function build(d){IX=d;M={path:{},host:{},pn:{},dn:{},slug:{},dslug:{},pt:[],dt:[]};
  d.p.forEach(function(p,i){M.slug[p[0]]=i;p[7].forEach(function(u){add(M.path,u,i)});p[8].forEach(function(h){add(M.host,h,i)});var n=norm(p[1]);add(M.pn,n,i);M.pt.push(toks(n))});
  d.d.forEach(function(v,i){M.dslug[v[0]]=i;var n=dnorm(v[1]);add(M.dn,n,i);if(norm(v[1])!==n)add(M.dn,norm(v[1]),i);M.dt.push(toks(n))});}
function load(){if(LOAD)return LOAD;LOAD=fetch('/api/x/bulkix',{headers:{accept:'application/json'}}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(d){build(d);return d}).catch(function(e){LOAD=null;throw e});return LOAD}
function uniq(a){return a.filter(function(x,i){return a.indexOf(x)===i})}
function devOfHost(h){for(var i=0;i<IX.d.length;i++)if(IX.d[i][4].indexOf(h)>=0)return i;return -1}
function matchUrl(u){
  if(u.host==='kolaboro.com'){var m=u.path.match(/\\/(projects|developers)\\/([a-z0-9-]+)/);if(m&&m[1]==='projects'&&M.slug[m[2]]!=null)return{k:'p',c:'exact',r:[M.slug[m[2]]]};if(m&&m[1]==='developers'&&M.dslug[m[2]]!=null)return{k:'d',c:'exact',r:[M.dslug[m[2]]]};return null}
  var all=M.host[u.host]?uniq(M.host[u.host]):[],a=M.path[u.path],dv=devOfHost(u.host);
  // a home page (or a one-step path such as /en) on a website that carries several tracked projects is the developer, not one project
  if(all.length>1&&dv>=0&&(u.path===u.host||/^[^\\/]+\\/[a-z]{2}(-[a-z]{2})?$/.test(u.path))&&(!a||uniq(a).length<all.length))return{k:'d',c:'exact',r:[dv],site:all.length};
  if(a)return{k:'p',c:'exact',r:uniq(a)};
  a=all;if(!a.length)return null;
  if(u.path!==u.host){var best=null,bl=0;a.forEach(function(i){IX.p[i][7].forEach(function(pp){if(pp.indexOf(u.host)===0&&pp.length>u.host.length&&(u.path.indexOf(pp)===0||pp.indexOf(u.path)===0)&&pp.length>bl){best=i;bl=pp.length}})});if(best!=null)return{k:'p',c:'exact',r:[best]}}
  if(a.length===1)return{k:'p',c:u.path===u.host?'exact':'close',r:a};
  if(dv>=0)return{k:'d',c:'exact',r:[dv],site:a.length};
  return{k:'p',c:'close',r:a.slice(0,3),site:a.length}}
var STOP={the:1,by:1,at:1,of:1,de:1,la:1,el:1,le:1,al:1,and:1,residences:1,residence:1,villas:1,villa:1,tower:1,towers:1,apartments:1,homes:1,project:1,resort:1,beach:1,city:1,park:1,one:1};
function fuzzy(tk,list){var best=-1,bs=0;if(tk.length<1)return null;for(var i=0;i<list.length;i++){var b=list[i];if(!b.length)continue;var n=0,ns=0;for(var j=0;j<tk.length;j++)if(b.indexOf(tk[j])>=0){n++;if(!STOP[tk[j]])ns++}if(!ns)continue;
    var s=n/Math.max(tk.length,b.length),sub=n===tk.length||n===b.length;if(sub&&n>=2)s=Math.max(s,.75+.2*n/Math.max(tk.length,b.length));if(n<2&&!(n===1&&tk.length===1&&b.length===1))continue;if(s>bs){bs=s;best=i}}
  return bs>=.6?{i:best,s:bs}:null}
function matchName(s){var n=norm(s);if(!n||n.length<2)return null;
  var a=M.pn[n];if(a)return{k:'p',c:'exact',r:uniq(a)};
  var dn=dnorm(s);a=M.dn[n]||(dn&&M.dn[dn]);if(a){a=uniq(a);var ex=a.filter(function(i){return norm(IX.d[i][1])===n});if(ex.length!==1){ex=a.filter(function(i){var x=norm(IX.d[i][1]);return x.length>3&&n.indexOf(x+' ')===0}).sort(function(i,j){return IX.d[j][1].length-IX.d[i][1].length});if(ex.length>1&&norm(IX.d[ex[0]][1]).length>norm(IX.d[ex[1]][1]).length)ex=[ex[0]]}if(ex.length===1)a=ex;return{k:'d',c:a.length===1?'exact':'close',r:a.slice(0,3)}}
  var by=n.split(' by ');if(by.length===2&&by[0].length>2){a=M.pn[by[0]];if(a)return{k:'p',c:'close',r:uniq(a).slice(0,3)}}
  var fp=fuzzy(toks(n),M.pt),fd=fuzzy(toks(dn),M.dt);
  if(fp&&(!fd||fp.s>=fd.s))return{k:'p',c:'close',r:[fp.i]};if(fd)return{k:'d',c:'close',r:[fd.i]};return null}
function matchRow(cells){var i,u,m,first=null;
  for(i=0;i<cells.length;i++){u=asUrl(cells[i]);if(u){m=matchUrl(u);if(m&&m.c==='exact')return m;if(m&&!first)first=m}}
  for(i=0;i<cells.length;i++){if(/^https?:\\/\\/|\\//i.test(cells[i])&&asUrl(cells[i]))continue;m=matchName(cells[i]);if(m&&m.c==='exact')return m;if(m&&!first)first=m}
  return first}
function parse(text){var rows=[],row=[],cur='',q=false,i,c;text=String(text).replace(/^\\ufeff/,'');
  
  function endCell(){row.push(cur.trim());cur=''}function endRow(){endCell();if(row.some(function(x){return x}))rows.push(row.filter(function(x){return x}));row=[]}
  for(i=0;i<text.length;i++){c=text[i];if(q){if(c==='"'){if(text[i+1]==='"'){cur+='"';i++}else q=false}else cur+=c}else if(c==='"'&&!cur.trim())q=true;else if(c===','||c===';'||c==='\\t')endCell();else if(c==='\\n'||c==='\\r'){if(c==='\\r'&&text[i+1]==='\\n')i++;endRow()}else cur+=c}
  endRow();
  if(rows.length>1&&rows[0].every(function(x){return /^(name|project|project name|developer|developer name|url|link|website|site|id|#|no|market|country|city|nombre|proyecto|promotor|enlace)$/i.test(x)}))rows.shift();
  return rows}
var LOC=T.locale;
function fdate(s){s=String(s||'');var m;if((m=s.match(/^(\\d{4})-Q([1-4])$/)))return'Q'+m[2]+' '+m[1];if((m=s.match(/^(\\d{4})-H([12])$/)))return'H'+m[2]+' '+m[1];
  try{if((m=s.match(/^(\\d{4})-(\\d{2})$/)))return new Intl.DateTimeFormat(LOC,{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(+m[1],+m[2]-1,1)));
  if((m=s.match(/^(\\d{4})-(\\d{2})-(\\d{2})/)))return new Intl.DateTimeFormat(LOC,{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(+m[1],+m[2]-1,+m[3])))}catch(e){}return s}
function health(h){var w=h&&IX.w[h];if(!w)return{t:T.h_none,d:''};var k={u:'h_u',b:'h_b',x:'h_x','0':'h_0','-':'h_n'}[w[0]]||'h_none';return{t:f(T[k],{s:w[1]}),d:w[2]}}
function rec(q,m){var o={q:q,status:'not',type:'',name:'',url:'',dev:'',ho:'',moved:'',permit:'',site:'',health:'',hck:'',look:'',note:'',alts:[]};if(!m)return o;
  o.status=m.c==='exact'?'tracked':'close';o.type=m.k;
  if(m.k==='p'){var p=IX.p[m.r[0]];o.name=p[1];o.url=T.pre+'/projects/'+p[0]+'/';o.dev=p[3];o.place=[p[5],p[6]!==p[5]?p[6]:''].filter(Boolean).join(', ');o.ho=p[9];o.moved=p[10];o.permit=p[11]?T.pub:T.notpub;o.site=p[12]||p[8][0]||'';var h=health(p[12]);o.health=h.t;o.hck=h.d;o.look=p[4]?(IX.l[p[4]]||0):'';
    if(m.site)o.note=f(T.site,{n:m.site});else if(m.r.length>1)o.note=f(T.multi,{n:m.r.length});o.alts=m.r.slice(1,3).map(function(i){return{n:IX.p[i][1]+(IX.p[i][5]?', '+IX.p[i][5]:''),u:T.pre+'/projects/'+IX.p[i][0]+'/'}})}
  else{var v=IX.d[m.r[0]];o.name=v[1];o.url=T.pre+'/developers/'+v[0]+'/';o.place=v[3];o.ho=f(T.dprojects,{n:v[2]});o.hoText=true;o.moved=v[5];o.permit=f(T.dperm,{k:v[6],n:v[2]});o.site=v[7]||v[4][0]||'';var h2=health(v[7]);o.health=h2.t;o.hck=h2.d;o.look=IX.l[v[0]]||0;
    if(m.site)o.note=f(T.site,{n:m.site});o.alts=m.r.slice(1,3).map(function(i){return{n:IX.d[i][1],u:T.pre+'/developers/'+IX.d[i][0]+'/'}})}
  return o}
function td(i,html,cls){return'<td data-label="'+esc(T.th[i])+'"'+(cls?' class="'+cls+'"':'')+'><div>'+html+'</div></td>'}
function render(n){var c={tracked:0,close:0,not:0};OUT.forEach(function(o){c[o.status]++});
  $('bkstats').innerHTML=['tracked','close','not'].map(function(k){return'<div class="k-stat"><b>'+c[k]+'</b><span>'+esc(c[k]===1&&T['s_'+k+'1']||T['s_'+k])+'</span></div>'}).join('');
  $('bktable').tBodies[0].innerHTML=OUT.map(function(o){
    var badge=o.status==='tracked'?'<span class="k-badge k-badge--ok">'+esc(T.tracked)+'</span>':o.status==='close'?'<span class="k-badge k-badge--warn">'+esc(T.close)+'</span>':'<span class="k-badge k-badge--plain">'+esc(T.not)+'</span>';
    var m=badge;
    if(o.status!=='not'){m+='<div class="bk-nm"><a href="'+esc(o.url)+'"><bdi>'+esc(o.name)+'</bdi></a></div><small>'+esc(o.type==='p'?T.proj:T.dev)+(o.dev?' · <bdi>'+esc(o.dev)+'</bdi>':'')+(o.place?' · '+esc(o.place):'')+'</small>'+(o.note?'<small>'+esc(o.note)+'</small>':'')+o.alts.map(function(a){return'<small><a href="'+esc(a.u)+'"><bdi>'+esc(a.n)+'</bdi></a></small>'}).join('')}
    else{var u=asUrl(o.q.split(' | ')[0]);m+='<small><a href="'+T.pre+'/check/?'+(u?'url='+encodeURIComponent(u.href):'q='+encodeURIComponent(o.q.split(' | ')[0]))+'">'+esc(T.check)+'</a></small>'}
    var dash='<span class="k-muted">-</span>',no=o.status==='not';
    return'<tr>'+td(0,'<bdi>'+esc(o.q)+'</bdi>','bk-q')+td(1,m,'bk-m')+td(2,no?dash:o.hoText?esc(o.ho):o.ho?esc(fdate(o.ho)):'<span class="k-muted">'+esc(T.none)+'</span>')+td(3,no?dash:String(o.moved),'k-n')+td(4,no?dash:esc(o.permit))+
      td(5,no?dash:(o.site?'<span class="bk-ltr">'+esc(o.site)+'</span>':'')+'<small>'+esc(o.health)+(o.hck?', '+esc(f(T.ck,{d:fdate(o.hck)})):'')+'</small>')+td(6,no||o.look===''?dash:o.look?esc(f(T.look,{n:o.look})):'<span class="k-muted">'+esc(T.look0)+'</span>')+'</tr>'}).join('');
  var S=IX.sources||{};$('bkdates').textContent=f(T.web_d,{a:fdate((S.website_health||{}).updated||''),b:fdate((S.lookalikes||{}).updated||'')});
  $('bkres').hidden=false;
  status((n>MAX?f(T.cut,{max:MAX,n:n})+' ':'')+f(T.done,{n:OUT.length,p:IX.counts.projects,d:IX.counts.developers,date:fdate(IX.updated)}));
  var h=$('bk-h-res');try{h.focus({preventScroll:true})}catch(e){}h.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}
function status(s,bad){var e=$('bkstatus');e.textContent=s;e.classList.toggle('is-bad',!!bad)}
function run(){var rows=parse($('bkin').value);if(!rows.length){status(T.empty,true);$('bkin').focus();return}
  var b=$('bkrun');b.disabled=true;status(T.load);
  load().then(function(){OUT=rows.slice(0,MAX).map(function(r){return rec(r.join(' | ').slice(0,300),matchRow(r))});render(rows.length);if(window.gtag)try{gtag('event','bulk_check',{rows:OUT.length})}catch(e){}}).catch(function(){status(T.err,true)}).then(function(){b.disabled=false})}
function cell(v){v=String(v==null?'':v);if(/^[=+\\-@\\t\\r]/.test(v))v="'"+v;return /[",\\n\\r;]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
function csv(){var H=['input','match','type','name','kolaboro_url','developer','handover_on_record','times_dates_moved','permit_number','official_website','website_last_check','website_checked_on','lookalike_websites_recorded','note'];
  var L=[H.join(',')];OUT.forEach(function(o){L.push([o.q,o.status==='tracked'?'tracked':o.status==='close'?'close match, confirm':'not tracked',o.type==='p'?'project':o.type==='d'?'developer':'',o.name,o.url?'https://kolaboro.com'+o.url:'',o.dev,o.ho,o.moved,o.status==='not'?'':o.permit,o.site,o.status==='not'?'':o.health,o.hck,o.look,o.note].map(cell).join(','))});
  var blob=new Blob(['\\ufeff'+L.join('\\r\\n')+'\\r\\n'],{type:'text/csv;charset=utf-8'}),a=D.createElement('a');a.href=URL.createObjectURL(blob);a.download='kolaboro-bulk-check-'+new Date().toISOString().slice(0,10)+'.csv';D.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1500)}
function readFile(fl){if(!fl)return;if(fl.size>2097152){status(T.toobig,true);return}var r=new FileReader();r.onload=function(){$('bkin').value=String(r.result||'');status('');run()};r.readAsText(fl)}
$('bkform').addEventListener('submit',function(e){e.preventDefault();run()});
$('bkfile').addEventListener('change',function(){readFile(this.files[0]);this.value=''});
$('bkclear').addEventListener('click',function(){$('bkin').value='';OUT=[];$('bkres').hidden=true;status('');$('bkin').focus()});
$('bkexp').addEventListener('click',csv);
$('bksample').addEventListener('click',function(){var b=this;b.disabled=true;status(T.load);load().then(function(d){var P=d.p,pick=[P[0],P[Math.floor(P.length/3)],P[Math.floor(P.length/2)]].filter(Boolean),dv=d.d.slice().sort(function(a,b){return b[2]-a[2]})[0];
    var L=[pick[0]?pick[0][1]:'',pick[1]&&pick[1][7][0]?'https://'+pick[1][7][0]:'',dv?dv[1]:'',pick[2]?pick[2][1].split(' ').slice(0,3).join(' ')+' Residences':'','Example Tower That Is Not On Any List'].filter(Boolean);$('bkin').value=L.join('\\n');status('');run()}).catch(function(){status(T.err,true)}).then(function(){b.disabled=false})});
var ta=$('bkin');['dragenter','dragover'].forEach(function(n){ta.addEventListener(n,function(e){if(e.dataTransfer&&[].indexOf.call(e.dataTransfer.types||[],'Files')>=0){e.preventDefault();ta.classList.add('is-drop')}})});
['dragleave','drop'].forEach(function(n){ta.addEventListener(n,function(e){ta.classList.remove('is-drop');if(n==='drop'&&e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0]){e.preventDefault();readFile(e.dataTransfer.files[0])}})});
ta.addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();run()}});
window.KBBulk={parse:parse,matchRow:matchRow,load:load};
})();`;

async function assemble(shellRes, lang) {
  const path = '/tools/bulk-check/', url = ORIGIN + pre(lang) + path, title = t(lang, 'title'), desc = t(lang, 'desc');
  const alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + path + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + path + '">';
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebApplication', '@id': url + '#app', name: title, description: desc, url, inLanguage: lang, applicationCategory: 'BusinessApplication', operatingSystem: 'Any (web browser)', isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }, provider: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + pre(lang) + '/' }, { '@type': 'ListItem', position: 2, name: t(lang, 'tools'), item: ORIGIN + '/tools/' }, { '@type': 'ListItem', position: 3, name: t(lang, 'crumb'), item: url }] }] };
  const tags = '<title>' + esc(title) + ' | Kolaboro</title><meta name="description" content="' + esc(desc) + '"><link rel="canonical" href="' + url + '">' + alts +
    TB.kbx_bulkix__s.k1 + esc(title) + ' | Kolaboro"><meta property="og:description" content="' + esc(desc) + '"><meta property="og:url" content="' + url + '"><meta property="og:image" content="' + ORIGIN + '/k/og/pricing.png"><meta name="twitter:card" content="summary_large_image">' +
    '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' + TB.kbx_bulkix__s.CSS;
  const js = Object.assign({}, t(lang, 'j'), { pre: pre(lang), locale: LOC[lang] || 'en-GB' });
  const tail = '<script type="application/json" id="kbk-t">' + JSON.stringify(js).replace(/</g, '\\u003c') + '</script><script>' + JS + '</script>';
  const res = new HTMLRewriter()
    .on('title', { element(e) { e.remove(); } })
    .on(TB.kbx_bulkix__s.k2, { element(e) { e.remove(); } })
    .on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(body(lang) + tail, { html: true }); } })
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + path); } })
    .transform(new Response(shellRes.body, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
  return await res.text();
}
export async function page(req, u, env, ctx, shell) {
  const m = u.pathname.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?tools\/bulk-check(\/?)$/); if (!m || !shell) return null;
  if (!m[2]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
  const lang = m[1] || 'en';
  try {
    const sh = await shell(pre(lang) + '/how-we-score/');
    if (!sh || sh.status !== 200) return null;
    return new Response(await assemble(sh, lang), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600' } });
  } catch (e) { return null; }
}
export { T as BULKIX_T, JS as BULKIX_JS };
