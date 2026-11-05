// kolaboro.com satellite images from packs (5-nov-2026). The Pages project has a 20,000-file limit for all its sites,
// so the ~1,567 images under /k/sat/ are published as a few pack files per area plus an index
// (_s/kolaboro.com/k/sat/packs.json: files[path] = [pack, offset, length, content type, sha256], built by
// tools/kolaboro-agent/satpack.py on main). index.js calls serve() only when the original file is not in ASSETS
// (or with ?__pack=1, to verify the pack copy while the original still exists). Every slice is checked against its
// sha256 before it is sent. Rollback: restore the individual files on pub/_lovable; this code is then never reached.
const BASE = '/_s/kolaboro.com/k/sat/';
let IDX = null, IDXP = null;
async function index(env, origin) {
  if (IDX) return IDX;
  if (!IDXP) IDXP = env.ASSETS.fetch(new Request(origin + BASE + 'packs.json'))
    .then(r => { if (r.status !== 200) throw new Error('index ' + r.status); return r.json(); })
    .then(j => (IDX = j.files || {}), e => { IDXP = null; throw e; });
  return IDXP;
}
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const sha256 = async b => hex(await crypto.subtle.digest('SHA-256', b));
const ckey = (origin, sha) => new Request(origin + '/__ksat/' + sha);
// Range read of one image from its pack; if ASSETS ignores Range, the whole pack is read once and every image
// of that pack goes to the Cache API (content-addressed by sha256, so a cached slice can never be stale).
async function bytes(env, ctx, origin, files, e) {
  const [pack, off, len, , sha] = e;
  const cache = caches.default;
  const hit = await cache.match(ckey(origin, sha));
  if (hit) { const b = await hit.arrayBuffer(); if (b.byteLength === len && await sha256(b) === sha) return b; }
  const r = await env.ASSETS.fetch(new Request(origin + BASE + pack, { headers: { range: 'bytes=' + off + '-' + (off + len - 1) } }));
  if (r.status === 206) { const b = await r.arrayBuffer(); if (b.byteLength === len && await sha256(b) === sha) return b; }
  else if (r.status !== 200) { await r.body?.cancel(); return null; }
  const whole = r.status === 200 ? await r.arrayBuffer() : await (await env.ASSETS.fetch(new Request(origin + BASE + pack))).arrayBuffer();
  const b = whole.slice(off, off + len);
  if (b.byteLength !== len || await sha256(b) !== sha) return null;
  ctx.waitUntil((async () => {
    for (const x of Object.values(files)) if (x[0] === pack && x[1] + x[2] <= whole.byteLength)
      await cache.put(ckey(origin, x[4]), new Response(whole.slice(x[1], x[1] + x[2]), { headers: { 'content-type': x[3], 'cache-control': 'public, max-age=31536000, immutable' } }));
  })().catch(() => {}));
  return b;
}
// Returns a Response for an indexed image, or null (caller keeps its own 404).
export async function serve(req, u, env, ctx) {
  const rel = decodeURIComponent(u.pathname.slice('/k/sat/'.length));
  if (!rel || rel.includes('..') || !/^[a-z0-9][a-z0-9-]*\//.test(rel)) return null;
  const files = await index(env, u.origin);
  const e = Object.prototype.hasOwnProperty.call(files, rel) ? files[rel] : null;
  if (!e) return null;
  const [, , len, type, sha] = e, etag = '"' + sha + '"';
  const h = new Headers({ 'content-type': type, etag, 'cache-control': /[?&]v=/.test(u.search) ? 'public, max-age=31536000, immutable' : 'public, max-age=2592000',
    'access-control-allow-origin': '*', 'referrer-policy': 'strict-origin-when-cross-origin', 'x-content-type-options': 'nosniff', 'x-kb-sat': 'pack' });
  const inm = req.headers.get('if-none-match') || '';
  if (inm && (inm.trim() === '*' || inm.split(',').some(t => t.trim().replace(/^W\//, '') === etag))) return new Response(null, { status: 304, headers: h });
  h.set('content-length', String(len));
  if (req.method === 'HEAD') return new Response(null, { status: 200, headers: h });
  const b = await bytes(env, ctx, u.origin, files, e);
  if (!b) return new Response('Satellite image temporarily unavailable', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'retry-after': '60' } });
  return new Response(b, { status: 200, headers: h });
}
