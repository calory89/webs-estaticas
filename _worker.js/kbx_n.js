// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_n__q, $s = TB.kbx_n__s, $t = TB.kbx_n__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { signBody } from './kolaboro.js';
import { TB } from './kbx_strings.js';
export const PATHS = /^\/api\/x\/n(\/|$)/;
const ORIGIN = 'https://kolaboro.com';
const FILES = { manifest: '/data/site-manifest.json', builds: '/data/builds.json', registry: '/k/prov.json' };
function hdrs(env, maxAge, extra) {
const h = { 'content-type': $q.a, 'cache-control': $q.b + maxAge, 'access-control-allow-origin': '*', 'access-control-expose-headers': $t.EXPOSE, 'x-content-type-options': $q.c };
if (env && env.CF_PAGES_COMMIT_SHA) h[$q.d] = env.CF_PAGES_COMMIT_SHA;
return Object.assign(h, extra || {});
}
function plain(env, o, status, maxAge) { return new Response(JSON.stringify(o, null, 1), { status: status || 200, headers: hdrs(env, maxAge == null ? 60 : maxAge) }); }
async function signedText(env, body, maxAge, src) {
const h = hdrs(env, maxAge, src ? { 'x-kolaboro-source': src } : null);
try { const sg = await signBody(env, body); if (sg) { h[$q.e] = sg; h[$q.f] = (env && env.KB_SIGN_KID) || 'kb'; } } catch (e) {}
return new Response(body, { headers: h });
}
async function asset(env, path) {
try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.g + path)); if (!r.ok) return null; return await r.text(); } catch (e) { return null; }
}
// n40 k33: /api/x/n/src?path=/about/index.html returns one published file as stored in the deploy, unchanged (the HTML decorations
// added per response are not applied), as text/plain with no-store, so /verify#page can hash the source the manifest lists
async function src(env, u) {
const f = u.searchParams.get('path') || '';
if (!/^\/(?!data\/)[A-Za-z0-9._~\/-]{1,200}\.(?:html|js|mjs|css|json|txt|xml|svg)$/.test(f) || /\.\.|\/\//.test(f)) return plain(env, { error: $q.h }, 400, 0);
let q = $q.g + f.replace(/\/index\.html$/, '/').replace(/\.html$/, ''), r;
for (let i = 0; i < 3; i++) { try { r = await env.ASSETS.fetch(new Request(ORIGIN + q)); } catch (e) { r = null; break; } if (r.status < 300 || r.status > 399) break; const l = new URL(r.headers.get($q.i) || '', ORIGIN); if (!l.pathname.startsWith($q.j)) { r = null; break; } q = l.pathname; }
if (!r || r.status !== 200) return plain(env, { error: $q.k, path: f }, 404, 0);
return new Response(await r.arrayBuffer(), { headers: hdrs(env, 0, { 'content-type': $q.l, 'cache-control': $q.m, 'x-kolaboro-source': f, 'content-security-policy': $q.n }) });
}
export async function handle(req, u, env, ctx) {
if (req.method === $q.o) return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': $q.p, 'access-control-max-age': '86400' } });
if (req.method !== 'GET' && req.method !== 'HEAD') return plain(env, { error: $q.q }, 405, 0);
const p = u.pathname.replace(/\/+$/, '');
if (p === $q.r) return plain(env, {
about: $s.k0,
endpoints: {
'/api/x/n/manifest': $s.k1 + FILES.manifest + $q.s,
'/api/x/n/builds': $s.k2 + FILES.builds + $q.s,
'/api/x/n/registry': $q.t + FILES.registry + $q.u
},
signature: $s.k3,
check_in_browser: [$q.v, $q.w, $q.x]
}, 200, 300);
const k = p.slice($q.y.length);
if (k === 'src') return src(env, u);
if (!FILES[k]) return plain(env, { error: $q.k, see: $q.y }, 404, 60);
const body = await asset(env, FILES[k]);
if (body == null) return plain(env, { state: $q.z, error: $q.A, file: FILES[k], note: $s.k4 }, 200, 30);
return signedText(env, body, k === $q.B ? 300 : 60, FILES[k]);
}
