// comments: _notes/kolaboro-worker-comments.txt
// n40 k51 (27 Nov 2026): the satellite section (#space) of project pages is sent only when it is opened. The page keeps the
// summary line and a link to /[lang/]projects/<slug>/space/, which answers the exact section content (from the finished copy
// of the page when there is one); /k/satlz.js fetches it on first open, on #space and on deep links into the section.
const A = '<section class="ks kz" id="space"><details class="kz-d"><summary class="kz-s">';
const PX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?projects\/([a-z0-9-]{1,90})\/space\/$/;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let S = null;
async function strs(env) { if (S) return S; try { const r = await env.ASSETS.fetch(new Request('https://kolaboro.com/_s/kolaboro.com/data/i18n/satlz.json')); if (r.ok) S = await r.json(); } catch (e) {} return S || { v: '1', en: {} }; }
// [start, end] of the section content: after </summary>, before the closing </details></section>
function cut(t) {
  const i = t.indexOf(A); if (i < 0) return null;
  const k = t.indexOf('</summary>', i), j = t.indexOf('</section>', i);
  if (k < 0 || j < 0 || k > j || t.slice(j - 10, j) !== '</details>') return null;
  return [k + 10, j - 10];
}
export async function strip(t, u, nonce, env) {
  const c = cut(t); if (!c) return t;
  const m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?projects\/([a-z0-9-]{1,90})\/$/.exec(u.pathname); if (!m) return t;
  const L = await strs(env), lg = m[1] || 'en', s = Object.assign({}, L.en, L[lg] || {}), body = t.slice(c[0], c[1]);
  const css = (body.match(/\.ksat-(?:src|lim)\{[^}]*\}/g) || []).join('');   // used by the street-level section too
  const ki = (body.match(/<p class="ki">[^<]*<\/p>/) || [''])[0], href = u.pathname + 'space/';
  const ids = (body.match(/ id="[^"]+"/g) || []).map(x => x.slice(5, -1)).filter(x => !/-css$/.test(x)).join(' ');
  const ph = '<div class="ksat-lz" data-lz="' + href + '" data-ids="' + esc(ids) + '" data-ld="' + esc(s.ld) + '" data-er="' + esc(s.er) + '">' + (css ? '<style>' + css + '</style>' : '') + ki +
    '<p><a class="k-btn k-btn--ghost k-btn--sm" href="' + href + '" rel="nofollow">' + esc(s.open) + '</a></p><script src="/k/satlz.js?v=' + esc(L.v) + '" defer' + nonce + '></script></div>';
  return t.slice(0, c[0]) + ph + t.slice(c[1]);
}
// /[lang/]projects/<slug>/space/: the section content (fetch with x-kb-part: 1) or, opened directly, a small page around it
export async function part(req, u, env, ctx, self, ot, finKey) {
  const m = PX.exec(u.pathname); if (!m || (req.method !== 'GET' && req.method !== 'HEAD')) return null;
  const pg = u.pathname.slice(0, -6), pu = new URL(pg, 'https://kolaboro.com'); let t = null;
  try { const hit = typeof caches !== 'undefined' ? await caches.default.match(finKey(pu)) : null; if (hit) t = await hit.text(); } catch (e) {}
  if (!t || !cut(t)) { const r = await self.fetch(new Request(pu.href, { headers: { accept: 'text/html', 'x-kb-ot': ot, 'x-kb-sat': ot } }), env, ctx); t = r.status === 200 ? await r.text() : ''; }
  const c = cut(t); if (!c) return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8', 'x-robots-tag': 'noindex', 'cache-control': 'no-store' } });
  const body = t.slice(c[0], c[1]), h = { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex', 'cache-control': 'public, max-age=300', vary: 'x-kb-part' };
  if (req.headers.get('x-kb-part') === '1') return new Response(req.method === 'HEAD' ? null : body, { headers: h });
  const L = await strs(env), lg = m[1] || 'en', s = Object.assign({}, L.en, L[lg] || {}), n = (body.match(/ nonce="([A-Za-z0-9+/=]+)"/) || [])[1];
  const hd = t.slice(0, t.indexOf('</head>')), h2 = (t.slice(c[0] - 200, c[0]).match(/<h2>(.*?)<\/h2><\/summary>$/) || [])[1] || '';
  const css = (hd.match(/<link rel="stylesheet"[^>]*>/g) || []).join(''), lt = (hd.match(/<html[^>]*>/) || ['<html lang="' + lg + '">'])[0];
  const doc = '<!doctype html>' + lt + '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>' + h2.replace(/<[^>]+>/g, '') + '</title><link rel="canonical" href="https://kolaboro.com' + pg + '">' + css +
    '</head><body><main class="kwrap"><p><a href="' + pg + '">' + esc(s.back) + '</a></p><section class="ks" id="space"><h2>' + h2 + '</h2>' + body + '</section></main></body></html>';
  h['content-security-policy'] = "script-src" + (n ? " 'nonce-" + n + "'" : " 'none'") + "; object-src 'none'; base-uri 'self'; frame-ancestors 'self'";
  return new Response(req.method === 'HEAD' ? null : doc, { headers: h });
}
