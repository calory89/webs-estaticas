// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_cohort__q, $s = TB.kbx_cohort__s, $t = TB.kbx_cohort__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { CS } from './kbx_cohort_i18n.js';
import { rpcW, sha } from './kolaboro.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
export const PATHS = /^\/api\/x\/cohort(?:\/|$)/;
export const PAGE = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?cohort\/?$/;
const esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.b, "'": '&#39;' }[c]));
const pre = l => l === 'en' ? '' : '/' + l;
const tr = (lang, k, v) => { const s = (CS[lang] && CS[lang][k]) || CS.en[k] || k; return v ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
const ID = /^[A-Z]{2,6}-[0-9]{2,4}$/;
function out(o, s, cc) { return new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': $q.c, 'cache-control': cc || $q.d, 'x-robots-tag': $q.e } }); }
const ipOf = req => { const a = req.headers.get($q.f) || 'x'; return a.includes(':') ? a.split(':').slice(0, 4).join(':') + '::/64' : a; };
async function allow(ctx, key, limit, ttl) {
try {
const k = new Request(ORIGIN + $q.g + encodeURIComponent(key));
const hit = await caches.default.match(k); const n = hit ? (+(await hit.text()) || 0) : 0;
if (n >= limit) return false;
const p = caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': $q.h + ttl } }));
if (ctx && ctx.waitUntil) ctx.waitUntil(p); else await p;
} catch (e) {}
return true;
}
const flagOn = env => String((env && env.KB_COHORT) || '').trim().toLowerCase() === 'on';
let DB = null;
async function dbReady() {
if (DB && Date.now() - DB.t < 300000) return DB.ok;
let ok = false; try { const r = await rpcW($q.i, { p_action: 'ping', p_payload: {} }); ok = !!(r && r.ok); } catch (e) { ok = false; }
DB = { ok, t: Date.now() }; return ok;
}
export async function enabled(env) { return flagOn(env) && await dbReady(); }
export async function cohortCard(env, lang, id) {
try {
if (!ID.test(String(id || '')) || !(await enabled(env))) return '';
let n = 0; try { const r = await rpcW($q.i, { p_action: 'count', p_payload: { project: id } }); n = r && r.members || 0; } catch (e) {}
return $t.k0 + esc(tr(lang, $q.j)) + $q.k + esc(tr(lang, $q.l)) + '</p>' + (n >= 2 ? $q.m + esc(tr(lang, $q.n, { n })) + '</p>' : '') +
$q.o + pre(lang) + $q.p + encodeURIComponent(id) + '">' + esc(tr(lang, $q.q)) + $q.r;
} catch (e) { return ''; }
}
export const cohortKey = env => flagOn(env) ? '|c1' : '';
export async function handle(req, u, env, ctx) {
const p = u.pathname.replace(/\/+$/, '');
if (p === $q.s || p === $q.t) {
const flag = flagOn(env), db = await dbReady();
return out({ module: $q.u, enabled: flag && db, flag, db, page: ORIGIN + $q.v, note: flag && db ? 'open' : $s.k0 }, 200, $q.w);
}
const on = await enabled(env);
if (p === $q.x) {
const id = String(u.searchParams.get($q.y) || '').toUpperCase();
if (!ID.test(id)) return out({ error: 'input' }, 400);
if (!on) return out({ error: $q.z }, 503, $q.w);
try { const r = await rpcW($q.i, { p_action: 'count', p_payload: { project: id } }); return out(r, 200, $q.A); } catch (e) { return out({ error: $q.B }, 503); }
}
const m = p.match(/^\/api\/x\/cohort\/(join|confirm|me|intro|answer|leave)$/);
if (!m) return out({ error: $q.C, module: $q.D }, 404, $q.w);
if (req.method !== 'POST') return out({ error: $q.E }, 405);
if (!on) return out({ error: $q.z }, 503);
const act = m[1];
let b = {}; try { const t = await req.text(); if (t.length > 4000) return out({ error: 'input' }, 413); b = JSON.parse(t || '{}') || {}; } catch (e) { return out({ error: 'input' }, 400); }
if (b.hp) return out({ ok: true });
const ip = ipOf(req), hour = new Date().toISOString().slice(0, 13);
if (!(await allow(ctx, 'coh:' + ip + ':' + hour, act === 'join' || act === 'intro' ? 12 : 60, 3600))) return out({ error: 'busy' }, 429);
const tok = x => /^[0-9a-f]{64}$/.test(String(x || '')) ? String(x) : '';
const pl = {};
if (act === 'join') {
pl.project = String(b.project || '').toUpperCase(); if (!ID.test(pl.project)) return out({ error: 'input' }, 400);
pl.note = String(b.note || '').slice(0, 280); pl.lang = LANGS.includes(b.lang) ? b.lang : 'en';
if (b.session && /^[A-Za-z0-9_.-]{20,200}$/.test(String(b.session))) pl.session = String(b.session);
else { pl.email = String(b.email || '').trim().toLowerCase().slice(0, 254); if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(pl.email)) return out({ error: 'input' }, 400); }
pl.ip_hash = await sha($q.F + ip);
} else if (act === $q.G) {
pl.a = tok(b.a); if (!pl.a) return out({ error: 'token' }, 404);
pl.do = ['view', $q.H, $q.I].includes(b.do) ? b.do : 'view';
} else {
pl.t = tok(b.t); if (!pl.t) return out({ error: 'token' }, 404);
if (act === 'intro') { pl.to = String(b.to || '').slice(0, 20); pl.message = String(b.message || '').slice(0, 600); }
}
let r; try { r = await rpcW($q.i, { p_action: act, p_payload: pl }); } catch (e) { return out({ error: $q.B }, 503); }
if (r && r.error) return out({ error: r.error }, $t.o_ERR[r.error] || 400);
return out(r || { ok: true });
}
function body(lang, on, demo) {
  const T = k => esc(tr(lang, k));
  const steps = $q.J + [1, 2, 3, 4].map(i => $q.K + T('s' + i + '_b') + $q.L + T('s' + i + '_p') + $q.M).join('') + '</ol>';
  const cfg = { on, demo, lang, pre: pre(lang), api: $q.N, s: CS[lang] || CS.en };
  return $q.O + pre(lang) + $q.P + T('title') + $q.Q + T('lead') + $q.R +
    (on ? '' : $q.S + T($q.T) + $q.U + T($q.V) + $q.W + pre(lang) + $q.X + T($q.Y) + $q.Z) +
    $q.aa + esc(JSON.stringify(cfg)) + $q.ab +
    (on || demo ? '' : $q.ac + T($q.ad) + $q.ae) + $q.af +
    $q.ag + T('how_h') + '</h2>' + steps + $q.af +
    $q.ah + T($q.ai) + $q.aj + T($q.ak) + $q.al + T($q.am) + $q.al + T($q.an) + $q.al + T($q.ao) + $q.ap;
}
const JS = String.raw`(function(){var R=document.getElementById('kc-app');if(!R)return;var C=JSON.parse(R.getAttribute('data-kc')),S=C.s;
function e(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function f(k,v){var s=S[k]||k;return v?s.replace(/\{(\w+)\}/g,function(m,x){return v[x]!=null?v[x]:m}):s}
function ls(k){try{return localStorage.getItem(k)}catch(x){return null}}
function mon(m){if(!m)return'';try{return new Intl.DateTimeFormat(document.documentElement.lang||C.lang,{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(m+'-01T00:00:00Z'))}catch(x){return m}}
var EM={token:'err_tok',closed:'err_closed',message:'err_msg',message_contact:'err_msg',busy:'err_busy',input:'err_email',left:'err_left',already:'err_already',unconfirmed:'err_tok'};
function api(a,b){if(C.demo)return Promise.resolve(DEMO[a]?DEMO[a](b):{ok:true});return fetch(C.api+a,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b),credentials:'omit'}).then(function(r){return r.json().catch(function(){return{error:'x'}})}).catch(function(){return{error:'x'}})}
function say(el,k,bad,v){el.innerHTML='<div class="k-alert'+(bad?' k-alert--warn':' k-alert--ok')+'" role="status"><span>'+e(f(k,v))+'</span></div>'}
var DEMO={me:function(){return{ok:true,project:'BALI-014',alias:'Buyer 7Q4K',joined:'2026-10',intros_left_today:3,members:[{alias:'Buyer M2XD',note:'Example note: bought a 1-bedroom villa in 2024, handover promised for Q2 2026.',joined:'2026-09',sent:null,received:null},{alias:'Buyer T9QA',note:null,joined:'2026-10',sent:'open',received:null},{alias:'Buyer 4HRW',note:'Example note: still deciding.',joined:'2026-11',sent:null,received:'open'}]}},intro:function(){return{ok:true}},leave:function(){return{ok:true}}};
var H=location.hash.replace(/^#/,''),mt=H.match(/(?:^|&)t=([0-9a-f]{64})/),ma=H.match(/(?:^|&)a=([0-9a-f]{64})/),q=new URLSearchParams(location.search),P=(q.get('p')||'').toUpperCase();
if(mt&&history.replaceState)history.replaceState(null,'',location.pathname+location.search);
if(C.demo){R.insertAdjacentHTML('beforebegin','<div class="k-alert" role="status"><b>Demo</b><span>'+e(S.demo_b)+'</span></div>');member('demo','me');return}
if(!C.on){return}
if(mt){member(mt[1],'confirm');return}
if(ma){answer(ma[1]);return}
if(/^[A-Z]{2,6}-[0-9]{2,4}$/.test(P)){join(P);return}
R.innerHTML='<div class="k-empty"><strong>'+e(S.pick_h)+'</strong><p>'+e(S.pick_p)+'</p><a class="k-btn k-btn--primary" href="'+C.pre+'/projects/">'+e(S.pick_btn)+'</a></div>';
function join(p){var tk=null;try{tk=sessionStorage.getItem('kb-token-as')||localStorage.getItem('kb-token')}catch(x){}var known=ls('kb-follow-email')||'';
R.innerHTML='<h2>'+e(f('join_h',{p:p}))+'</h2><form novalidate>'+(tk?'<p class="k-muted">'+e(S.logged)+'</p>':'')+'<div class="k-field"><label class="k-label" for="kc-e">'+e(S.email_l)+'</label><input class="k-input" id="kc-e" type="email" autocomplete="email" inputmode="email" required value="'+e(known)+'"></div><div class="k-field"><label class="k-label" for="kc-n">'+e(S.note_l)+'</label><textarea class="k-textarea" id="kc-n" maxlength="280" rows="2" placeholder="'+e(S.note_ph)+'"></textarea></div><input class="kc-hp" name="hp" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="k-btn k-btn--primary" type="submit">'+e(S.join_btn)+'</button> <a class="k-btn k-btn--ghost" href="'+C.pre+'/projects/?q='+encodeURIComponent(p)+'">'+e(S.watch_first)+'</a><div class="kc-out"></div></form>';
var F=R.querySelector('form'),o=F.querySelector('.kc-out');F.addEventListener('submit',function(ev){ev.preventDefault();var em=F.querySelector('#kc-e').value.trim();if(!tk&&!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(em)){say(o,'err_email',1);return}var bt=F.querySelector('button');bt.disabled=true;
api('join',{project:p,email:em,session:em?undefined:tk,note:F.querySelector('#kc-n').value,lang:C.lang,hp:F.hp.value}).then(function(r){bt.disabled=false;if(r&&r.ok)say(o,'join_ok',0,{p:p});else say(o,EM[r&&r.error]||'err',1)})})}
function member(t,first){R.setAttribute('aria-busy','true');api(first,{t:t}).then(function(d){R.removeAttribute('aria-busy');if(!d||!d.ok){say(R,EM[d&&d.error]||'err',1);return}draw(t,d)})}
function st(m){if(m.sent==='accepted'||m.received==='accepted')return'<span class="k-badge k-badge--ok">'+e(S.st_acc)+'</span>';if(m.received==='open')return'<span class="k-badge k-badge--info">'+e(S.st_in)+'</span>';if(m.sent==='open')return'<span class="k-badge k-badge--plain">'+e(S.st_open)+'</span>';if(m.sent==='closed')return'<span class="k-badge k-badge--plain">'+e(S.st_closed)+'</span>';return''}
function draw(t,d){var L=d.members||[];R.innerHTML='<h2>'+e(f('group_h',{p:d.project}))+'</h2><p>'+e(f('you_are',{a:d.alias,m:mon(d.joined)}))+'</p>'+(L.length?'<ul class="kc-list">'+L.map(function(m,i){var can=!m.sent&&!m.received&&d.intros_left_today>0;return'<li><div class="kc-row"><div><b>'+e(m.alias)+'</b><small class="k-muted">'+e(f('joined_m',{m:mon(m.joined)}))+'</small></div><div>'+st(m)+(can?'<button type="button" class="k-btn k-btn--sm" data-i="'+i+'">'+e(S.ask_btn)+'</button>':'')+'</div></div>'+(m.note?'<p>'+e(m.note)+'</p>':'')+'<div data-f="'+i+'"></div></li>'}).join('')+'</ul>':'<div class="k-empty"><strong>'+e(S.nobody)+'</strong></div>')+'<p style="margin-top:24px"><button type="button" class="k-btn k-btn--ghost" data-leave>'+e(S.left_btn)+'</button></p><div class="kc-out"></div>';
R.querySelectorAll('[data-i]').forEach(function(b){b.addEventListener('click',function(){var i=+b.getAttribute('data-i'),m=L[i],box=R.querySelector('[data-f="'+i+'"]');b.hidden=true;box.innerHTML='<form novalidate><div class="k-field"><label class="k-label" for="kc-m'+i+'">'+e(f('msg_l',{a:m.alias}))+'</label><textarea class="k-textarea" id="kc-m'+i+'" rows="4" minlength="20" maxlength="600" required></textarea></div><button class="k-btn k-btn--primary" type="submit">'+e(S.send_btn)+'</button> <button class="k-btn k-btn--ghost" type="button" data-x>'+e(S.cancel)+'</button><div class="kc-out"></div></form>';
var F=box.querySelector('form'),o=F.querySelector('.kc-out'),ta=F.querySelector('textarea');ta.focus();F.querySelector('[data-x]').addEventListener('click',function(){box.innerHTML='';b.hidden=false;b.focus()});
F.addEventListener('submit',function(ev){ev.preventDefault();var v=ta.value.trim();if(v.length<20||v.length>600||/(https?:\/\/|www\.|[^\s@]+@[^\s@]+\.[a-z]{2,}|\+?[0-9][0-9 ().-]{7,}[0-9])/i.test(v)){say(o,'err_msg',1);ta.setAttribute('aria-invalid','true');return}ta.removeAttribute('aria-invalid');
api('intro',{t:t,to:m.alias,message:v}).then(function(r){if(r&&r.ok){m.sent='open';box.innerHTML='';say(box,'sent',0,{a:m.alias})}else say(o,EM[r&&r.error]||'err',1)})})})});
var lv=R.querySelector('[data-leave]');lv.addEventListener('click',function(){if(!confirm(S.left_q))return;api('leave',{t:t}).then(function(r){if(r&&r.ok){R.innerHTML='';say(R,'left',0)}else say(R.querySelector('.kc-out'),'err',1)})})}
function answer(a){api('answer',{a:a,do:'view'}).then(function(d){if(!d||!d.ok){say(R,EM[d&&d.error]||'err',1);return}
R.innerHTML='<h2>'+e(S.ans_h)+'</h2><p>'+e(f('ans_from',{a:d.from,p:d.project}))+'</p>'+(d.from_note?'<p class="k-muted">'+e(f('ans_note',{n:d.from_note}))+'</p>':'')+'<p><b>'+e(S.ans_msg)+'</b></p><div class="kc-msg">'+e(d.message)+'</div>'+(d.state==='open'?'<p style="margin-top:16px"><button type="button" class="k-btn k-btn--primary" data-do="accept">'+e(S.acc_btn)+'</button> <button type="button" class="k-btn" data-do="decline">'+e(S.dec_btn)+'</button></p>':'<p class="k-muted">'+e(d.state==='accepted'?S.acc_ok:S.err_closed)+'</p>')+'<div class="kc-out"></div>';
R.querySelectorAll('[data-do]').forEach(function(b){b.addEventListener('click',function(){var w=b.getAttribute('data-do');R.querySelectorAll('[data-do]').forEach(function(x){x.disabled=true});api('answer',{a:a,do:w}).then(function(r){var o=R.querySelector('.kc-out');if(r&&r.ok)say(o,w==='accept'?'acc_ok':'dec_ok',0);else{say(o,EM[r&&r.error]||'err',1);R.querySelectorAll('[data-do]').forEach(function(x){x.disabled=false})}})})})})}
})();`;
export async function page(req, u, env, ctx, shell) {
  const m = u.pathname.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?cohort(\/?)$/); if (!m || !shell) return null;
  if (!m[2]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': $q.aq } });
  const lang = m[1] || 'en', on = await enabled(env), demo = u.searchParams.get('demo') === '1';
  const sh = await shell(pre(lang) + $q.ar);
  const path = $q.v, url = ORIGIN + pre(lang) + path;
  const alts = LANGS.map(l => $q.as + l + $q.at + ORIGIN + pre(l) + path + '">').join('') + $q.au + ORIGIN + path + '">';
  const ld = { '@context': $q.av, '@graph': [{ '@type': $q.aw, '@id': url + '#page', url, name: tr(lang, 'title'), description: tr(lang, 'desc'), inLanguage: lang, isPartOf: { '@type': $q.ax, name: $q.ay, url: ORIGIN + '/' } },
    { '@type': $q.az, itemListElement: [{ '@type': $q.aA, position: 1, name: $q.ay, item: ORIGIN + pre(lang) + '/' }, { '@type': $q.aA, position: 2, name: tr(lang, 'crumb'), item: url }] }] };
  const tags = $q.aB + esc(tr(lang, 'title')) + $q.aC + esc(tr(lang, 'desc')) + $q.aD + url + '">' + alts +
    (on && !demo ? '' : $q.aE) + $q.aF +
    $q.aG + esc(tr(lang, 'title')) + $q.aH + esc(tr(lang, 'desc')) + $q.aI + url + $q.aJ +
    $q.aK + JSON.stringify(ld).replace(/</g, $q.aL) + $q.aM + $q.a;
  const res = new HTMLRewriter()
    .on('title', { element(e) { e.remove(); } })
    .on($q.aN, { element(e) { e.remove(); } })
    .on($q.aO, { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setAttribute($q.aP, 'True'); e.setInnerContent(body(lang, on, demo) + $q.aQ + JS + $q.aM, { html: true }); } })
    .on($q.aR, { element(e) { const l = e.getAttribute($q.aS); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + path); } })
    .transform(new Response(sh.body, { headers: { 'content-type': $q.aT } }));
  return new Response(await res.text(), { status: 200, headers: { 'content-type': $q.aT, 'cache-control': $q.d, 'referrer-policy': $q.aU, 'x-robots-tag': on && !demo ? 'all' : $q.e } });
}
