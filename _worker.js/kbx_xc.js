// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_xc__q, $s = TB.kbx_xc__s, $t = TB.kbx_xc__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { rpcW, sha } from './kolaboro.js';
import { TB } from './kbx_strings.js';
export const PATHS = /^\/k\/xray-cta\.js$|^\/api\/x\/xc(\/|$)|^\/embed\/xray(\.js|\/)?$|^\/__k\/kxc-admin\.js$/;
const SITE = 'https://kolaboro.com';
const PAY = 'https://www.paypal.com/ncp/payment/32ENX4QK833GE';
const te = new TextEncoder();
const STEPS = /^(run|pasted|first_card|full|gaps_viewed|questions_copied|questions_mailto|checkout_opened|checkout_paypal|monitor_opened|watch|email_req|email_sent|sample_open|embed_click|remind_optin)$/;
const ROOT_RX = /^[0-9a-f]{16,64}$/;
const DOM_RX = /^[a-z0-9][a-z0-9.-]{1,252}$/;
const EMAIL_RX = /^[^@\s<>"',;]+@[^@\s<>"',;]+\.[^@\s<>"',;]+$/;
const COPY = {
A: { h: 'What the X-ray could not verify online', sub: 'Free sources stop at the website. The €490 check goes to the land office and reads your contract; the visit to the plot by a local agent is on request: we confirm a local agent for your location before you pay.', cta: 'Order the €490 check for this project' },
B: { h: 'The gaps a website cannot close', sub: 'Each gap below needs a person at the land office, on the site or with your contract. That is what the €490 check does.', cta: 'Have these gaps checked, €490' },
};
const OFFER = {
price: '€490', per: 'one-off, per property', refund: 'Full refund if we cannot take your case.',
items: ['Title and zoning checked at the land office by a local agent (on request)', "Permits and the developer's track record", 'Contract read for risky clauses', 'Site visit with GPS-stamped photos and video (on request)', 'Written report, reviewed before it is sent'],
timeline: [['Same day', 'We confirm your case and email you a login to it.'], ['Within 2 days', 'Documents: land certificate, permit and contract are shared and read.'],
['Within 5 days', 'Land office and site visit: title checked, plot filmed with GPS- and time-stamped photos. Site visits are on request: we first confirm an agent for your location.'], ['Usually within 7 days', 'Written report: nine checks, every finding linked to its evidence.']],
pay: PAY, book: '/book/', pricing: '/pricing',
};
const MONITOR = { price: '€99', per: 'per month, per property', items: ['Monthly GPS-stamped site visit (on request)', 'Milestone check before every payment (on request)', '"Go" or "hold" advice, based on the evidence', 'Delay alerts by email', 'Final handover inspection (on request)'] };
const SAMPLE = { url: '/report/sample', label: 'Sample client report', note: 'a fictional project in Bali, built like a real report' };
function out(o, s = 200, extra) { return new Response(JSON.stringify(o), { status: s, headers: Object.assign({ 'content-type': $q.a, 'cache-control': $q.b, 'x-content-type-options': $q.c }, extra || {}) }); }
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.d, "'": '&#39;' }[c]));
const hostOf = u => { try { return new URL(/^https?:\/\//i.test(u) ? u : $q.e + u).hostname.toLowerCase().replace(/^www\./, ''); } catch (e) { return ''; } };
const normU = u => String(u || '').trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/[?#].*$/, '').replace(/\/+$/, '');
const ipOf = req => { const a = req.headers.get($q.f) || 'x'; return a.includes(':') ? a.split(':').slice(0, 4).join(':') + '::/64' : a; };
async function allow(ctx, key, limit, ttl) {
const k = new Request(SITE + $q.g + encodeURIComponent(key));
const hit = await caches.default.match(k); const n = hit ? (+(await hit.text()) || 0) : 0;
if (n >= limit) return false;
const p = caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': $q.h + ttl } }));
if (ctx && ctx.waitUntil) ctx.waitUntil(p); else await p;
return true;
}
async function body(req) { try { const t = await req.text(); if (t.length > 6000) return null; if (/^\s*\{/.test(t)) return JSON.parse(t); return Object.fromEntries(new URLSearchParams(t)); } catch (e) { return null; } }
async function xc(action, payload) { try { return await rpcW($q.i, { p_action: action, p_payload: payload }); } catch (e) { return { error: 'db' }; } }
const dbMissing = r => !r || r.error === 'db' || r.code === $q.j || /Could not find the function/i.test(r.message || '');
let HM = null;
async function match(env, raw) {
let N; try { N = await import('./kbx_named.js'); } catch (e) { return null; }
let ix; try { ix = await N.data(env); } catch (e) { return null; }
if (!HM || HM.ix !== ix) {
const byU = new Map(), byH = new Map();
for (const x of ix.P) for (const u of [x.url, x.du]) {
if (!N.okHttp(u)) continue;
byU.set(normU(u), x);
if (!N.isListing(u)) { const h = hostOf(u); if (h) { const a = byH.get(h) || new Set(); a.add(x); byH.set(h, a); } }
}
HM = { ix, byU, byH };
}
const n = normU(raw), h = hostOf(raw);
let x = HM.byU.get(n) || null, dev = null;
const hs = h ? HM.byH.get(h) : null;
if (!x && hs && hs.size === 1) x = [...hs][0];
if (!x && hs && hs.size > 1) { const d = new Set([...hs].map(p => p.dvs).filter(Boolean)); if (d.size === 1) dev = ix.devs.get([...d][0]) || null; }
if (x && x.dvs) dev = ix.devs.get(x.dvs) || null;
if (!x && !dev) {
const q = String(raw || '').trim().toLowerCase();
if (q.length >= 4 && !/[./]/.test(q)) x = ix.P.find(p => String(p.n || '').toLowerCase() === q) || null;
if (x && x.dvs) dev = ix.devs.get(x.dvs) || null;
}
if (!x && !dev) return null;
let proj = null;
if (x) {
const ho = N.handoverOf(ix, x), c = ix.caseBy.get(x.id);
proj = { id: x.id, slug: x.s, name: x.n, url: $q.k + x.s + '/', stage: x.st || (c && c.stage) || null, market: x.mk || null, country: x.co || null,
handover: ho ? String(ho.d) : null, handover_future: ho ? future(String(ho.d)) : null, reviewed: N.reviewed(c) };
}
return { project: proj, developer: dev ? { slug: dev.s, name: dev.n, url: $q.l + dev.s + '/', projects: dev.ids.length } : null };
}
function future(d) {
const m = String(d).match(/^(\d{4})(?:-(?:Q([1-4])|(\d{2})))?/i); if (!m) return null;
const y = +m[1], end = m[2] ? new Date(Date.UTC(y, +m[2] * 3, 0)) : m[3] ? new Date(Date.UTC(y, +m[3], 0)) : new Date(Date.UTC(y, 11, 31));
return end.getTime() > Date.now();
}
function variant(env, u) {
const q = (u.searchParams.get('cta') || '').toUpperCase();
if (q === 'A' || q === 'B') return q;
const f = String(env.KB_XRAY_CTA || 'A').toUpperCase();
if (f === 'B') return 'B';
if (f === 'AB') { const b = +u.searchParams.get('b'); return Number.isFinite(b) && b >= 50 ? 'B' : 'A'; }
return 'A';
}
async function ctxRoute(req, u, env, ctx) {
const raw = (u.searchParams.get('url') || u.searchParams.get('q') || '').slice(0, 400);
const domain = /[.]/.test(raw) && !/\s/.test(raw.trim()) ? hostOf(raw) : '';
const v = variant(env, u);
const m = raw ? await match(env, raw) : null;
let counts = { runs: null, watchers: null, threshold: 3 }, db = null;
if (domain || (m && m.project)) {
const ck = new Request(SITE + $q.m + encodeURIComponent(domain + '|' + ((m && m.project && m.project.id) || '')));
const hit = await caches.default.match(ck);
let r = hit ? await hit.json() : null;
if (!r) { r = await xc($q.n, { domain, ref: (m && m.project && m.project.id) || '' }); if (r && r.ok) ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(r), { headers: { 'cache-control': $q.o } }))); }
db = !dbMissing(r) && r && r.error !== $q.p;
if (r && r.ok) counts = { runs: r.runs || null, watchers: r.watchers || null, threshold: r.threshold || 3 };
}
const p = m && m.project;
const stage = p && p.stage ? String(p.stage).toLowerCase() : '';
const monitoring = p ? { offered: /off-plan|under construction|pre-?launch|launch/.test(stage) && p.handover_future === true, stage: p.stage, handover: p.handover, source: p.url } : { offered: null };
return out({ ok: true, v, copy: COPY[v], domain: domain || null, named: m ? m.project : null, developer: m ? m.developer : null, counts, db,
monitoring, monitor_offer: MONITOR, offer: OFFER, sample: SAMPLE, watch_api: $q.q, mail: true }, 200, { 'cache-control': $q.r });
}
async function evRoute(req, u, env, ctx) {
if (req.method === $q.s) return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST', 'access-control-allow-headers': $q.t, 'access-control-max-age': '86400' } });
const b = await body(req); if (!b) return out({ error: 'body' }, 400);
const step = String(b.step || ''); if (!STEPS.test(step)) return out({ error: 'step' }, 400);
const orig = req.headers.get($q.u) || '', ours = /^https:\/\/(www\.)?kolaboro\.com$/.test(orig);
const cors = { 'access-control-allow-origin': '*' };
if (step === $q.v) {
const h = hostOf(orig || req.headers.get($q.w) || b.h || '');
if (!h || !DOM_RX.test(h) || !(await allow(ctx, 'xe|' + ipOf(req), 30, 600))) return out({ ok: false }, 200, cors);
const r = await xc('ev', { step, domain: h, page: $q.x, data: { src: 'embed' } });
return out({ ok: !!(r && r.ok) }, 200, cors);
}
if (orig && !ours) return out({ error: $q.u }, 403);
if (!(await allow(ctx, 'xv|' + ipOf(req), 150, 600))) return out({ error: 'rate' }, 429);
const domain = hostOf(String(b.domain || '')), root = ROOT_RX.test(String(b.root || '')) ? String(b.root) : null;
const data = { root, v: /^[AB]$/.test(b.v) ? b.v : 'A', sid: /^[a-z0-9]{6,24}$/i.test(b.sid || '') ? b.sid : null, src: String(b.src || '').replace(/[^a-z0-9_.-]/gi, '').slice(0, 40) || null,
cards: Number.isFinite(+b.cards) ? Math.min(99, Math.max(0, +b.cards | 0)) : null, named: /^[a-z0-9-]{1,90}$/.test(b.named || '') ? b.named : null, test: b.test ? '1' : undefined };
if (step === 'run') data.ih = (await sha($q.y + ipOf(req))).slice(0, 16);
const r = await xc('ev', { step, domain: DOM_RX.test(domain) ? domain : '', page: $q.z, data });
if (dbMissing(r)) return out({ ok: false, stored: false, why: $q.A }, 202);
return out({ ok: !!(r && r.ok), error: r && r.error });
}
function b64u(bytes) { let s = ''; bytes.forEach(x => s += String.fromCharCode(x)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function unb64u(s) { const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)); return Uint8Array.from(b, c => c.charCodeAt(0)); }
async function hmac(env, msg) {
const sec = env.KB_SIGN_KEY || env.KB_HOOK_KEY; if (!sec) return null;
const k = await crypto.subtle.importKey('raw', te.encode($q.B + sec), { name: 'HMAC', hash: $q.C }, false, ['sign']);
return b64u(new Uint8Array(await crypto.subtle.sign('HMAC', k, te.encode(msg))).slice(0, 16));
}
async function mkTok(env, o) { const p = b64u(te.encode(JSON.stringify(o))), s = await hmac(env, p); return s ? p + '.' + s : null; }
async function rdTok(env, t) {
const m = String(t || '').match(/^([A-Za-z0-9_-]{20,400})\.([A-Za-z0-9_-]{22})$/); if (!m) return null;
const s = await hmac(env, m[1]); if (!s || s !== m[2]) return null;
let o; try { o = JSON.parse(new TextDecoder().decode(unb64u(m[1]))); } catch (e) { return null; }
if (!o || !(o.x > Date.now()) || !EMAIL_RX.test(o.e || '') || !ROOT_RX.test(o.r || '') || !DOM_RX.test(o.d || '')) return null;
return o;
}
async function emailRoute(req, u, env, ctx) {
if (req.method !== 'POST') return out({ error: $q.D }, 405);
const orig = req.headers.get($q.u); if (orig && !/^https:\/\/(www\.)?kolaboro\.com$/.test(orig)) return out({ error: $q.u }, 403);
const b = await body(req); if (!b) return out({ error: 'body' }, 400);
if (b.hp) return out({ ok: true });
const e = String(b.email || '').trim().toLowerCase(), root = String(b.root || ''), d = hostOf(String(b.domain || '')), pu = String(b.url || '');
if (e.length > 120 || !EMAIL_RX.test(e)) return out({ error: 'email' }, 400);
if (!ROOT_RX.test(root) || !DOM_RX.test(d)) return out({ error: 'xray' }, 400);
if (!(await allow(ctx, 'xm|' + ipOf(req), 5, 3600))) return out({ error: 'rate' }, 429);
const t = await mkTok(env, Object.assign({ e, r: root, d, x: Date.now() + 7 * 86400000 }, /^https?:\/\/[^\s"<>]{3,240}$/.test(pu) && hostOf(pu) === d ? { u: pu } : {})); if (!t) return out({ error: $q.E }, 503);
const link = SITE + $q.F + t;
const html = $t.k0 + esc(d) + $q.G +
$s.k0;
const r = await xc('mail', { kind: $q.H, to: e, subject: $t.k1 + d, html, dedupe: 'xc:' + (await sha(e + '|' + root)).slice(0, 40), cta: $q.I, url: link });
if (dbMissing(r)) return out({ error: $q.J, message: $t.k2 }, 503);
if (!r || !r.ok) return out({ error: (r && r.error) || 'db' }, r && (r.error === 'limit' || r.error === $q.K) ? 429 : 400);
ctx.waitUntil(xc('ev', { step: $q.L, domain: d, page: $q.z, data: { root } }));
return out({ ok: true, next: r.duplicate ? $q.M : $q.N });
}
function page(title, inner, status) {
  const h = $q.O + esc(title) + $q.P +
    $q.Q +
    $q.R + inner + $q.S;
  return new Response(h, { status: status || 200, headers: { 'content-type': $q.T, 'cache-control': $q.b, 'x-frame-options': 'DENY', 'referrer-policy': $q.U, 'x-content-type-options': $q.c } });
}
async function confirmRoute(req, u, env, ctx) {
if (req.method === 'GET') {
const t = u.searchParams.get('t') || '', o = await rdTok(env, t);
if (!o) return page($q.V, $s.k1, 400);
return page($q.W, $q.X + esc(o.d) + $t.k3 + esc(o.e) + $q.Y +
$t.k4 + esc(t) + $t.k5);
}
if (req.method !== 'POST') return out({ error: $q.D }, 405);
const b = await body(req), o = await rdTok(env, b && b.t);
if (!o) return page($q.V, $t.k6, 400);
const xu = SITE + '/x/' + o.r + '/', ru = SITE + $q.Z + encodeURIComponent(o.u || $q.e + o.d) + '#xr';
const html = $q.aa + esc(o.d) + $s.k2 + xu + '">' + esc(xu.replace($q.e, '')) + $t.k7 +
$s.k3 + SITE + $q.ab;
const r = await xc('mail', { kind: $q.ac, to: o.e, subject: $q.ad + o.d, html, dedupe: 'xs:' + (await sha(b.t)).slice(0, 40), cta: $q.ae, url: ru });
if (!r || !r.ok) return page($q.af, $t.k8 + esc(r && r.error === 'limit' ? $t.k9 : $q.ag) + '</p>', 503);
ctx.waitUntil(xc('ev', { step: $q.ah, domain: o.d, page: $q.ai, data: { root: o.r } }));
return page('Sent', $q.aj + (r.duplicate ? $t.k10 : $q.ak) + $q.al + esc(ru.replace(SITE, '')) + $q.am);
}
async function seenRoute(req, u, env, ctx) {
if (req.method !== 'POST') return out({ error: $q.D }, 405);
const orig = req.headers.get($q.u); if (orig && !/^https:\/\/(www\.)?kolaboro\.com$/.test(orig)) return out({ error: $q.u }, 403);
const b = await body(req); if (!b || !b.token) return out({ error: 'auth' }, 401);
if (!(await allow(ctx, 'xs|' + ipOf(req), 60, 600))) return out({ error: 'rate' }, 429);
const pl = { token: String(b.token).slice(0, 200), root: String(b.root || ''), domain: hostOf(String(b.domain || '')), url: String(b.url || '').slice(0, 300), lang: String(b.lang || 'en').slice(0, 5) };
if (typeof b.optin === $q.an) pl.optin = b.optin;
const r = await xc('seen', pl);
if (dbMissing(r)) return out({ ok: false, ready: false }, 202);
if (r && r.ok && pl.optin) ctx.waitUntil(xc('ev', { step: $q.ao, domain: pl.domain, page: $q.z, data: { root: pl.root } }));
return out(r && r.ok ? { ok: true, optin: !!r.optin, stopped: !!r.stopped } : { error: (r && r.error) || 'db' }, r && r.ok ? 200 : r && r.error === 'auth' ? 401 : 400);
}
async function stopRoute(req, u, env, ctx) {
const t = u.searchParams.get('t') || '';
const r = /^[0-9a-f]{32}$/.test(t) ? await xc('stop', { tok: t }) : { error: 'token' };
if (!r || !r.ok) return page($q.V, $s.k4, 400);
return page($q.ap, $s.k5);
}
function embedDoc() {
const snip = $t.k11;
const inner = $s.k6 + esc(snip) + $q.aq +
$t.k12 +
$s.k7 +
$s.k8 +
$s.k9;
const h = $s.k10 + inner + $q.ar +
$t.k13 + JSON.stringify(snip).replace(/</g, $q.as) + $s.k11 +
$t.k14;
return new Response(h, { headers: { 'content-type': $q.T, 'cache-control': $q.at, 'x-content-type-options': $q.c } });
}
async function status(env) {
  const r = await xc($q.n, { domain: $q.au });
  return out({ ok: true, db_functions: !dbMissing(r) && !!(r && r.ok), mail_signing: !!(env.KB_SIGN_KEY || env.KB_HOOK_KEY), cta_flag: String(env.KB_XRAY_CTA || 'A'),
    reminder_cron: $q.av, threshold: 3, prices: { check: OFFER.price, monitoring: MONITOR.price + ' ' + MONITOR.per }, pay: PAY });
}
export async function handle(req, u, env, ctx) {
const p = u.pathname;
if (p === $q.aw) {
const r = await env.ASSETS.fetch(new Request(SITE + $q.ax));
return new Response(r.body, { status: r.status, headers: { 'content-type': $q.ay, 'cache-control': $q.az, 'x-content-type-options': $q.c } });
}
if (p === $q.x) return new Response($s.EMBED_JS, { headers: { 'content-type': $q.ay, 'cache-control': $q.aA, 'access-control-allow-origin': '*', 'x-content-type-options': $q.c, 'cross-origin-resource-policy': $q.aB } });
if (p === $q.aC || p === $q.aD) return p.endsWith('/') ? embedDoc() : new Response(null, { status: 301, headers: { location: $q.aD } });
if (p === $q.aE) return new Response($s.ADMIN_JS, { headers: { 'content-type': $q.ay, 'cache-control': $q.b } });
try {
if (p === $q.aF && req.method === 'GET') return await ctxRoute(req, u, env, ctx);
if (p === $q.aG) return await evRoute(req, u, env, ctx);
if (p === $q.aH) return await emailRoute(req, u, env, ctx);
if (p === $q.ai) return await confirmRoute(req, u, env, ctx);
if (p === $q.aI) return await seenRoute(req, u, env, ctx);
if (p === $q.aJ && req.method === 'GET') return await stopRoute(req, u, env, ctx);
if (p === $q.aK || p === $q.aL) return await status(env);
} catch (e) { return out({ error: $q.aM, message: String(e && e.message || e).slice(0, 200) }, 500); }
return out({ error: $q.aN }, 404);
}
