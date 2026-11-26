// comments: _notes/kolaboro-worker-comments.txt
import { S, C } from './kbx_n31d_i18n.js';
import { t27 } from './kbx_u27.js';
import { index as satIndex, BAND as SAT_BAND } from './kbx_named_sat.js';
import { TB } from './kbx_strings.js';
export const N31V = 'd1';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const pre = l => l === 'en' ? '' : '/' + l;
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bdi = (lang, s) => lang === 'ar' ? '<bdi>' + esc(s) + '</bdi>' : esc(s);
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const nf = (n, lang, d) => { try { return Number(n).toLocaleString(LOC[lang] || 'en-GB', { maximumFractionDigits: d == null ? 0 : d }); } catch (e) { return String(n); } };
export const t31 = (lang, k, v) => { let s = (S[lang] && S[lang][k] != null) ? S[lang][k] : S.en[k]; if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b); return s; };
const SEP = { zh: '、', ar: '، ' };
const low = (lang, s) => /^(en|es|fr|nl|ru)$/.test(lang) ? s.charAt(0).toLocaleLowerCase(LOC[lang]) + s.slice(1) : s;
export function knownLine(lang, L6) {
const k = [], u = [];
for (const [key, , s] of L6) (s[0] === 'ok' || s[0] === 'part' || s[1] === 'd_past' ? k : u).push(low(lang, t27(lang, 'lt_' + key)));
const j = a => a.join(SEP[lang] || ', ');
return '<p class="k31q"><b class="kans-l">' + esc(t31(lang, 'q_lbl')) + '</b> ' + esc(t31(lang, 'known', { a: k.length ? j(k) : t31(lang, 'none_k') })) + (u.length ? ' ' + esc(t31(lang, 'unknown', { b: j(u) })) : '') + '</p>';
}
export const nrNote = lang => '<p class="k31nr" role="note"><b>' + esc(t31(lang, 'nr_h')) + '</b> ' + esc(t31(lang, 'nr_t')) + ' <a href="' + pre(lang) + '/how-we-work/">' + esc(t31(lang, 'nr_l')) + '</a></p>';
export function askHtml(lang, o) {
const Q = [], st = {}; for (const [key, , s] of o.L6) st[key] = s;
const n = o.n, h = o.h;
if (st.permit && st.permit[0] !== 'ok') Q.push(t31(lang, 'a_permit', { n }));
if (st.company && st.company[0] !== 'ok') Q.push(t31(lang, 'a_co'));
const d = st.date || [];
Q.push(d[1] === 'd_past' ? t31(lang, 'a_late', { h }) : d[0] === 'part' ? t31(lang, 'a_moved') : h && d[0] === 'ok' ? t31(lang, 'a_date1', { h }) : t31(lang, 'a_date0'));
if (o.escrow !== true) Q.push(t31(lang, 'a_escrow'));
if (st.build && (st.build[0] === 'nc' || st.build[0] === 'part')) Q.push(t31(lang, 'a_build'));
if (!o.price) Q.push(t31(lang, 'a_price'));
Q.push(t31(lang, 'a_title'));
return '<ol>' + Q.slice(0, 5).map(q => '<li>' + esc(q) + '</li>').join('') + TB.kbx_n31d__t.k0 + encodeURIComponent(o.id) + '" data-k31as>' + esc(t31(lang, 'ask_b')) + '</a>' +
(o.s ? ' · <a href="' + (lang === 'en' ? '' : '/' + lang) + '/projects/' + o.s + '/questions/" rel="nofollow">' + esc(TB.kbx_n31d__t.o_ASK34[lang] || TB.kbx_n31d__t.o_ASK34.en) + '</a>' : '') + '</p>';
}
const R = 6371, rad = d => d * Math.PI / 180;
const km = (a, b, c, d) => 2 * R * Math.asin(Math.sqrt(Math.sin(rad(c - a) / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(rad(d - b) / 2) ** 2));
export function closest3(ix, x) {
const f = x.fx || {}; if (typeof f.lat !== 'number' || typeof f.lng !== 'number') return [];
return ix.P.filter(o => o !== x && o.mk === x.mk && o.fx && typeof o.fx.lat === 'number' && typeof o.fx.lng === 'number' && !(o.fx.lat === f.lat && o.fx.lng === f.lng))
.map(o => ({ o, k: km(f.lat, f.lng, o.fx.lat, o.fx.lng) })).filter(r => r.k <= 25).sort((a, b) => a.k - b.k).slice(0, 3);
}
export function cl3Html(lang, x, L) {
if (!L.length) return '';
const list = L.map(r => '<a href="' + pre(lang) + '/projects/' + r.o.s + '/">' + bdi(lang, r.o.n) + '</a> (' + esc(t31(lang, 'km', { k: nf(r.k, lang, r.k < 10 ? 1 : 0) })) + ')').join(SEP[lang] || ', ');
return '<p>' + esc(t31(lang, 'cl3', { list: '\u0000' })).replace('\u0000', list) + ' <a href="' + pre(lang) + '/compare/?p=' + [x.s].concat(L.map(r => r.o.s)).join(',') + '" rel="nofollow">' + esc(t31(lang, 'cl3_c')) + '</a></p>';
}
export function devLate(lang, ix, x, overdueOf, devRel) {
if (!devRel || !x.dvs || !ix.devs.has(x.dvs)) return '';
const ids = ix.devs.get(x.dvs).ids, t = ids.length; if (t < 2) return '';
const k = ids.map(i => ix.byId.get(i)).filter(o => o && overdueOf(ix, o)).length, dev = x.dv;
const txt = k === 0 ? t31(lang, 'dl_late0', { t: nf(t, lang), dev }) : k === 1 ? t31(lang, 'dl_late1', { t: nf(t, lang), dev }) : t31(lang, 'dl_late', { k: nf(k, lang), t: nf(t, lang), dev });
return '<li>' + bdi(lang, txt).replace(/^<bdi>|<\/bdi>$/g, '') + (k ? ' <a href="' + devRel + '#promised">' + esc(t31(lang, 'dl_l', { dev })) + '</a>' : '') + '</li>';
}
export function shareText(lang, o) {
const P = [o.h ? t31(lang, 'sh_h', { h: o.h }) : t31(lang, 'sh_h0'), o.pn ? t31(lang, 'sh_p') : t31(lang, 'sh_p0')];
if (o.s != null) P.push(t31(lang, 'sh_s', { s: o.s }));
return o.n + (o.place ? ' (' + o.place + ')' : '') + ': ' + P.join(SEP[lang] || ', ') + '. ' + t31(lang, 'sh_end');
}
export function tyTable(lang, x, ppm, med, mkL) {
const f = x.fx || {}; if (ppm == null || !f.currency) return '';
const cur = String(f.currency).toUpperCase(), sz = nf(f.size_min_m2, lang) + (f.size_max_m2 && f.size_max_m2 !== f.size_min_m2 ? ' - ' + nf(f.size_max_m2, lang) : '') + ' m²';
const th = k => '<th scope="col">' + esc(k) + '</th>';
return '<div class="tw"><table><thead><tr>' + th(t31(lang, 'ty_types')) + th(t31(lang, 'ty_size')) + th(t31(lang, 'ty_price')) + th(t31(lang, 'ty_ppm')) + (med ? th(t31(lang, 'ty_med', { mk: mkL })) : '') + TB.kbx_n31d__t.k1 + esc((f.unit_types || []).join(', ') || '-') + '</td><td>' + esc(sz) + '</td><td><bdi dir="ltr">' + esc(cur + ' ' + nf(f.price_min, lang)) + '</bdi></td><td><bdi dir="ltr">' + esc(cur + ' ' + nf(Math.round(ppm), lang)) + '</bdi></td>' +
(med ? '<td><bdi dir="ltr">' + esc(cur + ' ' + nf(Math.round(med.m), lang)) + '</bdi></td>' : '') + TB.kbx_n31d__t.k2 + esc(t31(lang, 'ty_note', { k: med ? nf(med.n, lang) : '0', mk: mkL })) + '</p>';
}
export function staticMap(lang, lat, lng, name) {
if (typeof lat !== 'number' || typeof lng !== 'number' || Math.abs(lat) > 85) return '';
const z = 15, n = 2 ** z, fx = (lng + 180) / 360 * n, fy = (1 - Math.log(Math.tan(rad(lat)) + 1 / Math.cos(rad(lat))) / Math.PI) / 2 * n;
const tx = Math.floor(fx - 0.5), ty = Math.floor(fy - 0.5), px = (fx - tx) / 2 * 100, py = (fy - ty) / 2 * 100;
const img = (x, y) => '<img src="https://tile.openstreetmap.org/' + z + '/' + ((x % n) + n) % n + '/' + y + '.png" width="256" height="256" alt="" loading="lazy">';
return TB.kbx_n31d__t.k3 + esc(t31(lang, 'map_alt', { n: name })) + '">' + img(tx, ty) + img(tx + 1, ty) + img(tx, ty + 1) + img(tx + 1, ty + 1) +
'<i style="left:' + px.toFixed(1) + '%;top:' + py.toFixed(1) + '%"></i></div><p class="k-small">' + esc(t31(lang, 'map_c')) + '</p>';
}
export function satBa(lang, meta, id) {
const rec = meta && meta.projects && meta.projects[id]; if (!rec || !rec.n || !rec.m0) return '';
let I = null; try { I = satIndex(rec); } catch (e) { I = null; }
return I && Math.abs(I.now) >= SAT_BAND ? ' <a href="#space" data-n31ba>' + esc(t31(lang, 'ba')) + '</a>' : '';
}
export const vsHead = lang => '<tr><th scope="col">' + esc(t31(lang, 'vs_a')) + '</th><th scope="col">' + esc(t31(lang, 'vs_b')) + '</th></tr>';
export const CSS31 = '<style id="k31-css">.kp .kupd{font-size:1.1rem;font-weight:700;color:var(--ink)}.k31q{margin:0;font-weight:600}.k31q b{display:block}#answer .klt{margin:10px 0 12px}.k31nr{margin:14px 0 0;padding:8px 12px;font-size:.9rem;border:1px dashed var(--line);border-radius:12px;max-width:80ch}' +
'.k31m{position:relative;display:grid;grid-template-columns:1fr 1fr;width:min(100%,384px);overflow:hidden;border-radius:12px;direction:ltr}.k31m img{width:100%;height:auto}.k31m i{position:absolute;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:#B3261E;border:3px solid #fff}@media(max-width:640px){.kp .lead{display:none}}</style>';
export const LOADER = "(function(){if(!document.getElementById('checks6')||!document.getElementById('sources')||!/\\/projects\\/[a-z0-9-]+\\/$/.test(location.pathname))return;var go=function(){var s=document.createElement('script');s.src='/k/n31d.js?l='+(document.documentElement.lang||'en').slice(0,2)+'&v=" + N31V + "';s.async=true;document.head.appendChild(s);};var idle=function(){if(window.requestIdleCallback)requestIdleCallback(go,{timeout:2500});else setTimeout(go,600);};if(document.readyState==='complete')idle();else addEventListener('load',idle);})();";
const CLIENT = function (M, LG) {
  var d = document, ls = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var el = function (t, c, x) { var e = d.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  var f = function (k, v) { var s = M[k] || ''; if (v) for (var a in v) s = s.split('{' + a + '}').join(v[a]); return s; };
  var LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' }[LG] || 'en-GB';
  var nf = function (n, dg) { try { return Number(n).toLocaleString(LOC, { maximumFractionDigits: dg == null ? 2 : dg }); } catch (e) { return String(n); } };
  var P = LG === 'en' ? '' : '/' + LG, sm = /\/projects\/([a-z0-9-]+)\/$/.exec(location.pathname), SLUG = sm ? sm[1] : '';
  var LT = d.querySelector('[data-u27]'), D = {}; try { D = JSON.parse(LT.getAttribute('data-u27')) || {}; } catch (e) { D = {}; }
  var st = el('style'); st.textContent = '.k31b{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 12px;border:1px solid var(--line,#d5d3cc);border-radius:10px;background:none;color:inherit;font:inherit;cursor:pointer}.k31b:focus-visible{outline:3px solid var(--k-sea,#155C75);outline-offset:2px}' +
    '.k31x{max-height:480px;overflow:auto;margin:10px 0;border:1px solid var(--line,#d5d3cc);border-radius:10px}.k31x table{width:100%;border-collapse:collapse;font-size:.84rem}.k31x td,.k31x th{padding:6px 10px;border-bottom:1px solid var(--line,#d5d3cc);text-align:start;vertical-align:top;word-break:break-word}.k31x td:first-child{font-family:ui-monospace,monospace;white-space:nowrap;color:var(--ink-2)}' +
    '.k31fx{margin:10px 0 14px;padding:12px 14px;border:1px solid var(--line,#d5d3cc);border-radius:12px}.k31fx h3{margin:0 0 6px;font-size:1rem}.k31fx p{margin:4px 0}.k31tl{margin:0 0 14px}.k31map{height:340px;margin:10px 0;border-radius:12px;border:1px solid var(--line,#d5d3cc)}' +
    '@media print{html.k31a4 .kwrap,html.k31a4 .kwatch,html.k31a4 .kfeeds,html.k31a4 .klt-k,html.k31a4 .kans-u,html.k31a4 .ship,html.k31a4 header,html.k31a4 footer,html.k31a4 .k31b,html.k31a4 #cc,html.k31a4 .lead{display:none!important}html.k31a4 body{font-size:9.5pt}html.k31a4 .kp h1{font-size:17pt!important}html.k31a4 .kans{padding:8px 10px!important;margin-top:8px!important}html.k31a4 .klt-l a{padding:4px 8px!important}html.k31a4 .kfs{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:2px 14px;font-size:8.5pt}html.k31a4 .kfs .kf{padding:2px 0!important;border:0!important}html.k31a4 .kfs small,html.k31a4 .kz-kf>summary,html.k31a4 a.src{display:none!important}html.k31a4 .kans-t{font-size:9pt}html.k31a4 .phero::after{content:attr(data-k31u);display:block;margin-top:8px;font-size:8pt}@page{size:A4;margin:12mm}}';
  d.head.appendChild(st);

  // 155: listen to the quick answer (the browser's own voices; nothing leaves the device)
  var A = d.getElementById('answer'), U = A && A.querySelector('.kans-u');
  if (A && U && 'speechSynthesis' in window && window.SpeechSynthesisUtterance) {
    var sp = el('span'), lb = el('button', 'k31b', '▶ ' + f('listen')); lb.type = 'button'; sp.appendChild(lb); U.insertBefore(sp, U.firstChild);
    lb.addEventListener('click', function () {
      var S2 = window.speechSynthesis; if (S2.speaking) { S2.cancel(); return; }
      var q = A.querySelector('.k31q'), t = A.querySelector('.kans-t'), txt = ((q ? q.textContent : '') + ' ' + (t ? t.textContent : '')).replace(/\s+/g, ' ').trim();
      var u = new SpeechSynthesisUtterance(txt); u.lang = LOC; var vs = S2.getVoices().filter(function (v) { return v.lang && v.lang.slice(0, 2) === LG; }); if (vs.length) u.voice = vs[0];
      u.onend = u.onerror = function () { lb.textContent = '▶ ' + f('listen'); }; lb.textContent = '■ ' + f('stop'); S2.speak(u);
    });
  }

  // 142: one-page A4 summary (the top of the page only: quick answer, six checks, key facts; the link to the live page at the foot)
  var NX = d.querySelector('#next .knx-a');
  if (NX) {
    var li = el('li'), pb = el('button', null); pb.type = 'button'; var ic = el('span', null, '⎙'); ic.setAttribute('aria-hidden', 'true'); pb.appendChild(ic); pb.appendChild(el('span', null, f('a4'))); li.appendChild(pb); NX.appendChild(li);
    pb.addEventListener('click', function () {
      var H = d.documentElement, kf = d.querySelector('.kz-kf'), was = kf && kf.open, hero = d.querySelector('.phero.kp'); if (hero) hero.setAttribute('data-k31u', location.href.split('#')[0]);
      H.classList.add('k31a4'); if (kf) kf.open = true;
      var done = function () { H.classList.remove('k31a4'); if (kf) kf.open = was; removeEventListener('afterprint', done); }; addEventListener('afterprint', done);
      setTimeout(function () { window.print(); }, 50);
    });
  }

  // 153: expert mode: every field of the open record as path and value, links kept, plus the raw JSON
  var SR = d.querySelector('#sources .kz-d') || d.getElementById('sources');
  if (SR && SLUG) {
    var xb = el('button', 'k31b', f('ex')); xb.type = 'button'; xb.setAttribute('aria-expanded', 'false'); var xp = el('p'); xp.appendChild(xb); SR.appendChild(xp); var box = null;
    xb.addEventListener('click', function () {
      if (box) { box.hidden = !box.hidden; xb.setAttribute('aria-expanded', box.hidden ? 'false' : 'true'); return; }
      box = el('div', 'k31x', f('ld')); xp.parentNode.insertBefore(box, xp.nextSibling); xb.setAttribute('aria-expanded', 'true');
      var api = '/api/v1/projects/' + SLUG;
      fetch(api).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
        if (!j) { box.textContent = f('err'); return; }
        var rows = [], walk = function (v, p) { if (v && typeof v === 'object') { var ks = Object.keys(v); if (!ks.length) rows.push([p, Array.isArray(v) ? '[]' : '{}']); ks.forEach(function (k) { walk(v[k], p ? p + (Array.isArray(v) ? '[' + k + ']' : '.' + k) : k); }); } else rows.push([p, v == null ? 'null' : String(v)]); };
        walk(j, ''); box.textContent = '';
        var tb = el('table'), th = el('thead'), tr = el('tr'); tr.appendChild(el('th', null, f('ex_f'))); tr.appendChild(el('th', null, f('ex_v'))); th.appendChild(tr); tb.appendChild(th); var bd = el('tbody');
        rows.forEach(function (r) { var t2 = el('tr'), a = el('td', null, r[0]), b = el('td'); b.setAttribute('dir', 'ltr'); if (/^https?:\/\//.test(r[1])) { var l = el('a', null, r[1]); l.href = r[1]; if (!/^https:\/\/kolaboro\.com\//.test(r[1])) { l.rel = 'nofollow noopener'; l.target = '_blank'; } b.appendChild(l); } else b.textContent = r[1]; t2.appendChild(a); t2.appendChild(b); bd.appendChild(t2); });
        tb.appendChild(bd); box.appendChild(tb); var rp = el('p'), ra = el('a', null, f('ex_raw') + ' (' + rows.length + ')'); ra.href = api; rp.appendChild(ra); box.parentNode.insertBefore(rp, box.nextSibling);
      }).catch(function () { box.textContent = f('err'); });
    });
  }

  // 141: currency risk for the reader's currency: the range of the project currency over 5 years (ECB reference rates, AED from the peg)
  var ECB = ['USD', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'THB', 'IDR', 'MYR', 'PHP', 'MXN', 'TRY', 'SGD', 'HKD', 'CNY', 'INR', 'BRL', 'ZAR', 'NZD', 'KRW', 'CZK', 'PLN', 'SEK', 'NOK', 'DKK', 'HUF', 'RON', 'ISK', 'ILS', 'EUR', 'AED'];
  var PR = d.querySelector('#promise .kz-d') || d.getElementById('promise');
  if (PR && D.c && ECB.indexOf(D.c) >= 0) {
    var REG = { US: 'USD', GB: 'GBP', AU: 'AUD', CA: 'CAD', NZ: 'NZD', SG: 'SGD', HK: 'HKD', IN: 'INR', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', TR: 'TRY', IL: 'ILS', ZA: 'ZAR', BR: 'BRL', MX: 'MXN', JP: 'JPY', KR: 'KRW', CN: 'CNY', AE: 'AED', MY: 'MYR', TH: 'THB', ID: 'IDR', PH: 'PHP' };
    var myCur = function () { var s = ls('kb-cur'); if (s && ECB.indexOf(s) >= 0) return s; var r = (navigator.language || '').split('-')[1]; if (r && REG[r.toUpperCase()]) return REG[r.toUpperCase()]; return { es: 'EUR', fr: 'EUR', de: 'EUR', nl: 'EUR', ru: 'USD', zh: 'CNY', ar: 'AED', en: 'USD' }[LG]; };
    var fxBox = null, SER = null, run = function () {
      var V = myCur(); if (!V || V === D.c) { if (fxBox) fxBox.hidden = true; return; }
      var need = [D.c, V].map(function (c) { return c === 'AED' ? 'USD' : c; }).filter(function (c) { return c !== 'EUR'; });
      var from = new Date(Date.now() - 5 * 365.25 * 864e5).toISOString().slice(0, 10);
      (SER && SER.k === need.join() ? Promise.resolve(SER.j) : fetch('/api/x/x/fx?c=' + (need.length ? need.join(',') : 'USD') + '&from=' + from).then(function (r) { return r.ok ? r.json() : null; })).then(function (j) {
        if (!j || !j.rates || !j.dates) return; SER = { k: need.join(), j: j };
        var per = function (c, i) { if (c === 'EUR') return 1; if (c === 'AED') { var u = (j.rates.USD || [])[i]; return u == null ? null : u * 3.6725; } var a = j.rates[c]; return a ? a[i] : null; };
        var lo = null, hi = null, now = null, d1 = null, d2 = null;
        for (var i = 0; i < j.dates.length; i++) { var a = per(D.c, i), b = per(V, i); if (a == null || b == null) continue; var r = b / a; if (lo == null || r < lo) lo = r; if (hi == null || r > hi) hi = r; now = r; if (!d1) d1 = j.dates[i]; d2 = j.dates[i]; }
        if (lo == null || !now) return;
        var C1 = D.c, V1 = V; if (now < 0.01) { var lo0 = lo; lo = 1 / hi; hi = 1 / lo0; now = 1 / now; C1 = V; V1 = D.c; }   // tiny rates (IDR, VND) read better the other way round
        var yrs = Math.max(1, Math.round((Date.parse(d2) - Date.parse(d1)) / (365.25 * 864e5))), dg = now < 1 ? 4 : now < 100 ? 2 : 0;
        if (!fxBox) { fxBox = el('div', 'k31fx'); fxBox.setAttribute('aria-live', 'polite'); var cu = PR.querySelector('.kcu'); if (cu && cu.parentNode) cu.parentNode.insertBefore(fxBox, cu.nextSibling); else { var sum = PR.querySelector('summary'); PR.insertBefore(fxBox, sum ? sum.nextSibling : PR.firstChild); } }
        fxBox.hidden = false; fxBox.textContent = ''; fxBox.appendChild(el('h3', null, f('fx_h') + ' (' + D.c + ' / ' + V + ')'));
        fxBox.appendChild(el('p', null, f('fx_t', { y: nf(yrs, 0), c: C1, a: nf(lo, dg), b: nf(hi, dg), v: V1, n: nf(now, dg) }) + ' ' + f('fx_p', { w: V, p: nf((hi / lo - 1) * 100, 0) })));
        var fd = function (x) { try { return new Date(x + 'T12:00:00Z').toLocaleDateString(LOC, { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return x; } };
        var sp2 = el('p', 'k-small', f('fx_src', { d1: fd(d1), d2: fd(d2) }) + (D.c === 'AED' || V === 'AED' ? ' ' + f('fx_peg') : '') + ' '); var sa = el('a', null, 'ecb.europa.eu'); sa.href = 'https://data.ecb.europa.eu/data/datasets/EXR'; sa.rel = 'nofollow noopener'; sa.target = '_blank'; sp2.appendChild(sa); fxBox.appendChild(sp2);
      }).catch(function () {});
    };
    var dd = PR.closest ? PR.closest('details') : null, started = false, start = function () { if (started) return; started = true; setTimeout(run, 300); var s = PR.querySelector('.kcu select'); if (s) s.addEventListener('change', function () { setTimeout(run, 50); }); };
    if (!dd || dd.open) start(); else dd.addEventListener('toggle', function () { if (dd.open) start(); });
  }

  // 136: the timeline inside "What changed, with dates" (the latest 12 dated records; the full timeline one link away)
  var HS = d.querySelector('#history .kz-d');
  if (HS && SLUG) {
    var tlDone = false, tl = function () {
      if (tlDone) return; tlDone = true; var w = el('div', 'k31tl', f('ld')), sum = HS.querySelector('summary'); HS.insertBefore(w, sum ? sum.nextSibling : HS.firstChild);
      var url = P + '/projects/' + SLUG + '/timeline/';
      fetch(url).then(function (r) { return r.ok ? r.text() : null; }).then(function (h) {
        if (!h) { w.textContent = f('err'); return; }
        var doc = new DOMParser().parseFromString(h, 'text/html'), ol = doc.querySelector('ol.n30tl'); w.textContent = '';
        if (!ol) { w.remove(); return; }
        var css = [].slice.call(doc.querySelectorAll('style')).filter(function (s) { return /\.n30tl/.test(s.textContent); })[0]; if (css && !d.getElementById('k31tl-css')) { var s2 = el('style'); s2.id = 'k31tl-css'; s2.textContent = css.textContent.replace(/\.kwrap:has[^}]*\}/g, ''); d.head.appendChild(s2); }
        var n = 0; [].slice.call(ol.children).forEach(function (li) { if (/n30e/.test(li.className)) { n++; if (n > 12) li.remove(); } });
        var last = ol.lastElementChild; if (last && /n30y/.test(last.className)) last.remove();
        w.appendChild(el('h3', null, f('tl_h'))); w.appendChild(d.importNode(ol, true)); var a = el('a', 'more', f('tl_all')); a.href = url; var p = el('p'); p.appendChild(a); w.appendChild(p);
      }).catch(function () { w.textContent = f('err'); });
    };
    if (HS.open) tl(); else HS.addEventListener('toggle', function () { if (HS.open) tl(); });
  }

  // 137: "See before and after" at the top opens the satellite section and starts the slider
  d.querySelectorAll('[data-n31ba]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var sec = d.getElementById('space'); if (!sec) return; e.preventDefault();
      var dt = sec.querySelector('details'); if (dt) dt.open = true; sec.scrollIntoView({ block: 'start' });
      var n = 0, t = setInterval(function () { var b = sec.querySelector('[data-n30ba]'); if (b || ++n > 20) { clearInterval(t); if (b) b.click(); } }, 150);
    });
  });

  // 152: map with layers at the pin (Leaflet, self-hosted, loaded on the click; OpenStreetMap and Esri imagery)
  var WH = d.querySelector('#land .kz-d') || d.querySelector('#where .kz-d'), osm = d.querySelector('#where a[href*="openstreetmap.org/?mlat="]');
  if (WH && osm) {
    var mm = /mlat=(-?[\d.]+)&mlon=(-?[\d.]+)/.exec(osm.getAttribute('href')), lat = mm && +mm[1], lng = mm && +mm[2];
    if (mm) {
      var mb = el('button', 'k31b', f('map')); mb.type = 'button'; var mp = el('p'); mp.appendChild(mb); var sum2 = WH.querySelector('summary'); WH.insertBefore(mp, sum2 && sum2.nextSibling ? sum2.nextSibling : null);
      mb.addEventListener('click', function () {
        mb.disabled = true; var box2 = el('div', 'k31map'); box2.setAttribute('dir', 'ltr'); mp.parentNode.insertBefore(box2, mp.nextSibling); var cap = el('p', 'k-small', f('map_c')); box2.parentNode.insertBefore(cap, box2.nextSibling);
        var draw = function () {
          var Lf = window.L; if (!Lf) { box2.textContent = f('err'); return; }
          var m = Lf.map(box2, { scrollWheelZoom: false }).setView([lat, lng], 16);
          var o = Lf.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(m);
          var s = Lf.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: '&copy; Esri' });
          var L2 = {}; L2[f('map_osm')] = o; L2[f('map_sat')] = s; Lf.control.layers(L2, null, { collapsed: false }).addTo(m); Lf.circleMarker([lat, lng], { radius: 9, color: '#fff', weight: 3, fillColor: '#B3261E', fillOpacity: 1 }).addTo(m);
        };
        if (window.L) { draw(); return; }
        var c = el('link'); c.rel = 'stylesheet'; c.href = '/satellite/plot/vendor/leaflet-1.9.4.css?v=b8273795a6'; d.head.appendChild(c);
        var s3 = el('script'); s3.src = '/satellite/plot/vendor/leaflet-1.9.4.js?v=dc452946ac'; s3.onload = draw; s3.onerror = function () { box2.textContent = f('err'); }; d.head.appendChild(s3);
      });
    }
  }

  // 144: what buyers reported after sending the questions (the ask-developer flow), shown only from 5 reports (the endpoint's own rule)
  var AL = d.querySelector('a[data-k31as]'), AS = AL && el('p'), AID = AL && (/[?&]id=([A-Z0-9-]+)/.exec(AL.getAttribute('href')) || [])[1];
  if (AS && AID) {
    AL.parentNode.parentNode.insertBefore(AS, AL.parentNode); AS.hidden = true;
    var ad = AS.closest('details'), asked = false, ask = function () { if (asked) return; asked = true; fetch('/api/x/y/asks/stats?id=' + encodeURIComponent(AID)).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { var p = j && j.project; if (p && p.reports >= 5) { AS.textContent = f('asked', { k: nf(p.reports, 0), a: nf(p.answered, 0) }); AS.hidden = false; } }).catch(function () {}); };
    if (!ad || ad.open) ask(); else ad.addEventListener('toggle', function () { if (ad.open) ask(); });
  }
};
export async function handle(req, u) {
if (u.pathname !== '/k/n31d.js') return null;
const l = LANGS.includes(u.searchParams.get('l')) ? u.searchParams.get('l') : 'en';
const M = Object.assign({}, C.en, C[l] || {});
const body = '(' + CLIENT.toString() + ')(' + JSON.stringify(M) + ',' + JSON.stringify(l) + ');';
return new Response(body, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': u.searchParams.get('v') === N31V ? 'public, max-age=31536000, immutable' : 'public, max-age=300', 'x-content-type-options': 'nosniff' } });
}
