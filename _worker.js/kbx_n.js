// comments: _notes/kolaboro-worker-comments.txt
import { signBody } from './kolaboro.js';
import { TB } from './kbx_strings.js';
export const PATHS = /^\/api\/x\/n(\/|$)/;
const ORIGIN = 'https://kolaboro.com';
const FILES = { manifest: '/data/site-manifest.json', builds: '/data/builds.json', registry: '/k/prov.json' };
function hdrs(env, maxAge, extra) {
const h = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=' + maxAge, 'access-control-allow-origin': '*', 'access-control-expose-headers': TB.kbx_n__t.EXPOSE, 'x-content-type-options': 'nosniff' };
if (env && env.CF_PAGES_COMMIT_SHA) h['x-kolaboro-build'] = env.CF_PAGES_COMMIT_SHA;
return Object.assign(h, extra || {});
}
function plain(env, o, status, maxAge) { return new Response(JSON.stringify(o, null, 1), { status: status || 200, headers: hdrs(env, maxAge == null ? 60 : maxAge) }); }
async function signedText(env, body, maxAge, src) {
const h = hdrs(env, maxAge, src ? { 'x-kolaboro-source': src } : null);
try { const sg = await signBody(env, body); if (sg) { h['x-kolaboro-signature'] = sg; h['x-kolaboro-key-id'] = (env && env.KB_SIGN_KID) || 'kb'; } } catch (e) {}
return new Response(body, { headers: h });
}
async function asset(env, path) {
try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + path)); if (!r.ok) return null; return await r.text(); } catch (e) { return null; }
}
// n40 k33: /api/x/n/src?path=/about/index.html returns one published file as stored in the deploy, unchanged (the HTML decorations
// added per response are not applied), as text/plain with no-store, so /verify#page can hash the source the manifest lists
async function src(env, u) {
const f = u.searchParams.get('path') || '';
if (!/^\/(?!data\/)[A-Za-z0-9._~\/-]{1,200}\.(?:html|js|mjs|css|json|txt|xml|svg)$/.test(f) || /\.\.|\/\//.test(f)) return plain(env, { error: 'bad_path' }, 400, 0);
let q = '/_s/kolaboro.com' + f.replace(/\/index\.html$/, '/').replace(/\.html$/, ''), r;
for (let i = 0; i < 3; i++) { try { r = await env.ASSETS.fetch(new Request(ORIGIN + q)); } catch (e) { r = null; break; } if (r.status < 300 || r.status > 399) break; const l = new URL(r.headers.get('location') || '', ORIGIN); if (!l.pathname.startsWith('/_s/kolaboro.com/')) { r = null; break; } q = l.pathname; }
if (!r || r.status !== 200) return plain(env, { error: 'not_found', path: f }, 404, 0);
return new Response(await r.arrayBuffer(), { headers: hdrs(env, 0, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-kolaboro-source': f, 'content-security-policy': "default-src 'none'; sandbox" }) });
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
if (k === 'src') return src(env, u);
if (!FILES[k]) return plain(env, { error: 'not_found', see: '/api/x/n/' }, 404, 60);
const body = await asset(env, FILES[k]);
if (body == null) return plain(env, { state: 'starting', error: 'not_published_yet', file: FILES[k], note: TB.kbx_n__s.k4 }, 200, 30);
return signedText(env, body, k === 'registry' ? 300 : 60, FILES[k]);
}
