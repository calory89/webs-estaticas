// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_i__q, $s = TB.kbx_i__s, $t = TB.kbx_i__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { rpc, sha, WKEY } from './kolaboro.js';
import { officialDomains } from './kbx_named.js';
import { TB } from './kbx_strings.js';
export const PATHS = /^\/api\/x\/i\//;
const H = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' };
function out(o, s = 200, maxAge = 0) {
  return new Response(JSON.stringify(o), { status: s, headers: { ...H, 'cache-control': maxAge ? $q.a + maxAge : $q.b } });
}
let READY = { t: 0, v: null };
async function ready() {
if (READY.v && Date.now() - READY.t < 60000) return READY.v;
let v;
try { const d = await rpc($q.c, {}); v = { reply: !!(d && d.reply), room: !!(d && d.room), published: (d && d.replies_published) || 0 }; }
catch (e) { v = { reply: false, room: false, published: 0, why: /db 404/.test(String(e)) ? $q.d : $q.e }; }
READY = { t: Date.now(), v }; return v;
}
async function limited(req, ctx, kind, max) {
const ip = req.headers.get($q.f) || 'x', hour = new Date().toISOString().slice(0, 13);
const k = new Request($q.g + kind + '/' + encodeURIComponent(ip) + '/' + hour);
const hit = await caches.default.match(k), n = hit ? (+(await hit.text()) || 0) : 0;
if (n >= max) return true;
ctx.waitUntil(caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': $q.h } })));
return false;
}
export function cleanDomain(raw) {
let h = String(raw || '').trim().toLowerCase();
h = h.replace(/^[a-z]+:\/\//, '').split(/[\/?#:]/)[0].replace(/\.$/, '').replace(/^www\./, '');
if (h.length < 4 || h.length > 253 || !/^[a-z0-9.-]+$/.test(h) || !h.includes('.')) return null;
if (h.split('.').some(l => !l || l.length > 63 || l.startsWith('-') || l.endsWith('-'))) return null;
if (/^[\d.]+$/.test(h) || /(^|\.)(localhost|local|internal|arpa|kolaboro\.com)$/.test(h)) return null;
return h;
}
async function txt(resolver, name) {
  const url = resolver === $q.i ? $q.j + encodeURIComponent(name)
    : $q.k + encodeURIComponent(name);
  const ac = new AbortController(), to = setTimeout(() => ac.abort(), 4000);
  try {
    const r = await fetch(url, { headers: { accept: $q.l }, signal: ac.signal });
    if (!r.ok) return { ok: false, records: [] };
    const d = await r.json();
    const records = (d.Answer || []).filter(a => a.type === 16).map(a => String(a.data || '').replace(/"\s+"/g, '').replace(/^"|"$/g, ''));
    return { ok: true, status: d.Status, records };
  } catch (e) { return { ok: false, records: [] }; } finally { clearTimeout(to); }
}
export async function dnsCheck(domain, token, opt) {
const want = (opt && opt.want) || $q.m + token, names = [domain, $q.n + domain];
const res = await Promise.all([$q.i, $q.o].flatMap(r => names.map(async n => ({ resolver: r, name: n, ...(await txt(r, n)) }))));
const hits = res.filter(x => x.records.some(t => t.trim() === want));
return {
domain, record: want, found: hits.length > 0, where: hits.length ? hits[0].name : null,
resolvers: [$q.i, $q.o].map(r => ({ resolver: r, answered: res.some(x => x.resolver === r && x.ok), found: hits.some(x => x.resolver === r) })),
checked_at: new Date().toISOString(),
};
}
export function metaFound(html, token) {
const re = /<meta\b[^>]*>/gi; let m;
while ((m = re.exec(html))) {
const t = m[0], n = (t.match(/\bname\s*=\s*["']?([^"'\s>]+)/i) || [])[1], c = (t.match(/\bcontent\s*=\s*["']?([^"'\s>]+)/i) || [])[1];
if (n && n.toLowerCase() === $q.p && c && c.trim().toLowerCase() === token) return true;
}
return false;
}
const sameSite = (h, d) => { h = String(h || '').toLowerCase().replace(/^www\./, ''); return h === d || h.endsWith('.' + d); };
async function readCapped(r, max) {
const rd = r.body && r.body.getReader(); if (!rd) return '';
const dec = new TextDecoder(); let out = '', n = 0;
while (n < max) { const { done, value } = await rd.read(); if (done) break; n += value.length; out += dec.decode(value, { stream: true }); }
try { rd.cancel(); } catch (e) {}
return out;
}
export async function metaCheck(domain, token, opt) {
const tries = [];
for (const start of [$q.q + domain + '/', $q.r + domain + '/']) {
let url = start, status = 0, err = null;
try {
for (let hop = 0; hop < 4; hop++) {
const r = await fetch(url, { redirect: $q.s, headers: { 'user-agent': $t.k0, accept: $q.t }, signal: AbortSignal.timeout(5000) });
status = r.status;
if (status >= 300 && status < 400 && r.headers.get($q.u)) {
const next = new URL(r.headers.get($q.u), url);
if (next.protocol !== $q.v || !sameSite(next.hostname, domain)) { err = $q.w; break; }
url = next.href; continue;
}
if (r.ok) {
const html = await readCapped(r, 524288);
if ((opt && opt.found ? opt.found(html) : metaFound(html, token))) return { found: true, url, status, tries: tries.concat([{ url, status }]) };
}
break;
}
} catch (e) { err = $q.x; }
tries.push({ url, status, err });
}
return { found: false, url: null, tries, tag: $t.k1 + token + '">' };
}
const SLD = new Set(['co', 'com', 'net', 'org', 'gov', 'ac', 'or', 'web', 'biz', 'my', 'ne', 'go', 'edu', 'in', 'id', 'sch', 'ltd', 'plc']);
export function domainMatch(domain, hosts) {
const L = domain.split('.');
if (L.length < 2 || (L.length === 2 && SLD.has(L[0]) && L[1].length === 2)) return false;
return hosts.some(h => sameSite(h, domain));
}
async function official(id, domain, env) {
let o = { named: false, domains: [] };
try { o = await officialDomains(env, id); } catch (e) {}
return { named: o.named, domains: o.domains, match: !!(o.named && domain && domainMatch(domain, o.domains)) };
}
const KINDS = ['licence', 'permit', 'land_title', 'escrow', 'progress', 'company', 'other'];
const TOPICS = ['Permit or licence number', 'Deposit protection (escrow, guarantee)', 'Construction progress', 'Plans and specification', 'Track record',
'Returns or rental language', 'A contradicted claim', 'A problem reported in public sources', 'Completion date or delay', 'Something else'];
async function reply(req, env, ctx) {
  let b; try { b = await req.json(); } catch (e) { return out({ error: $q.y }, 400); }
  const id = String(b.id || '').trim().toUpperCase(), domain = cleanDomain(b.domain), token = String(b.token || '').toLowerCase();
  if (!/^[A-Z]{2,5}-\d{3,4}$/.test(id)) return out({ error: $q.z, message: $q.A }, 400);
  if (!domain || !/^[0-9a-f]{32}$/.test(token)) return out({ error: $q.B, message: $q.C }, 400);
  const company = String(b.company || '').trim(), name = String(b.name || '').trim(), text = String(b.reply || '').trim(), email = String(b.email || '').trim();
  if (company.length < 2 || company.length > 160 || name.length < 2 || name.length > 120) return out({ error: 'input', message: $q.D }, 400);
  if (text.length < 20 || text.length > 3000) return out({ error: 'input', message: $q.E }, 400);
  if (email && (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 160)) return out({ error: 'input', message: $q.F }, 400);
  if (/\b\d{10,}\b/.test(text)) return out({ error: 'input', message: $q.G }, 400);
  if (!b.ok) return out({ error: 'input', message: $q.H }, 400);
  const docs = (Array.isArray(b.docs) ? b.docs : []).slice(0, 12).map(d => ({
    kind: KINDS.includes(d && d.kind) ? d.kind : 'other', name: String((d && d.name) || '').slice(0, 120),
    sha256: String((d && d.sha256) || '').toLowerCase(), bytes: Math.max(0, Math.min(2e9, +(d && d.bytes) || 0)), type: String((d && d.type) || '').slice(0, 80),
    link: /^https:\/\/[^\s<>"]{4,400}$/.test(String((d && d.link) || '')) ? d.link : null,
  }));
  if (docs.some(d => !/^[0-9a-f]{64}$/.test(d.sha256))) return out({ error: 'docs', message: $q.I }, 400);
  const st = await ready();
  if (!st.reply) return out({ error: $q.J, message: $q.K }, 503);
  if (await limited(req, ctx, 'reply', 6)) return out({ error: 'rate', message: $q.L }, 429);
  const [dns, meta, off] = await Promise.all([dnsCheck(domain, token), metaCheck(domain, token), official(id, domain, env)]);
  if (!dns.found && !meta.found) return out({ error: 'dns', message: $q.M, dns, meta }, 409);
  const method = dns.found ? 'dns' : 'meta';
  const ipHash = await sha($q.N + (req.headers.get($q.f) || '') + ':' + new Date().toISOString().slice(0, 10));
  try {
    const args = {
      p_project: id, p_domain: domain, p_token: token, p_dns_seen: dns.found, p_company: company, p_name: name, p_email: email || null,
      p_topic: TOPICS.includes(b.topic) ? b.topic : $q.O, p_reply: text, p_docs: docs, p_publish_company: !!b.publish_company, p_ip_hash: ipHash,
    };
    let d;
    try { d = await rpc($q.P, Object.assign({ p_wkey: WKEY, p_method: method, p_official: off.match }, args)); }
    catch (e) { if (!/db 404/.test(String(e))) throw e; d = await rpc($q.Q, args); }   // before the b9b migration
    if (!d || !d.ok) return out({ error: (d && d.error) || 'db', message: d && d.error === $q.R ? $q.S : $q.T }, d && d.error === $q.R ? 429 : 400);
    return out({ ok: true, ref: d.ref, method, official_domain: off.match, dns: { found: dns.found, where: dns.where, checked_at: dns.checked_at }, meta: { found: meta.found, url: meta.url } });
  } catch (e) { return out({ error: 'db', message: $q.T }, 503); }
}
const ROOM_ID = /^[A-Za-z0-9_-]{43}$/;
export function envOk(env) {
if (typeof env !== $q.U || env.length < 40 || env.length > 400000) return false;
const m = env.match(/^1\.([A-Za-z0-9_-]{16})\.([A-Za-z0-9_-]+)$/);
return !!m && m[2].length >= 22;
}
async function room(req, u, ctx) {
const st = await ready();
const p = u.pathname.replace(/\/+$/, '').split('/').slice(4);
if (req.method === 'POST' && p.length === 1) {
let b; try { b = await req.json(); } catch (e) { return out({ error: $q.y }, 400); }
if (!ROOM_ID.test(String(b.id || '')) || !/^[0-9a-f]{64}$/.test(String(b.wtok_hash || ''))) return out({ error: 'input' }, 400);
if (!st.room) return out({ error: $q.J, mode: 'local' }, 503);
if (await limited(req, ctx, $q.V, 20)) return out({ error: 'rate' }, 429);
try { return out(await rpc($q.W, { p_id: b.id, p_wtok_hash: b.wtok_hash })); } catch (e) { return out({ error: 'db' }, 503); }
}
const id = p[1];
if (!ROOM_ID.test(id || '')) return out({ error: $q.X }, 404);
if (req.method === 'POST' && p.length === 2) {
let b; try { b = await req.clone().json(); } catch (e) { return out({ error: $q.y }, 400); }
if (!envOk(b && b.env)) return out({ error: $q.Y, message: $t.k2 }, 400);
}
if (!st.room) return out({ error: $q.J, mode: 'local' }, 503);
if (req.method === 'GET' && p.length === 2) {
if (await limited(req, ctx, $q.Z, 1500)) return out({ error: 'rate' }, 429);
const after = Math.max(0, Math.min(5000, parseInt(u.searchParams.get('after') || '0', 10) || 0));
try { return out(await rpc($q.aa, { p_id: id, p_after: after })); } catch (e) { return out({ error: 'db' }, 503); }
}
if (req.method === 'POST') {
let b; try { b = await req.json(); } catch (e) { return out({ error: $q.y }, 400); }
const wtok = String(b.wtok || '');
if (!/^[A-Za-z0-9_-]{20,100}$/.test(wtok)) return out({ error: 'auth' }, 403);
if (p.length === 3 && p[2] === $q.ab) { try { return out(await rpc($q.ac, { p_id: id, p_wtok: wtok })); } catch (e) { return out({ error: 'db' }, 503); } }
if (p.length !== 2) return out({ error: $q.X }, 404);
if (!envOk(b.env)) return out({ error: $q.Y, message: $t.k3 }, 400);
const seq = +b.seq; if (!Number.isInteger(seq) || seq < 1 || seq > 2000) return out({ error: 'seq' }, 400);
if (await limited(req, ctx, $q.ad, 600)) return out({ error: 'rate' }, 429);
try { const d = await rpc($q.ae, { p_id: id, p_wtok: wtok, p_seq: seq, p_env: b.env }); return out(d, d && d.ok ? 200 : d && d.error === 'seq' ? 409 : 400); }
catch (e) { return out({ error: 'db' }, 503); }
}
return out({ error: $q.af }, 405);
}
export async function handle(req, u, env, ctx) {
const path = u.pathname.replace(/\/+$/, '');
if (req.method === $q.ag) return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': $q.ah, 'access-control-allow-headers': $q.ai } });
if (path === $q.aj) {
const st = await ready();
return out({ reply: { ready: st.reply, published: st.published, ownership: $q.ak, email_path: false, file_storage: false },
room: { ready: st.room, storage: st.room ? 'sql' : $q.al }, why: st.why || null }, 200, 30);
}
if (path === $q.am && req.method === 'GET') {
const domain = cleanDomain(u.searchParams.get($q.B)), token = String(u.searchParams.get('token') || '').toLowerCase();
if (!domain) return out({ error: $q.B }, 400);
if (!/^[0-9a-f]{32}$/.test(token)) return out({ error: 'token' }, 400);
if (await limited(req, ctx, 'dns', 40)) return out({ error: 'rate' }, 429);
return out(await dnsCheck(domain, token));
}
if (path === $q.an && req.method === 'GET') {
const id = String(u.searchParams.get('id') || '').trim().toUpperCase(), domain = cleanDomain(u.searchParams.get($q.B)), token = String(u.searchParams.get('token') || '').toLowerCase();
if (!/^[A-Z]{2,5}-\d{3,4}$/.test(id)) return out({ error: $q.z }, 400);
if (!domain) return out({ error: $q.B }, 400);
if (!/^[0-9a-f]{32}$/.test(token)) return out({ error: 'token' }, 400);
if (await limited(req, ctx, 'dns', 40)) return out({ error: 'rate' }, 429);
const [dns, meta, off] = await Promise.all([dnsCheck(domain, token), metaCheck(domain, token), official(id, domain, env)]);
return out({ project: id, domain, verified: dns.found || meta.found, method: dns.found ? 'dns' : meta.found ? 'meta' : null,
official: { named_page: off.named, domains: off.domains, match: off.match, note: off.named ? (off.match ? $t.k4 : $s.k0) : $t.k5 },
dns, meta, checked_at: new Date().toISOString() });
}
if (path === $q.ao && req.method === 'POST') return reply(req, env, ctx);
if (path === $q.ap && req.method === 'GET') {
const id = String(u.searchParams.get('id') || '').toUpperCase();
if (id && !/^[A-Z]{2,5}-\d{3,4}$/.test(id)) return out({ error: $q.z }, 400);
const st = await ready();
if (!st.reply) return out({ ready: false, replies: [] }, 200, 60);
try { return out({ ready: true, replies: (await rpc($q.aq, { p_id: id || null })) || [] }, 200, 60); }
catch (e) { return out({ ready: true, replies: [], error: 'db' }, 503); }
}
if (path === $q.ar || path.startsWith($q.as)) return room(req, u, ctx);
return out({ error: $q.X, endpoints: [$q.aj, $q.am, $q.an, $q.ao, $q.ap, $q.ar] }, 404);
}
