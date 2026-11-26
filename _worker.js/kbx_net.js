// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_net__q, $s = TB.kbx_net__s, $t = TB.kbx_net__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TB } from './kbx_strings.js';
import { data as namedData, isListing, host, pre, esc } from './kbx_named.js';
import { rpc } from './kolaboro.js';
import './kbx_net_land.js';
import { familyData } from './kbx_named_plus.js';
import { webGroups } from './kbx_web.js';
const ORIGIN = 'https://kolaboro.com';
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:graph\/developers|live\/xrays)\/?$|^\/api\/x\/net\/(?:graph|live)$/;
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const GRAPH_V = 'net-v1';
const HUB = 4;
let MEMO = {};
async function file(env, name) {
  const m = MEMO[name]; if (m && Date.now() - m.t < 600000) return m.v;
  let r = null;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + $q.a + name)); } catch (e) { r = null; }
  if (!r || !r.ok) r = await fetch(ORIGIN + $q.b + name, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!r.ok) throw new Error(name + ' ' + r.status);
  const v = await r.json(); MEMO[name] = { t: Date.now(), v }; return v;
}
const fold = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
const LEGAL = /\b(pt|cv|llc|l\.?l\.?c|ltd|limited|plc|llp|inc|corp|corporation|gmbh|ag|kg|sa|s\.a|sas|sarl|sl|s\.l|slu|sau|srl|spa|bv|nv|oy|ab|as|a\/s|aps|sro|s\.r\.o|kft|zrt|sp\.? z o\.?o|ooo|jsc|pjsc|pcl|co\.?,? ltd|sdn bhd|bhd|pte|pty|fze|fzco|fz-llc|dmcc|s\.a\.p\.i|sapi|s de rl|de c\.?v|lda|unipessoal|unipersonal|eood|ood|doo|d\.o\.o|ltda|eirl|sociedad|company)\b/;
function legalNames(s) {
if (!s || typeof s !== $q.c) return [];
const out = [];
for (let part of s.split(/;|\band\b|\s\/\s/)) {
part = part.replace(/\(.*$/, '').replace(/,\s*(?:subsidiary|part of|per |nif|cif|rfc|id |reg|registration|registered|cr |cin|uen|nib|npwp|tax|company no|licen[cs]e|trade).*$/i, '').trim();
const f = fold(part).replace(/[“”"'’]/g, '').replace(/\s+/g, ' ').trim();
if (f.length < 6 || !LEGAL.test(f)) continue;
const k = f.replace(/[.,]/g, '').replace(/\s+/g, ' ').trim();
out.push({ k, label: part.replace(/\s+/g, ' ').trim() });
}
return out;
}
function regIds(s) {
if (!s || typeof s !== $q.c) return [];
const out = new Set();
for (const m of s.matchAll(/\b([A-Z]{0,4}[- ]?[0-9][0-9A-Z-]{5,24})\b/g)) {
const t = m[1].replace(/[- ]/g, '').toUpperCase(); const digits = (t.match(/\d/g) || []).length;
if (digits >= 6 && t.length <= 20 && !/^(19|20)\d{2}(0[1-9]|1[0-2])?$/.test(t)) out.add(t);
}
return [...out];
}
function addresses(s) {
if (!s || typeof s !== $q.c) return [];
const out = [];
for (const seg of s.split(/[(),;]/)) {
const f = fold(seg).replace(/[^a-z0-9 ]+/g, ' ').replace(/\bno\b/g, ' ').replace(/\s+/g, ' ').trim();
if (f.length >= 8 && /\d/.test(f) && /\b(jl|jalan|gg|street|st|road|rd|avenue|ave|calle|avenida|av|rua|strasse|str|blvd|boulevard|via|rue|lane|soi|moo|floor|tower|building)\b/.test(f)) out.push({ k: f, label: seg.trim() });
}
return out;
}
const GENERIC = new Set(['homes', 'home', 'properties', 'property', 'development', 'developments', 'developer', 'developers', 'group', 'real', 'estate', 'realty', 'residence', 'residences', 'resort', 'villas', 'villa', 'living', 'land', 'invest', 'investment', 'investments', 'capital', 'holding', 'holdings', 'company', 'limited', 'construction', 'tower', 'towers', 'city', 'park', 'project', 'projects', 'international', 'global', 'bali', 'dubai', 'grupo', 'inmobiliaria', 'immobilien', 'the']);
const SLD2 = /\.(co|com|net|org|gov|ac|or|ne|go|in|edu)\.[a-z]{2}$/;
function regDomain(h) {
h = String(h || '').toLowerCase().replace(/^www\./, ''); if (!h || !h.includes('.')) return '';
const p = h.split('.'); return SLD2.test(h) ? p.slice(-3).join('.') : p.slice(-2).join('.');
}
const nameKey = n => fold(n).replace(/\b(by|the|residences?|residence|resort|villas?|apartments?|tower|towers|project|phase \d+)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
export function buildGraph(P, web, fam) {
const devs = new Map();
for (const x of P) {
if (!x.dvs || !x.dv) continue;
let d = devs.get(x.dvs); if (!d) devs.set(x.dvs, d = { s: x.dvs, n: x.dv, p: [], mk: new Map(), co: new Set() });
d.p.push(x); d.mk.set(x.mk, (d.mk.get(x.mk) || 0) + 1); if (x.co) d.co.add(x.co);
}
const TYPES = [$q.d, 'regid', $q.e, $q.f, 'name', 'web', $q.g];
const idx = Object.fromEntries(TYPES.map(t => [t, new Map()]));
const add = (t, key, dev, x, label) => {
    if (!key) return; const m = idx[t]; let e = m.get(key); if (!e) m.set(key, e = new Map());
    if (!e.has(dev)) e.set(dev, []); const a = e.get(dev); if (!a.some(o => o.x === x)) a.push({ x, label });
  };
for (const d of devs.values()) for (const x of d.p) {
const fx = x.fx || {};
for (const ln of legalNames(fx.developer_company)) add($q.d, ln.k, d.s, x, ln.label);
for (const id of regIds(fx.developer_company)) add('regid', id, d.s, x, id);
const toks = [...new Set((fold(d.n) + ' ' + fold(x.n)).split(/[^a-z0-9]+/).filter(w => w.length >= 4 && !GENERIC.has(w)))];
for (const u of [x.url, x.du]) {
if (!u || isListing(u)) continue;
const rd = regDomain(host(u)); if (!rd) continue;
const label = rd.split('.')[0].replace(/-/g, '');
if (!toks.some(w => label.includes(w))) continue;
add($q.e, rd, d.s, x, rd);
}
for (const a of addresses(fx.developer_hq)) add($q.f, a.k, d.s, x, a.label);
const nk = nameKey(x.n); if (nk.length >= 6) add('name', nk + '|' + (x.co || x.mk), d.s, x, x.n);
}
for (const g of (web && web.groups) || []) for (const s of g.devs || []) { const d = devs.get(s); if (!d) continue; const dm = (g.doms || []).filter(x => g.dom && g.dom[x] === s); add('web', g.t + ':' + g.v, s, d.p[0], g.label + (dm.length ? ' (' + dm.join(', ') + ')' : '')); }
const FD = (fam && fam.devs) || {}, WHY = { parent: $q.h, child: $q.h, ultimate: $q.i, same_parent: $q.j, same_ultimate: $q.k };
for (const l of (fam && fam.links) || []) {
const da = devs.get(l.a), db = devs.get(l.b); if (!da || !db || !FD[l.a] || !FD[l.b]) continue;
const pk = l.why.includes($q.l) ? $q.m : l.why.includes($q.n) ? $q.o : null;
const v = l.why.map(w => WHY[w]).filter((w, i, a) => a.indexOf(w) === i).join(', ') + $q.p + FD[l.a].lei + ' / ' + FD[l.b].lei + (pk && FD[l.a][pk] ? $q.q + FD[l.a][pk].legal : '') + ')';
add($q.g, 'gl:' + l.a + '|' + l.b, l.a, da.p[0], v); add($q.g, 'gl:' + l.a + '|' + l.b, l.b, db.p[0], v);
}
const links = new Map(), hubs = Object.fromEntries(TYPES.map(t => [t, 0])), shared = Object.fromEntries(TYPES.map(t => [t, 0]));
for (const t of TYPES) for (const [key, e] of idx[t]) {
if (e.size < 2) continue;
if (t !== $q.g && e.size > (t === 'web' ? 8 : HUB)) { hubs[t]++; continue; }
shared[t]++;
const ds = [...e.keys()].sort();
for (let i = 0; i < ds.length; i++) for (let j = i + 1; j < ds.length; j++) {
const lk = ds[i] + '\n' + ds[j]; let L = links.get(lk); if (!L) links.set(lk, L = { a: ds[i], b: ds[j], t: {} });
const ea = e.get(ds[i])[0], eb = e.get(ds[j])[0];
(L.t[t] = L.t[t] || []).push({ v: ea.label === eb.label ? ea.label : ea.label + ' / ' + eb.label, pa: ea.x.s, pb: eb.x.s });
}
}
const linked = new Set(); for (const L of links.values()) { linked.add(L.a); linked.add(L.b); }
const order = [...devs.values()].sort((a, b) => b.p.length - a.p.length || a.n.localeCompare(b.n));
const ix = new Map(order.map((d, i) => [d.s, i]));
const nodes = order.map(d => ({ s: d.s, n: d.n, k: d.p.length, mk: [...d.mk.entries()].sort((a, b) => b[1] - a[1])[0][0], co: [...d.co].join(', '), l: linked.has(d.s) ? 1 : 0 }));
const L = [...links.values()].map(l => ({ a: ix.get(l.a), b: ix.get(l.b), t: l.t }));
const par = nodes.map((_, i) => i), f = i => par[i] === i ? i : (par[i] = f(par[i]));
for (const l of L) par[f(l.a)] = f(l.b);
const comp = new Map(); nodes.forEach((n, i) => { if (n.l) { const r = f(i); comp.set(r, (comp.get(r) || 0) + 1); } });
const byType = Object.fromEntries(TYPES.map(t => [t, L.filter(l => l.t[t]).length]));
const sizes = [...comp.values()].sort((a, b) => b - a);
return {
nodes, links: L,
stats: { projects: P.length, developers: nodes.length, linked_developers: linked.size, links: L.length, links_by_type: byType, shared_identifiers_by_type: shared, hub_identifiers_dropped: hubs, clusters: sizes.length, largest_cluster: sizes[0] || 0, projects_without_developer: P.filter(x => !x.dvs || !x.dv).length },
};
}
const T = TB.kbx_net_T ;
const LT = TB.kbx_net_LT ;
const tr = (D, lang) => Object.assign({}, D.en, D[lang] || {});
function out(o, s, cc) { return new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': $q.r, 'access-control-allow-origin': '*', 'cache-control': cc || $q.s, 'x-content-type-options': $q.t } }); }
let GMEMO = null;
async function graph(env) {
const ix = await namedData(env);
const web = await webGroups(env).catch(() => ({ groups: [] }));
const fam = await familyData(env).catch(() => null);
const key = (ix.named.updated || '') + '|' + ix.P.length + '|' + (web.updated || '') + '|' + ((fam && fam.updated) || '');
if (GMEMO && GMEMO.key === key) return GMEMO.g;
const g = buildGraph(ix.P, web, fam);
g.version = GRAPH_V; g.updated = ix.named.updated || null; g.generated_at = new Date().toISOString();
g.source = { named: ORIGIN + $q.u, pages: ORIGIN + $q.v, licence: $q.w };
g.types = { company: $q.x, regid: $q.y, domain: $q.z, address: $q.A, name: $q.B, web: $s.k0 };
g.web_updated = web.updated || null;
g.types.family = $s.k1;
g.family_updated = (fam && fam.updated) || null;
g.not_linked = [$t.k0, $s.k2];
g.hub_rule = $q.C + HUB + $t.k1;
GMEMO = { key, g }; return g;
}
let LMEMO = { t: 0, v: null };
async function live(env) {
  if (LMEMO.v && Date.now() - LMEMO.t < 8000) return LMEMO.v;
  const [r, sim] = await Promise.all([rpc($q.D, { p_hours: 24 }), file(env, $q.E).catch(() => ({}))]);
  const mp = (sim.market_points && sim.market_points.markets) || {};
  const pt = m => { const p = m && mp[m]; return p && typeof p.lat === $q.F ? [Math.round(p.lat * 100) / 100, Math.round(p.lng * 100) / 100] : null; };
  const recent = ((r && r.recent) || []).map(e => { const mk = e.mk && !/sumba/i.test(e.mk) ? e.mk : null; return { t: e.t, mk, p: pt(mk), c: e.c || 0 }; });
  const v = { totals: (r && r.totals) || null, recent, since: (r && r.since) || null, at: new Date().toISOString(), source: $q.G, points: $q.H };
  LMEMO = { t: Date.now(), v }; return v;
}
function graphBody(lang) {
const t = tr(T, lang), p = pre(lang);
const sw = (ty) => ({ company: $s.k3, regid: $s.k4, domain: $s.k5, address: $s.k6, name: $s.k7, web: $s.k8, family: $s.k9 })[ty];
const types = [$q.d, 'regid', $q.e, $q.f, 'name', 'web', $q.g];
return $t.k2 + lang + $q.I + p + $q.J + esc(JSON.stringify(t)) + '">' +
$t.k3 + p + $t.k4 + esc(t.g_title) + $q.K +
'<h1>' + esc(t.g_title) + $q.L + esc(t.g_lead) + '</p>' +
$t.k5 + esc(t.s_dev) + $t.k6 + esc(t.s_linked) + $t.k7 + esc(t.s_links) + $t.k8 + esc(t.s_clusters) + $q.M +
$s.k10 + esc(t.g_title) + $t.k9 + esc(t.loading) + $q.N +
$t.k10 + esc(t.reset) + $q.O +
$t.k11 + esc(t.search) + $t.k12 + esc(t.search_ph) + $s.k11 +
$t.k13 + types.map(ty => $t.k14 + ty + '"> ' + sw(ty) + ' ' + esc(t['t_' + ty]) + $q.P + ty + $q.Q).join('') +
$t.k15 + esc(t.show_all) + $q.R +
$t.k16 + esc(t.pick) + $q.S +
$q.T + esc(t.how_h) + $q.U + ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm9', 'm10', 'm7', 'm8'].map(k => '<li>' + esc(t[k] || T.en[k]) + '</li>').join('') + '</ul>' +
$q.V + esc(t.data) + $s.k12 +
$q.W + esc(t.table_h) + $s.k13 + esc(t.dev) + $q.X + esc(t.dev) + $q.X + esc(t.via) + $t.k17;
}
const GRAPH_JS = String.raw`(function(){
var R=document.querySelector('[data-kn14]');if(!R)return;var T=JSON.parse(R.getAttribute('data-t')),PRE=R.getAttribute('data-pre'),RTL=document.documentElement.dir==='rtl';
var cv=document.getElementById('kn-c'),cx=cv.getContext('2d'),plate=document.getElementById('kn-plate'),tip=document.getElementById('kn-tip'),msg=document.getElementById('kn-msg'),info=document.getElementById('kn-info');
var TY=['company','regid','domain','address','name','web','family'],DASH={company:[],regid:[],domain:[7,4],address:[2,4],name:[],web:[10,3,2,3],family:[1,3]},W={company:2.6,regid:1.6,domain:2,address:2,name:1,web:1.6,family:2.8};
var G,N=[],L=[],on={company:1,regid:1,domain:1,address:1,name:1,web:1,family:1},iso=false,sel=-1,hov=-1,dpr=1,Wd=0,Ht=0,FONT='13px Archivo,system-ui,sans-serif';
function css(v){return getComputedStyle(document.documentElement).getPropertyValue(v).trim()||'#333'}
var C={};function pal(){C={ink:css('--k-ink'),muted:css('--k-muted'),line:css('--k-line-2'),sea:css('--k-sea'),surf:css('--k-surface'),brand:css('--k-brand'),faint:css('--k-faint'),sunk:css('--k-sunken')}}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function linkOn(l){for(var i=0;i<TY.length;i++)if(on[TY[i]]&&l.t[TY[i]])return true;return false}
function lab(n){return n.n.length>36?n.n.slice(0,35)+'…':n.n}
function rad(n){return 4+Math.min(6,Math.sqrt(n.k)*1.6)}
// layout: every cluster (developers joined by the active link types) is a small column of nodes, clusters are packed in rows
// like entries in a register; developers without links follow as a grid of dots
var comps=[],bx=[];
function layout(){var w=plate.getBoundingClientRect().width;Wd=w;cx.font=FONT;
 var par=N.map(function(_,i){return i}),f=function(i){return par[i]===i?i:(par[i]=f(par[i]))},has={};
 L.forEach(function(l){if(!linkOn(l))return;par[f(l.a)]=f(l.b);has[l.a]=has[l.b]=1});
 var g={};N.forEach(function(n,i){n.on=!!has[i];n.x=n.y=-999;if(n.on){var r=f(i);(g[r]=g[r]||[]).push(i)}});
 comps=Object.keys(g).map(function(k){return g[k].sort(function(a,b){return N[b].k-N[a].k})}).sort(function(a,b){return b.length-a.length||N[b[0]].k-N[a[0]].k});
 var pad=16,gx=18,gy=22,x=pad,y=pad,rowH=0,STEP=40;bx=[];
 comps.forEach(function(c){var lw=0;c.forEach(function(i){lw=Math.max(lw,cx.measureText(lab(N[i])).width)});var cw=Math.min(w-2*pad,34+12+lw),ch=(c.length-1)*STEP+26;
  if(x+cw>w-pad&&x>pad){x=pad;y+=rowH+gy;rowH=0}
  c.forEach(function(i,k){var n=N[i];n.x=x+12+(k%2?22:0);n.y=y+13+k*STEP;});bx.push([x,y,cw,ch]);x+=cw+gx;rowH=Math.max(rowH,ch)});
 y+=rowH+pad;
 if(iso){var s=14,cols=Math.max(1,Math.floor((w-2*pad)/s)),k2=0;y+=8;N.forEach(function(n){if(n.on)return;n.x=pad+6+(k2%cols)*s;n.y=y+6+Math.floor(k2/cols)*s;k2++});if(k2)y+=Math.ceil(k2/cols)*s+pad}
 Ht=Math.max(320,y);plate.style.height=Ht+'px';dpr=Math.min(2,window.devicePixelRatio||1);cv.width=Wd*dpr;cv.height=Ht*dpr;
 if(RTL)N.forEach(function(n){if(n.x>-999)n.x=Wd-n.x});draw()}
function vis(n){return n.on||(iso&&n.x>-999)}
function nb(i){var s={};L.forEach(function(l){if(!linkOn(l))return;if(l.a===i)s[l.b]=1;if(l.b===i)s[l.a]=1});return s}
function draw(){if(!G)return;cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,Wd,Ht);var F=sel>=0?nb(sel):null;
 L.forEach(function(l){if(!linkOn(l))return;var a=N[l.a],b=N[l.b],hl=sel>=0&&(l.a===sel||l.b===sel);var act=TY.filter(function(t){return on[t]&&l.t[t]});
  act.forEach(function(ty,ix){var off=(ix-(act.length-1)/2)*3.2;cx.beginPath();cx.setLineDash(DASH[ty]);cx.lineWidth=W[ty]*(hl?1.3:1);cx.strokeStyle=hl?C.sea:C.muted;cx.globalAlpha=sel>=0&&!hl?.3:.9;cx.moveTo(a.x+off,a.y);cx.lineTo(b.x+off,b.y);cx.stroke()})});
 cx.setLineDash([]);cx.globalAlpha=1;cx.font=FONT;cx.textBaseline='middle';cx.direction='ltr';cx.textAlign=RTL?'right':'left';
 N.forEach(function(n,i){if(!vis(n))return;var dim=F&&i!==sel&&!F[i],r=n.on?rad(n):3;cx.globalAlpha=dim?.3:1;cx.beginPath();cx.arc(n.x,n.y,r,0,7);cx.fillStyle=i===sel?C.brand:(n.on?C.ink:C.faint);cx.fill();if(i===hov||i===sel){cx.lineWidth=2;cx.strokeStyle=C.sea;cx.stroke()}
  if(n.on){cx.fillStyle=C.ink;cx.fillText(lab(n),n.x+(RTL?-1:1)*(r+6+(n.x%1)),n.y)}});cx.globalAlpha=1}
function hit(mx,my){var best=-1,bd=1e9;N.forEach(function(n,i){if(!vis(n))return;var dx=n.x-mx,dy=n.y-my,d=dx*dx+dy*dy,r=n.on?14:8;if(d<r*r&&d<bd){bd=d;best=i}});
 if(best<0)N.forEach(function(n,i){if(!n.on)return;cx.font=FONT;var w=cx.measureText(lab(n)).width,x0=RTL?n.x-rad(n)-6-w:n.x+rad(n)+6;if(mx>=x0&&mx<=x0+w&&Math.abs(my-n.y)<10)best=i});return best}
function pick(i,scroll){sel=i;info.classList.toggle('is-open',i>=0);if(i<0){info.innerHTML='<p class="k-muted">'+esc(T.pick)+'</p>';draw();return}var n=N[i];
 if(!vis(n)){iso=true;document.getElementById('kn-iso').checked=true;layout()}
 if(scroll){var r=plate.getBoundingClientRect(),y=r.top+scrollY+n.y-innerHeight/3;scrollTo({top:Math.max(0,y),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}
 var rows=[];L.forEach(function(l){if(l.a!==i&&l.b!==i)return;var o=N[l.a===i?l.b:l.a];TY.forEach(function(ty){(l.t[ty]||[]).forEach(function(e){var mine=l.a===i?e.pa:e.pb,their=l.a===i?e.pb:e.pa;rows.push('<li><b><a href="'+PRE+'/developers/'+o.s+'/">'+esc(o.n)+'</a></b><span>'+esc(T['t_'+ty])+': '+esc(e.v)+'</span><span>'+esc(T.on)+' <a href="'+PRE+'/projects/'+mine+'/">'+esc(mine)+'</a>, <a href="'+PRE+'/projects/'+their+'/">'+esc(their)+'</a></span></li>')})})});
 info.innerHTML='<button type="button" class="k-x kn-x" aria-label="'+esc(T.close)+'">×</button><h2>'+esc(n.n)+'</h2><p class="k-muted">'+n.k+' '+esc(T.projects)+', '+esc(n.mk)+(n.co?' ('+esc(n.co)+')':'')+'</p><p><a class="k-btn k-btn--sm" href="'+PRE+'/developers/'+n.s+'/">'+esc(T.open)+'</a></p>'+(rows.length?'<p><b>'+esc(T.linkto)+'</b></p><ul>'+rows.join('')+'</ul>':'<p class="k-muted">'+esc(T.nolinks)+'</p>');draw()}
function pos(e){var r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]}
cv.addEventListener('pointermove',function(e){var p=pos(e),h=hit(p[0],p[1]);if(h!==hov){hov=h;cv.style.cursor=h>=0?'pointer':'default';draw()}
 if(h>=0&&e.pointerType==='mouse'){tip.style.display='block';tip.textContent=N[h].n+', '+N[h].k+' '+T.projects;tip.style.left=p[0]+'px';tip.style.top=p[1]+'px'}else tip.style.display='none'});
info.addEventListener('click',function(e){if(e.target.closest('.kn-x'))pick(-1)});
cv.addEventListener('pointerleave',function(){tip.style.display='none';if(hov>=0){hov=-1;draw()}});
cv.addEventListener('click',function(e){var p=pos(e);pick(hit(p[0],p[1]))});
document.getElementById('kn-reset').addEventListener('click',function(){q.value='';pick(-1)});
TY.forEach(function(ty){var b=R.querySelector('[data-ty='+ty+']');b.addEventListener('change',function(){on[ty]=b.checked?1:0;layout();if(sel>=0)pick(sel)})});
document.getElementById('kn-iso').addEventListener('change',function(e){iso=e.target.checked;layout()});
var q=document.getElementById('kn-q'),res=document.getElementById('kn-res'),hits=[],ai=-1;
function norm(s){return String(s).normalize('NFKD').replace(/[̀-ͯ]/g,'').toLowerCase()}
function showRes(){res.innerHTML=hits.map(function(i,k){var n=N[i];return '<li role="option" id="kn-o'+k+'" aria-selected="'+(k===ai)+'" data-i="'+i+'">'+esc(n.n)+'<small>'+n.k+', '+esc(n.mk)+'</small></li>'}).join('');res.hidden=!hits.length;q.setAttribute('aria-expanded',hits.length?'true':'false');if(ai>=0)q.setAttribute('aria-activedescendant','kn-o'+ai);else q.removeAttribute('aria-activedescendant')}
q.addEventListener('input',function(){var v=norm(q.value.trim());ai=-1;hits=[];if(v.length>=2)N.forEach(function(n,i){if(hits.length<12&&norm(n.n).indexOf(v)>=0)hits.push(i)});showRes()});
q.addEventListener('keydown',function(e){if(e.key==='ArrowDown'){ai=Math.min(hits.length-1,ai+1);showRes();e.preventDefault()}else if(e.key==='ArrowUp'){ai=Math.max(0,ai-1);showRes();e.preventDefault()}else if(e.key==='Enter'){var i=hits[ai>=0?ai:0];if(i!=null){q.value=N[i].n;pick(i,1);hits=[];showRes()}e.preventDefault()}else if(e.key==='Escape'){hits=[];showRes()}});
res.addEventListener('click',function(e){var li=e.target.closest('li');if(li){var i=+li.getAttribute('data-i');q.value=N[i].n;pick(i,1);hits=[];showRes()}});
pal();new MutationObserver(function(){pal();draw()}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
fetch('/api/x/net/graph').then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(g){G=g;N=g.nodes;L=g.links;
 var S=g.stats;R.querySelectorAll('[data-st]').forEach(function(b){b.textContent=(S[b.getAttribute('data-st')]||0).toLocaleString()});
 TY.forEach(function(ty){var s=R.querySelector('[data-ct='+ty+']');if(s)s.textContent=S.links_by_type[ty]||0});
 var tb=document.getElementById('kn-tb'),rows=[];L.forEach(function(l){var a=N[l.a],b=N[l.b];rows.push('<tr><td data-label="'+esc(T.dev)+'"><a href="'+PRE+'/developers/'+a.s+'/">'+esc(a.n)+'</a></td><td data-label="'+esc(T.dev)+'"><a href="'+PRE+'/developers/'+b.s+'/">'+esc(b.n)+'</a></td><td data-label="'+esc(T.via)+'">'+TY.filter(function(t){return l.t[t]}).map(function(t){return esc(T['t_'+t])+': '+esc(l.t[t][0].v)}).join('<br>')+'</td></tr>')});tb.innerHTML=rows.join('');
 msg.remove();layout();var h=decodeURIComponent((location.hash||'').slice(1));if(h){N.forEach(function(n,i){if(n.s===h)pick(i,1)})}
}).catch(function(){msg.textContent=T.err});
var rt,lw=0;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){var w=plate.getBoundingClientRect().width;if(w!==lw){lw=w;layout()}},120)});
})();`;
function liveBody(lang) {
const t = tr(LT, lang), p = pre(lang);
return $t.k18 + lang + $q.J + esc(JSON.stringify(t)) + $t.k19 +
$s.k14 + p + $t.k20 + esc(t.l_title) + $q.Y + esc(t.l_title) + $q.L + esc(t.l_lead) + $q.Z +
$t.k21 + esc(t.l_title) + $t.k22 + esc(t.pause) + $q.aa +
$t.k23 + esc(t.c_all) + $t.k24 + esc(t.c_24) + $t.k25 + esc(t.c_1) + $t.k26 + esc(t.c_mk) + $q.ab +
'<h2>' + esc(t.recent) + $t.k27 + esc(t.loading) + $q.ac +
$q.ad + esc(t.count_note) + $t.k28 + p + $q.ae + esc(t.run) + $q.af +
$t.k29 + esc(t.how_h) + $q.ag + esc(t.h1) + $q.ah + esc(t.h2) + $q.ah + esc(t.h3) + $q.ah + esc(t.h4) + $q.ah + esc(t.land) + $s.k15 + esc(t.data) + $q.ai;
}
const LIVE_JS = String.raw`(function(){
var R=document.querySelector('[data-kl14]');if(!R)return;var T=JSON.parse(R.getAttribute('data-t'));
var cv=document.getElementById('kl-c'),cx=cv.getContext('2d'),pp=document.getElementById('kl-pp'),feed=document.getElementById('kl-feed');
var RM=matchMedia('(prefers-reduced-motion: reduce)').matches,spin=!RM,lon0=-20,lat0=12,S=0,dpr=1,seen={},dots=[],first=true;
var B=atob('__LAND__'),pts=[];for(var r=0;r<120;r++)for(var c=0;c<240;c++){var k=r*240+c;if(B.charCodeAt(k>>3)&(1<<(k&7))){var la=89.25-r*1.5,lo=-179.25+c*1.5;pts.push([la*Math.PI/180,lo*Math.PI/180])}}
function css(v){return getComputedStyle(document.documentElement).getPropertyValue(v).trim()}
function size(){var w=cv.getBoundingClientRect().width;dpr=Math.min(2,devicePixelRatio||1);cv.width=cv.height=w*dpr;S=w}
function proj(la,lo){var p=lat0*Math.PI/180,l=lo-lon0*Math.PI/180,cl=Math.cos(la);var x=cl*Math.sin(l),y=Math.cos(p)*Math.sin(la)-Math.sin(p)*cl*Math.cos(l),z=Math.sin(p)*Math.sin(la)+Math.cos(p)*cl*Math.cos(l);return[x,y,z]}
function draw(now){var R0=S*.46,c0=S/2;cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,S,S);
 var g=cx.createRadialGradient(c0-R0*.3,c0-R0*.35,R0*.1,c0,c0,R0);g.addColorStop(0,'rgba(255,255,255,.10)');g.addColorStop(1,'rgba(255,255,255,.02)');cx.beginPath();cx.arc(c0,c0,R0,0,7);cx.fillStyle=g;cx.fill();cx.strokeStyle='rgba(255,255,255,.18)';cx.lineWidth=1;cx.stroke();
 cx.fillStyle='rgba(225,236,240,.55)';var ds=Math.max(1.2,S/300);for(var i=0;i<pts.length;i++){var q=proj(pts[i][0],pts[i][1]);if(q[2]<=0)continue;cx.globalAlpha=.25+.75*q[2];cx.fillRect(c0+q[0]*R0-ds/2,c0-q[1]*R0-ds/2,ds,ds)}cx.globalAlpha=1;
 var br=css('--k-brand')||'#FF5B14';
 dots.forEach(function(d){var q=proj(d.p[0]*Math.PI/180,d.p[1]*Math.PI/180);if(q[2]<=0)return;var x=c0+q[0]*R0,y=c0-q[1]*R0,age=(Date.now()-d.t)/36e5,a=Math.max(.25,1-age/24);
  cx.globalAlpha=a;cx.beginPath();cx.arc(x,y,2+Math.min(5,Math.sqrt(d.c)),0,7);cx.fillStyle=br;cx.fill();
  if(d.born&&!RM){var e=(now-d.born)/1600;if(e>=0&&e<3){var f=e%1;cx.globalAlpha=(1-f)*.9;cx.beginPath();cx.arc(x,y,4+f*26,0,7);cx.strokeStyle=br;cx.lineWidth=2;cx.stroke()}}});cx.globalAlpha=1}
var last=0;function loop(now){if(spin){lon0+=(now-last)*.006;}last=now;draw(now);requestAnimationFrame(loop)}
var drag=null;cv.addEventListener('pointerdown',function(e){user=1;cv.setPointerCapture(e.pointerId);drag=[e.clientX,e.clientY,lon0,lat0]});cv.addEventListener('pointermove',function(e){if(!drag)return;lon0=drag[2]-(e.clientX-drag[0])*.4;lat0=Math.max(-70,Math.min(70,drag[3]+(e.clientY-drag[1])*.4));if(RM)draw(0)});addEventListener('pointerup',function(){drag=null});
pp.addEventListener('click',function(){spin=!spin;pp.setAttribute('aria-pressed',spin?'false':'true');pp.textContent=spin?T.pause:T.play});if(RM){pp.textContent=T.play;pp.setAttribute('aria-pressed','true')}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function ago(t){var s=(Date.now()-Date.parse(t))/1000;if(s<90)return T.ago_s;if(s<3600)return T.ago_m.replace('{n}',Math.round(s/60));if(s<86400)return T.ago_h.replace('{n}',Math.round(s/3600));return T.ago_d.replace('{n}',Math.round(s/86400))}
function nf(n){return n==null?'0':Number(n).toLocaleString()}
function poll(){fetch('/api/x/net/live',{cache:'no-store'}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(d){var t=d.totals||{};
 R.querySelectorAll('[data-c]').forEach(function(b){b.textContent=nf(t[b.getAttribute('data-c')])});
 var now=performance.now(),nd=[];(d.recent||[]).forEach(function(e,i){var k=e.t+'|'+e.mk+'|'+e.c+'|'+i;var fresh=!first&&!seen[e.t+'|'+e.mk+'|'+e.c];if(e.p)nd.push({p:e.p,c:e.c,t:Date.parse(e.t),born:fresh||(first&&i<3)?now+i*300:0});});
 var ns={};(d.recent||[]).forEach(function(e){ns[e.t+'|'+e.mk+'|'+e.c]=1});
 var html=(d.recent||[]).slice(0,8).map(function(e){var fresh=!first&&!seen[e.t+'|'+e.mk+'|'+e.c];return '<li'+(fresh?' class="is-new"':'')+'><b>'+esc(e.mk||T.nomk)+'</b><span>'+e.c+' '+esc(T.cards)+'</span><time datetime="'+esc(e.t)+'">'+ago(e.t)+'</time></li>'}).join('');
 feed.innerHTML=html||'<li><span>'+esc(T.none)+'</span></li>';seen=ns;dots=nd;first=false;if(RM)draw(0)}).catch(function(){feed.innerHTML='<li><span>'+esc(T.err)+'</span></li>'})}
size();addEventListener('resize',function(){size();if(RM)draw(0)});poll();setInterval(function(){if(!document.hidden)poll()},15000);if(RM)draw(0);else requestAnimationFrame(loop);
})();`;
async function assemble(shellRes, o) {
const alts = LANGS.map(l => $q.aj + l + $q.ak + ORIGIN + pre(l) + o.path + '">').join('') + $t.k30 + ORIGIN + o.path + '">';
const tags = $q.al + esc(o.title) + $t.k31 + esc(o.desc) + $q.am + ORIGIN + pre(o.lang) + o.path + '">' + alts +
$s.k16 + esc(o.title) + $t.k32 + esc(o.desc) + $q.an + ORIGIN + pre(o.lang) + o.path + $t.k33 +
$q.ao + JSON.stringify(o.ld).replace(/</g, $q.ap) + $q.aq + $s.CSS;
const res = new HTMLRewriter()
.on('title', { element(e) { e.remove(); } })
.on($s.k17, { element(e) { e.remove(); } })
.on($q.ar, { element(e) { e.remove(); } })
.on('head', { element(e) { e.append(tags, { html: true }); } })
.on('main', { element(e) { e.setInnerContent(o.body + $q.as + o.js + $q.aq, { html: true }); } })
.on($q.at, { element(e) { const l = e.getAttribute($q.au); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + o.path); } })
.transform(new Response(shellRes.body, { headers: { 'content-type': $q.av } }));
return await res.text();
}
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname;
if (req.method !== 'GET' && req.method !== 'HEAD') return null;
if (p === $q.aw) { try { return out(await graph(env), 200, $q.s); } catch (e) { return out({ error: $q.ax }, 503, $q.ay); } }
if (p === $q.az) {
try { return out(await live(env), 200, $q.aA); }
catch (e) { return out({ error: $q.aB, totals: null, recent: [] }, 503, $q.ay); }
}
const m = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(graph\/developers|live\/xrays)(\/?)$/); if (!m) return null;
if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': $q.aC } });
const lang = m[1] || 'en', kind = m[2];
const sh = await shell(pre(lang) + $q.aD);
let o;
if (kind === $q.aE) {
const t = tr(T, lang);
o = { lang, path: $q.aF, title: t.g_title, desc: t.g_desc, body: graphBody(lang), js: GRAPH_JS,
ld: { '@context': $q.aG, '@graph': [{ '@type': $q.aH, name: $q.aI, description: T.en.g_desc, url: ORIGIN + $q.aF, license: $t.k34, creator: { '@type': $q.aJ, name: $q.aK, url: ORIGIN + '/' }, distribution: { '@type': $q.aL, encodingFormat: $q.aM, contentUrl: ORIGIN + $q.aw } }, { '@type': $q.aN, itemListElement: [[$q.aK, '/'], [$q.aO, $q.aP], [t.g_title, pre(lang) + $q.aF]].map((x, i) => ({ '@type': $q.aQ, position: i + 1, name: x[0], item: ORIGIN + x[1] })) }] } };
} else {
const t = tr(LT, lang);
o = { lang, path: $q.aR, title: t.l_title, desc: t.l_desc, body: liveBody(lang), js: LIVE_JS.replace($q.aS, TB.kbx_net_land__q.X_LAND),
ld: { '@context': $q.aG, '@type': $q.aT, name: t.l_title, description: t.l_desc, url: ORIGIN + pre(lang) + $q.aR } };
}
return new Response(await assemble(sh, o), { status: 200, headers: { 'content-type': $q.av, 'cache-control': $q.aU } });
}
