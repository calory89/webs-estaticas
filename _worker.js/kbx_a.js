// Feature module a for kolaboro.com (see kbx.js): home page live activity and the search index for the command palette.
// Every event below is read from a record that already exists (live findings, self-tests, eval runs, public log witnesses, uptime probes);
// nothing is generated to look busy. Answers are Ed25519-signed with the same key as /api/open/* so the browser can check them.
import { rpc, signBody, openLoad } from './kolaboro.js';
import { TB } from './kbx_strings.js';

export const PATHS = /^\/api\/x\/a\//;

const CK = 'https://kolaboro.com/__kbx_a/';
const H = { 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' };
const EXPOSE = 'x-kolaboro-signature, x-kolaboro-key-id, x-kolaboro-dataset-sha256, etag';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const iso = x => { const t = typeof x === 'number' ? x * 1000 : Date.parse(x); return isFinite(t) && t > 0 ? new Date(t).toISOString() : null; };
const DAY = d => { try { return new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }); } catch (e) { return d; } };

function jres(text, sig, env, maxAge, extra) {
  const h = Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': maxAge ? 'public, max-age=' + maxAge : 'no-store', 'access-control-expose-headers': EXPOSE }, H, extra || {});
  if (sig) { h['x-kolaboro-signature'] = sig; h['x-kolaboro-key-id'] = (env && env.KB_SIGN_KID) || 'kb'; }
  return new Response(text, { headers: h });
}

// ---------- events from existing public records
async function probeState(cache, up) {
  // The uptime record gives probe counts per day, not a time per probe. We remember the last count this edge saw;
  // when it grows, a probe was recorded since then, and we say "seen at" with the time we saw it.
  const today = (up && up.daily || []).find(d => d.day === new Date().toISOString().slice(0, 10));
  if (!today) return [];
  const key = new Request(CK + 'probe-state-v1');
  let st = null; try { const r = await cache.match(key); if (r) st = await r.json(); } catch (e) {}
  const now = new Date().toISOString();
  if (!st || st.day !== today.day) st = { day: today.day, probes: today.probes, up: today.up, seen: [], t: Date.now() };
  else if (today.probes > st.probes) {
    // only when our previous look was recent (8 min), so "seen at" is close to when the probe ran; otherwise just re-baseline
    const n = today.probes - st.probes, ups = today.up - st.up;
    if (Date.now() - (st.t || 0) < 480000) { st.seen.unshift({ at: now, n, down: Math.max(0, n - ups), probes: today.probes, upc: today.up }); st.seen = st.seen.slice(0, 6); }
    st.probes = today.probes; st.up = today.up;
  }
  st.t = Date.now();
  try { await cache.put(key, new Response(JSON.stringify(st), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=86400' } })); } catch (e) {}
  return st.seen.map(s => ({ id: 'probe-' + s.at, at: s.at, seen: true, kind: 'uptime', ok: !s.down,
    text: s.n + ' uptime probe' + (s.n > 1 ? 's' : '') + ' recorded from outside Cloudflare, ' + (s.down ? s.down + ' not up' : 'all up') + ' (' + s.upc + ' of ' + s.probes + ' up today)', href: '/status' }));
}

// Findings from the hourly live findings job (GitHub Actions, Claude API, quotes checked in code), published as /data/live-findings.json.
async function findings(env) {
  if (!env || !env.ASSETS) return null;
  const r = await env.ASSETS.fetch(new Request('https://kolaboro.com/_s/kolaboro.com/data/live-findings.json'));
  if (!r.ok) return null;
  const j = await r.json(), out = [];
  const okId = x => /^[A-Z]{2,5}-\d{3,4}$/.test(String(x || ''));
  (j.findings || []).slice(0, 8).forEach(f => { const at = iso(f.at); if (!at || !okId(f.project)) return;
    out.push({ id: 'fd-' + String(f.id).slice(0, 16), at, kind: 'finding', ok: true, text: String(f.text || '').slice(0, 220), href: '/p/' + f.project + '/' }); });
  const run = (j.runs || []).slice(-1)[0];
  if (run && iso(run.at)) out.push({ id: 'fr-' + run.at, at: new Date(Date.parse(run.at) + (+run.seconds || 0) * 1000).toISOString(), kind: 'checkrun', ok: true, href: '/findings/',
    text: 'Hourly check read ' + run.pages_fetched + ' developer pages: ' + run.findings + ' finding' + (run.findings === 1 ? '' : 's') + ', ' + run.no_change + ' facts unchanged, ' + ((+run.rejected_quote_not_found || 0) + (+run.rejected_value_not_in_quote || 0)) + ' facts rejected by the quote check, ' + Number(run.usd || 0).toFixed(3) + ' USD' });
  return out;
}

async function gather(cache, env) {
  const [st, ev, lg, up, fd] = await Promise.allSettled([rpc('kolaboro_public_status', {}), rpc('kolaboro_evals_public', {}), rpc('kolaboro_log_public', {}), rpc('kolaboro_uptime_public', {}), findings(env)]);
  const out = [], src = {};
  let nFind = 0;
  if (fd.status === 'fulfilled' && fd.value) { src.findings = true; fd.value.forEach(e => out.push(e)); nFind = fd.value.length; } else src.findings = false;
  if (st.status === 'fulfilled' && st.value) {
    src.selftests = true;
    (st.value.selftests || []).slice(0, 6).forEach(t => { const at = iso(t.at); if (!at) return;
      const failed = (t.failed || []).length;
      out.push({ id: 'st-' + at, at, kind: 'selftest', ok: !!t.ok, text: t.ok ? 'End-to-end self-test passed, ' + t.steps + ' of ' + t.steps + ' steps' : 'End-to-end self-test failed ' + failed + ' of ' + t.steps + ' steps', href: '/status' }); });
  } else src.selftests = false;
  if (ev.status === 'fulfilled' && ev.value) {
    src.evals = true;
    const hist = (ev.value.history || []).slice(0, 6);
    if (!hist.length && ev.value.latest) hist.push(Object.assign({ at: ev.value.latest.run_at }, ev.value.latest));
    hist.forEach(r => { const at = iso(r.at || r.run_at); if (!at) return;
      const ok = r.cases_passed === r.cases_total, c = r.consensus;
      out.push({ id: 'ev-' + at, at, kind: 'eval', ok, text: 'Desk review evaluation: ' + r.cases_passed + ' of ' + r.cases_total + ' fixed test cases passed' + (c && c.fields_compared ? ', second model agreed on ' + c.fields_agreed + ' of ' + c.fields_compared + ' fields' : ''), href: '/engineering/evals/' }); });
  } else src.evals = false;
  let heads = [];
  if (lg.status === 'fulfilled' && lg.value) {
    src.log = true; heads = (lg.value.heads || []).slice().sort((a, b) => a.day < b.day ? 1 : -1);
    heads.slice(0, 4).forEach(h => { const at = h.rekor_time ? iso(+h.rekor_time) : null; if (!at) return;
      out.push({ id: 'log-' + h.day, at, kind: 'log', ok: true, text: 'Public log line for ' + DAY(h.day) + ' witnessed in Sigstore Rekor (entry ' + h.rekor_index + ', ' + h.projects_count + ' project fingerprints)', href: '/log/' }); });
  } else src.log = false;
  let uptime = null;
  if (up.status === 'fulfilled' && up.value) {
    src.uptime = true; const u = up.value, today = (u.daily || [])[0] || null;
    uptime = { day: today && today.day, probes: today && today.probes, up: today && today.up, uptime_7d: u.uptime_7d, incidents: (u.incidents || []).length };
    (u.incidents || []).slice(0, 4).forEach((x, i) => { const at = iso(x.start || x.started_at || x.at || x.from); if (!at) return;
      out.push({ id: 'inc-' + at, at, kind: 'incident', ok: false, text: 'Uptime incident recorded' + (x.target ? ' on ' + String(x.target).slice(0, 60) : ''), href: '/status' }); });
    // findings are preferred over uptime probes: when there are findings, only the newest probe stays in the strip
    try { (await probeState(cache, u)).slice(0, nFind ? 1 : 6).forEach(e => out.push(e)); } catch (e) {}
  } else src.uptime = false;
  out.sort((a, b) => a.at < b.at ? 1 : a.at > b.at ? -1 : 0);
  return { events: out.slice(0, 14), uptime, log_days: heads.length, sources: src };
}

async function snapshot(env, ctx) {
  const cache = caches.default, key = new Request(CK + 'events-v1');
  try { const hit = await cache.match(key); if (hit) return { text: await hit.text(), sig: hit.headers.get('x-sig') }; } catch (e) {}
  const g = await gather(cache, env);
  const body = { generated_at: new Date().toISOString(), about: TB.kbx_a__s.k0, last_event_at: g.events.length ? g.events[0].at : null, events: g.events, uptime: g.uptime, sources: g.sources };
  const text = JSON.stringify(body); let sig = null; try { sig = await signBody(env, text); } catch (e) {}
  const put = cache.put(key, new Response(text, { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=20', 'x-sig': sig || '' } })).catch(() => {});
  if (ctx && ctx.waitUntil) ctx.waitUntil(put);
  return { text, sig };
}

// Server-sent events: one connection lasts up to 100 s, checks every 20 s and pushes a new signed snapshot when it changed.
// The browser's EventSource reconnects by itself (retry hint 3 s); the page falls back to polling if streams are blocked.
function live(env, ctx) {
  const ts = new TransformStream(), w = ts.writable.getWriter(), enc = new TextEncoder();
  const run = async () => {
    const t0 = Date.now(); let last = '';
    try {
      await w.write(enc.encode('retry: 3000\n: kolaboro live activity, signed snapshots\n\n'));
      while (Date.now() - t0 < 100000) {
        const s = await snapshot(env, ctx);
        if (s.text !== last) { last = s.text; await w.write(enc.encode('event: snap\ndata: ' + JSON.stringify({ b: s.text, s: s.sig || null, k: (env && env.KB_SIGN_KID) || 'kb' }) + '\n\n')); }
        else await w.write(enc.encode(': hb ' + new Date().toISOString() + '\n\n'));
        await sleep(20000);
      }
      await w.write(enc.encode('event: bye\ndata: {}\n\n'));
    } catch (e) {}
    try { await w.close(); } catch (e) {}
  };
  ctx.waitUntil(run());
  return new Response(ts.readable, { headers: Object.assign({ 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store, no-transform', 'x-accel-buffering': 'no' }, H) });
}

// ---------- compact search index for the command palette (all tracked projects and markets)
const slugM = m => encodeURIComponent(m.toLowerCase().replace(/\s+/g, '-'));
async function searchIndex(req, env, ctx) {
  const L = await openLoad(), v = L.sha.slice(0, 16), etag = '"sx2-' + v + '"';
  if ((req.headers.get('if-none-match') || '').indexOf(etag) >= 0) return new Response(null, { status: 304, headers: Object.assign({ etag, 'cache-control': 'public, max-age=600' }, H) });
  const cache = caches.default, key = new Request(CK + 'index-r2-' + v);
  try { const hit = await cache.match(key); if (hit) return jres(await hit.text(), hit.headers.get('x-sig'), env, 600, { etag, 'x-kolaboro-dataset-sha256': L.sha }); } catch (e) {}
  const cs = L.d.cases || [], mk = {};
  // not yet reviewed (no verification evidence): no check counts or flags, same rule as the named project pages
  const rv = c => !!(c.verified && Object.values(c.verified).some(x => x && x !== 'none'));
  const p = cs.map(c => { mk[c.market] = (mk[c.market] || 0) + 1; const r = rv(c);
    return [c.id, c.market || '', c.country || '', c.region || '', c.stage || '', r && c.score != null ? +c.score : null, r && c.vscore != null ? +c.vscore : null, r ? (c.flags || []).length : 0, c.band || '', c.title || '']; });
  const m = Object.keys(mk).sort().map(k => [k, slugM(k), mk[k], (cs.find(c => c.market === k) || {}).country || '']);
  const text = JSON.stringify({ v, updated: L.d.updated, dataset_sha256: L.sha, fields: ['id', 'market', 'country', 'region', 'stage', 'public_checks', 'confirmed_checks', 'flags', 'price_band', 'title_type'], p, m });
  let sig = null; try { sig = await signBody(env, text); } catch (e) {}
  ctx.waitUntil(cache.put(key, new Response(text, { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=3600', 'x-sig': sig || '' } })).catch(() => {}));
  return jres(text, sig, env, 600, { etag, 'x-kolaboro-dataset-sha256': L.sha });
}

export async function handle(req, u, env, ctx) {
  const path = u.pathname.replace(/\/+$/, '');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: Object.assign({ 'access-control-allow-methods': 'GET', 'access-control-allow-headers': 'if-none-match' }, H) });
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response(JSON.stringify({ error: 'method' }), { status: 405, headers: Object.assign({ 'content-type': 'application/json' }, H) });
  try {
    if (path === '/api/x/a/events') { const s = await snapshot(env, ctx); return jres(s.text, s.sig, env, 15); }
    if (path === '/api/x/a/live') return live(env, ctx);
    if (path === '/api/x/a/index') return await searchIndex(req, env, ctx);
  } catch (e) {
    return new Response(JSON.stringify({ error: 'unavailable' }), { status: 503, headers: Object.assign({ 'content-type': 'application/json', 'cache-control': 'no-store' }, H) });
  }
  return new Response(JSON.stringify({ error: 'not found', endpoints: ['/api/x/a/events', '/api/x/a/live', '/api/x/a/index'] }), { status: 404, headers: Object.assign({ 'content-type': 'application/json' }, H) });
}
