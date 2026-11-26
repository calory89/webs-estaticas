// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_ship__q, $s = TB.kbx_ship__s, $t = TB.kbx_ship__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import * as KB from './kolaboro.js';
import { TB } from './kbx_strings.js';
const { json } = KB;
export const PATHS = /^\/api\/x\/ship(\/|$)/;
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, HEAD, OPTIONS', 'access-control-max-age': '86400' };
async function load(env) {
try {
const r = await env.ASSETS.fetch(new Request($t.k0));
if (!r.ok) return null;
return await r.json();
} catch (e) { return null; }
}
function figures(d) {
const today = new Date().toISOString().slice(0, 10);
const ships = {};
for (const x of (d && d.days) || []) ships[x.date] = x.ships || 0;
const n = ships[today] || 0;
let streak = 0;
const t = new Date(today + $q.a);
if (!n) t.setUTCDate(t.getUTCDate() - 1);
while (ships[t.toISOString().slice(0, 10)]) { streak++; t.setUTCDate(t.getUTCDate() - 1); }
return { today, shipped_today: n, streak_days: streak, longest_streak_days: d && d.streak ? d.streak.longest : null,
data_built_at: d ? d.generated_at : null, stale: !!(d && d.today !== today && d.generated_at && Date.now() - Date.parse(d.generated_at) > 3 * 3600e3) };
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.b }[c]));
const w = s => Math.round(s.length * 6.2 + 12);
function badge(f) {
  const l = $q.c;
  const r = f ? `${f.shipped_today} change${f.shipped_today === 1 ? '' : 's'}, streak ${f.streak_days} day${f.streak_days === 1 ? '' : 's'}` : $q.d;
  const lw = w(l), rw = w(r), W = lw + rw;
  const col = f && f.shipped_today ? $q.e : $q.f;
  const title = f ? `Kolaboro shipped today: ${r} (UTC, from the git history of the live site)` : $q.g;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="20" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>` +
    $q.h +
    `<clipPath id="r"><rect width="${W}" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#r)"><rect width="${lw}" height="20" fill="#17212B"/>` +
    `<rect x="${lw}" width="${rw}" height="20" fill="${col}"/><rect width="${W}" height="20" fill="url(#s)"/></g>` +
    $q.i +
    `<text x="${lw / 2}" y="15" fill="#010101" fill-opacity=".3">${esc(l)}</text><text x="${lw / 2}" y="14">${esc(l)}</text>` +
    `<text x="${lw + rw / 2}" y="15" fill="#010101" fill-opacity=".3">${esc(r)}</text><text x="${lw + rw / 2}" y="14">${esc(r)}</text></g></svg>`;
}
export async function handle(req, u, env, ctx) {
if (req.method === $q.j) return new Response(null, { status: 204, headers: CORS });
if (req.method !== 'GET' && req.method !== 'HEAD') return new Response($q.k, { status: 405, headers: CORS });
const p = u.pathname.replace(/\/+$/, '');
if (p === $q.l) {
const d = await load(env);
const f = d ? figures(d) : null;
return new Response(req.method === 'HEAD' ? null : badge(f), { headers: { ...CORS, 'content-type': $q.m,
'cache-control': $q.n, 'x-content-type-options': $q.o, 'content-security-policy': $t.k1 } });
}
if (p === $q.p || p === $q.q) {
const d = await load(env);
if (!d) return new Response(JSON.stringify({ status: $q.d, note: $t.k2 }), { status: 200, headers: { ...CORS, 'content-type': $q.r, 'cache-control': $q.s } });
const f = figures(d);
return new Response(JSON.stringify({ ...f, page: $q.t, data: $t.k3, badge: $t.k4,
method: $s.k0 }, null, 1),
{ headers: { ...CORS, 'content-type': $q.r, 'cache-control': $q.u } });
}
return json({ error: $q.v, module: 'ship', endpoints: [$q.l, $q.p] }, 404);
}
