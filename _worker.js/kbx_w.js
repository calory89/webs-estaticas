// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_w__q, $s = TB.kbx_w__s, $t = TB.kbx_w__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import * as KB from './kolaboro.js';
import { TB } from './kbx_strings.js';
const { sha } = KB;
export const PATHS = /^\/api\/x\/w(\/|$)/;
const GZ = 'https://www.thegazette.co.uk';
const MEMO = {};
async function load(env, name, ttl = 120000) {
const m = MEMO[name];
if (m && Date.now() - m.t < ttl) return m.v;
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
const STARTING = name => ({ status: $q.e, note: $q.f + name + $t.k0 });
const unx = s => String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;|&#34;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');
async function rateOk(req, ctx, bucket, limit) {
const ip = req.headers.get($q.g) || 'x', hour = new Date().toISOString().slice(0, 13);
const k = new Request($q.h + bucket + '/' + encodeURIComponent(ip) + '/' + hour);
const h = await caches.default.match(k), n = h ? (+(await h.text()) || 0) : 0;
if (n >= limit) return false;
ctx.waitUntil(caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': $q.i } })));
return true;
}
async function cached(key, fn, ttl, ctx) {
const ck = new Request($q.j + key);
const hit = await caches.default.match(ck);
if (hit) { const d = await hit.json(); d.cached = true; return d; }
const d = await fn();
if (d && !d.error && !(d.uk && d.uk.error) && !(d.es && (d.es.error || d.es.status === $q.e))) ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(d), { headers: { 'content-type': $q.k, 'cache-control': $q.c + ttl } })));
return d;
}
const FORMS = ['LIMITED', 'LTD', 'LLC', 'L L C', 'LLP', 'PLC', 'PJSC', 'P J S C', 'PSC', 'JSC', 'SAOG', 'SAOC', 'QPSC', 'QSC', 'INC', 'INCORPORATED', 'CORP', 'CORPORATION',
'CO', 'COMPANY', 'SA', 'S A', 'SL', 'S L', 'SLU', 'S L U', 'SAU', 'SAS', 'SARL', 'SRL', 'SPA', 'S P A', 'GMBH', 'AG', 'BV', 'NV', 'AS', 'AB', 'OY', 'KFT',
'DOO', 'D O O', 'EOOD', 'OOD', 'AD', 'EAD', 'AE', 'IKE', 'EPE', 'LDA', 'UNIPESSOAL', 'UNIPERSONAL', 'SLP', 'SLL', 'SOCIEDAD LIMITADA', 'SOCIEDAD ANONIMA', 'SA DE CV', 'S A DE C V',
'S DE RL DE CV', 'S DE R L DE C V', 'SAPI DE CV', 'S A P I DE C V', 'SDN BHD', 'SDN', 'BHD', 'BERHAD', 'PTE', 'PTY', 'PTE LTD', 'PTY LTD', 'TBK', 'PCL',
'PUBLIC COMPANY', 'JOINT STOCK COMPANY', 'ANONIM SIRKETI', 'A S', 'LTD STI', 'LIMITED SIRKETI', 'FZE', 'FZCO', 'FZ LLC', 'FZ', 'DMCC',
'HOLDING COMPANY', 'KK', 'KABUSHIKI KAISHA', 'CO LTD', 'COMPANY LIMITED', 'PRIVATE', 'PVT', 'SE', 'SPRL', 'CV', 'DE CV', 'L P', 'LP', 'PC', 'P C'];
const FORM_RE = new RegExp('(?:\\s(?:' + [...new Set(FORMS)].sort((a, b) => b.length - a.length).map(f => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + '))+$');
export function norm(s) {
let t = String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/&/g, ' AND ').replace(/'/g, '');
t = ' ' + t.replace(/[^A-Z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
t = t.replace(/^ (?:PT|THE|CV) /, ' ');
let prev = null;
while (prev !== t) { prev = t; t = t.replace(FORM_RE, ''); }
return t.trim();
}
const FORM_TYPED = /(\b(limited|ltd\.?|plc|llp|llc|l\.l\.c\.|inc\.?|corp\.?|corporation|gmbh|s\.?a\.?u?|s\.?l\.?u?|sociedad limitada( unipersonal)?|sociedad an[oó]nima( unipersonal)?|b\.?v\.?|pty\.? ltd\.?|sdn\.? bhd\.?|co\.?,? ltd\.?|company limited|pcl|pjsc|fze|fzco|fz-llc|dmcc|lda)\.?\s*$)|^pt\.?\s+\S/i;
export function validName(raw) {
const s = String(raw || '').replace(/\s+/g, ' ').trim();
if (s.length < 5 || s.length > 140) return null;
if (!FORM_TYPED.test(s)) return null;
if (!norm(s)) return null;
return s;
}
async function gazetteLookup(name, retry) {
const want = norm(name);
const phrase = retry ? name.replace(/"/g, '') : name.replace(/"/g, '').replace(/[\s,]+(?:limited|ltd\.?|plc|llp|public limited company)\.?\s*$/i, '').trim();
const url = GZ + $q.l + encodeURIComponent('"' + phrase + '"') + $q.m;
const r = await fetch(url, { headers: { 'user-agent': $t.UA, accept: $q.n }, signal: AbortSignal.timeout(25000) });
if (!r.ok) throw new Error($q.o + r.status);
const x = await r.text(), notices = [];
let personal = 0, other = 0;
for (const m of x.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
const e = m[1];
const code = (e.match(/<f:notice-code>(\d+)<\/f:notice-code>/) || [])[1] || '';
if (!code.startsWith('24')) { if (code.startsWith('25')) personal++; continue; }
const title = unx((e.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '').trim();
const body = unx(((e.match(/<content[^>]*>([\s\S]*?)<\/content>/) || [])[1] || '').replace(/<[^>]+>/g, ''));
const cat = unx((e.match(/<category term="([^"]+)"/) || [])[1] || '');
const nm = body.match(/Name of Company:\s*([^.…]+?(?:LIMITED|LTD|PLC|LLP))/i);
const exact = norm(title) === want || (nm && norm(nm[1]) === want) || norm(body.split('…')[0]) === want;
if (!exact) { other++; continue; }
const link = (e.match(/<link href="(https:\/\/www\.thegazette\.co\.uk\/notice\/[^"/]+)"\/>/) || [])[1] || null;
notices.push({ date: ((e.match(/<published>([^<]{10})/) || [])[1] || ''), type: cat || title, notice_code: code, url: link });
}
if (!notices.length && /rel="next"/.test(x) && phrase !== name && !retry) return gazetteLookup(name, true);
return {
source: $t.k1, searched: url.replace(/&results-page-size=100$/, ''),
notices: notices.slice(0, 50), exact_notices: notices.length, other_corporate_notices_mentioning_the_words: other,
more_results: /rel="next"/.test(x), licence: $t.k2,
search_page: GZ + $q.p + encodeURIComponent('"' + phrase + '"')
};
}
async function hkey(base) { return (await sha($q.q + base)).slice(0, 16); }
async function bormeLookup(env, name) {
const idx = await load(env, $q.r, 600000);
if (!idx || !idx.h) return { source: $q.s, status: $q.e, note: $t.k3 };
const k = await hkey(norm(name)), rows = idx.h[k] || [];
return {
source: $t.k4, index_from: idx.from, index_to: idx.to, days_indexed: (idx.days || []).length,
acts: rows.map(r => ({ borme_date: r[0], borme_id: r[1], procedure: r[2], resolution_date: r[3], act: r[4], final: r[5], legal_form: r[6] || null,
url: /^BORME-A-\d{4}-\d+-\d+$/.test(r[1]) ? $t.k5 + r[1] : null })),
licence: $t.k6,
by_hand: $t.k7
};
}
async function insolvency(req, u, env, ctx) {
const name = validName(u.searchParams.get('name'));
if (!name) return out({ error: $s.k0 }, 400, 0);
const base = norm(name);
const ck = $q.t + encodeURIComponent(base);
const hit = await caches.default.match(new Request($q.j + ck));
if (!hit && !(await rateOk(req, ctx, 'ins', 20))) return out({ error: $t.k8 }, 429, 0);
const d = await cached(ck, async () => {
const [uk, es] = await Promise.all([
gazetteLookup(name).catch(e => ({ source: $q.u, error: $q.v, detail: String(e && e.message || e).slice(0, 120) })),
bormeLookup(env, name).catch(e => ({ source: $q.s, error: $q.w }))]);
return { query: name, normalised: base, fetched_at: new Date().toISOString(), uk, es,
rule: $s.k1,
not_covered: $s.k2 };
}, 86400, ctx);
if (d.uk && d.uk.error) d.partial = true;
d.query = name;
return out(d, 200, 0);
}
async function probe(url) {
try {
const r = await fetch(url, { headers: { 'user-agent': $t.k9 }, redirect: $q.x, signal: AbortSignal.timeout(10000) });
const t = (await r.text()).slice(0, 200000);
const links = [...new Set([...t.matchAll(/href="([^"]*(?:\.csv|download|resource)[^"]*)"/gi)].map(m => m[1]))].slice(0, 20);
return { http: r.status, status: r.ok && !/access denied|just a moment|captcha required/i.test(t.slice(0, 4000)) ? $q.y : $q.z, links };
} catch (e) { return { status: $q.v, detail: String(e && e.message || e).slice(0, 80) }; }
}
async function agentSources(env, ctx, fresh) {
const ck = new Request($t.k10);
if (!fresh) { const c = await caches.default.match(ck); if (c) return out(await c.json(), 200, 600); }
const res = await Promise.all($t.o_AGENT_SOURCES.map(async s => {
const p = await probe(s.probe);
const o = { id: s.id, market: s.market, name: s.name, url: s.url, terms: s.terms, status: p.status, http: p.http || null, probed_at: new Date().toISOString() };
if (s.id === $q.A) o.download_links = p.links;
if (s.env) o.key = env[s.env] ? $q.B : $q.C;
return o;
}));
const d = { sources: res, note: $s.k3 };
ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(d), { headers: { 'content-type': $q.k, 'cache-control': $q.D } })));
return out(d, 200, 600);
}
const DP = 'https://api.dubaipulse.gov.ae';
async function dpToken(env) {
const r = await fetch(DP + $t.k11, { method: 'POST', headers: { 'content-type': $q.E },
body: $q.F + encodeURIComponent(env.DUBAI_PULSE_CLIENT_ID) + $q.G + encodeURIComponent(env.DUBAI_PULSE_CLIENT_SECRET), signal: AbortSignal.timeout(10000) });
if (!r.ok) throw new Error($q.H + r.status);
return (await r.json()).access_token;
}
async function dpQuery(env, dataset, filter) {
const t = await dpToken(env);
const r = await fetch(DP + $q.I + dataset + $q.J + encodeURIComponent(filter) + $q.K, { headers: { authorization: $q.L + t }, signal: AbortSignal.timeout(15000) });
if (!r.ok) throw new Error(dataset + $q.M + r.status);
const d = await r.json(), rows = Array.isArray(d) ? d : (d.results || d.data || d.result || []);
return rows.slice(0, 10).map(x => { const o = {}; for (const k in $t.o_DP_KEEP) if (x[k] != null && x[k] !== '') o[$t.o_DP_KEEP[k]] = String(x[k]).slice(0, 120); return o; });
}
async function agent(req, u, env, ctx) {
const brn = (u.searchParams.get('brn') || '').replace(/\D/g, '').slice(0, 10);
const office = (u.searchParams.get($q.N) || '').replace(/[^\p{L}\p{N} &.'-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
if (!brn && office.length < 3) return out({ error: $t.k12 }, 400, 0);
const query = brn ? { brn } : { office };
if (!env.DUBAI_PULSE_CLIENT_ID || !env.DUBAI_PULSE_CLIENT_SECRET) return out({ query, status: $q.O,
note: $s.k4,
by_hand: $t.o_BY_HAND }, 200, 0);
try {
const d = await cached($q.P + (brn ? 'b' + brn : 'o' + encodeURIComponent(office.toLowerCase())), async () => {
const results = brn ? await dpQuery(env, $q.Q, $q.R + brn + "'")
: await dpQuery(env, $q.S, $q.T + office.replace(/'/g, '') + "%'");
return { query, status: 'live', results, dataset_date: new Date().toISOString().slice(0, 10), source: $t.k13 + (brn ? $q.U : $q.V) + ').', licence: $q.W };
}, 86400, ctx);
return out(d, 200, 0);
} catch (e) {
return out({ query, status: $q.O, note: $t.k14 + String(e && e.message || e).slice(0, 60) + $q.X, by_hand: $t.o_BY_HAND }, 200, 0);
}
}
export async function handle(req, u, env, ctx) {
if (req.method === $q.Y) return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET', 'access-control-max-age': '86400' } });
if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: $q.Z }, 405, 0);
const p = u.pathname.replace(/\/+$/, '');
try {
if (p === $q.aa) return out({ module: $t.k15,
endpoints: [$q.ab, $q.ac, $q.ad, $q.ae, $t.k16, $q.af, $q.ag],
pages: [$q.ah, $q.ai, $q.aj] }, 200, 3600);
if (p === $q.ab) {
const d = await load(env, $q.ak); if (!d) return out(STARTING($q.ak), 200, 60);
if (u.searchParams.get('full') === '1') return out(d);
const { projects, ...rest } = d;
return out({ ...rest, project_ids: Object.keys(projects || {}).length });
}
let m = p.match(/^\/api\/x\/w\/graph-global\/([A-Za-z]{2,5}-\d{3,4})$/);
if (m) {
const d = await load(env, $q.ak); if (!d) return out(STARTING($q.ak), 200, 60);
const id = m[1].toUpperCase(), x = (d.projects || {})[id];
if (!x) return out({ id, error: $q.al }, 404, 300);
return out({ id, updated: d.updated, source: d.source.name, licence: d.source.licence, ...x });
}
if (p === $q.ad) {
const d = await load(env, $q.am); if (!d) return out(STARTING($q.am), 200, 60);
return out(d);
}
m = p.match(/^\/api\/x\/w\/insolvency\/watch\/([A-Za-z]{2,5}-\d{3,4})$/);
if (m) {
const d = await load(env, $q.am); if (!d) return out(STARTING($q.am), 200, 60);
const id = m[1].toUpperCase(), x = (d.projects || {})[id];
if (!x) return out({ id, covered: false, note: $t.k17 }, 404, 300);
return out({ id, updated: d.updated, ...x });
}
if (p === $q.an) return insolvency(req, u, env, ctx);
if (p === $q.af) return agentSources(env, ctx, u.searchParams.get('fresh') === '1' && await rateOk(req, ctx, 'src', 5));
if (p === $q.ao) {
if (!(await rateOk(req, ctx, 'agent', 30))) return out({ error: $t.k18 }, 429, 0);
return agent(req, u, env, ctx);
}
} catch (e) { return out({ error: $q.ap }, 500, 0); }
return out({ error: $q.aq, see: $q.ar }, 404, 60);
}
