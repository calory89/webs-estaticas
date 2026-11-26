// kolaboro.com batch 26 (agent n26u, 13 Nov 2026): user flow, speed and return visits. No paid AI, no DB writes, nothing invented.
//   GET /[<lang>/]compare/?p=<slug>,<slug>[,<slug>]  two or three named projects side by side (facts as published, transparency score,
//                                                   sources on each project page); noindex, canonical /compare/ (any combination is
//                                                   possible, so none is offered to search engines). Without ?p the static tool answers.
//   GET /api/v1/facets?lang=xx                      per named project: country, place, handover year, permit published, transparency
//                                                   score, last checked (the filters and sorting on /projects/)
//   GET /api/v1/followers?id=<ID>                   confirmed email followers of one project, read through the existing counters function
//                                                   (kolaboro_xc 'counts'): shown only from 3 upwards, null below (privacy threshold)
//   GET /api/x/status/pages                         20 key pages fetched from the edge, at most once every 5 minutes per edge location and
//                                                   once per deployed commit (a post-deploy smoke test); also refreshed every 5 minutes by the
//                                                   existing database uptime probe of /api/kb/health (warm())
// UI parts exported for kbx_named.js: nextStep() (the "What next" block with compare, save, alert, ask and share), filterBar() for
// /projects/, CSS and JS. Sumba projects never appear (kbx_named.js data() leaves them out), nor Eco Beach City or Equinox.
import { t30, radarSvg } from './kbx_n30a.js';
import { T as NT } from './kbx_named_i18n.js';   // n33b: rel_embed label (table filled by kbx_strings.js before every request)   // n30a (batch 30): timeline link, compare radar of the six checks
import { regSale, rsText } from './kbx_n31d_rs.js';
import { TB } from './kbx_strings.js';   // n31d: DLD registered sale prices are not asking prices
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const COI_RX = /eco\s*beach\s*city|\bequinox\b/i;
const pre = l => l === 'en' ? '' : '/' + l;
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bdi = (lang, s) => lang === 'ar' ? '<bdi>' + esc(s) + '</bdi>' : esc(s);

// n32s (batch 32, item 293): nx_save / nx_saved say the same words as the star button of the follow box (kbx_follow.js SV), which they press
const S = TB.kbx_u26_S /* n40 k5: in /data/i18n/kbx_u26.json */;
export const t26 = (lang, k, v) => { let s = (S[lang] && S[lang][k] != null) ? S[lang][k] : S.en[k]; if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b); return s; };
const stK = s => s === 'off-plan' ? 'st_offplan' : s === 'under construction' ? 'st_construction' : s === 'completed' ? 'st_completed' : 'st_unknown';

// ------------------------------------------------------------------------------------------------ "What next" block on a project page
// cmp: slugs of up to two similar projects (same place first) for the compare link
export function nextStep(lang, x, name, cmp, txt) {   // txt (n31d, item 148): the share text with the project's key facts
  const P = pre(lang), url = ORIGIN + P + '/projects/' + x.s + '/';
  const cmpHref = P + '/compare/?p=' + [x.s].concat(cmp || []).slice(0, 4).join(',');
  const wa = 'https://wa.me/?text=' + encodeURIComponent((txt || name) + ' ' + url);
  const m = { ok: t26(lang, 'sh_ok'), saved: t26(lang, 'nx_saved'), save: t26(lang, 'nx_save'), url, title: name };
  return '<section class="ks knx" id="next" data-kn="' + esc(JSON.stringify(m)) + '"><h2>' + esc(t26(lang, 'nx_h')) + '</h2><ul class="knx-a">' +
    ((cmp || []).length ? '<li><a href="' + esc(cmpHref) + '" data-ev="next_compare"><span aria-hidden="true">⇆</span>' + esc(t26(lang, 'nx_cmp')) + '</a></li>' : '') +
    '<li><button type="button" data-kn-save aria-pressed="false"><span aria-hidden="true">☆</span><span>' + esc(t26(lang, 'nx_save')) + '</span></button></li>' +
    '<li><a href="#watch" data-kn-alert><span aria-hidden="true">✉</span>' + esc(t26(lang, 'nx_alert')) + '</a></li>' +
    '<li><a href="/ask-developer/?id=' + encodeURIComponent(x.id) + '"><span aria-hidden="true">?</span>' + esc(t26(lang, 'nx_ask')) + '</a></li>' +
    '<li><a href="' + P + '/projects/' + x.s + '/timeline/"><span aria-hidden="true">⋮</span>' + esc(t30(lang, 'tl_link')) + '</a></li>' +   // n30a: every dated record on one timeline
    '<li><a href="/embed/p/' + x.s + '/' + (lang === 'en' ? '' : '?lang=' + lang) + '" rel="nofollow"><span aria-hidden="true" dir="ltr">&lt;/&gt;</span>' + esc((NT[lang] || NT.en || {}).rel_embed || 'Embed these facts on your site') + '</a></li></ul>' +   // n33b (item 95): the free widgets, visible on every project page
    '<p class="knx-s"><span>' + esc(t26(lang, 'sh')) + ':</span> <a href="' + esc(wa) + '" target="_blank" rel="noopener nofollow">WhatsApp</a> <button type="button" data-kn-copy>' + esc(t26(lang, 'sh_copy')) + '</button> <button type="button" data-kn-share hidden>' + esc(t26(lang, 'sh_more')) + '</button> <span class="knx-o" role="status" aria-live="polite"></span>' +
    ' <a class="knx-my" href="/watchlist/">' + esc(t26(lang, 'nx_my')) + '</a></p></section>';
}
export const NX_CSS = '<style id="knx-css">.knx-a{list-style:none;padding:0;margin:12px 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.knx-a a,.knx-a button{display:flex;align-items:center;gap:10px;width:100%;min-height:52px;padding:10px 14px;border:1.5px solid var(--line,#d5d3cc);border-radius:12px;background:var(--card,#fff);color:var(--ink,#17212B);font:inherit;font-weight:600;text-align:start;text-decoration:none;cursor:pointer}.knx-a a:hover,.knx-a button:hover{border-color:var(--ink,#17212B)}.knx-a span[aria-hidden]{flex:none;width:28px;height:28px;display:grid;place-items:center;border-radius:8px;background:var(--concrete,#F1EFE9);font-size:15px}.knx-a [aria-pressed=true]{border-color:var(--k-sea,#155C75)}' +
  '.knx-s{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;margin:6px 0 0}.knx-s a,.knx-s button{min-height:44px;display:inline-flex;align-items:center;padding:0 12px;border:1px solid var(--line,#d5d3cc);border-radius:10px;background:none;color:inherit;font:inherit;cursor:pointer;text-decoration:none}.knx-s .knx-my{border:0;text-decoration:underline;padding:0 4px}.knx-o{font-weight:600}.knx a:focus-visible,.knx button:focus-visible{outline:3px solid var(--k-sea,#155C75);outline-offset:2px}.kw-fol{margin:6px 0 0;font-size:.88rem;color:var(--muted,#59626B)}</style>';
// save mirrors the star in the watch box (same browser list, kb_watch); copy uses the Clipboard API; share uses the Web Share API when present;
// the follower count is read once the watch box is near the screen and shown only from 3 upwards (the server sends null below)
export const NX_JS = "(function(){var N=document.querySelector('[data-kn]');if(!N)return;var M=JSON.parse(N.getAttribute('data-kn')),o=N.querySelector('.knx-o'),sv=N.querySelector('[data-kn-save]'),star=document.querySelector('[data-kw-save]');" +
  "function sync(){if(!star){sv.parentNode.hidden=true;return;}var on=star.getAttribute('aria-pressed')==='true';sv.setAttribute('aria-pressed',on?'true':'false');sv.children[0].textContent=on?'\\u2605':'\\u2606';sv.children[1].textContent=on?M.saved:M.save;}" +
  "sync();if(star){sv.addEventListener('click',function(){star.click();setTimeout(sync,400);setTimeout(sync,1500);});new MutationObserver(sync).observe(star,{attributes:true,attributeFilter:['aria-pressed']});}" +
  "var al=N.querySelector('[data-kn-alert]');if(al)al.addEventListener('click',function(e){var b=document.querySelector('[data-kw-btn]');var w=document.getElementById('watch');if(!w)return;e.preventDefault();w.scrollIntoView({block:'center'});if(b&&!b.hidden)setTimeout(function(){b.focus();},300);else{var i=w.querySelector('input[type=email]');if(i&&!i.closest('[hidden]'))i.focus();}});" +
  "N.querySelector('[data-kn-copy]').addEventListener('click',function(){var done=function(){o.textContent=M.ok;setTimeout(function(){o.textContent='';},2500);};try{navigator.clipboard.writeText(M.url).then(done,function(){prompt('',M.url);});}catch(e){prompt('',M.url);}try{if(window.kbEvent)kbEvent('share_copy');}catch(e){}});" +
  "var sh=N.querySelector('[data-kn-share]');if(navigator.share){sh.hidden=false;sh.addEventListener('click',function(){navigator.share({title:M.title,text:(function(){try{var w=N.querySelector('.knx-s a'),t=new URL(w.href).searchParams.get('text')||'';return t.replace(M.url,'').trim()||undefined;}catch(e){return undefined;}})(),url:M.url}).catch(function(){});try{if(window.kbEvent)kbEvent('share_native');}catch(e){}});}" +
  "var W=document.querySelector('[data-kw]');if(W&&'IntersectionObserver'in window){var id=JSON.parse(W.getAttribute('data-kw')).id,io=new IntersectionObserver(function(es){if(!es[0].isIntersecting)return;io.disconnect();fetch('/api/v1/followers?id='+encodeURIComponent(id)).then(function(r){return r.ok?r.json():null;}).then(function(j){if(!j||!j.followers||!j.text)return;var p=document.createElement('p');p.className='kw-fol';p.textContent=j.text;var t=W.querySelector('.kw-t');(t||W).appendChild(p);}).catch(function(){});},{rootMargin:'200px'});io.observe(W);}" +
  "})();";

// ------------------------------------------------------------------------------------------------ filters and sorting on /projects/
export function filterBar(lang) {
  const m = {}; for (const k of ['any', 'pm_y', 'pm_n', 'sc_n', 'yr_n', 'f_k', 'f_k1', 'f_0', 'f_more', 'f_err', 'f_ck', 'f_sct', 'f_clr']) m[k] = t26(lang, k);
  m.lang = lang; m.pre = pre(lang);
  const sel = (id, lbl, opts) => '<label for="kf-' + id + '"><span>' + esc(t26(lang, lbl)) + '</span><select id="kf-' + id + '" name="' + id + '">' + opts + '</select></label>';
  const anyO = '<option value="">' + esc(t26(lang, 'any')) + '</option>';
  return '<details class="kf" data-kf="' + esc(JSON.stringify(m)) + '"><summary>' + esc(t26(lang, 'f_h')) + '</summary><form class="kf-f" role="search">' +
    sel('co', 'f_co', anyO) + sel('pl', 'f_pl', anyO) + sel('yr', 'f_yr', anyO) +
    sel('pm', 'f_pm', anyO + '<option value="1">' + esc(t26(lang, 'pm_y')) + '</option><option value="0">' + esc(t26(lang, 'pm_n')) + '</option>') +
    sel('sc', 'f_sc', anyO + [25, 50, 75].map(n => '<option value="' + n + '">' + esc(t26(lang, 'sc_n', { n })) + '</option>').join('')) +
    sel('so', 'f_so', ['0', 'tr', 'ho', 'ck'].map(k => '<option value="' + (k === '0' ? '' : k) + '">' + esc(t26(lang, 'so_' + k)) + '</option>').join('')) +
    '<button type="reset" class="kf-r">' + esc(t26(lang, 'f_clr')) + '</button></form><p class="kf-n" role="status" aria-live="polite"></p><ol class="kf-out" hidden></ol></details>';
}
export const KF_CSS = '<style id="kf-css">.kf{margin:18px 0 0;border:1.5px solid var(--line,#d5d3cc);border-radius:14px;background:var(--card,#fff);padding:0 16px}.kf>summary{min-height:52px;display:flex;align-items:center;font-weight:700;cursor:pointer}.kf[open]>summary{border-bottom:1px solid var(--line,#d5d3cc)}' +
  '.kf-f{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px 14px;padding:14px 0}.kf-f label{display:flex;flex-direction:column;gap:4px;font-size:.84rem;font-weight:600;min-width:0}.kf-f select{min-height:44px;width:100%;min-width:0;border:1.5px solid var(--line,#d5d3cc);border-radius:10px;padding:0 10px;background:var(--paper,#fff);color:inherit;font:inherit;font-weight:500}' +
  '.kf-r{align-self:end;min-height:44px;border:0;background:none;color:inherit;text-decoration:underline;font:inherit;cursor:pointer;justify-self:start}.kf-n{margin:0 0 10px;font-weight:600}.kf-out{list-style:none;margin:0 0 14px;padding:0}.kf-out li{padding:9px 0;border-bottom:1px solid var(--line,#d5d3cc)}.kf-out a{font-weight:600}.kf-out small{display:block;color:var(--muted,#59626B);font-size:.84rem;margin-top:2px}.kf-more{min-height:44px;margin:0 0 14px;padding:0 14px;border:1.5px solid var(--ink,#17212B);border-radius:10px;background:none;color:inherit;font:inherit;font-weight:600;cursor:pointer}.kf select:focus-visible,.kf summary:focus-visible,.kf button:focus-visible{outline:3px solid var(--k-sea,#155C75);outline-offset:2px}</style>';
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

// ------------------------------------------------------------------------------------------------ endpoints
const JT = 'application/json; charset=utf-8';
const jr = (o, st, cc) => new Response(JSON.stringify(o), { status: st || 200, headers: { 'content-type': JT, 'cache-control': cc || 'no-store', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' } });
let FAC = new Map();
// n30a (batch 30): the natural-language search on /projects/ and the home page also filters by unit type, price and stage. Types come from
// the unit types the developer publishes (English words in our record); prices as published, plus a US dollar figure at the ECB
// reference rate of the day (AED from its fixed USD peg) so a price typed in any currency can be compared. Nothing is estimated:
// a project without a published price or unit type simply does not match those filters.
const TYPE_RX = [['v', /villa/i], ['t', /town ?house|townhome|row ?house|terrace house/i], ['p', /penthouse/i], ['s', /studio/i], ['l', /\bland\b|\bplots?\b|\blots?\b/i], ['h', /hotel|serviced|condotel|branded suite/i], ['o', /office|shop|retail|commercial|showroom/i], ['a', /apartment|\bflats?\b|condo|\b\d\s?br\b|bedroom|residence|loft|duplex|simplex|\bunit/i]];
const typesOf = ut => { const o = new Set(); for (const u of (Array.isArray(ut) ? ut : [])) { let hit = false; for (const [k, re] of TYPE_RX) if (re.test(String(u))) { if (k === 'a' && hit) continue; o.add(k); hit = true; } } return [...o].sort().join(''); };
let ECBR = null;
async function ecbPerUsd() {   // units of each currency per 1 USD, from the ECB euro reference rates of the day (12 h per isolate)
  if (ECBR && Date.now() - ECBR.t < 43200000) return ECBR.v;
  try {
    const r = await fetch('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml', { cf: { cacheTtl: 21600, cacheEverything: true }, headers: { 'user-agent': 'kolaboro.com facets (+https://kolaboro.com/projects/)' } });
    const t = await r.text(), eu = { EUR: 1 }; for (const m of t.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([\d.]+)['"]/g)) eu[m[1]] = +m[2];
    if (!eu.USD) throw 0;
    const v = { d: (/time=['"](\d{4}-\d\d-\d\d)/.exec(t) || [])[1] || null, src: 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml', r: {} };
    for (const [c, x] of Object.entries(eu)) v.r[c] = Math.round(x / eu.USD * 1e6) / 1e6;
    v.r.USD = 1; v.r.AED = 3.6725; v.peg = { AED: 'fixed peg of 3.6725 AED per USD (Central Bank of the UAE)' };
    ECBR = { t: Date.now(), v }; return v;
  } catch (e) { ECBR = { t: Date.now() - 43200000 + 600000, v: null }; return null; }   // try again in 10 minutes
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
  const v = JSON.stringify({ version: 'facets-2', lang, updated: ix.updated, license: 'CC BY 4.0, credit Kolaboro', note: 'One row per named project. Transparency score 0 to 100 counts what is published and checkable (method: ' + ORIGIN + '/methods/transparency-score/); null where not scored. Handover as published. ty: unit types the developer publishes (v villa, a apartment, t townhouse, p penthouse, s studio, l land, h hotel or serviced, o office or shop). pr/cu: lowest price as published and its currency; pu: the same in US dollars at the ECB reference rate of fx.d (null where no price or no rate).',
    fields: ['s', 'n', 'dv', 'co', 'con', 'pl', 'pln', 'yr', 'hk', 'ho', 'pm', 'sc', 'ck', 'ty', 'pr', 'cu', 'pu', 'st', 'ar'], fx, p });
  FAC.set(lang, { ix, k, v }); return v;
}
async function followers(u, env, ctx) {
  const id = String(u.searchParams.get('id') || '').toUpperCase();
  if (!/^[A-Z]{2,6}-[0-9]{2,4}$/.test(id)) return jr({ error: 'id' }, 400);
  const N = await import('./kbx_named.js'); let ix; try { ix = await N.data(env); } catch (e) { return jr({ error: 'data' }, 503); }
  if (!ix.byId.get(id)) return jr({ error: 'not_found' }, 404);
  const lang = LANGS.includes(u.searchParams.get('lang')) ? u.searchParams.get('lang') : 'en';
  const ck = new Request(ORIGIN + '/__kbx_u26/fol/' + id);
  let n = null, hit = null;
  try { hit = await caches.default.match(ck); } catch (e) {}
  if (hit) n = (await hit.json()).n;
  else {
    let r = null; try { const { rpcW } = await import('./kolaboro.js'); r = await rpcW('kolaboro_xc', { p_action: 'counts', p_payload: { domain: '', ref: id } }); } catch (e) {}
    if (!r || !r.ok) return jr({ id, followers: null, threshold: 3, note: 'count not available right now' }, 200, 'public, max-age=60');
    n = r.watchers || null;
    try { ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify({ n }), { headers: { 'cache-control': 'max-age=900' } }))); } catch (e) {}
  }
  return jr({ id, followers: n, threshold: 3, text: n ? t26(lang, 'fol1', { n }) : null, about: 'Confirmed email followers of this project (double opt-in). Below 3 the number is not shown.' }, 200, 'public, max-age=600');
}

// key pages: the 20 pages people and search engines reach most; every check is a plain GET as a visitor would make it
export const KEY_PAGES = ['/', '/projects/', '/es/projects/', '/ar/projects/', '/projects/elements-cyprus/', '/de/projects/elements-cyprus/', '/developers/emaar-properties/', '/rankings/transparency/', '/rankings/transparency/bali/',
  '/check/', '/pricing/', '/database/', '/compare/', '/watchlist/', '/tools/', '/countries/', '/llms.txt', '/sitemap.xml', '/api/open/stats', '/api/v1/search-index'];
const SWEEP_TTL = 300;
let SWEEPING = null;
async function sweep(env) {
  const commit = String(env.CF_PAGES_COMMIT_SHA || '').slice(0, 12) || 'unknown';
  const at = new Date().toISOString();
  const res = await Promise.all(KEY_PAGES.map(async p => {
    const t0 = Date.now(); let status = 0, bytes = 0, ok = false, err = '';
    for (let a = 0; a < 2 && !ok; a++) {   // one retry after a short pause: a single slow answer is not an outage
      if (a) await new Promise(r => setTimeout(r, 800));
      try {
        const r = await fetch(ORIGIN + p, { headers: { 'user-agent': 'kolaboro-keypages/1.0 (+https://kolaboro.com/status/)', accept: /^\/api\/|\.txt$|\.xml$/.test(p) ? '*/*' : 'text/html' }, redirect: 'manual', signal: AbortSignal.timeout(10000) });
        status = r.status; const b = await r.arrayBuffer(); bytes = b.byteLength;
        ok = status >= 200 && status < 400 && (status >= 300 || bytes > 200); err = ok ? '' : 'status ' + status;
      } catch (e) { err = String(e && e.name || 'error'); }
    }
    return { p, status, ok, ms: Date.now() - t0, bytes };
  }));
  // n31t (batch 31, item 251): the paying path, checked the way a buyer reaches it: the booking page links the PayPal checkout and that
  // checkout page opens (a GET of the hosted payment page; nothing is paid, no order is created)
  const flow = await checkoutFlow().catch(e => ({ ok: false, err: String(e && e.name || 'error') }));
  return { at, commit, ok: res.every(r => r.ok) && flow.ok, up: res.filter(r => r.ok).length, n: res.length, pages: res, checkout: flow };
}
async function checkoutFlow() {
  const t0 = Date.now(), H = { 'user-agent': 'kolaboro-keypages/1.0 (+https://kolaboro.com/status/)', accept: 'text/html' };
  const b = await fetch(ORIGIN + '/book/', { headers: H, signal: AbortSignal.timeout(10000) }), bt = await b.text();
  const m = /href="(https:\/\/www\.paypal\.com\/ncp\/payment\/[A-Z0-9]{6,20})"/.exec(bt);
  if (b.status !== 200 || !m) return { ok: false, step: 'booking page', status: b.status, link: !!m, ms: Date.now() - t0 };
  let st = 0;
  for (let a = 0; a < 2 && !(st >= 200 && st < 400); a++) {
    if (a) await new Promise(r => setTimeout(r, 800));
    try { const r = await fetch(m[1], { headers: H, redirect: 'manual', signal: AbortSignal.timeout(10000) }); st = r.status; try { await r.body.cancel(); } catch (e) {} } catch (e) { st = 0; }
  }
  return { ok: st >= 200 && st < 400, step: 'checkout page', booking: b.status, checkout: st, url: m[1], ms: Date.now() - t0, note: 'Opens the hosted checkout only; nothing is paid.' };
}
async function sweepCached(env, ctx, force) {
  const commit = String(env.CF_PAGES_COMMIT_SHA || '').slice(0, 12) || 'unknown';
  const ck = new Request(ORIGIN + '/__kbx_u26/pages/' + commit), hk = new Request(ORIGIN + '/__kbx_u26/pages-hist');
  if (!force) { try { const hit = await caches.default.match(ck); if (hit) { const j = await hit.json(); if (Date.now() - Date.parse(j.at) < SWEEP_TTL * 1000) return j; } } catch (e) {} }
  if (!SWEEPING) SWEEPING = (async () => {
    const s = await sweep(env);
    let hist = []; try { const h = await caches.default.match(hk); if (h) hist = (await h.json()).h || []; } catch (e) {}
    const prev = hist.length ? hist[hist.length - 1] : null;
    hist.push([s.at, s.commit, s.up, s.n]); hist = hist.filter(h => Date.now() - Date.parse(h[0]) < 86400e3).slice(-400);
    s.first_on_commit = !prev || prev[1] !== s.commit;
    s.history = { scope: 'this edge location, last 24 hours', sweeps: hist.length, all_up: hist.filter(h => h[2] === h[3]).length, since: hist[0] ? hist[0][0] : s.at, commits: [...new Set(hist.map(h => h[1]))].slice(-5) };
    const put = Promise.all([caches.default.put(ck, new Response(JSON.stringify(s), { headers: { 'cache-control': 'max-age=86400' } })), caches.default.put(hk, new Response(JSON.stringify({ h: hist }), { headers: { 'cache-control': 'max-age=172800' } }))]).catch(() => {});
    try { ctx.waitUntil(put); } catch (e) { await put; }
    return s;
  })().finally(() => { SWEEPING = null; });
  return SWEEPING;
}
// called by index.js for /api/kb/health (the database server's 5-minute uptime probe): refresh the key-page sweep in the background
export function warm(env, ctx) { try { ctx.waitUntil(sweepCached(env, ctx, false).catch(() => {})); } catch (e) {} }
async function statusPages(env, ctx) {
  const s = await sweepCached(env, ctx, false);
  return jr(Object.assign({ about: 'The 20 key pages of kolaboro.com, fetched from the Cloudflare edge as a visitor would (one retry). Run at most every 5 minutes per edge location, once for every newly deployed commit (a smoke test after each deploy), and every 5 minutes by the database server\'s uptime probe of /api/kb/health. Up = 2xx or 3xx with a body. The rolling history is kept in this edge location\'s cache only, so it can be shorter after a cache eviction.', schedule: 'every 5 minutes' }, s), 200, 'public, max-age=60');
}

// ------------------------------------------------------------------------------------------------ compare page
async function comparePage(req, u, env, ctx, shell, lang) {
  const N = await import('./kbx_named.js'), H = await import('./kbx_hdate.js');
  let ix; try { ix = await N.data(env); } catch (e) { return null; }
  const want = [...new Set(String(u.searchParams.get('p') || '').toLowerCase().split(',').map(s => s.trim()).filter(s => /^[a-z0-9-]{1,90}$/.test(s)))].slice(0, 4);
  const L = want.map(s => ix.bySlug.get(s)).filter(x => x && !COI_RX.test(String(x.n || '') + ' ' + String(x.dv || '')));
  const T = await import('./kbx_tr.js'), U27 = await import('./kbx_u27.js');
  const trs = await Promise.all(L.map(x => T.trProject(env, x.id, lang).catch(() => null)));
  const P = pre(lang), loc = { zh: 'zh-CN', ar: 'ar' }[lang] || lang;
  const nf = n => { try { return Number(n).toLocaleString(loc); } catch (e) { return String(n); } };
  const href = arr => P + '/compare/?p=' + arr.join(',');
  const col = L.map((x, i) => {
    const c = ix.caseBy.get(x.id) || {}, fx = x.fx || {}, ho = N.handoverOf(ix, x), t = trs[i];
    const RS = regSale(x), price = RS ? rsText(lang, RS) : fx.price_min > 0 ? (fx.currency ? fx.currency + ' ' : '') + nf(fx.price_min) + (fx.price_max > fx.price_min ? ' – ' + nf(fx.price_max) : '') : null;
    const rk = t && t.ranks && t.ranks.length ? t.ranks.map(r => r.ranked ? t26(lang, 'rk', { r: nf(r.r), m: nf(r.m), p: r.p }) : r.p + ': ' + t26(lang, 'unr')).join('; ') : null;
    const L6 = U27.light6({ tp: t, c, pn: x.pn, ho, ev: x.ev, ids: [] });   // n30a: the six checks, same rules as the project page
    return { x, c, L6, dev: x.dv, devHref: x.dvs && ix.devs.has(x.dvs) ? P + '/developers/' + x.dvs + '/' : null, loc: H.placeName([x.ar, x.mk !== x.ar ? x.mk : null, x.co !== x.mk ? x.co : null].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', '), lang),
      st: t26(lang, stK(c.stage || x.st)), ho: ho ? H.hdisp(ho.d, lang) : null, pm: x.pn || ((c.checks || {}).permit === 2 ? '✓' : null), price, sc: t ? t.score : null, rk, ck: N.lastmod(ix, x) };
  });
  const cell = v => v ? bdi(lang, v) : '<span class="kc-np">' + esc(t26(lang, 'np')) + '</span>';
  const rows = [['r_dev', o => o.dev ? (o.devHref ? '<a href="' + o.devHref + '">' + bdi(lang, o.dev) + '</a>' : bdi(lang, o.dev)) : cell(null)], ['r_loc', o => cell(o.loc)], ['r_st', o => esc(o.st)], ['r_ho', o => cell(o.ho)], ['r_pm', o => cell(o.pm)], ['r_pr', o => cell(o.price)],
    ['r_tr', o => o.sc != null ? '<b class="kc-sc">' + esc(t26(lang, 'of100', { s: nf(o.sc) })) + '</b><span class="kc-bar"><i style="width:' + o.sc + '%"></i></span>' : cell(null)], ['r_rk', o => cell(o.rk)], ['r_ck', o => esc(N.fd(o.ck, lang))],
    ['r_src', o => '<a href="' + P + '/projects/' + o.x.s + '/#sources">' + esc(t26(lang, 'c_open')) + '</a> · <a href="' + P + '/projects/' + o.x.s + '/timeline/">' + esc(t30(lang, 'tl_s')) + '</a>']];
  // n30a: one row per check of the six-check light, placed after the transparency rank; rows equal in every column carry kc-same
  const six = [0, 1, 2, 3, 4, 5].map(i => ['lt6_' + i, o => { const s = o.L6[i][2]; return '<span class="kc6 kc6-' + s[0] + '"><i aria-hidden="true"></i>' + esc(U27.t27(lang, s[1], s[2])) + '</span>'; }, o => U27.t27(lang, 'lt_' + o.L6[i][0])]);
  rows.splice(rows.findIndex(r => r[0] === 'r_rk') + 1, 0, ...six);
  const diff = u.searchParams.get('diff') === '1';
  const rowLbl = (r) => r[2] ? r[2](col[0] || { L6: [[ 'permit' ], [ 'company' ], [ 'date' ], [ 'build' ], [ 'web' ], [ 'lists' ]] }) : t26(lang, r[0]);
  const same = r => r[0] !== 'r_src' && col.length >= 2 && col.every(o => String(r[1](o)).replace(/<[^>]+>/g, '').trim() === String(r[1](col[0])).replace(/<[^>]+>/g, '').trim());
  const radar = col.length >= 2 ? radarSvg(lang, col.map(o => ({ name: o.x.n, st: o.L6.map(p => p[2][0]) }))) : '';
  const head = '<tr><th scope="col"><span class="kc-vh">' + esc(t26(lang, 'c_bc')) + '</span></th>' + col.map(o => '<th scope="col"><a href="' + P + '/projects/' + o.x.s + '/">' + bdi(lang, o.x.n) + '</a> <a class="kc-rm" href="' + esc(href(L.filter(y => y !== o.x).map(y => y.s))) + '" aria-label="' + esc(t26(lang, 'c_rm', { n: o.x.n })) + '">×</a></th>').join('') + '</tr>';
  const table = col.length ? (col.length >= 2 ? '<p class="kc-dt"><label><input type="checkbox" id="kc-diff"' + (diff ? ' checked' : '') + '> ' + esc(t30(lang, 'cp_diff')) + '</label></p>' : '') + '<div class="kc-tw"><table class="kc"><thead>' + head + '</thead><tbody>' + rows.map(r => '<tr' + (same(r) ? ' class="kc-same"' : '') + '><th scope="row">' + esc(rowLbl(r)) + '</th>' + col.map(o => '<td data-n="' + esc(o.x.n) + '">' + r[1](o) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>' + radar : '';
  const m = { pre: P, cur: L.map(x => x.s), max: t26(lang, 'c_max') };
  const addBox = '<div class="kc-add" data-kc="' + esc(JSON.stringify(m)) + '"><label for="kc-q">' + esc(t26(lang, 'c_add')) + '</label><input id="kc-q" type="search" autocomplete="off" spellcheck="false" placeholder="' + esc(t26(lang, 'c_ph')) + '" aria-controls="kc-o" aria-expanded="false" role="combobox" aria-autocomplete="list"' + (L.length >= 4 ? ' disabled' : '') + '>' +
    '<ul id="kc-o" role="listbox" hidden></ul>' + (L.length >= 4 ? '<p class="kc-np">' + esc(t26(lang, 'c_max')) + '</p>' : '') + '</div>';
  const shareUrl = ORIGIN + href(L.map(x => x.s)) + (diff ? '&diff=1' : '');
  const body = '<section class="phero kp"><div class="wrap"><p class="crumb"><a href="' + P + '/">Kolaboro</a> / <a href="' + P + '/projects/">' + esc((await import('./kbx_named.js')).tr(lang, 'h1_i')) + '</a></p><h1>' + esc(t26(lang, 'c_t')) + '</h1><p class="lead">' + esc(t26(lang, 'c_d')) + '</p>' + addBox + '</div></section>' +
    '<div class="wrap kwrap kc-w">' + (L.length < 2 ? '<p class="kc-few">' + esc(t26(lang, 'c_few')) + ' <a href="' + P + '/projects/">' + esc(N.tr(lang, 'h1_i')) + '</a></p>' : '') + table +
    '<p class="ki">' + esc(t26(lang, 'c_note')) + ' <a href="' + P + '/methods/transparency-score/">' + esc(t26(lang, 'r_tr')) + '</a></p>' +
    (L.length ? '<p class="knx-s"><span>' + esc(t26(lang, 'c_share')) + ':</span> <a href="https://wa.me/?text=' + encodeURIComponent(t26(lang, 'c_t') + ' ' + shareUrl) + '" target="_blank" rel="noopener nofollow">WhatsApp</a> <button type="button" class="kc-cp" data-u="' + esc(shareUrl) + '" data-ok="' + esc(t26(lang, 'sh_ok')) + '">' + esc(t26(lang, 'sh_copy')) + '</button> <span class="kc-cpo" role="status" aria-live="polite"></span></p>' : '') +
    '<p class="ki"><a href="/compare/">' + esc(t26(lang, 'c_old')) + '</a></p></div>' +
    '<style>.kc-tw{overflow-x:auto;border:1px solid var(--line,#d5d3cc);border-radius:14px;background:var(--card,#fff);margin:18px 0}.kc{width:100%;border-collapse:collapse;min-width:560px}.kc th,.kc td{padding:12px 14px;text-align:start;vertical-align:top;border-bottom:1px solid var(--line,#d5d3cc)}.kc thead th{font-size:1.05rem}.kc tbody th{font-size:.86rem;color:var(--muted,#59626B);font-weight:600;width:22%}.kc-np{color:var(--muted,#59626B)}.kc-sc{font-variant-numeric:tabular-nums}.kc-bar{display:block;height:6px;border-radius:3px;background:var(--concrete,#F1EFE9);margin-top:6px;max-width:160px}.kc-bar i{display:block;height:100%;border-radius:3px;background:var(--k-sea,#155C75)}' +
    '.kc6{display:flex;gap:8px;align-items:flex-start}.kc6 i{flex:none;width:12px;height:12px;border-radius:50%;margin-top:5px;background:#9AA3A0}.kc6-ok i{background:#1E7B4F}.kc6-part i{background:#C98A00}.kc6-no i{background:#C2410C}.kc-dt label{display:inline-flex;align-items:center;gap:8px;min-height:44px;font-weight:600;cursor:pointer}.kc-dt input{width:20px;height:20px;accent-color:var(--k-sea,#155C75)}.kc-w:has(#kc-diff:checked) tr.kc-same{display:none}' +
    '.kc-rm{display:inline-grid;place-items:center;width:44px;height:44px;border:1px solid var(--line,#d5d3cc);border-radius:9px;text-decoration:none;margin-inline-start:6px;vertical-align:middle}.kc-vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}.kc-add{position:relative;max-width:560px;margin-top:18px}.kc-add label{display:block;font-weight:700;margin-bottom:6px}.kc-add input{width:100%;min-height:52px;border:2px solid var(--ink,#17212B);border-radius:12px;padding:0 14px;font:inherit;background:var(--paper,#fff);color:inherit}' +
    '.kc-add ul{position:absolute;inset-inline:0;top:100%;z-index:30;list-style:none;margin:4px 0 0;padding:4px;background:var(--card,#fff);border:1px solid var(--line,#d5d3cc);border-radius:12px;box-shadow:0 12px 30px rgba(23,33,43,.18);max-height:320px;overflow:auto}.kc-add li a{display:block;padding:10px;border-radius:8px;text-decoration:none;color:inherit}.kc-add li a:hover,.kc-add li a:focus{background:var(--concrete,#F1EFE9);outline:0}.kc-add small{display:block;color:var(--muted,#59626B)}.kc-few{font-weight:600;margin:20px 0}' +
    '.knx-s{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px}.knx-s a,.kc-cp{min-height:44px;display:inline-flex;align-items:center}.kc-cp{padding:0;border:0;background:none;color:inherit;font:inherit;text-decoration:underline;cursor:pointer}@media(max-width:640px){.kc{min-width:0}.kc thead{display:block}.kc thead tr{display:flex;flex-wrap:wrap;gap:6px 14px;padding:10px 12px;border-bottom:1px solid var(--line,#d5d3cc)}.kc thead th{display:flex;align-items:center;gap:2px;border:0;padding:0;font-size:.95rem}.kc thead th:first-child{display:none}.kc,.kc tbody,.kc tr{display:block}.kc tbody tr{padding:8px 0}.kc tbody th{display:block;width:auto;border:0;padding:8px 12px 2px}.kc td{display:block;border:0;padding:4px 12px}.kc td::before{content:attr(data-n);display:block;font-size:.78rem;color:var(--muted,#59626B)}.kc tbody td{border-inline-start:3px solid var(--line,#d5d3cc);margin:4px 12px;padding:2px 10px}}</style>' +
    '<script>' + KC_JS + '</script>';
  const canon = ORIGIN + P + '/compare/';
  const title = t26(lang, 'c_t') + (L.length ? ': ' + L.map(x => x.n).join(' / ') : '');
  const pg = { title: (title.length > 60 ? t26(lang, 'c_t') : title) + ' | Kolaboro', desc: t26(lang, 'c_d'), canon, body, noindex: true, alt: l => ORIGIN + pre(l) + '/compare/' + (L.length ? '?p=' + L.map(x => x.s).join(',') : ''),
    ld: { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebPage', name: t26(lang, 'c_t'), url: canon, inLanguage: lang, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + P + '/' }, { '@type': 'ListItem', position: 2, name: t26(lang, 'c_bc'), item: canon }] }] } };
  const sh = await shell(P + '/how-we-score/'); if (!sh || sh.status !== 200) return null;
  const html = await N.assemble(pg, lang, sh);
  return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300', 'x-robots-tag': 'noindex' } });
}
// suggestions as you type, from the public search index (names, developers, places); picking one adds it to the comparison
const KC_JS = "(function(){var B=document.querySelector('[data-kc]');if(!B)return;var M=JSON.parse(B.getAttribute('data-kc')),q=B.querySelector('input'),ul=B.querySelector('ul'),IX=null,P=null,act=-1;" +
  "function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^0-9a-z\\u0400-\\u04ff\\u0600-\\u06ff\\u4e00-\\u9fff]+/g,' ').trim();}" +
  "function load(){if(P)return P;P=fetch('/api/v1/search-index').then(function(r){return r.json();}).then(function(d){IX=(d.p||[]).filter(function(p){return M.cur.indexOf(p[0])<0;}).map(function(p){return{s:p[0],n:p[1],sub:[p[3],p[7]||p[5],p[6]].filter(Boolean).join(' \\u00b7 '),h:' '+norm(p[1]+' '+p[3]+' '+p[5]+' '+p[6]+' '+p[7])};});}).catch(function(){P=null;});return P;}" +
  "function close(){ul.hidden=true;q.setAttribute('aria-expanded','false');act=-1;}" +
  "function run(){var ws=norm(q.value).split(' ').filter(Boolean);if(!ws.length){close();return;}load().then(function(){if(!IX)return;var R=IX.filter(function(it){return ws.every(function(w){return it.h.indexOf(w)>=0;});}).sort(function(a,b){return(norm(a.n).indexOf(ws[0])===0?0:1)-(norm(b.n).indexOf(ws[0])===0?0:1)||a.n.length-b.n.length;}).slice(0,8);" +
  "ul.innerHTML='';R.forEach(function(it,i){var li=document.createElement('li'),a=document.createElement('a'),b=document.createElement('b'),s=document.createElement('small');li.setAttribute('role','option');li.id='kc-o'+i;a.href=M.pre+'/compare/?p='+M.cur.concat([it.s]).join(',');a.tabIndex=-1;b.textContent=it.n;s.textContent=it.sub;a.appendChild(b);a.appendChild(s);li.appendChild(a);ul.appendChild(li);});ul.hidden=!R.length;q.setAttribute('aria-expanded',R.length?'true':'false');act=-1;});}" +
  "var tm;q.addEventListener('input',function(){clearTimeout(tm);tm=setTimeout(run,80);});q.addEventListener('focus',load,{once:true});" +
  "q.addEventListener('keydown',function(e){var L=ul.querySelectorAll('li');if(e.key==='ArrowDown'||e.key==='ArrowUp'){if(!L.length)return;e.preventDefault();act=(act+(e.key==='ArrowDown'?1:-1)+L.length)%L.length;L.forEach(function(li,i){li.setAttribute('aria-selected',i===act?'true':'false');li.firstChild.style.background=i===act?'var(--concrete,#F1EFE9)':'';});q.setAttribute('aria-activedescendant','kc-o'+act);}" +
  "else if(e.key==='Enter'){var a=L[act>=0?act:0];if(a){e.preventDefault();location.href=a.firstChild.href;}}else if(e.key==='Escape')close();});" +
  "document.addEventListener('click',function(e){if(!B.contains(e.target))close();});" +
  "var dt=document.getElementById('kc-diff');if(dt)dt.addEventListener('change',function(){try{var u=new URL(location.href);if(dt.checked)u.searchParams.set('diff','1');else u.searchParams.delete('diff');history.replaceState(null,'',u);var c=document.querySelector('.kc-cp');if(c){var v=new URL(c.getAttribute('data-u'));if(dt.checked)v.searchParams.set('diff','1');else v.searchParams.delete('diff');c.setAttribute('data-u',v.href);}}catch(e){}});" +
  "var cp=document.querySelector('.kc-cp');if(cp)cp.addEventListener('click',function(){var o=document.querySelector('.kc-cpo'),u=cp.getAttribute('data-u'),ok=function(){o.textContent=cp.getAttribute('data-ok');setTimeout(function(){o.textContent='';},2500);};try{navigator.clipboard.writeText(u).then(ok,function(){prompt('',u);});}catch(e){prompt('',u);}});})();";

// ------------------------------------------------------------------------------------------------ routes
export const PATHS = /^\/api\/v1\/(?:facets|followers)$|^\/api\/x\/status\/pages\/?$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?compare\/?$/;
export async function handle(req, u, env, ctx, shell) {
  const p = u.pathname;
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  const cm = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?compare\/?$/);
  if (cm) {
    const lang = cm[1] || 'en';
    if (!u.searchParams.has('p') && lang === 'en') return null;   // English /compare/ without ?p= is the older id tool; n28b: other languages get the named page with its empty state instead of a 302 to English
    if (!p.endsWith('/')) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } });
    try { return await comparePage(req, u, env, ctx, shell, lang); } catch (e) { return null; }
  }
  try {
    if (p === '/api/v1/facets') { const lang = LANGS.includes(u.searchParams.get('lang')) ? u.searchParams.get('lang') : 'en'; return new Response(await facets(env, lang), { headers: { 'content-type': JT, 'cache-control': 'public, max-age=900', 'access-control-allow-origin': '*' } }); }
    if (p === '/api/v1/followers') return await followers(u, env, ctx);
    if (/^\/api\/x\/status\/pages\/?$/.test(p)) return await statusPages(env, ctx);
  } catch (e) { return jr({ error: 'unavailable' }, 503); }
  return null;
}
