// kolaboro.com batch 31 (agent n31b, 18 Nov 2026): the trust block of a named project page (kbx_named.js), kept small and apart from
// the trust pages (kbx_n31b.js). No model calls, nothing stored. Every line comes from fields the page already holds.
//   trustBlock(x, c, lang, o)  one folded block under the six-check light:
//     item 62  summary line: which of the six buyer checks an official register confirms, which an independent source, which only the
//              developer states, which were not found or are contradicted (bali-cases.json "verified" levels)
//     item 77  how many sources the page has, by kind (official register, developer, press or other, listing portal)
//     item 79  permit number published by the developer compared with the register entry we looked up (named.json "rw")
//     item 76  review seal: date, review checklist n27, method version (kbx_e29_lines.js METHOD), desk review, accountable person
//     item 75  "current until" date of a review (90 days), item 78 out-of-date notice past 90 days (review or last check)
//     item 91  date and clear share of the latest satellite image used (construction-progress.json)
//     item 66  copy of the register record kept with its SHA-256 (kbx_n31b_cap.js, built from /data/register-captures.json)
//     item 92  link to what we cannot know, item 70 link to conflicts of interest, item 88 "report an error" on every fact line
//   kindIco(k, lang)          item 68: icon and label of a source's kind, next to each source and each tested claim
import { METHOD, ACC } from './kbx_e29_lines.js';
import { CAP } from './kbx_n31b_cap.js';
export const N31V = '2';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// n31b: the strings live in /data/n31b-i18n.json (kept out of the worker bundle, which must stay under Pages' 25 MiB limit), loaded once
// per isolate by loadS(env) at each async entry point that renders n31b text. Until it is loaded, t31 returns '' and the trust block is left out.
let S = null, SP = null;
export async function loadS(env) {
  if (S) return S; if (SP) return SP;
  SP = (async () => { let v = null;
    try { if (env && env.ASSETS) { const r = await env.ASSETS.fetch(new Request('https://kolaboro.com/_s/kolaboro.com/data/n31b-i18n.json')); if (r.ok) v = await r.json(); } } catch (e) { v = null; }
    if (!v) { try { const r = await fetch('https://kolaboro.com/data/n31b-i18n.json', { cf: { cacheTtl: 600, cacheEverything: true } }); if (r.ok) v = await r.json(); } catch (e) { v = null; } }
    if (v && v.en) S = v; SP = null; return S; })();
  return SP;
}
export const s31ready = () => !!S;
export const t31 = (lang, k, v) => { if (!S) return ''; const s = (S[lang] && S[lang][k] != null) ? S[lang][k] : S.en[k]; return v && typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (m, a) => v[a] != null ? v[a] : m) : s; };
const pre = l => l === 'en' ? '' : '/' + l;
const DAY = 864e5, LIM = 90;
const days = (a, b) => { const x = Date.parse(String(a || '').slice(0, 10) + 'T00:00:00Z'), y = Date.parse(String(b).slice(0, 10) + 'T00:00:00Z'); return isFinite(x) && isFinite(y) ? Math.round((y - x) / DAY) : null; };
const addD = (a, n) => { const x = Date.parse(String(a).slice(0, 10) + 'T00:00:00Z'); return isFinite(x) ? new Date(x + n * DAY).toISOString().slice(0, 10) : null; };
const norm = s => String(s || '').toLowerCase().replace(/[^0-9a-z฀-๿]/g, '');
export const kindIco = (k, lang) => !S || k < 0 || k > 3 ? '' : '<span class="k31k k' + k + '">' + esc(t31(lang, 'k' + k)) + '</span>';   // icon drawn by CSS (::before)
export const K31_CSS = '<style id="k31-css">.k31t{margin:10px 0 0;border:1px solid var(--line);border-radius:10px;padding:0 12px}.k31t>summary{cursor:pointer;padding:10px 0;font-size:.95rem;min-height:44px;box-sizing:border-box}.k31t ul{margin:0 0 10px;padding-inline-start:18px}.k31t li{margin:0 0 6px;font-size:.92rem;overflow-wrap:anywhere}' +
  '.k31k{font-size:.8rem;color:var(--muted);white-space:nowrap}.k31k::before{margin-inline-end:4px}.k0::before{content:"\\25C6";content:"\\25C6"/"";color:#1a7f37}.k1::before{content:"\\25CF";content:"\\25CF"/"";color:#9a6700}.k2::before{content:"\\25B2";content:"\\25B2"/"";color:#0969da}.k3::before{content:"\\25A0";content:"\\25A0"/"";color:#6e7781}.k31w{border:0;background:none;color:var(--muted);cursor:pointer;min-width:32px;min-height:32px}@media print{.k31w{display:none}}</style>';

// latest satellite image with a clear view (construction-progress.json: dt scene dates, c clear share, t tile)
function satLast(sat, id) {
  const r = sat && sat.projects && sat.projects[id]; if (!r || !Array.isArray(r.dt)) return null;
  for (let i = r.dt.length - 1; i >= 0; i--) if (r.dt[i] && r.c && r.c[i] != null) return { d: r.dt[i], c: r.c[i], t: r.t || '' };
  return null;
}
// item 79: the register's own identifiers for this project (rw.code, numbers in rw.detail) found in the number the developer publishes
function permitCmp(x) {
  const rw = x.rw; if (!rw) return null;
  const ids = [rw.code, ...(String(rw.detail || '').match(/[A-Z]{0,3}\d[\d./-]{3,}\d/g) || [])].map(norm).filter(s => s.length >= 4);
  if (!x.pn) return { k: 'reg', rw };
  const p = norm(x.pn);
  return { k: ids.some(i => p.includes(i)) ? 'ok' : 'no', rw };
}
export function trustBlock(x, c, lang, o) {
  if (!S) return '';
  const fd = o.fd, today = o.today || new Date().toISOString().slice(0, 10), vf = (c && c.verified) || {};
  // item 62: one line
  const G = { registry: [], independent: [], developer: [], none: [], contradicted: [] };
  for (const k of o.seq) { const v = vf[k] || 'none'; (G[v] || G.none).push(o.ckName(k)); }
  const any = G.registry.length + G.independent.length + G.developer.length + G.contradicted.length;
  const part = (lab, L) => L.length ? '<b>' + esc(t31(lang, lab)) + ':</b> ' + esc(L.join(', ')) : '';
  const sum = any ? [part('tb_off', G.registry), part('tb_ind', G.independent), part('tb_dev', G.developer), part('tb_con', G.contradicted), part('tb_none', G.none)].filter(Boolean).join(' · ') : esc(t31(lang, 'tb_nr'));
  const L = [];
  // item 77: sources by kind
  const K = [0, 0, 0, 0]; for (const u of o.sources || []) { const k = o.kindOf(u); if (k >= 0) K[k]++; }
  const n = K[0] + K[1] + K[2] + K[3];
  if (n) L.push(esc(t31(lang, n === 1 ? 'tb_src1' : 'tb_src', { n, list: '%L' }) || t31(lang, 'tb_src', { n, list: '%L' })).replace('%L', K.map((v, k) => v ? kindIco(k, lang).replace('">', '">' + v + ' ') : '').filter(Boolean).join(', ')) + ' <a href="#sources">' + esc(t31(lang, 'src_h')) + '</a>');
  // item 79: permit number against the register entry
  const pc = permitCmp(x);
  if (pc) L.push(esc(t31(lang, pc.k === 'ok' ? 'tb_pm_ok' : pc.k === 'no' ? 'tb_pm_no' : 'tb_pm_reg', { code: pc.rw.code || pc.rw.item, reg: pc.rw.register, d: fd(pc.rw.checked, lang) })) + ' <a href="' + pre(lang) + '/registers/">' + esc(t31(lang, 'tb_off')) + '</a>');
  else if (x.pn && x.rvw && x.rvw.reg && x.rvw.reg[0] === 'found') L.push(esc(t31(lang, 'tb_pm_found', { reg: x.rvw.reg[1], d: fd(x.rvw.d, lang) })));
  else if (x.pn) L.push(esc(t31(lang, 'tb_pm_none')));
  // items 76, 75, 78: review seal and freshness
  const rv = x.rvw && x.rvw.ok && x.rvw.d ? x.rvw.d : null;
  if (rv) {
    const age = days(rv, today);
    L.push(esc(t31(lang, 'tb_rv', { d: fd(rv, lang), v: METHOD.v })) + ' ' + esc(t31(lang, 'tb_acc', { p: '%P' })).replace('%P', '<a href="' + pre(lang) + '/team/#who"><bdi>' + esc(ACC) + '</bdi></a>'));
    L.push(esc(age != null && age > LIM ? t31(lang, 'tb_old', { n: age }) : t31(lang, 'tb_cur', { d: fd(addD(rv, LIM), lang) })));
  } else if (o.checked) {
    const age = days(o.checked, today);
    if (age != null) L.push(esc(t31(lang, age > LIM ? 'tb_age_old' : 'tb_age', { d: fd(o.checked, lang), n: age })));
  }
  // item 91: the satellite image is dated
  const sl = satLast(o.sat, x.id);
  if (sl) { const a = days(sl.d, today); L.push(esc(t31(lang, a != null && a > 62 ? 'tb_sat_old' : 'tb_sat', { d: fd(sl.d, lang), n: a, c: sl.c, t: sl.t }))); }
  // item 66: a kept copy of the register record
  const cp = CAP[x.id];
  if (cp) L.push(esc(t31(lang, 'tb_cap', { d: fd(cp[0], lang), h: cp[1].slice(0, 16) + '…' })) + ' <a href="' + pre(lang) + '/registers/captures/#' + esc(x.id) + '">' + esc(t31(lang, 'tb_cap_l')) + '</a>');
  // items 92, 70, 88
  L.push('<a href="' + pre(lang) + '/what-we-cannot-know/">' + esc(t31(lang, 'tb_cant')) + '</a> · <a href="' + pre(lang) + '/conflicts-of-interest/">' + esc(t31(lang, 'tb_coi')) + '</a>');
  L.push(esc(t31(lang, 'tb_wrong', { m: '%M' })).replace('%M', '<a href="mailto:hello@kolaboro.com"><bdi>hello@kolaboro.com</bdi></a>'));
  return K31_CSS + '<details class="k31t" id="k31t" data-n="' + esc(o.name) + '" data-id="' + esc(x.id) + '"><summary>' + sum + '</summary><ul>' + L.map(l => '<li>' + l + '</li>').join('') + '</ul></details><script src="/k/n31b.js?v=' + N31V + '" defer></script>';
}
// item 88: one button on every fact line, opening an email to the existing correction address with the line and the page filled in
export function n31js() {
  const W8 = {}; for (const l of Object.keys(S || { en: 1 })) W8[l] = [t31(l, 'w_btn'), t31(l, 'w_subj'), t31(l, 'w_body')];
  return "(function(){var D=document.getElementById('k31t');if(!D)return;var W=" + JSON.stringify(W8).replace(/</g, '\\u003c') + ",L=(document.documentElement.lang||'en').slice(0,2),T=W[L]||W.en,S=T[1].replace('{n}',D.getAttribute('data-n')).replace('{id}',D.getAttribute('data-id'));" +
  "var Q=document.querySelectorAll('main li.kfact');for(var i=0;i<Q.length;i++){var b=document.createElement('button');b.type='button';b.className='k31w';b.setAttribute('aria-label',T[0]);b.title=T[0];b.textContent='\\u2691';Q[i].appendChild(b)}" +
  "document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('.k31w');if(!b)return;var li=b.parentNode,c=li.cloneNode(true),x=c.querySelectorAll('.k31w');for(var j=0;j<x.length;j++)x[j].remove();" +
  "var tx=(c.textContent||'').replace(/\\s+/g,' ').trim().slice(0,500),s=li.closest('section[id],details[id],div[id]'),u=location.origin+location.pathname+(s&&s.id?'#'+s.id:'');" +
  "location.href='mailto:hello@kolaboro.com?subject='+encodeURIComponent(S)+'&body='+encodeURIComponent(T[2].replace('{u}',u).replace('{l}',tx))})})();";
}
