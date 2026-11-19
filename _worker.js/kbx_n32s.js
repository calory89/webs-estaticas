// kolaboro.com batch 32 (n32s, 19 Nov 2026): SEO remainder.
//   load(env)              strings from /data/n32s-i18n.json (static asset), read once per isolate, so the worker bundle stays small
//   answer(req, u, env, r) item 217: one dated, sourced answer line under the h1 of the data hubs that had none (all projects, rankings,
//                          transparency rankings by place, handover hub, comparisons, market files). Counted from the same data as the
//                          pages (named.json): projects tracked, markets, countries, permit or licence number published, handover date
//                          on record, past that date. The line carries data-cite so /k/cite29.js gives it a "Cite" button.
//   doneLab(lang)          item 199: title words for completed projects ("<name> reviews 2026: completed, buyer reports and record")
// Rules kept: facts with source and date; Sumba, Eco Beach City and Equinox never counted (named.json's project list already leaves
// them out); 8 languages, Arabic RTL; no Review schema.
import { TR_PLACES } from './kbx_tr_places.js';
import { mkName } from './kbx_hdate.js';

const ORIGIN = 'https://kolaboro.com';
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let S = null, SP = null;
export async function load(env) {
  if (S) return S; if (SP) return SP;
  SP = (async () => { let v = null;
    try { if (env && env.ASSETS) { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/n32s-i18n.json')); if (r.ok) v = await r.json(); } } catch (e) { v = null; }
    if (!v) { try { const r = await fetch(ORIGIN + '/data/n32s-i18n.json', { cf: { cacheTtl: 600, cacheEverything: true } }); if (r.ok) v = await r.json(); } catch (e) { v = null; } }
    if (v && v.en) S = v; SP = null; return S; })();
  return SP;
}
const t = (lang, k, v) => { if (!S) return ''; const s = (S[lang] && S[lang][k] != null) ? S[lang][k] : S.en[k]; return v && typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (m, a) => v[a] != null ? v[a] : m) : s; };
export const doneLab = lang => S ? [t(lang, 't_dn'), t(lang, 't_dn2')] : null;
export const isDone = (x, c) => x.st === 'completed' || x.sts === 'completed' || !!(c && c.stage === 'completed');

// ------------------------------------------------------------------------------------------------ item 217
// hubs that get the line (language prefix removed); place hubs name their markets
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
  const o = { n: P.length, m: new Set(P.map(x => x.mk)).size, c: new Set(P.map(x => String(x.co || '').replace(/\s*\(.*\)$/, '').replace(/^Saint /, 'St '))).size,   // "Puerto Rico (USA)", "Saint Lucia": one country each, as on /countries/
    pn: 0, hd: 0, od: 0, mk: P.length ? P[0].mk : null };
  for (const x of P) { if (x.pn) o.pn++; if (N.handoverOf(ix, x)) o.hd++; if (N.overdueOf(ix, x)) o.od++; }
  M.set(key, o); return o;
}
export async function answer(req, u, env, r) {
  if (req.method !== 'GET' || !r || r.status !== 200 || !/text\/html/.test(r.headers.get('content-type') || '')) return r;
  const lm = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(.*)$/.exec(u.pathname), lang = lm[1] || 'en', p = '/' + lm[2];
  if (!HUB.test(p)) return r;
  if (lang !== 'en' && /^\/m\//.test(p)) return r;   // the translated market files open with their own dated figures (n29i)
  const sc = scope(p); if (sc === false) return r;
  let html = '';
  try {
    if (!(await load(env))) return r;
    const N = await import('./kbx_named.js'), ix = await N.data(env), o = counts(N, ix, sc);
    if (!o.n || (sc && o.n < 3)) return r;
    const nf = new Intl.NumberFormat(LOC[lang] || 'en-GB'), pf = new Intl.NumberFormat(LOC[lang] || 'en-GB', { style: 'percent', maximumFractionDigits: 0 }), f = v => '<b>' + nf.format(v) + '</b>', pc = v => pf.format(o.n ? v / o.n : 0);
    const d = N.fd(N.iso(ix.updated) || ix.updated, lang), place = sc ? mkName(sc.name || o.mk, lang) : '';
    const v = { d: esc(d), n: f(o.n), m: f(o.m), c: f(o.c), pn: f(o.pn), pp: pc(o.pn), hd: f(o.hd), hp: pc(o.hd), od: f(o.od), p: '<bdi>' + esc(place) + '</bdi>' };
    const s = t(lang, sc ? 'a_p' : 'a_g', v), plain = s.replace(/<[^>]+>/g, '');
    html = '<p class="n32-a" id="in-short" data-cite="' + esc(t(lang, 'a_lab')) + '" data-cite-v="' + esc(plain) + '" data-cite-d="' + esc(d) + '" data-asof="' + esc(d) + '" style="max-width:72ch;margin:10px 0 14px;padding:10px 14px;border-inline-start:3px solid var(--k-sea,#0f766e);background:var(--k-sunken,#f4f2ec);border-radius:6px;font-size:.95rem;line-height:1.5">' +
      s + ' <small style="color:var(--k-muted,#5f5c55)">' + t(lang, 'a_src', { f: '<a href="/data/named.json">named.json</a>' }) + '</small></p>';
  } catch (e) { return r; }
  if (!html) return r;
  let done = false;
  const rw = new HTMLRewriter();
  // n32s (item 259): the market file's hero grows from "Loading" to about 830 px on a phone (500 px wide screens) when /m/m.js fills it;
  // the space is kept from the start so the figures below it do not jump (layout shift 0.55 on /m/dubai/ in a Lighthouse run)
  if (lang === 'en' && /^\/m\//.test(p)) html = '<style id="n32-mh">#mk-root .mk-load{min-height:440px}@media(max-width:600px){#mk-root .mk-load{min-height:760px}}</style>' + html;
  if (lang === 'en' && /^\/m\//.test(p)) rw.on('#mk-root', { element(e) { if (done) return; done = true; e.after(html, { html: true }); } });   // the market file's h1 is rebuilt by /m/m.js inside #mk-root
  else rw.on('main h1', { element(e) { if (done) return; done = true; e.after(html, { html: true }); } });
  return rw.transform(r);
}
