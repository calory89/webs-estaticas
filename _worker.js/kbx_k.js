// comments: _notes/kolaboro-worker-comments.txt
import * as KB from './kolaboro.js';
import { TB } from './kbx_strings.js';
const { json, rpc, sha, claude, open } = KB;
export const PATHS = /^\/api\/x\/k\//;
const ASK_MODEL = 'claude-haiku-5-5';
const ASK_PER_HOUR = 10;
const KEY_CREATE_PER_HOUR = 3;
const KEY_PER_MIN = 60;
const cors = r => { const h = new Headers(r.headers); h.set('access-control-allow-origin', '*'); h.set('access-control-allow-headers', 'x-api-key, content-type'); h.set('access-control-allow-methods', 'GET, POST, OPTIONS'); h.set('access-control-expose-headers', TB.kbx_k__s.k0); return new Response(r.body, { status: r.status, headers: h }); };
const ipOf = req => { const ip = req.headers.get('cf-connecting-ip') || 'x'; return ip.includes(':') ? ip.split(':').slice(0, 4).join(':') + '::/64' : ip; };
async function overLimit(req, ctx, name, max, count = true) {
const k = new Request('https://kolaboro.com/__kx_rl/' + name + '/' + encodeURIComponent(ipOf(req)) + '/' + new Date().toISOString().slice(0, 13));
const hit = await caches.default.match(k); const n = hit ? (+(await hit.text()) || 0) : 0;
if (n >= max) return true;
if (count) ctx.waitUntil(caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=3600' } })));
return false;
}
export async function handle(req, u, env, ctx) {
const p = u.pathname.replace(/\/+$/, '');
if (req.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));
try {
if (p.startsWith('/api/x/k/m/') || p === '/api/x/k/m') return metered(req, u, env, ctx);
if (p === '/api/x/k/keys/status' && req.method === 'GET') return cors(json(await keyStatus()));
if (p === '/api/x/k/keys' && req.method === 'POST') return cors(await keyCreate(req, ctx));
if (p === '/api/x/k/keys/me' && req.method === 'GET') return cors(await keyUsage(req));
if (p === '/api/x/k/keys/revoke' && req.method === 'POST') return cors(await keyRevoke(req));
if (p === '/api/x/k/ask' && req.method === 'POST') return cors(await ask(req, env, ctx));
if (p === '/api/x/k/ask/index' && req.method === 'GET') { const c = await corpus(env); return cors(json({ built: c.built, sha256: c.sha256, pages: c.pages, passages_pages: c.nStatic, passages_data: c.docs.length - c.nStatic, data_updated: c.updated })); }
} catch (e) { return cors(json({ error: 'server', detail: String(e && e.message || e).slice(0, 120) }, 500)); }
return cors(json({ error: 'not_found' }, 404));
}
let KSTAT = { t: 0, v: null };
async function keyStatus() {
if (KSTAT.v && Date.now() - KSTAT.t < 60000) return KSTAT.v;
let v;
if (!KB.WKEY) v = { open: false, why: 'opening soon', plans: TB.kbx_k__t.o_PLANS };
else { try { const s = await rpc('kolaboro_k_status', { p_wkey: KB.WKEY }); v = s && s.ok ? { open: true, plans: TB.kbx_k__t.o_PLANS, keys_active: s.keys_active, calls_today: s.calls_today } : { open: false, why: 'opening soon', plans: TB.kbx_k__t.o_PLANS }; } catch (e) { v = { open: false, why: 'opening soon', plans: TB.kbx_k__t.o_PLANS }; } }
KSTAT = { t: Date.now(), v }; return v;
}
const keyOf = req => { const k = req.headers.get('x-api-key') || ''; return /^kb_live_[0-9a-f]{40}$/.test(k) ? k : null; };
async function keyCreate(req, ctx) {
const st = await keyStatus(); if (!st.open) return json({ error: 'opening_soon', pilot: 'https://kolaboro.com/api-pilot' }, 503);
let b = {}; try { b = await req.json(); } catch (e) {  }
if (b && b.website) return json({ error: 'bad_request' }, 400);
if (await overLimit(req, ctx, 'keys', KEY_CREATE_PER_HOUR)) return json({ error: 'rate', retry: 'in an hour' }, 429);
const label = String((b && b.label) || '').replace(/[^\p{L}\p{N} ._@-]/gu, '').trim().slice(0, 60);
const raw = new Uint8Array(20); crypto.getRandomValues(raw);
const key = 'kb_live_' + [...raw].map(x => x.toString(16).padStart(2, '0')).join('');
const r = await rpc('kolaboro_k_key_create', { p_wkey: KB.WKEY, p_hash: await sha(key), p_prefix: key.slice(0, 12), p_label: label, p_country: (req.headers.get('cf-ipcountry') || '').slice(0, 2) });
if (!r || r.error) return json({ error: (r && r.error) || 'db' }, r && r.error === 'busy' ? 503 : 400);
return json({ key, prefix: r.prefix, plan: r.plan, daily_quota: r.daily_quota, created_at: r.created_at, shown_once: true });
}
async function keyUsage(req) {
const st = await keyStatus(); if (!st.open) return json({ error: 'opening_soon' }, 503);
const k = keyOf(req); if (!k) return json({ error: 'missing_key' }, 401);
const r = await rpc('kolaboro_k_key_usage', { p_wkey: KB.WKEY, p_hash: await sha(k) });
if (!r || r.error) return json({ error: (r && r.error) || 'db' }, 401);
return json(r);
}
async function keyRevoke(req) {
const st = await keyStatus(); if (!st.open) return json({ error: 'opening_soon' }, 503);
const k = keyOf(req); if (!k) return json({ error: 'missing_key' }, 401);
const r = await rpc('kolaboro_k_key_revoke', { p_wkey: KB.WKEY, p_hash: await sha(k) });
return json(r && r.ok ? { ok: true } : { error: (r && r.error) || 'db' }, r && r.ok ? 200 : 400);
}
async function metered(req, u, env, ctx) {
if (req.method !== 'GET' && req.method !== 'HEAD') return cors(json({ error: 'method' }, 405));
const st = await keyStatus();
if (!st.open) return cors(json({ error: 'keys_opening_soon', note: TB.kbx_k__t.k0, open: 'https://kolaboro.com/api/open' }, 503));
const k = keyOf(req); if (!k) return cors(json({ error: 'missing_key', how: 'https://kolaboro.com/api-keys/' }, 401));
const kh = await sha(k), mn = Math.floor(Date.now() / 60000), bk = new Request('https://kolaboro.com/__kx_rl/keymin/' + kh.slice(0, 24) + '/' + mn);
let used = 0; try { const hit = await caches.default.match(bk); used = hit ? (+(await hit.text()) || 0) : 0; } catch (e) {}
const reset = 60 - Math.floor(Date.now() / 1000) % 60;
if (used >= KEY_PER_MIN) { const r429 = cors(json({ error: 'rate_limited', per_minute: KEY_PER_MIN, retry_after_s: reset }, 429)); r429.headers.set('retry-after', String(reset)); r429.headers.set('ratelimit-policy', '"key-minute";q=' + KEY_PER_MIN + ';w=60'); r429.headers.set('ratelimit', '"key-minute";r=0;t=' + reset); return r429; }
try { ctx.waitUntil(caches.default.put(bk, new Response(String(used + 1), { headers: { 'cache-control': 'max-age=120' } }))); } catch (e) {}
const rest = u.pathname.replace(/^\/api\/x\/k\/m/, '') || '';
const ep = ('/api/open' + rest).replace(/\/projects\/[^/]+/, '/projects/{id}').replace(/\/[0-9a-f]{64}$/, '/{sha256}').replace(/\/(proof|receipt)\/[^/]+$/, '/$1/{id}').replace(/\d{4}-\d{2}-\d{2}/g, '{day}').slice(0, 80);
let a; try { a = await rpc('kolaboro_k_key_use', { p_wkey: KB.WKEY, p_hash: kh, p_endpoint: ep }); } catch (e) { return cors(json({ error: 'db' }, 503)); }
if (!a || a.error) return cors(json({ error: (a && a.error) || 'db', daily_quota: a && a.daily_quota }, a && a.error === 'quota' ? 429 : 401));
const u2 = new URL('https://kolaboro.com/api/open' + rest + u.search);
const res = await open(new Request(u2, { method: 'GET', headers: req.headers }), u2, env);
const out = cors(res); out.headers.set('x-ratelimit-limit', String(a.daily_quota)); out.headers.set('x-ratelimit-remaining', String(a.remaining)); out.headers.set('cache-control', 'no-store');
out.headers.set('ratelimit-policy', '"key-day";q=' + a.daily_quota + ';w=86400, "key-minute";q=' + KEY_PER_MIN + ';w=60'); out.headers.set('ratelimit', '"key-minute";r=' + Math.max(0, KEY_PER_MIN - used - 1) + ';t=' + reset);
return out;
}
const STOP = new Set('a an and are as at be been by can could did do does for from had has have how i if in into is it its me my no not of on or our should so than that the their them then there these they this to up was we were what when where which who why will with would you your about any all also more most much one other some such only just get got does doing done de la el en et le les un une'.split(' '));
const tok = s => (String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').match(/[a-z]+-\d+|[a-z0-9]+/g) || []).filter(w => !STOP.has(w)).map(w => w.length > 4 && w.endsWith('s') && !/ss$/.test(w) ? w.slice(0, -1) : w);
const norm = s => String(s).toLowerCase().replace(/[‘’‛`´]/g, "'").replace(/[“”„]/g, '"').replace(/[‐-―−]/g, '-').replace(/ /g, ' ').replace(/[*_]/g, '').replace(/\s+/g, ' ').trim();
const yn = v => v === true ? 'yes' : v === false ? 'no' : 'not stated';
let CORP = { t: 0, v: null };
async function openJson(path, env) { const u2 = new URL('https://kolaboro.com' + path); const r = await open(new Request(u2), u2, env); return r.json(); }
async function corpus(env) {
if (CORP.v && Date.now() - CORP.t < 600000) return CORP.v;
const ir = await env.ASSETS.fetch(new Request(TB.kbx_k__t.k1));
const idx = await ir.json();
const docs = idx.passages.map(x => ({ id: x.id, kind: 'page', title: x.title, url: x.url, text: x.text }));
const nStatic = docs.length; let updated = null;
try {
const s = await openJson('/api/open/stats', env); updated = s.updated;
const st = s.stages || {}, cl = s.claims || {};
docs.push({ id: 'data.totals', kind: 'data', title: 'Database totals (open dataset)', url: '/api/open/stats', text:
`On ${s.updated} the Kolaboro database holds ${s.projects} projects in ${s.markets} markets and ${s.countries} countries. ` +
`Developer claims tested: ${s.claims_total} (${cl.verified} verified, ${cl.unverified} unverified, ${cl.contradicted} contradicted). ` +
`Projects with all six checks public: ${s.all_six_public}. Projects with public problems recorded: ${s.with_flags}. ` +
`Overdue projects: ${s.overdue}, on average ${s.overdue_avg_months} months past the promised handover. Delayed projects: ${s.delayed}. ` +
`Stages: ${st['off-plan']} off-plan, ${st['under construction']} under construction, ${st.completed} completed. Sources read: ${s.sources}.` });
const m = await openJson('/api/open/markets', env);
for (const x of m.markets || []) docs.push({ id: 'data.market.' + x.market.toLowerCase().replace(/[^a-z0-9]+/g, '-'), kind: 'data', title: x.market + ' market statistics (open dataset)', url: '/api/open/projects?market=' + encodeURIComponent(x.market), text:
`${x.market} (${x.country}) in the Kolaboro database: ${x.projects} projects tracked. Average public checks: ${x.avg_checks} of 6. Average confirmed checks: ${x.avg_confirmed} of 6. ` +
`Permit number public for ${x.permit_public_pct}% of projects. Deposit protection public for ${x.deposit_protection_pct}%. Projects with all six checks public: ${x.all_six_public}. ` +
`Projects with public problems recorded: ${x.with_flags}. Transparency index: ${x.transparency_index} out of 100.` });
const pl = await openJson('/api/open/projects?limit=1000', env);
for (const x of pl.projects || []) {
const c = x.checks || {}, cl2 = x.claims || {};
docs.push({ id: 'data.project.' + x.id, kind: 'project', title: 'Project ' + x.id + ' (open dataset)', url: '/p/?id=' + encodeURIComponent(x.id), proof: '/api/open/projects/' + encodeURIComponent(x.id), text:
`Project ${x.id} (${x.market}, ${x.country}${x.region ? ', ' + x.region : ''}) is ${x.stage || 'at an unknown stage'}. Price band: ${x.band || 'not stated'}. Promised completion: ${x.done || 'not stated'}. ` +
`Title: ${x.title || 'not stated'}${x.lease ? ', ' + x.lease + '-year lease' : ''}. Units: ${x.units || 'not stated'}. Public checks: ${x.score} of ${x.max}. Confirmed by a register or independent source: ${x.vscore == null ? 'not rated' : x.vscore + ' of 6'}. ` +
`Permit number public: ${yn(c.permit_public)}. Deposit protection public: ${yn(c.deposit_protection)}. Construction progress public: ${yn(c.progress)}. Plans public: ${yn(c.plans)}. Track record public: ${yn(c.track_record)}. No guaranteed returns: ${yn(c.no_guaranteed_returns)}. ` +
`Developer claims tested: ${cl2.verified || 0} verified, ${cl2.unverified || 0} unverified, ${cl2.contradicted || 0} contradicted. Public problems recorded: ${x.flags || 0}.${x.delay ? ' Delay: ' + x.delay + ' months.' : ''}` });
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
if (d.kind === 'project') s *= ids.has(d.id.slice(13)) ? 3 : 0.6;
if (s > 0) scored.push([s, d]);
}
scored.sort((a, b) => b[0] - a[0]);
const out = [], per = new Map(); let nproj = 0;
for (const id of ids) { const d = C.docs.find(x => x.id === 'data.project.' + id); if (d && out.length < 3) { out.push({ d, s: 99 }); nproj++; } }
for (const [s, d] of scored) {
if (out.length >= 8) break; if (out.some(x => x.d === d)) continue;
const page = d.url.split('#')[0]; if ((per.get(page) || 0) >= 3) continue;
if (d.kind === 'project' && nproj >= 3) continue;
if (s < scored[0][0] * 0.25) break;
out.push({ d, s }); per.set(page, (per.get(page) || 0) + 1); if (d.kind === 'project') nproj++;
}
return { hits: out, best: scored.length ? scored[0][0] : 0, terms: qt };
}
function check(sent, d) {
const P = norm(d.text), P2 = P.replace(/,(?=\d{3})/g, '');
const qn = norm(sent.quote || '').replace(/^["'.,;: ]+|["'.,;: ]+$/g, '').replace(/\.\.\.|…/g, '');
if (qn.length < 15) return 'quote missing or too short';
if (!P.includes(qn)) return 'quote not found in the source';
const text = norm(sent.text || '');
for (const n of text.match(/\d+(?:[.,]\d+)*/g) || []) { const x = n.replace(/,(?=\d{3})/g, ''); if (!P2.includes(x)) return 'number ' + n + ' is not in the source'; }
const pw = new Set(tok(d.title + ' ' + d.text).map(w => w.slice(0, 5)));
const sw = tok(sent.text || '').filter(w => w.length >= 4 && !/^\d+$/.test(w));
if (sw.length) { const sup = sw.filter(w => pw.has(w.slice(0, 5))).length / sw.length; if (sup < 0.6) return 'sentence says more than the source (' + Math.round(sup * 100) + '% of its words are in it)'; }
return null;
}
const frag = (url, quote) => url.startsWith('/api/') || url.startsWith('/p/') ? url : url.split('#')[0] + '#:~:text=' + encodeURIComponent(String(quote).split(/\s+/).slice(0, 8).join(' ')).replace(/-/g, '%2D');
async function ask(req, env, ctx) {
let b; try { b = await req.json(); } catch (e) { return json({ error: 'bad_request' }, 400); }
const q = String((b && b.q) || '').replace(/\s+/g, ' ').trim().slice(0, 300);
if (q.length < 6) return json({ error: 'question', detail: TB.kbx_k__t.k2 }, 400);
const C = await corpus(env);
const ck = new Request('https://kolaboro.com/__kx_ask/v1/' + (C.sha256 || '').slice(0, 8) + '/' + (C.updated || '') + '/' + encodeURIComponent(q.toLowerCase()));
const hit = await caches.default.match(ck); if (hit) return json({ ...(await hit.json()), cached: true });
const R = retrieve(C, q);
const seen = R.hits.map((h, i) => ({ sid: 'S' + (i + 1), id: h.d.id, title: h.d.title, url: h.d.url, proof: h.d.proof || null, kind: h.d.kind, text: h.d.text }));
const base = { q, index: { built: C.built, data_updated: C.updated, passages: C.docs.length }, passages: seen };
const idk = (why, extra) => ({ ...base, answer: [], dropped: [], unknown: true, why, model: null, ...(extra || {}) });
if (!seen.length || R.best < 2) { const out = idk(TB.kbx_k__t.k3); ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(out), { headers: { 'cache-control': 'max-age=21600' } }))); return json(out); }
if (!env.ANTHROPIC_API_KEY) return json(idk('The answer model is not configured.'), 503);
if (await overLimit(req, ctx, 'ask', ASK_PER_HOUR)) return json({ error: 'rate', detail: TB.kbx_k__t.k4 }, 429);
const prompt = 'SOURCES\n' + seen.map(s => '[' + s.sid + '] ' + s.title + '\n' + s.text).join('\n\n') + '\n\n<question>\n' + q + '\n</question>';
let out; try { out = await claude(env, prompt, TB.kbx_k__s.ASK_SYSTEM, ASK_MODEL); } catch (e) { return json({ error: e && e.budget ? 'budget' : 'model', detail: e && e.budget ? TB.kbx_k__t.k5 : 'The answer model did not reply.' }, 503); }
const answer = [], dropped = [];
for (const s of (Array.isArray(out && out.sentences) ? out.sentences : []).slice(0, 8)) {
const src = seen.find(x => x.sid === String(s && s.source || '').trim());
const text = String(s && s.text || '').replace(/\s*—\s*/g, ', ').trim().slice(0, 400);
if (!text) continue;
const why = !src ? 'no valid source cited' : check({ text, quote: s.quote }, src);
if (why) { dropped.push({ text, why }); continue; }
const quote = String(s.quote).trim().slice(0, 400);
answer.push({ text, source: src.sid, id: src.id, quote, link: frag(src.url, quote), proof: src.proof });
}
const res = answer.length ? { ...base, answer, dropped, unknown: false, model: ASK_MODEL } : idk(out && out.answerable === false ? TB.kbx_k__t.k6 : TB.kbx_k__t.k7, { dropped, model: ASK_MODEL });
ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(res), { headers: { 'cache-control': 'max-age=21600' } })));
return json(res);
}
export const _t = { retrieve, corpus, check, tok, norm };
