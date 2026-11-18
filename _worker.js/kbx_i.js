// Feature module i for kolaboro.com (see kbx.js): two-sided features.
//
// Developer reply portal (/developers/reply/)
//   GET  /api/x/i/status                      what is live: {reply:{ready}, room:{ready, storage}}
//   GET  /api/x/i/dns?domain=&token=          live DNS TXT check (Cloudflare and Google DNS-over-HTTPS) for
//                                             "kolaboro-verify=<token>" on the domain or on _kolaboro.<domain>
//   GET  /api/x/i/verify?id=&domain=&token=   both ownership proofs at once (DNS TXT as above, or <meta name="kolaboro-verify"
//                                             content="<token>"> on the domain's homepage) plus whether the domain is the
//                                             project's official domain as published on its named page (batch 9, b9b)
//   POST /api/x/i/reply                       submit a reply: re-checks DNS or the meta tag, then stores it for human moderation
//   GET  /api/x/i/replies[?id=XX-000]         approved replies only (moderated in /admin)
// The token is random (made in the browser), so the public TXT record never names a Kolaboro project: nothing public links a
// domain to an anonymous project before a moderator approves the reply. Documents never reach us: the browser hashes them
// (SHA-256) and only the fingerprint, size and type are sent.
//
// Encrypted deal room (/room/)
//   POST /api/x/i/room                        create {id, wtok_hash}
//   GET  /api/x/i/room/{id}?after=n           ciphertext envelopes after seq n
//   POST /api/x/i/room/{id}                   append {wtok, seq, env}   env = "1.<iv b64url>.<ciphertext b64url>"
//   POST /api/x/i/room/{id}/delete            delete the room {wtok}
// The server never sees the key (it lives in the URL fragment). It only accepts envelopes that are base64url ciphertext.
//
// Storage: Supabase SQL in scratchpad m10/i.sql. Until it is applied every write answers 503 {error:'not_ready'} and the pages
// show "opening soon" (replies) or local-only mode (room).
import { rpc, sha, WKEY } from './kolaboro.js';
import { officialDomains } from './kbx_named.js';

export const PATHS = /^\/api\/x\/i\//;

const H = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' };
function out(o, s = 200, maxAge = 0) {
  return new Response(JSON.stringify(o), { status: s, headers: { ...H, 'cache-control': maxAge ? 'public, max-age=' + maxAge : 'no-store' } });
}

let READY = { t: 0, v: null };
async function ready() {
  if (READY.v && Date.now() - READY.t < 60000) return READY.v;
  let v;
  try { const d = await rpc('kolaboro_i_ready', {}); v = { reply: !!(d && d.reply), room: !!(d && d.room), published: (d && d.replies_published) || 0 }; }
  catch (e) { v = { reply: false, room: false, published: 0, why: /db 404/.test(String(e)) ? 'sql_not_applied' : 'db_unreachable' }; }
  READY = { t: Date.now(), v }; return v;
}

// Approximate per-IP hourly limits (Cache API is per data centre, so this is a brake, not an exact quota).
async function limited(req, ctx, kind, max) {
  const ip = req.headers.get('cf-connecting-ip') || 'x', hour = new Date().toISOString().slice(0, 13);
  const k = new Request('https://kolaboro.com/__rl_i/' + kind + '/' + encodeURIComponent(ip) + '/' + hour);
  const hit = await caches.default.match(k), n = hit ? (+(await hit.text()) || 0) : 0;
  if (n >= max) return true;
  ctx.waitUntil(caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=3600' } })));
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
  const url = resolver === 'cloudflare' ? 'https://cloudflare-dns.com/dns-query?type=TXT&name=' + encodeURIComponent(name)
    : 'https://dns.google/resolve?type=TXT&name=' + encodeURIComponent(name);
  const ac = new AbortController(), to = setTimeout(() => ac.abort(), 4000);
  try {
    const r = await fetch(url, { headers: { accept: 'application/dns-json' }, signal: ac.signal });
    if (!r.ok) return { ok: false, records: [] };
    const d = await r.json();
    const records = (d.Answer || []).filter(a => a.type === 16).map(a => String(a.data || '').replace(/"\s+"/g, '').replace(/^"|"$/g, ''));
    return { ok: true, status: d.Status, records };
  } catch (e) { return { ok: false, records: [] }; } finally { clearTimeout(to); }
}

export async function dnsCheck(domain, token, opt) {   // opt.want: test hook used only by the local test harness
  const want = (opt && opt.want) || 'kolaboro-verify=' + token, names = [domain, '_kolaboro.' + domain];
  const res = await Promise.all(['cloudflare', 'google'].flatMap(r => names.map(async n => ({ resolver: r, name: n, ...(await txt(r, n)) }))));
  const hits = res.filter(x => x.records.some(t => t.trim() === want));
  return {
    domain, record: want, found: hits.length > 0, where: hits.length ? hits[0].name : null,
    resolvers: ['cloudflare', 'google'].map(r => ({ resolver: r, answered: res.some(x => x.resolver === r && x.ok), found: hits.some(x => x.resolver === r) })),
    checked_at: new Date().toISOString(),
  };
}

// Homepage meta tag: <meta name="kolaboro-verify" content="<token>"> on https://<domain>/ (or www.). Redirects are followed only
// within the same domain (so a parked page or a redirect elsewhere never counts); at most 512 KB of HTML is read.
export function metaFound(html, token) {
  const re = /<meta\b[^>]*>/gi; let m;
  while ((m = re.exec(html))) {
    const t = m[0], n = (t.match(/\bname\s*=\s*["']?([^"'\s>]+)/i) || [])[1], c = (t.match(/\bcontent\s*=\s*["']?([^"'\s>]+)/i) || [])[1];
    if (n && n.toLowerCase() === 'kolaboro-verify' && c && c.trim().toLowerCase() === token) return true;
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
  for (const start of ['https://' + domain + '/', 'https://www.' + domain + '/']) {
    let url = start, status = 0, err = null;
    try {
      for (let hop = 0; hop < 4; hop++) {
        const r = await fetch(url, { redirect: 'manual', headers: { 'user-agent': 'KolaboroVerify/1.0 (+https://kolaboro.com/developers/reply/)', accept: 'text/html' }, signal: AbortSignal.timeout(5000) });
        status = r.status;
        if (status >= 300 && status < 400 && r.headers.get('location')) {
          const next = new URL(r.headers.get('location'), url);
          if (next.protocol !== 'https:' || !sameSite(next.hostname, domain)) { err = 'redirect_offsite'; break; }
          url = next.href; continue;
        }
        if (r.ok) {
          const html = await readCapped(r, 524288);
          if ((opt && opt.found ? opt.found(html) : metaFound(html, token))) return { found: true, url, status, tries: tries.concat([{ url, status }]) };
        }
        break;
      }
    } catch (e) { err = 'unreachable'; }
    tries.push({ url, status, err });
  }
  return { found: false, url: null, tries, tag: '<meta name="kolaboro-verify" content="' + token + '">' };
}
// Is `domain` the project's official domain? The page we track for the project (and its documents page) must live on that domain
// or one of its subdomains, and must not be a property portal. Two-label public suffixes (co.id, com.au ...) never match alone.
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
  let b; try { b = await req.json(); } catch (e) { return out({ error: 'bad_request' }, 400); }
  const id = String(b.id || '').trim().toUpperCase(), domain = cleanDomain(b.domain), token = String(b.token || '').toLowerCase();
  if (!/^[A-Z]{2,5}-\d{3,4}$/.test(id)) return out({ error: 'project', message: 'Use the project id shown on Kolaboro, for example BALI-014.' }, 400);
  if (!domain || !/^[0-9a-f]{32}$/.test(token)) return out({ error: 'domain', message: 'Enter the project\'s own domain and create the DNS record first.' }, 400);
  const company = String(b.company || '').trim(), name = String(b.name || '').trim(), text = String(b.reply || '').trim(), email = String(b.email || '').trim();
  if (company.length < 2 || company.length > 160 || name.length < 2 || name.length > 120) return out({ error: 'input', message: 'Please give the company and your name and role.' }, 400);
  if (text.length < 20 || text.length > 3000) return out({ error: 'input', message: 'The reply must be 20 to 3,000 characters.' }, 400);
  if (email && (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 160)) return out({ error: 'input', message: 'That email does not look valid.' }, 400);
  if (/\b\d{10,}\b/.test(text)) return out({ error: 'input', message: 'Please remove long numbers such as bank account numbers.' }, 400);
  if (!b.ok) return out({ error: 'input', message: 'Please confirm you can speak for the developer.' }, 400);
  const docs = (Array.isArray(b.docs) ? b.docs : []).slice(0, 12).map(d => ({
    kind: KINDS.includes(d && d.kind) ? d.kind : 'other', name: String((d && d.name) || '').slice(0, 120),
    sha256: String((d && d.sha256) || '').toLowerCase(), bytes: Math.max(0, Math.min(2e9, +(d && d.bytes) || 0)), type: String((d && d.type) || '').slice(0, 80),
    link: /^https:\/\/[^\s<>"]{4,400}$/.test(String((d && d.link) || '')) ? d.link : null,
  }));
  if (docs.some(d => !/^[0-9a-f]{64}$/.test(d.sha256))) return out({ error: 'docs', message: 'A document fingerprint is malformed. Please add the file again.' }, 400);
  const st = await ready();
  if (!st.reply) return out({ error: 'not_ready', message: 'The verified reply portal is opening soon. Until then please email hello@kolaboro.com with the project id.' }, 503);
  if (await limited(req, ctx, 'reply', 6)) return out({ error: 'rate', message: 'Too many replies from this network in the last hour.' }, 429);
  const [dns, meta, off] = await Promise.all([dnsCheck(domain, token), metaCheck(domain, token), official(id, domain, env)]);
  if (!dns.found && !meta.found) return out({ error: 'dns', message: 'We could not see the TXT record or the homepage meta tag yet. DNS changes can take a few minutes to an hour; a meta tag shows as soon as your homepage is published.', dns, meta }, 409);
  const method = dns.found ? 'dns' : 'meta';
  const ipHash = await sha('kbx-i:' + (req.headers.get('cf-connecting-ip') || '') + ':' + new Date().toISOString().slice(0, 10));
  try {
    const args = {
      p_project: id, p_domain: domain, p_token: token, p_dns_seen: dns.found, p_company: company, p_name: name, p_email: email || null,
      p_topic: TOPICS.includes(b.topic) ? b.topic : 'Something else', p_reply: text, p_docs: docs, p_publish_company: !!b.publish_company, p_ip_hash: ipHash,
    };
    let d;
    try { d = await rpc('kolaboro_devreply_submit2', Object.assign({ p_wkey: WKEY, p_method: method, p_official: off.match }, args)); }
    catch (e) { if (!/db 404/.test(String(e))) throw e; d = await rpc('kolaboro_devreply_submit', args); }   // before the b9b migration
    if (!d || !d.ok) return out({ error: (d && d.error) || 'db', message: d && d.error === 'too_many' ? 'This domain already sent 5 replies today.' : 'Could not save. Please email hello@kolaboro.com.' }, d && d.error === 'too_many' ? 429 : 400);
    return out({ ok: true, ref: d.ref, method, official_domain: off.match, dns: { found: dns.found, where: dns.where, checked_at: dns.checked_at }, meta: { found: meta.found, url: meta.url } });
  } catch (e) { return out({ error: 'db', message: 'Could not save. Please email hello@kolaboro.com.' }, 503); }
}

// ---------- Deal room ----------
const ROOM_ID = /^[A-Za-z0-9_-]{43}$/;
export function envOk(env) {
  if (typeof env !== 'string' || env.length < 40 || env.length > 400000) return false;
  const m = env.match(/^1\.([A-Za-z0-9_-]{16})\.([A-Za-z0-9_-]+)$/);
  return !!m && m[2].length >= 22;   // at least the 16-byte GCM tag plus a little payload
}

async function room(req, u, ctx) {
  const st = await ready();
  const p = u.pathname.replace(/\/+$/, '').split('/').slice(4);   // ['room', id?, 'delete'?]
  if (req.method === 'POST' && p.length === 1) {
    let b; try { b = await req.json(); } catch (e) { return out({ error: 'bad_request' }, 400); }
    if (!ROOM_ID.test(String(b.id || '')) || !/^[0-9a-f]{64}$/.test(String(b.wtok_hash || ''))) return out({ error: 'input' }, 400);
    if (!st.room) return out({ error: 'not_ready', mode: 'local' }, 503);
    if (await limited(req, ctx, 'roomnew', 20)) return out({ error: 'rate' }, 429);
    try { return out(await rpc('kolaboro_room_create', { p_id: b.id, p_wtok_hash: b.wtok_hash })); } catch (e) { return out({ error: 'db' }, 503); }
  }
  const id = p[1];
  if (!ROOM_ID.test(id || '')) return out({ error: 'not found' }, 404);
  if (req.method === 'POST' && p.length === 2) {   // reject non-ciphertext before anything else, even in local-only mode
    let b; try { b = await req.clone().json(); } catch (e) { return out({ error: 'bad_request' }, 400); }
    if (!envOk(b && b.env)) return out({ error: 'not_ciphertext', message: 'The server accepts only encrypted envelopes.' }, 400);
  }
  if (!st.room) return out({ error: 'not_ready', mode: 'local' }, 503);
  if (req.method === 'GET' && p.length === 2) {
    if (await limited(req, ctx, 'roomget', 1500)) return out({ error: 'rate' }, 429);
    const after = Math.max(0, Math.min(5000, parseInt(u.searchParams.get('after') || '0', 10) || 0));
    try { return out(await rpc('kolaboro_room_get', { p_id: id, p_after: after })); } catch (e) { return out({ error: 'db' }, 503); }
  }
  if (req.method === 'POST') {
    let b; try { b = await req.json(); } catch (e) { return out({ error: 'bad_request' }, 400); }
    const wtok = String(b.wtok || '');
    if (!/^[A-Za-z0-9_-]{20,100}$/.test(wtok)) return out({ error: 'auth' }, 403);
    if (p.length === 3 && p[2] === 'delete') { try { return out(await rpc('kolaboro_room_delete', { p_id: id, p_wtok: wtok })); } catch (e) { return out({ error: 'db' }, 503); } }
    if (p.length !== 2) return out({ error: 'not found' }, 404);
    if (!envOk(b.env)) return out({ error: 'not_ciphertext', message: 'The server accepts only encrypted envelopes.' }, 400);
    const seq = +b.seq; if (!Number.isInteger(seq) || seq < 1 || seq > 2000) return out({ error: 'seq' }, 400);
    if (await limited(req, ctx, 'roomput', 600)) return out({ error: 'rate' }, 429);
    try { const d = await rpc('kolaboro_room_append', { p_id: id, p_wtok: wtok, p_seq: seq, p_env: b.env }); return out(d, d && d.ok ? 200 : d && d.error === 'seq' ? 409 : 400); }
    catch (e) { return out({ error: 'db' }, 503); }
  }
  return out({ error: 'method not allowed' }, 405);
}

export async function handle(req, u, env, ctx) {
  const path = u.pathname.replace(/\/+$/, '');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST', 'access-control-allow-headers': 'content-type' } });
  if (path === '/api/x/i/status') {
    const st = await ready();
    return out({ reply: { ready: st.reply, published: st.published, ownership: 'dns_txt_or_meta', email_path: false, file_storage: false },
      room: { ready: st.room, storage: st.room ? 'sql' : 'local_only' }, why: st.why || null }, 200, 30);
  }
  if (path === '/api/x/i/dns' && req.method === 'GET') {
    const domain = cleanDomain(u.searchParams.get('domain')), token = String(u.searchParams.get('token') || '').toLowerCase();
    if (!domain) return out({ error: 'domain' }, 400);
    if (!/^[0-9a-f]{32}$/.test(token)) return out({ error: 'token' }, 400);
    if (await limited(req, ctx, 'dns', 40)) return out({ error: 'rate' }, 429);
    return out(await dnsCheck(domain, token));
  }
  if (path === '/api/x/i/verify' && req.method === 'GET') {
    const id = String(u.searchParams.get('id') || '').trim().toUpperCase(), domain = cleanDomain(u.searchParams.get('domain')), token = String(u.searchParams.get('token') || '').toLowerCase();
    if (!/^[A-Z]{2,5}-\d{3,4}$/.test(id)) return out({ error: 'project' }, 400);
    if (!domain) return out({ error: 'domain' }, 400);
    if (!/^[0-9a-f]{32}$/.test(token)) return out({ error: 'token' }, 400);
    if (await limited(req, ctx, 'dns', 40)) return out({ error: 'rate' }, 429);
    const [dns, meta, off] = await Promise.all([dnsCheck(domain, token), metaCheck(domain, token), official(id, domain, env)]);
    return out({ project: id, domain, verified: dns.found || meta.found, method: dns.found ? 'dns' : meta.found ? 'meta' : null,
      official: { named_page: off.named, domains: off.domains, match: off.match, note: off.named ? (off.match ? 'This domain is the domain of the page we track for this project.' : 'This domain is not the domain of the page we track for this project, so a published reply would not get the "controls the official domain" badge. A moderator can still review it.') : 'This project has no public named page.' },
      dns, meta, checked_at: new Date().toISOString() });
  }
  if (path === '/api/x/i/reply' && req.method === 'POST') return reply(req, env, ctx);
  if (path === '/api/x/i/replies' && req.method === 'GET') {
    const id = String(u.searchParams.get('id') || '').toUpperCase();
    if (id && !/^[A-Z]{2,5}-\d{3,4}$/.test(id)) return out({ error: 'project' }, 400);
    const st = await ready();
    if (!st.reply) return out({ ready: false, replies: [] }, 200, 60);
    try { return out({ ready: true, replies: (await rpc('kolaboro_devreply_public', { p_id: id || null })) || [] }, 200, 60); }
    catch (e) { return out({ ready: true, replies: [], error: 'db' }, 503); }
  }
  if (path === '/api/x/i/room' || path.startsWith('/api/x/i/room/')) return room(req, u, ctx);
  return out({ error: 'not found', endpoints: ['/api/x/i/status', '/api/x/i/dns', '/api/x/i/verify', '/api/x/i/reply', '/api/x/i/replies', '/api/x/i/room'] }, 404);
}
