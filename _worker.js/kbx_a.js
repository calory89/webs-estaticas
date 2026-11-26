// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_a__q, $s = TB.kbx_a__s, $t = TB.kbx_a__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { rpc, signBody, openLoad } from './kolaboro.js';
import { TB } from './kbx_strings.js';
export const PATHS = /^\/api\/x\/a\//;
const CK = 'https://kolaboro.com/__kbx_a/';
const H = { 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const iso = x => { const t = typeof x === $q.a ? x * 1000 : Date.parse(x); return isFinite(t) && t > 0 ? new Date(t).toISOString() : null; };
const DAY = d => { try { return new Date(d + $q.b).toLocaleDateString('en-GB', { day: $q.c, month: 'short', timeZone: 'UTC' }); } catch (e) { return d; } };
function jres(text, sig, env, maxAge, extra) {
const h = Object.assign({ 'content-type': $q.d, 'cache-control': maxAge ? $q.e + maxAge : $q.f, 'access-control-expose-headers': $t.EXPOSE }, H, extra || {});
if (sig) { h[$q.g] = sig; h[$q.h] = (env && env.KB_SIGN_KID) || 'kb'; }
return new Response(text, { headers: h });
}
async function probeState(cache, up) {
const today = (up && up.daily || []).find(d => d.day === new Date().toISOString().slice(0, 10));
if (!today) return [];
const key = new Request(CK + $q.i);
let st = null; try { const r = await cache.match(key); if (r) st = await r.json(); } catch (e) {}
const now = new Date().toISOString();
if (!st || st.day !== today.day) st = { day: today.day, probes: today.probes, up: today.up, seen: [], t: Date.now() };
else if (today.probes > st.probes) {
const n = today.probes - st.probes, ups = today.up - st.up;
if (Date.now() - (st.t || 0) < 480000) { st.seen.unshift({ at: now, n, down: Math.max(0, n - ups), probes: today.probes, upc: today.up }); st.seen = st.seen.slice(0, 6); }
st.probes = today.probes; st.up = today.up;
}
st.t = Date.now();
try { await cache.put(key, new Response(JSON.stringify(st), { headers: { 'content-type': $q.j, 'cache-control': $q.k } })); } catch (e) {}
return st.seen.map(s => ({ id: $q.l + s.at, at: s.at, seen: true, kind: $q.m, ok: !s.down,
text: s.n + $q.n + (s.n > 1 ? 's' : '') + $q.o + (s.down ? s.down + $q.p : $q.q) + ' (' + s.upc + ' of ' + s.probes + $q.r, href: $q.s }));
}
async function findings(env) {
if (!env || !env.ASSETS) return null;
const r = await env.ASSETS.fetch(new Request($t.k0));
if (!r.ok) return null;
const j = await r.json(), out = [];
const okId = x => /^[A-Z]{2,5}-\d{3,4}$/.test(String(x || ''));
(j.findings || []).slice(0, 8).forEach(f => { const at = iso(f.at); if (!at || !okId(f.project)) return;
out.push({ id: 'fd-' + String(f.id).slice(0, 16), at, kind: $q.t, ok: true, text: String(f.text || '').slice(0, 220), href: '/p/' + f.project + '/' }); });
const run = (j.runs || []).slice(-1)[0];
if (run && iso(run.at)) out.push({ id: 'fr-' + run.at, at: new Date(Date.parse(run.at) + (+run.seconds || 0) * 1000).toISOString(), kind: $q.u, ok: true, href: $q.v,
text: $q.w + run.pages_fetched + $q.x + run.findings + $q.y + (run.findings === 1 ? '' : 's') + ', ' + run.no_change + $q.z + ((+run.rejected_quote_not_found || 0) + (+run.rejected_value_not_in_quote || 0)) + $q.A + Number(run.usd || 0).toFixed(3) + ' USD' });
return out;
}
async function gather(cache, env) {
const [st, ev, lg, up, fd] = await Promise.allSettled([rpc($q.B, {}), rpc($q.C, {}), rpc($q.D, {}), rpc($q.E, {}), findings(env)]);
const out = [], src = {};
let nFind = 0;
if (fd.status === $q.F && fd.value) { src.findings = true; fd.value.forEach(e => out.push(e)); nFind = fd.value.length; } else src.findings = false;
if (st.status === $q.F && st.value) {
src.selftests = true;
(st.value.selftests || []).slice(0, 6).forEach(t => { const at = iso(t.at); if (!at) return;
const failed = (t.failed || []).length;
out.push({ id: 'st-' + at, at, kind: $q.G, ok: !!t.ok, text: t.ok ? $q.H + t.steps + ' of ' + t.steps + $q.I : $q.J + failed + ' of ' + t.steps + $q.I, href: $q.s }); });
} else src.selftests = false;
if (ev.status === $q.F && ev.value) {
src.evals = true;
const hist = (ev.value.history || []).slice(0, 6);
if (!hist.length && ev.value.latest) hist.push(Object.assign({ at: ev.value.latest.run_at }, ev.value.latest));
hist.forEach(r => { const at = iso(r.at || r.run_at); if (!at) return;
const ok = r.cases_passed === r.cases_total, c = r.consensus;
out.push({ id: 'ev-' + at, at, kind: 'eval', ok, text: $q.K + r.cases_passed + ' of ' + r.cases_total + $q.L + (c && c.fields_compared ? $q.M + c.fields_agreed + ' of ' + c.fields_compared + $q.N : ''), href: $q.O }); });
} else src.evals = false;
let heads = [];
if (lg.status === $q.F && lg.value) {
src.log = true; heads = (lg.value.heads || []).slice().sort((a, b) => a.day < b.day ? 1 : -1);
heads.slice(0, 4).forEach(h => { const at = h.rekor_time ? iso(+h.rekor_time) : null; if (!at) return;
out.push({ id: 'log-' + h.day, at, kind: 'log', ok: true, text: $q.P + DAY(h.day) + $q.Q + h.rekor_index + ', ' + h.projects_count + $q.R, href: '/log/' }); });
} else src.log = false;
let uptime = null;
if (up.status === $q.F && up.value) {
src.uptime = true; const u = up.value, today = (u.daily || [])[0] || null;
uptime = { day: today && today.day, probes: today && today.probes, up: today && today.up, uptime_7d: u.uptime_7d, incidents: (u.incidents || []).length };
(u.incidents || []).slice(0, 4).forEach((x, i) => { const at = iso(x.start || x.started_at || x.at || x.from); if (!at) return;
out.push({ id: 'inc-' + at, at, kind: $q.S, ok: false, text: $q.T + (x.target ? ' on ' + String(x.target).slice(0, 60) : ''), href: $q.s }); });
try { (await probeState(cache, u)).slice(0, nFind ? 1 : 6).forEach(e => out.push(e)); } catch (e) {}
} else src.uptime = false;
out.sort((a, b) => a.at < b.at ? 1 : a.at > b.at ? -1 : 0);
return { events: out.slice(0, 14), uptime, log_days: heads.length, sources: src };
}
async function snapshot(env, ctx) {
const cache = caches.default, key = new Request(CK + $q.U);
try { const hit = await cache.match(key); if (hit) return { text: await hit.text(), sig: hit.headers.get('x-sig') }; } catch (e) {}
const g = await gather(cache, env);
const body = { generated_at: new Date().toISOString(), about: $s.k0, last_event_at: g.events.length ? g.events[0].at : null, events: g.events, uptime: g.uptime, sources: g.sources };
const text = JSON.stringify(body); let sig = null; try { sig = await signBody(env, text); } catch (e) {}
const put = cache.put(key, new Response(text, { headers: { 'content-type': $q.j, 'cache-control': $q.V, 'x-sig': sig || '' } })).catch(() => {});
if (ctx && ctx.waitUntil) ctx.waitUntil(put);
return { text, sig };
}
function live(env, ctx) {
  const ts = new TransformStream(), w = ts.writable.getWriter(), enc = new TextEncoder();
  const run = async () => {
    const t0 = Date.now(); let last = '';
    try {
      await w.write(enc.encode($q.W));
      while (Date.now() - t0 < 100000) {
        const s = await snapshot(env, ctx);
        if (s.text !== last) { last = s.text; await w.write(enc.encode($q.X + JSON.stringify({ b: s.text, s: s.sig || null, k: (env && env.KB_SIGN_KID) || 'kb' }) + '\n\n')); }
        else await w.write(enc.encode(': hb ' + new Date().toISOString() + '\n\n'));
        await sleep(20000);
      }
      await w.write(enc.encode($q.Y));
    } catch (e) {}
    try { await w.close(); } catch (e) {}
  };
  ctx.waitUntil(run());
  return new Response(ts.readable, { headers: Object.assign({ 'content-type': $q.Z, 'cache-control': $q.aa, 'x-accel-buffering': 'no' }, H) });
}
const slugM = m => encodeURIComponent(m.toLowerCase().replace(/\s+/g, '-'));
async function searchIndex(req, env, ctx) {
const L = await openLoad(), v = L.sha.slice(0, 16), etag = '"sx2-' + v + '"';
if ((req.headers.get($q.ab) || '').indexOf(etag) >= 0) return new Response(null, { status: 304, headers: Object.assign({ etag, 'cache-control': $q.ac }, H) });
const cache = caches.default, key = new Request(CK + $q.ad + v);
try { const hit = await cache.match(key); if (hit) return jres(await hit.text(), hit.headers.get('x-sig'), env, 600, { etag, 'x-kolaboro-dataset-sha256': L.sha }); } catch (e) {}
const cs = L.d.cases || [], mk = {};
const rv = c => !!(c.verified && Object.values(c.verified).some(x => x && x !== 'none'));
const p = cs.map(c => { mk[c.market] = (mk[c.market] || 0) + 1; const r = rv(c);
return [c.id, c.market || '', c.country || '', c.region || '', c.stage || '', r && c.score != null ? +c.score : null, r && c.vscore != null ? +c.vscore : null, r ? (c.flags || []).length : 0, c.band || '', c.title || '']; });
const m = Object.keys(mk).sort().map(k => [k, slugM(k), mk[k], (cs.find(c => c.market === k) || {}).country || '']);
const text = JSON.stringify({ v, updated: L.d.updated, dataset_sha256: L.sha, fields: ['id', $q.ae, $q.af, $q.ag, 'stage', $q.ah, $q.ai, 'flags', $q.aj, $q.ak], p, m });
let sig = null; try { sig = await signBody(env, text); } catch (e) {}
ctx.waitUntil(cache.put(key, new Response(text, { headers: { 'content-type': $q.j, 'cache-control': $q.al, 'x-sig': sig || '' } })).catch(() => {}));
return jres(text, sig, env, 600, { etag, 'x-kolaboro-dataset-sha256': L.sha });
}
export async function handle(req, u, env, ctx) {
const path = u.pathname.replace(/\/+$/, '');
if (req.method === $q.am) return new Response(null, { status: 204, headers: Object.assign({ 'access-control-allow-methods': 'GET', 'access-control-allow-headers': $q.ab }, H) });
if (req.method !== 'GET' && req.method !== 'HEAD') return new Response(JSON.stringify({ error: $q.an }), { status: 405, headers: Object.assign({ 'content-type': $q.j }, H) });
try {
if (path === $q.ao) { const s = await snapshot(env, ctx); return jres(s.text, s.sig, env, 15); }
if (path === $q.ap) return live(env, ctx);
if (path === $q.aq) return await searchIndex(req, env, ctx);
} catch (e) {
return new Response(JSON.stringify({ error: $q.ar }), { status: 503, headers: Object.assign({ 'content-type': $q.j, 'cache-control': $q.f }, H) });
}
return new Response(JSON.stringify({ error: $q.as, endpoints: [$q.ao, $q.ap, $q.aq] }), { status: 404, headers: Object.assign({ 'content-type': $q.j }, H) });
}
