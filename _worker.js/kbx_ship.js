// Feature module 'ship' for kolaboro.com (see kbx.js): shipping: daily ship log, streak, engineering metrics, roadmap sync, feeds.
// Batch 6 (5 Nov 2026). Endpoints live under /api/x/ship/.
//   GET /api/x/ship/badge.svg   embeddable badge "shipped today: N changes, streak D days" (CORS open, cached 5 minutes)
//   GET /api/x/ship/today       the same figures as JSON
// Data: /data/shipping.json, built hourly by GitHub Actions from the git history of the live branch (tools/kolaboro-ship on main).
import * as KB from './kolaboro.js';
const { json } = KB;
export const PATHS = /^\/api\/x\/ship(\/|$)/;

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, HEAD, OPTIONS', 'access-control-max-age': '86400' };

async function load(env) {
  try {
    const r = await env.ASSETS.fetch(new Request('https://kolaboro.com/_s/kolaboro.com/data/shipping.json'));
    if (!r.ok) return null;
    return await r.json();
  } catch (e) { return null; }
}

// Figures for "now" (UTC): today's ships, and the streak recomputed from the day list so a stale file never claims a streak
// that has already ended (a day with no ship ends the streak once that day is over).
function figures(d) {
  const today = new Date().toISOString().slice(0, 10);
  const ships = {};
  for (const x of (d && d.days) || []) ships[x.date] = x.ships || 0;
  const n = ships[today] || 0;
  let streak = 0;
  const t = new Date(today + 'T00:00:00Z');
  if (!n) t.setUTCDate(t.getUTCDate() - 1);
  while (ships[t.toISOString().slice(0, 10)]) { streak++; t.setUTCDate(t.getUTCDate() - 1); }
  return { today, shipped_today: n, streak_days: streak, longest_streak_days: d && d.streak ? d.streak.longest : null,
    data_built_at: d ? d.generated_at : null, stale: !!(d && d.today !== today && d.generated_at && Date.now() - Date.parse(d.generated_at) > 3 * 3600e3) };
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Width estimate for Verdana 11px (as used by common badges): ~6.2 px per character plus padding.
const w = s => Math.round(s.length * 6.2 + 12);

function badge(f) {
  const l = 'kolaboro shipped today';
  const r = f ? `${f.shipped_today} change${f.shipped_today === 1 ? '' : 's'}, streak ${f.streak_days} day${f.streak_days === 1 ? '' : 's'}` : 'starting';
  const lw = w(l), rw = w(r), W = lw + rw;
  const col = f && f.shipped_today ? '#086146' : '#4A5661';
  const title = f ? `Kolaboro shipped today: ${r} (UTC, from the git history of the live site)` : 'Kolaboro shipping log: starting';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="20" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>` +
    `<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>` +
    `<clipPath id="r"><rect width="${W}" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#r)"><rect width="${lw}" height="20" fill="#17212B"/>` +
    `<rect x="${lw}" width="${rw}" height="20" fill="${col}"/><rect width="${W}" height="20" fill="url(#s)"/></g>` +
    `<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">` +
    `<text x="${lw / 2}" y="15" fill="#010101" fill-opacity=".3">${esc(l)}</text><text x="${lw / 2}" y="14">${esc(l)}</text>` +
    `<text x="${lw + rw / 2}" y="15" fill="#010101" fill-opacity=".3">${esc(r)}</text><text x="${lw + rw / 2}" y="14">${esc(r)}</text></g></svg>`;
}

export async function handle(req, u, env, ctx) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('method not allowed', { status: 405, headers: CORS });
  const p = u.pathname.replace(/\/+$/, '');
  if (p === '/api/x/ship/badge.svg') {
    const d = await load(env);
    const f = d ? figures(d) : null;
    return new Response(req.method === 'HEAD' ? null : badge(f), { headers: { ...CORS, 'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=300', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'" } });
  }
  if (p === '/api/x/ship/today' || p === '/api/x/ship') {
    const d = await load(env);
    if (!d) return new Response(JSON.stringify({ status: 'starting', note: 'the shipping log has not been built yet' }), { status: 200, headers: { ...CORS, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=60' } });
    const f = figures(d);
    return new Response(JSON.stringify({ ...f, page: 'https://kolaboro.com/shipping/', data: 'https://kolaboro.com/data/shipping.json', badge: 'https://kolaboro.com/api/x/ship/badge.svg',
      method: 'Ships are commits by people (or software working for one) on the live branch; UTC days. Streak recomputed at request time from the day list.' }, null, 1),
      { headers: { ...CORS, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300' } });
  }
  return json({ error: 'not found', module: 'ship', endpoints: ['/api/x/ship/badge.svg', '/api/x/ship/today'] }, 404);
}
