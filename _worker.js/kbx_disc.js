// Feature module 'disc' for kolaboro.com (see kbx.js): discovery: world map, similar projects, market comparison, project timeline, display currency.
// Block U6, batch 6 (5 Nov 2026). Endpoints live under /api/x/disc/. Everything here is read from public files under /data/;
// nothing private is read, and no project coordinates are used (the map places projects at their market's public point).
//
// GET /api/x/disc/points           compact rows for /map/: one row per public project + the market points (key market_points of data/similar.json)
// GET /api/x/disc/similar?id=ID    the 5 most similar projects (data/similar.json) with the shared public features that explain it
// GET /api/x/disc/timeline?id=ID   every dated public event for one project, grouped by kind, each with its source file
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
    if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request('https://kolaboro.com/data/' + name));
    if (!r || !r.ok) r = await fetch('https://kolaboro.com/data/' + name, { cf: { cacheTtl: 600, cacheEverything: true } });
    if (r.ok) v = await r.json();
  } catch (e) { v = null; }
  MEMO[name] = { t: Date.now(), v };
  return v;
}
function out(o, s = 200, maxAge = 300) {
  return new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': maxAge ? 'public, max-age=' + maxAge : 'no-store', 'access-control-allow-origin': '*' } });
}
const ID_RE = /^[A-Z]{2,5}-\d{3,4}$/;
const CK = [['permit', 'permit or licence number'], ['escrow', 'deposit protection'], ['progress', 'construction progress'], ['plans', 'site or floor plans'], ['record', 'developer track record'], ['returns_ok', 'no guaranteed returns']];
const BANDS = ['Under $100k', '$100k to $200k', '$200k to $400k', '$400k and up'];
function pub(c, k) {
  const v = (c.checks || {})[k];
  if (k === 'permit') return v === 2 ? 'y' : v === 1 ? 'p' : 'n';
  if (k === 'escrow') return v === true ? 'y' : 'n';
  if (k === 'progress') return v != null ? 'y' : 'n';
  return v ? 'y' : 'n';
}
async function cases(env) {
  const d = await load(env, 'bali-cases.json');
  if (!d || !Array.isArray(d.cases)) return null;
  if (!d._by) { d._by = {}; d.cases.forEach(c => { if (c && c.id) d._by[c.id] = c; }); }
  return d;
}

async function points(env) {
  const d = await cases(env);
  if (!d) return out({ error: 'data unavailable' }, 503, 0);
  const sj = await load(env, 'similar.json');
  const mp = (sj && sj.market_points) || await load(env, 'market-points.json');
  const rows = d.cases.filter(c => c && c.id && c.market).map(c => [c.id, c.market, c.country, c.stage || '', c.tier || '', c.band || '', c.score || 0, c.max || 6, c.region && c.region !== c.market ? c.region : '']);
  return out({
    updated: d.updated || null,
    keys: ['id', 'market', 'country', 'stage', 'tier', 'band', 'score', 'max', 'area'],
    rows,
    points: mp ? { status: 'ready', generated: mp.generated, method: mp.method, sources: mp.sources, counts: mp.counts, markets: mp.markets, unplaced: mp.unplaced || [] } : { status: 'starting', note: TB.kbx_disc__s.k0 }
  }, 200, 600);
}

function shared(a, b) {
  const s = [];
  if (a.market === b.market) s.push('same market (' + a.market + ')');
  else if (a.country === b.country) s.push('same country (' + a.country + ')');
  if (a.stage && a.stage === b.stage) s.push('same stage (' + a.stage + ')');
  const ia = BANDS.indexOf(a.band), ib = BANDS.indexOf(b.band);
  if (ia >= 0 && ia === ib) s.push('same price band (' + a.band + ')');
  else if (ia >= 0 && ib >= 0 && Math.abs(ia - ib) === 1) s.push('neighbouring price band (' + b.band + ')');
  const both = CK.filter(k => pub(a, k[0]) === 'y' && pub(b, k[0]) === 'y').map(k => k[1]);
  const neither = CK.filter(k => pub(a, k[0]) !== 'y' && pub(b, k[0]) !== 'y').map(k => k[1]);
  if (both.length) s.push('both publish ' + both.join(', '));
  if (neither.length) s.push('neither publishes ' + neither.join(', '));
  if (a.title && a.title === b.title) s.push('same title type (' + String(a.title).replace(/_/g, ' ') + ')');
  return s;
}
async function similar(env, id) {
  const d = await cases(env);
  if (!d) return out({ error: 'data unavailable' }, 503, 0);
  const a = d._by[id];
  if (!a) return out({ error: 'unknown project', id }, 404, 300);
  const S = await load(env, 'similar.json');
  if (!S || !S.projects) return out({ id, status: 'starting', note: 'The nightly job has not published /data/similar.json yet.', items: [] }, 200, 120);
  const L = (S.projects[id] || []).map(r => {
    const b = d._by[r[0]];
    if (!b) return null;
    return { id: b.id, score: r[1], text: r[2], struct: r[3], market: b.market, country: b.country, area: b.region && b.region !== b.market ? b.region : '', stage: b.stage || '', band: b.band || '', tier: b.tier || '', pub: b.score || 0, max: b.max || 6, shared: shared(a, b) };
  }).filter(Boolean);
  return out({ id, status: 'ready', generated: S.generated, dataset_updated: S.dataset_updated, model: S.model, weights: S.weights, text_fields: S.text_fields, items: L, source: '/data/similar.json' }, 200, 600);
}

// ---------- timeline ----------
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
function fmtv(v) { return v === true ? 'yes' : v === false ? 'no' : v == null ? 'not stated' : String(v); }

async function timeline(env, id) {
  const d = await cases(env);
  if (!d) return out({ error: 'data unavailable' }, 503, 0);
  const c = d._by[id];
  if (!c) return out({ error: 'unknown project', id }, 404, 300);
  const [drift, vd, prom, reg, stall, night, haz, ot] = await Promise.all(['promise-drift.json', 'visual-diff.json', 'promises.json', 'register-checks.json', 'stalled-sites.json', 'night-lights.json', 'hazards.json', 'on-time.json'].map(n => load(env, n)));
  const E = [], files = {};
  const add = (kind, date, text, src, link, extra) => { const dt = iso(date); if (!dt) return; E.push(Object.assign({ kind, date: dt, text, src, link: link || null }, extra || {})); files[src] = (files[src] || 0) + 1; };
  const F = n => '/data/' + n;

  // first seen and checked
  const dr = drift && drift.projects && drift.projects[id];
  if (dr && dr.first) add('seen', dr.first, 'First copy of the developer page kept by the research agent (' + dr.copies + ' copies, ' + dr.versions + ' version' + (dr.versions === 1 ? '' : 's') + ' up to ' + dr.last + ')', F('promise-drift.json'));
  if (c.invited) add('seen', c.invited, 'Developer invited to reply to the findings', F('bali-cases.json'), '/developers/reply/');
  if (c.read && c.checked) add('seen', c.checked, 'Latest check of the published claims (' + (c.score || 0) + ' of ' + (c.max || 6) + ' checks published, ' + (c.vscore || 0) + ' confirmed)', F('bali-cases.json'), '/p/?id=' + id);
  if (c.fp && c.fp.date) add('seen', c.fp.date, 'Page fingerprint recorded (SHA-256 ' + String(c.fp.sha256 || '').slice(0, 12) + '...)', F('bali-cases.json'), '/verify');
  // page changes
  (c.history || []).forEach(h => add('page', h.d, 'Change recorded: ' + h.f + ' (from ' + fmtv(h.from) + ' to ' + fmtv(h.to) + ')', F('bali-cases.json')));
  if (dr) (dr.changes || []).forEach(x => add('page', x.first_seen, 'Developer page changed: ' + x.label + ' (from ' + fmtv(x.from) + ' to ' + fmtv(x.to) + ')' + (x.reverted ? ', later reverted' : ''), F('promise-drift.json')));
  const vp = vd && (vd.projects || []).find(p => p.id === id);
  if (vp) {
    if (vp.baseline) add('page', vp.baseline, 'Baseline screenshot of the developer page taken', F('visual-diff.json'), '/visual/');
    (vp.changes || []).forEach(x => add('page', x.date, 'Visible change on the developer page: ' + x.area_pct + '% of the page area changed since ' + x.before_date, F('visual-diff.json'), '/visual/'));
  }
  // promises
  const PL = (prom && prom.projects && prom.projects[id]) || [];
  PL.forEach(p => {
    const kind = (prom.kinds && prom.kinds[p.k]) || p.k;
    const hist = p.hist || [];
    hist.forEach((h, i) => add('promise', h.seen, 'Promise read: ' + kind + ' by ' + h.d + ' (from ' + (h.src === 'page' ? 'a copy of the developer page' : 'the research record') + ')', F('promises.json'), '/promises/?id=' + id,
      i === hist.length - 1 ? { status: p.st, status_note: (prom.statuses || {})[p.st] || '' } : null));
    if (p.mv > 0) add('delay', p.seen, kind + ': date moved ' + p.mv + ' time' + (p.mv === 1 ? '' : 's') + ', ' + p.mm + ' month' + (p.mm === 1 ? '' : 's') + ' in total, now ' + p.d + ' (status: ' + p.st + ')', F('promises.json'), '/promises/?id=' + id);
  });
  // register checks
  const rp = reg && reg.projects && reg.projects[id];
  if (rp) add('register', rp.checked, rp.register + ': ' + rp.item + ', status ' + rp.status + (rp.archived ? ' (response archived with SHA-256)' : ' (response not archived)'), F('register-checks.json'), '/registers/checks/');
  else if (c.register && c.register.checked) add('register', c.register.checked, c.register.register + ': ' + c.register.item + ', status ' + c.register.status, F('bali-cases.json'), '/registers/');
  // satellite
  if (c.sat && c.sat.date) add('satellite', c.sat.date, 'Sentinel-2 reading: ' + c.sat.status + (c.sat.changed_pct != null ? ' (' + c.sat.changed_pct + '% of the area changed)' : ''), F('bali-cases.json'), '/satellite/');
  const sp = stall && stall.projects && stall.projects[id];
  if (sp && (sp.newest_clear_dates || []).length) add('satellite', sp.newest_clear_dates[sp.newest_clear_dates.length - 1], 'Quarterly Sentinel-2 check: ' + (sp.status === 'ok' ? (sp.change_pct_last != null ? sp.change_pct_last + '% change between ' + (sp.last_pair || []).join(' and ') : 'read') + (sp.no_visible_change_months ? ', no visible change for ' + sp.no_visible_change_months + ' months' : '') : sp.status), F('stalled-sites.json'), '/satellite/night/');
  const np = night && night.projects && night.projects[id];
  if (np && night.updated) add('satellite', night.updated, 'Night lights (NASA Black Marble, ' + night.from + ' to ' + night.to + '): ' + np.reading, F('night-lights.json'), '/satellite/night/');
  // delay index reading
  const op = ot && ot.projects && ot.projects[id];
  if (op && ot.generated) add('delay', ot.generated, 'Delay index reading: first advertised handover ' + (op.first || 'none') + ', current ' + (op.cur || 'none') + ', moved ' + (op.moved || 0) + ' month' + (op.moved === 1 ? '' : 's') + (op.overdue ? ', overdue ' + op.overdue + ' months' : ''), F('on-time.json'), '/index/delays/?id=' + id + '#odds');
  // hazards
  const hp = haz && haz.projects && haz.projects[id];
  if (hp && haz.updated) add('hazard', haz.updated, 'Hazards read at the site: height ' + nv(hp.elev_m) + ' m, 100-year flood depth ' + nv(hp.flood_river_m) + ' m (river) and ' + nv(hp.flood_coast_m) + ' m (coast)' + (hp.quakes ? ', ' + hp.quakes.m6 + ' earthquakes of magnitude 6 or more within 100 km since 1900' : '') + (hp.tsunami ? ', ' + hp.tsunami.runups + ' tsunami run-ups within 50 km' : '') + (hp.coast ? ', coast ' + hp.coast : ''), F('hazards.json'), '/hazards/');

  E.sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
  const counts = {}; KINDS.forEach(k => { counts[k[0]] = E.filter(e => e.kind === k[0]).length; });
  return out({ id, market: c.market, country: c.country, dataset_updated: d.updated, kinds: KINDS, counts, events: E, files,
    note: TB.kbx_disc__s.k1 }, 200, 300);
}

export async function handle(req, u, env, ctx) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET', 'access-control-max-age': '86400' } });
  if (req.method !== 'GET' && req.method !== 'HEAD') return json({ error: 'method not allowed' }, 405);
  const p = u.pathname.replace(/\/+$/, '');
  const id = String(u.searchParams.get('id') || '').trim().toUpperCase();
  try {
    if (p === '/api/x/disc') return out({ module: 'disc', endpoints: {
      '/api/x/disc/points': 'one compact row per public project and the public market points used by /map/',
      '/api/x/disc/similar?id=BALI-014': 'the 5 most similar projects (nightly embeddings) with the shared public features',
      '/api/x/disc/timeline?id=BALI-014': 'every dated public event for one project, from all public data files' } }, 200, 3600);
    if (p === '/api/x/disc/points') return points(env);
    if (p === '/api/x/disc/similar' || p === '/api/x/disc/timeline') {
      if (!ID_RE.test(id)) return out({ error: 'id must look like BALI-014' }, 400, 0);
      return p.endsWith('similar') ? similar(env, id) : timeline(env, id);
    }
  } catch (e) {
    return out({ error: 'internal' }, 500, 0);
  }
  return out({ error: 'not found', module: 'disc' }, 404, 60);
}
