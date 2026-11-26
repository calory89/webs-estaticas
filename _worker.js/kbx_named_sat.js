// kolaboro.com named project pages: construction progress from space (batch 14, f14b). No model calls.
// Data: /data/construction-progress.json, built monthly on main by .github/workflows/kolaboro-progress.yml
// (tools/kolaboro-landwatch/progress.py): per project with a plot-level pin in our records, a monthly Sentinel-2 L2A series
// (change index, built-up or bare share, surroundings) and one sprite of monthly true-colour thumbnails (/k/sat/proj/<id>.jpg,
// served from the satellite packs by kbsat.js). Shown with the developer's promised dates (/data/promises.json and the
// record's facts) on the same timeline. Server-rendered SVG, no client script. Projects without a series get no section.
import { BA_BTN_JS, baButton } from './kbx_n30a.js';   // n30a (batch 30): before/after slider over two dated images of the same sprite
import { spaceData, spaceHtml } from './kbx_space.js';   // n17b: Sentinel-1 radar and Overture buildings, same circle
import { stages, stageHtml, stageLabels } from './kbx_stage.js';   // n18b: construction stage estimate per month (rules), time machine labels
const ORIGIN = 'https://kolaboro.com';
let MEMO = null;
export async function satData(env) {
  if (!S.es) { let si = null; try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/media-i18n.json')); si = r.ok ? await r.json() : null; } catch (e) { si = null; } if (si && si.sat) { S = si.sat; TM = si.sat_TM || TM; } }   // n40 k4
  if (MEMO && Date.now() - MEMO.t < 600000) return MEMO.v;
  let r = null;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/construction-progress.json')); } catch (e) { r = null; }
  if (!r || !r.ok) { try { r = await fetch(ORIGIN + '/data/construction-progress.json', { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
  const v = r && r.ok ? await r.json().catch(() => null) : null;
  if (v) { try { v.space = await spaceData(env); } catch (e) { v.space = null; } }
  MEMO = { t: Date.now(), v }; return v;
}

let S = { en: {} };   // n40 k4: strings in 8 languages live in /data/media-i18n.json (sat)

const t = (lang, k, v) => { const s = (S[lang] && S[lang][k]) || S.en[k] || ''; return v && typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
export const satToc = lang => t(lang, 'toc');
export const satHeading = lang => t(lang, 'h');

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mi = s => { const m = String(s).match(/^(\d{4})-(\d{2})/); return m ? +m[1] * 12 + (+m[2] - 1) : null; };
const ym = i => Math.floor(i / 12) + '-' + String(i % 12 + 1).padStart(2, '0');
const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
// a promised date or period as [first month index, last month index]
function span(d) {
  const s = String(d || '').trim(); let m;
  if ((m = s.match(/^(\d{4})-Q([1-4])$/i))) { const a = +m[1] * 12 + (+m[2] - 1) * 3; return [a, a + 2]; }
  if ((m = s.match(/^(\d{4})-H([12])$/i))) { const a = +m[1] * 12 + (+m[2] - 1) * 6; return [a, a + 5]; }
  if ((m = s.match(/^(\d{4})-(\d{2})/))) { const a = +m[1] * 12 + (+m[2] - 1); return [a, a]; }
  if ((m = s.match(/^(\d{4})$/))) return [+m[1] * 12, +m[1] * 12 + 11];
  if ((m = s.match(/^(?:\d{1,2} )?([A-Za-z]{3})[a-z]* (\d{4})$/)) && MON[m[1].toLowerCase()]) { const a = +m[2] * 12 + MON[m[1].toLowerCase()] - 1; return [a, a]; }
  return null;
}

// milestones: promise tracker first (with earlier dates of moved promises), then the record's facts for kinds it lacks
export function milestones(prom, fx) {
  const out = [], seen = new Set();
  const add = (k, d, old) => { const sp = span(d); if (!sp) return; const key = k + '|' + sp[0] + '|' + sp[1]; if (seen.has(key)) return; seen.add(key); out.push({ k, d: String(d), a: sp[0], b: sp[1], old: !!old }); };
  for (const p of prom || []) { add(p.k, p.d, false); for (const h of p.hist || []) if (h.d && h.d !== p.d) add(p.k, h.d, true); }
  const has = k => out.some(o => o.k === k && !o.old);
  if (!has('construction_start') && fx.construction_start) add('construction_start', fx.construction_start, false);
  if (!has('handover') && fx.handover_promised) add('handover', fx.handover_promised, false);
  if (fx.original_handover && fx.original_handover !== fx.handover_promised) add('handover', fx.original_handover, true);
  return out;
}

const CSS = '<style id="ksat-css">.ksat{--ksat-t:76px}.ksat .ksat-sum{margin:0 0 4px;padding:0;list-style:none}.ksat .ksat-sum li{border-top:1px solid var(--k-line,var(--line));padding:10px 0;line-height:1.5}' +
  '.ksat figure{margin:18px 0 0;border:1px solid var(--k-line,var(--line));border-radius:var(--k-r-lg,14px);background:var(--k-surface,var(--card,#fff));padding:14px 14px 10px}.ksat figcaption{font-size:var(--k-fs-xs,.82rem);color:var(--k-muted,var(--muted));margin:8px 0 0;line-height:1.45}' +
  '.ksat-strip{display:flex;flex-direction:row-reverse;gap:6px;overflow-x:auto;margin:0;padding:0 0 8px;list-style:none;scroll-snap-type:x proximity;overscroll-behavior-x:contain}.ksat-strip li{flex:0 0 var(--ksat-t);scroll-snap-align:end;margin:0}' +
  '.ksat-tile{display:block;width:var(--ksat-t);height:var(--ksat-t);border-radius:var(--k-r-xs,4px);background-color:var(--k-sunken,#E8ECEA);background-repeat:no-repeat}.ksat-tile.is-none{background-image:repeating-linear-gradient(135deg,transparent 0 6px,color-mix(in srgb,var(--k-muted,#56636F) 18%,transparent) 6px 7px)}' +
  '.ksat-strip small{display:block;font-size:.72rem;line-height:1.25;color:var(--k-muted,var(--muted));margin-top:4px;font-variant-numeric:tabular-nums}.ksat-strip .is-none+small{color:var(--k-faint,var(--muted))}' +
  '.ksat-n{display:none}@media(max-width:560px){.ksat-w{display:none}.ksat-n{display:block}}.ksat-chart svg{display:block;width:100%;height:auto;overflow:visible}.ksat-chart .ax{stroke:var(--k-line,#D5DAD8);stroke-width:1}.ksat-chart .gl{stroke:var(--k-line,#D5DAD8);stroke-width:1;stroke-dasharray:2 4}.ksat-chart text{fill:var(--k-muted,#56636F);font-size:11px;font-variant-numeric:tabular-nums}' +
  '.ksat-chart .lx{fill:none;stroke:var(--k-sea,#155C75);stroke-width:2.2;stroke-linejoin:round}.ksat-chart .px{fill:var(--k-sea,#155C75)}.ksat-chart .band{fill:color-mix(in srgb,var(--k-sea,#155C75) 8%,transparent)}' +
  '.ksat-chart .ms{fill:color-mix(in srgb,var(--k-ink,#13222E) 9%,transparent)}.ksat-chart .ml{stroke:var(--k-ink,#13222E);stroke-width:1.5}.ksat-chart .mo{stroke:var(--k-muted,#56636F);stroke-width:1;stroke-dasharray:3 3}.ksat-chart .mt{fill:var(--k-ink,#13222E);font-size:11px;font-weight:600}.ksat-chart .mto{fill:var(--k-muted,#56636F);font-weight:500}' +
  '.ksat-lg{display:flex;flex-wrap:wrap;gap:6px 18px;margin:8px 0 0;padding:0;list-style:none;font-size:var(--k-fs-xs,.82rem);color:var(--k-ink-2,var(--ink))}.ksat-lg li{display:flex;align-items:flex-start;gap:8px;line-height:1.4}.ksat-lg i{display:inline-block;flex:0 0 20px;margin-top:.6em;width:20px;height:0;border-top:2.2px solid var(--k-sea,#155C75)}.ksat-lg i.b{height:12px;margin-top:.15em;border:0;background:color-mix(in srgb,var(--k-sea,#155C75) 14%,transparent)}.ksat-lg i.m{height:12px;width:12px;flex-basis:12px;margin-top:.15em;border:0;border-inline-start:1.5px solid var(--k-ink,#13222E);background:color-mix(in srgb,var(--k-ink,#13222E) 9%,transparent)}.ksat-lg i.o{width:0;flex-basis:12px;margin-top:.15em;height:12px;border:0;border-inline-start:1px dashed var(--k-muted,#56636F)}' +
  '.ksat-lim{margin:14px 0 0;font-size:var(--k-fs-sm,.92rem);color:var(--k-ink-2,var(--ink));line-height:1.55;max-width:72ch}.ksat-src{margin:8px 0 0;font-size:var(--k-fs-xs,.82rem);color:var(--k-muted,var(--muted))}.ksat details{margin:12px 0 0}.ksat details summary{cursor:pointer;min-height:44px;display:flex;align-items:center;font-weight:600}' +
  '@media(max-width:640px){.ksat{--ksat-t:64px}.ksat figure{padding:10px 10px 8px}}</style>';

// change index per month: (built-up or bare share of the circle minus that of the ring) minus the median of that difference over the first
// 3 clear months, in points. Season and haze move circle and ring together, so the difference is far steadier than either share alone
// (on our 125 series the single-month deviation in the first months has a median of 4 points and a 90th percentile of 15).
export const BAND = 15;
export function index(rec) {
  const d = rec.b.map((v, i) => v != null && rec.r[i] != null ? v - rec.r[i] : null), ok = d.map((v, i) => v == null ? -1 : i).filter(i => i >= 0);
  if (ok.length < 6) return null;
  const med = a => { const v = a.slice().sort((x, y) => x - y), h = v.length >> 1; return v.length % 2 ? v[h] : (v[h - 1] + v[h]) / 2; };
  const base = med(ok.slice(0, 3).map(i => d[i])), y = d.map(v => v == null ? null : Math.round(v - base));
  const last = ok.slice(-3);
  return { y, first: [ok[0], ok[2]], last: [last[0], last[2]], now: Math.round(med(last.map(i => d[i])) - base) };
}

function chart(rec, ix, ms, lang, fd, trk, W) {
  const m0 = mi(rec.m0), n = rec.n, last = m0 + n - 1;
  const future = ms.filter(o => !o.old).map(o => o.b);
  const end = Math.max(last + 1, Math.min(Math.max(last, ...future) + 2, last + 72));
  const lim = Math.max(30, Math.min(100, Math.ceil(Math.max(...ix.y.filter(v => v != null).map(Math.abs)) / 10) * 10 + 10));
  const narrow = W < 500, H = narrow ? 260 : 240, L = 34, R = 8, T = 34, B = 26, iw = W - L - R, ih = H - T - B;
  const X = i => L + (i - m0) / (end - m0) * iw, Y = v => T + ih / 2 - v / lim * ih / 2;
  let g = '<rect class="band" x="' + L + '" y="' + Y(BAND) + '" width="' + iw + '" height="' + (Y(-BAND) - Y(BAND)) + '"/>';
  for (const v of [-lim, -lim / 2, 0, lim / 2, lim]) g += '<line class="' + (v ? 'gl' : 'ax') + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/><text x="' + (L - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + (v > 0 ? '+' : '') + v + '</text>';
  const y0 = Math.floor(m0 / 12), y1 = Math.floor(end / 12), step = y1 - y0 > (narrow ? 4 : 6) ? 2 : 1;
  for (let y = y0 + 1; y <= y1; y += step) { const x = X(y * 12); if (x > L && x < W - R) g += '<line class="gl" x1="' + x + '" x2="' + x + '" y1="' + T + '" y2="' + (T + ih) + '"/><text x="' + x + '" y="' + (H - 8) + '" text-anchor="middle">' + y + '</text>'; }
  // milestones (behind the line); labels alternate between two rows when close
  const vis = ms.filter(o => o.b >= m0 && o.a <= end).sort((a, b) => a.a - b.a);
  const rows = [[], []], cw = 6.3;   // label extents per row; a label that fits neither row is left out (the shaded band keeps its tooltip)
  for (const o of vis) {
    const xa = X(Math.max(o.a, m0)), xb = X(Math.min(o.b + 1, end));
    if (o.b > o.a && !o.old) g += '<rect class="ms" x="' + xa.toFixed(1) + '" y="' + T + '" width="' + Math.max(2, xb - xa).toFixed(1) + '" height="' + ih + '"><title>' + esc(trk(o.k) + ': ' + fd(o.d)) + '</title></rect>';
    g += '<line class="' + (o.old ? 'mo' : 'ml') + '" x1="' + xa.toFixed(1) + '" x2="' + xa.toFixed(1) + '" y1="' + (T - 4) + '" y2="' + (T + ih) + '"><title>' + esc(trk(o.k) + ': ' + fd(o.d)) + '</title></line>';
    if (o.old) continue;
    const txt = ((t(lang, 'mk') || {})[o.k] || trk(o.k)) + ' ' + fd(o.d), tw = txt.length * cw;
    const anchor = xa + 4 + tw > W - R ? 'end' : 'start', x0 = anchor === 'end' ? xa - 4 - tw : xa + 4, x1 = x0 + tw;
    const r = rows.findIndex(rw => rw.every(([a, b]) => x1 + 6 < a || x0 > b + 6));
    if (r < 0) continue;
    rows[r].push([x0, x1]);
    g += '<text class="mt" x="' + (anchor === 'end' ? xa - 4 : xa + 4).toFixed(1) + '" y="' + (T - 8 - r * 13) + '" text-anchor="' + anchor + '">' + esc(txt) + '</text>';
  }
  // the line joins clear months across cloudy ones (each dot is a real month; cloudy months show in the strip and the table)
  const pts = []; for (let i = 0; i < n; i++) if (ix.y[i] != null) pts.push([X(m0 + i + 0.5), Y(ix.y[i]), i]);
  g += '<path class="lx" d="M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + '"/>';
  for (const [x, y, i] of pts) g += '<circle class="px" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.6"><title>' + esc(fd(ym(m0 + i)) + ': ' + (ix.y[i] > 0 ? '+' : '') + ix.y[i]) + '</title></circle>';
  const after = ms.filter(o => o.a > end && !o.old);
  return { svg: '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t(lang, 'aria', { a: fd(rec.m0), b: fd(ym(last)) })) + '">' + g + '</svg>', after };
}

// n18b: time machine (slider over the real monthly thumbnails of the sprite, drawn on a canvas, image loaded only near the viewport)
let TM = { en: {} };   // n40 k4: strings in 8 languages live in /data/media-i18n.json (sat_TM)

const tt = (lang, k, v) => { const s = (TM[lang] && TM[lang][k]) || TM.en[k] || ''; return v ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
const TM_CSS = '<style id="ktm-css">.ktm{margin:18px 0 0;border:1px solid var(--k-line,var(--line));border-radius:var(--k-r-lg,14px);background:var(--k-surface,var(--card,#fff));padding:14px 14px 10px}.ktm h3{margin:0 0 10px;font-size:var(--k-fs-lg,1.2rem)}' +
  '.ktm-v{display:flex;justify-content:center}.ktm canvas{display:block;width:min(384px,100%);height:auto;aspect-ratio:1;border-radius:var(--k-r-sm,6px);background:var(--k-sunken,#E8ECEA)}' +
  '.ktm-c{display:flex;align-items:center;gap:12px;margin:12px auto 0;max-width:520px}.ktm-c input{flex:1 1 auto;min-width:0;min-height:44px;accent-color:var(--k-sea,#155C75)}.ktm-c button{flex:0 0 auto;min-width:96px;min-height:44px}' +
  '.ktm-o{margin:6px 0 0;text-align:center;font-variant-numeric:tabular-nums;line-height:1.45}.ktm-o b{font-size:var(--k-fs-lg,1.15rem)}.ktm-o span{display:block;font-size:var(--k-fs-sm,.92rem);color:var(--k-muted,var(--muted))}.ktm-o i{display:block;font-style:normal;font-weight:600;color:var(--k-ink-2,var(--ink))}' +
  '.ktm-g{margin:10px 0 0;text-align:center}.ktm-g>.k-btn{min-height:44px}.ktm-gout{text-align:start}.ktm figcaption{font-size:var(--k-fs-xs,.82rem);color:var(--k-muted,var(--muted));margin:8px 0 0;line-height:1.45}.ksat-strip.is-on .ksat-tile:not(.is-none){background-image:var(--ksat-u)}</style>';
const TM_JS = "(function(){var f=document.getElementById('ktm');if(!f||!f.nextElementSibling)return;var d;try{d=JSON.parse(f.nextElementSibling.textContent)}catch(e){return}" +
  "var n=d.length,c=f.querySelector('canvas'),x=c.getContext('2d'),r=f.querySelector('input'),b=f.querySelector('button'),o=f.querySelector('.ktm-o'),im=null,tm=null,cur=n-1,T=+f.getAttribute('data-t')||96;" +
  "function draw(){if(!im||!im.complete||!im.naturalWidth)return;var k=d[cur][3];x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(im,k*T,0,T,T,0,0,c.width,c.height)}" +
  "function show(i){cur=i;var e=d[i];o.children[0].textContent=e[0];o.children[1].textContent=e[1];o.children[2].textContent=e[2]||'';o.children[2].hidden=!e[2];c.setAttribute('aria-label',e[4]);r.setAttribute('aria-valuetext',e[0]+(e[2]?', '+e[2]:''));draw()}" +
  "function stop(){if(tm){clearInterval(tm);tm=null;b.textContent=b.getAttribute('data-play')}}" +
  "r.addEventListener('input',function(){stop();show(+r.value)});" +
  "b.addEventListener('click',function(){if(tm){stop();return}var i=+r.value;if(i>=n-1)i=-1;b.textContent=b.getAttribute('data-pause');tm=setInterval(function(){i++;if(i>=n){stop();return}r.value=i;show(i)},650)});" +
  "function on(){if(im)return;im=new Image();im.decoding='async';im.onload=draw;im.src=f.getAttribute('data-u');var st=document.querySelector('.ksat-strip');if(st)st.classList.add('is-on')}" +
  "var gb=f.querySelector('[data-gif]');if(gb)gb.addEventListener('click',function(){var out=f.querySelector('.ktm-gout');stop();on();gb.disabled=true;function go(){var L=JSON.parse(gb.getAttribute('data-l'));var fr=d.map(function(e){return{img:im,sx:e[3]*T,sy:0,sw:T,sh:T,date:e[0]}});window.KTL.make(out,{frames:fr,credit:'Contains modified Copernicus Sentinel data '+f.getAttribute('data-y'),url:location.origin+location.pathname+'#ktm',filename:(location.pathname.split('/').filter(Boolean).pop()||'site')+'-from-space.gif',title:document.title.split(' | ')[0],L:L}).then(function(){gb.disabled=false})}function ready(){if(im&&im.complete&&im.naturalWidth)go();else if(im)im.addEventListener('load',go,{once:true})}if(window.KTL)ready();else{var sc=document.createElement('script');sc.src='/k/tlgif.js?v=1';sc.onload=ready;sc.onerror=function(){gb.disabled=false};document.head.appendChild(sc)}});f.hidden=false;show(n-1);if('IntersectionObserver'in window){var io=new IntersectionObserver(function(e){for(var j=0;j<e.length;j++)if(e[j].isIntersecting){on();io.disconnect();break}},{rootMargin:'800px 0px'});io.observe(f)}else on()" + BA_BTN_JS + "})();";
function timeMachine(rec, months, lang, fd, img, labels) {
  const ix = []; for (let i = 0; i < rec.n; i++) if (rec.f[i] >= 0) ix.push(i);
  if (ix.length < 2) return '';
  const d = ix.map(i => { const dd = fd(rec.dt[i] || months[i]); return [fd(months[i]), tt(lang, 'scene', { d: dd }), labels[months[i]] ? tt(lang, 'est', { s: labels[months[i]] }) : '', rec.f[i], tt(lang, 'alt', { d: dd })]; });
  const cap = tt(lang, 'cap', { k: ix.length, n: rec.n, a: fd(months[0]), b: fd(months[rec.n - 1]) });
  const yy = String(rec.dt[ix[0]] || months[ix[0]]).slice(0, 4), yz = String(rec.dt[ix[ix.length - 1]] || months[ix[ix.length - 1]]).slice(0, 4);
  return '<figure class="ktm" id="ktm" hidden data-u="' + esc(img) + '" data-t="96" data-y="' + esc(yy === yz ? yy : yy + '-' + yz) + '"><h3>' + esc(tt(lang, 'h')) + '</h3><div class="ktm-v" dir="ltr"><canvas width="384" height="384" role="img" aria-label=""></canvas></div>' +
    '<div class="ktm-c" dir="ltr"><button type="button" class="k-btn k-btn--sm" data-play="' + esc(tt(lang, 'play')) + '" data-pause="' + esc(tt(lang, 'pause')) + '">' + esc(tt(lang, 'play')) + '</button><input type="range" min="0" max="' + (d.length - 1) + '" step="1" value="' + (d.length - 1) + '" aria-label="' + esc(tt(lang, 'lab')) + '"></div>' +
    '<p class="ktm-o" aria-live="polite"><b></b><span></span><i></i></p><figcaption>' + esc(cap) + '</figcaption>' +
    '<div class="ktm-g">' + baButton(lang) + ' <button type="button" class="k-btn k-btn--sm k-btn--ghost" data-gif data-l="' + esc(JSON.stringify({ making: tt(lang, 'making'), ready: tt(lang, 'ready'), share: tt(lang, 'share'), dl: tt(lang, 'dl'), copy: tt(lang, 'copy'), copied: tt(lang, 'copied'), note: tt(lang, 'note'), fail: tt(lang, 'fail') })) + '">' + esc(tt(lang, 'gif')) + '</button><div class="ktm-gout" hidden></div></div></figure>' +
    '<script type="application/json">' + JSON.stringify(d).replace(/</g, '\\u003c') + '</script><script>' + TM_JS + '</script>';
}

// rec: one project from construction-progress.json; meta: the whole file. trk(kind) = translated milestone kind, fd(date) = display date.
export function satSection(meta, id, prom, fx, lang, fd, trk, tl) {   // tl(date): the tile's accessible name with the project name (s15a)
  const rec = meta && meta.projects && meta.projects[id];
  if (!rec || !rec.n || !rec.m0) return '';
  const m0 = mi(rec.m0), n = rec.n, months = Array.from({ length: n }, (_, i) => ym(m0 + i));
  const clearN = rec.c.filter(v => v != null).length;
  const srcLine = '<p class="ksat-src">' + esc(meta.source.attribution) + '. <a class="src" href="' + esc(meta.source.url) + '" rel="noopener" target="_blank">Copernicus Sentinel-2 L2A, AWS Open Data</a> <a class="src" href="/data/construction-progress.json">' + esc(t(lang, 'method')) + ', ' + esc(t(lang, 'upd', { d: fd(meta.updated) })) + '</a></p>';
  let sum = '<ul class="ksat-sum"><li>' + esc(t(lang, 'clear', { c: clearN, n })) + '</li>';
  const ix = index(rec);
  if (ix) {
    const sg = v => (v > 0 ? '+' : '') + v;
    sum += '<li><b>' + esc(t(lang, Math.abs(ix.now) >= BAND ? 'vis' : 'novis', { base: fd(months[ix.first[0]]) })) + ' </b>' + esc(t(lang, 'xl', { a: fd(months[ix.last[0]]), b: fd(months[ix.last[1]]), x: sg(ix.now) })) + '</li>';
    if (rec.sum && rec.sum.b_first != null && rec.sum.b_last != null) sum += '<li>' + esc(t(lang, 'bl', { b1: Math.round(rec.sum.b_first), b2: Math.round(rec.sum.b_last), r1: rec.sum.r_first == null ? '-' : Math.round(rec.sum.r_first), r2: rec.sum.r_last == null ? '-' : Math.round(rec.sum.r_last) })) + '</li>';
  } else sum += '<li>' + esc(t(lang, clearN ? 'few' : 'none', { c: clearN, n })) + '</li>';
  sum += '</ul>';
  const msAll = milestones(prom, fx || {});
  const est = stages(rec, ix, meta.space && meta.space.radar, meta.space && meta.space.bld, msAll, id);   // n18b
  let tmach = '';
  // strip: every month, newest first in the DOM; row-reverse shows them oldest-to-newest and starts scrolled to the newest
  let strip = '';
  if (rec.frames && rec.v) {
    const img = '/k/sat/proj/' + encodeURIComponent(id) + '.jpg?v=' + encodeURIComponent(rec.v);
    const li = [];
    for (let i = n - 1; i >= 0; i--) {
      const f = rec.f[i], lab = esc(fd(months[i]));
      li.push(f >= 0 ? '<li><span class="ksat-tile" role="img" aria-label="' + esc(tl ? tl(fd(rec.dt[i] || months[i])) : 'Sentinel-2, ' + fd(rec.dt[i] || months[i])) + '" style="background-size:calc(var(--ksat-t) * ' + rec.frames + ') var(--ksat-t);background-position:calc(var(--ksat-t) * -' + f + ') 0"></span><small>' + lab + '</small></li>'
        : '<li><span class="ksat-tile is-none" role="img" aria-label="' + lab + ': ' + esc(t(lang, 'cloudy')) + '"></span><small>' + lab + '</small></li>');
    }
    // n18b: the sprite loads only when the section comes near the viewport (TM_JS adds is-on); without script, noscript shows it
    strip = '<figure dir="ltr"><ol class="ksat-strip" tabindex="0" style="--ksat-u:url(' + img + ')">' + li.join('') + '</ol><noscript><style>.ksat-strip .ksat-tile:not(.is-none){background-image:var(--ksat-u)}</style></noscript><figcaption>' + esc(t(lang, 'strip')) + '</figcaption></figure>';
    tmach = timeMachine(rec, months, lang, fd, img, stageLabels(est, lang));
    if (!tmach) strip = strip.replace('class="ksat-strip"', 'class="ksat-strip is-on"');
  }
  let ch = '';
  if (ix) {
    const ms = milestones(prom, fx || {}), c = chart(rec, ix, ms, lang, fd, trk, 720), cn = chart(rec, ix, ms, lang, fd, trk, 360);
    const hasOld = ms.some(o => o.old);
    ch = '<figure class="ksat-chart"><div dir="ltr" class="ksat-w">' + c.svg + '</div><div dir="ltr" class="ksat-n">' + cn.svg + '</div><ul class="ksat-lg"><li><i></i>' + esc(t(lang, 'lx')) + '</li><li><i class="b"></i>' + esc(t(lang, 'lb')) + '</li>' + (ms.length ? '<li><i class="m"></i>' + esc(t(lang, 'lm')) + '</li>' : '') + (hasOld ? '<li><i class="o"></i>' + esc(t(lang, 'lo')) + '</li>' : '') + '</ul>' +
      (c.after.length ? '<figcaption>' + c.after.map(o => esc(trk(o.k) + ': ' + fd(o.d) + ' (' + t(lang, 'later') + ')')).join('; ') + '</figcaption>' : '') + '</figure>';
  }
  const th = t(lang, 'th'), pc = v => v == null ? '' : v + '%', pt = v => v == null ? '' : (v > 0 ? '+' : '') + v;
  const rows = months.map((m, i) => '<tr><td>' + esc(fd(m)) + '</td><td>' + esc(rec.dt[i] ? fd(rec.dt[i]) : t(lang, 'cloudy')) + '</td><td>' + pc(rec.c[i]) + '</td><td>' + pc(rec.b[i]) + '</td><td>' + pc(rec.r[i]) + '</td><td>' + (ix ? pt(ix.y[i]) : '') + '</td></tr>').reverse().join('');
  const table = clearN ? '<details><summary>' + esc(t(lang, 'tbl')) + '</summary><div class="tw"><table><thead><tr>' + th.map(h => '<th>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div></details>' : '';
  const spc = meta.space ? spaceHtml(meta.space, id, lang, fd, milestones(prom, fx || {}), { cloudy: n - clearN, n }) : '';
  const stg = stageHtml(est, lang, fd, id);
  return CSS + (strip ? TM_CSS : '') + '<div class="ksat"><p class="ki">' + esc(t(lang, 'intro')) + '</p>' + sum + tmach + ch + strip + '<p class="ksat-lim">' + esc(t(lang, 'lim')) + '</p>' + srcLine + table + spc + stg + '</div>';
}

// n29p (batch 29, item 13): the change verdict of the section in one sentence, for the line under the quick answer
// ('' when the series is too short to say). Same index and band as the section, so the two never disagree.
export function satLine(meta, id, lang, fd) {
  const rec = meta && meta.projects && meta.projects[id];
  if (!rec || !rec.n || !rec.m0) return '';
  const ix = index(rec); if (!ix) return '';
  const m0 = mi(rec.m0);
  return t(lang, Math.abs(ix.now) >= BAND ? 'vis' : 'novis', { base: fd(ym(m0 + ix.first[0])) });
}
