// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_j__q, $s = TB.kbx_j__s, $t = TB.kbx_j__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { json, rpc, sha, anthropic, signBody, openData, deskReview, pageParts } from './kolaboro.js';
import { webStates, webDiff } from './kbx_web.js';
import { MAP } from './kbx_j_map.js';
import { TB } from './kbx_strings.js';
export const PATHS = /^\/api\/x\/j\//;
const te = new TextEncoder(), td = new TextDecoder();
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type' };
function out(o, s = 200, extra) { return new Response(JSON.stringify(o), { status: s, headers: Object.assign({ 'content-type': $q.a, 'cache-control': $q.b }, CORS, extra || {}) }); }
const ip = req => { const a = req.headers.get($q.c) || 'x'; return a.includes(':') ? a.split(':').slice(0, 4).join(':') + '::/64' : a; };
async function allow(ctx, key, limit, ttl) {
const k = new Request($q.d + encodeURIComponent(key));
const hit = await caches.default.match(k); const n = hit ? (+(await hit.text()) || 0) : 0;
if (n >= limit) return false;
const p = caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': $q.e + ttl } }));
if (ctx && ctx.waitUntil) ctx.waitUntil(p); else await p;
return true;
}
const b64u = {
enc(u8) { let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
dec(s) { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), c => c.charCodeAt(0)); }
};
const cat = (...a) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let i = 0; a.forEach(x => { o.set(x, i); i += x.length; }); return o; };
export async function handle(req, u, env, ctx) {
const p = u.pathname.replace(/\/+$/, '');
if (req.method === $q.f) return new Response(null, { status: 204, headers: CORS });
try {
if (p === $q.g && req.method === 'GET') return await match(req, u, ctx);
if (p === $q.h && req.method === 'GET') return await xrMatch(req, u, env, ctx);
if (p === $q.i) return out((await xrIndex(env)).meta, 200, { 'cache-control': $q.j });
if (p === $q.k) return out({ built: MAP.built, projects: MAP.projects, by_address: MAP.url_projects, by_name: MAP.name_projects, keys: MAP.url_keys + MAP.name_keys, prefix_hex_chars: 4 }, 200, { 'cache-control': $q.j });
if (p === $q.l && req.method === 'POST') return await tgHook(req, env, ctx);
if (p === $q.m) return await tgStatus(env);
if (p === $q.n) return pushKey(env);
if (p === $q.o) return await selftest(env);
if (p === $q.p) return await pushStatus(env);
if (p === $q.q && req.method === 'POST') return await pushRun(req, env, ctx);
const m = p.match(/^\/api\/x\/j\/push\/(watch|unwatch|mine|test)$/);
if (m && req.method === 'POST') return await pushUser(m[1], req, env, ctx);
} catch (e) { return out({ error: $q.r, detail: String(e && e.message || e).slice(0, 160) }, 500); }
return out({ error: $q.s, see: [$q.h, $q.i, $q.g, $q.m, $q.n, $q.p, $q.o] }, 404);
}
let BUCKETS = null;
function buckets() {
if (BUCKETS) return BUCKETS;
BUCKETS = new Map();
for (const [kind, tab] of [['u', MAP.u], ['n', MAP.n]]) for (const h in tab) { const b = h.slice(0, 4); if (!BUCKETS.has(b)) BUCKETS.set(b, []); BUCKETS.get(b).push({ h, id: tab[h], k: kind }); }
return BUCKETS;
}
function summary(c) {
return { id: c.id, market: c.market, country: c.country, region: c.region, stage: c.stage || null, score: c.score, max: c.max, tier: c.tier,
vscore: c.vscore == null ? null : c.vscore, flags: (c.flags || []).slice(0, 3), done: c.done || null, checked: c.checked || null, url: $q.t + c.id };
}
async function match(req, u, ctx) {
const pre = [...new Set((u.searchParams.get('p') || '').toLowerCase().split(',').filter(x => /^[0-9a-f]{4}$/.test(x)))].slice(0, 200);
if (!pre.length) return out({ error: $q.u, note: $t.k0 }, 400);
if (!(await allow(ctx, 'm/' + ip(req) + '/' + new Date().toISOString().slice(0, 13), 600, 3600))) return out({ error: 'rate' }, 429);
const B = buckets(), hits = [];
pre.forEach(b => (B.get(b) || []).forEach(x => hits.push(x)));
const projects = {};
if (hits.length) {
const d = await openData(), by = {};
(d.cases || []).forEach(c => { by[c.id] = c; });
hits.forEach(x => { const c = by[x.id]; if (c) projects[x.id] = summary(c); });
}
return out({ v: 1, built: MAP.built, keys: MAP.url_keys + MAP.name_keys, hits: hits.filter(x => projects[x.id]), projects },
200, { 'cache-control': $q.v });
}
const XR = { ix: null, b: null, refs: null, meta: null };
const xNorm = t => String(t || '').normalize('NFKD').replace(/[^\x00-\x7f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const xH16 = async s => { const b = await crypto.subtle.digest($q.w, te.encode(s)); return [...new Uint8Array(b)].slice(0, 8).map(x => x.toString(16).padStart(2, '0')).join(''); };
const NOT_DEV = /(^|\.)(instagram|facebook|fb|youtube|youtu|linkedin|linktr|twitter|x|tiktok|wa|whatsapp|google|goo|bit|medium|wikipedia|blogspot|wordpress|wixsite|squarespace|webflow|notion|github|archive|issuu|scribd|dropbox|t|telegram|pinterest|yelp|tripadvisor|booking|airbnb|trustpilot|reddit)\.[a-z.]+$/;
const DEV_SUFFIX = /\b(properties|property|developments?|developers?|development company|real estate|realty|group|holdings?|pjsc|llc|l l c|ltd|limited|s a|s l|sa|sl|inc|co|company|plc|bhd|sdn|pt|tbk|jsc|q p s c|w l l)\b/g;
async function xrIndex(env) {
const NM = await import('./kbx_named.js'), ix = await NM.data(env);
if (XR.ix === ix) return XR;
const { regDomain } = await import('./kbx_xray.js');
const host = u => { try { return new URL(u).hostname.toLowerCase().replace(/^www\./, ''); } catch (e) { return ''; } };
let TRD = null; try { TRD = await (await import('./kbx_tr.js')).trData(env); } catch (e) { TRD = null; }
const refs = {}, keys = new Map(), add = (k, s, r) => { const kk = k + '|' + s; if (!keys.has(kk)) keys.set(kk, new Set()); keys.get(kk).add(r); };
const devCountry = new Map();
for (const x of ix.P) {
const c = ix.caseBy.get(x.id) || {}, rv = NM.reviewed(c), h = NM.handoverOf(ix, x), dv = x.dvs && ix.devs.has(x.dvs) ? x.dvs : null;
refs['p:' + x.s] = { t: 'p', s: x.s, n: x.n, dv: x.dv || null, dvs: dv, mk: x.mk || null, co: x.co || null, ar: x.ar || null, st: c.stage || x.st || null,
ho: h ? String(h.d) : null, ov: c.overdue || null, ck: c.checked || null, rv, sc: rv ? c.score : null, mx: rv ? c.max : null, ts: TRD && TRD.rows.get(x.id) ? TRD.rows.get(x.id).score : null };
if (dv) { if (!devCountry.has(dv)) devCountry.set(dv, new Set()); if (x.co) devCountry.get(dv).add(x.co); }
const names = new Set(), full = xNorm(x.n);
names.add(full); names.add(xNorm(String(x.n).replace(/\([^)]*\)/g, ' '))); names.add(xNorm(String(x.n).replace(/\s+by\s+.+$/i, '')));
names.forEach(n => { if (n.length >= 8 && n.split(' ').length >= 2) add('n', n, 'p:' + x.s); });
}
for (const [s, d] of ix.devs) {
refs['v:' + s] = { t: 'v', s, n: d.n, np: d.ids.length, co: [...(devCountry.get(s) || [])].slice(0, 6) };
const full = xNorm(d.n), short = full.replace(DEV_SUFFIX, ' ').replace(/\s+/g, ' ').trim();
if (full.length >= 6) add('v', full, 'v:' + s);
if (short && short !== full && short.length >= 7) add('v', short, 'v:' + s);
}
const pageOf = new Map();
const page = (u, r) => { if (!NM.okHttp(u) || /[?#]/.test(u)) return; const k = urlKey(u); if (!k) return; if (!pageOf.has(k)) pageOf.set(k, new Set()); pageOf.get(k).add(r); };
for (const x of ix.P) { page(x.url, 'p:' + x.s); (x.src || []).forEach(u => { if (NM.isListing(u)) page(u, 'p:' + x.s); }); }
pageOf.forEach((rs, k) => { if (rs.size === 1) add('u', k, [...rs][0]); });
const dom = new Map(), dget = d => { if (!dom.has(d)) dom.set(d, { ps: new Set(), devs: new Set(), own: new Set() }); return dom.get(d); };
for (const x of ix.P) {
const dv = x.dvs && ix.devs.has(x.dvs) ? x.dvs : null;
for (const [u, isDev] of [[x.url, false], [x.du, true]]) {
const h = NM.okHttp(u) ? host(u) : ''; if (!h || NM.isListing(u) || NOT_DEV.test(h)) continue;
const g = dget(regDomain(h)); if (!isDev) g.ps.add(x.s); if (dv) { g.devs.add(dv); if (isDev) g.own.add(dv); }
}
}
let gN = 0;
for (const [d, g] of dom) {
if (g.devs.size >= 3) continue;
const dvs = g.own.size === 1 ? [...g.own][0] : (g.devs.size === 1 ? [...g.devs][0] : null);
if (g.ps.size === 1 && (!dvs || g.devs.size <= 1)) { add('d', d, 'p:' + [...g.ps][0]); if (dvs) add('d', d, 'v:' + dvs); continue; }
if (g.ps.size === 0) { if (dvs) add('d', d, 'v:' + dvs); continue; }
const r = 'g:' + (++gN); refs[r] = { t: 'g', np: g.ps.size, ps: [...g.ps].slice(0, 6).map(s => 'p:' + s), dvs };
add('d', d, r);
}
for (const h in MAP.u) { const x = ix.byId.get(MAP.u[h]); if (x) keys.set('#' + h, new Set(['p:' + x.s])); }
const b = new Map(), kinds = { u: 0, d: 0, n: 0, v: 0 }, seen = new Set();
for (const [kk, rs] of keys) {
let h, k;
if (kk[0] === '#') { h = kk.slice(1); k = 'u'; } else { k = kk[0]; h = await xH16(kk); }
const bk = h.slice(0, 4); if (!b.has(bk)) b.set(bk, []);
let fresh = false;
rs.forEach(r => { if (seen.has(h + r)) return; seen.add(h + r); fresh = true; b.get(bk).push({ h, k, r }); });
if (fresh && !seen.has(h)) { seen.add(h); kinds[k]++; }
}
XR.ix = ix; XR.b = b; XR.refs = refs;
XR.meta = { v: 2, updated: ix.updated, projects: ix.P.length, developers: ix.devs.size, keys: kinds, prefix_hex_chars: 4, hash: $t.k1 };
return XR;
}
async function xrMatch(req, u, env, ctx) {
const pre = [...new Set((u.searchParams.get('p') || '').toLowerCase().split(',').filter(x => /^[0-9a-f]{4}$/.test(x)))].slice(0, 500);
if (!pre.length) return out({ error: $q.u, note: $t.k2 }, 400);
if (!(await allow(ctx, 'xr/' + ip(req) + '/' + new Date().toISOString().slice(0, 13), 900, 3600))) return out({ error: 'rate' }, 429);
const X = await xrIndex(env), hits = [], refs = {};
const need = r => { if (refs[r] || !X.refs[r]) return; const o = X.refs[r]; refs[r] = o; if (o.dvs) need('v:' + o.dvs); (o.ps || []).forEach(need); };
pre.forEach(b => (X.b.get(b) || []).forEach(x => { hits.push(x); need(x.r); }));
return out({ v: 2, updated: X.meta.updated, hits: hits.filter(x => refs[x.r]), refs }, 200, { 'cache-control': $q.v });
}
const TG = 'https://api.telegram.org/bot';
const esc = t => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, $q.x);
async function tgCall(env, method, body) {
const r = await fetch(TG + env.TELEGRAM_BOT_TOKEN + '/' + method, { method: 'POST', headers: { 'content-type': $q.y }, body: JSON.stringify(body) });
return r.json().catch(() => ({ ok: false }));
}
const tgSay = (env, chat, html, reply) => tgCall(env, $q.z, Object.assign({ chat_id: chat, text: html.slice(0, 4096), parse_mode: 'HTML', disable_web_page_preview: true }, reply ? { reply_parameters: { message_id: reply, allow_sending_without_reply: true } } : {}));
let BOT = { t: 0, v: null };
async function tgStatus(env) {
const configured = !!(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_WEBHOOK_SECRET);
let bot = env.TELEGRAM_BOT_USERNAME || null;
if (configured && !bot) {
if (!BOT.v || Date.now() - BOT.t > 3600e3) { const r = await tgCall(env, 'getMe', {}); BOT = { t: Date.now(), v: r && r.ok ? r.result.username : null }; }
bot = BOT.v;
}
return out({ configured, bot, webhook: $q.A, accepts: ['link', $q.B, $q.C, $q.D],
limits: { per_chat_hour: 6, per_chat_day: 20 }, stores_forwarded_content: false }, 200, { 'cache-control': $q.E });
}
const HELP = 'Forward me what a developer or agent sent you: a <b>message</b>, a <b>link</b>, a <b>brochure photo</b> or a <b>PDF</b>.\n\n' +
'I read it the way Kolaboro reads every project page: what it promises (quoted, and checked word for word), what it leaves out, and what to ask before you pay. You get a link to the full result, signed by Kolaboro.\n\n' +
'Free. About a minute. I do not keep what you send: the result lives only in the link I give you.\n\nDatabase of tracked projects: https://kolaboro.com/database';
function okUrl(raw) {
let x; try { x = new URL(/^https?:\/\//i.test(raw) ? raw : $q.F + raw); } catch (e) { return null; }
if (!/^https?:$/.test(x.protocol) || x.username || x.password || (x.port && x.port !== '443' && x.port !== '80')) return null;
const h = x.hostname.toLowerCase();
if (h === $q.G || /\.(local|internal|localhost|home|lan)$/.test(h) || /^[\d.]+$/.test(h) || h.includes(':') || !h.includes('.') || /\b(nip|sslip|xip)\.io$/.test(h) || h.endsWith($q.H)) return null;
x.hash = ''; return x;
}
async function fetchPage(u0) {
let r, cur = u0;
for (let hop = 0; hop < 4; hop++) {
r = await fetch(cur.toString(), { headers: { 'user-agent': $t.k3, accept: $q.I }, redirect: $q.J, cf: { cacheTtl: 3600 } });
if (r.status < 300 || r.status >= 400) break;
const nx = okUrl(new URL(r.headers.get($q.K) || '', cur).toString()); if (!nx) return null; cur = nx;
}
if (!r.ok || !/html|text\/plain/i.test(r.headers.get($q.L) || $q.I)) return null;
return { url: cur, html: (await r.text()).slice(0, 1500000) };
}
const qNorm = t => String(t || '').normalize('NFKC').toLowerCase().replace(/[‘’‚‛′`´]/g, "'").replace(/[“”„‟″«»]/g, '"').replace(/[‐-―]/g, '-').replace(/\s+/g, ' ').trim();
function quoteCheck(promises, source) {
const S = qNorm(source);
return (promises || []).map(p => { const q = qNorm(p).replace(/^["'\s]+|["'\s.…]+$/g, ''); return { t: p, verbatim: q.length >= 6 && S.includes(q) }; });
}
async function transcribe(env, block) {
const r = await anthropic(env, { model: $q.M, max_tokens: 4000, messages: [{ role: 'user', content: [block, { type: 'text', text: $s.TRANSCRIBE }] }] });
if (!r.ok) throw new Error($q.N + r.status);
const d = await r.json();
return (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
}
async function tgFile(env, fileId, maxBytes) {
const f = await tgCall(env, $q.O, { file_id: fileId });
if (!f.ok || !f.result.file_path || (f.result.file_size || 0) > maxBytes) return null;
const r = await fetch($q.P + env.TELEGRAM_BOT_TOKEN + '/' + f.result.file_path);
if (!r.ok) return null;
const b = new Uint8Array(await r.arrayBuffer());
return b.length > maxBytes ? null : b;
}
function b64(u8) { let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s); }
function sniff(b) {
if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return $q.Q;
if (b[0] === 0xff && b[1] === 0xd8) return $q.R;
if (b[0] === 0x89 && b[1] === 0x50) return $q.S;
if (b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return $q.T;
return null;
}
async function deflate(u8) { return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new CompressionStream($q.U))).arrayBuffer()); }
const wrapHtml = t => $q.V + esc(t).replace(/\n{2,}/g, $q.W).replace(/\n/g, '<br>') + $q.X;
async function readInput(env, msg) {
const text = String(msg.text || msg.caption || '').trim();
const doc = msg.document, photo = (msg.photo || []).slice().sort((a, b) => (b.file_size || 0) - (a.file_size || 0)).find(p => (p.file_size || 0) <= 4.5e6);
if (doc || photo) {
const isPdf = doc && (doc.mime_type === $q.Q || /\.pdf$/i.test(doc.file_name || ''));
const isImg = photo || (doc && /^image\/(jpeg|png|webp)$/.test(doc.mime_type || ''));
if (!isPdf && !isImg) return { error: 'type' };
const bytes = await tgFile(env, photo ? photo.file_id : doc.file_id, isPdf ? 8e6 : 4.5e6);
if (!bytes) return { error: 'size' };
const mt = sniff(bytes);
if (!mt || (isPdf && mt !== $q.Q) || (!isPdf && mt === $q.Q)) return { error: 'type' };
const block = mt === $q.Q ? { type: $q.Y, source: { type: $q.Z, media_type: mt, data: b64(bytes) } } : { type: 'image', source: { type: $q.Z, media_type: mt, data: b64(bytes) } };
const tx = await transcribe(env, block);
const src = (text ? text + '\n\n' : '') + tx;
return { kind: mt === $q.Q ? 'pdf' : 'image', label: mt === $q.Q ? 'PDF' : $q.aa, source: src, html: wrapHtml(src), sha256: await sha(b64(bytes)), bytes: bytes.length, transcribed: true };
}
const link = (text.match(/https?:\/\/[^\s<>"']+/) || [])[0];
const rest = link ? text.replace(link, ' ').trim() : text;
if (rest.length >= 200) return { kind: $q.ab, label: $q.ac, source: text, html: wrapHtml(text), sha256: await sha(text), chars: text.length, link: link || null };
if (link) {
const lu = okUrl(link.replace(/[).,;!?]+$/, ''));
if (!lu) return { error: 'url' };
const pg = await fetchPage(lu).catch(() => null);
if (!pg) return { error: 'fetch' };
return { kind: 'link', label: lu.hostname.replace(/^www\./, ''), url: pg.url.toString(), source: pageParts(pg.html).visible, html: pg.html, sha256: await sha(pageParts(pg.html).visible) };
}
return { error: rest ? 'short' : 'empty' };
}
function urlKey(raw) {
let x; try { x = new URL(raw); } catch (e) { return null; }
const host = x.hostname.toLowerCase().replace(/^www\./, '');
let path = x.pathname.toLowerCase().replace(/\/+$/, '').replace(/^\/(en|ar|id|th|es|pt|tr|ru|zh|de|fr)(?=\/|$)/, '');
return path.length >= 8 ? host + path : null;
}
async function trackedFor(url) {
const k = url && urlKey(url); if (!k) return null;
const id = MAP.u[(await sha('u|' + k)).slice(0, 16)]; if (!id) return null;
const c = ((await openData()).cases || []).find(x => x.id === id);
return c ? summary(c) : null;
}
async function forwardCheck(env, msg) {
const inp = await readInput(env, msg);
if (inp.error) return inp;
if (qNorm(inp.source).length < 120) return { error: 'short' };
const dr = await deskReview(env, inp.url || ($q.ad + inp.kind), inp.html);
if (dr.error) return { error: dr.error === 'empty' ? 'short' : dr.error };
const r = dr.report;
const res = {
v: $q.ae, at: new Date().toISOString(),
input: { kind: inp.kind, label: inp.label, sha256: inp.sha256, url: inp.url || null, transcribed: !!inp.transcribed, chars: inp.source.length },
report: { page_kind: r.page_kind, project: r.project, location: r.location, country: r.country, price_from: r.price_from, title_type: r.title_type, lease_years: r.lease_years,
completion: r.completion, advertised_return: r.advertised_return, guaranteed_language: r.guaranteed_language, permit_claim: r.permit_claim, payment_plan: r.payment_plan,
attention: r.attention, summary: r.summary, missing: r.missing, questions: r.questions },
quotes: quoteCheck(r.promises, inp.source),
not_property: !!dr.not_property, consensus: r.consensus || null, ai_manipulation: r.ai_manipulation || null,
tracked: inp.url ? await trackedFor(inp.url).catch(() => null) : null,
method: { prompt_sha256: dr.prompt_sha256, hidden_blocks_removed: dr.hidden_blocks_removed, quote_rule: $t.k4 + (inp.transcribed ? $t.k5 : '') }
};
if (r.developer && !res.tracked) res.report.developer = r.developer;
const body = JSON.stringify(res);
const sig = await signBody(env, body).catch(() => null);
const link = $q.af + b64u.enc(await deflate(te.encode(body))) + (sig ? '&s=' + encodeURIComponent(sig) + '&k=' + encodeURIComponent(env.KB_SIGN_KID || 'kb') : '');
return { res, link, signed: !!sig };
}
function tgReply(o) {
const { res, link } = o, r = res.report, L = [];
if (res.not_property) return $t.k6 + (r.summary ? ': ' + esc(r.summary) : '.') + $t.k7;
L.push('<b>' + esc(r.project || $q.ag) + '</b>' + (r.location ? ' · ' + esc(r.location) : '') + '\n<i>' + esc(res.input.label) + '</i>');
L.push($q.ah + esc(r.attention) + '</b>');
if (r.summary) L.push(esc(r.summary));
if (res.tracked) L.push($q.ai + esc(res.tracked.id) + ', ' + res.tracked.score + ' of ' + res.tracked.max + $q.aj + esc(res.tracked.url));
const vq = res.quotes.filter(q => q.verbatim), rq = res.quotes.filter(q => !q.verbatim);
if (vq.length) L.push($t.k8 + vq.slice(0, 5).map(q => '“' + esc(q.t) + '”').join('\n'));
if (rq.length) L.push((vq.length ? '' : '\n') + $t.k9 + rq.slice(0, 3).map(q => '· ' + esc(q.t)).join('\n'));
if (r.guaranteed_language) L.push($t.k10);
if (res.ai_manipulation) L.push($t.k11);
if ((r.missing || []).length) L.push($q.ak + r.missing.map(x => '✗ ' + esc(x)).join('\n'));
if ((r.questions || []).length) L.push($q.al + r.questions.slice(0, 5).map((x, i) => (i + 1) + '. ' + esc(x)).join('\n'));
L.push($q.am + esc(link) + '">' + (o.signed ? $q.an : $q.ao) + $q.ap);
let t = L.join('\n');
if (t.length > 4000) { L.splice(L.findIndex(x => x.startsWith($q.aq)), 1); t = L.join('\n'); }
return t;
}
const ERR = {
rate: 'You have used this a lot in a short time. Try again in an hour; the limit keeps the service free for everyone.',
short: 'There is too little text to review. Forward the full message, a clearer photo, the PDF, or the project link.',
empty: HELP, type: 'I can read photos (JPEG, PNG, WebP) and PDFs. Send the brochure as one of those, or forward the message text.',
size: 'That file is too large. Photos up to 4.5 MB and PDFs up to 8 MB.', url: 'That address cannot be read. Send the developer\'s public project page.',
fetch: 'I could not open that page. Try the developer\'s own project page, or forward the message they sent you.',
budget: 'The free reviews for today are used up. Try again tomorrow, or use https://kolaboro.com/check',
model: 'The reviewer is busy. Try again in a few minutes.'
};
async function tgHook(req, env, ctx) {
if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_WEBHOOK_SECRET) return out({ error: $q.ar, needs: [$q.as, $q.at] }, 503);
if (req.headers.get($q.au) !== env.TELEGRAM_WEBHOOK_SECRET) return out({ error: $q.av }, 403);
let up; try { up = await req.json(); } catch (e) { return out({ ok: true }); }
const msg = up.message; if (!msg || !msg.chat || msg.chat.type !== $q.aw) return out({ ok: true });
const once = new Request($q.ax + up.update_id);
if (await caches.default.match(once)) return out({ ok: true });
await caches.default.put(once, new Response('1', { headers: { 'cache-control': $q.ay } }));
const chat = msg.chat.id, t = String(msg.text || '').trim();
if (/^\/(start|help)\b/.test(t) || (!t && !msg.caption && !msg.photo && !msg.document)) { await tgSay(env, chat, HELP); return out({ ok: true }); }
const hr = new Date().toISOString().slice(0, 13), day = hr.slice(0, 10);
if (!(await allow(ctx, 'tgh/' + chat + '/' + hr, 6, 3600)) || !(await allow(ctx, 'tgd/' + chat + '/' + day, 20, 86400))) { await tgSay(env, chat, ERR.rate, msg.message_id); return out({ ok: true }); }
await tgCall(env, $q.az, { chat_id: chat, action: $q.aA });
await tgSay(env, chat, $q.aB, msg.message_id);
let o; try { o = await forwardCheck(env, msg); } catch (e) { o = { error: e && e.budget ? $q.aC : 'model' }; }
await tgSay(env, chat, o.error ? (ERR[o.error] || ERR.model) : tgReply(o), msg.message_id);
return out({ ok: true });
}
const VAPID_SUB = 'https://kolaboro.com/alerts/';
const PUSH_HOSTS = /^(fcm\.googleapis\.com|jmt17\.google\.com|updates\.push\.services\.mozilla\.com|[a-z0-9-]+\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9.-]+\.notify\.windows\.com|[a-z0-9.-]+\.push\.apple\.com)$/;
async function hkdf(salt, ikm, info, len) {
const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, [$q.aD]);
return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: $q.w, salt, info }, k, len * 8));
}
function ecJwk(pubRaw, d) { return Object.assign({ kty: 'EC', crv: 'P-256', x: b64u.enc(pubRaw.slice(1, 33)), y: b64u.enc(pubRaw.slice(33, 65)), ext: true }, d ? { d } : {}); }
export async function encryptPush(plain, uaPublicB64u, authB64u, opts = {}) {
const uaPub = b64u.dec(uaPublicB64u), auth = b64u.dec(authB64u);
if (uaPub.length !== 65 || uaPub[0] !== 4 || auth.length !== 16) throw new Error($q.aE);
let asPriv, asPub;
if (opts.asPrivate) { asPub = b64u.dec(opts.asPublic); asPriv = await crypto.subtle.importKey('jwk', ecJwk(asPub, opts.asPrivate), { name: 'ECDH', namedCurve: 'P-256' }, false, [$q.aD]); }
else { const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [$q.aD]); asPriv = kp.privateKey; asPub = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey)); }
const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, asPriv, 256));
const ikm = await hkdf(auth, ecdh, cat(te.encode($q.aF), uaPub, asPub), 32);
const salt = opts.salt ? b64u.dec(opts.salt) : crypto.getRandomValues(new Uint8Array(16));
const cek = await hkdf(salt, ikm, te.encode($q.aG), 16);
const nonce = await hkdf(salt, ikm, te.encode($q.aH), 12);
const key = await crypto.subtle.importKey('raw', cek, $q.aI, false, [$q.aJ]);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: $q.aI, iv: nonce }, key, cat(typeof plain === $q.aK ? te.encode(plain) : plain, new Uint8Array([2]))));
const rs = new Uint8Array([0, 0, 16, 0]);
return cat(salt, rs, new Uint8Array([65]), asPub, ct);
}
let VKEY = null;
async function vapidAuth(env, endpoint) {
if (!VKEY) VKEY = await crypto.subtle.importKey('jwk', ecJwk(b64u.dec($t.VAPID_PUBLIC), env.VAPID_PRIVATE_KEY.trim()), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
const aud = new URL(endpoint).origin;
const h = b64u.enc(te.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))), p = b64u.enc(te.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: VAPID_SUB })));
const s = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: $q.w }, VKEY, te.encode(h + '.' + p)));
return $q.aL + h + '.' + p + '.' + b64u.enc(s) + ', k=' + $t.VAPID_PUBLIC;
}
async function sendPush(env, sub, msg, ttl) {
let host; try { host = new URL(sub.endpoint).hostname; } catch (e) { return { status: 0 }; }
if (!PUSH_HOSTS.test(host)) return { status: 0, error: 'host' };
const body = await encryptPush(JSON.stringify(msg), sub.p256dh, sub.auth);
const r = await fetch(sub.endpoint, { method: 'POST', headers: { authorization: await vapidAuth(env, sub.endpoint), 'content-encoding': $q.aM, 'content-type': $q.aN, ttl: String(ttl || 86400), urgency: $q.aO, topic: String(msg.tag || $q.aP).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) || $q.aP }, body });
return { status: r.status, gone: r.status === 404 || r.status === 410 };
}
function pushKey(env) { return out({ open: !!env.VAPID_PRIVATE_KEY, public_key: $t.VAPID_PUBLIC, note: env.VAPID_PRIVATE_KEY ? $q.aQ : $t.k12 }, 200, { 'cache-control': $q.E }); }
async function selftest(env) {
const t0 = Date.now();
const got = b64u.enc(await encryptPush($t.o_VEC.plain, $t.o_VEC.uaPublic, $t.o_VEC.auth, { salt: $t.o_VEC.salt, asPrivate: $t.o_VEC.asPrivate, asPublic: $t.o_VEC.asPublic }));
let vapid = null;
if (env.VAPID_PRIVATE_KEY) {
const a = await vapidAuth(env, $q.aR), jwt = a.match(/t=([^,]+)/)[1].split('.');
const pk = await crypto.subtle.importKey('raw', b64u.dec($t.VAPID_PUBLIC), { name: 'ECDSA', namedCurve: 'P-256' }, false, [$q.aS]);
vapid = await crypto.subtle.verify({ name: 'ECDSA', hash: $q.w }, pk, b64u.dec(jwt[2]), te.encode(jwt[0] + '.' + jwt[1]));
}
return out({ rfc8291_appendix_a: got === $t.o_VEC.expect, bytes: b64u.dec(got).length, vapid_signature_verifies: vapid, sending_key_installed: !!env.VAPID_PRIVATE_KEY, ms: Date.now() - t0, ran_at: new Date().toISOString() });
}
const PID = /^[A-Z]{2,5}-\d{3}$/;
async function jobKey(env) { return env.VAPID_PRIVATE_KEY ? sha($q.aT + env.VAPID_PRIVATE_KEY.trim()) : null; }
function cleanSub(s) {
if (!s || typeof s !== $q.aU) return null;
const endpoint = String(s.endpoint || ''), k = s.keys || {};
let host; try { const x = new URL(endpoint); if (x.protocol !== $q.aV) return null; host = x.hostname; } catch (e) { return null; }
if (!PUSH_HOSTS.test(host) || endpoint.length > 700) return null;
const p256dh = String(k.p256dh || ''), auth = String(k.auth || '');
try { if (b64u.dec(p256dh).length !== 65 || b64u.dec(auth).length !== 16) return null; } catch (e) { return null; }
return { endpoint, p256dh, auth };
}
async function pushUser(action, req, env, ctx) {
if (!env.VAPID_PRIVATE_KEY) return out({ error: $q.aW, note: $q.aX }, 503);
if (!(await allow(ctx, 'pu/' + ip(req) + '/' + new Date().toISOString().slice(0, 13), 60, 3600))) return out({ error: 'rate' }, 429);
let b; try { b = await req.json(); } catch (e) { return out({ error: $q.aY }, 400); }
const sub = cleanSub(b.subscription); if (!sub) return out({ error: $q.aZ }, 400);
const id = String(b.project || '').toUpperCase();
if ((action === 'watch' || action === $q.ba) && !PID.test(id)) return out({ error: $q.bb }, 400);
if (action === 'watch' || action === 'test') {
const c = PID.test(id) ? ((await openData()).cases || []).find(x => x.id === id) : null;
if (action === 'watch' && !c) return out({ error: $q.bb }, 404);
let d;
if (action === 'watch') { try { d = await rpc($q.bc, { p_endpoint: sub.endpoint, p_p256dh: sub.p256dh, p_auth: sub.auth, p_project: id, p_on: true }); } catch (e) { return out({ error: $q.bd, note: $t.k13 }, 503); } }
if (!(await allow(ctx, 'pt/' + (await sha(sub.endpoint)).slice(0, 24) + '/' + new Date().toISOString().slice(0, 13), 4, 3600))) return out({ ok: true, watching: d && d.projects, confirmation: 'rate' });
const msg = c ? { title: $q.be + c.id, body: c.market + ', ' + c.region + ': ' + c.score + ' of ' + c.max + $t.k14, url: $q.t + c.id + $q.bf, tag: c.id }
: { title: $q.bg, body: $t.k15, url: $q.bh, tag: 'test' };
const r = await sendPush(env, sub, msg, 3600);
return out({ ok: r.status >= 200 && r.status < 300, watching: d ? d.projects : undefined, push_status: r.status });
}
try {
const d = await rpc(action === $q.ba ? $q.bc : $q.bi, action === $q.ba ? { p_endpoint: sub.endpoint, p_p256dh: sub.p256dh, p_auth: sub.auth, p_project: id, p_on: false } : { p_endpoint: sub.endpoint });
return out({ ok: true, watching: (d && d.projects) || [] });
} catch (e) { return out({ error: $q.bd }, 503); }
}
async function pushStatus(env) {
let db = null; try { db = await rpc($q.bj, {}); } catch (e) {}
return out({ open: !!env.VAPID_PRIVATE_KEY, table: !!db, stats: db, public_key: $t.VAPID_PUBLIC, checks: ['score', $q.bk, 'tier', 'flags', 'stage', 'delay', $q.bl, $q.bm, $q.bn] }, 200, { 'cache-control': $q.bo });
}
const CK = { permit: 'permit', escrow: 'deposit protection', progress: 'construction progress', plans: 'plans', record: 'track record', returns_ok: 'no guaranteed returns' };
async function loadJson(p) { try { const r = await fetch($q.bp + p, { cf: { cacheTtl: 300 } }); return r.ok && /json/.test(r.headers.get($q.L) || '') ? await r.json() : null; } catch (e) { return null; } }
export function stateOf(c, drift) {
const ck = c.checks || {}, s = { score: c.score, max: c.max, tier: c.tier, vscore: c.vscore == null ? null : c.vscore, flags: (c.flags || []).slice().sort(), stage: c.stage || null, delay: c.delay == null ? null : c.delay, checks: {} };
Object.keys(CK).forEach(k => { s.checks[k] = ck[k] == null ? null : ck[k]; });
s.sat = c.sat ? c.sat.status : null; s.register = c.register ? c.register.status || null : null;
const dp = drift && drift.projects && drift.projects[c.id];
s.drift = dp ? (dp.changes || []).length : null; s.drift_last = dp && dp.changes && dp.changes[0] ? { label: dp.changes[0].label, from: dp.changes[0].from, to: dp.changes[0].to, day: dp.changes[0].first_seen } : null;
return s;
}
const fmt = v => v === true ? 'yes' : v === false ? 'no' : v == null ? $q.bq : String(v);
export function diffOf(a, b) {
const L = [];
if (a.lists && b.lists && b.lists.n > a.lists.n && b.lists.last) L.push($t.k16 + b.lists.last.t + ' (' + b.lists.last.s + ', ' + b.lists.last.d + ')');
if (a.score !== b.score || a.max !== b.max) L.push($q.br + a.score + ' of ' + a.max + ' → ' + b.score + ' of ' + b.max);
b.flags.filter(f => a.flags.indexOf(f) < 0).forEach(f => L.push('New: ' + f));
a.flags.filter(f => b.flags.indexOf(f) < 0).forEach(f => L.push($q.bs + f));
const cv = (k, v) => k === $q.bt ? ([$q.bu, $q.bv, $q.bw][v] || fmt(v)) : fmt(v);
Object.keys(CK).forEach(k => { if (JSON.stringify(a.checks[k]) !== JSON.stringify(b.checks[k])) L.push(CK[k][0].toUpperCase() + CK[k].slice(1) + ': ' + cv(k, a.checks[k]) + ' → ' + cv(k, b.checks[k])); });
if (a.tier !== b.tier) L.push($q.bx + fmt(a.tier) + ' → ' + fmt(b.tier));
if (a.stage !== b.stage) L.push($q.by + fmt(a.stage) + ' → ' + fmt(b.stage));
if (a.delay !== b.delay) L.push($q.bz + (a.delay == null ? 'none' : a.delay + $q.bA) + ' → ' + (b.delay == null ? 'none' : b.delay + $q.bA));
if (a.vscore !== b.vscore) L.push($q.bB + fmt(a.vscore) + ' → ' + fmt(b.vscore));
if (a.sat !== b.sat && b.sat) L.push($q.bC + b.sat);
if (a.register !== b.register && b.register) L.push($q.bD + b.register);
L.push(...webDiff(a.web, b.web));
if ((b.drift || 0) > (a.drift || 0) && b.drift_last) L.push($q.bE + b.drift_last.label + (b.drift_last.from != null || b.drift_last.to != null ? ' ' + fmt(b.drift_last.from) + ' → ' + fmt(b.drift_last.to) : ''));
return L;
}
async function githubOidc(req, workflowFile) {
const m = (req.headers.get($q.bF) || '').match(/^Bearer ([\w-]+)\.([\w-]+)\.([\w-]+)$/); if (!m) return null;
const hd = JSON.parse(td.decode(b64u.dec(m[1]))), cl = JSON.parse(td.decode(b64u.dec(m[2])));
if (hd.alg !== 'RS256') return null;
const j = await (await fetch($t.k17, { cf: { cacheTtl: 3600 } })).json();
const jwk = (j.keys || []).find(k => k.kid === hd.kid); if (!jwk) return null;
const key = await crypto.subtle.importKey('jwk', { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true }, { name: $q.bG, hash: $q.w }, false, [$q.aS]);
const ok = await crypto.subtle.verify($q.bG, key, b64u.dec(m[3]), te.encode(m[1] + '.' + m[2]));
const now = Date.now() / 1000;
if (!ok || cl.iss !== $t.k18 || cl.aud !== $q.H || cl.repository !== $q.bH || !(cl.exp > now) || String(cl.workflow_ref || '').indexOf($q.bI + workflowFile + '@') < 0) return null;
return cl;
}
async function pushRun(req, env, ctx) {
let cl = null; try { cl = await githubOidc(req, $q.bJ); } catch (e) {}
if (!cl) return out({ error: $q.bK }, 401);
if (!env.VAPID_PRIVATE_KEY) return out({ ok: true, skipped: $q.bL });
const key = await jobKey(env);
let job; try { job = await rpc($q.bM, { p_key: key }); } catch (e) { return out({ ok: true, skipped: $q.bN }); }
const [d, drift, wst] = await Promise.all([openData(), loadJson($q.bO), webStates(env).catch(() => ({}))]);
const by = {}; (d.cases || []).forEach(c => { by[c.id] = c; });
const prev = job.states || {}, subs = job.subs || [], watched = new Set(); subs.forEach(s => (s.projects || []).forEach(p => watched.add(p)));
const states = {}, changes = {};
let nst = {}; try { nst = await (await import('./kbx_e27.js')).noticeStates(env, [...watched]); } catch (e) { nst = {}; }
watched.forEach(id => {
const c = by[id]; if (!c) return;
const now = stateOf(c, drift); if (wst[id]) now.web = wst[id]; if (nst[id]) now.lists = nst[id]; states[id] = now;
if (prev[id]) { const L = diffOf(prev[id], now); if (L.length) changes[id] = L; }
});
let sent = 0, failed = 0; const gone = [], okIds = [];
for (const s of subs) {
const mine = (s.projects || []).filter(p => changes[p]);
if (!mine.length) continue;
const id = mine[0], c = by[id], L = changes[id];
const msg = { title: id + ': ' + L[0], body: (L.slice(1, 3).join(' · ') || (c.market + ', ' + c.region)) + (mine.length > 1 ? ' (+' + (mine.length - 1) + $q.bP + (mine.length > 2 ? 's' : '') + $q.bQ : ''), url: $q.t + id + $q.bf, tag: id };
try { const r = await sendPush(env, s, msg, 86400); if (r.gone) gone.push(s.id); else if (r.status >= 200 && r.status < 300) { sent++; okIds.push(s.id); } else failed++; } catch (e) { failed++; }
}
const stats = { watched: watched.size, subs: subs.length, changed: Object.keys(changes).length, sent, failed, gone: gone.length, dataset: d.updated, run: cl.run_id || null };
await rpc($q.bR, { p_key: key, p_states: states, p_sent: okIds, p_gone: gone, p_stats: stats });
return out({ ok: true, ...stats, changes });
}
