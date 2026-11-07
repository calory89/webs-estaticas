// kolaboro.com "Payments vs progress" (batch 14, pay16): public, cacheable per-project series for the buyer portal chart.
// GET /api/x/pay/series/<ID> -> the project's monthly Sentinel-2 change index (same numbers as the "Construction progress from space"
// section of its named page, kbx_named_sat.js) and the developer's promised dates. Buyers' own instalments never reach this endpoint:
// they live in kolaboro_pay_schedules behind the session-checked kolaboro_pay_schedule function and are compared in the browser.
// No model calls. Projects in conflict-of-interest markets are not named (kbx_named.js data()), so they get no series here either.
import { data } from './kbx_named.js';
import { satData, index, milestones, BAND } from './kbx_named_sat.js';

export const PATHS = /^\/api\/x\/pay\/series\/[A-Za-z0-9-]{3,20}$/;
const H = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' };
const out = (o, st, cc) => new Response(JSON.stringify(o), { status: st || 200, headers: Object.assign({ 'cache-control': cc || 'public, max-age=600' }, H) });

export async function handle(req, u, env) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: 'method' }, 405, 'no-store');
  const id = decodeURIComponent(u.pathname.split('/').pop()).toUpperCase();
  let ix = null, sat = null;
  try { ix = await data(env); } catch (e) { ix = null; }
  try { sat = await satData(env); } catch (e) { sat = null; }
  if (!ix) return out({ error: 'unavailable' }, 503, 'no-store');
  const x = ix.byId.get(id);
  if (!x) return out({ id, named: false, series: null, reason: 'not_named', milestones: [] });
  const ms = milestones(ix.prom[id] || [], x.fx || {}).map(o => ({ k: o.k, d: o.d, old: o.old }));
  const rec = sat && sat.projects && sat.projects[id];
  const base = { id, named: true, name: x.n || null, url: '/projects/' + x.s + '/', milestones: ms, band: BAND };
  if (!rec || !rec.n || !rec.m0) return out(Object.assign(base, { series: null, reason: 'no_plot_pin' }));
  const ix2 = index(rec);
  return out(Object.assign(base, {
    series: {
      m0: rec.m0, n: rec.n, clear: rec.c, date: rec.dt, y: ix2 ? ix2.y : null, base: rec.base || null,
      reason: ix2 ? null : (rec.c.some(v => v != null) ? 'few_clear' : 'no_scene'),
    },
    updated: sat.updated, resolution_m: sat.resolution_m, radius_m: sat.radius_m,
    source: { attribution: sat.source.attribution, url: sat.source.url, licence_url: sat.source.licence_url, method: '/data/construction-progress.json' },
    page_section: '/projects/' + x.s + '/#space',
  }));
}
