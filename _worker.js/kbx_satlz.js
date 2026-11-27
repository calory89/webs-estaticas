// n40 k51: #space content of project pages sent on open (/k/satlz.js), served exactly by /[lang/]projects/<slug>/space/; templates in data/i18n/satlz.json
const A = '<section class="ks kz" id="space"><details class="kz-d"><summary class="kz-s">', NF = { status: 404, headers: { 'cache-control': 'no-store' } };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => '&#' + c.charCodeAt(0) + ';');
const fill = (tp, v) => tp.replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : '');
let S = null;
async function strs(env, lg) { if (!S) { try { const r = await env.ASSETS.fetch(new Request('https://kolaboro.com/_s/kolaboro.com/data/i18n/satlz.json')); if (r.ok) S = await r.json(); } catch (e) {} } const L = S || { en: {} }, o = {}; for (const k in L.en) o[k] = esc((L[lg] || {})[k] || L.en[k]); return [L, o]; }
function cut(t) {
  const i = t.indexOf(A), k = t.indexOf('</summary>', i), j = t.indexOf('</section>', i);
  return i < 0 || k < 0 || k > j || t.slice(j - 10, j) !== '</details>' ? null : [k + 10, j - 10];
}
export async function strip(r, u, nonce, env) {
  const m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?projects\/[a-z0-9-]{1,90}\/$/.exec(u.pathname); if (!m || !/text\/html/.test(r.headers.get('content-type') || '')) return r;
  const t = await r.text(), h = new Headers(r.headers), c = cut(t); h.delete('content-length'); if (!c) return new Response(t, { status: 200, headers: h });
  const [L, s] = await strs(env, m[1] || 'en'), b = t.slice(c[0], c[1]);
  Object.assign(s, { h: u.pathname + 'space/', n: nonce, css: (b.match(/\.ksat-(?:src|lim)\{[^}]*\}/g) || []).join(''), ki: (b.match(/<p class="ki">[^<]*<\/p>/) || [''])[0], ids: esc((b.match(/ id="[^"]+"/g) || []).map(x => x.slice(5, -1)).filter(x => !/-css$/.test(x)).join(' ')) });
  return new Response(t.slice(0, c[0]) + fill(L.ph, s) + t.slice(c[1]), { status: 200, headers: h });
}
export async function part(req, u, env, ctx, self, ot, finKey) {
  const lg = (/^\/(es|de|fr|nl|ru|zh|ar)\//.exec(u.pathname) || [0, 'en'])[1], pg = u.pathname.slice(0, -6), pu = new URL(pg, 'https://kolaboro.com'); let t = null;
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  try { const hit = await caches.default.match(finKey(pu)); if (hit) t = await hit.text(); } catch (e) {}
  if (!t || !cut(t)) { const r = await self.fetch(new Request(pu.href, { headers: { accept: 'text/html', 'x-kb-ot': ot, 'x-kb-sat': ot } }), env, ctx); t = r.status === 200 ? await r.text() : ''; }
  const c = cut(t); if (!c) return new Response('Not found', NF);
  const b = t.slice(c[0], c[1]), h = { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex', 'cache-control': 'public, max-age=300', vary: 'x-kb-part' };
  if (req.headers.get('x-kb-part') === '1') return new Response(req.method === 'HEAD' ? null : b, { headers: h });
  const [L, s] = await strs(env, lg), n = (b.match(/ nonce="([A-Za-z0-9+/=]+)"/) || [0, 'none'])[1], hd = t.slice(0, t.indexOf('</head>')), h2 = (t.slice(c[0] - 300, c[0]).match(/<h2>(.*?)<\/h2><\/summary>$/) || [])[1] || '';
  Object.assign(s, { pg, b, h2, t: h2.replace(/<[^>]+>/g, ''), css: (hd.match(/<link rel="stylesheet"[^>]*>/g) || []).join(''), html: (hd.match(/<html[^>]*>/) || ['<html>'])[0] });
  h['content-security-policy'] = "script-src 'nonce-" + n + "'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'";
  return new Response(req.method === 'HEAD' ? null : fill(L.doc, s), { headers: h });
}
