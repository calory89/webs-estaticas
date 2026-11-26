// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_y__q, $s = TB.kbx_y__s, $t = TB.kbx_y__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { json, rpc, rpcW, sha, claude, openData } from './kolaboro.js';
import { TB } from './kbx_strings.js';
let MAILER = { t: 0, v: false };
async function mailer(env) {
if (env.BREVO_API_KEY) return $q.a;
if (Date.now() - MAILER.t < 60000) return MAILER.v ? $q.b : null;
let v = false; try { const r = await rpcW($q.c, { p_to: $q.d, p_subject: 'probe', p_html: 'probe', p_kind: 'probe', p_dedupe: $q.e }); v = !!(r && r.error === 'kind'); } catch (e) {}
MAILER = { t: Date.now(), v }; return v ? $q.b : null;
}
export const PATHS = /^\/api\/x\/y(\/|$)/;
const te = new TextEncoder(), td = new TextDecoder();
const HAIKU = 'claude-haiku-5-5';
const SITE = 'https://kolaboro.com';
const ID_RE = /^[A-Z]{2,5}-[0-9]{3,4}$/;
const EMAIL_RE = /^[^@\s<>"',;]+@[^@\s<>"',;]+\.[^@\s<>"',;]+$/;
const QIDS = ['permit', 'title', 'escrow', 'payment_plan', 'completion_penalty', 'contract'];
const BANDS = { 'Under $100k': [0, 100000], '$100k to $200k': [100000, 200000], '$200k to $400k': [200000, 400000], '$400k and up': [400000, Infinity] };
const STAGES = ['off-plan', 'under construction', 'completed'];
function out(o, s = 200, extra) { return new Response(JSON.stringify(o), { status: s, headers: Object.assign({ 'content-type': $q.f, 'cache-control': $q.g }, extra || {}) }); }
const ipOf = req => { const a = req.headers.get($q.h) || 'x'; return a.includes(':') ? a.split(':').slice(0, 4).join(':') + '::/64' : a; };
async function allow(ctx, key, limit, ttl) {
const k = new Request($q.i + encodeURIComponent(key));
const hit = await caches.default.match(k); const n = hit ? (+(await hit.text()) || 0) : 0;
if (n >= limit) return false;
const p = caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': $q.j + ttl } }));
if (ctx && ctx.waitUntil) ctx.waitUntil(p); else await p;
return true;
}
async function body(req) { try { const t = await req.text(); return t.length > 8000 ? null : JSON.parse(t); } catch (e) { return null; } }
function token() { const b = crypto.getRandomValues(new Uint8Array(24)); return [...b].map(x => x.toString(16).padStart(2, '0')).join(''); }
const tokOk = t => /^[0-9a-f]{48}$/.test(String(t || ''));
async function asset(env, p) {
try { const r = await env.ASSETS.fetch(new Request(SITE + $q.k + p)); if (r.ok) return await r.json(); } catch (e) {}
try { const r = await fetch(SITE + p, { cf: { cacheTtl: 300 } }); if (r.ok) return await r.json(); } catch (e) {}
return null;
}
let READY = { t: 0, v: null };
async function ready() {
if (Date.now() - READY.t < 60000 && READY.v) return READY.v;
let v; try { const d = await rpc($q.l, {}); v = { alerts: !!(d && d.alerts), asks: !!(d && d.asks) }; } catch (e) { v = { alerts: false, asks: false }; }
READY = { t: Date.now(), v }; return v;
}
export async function handle(req, u, env, ctx) {
const p = u.pathname.replace(/\/+$/, '');
const m = req.method;
try {
if (p === $q.m && m === 'GET') return status(env);
if (p === $q.n && m === 'GET') return promises(u, env);
if (p === $q.o && m === 'POST') return alertParse(req, env, ctx);
if (p === $q.p && m === 'POST') return alertSave(req, env, ctx);
if (p === $q.q && m === 'POST') return alertToken(req, env, ctx, $q.r);
if (p === $q.s && m === 'POST') return alertToken(req, env, ctx, 'stop');
if (p === $q.t && m === 'GET') return alertStats();
if (p === $q.u && m === 'POST') return alertRun(req, env);
if (p === $q.v && m === 'GET') return askQuestions(u, env);
if (p === $q.w && m === 'POST') return askStart(req, env, ctx);
if (p === $q.x && m === 'POST') return askGet(req, ctx);
if (p === $q.y && m === 'POST') return askReport(req, ctx);
if (p === $q.z && m === 'GET') return askStats(u);
} catch (e) { return out({ error: $q.A, detail: String(e && e.message || e).slice(0, 120) }, 500); }
return json({ error: $q.B, module: 'y' }, 404);
}
async function status(env) {
  const [r, ml] = await Promise.all([ready(), mailer(env)]);
  const pr = await asset(env, $q.C);
  return out({ alerts: { table: r.alerts, email_sender: !!ml, open: r.alerts && !!ml, parser: !!env.ANTHROPIC_API_KEY },
    asks: { table: r.asks, open: r.asks }, promises: pr ? { updated: pr.updated, projects: (pr.counts || {}).projects, promises: (pr.counts || {}).promises } : null },
    200, { 'cache-control': $q.D });
}
async function promises(u, env) {
const id = String(u.searchParams.get('id') || '').toUpperCase().trim();
if (!ID_RE.test(id)) return out({ error: 'id' }, 400);
const d = await asset(env, $q.C);
if (!d) return out({ error: $q.E }, 503);
return out({ id, updated: d.updated, statuses: d.statuses, kinds: d.kinds, promises: (d.projects || {})[id] || [], method: $q.F }, 200, { 'cache-control': $q.G, 'access-control-allow-origin': '*' });
}
function places(cases) {
  const mk = {}, ct = {}, rg = {};
  cases.forEach(c => { mk[c.market] = 1; ct[c.country] = 1; if (c.region && c.region !== c.market) rg[c.region] = 1; });
  return { markets: Object.keys(mk).sort(), countries: Object.keys(ct).sort(), regions: Object.keys(rg).sort() };
}
function cleanFilter(f, P) {
const o = {}, warn = [];
if (!f || typeof f !== $q.H) return { filter: {}, warn: ['empty'] };
const lookup = {}; [$q.I, $q.J, $q.K].forEach(k => P[k].forEach(n => { lookup[n.toLowerCase()] = { name: n, kind: k }; }));
const pl = [];
(Array.isArray(f.places) ? f.places : []).slice(0, 12).forEach(x => { const h = lookup[String(x || '').toLowerCase().trim()]; if (h) { if (!pl.some(y => y.name === h.name)) pl.push(h); } else if (x) warn.push(String(x).slice(0, 40)); });
if (pl.length) o.places = pl.map(x => x.name);
const num = (v, lo, hi) => { const n = typeof v === $q.L ? v : parseFloat(v); return isFinite(n) && n >= lo && n <= hi ? n : null; };
const pmax = num(f.price_max_usd, 1000, 1e9), pmin = num(f.price_min_usd, 1000, 1e9);
if (pmax != null) o.price_max_usd = Math.round(pmax);
if (pmin != null && (pmax == null || pmin < pmax)) o.price_min_usd = Math.round(pmin);
const st = (Array.isArray(f.stages) ? f.stages : []).filter(s => STAGES.includes(s)); if (st.length && st.length < 3) o.stages = [...new Set(st)];
if (f.permit === true || f.permit === false) o.permit = f.permit;
if (f.escrow === true) o.escrow = true;
if (f.no_flags === true) o.no_flags = true;
if (f.no_guaranteed_returns === true) o.no_guaranteed_returns = true;
if (f.title === $q.M || f.title === $q.N) o.title = f.title;
const cb = num(f.completion_by, 2024, 2045); if (cb != null) o.completion_by = Math.round(cb);
const mp = num(f.min_public, 1, 6); if (mp != null) o.min_public = Math.round(mp);
const mc = num(f.min_confirmed, 1, 6); if (mc != null) o.min_confirmed = Math.round(mc);
(Array.isArray(f.not_understood) ? f.not_understood : []).slice(0, 6).forEach(x => { if (x) warn.push(String(x).slice(0, 40)); });
return { filter: o, warn: [...new Set(warn)].slice(0, 8) };
}
function matches(c, f) {
const ck = c.checks || {};
if (f.places && !f.places.some(n => n === c.market || n === c.country || n === c.region)) return false;
if (f.price_max_usd != null || f.price_min_usd != null) {
const b = BANDS[c.band]; if (!b) return false;
if (f.price_max_usd != null && b[1] > f.price_max_usd) return false;
if (f.price_min_usd != null && b[0] < f.price_min_usd) return false;
}
if (f.stages && !f.stages.includes(c.stage)) return false;
if (f.permit === true && ck.permit !== 2) return false;
if (f.permit === false && ck.permit === 2) return false;
if (f.escrow && ck.escrow !== true) return false;
if (f.no_flags && (c.flags || []).length) return false;
if (f.no_guaranteed_returns && ck.returns_ok !== true) return false;
if (f.title && !new RegExp(f.title === $q.M ? 'free' : 'lease').test(c.title || '')) return false;
if (f.completion_by != null && !(+c.done && +c.done <= f.completion_by)) return false;
if (f.min_public != null && (c.score || 0) < f.min_public) return false;
if (f.min_confirmed != null && (c.vscore || 0) < f.min_confirmed) return false;
return true;
}
const k$ = n => n >= 1e6 ? '$' + (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + 'M' : '$' + Math.round(n / 1000) + 'k';
function labels(f) {
const L = [];
if (f.places) L.push({ k: $q.O, t: 'In ' + f.places.join(' or ') });
if (f.price_max_usd != null) {
const ok = Object.keys(BANDS).filter(b => BANDS[b][1] <= f.price_max_usd), part = Object.keys(BANDS).filter(b => BANDS[b][0] < f.price_max_usd && BANDS[b][1] > f.price_max_usd);
L.push({ k: 'price', t: $q.P + k$(f.price_max_usd) + (ok.length ? ' (' + ok.join(', ') + ')' : $q.Q),
note: part.length ? $t.k0 + part.join(', ') + $t.k1 + k$(f.price_max_usd) + $t.k2 : $t.k3 });
}
if (f.price_min_usd != null) L.push({ k: $q.R, t: $q.S + k$(f.price_min_usd) });
if (f.stages) L.push({ k: $q.T, t: $q.U + f.stages.join(' or ') });
if (f.permit === true) L.push({ k: $q.V, t: $q.W });
if (f.permit === false) L.push({ k: $q.V, t: $q.X });
if (f.escrow) L.push({ k: $q.Y, t: $t.k4 });
if (f.no_flags) L.push({ k: $q.Z, t: $t.k5 });
if (f.no_guaranteed_returns) L.push({ k: $q.aa, t: $q.ab });
if (f.title) L.push({ k: 'title', t: f.title === $q.M ? $q.ac : $q.ad });
if (f.completion_by != null) L.push({ k: 'done', t: $q.ae + f.completion_by + $q.af });
if (f.min_public != null) L.push({ k: $q.ag, t: $q.ah + f.min_public + $q.ai });
if (f.min_confirmed != null) L.push({ k: $q.aj, t: $q.ah + f.min_confirmed + $t.k6 });
return L;
}
function preview(cases, f) {
const M = cases.filter(c => matches(c, f));
return { matching_today: M.length, examples: M.slice(0, 5).map(c => ({ id: c.id, market: c.market, region: c.region, band: c.band, stage: c.stage, score: c.score, max: c.max })) };
}
async function alertParse(req, env, ctx) {
const b = await body(req); const text = String((b && b.text) || '').replace(/\s+/g, ' ').trim();
if (text.length < 6 || text.length > 300) return out({ error: 'text', message: $q.ak }, 400);
if (!env.ANTHROPIC_API_KEY) return out({ error: $q.al }, 503);
const d = await openData(); const cases = d.cases || [], P = places(cases);
const ck = new Request($q.am + encodeURIComponent(text.toLowerCase()));
let raw = null, cached = false;
const hit = await caches.default.match(ck); if (hit) { raw = await hit.json(); cached = true; }
if (!raw) {
if (!(await allow(ctx, $q.an + ipOf(req) + ':' + new Date().toISOString().slice(0, 13), 12, 3600))) return out({ error: 'rate', message: $t.k7 }, 429);
const lists = $q.ao + P.markets.join(', ') + $q.ap + P.countries.join(', ') + $q.aq + P.regions.join(', ');
try { raw = await claude(env, $s.PARSE_PROMPT + '\n\n' + lists + $t.k8 + text + '\n>>>', null, HAIKU); }
catch (e) { return out({ error: e && e.budget ? $q.ar : 'model', message: e && e.budget ? $t.k9 : $t.k10 }, 503); }
ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(raw), { headers: { 'content-type': $q.as, 'cache-control': $q.at } })));
}
const { filter, warn } = cleanFilter(raw, P);
if (!Object.keys(filter).length) return out({ error: 'empty', message: $s.k0, not_used: warn }, 422);
return out({ text, filter, labels: labels(filter), not_used: warn, ...preview(cases, filter), data_updated: d.updated, model: HAIKU, cached, check: $s.k1 });
}
async function sendMail(env, to, subject, text, html, stopUrl, kind, dedupe) {
if (!env.BREVO_API_KEY) {
if (!(await mailer(env))) return { ok: false, error: $q.au };
try { const r = await rpcW($q.c, { p_to: to, p_subject: subject, p_html: html, p_kind: kind, p_dedupe: dedupe, p_stop_url: stopUrl || null }); return r && r.ok ? { ok: true, via: $q.b } : { ok: false, error: (r && r.error) || 'db' }; }
catch (e) { return { ok: false, error: 'db' }; }
}
const h = { sender: { name: $q.av, email: env.KB_MAIL_FROM || $q.aw }, to: [{ email: to }], subject, textContent: text, htmlContent: html };
if (stopUrl) h.headers = { 'List-Unsubscribe': '<' + stopUrl + '>' };
try {
const r = await fetch($q.ax, { method: 'POST', headers: { 'api-key': env.BREVO_API_KEY, 'content-type': $q.as, accept: $q.as }, body: JSON.stringify(h), signal: AbortSignal.timeout(15000) });
return { ok: r.ok, status: r.status };
} catch (e) { return { ok: false, error: $q.ay }; }
}
const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.az }[c]));
async function alertSave(req, env, ctx) {
const [r, ml] = await Promise.all([ready(), mailer(env)]);
if (!r.alerts || !ml) return out({ error: $q.aA, message: $q.aB + (!r.alerts ? $q.aC : $q.aD) + $q.aE }, 503);
const b = await body(req); if (!b) return out({ error: 'input' }, 400);
const email = String(b.email || '').trim().toLowerCase(), text = String(b.text || '').replace(/\s+/g, ' ').trim().slice(0, 300);
if (!EMAIL_RE.test(email) || email.length > 160) return out({ error: 'email', message: $q.aF }, 400);
if (!(await allow(ctx, 'save:' + ipOf(req) + ':' + new Date().toISOString().slice(0, 13), 5, 3600))) return out({ error: 'rate', message: $t.k11 }, 429);
const d = await openData(); const cases = d.cases || [];
const { filter } = cleanFilter(Object.assign({}, b.filter || {}, { not_understood: [] }), places(cases));
if (!Object.keys(filter).length) return out({ error: $q.aG }, 400);
const t = token(), th = await sha(t), seen = cases.filter(c => matches(c, filter)).map(c => c.id);
let res; try { res = await rpcW($q.aH, { p_email: email, p_sentence: text || 'alert', p_filter: filter, p_token_hash: th, p_ip_hash: await sha($q.aI + ipOf(req)), p_seen: seen }); } catch (e) { return out({ error: 'db', message: $q.aJ }, 503); }
if (!res || !res.ok) return out({ error: (res && res.error) || 'db', message: res && res.error === $q.aK ? $t.k12 : $q.aL }, 400);
const link = SITE + $q.aM + t, stop = SITE + $q.aN + t;
const L = labels(filter).map(x => x.t);
const m = await sendMail(env, email, $q.aO, $q.aP + text + $q.aQ + L.join('\n- ') + $q.aR + link + $s.k2 + stop + '\n',
$q.aS + esc(text) + $q.aT + L.map(x => '<li>' + esc(x) + '</li>').join('') + $q.aU + link + $s.k3, stop, $q.aV, $q.aW + th.slice(0, 40));
if (!m.ok) return out({ error: 'mail', message: m.error === 'limit' ? $t.k13 : $t.k14 }, 502);
return out({ ok: true, message: $t.k15, matching_today: seen.length });
}
async function stopSig(env, emailHash) {
const sec = env.KB_SIGN_KEY || env.BREVO_API_KEY || env.KB_HOOK_KEY; if (!sec) return null;
const k = await crypto.subtle.importKey('raw', te.encode($q.aX + sec), { name: 'HMAC', hash: $q.aY }, false, ['sign']);
return [...new Uint8Array(await crypto.subtle.sign('HMAC', k, te.encode(emailHash)))].slice(0, 16).map(x => x.toString(16).padStart(2, '0')).join('');
}
async function stopAllUrl(env, eh) { const s = await stopSig(env, eh); return s ? SITE + $q.aZ + eh + '.' + s : SITE + $q.ba; }
async function alertToken(req, env, ctx, kind) {
const b = await body(req); const t = String((b && b.t) || '');
if (!(await allow(ctx, 'tok:' + ipOf(req) + ':' + new Date().toISOString().slice(0, 13), 30, 3600))) return out({ error: 'rate' }, 429);
const all = kind === 'stop' && t.match(/^e\.([0-9a-f]{64})\.([0-9a-f]{32})$/);
if (all) {
if (!(await ready()).alerts) return out({ error: $q.aA }, 503);
const s = await stopSig(env, all[1]);
if (!s || s !== all[2]) return out({ error: 'token', message: $q.bb }, 400);
let r; try { r = await rpcW($q.bc, { p_email_hash: all[1] }); } catch (e) { return out({ error: 'db' }, 503); }
if (!r || !r.ok) return out({ error: 'db' }, 400);
return out({ ok: true, stopped: r.stopped, all: true });
}
if (!tokOk(t)) return out({ error: 'token', message: $q.bb }, 400);
if (!(await ready()).alerts) return out({ error: $q.aA }, 503);
let r; try { r = await rpcW(kind === $q.r ? $q.bd : $q.be, { p_token_hash: await sha(t) }); } catch (e) { return out({ error: 'db' }, 503); }
if (!r || !r.ok) return out({ error: (r && r.error) || 'db', message: r && r.error === $q.bf ? $t.k16 : r && r.error === $q.bg ? $q.bh : $q.bb }, 400);
return out({ ok: true, sentence: r.sentence, labels: r.filter ? labels(r.filter).map(x => x.t) : undefined, already: !!r.already });
}
async function alertStats() {
try { const d = await rpc($q.bi, {}); return out(Object.assign({ open: true }, d), 200, { 'cache-control': $q.bj }); }
catch (e) { return out({ open: false }, 200, { 'cache-control': $q.D }); }
}
const b64u = s => { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), c => c.charCodeAt(0)); };
async function githubOidc(req, workflowFile) {
const m = (req.headers.get($q.bk) || '').match(/^Bearer ([\w-]+)\.([\w-]+)\.([\w-]+)$/); if (!m) return null;
const hd = JSON.parse(td.decode(b64u(m[1]))), cl = JSON.parse(td.decode(b64u(m[2])));
if (hd.alg !== 'RS256') return null;
const j = await (await fetch($t.k17, { cf: { cacheTtl: 3600 } })).json();
const jwk = (j.keys || []).find(k => k.kid === hd.kid); if (!jwk) return null;
const key = await crypto.subtle.importKey('jwk', { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true }, { name: $q.bl, hash: $q.aY }, false, [$q.bm]);
const ok = await crypto.subtle.verify($q.bl, key, b64u(m[3]), te.encode(m[1] + '.' + m[2]));
const now = Date.now() / 1000;
if (!ok || cl.iss !== $t.k18 || cl.aud !== $q.bn || cl.repository !== $q.bo || !(cl.exp > now) || String(cl.workflow_ref || '').indexOf($q.bp + workflowFile + '@') < 0) return null;
return cl;
}
const MAX_DIGESTS = 250;
async function alertRun(req, env) {
let cl = null; try { cl = await githubOidc(req, $q.bq); } catch (e) {}
if (!cl) return out({ error: $q.br }, 401);
if (!(await ready()).alerts) return out({ ok: true, skipped: $q.bs });
if (!(await mailer(env))) return out({ ok: true, skipped: $q.bt });
const [d, job] = await Promise.all([openData(), rpcW($q.bu, {})]);
if (!job || job.error) return out({ ok: false, error: 'job' }, 503);
const cases = d.cases || [], by = {}; cases.forEach(c => { by[c.id] = c; });
const today = new Set(job.sent_today || []), groups = {};
(job.alerts || []).forEach(a => { (groups[a.email_hash] = groups[a.email_hash] || []).push(a); });
const updates = [], digests = []; let newTotal = 0, failed = 0, deferred = 0;
for (const eh of Object.keys(groups)) {
const A = groups[eh], parts = [];
for (const a of A) {
const f = a.filter || {};
if (!Object.keys(f).length) continue;
const M = cases.filter(c => matches(c, f)).map(c => c.id), seen = new Set(a.seen || []), N = M.filter(id => !seen.has(id));
if (N.length) parts.push({ a, M, N, f });
}
if (!parts.length) continue;
newTotal += parts.reduce((n, x) => n + x.N.length, 0);
if (today.has(eh) || digests.length >= MAX_DIGESTS) { deferred++; continue; }
const to = A[0].email, n = parts.reduce((k, x) => k + x.N.length, 0), stopAll = await stopAllUrl(env, eh);
const row = id => { const c = by[id]; return c.id + ': ' + (c.region === c.market ? c.market : c.region + ', ' + c.market) + ', ' + (c.stage || $q.bv) + ', ' + (c.band || $q.bw) + ', ' + c.score + ' of ' + c.max + $q.bx; };
const txt = $t.k19 + (parts.length > 1 ? 's' : '') + '.\n\n' + parts.map(x => '"' + x.a.sentence + '"\n' + x.N.slice(0, 20).map(id => '- ' + row(id) + '\n  ' + SITE + $q.by + id).join('\n') + (x.N.length > 20 ? $q.bz + (x.N.length - 20) + $q.bA + SITE + $q.bB : '')).join('\n\n') +
$s.k4 + stopAll + '\n';
const html = $t.k20 + (parts.length > 1 ? 's' : '') + '.</p>' + parts.map(x => $q.bC + esc(x.a.sentence) + $q.bD + x.N.slice(0, 20).map(id => $q.bE + SITE + $q.by + id + '">' + esc(row(id)) + $q.bF).join('') + '</ul>' + (x.N.length > 20 ? $q.bG + (x.N.length - 20) + $q.bH : '')).join('') +
$s.k5 + stopAll + $t.k21;
const r = await sendMail(env, to, n + $q.bI + (n === 1 ? '' : 's') + $q.bJ, txt, html, stopAll, $q.bK, 'ydig:' + eh.slice(0, 40) + ':' + new Date().toISOString().slice(0, 10));
if (!r.ok) { failed++; continue; }
digests.push({ email_hash: eh, alerts: parts.length, projects: n });
parts.forEach(x => updates.push({ id: x.a.id, seen: [...new Set([...(x.a.seen || []), ...x.M])], sent: true }));
}
const stats = { alerts: (job.alerts || []).length, addresses: Object.keys(groups).length, new_matches: newTotal, digests: digests.length, deferred, failed, dataset: d.updated, run: cl.run_id || null };
await rpcW($q.bL, { p_updates: updates, p_digests: digests, p_stats: stats });
return out({ ok: true, ...stats });
}
async function caseOf(id) { const d = await openData(); return { d, c: (d.cases || []).find(x => x.id === id) || null }; }
function tailor(c, pr) {
const ck = c.checks || {}, v = c.verified || {}, R = ck.researched || [];
const hand = (pr || []).find(x => x.k === $q.bM);
const why = {
permit: v.permit === $q.bN ? [$t.k22, true] : ck.permit === 2 ? [$s.k6, false] : ck.permit === 1 ? [$t.k23, true] : [$t.k24, true],
title: c.title ? [$q.bO + String(c.title).replace('_', ' ') + (c.lease ? ' (' + c.lease + $q.bP : '') + $t.k25, false] : [$t.k26, true],
escrow: ck.escrow === true ? [$t.k27, false] : R.indexOf($q.Y) < 0 ? [$t.k28, true] : [$t.k29, true],
payment_plan: ck.progress != null ? [$q.bQ + (typeof ck.progress === $q.L ? ' (' + ck.progress + '%)' : '') + $t.k30, false] : [$t.k31, true],
completion_penalty: c.overdue ? [c.overdue + $q.bR + (c.overdue === 1 ? '' : 's') + $t.k32, true] : hand && hand.mv ? [$q.bS + hand.mv + ' time' + (hand.mv === 1 ? '' : 's') + ' (' + hand.mm + $q.bT, true] : c.done ? [$q.bU + c.done + '.', false] : [$q.bV, true],
contract: [$t.k33, false]
};
return why;
}
async function askQuestions(u, env) {
const id = String(u.searchParams.get('id') || '').toUpperCase().trim();
if (!ID_RE.test(id)) return out({ error: 'id' }, 400);
const [{ c }, ms, pr] = await Promise.all([caseOf(id), asset(env, $q.bW), asset(env, $q.C)]);
if (!c) return out({ error: $q.bX }, 404);
const Q = ((ms || {}).questionnaire || []).filter(q => QIDS.includes(q.id));
if (Q.length !== 6) return out({ error: $q.bY }, 503);
const why = tailor(c, pr && pr.projects ? pr.projects[id] : null);
const qs = Q.map(q => ({ id: q.id, topic: q.topic, question: q.question, checkable_answer: q.checkable_answer, why: why[q.id][0], missing: why[q.id][1] }))
.sort((a, b) => (b.missing - a.missing) || (QIDS.indexOf(a.id) - QIDS.indexOf(b.id)));
const subject = $t.k34;
const bodyTxt = $s.k7 +
qs.map((q, i) => (i + 1) + '. ' + q.topic + ': ' + q.question).join('\n\n') + $t.k35;
return out({ id, market: c.market, region: c.region, stage: c.stage, questions: qs, missing: qs.filter(q => q.missing).length, subject, body: bodyTxt,
source: $t.k36 + id }, 200, { 'cache-control': $q.G, 'access-control-allow-origin': '*' });
}
async function askStart(req, env, ctx) {
const r = await ready();
const b = await body(req); const id = String((b && b.id) || '').toUpperCase();
const qs = [...new Set((Array.isArray(b && b.questions) ? b.questions : []).filter(q => QIDS.includes(q)))];
if (!ID_RE.test(id) || !qs.length) return out({ error: 'input' }, 400);
if (!r.asks) return out({ ok: false, ready: false, message: $s.k8 });
if (!(await allow(ctx, 'ask:' + ipOf(req) + ':' + new Date().toISOString().slice(0, 13), 20, 3600))) return out({ error: 'rate' }, 429);
if (!(await caseOf(id)).c) return out({ error: $q.bX }, 404);
const t = token();
let res; try { res = await rpcW($q.bZ, { p_project: id, p_questions: qs, p_token_hash: await sha(t), p_ip_hash: await sha($q.aI + ipOf(req)) }); } catch (e) { return out({ ok: false, ready: false, message: $q.ca }); }
if (!res || !res.ok) return out({ error: (res && res.error) || 'db' }, 400);
return out({ ok: true, ready: true, token: t, report_url: SITE + $q.cb + t });
}
async function askGet(req, ctx) {
const b = await body(req); const t = String((b && b.t) || '');
if (!tokOk(t)) return out({ error: 'token' }, 400);
if (!(await allow(ctx, 'tok:' + ipOf(req) + ':' + new Date().toISOString().slice(0, 13), 30, 3600))) return out({ error: 'rate' }, 429);
if (!(await ready()).asks) return out({ error: $q.aA }, 503);
let r; try { r = await rpcW($q.cc, { p_token_hash: await sha(t) }); } catch (e) { return out({ error: 'db' }, 503); }
if (!r || !r.ok) return out({ error: $q.bX }, 404);
return out(r);
}
async function askReport(req, ctx) {
const b = await body(req); if (!b) return out({ error: 'input' }, 400);
const t = String(b.t || ''); if (!tokOk(t)) return out({ error: 'token' }, 400);
if (!(await allow(ctx, 'tok:' + ipOf(req) + ':' + new Date().toISOString().slice(0, 13), 30, 3600))) return out({ error: 'rate' }, 429);
if (!(await ready()).asks) return out({ error: $q.aA }, 503);
const answered = b.answered === true ? true : b.answered === false ? false : null;
const on = answered ? String(b.answered_on || '') : null;
if (answered === null || (answered && !/^20\d\d-\d\d-\d\d$/.test(on))) return out({ error: 'input' }, 400);
const chk = [...new Set((Array.isArray(b.checkable) ? b.checkable : []).filter(q => QIDS.includes(q)))];
let r; try { r = await rpcW($q.cd, { p_token_hash: await sha(t), p_answered: answered, p_answered_on: on, p_checkable: answered ? chk : [] }); } catch (e) { return out({ error: 'db' }, 503); }
if (!r || !r.ok) return out({ error: (r && r.error) || 'db', message: r && r.error === 'date' ? $t.k37 : $q.aL }, 400);
return out({ ok: true });
}
async function askStats(u) {
const id = String(u.searchParams.get('id') || '').toUpperCase();
let d; try { d = await rpc($q.ce, {}); } catch (e) { return out({ open: false, min_sample: 5 }, 200, { 'cache-control': $q.D, 'access-control-allow-origin': '*' }); }
const G = (d && d.groups) || [], pick = (g, k) => G.find(x => x.grp === g && x.key === k) || null;
const fmt = x => x && { reports: x.n, answered: x.answered, answer_rate_pct: Math.round(x.answered / x.n * 100), median_days_to_answer: x.median_days, checkable_answers_pct: x.asked_in_answered ? Math.round(x.checkable / x.asked_in_answered * 100) : null };
const o = { open: true, min_sample: 5, opened: d.opened, reported: d.reported, all: fmt(pick('all', 'all')),
markets: G.filter(x => x.grp === $q.cf).map(x => Object.assign({ prefix: x.key }, fmt(x))), projects_with_enough_reports: G.filter(x => x.grp === $q.cg).length };
if (ID_RE.test(id)) { o.id = id; o.project = fmt(pick($q.cg, id)); o.market = fmt(pick($q.cf, id.split('-')[0])); }
return out(o, 200, { 'cache-control': $q.bj, 'access-control-allow-origin': '*' });
}
