// kolaboro.com (n33i, batch 33, 20 Nov 2026): indexing and crawl budget. No paid AI, no DB, no new Actions minutes.
//   pre(req, u, env)   -> Response | 'nf' | null. Old query-string URLs that Search Console crawls (items 3, 4, 5, 15):
//                         /p/?id=<ID>       -> 301 /<lang>/projects/<slug>/; Sumba ids -> 301 the transparency ranking; unknown id -> 'nf' (real 404)
//                         /m/?market=<m>    -> 301 /m/<slug>/; Sumba -> the transparency ranking; unknown market -> 'nf'
//                         /<lang>/ask-developer/?id= -> 301 /ask-developer/?id= (the form exists in English only; was a 404)
//                         /explain/, /timeline/, /ask-developer/ with a well-formed but unknown project id -> 'nf' (was 200 with an empty template)
//   post(req, u, r, env) -> every /api/ answer gets X-Robots-Tag: noindex (item 1); a GET to an unknown /api/kb/ path answers 410 (item 6);
//                         HTML links to URLs with a query string get rel="nofollow", and /p/?id= and /m/?market= links become clean paths (item 13).
//   lmBot(req, path, tag, lm) -> the Last-Modified sent to crawlers and whether their If-Modified-Since earns a 304 (item 17, see kbCond in index.js).
import { data } from './kbx_named.js';

const LANGS = 'es|de|fr|nl|ru|zh|ar';
export const PRE = new RegExp('^/(?:(' + LANGS + ')/)?(p|m|ask-developer|explain|timeline)/?$');
const ID_RX = /^[A-Za-z]{2,6}-\d{1,4}$/;
const slugM = m => String(m || '').toLowerCase().replace(/\s+/g, '-');
const rd = loc => new Response(null, { status: 301, headers: { location: loc, 'cache-control': 'public, max-age=86400', 'x-robots-tag': 'noindex' } });
const COI = 'sumba';

let MK = null, MKIX = null;
function markets(ix) {   // market slug -> the slug of its /m/<slug>/ page (same rule as kbx_seo.js slugM); Sumba is left out
  if (MK && MKIX === ix) return MK;
  MK = new Map(); MKIX = ix;
  for (const c of (ix.cases && ix.cases.cases) || []) { const s = slugM(c.market); if (s && s !== COI) MK.set(s, s); }
  return MK;
}

export async function pre(req, u, env) {
  if (!u.search) return null;
  const m = PRE.exec(u.pathname); if (!m) return null;
  const lang = m[1] || '', kind = m[2], pre = lang ? '/' + lang : '';
  if (kind === 'ask-developer' && lang) return rd('/ask-developer/' + u.search);
  let ix; try { ix = await data(env); } catch (e) { return null; }
  if (kind === 'p') {
    const id = String(u.searchParams.get('id') || '').trim().toUpperCase(); if (!id) return null;
    if (/^SUM-/.test(id)) return rd(pre + '/rankings/transparency/sumba/');
    const x = ix.byId.get(id); if (x) return rd(pre + '/projects/' + x.s + '/');
    const c = ix.caseBy.get(id); if (c && slugM(c.market) === COI) return rd(pre + '/rankings/transparency/sumba/');
    return 'nf';
  }
  if (kind === 'm') {
    const q = u.searchParams.get('market'); if (q == null) return null;
    const s = slugM(String(q).trim()).replace(/[^a-z0-9-]/g, '');
    if (s === COI) return rd(pre + '/rankings/transparency/sumba/');
    if (s && markets(ix).has(s)) return rd('/m/' + s + '/');
    return 'nf';
  }
  // /explain/, /timeline/, /ask-developer/: a project id in the right shape that we do not hold gets a real 404 (the pages stay noindex)
  const id = String(u.searchParams.get('id') || '').trim();
  if (id && ID_RX.test(id) && !ix.caseBy.has(id.toUpperCase())) return 'nf';
  return null;
}

// ---------- after the answer ----------
const POST_ONLY = /^\/api\/kb\/(?:analyze|progress|ask|document|plan|report-draft|csp|copilot|bulk|err)\/?$/;
const TRACK = /^(utm_[a-z]+|gclid|fbclid|msclkid|ref|src)$/i;
function linkFix(href) {   // -> null (leave), { nf: true } (add nofollow), { p: id } or { m: slug } (clean path)
  if (!href || /^(#|mailto:|tel:|javascript:|data:|webcal:)/i.test(href)) return null;
  let v; try { v = new URL(href, 'https://kolaboro.com/'); } catch (e) { return null; }
  if (v.hostname !== 'kolaboro.com' && v.hostname !== 'www.kolaboro.com') return null;
  if (/^\/api\//.test(v.pathname)) return { nf: true };
  if (!v.search) return null;
  const keys = [...v.searchParams.keys()]; if (!keys.length || keys.every(k => TRACK.test(k))) return null;
  const lm = new RegExp('^/(?:(' + LANGS + ')/)?(p|m)/?$').exec(v.pathname);
  if (lm && lm[2] === 'p' && keys.length === 1 && v.searchParams.get('id')) return { p: v.searchParams.get('id').toUpperCase(), lang: lm[1] || '' };
  if (lm && lm[2] === 'm' && keys.length === 1 && v.searchParams.get('market')) return { m: slugM(v.searchParams.get('market')).replace(/[^a-z0-9-]/g, ''), lang: lm[1] || '' };
  return { nf: true };
}
export { linkFix };

function nofollow(e) { const r = (e.getAttribute('rel') || '').trim(); if (!/\bnofollow\b/i.test(r)) e.setAttribute('rel', (r ? r + ' ' : '') + 'nofollow'); }

export async function post(req, u, r, env) {
  if (!r) return r;
  if (/^\/api\//.test(u.pathname)) {
    if (r.headers.has('x-robots-tag') && !(req.method === 'GET' && r.status === 404 && /^\/api\/kb\//.test(u.pathname))) return r;
    const h = new Headers(r.headers); if (!h.has('x-robots-tag')) h.set('x-robots-tag', 'noindex');
    let st = r.status;
    if (req.method === 'GET' && st === 404 && /^\/api\/kb\//.test(u.pathname)) { st = POST_ONLY.test(u.pathname) ? 405 : 410; if (st === 405) h.set('allow', 'POST'); }   // endpoints our pages POST to answer 405, never-existing paths 410
    return new Response(r.body, { status: st, statusText: st === 410 ? 'Gone' : st === 405 ? 'Method Not Allowed' : r.statusText, headers: h });
  }
  if (req.method !== 'GET' || r.status !== 200 || !/text\/html/.test(r.headers.get('content-type') || '')) return r;
  let ix = null;
  const ixGet = async () => { if (ix === null) { try { ix = await data(env); } catch (e) { ix = false; } } return ix; };
  return new HTMLRewriter().on('a[href]', {
    element(e) {   // synchronous for every other link; only /p/?id= and /m/?market= links wait for the project index
      const f = linkFix(e.getAttribute('href')); if (!f) return;
      if (f.nf) return nofollow(e);
      return ixGet().then(I => {
        if (f.p) { const x = I && I.byId.get(f.p); if (x) e.setAttribute('href', (f.lang ? '/' + f.lang : '') + '/projects/' + x.s + '/'); else nofollow(e); return; }
        if (f.m) { if (I && f.m !== COI && markets(I).has(f.m)) e.setAttribute('href', '/m/' + f.m + '/'); else nofollow(e); }
      });
    }
  }).transform(r);
}

// ---------- 304 for crawlers (item 17) ----------
// Cloudflare drops the ETag of HTML answers on this zone (checked 20 Nov 2026: static files keep theirs, pages arrive without one), so
// crawlers revalidate with If-Modified-Since only. The edge remembers, per URL, the fingerprint of the page (nonce-free SHA-1, the
// same as the ETag) and when it first served that version. The Last-Modified sent to crawlers is the later of the data date and that
// moment, so a template change also moves it; a 304 is sent only when the fingerprint is unchanged and the crawler's date is not older.
export async function lmBot(req, path, tag, lm) {
  const out = { lm, not: false };
  if (typeof caches === 'undefined') return out;
  const k = new Request('https://kolaboro.com/__lm33/v1' + path);
  let t = 0;
  try { const hit = await caches.default.match(k); if (hit && hit.headers.get('x-h') === tag) t = +hit.headers.get('x-t') || 0; } catch (e) {}
  if (!t) { t = Math.floor(Date.now() / 1000) * 1000; try { await caches.default.put(k, new Response('', { headers: { 'x-h': tag, 'x-t': String(t), 'cache-control': 'public, max-age=2592000' } })); } catch (e) {} }
  const d = Date.parse(lm || '') || 0, best = Math.max(d, t);
  out.lm = new Date(best).toUTCString();
  const ims = Date.parse(req.headers.get('if-modified-since') || '');
  if (ims && ims >= Math.floor(best / 1000) * 1000) out.not = true;
  return out;
}
