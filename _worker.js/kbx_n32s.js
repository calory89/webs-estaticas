// comments: _notes/kolaboro-worker-comments.txt
import { TB } from './kbx_strings.js';
const $q = TB.kbx_n32s__q;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TR_PLACES } from './kbx_tr_places.js';
import { mkName } from './kbx_hdate.js';
const ORIGIN = 'https://kolaboro.com';
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a, "'": '&#39;' }[c]));
let S = null, SP = null;
export async function load(env) {
if (S) return S; if (SP) return SP;
SP = (async () => { let v = null;
try { if (env && env.ASSETS) { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.b)); if (r.ok) v = await r.json(); } } catch (e) { v = null; }
if (!v) { try { const r = await fetch(ORIGIN + $q.c, { cf: { cacheTtl: 600, cacheEverything: true } }); if (r.ok) v = await r.json(); } catch (e) { v = null; } }
if (v && v.en) S = v; SP = null; return S; })();
return SP;
}
const t = (lang, k, v) => { if (!S) return ''; const s = (S[lang] && S[lang][k] != null) ? S[lang][k] : S.en[k]; return v && typeof s === $q.d ? s.replace(/\{(\w+)\}/g, (m, a) => v[a] != null ? v[a] : m) : s; };
export const doneLab = lang => S ? [t(lang, 't_dn'), t(lang, 't_dn2')] : null;
export const isDone = (x, c) => x.st === $q.e || x.sts === $q.e || !!(c && c.stage === $q.e);
const HUB = /^\/(?:projects|rankings|rankings\/transparency|rankings\/transparency\/[a-z0-9-]{2,40}|handover|vs|m\/[^/.]{2,60})\/$/;
const slugA = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function scope(p) {   // null: whole dataset; { mks, name } for a place
  let m = /^\/rankings\/transparency\/([a-z0-9-]+)\/$/.exec(p);
  if (m) { const P = TR_PLACES.find(q => q.s === m[1] && !q.coi && !q.a); return P ? { mks: P.m, name: P.n } : false; }
  m = /^\/m\/([^/]+)\/$/.exec(p);
  if (m) { let k = m[1]; try { k = decodeURIComponent(k); } catch (e) {} return { slug: slugA(k), name: null }; }
  return null;
}
const CNT = new WeakMap();
function counts(N, ix, sc) {
const key = sc ? (sc.mks ? sc.mks.join('|') : 's:' + sc.slug) : '*';
let M = CNT.get(ix); if (!M) { M = new Map(); CNT.set(ix, M); }
if (M.has(key)) return M.get(key);
const P = ix.P.filter(x => !sc || (sc.mks ? sc.mks.includes(x.mk) : slugA(x.mk) === sc.slug));
const o = { n: P.length, m: new Set(P.map(x => x.mk)).size, c: new Set(P.map(x => String(x.co || '').replace(/\s*\(.*\)$/, '').replace(/^Saint /, 'St '))).size,
pn: 0, hd: 0, od: 0, mk: P.length ? P[0].mk : null };
for (const x of P) { if (x.pn) o.pn++; if (N.handoverOf(ix, x)) o.hd++; if (N.overdueOf(ix, x)) o.od++; }
M.set(key, o); return o;
}
export async function answer(req, u, env, r) {
  if (req.method !== 'GET' || !r || r.status !== 200 || !/text\/html/.test(r.headers.get($q.f) || '')) return r;
  const lm = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(.*)$/.exec(u.pathname), lang = lm[1] || 'en', p = '/' + lm[2];
  if (!HUB.test(p)) return r;
  if (lang !== 'en' && /^\/m\//.test(p)) return r;   // the translated market files open with their own dated figures (n29i)
  const sc = scope(p); if (sc === false) return r;
  let html = '';
  try {
    if (!(await load(env))) return r;
    const N = await import('./kbx_named.js'), ix = await N.data(env), o = counts(N, ix, sc);
    if (!o.n || (sc && o.n < 3)) return r;
    const nf = new Intl.NumberFormat(LOC[lang] || 'en-GB'), pf = new Intl.NumberFormat(LOC[lang] || 'en-GB', { style: $q.g, maximumFractionDigits: 0 }), f = v => '<b>' + nf.format(v) + '</b>', pc = v => pf.format(o.n ? v / o.n : 0);
    const d = N.fd(N.iso(ix.updated) || ix.updated, lang), place = sc ? mkName(sc.name || o.mk, lang) : '';
    const v = { d: esc(d), n: f(o.n), m: f(o.m), c: f(o.c), pn: f(o.pn), pp: pc(o.pn), hd: f(o.hd), hp: pc(o.hd), od: f(o.od), p: '<bdi>' + esc(place) + $q.h };
    const s = t(lang, sc ? 'a_p' : 'a_g', v), plain = s.replace(/<[^>]+>/g, '');
    html = $q.i + esc(t(lang, 'a_lab')) + $q.j + esc(plain) + $q.k + esc(d) + $q.l + esc(d) + $q.m +
      s + $q.n + t(lang, 'a_src', { f: $q.o }) + $q.p;
  } catch (e) { return r; }
  if (!html) return r;
  let done = false;
  const rw = new HTMLRewriter();
  // n32s (item 259): the market file's hero grows from "Loading" to about 830 px on a phone (500 px wide screens) when /m/m.js fills it;
  // the space is kept from the start so the figures below it do not jump (layout shift 0.55 on /m/dubai/ in a Lighthouse run)
  if (lang === 'en' && /^\/m\//.test(p)) html = $q.q + html;
  if (lang === 'en' && /^\/m\//.test(p)) rw.on($q.r, { element(e) { if (done) return; done = true; e.after(html, { html: true }); } });   // the market file's h1 is rebuilt by /m/m.js inside #mk-root
  else rw.on($q.s, { element(e) { if (done) return; done = true; e.after(html, { html: true }); } });
  return rw.transform(r);
}
