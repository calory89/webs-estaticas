// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_k__q, $s = TB.kbx_k__s, $t = TB.kbx_k__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import * as KB from './kolaboro.js';
import { TB } from './kbx_strings.js';
const { json, rpc, sha, claude, open } = KB;
export const PATHS = /^\/api\/x\/k\//;
const ASK_MODEL = 'claude-haiku-5-5';
const ASK_PER_HOUR = 10;
const KEY_CREATE_PER_HOUR = 3;
const KEY_PER_MIN = 60;
const cors = r => { const h = new Headers(r.headers); h.set($q.a, '*'); h.set($q.b, $q.c); h.set($q.d, $q.e); h.set($q.f, $s.k0); return new Response(r.body, { status: r.status, headers: h }); };
const ipOf = req => { const ip = req.headers.get($q.g) || 'x'; return ip.includes(':') ? ip.split(':').slice(0, 4).join(':') + '::/64' : ip; };
async function overLimit(req, ctx, name, max, count = true) {
const k = new Request($q.h + name + '/' + encodeURIComponent(ipOf(req)) + '/' + new Date().toISOString().slice(0, 13));
const hit = await caches.default.match(k); const n = hit ? (+(await hit.text()) || 0) : 0;
if (n >= max) return true;
if (count) ctx.waitUntil(caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': $q.i } })));
return false;
}
export async function handle(req, u, env, ctx) {
const p = u.pathname.replace(/\/+$/, '');
if (req.method === $q.j) return cors(new Response(null, { status: 204 }));
try {
if (p.startsWith($q.k) || p === $q.l) return metered(req, u, env, ctx);
if (p === $q.m && req.method === 'GET') return cors(json(await keyStatus()));
if (p === $q.n && req.method === 'POST') return cors(await keyCreate(req, ctx));
if (p === $q.o && req.method === 'GET') return cors(await keyUsage(req));
if (p === $q.p && req.method === 'POST') return cors(await keyRevoke(req));
if (p === $q.q && req.method === 'POST') return cors(await ask(req, env, ctx));
if (p === $q.r && req.method === 'GET') { const c = await corpus(env); return cors(json({ built: c.built, sha256: c.sha256, pages: c.pages, passages_pages: c.nStatic, passages_data: c.docs.length - c.nStatic, data_updated: c.updated })); }
} catch (e) { return cors(json({ error: $q.s, detail: String(e && e.message || e).slice(0, 120) }, 500)); }
return cors(json({ error: $q.t }, 404));
}
let KSTAT = { t: 0, v: null };
async function keyStatus() {
if (KSTAT.v && Date.now() - KSTAT.t < 60000) return KSTAT.v;
let v;
if (!KB.WKEY) v = { open: false, why: $q.u, plans: $t.o_PLANS };
else { try { const s = await rpc($q.v, { p_wkey: KB.WKEY }); v = s && s.ok ? { open: true, plans: $t.o_PLANS, keys_active: s.keys_active, calls_today: s.calls_today } : { open: false, why: $q.u, plans: $t.o_PLANS }; } catch (e) { v = { open: false, why: $q.u, plans: $t.o_PLANS }; } }
KSTAT = { t: Date.now(), v }; return v;
}
const keyOf = req => { const k = req.headers.get($q.w) || ''; return /^kb_live_[0-9a-f]{40}$/.test(k) ? k : null; };
async function keyCreate(req, ctx) {
const st = await keyStatus(); if (!st.open) return json({ error: $q.x, pilot: $q.y }, 503);
let b = {}; try { b = await req.json(); } catch (e) {  }
if (b && b.website) return json({ error: $q.z }, 400);
if (await overLimit(req, ctx, 'keys', KEY_CREATE_PER_HOUR)) return json({ error: 'rate', retry: $q.A }, 429);
const label = String((b && b.label) || '').replace(/[^\p{L}\p{N} ._@-]/gu, '').trim().slice(0, 60);
const raw = new Uint8Array(20); crypto.getRandomValues(raw);
const key = $q.B + [...raw].map(x => x.toString(16).padStart(2, '0')).join('');
const r = await rpc($q.C, { p_wkey: KB.WKEY, p_hash: await sha(key), p_prefix: key.slice(0, 12), p_label: label, p_country: (req.headers.get($q.D) || '').slice(0, 2) });
if (!r || r.error) return json({ error: (r && r.error) || 'db' }, r && r.error === 'busy' ? 503 : 400);
return json({ key, prefix: r.prefix, plan: r.plan, daily_quota: r.daily_quota, created_at: r.created_at, shown_once: true });
}
async function keyUsage(req) {
const st = await keyStatus(); if (!st.open) return json({ error: $q.x }, 503);
const k = keyOf(req); if (!k) return json({ error: $q.E }, 401);
const r = await rpc($q.F, { p_wkey: KB.WKEY, p_hash: await sha(k) });
if (!r || r.error) return json({ error: (r && r.error) || 'db' }, 401);
return json(r);
}
async function keyRevoke(req) {
const st = await keyStatus(); if (!st.open) return json({ error: $q.x }, 503);
const k = keyOf(req); if (!k) return json({ error: $q.E }, 401);
const r = await rpc($q.G, { p_wkey: KB.WKEY, p_hash: await sha(k) });
return json(r && r.ok ? { ok: true } : { error: (r && r.error) || 'db' }, r && r.ok ? 200 : 400);
}
async function metered(req, u, env, ctx) {
if (req.method !== 'GET' && req.method !== 'HEAD') return cors(json({ error: $q.H }, 405));
const st = await keyStatus();
if (!st.open) return cors(json({ error: $q.I, note: $t.k0, open: $q.J }, 503));
const k = keyOf(req); if (!k) return cors(json({ error: $q.E, how: $q.K }, 401));
const kh = await sha(k), mn = Math.floor(Date.now() / 60000), bk = new Request($q.L + kh.slice(0, 24) + '/' + mn);
let used = 0; try { const hit = await caches.default.match(bk); used = hit ? (+(await hit.text()) || 0) : 0; } catch (e) {}
const reset = 60 - Math.floor(Date.now() / 1000) % 60;
if (used >= KEY_PER_MIN) { const r429 = cors(json({ error: $q.M, per_minute: KEY_PER_MIN, retry_after_s: reset }, 429)); r429.headers.set($q.N, String(reset)); r429.headers.set($q.O, $q.P + KEY_PER_MIN + ';w=60'); r429.headers.set($q.Q, $q.R + reset); return r429; }
try { ctx.waitUntil(caches.default.put(bk, new Response(String(used + 1), { headers: { 'cache-control': $q.S } }))); } catch (e) {}
const rest = u.pathname.replace(/^\/api\/x\/k\/m/, '') || '';
const ep = ($q.T + rest).replace(/\/projects\/[^/]+/, $q.U).replace(/\/[0-9a-f]{64}$/, $q.V).replace(/\/(proof|receipt)\/[^/]+$/, $q.W).replace(/\d{4}-\d{2}-\d{2}/g, '{day}').slice(0, 80);
let a; try { a = await rpc($q.X, { p_wkey: KB.WKEY, p_hash: kh, p_endpoint: ep }); } catch (e) { return cors(json({ error: 'db' }, 503)); }
if (!a || a.error) return cors(json({ error: (a && a.error) || 'db', daily_quota: a && a.daily_quota }, a && a.error === 'quota' ? 429 : 401));
const u2 = new URL($q.J + rest + u.search);
const res = await open(new Request(u2, { method: 'GET', headers: req.headers }), u2, env);
const out = cors(res); out.headers.set($q.Y, String(a.daily_quota)); out.headers.set($q.Z, String(a.remaining)); out.headers.set($q.aa, $q.ab);
out.headers.set($q.O, $q.ac + a.daily_quota + $q.ad + KEY_PER_MIN + ';w=60'); out.headers.set($q.Q, $q.ae + Math.max(0, KEY_PER_MIN - used - 1) + ';t=' + reset);
return out;
}
const STOP = new Set('a an and are as at be been by can could did do does for from had has have how i if in into is it its me my no not of on or our should so than that the their them then there these they this to up was we were what when where which who why will with would you your about any all also more most much one other some such only just get got does doing done de la el en et le les un une'.split(' '));
const tok = s => (String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').match(/[a-z]+-\d+|[a-z0-9]+/g) || []).filter(w => !STOP.has(w)).map(w => w.length > 4 && w.endsWith('s') && !/ss$/.test(w) ? w.slice(0, -1) : w);
const norm = s => String(s).toLowerCase().replace(/[‘’‛`´]/g, "'").replace(/[“”„]/g, '"').replace(/[‐-―−]/g, '-').replace(/ /g, ' ').replace(/[*_]/g, '').replace(/\s+/g, ' ').trim();
const yn = v => v === true ? 'yes' : v === false ? 'no' : $q.af;
let CORP = { t: 0, v: null };
async function openJson(path, env) { const u2 = new URL($q.ag + path); const r = await open(new Request(u2), u2, env); return r.json(); }
async function corpus(env) {
if (CORP.v && Date.now() - CORP.t < 600000) return CORP.v;
const ir = await env.ASSETS.fetch(new Request($t.k1));
const idx = await ir.json();
const docs = idx.passages.map(x => ({ id: x.id, kind: 'page', title: x.title, url: x.url, text: x.text }));
const nStatic = docs.length; let updated = null;
try {
const s = await openJson($q.ah, env); updated = s.updated;
const st = s.stages || {}, cl = s.claims || {};
docs.push({ id: $q.ai, kind: 'data', title: $q.aj, url: $q.ah, text:
`On ${s.updated} the Kolaboro database holds ${s.projects} projects in ${s.markets} markets and ${s.countries} countries. ` +
`Developer claims tested: ${s.claims_total} (${cl.verified} verified, ${cl.unverified} unverified, ${cl.contradicted} contradicted). ` +
`Projects with all six checks public: ${s.all_six_public}. Projects with public problems recorded: ${s.with_flags}. ` +
`Overdue projects: ${s.overdue}, on average ${s.overdue_avg_months} months past the promised handover. Delayed projects: ${s.delayed}. ` +
`Stages: ${st[$q.ak]} off-plan, ${st[$q.al]} under construction, ${st.completed} completed. Sources read: ${s.sources}.` });
const m = await openJson($q.am, env);
for (const x of m.markets || []) docs.push({ id: $q.an + x.market.toLowerCase().replace(/[^a-z0-9]+/g, '-'), kind: 'data', title: x.market + $q.ao, url: $q.ap + encodeURIComponent(x.market), text:
`${x.market} (${x.country}) in the Kolaboro database: ${x.projects} projects tracked. Average public checks: ${x.avg_checks} of 6. Average confirmed checks: ${x.avg_confirmed} of 6. ` +
`Permit number public for ${x.permit_public_pct}% of projects. Deposit protection public for ${x.deposit_protection_pct}%. Projects with all six checks public: ${x.all_six_public}. ` +
`Projects with public problems recorded: ${x.with_flags}. Transparency index: ${x.transparency_index} out of 100.` });
const pl = await openJson($q.aq, env);
for (const x of pl.projects || []) {
const c = x.checks || {}, cl2 = x.claims || {};
docs.push({ id: $q.ar + x.id, kind: $q.as, title: $q.at + x.id + $q.au, url: $q.av + encodeURIComponent(x.id), proof: $q.aw + encodeURIComponent(x.id), text:
`Project ${x.id} (${x.market}, ${x.country}${x.region ? ', ' + x.region : ''}) is ${x.stage || $q.ax}. Price band: ${x.band || $q.af}. Promised completion: ${x.done || $q.af}. ` +
`Title: ${x.title || $q.af}${x.lease ? ', ' + x.lease + $q.ay : ''}. Units: ${x.units || $q.af}. Public checks: ${x.score} of ${x.max}. Confirmed by a register or independent source: ${x.vscore == null ? $q.az : x.vscore + ' of 6'}. ` +
`Permit number public: ${yn(c.permit_public)}. Deposit protection public: ${yn(c.deposit_protection)}. Construction progress public: ${yn(c.progress)}. Plans public: ${yn(c.plans)}. Track record public: ${yn(c.track_record)}. No guaranteed returns: ${yn(c.no_guaranteed_returns)}. ` +
`Developer claims tested: ${cl2.verified || 0} verified, ${cl2.unverified || 0} unverified, ${cl2.contradicted || 0} contradicted. Public problems recorded: ${x.flags || 0}.${x.delay ? $q.aA + x.delay + $q.aB : ''}` });
}
} catch (e) {  }
const df = new Map(); let total = 0;
for (const d of docs) { d.toks = tok(d.title + ' ' + d.text); total += d.toks.length; d.tf = new Map(); for (const w of d.toks) d.tf.set(w, (d.tf.get(w) || 0) + 1); for (const w of d.tf.keys()) df.set(w, (df.get(w) || 0) + 1); }
const v = { docs, df, avg: total / docs.length, nStatic, built: idx.built, sha256: idx.sha256, pages: (idx.pages || []).length, updated };
CORP = { t: Date.now(), v }; return v;
}
function retrieve(C, q) {
const qt = [...new Set(tok(q))], N = C.docs.length;
const ids = new Set((q.toUpperCase().match(/\b[A-Z]{2,6}-\d{2,4}\b/g) || []));
const scored = [];
for (const d of C.docs) {
let s = 0;
for (const w of qt) { const f = d.tf.get(w); if (!f) continue; const n = C.df.get(w) || 0; const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5)); s += idf * f * 2.2 / (f + 1.2 * (0.25 + 0.75 * d.toks.length / C.avg)); }
if (d.kind === $q.as) s *= ids.has(d.id.slice(13)) ? 3 : 0.6;
if (s > 0) scored.push([s, d]);
}
scored.sort((a, b) => b[0] - a[0]);
const out = [], per = new Map(); let nproj = 0;
for (const id of ids) { const d = C.docs.find(x => x.id === $q.ar + id); if (d && out.length < 3) { out.push({ d, s: 99 }); nproj++; } }
for (const [s, d] of scored) {
if (out.length >= 8) break; if (out.some(x => x.d === d)) continue;
const page = d.url.split('#')[0]; if ((per.get(page) || 0) >= 3) continue;
if (d.kind === $q.as && nproj >= 3) continue;
if (s < scored[0][0] * 0.25) break;
out.push({ d, s }); per.set(page, (per.get(page) || 0) + 1); if (d.kind === $q.as) nproj++;
}
return { hits: out, best: scored.length ? scored[0][0] : 0, terms: qt };
}
function check(sent, d) {
const P = norm(d.text), P2 = P.replace(/,(?=\d{3})/g, '');
const qn = norm(sent.quote || '').replace(/^["'.,;: ]+|["'.,;: ]+$/g, '').replace(/\.\.\.|…/g, '');
if (qn.length < 15) return $q.aC;
if (!P.includes(qn)) return $q.aD;
const text = norm(sent.text || '');
for (const n of text.match(/\d+(?:[.,]\d+)*/g) || []) { const x = n.replace(/,(?=\d{3})/g, ''); if (!P2.includes(x)) return $q.aE + n + $q.aF; }
const pw = new Set(tok(d.title + ' ' + d.text).map(w => w.slice(0, 5)));
const sw = tok(sent.text || '').filter(w => w.length >= 4 && !/^\d+$/.test(w));
if (sw.length) { const sup = sw.filter(w => pw.has(w.slice(0, 5))).length / sw.length; if (sup < 0.6) return $q.aG + Math.round(sup * 100) + $q.aH; }
return null;
}
const frag = (url, quote) => url.startsWith('/api/') || url.startsWith('/p/') ? url : url.split('#')[0] + $q.aI + encodeURIComponent(String(quote).split(/\s+/).slice(0, 8).join(' ')).replace(/-/g, '%2D');
async function ask(req, env, ctx) {
let b; try { b = await req.json(); } catch (e) { return json({ error: $q.z }, 400); }
const q = String((b && b.q) || '').replace(/\s+/g, ' ').trim().slice(0, 300);
if (q.length < 6) return json({ error: $q.aJ, detail: $t.k2 }, 400);
const C = await corpus(env);
const ck = new Request($q.aK + (C.sha256 || '').slice(0, 8) + '/' + (C.updated || '') + '/' + encodeURIComponent(q.toLowerCase()));
const hit = await caches.default.match(ck); if (hit) return json({ ...(await hit.json()), cached: true });
const R = retrieve(C, q);
const seen = R.hits.map((h, i) => ({ sid: 'S' + (i + 1), id: h.d.id, title: h.d.title, url: h.d.url, proof: h.d.proof || null, kind: h.d.kind, text: h.d.text }));
const base = { q, index: { built: C.built, data_updated: C.updated, passages: C.docs.length }, passages: seen };
const idk = (why, extra) => ({ ...base, answer: [], dropped: [], unknown: true, why, model: null, ...(extra || {}) });
if (!seen.length || R.best < 2) { const out = idk($t.k3); ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(out), { headers: { 'cache-control': $q.aL } }))); return json(out); }
if (!env.ANTHROPIC_API_KEY) return json(idk($q.aM), 503);
if (await overLimit(req, ctx, 'ask', ASK_PER_HOUR)) return json({ error: 'rate', detail: $t.k4 }, 429);
const prompt = $q.aN + seen.map(s => '[' + s.sid + '] ' + s.title + '\n' + s.text).join('\n\n') + $q.aO + q + $q.aP;
let out; try { out = await claude(env, prompt, $s.ASK_SYSTEM, ASK_MODEL); } catch (e) { return json({ error: e && e.budget ? $q.aQ : 'model', detail: e && e.budget ? $t.k5 : $q.aR }, 503); }
const answer = [], dropped = [];
for (const s of (Array.isArray(out && out.sentences) ? out.sentences : []).slice(0, 8)) {
const src = seen.find(x => x.sid === String(s && s.source || '').trim());
const text = String(s && s.text || '').replace(/\s*—\s*/g, ', ').trim().slice(0, 400);
if (!text) continue;
const why = !src ? $q.aS : check({ text, quote: s.quote }, src);
if (why) { dropped.push({ text, why }); continue; }
const quote = String(s.quote).trim().slice(0, 400);
answer.push({ text, source: src.sid, id: src.id, quote, link: frag(src.url, quote), proof: src.proof });
}
const res = answer.length ? { ...base, answer, dropped, unknown: false, model: ASK_MODEL } : idk(out && out.answerable === false ? $t.k6 : $t.k7, { dropped, model: ASK_MODEL });
ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(res), { headers: { 'cache-control': $q.aL } })));
return json(res);
}
export const _t = { retrieve, corpus, check, tok, norm };
