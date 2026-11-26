// n40 d12: CSS from Brotli 11 copies k/br/<name>.<sha1 10 of the source>.css.br (scratchpad n40/d12/brcss.sh); no fresh copy = served as before
const ORIGIN = 'https://kolaboro.com', H = {};
export const CSSBR = /^\/k\/(site|site-p|ds-site|ds)\.css$/;
async function sha10(buf) { const d = new Uint8Array(await crypto.subtle.digest('SHA-1', buf)); let s = ''; for (let i = 0; i < 5; i++) s += d[i].toString(16).padStart(2, '0'); return s; }
export async function serve(req, u, env) {
  if (req.method !== 'GET' || req.headers.get('range') || !/\bbr\b/.test(req.headers.get('accept-encoding') || '')) return null;
  if (u.search && !/^\?v=[\w.-]{1,40}$/.test(u.search)) return null;
  const m = CSSBR.exec(u.pathname); if (!m) return null;
  const src = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + u.pathname)); if (!src.ok) return null;
  const tag = src.headers.get('etag') || '', c = H[m[1]];
  let v = c && tag && c.tag === tag ? c.v : null;
  if (v) { try { await src.body.cancel(); } catch (e) {} } else { v = await sha10(await src.arrayBuffer()); H[m[1]] = { tag, v }; }
  const b = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/k/br/' + m[1] + '.' + v + '.css.br')); if (!b.ok) { try { await b.body.cancel(); } catch (e) {} return null; }
  return new Response(b.body, { status: 200, encodeBody: 'manual', headers: { 'content-type': 'text/css; charset=utf-8', 'content-encoding': 'br', vary: 'accept-encoding', etag: '"br-' + v + '"', 'cache-control': u.search ? 'public, max-age=31536000, immutable' : 'public, max-age=3600', 'x-content-type-options': 'nosniff', 'x-kolaboro-precompressed': 'br11' } });
}
