// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_disc__q, $s = TB.kbx_disc__s, $t = TB.kbx_disc__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import * as KB from './kolaboro.js';
import { TB } from './kbx_strings.js';
const { json } = KB;
export const PATHS = /^\/api\/x\/disc(\/|$)/;
const MEMO = {};
async function load(env, name) {
const m = MEMO[name];
if (m && Date.now() - m.t < 120000) return m.v;
let v = null;
try {
let r = null;
if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request($q.a + name));
if (!r || !r.ok) r = await fetch($q.a + name, { cf: { cacheTtl: 600, cacheEverything: true } });
if (r.ok) v = await r.json();
} catch (e) { v = null; }
MEMO[name] = { t: Date.now(), v };
return v;
}
function out(o, s = 200, maxAge = 300) {
  return new Response(JSON.stringify(o), { status: s, headers: { 'content-type': $q.b, 'cache-control': maxAge ? $q.c + maxAge : $q.d, 'access-control-allow-origin': '*' } });
}
const ID_RE = /^[A-Z]{2,5}-\d{3,4}$/;
const CK = [['permit', 'permit or licence number'], ['escrow', 'deposit protection'], ['progress', 'construction progress'], ['plans', 'site or floor plans'], ['record', 'developer track record'], ['returns_ok', 'no guaranteed returns']];
const BANDS = ['Under $100k', '$100k to $200k', '$200k to $400k', '$400k and up'];
function pub(c, k) {
  const v = (c.checks || {})[k];
  if (k === $q.e) return v === 2 ? 'y' : v === 1 ? 'p' : 'n';
  if (k === $q.f) return v === true ? 'y' : 'n';
  if (k === $q.g) return v != null ? 'y' : 'n';
  return v ? 'y' : 'n';
}
async function cases(env) {
const d = await load(env, $q.h);
if (!d || !Array.isArray(d.cases)) return null;
if (!d._by) { d._by = {}; d.cases.forEach(c => { if (c && c.id) d._by[c.id] = c; }); }
return d;
}
async function points(env) {
const d = await cases(env);
if (!d) return out({ error: $q.i }, 503, 0);
const sj = await load(env, $q.j);
const mp = (sj && sj.market_points) || await load(env, $q.k);
const rows = d.cases.filter(c => c && c.id && c.market).map(c => [c.id, c.market, c.country, c.stage || '', c.tier || '', c.band || '', c.score || 0, c.max || 6, c.region && c.region !== c.market ? c.region : '']);
return out({
updated: d.updated || null,
keys: ['id', $q.l, $q.m, 'stage', 'tier', 'band', 'score', 'max', 'area'],
rows,
points: mp ? { status: 'ready', generated: mp.generated, method: mp.method, sources: mp.sources, counts: mp.counts, markets: mp.markets, unplaced: mp.unplaced || [] } : { status: $q.n, note: $s.k0 }
}, 200, 600);
}
function shared(a, b) {
  const s = [];
  if (a.market === b.market) s.push($q.o + a.market + ')');
  else if (a.country === b.country) s.push($q.p + a.country + ')');
  if (a.stage && a.stage === b.stage) s.push($q.q + a.stage + ')');
  const ia = BANDS.indexOf(a.band), ib = BANDS.indexOf(b.band);
  if (ia >= 0 && ia === ib) s.push($q.r + a.band + ')');
  else if (ia >= 0 && ib >= 0 && Math.abs(ia - ib) === 1) s.push($q.s + b.band + ')');
  const both = CK.filter(k => pub(a, k[0]) === 'y' && pub(b, k[0]) === 'y').map(k => k[1]);
  const neither = CK.filter(k => pub(a, k[0]) !== 'y' && pub(b, k[0]) !== 'y').map(k => k[1]);
  if (both.length) s.push($q.t + both.join(', '));
  if (neither.length) s.push($q.u + neither.join(', '));
  if (a.title && a.title === b.title) s.push($q.v + String(a.title).replace(/_/g, ' ') + ')');
  return s;
}
async function similar(env, id) {
const d = await cases(env);
if (!d) return out({ error: $q.i }, 503, 0);
const a = d._by[id];
if (!a) return out({ error: $q.w, id }, 404, 300);
const S = await load(env, $q.j);
if (!S || !S.projects) return out({ id, status: $q.n, note: $t.k0, items: [] }, 200, 120);
const L = (S.projects[id] || []).map(r => {
const b = d._by[r[0]];
if (!b) return null;
return { id: b.id, score: r[1], text: r[2], struct: r[3], market: b.market, country: b.country, area: b.region && b.region !== b.market ? b.region : '', stage: b.stage || '', band: b.band || '', tier: b.tier || '', pub: b.score || 0, max: b.max || 6, shared: shared(a, b) };
}).filter(Boolean);
return out({ id, status: 'ready', generated: S.generated, dataset_updated: S.dataset_updated, model: S.model, weights: S.weights, text_fields: S.text_fields, items: L, source: $q.x }, 200, 600);
}
const KINDS = [
['seen', 'First seen and checked'], ['page', 'Developer page changes'], ['promise', 'Promises and their status'], ['register', 'Register checks'],
['satellite', 'Satellite readings'], ['delay', 'Delay moves'], ['hazard', 'Hazards read'], ['reply', 'Developer replies']
];
const MON = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
function iso(s) {
  s = String(s || '');
  let m = /^(\d{4}-\d{2}-\d{2})/.exec(s); if (m) return m[1];
  m = /^(\d{1,2}) ([A-Z][a-z]{2})[a-z]* (\d{4})$/.exec(s); if (m && MON[m[2]]) return m[3] + '-' + MON[m[2]] + '-' + m[1].padStart(2, '0');
  return null;
}
function nv(x) { return x == null ? 'n/a' : x; }
function fmtv(v) { return v === true ? 'yes' : v === false ? 'no' : v == null ? $q.y : String(v); }
async function timeline(env, id) {
const d = await cases(env);
if (!d) return out({ error: $q.i }, 503, 0);
const c = d._by[id];
if (!c) return out({ error: $q.w, id }, 404, 300);
const [drift, vd, prom, reg, stall, night, haz, ot] = await Promise.all([$q.z, $q.A, $q.B, $q.C, $q.D, $q.E, $q.F, $q.G].map(n => load(env, n)));
const E = [], files = {};
const add = (kind, date, text, src, link, extra) => { const dt = iso(date); if (!dt) return; E.push(Object.assign({ kind, date: dt, text, src, link: link || null }, extra || {})); files[src] = (files[src] || 0) + 1; };
const F = n => $q.H + n;
const dr = drift && drift.projects && drift.projects[id];
if (dr && dr.first) add('seen', dr.first, $t.k1 + dr.copies + $q.I + dr.versions + $q.J + (dr.versions === 1 ? '' : 's') + $q.K + dr.last + ')', F($q.z));
if (c.invited) add('seen', c.invited, $t.k2, F($q.h), $q.L);
if (c.read && c.checked) add('seen', c.checked, $t.k3 + (c.score || 0) + ' of ' + (c.max || 6) + $q.M + (c.vscore || 0) + $q.N, F($q.h), $q.O + id);
if (c.fp && c.fp.date) add('seen', c.fp.date, $q.P + String(c.fp.sha256 || '').slice(0, 12) + '...)', F($q.h), $q.Q);
(c.history || []).forEach(h => add('page', h.d, $q.R + h.f + $q.S + fmtv(h.from) + ' to ' + fmtv(h.to) + ')', F($q.h)));
if (dr) (dr.changes || []).forEach(x => add('page', x.first_seen, $q.T + x.label + $q.S + fmtv(x.from) + ' to ' + fmtv(x.to) + ')' + (x.reverted ? $q.U : ''), F($q.z)));
const vp = vd && (vd.projects || []).find(p => p.id === id);
if (vp) {
if (vp.baseline) add('page', vp.baseline, $t.k4, F($q.A), $q.V);
(vp.changes || []).forEach(x => add('page', x.date, $t.k5 + x.area_pct + $q.W + x.before_date, F($q.A), $q.V));
}
const PL = (prom && prom.projects && prom.projects[id]) || [];
PL.forEach(p => {
const kind = (prom.kinds && prom.kinds[p.k]) || p.k;
const hist = p.hist || [];
hist.forEach((h, i) => add($q.X, h.seen, $q.Y + kind + ' by ' + h.d + $q.S + (h.src === 'page' ? $q.Z : $q.aa) + ')', F($q.B), $q.ab + id,
i === hist.length - 1 ? { status: p.st, status_note: (prom.statuses || {})[p.st] || '' } : null));
if (p.mv > 0) add('delay', p.seen, kind + $q.ac + p.mv + ' time' + (p.mv === 1 ? '' : 's') + ', ' + p.mm + $q.ad + (p.mm === 1 ? '' : 's') + $q.ae + p.d + $q.af + p.st + ')', F($q.B), $q.ab + id);
});
const rp = reg && reg.projects && reg.projects[id];
if (rp) add($q.ag, rp.checked, rp.register + ': ' + rp.item + $q.ah + rp.status + (rp.archived ? $q.ai : $q.aj), F($q.C), $q.ak);
else if (c.register && c.register.checked) add($q.ag, c.register.checked, c.register.register + ': ' + c.register.item + $q.ah + c.register.status, F($q.h), $q.al);
if (c.sat && c.sat.date) add($q.am, c.sat.date, $q.an + c.sat.status + (c.sat.changed_pct != null ? ' (' + c.sat.changed_pct + $q.ao : ''), F($q.h), $q.ap);
const sp = stall && stall.projects && stall.projects[id];
if (sp && (sp.newest_clear_dates || []).length) add($q.am, sp.newest_clear_dates[sp.newest_clear_dates.length - 1], $q.aq + (sp.status === 'ok' ? (sp.change_pct_last != null ? sp.change_pct_last + $q.ar + (sp.last_pair || []).join(' and ') : 'read') + (sp.no_visible_change_months ? $q.as + sp.no_visible_change_months + $q.at : '') : sp.status), F($q.D), $q.au);
const np = night && night.projects && night.projects[id];
if (np && night.updated) add($q.am, night.updated, $q.av + night.from + ' to ' + night.to + '): ' + np.reading, F($q.E), $q.au);
const op = ot && ot.projects && ot.projects[id];
if (op && ot.generated) add('delay', ot.generated, $t.k6 + (op.first || 'none') + $q.aw + (op.cur || 'none') + $q.ax + (op.moved || 0) + $q.ad + (op.moved === 1 ? '' : 's') + (op.overdue ? $q.ay + op.overdue + $q.at : ''), F($q.G), $q.az + id + '#odds');
const hp = haz && haz.projects && haz.projects[id];
if (hp && haz.updated) add($q.aA, haz.updated, $q.aB + nv(hp.elev_m) + $q.aC + nv(hp.flood_river_m) + $q.aD + nv(hp.flood_coast_m) + $q.aE + (hp.quakes ? ', ' + hp.quakes.m6 + $t.k7 : '') + (hp.tsunami ? ', ' + hp.tsunami.runups + $q.aF : '') + (hp.coast ? $q.aG + hp.coast : ''), F($q.F), $q.aH);
E.sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
const counts = {}; KINDS.forEach(k => { counts[k[0]] = E.filter(e => e.kind === k[0]).length; });
return out({ id, market: c.market, country: c.country, dataset_updated: d.updated, kinds: KINDS, counts, events: E, files,
note: $s.k1 }, 200, 300);
}
export async function handle(req, u, env, ctx) {
if (req.method === $q.aI) return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET', 'access-control-max-age': '86400' } });
if (req.method !== 'GET' && req.method !== 'HEAD') return json({ error: $q.aJ }, 405);
const p = u.pathname.replace(/\/+$/, '');
const id = String(u.searchParams.get('id') || '').trim().toUpperCase();
try {
if (p === $q.aK) return out({ module: 'disc', endpoints: {
'/api/x/disc/points': $t.k8,
'/api/x/disc/similar?id=BALI-014': $t.k9,
'/api/x/disc/timeline?id=BALI-014': $t.k10 } }, 200, 3600);
if (p === $q.aL) return points(env);
if (p === $q.aM || p === $q.aN) {
if (!ID_RE.test(id)) return out({ error: $q.aO }, 400, 0);
return p.endsWith($q.aP) ? similar(env, id) : timeline(env, id);
}
} catch (e) {
return out({ error: $q.aQ }, 500, 0);
}
return out({ error: $q.aR, module: 'disc' }, 404, 60);
}
