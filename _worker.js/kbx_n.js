// Feature module n for kolaboro.com (see kbx.js): provenance. Number lineage, page integrity, reproducible builds.
// GET /api/x/n/            what this module serves
// GET /api/x/n/manifest    the site manifest (path -> SHA-256 of every published file outside /data/), made by a GitHub Actions job
//                          from the git commit that was live, served byte for byte and signed with the open API key (signBody)
// GET /api/x/n/builds      deterministic esbuild bundles of _worker.js, one SHA-256 per worker source tree, made by the same job
// GET /api/x/n/registry    the number provenance registry (/k/prov.json), signed
// The signature covers the exact body: 'kolaboro-sig-v1\n' + SHA-256 hex of the body, Ed25519, keys at /.well-known/kolaboro-keys.json.
import { signBody } from './kolaboro.js';
import { TB } from './kbx_strings.js';

export const PATHS = /^\/api\/x\/n(\/|$)/;
const ORIGIN = 'https://kolaboro.com';
const FILES = { manifest: '/data/site-manifest.json', builds: '/data/builds.json', registry: '/k/prov.json' };
const EXPOSE = 'x-kolaboro-signature, x-kolaboro-key-id, x-kolaboro-build, x-kolaboro-source';

function hdrs(env, maxAge, extra) {
  const h = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=' + maxAge, 'access-control-allow-origin': '*', 'access-control-expose-headers': EXPOSE, 'x-content-type-options': 'nosniff' };
  if (env && env.CF_PAGES_COMMIT_SHA) h['x-kolaboro-build'] = env.CF_PAGES_COMMIT_SHA;
  return Object.assign(h, extra || {});
}
function plain(env, o, status, maxAge) { return new Response(JSON.stringify(o, null, 1), { status: status || 200, headers: hdrs(env, maxAge == null ? 60 : maxAge) }); }
async function signedText(env, body, maxAge, src) {
  const h = hdrs(env, maxAge, src ? { 'x-kolaboro-source': src } : null);
  try { const sg = await signBody(env, body); if (sg) { h['x-kolaboro-signature'] = sg; h['x-kolaboro-key-id'] = (env && env.KB_SIGN_KID) || 'kb'; } } catch (e) {}
  return new Response(body, { headers: h });
}
async function asset(env, path) {   // a published file, read from the deployed assets (no network)
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + path)); if (!r.ok) return null; return await r.text(); } catch (e) { return null; }
}

export async function handle(req, u, env, ctx) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-max-age': '86400' } });
  if (req.method !== 'GET' && req.method !== 'HEAD') return plain(env, { error: 'method_not_allowed' }, 405, 0);
  const p = u.pathname.replace(/\/+$/, '');
  if (p === '/api/x/n') return plain(env, {
    about: TB.kbx_n__s.k0,
    endpoints: {
      '/api/x/n/manifest': TB.kbx_n__s.k1 + FILES.manifest + ' byte for byte, signed.',
      '/api/x/n/builds': TB.kbx_n__s.k2 + FILES.builds + ' byte for byte, signed.',
      '/api/x/n/registry': 'The number provenance registry ' + FILES.registry + ', signed.'
    },
    signature: TB.kbx_n__s.k3,
    check_in_browser: ['/verify#page', '/verify#builds', '/verify#numbers']
  }, 200, 300);
  const k = p.slice('/api/x/n/'.length);
  if (!FILES[k]) return plain(env, { error: 'not_found', see: '/api/x/n/' }, 404, 60);
  const body = await asset(env, FILES[k]);
  if (body == null) return plain(env, { state: 'starting', error: 'not_published_yet', file: FILES[k], note: TB.kbx_n__s.k4 }, 200, 30);
  return signedText(env, body, k === 'registry' ? 300 : 60, FILES[k]);
}
