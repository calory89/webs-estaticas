// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_u26__q, $s = TB.kbx_u26__s, $t = TB.kbx_u26__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { t30, radarSvg } from './kbx_n30a.js';
import { T as NT } from './kbx_named_i18n.js';
import { regSale, rsText } from './kbx_n31d_rs.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const COI_RX = /eco\s*beach\s*city|\bequinox\b/i;
const pre = l => l === 'en' ? '' : '/' + l;
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a, "'": '&#39;' }[c]));
const bdi = (lang, s) => lang === 'ar' ? '<bdi>' + esc(s) + $q.b : esc(s);
const S = TB.kbx_u26_S ;
export const t26 = (lang, k, v) => { let s = (S[lang] && S[lang][k] != null) ? S[lang][k] : S.en[k]; if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b); return s; };
const stK = s => s === $q.c ? $q.d : s === $q.e ? $q.f : s === $q.g ? $q.h : $q.i;
export function nextStep(lang, x, name, cmp, txt) {
const P = pre(lang), url = ORIGIN + P + $q.j + x.s + '/';
const cmpHref = P + $q.k + [x.s].concat(cmp || []).slice(0, 4).join(',');
const wa = $q.l + encodeURIComponent((txt || name) + ' ' + url);
const m = { ok: t26(lang, 'sh_ok'), saved: t26(lang, $q.m), save: t26(lang, $q.n), url, title: name };
return $t.k0 + esc(JSON.stringify(m)) + $q.o + esc(t26(lang, 'nx_h')) + $q.p +
((cmp || []).length ? $q.q + esc(cmpHref) + $t.k1 + esc(t26(lang, $q.r)) + $q.s : '') +
$s.k0 + esc(t26(lang, $q.n)) + $q.t +
$t.k2 + esc(t26(lang, $q.u)) + $q.s +
$q.v + encodeURIComponent(x.id) + $q.w + esc(t26(lang, $q.x)) + $q.s +
$q.q + P + $q.j + x.s + $t.k3 + esc(t30(lang, $q.y)) + $q.s +
$q.z + x.s + '/' + (lang === 'en' ? '' : $q.A + lang) + $t.k4 + esc((NT[lang] || NT.en || {}).rel_embed || $q.B) + $q.C +
$q.D + esc(t26(lang, 'sh')) + $q.E + esc(wa) + $t.k5 + esc(t26(lang, $q.F)) + $t.k6 + esc(t26(lang, $q.G)) + $t.k7 +
$t.k8 + esc(t26(lang, 'nx_my')) + $q.H;
}
export const NX_CSS = '';
export const NX_JS = "(function(){var N=document.querySelector('[data-kn]');if(!N)return;var M=JSON.parse(N.getAttribute('data-kn')),o=N.querySelector('.knx-o'),sv=N.querySelector('[data-kn-save]'),star=document.querySelector('[data-kw-save]');" +
"function sync(){if(!star){sv.parentNode.hidden=true;return;}var on=star.getAttribute('aria-pressed')==='true';sv.setAttribute('aria-pressed',on?'true':'false');sv.children[0].textContent=on?'\\u2605':'\\u2606';sv.children[1].textContent=on?M.saved:M.save;}" +
"sync();if(star){sv.addEventListener('click',function(){star.click();setTimeout(sync,400);setTimeout(sync,1500);});new MutationObserver(sync).observe(star,{attributes:true,attributeFilter:['aria-pressed']});}" +
"var al=N.querySelector('[data-kn-alert]');if(al)al.addEventListener('click',function(e){var b=document.querySelector('[data-kw-btn]');var w=document.getElementById('watch');if(!w)return;e.preventDefault();w.scrollIntoView({block:'center'});if(b&&!b.hidden)setTimeout(function(){b.focus();},300);else{var i=w.querySelector('input[type=email]');if(i&&!i.closest('[hidden]'))i.focus();}});" +
"N.querySelector('[data-kn-copy]').addEventListener('click',function(){var done=function(){o.textContent=M.ok;setTimeout(function(){o.textContent='';},2500);};try{navigator.clipboard.writeText(M.url).then(done,function(){prompt('',M.url);});}catch(e){prompt('',M.url);}try{if(window.kbEvent)kbEvent('share_copy');}catch(e){}});" +
"var sh=N.querySelector('[data-kn-share]');if(navigator.share){sh.hidden=false;sh.addEventListener('click',function(){navigator.share({title:M.title,text:(function(){try{var w=N.querySelector('.knx-s a'),t=new URL(w.href).searchParams.get('text')||'';return t.replace(M.url,'').trim()||undefined;}catch(e){return undefined;}})(),url:M.url}).catch(function(){});try{if(window.kbEvent)kbEvent('share_native');}catch(e){}});}" +
"var W=document.querySelector('[data-kw]');if(W&&'IntersectionObserver'in window){var id=JSON.parse(W.getAttribute('data-kw')).id,io=new IntersectionObserver(function(es){if(!es[0].isIntersecting)return;io.disconnect();fetch('/api/v1/followers?id='+encodeURIComponent(id)).then(function(r){return r.ok?r.json():null;}).then(function(j){if(!j||!j.followers||!j.text)return;var p=document.createElement('p');p.className='kw-fol';p.textContent=j.text;var t=W.querySelector('.kw-t');(t||W).appendChild(p);}).catch(function(){});},{rootMargin:'200px'});io.observe(W);}" +
"})();";
export function filterBar(lang) {
const m = {}; for (const k of ['any', 'pm_y', 'pm_n', 'sc_n', 'yr_n', 'f_k', 'f_k1', 'f_0', $q.I, 'f_err', 'f_ck', 'f_sct', 'f_clr']) m[k] = t26(lang, k);
m.lang = lang; m.pre = pre(lang);
const sel = (id, lbl, opts) => $q.J + id + $q.K + esc(t26(lang, lbl)) + $q.L + id + $q.M + id + '">' + opts + $q.N;
const anyO = $q.O + esc(t26(lang, 'any')) + $q.P;
return $q.Q + esc(JSON.stringify(m)) + $q.R + esc(t26(lang, 'f_h')) + $t.k9 +
sel('co', 'f_co', anyO) + sel('pl', 'f_pl', anyO) + sel('yr', 'f_yr', anyO) +
sel('pm', 'f_pm', anyO + $q.S + esc(t26(lang, 'pm_y')) + $q.T + esc(t26(lang, 'pm_n')) + $q.P) +
sel('sc', 'f_sc', anyO + [25, 50, 75].map(n => $q.U + n + '">' + esc(t26(lang, 'sc_n', { n })) + $q.P).join('')) +
sel('so', 'f_so', ['0', 'tr', 'ho', 'ck'].map(k => $q.U + (k === '0' ? '' : k) + '">' + esc(t26(lang, 'so_' + k)) + $q.P).join('')) +
$q.V + esc(t26(lang, 'f_clr')) + $s.k1;
}
export const KF_CSS = '';
export const KF_JS = "(function(){var K=document.querySelector('[data-kf]');if(!K)return;var M=JSON.parse(K.getAttribute('data-kf')),F=K.querySelector('form'),n=K.querySelector('.kf-n'),out=K.querySelector('.kf-out'),L=document.querySelector('[data-kx-lists]'),D=null,P=null,lim=100;" +
"var loc={zh:'zh-CN',ar:'ar'}[M.lang]||M.lang,col;try{col=new Intl.Collator(loc);}catch(e){col={compare:function(a,b){return a<b?-1:a>b?1:0;}};}" +
"function fdt(d){try{return new Date(d+'T12:00:00Z').toLocaleDateString(loc,{day:'numeric',month:'short',year:'numeric'});}catch(e){return d;}}" +
"function opts(s,vals,cur){var a=s.options[0].outerHTML;vals.forEach(function(v){a+='<option></option>';});s.innerHTML=a;vals.forEach(function(v,i){var o=s.options[i+1];o.value=v[0];o.textContent=v[1];});s.value=cur||'';}" +
"function load(){if(P)return P;n.textContent='\\u2026';P=fetch('/api/v1/facets?lang='+M.lang).then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(j){D=j.p.map(function(r){var o={};j.fields.forEach(function(f,i){o[f]=r[i];});return o;});return D;}).catch(function(){P=null;n.textContent=M.f_err;});return P;}" +
"function uniq(rows,k,lab){var m={};rows.forEach(function(r){if(r[k]!=null&&r[k]!=='')m[r[k]]=lab?r[lab]:r[k];});return Object.keys(m).map(function(v){return[v,m[v]];});}" +
"function fill(){var co=F.co.value,pl=F.pl.value;opts(F.co,uniq(D,'co','con').sort(function(a,b){return col.compare(a[1],b[1]);}),co);" +
"opts(F.pl,uniq(D.filter(function(r){return!co||r.co===co;}),'pl','pln').sort(function(a,b){return col.compare(a[1],b[1]);}),pl);if(F.pl.value!==pl)F.pl.value='';" +
"var ys=uniq(D,'yr').map(function(v){return v[0];}).sort();opts(F.yr,ys.map(function(y){return[y,y];}).concat([['none',M.yr_n]]),F.yr.value);}" +
"function st(){var q={};['co','pl','yr','pm','sc','so'].forEach(function(k){if(F[k].value)q[k]=F[k].value;});return q;}" +
"function url(q){try{var u=new URL(location.href);['co','pl','yr','pm','sc','so'].forEach(function(k){if(q[k])u.searchParams.set(k,q[k]);else u.searchParams.delete(k);});history.replaceState(null,'',u);}catch(e){}}" +
"var SUM=K.querySelector('summary'),S0=SUM.textContent;function cnt(q){var k=Object.keys(q).filter(function(x){return x!=='so';}).length;SUM.textContent=S0+(k?' ('+k+')':'');}function run(){var q=st();url(q);cnt(q);if(!Object.keys(q).length){out.hidden=true;out.innerHTML='';n.textContent='';if(L)L.hidden=false;if(D)fill();return;}load().then(function(){if(!D)return;fill();q=st();" +
"var R=D.filter(function(r){if(q.co&&r.co!==q.co)return false;if(q.pl&&r.pl!==q.pl)return false;if(q.yr&&(q.yr==='none'?r.yr!=null:String(r.yr)!==q.yr))return false;if(q.pm&&String(+!!r.pm)!==q.pm)return false;if(q.sc&&!(r.sc>=+q.sc))return false;return true;});" +
"var z=function(v,d){return v==null?d:v;};R.sort(q.so==='tr'?function(a,b){return z(b.sc,-1)-z(a.sc,-1)||col.compare(a.n,b.n);}:q.so==='ho'?function(a,b){return col.compare(z(a.hk,'9999'),z(b.hk,'9999'))||col.compare(a.n,b.n);}:q.so==='ck'?function(a,b){return col.compare(z(b.ck,''),z(a.ck,''))||col.compare(a.n,b.n);}:function(a,b){return col.compare(a.pln,b.pln)||col.compare(a.n,b.n);});" +
"if(L)L.hidden=true;out.hidden=false;n.textContent=R.length===1?M.f_k1:M.f_k.replace('{k}',R.length.toLocaleString(loc));lim=100;draw(R);});}" +
"function draw(R){out.innerHTML='';if(!R.length){var e=document.createElement('li');e.className='kf-0';e.textContent=M.f_0+' ';var cb=document.createElement('button');cb.type='button';cb.className='kf-r';cb.textContent=M.f_clr;cb.addEventListener('click',function(){F.reset();F.co.focus();});e.appendChild(cb);out.appendChild(e);var o0=K.querySelector('.kf-more');if(o0)o0.remove();return;}R.slice(0,lim).forEach(function(r){var li=document.createElement('li'),a=document.createElement('a'),s=document.createElement('small');a.href=M.pre+'/projects/'+r.s+'/';a.textContent=r.n;" +
"s.textContent=[r.dv,r.pln,r.ho,r.sc!=null?M.f_sct.replace('{s}',r.sc):'',r.ck?M.f_ck.replace('{d}',fdt(r.ck)):''].filter(Boolean).join(' \\u00b7 ');li.appendChild(a);li.appendChild(s);out.appendChild(li);});" +
"var old=K.querySelector('.kf-more');if(old)old.remove();if(R.length>lim){var b=document.createElement('button');b.type='button';b.className='kf-more';b.textContent=M.f_more;b.addEventListener('click',function(){lim+=200;draw(R);});out.after(b);}}" +
"F.addEventListener('change',run);F.addEventListener('reset',function(){setTimeout(run,0);});F.addEventListener('submit',function(e){e.preventDefault();});K.addEventListener('toggle',function(){if(K.open)load().then(function(){if(D)fill();});});" +
"try{var u=new URL(location.href),has=false;['co','pl','yr','pm','sc','so'].forEach(function(k){var v=u.searchParams.get(k);if(v){has=true;var s=F[k];if(![].some.call(s.options,function(o){return o.value===v;})){var o=document.createElement('option');o.value=v;o.textContent=v;s.appendChild(o);}s.value=v;}});if(has){K.open=true;run();}}catch(e){}" +
"})();";
const JT = 'application/json; charset=utf-8';
const jr = (o, st, cc) => new Response(JSON.stringify(o), { status: st || 200, headers: { 'content-type': JT, 'cache-control': cc || $q.W, 'access-control-allow-origin': '*', 'x-content-type-options': $q.X } });
let FAC = new Map();
const TYPE_RX = [['v', /villa/i], ['t', /town ?house|townhome|row ?house|terrace house/i], ['p', /penthouse/i], ['s', /studio/i], ['l', /\bland\b|\bplots?\b|\blots?\b/i], ['h', /hotel|serviced|condotel|branded suite/i], ['o', /office|shop|retail|commercial|showroom/i], ['a', /apartment|\bflats?\b|condo|\b\d\s?br\b|bedroom|residence|loft|duplex|simplex|\bunit/i]];
const typesOf = ut => { const o = new Set(); for (const u of (Array.isArray(ut) ? ut : [])) { let hit = false; for (const [k, re] of TYPE_RX) if (re.test(String(u))) { if (k === 'a' && hit) continue; o.add(k); hit = true; } } return [...o].sort().join(''); };
let ECBR = null;
async function ecbPerUsd() {
if (ECBR && Date.now() - ECBR.t < 43200000) return ECBR.v;
try {
const r = await fetch($t.k10, { cf: { cacheTtl: 21600, cacheEverything: true }, headers: { 'user-agent': $t.k11 } });
const t = await r.text(), eu = { EUR: 1 }; for (const m of t.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([\d.]+)['"]/g)) eu[m[1]] = +m[2];
if (!eu.USD) throw 0;
const v = { d: (/time=['"](\d{4}-\d\d-\d\d)/.exec(t) || [])[1] || null, src: $t.k12, r: {} };
for (const [c, x] of Object.entries(eu)) v.r[c] = Math.round(x / eu.USD * 1e6) / 1e6;
v.r.USD = 1; v.r.AED = 3.6725; v.peg = { AED: $t.k13 };
ECBR = { t: Date.now(), v }; return v;
} catch (e) { ECBR = { t: Date.now() - 43200000 + 600000, v: null }; return null; }
}
async function facets(env, lang) {
const N = await import('./kbx_named.js'), H = await import('./kbx_hdate.js');
const ix = await N.data(env);
let tr = null; try { tr = await (await import('./kbx_tr.js')).trData(env); } catch (e) {}
const fx = await ecbPerUsd();
const k = lang + '|' + (tr ? tr.v : '') + '|' + (fx ? fx.d : '');
const c = FAC.get(lang); if (c && c.ix === ix && c.k === k) return c.v;
const p = [];
for (const x of ix.P) {
if (COI_RX.test(String(x.n || '')) || COI_RX.test(String(x.dv || ''))) continue;
const ho = N.handoverOf(ix, x), r = tr && tr.rows.get(x.id);
const cc = ix.caseBy.get(x.id) || {}, f = x.fx || {}, pr = +f.price_min > 0 && !regSale(x) ? +f.price_min : null, cu = pr && f.currency ? String(f.currency).toUpperCase() : null;
const pu = pr && cu ? (cu === 'USD' ? pr : fx && fx.r[cu] ? Math.round(pr / fx.r[cu]) : null) : null;
p.push([x.s, x.n, x.dv || '', x.co || '', H.coName(x.co, lang) || x.co || '', x.mk || '', H.mkName(x.mk, lang), ho ? H.hyear(ho.d) : null, ho ? H.hkey(ho.d) : null, ho ? H.hdisp(ho.d, lang) : '',
(x.pn || (cc.checks || {}).permit === 2) ? 1 : 0, r ? r.score : null, N.lastmod(ix, x), typesOf(f.unit_types), pr, cu, pu, cc.stage || x.st || null, x.ar && x.ar !== x.mk ? x.ar : null]);
}
const v = JSON.stringify({ version: $q.Y, lang, updated: ix.updated, license: $q.Z, note: $s.k2 + ORIGIN + $s.k3,
fields: ['s', 'n', 'dv', 'co', 'con', 'pl', 'pln', 'yr', 'hk', 'ho', 'pm', 'sc', 'ck', 'ty', 'pr', 'cu', 'pu', 'st', 'ar'], fx, p });
FAC.set(lang, { ix, k, v }); return v;
}
async function followers(u, env, ctx) {
const id = String(u.searchParams.get('id') || '').toUpperCase();
if (!/^[A-Z]{2,6}-[0-9]{2,4}$/.test(id)) return jr({ error: 'id' }, 400);
const N = await import('./kbx_named.js'); let ix; try { ix = await N.data(env); } catch (e) { return jr({ error: 'data' }, 503); }
if (!ix.byId.get(id)) return jr({ error: $q.aa }, 404);
const lang = LANGS.includes(u.searchParams.get('lang')) ? u.searchParams.get('lang') : 'en';
const ck = new Request(ORIGIN + $q.ab + id);
let n = null, hit = null;
try { hit = await caches.default.match(ck); } catch (e) {}
if (hit) n = (await hit.json()).n;
else {
let r = null; try { const { rpcW } = await import('./kolaboro.js'); r = await rpcW($q.ac, { p_action: $q.ad, p_payload: { domain: '', ref: id } }); } catch (e) {}
if (!r || !r.ok) return jr({ id, followers: null, threshold: 3, note: $q.ae }, 200, $q.af);
n = r.watchers || null;
try { ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify({ n }), { headers: { 'cache-control': $q.ag } }))); } catch (e) {}
}
return jr({ id, followers: n, threshold: 3, text: n ? t26(lang, 'fol1', { n }) : null, about: $t.k14 }, 200, $q.ah);
}
export const KEY_PAGES = ['/', '/projects/', '/es/projects/', '/ar/projects/', '/projects/elements-cyprus/', '/de/projects/elements-cyprus/', '/developers/emaar-properties/', '/rankings/transparency/', '/rankings/transparency/bali/',
'/check/', '/pricing/', '/database/', '/compare/', '/watchlist/', '/tools/', '/countries/', '/llms.txt', '/sitemap.xml', '/api/open/stats', '/api/v1/search-index'];
const SWEEP_TTL = 300;
let SWEEPING = null;
async function sweep(env) {
const commit = String(env.CF_PAGES_COMMIT_SHA || '').slice(0, 12) || $q.ai;
const at = new Date().toISOString();
const res = await Promise.all(KEY_PAGES.map(async p => {
const t0 = Date.now(); let status = 0, bytes = 0, ok = false, err = '';
for (let a = 0; a < 2 && !ok; a++) {
if (a) await new Promise(r => setTimeout(r, 800));
try {
const r = await fetch(ORIGIN + p, { headers: { 'user-agent': $t.k15, accept: /^\/api\/|\.txt$|\.xml$/.test(p) ? '*/*' : $q.aj }, redirect: $q.ak, signal: AbortSignal.timeout(10000) });
status = r.status; const b = await r.arrayBuffer(); bytes = b.byteLength;
ok = status >= 200 && status < 400 && (status >= 300 || bytes > 200); err = ok ? '' : $q.al + status;
} catch (e) { err = String(e && e.name || 'error'); }
}
return { p, status, ok, ms: Date.now() - t0, bytes };
}));
const flow = await checkoutFlow().catch(e => ({ ok: false, err: String(e && e.name || 'error') }));
return { at, commit, ok: res.every(r => r.ok) && flow.ok, up: res.filter(r => r.ok).length, n: res.length, pages: res, checkout: flow };
}
async function checkoutFlow() {
const t0 = Date.now(), H = { 'user-agent': $t.k16, accept: $q.aj };
const b = await fetch(ORIGIN + $q.am, { headers: H, signal: AbortSignal.timeout(10000) }), bt = await b.text();
const m = /href="(https:\/\/www\.paypal\.com\/ncp\/payment\/[A-Z0-9]{6,20})"/.exec(bt);
if (b.status !== 200 || !m) return { ok: false, step: $q.an, status: b.status, link: !!m, ms: Date.now() - t0 };
let st = 0;
for (let a = 0; a < 2 && !(st >= 200 && st < 400); a++) {
if (a) await new Promise(r => setTimeout(r, 800));
try { const r = await fetch(m[1], { headers: H, redirect: $q.ak, signal: AbortSignal.timeout(10000) }); st = r.status; try { await r.body.cancel(); } catch (e) {} } catch (e) { st = 0; }
}
return { ok: st >= 200 && st < 400, step: $q.ao, booking: b.status, checkout: st, url: m[1], ms: Date.now() - t0, note: $t.k17 };
}
async function sweepCached(env, ctx, force) {
const commit = String(env.CF_PAGES_COMMIT_SHA || '').slice(0, 12) || $q.ai;
const ck = new Request(ORIGIN + $q.ap + commit), hk = new Request(ORIGIN + $q.aq);
if (!force) { try { const hit = await caches.default.match(ck); if (hit) { const j = await hit.json(); if (Date.now() - Date.parse(j.at) < SWEEP_TTL * 1000) return j; } } catch (e) {} }
if (!SWEEPING) SWEEPING = (async () => {
const s = await sweep(env);
let hist = []; try { const h = await caches.default.match(hk); if (h) hist = (await h.json()).h || []; } catch (e) {}
const prev = hist.length ? hist[hist.length - 1] : null;
hist.push([s.at, s.commit, s.up, s.n]); hist = hist.filter(h => Date.now() - Date.parse(h[0]) < 86400e3).slice(-400);
s.first_on_commit = !prev || prev[1] !== s.commit;
s.history = { scope: $q.ar, sweeps: hist.length, all_up: hist.filter(h => h[2] === h[3]).length, since: hist[0] ? hist[0][0] : s.at, commits: [...new Set(hist.map(h => h[1]))].slice(-5) };
const put = Promise.all([caches.default.put(ck, new Response(JSON.stringify(s), { headers: { 'cache-control': $q.as } })), caches.default.put(hk, new Response(JSON.stringify({ h: hist }), { headers: { 'cache-control': $q.at } }))]).catch(() => {});
try { ctx.waitUntil(put); } catch (e) { await put; }
return s;
})().finally(() => { SWEEPING = null; });
return SWEEPING;
}
export function warm(env, ctx) { try { ctx.waitUntil(sweepCached(env, ctx, false).catch(() => {})); } catch (e) {} }
async function statusPages(env, ctx) {
const s = await sweepCached(env, ctx, false);
return jr(Object.assign({ about: $s.k4, schedule: $q.au }, s), 200, $q.af);
}
async function comparePage(req, u, env, ctx, shell, lang) {
const N = await import('./kbx_named.js'), H = await import('./kbx_hdate.js');
let ix; try { ix = await N.data(env); } catch (e) { return null; }
const want = [...new Set(String(u.searchParams.get('p') || '').toLowerCase().split(',').map(s => s.trim()).filter(s => /^[a-z0-9-]{1,90}$/.test(s)))].slice(0, 4);
const L = want.map(s => ix.bySlug.get(s)).filter(x => x && !COI_RX.test(String(x.n || '') + ' ' + String(x.dv || '')));
const T = await import('./kbx_tr.js'), U27 = await import('./kbx_u27.js');
const trs = await Promise.all(L.map(x => T.trProject(env, x.id, lang).catch(() => null)));
const P = pre(lang), loc = { zh: 'zh-CN', ar: 'ar' }[lang] || lang;
const nf = n => { try { return Number(n).toLocaleString(loc); } catch (e) { return String(n); } };
const href = arr => P + $q.k + arr.join(',');
const col = L.map((x, i) => {
const c = ix.caseBy.get(x.id) || {}, fx = x.fx || {}, ho = N.handoverOf(ix, x), t = trs[i];
const RS = regSale(x), price = RS ? rsText(lang, RS) : fx.price_min > 0 ? (fx.currency ? fx.currency + ' ' : '') + nf(fx.price_min) + (fx.price_max > fx.price_min ? ' – ' + nf(fx.price_max) : '') : null;
const rk = t && t.ranks && t.ranks.length ? t.ranks.map(r => r.ranked ? t26(lang, 'rk', { r: nf(r.r), m: nf(r.m), p: r.p }) : r.p + ': ' + t26(lang, 'unr')).join('; ') : null;
const L6 = U27.light6({ tp: t, c, pn: x.pn, ho, ev: x.ev, ids: [] });
return { x, c, L6, dev: x.dv, devHref: x.dvs && ix.devs.has(x.dvs) ? P + $q.av + x.dvs + '/' : null, loc: H.placeName([x.ar, x.mk !== x.ar ? x.mk : null, x.co !== x.mk ? x.co : null].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', '), lang),
st: t26(lang, stK(c.stage || x.st)), ho: ho ? H.hdisp(ho.d, lang) : null, pm: x.pn || ((c.checks || {}).permit === 2 ? '✓' : null), price, sc: t ? t.score : null, rk, ck: N.lastmod(ix, x) };
});
const cell = v => v ? bdi(lang, v) : $q.aw + esc(t26(lang, 'np')) + $q.ax;
const rows = [['r_dev', o => o.dev ? (o.devHref ? $q.ay + o.devHref + '">' + bdi(lang, o.dev) + '</a>' : bdi(lang, o.dev)) : cell(null)], ['r_loc', o => cell(o.loc)], ['r_st', o => esc(o.st)], ['r_ho', o => cell(o.ho)], ['r_pm', o => cell(o.pm)], ['r_pr', o => cell(o.price)],
['r_tr', o => o.sc != null ? $q.az + esc(t26(lang, 'of100', { s: nf(o.sc) })) + $t.k18 + o.sc + $q.aA : cell(null)], ['r_rk', o => cell(o.rk)], ['r_ck', o => esc(N.fd(o.ck, lang))],
['r_src', o => $q.ay + P + $q.j + o.x.s + $q.aB + esc(t26(lang, $q.aC)) + $q.aD + P + $q.j + o.x.s + $q.aE + esc(t30(lang, 'tl_s')) + '</a>']];
const six = [0, 1, 2, 3, 4, 5].map(i => ['lt6_' + i, o => { const s = o.L6[i][2]; return $q.aF + s[0] + $q.aG + esc(U27.t27(lang, s[1], s[2])) + $q.ax; }, o => U27.t27(lang, 'lt_' + o.L6[i][0])]);
rows.splice(rows.findIndex(r => r[0] === 'r_rk') + 1, 0, ...six);
const diff = u.searchParams.get('diff') === '1';
const rowLbl = (r) => r[2] ? r[2](col[0] || { L6: [[ $q.aH ], [ $q.aI ], [ 'date' ], [ 'build' ], [ 'web' ], [ 'lists' ]] }) : t26(lang, r[0]);
const same = r => r[0] !== 'r_src' && col.length >= 2 && col.every(o => String(r[1](o)).replace(/<[^>]+>/g, '').trim() === String(r[1](col[0])).replace(/<[^>]+>/g, '').trim());
const radar = col.length >= 2 ? radarSvg(lang, col.map(o => ({ name: o.x.n, st: o.L6.map(p => p[2][0]) }))) : '';
const head = $t.k19 + esc(t26(lang, 'c_bc')) + $q.aJ + col.map(o => $q.aK + P + $q.j + o.x.s + '/">' + bdi(lang, o.x.n) + $q.aL + esc(href(L.filter(y => y !== o.x).map(y => y.s))) + $q.aM + esc(t26(lang, 'c_rm', { n: o.x.n })) + $q.aN).join('') + '</tr>';
const table = col.length ? (col.length >= 2 ? $t.k20 + (diff ? $q.aO : '') + '> ' + esc(t30(lang, $q.aP)) + $q.aQ : '') + $t.k21 + head + $q.aR + rows.map(r => '<tr' + (same(r) ? $q.aS : '') + $q.aT + esc(rowLbl(r)) + '</th>' + col.map(o => $q.aU + esc(o.x.n) + '">' + r[1](o) + '</td>').join('') + '</tr>').join('') + $q.aV + radar : '';
const m = { pre: P, cur: L.map(x => x.s), max: t26(lang, 'c_max') };
const addBox = $q.aW + esc(JSON.stringify(m)) + $q.aX + esc(t26(lang, 'c_add')) + $t.k22 + esc(t26(lang, 'c_ph')) + $t.k23 + (L.length >= 4 ? $q.aY : '') + '>' +
$t.k24 + (L.length >= 4 ? $q.aZ + esc(t26(lang, 'c_max')) + '</p>' : '') + $q.ba;
const shareUrl = ORIGIN + href(L.map(x => x.s)) + (diff ? $q.bb : '');
const body = $t.k25 + P + $q.bc + P + $q.bd + esc((await import('./kbx_named.js')).tr(lang, 'h1_i')) + $q.be + esc(t26(lang, 'c_t')) + $q.bf + esc(t26(lang, 'c_d')) + '</p>' + addBox + $q.bg +
$q.bh + (L.length < 2 ? $q.bi + esc(t26(lang, 'c_few')) + $q.bj + P + $q.bd + esc(N.tr(lang, 'h1_i')) + $q.bk : '') + table +
$q.bl + esc(t26(lang, $q.bm)) + $q.bj + P + $q.bn + esc(t26(lang, 'r_tr')) + $q.bk +
(L.length ? $q.D + esc(t26(lang, $q.bo)) + $t.k26 + encodeURIComponent(t26(lang, 'c_t') + ' ' + shareUrl) + $s.k5 + esc(shareUrl) + $q.bp + esc(t26(lang, 'sh_ok')) + '">' + esc(t26(lang, $q.F)) + $t.k27 : '') +
$q.bq + esc(t26(lang, 'c_old')) + $q.br +
$s.k6 +
$s.k7 +
$s.k8 +
$s.k9 +
$s.k10 +
$q.bs + $s.KC_JS + $q.bt;
const canon = ORIGIN + P + $q.bu;
const title = t26(lang, 'c_t') + (L.length ? ': ' + L.map(x => x.n).join(' / ') : '');
const pg = { title: (title.length > 60 ? t26(lang, 'c_t') : title) + $q.bv, desc: t26(lang, 'c_d'), canon, body, noindex: true, alt: l => ORIGIN + pre(l) + $q.bu + (L.length ? '?p=' + L.map(x => x.s).join(',') : ''),
ld: { '@context': $q.bw, '@graph': [{ '@type': $q.bx, name: t26(lang, 'c_t'), url: canon, inLanguage: lang, isPartOf: { '@type': $q.by, name: $q.bz, url: ORIGIN + '/' } },
{ '@type': $q.bA, itemListElement: [{ '@type': $q.bB, position: 1, name: $q.bz, item: ORIGIN + P + '/' }, { '@type': $q.bB, position: 2, name: t26(lang, 'c_bc'), item: canon }] }] } };
const sh = await shell(P + $q.bC); if (!sh || sh.status !== 200) return null;
const html = await N.assemble(pg, lang, sh);
return new Response(html, { status: 200, headers: { 'content-type': $q.bD, 'cache-control': $q.bE, 'x-robots-tag': $q.bF } });
}
export const PATHS = /^\/api\/v1\/(?:facets|followers)$|^\/api\/x\/status\/pages\/?$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?compare\/?$/;
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname;
if (req.method !== 'GET' && req.method !== 'HEAD') return null;
const cm = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?compare\/?$/);
if (cm) {
const lang = cm[1] || 'en';
if (!u.searchParams.has('p') && lang === 'en') return null;
if (!p.endsWith('/')) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } });
try { return await comparePage(req, u, env, ctx, shell, lang); } catch (e) { return null; }
}
try {
if (p === $q.bG) { const lang = LANGS.includes(u.searchParams.get('lang')) ? u.searchParams.get('lang') : 'en'; return new Response(await facets(env, lang), { headers: { 'content-type': JT, 'cache-control': $q.bH, 'access-control-allow-origin': '*' } }); }
if (p === $q.bI) return await followers(u, env, ctx);
if (/^\/api\/x\/status\/pages\/?$/.test(p)) return await statusPages(env, ctx);
} catch (e) { return jr({ error: $q.bJ }, 503); }
return null;
}
